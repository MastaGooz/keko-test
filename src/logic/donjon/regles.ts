/**
 * LES RÈGLES DU DONJON — un réducteur unique, pur.
 *
 * `appliquer(config, etat, action)` rend l'état suivant ; `avancer(config,
 * etat, t)` résout le temps écoulé (l'auto-tap, la fin des jours et des
 * saisons). *Les bots et le joueur passent par les mêmes actions*, et le jour
 * où l'état partagé vivra sur un serveur, c'est ce même réducteur qui y
 * tournera.
 *
 * **L'AUTO-TAP SE RÉSOUT PAR ÉVÉNEMENTS, PAS COUP PAR COUP.** Il frappe par
 * coups, tous ensemble, toutes les `auto.periode` depuis le début de la
 * saison. Entre deux actions, le DPS de chacun ne bouge pas (il ne change
 * qu'à l'achat) : on calcule donc directement le coup où l'ennemi tombe, et
 * le coup fatal va à l'un des joueurs, tiré au hasard seedé au prorata de son
 * DPS. Une semaine d'absence se résout en autant de pas que d'ennemis tués,
 * et le rattrapage est exact.
 */
import { createRng } from '../rng.ts'
import { JOUR, type CleAmelioration, type ConfigDonjon } from './config.ts'
import { ennemiDeLEtage } from './ennemi.ts'
import type { Action, EtatDonjon, Evenement, Joueur, SaisonArchivee } from './types.ts'

const HEURE = 3_600_000
/** On garde les N dernières saisons. */
const ARCHIVES_MAX = 20

// ---------------------------------------------------------------- les effets

export function degatsDeBaseDuTap(config: ConfigDonjon, j: Joueur): number {
  return config.tap.base + config.tap.parRang * j.ameliorations.tap
}

/** Le DPS de l'auto, base comprise : il frappe dès le rang 0. */
export function dpsDe(config: ConfigDonjon, j: Joueur): number {
  return config.auto.base + config.auto.parRang * j.ameliorations.auto
}

export function chanceCritDe(config: ConfigDonjon, j: Joueur): number {
  const c = config.crit
  return Math.min(c.chanceMax, c.chanceBase + c.chanceParRang * j.ameliorations.chanceCrit)
}

export function multCritDe(config: ConfigDonjon, j: Joueur): number {
  return config.crit.multBase + config.crit.multParRang * j.ameliorations.multCrit
}

/** L'auto-tap ne tire pas ses critiques un à un : il frappe à leur espérance. */
export function facteurCritMoyen(config: ConfigDonjon, j: Joueur): number {
  return 1 + chanceCritDe(config, j) * (multCritDe(config, j) - 1)
}

/** Les dégâts par seconde de l'auto-tap, critiques compris. */
export function dpsEffectifDe(config: ConfigDonjon, j: Joueur): number {
  return dpsDe(config, j) * facteurCritMoyen(config, j)
}

/** Un coup d'auto (tous les `auto.periode`), critiques à l'espérance. */
export function degatsDuCoupAuto(config: ConfigDonjon, j: Joueur): number {
  return (dpsEffectifDe(config, j) * config.auto.periode) / 1000
}

/** Le nombre de coups d'auto frappés depuis le début de la saison jusqu'à t. */
export function coupsAutoA(config: ConfigDonjon, debut: number, t: number): number {
  return Math.max(0, Math.floor((t - debut) / config.auto.periode))
}

/** Un tap hors critique, fatigue et repos : la base plus N secondes de l'auto ACHETÉ. */
export function degatsDuTap(config: ConfigDonjon, j: Joueur): number {
  return degatsDeBaseDuTap(config, j) + config.tap.secondesDeDps * config.auto.parRang * j.ameliorations.auto
}

export function coutDuRang(config: ConfigDonjon, rang: number): number {
  return config.points.coutBase + Math.floor(rang * config.points.coutPente)
}

export function coutDe(config: ConfigDonjon, j: Joueur, quoi: CleAmelioration): number {
  return coutDuRang(config, j.ameliorations[quoi])
}

export function xpPourNiveau(config: ConfigDonjon, niveau: number): number {
  return Math.round(config.xp.base * Math.pow(niveau, config.xp.exposant))
}

/** La fatigue à l'instant t : elle fond de moitié toutes les `demiVie`. */
export function fatigueA(config: ConfigDonjon, j: Joueur, t: number): number {
  const ecoule = Math.max(0, t - j.dernierTap)
  return j.fatigue * Math.pow(0.5, ecoule / config.fatigue.demiVie)
}

/** Le repos à l'instant t : l'absence se convertit en taps renforcés. */
export function reposA(config: ConfigDonjon, j: Joueur, t: number): number {
  const ecoule = Math.max(0, t - j.dernierTap)
  return Math.min(config.repos.max, j.repos + (ecoule / HEURE) * config.repos.parHeure)
}

/** Ce que rend un tap porté par cette fatigue : plein sous le seuil, puis décroissant. */
export function efficaciteDuTap(config: ConfigDonjon, fatigue: number): number {
  const exces = fatigue - config.fatigue.seuil
  return exces < 0 ? 1 : 1 / (1 + config.fatigue.pente * (exces + 1))
}

// ---------------------------------------------------------------- l'état

export function nouveauJoueur(id: string, nom: string, bot: string | null, t: number): Joueur {
  return {
    id,
    nom,
    bot,
    xp: 0,
    niveau: 1,
    points: 0,
    ameliorations: { tap: 0, auto: 0, chanceCrit: 0, multCrit: 0 },
    degatsTap: 0,
    degatsAuto: 0,
    kills: 0,
    fatigue: 0,
    repos: 0,
    dernierTap: t,
    bonus: {},
  }
}

export function etatInitial(config: ConfigDonjon, seed: number, debut: number): EtatDonjon {
  const saison = { numero: 1, seed: seed >>> 0, debut, fin: debut + config.saison.duree }
  return {
    version: 1,
    saison,
    t: debut,
    ennemi: ennemiDeLEtage(config, saison.seed, 1),
    joueurs: [],
    journal: [{ t: debut, joueur: null, type: 'debut', saison: 1 }],
    etageParJour: [],
    archives: [],
    rng: seed >>> 0,
  }
}

/** Le jour de la saison (1 à 7) de l'instant t. */
export function jourDeLaSaison(etat: EtatDonjon, t: number): number {
  return Math.min(Math.floor((t - etat.saison.debut) / JOUR) + 1, Math.round((etat.saison.fin - etat.saison.debut) / JOUR))
}

// ---------------------------------------------------------------- l'intérieur, sur une copie

function tirer(e: EtatDonjon): number {
  const rng = createRng(e.rng)
  const v = rng.next()
  e.rng = rng.getState()
  return v
}

function noter(config: ConfigDonjon, e: EtatDonjon, evenement: Evenement): void {
  e.journal.push(evenement)
  if (e.journal.length > config.saison.journalMax) e.journal.splice(0, e.journal.length - config.saison.journalMax)
}

function gagnerXp(config: ConfigDonjon, e: EtatDonjon, j: Joueur, xp: number, t: number): void {
  j.xp += xp
  let besoin = xpPourNiveau(config, j.niveau)
  while (j.xp >= besoin) {
    j.xp -= besoin
    j.niveau += 1
    j.points += config.points.parNiveau
    noter(config, e, { t, joueur: j.id, type: 'niveau', niveau: j.niveau })
    besoin = xpPourNiveau(config, j.niveau)
  }
}

function achever(config: ConfigDonjon, e: EtatDonjon, j: Joueur, t: number): void {
  j.kills += 1
  j.points += config.points.parKill
  noter(config, e, { t, joueur: j.id, type: 'kill', etage: e.ennemi.etage })
  e.ennemi = ennemiDeLEtage(config, e.saison.seed, e.ennemi.etage + 1)
}

/**
 * L'auto-tap de tous, sur les coups de `de` (exclu) à `a` (inclus), dans la
 * même saison et le même jour. Le coup fatal ne porte que ce qui restait :
 * le suivant frappe l'ennemi d'après.
 */
function resoudreLAuto(config: ConfigDonjon, e: EtatDonjon, de: number, a: number): void {
  const parJoueur = e.joueurs.map((j) => degatsDuCoupAuto(config, j))
  const total = parJoueur.reduce((s, d) => s + d, 0)
  const debut = e.saison.debut
  let coup = coupsAutoA(config, debut, de)
  const dernier = coupsAutoA(config, debut, a)
  if (total <= 0 || dernier <= coup) return

  for (;;) {
    const reste = dernier - coup
    const avantLaMort = Math.ceil(e.ennemi.pv / total - 1e-9)
    const coups = Math.min(reste, avantLaMort)
    coup += coups
    const instant = debut + coup * config.auto.periode
    // Le dernier coup sur un ennemi qui tombe ne porte que ses PV.
    const porte = Math.min(total * coups, e.ennemi.pv)
    e.joueurs.forEach((j, i) => {
      const degats = (parJoueur[i] / total) * porte
      j.degatsAuto += degats
      gagnerXp(config, e, j, degats * config.xp.parDegat, instant)
    })
    if (avantLaMort > reste) {
      e.ennemi.pv -= porte
      return
    }
    // Le coup fatal, au prorata du DPS de chacun.
    let tirage = tirer(e) * total
    let tueur = e.joueurs[e.joueurs.length - 1]
    for (let i = 0; i < e.joueurs.length; i++) {
      tirage -= parJoueur[i]
      if (tirage < 0) {
        tueur = e.joueurs[i]
        break
      }
    }
    achever(config, e, tueur, instant)
  }
}

function archiver(e: EtatDonjon): SaisonArchivee {
  return {
    numero: e.saison.numero,
    etage: e.ennemi.etage,
    joueurs: e.joueurs.map((j) => ({
      id: j.id,
      nom: j.nom,
      degatsTap: j.degatsTap,
      degatsAuto: j.degatsAuto,
      niveau: j.niveau,
      kills: j.kills,
    })),
    etageParJour: [...e.etageParJour],
  }
}

/** La saison se ferme : on l'archive, et tout repart de l'étage 1. */
function finirLaSaison(config: ConfigDonjon, e: EtatDonjon): void {
  const fin = e.saison.fin
  e.archives.push(archiver(e))
  if (e.archives.length > ARCHIVES_MAX) e.archives.splice(0, e.archives.length - ARCHIVES_MAX)
  const etage = e.ennemi.etage
  const numero = e.saison.numero + 1
  const seed = (Math.imul(e.saison.seed ^ numero, 0x27d4eb2d) + numero) >>> 0
  e.saison = { numero, seed, debut: fin, fin: fin + config.saison.duree }
  e.ennemi = ennemiDeLEtage(config, seed, 1)
  e.joueurs = e.joueurs.map((j) => ({ ...nouveauJoueur(j.id, j.nom, j.bot, fin), bonus: j.bonus }))
  e.etageParJour = []
  e.journal = []
  noter(config, e, { t: fin, joueur: null, type: 'fin', saison: numero - 1, etage })
  noter(config, e, { t: fin, joueur: null, type: 'debut', saison: numero })
}

/** Résout le temps sur la copie `e`, jusqu'à t. */
function avancerSurPlace(config: ConfigDonjon, e: EtatDonjon, t: number): void {
  while (t > e.t) {
    const prochainJour = e.saison.debut + (e.etageParJour.length + 1) * JOUR
    const borne = Math.min(t, prochainJour, e.saison.fin)
    resoudreLAuto(config, e, e.t, borne)
    e.t = borne
    if (borne === prochainJour) e.etageParJour.push(e.ennemi.etage)
    if (borne === e.saison.fin) finirLaSaison(config, e)
  }
}

function taper(config: ConfigDonjon, e: EtatDonjon, j: Joueur, n: number, t: number): void {
  let fatigue = fatigueA(config, j, t)
  let repos = reposA(config, j, t)
  for (let k = 0; k < n; k++) {
    let degats = degatsDuTap(config, j) * efficaciteDuTap(config, fatigue)
    fatigue += 1
    if (repos >= 1) {
      degats *= config.repos.mult
      repos -= 1
    }
    if (tirer(e) < chanceCritDe(config, j)) degats *= multCritDe(config, j)
    // Le surplus d'un coup fatal est perdu : un tap frappe un ennemi.
    const porte = Math.min(degats, e.ennemi.pv)
    j.degatsTap += porte
    e.ennemi.pv -= porte
    gagnerXp(config, e, j, porte * config.xp.parDegat, t)
    if (e.ennemi.pv <= 0) achever(config, e, j, t)
  }
  j.fatigue = fatigue
  j.repos = repos
  j.dernierTap = t
}

// ---------------------------------------------------------------- l'extérieur

/** L'état à l'instant t (l'auto-tap, les jours, les saisons). Ne recule jamais. */
export function avancer(config: ConfigDonjon, etat: EtatDonjon, t: number): EtatDonjon {
  if (t <= etat.t) return etat
  const e = structuredClone(etat)
  avancerSurPlace(config, e, t)
  return e
}

/**
 * Applique une action. Une action datée d'avant l'état (un message en retard)
 * est jouée à l'instant de l'état ; une action impossible ne change rien.
 */
export function appliquer(config: ConfigDonjon, etat: EtatDonjon, action: Action): EtatDonjon {
  const e = structuredClone(etat)
  avancerSurPlace(config, e, action.t)
  const t = e.t
  const j = e.joueurs.find((x) => x.id === action.joueur)

  switch (action.type) {
    case 'rejoindre':
      if (j === undefined) {
        e.joueurs.push(nouveauJoueur(action.joueur, action.nom, action.bot, t))
        noter(config, e, { t, joueur: action.joueur, type: 'entree' })
      }
      break
    case 'taper':
      if (j !== undefined && action.n > 0) taper(config, e, j, Math.floor(action.n), t)
      break
    case 'acheter':
      if (j !== undefined) {
        const cout = coutDe(config, j, action.quoi)
        if (j.points >= cout) {
          j.points -= cout
          j.ameliorations[action.quoi] += 1
        }
      }
      break
  }
  return e
}

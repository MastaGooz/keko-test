/**
 * LES RÈGLES DU DONJON — un réducteur unique, pur.
 *
 * `appliquer(config, etat, action)` rend l'état suivant ; `avancer(config,
 * etat, t)` résout le temps écoulé (l'auto-tap, la fin des jours et des
 * saisons). *Les bots et le joueur passent par les mêmes actions*, et le jour
 * où l'état partagé vivra sur un serveur, c'est ce même réducteur qui y
 * tournera.
 *
 * **L'AUTO-TAP EST UN TAP QUI SE DONNE TOUT SEUL.** Chaque joueur frappe un
 * coup (les dégâts du Coup) sur chaque multiple de SA période depuis le
 * début de la saison ; les coups de même instant tombent ensemble. Le
 * critique d'un coup est une FONCTION de (saison, instant, joueur)
 * (`autoCritique`), pas un tirage qui use le RNG de l'état : résoudre une
 * heure en une fois ou en deux donne les mêmes coups, et l'écran sait
 * exactement quel coup du joueur a été critique. Le coup fatal va à l'un des
 * joueurs, tiré au hasard seedé au prorata de ce que chacun a frappé à cet
 * instant. Les coups se résolvent un à un, dans l'ordre du temps.
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

/** L'intervalle entre deux coups d'auto de ce joueur, en ms entières. */
export function periodeDe(config: ConfigDonjon, j: Joueur): number {
  const a = config.auto
  return Math.max(a.periodeMin, Math.round(a.periode / (1 + a.acceleration * j.ameliorations.auto)))
}

/** Le DPS de l'auto hors critique : un coup par période. */
export function dpsDe(config: ConfigDonjon, j: Joueur): number {
  return (degatsDeBaseDuTap(config, j) * 1000) / periodeDe(config, j)
}

export function chanceCritDe(config: ConfigDonjon, j: Joueur): number {
  const c = config.crit
  return Math.min(c.chanceMax, c.chanceBase + c.chanceParRang * j.ameliorations.chanceCrit)
}

export function multCritDe(config: ConfigDonjon, j: Joueur): number {
  return config.crit.multBase + config.crit.multParRang * j.ameliorations.multCrit
}

/** Le facteur moyen des critiques : ce que rend un coup en moyenne. */
export function facteurCritMoyen(config: ConfigDonjon, j: Joueur): number {
  return 1 + chanceCritDe(config, j) * (multCritDe(config, j) - 1)
}

/** Les dégâts par seconde de l'auto-tap, critiques compris EN MOYENNE (pour l'affichage). */
export function dpsEffectifDe(config: ConfigDonjon, j: Joueur): number {
  return dpsDe(config, j) * facteurCritMoyen(config, j)
}

/** Un coup d'auto : exactement un tap, hors critique (sans la forme). */
export function degatsDuCoupAuto(config: ConfigDonjon, j: Joueur): number {
  return degatsDeBaseDuTap(config, j)
}

/** Un entier 32 bits mélangé (le finaliseur de murmur3) : même entrée, même sortie. */
function melanger(x: number): number {
  x = Math.imul(x ^ (x >>> 16), 0x7feb352d)
  x = Math.imul(x ^ (x >>> 15), 0x846ca68b)
  return (x ^ (x >>> 16)) >>> 0
}

function empreinteDe(id: string): number {
  let h = 2166136261
  for (let i = 0; i < id.length; i++) h = Math.imul(h ^ id.charCodeAt(i), 16777619)
  return h >>> 0
}

/** `dans` = l'instant du coup depuis le début de la saison, en ms. */
function critiqueTire(config: ConfigDonjon, seed: number, dans: number, empreinte: number, j: Joueur): boolean {
  const h = melanger(seed ^ melanger((dans + 0x9e3779b9) >>> 0) ^ empreinte)
  return h / 4294967296 < chanceCritDe(config, j)
}

/**
 * LE COUP D'AUTO DE CE JOUEUR, `dans` ms après le début de la saison, EST-IL
 * CRITIQUE ? Une fonction de (graine de la saison, instant, joueur) : les
 * règles et l'écran lisent la même.
 */
export function autoCritique(config: ConfigDonjon, seed: number, dans: number, j: Joueur): boolean {
  return critiqueTire(config, seed, dans, empreinteDe(j.id), j)
}

/** Le nombre de coups d'auto de ce joueur depuis le début de la saison jusqu'à t. */
export function coupsAutoA(config: ConfigDonjon, debut: number, t: number, j: Joueur): number {
  return Math.max(0, Math.floor((t - debut) / periodeDe(config, j)))
}

/** Un tap hors critique et hors forme : les dégâts du Coup. */
export function degatsDuTap(config: ConfigDonjon, j: Joueur): number {
  return degatsDeBaseDuTap(config, j)
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

/** Le DPS d'un spammeur à ce niveau : l'étalon de la forme. */
export function dpsDeSpam(config: ConfigDonjon, j: Joueur): number {
  return degatsDuTap(config, j) * facteurCritMoyen(config, j) * config.forme.cadenceSpam
}

/**
 * Les bornes de la forme, en minutes de spam autour du milieu (0) : épuisé,
 * le bas et le haut du palier à 100 %, reposé.
 */
export function bornesDeLaForme(config: ConfigDonjon): { min: number; palierBas: number; palierHaut: number; max: number } {
  const f = config.forme
  const demi = f.palier / 2
  return { min: -demi - f.fatigue, palierBas: -demi, palierHaut: demi, max: demi + f.repos }
}

/** Le temps pousse la forme vers la droite : vite jusqu'au milieu, lentement au-delà. */
function reprendre(config: ConfigDonjon, forme: number, heures: number): number {
  const f = config.forme
  if (forme < 0) {
    const jusquAuMilieu = -forme / f.recuperationParHeure
    if (heures <= jusquAuMilieu) return forme + heures * f.recuperationParHeure
    heures -= jusquAuMilieu
    forme = 0
  }
  return Math.min(bornesDeLaForme(config).max, forme + heures * f.reposParHeure)
}

/** LA FORME À L'INSTANT t, en minutes de spam : celle du dernier tap, reprise depuis. */
export function formeA(config: ConfigDonjon, j: Joueur, t: number): number {
  return t <= j.formeA ? j.forme : reprendre(config, j.forme, (t - j.formeA) / HEURE)
}

/**
 * Ce que la forme fait d'un tap : 0 % épuisé, 100 % sur tout le palier,
 * 200 % reposé, en continu entre les deux.
 */
export function multiplicateurDeForme(config: ConfigDonjon, forme: number): number {
  const f = config.forme
  const b = bornesDeLaForme(config)
  if (forme < b.palierBas) return Math.max(0, 1 + (forme - b.palierBas) / f.fatigue)
  if (forme <= b.palierHaut) return 1
  return Math.min(2, 1 + (forme - b.palierHaut) / f.repos)
}

// ---------------------------------------------------------------- l'état

/** Un joueur neuf est pile au milieu de la forme (0). */
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
    forme: 0,
    formeA: t,
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
 * L'auto-tap de tous, de `de` (exclu) à `a` (inclus), dans la même saison et
 * le même jour : chaque joueur frappe sur les multiples de sa période, les
 * coups du même instant ensemble, chacun peut être critique. Le coup fatal ne
 * porte que ce qui restait : les suivants frappent l'ennemi d'après. L'XP se
 * verse par tranche (à chaque mort, et à la fin).
 */
function resoudreLAuto(config: ConfigDonjon, e: EtatDonjon, de: number, a: number): void {
  const n = e.joueurs.length
  if (a <= de || n === 0) return
  const debut = e.saison.debut
  const seed = e.saison.seed

  // Rien ne bouge entre deux actions : on lit chacun une fois.
  const periodes = e.joueurs.map((j) => periodeDe(config, j))
  const base = e.joueurs.map((j) => degatsDuCoupAuto(config, j))
  const mult = e.joueurs.map((j) => multCritDe(config, j))
  const empreintes = e.joueurs.map((j) => empreinteDe(j.id))
  // Le prochain coup de chacun : le premier multiple de sa période après `de`.
  const prochain = periodes.map((p) => debut + (Math.floor((de - debut) / p) + 1) * p)
  const cumul = new Array<number>(n).fill(0)
  const ceCoup = new Array<number>(n).fill(0)
  const verser = (instant: number) => {
    e.joueurs.forEach((j, i) => {
      if (cumul[i] <= 0) return
      j.degatsAuto += cumul[i]
      gagnerXp(config, e, j, cumul[i] * config.xp.parDegat, instant)
      cumul[i] = 0
    })
  }

  for (;;) {
    let t = Infinity
    for (let i = 0; i < n; i++) if (prochain[i] < t) t = prochain[i]
    if (t > a) break
    let total = 0
    for (let i = 0; i < n; i++) {
      ceCoup[i] = 0
      if (prochain[i] !== t) continue
      ceCoup[i] = base[i] * (critiqueTire(config, seed, t - debut, empreintes[i], e.joueurs[i]) ? mult[i] : 1)
      total += ceCoup[i]
      prochain[i] += periodes[i]
    }
    if (total < e.ennemi.pv) {
      for (let i = 0; i < n; i++) cumul[i] += ceCoup[i]
      e.ennemi.pv -= total
      continue
    }
    // Le coup fatal ne porte que les PV qui restaient, au prorata de chacun.
    const part = e.ennemi.pv / total
    for (let i = 0; i < n; i++) cumul[i] += ceCoup[i] * part
    verser(t)
    let tirage = tirer(e) * total
    let tueur = e.joueurs[n - 1]
    for (let i = 0; i < n; i++) {
      tirage -= ceCoup[i]
      if (tirage < 0) {
        tueur = e.joueurs[i]
        break
      }
    }
    achever(config, e, tueur, t)
  }
  verser(a)
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
  // Chaque tap use la forme de ce que ses dégâts valent en minutes de spam.
  let forme = formeA(config, j, t)
  const minuteDeSpam = dpsDeSpam(config, j) * 60
  for (let k = 0; k < n; k++) {
    let brut = degatsDuTap(config, j)
    if (tirer(e) < chanceCritDe(config, j)) brut *= multCritDe(config, j)
    const degats = brut * multiplicateurDeForme(config, forme)
    forme = Math.max(bornesDeLaForme(config).min, forme - brut / minuteDeSpam)
    // Le surplus d'un coup fatal est perdu : un tap frappe un ennemi.
    const porte = Math.min(degats, e.ennemi.pv)
    j.degatsTap += porte
    e.ennemi.pv -= porte
    gagnerXp(config, e, j, porte * config.xp.parDegat, t)
    if (e.ennemi.pv <= 0) achever(config, e, j, t)
  }
  j.forme = forme
  j.formeA = t
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

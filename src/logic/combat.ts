/**
 * Combat à horloge partagée. Pur : aucun accès au DOM, aucun hasard non seedé.
 *
 * Le temps ne s'écoule que quand le joueur le dépense. Chaque combattant porte
 * un compteur ; le joueur est une unité comme les autres, son compteur à lui
 * déclenche sa pioche.
 *
 * Une carte **résout immédiatement**, puis son temps s'écoule. Le joueur n'a
 * donc jamais de coup « en vol » à simuler : il choisit combien de temps il
 * achète, et voit qui frappe pendant ce temps-là.
 *
 * Plusieurs ennemis partagent la même horloge. Un coup ne porte que sur sa
 * cible, mais le temps qu'il coûte les fait tous avancer : c'est ce qui rend
 * l'achèvement précieux — un mort ne frappe plus du tout pendant ce temps.
 *
 * Les transitions exportées ne modifient jamais l'état reçu : elles en font une
 * copie, mutent la copie, et la renvoient.
 */
import type { Rng } from './rng.ts'

export type Carte = {
  /** Identifiant d'exemplaire, unique dans le deck. */
  id: string
  nom: string
  /** Un trésor ne se joue pas : il n'occupe qu'une place de main. */
  type: 'combat' | 'tresor'
  /** Temps consommé par l'engagement. Sans objet pour un trésor. */
  vitesse: number
  degats: number
}

export type Ennemi = {
  nom: string
  pv: number
  pvMax: number
  degats: number
  /** Valeur à laquelle le compteur se recharge après une frappe. */
  periode: number
  /** L'ennemi frappe quand ce compteur atteint 0. Sa valeur de départ est
   *  l'ouverture de l'ennemi : elle peut différer de la période. */
  compteur: number
}

export type Issue = 'victoire' | 'defaite'

/** Ce qui s'est passé, horodaté : sert au récit ET à la frise chronologique. */
export type Evenement =
  | { t: number; type: 'debut'; ennemis: string[] }
  | { t: number; type: 'carte'; nom: string; cible: string; degats: number; pvCible: number }
  | { t: number; type: 'mort'; nom: string }
  | { t: number; type: 'frappe'; nom: string; degats: number; pvJoueur: number }
  | { t: number; type: 'pioche'; cartes: number; tresors: number }
  | { t: number; type: 'issue'; issue: Issue }

/** Ce qui va se passer si rien ne change, en temps relatif à maintenant. */
export type Prevision = {
  /** Dans combien de temps. */
  dans: number
  type: 'frappe' | 'pioche'
  nom: string
  /** Index de l'ennemi concerné — seulement pour une frappe. */
  ennemi?: number
}

export type EtatCombat = {
  pv: number
  pvMax: number
  /** Les morts restent dans le tableau (pv à 0) : les index de cible ne bougent pas. */
  ennemis: Ennemi[]
  pioche: Carte[]
  main: Carte[]
  defausse: Carte[]
  /** Compteur du joueur : à 0, toute la main est défaussée et repiochée. */
  compteurPioche: number
  periodePioche: number
  tailleMain: number
  /** Temps total écoulé depuis le début du combat. */
  temps: number
  /** Du plus ancien au plus récent. */
  evenements: Evenement[]
  issue: Issue | null
}

export type ConfigCombat = {
  pvMax: number
  tailleMain: number
  periodePioche: number
}

export const CONFIG_DEFAUT: ConfigCombat = {
  pvMax: 30,
  tailleMain: 5,
  periodePioche: 5,
}

export function creerCombat(
  deck: Carte[],
  ennemis: Ennemi[],
  rng: Rng,
  config: ConfigCombat = CONFIG_DEFAUT,
): EtatCombat {
  const etat: EtatCombat = {
    pv: config.pvMax,
    pvMax: config.pvMax,
    ennemis: ennemis.map((ennemi) => ({ ...ennemi })),
    pioche: melanger(deck, rng),
    main: [],
    defausse: [],
    compteurPioche: config.periodePioche,
    periodePioche: config.periodePioche,
    tailleMain: config.tailleMain,
    temps: 0,
    evenements: [{ t: 0, type: 'debut', ennemis: ennemis.map((e) => e.nom) }],
    issue: null,
  }

  piocher(etat, rng)
  return etat
}

/**
 * Joue la carte de la main à `index` contre l'ennemi `cible` : elle résout
 * aussitôt, puis le temps s'écoule de sa vitesse.
 * Renvoie l'état inchangé si le coup est impossible (combat fini, trésor,
 * cible déjà morte...).
 */
export function jouerCarte(etat: EtatCombat, index: number, cible: number, rng: Rng): EtatCombat {
  if (etat.issue !== null) return etat

  const carte = etat.main[index]
  if (carte === undefined || carte.type !== 'combat') return etat
  if (!estVivant(etat, cible)) return etat

  const suivant = copier(etat)
  suivant.main.splice(index, 1)
  ecouler(suivant, carte.vitesse, rng, carte, cible)
  return suivant
}

/**
 * Avance le temps jusqu'à la prochaine pioche du joueur, d'un seul coup.
 * Jamais avantageux — on encaisse sans riposter — mais toujours disponible :
 * sans lui, une main morte figerait la partie.
 */
export function passer(etat: EtatCombat, rng: Rng): EtatCombat {
  if (etat.issue !== null) return etat

  const suivant = copier(etat)
  ecouler(suivant, etat.compteurPioche, rng, null, -1)
  return suivant
}

/**
 * Ce qui tombera dans les `horizon` prochaines unités de temps si le joueur
 * dépense ce temps. La carte n'y figure plus : elle résout avant que le temps
 * ne s'écoule. Ceci décrit donc uniquement ce que le temps coûte.
 */
export function prevoir(etat: EtatCombat, horizon: number): Prevision[] {
  if (etat.issue !== null) return []

  const prevues: Prevision[] = []

  etat.ennemis.forEach((ennemi, index) => {
    if (ennemi.pv === 0) return
    for (let dans = ennemi.compteur; dans <= horizon; dans += ennemi.periode) {
      prevues.push({ dans, type: 'frappe', nom: ennemi.nom, ennemi: index })
    }
  })
  for (let dans = etat.compteurPioche; dans <= horizon; dans += etat.periodePioche) {
    prevues.push({ dans, type: 'pioche', nom: 'Pioche' })
  }

  const rang = { frappe: 0, pioche: 1 }
  return prevues.sort((a, b) => a.dans - b.dans || rang[a.type] - rang[b.type])
}

/**
 * Ce qu'on encaisse en dépensant `temps`, sans rien y changer.
 *
 * Indépendant de la cible visée : pendant qu'une carte est en vol, TOUS les
 * ennemis avancent. C'est pour ça que cette part s'affiche sur la carte, et
 * que la part qui dépend de la cible s'affiche sur l'ennemi.
 */
export function coutDuVol(
  etat: EtatCombat,
  temps: number,
): { frappes: number; degats: number; mortel: boolean } {
  let pv = etat.pv
  let frappes = 0
  let degats = 0

  for (const prevision of prevoir(etat, temps)) {
    if (prevision.type !== 'frappe') continue
    const ennemi = etat.ennemis[prevision.ennemi!]!
    pv -= ennemi.degats
    degats += ennemi.degats
    frappes += 1
    if (pv <= 0) return { frappes, degats, mortel: true }
  }

  return { frappes, degats, mortel: false }
}

/** Ce que coûte un passage : on encaisse tout jusqu'au renouvellement de main. */
export function coutDuPassage(etat: EtatCombat): { frappes: number; degats: number } {
  const { frappes, degats } = coutDuVol(etat, etat.compteurPioche)
  return { frappes, degats }
}

/**
 * Ce que coûte une carte jouée maintenant sur `cible`, simulé sans jouer le
 * coup. Le coup porte d'abord, le temps se dépense ensuite : la cible achevée
 * ne frappe donc plus du tout pendant ce temps-là.
 *
 * C'est la question que le joueur pose à chaque carte de sa main. La poser
 * cinq fois à la main est exactement la corvée qu'on lui épargne.
 */
export type Consequence = {
  /** Temps dépensé après le coup. */
  cout: number
  /** Frappes encaissées pendant ce temps. */
  frappes: number
  /** Dégâts correspondants. */
  degats: number
  /** La carte achève la cible. */
  tue: boolean
  /** La carte achève le dernier ennemi debout : le combat s'arrête net. */
  gagne: boolean
  /** Le joueur tombe pendant le temps dépensé. */
  mortel: boolean
  /** La main tient jusqu'au bout ; sinon le reste part à la défausse. */
  tientDansLaMain: boolean
}

export function consequence(etat: EtatCombat, carte: Carte, cible: number): Consequence {
  const vise = etat.ennemis[cible]
  const tue = vise !== undefined && vise.pv > 0 && carte.degats >= vise.pv
  const debout = etat.ennemis.filter((ennemi) => ennemi.pv > 0).length
  const gagne = tue && debout === 1

  let pv = etat.pv
  let frappes = 0
  let degats = 0
  let mortel = false

  // Le dernier mort arrête le combat : le temps de la carte ne se dépense pas.
  if (!gagne) {
    for (const prevision of prevoir(etat, carte.vitesse)) {
      if (prevision.type !== 'frappe') continue
      // La cible est déjà tombée quand le temps commence à s'écouler.
      if (tue && prevision.ennemi === cible) continue

      const ennemi = etat.ennemis[prevision.ennemi!]!
      pv -= ennemi.degats
      degats += ennemi.degats
      frappes += 1
      if (pv <= 0) {
        mortel = true
        break
      }
    }
  }

  return {
    cout: gagne ? 0 : carte.vitesse,
    frappes,
    degats,
    tue,
    gagne,
    mortel,
    tientDansLaMain: gagne || carte.vitesse <= etat.compteurPioche,
  }
}

/** Les ennemis encore debout, avec leur index de cible. */
export function vivants(etat: EtatCombat): { ennemi: Ennemi; index: number }[] {
  return etat.ennemis
    .map((ennemi, index) => ({ ennemi, index }))
    .filter((x) => x.ennemi.pv > 0)
}

function estVivant(etat: EtatCombat, index: number): boolean {
  const ennemi = etat.ennemis[index]
  return ennemi !== undefined && ennemi.pv > 0
}

/** Nombre de trésors qui encombrent la main. */
export function tresorsEnMain(etat: EtatCombat): number {
  return etat.main.filter((carte) => carte.type === 'tresor').length
}

/** Vrai si aucune carte de la main ne peut être jouée. */
export function mainMorte(etat: EtatCombat): boolean {
  return etat.main.every((carte) => carte.type !== 'combat')
}

// --- interne : tout ce qui suit mute l'état reçu, déjà copié par l'appelant ---

/**
 * La carte résout d'abord, PUIS le temps s'écoule de sa vitesse.
 *
 * C'est le point qui allège tout le système : le joueur n'a jamais à simuler
 * un coup « en vol ». Il pose une question simple — combien de temps j'achète,
 * et qui frappe pendant ce temps-là. Tuer reste préemptif, et plus nettement
 * qu'avant : un mort ne frappe plus du tout pendant le temps qu'on dépense.
 */
function ecouler(
  etat: EtatCombat,
  temps: number,
  rng: Rng,
  carte: Carte | null,
  cible: number,
): void {
  if (carte !== null) resoudreCarte(etat, carte, cible)
  if (etat.issue !== null) return

  for (let tic = 1; tic <= temps; tic += 1) {
    etat.temps += 1
    for (const ennemi of etat.ennemis) {
      if (ennemi.pv > 0) ennemi.compteur -= 1
    }
    etat.compteurPioche -= 1

    for (const ennemi of etat.ennemis) {
      if (ennemi.pv > 0 && ennemi.compteur <= 0) frapper(etat, ennemi)
      if (etat.issue !== null) return
    }

    if (etat.compteurPioche <= 0) {
      etat.compteurPioche = etat.periodePioche
      piocher(etat, rng)
    }
  }
}

function resoudreCarte(etat: EtatCombat, carte: Carte, cible: number): void {
  etat.defausse.push(carte)

  const ennemi = etat.ennemis[cible]
  if (ennemi === undefined || ennemi.pv === 0) return

  ennemi.pv = Math.max(0, ennemi.pv - carte.degats)
  etat.evenements.push({
    t: etat.temps,
    type: 'carte',
    nom: carte.nom,
    cible: ennemi.nom,
    degats: carte.degats,
    pvCible: ennemi.pv,
  })

  if (ennemi.pv === 0) {
    etat.evenements.push({ t: etat.temps, type: 'mort', nom: ennemi.nom })
    if (etat.ennemis.every((autre) => autre.pv === 0)) terminer(etat, 'victoire')
  }
}

function frapper(etat: EtatCombat, ennemi: Ennemi): void {
  etat.pv = Math.max(0, etat.pv - ennemi.degats)
  ennemi.compteur = ennemi.periode
  etat.evenements.push({
    t: etat.temps,
    type: 'frappe',
    nom: ennemi.nom,
    degats: ennemi.degats,
    pvJoueur: etat.pv,
  })

  if (etat.pv === 0) terminer(etat, 'defaite')
}

function terminer(etat: EtatCombat, issue: Issue): void {
  etat.issue = issue
  etat.evenements.push({ t: etat.temps, type: 'issue', issue })
}

/** Défausse toute la main puis complète à `tailleMain`, en remélangeant au besoin. */
function piocher(etat: EtatCombat, rng: Rng): void {
  etat.defausse.push(...etat.main)
  etat.main = []

  while (etat.main.length < etat.tailleMain) {
    if (etat.pioche.length === 0) {
      if (etat.defausse.length === 0) break
      etat.pioche = melanger(etat.defausse, rng)
      etat.defausse = []
    }
    etat.main.push(etat.pioche.pop()!)
  }

  etat.evenements.push({
    t: etat.temps,
    type: 'pioche',
    cartes: etat.main.length,
    tresors: etat.main.filter((carte) => carte.type === 'tresor').length,
  })
}

/** Fisher-Yates seedé. Renvoie un nouveau tableau. */
function melanger(cartes: Carte[], rng: Rng): Carte[] {
  const melange = [...cartes]
  for (let i = melange.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng.next() * (i + 1))
    ;[melange[i], melange[j]] = [melange[j]!, melange[i]!]
  }
  return melange
}

/** Copie défensive : l'état reçu par les transitions n'est jamais modifié. */
function copier(etat: EtatCombat): EtatCombat {
  return {
    ...etat,
    ennemis: etat.ennemis.map((ennemi) => ({ ...ennemi })),
    pioche: [...etat.pioche],
    main: [...etat.main],
    defausse: [...etat.defausse],
    evenements: [...etat.evenements],
  }
}

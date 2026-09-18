/**
 * Combat à horloge partagée. Pur : aucun accès au DOM, aucun hasard non seedé.
 *
 * Le temps ne s'écoule que quand le joueur le dépense. Chaque combattant porte
 * un compteur ; le joueur est une unité comme les autres, son compteur à lui
 * déclenche sa pioche. Une carte engagée résout à la FIN de son temps, et à
 * égalité elle passe avant les frappes ennemies du même tic.
 *
 * Plusieurs ennemis partagent la même horloge. Un coup ne porte que sur sa
 * cible, mais le temps qu'il coûte les fait tous avancer : c'est ce qui rend
 * l'achèvement précieux — un mort ne frappe plus.
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
  type: 'carte' | 'frappe' | 'pioche'
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
 * Engage la carte de la main à `index` contre l'ennemi `cible`. Elle quitte la
 * main tout de suite, le temps s'écoule de sa vitesse, et elle résout à la fin.
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
 * n'agit plus. Si une carte est passée, on y ajoute le moment où elle
 * résoudrait : c'est la question que le joueur se pose avant de la jouer —
 * « est-ce que je me fais frapper avant qu'elle tombe ? »
 */
export function prevoir(etat: EtatCombat, horizon: number, carte: Carte | null): Prevision[] {
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
  if (carte !== null && carte.type === 'combat') {
    prevues.push({ dans: carte.vitesse, type: 'carte', nom: carte.nom })
  }

  // À égalité la carte du joueur passe avant : on l'affiche donc en premier.
  const rang = { carte: 0, frappe: 1, pioche: 2 }
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

  for (const prevision of prevoir(etat, temps, null)) {
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
 * coup. C'est la question que le joueur pose à chaque carte de sa main : la
 * poser cinq fois à la main est exactement la corvée qu'on lui épargne.
 */
export type Consequence = {
  /** Instant de résolution, en temps relatif. */
  dans: number
  /** Frappes réellement encaissées avant que la carte ne tombe. */
  frappes: number
  /** Dégâts correspondants. */
  degats: number
  /** La carte achève la cible — et le joueur est vivant pour le voir. */
  tue: boolean
  /** La carte achève le dernier ennemi debout : elle gagne le combat. */
  gagne: boolean
  /** Le joueur tombe avant que la carte ne résolve. */
  mortel: boolean
  /** La main tient jusqu'à la résolution ; sinon le reste part à la défausse. */
  tientDansLaMain: boolean
}

export function consequence(etat: EtatCombat, carte: Carte, cible: number): Consequence {
  const vise = etat.ennemis[cible]
  const acheve = vise !== undefined && vise.pv > 0 && carte.degats >= vise.pv

  let pv = etat.pv
  let frappes = 0
  let degats = 0
  let mortel = false

  for (const prevision of prevoir(etat, carte.vitesse, null)) {
    if (prevision.type !== 'frappe') continue
    // À égalité la carte résout d'abord : la cible achevée ne frappe plus.
    // Les autres ennemis, eux, frappent quand même.
    if (prevision.dans === carte.vitesse && acheve && prevision.ennemi === cible) continue

    const ennemi = etat.ennemis[prevision.ennemi!]!
    pv -= ennemi.degats
    degats += ennemi.degats
    frappes += 1
    if (pv <= 0) {
      mortel = true
      break
    }
  }

  const debout = etat.ennemis.filter((ennemi) => ennemi.pv > 0).length

  return {
    dans: carte.vitesse,
    frappes,
    degats,
    tue: acheve && !mortel,
    gagne: acheve && !mortel && debout === 1,
    mortel,
    tientDansLaMain: carte.vitesse <= etat.compteurPioche,
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
 * Écoule `temps` tics. À chaque tic, les compteurs descendent d'un cran et ce
 * qui atteint 0 se résout aussitôt. La carte engagée résout au dernier tic,
 * avant les frappes ennemies de ce tic : c'est la règle d'égalité, celle qui
 * permet de tuer pile à temps.
 */
function ecouler(
  etat: EtatCombat,
  temps: number,
  rng: Rng,
  carte: Carte | null,
  cible: number,
): void {
  // Vitesse 0 : la carte résout sans que rien n'avance. Aucun compteur ne bouge,
  // donc rien d'autre ne peut tomber — on sort avant la boucle.
  if (temps === 0) {
    if (carte !== null) resoudreCarte(etat, carte, cible)
    return
  }

  for (let tic = 1; tic <= temps; tic += 1) {
    etat.temps += 1
    for (const ennemi of etat.ennemis) {
      if (ennemi.pv > 0) ennemi.compteur -= 1
    }
    etat.compteurPioche -= 1

    if (carte !== null && tic === temps) resoudreCarte(etat, carte, cible)
    if (etat.issue !== null) return

    // Un ennemi achevé à ce tic ne frappe pas : il est déjà tombé à 0 PV.
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

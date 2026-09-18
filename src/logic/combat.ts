/**
 * Combat à horloge partagée. Pur : aucun accès au DOM, aucun hasard non seedé.
 *
 * Le temps ne s'écoule que quand le joueur le dépense. Chaque combattant porte
 * un compteur ; le joueur est une unité comme les autres, son compteur à lui
 * déclenche sa pioche. Une carte engagée résout à la FIN de son temps, et à
 * égalité elle passe avant la frappe ennemie du même tic.
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
  | { t: number; type: 'debut'; ennemi: string }
  | { t: number; type: 'carte'; nom: string; degats: number; pvEnnemi: number }
  | { t: number; type: 'frappe'; nom: string; degats: number; pvJoueur: number }
  | { t: number; type: 'pioche'; cartes: number; tresors: number }
  | { t: number; type: 'issue'; issue: Issue }

/** Ce qui va se passer si rien ne change, en temps relatif à maintenant. */
export type Prevision = {
  /** Dans combien de temps. */
  dans: number
  type: 'carte' | 'frappe' | 'pioche'
  nom: string
}

export type EtatCombat = {
  pv: number
  pvMax: number
  ennemi: Ennemi
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
  ennemi: Ennemi,
  rng: Rng,
  config: ConfigCombat = CONFIG_DEFAUT,
): EtatCombat {
  const etat: EtatCombat = {
    pv: config.pvMax,
    pvMax: config.pvMax,
    ennemi: { ...ennemi },
    pioche: melanger(deck, rng),
    main: [],
    defausse: [],
    compteurPioche: config.periodePioche,
    periodePioche: config.periodePioche,
    tailleMain: config.tailleMain,
    temps: 0,
    evenements: [{ t: 0, type: 'debut', ennemi: ennemi.nom }],
    issue: null,
  }

  piocher(etat, rng)
  return etat
}

/**
 * Engage la carte de la main à `index`. Elle quitte la main tout de suite,
 * le temps s'écoule de sa vitesse, et elle résout à la fin.
 * Renvoie l'état inchangé si le coup est impossible (combat fini, trésor...).
 */
export function jouerCarte(etat: EtatCombat, index: number, rng: Rng): EtatCombat {
  if (etat.issue !== null) return etat

  const carte = etat.main[index]
  if (carte === undefined || carte.type !== 'combat') return etat

  const suivant = copier(etat)
  suivant.main.splice(index, 1)
  ecouler(suivant, carte.vitesse, rng, carte)
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
  ecouler(suivant, etat.compteurPioche, rng, null)
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

  for (let dans = etat.ennemi.compteur; dans <= horizon; dans += etat.ennemi.periode) {
    prevues.push({ dans, type: 'frappe', nom: etat.ennemi.nom })
  }
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
 * Ce que coûte une carte jouée maintenant, simulé sans jouer le coup.
 *
 * C'est la question que le joueur pose à chaque carte de sa main. La poser
 * cinq fois de suite à la main est exactement la corvée qu'on veut lui
 * épargner : l'interface l'affiche sur chaque carte.
 */
export type Consequence = {
  /** Instant de résolution, en temps relatif. */
  dans: number
  /** Frappes réellement encaissées avant que la carte ne tombe. */
  frappes: number
  /** Dégâts correspondants. */
  degats: number
  /** La carte achève l'ennemi — et le joueur est vivant pour le voir. */
  tue: boolean
  /** Le joueur tombe avant que la carte ne résolve. */
  mortel: boolean
  /** La main tient jusqu'à la résolution ; sinon le reste part à la défausse. */
  tientDansLaMain: boolean
}

export function consequence(etat: EtatCombat, carte: Carte): Consequence {
  const acheve = carte.degats >= etat.ennemi.pv
  const frappesPrevues = prevoir(etat, carte.vitesse, null).filter((p) => p.type === 'frappe')

  let pv = etat.pv
  let frappes = 0
  let mortel = false

  for (const frappe of frappesPrevues) {
    // À égalité la carte résout d'abord : si elle achève, la frappe n'a pas lieu.
    if (frappe.dans === carte.vitesse && acheve) break

    pv -= etat.ennemi.degats
    frappes += 1
    if (pv <= 0) {
      mortel = true
      break
    }
  }

  return {
    dans: carte.vitesse,
    frappes,
    degats: frappes * etat.ennemi.degats,
    tue: acheve && !mortel,
    mortel,
    tientDansLaMain: carte.vitesse <= etat.compteurPioche,
  }
}

/** Ce que coûte un passage : on encaisse tout jusqu'au renouvellement de main. */
export function coutDuPassage(etat: EtatCombat): { frappes: number; degats: number } {
  const frappes = prevoir(etat, etat.compteurPioche, null).filter((p) => p.type === 'frappe').length
  return { frappes, degats: frappes * etat.ennemi.degats }
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
 * avant la frappe ennemie de ce tic : c'est la règle d'égalité, celle qui
 * permet de tuer pile à temps.
 */
function ecouler(etat: EtatCombat, temps: number, rng: Rng, carte: Carte | null): void {
  // Vitesse 0 : la carte résout sans que rien n'avance. Aucun compteur ne bouge,
  // donc rien d'autre ne peut tomber — on sort avant la boucle.
  if (temps === 0) {
    if (carte !== null) resoudreCarte(etat, carte)
    return
  }

  for (let tic = 1; tic <= temps; tic += 1) {
    etat.temps += 1
    etat.ennemi.compteur -= 1
    etat.compteurPioche -= 1

    if (carte !== null && tic === temps) resoudreCarte(etat, carte)
    if (etat.issue !== null) return

    if (etat.ennemi.compteur <= 0) frapper(etat)
    if (etat.issue !== null) return

    if (etat.compteurPioche <= 0) {
      etat.compteurPioche = etat.periodePioche
      piocher(etat, rng)
    }
  }
}

function resoudreCarte(etat: EtatCombat, carte: Carte): void {
  etat.ennemi.pv = Math.max(0, etat.ennemi.pv - carte.degats)
  etat.defausse.push(carte)
  etat.evenements.push({
    t: etat.temps,
    type: 'carte',
    nom: carte.nom,
    degats: carte.degats,
    pvEnnemi: etat.ennemi.pv,
  })

  if (etat.ennemi.pv === 0) terminer(etat, 'victoire')
}

function frapper(etat: EtatCombat): void {
  etat.pv = Math.max(0, etat.pv - etat.ennemi.degats)
  etat.ennemi.compteur = etat.ennemi.periode
  etat.evenements.push({
    t: etat.temps,
    type: 'frappe',
    nom: etat.ennemi.nom,
    degats: etat.ennemi.degats,
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
    ennemi: { ...etat.ennemi },
    pioche: [...etat.pioche],
    main: [...etat.main],
    defausse: [...etat.defausse],
    evenements: [...etat.evenements],
  }
}

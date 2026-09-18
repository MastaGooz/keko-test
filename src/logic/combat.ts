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
  /** L'ennemi frappe quand ce compteur atteint 0. */
  compteur: number
}

export type Issue = 'victoire' | 'defaite'

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
  /** Récit des évènements, du plus ancien au plus récent. */
  journal: string[]
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
    ennemi: { ...ennemi, compteur: ennemi.periode },
    pioche: melanger(deck, rng),
    main: [],
    defausse: [],
    compteurPioche: config.periodePioche,
    periodePioche: config.periodePioche,
    tailleMain: config.tailleMain,
    journal: [`${ennemi.nom} apparaît.`],
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
  suivant.journal.push(`Tu engages ${carte.nom} (vitesse ${carte.vitesse}).`)
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
  suivant.journal.push(`Tu passes : ${etat.compteurPioche} de temps s'écoulent.`)
  ecouler(suivant, etat.compteurPioche, rng, null)
  return suivant
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
  for (let tic = 1; tic <= temps; tic += 1) {
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
  etat.journal.push(
    `${carte.nom} inflige ${carte.degats} — ${etat.ennemi.nom} : ${etat.ennemi.pv}/${etat.ennemi.pvMax} PV.`,
  )

  if (etat.ennemi.pv === 0) {
    etat.issue = 'victoire'
    etat.journal.push(`${etat.ennemi.nom} s'effondre.`)
  }
}

function frapper(etat: EtatCombat): void {
  etat.pv = Math.max(0, etat.pv - etat.ennemi.degats)
  etat.ennemi.compteur = etat.ennemi.periode
  etat.journal.push(
    `${etat.ennemi.nom} frappe : ${etat.ennemi.degats} dégâts — tu es à ${etat.pv}/${etat.pvMax} PV.`,
  )

  if (etat.pv === 0) {
    etat.issue = 'defaite'
    etat.journal.push('Tu tombes. Tout est perdu.')
  }
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

  const tresors = etat.main.filter((carte) => carte.type === 'tresor').length
  etat.journal.push(
    tresors === 0
      ? `Tu pioches ${etat.main.length} cartes.`
      : `Tu pioches ${etat.main.length} cartes, dont ${tresors} trésor(s).`,
  )
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
    journal: [...etat.journal],
  }
}

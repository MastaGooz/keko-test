/**
 * Combat au tour par tour. Pur : aucun accès au DOM, aucun hasard non seedé.
 *
 * Tour du joueur : il dépense une réserve d'**énergie** pour jouer des cartes,
 * chacune sur une cible. Tout résout immédiatement. Puis il finit son tour :
 * les ennemis dont le compteur tombe à 0 frappent, la main entière est
 * défaussée, on repioche et l'énergie se recharge.
 *
 * Le compteur d'un ennemi se compte en **tours**, pas en unités de temps :
 * c'est ce qui reste du tempo après l'abandon de l'horloge partagée. Un
 * ennemi peut frapper chaque tour, ou un tour sur trois en frappant fort.
 *
 * Les transitions exportées ne modifient jamais l'état reçu : elles en font une
 * copie, mutent la copie, et la renvoient.
 */
import type { Rng } from './rng.ts'

/**
 * Ce qu'une carte fait, au-delà de frapper une cible.
 *
 * **Le moteur ne connaissait qu'un coût et des dégâts**, ce qui suffisait au
 * Glaive mais interdisait tout le reste : deux armes ne pouvaient différer que
 * par leur courbe coût/dégâts, et un trésor ne pouvait rien faire du tout. Les
 * effets sont ce qui ouvre le budget de contenu — le « verbe neuf » que la
 * deuxième arme réclamait, et le pouvoir que les trésors réclament.
 *
 * Ils s'ajoutent aux dégâts de la carte, ils ne les remplacent pas : une carte
 * d'arme reste un `degats` et rien d'autre, ce qui laisse intact tout ce qui
 * est calé dessus (l'aperçu sur les jauges, `consequence`, les simulations).
 */
export type Effet =
  /** Frappe tous les corps debout, en plus de la cible. */
  | { type: 'degatsTous'; montant: number }
  /** Rend des PV au joueur, sans dépasser son maximum. */
  | { type: 'soin'; montant: number }
  /** Recharge de l'énergie tout de suite, dans la limite du maximum. */
  | { type: 'energie'; montant: number }

export type Carte = {
  /** Identifiant d'exemplaire, unique dans le deck. */
  id: string
  nom: string
  /**
   * Un trésor ne se joue que s'il porte des `effets` — et le jouer le DÉTRUIT.
   * C'est tout le pari du butin : il vaut de l'or s'il ressort, et il peut
   * sauver la run s'il est brûlé, jamais les deux.
   */
  type: 'combat' | 'tresor'
  /** Énergie consommée. */
  cout: number
  degats: number
  /** Ce que la carte fait en plus de ses dégâts. */
  effets?: Effet[]
  /**
   * La carte est DÉTRUITE à l'usage, au lieu de partir à la défausse : elle ne
   * reviendra pas dans la pioche, et elle ne compte plus dans le butin.
   */
  exil?: boolean
  /**
   * Prix qu'en donnerait le marché noir, une fois la run terminée. Un trésor
   * ne rapporte RIEN en combat ni en fin de combat : il ne devient de l'or
   * qu'au hub, s'il en ressort. Le moteur ne fait que le transporter.
   */
  valeur?: number
}

export type Ennemi = {
  nom: string
  pv: number
  pvMax: number
  degats: number
  /** Nombre de tours entre deux frappes. 1 = il frappe chaque tour. */
  periode: number
  /** Il frappe à la fin du tour où ce compteur atteint 0. */
  compteur: number
}

export type Issue = 'victoire' | 'defaite'

/** Ce qui s'est passé, dans l'ordre. Sert au récit. */
export type Evenement =
  | { tour: number; type: 'debut'; ennemis: string[] }
  | { tour: number; type: 'carte'; nom: string; cible: string; degats: number; pvCible: number }
  | { tour: number; type: 'mort'; nom: string }
  | { tour: number; type: 'frappe'; nom: string; degats: number; pvJoueur: number }
  | { tour: number; type: 'pioche'; cartes: number; tresors: number }
  | { tour: number; type: 'issue'; issue: Issue }

export type EtatCombat = {
  pv: number
  pvMax: number
  /** Les morts restent dans le tableau (pv à 0) : les index de cible ne bougent pas. */
  ennemis: Ennemi[]
  pioche: Carte[]
  main: Carte[]
  defausse: Carte[]
  energie: number
  energieMax: number
  tailleMain: number
  tour: number
  evenements: Evenement[]
  issue: Issue | null
}

export type ConfigCombat = {
  pvMax: number
  tailleMain: number
  energieMax: number
}

export const CONFIG_DEFAUT: ConfigCombat = {
  pvMax: 30,
  tailleMain: 5,
  energieMax: 5,
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
    energie: config.energieMax,
    energieMax: config.energieMax,
    tailleMain: config.tailleMain,
    tour: 1,
    evenements: [{ tour: 1, type: 'debut', ennemis: ennemis.map((e) => e.nom) }],
    issue: null,
  }

  piocher(etat, rng)
  return etat
}

/**
 * Joue la carte de la main à `index` sur l'ennemi `cible`. Elle résout tout de
 * suite et consomme son coût en énergie.
 * Renvoie l'état inchangé si le coup est impossible (combat fini, trésor,
 * énergie insuffisante, cible déjà morte...).
 */
export function jouerCarte(etat: EtatCombat, index: number, cible: number): EtatCombat {
  if (etat.issue !== null) return etat

  const carte = etat.main[index]
  if (carte === undefined || !jouable(carte)) return etat
  if (carte.cout > etat.energie) return etat
  // Une carte qui ne vise personne se joue sans cible valide : un trésor qui
  // soigne reste jouable quand le dernier corps vient de tomber.
  if (viseUneCible(carte) && !estVivant(etat, cible)) return etat

  const suivant = copier(etat)
  suivant.main.splice(index, 1)
  suivant.energie -= carte.cout
  resoudreCarte(suivant, carte, cible)
  return suivant
}

/**
 * Déplace une carte dans la main. Le joueur range sa main comme il veut.
 *
 * Ça n'a **aucun effet sur les règles** — la main est un ensemble, pas une
 * file — mais ça doit quand même passer par l'état : le rendu se reconstruit à
 * chaque action, donc un ordre vivant dans le DOM serait balayé au premier
 * coup joué.
 *
 * Renvoie l'état inchangé si les index ne veulent rien dire, comme toutes les
 * transitions d'ici.
 */
export function reordonnerMain(etat: EtatCombat, de: number, vers: number): EtatCombat {
  if (etat.issue !== null) return etat
  if (de === vers) return etat
  if (de < 0 || de >= etat.main.length) return etat
  if (vers < 0 || vers >= etat.main.length) return etat

  const suivant = copier(etat)
  const [carte] = suivant.main.splice(de, 1)
  if (carte === undefined) return etat
  suivant.main.splice(vers, 0, carte)
  return suivant
}

/**
 * Finit le tour : les ennemis à compteur échu frappent, la main entière part à
 * la défausse, on repioche et l'énergie se recharge.
 */
export function finDuTour(etat: EtatCombat, rng: Rng): EtatCombat {
  if (etat.issue !== null) return etat

  const suivant = copier(etat)

  for (const ennemi of suivant.ennemis) {
    if (ennemi.pv === 0) continue
    ennemi.compteur -= 1
    if (ennemi.compteur > 0) continue
    frapper(suivant, ennemi)
    if (suivant.issue !== null) return suivant
  }

  suivant.tour += 1
  suivant.energie = suivant.energieMax
  piocher(suivant, rng)
  return suivant
}

/** Dégâts encaissés à la fin de ce tour si rien ne change. */
export function menaceDuTour(etat: EtatCombat): number {
  return etat.ennemis
    .filter((ennemi) => ennemi.pv > 0 && ennemi.compteur <= 1)
    .reduce((total, ennemi) => total + ennemi.degats, 0)
}

/**
 * Ce que ferait la carte sur `cible`, sans la jouer. Sans horloge partagée, la
 * question tient en trois faits : est-ce que ça l'achève, est-ce que ça gagne,
 * et combien j'encaisse encore à la fin du tour.
 */
export type Consequence = {
  /** Énergie consommée. */
  cout: number
  /** Le joueur a de quoi la jouer. */
  abordable: boolean
  /** La carte achève la cible. */
  tue: boolean
  /** La carte achève le dernier ennemi debout : le combat s'arrête. */
  gagne: boolean
  /** Dégâts encaissés en fin de tour APRÈS ce coup. */
  menaceApres: number
  /** Dégâts évités par rapport à maintenant, parce que la cible ne frappera plus. */
  evite: number
}

export function consequence(etat: EtatCombat, carte: Carte, cible: number): Consequence {
  const vise = etat.ennemis[cible]
  const tue = vise !== undefined && vise.pv > 0 && carte.degats >= vise.pv
  const debout = etat.ennemis.filter((ennemi) => ennemi.pv > 0).length

  const menace = menaceDuTour(etat)
  const evite = tue && vise !== undefined && vise.compteur <= 1 ? vise.degats : 0

  return {
    cout: carte.cout,
    abordable: carte.cout <= etat.energie,
    tue,
    gagne: tue && debout === 1,
    menaceApres: tue && debout === 1 ? 0 : menace - evite,
    evite,
  }
}

/** Les ennemis encore debout, avec leur index de cible. */
export function vivants(etat: EtatCombat): { ennemi: Ennemi; index: number }[] {
  return etat.ennemis
    .map((ennemi, index) => ({ ennemi, index }))
    .filter((x) => x.ennemi.pv > 0)
}

/**
 * Une carte se joue si elle fait quelque chose : frapper, ou porter un effet.
 * Un trésor sans effet reste ce qu'il a toujours été — du poids.
 */
export function jouable(carte: Carte): boolean {
  return carte.type === 'combat' || (carte.effets?.length ?? 0) > 0
}

/**
 * La carte a-t-elle besoin qu'on lui désigne un corps ?
 *
 * Ce qui frappe tout le monde, soigne ou rend de l'énergie n'a rien à viser —
 * et **demander une cible pour ça serait un geste vide** : deux tapes au lieu
 * d'une, sur un choix qui n'en est pas un.
 */
export function viseUneCible(carte: Carte): boolean {
  return carte.degats > 0
}

function estVivant(etat: EtatCombat, index: number): boolean {
  const ennemi = etat.ennemis[index]
  return ennemi !== undefined && ennemi.pv > 0
}

/** Ce que vaudrait tout le butin transporté, s'il ressortait du donjon. */
export function butin(etat: EtatCombat): number {
  return [...etat.pioche, ...etat.main, ...etat.defausse].reduce(
    (total, carte) => total + (carte.valeur ?? 0),
    0,
  )
}

/** Nombre de trésors qui encombrent la main. */
export function tresorsEnMain(etat: EtatCombat): number {
  return etat.main.filter((carte) => carte.type === 'tresor').length
}

/** Vrai si plus aucune carte de la main n'est jouable avec l'énergie restante. */
export function mainMorte(etat: EtatCombat): boolean {
  return etat.main.every((carte) => !jouable(carte) || carte.cout > etat.energie)
}

// --- interne : tout ce qui suit mute l'état reçu, déjà copié par l'appelant ---

function resoudreCarte(etat: EtatCombat, carte: Carte, cible: number): void {
  // EXILÉE PLUTÔT QUE DÉFAUSSÉE : elle ne reviendra pas dans la pioche, et
  // `butin()` ne la compte plus — brûler un trésor, c'est perdre son or.
  if (carte.exil !== true) etat.defausse.push(carte)

  for (const effet of carte.effets ?? []) appliquerEffet(etat, effet)

  const ennemi = etat.ennemis[cible]
  if (ennemi === undefined || ennemi.pv === 0) return

  ennemi.pv = Math.max(0, ennemi.pv - carte.degats)
  etat.evenements.push({
    tour: etat.tour,
    type: 'carte',
    nom: carte.nom,
    cible: ennemi.nom,
    degats: carte.degats,
    pvCible: ennemi.pv,
  })

  if (ennemi.pv === 0) {
    etat.evenements.push({ tour: etat.tour, type: 'mort', nom: ennemi.nom })
    if (etat.ennemis.every((autre) => autre.pv === 0)) terminer(etat, 'victoire')
  }
}

function appliquerEffet(etat: EtatCombat, effet: Effet): void {
  switch (effet.type) {
    case 'soin':
      etat.pv = Math.min(etat.pvMax, etat.pv + effet.montant)
      break
    case 'energie':
      etat.energie = Math.min(etat.energieMax, etat.energie + effet.montant)
      break
    case 'degatsTous':
      for (const ennemi of etat.ennemis) {
        if (ennemi.pv === 0) continue
        ennemi.pv = Math.max(0, ennemi.pv - effet.montant)
        etat.evenements.push({
          tour: etat.tour,
          type: 'carte',
          nom: 'onde',
          cible: ennemi.nom,
          degats: effet.montant,
          pvCible: ennemi.pv,
        })
        if (ennemi.pv === 0) etat.evenements.push({ tour: etat.tour, type: 'mort', nom: ennemi.nom })
      }
      if (etat.ennemis.every((autre) => autre.pv === 0)) terminer(etat, 'victoire')
      break
  }
}

function frapper(etat: EtatCombat, ennemi: Ennemi): void {
  etat.pv = Math.max(0, etat.pv - ennemi.degats)
  ennemi.compteur = ennemi.periode
  etat.evenements.push({
    tour: etat.tour,
    type: 'frappe',
    nom: ennemi.nom,
    degats: ennemi.degats,
    pvJoueur: etat.pv,
  })

  if (etat.pv === 0) terminer(etat, 'defaite')
}

function terminer(etat: EtatCombat, issue: Issue): void {
  etat.issue = issue
  etat.evenements.push({ tour: etat.tour, type: 'issue', issue })
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
    tour: etat.tour,
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

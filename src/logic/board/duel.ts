/**
 * LE DUEL — deux joueurs posent à tour de rôle, le total sur la grille PLEINE
 * désigne le vainqueur.
 *
 * Demandé par Keko : « chaque joueur pose un perso à tour de rôle, et plutôt
 * qu'un score au tick, chaque perso marque des points et le total quand la grid
 * est pleine donne le vainqueur ».
 *
 * **CE MODULE EST PUR**, comme tout `logic/` : pas de DOM, pas d'horloge, et le
 * graphe de liens lui est **injecté**. Il réutilise `plateau.ts` pour tout ce
 * qui ne change pas — l'adjacence, la distance, le barème — parce que *deux
 * endroits qui calculeraient le même bonus se désaccorderaient au premier
 * réglage.*
 *
 * ### LE SCORE SE LIT SUR LA GRILLE FINALE, ET C'EST CE QUI FERME UNE QUESTION
 *
 * Un couple côte à côte paie **ses deux cartes**, donc poser contre une carte
 * adverse **la fait marquer autant que soi** — et c'est tout le dilemme du mode.
 *
 * *L'autre règle imaginable — « celui qui pose encaisse tout le couple » —
 * est INCOMPATIBLE avec ce que Keko demande* : elle a besoin de savoir qui a
 * posé en dernier, donc le score ne se lit plus sur la grille, il s'accumule.
 * **Mesuré, elle supprimait aussi le dilemme** : l'adversaire ne gagnant jamais
 * rien, un bot qui maximise son score et un bot qui cherche à le priver
 * devenaient le MÊME bot, au chiffre près.
 *
 * ### CE QUE LA MESURE DIT DU MODE (400 parties, bots gloutons)
 *
 * | | J1 gagne | nuls | matchs serrés |
 * |---|---|---|---|
 * | **alterné** (1-1-1…) | **15 %** | 7 % | 41 % |
 * | **serpent** (1-2-2…) | **30 %** | 6 % | 48 % |
 *
 * **LE SECOND JOUEUR EST FAVORISÉ, ET C'EST STRUCTUREL** : il voit toujours un
 * coup de plus, et sur huit coups ça s'accumule. *L'ordre de pose ne change
 * pourtant rien au total* — chaque couple est compté une fois, où qu'il
 * arrive — donc **l'avantage est d'INFORMATION, pas de score.**
 *
 * Le serpent le réduit de moitié sans rien changer d'autre : chacun pose
 * toujours huit cartes, mais les coups se répondent par paires. *À rouvrir avec
 * Keko* — il a demandé « à tour de rôle », donc l'alterné est le défaut.
 *
 * **Et jouer bien compte** : un bot glouton bat le hasard 84 à 86 % du temps,
 * pour douze points d'écart.
 *
 * **MAIS CHERCHER À PRIVER L'ADVERSAIRE FAIT PERDRE** — mesuré, un bot qui
 * maximise `son gain − le gain qu'il concède` se fait battre 76 % du temps par
 * un bot qui maximise simplement son propre gain. *En évitant les cartes
 * adverses, on se prive des positions où ses PROPRES cartes se groupent* — et
 * une carte entre deux des siennes encaisse le couple deux fois.
 */

import {
  bonusDuCouple,
  couples,
  grappes,
  lies,
  tirer,
  valeurDe,
  type Distances,
  type Graphe,
  type Jeton,
  type Reglage,
} from './plateau.ts'

/** Qui joue. `-1` sur une case vide. */
export type Camp = 0 | 1

/** Dans quel ordre les tours se distribuent. */
export type Ordre = 'alterne' | 'serpent'

export interface ReglageDuel {
  /** Côté de la grille. 4 fait seize cases, donc huit cartes par joueur. */
  readonly cote: number
  /** Ce qu'une carte posée vaut, seule. */
  readonly base: number
  /** Le bonus d'un couple vaut `portee - sauts`. Voir `plateau.ts`. */
  readonly portee: number
  /**
   * **L'ORDRE DES TOURS, et c'est le seul correctif de l'avantage du second.**
   * `alterne` est la demande littérale de Keko ; `serpent` fait tomber son
   * avantage de 85 % à 70 % en laissant chacun poser huit cartes.
   */
  readonly ordre: Ordre
  /**
   * **CE QU'UN COUPLE MIXTE FAIT.** Tranché par Keko : « et si les liens avec
   * les cartes ennemies diminuaient le score au lieu de s'ajouter ? »
   *
   * - `plus` : il PAIE ses deux cartes (la règle d'origine) ;
   * - `moins` : il RETIRE à ses deux cartes — le défaut ;
   * - `plancher` : il retire, **mais une carte ne descend jamais sous zéro.**
   *
   * *Les deux premières sont symétriques, donc neutres sur l'ÉCART* : mesuré
   * sur 300 grilles, `plus` et `moins` donnent le même écart au point près.
   * **Seul `plancher` casse la symétrie** et fait changer le vainqueur — 65
   * grilles sur 300.
   */
  readonly mixte: Mixte
  /** Dans combien de cartes du pool les mains se tirent. */
  readonly sousPool: number
  /**
   * **CE QUE LA TAILLE DE L'ARTICLE FAIT AU SCORE.** Tranche par Keko : « taille
   * = on prend comme valeur ».
   *
   * - `un` : rien, chaque carte vaut la base. C'est le mode d'avant.
   * - `taille` : **la taille EST le score de base** — la demande litterale.
   * - `bonus` : la taille MULTIPLIE le bonus du couple, la base reste a 1.
   *
   * **ET LE CHOIX N'EST PAS NEUTRE, c'est mesure** : on pose toute sa main,
   * donc *la somme des bases est fixee au tirage.* Sous `taille`, 75 % du score
   * cesse de se jouer et **deux parties sur trois sont gagnees par celui qui a
   * tire la plus grosse main** (65 %, contre 34 % a base fixe). Sous `bonus`,
   * ce chiffre retombe a 36 % — le niveau de la reference — *et la page compte
   * quand meme, puisqu'une grosse carte mal placee devient un gachis.*
   */
  readonly valeur: Valeur
  /**
   * **COMMENT LE GRAPHE PAIE.** Tranche par Keko : « le systeme est pas bon, on
   * exploite pas les noeuds... ca devait etre le truc central ».
   *
   * - `reseau` : **tes cartes qui se touchent ET se relient forment une GRAPPE**,
   *   et chaque carte vaut son score multiplie par la taille de sa grappe. Le
   *   defaut.
   * - `distance` : le barème d'avant, un bonus `portee - sauts` par couple.
   *   `?duel&systeme=distance` le rend — *ce qui a servi a choisir doit rester
   *   ouvrable.*
   *
   * **Mesure, 200 parties, ecart normalise par le score moyen** : ce que coute
   * de jouer au hasard passe de **18 a 53 %**, et un bot geometre qui prend le
   * centre avec des cartes au hasard tombe de **57 a 20 %.** *Premiere fois dans
   * ce proto que les deux criteres bougent du bon cote en meme temps.*
   *
   * **SOUS `reseau`, `portee`, `mixte` ET `valeur` NE FONT PLUS RIEN** : il n'y a
   * pas de couple mixte — une grappe appartient a un camp par definition — et le
   * score ne multiplie plus un bonus, il EST ce qu'on multiplie. *Ils restent
   * parce que `distance` les lit encore.*
   */
  readonly systeme: Systeme
  /**
   * **LA RARETE COMME JOKER** : une carte d'or se relie a tout ce qu'elle touche.
   *
   * *Hors mesure* — le reseau a ete mesure sans elle — donc elle vit derriere
   * `?duel&joker`, le temps que Keko compare. **C'est le seul emploi propose pour
   * la rarete dans la mecanique** : jusqu'ici elle ne faisait que le cadre.
   */
  readonly joker: boolean
}

/** Comment le graphe paie. Voir `ReglageDuel.systeme`. */
export type Systeme = 'reseau' | 'distance'

/** Ce qu'un couple mixte fait au score. Voir `ReglageDuel.mixte`. */
export type Mixte = 'plus' | 'moins' | 'plancher'

/** Ce que la taille de l'article fait au score. Voir `ReglageDuel.valeur`. */
export type Valeur = 'un' | 'taille' | 'bonus'

/**
 * LA VALEUR D'UN COUPLE MOYEN, pour que le mode `bonus` ne deplace pas l'echelle.
 *
 * **Mesure, pas choisie** : la mediane de `defense` sur le sous-pool de 300 vaut
 * 7 (moyenne 7,11). *Un couple moyen garde donc son bonus nominal*, et seuls les
 * extremes s'ecartent — ce qui est exactement ce qu'on veut d'un multiplicateur.
 *
 * *A relire si le sous-pool change de taille* : la distribution de `defense` n'est
 * pas la meme sur le catalogue entier que sur ses 300 plus notoires.
 */
export const VALEUR_PIVOT = 7

export const REGLAGE_DUEL: ReglageDuel = {
  cote: 4,
  base: 1,
  portee: 5,
  ordre: 'alterne',
  mixte: 'moins',
  sousPool: 300,
  valeur: 'taille',
  systeme: 'reseau',
  joker: false,
}

/**
 * **LE NOMBRE DE CARTES PAR JOUEUR N'EST PAS UN RÉGLAGE**, c'est la moitié des
 * cases : *sinon la grille ne se remplit pas exactement, et « le total quand la
 * grille est pleine » cesse d'avoir un sens.*
 */
export function parJoueur(r: ReglageDuel): number {
  return (r.cote * r.cote) / 2
}

export interface Duel {
  readonly reglage: ReglageDuel
  /** `cote * cote` cases, dans l'ordre des lignes. */
  readonly grille: readonly (Jeton | null)[]
  /** À qui est la carte de chaque case. `-1` si la case est vide. */
  readonly camps: readonly (Camp | -1)[]
  readonly mains: readonly [readonly Jeton[], readonly Jeton[]]
  /** Combien de cartes ont été posées. C'est lui qui dit à qui est le tour. */
  readonly poses: number
}

export function duelVide(
  reglage: ReglageDuel,
  main0: readonly Jeton[],
  main1: readonly Jeton[],
): Duel {
  const n = reglage.cote * reglage.cote
  return {
    reglage,
    grille: Array.from({ length: n }, () => null),
    camps: Array.from({ length: n }, () => -1 as const),
    mains: [main0, main1],
    poses: 0,
  }
}

/**
 * À QUI EST LE TOUR.
 *
 * Le serpent donne `0, 1, 1, 0, 0, 1, 1, 0, …` — *une seule formule, pas une
 * table* : c'est le quart de tour qui change de camp, donc `((n + 1) >> 1) & 1`.
 * Vérifié : les deux ordres donnent exactement la moitié des coups à chacun.
 */
export function campDuTour(d: Duel): Camp {
  if (d.reglage.ordre === 'serpent') return (((d.poses + 1) >> 1) & 1) as Camp
  return (d.poses & 1) as Camp
}

/** La grille est pleine : plus rien à poser, le score est définitif. */
export function fini(d: Duel): boolean {
  return d.poses >= d.grille.length
}

/**
 * POSER UNE CARTE DU CAMP DONT C'EST LE TOUR SUR UNE CASE LIBRE.
 *
 * **Il n'y a ni déplacement ni reprise**, à la différence du plateau solo : *un
 * coup qu'on peut défaire n'est pas un coup*, et le dernier à jouer pourrait
 * refaire toute la grille. Un dépôt impossible rend l'état inchangé.
 */
export function poserDuel(d: Duel, idMain: string, case_: number): Duel {
  if (fini(d)) return d
  if (case_ < 0 || case_ >= d.grille.length) return d
  if (d.grille[case_] !== null) return d
  const camp = campDuTour(d)
  const main = d.mains[camp]
  const i = main.findIndex((j) => j.id === idMain)
  if (i < 0) return d
  const grille = [...d.grille]
  grille[case_] = main[i] as Jeton
  const camps = [...d.camps]
  camps[case_] = camp
  const restante = [...main]
  restante.splice(i, 1)
  const mains: [readonly Jeton[], readonly Jeton[]] =
    camp === 0 ? [restante, d.mains[1]] : [d.mains[0], restante]
  return { ...d, grille, camps, mains, poses: d.poses + 1 }
}

/**
 * CE QUE CHAQUE CARTE RAPPORTE À SON CAMP — case par case.
 *
 * *On rend le détail et pas seulement les deux totaux* : c'est ce chiffre que
 * l'écran pose sur la carte, exactement comme en solo.
 */
/**
 * CE QU'UNE CARTE VAUT SEULE, SELON LE MODE — et c'est une REGLE.
 *
 * Sous `taille` la base EST la valeur de la carte ; sous `bonus` et `un` elle
 * reste la base du reglage, et c'est le couple qui porte la valeur.
 *
 * *Elle vit ici et non dans l'ecran* parce que l'ecran l'affiche sur la carte et
 * s'en sert pour decider si une case « ne rapporte que la base » : **deux
 * endroits qui calculeraient le meme chiffre se desaccorderaient au premier
 * reglage.**
 */
export function baseDeLaCarte(r: ReglageDuel, j: Jeton): number {
  // SOUS `reseau`, LE SCORE DE LA CARTE EST CE QU'ON MULTIPLIE : une carte seule
  // vaut son score, et `valeur` n'a plus d'objet. *Le dire ici plutot que dans
  // `pointsParCase` garde UN seul endroit ou « ce que vaut une carte » se decide.*
  if (r.systeme === 'reseau') return valeurDe(j, r.base)
  return r.valeur === 'taille' ? valeurDe(j, r.base) : r.base
}

/**
 * CE QUI RELIE DEUX CARTES, selon le reglage.
 *
 * *La regle ne sait pas ce qu'est un metier ni une rarete* : elle recoit un
 * graphe et une etiquette, et c'est ce qui lui permet d'etre vraie pour les deux
 * criteres — **le rendu construit le graphe qu'il veut** (le lien d'article, ou
 * le metier partage, mesure comme le seul qui porte une structure).
 */
function joint(r: ReglageDuel, graphe: Graphe, a: Jeton, b: Jeton): boolean {
  if (lies(graphe, a.id, b.id)) return true
  return r.joker && (estJoker(a) || estJoker(b))
}

/** Une carte d'or ou mieux. *Le haut de l'echelle des metaux, rien d'autre.* */
function estJoker(j: Jeton): boolean {
  return j.rarete === 'epique' || j.rarete === 'legendaire'
}

/**
 * LA TAILLE DE LA GRAPPE DE CHAQUE CASE — `0` sur une case vide.
 *
 * **Une grappe, c'est ce qui se touche ET se relie, dans le MEME camp.** *Il
 * faut les deux* : le lien seul se passerait de grille — autant jouer sans
 * plateau — et l'adjacence seule est le defaut qu'on vient de mesurer, ou seule
 * la place compte.
 *
 * *Une seule fonction pour le score ET pour l'affichage* : l'ecran montre la
 * taille dans sa bulle, et **deux endroits qui compteraient la meme grappe se
 * desaccorderaient au premier reglage.**
 */
export function taillesDeGrappe(d: Duel, graphe: Graphe): readonly number[] {
  const out = d.grille.map(() => 0)
  for (const camp of [0, 1] as const) {
    const g = grappes(
      d.grille,
      (c) => d.camps[c] === camp,
      d.reglage.cote,
      (a, b) => joint(d.reglage, graphe, a, b),
    )
    for (const grp of g) for (const c of grp) out[c] = grp.length
  }
  return out
}

/**
 * CE QUE LA CARTE VAUT, TEL QU'ON L'AFFICHE.
 *
 * **Sous `bonus`, la base ne varie plus** — toutes les cartes valent 1 — donc
 * le coin haut-gauche ne dirait plus rien, et le score qui porte desormais
 * toute la decision n'apparaitrait nulle part. *Un chiffre identique sur les
 * seize cases ne designe aucune case*, la regle de l'apercu.
 *
 * Sous `un` et `taille`, la base EST ce que la carte vaut : il n'y a qu'un
 * chiffre, et c'est celui-la.
 */
/**
 * LES DEUX MAINS ONT LA MEME SOMME DE SCORES, A UN POINT PRES.
 *
 * Keko : « ce score ne sert a rien si quand on pose la carte elle vaut 1 ? » —
 * **et c'est le tirage LIBRE qui l'empechait de servir**, pas le score en base.
 *
 * *Mesure* : a mains libres, celui qui tire les plus gros scores gagne **85 %**
 * des parties ; a mains appariees, **52 %** — c'est-a-dire le hasard pur, donc
 * plus aucun avantage de tirage. ***Le defaut n'etait pas « le score donne des
 * points », c'etait « les deux joueurs ne recoivent pas la meme chose ».***
 *
 * On tire 2N cartes, on les classe par score et **on distribue par PAIRES** : le
 * plus fort de chaque paire va alternativement a l'un puis a l'autre. *Un serpent
 * sur toute la liste equilibrerait aussi les sommes, mais ne garantirait pas N
 * cartes chacun quand 2N n'est pas multiple de quatre.*
 */
export function distribuer(
  reglage: ReglageDuel,
  pool: readonly Jeton[],
  rng: () => number,
): readonly [readonly Jeton[], readonly Jeton[]] {
  const n = parJoueur(reglage)
  const t = [...tirer(pool, 2 * n, rng)].sort(
    (a, b) => valeurDe(b, reglage.base) - valeurDe(a, reglage.base),
  )
  const m0: Jeton[] = []
  const m1: Jeton[] = []
  for (let k = 0; k * 2 + 1 < t.length; k++) {
    const [fort, faible] = [t[k * 2] as Jeton, t[k * 2 + 1] as Jeton]
    if (k % 2 === 0) {
      m0.push(fort)
      m1.push(faible)
    } else {
      m1.push(fort)
      m0.push(faible)
    }
  }
  return [m0, m1]
}

export function scoreDeLaCarte(r: ReglageDuel, j: Jeton): number {
  return r.valeur === 'bonus' ? valeurDe(j, VALEUR_PIVOT) : baseDeLaCarte(r, j)
}

export function pointsParCase(d: Duel, graphe: Graphe, cache?: Distances): readonly number[] {
  // **LE RESEAU : CHAQUE CARTE VAUT SON SCORE x LA TAILLE DE SA GRAPPE.**
  //
  // *C'est la superlinearite qui fait le jeu* : deux grappes de trois valent
  // 2 x 3 x 3 = 18 points de multiplicateur, une grappe de six en vaut 36 —
  // donc **relier deux grappes ne les additionne pas, ca double tout.** Le PONT
  // devient l'enjeu permanent, et il se voit a l'oeil sur la grille.
  if (d.reglage.systeme === 'reseau') {
    const t = taillesDeGrappe(d, graphe)
    return d.grille.map((j, i) => (j === null ? 0 : baseDeLaCarte(d.reglage, j) * (t[i] ?? 1)))
  }
  const { valeur } = d.reglage
  const par = d.grille.map((j) => (j === null ? 0 : baseDeLaCarte(d.reglage, j)))
  for (const [i, k] of couples(d.reglage.cote)) {
    const a = d.grille[i]
    const b = d.grille[k]
    if (a == null || b == null) continue
    let gain = bonusDuCouple(bareme(d.reglage), graphe, a.id, b.id, cache)
    // SOUS `bonus`, LE COUPLE PAIE AU PRORATA DES DEUX CARTES : une grosse carte
    // bien placee rapporte plus, une grosse carte isolee ne rapporte rien.
    // *C'est ce qui fait compter la page SANS que le tirage decide la partie.*
    //
    // **UNE CARTE SANS VALEUR VAUT LE PIVOT ICI, PAS LA BASE** : le
    // multiplicateur doit alors etre NEUTRE. *Pose a la base, il valait 1/7 et
    // le mode effacait le bonus de toute carte qui n'en portait pas* -- donc un
    // mode qui ne devait que ponderer supprimait la mecanique.
    if (valeur === 'bonus')
      gain = Math.round(
        (gain * (valeurDe(a, VALEUR_PIVOT) + valeurDe(b, VALEUR_PIVOT))) / 2 / VALEUR_PIVOT,
      )
    if (gain === 0) continue
    // UN COUPLE MIXTE RETIRE, un couple propre ajoute — et dans les deux cas
    // il porte sur SES DEUX CARTES. *Le faire porter sur une seule demanderait
    // de savoir qui a posé en dernier*, donc le score ne se lirait plus sur la
    // grille.
    const signe = d.camps[i] === d.camps[k] ? 1 : d.reglage.mixte === 'plus' ? 1 : -1
    par[i] = (par[i] ?? 0) + gain * signe
    par[k] = (par[k] ?? 0) + gain * signe
  }
  // LE PLANCHER EST CE QUI CASSE LA SYMÉTRIE : une carte isolée ne perd rien,
  // une carte bien placée perd tout — donc amputer l'adversaire devient un
  // coup. *C'est la seule des trois règles qui déplace l'écart.*
  if (d.reglage.mixte === 'plancher')
    for (let i = 0; i < par.length; i++) if ((par[i] ?? 0) < 0) par[i] = 0
  return par
}

/** Le total de chaque camp, lu sur la grille. */
export function scoresDuel(
  d: Duel,
  graphe: Graphe,
  cache?: Distances,
): readonly [number, number] {
  const par = pointsParCase(d, graphe, cache)
  const out: [number, number] = [0, 0]
  for (let i = 0; i < d.grille.length; i++) {
    const c = d.camps[i]
    if (c === 0 || c === 1) out[c] += par[i] ?? 0
  }
  return out
}

/** Ce qu'un coup rapporterait : à soi, et à l'adversaire. */
export interface Gain {
  readonly moi: number
  readonly lui: number
}

/**
 * CE QU'UNE CARTE RAPPORTERAIT SUR CHAQUE CASE, **aux DEUX camps.**
 *
 * `null` sur une case occupée — *on n'y pose pas, donc il n'y a rien à
 * promettre* ; c'est la règle que Keko a déjà tranchée en solo.
 *
 * **C'est le dilemme du mode, et il faut les deux chiffres pour le voir** : une
 * case peut être la meilleure pour soi ET la plus généreuse pour l'adversaire.
 * *N'afficher que son propre gain cacherait précisément ce qu'il y a à décider.*
 */
/**
 * **L'APERÇU SE CALCULE PAR DIFFÉRENCE DE SCORES, il ne refait pas la règle.**
 *
 * C'était une somme de couples, ce qui était juste tant que le barème était
 * additif — *le plancher, lui, est une borne par CARTE*, donc poser peut
 * remonter une carte voisine déjà tombée à zéro. Une somme ne peut pas le voir.
 *
 * Et ça garantit ce qui compte : **l'aperçu dit exactement ce que le score
 * fera.** C'est la règle du projet — *le rendu demande la règle, il ne la
 * recopie pas.*
 */
export function gainsDuel(
  d: Duel,
  graphe: Graphe,
  pose: Jeton,
  camp: Camp,
  cache?: Distances,
): readonly (Gain | null)[] {
  const avant = scoresDuel(d, graphe, cache)
  // **ON PREND LE JETON ENTIER, PLUS SON SEUL IDENTIFIANT.** *« Seul
  // l'identifiant compte » a cesse d'etre vrai le jour ou la carte porte une
  // VALEUR* : un aperçu qui l'ignorerait annoncerait un chiffre que le score ne
  // rendrait pas — et c'est tout ce qu'on demande a un aperçu.
  return d.grille.map((occupant, case_) => {
    if (occupant !== null) return null
    const grille = d.grille.slice()
    const camps = d.camps.slice()
    grille[case_] = pose
    camps[case_] = camp
    const apres = scoresDuel({ ...d, grille, camps }, graphe, cache)
    return {
      moi: (apres[camp] ?? 0) - (avant[camp] ?? 0),
      lui: (apres[1 - camp] ?? 0) - (avant[1 - camp] ?? 0),
    }
  })
}

/**
 * LE COUP DU BOT : **il maximise son propre gain, et rien d'autre.**
 *
 * *C'est contre-intuitif et c'est mesuré* : un bot qui retranche ce qu'il
 * concède à l'adversaire se fait battre 76 % du temps. **En évitant les cartes
 * adverses, on se prive des positions où ses propres cartes se groupent** — et
 * une carte posée entre deux des siennes encaisse le couple deux fois.
 *
 * Départage par la case la plus tôt dans l'ordre de lecture, pour que *le même
 * duel rejoué rende le même coup* : rien ici ne tire au sort.
 */
/**
 * **LE BOT JUGE SUR L'ÉCART, pas sur son propre score.** Keko : « pourquoi +7
 * est considéré meilleur que +3 et −4 ? » — *il ne l'est pas* : gagner 3 en
 * amputant l'autre de 4 déplace l'écart de 7, exactement comme gagner 7.
 *
 * Et **c'est l'écart qui désigne le vainqueur**, donc c'est lui qu'on maximise.
 * Mesuré : avec son score brut pour critère, le bot se fait battre à **65 %**
 * sous le barème par défaut — *il fuyait l'adversaire, ce qui est neutre, et se
 * privait au passage des cases centrales.*
 */
export function coupDuBot(
  d: Duel,
  graphe: Graphe,
  cache?: Distances,
): { readonly id: string; readonly case: number } | null {
  if (fini(d)) return null
  const camp = campDuTour(d)
  let best: { id: string; case: number; note: number } | null = null
  for (const j of d.mains[camp]) {
    const g = gainsDuel(d, graphe, j, camp, cache)
    for (let i = 0; i < g.length; i++) {
      const v = g[i]
      if (v == null) continue
      const note = v.moi - v.lui
      if (best === null || note > best.note) best = { id: j.id, case: i, note }
    }
  }
  return best === null ? null : { id: best.id, case: best.case }
}

/** Les identifiants déjà distribués — pour qu'un tirage n'en double aucun. */
export function enJeuDuel(d: Duel): ReadonlySet<string> {
  const s = new Set<string>()
  for (const main of d.mains) for (const j of main) s.add(j.id)
  for (const j of d.grille) if (j !== null) s.add(j.id)
  return s
}

/**
 * LE BARÈME SE PRÊTE À `plateau.ts` SANS LE RECOPIER.
 *
 * `bonusDuCouple` demande un `Reglage` complet, dont il ne lit que `portee` ;
 * *lui passer un objet construit ici garde UNE seule définition du bonus*, et
 * c'est tout ce qu'on cherche — les deux modes doivent payer pareil.
 */
function bareme(r: ReglageDuel): Reglage {
  return { cote: r.cote, tick: 0, base: r.base, portee: r.portee, main: 0, booster: 0, sousPool: r.sousPool }
}

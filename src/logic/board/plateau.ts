/**
 * LE PLATEAU — un prototype pour éprouver UNE question : poser des cartes sur
 * une grille pour maximiser un score, est-ce amusant ?
 *
 * Il ne contient donc rien d'autre : pas de marché, pas de quêtes, pas de
 * progression. *Ce qui ne sert pas à répondre à la question n'a pas sa place
 * ici.*
 *
 * **CE MODULE EST PUR**, comme tout `logic/` : il ne lit aucun fichier, ne
 * connaît pas le DOM et ne tire au sort que par le RNG qu'on lui passe. Le
 * graphe de liens lui est **injecté** — c'est le motif du catalogue et du
 * `StoragePort`, et c'est ce qui rend la production testable sans navigateur.
 */

/** Les réglages. **C'est le seul endroit à toucher pour itérer.** */
export interface Reglage {
  /** Côté de la grille. 4 fait seize cases et vingt-quatre couples adjacents. */
  readonly cote: number
  /** Millisecondes entre deux ticks. */
  readonly tick: number
  /** Ce qu'une carte posée produit, seule. */
  readonly base: number
  /**
   * LA PORTÉE DU BONUS DE VOISINAGE : `portee - sauts`.
   *
   * Formule de Keko : « bonus = 5 - nombre de sauts (0 si pas joignable) ». À
   * `portee: 5`, un lien direct vaut 4, un intermédiaire 3, deux 2, trois 1, et
   * rien au-delà. **Les DEUX cartes du couple le gagnent.**
   *
   * *Elle se calcule de tête*, et c'est ce qui l'a fait préférer à une table de
   * valeurs : **une règle qu'un joueur peut refaire dans sa tête est jouable,
   * une table qu'il doit apprendre ne l'est pas.**
   *
   * **UN SEUL CHIFFRE LA RÈGLE, ET IL EST MESURÉ** (300 mains, le score d'un
   * arrangement optimisé contre un placement au hasard) :
   *
   * | portée | ce que coûte de jouer au hasard |
   * |---|---|
   * | 3 (4, 2) | 46 % |
   * | 4 (3, 2, 1) | 44 % |
   * | **5 (4, 3, 2, 1)** | **42 %** |
   * | 6 (5, 4, 3, 2, 1) | 39 % |
   *
   * *Ce qui coûte, c'est la longueur de la queue* : à portée 5 on paie jusqu'à
   * quatre sauts, donc **92 % des couples rapportent quelque chose** et le bonus
   * devient un plancher. La règle d'avant — lien direct seulement, +1 — ne
   * coûtait que **19 %** : la formule vaut deux fois mieux quoi qu'il arrive.
   *
   * Une table non linéaire ferait un peu mieux (`[4, 2]` : 55 %) ; elle a été
   * écartée parce qu'elle ne se dit pas en une phrase.
   */
  readonly portee: number
  /** Cartes de la main de départ. */
  readonly main: number
  /** Cartes qu'un booster ajoute. */
  readonly booster: number
  /**
   * Dans combien de cartes du pool la main se tire.
   *
   * **MESURÉ, ET C'EST LE CHIFFRE QUI DÉCIDE SI LE JEU EXISTE** : sur les trois
   * mille cartes, deux prises au hasard ne sont liées que dans 0,25 % des cas —
   * donc *neuf mains sur dix n'auraient aucune synergie possible*, et
   * l'arrangement ne changerait jamais le score.
   *
   * Le graphe est porté par les notoires : sur les cinquante premières, la
   * densité monte à neuf pour cent et il ne reste qu'un pour cent de mains
   * stériles. **Le catalogue étant trié par notoriété décroissante, prendre les
   * N premiers suffit.**
   *
   * `?board&pool=1000` l'essaie en direct : *ce qui a servi à choisir doit
   * rester ouvrable.*
   */
  readonly sousPool: number
}

export const REGLAGE: Reglage = {
  cote: 4,
  tick: 5000,
  base: 1,
  portee: 5,
  main: 10,
  booster: 5,
  sousPool: 300,
}

/** Ce que le plateau sait d'une carte. *Il n'a besoin de rien d'autre.* */
export interface Jeton {
  readonly id: string
  readonly nom: string
  readonly image: string
  readonly rarete: string
}

/**
 * LE GRAPHE, INJECTÉ : `id -> voisins`.
 *
 * *Il est non orienté et déjà symétrisé par le script* — mais `lies()` vérifie
 * les deux sens quand même : **une symétrisation qui se fait à deux endroits se
 * désaccorde au premier réglage**, et celle-ci ne coûte rien.
 */
export type Graphe = Readonly<Record<string, readonly string[]>>

/** L'état complet d'une partie. `null` dans `grille` = case vide. */
export interface Plateau {
  readonly reglage: Reglage
  /** `cote * cote` cases, dans l'ordre des lignes. */
  readonly grille: readonly (Jeton | null)[]
  readonly main: readonly Jeton[]
  readonly ressource: number
  readonly ticks: number
}

export function plateauVide(reglage: Reglage, main: readonly Jeton[]): Plateau {
  return {
    reglage,
    grille: Array.from({ length: reglage.cote * reglage.cote }, () => null),
    main,
    ressource: 0,
    ticks: 0,
  }
}

/** Deux cartes sont liées si l'une pointe vers l'autre — la distance vaut 1. */
export function lies(graphe: Graphe, a: string, b: string): boolean {
  return (graphe[a]?.includes(b) ?? false) || (graphe[b]?.includes(a) ?? false)
}

/** De quoi retenir les distances déjà cherchées. *Le cache vit avec le graphe.* */
export type Distances = Map<string, number>

/**
 * LE GRAPHE REFERMÉ DANS LES DEUX SENS — **à appeler une fois, au chargement.**
 *
 * `lies()` peut se permettre de regarder les deux sens à la demande ; **un
 * PARCOURS ne peut pas.** Il avance de voisin en voisin, donc une arête écrite
 * dans un seul sens est un cul-de-sac : avec `{ B: ['C'] }`, partir de C ne mène
 * nulle part, et la distance C–B sortirait infinie alors qu'elles sont liées.
 *
 * *Le fichier du script est déjà symétrisé*, donc ça ne change rien en jeu —
 * mais **une fonction qui rend un résultat faux sur une entrée légale est une
 * fonction fausse**, et une passe sur vingt-sept mille arêtes ne coûte rien.
 */
export function symetrique(graphe: Graphe): Graphe {
  const out = new Map<string, Set<string>>()
  const ajoute = (a: string, b: string): void => {
    const s = out.get(a)
    if (s === undefined) out.set(a, new Set([b]))
    else s.add(b)
  }
  for (const [a, vs] of Object.entries(graphe))
    for (const b of vs) {
      ajoute(a, b)
      ajoute(b, a)
    }
  const plat: Record<string, readonly string[]> = {}
  for (const [a, s] of out) plat[a] = [...s]
  return plat
}

/**
 * LA DISTANCE ENTRE DEUX CARTES, EN SAUTS. `Infinity` au-delà de `max`.
 *
 * **Bornée, parce qu'un parcours complet coûte trop cher pour un rendu** :
 * vingt-quatre couples sur vingt-sept mille arêtes, et le rendu recommence à
 * chaque geste. On ne cherche que jusqu'à `max` — et *ce qui est au-delà ne
 * rapporte rien de toute façon*, donc la borne ne perd aucune information.
 *
 * **Et par les DEUX bouts à la fois.** À dix-huit voisins par carte, quatre
 * sauts d'un seul côté visitent cent mille noeuds ; deux fois deux sauts en
 * visitent six cents. *La borne divise le travail, la bidirection le divise
 * encore* — et c'est ce qui rend la règle tenable à chaque image.
 *
 * **Mémoïsée** parce que la grille ne bouge pas entre deux gestes : sans cache,
 * la même paire se redemanderait indéfiniment.
 *
 * **LE GRAPHE DOIT ÊTRE SYMÉTRIQUE** — voir `symetrique()`.
 */
export function distance(
  graphe: Graphe,
  a: string,
  b: string,
  max: number,
  cache?: Distances,
): number {
  if (a === b) return 0
  if (max < 1) return Infinity
  const cle = a < b ? `${a}|${b}` : `${b}|${a}`
  const garde = cache?.get(cle)
  if (garde !== undefined) return garde

  // Deux fronts qui avancent l'un vers l'autre. Chacun retient la distance a
  // SON depart, donc une rencontre donne la somme des deux.
  const deA = new Map<string, number>([[a, 0]])
  const deB = new Map<string, number>([[b, 0]])
  let frontA: string[] = [a]
  let frontB: string[] = [b]
  let profA = 0
  let profB = 0
  let k = Infinity
  // Tant qu'une rencontre reste possible SOUS la borne.
  while (k === Infinity && frontA.length > 0 && frontB.length > 0 && profA + profB < max) {
    // ON ÉTEND LE PLUS PETIT DES DEUX : c'est tout l'intérêt de la bidirection.
    const aGauche = frontA.length <= frontB.length
    const vus = aGauche ? deA : deB
    const autre = aGauche ? deB : deA
    const front = aGauche ? frontA : frontB
    const pas = (aGauche ? profA : profB) + 1
    const suivant: string[] = []
    for (const id of front)
      for (const v of graphe[id] ?? []) {
        if (vus.has(v)) continue
        vus.set(v, pas)
        const croise = autre.get(v)
        if (croise !== undefined && pas + croise < k) k = pas + croise
        suivant.push(v)
      }
    if (aGauche) {
      frontA = suivant
      profA = pas
    } else {
      frontB = suivant
      profB = pas
    }
  }

  const out = k > max ? Infinity : k
  cache?.set(cle, out)
  return out
}

/**
 * CE QU'UN COUPLE CÔTE À CÔTE S'AJOUTE : `portee - sauts`, zéro au-delà.
 *
 * **C'est la seule porte**, et tout y passe — la production, le chiffre de la
 * case, le badge de la main : *deux endroits qui calculeraient le même bonus se
 * désaccorderaient au premier réglage.*
 */
export function bonusDuCouple(
  reglage: Reglage,
  graphe: Graphe,
  a: string,
  b: string,
  cache?: Distances,
): number {
  const k = distance(graphe, a, b, reglage.portee - 1, cache)
  return k === Infinity || k < 1 ? 0 : Math.max(0, reglage.portee - k)
}

/**
 * LES COUPLES ADJACENTS D'UNE GRILLE, chacun UNE SEULE FOIS.
 *
 * On ne regarde que le voisin de DROITE et celui du BAS : *parcourir les quatre
 * voisins compterait chaque couple deux fois*, et la synergie serait doublée
 * sans qu'une seule ligne ne le dise. À quatre de côté : vingt-quatre couples.
 */
export function couples(cote: number): readonly (readonly [number, number])[] {
  const out: [number, number][] = []
  for (let l = 0; l < cote; l++)
    for (let c = 0; c < cote; c++) {
      const i = l * cote + c
      if (c + 1 < cote) out.push([i, i + 1])
      if (l + 1 < cote) out.push([i, i + cote])
    }
  return out
}

/**
 * LA PRODUCTION, CASE PAR CASE — et c'est ce que l'écran affiche.
 *
 * *Une somme globale ne dirait pas au joueur ce que son arrangement lui a
 * rapporté*, et c'est précisément la question du proto : il doit voir le
 * chiffre monter sur la carte qu'il vient de poser.
 */
export function productionParCase(
  p: Plateau,
  graphe: Graphe,
  cache?: Distances,
): readonly number[] {
  const { base, cote } = p.reglage
  const par = p.grille.map((j) => (j === null ? 0 : base))
  for (const [i, k] of couples(cote)) {
    const a = p.grille[i]
    const b = p.grille[k]
    if (a === null || b === null || a === undefined || b === undefined) continue
    const gain = bonusDuCouple(p.reglage, graphe, a.id, b.id, cache)
    if (gain === 0) continue
    par[i] = (par[i] ?? 0) + gain
    par[k] = (par[k] ?? 0) + gain
  }
  return par
}

/** La production d'un tick. */
export function production(p: Plateau, graphe: Graphe, cache?: Distances): number {
  return productionParCase(p, graphe, cache).reduce((a, b) => a + b, 0)
}

/** Un couple de la grille qui rapporte, avec sa distance. */
export interface CouplePayant {
  readonly cases: readonly [number, number]
  readonly sauts: number
  readonly gain: number
}

/**
 * LES COUPLES QUI PAIENT, AVEC LEUR DISTANCE — pour les montrer à l'écran.
 *
 * *On rend la distance et pas seulement le fait* : c'est elle que le joueur doit
 * lire pour comprendre pourquoi un couple rapporte quatre et son voisin deux.
 */
export function couplesQuiPaient(
  p: Plateau,
  graphe: Graphe,
  cache?: Distances,
): readonly CouplePayant[] {
  const out: CouplePayant[] = []
  for (const [i, k] of couples(p.reglage.cote)) {
    const a = p.grille[i]
    const b = p.grille[k]
    if (a == null || b == null) continue
    const sauts = distance(graphe, a.id, b.id, p.reglage.portee - 1, cache)
    if (sauts === Infinity || sauts < 1) continue
    const gain = Math.max(0, p.reglage.portee - sauts)
    if (gain > 0) out.push({ cases: [i, k], sauts, gain })
  }
  return out
}

/**
 * UN TICK : la production s'ajoute à la ressource.
 *
 * **Elle se calcule sur l'état AU MOMENT du tick**, pas en continu — c'est la
 * règle que Keko a posée, et elle rend la fonction pure : *un même plateau rend
 * toujours le même tick.*
 */
export function tic(p: Plateau, graphe: Graphe, cache?: Distances): Plateau {
  return { ...p, ressource: p.ressource + production(p, graphe, cache), ticks: p.ticks + 1 }
}

/**
 * POSER UNE CARTE DE LA MAIN SUR UNE CASE.
 *
 * **Si la case est occupée, les deux s'échangent** : ce que la destination
 * déloge repart d'où vient la carte. *C'est le modèle `Lieu` du jeu* — « tout
 * déplacement est prendre ici, poser là », et l'échange n'est pas un cas
 * particulier.
 */
export function poser(p: Plateau, idMain: string, case_: number): Plateau {
  if (case_ < 0 || case_ >= p.grille.length) return p
  const i = p.main.findIndex((j) => j.id === idMain)
  if (i < 0) return p
  const prise = p.main[i] as Jeton
  const delogee = p.grille[case_] ?? null
  const grille = [...p.grille]
  grille[case_] = prise
  const main = [...p.main]
  if (delogee === null) main.splice(i, 1)
  else main[i] = delogee
  return { ...p, grille, main }
}

/** Déplacer d'une case à une autre. Même règle : la destination occupée échange. */
export function deplacer(p: Plateau, de: number, vers: number): Plateau {
  if (de === vers) return p
  if (de < 0 || de >= p.grille.length || vers < 0 || vers >= p.grille.length) return p
  const pris = p.grille[de] ?? null
  if (pris === null) return p
  const grille = [...p.grille]
  grille[vers] = pris
  grille[de] = p.grille[vers] ?? null
  return { ...p, grille }
}

/** Retirer une carte de la grille : elle revient en main. */
export function retirer(p: Plateau, case_: number): Plateau {
  const j = p.grille[case_] ?? null
  if (j === null) return p
  const grille = [...p.grille]
  grille[case_] = null
  return { ...p, grille, main: [...p.main, j] }
}

/**
 * TIRER DES CARTES, SANS DOUBLON — ni avec la main, ni avec la grille.
 *
 * *Deux exemplaires de la même carte seraient liés à eux-mêmes ou pas*, et
 * surtout le joueur ne pourrait pas distinguer deux cases identiques.
 */
export function tirer(
  pool: readonly Jeton[],
  combien: number,
  rng: () => number,
  deja: ReadonlySet<string> = new Set(),
): readonly Jeton[] {
  const libres = pool.filter((j) => !deja.has(j.id))
  const out: Jeton[] = []
  const pris = new Set<number>()
  for (let essai = 0; out.length < combien && essai < combien * 40 && pris.size < libres.length; essai++) {
    const k = Math.floor(rng() * libres.length)
    if (pris.has(k)) continue
    pris.add(k)
    out.push(libres[k] as Jeton)
  }
  return out
}

/** Les identifiants déjà en jeu : la main et la grille. */
export function enJeu(p: Plateau): ReadonlySet<string> {
  const s = new Set<string>()
  for (const j of p.main) s.add(j.id)
  for (const j of p.grille) if (j !== null) s.add(j.id)
  return s
}

/** Un booster : `reglage.booster` cartes de plus en main. */
export function booster(p: Plateau, pool: readonly Jeton[], rng: () => number): Plateau {
  return { ...p, main: [...p.main, ...tirer(pool, p.reglage.booster, rng, enJeu(p))] }
}

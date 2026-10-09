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
  /** Ce que chaque paire liée ajoute, **à chacune des deux cartes**. */
  readonly synergie: number
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
  synergie: 1,
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

/** Deux cartes sont liées si l'une pointe vers l'autre. */
export function lies(graphe: Graphe, a: string, b: string): boolean {
  return (graphe[a]?.includes(b) ?? false) || (graphe[b]?.includes(a) ?? false)
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
export function productionParCase(p: Plateau, graphe: Graphe): readonly number[] {
  const { base, synergie, cote } = p.reglage
  const par = p.grille.map((j) => (j === null ? 0 : base))
  for (const [i, k] of couples(cote)) {
    const a = p.grille[i]
    const b = p.grille[k]
    if (a === null || b === null || a === undefined || b === undefined) continue
    if (!lies(graphe, a.id, b.id)) continue
    par[i] = (par[i] ?? 0) + synergie
    par[k] = (par[k] ?? 0) + synergie
  }
  return par
}

/** La production d'un tick. */
export function production(p: Plateau, graphe: Graphe): number {
  return productionParCase(p, graphe).reduce((a, b) => a + b, 0)
}

/** Les couples liés actuellement sur la grille — pour les montrer à l'écran. */
export function paquesLiees(p: Plateau, graphe: Graphe): readonly (readonly [number, number])[] {
  return couples(p.reglage.cote).filter(([i, k]) => {
    const a = p.grille[i]
    const b = p.grille[k]
    return a != null && b != null && lies(graphe, a.id, b.id)
  })
}

/**
 * UN TICK : la production s'ajoute à la ressource.
 *
 * **Elle se calcule sur l'état AU MOMENT du tick**, pas en continu — c'est la
 * règle que Keko a posée, et elle rend la fonction pure : *un même plateau rend
 * toujours le même tick.*
 */
export function tic(p: Plateau, graphe: Graphe): Plateau {
  return { ...p, ressource: p.ressource + production(p, graphe), ticks: p.ticks + 1 }
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

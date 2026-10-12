/**
 * LE DÉCOUPAGE EN CRANS, PAR GROUPE — et il n'y en a qu'un seul endroit.
 *
 * Tranché par Keko sur les personnages : « il faudrait que la rareté soit
 * donnée en fonction de la distribution de la rareté dans une catégorie et pas
 * globale ». **La règle vaut pour tout catalogue rangé en rayons**, et le mode
 * emoji est le second à la lire — *deux endroits qui décrivent le même calcul
 * se désaccordent au premier réglage.*
 *
 * Pur, donc vérifiable sans navigateur.
 */

/** Un cran de l'échelle, en part CUMULÉE du groupe. */
export interface Cran<R> {
  readonly rarete: R
  readonly jusqu: number
}

/**
 * LA PYRAMIDE DES TROIS MODES, en parts cumulées : 69 / 20 / 8 / 2,5 %.
 *
 * *Un changement à la fois* — la porte d'entrée change d'un mode à l'autre, la
 * distribution de rareté non.
 */
export const PYRAMIDE_QUATRE = [
  { rarete: 'commun', jusqu: 0.692 },
  { rarete: 'rare', jusqu: 0.892 },
  { rarete: 'epique', jusqu: 0.975 },
  { rarete: 'legendaire', jusqu: 1 },
] as const

/**
 * LA PYRAMIDE À CINQ CRANS — le mode emoji, et lui seul.
 *
 * Tranché par Keko : « commun, peu commun, rare, épique, légendaire ». *Les
 * autres modes gardent les quatre métaux* — il a choisi « le mode emoji
 * seulement ».
 *
 * **LES PARTS SONT DES PLACEHOLDERS**, et il faut le savoir : Keko a donné les
 * CRANS, pas leur poids. *Elles décroissent de moitié à chaque palier*, ce qui
 * est la forme la plus lisible qu'on puisse donner à cinq niveaux — **à juger
 * sur `emoji-summary.txt` quand il aura ouvert des paquets.**
 */
export const PYRAMIDE_CINQ = [
  { rarete: 'commun', jusqu: 0.5 },
  { rarete: 'peu-commun', jusqu: 0.75 },
  { rarete: 'rare', jusqu: 0.9 },
  { rarete: 'epique', jusqu: 0.975 },
  { rarete: 'legendaire', jusqu: 1 },
] as const

/**
 * Découpe chaque groupe en crans, du plus notoire au moins notoire.
 *
 * Trois choses à ne pas défaire :
 *
 * - **ON TRIE SUR LA VALEUR BRUTE, jamais sur un score normalisé.** Une échelle
 *   log bornée vaut la même chose pour tout le monde dès que ses bornes sont
 *   mal calées, et le tri devient dégénéré — *c'est littéralement le défaut qui
 *   a sorti un catalogue à 100 % commun.* ***Un quantile n'a besoin que d'un
 *   ordre, et toute normalisation intermédiaire ne peut que lui en perdre.***
 * - **les ex aequo partagent leur cran**, par leur rang moyen : *deux cartes de
 *   même valeur ne peuvent pas valoir deux métaux différents.*
 * - **un groupe n'influence pas un autre**, et c'est la propriété qui fait
 *   toute la différence avec un seuil global.
 *
 * Elle rend les crans DANS L'ORDRE DES ENTRÉES, parce que l'appelant a déjà
 * ses cartes rangées : *une fonction qui renvoie un autre ordre oblige à
 * réapparier, et c'est là qu'on se trompe.*
 */
export function cransParGroupe<R>(
  elements: readonly { readonly groupe: string; readonly valeur: number }[],
  pyramide: readonly Cran<R>[],
): R[] {
  const rayons = new Map<string, number[]>()
  elements.forEach((e, i) => {
    const l = rayons.get(e.groupe)
    if (l === undefined) rayons.set(e.groupe, [i])
    else l.push(i)
  })

  const sortie = new Array<R>(elements.length)
  const dernier = pyramide[pyramide.length - 1]!
  for (const indices of rayons.values()) {
    const ordre = [...indices].sort((a, b) => elements[b]!.valeur - elements[a]!.valeur)
    const n = Math.max(1, ordre.length)
    let i = 0
    while (i < ordre.length) {
      let j = i
      while (j + 1 < ordre.length && elements[ordre[j + 1]!]!.valeur === elements[ordre[i]!]!.valeur) j++
      const part = 1 - (i + j) / 2 / n
      const cran = pyramide.find((p) => part <= p.jusqu) ?? dernier
      for (let k = i; k <= j; k++) sortie[ordre[k]!] = cran.rarete
      i = j + 1
    }
  }
  return sortie
}

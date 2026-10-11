/**
 * LE FORMAT D'UNE CARTE-PEINTURE.
 *
 * **UNE CARTE EST UNE ŒUVRE PEINTE.** Tranché par Keko : « je voudrais me
 * focaliser uniquement sur les peintures/tableaux ».
 *
 * *Ce que ça écarte, et il faut le savoir* : la statue de la Liberté (158
 * langues, plus que La Joconde), le David, la Vénus de Milo, l'Homme de
 * Vitruve, et toute la photographie iconique. **Les non-peintures sont 17 % du
 * pool mais 53 % de ce qui dépasse cinquante langues** — la coupe mord donc
 * exactement là où un jeu de collection se juge, sur ses cartes légendaires.
 * Ce qu'elle achète en échange est un FORMAT VISUEL UNIQUE : une image
 * rectangulaire plate, là où une sculpture est un objet photographié sur fond
 * de musée.
 *
 * **« PEINTURE » N'EST PAS LA CLASSE `peinture` DE WIKIDATA.** La Création
 * d'Adam, L'École d'Athènes et Le Jugement dernier y sont rangés sous
 * `fresque` — qui est une SOUS-CLASSE de peinture. Le pipeline remonte donc
 * l'arbre (`P31/P279* Q3305213`) au lieu de lister les natures à la main :
 * *sans ça, on perd Michel-Ange et Raphaël pour une question de nomenclature.*
 *
 * Le fichier s'appelle `paintings.json` et non `art.json` : *le mode est
 * spécialisé, et le nom doit le dire.*
 */

/** Les crans de rareté, du plus commun au plus rare — un par métal. */
export const RARETES_PEINTURE = ['commun', 'rare', 'epique', 'legendaire'] as const
export type RaretePeinture = (typeof RARETES_PEINTURE)[number]

export type CartePeinture = {
  /** Le Q-id Wikidata, qui est l'identité de l'œuvre. */
  readonly id: string
  /**
   * LE NOM, DÉSAMBIGUÏSATION RETIRÉE.
   *
   * Le titre d'article porte souvent sa parenthèse — « La Cène (Léonard de
   * Vinci) », « La Nuit étoilée (1889) » — et *ce qui précède la parenthèse EST
   * le nom*, la règle déjà payée sur « Castor (genre) » dans le mode animaux.
   */
  readonly nom: string
  readonly peintre: string | null
  readonly peintre_id: string | null
  /** L'année de création. Négative avant notre ère. */
  readonly annee: number
  /**
   * LE SIÈCLE, DÉRIVÉ DE L'ANNÉE et rangé dans la donnée.
   *
   * Il sert de rayon, donc il est calculé une fois par le pipeline plutôt que
   * par chaque écran : *deux endroits qui le déduiraient se désaccorderaient au
   * premier réglage* — et le cas « avant notre ère » n'est pas évident.
   */
  readonly siecle: number
  /** Le genre : art religieux, portrait, paysage… (`P136`, 86 % du pool). */
  readonly genre: string | null
  /** Le lieu de conservation (`P276`, 91 %). Un rayon, pas un terme de score. */
  readonly musee: string | null
  /** La notoriété, de 0 à 1, dont la rareté se déduit. */
  readonly score: number
  readonly rarete: RaretePeinture
  /**
   * LE NOMBRE DE VERSIONS LINGUISTIQUES — le cœur du score, et le chiffre que
   * la dernière carte d'un paquet fait défiler.
   *
   * **Il prédit les vues mondiales mieux que les vues françaises** (0,899
   * contre 0,729), ce qui est l'INVERSE du mode personnages — où les langues
   * avaient été mises à poids zéro parce qu'« un botaniste du XIXᵉ a cent
   * cinquante Wikipédia créées par bot et personne ne les lit ». *Il n'y a pas
   * de bots qui écrivent des articles de peintures* : un article n'existe que
   * si quelqu'un l'a écrit. **Un signal change de nature avec son domaine.**
   */
  readonly langues: number
  /** L'URL de vignette Commons. Obligatoire : *pas d'image, pas de carte.* */
  readonly image: string
  readonly article_fr: string
  /** Les vues fr sur soixante jours, pour relire le score plus tard. */
  readonly vues: number
}

export type CataloguePeinture = {
  readonly genere: string
  readonly cartes: readonly CartePeinture[]
}

function texte(v: unknown): string | null {
  return typeof v === 'string' && v.length > 0 ? v : null
}

function nombre(v: unknown): number | null {
  return typeof v === 'number' && Number.isFinite(v) ? v : null
}

/**
 * Lit une carte, ou rend `null` si elle est abîmée.
 *
 * **Une carte fausse ne doit pas emporter les autres** : le fichier est
 * engendré, donc une ligne peut être tordue par un changement de pipeline.
 */
export function parseCartePeinture(v: unknown): CartePeinture | null {
  if (typeof v !== 'object' || v === null) return null
  const o = v as Record<string, unknown>

  const id = texte(o.id)
  const nom = texte(o.nom)
  const image = texte(o.image)
  const article_fr = texte(o.article_fr)
  if (id === null || nom === null || image === null || article_fr === null) return null

  const rarete = texte(o.rarete)
  if (rarete === null || !(RARETES_PEINTURE as readonly string[]).includes(rarete)) return null

  const annee = nombre(o.annee)
  const siecle = nombre(o.siecle)
  const score = nombre(o.score)
  const langues = nombre(o.langues)
  const vues = nombre(o.vues)
  if (annee === null || siecle === null || score === null) return null
  if (langues === null || vues === null) return null

  return {
    id,
    nom,
    peintre: texte(o.peintre),
    peintre_id: texte(o.peintre_id),
    annee,
    siecle,
    genre: texte(o.genre),
    musee: texte(o.musee),
    score,
    rarete: rarete as RaretePeinture,
    langues,
    image,
    article_fr,
    vues,
  }
}

/** Lit le catalogue entier, en sautant les lignes abîmées. */
export function parsePeintures(json: string): CartePeinture[] {
  let brut: unknown
  try {
    brut = JSON.parse(json)
  } catch {
    return []
  }
  const liste = Array.isArray(brut)
    ? brut
    : typeof brut === 'object' &&
        brut !== null &&
        Array.isArray((brut as { cartes?: unknown }).cartes)
      ? (brut as { cartes: unknown[] }).cartes
      : []
  const cartes: CartePeinture[] = []
  for (const v of liste) {
    const c = parseCartePeinture(v)
    if (c !== null) cartes.push(c)
  }
  return cartes
}

/**
 * LE SIÈCLE D'UNE ANNÉE, et le cas « avant notre ère » n'est pas évident.
 *
 * 1503 est au 16ᵉ et 1500 au 15ᵉ : *un siècle se ferme sur son centième*.
 *
 * **ET IL N'Y A PAS D'AN ZÉRO.** Le 1ᵉʳ siècle avant notre ère va de −100 à
 * −1 — donc **−100 y est, et −101 ouvre le 2ᵉ** — exactement comme le 1ᵉʳ
 * siècle va de 1 à 100. *Mon premier calcul décalait tout d'un cran, et une
 * vérification l'a attrapé* ; l'erreur n'était pas dans la formule seule mais
 * dans ce que je croyais de la convention.
 *
 * Le siècle d'avant notre ère est rendu NÉGATIF, pour que l'ordre des siècles
 * soit celui du temps — donc qu'un rayon trié par siècle se lise de
 * l'antiquité à aujourd'hui sans cas particulier.
 */
export function siecleDe(annee: number): number {
  return annee > 0 ? Math.floor((annee - 1) / 100) + 1 : -Math.ceil(-annee / 100)
}

/** Le siècle tel qu'on le lit : « 16ᵉ siècle », « 1ᵉʳ siècle av. J.-C. ». */
export function siecleEnClair(siecle: number): string {
  if (siecle > 0) return siecle === 1 ? '1ᵉʳ siècle' : `${siecle}ᵉ siècle`
  const n = -siecle
  return n === 1 ? '1ᵉʳ siècle av. J.-C.' : `${n}ᵉ siècle av. J.-C.`
}

/**
 * LES RAYONS DE LA COLLECTION, et c'est pur exprès.
 *
 * *Un catalogue de trois mille cartes ne se montre pas en une liste.* Les
 * quatre axes ont été mesurés sur le pool, et ils sont tous exploitables :
 *
 * | rayon | couverture | valeurs | plus gros tas |
 * |---|---|---|---|
 * | **peintre** | 96 % | 1 343 | Goya 2,8 % |
 * | musée | 91 % | 1 521 | Orsay 4,0 % |
 * | siècle | 100 % | 9 utiles | 19ᵉ 35,5 % |
 * | genre | 86 % | 95 | art religieux 25 % |
 *
 * **Le peintre est le meilleur** : médiane de deux œuvres, aucun au-dessus de
 * 3 %, et c'est le seul axe qu'un joueur comprend sans rien lire — *« j'ai
 * trois Van Gogh »*.
 *
 * Les fonctions vivent ici plutôt que dans le rendu parce qu'elles ne touchent
 * à rien du navigateur, et parce que *deux écrans qui grouperaient chacun de
 * leur côté divergeraient au premier réglage.*
 */
function grouper(
  cartes: readonly CartePeinture[],
  cle: (c: CartePeinture) => string | null,
): Map<string, CartePeinture[]> {
  const rayons = new Map<string, CartePeinture[]>()
  for (const c of cartes) {
    const k = cle(c)
    if (k === null) continue
    const lot = rayons.get(k)
    if (lot === undefined) rayons.set(k, [c])
    else lot.push(c)
  }
  // Le plus gros rayon d'abord : *on cherche d'abord là où il y a le plus à
  // trouver.*
  return new Map([...rayons.entries()].sort((a, b) => b[1].length - a[1].length))
}

export function parPeintre(cartes: readonly CartePeinture[]): Map<string, CartePeinture[]> {
  return grouper(cartes, (c) => c.peintre)
}

export function parGenre(cartes: readonly CartePeinture[]): Map<string, CartePeinture[]> {
  return grouper(cartes, (c) => c.genre)
}

export function parMusee(cartes: readonly CartePeinture[]): Map<string, CartePeinture[]> {
  return grouper(cartes, (c) => c.musee)
}

/** Les siècles se rangent dans l'ordre du TEMPS, pas par taille de rayon. */
export function parSiecle(cartes: readonly CartePeinture[]): Map<string, CartePeinture[]> {
  const rayons = new Map<number, CartePeinture[]>()
  for (const c of cartes) {
    const lot = rayons.get(c.siecle)
    if (lot === undefined) rayons.set(c.siecle, [c])
    else lot.push(c)
  }
  return new Map(
    [...rayons.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([s, lot]) => [siecleEnClair(s), lot] as const),
  )
}

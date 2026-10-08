/**
 * LE FORMAT D'UNE CARTE-ANIMAL — et c'est le format du mode, pas des
 * mammifères.
 *
 * **UNE CARTE EST UNE ESPÈCE.** Tranché par Keko : « je préfère la liste plate,
 * on abandonne l'arbre » et « il faut la collection de tous les mammifères ».
 *
 * *Ce que ça remplace* : une coupe à profondeur variable dans l'arbre du
 * vivant, où une carte pouvait être un ordre entier (« chauve-souris ») ou une
 * espèce (« lion ») selon ce que le public sait nommer. **L'histoire de cet
 * abandon est dans `CLAUDE.md`**, et elle valait d'être vécue : les six défauts
 * qu'elle a coûtés venaient TOUS des rangs au-dessus de l'espèce.
 *
 * *Ce qu'on perd, et c'est une seule chose* : il n'y a plus de carte
 * « chauve-souris », « rongeur » ni « dauphin ». **Les groupes reviennent par
 * une autre porte** — `ordre` et `famille` classent la collection sans être des
 * cartes.
 *
 * `groupe` existe pour que le fichier accueille les autres vertébrés sans
 * changer de forme : aujourd'hui « mammifères », demain « oiseaux ». *C'est
 * aussi pourquoi le fichier s'appelle `animals.json` et non `mammals.json`.*
 */

/** Les crans de rareté, du plus commun au plus rare. */
export const RARETES_ANIMAL = ['commun', 'rare', 'epique', 'legendaire'] as const
export type RareteAnimal = (typeof RARETES_ANIMAL)[number]

/**
 * LE STATUT UICN, tel que Wikidata le code (P141).
 *
 * `null` quand l'espèce n'est pas évaluée — et c'est le cas de beaucoup de
 * petits mammifères. *Une absence de statut n'est pas un statut rassurant* : le
 * rendu devra le dire autrement qu'en affichant « LC ».
 */
export const STATUTS_UICN = ['EX', 'EW', 'CR', 'EN', 'VU', 'NT', 'LC', 'DD'] as const
export type StatutUicn = (typeof STATUTS_UICN)[number]

export type CarteAnimal = {
  /** La clé GBIF de l'espèce, qui est son identité dans le référentiel. */
  readonly id: string
  /** Le groupe du mode : « mammifères » aujourd'hui, d'autres demain. */
  readonly groupe: string
  /** Le nom que le public emploie. C'est le titre de la carte. */
  readonly nom_fr: string
  readonly nom_scientifique: string
  /**
   * L'ORDRE ET LA FAMILLE, EN SCIENTIFIQUE ET EN FRANÇAIS.
   *
   * **C'est ce qui remplace l'arbre**, et c'est son seul héritage utile : les
   * groupes que le public nomme — carnivores, primates, chauves-souris — ne
   * sont plus des cartes mais les RAYONS de la collection. *Un classeur ne se
   * collectionne pas, il range.*
   *
   * Le nom français d'un ordre est engendré comme celui d'une espèce, par la
   * même cascade : il y en a vingt-sept, donc ça ne coûte rien.
   */
  readonly ordre: string
  readonly ordre_fr: string
  readonly famille: string
  /** La notoriété, de 0 à 1, dont la rareté se déduit. */
  readonly score: number
  readonly rarete: RareteAnimal
  readonly statut_uicn: StatutUicn | null
  /** La masse en kilogrammes, quand Wikidata la donne (P2067). */
  readonly masse_kg: number | null
  readonly image: string | null
  readonly article_fr: string | null
  /** Les vues cumulées fr + en sur douze mois, pour relire le score. */
  readonly vues: number
}

export type CatalogueAnimal = {
  readonly genere: string
  readonly groupe: string
  readonly cartes: readonly CarteAnimal[]
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
 * engendré, donc une ligne peut être tordue par un changement de pipeline. La
 * règle est celle du mode personnages, et elle a déjà servi.
 */
export function parseCarteAnimal(v: unknown): CarteAnimal | null {
  if (typeof v !== 'object' || v === null) return null
  const o = v as Record<string, unknown>

  const id = texte(o.id)
  const groupe = texte(o.groupe)
  const nom_fr = texte(o.nom_fr)
  const nom_scientifique = texte(o.nom_scientifique)
  const ordre = texte(o.ordre)
  const ordre_fr = texte(o.ordre_fr)
  const famille = texte(o.famille)
  if (id === null || groupe === null || nom_fr === null || nom_scientifique === null) return null
  if (ordre === null || ordre_fr === null || famille === null) return null

  const rarete = texte(o.rarete)
  if (rarete === null || !(RARETES_ANIMAL as readonly string[]).includes(rarete)) return null

  const statut = texte(o.statut_uicn)
  if (statut !== null && !(STATUTS_UICN as readonly string[]).includes(statut)) return null

  const score = nombre(o.score)
  const vues = nombre(o.vues)
  if (score === null || vues === null) return null

  return {
    id,
    groupe,
    nom_fr,
    nom_scientifique,
    ordre,
    ordre_fr,
    famille,
    score,
    rarete: rarete as RareteAnimal,
    statut_uicn: statut as StatutUicn | null,
    masse_kg: nombre(o.masse_kg),
    image: texte(o.image),
    article_fr: texte(o.article_fr),
    vues,
  }
}

/** Lit le catalogue entier, en sautant les lignes abîmées. */
export function parseAnimaux(json: string): CarteAnimal[] {
  let brut: unknown
  try {
    brut = JSON.parse(json)
  } catch {
    return []
  }
  const liste = Array.isArray(brut)
    ? brut
    : typeof brut === 'object' && brut !== null && Array.isArray((brut as { cartes?: unknown }).cartes)
      ? (brut as { cartes: unknown[] }).cartes
      : []
  const cartes: CarteAnimal[] = []
  for (const v of liste) {
    const c = parseCarteAnimal(v)
    if (c !== null) cartes.push(c)
  }
  return cartes
}

/**
 * LA COLLECTION SE RANGE PAR ORDRE, et c'est pur exprès.
 *
 * *Un catalogue de deux mille cinq cents cartes ne se montre pas en une liste* :
 * il lui faut des rayons, et les rayons sont les ordres. La fonction vit ici
 * plutôt que dans le rendu parce qu'elle ne touche à rien du navigateur — et
 * parce que *deux écrans qui grouperaient chacun de leur côté divergeraient au
 * premier réglage.*
 */
export function parOrdre(cartes: readonly CarteAnimal[]): Map<string, CarteAnimal[]> {
  const rayons = new Map<string, CarteAnimal[]>()
  for (const c of cartes) {
    const lot = rayons.get(c.ordre_fr)
    if (lot === undefined) rayons.set(c.ordre_fr, [c])
    else lot.push(c)
  }
  // Le plus gros rayon d'abord : *on cherche d'abord là où il y a le plus à
  // trouver*, et ça met les rongeurs et les chauves-souris en tête, ce qui est
  // la vérité du groupe.
  return new Map([...rayons.entries()].sort((a, b) => b[1].length - a[1].length))
}

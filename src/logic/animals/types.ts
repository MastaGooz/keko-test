/**
 * LE FORMAT D'UNE CARTE-ANIMAL — et c'est le format du mode, pas des
 * mammifères.
 *
 * **UNE CARTE N'EST PAS UN RANG TAXONOMIQUE, C'EST UN NOEUD DE L'ARBRE DU
 * VIVANT, à n'importe quel rang.** Posé par Keko, et c'est la règle qui porte
 * tout : « Chauve-souris » est un ORDRE de 1400 espèces et fait UNE carte,
 * « lion » et « tigre » sont deux espèces d'un même genre et font DEUX cartes.
 * Ce qui décide n'est pas la systématique, c'est **ce que le grand public sait
 * nommer**.
 *
 * *D'où `rang` et `nb_especes_absorbees`* : le premier dit ce que le noeud EST
 * pour la science, le second ce que la carte COUVRE dans ma coupe. Les deux
 * sont nécessaires — un ordre qui fait une carte absorbe son sous-arbre, et
 * c'est la seule façon de garantir **qu'une espèce réelle tombe dans
 * exactement une carte.**
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
 * `null` quand l'espèce n'est pas évaluée — ce qui est le cas de la plupart des
 * noeuds au-dessus de l'espèce, puisqu'on n'évalue pas un ordre. *Une carte qui
 * couvre 1400 espèces n'a pas de statut, et c'est juste.*
 */
export const STATUTS_UICN = ['EX', 'EW', 'CR', 'EN', 'VU', 'NT', 'LC', 'DD'] as const
export type StatutUicn = (typeof STATUTS_UICN)[number]

export type CarteAnimal = {
  /** La clé GBIF du noeud, qui est son identité dans l'arbre. */
  readonly id: string
  /** Le groupe du mode : « mammifères » aujourd'hui, d'autres demain. */
  readonly groupe: string
  /** Le nom que le public emploie. C'est le titre de la carte. */
  readonly nom_fr: string
  readonly nom_scientifique: string
  /** Le rang RÉEL du noeud (`ORDER`, `GENUS`, `SPECIES`…), pas celui de ma coupe. */
  readonly rang: string
  /** La carte parente DANS MA COUPE, ou `null` à la racine du groupe. */
  readonly parent_id: string | null
  /** Combien d'espèces réelles cette carte couvre, son propre cas compris. */
  readonly nb_especes_absorbees: number
  /** La notoriété, de 0 à 1 : c'est elle qui a fait la coupe ET la rareté. */
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
  readonly seuil: number
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
  const rang = texte(o.rang)
  if (id === null || groupe === null || nom_fr === null || nom_scientifique === null || rang === null) return null

  const rarete = texte(o.rarete)
  if (rarete === null || !(RARETES_ANIMAL as readonly string[]).includes(rarete)) return null

  const statut = texte(o.statut_uicn)
  if (statut !== null && !(STATUTS_UICN as readonly string[]).includes(statut)) return null

  const especes = nombre(o.nb_especes_absorbees)
  const score = nombre(o.score)
  const vues = nombre(o.vues)
  if (especes === null || score === null || vues === null) return null

  return {
    id,
    groupe,
    nom_fr,
    nom_scientifique,
    rang,
    parent_id: texte(o.parent_id),
    nb_especes_absorbees: especes,
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
      ? ((brut as { cartes: unknown[] }).cartes)
      : []
  const cartes: CarteAnimal[] = []
  for (const v of liste) {
    const c = parseCarteAnimal(v)
    if (c !== null) cartes.push(c)
  }
  return cartes
}

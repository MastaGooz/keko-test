// Le mode « personnages » : des cartes a collectionner engendrees depuis
// Wikidata et Wikipedia FR. AUCUNE carte n'est ecrite en dur — tout vient de
// `public/data/characters.json`, produit par `scripts/generate-characters.ts`.
//
// Ce fichier est PUR, comme tout `logic/` : il porte le type et la validation,
// jamais la lecture du fichier. Le chargement concret vit dans `ui/`, par la
// meme porte que le `StoragePort` — ce dont `logic/` a besoin du monde
// exterieur lui est INJECTE.

/** Le domaine d'un personnage, lu dans sa description (voir `domaineDe`). */
export type Domaine =
  | 'militaire'
  | 'politique'
  | 'artiste'
  | 'scientifique'
  | 'penseur'
  | 'religieux'
  | 'sportif'
  | 'explorateur'
  | 'fiction'
  | 'autre'

export const DOMAINES: readonly Domaine[] = [
  'militaire',
  'politique',
  'artiste',
  'scientifique',
  'penseur',
  'religieux',
  'sportif',
  'explorateur',
  'fiction',
  'autre',
]

/** Les crans de rarete, du plus commun au plus rare. */
export type Rarete = 'commun' | 'peu-commun' | 'rare' | 'epique' | 'legendaire'

export const RARETES: readonly Rarete[] = ['commun', 'peu-commun', 'rare', 'epique', 'legendaire']

/**
 * Une carte-personnage. Les cinq derniers champs sont DERIVES : ils sortent de
 * `statsDerivees` (voir `formules.ts`), et se recalculent en relancant le
 * script. Tout le reste est recopie de Wikidata ou de Wikipedia.
 */
export interface CharacterCard {
  /** L'identifiant Wikidata, ex. `Q1339`. C'est la cle de la carte. */
  id: string
  nom: string
  /** La courte description Wikidata, en francais. Peut etre vide. */
  description: string
  /** Le titre de l'article FR, qui sert aussi d'URL. */
  article: string
  /** L'URL de l'image Commons (P18), ou `null` si le personnage n'en a pas. */
  image: string | null
  /** L'annee de naissance ; negative avant notre ere. `null` si inconnue. */
  naissance: number | null
  mort: number | null
  fiction: boolean
  /** Le pays de citoyennete (P27), ou l'oeuvre d'origine pour un personnage de fiction. */
  origine: string | null
  /** Les metiers (P106), libelles francais. */
  metiers: string[]
  domaine: Domaine
  /** Le nombre de Wikipedia qui ont un article : la notoriete mondiale. */
  langues: number
  /** La taille de l'article FR, en octets. */
  taille: number
  /** Les vues de l'article FR sur les 30 derniers jours. */
  vues: number
  rarete: Rarete
  attaque: number
  defense: number
}

/** Ce que le script ecrit dans `characters.json`. */
export interface JeuDeCartes {
  /** La date de generation, en ISO. Sert a savoir si les donnees ont vieilli. */
  genere: string
  cartes: CharacterCard[]
}

function estDomaine(v: unknown): v is Domaine {
  return typeof v === 'string' && (DOMAINES as readonly string[]).includes(v)
}

function estRarete(v: unknown): v is Rarete {
  return typeof v === 'string' && (RARETES as readonly string[]).includes(v)
}

function nombreOuNul(v: unknown): number | null {
  return typeof v === 'number' && Number.isFinite(v) ? v : null
}

/**
 * Valide une carte venue du JSON. Rend `null` plutot que de lever : un fichier
 * engendre peut porter une ligne abimee, et *une carte fausse ne doit pas
 * emporter les trois mille autres.*
 */
export function parsePersonnage(brut: unknown): CharacterCard | null {
  if (typeof brut !== 'object' || brut === null) return null
  const o = brut as Record<string, unknown>
  if (typeof o.id !== 'string' || !o.id) return null
  if (typeof o.nom !== 'string' || !o.nom) return null
  if (typeof o.article !== 'string' || !o.article) return null
  if (!estDomaine(o.domaine)) return null
  if (!estRarete(o.rarete)) return null
  return {
    id: o.id,
    nom: o.nom,
    description: typeof o.description === 'string' ? o.description : '',
    article: o.article,
    image: typeof o.image === 'string' && o.image ? o.image : null,
    naissance: nombreOuNul(o.naissance),
    mort: nombreOuNul(o.mort),
    fiction: o.fiction === true,
    origine: typeof o.origine === 'string' && o.origine ? o.origine : null,
    metiers: Array.isArray(o.metiers) ? o.metiers.filter((m): m is string => typeof m === 'string') : [],
    domaine: o.domaine,
    langues: nombreOuNul(o.langues) ?? 0,
    taille: nombreOuNul(o.taille) ?? 0,
    vues: nombreOuNul(o.vues) ?? 0,
    rarete: o.rarete,
    attaque: nombreOuNul(o.attaque) ?? 0,
    defense: nombreOuNul(o.defense) ?? 0,
  }
}

/**
 * Lit le contenu du JSON et rend les cartes valides. Pur : on lui passe le
 * texte, il ne va le chercher nulle part.
 */
export function parsePersonnages(texte: string): CharacterCard[] {
  let brut: unknown
  try {
    brut = JSON.parse(texte)
  } catch {
    return []
  }
  const liste =
    Array.isArray(brut) ? brut
    : typeof brut === 'object' && brut !== null && Array.isArray((brut as JeuDeCartes).cartes) ?
      (brut as JeuDeCartes).cartes
    : []
  const cartes: CharacterCard[] = []
  for (const b of liste) {
    const c = parsePersonnage(b)
    if (c) cartes.push(c)
  }
  return cartes
}

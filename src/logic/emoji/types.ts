/**
 * LE CINQUIÈME MODE : UNE COLLECTION D'EMOJI.
 *
 * Demandé par Keko : « maintenant je voudrais un autre test : on utilise des
 * emoji : noto color emoji et noto animated emoji ».
 *
 * **Une carte est un EMOJI**, et le catalogue vient d'Unicode : la liste
 * canonique (`emoji-test.txt`) donne le caractère, son groupe, son
 * sous-groupe et sa version d'introduction ; CLDR donne son nom français et
 * ses mots-clés. *Tout est engendré hors ligne*, comme les trois autres
 * catalogues — `public/data/emoji.json`.
 *
 * Pur : aucun accès au DOM, aucune entrée-sortie. Le `fetch` vit dans `ui/`.
 */

/**
 * LES DEUX TAGS D'UNE CARTE : SA RACE ET SON RÔLE.
 *
 * Le concept de Keko (`docs/fantasy.md`) : « le type central est la Créature :
 * elle produit de la puissance et porte deux tags, une race et un rôle. Les
 * tags sont le langage du jeu. » *La classe n'est pas un tag* : c'est le nom de
 * la carte. Le gobelin et l'orc sont les deux premières races illustrées.
 */
export type RaceCarte = 'gobelin' | 'orc'
export const RACES: readonly RaceCarte[] = ['gobelin', 'orc']
export const NOM_DE_LA_RACE: Readonly<Record<RaceCarte, string>> = { gobelin: 'Gobelin', orc: 'Orc' }

export type RoleCarte = 'melee' | 'distance' | 'magie' | 'soutien'
export const ROLES: readonly RoleCarte[] = ['melee', 'distance', 'magie', 'soutien']
export const NOM_DU_ROLE: Readonly<Record<RoleCarte, string>> = {
  melee: 'Mêlée',
  distance: 'Distance',
  magie: 'Magie',
  soutien: 'Soutien',
}

/**
 * CINQ CRANS, ET LE CODE COULEUR CLASSIQUE. Tranché par Keko : « on va changer
 * le système de rareté : commun, peu commun, rare, épique, légendaire (blanc,
 * vert, bleu, violet, orange) ».
 *
 * ***C'est un retour en arrière assumé***, et il faut savoir sur quoi : le mode
 * descente avait écarté ces couleurs — « je pense que c'est pas hyper cohérent
 * d'utiliser les couleurs de rareté RPG classiques, on peut tenter laiton /
 * bronze / argent / or / diamant ? » — **parce qu'une carte de jeu EST une
 * plaque de métal**, et qu'un vert posé dessus restait une couleur de jeu vidéo
 * plaquée sur un objet.
 *
 * *Une carte de COLLECTION n'a pas cette contrainte* : elle ne sort d'aucun
 * donjon, elle n'est faite de rien. **Et les deux systèmes coexistent sans se
 * gêner**, puisqu'on ne les regarde jamais côte à côte — Keko a tranché « le
 * mode emoji seulement ».
 */
export type RareteEmoji = 'commun' | 'peu-commun' | 'rare' | 'epique' | 'legendaire'

export const RARETES_EMOJI: readonly RareteEmoji[] = [
  'commun',
  'peu-commun',
  'rare',
  'epique',
  'legendaire',
]

/**
 * UNE CARTE : UN PERSONNAGE ILLUSTRÉ PAR KEKO.
 *
 * ***Le type garde son nom d'avant*** (`CarteEmoji`) : le moteur de la
 * collection d'emoji (sachet, défilé, collection, stickers, deck) est repris
 * tel quel, et c'est le catalogue qu'on a changé, pas l'architecture. Keko :
 * « le jeu n'est plus au sujet des emojis (on vire tout et on remplace par le
 * pool orc/gobelin) ».
 */
export interface CarteEmoji {
  /** `<race>-<cran>-<numéro de la fiche>` : `gobelin-rare-03`. */
  id: string
  /**
   * TOUJOURS VIDE : il n'y a plus de glyphe. *Le champ reste* parce que le
   * peintre et `Carte3D` reconnaissent une carte à sticker à sa présence
   * (`emoji !== undefined`), et qu'une chaîne vide n'y peint rien.
   */
  emoji: string
  /** Le nom de la carte, accordé au sexe : « Archère de la horde ». */
  nom: string
  race: RaceCarte
  role: RoleCarte
  sexe: 'h' | 'f'
  /** L'illustration, relative à la racine du site : `cartes/orc/rares/03-massacreur.webp`. */
  image: string
  /** Ce que la recherche lit en plus du nom : la race et le rôle en clair. */
  mots: string[]
  /** Toujours faux : aucune illustration n'est animée. Voir `tirerBonus`. */
  animable: boolean
  /** La place dans le catalogue, 1 pour la première légendaire. */
  rang: number
  rarete: RareteEmoji
}

function estRace(v: unknown): v is RaceCarte {
  return typeof v === 'string' && (RACES as readonly string[]).includes(v)
}

function estRole(v: unknown): v is RoleCarte {
  return typeof v === 'string' && (ROLES as readonly string[]).includes(v)
}

function estRarete(v: unknown): v is RareteEmoji {
  return typeof v === 'string' && (RARETES_EMOJI as readonly string[]).includes(v)
}

/**
 * Lit une carte, ou rend `null` si elle est mal formée.
 *
 * **La validation est là pour que le jeu ne se casse pas sur un catalogue
 * régénéré de travers** : le fichier est une donnée produite par un script
 * hors build, donc rien ne garantit sa forme à la compilation.
 */
export function parseEmoji(v: unknown): CarteEmoji | null {
  if (typeof v !== 'object' || v === null) return null
  const c = v as Record<string, unknown>
  if (typeof c.id !== 'string' || !/^[0-9a-z]+(-[0-9a-z]+)*$/.test(c.id)) return null
  if (typeof c.nom !== 'string' || c.nom === '') return null
  if (typeof c.image !== 'string' || c.image === '') return null
  if (!estRace(c.race) || !estRole(c.role)) return null
  if (c.sexe !== 'h' && c.sexe !== 'f') return null
  if (!estRarete(c.rarete)) return null
  if (typeof c.rang !== 'number' || !Number.isFinite(c.rang)) return null
  return {
    id: c.id,
    emoji: '',
    nom: c.nom,
    race: c.race,
    role: c.role,
    sexe: c.sexe,
    image: c.image,
    mots: [NOM_DE_LA_RACE[c.race], NOM_DU_ROLE[c.role]],
    animable: false,
    rang: c.rang,
    rarete: c.rarete,
  }
}

/** Lit le catalogue entier. Les cartes mal formées sont écartées, pas fatales. */
export function parseEmojis(texte: string): CarteEmoji[] {
  let brut: unknown
  try {
    brut = JSON.parse(texte)
  } catch {
    return []
  }
  const liste = (brut as { cartes?: unknown })?.cartes
  if (!Array.isArray(liste)) return []
  return liste.map(parseEmoji).filter((c): c is CarteEmoji => c !== null)
}

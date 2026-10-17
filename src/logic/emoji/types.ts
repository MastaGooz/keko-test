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
 * Les neuf groupes Unicode, hors `Component` qui n'a pas de carte — plus
 * six découpés par Keko : `coeurs` et `monstres` sortis des visages (le
 * sous-groupe `heart` ; `face-costume`, crâne, ogre, fantôme, alien, robot…),
 * `mains` et `corps` sortis des gens (les six sous-groupes `hand*` ;
 * `body-parts`), `nature` sortie des animaux (`plant-*`), `ciel` sorti des
 * lieux (`sky & weather`, plus la fusée, la soucoupe et le satellite) ; voir
 * `SOUS_GROUPE` et `PAR_ID` dans le pipeline.
 */
export type GroupeEmoji =
  | 'visages'
  | 'coeurs'
  | 'monstres'
  | 'gens'
  | 'mains'
  | 'corps'
  | 'animaux'
  | 'nature'
  | 'nourriture'
  | 'lieux'
  | 'ciel'
  | 'activites'
  | 'objets'
  | 'symboles'
  | 'drapeaux'

export const GROUPES_EMOJI: readonly GroupeEmoji[] = [
  'visages',
  'coeurs',
  'monstres',
  'gens',
  'mains',
  'corps',
  'animaux',
  'nature',
  'nourriture',
  'lieux',
  'ciel',
  'activites',
  'objets',
  'symboles',
  'drapeaux',
]

/**
 * LE GROUPE SE TRADUIT ICI, PAS DANS LE PIPELINE.
 *
 * *Le catalogue garde un identifiant*, donc le jour où l'on change un mot il
 * n'y a pas deux mille cartes à réengendrer — la règle déjà tenue par la
 * majuscule des noms de personnages et par le domaine `business` affiché
 * « Affaires ».
 */
export const NOM_DU_GROUPE: Readonly<Record<GroupeEmoji, string>> = {
  visages: 'Visage',
  coeurs: 'Cœur',
  monstres: 'Monstre',
  gens: 'Gens',
  mains: 'Main',
  corps: 'Corps',
  animaux: 'Animal',
  nature: 'Nature',
  nourriture: 'Nourriture',
  lieux: 'Lieu',
  ciel: 'Ciel',
  activites: 'Activité',
  objets: 'Objet',
  symboles: 'Symbole',
  drapeaux: 'Drapeau',
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

/** Une carte-emoji. Les deux derniers champs sont DÉRIVÉS. */
export interface CarteEmoji {
  /** Les points de code, en minuscules et séparés par des tirets : `1f600`. */
  id: string
  /** Le caractère lui-même, séquence complète comprise. */
  emoji: string
  /** Le nom français (CLDR `tts`), ou le nom anglais d'Unicode à défaut. */
  nom: string
  groupe: GroupeEmoji
  /**
   * LES MOTS-CLÉS FRANÇAIS de CLDR, et c'est eux qui font le cartouche.
   *
   * *C'est exactement ce qu'un cartouche doit dire d'un emoji* : « content ·
   * dents · heureux · joyeux · rire » décrit un visage mieux qu'une phrase.
   */
  mots: string[]
  /** La version Unicode d'introduction, sans le `E` : `0.6`, `15.1`. */
  version: string
  /** L'année de cette version — voir `ANNEE_DE_VERSION` dans le pipeline. */
  annee: number
/**
   * GOOGLE EN PUBLIE UNE VERSION ANIMÉE — une POSSIBILITÉ, pas un état.
   *
   * ***Le champ s'appelait `anime`, et il devait changer de nom*** : depuis que
   * les bonus se tirent à l'ouverture, « animé » dit qu'un EXEMPLAIRE l'est.
   * *Deux choses qui portent le même mot finissent par se confondre* — celle-ci
   * dit seulement qu'une animation existe, donc qu'un exemplaire PEUT en
   * recevoir une.
   */
  animable: boolean
  /**
   * LE GROUPE DE FRÉQUENCE D'UNICODE — 0 pour les plus employés, `null` pour
   * ceux qui ne sont pas au classement.
   *
   * **Chaque groupe vaut la MOITIÉ du précédent en fréquence d'usage** : le 0
   * ne contient que deux emoji, le 11 et au-delà sont sous la médiane. *C'est
   * donc une échelle logarithmique de popularité réelle*, et c'est elle qui
   * porte la rareté — voir le pipeline.
   */
  frequence: number | null
  /**
   * LA PLACE AU CLASSEMENT DU CATALOGUE, 1 pour le plus employé.
   *
   * *Elle n'est pas le rang d'Unicode* : elle range les 1 923 cartes, classées
   * ou non, dans l'ordre exact qui décide des crans. **C'est donc le seul
   * chiffre dont la rareté dérive**, et c'est lui que la carte affiche.
   */
  rang: number
  rarete: RareteEmoji
}

function estGroupe(v: unknown): v is GroupeEmoji {
  return typeof v === 'string' && (GROUPES_EMOJI as readonly string[]).includes(v)
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
  if (typeof c.id !== 'string' || c.id === '') return null
  if (typeof c.emoji !== 'string' || c.emoji === '') return null
  if (typeof c.nom !== 'string' || c.nom === '') return null
  if (!estGroupe(c.groupe)) return null
  if (!estRarete(c.rarete)) return null
  if (typeof c.version !== 'string') return null
  if (typeof c.annee !== 'number' || !Number.isFinite(c.annee)) return null
  if (typeof c.animable !== 'boolean') return null
  if (typeof c.rang !== 'number' || !Number.isFinite(c.rang)) return null
  const frequence = typeof c.frequence === 'number' && Number.isFinite(c.frequence) ? c.frequence : null
  const mots = Array.isArray(c.mots) && c.mots.every((m) => typeof m === 'string') ? (c.mots as string[]) : []
  return {
    id: c.id,
    emoji: c.emoji,
    nom: c.nom,
    groupe: c.groupe,
    mots,
    version: c.version,
    annee: c.annee,
    animable: c.animable,
    frequence,
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

/** Les cartes d'un groupe — les rayons de la collection. */
export function parGroupe(cartes: readonly CarteEmoji[]): Map<GroupeEmoji, CarteEmoji[]> {
  const m = new Map<GroupeEmoji, CarteEmoji[]>()
  for (const c of cartes) {
    const l = m.get(c.groupe)
    if (l === undefined) m.set(c.groupe, [c])
    else l.push(c)
  }
  return m
}

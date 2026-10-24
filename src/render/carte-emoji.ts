/**
 * UNE CARTE-EMOJI DESSINÉE AVEC LE GABARIT DU JEU.
 *
 * Elle ne redessine rien : elle se convertit en `CarteAPeindre` et c'est
 * `peindreCarte` qui s'en charge — même plaque de laiton, même coque déchirée,
 * même cadre teinté par la rareté. *Un second gabarit aurait dérivé du premier
 * au premier réglage*, la leçon des quatre fonctions qui peignaient chacune
 * leur carte avant `corpsCarte`.
 *
 * Il vit dans `render/` et non dans `logic/` : `CarteAPeindre` est un type de
 * rendu, et `logic/` ne connaît pas le rendu.
 */
import type { CarteAPeindre } from './texture-carte.ts'
import { NOM_DE_LA_RACE, NOM_DU_ROLE, type CarteEmoji, type RareteEmoji } from '../logic/emoji/types.ts'
import type { Bonus } from '../logic/emoji/tirage.ts'
import { urlDeLIllustration } from '../ui/art.ts'

/**
 * UN CRAN, UNE COULEUR — **et c'est la table que Keko a dictée.**
 *
 * « commun, peu commun, rare, épique, légendaire (blanc, vert, bleu, violet,
 * orange) », puis « le mode emoji seulement ». *Les quatre autres modes gardent
 * les métaux*, donc les deux échelles cohabitent dans `METAUX` — et c'est
 * précisément pourquoi les couleurs y sont nommées par leur COULEUR : trois des
 * cinq crans portent le même nom qu'un métal (`rare`, `epique`, `legendaire`),
 * donc les nommer par leur cran les aurait fait se recouvrir en silence.
 *
 * *Il reste une table plutôt qu'un passe-plat* pour la raison déjà écrite dans
 * les deux modes précédents : le mode descente dit `commune` là où un emoji est
 * `commun`. **Deux vocabulaires qui se ressemblent à une lettre près sont
 * précisément ceux qu'il ne faut pas confondre en silence.**
 */
export const COULEUR: Readonly<Record<RareteEmoji, string>> = {
  commun: 'blanc',
  'peu-commun': 'vert',
  rare: 'bleu',
  epique: 'violet',
  legendaire: 'orange',
}

/** La majuscule du nom se pose au RENDU : CLDR écrit en minuscules. */
export function enTitre(texte: string): string {
  const [premier, ...reste] = [...texte]
  return premier === undefined ? texte : premier.toUpperCase() + reste.join('')
}

/**
 * LE CARTOUCHE EST VIDE, pour l'instant : Keko, « inutile de marquer
 * "holographique" dans la description de la carte » — le reflet se voit. **La
 * puissance et les effets viendront ici** (voir `docs/fantasy.md`).
 */
function mots(_bonus?: Bonus): string[] {
  return []
}

/**
 * Convertit une carte-emoji en carte à peindre.
 *
 * **L'ILLUSTRATION EST LE CARACTÈRE LUI-MÊME**, peint au canvas avec Noto Color
 * Emoji : voir `imageDeLEmoji`. *Il n'y a pas d'image à charger*, donc pas de
 * sceau de repli à craindre — et tout le reste du pipeline (le décor, le bloom,
 * le cadre) marche sans une ligne de plus.
 *
 * **L'EMOJI RENTRE ENTIER** (`illustrationEntiere`), comme une peinture : il est
 * peint sur une toile carrée alors que la fenêtre d'art est plus haute que
 * large, donc un `cover` lui couperait les flancs. *Ce qui reste découvert
 * laisse voir le fond peint de la carte*, qui fait le passe-partout.
 *
 * **LE PIED PORTE LE GROUPE**, là où une carte de jeu porte son type. *« Emoji »
 * ne dirait rien* : toutes les cartes du mode en sont un.
 *
 * **PAS DE CHIFFRE, PAS DE COÛT, PAS DE CIEL DE FAMILLE** — les trois raisons
 * sont celles des peintures : un chiffre posé là devrait dire quelque chose, une
 * orbe de PA mentirait sur une carte qui ne se joue pas, et neuf ciels
 * disputeraient l'axe de la rareté.
 */
export function carteDeLEmoji(c: CarteEmoji, bonus?: Bonus): CarteAPeindre {
  return {
    id: c.id,
    nom: c.nom,
    cout: null,
    effet: mots(bonus),
    // LA PASTILLE PORTE LES DEUX TAGS, race et rôle (Keko).
    type: `${NOM_DE_LA_RACE[c.race]} · ${NOM_DU_ROLE[c.role]}`,
    rarete: COULEUR[c.rarete],
    holo: bonus?.holo,
    emoji: c.emoji,
    // L'ILLUSTRATION DE KEKO, détourée : le peintre en fait le sticker.
    emojiPerso: urlDeLIllustration(c.image),
    illustrationEntiere: true,
    // ET SON CONTOUR EST SIMPLE. Keko : « un contour plus simple, plus dans le
    // ton des emojis ». *La coque déchirée du gabarit parle la ferronnerie* :
    // voir `CarteAPeindre.contour`.
    contour: 'simple',
    // ET SA ZONE DE TEXTE EST UNE BULLE : voir `CarteAPeindre.texte`.
    texte: 'bulle',
    // LE CAMP DES ORCS, peint par Keko, derrière les orcs (`?camp=0` : l'éclat).
    fondImage: c.race === 'orc' && AVEC_CAMP ? 'fonds/camp-orc.webp' : undefined,
  }
}

const AVEC_CAMP = typeof location === 'undefined' || new URLSearchParams(location.search).get('camp') !== '0'

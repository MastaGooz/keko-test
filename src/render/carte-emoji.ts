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
import { NOM_DU_GROUPE, type CarteEmoji, type RareteEmoji } from '../logic/emoji/types.ts'
import type { Bonus } from '../logic/emoji/tirage.ts'
import { urlEmojiDeKeko } from '../ui/art.ts'

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
 * LE CARTOUCHE PORTE LES MOTS-CLÉS, puis l'année.
 *
 * **C'est exactement ce qu'un cartouche doit dire d'un emoji** : « content ·
 * dents · heureux · joyeux · rire » décrit un visage mieux qu'une phrase, et
 * ce sont les mots que CLDR documente — *donc ceux qu'un francophone emploie
 * vraiment pour le chercher.*
 *
 * **Les mots qui répètent le nom sont retirés**, et il le faut : CLDR met
 * presque toujours le nom dans ses propres mots-clés, donc sans ce filtre la
 * ligne commencerait par redire le titre de la carte. *Une carte qui se répète
 * perd une ligne de cartouche pour rien.*
 *
 * **Cinq au plus** : le cartouche a trois crans de taille et descend d'un cran
 * dès qu'il s'allonge — *une liste qui déborde ne se lit pas mieux parce
 * qu'elle est complète.*
 */
function mots(c: CarteEmoji, bonus?: Bonus): string[] {
  const nom = c.nom.toLowerCase()
  const utiles = c.mots.filter((m) => m.toLowerCase() !== nom && !nom.includes(m.toLowerCase()))
  const lignes: string[] = []
  if (utiles.length > 0) lignes.push(utiles.slice(0, 5).join(' · '))
  /**
   * LA PLACE AU CLASSEMENT D'USAGE, parce que c'est elle qui porte la rareté.
   *
   * *Si un chiffre décide du métal, il doit se lire sur la carte* — sinon le
   * joueur ne sait pas pourquoi celle-ci vaut plus que sa voisine. **Et c'est
   * la popularité RÉELLE** depuis que le classement d'Unicode est branché :
   * voir `notoriete` dans le pipeline.
   *
   * Les 24 % que le classement ignore disent leur année à la place : *ce sont
   * les emoji postérieurs à Unicode 12.0*, et l'ancienneté est tout ce qu'on
   * sait d'eux.
   */
  const place = c.frequence === null ? `Unicode ${c.annee}` : `${c.rang}ᵉ au classement d’usage`
  /**
   * LES BONUS SE DISENT, parce qu'ils ne se devinent pas tous.
   *
   * *L'animé se voit* — la carte bouge — **mais l'holographique est un reflet,
   * donc il dépend de l'angle** : sur un écran immobile, rien ne dit si c'est
   * la carte qui irise ou la lumière qui passe. Le cartouche le nomme.
   *
   * **Et il ne dit plus « animé » quand il l'est seulement en PUISSANCE.** La
   * carte annonçait son `animable`, donc un tiers du catalogue promettait un
   * mouvement que l'exemplaire n'avait pas : *une carte ne dit que ce qu'elle
   * est, jamais ce qu'elle aurait pu être.*
   */
  const bonus_ = [bonus?.holo === true ? 'holographique' : null, bonus?.anime === true ? 'animé' : null]
    .filter((m): m is string => m !== null)
  lignes.push(bonus_.length === 0 ? place : `${place} · ${bonus_.join(' · ')}`)
  return lignes
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
    nom: enTitre(c.nom),
    cout: null,
    effet: mots(c, bonus),
    type: NOM_DU_GROUPE[c.groupe],
    rarete: COULEUR[c.rarete],
    holo: bonus?.holo,
    emoji: c.emoji,
    // L'EMOJI DESSINÉ PAR KEKO passe devant le glyphe Noto : voir `urlEmojiDeKeko`.
    emojiPerso: urlEmojiDeKeko(c.id) ?? undefined,
    // L'ANIMATION EST DEMANDEE PAR LA CARTE, PAS PAR LE PEINTRE : voir
    // `emoji-anime.ts`. *Un emoji sans version animee n'en demande aucune*, et
    // la carte reste statique -- comme sur un navigateur sans `ImageDecoder`.
    //
    // **ET C'EST LE BONUS QUI DECIDE, plus le catalogue.** Le champ du
    // catalogue ne dit que ce qui est POSSIBLE (`animable`) : *un emoji animable
    // dont l'exemplaire n'a pas tire le bonus reste statique*, sinon le bonus
    // n'en serait pas un -- un tiers du catalogue l'aurait eu d'office.
    animation: bonus?.anime === true ? c.id : undefined,
    illustrationEntiere: true,
    // ET SON CONTOUR EST SIMPLE. Keko : « un contour plus simple, plus dans le
    // ton des emojis ». *La coque déchirée du gabarit parle la ferronnerie*, et
    // un emoji est un aplat net : voir `CarteAPeindre.contour`.
    contour: 'simple',
    // ET SA ZONE DE TEXTE EST UNE BULLE. Keko : « la police et la zone de texte
    // (dégradé noir) sont hors du thème ; on veut un style proche de l'univers
    // smartphone / fun des emoji ». Voir `CarteAPeindre.texte`.
    texte: 'bulle',
  }
}

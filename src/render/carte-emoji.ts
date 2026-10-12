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

/**
 * UN CRAN, UN MÉTAL.
 *
 * *Il reste une table plutôt qu'un passe-plat* pour la raison déjà écrite dans
 * les deux modes précédents : le mode descente dit `commune` là où un emoji est
 * `commun`. **Deux vocabulaires qui se ressemblent à une lettre près sont
 * précisément ceux qu'il ne faut pas confondre en silence.**
 */
const METAL: Readonly<Record<RareteEmoji, string>> = {
  commun: 'commune',
  rare: 'rare',
  epique: 'epique',
  legendaire: 'legendaire',
}

/** La majuscule du nom se pose au RENDU : CLDR écrit en minuscules. */
function enTitre(texte: string): string {
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
function mots(c: CarteEmoji): string[] {
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
  lignes.push(c.anime ? `${place} · animé` : place)
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
export function carteDeLEmoji(c: CarteEmoji): CarteAPeindre {
  return {
    id: c.id,
    nom: enTitre(c.nom),
    cout: null,
    effet: mots(c),
    type: NOM_DU_GROUPE[c.groupe],
    rarete: METAL[c.rarete],
    emoji: c.emoji,
    // L'ANIMATION EST DEMANDEE PAR LA CARTE, PAS PAR LE PEINTRE : voir
    // `emoji-anime.ts`. *Un emoji sans version animee n'en demande aucune*, et
    // la carte reste statique -- comme sur un navigateur sans `ImageDecoder`.
    animation: c.anime ? c.id : undefined,
    illustrationEntiere: true,
  }
}

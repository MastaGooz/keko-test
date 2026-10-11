/**
 * UNE CARTE-PEINTURE DESSINÉE AVEC LE GABARIT DU JEU.
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
import type { CartePeinture, RaretePeinture } from '../logic/paintings/types.ts'

/**
 * UN CRAN, UN MÉTAL.
 *
 * *Il reste une table plutôt qu'un passe-plat* pour la raison déjà écrite dans
 * le mode personnages : le mode descente dit `commune` là où une peinture est
 * `commun`. **Deux vocabulaires qui se ressemblent à une lettre près sont
 * précisément ceux qu'il ne faut pas confondre en silence.**
 */
const METAL: Readonly<Record<RaretePeinture, string>> = {
  commun: 'commune',
  rare: 'rare',
  epique: 'epique',
  legendaire: 'legendaire',
}

/**
 * LA MAJUSCULE SE POSE AU RENDU, PAS DANS LA DONNÉE.
 *
 * Wikidata écrit ses libellés comme des entrées de dictionnaire, donc les
 * genres arrivent en minuscule — « art religieux », « scène de genre ». *Un mot
 * gravé au pied d'une carte commence par une majuscule*, c'est vrai de tout le
 * reste du jeu.
 *
 * Elle se pose ICI et non dans le pipeline, exactement comme pour les
 * personnages : *le catalogue garde ce que Wikidata dit*, donc le jour où l'on
 * change d'avis il n'y a pas trois mille cartes à réengendrer.
 *
 * Le découpage se fait par POINT DE CODE (`[...texte]`) : un `charAt(0)` coupe
 * en deux un caractère hors BMP et laisse une moitié de paire orpheline.
 */
function enTitre(texte: string): string {
  const [premier, ...reste] = [...texte]
  return premier === undefined ? texte : premier.toUpperCase() + reste.join('')
}

/** L'année telle qu'on la lit : « 1889 », « 50 av. J.-C. ». */
function anneeEnClair(annee: number): string {
  return annee < 0 ? `${-annee} av. J.-C.` : String(annee)
}

/**
 * Convertit une carte-peinture en carte à peindre.
 *
 * **LE CARTOUCHE PORTE DEUX LIGNES : qui, puis quand et où.** Le peintre tient
 * sa ligne à lui parce que c'est le fait principal — *c'est le seul axe qu'un
 * joueur comprend sans rien lire, « j'ai trois Van Gogh »* — et l'année avec le
 * musée se partagent la seconde. **Deux lignes tiennent au grand cran du
 * cartouche**, là où trois le font descendre.
 *
 * **LE PIED PORTE LE GENRE**, là où une carte de jeu porte son type et un
 * personnage son domaine. C'est exactement la même sorte d'information — la
 * famille à laquelle la carte appartient — donc elle se lit au même endroit.
 * *« Peinture » ne dirait rien* : toutes les cartes du mode en sont une.
 *
 * **PAS DE CHIFFRE AU PIED.** Keko : « on va faire une valeur = rareté pour
 * commencer » — donc la notoriété se lit au métal du cadre, et le pied reste
 * nu. *Un chiffre posé là devrait dire quelque chose*, et il n'y a rien de plus
 * à dire aujourd'hui.
 *
 * **PAS DE CIEL DE FAMILLE.** Le mode descente en a quatre, déjà désaturés de
 * moitié pour ne pas disputer l'axe de la rareté ; quatre-vingt-quinze genres en
 * réclameraient autant, ce que le projet a refusé — *une échelle se dit en
 * couleur, une famille se dit en forme.*
 */
export function carteDeLaPeinture(c: CartePeinture): CarteAPeindre {
  const quand = anneeEnClair(c.annee)
  const lignes = [c.peintre ?? 'Anonyme']
  lignes.push(c.musee === null ? quand : `${quand} · ${c.musee}`)

  return {
    id: c.id,
    nom: c.nom,
    // ELLE NE COÛTE RIEN : son coin haut-gauche reste nu, voir `CarteAPeindre`.
    cout: null,
    effet: lignes,
    type: c.genre === null ? 'Peinture' : enTitre(c.genre),
    rarete: METAL[c.rarete],
    illustration: c.image,
    // L'ŒUVRE RENTRE ENTIÈRE : voir `illustrationEntiere`. Mesuré, 43 % des
    // peintures sont en paysage et un `cover` en rognerait la moitié.
    illustrationEntiere: true,
  }
}

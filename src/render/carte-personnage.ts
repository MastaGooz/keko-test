/**
 * UNE CARTE-PERSONNAGE DESSINÉE AVEC LE GABARIT DU JEU.
 *
 * Elle ne redessine rien : elle se convertit en `CarteAPeindre` et c'est
 * `peindreCarte` qui s'en charge — même plaque de laiton, même coque déchirée,
 * même illustration en plein format, même cadre teinté par la rareté.
 * *Un second gabarit aurait dérivé du premier au premier réglage*, la leçon
 * des quatre fonctions qui peignaient chacune leur carte avant `corpsCarte`.
 *
 * Il vit dans `render/` et non dans `logic/` : `CarteAPeindre` est un type de
 * rendu, et `logic/` ne connaît pas le rendu.
 */
import type { CarteAPeindre } from './texture-carte.ts'
import type { CharacterCard, Rarete } from '../logic/characters/types.ts'

/**
 * LES CINQ CRANS DU CATALOGUE RETOMBENT SUR LES QUATRE MÉTAUX DU JEU.
 *
 * **C'est à trancher par Keko, et voilà le choix par défaut.** L'échelle des
 * alliages — bronze, argent, or, diamant — a été réglée et mesurée : le projet
 * a même SUPPRIMÉ un cinquième cran (le laiton) parce que *deux jaunes rompus
 * voisins ne font pas deux crans*. **Quatre est donc ce que le dessin peut
 * porter**, et les cinq crans du mode personnage sont, eux, un placeholder que
 * j'ai écrit sans le lui demander.
 *
 * `commun` et `peu-commun` partagent donc le bronze, et ça tombe juste : ils
 * font 74 % du catalogue, pour 19,5 % d'argent, 5,8 % d'or et 0,8 % de
 * diamant — *exactement la pyramide qu'on attend d'un jeu de collection.*
 *
 * Les clés de droite sont celles de `METAUX`, qui ne sont PAS les mêmes mots
 * (`commune` et non `commun`) : c'est le vocabulaire du mode descente, et il
 * reste chez lui.
 */
const METAL: Readonly<Record<Rarete, string>> = {
  commun: 'commune',
  'peu-commun': 'commune',
  rare: 'rare',
  epique: 'epique',
  legendaire: 'legendaire',
}

/** Le domaine tel qu'il se lit au pied de la carte. */
const DOMAINE_AFFICHE: Readonly<Record<string, string>> = {
  militaire: 'Militaire',
  politique: 'Politique',
  artiste: 'Artiste',
  scientifique: 'Scientifique',
  penseur: 'Penseur',
  religieux: 'Religieux',
  sportif: 'Sportif',
  explorateur: 'Explorateur',
  fiction: 'Fiction',
  autre: 'Personnage',
}

/**
 * LE PORTRAIT — et le catalogue porte déjà une URL de VIGNETTE DIRECTE.
 *
 * C'est le pipeline qui la calcule (voir `vignetteCommons`), et il le faut :
 * l'URL `Special:FilePath` que rend Wikidata répond par une **redirection sans
 * en-tête CORS**, donc une image chargée en `crossOrigin="anonymous"` — ce
 * qu'un canvas exige pour ne pas être taché — échoue avant d'arriver.
 *
 * Il ne reste donc rien à réparer ici, et c'est voulu : *une adresse se répare
 * là où elle s'écrit.* Le repli, lui, reste dans `peindreCarte` — une carte
 * sans portrait sort avec le sceau, qui est exactement ce qu'il est là pour
 * dire.
 */
export function urlDuPortrait(image: string | null): string | undefined {
  return image === null || image === '' ? undefined : image
}

/**
 * LA DESCRIPTION NE REDIT PAS LES DATES.
 *
 * Wikidata les glisse souvent entre parenthèses à la fin — « poétesse et
 * réalisatrice iranienne (1935-1967) » — alors que la carte les porte déjà sur
 * la ligne au-dessus. *Deux fois la même chose à deux lignes d'écart se lit
 * comme une erreur*, et ça coûte une ligne de cartouche à une bande qui en a
 * trois.
 *
 * On ne retire que ce qui RESSEMBLE à une plage d'années, et seulement à la
 * fin : une parenthèse au milieu d'une phrase dit autre chose.
 */
function sansLesDates(texte: string): string {
  return texte.replace(/\s*\((?:v\.\s*)?-?\d{1,4}\s*[-–—]\s*-?\d{1,4}\)\s*$/, '').trim()
}

/**
 * LA MAJUSCULE SE POSE AU RENDU, PAS DANS LA DONNÉE.
 *
 * Wikidata écrit ses libellés comme des entrées de dictionnaire, donc sept
 * personnages du catalogue arrivent en minuscule — « chat de Schrödinger »,
 * « père Noël », « roi Arthur », « golem ». Ce sont des noms COMMUNS employés
 * comme noms propres, et *un nom de carte commence par une majuscule* : c'est
 * vrai de tout le reste du jeu.
 *
 * Elle se pose ICI et non dans le pipeline, exactement comme le titre des
 * encadrés du glossaire : *le catalogue garde ce que Wikidata dit*, donc le
 * jour où l'on change d'avis il n'y a pas trois mille cartes à réengendrer.
 *
 * Et le découpage se fait par POINT DE CODE (`[...texte]`) : un `charAt(0)`
 * coupe en deux un caractère hors BMP et laisse une moitié de paire
 * orpheline.
 */
function enTitre(texte: string): string {
  const [premier, ...reste] = [...texte]
  return premier === undefined ? texte : premier.toUpperCase() + reste.join('')
}

/** Les dates, telles qu'on les lit sur la carte : « 1769 – 1821 », « -384 – -322 ». */
function dates(c: CharacterCard): string | null {
  if (c.naissance === null && c.mort === null) return null
  const an = (n: number) => (n < 0 ? `${-n} av. J.-C.` : String(n))
  if (c.naissance !== null && c.mort !== null) return `${an(c.naissance)} – ${an(c.mort)}`
  return an((c.naissance ?? c.mort) as number)
}

/**
 * Convertit une carte-personnage en carte à peindre.
 *
 * **Le cartouche porte les dates puis la description**, dans cet ordre : *une
 * date situe, une description qualifie* — et la description de Wikidata est
 * souvent longue, donc elle descend d'un cran de taille sans emporter les
 * dates avec elle.
 *
 * **Le pied porte le DOMAINE**, là où une carte de jeu porte son type. C'est
 * exactement la même sorte d'information — la famille à laquelle elle
 * appartient — donc elle se lit au même endroit.
 *
 * **Pas de ciel de famille.** Le mode descente en a quatre (arme, armure,
 * objet, butin), et ils ont déjà été désaturés de moitié pour ne pas disputer
 * l'axe de la rareté ; dix domaines en réclameraient dix, ce que le projet a
 * refusé explicitement — *une échelle se dit en couleur, une famille se dit en
 * forme.* Le domaine se lit donc au pied, et le portrait occupe la carte.
 */
export function carteDuPersonnage(c: CharacterCard): CarteAPeindre {
  const lignes: string[] = []
  const d = dates(c)
  if (d !== null) lignes.push(d)
  // Les dates ne se disent qu'une fois : on ne les retire de la description que
  // si la carte les porte déjà au-dessus.
  const quoi = d === null ? c.description : sansLesDates(c.description)
  if (quoi !== '') lignes.push(quoi)
  if (lignes.length === 0) lignes.push(c.origine ?? 'Personnage')

  return {
    id: c.id,
    nom: enTitre(c.nom),
    // ELLE NE COÛTE RIEN : son coin haut-gauche reste nu, voir `CarteAPeindre`.
    cout: null,
    effet: lignes,
    type: DOMAINE_AFFICHE[c.domaine] ?? 'Personnage',
    rarete: METAL[c.rarete],
    illustration: urlDuPortrait(c.image),
    attaque: c.attaque,
    defense: c.defense,
  }
}

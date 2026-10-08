/**
 * UNE CARTE-ANIMAL DESSINÉE AVEC LE GABARIT DU JEU.
 *
 * Elle ne redessine rien : elle se convertit en `CarteAPeindre` et c'est
 * `peindreCarte` qui s'en charge — même plaque de laiton, même coque déchirée,
 * même illustration en plein format, même cadre teinté par la rareté.
 * *Un second gabarit aurait dérivé du premier au premier réglage*, la leçon
 * des quatre fonctions qui peignaient chacune leur carte avant `corpsCarte`.
 *
 * **LES QUATRE OUVERTURES DU GABARIT FAITES POUR LES PERSONNAGES SERVENT
 * TELLES QUELLES**, et c'est ce qui a rendu ce portage gratuit :
 * l'illustration par URL — *ce mode DÉCOUVRE ses images, il n'y a pas de table
 * à écrire* — le coût `null`, les deux mesures du pied, et l'absence de ciel de
 * famille. ***Une ouverture faite pour une bonne raison sert au cas suivant.***
 *
 * Il vit dans `render/` et non dans `logic/` : `CarteAPeindre` est un type de
 * rendu, et `logic/` ne connaît pas le rendu.
 */
import type { CarteAPeindre } from './texture-carte.ts'
import type { CarteAnimal, RareteAnimal, StatutUicn } from '../logic/animals/types.ts'

/**
 * UN CRAN, UN MÉTAL — et la table dit la correspondance à voix haute.
 *
 * *Elle n'est pas un passe-plat* : le mode descente dit `commune` là où un
 * animal est `commun`. **Deux vocabulaires qui se ressemblent à une lettre
 * près sont précisément ceux qu'il ne faut pas confondre en silence** — un
 * `commun` passé tel quel au peintre tombe sur son repli et toute la
 * collection sort en bronze sans qu'aucune erreur ne le dise.
 */
const METAL: Readonly<Record<RareteAnimal, string>> = {
  commun: 'commune',
  rare: 'rare',
  epique: 'epique',
  legendaire: 'legendaire',
}

/**
 * LE STATUT UICN SE DIT EN FRANÇAIS, pas en sigle.
 *
 * Le catalogue garde le code que Wikidata emploie — *une donnée engendrée ne
 * porte pas une convention d'affichage*, la règle de la majuscule du nom — et
 * c'est le rendu qui le traduit. « VU » ne dit rien à personne, « Vulnérable »
 * dit tout.
 */
const UICN_AFFICHE: Readonly<Record<StatutUicn, string>> = {
  EX: 'Éteint',
  EW: 'Éteint à l’état sauvage',
  CR: 'En danger critique',
  EN: 'En danger',
  VU: 'Vulnérable',
  NT: 'Quasi menacé',
  LC: 'Non menacé',
  DD: 'Données insuffisantes',
}

/**
 * LA MASSE A ÉTÉ MESURÉE ET ÉCARTÉE — elle reste dans le catalogue, pas sur la
 * carte.
 *
 * Wikidata la porte sous P2067, et le pipeline la normalise bien en
 * kilogrammes (`psn:`, sans quoi une souris écrite en grammes se lirait 20 kg).
 * **Ce n'est pas le problème.** Mesuré sur le catalogue :
 *
 * - elle n'existe que sur **182 cartes sur 4 464**, soit 4 % ;
 * - et quand elle existe, elle est fausse une fois sur deux : *Tigre 1,19 kg,
 *   Girafe 54,5 kg, Zèbre de Grévy 40 kg* — **ce sont des masses de
 *   NOUVEAU-NÉS**, que Wikidata range sous la même propriété sans qualificatif
 *   qu'on puisse filtrer d'une requête.
 *
 * ***Une mesure absente neuf fois sur dix et fausse une fois sur deux n'est pas
 * une mesure.*** Le statut UICN, lui, couvre **95,4 %** du catalogue et mes
 * cinq contrôles tombent juste (Lion vulnérable, Tigre en danger, Ours brun non
 * menacé) : c'est lui qui parle sur la carte.
 *
 * *La masse reste dans `animals.json`* — elle ne coûte rien à garder, et un
 * `MAX` au lieu du `SAMPLE` de la requête la rendrait peut-être utilisable un
 * jour. Mais ce jour-là il faudra la remesurer, pas la supposer réparée.
 */

/**
 * LA CASSE SE POSE AU RENDU, PAS DANS LA DONNÉE.
 *
 * Elle corrige deux défauts opposés, et ils viennent de deux sources
 * différentes :
 *
 * **En minuscule** — Wikidata écrit ses libellés comme des entrées de
 * dictionnaire, donc une part du catalogue arrive en bas de casse : « loup »,
 * « raton laveur », « saki moine de Vanzolini ». Or *un nom de carte commence
 * par une majuscule*, c'est vrai de tout le reste du jeu.
 *
 * **En CASSE DE TITRE ANGLAISE** — les noms vernaculaires de GBIF sont
 * capitalisés mot à mot, à l'anglaise : « Globicéphale Commun », « Lynx Du
 * Désert », « Marsouin Du Golfe De Californie ». **Mesuré : 428 cartes sur
 * 4 464, soit 9,6 %** — assez pour que la collection paraisse écrite par deux
 * mains.
 *
 * *En français, seul le premier mot prend la majuscule*, donc on abaisse le
 * reste — mais SEULEMENT quand TOUS les mots sont capitalisés : c'est la
 * signature de la casse anglaise, et elle ne peut pas se confondre avec un nom
 * qui porte un vrai nom propre. « Taupe-dorée de De Winton », « Petit Molosse
 * de La Réunion », « Lépilémur de Seal » gardent le leur, parce que leur
 * mot-outil est déjà en minuscule.
 *
 * **PRIX MESURÉ, ET IL EST ASSUMÉ** : une quarantaine de noms géographiques
 * pris dans un titre anglais y perdent leur majuscule — « Mouflon d'amérique »,
 * « Macaque de célèbes ». *Dix noms corrigés pour un abîmé*, et un lieu en
 * minuscule se lit infiniment mieux qu'un adjectif en majuscule au milieu d'une
 * collection. ***Une règle de langue doit s'appliquer sans réfléchir*** — la
 * leçon du vouvoiement : une règle qui demande de juger au cas par cas n'est
 * pas une règle.
 *
 * Tout ça se pose ICI et non dans le pipeline, exactement comme le titre des
 * encadrés du glossaire : *le catalogue garde ce que la source dit*, donc le
 * jour où l'on change d'avis il n'y a pas quatre mille cartes à réengendrer.
 */
function enTitre(texte: string): string {
  const mots = texte.split(' ')
  // La casse anglaise se reconnaît à ce que TOUS les mots sont capitalisés.
  const anglaise =
    mots.length > 1 && mots.every((m) => /^[A-ZÀ-ÖØ-Þ]/.test(m))
  const corps = anglaise ? [mots[0]!, ...mots.slice(1).map((m) => m.toLowerCase())] : mots
  // Le découpage se fait par POINT DE CODE : un `charAt(0)` coupe en deux un
  // caractère hors BMP et laisse une moitié de paire orpheline.
  const [premier, ...reste] = [...corps.join(' ')]
  return premier === undefined ? texte : premier.toUpperCase() + reste.join('')
}

/**
 * Convertit une carte-animal en carte à peindre.
 *
 * **Le cartouche porte le nom scientifique puis le statut de conservation.**
 * Le binôme latin d'abord parce qu'il IDENTIFIE — c'est ce qu'une carte de
 * collection naturaliste porte toujours, et il tient sur une ligne — puis le
 * statut, qui qualifie. *Et il dit quelque chose qu'aucune autre donnée ne
 * dit* : qu'il reste des tigres pour combien de temps.
 *
 * **Le pied porte le RAYON** (« Carnivores », « Chauve-souris »), là où une
 * carte de jeu porte son type. C'est exactement la même sorte d'information —
 * la famille à laquelle elle appartient — donc elle se lit au même endroit.
 * *C'est le seul héritage de l'arbre abandonné, et c'est le bon.*
 *
 * **Pas de ciel de famille.** Le mode descente en a quatre (arme, armure,
 * objet, butin), et ils ont déjà été désaturés de moitié pour ne pas disputer
 * l'axe de la rareté ; vingt-neuf ordres en réclameraient vingt-neuf, ce que
 * le projet a refusé explicitement — *une échelle se dit en couleur, une
 * famille se dit en forme.* Le rayon se lit donc au pied, et la photo occupe
 * la carte.
 *
 * **LES DEUX MESURES DU PIED RESTENT VIDES pour cette première passe**, et
 * c'est en attente de Keko : un animal a une masse, un statut de conservation
 * et un nombre de vues, et *lequel des trois mérite un chiffre gravé est une
 * décision de design.* Une mesure inventée serait plus dure à défaire qu'une
 * place laissée nue.
 */
export function carteDeLAnimal(c: CarteAnimal): CarteAPeindre {
  // LE BINÔME NE SE DIT PAS DEUX FOIS. Deux cent quatre-vingt-treize cartes
  // n'ont pas d'autre nom que leur nom scientifique — c'est le dernier recours
  // de la cascade, et il est assumé — mais alors le cartouche répétait mot pour
  // mot le titre juste au-dessus. *Une carte qui dit deux fois la même chose a
  // l'air cassée*, et elle perdait sa seule ligne utile.
  //
  // LE TEXTE EST NU, sans italique : *le peintre ne connaît que cinq balises* —
  // `<b>` pour la graisse, quatre pour la couleur — et il AVALE toute balise
  // inconnue sans rien dire. Une `<i>` écrite ici ne serait pas un italique, ce
  // serait une intention perdue en silence.
  const lignes: string[] = c.nom_fr === c.nom_scientifique ? [] : [c.nom_scientifique]

  if (c.statut_uicn !== null) lignes.push(UICN_AFFICHE[c.statut_uicn])

  return {
    id: c.id,
    nom: enTitre(c.nom_fr),
    // ELLE NE COÛTE RIEN : son coin haut-gauche reste nu, voir `CarteAPeindre`.
    cout: null,
    effet: lignes,
    type: c.ordre_fr,
    rarete: METAL[c.rarete],
    illustration: c.image ?? undefined,
  }
}

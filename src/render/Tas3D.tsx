/**
 * LA PIOCHE ET LA DÉFAUSSE, en symbole.
 *
 * Le jeu 2D en faisait de vraies piles de dos de carte, enfouies sous le bord
 * comme la main — « un tas doit être fait des mêmes cartes que la main, sinon
 * c'est l'icône d'un tas et pas un tas ». **Ici c'est l'inverse, et c'est
 * voulu** : Keko a demandé un symbole, un paquet vu en 3/4 avec un coin tourné
 * vers le bas. La scène 3D a déjà ses cartes en volume ; ces deux-là ne se
 * manipulent jamais, elles se consultent — *ce qu'on ne touche pas n'a pas
 * besoin d'être un objet.*
 *
 * **CE SONT MAINTENANT LES DESSINS DE KEKO** (`Pioche.png`, `Défausse.png`),
 * qui remplacent le losange qu'on projetait à la main. Un seul fichier a
 * d'abord servi aux deux ; chacun porte désormais SON symbole — un éventail
 * d'un côté, une carte barrée de l'autre — parce que *deux tas qui ne disent
 * pas la même chose n'ont pas de raison de montrer le même dessin*.
 *
 * Ce que le losange a coûté reste dans `git log`, et ses deux leçons valent
 * d'être retenues : *un losange symétrique ne peut pas être autre chose qu'un
 * carré* — le rapport d'une carte se projette et ne se devine pas à l'oeil — et
 * une forme qui penche ne se juge pas au milieu de l'écran mais contre le bord
 * auquel elle est collée.
 *
 * **L'IMAGE EST AGRANDIE POUR COMPENSER SES MARGES**, et le facteur se
 * remesure à chaque dessin : `Deck.png` laissait 30 % de vide, ces deux-ci n'en
 * laissent que 19 — garder l'agrandissement d'avant les aurait sortis 17 % trop
 * gros. *Une compensation est calée sur UN fichier, pas sur l'idée de fichier.*
 *
 * **Le chiffre est AU-DESSUS, et il est discret.** Il a été un gros nombre d'or
 * serti sur le dos dans le jeu 2D : il avait le poids d'une valeur de jeu alors
 * qu'on ne décide pas dessus. Keko : « plus discret, c'est pas une info
 * capitale ». Au-dessus et non sur le paquet, donc rien ne recouvre le dessin.
 */
import { urlDuTas } from '../ui/art.ts'

type Props = {
  nom: 'pioche' | 'defausse'
  compte: number
}

export function Tas3D({ nom, compte }: Props): React.JSX.Element {
  return (
    <div className={`tas-3d ${nom}`}>
      <span className="tas-compte">{compte}</span>
      {/* LA DÉFAUSSE EST RETOURNÉE PAR LE CSS. Les deux dessins penchent du même
          côté, donc les coins bas de l'écran ne se répondraient pas sans ça —
          Keko l'a demandé en les fournissant. Ce n'est plus « un seul dessin,
          deux poses » mais deux dessins dont un se retourne : le symbole
          appartient au tas, l'inclinaison appartient au coin. */}
      <img className="tas-dessin" src={urlDuTas(nom)} alt="" aria-hidden="true" />
    </div>
  )
}

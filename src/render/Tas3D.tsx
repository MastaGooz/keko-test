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
 * **C'EST MAINTENANT LE DESSIN DE KEKO** (`public/Deck.png`), qui remplace le
 * losange qu'on projetait à la main. Ce qu'il a coûté reste dans `git log`, et
 * sa leçon vaut d'être retenue : *un losange symétrique ne peut pas être autre
 * chose qu'un carré*, le rapport d'une carte se projette et ne se devine pas à
 * l'oeil — et une forme qui penche ne se juge pas au milieu de l'écran mais
 * contre le bord auquel elle est collée.
 *
 * **L'IMAGE EST AGRANDIE POUR COMPENSER SES MARGES.** Le viewBox du SVG collait
 * au dessin ; un PNG, lui, porte ses bords transparents — ici 14 à 17 % de
 * chaque côté. Sans la compensation, le paquet paraîtrait un tiers plus petit
 * que celui qu'il remplace, à place égale dans le coin.
 *
 * **Le chiffre est AU-DESSUS, et il est discret.** Il a été un gros nombre d'or
 * serti sur le dos dans le jeu 2D : il avait le poids d'une valeur de jeu alors
 * qu'on ne décide pas dessus. Keko : « plus discret, c'est pas une info
 * capitale ». Au-dessus et non sur le paquet, donc rien ne recouvre le dessin.
 */
import { urlDuDeck } from '../ui/art.ts'

type Props = {
  nom: 'pioche' | 'defausse'
  compte: number
}

export function Tas3D({ nom, compte }: Props): React.JSX.Element {
  return (
    <div className={`tas-3d ${nom}`}>
      <span className="tas-compte">{compte}</span>
      {/* LA PIOCHE EST LE MIROIR DE LA DÉFAUSSE, et le miroir reste porté par le
          CSS : *un seul dessin, deux poses* — sinon les deux divergeraient au
          premier retouchage. Le paquet penche, donc deux tas identiques
          penchaient du même côté et les coins bas de l'écran ne se répondaient
          pas. Demandé par Keko. */}
      <img className="tas-dessin" src={urlDuDeck()} alt="" aria-hidden="true" />
    </div>
  )
}

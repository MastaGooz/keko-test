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
 * **LE CADRAGE SE CALCULE, IL NE SE RÈGLE PLUS.** Un PNG porte ses bords
 * transparents là où le viewBox d'un SVG collait au dessin, donc le paquet
 * paraît plus petit que sa place et il faut l'agrandir d'autant. Ce facteur a
 * été écrit à la main deux fois, et **il a été faux les deux fois dès l'image
 * suivante** : `Deck.png` laissait 30 % de vide, ses remplaçants 19, leur mise
 * à jour 22 en largeur mais 33 en hauteur. *Une compensation calée à la main
 * sur un fichier est fausse dès que le fichier change* — et rien ne le signale,
 * puisque l'image s'affiche quand même.
 *
 * On mesure donc le dessin dans son cadre et on en déduit l'agrandissement et
 * les quatre marges. Keko peut redessiner ces symboles comme il veut, y compris
 * en changeant leurs proportions : ils occuperont toujours la même place.
 *
 * **Le chiffre est AU-DESSUS, et il est discret.** Il a été un gros nombre d'or
 * serti sur le dos dans le jeu 2D : il avait le poids d'une valeur de jeu alors
 * qu'on ne décide pas dessus. Keko : « plus discret, c'est pas une info
 * capitale ». Au-dessus et non sur le paquet, donc rien ne recouvre le dessin.
 */
import { useState } from 'react'
import { urlDuTas } from '../ui/art.ts'
import { boiteDe, mesurerBoite } from './silhouette.ts'

/** La part de la colonne que le paquet doit occuper, vide exclu. */
const CIBLE = 0.97

type Props = {
  nom: 'pioche' | 'defausse'
  compte: number
}

export function Tas3D({ nom, compte }: Props): React.JSX.Element {
  const [, mesure] = useState(0)
  const cle = `tas-${nom}`
  const boite = boiteDe(cle)
  const largeurDuSujet = Math.max(0.1, 1 - boite.gauche - boite.droite)
  const facteur = CIBLE / largeurDuSujet

  return (
    <div className={`tas-3d ${nom}`}>
      <span className="tas-compte">{compte}</span>
      {/* LA DÉFAUSSE EST RETOURNÉE PAR LE CSS. Les deux dessins penchent du même
          côté, donc les coins bas de l'écran ne se répondraient pas sans ça —
          Keko l'a demandé en les fournissant. Ce n'est plus « un seul dessin,
          deux poses » mais deux dessins dont un se retourne : le symbole
          appartient au tas, l'inclinaison appartient au coin. */}
      <img
        className="tas-dessin"
        src={urlDuTas(nom)}
        alt=""
        aria-hidden="true"
        onLoad={(e) => {
          // La mesure ne prévient qu'à la PREMIÈRE fois, `silhouette.ts` s'en
          // porte garant : un signal qui repartirait à chaque rendu serait la
          // boucle infinie déjà rencontrée sur les textures de cartes.
          if (mesurerBoite(cle, e.currentTarget)) mesure((n) => n + 1)
        }}
        style={{
          width: `${facteur * 100}%`,
          // LES `%` D'UNE MARGE SE RAPPORTENT À LA LARGEUR du bloc conteneur,
          // jamais à sa hauteur — le piège déjà payé sur la tête de mort. La
          // largeur de l'image vaut `facteur × 100 %` de ce conteneur, donc une
          // marge dans la même unité retranche bien une fraction de l'image ;
          // en hauteur il faut passer par son rapport, qu'on ne suppose pas
          // carré.
          marginTop: `${(-boite.haut * facteur * 100) / boite.rapport}%`,
          marginBottom: `${(-boite.bas * facteur * 100) / boite.rapport}%`,
          marginLeft: `${-boite.gauche * facteur * 100}%`,
          marginRight: `${-boite.droite * facteur * 100}%`,
        }}
      />
    </div>
  )
}

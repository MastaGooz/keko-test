/**
 * L'ORBE D'ÉNERGIE DU JOUEUR — le MÊME objet que le symbole de coût des cartes.
 *
 * C'est la règle de Keko, et elle était enfreinte : le symbole des cartes était
 * un blason rouge, l'énergie du joueur une pastille d'or. « On dirait un
 * bouclier, ça ne renvoie pas trop à l'énergie, et la couleur rouge est un peu
 * bizarre » — *deux objets qui doivent être le même n'ont jamais eu ni la même
 * forme ni la même couleur.* Ils l'ont maintenant : socle sombre, filet de
 * laiton, coeur d'ambre, chiffre en ivoire.
 *
 * **Il porte `X/X`**, l'énergie courante sur le maximum. Dans le jeu 2D le
 * maximum vivait À CÔTÉ de l'écusson parce qu'il ne logeait pas sous sa pointe ;
 * un disque, lui, a de la place au centre. Le courant est gros, le maximum
 * petit : *on décide sur ce qu'il reste, pas sur ce qu'on avait.*
 *
 * **Il vit au-dessus de la pioche**, dans la bande gauche avec tout ce qui est
 * au joueur. Le jeu 2D avait dû le pousser À DROITE du tas, parce que le tas y
 * était une carte à la taille de la main et qu'« au-dessus » envoyait l'orbe en
 * haut de l'écran ; ici le tas est un petit symbole, et l'objection tombe.
 *
 * Le chiffre est du HTML et non une texture : il reste net à toute taille, et
 * il n'a rien à gagner à passer par un canvas.
 */

import { urlDuCout } from '../ui/art.ts'

type Props = {
  courant: number
  max: number
}

export function Orbe3D({ courant, max }: Props): React.JSX.Element {
  return (
    <div className="orbe-jeu">
      {/* LE SYMBOLE EST L'IMAGE DE KEKO, la même que sur les cartes. Le cercle
          dessiné qu'elle remplace vit dans `git log` ; ce qui compte est que
          les deux endroits partagent UN fichier, donc qu'ils ne puissent plus
          diverger. */}
      <img src={urlDuCout()} alt="" aria-hidden="true" />
      <span className="orbe-chiffre">
        {courant}
        <small>/{max}</small>
      </span>
    </div>
  )
}

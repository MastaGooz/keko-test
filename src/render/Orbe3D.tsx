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
 * Il est en SVG et non peint au canvas comme celui des cartes : un chiffre
 * d'interface reste net à toute taille, et il n'a rien à gagner à passer par
 * une texture.
 */

/** Les mêmes teintes que `peindreCout`, dans le même ordre. */
const SOCLE = '#12100c'

type Props = {
  courant: number
  max: number
}

export function Orbe3D({ courant, max }: Props): React.JSX.Element {
  return (
    <div className="orbe-jeu">
      <svg viewBox="0 0 100 100" aria-hidden="true">
        <defs>
          <linearGradient id="orbe-filet" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#f4dfb0" />
            <stop offset="0.7" stopColor="#c9a86e" />
            <stop offset="1" stopColor="#a88c5f" />
          </linearGradient>
          <linearGradient id="orbe-coeur" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#8a6a2c" />
            <stop offset="0.62" stopColor="#4a3713" />
            <stop offset="1" stopColor="#241a08" />
          </linearGradient>
          <radialGradient id="orbe-lueur" cx="0.35" cy="0.3" r="0.72">
            <stop offset="0" stopColor="#ffd98a" stopOpacity="0.4" />
            <stop offset="1" stopColor="#ffd98a" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="50" cy="50" r="49" fill={SOCLE} />
        <circle cx="50" cy="50" r="46" fill="url(#orbe-filet)" />
        <circle cx="50" cy="50" r="40" fill="url(#orbe-coeur)" />
        <circle cx="50" cy="50" r="40" fill="url(#orbe-lueur)" />
      </svg>
      <span className="orbe-chiffre">
        {courant}
        <small>/{max}</small>
      </span>
    </div>
  )
}

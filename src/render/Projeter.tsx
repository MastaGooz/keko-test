/**
 * ANCRER DU HTML SUR UN POINT DE LA SCÈNE.
 *
 * Les étiquettes des créatures — intention, jauge, nom — sont du HTML posé
 * par-dessus le canvas, et ce composant les fait suivre leur corps : il
 * projette chaque point 3D en coordonnées d'écran, à chaque image.
 *
 * **Pourquoi pas le `<Html>` de drei**, qui fait exactement ça : chaque
 * instance monte **sa propre racine React**, et avec React 19 deux instances
 * dans la même scène se démontaient l'une l'autre — « Attempted to
 * synchronously unmount a root while React was already rendering », et
 * l'étiquette disparaissait sans autre symptôme. Trente lignes sous contrôle
 * valent mieux qu'une dépendance qui se démonte toute seule.
 *
 * **Il écrit directement dans le DOM**, sans passer par l'état React : une
 * position qui change à chaque image déclencherait un rendu par image, pour un
 * résultat identique. C'est la même raison qui met le geste de la main dans
 * une `ref`.
 */
import { useFrame, useThree } from '@react-three/fiber'
import { useMemo } from 'react'
import * as THREE from 'three'

type Props = {
  /** Un point de la scène par étiquette, dans le même ordre que les éléments. */
  points: readonly [number, number, number][]
  /** Les éléments à déplacer. Un `null` est simplement sauté. */
  cibles: readonly (HTMLElement | null)[]
}

export function Projeter({ points, cibles }: Props): null {
  const { camera, size } = useThree()
  // Un seul vecteur réutilisé : on est appelé à chaque image, et en allouer un
  // par point donnerait du travail au ramasse-miettes pour rien.
  const v = useMemo(() => new THREE.Vector3(), [])

  useFrame(() => {
    points.forEach((p, i) => {
      const el = cibles[i]
      if (el === null || el === undefined) return
      v.set(p[0], p[1], p[2]).project(camera)
      const x = (v.x * 0.5 + 0.5) * size.width
      const y = (-v.y * 0.5 + 0.5) * size.height
      // `translate(-50%, -50%)` d'abord : l'étiquette se centre sur le point,
      // et le décalage en pixels s'applique ensuite.
      el.style.transform = `translate(-50%, -50%) translate(${x}px, ${y}px)`
      // Derrière la caméra, `z` sort de [-1, 1] : on cache plutôt que de
      // laisser l'étiquette réapparaître à l'envers de l'écran.
      el.style.visibility = v.z > 1 ? 'hidden' : 'visible'
    })
  })

  return null
}

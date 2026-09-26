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
import { useMemo, useRef } from 'react'
import * as THREE from 'three'

type Props = {
  /** Un point de la scène par étiquette, dans le même ordre que les éléments. */
  points: readonly [number, number, number][]
  /**
   * Les éléments à déplacer, RELUS À CHAQUE IMAGE. Un `null` est sauté.
   *
   * Une fonction et non un tableau : les éléments viennent de `ref`s, qui ne
   * sont remplies qu'APRÈS le rendu. Un tableau figé au rendu contenait donc
   * des `null` tant qu'un autre rendu ne venait pas — ce qui arrive tout le
   * temps en combat, et jamais sur un écran qui ne bouge pas.
   */
  cibles: () => readonly (HTMLElement | null)[]
}

export function Projeter({ points, cibles }: Props): null {
  const { camera, size } = useThree()
  // Un seul vecteur réutilisé : on est appelé à chaque image, et en allouer un
  // par point donnerait du travail au ramasse-miettes pour rien.
  const v = useMemo(() => new THREE.Vector3(), [])

  useFrame(() => {
    const els = cibles()
    points.forEach((p, i) => {
      const el = els[i]
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

/**
 * L'ÉCART ENTRE DEUX CORPS DU RANG, publié en pixels pour le CSS.
 *
 * Les jauges des créatures avaient une largeur fixe : à trois corps sur un
 * téléphone elles se touchaient — Keko : « les barres de vie ennemies sont trop
 * larges sur téléphone et sont collées les unes aux autres, il faudrait les
 * réduire quand elles sont trop proches ». *Une largeur écrite à la main ne
 * peut pas savoir combien de voisins elle aura* : entre un corps et trois, la
 * place disponible est divisée par trois.
 *
 * On mesure donc l'écart RÉEL à l'écran, pas le nombre d'ennemis : il dépend
 * aussi du recul de la caméra et du format. Et c'est le PLUS PETIT écart du
 * rang qui commande, ce qui prépare le jour où les corps n'auront plus tous la
 * même largeur — un boss et ses adds.
 *
 * Un seul corps : pas d'écart, donc pas de contrainte. On publie une valeur
 * assez grande pour que le plafond en rem l'emporte.
 *
 * Même motif que `ReperesDeLaMain` : ça ne dépend que de la géométrie, donc ça
 * écrit directement dans le DOM sans passer par l'état — sinon ce serait un
 * rendu React par image pour un résultat identique.
 */
export function ReperesDuRang({ rang }: { rang: readonly [number, number, number][] }): null {
  const { camera, size } = useThree()
  const v = useMemo(() => new THREE.Vector3(), [])
  const dernier = useRef(-1)

  useFrame(() => {
    let pas = 9999
    if (rang.length >= 2) {
      const xs = rang.map((p) => {
        v.set(p[0], p[1], p[2]).project(camera)
        return (v.x * 0.5 + 0.5) * size.width
      })
      for (let i = 1; i < xs.length; i++) pas = Math.min(pas, Math.abs(xs[i]! - xs[i - 1]!))
    }
    const arrondi = Math.round(pas)
    // On n'écrit que si ça change : poser une propriété CSS invalide le style
    // de tout le sous-arbre, et ici rien ne bouge la plupart du temps.
    if (arrondi !== dernier.current) {
      dernier.current = arrondi
      document.documentElement.style.setProperty('--pas-rang', `${arrondi}px`)
    }
  })

  return null
}

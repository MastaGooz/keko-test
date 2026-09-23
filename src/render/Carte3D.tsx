/**
 * UNE CARTE, EN VOLUME.
 *
 * Un pavé très plat plutôt qu'un plan : une carte a une tranche, et c'est elle
 * qui fait qu'on la voit comme un objet posé et non comme une image collée.
 * La tranche capte la lumière quand la carte s'incline — c'est gratuit, et
 * c'est ce qui manque le plus à une carte en CSS.
 *
 * La face porte la texture peinte par `texture-carte.ts`, le dos et la tranche
 * portent le laiton du gabarit.
 *
 * **Les matériaux sont construits en JavaScript et passés en tableau**, et ce
 * n'est pas un détail de style : `<primitive>` ne monte un objet QU'UNE FOIS.
 * Les cinq faces de laiton déclarées comme cinq `<primitive>` du même matériau
 * se démontaient l'une l'autre, le tableau de matériaux du pavé finissait
 * troué, et **la scène restait noire sans une seule erreur en console**.
 *
 * **La carte ne décide pas d'où elle est.** Sa place, son inclinaison et sa
 * taille lui sont données ; elle les rejoint en s'amortissant. C'est ce qui
 * permet à la main de recalculer tout l'éventail à chaque geste sans que rien
 * ne saute — la même règle qu'en 2D, où le rendu se reconstruit entièrement.
 */
import { useEffect, useMemo, useRef } from 'react'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import type { CarteAPeindre } from './texture-carte.ts'
import { textureDeCarte } from './texture-carte.ts'

/** La carte fait 1 de large ; le reste en découle, comme dans le gabarit. */
export const LARGE = 1
export const HAUT = 1.4
const EPAISSEUR = 0.012

type Props = {
  carte: CarteAPeindre
  position: [number, number, number]
  /** Inclinaison voulue, en radians. */
  rotation?: [number, number, number]
  taille?: number
  /** Vitesse de rattrapage. Plus haut = plus sec. */
  ressort?: number
  onPeinte?: () => void
  onPointerDown?: (e: ThreeEvent<PointerEvent>) => void
  onPointerOver?: (e: ThreeEvent<PointerEvent>) => void
  onPointerOut?: (e: ThreeEvent<PointerEvent>) => void
}

export function Carte3D({
  carte,
  position,
  rotation = [0, 0, 0],
  taille = 1,
  ressort = 9,
  onPeinte,
  onPointerDown,
  onPointerOver,
  onPointerOut,
}: Props): React.JSX.Element {
  const groupe = useRef<THREE.Group>(null)

  const { face, materiaux } = useMemo(() => {
    const laiton = new THREE.MeshStandardMaterial({
      color: '#b79a6a',
      metalness: 0.85,
      roughness: 0.38,
    })
    // Tant que la texture n'est pas peinte, la face est sombre et mate : une
    // carte blanche qui vire à l'illustration se verrait comme un défaut.
    const face = new THREE.MeshStandardMaterial({
      color: '#1a1b20',
      roughness: 0.55,
      metalness: 0.15,
    })
    // L'ordre des faces d'un pavé dans three : droite, gauche, haut, bas,
    // AVANT, arrière. Seule l'avant porte la carte.
    return { face, materiaux: [laiton, laiton, laiton, laiton, face, laiton] }
  }, [])

  useEffect(() => {
    let vivant = true
    // LA TEXTURE VIENT D'UN CACHE PARTAGÉ : deux cartes du même modèle se la
    // prêtent, et une carte remontée la retrouve déjà prête — donc elle ne
    // repasse jamais par son état sombre. Rien n'est libéré ici pour la même
    // raison : elle ne nous appartient pas.
    void textureDeCarte(carte).then((texture) => {
      if (!vivant) return
      face.map = texture
      face.color.set('#ffffff')
      face.needsUpdate = true
      onPeinte?.()
    })
    return () => {
      vivant = false
    }
    // `onPeinte` volontairement hors des dépendances : une fonction recréée à
    // chaque rendu du parent repeindrait la carte en boucle.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [carte, face])

  // ELLE REJOINT SA PLACE, elle n'y saute pas. L'amortissement exponentiel est
  // indépendant de la fréquence d'écran : à 120 Hz comme à 60, le mouvement
  // dure le même temps.
  useFrame((_, delta) => {
    const g = groupe.current
    if (g === null) return
    const k = 1 - Math.exp(-ressort * delta)
    g.position.x += (position[0] - g.position.x) * k
    g.position.y += (position[1] - g.position.y) * k
    g.position.z += (position[2] - g.position.z) * k
    g.rotation.x += (rotation[0] - g.rotation.x) * k
    g.rotation.y += (rotation[1] - g.rotation.y) * k
    g.rotation.z += (rotation[2] - g.rotation.z) * k
    const s = g.scale.x + (taille - g.scale.x) * k
    g.scale.setScalar(s)
  })

  return (
    <group ref={groupe} position={position}>
      {/* ELLE PROJETTE UNE OMBRE, ELLE N'EN REÇOIT PAS. Une carte qui reçoit
          des ombres reçoit aussi la SIENNE : à faible précision de carte
          d'ombre — ce qui est le cas sur un téléphone — ça se voit comme des
          taches sombres sur sa propre face, d'autant plus qu'elle est proche
          de la caméra. Le sol reçoit les ombres, c'est tout ce qu'il faut. */}
      <mesh
        castShadow
        material={materiaux}
        onPointerDown={onPointerDown}
        onPointerOver={onPointerOver}
        onPointerOut={onPointerOut}
      >
        <boxGeometry args={[LARGE, HAUT, EPAISSEUR]} />
      </mesh>
    </group>
  )
}

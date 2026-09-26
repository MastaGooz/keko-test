/**
 * LA CARTE DÉFAUSSÉE S'EMBRASE, PUIS PART EN LUMIÈRE.
 *
 * Keko : « il faudrait que quand les cartes sont défaussées on ait l'effet
 * inverse — lumière puis transfert vers la défausse ».
 *
 * *C'est la naissance jouée à l'envers*, et il le fallait : la pioche fait
 * arriver une traînée qui devient une carte, la défausse doit faire d'une carte
 * une traînée qui s'en va. Sans ce temps d'embrasement, la carte disparaissait
 * de la main à l'instant où la traînée partait du coin — **on ne voyait pas
 * qu'elle était devenue la traînée**, seulement deux choses sans rapport.
 *
 * **Elle reste à sa place, avec l'inclinaison de l'éventail.** Une carte qui
 * s'en va n'a aucune raison de se redresser d'abord : c'est la même erreur que
 * la version où la carte voyageait entière et arrivait droite.
 *
 * **L'ÉCLAT PASSE PAR LA COULEUR, pas par un plan blanc posé dessus.** En
 * `toneMapped: false`, une couleur au-delà de 1 éclaircit la texture au lieu de
 * la recouvrir : l'image reste lisible pendant qu'elle blanchit, là où un voile
 * l'aurait effacée d'un coup.
 */
import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { CarteAPeindre } from './texture-carte.ts'
import { textureDeCarte } from './texture-carte.ts'
import { HAUT, LARGE } from './Carte3D.tsx'

/** Ce que dure l'embrasement avant que la traînée ne parte, en secondes. */
export const DUREE_DISSOLUTION = 0.22

/** Ce qui sépare deux cartes de la même main : elles brûlent l'une après l'autre. */
export const PAS_DISSOLUTION = 0.05

/**
 * CE QUI BRÛLE PASSE DEVANT SA PLACE.
 *
 * L'éventail d'avant et celui d'après ont exactement les mêmes places : la
 * carte piochée naissait donc AU MÊME POINT que celle qui partait, et le test
 * de profondeur tranchait en faveur de la nouvelle — *on ne voyait rien brûler
 * du tout.* Un cheveu d'avance suffit, et il se justifie tout seul : ce qui
 * s'en va quitte le plan de la main.
 */
const AVANCE = 0.06

type Props = {
  carte: CarteAPeindre
  place: [number, number, number]
  rotation: [number, number, number]
  /** L'instant du départ, en secondes d'horloge de la scène. */
  debut: number
}

export function CarteQuiSeDissout({ carte, place, rotation, debut }: Props): React.JSX.Element {
  const mesh = useRef<THREE.Mesh>(null)
  const materiau = useMemo(
    () => new THREE.MeshBasicMaterial({ transparent: true, toneMapped: false, depthWrite: false }),
    [],
  )

  useEffect(() => {
    let vivant = true
    void textureDeCarte(carte)
      .then((t) => {
        if (!vivant) return
        materiau.map = t
        materiau.needsUpdate = true
      })
      .catch(() => {})
    return () => {
      vivant = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [carte.nom, carte.cout, materiau])

  useFrame((etat) => {
    const m = mesh.current
    if (m === null) return
    const k = Math.max(0, Math.min(1, (etat.clock.elapsedTime - debut) / DUREE_DISSOLUTION))
    // Elle s'embrase d'abord, s'efface ensuite : les deux se recouvrent à peine,
    // pour qu'on voie bien la lumière AVANT de la voir partir.
    materiau.color.setScalar(1 + 2.4 * k * k)
    materiau.opacity = k < 0.62 ? 1 : 1 - (k - 0.62) / 0.38
    m.scale.setScalar(1 + 0.08 * k)
  })

  return (
    <mesh
      ref={mesh}
      position={[place[0], place[1], place[2] + AVANCE]}
      rotation={rotation}
      material={materiau}
      raycast={() => null}
    >
      <planeGeometry args={[LARGE, HAUT]} />
    </mesh>
  )
}

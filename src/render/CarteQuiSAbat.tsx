/**
 * LA CARTE JOUÉE S'ABAT SUR SA CIBLE.
 *
 * Elle quitte la main au lâcher — ça, c'est le geste — puis se remontre
 * au-dessus du corps visé et tombe dessus. *Le coup avait un départ et une
 * conséquence, il lui manquait un trajet* : on voyait la carte partir et
 * l'ennemi encaisser, sans que rien ne relie les deux. C'est la règle du jeu
 * 2D, portée telle quelle.
 *
 * Trois temps, et tout le poids vient du **contraste de vitesse**, comme le
 * bond des créatures : elle arrive haut et grande, **marque un temps
 * d'arrêt** — sans lui la chute se lit comme une simple apparition — puis
 * tombe d'un coup sec et s'écrase un peu avant de s'effacer. L'impact tombe
 * à 220 ms, et c'est là que se déclenchent le tressaillement et le chiffre :
 * *pas au moment de la tape.*
 *
 * Un plan plutôt que le pavé de `Carte3D` : il faut de la transparence pour
 * le fondu, et 450 ms ne laissent pas le temps de voir une tranche. La
 * texture est la même, prise dans le même cache — c'est ce qui garantit que
 * c'est LA carte qu'on vient de lâcher, pas une copie qui divergera.
 */
import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { CarteAPeindre } from './texture-carte.ts'
import { textureDeCarte } from './texture-carte.ts'
import { HAUT, LARGE } from './Carte3D.tsx'

/** Les temps du coup, en secondes. L'impact est à 0,22, comme en 2D. */
export const TEMPS_IMPACT = 0.22
export const TEMPS_FIN = 0.45

type Props = {
  carte: CarteAPeindre
  /** D'où elle part : là où le doigt l'a lâchée. */
  depuis: [number, number, number]
  /** Où elle tombe : le corps visé. */
  vers: [number, number, number]
  /** L'instant du lâcher, en secondes d'horloge de la scène. */
  debut: number
}

function lisser(t: number): number {
  return t * t * (3 - 2 * t)
}

export function CarteQuiSAbat({ carte, depuis, vers, debut }: Props): React.JSX.Element {
  const mesh = useRef<THREE.Mesh>(null)
  const materiau = useMemo(
    () => new THREE.MeshBasicMaterial({ transparent: true, toneMapped: false, depthWrite: false }),
    [],
  )

  useEffect(() => {
    let vivant = true
    void textureDeCarte(carte).then((texture) => {
      if (!vivant) return
      materiau.map = texture
      materiau.needsUpdate = true
    })
    return () => {
      vivant = false
    }
  }, [carte, materiau])

  useFrame((etat) => {
    const m = mesh.current
    if (m === null) return
    const t = etat.clock.elapsedTime - debut

    // LE SOMMET : au-dessus de la cible, un peu devant elle, grande.
    const sommet = new THREE.Vector3(vers[0], vers[1] + 0.95, vers[2] + 0.6)
    const impact = new THREE.Vector3(vers[0], vers[1] + 0.05, vers[2] + 0.35)

    if (t < 0.14) {
      // 1. Elle arrive : du doigt au sommet, en décélérant.
      const k = lisser(t / 0.14)
      m.position.lerpVectors(new THREE.Vector3(...depuis), sommet, k)
      m.scale.setScalar(1.05 + 0.15 * k)
      materiau.opacity = 1
    } else if (t < 0.2) {
      // 2. LE TEMPS D'ARRÊT. Rien ne bouge : c'est lui qui fait lire la chute
      //    comme une chute et non comme une apparition.
      m.position.copy(sommet)
      m.scale.setScalar(1.2)
    } else if (t < TEMPS_IMPACT) {
      // 3. La chute, d'un coup sec : 20 ms, six fois plus vite que la montée.
      const k = (t - 0.2) / (TEMPS_IMPACT - 0.2)
      m.position.lerpVectors(sommet, impact, k * k)
      m.scale.setScalar(1.2 - 0.25 * k)
    } else if (t < 0.3) {
      // 4. L'écrasement : elle s'aplatit un peu, puis reprend.
      const k = (t - TEMPS_IMPACT) / 0.08
      m.position.copy(impact)
      m.scale.set(0.95 + 0.12 * Math.sin(k * Math.PI), 0.95 - 0.08 * Math.sin(k * Math.PI), 1)
    } else {
      // 5. Le fondu.
      const k = Math.min(1, (t - 0.3) / (TEMPS_FIN - 0.3))
      m.position.copy(impact)
      m.scale.setScalar(0.95 - 0.1 * k)
      materiau.opacity = 1 - k
    }
  })

  return (
    <mesh ref={mesh} position={depuis} material={materiau} raycast={() => null}>
      <planeGeometry args={[LARGE, HAUT]} />
    </mesh>
  )
}

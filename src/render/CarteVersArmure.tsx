/**
 * LA CARTE D'ARMURE VA SE POSER SUR LE BOUCLIER.
 *
 * Keko : « quand on joue une carte d'armure, il faudrait une animation où la
 * carte va vers l'emplacement où est affiché l'armure ». *C'était le dernier
 * trou de la séquence* : une carte qui vise a sa chute sur le corps, une carte
 * défaussée a sa comète, et une garde ne faisait rien du tout — elle
 * disparaissait au lâcher et un chiffre bleu changeait dans un coin, sans que
 * rien ne relie les deux.
 *
 * **ELLE NE S'ABAT PAS, ELLE SE REPLIE.** La carte qui frappe arrive haut,
 * marque un temps d'arrêt et tombe d'un coup sec : c'est le vocabulaire d'un
 * coup porté. Une garde fait l'inverse — elle *rentre*. Elle se ramasse vers
 * le bouclier en accélérant, et c'est **le bouclier** qui encaisse à l'arrivée.
 * *Deux gestes opposés ne peuvent pas partager la même courbe.*
 *
 * **ELLE PASSE EN ACIER EN CHEMIN.** La carte part avec son dessin et arrive en
 * bleu : c'est ce qui dit qu'elle devient l'armure plutôt qu'elle ne va se
 * ranger à côté. Même mécanique que la carte défaussée qui vire à la crème de
 * la tête de comète — *une transformation se raconte par la couleur de ce qui
 * arrive, pas par une substitution à la fin.*
 *
 * **Le bouclier est du HTML, la carte vit dans le canvas** : sa place se lit
 * dans le DOM et se reprojette avec `depuisEcran`, comme les tas. Elle suit
 * donc le recul de la caméra sans qu'on s'en occupe.
 */
import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { CarteAPeindre } from './texture-carte.ts'
import { textureDeCarte } from './texture-carte.ts'
import { HAUT, LARGE } from './Carte3D.tsx'
import { borne, lisser } from './sillage.ts'

/** Quand la carte touche le bouclier : c'est là que l'armure apparaît. */
export const TEMPS_ARMURE = 0.3

/** Quand il n'en reste rien. */
export const FIN_ARMURE = 0.42

type Props = {
  carte: CarteAPeindre
  /** D'où elle part : là où le doigt l'a lâchée. */
  depuis: [number, number, number]
  /** Le bouclier, projeté depuis le DOM. */
  vers: [number, number, number]
  /** L'instant du lâcher, en secondes d'horloge de la scène. */
  debut: number
}

const ACIER = new THREE.Color('#7fb2ee')

export function CarteVersArmure({ carte, depuis, vers, debut }: Props): React.JSX.Element {
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
  }, [carte, materiau])

  const travail = useMemo(
    () => ({ a: new THREE.Vector3(), b: new THREE.Vector3(), blanc: new THREE.Color('#ffffff') }),
    [],
  )

  useFrame((etat) => {
    const m = mesh.current
    if (m === null) return
    const t = etat.clock.elapsedTime - debut
    travail.a.set(...depuis)
    travail.b.set(...vers)

    if (t < TEMPS_ARMURE) {
      const k = t / TEMPS_ARMURE
      // ELLE SE RAMASSE EN ACCÉLÉRANT : lente au départ, avalée à la fin.
      // L'inverse de la chute d'une attaque, qui part vite et s'arrête net.
      const avance = k * k
      m.position.lerpVectors(travail.a, travail.b, avance)
      // Un petit crochet vers le haut en partant : sans lui, une ligne droite
      // vers un coin de l'écran se lit comme un glissement de menu.
      m.position.y += Math.sin(k * Math.PI) * 0.35
      m.position.z = travail.a.z + 0.2 * (1 - k)
      // Elle rétrécit jusqu'à la taille du bouclier : elle y RENTRE.
      m.scale.setScalar(1 - 0.86 * lisser(k))
      m.rotation.z = -0.5 * avance
      materiau.color.copy(travail.blanc).lerp(ACIER, lisser(borne((k - 0.25) / 0.75)))
      materiau.opacity = 1
    } else {
      // Le bouclier a encaissé : il ne reste qu'un éclat qui s'efface.
      const k = borne((t - TEMPS_ARMURE) / (FIN_ARMURE - TEMPS_ARMURE))
      m.position.copy(travail.b)
      m.scale.setScalar(0.14 + 0.16 * k)
      materiau.color.copy(ACIER).multiplyScalar(1 + 1.6 * k)
      materiau.opacity = 1 - k
    }
  })

  return (
    <mesh ref={mesh} position={depuis} material={materiau} raycast={() => null}>
      <planeGeometry args={[LARGE, HAUT]} />
    </mesh>
  )
}

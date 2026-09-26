/**
 * LA CARTE QUI SOIGNE SE VERSE DANS LA BARRE DE VIE.
 *
 * Keko : « maintenant la potion il faudrait une animation aussi — et d'ailleurs
 * toutes les cartes qui soignent — où la carte va sur la barre d'HP avec une
 * anim de soin ». *La règle est posée sur l'EFFET, pas sur la potion* : toute
 * carte qui rend des PV y a droit, y compris un trésor brûlé.
 *
 * **TROIS GESTES, TROIS COURBES, ET ELLES NE SE RESSEMBLENT PAS.** C'est le
 * point de toute cette famille d'animations :
 *
 * - la carte qui **frappe** arrive haut, marque un temps d'arrêt et tombe d'un
 *   coup sec — un coup porté ;
 * - la carte de **garde** se ramasse sur le bouclier en accélérant — elle
 *   rentre ;
 * - la carte qui **soigne** monte au-dessus de la barre, **bascule comme une
 *   fiole qu'on penche**, marque son temps, puis se déverse dedans.
 *
 * *Un même trajet rejoué avec une autre couleur ne raconterait rien* : ce qui
 * distingue un soin d'une garde, c'est le geste, pas la teinte.
 *
 * **LE TEMPS D'ARRÊT EN HAUT EST CE QUI FAIT LE VERSEMENT.** Sans lui, la carte
 * plonge vers la barre et on lit une carte qui tombe, pas une fiole qu'on vide
 * — exactement la raison pour laquelle la carte qui s'abat marque le sien.
 *
 * **Elle vire au VERT en basculant**, la couleur des potions dans ce jeu, et
 * c'est ce qui dit qu'elle devient le soin plutôt qu'elle n'irait se ranger à
 * côté. Même mécanique que la garde qui passe en acier.
 *
 * **La barre est du HTML, la carte vit dans le canvas** : sa place se lit dans
 * le DOM et se reprojette avec `depuisEcran`, comme les tas et le bouclier.
 */
import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { CarteAPeindre } from './texture-carte.ts'
import { textureDeCarte } from './texture-carte.ts'
import { HAUT, LARGE } from './Carte3D.tsx'
import { borne, lisser } from './sillage.ts'

/** Quand le flot atteint la barre : c'est là que les PV montent. */
export const TEMPS_SOIN = 0.46

/** Quand il n'en reste rien. */
export const FIN_SOIN = 0.6

/** La part du trajet passée à monter, avant le temps d'arrêt. */
const MONTEE = 0.55
/** La part passée en suspens, penchée au-dessus de la barre. */
const SUSPENS = 0.74

type Props = {
  carte: CarteAPeindre
  /** D'où elle part : là où le doigt l'a lâchée. */
  depuis: [number, number, number]
  /** La barre de vie, projetée depuis le DOM. */
  vers: [number, number, number]
  /** L'instant du lâcher, en secondes d'horloge de la scène. */
  debut: number
}

const SEVE = new THREE.Color('#7ae6a4')

/** L'inclinaison d'une fiole qu'on vide. */
const VERSE = -1.15

export function CarteVersSoin({ carte, depuis, vers, debut }: Props): React.JSX.Element {
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
    () => ({
      a: new THREE.Vector3(),
      haut: new THREE.Vector3(),
      cible: new THREE.Vector3(),
      blanc: new THREE.Color('#ffffff'),
    }),
    [],
  )

  useFrame((etat) => {
    const m = mesh.current
    if (m === null) return
    const t = etat.clock.elapsedTime - debut
    travail.a.set(...depuis)
    travail.cible.set(...vers)
    // LE POINT DE VERSEMENT : au-dessus de la barre, pas dessus. C'est de là
    // que le contenu tombe — une fiole se vide de haut.
    travail.haut.set(vers[0], vers[1] + 0.62, vers[2] + 0.2)

    const k = borne(t / TEMPS_SOIN)

    if (k < MONTEE) {
      // 1. Elle monte au-dessus de la barre, en décélérant, et se penche déjà.
      const a = lisser(k / MONTEE)
      m.position.lerpVectors(travail.a, travail.haut, a)
      m.scale.setScalar(1 - 0.55 * a)
      m.rotation.z = VERSE * a * 0.8
      materiau.color.copy(travail.blanc).lerp(SEVE, a * 0.55)
      materiau.opacity = 1
    } else if (k < SUSPENS) {
      // 2. LE TEMPS D'ARRÊT, penchée. C'est lui qui fait lire un versement
      //    plutôt qu'une carte qui tombe.
      const a = (k - MONTEE) / (SUSPENS - MONTEE)
      m.position.copy(travail.haut)
      m.scale.setScalar(0.45)
      m.rotation.z = VERSE * (0.8 + 0.2 * lisser(a))
      materiau.color.copy(travail.blanc).lerp(SEVE, 0.55 + 0.35 * a)
    } else {
      // 3. Le versement : elle se vide dans la barre et s'y résorbe.
      const a = (k - SUSPENS) / (1 - SUSPENS)
      m.position.lerpVectors(travail.haut, travail.cible, a * a)
      m.scale.set(0.45 - 0.33 * a, 0.45 - 0.4 * a, 1)
      m.rotation.z = VERSE
      materiau.color.copy(SEVE)
    }

    if (t > TEMPS_SOIN) {
      // La barre a encaissé : il ne reste qu'un éclat vert qui s'efface.
      const a = borne((t - TEMPS_SOIN) / (FIN_SOIN - TEMPS_SOIN))
      m.position.copy(travail.cible)
      m.scale.set(0.12 + 0.3 * a, 0.05 + 0.1 * a, 1)
      materiau.color.copy(SEVE).multiplyScalar(1 + 1.8 * a)
      materiau.opacity = 1 - a
    }
  })

  return (
    <mesh ref={mesh} position={depuis} material={materiau} raycast={() => null}>
      <planeGeometry args={[LARGE, HAUT]} />
    </mesh>
  )
}

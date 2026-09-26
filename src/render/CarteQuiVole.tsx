/**
 * UNE CARTE QUI VA DU PAQUET À LA MAIN, OU L'INVERSE.
 *
 * Keko : « ce qui serait super cool c'est d'avoir un effet de pioche /
 * défausse où on prend / place les cartes dans les paquets correspondants ; la
 * carte serait prise sur le dessus, et flip back-face avant d'arriver dans la
 * main, avec un changement progressif d'échelle ».
 *
 * *Jusqu'ici la main se remplissait d'un coup* : cinq cartes apparaissaient là
 * où il n'y avait rien, et les tas des coins ne servaient qu'à compter. Le
 * trajet leur donne un rôle — **on voit d'où viennent les cartes**, exactement
 * comme le coup a gagné son trajet quand la carte s'est mise à s'abattre sur sa
 * cible.
 *
 * **LE RETOURNEMENT DIT LE SENS**, et c'est lui qui distingue les deux gestes :
 * on pioche dos en avant et la carte se révèle en chemin ; on défausse face en
 * avant et elle se referme. *Le même trajet joué à l'envers ne suffirait pas* —
 * sans le retournement, une carte qui part vers la défausse ressemblerait à une
 * carte qu'on repose.
 *
 * **DEUX PLANS DOS À DOS, pas un plan à double face.** Un matériau `DoubleSide`
 * afficherait la même image des deux côtés : il faut deux images, donc deux
 * plans, dont l'un est tourné d'un demi-tour dans le groupe. Quand le groupe
 * pivote, l'un s'efface et l'autre arrive — et le passage se fait tout seul au
 * profil, là où les deux sont invisibles.
 *
 * **L'ÉCHELLE FAIT LE RESTE DU CHEMIN.** Un paquet des coins est deux à trois
 * fois plus petit qu'une carte de la main : partir à sa taille est ce qui donne
 * l'impression qu'on l'y a prise, plutôt que de la faire glisser depuis le
 * coin.
 */
import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { CarteAPeindre } from './texture-carte.ts'
import { textureDeCarte, textureDuDos } from './texture-carte.ts'
import { HAUT, LARGE } from './Carte3D.tsx'

/** La durée d'un vol, en secondes. */
export const DUREE_VOL = 0.42

/** Ce qu'une carte de plus coûte : elles partent l'une après l'autre. */
export const DECALAGE_VOL = 0.07

export type SensDuVol = 'pioche' | 'defausse'

type Props = {
  carte: CarteAPeindre
  /** Le coin d'où elle part, ou la place qu'elle quitte. */
  depuis: [number, number, number]
  /** Sa place dans la main, ou le coin où elle se range. */
  vers: [number, number, number]
  /** L'instant du départ, en secondes d'horloge de la scène. */
  debut: number
  sens: SensDuVol
  /** La taille qu'elle a du côté du paquet, en fraction d'une carte de main. */
  echelleTas: number
}

/** Une décélération douce : le trajet part vite et se pose. */
function poser(x: number): number {
  return 1 - (1 - x) * (1 - x) * (1 - x)
}

export function CarteQuiVole({
  carte,
  depuis,
  vers,
  debut,
  sens,
  echelleTas,
}: Props): React.JSX.Element {
  const groupe = useRef<THREE.Group>(null)

  const { face, dos } = useMemo(
    () => ({
      face: new THREE.MeshBasicMaterial({ transparent: true, toneMapped: false, depthWrite: false }),
      dos: new THREE.MeshBasicMaterial({ transparent: true, toneMapped: false, depthWrite: false }),
    }),
    [],
  )

  useEffect(() => {
    let vivant = true
    void textureDeCarte(carte)
      .then((t) => {
        if (!vivant) return
        face.map = t
        face.needsUpdate = true
      })
      .catch(() => {})
    void textureDuDos().then((t) => {
      if (!vivant) return
      dos.map = t
      dos.needsUpdate = true
    })
    return () => {
      vivant = false
    }
    // La signature du modèle suffit : construire la carte à la volée dans le
    // parent ne doit pas relancer le chargement. Même règle que `Carte3D`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [carte.nom, carte.cout, face, dos])

  useFrame((etat) => {
    const g = groupe.current
    if (g === null) return
    const k = Math.max(0, Math.min(1, (etat.clock.elapsedTime - debut) / DUREE_VOL))
    const avance = poser(k)

    /**
     * `p` EST LA PART DU CHEMIN FAITE VERS LA MAIN, dans les deux sens : 0 au
     * paquet, 1 dans la main. La pioche va de 0 à 1, la défausse de 1 à 0.
     *
     * *C'est une seule grandeur, et il ne faut pas en faire deux* : j'avais
     * d'abord échangé le départ et l'arrivée EN PLUS d'inverser l'avance, ce
     * qui revenait à ne rien inverser du tout — les cartes défaussées
     * finissaient leur course à leur place dans la main, de dos, et y
     * restaient.
     */
    const p = sens === 'pioche' ? avance : 1 - avance

    g.position.set(
      depuis[0] + (vers[0] - depuis[0]) * p,
      // UN LÉGER ARC : une carte lancée ne suit pas une corde. Il est faible —
      // le trajet est court, et un arc marqué se lirait comme un rebond.
      depuis[1] + (vers[1] - depuis[1]) * p + Math.sin(p * Math.PI) * 0.35,
      depuis[2] + (vers[2] - depuis[2]) * p + Math.sin(p * Math.PI) * 0.25,
    )

    g.scale.setScalar(echelleTas + (1 - echelleTas) * p)
    // LE DEMI-TOUR SUIT LE TRAJET : la carte est de dos au paquet et de face
    // dans la main. On tourne sur l'avance, pas sur le temps, pour que le
    // retournement et le déplacement finissent ensemble.
    g.rotation.y = Math.PI * (1 - p)
  })

  return (
    <group ref={groupe} position={depuis} scale={echelleTas}>
      <mesh material={face} raycast={() => null}>
        <planeGeometry args={[LARGE, HAUT]} />
      </mesh>
      {/* LE DOS, tourné d'un demi-tour : c'est lui qu'on voit tant que le
          groupe est retourné. */}
      <mesh material={dos} rotation={[0, Math.PI, 0]} raycast={() => null}>
        <planeGeometry args={[LARGE, HAUT]} />
      </mesh>
    </group>
  )
}

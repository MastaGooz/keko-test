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
 */
import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { CarteAPeindre } from './texture-carte.ts'
import { peindreCarte } from './texture-carte.ts'

/** La carte fait 1 de large ; le reste en découle, comme dans le gabarit. */
const LARGE = 1
const HAUT = 1.4
const EPAISSEUR = 0.012

type Props = {
  carte: CarteAPeindre
  position?: [number, number, number]
  /** De combien la carte suit le pointeur, en radians. 0 la fige. */
  suivi?: number
}

export function Carte3D({ carte, position = [0, 0, 0], suivi = 0.35 }: Props): React.JSX.Element {
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
    let texture: THREE.CanvasTexture | null = null
    void peindreCarte(carte).then((canvas) => {
      if (!vivant) return
      texture = new THREE.CanvasTexture(canvas)
      // La carte se regarde de près et en biais : sans filtrage anisotrope le
      // texte se brouille dès qu'elle s'incline.
      texture.anisotropy = 8
      texture.colorSpace = THREE.SRGBColorSpace
      face.map = texture
      face.color.set('#ffffff')
      face.needsUpdate = true
    })
    return () => {
      vivant = false
      texture?.dispose()
    }
  }, [carte, face])

  // LA CARTE SUIT LE POINTEUR, et c'est tout l'intérêt du volume : elle
  // s'incline, donc la lumière glisse dessus. Amorti, sinon elle colle au
  // doigt et le mouvement paraît mécanique.
  useFrame((etat, delta) => {
    if (groupe.current === null || suivi === 0) return
    const k = 1 - Math.exp(-6 * delta)
    groupe.current.rotation.x += (etat.pointer.y * suivi - groupe.current.rotation.x) * k
    groupe.current.rotation.y += (etat.pointer.x * suivi - groupe.current.rotation.y) * k
  })

  return (
    <group ref={groupe} position={position}>
      <mesh castShadow receiveShadow material={materiaux}>
        <boxGeometry args={[LARGE, HAUT, EPAISSEUR]} />
      </mesh>
    </group>
  )
}

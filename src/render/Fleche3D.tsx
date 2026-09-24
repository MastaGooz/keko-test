/**
 * LA FLÈCHE DE VISÉE.
 *
 * Une fois la carte passée en zone de jeu, elle **cesse de suivre le doigt** :
 * elle se pose au-dessus de la main, et c'est cette flèche qui prend le
 * relais. Demandé par Keko, et c'est le geste de Hearthstone.
 *
 * *Ce que ça achète* : la carte ne masque plus ce qu'on vise. Tant qu'elle
 * suivait le pouce, elle se posait précisément sur le corps qu'on cherchait à
 * désigner — sur un téléphone, la cible disparaissait sous la carte au moment
 * exact où il fallait la voir.
 *
 * **Un trait pointillé en cloche**, comme les arches du jeu 2D : des pastilles
 * qui grossissent vers la pointe, et une tête de flèche orientée sur la
 * tangente. Pas une ligne : `LineBasicMaterial` est plafonné à 1 px de large
 * sur la plupart des machines, ce qui donne un fil invisible au doigt.
 *
 * Elle est **dorée quand elle tient une cible, pâle sinon** — c'est le seul
 * repère qui dise, avant de lâcher, si le coup partira.
 */
import { useMemo } from 'react'
import * as THREE from 'three'

/** Le nombre de pastilles du trait. Assez pour lire une courbe, pas plus. */
const GRAINS = 14

const GEOMETRIE_GRAIN = new THREE.CircleGeometry(1, 12)

/** La tête : un triangle isocèle qui pointe vers +Y avant rotation. */
const GEOMETRIE_TETE = (() => {
  const forme = new THREE.Shape()
  forme.moveTo(0, 1)
  forme.lineTo(-0.72, -0.8)
  forme.lineTo(0, -0.45)
  forme.lineTo(0.72, -0.8)
  forme.closePath()
  return new THREE.ShapeGeometry(forme)
})()

type Props = {
  depuis: THREE.Vector3
  vers: THREE.Vector3
  /** Une cible est sous la pointe : le coup partira si on lâche. */
  valide: boolean
}

export function Fleche3D({ depuis, vers, valide }: Props): React.JSX.Element {
  const materiau = useMemo(
    () => new THREE.MeshBasicMaterial({ transparent: true, toneMapped: false, depthWrite: false }),
    [],
  )
  materiau.color.set(valide ? '#ffe6ab' : '#8d93a6')
  materiau.opacity = valide ? 1 : 0.55

  // LA CLOCHE : le point de contrôle est posé au-dessus du milieu, d'autant
  // plus haut que le trajet est long. Une quadratique reste toujours ENTRE ses
  // trois points de contrôle, donc borner celui-ci suffit à garantir que la
  // flèche ne sorte pas par le plafond — la leçon des arches 2D.
  const { grains, tete, angle } = useMemo(() => {
    const milieu = depuis.clone().add(vers).multiplyScalar(0.5)
    const portee = depuis.distanceTo(vers)
    milieu.y += Math.min(1.1, portee * 0.28)

    const point = (t: number): THREE.Vector3 => {
      const u = 1 - t
      return new THREE.Vector3(
        u * u * depuis.x + 2 * u * t * milieu.x + t * t * vers.x,
        u * u * depuis.y + 2 * u * t * milieu.y + t * t * vers.y,
        u * u * depuis.z + 2 * u * t * milieu.z + t * t * vers.z,
      )
    }

    const grains: { p: THREE.Vector3; r: number }[] = []
    for (let i = 0; i < GRAINS; i += 1) {
      const t = i / GRAINS
      grains.push({ p: point(t), r: 0.028 + 0.042 * t })
    }
    // La tête se pose un peu avant la cible, sur la tangente de la fin : posée
    // dessus, elle recouvre le corps qu'elle désigne.
    const fin = point(0.965)
    const avant = point(0.9)
    return { grains, tete: fin, angle: Math.atan2(fin.y - avant.y, fin.x - avant.x) - Math.PI / 2 }
  }, [depuis, vers])

  return (
    <group>
      {grains.map((grain, i) => (
        <mesh
          key={i}
          geometry={GEOMETRIE_GRAIN}
          material={materiau}
          position={grain.p}
          scale={grain.r}
          raycast={() => null}
        />
      ))}
      <mesh
        geometry={GEOMETRIE_TETE}
        material={materiau}
        position={tete}
        rotation={[0, 0, angle]}
        scale={0.17}
        raycast={() => null}
      />
    </group>
  )
}

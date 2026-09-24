/**
 * LES ÉCRANS DE PALIER : un VOILE sur la scène, jamais un lieu à part.
 *
 * C'est la règle du jeu 2D, et elle dit quelque chose : *on est encore dans le
 * donjon*. Le champ de bataille qu'on vient de vider reste visible derrière,
 * avec les corps tombés — là où l'armurerie, elle, est un lieu et pose un
 * voile opaque.
 *
 * Le voile est un plan posé DANS la scène, entre les créatures et les cartes
 * du choix : en HTML par-dessus le canvas il faudrait le percer pour laisser
 * voir les cartes. Et comme un plan **intercepte les rayons**, ce qu'il
 * recouvre devient insensible au doigt sans qu'on ait à le désactiver — même
 * mécanique que le voile du zoom.
 *
 * **Les cartes sont posées à la profondeur de la main**, donc à la taille
 * d'une carte de la main : ce sont exactement les cartes qu'on retrouvera
 * dedans. Une rangée et non un éventail — *ce sont des offres qu'on compare,
 * pas une main qu'on tient.*
 */
import { useState } from 'react'
import { useThree } from '@react-three/fiber'
import { Carte3D } from './Carte3D.tsx'
import { Z_MAIN, hauteurVisibleA } from './Cadrage.tsx'
import type { CarteAPeindre } from './texture-carte.ts'

const Z_CARTES = Z_MAIN
const Z_VOILE = Z_MAIN - 0.4

/** Le pas entre deux cartes de la rangée : une carte et un doigt d'écart. */
const PAS = 1.18

type Props = {
  cartes: readonly CarteAPeindre[]
  /** Taper une carte la choisit. Sans ça, la rangée ne fait que montrer. */
  onChoisir?: (index: number) => void
  onPeinte?: () => void
}

export function Etal3D({ cartes, onChoisir, onPeinte }: Props): React.JSX.Element {
  const { size } = useThree()
  const [survolee, setSurvolee] = useState<string | null>(null)

  // LA RANGÉE SE RESSERRE PLUTÔT QUE DE SORTIR DE L'ÉCRAN. Trois cartes
  // tiennent partout, mais rien ne garantit qu'un futur palier n'en propose
  // pas cinq — et en paysage c'est la largeur qu'on a, autant la mesurer.
  const large = hauteurVisibleA(Z_CARTES, size.height) * (size.width / size.height)
  const etendue = Math.max(1, cartes.length) * PAS
  const echelle = Math.min(1, (large * 0.92) / etendue)
  const centre = (cartes.length - 1) / 2

  return (
    <group>
      <mesh position={[0, 0, Z_VOILE]}>
        <planeGeometry args={[40, 24]} />
        <meshBasicMaterial color="#05050a" transparent opacity={0.82} />
      </mesh>

      {cartes.map((carte, i) => {
        // LE SURVOL SE MÉMORISE PAR IDENTIFIANT, jamais par index : la règle
        // de la main, pour la même raison — un index désigne une place, pas
        // une carte.
        const leve = survolee === carte.id
        return (
          <Carte3D
            key={carte.id}
            carte={carte}
            position={[(i - centre) * PAS * echelle, leve ? 0.1 : 0, Z_CARTES + (leve ? 0.12 : 0)]}
            rotation={[0, 0, 0]}
            taille={echelle * (leve ? 1.06 : 1)}
            ressort={16}
            onPeinte={onPeinte}
            onPointerDown={(e) => {
              e.stopPropagation()
              onChoisir?.(i)
            }}
            onPointerOver={(e) => {
              if (e.nativeEvent.pointerType === 'mouse') setSurvolee(carte.id)
            }}
            onPointerOut={(e) => {
              if (e.nativeEvent.pointerType === 'mouse') setSurvolee((s) => (s === carte.id ? null : s))
            }}
          />
        )
      })}
    </group>
  )
}

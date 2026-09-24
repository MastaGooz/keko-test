/**
 * LA CARTE QU'ON REGARDE DE PRÈS.
 *
 * Taper une carte l'amène au centre, droite et grande ; taper n'importe où la
 * repose. C'est l'autre moitié du geste — sans elle, le recouvrement de
 * l'éventail rend une carte illisible tant qu'on ne la sort pas.
 *
 * **LE ZOOM PORTE LA CARTE, PAS UN INDEX DE MAIN**, et c'est la leçon du jeu
 * 2D reprise telle quelle : tant qu'il était un index dans la main, il était
 * impossible de zoomer ailleurs — Keko : « je ne peux pas cliquer sur le
 * trésor dans le slot de loot pour zoomer ». Il vit donc ici, au-dessus de
 * tout le monde, et n'importe quel écran peut lui passer une carte.
 *
 * **Le voile est un plan posé DANS la scène**, entre ce qu'on regardait et la
 * carte. En HTML par-dessus le canvas il faudrait le percer pour laisser voir
 * la carte ; ici il suffit de mettre la carte devant. Et comme un plan
 * **intercepte les rayons**, tout ce qu'il recouvre devient insensible au
 * doigt sans qu'on ait à désactiver quoi que ce soit.
 */
import { useThree } from '@react-three/fiber'
import { Carte3D } from './Carte3D.tsx'
import { zCamera } from './Cadrage.tsx'
import type { CarteAPeindre } from './texture-carte.ts'

/**
 * Distances CAMÉRA → carte regardée, et caméra → voile : elles suivent le
 * recul du cadrage. À cette profondeur la carte occupe ~73 % de la hauteur
 * d'écran — assez pour lire le cartouche entier, pas assez pour déborder.
 */
const RECUL_ZOOM = 2.5
const RECUL_VOILE = 3

type Props = {
  carte: CarteAPeindre | null
  onFermer?: () => void
  onPeinte?: () => void
}

export function Zoom3D({ carte, onFermer, onPeinte }: Props): React.JSX.Element | null {
  const { size } = useThree()
  if (carte === null) return null
  const zCarte = zCamera(size.height) - RECUL_ZOOM
  const zVoile = zCamera(size.height) - RECUL_VOILE

  return (
    <group>
      <mesh position={[0, 0, zVoile]} onPointerDown={() => onFermer?.()}>
        <planeGeometry args={[40, 24]} />
        <meshBasicMaterial color="#05050a" transparent opacity={0.8} />
      </mesh>

      <Carte3D
        carte={carte}
        position={[0, 0, zCarte]}
        rotation={[0, 0, 0]}
        ressort={14}
        ombre={false}
        onPeinte={onPeinte}
        onPointerDown={(e) => {
          e.stopPropagation()
          onFermer?.()
        }}
      />
    </group>
  )
}

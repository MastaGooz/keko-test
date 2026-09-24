/**
 * L'ÉCRAN DE BUTIN, ET C'EST L'ÉCRAN DE JEU.
 *
 * Ce qu'on emporte est *littéralement* la main : même éventail, même taille de
 * carte, même enfouissement sous le bord, mêmes gestes — on tape une carte
 * pour la regarder de près, on la glisse pour la ranger ailleurs ou la
 * réorganiser. C'est la règle du jeu 2D, et elle dit quelque chose : *c'est la
 * main qu'on alourdit, donc c'est la main qu'on montre.*
 *
 * Ce module ne dessine que ce qui s'ajoute au-dessus d'elle : **deux
 * emplacements**, ce qui arrive et ce qu'on jette. Le reste est `Main3D`,
 * inchangée.
 *
 * **CHAQUE EMPLACEMENT EST AUSSI UN BOUTON**, comme en 2D : sur téléphone le
 * glisser seul est fragile, donc la tape doit toujours marcher. Taper
 * « Jeter » vide y envoie le trésor qui arrive ; le glisser ne fait que
 * désigner la même destination.
 */
import { useMemo } from 'react'
import * as THREE from 'three'
import { Carte3D } from './Carte3D.tsx'
import { Z_MAIN, surLePlan } from './Cadrage.tsx'
import type { CarteAPeindre } from './texture-carte.ts'
import { textureSlot } from './texture-carte.ts'

/** Les emplacements vivent à la profondeur de la main : même taille de carte. */
export const Z_SLOTS = Z_MAIN
const Y_SLOTS = 0.52
const X_LOOT = -0.82
const X_JETER = 0.82

/** La demi-largeur d'un emplacement, plus la marge du doigt. */
const PORTEE_X = 0.62
const PORTEE_Y = 0.85

export type Emplacement = 'loot' | 'jeter'

/**
 * Quel emplacement se trouve sous ce point de lâcher.
 *
 * **On ramène le point sur le plan des emplacements** : la carte qu'on tient
 * vit devant eux, donc un doigt pile sur un emplacement donne deux points
 * éloignés en coordonnées de scène. Même piège que la visée d'une créature.
 */
export function slotSous(
  point: [number, number, number],
  hauteurFenetrePx: number,
  avecLoot: boolean,
): Emplacement | null {
  const [x, y] = surLePlan(point, Z_SLOTS, hauteurFenetrePx)
  if (Math.abs(y - Y_SLOTS) > PORTEE_Y) return null
  if (avecLoot && Math.abs(x - X_LOOT) < PORTEE_X) return 'loot'
  if (Math.abs(x - X_JETER) < PORTEE_X) return 'jeter'
  return null
}

type SlotProps = {
  nom: string
  accent: string
  x: number
  carte: CarteAPeindre | null
  /** La carte posée ici est en train d'être perdue : contour rouge. */
  peril?: boolean
  onTaper?: () => void
  onPeinte?: () => void
}

function Slot({ nom, accent, x, carte, peril = false, onTaper, onPeinte }: SlotProps): React.JSX.Element {
  const materiau = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        map: textureSlot(nom, accent),
        transparent: true,
        depthWrite: false,
        toneMapped: false,
      }),
    [nom, accent],
  )

  // UN EMPLACEMENT OCCUPÉ NE SE ZOOME PAS, et c'est une différence assumée
  // avec le jeu 2D : là-bas le slot était plus petit que la main. Ici la carte
  // y est **à sa taille de main et sans voisine par-dessus**, donc elle se lit
  // déjà entièrement. *Le zoom existe pour défaire un recouvrement, pas par
  // principe.*
  if (carte !== null) {
    return (
      <Carte3D
        carte={carte}
        position={[x, Y_SLOTS, Z_SLOTS]}
        rotation={[0, 0, 0]}
        peril={peril}
        ombre={false}
        ressort={16}
        onPeinte={onPeinte}
      />
    )
  }

  return (
    <mesh
      position={[x, Y_SLOTS, Z_SLOTS]}
      material={materiau}
      onPointerDown={(e) => {
        e.stopPropagation()
        onTaper?.()
      }}
    >
      <planeGeometry args={[1, 1.4]} />
    </mesh>
  )
}

type Props = {
  loot: CarteAPeindre | null
  aJeter: CarteAPeindre | null
  /** Taper « Jeter » vide y envoie le trésor qui arrive. */
  onJeterLeLoot?: () => void
  onPeinte?: () => void
}

export function Butin3D({ loot, aJeter, onJeterLeLoot, onPeinte }: Props): React.JSX.Element {
  return (
    <group>
      {/* L'EMPLACEMENT DE LOOT DISPARAÎT UNE FOIS VIDE. Tant qu'il est là, il
          dit qu'il reste quelque chose à décider ; vide, il ne dirait plus
          qu'une chose — que c'est fini — et *une case vide au milieu d'un
          écran se lit comme un endroit où poser*, donc comme une tâche en
          attente. */}
      {loot !== null && (
        <Slot nom="Butin" accent="#c9a95a" x={X_LOOT} carte={loot} onPeinte={onPeinte} />
      )}
      <Slot
        nom="Jeter"
        accent={aJeter === null ? '#8a6a62' : '#ff6a52'}
        x={X_JETER}
        carte={aJeter}
        peril
        onTaper={loot === null ? undefined : onJeterLeLoot}
        onPeinte={onPeinte}
      />
    </group>
  )
}

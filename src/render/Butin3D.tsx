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
 * emplacements**, ce qui arrive et ce qu'on jette.
 *
 * **ET UN EMPLACEMENT SE MANIPULE COMME LA MAIN.** Il a d'abord été un simple
 * présentoir — on ne pouvait ni zoomer la carte posée dedans, ni la glisser
 * ailleurs. Keko : « je ne peux pas cliquer sur le trésor dans le slot de loot
 * pour zoomer ni le drag vers la main ». C'est le même geste partout
 * (`geste-carte.ts`) : *ce sont les mêmes cartes, ce doit être le même geste.*
 *
 * **CHAQUE EMPLACEMENT RESTE AUSSI UN BOUTON**, comme en 2D : sur téléphone le
 * glisser est fragile, donc la tape doit toujours marcher. Taper « Jeter »
 * vide y envoie le trésor qui arrive.
 */
import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { Carte3D } from './Carte3D.tsx'
import { Z_MAIN, surLePlan } from './Cadrage.tsx'
import { Z_TENUE, ligneDeLaMain } from './Main3D.tsx'
import { useGesteCarte } from './geste-carte.ts'
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

/** Où un trésor peut atterrir : un emplacement, ou la main de ce qu'on porte. */
export type Destination = Emplacement | 'deck'

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

/** Ce que lâcher à cet endroit veut dire, sur l'écran de butin. */
function destinationDe(
  point: THREE.Vector3,
  avecLoot: boolean,
): Destination | null {
  // SOUS LA LIGNE DE JEU, C'EST LA MAIN : le trésor rejoint ce qu'on emporte,
  // exactement comme une carte de combat qu'on repose dans sa main.
  if (point.y <= ligneDeLaMain(window.innerHeight)) return 'deck'
  return slotSous([point.x, point.y, point.z], window.innerHeight, avecLoot)
}

type SlotProps = {
  nom: string
  accent: string
  x: number
  carte: CarteAPeindre | null
  /** La carte posée ici est en train d'être perdue : contour rouge. */
  peril?: boolean
  /** Le geste qui prend la carte posée. */
  onPrendre?: (e: import('@react-three/fiber').ThreeEvent<PointerEvent>) => void
  /** Une tape sur l'emplacement VIDE : il reçoit. */
  onTaper?: () => void
  onPeinte?: () => void
}

function Slot({ nom, accent, x, carte, peril = false, onPrendre, onTaper, onPeinte }: SlotProps): React.JSX.Element {
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
        onPointerDown={onPrendre}
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
  /** Un trésor a été glissé d'un emplacement vers ailleurs. */
  onDeplacer?: (source: Emplacement, cible: Destination) => void
  onRegarder?: (carte: CarteAPeindre) => void
  /** Une carte est tenue : le parent fait passer la scène devant l'interface. */
  onSaisie?: (tenue: boolean) => void
  onPeinte?: () => void
}

export function Butin3D({
  loot,
  aJeter,
  onJeterLeLoot,
  onDeplacer,
  onRegarder,
  onSaisie,
  onPeinte,
}: Props): React.JSX.Element {
  // Index 0 : ce qui arrive. Index 1 : ce qu'on s'apprête à jeter.
  const cartes = [loot, aJeter]

  const { tenue, doigt, prendre } = useGesteCarte({
    z: Z_TENUE,
    onTaper: (i) => {
      const carte = cartes[i]
      if (carte !== undefined && carte !== null) onRegarder?.(carte)
    },
    onLacher: (i, point) => {
      const source: Emplacement = i === 0 ? 'loot' : 'jeter'
      const cible = destinationDe(point, loot !== null)
      if (cible !== null && cible !== source) onDeplacer?.(source, cible)
    },
  })

  useEffect(() => {
    onSaisie?.(tenue !== null)
  }, [tenue, onSaisie])

  const portee = tenue === null ? null : (cartes[tenue] ?? null)
  // Le halo ne s'allume que là où lâcher fait quelque chose : *un halo au-dessus
  // du vide promettrait un dépôt qui n'aura pas lieu.*
  const active =
    portee !== null && doigt !== null && destinationDe(doigt, loot !== null) !== null

  return (
    <group>
      {/* L'EMPLACEMENT DE LOOT DISPARAÎT UNE FOIS VIDE. Tant qu'il est là, il
          dit qu'il reste quelque chose à décider ; vide, il ne dirait plus
          qu'une chose — que c'est fini — et *une case vide au milieu d'un
          écran se lit comme un endroit où poser*, donc comme une tâche en
          attente. */}
      {loot !== null && (
        <Slot
          nom="Butin"
          accent="#c9a95a"
          x={X_LOOT}
          // CE QU'ON TIENT N'EST PLUS À SA PLACE : la case reprend l'habit
          // d'une case vide le temps du glisser, et elle dit toujours ce
          // qu'elle attend. Règle de l'armurerie 2D : sans son nom, c'est un
          // pointillé muet.
          carte={tenue === 0 ? null : loot}
          onPrendre={prendre(0)}
          onPeinte={onPeinte}
        />
      )}

      <Slot
        nom="Jeter"
        accent={aJeter === null ? '#8a6a62' : '#ff6a52'}
        x={X_JETER}
        carte={tenue === 1 ? null : aJeter}
        peril
        onPrendre={prendre(1)}
        onTaper={aJeter === null && loot !== null ? onJeterLeLoot : undefined}
        onPeinte={onPeinte}
      />

      {/* LA CARTE TENUE SUIT LE DOIGT, hors de sa case. */}
      {portee !== null && doigt !== null && (
        <Carte3D
          carte={portee}
          position={[doigt.x, doigt.y, Z_TENUE]}
          rotation={[0, 0, 0]}
          taille={1.05}
          ressort={22}
          engagee={active}
          ombre={false}
          onPeinte={onPeinte}
        />
      )}
    </group>
  )
}

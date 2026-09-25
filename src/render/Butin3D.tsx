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
 * **MAIS UN EMPLACEMENT VIDE NE REÇOIT PAS À LA TAPE.** Le jeu 2D en fait une
 * règle — chaque destination est aussi un bouton — et elle ne tient pas ici :
 * taper « Jeter » y envoyait le trésor, et *une tape est trop facile à
 * déclencher pour une décision qu'on ne reprend pas.* Keko l'a retiré. Jeter
 * demande donc de GLISSER, un geste qu'on ne fait pas par mégarde, puis de
 * valider.
 */
import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { Bouton3D, tailleBouton } from './Bouton3D.tsx'
import { Carte3D } from './Carte3D.tsx'
import { Z_MAIN, hauteurVisibleA, surLePlan } from './Cadrage.tsx'
import { Z_TENUE, ligneDeLaMain } from './Main3D.tsx'
import { useGesteCarte } from './geste-carte.ts'
import type { CarteAPeindre } from './texture-carte.ts'
import { textureSlot } from './texture-carte.ts'

/** Les emplacements vivent à la profondeur de la main : même taille de carte. */
export const Z_SLOTS = Z_MAIN

/**
 * OÙ SE POSENT LES DEUX EMPLACEMENTS.
 *
 * **Le trésor qui arrive est EN HAUT AU CENTRE**, son bouton juste dessous —
 * c'est la seule décision de l'écran, elle occupe le milieu. **Ce qu'on jette
 * est à droite**, à mi-hauteur, avec ses deux issues sous lui. Et **une fois
 * le trésor décidé, « Terminer » vient prendre sa place** : le bouton
 * n'apparaît qu'après, donc il hérite de l'endroit où l'oeil regardait déjà.
 * Disposition tranchée par Keko.
 *
 * Calculé depuis la fenêtre plutôt que fixé : la caméra recule sur grand
 * écran, donc le bord du champ visible n'est pas au même endroit — un
 * emplacement posé à une distance constante finirait au milieu de nulle part.
 *
 * **Le rebut se cale au milieu de ce qui est LIBRE**, entre le haut de la main
 * et le haut de l'écran, et non au milieu de l'écran : ses boutons pendent
 * sous lui, et sur un téléphone — où tout est proportionnellement plus grand —
 * ils tomberaient sinon dans la main.
 */
/** Les deux issues du rebut, épaule contre épaule sous leur emplacement. */
function ecartJeter(): number {
  return tailleBouton('Reprendre', 'garder', true, Z_SLOTS, window.innerHeight).largeur / 2 + 0.03
}
function ecartReprendre(): number {
  return tailleBouton('Jeter', 'perdre', true, Z_SLOTS, window.innerHeight).largeur / 2 + 0.03
}

/** De combien descendre le centre d'un bouton pour qu'il passe sous la carte. */
function bas(petit: boolean, hauteurFenetrePx: number): number {
  return tailleBouton('X', 'or', petit, Z_SLOTS, hauteurFenetrePx).hauteur / 2 + 0.06
}

function places(): {
  xLoot: number
  yLoot: number
  xJeter: number
  yJeter: number
  sousLoot: number
  sousJeter: number
} {
  const h = window.innerHeight
  const demiHaut = hauteurVisibleA(Z_SLOTS, h) / 2
  const demiLarge = demiHaut * (window.innerWidth / h)
  const yLoot = demiHaut - 0.9
  const yJeter = (ligneDeLaMain(h) + demiHaut) / 2
  return {
    xLoot: 0,
    yLoot,
    // Borné : sur un écran large, collé au bord, il sortirait du regard.
    xJeter: Math.min(demiLarge - 0.65, 2.2),
    yJeter,
    // Sous le bas de la carte, plus la demi-hauteur du bouton et un cheveu :
    // il se CENTRE sur son point, il n'y pend pas.
    sousLoot: yLoot - 0.7 - bas(false, h),
    sousJeter: yJeter - 0.7 - bas(true, h),
  }
}

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
  const { xLoot, yLoot, xJeter, yJeter } = places()
  const [x, y] = surLePlan(point, Z_SLOTS, hauteurFenetrePx)
  if (avecLoot && Math.abs(x - xLoot) < PORTEE_X && Math.abs(y - yLoot) < PORTEE_Y) return 'loot'
  if (Math.abs(x - xJeter) < PORTEE_X && Math.abs(y - yJeter) < PORTEE_Y) return 'jeter'
  return null
}

/** Ce que lâcher à cet endroit veut dire, sur l'écran de butin. */
function destinationDe(point: THREE.Vector3, avecLoot: boolean): Destination | null {
  // SOUS LA LIGNE DE JEU, C'EST LA MAIN : le trésor rejoint ce qu'on emporte,
  // exactement comme une carte de combat qu'on repose dans sa main.
  if (point.y <= ligneDeLaMain(window.innerHeight)) return 'deck'
  return slotSous([point.x, point.y, point.z], window.innerHeight, avecLoot)
}

type SlotProps = {
  nom: string
  accent: string
  x: number
  y: number
  carte: CarteAPeindre | null
  /** La carte posée ici est en train d'être perdue : contour rouge. */
  peril?: boolean
  /** Le geste qui prend la carte posée. */
  onPrendre?: (e: import('@react-three/fiber').ThreeEvent<PointerEvent>) => void
  onPeinte?: () => void
}

function Slot({ nom, accent, x, y, carte, peril = false, onPrendre, onPeinte }: SlotProps): React.JSX.Element {
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
        position={[x, y, Z_SLOTS]}
        rotation={[0, 0, 0]}
        peril={peril}
        ombre={false}
        ressort={16}
        onPeinte={onPeinte}
        onPointerDown={onPrendre}
      />
    )
  }

  // UN EMPLACEMENT VIDE NE RÉPOND PAS À LA TAPE. Il l'a fait — taper « Jeter »
  // y envoyait le trésor — et Keko l'a retiré : *une tape est trop facile à
  // déclencher pour une décision qu'on ne reprend pas.* Il faut désormais y
  // GLISSER la carte, un geste qu'on ne fait pas par mégarde.
  return (
    <mesh position={[x, y, Z_SLOTS]} material={materiau}>
      <planeGeometry args={[1, 1.4]} />
    </mesh>
  )
}

type Props = {
  loot: CarteAPeindre | null
  aJeter: CarteAPeindre | null
  /** Un trésor a été glissé d'un emplacement vers ailleurs. */
  onDeplacer?: (source: Emplacement, cible: Destination) => void
  /** Ce qu'on peut décider maintenant. Un bouton absent n'est pas dessiné. */
  onPrendreLoot?: () => void
  onTerminer?: () => void
  onJeter?: () => void
  onReprendre?: () => void
  /** Une carte est tenue ailleurs sur l'écran : tout s'éteint. */
  gestEnCours?: boolean
  onRegarder?: (carte: CarteAPeindre) => void
  /** Une carte est tenue : le parent fait passer la scène devant l'interface. */
  onSaisie?: (tenue: boolean) => void
  onPeinte?: () => void
  /** La MAIN tient une carte au-dessus du rebut : son geste vit ailleurs. */
  mainSurLeRebut?: boolean
}

export function Butin3D({
  loot,
  aJeter,
  onDeplacer,
  onPrendreLoot,
  onTerminer,
  onJeter,
  onReprendre,
  gestEnCours = false,
  onRegarder,
  onSaisie,
  onPeinte,
  mainSurLeRebut = false,
}: Props): React.JSX.Element {
  // Index 0 : ce qui arrive. Index 1 : ce qu'on s'apprête à jeter.
  const cartes = [loot, aJeter]
  const { xLoot, yLoot, xJeter, yJeter, sousLoot, sousJeter } = places()

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
  // LA CARTE PEUT VENIR DE DEUX ENDROITS : de l'emplacement de loot, dont le
  // geste vit ici, ou de la MAIN, dont le geste vit dans `Main3D`. Le slot
  // doit rougir dans les deux cas — Keko : « quand je drag depuis la main des
  // trésors vers le slot jeter, il ne passe pas en rouge ». *Un écran qui a
  // deux gestes doit écouter les deux.*
  const survoleLeRebut =
    (portee !== null && doigt !== null && destinationDe(doigt, loot !== null) === 'jeter') ||
    mainSurLeRebut

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
          x={xLoot}
          y={yLoot}
          // CE QU'ON TIENT N'EST PLUS À SA PLACE : la case reprend l'habit
          // d'une case vide le temps du glisser, et elle dit toujours ce
          // qu'elle attend. Règle de l'armurerie 2D : sans son nom, c'est un
          // pointillé muet.
          carte={tenue === 0 ? null : loot}
          onPrendre={prendre(0)}
          onPeinte={onPeinte}
        />
      )}

      {/* LE REBUT NE ROUGIT QUE SOUS LA CARTE. Il rougissait dès qu'une carte
          était sortie, où qu'elle soit — Keko : « il est rouge quand une carte
          en est sortie, peu importe où elle est, même loin de lui, ça ne va
          pas ». *Un avertissement permanent n'avertit de rien* : c'est ce
          qu'on survole qui menace, pas ce qu'on tient. */}
      <Slot
        nom="Jeter"
        accent={survoleLeRebut ? '#ff6a52' : '#8a6a62'}
        x={xJeter}
        y={yJeter}
        carte={tenue === 1 ? null : aJeter}
        peril
        onPrendre={prendre(1)}
        onPeinte={onPeinte}
      />

      {/* LES BOUTONS SONT DANS LA SCÈNE, donc DERRIÈRE la carte qu'on promène :
          c'est la seule façon d'obtenir cet ordre, puisqu'un bouton HTML doit
          être au-dessus du canvas pour recevoir le clic. Ils s'éteignent
          pendant un geste — on est au milieu d'un mouvement, rien d'autre n'a
          à répondre — et on voit alors la carte au travers. */}
      {loot !== null ? (
        <Bouton3D
          texte="Prendre"
          ton="or"
          position={[xLoot, sousLoot, Z_SLOTS]}
          eteint={tenue !== null || gestEnCours}
          onCliquer={onPrendreLoot}
        />
      ) : (
        // GRISÉ, PAS ABSENT, tant qu'une carte attend dans le rebut : il vient
        // d'apparaître à la place du trésor, le voir s'effacer aussitôt
        // donnerait l'impression de l'avoir cassé.
        <Bouton3D
          texte="Terminer"
          ton="or"
          position={[xLoot, sousLoot, Z_SLOTS]}
          eteint={aJeter !== null || tenue !== null || gestEnCours}
          onCliquer={onTerminer}
        />
      )}

      {aJeter !== null && (
        <>
          {/* JETER DEMANDE DEUX GESTES : on voit ce qu'on s'apprête à perdre,
              puis on valide. Et l'autre issue est posée juste à côté — un
              glisser qu'il faut deviner ne vaut pas un bouton qui dit le choix
              inverse. */}
          <Bouton3D
            texte="Jeter"
            ton="perdre"
            petit
            position={[xJeter - ecartJeter(), sousJeter, Z_SLOTS]}
            eteint={tenue !== null || gestEnCours}
            onCliquer={onJeter}
          />
          <Bouton3D
            texte="Reprendre"
            ton="garder"
            petit
            position={[xJeter + ecartReprendre(), sousJeter, Z_SLOTS]}
            eteint={tenue !== null || gestEnCours}
            onCliquer={onReprendre}
          />
        </>
      )}

      {/* LA CARTE TENUE SUIT LE DOIGT, hors de sa case. Au-dessus du rebut,
          son halo passe au ROUGE et elle frémit quand même : *un halo doré sur
          une carte qu'on s'apprête à perdre dirait le contraire de ce qui va
          se passer.* Demandé par Keko. */}
      {portee !== null && doigt !== null && (
        <Carte3D
          carte={portee}
          position={[doigt.x, doigt.y, Z_TENUE]}
          rotation={[0, 0, 0]}
          taille={1.05}
          ressort={22}
          engagee={active}
          peril={survoleLeRebut}
          ombre={false}
          onPeinte={onPeinte}
        />
      )}
    </group>
  )
}

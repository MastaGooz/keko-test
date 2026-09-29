/**
 * CHOISIR CE QU'ON MET DANS UN SLOT.
 *
 * Demandé par Keko : « l'armurerie sert à équiper, je pense qu'on se prend la
 * tête à fusionner armurerie et coffre. On affiche uniquement le panneau
 * équipement. Le joueur peut cliquer sur les slots d'équipement, ce qui affiche
 * les cartes disponibles pour ce slot, et le joueur clique pour en choisir
 * une. »
 *
 * **C'est ce qui remplace le glisser d'un meuble à l'autre**, et il le fallait :
 * le coffre est devenu une destination du rail, donc les deux meubles ne sont
 * plus à l'écran en même temps et le geste ne peut plus les traverser. *Le
 * glisser demandait que les deux soient visibles ; la tape ne demande que de
 * savoir où l'on va.*
 *
 * **CE QU'ON PROPOSE EST EXACTEMENT CE QUE LE DÉPÔT ACCEPTERAIT**
 * (`candidatsPourSlot`, qui appelle la règle) : un choix qui offrirait une
 * pièce impossible à poser serait pire qu'un slot qui refuse en silence.
 *
 * **ET LE VIDE EST UN CHOIX.** Quand le slot tient quelque chose, la première
 * case est un pointillé qui dit « Retirer » : *une liste de ce qui peut être
 * dans un slot doit contenir « rien »*, sinon déséquiper n'a plus de porte du
 * tout — le glisser vers le coffre n'existe plus, puisque le coffre n'est plus
 * là.
 *
 * **La tape choisit, le MAINTIEN regarde.** La règle du projet veut que la tape
 * regarde et le glisser déplace ; ici la tape est la seule action de l'écran,
 * donc c'est elle qui engage — et lire une carte revient au maintien, le même
 * seuil de 160 ms que la loupe du zoom et que la prise en main. *Un appui long
 * veut dire la même chose partout dans ce jeu.*
 */
import { useEffect, useRef } from 'react'
import { useMemo } from 'react'
import * as THREE from 'three'
import { Carte3D, tailleDuCompte } from './Carte3D.tsx'
import { useThree } from '@react-three/fiber'
import { pieceAPeindre } from './combat-3d.ts'
import { textureSlot } from './texture-carte.ts'
import type { PlanArmurerie } from './armurerie-plan.ts'
import { candidatsPourSlot, grilleDuChoix, pieceDuSlot, pixelsParUnite } from './armurerie-plan.ts'
import type { Objet } from '../logic/armes.ts'
import type { Hub, Slot } from '../logic/hub.ts'
import { Z_PLAN } from './armurerie-plan.ts'

/** Ce qu'il faut maintenir pour REGARDER au lieu de CHOISIR. */
const DELAI_LOUPE = 160

type Props = {
  hub: Hub
  slot: Slot
  plan: PlanArmurerie
  /** On équipe cet exemplaire dans le slot. */
  onChoisir: (id: string) => void
  /** On vide le slot : ce qu'il tenait repart au coffre. */
  onRetirer: (id: string) => void
  onFermer: () => void
  onRegarder: (objet: Objet) => void
  sousLeZoom?: boolean
  onPeinte?: () => void
}

/** La case en pointillé de « Retirer » : un slot vide, avec son mot dedans. */
function CaseRetirer({
  position,
  taille,
  onCliquer,
}: {
  position: [number, number, number]
  taille: number
  onCliquer: () => void
}): React.JSX.Element {
  const materiau = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        map: textureSlot('Retirer', '#8b6a5e'),
        transparent: true,
        depthWrite: false,
        toneMapped: false,
      }),
    [],
  )
  return (
    <mesh
      position={position}
      material={materiau}
      onPointerDown={(e) => {
        e.stopPropagation()
        onCliquer()
      }}
    >
      <planeGeometry args={[taille, taille * 1.4]} />
    </mesh>
  )
}

export function Choix3D({
  hub,
  slot,
  plan,
  onChoisir,
  onRetirer,
  onFermer,
  onRegarder,
  sousLeZoom = false,
  onPeinte,
}: Props): React.JSX.Element {
  const { size } = useThree()
  const porte = pieceDuSlot(hub, slot)
  const piles = candidatsPourSlot(hub, slot)
  // LA CASE « RETIRER » COMPTE DANS LA GRILLE : c'est une case comme les
  // autres, sinon la rangée se centrerait sur un contenu qu'elle ne porte pas.
  const nombre = piles.length + (porte === null ? 0 : 1)
  const { taille, positions } = grilleDuChoix(plan, nombre)
  const tailleCompte = tailleDuCompte(taille * pixelsParUnite(size.height))

  /**
   * LE MAINTIEN REGARDE, LA TAPE CHOISIT.
   *
   * Les écouteurs se retirent par SIGNAL et non par référence : c'est la règle
   * du projet, et elle vaut d'autant plus ici que ce gestionnaire est recréé à
   * chaque rendu.
   */
  const appui = useRef<{ minuteur: number; couper: AbortController } | null>(null)
  useEffect(
    () => () => {
      if (appui.current !== null) {
        window.clearTimeout(appui.current.minuteur)
        appui.current.couper.abort()
      }
    },
    [],
  )
  const presser = (objet: Objet): void => {
    const couper = new AbortController()
    const etat = { minuteur: 0, couper, ouverte: false }
    etat.minuteur = window.setTimeout(() => {
      etat.ouverte = true
      onRegarder(objet)
    }, DELAI_LOUPE)
    appui.current = { minuteur: etat.minuteur, couper }
    const fin = (): void => {
      window.clearTimeout(etat.minuteur)
      couper.abort()
      appui.current = null
      // Un appui long a servi à REGARDER : le relâcher ne choisit pas.
      if (!etat.ouverte) onChoisir(objet.id)
    }
    window.addEventListener('pointerup', fin, { signal: couper.signal })
    window.addEventListener('pointercancel', fin, { signal: couper.signal })
  }

  return (
    <group>
      {/* LE VOILE ARRÊTE L'ÉVÈNEMENT, pas seulement le rayon : R3F prévient
          TOUS les objets que le rayon traverse, donc sans `stopPropagation` une
          tape le refermerait *et* atteindrait le slot derrière, qui le
          rouvrirait aussitôt. Et il arrête aussi le MOUVEMENT, sinon les cartes
          du chargement continueraient de s'incliner sous le curseur derrière
          lui. */}
      <mesh
        position={[0, 0, Z_PLAN + 0.35]}
        onPointerDown={(e) => {
          e.stopPropagation()
          onFermer()
        }}
        onPointerMove={(e) => e.stopPropagation()}
      >
        <planeGeometry args={[40, 24]} />
        <meshBasicMaterial color="#05050a" transparent opacity={0.84} />
      </mesh>

      {porte !== null && positions[0] !== undefined && (
        <CaseRetirer
          position={positions[0]}
          taille={taille}
          onCliquer={() => onRetirer(porte.id)}
        />
      )}

      {piles.map((pile, i) => {
        const place = positions[i + (porte === null ? 0 : 1)]
        if (place === undefined) return null
        return (
          <Carte3D
            key={pile.objet.id}
            carte={pieceAPeindre(pile.objet)}
            position={place}
            rotation={[0, 0, 0]}
            taille={taille}
            ombre={false}
            reflet={!sousLeZoom}
            pile={pile.nombre > 1 ? pile.nombre : undefined}
            pileTaille={tailleCompte}
            onPeinte={onPeinte}
            onPointerDown={(e) => {
              e.stopPropagation()
              presser(pile.objet)
            }}
          />
        )
      })}
    </group>
  )
}

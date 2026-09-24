/**
 * L'ARMURERIE : ce qu'on emporte, et donc le deck qu'on descend.
 *
 * **Une seule question s'y décide, et elle porte tout le concept : partir
 * léger ou partir couvert.** Le Glaive seul donne trois cartes qui frappent
 * toutes ; avec le Plastron, neuf dont six qui ne frappent pas. *La taille du
 * deck est une ressource, et c'est ici qu'on la dépense.* Le compte affiché
 * — « Deck de 10 cartes · 3 qui frappent » — est ce qui rend ça lisible AVANT
 * de descendre : sans lui, une pièce de plus serait un gain sans contrepartie
 * visible.
 *
 * **C'est un LIEU, pas un calque** : son fond est opaque. Les écrans de palier
 * laissent voir le donjon derrière eux parce qu'on y est encore ; au hub, il
 * n'y a pas de combat à montrer.
 *
 * **La réserve est une grille de cartes réduites, le chargement est à la
 * taille de la main** : on cherche dans la réserve, on lit ce qu'on emporte
 * tel qu'on le portera. Et la réserve montre ses cases vides — c'est une
 * grille de places, pas une liste d'objets.
 */
import { useEffect, useMemo } from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { Carte3D } from './Carte3D.tsx'
import { Bouton3D } from './Bouton3D.tsx'
import { Z_MAIN, hauteurVisibleA } from './Cadrage.tsx'
import { Z_TENUE } from './Main3D.tsx'
import { useGesteCarte } from './geste-carte.ts'
import { pieceAPeindre } from './combat-3d.ts'
import { textureSlot } from './texture-carte.ts'
import type { Objet } from '../logic/armes.ts'
import { estConsommable } from '../logic/armes.ts'
import type { Hub, Slot } from '../logic/hub.ts'
import { CAPACITE_PILE, accepteDepuis, deuxMains, peutDescendre } from '../logic/hub.ts'

const Z_PLAN = Z_MAIN

/** La taille d'une case de la réserve, en fraction d'une carte de la main. */
const REDUIT = 0.52

/**
 * LA TAILLE D'UNE CASE DE LA PILE EST IMPOSÉE PAR L'ARITHMÉTIQUE, pas choisie.
 *
 * Deux lignes de cases doivent tenir dans la hauteur d'un slot. Une carte fait
 * 1,4 fois sa largeur, donc deux cases de largeur `c` font `2,8 c` de haut ;
 * pour que ça vaille la hauteur d'un slot (1,4), il faut **`c = 1 / 2`,
 * exactement**. Les agrandir obligerait à rétrécir les armes d'autant.
 */
const PILE = 0.5

/** Combien de cases la réserve montre au minimum : une grille, pas une liste. */
const CASES_MINIMUM = 12
const COLONNES = 4

/**
 * Où tout se pose, mesuré depuis la fenêtre.
 *
 * La réserve à gauche, le chargement à droite : **on prend à gauche, on pose à
 * droite, et le sens de lecture fait le geste.**
 */
function plan(hauteurFenetrePx: number, largeurFenetrePx: number): {
  demiHaut: number
  demiLarge: number
  pasReserve: number
  coinReserve: [number, number]
  xCharge: number
  yMains: number
  yArmure: number
  pasCharge: number
} {
  const demiHaut = hauteurVisibleA(Z_PLAN, hauteurFenetrePx) / 2
  const demiLarge = (demiHaut * largeurFenetrePx) / hauteurFenetrePx
  // Une case réduite, plus un cheveu : la grille doit respirer sans s'étaler.
  const pasReserve = REDUIT * 1.14
  return {
    demiHaut,
    demiLarge,
    pasReserve,
    coinReserve: [-demiLarge + 0.45, demiHaut - 0.85],
    xCharge: demiLarge - 1.55,
    yMains: demiHaut - 1.15,
    yArmure: demiHaut - 2.75,
    pasCharge: 1.18,
  }
}

/** La place d'une case de la réserve, en coordonnées de scène. */
function placeReserve(i: number, hauteurFenetrePx: number, largeurFenetrePx: number): [number, number, number] {
  const { coinReserve, pasReserve } = plan(hauteurFenetrePx, largeurFenetrePx)
  const colonne = i % COLONNES
  const ligne = Math.floor(i / COLONNES)
  return [coinReserve[0] + colonne * pasReserve, coinReserve[1] - ligne * pasReserve * 1.4, Z_PLAN]
}

/** Les places du chargement, dans l'ordre : main gauche, main droite, armure, pile. */
function placesCharge(
  hauteurFenetrePx: number,
  largeurFenetrePx: number,
  aDeuxMains: boolean,
): {
  mains: [[number, number, number], [number, number, number]]
  armure: [number, number, number]
  pile: [number, number, number][]
} {
  const { xCharge, yMains, yArmure, pasCharge } = plan(hauteurFenetrePx, largeurFenetrePx)
  // Deux colonnes serrées, deux lignes centrées sur la ligne du torse.
  const pasX = PILE * 1.1
  const pasY = PILE * 1.4 * 1.06
  // UNE ARME À DEUX MAINS SE CENTRE, et l'autre slot est MASQUÉ, pas barré :
  // un slot « tenu à deux mains » dirait la règle, un slot en moins la montre.
  const xArme = aDeuxMains ? xCharge : xCharge - pasCharge / 2
  return {
    mains: [
      [xArme, yMains, Z_PLAN],
      [xCharge + pasCharge / 2, yMains, Z_PLAN],
    ],
    armure: [xCharge - pasCharge / 2, yArmure, Z_PLAN],
    // LA PILE EST UNE GRILLE DE QUATRE CASES, à côté de l'armure : occupées ou
    // non, comme la réserve montre les siennes. C'est ce qui dit d'un coup
    // d'oeil ce qu'il reste à décider.
    pile: Array.from({ length: CAPACITE_PILE }, (_, i) => [
      xCharge + pasCharge / 2 + (i % 2 === 0 ? -pasX / 2 : pasX / 2),
      yArmure + (i < 2 ? pasY / 2 : -pasY / 2),
      Z_PLAN,
    ]),
  }
}

/**
 * LA TAILLE QU'UNE PIÈCE AURA UNE FOIS POSÉE LÀ.
 *
 * Le chargement se lit à la taille de la main, la réserve et la pile en
 * réduit. C'est cette valeur que prend la pièce tenue quand elle survole un
 * slot qui l'accepte : *ce qu'on montre pendant le geste est ce qu'on aura
 * après.*
 */
function tailleDuSlot(slot: Slot): number {
  if (slot.ou === 'pile') return PILE
  if (slot.ou === 'reserve') return REDUIT
  return 1
}

/** Ce que le slot attend, pour le dessiner vide. */
const ATTEND: Record<string, string> = { main: 'Arme', armure: 'Armure', pile: 'Objet' }

/** La teinte d'une case vide : le râtelier et la pile sont plus discrets. */
const TEINTE: Record<string, string> = { reserve: '#3c3a35', pile: '#4a4a40' }

type CaseProps = {
  nom: string
  position: [number, number, number]
  taille: number
  accent?: string
}

function CaseVide({ nom, position, taille, accent = '#6f6a5e' }: CaseProps): React.JSX.Element {
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
  return (
    <mesh position={position} material={materiau}>
      <planeGeometry args={[taille, taille * 1.4]} />
    </mesh>
  )
}

type Props = {
  hub: Hub
  /** Un objet a été glissé d'un endroit à un autre. */
  onDeplacer?: (source: Slot, cible: Slot, id: string) => void
  onRegarder?: (objet: Objet) => void
  onDescendre?: () => void
  onSaisie?: (tenue: boolean) => void
  onPeinte?: () => void
}

export function Armurerie3D({ hub, onDeplacer, onRegarder, onDescendre, onSaisie, onPeinte }: Props): React.JSX.Element {
  const { size } = useThree()
  const { demiHaut } = plan(size.height, size.width)
  const aDeuxMains = deuxMains(hub.chargement)
  const places = placesCharge(size.height, size.width, aDeuxMains)

  /**
   * TOUT CE QUI SE MANIPULE, À PLAT ET DANS UN SEUL ORDRE.
   *
   * Le geste ne connaît qu'un index ; c'est cette liste qui dit d'où vient la
   * pièce. *Un seul tableau plutôt qu'un cas par contenant* — c'est la même
   * raison qui fait du modèle un `Lieu` dans les règles.
   */
  const objets: { objet: Objet; slot: Slot; position: [number, number, number]; taille: number }[] = [
    ...hub.reserve.map((objet, i) => ({
      objet,
      slot: { ou: 'reserve' } as Slot,
      position: placeReserve(i, size.height, size.width),
      taille: REDUIT,
    })),
    ...hub.chargement.mains.flatMap((arme, rang) =>
      arme === null
        ? []
        : [{ objet: arme as Objet, slot: { ou: 'main', rang } as Slot, position: places.mains[rang as 0 | 1], taille: 1 }],
    ),
    ...(hub.chargement.armure === null
      ? []
      : [{ objet: hub.chargement.armure as Objet, slot: { ou: 'armure' } as Slot, position: places.armure, taille: 1 }]),
    ...hub.chargement.pile.map((objet, i) => ({
      objet: objet as Objet,
      slot: { ou: 'pile' } as Slot,
      position: places.pile[i] ?? places.pile[0]!,
      taille: PILE,
    })),
  ]

  /** Quel slot se trouve sous ce point. La réserve est tout le flanc gauche. */
  const slotSous = (point: THREE.Vector3): Slot | null => {
    const { xCharge, yMains, yArmure, pasCharge } = plan(size.height, size.width)
    // Une arme à deux mains se pose dans N'IMPORTE QUELLE main : les deux
    // zones restent sensibles, c'est la règle qui décide où elle atterrit.
    const pres = (p: [number, number, number], l: number, h: number): boolean =>
      Math.abs(point.x - p[0]) < l && Math.abs(point.y - p[1]) < h
    if (pres(places.mains[0], 0.6, 0.75)) return { ou: 'main', rang: 0 }
    if (pres(places.mains[1], 0.6, 0.75)) return { ou: 'main', rang: 1 }
    if (pres(places.armure, 0.6, 0.75)) return { ou: 'armure' }
    if (pres([xCharge + pasCharge / 2, yArmure, 0], 0.62, 0.78)) return { ou: 'pile' }
    // Hors du chargement, c'est la réserve : elle n'a pas de cases, on y repose.
    if (point.x < xCharge - pasCharge - 0.2 || point.y > yMains + 0.9) return { ou: 'reserve' }
    return null
  }

  const { tenue, doigt, prendre } = useGesteCarte({
    z: Z_TENUE,
    onTaper: (i) => {
      const t = objets[i]
      if (t !== undefined) onRegarder?.(t.objet)
    },
    onLacher: (i, point) => {
      const t = objets[i]
      const cible = slotSous(point)
      if (t === undefined || cible === null) return
      onDeplacer?.(t.slot, cible, t.objet.id)
    },
  })

  useEffect(() => {
    onSaisie?.(tenue !== null)
  }, [tenue, onSaisie])

  const portee = tenue === null ? null : (objets[tenue] ?? null)

  /**
   * LA PIÈCE TENUE PREND LA TAILLE DU SLOT QUI L'ACCEPTE.
   *
   * Réduite, elle ne cache pas les cases qu'on vise — c'est la règle de Keko
   * sur le fantôme de l'armurerie 2D, et elle tient. Mais au-dessus d'un slot
   * qui la prend, elle grandit jusqu'à la taille qu'elle y aura : *le signal
   * et l'aperçu sont la même chose*, et en 3D une taille se lit d'un coup
   * d'oeil là où le 2D allumait un liseré bleu.
   *
   * Un slot qui refuse ne la fait pas grandir, donc le refus se lit AVANT le
   * lâcher — un slot qui promet puis ne fait rien a l'air cassé.
   *
   * `Carte3D` amortit déjà sa taille : la carte enfle et se retasse toute
   * seule, il n'y a aucune animation à écrire.
   */
  const sousLeDoigt = doigt === null ? null : slotSous(doigt)
  const accueille =
    portee !== null &&
    sousLeDoigt !== null &&
    accepteDepuis(hub, portee.slot, sousLeDoigt, portee.objet.id)
  const tailleTenue = accueille && sousLeDoigt !== null ? tailleDuSlot(sousLeDoigt) : REDUIT

  /**
   * ELLE NE FRÉMIT QU'AU-DESSUS D'UN SLOT DU CHARGEMENT QUI LA PREND.
   *
   * Le frémissement dit « lâche et ça part », donc il doit être vrai — il
   * frémissait pendant tout le geste, y compris en plein vide où lâcher ne
   * fait rien. Demandé par Keko. *Un repère permanent ne repère plus rien.*
   *
   * Le râtelier en est exclu bien qu'il accepte tout : c'est l'endroit d'où
   * l'on vient, et y reposer n'est pas ce que le geste cherche.
   */
  const surUnSlot =
    accueille && sousLeDoigt !== null && sousLeDoigt.ou !== 'reserve'
  const casesVides = Math.max(0, CASES_MINIMUM - hub.reserve.length)

  return (
    <group>
      {/* LE VOILE EST OPAQUE : l'armurerie est un LIEU. Un voile translucide y
          laissait voir des bêtes qui respirent derrière un râtelier, alors
          qu'au hub il n'y a pas de combat. */}
      <mesh position={[0, 0, Z_PLAN - 0.5]}>
        <planeGeometry args={[40, 24]} />
        <meshBasicMaterial color="#0b0c10" />
      </mesh>

      {/* LES CASES VIDES DE LA RÉSERVE : une grille de places, pas une liste. */}
      {Array.from({ length: casesVides }, (_, i) => (
        <CaseVide
          key={`vide-${i}`}
          nom=""
          position={placeReserve(hub.reserve.length + i, size.height, size.width)}
          taille={REDUIT}
          accent={TEINTE.reserve}
        />
      ))}

      {/* LES SLOTS DU CHARGEMENT, vides : ils ont la forme de ce qu'ils
          attendent, et ils le DISENT — sans leur nom, ce n'est qu'un pointillé
          muet. Une arme à deux mains masque le second slot au lieu de le
          barrer : *un slot qui reste rempli mais inutilisable mentirait sur ce
          qu'on emporte.* */}
      {hub.chargement.mains[0] === null && (
        <CaseVide nom={ATTEND.main!} position={places.mains[0]} taille={1} />
      )}
      {!aDeuxMains && hub.chargement.mains[1] === null && (
        <CaseVide nom={ATTEND.main!} position={places.mains[1]} taille={1} />
      )}
      {hub.chargement.armure === null && (
        <CaseVide nom={ATTEND.armure!} position={places.armure} taille={1} />
      )}
      {Array.from({ length: CAPACITE_PILE - hub.chargement.pile.length }, (_, i) => (
        <CaseVide
          key={`pile-${i}`}
          nom=""
          position={places.pile[hub.chargement.pile.length + i] ?? places.pile[0]!}
          taille={PILE}
          accent={TEINTE.pile}
        />
      ))}

      {/* LA CASE D'OÙ L'ON TIENT LA PIÈCE RESTE VISIBLE, en pointillé, et elle
          DIT CE QU'ELLE ATTEND. Les cases vides se déduisent du chargement,
          or la pièce y est encore tant qu'on ne l'a pas lâchée : sa place
          devenait donc un trou noir le temps du geste. Keko : « quand je drag
          un objet depuis l'équipement, le slot dont il provient n'apparaît
          plus ». *Un emplacement qu'on ne voit plus est un emplacement qu'on
          ne peut plus viser pour y revenir* — et c'était déjà la règle en 2D,
          où un pointillé muet avait valu la même remarque. */}
      {portee !== null && doigt !== null && (
        <CaseVide
          nom={ATTEND[portee.slot.ou] ?? ''}
          position={portee.position}
          taille={portee.taille}
          accent={TEINTE[portee.slot.ou]}
        />
      )}

      {/* LA PIÈCE TENUE NE CHANGE JAMAIS D'INSTANCE, et c'est tout le sujet.
          Elle a d'abord été DÉMONTÉE de la grille le temps du geste, une
          seconde carte suivant le doigt à côté. Au lâcher, il existe un rendu
          où la carte est relâchée mais où le chargement n'a pas encore
          changé : elle se remontait donc dans le râtelier, puis glissait vers
          le slot. Keko : « au moment de drop elle repart dans le stash puis
          glisse vers le slot au lieu de partir de l'endroit où elle est
          droppée ».

          Une seule carte, du râtelier au doigt puis au slot : l'amortissement
          de `Carte3D` fait l'atterrissage, et il part forcément d'où on a
          lâché puisque c'est là qu'elle est. *Deux instances pour un seul
          objet, c'est un saut de position à chaque relais.*

          Conséquence heureuse : un dépôt REFUSÉ la ramène à sa case au lieu de
          l'y téléporter. Et une pièce prise au maintien sans être bougée reste
          à sa place — elle n'a pas encore quitté sa case. */}
      {objets.map((t, i) => {
        const suitLeDoigt = i === tenue && doigt !== null
        return (
          <Carte3D
            key={t.objet.id}
            carte={pieceAPeindre(t.objet)}
            position={suitLeDoigt ? [doigt.x, doigt.y, Z_TENUE] : t.position}
            rotation={[0, 0, 0]}
            taille={suitLeDoigt ? tailleTenue : t.taille}
            ombre={false}
            ressort={suitLeDoigt ? 22 : 16}
            engagee={suitLeDoigt && surUnSlot}
            onPeinte={onPeinte}
            onPointerDown={prendre(i)}
          />
        )
      })}

      <Bouton3D
        texte="Descendre"
        ton="or"
        position={[0, -demiHaut + 0.5, Z_PLAN]}
        eteint={tenue !== null || !peutDescendre(hub.chargement)}
        onCliquer={onDescendre}
      />
    </group>
  )
}

/** Ce que le chargement donnera : sa taille, et ce qui frappe dedans. */
export function compteDuDeck(hub: Hub): { total: number; frappent: number } {
  const pieces = [
    ...hub.chargement.mains.filter((a) => a !== null),
    ...(hub.chargement.armure === null ? [] : [hub.chargement.armure]),
  ]
  let total = hub.chargement.pile.length
  let frappent = 0
  for (const piece of pieces) {
    for (const { modele, nombre } of piece.set) {
      total += nombre
      // Les deux verbes comptent : frapper une cible, ou frapper tout le rang.
      const tous = modele.effets?.some((e) => e.type === 'degatsTous') ?? false
      if (modele.degats > 0 || tous) frappent += nombre
    }
  }
  return { total, frappent }
}

export { estConsommable }

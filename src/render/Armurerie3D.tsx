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
 * n'y a pas de combat à montrer. *Ce fond est désormais du HTML*
 * (`PageArmurerie`), sous le canvas : un plan opaque dessiné ICI aurait caché
 * les cadres, qui vivent derrière lui.
 *
 * **Le COFFRE est une grille de cartes réduites, le chargement est à la
 * taille de la main** : on cherche dans le coffre, on lit ce qu'on emporte tel
 * qu'on le portera. Et le coffre montre ses cases vides — c'est une grille de
 * places, pas une liste d'objets.
 *
 * **LE COFFRE A DES ONGLETS, ET LES TRÉSORS Y SONT.** Keko : « le stash devrait
 * avoir des onglets : tout / armes / armures / consommables / trésors — oui,
 * les trésors sont maintenant ici même s'ils ne peuvent pas être équipés ».
 * *Un trésor rentré ne repart jamais* : il se consulte, il ne se glisse pas, et
 * c'est exactement ce que dit un objet qu'aucun slot n'accepte.
 *
 * **Le nombre de lignes suit la hauteur de l'écran** (`armurerie-plan.ts`) : la
 * grille remplit son cadre au lieu de laisser un vide sous elle, et ce qui
 * dépasse se défile.
 */
import { useEffect, useMemo } from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { Carte3D } from './Carte3D.tsx'
import { Bouton3D } from './Bouton3D.tsx'
import { Z_TENUE } from './Main3D.tsx'
import { useGesteCarte } from './geste-carte.ts'
import { pieceAPeindre } from './combat-3d.ts'
import { textureSlot } from './texture-carte.ts'
import type { Objet } from '../logic/armes.ts'
import { estConsommable } from '../logic/armes.ts'
import type { Carte } from '../logic/combat.ts'
import type { Hub, Slot } from '../logic/hub.ts'
import { CAPACITE_PILE, accepteDepuis, deuxMains, peutDescendre } from '../logic/hub.ts'
import type { Onglet } from './armurerie-plan.ts'
import type { PlanArmurerie } from './armurerie-plan.ts'
import { contenuDuCoffre, placeCase, planArmurerie } from './armurerie-plan.ts'
import { aPeindre } from './combat-3d.ts'

/**
 * LA TAILLE QU'UNE PIÈCE AURA UNE FOIS POSÉE LÀ.
 *
 * Le chargement se lit à la taille de la main, la réserve et la pile en
 * réduit. C'est cette valeur que prend la pièce tenue quand elle survole un
 * slot qui l'accepte : *ce qu'on montre pendant le geste est ce qu'on aura
 * après.*
 */
function tailleDuSlot(slot: Slot, plan: PlanArmurerie): number {
  if (slot.ou === 'pile') return plan.taillePile
  return plan.tailleCharge
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
  /** Ce que le coffre montre : l'onglet choisi, et la première ligne visible. */
  onglet: Onglet
  defilement: number
  /** Un objet a été glissé d'un endroit à un autre. */
  onDeplacer?: (source: Slot, cible: Slot, id: string) => void
  onRegarder?: (objet: Objet) => void
  /** Un trésor se REGARDE et ne se glisse pas : il n'a aucun slot. */
  onRegarderTresor?: (tresor: Carte) => void
  onDescendre?: () => void
  onSaisie?: (tenue: boolean) => void
  onPeinte?: () => void
}

export function Armurerie3D({
  hub,
  onglet,
  defilement,
  onDeplacer,
  onRegarder,
  onRegarderTresor,
  onDescendre,
  onSaisie,
  onPeinte,
}: Props): React.JSX.Element {
  const { size } = useThree()
  const aDeuxMains = deuxMains(hub.chargement)
  const plan = planArmurerie(size.height, size.width, aDeuxMains)
  const cases = plan.colonnes * plan.lignes

  /**
   * CE QUE L'ONGLET MONTRE.
   *
   * *Le coffre est ce qu'on POSSÈDE, pas ce qu'on peut porter* : les trésors y
   * tiennent leur place bien qu'aucun slot ne les prenne. Ils viennent en queue
   * de l'onglet « Tout » — on fouille un coffre pour s'équiper, donc ce qui
   * s'équipe se lit d'abord.
   */
  const contenu = useMemo(() => contenuDuCoffre(hub, onglet), [hub, onglet])

  const total = contenu.pieces.length + contenu.tresors.length
  /** La première case visible : le défilement compte en LIGNES, pas en pixels. */
  const depart = defilement * plan.colonnes

  /**
   * TOUT CE QUI SE MANIPULE, À PLAT ET DANS UN SEUL ORDRE.
   *
   * Le geste ne connaît qu'un index ; c'est cette liste qui dit d'où vient la
   * pièce. *Un seul tableau plutôt qu'un cas par contenant* — c'est la même
   * raison qui fait du modèle un `Lieu` dans les règles.
   *
   * **Seul ce qui est À L'ÉCRAN y entre** : la grille est une fenêtre sur le
   * coffre, pas la liste entière. Une carte hors de la fenêtre n'est pas
   * dessinée ailleurs, elle n'est pas dessinée du tout.
   */
  const objets: {
    objet: Objet | null
    tresor: Carte | null
    id: string
    slot: Slot
    position: [number, number, number]
    taille: number
  }[] = [
    ...contenu.pieces.flatMap((objet, i) => {
      const rang = i - depart
      if (rang < 0 || rang >= cases) return []
      return [
        {
          objet,
          tresor: null,
          id: objet.id,
          slot: { ou: 'reserve' } as Slot,
          position: placeCase(plan, rang),
          taille: plan.tailleCharge,
        },
      ]
    }),
    ...contenu.tresors.flatMap((tresor, i) => {
      const rang = contenu.pieces.length + i - depart
      if (rang < 0 || rang >= cases) return []
      return [
        {
          objet: null,
          tresor,
          id: tresor.id,
          slot: { ou: 'reserve' } as Slot,
          position: placeCase(plan, rang),
          taille: plan.tailleCharge,
        },
      ]
    }),
    ...hub.chargement.mains.flatMap((arme, rang) =>
      arme === null
        ? []
        : [
            {
              objet: arme as Objet,
              tresor: null,
              id: arme.id,
              slot: { ou: 'main', rang } as Slot,
              position: plan.mains[rang as 0 | 1],
              taille: plan.tailleCharge,
            },
          ],
    ),
    ...(hub.chargement.armure === null
      ? []
      : [
          {
            objet: hub.chargement.armure as Objet,
            tresor: null,
            id: hub.chargement.armure.id,
            slot: { ou: 'armure' } as Slot,
            position: plan.armure,
            taille: plan.tailleCharge,
          },
        ]),
    ...hub.chargement.pile.map((objet, i) => ({
      objet: objet as Objet,
      tresor: null,
      id: objet.id,
      slot: { ou: 'pile' } as Slot,
      position: plan.pile[i] ?? plan.pile[0]!,
      taille: plan.taillePile,
    })),
  ]

  /**
   * Quel slot se trouve sous ce point. Le coffre est tout le flanc gauche.
   *
   * **LES ZONES SUIVENT LA TAILLE DES PIÈCES**, elles ne sont pas écrites à la
   * main : sur un téléphone, où le chargement se réduit, des zones fixes se
   * recouvraient les unes les autres — et *une zone plus grande que son slot
   * vole le dépôt à sa voisine.*
   */
  const slotSous = (point: THREE.Vector3): Slot | null => {
    const t = plan.tailleCharge
    const pres = (p: [number, number, number], l: number, h: number): boolean =>
      Math.abs(point.x - p[0]) < l && Math.abs(point.y - p[1]) < h
    // Une arme à deux mains se pose dans N'IMPORTE QUELLE main : les deux
    // zones restent sensibles, c'est la règle qui décide où elle atterrit.
    if (pres(plan.mains[0], t * 0.54, t * 0.74)) return { ou: 'main', rang: 0 }
    if (pres(plan.mains[1], t * 0.54, t * 0.74)) return { ou: 'main', rang: 1 }
    if (pres(plan.armure, t * 0.54, t * 0.74)) return { ou: 'armure' }
    // LA PILE EST UNE SEULE ZONE POUR SES QUATRE CASES : l'ordre n'y a aucun
    // effet, donc une case précise ne veut rien dire — et une grande zone se
    // vise mieux au doigt qu'un quart de carte. Elle tient toute la rangée du
    // bas, donc elle se déduit de ses extrémités.
    const gauche = Math.min(...plan.pile.map((p) => p[0]))
    const droite = Math.max(...plan.pile.map((p) => p[0]))
    const bas = Math.min(...plan.pile.map((p) => p[1]))
    const haut = Math.max(...plan.pile.map((p) => p[1]))
    const milieu: [number, number, number] = [(gauche + droite) / 2, (bas + haut) / 2, 0]
    const demiX = (droite - gauche) / 2 + plan.taillePile * 0.56
    const demiY = (haut - bas) / 2 + plan.taillePile * 1.4 * 0.56
    if (pres(milieu, demiX, demiY)) return { ou: 'pile' }
    // Hors du cadre de l'équipement, c'est le coffre : on y repose.
    if (point.x < plan.equipement.x - plan.equipement.l / 2) return { ou: 'reserve' }
    return null
  }

  const { tenue, doigt, prendre } = useGesteCarte({
    z: Z_TENUE,
    onTaper: (i) => {
      const t = objets[i]
      if (t === undefined) return
      if (t.tresor !== null) onRegarderTresor?.(t.tresor)
      else if (t.objet !== null) onRegarder?.(t.objet)
    },
    onLacher: (i, point) => {
      const t = objets[i]
      const cible = slotSous(point)
      // UN TRÉSOR NE SE DÉPLACE PAS : aucun slot ne le prend, et le coffre ne
      // le rend jamais. *Il se consulte, c'est tout ce qu'il fait ici.*
      if (t === undefined || t.objet === null || cible === null) return
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
   */
  const sousLeDoigt = doigt === null ? null : slotSous(doigt)
  const accueille =
    portee !== null &&
    portee.objet !== null &&
    sousLeDoigt !== null &&
    accepteDepuis(hub, portee.slot, sousLeDoigt, portee.objet.id)
  const tailleTenue = accueille && sousLeDoigt !== null ? tailleDuSlot(sousLeDoigt, plan) : plan.tailleCharge

  /**
   * ELLE NE FRÉMIT QU'AU-DESSUS D'UN SLOT DU CHARGEMENT QUI LA PREND.
   *
   * Le frémissement dit « lâche et ça part », donc il doit être vrai — il
   * frémissait pendant tout le geste, y compris en plein vide où lâcher ne
   * fait rien. Demandé par Keko. *Un repère permanent ne repère plus rien.*
   */
  const surUnSlot = accueille && sousLeDoigt !== null && sousLeDoigt.ou !== 'reserve'

  /** Les cases vides du coffre : la grille est pleine, qu'il y ait de quoi ou non. */
  const montrees = Math.max(0, Math.min(cases, total - depart))
  const vides = cases - montrees

  return (
    <group>
      {/* LES CASES VIDES DU COFFRE : une grille de places, pas une liste. */}
      {Array.from({ length: vides }, (_, i) => (
        <CaseVide
          key={`vide-${i}`}
          nom=""
          position={placeCase(plan, montrees + i)}
          taille={plan.tailleCharge}
          accent={TEINTE.reserve}
        />
      ))}

      {/* LES SLOTS DU CHARGEMENT, vides : ils ont la forme de ce qu'ils
          attendent, et ils le DISENT — sans leur nom, ce n'est qu'un pointillé
          muet. Une arme à deux mains masque le second slot au lieu de le
          barrer : *un slot qui reste rempli mais inutilisable mentirait sur ce
          qu'on emporte.* */}
      {hub.chargement.mains[0] === null && (
        <CaseVide nom={ATTEND.main!} position={plan.mains[0]} taille={plan.tailleCharge} />
      )}
      {!aDeuxMains && hub.chargement.mains[1] === null && (
        <CaseVide nom={ATTEND.main!} position={plan.mains[1]} taille={plan.tailleCharge} />
      )}
      {hub.chargement.armure === null && (
        <CaseVide nom={ATTEND.armure!} position={plan.armure} taille={plan.tailleCharge} />
      )}
      {Array.from({ length: CAPACITE_PILE - hub.chargement.pile.length }, (_, i) => (
        <CaseVide
          key={`pile-${i}`}
          nom=""
          position={plan.pile[hub.chargement.pile.length + i] ?? plan.pile[0]!}
          taille={plan.taillePile}
          accent={TEINTE.pile}
        />
      ))}

      {/* LA CASE D'OÙ L'ON TIENT LA PIÈCE RESTE VISIBLE, en pointillé, et elle
          DIT CE QU'ELLE ATTEND. Les cases vides se déduisent du chargement, or
          la pièce y est encore tant qu'on ne l'a pas lâchée : sa place
          devenait donc un trou noir le temps du geste. *Un emplacement qu'on
          ne voit plus est un emplacement qu'on ne peut plus viser pour y
          revenir.* */}
      {portee !== null && doigt !== null && (
        <CaseVide
          nom={ATTEND[portee.slot.ou] ?? ''}
          position={portee.position}
          taille={portee.taille}
          accent={TEINTE[portee.slot.ou]}
        />
      )}

      {/* LA PIÈCE TENUE NE CHANGE JAMAIS D'INSTANCE, et c'est tout le sujet.
          Une seule carte, du coffre au doigt puis au slot : l'amortissement de
          `Carte3D` fait l'atterrissage, et il part forcément d'où on a lâché
          puisque c'est là qu'elle est. *Deux instances pour un seul objet,
          c'est un saut de position à chaque relais.* */}
      {objets.map((t, i) => {
        const suitLeDoigt = i === tenue && doigt !== null
        return (
          <Carte3D
            key={t.id}
            carte={t.tresor === null ? pieceAPeindre(t.objet!) : aPeindre(t.tresor)}
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
        position={plan.bouton}
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

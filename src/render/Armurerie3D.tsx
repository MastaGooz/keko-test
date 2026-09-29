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
import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { Carte3D, DUREE_CULBUTE } from './Carte3D.tsx'
import { DUREE_ONDE } from './onde.tsx'
import { Bouton3D } from './Bouton3D.tsx'
import { Z_TENUE } from './Main3D.tsx'
import { useGesteCarte } from './geste-carte.ts'
import { pieceAPeindre } from './combat-3d.ts'
import { DEBORD_SLOT, textureSlot, textureSlotVif } from './texture-carte.ts'
import { SON_EQUIPER, SON_POSER, SON_TOURNER, jouerSon } from './sons.ts'
import type { Objet } from '../logic/armes.ts'
import { estConsommable } from '../logic/armes.ts'
import type { Carte } from '../logic/combat.ts'
import type { Hub, Slot } from '../logic/hub.ts'
import { accepteDepuis, deckEmporte, deuxMains, estTresor, peutDescendre } from '../logic/hub.ts'
import type { Onglet } from './armurerie-plan.ts'
import { TEXTE_DECK, TEXTE_DESCENDRE, TEXTE_FORTUNE } from './armurerie-plan.ts'
import type { PlanArmurerie } from './armurerie-plan.ts'
import {
  caseSousLePoint,
  contenuDuCoffre,
  pixelsParUnite,
  placeCase,
  planArmurerie,
} from './armurerie-plan.ts'
import { tailleDuCompte } from './Carte3D.tsx'
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
  if (slot.ou === 'reserve') return plan.tailleCoffre
  return plan.tailleCharge
}

/**
 * TOUS LES SLOTS QUI PRENNENT CE QU'ON TIENT S'ALLUMENT — pas seulement celui
 * sous le doigt.
 *
 * C'est la règle de l'armurerie 2D (`accueille`), qui n'avait pas été portée :
 * *ce qui dit où l'on peut aller doit se voir AVANT d'y aller.* En 3D la pièce
 * tenue grandissait bien au-dessus d'un slot compatible, mais il fallait déjà
 * l'y avoir amenée — Keko : « il faudrait que quand je drag un truc, le slot
 * d'équipement qui correspond se mette en surbrillance ».
 *
 * C'est SON PROPRE POINTILLÉ qui s'allume, en or, et rien n'est ajouté autour :
 * un contour lumineux posé derrière débordait de la case — Keko : « ça dépasse
 * des pointillés et le contour est très épais ». *Une case a déjà sa forme ; on
 * l'allume, on ne la double pas.*
 *
 * Il se pose DEVANT la carte : un slot occupé s'échange, donc il s'allume comme
 * les autres, et sa carte masquerait ce qu'on glisserait dessous.
 */
function SlotAccueille({
  position,
  taille,
}: {
  position: [number, number, number]
  taille: number
}): React.JSX.Element {
  const materiau = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        map: textureSlotVif(),
        color: '#ffc774',
        transparent: true,
        opacity: 0.8,
        toneMapped: false,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [],
  )
  // Elle RESPIRE, lentement : une lueur fixe se lit comme un cadre peint, deux
  // battements rapides comme une alerte. Même horloge que le contour des
  // cartes.
  useFrame((etat) => {
    materiau.opacity = 0.72 + Math.sin(etat.clock.elapsedTime * 3.4) * 0.22
  })
  return (
    <mesh
      position={[position[0], position[1], position[2] + 0.03]}
      raycast={() => null}
      material={materiau}
    >
      {/* SON PLAN DÉBORDE d'autant que sa texture : le tracé tombe alors
          exactement sur le bord de la carte, et la lueur a la place de
          s'éteindre avant l'arête. */}
      <planeGeometry args={[taille * (1 + DEBORD_SLOT * 2), taille * 1.4 + taille * DEBORD_SLOT * 2]} />
    </mesh>
  )
}

/** La teinte d'une case vide : le râtelier et la pile sont plus discrets. */
const TEINTE: Record<string, string> = { reserve: '#3c3a35', pile: '#4a4a40' }

type CaseProps = {
  nom: string
  position: [number, number, number]
  taille: number
  accent?: string
  /** De quoi la couper au bord du meuble, quand le coffre défile. */
  clipper?: THREE.Plane[] | null
}

function CaseVide({
  nom,
  position,
  taille,
  accent = '#6f6a5e',
  clipper = null,
}: CaseProps): React.JSX.Element {
  const materiau = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        map: textureSlot(nom, accent),
        transparent: true,
        depthWrite: false,
        toneMapped: false,
        clippingPlanes: clipper,
      }),
    [nom, accent, clipper],
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
  /** Deux objets du coffre changent de place. */
  onEchanger?: (idsA: string[], idsB: string[]) => void
  /** Poser sur une case VIDE du coffre : l'objet — ou la pile — va au bout. */
  onRanger?: (ids: string[]) => void
  onRegarder?: (objet: Objet) => void
  /** Un trésor se REGARDE et ne se glisse pas : il n'a aucun slot. */
  onRegarderTresor?: (tresor: Carte) => void
  onDescendre?: () => void
  /** Consulter le deck que le chargement produit. */
  onVoirDeck?: () => void
  /**
   * L'ARMURIER DONNE UN CHARGEMENT DE FORTUNE. *C'est une fabrication, pas une
   * fouille* : les exemplaires sont neufs, ils ne sortent pas du coffre.
   */
  onFourbir?: () => void
  /**
   * Une pièce vient de SE FIXER dans un slot — pas d'être lâchée.
   *
   * *L'état du jeu change au lâcher, la mise en scène finit bien après* : ce
   * qui doit se voir à l'arrivée a besoin de ce deuxième instant, et la carte
   * est la seule à le connaître.
   */
  onEquipee?: () => void
  /**
   * Une pièce vient d'être lâchée dans un slot, et le dépôt est ACCEPTÉ.
   *
   * *Un dépôt refusé ne compte pas* : sans ça, l'écran attendrait une arrivée
   * qui ne viendrait jamais, et les chiffres resteraient figés.
   */
  onPoseCommence?: () => void
  onSaisie?: (tenue: boolean) => void
  /**
   * UNE CARTE EST REGARDÉE DE PRÈS, donc l'armurerie est sous le voile du
   * zoom. Ses cartes cessent de répondre au curseur : *ce qu'on ne regarde
   * plus n'a pas à bouger*, et le `stopPropagation` du voile ne suffit pas —
   * il ne joue qu'au prochain mouvement, or on ouvre le zoom en CLIQUANT sur
   * une carte, donc le curseur est déjà dessus et elle resterait penchée.
   */
  sousLeZoom?: boolean
  onPeinte?: () => void
}

/**
 * LA CARTE DE DESSOUS D'UNE PILE, quand il y en a plus d'une.
 *
 * Elle porte l'identifiant du DEUXIÈME exemplaire — donc au lâcher, quand le
 * premier part s'équiper, elle devient le dessus de la pile sans changer
 * d'instance : rien ne saute. *Deux instances pour un seul objet, c'est un
 * saut de position à chaque relais.* Son dessin est celui du représentant,
 * puisque deux exemplaires empilés sont par définition la même carte.
 */
function doublureDe<T extends { nombre: number; ids: string[] }>(
  pile: T,
  objet: Objet | null,
  tresor: Carte | null,
  position: [number, number, number],
  taille: number,
  rang: number,
): {
  objet: Objet | null
  tresor: Carte | null
  id: string
  slot: Slot
  position: [number, number, number]
  taille: number
  rang?: number
  pile?: number
  ids?: string[]
  doublure?: boolean
  chef?: string
}[] {
  const dessous = pile.ids[1]
  if (pile.nombre < 2 || dessous === undefined) return []
  return [
    {
      objet,
      tresor,
      id: dessous,
      slot: { ou: 'reserve' } as Slot,
      // DERRIÈRE, ET DE PLUS D'UNE ÉPAISSEUR DE CARTE : sans cet écart les
      // deux volumes s'interpénètrent — une carte a du corps, pas seulement
      // une face. Ça reste invisible en perspective (0,4 % de la distance).
      position: [position[0], position[1], position[2] - 0.02],
      taille,
      rang,
      pile: pile.nombre - 1,
      ids: pile.ids.slice(1),
      doublure: true,
      chef: pile.ids[0],
    },
  ]
}

export function Armurerie3D({
  hub,
  onglet,
  defilement,
  onDeplacer,
  onEchanger,
  onRanger,
  onRegarder,
  onRegarderTresor,
  onDescendre,
  onVoirDeck,
  onFourbir,
  onEquipee,
  onPoseCommence,
  onSaisie,
  sousLeZoom = false,
  onPeinte,
}: Props): React.JSX.Element {
  const { size } = useThree()
  const aDeuxMains = deuxMains(hub.chargement)
  const plan = planArmurerie(size.height, size.width, aDeuxMains)
  // LE DISQUE DU COMPTE SE MESURE EN REM, pas en part de carte : c'est un
  // repère d'interface, et une case du coffre fait trois fois plus de pixels
  // sur un écran de PC que sur un téléphone.
  const tailleCompte = tailleDuCompte(plan.tailleCoffre * pixelsParUnite(size.height))

  /**
   * LE COFFRE DÉFILE EN CONTINU, PAS PAR LIGNES.
   *
   * `defilement` compte toujours en lignes, mais il est FRACTIONNAIRE : sa
   * partie entière dit la première ligne tirée du coffre, son reste de combien
   * la grille est remontée. On tire donc **une rangée de plus** que ce qui
   * tient, et les deux rangées des bords sont à moitié sorties du meuble.
   */
  const ligneBase = Math.floor(defilement)
  const reste = (defilement - ligneBase) * plan.pasY
  const cases = plan.colonnes * (plan.lignes + 1)

  /**
   * CE QUI SORT DU MEUBLE EST COUPÉ, et c'est ce qui rend le continu possible :
   * sans découpe, les rangées des bords déborderaient sur les onglets et sous
   * le cadre. Les plans sont en espace MONDE — la scène de l'armurerie n'a
   * aucune transformation, donc ils se lisent directement sur le plan.
   */
  const { gl } = useThree()
  useEffect(() => {
    gl.localClippingEnabled = true
  }, [gl])
  const clipper = useMemo(
    () => [
      new THREE.Plane(new THREE.Vector3(0, -1, 0), plan.grille.y + plan.grille.h / 2),
      new THREE.Plane(new THREE.Vector3(0, 1, 0), -(plan.grille.y - plan.grille.h / 2)),
    ],
    [plan.grille.y, plan.grille.h],
  )

  /**
   * CE QUE L'ONGLET MONTRE.
   *
   * *Le coffre est ce qu'on POSSÈDE, pas ce qu'on peut porter* : les trésors y
   * tiennent leur place bien qu'aucun slot ne les prenne. Ils viennent en queue
   * de l'onglet « Tout » — on fouille un coffre pour s'équiper, donc ce qui
   * s'équipe se lit d'abord.
   */
  /**
   * UN CURSEUR PAR PILE, partagé par la carte du dessus et son épaisseur.
   *
   * Il vit dans une `ref` et pas dans l'état : il change à chaque image, comme
   * le geste et la projection des étiquettes. La clé est l'identifiant de la
   * carte du DESSUS, donc les deux se retrouvent sans rien se dire.
   */
  const curseurs = useRef(new Map<string, { dessus: boolean; x: number; y: number }>())
  const curseurDe = (id: string): { dessus: boolean; x: number; y: number } => {
    const deja = curseurs.current.get(id)
    if (deja !== undefined) return deja
    const neuf = { dessus: false, x: 0, y: 0 }
    curseurs.current.set(id, neuf)
    return neuf
  }

  const contenu = useMemo(() => contenuDuCoffre(hub, onglet), [hub, onglet])

  const total = contenu.length
  /** La première case tirée du coffre : la ligne entière, le reste est visuel. */
  const depart = ligneBase * plan.colonnes

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
    /** Sa case dans la grille visible, pour les seuls objets du coffre. */
    rang?: number
    /** Combien d'exemplaires identiques la case porte. 1 hors du coffre. */
    pile?: number
    /** Leurs identifiants : ranger déplace la pile entière. */
    ids?: string[]
    /**
     * LA CARTE DE DESSOUS D'UNE PILE : celle qu'on voit quand on soulève la
     * première. Elle ne répond pas au doigt et n'est jamais la cible d'un
     * rangement — *c'est une épaisseur, pas un objet de plus.*
     */
    doublure?: boolean
    /** Pour une doublure : l'identifiant de la carte posée dessus. */
    chef?: string
  }[] = [
    /**
     * LE COFFRE EST UNE SEULE LISTE, pièces et trésors mêlés — donc une seule
     * boucle. *Deux boucles concaténées donnaient un ordre que le joueur ne
     * pouvait pas défaire* : les trésors venaient forcément après.
     */
    ...contenu.flatMap((pile, i) => {
      const rang = i - depart
      if (rang < 0 || rang >= cases) return []
      const ou = placeCase(plan, rang, reste)
      const tresor = estTresor(pile.objet) ? pile.objet : null
      const objet = tresor === null ? (pile.objet as Objet) : null
      return [
        {
          objet,
          tresor,
          id: pile.objet.id,
          slot: { ou: 'reserve' } as Slot,
          position: ou,
          taille: plan.tailleCoffre,
          rang,
          pile: pile.nombre,
          ids: pile.ids,
        },
        ...doublureDe(pile, objet, tresor, ou, plan.tailleCoffre, rang),
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
    // LA PILE EST POSITIONNELLE : chaque consommable est À SA CASE, et les
    // trous restent des trous. C'est ce qui permet de décider où l'on pose.
    ...hub.chargement.pile.flatMap((objet, i) =>
      objet === null
        ? []
        : [
            {
              objet: objet as Objet,
              tresor: null,
              id: objet.id,
              slot: { ou: 'pile', rang: i } as Slot,
              position: plan.pile[i] ?? plan.pile[0]!,
              taille: plan.taillePile,
            },
          ],
    ),
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
    // LE SECOND SLOT N'EXISTE PLUS QUAND UNE ARME PREND LES DEUX MAINS, et sa
    // ZONE non plus. Il est masqué au rendu, mais sa place restait sensible —
    // or le chargement se resserre alors sur deux cases, donc cette place est
    // devenue celle de l'ARMURE. On y déposait une armure, la zone répondait
    // « main », la règle refusait : le slot s'allumait et le dépôt ne faisait
    // rien (Keko). *Une zone de dépôt survit à la case qu'elle recouvre si on
    // ne la retire pas avec elle.*
    if (!aDeuxMains && pres(plan.mains[1], t * 0.54, t * 0.74)) return { ou: 'main', rang: 1 }
    if (pres(plan.armure, t * 0.54, t * 0.74)) return { ou: 'armure' }
    // LA PILE EST UNE SEULE ZONE POUR TOUTES SES CASES : l'ordre n'y a aucun
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
    if (pres(milieu, demiX, demiY)) {
      // DANS LA PILE, ON VISE UNE CASE QUAND ON EN VISE VRAIMENT UNE. La zone
      // reste large — *une grande zone se vise mieux au doigt qu'un quart de
      // carte* — mais si le point tombe DANS une case, on le dit : c'est ce
      // qui permet de remplacer une potion par une autre quand la pile est
      // pleine, et de ranger deux cases entre elles.
      const rang = plan.pile.findIndex((p) => Math.abs(point.x - p[0]) < plan.taillePile * 0.56)
      return rang >= 0 ? { ou: 'pile', rang } : { ou: 'pile' }
    }
    // Hors du cadre de l'équipement, c'est le coffre : on y repose.
    if (point.x < plan.equipement.x - plan.equipement.l / 2) return { ou: 'reserve' }
    return null
  }

  /**
   * LA PIÈCE QU'ON VIENT DE POSER DANS UN SLOT, et l'instant du lâcher.
   *
   * Elle vit dans l'ÉTAT et non dans le DOM, comme tout ce qui doit survivre
   * à un rendu : le chargement change à l'instant même où l'on pose, donc une
   * marque posée sur la scène serait balayée par le rendu qui suit.
   */
  const [culbute, setCulbute] = useState<{ id: string; n: number } | null>(null)
  /**
   * LA PIÈCE QUI N'EST PAS ENCORE ARRIVÉE, et dont la case doit rester
   * dessinée.
   *
   * Les cases vides se déduisent du chargement, donc elles disparaissaient à
   * l'instant du lâcher — pendant que la carte tournait encore en l'air ou
   * glissait vers sa place. Keko : « les pointillés qui dessinent le slot
   * disparaissent déjà quand l'animation de spin commence ; il faudrait qu'ils
   * disparaissent au moment où la carte se fixe ».
   *
   * *Une case n'est occupée que lorsque quelque chose y est posé* — l'état du
   * jeu, lui, a changé bien avant.
   */
  const [enVol, setEnVol] = useState<string | null>(null)

  /**
   * UN GARDE-FOU : la case en attente ne peut pas rester là pour toujours.
   *
   * C'est la carte qui annonce son arrivée, et elle le fait sans faute — mais
   * si jamais elle était démontée en plein vol (un changement d'onglet, un
   * redimensionnement), personne ne le dirait plus. *Un dessin qui dépend d'un
   * message doit savoir s'effacer si le message ne vient pas.*
   */
  useEffect(() => {
    if (enVol === null) return
    const minuteur = window.setTimeout(() => setEnVol(null), 2000)
    return () => window.clearTimeout(minuteur)
  }, [enVol])

  // ON LA REPOSE UNE FOIS LA SCÈNE JOUÉE : sans ça elle rejouerait au moindre
  // remontage, et la carte culbuterait sans qu'on y ait touché.
  useEffect(() => {
    if (culbute === null) return
    const minuteur = window.setTimeout(
      () => setCulbute(null),
      (DUREE_CULBUTE + DUREE_ONDE + 0.3) * 1000,
    )
    return () => window.clearTimeout(minuteur)
  }, [culbute])

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
      /**
       * DANS LE COFFRE, ON RANGE : lâcher sur une case OCCUPÉE échange les deux
       * objets au lieu de renvoyer le nôtre à la fin de la liste. C'est la
       * seule chose que « réorganiser » veut dire ici, et ça ne concerne que le
       * coffre — un slot du chargement a déjà sa règle d'échange, écrite dans
       * `deplacerPiece`.
       *
       * *On ne range qu'entre objets DU COFFRE* : une pièce qu'on retire d'un
       * slot rentre au râtelier par la porte ordinaire, elle ne prend la place
       * de personne.
       */
      /**
       * **UN TRÉSOR SE RANGE COMME LE RESTE.** Keko : « dans le coffre, je ne
       * peux pas réorganiser les trésors comme le reste des cartes ». La règle
       * savait déjà le faire — `echangerDansCoffre` essaie les deux listes —
       * mais le rendu exigeait une PIÈCE pour même y penser. *Un trésor ne
       * s'équipe pas ; ça ne veut pas dire qu'il ne se range pas.*
       *
       * Les deux listes restent étanches : la règle refuse d'elle-même
       * d'échanger un trésor contre une pièce, puisqu'aucune des deux ne
       * contient les deux blocs.
       */
      if (cible?.ou === 'reserve' && t?.slot.ou === 'reserve') {
        const rang = caseSousLePoint(plan, point.x, point.y, reste)
        const vise = rang === null ? undefined : objets.find(
          (o) => o.slot.ou === 'reserve' && o.rang === rang && o.doublure !== true,
        )
        if (vise !== undefined && vise.id !== t.id) {
          jouerSon(SON_POSER)
          // ON DEPLACE LA PILE ENTIERE, pas son representant : les
          // doublures resteraient derriere lui et rien ne bougerait.
          onEchanger?.(t.ids ?? [t.id], vise.ids ?? [vise.id])
          return
        }
        // SUR UNE CASE VIDE, on range en fin de liste — là où la grille garde
        // ses étagères vides. Une carte seule y allait déjà par la porte
        // ordinaire ; *une PILE, non* : `deplacerPiece` n'en déplaçait qu'un
        // exemplaire, et le coffre montre une pile à la place de son premier.
        if (vise === undefined && rang !== null) {
          jouerSon(SON_POSER)
          onRanger?.(t.ids ?? [t.id])
          return
        }
      }
      // UN TRÉSOR NE SE DÉPLACE PAS : aucun slot ne le prend, et le coffre ne
      // le rend jamais. *Il se consulte, c'est tout ce qu'il fait ici.*
      if (t === undefined || t.objet === null || cible === null) return
      // LE SON DE LA POSE, et seulement si le dépôt ABOUTIT : un slot qui
      // refuse ne doit pas sonner comme un slot qui prend. On demande la règle
      // plutôt que de la recopier — la même que celle qui allume le slot.
      const pris = accepteDepuis(hub, t.slot, cible, t.objet.id)
      if (pris) {
        jouerSon(SON_POSER)
        // SA CASE RESTE DESSINÉE JUSQU'À CE QU'ELLE Y SOIT. Vrai pour un slot
        // du chargement comme pour une case du coffre : dans les deux cas la
        // carte met un moment à arriver.
        setEnVol(t.objet.id)
      }
      /**
       * ELLE CULBUTE EN S'ÉQUIPANT — donc en venant DU COFFRE, et en allant
       * dans un SLOT.
       *
       * Reposer au râtelier n'est pas un équipement, c'est un rangement ; et
       * passer d'un slot à un autre non plus — Keko : « quand on déplace un
       * objet d'un slot déjà équipé à un autre, on ne va pas déclencher
       * l'animation, pareil pour l'arme d'un slot d'arme à un autre ». *On
       * était déjà équipé de cette pièce, on ne vient pas de l'être* : le deck
       * ne bouge pas, aucune stat ne change, et une mise en scène qui se joue
       * à chaque geste cesse d'en distinguer un.
       *
       * Les deux sons et l'effet des stats suivent la culbute : ils disent le
       * même moment, ils ne peuvent pas partir sans elle.
       */
      if (pris && t.slot.ou === 'reserve' && cible.ou !== 'reserve') {
        const piece = t.objet.id
        // LE SON DE LA CULBUTE PART AVEC ELLE. Fourni par Keko : « à jouer
        // dès que la carte commence à tourner avant de se fixer » — et elle
        // tourne dès la première image, elle n'attend pas d'être montée.
        jouerSon(SON_TOURNER)
        onPoseCommence?.()
        setCulbute((c) => ({ id: piece, n: (c?.n ?? 0) + 1 }))
      }
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
  const tailleTenue =
    accueille && sousLeDoigt !== null ? tailleDuSlot(sousLeDoigt, plan) : plan.tailleCoffre

  /**
   * ELLE NE FRÉMIT QU'AU-DESSUS D'UN SLOT DU CHARGEMENT QUI LA PREND.
   *
   * Le frémissement dit « lâche et ça part », donc il doit être vrai — il
   * frémissait pendant tout le geste, y compris en plein vide où lâcher ne
   * fait rien. Demandé par Keko. *Un repère permanent ne repère plus rien.*
   */
  const surUnSlot = accueille && sousLeDoigt !== null && sousLeDoigt.ou !== 'reserve'

  /**
   * **LA DESTINATION DÉCIDE CE QU'ON EMPORTE : un exemplaire, ou LA PILE.**
   *
   * Keko : « le joueur n'a aucun moyen pour déplacer une pile entière dans le
   * coffre ». Il l'avait — `echangerDansCoffre` replace des blocs — mais rien
   * ne le lui disait. Les deux intentions sont distinctes et se lisent à la
   * destination : **vers un slot on équipe UN exemplaire, vers le coffre on
   * range LA PILE.** Un exemplaire seul n'aurait de toute façon nulle part où
   * aller : *le coffre regroupe par ce qu'il montre*, donc deux tas identiques
   * à deux endroits ne peuvent pas exister.
   *
   * **ET ÇA NE SE DIT PAS PENDANT LE GESTE.** J'avais fait s'effacer la pile
   * d'origine dès que le doigt passait au-dessus d'une case du coffre, pour
   * annoncer que le tas entier suivrait. Keko : « la pile d'origine disparaît
   * et réapparaît bizarrement quand la carte passe par-dessus d'autres cartes
   * du coffre ». *Un aperçu qui s'allume et s'éteint à chaque case traversée
   * n'annonce rien, il clignote* — et en balayant le coffre on en traverse
   * cinq.
   *
   * La règle est donc celle que Keko a dictée : **on soulève l'exemplaire du
   * dessus, la pile reste à sa place en attendant le lâcher, et c'est le
   * lâcher qui décide.** Le geste ne montre qu'une chose, et elle est vraie
   * jusqu'au bout : on tient une carte.
   */

  /**
   * LES SLOTS QUI PRENNENT CE QU'ON TIENT, tant qu'on le tient.
   *
   * Le râtelier en est exclu, comme le frémissement : c'est l'endroit d'où
   * l'on vient, et *y reposer n'est pas ce que le geste cherche.* La pile
   * s'allume case par case — c'est une seule zone de dépôt, mais ce qu'on
   * doit lire c'est la RANGÉE qui reçoit.
   */
  const candidats: { slot: Slot; position: [number, number, number]; taille: number }[] =
    portee === null || portee.objet === null
      ? []
      : [
          { slot: { ou: 'main', rang: 0 } as Slot, position: plan.mains[0] },
          ...(aDeuxMains ? [] : [{ slot: { ou: 'main', rang: 1 } as Slot, position: plan.mains[1] }]),
          { slot: { ou: 'armure' } as Slot, position: plan.armure },
          // CHAQUE CASE DE LA PILE PORTE SON RANG, et c'est ce qui manquait.
          //
          // Keko : « quand mes objets sont pleins (3/3) et que j'en drag un
          // autre depuis le coffre, les slots des objets ne s'éclairent pas ».
          // Elles étaient testées avec `{ ou: 'pile' }` NU — sans rang, la
          // règle répond « on ajoute à la pile », donc elle refuse quand elle
          // est pleine. Avec un rang, elle répond « on pose SUR CETTE CASE »,
          // et **une case occupée s'échange** : c'est la règle des mains et du
          // torse, et la pile la suit depuis qu'elle a des cases.
          //
          // *La surbrillance doit poser exactement la question que le lâcher
          // posera* — sinon elle éteint un slot qui prend, ce qui est le pire
          // des deux sens : le joueur croit que c'est refusé et n'essaie pas.
          ...plan.pile.map((position, rang) => ({ slot: { ou: 'pile', rang } as Slot, position })),
        ]
          .filter(({ slot }) => accepteDepuis(hub, portee.slot, slot, portee.objet!.id))
          .map(({ slot, position }) => ({ slot, position, taille: tailleDuSlot(slot, plan) }))

  /** Les cases vides du coffre : la grille est pleine, qu'il y ait de quoi ou non. */
  const montrees = Math.max(0, Math.min(cases, total - depart))
  const vides = cases - montrees

  /**
   * OÙ L'ONDE DOIT PARTIR : la place de la carte qu'on vient de poser. On la
   * RETIENT, parce que l'onde reste montée après coup et n'a aucune raison de
   * sauter à l'origine quand la culbute s'efface.
   */
  return (
    <group>
      {/* CE QUI PREND LA PIÈCE QU'ON TIENT S'ALLUME. */}
      {candidats.map(({ slot, position, taille }) => (
        <SlotAccueille
          key={`accueil-${slot.ou}-${'rang' in slot ? slot.rang : ''}-${position[0].toFixed(3)}`}
          position={position}
          taille={taille}
        />
      ))}

      {/* LES CASES VIDES DU COFFRE : une grille de places, pas une liste. */}
      {Array.from({ length: vides }, (_, i) => (
        <CaseVide
          key={`vide-${i}`}
          nom=""
          position={placeCase(plan, montrees + i, reste)}
          taille={plan.tailleCoffre}
          accent={TEINTE.reserve}
          clipper={clipper}
        />
      ))}

      {/* LES SLOTS DU CHARGEMENT, vides : ils ont la forme de ce qu'ils
          attendent, et c'est le NOM DE GROUPE au-dessus d'eux qui le dit —
          « Armes » coiffe les deux mains, « Armure » son slot, « Objets » la
          rangée des consommables. Le mot vivait DANS la case : il ne nommait
          rien du tout pour la pile, et deux cases voisines ne l'écrivaient pas
          à la même taille. Une arme à deux mains masque le second slot au lieu
          de le barrer : *un slot qui reste rempli mais inutilisable mentirait
          sur ce qu'on emporte.* */}
      {hub.chargement.mains[0] === null && (
        <CaseVide nom="" position={plan.mains[0]} taille={plan.tailleCharge} />
      )}
      {!aDeuxMains && hub.chargement.mains[1] === null && (
        <CaseVide nom="" position={plan.mains[1]} taille={plan.tailleCharge} />
      )}
      {hub.chargement.armure === null && (
        <CaseVide nom="" position={plan.armure} taille={plan.tailleCharge} />
      )}
      {hub.chargement.pile.flatMap((objet, i) =>
        objet !== null
          ? []
          : [
              <CaseVide
                key={`pile-${i}`}
                nom=""
                position={plan.pile[i] ?? plan.pile[0]!}
                taille={plan.taillePile}
                accent={TEINTE.pile}
              />,
            ],
      )}

      {/* LA CASE D'OÙ L'ON TIENT LA PIÈCE RESTE VISIBLE, en pointillé, et elle
          DIT CE QU'ELLE ATTEND. Les cases vides se déduisent du chargement, or
          la pièce y est encore tant qu'on ne l'a pas lâchée : sa place
          devenait donc un trou noir le temps du geste. *Un emplacement qu'on
          ne voit plus est un emplacement qu'on ne peut plus viser pour y
          revenir.*

          MAIS PAS SI LA PILE N'EST PAS VIDE : ce qu'on soulève découvre la
          carte de dessous, pas un trou — Keko : « le slot en pointillé ne doit
          pas devenir visible quand il y a encore des cartes de la pile en
          dessous ». *Un pointillé dit « il n'y a rien ici », et il y a encore
          quelque chose.* */}
      {portee !== null && doigt !== null && (portee.pile ?? 1) < 2 && (
        <CaseVide
          nom=""
          position={portee.position}
          taille={portee.taille}
          accent={TEINTE[portee.slot.ou]}
        />
      )}

      {/* LA CASE DE CE QUI N'EST PAS ENCORE ARRIVÉ. Sa place se LIT sur la
          carte en vol : au rendu, l'état du jeu l'a déjà déplacée, donc on sait
          où elle va — elle, en revanche, n'y est pas encore. */}
      {enVol !== null &&
        (() => {
          const vol = objets.find((o) => o.id === enVol)
          if (vol === undefined) return null
          return (
            <CaseVide
              nom=""
              position={vol.position}
              taille={vol.taille}
              accent={TEINTE[vol.slot.ou]}
              clipper={vol.slot.ou === 'reserve' ? clipper : null}
            />
          )
        })()}

      {/* LA PIÈCE TENUE NE CHANGE JAMAIS D'INSTANCE, et c'est tout le sujet.
          Une seule carte, du coffre au doigt puis au slot : l'amortissement de
          `Carte3D` fait l'atterrissage, et il part forcément d'où on a lâché
          puisque c'est là qu'elle est. *Deux instances pour un seul objet,
          c'est un saut de position à chaque relais.* */}
      {objets.map((t, i) => {
        const suitLeDoigt = i === tenue && doigt !== null
        /**
         * LA PILE RESTE, SEUL LE NOMBRE CHANGE. Keko : « quand je drag une
         * carte d'une pile, la pile disparaît alors qu'il faudrait qu'elle
         * reste et que seul le nombre change ». *On ne prend pas LA pile, on
         * en prend UN exemplaire* — donc ce qu'on soulève doit découvrir ce
         * qu'il y avait dessous, pas un trou.
         *
         * Le compte suit : il vit sur la carte du dessus tant qu'elle est en
         * place, et passe à la doublure — diminué d'une — dès qu'elle s'en va.
         * *Un exemplaire qu'on tient dans la main n'est plus dans la pile.*
         */
        const chefSorti =
          doigt !== null && tenue !== null && objets[tenue]?.id === (t.chef ?? t.id)
        const reste =
          t.doublure === true
            ? chefSorti
              ? t.pile
              : undefined
            : chefSorti
              ? undefined
              : t.pile
        // UNE CARTE SEULE NE SE COMPTE PAS : au coffre, « 1 » n'apprend rien.
        // Le zoom, lui, l'affiche — *on y compare des quantités.*
        const compte = reste !== undefined && reste > 1 ? reste : undefined
        return (
          <Carte3D
            key={t.id}
            carte={t.tresor === null ? pieceAPeindre(t.objet!) : aPeindre(t.tresor)}
            position={suitLeDoigt ? [doigt.x, doigt.y, Z_TENUE] : t.position}
            rotation={[0, 0, 0]}
            taille={suitLeDoigt ? tailleTenue : t.taille}
            ombre={false}
            ressort={suitLeDoigt ? 22 : 16}
            // LE COFFRE TOURNE UNE PAGE, IL NE FAIT PAS DE TRAVELLING : au
            // changement de ligne, toutes les cartes se posent d'un coup.
            // Sinon celles qui restent glissent pendant que les entrantes
            // naissent en place — Keko : « la ligne du bas change de cartes
            // instantanément tandis que les deux autres au-dessus se
            // déplacent ». Le jeton est le MÊME pour tout l'écran, y compris
            // le chargement : donné aux seules cartes du coffre, il changerait
            // au moment où l'une d'elles part dans un slot, et elle s'y
            // téléporterait au lieu d'y atterrir.
            saut={defilement}
            // ON NE COUPE PAS CE QU'ON TIENT : la carte sortie du coffre
            // traverse l'écran, et un plan de découpe la trancherait au bord
            // du meuble qu'elle vient de quitter.
            clipper={t.slot.ou === 'reserve' && !suitLeDoigt ? clipper : null}
            engagee={suitLeDoigt && surUnSlot}
            // ELLE RÉPOND AU CURSEUR — TANT QU'ON NE TIENT RIEN. Keko a voulu
            // l'effet du zoom partout dans l'armurerie ; mais ici le pointeur
            // sert aussi à PRENDRE, et *une carte tenue est le seul objet du
            // geste* : les autres cesseraient de basculer sous un doigt qui ne
            // les regarde plus. C'est la règle déjà tenue par le survol de la
            // main de combat.
            reflet={tenue === null && !sousLeZoom}
            // UNE PILE S'INCLINE D'UN BLOC : la doublure lit le curseur de la
            // carte posée dessus. *Deux cartes empilées ne sont pas deux
            // objets à l'oeil.*
            curseurPartage={
              t.doublure === true || (t.pile ?? 1) > 1 ? curseurDe(t.chef ?? t.id) : undefined
            }
            culbute={culbute !== null && culbute.id === t.id ? culbute.n : null}
            // ELLE S'ENCASTRE : le son part à l'instant où l'onde s'échappe,
            // et c'est la CARTE qui le dit — elle seule sait quand sa culbute
            // finit.
            onFixee={() => {
              jouerSon(SON_EQUIPER)
              onEquipee?.()
            }}
            // ELLE EST POSÉE : sa case cesse d'être dessinée. C'est la carte
            // qui le dit, parce qu'elle seule sait où en est son mouvement.
            onArrivee={() => setEnVol((v) => (v === t.id ? null : v))}
            // ELLE NE SE RATTRAPE PAS EN PLEIN VOL : tant qu'elle n'est pas
            // posée, elle ne répond plus au doigt.
            // UNE DOUBLURE NE SE PREND PAS : c'est l'épaisseur de la
            // pile, et la carte du dessus est déjà l'exemplaire qu'on tire.
            inerte={enVol === t.id || t.doublure === true}
            pile={compte}
            pileTaille={tailleCompte}
            onPeinte={onPeinte}
            onPointerDown={prendre(i)}
          />
        )
      })}

      {/* L'ONDE EST TOUJOURS MONTÉE, et c'est un correctif, pas un choix de
          style : montée À L'INSTANT du dépôt, son `useFrame` ne partait
          jamais — le composant se rendait (quatre fois, vérifié) sans qu'une
          seule image ne l'atteigne. *Un objet R3F qui naît au milieu d'un
          geste peut manquer la boucle ; un objet qui existe déjà ne peut
          pas.* Elle dort donc, invisible, et c'est le JETON qui la réveille.

          Sa place se LIT sur la carte qui vient de tomber, et se retient :
          quand la culbute s'efface, l'onde a fini de jouer, mais elle ne doit
          pas sauter à l'origine pour autant. */}

      {/* LE BOUTON DE DÉPART VIT AU BAS DU RAIL, détaché des destinations :
          *c'est la seule action qui quitte le hub*, donc elle ne peut pas être
          une entrée de la liste. Il s'éteint sans arme — il n'y a rien pour
          frapper — et la bulle de la page dit pourquoi. */}
      <Bouton3D
        texte={TEXTE_DESCENDRE}
        rapportMin={plan.rapportDepart}
        ton="or"
        position={plan.bouton}
        eteint={tenue !== null || !peutDescendre(hub.chargement)}
        onCliquer={onDescendre}
      />

      {/* CONSULTER SON DECK, dans la bande réservée sous les mesures. *Il ne
          décide de rien* — d'où le ton pierre et le format petit : il ouvre une
          page qu'on referme, il ne quitte pas le hub. */}
      <Bouton3D
        texte={TEXTE_DECK}
        ton="pierre"
        petit
        position={plan.boutonDeck}
        // ET IL S'ÉTEINT QUAND IL N'Y A RIEN À MONTRER : chargement vide, deck
        // vide. *Un bouton qui ouvre une page blanche se lit comme une panne* —
        // c'est la règle de « Descendre » sans arme.
        eteint={tenue !== null || deckEmporte(hub.chargement).length === 0}
        onCliquer={onVoirDeck}
      />

      {/* L'AUTRE DÉPART, SOUS « DESCENDRE ». *Ce sont deux façons de partir*,
          donc elles se lisent au même endroit ; celle-ci est le repli, elle
          vient dessous et en pierre plutôt qu'en or. Le libellé tient sur deux
          lignes, faute de quoi il aurait élargi le rail de moitié. Il s'éteint
          pendant un glisser comme tous les autres : on est déjà en train de
          faire autre chose. */}
      <Bouton3D
        texte={TEXTE_FORTUNE}
        rapportMin={plan.rapportDepart}
        ton="pierre"
        position={plan.boutonFortune}
        eteint={tenue !== null}
        onCliquer={onFourbir}
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
  let total = hub.chargement.pile.filter((c) => c !== null).length
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

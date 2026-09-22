/**
 * Le hub — pour l'instant, **juste l'armurerie**.
 *
 * C'est le premier des deux temps du jeu : *s'équiper*. Et ça doit prendre
 * trente secondes, pas deux heures — c'est une décision acquise, et elle a une
 * raison : **le coût de la perte doit être proportionnel au travail investi**.
 * On peut prendre un kit à un joueur ; on ne peut pas lui prendre deux heures
 * de création sans que ce soit une amputation. D'où l'absence de deckbuilding
 * carte par carte : *on choisit des pièces, le deck en découle.*
 *
 * Ce qui s'y décide tient en une question, et elle est déjà entière avec deux
 * pièces : **partir léger ou partir couvert.** Le Glaive seul donne dix cartes
 * qui frappent toutes ; avec le Plastron, quatorze dont quatre qui ne frappent
 * pas. *La taille du deck est une ressource*, et c'est ici qu'on la dépense.
 *
 * Pur, comme tout `logic/` : aucun DOM, aucun hasard non seedé.
 */
import type { Arme, Armure, Consommable, Piece } from './armes.ts'
import { ARME_GRATUITE, ARMURE_GRATUITE, CONSOMMABLE_GRATUIT, ESPADON } from './armes.ts'

/**
 * Ce qu'on emporte. Deux mains et un torse — **les objets viendront s'ajouter
 * ici**, pas ailleurs : c'est le seul endroit qui décide du deck.
 *
 * Une arme à deux mains occupe les DEUX slots de main. Elle vit dans le
 * premier, et le second est alors interdit : c'est la règle qui donne leur prix
 * aux armes lourdes.
 */
export type Chargement = {
  mains: [Arme | null, Arme | null]
  armure: Armure | null
  /** Le consommable : des cartes qui se boivent. Un seul slot, à dessein. */
  consommable: Consommable | null
}

export type Hub = {
  /** Ce qu'on possède et qui n'est pas équipé. */
  reserve: Piece[]
  chargement: Chargement
  /** L'or rapporté des descentes. Rien ne s'achète encore. */
  or: number
}

/** Un slot où poser une pièce. `main` porte son rang, 0 ou 1. */
export type Slot =
  | { ou: 'main'; rang: 0 | 1 }
  | { ou: 'armure' }
  | { ou: 'consommable' }
  | { ou: 'reserve' }

const VIDE: Chargement = { mains: [null, null], armure: null, consommable: null }

/**
 * L'armurerie au premier lancement : l'équipement gratuit, déjà équipé.
 *
 * **Déjà équipé, et pas seulement disponible** : un joueur qui arrive doit
 * pouvoir descendre sans rien comprendre à l'écran. L'armurerie se découvre en
 * y revenant, pas en y étant bloqué.
 */
export function creerHub(): Hub {
  return {
    // L'ESPADON EST AU RÂTELIER DÈS LE DÉPART, en attendant un marché qui le
    // vende : sans lui l'armurerie n'a rien à choisir. Il n'est pas gratuit
    // au sens du garde-fou — mort avec, on le perd pour de bon.
    reserve: [ESPADON],
    chargement: {
      mains: [ARME_GRATUITE, null],
      armure: ARMURE_GRATUITE,
      consommable: CONSOMMABLE_GRATUIT,
    },
    or: 0,
  }
}

/** Tout ce qui est équipé, dans l'ordre où ça donne ses cartes. */
export function equipement(chargement: Chargement): Piece[] {
  const pieces: Piece[] = []
  for (const arme of chargement.mains) if (arme !== null) pieces.push(arme)
  if (chargement.armure !== null) pieces.push(chargement.armure)
  if (chargement.consommable !== null) pieces.push(chargement.consommable)
  return pieces
}

/** Vrai si le premier slot porte une arme à deux mains : le second est pris. */
export function deuxMains(chargement: Chargement): boolean {
  return chargement.mains[0]?.mains === 2
}

function estArme(piece: Piece): piece is Arme {
  return 'mains' in piece
}

function estConsommable(piece: Piece): piece is Consommable {
  return 'consommable' in piece
}

/**
 * Déplace une pièce d'un endroit à un autre. **Prendre ici, poser là** — le
 * même modèle que le rangement du butin, et pour la même raison : sans lui,
 * chaque nouveau slot multipliait les cas particuliers.
 *
 * Renvoie le hub inchangé si le geste n'a pas de sens : une armure dans un slot
 * de main, une arme dans le torse, un slot vide qu'on essaie de vider.
 */
export function deplacerPiece(hub: Hub, source: Slot, cible: Slot, id?: string): Hub {
  const prise = prendre(hub, source, id)
  if (prise.piece === null) return hub
  if (!accepte(cible, prise.piece)) return hub

  const pose = poser(prise.hub, cible, prise.piece)
  // Ce que la destination délogeait repart là d'où vient la pièce. Sans ça,
  // échanger deux armes en ferait disparaître une.
  if (pose.sortant === null) return pose.hub
  if (!accepte(source, pose.sortant)) return { ...pose.hub, reserve: [...pose.hub.reserve, pose.sortant] }
  return poser(pose.hub, source, pose.sortant).hub
}

/** Un slot n'accepte pas n'importe quoi : une armure ne tient pas en main. */
function accepte(slot: Slot, piece: Piece): boolean {
  if (slot.ou === 'reserve') return true
  if (slot.ou === 'consommable') return estConsommable(piece)
  if (slot.ou === 'armure') return !estArme(piece) && !estConsommable(piece)
  // Une arme va dans l'une ou l'autre main. À deux mains aussi : on la pose où
  // l'on veut, elle prend les deux -- Keko : « on doit pouvoir la poser dans
  // n'importe lequel des deux slots ».
  return estArme(piece)
}

function prendre(hub: Hub, slot: Slot, id?: string): { piece: Piece | null; hub: Hub } {
  if (slot.ou === 'reserve') {
    const i = hub.reserve.findIndex((p) => p.id === id)
    if (i < 0) return { piece: null, hub }
    const reserve = [...hub.reserve]
    const [piece] = reserve.splice(i, 1)
    return { piece: piece ?? null, hub: { ...hub, reserve } }
  }
  if (slot.ou === 'armure') {
    const piece = hub.chargement.armure
    return { piece, hub: { ...hub, chargement: { ...hub.chargement, armure: null } } }
  }
  if (slot.ou === 'consommable') {
    const piece = hub.chargement.consommable
    return { piece, hub: { ...hub, chargement: { ...hub.chargement, consommable: null } } }
  }
  const mains: [Arme | null, Arme | null] = [...hub.chargement.mains]
  const piece = mains[slot.rang]
  mains[slot.rang] = null
  return { piece: piece ?? null, hub: { ...hub, chargement: { ...hub.chargement, mains } } }
}

function poser(hub: Hub, slot: Slot, piece: Piece): { sortant: Piece | null; hub: Hub } {
  if (slot.ou === 'reserve') {
    return { sortant: null, hub: { ...hub, reserve: [...hub.reserve, piece] } }
  }
  if (slot.ou === 'armure') {
    const sortant = hub.chargement.armure
    return { sortant, hub: { ...hub, chargement: { ...hub.chargement, armure: piece as Armure } } }
  }
  if (slot.ou === 'consommable') {
    const sortant = hub.chargement.consommable
    return {
      sortant,
      hub: { ...hub, chargement: { ...hub.chargement, consommable: piece as Consommable } },
    }
  }
  const mains: [Arme | null, Arme | null] = [...hub.chargement.mains]
  const sortant = mains[slot.rang] ?? null
  const arme = piece as Arme
  // UNE ARME A DEUX MAINS PREND LES DEUX SLOTS, où qu'on la pose : elle vit
  // dans le premier, et ce qui tenait l'autre main est CHASSÉ, tout de suite —
  // un slot qui reste rempli mais inutilisable mentirait sur ce qu'on emporte.
  // Ce qui occupait le slot visé, lui, repart d'où vient l'arme (`sortant`).
  let chasse: Arme | null = null
  if (arme.mains === 2) {
    chasse = mains[1 - slot.rang] ?? null
    mains[0] = arme
    mains[1] = null
  } else {
    mains[slot.rang] = arme
  }
  const apres = { ...hub, chargement: { ...hub.chargement, mains } }
  return {
    sortant,
    hub: chasse === null ? apres : { ...apres, reserve: [...apres.reserve, chasse] },
  }
}

/**
 * Ce qu'on rapporte d'une descente réussie : le butin devient de l'or, et
 * l'équipement rentre avec nous.
 */
export function rentrer(hub: Hub, butin: number): Hub {
  return { ...hub, or: hub.or + butin }
}

/**
 * Ce que coûte la mort : **l'équipement emporté est perdu**, comme le sac.
 *
 * Le garde-fou est ici et nulle part ailleurs — on remet au râtelier de quoi
 * repartir. *Sans lui, une mort avec son seul équipement bloquerait le jeu*, et
 * c'est exactement la spirale que la décision de design veut éviter.
 */
export function perdreLEquipement(hub: Hub): Hub {
  // LES PIÈCES GRATUITES SONT UNIQUES. Si on est descendu sans le Plastron, il
  // est resté au râtelier : le remettre au chargement sans l'en retirer le
  // dédoublait. Keko : « si je pars sans plastron, quand je meurs le plastron
  // est dédoublé ». Ce qu'on rééquipe sort donc de la réserve s'il y était.
  const gratuites = new Set([ARME_GRATUITE.id, ARMURE_GRATUITE.id, CONSOMMABLE_GRATUIT.id])
  return {
    ...hub,
    reserve: hub.reserve.filter((p) => !gratuites.has(p.id)),
    chargement: {
      mains: [ARME_GRATUITE, null],
      armure: ARMURE_GRATUITE,
      consommable: CONSOMMABLE_GRATUIT,
    },
  }
}

/** Le chargement est-il seulement descendable ? Il faut au moins de quoi frapper. */
export function peutDescendre(chargement: Chargement): boolean {
  return chargement.mains.some((a) => a !== null)
}

export { VIDE as CHARGEMENT_VIDE }

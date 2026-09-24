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
import type { Carte } from './combat.ts'
import type { Arme, Armure, Consommable, Objet, Piece } from './armes.ts'
import {
  ARME_GRATUITE,
  ARMURE_GRATUITE,
  ESPADON,
  POTIONS_DEPART,
  carteDuConsommable,
  deckDeLEquipement,
  estConsommable,
} from './armes.ts'

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
  /**
   * LA PILE : les consommables emportés, **quatre au plus**.
   *
   * C'est le seul endroit du chargement où l'on décide d'un NOMBRE — ailleurs
   * un slot tient une pièce ou rien — et on peut y mettre plusieurs
   * exemplaires du même modèle. Tranché par Keko : « on peut déposer plusieurs
   * cartes dedans, même une en plusieurs exemplaires ».
   *
   * **Mais il y a un plafond, et il est venu après coup.** Sans lui, la seule
   * borne était la dilution — et Keko l'a repris : « on ne peut pas donner des
   * slots illimités, il faudrait une limite ». *Un contenant sans fond n'est
   * pas un choix, c'est un sac* : on y met tout ce qu'on possède et la
   * question ne se pose plus. À quatre cases, emporter une potion de plus veut
   * dire en laisser une autre.
   */
  pile: Consommable[]
}

export type Hub = {
  /**
   * Ce qu'on possède et qui n'est pas équipé — pièces ET consommables mêlés.
   *
   * **Le consommable est la seule CARTE DE DECK qui apparaisse ici** : les
   * armes et les armures sont des intermédiaires, elles génèrent des cartes
   * sans en être. C'est pour ça que le râtelier en montre les exemplaires un
   * par un, et non un objet avec un compte.
   */
  reserve: Objet[]
  chargement: Chargement
  /** L'or rapporté des descentes. Rien ne s'achète encore. */
  or: number
}

/** Un slot où poser une pièce. `main` porte son rang, 0 ou 1. */
export type Slot =
  | { ou: 'main'; rang: 0 | 1 }
  | { ou: 'armure' }
  /** La pile des consommables. Sans rang : on pose dessus, elle n'a pas de cases. */
  | { ou: 'pile' }
  | { ou: 'reserve' }

/**
 * Combien de consommables on emporte au plus.
 *
 * Quatre, comme les quatre cases de la grille qui les montre : le nombre est
 * une donnée de règle, pas une conséquence de la mise en page, mais les deux
 * doivent dire la même chose.
 */
export const CAPACITE_PILE = 4

const VIDE: Chargement = { mains: [null, null], armure: null, pile: [] }

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
    // CINQ POTIONS, dont une déjà dans la pile : on arrive équipé, donc on
    // découvre la carte en jouant plutôt qu'en lisant l'armurerie.
    reserve: [ESPADON, ...POTIONS_DEPART.slice(1)],
    chargement: {
      mains: [ARME_GRATUITE, null],
      armure: ARMURE_GRATUITE,
      pile: [POTIONS_DEPART[0]!],
    },
    or: 0,
  }
}

/** Les PIÈCES équipées, dans l'ordre où elles donnent leurs cartes. */
export function equipement(chargement: Chargement): Piece[] {
  const pieces: Piece[] = []
  for (const arme of chargement.mains) if (arme !== null) pieces.push(arme)
  if (chargement.armure !== null) pieces.push(chargement.armure)
  return pieces
}

/**
 * LE DECK EMPORTÉ : les sets des pièces, PLUS les cartes de la pile.
 *
 * Les deux sources n'ont pas la même nature — l'une génère des cartes, l'autre
 * en est — mais elles finissent dans le même deck, et c'est tout ce que le
 * combat a besoin de savoir.
 */
export function deckEmporte(chargement: Chargement): Carte[] {
  return [
    ...deckDeLEquipement(equipement(chargement)),
    ...chargement.pile.map(carteDuConsommable),
  ]
}

/** Vrai si le premier slot porte une arme à deux mains : le second est pris. */
export function deuxMains(chargement: Chargement): boolean {
  return chargement.mains[0]?.mains === 2
}

function estArme(objet: Objet): objet is Arme {
  return 'mains' in objet
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
  // On juge la destination SUR LE HUB D'APRÈS LA PRISE : sans ça, reposer une
  // potion sur une pile pleine se refusait elle-même, alors qu'elle venait
  // d'en libérer la place.
  if (!accepte(cible, prise.piece, prise.hub)) return hub

  const pose = poser(prise.hub, cible, prise.piece)
  // Ce que la destination délogeait repart là d'où vient la pièce. Sans ça,
  // échanger deux armes en ferait disparaître une.
  if (pose.sortant === null) return pose.hub
  if (!accepte(source, pose.sortant, pose.hub)) return { ...pose.hub, reserve: [...pose.hub.reserve, pose.sortant] }
  return poser(pose.hub, source, pose.sortant).hub
}

/**
 * CE DÉPLACEMENT ABOUTIRAIT-IL ? La question du rendu, posée aux règles.
 *
 * L'affichage a besoin de savoir, **pendant** le glisser, si le slot sous le
 * doigt prend ce qu'on tient — pour le dire avant qu'on lâche. Il ne peut pas
 * appeler `accepte` directement : la pile pleine se refuserait elle-même quand
 * on y repose une potion qui vient d'en sortir. C'est exactement le
 * raisonnement de `deplacerPiece`, donc c'est LUI qu'on réutilise — *une règle
 * recopiée dans le rendu est une règle qui divergera.*
 */
export function accepteDepuis(hub: Hub, source: Slot, cible: Slot, id?: string): boolean {
  const prise = prendre(hub, source, id)
  if (prise.piece === null) return false
  return accepte(cible, prise.piece, prise.hub)
}

/** Un slot n'accepte pas n'importe quoi : une armure ne tient pas en main. */
function accepte(slot: Slot, piece: Objet, hub: Hub): boolean {
  if (slot.ou === 'reserve') return true
  // LA PILE EST PLEINE OU NON : c'est la seule destination dont l'acceptation
  // dépend de ce qu'elle contient déjà, et non de ce qu'on lui tend.
  if (slot.ou === 'pile') return estConsommable(piece) && hub.chargement.pile.length < CAPACITE_PILE
  if (slot.ou === 'armure') return !estArme(piece) && !estConsommable(piece)
  // Une arme va dans l'une ou l'autre main. À deux mains aussi : on la pose où
  // l'on veut, elle prend les deux -- Keko : « on doit pouvoir la poser dans
  // n'importe lequel des deux slots ».
  return estArme(piece)
}

function prendre(hub: Hub, slot: Slot, id?: string): { piece: Objet | null; hub: Hub } {
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
  // LA PILE SE PREND PAR IDENTIFIANT, comme la réserve : elle en contient
  // plusieurs, et souvent le même modèle. Le lieu seul ne dirait pas laquelle.
  if (slot.ou === 'pile') {
    const i = hub.chargement.pile.findIndex((c) => c.id === id)
    if (i < 0) return { piece: null, hub }
    const pile = [...hub.chargement.pile]
    const [piece] = pile.splice(i, 1)
    return { piece: piece ?? null, hub: { ...hub, chargement: { ...hub.chargement, pile } } }
  }
  const mains: [Arme | null, Arme | null] = [...hub.chargement.mains]
  const piece = mains[slot.rang]
  mains[slot.rang] = null
  return { piece: piece ?? null, hub: { ...hub, chargement: { ...hub.chargement, mains } } }
}

function poser(hub: Hub, slot: Slot, piece: Objet): { sortant: Objet | null; hub: Hub } {
  if (slot.ou === 'reserve') {
    return { sortant: null, hub: { ...hub, reserve: [...hub.reserve, piece] } }
  }
  if (slot.ou === 'armure') {
    const sortant = hub.chargement.armure
    return { sortant, hub: { ...hub, chargement: { ...hub.chargement, armure: piece as Armure } } }
  }
  // ON POSE SUR LA PILE, ON N'Y ÉCHANGE RIEN : elle n'a pas de cases, donc
  // rien ne peut en être délogé. C'est ce qui la distingue de tous les autres
  // slots du chargement.
  if (slot.ou === 'pile') {
    const pile = [...hub.chargement.pile, piece as Consommable]
    return { sortant: null, hub: { ...hub, chargement: { ...hub.chargement, pile } } }
  }
  const mains: [Arme | null, Arme | null] = [...hub.chargement.mains]
  const sortant: Objet | null = mains[slot.rang] ?? null
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
 * Ce qu'on rapporte d'une descente réussie : le butin devient de l'or,
 * l'équipement rentre avec nous — et **la pile revient AMPUTÉE de ce qu'on a
 * bu**.
 *
 * C'est la seule ressource du jeu qui s'épuise à l'usage, et c'est une
 * décision de Keko : une potion bue disparaît du râtelier, elle n'y repousse
 * pas. Les survivantes sont celles dont la carte est encore dans le deck à
 * l'arrivée — une carte bue s'exile, donc elle n'y est plus. *Rien à compter,
 * l'état le dit déjà.*
 */
export function rentrer(hub: Hub, butin: number, pile: Consommable[]): Hub {
  return { ...hub, or: hub.or + butin, chargement: { ...hub.chargement, pile } }
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
  const gratuites = new Set([ARME_GRATUITE.id, ARMURE_GRATUITE.id])
  return {
    ...hub,
    reserve: hub.reserve.filter((p) => !gratuites.has(p.id)),
    chargement: {
      mains: [ARME_GRATUITE, null],
      armure: ARMURE_GRATUITE,
      // LA PILE EST PERDUE, ET RIEN NE LA REMPLACE. Le garde-fou ne couvre que
      // de quoi frapper et encaisser : on peut descendre sans potion, on ne
      // peut pas descendre sans arme. Ce qui restait au râtelier est intact.
      pile: [],
    },
  }
}

/** Reste-t-il de la place pour un consommable ? */
export function pilePleine(chargement: Chargement): boolean {
  return chargement.pile.length >= CAPACITE_PILE
}

/** Le chargement est-il seulement descendable ? Il faut au moins de quoi frapper. */
export function peutDescendre(chargement: Chargement): boolean {
  return chargement.mains.some((a) => a !== null)
}

export { VIDE as CHARGEMENT_VIDE }

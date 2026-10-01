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
import type { Arme, Armure, Consommable, Objet, Piece, Rarete } from './armes.ts'
import type { Rng } from './rng.ts'
import {
  ARME_GRATUITE,
  ARMES_COMMUNES,
  ARMURE_GRATUITE,
  ARMURES_COMMUNES,
  ESPADON,
  POTIONS_DEPART,
  SUPER_POTIONS_DEPART,
  carteDuConsommable,
  deckDeLEquipement,
  estConsommable,
  nomObjet,
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
  /**
   * LA PILE EST POSITIONNELLE : toujours `CAPACITE_PILE` cases, `null` pour
   * une case libre. Elle a été une LISTE compacte, et le joueur ne pouvait
   * pas choisir où poser — Keko : « je ne peux pas décider dans quel slot, ça
   * met l'objet toujours dans le slot le plus libre en partant de la gauche,
   * c'est pas fou ».
   *
   * *C'est exactement la leçon du sac en 2D* : une liste compactée remonte les
   * vides à la fin et fait glisser les voisins, donc **le joueur perd son
   * rangement en le manipulant.** L'ordre n'a toujours aucun effet sur les
   * règles — le deck est mélangé au combat — mais ranger est un geste qu'on
   * doit pouvoir faire sans qu'il se défasse.
   */
  pile: (Consommable | null)[]
}

/**
 * **CE QUI VIT AU COFFRE : une seule liste, pièces et trésors mêlés.**
 *
 * Ils ont vécu dans deux listes, que la grille montrait à la suite — et c'est
 * exactement ce qui empêchait de les ranger ensemble : *un ordre d'affichage
 * qui sort de deux listes concaténées ne peut pas les entrelacer.* Keko :
 * « on peut réorganiser les armes / armures / objets ensemble ? là les trésors
 * ne peuvent pas être changés de position avec une arme par ex ».
 *
 * **Le coffre est une étagère, pas deux.** Ce qui distingue un trésor n'est plus
 * la liste où il vit, c'est son TYPE — et c'est le type qui l'empêche d'entrer
 * dans un slot, là où la séparation des listes le faisait par construction.
 */
export type ContenuCoffre = Objet | Carte

/** Un trésor rapporté, par opposition à ce qui peut s'équiper. */
export function estTresor(o: ContenuCoffre): o is Carte {
  return 'type' in o && o.type === 'tresor'
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
  reserve: ContenuCoffre[]
  chargement: Chargement
  /** L'or rapporté des descentes. Rien ne s'achète encore. */
  or: number
}

/** Un slot où poser une pièce. `main` porte son rang, 0 ou 1. */
export type Slot =
  | { ou: 'main'; rang: 0 | 1 }
  | { ou: 'armure' }
  /**
    * La pile des consommables. **Le rang est facultatif, et c'est tout le
    * sujet** : sans lui on POSE sur la pile (elle s'allonge), avec lui on pose
    * SUR UNE CASE (elle échange). *Une pile pleine n'avait aucune porte* —
    * Keko : « si j'ai 3 petites potions équipées, je ne peux pas mettre une
    * grosse potion à la place ». Et c'est aussi ce qui permet d'y ranger, en
    * échangeant deux cases entre elles.
    */
  | { ou: 'pile'; rang?: number }
  | { ou: 'reserve' }

/**
 * Combien de consommables on emporte au plus.
 *
 * **Trois**, tranché par Keko : « on va passer les consommables à 3 max, tout
 * sur une ligne ». Il en a tenu quatre, en bloc de deux par deux sous les
 * pièces ; *un bloc se compte, une rangée se voit* — et la rangée unique rend
 * au panneau la hauteur qui paie les noms de groupe au-dessus des slots.
 *
 * Le nombre est une donnée de RÈGLE, pas une conséquence de la mise en page,
 * mais les deux doivent dire la même chose : la grille en montre exactement
 * `CAPACITE_PILE`, occupées ou non.
 */
export const CAPACITE_PILE = 3

/**
 * RANGER LE COFFRE D'UN COUP : par catégorie, puis par rareté.
 *
 * Demandé par Keko : « un bouton dans le coffre, au-dessus des catégories,
 * pour ranger le coffre en triant les objets par catégorie, et par rareté au
 * sein des catégories ».
 *
 * L'ordre des catégories est **celui des onglets** — armes, armures, objets —
 * parce que *deux façons de dire le même classement finiraient par diverger* :
 * le joueur qui range retrouve exactement l'ordre dans lequel le coffre lui
 * propose de chercher.
 *
 * Au sein d'une catégorie, la rareté MONTE : le commun d'abord, le rare au
 * bout. Tranché par Keko — « il faudrait que le tri mette les objets faibles en
 * premier et les objets rares en dernier ». *Une liste qui monte se termine sur
 * ce qu'on cherche*, et le coffre se lit de haut en bas comme une progression.
 * À rareté égale, le nom — il faut bien un ordre stable, et *deux rangements du
 * même coffre doivent donner la même chose.*
 *
 * **Les piles se referment d'elles-mêmes** : deux exemplaires d'un objet ont
 * même catégorie, même rareté et même nom, donc ils se retrouvent voisins sans
 * qu'on ait à les grouper.
 *
 * Les trésors vivent dans leur propre liste, que la grille montre à la suite :
 * on les range par VALEUR croissante, dans le même sens — c'est la seule
 * rareté qu'ils aient.
 */
const RANG_CATEGORIE = (o: ContenuCoffre): number =>
  estTresor(o) ? 3 : 'mains' in o ? 0 : estConsommable(o) ? 2 : 1

/**
 * Ce qui départage DANS une catégorie : la rareté pour ce qui s'équipe, la
 * VALEUR pour un trésor — *c'est la seule rareté qu'il ait.* Les deux échelles
 * ne se comparent jamais entre elles, puisque la catégorie tranche avant.
 */
const rangInterne = (o: ContenuCoffre): number =>
  estTresor(o) ? (o.valeur ?? 0) : RANG_RARETE[o.rarete]

const nomAuCoffre = (o: ContenuCoffre): string => (estTresor(o) ? o.nom : nomObjet(o))

const RANG_RARETE: Record<Rarete, number> = {
  commune: 0,
  rare: 1,
  epique: 2,
  legendaire: 3,
}

export function trierLeCoffre(hub: Hub): Hub {
  const reserve = [...hub.reserve].sort(
    (a, b) =>
      RANG_CATEGORIE(a) - RANG_CATEGORIE(b) ||
      rangInterne(a) - rangInterne(b) ||
      nomAuCoffre(a).localeCompare(nomAuCoffre(b)) ||
      a.id.localeCompare(b.id),
  )
  return { ...hub, reserve }
}

/**
 * RANGER UN OBJET — OU UNE PILE — EN FIN DE COFFRE.
 *
 * C'est ce que « poser sur une case VIDE » veut dire : il n'y a personne avec
 * qui échanger, donc l'objet va au bout de la liste, là où la grille garde ses
 * étagères vides. Une carte seule le faisait déjà, par la porte ordinaire du
 * « repose au râtelier » — **mais une pile, non** : `deplacerPiece` n'en
 * déplaçait qu'un exemplaire, et comme le coffre montre une pile à la place de
 * son PREMIER exemplaire, rien ne bougeait. Keko : « quand je drag un objet
 * d'une pile sur une case vide du coffre, elle n'est pas déplacée, alors qu'une
 * carte sans pile est placée en dernière position ».
 *
 * *Ce qui vaut pour l'échange vaut pour le rangement* : on déplace le bloc.
 */
export function rangerEnFinDeCoffre(hub: Hub, ids: readonly string[]): Hub {
  if (ids.length === 0) return hub
  const dedans = new Set(ids)
  const auBout = <T extends { id: string }>(liste: T[]): T[] | null => {
    const bloc = liste.filter((o) => dedans.has(o.id))
    if (bloc.length !== dedans.size) return null
    const reste = liste.filter((o) => !dedans.has(o.id))
    // DÉJÀ AU BOUT : on ne rend pas un hub neuf pour rien, sinon le rendu
    // repart et la carte croit avoir bougé.
    if (liste.at(-1) === bloc.at(-1)) return null
    return [...reste, ...bloc]
  }
  const reserve = auBout(hub.reserve)
  return reserve === null ? hub : { ...hub, reserve }
}

/**
 * ÉCHANGER DEUX OBJETS DU COFFRE — c'est tout ce que « ranger » veut dire ici.
 *
 * Le coffre est une LISTE, et le rendu la découpe en grille : y poser un objet
 * sur un autre l'envoyait au bout, parce que le seul déplacement qui existait
 * était « repose au râtelier ». Keko : « je ne peux pas réorganiser le coffre,
 * si je bouge un objet sur un autre il va systématiquement à la fin au lieu
 * d'échanger leurs places ».
 *
 * **L'échange, pas l'insertion** : c'est ce que demande Keko, et c'est aussi
 * ce qui se voit — une insertion fait glisser tout ce qui suit, donc le
 * rangement qu'on vient de faire bouge sous les yeux. *Un échange ne déplace
 * que les deux cases qu'on regarde.*
 *
 * **ET TOUT S'ÉCHANGE AVEC TOUT**, trésors compris. Keko : « on peut
 * réorganiser les armes / armures / objets ensemble ? là les trésors ne peuvent
 * pas être changés de position avec une arme ». Ils vivaient dans une seconde
 * liste que la grille montrait à la suite, donc *aucun ordre d'affichage ne
 * pouvait les entrelacer* — c'est le modèle qui l'interdisait, pas le geste.
 * Une seule étagère, un seul ordre.
 */
export function echangerDansCoffre(
  hub: Hub,
  idsA: readonly string[],
  idsB: readonly string[],
): Hub {
  if (idsA.length === 0 || idsB.length === 0) return hub
  const a = new Set(idsA)
  const b = new Set(idsB)
  if (idsA.some((id) => b.has(id))) return hub

  const permuter = <T extends { id: string }>(liste: T[]): T[] | null => {
    const blocA = liste.filter((o) => a.has(o.id))
    const blocB = liste.filter((o) => b.has(o.id))
    if (blocA.length !== a.size || blocB.length !== b.size) return null

    /**
     * ON REPLACE DES BLOCS, PAS DES ÉLÉMENTS.
     *
     * Le coffre regroupe les exemplaires identiques en piles, et *c'est la
     * PILE qu'on déplace* : échanger deux représentants laisserait leurs
     * doublures derrière eux, donc la pile ne bougerait pas d'un pouce.
     *
     * On parcourt la liste dans l'ordre : au PREMIER élément d'un bloc on
     * écrit l'autre bloc entier, aux suivants rien. Ce qui n'appartient à
     * aucun des deux ne bouge pas — *un rangement qui déplace ce qu'on n'a
     * pas touché n'est plus un rangement.*
     */
    const sortie: T[] = []
    let poseA = false
    let poseB = false
    for (const o of liste) {
      if (a.has(o.id)) {
        if (!poseA) {
          poseA = true
          sortie.push(...blocB)
        }
      } else if (b.has(o.id)) {
        if (!poseB) {
          poseB = true
          sortie.push(...blocA)
        }
      } else {
        sortie.push(o)
      }
    }
    return sortie
  }

  const reserve = permuter(hub.reserve)
  return reserve === null ? hub : { ...hub, reserve }
}

/** Une pile vide : ses cases existent toutes, elles ne tiennent rien. */
export function pileVide(): (Consommable | null)[] {
  return Array.from({ length: CAPACITE_PILE }, () => null)
}

/** Ce que la pile contient VRAIMENT, sans ses trous. */
export function consommablesDeLaPile(pile: (Consommable | null)[]): Consommable[] {
  return pile.filter((c): c is Consommable => c !== null)
}

const VIDE: Chargement = { mains: [null, null], armure: null, pile: pileVide() }

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
    reserve: [ESPADON, ...POTIONS_DEPART.slice(1), ...SUPER_POTIONS_DEPART],
    chargement: {
      mains: [ARME_GRATUITE, null],
      armure: ARMURE_GRATUITE,
      pile: [POTIONS_DEPART[0]!, ...pileVide().slice(1)],
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
    ...consommablesDeLaPile(chargement.pile).map(carteDuConsommable),
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
  // LE PRÊT TOMBE AVANT LA POSE, jamais après : s'il tombait ensuite, la pièce
  // prêtée que la destination déloge repartirait au coffre — et on POSSÈDERAIT
  // ce qu'on n'a jamais rapporté.
  const depart = equipeUnePieceAUeLui(hub, source, cible, id) ? romprLePret(hub) : hub
  const prise = prendre(depart, source, id)
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
  if (slot.ou === 'pile') {
    if (!estConsommable(piece)) return false
    // UNE CASE OCCUPÉE PREND TOUJOURS, même pile pleine : on ne l'allonge pas,
    // on remplace ce qu'elle tient. C'est la règle des autres slots du
    // chargement, enfin rendue à la pile.
    // UNE CASE VISÉE PREND TOUJOURS : vide elle reçoit, occupée elle échange.
    // Sans rang, il faut qu'il reste une case libre — c'est le seul cas où la
    // pile peut refuser.
    if (slot.rang !== undefined && slot.rang < hub.chargement.pile.length) return true
    return hub.chargement.pile.some((c) => c === null)
  }
  if (slot.ou === 'armure') return !estArme(piece) && !estConsommable(piece)
  // Une arme va dans l'une ou l'autre main. À deux mains aussi : on la pose où
  // l'on veut, elle prend les deux -- Keko : « on doit pouvoir la poser dans
  // n'importe lequel des deux slots ».
  return estArme(piece)
}

function prendre(hub: Hub, slot: Slot, id?: string): { piece: Objet | null; hub: Hub } {
  if (slot.ou === 'reserve') {
    const i = hub.reserve.findIndex((p) => p.id === id)
    const vise = i < 0 ? undefined : hub.reserve[i]
    /**
     * **UN TRÉSOR NE SE PREND PAS.** Il vit désormais dans la même liste que
     * les pièces, donc c'est le TYPE qui le tient hors des slots — la
     * séparation des listes le faisait par construction, et ce garde-fou la
     * remplace. *Sans lui, un trésor passerait le test du torse*, qui ne
     * demande que « ni arme ni consommable ».
     *
     * Le ranger reste possible : `echangerDansCoffre` ne passe pas par ici.
     */
    if (vise === undefined || estTresor(vise)) return { piece: null, hub }
    const reserve = [...hub.reserve]
    reserve.splice(i, 1)
    return { piece: vise, hub: { ...hub, reserve } }
  }
  if (slot.ou === 'armure') {
    const piece = hub.chargement.armure
    // UNE PIÈCE PRÊTÉE NE SE PREND PAS : *elle est verrouillée.* Keko : « on ne
    // peut pas prendre l'arme ou l'armure de prêt et la placer dans le
    // coffre ». Le garde-fou vit ICI plutôt qu'à la destination, parce qu'il
    // vaut pour TOUTES les destinations — *ce qui ne t'appartient pas ne se
    // range pas, où que ce soit.* La seule façon de s'en défaire est de
    // décocher la case, ou d'équiper une pièce à soi par-dessus.
    if (piece?.pret === true) return { piece: null, hub }
    return { piece, hub: { ...hub, chargement: { ...hub.chargement, armure: null } } }
  }
  // LA PILE SE PREND PAR IDENTIFIANT, comme la réserve : elle en contient
  // plusieurs, et souvent le même modèle. Le lieu seul ne dirait pas laquelle.
  if (slot.ou === 'pile') {
    const i = hub.chargement.pile.findIndex((c) => c !== null && c.id === id)
    if (i < 0) return { piece: null, hub }
    const pile = [...hub.chargement.pile]
    const piece = pile[i] ?? null
    // ELLE LAISSE SA CASE OUVERTE : on peut l'y remettre, et les voisines ne
    // glissent pas sous le doigt.
    pile[i] = null
    return { piece, hub: { ...hub, chargement: { ...hub.chargement, pile } } }
  }
  const mains: [Arme | null, Arme | null] = [...hub.chargement.mains]
  const piece = mains[slot.rang]
  // VERROUILLÉE, COMME L'ARMURE PRÊTÉE : voir le garde-fou du slot de torse.
  if (piece?.pret === true) return { piece: null, hub }
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
  // SUR LA PILE : au bout si on vise la pile, À LA PLACE si on vise une case.
  // Ce qu'elle délogeait repart d'où vient la pièce, comme partout ailleurs —
  // c'est `deplacerPiece` qui s'en charge, et c'est ce qui permet aussi bien
  // de remplacer une potion que d'échanger deux cases entre elles.
  if (slot.ou === 'pile') {
    const pile = [...hub.chargement.pile]
    // DANS LA CASE VISÉE quand on en vise une — c'est elle qui décide, pas
    // l'ordre de la liste. Sans rang (une tape, un dépôt large), la première
    // libre : il faut bien poser quelque part.
    const ou = slot.rang !== undefined && slot.rang < pile.length
      ? slot.rang
      : pile.findIndex((c) => c === null)
    if (ou < 0) return { sortant: null, hub }
    const sortant = pile[ou] ?? null
    pile[ou] = piece as Consommable
    return { sortant, hub: { ...hub, chargement: { ...hub.chargement, pile } } }
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
export function rentrer(
  hub: Hub,
  butin: number,
  survivants: Consommable[],
  tresors: Carte[] = [],
): Hub {
  // CE QUI A ÉTÉ BU LAISSE SA CASE VIDE, le reste ne bouge pas : la pile est
  // positionnelle, donc on ne la reconstruit pas — on l'ampute.
  const restants = new Set(survivants.map((c) => c.id))
  const pile = hub.chargement.pile.map((c) => (c !== null && restants.has(c.id) ? c : null))
  // ET LE PRÊT DEVIENT UN BIEN. *Il ne s'acquiert qu'en le RAMENANT* — tranché
  // par Keko : « l'équipement gratuit ne pourra être obtenu définitivement
  // qu'après que le joueur l'ait emmené en run et ramené ». Il reste équipé :
  // il perd son drapeau, c'est tout ce qui le séparait d'une pièce à soi.
  const acquise = <T extends Piece>(p: T): T => (p.pret === true ? { ...p, pret: undefined } : p)
  return {
    ...hub,
    or: hub.or + butin,
    // LE COFFRE LES GARDE, et il ne les rend jamais : c'est le garde-fou qui
    // interdit qu'un trésor reparte en run. Ils s'y consommeront le jour où un
    // marché existera — et ils entrent dans la MÊME liste que le reste, donc à
    // la suite de ce qu'on possède déjà.
    reserve: [...hub.reserve, ...tresors],
    chargement: {
      ...hub.chargement,
      mains: hub.chargement.mains.map((a) => (a === null ? null : acquise(a))) as [
        Arme | null,
        Arme | null,
      ],
      armure: hub.chargement.armure === null ? null : acquise(hub.chargement.armure),
      pile,
    },
  }
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
      pile: pileVide(),
    },
  }
}



/**
 * LE PRÊT DE L'ARMURIER : une case à cocher, pas un départ à part.
 *
 * Tranché par Keko : « l'équipement gratuit devrait être une option de
 * l'armurier — un bouton à cocher / décocher. Quand on le coche, tout
 * l'équipement actuel va au coffre et on verrouille un équipement aléatoire
 * arme + armure. Si le joueur équipe une arme ou armure du coffre à nouveau,
 * l'équipement gratuit disparaît intégralement. Les objets ne sont jamais
 * gratuits. Et si le joueur décoche, il disparaît aussi. »
 *
 * **Ce que ça change de l'ancien bouton**, et c'est tout le gain : l'équipement
 * de dépannage cesse d'être un DÉPART séparé pour devenir un CHARGEMENT comme
 * un autre. On peut donc lui ajouter ses propres objets, le regarder, le
 * comparer — et surtout *le refuser d'un clic*, ce qu'un bouton qui lance la
 * partie ne permettait pas.
 *
 * **Il ne s'acquiert qu'en le RAMENANT.** Le drapeau tombe à l'extraction ;
 * mourir avec ne laisse rien, puisqu'on ne perd que ce qu'on a emporté et que
 * ça n'appartenait à personne.
 */
export function pretActif(chargement: Chargement): boolean {
  return equipement(chargement).some((p) => p.pret === true)
}

/**
 * COCHER : ce qu'on portait rentre au coffre, un prêt neuf prend sa place.
 *
 * *Les objets ne sont jamais prêtés* — la pile ne bouge pas, et le joueur peut
 * en ajouter au prêt comme à n'importe quel chargement.
 *
 * Le tirage passe par le RNG SEEDÉ, comme tout hasard du jeu, et par un RNG à
 * LUI : consommer celui de la descente ferait que cocher la case changerait la
 * partie que la seed annonce.
 */
export function cocherPret(hub: Hub, rng: Rng): Hub {
  const marque = `pret-${rng.getState().toString(36)}`
  const tire = <T,>(liste: readonly T[]): T =>
    liste[Math.min(liste.length - 1, Math.floor(rng.next() * liste.length))]!
  const arme: Arme = { ...tire(ARMES_COMMUNES), id: `${marque}-a`, pret: true }
  const armure: Armure = { ...tire(ARMURES_COMMUNES), id: `${marque}-b`, pret: true }
  // CE QU'ON PORTAIT RENTRE AU COFFRE, et seulement ce qu'on POSSÈDE : un prêt
  // qu'on remplace par un autre ne doit rien laisser derrière lui.
  const rendu = equipement(hub.chargement).filter((p) => p.pret !== true)
  return {
    ...hub,
    reserve: [...hub.reserve, ...rendu],
    chargement: { ...hub.chargement, mains: [arme, null], armure },
  }
}

/**
 * DÉCOCHER : le prêt s'évapore, et il ne laisse rien.
 *
 * *Il n'a jamais appartenu à personne*, donc il ne rentre pas au coffre — c'est
 * exactement ce qui le distingue d'un équipement qu'on retire. La pile reste :
 * les objets sont au joueur.
 */
export function decocherPret(hub: Hub): Hub {
  if (!pretActif(hub.chargement)) return hub
  return {
    ...hub,
    chargement: {
      ...hub.chargement,
      mains: hub.chargement.mains.map((a) => (a?.pret === true ? null : a)) as [
        Arme | null,
        Arme | null,
      ],
      armure: hub.chargement.armure?.pret === true ? null : hub.chargement.armure,
    },
  }
}

/**
 * LE PRÊT TOMBE EN BLOC dès qu'on équipe une pièce à soi.
 *
 * Keko : « si le joueur équipe une arme ou armure du coffre à nouveau,
 * l'équipement gratuit disparaît intégralement ». *On ne mélange pas* : un
 * chargement est prêté ou il ne l'est pas. Sans cette règle, on garderait
 * l'armure prêtée en équipant sa propre arme — et le prêt deviendrait un
 * complément gratuit plutôt qu'un dépannage.
 */
function romprLePret(hub: Hub): Hub {
  return decocherPret(hub)
}

/** Ce geste équipe-t-il une pièce qu'on POSSÈDE, alors qu'un prêt est en cours ? */
function equipeUnePieceAUeLui(hub: Hub, source: Slot, cible: Slot, id?: string): boolean {
  if (source.ou !== 'reserve') return false
  if (cible.ou !== 'main' && cible.ou !== 'armure') return false
  if (!pretActif(hub.chargement)) return false
  const { piece } = prendre(hub, source, id)
  // *Les objets ne sont jamais prêtés*, donc en ajouter un ne rompt rien :
  // Keko — « le joueur peut ajouter des objets à un free loadout ».
  return piece !== null && !estConsommable(piece)
}

/** Reste-t-il de la place pour un consommable ? */
export function pilePleine(chargement: Chargement): boolean {
  return chargement.pile.every((c) => c !== null)
}

/** Le chargement est-il seulement descendable ? Il faut au moins de quoi frapper. */
export function peutDescendre(chargement: Chargement): boolean {
  return chargement.mains.some((a) => a !== null)
}

export { VIDE as CHARGEMENT_VIDE }

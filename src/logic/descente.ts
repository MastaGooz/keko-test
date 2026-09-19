/**
 * La descente : une run, du premier combat à l'extraction ou à la mort.
 *
 * Le deck emporté n'existe pas en soi : **c'est la somme des sets de
 * l'équipement**. On ne compose pas un deck carte par carte avant de partir —
 * le coût de la perte doit rester proportionnel au travail investi, et
 * l'équipement meurt avec le joueur.
 *
 * Pur, comme tout `logic/` : aucun DOM, aucun hasard non seedé. Les
 * transitions ne modifient jamais l'état reçu.
 *
 * Ce que cette couche existe pour produire, et qui n'existait pas avant elle :
 * **une décision**. Jusqu'ici la cupidité était un curseur — on servait au
 * joueur un deck déjà pollué et il jugeait si c'était supportable. Ici il
 * choisit, à chaque palier, entre une carte qui le rend plus fort et un trésor
 * qui vaut de l'or mais lui coûte une place ; puis entre rentrer et continuer.
 *
 * Trois choses portent la tension, et aucune n'est négociable :
 *
 * 1. **Les PV ne se rechargent pas entre les combats.** On descend avec ce
 *    qu'il reste. C'est la seule raison d'hésiter devant un point de sortie.
 * 2. **La mort fait tout perdre** — sac compris. Non négociable, décision
 *    acquise.
 * 3. **Un trésor refusé est perdu définitivement.** Pas de retour en arrière.
 *
 * Ce qui se gagne en descente — cartes, et plus tard enchantements — ne
 * persiste PAS : ça s'évapore à l'extraction. Seuls le sac et l'équipement
 * rentrent à la maison.
 */
import type { Carte, EtatCombat } from './combat.ts'
import { CONFIG_DEFAUT, creerCombat } from './combat.ts'
import type { Rng } from './rng.ts'
import {
  CAPACITE_SAC,
  carteRecompense,
  ennemisPourProfondeur,
  tresorRecompense,
  valeurSac,
} from './cartes.ts'
import type { Arme } from './armes.ts'
import { ARME_GRATUITE, deckDeLEquipement } from './armes.ts'

/**
 * Les chiffres de la run, rassemblés et injectables — c'est ce qui permet de
 * les balayer en simulation au lieu de les choisir au jugé.
 *
 * `pvMax` n'est PAS celui du combat isolé. Un combat calibré pour être une
 * course serrée consomme presque toute une barre de 30 : on ne peut pas en
 * enchaîner huit. Dans une descente, l'unité de difficulté n'est plus le
 * combat mais la run — chaque combat doit être survivable, c'est
 * l'accumulation qui tue.
 *
 * ATTENTION : ce sont des chiffres de combat, donc des rasoirs. Les
 * revérifier par simulation après y avoir touché, jamais au jugé.
 */
export type Reglage = {
  pvMax: number
  soin: number
  /** La morsure des ennemis au premier palier, en fraction de leur morsure
   *  au dernier. 1 = le duel au couteau d'origine dès le début. */
  menaceDepart: number
  profondeurMax: number
}

/**
 * Calibré par simulation contre le set du Glaive (300 descentes par
 * politique), pas au jugé. Ce que ces chiffres produisent :
 *
 * | politique      | sortir au palier 3 | aller au fond (6) |
 * |----------------|--------------------|-------------------|
 * | tout en cartes | 100 %, 0 d'or      | 51 %, 0 d'or      |
 * | en alternance  | 100 %, 66 d'or     | 57 %, 337 d'or    |
 * | tout en trésor | 100 %, 196 d'or    | 51 %, 586 d'or    |
 *
 * **Sortir ou continuer fonctionne** : 196 d'or garantis contre 297 espérés
 * avec un risque sur deux de tout perdre. C'est un pari.
 *
 * **Carte ou trésor ne fonctionne PAS encore** : entre 0 et 6 points de
 * survie d'écart, soit le bruit de l'échantillon. Ce n'est pas un problème de
 * réglage, c'est structurel — le sac absorbe les trois premiers trésors, donc
 * sur six paliers la cupidité ne mord presque jamais. Trois leviers, et le
 * deuxième est une décision acquise à rouvrir avec Keko : allonger la
 * descente, rétrécir le sac, ou donner plus d'un trésor par palier.
 *
 * **Attention, double rasoir.** La puissance du deck est un levier PLUS
 * tranchant que celle des ennemis : le set du Glaive est 10 % plus faible que
 * l'ancien deck de base, et ça a fait tomber la survie au fond de 50 % à 4 %.
 * Toute retouche d'une carte oblige à refaire ce balayage.
 */
export const REGLAGE_DEFAUT: Reglage = {
  pvMax: 90,
  soin: 14,
  menaceDepart: 0.62,
  profondeurMax: 6,
}

/** Ce qu'on peut prendre à un palier. Refuser les deux est toujours permis. */
export type Offre = { genre: 'carte' | 'tresor'; carte: Carte }

export type Phase =
  | { type: 'combat' }
  | { type: 'recompense'; offres: Offre[] }
  | { type: 'sortie' }
  | { type: 'fin'; issue: 'extrait' | 'mort' }

export type Descente = {
  reglage: Reglage
  /** Ce qui a été emporté. Perdu à la mort, rapporté à l'extraction. */
  equipement: Arme[]
  profondeur: number
  phase: Phase
  combat: EtatCombat
  /** Le deck emporté au prochain combat : cartes de combat + trésors en trop. */
  deck: Carte[]
  /** Les trésors hors du deck. À l'abri du deck, pas de la mort. */
  sac: Carte[]
}

/** Le deck tel qu'il est à la fin d'un combat, pioche et défausse réunies. */
function deckApresCombat(combat: EtatCombat): Carte[] {
  return [...combat.pioche, ...combat.main, ...combat.defausse]
}

function engager(
  profondeur: number,
  deck: Carte[],
  pv: number,
  rng: Rng,
  reglage: Reglage,
): EtatCombat {
  const combat = creerCombat(
    deck,
    ennemisPourProfondeur(profondeur, reglage.profondeurMax, rng, reglage.menaceDepart),
    rng,
    { ...CONFIG_DEFAUT, pvMax: reglage.pvMax },
  )
  // Les PV ne se rechargent pas d'un combat à l'autre : c'est ce qui rend le
  // point de sortie tendu. `creerCombat` repart du maximum, on le corrige ici
  // plutôt que d'alourdir sa signature.
  return { ...combat, pv }
}

export function commencerDescente(
  rng: Rng,
  reglage: Reglage = REGLAGE_DEFAUT,
  equipement: Arme[] = [ARME_GRATUITE],
): Descente {
  // Le deck n'existe pas en soi : c'est la somme des sets de l'équipement.
  const deck = deckDeLEquipement(equipement)
  return {
    reglage,
    equipement,
    profondeur: 1,
    phase: { type: 'combat' },
    combat: engager(1, deck, reglage.pvMax, rng, reglage),
    deck,
    sac: [],
  }
}

/**
 * Referme le combat en cours. Mort : tout est perdu. Victoire au dernier
 * palier : on ressort forcément, il n'y a plus rien en dessous. Sinon, le
 * palier propose son choix.
 */
export function resoudreCombat(descente: Descente, rng: Rng): Descente {
  if (descente.combat.issue === null) return descente

  if (descente.combat.issue === 'defaite') {
    return { ...descente, phase: { type: 'fin', issue: 'mort' } }
  }

  const deck = deckApresCombat(descente.combat)
  const soigne = Math.min(descente.combat.pvMax, descente.combat.pv + descente.reglage.soin)
  const apres: Descente = { ...descente, deck, combat: { ...descente.combat, pv: soigne } }

  // Le dernier palier donne sa récompense comme les autres. Sans ça, atteindre
  // le fond ne rapportait rien de plus que s'arrêter juste avant : la
  // simulation donnait exactement le même butin en sortant au palier 4 ou au
  // palier 6. Le pari n'avait aucune contrepartie.
  const cle = `${descente.profondeur}-${rng.getState()}`
  return {
    ...apres,
    phase: {
      type: 'recompense',
      offres: [
        { genre: 'carte', carte: carteRecompense(descente.profondeur, rng, cle) },
        { genre: 'tresor', carte: tresorRecompense(descente.profondeur, rng, cle) },
      ],
    },
  }
}

/**
 * Ce qui suit un choix de récompense : le point de sortie, ou la fin de la
 * descente si on vient de vider le dernier palier.
 */
function apresChoix(descente: Descente): Phase {
  return descente.profondeur >= descente.reglage.profondeurMax
    ? { type: 'fin', issue: 'extrait' }
    : { type: 'sortie' }
}

/**
 * Prend une des offres. Un trésor va au sac tant qu'il reste de la place ;
 * au-delà il tombe dans le deck et devient une carte morte. C'est tout le
 * jeu, et le joueur doit le voir venir avant de choisir : voir `placeDuSac`.
 */
export function prendre(descente: Descente, index: number): Descente {
  if (descente.phase.type !== 'recompense') return descente
  const offre = descente.phase.offres[index]
  if (offre === undefined) return descente
  const phase = apresChoix(descente)

  if (offre.genre === 'carte') {
    return { ...descente, deck: [...descente.deck, offre.carte], phase }
  }

  if (descente.sac.length < CAPACITE_SAC) {
    return { ...descente, sac: [...descente.sac, offre.carte], phase }
  }
  return { ...descente, deck: [...descente.deck, offre.carte], phase }
}

/** Ne rien prendre. Les deux offres sont perdues définitivement. */
export function laisser(descente: Descente): Descente {
  if (descente.phase.type !== 'recompense') return descente
  return { ...descente, phase: apresChoix(descente) }
}

/** Descendre d'un palier. C'est le pari : plus bas, mais avec ces PV-là. */
export function descendre(descente: Descente, rng: Rng): Descente {
  if (descente.phase.type !== 'sortie') return descente
  const profondeur = descente.profondeur + 1
  return {
    ...descente,
    profondeur,
    phase: { type: 'combat' },
    combat: engager(profondeur, descente.deck, descente.combat.pv, rng, descente.reglage),
  }
}

/** Rentrer avec ce qu'on a. Tout ce qui est transporté est sauvé. */
export function extraire(descente: Descente): Descente {
  if (descente.phase.type !== 'sortie') return descente
  return { ...descente, phase: { type: 'fin', issue: 'extrait' } }
}

/**
 * Ce que vaut le butin transporté : le sac plus les trésors qui ont débordé
 * dans le deck. Sauvé à l'extraction, perdu à la mort — le même chiffre dans
 * les deux cas, c'est ce qui rend la mort lisible.
 */
export function butinTransporte(descente: Descente): number {
  const dansLeDeck = descente.deck.reduce((total, carte) => total + (carte.valeur ?? 0), 0)
  return valeurSac(descente.sac) + dansLeDeck
}

/** Combien de trésors encombrent le deck, et donc la main. */
export function tresorsAuDeck(descente: Descente): number {
  return descente.deck.filter((carte) => carte.type === 'tresor').length
}

/** Ce qu'il reste de place dans le sac. Zéro = le prochain trésor pollue. */
export function placeDuSac(descente: Descente): number {
  return Math.max(0, CAPACITE_SAC - descente.sac.length)
}

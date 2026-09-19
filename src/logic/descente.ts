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
 * Calibré par simulation contre le set du Glaive (300 descentes par politique).
 * Chaque rencontre donne une carte ET un trésor, donc la seule cupidité qui
 * reste est de prendre les trésors qui débordent du sac :
 *
 * | politique              | sortir au palier 3 | aller au fond (6) |
 * |------------------------|--------------------|-------------------|
 * | tout prendre           | 100 %              | 39 %, 589 d'or    |
 * | refuser les débordants | 100 %              | 51 %, 197 d'or    |
 *
 * **La cupidité coûte 12 points de survie.** C'est la première fois qu'elle
 * coûte quelque chose de mesurable — et ce qui l'a créé, c'est d'avoir SUPPRIMÉ
 * le choix carte-ou-trésor. Tant qu'ils s'opposaient, prendre un trésor voulait
 * dire ne pas prendre une carte : on perdait de la puissance sans en gagner,
 * et les deux effets se masquaient. La carte étant désormais acquise dans tous
 * les cas, le trésor est du poids pur et le signal est net.
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

/** Combien d'améliorations sont proposées après un combat. */
export const CHOIX_PAR_PALIER = 3

/**
 * D'où part un trésor qu'on déplace. `main` est celui qu'on tient — le
 * nouveau, ou celui qu'un échange vient de faire sortir du sac.
 */
export type Source = { ou: 'main' } | { ou: 'sac'; emplacement: number }

/**
 * Où il va.
 *
 * Sur un emplacement occupé, c'est un **échange** : les deux trésors changent
 * de place. Venant de la main, celui qui sort devient celui qu'on tient — on
 * peut donc enchaîner les échanges jusqu'à être satisfait. `deck` et `laisser`
 * ne concernent que la main, et referment le sort de ce trésor.
 */
export type Depot =
  | { ou: 'sac'; emplacement: number }
  | { ou: 'deck' }
  | { ou: 'laisser' }

export type Phase =
  | { type: 'combat' }
  /** Une amélioration à choisir parmi plusieurs. */
  | { type: 'recompense'; cartes: Carte[] }
  /**
   * Puis le rangement du butin. `enMain` est le trésor qu'on tient encore ;
   * tant qu'il n'est pas `null`, on ne peut pas terminer.
   */
  | { type: 'butin'; enMain: Carte | null }
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
  /**
   * Les trésors hors du deck — à l'abri du deck, pas de la mort.
   *
   * **Positionnel** : toujours `CAPACITE_SAC` cases, `null` pour une case
   * libre. Une liste compactée remonterait les vides à la fin, et sortir un
   * trésor ferait disparaître sa case au lieu de la laisser ouverte.
   */
  sac: (Carte | null)[]
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
    sac: Array.from({ length: CAPACITE_SAC }, () => null),
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
  const cartes = Array.from({ length: CHOIX_PAR_PALIER }, (_, i) =>
    carteRecompense(descente.profondeur, rng, `${descente.profondeur}-${rng.getState()}-${i}`),
  )
  return { ...apres, phase: { type: 'recompense', cartes } }
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
 * Choisit une amélioration. Elle rejoint le deck pour cette run seulement, puis
 * le trésor du palier se présente.
 */
export function choisirCarte(descente: Descente, index: number, rng: Rng): Descente {
  if (descente.phase.type !== 'recompense') return descente
  const carte = descente.phase.cartes[index]
  if (carte === undefined) return descente

  const cle = `${descente.profondeur}-${rng.getState()}`
  return {
    ...descente,
    deck: [...descente.deck, carte],
    phase: { type: 'butin', enMain: tresorRecompense(descente.profondeur, rng, cle) },
  }
}

/**
 * Déplace un trésor pendant le rangement. Rien n'est validé ici : le palier ne
 * se referme qu'avec `terminerButin`, pour qu'on puisse réarranger son sac
 * autant qu'on veut avant de s'engager.
 *
 * - **main → emplacement libre** : il y entre, on n'a plus rien en main.
 * - **main → emplacement occupé** : ils échangent, et l'ancien passe en main.
 *   On peut donc enchaîner jusqu'à être satisfait.
 * - **emplacement → emplacement** : simple réarrangement du sac.
 * - **main → deck** : on le porte, il pèsera à chaque main.
 * - **main → laisser** : perdu pour de bon, mais rien ne s'alourdit.
 *
 * Seule la main peut aller au deck ou être laissée : vider son sac par là
 * n'aurait aucun sens, et l'échange permet déjà d'en sortir ce qu'on veut.
 */
export function deplacerTresor(descente: Descente, source: Source, depot: Depot): Descente {
  if (descente.phase.type !== 'butin') return descente
  const enMain = descente.phase.enMain

  if (source.ou === 'main') {
    if (enMain === null) return descente
    if (depot.ou === 'laisser') return { ...descente, phase: { type: 'butin', enMain: null } }
    if (depot.ou === 'deck') {
      return {
        ...descente,
        deck: [...descente.deck, enMain],
        phase: { type: 'butin', enMain: null },
      }
    }
    if (depot.emplacement < 0 || depot.emplacement >= CAPACITE_SAC) return descente
    const sac = [...descente.sac]
    const sortant = sac[depot.emplacement] ?? null
    sac[depot.emplacement] = enMain
    return { ...descente, sac, phase: { type: 'butin', enMain: sortant } }
  }

  // Réarrangement interne : seuls deux emplacements du sac s'échangent.
  if (depot.ou !== 'sac') return descente
  const a = source.emplacement
  const b = depot.emplacement
  if (a === b) return descente
  if (a < 0 || a >= CAPACITE_SAC || b < 0 || b >= CAPACITE_SAC) return descente
  const sac = [...descente.sac]
  const gauche = sac[a] ?? null
  if (gauche === null) return descente
  // Échange franc, y compris avec une case vide : la case libérée RESTE
  // ouverte, on peut y remettre le trésor. C'est tout l'intérêt d'un sac
  // positionnel.
  sac[a] = sac[b] ?? null
  sac[b] = gauche
  return { ...descente, sac }
}

/** Referme le palier. Impossible tant qu'on tient encore un trésor. */
export function terminerButin(descente: Descente): Descente {
  if (descente.phase.type !== 'butin' || descente.phase.enMain !== null) return descente
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

/** Combien de trésors le sac porte réellement. */
export function tresorsAuSac(descente: Descente): number {
  return descente.sac.filter((c): c is Carte => c !== null).length
}

/** Ce qu'il reste de place dans le sac. Zéro = le prochain trésor pollue. */
export function placeDuSac(descente: Descente): number {
  return descente.sac.filter((c) => c === null).length
}

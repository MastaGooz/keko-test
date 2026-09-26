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
  carteRecompense,
  ennemisPourProfondeur,
  tresorRecompense,
} from './cartes.ts'
import type { Consommable, Piece } from './armes.ts'
import { ARME_GRATUITE, ARMURE_GRATUITE, carteDuConsommable, deckDeLEquipement } from './armes.ts'

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
  /**
   * Combien de cartes on tient.
   *
   * Cinq depuis l'horloge, et **les maths de l'encombrement n'ont pas bougé**
   * depuis. C'est un réglage et non une constante parce qu'un bijou pourra le
   * changer — « main de 6 » est exactement le genre de règle qu'ils doivent
   * porter — et parce qu'on veut pouvoir regarder une main maxée sans
   * fabriquer un deck à la main.
   */
  tailleMain: number
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
  tailleMain: 5,
}

/** Combien d'améliorations sont proposées après un combat. */
export const CHOIX_PAR_PALIER = 3

/**
 * Un endroit où un trésor peut se trouver pendant le rangement du butin.
 *
 * **LE SAC A DISPARU**, et c'est le changement qui porte tout le reste. Il
 * existait pour que la cupidité soit CHOISIE et non subie : sans lui, le
 * premier trésor ramassé polluait déjà la main. Le choix revient désormais par
 * une autre porte — prendre ou refuser, et jeter d'anciens trésors pour en
 * loger un meilleur — et il est même plus riche qu'avant, puisqu'il porte à
 * chaque trouvaille sur TOUT ce qu'on transporte.
 *
 * Ce qui reste : l'**emplacement de loot** (une case comme une autre, pas « ce
 * qu'on tient »), la **pile du deck** — les trésors qu'on porte et qui pèsent à
 * chaque main — et le **fond du donjon**, qui est un contenant lui aussi : ce
 * qu'on y jette y reste visible et récupérable **jusqu'à `terminerButin`**. Une
 * seule chose s'engage dans cet écran, et c'est le bouton Terminer.
 *
 * Modéliser un lieu plutôt qu'une liste de gestes évite d'empiler les cas
 * particuliers : tout déplacement est « prendre ici, poser là », et l'échange
 * tombe tout seul.
 */
export type Lieu =
  | { ou: 'loot' }
  | { ou: 'deck'; id?: string }
  /** Le slot d'attente : ce qu'on s'apprête à jeter, tant que ce n'est pas validé. */
  | { ou: 'jeter' }

export type Phase =
  | { type: 'combat' }
  /** Une amélioration à choisir parmi plusieurs. */
  | { type: 'recompense'; cartes: Carte[] }
  /**
   * Puis le rangement du butin.
   *
   * `loot` est l'emplacement d'arrivée et `aJeter` le slot de rebut : tant que
   * l'un des deux n'est pas vide, on ne peut pas terminer. `fond` garde ce qui
   * a été jeté ET validé — c'est perdu en terminant, pas avant.
   *
   * **JETER DEMANDE DEUX GESTES**, et c'est voulu : on pose la carte dans le
   * slot, on voit ce qu'on s'apprête à perdre, puis on valide. Sans ça une
   * fausse manip suffisait à condamner une Couronne. Tant qu'elle n'est pas
   * validée, on peut la ressortir du slot — c'est un lieu comme les autres.
   */
  | { type: 'butin'; loot: Carte | null; aJeter: Carte | null; fond: Carte[] }
  | { type: 'sortie' }
  | { type: 'fin'; issue: 'extrait' | 'mort' }

export type Descente = {
  reglage: Reglage
  /** Ce qui a été emporté. Perdu à la mort, rapporté à l'extraction. */
  equipement: Piece[]
  /**
   * Les consommables emportés. **Ils s'épuisent** : ce qui rentre au râtelier
   * n'est pas cette liste mais ce qu'il en reste (`consommablesSurvivants`).
   */
  consommables: Consommable[]
  profondeur: number
  phase: Phase
  combat: EtatCombat
  /** Le deck emporté au prochain combat : cartes de combat + trésors en trop. */
  deck: Carte[]
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
    { ...CONFIG_DEFAUT, pvMax: reglage.pvMax, tailleMain: reglage.tailleMain },
  )
  // Les PV ne se rechargent pas d'un combat à l'autre : c'est ce qui rend le
  // point de sortie tendu. `creerCombat` repart du maximum, on le corrige ici
  // plutôt que d'alourdir sa signature.
  return { ...combat, pv }
}

export function commencerDescente(
  rng: Rng,
  reglage: Reglage = REGLAGE_DEFAUT,
  // Une arme ET une armure, toutes deux gratuites : c'est le chargement de
  // depart, et c'est deja un deck compose de DEUX pieces -- ce que le concept
  // demande, et ce qui montre tout de suite ce que « equiper plus dilue » veut
  // dire (10 cartes deviennent 14, donc le Moulinet sort moins souvent).
  equipement: Piece[] = [ARME_GRATUITE, ARMURE_GRATUITE],
  // LA PILE : des cartes de deck qu'on emporte telles quelles, sans
  // intermédiaire. C'est la seule partie du chargement qui n'est pas générée.
  consommables: Consommable[] = [],
): Descente {
  // Le deck n'existe pas en soi : c'est la somme des sets de l'équipement,
  // plus les consommables, qui sont déjà des cartes.
  const deck = [...deckDeLEquipement(equipement), ...consommables.map(carteDuConsommable)]
  return {
    reglage,
    equipement,
    consommables,
    profondeur: 1,
    phase: { type: 'combat' },
    combat: engager(1, deck, reglage.pvMax, rng, reglage),
    deck,
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
    phase: {
      type: 'butin',
      loot: tresorRecompense(descente.profondeur, rng, cle),
      aJeter: null,
      fond: [],
    },
  }
}

/** L'étal du rangement : les trois contenants, le temps d'un déplacement. */
type Etal = { deck: Carte[]; loot: Carte | null; aJeter: Carte | null; fond: Carte[] }

/** Retire le trésor qui se trouve à ce lieu, et laisse la place vide. */
function prendre(etal: Etal, lieu: Lieu): { carte: Carte | null; etal: Etal } {
  if (lieu.ou === 'loot') return { carte: etal.loot, etal: { ...etal, loot: null } }


  if (lieu.ou === 'deck') {
    const i = etal.deck.findIndex((c) => c.type === 'tresor' && c.id === lieu.id)
    if (i < 0) return { carte: null, etal }
    const deck = [...etal.deck]
    const [carte] = deck.splice(i, 1)
    return { carte: carte ?? null, etal: { ...etal, deck } }
  }

  // Le slot de rebut : on peut en ressortir la carte tant qu'on n'a pas validé.
  return { carte: etal.aJeter, etal: { ...etal, aJeter: null } }
}

/** Pose le trésor à ce lieu, et renvoie celui qu'il en délogeait. */
function poser(etal: Etal, lieu: Lieu, carte: Carte): { sortant: Carte | null; etal: Etal } {
  if (lieu.ou === 'loot') return { sortant: etal.loot, etal: { ...etal, loot: carte } }


  // La pile du deck n'a pas de places : on pose dessus.
  if (lieu.ou === 'deck') return { sortant: null, etal: { ...etal, deck: [...etal.deck, carte] } }

  // Le slot de rebut n'en tient qu'une : ce qui s'y trouvait déjà ressort, il
  // n'est pas écrasé. Une carte qui disparaît en en posant une autre serait
  // exactement la fausse manip que ce slot existe pour empêcher.
  return { sortant: etal.aJeter, etal: { ...etal, aJeter: carte } }
}

/**
 * Déplace un trésor d'un lieu à un autre. Rien n'est validé ici : le palier ne
 * se referme qu'avec `terminerButin`, pour qu'on puisse réarranger autant
 * qu'on veut avant de s'engager.
 *
 * L'échange n'est pas un cas particulier : ce que la destination délogeait
 * repart simplement à la place qu'on vient de libérer.
 */
export function deplacerTresor(descente: Descente, source: Lieu, cible: Lieu): Descente {
  if (descente.phase.type !== 'butin') return descente

  const depart: Etal = {
    deck: descente.deck,
    loot: descente.phase.loot,
    aJeter: descente.phase.aJeter,
    fond: descente.phase.fond,
  }
  const { carte, etal: vide } = prendre(depart, source)
  if (carte === null) return descente

  const { sortant, etal: pose } = poser(vide, cible, carte)
  const final = sortant === null ? pose : poser(pose, source, sortant).etal

  return {
    ...descente,
    deck: final.deck,
    phase: { type: 'butin', loot: final.loot, aJeter: final.aJeter, fond: final.fond },
  }
}

/**
 * Referme le palier. Impossible tant que l'emplacement de loot est occupé —
 * et c'est ici, et seulement ici, que ce qui traîne au fond est perdu.
 */
export function terminerButin(descente: Descente): Descente {
  if (descente.phase.type !== 'butin') return descente
  // Ni trésor en attente d'arrivée, ni carte en attente d'être jetée : on ne
  // referme pas l'écran sur une décision qui n'est pas prise.
  if (descente.phase.loot !== null || descente.phase.aJeter !== null) return descente
  return { ...descente, phase: apresChoix(descente) }
}

/**
 * Range un trésor à une autre place parmi ceux qu'on porte.
 *
 * **Ça n'a aucun effet sur les règles** — le deck est mélangé au combat suivant
 * — mais ça passe quand même par l'état, pour la même raison que la main de
 * combat : le rendu se reconstruit à chaque geste, donc un ordre qui ne vivrait
 * que dans le DOM serait balayé au premier déplacement.
 *
 * `vers` est le rang VOULU parmi les trésors, la carte déplacée étant retirée.
 */
export function reordonnerTresors(descente: Descente, id: string, vers: number): Descente {
  if (descente.phase.type !== 'butin') return descente

  const tresors = descente.deck.filter((c) => c.type === 'tresor')
  const carte = tresors.find((c) => c.id === id)
  if (carte === undefined) return descente

  const restants = tresors.filter((c) => c !== carte)
  const place = Math.max(0, Math.min(restants.length, vers))
  restants.splice(place, 0, carte)

  // Les cartes de combat gardent leur place : on ne réordonne que le butin.
  let i = 0
  const deck = descente.deck.map((c) => (c.type === 'tresor' ? restants[i++]! : c))
  return { ...descente, deck }
}

/**
 * Confirme le rebut : la carte du slot rejoint le tas des jetés, et le slot se
 * libère pour la suivante.
 *
 * **C'est ce qui permet d'en jeter plusieurs d'affilée** — le slot n'en tient
 * qu'une, et sans validation il restait bloqué par la première. Le tas, lui,
 * n'est perdu qu'en terminant : valider n'est pas détruire, c'est ranger.
 */
export function validerJet(descente: Descente): Descente {
  if (descente.phase.type !== 'butin' || descente.phase.aJeter === null) return descente
  return {
    ...descente,
    phase: {
      ...descente.phase,
      aJeter: null,
      fond: [...descente.phase.fond, descente.phase.aJeter],
    },
  }
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
 * Ce que vaut le butin transporté. Sauvé à l'extraction, perdu à la mort — le
 * même chiffre dans les deux cas, c'est ce qui rend la mort lisible.
 *
 * **Tout le butin est dans le deck**, il n'y a plus de sac : un trésor pris est
 * une carte de plus, tout de suite. Et un trésor BRÛLÉ ne compte plus, puisque
 * la carte est détruite au lieu d'être défaussée — c'est ce qui donne son prix
 * au pouvoir qu'on en tire.
 */
export function butinTransporte(descente: Descente): number {
  return descente.deck.reduce((total, carte) => total + (carte.valeur ?? 0), 0)
}

/**
 * LES TRÉSORS QU'ON RAPPORTE, un par un.
 *
 * `butinTransporte` en donne la VALEUR ; celle-ci donne les cartes. Le coffre
 * du hub les garde pour qu'on voie ce qu'on a sorti du donjon — *un total ne
 * montre pas un butin*, et c'est la même raison qui a fait dessiner le loot en
 * cartes plutôt qu'en lignes de texte.
 */
export function tresorsTransportes(descente: Descente): Carte[] {
  return descente.deck.filter((carte) => carte.type === 'tresor')
}

/** Combien de trésors encombrent le deck, et donc la main. */
export function tresorsAuDeck(descente: Descente): number {
  return descente.deck.filter((carte) => carte.type === 'tresor').length
}

/**
 * Les consommables qui rentrent au râtelier : ceux qu'on n'a PAS bus.
 *
 * Une potion bue s'exile — elle quitte la pioche, la main et la défausse —
 * donc elle n'est plus dans le deck. *Il n'y a rien à compter : l'état dit
 * déjà ce qui reste.* C'est ce qui fait d'une potion la première ressource du
 * jeu qui s'épuise pour de bon.
 *
 * À la mort, on n'appelle pas ceci : tout est perdu, pile comprise.
 */
export function consommablesSurvivants(descente: Descente): Consommable[] {
  const restants = new Set(descente.deck.map((carte) => carte.id))
  return descente.consommables.filter((c) => restants.has(c.id))
}

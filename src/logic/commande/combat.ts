/**
 * LA COMMANDE ACTION — `?commande`, un side project (Keko, 07/11 : « un jeu à
 * commande action (style Paper Mario), ça se fait ? » puis « vas-y, fais un
 * proto »). Un combat au tour par tour où le bon geste au bon moment change
 * le coup :
 *
 * - le SAUT retombe sur l'ennemi ; une tape à l'atterrissage le fait
 *   REBONDIR (un coup de plus, une fenêtre plus étroite à chaque fois) ;
 * - le MARTEAU se charge doigt posé ; lâché quand la charge est pleine, il
 *   frappe fort, trop tôt ou trop tard, il frappe mou ;
 * - pendant le tour de l'ennemi, une tape juste avant le coup PARE (un dégât
 *   de moins) ; plus juste encore, la parade est PARFAITE (aucun dégât, une
 *   riposte). Une tape ratée bloque la garde un instant : on ne pare pas en
 *   tapotant.
 *
 * Puis « faudrait un genre de roguelike où on progresse sur des ennemis de
 * plus en plus forts et où on gagne des améliorations » : une COURSE sans
 * fin, étage par étage. Après chaque victoire, le héros souffle (quelques PV)
 * et choisit une amélioration parmi trois ; les ennemis grossissent avec
 * l'étage, de nouveaux types arrivent, un chef tous les cinq étages.
 *
 * Puis « un peu pauvre en strat long terme » : **la course passe par une
 * CARTE** (`carte.ts`) — on choisit sa route d'un acte à l'autre, entre
 * combats, élites (plus dures, mieux payées), feux de camp (se soigner ou
 * s'entraîner), boutiques et événements (un pari) ; les victoires rapportent
 * de l'OR, d'autant plus que les gestes étaient justes ; l'or s'échange à la
 * boutique contre des améliorations et des OBJETS, qu'on garde dans le sac
 * pour le bon moment (la potion, la bombe, le fumigène, le piment).
 *
 * Pur : le temps est injecté, en secondes, sur la même horloge pour `avancer`
 * et pour les gestes — la page donne l'horodatage de l'événement, pas
 * l'instant où elle le traite. Une décision qui attend un geste attend aussi
 * `delai` de plus : le geste peut arriver un peu après l'instant qu'il porte.
 * Tout tirage passe par la graine.
 */
import { createRng, type Rng } from '../rng.ts'
import { accessibles, CARTE, nouvelleCarte, type Carte, type Place, type Salle } from './carte.ts'

export type TypeEnnemi = 'brigand' | 'piques' | 'lutin' | 'brute' | 'chapardeur'

export type Modele = {
  nom: string
  /** Le nom de son chef. */
  chef: string
  /** Ce que la page en dit au moment de choisir. */
  conseil: string
  pv: number
  attaque: number
  /** Le nombre de coups par tour. */
  coups: number
  /** L'élan avant la ruée, tiré entre ces deux durées : on ne pare pas au métronome. */
  elanMin: number
  elanMax: number
  /** Sauter dessus blesse le héros. */
  piques: boolean
  /** Le marteau ne l'atteint pas. */
  volant: boolean
  /** Le premier étage où il peut paraître. */
  depuis: number
}

/** L'ennemi en scène : un modèle, grossi pour son étage. */
export type Ennemi = Omit<Modele, 'chef' | 'depuis'> & { type: TypeEnnemi; estChef: boolean }

export type Bonus = 'bottes' | 'ressort' | 'semelles' | 'marteau' | 'poigne' | 'bouclier' | 'reflexes' | 'contre' | 'epines' | 'coeur' | 'repas'

export const COMMANDE = {
  heros: { pv: 10 },
  /** L'ennemi entre en scène. */
  arrivee: 0.8,
  /** Le héros court jusqu'à l'ennemi, puis revient. */
  course: 0.45,
  retour: 0.5,
  /** L'ennemi abattu tombe avant le choix de l'amélioration. */
  ko: 0.7,
  /** Les PV rendus après chaque victoire. */
  repos: 2,
  /** Le temps qu'un geste met à arriver après l'instant qu'il porte. */
  delai: 0.03,
  saut: {
    /** De l'envol à la première retombée. */
    envol: 0.5,
    /** Du premier atterrissage au deuxième ; chaque rebond suivant est plus court. */
    rebond: 0.5,
    raccourci: 0.88,
    /** Le nombre d'atterrissages au plus. */
    max: 5,
    degats: 1,
    /** La fenêtre du rebond : tant avant l'atterrissage, tant après ; elle se resserre à chaque rebond. */
    avant: 0.16,
    apres: 0.06,
    resserre: 0.85,
    /** Sauter sur des piques. */
    piques: 1,
  },
  marteau: {
    /** Sans appui, le héros frappe mou au bout de ce temps. */
    attente: 2,
    /** Le temps de charge, puis la zone où lâcher. */
    charge: 0.8,
    zone: 0.35,
    /** Du lâcher au coup. */
    elan: 0.15,
    /** Le coup porté, le héros reste un instant avant de revenir. */
    pause: 0.25,
    fort: 3,
    faible: 1,
  },
  garde: {
    avant: 0.16,
    apres: 0.05,
    parfaiteAvant: 0.07,
    parfaiteApres: 0.03,
    /** Après une tape, la garde est bloquée ce temps-là. */
    verrou: 0.45,
    /** Les dégâts qu'ôte une garde. */
    reduit: 1,
    riposte: 1,
  },
  ennemi: { ruee: 0.25, recul: 0.45 },
  /** Ce que l'étage fait aux ennemis ; l'étage est le rang de la carte, compté d'un acte à l'autre. */
  etages: {
    /** Les PV grossissent de tant par étage. */
    croissance: 0.2,
    /** Un point d'attaque de plus tous les tant d'étages. */
    attaqueTous: 4,
    /** Le chef d'un acte : plus de PV, un point d'attaque et un coup de plus. */
    chef: { pv: 2.2, attaque: 1, coups: 1 },
    /** L'élite : plus de PV, un point d'attaque. */
    elite: { pv: 1.6, attaque: 1 },
  },
  /** Ce qu'on trouve hors des combats. */
  salles: {
    /** L'or d'une victoire selon la salle ; chaque geste réussi y ajoute 1 (une parade parfaite, 2). */
    or: { combat: 10, elite: 25, chef: 45 } as Record<'combat' | 'elite' | 'chef', number>,
    /** Le feu de camp rend cette part des PV max. */
    feu: 0.4,
    /** Le sac tient tant d'objets ; on part avec une potion. */
    sac: 3,
    prix: { bonus: 45, objet: 20, soin: 15 },
    /** Ce que rend le soin de la boutique. */
    soin: 6,
    potion: 5,
    bombe: 6,
    /** Le marchand louche de l'événement. */
    marchand: 15,
  },
  modeles: {
    brigand: { nom: 'Brigand', chef: 'Chef brigand', conseil: 'Rien de spécial.', pv: 5, attaque: 2, coups: 1, elanMin: 0.5, elanMax: 1.3, piques: false, volant: false, depuis: 1 },
    piques: { nom: 'Garde à piques', chef: 'Capitaine à piques', conseil: 'Des piques sur le casque : ne sautez pas dessus.', pv: 6, attaque: 2, coups: 1, elanMin: 0.5, elanMax: 1.3, piques: true, volant: false, depuis: 2 },
    lutin: { nom: 'Lutin ailé', chef: 'Reine des lutins', conseil: 'Il vole, hors de portée du marteau.', pv: 5, attaque: 2, coups: 2, elanMin: 0.45, elanMax: 1.1, piques: false, volant: true, depuis: 3 },
    brute: { nom: 'Brute', chef: 'Brute énorme', conseil: 'Lente à frapper, mais elle frappe fort : attendez-la.', pv: 9, attaque: 4, coups: 1, elanMin: 1.2, elanMax: 2.2, piques: false, volant: false, depuis: 4 },
    chapardeur: { nom: 'Chapardeur', chef: 'Maître chapardeur', conseil: 'De petits coups, très vite.', pv: 4, attaque: 1, coups: 3, elanMin: 0.25, elanMax: 0.6, piques: false, volant: false, depuis: 7 },
  } as Record<TypeEnnemi, Modele>,
  /** Une amélioration se prend au plus tant de fois (sauf le cœur et le repas). */
  bonusMax: 3,
  bonus: {
    /** +1 dégât à chaque atterrissage. */
    bottes: 1,
    /** +1 atterrissage au plus. */
    ressort: 1,
    /** La fenêtre du rebond, élargie de tant. */
    semelles: 0.3,
    /** +2 au coup fort du marteau. */
    marteau: 2,
    /** La zone où lâcher le marteau, élargie de tant. */
    poigne: 0.4,
    /** La garde ôte un dégât de plus. */
    bouclier: 1,
    /** Les fenêtres de la garde, élargies de tant. */
    reflexes: 0.3,
    /** +1 à la riposte de la parade parfaite. */
    contre: 1,
    /** Une garde (même pas parfaite) renvoie tant de dégâts. */
    epines: 1,
    /** +3 PV max, rendus aussitôt. */
    coeur: 3,
    /** Rend tant de PV. */
    repas: 5,
  } as Record<Bonus, number>,
}

export type ConfigCommande = typeof COMMANDE

export type Objet = 'potion' | 'bombe' | 'fumigene' | 'piment'
export const OBJETS: Record<Objet, { nom: string; effet: string }> = {
  potion: { nom: 'Potion', effet: 'Rend 5 PV' },
  bombe: { nom: 'Bombe', effet: '6 dégâts, sans geste' },
  fumigene: { nom: 'Fumigène', effet: "L'ennemi passe son prochain tour" },
  piment: { nom: 'Piment', effet: 'La prochaine attaque fait double dégâts' },
}

export type CleEvenement = 'fontaine' | 'marchand' | 'coffre' | 'autel'
export const EVENEMENTS: Record<CleEvenement, { titre: string; texte: string; accepter: string }> = {
  fontaine: { titre: 'La fontaine trouble', texte: 'Une fontaine à l’eau trouble. Elle peut fortifier… ou rendre malade.', accepter: 'Boire' },
  marchand: { titre: 'Le marchand louche', texte: 'Un marchand propose un paquet ficelé, sans dire ce qu’il contient.', accepter: 'Payer 15 or' },
  coffre: { titre: 'Le coffre piégé', texte: 'Un coffre au milieu du couloir. Sûrement piégé.', accepter: 'L’ouvrir' },
  autel: { titre: 'L’autel', texte: 'Un autel réclame du sang, et promet un don en échange.', accepter: 'Offrir 4 PV' },
}

export type Article = ({ sorte: 'bonus'; bonus: Bonus } | { sorte: 'objet'; objet: Objet } | { sorte: 'soin' }) & { prix: number; vendu: boolean }

export type Phase = 'carte' | 'arrivee' | 'choix' | 'saut' | 'marteau' | 'ennemi' | 'ko' | 'butin' | 'repos' | 'boutique' | 'evenement' | 'perdu'
export type Attaque = 'saut' | 'marteau'

export type Atterrissage = {
  t: number
  /** La part de la fenêtre avant l'atterrissage (elle se resserre). */
  avant: number
  tape: 'aucune' | 'bien' | 'rate'
  /** Le coup est porté (à l'atterrissage même). */
  porte: boolean
  /** Le rebond est décidé (après la fenêtre). */
  resolu: boolean
}

export type Coup = { elan: number; impact: number; garde: 'aucune' | 'garde' | 'parfaite'; resolu: boolean }

export type EtatCombat = {
  graine: number
  phase: Phase
  /** L'instant où la phase a commencé. */
  debut: number
  pv: number
  /** L'étage, à partir de 1 : le rang de la carte, compté d'un acte à l'autre. */
  etage: number
  acte: number
  carte: Carte
  /** La salle où l'on est (`null` avant la première de l'acte), et celles par où l'on est passé. */
  place: Place | null
  chemin: Place[]
  salle: Salle
  or: number
  objets: Objet[]
  /** Les gestes réussis dans ce combat (ils paient). */
  gestes: number
  /** Le piment : la prochaine attaque fait double dégâts ; le fumigène : l'ennemi passe son prochain tour. */
  piment: boolean
  fumee: boolean
  boutique: Article[]
  evenement: { cle: CleEvenement; issue: string | null } | null
  ennemi: Ennemi
  pvEnnemi: number
  /** Les améliorations prises, et combien de fois. */
  bonus: Partial<Record<Bonus, number>>
  /** Les trois améliorations offertes, en phase `butin`. */
  offre: Bonus[]
  atterrissages: Atterrissage[]
  marteau: { arrivee: number; appui: number | null; frappe: number | null; fort: boolean; pleine: boolean; porte: boolean }
  coups: Coup[]
  /** La garde est bloquée jusque-là. */
  verrou: number
  /** La dernière tape de garde (la page lève le bouclier). */
  gardeA: number
  /** L'instant où le héros repart vers sa place, son action finie. */
  retour: number | null
  /** L'instant où l'ennemi est tombé. */
  koA: number
  stats: { rebonds: number; charges: number; gardes: number; parfaites: number }
}

export type Evenement =
  | { type: 'arrivee'; etage: number; chef: boolean; elite: boolean }
  | { type: 'bien'; serie: number }
  | { type: 'rate' }
  | { type: 'atterrit'; degats: number; serie: number }
  | { type: 'piques'; degats: number }
  | { type: 'pleine' }
  | { type: 'frappe'; degats: number; fort: boolean }
  | { type: 'garde'; qualite: 'garde' | 'parfaite' | 'trop-tot' }
  | { type: 'coup'; degats: number; garde: 'aucune' | 'garde' | 'parfaite' }
  | { type: 'riposte'; degats: number }
  | { type: 'ko' }
  | { type: 'tour' }
  | { type: 'butin'; soin: number; or: number; objet: Objet | null }
  | { type: 'objet'; objet: Objet; degats: number }
  | { type: 'fumee' }
  | { type: 'acte'; acte: number }
  | { type: 'perdu' }

// ---------------------------------------------------------------- l'étage

export type Rang = 'combat' | 'elite' | 'chef'

/** Un ennemi de ce type, grossi pour son étage ; une élite ou un chef, plus forts. */
export function ennemiDuType(c: ConfigCommande, type: TypeEnnemi, etage: number, sorte: Rang = 'combat'): Ennemi {
  const m = c.modeles[type]
  const chef = sorte === 'chef'
  const elite = sorte === 'elite'
  const grossi = 1 + c.etages.croissance * (etage - 1)
  const attaque = m.attaque + Math.floor((etage - 1) / c.etages.attaqueTous)
  const coups = m.coups + (chef ? c.etages.chef.coups : 0)
  const titre = chef ? 'Un chef : plus solide et plus fort.' : elite ? 'Une élite : plus solide et plus forte, elle rapporte plus.' : ''
  return {
    type,
    nom: chef ? m.chef : elite ? `${m.nom} d’élite` : m.nom,
    // « Rien de spécial » ne se dit pas d'un chef ni d'une élite.
    conseil: [titre, titre !== '' && type === 'brigand' ? '' : m.conseil, coups > 1 ? `${coups} coups par tour.` : ''].filter((x) => x !== '').join(' '),
    pv: Math.round(m.pv * grossi * (chef ? c.etages.chef.pv : elite ? c.etages.elite.pv : 1)),
    attaque: attaque + (chef ? c.etages.chef.attaque : elite ? c.etages.elite.attaque : 0),
    coups,
    elanMin: m.elanMin,
    elanMax: m.elanMax,
    piques: m.piques,
    volant: m.volant,
    estChef: chef,
  }
}

/** L'ennemi d'une salle : un type nouveau se montre d'abord seul, dans un combat simple ; sinon le hasard parmi ceux qui sont arrivés. */
function ennemiDeLEtage(c: ConfigCommande, etage: number, sorte: Rang, rng: Rng): Ennemi {
  const types = Object.keys(c.modeles) as TypeEnnemi[]
  const neuf = types.find((k) => c.modeles[k].depuis === etage)
  if (neuf !== undefined && sorte === 'combat') return ennemiDuType(c, neuf, etage)
  const arrives = types.filter((k) => c.modeles[k].depuis <= etage)
  return ennemiDuType(c, arrives[Math.floor(rng.next() * arrives.length)], etage, sorte)
}

// ---------------------------------------------------------------- les améliorations

const rang = (e: EtatCombat, b: Bonus) => e.bonus[b] ?? 0

export function pvMaxDe(c: ConfigCommande, e: EtatCombat): number {
  return c.heros.pv + rang(e, 'coeur') * c.bonus.coeur
}

const degatsDuSaut = (c: ConfigCommande, e: EtatCombat) => c.saut.degats + rang(e, 'bottes') * c.bonus.bottes
const sautsMax = (c: ConfigCommande, e: EtatCombat) => c.saut.max + rang(e, 'ressort') * c.bonus.ressort
const largeurDuRebond = (c: ConfigCommande, e: EtatCombat) => 1 + rang(e, 'semelles') * c.bonus.semelles
const coupFort = (c: ConfigCommande, e: EtatCombat) => c.marteau.fort + rang(e, 'marteau') * c.bonus.marteau
/** La zone où lâcher le marteau, améliorations comprises. */
export function zoneDuMarteau(c: ConfigCommande, e: EtatCombat): number {
  return c.marteau.zone * (1 + rang(e, 'poigne') * c.bonus.poigne)
}
const largeurDeGarde = (c: ConfigCommande, e: EtatCombat) => 1 + rang(e, 'reflexes') * c.bonus.reflexes

/** Ce qu'une amélioration offerte dit d'elle, pour la page. */
export const BONUS: Record<Bonus, { nom: string; effet: string }> = {
  bottes: { nom: 'Bottes ferrées', effet: '+1 dégât à chaque atterrissage' },
  ressort: { nom: 'Ressort', effet: 'Un rebond de plus au saut' },
  semelles: { nom: 'Semelles souples', effet: 'Le rebond se prend plus facilement' },
  marteau: { nom: 'Gros marteau', effet: '+2 dégâts au marteau chargé' },
  poigne: { nom: 'Bonne poigne', effet: 'Plus de temps pour lâcher le marteau' },
  bouclier: { nom: 'Bouclier', effet: 'La garde ôte un dégât de plus' },
  reflexes: { nom: 'Réflexes', effet: 'La garde se prend plus facilement' },
  contre: { nom: 'Contre', effet: '+1 dégât à la riposte de la parade parfaite' },
  epines: { nom: 'Épines', effet: 'Chaque garde renvoie un dégât' },
  coeur: { nom: 'Cœur', effet: '+3 PV max' },
  repas: { nom: 'Repas', effet: 'Rend 5 PV' },
}

/** Trois améliorations différentes : pas une qui soit au plus haut, pas de repas si le héros est en pleine forme. */
function offrir(c: ConfigCommande, e: EtatCombat, rng: Rng): Bonus[] {
  const possibles = (Object.keys(BONUS) as Bonus[]).filter((b) => {
    if (b === 'repas') return e.pv < pvMaxDe(c, e)
    if (b === 'coeur') return true
    return rang(e, b) < c.bonusMax
  })
  const offre: Bonus[] = []
  while (offre.length < 3 && possibles.length > 0) offre.push(possibles.splice(Math.floor(rng.next() * possibles.length), 1)[0])
  return offre
}

export function rangDuBonus(e: EtatCombat, b: Bonus): number {
  return rang(e, b)
}

// ---------------------------------------------------------------- le combat

/** Une course neuve, devant la carte de l'acte `acte`. */
export function nouvelleCourse(c: ConfigCommande, graine: number, t: number, acte = 1): EtatCombat {
  const rng = createRng(graine)
  const carte = nouvelleCarte(rng)
  const e = etatNeuf(c, rng.getState(), t, carte, ennemiDuType(c, 'brigand', 1))
  e.acte = acte
  e.etage = (acte - 1) * CARTE.rangs
  e.phase = 'carte'
  return e
}

/** Un combat d'emblée, à l'étage `etage` (pour les vérifications). */
export function nouveauCombat(c: ConfigCommande, graine: number, t: number, etage = 1): EtatCombat {
  const rng = createRng(graine)
  const carte = nouvelleCarte(rng)
  const e = etatNeuf(c, 0, t, carte, ennemiDeLEtage(c, etage, 'combat', rng))
  e.graine = rng.getState()
  e.etage = etage
  return e
}

function etatNeuf(c: ConfigCommande, graine: number, t: number, carte: Carte, ennemi: Ennemi): EtatCombat {
  return {
    graine,
    phase: 'arrivee',
    debut: t,
    pv: c.heros.pv,
    etage: 1,
    acte: 1,
    carte,
    place: null,
    chemin: [],
    salle: 'combat',
    or: 0,
    objets: ['potion'],
    gestes: 0,
    piment: false,
    fumee: false,
    boutique: [],
    evenement: null,
    ennemi,
    pvEnnemi: ennemi.pv,
    bonus: {},
    offre: [],
    atterrissages: [],
    marteau: { arrivee: 0, appui: null, frappe: null, fort: false, pleine: false, porte: false },
    coups: [],
    verrou: -Infinity,
    gardeA: -Infinity,
    retour: null,
    koA: -Infinity,
    stats: { rebonds: 0, charges: 0, gardes: 0, parfaites: 0 },
  }
}

export function ennemiDe(_c: ConfigCommande, e: EtatCombat): Ennemi {
  return e.ennemi
}

export function peutAttaquer(_c: ConfigCommande, e: EtatCombat, a: Attaque): boolean {
  return e.phase === 'choix' && !(a === 'marteau' && e.ennemi.volant)
}

function passer(e: EtatCombat, phase: Phase, t: number): void {
  e.phase = phase
  e.debut = t
  e.retour = null
}

function blesserLEnnemi(e: EtatCombat, degats: number, t: number, ev: Evenement[]): void {
  if (e.pvEnnemi <= 0) return
  e.pvEnnemi = Math.max(0, e.pvEnnemi - degats)
  if (e.pvEnnemi === 0) {
    e.koA = t
    ev.push({ type: 'ko' })
  }
}

/** Le tour de l'ennemi : ses coups sont tirés d'avance, chacun son élan. */
function commencerLeTour(e: EtatCombat, c: ConfigCommande, t0: number, ev: Evenement[]): void {
  const rng = createRng(e.graine)
  e.coups = []
  let s = t0
  for (let i = 0; i < e.ennemi.coups; i++) {
    const elan = e.ennemi.elanMin + rng.next() * (e.ennemi.elanMax - e.ennemi.elanMin)
    const impact = s + elan + c.ennemi.ruee
    e.coups.push({ elan: s, impact, garde: 'aucune', resolu: false })
    s = impact + c.ennemi.recul
  }
  e.graine = rng.getState()
  e.verrou = -Infinity
  passer(e, 'ennemi', t0)
  ev.push({ type: 'tour' })
}

/** L'action du héros est finie quand il est revenu à sa place. */
function finDeLAction(c: ConfigCommande, e: EtatCombat, t: number, ev: Evenement[]): boolean {
  if (e.retour === null) return false
  const fin = e.retour + c.retour
  if (t < fin) return false
  e.piment = false
  if (e.pv <= 0) {
    passer(e, 'perdu', fin)
    ev.push({ type: 'perdu' })
  } else if (e.pvEnnemi <= 0) passer(e, 'ko', fin)
  else if (e.fumee) {
    // Le fumigène : l'ennemi tousse, c'est encore au héros.
    e.fumee = false
    passer(e, 'choix', fin)
    ev.push({ type: 'fumee' })
  } else commencerLeTour(e, c, fin, ev)
  return true
}

/** Une transition, s'il y en a une à faire à l'instant `t` ; `false` quand tout est à jour. */
function unPas(c: ConfigCommande, e: EtatCombat, t: number, ev: Evenement[]): boolean {
  switch (e.phase) {
    case 'arrivee':
      if (t < e.debut + c.arrivee) return false
      passer(e, 'choix', e.debut + c.arrivee)
      return true

    case 'saut': {
      const a = e.atterrissages[e.atterrissages.length - 1]
      if (!a.porte) {
        if (t < a.t) return false
        a.porte = true
        if (e.ennemi.piques) {
          e.pv = Math.max(0, e.pv - c.saut.piques)
          ev.push({ type: 'piques', degats: c.saut.piques })
          a.resolu = true
          e.retour = a.t
          return true
        }
        const degats = degatsDuSaut(c, e) * (e.piment ? 2 : 1)
        blesserLEnnemi(e, degats, a.t, ev)
        ev.push({ type: 'atterrit', degats, serie: e.atterrissages.length })
        return true
      }
      if (!a.resolu) {
        if (t < a.t + c.saut.apres * largeurDuRebond(c, e) + c.delai) return false
        a.resolu = true
        const n = e.atterrissages.length
        if (a.tape === 'bien' && n < sautsMax(c, e) && e.pvEnnemi > 0) {
          e.atterrissages.push({ t: a.t + c.saut.rebond * c.saut.raccourci ** (n - 1), avant: a.avant * c.saut.resserre, tape: 'aucune', porte: false, resolu: false })
        } else e.retour = a.t
        return true
      }
      return finDeLAction(c, e, t, ev)
    }

    case 'marteau': {
      const m = e.marteau
      if (m.frappe === null) {
        if (m.appui === null) {
          if (t < m.arrivee + c.marteau.attente + c.delai) return false
          m.frappe = m.arrivee + c.marteau.attente
          m.fort = false
          return true
        }
        if (!m.pleine && t >= m.appui + c.marteau.charge) {
          m.pleine = true
          ev.push({ type: 'pleine' })
          return true
        }
        const fin = m.appui + c.marteau.charge + zoneDuMarteau(c, e)
        if (t < fin + c.delai) return false
        // Tenu trop longtemps : le héros frappe mou de lui-même.
        m.frappe = fin
        m.fort = false
        return true
      }
      if (!m.porte) {
        if (t < m.frappe + c.marteau.elan) return false
        m.porte = true
        const degats = (m.fort ? coupFort(c, e) : c.marteau.faible) * (e.piment ? 2 : 1)
        if (m.fort) {
          e.stats.charges += 1
          e.gestes += 1
        }
        blesserLEnnemi(e, degats, m.frappe + c.marteau.elan, ev)
        ev.push({ type: 'frappe', degats, fort: m.fort })
        e.retour = m.frappe + c.marteau.elan + c.marteau.pause
        return true
      }
      return finDeLAction(c, e, t, ev)
    }

    case 'ennemi': {
      for (let i = 0; i < e.coups.length; i++) {
        const k = e.coups[i]
        if (k.resolu) continue
        if (t < k.impact + c.garde.apres * largeurDeGarde(c, e) + c.delai) return false
        k.resolu = true
        const reduit = c.garde.reduit + rang(e, 'bouclier') * c.bonus.bouclier
        const degats = k.garde === 'parfaite' ? 0 : k.garde === 'garde' ? Math.max(0, e.ennemi.attaque - reduit) : e.ennemi.attaque
        e.pv = Math.max(0, e.pv - degats)
        ev.push({ type: 'coup', degats, garde: k.garde })
        if (k.garde === 'garde') {
          e.stats.gardes += 1
          e.gestes += 1
        }
        if (k.garde === 'parfaite') {
          e.stats.parfaites += 1
          e.gestes += 2
        }
        // La riposte de la parade parfaite, les épines de toute garde.
        const renvoi = (k.garde === 'parfaite' ? c.garde.riposte + rang(e, 'contre') * c.bonus.contre : 0) + (k.garde !== 'aucune' ? rang(e, 'epines') * c.bonus.epines : 0)
        if (renvoi > 0) {
          blesserLEnnemi(e, renvoi, k.impact, ev)
          ev.push({ type: 'riposte', degats: renvoi })
        }
        if (e.pv <= 0) {
          passer(e, 'perdu', t)
          ev.push({ type: 'perdu' })
        } else if (e.pvEnnemi <= 0) e.coups.length = i + 1 // abattu en pleine attaque : il ne frappe plus
        return true
      }
      const fin = e.coups[e.coups.length - 1].impact + c.ennemi.recul
      if (t < fin) return false
      passer(e, e.pvEnnemi <= 0 ? 'ko' : 'choix', fin)
      return true
    }

    case 'ko': {
      if (t < e.debut + c.ko) return false
      // Le héros souffle, ramasse l'or (et l'objet d'une élite), puis choisit son amélioration.
      const soin = Math.min(c.repos, pvMaxDe(c, e) - e.pv)
      e.pv += soin
      const salle = e.salle === 'elite' || e.salle === 'chef' ? e.salle : 'combat'
      const or = c.salles.or[salle] + e.gestes
      e.or += or
      const rng = createRng(e.graine)
      let objet: Objet | null = null
      if (salle === 'elite' && e.objets.length < c.salles.sac) {
        objet = objetAuHasard(rng)
        e.objets.push(objet)
      }
      e.offre = offrir(c, e, rng)
      e.graine = rng.getState()
      passer(e, 'butin', e.debut + c.ko)
      ev.push({ type: 'butin', soin, or, objet })
      return true
    }

    default:
      return false
  }
}

/** Fait avancer le combat jusqu'à l'instant `t` (en secondes). */
export function avancer(c: ConfigCommande, e: EtatCombat, t: number): Evenement[] {
  const ev: Evenement[] = []
  for (let i = 0; i < 50 && unPas(c, e, t, ev); i++);
  return ev
}

/** Le héros choisit son attaque à l'instant `t`. */
export function choisir(c: ConfigCommande, e: EtatCombat, a: Attaque, t: number): boolean {
  if (!peutAttaquer(c, e, a)) return false
  if (a === 'saut') {
    e.atterrissages = [{ t: t + c.course + c.saut.envol, avant: c.saut.avant, tape: 'aucune', porte: false, resolu: false }]
  } else {
    e.marteau = { arrivee: t + c.course, appui: null, frappe: null, fort: false, pleine: false, porte: false }
  }
  passer(e, a, t)
  return true
}

function appliquerBonus(c: ConfigCommande, e: EtatCombat, b: Bonus): void {
  if (b === 'repas') e.pv = Math.min(pvMaxDe(c, e), e.pv + c.bonus.repas)
  else {
    e.bonus[b] = rang(e, b) + 1
    if (b === 'coeur') e.pv += c.bonus.coeur
  }
}

/** L'amélioration `i` de l'offre est prise ; on retourne à la carte (un acte neuf après le chef). */
export function prendre(c: ConfigCommande, e: EtatCombat, i: number, t: number): Evenement[] {
  if (e.phase !== 'butin' || i < 0 || i >= e.offre.length) return []
  appliquerBonus(c, e, e.offre[i])
  e.offre = []
  return versLaCarte(e, t)
}

/** Retour à la carte ; le chef abattu, l'acte suivant commence sur une carte neuve. */
function versLaCarte(e: EtatCombat, t: number): Evenement[] {
  passer(e, 'carte', t)
  e.evenement = null
  if (e.salle !== 'chef') return []
  e.acte += 1
  const rng = createRng(e.graine)
  e.carte = nouvelleCarte(rng)
  e.graine = rng.getState()
  e.place = null
  e.chemin = []
  e.salle = 'combat'
  return [{ type: 'acte', acte: e.acte }]
}

// ---------------------------------------------------------------- la carte, les salles, les objets

const OBJETS_CLES = Object.keys(OBJETS) as Objet[]
function objetAuHasard(rng: Rng): Objet {
  return OBJETS_CLES[Math.floor(rng.next() * OBJETS_CLES.length)]
}

/** Les salles où l'on peut aller depuis la carte. */
export function sallesAccessibles(e: EtatCombat): Place[] {
  return e.phase === 'carte' ? accessibles(e.carte, e.place) : []
}

/** On entre dans une salle de la carte. */
export function allerA(c: ConfigCommande, e: EtatCombat, place: Place, t: number): Evenement[] {
  if (!sallesAccessibles(e).some((p) => p.rang === place.rang && p.i === place.i)) return []
  e.place = place
  e.chemin.push(place)
  e.etage = (e.acte - 1) * CARTE.rangs + place.rang + 1
  e.salle = e.carte[place.rang][place.i].salle
  const rng = createRng(e.graine)
  const ev: Evenement[] = []
  if (e.salle === 'combat' || e.salle === 'elite' || e.salle === 'chef') {
    e.ennemi = ennemiDeLEtage(c, e.etage, e.salle, rng)
    e.pvEnnemi = e.ennemi.pv
    e.gestes = 0
    e.piment = false
    e.fumee = false
    e.koA = -Infinity
    passer(e, 'arrivee', t)
    ev.push({ type: 'arrivee', etage: e.etage, chef: e.salle === 'chef', elite: e.salle === 'elite' })
  } else if (e.salle === 'repos') passer(e, 'repos', t)
  else if (e.salle === 'boutique') {
    const prix = c.salles.prix
    const bonus = offrir(c, e, rng).filter((b) => b !== 'repas')
    const objets = [...OBJETS_CLES].sort(() => rng.next() - 0.5).slice(0, 2)
    e.boutique = [
      ...bonus.map((b): Article => ({ sorte: 'bonus', bonus: b, prix: prix.bonus, vendu: false })),
      ...objets.map((o): Article => ({ sorte: 'objet', objet: o, prix: prix.objet, vendu: false })),
      { sorte: 'soin', prix: prix.soin, vendu: false },
    ]
    passer(e, 'boutique', t)
  } else {
    const cles = Object.keys(EVENEMENTS) as CleEvenement[]
    e.evenement = { cle: cles[Math.floor(rng.next() * cles.length)], issue: null }
    passer(e, 'evenement', t)
  }
  e.graine = rng.getState()
  return ev
}

/** Le feu de camp : se soigner… */
export function seReposer(c: ConfigCommande, e: EtatCombat, t: number): number {
  if (e.phase !== 'repos') return 0
  const soin = Math.min(Math.round(pvMaxDe(c, e) * c.salles.feu), pvMaxDe(c, e) - e.pv)
  e.pv += soin
  passer(e, 'carte', t)
  return soin
}

/** … ou s'entraîner : une amélioration au choix. */
export function sEntrainer(c: ConfigCommande, e: EtatCombat, t: number): void {
  if (e.phase !== 'repos') return
  const rng = createRng(e.graine)
  e.offre = offrir(c, e, rng)
  e.graine = rng.getState()
  passer(e, 'butin', t)
}

/** Ce qui empêche d'acheter l'article `i` (`null` : rien). */
export function empecheDAcheter(c: ConfigCommande, e: EtatCombat, i: number): string | null {
  const a = e.boutique[i]
  if (a === undefined || a.vendu) return 'Vendu'
  if (e.or < a.prix) return 'Pas assez d’or'
  if (a.sorte === 'objet' && e.objets.length >= c.salles.sac) return 'Sac plein'
  if (a.sorte === 'soin' && e.pv >= pvMaxDe(c, e)) return 'Déjà en forme'
  if (a.sorte === 'bonus' && rang(e, a.bonus) >= c.bonusMax && a.bonus !== 'coeur') return 'Au plus haut'
  return null
}

export function acheter(c: ConfigCommande, e: EtatCombat, i: number): boolean {
  if (e.phase !== 'boutique' || empecheDAcheter(c, e, i) !== null) return false
  const a = e.boutique[i]
  e.or -= a.prix
  a.vendu = true
  if (a.sorte === 'bonus') appliquerBonus(c, e, a.bonus)
  else if (a.sorte === 'objet') e.objets.push(a.objet)
  else e.pv = Math.min(pvMaxDe(c, e), e.pv + c.salles.soin)
  return true
}

/** On quitte la boutique ou l'événement. */
export function quitter(e: EtatCombat, t: number): Evenement[] {
  if (e.phase !== 'boutique' && e.phase !== 'evenement') return []
  e.evenement = null
  return versLaCarte(e, t)
}

/** Peut-on accepter le pari de l'événement ? */
export function peutAccepter(c: ConfigCommande, e: EtatCombat): boolean {
  if (e.evenement === null || e.evenement.issue !== null) return false
  switch (e.evenement.cle) {
    case 'marchand':
      return e.or >= c.salles.marchand && e.objets.length < c.salles.sac
    case 'autel':
      return e.pv > 4
    default:
      return true
  }
}

/** On répond à l'événement : l'issue s'écrit dans `evenement.issue` ; l'autel ouvre un choix d'amélioration. */
export function repondre(c: ConfigCommande, e: EtatCombat, accepte: boolean, t: number): void {
  if (e.phase !== 'evenement' || e.evenement === null || e.evenement.issue !== null) return
  if (!accepte || !peutAccepter(c, e)) {
    e.evenement.issue = 'Vous passez votre chemin.'
    return
  }
  const rng = createRng(e.graine)
  switch (e.evenement.cle) {
    case 'fontaine':
      if (rng.next() < 0.5) {
        appliquerBonus(c, e, 'coeur')
        e.evenement.issue = `L’eau est douce : +${c.bonus.coeur} PV max.`
      } else {
        e.pv = Math.max(1, e.pv - 3)
        e.evenement.issue = 'L’eau était croupie : −3 PV.'
      }
      break
    case 'marchand': {
      e.or -= c.salles.marchand
      const o = objetAuHasard(rng)
      e.objets.push(o)
      e.evenement.issue = `Dans le paquet : ${OBJETS[o].nom.toLowerCase()}.`
      break
    }
    case 'coffre':
      e.or += 25
      e.pv = Math.max(1, e.pv - 2)
      e.evenement.issue = 'Une fléchette au bras, mais le coffre était plein : −2 PV, +25 or.'
      break
    case 'autel':
      e.pv -= 4
      e.evenement.issue = 'Le sang coule sur la pierre…'
      e.offre = offrir(c, e, rng)
      passer(e, 'butin', t)
      break
  }
  e.graine = rng.getState()
}

/** On sort un objet du sac, pendant son tour, sans le perdre. */
export function utiliser(c: ConfigCommande, e: EtatCombat, i: number, t: number): Evenement[] {
  if (e.phase !== 'choix' || i < 0 || i >= e.objets.length) return []
  const [o] = e.objets.splice(i, 1)
  const ev: Evenement[] = []
  let degats = 0
  if (o === 'potion') e.pv = Math.min(pvMaxDe(c, e), e.pv + c.salles.potion)
  else if (o === 'fumigene') e.fumee = true
  else if (o === 'piment') e.piment = true
  else {
    degats = c.salles.bombe
    blesserLEnnemi(e, degats, t, ev)
  }
  ev.unshift({ type: 'objet', objet: o, degats })
  if (e.pvEnnemi <= 0) passer(e, 'ko', t)
  return ev
}

/** Le doigt se pose à l'instant `t`. */
export function toucher(c: ConfigCommande, e: EtatCombat, t: number): Evenement[] {
  if (e.phase === 'saut') {
    const a = e.atterrissages[e.atterrissages.length - 1]
    if (a.tape !== 'aucune' || a.resolu || e.ennemi.piques) return []
    const large = largeurDuRebond(c, e)
    if (t < a.t - a.avant * large) {
      a.tape = 'rate'
      return [{ type: 'rate' }]
    }
    if (t > a.t + c.saut.apres * large) return []
    a.tape = 'bien'
    e.stats.rebonds += 1
    e.gestes += 1
    return [{ type: 'bien', serie: e.atterrissages.length }]
  }
  if (e.phase === 'marteau') {
    const m = e.marteau
    // Le doigt posé pendant la course compte : la charge commence à l'arrivée.
    if (m.appui === null && m.frappe === null) m.appui = Math.max(t, m.arrivee)
    return []
  }
  if (e.phase === 'ennemi') {
    if (t < e.verrou) return []
    e.verrou = t + c.garde.verrou
    e.gardeA = t
    const large = largeurDeGarde(c, e)
    const k = e.coups.find((x) => !x.resolu && x.garde === 'aucune' && t <= x.impact + c.garde.apres * large)
    if (k === undefined) return []
    const d = t - k.impact
    if (d >= -c.garde.parfaiteAvant * large && d <= c.garde.parfaiteApres * large) k.garde = 'parfaite'
    else if (d >= -c.garde.avant * large) k.garde = 'garde'
    else return [{ type: 'garde', qualite: 'trop-tot' }]
    return [{ type: 'garde', qualite: k.garde }]
  }
  return []
}

/** Le doigt se lève à l'instant `t`. */
export function lacher(c: ConfigCommande, e: EtatCombat, t: number): Evenement[] {
  if (e.phase !== 'marteau') return []
  const m = e.marteau
  if (m.appui === null || m.frappe !== null) return []
  if (t < m.appui) {
    // Lâché pendant la course : il faudra reposer le doigt.
    m.appui = null
    return []
  }
  const tenu = t - m.appui
  m.fort = tenu >= c.marteau.charge && tenu <= c.marteau.charge + zoneDuMarteau(c, e)
  m.frappe = t
  return []
}

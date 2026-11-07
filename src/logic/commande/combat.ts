/**
 * LA COMMANDE ACTION — `?commande`, un side project (Keko, 07/11 : « un jeu à
 * commande action (style Paper Mario), ça se fait ? » puis « vas-y, fais un
 * proto »). Un combat au tour par tour où le bon geste au bon moment change
 * le coup ; pendant le tour de l'ennemi, une tape juste avant le coup PARE
 * (un dégât de moins) ; plus juste encore, la parade est PARFAITE (aucun
 * dégât, une riposte). Une tape ratée bloque la garde un instant : on ne pare
 * pas en tapotant.
 *
 * Puis le roguelike (« des ennemis de plus en plus forts et des
 * améliorations »), puis la CARTE (« un peu pauvre en strat long terme »,
 * `carte.ts`) : on choisit sa route entre combats, élites, feux de camp,
 * boutiques et événements ; l'or des victoires, d'autant plus que les gestes
 * étaient justes ; le sac et ses objets.
 *
 * Puis « plutôt un petit magicien ? Et dès le début on choisit un sort ? Et
 * chaque sort a une commande action ? Au début simple, un peu comme dans
 * l'idle game qu'on avait pour les capacités ». **Le héros est un magicien
 * qui lance ses SORTS de sa place**, chacun son geste, repris des passifs du
 * donjon :
 *
 * - la BOULE DE FEU se charge doigt posé ; lâchée quand l'étoile s'allume,
 *   elle frappe fort (l'Élan des haches) ;
 * - l'ÉCLAIR : un anneau se referme sur l'ennemi ; une tape quand il se
 *   referme en appelle un autre, plus rapide (le Fracas des massues, en
 *   chaîne) — chaque anneau refermé frappe ;
 * - les MISSILES : tapoter le plus vite possible pendant deux secondes ;
 *   tant de tapes font un missile qui porte (la Lacération des griffes).
 *
 * On en choisit un au départ, les autres s'apprennent en route (une
 * amélioration « Grimoire »).
 *
 * Pur : le temps est injecté, en secondes, sur la même horloge pour `avancer`
 * et pour les gestes — la page donne l'horodatage de l'événement, pas
 * l'instant où elle le traite. Une décision qui attend un geste attend aussi
 * `delai` de plus : le geste peut arriver un peu après l'instant qu'il porte.
 * Tout tirage passe par la graine.
 */
import { createRng, type Rng } from '../rng.ts'
import { accessibles, CARTE, nouvelleCarte, type Carte, type Place, type Salle } from './carte.ts'

export type Sort = 'feu' | 'eclair' | 'missiles'
export const LES_SORTS: Sort[] = ['feu', 'eclair', 'missiles']
export const SORTS: Record<Sort, { nom: string; geste: string; effet: string }> = {
  feu: { nom: 'Boule de feu', geste: 'Tenez, lâchez à l’étoile', effet: 'Un gros coup, si on la lâche au bon moment' },
  eclair: { nom: 'Éclair', geste: 'Touchez quand l’anneau se referme', effet: 'Des éclairs en chaîne, tant qu’on touche juste' },
  missiles: { nom: 'Missiles', geste: 'Tapotez le plus vite possible', effet: 'Une salve, d’autant plus forte qu’on tapote vite' },
}

export type TypeEnnemi = 'brigand' | 'lutin' | 'squelette' | 'brute' | 'chapardeur'

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
  /** Il vole (la page le dessine en l'air). */
  volant: boolean
  /** Le premier étage où il peut paraître. */
  depuis: number
}

/** L'ennemi en scène : un modèle, grossi pour son étage. */
export type Ennemi = Omit<Modele, 'chef' | 'depuis'> & { type: TypeEnnemi; estChef: boolean }

/** Les améliorations ; `feu`, `eclair` et `missiles` apprennent le sort. */
export type Bonus =
  | Sort
  | 'brasier'
  | 'concentration'
  | 'conducteur'
  | 'orage'
  | 'focale'
  | 'salve'
  | 'endurance'
  | 'bouclier'
  | 'reflexes'
  | 'contre'
  | 'epines'
  | 'coeur'
  | 'repas'

export const COMMANDE = {
  heros: { pv: 10 },
  /** L'ennemi entre en scène. */
  arrivee: 0.8,
  /** L'ennemi abattu tombe avant le choix de l'amélioration. */
  ko: 0.7,
  /** Les PV rendus après chaque victoire. */
  repos: 2,
  /** Le temps qu'un geste met à arriver après l'instant qu'il porte. */
  delai: 0.03,
  feu: {
    /** Le magicien lève son bâton. */
    prepare: 0.25,
    /** Sans appui, la boule part molle au bout de ce temps. */
    attente: 2,
    /** Le temps de charge, puis la zone où lâcher. */
    charge: 0.8,
    zone: 0.35,
    /** Le vol de la boule, du lâcher au coup. */
    vol: 0.35,
    /** Le coup porté, un instant avant le tour de l'ennemi. */
    pause: 0.4,
    fort: 3,
    faible: 1,
  },
  eclair: {
    prepare: 0.25,
    /** Le premier anneau se referme en tant ; chaque suivant plus vite. */
    premier: 0.8,
    raccourci: 0.85,
    /** Le nombre d'éclairs au plus. */
    max: 5,
    degats: 1,
    /** La fenêtre : tant avant que l'anneau se referme, tant après ; elle se resserre à chaque anneau. */
    avant: 0.12,
    apres: 0.06,
    resserre: 0.9,
    pause: 0.4,
  },
  missiles: {
    /** « Prêt… » avant que les tapes comptent. */
    prepare: 0.6,
    duree: 2,
    /** Tant de tapes font un missile qui porte (un dégât). */
    parDegat: 4,
    vol: 0.25,
    pause: 0.35,
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
    brigand: { nom: 'Brigand', chef: 'Chef brigand', conseil: 'Rien de spécial.', pv: 5, attaque: 2, coups: 1, elanMin: 0.5, elanMax: 1.3, volant: false, depuis: 1 },
    lutin: { nom: 'Lutin ailé', chef: 'Reine des lutins', conseil: 'Il volette autour de vous.', pv: 5, attaque: 2, coups: 2, elanMin: 0.45, elanMax: 1.1, volant: true, depuis: 2 },
    squelette: { nom: 'Squelette', chef: 'Roi squelette', conseil: 'Imprévisible : son élan varie beaucoup.', pv: 6, attaque: 2, coups: 1, elanMin: 0.3, elanMax: 1.9, volant: false, depuis: 3 },
    brute: { nom: 'Brute', chef: 'Brute énorme', conseil: 'Lente à frapper, mais elle frappe fort : attendez-la.', pv: 9, attaque: 4, coups: 1, elanMin: 1.2, elanMax: 2.2, volant: false, depuis: 4 },
    chapardeur: { nom: 'Chapardeur', chef: 'Maître chapardeur', conseil: 'De petits coups, très vite.', pv: 4, attaque: 1, coups: 3, elanMin: 0.25, elanMax: 0.6, volant: false, depuis: 7 },
  } as Record<TypeEnnemi, Modele>,
  /** Une amélioration se prend au plus tant de fois (sauf le cœur et le repas). */
  bonusMax: 3,
  bonus: {
    /** +2 à la boule de feu chargée. */
    brasier: 2,
    /** La zone où lâcher la boule de feu, élargie de tant. */
    concentration: 0.4,
    /** +1 dégât à chaque éclair. */
    conducteur: 1,
    /** +1 éclair au plus. */
    orage: 1,
    /** La fenêtre de l'anneau, élargie de tant. */
    focale: 0.3,
    /** Une tape de moins par missile qui porte (jamais moins de deux). */
    salve: 1,
    /** La salve dure tant de plus. */
    endurance: 0.6,
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
  } as Record<Exclude<Bonus, Sort>, number>,
}

export type ConfigCommande = typeof COMMANDE

export type Objet = 'potion' | 'bombe' | 'fumigene' | 'piment'
export const OBJETS: Record<Objet, { nom: string; effet: string }> = {
  potion: { nom: 'Potion', effet: 'Rend 5 PV' },
  bombe: { nom: 'Bombe', effet: '6 dégâts, sans geste' },
  fumigene: { nom: 'Fumigène', effet: "L'ennemi passe son prochain tour" },
  piment: { nom: 'Piment', effet: 'Le prochain sort fait double dégâts' },
}

export type CleEvenement = 'fontaine' | 'marchand' | 'coffre' | 'autel'
export const EVENEMENTS: Record<CleEvenement, { titre: string; texte: string; accepter: string }> = {
  fontaine: { titre: 'La fontaine trouble', texte: 'Une fontaine à l’eau trouble. Elle peut fortifier… ou rendre malade.', accepter: 'Boire' },
  marchand: { titre: 'Le marchand louche', texte: 'Un marchand propose un paquet ficelé, sans dire ce qu’il contient.', accepter: 'Payer 15 or' },
  coffre: { titre: 'Le coffre piégé', texte: 'Un coffre au milieu du couloir. Sûrement piégé.', accepter: 'L’ouvrir' },
  autel: { titre: 'L’autel', texte: 'Un autel réclame du sang, et promet un don en échange.', accepter: 'Offrir 4 PV' },
}

export type Article = ({ sorte: 'bonus'; bonus: Bonus } | { sorte: 'objet'; objet: Objet } | { sorte: 'soin' }) & { prix: number; vendu: boolean }

export type Phase = 'depart' | 'carte' | 'arrivee' | 'choix' | Sort | 'ennemi' | 'ko' | 'butin' | 'repos' | 'boutique' | 'evenement' | 'perdu'

/** Un anneau de l'éclair : l'instant où il se referme, et la tape qui y répond. */
export type Anneau = {
  t: number
  /** La part de la fenêtre avant qu'il se referme (elle se resserre). */
  avant: number
  tape: 'aucune' | 'bien' | 'rate'
  /** L'éclair est tombé (à l'instant même). */
  porte: boolean
  /** L'anneau suivant est décidé (après la fenêtre). */
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
  /** Les sorts connus, dans l'ordre où on les a appris. */
  sorts: Sort[]
  /** Les gestes réussis dans ce combat (ils paient). */
  gestes: number
  /** Le piment : le prochain sort fait double dégâts ; le fumigène : l'ennemi passe son prochain tour. */
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
  feu: { pret: number; appui: number | null; frappe: number | null; fort: boolean; pleine: boolean; porte: boolean }
  anneaux: Anneau[]
  missiles: { debut: number; fin: number; taps: number; coups: { t: number; porte: boolean }[] }
  /** L'instant où le sort est fini et où l'ennemi peut répondre. */
  finAction: number | null
  coups: Coup[]
  /** La garde est bloquée jusque-là. */
  verrou: number
  /** La dernière tape de garde (la page lève le bouclier). */
  gardeA: number
  /** L'instant où l'ennemi est tombé. */
  koA: number
  stats: { eclairs: number; charges: number; missiles: number; gardes: number; parfaites: number }
}

export type Evenement =
  | { type: 'arrivee'; etage: number; chef: boolean; elite: boolean }
  | { type: 'bien'; serie: number }
  | { type: 'rate' }
  | { type: 'eclair'; degats: number; serie: number }
  | { type: 'pleine' }
  | { type: 'boule'; degats: number; fort: boolean }
  | { type: 'tape'; taps: number; missile: boolean }
  | { type: 'missile'; degats: number }
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

// ---------------------------------------------------------------- les ennemis

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
const valeur = (c: ConfigCommande, e: EtatCombat, b: Exclude<Bonus, Sort>) => rang(e, b) * c.bonus[b]

export function pvMaxDe(c: ConfigCommande, e: EtatCombat): number {
  return c.heros.pv + valeur(c, e, 'coeur')
}

/** La zone où lâcher la boule de feu, améliorations comprises. */
export function zoneDuFeu(c: ConfigCommande, e: EtatCombat): number {
  return c.feu.zone * (1 + valeur(c, e, 'concentration'))
}
const largeurDeLAnneau = (c: ConfigCommande, e: EtatCombat) => 1 + valeur(c, e, 'focale')
const largeurDeGarde = (c: ConfigCommande, e: EtatCombat) => 1 + valeur(c, e, 'reflexes')
/** Tant de tapes font un missile qui porte. */
export function tapesParMissile(c: ConfigCommande, e: EtatCombat): number {
  return Math.max(2, c.missiles.parDegat - valeur(c, e, 'salve'))
}

/** Le sort dont dépend une amélioration (elle n'est offerte que s'il est connu). */
const SORT_DU_BONUS: Partial<Record<Bonus, Sort>> = { brasier: 'feu', concentration: 'feu', conducteur: 'eclair', orage: 'eclair', focale: 'eclair', salve: 'missiles', endurance: 'missiles' }

/** Ce qu'une amélioration offerte dit d'elle, pour la page. */
export const BONUS: Record<Bonus, { nom: string; effet: string }> = {
  feu: { nom: 'Grimoire : Boule de feu', effet: 'Apprendre le sort (tenez, lâchez à l’étoile)' },
  eclair: { nom: 'Grimoire : Éclair', effet: 'Apprendre le sort (touchez quand l’anneau se referme)' },
  missiles: { nom: 'Grimoire : Missiles', effet: 'Apprendre le sort (tapotez vite)' },
  brasier: { nom: 'Brasier', effet: '+2 dégâts à la boule de feu chargée' },
  concentration: { nom: 'Concentration', effet: 'Plus de temps pour lâcher la boule de feu' },
  conducteur: { nom: 'Conducteur', effet: '+1 dégât à chaque éclair' },
  orage: { nom: 'Orage', effet: 'Un éclair de plus dans la chaîne' },
  focale: { nom: 'Focale', effet: 'L’anneau de l’éclair se prend plus facilement' },
  salve: { nom: 'Salve', effet: 'Les missiles portent avec moins de tapes' },
  endurance: { nom: 'Endurance', effet: 'La salve de missiles dure plus longtemps' },
  bouclier: { nom: 'Bouclier', effet: 'La garde ôte un dégât de plus' },
  reflexes: { nom: 'Réflexes', effet: 'La garde se prend plus facilement' },
  contre: { nom: 'Contre', effet: '+1 dégât à la riposte de la parade parfaite' },
  epines: { nom: 'Épines', effet: 'Chaque garde renvoie un dégât' },
  coeur: { nom: 'Cœur', effet: '+3 PV max' },
  repas: { nom: 'Repas', effet: 'Rend 5 PV' },
}

const estSort = (b: Bonus): b is Sort => (LES_SORTS as Bonus[]).includes(b)

/** Trois améliorations différentes : un sort qu'on ne connaît pas, ce qui renforce un sort connu, le reste ; pas une au plus haut, pas de repas en pleine forme. */
function offrir(c: ConfigCommande, e: EtatCombat, rng: Rng): Bonus[] {
  const possibles = (Object.keys(BONUS) as Bonus[]).filter((b) => {
    if (estSort(b)) return !e.sorts.includes(b)
    const sort = SORT_DU_BONUS[b]
    if (sort !== undefined && !e.sorts.includes(sort)) return false
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

// ---------------------------------------------------------------- la course

/** Une course neuve : on choisit son premier sort, puis la carte de l'acte `acte`. */
export function nouvelleCourse(c: ConfigCommande, graine: number, t: number, acte = 1): EtatCombat {
  const rng = createRng(graine)
  const carte = nouvelleCarte(rng)
  const e = etatNeuf(c, rng.getState(), t, carte, ennemiDuType(c, 'brigand', 1))
  e.acte = acte
  e.etage = (acte - 1) * CARTE.rangs
  e.phase = 'depart'
  return e
}

/** Un combat d'emblée, à l'étage `etage`, tous les sorts connus (pour les vérifications). */
export function nouveauCombat(c: ConfigCommande, graine: number, t: number, etage = 1): EtatCombat {
  const rng = createRng(graine)
  const carte = nouvelleCarte(rng)
  const e = etatNeuf(c, 0, t, carte, ennemiDeLEtage(c, etage, 'combat', rng))
  e.graine = rng.getState()
  e.etage = etage
  e.sorts = [...LES_SORTS]
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
    sorts: [],
    gestes: 0,
    piment: false,
    fumee: false,
    boutique: [],
    evenement: null,
    ennemi,
    pvEnnemi: ennemi.pv,
    bonus: {},
    offre: [],
    feu: { pret: 0, appui: null, frappe: null, fort: false, pleine: false, porte: false },
    anneaux: [],
    missiles: { debut: 0, fin: 0, taps: 0, coups: [] },
    finAction: null,
    coups: [],
    verrou: -Infinity,
    gardeA: -Infinity,
    koA: -Infinity,
    stats: { eclairs: 0, charges: 0, missiles: 0, gardes: 0, parfaites: 0 },
  }
}

/** Le premier sort, choisi au départ ; la carte s'ouvre. */
export function choisirLePremierSort(e: EtatCombat, sort: Sort, t: number): boolean {
  if (e.phase !== 'depart') return false
  e.sorts = [sort]
  passer(e, 'carte', t)
  return true
}

export function ennemiDe(_c: ConfigCommande, e: EtatCombat): Ennemi {
  return e.ennemi
}

export function peutLancer(e: EtatCombat, sort: Sort): boolean {
  return e.phase === 'choix' && e.sorts.includes(sort)
}

function passer(e: EtatCombat, phase: Phase, t: number): void {
  e.phase = phase
  e.debut = t
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

/** Le sort fini, l'ennemi tombe, tousse (le fumigène) ou répond. */
function finDeLAction(e: EtatCombat, c: ConfigCommande, t: number, ev: Evenement[]): boolean {
  if (e.finAction === null || t < e.finAction) return false
  const fin = e.finAction
  e.finAction = null
  e.piment = false
  if (e.pvEnnemi <= 0) passer(e, 'ko', fin)
  else if (e.fumee) {
    e.fumee = false
    passer(e, 'choix', fin)
    ev.push({ type: 'fumee' })
  } else commencerLeTour(e, c, fin, ev)
  return true
}

/** Une transition, s'il y en a une à faire à l'instant `t` ; `false` quand tout est à jour. */
function unPas(c: ConfigCommande, e: EtatCombat, t: number, ev: Evenement[]): boolean {
  const piment = e.piment ? 2 : 1
  switch (e.phase) {
    case 'arrivee':
      if (t < e.debut + c.arrivee) return false
      passer(e, 'choix', e.debut + c.arrivee)
      return true

    case 'feu': {
      const f = e.feu
      if (f.frappe === null) {
        if (f.appui === null) {
          if (t < f.pret + c.feu.attente + c.delai) return false
          f.frappe = f.pret + c.feu.attente
          f.fort = false
          return true
        }
        if (!f.pleine && t >= f.appui + c.feu.charge) {
          f.pleine = true
          ev.push({ type: 'pleine' })
          return true
        }
        const fin = f.appui + c.feu.charge + zoneDuFeu(c, e)
        if (t < fin + c.delai) return false
        // Tenue trop longtemps : la boule part molle d'elle-même.
        f.frappe = fin
        f.fort = false
        return true
      }
      if (!f.porte) {
        if (t < f.frappe + c.feu.vol) return false
        f.porte = true
        const degats = (f.fort ? c.feu.fort + valeur(c, e, 'brasier') : c.feu.faible) * piment
        if (f.fort) {
          e.stats.charges += 1
          e.gestes += 1
        }
        blesserLEnnemi(e, degats, f.frappe + c.feu.vol, ev)
        ev.push({ type: 'boule', degats, fort: f.fort })
        e.finAction = f.frappe + c.feu.vol + c.feu.pause
        return true
      }
      return finDeLAction(e, c, t, ev)
    }

    case 'eclair': {
      const a = e.anneaux[e.anneaux.length - 1]
      if (!a.porte) {
        if (t < a.t) return false
        a.porte = true
        const degats = (c.eclair.degats + valeur(c, e, 'conducteur')) * piment
        e.stats.eclairs += 1
        blesserLEnnemi(e, degats, a.t, ev)
        ev.push({ type: 'eclair', degats, serie: e.anneaux.length })
        return true
      }
      if (!a.resolu) {
        if (t < a.t + c.eclair.apres * largeurDeLAnneau(c, e) + c.delai) return false
        a.resolu = true
        const n = e.anneaux.length
        if (a.tape === 'bien' && n < c.eclair.max + valeur(c, e, 'orage') && e.pvEnnemi > 0) {
          e.anneaux.push({ t: a.t + c.eclair.premier * c.eclair.raccourci ** n, avant: a.avant * c.eclair.resserre, tape: 'aucune', porte: false, resolu: false })
        } else e.finAction = a.t + c.eclair.pause
        return true
      }
      return finDeLAction(e, c, t, ev)
    }

    case 'missiles': {
      const m = e.missiles
      const k = m.coups.find((x) => !x.porte && t >= x.t)
      if (k !== undefined) {
        k.porte = true
        e.stats.missiles += 1
        blesserLEnnemi(e, piment, k.t, ev)
        ev.push({ type: 'missile', degats: piment })
        return true
      }
      if (e.finAction === null) {
        // La salve finit à son heure, ou dès que l'ennemi tombe.
        if (t < m.fin + c.delai && e.pvEnnemi > 0) return false
        const dernier = Math.max(Math.min(t, m.fin), ...m.coups.map((x) => x.t))
        e.finAction = dernier + c.missiles.pause
        e.gestes += Math.max(0, m.coups.length - 2)
        return true
      }
      return finDeLAction(e, c, t, ev)
    }

    case 'ennemi': {
      for (let i = 0; i < e.coups.length; i++) {
        const k = e.coups[i]
        if (k.resolu) continue
        if (t < k.impact + c.garde.apres * largeurDeGarde(c, e) + c.delai) return false
        k.resolu = true
        const reduit = c.garde.reduit + valeur(c, e, 'bouclier')
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
        const renvoi = (k.garde === 'parfaite' ? c.garde.riposte + valeur(c, e, 'contre') : 0) + (k.garde !== 'aucune' ? valeur(c, e, 'epines') : 0)
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

/** Le magicien lance un sort à l'instant `t`. */
export function lancer(c: ConfigCommande, e: EtatCombat, sort: Sort, t: number): boolean {
  if (!peutLancer(e, sort)) return false
  e.finAction = null
  if (sort === 'feu') e.feu = { pret: t + c.feu.prepare, appui: null, frappe: null, fort: false, pleine: false, porte: false }
  else if (sort === 'eclair') e.anneaux = [{ t: t + c.eclair.prepare + c.eclair.premier, avant: c.eclair.avant, tape: 'aucune', porte: false, resolu: false }]
  else {
    const debut = t + c.missiles.prepare
    e.missiles = { debut, fin: debut + c.missiles.duree + valeur(c, e, 'endurance'), taps: 0, coups: [] }
  }
  passer(e, sort, t)
  return true
}

/** Le doigt se pose à l'instant `t`. */
export function toucher(c: ConfigCommande, e: EtatCombat, t: number): Evenement[] {
  if (e.phase === 'eclair') {
    const a = e.anneaux[e.anneaux.length - 1]
    if (a.tape !== 'aucune' || a.resolu) return []
    const large = largeurDeLAnneau(c, e)
    if (t < a.t - a.avant * large) {
      a.tape = 'rate'
      return [{ type: 'rate' }]
    }
    if (t > a.t + c.eclair.apres * large) return []
    a.tape = 'bien'
    e.gestes += 1
    return [{ type: 'bien', serie: e.anneaux.length }]
  }
  if (e.phase === 'feu') {
    const f = e.feu
    // Le doigt posé pendant que le bâton se lève compte : la charge commence quand il est prêt.
    if (f.appui === null && f.frappe === null) f.appui = Math.max(t, f.pret)
    return []
  }
  if (e.phase === 'missiles') {
    const m = e.missiles
    if (t < m.debut || t > m.fin || e.pvEnnemi <= 0) return []
    m.taps += 1
    const porte = m.taps % tapesParMissile(c, e) === 0
    if (porte) m.coups.push({ t: t + c.missiles.vol, porte: false })
    return [{ type: 'tape', taps: m.taps, missile: porte }]
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
  if (e.phase !== 'feu') return []
  const f = e.feu
  if (f.appui === null || f.frappe !== null) return []
  if (t < f.appui) {
    // Lâché avant que le bâton soit levé : il faudra reposer le doigt.
    f.appui = null
    return []
  }
  const tenu = t - f.appui
  f.fort = tenu >= c.feu.charge && tenu <= c.feu.charge + zoneDuFeu(c, e)
  f.frappe = t
  return []
}

// ---------------------------------------------------------------- le butin

function appliquerBonus(c: ConfigCommande, e: EtatCombat, b: Bonus): void {
  if (estSort(b)) {
    if (!e.sorts.includes(b)) e.sorts.push(b)
  } else if (b === 'repas') e.pv = Math.min(pvMaxDe(c, e), e.pv + c.bonus.repas)
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
  if (a.sorte === 'bonus' && estSort(a.bonus) && e.sorts.includes(a.bonus)) return 'Déjà connu'
  if (a.sorte === 'bonus' && !estSort(a.bonus) && rang(e, a.bonus) >= c.bonusMax && a.bonus !== 'coeur') return 'Au plus haut'
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

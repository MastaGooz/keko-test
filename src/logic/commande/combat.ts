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
 * Trois ennemis à la suite, chacun pour une raison : le Brigand pour
 * apprendre, le Garde à piques (on ne saute pas dessus), le Lutin ailé (hors
 * de portée du marteau, il frappe deux fois).
 *
 * Pur : le temps est injecté, en secondes, sur la même horloge pour `avancer`
 * et pour les gestes — la page donne l'horodatage de l'événement, pas
 * l'instant où elle le traite. Une décision qui attend un geste attend aussi
 * `delai` de plus : le geste peut arriver un peu après l'instant qu'il porte.
 */
import { createRng } from '../rng.ts'

export type Ennemi = {
  nom: string
  /** Ce que la page en dit au moment de choisir. */
  conseil: string
  pv: number
  attaque: number
  /** Le nombre de coups par tour. */
  coups: number
  /** Sauter dessus blesse le héros. */
  piques: boolean
  /** Le marteau ne l'atteint pas. */
  volant: boolean
}

export const COMMANDE = {
  heros: { pv: 10 },
  /** L'ennemi entre en scène. */
  arrivee: 0.8,
  /** Le héros court jusqu'à l'ennemi, puis revient. */
  course: 0.45,
  retour: 0.5,
  /** L'ennemi abattu tombe avant que le suivant entre. */
  ko: 0.7,
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
    riposte: 1,
  },
  ennemi: {
    /** L'élan avant la ruée, tiré entre ces deux durées : on ne pare pas au métronome. */
    elanMin: 0.5,
    elanMax: 1.3,
    ruee: 0.25,
    recul: 0.45,
  },
  ennemis: [
    { nom: 'Brigand', conseil: 'Un brigand : rien de spécial.', pv: 5, attaque: 2, coups: 1, piques: false, volant: false },
    { nom: 'Garde à piques', conseil: 'Des piques sur le casque : ne sautez pas dessus.', pv: 6, attaque: 2, coups: 1, piques: true, volant: false },
    { nom: 'Lutin ailé', conseil: 'Il vole, hors de portée du marteau, et frappe deux fois.', pv: 6, attaque: 2, coups: 2, piques: false, volant: true },
  ] as Ennemi[],
}

export type ConfigCommande = typeof COMMANDE

export type Phase = 'arrivee' | 'choix' | 'saut' | 'marteau' | 'ennemi' | 'ko' | 'gagne' | 'perdu'
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
  /** L'ennemi en scène, dans `ennemis`. */
  rang: number
  pvEnnemi: number
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
  | { type: 'arrivee'; rang: number }
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
  | { type: 'gagne' }
  | { type: 'perdu' }

export function nouveauCombat(c: ConfigCommande, graine: number, t: number): EtatCombat {
  return {
    graine: graine >>> 0,
    phase: 'arrivee',
    debut: t,
    pv: c.heros.pv,
    rang: 0,
    pvEnnemi: c.ennemis[0].pv,
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

export function ennemiDe(c: ConfigCommande, e: EtatCombat): Ennemi {
  return c.ennemis[e.rang]
}

export function peutAttaquer(c: ConfigCommande, e: EtatCombat, a: Attaque): boolean {
  return e.phase === 'choix' && !(a === 'marteau' && ennemiDe(c, e).volant)
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
function commencerLeTour(c: ConfigCommande, e: EtatCombat, t0: number, ev: Evenement[]): void {
  const rng = createRng(e.graine)
  e.coups = []
  let s = t0
  for (let i = 0; i < ennemiDe(c, e).coups; i++) {
    const elan = c.ennemi.elanMin + rng.next() * (c.ennemi.elanMax - c.ennemi.elanMin)
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
  if (e.pv <= 0) {
    passer(e, 'perdu', fin)
    ev.push({ type: 'perdu' })
  } else if (e.pvEnnemi <= 0) passer(e, 'ko', fin)
  else commencerLeTour(c, e, fin, ev)
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
        if (ennemiDe(c, e).piques) {
          e.pv = Math.max(0, e.pv - c.saut.piques)
          ev.push({ type: 'piques', degats: c.saut.piques })
          a.resolu = true
          e.retour = a.t
          return true
        }
        blesserLEnnemi(e, c.saut.degats, a.t, ev)
        ev.push({ type: 'atterrit', degats: c.saut.degats, serie: e.atterrissages.length })
        return true
      }
      if (!a.resolu) {
        if (t < a.t + c.saut.apres + c.delai) return false
        a.resolu = true
        const n = e.atterrissages.length
        if (a.tape === 'bien' && n < c.saut.max && e.pvEnnemi > 0) {
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
        if (t < m.appui + c.marteau.charge + c.marteau.zone + c.delai) return false
        // Tenu trop longtemps : le héros frappe mou de lui-même.
        m.frappe = m.appui + c.marteau.charge + c.marteau.zone
        m.fort = false
        return true
      }
      if (!m.porte) {
        if (t < m.frappe + c.marteau.elan) return false
        m.porte = true
        const degats = m.fort ? c.marteau.fort : c.marteau.faible
        if (m.fort) e.stats.charges += 1
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
        if (t < k.impact + c.garde.apres + c.delai) return false
        k.resolu = true
        const attaque = ennemiDe(c, e).attaque
        const degats = k.garde === 'parfaite' ? 0 : k.garde === 'garde' ? Math.max(0, attaque - 1) : attaque
        e.pv = Math.max(0, e.pv - degats)
        ev.push({ type: 'coup', degats, garde: k.garde })
        if (k.garde === 'garde') e.stats.gardes += 1
        if (k.garde === 'parfaite') {
          e.stats.parfaites += 1
          blesserLEnnemi(e, c.garde.riposte, k.impact, ev)
          ev.push({ type: 'riposte', degats: c.garde.riposte })
        }
        if (e.pv <= 0) {
          passer(e, 'perdu', t)
          ev.push({ type: 'perdu' })
        } else if (e.pvEnnemi <= 0) e.coups.length = i + 1 // abattu par la riposte : il ne frappe plus
        return true
      }
      const fin = e.coups[e.coups.length - 1].impact + c.ennemi.recul
      if (t < fin) return false
      passer(e, e.pvEnnemi <= 0 ? 'ko' : 'choix', fin)
      return true
    }

    case 'ko': {
      if (t < e.debut + c.ko) return false
      const fin = e.debut + c.ko
      if (e.rang + 1 < c.ennemis.length) {
        e.rang += 1
        e.pvEnnemi = c.ennemis[e.rang].pv
        passer(e, 'arrivee', fin)
        ev.push({ type: 'arrivee', rang: e.rang })
      } else {
        passer(e, 'gagne', fin)
        ev.push({ type: 'gagne' })
      }
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

/** Le doigt se pose à l'instant `t`. */
export function toucher(c: ConfigCommande, e: EtatCombat, t: number): Evenement[] {
  if (e.phase === 'saut') {
    const a = e.atterrissages[e.atterrissages.length - 1]
    if (a.tape !== 'aucune' || a.resolu || ennemiDe(c, e).piques) return []
    if (t < a.t - a.avant) {
      a.tape = 'rate'
      return [{ type: 'rate' }]
    }
    if (t > a.t + c.saut.apres) return []
    a.tape = 'bien'
    e.stats.rebonds += 1
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
    const k = e.coups.find((x) => !x.resolu && x.garde === 'aucune' && t <= x.impact + c.garde.apres)
    if (k === undefined) return []
    const d = t - k.impact
    if (d >= -c.garde.parfaiteAvant && d <= c.garde.parfaiteApres) k.garde = 'parfaite'
    else if (d >= -c.garde.avant) k.garde = 'garde'
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
  m.fort = tenu >= c.marteau.charge && tenu <= c.marteau.charge + c.marteau.zone
  m.frappe = t
  return []
}

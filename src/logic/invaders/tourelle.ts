/**
 * LA TOURELLE — la variante des envahisseurs où l'on ne bouge pas (Keko,
 * 06/11 : « on est en bas de l'écran au milieu, les ennemis foncent sur nous,
 * et on attaque en auto »). La tourelle vise seule l'ennemi le plus proche et
 * tire ; ENTRE DEUX VAGUES, ON CHOISIT UNE AMÉLIORATION PARMI TROIS (Keko :
 * « améliorer entre les vagues »), tirées au hasard seedé comme l'offre du
 * donjon. Chaque vague est plus nombreuse, plus dense, plus solide.
 *
 * Pur : le temps est injecté, le hasard seedé, aucun DOM. Le monde est celui
 * des envahisseurs (`LARGEUR` × `HAUTEUR`).
 */
import { createRng } from '../rng.ts'
import { HAUTEUR, LARGEUR } from './jeu.ts'

export type TypeEnnemi = 'eclaireur' | 'soldat' | 'plongeur' | 'brute'

export const TOURELLE = {
  x: LARGEUR / 2,
  y: 146,
  /** Le rayon de la tourelle : un ennemi qui l'atteint la frappe et meurt. */
  rayon: 5,
  pv: 10,
  /** Le tir : ses dégâts, sa cadence (ms), sa vitesse, l'écart de la gerbe (rad). */
  degats: 1,
  cadence: 420,
  vitesseTir: 150,
  gerbe: 0.14,
  /** Les ennemis : PV, vitesse (unités/s), dégâts au contact, rayon, points. */
  ennemis: {
    eclaireur: { pv: 1, vitesse: 22, degats: 1, rayon: 3, points: 10 },
    soldat: { pv: 3, vitesse: 14, degats: 2, rayon: 4, points: 20 },
    plongeur: { pv: 2, vitesse: 18, degats: 2, rayon: 3.5, points: 25 },
    brute: { pv: 10, vitesse: 8, degats: 4, rayon: 6, points: 60 },
  } as Record<TypeEnnemi, { pv: number; vitesse: number; degats: number; rayon: number; points: number }>,
  /** La vague n : `base + parVague · n` ennemis, un toutes les `max(min, depart − pas · n)` ms. */
  vague: { base: 6, parVague: 3, departApparition: 1200, pasApparition: 60, minApparition: 250 },
  /**
   * LES ENNEMIS SE DURCISSENT EN EXPONENTIELLE : PV × `croissance^(n − 1)`,
   * vitesse × `1 + acceleration · (n − 1)`. Linéaires, ils ne suivaient pas
   * les améliorations, qui se multiplient entre elles : au hasard des choix,
   * la tourelle tenait encore à la vague 55 après une demi-heure ; à 1,13,
   * elle tombe de la vague 7 à 24 au hasard, de 6 à 34 en privilégiant
   * l'attaque, et vers la 4 sans rien prendre (mesuré, huit graines).
   */
  croissance: 1.13,
  acceleration: 0.02,
  /** La vague où chaque type apparaît. */
  apparition: { eclaireur: 1, soldat: 1, plongeur: 2, brute: 3 } as Record<TypeEnnemi, number>,
}

export type ConfigTourelle = typeof TOURELLE

/** LES AMÉLIORATIONS : une par choix, chacune peut se reprendre (sauf indication). */
export type CleAmelioration = 'degats' | 'cadence' | 'gerbe' | 'perforation' | 'pv' | 'regeneration' | 'bouclier' | 'critique' | 'explosion' | 'soin'

export const AMELIORATIONS: Record<CleAmelioration, { nom: string; effet: string; max?: number }> = {
  degats: { nom: 'Canons lourds', effet: '+30 % de dégâts' },
  cadence: { nom: 'Culasse rapide', effet: '+20 % de cadence de tir' },
  gerbe: { nom: 'Tir multiple', effet: 'Un projectile de plus par tir', max: 4 },
  perforation: { nom: 'Obus perforants', effet: 'Chaque tir traverse un ennemi de plus', max: 3 },
  pv: { nom: 'Blindage', effet: '+4 PV max, et 4 PV rendus' },
  regeneration: { nom: 'Nanorobots', effet: 'Répare 0,3 PV par seconde' },
  bouclier: { nom: 'Bouclier', effet: 'Absorbe un choc par vague' },
  critique: { nom: 'Visée laser', effet: '+10 % de chance de coup double', max: 5 },
  explosion: { nom: 'Charges explosives', effet: 'Les tirs explosent autour de l\'impact', max: 3 },
  soin: { nom: 'Réparation', effet: 'Rend tous les PV' },
}
export const CLES_AMELIORATIONS = Object.keys(AMELIORATIONS) as CleAmelioration[]

export type Ennemi = { id: number; type: TypeEnnemi; vague: number; x: number; y: number; pv: number; pvMax: number; ne: number; phase: number }
export type Projectile = { x: number; y: number; vx: number; vy: number; degats: number; perce: number; touches: number[] }

export type EtatTourelle = {
  seed: number
  rng: number
  t: number
  phase: 'vague' | 'choix' | 'perdu'
  vague: number
  score: number
  pv: number
  rangs: Record<CleAmelioration, number>
  /** Les chocs que le bouclier peut encore absorber dans cette vague. */
  bouclier: number
  /** L'angle de la tourelle (0 : nez en haut), vers sa cible. */
  angle: number
  prochainTir: number
  /** Les ennemis qui restent à faire entrer dans la vague, et quand le prochain entre. */
  aFaireEntrer: number
  prochaineEntree: number
  prochainId: number
  ennemis: Ennemi[]
  projectiles: Projectile[]
  /** L'offre entre deux vagues. */
  offre: CleAmelioration[]
}

export type EvenementTourelle =
  | { type: 'tir'; x: number; y: number; angle: number }
  | { type: 'touche'; x: number; y: number; degats: number; critique: boolean }
  | { type: 'explosion'; x: number; y: number; rayon: number }
  | { type: 'detruit'; x: number; y: number; ennemi: TypeEnnemi; points: number }
  | { type: 'choc'; x: number; y: number; degats: number; bouclier: boolean }
  | { type: 'finDeVague'; vague: number }
  | { type: 'vague'; vague: number }
  | { type: 'perdu'; vague: number; score: number }

function tirer(e: EtatTourelle): number {
  const r = createRng(e.rng)
  const v = r.next()
  e.rng = r.getState()
  return v
}

const RANGS_VIDES = Object.fromEntries(CLES_AMELIORATIONS.map((c) => [c, 0])) as Record<CleAmelioration, number>

export function pvMaxDe(c: ConfigTourelle, e: EtatTourelle): number {
  return c.pv + 4 * e.rangs.pv
}

export function degatsDe(c: ConfigTourelle, e: EtatTourelle): number {
  return c.degats * (1 + 0.3 * e.rangs.degats)
}

export function cadenceDe(c: ConfigTourelle, e: EtatTourelle): number {
  return c.cadence / (1 + 0.2 * e.rangs.cadence)
}

export function nombreDEnnemis(c: ConfigTourelle, vague: number): number {
  return c.vague.base + c.vague.parVague * vague
}

function delaiDApparition(c: ConfigTourelle, vague: number): number {
  return Math.max(c.vague.minApparition, c.vague.departApparition - c.vague.pasApparition * vague)
}

function lancerLaVague(c: ConfigTourelle, e: EtatTourelle): void {
  e.phase = 'vague'
  e.aFaireEntrer = nombreDEnnemis(c, e.vague)
  e.prochaineEntree = e.t + 600
  e.bouclier = e.rangs.bouclier
  e.offre = []
}

export function nouvelleTourelle(c: ConfigTourelle, seed: number): EtatTourelle {
  const e: EtatTourelle = {
    seed: seed >>> 0,
    rng: seed >>> 0,
    t: 0,
    phase: 'vague',
    vague: 1,
    score: 0,
    pv: c.pv,
    rangs: { ...RANGS_VIDES },
    bouclier: 0,
    angle: 0,
    prochainTir: 0,
    aFaireEntrer: 0,
    prochaineEntree: 0,
    prochainId: 0,
    ennemis: [],
    projectiles: [],
    offre: [],
  }
  lancerLaVague(c, e)
  return e
}

/** Le type du prochain ennemi : tiré parmi ceux que la vague connaît, les plus durs plus rares. */
function typeTire(c: ConfigTourelle, e: EtatTourelle): TypeEnnemi {
  const poids: [TypeEnnemi, number][] = [
    ['eclaireur', 5],
    ['soldat', 4],
    ['plongeur', 3],
    ['brute', 1 + 0.15 * e.vague],
  ]
  const permis = poids.filter(([t]) => e.vague >= c.apparition[t])
  let r = tirer(e) * permis.reduce((s, [, p]) => s + p, 0)
  for (const [t, p] of permis) {
    r -= p
    if (r < 0) return t
  }
  return permis[0][0]
}

/** L'offre de trois améliorations différentes, sans celles au maximum ; la Réparation seulement si l'on est blessé. */
function tirerLOffre(c: ConfigTourelle, e: EtatTourelle): CleAmelioration[] {
  const permises = CLES_AMELIORATIONS.filter((k) => {
    const max = AMELIORATIONS[k].max
    if (max !== undefined && e.rangs[k] >= max) return false
    if (k === 'soin' && e.pv >= pvMaxDe(c, e)) return false
    return true
  })
  const offre: CleAmelioration[] = []
  while (offre.length < 3 && permises.length > 0) offre.push(permises.splice(Math.floor(tirer(e) * permises.length), 1)[0])
  return offre
}

/** La vitesse d'un ennemi, vers la tourelle ; le plongeur ondule de côté. */
function vitesseDe(c: ConfigTourelle, n: Ennemi, t: number): { vx: number; vy: number } {
  const dx = c.x - n.x
  const dy = c.y - n.y
  const d = Math.hypot(dx, dy) || 1
  const v = c.ennemis[n.type].vitesse * (1 + c.acceleration * (n.vague - 1))
  let vx = (dx / d) * v
  let vy = (dy / d) * v
  if (n.type === 'plongeur') {
    const cote = Math.sin((t - n.ne) / 350 + n.phase) * 1.4
    vx += (-dy / d) * v * cote
    vy += (dx / d) * v * cote
  }
  return { vx, vy }
}

/** UN PAS DE `dt` ms. */
export function avancerTourelle(c: ConfigTourelle, etat: EtatTourelle, dt: number): { etat: EtatTourelle; evenements: EvenementTourelle[] } {
  const e = structuredClone(etat)
  const ev: EvenementTourelle[] = []
  if (e.phase !== 'vague' || dt <= 0) return { etat: e, evenements: ev }
  e.t += dt
  const s = dt / 1000

  // LA RÉPARATION CONTINUE.
  if (e.rangs.regeneration > 0) e.pv = Math.min(pvMaxDe(c, e), e.pv + 0.3 * e.rangs.regeneration * s)

  // LES ENTRÉES : du haut, à un x tiré au hasard.
  while (e.aFaireEntrer > 0 && e.t >= e.prochaineEntree) {
    const type = typeTire(c, e)
    const pvMax = c.ennemis[type].pv * c.croissance ** (e.vague - 1)
    e.ennemis.push({ id: e.prochainId++, type, vague: e.vague, x: 6 + tirer(e) * (LARGEUR - 12), y: -6, pv: pvMax, pvMax, ne: e.t, phase: tirer(e) * Math.PI * 2 })
    e.aFaireEntrer -= 1
    e.prochaineEntree += delaiDApparition(c, e.vague) * (0.6 + 0.8 * tirer(e))
  }

  // LES ENNEMIS FONCENT ; au contact, ils frappent et meurent.
  for (const n of e.ennemis) {
    const v = vitesseDe(c, n, e.t)
    n.x = Math.max(2, Math.min(LARGEUR - 2, n.x + v.vx * s))
    n.y += v.vy * s
    if (Math.hypot(n.x - c.x, n.y - c.y) < c.rayon + c.ennemis[n.type].rayon) {
      n.pv = 0
      const bouclier = e.bouclier > 0
      if (bouclier) e.bouclier -= 1
      else e.pv -= c.ennemis[n.type].degats
      ev.push({ type: 'choc', x: n.x, y: n.y, degats: c.ennemis[n.type].degats, bouclier })
    }
  }
  e.ennemis = e.ennemis.filter((n) => n.pv > 0)
  if (e.pv <= 0) {
    e.pv = 0
    e.phase = 'perdu'
    ev.push({ type: 'perdu', vague: e.vague, score: e.score })
    return { etat: e, evenements: ev }
  }

  // LA VISÉE : l'ennemi le plus proche, visé là où il sera quand le tir arrivera.
  let cible: Ennemi | null = null
  let proche = Infinity
  for (const n of e.ennemis) {
    if (n.y < -2) continue
    const d = Math.hypot(n.x - c.x, n.y - c.y)
    if (d < proche) {
      proche = d
      cible = n
    }
  }
  if (cible !== null) {
    const v = vitesseDe(c, cible, e.t)
    const vol = proche / c.vitesseTir
    const ax = cible.x + v.vx * vol - c.x
    const ay = cible.y + v.vy * vol - c.y
    e.angle = Math.atan2(ax, -ay)
    if (e.t >= e.prochainTir) {
      const n = 1 + e.rangs.gerbe
      for (let k = 0; k < n; k++) {
        const a = e.angle + (k - (n - 1) / 2) * c.gerbe
        e.projectiles.push({ x: c.x + Math.sin(a) * 6, y: c.y - Math.cos(a) * 6, vx: Math.sin(a) * c.vitesseTir, vy: -Math.cos(a) * c.vitesseTir, degats: degatsDe(c, e), perce: e.rangs.perforation, touches: [] })
      }
      e.prochainTir = e.t + cadenceDe(c, e)
      ev.push({ type: 'tir', x: c.x, y: c.y, angle: e.angle })
    }
  }

  // LES PROJECTILES : ils volent, frappent, traversent s'ils perforent, explosent s'ils sont chargés.
  const restants: Projectile[] = []
  for (const p of e.projectiles) {
    p.x += p.vx * s
    p.y += p.vy * s
    if (p.x < -5 || p.x > LARGEUR + 5 || p.y < -10 || p.y > HAUTEUR + 5) continue
    let fini = false
    for (const n of e.ennemis) {
      if (n.pv <= 0 || p.touches.includes(n.id)) continue
      if (Math.hypot(p.x - n.x, p.y - n.y) > c.ennemis[n.type].rayon + 1) continue
      const critique = tirer(e) < 0.1 * e.rangs.critique
      const degats = p.degats * (critique ? 2 : 1)
      frapper(c, e, n, degats, ev)
      ev.push({ type: 'touche', x: p.x, y: p.y, degats, critique })
      if (e.rangs.explosion > 0) {
        const rayon = 5 + 2 * e.rangs.explosion
        ev.push({ type: 'explosion', x: p.x, y: p.y, rayon })
        for (const m of e.ennemis) if (m !== n && m.pv > 0 && Math.hypot(m.x - p.x, m.y - p.y) < rayon + c.ennemis[m.type].rayon) frapper(c, e, m, degats * 0.5, ev)
      }
      p.touches.push(n.id)
      if (p.touches.length > p.perce) {
        fini = true
        break
      }
    }
    if (!fini) restants.push(p)
  }
  e.projectiles = restants
  e.ennemis = e.ennemis.filter((n) => n.pv > 0)

  // LA VAGUE FINIE : l'offre de trois.
  if (e.aFaireEntrer === 0 && e.ennemis.length === 0) {
    e.phase = 'choix'
    e.projectiles = []
    e.offre = tirerLOffre(c, e)
    ev.push({ type: 'finDeVague', vague: e.vague })
  }
  return { etat: e, evenements: ev }
}

function frapper(c: ConfigTourelle, e: EtatTourelle, n: Ennemi, degats: number, ev: EvenementTourelle[]): void {
  if (n.pv <= 0) return
  n.pv -= degats
  if (n.pv <= 0) {
    const points = Math.round(c.ennemis[n.type].points * (1 + 0.1 * (e.vague - 1)))
    e.score += points
    ev.push({ type: 'detruit', x: n.x, y: n.y, ennemi: n.type, points })
  }
}

/** CHOISIR une amélioration de l'offre : elle gagne un rang, et la vague suivante part. */
export function choisir(c: ConfigTourelle, etat: EtatTourelle, i: number): { etat: EtatTourelle; evenements: EvenementTourelle[] } {
  if (etat.phase !== 'choix' || etat.offre[i] === undefined) return { etat, evenements: [] }
  const e = structuredClone(etat)
  const k = e.offre[i]
  const max = AMELIORATIONS[k].max
  // Au maximum, elle ne monte plus (l'offre ne la propose pas ; on ne la force pas non plus).
  const auMax = max !== undefined && e.rangs[k] >= max
  if (k === 'soin') e.pv = pvMaxDe(c, e)
  else if (!auMax) {
    e.rangs[k] += 1
    if (k === 'pv') e.pv = Math.min(pvMaxDe(c, e), e.pv + 4)
  }
  e.vague += 1
  lancerLaVague(c, e)
  return { etat: e, evenements: [{ type: 'vague', vague: e.vague }] }
}

/**
 * LA PARTIE DU SURVIVOR — Keko (06/11), après le héros seul : « fun, rajoute
 * le reste ». Le reste, c'est la boucle de Vampire Survivors :
 *
 * - les ennemis naissent juste hors de l'écran, de plus en plus nombreux et de
 *   plus en plus solides, et marchent sur le héros ; une ÉLITE chaque minute,
 *   qui lâche un coffre (un choix de plus) ;
 * - le héros n'attaque pas lui-même : ses ARMES frappent seules, chacune à sa
 *   recharge (le fouet au départ) ;
 * - chaque ennemi abattu lâche une gemme d'expérience, que l'aimant attire ;
 * - à chaque niveau, TROIS CHOIX : une arme nouvelle, un niveau d'arme, ou un
 *   bonus passif — quatre armes et quatre passifs au plus, cinq niveaux chacun ;
 * - on joue jusqu'à tomber ; le record est le temps tenu.
 *
 * Pur et seedé, comme le reste de `logic/`. **L'état est modifié en place**
 * (des centaines d'ennemis à soixante pas par seconde : on ne le recopie pas) ;
 * la même graine et les mêmes gestes rejouent la même partie. L'écran donne
 * la direction voulue et la taille de ce qu'il montre (`Vue`), où naissent
 * les ennemis.
 */
import { createRng } from '../rng.ts'
import { avancerHeros, nouveauHeros, SURVIVOR, type Heros, type Vecteur } from './jeu.ts'

export type TypeEnnemi = 'chauve' | 'goule' | 'loup' | 'brute' | 'elite'
export type CleArme = 'fouet' | 'baguette' | 'couteau' | 'hache' | 'ail' | 'orbes' | 'eclair'
export type ClePassif = 'puissance' | 'cadence' | 'zone' | 'ailes' | 'aimant' | 'coeur' | 'regen' | 'armure' | 'nombre'
export type CleChoix = CleArme | ClePassif | 'soin'

export const PARTIE = {
  heros: { pv: 100, rayon: 3, aimant: 15 },
  /** `des` : à partir de quand il apparaît, en secondes ; `poids` : sa part des apparitions. */
  ennemis: {
    chauve: { pv: 5, vitesse: 19, degats: 2, rayon: 2.6, xp: 1, des: 0, poids: 3 },
    goule: { pv: 10, vitesse: 12, degats: 4, rayon: 3.2, xp: 2, des: 0, poids: 3 },
    loup: { pv: 14, vitesse: 24, degats: 4, rayon: 3, xp: 3, des: 150, poids: 2 },
    brute: { pv: 40, vitesse: 9, degats: 8, rayon: 4.8, xp: 6, des: 90, poids: 1 },
    elite: { pv: 400, vitesse: 12, degats: 15, rayon: 7, xp: 0, des: Infinity, poids: 0 },
  } satisfies Record<TypeEnnemi, { pv: number; vitesse: number; degats: number; rayon: number; xp: number; des: number; poids: number }>,
  /** Les apparitions par seconde : `base + parMinute × minutes`, jamais plus de `max` ennemis en vie. */
  apparition: { base: 1, parMinute: 0.6, max: 260, marge: 6 },
  /** Les PV des ennemis : × (1 + durcissement × minutes). */
  durcissement: 0.3,
  /** Une élite toutes les `elite` secondes. */
  elite: 60,
  /** Un ennemi au contact ne frappe qu'une fois par `attaque` secondes. */
  attaque: 1,
  /** Après un coup, le héros ne peut plus être touché pendant `invincible` secondes : une foule ne tue pas d'un coup. */
  invincible: 0.4,
  /** L'expérience du niveau n : `premier + pas × (n − 1)`. */
  xp: { premier: 5, pas: 5 },
  gemmesMax: 300,
  armesMax: 4,
  passifsMax: 4,
  niveauMax: 5,
  /** Le repas : les PV qu'il rend. */
  soin: 40,
} as const

export type ConfigPartie = typeof PARTIE

/** Ce que l'écran montre autour du héros, en unités (la moitié de chaque côté). */
export type Vue = { demiL: number; demiH: number }

// ---------------------------------------------------------------- les armes et les passifs

export const ARMES: Record<CleArme, { nom: string; effet: string }> = {
  fouet: { nom: 'Fouet', effet: "Cingle à l'horizontale, du côté où vous regardez" },
  baguette: { nom: 'Baguette magique', effet: "Lance un trait sur l'ennemi le plus proche" },
  couteau: { nom: 'Couteaux', effet: 'Lance des couteaux droit devant vous' },
  hache: { nom: 'Hache', effet: "Lancée en l'air, elle retombe en traversant tout" },
  ail: { nom: 'Ail', effet: 'Blesse et repousse ce qui vous approche' },
  orbes: { nom: 'Orbes', effet: 'Des orbes tournent autour de vous' },
  eclair: { nom: 'Éclair', effet: "La foudre frappe des ennemis au hasard à l'écran" },
}

export const PASSIFS: Record<ClePassif, { nom: string; effet: string; max?: number }> = {
  puissance: { nom: 'Épinard', effet: '+10 % de dégâts' },
  cadence: { nom: 'Grimoire', effet: '−8 % de recharge des armes' },
  zone: { nom: 'Chandelier', effet: '+10 % de zone' },
  ailes: { nom: 'Ailes', effet: '+10 % de vitesse de marche' },
  aimant: { nom: 'Aimant', effet: '+40 % de rayon de ramassage' },
  coeur: { nom: 'Cœur', effet: '+20 PV max' },
  regen: { nom: 'Herbes', effet: '+0,3 PV par seconde' },
  armure: { nom: 'Armure', effet: '−1 aux dégâts reçus' },
  nombre: { nom: 'Duplicateur', effet: '+1 projectile à chaque arme', max: 2 },
}

const CLES_ARMES = Object.keys(ARMES) as CleArme[]
const CLES_PASSIFS = Object.keys(PASSIFS) as ClePassif[]

export function estArme(k: CleChoix): k is CleArme {
  return k in ARMES
}

/** Les chiffres d'une arme à son niveau (1 à 5), avant les passifs. */
export function statsArme(k: CleArme, niveau: number) {
  const i = Math.max(0, Math.min(4, niveau - 1))
  switch (k) {
    case 'fouet':
      return { degats: [10, 10, 15, 20, 25][i], recharge: 1.35, nombre: niveau >= 2 ? 2 : 1, zone: [1, 1, 1.1, 1.2, 1.3][i], vitesse: 0, perce: 0 }
    case 'baguette':
      return { degats: [10, 10, 15, 15, 20][i], recharge: [1.2, 1, 1, 0.85, 0.85][i], nombre: [1, 2, 2, 3, 3][i], zone: 1, vitesse: 75, perce: 1 }
    case 'couteau':
      return { degats: [6, 6, 8, 8, 10][i], recharge: [0.9, 0.9, 0.8, 0.8, 0.7][i], nombre: [1, 2, 2, 3, 4][i], zone: 1, vitesse: 120, perce: [1, 1, 2, 2, 3][i] }
    case 'hache':
      return { degats: [20, 20, 30, 30, 40][i], recharge: 2.4, nombre: [1, 1, 2, 2, 3][i], zone: [1, 1.15, 1.15, 1.3, 1.3][i], vitesse: 70, perce: 99 }
    case 'ail':
      return { degats: [4, 5, 6, 7, 8][i], recharge: 0.6, nombre: 1, zone: [9, 10, 11, 12, 14][i], vitesse: 0, perce: 0 }
    case 'orbes':
      return { degats: [10, 12, 14, 16, 20][i], recharge: niveau >= 5 ? 0 : 2, nombre: [1, 2, 3, 3, 4][i], zone: 15, vitesse: 3.6, perce: 0 }
    case 'eclair':
      return { degats: [25, 30, 35, 40, 50][i], recharge: [3, 2.6, 2.3, 2, 1.8][i], nombre: [1, 2, 2, 3, 4][i], zone: 4, vitesse: 0, perce: 0 }
  }
}

/** Combien de temps les orbes tournent avant de s'éteindre, en secondes. */
const DUREE_ORBES = 3

// ---------------------------------------------------------------- l'état

export type Ennemi = {
  id: number
  type: TypeEnnemi
  x: number
  y: number
  pv: number
  pvMax: number
  /** Le recul, qui s'éteint. */
  kx: number
  ky: number
  /** Quand il pourra frapper de nouveau, en secondes de partie. */
  attaqueA: number
  /** La dernière fois qu'il a été touché (l'écran le fait blanchir). */
  touche: number
  /** Les armes à touches répétées (ail, orbes) ne le reprennent qu'après ce délai. */
  immunite: Partial<Record<CleArme, number>>
}

export type Projectile = {
  id: number
  arme: CleArme
  x: number
  y: number
  vx: number
  vy: number
  vie: number
  degats: number
  perce: number
  rayon: number
  touches: number[]
}

export type Gemme = { id: number; x: number; y: number; valeur: number; coffre: boolean; attiree: boolean; vitesse: number }

export type EtatPartie = {
  graine: number
  /** Le temps de partie, en secondes. */
  t: number
  phase: 'jeu' | 'choix' | 'perdu'
  heros: Heros
  pv: number
  /** Jusqu'à quand le héros ne peut plus être touché. */
  invincibleA: number
  /** La dernière direction de marche, longueur 1 : les couteaux partent par là. */
  vise: Vecteur
  ennemis: Ennemi[]
  projectiles: Projectile[]
  gemmes: Gemme[]
  armes: { cle: CleArme; niveau: number; recharge: number }[]
  passifs: { cle: ClePassif; niveau: number }[]
  niveau: number
  xp: number
  abattus: number
  /** Des choix encore dus (plusieurs niveaux d'un coup, un coffre). */
  enAttente: number
  offre: CleChoix[]
  prochainId: number
  /** Les apparitions dues, en fraction. */
  aFaire: number
  prochaineElite: number
  orbes: { angle: number; actives: boolean; minuteur: number }
}

export type EvenementPartie =
  | { type: 'touche'; x: number; y: number; degats: number }
  | { type: 'mort'; x: number; y: number; ennemi: TypeEnnemi }
  | { type: 'blesse'; degats: number }
  | { type: 'gemme'; valeur: number }
  | { type: 'coffre' }
  | { type: 'niveau'; niveau: number }
  | { type: 'elite' }
  | { type: 'tir'; arme: CleArme }
  | { type: 'fouet'; x: number; y: number; cote: 1 | -1; longueur: number; hauteur: number }
  | { type: 'eclair'; x: number; y: number; rayon: number }
  | { type: 'perdu' }

export function nouvellePartie(c: ConfigPartie, graine: number): EtatPartie {
  return {
    graine: graine >>> 0,
    t: 0,
    phase: 'jeu',
    heros: nouveauHeros(),
    pv: c.heros.pv,
    invincibleA: 0,
    vise: { x: 1, y: 0 },
    ennemis: [],
    projectiles: [],
    gemmes: [],
    armes: [{ cle: 'fouet', niveau: 1, recharge: 0.5 }],
    passifs: [],
    niveau: 1,
    xp: 0,
    abattus: 0,
    enAttente: 0,
    offre: [],
    prochainId: 1,
    aFaire: 3,
    prochaineElite: c.elite,
    orbes: { angle: 0, actives: true, minuteur: DUREE_ORBES },
  }
}

// ---------------------------------------------------------------- ce que valent les passifs

export function rangPassif(e: EtatPartie, k: ClePassif): number {
  return e.passifs.find((p) => p.cle === k)?.niveau ?? 0
}
export function rangArme(e: EtatPartie, k: CleArme): number {
  return e.armes.find((a) => a.cle === k)?.niveau ?? 0
}
export function pvMaxDe(c: ConfigPartie, e: EtatPartie): number {
  return c.heros.pv + 20 * rangPassif(e, 'coeur')
}
export function aimantDe(c: ConfigPartie, e: EtatPartie): number {
  return c.heros.aimant * (1 + 0.4 * rangPassif(e, 'aimant'))
}
export function xpPourNiveau(c: ConfigPartie, niveau: number): number {
  return c.xp.premier + c.xp.pas * (niveau - 1)
}
/** Les chiffres d'une arme possédée, passifs compris. */
export function armeDe(e: EtatPartie, k: CleArme) {
  const s = statsArme(k, rangArme(e, k))
  const zone = 1 + 0.1 * rangPassif(e, 'zone')
  const multiple = k === 'fouet' || k === 'ail' ? 0 : rangPassif(e, 'nombre')
  return {
    ...s,
    degats: s.degats * (1 + 0.1 * rangPassif(e, 'puissance')),
    recharge: s.recharge * (1 - 0.08 * rangPassif(e, 'cadence')),
    nombre: s.nombre + multiple,
    zone: s.zone * zone,
  }
}

/** Où sont les orbes en ce moment (vides quand elles sont éteintes). */
export function orbesDe(e: EtatPartie): Vecteur[] {
  if (rangArme(e, 'orbes') === 0 || !e.orbes.actives) return []
  const a = armeDe(e, 'orbes')
  return Array.from({ length: a.nombre }, (_, i) => {
    const ang = e.orbes.angle + (i * Math.PI * 2) / a.nombre
    return { x: e.heros.x + Math.cos(ang) * a.zone, y: e.heros.y + Math.sin(ang) * a.zone }
  })
}

// ---------------------------------------------------------------- les choix

/** Tire l'offre : trois choix parmi ce qui peut encore monter ou entrer. */
function tirerOffre(c: ConfigPartie, e: EtatPartie, hasard: () => number): CleChoix[] {
  const possibles: CleChoix[] = []
  for (const k of CLES_ARMES) {
    const r = rangArme(e, k)
    if (r > 0 ? r < c.niveauMax : e.armes.length < c.armesMax) possibles.push(k)
  }
  for (const k of CLES_PASSIFS) {
    const r = rangPassif(e, k)
    const max = PASSIFS[k].max ?? c.niveauMax
    if (r > 0 ? r < max : e.passifs.length < c.passifsMax) possibles.push(k)
  }
  for (let i = possibles.length - 1; i > 0; i--) {
    const j = Math.floor(hasard() * (i + 1))
    ;[possibles[i], possibles[j]] = [possibles[j], possibles[i]]
  }
  const offre = possibles.slice(0, 3)
  // Le repas se glisse quand il manque de quoi choisir, ou quand le héros est à moins de moitié.
  if (offre.length < 3 || e.pv < pvMaxDe(c, e) / 2) {
    if (offre.length === 3) offre[2] = 'soin'
    else offre.push('soin')
  }
  return offre
}

function ouvrirUnChoix(c: ConfigPartie, e: EtatPartie, hasard: () => number): void {
  if (e.enAttente <= 0 || e.phase !== 'jeu') return
  e.enAttente -= 1
  e.phase = 'choix'
  e.offre = tirerOffre(c, e, hasard)
}

/** Prend le choix d'index `i` de l'offre. */
export function choisir(c: ConfigPartie, e: EtatPartie, i: number): void {
  if (e.phase !== 'choix') return
  const k = e.offre[i]
  if (k === undefined) return
  if (k === 'soin') e.pv = Math.min(pvMaxDe(c, e), e.pv + c.soin)
  else if (estArme(k)) {
    const a = e.armes.find((x) => x.cle === k)
    if (a !== undefined) a.niveau = Math.min(c.niveauMax, a.niveau + 1)
    else if (e.armes.length < c.armesMax) e.armes.push({ cle: k, niveau: 1, recharge: 0.3 })
  } else {
    const p = e.passifs.find((x) => x.cle === k)
    const max = PASSIFS[k].max ?? c.niveauMax
    if (p !== undefined) p.niveau = Math.min(max, p.niveau + 1)
    else if (e.passifs.length < c.passifsMax) e.passifs.push({ cle: k, niveau: 1 })
    if (k === 'coeur') e.pv = Math.min(pvMaxDe(c, e), e.pv + 20)
  }
  e.offre = []
  e.phase = 'jeu'
  const rng = createRng(e.graine)
  ouvrirUnChoix(c, e, rng.next)
  e.graine = rng.getState()
}

// ---------------------------------------------------------------- un pas

const GRILLE = 8

export function avancerPartie(c: ConfigPartie, e: EtatPartie, dt: number, direction: Vecteur, vue: Vue): EvenementPartie[] {
  const ev: EvenementPartie[] = []
  if (e.phase !== 'jeu') return ev
  const rng = createRng(e.graine)
  const hasard = rng.next
  const s = dt / 1000
  e.t += s
  const h = () => e.heros

  // Le héros marche.
  e.heros = avancerHeros({ ...SURVIVOR, vitesse: SURVIVOR.vitesse * (1 + 0.1 * rangPassif(e, 'ailes')) }, e.heros, dt, direction)
  const n = Math.hypot(direction.x, direction.y)
  if (n > 0.1) e.vise = { x: direction.x / n, y: direction.y / n }
  e.pv = Math.min(pvMaxDe(c, e), e.pv + 0.3 * rangPassif(e, 'regen') * s)

  // Les apparitions, juste hors de l'écran.
  const minutes = e.t / 60
  e.aFaire += (c.apparition.base + c.apparition.parMinute * minutes) * s
  const types = (Object.keys(c.ennemis) as TypeEnnemi[]).filter((k) => c.ennemis[k].des <= e.t)
  const poidsTotal = types.reduce((a, k) => a + c.ennemis[k].poids, 0)
  const durci = 1 + c.durcissement * minutes
  const naitre = (type: TypeEnnemi) => {
    const L = vue.demiL + c.apparition.marge
    const H = vue.demiH + c.apparition.marge
    // Un point au hasard sur le pourtour du rectangle, proportionnellement à ses côtés.
    const u = hasard() * (4 * L + 4 * H)
    let x: number, y: number
    if (u < 2 * L) [x, y] = [-L + u, -H]
    else if (u < 4 * L) [x, y] = [-L + (u - 2 * L), H]
    else if (u < 4 * L + 2 * H) [x, y] = [-L, -H + (u - 4 * L)]
    else [x, y] = [L, -H + (u - 4 * L - 2 * H)]
    const d = c.ennemis[type]
    const pv = d.pv * durci
    e.ennemis.push({ id: e.prochainId++, type, x: h().x + x, y: h().y + y, pv, pvMax: pv, kx: 0, ky: 0, attaqueA: 0, touche: -1, immunite: {} })
  }
  while (e.aFaire >= 1) {
    e.aFaire -= 1
    if (e.ennemis.length >= c.apparition.max) continue
    let r = hasard() * poidsTotal
    let type = types[0]
    for (const k of types) {
      r -= c.ennemis[k].poids
      if (r < 0) {
        type = k
        break
      }
    }
    naitre(type)
  }
  if (e.t >= e.prochaineElite) {
    e.prochaineElite += c.elite
    naitre('elite')
    ev.push({ type: 'elite' })
  }

  // Les ennemis marchent sur le héros, reculent quand on les frappe, s'écartent les uns des autres.
  const loin = Math.hypot(vue.demiL, vue.demiH) * 1.6
  for (const en of e.ennemis) {
    const d = c.ennemis[en.type]
    const dx = h().x - en.x
    const dy = h().y - en.y
    const dist = Math.hypot(dx, dy) || 1
    if (dist > loin && en.type !== 'elite') {
      // Trop loin derrière : il revient de l'autre côté, devant le héros.
      en.x = h().x + (dx / dist) * loin * 0.6
      en.y = h().y + (dy / dist) * loin * 0.6
      continue
    }
    let vx = (dx / dist) * d.vitesse
    let vy = (dy / dist) * d.vitesse
    if (en.type === 'chauve') {
      // La chauve-souris volette de côté.
      const o = Math.sin(e.t * 5 + en.id) * 0.6
      vx += (-dy / dist) * d.vitesse * o
      vy += (dx / dist) * d.vitesse * o
    }
    en.x += (vx + en.kx) * s
    en.y += (vy + en.ky) * s
    const amorti = Math.exp(-s * 10)
    en.kx *= amorti
    en.ky *= amorti
  }
  const grille = new Map<number, Ennemi[]>()
  const cleDe = (x: number, y: number) => (Math.floor(x / GRILLE) + 32768) * 65536 + (Math.floor(y / GRILLE) + 32768)
  for (const en of e.ennemis) {
    const k = cleDe(en.x, en.y)
    const l = grille.get(k)
    if (l === undefined) grille.set(k, [en])
    else l.push(en)
  }
  for (const en of e.ennemis) {
    const ra = c.ennemis[en.type].rayon
    const gx = Math.floor(en.x / GRILLE)
    const gy = Math.floor(en.y / GRILLE)
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        const l = grille.get((gx + i + 32768) * 65536 + (gy + j + 32768))
        if (l === undefined) continue
        for (const o of l) {
          if (o.id <= en.id) continue
          const rb = c.ennemis[o.type].rayon
          const dx = o.x - en.x
          const dy = o.y - en.y
          const d = Math.hypot(dx, dy)
          const min = (ra + rb) * 0.85
          if (d >= min || d === 0) continue
          // Le plus gros pousse plus qu'il n'est poussé.
          const pousse = (min - d) * 0.5
          const pa = rb / (ra + rb)
          en.x -= (dx / d) * pousse * pa
          en.y -= (dy / d) * pousse * pa
          o.x += (dx / d) * pousse * (1 - pa)
          o.y += (dy / d) * pousse * (1 - pa)
        }
      }
    }
  }

  // Au contact, ils frappent.
  const armure = rangPassif(e, 'armure')
  for (const en of e.ennemis) {
    const d = c.ennemis[en.type]
    if (e.t < e.invincibleA) break
    if (e.t < en.attaqueA) continue
    if (Math.hypot(h().x - en.x, h().y - en.y) > d.rayon + c.heros.rayon) continue
    en.attaqueA = e.t + c.attaque
    e.invincibleA = e.t + c.invincible
    const degats = Math.max(1, d.degats - armure)
    e.pv -= degats
    ev.push({ type: 'blesse', degats })
    if (e.pv <= 0) {
      e.pv = 0
      e.phase = 'perdu'
      ev.push({ type: 'perdu' })
      e.graine = rng.getState()
      return ev
    }
  }

  // Les armes.
  const blesser = (en: Ennemi, degats: number, kx: number, ky: number) => {
    if (en.pv <= 0) return
    en.pv -= degats
    en.touche = e.t
    const lourd = en.type === 'elite' ? 0.15 : en.type === 'brute' ? 0.5 : 1
    en.kx += kx * lourd
    en.ky += ky * lourd
    ev.push({ type: 'touche', x: en.x, y: en.y, degats })
  }
  const vivants = () => e.ennemis.filter((en) => en.pv > 0)
  const pres = (en: Ennemi) => Math.abs(en.x - h().x) <= vue.demiL + 2 && Math.abs(en.y - h().y) <= vue.demiH + 2
  for (const a of e.armes) {
    const st = armeDe(e, a.cle)
    if (a.cle === 'orbes') continue
    a.recharge -= s
    if (a.recharge > 0) continue
    a.recharge += st.recharge
    switch (a.cle) {
      case 'fouet': {
        const longueur = 24 * st.zone
        const hauteur = 10 * st.zone
        for (let k = 0; k < st.nombre; k++) {
          const cote: 1 | -1 = k === 0 ? h().regard : h().regard === 1 ? -1 : 1
          const y0 = h().y - 1 - k * 2
          for (const en of vivants()) {
            const r = c.ennemis[en.type].rayon
            const dx = (en.x - h().x) * cote
            if (dx < -r || dx > longueur + r || Math.abs(en.y - y0) > hauteur / 2 + r) continue
            blesser(en, st.degats, cote * 30, 0)
          }
          ev.push({ type: 'fouet', x: h().x, y: y0, cote, longueur, hauteur })
        }
        break
      }
      case 'baguette': {
        const cibles = vivants()
          .filter(pres)
          .sort((p, q) => Math.hypot(p.x - h().x, p.y - h().y) - Math.hypot(q.x - h().x, q.y - h().y))
        if (cibles.length === 0) {
          a.recharge = 0.1
          break
        }
        for (let k = 0; k < st.nombre; k++) {
          const cible = cibles[k % cibles.length]
          const dx = cible.x - h().x
          const dy = cible.y - h().y
          const d = Math.hypot(dx, dy) || 1
          e.projectiles.push({ id: e.prochainId++, arme: 'baguette', x: h().x, y: h().y - 2, vx: (dx / d) * st.vitesse, vy: (dy / d) * st.vitesse, vie: 2, degats: st.degats, perce: st.perce, rayon: 1.6, touches: [] })
        }
        ev.push({ type: 'tir', arme: 'baguette' })
        break
      }
      case 'couteau': {
        for (let k = 0; k < st.nombre; k++) {
          // Les couteaux suivants partent un peu à côté, en éventail serré.
          const decale = (k - (st.nombre - 1) / 2) * 2.2
          e.projectiles.push({ id: e.prochainId++, arme: 'couteau', x: h().x - e.vise.y * decale, y: h().y - 2 + e.vise.x * decale, vx: e.vise.x * st.vitesse, vy: e.vise.y * st.vitesse, vie: 1.2, degats: st.degats, perce: st.perce, rayon: 1.4, touches: [] })
        }
        ev.push({ type: 'tir', arme: 'couteau' })
        break
      }
      case 'hache': {
        for (let k = 0; k < st.nombre; k++) {
          const vx = (hasard() - 0.5) * 50 + (k - (st.nombre - 1) / 2) * 18
          e.projectiles.push({ id: e.prochainId++, arme: 'hache', x: h().x, y: h().y - 3, vx, vy: -st.vitesse * (0.9 + hasard() * 0.25), vie: 2.6, degats: st.degats, perce: st.perce, rayon: 3 * st.zone, touches: [] })
        }
        ev.push({ type: 'tir', arme: 'hache' })
        break
      }
      case 'ail': {
        for (const en of vivants()) {
          const r = c.ennemis[en.type].rayon
          const dx = en.x - h().x
          const dy = en.y - h().y
          const d = Math.hypot(dx, dy) || 1
          if (d > st.zone + r) continue
          blesser(en, st.degats, (dx / d) * 18, (dy / d) * 18)
        }
        break
      }
      case 'eclair': {
        const cibles = vivants().filter(pres)
        if (cibles.length === 0) {
          a.recharge = 0.2
          break
        }
        for (let k = 0; k < st.nombre && cibles.length > 0; k++) {
          const cible = cibles.splice(Math.floor(hasard() * cibles.length), 1)[0]
          const cx = cible.x
          const cy = cible.y
          for (const en of vivants()) {
            if (Math.hypot(en.x - cx, en.y - cy) <= st.zone + c.ennemis[en.type].rayon) blesser(en, st.degats, 0, 0)
          }
          ev.push({ type: 'eclair', x: cx, y: cy, rayon: st.zone })
        }
        break
      }
    }
  }

  // Les orbes tournent, s'éteignent, reviennent.
  if (rangArme(e, 'orbes') > 0) {
    const st = armeDe(e, 'orbes')
    e.orbes.angle += st.vitesse * s
    e.orbes.minuteur -= s
    if (e.orbes.minuteur <= 0) {
      if (st.recharge === 0) e.orbes.minuteur = DUREE_ORBES
      else {
        e.orbes.actives = !e.orbes.actives
        e.orbes.minuteur = e.orbes.actives ? DUREE_ORBES : st.recharge
      }
    }
    if (st.recharge === 0) e.orbes.actives = true
    for (const o of orbesDe(e)) {
      for (const en of vivants()) {
        if ((en.immunite.orbes ?? 0) > e.t) continue
        if (Math.hypot(en.x - o.x, en.y - o.y) > 2.5 + c.ennemis[en.type].rayon) continue
        en.immunite.orbes = e.t + 0.5
        const dx = en.x - h().x
        const dy = en.y - h().y
        const d = Math.hypot(dx, dy) || 1
        blesser(en, st.degats, (dx / d) * 25, (dy / d) * 25)
      }
    }
  }

  // Les projectiles volent.
  for (const p of e.projectiles) {
    if (p.arme === 'hache') p.vy += 110 * s
    p.x += p.vx * s
    p.y += p.vy * s
    p.vie -= s
    for (const en of e.ennemis) {
      if (p.perce <= 0) break
      if (en.pv <= 0 || p.touches.includes(en.id)) continue
      if (Math.hypot(en.x - p.x, en.y - p.y) > p.rayon + c.ennemis[en.type].rayon) continue
      p.touches.push(en.id)
      p.perce -= 1
      const v = Math.hypot(p.vx, p.vy) || 1
      blesser(en, p.degats, (p.vx / v) * 20, (p.vy / v) * 20)
    }
  }
  e.projectiles = e.projectiles.filter((p) => p.vie > 0 && p.perce > 0)

  // Les morts lâchent leur gemme.
  const restants: Ennemi[] = []
  for (const en of e.ennemis) {
    if (en.pv > 0) {
      restants.push(en)
      continue
    }
    e.abattus += 1
    ev.push({ type: 'mort', x: en.x, y: en.y, ennemi: en.type })
    const coffre = en.type === 'elite'
    const valeur = c.ennemis[en.type].xp
    if (!coffre && e.gemmes.length >= c.gemmesMax) {
      // Trop de gemmes au sol : celle-ci se fond dans la plus vieille.
      e.gemmes[0].valeur += valeur
      continue
    }
    e.gemmes.push({ id: e.prochainId++, x: en.x, y: en.y, valeur, coffre, attiree: false, vitesse: 0 })
  }
  e.ennemis = restants

  // Les gemmes viennent à l'aimant.
  const aimant = aimantDe(c, e)
  const gardees: Gemme[] = []
  for (const g of e.gemmes) {
    const dx = h().x - g.x
    const dy = h().y - g.y
    const d = Math.hypot(dx, dy)
    if (!g.attiree && d <= aimant) {
      g.attiree = true
      g.vitesse = -25
    }
    if (g.attiree) {
      // Elle recule un peu, puis fonce.
      g.vitesse += 220 * s
      const pas = Math.min(d, g.vitesse * s)
      if (d > 0) {
        g.x += (dx / d) * pas
        g.y += (dy / d) * pas
      }
    }
    if (Math.hypot(h().x - g.x, h().y - g.y) <= c.heros.rayon + 1) {
      if (g.coffre) {
        e.enAttente += 1
        ev.push({ type: 'coffre' })
      } else {
        e.xp += g.valeur
        ev.push({ type: 'gemme', valeur: g.valeur })
      }
      continue
    }
    gardees.push(g)
  }
  e.gemmes = gardees

  // Les niveaux.
  while (e.xp >= xpPourNiveau(c, e.niveau)) {
    e.xp -= xpPourNiveau(c, e.niveau)
    e.niveau += 1
    e.enAttente += 1
    ev.push({ type: 'niveau', niveau: e.niveau })
  }
  ouvrirUnChoix(c, e, hasard)

  e.graine = rng.getState()
  return ev
}

/**
 * LE VAISSEAU — `?vaisseau`, un side project (Keko, 08/11 : « un nouveau proto
 * où on conduit un petit vaisseau dans l'espace, le déplacement qu'on avait
 * utilisé pour le vampire survivor : juste le vaisseau et un fond type espace
 * avec quelques astéroïdes »).
 *
 * Le contrôle est le MANCHE FLOTTANT du survivor (`directionDuManche`,
 * `centreQuiSuit`, repris tels quels) ; mais un vaisseau n'est pas un héros
 * qui marche : **le manche POUSSE** (une accélération vers la direction
 * voulue), le vide freine à peine, la vitesse est plafonnée, et le nez se
 * tourne vers là où l'on va. Le CHAMP D'ASTÉROÏDES est infini et seedé : chaque
 * case du monde tire son astéroïde de ses coordonnées, le même à chaque
 * visite, sans rien stocker. Un astéroïde touché repousse le vaisseau et le
 * fait rebondir.
 *
 * LE FORAGE (Keko : « un dispositif de forage laser sur le toit ») : le laser
 * vise seul ce qui est le plus proche à portée, roche ou ennemi, et le creuse ;
 * une roche éclatée laisse des pépites aimantées. L'ENNEMI (Keko : « un ennemi
 * qui mine et qui tire ») : un rival qui apparaît au loin, mine la roche la
 * plus proche de lui (les deux creusent les mêmes roches), ramasse ses propres
 * pépites, et dès qu'il a le joueur à portée, le garde à distance et lui tire
 * dessus ; abattu, il rend son butin.
 *
 * Pur : le temps est injecté (en secondes), le monde modifié en place. Les
 * unités sont celles de la scène en pixels (le vaisseau fait 4 unités de rayon).
 */
import { centreQuiSuit, directionDuManche, type ConfigSurvivor, type Vecteur } from '../survivor/jeu.ts'

export { centreQuiSuit, directionDuManche }
export type { Vecteur }

export const VAISSEAU = {
  /** La poussée du manche à fond, en unités par seconde carrée. */
  poussee: 150,
  /** La vitesse de pointe. */
  vitesseMax: 110,
  /** Le frein du vide, par seconde : `v *= exp(−frein·dt)`. Faible : on glisse. */
  frein: 0.55,
  /** La vitesse à laquelle le nez se tourne vers le cap voulu, en radians par seconde. */
  rotation: 7,
  /** Le rayon du vaisseau. */
  rayon: 4,
  /** La part de vitesse rendue par un rebond sur un astéroïde. */
  rebond: 0.45,
  /** En dessous de cette vitesse normale, toucher une roche n'est pas un choc (on s'y appuie, on glisse le long). */
  seuilChoc: 12,
  /** La coque du joueur : tant de points avant d'être percée (un trait en enlève un, un choc en enlève selon sa vitesse). */
  coque: 5,
  /**
   * LES CHOCS FONT MAL AUX DEUX (Keko : « des dégâts proportionnels à la vitesse de la collision, aux deux parties ») :
   * au-delà du seuil de choc, chaque unité de vitesse normale coûte tant de points de coque au vaisseau (le joueur ou
   * l'ennemi) et creuse la roche de tant de points. À pleine vitesse (110), le joueur perd 2 points et la roche en
   * prend 29 : une roche de 6 de rayon éclate d'un coup, une de 14 (118 points) en demande quatre. Le rival ÉVITE les
   * roches à moins de `evite` unités (il est poussé à l'écart) : sondé, une seule collision lui coûtait 72 % de sa vie.
   */
  collision: { degatsCoque: 0.02, degatsEnnemi: 0.12, degatsRoche: 0.3, evite: 24 },
  /**
   * LA STATION D'EXTRACTION (Keko : « un point d'extraction où déposer les ressources qu'on porte ») : posée au point de
   * départ (le vide autour sert de parvis), elle prend le minerai porté quand le vaisseau est à portée, une pépite toutes
   * les tant de secondes, et le met en BANQUE. Ce qu'on porte se perd avec la coque ; ce qui est en banque reste.
   */
  station: { x: 0, y: 0, rayon: 11, portee: 36, cadence: 0.12 },
  /** Le manche, en pixels CSS : son rayon (au bord, la pleine poussée), sa zone morte. */
  manche: { rayon: 56, mort: 0.12 },
  champ: {
    /** La taille d'une case du monde ; une case sur deux environ porte un astéroïde. */
    case: 110,
    densite: 0.55,
    rayonMin: 5,
    rayonMax: 14,
    /** Autour du point de départ, rien : le joueur apprend le manche à vide. */
    vide: 70,
  },
  /**
   * LE FORAGE : le laser vise seul ce qui est le plus proche à portée et le creuse à tant de points par seconde ;
   * une roche a `durete × rayon²` points ; éclatée, elle laisse des pépites (tant par unité de rayon) qui viennent
   * au vaisseau le plus proche à portée d'aimant, et comptent une fois à bord.
   */
  forage: { portee: 64, debit: 28, durete: 0.6, pepitesParRayon: 0.45, aimant: 44, vitessePepite: 160, ramassage: 5 },
  /**
   * L'ENNEMI : il apparaît à tant de secondes puis tant après sa mort, à tant d'unités ; il a tant de points (le laser
   * du joueur les creuse comme une roche), pousse et va moins vite que le joueur ; il cherche une roche à tant de lui,
   * mais SEULEMENT DANS LE TERRITOIRE DU JOUEUR (à tant du joueur : il vient miner dans son coin, sinon on ne le voit
   * jamais — Keko : « parfois j'ai l'impression de ne pas trouver l'ennemi ») ; il
   * voit le joueur à tant, se tient à tant de lui, et tire toutes les tant de secondes des traits à tant d'unités par
   * seconde qui vivent tant ; un trait enlève un point de coque. EN PLUS, à portée de forage, son laser brûle la coque
   * du joueur à tant de points par seconde (Keko : « il devrait tirer à distance et laser en plus quand on est à
   * portée, pas à la place »). Abattu, il rend son butin plus tant de pépites.
   */
  ennemi: { apparait: 10, revient: 5, distance: 200, pv: 36, poussee: 120, vitesseMax: 85, rotation: 5, rayon: 4, cherche: 260, territoire: 150, voit: 130, tient: 80, cadence: 1.8, vitesseTir: 130, dispersion: 0.16, vieTir: 2, laserCoque: 1, butinRendu: 3 },
} as const
/** La configuration, les nombres élargis : une page peut en passer une variante (`&ennemi` fait naître l'ennemi tout de suite, tout près). */
type Large<T> = { [K in keyof T]: T[K] extends number ? number : T[K] extends object ? Large<T[K]> : T[K] }
export type ConfigVaisseau = Large<typeof VAISSEAU>
/** Le manche du vaisseau dans la langue du survivor (sa vitesse et sa réponse n'y servent pas). */
export const MANCHE: ConfigSurvivor = { vitesse: 0, reponse: 0, manche: VAISSEAU.manche }

export type Vaisseau = {
  x: number
  y: number
  vx: number
  vy: number
  /** Le cap du nez, en radians (0 vers la droite, −π/2 vers le haut). */
  cap: number
  /** La poussée en cours, 0 à 1 : la flamme du moteur la suit. */
  poussee: number
  /** Le chemin parcouru, en unités. */
  parcouru: number
  /** L'astéroïde contre lequel on était au pas précédent (`null` sinon) : un contact qui dure n'est pas un nouveau choc. */
  contact: number | null
}

export type Asteroide = { id: number; x: number; y: number; rayon: number; graine: number; angle0: number; vitesseAngulaire: number }
/** Le laser en train de creuser : ce qu'il creuse (une roche, ou un ennemi), le point d'impact, la part déjà creusée (0 à 1). */
/** Un laser posé sur sa cible : une roche, l'ennemi (le laser du joueur) ou le joueur (celui de l'ennemi) ; `cible` est l'identifiant (0 pour le joueur). */
export type Forage = { sorte: 'roche' | 'ennemi' | 'joueur'; cible: number; x: number; y: number; part: number }
export type Pepite = { id: number; x: number; y: number; vx: number; vy: number; graine: number }
/** Un choc contre un astéroïde : où, et avec quelle vitesse normale (pour l'étincelle et la vibration). */
export type Choc = { x: number; y: number; force: number; asteroide: number }
/** Un trait tiré par l'ennemi. */
export type Tir = { id: number; x: number; y: number; vx: number; vy: number; vie: number }
/** Le rival : un vaisseau comme l'autre, des points, ce qu'il fait, sa roche, son laser, son prochain tir, son butin. */
export type Ennemi = {
  id: number
  corps: Vaisseau
  pv: number
  fait: 'mine' | 'chasse'
  roche: number | null
  forage: Forage | null
  tirA: number
  butin: number
}

/** Tout le monde : le joueur, les ennemis, ce que les lasers ont creusé, les roches parties, les pépites, les traits, le minerai. */
export type Monde = {
  t: number
  phase: 'vol' | 'perdu'
  vaisseau: Vaisseau
  coque: number
  forage: Forage | null
  ennemis: Ennemi[]
  prochainEnnemiA: number
  tirs: Tir[]
  /** Les points creusés par roche (son id), tant qu'elle tient. */
  creuse: Map<number, number>
  detruits: Set<number>
  pepites: Pepite[]
  /** Le minerai PORTÉ (à bord), et celui en BANQUE (déposé à la station). */
  minerai: number
  banque: number
  /** Le prochain dépôt possible, quand on est à quai. */
  deposeA: number
  prochainId: number
  graine: number
}

/** Ce qui s'est passé pendant un pas, pour le dessin et le son. */
export type Evenement =
  | { type: 'eclat'; x: number; y: number; rayon: number; graine: number }
  | { type: 'ramasse'; x: number; y: number; par: 'joueur' | 'ennemi' }
  /** Une pépite déposée à la station. */
  | { type: 'depose' }
  | { type: 'tir'; x: number; y: number }
  | { type: 'touche'; x: number; y: number }
  | { type: 'ennemiApparait'; id: number; x: number; y: number }
  | { type: 'ennemiTouche'; id: number }
  | { type: 'ennemiDetruit'; id: number; x: number; y: number; vx: number; vy: number }
  | { type: 'perdu' }

export function nouveauVaisseau(): Vaisseau {
  return { x: 0, y: 0, vx: 0, vy: 0, cap: -Math.PI / 2, poussee: 0, parcouru: 0, contact: null }
}

export function nouveauMonde(c: ConfigVaisseau = VAISSEAU, graine = 1): Monde {
  return { t: 0, phase: 'vol', vaisseau: nouveauVaisseau(), coque: c.coque, forage: null, ennemis: [], prochainEnnemiA: c.ennemi.apparait, tirs: [], creuse: new Map(), detruits: new Set(), pepites: [], minerai: 0, banque: 0, deposeA: 0, prochainId: 1, graine: graine >>> 0 || 1 }
}

/** Un hachage entier déterministe (celui de pixelfx), et un réel dans [0, 1) qui en sort. */
export function hache(...ns: number[]): number {
  let h = 0x9e3779b9
  for (const n of ns) {
    h = Math.imul(h ^ (n | 0), 0x85ebca6b)
    h ^= h >>> 13
    h = Math.imul(h, 0xc2b2ae35)
    h ^= h >>> 16
  }
  return h >>> 0
}
export const tire = (...ns: number[]): number => hache(...ns) / 4294967296

/** L'astéroïde de la case (i, j), ou `null` si elle est vide : le même à chaque appel. */
export function asteroideDeLaCase(c: ConfigVaisseau, i: number, j: number): Asteroide | null {
  if (tire(i, j, 1) >= c.champ.densite) return null
  const taille = c.champ.case
  const rayon = c.champ.rayonMin + (c.champ.rayonMax - c.champ.rayonMin) * tire(i, j, 2) ** 1.6
  const x = (i + 0.2 + 0.6 * tire(i, j, 3)) * taille
  const y = (j + 0.2 + 0.6 * tire(i, j, 4)) * taille
  if (Math.hypot(x, y) < c.champ.vide + rayon) return null
  return { id: hache(i, j), x, y, rayon, graine: hache(i, j, 5), angle0: tire(i, j, 6) * Math.PI * 2, vitesseAngulaire: (tire(i, j, 7) - 0.5) * 1.2 }
}

/** Les astéroïdes dont la case touche le carré de demi-côté `portee` autour de (x, y). */
export function asteroidesAutour(c: ConfigVaisseau, x: number, y: number, portee: number): Asteroide[] {
  const taille = c.champ.case
  const i0 = Math.floor((x - portee) / taille)
  const i1 = Math.floor((x + portee) / taille)
  const j0 = Math.floor((y - portee) / taille)
  const j1 = Math.floor((y + portee) / taille)
  const liste: Asteroide[] = []
  for (let j = j0; j <= j1; j++)
    for (let i = i0; i <= i1; i++) {
      const a = asteroideDeLaCase(c, i, j)
      if (a !== null) liste.push(a)
    }
  return liste
}

/** Les astéroïdes autour de (x, y) qui tiennent encore. */
export function asteroidesVisibles(c: ConfigVaisseau, m: Monde, x: number, y: number, portee: number): Asteroide[] {
  return asteroidesAutour(c, x, y, portee).filter((a) => !m.detruits.has(a.id))
}

/** Les points qu'une roche peut encaisser avant d'éclater. */
export const solidite = (c: ConfigVaisseau, a: Asteroide): number => c.forage.durete * a.rayon * a.rayon

/** L'écart d'angle le plus court de `de` vers `vers`, dans [−π, π]. */
const ecartDAngle = (de: number, vers: number): number => Math.atan2(Math.sin(vers - de), Math.cos(vers - de))

type Moteur = { poussee: number; vitesseMax: number; rotation: number; rayon: number }

/**
 * Fait voler un corps de `dt` secondes sous une direction (longueur 0 à 1) : la poussée, le frein du vide, le plafond,
 * le nez qui se tourne, puis les chocs contre les astéroïdes — sauf ceux de `detruits`, qui ne sont plus là (Keko :
 * « quand je détruis un astéroïde je collisionne toujours avec son ancienne position »). Rend le corps neuf et les chocs.
 */
export function voler(c: ConfigVaisseau, moteur: Moteur, v: Vaisseau, dt: number, direction: Vecteur, detruits: ReadonlySet<number> = new Set()): { vaisseau: Vaisseau; chocs: Choc[] } {
  const n = Math.hypot(direction.x, direction.y)
  const force = Math.min(1, n)
  let vx = v.vx + (n > 0 ? (direction.x / n) * force * moteur.poussee * dt : 0)
  let vy = v.vy + (n > 0 ? (direction.y / n) * force * moteur.poussee * dt : 0)
  const frein = Math.exp(-c.frein * dt)
  vx *= frein
  vy *= frein
  const vitesse = Math.hypot(vx, vy)
  if (vitesse > moteur.vitesseMax) {
    vx *= moteur.vitesseMax / vitesse
    vy *= moteur.vitesseMax / vitesse
  }
  // le nez : vers le manche quand on pousse, sinon vers où l'on glisse (s'il y a une vitesse à suivre)
  let cap = v.cap
  const voulu = n > 0.05 ? Math.atan2(direction.y, direction.x) : vitesse > 6 ? Math.atan2(vy, vx) : cap
  const ecart = ecartDAngle(cap, voulu)
  cap += Math.sign(ecart) * Math.min(Math.abs(ecart), moteur.rotation * dt)
  let x = v.x + vx * dt
  let y = v.y + vy * dt
  // les chocs : repoussé hors de l'astéroïde, la vitesse normale rendue en partie ; un choc n'est rapporté que s'il
  // est franc (au-dessus du seuil) et nouveau (on ne touchait pas déjà cette roche)
  const chocs: Choc[] = []
  let contact: number | null = null
  for (const a of asteroidesAutour(c, x, y, c.champ.rayonMax + moteur.rayon + 2)) {
    if (detruits.has(a.id)) continue
    const dx = x - a.x
    const dy = y - a.y
    const d = Math.hypot(dx, dy) || 0.001
    const minimum = a.rayon + moteur.rayon
    if (d >= minimum) continue
    const nx = dx / d
    const ny = dy / d
    x = a.x + nx * minimum
    y = a.y + ny * minimum
    const vn = vx * nx + vy * ny
    if (vn < 0) {
      vx -= (1 + c.rebond) * vn * nx
      vy -= (1 + c.rebond) * vn * ny
      if (-vn >= c.seuilChoc && v.contact !== a.id) chocs.push({ x: a.x + nx * a.rayon, y: a.y + ny * a.rayon, force: -vn, asteroide: a.id })
    }
    contact = a.id
  }
  return { vaisseau: { x, y, vx, vy, cap, poussee: force, parcouru: v.parcouru + vitesse * dt, contact }, chocs }
}

/** Le vaisseau du joueur avance (le moteur du joueur). */
export function avancer(c: ConfigVaisseau, v: Vaisseau, dt: number, direction: Vecteur, detruits: ReadonlySet<number> = new Set()): { vaisseau: Vaisseau; chocs: Choc[] } {
  return voler(c, c, v, dt, direction, detruits)
}

/** La roche la plus proche (de sa surface) de (x, y), à `portee` au plus ; `null` sinon. */
function rocheLaPlusProche(c: ConfigVaisseau, m: Monde, x: number, y: number, portee: number): { roche: Asteroide; d: number } | null {
  let meilleure: { roche: Asteroide; d: number } | null = null
  for (const a of asteroidesVisibles(c, m, x, y, portee + c.champ.rayonMax)) {
    const d = Math.hypot(a.x - x, a.y - y) - a.rayon
    if (d <= portee && (meilleure === null || d < meilleure.d)) meilleure = { roche: a, d }
  }
  return meilleure
}

/** Un laser creuse une roche de `points` : elle éclate si elle n'en peut plus (ses pépites naissent), sinon le forage est rendu. */
function creuserLaRoche(c: ConfigVaisseau, m: Monde, a: Asteroide, depuis: Vecteur, points: number, ev: Evenement[]): Forage | null {
  const dx = a.x - depuis.x
  const dy = a.y - depuis.y
  const d = Math.hypot(dx, dy) || 1
  const creuse = (m.creuse.get(a.id) ?? 0) + points
  const total = solidite(c, a)
  if (creuse < total) {
    m.creuse.set(a.id, creuse)
    return { sorte: 'roche', cible: a.id, x: a.x - (dx / d) * a.rayon, y: a.y - (dy / d) * a.rayon, part: creuse / total }
  }
  eclaterLaRoche(c, m, a, ev)
  return null
}

/** La roche éclate : elle quitte le monde et laisse ses pépites. */
function eclaterLaRoche(c: ConfigVaisseau, m: Monde, a: Asteroide, ev: Evenement[]): void {
  m.creuse.delete(a.id)
  m.detruits.add(a.id)
  ev.push({ type: 'eclat', x: a.x, y: a.y, rayon: a.rayon, graine: a.graine })
  const n = Math.max(1, Math.round(a.rayon * c.forage.pepitesParRayon))
  for (let i = 0; i < n; i++) {
    const an = (i / n) * Math.PI * 2 + tire(a.graine, 20, i) * 1.2
    const vit = 20 + 40 * tire(a.graine, 21, i)
    m.pepites.push({ id: m.prochainId++, x: a.x + Math.cos(an) * a.rayon * 0.5, y: a.y + Math.sin(an) * a.rayon * 0.5, vx: Math.cos(an) * vit, vy: Math.sin(an) * vit, graine: hache(a.graine, i) })
  }
}

/** Un choc abîme la roche heurtée de tant de points ; elle éclate si elle n'en peut plus. */
function abimerLaRoche(c: ConfigVaisseau, m: Monde, choc: Choc, points: number, ev: Evenement[]): void {
  if (points <= 0) return
  const a = asteroidesVisibles(c, m, choc.x, choc.y, c.champ.rayonMax + 2).find((r) => r.id === choc.asteroide)
  if (a === undefined) return
  const creuse = (m.creuse.get(a.id) ?? 0) + points
  if (creuse >= solidite(c, a)) eclaterLaRoche(c, m, a, ev)
  else m.creuse.set(a.id, creuse)
}

/** Les points qu'un choc coûte, par unité de vitesse au-delà du seuil. */
const coutDuChoc = (c: ConfigVaisseau, choc: Choc, parUnite: number): number => Math.max(0, choc.force - c.seuilChoc) * parUnite

/** L'ennemi est abattu : il quitte le monde, le suivant est annoncé, il rend son butin et des pépites. */
function abattreLEnnemi(c: ConfigVaisseau, m: Monde, e: Ennemi, ev: Evenement[]): void {
  m.ennemis = m.ennemis.filter((x) => x !== e)
  m.prochainEnnemiA = m.t + c.ennemi.revient
  if (m.forage !== null && m.forage.sorte === 'ennemi' && m.forage.cible === e.id) m.forage = null
  ev.push({ type: 'ennemiDetruit', id: e.id, x: e.corps.x, y: e.corps.y, vx: e.corps.vx, vy: e.corps.vy })
  const n = e.butin + c.ennemi.butinRendu
  for (let i = 0; i < n; i++) {
    const an = (i / n) * Math.PI * 2 + tire(e.id, 30, i)
    const vit = 20 + 40 * tire(e.id, 31, i)
    m.pepites.push({ id: m.prochainId++, x: e.corps.x, y: e.corps.y, vx: Math.cos(an) * vit + e.corps.vx * 0.3, vy: Math.sin(an) * vit + e.corps.vy * 0.3, graine: hache(e.id, i) })
  }
}

/** L'ennemi naît au loin, dans une direction tirée de la graine du monde, et regarde le joueur. */
function faireNaitreUnEnnemi(c: ConfigVaisseau, m: Monde, ev: Evenement[]): void {
  const v = m.vaisseau
  let a = tire(m.graine, m.prochainId, 3) * Math.PI * 2
  m.graine = hache(m.graine, 7)
  let x = v.x + Math.cos(a) * c.ennemi.distance
  let y = v.y + Math.sin(a) * c.ennemi.distance
  // pas dans une roche : on tourne autour du joueur jusqu'à un coin libre
  for (let essai = 0; essai < 12; essai++) {
    const libre = asteroidesVisibles(c, m, x, y, c.champ.rayonMax + 20).every((r) => Math.hypot(r.x - x, r.y - y) > r.rayon + c.ennemi.rayon + 12)
    if (libre) break
    a += Math.PI / 6
    x = v.x + Math.cos(a) * c.ennemi.distance
    y = v.y + Math.sin(a) * c.ennemi.distance
  }
  const e: Ennemi = { id: m.prochainId++, corps: { ...nouveauVaisseau(), x, y, cap: Math.atan2(v.y - y, v.x - x) }, pv: c.ennemi.pv, fait: 'mine', roche: null, forage: null, tirA: m.t + c.ennemi.cadence, butin: 0 }
  m.ennemis.push(e)
  ev.push({ type: 'ennemiApparait', id: e.id, x, y })
}

/** Ce que fait un ennemi pendant `dt` : il chasse le joueur s'il le voit, sinon il mine la roche la plus proche de lui. Rend ses chocs. */
function conduireLEnnemi(c: ConfigVaisseau, m: Monde, e: Ennemi, dt: number, ev: Evenement[]): Choc[] {
  const v = m.vaisseau
  const b = e.corps
  const dxj = v.x - b.x
  const dyj = v.y - b.y
  const dj = Math.hypot(dxj, dyj) || 1
  let direction: Vecteur = { x: 0, y: 0 }
  e.forage = null
  if (dj <= c.ennemi.voit && m.phase === 'vol') {
    // LA CHASSE : il se tient à distance du joueur (il s'approche s'il est loin, recule s'il est trop près), et tire avec de l'avance
    e.fait = 'chasse'
    const ecart = dj - c.ennemi.tient
    const k = Math.max(-1, Math.min(1, ecart / 25))
    direction = { x: (dxj / dj) * k, y: (dyj / dj) * k }
    if (m.t >= e.tirA) {
      e.tirA = m.t + c.ennemi.cadence
      const temps = dj / c.ennemi.vitesseTir
      const cx = v.x + v.vx * temps - b.x
      const cy = v.y + v.vy * temps - b.y
      // un peu de dispersion, tirée du monde : un joueur qui bouge peut esquiver, un joueur immobile n'est pas touché à tous les coups
      const angle = Math.atan2(cy, cx) + (tire(m.graine, m.prochainId, 9) - 0.5) * 2 * c.ennemi.dispersion
      const x0 = b.x + Math.cos(angle) * (c.ennemi.rayon + 3)
      const y0 = b.y + Math.sin(angle) * (c.ennemi.rayon + 3)
      m.tirs.push({ id: m.prochainId++, x: x0, y: y0, vx: Math.cos(angle) * c.ennemi.vitesseTir, vy: Math.sin(angle) * c.ennemi.vitesseTir, vie: c.ennemi.vieTir })
      ev.push({ type: 'tir', x: x0, y: y0 })
    }
    // ET SON LASER, EN PLUS DES TRAITS (Keko) : le joueur à portée de forage, son rayon lui brûle la coque à tant de
    // points par seconde ; chaque point entier perdu est une touche (le flash, l'étincelle), la coque à zéro perd la partie
    if (dj - c.rayon <= c.forage.portee) {
      const avant = Math.ceil(m.coque)
      m.coque -= c.ennemi.laserCoque * dt
      e.forage = { sorte: 'joueur', cible: 0, x: v.x - (dxj / dj) * c.rayon, y: v.y - (dyj / dj) * c.rayon, part: 1 - m.coque / c.coque }
      if (Math.ceil(m.coque) < avant) ev.push({ type: 'touche', x: e.forage.x, y: e.forage.y })
      if (m.coque <= 0) {
        m.coque = 0
        m.phase = 'perdu'
        ev.push({ type: 'perdu' })
      }
    }
  } else {
    // LA MINE : sa roche, ou la plus proche de lui ; il s'en approche à portée de laser, puis la creuse ; sans roche, il dérive vers le joueur
    e.fait = 'mine'
    let roche: Asteroide | null = null
    if (e.roche !== null && !m.detruits.has(e.roche)) roche = asteroidesVisibles(c, m, b.x, b.y, c.ennemi.cherche + c.champ.rayonMax).find((a) => a.id === e.roche) ?? null
    if (roche === null) {
      // la roche la plus proche de LUI parmi celles du TERRITOIRE DU JOUEUR : il vient miner dans son coin
      let meilleure: Asteroide | null = null
      let dmin = Infinity
      for (const r of asteroidesVisibles(c, m, v.x, v.y, c.ennemi.territoire + c.champ.rayonMax)) {
        if (Math.hypot(r.x - v.x, r.y - v.y) - r.rayon > c.ennemi.territoire) continue
        const d = Math.hypot(r.x - b.x, r.y - b.y) - r.rayon
        if (d <= c.ennemi.cherche && d < dmin) (dmin = d), (meilleure = r)
      }
      roche = meilleure
      e.roche = roche?.id ?? null
    }
    // sans roche à miner près du joueur, il vient vers lui
    if (roche === null) direction = { x: (dxj / dj) * 0.7, y: (dyj / dj) * 0.7 }
    else {
      const dx = roche.x - b.x
      const dy = roche.y - b.y
      const d = Math.hypot(dx, dy) - roche.rayon
      if (d > c.forage.portee - 12) {
        const k = Math.min(1, (d - (c.forage.portee - 12)) / 30 + 0.3)
        direction = { x: (dx / (d + roche.rayon)) * k, y: (dy / (d + roche.rayon)) * k }
      } else {
        // à portée : il freine (pousse contre sa vitesse) et creuse
        const vit = Math.hypot(b.vx, b.vy)
        if (vit > 4) direction = { x: (-b.vx / vit) * Math.min(1, vit / 30), y: (-b.vy / vit) * Math.min(1, vit / 30) }
        e.forage = creuserLaRoche(c, m, roche, b, c.forage.debit * dt, ev)
        if (e.forage === null) e.roche = null
      }
    }
  }
  // il évite les roches qui ne sont pas la sienne : poussé à l'écart de celles qu'il frôle
  for (const r of asteroidesVisibles(c, m, b.x, b.y, c.collision.evite + c.champ.rayonMax)) {
    if (e.roche === r.id && e.fait === 'mine') continue
    const dx = b.x - r.x
    const dy = b.y - r.y
    const dist = Math.hypot(dx, dy) || 1
    const marge = dist - r.rayon - c.ennemi.rayon
    if (marge > c.collision.evite) continue
    const k = (1 - Math.max(0, marge) / c.collision.evite) * 1.3
    direction = { x: direction.x + (dx / dist) * k, y: direction.y + (dy / dist) * k }
  }
  const l = Math.hypot(direction.x, direction.y)
  if (l > 1) direction = { x: direction.x / l, y: direction.y / l }
  const r = voler(c, c.ennemi, b, dt, direction, m.detruits)
  e.corps = r.vaisseau
  // en chasse, le nez reste sur le joueur
  if (e.fait === 'chasse') e.corps = { ...e.corps, cap: Math.atan2(dyj, dxj) }
  // ses chocs lui coûtent des points, et abîment la roche
  for (const choc of r.chocs) {
    e.pv -= coutDuChoc(c, choc, c.collision.degatsEnnemi)
    abimerLaRoche(c, m, choc, coutDuChoc(c, choc, c.collision.degatsRoche), ev)
  }
  return r.chocs
}

/**
 * Fait avancer LE MONDE de `dt` secondes : le joueur (et ses chocs), son laser qui vise le plus proche, roche ou
 * ennemi, les ennemis qui minent ou chassent, leurs traits, les roches qui éclatent, les pépites aimantées et
 * ramassées. Modifie `m` en place ; rend les chocs du joueur et ce qui s'est passé.
 */
export function avancerLeMonde(c: ConfigVaisseau, m: Monde, dt: number, direction: Vecteur): { chocs: Choc[]; evenements: Evenement[] } {
  const ev: Evenement[] = []
  if (m.phase !== 'vol') return { chocs: [], evenements: ev }
  m.t += dt
  const r = voler(c, c, m.vaisseau, dt, direction, m.detruits)
  m.vaisseau = r.vaisseau
  const v = m.vaisseau
  const chocs = [...r.chocs]
  // les chocs du joueur : la coque en souffre selon la vitesse, la roche aussi
  for (const choc of r.chocs) {
    const degats = coutDuChoc(c, choc, c.collision.degatsCoque)
    abimerLaRoche(c, m, choc, coutDuChoc(c, choc, c.collision.degatsRoche), ev)
    if (degats <= 0) continue
    m.coque -= degats
    ev.push({ type: 'touche', x: choc.x, y: choc.y })
    if (m.coque <= 0) {
      m.coque = 0
      m.phase = 'perdu'
      ev.push({ type: 'perdu' })
      return { chocs, evenements: ev }
    }
  }

  // l'ennemi : il naît à l'heure dite, un à la fois ; ses chocs comptent aussi, et peuvent l'abattre
  if (m.ennemis.length === 0 && m.t >= m.prochainEnnemiA) faireNaitreUnEnnemi(c, m, ev)
  for (const e of [...m.ennemis]) {
    chocs.push(...conduireLEnnemi(c, m, e, dt, ev))
    if (e.pv <= 0) abattreLEnnemi(c, m, e, ev)
  }

  // le laser du joueur : le plus proche à portée, roche ou ennemi
  const roche = rocheLaPlusProche(c, m, v.x, v.y, c.forage.portee)
  let ennemi: { e: Ennemi; d: number } | null = null
  for (const e of m.ennemis) {
    const d = Math.hypot(e.corps.x - v.x, e.corps.y - v.y) - c.ennemi.rayon
    if (d <= c.forage.portee && (ennemi === null || d < ennemi.d)) ennemi = { e, d }
  }
  if (ennemi !== null && (roche === null || ennemi.d < roche.d)) {
    const e = ennemi.e
    e.pv -= c.forage.debit * dt
    const dx = e.corps.x - v.x
    const dy = e.corps.y - v.y
    const d = Math.hypot(dx, dy) || 1
    ev.push({ type: 'ennemiTouche', id: e.id })
    if (e.pv <= 0) {
      m.forage = null
      abattreLEnnemi(c, m, e, ev)
    } else m.forage = { sorte: 'ennemi', cible: e.id, x: e.corps.x - (dx / d) * c.ennemi.rayon, y: e.corps.y - (dy / d) * c.ennemi.rayon, part: 1 - e.pv / c.ennemi.pv }
  } else if (roche !== null) m.forage = creuserLaRoche(c, m, roche.roche, v, c.forage.debit * dt, ev)
  else m.forage = null

  // la station : à quai avec du minerai à bord, on dépose une pépite à la cadence
  if (m.minerai > 0 && Math.hypot(v.x - c.station.x, v.y - c.station.y) <= c.station.portee) {
    if (m.t >= m.deposeA) {
      m.deposeA = m.t + c.station.cadence
      m.minerai -= 1
      m.banque += 1
      ev.push({ type: 'depose' })
    }
  } else m.deposeA = m.t + c.station.cadence * 0.5

  // les traits : ils volent, s'éteignent, s'écrasent sur une roche, touchent le joueur
  for (let i = m.tirs.length - 1; i >= 0; i--) {
    const tr = m.tirs[i]
    tr.vie -= dt
    tr.x += tr.vx * dt
    tr.y += tr.vy * dt
    let fini = tr.vie <= 0
    if (!fini && m.phase === 'vol' && Math.hypot(tr.x - v.x, tr.y - v.y) <= c.rayon + 1) {
      fini = true
      m.coque -= 1
      ev.push({ type: 'touche', x: tr.x, y: tr.y })
      if (m.coque <= 0) {
        m.coque = 0
        m.phase = 'perdu'
        ev.push({ type: 'perdu' })
      }
    }
    if (!fini) for (const a of asteroidesVisibles(c, m, tr.x, tr.y, c.champ.rayonMax + 2)) if (Math.hypot(tr.x - a.x, tr.y - a.y) <= a.rayon) fini = true
    if (fini) m.tirs.splice(i, 1)
  }

  // les pépites : elles dérivent en freinant, viennent au vaisseau le plus proche à portée d'aimant, montent à bord au contact
  const corps: { x: number; y: number; par: 'joueur' | 'ennemi'; e: Ennemi | null }[] = [{ x: v.x, y: v.y, par: 'joueur', e: null }, ...m.ennemis.map((e) => ({ x: e.corps.x, y: e.corps.y, par: 'ennemi' as const, e }))]
  for (let i = m.pepites.length - 1; i >= 0; i--) {
    const p = m.pepites[i]
    let plusProche = corps[0]
    let dmin = Infinity
    for (const b of corps) {
      const d = Math.hypot(b.x - p.x, b.y - p.y)
      if (d < dmin) (dmin = d), (plusProche = b)
    }
    const dx = plusProche.x - p.x
    const dy = plusProche.y - p.y
    const d = dmin || 1
    if (d <= c.forage.ramassage) {
      m.pepites.splice(i, 1)
      if (plusProche.e === null) m.minerai += 1
      else plusProche.e.butin += 1
      ev.push({ type: 'ramasse', x: p.x, y: p.y, par: plusProche.par })
      continue
    }
    const frein = Math.exp(-2.5 * dt)
    p.vx *= frein
    p.vy *= frein
    if (d <= c.forage.aimant) {
      const tirage = c.forage.vitessePepite * (1 - d / c.forage.aimant) + 40
      p.vx += (dx / d) * tirage * dt * 6
      p.vy += (dy / d) * tirage * dt * 6
    }
    p.x += p.vx * dt
    p.y += p.vy * dt
  }
  return { chocs, evenements: ev }
}

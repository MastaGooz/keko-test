/**
 * LE VAISSEAU À L'ÉCRAN — `?vaisseau`, un side project (Keko, 08/11 : « on conduit un petit vaisseau dans l'espace,
 * le déplacement du vampire survivor, juste le vaisseau et un fond type espace avec quelques astéroïdes »).
 *
 * Tout est en PIXEL ART, dessiné dans un tampon de pixelfx (180 × 320, agrandi par un entier) : le vaisseau au centre
 * de l'écran, tourné vers son cap (le peintre du dépôt sait tourner : `place(x, y, flip, angle)`), sa flamme qui suit
 * la poussée et sème des braises (les particules du dépôt, en coordonnées du monde) ; le monde défile autour de lui,
 * trois couches d'étoiles en parallaxe et des nébuleuses de lumière, tirées des coordonnées de chaque case, et les
 * astéroïdes du champ seedé (`logic/vaisseau/jeu.ts`), des polygones rocheux ombrés qui tournent lentement. Un choc
 * fait une étincelle du dépôt, une secousse et une vibration. Le manche flottant du survivor se dessine sur une
 * surcouche en pixels d'écran.
 */
import './vaisseau.css'
import * as noyau from 'pixelfx'
import { effects } from 'pixelfx/fx/index'
import { asteroidesVisibles, avancerLeMonde, centreQuiSuit, directionDuManche, MANCHE, nouveauMonde, tire, VAISSEAU as C, type Vaisseau, type Vecteur } from '../../logic/vaisseau/jeu.ts'
import { dessinerAsteroide, LUMIERE, rocheDe } from './asteroide.ts'

type Instance = { t: number; options: Record<string, unknown>; update(dt: number): void; draw(frame: unknown, couche?: string): void; stop(): void; done(): boolean }
type Module = { meta?: Record<string, unknown> }
type Peintre = {
  place(x: number, y: number, flip?: boolean, angle?: number): Peintre
  px(x: number, y: number, c: number): void
  dot(x: number, y: number, c: number, a?: number): void
  circle(x: number, y: number, r: number, c: number, a?: number): void
  ring(x: number, y: number, r: number, w: number, c: number, a?: number): void
  text(texte: string, x: number, y: number, c: number, o?: { font?: string; scale?: number; align?: string; outline?: number; shadow?: number; a?: number }): void
  glowLine(x0: number, y0: number, x1: number, y1: number, r: number, c: number, k?: number): void
  arc(x: number, y: number, r: number, w: number, a0: number, a1: number, c: number, a?: number): void
  poly(pts: number[][], c: number | ((x: number, y: number) => number), a?: number): void
  line(x0: number, y0: number, x1: number, y1: number, c: number, a?: number): void
  glow(x: number, y: number, r: number, c: number, k?: number): void
}
type Particules = { spawn(k: number, x: number, y: number, vx: number, vy: number, vie: number, c?: number, taille?: number): void; update(dt: number): void; draw(p: Peintre, couche?: string): void }
type Morceaux = { add(b: Record<string, unknown>): void; update(dt: number): void; draw(p: Peintre): void }
type Noyau = {
  createFrame(w: number, h: number): { w: number; h: number; color: Uint32Array; light: Uint32Array }
  clearFrame<T>(f: T): T
  createFx(mod: Module, o: Record<string, unknown>): Instance
  composite(f: unknown, sortie: Uint8ClampedArray, fond: Uint32Array | number | null): void
  painterFor(frame: unknown): Peintre
  fit(palette: string[], n: number): number[]
  hex(h: string): number
  Particles: new (o: Record<string, unknown>) => Particules
  Bits: new (o: Record<string, unknown>) => Morceaux
  B: Record<string, number>
  sparkle(p: Peintre, x: number, y: number, bras: number, c: number, pointe?: number, k?: number): void
  Rng: new (graine: number) => { next(): number; range(a: number, b: number): number }
  P: Record<string, number>
  PAL: Record<string, string[]>
  WHITE: number
}
const N = noyau as unknown as Noyau
const FX = effects as Record<string, Module>

/** La scène fait 180 px de large ; SA HAUTEUR SUIT L'ÉCRAN (Keko : « le score est trop bas, il n'est plus en haut » — à 320 px fixes, centrée, elle laissait cent pixels de noir au-dessus d'elle). */
const W = 180
let H = 320
const PAS = 1 / 60
const COQUE = N.fit(['#141a2a', '#2a3550', '#46587a', '#6f87ab', '#9fb4d2', '#d6e4f5', '#ffffff'], 7)
const VERRIERE = N.fit(['#0a3a4a', '#19a0c0', '#8ff0ff', '#ffffff'], 4)
const FEU = N.fit(N.PAL.fire, 8)
const LASER = N.fit(['#3a0a10', '#a01020', '#ff2a3a', '#ff7a5a', '#ffd0a0', '#ffffff'], 6)
const PEPITE = N.fit(['#3a2a06', '#b8860b', '#ffd23a', '#fff6c0', '#ffffff'], 5)
const FOND = N.hex('#07060f')
const COULEURS_NEBULEUSE = ['#3a1a6a', '#14305a', '#5a1a40', '#103a3a'].map((h) => N.hex(h))

export function monterVaisseau(racine: HTMLElement, build: string): void {
  document.documentElement.classList.add('vaisseau-page')
  racine.classList.add('vaisseau')
  const dpr = Math.min(2, window.devicePixelRatio || 1)
  const parametres = new URLSearchParams(location.search)
  const suivre = parametres.get('controle') === 'suivre'
  /** `&minerai=N` : part avec N pepites a bord, pour voir le compteur sans miner (ce qui se teste doit s'ouvrir d'un lien). */
  const minerai0 = Math.max(0, Number(parametres.get('minerai')) || 0)

  function el<K extends keyof HTMLElementTagNameMap>(tag: K, classe: string, texte = ''): HTMLElementTagNameMap[K] {
    const n = document.createElement(tag)
    n.className = classe
    n.textContent = texte
    return n
  }
  const scene = el('div', 'vaisseau-scene')
  const canvas = document.createElement('canvas')
  canvas.className = 'vaisseau-canvas'
  canvas.width = W
  canvas.height = H
  const g = canvas.getContext('2d')!
  scene.append(canvas)
  const surcouche = document.createElement('canvas')
  surcouche.className = 'vaisseau-surcouche'
  const gs = surcouche.getContext('2d')!
  const ecran = el('div', 'vaisseau-ecran')
  ecran.append(el('h1', '', 'Le vaisseau'), el('p', '', 'Posez le doigt n’importe où : un manche apparaît. Il pousse le vaisseau dans sa direction ; relâchez, il glisse. Les astéroïdes repoussent. Au clavier : les flèches ou ZQSD.'), el('p', 'vaisseau-go', 'Touchez pour décoller'))
  const pied = el('div', 'vaisseau-build', `vaisseau · build ${build}`)
  racine.append(scene, surcouche, ecran, pied)

  // ---------------------------------------------------------------- l'état
  const m = nouveauMonde()
  m.minerai = minerai0
  let v: Vaisseau = m.vaisseau
  let enJeu = false
  let zoom = 2
  let frame = N.createFrame(W, H)
  let img = g.createImageData(W, H)
  const R = new N.Rng(7)
  const braises = new N.Particles({ rng: R, ground: () => Infinity, sparks: [N.WHITE, FEU[6], FEU[5], FEU[4]] })
  /** Les étincelles des chocs vivent DANS LE MONDE : on garde leur point et on les replace sous la caméra à chaque image. */
  let effets: { fx: Instance; x: number; y: number }[] = []
  /** Le forage : les étincelles du point d'impact, les morceaux des roches éclatées (sans pesanteur : l'espace), les flashs. */
  const etincelles = new N.Particles({ rng: R, ground: () => Infinity, sparks: [N.WHITE, LASER[4], LASER[3], LASER[2]] })
  const morceaux = new N.Bits({ ground: () => Infinity })
  const flashs: { x: number; y: number; t0: number; r: number }[] = []
  /** LE SCORE EN PIXELS (Keko : « dessiner le score en haut en pixel ») : une pépite ramassée VOLE du vaisseau au compteur, qui ne compte qu'à son arrivée, et s'allume. */
  const envols: { x: number; y: number; t0: number }[] = []
  let affiche = minerai0
  let allumeA = -10
  const COMPTEUR = { x: 16, y: 10 }
  let secousse = 0
  let flamme = 0
  let t = 0
  /** La caméra : le vaisseau au centre, avec un peu d'avance dans le sens de la vitesse, amortie. */
  const camera = { x: 0, y: 0 }

  function cadrer(): void {
    // le zoom vient de la largeur ; la hauteur du tampon est celle de l'écran à ce zoom, bornée (480 px de tampon au plus)
    zoom = Math.max(1, Math.min(6, Math.floor(racine.clientWidth / W)))
    const h = Math.max(120, Math.min(480, Math.ceil(racine.clientHeight / zoom)))
    if (h !== H || canvas.height !== h) {
      H = h
      canvas.height = H
      frame = N.createFrame(W, H)
      img = g.createImageData(W, H)
    }
    canvas.style.width = `${W * zoom}px`
    canvas.style.height = `${H * zoom}px`
    surcouche.width = Math.round(racine.clientWidth * dpr)
    surcouche.height = Math.round(racine.clientHeight * dpr)
  }

  // ---------------------------------------------------------------- le manche (celui du survivor)
  let manche: { id: number; centre: Vecteur; doigt: Vecteur } | null = null
  const touches = new Set<string>()
  racine.addEventListener('pointerdown', (ev) => {
    if (!enJeu) {
      enJeu = true
      ecran.hidden = true
    }
    if (manche !== null) return
    ev.preventDefault()
    racine.setPointerCapture(ev.pointerId)
    const p = { x: ev.clientX, y: ev.clientY }
    manche = { id: ev.pointerId, centre: p, doigt: p }
  })
  racine.addEventListener('pointermove', (ev) => {
    if (manche === null || ev.pointerId !== manche.id) return
    const doigt = { x: ev.clientX, y: ev.clientY }
    manche = { id: manche.id, centre: suivre ? manche.centre : centreQuiSuit(MANCHE, manche.centre, doigt), doigt }
  })
  const lever = (ev: PointerEvent) => {
    if (manche !== null && ev.pointerId === manche.id) manche = null
  }
  racine.addEventListener('pointerup', lever)
  racine.addEventListener('pointercancel', lever)
  window.addEventListener('keydown', (ev) => {
    touches.add(ev.key.toLowerCase())
    if (!enJeu) {
      enJeu = true
      ecran.hidden = true
    }
  })
  window.addEventListener('keyup', (ev) => touches.delete(ev.key.toLowerCase()))
  window.addEventListener('blur', () => {
    touches.clear()
    manche = null
  })
  function directionVoulue(): Vecteur {
    if (manche !== null) {
      if (!suivre) return directionDuManche(MANCHE, manche.doigt.x - manche.centre.x, manche.doigt.y - manche.centre.y)
      const r = canvas.getBoundingClientRect()
      return directionDuManche(MANCHE, (manche.doigt.x - (r.left + r.width / 2)) * 0.5, (manche.doigt.y - (r.top + r.height / 2)) * 0.5)
    }
    const x = (touches.has('arrowright') || touches.has('d') ? 1 : 0) - (touches.has('arrowleft') || touches.has('q') || touches.has('a') ? 1 : 0)
    const y = (touches.has('arrowdown') || touches.has('s') ? 1 : 0) - (touches.has('arrowup') || touches.has('z') || touches.has('w') ? 1 : 0)
    return { x, y }
  }

  // ---------------------------------------------------------------- dessiner
  /** Le ciel : trois couches d'étoiles en parallaxe et des nébuleuses de lumière, tirées des cases du monde. */
  function dessinerLeCiel(p: Peintre): void {
    const couches = [
      { parallaxe: 0.15, pas: 40, teintes: [COQUE[2], COQUE[3]], proba: 0.7 },
      { parallaxe: 0.35, pas: 34, teintes: [COQUE[3], COQUE[4]], proba: 0.6 },
      { parallaxe: 0.7, pas: 48, teintes: [COQUE[5], COQUE[6]], proba: 0.5 },
    ]
    couches.forEach((couche, n) => {
      const ox = camera.x * couche.parallaxe
      const oy = camera.y * couche.parallaxe
      const i0 = Math.floor(ox / couche.pas) - 1
      const j0 = Math.floor(oy / couche.pas) - 1
      for (let j = j0; j <= j0 + Math.ceil(H / couche.pas) + 2; j++)
        for (let i = i0; i <= i0 + Math.ceil(W / couche.pas) + 2; i++) {
          if (tire(i, j, 11 + n) > couche.proba) continue
          const x = (i + tire(i, j, 21 + n)) * couche.pas - ox + W / 2
          const y = (j + tire(i, j, 31 + n)) * couche.pas - oy + H / 2
          const scintille = 0.6 + 0.4 * Math.sin(t * (1.5 + tire(i, j, 41 + n) * 3) + tire(i, j, 51 + n) * 6.28)
          const grosse = n === 2 && tire(i, j, 61) > 0.7
          p.dot(x, y, scintille > 0.85 ? couche.teintes[1] : couche.teintes[0], n === 0 ? 0.55 : 1)
          if (grosse) {
            p.dot(x + 1, y, couche.teintes[0], 0.6)
            p.dot(x - 1, y, couche.teintes[0], 0.6)
            p.dot(x, y + 1, couche.teintes[0], 0.6)
            p.dot(x, y - 1, couche.teintes[0], 0.6)
            p.glow(x, y, 5, couche.teintes[1], 0.25 * scintille)
          }
        }
    })
    // les nébuleuses : une par grande case, une lueur large et faible, loin derrière
    const pas = 220
    const ox = camera.x * 0.1
    const oy = camera.y * 0.1
    for (let j = Math.floor(oy / pas) - 1; j <= Math.floor((oy + H) / pas) + 1; j++)
      for (let i = Math.floor(ox / pas) - 1; i <= Math.floor((ox + W) / pas) + 1; i++) {
        if (tire(i, j, 71) > 0.6) continue
        const x = (i + tire(i, j, 72)) * pas - ox + W / 2
        const y = (j + tire(i, j, 73)) * pas - oy + H / 2
        p.glow(x, y, 50 + 40 * tire(i, j, 74), COULEURS_NEBULEUSE[Math.floor(tire(i, j, 75) * COULEURS_NEBULEUSE.length)], 0.5)
      }
  }

  /**
   * Le vaisseau, dessiné le nez vers +x puis tourné vers son cap : la coque, les ailes, la verrière, le moteur et sa
   * flamme. IL PREND LA LUMIÈRE DU MONDE (Keko : « on peut le faire pour le vaisseau aussi ? ») : la direction de la
   * lumière est ramenée dans son repère (tournée de −cap), la coque est ombrée par une normale approchée (un fuseau
   * bombé), les ailes par leur inclinaison, et le reflet de la verrière glisse du côté de la lumière.
   */
  function dessinerLeVaisseau(p: Peintre): void {
    // À SA PLACE DANS LE MONDE, pas au centre de l'écran : la caméra prend de l'avance sur lui, et le dessiner au centre
    // le décalait de ses braises et de ses étincelles (Keko : « un offset bizarre diagonal »)
    p.place(v.x - camera.x + W / 2, v.y - camera.y + H / 2, false, v.cap)
    const lx = Math.cos(v.cap) * LUMIERE.x + Math.sin(v.cap) * LUMIERE.y
    const ly = -Math.sin(v.cap) * LUMIERE.x + Math.cos(v.cap) * LUMIERE.y
    const tonDe = (lum: number) => (lum > 0.72 ? COQUE[6] : lum > 0.5 ? COQUE[5] : lum > 0.28 ? COQUE[4] : lum > 0.08 ? COQUE[3] : COQUE[2])
    const coque = [[9, 0], [3, -3], [-5, -4], [-7, -2], [-7, 2], [-5, 4], [3, 3]]
    // la flamme, derrière : deux langues qui vacillent, et une lueur
    if (flamme > 0.02) {
      const L = (3 + 7 * flamme) * (0.85 + 0.15 * Math.sin(t * 60))
      p.poly([[-7, -1.8], [-7 - L, 0], [-7, 1.8]], FEU[4])
      p.poly([[-7, -1], [-7 - L * 0.6, 0], [-7, 1]], FEU[6])
      p.glow(-8 - L * 0.4, 0, 6 + 6 * flamme, FEU[5], 0.5 + 0.4 * flamme)
    }
    // les ailes : en arrière, de part et d'autre, une bande rouge
    for (const s of [-1, 1]) {
      // l'aile : une plaque inclinée vers l'extérieur, plus sombre au bout
      const lumAile = 0.3 + 0.45 * (s * 0.5 * ly + LUMIERE.z) 
      p.poly([[0, s * 2.5], [-6, s * 8], [-8, s * 8], [-6, s * 2.5]], (_x, y) => (s * y < 5 ? tonDe(lumAile) : tonDe(lumAile - 0.22)))
      p.line(-6.5, s * 7, -7.5, s * 7, N.hex('#d8403a'))
    }
    // le liseré, la coque ombrée (la lumière vient d'en haut à gauche de l'écran : on prend le dessus de la coque)
    p.poly(coque.map(([x, y]) => [x * 1.12 + (x > 0 ? 0.4 : -0.4), y * 1.25]), COQUE[0])
    // la coque : un fuseau bombé, sa normale approchée par (x/10, y/3.5, de face)
    p.poly(coque, (x, y) => tonDe((x / 10) * lx * 0.35 + (y / 3.5) * ly * 0.8 + LUMIERE.z * 0.9))
    p.line(-5, 0, 6, 0, tonDe(LUMIERE.z * 0.9 - 0.1))
    // la verrière et son éclat, qui glisse du côté de la lumière
    p.circle(3, 0, 1.8, VERRIERE[1])
    p.dot(3 + lx * 0.9, ly * 0.9, VERRIERE[2])
    p.dot(3 + lx * 1.4, ly * 1.4, VERRIERE[3])
    // le moteur : la tuyère sombre, un feu de position de chaque côté
    p.poly([[-7, -1.8], [-8, -1.3], [-8, 1.3], [-7, 1.8]], COQUE[1])
    p.dot(-6, -3.6, N.hex('#ff5a5a'))
    p.dot(-6, 3.6, N.hex('#4aff7a'))
    p.glow(3, 0, 5, VERRIERE[2], 0.25)
    // LE FOREUR SUR LE TOIT (Keko) : un dôme au milieu de la coque, un canon qui vise la roche creusée (ou devant)
    const vise = m.forage !== null ? Math.atan2(m.forage.y - v.y, m.forage.x - v.x) - v.cap : 0
    p.circle(-1.5, 0, 2.1, COQUE[1])
    p.circle(-1.8, -0.4, 1.3, COQUE[3])
    p.dot(-2.2, -0.8, COQUE[5])
    p.line(-1.5, 0, -1.5 + Math.cos(vise) * 4.5, Math.sin(vise) * 4.5, COQUE[2])
    p.dot(-1.5 + Math.cos(vise) * 4.5, Math.sin(vise) * 4.5, m.forage !== null ? LASER[5] : LASER[2])
    p.place(0, 0)
  }

  /** Le rayon du foreur : du canon au point d'impact, un cœur blanc qui tremble entre deux bords rouges, une lueur ; l'impact brûle. */
  function dessinerLeLaser(p: Peintre): void {
    if (m.forage === null) return
    const f = m.forage
    const vise = Math.atan2(f.y - v.y, f.x - v.x)
    const x0 = v.x + Math.cos(v.cap) * -1.5 + Math.cos(vise) * 4.5
    const y0 = v.y + Math.sin(v.cap) * -1.5 + Math.sin(vise) * 4.5
    p.place(W / 2 - camera.x, H / 2 - camera.y)
    const px = -Math.sin(vise)
    const py = Math.cos(vise)
    const vacille = 0.75 + 0.25 * Math.sin(t * 70)
    p.line(x0 + px, y0 + py, f.x + px, f.y + py, LASER[2], 0.7)
    p.line(x0 - px, y0 - py, f.x - px, f.y - py, LASER[2], 0.7)
    p.line(x0, y0, f.x, f.y, LASER[4], 1)
    p.line(x0, y0, f.x, f.y, N.WHITE, vacille)
    p.glowLine(x0, y0, f.x, f.y, 4, LASER[3], 0.45)
    // l'impact : un point blanc, une lueur qui grandit avec la part creusée
    p.circle(f.x, f.y, 1.2 + f.part, N.WHITE)
    p.glow(f.x, f.y, 8 + 10 * f.part, LASER[4], 0.6 + 0.4 * vacille)
    p.glow(f.x, f.y, 3, N.WHITE, 0.5)
    p.place(0, 0)
  }

  /** Le score, en haut à gauche de la scène : une pépite en icône, le nombre en police pixel du dépôt ; les pépites en vol y arrivent. */
  function dessinerLeScore(p: Peintre): void {
    // les pépites en vol : de la place du vaisseau à l'écran vers le compteur, en accélérant, une traînée de lumière
    for (let i = envols.length - 1; i >= 0; i--) {
      const e = envols[i]
      const u = (t - e.t0) / 0.45
      if (u >= 1) {
        envols.splice(i, 1)
        affiche += 1
        allumeA = t
        continue
      }
      const k = u * u * (3 - 2 * u)
      const x0 = e.x - camera.x + W / 2
      const y0 = e.y - camera.y + H / 2
      const x = x0 + (COMPTEUR.x - x0) * k
      const y = y0 + (COMPTEUR.y + 4 - y0) * k
      p.poly([[x, y - 2], [x + 2, y], [x, y + 2], [x - 2, y]], PEPITE[2])
      p.dot(x, y - 1, PEPITE[3])
      p.glow(x, y, 6, PEPITE[2], 0.5)
    }
    if (affiche === 0 && envols.length === 0) return
    const allume = t - allumeA < 0.18
    const haut = allume ? -1 : 0
    // l'icône : une pépite, qui saute avec le compteur
    const ix = COMPTEUR.x - 9
    const iy = COMPTEUR.y + 5 + haut
    p.poly([[ix, iy - 3], [ix + 3, iy], [ix, iy + 3], [ix - 3, iy]], PEPITE[2])
    p.dot(ix, iy - 1, PEPITE[3])
    p.dot(ix - 1, iy, PEPITE[4])
    p.dot(ix + 1, iy + 1, PEPITE[1])
    p.glow(ix, iy, 6, PEPITE[2], allume ? 0.8 : 0.3)
    p.text(String(affiche), COMPTEUR.x, COMPTEUR.y + haut, allume ? N.WHITE : PEPITE[3], { font: 'big', scale: 1, align: 'left', outline: COQUE[0] })
    if (allume) N.sparkle(p, ix, iy, 1 + 3 * Math.sin(((t - allumeA) / 0.18) * Math.PI), PEPITE[4], PEPITE[2], 0.5)
  }

  /** Les pépites : de petits losanges d'or qui respirent, un éclat, une lueur. */
  function dessinerLesPepites(p: Peintre): void {
    for (const pe of m.pepites) {
      const k = 0.6 + 0.4 * Math.sin(t * 6 + pe.graine)
      p.poly([[pe.x, pe.y - 2], [pe.x + 2, pe.y], [pe.x, pe.y + 2], [pe.x - 2, pe.y]], PEPITE[2])
      p.dot(pe.x, pe.y - 1, PEPITE[3])
      p.dot(pe.x - 1, pe.y, PEPITE[4], k)
      p.dot(pe.x + 1, pe.y + 1, PEPITE[1])
      p.glow(pe.x, pe.y, 5, PEPITE[2], 0.35 * k)
    }
  }

  function dessinerLeManche(): void {
    gs.clearRect(0, 0, surcouche.width, surcouche.height)
    if (manche === null) return
    const r = C.manche.rayon * dpr
    if (suivre) {
      gs.strokeStyle = 'rgba(255, 255, 255, 0.5)'
      gs.lineWidth = 2 * dpr
      gs.beginPath()
      gs.arc(manche.doigt.x * dpr, manche.doigt.y * dpr, 18 * dpr, 0, Math.PI * 2)
      gs.stroke()
      return
    }
    const x = manche.centre.x * dpr
    const y = manche.centre.y * dpr
    gs.fillStyle = 'rgba(0, 0, 0, 0.25)'
    gs.strokeStyle = 'rgba(255, 255, 255, 0.45)'
    gs.lineWidth = 2.5 * dpr
    gs.beginPath()
    gs.arc(x, y, r, 0, Math.PI * 2)
    gs.fill()
    gs.stroke()
    const dx = manche.doigt.x - manche.centre.x
    const dy = manche.doigt.y - manche.centre.y
    const d = Math.hypot(dx, dy)
    const k = d > C.manche.rayon ? C.manche.rayon / d : 1
    gs.fillStyle = 'rgba(255, 255, 255, 0.7)'
    gs.beginPath()
    gs.arc(x + dx * k * dpr, y + dy * k * dpr, r * 0.42, 0, Math.PI * 2)
    gs.fill()
  }

  // ---------------------------------------------------------------- la boucle
  let avant = performance.now()
  let accumule = 0
  function image(ms: number): void {
    const dt = Math.min(0.25, (ms - avant) / 1000)
    avant = ms
    t += dt
    if (enJeu) {
      accumule += dt
      const direction = directionVoulue()
      while (accumule >= PAS) {
        accumule -= PAS
        const r = avancerLeMonde(C, m, PAS, direction)
        v = m.vaisseau
        // le laser creuse : des étincelles au point d'impact, le long de la normale de la roche
        if (m.forage !== null && R.next() < 0.6) {
          const f = m.forage
          const nx = v.x - f.x
          const ny = v.y - f.y
          const d = Math.hypot(nx, ny) || 1
          const a = Math.atan2(ny, nx) + R.range(-1.1, 1.1)
          const vit = R.range(30, 90) * (0.6 + f.part)
          etincelles.spawn(N.P.SPARK, f.x + (nx / d) * 0.5, f.y + (ny / d) * 0.5, Math.cos(a) * vit + v.vx * 0.2, Math.sin(a) * vit + v.vy * 0.2, R.range(0.2, 0.45), N.WHITE, 1)
          if (R.next() < 0.25) etincelles.spawn(N.P.GRIT, f.x, f.y, Math.cos(a) * vit * 0.5, Math.sin(a) * vit * 0.5, R.range(0.4, 0.8), rocheDe(m.forage.cible)[4], 1)
        }
        // une roche éclate : un flash, ses morceaux qui partent en tournant et s'éteignent
        for (const ec of r.eclats) {
          flashs.push({ x: ec.x, y: ec.y, t0: t, r: ec.rayon })
          const roche = rocheDe(ec.graine)
          const n = 6 + Math.round(ec.rayon)
          for (let i = 0; i < n; i++) {
            const a = R.range(0, Math.PI * 2)
            const d = R.range(0, ec.rayon * 0.7)
            const vit = R.range(25, 90)
            morceaux.add({ kind: N.B.SHARD, x: ec.x + Math.cos(a) * d, y: ec.y + Math.sin(a) * d, vx: Math.cos(a) * vit, vy: Math.sin(a) * vit, g: 0, drag: 1.1, bounce: 0, life: R.range(0.8, 1.6), a: R.range(0, Math.PI * 2), va: R.range(-9, 9), s: R.range(1.5, 2.5 + ec.rayon * 0.15), c: roche[2 + Math.floor(R.next() * 4)] })
          }
          secousse = Math.max(secousse, Math.min(1, 0.3 + ec.rayon / 20))
          if (typeof navigator.vibrate === 'function') navigator.vibrate(30)
        }
        for (const pe of r.ramasses) {
          flashs.push({ x: pe.x, y: pe.y, t0: t, r: 0 })
          envols.push({ x: v.x, y: v.y, t0: t })
        }
        for (const choc of r.chocs) {
          secousse = Math.min(1, 0.3 + choc.force / 120)
          if (typeof navigator.vibrate === 'function') navigator.vibrate(Math.round(10 + choc.force / 4))
          const mod = FX['impacts/hit-spark']
          if (mod !== undefined) {
            // l'étincelle du dépôt frappe à `height` au-dessus de son origine (un impact sur un sol) : ici la frappe est À
            // l'origine (height 0), et le « haut » de l'effet est la normale de la roche, pour que les éclats en jaillissent
            // et y retombent — Keko : « le point de naissance des étincelles est toujours décalé »
            const nx = v.x - choc.x
            const ny = v.y - choc.y
            const fx = N.createFx(mod, { x: choc.x - camera.x + W / 2, y: choc.y - camera.y + H / 2, height: 0, angle: Math.atan2(nx, -ny), palette: N.PAL.stone })
            effets.push({ fx, x: choc.x, y: choc.y })
          }
        }
        // les braises du moteur, en coordonnées du monde, derrière la tuyère
        if (v.poussee > 0.05) {
          const n = v.poussee > 0.6 ? 2 : 1
          for (let i = 0; i < n; i++) {
            const bx = v.x - Math.cos(v.cap) * 8
            const by = v.y - Math.sin(v.cap) * 8
            const vitesse = 30 + 40 * v.poussee
            braises.spawn(N.P.EMBER, bx + R.range(-1, 1), by + R.range(-1, 1), v.vx * 0.3 - Math.cos(v.cap) * vitesse + R.range(-8, 8), v.vy * 0.3 - Math.sin(v.cap) * vitesse + R.range(-8, 8), R.range(0.25, 0.5), FEU[5], R.range(0.6, 1.2))
          }
        }
      }
      flamme += (v.poussee - flamme) * Math.min(1, dt * 14)
    }
    // la caméra suit, avec un peu d'avance dans le sens de la vitesse
    const viseX = v.x + v.vx * 0.35
    const viseY = v.y + v.vy * 0.35
    camera.x += (viseX - camera.x) * Math.min(1, dt * 4)
    camera.y += (viseY - camera.y) * Math.min(1, dt * 4)
    braises.update(dt)
    etincelles.update(dt)
    morceaux.update(dt)
    for (let i = flashs.length - 1; i >= 0; i--) if (t - flashs[i].t0 > 0.4) flashs.splice(i, 1)
    for (const e of effets) {
      e.fx.update(dt)
      e.fx.options.x = e.x - camera.x + W / 2
      e.fx.options.y = e.y - camera.y + H / 2
    }
    effets = effets.filter((e) => !e.fx.done())

    N.clearFrame(frame)
    const p = N.painterFor(frame)
    dessinerLeCiel(p)
    for (const a of asteroidesVisibles(C, m, camera.x, camera.y, Math.max(W, H) / 2 + C.champ.rayonMax + 4)) {
      // la roche qu'on creuse tremble, d'autant plus qu'elle est près d'éclater
      const creusee = m.forage !== null && m.forage.cible === a.id
      const tremble = creusee ? (0.5 + m.forage!.part) * 1.2 : 0
      dessinerAsteroide(p, a, t, a.x - camera.x + W / 2 + (tremble > 0 ? (R.next() - 0.5) * tremble : 0), a.y - camera.y + H / 2 + (tremble > 0 ? (R.next() - 0.5) * tremble : 0))
    }
    // les braises, les morceaux, les pépites, les étincelles sont dans le monde : le peintre se place sur la caméra
    p.place(W / 2 - camera.x, H / 2 - camera.y)
    braises.draw(p)
    morceaux.draw(p)
    dessinerLesPepites(p)
    etincelles.draw(p)
    for (const f of flashs) {
      const u = (t - f.t0) / 0.4
      if (f.r === 0) {
        // une pépite montée à bord : un éclat
        N.sparkle(p, f.x, f.y, 1 + 3 * Math.sin(u * Math.PI), PEPITE[3], PEPITE[2], 0.5 * (1 - u))
        continue
      }
      p.glow(f.x, f.y, f.r * 2 + 10, LASER[4], 0.8 * (1 - u))
      p.ring(f.x, f.y, f.r * 0.5 + f.r * 2.2 * u, 1, u < 0.3 ? N.WHITE : LASER[3], 1 - u)
    }
    p.place(0, 0)
    dessinerLeVaisseau(p)
    dessinerLeLaser(p)
    dessinerLeScore(p)
    for (const e of effets) e.fx.draw(frame)
    N.composite(frame, img.data, FOND)
    g.putImageData(img, 0, 0)
    secousse = Math.max(0, secousse - dt / 0.25)
    canvas.style.transform = secousse > 0 ? `translate(${(Math.random() - 0.5) * secousse * 8}px, ${(Math.random() - 0.5) * secousse * 8}px)` : ''
    dessinerLeManche()
    requestAnimationFrame(image)
  }
  cadrer()
  new ResizeObserver(cadrer).observe(racine)
  requestAnimationFrame(image)
}

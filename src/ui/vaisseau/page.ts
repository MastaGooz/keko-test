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
import { asteroidesVisibles, avancerLeMonde, centreQuiSuit, directionDuManche, MANCHE, nouveauMonde, tire, VAISSEAU as C, type ConfigVaisseau, type Forage, type Vaisseau, type Vecteur } from '../../logic/vaisseau/jeu.ts'
import { dessinerAsteroide, LUMIERE, rocheDe } from './asteroide.ts'
import { dessinerStation } from './station.ts'
import * as EXPLOSION from '../pixelfx/fx/keko/explosion-espace.js'
import { Grains } from '../pixelfx/fx/keko/_espace.js'

type Instance = { t: number; options: Record<string, unknown>; update(dt: number): void; draw(frame: unknown, couche?: string): void; stop(): void; done(): boolean }
type Module = { meta?: Record<string, unknown> }
type Peintre = {
  place(x: number, y: number, flip?: boolean, angle?: number): Peintre
  px(x: number, y: number, c: number): void
  dot(x: number, y: number, c: number, a?: number): void
  circle(x: number, y: number, r: number, c: number | ((x: number, y: number) => number), a?: number): void
  ring(x: number, y: number, r: number, w: number, c: number | ((x: number, y: number) => number), a?: number): void
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

/** La scène fait 180 px de large ; SA HAUTEUR SUIT L'ÉCRAN (Keko : « le score est trop bas, il n'est plus en haut » — à 320 px fixes, centrée, elle laissait cent pixels de noir au-dessus d'elle). */
const W = 180
let H = 320
const PAS = 1 / 60
const COQUE = N.fit(['#141a2a', '#2a3550', '#46587a', '#6f87ab', '#9fb4d2', '#d6e4f5', '#ffffff'], 7)
const VERRIERE = N.fit(['#0a3a4a', '#19a0c0', '#8ff0ff', '#ffffff'], 4)
const FEU = N.fit(N.PAL.fire, 8)
const LASER = N.fit(['#3a0a10', '#a01020', '#ff2a3a', '#ff7a5a', '#ffd0a0', '#ffffff'], 6)
const PEPITE = N.fit(['#3a2a06', '#b8860b', '#ffd23a', '#fff6c0', '#ffffff'], 5)
/** L'ennemi : une coque rouge sombre, une verrière orange, un laser violet. */
const ROUGE = N.fit(['#1a0a0e', '#4a1a22', '#7a2a36', '#a8404c', '#d06a70', '#f0a0a0', '#ffffff'], 7)
const VERRIERE_ENNEMIE = N.fit(['#4a2a06', '#d07a18', '#ffc860', '#ffffff'], 4)
const VIOLET = N.fit(['#1a0a2a', '#5a1a90', '#9a3ae0', '#c070ff', '#e8c0ff', '#ffffff'], 6)
const BLANC = N.fit(['#ffffff', '#ffffff', '#ffffff', '#ffffff', '#ffffff', '#ffffff', '#ffffff'], 7)
/** Les teintes de la station : l'acier, la verrière, l'or du quai, le fanal, les cellules des panneaux. */
const TEINTES_STATION = {
  acier: N.fit(['#0c0e14', '#1c2230', '#2e3648', '#4a5468', '#6e7a90', '#9aa6ba', '#d0d8e6', '#ffffff'], 8),
  verre: VERRIERE,
  or: PEPITE,
  rouge: N.hex('#ff3a3a'),
  cellule: N.fit(['#0a1430', '#152a60', '#2a4a9a'], 3),
}
/** L'explosion d'un vaisseau : celle du dépôt sans son sol, à la taille du vaisseau (Keko : « l'effet nommé Explosion en version sans sol et à la taille du vaisseau ») ; le rival en rouge, ses morceaux de sa coque. */
const EXPLOSION_RIVAL = ['#3a0a12', '#a01030', '#e0304a', '#ff6a5a', '#ffa080', '#ffd0b0', '#ffe8dc', '#ffffff']
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
  /** `&ennemi` : l'ennemi naît tout de suite, tout près (pour le voir sans attendre). */
  const CONF: ConfigVaisseau = parametres.has('ennemi') ? { ...C, ennemi: { ...C.ennemi, apparait: 0, distance: 90 } } : C

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
  ecran.append(el('h1', '', 'Le vaisseau'), el('p', '', 'Posez le doigt n’importe où : un manche apparaît. Il pousse le vaisseau dans sa direction ; relâchez, il glisse. Le foreur du toit creuse seul la roche la plus proche ; les pépites viennent à vous. Revenez à la station pour les déposer : ce que vous portez se perd avec la coque, ce qui est déposé reste. Au clavier : les flèches ou ZQSD.'), el('p', 'vaisseau-go', 'Touchez pour décoller'))
  const pied = el('div', 'vaisseau-build', `vaisseau · build ${build}`)
  racine.append(scene, surcouche, ecran, pied)

  // ---------------------------------------------------------------- l'état
  let m = nouveauMonde(CONF)
  m.minerai = minerai0
  let v: Vaisseau = m.vaisseau
  let perduA = -10
  let toucheA = -10
  const flammesEnnemies = new Map<number, number>()
  let enJeu = false
  let zoom = 2
  let frame = N.createFrame(W, H)
  let img = g.createImageData(W, H)
  const R = new N.Rng(7)
  /** Les grains de l'espace : sans pesanteur ni montée (Keko : « des débris tombent vers le bas comme s'il y avait de la gravité »). */
  const braises = new Grains(R)
  /** Les étincelles des chocs vivent DANS LE MONDE : on garde leur point et on les replace sous la caméra à chaque image. */
  let effets: { fx: Instance; x: number; y: number }[] = []
  /** Le forage : les étincelles du point d'impact, les morceaux des roches éclatées (sans pesanteur : l'espace), les flashs. */
  const etincelles = new Grains(R)
  const morceaux = new N.Bits({ ground: () => Infinity })
  const flashs: { x: number; y: number; t0: number; r: number }[] = []
  /** LE SCORE EN PIXELS (Keko : « dessiner le score en haut en pixel ») : une pépite ramassée VOLE du vaisseau au compteur, qui ne compte qu'à son arrivée, et s'allume. */
  const envols: { x: number; y: number; t0: number }[] = []
  let affiche = minerai0
  /** Les pépites déposées : elles volent du vaisseau à la station (dans le monde), la banque ne compte qu'à l'arrivée. */
  const depots: { x: number; y: number; t0: number }[] = []
  let afficheBanque = 0
  let depotA = -10
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
  /** Le premier toucher décolle ; après une coque percée, il repart à neuf. */
  function demarrer(): void {
    if (m.phase === 'perdu') {
      if (t - perduA < 1.2) return
      const banque = m.banque
      m = nouveauMonde(CONF)
      m.banque = banque
      effets = []
      flashs.length = 0
      envols.length = 0
      affiche = 0
      afficheBanque = m.banque
      depots.length = 0
      flammesEnnemies.clear()
      v = m.vaisseau
      camera.x = 0
      camera.y = 0
    }
    enJeu = true
    ecran.hidden = true
  }
  racine.addEventListener('pointerdown', (ev) => {
    demarrer()
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
    demarrer()
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
      // (les cases balayées partent du BORD de l'écran, pas de son centre : balayées depuis le centre, le haut restait
      // vide sur une demi-hauteur — Keko : « sur tél, les étoiles n'existent pas en haut de l'écran » ; sur PC le tampon
      // est si bas que ça ne se voyait pas)
      const i0 = Math.floor((ox - W / 2) / couche.pas) - 1
      const j0 = Math.floor((oy - H / 2) / couche.pas) - 1
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
    for (let j = Math.floor((oy - H / 2) / pas) - 1; j <= Math.floor((oy + H / 2) / pas) + 1; j++)
      for (let i = Math.floor((ox - W / 2) / pas) - 1; i <= Math.floor((ox + W / 2) / pas) + 1; i++) {
        if (tire(i, j, 71) > 0.6) continue
        const x = (i + tire(i, j, 72)) * pas - ox + W / 2
        const y = (j + tire(i, j, 73)) * pas - oy + H / 2
        p.glow(x, y, 50 + 40 * tire(i, j, 74), COULEURS_NEBULEUSE[Math.floor(tire(i, j, 75) * COULEURS_NEBULEUSE.length)], 0.5)
      }
  }

  /**
   * UN vaisseau (le joueur ou un ennemi), dessiné le nez vers +x puis tourné vers son cap : la coque, les ailes, la
   * verrière, le moteur et sa flamme, le foreur sur le toit. IL PREND LA LUMIÈRE DU MONDE (Keko : « on peut le faire
   * pour le vaisseau aussi ? ») : la direction de la lumière est ramenée dans son repère (tournée de −cap), la coque est
   * ombrée par une normale approchée (un fuseau bombé), les ailes par leur inclinaison, et le reflet de la verrière
   * glisse du côté de la lumière. `vise` : l'angle du canon (local) ; `tire` : il creuse.
   */
  function dessinerUnVaisseau(p: Peintre, corps: Vaisseau, flam: number, coque: number[], verre: number[], vise: number, tire: boolean): void {
    p.place(corps.x - camera.x + W / 2, corps.y - camera.y + H / 2, false, corps.cap)
    const lx = Math.cos(corps.cap) * LUMIERE.x + Math.sin(corps.cap) * LUMIERE.y
    const ly = -Math.sin(corps.cap) * LUMIERE.x + Math.cos(corps.cap) * LUMIERE.y
    const tonDe = (lum: number) => (lum > 0.72 ? coque[6] : lum > 0.5 ? coque[5] : lum > 0.28 ? coque[4] : lum > 0.08 ? coque[3] : coque[2])
    const forme = [[9, 0], [3, -3], [-5, -4], [-7, -2], [-7, 2], [-5, 4], [3, 3]]
    if (flam > 0.02) {
      const L = (3 + 7 * flam) * (0.85 + 0.15 * Math.sin(t * 60))
      p.poly([[-7, -1.8], [-7 - L, 0], [-7, 1.8]], FEU[4])
      p.poly([[-7, -1], [-7 - L * 0.6, 0], [-7, 1]], FEU[6])
      p.glow(-8 - L * 0.4, 0, 6 + 6 * flam, FEU[5], 0.5 + 0.4 * flam)
    }
    for (const s of [-1, 1]) {
      const lumAile = 0.3 + 0.45 * (s * 0.5 * ly + LUMIERE.z)
      p.poly([[0, s * 2.5], [-6, s * 8], [-8, s * 8], [-6, s * 2.5]], (_x, y) => (s * y < 5 ? tonDe(lumAile) : tonDe(lumAile - 0.22)))
      p.line(-6.5, s * 7, -7.5, s * 7, N.hex('#d8403a'))
    }
    p.poly(forme.map(([x, y]) => [x * 1.12 + (x > 0 ? 0.4 : -0.4), y * 1.25]), coque[0])
    p.poly(forme, (x, y) => tonDe((x / 10) * lx * 0.35 + (y / 3.5) * ly * 0.8 + LUMIERE.z * 0.9))
    p.line(-5, 0, 6, 0, tonDe(LUMIERE.z * 0.9 - 0.1))
    p.circle(3, 0, 1.8, verre[1])
    p.dot(3 + lx * 0.9, ly * 0.9, verre[2])
    p.dot(3 + lx * 1.4, ly * 1.4, verre[3])
    p.poly([[-7, -1.8], [-8, -1.3], [-8, 1.3], [-7, 1.8]], coque[1])
    p.dot(-6, -3.6, N.hex('#ff5a5a'))
    p.dot(-6, 3.6, N.hex('#4aff7a'))
    p.glow(3, 0, 5, verre[2], 0.25)
    // le foreur sur le toit : un dôme au milieu de la coque, un canon qui vise
    p.circle(-1.5, 0, 2.1, coque[1])
    p.circle(-1.8, -0.4, 1.3, coque[3])
    p.dot(-2.2, -0.8, coque[5])
    p.line(-1.5, 0, -1.5 + Math.cos(vise) * 4.5, Math.sin(vise) * 4.5, coque[2])
    p.dot(-1.5 + Math.cos(vise) * 4.5, Math.sin(vise) * 4.5, tire ? LASER[5] : LASER[2])
    p.place(0, 0)
  }

  function dessinerLeVaisseau(p: Peintre): void {
    const vise = m.forage !== null ? Math.atan2(m.forage.y - v.y, m.forage.x - v.x) - v.cap : 0
    const blanchi = t - toucheA < 0.1
    dessinerUnVaisseau(p, v, flamme, blanchi ? BLANC : COQUE, blanchi ? BLANC : VERRIERE, vise, m.forage !== null)
  }

  function dessinerLesEnnemis(p: Peintre): void {
    for (const e of m.ennemis) {
      const b = e.corps
      const cible = e.forage !== null ? e.forage : e.fait === 'chasse' ? { x: v.x, y: v.y } : null
      const vise = cible !== null ? Math.atan2(cible.y - b.y, cible.x - b.x) - b.cap : 0
      const blanchi = m.forage !== null && m.forage.sorte === 'ennemi' && m.forage.cible === e.id && Math.floor(t * 20) % 2 === 0
      dessinerUnVaisseau(p, b, flammesEnnemies.get(e.id) ?? 0, blanchi ? BLANC : ROUGE, blanchi ? BLANC : VERRIERE_ENNEMIE, vise, e.forage !== null)
    }
  }

  /** Les traits de l'ennemi : un fuseau violet-blanc le long de sa vitesse, une lueur. */
  function dessinerLesTirs(p: Peintre): void {
    p.place(W / 2 - camera.x, H / 2 - camera.y)
    for (const tr of m.tirs) {
      const l = Math.hypot(tr.vx, tr.vy) || 1
      const ux = tr.vx / l
      const uy = tr.vy / l
      p.line(tr.x - ux * 5, tr.y - uy * 5, tr.x - ux * 2, tr.y - uy * 2, VIOLET[2])
      p.line(tr.x - ux * 2, tr.y - uy * 2, tr.x, tr.y, VIOLET[4])
      p.px(tr.x, tr.y, N.WHITE)
      p.glow(tr.x, tr.y, 6, VIOLET[3], 0.6)
    }
    p.place(0, 0)
  }

  /** Un rayon de foreur : du canon au point d'impact, un cœur blanc qui tremble entre deux bords colorés, une lueur ; l'impact brûle. */
  function dessinerUnLaser(p: Peintre, depuis: Vaisseau, f: Forage, teintes: number[]): void {
    const vise = Math.atan2(f.y - depuis.y, f.x - depuis.x)
    const x0 = depuis.x + Math.cos(depuis.cap) * -1.5 + Math.cos(vise) * 4.5
    const y0 = depuis.y + Math.sin(depuis.cap) * -1.5 + Math.sin(vise) * 4.5
    const px = -Math.sin(vise)
    const py = Math.cos(vise)
    const vacille = 0.75 + 0.25 * Math.sin(t * 70)
    p.line(x0 + px, y0 + py, f.x + px, f.y + py, teintes[2], 0.7)
    p.line(x0 - px, y0 - py, f.x - px, f.y - py, teintes[2], 0.7)
    p.line(x0, y0, f.x, f.y, teintes[4], 1)
    p.line(x0, y0, f.x, f.y, N.WHITE, vacille)
    p.glowLine(x0, y0, f.x, f.y, 4, teintes[3], 0.45)
    p.circle(f.x, f.y, 1.2 + f.part, N.WHITE)
    p.glow(f.x, f.y, 8 + 10 * f.part, teintes[4], 0.6 + 0.4 * vacille)
    p.glow(f.x, f.y, 3, N.WHITE, 0.5)
  }

  function dessinerLesLasers(p: Peintre): void {
    p.place(W / 2 - camera.x, H / 2 - camera.y)
    if (m.forage !== null && m.phase === 'vol') dessinerUnLaser(p, v, m.forage, LASER)
    for (const e of m.ennemis) if (e.forage !== null) dessinerUnLaser(p, e.corps, e.forage, VIOLET)
    p.place(0, 0)
  }

  /** La station d'extraction (son dessin est dans `station.ts`), son parvis, et les pépites déposées qui y volent. */
  function dessinerLaStation(p: Peintre): void {
    const sx = CONF.station.x - camera.x + W / 2
    const sy = CONF.station.y - camera.y + H / 2
    const aQuai = m.phase === 'vol' && Math.hypot(v.x - CONF.station.x, v.y - CONF.station.y) <= CONF.station.portee
    if (sx > -40 && sy > -40 && sx < W + 40 && sy < H + 40) {
      // le parvis : un cercle pointillé qui dit la portée, plus net à quai
      for (let i = 0; i < 36; i++) {
        const a = (i / 36) * Math.PI * 2 + t * 0.25
        p.dot(sx + Math.cos(a) * CONF.station.portee, sy + Math.sin(a) * CONF.station.portee, aQuai ? PEPITE[2] : COQUE[2], aQuai ? 0.9 : 0.45)
      }
      dessinerStation(p, sx, sy, t, CONF.station.rayon, aQuai, TEINTES_STATION)
      if (aQuai && t - depotA < 0.2) p.glow(sx, sy, CONF.station.rayon * 2.4, PEPITE[2], 0.4)
    }
    // les pépites déposées : elles volent du vaisseau au cœur de la station
    for (let i = depots.length - 1; i >= 0; i--) {
      const d = depots[i]
      const u = (t - d.t0) / 0.4
      if (u >= 1) {
        depots.splice(i, 1)
        afficheBanque += 1
        depotA = t
        continue
      }
      const k = u * u * (3 - 2 * u)
      const x = d.x - camera.x + W / 2 + (sx - (d.x - camera.x + W / 2)) * k
      const y = d.y - camera.y + H / 2 + (sy - (d.y - camera.y + H / 2)) * k
      p.poly([[x, y - 2], [x + 2, y], [x, y + 2], [x - 2, y]], PEPITE[2])
      p.dot(x, y - 1, PEPITE[3])
      p.glow(x, y, 6, PEPITE[2], 0.5)
    }
  }

  /**
   * Une simple flèche jaune au bord de l'écran vers la station hors champ (Keko : « une simple flèche comme ce qu'on
   * avait pour l'ennemi, mais en jaune » — la petite station en icône, qui battait, « n'est pas très belle et clignote
   * bizarrement »). Elle ne bat pas.
   */
  function dessinerLePointeur(p: Peintre): void {
    const dx = CONF.station.x - camera.x
    const dy = CONF.station.y - camera.y
    const marge = 10
    if (Math.abs(dx) < W / 2 - marge && Math.abs(dy) < H / 2 - marge) return
    // le point du bord dans sa direction
    const k = Math.min((W / 2 - marge) / Math.max(1e-6, Math.abs(dx)), (H / 2 - marge) / Math.max(1e-6, Math.abs(dy)))
    const x = W / 2 + dx * k
    const y = H / 2 + dy * k
    const a = Math.atan2(dy, dx)
    const pointe = [x + Math.cos(a) * 4, y + Math.sin(a) * 4]
    const g1 = [x + Math.cos(a + 2.5) * 4, y + Math.sin(a + 2.5) * 4]
    const g2 = [x + Math.cos(a - 2.5) * 4, y + Math.sin(a - 2.5) * 4]
    p.poly([pointe, g1, g2], PEPITE[2])
    p.px(pointe[0], pointe[1], PEPITE[3])
    p.glow(x, y, 6, PEPITE[2], 0.4)
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
    // la coque, en haut à droite : une case par point, pleine ou vide ; elle clignote quand on vient d'être touché
    for (let i = 0; i < CONF.coque; i++) {
      const x = W - 8 - (CONF.coque - 1 - i) * 6
      // la case se vide par le haut à mesure que le point s'entame (les chocs coûtent des fractions)
      const part = Math.max(0, Math.min(1, m.coque - i))
      const chaud = t - toucheA < 0.3 && Math.floor(t * 16) % 2 === 0
      p.poly([[x - 2, COMPTEUR.y + 2], [x + 2, COMPTEUR.y + 2], [x + 2, COMPTEUR.y + 6], [x - 2, COMPTEUR.y + 6]], COQUE[1])
      if (part > 0) {
        const haut = COMPTEUR.y + 6 - Math.max(1, Math.round(4 * part))
        p.poly([[x - 2, haut], [x + 2, haut], [x + 2, COMPTEUR.y + 6], [x - 2, COMPTEUR.y + 6]], chaud ? N.WHITE : COQUE[5])
        if (part >= 1) p.dot(x - 1, COMPTEUR.y + 3, COQUE[6])
      }
    }
    // la banque, à côté du porté : une petite station en icône et son nombre
    if (afficheBanque > 0 || depots.length > 0) {
      const bx = COMPTEUR.x + 30
      const by = COMPTEUR.y + 5
      const chaud = t - depotA < 0.18
      p.ring(bx, by - (chaud ? 1 : 0), 3, 1.4, COQUE[4])
      p.dot(bx, by - (chaud ? 1 : 0), chaud ? PEPITE[3] : VERRIERE[2])
      p.text(String(afficheBanque), bx + 7, COMPTEUR.y - (chaud ? 1 : 0), chaud ? N.WHITE : COQUE[5], { font: 'big', scale: 1, align: 'left', outline: COQUE[0] })
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
        const r = avancerLeMonde(CONF, m, PAS, direction)
        v = m.vaisseau
        // les lasers creusent : des étincelles au point d'impact, le long de la normale (le joueur, et chaque ennemi qui mine)
        const forages: { f: Forage; depuis: Vaisseau }[] = []
        if (m.forage !== null) forages.push({ f: m.forage, depuis: v })
        for (const e of m.ennemis) if (e.forage !== null) forages.push({ f: e.forage, depuis: e.corps })
        for (const { f, depuis } of forages) {
          if (R.next() >= 0.6) continue
          const nx = depuis.x - f.x
          const ny = depuis.y - f.y
          const d = Math.hypot(nx, ny) || 1
          const a = Math.atan2(ny, nx) + R.range(-1.1, 1.1)
          const vit = R.range(30, 90) * (0.6 + f.part)
          etincelles.ajouter('etincelle', f.x + (nx / d) * 0.5, f.y + (ny / d) * 0.5, Math.cos(a) * vit + depuis.vx * 0.2, Math.sin(a) * vit + depuis.vy * 0.2, R.range(0.2, 0.45), R.next() < 0.5 ? LASER[4] : LASER[3], 1, 2.5)
          if (R.next() < 0.25) etincelles.ajouter('braise', f.x, f.y, Math.cos(a) * vit * 0.5, Math.sin(a) * vit * 0.5, R.range(0.4, 0.8), 0, 1, 1.5)
        }
        for (const ev of r.evenements) {
          switch (ev.type) {
            case 'eclat': {
              // une roche éclate : un flash, ses morceaux qui partent en tournant et s'éteignent
              flashs.push({ x: ev.x, y: ev.y, t0: t, r: ev.rayon })
              const roche = rocheDe(ev.graine)
              const n = 6 + Math.round(ev.rayon)
              for (let i = 0; i < n; i++) {
                const a = R.range(0, Math.PI * 2)
                const d = R.range(0, ev.rayon * 0.7)
                const vit = R.range(25, 90)
                morceaux.add({ kind: N.B.SHARD, x: ev.x + Math.cos(a) * d, y: ev.y + Math.sin(a) * d, vx: Math.cos(a) * vit, vy: Math.sin(a) * vit, g: 0, drag: 1.1, bounce: 0, life: R.range(0.8, 1.6), a: R.range(0, Math.PI * 2), va: R.range(-9, 9), s: R.range(1.5, 2.5 + ev.rayon * 0.15), c: roche[2 + Math.floor(R.next() * 4)] })
              }
              secousse = Math.max(secousse, Math.min(1, 0.3 + ev.rayon / 20))
              if (typeof navigator.vibrate === 'function') navigator.vibrate(30)
              break
            }
            case 'ramasse':
              flashs.push({ x: ev.x, y: ev.y, t0: t, r: 0 })
              if (ev.par === 'joueur') envols.push({ x: v.x, y: v.y, t0: t })
              break
            case 'depose':
              depots.push({ x: v.x, y: v.y, t0: t })
              affiche = Math.max(0, affiche - 1)
              break
            case 'touche': {
              // un trait perce la coque : le vaisseau blanchit, une étincelle rouge, une secousse, une vibration
              toucheA = t
              secousse = Math.max(secousse, 0.7)
              if (typeof navigator.vibrate === 'function') navigator.vibrate(40)
              for (let i = 0; i < 10; i++) {
                const a = R.range(0, Math.PI * 2)
                const vit = R.range(30, 110)
                etincelles.ajouter('etincelle', ev.x, ev.y, Math.cos(a) * vit, Math.sin(a) * vit, R.range(0.2, 0.5), R.next() < 0.5 ? N.WHITE : ROUGE[4], 1, 2.5)
              }
              flashs.push({ x: ev.x, y: ev.y, t0: t, r: -1 })
              break
            }
            case 'ennemiDetruit': {
              // l'ennemi éclate comme une roche, en rouge, et rend ses pépites (la règle les a faites naître)
              effets.push({ fx: N.createFx(EXPLOSION as Module, { x: ev.x - camera.x + W / 2, y: ev.y - camera.y + H / 2, palette: EXPLOSION_RIVAL, debris: '#7a2a36', size: 0.35, seed: ev.id }), x: ev.x, y: ev.y })
              for (let i = 0; i < 14; i++) {
                const a = R.range(0, Math.PI * 2)
                const vit = R.range(30, 110)
                morceaux.add({ kind: N.B.SHARD, x: ev.x, y: ev.y, vx: Math.cos(a) * vit + ev.vx * 0.4, vy: Math.sin(a) * vit + ev.vy * 0.4, g: 0, drag: 1.2, bounce: 0, life: R.range(0.8, 1.5), a: R.range(0, Math.PI * 2), va: R.range(-10, 10), s: R.range(1.5, 3), c: ROUGE[1 + Math.floor(R.next() * 4)] })
              }
              secousse = Math.max(secousse, 0.6)
              flammesEnnemies.delete(ev.id)
              if (typeof navigator.vibrate === 'function') navigator.vibrate(40)
              break
            }
            case 'perdu': {
              // le joueur explose et disparaît ; l'écran de fin attend que la boule de feu soit passée
              perduA = t
              effets.push({ fx: N.createFx(EXPLOSION as Module, { x: v.x - camera.x + W / 2, y: v.y - camera.y + H / 2, debris: '#46587a', size: 0.45, seed: 5 }), x: v.x, y: v.y })
              for (let i = 0; i < 18; i++) {
                const a = R.range(0, Math.PI * 2)
                const vit = R.range(30, 120)
                morceaux.add({ kind: N.B.SHARD, x: v.x, y: v.y, vx: Math.cos(a) * vit + v.vx * 0.4, vy: Math.sin(a) * vit + v.vy * 0.4, g: 0, drag: 1.2, bounce: 0, life: R.range(0.9, 1.6), a: R.range(0, Math.PI * 2), va: R.range(-10, 10), s: R.range(1.5, 3), c: COQUE[1 + Math.floor(R.next() * 4)] })
              }
              secousse = 1
              if (typeof navigator.vibrate === 'function') navigator.vibrate([60, 40, 90])
              ecran.replaceChildren(el('h1', '', 'Coque percée'), el('p', '', `${m.minerai} pépite${m.minerai > 1 ? 's' : ''} perdue${m.minerai > 1 ? 's' : ''} avec la coque, ${m.banque} en banque à la station. Le rival rôde toujours : il mine les mêmes roches que vous, et tire dès qu’il vous voit. Votre foreur le creuse comme une roche s’il est plus près qu’elle.`), el('p', 'vaisseau-go', 'Touchez pour repartir'))
              break
            }
            default:
              break
          }
        }
        for (const choc of r.chocs) {
          secousse = Math.min(1, 0.3 + choc.force / 120)
          if (typeof navigator.vibrate === 'function') navigator.vibrate(Math.round(10 + choc.force / 4))
          // une gerbe d'étincelles le long de la normale (celles du dépôt tombent : c'est l'espace)
          const nx = v.x - choc.x
          const ny = v.y - choc.y
          const l = Math.hypot(nx, ny) || 1
          const n = 6 + Math.round(choc.force / 8)
          for (let i = 0; i < n; i++) {
            const a = Math.atan2(ny / l, nx / l) + R.range(-1.2, 1.2)
            const vit = R.range(30, 60 + choc.force)
            etincelles.ajouter('etincelle', choc.x, choc.y, Math.cos(a) * vit, Math.sin(a) * vit, R.range(0.25, 0.6), R.next() < 0.5 ? N.WHITE : rocheDe(choc.asteroide)[5], 1, 2.5)
          }
          flashs.push({ x: choc.x, y: choc.y, t0: t, r: -1 })
        }
        // les braises du moteur, en coordonnées du monde, derrière la tuyère
        if (v.poussee > 0.05) {
          const n = v.poussee > 0.6 ? 2 : 1
          for (let i = 0; i < n; i++) {
            const bx = v.x - Math.cos(v.cap) * 8
            const by = v.y - Math.sin(v.cap) * 8
            const vitesse = 30 + 40 * v.poussee
            braises.ajouter('braise', bx + R.range(-1, 1), by + R.range(-1, 1), v.vx * 0.3 - Math.cos(v.cap) * vitesse + R.range(-8, 8), v.vy * 0.3 - Math.sin(v.cap) * vitesse + R.range(-8, 8), R.range(0.25, 0.5), 0, 1, 2)
          }
        }
      }
      flamme += (v.poussee - flamme) * Math.min(1, dt * 14)
      for (const e of m.ennemis) {
        const f = flammesEnnemies.get(e.id) ?? 0
        flammesEnnemies.set(e.id, f + (e.corps.poussee - f) * Math.min(1, dt * 14))
        if (e.corps.poussee > 0.05 && R.next() < 0.5) {
          const b = e.corps
          const vitesse = 30 + 40 * b.poussee
          braises.ajouter('braise', b.x - Math.cos(b.cap) * 8 + R.range(-1, 1), b.y - Math.sin(b.cap) * 8 + R.range(-1, 1), b.vx * 0.3 - Math.cos(b.cap) * vitesse + R.range(-8, 8), b.vy * 0.3 - Math.sin(b.cap) * vitesse + R.range(-8, 8), R.range(0.25, 0.5), 0, 1, 2)
        }
      }
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
      if (f.r === -1) {
        // un choc : un point blanc et une lueur, trois images
        if (u < 0.4) {
          p.circle(f.x, f.y, 1.5 * (1 - u / 0.4) + 0.5, N.WHITE)
          p.glow(f.x, f.y, 10, LASER[4], 0.6 * (1 - u / 0.4))
        }
        continue
      }
      p.glow(f.x, f.y, f.r * 2 + 10, LASER[4], 0.8 * (1 - u))
      p.ring(f.x, f.y, f.r * 0.5 + f.r * 2.2 * u, 1, u < 0.3 ? N.WHITE : LASER[3], 1 - u)
    }
    p.place(0, 0)
    dessinerLaStation(p)
    dessinerLesEnnemis(p)
    if (m.phase === 'vol') dessinerLeVaisseau(p)
    else if (ecran.hidden && t - perduA > 1) ecran.hidden = false
    dessinerLesTirs(p)
    dessinerLesLasers(p)
    dessinerLePointeur(p)
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

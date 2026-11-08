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
import { asteroidesAutour, avancer, centreQuiSuit, directionDuManche, MANCHE, nouveauVaisseau, tire, VAISSEAU as C, type Vaisseau, type Vecteur } from '../../logic/vaisseau/jeu.ts'
import { dessinerAsteroide } from './asteroide.ts'

type Instance = { t: number; options: Record<string, unknown>; update(dt: number): void; draw(frame: unknown, couche?: string): void; stop(): void; done(): boolean }
type Module = { meta?: Record<string, unknown> }
type Peintre = {
  place(x: number, y: number, flip?: boolean, angle?: number): Peintre
  px(x: number, y: number, c: number): void
  dot(x: number, y: number, c: number, a?: number): void
  circle(x: number, y: number, r: number, c: number, a?: number): void
  arc(x: number, y: number, r: number, w: number, a0: number, a1: number, c: number, a?: number): void
  poly(pts: number[][], c: number | ((x: number, y: number) => number), a?: number): void
  line(x0: number, y0: number, x1: number, y1: number, c: number, a?: number): void
  glow(x: number, y: number, r: number, c: number, k?: number): void
}
type Particules = { spawn(k: number, x: number, y: number, vx: number, vy: number, vie: number, c?: number, taille?: number): void; update(dt: number): void; draw(p: Peintre, couche?: string): void }
type Noyau = {
  createFrame(w: number, h: number): { w: number; h: number; color: Uint32Array; light: Uint32Array }
  clearFrame<T>(f: T): T
  createFx(mod: Module, o: Record<string, unknown>): Instance
  composite(f: unknown, sortie: Uint8ClampedArray, fond: Uint32Array | number | null): void
  painterFor(frame: unknown): Peintre
  fit(palette: string[], n: number): number[]
  hex(h: string): number
  Particles: new (o: Record<string, unknown>) => Particules
  Rng: new (graine: number) => { next(): number; range(a: number, b: number): number }
  P: Record<string, number>
  PAL: Record<string, string[]>
  WHITE: number
}
const N = noyau as unknown as Noyau
const FX = effects as Record<string, Module>

const W = 180
const H = 320
const PAS = 1 / 60
const COQUE = N.fit(['#141a2a', '#2a3550', '#46587a', '#6f87ab', '#9fb4d2', '#d6e4f5', '#ffffff'], 7)
const VERRIERE = N.fit(['#0a3a4a', '#19a0c0', '#8ff0ff', '#ffffff'], 4)
const FEU = N.fit(N.PAL.fire, 8)
const FOND = N.hex('#07060f')
const COULEURS_NEBULEUSE = ['#3a1a6a', '#14305a', '#5a1a40', '#103a3a'].map((h) => N.hex(h))

export function monterVaisseau(racine: HTMLElement, build: string): void {
  document.documentElement.classList.add('vaisseau-page')
  racine.classList.add('vaisseau')
  const dpr = Math.min(2, window.devicePixelRatio || 1)
  const suivre = new URLSearchParams(location.search).get('controle') === 'suivre'

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
  let v: Vaisseau = nouveauVaisseau()
  let enJeu = false
  let zoom = 2
  const frame = N.createFrame(W, H)
  const img = g.createImageData(W, H)
  const R = new N.Rng(7)
  const braises = new N.Particles({ rng: R, ground: () => Infinity, sparks: [N.WHITE, FEU[6], FEU[5], FEU[4]] })
  /** Les étincelles des chocs vivent DANS LE MONDE : on garde leur point et on les replace sous la caméra à chaque image. */
  let effets: { fx: Instance; x: number; y: number }[] = []
  let secousse = 0
  let flamme = 0
  let t = 0
  /** La caméra : le vaisseau au centre, avec un peu d'avance dans le sens de la vitesse, amortie. */
  const camera = { x: 0, y: 0 }

  function cadrer(): void {
    zoom = Math.max(1, Math.min(6, Math.floor(Math.min(racine.clientWidth / W, racine.clientHeight / H))))
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

  /** Le vaisseau, dessiné le nez vers +x puis tourné vers son cap : la coque, les ailes, la verrière, le moteur et sa flamme. */
  function dessinerLeVaisseau(p: Peintre): void {
    p.place(W / 2, H / 2, false, v.cap)
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
      p.poly([[0, s * 2.5], [-6, s * 8], [-8, s * 8], [-6, s * 2.5]], (_x, y) => (s * y < 5 ? COQUE[3] : COQUE[2]))
      p.line(-6.5, s * 7, -7.5, s * 7, N.hex('#d8403a'))
    }
    // le liseré, la coque ombrée (la lumière vient d'en haut à gauche de l'écran : on prend le dessus de la coque)
    p.poly(coque.map(([x, y]) => [x * 1.12 + (x > 0 ? 0.4 : -0.4), y * 1.25]), COQUE[0])
    p.poly(coque, (_x, y) => (y < -1.2 ? COQUE[5] : y < 1 ? COQUE[4] : COQUE[2]))
    p.line(-5, 0, 6, 0, COQUE[3])
    // la verrière et son éclat
    p.circle(3, 0, 1.8, VERRIERE[1])
    p.dot(3.5, -0.6, VERRIERE[2])
    p.dot(4, -1, VERRIERE[3])
    // le moteur : la tuyère sombre, un feu de position de chaque côté
    p.poly([[-7, -1.8], [-8, -1.3], [-8, 1.3], [-7, 1.8]], COQUE[1])
    p.dot(-6, -3.6, N.hex('#ff5a5a'))
    p.dot(-6, 3.6, N.hex('#4aff7a'))
    p.glow(3, 0, 5, VERRIERE[2], 0.25)
    p.place(0, 0)
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
        const r = avancer(C, v, PAS, direction)
        v = r.vaisseau
        for (const choc of r.chocs) {
          secousse = Math.min(1, 0.3 + choc.force / 120)
          if (typeof navigator.vibrate === 'function') navigator.vibrate(Math.round(10 + choc.force / 4))
          const mod = FX['impacts/hit-spark']
          if (mod !== undefined) {
            const fx = N.createFx(mod, { x: choc.x - camera.x + W / 2, y: choc.y - camera.y + H / 2, angle: Math.atan2(choc.y - v.y, choc.x - v.x), palette: N.PAL.stone })
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
    for (const e of effets) {
      e.fx.update(dt)
      e.fx.options.x = e.x - camera.x + W / 2
      e.fx.options.y = e.y - camera.y + H / 2
    }
    effets = effets.filter((e) => !e.fx.done())

    N.clearFrame(frame)
    const p = N.painterFor(frame)
    dessinerLeCiel(p)
    for (const a of asteroidesAutour(C, camera.x, camera.y, Math.max(W, H) / 2 + C.champ.rayonMax + 4)) dessinerAsteroide(p, a, t, a.x - camera.x + W / 2, a.y - camera.y + H / 2)
    // les braises et les étincelles sont dans le monde : le peintre se place sur la caméra
    p.place(W / 2 - camera.x, H / 2 - camera.y)
    braises.draw(p)
    p.place(0, 0)
    dessinerLeVaisseau(p)
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

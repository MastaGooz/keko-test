/**
 * LE SURVIVOR À L'ÉCRAN — `?survivor`, un side project (Keko, 06/11 : « juste
 * un personnage à déplacer pour voir ce que ça donne niveau contrôle »). Un
 * canvas, la caméra sur le héros, un sol sans bord et rien d'autre.
 *
 * Au doigt (ou à la souris, bouton enfoncé) : le manche flottant naît où l'on
 * pose le doigt. Au clavier : les flèches ou ZQSD / WASD. `&controle=suivre`
 * essaie l'autre contrôle : le héros marche vers le doigt.
 */
import './survivor.css'
import { avancerHeros, centreQuiSuit, directionDuManche, nouveauHeros, SURVIVOR as C, type Heros, type Vecteur } from '../../logic/survivor/jeu.ts'
import { sprite } from '../invaders/commun.ts'

const PAS = 1000 / 60
/** Le petit côté de l'écran montre 90 unités. */
const VUE = 90
/** La taille du héros à l'écran, en unités. */
const TAILLE_HEROS = 13
/** Le sol est fait de cases : chacune tire son décor de ses coordonnées. */
const CASE = 9

/** Un hachage entier de deux coordonnées et d'un sel, entre 0 et 1 : le même sol à chaque passage. */
function hache(x: number, y: number, sel: number): number {
  let h = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(sel, 2246822519)
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296
}

type Poussiere = { x: number; y: number; vie: number; duree: number; taille: number }

export function monterSurvivor(racine: HTMLElement, build: string): void {
  document.documentElement.classList.add('survivor-page')
  racine.classList.add('survivor')
  const canvas = document.createElement('canvas')
  canvas.className = 'survivor-canvas'
  const consigne = document.createElement('div')
  consigne.className = 'survivor-consigne'
  const suivre = new URLSearchParams(location.search).get('controle') === 'suivre'
  consigne.textContent = suivre ? 'Posez le doigt : le héros marche vers lui' : "Posez le doigt n'importe où et glissez"
  const pied = document.createElement('div')
  pied.className = 'survivor-build'
  pied.textContent = `build ${build}`
  racine.append(canvas, consigne, pied)
  const g = canvas.getContext('2d')!

  let heros: Heros = nouveauHeros()
  const poussieres: Poussiere[] = []
  let prochainePoussiere = 0
  const heroImage = () => sprite('perso-pixel', 'survivant', 'humain')
  heroImage()

  // ---------------------------------------------------------------- le cadre

  let dpr = 1
  let echelle = 1
  function cadrer(): void {
    dpr = Math.min(2, window.devicePixelRatio || 1)
    const w = window.innerWidth
    const h = window.innerHeight
    canvas.width = Math.round(w * dpr)
    canvas.height = Math.round(h * dpr)
    canvas.style.width = `${w}px`
    canvas.style.height = `${h}px`
    echelle = (Math.min(w, h) / VUE) * dpr
  }
  cadrer()
  window.addEventListener('resize', cadrer)

  // ---------------------------------------------------------------- les gestes

  /** Le manche : son centre et le doigt, en pixels CSS ; `null` quand rien n'est posé. */
  let manche: { id: number; centre: Vecteur; doigt: Vecteur } | null = null
  const touches = new Set<string>()

  function oterLaConsigne(): void {
    consigne.classList.add('survivor-consigne-partie')
  }

  canvas.addEventListener('pointerdown', (e) => {
    if (manche !== null) return
    canvas.setPointerCapture(e.pointerId)
    const p = { x: e.clientX, y: e.clientY }
    manche = { id: e.pointerId, centre: p, doigt: p }
    oterLaConsigne()
  })
  canvas.addEventListener('pointermove', (e) => {
    if (manche === null || e.pointerId !== manche.id) return
    const doigt = { x: e.clientX, y: e.clientY }
    manche = { id: manche.id, centre: suivre ? manche.centre : centreQuiSuit(C, manche.centre, doigt), doigt }
  })
  const lever = (e: PointerEvent) => {
    if (manche !== null && e.pointerId === manche.id) manche = null
  }
  canvas.addEventListener('pointerup', lever)
  canvas.addEventListener('pointercancel', lever)
  window.addEventListener('keydown', (e) => {
    touches.add(e.key.toLowerCase())
    oterLaConsigne()
  })
  window.addEventListener('keyup', (e) => touches.delete(e.key.toLowerCase()))
  window.addEventListener('blur', () => {
    touches.clear()
    manche = null
  })

  /** Ce que veut le joueur en ce moment : une direction de longueur 0 à 1. */
  function directionVoulue(): Vecteur {
    if (manche !== null) {
      if (!suivre) return directionDuManche(C, manche.doigt.x - manche.centre.x, manche.doigt.y - manche.centre.y)
      // Le héros marche vers le point du monde sous le doigt (le héros est au centre de l'écran).
      const dx = (manche.doigt.x - window.innerWidth / 2) * dpr
      const dy = (manche.doigt.y - window.innerHeight / 2) * dpr
      return directionDuManche(C, (dx / echelle) * 4, (dy / echelle) * 4)
    }
    const x = (touches.has('arrowright') || touches.has('d') ? 1 : 0) - (touches.has('arrowleft') || touches.has('q') || touches.has('a') ? 1 : 0)
    const y = (touches.has('arrowdown') || touches.has('s') ? 1 : 0) - (touches.has('arrowup') || touches.has('z') || touches.has('w') ? 1 : 0)
    return { x, y }
  }

  // ---------------------------------------------------------------- le dessin

  /** Le sol : un tapis de mousse, des plaques plus claires, des touffes, des cailloux, des fleurs. */
  function dessinerLeSol(cx: number, cy: number, w: number, h: number): void {
    g.fillStyle = '#26331f'
    g.fillRect(0, 0, w, h)
    const demiL = w / 2 / echelle
    const demiH = h / 2 / echelle
    const x0 = Math.floor((cx - demiL) / CASE) - 1
    const x1 = Math.floor((cx + demiL) / CASE) + 1
    const y0 = Math.floor((cy - demiH) / CASE) - 1
    const y1 = Math.floor((cy + demiH) / CASE) + 1
    const versEcran = (x: number, y: number): [number, number] => [w / 2 + (x - cx) * echelle, h / 2 + (y - cy) * echelle]

    // Les plaques : de grandes taches plus claires ou plus sombres, une case sur quatre.
    for (let i = x0; i <= x1; i++) {
      for (let j = y0; j <= y1; j++) {
        const r = hache(i, j, 1)
        if (r > 0.25) continue
        const [sx, sy] = versEcran((i + hache(i, j, 2)) * CASE, (j + hache(i, j, 3)) * CASE)
        g.fillStyle = r < 0.12 ? 'rgba(70, 92, 50, 0.28)' : 'rgba(20, 28, 16, 0.32)'
        g.beginPath()
        g.ellipse(sx, sy, CASE * (0.9 + r * 3) * echelle, CASE * (0.6 + r * 2) * echelle, hache(i, j, 4) * Math.PI, 0, Math.PI * 2)
        g.fill()
      }
    }
    // Le détail, case par case.
    g.lineCap = 'round'
    for (let i = x0; i <= x1; i++) {
      for (let j = y0; j <= y1; j++) {
        const r = hache(i, j, 5)
        const [sx, sy] = versEcran((i + 0.15 + hache(i, j, 6) * 0.7) * CASE, (j + 0.15 + hache(i, j, 7) * 0.7) * CASE)
        if (r < 0.45) {
          // Une touffe d'herbe : trois brins.
          g.strokeStyle = r < 0.2 ? '#5f7f3c' : '#47602e'
          g.lineWidth = 0.45 * echelle
          g.beginPath()
          for (const a of [-0.5, 0, 0.45]) {
            g.moveTo(sx + a * 0.8 * echelle, sy)
            g.lineTo(sx + a * 2.2 * echelle, sy - (a === 0 ? 2.6 : 1.9) * echelle)
          }
          g.stroke()
        } else if (r < 0.58) {
          // Un caillou, son ombre dessous.
          const t = (0.7 + hache(i, j, 8)) * echelle
          g.fillStyle = 'rgba(0, 0, 0, 0.3)'
          g.beginPath()
          g.ellipse(sx, sy + 0.4 * t, 1.3 * t, 0.7 * t, 0, 0, Math.PI * 2)
          g.fill()
          g.fillStyle = '#7d7a6c'
          g.beginPath()
          g.ellipse(sx, sy, 1.2 * t, 0.8 * t, 0, 0, Math.PI * 2)
          g.fill()
          g.fillStyle = '#a3a08f'
          g.beginPath()
          g.ellipse(sx - 0.3 * t, sy - 0.3 * t, 0.5 * t, 0.3 * t, 0, 0, Math.PI * 2)
          g.fill()
        } else if (r < 0.64) {
          // Une fleur : quatre pétales, un cœur.
          const couleur = ['#e8d36a', '#d97ab8', '#e6e6f0', '#7ab8e8'][Math.floor(hache(i, j, 9) * 4)]
          g.fillStyle = couleur
          for (let p = 0; p < 4; p++) {
            const a = (p * Math.PI) / 2
            g.beginPath()
            g.arc(sx + Math.cos(a) * 0.55 * echelle, sy + Math.sin(a) * 0.55 * echelle, 0.45 * echelle, 0, Math.PI * 2)
            g.fill()
          }
          g.fillStyle = '#f2a33a'
          g.beginPath()
          g.arc(sx, sy, 0.3 * echelle, 0, Math.PI * 2)
          g.fill()
        }
      }
    }
  }

  function dessinerLeHeros(w: number, h: number): void {
    const sx = w / 2
    const sy = h / 2
    const vitesse = Math.hypot(heros.vx, heros.vy) / C.vitesse
    // La marche : un rebond par pas, un pas toutes les 4 unités ; immobile, une respiration lente.
    const pas = (heros.parcouru / 4) * Math.PI
    const rebond = vitesse > 0.05 ? Math.abs(Math.sin(pas)) * 1.2 * Math.min(1, vitesse * 1.5) : 0
    const respire = vitesse > 0.05 ? 0 : Math.sin(performance.now() / 450) * 0.025
    const penche = (heros.vx / C.vitesse) * 0.12

    g.fillStyle = 'rgba(0, 0, 0, 0.35)'
    g.beginPath()
    g.ellipse(sx, sy + TAILLE_HEROS * 0.37 * echelle, TAILLE_HEROS * (0.3 - rebond * 0.02) * echelle, TAILLE_HEROS * 0.1 * echelle, 0, 0, Math.PI * 2)
    g.fill()

    const img = heroImage()
    if (img === null) return
    const t = TAILLE_HEROS * echelle
    g.save()
    g.translate(sx, sy + t * 0.45 - rebond * echelle)
    g.rotate(penche)
    g.scale(heros.regard * (1 - respire), 1 + respire)
    g.drawImage(img, -t / 2, -t, t, t)
    g.restore()
  }

  function dessinerLeManche(): void {
    if (manche === null) return
    const cx = manche.centre.x * dpr
    const cy = manche.centre.y * dpr
    const r = C.manche.rayon * dpr
    if (suivre) {
      // Le doigt seul : un repère sous lui.
      g.strokeStyle = 'rgba(255, 255, 255, 0.5)'
      g.lineWidth = 2 * dpr
      g.beginPath()
      g.arc(manche.doigt.x * dpr, manche.doigt.y * dpr, 18 * dpr, 0, Math.PI * 2)
      g.stroke()
      return
    }
    g.fillStyle = 'rgba(0, 0, 0, 0.25)'
    g.strokeStyle = 'rgba(255, 255, 255, 0.45)'
    g.lineWidth = 2.5 * dpr
    g.beginPath()
    g.arc(cx, cy, r, 0, Math.PI * 2)
    g.fill()
    g.stroke()
    // La tête du manche, bornée au rayon.
    const dx = manche.doigt.x - manche.centre.x
    const dy = manche.doigt.y - manche.centre.y
    const d = Math.hypot(dx, dy)
    const k = d > C.manche.rayon ? C.manche.rayon / d : 1
    g.fillStyle = 'rgba(255, 255, 255, 0.7)'
    g.beginPath()
    g.arc(cx + dx * k * dpr, cy + dy * k * dpr, r * 0.42, 0, Math.PI * 2)
    g.fill()
  }

  // ---------------------------------------------------------------- la boucle

  let accumule = 0
  let avant = performance.now()
  document.addEventListener('visibilitychange', () => {
    avant = performance.now()
    accumule = 0
  })

  function image(maintenant: number): void {
    accumule = Math.min(accumule + (maintenant - avant), 250)
    avant = maintenant
    while (accumule >= PAS) {
      heros = avancerHeros(C, heros, PAS, directionVoulue())
      accumule -= PAS
      // Un peu de poussière sous les pieds, à chaque pas.
      if (heros.parcouru >= prochainePoussiere) {
        if (Math.hypot(heros.vx, heros.vy) > C.vitesse * 0.5) {
          poussieres.push({ x: heros.x + (Math.random() - 0.5) * 3, y: heros.y + TAILLE_HEROS * 0.42, vie: 0, duree: 450, taille: 1 + Math.random() })
        }
        prochainePoussiere = heros.parcouru + 4
      }
      for (let i = poussieres.length - 1; i >= 0; i--) {
        poussieres[i].vie += PAS
        if (poussieres[i].vie >= poussieres[i].duree) poussieres.splice(i, 1)
      }
    }

    const w = canvas.width
    const h = canvas.height
    dessinerLeSol(heros.x, heros.y, w, h)
    for (const p of poussieres) {
      const u = p.vie / p.duree
      g.fillStyle = `rgba(190, 200, 160, ${0.35 * (1 - u)})`
      g.beginPath()
      g.arc(w / 2 + (p.x - heros.x) * echelle, h / 2 + (p.y - heros.y) * echelle - u * 1.5 * echelle, p.taille * (1 + u) * echelle, 0, Math.PI * 2)
      g.fill()
    }
    dessinerLeHeros(w, h)
    dessinerLeManche()
    requestAnimationFrame(image)
  }
  requestAnimationFrame(image)
}

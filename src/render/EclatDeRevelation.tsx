/**
 * LES PARTICULES DE LA RÉVÉLATION — une gerbe aux couleurs du cran, autour de
 * la carte qui arrive.
 *
 * Keko : « on peut faire un effet de particule coloré en fonction de la rareté
 * à la révélation de chaque carte, comme dans lexicodex ? »
 *
 * *La couleur dit le cran, le NOMBRE dit sa hauteur* : la même lueur
 * d'ambiance que l'éclat de l'écran (`AMBIANCE`), et de dix étincelles pour un
 * commun à soixante-quatre pour un légendaire. **Le bas de l'échelle parle
 * peu** — la règle de la plaque et des rayons.
 *
 * Elles naissent SUR LE BORD de la carte et partent vers l'extérieur, un peu
 * vers le haut : *ce qui jaillit d'un objet part de son contour*, sinon on lit
 * une explosion derrière lui. Un frein d'air fort et une pesanteur faible —
 * le régime du feu d'artifice du sachet : elles filent, ralentissent et
 * s'éteignent en l'air. Éclat à quatre branches et coeur blanc, comme les
 * étincelles de la déchirure : *un point qui sature tire vers le blanc, sa
 * frange garde la couleur.*
 *
 * **C'est un canvas 2D posé PAR-DESSUS la scène**, et pas une matière de
 * plus : la carte est au centre de l'écran et sa boîte est déjà connue en
 * pixels (`boite`) ; une gerbe de quelques dizaines de points ne demande ni
 * nuanceur ni instanciation. Le canvas est monté à neuf à chaque révélation
 * (sa clé), il se tait tout seul quand la dernière étincelle est éteinte, et
 * il ne capte jamais le pointeur.
 */
import { useEffect, useRef } from 'react'

const NOMBRE_PAR_RANG = [10, 20, 30, 44, 64]
const DUREE_MAX = 1.3
/**
 * LES ÉTINCELLES MULTICOLORES D'UNE HOLO, EN PLUS de celles du cran. Keko :
 * « on peut ajouter des étincelles multicolores en plus des particules de la
 * couleur de rareté à la découverte d'une carte si elle est holo ? (et pareil
 * sur l'écran des 5 cartes) ». *Le cran garde sa couleur, la holo s'y ajoute*
 * — la règle du bonus posé sur le cran, qui ne le repeint pas. Chacune prend
 * une teinte au hasard sur tout le cercle, vive et claire.
 */
const NOMBRE_HOLO = 36

interface Props {
  /** La lueur du cran, en `#rrggbb`. */
  readonly couleur: string
  /** Le rang du cran dans l'échelle : 0 le bas, 4 le haut. */
  readonly rang: number
  /** La boîte de la carte à l'écran, en pixels CSS. */
  readonly boite: { cx: number; cy: number; l: number; h: number }
  /** La carte est holographique : une volée multicolore s'ajoute. */
  readonly holo?: boolean
}

interface Etincelle {
  x: number
  y: number
  vx: number
  vy: number
  vie: number
  age: number
  taille: number
  angle: number
  /** Sa couleur : le cran, le blanc, ou une teinte de l'arc-en-ciel. */
  couleur: string
}

export function EclatDeRevelation({ couleur, rang, boite, holo = false }: Props): React.JSX.Element {
  const toile = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const c = toile.current
    if (c === null) return
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    const L = window.innerWidth
    const H = window.innerHeight
    c.width = Math.round(L * dpr)
    c.height = Math.round(H * dpr)
    const ctx = c.getContext('2d')
    if (ctx === null) return
    ctx.scale(dpr, dpr)

    // L'ÉCHELLE DE LA GERBE SUIT LA CARTE : sur un téléphone comme sur un écran
    // de PC, elle s'étend à la même part de la carte.
    const u = boite.l / 100
    const nCran = NOMBRE_PAR_RANG[Math.max(0, Math.min(4, rang))]!
    const n = nCran + (holo ? NOMBRE_HOLO : 0)
    const parts: Etincelle[] = []
    for (let i = 0; i < n; i++) {
      // UN POINT DU PÉRIMÈTRE, tiré au prorata de la longueur de chaque côté.
      const per = 2 * (boite.l + boite.h)
      const d = Math.random() * per
      let x: number
      let y: number
      let nx: number
      let ny: number
      if (d < boite.l) {
        x = boite.cx - boite.l / 2 + d
        y = boite.cy - boite.h / 2
        nx = 0
        ny = -1
      } else if (d < boite.l + boite.h) {
        x = boite.cx + boite.l / 2
        y = boite.cy - boite.h / 2 + (d - boite.l)
        nx = 1
        ny = 0
      } else if (d < 2 * boite.l + boite.h) {
        x = boite.cx + boite.l / 2 - (d - boite.l - boite.h)
        y = boite.cy + boite.h / 2
        nx = 0
        ny = 1
      } else {
        x = boite.cx - boite.l / 2
        y = boite.cy + boite.h / 2 - (d - 2 * boite.l - boite.h)
        nx = -1
        ny = 0
      }
      // VERS L'EXTÉRIEUR, un peu dispersé, et un peu vers le haut.
      const dev = (Math.random() - 0.5) * 1.1
      const dx = nx * Math.cos(dev) - ny * Math.sin(dev)
      const dy = nx * Math.sin(dev) + ny * Math.cos(dev) - 0.35
      const v = (90 + Math.random() * 180) * u * (1 + rang * 0.12)
      parts.push({
        x,
        y,
        vx: dx * v,
        vy: dy * v,
        vie: 0.6 + Math.random() * 0.6,
        age: 0,
        taille: (2.4 + Math.random() * 2.6) * u,
        angle: Math.random() * Math.PI,
        couleur:
          i >= nCran
            ? `hsl(${Math.round(Math.random() * 360)}, 100%, 66%)`
            : Math.random() < 0.25
              ? '#ffffff'
              : couleur,
      })
    }

    const FREIN = 4.2
    const PESANTEUR = 60 * u
    const depart = performance.now()
    let avant = depart
    let image = 0
    const peindre = (): void => {
      const maintenant = performance.now()
      const dt = Math.min(0.05, (maintenant - avant) / 1000)
      avant = maintenant
      ctx.clearRect(0, 0, L, H)
      ctx.globalCompositeOperation = 'lighter'
      let vivantes = 0
      const freine = Math.exp(-FREIN * dt)
      for (const p of parts) {
        p.age += dt
        if (p.age >= p.vie) continue
        vivantes++
        p.vx *= freine
        p.vy = p.vy * freine + PESANTEUR * dt
        p.x += p.vx * dt
        p.y += p.vy * dt
        const t = p.age / p.vie
        // ELLE NAÎT ALLUMÉE ET S'ÉTEINT SUR SA SECONDE MOITIÉ.
        const a = t < 0.5 ? 1 : 1 - (t - 0.5) / 0.5
        const r = p.taille * (1 - t * 0.4)
        // LE HALO, à la couleur du cran.
        const halo = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 3)
        halo.addColorStop(0, p.couleur)
        halo.addColorStop(1, 'rgba(0,0,0,0)')
        ctx.globalAlpha = a * 0.55
        ctx.fillStyle = halo
        ctx.beginPath()
        ctx.arc(p.x, p.y, r * 3, 0, Math.PI * 2)
        ctx.fill()
        // LES QUATRE BRANCHES, fines.
        ctx.globalAlpha = a * 0.9
        ctx.strokeStyle = p.couleur
        ctx.lineWidth = Math.max(1, r * 0.28)
        ctx.lineCap = 'round'
        ctx.beginPath()
        for (let k = 0; k < 2; k++) {
          const ang = p.angle + (k * Math.PI) / 2
          const bx = Math.cos(ang) * r * 2.2
          const by = Math.sin(ang) * r * 2.2
          ctx.moveTo(p.x - bx, p.y - by)
          ctx.lineTo(p.x + bx, p.y + by)
        }
        ctx.stroke()
        // LE COEUR BLANC.
        ctx.globalAlpha = a
        ctx.fillStyle = '#ffffff'
        ctx.beginPath()
        ctx.arc(p.x, p.y, r * 0.55, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalAlpha = 1
      if (vivantes > 0 && (maintenant - depart) / 1000 < DUREE_MAX) image = requestAnimationFrame(peindre)
      else ctx.clearRect(0, 0, L, H)
    }
    image = requestAnimationFrame(peindre)
    return () => cancelAnimationFrame(image)
  }, [couleur, rang, boite, holo])

  return <canvas ref={toile} className="paquet-etincelles" aria-hidden="true" />
}

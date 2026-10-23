/**
 * LE FOND DU PAQUET : DES LUMIÈRES ET DES EMOJI QUI FLOTTENT.
 *
 * Keko : « on peut avoir un fond d'écran plus cool pour le booster /
 * ouverture ? je sais pas, un truc avec des lumières, des particules, qui
 * colle au thème emoji ».
 *
 * *C'est une proposition*, et elle se juge en la regardant : `?fond=sombre`
 * rend le fond d'avant.
 *
 * Deux couches, et chacune fait un travail que l'autre ne fait pas :
 *
 * - des BOKEHS, de grands disques de lumière douce aux cinq couleurs des
 *   crans, qui dérivent et respirent lentement. *Ce sont les couleurs du jeu*,
 *   pas une palette de plus — elles disent la collection, comme les confettis
 *   du dos ;
 * - des EMOJI FANTÔMES, pris dans le catalogue, petits et translucides, qui
 *   montent comme des bulles en tournant à peine. *Le fond est fait de ce que
 *   le paquet contient*, la règle du sachet et du dos. **Ils se posent, ils
 *   ne s'ajoutent pas** : en lumière additive, deux fantômes qui se croisent
 *   s'éclairaient l'un l'autre sur leur recouvrement — Keko : « quand les
 *   emojis se superposent ça les éclaire, c'est un peu bizarre ». Seuls les
 *   bokehs s'additionnent, *une lumière s'ajoute, un objet se pose.*
 *
 * **C'est une toile 2D DERRIÈRE le canvas WebGL**, pas un plan dans la scène :
 * le fond est du HTML (`.paquet-fond`, `.paquet-lueur`), et la lueur
 * d'ambiance qui monte avec la rareté se pose par-dessus sans qu'on y touche.
 * Elle se peint à un pixel par point au plus, à trente images par seconde,
 * et rien n'y est net : *un fond ne se regarde pas, il se sent.* Elle
 * s'arrête quand l'onglet est caché, et elle se fige si le système demande
 * moins de mouvement.
 *
 * **Les glyphes s'attendent avant de peindre**, comme partout : un emoji
 * peint avant que sa police soit là retombe sur la police système.
 */
import { useEffect, useRef } from 'react'
import { PERSONNAGES_VITRINE, imageDuPersonnage } from './texture-carte.ts'

/** Les couleurs des bokehs : des flammes de bougie, la taverne (Keko : « taverne & parchemin »). */
const COULEURS = ['#ffb347', '#ff8a2a', '#ffd27a', '#e8603c', '#ffcf8a']

const NB_BOKEHS = 16
// UN PERSONNAGE SE LIT PLUS GRAND QU'UN EMOJI : moins nombreux, quatre fois
// plus gros, plus effacés — sinon ce sont des miettes.
const NB_EMOJI = 8
/** La densité de pixels du fond, plafonnée : *rien n'y est net.* */
const DPR_MAX = 1
/** Trente images par seconde suffisent à un fond qui dérive. */
const PAS_MIN = 1 / 30

interface Bokeh {
  x: number
  y: number
  r: number
  couleur: string
  vx: number
  vy: number
  phase: number
  cadence: number
  alpha: number
}
interface Fantome {
  image: HTMLCanvasElement
  x: number
  y: number
  t: number
  vy: number
  balance: number
  phase: number
  rot: number
  vrot: number
  alpha: number
}

/** Un hasard à graine fixe : *un fond n'est pas un tirage de partie*, il est le même à chaque chargement. */
function hasardFixe(graine: number): () => number {
  let s = graine >>> 0
  return () => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function couleurAvecAlpha(hex: string, a: number): string {
  const h = hex.replace('#', '')
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${a})`
}

export function FondAnime(): React.ReactElement {
  const toile = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = toile.current
    if (canvas === null) return
    const ctx = canvas.getContext('2d')
    if (ctx === null) return
    let vivant = true
    const hasard = hasardFixe(20261014)
    const fige = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    // LES BOKEHS, en fractions de l'écran : leur rayon se compte sur le plus
    // petit côté, pour qu'ils aient la même présence en portrait et en paysage.
    const bokehs: Bokeh[] = Array.from({ length: NB_BOKEHS }, (_, i) => ({
      x: hasard(),
      y: hasard(),
      r: 0.14 + hasard() * 0.22,
      couleur: COULEURS[i % COULEURS.length]!,
      vx: (hasard() - 0.5) * 0.012,
      vy: (hasard() - 0.5) * 0.012,
      phase: hasard() * Math.PI * 2,
      cadence: 0.25 + hasard() * 0.35,
      alpha: 0.3 + hasard() * 0.25,
    }))
    let fantomes: Fantome[] = []

    let largeur = 0
    let hauteur = 0
    let dpr = 1
    const mesurer = (): void => {
      dpr = Math.min(DPR_MAX, window.devicePixelRatio || 1)
      largeur = window.innerWidth
      hauteur = window.innerHeight
      canvas.width = Math.round(largeur * dpr)
      canvas.height = Math.round(hauteur * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    mesurer()
    window.addEventListener('resize', mesurer)

    // LES PERSONNAGES DU BOUQUET, une fois leurs images là.
    void Promise.all(PERSONNAGES_VITRINE.map((e) => imageDuPersonnage(e))).then((toutes) => {
      if (!vivant) return
      const images = toutes.filter((i): i is HTMLCanvasElement => i !== null)
      if (images.length === 0) return
      fantomes = Array.from({ length: NB_EMOJI }, (_, i) => ({
        image: images[i % images.length]!,
        x: hasard(),
        y: hasard(),
        t: 0.16 + hasard() * 0.1,
        vy: 0.012 + hasard() * 0.02,
        balance: 0.004 + hasard() * 0.01,
        phase: hasard() * Math.PI * 2,
        rot: (hasard() - 0.5) * 0.6,
        vrot: (hasard() - 0.5) * 0.16,
        alpha: 0.18 + hasard() * 0.14,
      }))
      // FIGÉ, on repeint une fois les glyphes là : sinon le fond resterait sans eux.
      if (fige) peindre(0)
    })

    let dernier = performance.now() / 1000
    let accumule = 0
    const peindre = (temps: number): void => {
      const petit = Math.min(largeur, hauteur)
      ctx.clearRect(0, 0, largeur, hauteur)

      ctx.globalCompositeOperation = 'lighter'
      for (const b of bokehs) {
        const souffle = 0.75 + 0.25 * Math.sin(temps * b.cadence + b.phase)
        const r = b.r * petit * souffle
        const x = b.x * largeur
        const y = b.y * hauteur
        const g = ctx.createRadialGradient(x, y, 0, x, y, r)
        g.addColorStop(0, couleurAvecAlpha(b.couleur, b.alpha))
        g.addColorStop(0.55, couleurAvecAlpha(b.couleur, b.alpha * 0.35))
        g.addColorStop(1, couleurAvecAlpha(b.couleur, 0))
        ctx.fillStyle = g
        ctx.beginPath()
        ctx.arc(x, y, r, 0, Math.PI * 2)
        ctx.fill()
      }
      // LES FANTÔMES SE POSENT : voir en tête.
      ctx.globalCompositeOperation = 'source-over'
      for (const f of fantomes) {
        const taille = f.t * petit
        const x = (f.x + Math.sin(temps * 0.7 + f.phase) * f.balance) * largeur
        const y = f.y * hauteur
        ctx.save()
        ctx.globalAlpha = f.alpha
        ctx.translate(x, y)
        ctx.rotate(f.rot)
        ctx.drawImage(f.image, -taille / 2, -taille / 2, taille, taille)
        ctx.restore()
      }
      ctx.globalCompositeOperation = 'source-over'
    }

    const avancer = (dt: number): void => {
      for (const b of bokehs) {
        b.x = (b.x + b.vx * dt + 1) % 1
        b.y = (b.y + b.vy * dt + 1) % 1
      }
      for (const f of fantomes) {
        f.y -= f.vy * dt
        f.rot += f.vrot * dt
        if (f.y < -0.2) {
          f.y = 1.2
          f.x = hasard()
        }
      }
    }

    let demande = 0
    const boucle = (): void => {
      if (!vivant) return
      demande = requestAnimationFrame(boucle)
      const maintenant = performance.now() / 1000
      const dt = Math.min(0.1, maintenant - dernier)
      dernier = maintenant
      if (document.hidden) return
      accumule += dt
      if (accumule < PAS_MIN) return
      if (!fige) avancer(accumule)
      accumule = 0
      peindre(maintenant)
    }
    if (fige) peindre(0)
    else demande = requestAnimationFrame(boucle)

    return () => {
      vivant = false
      cancelAnimationFrame(demande)
      window.removeEventListener('resize', mesurer)
    }
  }, [])

  return <canvas className="paquet-fond-anime" ref={toile} aria-hidden="true" />
}

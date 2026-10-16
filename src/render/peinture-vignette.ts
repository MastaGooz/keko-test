/**
 * LA CARTE PEINTE EN PETIT, sans 3D : les vignettes de la collection et le
 * décollage du sticker. *Sortie de `Collection.tsx` quand le décollage en a eu
 * besoin aussi* : deux endroits qui peignent la même holo finissent par ne plus
 * peindre la même.
 */
import type { CarteEmoji } from '../logic/emoji/types.ts'
import { createRng } from '../logic/rng.ts'
import { RAYONS_DANS_LA_CARTE, masqueDuSujetDe, peindreCarte } from './texture-carte.ts'
import { carteDeLEmoji } from './carte-emoji.ts'
import { COSMOS, NACRE } from './Carte3D.tsx'

/**
 * LA FILE DES PEINTURES : une à la fois. *Cent vignettes qui entrent dans la
 * vue d'un coup de pouce feraient cent peintures dans la même image* — la file
 * les étale, et la première arrive aussitôt.
 */
let fileDePeinture: Promise<unknown> = Promise.resolve()
const PEINTES = new Map<string, Promise<HTMLCanvasElement>>()

const lineaire = (v: number): number => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)
const srgb = (v: number): number => (v <= 0.0031308 ? v * 12.92 : 1.055 * v ** (1 / 2.4) - 0.055)
const fondu = (a: number, b: number, x: number): number => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

/**
 * LE CERNE ARC-EN-CIEL D'UNE HOLO, PEINT SUR LA VIGNETTE. Keko : « on peut pas
 * avoir l'outline arc-en-ciel au lieu de blanc sur les cartes de la
 * collection ? » *En 3D c'est le nuanceur qui le fait* (`COSMOS.cerne`) ; une
 * vignette est une peinture, donc on refait son calcul sur ses pixels, une
 * fois : **le même repérage du crème** (il manque environ 0,13 de bleu au
 * #fffaf0, là où les blancs d'un emoji sont neutres), **le même spectre** qui
 * fait le tour de l'emoji, saturé par la même puissance. *Ce qui ne passe pas,
 * c'est l'angle du regard* : une vignette ne penche pas, son spectre est figé.
 * Seulement dans la fenêtre d'art : la plaque, crème aussi, n'en reçoit pas.
 */
export function cerneArcEnCiel(
  toile: HTMLCanvasElement,
  /** Où chercher le crème, en parts de la toile : la fenêtre d'art, ou tout le sticker. */
  R: { x: number; y: number; l: number; h: number } = RAYONS_DANS_LA_CARTE,
  /**
   * NE GARDER QUE LE CERNE : le reste devient transparent, et le crème garde
   * son poids en alpha. C'est la couche qu'on fait tourner au regard sur le
   * sticker en grand (voir `StickerOuvert`).
   */
  seulCerne = false,
): void {
  const ctx = toile.getContext('2d')
  if (ctx === null) return
  const { width: l, height: h } = toile
  const x0 = Math.floor(R.x * l)
  const y0 = Math.floor(R.y * h)
  const lf = Math.ceil(R.l * l)
  const hf = Math.ceil(R.h * h)
  const image = ctx.getImageData(x0, y0, lf, hf)
  const d = image.data
  const cx = (R.x + R.l / 2) * l
  const cy = (R.y + R.h / 2) * h
  const { tour, sature, couleur } = COSMOS.cerne
  for (let j = 0; j < hf; j++) {
    for (let i = 0; i < lf; i++) {
      const k = (j * lf + i) * 4
      if (d[k + 3]! === 0) continue
      const r = lineaire(d[k]! / 255)
      const g = lineaire(d[k + 1]! / 255)
      const b = lineaire(d[k + 2]! / 255)
      const ecart = r - b
      const creme =
        fondu(0.88, 0.95, r) * fondu(0.8, 0.84, b) * fondu(0.07, 0.1, ecart) * (1 - fondu(0.17, 0.22, ecart))
      if (creme <= 0) {
        if (seulCerne) d[k + 3] = 0
        continue
      }
      if (seulCerne) d[k + 3] = Math.round(d[k + 3]! * creme)
      // L'ANGLE AUTOUR DU CENTRE DE LA FENÊTRE, les deux axes en largeurs : le
      // spectre tourne rond autour de l'emoji.
      const dx = (x0 + i - cx) / l
      const dy = (y0 + j - cy) / l
      const t = (((Math.atan2(dy, dx) / (Math.PI * 2)) * tour) % 1 + 1.3) % 1
      const arc = [0, 0.33, 0.67].map((o) => Math.min(1, (0.5 + 0.5 * Math.cos(Math.PI * 2 * (t + o))) ** sature * 1.5))
      const teinte = arc.map((a) => 1 + (a - 1) * couleur)
      const lin = [r, g, b].map((v, n) => v + (v * teinte[n]! - v) * creme)
      d[k] = Math.round(srgb(lin[0]!) * 255)
      d[k + 1] = Math.round(srgb(lin[1]!) * 255)
      d[k + 2] = Math.round(srgb(lin[2]!) * 255)
    }
  }
  ctx.putImageData(image, x0, y0)
}

/**
 * LES PAILLETTES D'UNE HOLO, PEINTES SUR LA VIGNETTE. Keko : « on peut pas avoir
 * les paillettes sur les holos de la collection aussi ? »
 *
 * *En 3D, chaque paillette est un petit miroir penché au hasard* qui ne
 * s'allume que quand il renvoie la lampe vers l'œil (`COSMOS`). **Une vignette
 * ne penche pas**, donc on fige un instant de ce scintillement : les mêmes
 * deux grilles (fine et grosse), la même part de cellules occupées, la même
 * dispersion, et **une part seulement allumée**, le reste à peine visible —
 * *une feuille dont toutes les paillettes brillent en même temps est une
 * peinture dorée, pas une feuille holographique.*
 *
 * Les mêmes exclusions qu'au nuanceur : **jamais sur l'emoji** (le masque du
 * sujet) et, sous la plaque, seulement sur le clair — le titre reste lisible.
 * **Tiré par le RNG seedé sur l'identifiant** : une vignette garde ses
 * paillettes d'une visite à l'autre.
 */
/**
 * LA NACRE D'UN STICKER HOLO, EN COUCHE : la même règle que le nuanceur
 * (`NACRE`) — les clairs de l'emoji, hors du cerne crème, prennent une teinte
 * qui suit leur clarté et leur hauteur. Rend une toile de la même taille, la
 * couleur seule et son poids en alpha ; c'est sa teinte qu'on fait tourner
 * avec le regard (`hue-rotate`).
 */
export function coucheDeNacre(source: HTMLCanvasElement): HTMLCanvasElement {
  const { width: l, height: h } = source
  const toile = document.createElement('canvas')
  toile.width = l
  toile.height = h
  const ctx = toile.getContext('2d')
  const sctx = source.getContext('2d', { willReadFrequently: true })
  if (ctx === null || sctx === null) return toile
  const src = sctx.getImageData(0, 0, l, h).data
  const out = ctx.createImageData(l, h)
  const d = out.data
  for (let j = 0; j < h; j++) {
    for (let i = 0; i < l; i++) {
      const k = (j * l + i) * 4
      const a = src[k + 3]!
      if (a < 200) continue
      const r = lineaire(src[k]! / 255)
      const g = lineaire(src[k + 1]! / 255)
      const b = lineaire(src[k + 2]! / 255)
      const ecart = r - b
      const creme =
        fondu(0.88, 0.95, r) * fondu(0.8, 0.84, b) * fondu(0.07, 0.1, ecart) * (1 - fondu(0.17, 0.22, ecart))
      const clair = 0.2126 * r + 0.7152 * g + 0.0722 * b
      const haut = Math.max(r, g, b)
      const sat = (haut - Math.min(r, g, b)) / Math.max(haut, 0.0001)
      const poids =
        (1 - creme) * fondu(NACRE.seuil, 0.95, clair) * (1 - fondu(NACRE.saturation * 0.4, NACRE.saturation, sat)) * NACRE.couleur
      if (poids <= 0) continue
      const t = (((clair * NACRE.etalement + (j / h) * 1.5) % 1) + 1) % 1
      d[k] = Math.round((0.5 + 0.5 * Math.cos(Math.PI * 2 * t)) * 255)
      d[k + 1] = Math.round((0.5 + 0.5 * Math.cos(Math.PI * 2 * (t + 0.33))) * 255)
      d[k + 2] = Math.round((0.5 + 0.5 * Math.cos(Math.PI * 2 * (t + 0.67))) * 255)
      d[k + 3] = Math.round(poids * 255)
    }
  }
  ctx.putImageData(out, 0, 0)
  return toile
}

export function paillettesHolo(toile: HTMLCanvasElement, id: string): void {
  const ctx = toile.getContext('2d')
  if (ctx === null) return
  const { width: l, height: h } = toile
  const carte = ctx.getImageData(0, 0, l, h).data
  // LE MASQUE DU SUJET, à la taille de la vignette : blanc = libre, l'emoji découpé.
  const masque = masqueDuSujetDe(toile)
  let libre: Uint8ClampedArray | null = null
  if (masque !== undefined) {
    const m = document.createElement('canvas')
    m.width = l
    m.height = h
    const mc = m.getContext('2d')
    if (mc !== null) {
      mc.drawImage(masque, 0, 0, l, h)
      libre = mc.getImageData(0, 0, l, h).data
    }
  }
  const basDesRayons = (RAYONS_DANS_LA_CARTE.y + RAYONS_DANS_LA_CARTE.h) * h
  let graine = 2166136261
  for (const ch of id) graine = Math.imul(graine ^ ch.charCodeAt(0), 16777619)
  const rng = createRng(graine >>> 0)
  ctx.save()
  // LA PEINTURE LAISSE SON ÉCHELLE SUR LA TOILE (elle dessine en unités de
  // 768) : sans remise à zéro, toutes les paillettes se tassaient dans le coin.
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.globalCompositeOperation = 'lighter'
  const grilles = [
    { n: COSMOS.fin, part: COSMOS.partFin, rayon: COSMOS.rayonFin, gros: false },
    { n: COSMOS.gros, part: COSMOS.partGros, rayon: COSMOS.rayonGros, gros: true },
  ]
  for (const g of grilles) {
    const cote = l / g.n
    const lignes = Math.ceil(h / cote)
    for (let j = 0; j < lignes; j++) {
      for (let i = 0; i < g.n; i++) {
        const occupee = rng.next() < g.part
        const ox = (rng.next() - 0.5) * COSMOS.dispersion
        const oy = (rng.next() - 0.5) * COSMOS.dispersion
        const allume = rng.next()
        const teinte = rng.next() * 360
        if (!occupee) continue
        const x = (i + 0.5 + ox) * cote
        const y = (j + 0.5 + oy) * cote
        const px = Math.round(x)
        const py = Math.round(y)
        if (px < 0 || py < 0 || px >= l || py >= h) continue
        const k = (py * l + px) * 4
        // DANS LA CARTE : ses coins sont transparents.
        if (carte[k + 3]! < 200) continue
        // JAMAIS SUR L'EMOJI.
        if (libre !== null && libre[k + 3]! < 128) continue
        const r0 = Math.max(0.6, cote * g.rayon)
        // SOUS LA PLAQUE, SEULEMENT SUR LE CLAIR — ET LOIN DES LETTRES : sur une
        // vignette, le texte est si petit qu'une paillette posée à côté le
        // brouille. On sonde autour d'elle, pas seulement dessous.
        if (y > basDesRayons) {
          const ecart = Math.ceil(r0 * 4)
          let claire = true
          for (const [sx, sy] of [[0, 0], [ecart, 0], [-ecart, 0], [0, ecart], [0, -ecart]] as const) {
            const qx = Math.min(l - 1, Math.max(0, px + sx))
            const qy = Math.min(h - 1, Math.max(0, py + sy))
            const q = (qy * l + qx) * 4
            if ((0.2126 * carte[q]! + 0.7152 * carte[q + 1]! + 0.0722 * carte[q + 2]!) / 255 < 0.86) claire = false
          }
          if (!claire) continue
        }
        // PEU RENVOIENT LA LAMPE, LES AUTRES SONT À PEINE LÀ. Vu sur la grille :
        // une sur cinq allumée faisait une neige qui couvrait la carte.
        const vive = allume < (g.gros ? 0.12 : 0.06)
        const a = vive ? 0.9 : 0.1
        const r = vive ? r0 * 1.5 : r0
        const halo = ctx.createRadialGradient(x, y, 0, x, y, r * 2.2)
        halo.addColorStop(0, `hsla(${teinte}, 100%, 92%, ${a})`)
        halo.addColorStop(0.35, `hsla(${teinte}, 100%, 70%, ${a * 0.6})`)
        halo.addColorStop(1, `hsla(${teinte}, 100%, 60%, 0)`)
        ctx.fillStyle = halo
        ctx.beginPath()
        ctx.arc(x, y, r * 2.2, 0, Math.PI * 2)
        ctx.fill()
        // LES GROSSES VIVES ONT LEUR ÉCLAT EN CROIX, comme la gerbe.
        if (vive && g.gros) {
          ctx.strokeStyle = `hsla(${teinte}, 100%, 95%, 0.8)`
          ctx.lineWidth = Math.max(0.6, r * 0.35)
          ctx.beginPath()
          ctx.moveTo(x - r * 4, y)
          ctx.lineTo(x + r * 4, y)
          ctx.moveTo(x, y - r * 4)
          ctx.lineTo(x, y + r * 4)
          ctx.stroke()
        }
      }
    }
  }
  ctx.restore()
}

export function peinte(
  c: CarteEmoji,
  largeur: number,
  holo: boolean,
  /** Sans son sticker : ce qui reste quand on l'a décollé. */
  sansSujet = false,
  /** Le cartouche dit l'animé, comme la carte 3D qu'on remplace (le décollage). */
  anime = false,
): Promise<HTMLCanvasElement> {
  const cle = `${c.id}#${largeur}${holo ? '#holo' : ''}${sansSujet ? '#nu' : ''}${anime ? '#anime' : ''}`
  const deja = PEINTES.get(cle)
  if (deja !== undefined) return deja
  const p = fileDePeinture.then(async () => {
    const toile = await peindreCarte(
      // LE DÉCOLLAGE NOMME SES BONUS AU CARTOUCHE, comme la carte 3D qu'il
      // remplace ; la vignette, non (elle a ses pastilles). Pas d'animation :
      // une vignette est une image fixe.
      { ...carteDeLEmoji(c, sansSujet || anime ? { holo, anime } : undefined), animation: undefined, sansSujet },
      largeur,
    )
    if (holo) {
      if (!sansSujet) cerneArcEnCiel(toile)
      paillettesHolo(toile, c.id)
    }
    return toile
  })
  fileDePeinture = p.catch(() => null)
  PEINTES.set(cle, p)
  // *Un cache retient les succès, pas les échecs.*
  p.catch(() => PEINTES.delete(cle))
  return p
}

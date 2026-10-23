/**
 * LA CARTE PEINTE EN PETIT, sans 3D : les vignettes de la collection et le
 * décollage du sticker. *Sortie de `Collection.tsx` quand le décollage en a eu
 * besoin aussi* : deux endroits qui peignent la même holo finissent par ne plus
 * peindre la même.
 */
import type { CarteEmoji } from '../logic/emoji/types.ts'
import { exemplaireDe, type StickerColle } from '../logic/emoji/collection.ts'
import { urlDeLIllustration } from '../ui/art.ts'
import { createRng } from '../logic/rng.ts'
import { ECLAIRE_SOMBRES, RAYONS_DANS_LA_CARTE, TAILLE_COLLE, masqueDuSujetDe, peindreCarte, placeDuColle, stickerDe, sujetDe, surfaceDe, zoneDuColle, type StickerAPeindre, type SujetPeint } from './texture-carte.ts'
import { carteDeLEmoji } from './carte-emoji.ts'
import { BRILLANT, CONTOUR_PLAQUE, COSMOS, RAYONS_BRILLANTS, SATURE_RAYONS } from './Carte3D.tsx'
import { COULEUR } from './carte-emoji.ts'
import { AVEC_RAYONS_CARTE, RAYON_SIMPLE } from './texture-carte.ts'
import { animationDeLEmoji, urlAnimationEmoji } from './emoji-anime.ts'

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
 * LE CERNE ARC-EN-CIEL, CALCULÉ SUR LE STICKER ET NON SUR LA CARTE. Keko : « les
 * outlines multicolores des emoji holo sur les cartes sont moches dans la
 * collection, avec des pixels manquants qui sont blancs au lieu d'être colorés
 * (mais bien en zoom et bien dans les stickers) ». *Le repérage du crème se
 * faisait sur la carte aplatie, à la taille de la vignette* : un cerne de
 * quatre ou cinq pixels y a deux pixels de bord mêlés aux rayons dehors et à
 * l'emoji dedans, qui ne sont plus crème et restaient blancs. Le zoom lit une
 * texture de mille pixels, le sticker de l'album est posé sur du transparent :
 * leurs bords restent crème. **Ici aussi, donc** : on reprend le sticker tel
 * que la peinture l'a posé (`sujetDe`), à SA taille, sur du transparent ; on y
 * calcule le cerne — le bord n'y est qu'un alpha, la couleur reste crème — et
 * on applique à la carte la différence entre ce sticker et l'original, posés
 * à la même place, en prémultiplié : *exactement ce que la carte aurait montré
 * si le sticker avait été collé déjà coloré*, ombre comprise puisqu'elle ne
 * change pas. Le sticker coloré est gardé pour la vignette animée, qui le
 * repose par-dessus ses rayons (`sujetDeLaVignette`).
 */
const SUJETS_HOLO = new WeakMap<HTMLCanvasElement, SujetPeint>()
export function sujetDeLaVignette(toile: HTMLCanvasElement): SujetPeint | undefined {
  return SUJETS_HOLO.get(toile) ?? sujetDe(toile)
}
function cerneArcEnCielDuSujet(toile: HTMLCanvasElement): void {
  const s = sujetDe(toile)
  const ctx = toile.getContext('2d', { willReadFrequently: true })
  if (s === undefined || ctx === null) {
    // *Sans sticker repéré, l'ancien calcul sur la carte vaut mieux que rien.*
    cerneArcEnCiel(toile)
    return
  }
  const li = 'naturalWidth' in s.image ? s.image.naturalWidth : s.image.width
  const hi = 'naturalWidth' in s.image ? s.image.naturalHeight : s.image.height
  if (li === 0 || hi === 0) return
  const colore = document.createElement('canvas')
  colore.width = li
  colore.height = hi
  const cc = colore.getContext('2d', { willReadFrequently: true })
  if (cc === null) return
  cc.drawImage(s.image, 0, 0)
  cerneArcEnCiel(colore, { x: 0, y: 0, l: 1, h: 1 })
  const { width: l, height: h } = toile
  const poser = (image: CanvasImageSource): Uint8ClampedArray | null => {
    const c = document.createElement('canvas')
    c.width = l
    c.height = h
    const x = c.getContext('2d', { willReadFrequently: true })
    if (x === null) return null
    x.drawImage(image, s.x, s.y, s.l, s.h)
    return x.getImageData(0, 0, l, h).data
  }
  const avant = poser(s.image)
  const apres = poser(colore)
  if (avant === null || apres === null) return
  // LES STICKERS COLLÉS PAR-DESSUS L'EMOJI ne reçoivent pas la différence : la
  // vignette les montrait repeints par le cerne de l'emoji (Keko : « le
  // contour de son emoji holo passe par-dessus les stickers sur elle »).
  const surface = surfaceDe(toile)
  const dessus = surface === undefined ? null : surface.getContext('2d', { willReadFrequently: true })?.getImageData(0, 0, l, h).data ?? null
  const carte = ctx.getImageData(0, 0, l, h)
  const d = carte.data
  for (let k = 0; k < d.length; k += 4) {
    const a0 = avant[k + 3]!
    const a1 = apres[k + 3]!
    if (a0 === 0 && a1 === 0) continue
    const libre = dessus === null ? 1 : 1 - dessus[k + 3]! / 255
    if (libre <= 0) continue
    for (let n = 0; n < 3; n++) {
      // En prémultiplié : la carte vaut fond × (1 − a) + sticker × a, donc
      // remplacer le sticker, c'est ajouter la différence des prémultipliés.
      const delta = ((apres[k + n]! * a1 - avant[k + n]! * a0) / 255) * libre
      d[k + n] = Math.max(0, Math.min(255, Math.round(d[k + n]! + delta)))
    }
  }
  ctx.putImageData(carte, 0, 0)
  SUJETS_HOLO.set(toile, { ...s, image: colore })
}

/**
 * LE CERNE ARC-EN-CIEL D'UN STICKER HOLO COLLÉ, SUR SES PIXELS SEULS. Keko :
 * « la zone autour d'un sticker holo va colorer également l'outline de
 * l'emoji de la carte dans sa zone (il colore aussi l'outline blanc des
 * autres stickers). Sa zone est le rectangle qui le contient ». *C'était
 * `cerneArcEnCiel` lâché sur le rectangle du sticker* : il colore tout le
 * crème qu'il trouve, et l'emoji comme les voisins y passent. On fait donc
 * comme pour l'emoji (`cerneArcEnCielDuSujet`) : le sticker seul, posé à sa
 * place sur du transparent, avant et après son arc-en-ciel (le spectre
 * tourne autour du sticker), et la carte reçoit la différence prémultipliée
 * — rien d'autre que le sticker ne change.
 */
function arcEnCielDUnColle(toile: HTMLCanvasElement, col: StickerPeint, i: number): void {
  const ctx = toile.getContext('2d', { willReadFrequently: true })
  if (ctx === null) return
  const l = toile.width
  const h = toile.height
  const R = RAYONS_DANS_LA_CARTE
  const z = zoneDuColle(col, i)
  const zx = Math.floor(z.x * l)
  const zy = Math.floor(z.y * h)
  const zl = Math.ceil(z.l * l)
  const zh = Math.ceil(z.h * h)
  if (zl <= 0 || zh <= 0) return
  const { x, y, a } = placeDuColle(col, i)
  const taille = TAILLE_COLLE * R.l * l
  const poser = (image: CanvasImageSource): Uint8ClampedArray | null => {
    const c = document.createElement('canvas')
    c.width = zl
    c.height = zh
    const g = c.getContext('2d', { willReadFrequently: true })
    if (g === null) return null
    g.translate((R.x + x * R.l) * l - zx, (R.y + y * R.h) * h - zy)
    g.rotate(a)
    g.drawImage(image, -taille / 2, -taille / 2, taille, taille)
    return g.getImageData(0, 0, zl, zh).data
  }
  // Le sticker coloré : sa copie, le spectre autour de son propre centre.
  const colore = document.createElement('canvas')
  colore.width = col.image.width
  colore.height = col.image.height
  const cc = colore.getContext('2d', { willReadFrequently: true })
  if (cc === null) return
  cc.drawImage(col.image, 0, 0)
  cerneArcEnCiel(colore, { x: 0, y: 0, l: 1, h: 1 })
  const avant = poser(col.image)
  const apres = poser(colore)
  if (avant === null || apres === null) return
  const carte = ctx.getImageData(zx, zy, zl, zh)
  const d = carte.data
  for (let k = 0; k < d.length; k += 4) {
    const a0 = avant[k + 3]!
    const a1 = apres[k + 3]!
    if (a0 === 0 && a1 === 0) continue
    for (let n = 0; n < 3; n++) {
      const delta = (apres[k + n]! * a1 - avant[k + n]! * a0) / 255
      d[k + n] = Math.max(0, Math.min(255, Math.round(d[k + n]! + delta)))
    }
  }
  ctx.putImageData(carte, zx, zy)
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
 * LE BRILLANT DE LA CARTE 3D, AU REPOS, PEINT SUR LA VIGNETTE. Keko : « dans la
 * collection, les cartes sont plus ternes que dans le zoom, surtout le fond
 * avec les rayons ». *Elles l'étaient, et de beaucoup* : en 3D, les rayons
 * clairs et la bordure renvoient la lampe clé (`RAYONS_BRILLANTS`, `BRILLANT`)
 * — au repos, la carte de face, la lampe à 36,9° d'incidence, les rayons
 * clairs sont multipliés jusqu'à ×4,8 puis saturés, plafonnés sous le seuil du
 * bloom ; la vignette était la peinture nue.
 *
 * **On refait le calcul du nuanceur pour la carte de face, une fois**, sur les
 * pixels, en lumière linéaire : le même repérage des rayons (seize secteurs,
 * même centre, même départ, même fondu), le même masque de l'emoji, les mêmes
 * chiffres lus et non recopiés. *Ce qui ne passe pas, c'est le mouvement* :
 * la vignette ne penche pas, son brillant est celui du repos.
 */
export function brillantDuRepos(
  toile: HTMLCanvasElement,
  /** La saturation des rayons clairs du cran (voir `SATURE_RAYONS`). */
  satureCran = 1,
  /** Sans le brillant des rayons : ils sont peints à part, sur une couche qui tourne. */
  sansRayons = false,
): void {
  const ctx = toile.getContext('2d', { willReadFrequently: true })
  if (ctx === null) return
  const { width: l, height: h } = toile
  const image = ctx.getImageData(0, 0, l, h)
  const d = image.data
  const masque = masqueDuSujetDe(toile)
  let libre: Uint8ClampedArray | null = null
  if (masque !== undefined) {
    const m = document.createElement('canvas')
    m.width = l
    m.height = h
    const mc = m.getContext('2d', { willReadFrequently: true })
    if (mc !== null) {
      mc.drawImage(masque, 0, 0, l, h)
      libre = mc.getImageData(0, 0, l, h).data
    }
  }
  // LA LAMPE CLÉ VUE PAR UNE CARTE DE FACE : le regard renvoyé est l'axe de vue.
  const L = BRILLANT.lampe
  const sc = L[2] / Math.hypot(L[0], L[1], L[2])
  const nappeR = Math.pow(sc, RAYONS_BRILLANTS.large)
  const nappeB = Math.pow(sc, BRILLANT.large)
  const R = RAYONS_DANS_LA_CARTE
  const cx = R.x + R.l / 2
  const cy = R.y + R.h / 2
  const secteur = (Math.PI * 4) / R.nombre
  const rr = R.rayon
  for (let j = 0; j < h; j++) {
    const v = (j + 0.5) / h
    for (let i = 0; i < l; i++) {
      const k = (j * l + i) * 4
      if (d[k + 3]! < 8) continue
      const u = (i + 0.5) / l
      // LA BORDURE : la distance au rectangle arrondi, en largeurs de carte.
      const px = u - 0.5
      const py = (v - 0.5) * 1.4
      const qx = Math.abs(px) - (0.5 - RAYON_SIMPLE)
      const qy = Math.abs(py) - (0.7 - RAYON_SIMPLE)
      const dc = Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - RAYON_SIMPLE
      const bande = fondu(-(CONTOUR_PLAQUE + 0.003), -(CONTOUR_PLAQUE - 0.002), dc)
      // LES RAYONS CLAIRS, dans la fenêtre d'art, hors de l'emoji.
      let kr = 0
      if (!sansRayons && u >= R.x && u <= R.x + R.l && v >= R.y && v <= R.y + R.h) {
        const dx = u - cx
        const dy = (v - cy) * 1.4
        const a = Math.atan2(dy, dx) - R.depart
        const fr = ((a / secteur) % 1 + 1) % 1
        // Les sombres brillent à leur part, comme au nuanceur : voir ECLAIRE_SOMBRES.
        const clair = ECLAIRE_SOMBRES + (1 - ECLAIRE_SOMBRES) * fondu(0, 0.025, fr) * (1 - fondu(0.475, 0.5, fr))
        const fonduR = 1 - Math.min(1, Math.max(0, (Math.hypot(dx, dy) - rr * 0.08) / (rr * 0.92)))
        const lib = libre === null ? 1 : libre[k]! / 255
        kr = clair * fonduR * lib
      }
      if (bande <= 0 && kr <= 0) continue
      let r = lineaire(d[k]! / 255)
      let g = lineaire(d[k + 1]! / 255)
      let b = lineaire(d[k + 2]! / 255)
      const lumAvant = 0.2126 * r + 0.7152 * g + 0.0722 * b
      // LA BORDURE : le grand reflet multiplié (l'éclair serré est nul de face).
      const fb = 1 + nappeB * BRILLANT.reflet * bande
      r *= fb
      g *= fb
      b *= fb
      let lum = 0.2126 * r + 0.7152 * g + 0.0722 * b
      const sb = 1 + BRILLANT.sature * nappeB * bande
      r = Math.max(0, lum + (r - lum) * sb)
      g = Math.max(0, lum + (g - lum) * sb)
      b = Math.max(0, lum + (b - lum) * sb)
      // LES RAYONS.
      const frr = 1 + nappeR * RAYONS_BRILLANTS.reflet * kr
      r *= frr
      g *= frr
      b *= frr
      lum = 0.2126 * r + 0.7152 * g + 0.0722 * b
      const sr = 1 + RAYONS_BRILLANTS.sature * satureCran * nappeR * kr
      r = Math.max(0, lum + (r - lum) * sr)
      g = Math.max(0, lum + (g - lum) * sr)
      b = Math.max(0, lum + (b - lum) * sr)
      // À CLARTÉ CONSTANTE, comme au nuanceur : saturer en linéaire faisait
      // chuter la clarté des violets et des oranges.
      const apres = 0.2126 * r + 0.7152 * g + 0.0722 * b
      const kc = lum / Math.max(apres, 0.0001)
      r *= kc
      g *= kc
      b *= kc
      // LE PLAFOND : jamais plus haut que la peinture, ou que le seuil du bloom.
      const lumApres = 0.2126 * r + 0.7152 * g + 0.0722 * b
      const plafond = Math.max(lumAvant, BRILLANT.plafond)
      const kp = Math.min(1, plafond / Math.max(lumApres, 0.0001))
      d[k] = Math.round(srgb(Math.min(1, r * kp)) * 255)
      d[k + 1] = Math.round(srgb(Math.min(1, g * kp)) * 255)
      d[k + 2] = Math.round(srgb(Math.min(1, b * kp)) * 255)
    }
  }
  ctx.putImageData(image, 0, 0)
}

/**
 * UNE PAILLETTE EN ÉTOILE À QUATRE BRANCHES : deux traits fins qui s'effacent
 * vers leurs bouts, et un petit cœur. Celles de l'emoji holo (`COSMOS.etoile`).
 */
export function etoileDePaillette(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  bras: number,
  teinte: number,
  a: number,
): void {
  const largeur = Math.max(0.7, bras * 0.16)
  for (const [dx, dy] of [
    [1, 0],
    [0, 1],
  ] as const) {
    const trait = ctx.createLinearGradient(x - dx * bras, y - dy * bras, x + dx * bras, y + dy * bras)
    trait.addColorStop(0, `hsla(${teinte}, 100%, 85%, 0)`)
    trait.addColorStop(0.5, `hsla(${teinte}, 100%, 95%, ${a})`)
    trait.addColorStop(1, `hsla(${teinte}, 100%, 85%, 0)`)
    ctx.fillStyle = trait
    if (dx === 1) ctx.fillRect(x - bras, y - largeur / 2, bras * 2, largeur)
    else ctx.fillRect(x - largeur / 2, y - bras, largeur, bras * 2)
  }
  const coeur = ctx.createRadialGradient(x, y, 0, x, y, largeur * 1.6)
  coeur.addColorStop(0, `hsla(${teinte}, 100%, 97%, ${a})`)
  coeur.addColorStop(1, `hsla(${teinte}, 100%, 80%, 0)`)
  ctx.fillStyle = coeur
  ctx.beginPath()
  ctx.arc(x, y, largeur * 1.6, 0, Math.PI * 2)
  ctx.fill()
}

/**
 * LES RAYONS D'UNE CARTE, SEULS, PRIS SUR LA CARTE ELLE-MÊME : la différence
 * entre la carte peinte avec ses rayons — et leur brillant du repos — et la
 * même carte sans eux, dans la fenêtre d'art, posée sur une toile carrée
 * centrée sur le centre des rayons. C'est la couche qui tourne sur la
 * vignette d'une carte animée.
 *
 * Keko : « les cartes animées semblent avoir un fond plus sombre que les
 * autres ». *Elles l'étaient* : la couche redessinait les rayons du cran à
 * leur force nue, multipliée d'un surcroît écrit à la main (1,8), alors que
 * la carte de face les fait briller par la lampe (`brillantDuRepos`, jusqu'à
 * six fois les clairs). Mesuré sur la grille : le fond hors emoji d'une
 * vignette animée faisait 75 de clarté contre 111 pour la même carte simple.
 * **Une mesure écrite une fois ne reste pas vraie quand ce qui la produit a
 * bougé** ; la différence, elle, est exactement ce que la carte montre, à
 * l'angle zéro. Posée en `plus-lighter` sur le fond sans rayons, la vignette
 * animée au repos est la carte simple au pixel près — et comme sur la carte
 * 3D, le brillant tourne avec les rayons.
 *
 * Les deux peintures sont celles de la carte SANS SUJET : le brillant n'y
 * épargne aucun emoji (le masque est vide), donc la couche n'a pas de trou
 * qui tournerait avec elle ; le sticker, posé par-dessus, cache ce qu'il
 * cache. Alpha = la plus forte des trois composantes, couleur ramenée en
 * conséquence : prémultiplié, c'est la différence, et le reste est transparent.
 */
export function coucheDesRayons(avec: HTMLCanvasElement, sans: HTMLCanvasElement, cote: number): HTMLCanvasElement | null {
  const l0 = avec.width
  const h0 = avec.height
  if (l0 === 0 || h0 === 0 || sans.width !== l0 || sans.height !== h0) return null
  const R = RAYONS_DANS_LA_CARTE
  const x0 = Math.round(R.x * l0)
  const y0 = Math.round(R.y * h0)
  const l = Math.round(R.l * l0)
  const h = Math.round(R.h * h0)
  const ca = avec.getContext('2d', { willReadFrequently: true })
  const cs = sans.getContext('2d', { willReadFrequently: true })
  if (ca === null || cs === null) return null
  const a = ca.getImageData(x0, y0, l, h).data
  const b = cs.getImageData(x0, y0, l, h).data
  const c = document.createElement('canvas')
  c.width = cote
  c.height = cote
  const ctx = c.getContext('2d')
  if (ctx === null) return null
  const sortie = ctx.createImageData(cote, cote)
  const d = sortie.data
  // LE CENTRE DE LA FENÊTRE AU CENTRE DU CARRÉ : la couche tourne autour de lui.
  const dx = Math.round((cote - l) / 2)
  const dy = Math.round((cote - h) / 2)
  for (let j = 0; j < h; j++) {
    const y = j + dy
    if (y < 0 || y >= cote) continue
    for (let i = 0; i < l; i++) {
      const x = i + dx
      if (x < 0 || x >= cote) continue
      const k = (j * l + i) * 4
      const r = Math.max(0, a[k]! - b[k]!)
      const g = Math.max(0, a[k + 1]! - b[k + 1]!)
      const bl = Math.max(0, a[k + 2]! - b[k + 2]!)
      const m = Math.max(r, g, bl)
      if (m === 0) continue
      const o = (y * cote + x) * 4
      d[o] = Math.round((r * 255) / m)
      d[o + 1] = Math.round((g * 255) / m)
      d[o + 2] = Math.round((bl * 255) / m)
      d[o + 3] = m
    }
  }
  // HORS DE LA FENÊTRE, LA COUCHE SE PROLONGE : la carte n'a de rayons que dans
  // sa fenêtre, mais la couche tourne, et un coin de fenêtre tourné lit ce qui
  // est hors d'elle — sans ce prolongement, quatre coins sombres tournaient
  // avec les rayons. Les rayons s'éteignent linéairement avec la distance au
  // centre, nuls à la demi-diagonale (`peindreRayons`) : on reprend la couche
  // là où le rayon qui mène au pixel sort de la fenêtre, et on l'éteint de
  // même jusqu'à la demi-diagonale. *Le prolongement a la pente des rayons,
  // pas une pente à lui.*
  const cx = dx + l / 2
  const cy = dy + h / 2
  const portee = Math.hypot(l, h) / 2
  for (let y = 0; y < cote; y++) {
    const uy = y + 0.5 - cy
    for (let x = 0; x < cote; x++) {
      const ux = x + 0.5 - cx
      if (Math.abs(ux) < l / 2 && Math.abs(uy) < h / 2) continue
      const rho = Math.hypot(ux, uy)
      if (rho >= portee) continue
      const t = Math.min(l / 2 / Math.max(Math.abs(ux), 1e-6), h / 2 / Math.max(Math.abs(uy), 1e-6)) * 0.995
      const sx = Math.min(cote - 1, Math.max(0, Math.round(cx + ux * t - 0.5)))
      const sy = Math.min(cote - 1, Math.max(0, Math.round(cy + uy * t - 0.5)))
      const q = (sy * cote + sx) * 4
      if (d[q + 3] === 0) continue
      const k = (portee - rho) / Math.max(portee - rho * t, 1e-6)
      const o = (y * cote + x) * 4
      d[o] = d[q]!
      d[o + 1] = d[q + 1]!
      d[o + 2] = d[q + 2]!
      d[o + 3] = Math.round(d[q + 3]! * Math.min(1, Math.max(0, k)))
    }
  }
  ctx.putImageData(sortie, 0, 0)
  return c
}

/**
 * LA TOILE DU STICKER EN PART DE LA LARGEUR DE CARTE : sur la carte, le sticker
 * (marges comprises) tient dans la fenêtre d'art et en fait environ 0,8. C'est
 * ce qui donne au sticker en grand des cellules de paillettes de la même
 * finesse que sur la carte.
 */
export const STICKER_DANS_LA_CARTE = 0.8

/**
 * UNE ÉTOILE DE L'EMOJI, PEINTE PAR LA FORMULE DU NUANCEUR. Keko : « les étoiles
 * de l'emoji sur les cartes ne sont pas les mêmes sur les stickers, je veux les
 * mêmes ». *Le dessin d'avant était le mien* — des branches épaisses, presque
 * blanches. Ici, pixel par pixel, c'est celui des paillettes COSMOS : deux
 * branches d'un pixel d'épaisseur (`COSMOS.etoile`) qui s'éteignent en
 * exponentielle (`COSMOS.bras`), un petit cœur rond (`rayonGros`, à 0,6), le
 * tout coupé à sa cellule, à la couleur du spectre de la feuille ramenée vers
 * le blanc (mix 0,8).
 */
export function peindreEtoile(cellule: number, teinte: number): HTMLCanvasElement {
  const n = Math.max(3, Math.ceil(cellule))
  const c = document.createElement('canvas')
  c.width = n
  c.height = n
  const ctx = c.getContext('2d')
  if (ctx === null) return c
  const image = ctx.createImageData(n, n)
  const d = image.data
  const aa = 1 / cellule
  const ep = Math.max(aa, 0.002) * COSMOS.etoile
  const rP = COSMOS.rayonGros
  // UN SPECTRE SATURÉ, pas ramené vers le blanc. Keko : « booster un peu la
  // couleur des petites étoiles multicolores du sticker holo ». La palette en
  // cosinus est pastel ; une puissance la creuse vers les couleurs franches
  // (la règle du cerne arc-en-ciel, COSMOS.cerne.sature), et le gain rend la
  // clarté. La carte, elle, les ramène à 0,8 vers le blanc — le bloom les y
  // colore autour ; sur le sticker, la couleur doit tenir seule.
  const spectre = [0, 0.33, 0.67].map((o) => 0.5 + 0.5 * Math.cos(Math.PI * 2 * (teinte + o)))
  const ton = spectre.map((v) => Math.min(1, Math.pow(v, COSMOS.cerne.sature) * 1.35))
  for (let j = 0; j < n; j++) {
    for (let i = 0; i < n; i++) {
      const dx = (i + 0.5) / n - 0.5
      const dy = (j + 0.5) / n - 0.5
      const lg = Math.hypot(dx, dy)
      const t = Math.min(1, Math.max(0, (lg - (rP - aa)) / (2 * aa)))
      const point = 1 - t * t * (3 - 2 * t)
      const etoile =
        Math.exp(-Math.abs(dx) / ep) * Math.exp(-Math.abs(dy) * COSMOS.bras) +
        Math.exp(-Math.abs(dy) / ep) * Math.exp(-Math.abs(dx) * COSMOS.bras)
      const forme = Math.min(1, Math.max(point * 0.6, etoile))
      const k = (j * n + i) * 4
      d[k] = Math.round(ton[0]! * 255)
      d[k + 1] = Math.round(ton[1]! * 255)
      d[k + 2] = Math.round(ton[2]! * 255)
      d[k + 3] = Math.round(forme * 255)
    }
  }
  ctx.putImageData(image, 0, 0)
  return c
}

/**
 * LES ÉTOILES DE L'EMOJI HOLO, AU REPOS, PEINTES SUR UN STICKER. Keko : « quand
 * je lance le décollement d'un sticker, l'outline coloré disparaît et les
 * étoiles aussi (quand le sticker est holo) ». *Le sticker qu'on tire est une
 * peinture 2D*, et elle n'avait pas d'étoiles. Ce sont celles du sticker en
 * grand (même grille, même dessin, même calcul du miroir et de la lampe), pour
 * une carte À PLAT — elle l'est pendant le geste — posées une fois, découpées
 * à la silhouette, en lumière ajoutée.
 */
export function etoilesAuRepos(face: HTMLCanvasElement): void {
  const cote = face.width
  const fctx = face.getContext('2d', { willReadFrequently: true })
  if (fctx === null || cote === 0) return
  const px = fctx.getImageData(0, 0, cote, face.height).data
  const tmp = document.createElement('canvas')
  tmp.width = cote
  tmp.height = face.height
  const ctx = tmp.getContext('2d')
  if (ctx === null) return
  ctx.globalCompositeOperation = 'lighter'
  const L = BRILLANT.lampe
  const LL = Math.hypot(L[0], L[1], L[2])
  const [Lx, Ly, Lz] = [L[0] / LL, -L[1] / LL, L[2] / LL]
  const cx = cote / 2
  const cy = face.height / 2
  const oeil = cote * 2.5
  const pas = cote / (COSMOS.gros * STICKER_DANS_LA_CARTE)
  const k = COSMOS.dispersion * 2
  for (let y = pas / 2; y < face.height; y += pas) {
    for (let x = pas / 2; x < cote; x += pas) {
      if (Math.random() > COSMOS.partGros) continue
      const gx = Math.min(cote - 1, Math.round(x + (Math.random() - 0.5) * pas * 0.5))
      const gy = Math.min(face.height - 1, Math.round(y + (Math.random() - 0.5) * pas * 0.5))
      if (px[(gy * cote + gx) * 4 + 3]! < 230) continue
      let nx = (Math.random() - 0.5) * k
      let ny = (Math.random() - 0.5) * k
      let nz = 1
      const ln = Math.hypot(nx, ny, nz)
      nx /= ln
      ny /= ln
      nz /= ln
      let vx = cx - gx
      let vy = cy - gy
      let vz = oeil
      const lv = Math.hypot(vx, vy, vz)
      vx /= lv
      vy /= lv
      vz /= lv
      const vn = vx * nx + vy * ny + vz * nz
      const sf = Math.max(0, (2 * vn * nx - vx) * Lx + (2 * vn * ny - vy) * Ly + (2 * vn * nz - vz) * Lz)
      // LA FORCE DU STICKER EN GRAND, au scintillement moyen.
      const a = Math.min(1, Math.pow(sf, COSMOS.serreGros) * 0.8 * COSMOS.force * 0.28 * 2)
      if (a < 0.02) continue
      const etoile = peindreEtoile(pas, Math.random())
      ctx.globalAlpha = a
      ctx.drawImage(etoile, gx - etoile.width / 2, gy - etoile.height / 2)
    }
  }
  // DÉCOUPÉES À LA SILHOUETTE, puis ajoutées à la lumière.
  ctx.globalAlpha = 1
  ctx.globalCompositeOperation = 'destination-in'
  ctx.drawImage(face, 0, 0)
  fctx.save()
  fctx.globalCompositeOperation = 'lighter'
  fctx.drawImage(tmp, 0, 0)
  fctx.restore()
}

export function paillettesHolo(
  toile: HTMLCanvasElement,
  id: string,
  /**
   * POUR FAIRE SCINTILLER LA VIGNETTE. Keko : « dans la collection, les cartes
   * holo ne sont pas animées au niveau des paillettes ». `cible` : où peindre
   * (la carte elle-même par défaut) ; `seules` : les pâles seulement, ou les
   * vives seulement ; `variante` : un autre tirage de QUELLES paillettes
   * renvoient la lampe — *les places restent, l'éclat change*, comme en 3D
   * quand la carte bouge.
   */
  options: { cible?: HTMLCanvasElement; seules?: 'pales' | 'vives'; variante?: number } = {},
): void {
  const source = toile.getContext('2d', { willReadFrequently: true })
  const ctx = (options.cible ?? toile).getContext('2d')
  if (ctx === null || source === null) return
  const { width: l, height: h } = toile
  const carte = source.getImageData(0, 0, l, h).data
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
  const eclats = options.variante === undefined ? null : createRng((graine ^ (options.variante * 2654435761)) >>> 0)
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
        // SUR L'EMOJI AUSSI, comme en 3D (voir `COSMOS.surEmoji`).
        if (COSMOS.surEmoji === 0 && libre !== null && libre[k + 3]! < 128) continue
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
        // UNE VARIANTE RETIRE QUI BRILLE, à part égale.
        const tire = eclats === null ? allume : eclats.next()
        // MOINS, ET PLUS PETITES. Keko : « je trouve les étincelles un peu grosses
        // sur les holo de la collection, juste quelques paillettes comme sur la
        // carte c'est suffisant ». Plus de croix, plus de grossissement, et deux
        // fois moins de vives.
        const vive = tire < (g.gros ? 0.06 : 0.03)
        if ((options.seules === 'vives' && !vive) || (options.seules === 'pales' && vive)) continue
        const a = vive ? 0.9 : 0.1
        const r = r0
        // SUR L'EMOJI, RIEN QUE DES ÉTOILES : les grosses vives (voir `COSMOS.etoile`).
        if (libre !== null && libre[k + 3]! < 128) {
          if (!g.gros || !vive) continue
          etoileDePaillette(ctx, x, y, r * 3.2, teinte, a)
          continue
        }
        const halo = ctx.createRadialGradient(x, y, 0, x, y, r * 1.8)
        halo.addColorStop(0, `hsla(${teinte}, 100%, 92%, ${a})`)
        halo.addColorStop(0.35, `hsla(${teinte}, 100%, 70%, ${a * 0.6})`)
        halo.addColorStop(1, `hsla(${teinte}, 100%, 60%, 0)`)
        ctx.fillStyle = halo
        ctx.beginPath()
        ctx.arc(x, y, r * 1.8, 0, Math.PI * 2)
        ctx.fill()
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
  /** Les paillettes peintes dedans ; la vignette les pose elle-même, pour les faire scintiller. */
  paillettes = true,
  /** Sans les rayons du cran : la vignette d'une carte animée les fait tourner à part. */
  sansRayons = false,
  /** Les stickers collés sur la carte, déjà peints (`stickersColles`). */
  colles: readonly StickerPeint[] = [],
): Promise<HTMLCanvasElement> {
  const cle = `${c.id}#${largeur}${holo ? '#holo' : ''}${sansSujet ? '#nu' : ''}${anime ? '#anime' : ''}${paillettes ? '' : '#sp'}${sansRayons ? '#sr' : ''}${colles.length > 0 ? `#c:${colles.map((x) => x.cle).join(',')}` : ''}`
  const deja = PEINTES.get(cle)
  if (deja !== undefined) return deja
  const p = fileDePeinture.then(async () => {
    const toile = await peindreCarte(
      // LE DÉCOLLAGE NOMME SES BONUS AU CARTOUCHE, comme la carte 3D qu'il
      // remplace ; la vignette, non (elle a ses pastilles). Pas d'animation :
      // une vignette est une image fixe.
      { ...carteDeLEmoji(c, sansSujet || anime ? { holo, anime } : undefined), animation: undefined, sansSujet, sansRayons, colles },
      largeur,
    )
    // LE BRILLANT DU REPOS, comme la carte 3D de face : voir `brillantDuRepos`.
    // Sans rayons peints (`AVEC_RAYONS_CARTE`), pas de brillant de rayons non plus.
    brillantDuRepos(toile, SATURE_RAYONS[COULEUR[c.rarete]] ?? 1, sansRayons || !AVEC_RAYONS_CARTE)
    if (holo) {
      if (!sansSujet) cerneArcEnCielDuSujet(toile)
      if (paillettes) paillettesHolo(toile, c.id)
    }
    // LES STICKERS HOLO COLLÉS ont leur cerne arc-en-ciel figé, SUR LEURS PIXELS
    // SEULS — après celui de l'emoji, qui les a épargnés.
    colles.forEach((col, i) => {
      if (col.holo) arcEnCielDUnColle(toile, col, i)
    })
    return toile
  })
  fileDePeinture = p.catch(() => null)
  PEINTES.set(cle, p)
  // *Un cache retient les succès, pas les échecs.*
  p.catch(() => PEINTES.delete(cle))
  return p
}

/**
 * UN STICKER PEINT, à 256 : *une case d'album n'en montre pas plus*, et c'est
 * aussi la taille d'un sticker collé sur une carte. Le même que celui qu'on a
 * tiré de la carte (`stickerDe`), au cerne arc-en-ciel s'il est holo. L'album
 * et les cartes le partagent : un seul cache.
 */
export const COTE_STICKER = 256
const STICKERS_PEINTS = new Map<string, Promise<HTMLCanvasElement | null>>()
export function stickerPeint(c: CarteEmoji, holo: boolean): Promise<HTMLCanvasElement | null> {
  const cle = `${c.id}${holo ? '#holo' : ''}`
  const deja = STICKERS_PEINTS.get(cle)
  if (deja !== undefined) return deja
  const p = stickerDe(c.emoji, urlDeLIllustration(c.image)).then((image) => {
    if (image === null) return null
    const toile = document.createElement('canvas')
    toile.width = COTE_STICKER
    toile.height = COTE_STICKER
    const ctx = toile.getContext('2d', { willReadFrequently: holo })
    if (ctx === null) return null
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(image, 0, 0, COTE_STICKER, COTE_STICKER)
    if (holo) cerneArcEnCiel(toile, { x: 0, y: 0, l: 1, h: 1 })
    return toile
  })
  STICKERS_PEINTS.set(cle, p)
  p.then(
    (t) => t === null && STICKERS_PEINTS.delete(cle),
    () => STICKERS_PEINTS.delete(cle),
  )
  return p
}

/**
 * LES STICKERS COLLÉS SUR UNE CARTE, PRÊTS À PEINDRE. Keko : « coller des
 * stickers sur les cartes ». La collection ne garde que l'emoji et la version
 * de chaque sticker collé (`StickerColle`) ; ici on retrouve la carte au
 * catalogue (déclaré une fois par `declarerLeCatalogue`), et on peint le
 * sticker (holo pour une version holo). Un sticker dont l'emoji manque au
 * catalogue est passé. La clé distingue les peintures au cache des cartes.
 */
export interface StickerPeint extends StickerAPeindre {
  readonly image: HTMLCanvasElement
}
let CATALOGUE_PAR_ID = new Map<string, CarteEmoji>()
export function declarerLeCatalogue(catalogue: readonly CarteEmoji[]): void {
  CATALOGUE_PAR_ID = new Map(catalogue.map((c) => [c.id, c]))
}
/** La clé d'une liste de stickers collés, pour savoir si une vignette doit se repeindre. */
/** La clé d'un sticker collé : son emoji, sa version et sa place. */
function cleDuColle(c: StickerColle): string {
  return `${c.id}#${c.v}${c.x !== undefined && c.y !== undefined ? `@${c.x.toFixed(3)},${c.y.toFixed(3)},${(c.a ?? 0).toFixed(2)}` : ''}`
}
export function cleDesColles(colles: readonly StickerColle[] | undefined): string {
  return (colles ?? []).map(cleDuColle).join(',')
}
export async function stickersColles(colles: readonly StickerColle[] | undefined): Promise<StickerPeint[]> {
  if (colles === undefined || colles.length === 0) return []
  const peints = await Promise.all(
    colles.map(async (c): Promise<StickerPeint | null> => {
      const carte = CATALOGUE_PAR_ID.get(c.id)
      if (carte === undefined) return null
      const ex = exemplaireDe(c.v)
      // AU CERNE CRÈME, même holo : l'arc-en-ciel se pose après, vivant au
      // nuanceur en 3D, figé par `cerneArcEnCiel` sur une vignette (`holo`).
      const image = await stickerPeint(carte, false)
      if (image === null) return null
      // UN STICKER ANIMÉ RESTE ANIMÉ sur la carte (Keko : « qu'il garde son
      // animation s'il en a ») : ses images, crème pour la 3D, arc-en-ciel
      // figé pour une vignette s'il est holo.
      const anime =
        ex.anime && carte.animable
          ? { charger: (cote: number, arcEnCiel: boolean) => (arcEnCiel && ex.holo ? animationHolo(c.id, cote, false) : animationDeLEmoji(urlAnimationEmoji(c.id), cote)) }
          : undefined
      return { cle: cleDuColle(c), image, holo: ex.holo, x: c.x, y: c.y, a: c.a, ...(anime === undefined ? {} : { anime }) }
    }),
  )
  return peints.filter((x): x is StickerPeint => x !== null)
}

/**
 * L'ANIMATION D'UN STICKER HOLO ANIMÉ : CHAQUE IMAGE AVEC SON CERNE ARC-EN-CIEL.
 * Keko : « l'outline des stickers dans la liste est blanc au lieu d'être
 * multicolor (holo) pour les stickers holo animés (et pareil en mode zoom) ».
 * *Les images décodées sont déjà des stickers au cerne crème*, et le cerne
 * arc-en-ciel se posait sur l'image fixe seulement : la première image de
 * l'animation la recouvrait en blanc. Le cerne est un calcul par pixel, donc
 * il se fait **une fois par image au chargement**, en cache par emoji, taille
 * et forme — jamais à l'affichage. `seulCerne` : rien que le cerne, la couche
 * qu'on fait tourner au regard en grand (voir `StickerOuvert`). *Vit ici, et
 * plus dans l'album*, depuis que la vignette animée de la grille joue aussi
 * ses images (`Collection.tsx`).
 */
export interface ImagesAnimees {
  images: readonly CanvasImageSource[]
  duree: number
}
const ANIMATIONS_HOLO = new Map<string, Promise<ImagesAnimees | null>>()
export function animationHolo(id: string, cote: number, seulCerne: boolean): Promise<ImagesAnimees | null> {
  const cle = `${id}#${cote}${seulCerne ? '#cerne' : ''}`
  const deja = ANIMATIONS_HOLO.get(cle)
  if (deja !== undefined) return deja
  const p = animationDeLEmoji(urlAnimationEmoji(id), cote).then((a): ImagesAnimees | null => {
    if (a === null) return null
    const images: HTMLCanvasElement[] = []
    for (const img of a.images) {
      const t = document.createElement('canvas')
      t.width = cote
      t.height = cote
      const ctx = t.getContext('2d', { willReadFrequently: true })
      if (ctx === null) return null
      ctx.drawImage(img, 0, 0, cote, cote)
      cerneArcEnCiel(t, { x: 0, y: 0, l: 1, h: 1 }, seulCerne)
      images.push(t)
    }
    return { images, duree: a.duree }
  })
  ANIMATIONS_HOLO.set(cle, p)
  p.then(
    (a) => a === null && ANIMATIONS_HOLO.delete(cle),
    () => ANIMATIONS_HOLO.delete(cle),
  )
  return p
}

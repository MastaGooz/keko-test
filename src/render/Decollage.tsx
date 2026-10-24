/**
 * LE DÉCOLLAGE — on tire le sticker hors de la carte, la carte se désagrège, et
 * le sticker part dans l'album.
 *
 * Keko : « je voudrais une animation où l'emoji et son outline se décollent
 * comme un sticker et la carte se détruit, tandis que le sticker est gagné ».
 * Tranché avec lui : **le geste vaut confirmation** (on tire le sticker au
 * doigt, comme on déchire le sachet), **toutes les cartes se détruisent, même
 * la dernière**, et **le sticker garde le bonus** de l'exemplaire.
 *
 * ***LE STICKER EST UNE SCÈNE 2D POSÉE EXACTEMENT SUR LA CARTE 3D*** : *un
 * sticker qui se plie est une affaire de découpe et de reflet*, et la toile le
 * fait en trois `drawImage` là où le nuanceur demanderait une géométrie qui se
 * replie. **La carte, elle, reste en 3D jusqu'à la casse** — remise à plat et
 * repeinte sans son emoji (`sansSujet`), dès que la scène est prête (`onPret`).
 * Keko : « pourquoi quand je clique sur décoller le sticker, la carte change de
 * couleur et devient terne ? » *Elle était remplacée par sa peinture 2D*, la
 * vignette, sans la lumière de la scène, le brillant de la bordure et des
 * rayons ni le halo. La peinture ne sert plus qu'aux éclats (`onCasse` : la 3D
 * disparaît à cet instant).
 *
 * **LE PLI** : on tire dans un sens, et le sticker se lève par le bord
 * opposé, replié sur lui-même le long d'une ligne droite — la partie levée est
 * son reflet par rapport à cette ligne, et c'est son DOS qu'on voit (crème,
 * sans dessin). *La ligne avance presque aussi vite que le doigt* : le bord levé
 * passe devant lui, comme un coin qu'on retourne en le tirant.
 */
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { CarteEmoji } from '../logic/emoji/types.ts'
import type { Exemplaire } from '../logic/emoji/collection.ts'
import { AMBIANCE, sujetDe, tailleQuIlFaut } from './texture-carte.ts'
import { cerneArcEnCiel, etoilesAuRepos, peinte, type StickerPeint } from './peinture-vignette.ts'
import { COULEUR } from './carte-emoji.ts'
import { SATURATION_APLAT } from './Carte3D.tsx'
import { SON_CRAQUE, SON_EQUIPER, SON_POSER, SON_PRENDRE, jouerEnBoucle, jouerSon, type SonEnBoucle } from './sons.ts'

/** La boîte de la carte à l'écran, en pixels CSS : son centre et sa taille. */
export interface BoiteALEcran {
  cx: number
  cy: number
  l: number
  h: number
}

/** LES CHIFFRES DU GESTE ET DE LA MISE EN SCÈNE — de moi, à rejuger par Keko. */
export const DECOLLAGE = {
  /** La ligne du pli avance de cette part du doigt. */
  avance: 0.9,
  /** Levé à cette part au lâcher, le sticker part ; en dessous, il se recolle. */
  seuil: 0.4,
  /** Levé à cette part pendant le geste, il part sans attendre le lâcher. */
  seuilDirect: 0.85,
  /** Les durées, en secondes. */
  recolle: 0.22,
  arrache: 0.16,
  retourne: 0.42,
  tient: 0.7,
  envol: 0.55,
  miettes: 1.15,
  /**
   * LES ÉCLATS SONT LES CASES D'UNE TOILE D'ARAIGNÉE autour du trou : `rayons`
   * droites depuis lui, `anneaux` cercles. *Elle casse d'un coup* — la fêlure
   * qui la montrait d'abord est partie (Keko : « la prévisualisation des
   * éclats n'est pas nécessaire »).
   */
  rayons: 11,
  anneaux: 4,
  /** Le sticker gagné grandit de tant au-dessus de la carte. */
  grossi: 1.3,
  /** Le coin qui se soulève tout seul pour dire où tirer, en part du sticker. */
  invite: 0.16,
  /** Le cerne qui naît autour du dessin nu (secondes), et le petit gonflement qui l'accompagne. */
  cerne: 0.45,
  gonfle: 0.08,
} as const

type P = { x: number; y: number }
type Phase = 'prepa' | 'cerne' | 'tirer' | 'recolle' | 'arrache' | 'retourne' | 'tient' | 'envol' | 'fin'

interface Pret {
  /** La carte sans son sticker. */
  base: HTMLCanvasElement
  face: HTMLCanvasElement
  /** Ce que la carte montrait (nu, ou au cerne du cran) : le cerne crème naît d'abord. */
  nu: HTMLCanvasElement | null
  dos: HTMLCanvasElement
  /** La place du sticker à l'écran (sa toile entière, marge comprise). */
  s: { x: number; y: number; l: number; h: number }
  /** Des points pris dans le sticker opaque, à l'écran : ce qui est levé se compte dessus. */
  points: Float32Array
}

const lisse = (t: number): number => {
  const x = Math.min(1, Math.max(0, t))
  return x * x * (3 - 2 * x)
}
const sortie = (t: number): number => 1 - Math.pow(1 - Math.min(1, Math.max(0, t)), 3)
const entree = (t: number): number => Math.pow(Math.min(1, Math.max(0, t)), 2.2)

/** L'opacité d'un pixel du sticker, sans son ombre portée (plus pâle que le cerne). */
const sansOmbre = (a: number): number => Math.min(255, Math.max(0, ((a - 120) / 60) * 255))

async function preparer(carte: CarteEmoji, ex: Exemplaire, boite: BoiteALEcran, colles: readonly StickerPeint[]): Promise<Pret | null> {
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  const largeur = tailleQuIlFaut(boite.l * dpr)
  const [pleine, base] = await Promise.all([
    peinte(carte, largeur, ex.holo, false, false, true, false, colles),
    peinte(carte, largeur, ex.holo, true, ex.anime, true, false, colles),
  ])
  const sujet = sujetDe(pleine)
  if (sujet === undefined) return null
  const k = boite.l / pleine.width
  const s = {
    x: boite.cx - boite.l / 2 + sujet.x * k,
    y: boite.cy - boite.h / 2 + sujet.y * k,
    l: sujet.l * k,
    h: sujet.h * k,
  }
  // LA FACE : une copie — le sticker peint est partagé par toutes les cartes du
  // même emoji, et la holo le repeint en arc-en-ciel.
  const lf = sujet.image.width
  const hf = sujet.image.height
  const face = document.createElement('canvas')
  face.width = lf
  face.height = hf
  const fc = face.getContext('2d', { willReadFrequently: true })
  if (fc === null) return null
  fc.drawImage(sujet.image, 0, 0)
  if (ex.holo) {
    cerneArcEnCiel(face, { x: 0, y: 0, l: 1, h: 1 })
    // ET SES ÉTOILES, celles de la carte à plat : voir `etoilesAuRepos`.
    etoilesAuRepos(face)
  }
  // LE DOS : la silhouette du sticker, sans son ombre, couleur papier.
  const dos = document.createElement('canvas')
  dos.width = lf
  dos.height = hf
  const dc = dos.getContext('2d')
  if (dc === null) return null
  const pixels = fc.getImageData(0, 0, lf, hf)
  const silhouette = dc.createImageData(lf, hf)
  for (let i = 3; i < pixels.data.length; i += 4) silhouette.data[i] = sansOmbre(pixels.data[i]!)
  dc.putImageData(silhouette, 0, 0)
  dc.globalCompositeOperation = 'source-in'
  const papier = dc.createLinearGradient(0, 0, lf, hf)
  papier.addColorStop(0, '#fbf7ee')
  papier.addColorStop(0.55, '#ece4d4')
  papier.addColorStop(1, '#d6ccb9')
  dc.fillStyle = papier
  dc.fillRect(0, 0, lf, hf)
  // LES POINTS : une grille de 40, gardée où le sticker est opaque.
  const N = 40
  const pts: number[] = []
  for (let j = 0; j < N; j++) {
    for (let i = 0; i < N; i++) {
      const px = Math.floor(((i + 0.5) / N) * lf)
      const py = Math.floor(((j + 0.5) / N) * hf)
      if (sansOmbre(pixels.data[(py * lf + px) * 4 + 3]!) < 128) continue
      pts.push(s.x + ((i + 0.5) / N) * s.l, s.y + ((j + 0.5) / N) * s.h)
    }
  }
  if (pts.length === 0) return null
  return { base, face, nu: sujet.montre ?? null, dos, s, points: new Float32Array(pts) }
}

/** Les bornes du sticker le long de `u`, et la part levée quand la ligne est à `m`. */
function bornes(points: Float32Array, u: P): { min: number; max: number } {
  let min = Infinity
  let max = -Infinity
  for (let i = 0; i < points.length; i += 2) {
    const p = points[i]! * u.x + points[i + 1]! * u.y
    if (p < min) min = p
    if (p > max) max = p
  }
  return { min, max }
}
/**
 * OÙ EN EST LE PLI, de 0 (rien de levé) à 1 (tout) — *le long du geste*, pas en
 * surface : tiré par un coin, un carré à moitié parcouru n'a levé qu'un quart
 * de sa surface, et le seuil semblait ne jamais venir.
 */
function partLevee(points: Float32Array, u: P, m: number): number {
  const b = bornes(points, u)
  return Math.min(1, Math.max(0, (m - b.min) / Math.max(1, b.max - b.min)))
}

/** Le demi-plan où `côté·(p·u − m) > 0`, en chemin. */
function demiPlan(ctx: CanvasRenderingContext2D, u: P, m: number, cote: 1 | -1): void {
  const W = 1e4
  const lx = u.x * m
  const ly = u.y * m
  const vx = -u.y
  const vy = u.x
  ctx.beginPath()
  ctx.moveTo(lx + vx * W, ly + vy * W)
  ctx.lineTo(lx - vx * W, ly - vy * W)
  ctx.lineTo(lx - vx * W + u.x * W * cote, ly - vy * W + u.y * W * cote)
  ctx.lineTo(lx + vx * W + u.x * W * cote, ly + vy * W + u.y * W * cote)
  ctx.closePath()
}

/**
 * LE STICKER À MOITIÉ LEVÉ : ce qui tient encore est la face, découpée au pli ;
 * ce qui est levé est le DOS, reflété par-dessus la ligne, avec son ombre.
 */
function dessinerPli(ctx: CanvasRenderingContext2D, pret: Pret, u: P, m: number, dpr: number): void {
  const { s } = pret
  ctx.save()
  demiPlan(ctx, u, m, 1)
  ctx.clip()
  ctx.drawImage(pret.face, s.x, s.y, s.l, s.h)
  ctx.restore()
  ctx.save()
  // LE REFLET PAR RAPPORT À LA LIGNE p·u = m : p' = p + 2(m − p·u)u.
  ctx.transform(1 - 2 * u.x * u.x, -2 * u.x * u.y, -2 * u.x * u.y, 1 - 2 * u.y * u.y, 2 * m * u.x, 2 * m * u.y)
  // La découpe se pose APRÈS le reflet, dans le repère du sticker à plat : ce
  // qui est levé, c'est ce qui était du côté du bord tiré.
  demiPlan(ctx, u, m, -1)
  ctx.clip()
  // L'OMBRE N'OBÉIT PAS À LA TRANSFORMATION : elle se compte en pixels de la toile.
  ctx.shadowColor = 'rgba(10, 4, 30, 0.45)'
  ctx.shadowBlur = 12 * dpr
  ctx.shadowOffsetX = u.x * 7 * dpr
  ctx.shadowOffsetY = u.y * 7 * dpr
  ctx.drawImage(pret.dos, s.x, s.y, s.l, s.h)
  ctx.restore()
}

interface Miette {
  /** Le polygone de l'éclat, à l'écran, à plat. */
  poly: P[]
  /** Son centre : c'est autour de lui qu'il tourne. */
  c: P
  vx: number
  vy: number
  /** La rotation dans le plan, et la culbute (une rotation en profondeur, simulée par l'écrasement). */
  vr: number
  vf: number
  retard: number
}

interface Casse {
  miettes: Miette[]
  boite: BoiteALEcran
  trou: P
}

/**
 * LA CARTE EN ÉCLATS, PAS EN CARREAUX. Keko : « on peut améliorer un peu
 * l'effet de destruction de la carte ? » *Une grille de rectangles se lisait
 * comme un puzzle qu'on défait*, pas comme une carte qui casse : **une vitre
 * frappée se fend en toile d'araignée autour du point d'impact**, et le trou
 * du sticker en est un. Des droites partent du trou, des anneaux les relient,
 * les deux un peu de travers — et les cases sont les éclats.
 */
function casser(boite: BoiteALEcran, trou: P): Casse {
  const { rayons: nr, anneaux: na } = DECOLLAGE
  const x0 = boite.cx - boite.l / 2
  const y0 = boite.cy - boite.h / 2
  // JUSQU'AU COIN LE PLUS LOIN : le dernier anneau sort de la carte.
  const loin = Math.max(
    ...[
      [x0, y0],
      [x0 + boite.l, y0],
      [x0, y0 + boite.h],
      [x0 + boite.l, y0 + boite.h],
    ].map(([x, y]) => Math.hypot(x! - trou.x, y! - trou.y)),
  )
  const depart = Math.random() * Math.PI * 2
  const angles = Array.from({ length: nr }, (_, i) => depart + ((i + 0.5 + (Math.random() - 0.5) * 0.6) / nr) * Math.PI * 2)
  // LES ANNEAUX SE SERRENT PRÈS DU TROU : petits éclats au centre, grands au bord.
  const rayonsAnneaux = Array.from({ length: na + 1 }, (_, k) =>
    k === 0 ? 0 : k === na ? loin * 1.05 : loin * Math.pow(k / na, 1.25) * (0.9 + Math.random() * 0.2),
  )
  const sommet: P[][] = rayonsAnneaux.map((r, k) =>
    angles.map((a) => {
      const j = k === 0 || k === na ? 0 : (Math.random() - 0.5) * 0.18
      return { x: trou.x + Math.cos(a + j) * r, y: trou.y + Math.sin(a + j) * r }
    }),
  )
  const miettes: Miette[] = []
  for (let k = 0; k < na; k++) {
    for (let i = 0; i < nr; i++) {
      const i2 = (i + 1) % nr
      const poly = k === 0
        ? [trou, sommet[1]![i]!, sommet[1]![i2]!]
        : [sommet[k]![i]!, sommet[k + 1]![i]!, sommet[k + 1]![i2]!, sommet[k]![i2]!]
      const c = {
        x: poly.reduce((t, p) => t + p.x, 0) / poly.length,
        y: poly.reduce((t, p) => t + p.y, 0) / poly.length,
      }
      // UN ÉCLAT ENTIÈREMENT HORS DE LA CARTE N'EXISTE PAS.
      if (poly.every((p) => p.x < x0 || p.x > x0 + boite.l) || poly.every((p) => p.y < y0 || p.y > y0 + boite.h)) {
        continue
      }
      const dx = c.x - trou.x
      const dy = c.y - trou.y
      const d = Math.max(1, Math.hypot(dx, dy))
      // PRÈS DU TROU ÇA PART FORT, AU BORD ÇA TOMBE.
      const force = (520 - 300 * (k / na)) * (0.7 + Math.random() * 0.6)
      miettes.push({
        poly,
        c,
        vx: (dx / d) * force + (Math.random() - 0.5) * 60,
        vy: (dy / d) * force * 0.7 - 220 - Math.random() * 180,
        vr: (Math.random() - 0.5) * 7,
        vf: (Math.random() < 0.5 ? -1 : 1) * (1.5 + Math.random() * 2.5),
        // UN ÉCART À PEINE : les éclats en attente montreraient la toile avant la casse.
        retard: (k / na) * 0.05 + Math.random() * 0.02,
      })
    }
  }
  return { miettes, boite, trou }
}

function cheminPoly(ctx: CanvasRenderingContext2D, poly: P[]): void {
  ctx.beginPath()
  ctx.moveTo(poly[0]!.x, poly[0]!.y)
  for (let i = 1; i < poly.length; i++) ctx.lineTo(poly[i]!.x, poly[i]!.y)
  ctx.closePath()
}

/** La découpe de la carte, coins arrondis compris (`RAYON_SIMPLE` de la largeur). */
function cheminCarte(ctx: CanvasRenderingContext2D, b: BoiteALEcran): void {
  const x = b.cx - b.l / 2
  const y = b.cy - b.h / 2
  const r = b.l * 0.055
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + b.l, y, x + b.l, y + b.h, r)
  ctx.arcTo(x + b.l, y + b.h, x, y + b.h, r)
  ctx.arcTo(x, y + b.h, x, y, r)
  ctx.arcTo(x, y, x + b.l, y, r)
  ctx.closePath()
}

function dessinerMiettes(
  ctx: CanvasRenderingContext2D,
  base: HTMLCanvasElement,
  casse: Casse,
  t: number,
  ton: string,
): void {
  const { boite: b, trou } = casse
  const x0 = b.cx - b.l / 2
  const y0 = b.cy - b.h / 2
  const g = 1800
  for (const m of casse.miettes) {
    const tt = Math.max(0, t - m.retard)
    const alpha = 1 - lisse((tt - DECOLLAGE.miettes * 0.4) / (DECOLLAGE.miettes * 0.45))
    if (alpha <= 0.01) continue
    const x = m.c.x + m.vx * tt
    const y = m.c.y + m.vy * tt + 0.5 * g * tt * tt
    const culbute = Math.cos(m.vf * tt)
    ctx.save()
    ctx.globalAlpha = alpha
    ctx.translate(x, y)
    ctx.rotate(m.vr * tt)
    ctx.scale(culbute, 1)
    ctx.translate(-m.c.x, -m.c.y)
    cheminCarte(ctx, b)
    ctx.clip()
    cheminPoly(ctx, m.poly)
    ctx.clip()
    if (culbute >= 0) {
      ctx.drawImage(base, x0, y0, b.l, b.h)
      // ELLE S'ASSOMBRIT EN SE METTANT DE CHANT : la lumière la prend de biais.
      ctx.fillStyle = `rgba(10, 4, 30, ${0.45 * (1 - culbute)})`
      ctx.fill()
    } else {
      // LE DOS DE LA CARTE, le bleu du dos, quand l'éclat se retourne.
      ctx.fillStyle = `rgb(${Math.round(44 * (0.55 - 0.45 * culbute))}, ${Math.round(96 * (0.55 - 0.45 * culbute))}, ${Math.round(214 * (0.55 - 0.45 * culbute))})`
      ctx.fill()
    }
    // LE FLASH DE LA CASSE, puis un liseré clair : *un éclat se lit à son bord.*
    // UNE FOIS POUR TOUTE LA CARTE, à l'instant où elle cède.
    const flash = 1 - lisse(t / 0.14)
    if (flash > 0) {
      ctx.fillStyle = `rgba(255, 250, 235, ${0.75 * flash})`
      ctx.fill()
    }
    ctx.strokeStyle = 'rgba(255, 248, 225, 0.85)'
    ctx.lineWidth = 2.2
    ctx.stroke()
    ctx.restore()
  }
  // L'ONDE DE CHOC, un anneau qui part du trou.
  const to = t
  if (to < 0.4) {
    const k = to / 0.4
    ctx.save()
    ctx.globalCompositeOperation = 'lighter'
    ctx.globalAlpha = 0.8 * (1 - k)
    ctx.strokeStyle = ton
    ctx.lineWidth = 10 * (1 - k) + 1
    ctx.beginPath()
    ctx.arc(trou.x, trou.y, 30 + Math.max(b.l, b.h) * 0.9 * sortie(k), 0, Math.PI * 2)
    ctx.stroke()
    ctx.restore()
  }
}

interface Etincelle {
  x: number
  y: number
  vx: number
  vy: number
  vie: number
  creme: boolean
  /** Un petit éclat triangulaire qui tourne, plutôt qu'un point de lumière. */
  debris: boolean
  a: number
}

function gerbe(trou: P, n: number): Etincelle[] {
  return Array.from({ length: n }, () => {
    const a = Math.random() * Math.PI * 2
    const v = 160 + Math.random() * 520
    return {
      x: trou.x,
      y: trou.y,
      vx: Math.cos(a) * v,
      vy: Math.sin(a) * v - 120,
      vie: 0.45 + Math.random() * 0.5,
      creme: Math.random() < 0.5,
      debris: Math.random() < 0.4,
      a: Math.random() * Math.PI * 2,
    }
  })
}

function dessinerEtincelles(ctx: CanvasRenderingContext2D, e: Etincelle[], t: number, ton: string): void {
  ctx.save()
  ctx.globalCompositeOperation = 'lighter'
  for (const p of e) {
    if (t > p.vie) continue
    const frein = Math.exp(-3.5 * t)
    const x = p.x + (p.vx * (1 - frein)) / 3.5
    const y = p.y + (p.vy * (1 - frein)) / 3.5 + 300 * t * t
    const a = 1 - t / p.vie
    const r = 2 + 3 * a
    ctx.globalAlpha = a
    ctx.fillStyle = p.creme ? '#fff6dc' : ton
    ctx.beginPath()
    if (p.debris) {
      const q = p.a + t * 14
      const R = r * 1.8
      ctx.moveTo(x + Math.cos(q) * R, y + Math.sin(q) * R)
      ctx.lineTo(x + Math.cos(q + 2.3) * R * 0.7, y + Math.sin(q + 2.3) * R * 0.7)
      ctx.lineTo(x + Math.cos(q + 4.1) * R, y + Math.sin(q + 4.1) * R)
      ctx.closePath()
    } else ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.restore()
}

/** Où le sticker s'envole : le bouton « Stickers » de la barre (en bas), sinon le bas de l'écran. */
function cibleDeLEnvol(): P {
  const el = document.querySelector('.nav-stickers')
  const r = el?.getBoundingClientRect()
  if (r !== undefined && r.width > 0 && r.bottom > 0) return { x: r.left + r.width / 2, y: r.top + r.height / 2 }
  return { x: window.innerWidth * 0.75, y: window.innerHeight + 60 }
}

export function Decollage({
  carte,
  exemplaire,
  colles = [],
  boite,
  onPret,
  onCasse,
  onFini,
  onAnnuler,
}: {
  carte: CarteEmoji
  exemplaire: Exemplaire
  /** Les stickers collés sur la carte, déjà peints : ils restent sur la carte qui casse. */
  colles?: readonly StickerPeint[]
  boite: BoiteALEcran
  /** Le sticker est prêt à se décoller : la carte 3D se met à plat et perd son emoji. */
  onPret: () => void
  /** La carte casse : la 3D disparaît, les éclats 2D prennent sa place. */
  onCasse: () => void
  /** Le sticker est gagné et la carte détruite : c'est là qu'on l'écrit. */
  onFini: () => void
  onAnnuler: () => void
}): React.ReactElement {
  const toile = useRef<HTMLCanvasElement>(null)
  const [pret, setPret] = useState<Pret | null>(null)
  const [phase, setPhase] = useState<Phase>('prepa')
  const refPhase = useRef<Phase>('prepa')
  const laBoite = useRef(boite).current
  const appels = useRef({ onPret, onCasse, onFini, onAnnuler })
  appels.current = { onPret, onCasse, onFini, onAnnuler }
  const etat = useRef({
    t0: 0,
    depart: null as P | null,
    doigt: null as P | null,
    u: { x: -Math.SQRT1_2, y: Math.SQRT1_2 } as P,
    len: 0,
    len0: 0,
    len1: 0,
    craque: null as SonEnBoucle | null,
    vu: 0,
    dernier: { x: 0, y: 0, t: 0 },
  })

  function passer(p: Phase): void {
    refPhase.current = p
    etat.current.t0 = performance.now()
    setPhase(p)
  }

  // LA BARRE S'EFFACE LE TEMPS DU GESTE, et revient pour l'envol.
  useEffect(() => {
    if (phase === 'envol' || phase === 'fin') document.body.classList.remove('en-decollage')
    else document.body.classList.add('en-decollage')
  }, [phase])
  useEffect(() => () => document.body.classList.remove('en-decollage'), [])

  useEffect(() => {
    let vivant = true
    void preparer(carte, exemplaire, laBoite, colles).then(
      (p) => {
        if (!vivant) return
        if (p === null) {
          appels.current.onAnnuler()
          return
        }
        setPret(p)
        passer(p.nu !== null ? 'cerne' : 'tirer')
        appels.current.onPret()
      },
      () => vivant && appels.current.onAnnuler(),
    )
    return () => {
      vivant = false
      etat.current.craque?.arreter()
    }
    // UNE FOIS : la carte, l'exemplaire et la boîte sont ceux du moment où on a demandé.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function arracher(): void {
    const e = etat.current
    const b = bornes(pret!.points, e.u)
    e.len0 = e.len
    // JUSQU'À CE QUE TOUT SOIT LEVÉ, et un peu plus.
    e.len1 = ((b.max - b.min) / DECOLLAGE.avance) * 1.04
    e.craque?.doser(0)
    passer('arrache')
    jouerSon(SON_EQUIPER)
  }

  useEffect(() => {
    if (pret === null) return
    const t = toile.current
    const ctx = t?.getContext('2d')
    if (t == null || ctx == null) return
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    t.width = Math.round(window.innerWidth * dpr)
    t.height = Math.round(window.innerHeight * dpr)
    const b = laBoite
    const centre: P = { x: pret.s.x + pret.s.l / 2, y: pret.s.y + pret.s.h / 2 }
    // LE STICKER GAGNÉ SE MONTRE AU-DESSUS DE LA CARTE, un peu plus haut que son trou.
    const haut: P = { x: b.cx, y: b.cy - b.h * 0.1 }
    const ton = AMBIANCE[COULEUR[carte.rarete]] ?? '#ffffff'
    let miettes: Casse | null = null
    let etincelles: Etincelle[] = []
    let tCasse = 0
    // LA POSE DU STICKER QUAND IL EST ENTIÈREMENT LEVÉ : son reflet, en centre et angle.
    let pose = { c: centre, a: 0 }
    let cible: P = { x: 0, y: 0 }
    let image = 0

    const dessinerSticker = (c: P, a: number, sx: number, sc: number, alpha = 1): void => {
      ctx.save()
      ctx.globalAlpha = alpha
      ctx.translate(c.x, c.y)
      ctx.rotate(a)
      ctx.scale(sx * sc, sc)
      // LE DOS TANT QU'IL EST RETOURNÉ : un sticker qu'on retourne montre son papier.
      ctx.shadowColor = 'rgba(10, 4, 30, 0.5)'
      ctx.shadowBlur = 18 * dpr
      ctx.shadowOffsetY = 10 * dpr * sc
      ctx.drawImage(sx < 0 ? pret.dos : pret.face, -pret.s.l / 2, -pret.s.h / 2, pret.s.l, pret.s.h)
      ctx.restore()
    }

    const pas = (maintenant: number): void => {
      const e = etat.current
      const ph = refPhase.current
      const dt = (maintenant - e.t0) / 1000
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight)
      // LA CARTE EST EN 3D, DESSOUS, jusqu'à la casse ; puis ses éclats.
      if (miettes !== null) {
        const tc = (maintenant - tCasse) / 1000
        dessinerMiettes(ctx, pret.base, miettes, tc, ton)
        dessinerEtincelles(ctx, etincelles, tc, ton)
      }
      if (ph === 'cerne' && pret.nu !== null) {
        // LE CERNE CRÈME NAÎT : ce que la carte montrait (nu ou au cerne du
        // cran), puis le sticker entier qui apparaît par-dessus en gonflant un
        // peu — *il devient un sticker*.
        const k = Math.min(1, dt / DECOLLAGE.cerne)
        const g = 1 + DECOLLAGE.gonfle * Math.sin(Math.PI * k)
        const l = pret.s.l * g
        const h = pret.s.h * g
        const x = pret.s.x - (l - pret.s.l) / 2
        const y = pret.s.y - (h - pret.s.h) / 2
        ctx.drawImage(pret.nu, x, y, l, h)
        ctx.save()
        ctx.globalAlpha = sortie(k)
        ctx.drawImage(pret.face, x, y, l, h)
        ctx.restore()
        if (dt >= DECOLLAGE.cerne) passer('tirer')
      } else if (ph === 'tirer' || ph === 'recolle' || ph === 'arrache') {
        let len: number
        if (ph === 'tirer') {
          if (e.depart !== null && e.doigt !== null) {
            const dx = e.doigt.x - e.depart.x
            const dy = e.doigt.y - e.depart.y
            len = Math.hypot(dx, dy)
            if (len > 3) e.u = { x: dx / len, y: dy / len }
          } else {
            // L'INVITE : le coin haut-droit se soulève tout seul, puis se recolle.
            e.u = { x: -Math.SQRT1_2, y: Math.SQRT1_2 }
            const cycle = (maintenant / 1000) % 2.2
            const bb = bornes(pret.points, e.u)
            len = Math.sin(Math.PI * lisse(cycle / 1.1)) * (bb.max - bb.min) * DECOLLAGE.invite
          }
        } else if (ph === 'recolle') {
          len = e.len0 * (1 - sortie(dt / DECOLLAGE.recolle))
          if (dt >= DECOLLAGE.recolle) {
            e.depart = null
            e.doigt = null
            passer('tirer')
          }
        } else len = e.len0 + (e.len1 - e.len0) * sortie(dt / DECOLLAGE.arrache)
        e.len = len
        const bb = bornes(pret.points, e.u)
        const m = bb.min + len * DECOLLAGE.avance
        if (len > 0.5) dessinerPli(ctx, pret, e.u, m, dpr)
        else ctx.drawImage(pret.face, pret.s.x, pret.s.y, pret.s.l, pret.s.h)
        if (ph === 'tirer' && e.depart !== null && partLevee(pret.points, e.u, m) >= DECOLLAGE.seuilDirect) arracher()
        if (ph === 'arrache' && dt >= DECOLLAGE.arrache) {
          // LA POSE DU REFLET ENTIER : la ligne de pli fait un angle β, le reflet
          // est une rotation de 2β + π et un miroir.
          const m1 = bornes(pret.points, e.u).min + e.len1 * DECOLLAGE.avance
          const k = 2 * (m1 - (centre.x * e.u.x + centre.y * e.u.y))
          const beta = Math.atan2(e.u.x, -e.u.y)
          let a = 2 * beta + Math.PI
          a = Math.atan2(Math.sin(a), Math.cos(a))
          pose = { c: { x: centre.x + k * e.u.x, y: centre.y + k * e.u.y }, a }
          // LA CARTE SE CASSE AU MOMENT OÙ LE STICKER LA QUITTE.
          miettes = casser(b, centre)
          etincelles = gerbe(centre, 70)
          tCasse = maintenant
          appels.current.onCasse()
          jouerSon(SON_POSER, 0.9, 0, 0.7)
          passer('retourne')
        }
      } else if (ph === 'retourne') {
        const k = lisse(dt / DECOLLAGE.retourne)
        const c = { x: pose.c.x + (haut.x - pose.c.x) * k, y: pose.c.y + (haut.y - pose.c.y) * k }
        dessinerSticker(c, pose.a + (-0.08 - pose.a) * k, -Math.cos(Math.PI * k), 1 + (DECOLLAGE.grossi - 1) * k)
        if (dt >= DECOLLAGE.retourne) passer('tient')
      } else if (ph === 'tient') {
        // UNE LUEUR DU CRAN DERRIÈRE LUI, et un rebond.
        const lueur = ctx.createRadialGradient(haut.x, haut.y, 0, haut.x, haut.y, pret.s.l * 0.95)
        lueur.addColorStop(0, ton)
        lueur.addColorStop(1, 'rgba(0,0,0,0)')
        ctx.save()
        ctx.globalCompositeOperation = 'lighter'
        ctx.globalAlpha = 0.55 * (1 - lisse((dt - DECOLLAGE.tient * 0.6) / (DECOLLAGE.tient * 0.4)))
        ctx.fillStyle = lueur
        ctx.fillRect(haut.x - pret.s.l, haut.y - pret.s.l, pret.s.l * 2, pret.s.l * 2)
        ctx.restore()
        const rebond = 1 + 0.09 * Math.exp(-5 * dt) * Math.sin(dt * 16)
        dessinerSticker(haut, -0.08 + 0.05 * Math.sin(dt * 5) * Math.exp(-2 * dt), 1, DECOLLAGE.grossi * rebond)
        if (dt >= DECOLLAGE.tient) {
          cible = cibleDeLEnvol()
          passer('envol')
        }
      } else if (ph === 'envol') {
        const k = entree(dt / DECOLLAGE.envol)
        const c = { x: haut.x + (cible.x - haut.x) * k, y: haut.y + (cible.y - haut.y) * k - Math.sin(Math.PI * k) * 60 }
        dessinerSticker(c, -0.08 + k * 0.7, 1, DECOLLAGE.grossi + (0.2 - DECOLLAGE.grossi) * k, 1 - lisse((k - 0.75) / 0.25))
        if (dt >= DECOLLAGE.envol) {
          passer('fin')
          appels.current.onFini()
          return
        }
      }
      image = requestAnimationFrame(pas)
    }
    image = requestAnimationFrame(pas)
    return () => cancelAnimationFrame(image)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pret])

  /** Le doigt est-il sur le sticker (sa place, élargie d'un quart) ? */
  function surLeSticker(x: number, y: number): boolean {
    if (pret === null) return false
    const { s } = pret
    const mx = s.l * 0.12
    const my = s.h * 0.12
    return x >= s.x - mx && x <= s.x + s.l + mx && y >= s.y - my && y <= s.y + s.h + my
  }

  return createPortal(
    <div
      className={`decollage${pret === null ? ' decollage-prepa' : ''}`}
      onPointerDown={(ev) => {
        if (refPhase.current !== 'tirer' || !surLeSticker(ev.clientX, ev.clientY)) return
        if (ev.target instanceof Element && ev.target.closest('button') !== null) return
        try {
          ev.currentTarget.setPointerCapture(ev.pointerId)
        } catch {
          // Un pointeur déjà levé ne se capture pas : le geste continue sans.
        }
        const e = etat.current
        e.depart = { x: ev.clientX, y: ev.clientY }
        e.doigt = { ...e.depart }
        e.dernier = { x: ev.clientX, y: ev.clientY, t: performance.now() }
        jouerSon(SON_PRENDRE, 0.6)
        // LE DÉCOLLAGE CRAQUE COMME LE FILM DU SACHET : la même boucle, dosée par
        // la vitesse du doigt, née dans le geste (sinon elle reste muette).
        e.craque?.arreter()
        e.craque = jouerEnBoucle(SON_CRAQUE, 0.8)
        e.craque.doser(0)
      }}
      onPointerMove={(ev) => {
        const e = etat.current
        if (refPhase.current !== 'tirer' || e.depart === null) return
        e.doigt = { x: ev.clientX, y: ev.clientY }
        const t = performance.now()
        const dt = Math.max(1, t - e.dernier.t)
        const v = Math.hypot(ev.clientX - e.dernier.x, ev.clientY - e.dernier.y) / dt
        e.dernier = { x: ev.clientX, y: ev.clientY, t }
        e.craque?.doser(Math.min(1, v * 1.6))
      }}
      onPointerUp={(ev) => {
        const e = etat.current
        e.craque?.doser(0)
        if (refPhase.current !== 'tirer' || e.depart === null || pret === null) return
        // LE GESTE SE MESURE AU LÂCHER, pas à la dernière image : un doigt vif
        // lâche avant que l'image suivante ait lu son dernier mouvement.
        const dx = ev.clientX - e.depart.x
        const dy = ev.clientY - e.depart.y
        const lg = Math.hypot(dx, dy)
        if (lg > 3) {
          e.u = { x: dx / lg, y: dy / lg }
          e.len = lg
        }
        const m = bornes(pret.points, e.u).min + e.len * DECOLLAGE.avance
        if (partLevee(pret.points, e.u, m) >= DECOLLAGE.seuil) arracher()
        else {
          e.len0 = e.len
          passer('recolle')
        }
      }}
      onPointerCancel={() => {
        const e = etat.current
        e.craque?.doser(0)
        if (refPhase.current !== 'tirer' || e.depart === null) return
        e.len0 = e.len
        passer('recolle')
      }}
    >
      <canvas
        ref={toile}
        className="decollage-toile"
        style={{ filter: `saturate(${1 + SATURATION_APLAT})` }}
      />
      {(phase === 'tirer' || phase === 'recolle') && (
        <>
          <p className="decollage-invite">Tire le sticker pour le décoller</p>
          <button type="button" className="decollage-annuler" onClick={() => appels.current.onAnnuler()}>
            Annuler
          </button>
        </>
      )}
      {(phase === 'tient' || phase === 'envol') && (
        <p className="decollage-gagne" style={{ top: `${laBoite.cy + laBoite.h * 0.22}px` }}>
          Sticker gagné !
        </p>
      )}
    </div>,
    document.body,
  )
}

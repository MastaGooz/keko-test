/**
 * LE MAGICIEN — `?magicien`, un side project (Keko, 08/11 : « un proto avec un jeu en vue de côté (genre plateforme)
 * avec le magicien à gauche et les ennemis (gobelins) qui arrivent par la droite : version vue de côté du Magicka-like
 * qu'on avait »).
 *
 * C'EST LA TOUR DU MAGICIEN (`?magie`) VUE DE CÔTÉ, EN PIXEL ART : la même règle (`logic/magie/jeu.ts` — la file des
 * éléments, la forme du sort, les ennemis, les vagues, les PV), avec une `Vue` de côté où tout arrive par la droite sur
 * la ligne du sol ; le magicien est à l'origine, à gauche. Le dessin est celui de pixelfx : les personnages sont NOS
 * mannequins (`ui/pixelfx/perso/` — le magicien à chapeau et bâton, le gobelin, l'orc, le golem, le squelette ; l'esprit
 * de feu est une flamme du dépôt), posés par le squelette image par image (la marche de `keko/gobelin-marche`, une
 * attaque, une incantation) ; les sorts sont des effets du dépôt (le souffle de feu et de givre, le rayon arcanique, le
 * soin, la flamme-esprit de l'élémentaire, l'étincelle d'impact, la frappe critique, le poof de la mort) ou de petits
 * effets écrits ici (l'éclair qui saute, le rocher). Tout se compose dans UN tampon de pixels à l'échelle du dépôt
 * (192 × 112, le sol à 96), agrandi en entier sans lisser.
 *
 * LES COMMANDES sont celles de la tour : la roue sous le doigt (glisser vers un quartier pour ajouter un élément ;
 * relâcher sans glisser pour lancer vers ce point, dont seule la droite ou la gauche compte), 1 à 6 au clavier, Entrée
 * pour lancer droit devant.
 */
import './magicien.css'
import * as noyau from 'pixelfx'
import { effects } from 'pixelfx/fx/index'
import { ajouter, avancer, effetsDuSort, ELEMENTS, lancer, MAGIE as C, nomDuSort, nouvellePartie, pret, viderLaFile, type Element, type EtatMagie, type Evenement, type TypeEnnemi } from '../../logic/magie/jeu.ts'
import { ecrireRecord, lireRecord } from '../invaders/commun.ts'
import { ouvrirLeSon, sonAnnule, sonDisparait, sonEclair, sonElement, sonHalo, sonImpact, sonInvoque, sonJet, sonMort, sonPerdu, sonPleine, sonRayon, sonSouffle, sonTouche, sonTour, sonVague } from '../magie/sons.ts'
import { peindreOmbre, peindrePose, type Personnage, type Pose } from '../pixelfx/perso/acte.js'
import { GOLEM, ORC, SQUELETTE } from '../pixelfx/perso/personnages.js'
import { act as marche } from '../pixelfx/fx/keko/gobelin-marche.js'
import { D as PAS_GOBELIN, palettesGobelin, peindreGobelin } from '../pixelfx/fx/keko/gobelin-bestiole.js'
import { INCANTATION, INCANTE, palettesMagicien, peindreMagicien, positionOrbe } from '../pixelfx/fx/keko/magicien-bestiole.js'

// ---------------------------------------------------------------- le dépôt, typé à notre usage
type Instance = { t: number; options: Record<string, unknown>; update(dt: number): void; draw(frame: unknown, couche?: string): void; stop(): void; done(): boolean }
type Module = { meta?: Record<string, unknown>; create?: unknown; draw?: unknown }
type Peintre = {
  px(x: number, y: number, c: number): void
  dot(x: number, y: number, c: number, a?: number): void
  circle(x: number, y: number, r: number, c: number, a?: number): void
  arc(x: number, y: number, r: number, w: number, a0: number, a1: number, c: number, a?: number): void
  polyline(pts: number[][], c: number, a?: number): void
  glow(x: number, y: number, r: number, c: number, k?: number): void
  glowLine(x0: number, y0: number, x1: number, y1: number, r: number, c: number, k?: number): void
}
type Noyau = {
  createFrame(w: number, h: number): { w: number; h: number; color: Uint32Array; light: Uint32Array }
  clearFrame<T>(f: T): T
  createFx(mod: Module, o: Record<string, unknown>): Instance
  composite(f: unknown, sortie: Uint8ClampedArray, fond: Uint32Array | null): void
  backdrop(sorte: string, w: number, h: number, sol: number): Uint32Array
  painterFor(frame: unknown): { place(x: number, y: number, flip?: boolean, angle?: number): unknown }
  poseAt(piste: [number, Pose, string?][], t: number): Pose
  bolt(r: { next(): number }, x0: number, y0: number, x1: number, y1: number, o?: { jag?: number; depth?: number }): number[][]
  fit(palette: string[], n: number): number[]
  Rng: new (graine: number) => { next(): number; range(a: number, b: number): number }
  PAL: Record<string, string[]>
  WHITE: number
}
const N = noyau as unknown as Noyau
const FX = effects as Record<string, Module>

// ---------------------------------------------------------------- la scène
/** Le tampon de pixels : sa taille, la ligne du sol, l'origine du monde (les pieds du magicien), les pixels par unité du monde. */
const W = 192
const H = 112
const SOL = 96
const OX = 30
const S = 2
const PAS = 1 / 60
const CLE_RECORD = 'keko-magicien-record'
/** L'orbe du bâton quand il pointe : d'où partent les sorts (en px de la scène, depuis les pieds du magicien). */
const MAIN = positionOrbe(INCANTE)
/** LES PERSONNAGES SONT LES BESTIOLES (Keko : « reprendre le jeu avec le nouveau gobelin et le nouveau sorcier ») : le gobelin et le magicien dessinés pixel par pixel ; les autres ennemis gardent le squelette en attendant leur bestiole. */
const PAL_GOBELIN = palettesGobelin()
const PAL_MAGICIEN = palettesMagicien()

const TEINTE: Record<Element, string> = { feu: '#ff7a2a', froid: '#8fe0ff', foudre: '#ffe066', terre: '#c89a5a', vie: '#8cff9a', mort: '#c07cff' }
const NOM: Record<Element, string> = { feu: 'Feu', froid: 'Froid', foudre: 'Foudre', terre: 'Terre', vie: 'Vie', mort: 'Mort' }
const ICONE: Record<Element, string> = {
  feu: 'M12 3c1 4 5 5 5 10a5 5 0 0 1-10 0c0-3 2-4 2-6 2 1 3 3 3 3s-1-4 0-7z',
  froid: 'M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9M9 4.5l3 2 3-2M9 19.5l3-2 3 2',
  foudre: 'M13 3L5 14h6l-1 7 8-11h-6z',
  terre: 'M4 17l3-7 4-3 5 1 4 5-1 5-6 2-6-1z',
  vie: 'M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.5-7 10-7 10z',
  mort: 'M12 3a7 7 0 0 0-7 7c0 2.6 1.4 4.2 3 5.5V19h8v-3.5c1.6-1.3 3-2.9 3-5.5a7 7 0 0 0-7-7zM9.5 11h.01M14.5 11h.01M10.5 19v2M13.5 19v2',
}
/** Les palettes du dépôt par élément, pour recolorer ses effets. */
const PALETTE: Record<Element, string[]> = {
  feu: N.PAL.fire,
  froid: N.PAL.ice,
  foudre: N.PAL.electric,
  terre: N.PAL.earth,
  vie: N.PAL.heal,
  mort: ['#140a26', '#2b1252', '#481c88', '#6b2cc0', '#9a48ec', '#c684ff', '#ecc8ff', '#ffffff'],
}
const ROUE: Element[] = ['feu', 'foudre', 'vie', 'froid', 'terre', 'mort']
const ROUE_RAYON = 72
const ROUE_SEUIL = 18
const ROUE_DELAI = 180
function quartier(dx: number, dy: number): Element | null {
  if (Math.hypot(dx, dy) < ROUE_SEUIL) return null
  const a = Math.atan2(dy, dx) + Math.PI / 2
  return ROUE[((Math.round(a / (Math.PI / 3)) % 6) + 6) % 6]
}

// ---------------------------------------------------------------- les poses
/** Les ennemis : la marche du gobelin, et une attaque (l'élan, le coup qui tombe à `C.attaque`, la garde). */
const MARCHE = marche.poses as [number, Pose, string?][]
const MARCHE_D = MARCHE[MARCHE.length - 1][0]
const GARDE: Pose = { crouch: 2, lean: 2, fx: 6, fy: -16, bx: -4, by: -15, ffx: 4, fbx: -5 }
const ELAN: Pose = { ...GARDE, lean: -4, crouch: 3, fx: -6, fy: -24, bx: -6, by: -18 }
const COUP: Pose = { ...GARDE, lean: 7, crouch: 4, fx: 17, fy: -19, bx: 2, by: -16, ffx: 9, fbx: -3 }
const ATTAQUE: [number, Pose, string?][] = [[0, GARDE], [C.attaque - 0.3, ELAN], [C.attaque - 0.1, COUP, 'snap'], [C.attaque, GARDE]]
const PERSONNAGE: Partial<Record<TypeEnnemi, Personnage>> = { orc: ORC, golem: GOLEM, squelette: SQUELETTE }

// ---------------------------------------------------------------- nos petits effets
/** L'éclair : des traits brisés d'un point au suivant, blancs sur une lueur jaune, qui tremblent et s'éteignent. */
const ECLAIR: Module = {
  meta: { name: 'Éclair', size: [W, H], origin: [0, 0], duration: 0.4, loop: false, fps: 30, bg: 'dark', options: { palette: N.PAL.electric, points: [] as number[][], seed: 1 } },
  draw(p: Peintre, t: number, o: { palette: string[]; points: number[][]; seed: number }) {
    const Cp = N.fit(o.palette, 7)
    const k = (1 - t / 0.4) * (Math.floor(t * 60) % 3 === 0 ? 0.45 : 1)
    const R = new N.Rng(o.seed + Math.floor(t * 40))
    for (let i = 1; i < o.points.length; i++) {
      const [x0, y0] = o.points[i - 1]
      const [x1, y1] = o.points[i]
      const pts = N.bolt(R, x0, y0, x1, y1, { jag: 0.16, depth: 4 })
      p.polyline(pts, Cp[4], k * 0.7)
      p.polyline(pts.map(([x, y]) => [x, y - 1]), N.WHITE, k)
      p.glowLine(x0, y0, x1, y1, 6, Cp[4], 0.35 * k)
    }
    for (const [x, y] of o.points.slice(1)) p.glow(x, y, 10, Cp[5], 0.5 * k)
  },
}
/** Le rocher : une pierre qui tourne, un côté à l'ombre ; de feu, elle rougeoie et sème des braises. */
const ROCHER: Module = {
  meta: { name: 'Rocher', size: [24, 24], origin: [12, 12], duration: 1, loop: true, fps: 30, bg: 'dark', options: { palette: N.PAL.stone, feu: 0, seed: 1 } },
  draw(p: Peintre, t: number, o: { palette: string[]; feu: number }) {
    const Cp = N.fit(o.palette, 8)
    const F = N.fit(N.PAL.fire, 8)
    const a = t * 9
    p.circle(0, 0, 3.4, Cp[3])
    p.arc(0, 0, 3.2, 1.6, a, a + 2.2, Cp[1])
    p.arc(0, 0, 3.2, 1.2, a + Math.PI, a + Math.PI + 1.6, Cp[5])
    p.px(Math.cos(a + 0.5) * 1.5, Math.sin(a + 0.5) * 1.5, Cp[6])
    if (o.feu > 0) {
      p.arc(0, 0, 3.6, 0.8, a + 2.2, a + 4.2, F[5], 0.8)
      p.glow(0, 0, 12, F[4], 0.5)
      for (let i = 0; i < 3; i++) p.dot(-4 - ((t * 60 + i * 7) % 12), Math.sin(t * 20 + i) * 2, F[6 - i], 0.8)
    }
  },
}

type Chiffre = { x: number; y: number; texte: string; couleur: string; vie: number }
type Visuel = { horloge: number; flash: number; flamme: Instance | null }

export function monterMagicien(racine: HTMLElement, build: string): void {
  document.documentElement.classList.add('magicien-page')
  racine.classList.add('magicien')
  const dpr = Math.min(2, window.devicePixelRatio || 1)

  function el<K extends keyof HTMLElementTagNameMap>(tag: K, classe: string, texte = ''): HTMLElementTagNameMap[K] {
    const n = document.createElement(tag)
    n.className = classe
    n.textContent = texte
    return n
  }

  // ---------------------------------------------------------------- le chrome
  const haut = el('div', 'magicien-haut')
  const vagueTexte = el('span', '')
  const jauge = el('div', 'magicien-jauge')
  const remplie = el('div', 'magicien-jauge-remplie')
  jauge.append(remplie)
  const abattusTexte = el('span', '')
  haut.append(vagueTexte, jauge, abattusTexte)

  const scene = el('div', 'magicien-scene')
  const canvas = document.createElement('canvas')
  canvas.className = 'magicien-canvas'
  canvas.width = W
  canvas.height = H
  const g = canvas.getContext('2d')!
  scene.append(canvas)

  const bas = el('div', 'magicien-bas')
  const file = el('div', 'magicien-file')
  const orbes = [0, 1, 2].map(() => {
    const o = el('div', 'magicien-orbe')
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    svg.setAttribute('viewBox', '0 0 24 24')
    svg.append(document.createElementNS('http://www.w3.org/2000/svg', 'path'))
    o.append(svg)
    return o
  })
  const nom = el('div', 'magicien-nom')
  const vider = el('button', 'magicien-vider', '✕')
  vider.type = 'button'
  file.append(...orbes, nom, vider)
  bas.append(file)

  const surcouche = document.createElement('canvas')
  surcouche.className = 'magicien-surcouche'
  const gs = surcouche.getContext('2d')!
  const ecran = el('div', 'magicien-ecran')
  const pied = el('div', 'magicien-build', `magicien · build ${build}`)
  racine.append(haut, scene, bas, surcouche, ecran, pied)

  // ---------------------------------------------------------------- l'état
  let e: EtatMagie = nouvellePartie(C, 1)
  let enJeu = false
  let rejouableA = 0
  let record = lireRecord(CLE_RECORD)
  const vue = { gauche: OX / S, droite: (W - OX) / S, haut: 10, bas: 10, cote: true }
  const frame = N.createFrame(W, H)
  const img = g.createImageData(W, H)
  const fond = N.backdrop('ground', W, H, SOL)
  /** Les effets en cours, et ceux qu'il faut arrêter à l'heure dite (les boucles : souffle, rayon). */
  let effets: Instance[] = []
  const arrets: { fx: Instance; t: number }[] = []
  const elementaires = new Map<number, Instance>()
  const rochers = new Map<number, Instance>()
  const visuels = new Map<number, Visuel>()
  const chiffres: Chiffre[] = []
  let banniere: { texte: string; t: number } | null = null
  let flashRouge = 0
  let secousse = 0
  /** Le magicien : où il regarde, quand il a lancé, quand il a été touché, le sort en attente (le temps de pointer). */
  let regard = 1
  let incanteA = -10
  let toucheA = -10
  let aLancer: { t: number; x: number } | null = null
  let dernierElement: Element = 'feu'
  let zoom = 2

  const sx = (u: number) => OX + u * S
  const teinteDe = (hex: string) => (255 << 24) | (parseInt(hex.slice(5, 7), 16) << 16) | (parseInt(hex.slice(3, 5), 16) << 8) | parseInt(hex.slice(1, 3), 16)

  function effet(id: string, o: Record<string, unknown>): Instance | null {
    const mod = FX[id]
    if (mod === undefined) return null
    try {
      const fx = N.createFx(mod, o)
      effets.push(fx)
      return fx
    } catch {
      return null
    }
  }
  function effetLocal(mod: Module, o: Record<string, unknown>): Instance {
    const fx = N.createFx(mod, o)
    effets.push(fx)
    return fx
  }

  function cadrer(): void {
    const largeur = scene.clientWidth
    const hauteur = scene.clientHeight
    zoom = Math.max(1, Math.min(6, Math.floor(Math.min(largeur / W, hauteur / H))))
    canvas.style.width = `${W * zoom}px`
    canvas.style.height = `${H * zoom}px`
    surcouche.width = Math.round(racine.clientWidth * dpr)
    surcouche.height = Math.round(racine.clientHeight * dpr)
  }
  /** Un point de la scène (px du tampon) vers l'écran (px CSS). */
  function versEcran(x: number, y: number): { x: number; y: number } {
    const r = canvas.getBoundingClientRect()
    return { x: r.left + x * zoom, y: r.top + y * zoom }
  }

  function montrerEcran(titre: string, texte: string, go: string): void {
    ecran.replaceChildren(el('h1', '', titre), el('p', '', texte), el('p', 'magicien-go', go))
    ecran.hidden = false
  }
  montrerEcran(
    'Le magicien',
    `Les gobelins arrivent par la droite. Posez le doigt : une roue apparaît. Glissez vers un élément et relâchez pour l’ajouter au sort (trois au plus) ; touchez sans glisser pour lancer. La terre jette un rocher, la foudre saute d’ennemi en ennemi, la mort transperce en ligne, le feu et le froid soufflent, la vie soigne — et avec un autre élément, elle invoque un petit élémentaire. Les opposés s’annulent.${record > 0 ? ` Record : vague ${record}.` : ''}`,
    'Touchez pour commencer',
  )

  function lancerLaPartie(): void {
    e = nouvellePartie(C, (Date.now() % 100000) + 1)
    enJeu = true
    effets = []
    arrets.length = 0
    elementaires.clear()
    rochers.clear()
    visuels.clear()
    chiffres.length = 0
    banniere = null
    aLancer = null
    regard = 1
    ecran.hidden = true
    majFile()
  }

  // ---------------------------------------------------------------- les commandes
  function composer(k: Element): void {
    if (!enJeu) return
    ouvrirLeSon()
    for (const x of ajouter(C, e, k)) vivre(x)
    majFile()
  }
  vider.addEventListener('click', () => {
    viderLaFile(e)
    majFile()
  })
  /** Le sort part vers ce point de l'écran : seule compte sa droite ou sa gauche par rapport au magicien. */
  function lancerVers(clientX: number): void {
    if (e.file.length === 0) {
      chiffres.push({ x: OX, y: SOL - 46, texte: 'Glissez vers un élément', couleur: '#d8d2e6', vie: 0 })
      return
    }
    if (!pret(e) || aLancer !== null) return
    const r = canvas.getBoundingClientRect()
    const u = ((clientX - r.left) / zoom - OX) / S
    regard = u >= 0 ? 1 : -1
    incanteA = e.t
    aLancer = { t: e.t + INCANTE, x: u === 0 ? 1 : u }
    const premier = e.file.find((k) => k === 'feu' || k === 'froid') ?? e.file[0]
    chiffres.push({ x: OX, y: SOL - 46, texte: nomDuSort(e.file).replace(/ ×\d$/, ''), couleur: TEINTE[premier], vie: 0 })
  }
  let geste: { id: number; x: number; y: number; dx: number; dy: number; element: Element | null; t0: number } | null = null
  racine.addEventListener('pointerdown', (ev) => {
    if ((ev.target as HTMLElement).closest('button') !== null) return
    if (!enJeu) {
      if (performance.now() / 1000 >= rejouableA) lancerLaPartie()
      return
    }
    ev.preventDefault()
    ouvrirLeSon()
    if (geste !== null) return
    geste = { id: ev.pointerId, x: ev.clientX, y: ev.clientY, dx: 0, dy: 0, element: null, t0: performance.now() }
    racine.setPointerCapture(ev.pointerId)
  })
  racine.addEventListener('pointermove', (ev) => {
    if (geste === null || ev.pointerId !== geste.id) return
    geste.dx = ev.clientX - geste.x
    geste.dy = ev.clientY - geste.y
    geste.element = quartier(geste.dx, geste.dy)
  })
  const finDuGeste = (ev: PointerEvent, annule: boolean) => {
    if (geste === null || ev.pointerId !== geste.id) return
    const g0 = geste
    geste = null
    if (annule) return
    if (g0.element !== null) composer(g0.element)
    else lancerVers(g0.x)
  }
  racine.addEventListener('pointerup', (ev) => finDuGeste(ev, false))
  racine.addEventListener('pointercancel', (ev) => finDuGeste(ev, true))
  window.addEventListener('keydown', (ev) => {
    if (ev.repeat) return
    const i = Number(ev.key) - 1
    if (i >= 0 && i < ELEMENTS.length) composer(ELEMENTS[i])
    else if (ev.key === 'Enter' || ev.key === ' ') {
      const r = canvas.getBoundingClientRect()
      lancerVers(r.left + (OX + 40) * zoom)
    }
  })

  function majFile(): void {
    orbes.forEach((o, i) => {
      const k = e.file[i]
      o.className = k === undefined ? 'magicien-orbe' : 'magicien-orbe magicien-orbe-pleine'
      o.style.background = k === undefined ? '' : `radial-gradient(circle at 35% 35%, #fff, ${TEINTE[k]} 55%)`
      o.style.boxShadow = k === undefined ? '' : `0 0 0.6rem ${TEINTE[k]}`
      o.querySelector('path')!.setAttribute('d', k === undefined ? '' : ICONE[k])
    })
    const sort = nomDuSort(e.file)
    const recette = ELEMENTS.filter((k) => e.file.includes(k))
      .map((k) => {
        const combien = e.file.filter((x) => x === k).length
        return `${NOM[k]}${combien > 1 ? ` ×${combien}` : ''}`
      })
      .join(' + ')
    nom.replaceChildren(el('span', 'magicien-nom-titre', sort === '' ? 'Glissez vers un élément' : sort), el('small', '', sort === '' ? 'Touchez sans glisser pour lancer' : [recette, ...effetsDuSort(C, e.file)].join(' · ')))
    vider.hidden = e.file.length === 0
  }

  // ---------------------------------------------------------------- vivre les événements
  function visuel(id: number): Visuel {
    let v = visuels.get(id)
    if (v === undefined) visuels.set(id, (v = { horloge: Math.random() * MARCHE_D, flash: -10, flamme: null }))
    return v
  }
  function vivre(ev: Evenement): void {
    switch (ev.type) {
      case 'element':
        sonElement(ev.element, e.file.length)
        break
      case 'annule':
        sonAnnule()
        chiffres.push({ x: OX, y: SOL - 46, texte: `${NOM[ev.element]} annule ${NOM[ev.contre]}`, couleur: '#d8d2e6', vie: 0 })
        break
      case 'pleine':
        sonPleine()
        chiffres.push({ x: OX, y: SOL - 46, texte: 'File pleine', couleur: '#d8d2e6', vie: 0 })
        break
      case 'souffle': {
        const feu = ev.n.feu > 0
        dernierElement = feu ? 'feu' : 'froid'
        const fx = effet(feu ? 'fire/fire-breath' : 'ice/frost-breath', { x: OX + MAIN.x * regard, y: SOL + MAIN.y, flip: regard < 0 })
        if (fx !== null) arrets.push({ fx, t: e.t + 0.55 })
        sonSouffle(feu)
        break
      }
      case 'eclair': {
        dernierElement = 'foudre'
        const points = ev.points.map((p, i) => (i === 0 ? [OX + MAIN.x * regard, SOL + MAIN.y] : [sx(p.x), SOL - 14]))
        effetLocal(ECLAIR, { x: 0, y: 0, points, seed: Math.floor(e.t * 1000) })
        for (const [x, y] of points.slice(1)) effet('lightning/zap-hit', { x, y, flip: regard < 0 })
        sonEclair()
        break
      }
      case 'rayon': {
        dernierElement = 'mort'
        const fx = effet('arcane/arcane-beam', { x: OX + MAIN.x * regard, y: SOL + MAIN.y, flip: regard < 0, palette: PALETTE.mort })
        if (fx !== null) arrets.push({ fx, t: e.t + 0.5 })
        sonRayon()
        break
      }
      case 'halo':
        dernierElement = 'vie'
        effet('holy/heal', { x: OX, y: SOL })
        sonHalo()
        break
      case 'soigne':
        chiffres.push({ x: OX, y: SOL - 40, texte: `+${ev.pv}`, couleur: TEINTE.vie, vie: 0 })
        break
      case 'invoque': {
        const fx = effet('fire/spirit-flame', { x: sx(ev.x), y: SOL, palette: PALETTE[ev.element] })
        if (fx !== null) elementaires.set(ev.id, fx)
        sonInvoque(ev.element)
        break
      }
      case 'coup':
        effet('impacts/hit-spark', { x: sx(ev.a.x), y: SOL - 12, flip: ev.de.x > ev.a.x, palette: PALETTE[ev.element] })
        break
      case 'disparait': {
        const fx = elementaires.get(ev.id)
        if (fx !== undefined) fx.stop()
        elementaires.delete(ev.id)
        sonDisparait()
        break
      }
      case 'jet': {
        dernierElement = 'terre'
        const fx = effetLocal(ROCHER, { x: OX + MAIN.x * regard, y: SOL + MAIN.y, feu: ev.n.feu })
        rochers.set(ev.id, fx)
        sonJet()
        break
      }
      case 'impact': {
        effet('impacts/crit-hit', { x: sx(ev.x), y: SOL - 8, palette: ev.n.feu > 0 ? N.PAL.fire : N.PAL.earth })
        sonImpact(ev.n.feu > 0)
        break
      }
      case 'touche': {
        const v = visuel(ev.id)
        v.flash = e.t
        if (ev.degats > 0) effet('impacts/hit-spark', { x: sx(ev.x), y: SOL - 12, flip: regard < 0, palette: PALETTE[dernierElement] })
        chiffres.push({ x: sx(ev.x), y: SOL - 36, texte: ev.resiste && ev.degats === 0 ? 'Insensible' : ev.resiste ? `${ev.degats} (résiste)` : `${ev.degats}`, couleur: ev.resiste ? '#aaa' : '#fff', vie: 0 })
        sonTouche()
        break
      }
      case 'gele':
        chiffres.push({ x: sx(e.ennemis.find((x) => x.id === ev.id)?.x ?? 0), y: SOL - 44, texte: 'Gelé', couleur: TEINTE.froid, vie: 0 })
        break
      case 'mort': {
        const v = visuels.get(ev.id)
        if (v?.flamme) v.flamme.stop()
        visuels.delete(ev.id)
        effet('spawn/poof', { x: sx(ev.x), y: SOL })
        sonMort()
        break
      }
      case 'tour':
        flashRouge = 1
        secousse = 1
        toucheA = e.t
        effet('impacts/hit-spark', { x: OX + 4, y: SOL - 20, flip: true, palette: N.PAL.blood })
        chiffres.push({ x: OX, y: SOL - 46, texte: `−${ev.degats}`, couleur: '#ff6a6a', vie: 0 })
        sonTour()
        break
      case 'vague':
        banniere = { texte: `Vague ${ev.vague}`, t: e.t }
        sonVague()
        break
      case 'perdu':
        enJeu = false
        rejouableA = performance.now() / 1000 + 1
        if (e.vague > record) {
          record = e.vague
          ecrireRecord(CLE_RECORD, record)
        }
        sonPerdu()
        montrerEcran('Le magicien est tombé', `Vague ${e.vague} · ${e.abattus} abattus${record === e.vague ? ' · nouveau record !' : ` · record : vague ${record}`}`, 'Touchez pour rejouer')
        break
      default:
        break
    }
  }

  // ---------------------------------------------------------------- dessiner
  function dessinerLesEnnemis(dt: number): void {
    const ordre = [...e.ennemis].sort((a, b) => b.x - a.x)
    for (const en of ordre) {
      const v = visuel(en.id)
      const m = C.ennemis[en.type]
      const X = Math.round(sx(en.x))
      const gele = e.t < en.geleA
      const auPied = Math.hypot(en.x, en.y) <= C.tour.rayon + m.rayon + 0.01
      // l'esprit de feu est une flamme, pas un corps
      if (en.type === 'esprit') {
        if (v.flamme === null) {
          v.flamme = effet('fire/spirit-flame', { x: X, y: SOL, palette: N.PAL.fire, seed: en.id })
        }
        if (v.flamme !== null) v.flamme.options.x = X
        continue
      }
      const phase = auPied ? Math.min(C.attaque, Math.max(0, C.attaque - (en.coupA - e.t))) : 0
      if (!auPied && !gele) v.horloge += dt * ((m.vitesse * (1 - (en.ralenti?.part ?? 0))) / 7)
      let teinte = 0
      let k = 0
      if (gele) (teinte = teinteDe('#a8e8ff')), (k = 0.7)
      else if (en.brule !== null && e.t < en.brule.fin) (teinte = teinteDe('#ff7a2a')), (k = 0.25 + 0.15 * Math.sin(e.t * 30))
      else if (en.affaibli !== null && e.t < en.affaibli.fin) (teinte = teinteDe('#c07cff')), (k = 0.3)
      else if (en.ralenti !== null && e.t < en.ralenti.fin) (teinte = teinteDe('#8fe0ff')), (k = 0.2)
      if (e.t - v.flash < 0.07) (teinte = 0xffffffff), (k = 0.85)
      let hauteur = 40
      if (en.type === 'gobelin') {
        // la bestiole : la marche à la phase de son horloge (deux pas par boucle), ou le coup à la phase du prochain coup
        const p = N.painterFor(frame)
        p.place(X, SOL, true)
        peindreGobelin(p, { t: e.t + en.id * 0.37, marche: auPied ? null : (v.horloge % PAS_GOBELIN) / PAS_GOBELIN, attaque: auPied ? (gele ? 0 : phase / C.attaque) : null, teinte, k }, PAL_GOBELIN)
        hauteur = 26
      } else {
        const perso = PERSONNAGE[en.type] ?? ORC
        const pose: Pose = auPied ? N.poseAt(ATTAQUE, gele ? 0 : phase) : N.poseAt(MARCHE, v.horloge % MARCHE_D)
        peindreOmbre(frame, pose, perso, X, SOL)
        peindrePose(frame, pose, perso, X, SOL, true, teinte, k)
        hauteur = Math.round(40 * perso.echelle)
      }
      // la barre de vie, quand il a été touché
      if (en.pv < en.pvMax) {
        const haut = SOL - hauteur - 4
        const largeur = 12
        for (let i = 0; i < largeur; i++) frame.color[haut * W + X - 6 + i] = i < Math.round((largeur * en.pv) / en.pvMax) ? 0xff3ad64a : 0xff202028
      }
    }
  }

  function dessinerLeMagicien(): void {
    const p = N.painterFor(frame)
    p.place(OX, SOL, regard < 0)
    peindreMagicien(p, { t: e.t, incante: e.t - incanteA < INCANTATION ? e.t - incanteA : null, touche: e.t - toucheA < 0.3 }, PAL_MAGICIEN)
  }

  /** La roue sous le doigt (celle de la tour), sur la surcouche. */
  const ICONE_PATH = Object.fromEntries(ELEMENTS.map((k) => [k, new Path2D(ICONE[k])])) as Record<Element, Path2D>
  function dessinerLaRoue(g0: { x: number; y: number; dx: number; dy: number; element: Element | null }, entree: number): void {
    const cx = g0.x * dpr
    const cy = g0.y * dpr
    const R = ROUE_RAYON * dpr * (0.7 + 0.3 * Math.max(0, entree))
    const r0 = ROUE_SEUIL * dpr
    gs.globalAlpha = Math.max(0.35, entree)
    ROUE.forEach((k, i) => {
      const a = -Math.PI / 2 + (i * Math.PI) / 3
      const vise = g0.element === k
      gs.beginPath()
      gs.arc(cx, cy, vise ? R * 1.08 : R, a - Math.PI / 6, a + Math.PI / 6)
      gs.arc(cx, cy, r0, a + Math.PI / 6, a - Math.PI / 6, true)
      gs.closePath()
      gs.fillStyle = vise ? TEINTE[k] : `${TEINTE[k]}55`
      gs.fill()
      gs.strokeStyle = vise ? '#ffffff' : TEINTE[k]
      gs.lineWidth = (vise ? 2.5 : 1.2) * dpr
      gs.stroke()
      const taille = (vise ? 30 : 24) * dpr
      gs.save()
      gs.translate(cx + Math.cos(a) * R * 0.62 - taille / 2, cy + Math.sin(a) * R * 0.62 - taille / 2)
      gs.scale(taille / 24, taille / 24)
      gs.strokeStyle = vise ? '#1e1038' : '#ffffff'
      gs.lineWidth = 2.2
      gs.lineCap = 'round'
      gs.lineJoin = 'round'
      gs.stroke(ICONE_PATH[k])
      gs.restore()
    })
    gs.fillStyle = 'rgba(255, 255, 255, 0.9)'
    gs.beginPath()
    gs.arc(cx + g0.dx * dpr, cy + g0.dy * dpr, 5 * dpr, 0, Math.PI * 2)
    gs.fill()
    if (g0.element !== null) {
      gs.textAlign = 'center'
      gs.font = `800 ${18 * dpr}px 'Baloo 2', sans-serif`
      gs.fillStyle = TEINTE[g0.element]
      gs.strokeStyle = 'rgba(0, 0, 0, 0.75)'
      gs.lineWidth = 4 * dpr
      gs.strokeText(NOM[g0.element], cx, cy - R - 14 * dpr)
      gs.fillText(NOM[g0.element], cx, cy - R - 14 * dpr)
    }
    gs.globalAlpha = 1
  }

  // ---------------------------------------------------------------- la boucle
  let avant = performance.now()
  let accumule = 0
  function image(ms: number): void {
    const dtMs = Math.min(ms - avant, 250)
    avant = ms
    const dt = dtMs / 1000
    if (enJeu) {
      accumule += dt
      while (accumule >= PAS && enJeu) {
        accumule -= PAS
        for (const x of avancer(C, e, PAS, vue)) vivre(x)
        // le sort en attente part quand le bâton pointe
        if (aLancer !== null && e.t >= aLancer.t) {
          const cible = aLancer
          aLancer = null
          for (const x of lancer(C, e, { x: cible.x, y: 0 })) vivre(x)
          majFile()
        }
      }
    } else accumule = 0
    // les effets suivent le monde : les élémentaires, les rochers ; les boucles s'arrêtent à l'heure
    for (const inv of e.elementaires) {
      const fx = elementaires.get(inv.id)
      if (fx !== undefined) fx.options.x = Math.round(sx(inv.x))
    }
    for (const r of e.rochers) {
      const fx = rochers.get(r.id)
      if (fx !== undefined) {
        fx.options.x = Math.round(sx(r.x))
        fx.options.y = SOL - 10 - Math.round(10 * Math.sin((Math.PI * Math.min(1, Math.abs(r.x) / Math.max(1, Math.abs(r.cible.x)))) || 0))
      }
    }
    for (const [id, fx] of rochers) if (!e.rochers.some((r) => r.id === id)) (fx.stop(), rochers.delete(id))
    for (let i = arrets.length - 1; i >= 0; i--) if (e.t >= arrets[i].t) (arrets[i].fx.stop(), arrets.splice(i, 1))
    for (const fx of effets) {
      try {
        fx.update(dt)
      } catch {
        // un effet qui casse ne casse pas le jeu
      }
    }
    effets = effets.filter((fx) => !fx.done())

    // la scène
    N.clearFrame(frame)
    for (const fx of effets) fx.draw(frame, 'back')
    dessinerLesEnnemis(enJeu ? dt : 0)
    dessinerLeMagicien()
    for (const fx of effets) fx.draw(frame, 'front')
    N.composite(frame, img.data, fond)
    g.putImageData(img, 0, 0)
    secousse = Math.max(0, secousse - dt / 0.3)
    canvas.style.transform = secousse > 0 ? `translate(${(Math.random() - 0.5) * secousse * 6}px, ${(Math.random() - 0.5) * secousse * 4}px)` : ''

    // la surcouche : la roue, les chiffres, la bannière, le voile rouge
    gs.clearRect(0, 0, surcouche.width, surcouche.height)
    for (let i = chiffres.length - 1; i >= 0; i--) {
      chiffres[i].vie += dtMs
      if (chiffres[i].vie >= 800) chiffres.splice(i, 1)
    }
    gs.textAlign = 'center'
    for (const c of chiffres) {
      const u = c.vie / 800
      const p = versEcran(c.x, c.y)
      gs.globalAlpha = 1 - u * u
      gs.font = `800 ${(c.texte.length > 4 ? 13 : 17) * dpr}px 'Baloo 2', sans-serif`
      gs.fillStyle = c.couleur
      gs.strokeStyle = 'rgba(0, 0, 0, 0.8)'
      gs.lineWidth = 3 * dpr
      gs.strokeText(c.texte, p.x * dpr, (p.y - u * 14) * dpr)
      gs.fillText(c.texte, p.x * dpr, (p.y - u * 14) * dpr)
    }
    gs.globalAlpha = 1
    if (banniere !== null) {
      const u = (e.t - banniere.t) / 1.6
      if (u >= 1) banniere = null
      else {
        const p = versEcran(W / 2, 28)
        gs.globalAlpha = u < 0.2 ? u / 0.2 : 1 - (u - 0.2) / 0.8
        gs.font = `800 ${26 * dpr}px Grenze, serif`
        gs.fillStyle = '#ffd27a'
        gs.strokeStyle = 'rgba(60, 30, 10, 0.9)'
        gs.lineWidth = 4 * dpr
        gs.strokeText(banniere.texte, p.x * dpr, p.y * dpr)
        gs.fillText(banniere.texte, p.x * dpr, p.y * dpr)
        gs.globalAlpha = 1
      }
    }
    if (geste !== null && (ms - geste.t0 >= ROUE_DELAI || Math.hypot(geste.dx, geste.dy) >= ROUE_SEUIL)) dessinerLaRoue(geste, Math.min(1, (ms - geste.t0 - ROUE_DELAI) / 120 + 0.5))
    flashRouge = Math.max(0, flashRouge - dt / 0.3)
    if (flashRouge > 0) {
      const w = surcouche.width
      const h = surcouche.height
      const grad = gs.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.3, w / 2, h / 2, Math.max(w, h) * 0.75)
      grad.addColorStop(0, 'rgba(255, 40, 40, 0)')
      grad.addColorStop(1, `rgba(255, 40, 40, ${0.45 * flashRouge})`)
      gs.fillStyle = grad
      gs.fillRect(0, 0, w, h)
    }

    haut.hidden = !enJeu && e.phase !== 'perdu'
    bas.hidden = !enJeu
    vagueTexte.textContent = `Vague ${Math.max(1, e.vague)}`
    remplie.style.width = `${(100 * e.pv) / C.tour.pv}%`
    abattusTexte.textContent = `☠ ${e.abattus}`
    requestAnimationFrame(image)
  }
  majFile()
  cadrer()
  new ResizeObserver(cadrer).observe(scene)
  window.addEventListener('resize', cadrer)
  requestAnimationFrame(image)
}

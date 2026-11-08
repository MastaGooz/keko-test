/**
 * LE BANC PIXELFX — `?pixelfx` (Keko, 08/11 : « je veux juste voir ce que ça
 * donne visuellement, fais un proto test qui permet d'en utiliser »).
 *
 * `pixelfx` (patch-gg/pixelfx, MIT) : 244 effets en pixel art écrits en code,
 * sans sprite. Ce banc les liste tous, par catégorie ; on en touche un, il se
 * joue en grand dans le lecteur du haut, pixelisé, en boucle ; on peut changer
 * sa palette, son fond, sa graine, le retourner, le ralentir.
 *
 * Le lecteur refait ce que fait la galerie du dépôt : une scène aux dimensions
 * de `meta.size` (plus une marge), l'effet posé à `meta.origin`, un tampon de
 * pixels (`createFrame`), l'effet mis à jour à pas fixes (1 / `meta.fps`), ses
 * deux couches dessinées puis composées sur un fond (`backdrop`), et l'image
 * posée sur le canvas que le CSS agrandit sans lisser.
 *
 * **C'est la première dépendance de code du projet** : la règle « pas de
 * dépendance » valait pour les assets et les moteurs ; ici c'est du code MIT
 * installé depuis GitHub, à la demande de Keko, pour juger.
 */
import './pixelfx.css'
import * as noyau from 'pixelfx'
import { effects } from 'pixelfx/fx/index'
import { NOS_EFFETS } from './fx/keko/index.ts'

type Meta = {
  name?: string
  desc?: string
  size?: [number, number]
  origin?: [number, number]
  duration?: number
  loop?: boolean
  fps?: number
  bg?: string
  tags?: string[]
  options?: Record<string, unknown>
}
type Module = { meta?: Meta; create?: (o: Record<string, unknown>) => unknown }
type Instance = { t: number; update(dt: number): void; draw(frame: unknown, couche?: string): void; done(): boolean }
type Noyau = {
  createFrame(w: number, h: number): unknown
  clearFrame(f: unknown): unknown
  createFx(mod: Module, o: Record<string, unknown>): Instance
  createAct(mod: Module, o: Record<string, unknown>): Instance
  composite(f: unknown, sortie: Uint8ClampedArray, fond: Uint32Array | null): void
  backdrop(sorte: string, w: number, h: number, sol: number): Uint32Array
  PAL?: Record<string, string[]>
}
const N = noyau as unknown as Noyau
/** Nos effets d'abord (la catégorie « keko »), puis les 244 du dépôt. */
const EFFETS = { ...NOS_EFFETS, ...effects } as Record<string, Module>

const FONDS = ['dark', 'ground', 'sky', 'light', 'black', 'none']
/** Des palettes à nous, en plus de celles du dépôt (s'il en exporte) : pour voir un effet aux couleurs de Néon. */
const PALETTES: Record<string, string[]> = {
  'néon cyan': ['#06202a', '#0a5566', '#0f9bb3', '#19f2ff', '#7df8ff', '#bffbff', '#e6feff', '#ffffff'],
  'néon magenta': ['#2a0622', '#66104f', '#b31c8f', '#ff2bd6', '#ff7de6', '#ffbff2', '#ffe6fa', '#ffffff'],
  or: ['#2a1d06', '#664a10', '#b3871c', '#ffd23a', '#ffe27d', '#fff0bf', '#fff9e6', '#ffffff'],
  ...(N.PAL ?? {}),
}

export function monterPixelfx(racine: HTMLElement, build: string): void {
  document.documentElement.classList.add('pixelfx-page')
  racine.classList.add('pixelfx')

  function el<K extends keyof HTMLElementTagNameMap>(tag: K, classe: string, texte = ''): HTMLElementTagNameMap[K] {
    const n = document.createElement(tag)
    n.className = classe
    n.textContent = texte
    return n
  }
  function bouton(classe: string, texte: string, action: () => void): HTMLButtonElement {
    const b = el('button', classe, texte)
    b.type = 'button'
    b.addEventListener('click', action)
    return b
  }

  // ---------------------------------------------------------------- le lecteur

  const lecteur = el('div', 'pixelfx-lecteur')
  const canvas = document.createElement('canvas')
  canvas.className = 'pixelfx-canvas'
  const g = canvas.getContext('2d')!
  const nom = el('div', 'pixelfx-nom')
  const desc = el('p', 'pixelfx-desc')
  const reglages = el('div', 'pixelfx-reglages')
  const choixPalette = el('select', '')
  choixPalette.append(new Option('sa palette', ''), ...Object.keys(PALETTES).map((k) => new Option(k, k)))
  const choixFond = el('select', '')
  choixFond.append(new Option('son fond', ''), ...FONDS.map((k) => new Option(`fond ${k}`, k)))
  const choixVitesse = el('select', '')
  choixVitesse.append(new Option('vitesse ×1', '1'), new Option('×0,5', '0.5'), new Option('×0,25', '0.25'), new Option('×2', '2'))
  const retourner = bouton('', 'Retourner', () => {
    flip = !flip
    retourner.classList.toggle('actif', flip)
    rejouer()
  })
  const graine = bouton('', 'Autre graine', () => {
    seed = 1 + Math.floor(Math.random() * 9999)
    rejouer()
  })
  const pause = bouton('', 'Pause', () => {
    enMarche = !enMarche
    pause.textContent = enMarche ? 'Pause' : 'Reprendre'
  })
  reglages.append(choixPalette, choixFond, choixVitesse, retourner, graine, pause)
  lecteur.append(canvas, nom, desc, reglages)

  const ids = Object.keys(EFFETS)
  let id = ids.includes('keko/frappe-du-niveau') ? 'keko/frappe-du-niveau' : ids[0]
  let flip = false
  let seed = 0
  let enMarche = true
  let scene: { W: number; H: number; x: number; y: number; frame: unknown; img: ImageData; fond: Uint32Array | null; meta: Required<Pick<Meta, 'fps' | 'loop' | 'duration'>> & Meta; acte: boolean } | null = null
  let instance: Instance | null = null
  let attente = 0
  let acc = 0

  function metaDe(mod: Module): Required<Pick<Meta, 'fps' | 'loop' | 'duration'>> & Meta {
    return { fps: 30, bg: 'dark', loop: false, duration: 1, tags: [], options: {}, ...(mod.meta ?? {}) }
  }

  /** La scène d'un effet : ses dimensions, sa place, son fond ; puis la première instance. */
  function charger(): void {
    const mod = EFFETS[id]
    const meta = metaDe(mod)
    const acte = id.startsWith('moves/')
    const [w, h] = meta.size ?? [160, 120]
    const [ox, oy] = meta.origin ?? [Math.floor(w / 2), Math.floor(h / 2)]
    // Une scène un peu plus large que l'effet, au format 16/10 au moins.
    const marge = 1.15
    const W = Math.max(Math.ceil(w * marge), Math.ceil(h * marge * 1.6))
    const H = Math.max(Math.ceil(h * marge), Math.ceil(W / 1.6))
    const x = Math.floor((W - w) / 2) + ox
    const y = Math.floor((H - h) / 2) + oy
    canvas.width = W
    canvas.height = H
    const sorteDeFond = choixFond.value === '' ? (meta.bg ?? 'dark') : choixFond.value
    const fond = sorteDeFond === 'none' ? null : N.backdrop(sorteDeFond, W, H, y)
    scene = { W, H, x, y, frame: N.createFrame(W, H), img: g.createImageData(W, H), fond, meta, acte }
    nom.replaceChildren(document.createTextNode(meta.name ?? id), el('small', '', `${id} · ${w}×${h} · ${meta.loop ? 'boucle' : `${meta.duration} s`} · ${meta.fps} i/s`))
    desc.textContent = meta.desc ?? ''
    rejouer()
  }

  function rejouer(): void {
    if (scene === null) return
    const mod = EFFETS[id]
    const options: Record<string, unknown> = { x: scene.x, y: scene.y, flip }
    if (seed > 0) options.seed = seed
    if (choixPalette.value !== '') options.palette = PALETTES[choixPalette.value]
    try {
      instance = (scene.acte ? N.createAct : N.createFx)(mod, options)
    } catch (erreur) {
      instance = null
      desc.textContent = `Cet effet n'a pas pu se créer : ${String(erreur)}`
    }
    attente = 0
    acc = 0
  }

  choixPalette.addEventListener('change', rejouer)
  choixFond.addEventListener('change', charger)

  let precedent = performance.now()
  function image(ms: number): void {
    const dt = Math.min(0.1, (ms - precedent) / 1000)
    precedent = ms
    if (scene !== null && instance !== null) {
      const pas = 1 / scene.meta.fps
      const vitesse = Number(choixVitesse.value) || 1
      if (enMarche) acc = Math.min(acc + dt * vitesse, 0.25)
      // L'effet fini se rejoue après un court silence.
      const fini = !scene.meta.loop && (scene.acte ? instance.done() : instance.t >= scene.meta.duration)
      if (fini) {
        attente += dt
        if (attente > 0.6) rejouer()
      } else {
        while (acc >= pas) {
          try {
            instance.update(pas)
          } catch {
            // Un effet qui casse ne casse pas le banc.
          }
          acc -= pas
        }
      }
      try {
        const f = N.clearFrame(scene.frame)
        if (scene.acte) instance.draw(f)
        else {
          instance.draw(f, 'back')
          instance.draw(f, 'front')
        }
        N.composite(f, scene.img.data, scene.fond)
        g.putImageData(scene.img, 0, 0)
      } catch {
        // Idem.
      }
    }
    requestAnimationFrame(image)
  }

  // ---------------------------------------------------------------- la liste

  const categories = [...new Set(ids.map((k) => k.split('/')[0]))]
  const barre = el('div', 'pixelfx-categories')
  const liste = el('div', 'pixelfx-liste')
  let categorie = 'tout'
  const boutonsDeCategorie = ['tout', ...categories].map((c) =>
    bouton(c === categorie ? 'actif' : '', c, () => {
      categorie = c
      for (const b of boutonsDeCategorie) b.classList.toggle('actif', b.textContent === c)
      remplirLaListe()
    }),
  )
  barre.append(...boutonsDeCategorie)

  function remplirLaListe(): void {
    liste.replaceChildren(
      ...ids
        .filter((k) => categorie === 'tout' || k.startsWith(`${categorie}/`))
        .map((k) => {
          const b = bouton(`pixelfx-effet${k === id ? ' actif' : ''}`, EFFETS[k].meta?.name ?? k, () => {
            id = k
            for (const x of liste.children) x.classList.toggle('actif', x === b)
            charger()
            window.scrollTo({ top: 0, behavior: 'smooth' })
          })
          b.append(el('small', '', k))
          return b
        }),
    )
  }
  remplirLaListe()

  const pied = el('div', 'pixelfx-build', `pixelfx · ${ids.length} effets · build ${build}`)
  racine.append(lecteur, barre, liste, pied)
  charger()
  requestAnimationFrame(image)
}

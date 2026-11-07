/**
 * LA TOUR DU MAGICIEN À L'ÉCRAN — `?magie`, un side project (Keko, 07/11 :
 * « une tour au milieu de l'écran, avec des ennemis qui approchent, et on
 * lance des sorts à la Magicka »). Vue de dessus : la tour au milieu du
 * terrain libre, le magicien dessus ; les ennemis arrivent de tous les bords.
 *
 * En bas, la FILE du sort (trois orbes, le nom de ce qu'elle lancerait) et
 * les six ÉLÉMENTS ; une tape sur le terrain lance le sort vers ce point.
 * Les orbes de la file tournent aussi autour du magicien. Au clavier : 1 à 6
 * pour les éléments, la souris pour viser.
 */
import './magie.css'
import { ajouter, avancer, effetsDuSort, ELEMENTS, formeDe, lancer, MAGIE as C, nomDuSort, nouvellePartie, pret, viderLaFile, type Element, type EtatMagie, type Evenement, type Forme, type Point, type TypeEnnemi } from '../../logic/magie/jeu.ts'
import { ecrireRecord, lireRecord, sprite } from '../invaders/commun.ts'
import { ouvrirLeSon, sonAnnule, sonEclair, sonElement, sonHalo, sonImpact, sonJet, sonMort, sonPerdu, sonPleine, sonRayon, sonSouffle, sonTouche, sonTour, sonVague } from './sons.ts'

const PAS = 1 / 60
/** La largeur de l'écran montre tant d'unités. */
const LARGEUR = 56
const CLE_RECORD = 'keko-magie-record'
/** Les cases du sol (chacune tire son décor de ses coordonnées). */
const CASE = 8

const TEINTE: Record<Element, string> = { feu: '#ff7a2a', froid: '#8fe0ff', foudre: '#ffe066', terre: '#c89a5a', vie: '#8cff9a', mort: '#c07cff' }
const NOM: Record<Element, string> = { feu: 'Feu', froid: 'Froid', foudre: 'Foudre', terre: 'Terre', vie: 'Vie', mort: 'Mort' }
/** Les icônes des éléments, tracées en SVG (24 × 24). */
const ICONE: Record<Element, string> = {
  feu: 'M12 3c1 4 5 5 5 10a5 5 0 0 1-10 0c0-3 2-4 2-6 2 1 3 3 3 3s-1-4 0-7z',
  froid: 'M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9M9 4.5l3 2 3-2M9 19.5l3-2 3 2',
  foudre: 'M13 3L5 14h6l-1 7 8-11h-6z',
  terre: 'M4 17l3-7 4-3 5 1 4 5-1 5-6 2-6-1z',
  vie: 'M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.5-7 10-7 10z',
  mort: 'M12 3a7 7 0 0 0-7 7c0 2.6 1.4 4.2 3 5.5V19h8v-3.5c1.6-1.3 3-2.9 3-5.5a7 7 0 0 0-7-7zM9.5 11h.01M14.5 11h.01M10.5 19v2M13.5 19v2',
}
/** L'icône d'un sort : sa forme (le rocher, l'éclair, le rayon, le souffle, le halo). */
const ICONE_DU_SORT: Record<Exclude<Forme, 'aucun'>, string> = {
  rocher: ICONE.terre,
  eclair: ICONE.foudre,
  rayon: 'M3 12h17M16 8l4 4-4 4M7 8l1 2M7 16l1-2',
  souffle: 'M3 12L20 5M3 12h18M3 12l17 7M20 5a14 14 0 0 1 0 14',
  halo: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 8v8M8 12h8',
}
/** L'élément dont la forme prend la couleur. */
const ELEMENT_DE_LA_FORME: Record<Exclude<Forme, 'aucun' | 'souffle'>, Element> = { rocher: 'terre', eclair: 'foudre', rayon: 'mort', halo: 'vie' }
const ID_ENNEMI: Record<TypeEnnemi, string> = { gobelin: 'heros-12', orc: 'heros-17', esprit: 'survivant', golem: 'monstre-0', squelette: 'squelette-4' }
const ID_MAGICIEN = 'heros-14'

function hache(x: number, y: number, sel: number): number {
  let h = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(sel, 2246822519)
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296
}

type Eclat = { x: number; y: number; vx: number; vy: number; vie: number; duree: number; couleur: string; taille: number }
type Chiffre = { x: number; y: number; texte: string; couleur: string; vie: number }
type Trace = { t: number; duree: number } & ({ sorte: 'souffle'; dir: Point; couleurs: string[] } | { sorte: 'eclair'; points: Point[]; couleur: string } | { sorte: 'impact'; x: number; y: number; rayon: number; couleur: string } | { sorte: 'rayon'; dir: Point; couleur: string } | { sorte: 'halo'; rayon: number })

/** La couleur dominante d'un sort, d'après ses éléments. */
function couleurDe(n: Record<Element, number>, repli: Element): string {
  const k = ELEMENTS.filter((x) => n[x] > 0 && x !== repli).sort((a, b) => n[b] - n[a])[0]
  return TEINTE[k ?? repli]
}

export function monterMagie(racine: HTMLElement, build: string): void {
  document.documentElement.classList.add('magie-page')
  racine.classList.add('magie')
  const canvas = document.createElement('canvas')
  canvas.className = 'magie-canvas'
  const g = canvas.getContext('2d')!

  function el<K extends keyof HTMLElementTagNameMap>(tag: K, classe: string, texte = ''): HTMLElementTagNameMap[K] {
    const n = document.createElement(tag)
    n.className = classe
    n.textContent = texte
    return n
  }

  const haut = el('div', 'magie-haut')
  const vagueTexte = el('span', '')
  const jauge = el('div', 'magie-jauge')
  const remplie = el('div', 'magie-jauge-remplie')
  jauge.append(remplie)
  const abattusTexte = el('span', '')
  haut.append(vagueTexte, jauge, abattusTexte)

  const bas = el('div', 'magie-bas')
  const file = el('div', 'magie-file')
  const orbes = [0, 1, 2].map(() => el('div', 'magie-orbe'))
  const nom = el('div', 'magie-nom')
  const iconeDuSort = el('div', 'magie-icone')
  const vider = el('button', 'magie-vider', '✕')
  vider.type = 'button'
  vider.setAttribute('aria-label', 'Vider la file')
  file.append(...orbes, iconeDuSort, nom, vider)
  const elements = el('div', 'magie-elements')
  for (const k of ELEMENTS) {
    const b = el('button', 'magie-element')
    b.type = 'button'
    b.style.setProperty('--teinte', TEINTE[k])
    const icone = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    icone.setAttribute('viewBox', '0 0 24 24')
    const trace = document.createElementNS('http://www.w3.org/2000/svg', 'path')
    trace.setAttribute('d', ICONE[k])
    icone.append(trace)
    b.append(icone, el('span', '', NOM[k]))
    b.addEventListener('pointerdown', (ev) => {
      ev.preventDefault()
      composer(k)
    })
    elements.append(b)
  }
  bas.append(file, elements)
  const ecran = el('div', 'magie-ecran')
  const pied = el('div', 'magie-build', `build ${build}`)
  racine.append(canvas, haut, bas, ecran, pied)

  let e: EtatMagie = nouvellePartie(C, 1)
  let enJeu = false
  let rejouableA = 0
  let record = lireRecord(CLE_RECORD)
  const eclats: Eclat[] = []
  const chiffres: Chiffre[] = []
  const traces: Trace[] = []
  /** L'instant où chaque ennemi a été touché (il blanchit). */
  const touches = new Map<number, number>()
  let flashRouge = 0
  let secousse = 0
  let banniere: { texte: string; t: number } | null = null
  /** Le magicien regarde vers son dernier sort. */
  let regard: 1 | -1 = 1
  let lanceA = -10

  const imageEnnemi = (t: TypeEnnemi) => sprite('perso-pixel', ID_ENNEMI[t], 'humain')
  const imageMagicien = () => sprite('perso-pixel', ID_MAGICIEN, 'humain')
  for (const k of Object.keys(ID_ENNEMI) as TypeEnnemi[]) imageEnnemi(k)
  imageMagicien()

  // ---------------------------------------------------------------- le cadre

  let dpr = 1
  let s = 1
  /** L'origine du monde (la tour) à l'écran, en pixels du canvas. */
  let ox = 0
  let oy = 0
  function cadrer(): void {
    dpr = Math.min(2, window.devicePixelRatio || 1)
    const w = window.innerWidth
    const h = window.innerHeight
    canvas.width = Math.round(w * dpr)
    canvas.height = Math.round(h * dpr)
    canvas.style.width = `${w}px`
    canvas.style.height = `${h}px`
    // La tour au milieu de ce qui est libre, entre la barre du haut et le panneau du bas.
    const hautPx = 44
    const basPx = bas.hidden ? 0 : bas.getBoundingClientRect().height || 170
    s = (Math.min(w, (h - hautPx - basPx) * 0.9) / LARGEUR) * dpr
    ox = canvas.width / 2
    oy = ((hautPx + (h - basPx)) / 2) * dpr
  }
  window.addEventListener('resize', cadrer)
  const sx = (x: number) => ox + x * s + secousseX
  const sy = (y: number) => oy + y * s + secousseY
  let secousseX = 0
  let secousseY = 0
  const vue = () => ({ gauche: ox / s, droite: (canvas.width - ox) / s, haut: oy / s, bas: (canvas.height - oy) / s })

  // ---------------------------------------------------------------- les écrans

  function montrerEcran(titre: string, texte: string, go: string): void {
    ecran.replaceChildren(el('div', 'magie-titre', titre), el('div', 'magie-texte', texte), el('div', 'magie-go', go))
    ecran.hidden = false
  }
  montrerEcran(
    'La tour du magicien',
    `Composez un sort avec les éléments du bas (trois au plus), puis touchez le terrain pour le lancer. La terre jette un rocher, la foudre saute d’ennemi en ennemi, la mort transperce en ligne, le feu et le froid soufflent, la vie soigne la tour. Les opposés s’annulent : feu et froid, foudre et terre, vie et mort.${record > 0 ? ` Record : vague ${record}.` : ''}`,
    'Touchez pour jouer',
  )

  function lancerLaPartie(): void {
    ouvrirLeSon()
    e = nouvellePartie(C, (Math.random() * 2 ** 32) >>> 0)
    enJeu = true
    ecran.hidden = true
    eclats.length = 0
    chiffres.length = 0
    traces.length = 0
    touches.clear()
    majFile()
  }

  // ---------------------------------------------------------------- les gestes

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

  canvas.addEventListener('pointerdown', (ev) => {
    if (!enJeu) {
      if (performance.now() / 1000 >= rejouableA) lancerLaPartie()
      return
    }
    ouvrirLeSon()
    const p = { x: (ev.clientX * dpr - ox) / s, y: (ev.clientY * dpr - oy) / s }
    if (e.file.length === 0) {
      chiffres.push({ x: p.x, y: p.y, texte: 'Choisissez des éléments', couleur: '#d8d2e6', vie: 0 })
      return
    }
    if (!pret(e)) return
    regard = p.x >= 0 ? 1 : -1
    lanceA = e.t
    // Le nom du sort s'affiche au-dessus de la tour, à sa couleur.
    const premier = e.file.find((k) => k === 'feu' || k === 'froid') ?? e.file[0]
    chiffres.push({ x: 0, y: -17, texte: nomDuSort(e.file).replace(/ ×\d$/, ''), couleur: TEINTE[premier], vie: 0 })
    for (const x of lancer(C, e, p)) vivre(x)
    majFile()
  })
  window.addEventListener('keydown', (ev) => {
    if (ev.repeat) return
    const i = Number(ev.key) - 1
    if (i >= 0 && i < ELEMENTS.length) composer(ELEMENTS[i])
  })

  /** La file en bas : trois orbes, le nom du sort ou la consigne. */
  function majFile(): void {
    orbes.forEach((o, i) => {
      const k = e.file[i]
      o.className = k === undefined ? 'magie-orbe' : 'magie-orbe magie-orbe-pleine'
      o.style.background = k === undefined ? '' : `radial-gradient(circle at 35% 35%, #fff, ${TEINTE[k]} 55%)`
    })
    const sort = nomDuSort(e.file)
    const forme = formeDe(e.file)
    iconeDuSort.hidden = forme === 'aucun'
    if (forme !== 'aucun') {
      // L'icône : la forme tracée à la couleur de son élément, remplie de celle qui la modifie.
      const n = (k: Element) => e.file.filter((x) => x === k).length
      const elementDuTrait: Element = forme === 'souffle' ? (n('feu') > 0 ? 'feu' : 'froid') : ELEMENT_DE_LA_FORME[forme]
      const trait = TEINTE[elementDuTrait]
      const modifie = (['feu', 'froid', 'mort', 'vie'] as Element[]).find((k) => n(k) > 0 && k !== elementDuTrait && !(forme === 'souffle' && (k === 'feu' || k === 'froid')))
      const ajout = modifie !== undefined ? TEINTE[modifie] : 'none'
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
      svg.setAttribute('viewBox', '0 0 24 24')
      const p = document.createElementNS('http://www.w3.org/2000/svg', 'path')
      p.setAttribute('d', ICONE_DU_SORT[forme])
      p.setAttribute('stroke', trait)
      p.setAttribute('fill', ajout)
      p.setAttribute('fill-opacity', '0.6')
      svg.append(p)
      iconeDuSort.replaceChildren(svg)
      iconeDuSort.style.boxShadow = `0 0 0.8rem ${ajout === 'none' ? trait : ajout}`
    }
    // La recette, puis ce que fera le sort.
    const recette = ELEMENTS.filter((k) => e.file.includes(k))
      .map((k) => {
        const combien = e.file.filter((x) => x === k).length
        return `${NOM[k]}${combien > 1 ? ` ×${combien}` : ''}`
      })
      .join(' + ')
    nom.replaceChildren(
      el('span', 'magie-nom-titre', sort === '' ? 'Choisissez jusqu’à trois éléments' : sort),
      el('small', '', sort === '' ? 'Les opposés s’annulent : feu et froid, foudre et terre, vie et mort' : [recette, ...effetsDuSort(C, e.file)].join(' · ')),
    )
    vider.hidden = e.file.length === 0
  }

  // ---------------------------------------------------------------- les effets

  function eclater(x: number, y: number, couleur: string, n: number, force: number): void {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2
      const v = force * (0.3 + Math.random() * 0.7)
      eclats.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, vie: 0, duree: 300 + Math.random() * 350, couleur, taille: 0.35 + Math.random() * 0.55 })
    }
  }
  function vibrer(ms: number): void {
    try {
      navigator.vibrate?.(ms)
    } catch {
      // Sans vibreur, rien.
    }
  }

  function vivre(ev: Evenement): void {
    switch (ev.type) {
      case 'element':
        sonElement(ev.element, e.file.length)
        break
      case 'annule':
        sonAnnule()
        chiffres.push({ x: 0, y: -14, texte: `${NOM[ev.element]} annule ${NOM[ev.contre].toLowerCase()}`, couleur: '#d8d2e6', vie: 0 })
        eclater(0, -10, '#d8d2e6', 10, 10)
        break
      case 'pleine':
        sonPleine()
        break
      case 'souffle': {
        sonSouffle(ev.n.feu > 0)
        const couleurs = ELEMENTS.filter((k) => ev.n[k] > 0).map((k) => TEINTE[k])
        traces.push({ sorte: 'souffle', dir: ev.dir, couleurs, t: e.t, duree: 0.4 })
        for (let i = 0; i < 26; i++) {
          const a = Math.atan2(ev.dir.y, ev.dir.x) + (Math.random() - 0.5) * C.cone.demiAngle * 2
          const v = 40 + Math.random() * 50
          eclats.push({ x: Math.cos(a) * 6, y: Math.sin(a) * 6, vx: Math.cos(a) * v, vy: Math.sin(a) * v, vie: 0, duree: 450, couleur: couleurs[i % couleurs.length], taille: 0.6 + Math.random() * 0.8 })
        }
        break
      }
      case 'eclair':
        sonEclair()
        traces.push({ sorte: 'eclair', points: ev.points, couleur: couleurDe(ev.n, 'foudre'), t: e.t, duree: 0.28 })
        break
      case 'rayon': {
        sonRayon()
        secousse = Math.max(secousse, 0.3)
        traces.push({ sorte: 'rayon', dir: ev.dir, couleur: couleurDe(ev.n, 'mort'), t: e.t, duree: 0.35 })
        // Des étincelles le long de la ligne.
        for (let i = 0; i < 16; i++) {
          const d = C.tour.rayon + Math.random() * (C.rayon.portee - C.tour.rayon)
          eclats.push({ x: ev.dir.x * d, y: ev.dir.y * d, vx: -ev.dir.y * (Math.random() - 0.5) * 30, vy: ev.dir.x * (Math.random() - 0.5) * 30, vie: 0, duree: 400, couleur: i % 3 === 0 ? '#ffffff' : TEINTE.mort, taille: 0.4 + Math.random() * 0.5 })
        }
        break
      }
      case 'halo':
        sonHalo()
        traces.push({ sorte: 'halo', rayon: C.vie.rayon, t: e.t, duree: 0.6 })
        for (let i = 0; i < 20; i++) {
          const a = Math.random() * Math.PI * 2
          const d = 4 + Math.random() * 6
          eclats.push({ x: Math.cos(a) * d, y: Math.sin(a) * d, vx: 0, vy: -8 - Math.random() * 8, vie: 0, duree: 600, couleur: i % 2 === 0 ? '#ffffff' : TEINTE.vie, taille: 0.4 + Math.random() * 0.5 })
        }
        break
      case 'soigne':
        chiffres.push({ x: 0, y: -12, texte: `+${ev.pv}`, couleur: TEINTE.vie, vie: 0 })
        break
      case 'jet':
        sonJet()
        break
      case 'impact':
        sonImpact(ev.rayon > C.rocher.rayon)
        secousse = Math.max(secousse, 0.5 + ev.n.terre * 0.2)
        traces.push({ sorte: 'impact', x: ev.x, y: ev.y, rayon: ev.rayon, couleur: couleurDe(ev.n, 'terre'), t: e.t, duree: 0.4 })
        eclater(ev.x, ev.y, couleurDe(ev.n, 'terre'), 18, 26)
        break
      case 'touche':
        sonTouche()
        touches.set(ev.id, e.t)
        chiffres.push({ x: ev.x, y: ev.y - 5, texte: ev.resiste && ev.degats === 0 ? 'Insensible' : String(ev.degats), couleur: ev.resiste ? '#b9b3c9' : '#ffffff', vie: 0 })
        break
      case 'gele': {
        const en = e.ennemis.find((x) => x.id === ev.id)
        if (en !== undefined) {
          chiffres.push({ x: en.x, y: en.y - 9, texte: 'Gelé !', couleur: TEINTE.froid, vie: 0 })
          eclater(en.x, en.y, '#e6f8ff', 12, 14)
        }
        break
      }
      case 'mort':
        sonMort()
        eclater(ev.x, ev.y, '#ffffff', 10, 18)
        break
      case 'tour':
        sonTour()
        vibrer(40)
        flashRouge = 1
        secousse = Math.max(secousse, 0.6)
        chiffres.push({ x: 0, y: -12, texte: `-${ev.degats}`, couleur: '#ff6a5a', vie: 0 })
        break
      case 'vague':
        sonVague()
        banniere = { texte: `Vague ${ev.vague}`, t: e.t }
        break
      case 'perdu': {
        sonPerdu()
        enJeu = false
        rejouableA = performance.now() / 1000 + 1.2
        const nouveau = e.vague > record
        if (nouveau) {
          record = e.vague
          ecrireRecord(CLE_RECORD, record)
        }
        setTimeout(() => montrerEcran('La tour est tombée', `Vague ${e.vague} · ${e.abattus} abattus. ${nouveau ? 'Nouveau record !' : `Record : vague ${record}.`}`, 'Touchez pour rejouer'), 800)
        break
      }
    }
  }

  // ---------------------------------------------------------------- le dessin

  function dessinerLeSol(): void {
    g.fillStyle = '#3b5a2c'
    g.fillRect(0, 0, canvas.width, canvas.height)
    const v = vue()
    const x0 = Math.floor(-v.gauche / CASE) - 1
    const x1 = Math.ceil(v.droite / CASE) + 1
    const y0 = Math.floor(-v.haut / CASE) - 1
    const y1 = Math.ceil(v.bas / CASE) + 1
    for (let i = x0; i <= x1; i++) {
      for (let j = y0; j <= y1; j++) {
        const u = hache(i, j, 1)
        if (u < 0.35) {
          g.fillStyle = u < 0.12 ? '#456a33' : '#355226'
          g.beginPath()
          g.arc(sx((i + hache(i, j, 2)) * CASE), sy((j + hache(i, j, 3)) * CASE), (0.6 + hache(i, j, 4) * 1.4) * s, 0, Math.PI * 2)
          g.fill()
        }
        if (u > 0.93) {
          // Une touffe de fleurs.
          g.fillStyle = hache(i, j, 5) < 0.5 ? '#e8d77a' : '#d98ac0'
          const fx = (i + 0.5) * CASE
          const fy = (j + 0.5) * CASE
          for (let k = 0; k < 3; k++) {
            g.beginPath()
            g.arc(sx(fx + k * 0.9 - 0.9), sy(fy + (k % 2) * 0.7), 0.35 * s, 0, Math.PI * 2)
            g.fill()
          }
        }
      }
    }
    // La place pavée autour de la tour.
    const place = g.createRadialGradient(sx(0), sy(0), C.tour.rayon * s, sx(0), sy(0), (C.tour.rayon + 10) * s)
    place.addColorStop(0, 'rgba(120, 104, 80, 0.85)')
    place.addColorStop(1, 'rgba(120, 104, 80, 0)')
    g.fillStyle = place
    g.beginPath()
    g.arc(sx(0), sy(0), (C.tour.rayon + 10) * s, 0, Math.PI * 2)
    g.fill()
  }

  function dessinerLaTour(): void {
    const r = C.tour.rayon * s
    const cx = sx(0)
    const cy = sy(0)
    g.fillStyle = 'rgba(0, 0, 0, 0.35)'
    g.beginPath()
    g.ellipse(cx + r * 0.15, cy + r * 0.25, r * 1.1, r * 1.05, 0, 0, Math.PI * 2)
    g.fill()
    // Les créneaux, puis le mur, puis la plateforme.
    g.fillStyle = '#8f8678'
    g.strokeStyle = '#4b453c'
    g.lineWidth = Math.max(1, 0.3 * s)
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2
      g.save()
      g.translate(cx + Math.cos(a) * r * 0.98, cy + Math.sin(a) * r * 0.98)
      g.rotate(a)
      g.fillRect(-0.9 * s, -1.1 * s, 1.8 * s, 2.2 * s)
      g.strokeRect(-0.9 * s, -1.1 * s, 1.8 * s, 2.2 * s)
      g.restore()
    }
    g.fillStyle = '#a39a8a'
    g.beginPath()
    g.arc(cx, cy, r, 0, Math.PI * 2)
    g.fill()
    g.stroke()
    g.fillStyle = '#7d7466'
    g.beginPath()
    g.arc(cx, cy, r * 0.74, 0, Math.PI * 2)
    g.fill()
    // Des joints de pierre.
    g.strokeStyle = 'rgba(60, 54, 46, 0.6)'
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + 0.3
      g.beginPath()
      g.moveTo(cx + Math.cos(a) * r * 0.74, cy + Math.sin(a) * r * 0.74)
      g.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r)
      g.stroke()
    }
  }

  /** Le magicien sur sa tour : le personnage, le chapeau, le bâton ; les orbes de la file tournent autour. */
  function dessinerLeMagicien(t: number): void {
    const img = imageMagicien()
    const taille = 9 * s
    const lance = e.t - lanceA < 0.25
    const cx = sx(0)
    const pieds = sy(2.4)
    if (img !== null) {
      g.save()
      g.translate(cx, pieds - (lance ? 0.6 * s : 0))
      g.scale(regard, 1 + Math.sin(t * 3) * 0.02)
      g.drawImage(img, -taille / 2, -taille * 0.92, taille, taille)
      g.restore()
    }
    const yt = pieds - taille * 0.8
    g.fillStyle = '#4b2a8a'
    g.strokeStyle = '#1e1038'
    g.lineWidth = Math.max(1, 0.2 * s)
    g.beginPath()
    g.ellipse(cx, yt, 3 * s, 0.75 * s, 0, 0, Math.PI * 2)
    g.fill()
    g.stroke()
    const plie = (Math.sin(t * 2.2) * 0.35 - 0.9) * regard
    g.beginPath()
    g.moveTo(cx - 2 * s, yt)
    g.quadraticCurveTo(cx - 0.3 * s, yt - 4 * s, cx + plie * s, yt - 5.5 * s)
    g.quadraticCurveTo(cx + 0.7 * s, yt - 3.5 * s, cx + 2 * s, yt)
    g.closePath()
    g.fill()
    g.stroke()
    // Le bâton, et sa pierre qui prend la couleur du sort.
    const bx = cx + regard * 2.8 * s
    g.strokeStyle = '#6b4424'
    g.lineWidth = 0.55 * s
    g.lineCap = 'round'
    g.beginPath()
    g.moveTo(cx + regard * 2.1 * s, pieds - 0.3 * s)
    g.lineTo(bx, pieds - taille * 1.0)
    g.stroke()
    const premier = e.file[0]
    g.fillStyle = premier !== undefined ? TEINTE[premier] : '#b8a8ff'
    g.shadowColor = g.fillStyle
    g.shadowBlur = (lance ? 4 : 1.5) * s
    g.beginPath()
    g.arc(bx, pieds - taille * 1.02, 0.8 * s, 0, Math.PI * 2)
    g.fill()
    g.shadowBlur = 0
    // Les orbes de la file, en ronde au-dessus de la tour.
    e.file.forEach((k, i) => {
      const a = t * 2.2 + (i * Math.PI * 2) / Math.max(1, e.file.length)
      const x = cx + Math.cos(a) * 4.4 * s
      const y = sy(-1) + Math.sin(a) * 1.8 * s - taille * 0.55
      g.fillStyle = TEINTE[k]
      g.shadowColor = TEINTE[k]
      g.shadowBlur = 2 * s
      g.beginPath()
      g.arc(x, y, 0.9 * s, 0, Math.PI * 2)
      g.fill()
      g.shadowBlur = 0
    })
  }

  function dessinerLesEnnemis(t: number): void {
    const tries = [...e.ennemis].sort((a, b) => a.y - b.y)
    for (const en of tries) {
      const m = C.ennemis[en.type]
      const img = imageEnnemi(en.type)
      const taille = m.rayon * 3 * s
      const x = sx(en.x)
      const y = sy(en.y)
      const gele = e.t < en.geleA
      // L'ombre ; l'aura de l'esprit de feu.
      g.fillStyle = 'rgba(0, 0, 0, 0.3)'
      g.beginPath()
      g.ellipse(x, y + m.rayon * 0.9 * s, m.rayon * 0.9 * s, m.rayon * 0.35 * s, 0, 0, Math.PI * 2)
      g.fill()
      if (en.type === 'esprit' || en.type === 'squelette') {
        // L'esprit de feu brûle ; le squelette traîne une brume verdâtre.
        const teinte = en.type === 'esprit' ? '255, 140, 40' : '140, 220, 120'
        const aura = g.createRadialGradient(x, y, 0, x, y, m.rayon * 1.8 * s)
        aura.addColorStop(0, `rgba(${teinte}, ${en.type === 'esprit' ? 0.55 : 0.35})`)
        aura.addColorStop(1, `rgba(${teinte}, 0)`)
        g.fillStyle = aura
        g.beginPath()
        g.arc(x, y, m.rayon * 1.8 * s, 0, Math.PI * 2)
        g.fill()
      }
      if (img !== null) {
        const pas = gele ? 0 : Math.abs(Math.sin(t * 9 + en.id)) * 0.5 * s
        g.save()
        g.translate(x, y + m.rayon * s - pas)
        g.scale(en.x > 0 ? -1 : 1, 1)
        // Le squelette : le même générateur, délavé en os.
        if (en.type === 'squelette') g.filter = 'grayscale(1) brightness(1.5) contrast(1.1)'
        g.drawImage(img, -taille / 2, -taille * 0.92, taille, taille)
        g.filter = 'none'
        const touche = touches.get(en.id)
        if (touche !== undefined && e.t - touche < 0.12) {
          g.globalCompositeOperation = 'lighter'
          g.drawImage(img, -taille / 2, -taille * 0.92, taille, taille)
        }
        g.restore()
      }
      if (gele) {
        g.fillStyle = 'rgba(170, 225, 255, 0.5)'
        g.strokeStyle = 'rgba(230, 248, 255, 0.9)'
        g.lineWidth = Math.max(1, 0.25 * s)
        g.beginPath()
        g.roundRect(x - taille * 0.45, y + m.rayon * s - taille * 0.95, taille * 0.9, taille * 0.98, 0.6 * s)
        g.fill()
        g.stroke()
      } else if (en.ralenti !== null) {
        g.fillStyle = 'rgba(143, 224, 255, 0.28)'
        g.beginPath()
        g.arc(x, y, m.rayon * 1.2 * s, 0, Math.PI * 2)
        g.fill()
      }
      if (en.affaibli !== null) {
        // Affaibli par la mort : un cerne violet qui palpite.
        g.strokeStyle = `rgba(192, 124, 255, ${0.5 + Math.sin(t * 8) * 0.25})`
        g.lineWidth = Math.max(1, 0.3 * s)
        g.beginPath()
        g.arc(x, y + m.rayon * 0.9 * s, m.rayon * 1.1 * s, 0, Math.PI * 2)
        g.stroke()
      }
      if (en.brule !== null && Math.random() < 0.35) eclats.push({ x: en.x + (Math.random() - 0.5) * m.rayon, y: en.y - m.rayon * 0.5, vx: 0, vy: -9, vie: 0, duree: 380, couleur: Math.random() < 0.5 ? '#ffb030' : '#ff6a2a', taille: 0.5 })
      if (en.pv < en.pvMax) {
        const L = m.rayon * 2.2 * s
        g.fillStyle = 'rgba(0, 0, 0, 0.6)'
        g.fillRect(x - L / 2, y - m.rayon * 1.7 * s - taille * 0.35, L, 0.6 * s)
        g.fillStyle = '#ff5a4a'
        g.fillRect(x - L / 2, y - m.rayon * 1.7 * s - taille * 0.35, (L * Math.max(0, en.pv)) / en.pvMax, 0.6 * s)
      }
    }
  }

  function dessinerLesRochers(): void {
    for (const r of e.rochers) {
      const couleur = r.n.feu > 0 ? '#ff8a3a' : r.n.froid > 0 ? '#bfeaff' : '#8a6a44'
      const rayon = (1.3 + r.n.terre * 0.5) * s
      g.fillStyle = couleur
      g.shadowColor = r.n.feu + r.n.froid > 0 ? couleur : 'transparent'
      g.shadowBlur = 2 * s
      g.beginPath()
      g.arc(sx(r.x), sy(r.y), rayon, 0, Math.PI * 2)
      g.fill()
      g.shadowBlur = 0
      g.fillStyle = 'rgba(0, 0, 0, 0.25)'
      g.beginPath()
      g.arc(sx(r.x) + rayon * 0.3, sy(r.y) + rayon * 0.3, rayon * 0.5, 0, Math.PI * 2)
      g.fill()
    }
  }

  function dessinerLesTraces(): void {
    for (let i = traces.length - 1; i >= 0; i--) {
      const tr = traces[i]
      const u = (e.t - tr.t) / tr.duree
      if (u >= 1 || u < 0) {
        if (u >= 1) traces.splice(i, 1)
        continue
      }
      g.globalAlpha = 1 - u
      if (tr.sorte === 'souffle') {
        const a = Math.atan2(tr.dir.y, tr.dir.x)
        const portee = C.cone.portee * (0.5 + u * 0.5) * s
        const grad = g.createRadialGradient(sx(0), sy(0), 4 * s, sx(0), sy(0), portee)
        grad.addColorStop(0, tr.couleurs[0])
        grad.addColorStop(1, `${tr.couleurs[tr.couleurs.length - 1]}00`)
        g.fillStyle = grad
        g.beginPath()
        g.moveTo(sx(0), sy(0))
        g.arc(sx(0), sy(0), portee, a - C.cone.demiAngle, a + C.cone.demiAngle)
        g.closePath()
        g.fill()
      } else if (tr.sorte === 'eclair') {
        g.strokeStyle = '#ffffff'
        g.shadowColor = tr.couleur
        g.shadowBlur = 3 * s
        g.lineWidth = 0.6 * s
        g.lineJoin = 'round'
        g.beginPath()
        for (let k = 0; k < tr.points.length - 1; k++) {
          const p = tr.points[k]
          const q = tr.points[k + 1]
          if (k === 0) g.moveTo(sx(p.x), sy(p.y))
          // Un trait brisé, qui tremble à chaque image.
          for (let j = 1; j <= 5; j++) {
            const v = j / 5
            const bruit = j === 5 ? 0 : (Math.random() - 0.5) * 3
            g.lineTo(sx(p.x + (q.x - p.x) * v - (q.y - p.y) * 0.05 * bruit), sy(p.y + (q.y - p.y) * v + (q.x - p.x) * 0.05 * bruit))
          }
        }
        g.stroke()
        g.strokeStyle = tr.couleur
        g.lineWidth = 0.25 * s
        g.stroke()
        g.shadowBlur = 0
      } else if (tr.sorte === 'rayon') {
        // Le rayon de mort : un trait large et sombre, un cœur blanc, qui part de la tour.
        const a = Math.atan2(tr.dir.y, tr.dir.x)
        const x1 = sx(Math.cos(a) * C.tour.rayon)
        const y1 = sy(Math.sin(a) * C.tour.rayon)
        const x2 = sx(Math.cos(a) * C.rayon.portee)
        const y2 = sy(Math.sin(a) * C.rayon.portee)
        g.lineCap = 'round'
        g.strokeStyle = tr.couleur
        g.shadowColor = tr.couleur
        g.shadowBlur = 4 * s
        g.lineWidth = C.rayon.largeur * 2 * (1 - u * 0.5) * s
        g.beginPath()
        g.moveTo(x1, y1)
        g.lineTo(x2, y2)
        g.stroke()
        g.strokeStyle = '#ffffff'
        g.lineWidth = 0.8 * (1 - u) * s
        g.stroke()
        g.shadowBlur = 0
      } else if (tr.sorte === 'halo') {
        // Le halo de vie : un disque vert qui s'étend autour de la tour, puis s'efface.
        const r = tr.rayon * (0.3 + u * 0.7) * s
        const grad = g.createRadialGradient(sx(0), sy(0), r * 0.5, sx(0), sy(0), r)
        grad.addColorStop(0, 'rgba(140, 255, 154, 0)')
        grad.addColorStop(1, 'rgba(140, 255, 154, 0.55)')
        g.fillStyle = grad
        g.beginPath()
        g.arc(sx(0), sy(0), r, 0, Math.PI * 2)
        g.fill()
        g.strokeStyle = TEINTE.vie
        g.lineWidth = 0.5 * s
        g.stroke()
      } else {
        g.strokeStyle = tr.couleur
        g.lineWidth = (1 - u) * 1.2 * s
        g.beginPath()
        g.arc(sx(tr.x), sy(tr.y), tr.rayon * (0.4 + u * 0.8) * s, 0, Math.PI * 2)
        g.stroke()
      }
      g.globalAlpha = 1
    }
  }

  // ---------------------------------------------------------------- la boucle

  let avant = performance.now()
  let accumule = 0
  function image(ms: number): void {
    const dt = Math.min(ms - avant, 250)
    avant = ms
    if (enJeu) {
      accumule += dt / 1000
      while (accumule >= PAS && enJeu) {
        accumule -= PAS
        for (const x of avancer(C, e, PAS, vue())) vivre(x)
      }
    } else accumule = 0
    for (let i = eclats.length - 1; i >= 0; i--) {
      const p = eclats[i]
      p.vie += dt
      p.x += (p.vx * dt) / 1000
      p.y += (p.vy * dt) / 1000
      p.vx *= 0.94
      p.vy *= 0.94
      if (p.vie >= p.duree) eclats.splice(i, 1)
    }
    for (let i = chiffres.length - 1; i >= 0; i--) {
      chiffres[i].vie += dt
      if (chiffres[i].vie >= 700) chiffres.splice(i, 1)
    }
    flashRouge = Math.max(0, flashRouge - dt / 300)
    secousse = Math.max(0, secousse - dt / 300)
    secousseX = (Math.random() - 0.5) * secousse * 1.5 * s
    secousseY = (Math.random() - 0.5) * secousse * 1.5 * s

    const t = ms / 1000
    dessinerLeSol()
    dessinerLaTour()
    dessinerLesTraces()
    dessinerLesEnnemis(t)
    dessinerLesRochers()
    dessinerLeMagicien(t)
    for (const p of eclats) {
      g.globalAlpha = 1 - p.vie / p.duree
      g.fillStyle = p.couleur
      g.beginPath()
      g.arc(sx(p.x), sy(p.y), p.taille * s, 0, Math.PI * 2)
      g.fill()
    }
    g.globalAlpha = 1
    g.textAlign = 'center'
    g.strokeStyle = 'rgba(0, 0, 0, 0.75)'
    g.lineWidth = 0.5 * s
    for (const c of chiffres) {
      const u = c.vie / 700
      g.globalAlpha = 1 - u * u
      g.font = `800 ${(c.texte.length > 4 ? 2.2 : 3) * s}px 'Baloo 2', sans-serif`
      g.fillStyle = c.couleur
      const y = sy(c.y) - u * 4 * s
      g.strokeText(c.texte, sx(c.x), y)
      g.fillText(c.texte, sx(c.x), y)
    }
    g.globalAlpha = 1
    if (banniere !== null) {
      const u = (e.t - banniere.t) / 1.6
      if (u >= 1) banniere = null
      else {
        g.globalAlpha = u < 0.2 ? u / 0.2 : 1 - (u - 0.2) / 0.8
        g.font = `800 ${7 * s}px Grenze, serif`
        g.fillStyle = '#ffd27a'
        g.strokeStyle = 'rgba(60, 30, 10, 0.9)'
        g.lineWidth = 0.8 * s
        g.strokeText(banniere.texte, sx(0), sy(-22))
        g.fillText(banniere.texte, sx(0), sy(-22))
        g.globalAlpha = 1
      }
    }
    if (flashRouge > 0) {
      const w = canvas.width
      const h = canvas.height
      const grad = g.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.3, w / 2, h / 2, Math.max(w, h) * 0.75)
      grad.addColorStop(0, 'rgba(255, 40, 40, 0)')
      grad.addColorStop(1, `rgba(255, 40, 40, ${0.45 * flashRouge})`)
      g.fillStyle = grad
      g.fillRect(0, 0, w, h)
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
  requestAnimationFrame(image)
  // Le panneau du bas change la place de la tour : on recadre quand il apparaît.
  new ResizeObserver(cadrer).observe(bas)
}

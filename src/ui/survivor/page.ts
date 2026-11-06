/**
 * LE SURVIVOR À L'ÉCRAN — `?survivor`, un side project. D'abord un héros seul
 * (Keko, 06/11 : « pour voir ce que ça donne niveau contrôle »), puis « fun,
 * rajoute le reste » : les ennemis, les armes, les gemmes, les niveaux
 * (`logic/survivor/partie.ts`). Un canvas, la caméra sur le héros, un sol sans
 * bord ; l'accueil, la barre du haut, les choix et la fin sont du DOM.
 *
 * Au doigt (ou à la souris, bouton enfoncé) : le manche flottant naît où l'on
 * pose le doigt. Au clavier : les flèches ou ZQSD / WASD. `&controle=suivre`
 * essaie l'autre contrôle : le héros marche vers le doigt.
 */
import './survivor.css'
import { centreQuiSuit, directionDuManche, SURVIVOR, type Vecteur } from '../../logic/survivor/jeu.ts'
import {
  ARMES,
  armeDe,
  avancerPartie,
  choisir,
  estArme,
  nouvellePartie,
  orbesDe,
  PARTIE as C,
  PASSIFS,
  pvMaxDe,
  rangArme,
  rangPassif,
  xpPourNiveau,
  type CleChoix,
  type EtatPartie,
  type EvenementPartie,
  type TypeEnnemi,
} from '../../logic/survivor/partie.ts'
import { ecrireRecord, lireRecord, sprite } from '../invaders/commun.ts'
import { ouvrirLeSon, sonBlesse, sonCoffre, sonEclair, sonElite, sonFouet, sonGemme, sonMort, sonNiveau, sonPerdu, sonTir, sonTouche } from './sons.ts'

const PAS = 1000 / 60
/** Le petit côté de l'écran montre 90 unités. */
const VUE = 90
/** La taille du héros à l'écran, en unités. */
const TAILLE_HEROS = 13
/** Le sol est fait de cases : chacune tire son décor de ses coordonnées. */
const CASE = 9
const CLE_RECORD = 'keko-survivor-record'

/** Les ennemis sont des personnages du générateur, en pixel art comme le héros, choisis sur une planche pour ne pas lui ressembler (aucun n'est orange). */
const ID_ENNEMI: Record<TypeEnnemi, string> = { chauve: 'heros-14', goule: 'heros-12', loup: 'monstre-0', brute: 'heros-17', elite: 'heros-16' }
const COULEUR_ENNEMI: Record<TypeEnnemi, string> = { chauve: '#5ab8ff', goule: '#8fd16a', loup: '#d8c08a', brute: '#a07aff', elite: '#ffd27a' }

/** Un hachage entier de deux coordonnées et d'un sel, entre 0 et 1 : le même sol à chaque passage. */
function hache(x: number, y: number, sel: number): number {
  let h = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(sel, 2246822519)
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296
}

function duree(s: number): string {
  const m = Math.floor(s / 60)
  return `${m}:${String(Math.floor(s % 60)).padStart(2, '0')}`
}

type Eclat = { x: number; y: number; vx: number; vy: number; vie: number; duree: number; couleur: string; taille: number }
type Chiffre = { x: number; y: number; texte: string; vie: number }
type Trace = { vie: number; duree: number; ev: Extract<EvenementPartie, { type: 'fouet' | 'eclair' }> }
type Onde = { x: number; y: number; vie: number; duree: number; rayon: number; couleur: string }

export function monterSurvivor(racine: HTMLElement, build: string): void {
  document.documentElement.classList.add('survivor-page')
  racine.classList.add('survivor')
  const canvas = document.createElement('canvas')
  canvas.className = 'survivor-canvas'
  const suivre = new URLSearchParams(location.search).get('controle') === 'suivre'

  // La barre du haut : l'expérience, le niveau, le temps, les abattus.
  const barre = document.createElement('div')
  barre.className = 'survivor-barre'
  const jauge = document.createElement('div')
  jauge.className = 'survivor-xp'
  const remplie = document.createElement('div')
  remplie.className = 'survivor-xp-remplie'
  jauge.append(remplie)
  const infos = document.createElement('div')
  infos.className = 'survivor-infos'
  const niveauTexte = document.createElement('span')
  const tempsTexte = document.createElement('span')
  tempsTexte.className = 'survivor-temps'
  const abattusTexte = document.createElement('span')
  infos.append(niveauTexte, tempsTexte, abattusTexte)
  barre.append(jauge, infos)

  const ecran = document.createElement('div')
  ecran.className = 'survivor-ecran'
  const pied = document.createElement('div')
  pied.className = 'survivor-build'
  pied.textContent = `build ${build}`
  racine.append(canvas, barre, ecran, pied)
  const g = canvas.getContext('2d')!

  let e: EtatPartie = nouvellePartie(C, 1)
  let enJeu = false
  let perduA = 0
  let record = lireRecord(CLE_RECORD)
  const eclats: Eclat[] = []
  const chiffres: Chiffre[] = []
  const traces: Trace[] = []
  const ondes: Onde[] = []
  let flashRouge = 0
  let flashOr = 0
  let secousse = 0
  let prochainePoussiere = 0

  const heroImage = () => sprite('perso-pixel', 'survivant', 'humain')
  const imageEnnemi = (t: TypeEnnemi) => sprite('perso-pixel', ID_ENNEMI[t], 'humain')
  heroImage()
  for (const t of Object.keys(ID_ENNEMI) as TypeEnnemi[]) imageEnnemi(t)

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
  const vue = () => ({ demiL: canvas.width / 2 / echelle, demiH: canvas.height / 2 / echelle })

  // ---------------------------------------------------------------- les écrans

  function lancer(): void {
    ouvrirLeSon()
    e = nouvellePartie(C, (Math.random() * 2 ** 32) >>> 0)
    enJeu = true
    eclats.length = 0
    chiffres.length = 0
    traces.length = 0
    ondes.length = 0
    prochainePoussiere = 0
    montrerLEcran()
  }

  function ligne(classe: string, texte: string): HTMLDivElement {
    const d = document.createElement('div')
    d.className = classe
    d.textContent = texte
    return d
  }

  /** Ce qu'un choix dit de lui : son nom, son effet, nouveau ou le niveau qu'il atteint. */
  function carteDuChoix(k: CleChoix, i: number): HTMLButtonElement {
    const b = document.createElement('button')
    b.type = 'button'
    b.className = 'survivor-choix'
    let nom: string, effet: string, rang: string
    if (k === 'soin') {
      nom = 'Repas'
      effet = `Rend ${C.soin} PV`
      rang = ''
    } else if (estArme(k)) {
      const r = rangArme(e, k)
      nom = ARMES[k].nom
      effet = ARMES[k].effet
      rang = r === 0 ? 'Nouvelle arme' : `Niveau ${r + 1}`
    } else {
      const r = rangPassif(e, k)
      nom = PASSIFS[k].nom
      effet = PASSIFS[k].effet
      rang = r === 0 ? 'Nouveau' : `Niveau ${r + 1}`
    }
    b.append(ligne('survivor-choix-nom', nom), ligne('survivor-choix-effet', effet))
    if (rang !== '') b.append(ligne('survivor-choix-rang', rang))
    b.addEventListener('click', () => {
      choisir(C, e, i)
      montrerLEcran()
    })
    return b
  }

  let phaseMontree = ''
  function montrerLEcran(): void {
    phaseMontree = enJeu ? e.phase : 'accueil'
    ecran.replaceChildren()
    ecran.className = 'survivor-ecran'
    barre.hidden = !enJeu
    if (enJeu && e.phase === 'jeu') {
      ecran.hidden = true
      return
    }
    ecran.hidden = false
    if (enJeu && e.phase === 'choix') {
      manche = null
      ecran.classList.add('survivor-ecran-choix')
      const offre = document.createElement('div')
      offre.className = 'survivor-offre'
      e.offre.forEach((k, i) => offre.append(carteDuChoix(k, i)))
      ecran.append(ligne('survivor-sous-titre', `Niveau ${e.niveau}`), ligne('survivor-consigne', 'Choisissez une amélioration'), offre)
      return
    }
    if (!enJeu) {
      ecran.append(
        ligne('survivor-titre', 'Survivor'),
        ligne('survivor-record', record > 0 ? `Record : ${duree(record)}` : suivre ? 'Posez le doigt : le héros marche vers lui' : "Posez le doigt n'importe où et glissez"),
        ligne('survivor-go', 'Touchez pour jouer'),
      )
      return
    }
    ecran.append(
      ligne('survivor-titre', 'Le héros est tombé'),
      ligne('survivor-score', duree(e.t)),
      ligne('survivor-record', `Niveau ${e.niveau} · ${e.abattus} abattus${e.t >= record ? ' · nouveau record' : ` · record ${duree(record)}`}`),
      ligne('survivor-go', 'Touchez pour rejouer'),
    )
  }
  montrerLEcran()

  // ---------------------------------------------------------------- les gestes

  /** Le manche : son centre et le doigt, en pixels CSS ; `null` quand rien n'est posé. */
  let manche: { id: number; centre: Vecteur; doigt: Vecteur } | null = null
  const touches = new Set<string>()

  canvas.addEventListener('pointerdown', (ev) => {
    if (!enJeu || (e.phase === 'perdu' && performance.now() - perduA > 900)) lancer()
    if (e.phase !== 'jeu' || manche !== null) return
    canvas.setPointerCapture(ev.pointerId)
    const p = { x: ev.clientX, y: ev.clientY }
    manche = { id: ev.pointerId, centre: p, doigt: p }
  })
  canvas.addEventListener('pointermove', (ev) => {
    if (manche === null || ev.pointerId !== manche.id) return
    const doigt = { x: ev.clientX, y: ev.clientY }
    manche = { id: manche.id, centre: suivre ? manche.centre : centreQuiSuit(SURVIVOR, manche.centre, doigt), doigt }
  })
  const lever = (ev: PointerEvent) => {
    if (manche !== null && ev.pointerId === manche.id) manche = null
  }
  canvas.addEventListener('pointerup', lever)
  canvas.addEventListener('pointercancel', lever)
  ecran.addEventListener('pointerdown', () => {
    if (!enJeu || (e.phase === 'perdu' && performance.now() - perduA > 900)) lancer()
  })
  window.addEventListener('keydown', (ev) => {
    touches.add(ev.key.toLowerCase())
    if (!enJeu || (e.phase === 'perdu' && performance.now() - perduA > 900)) lancer()
  })
  window.addEventListener('keyup', (ev) => touches.delete(ev.key.toLowerCase()))
  window.addEventListener('blur', () => {
    touches.clear()
    manche = null
  })

  /** Ce que veut le joueur en ce moment : une direction de longueur 0 à 1. */
  function directionVoulue(): Vecteur {
    if (manche !== null) {
      if (!suivre) return directionDuManche(SURVIVOR, manche.doigt.x - manche.centre.x, manche.doigt.y - manche.centre.y)
      // Le héros marche vers le point du monde sous le doigt (le héros est au centre de l'écran).
      const dx = (manche.doigt.x - window.innerWidth / 2) * dpr
      const dy = (manche.doigt.y - window.innerHeight / 2) * dpr
      return directionDuManche(SURVIVOR, (dx / echelle) * 4, (dy / echelle) * 4)
    }
    const x = (touches.has('arrowright') || touches.has('d') ? 1 : 0) - (touches.has('arrowleft') || touches.has('q') || touches.has('a') ? 1 : 0)
    const y = (touches.has('arrowdown') || touches.has('s') ? 1 : 0) - (touches.has('arrowup') || touches.has('z') || touches.has('w') ? 1 : 0)
    return { x, y }
  }

  // ---------------------------------------------------------------- ce qui arrive

  function eclater(x: number, y: number, couleur: string, n: number, force: number): void {
    for (let i = 0; i < n && eclats.length < 400; i++) {
      const a = Math.random() * Math.PI * 2
      const v = force * (0.4 + Math.random())
      eclats.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, vie: 0, duree: 250 + Math.random() * 350, couleur: Math.random() < 0.3 ? '#ffffff' : couleur, taille: 0.5 + Math.random() * 0.7 })
    }
  }

  function vivre(ev: EvenementPartie): void {
    switch (ev.type) {
      case 'touche':
        if (chiffres.length < 50) chiffres.push({ x: ev.x + (Math.random() - 0.5) * 3, y: ev.y - 3, texte: `${Math.round(ev.degats)}`, vie: 0 })
        sonTouche()
        break
      case 'mort':
        eclater(ev.x, ev.y, COULEUR_ENNEMI[ev.ennemi], ev.ennemi === 'elite' ? 40 : 8, ev.ennemi === 'elite' ? 40 : 22)
        if (ev.ennemi === 'elite') {
          ondes.push({ x: ev.x, y: ev.y, vie: 0, duree: 500, rayon: 22, couleur: '#ffd27a' })
          secousse = Math.max(secousse, 1.5)
        }
        sonMort()
        break
      case 'blesse':
        flashRouge = 1
        secousse = Math.max(secousse, 0.8)
        sonBlesse()
        try {
          navigator.vibrate?.(30)
        } catch {
          // Pas de vibreur : rien.
        }
        break
      case 'gemme':
        sonGemme()
        break
      case 'coffre':
        flashOr = 1
        ondes.push({ x: e.heros.x, y: e.heros.y, vie: 0, duree: 600, rayon: 30, couleur: '#ffd27a' })
        sonCoffre()
        break
      case 'niveau':
        flashOr = Math.max(flashOr, 0.7)
        ondes.push({ x: e.heros.x, y: e.heros.y, vie: 0, duree: 500, rayon: 20, couleur: '#9fe8ff' })
        sonNiveau()
        break
      case 'elite':
        sonElite()
        break
      case 'tir':
        sonTir()
        break
      case 'fouet':
        traces.push({ vie: 0, duree: 220, ev })
        sonFouet()
        break
      case 'eclair':
        traces.push({ vie: 0, duree: 280, ev })
        ondes.push({ x: ev.x, y: ev.y, vie: 0, duree: 300, rayon: ev.rayon * 2, couleur: '#c7e8ff' })
        sonEclair()
        break
      case 'perdu':
        perduA = performance.now()
        eclater(e.heros.x, e.heros.y, '#ff6b6b', 40, 35)
        if (e.t > record) {
          record = e.t
          ecrireRecord(CLE_RECORD, Math.floor(record))
        }
        sonPerdu()
        break
    }
  }

  // ---------------------------------------------------------------- le dessin

  let cx = 0
  let cy = 0
  const sx = (x: number) => canvas.width / 2 + (x - cx) * echelle
  const sy = (y: number) => canvas.height / 2 + (y - cy) * echelle

  /** Le sol : un tapis de mousse, des plaques plus claires, des touffes, des cailloux, des fleurs. */
  function dessinerLeSol(w: number, h: number): void {
    g.fillStyle = '#26331f'
    g.fillRect(0, 0, w, h)
    const demiL = w / 2 / echelle
    const demiH = h / 2 / echelle
    const x0 = Math.floor((cx - demiL) / CASE) - 1
    const x1 = Math.floor((cx + demiL) / CASE) + 1
    const y0 = Math.floor((cy - demiH) / CASE) - 1
    const y1 = Math.floor((cy + demiH) / CASE) + 1

    for (let i = x0; i <= x1; i++) {
      for (let j = y0; j <= y1; j++) {
        const r = hache(i, j, 1)
        if (r > 0.25) continue
        g.fillStyle = r < 0.12 ? 'rgba(70, 92, 50, 0.28)' : 'rgba(20, 28, 16, 0.32)'
        g.beginPath()
        g.ellipse(sx((i + hache(i, j, 2)) * CASE), sy((j + hache(i, j, 3)) * CASE), CASE * (0.9 + r * 3) * echelle, CASE * (0.6 + r * 2) * echelle, hache(i, j, 4) * Math.PI, 0, Math.PI * 2)
        g.fill()
      }
    }
    g.lineCap = 'round'
    for (let i = x0; i <= x1; i++) {
      for (let j = y0; j <= y1; j++) {
        const r = hache(i, j, 5)
        const px = sx((i + 0.15 + hache(i, j, 6) * 0.7) * CASE)
        const py = sy((j + 0.15 + hache(i, j, 7) * 0.7) * CASE)
        if (r < 0.45) {
          g.strokeStyle = r < 0.2 ? '#5f7f3c' : '#47602e'
          g.lineWidth = 0.45 * echelle
          g.beginPath()
          for (const a of [-0.5, 0, 0.45]) {
            g.moveTo(px + a * 0.8 * echelle, py)
            g.lineTo(px + a * 2.2 * echelle, py - (a === 0 ? 2.6 : 1.9) * echelle)
          }
          g.stroke()
        } else if (r < 0.58) {
          const t = (0.7 + hache(i, j, 8)) * echelle
          g.fillStyle = 'rgba(0, 0, 0, 0.3)'
          g.beginPath()
          g.ellipse(px, py + 0.4 * t, 1.3 * t, 0.7 * t, 0, 0, Math.PI * 2)
          g.fill()
          g.fillStyle = '#7d7a6c'
          g.beginPath()
          g.ellipse(px, py, 1.2 * t, 0.8 * t, 0, 0, Math.PI * 2)
          g.fill()
          g.fillStyle = '#a3a08f'
          g.beginPath()
          g.ellipse(px - 0.3 * t, py - 0.3 * t, 0.5 * t, 0.3 * t, 0, 0, Math.PI * 2)
          g.fill()
        } else if (r < 0.64) {
          g.fillStyle = ['#e8d36a', '#d97ab8', '#e6e6f0', '#7ab8e8'][Math.floor(hache(i, j, 9) * 4)]
          for (let p = 0; p < 4; p++) {
            const a = (p * Math.PI) / 2
            g.beginPath()
            g.arc(px + Math.cos(a) * 0.55 * echelle, py + Math.sin(a) * 0.55 * echelle, 0.45 * echelle, 0, Math.PI * 2)
            g.fill()
          }
          g.fillStyle = '#f2a33a'
          g.beginPath()
          g.arc(px, py, 0.3 * echelle, 0, Math.PI * 2)
          g.fill()
        }
      }
    }
  }

  function ombre(x: number, y: number, rayon: number): void {
    g.fillStyle = 'rgba(0, 0, 0, 0.32)'
    g.beginPath()
    g.ellipse(sx(x), sy(y), rayon * echelle, rayon * 0.35 * echelle, 0, 0, Math.PI * 2)
    g.fill()
  }

  /** Un personnage debout, les pieds à (x, y) : rebond, penché, retourné, blanchi quand il vient d'être touché. */
  function personnage(img: HTMLImageElement | null, x: number, y: number, taille: number, regard: number, rebond: number, penche: number, blanc: number): void {
    if (img === null) return
    const t = taille * echelle
    g.save()
    g.translate(sx(x), sy(y) - rebond * echelle)
    g.rotate(penche)
    g.scale(regard, 1)
    g.drawImage(img, -t / 2, -t * 0.92, t, t)
    if (blanc > 0) {
      g.globalCompositeOperation = 'lighter'
      g.globalAlpha = blanc
      g.drawImage(img, -t / 2, -t * 0.92, t, t)
    }
    g.restore()
  }

  function dessinerLesGemmes(): void {
    const t = performance.now() / 1000
    for (const gm of e.gemmes) {
      const x = sx(gm.x)
      const y = sy(gm.y) - Math.sin(t * 4 + gm.id) * 0.4 * echelle
      if (gm.coffre) {
        const s = 3 * echelle
        g.fillStyle = 'rgba(255, 210, 122, 0.35)'
        g.beginPath()
        g.arc(x, y, s * 1.6, 0, Math.PI * 2)
        g.fill()
        g.fillStyle = '#7a4a22'
        g.fillRect(x - s, y - s * 0.7, s * 2, s * 1.4)
        g.fillStyle = '#ffd27a'
        g.fillRect(x - s, y - s * 0.15, s * 2, s * 0.3)
        g.fillRect(x - s * 0.2, y - s * 0.4, s * 0.4, s * 0.6)
        continue
      }
      const s = (gm.valeur >= 6 ? 1.6 : gm.valeur >= 2 ? 1.3 : 1.05) * echelle
      g.fillStyle = gm.valeur >= 6 ? '#ff6b8a' : gm.valeur >= 2 ? '#6bf09a' : '#6bc8ff'
      g.beginPath()
      g.moveTo(x, y - s * 1.4)
      g.lineTo(x + s, y)
      g.lineTo(x, y + s * 1.4)
      g.lineTo(x - s, y)
      g.closePath()
      g.fill()
      g.fillStyle = 'rgba(255, 255, 255, 0.7)'
      g.beginPath()
      g.moveTo(x, y - s * 1.1)
      g.lineTo(x + s * 0.4, y - s * 0.2)
      g.lineTo(x - s * 0.2, y - s * 0.2)
      g.closePath()
      g.fill()
    }
  }

  function dessinerLesCorps(): void {
    // Tout ce qui est debout se trie par la hauteur des pieds : le plus bas passe devant.
    const corps: { y: number; dessiner: () => void }[] = []
    const t = e.t
    for (const en of e.ennemis) {
      const d = C.ennemis[en.type]
      const taille = d.rayon * 4
      const regard = e.heros.x < en.x ? -1 : 1
      const pieds = en.y + d.rayon * 0.9
      corps.push({
        y: pieds,
        dessiner: () => {
          ombre(en.x, pieds, d.rayon * 0.9)
          const vole = en.type === 'chauve' ? 2 + Math.sin(t * 9 + en.id) * 0.8 : Math.abs(Math.sin(t * 9 + en.id)) * 0.6
          personnage(imageEnnemi(en.type), en.x, pieds, taille, regard, vole, Math.sin(t * 9 + en.id) * 0.08, t - en.touche < 0.1 ? 0.8 : 0)
          if (en.type === 'elite' || (en.type === 'brute' && en.pv < en.pvMax)) {
            const l = d.rayon * 2.4 * echelle
            const x = sx(en.x) - l / 2
            const y = sy(pieds) - taille * echelle - 1.2 * echelle
            g.fillStyle = 'rgba(0, 0, 0, 0.6)'
            g.fillRect(x, y, l, 0.9 * echelle)
            g.fillStyle = en.type === 'elite' ? '#ffd27a' : '#ff6b6b'
            g.fillRect(x, y, l * Math.max(0, en.pv / en.pvMax), 0.9 * echelle)
          }
        },
      })
    }
    if (e.phase !== 'perdu') {
      const h = e.heros
      const pieds = h.y + TAILLE_HEROS * 0.37
      corps.push({
        y: pieds,
        dessiner: () => {
          ombre(h.x, pieds, TAILLE_HEROS * 0.3)
          const vitesse = Math.hypot(h.vx, h.vy) / SURVIVOR.vitesse
          const pas = (h.parcouru / 4) * Math.PI
          const rebond = vitesse > 0.05 ? Math.abs(Math.sin(pas)) * 1.2 * Math.min(1, vitesse * 1.5) : 0
          // Invincible après un coup : il clignote.
          const clignote = e.t < e.invincibleA && Math.floor(e.t * 20) % 2 === 0
          if (!clignote) personnage(heroImage(), h.x, pieds + TAILLE_HEROS * 0.08, TAILLE_HEROS, h.regard, rebond, (h.vx / SURVIVOR.vitesse) * 0.12, 0)
          // Ses PV, sous ses pieds.
          const l = 9 * echelle
          const x = sx(h.x) - l / 2
          const y = sy(pieds) + 1.6 * echelle
          g.fillStyle = 'rgba(0, 0, 0, 0.6)'
          g.fillRect(x, y, l, 1.1 * echelle)
          g.fillStyle = '#ff5a5a'
          g.fillRect(x, y, l * (e.pv / pvMaxDe(C, e)), 1.1 * echelle)
        },
      })
    }
    corps.sort((a, b) => a.y - b.y)
    for (const c of corps) c.dessiner()
  }

  function dessinerLesArmes(): void {
    // L'ail : un halo pâle qui respire autour du héros.
    if (rangArme(e, 'ail') > 0 && e.phase !== 'perdu') {
      const r = armeDe(e, 'ail').zone * echelle * (1 + Math.sin(performance.now() / 200) * 0.03)
      const grad = g.createRadialGradient(sx(e.heros.x), sy(e.heros.y), r * 0.3, sx(e.heros.x), sy(e.heros.y), r)
      grad.addColorStop(0, 'rgba(240, 255, 220, 0)')
      grad.addColorStop(1, 'rgba(240, 255, 220, 0.28)')
      g.fillStyle = grad
      g.beginPath()
      g.arc(sx(e.heros.x), sy(e.heros.y), r, 0, Math.PI * 2)
      g.fill()
    }
    for (const p of e.projectiles) {
      const x = sx(p.x)
      const y = sy(p.y)
      if (p.arme === 'baguette') {
        g.fillStyle = 'rgba(120, 200, 255, 0.35)'
        g.beginPath()
        g.arc(x, y, 2.6 * echelle, 0, Math.PI * 2)
        g.fill()
        g.fillStyle = '#e6f6ff'
        g.beginPath()
        g.arc(x, y, 1.1 * echelle, 0, Math.PI * 2)
        g.fill()
      } else if (p.arme === 'couteau') {
        const v = Math.hypot(p.vx, p.vy) || 1
        g.strokeStyle = '#e8eef5'
        g.lineWidth = 0.7 * echelle
        g.beginPath()
        g.moveTo(x - (p.vx / v) * 2.5 * echelle, y - (p.vy / v) * 2.5 * echelle)
        g.lineTo(x + (p.vx / v) * 2.5 * echelle, y + (p.vy / v) * 2.5 * echelle)
        g.stroke()
      } else if (p.arme === 'hache') {
        const s = p.rayon * echelle
        g.save()
        g.translate(x, y)
        g.rotate(performance.now() / 70)
        g.fillStyle = '#7a4a22'
        g.fillRect(-s * 0.15, -s, s * 0.3, s * 2)
        g.fillStyle = '#c9d2dc'
        g.beginPath()
        g.moveTo(0, -s)
        g.quadraticCurveTo(s * 1.2, -s * 0.9, s * 0.9, -s * 0.1)
        g.lineTo(0, -s * 0.35)
        g.closePath()
        g.fill()
        g.restore()
      }
    }
    for (const o of orbesDe(e)) {
      g.fillStyle = 'rgba(255, 210, 122, 0.35)'
      g.beginPath()
      g.arc(sx(o.x), sy(o.y), 3.2 * echelle, 0, Math.PI * 2)
      g.fill()
      g.fillStyle = '#fff1c2'
      g.beginPath()
      g.arc(sx(o.x), sy(o.y), 1.6 * echelle, 0, Math.PI * 2)
      g.fill()
    }
  }

  function dessinerLesTraces(): void {
    for (const tr of traces) {
      const u = tr.vie / tr.duree
      if (tr.ev.type === 'fouet') {
        // Un croissant qui part du héros et s'étire du côté frappé.
        const { x, y, cote, longueur, hauteur } = tr.ev
        const x0 = sx(x)
        const y0 = sy(y)
        const l = longueur * echelle * Math.min(1, u * 3)
        g.fillStyle = `rgba(255, 255, 255, ${0.85 * (1 - u)})`
        g.beginPath()
        g.moveTo(x0, y0)
        g.quadraticCurveTo(x0 + cote * l * 0.5, y0 - hauteur * echelle * 0.9, x0 + cote * l, y0 - hauteur * echelle * 0.1)
        g.quadraticCurveTo(x0 + cote * l * 0.5, y0 - hauteur * echelle * 0.3, x0, y0)
        g.fill()
      } else {
        // La foudre : un trait brisé qui tombe du haut de l'écran.
        const x = sx(tr.ev.x)
        const y = sy(tr.ev.y)
        g.strokeStyle = `rgba(220, 240, 255, ${1 - u})`
        g.lineWidth = 0.8 * echelle
        g.beginPath()
        let px = x
        g.moveTo(px, 0)
        const n = 8
        for (let i = 1; i <= n; i++) {
          px = i === n ? x : x + (hache(i, Math.floor(tr.ev.x * 10), Math.floor(tr.ev.y * 10)) - 0.5) * 8 * echelle
          g.lineTo(px, (y * i) / n)
        }
        g.stroke()
      }
    }
  }

  function dessinerLeManche(): void {
    if (manche === null || e.phase !== 'jeu') return
    const r = SURVIVOR.manche.rayon * dpr
    if (suivre) {
      g.strokeStyle = 'rgba(255, 255, 255, 0.5)'
      g.lineWidth = 2 * dpr
      g.beginPath()
      g.arc(manche.doigt.x * dpr, manche.doigt.y * dpr, 18 * dpr, 0, Math.PI * 2)
      g.stroke()
      return
    }
    const x = manche.centre.x * dpr
    const y = manche.centre.y * dpr
    g.fillStyle = 'rgba(0, 0, 0, 0.25)'
    g.strokeStyle = 'rgba(255, 255, 255, 0.45)'
    g.lineWidth = 2.5 * dpr
    g.beginPath()
    g.arc(x, y, r, 0, Math.PI * 2)
    g.fill()
    g.stroke()
    const dx = manche.doigt.x - manche.centre.x
    const dy = manche.doigt.y - manche.centre.y
    const d = Math.hypot(dx, dy)
    const k = d > SURVIVOR.manche.rayon ? SURVIVOR.manche.rayon / d : 1
    g.fillStyle = 'rgba(255, 255, 255, 0.7)'
    g.beginPath()
    g.arc(x + dx * k * dpr, y + dy * k * dpr, r * 0.42, 0, Math.PI * 2)
    g.fill()
  }

  // ---------------------------------------------------------------- la barre

  let barreVue = ''
  function majBarre(): void {
    const besoin = xpPourNiveau(C, e.niveau)
    const cle = `${e.niveau}|${Math.floor((e.xp / besoin) * 200)}|${Math.floor(e.t)}|${e.abattus}`
    if (cle === barreVue) return
    barreVue = cle
    remplie.style.width = `${Math.min(100, (e.xp / besoin) * 100)}%`
    niveauTexte.textContent = `Niv. ${e.niveau}`
    tempsTexte.textContent = duree(e.t)
    abattusTexte.textContent = `☠ ${e.abattus}`
  }

  // ---------------------------------------------------------------- la boucle

  let accumule = 0
  let avant = performance.now()
  document.addEventListener('visibilitychange', () => {
    avant = performance.now()
    accumule = 0
  })

  function image(maintenant: number): void {
    const dt = Math.min(maintenant - avant, 250)
    accumule += dt
    avant = maintenant
    if (enJeu) {
      while (accumule >= PAS) {
        accumule -= PAS
        if (e.phase !== 'jeu') continue
        for (const ev of avancerPartie(C, e, PAS, directionVoulue(), vue())) vivre(ev)
        if (e.heros.parcouru >= prochainePoussiere) {
          if (Math.hypot(e.heros.vx, e.heros.vy) > SURVIVOR.vitesse * 0.5) eclats.push({ x: e.heros.x, y: e.heros.y + TAILLE_HEROS * 0.42, vx: 0, vy: -3, vie: 0, duree: 450, couleur: '#bec8a0', taille: 1 })
          prochainePoussiere = e.heros.parcouru + 4
        }
      }
      if (e.phase !== phaseMontree) montrerLEcran()
    } else accumule = 0

    // Les éclats, les chiffres, les traces vivent au temps de l'écran.
    for (let i = eclats.length - 1; i >= 0; i--) {
      const p = eclats[i]
      p.vie += dt
      p.x += (p.vx * dt) / 1000
      p.y += (p.vy * dt) / 1000
      p.vx *= 0.95
      p.vy *= 0.95
      if (p.vie >= p.duree) eclats.splice(i, 1)
    }
    for (let i = chiffres.length - 1; i >= 0; i--) {
      chiffres[i].vie += dt
      if (chiffres[i].vie >= 500) chiffres.splice(i, 1)
    }
    for (let i = traces.length - 1; i >= 0; i--) {
      traces[i].vie += dt
      if (traces[i].vie >= traces[i].duree) traces.splice(i, 1)
    }
    for (let i = ondes.length - 1; i >= 0; i--) {
      ondes[i].vie += dt
      if (ondes[i].vie >= ondes[i].duree) ondes.splice(i, 1)
    }
    flashRouge = Math.max(0, flashRouge - dt / 300)
    flashOr = Math.max(0, flashOr - dt / 500)
    secousse = Math.max(0, secousse - dt / 250)

    const w = canvas.width
    const h = canvas.height
    cx = e.heros.x + (Math.random() - 0.5) * secousse * 1.5
    cy = e.heros.y + (Math.random() - 0.5) * secousse * 1.5
    dessinerLeSol(w, h)
    dessinerLesGemmes()
    dessinerLesArmes()
    dessinerLesCorps()
    dessinerLesTraces()
    for (const o of ondes) {
      const u = o.vie / o.duree
      g.strokeStyle = o.couleur
      g.globalAlpha = 1 - u
      g.lineWidth = 0.8 * echelle
      g.beginPath()
      g.arc(sx(o.x), sy(o.y), o.rayon * u * echelle, 0, Math.PI * 2)
      g.stroke()
      g.globalAlpha = 1
    }
    for (const p of eclats) {
      g.globalAlpha = 1 - p.vie / p.duree
      g.fillStyle = p.couleur
      g.beginPath()
      g.arc(sx(p.x), sy(p.y), p.taille * echelle, 0, Math.PI * 2)
      g.fill()
    }
    g.globalAlpha = 1
    g.font = `800 ${2.6 * echelle}px 'Baloo 2', sans-serif`
    g.textAlign = 'center'
    g.lineWidth = 0.5 * echelle
    g.strokeStyle = 'rgba(0, 0, 0, 0.7)'
    for (const c of chiffres) {
      const u = c.vie / 500
      g.globalAlpha = 1 - u * u
      g.fillStyle = '#ffffff'
      const y = sy(c.y) - u * 4 * echelle
      g.strokeText(c.texte, sx(c.x), y)
      g.fillText(c.texte, sx(c.x), y)
    }
    g.globalAlpha = 1
    if (flashRouge > 0) {
      const grad = g.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.3, w / 2, h / 2, Math.max(w, h) * 0.75)
      grad.addColorStop(0, 'rgba(255, 40, 40, 0)')
      grad.addColorStop(1, `rgba(255, 40, 40, ${0.45 * flashRouge})`)
      g.fillStyle = grad
      g.fillRect(0, 0, w, h)
    }
    if (flashOr > 0) {
      g.fillStyle = `rgba(255, 220, 140, ${0.25 * flashOr})`
      g.fillRect(0, 0, w, h)
    }
    dessinerLeManche()
    if (enJeu) majBarre()
    requestAnimationFrame(image)
  }
  requestAnimationFrame(image)
}

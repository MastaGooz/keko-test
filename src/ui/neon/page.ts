/**
 * NÉON À L'ÉCRAN — `?neon`, un side project (Keko, 08/11 : « un jeu arcade
 * incrémental/roguelike, à base de formes géométriques néon flashy sur un fond
 * sombre. On contrôle un cercle en bas de l'écran : il ne bouge pas, les
 * ennemis viennent du haut. On joue à base de commandes action : quand un
 * ennemi nous touche (ou un projectile), on peut taper pour parer »).
 *
 * Un canvas : le fond sombre et sa grille qui défile, le cercle en bas, les
 * formes qui descendent, leurs petits hexagones, les ronds du cercle — tout tracé en néon (un halo
 * additif, un trait de couleur, un cœur blanc). **Une tape n'importe où PARE**
 * (au clavier : la barre d'espace). L'anneau de garde autour du cercle dit
 * quand : il s'allume en blanc quand quelque chose est dans la fenêtre, en or
 * dans la fenêtre parfaite ; la forme elle-même se cercle de la même couleur.
 * En DOM : les PV, le niveau et sa jauge, les abattus, les trois
 * cartes d'un niveau, l'accueil et la fin. Classes préfixées `neon-`.
 */
import './neon.css'
import { avancer, choisir, NEON as C, nouvellePartie, parable, parer, type CleAmelioration, type EtatNeon, type Evenement, type TypeEnnemi } from '../../logic/neon/jeu.ts'
import { ecrireRecord, lireRecord } from '../invaders/commun.ts'
import { ouvrirLeSon, sonChoix, sonCoup, sonProjectile, sonMort, sonNiveau, sonOnde, sonParade, sonParfaite, sonPerdu, sonRate, sonTir, sonTouche } from './sons.ts'

/** Le pas des règles : fin, les fenêtres de parade se jouent à 30 ms. */
const PAS = 1 / 120
/** L'écran montre tant d'unités de large — et au moins tant de haut (sur un PC large, le terrain se resserre au milieu). */
const LARGEUR = 80
const HAUTEUR_MIN = 130
/** Le cercle est à tant d'unités du bas de l'écran. */
const BAS = 16
const CLE_RECORD = 'keko-neon-record'
/** La parade parfaite ralentit le temps un instant ; après un choix, le jeu repart au ralenti pour retrouver le rythme. */
const RALENTI = { duree: 0.22, facteur: 0.25 }
const REPRISE = { duree: 0.6, facteur: 0.3 }

const CYAN = '#19f2ff'
const OR = '#ffd23a'
const ROUGE = '#ff4d6d'
const TEINTE: Record<TypeEnnemi, string> = { triangle: '#ff2bd6', carre: '#ff9a1f', hexagone: '#a66bff' }
const COTES: Record<TypeEnnemi, number> = { triangle: 3, carre: 4, hexagone: 6 }
const TEINTE_AMELIORATION: Record<CleAmelioration, string> = { cadence: CYAN, puissance: '#ff2bd6', double: CYAN, percant: CYAN, garde: OR, riposte: OR, onde: OR, carapace: '#39ff8a', lenteur: '#a66bff' }
const ROMAIN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII']

type Eclat = { x: number; y: number; vx: number; vy: number; vie: number; duree: number; couleur: string; taille: number }
type Chiffre = { x: number; y: number; texte: string; couleur: string; vie: number; gros?: boolean }
type Onde = { rayon: number; t: number; duree: number; couleur: string }
type Flash = { x: number; y: number; t: number; parfaite: boolean }

export function monterNeon(racine: HTMLElement, build: string): void {
  document.documentElement.classList.add('neon-page')
  racine.classList.add('neon')
  const canvas = document.createElement('canvas')
  canvas.className = 'neon-canvas'
  const g = canvas.getContext('2d')!

  function el<K extends keyof HTMLElementTagNameMap>(tag: K, classe: string, texte = ''): HTMLElementTagNameMap[K] {
    const n = document.createElement(tag)
    n.className = classe
    n.textContent = texte
    return n
  }

  const haut = el('div', 'neon-haut')
  const pvBloc = el('div', 'neon-pv')
  const niveauBloc = el('div', 'neon-niveau')
  const niveauTexte = el('span', '')
  const jauge = el('div', 'neon-jauge')
  const remplie = el('div', 'neon-jauge-remplie')
  jauge.append(remplie)
  niveauBloc.append(niveauTexte, jauge)
  const abattusTexte = el('div', 'neon-abattus')
  haut.append(pvBloc, niveauBloc, abattusTexte)
  const choix = el('div', 'neon-choix')
  choix.hidden = true
  const ecran = el('div', 'neon-ecran')
  const pied = el('div', 'neon-build', `build ${build}`)
  racine.append(canvas, haut, choix, ecran, pied)

  let e: EtatNeon = nouvellePartie(C, 1)
  let enJeu = false
  let rejouableA = 0
  let record = lireRecord(CLE_RECORD)
  const eclats: Eclat[] = []
  const chiffres: Chiffre[] = []
  const ondes: Onde[] = []
  const flashs: Flash[] = []
  /** L'instant où chaque ennemi a été touché (il blanchit). */
  const touches = new Map<number, number>()
  let flashRouge = 0
  let secousse = 0
  let ralenti: { jusqua: number; facteur: number } = { jusqua: -1, facteur: 1 }
  let banniere: { texte: string; t: number } | null = null
  let pvAffiches = ''

  // ---------------------------------------------------------------- le cadre

  let dpr = 1
  let s = 1
  let ox = 0
  let oy = 0
  let secousseX = 0
  let secousseY = 0
  function cadrer(): void {
    dpr = Math.min(2, window.devicePixelRatio || 1)
    const w = window.innerWidth
    const h = window.innerHeight
    canvas.width = Math.round(w * dpr)
    canvas.height = Math.round(h * dpr)
    canvas.style.width = `${w}px`
    canvas.style.height = `${h}px`
    s = Math.min(canvas.width / LARGEUR, canvas.height / HAUTEUR_MIN)
    ox = canvas.width / 2
    oy = canvas.height - BAS * s
  }
  window.addEventListener('resize', cadrer)
  const sx = (x: number) => ox + x * s + secousseX
  const sy = (y: number) => oy + y * s + secousseY
  const vue = () => ({ haut: oy / s, demiLargeur: ox / s })

  // ---------------------------------------------------------------- les écrans

  function montrerEcran(titre: string, texte: string, go: string): void {
    const t = el('div', 'neon-texte')
    t.innerHTML = texte
    ecran.replaceChildren(el('div', 'neon-titre', titre), t, el('div', 'neon-go', go))
    ecran.hidden = false
  }
  montrerEcran(
    'NÉON',
    `Le cercle tire tout seul sur ce qui descend. Vous, vous <b>parez</b> : touchez l’écran juste avant qu’une forme ou un petit hexagone ne touche le cercle — l’anneau de garde s’allume quand c’est le moment. <b>Pile au contact</b>, la parade est parfaite : trois fois plus forte, et une onde balaie tout autour. Une tape dans le vide bloque la garde un instant. À chaque niveau, trois améliorations, prenez-en une.${record > 0 ? ` Record : ${record} abattus.` : ''}`,
    'TOUCHEZ POUR JOUER',
  )

  function lancerLaPartie(): void {
    ouvrirLeSon()
    e = nouvellePartie(C, (Math.random() * 2 ** 32) >>> 0)
    enJeu = true
    ecran.hidden = true
    choix.hidden = true
    eclats.length = 0
    chiffres.length = 0
    ondes.length = 0
    flashs.length = 0
    touches.clear()
    banniere = null
    majHaut()
  }

  // ---------------------------------------------------------------- la tape

  /** La parade. `retard` : le doigt a touché il y a tant de secondes (la page traite après coup). */
  function taper(retard: number): void {
    if (!enJeu) return
    ouvrirLeSon()
    for (const x of parer(C, e, Math.max(0, Math.min(0.1, retard)))) vivre(x)
  }
  racine.addEventListener('pointerdown', (ev) => {
    if ((ev.target as HTMLElement).closest('button') !== null) return
    if (!enJeu) {
      if (e.phase !== 'choix' && performance.now() / 1000 >= rejouableA) lancerLaPartie()
      return
    }
    ev.preventDefault()
    taper((performance.now() - ev.timeStamp) / 1000)
  })
  window.addEventListener('keydown', (ev) => {
    if (ev.repeat) return
    if (ev.key === ' ' || ev.key === 'Enter' || ev.key === 'ArrowDown') {
      ev.preventDefault()
      if (!enJeu) {
        if (e.phase !== 'choix' && performance.now() / 1000 >= rejouableA) lancerLaPartie()
        return
      }
      taper((performance.now() - ev.timeStamp) / 1000)
    }
    const i = Number(ev.key) - 1
    if (e.phase === 'choix' && i >= 0 && i < e.choix.length) prendre(i)
  })

  // ---------------------------------------------------------------- les choix d'un niveau

  function montrerLesChoix(): void {
    const titre = el('div', 'neon-choix-titre', `NIVEAU ${e.niveau}`)
    const cartes = e.choix.map((cle, i) => {
      const c = C.ameliorations[cle]
      const b = el('button', 'neon-carte')
      b.type = 'button'
      b.style.setProperty('--c', TEINTE_AMELIORATION[cle])
      const nom = el('div', 'neon-carte-nom', c.nom)
      nom.append(el('span', 'neon-carte-rang', `${ROMAIN[e.ameliorations[cle]] ?? e.ameliorations[cle] + 1} / ${ROMAIN[c.max - 1] ?? c.max}`))
      b.append(nom, el('div', 'neon-carte-effet', c.effet))
      b.addEventListener('click', () => prendre(i))
      return b
    })
    choix.replaceChildren(titre, ...cartes)
    choix.hidden = false
  }
  function prendre(i: number): void {
    if (e.phase !== 'choix') return
    for (const x of choisir(C, e, i)) vivre(x)
    if (e.phase !== 'choix') {
      choix.hidden = true
      // Le jeu repart au ralenti : le temps de reprendre le rythme (Keko : « le choix casse le rythme »).
      ralenti = { jusqua: performance.now() / 1000 + REPRISE.duree, facteur: REPRISE.facteur }
    }
    majHaut()
  }

  // ---------------------------------------------------------------- les effets

  function eclater(x: number, y: number, couleur: string, n: number, force: number): void {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2
      const v = force * (0.3 + Math.random() * 0.7)
      eclats.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, vie: 0, duree: 300 + Math.random() * 350, couleur, taille: 0.3 + Math.random() * 0.5 })
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
      case 'tir':
        sonTir()
        break
      case 'touche':
        sonTouche()
        touches.set(ev.id, e.t)
        chiffres.push({ x: ev.x, y: ev.y - C.ennemis[ev.ennemi].rayon - 2, texte: String(ev.degats), couleur: ev.degats >= 10 ? OR : '#ffffff', vie: 0, gros: ev.degats >= 10 })
        break
      case 'mort':
        sonMort()
        eclater(ev.x, ev.y, TEINTE[ev.ennemi], 14, 22)
        eclater(ev.x, ev.y, '#ffffff', 5, 12)
        break
      case 'parade': {
        const parfaite = ev.qualite === 'parfaite'
        if (parfaite) sonParfaite()
        else sonParade()
        vibrer(parfaite ? 30 : 12)
        flashs.push({ x: ev.x, y: ev.y, t: e.t, parfaite })
        eclater(ev.x, ev.y, parfaite ? OR : '#ffffff', parfaite ? 16 : 8, parfaite ? 30 : 18)
        chiffres.push({ x: ev.x, y: ev.y - 7, texte: parfaite ? 'PARFAITE' : 'Parade', couleur: parfaite ? OR : CYAN, vie: 0, gros: parfaite })
        if (parfaite) ralenti = { jusqua: performance.now() / 1000 + RALENTI.duree, facteur: RALENTI.facteur }
        break
      }
      case 'onde':
        sonOnde()
        secousse = Math.max(secousse, 0.4)
        ondes.push({ rayon: ev.rayon, t: e.t, duree: 0.4, couleur: OR })
        break
      case 'rate':
        sonRate()
        chiffres.push({ x: 0, y: -C.cercle.rayon - 4, texte: 'Raté', couleur: ROUGE, vie: 0 })
        break
      case 'bloque':
        break
      case 'coup':
        sonCoup()
        vibrer(50)
        flashRouge = 1
        secousse = Math.max(secousse, 0.7)
        eclater(ev.x, ev.y, ROUGE, 14, 24)
        chiffres.push({ x: 0, y: -C.cercle.rayon - 4, texte: `-${ev.degats}`, couleur: ROUGE, vie: 0, gros: true })
        majHaut()
        break
      case 'projectile':
        sonProjectile()
        break
      case 'naissance':
        break
      case 'niveau':
        sonNiveau()
        banniere = { texte: `NIVEAU ${ev.niveau}`, t: e.t }
        montrerLesChoix()
        break
      case 'amelioration':
        sonChoix()
        chiffres.push({ x: 0, y: -C.cercle.rayon - 10, texte: C.ameliorations[ev.cle].nom, couleur: TEINTE_AMELIORATION[ev.cle], vie: 0, gros: true })
        eclater(0, 0, TEINTE_AMELIORATION[ev.cle], 18, 24)
        break
      case 'perdu': {
        sonPerdu()
        enJeu = false
        rejouableA = performance.now() / 1000 + 1.2
        eclater(0, 0, CYAN, 40, 40)
        const nouveau = e.abattus > record
        if (nouveau) {
          record = e.abattus
          ecrireRecord(CLE_RECORD, record)
        }
        setTimeout(() => montrerEcran('ÉTEINT', `Niveau ${e.niveau} · ${e.abattus} abattus · ${e.parfaites} parade${e.parfaites > 1 ? 's' : ''} parfaite${e.parfaites > 1 ? 's' : ''}. ${nouveau ? '<b>Nouveau record !</b>' : `Record : ${record} abattus.`}`, 'TOUCHEZ POUR REJOUER'), 900)
        break
      }
    }
  }

  // ---------------------------------------------------------------- le haut

  function majHaut(): void {
    const cle = `${e.pv}/${e.pvMax}`
    if (cle !== pvAffiches) {
      pvAffiches = cle
      pvBloc.replaceChildren(...Array.from({ length: e.pvMax }, (_, i) => el('i', i < e.pv ? '' : 'vide')))
    }
    niveauTexte.textContent = `NIV ${e.niveau}${e.niveauxDus > 0 ? ' \u25B2' : ''}`
    remplie.style.width = `${Math.min(100, (100 * e.xp) / e.xpSuivant)}%`
    abattusTexte.textContent = `${e.abattus}`
  }

  // ---------------------------------------------------------------- le néon

  /** Un trait néon : un halo additif large, un trait de couleur, un cœur blanc. */
  function neon(trace: () => void, couleur: string, largeur: number, intensite = 1): void {
    g.lineCap = 'round'
    g.lineJoin = 'round'
    g.save()
    g.globalCompositeOperation = 'lighter'
    g.strokeStyle = couleur
    g.globalAlpha = 0.14 * intensite
    g.lineWidth = largeur * 6
    g.beginPath()
    trace()
    g.stroke()
    g.globalAlpha = 0.4 * intensite
    g.lineWidth = largeur * 2.4
    g.beginPath()
    trace()
    g.stroke()
    g.restore()
    g.strokeStyle = couleur
    g.globalAlpha = intensite
    g.lineWidth = largeur
    g.beginPath()
    trace()
    g.stroke()
    g.strokeStyle = '#ffffff'
    g.globalAlpha = 0.8 * intensite
    g.lineWidth = largeur * 0.4
    g.beginPath()
    trace()
    g.stroke()
    g.globalAlpha = 1
  }
  function polygone(cx: number, cy: number, r: number, n: number, angle: number): void {
    for (let i = 0; i < n; i++) {
      const a = angle + (i / n) * Math.PI * 2
      const x = cx + Math.cos(a) * r
      const y = cy + Math.sin(a) * r
      if (i === 0) g.moveTo(x, y)
      else g.lineTo(x, y)
    }
    g.closePath()
  }
  function cercle(cx: number, cy: number, r: number): void {
    g.arc(cx, cy, r, 0, Math.PI * 2)
  }

  // ---------------------------------------------------------------- le dessin

  function dessinerLeFond(): void {
    g.fillStyle = '#05050d'
    g.fillRect(0, 0, canvas.width, canvas.height)
    // La lueur de l'horizon, sous le cercle.
    const lueur = g.createRadialGradient(sx(0), sy(0), 0, sx(0), sy(0), 70 * s)
    lueur.addColorStop(0, 'rgba(25, 242, 255, 0.10)')
    lueur.addColorStop(0.5, 'rgba(255, 43, 214, 0.05)')
    lueur.addColorStop(1, 'rgba(5, 5, 13, 0)')
    g.fillStyle = lueur
    g.fillRect(0, 0, canvas.width, canvas.height)
    // La grille, qui défile vers le bas : le monde avance.
    const pas = 10
    const v = vue()
    const decal = (e.t * 6) % pas
    g.strokeStyle = 'rgba(25, 242, 255, 0.07)'
    g.lineWidth = Math.max(1, 0.12 * s)
    g.beginPath()
    for (let x = Math.ceil(-v.demiLargeur / pas) * pas; x <= v.demiLargeur; x += pas) {
      g.moveTo(sx(x), 0)
      g.lineTo(sx(x), canvas.height)
    }
    for (let y = Math.ceil(-v.haut / pas) * pas - pas; y <= BAS; y += pas) {
      g.moveTo(0, sy(y + decal))
      g.lineTo(canvas.width, sy(y + decal))
    }
    g.stroke()
  }

  function dessinerLeCercle(t: number): void {
    const cx = sx(0)
    const cy = sy(0)
    const r = C.cercle.rayon * s * (1 + 0.02 * Math.sin(t * 4))
    const p = enJeu ? parable(C, e) : null
    const verrou = enJeu && e.t < e.verrouA
    // L'anneau de garde : éteint ; blanc quand quelque chose est dans la fenêtre ; or dans la fenêtre parfaite ; rouge et pointillé, bloqué.
    const rg = (C.cercle.rayon + 4) * s
    if (verrou) {
      g.setLineDash([0.8 * s, 0.8 * s])
      neon(() => cercle(cx, cy, rg), ROUGE, 0.25 * s, 0.6)
      g.setLineDash([])
    } else if (p !== null) {
      const bat = 1 + 0.06 * Math.sin(t * 40)
      neon(() => cercle(cx, cy, rg * bat), p.parfaite ? OR : '#ffffff', 0.45 * s, 1)
    } else {
      g.strokeStyle = 'rgba(25, 242, 255, 0.22)'
      g.lineWidth = 0.18 * s
      g.beginPath()
      cercle(cx, cy, rg)
      g.stroke()
    }
    // Le cercle lui-même : un cœur sombre, un trait néon.
    g.fillStyle = 'rgba(5, 5, 13, 0.9)'
    g.beginPath()
    cercle(cx, cy, r)
    g.fill()
    const depuisParade = e.t - e.paradeA
    const eclat = depuisParade < 0.25 ? 1 + 1.5 * (1 - depuisParade / 0.25) : 1
    neon(() => cercle(cx, cy, r), CYAN, 0.5 * s, Math.min(2, eclat))
    // Le noyau, qui bat.
    g.fillStyle = `rgba(25, 242, 255, ${0.35 + 0.15 * Math.sin(t * 6)})`
    g.beginPath()
    cercle(cx, cy, r * 0.3)
    g.fill()
  }

  function dessinerLesEnnemis(t: number): void {
    const p = enJeu ? parable(C, e) : null
    for (const en of e.ennemis) {
      const c = C.ennemis[en.type]
      const cx = sx(en.x)
      const cy = sy(en.y)
      const r = c.rayon * s
      const couleur = TEINTE[en.type]
      const touche = touches.get(en.id)
      const blanc = touche !== undefined && e.t - touche < 0.1
      const etourdi = e.t < en.etourdiA
      // Le corps : un polygone néon ; touché, il s'emplit de blanc ; étourdi, il tremble.
      const tx = etourdi ? (Math.random() - 0.5) * 0.6 * s : 0
      // L'IDENTITÉ DES FORMES (Keko) : le triangle POINTE vers le cercle (sa pointe est sa course), le carré BASCULE d'un quart
      // de tour à la fois (il roule, lourd), l'hexagone tourne doucement sur lui-même.
      const quart = Math.PI / 2
      const bascule = Math.floor(en.angle / quart) * quart + quart * Math.min(1, ((en.angle % quart) / quart) * 2.5) ** 2
      const angle = en.type === 'triangle' ? Math.atan2(-en.y, -en.x) : en.type === 'carre' ? bascule + Math.PI / 4 : en.angle
      if (blanc) {
        g.fillStyle = 'rgba(255, 255, 255, 0.85)'
        g.beginPath()
        polygone(cx + tx, cy, r, COTES[en.type], angle)
        g.fill()
      } else {
        g.fillStyle = `${couleur}22`
        g.beginPath()
        polygone(cx + tx, cy, r, COTES[en.type], angle)
        g.fill()
      }
      neon(() => polygone(cx + tx, cy, r, COTES[en.type], angle), couleur, 0.35 * s, etourdi ? 0.6 : 1)
      if (en.type === 'hexagone') {
        // Le cœur de l'hexagone s'allume avant de tirer.
        // Borné des deux côtés : avant sa halte, son prochain tir est déjà « passé », et le cœur grossissait sans fin (Keko : « ils grossissent dans une forme jaune pleine »).
        const bientot = Math.max(0, Math.min(1, 1 - (en.tirA - e.t) / 0.5))
        g.fillStyle = `rgba(255, 242, 58, ${0.15 + 0.7 * bientot})`
        g.beginPath()
        polygone(cx, cy, r * (0.3 + 0.2 * bientot), 6, -en.angle)
        g.fill()
      }
      // Les PV qui restent : un arc.
      if (en.pv < en.pvMax) {
        g.strokeStyle = couleur
        g.globalAlpha = 0.9
        g.lineWidth = 0.25 * s
        g.beginPath()
        g.arc(cx, cy, r + 1.2 * s, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * en.pv) / en.pvMax)
        g.stroke()
        g.globalAlpha = 1
      }
      // Dans la fenêtre : un anneau blanc (or : parfaite) autour de lui.
      if (p !== null && p.sorte === 'ennemi' && p.id === en.id) {
        neon(() => cercle(cx, cy, r + 2.6 * s), p.parfaite ? OR : '#ffffff', 0.3 * s, 0.9 + 0.1 * Math.sin(t * 40))
      }
    }
  }

  /** Les petits hexagones tirés par les hexagones : la forme tire sa forme (Keko : « une forme ne devrait pas en tirer une autre »). */
  function dessinerLesProjectiles(t: number): void {
    const p = enJeu ? parable(C, e) : null
    for (const pr of e.projectiles) {
      const cx = sx(pr.x)
      const cy = sy(pr.y)
      const a = Math.atan2(pr.vy, pr.vx)
      const r = C.hexagone.tir.rayon * s
      const couleur = TEINTE.hexagone
      // La traînée, dans la couleur de l'hexagone.
      g.strokeStyle = 'rgba(166, 107, 255, 0.3)'
      g.lineWidth = 0.7 * s
      g.beginPath()
      g.moveTo(cx, cy)
      g.lineTo(cx - Math.cos(a) * 5 * s, cy - Math.sin(a) * 5 * s)
      g.stroke()
      const forme = () => polygone(cx, cy, r, 6, t * 6 + pr.id)
      g.fillStyle = 'rgba(166, 107, 255, 0.35)'
      g.beginPath()
      forme()
      g.fill()
      neon(forme, couleur, 0.3 * s)
      if (p !== null && p.sorte === 'projectile' && p.id === pr.id) {
        neon(() => cercle(cx, cy, r + 2.6 * s), p.parfaite ? OR : '#ffffff', 0.3 * s, 0.9 + 0.1 * Math.sin(t * 40))
      }
    }
  }

  /** Les tirs du cercle sont des RONDS (Keko : « le rond tire des ronds ») ; un petit hexagone renvoyé par une parade reste un hexagone, passé à l'or. */
  function dessinerLesTirs(t: number): void {
    for (const tir of e.tirs) {
      const v = Math.hypot(tir.vx, tir.vy) || 1
      const cx = sx(tir.x)
      const cy = sy(tir.y)
      if (tir.renvoye) {
        const r = C.hexagone.tir.rayon * s
        g.strokeStyle = 'rgba(255, 210, 58, 0.3)'
        g.lineWidth = 0.7 * s
        g.beginPath()
        g.moveTo(cx, cy)
        g.lineTo(cx - (tir.vx / v) * 5 * s, cy - (tir.vy / v) * 5 * s)
        g.stroke()
        const forme = () => polygone(cx, cy, r, 6, t * 8)
        g.fillStyle = 'rgba(255, 210, 58, 0.4)'
        g.beginPath()
        forme()
        g.fill()
        neon(forme, OR, 0.35 * s)
        continue
      }
      const r = C.tir.rayon * s
      // Une courte traînée derrière le rond.
      g.strokeStyle = 'rgba(25, 242, 255, 0.25)'
      g.lineWidth = r * 1.2
      g.lineCap = 'round'
      g.beginPath()
      g.moveTo(cx, cy)
      g.lineTo(cx - (tir.vx / v) * 3 * s, cy - (tir.vy / v) * 3 * s)
      g.stroke()
      g.fillStyle = 'rgba(25, 242, 255, 0.5)'
      g.beginPath()
      cercle(cx, cy, r)
      g.fill()
      neon(() => cercle(cx, cy, r), CYAN, 0.28 * s)
    }
  }

  function dessinerLesEffets(dt: number): void {
    // Les ondes de choc : un anneau d'or qui s'ouvre.
    for (const o of [...ondes]) {
      const u = (e.t - o.t) / o.duree
      if (u >= 1) {
        ondes.splice(ondes.indexOf(o), 1)
        continue
      }
      const r = o.rayon * s * (0.2 + 0.8 * Math.sqrt(u))
      neon(() => cercle(sx(0), sy(0), r), o.couleur, 0.5 * s * (1 - u), 1 - u * 0.5)
    }
    // Le flash d'une parade, sur la chose parée.
    for (const f of [...flashs]) {
      const u = (e.t - f.t) / 0.3
      if (u >= 1) {
        flashs.splice(flashs.indexOf(f), 1)
        continue
      }
      const r = (3 + 6 * u) * s
      neon(() => cercle(sx(f.x), sy(f.y), r), f.parfaite ? OR : '#ffffff', 0.35 * s * (1 - u), 1 - u)
    }
    // Les éclats.
    g.save()
    g.globalCompositeOperation = 'lighter'
    for (const p of [...eclats]) {
      p.vie += dt * 1000
      if (p.vie >= p.duree) {
        eclats.splice(eclats.indexOf(p), 1)
        continue
      }
      p.x += p.vx * dt
      p.y += p.vy * dt
      p.vx *= 0.96
      p.vy *= 0.96
      g.globalAlpha = 1 - p.vie / p.duree
      g.fillStyle = p.couleur
      g.beginPath()
      cercle(sx(p.x), sy(p.y), p.taille * s)
      g.fill()
    }
    g.restore()
    g.globalAlpha = 1
    // Les chiffres, qui montent et s'effacent.
    g.textAlign = 'center'
    g.textBaseline = 'middle'
    for (const c of [...chiffres]) {
      c.vie += dt
      if (c.vie >= 0.9) {
        chiffres.splice(chiffres.indexOf(c), 1)
        continue
      }
      const u = c.vie / 0.9
      g.globalAlpha = u < 0.7 ? 1 : 1 - (u - 0.7) / 0.3
      g.font = `${c.gros ? 900 : 700} ${(c.gros ? 2.6 : 2) * s}px Orbitron, sans-serif`
      g.fillStyle = c.couleur
      g.shadowColor = c.couleur
      g.shadowBlur = 0.8 * s
      g.fillText(c.texte, sx(c.x), sy(c.y) - u * 7 * s)
    }
    g.shadowBlur = 0
    g.globalAlpha = 1
  }

  function dessinerLaBanniere(): void {
    if (banniere === null) return
    const u = (e.t - banniere.t) / 1.6
    if (u >= 1 && e.phase !== 'choix') {
      banniere = null
      return
    }
    g.globalAlpha = Math.min(1, u * 6, (1 - u) * 3)
    g.font = `900 ${5 * s}px Orbitron, sans-serif`
    g.textAlign = 'center'
    g.textBaseline = 'middle'
    g.fillStyle = '#ff2bd6'
    g.shadowColor = '#ff2bd6'
    g.shadowBlur = 2 * s
    g.fillText(banniere.texte, canvas.width / 2, canvas.height * 0.3)
    g.shadowBlur = 0
    g.globalAlpha = 1
  }

  // ---------------------------------------------------------------- la boucle

  let precedent = performance.now()
  let reste = 0
  function image(ms: number): void {
    let dt = Math.min(0.05, (ms - precedent) / 1000)
    precedent = ms
    const maintenant = ms / 1000
    if (maintenant < ralenti.jusqua) dt *= ralenti.facteur
    if (enJeu) {
      reste += dt
      let n = 0
      while (reste >= PAS && n < 16) {
        for (const x of avancer(C, e, PAS, vue())) vivre(x)
        reste -= PAS
        n += 1
      }
    }
    // La secousse et le flash rouge s'amortissent.
    secousse = Math.max(0, secousse - dt * 2.5)
    secousseX = (Math.random() - 0.5) * secousse * 1.2 * s
    secousseY = (Math.random() - 0.5) * secousse * 1.2 * s
    flashRouge = Math.max(0, flashRouge - dt * 3)

    dessinerLeFond()
    dessinerLesTirs(maintenant)
    dessinerLesEnnemis(maintenant)
    dessinerLesProjectiles(maintenant)
    dessinerLeCercle(maintenant)
    dessinerLesEffets(dt)
    dessinerLaBanniere()
    if (flashRouge > 0) {
      g.fillStyle = `rgba(255, 77, 109, ${0.35 * flashRouge})`
      g.fillRect(0, 0, canvas.width, canvas.height)
    }

    // Le haut.
    haut.hidden = !enJeu && e.phase !== 'perdu' && e.phase !== 'choix'
    if (enJeu) {
      remplie.style.width = `${Math.min(100, (100 * e.xp) / e.xpSuivant)}%`
      abattusTexte.textContent = `${e.abattus}`
      niveauTexte.textContent = `NIV ${e.niveau}${e.niveauxDus > 0 ? ' \u25B2' : ''}`
    }
    requestAnimationFrame(image)
  }
  cadrer()
  majHaut()
  requestAnimationFrame(image)
}

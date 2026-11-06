/**
 * LES ENVAHISSEURS À L'ÉCRAN — `?invaders`, un side project (Keko, 06/11 :
 * « juste pour le fun et l'exploration »). Un canvas en portrait : les règles
 * (`logic/invaders/jeu.ts`) avancent par pas fixes, l'écran les dessine.
 *
 * Les visuels viennent du générateur d'icônes (Keko : « les vaisseaux
 * engendrés ») : le vaisseau du joueur est un chasseur humain, chaque vague
 * une race (alien, puis biologique, en alternance) et ses lignes des rôles
 * différents, la soucoupe une station alien, les abris des astéroïdes. Le
 * dessin est rendu une fois en image, puis posé au canvas.
 *
 * Au doigt : le vaisseau suit le doigt de côté et tire tout seul ; à la
 * souris, il suit le pointeur.
 */
import './invaders.css'
import type { Race } from '../../logic/procgen/index.ts'
import { avancer, HAUTEUR, INVADERS as C, LARGEUR, nouvellePartie, positionDe, vitesseDeMarche, type EtatInvaders, type EvenementInvaders } from '../../logic/invaders/jeu.ts'
import { ecrireRecord, lireRecord, sprite } from './commun.ts'
import { ouvrirLeSon, sonAbri, sonExplosion, sonPas, sonPerdu, sonSoucoupe, sonTir, sonTouche, sonVague } from './sons.ts'

const PAS = 1000 / 60
const CLE_RECORD = 'keko-invaders-record'

// ---------------------------------------------------------------- les sprites

/** La race d'une vague : alien, puis biologique, en alternance. */
function raceDeLaVague(vague: number): Race {
  return vague % 2 === 1 ? 'alien' : 'biologique'
}

/** Le dessin d'une ligne : combat en haut, minage en bas ; un id par vague et par ligne. */
function spriteDeLaLigne(vague: number, ligne: number): HTMLImageElement | null {
  return sprite(ligne < 2 ? 'combat' : 'minage', `vague${vague}-ligne${ligne < 1 ? 0 : ligne < 3 ? 1 : 2}`, raceDeLaVague(vague))
}

/** Charge d'avance les sprites d'une vague. */
function prechargerLaVague(vague: number): void {
  for (let l = 0; l < C.lignes; l++) spriteDeLaLigne(vague, l)
}

// ---------------------------------------------------------------- les éclats

type Eclat = { x: number; y: number; vx: number; vy: number; vie: number; duree: number; couleur: string; taille: number }
type Texte = { x: number; y: number; texte: string; vie: number; couleur: string }
type Onde = { x: number; y: number; vie: number; duree: number; rayon: number; couleur: string }

const COULEURS_DES_LIGNES = ['#ff6bd6', '#b78bff', '#b78bff', '#6bf0ff', '#6bf0ff']

export function monterInvaders(racine: HTMLElement, build: string): void {
  document.documentElement.classList.add('invaders-page')
  racine.classList.add('invaders')
  const canvas = document.createElement('canvas')
  canvas.className = 'invaders-canvas'
  const ecran = document.createElement('div')
  ecran.className = 'invaders-ecran'
  const pied = document.createElement('div')
  pied.className = 'invaders-build'
  pied.textContent = `build ${build}`
  racine.append(canvas, ecran, pied)
  const g = canvas.getContext('2d')!

  let etat: EtatInvaders = nouvellePartie(C, 1)
  let enJeu = false
  let record = lireRecord(CLE_RECORD)
  let cibleX: number | null = null
  let accumule = 0
  let avant = performance.now()
  let secousse = 0
  let flashRouge = 0
  let annonce: { texte: string; vie: number } | null = null
  let perduA = 0
  let prochainPas = 0
  const eclats: Eclat[] = []
  const textes: Texte[] = []
  const ondes: Onde[] = []

  // Les étoiles, sur tout l'écran (en part de sa largeur et de sa hauteur) : trois plans qui défilent vers le bas.
  const etoiles = Array.from({ length: 140 }, () => ({ u: Math.random(), v: Math.random(), plan: Math.floor(Math.random() * 3) }))

  prechargerLaVague(1)
  prechargerLaVague(2)
  const joueur = () => sprite('combat', 'keko', 'humain')
  const soucoupe = () => sprite('station', 'soucoupe', 'alien')
  const abri = (i: number) => sprite('asteroide', `abri${i}`, 'humain')
  joueur()
  soucoupe()
  for (let i = 0; i < C.abris; i++) abri(i)

  // ---------------------------------------------------------------- le cadre

  let echelle = 1
  let ox = 0
  let oy = 0
  function cadrer(): void {
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    const w = window.innerWidth
    const h = window.innerHeight
    canvas.width = Math.round(w * dpr)
    canvas.height = Math.round(h * dpr)
    canvas.style.width = `${w}px`
    canvas.style.height = `${h}px`
    // Le monde entier tient à l'écran, centré.
    echelle = Math.min(w / LARGEUR, h / HAUTEUR) * dpr
    ox = (canvas.width - LARGEUR * echelle) / 2
    oy = (canvas.height - HAUTEUR * echelle) / 2
  }
  cadrer()
  window.addEventListener('resize', cadrer)

  /** Le x du monde sous ce pointeur. */
  function xDuMonde(e: PointerEvent): number {
    const r = canvas.getBoundingClientRect()
    const dpr = canvas.width / r.width
    return ((e.clientX - r.left) * dpr - ox) / echelle
  }

  // ---------------------------------------------------------------- les gestes

  function lancer(): void {
    ouvrirLeSon()
    etat = nouvellePartie(C, (Math.random() * 2 ** 32) >>> 0)
    enJeu = true
    eclats.length = 0
    textes.length = 0
    ondes.length = 0
    annonce = { texte: 'Vague 1', vie: 1600 }
    sonVague()
    montrerLEcran()
  }

  canvas.addEventListener('pointerdown', (e) => {
    cibleX = xDuMonde(e)
    if (!enJeu || (etat.phase === 'perdu' && performance.now() - perduA > 800)) lancer()
  })
  canvas.addEventListener('pointermove', (e) => {
    // Au doigt, le mouvement ne vient que posé ; à la souris, le vaisseau suit le pointeur.
    if (e.pointerType === 'mouse' || e.buttons !== 0) cibleX = xDuMonde(e)
  })
  const lever = (e: PointerEvent) => {
    if (e.pointerType !== 'mouse') cibleX = null
  }
  canvas.addEventListener('pointerup', lever)
  canvas.addEventListener('pointercancel', lever)
  document.addEventListener('visibilitychange', () => {
    avant = performance.now()
    accumule = 0
  })

  function montrerLEcran(): void {
    ecran.replaceChildren()
    if (enJeu && etat.phase !== 'perdu') {
      ecran.hidden = true
      return
    }
    ecran.hidden = false
    const titre = document.createElement('div')
    titre.className = 'invaders-titre'
    titre.textContent = enJeu ? 'Partie terminée' : 'Invaders'
    ecran.append(titre)
    if (enJeu) {
      const score = document.createElement('div')
      score.className = 'invaders-score-final'
      score.textContent = `${etat.score}`
      ecran.append(score)
    }
    const rec = document.createElement('div')
    rec.className = 'invaders-record'
    rec.textContent = record > 0 ? `Record : ${record}` : 'Glissez le doigt pour bouger, le tir est automatique'
    const go = document.createElement('div')
    go.className = 'invaders-go'
    go.textContent = enJeu ? 'Touchez pour rejouer' : 'Touchez pour jouer'
    ecran.append(rec, go)
  }
  montrerLEcran()

  // ---------------------------------------------------------------- ce qui arrive

  function eclater(x: number, y: number, couleur: string, n: number, force: number): void {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2
      const v = force * (0.4 + Math.random())
      eclats.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, vie: 0, duree: 350 + Math.random() * 400, couleur: Math.random() < 0.35 ? '#ffffff' : couleur, taille: 0.6 + Math.random() * 0.9 })
    }
  }

  function vivre(ev: EvenementInvaders): void {
    switch (ev.type) {
      case 'tir':
        sonTir()
        break
      case 'detruit': {
        const couleur = COULEURS_DES_LIGNES[ev.ligne] ?? '#ffffff'
        eclater(ev.x, ev.y, couleur, 16, 40)
        ondes.push({ x: ev.x, y: ev.y, vie: 0, duree: 300, rayon: 8, couleur })
        textes.push({ x: ev.x, y: ev.y, texte: `+${ev.points}`, vie: 0, couleur })
        sonExplosion()
        break
      }
      case 'abri':
        eclater(ev.x, ev.y, '#b8a48c', ev.detruit ? 18 : 4, ev.detruit ? 30 : 15)
        sonAbri()
        break
      case 'touche':
        eclater(ev.x, ev.y, '#ff5a4a', 30, 55)
        ondes.push({ x: ev.x, y: ev.y, vie: 0, duree: 500, rayon: 18, couleur: '#ff5a4a' })
        secousse = 350
        flashRouge = 250
        sonTouche()
        try {
          navigator.vibrate?.(120)
        } catch {
          // Pas de vibreur : rien.
        }
        break
      case 'soucoupe':
        eclater(ev.x, ev.y, '#ffd27a', 36, 60)
        ondes.push({ x: ev.x, y: ev.y, vie: 0, duree: 500, rayon: 16, couleur: '#ffd27a' })
        textes.push({ x: ev.x, y: ev.y + 4, texte: `+${ev.points}`, vie: 0, couleur: '#ffd27a' })
        sonSoucoupe()
        break
      case 'vague':
        annonce = { texte: `Vague ${ev.vague}`, vie: 1600 }
        prechargerLaVague(ev.vague + 1)
        sonVague()
        break
      case 'perdu':
        perduA = performance.now()
        if (ev.score > record) {
          record = ev.score
          ecrireRecord(CLE_RECORD, record)
        }
        sonPerdu()
        montrerLEcran()
        break
    }
  }

  // ---------------------------------------------------------------- la boucle

  function image(maintenant: number): void {
    const dt = Math.min(100, maintenant - avant)
    avant = maintenant
    if (enJeu) {
      accumule += dt
      while (accumule >= PAS) {
        accumule -= PAS
        const r = avancer(C, etat, PAS, { cibleX })
        etat = r.etat
        for (const ev of r.evenements) vivre(ev)
      }
      // Le pas de la formation, au rythme de sa marche.
      if (etat.phase === 'jeu' && maintenant >= prochainPas) {
        sonPas()
        prochainPas = maintenant + Math.max(110, (700 * C.marche) / vitesseDeMarche(C, etat))
      }
    }
    dessiner(dt)
    requestAnimationFrame(image)
  }
  requestAnimationFrame(image)

  // ---------------------------------------------------------------- le dessin

  function poser(img: HTMLImageElement | null, x: number, y: number, taille: number, angle = 0): boolean {
    if (img === null) return false
    g.save()
    g.translate(x, y)
    if (angle !== 0) g.rotate(angle)
    g.drawImage(img, -taille / 2, -taille / 2, taille, taille)
    g.restore()
    return true
  }

  function dessiner(dt: number): void {
    const W = canvas.width
    const H = canvas.height
    g.setTransform(1, 0, 0, 1, 0, 0)
    g.fillStyle = '#04030c'
    g.fillRect(0, 0, W, H)

    // Le monde : secoué quand le vaisseau est touché.
    let sx = 0
    let sy = 0
    if (secousse > 0) {
      secousse -= dt
      const f = (Math.max(0, secousse) / 350) * 1.6
      sx = (Math.random() - 0.5) * f
      sy = (Math.random() - 0.5) * f
    }
    // Le fond couvre tout l'écran, au-delà du monde : un dégradé de nuit, et les étoiles qui défilent.
    const fond = g.createLinearGradient(0, 0, 0, H)
    fond.addColorStop(0, '#0d0626')
    fond.addColorStop(0.6, '#070418')
    fond.addColorStop(1, '#120a1f')
    g.fillStyle = fond
    g.fillRect(0, 0, W, H)
    const point = Math.max(1, echelle * 0.25)
    for (const s of etoiles) {
      s.v += ((dt / 1000) * (3 + s.plan * 6)) / (H / echelle)
      if (s.v > 1) {
        s.v -= 1
        s.u = Math.random()
      }
      g.fillStyle = ['rgba(255,255,255,0.35)', 'rgba(200,220,255,0.6)', 'rgba(255,255,255,0.95)'][s.plan]
      const t = point * (1 + s.plan * 0.8)
      g.fillRect(s.u * W, s.v * H, t, t)
    }
    g.setTransform(echelle, 0, 0, echelle, ox + sx * echelle, oy + sy * echelle)
    g.save()

    const e = etat
    const t = e.t

    // Les abris : un astéroïde qui rétrécit à mesure qu'on l'use.
    e.abris.forEach((a, i) => {
      if (a.pv <= 0) return
      const r = C.abriRayon * (0.45 + (0.55 * a.pv) / C.abriPv)
      if (!poser(abri(i), a.x, a.y, 2.3 * r, i + t / 4000)) {
        g.fillStyle = '#6b5a48'
        g.beginPath()
        g.arc(a.x, a.y, r, 0, Math.PI * 2)
        g.fill()
      }
    })

    // La formation : chaque envahisseur se dandine au rythme de la marche, le nez vers le bas.
    if (e.phase !== 'entreVagues') {
      for (const n of e.ennemis) {
        if (!n.vivant) continue
        const p = positionDe(C, e, n)
        const dandine = Math.sin(t / 180 + n.colonne * 0.9 + n.ligne * 1.7) * 0.14
        if (!poser(spriteDeLaLigne(e.vague, n.ligne), p.x, p.y, 2.4 * C.rayon, Math.PI + dandine)) {
          g.fillStyle = COULEURS_DES_LIGNES[n.ligne]
          g.fillRect(p.x - C.rayon, p.y - C.rayon, 2 * C.rayon, 2 * C.rayon)
        }
      }
    }

    // La soucoupe, qui tourne sur elle-même.
    if (e.soucoupe !== null) poser(soucoupe(), e.soucoupe.x, C.soucoupeY, 13, t / 600)

    // Les tirs : un trait clair et sa lueur pour le joueur, un losange orange pour l'ennemi.
    g.globalCompositeOperation = 'lighter'
    for (const s of e.tirs) {
      if (s.ami) {
        g.fillStyle = 'rgba(90,220,255,0.35)'
        g.fillRect(s.x - 0.9, s.y - 2.6, 1.8, 5.2)
        g.fillStyle = '#e8fbff'
        g.fillRect(s.x - 0.35, s.y - 2.2, 0.7, 4.4)
      } else {
        g.fillStyle = 'rgba(255,120,40,0.4)'
        g.beginPath()
        g.ellipse(s.x, s.y, 1.4, 2.6, 0, 0, Math.PI * 2)
        g.fill()
        g.fillStyle = '#ffd9a0'
        g.beginPath()
        g.moveTo(s.x, s.y - 2)
        g.lineTo(s.x + 0.7, s.y)
        g.lineTo(s.x, s.y + 2)
        g.lineTo(s.x - 0.7, s.y)
        g.fill()
      }
    }
    g.globalCompositeOperation = 'source-over'

    // Le vaisseau : il clignote tant qu'il ne craint rien ; perdu, il a sauté.
    const clignote = t < e.joueur.invincibleJusqua && Math.floor(t / 90) % 2 === 0
    if (e.phase !== 'perdu' && !clignote) {
      // La flamme des moteurs, sous lui.
      g.globalCompositeOperation = 'lighter'
      g.fillStyle = `rgba(90,200,255,${0.35 + 0.25 * Math.random()})`
      g.beginPath()
      g.ellipse(e.joueur.x, C.joueurY + 5.2, 1.3, 2 + Math.random(), 0, 0, Math.PI * 2)
      g.fill()
      g.globalCompositeOperation = 'source-over'
      if (!poser(joueur(), e.joueur.x, C.joueurY, 11)) {
        g.fillStyle = '#9fe8ff'
        g.fillRect(e.joueur.x - C.joueurDemi, C.joueurY - 3, 2 * C.joueurDemi, 6)
      }
    }

    // Les éclats, les ondes et les points.
    g.globalCompositeOperation = 'lighter'
    for (let i = ondes.length - 1; i >= 0; i--) {
      const o = ondes[i]
      o.vie += dt
      const k = o.vie / o.duree
      if (k >= 1) {
        ondes.splice(i, 1)
        continue
      }
      g.strokeStyle = o.couleur
      g.globalAlpha = 1 - k
      g.lineWidth = 0.8 * (1 - k) + 0.2
      g.beginPath()
      g.arc(o.x, o.y, o.rayon * (0.3 + 0.7 * Math.sqrt(k)), 0, Math.PI * 2)
      g.stroke()
    }
    for (let i = eclats.length - 1; i >= 0; i--) {
      const p = eclats[i]
      p.vie += dt
      if (p.vie >= p.duree) {
        eclats.splice(i, 1)
        continue
      }
      const s = dt / 1000
      p.x += p.vx * s
      p.y += p.vy * s
      p.vx *= 0.93
      p.vy *= 0.93
      g.globalAlpha = 1 - p.vie / p.duree
      g.fillStyle = p.couleur
      g.fillRect(p.x - p.taille / 2, p.y - p.taille / 2, p.taille, p.taille)
    }
    g.globalAlpha = 1
    g.globalCompositeOperation = 'source-over'
    g.textAlign = 'center'
    g.textBaseline = 'middle'
    for (let i = textes.length - 1; i >= 0; i--) {
      const x = textes[i]
      x.vie += dt
      if (x.vie >= 700) {
        textes.splice(i, 1)
        continue
      }
      g.globalAlpha = 1 - x.vie / 700
      g.font = '900 4px Orbitron, sans-serif'
      g.fillStyle = x.couleur
      g.fillText(x.texte, x.x, x.y - (x.vie / 700) * 6)
    }
    g.globalAlpha = 1

    // L'annonce de la vague, au milieu.
    if (annonce !== null) {
      annonce.vie -= dt
      if (annonce.vie <= 0) annonce = null
      else {
        g.globalAlpha = Math.min(1, annonce.vie / 400)
        g.font = '900 9px Orbitron, sans-serif'
        g.fillStyle = '#ffffff'
        g.shadowColor = '#8a5cff'
        g.shadowBlur = 12
        g.fillText(annonce.texte, LARGEUR / 2, HAUTEUR * 0.45)
        g.shadowBlur = 0
        g.globalAlpha = 1
      }
    }

    // Le flash rouge du vaisseau touché.
    if (flashRouge > 0) {
      flashRouge -= dt
      g.fillStyle = `rgba(255,40,30,${(0.28 * Math.max(0, flashRouge)) / 250})`
      g.fillRect(-LARGEUR, -HAUTEUR, 3 * LARGEUR, 3 * HAUTEUR)
    }
    g.restore()

    // L'en-tête : le score, la vague, les vies.
    if (enJeu) {
      g.font = '700 4.2px Orbitron, sans-serif'
      g.textBaseline = 'top'
      g.fillStyle = '#ffffff'
      g.textAlign = 'left'
      g.fillText(String(e.score), 3, 3)
      g.textAlign = 'center'
      g.fillStyle = 'rgba(255,255,255,0.6)'
      g.fillText(`Vague ${e.vague}`, LARGEUR / 2, 3)
      for (let i = 0; i < Math.max(0, e.vies); i++) poser(joueur(), LARGEUR - 5 - i * 6, 5, 5)
    }
  }
}

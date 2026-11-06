/**
 * LA TOURELLE À L'ÉCRAN — `?tourelle`, la variante où l'on ne bouge pas (Keko,
 * 06/11). Votre vaisseau, en bas au milieu, pivote vers l'ennemi le plus
 * proche et tire seul ; les vaisseaux engendrés foncent sur lui ; entre deux
 * vagues, trois améliorations au choix. Les règles sont dans
 * `logic/invaders/tourelle.ts` ; l'écran les fait avancer par pas fixes et
 * les dessine.
 */
import './invaders.css'
import type { Famille, Race } from '../../logic/procgen/index.ts'
import { HAUTEUR, LARGEUR } from '../../logic/invaders/jeu.ts'
import { AMELIORATIONS, avancerTourelle, choisir, nouvelleTourelle, pvMaxDe, TOURELLE as C, type EtatTourelle, type EvenementTourelle, type TypeEnnemi } from '../../logic/invaders/tourelle.ts'
import { ecrireRecord, lireRecord, sprite } from './commun.ts'
import { ouvrirLeSon, sonAbri, sonExplosion, sonPerdu, sonTir, sonTouche, sonVague } from './sons.ts'

const PAS = 1000 / 60
const CLE_RECORD = 'keko-tourelle-record'

/** Chaque type a sa silhouette : chasseurs légers, vaisseaux de minage, et la brute en station. */
const FAMILLE_DU_TYPE: Record<TypeEnnemi, Famille> = { eclaireur: 'combat', soldat: 'combat', plongeur: 'minage', brute: 'station' }
const COULEUR_DU_TYPE: Record<TypeEnnemi, string> = { eclaireur: '#6bf0ff', soldat: '#b78bff', plongeur: '#ff6bd6', brute: '#ffb35a' }

/** La race d'une vague : alien, puis biologique, en alternance ; un dessin neuf par vague. */
function spriteDe(type: TypeEnnemi, vague: number): HTMLImageElement | null {
  const race: Race = vague % 2 === 1 ? 'alien' : 'biologique'
  return sprite(FAMILLE_DU_TYPE[type], `tourelle-${type}-v${vague}`, race)
}

function prechargerLaVague(vague: number): void {
  for (const t of Object.keys(FAMILLE_DU_TYPE) as TypeEnnemi[]) spriteDe(t, vague)
}

type Eclat = { x: number; y: number; vx: number; vy: number; vie: number; duree: number; couleur: string; taille: number }
type Texte = { x: number; y: number; texte: string; vie: number; couleur: string; taille: number }
type Onde = { x: number; y: number; vie: number; duree: number; rayon: number; couleur: string }

export function monterTourelle(racine: HTMLElement, build: string): void {
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

  let etat: EtatTourelle = nouvelleTourelle(C, 1)
  let enJeu = false
  let record = lireRecord(CLE_RECORD)
  let accumule = 0
  let avant = performance.now()
  let secousse = 0
  let flashRouge = 0
  let dernierSonTir = 0
  let annonce: { texte: string; vie: number } | null = null
  let perduA = 0
  const eclats: Eclat[] = []
  const textes: Texte[] = []
  const ondes: Onde[] = []
  const etoiles = Array.from({ length: 140 }, () => ({ u: Math.random(), v: Math.random(), plan: Math.floor(Math.random() * 3) }))

  prechargerLaVague(1)
  prechargerLaVague(2)
  const tourelle = () => sprite('combat', 'keko', 'humain')
  tourelle()

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
    echelle = Math.min(w / LARGEUR, h / HAUTEUR) * dpr
    ox = (canvas.width - LARGEUR * echelle) / 2
    oy = (canvas.height - HAUTEUR * echelle) / 2
  }
  cadrer()
  window.addEventListener('resize', cadrer)

  // ---------------------------------------------------------------- les écrans

  function lancer(): void {
    ouvrirLeSon()
    etat = nouvelleTourelle(C, (Math.random() * 2 ** 32) >>> 0)
    enJeu = true
    eclats.length = 0
    textes.length = 0
    ondes.length = 0
    annonce = { texte: 'Vague 1', vie: 1600 }
    sonVague()
    montrerLEcran()
  }

  canvas.addEventListener('pointerdown', () => {
    if (!enJeu || (etat.phase === 'perdu' && performance.now() - perduA > 800)) lancer()
  })
  document.addEventListener('visibilitychange', () => {
    avant = performance.now()
    accumule = 0
  })

  function div(classe: string, texte: string): HTMLDivElement {
    const d = document.createElement('div')
    d.className = classe
    d.textContent = texte
    return d
  }

  function montrerLEcran(): void {
    ecran.replaceChildren()
    ecran.classList.remove('invaders-ecran-choix')
    if (enJeu && etat.phase === 'vague') {
      ecran.hidden = true
      return
    }
    ecran.hidden = false
    if (enJeu && etat.phase === 'choix') {
      // LE CHOIX ENTRE DEUX VAGUES : trois cartes, une tape en prend une.
      ecran.classList.add('invaders-ecran-choix')
      ecran.append(div('invaders-sous-titre', `Vague ${etat.vague} tenue`), div('invaders-consigne', 'Choisissez une amélioration'))
      const liste = document.createElement('div')
      liste.className = 'invaders-offre'
      etat.offre.forEach((cle, i) => {
        const a = AMELIORATIONS[cle]
        const b = document.createElement('button')
        b.type = 'button'
        b.className = 'invaders-choix'
        const rang = etat.rangs[cle]
        b.append(div('invaders-choix-nom', a.nom), div('invaders-choix-effet', a.effet))
        if (cle !== 'soin') b.append(div('invaders-choix-rang', rang > 0 ? `Niveau ${rang} → ${rang + 1}${a.max !== undefined ? ` / ${a.max}` : ''}` : 'Nouveau'))
        b.addEventListener('click', () => {
          const r = choisir(C, etat, i)
          etat = r.etat
          for (const ev of r.evenements) vivre(ev)
          montrerLEcran()
        })
        liste.append(b)
      })
      ecran.append(liste)
      return
    }
    ecran.append(div('invaders-titre', enJeu ? `Vague ${etat.vague}` : 'Tourelle'))
    if (enJeu) ecran.append(div('invaders-score-final', `${etat.score}`))
    ecran.append(
      div('invaders-record', record > 0 ? `Record : vague ${record}` : 'Votre tourelle tire toute seule. Entre deux vagues, choisissez une amélioration.'),
      div('invaders-go', enJeu ? 'Touchez pour rejouer' : 'Touchez pour jouer'),
    )
  }
  montrerLEcran()

  // ---------------------------------------------------------------- ce qui arrive

  function eclater(x: number, y: number, couleur: string, n: number, force: number): void {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2
      const v = force * (0.4 + Math.random())
      eclats.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, vie: 0, duree: 300 + Math.random() * 400, couleur: Math.random() < 0.35 ? '#ffffff' : couleur, taille: 0.5 + Math.random() * 0.8 })
    }
  }

  function vivre(ev: EvenementTourelle): void {
    switch (ev.type) {
      case 'tir': {
        // Le tir part souvent : un son au plus toutes les 90 ms.
        const now = performance.now()
        if (now - dernierSonTir > 90) {
          sonTir()
          dernierSonTir = now
        }
        break
      }
      case 'touche':
        eclater(ev.x, ev.y, ev.critique ? '#ffd27a' : '#bdf4ff', ev.critique ? 6 : 2, 18)
        if (ev.critique) textes.push({ x: ev.x, y: ev.y - 2, texte: '×2', vie: 0, couleur: '#ffd27a', taille: 3 })
        break
      case 'explosion':
        ondes.push({ x: ev.x, y: ev.y, vie: 0, duree: 260, rayon: ev.rayon, couleur: '#ff9a3c' })
        break
      case 'detruit': {
        const couleur = COULEUR_DU_TYPE[ev.ennemi]
        eclater(ev.x, ev.y, couleur, ev.ennemi === 'brute' ? 30 : 14, ev.ennemi === 'brute' ? 50 : 38)
        ondes.push({ x: ev.x, y: ev.y, vie: 0, duree: 300, rayon: ev.ennemi === 'brute' ? 14 : 8, couleur })
        textes.push({ x: ev.x, y: ev.y, texte: `+${ev.points}`, vie: 0, couleur, taille: 3.6 })
        sonExplosion()
        break
      }
      case 'choc':
        if (ev.bouclier) {
          ondes.push({ x: C.x, y: C.y, vie: 0, duree: 450, rayon: 14, couleur: '#7fd8ff' })
          eclater(ev.x, ev.y, '#7fd8ff', 16, 35)
          sonAbri()
        } else {
          eclater(ev.x, ev.y, '#ff5a4a', 24, 50)
          ondes.push({ x: C.x, y: C.y, vie: 0, duree: 450, rayon: 16, couleur: '#ff5a4a' })
          secousse = 300
          flashRouge = 220
          sonTouche()
          try {
            navigator.vibrate?.(80)
          } catch {
            // Pas de vibreur : rien.
          }
        }
        break
      case 'finDeVague':
        sonVague()
        prechargerLaVague(ev.vague + 1)
        // Le choix s'ouvre une fois la vague affichée finie.
        setTimeout(montrerLEcran, 450)
        break
      case 'vague':
        annonce = { texte: `Vague ${ev.vague}`, vie: 1400 }
        prechargerLaVague(ev.vague + 1)
        break
      case 'perdu':
        perduA = performance.now()
        if (ev.vague > record) {
          record = ev.vague
          ecrireRecord(CLE_RECORD, record)
        }
        eclater(C.x, C.y, '#ffd27a', 60, 70)
        sonPerdu()
        setTimeout(montrerLEcran, 600)
        break
    }
  }

  // ---------------------------------------------------------------- la boucle

  function image(maintenant: number): void {
    const dt = Math.min(100, maintenant - avant)
    avant = maintenant
    if (enJeu && etat.phase === 'vague') {
      accumule += dt
      while (accumule >= PAS && etat.phase === 'vague') {
        accumule -= PAS
        const r = avancerTourelle(C, etat, PAS)
        etat = r.etat
        for (const ev of r.evenements) vivre(ev)
      }
    } else accumule = 0
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
    const fond = g.createLinearGradient(0, 0, 0, H)
    fond.addColorStop(0, '#0d0626')
    fond.addColorStop(0.6, '#070418')
    fond.addColorStop(1, '#160a1c')
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

    let sx = 0
    let sy = 0
    if (secousse > 0) {
      secousse -= dt
      const f = (Math.max(0, secousse) / 300) * 1.4
      sx = (Math.random() - 0.5) * f
      sy = (Math.random() - 0.5) * f
    }
    g.setTransform(echelle, 0, 0, echelle, ox + sx * echelle, oy + sy * echelle)

    const e = etat
    const t = e.t

    // Le sol de la tourelle : une lueur sous elle.
    const lueur = g.createRadialGradient(C.x, C.y, 0, C.x, C.y, 22)
    lueur.addColorStop(0, 'rgba(90,200,255,0.22)')
    lueur.addColorStop(1, 'rgba(90,200,255,0)')
    g.fillStyle = lueur
    g.fillRect(C.x - 22, C.y - 22, 44, 44)

    // Les ennemis, le nez vers la tourelle, une barre de PV dès qu'ils sont touchés.
    for (const n of e.ennemis) {
      const r = C.ennemis[n.type].rayon
      const angle = Math.atan2(C.x - n.x, -(C.y - n.y))
      const taille = n.type === 'brute' ? 3 * r : 2.7 * r
      const tourne = n.type === 'brute' ? t / 900 : angle
      if (!poser(spriteDe(n.type, n.vague), n.x, n.y, taille, tourne)) {
        g.fillStyle = COULEUR_DU_TYPE[n.type]
        g.beginPath()
        g.arc(n.x, n.y, r, 0, Math.PI * 2)
        g.fill()
      }
      if (n.pv < n.pvMax) {
        const l = 2 * r
        g.fillStyle = 'rgba(0,0,0,0.6)'
        g.fillRect(n.x - l / 2, n.y - r - 2.2, l, 0.9)
        g.fillStyle = COULEUR_DU_TYPE[n.type]
        g.fillRect(n.x - l / 2, n.y - r - 2.2, (l * Math.max(0, n.pv)) / n.pvMax, 0.9)
      }
    }

    // Les projectiles : un trait lumineux dans le sens du vol.
    g.globalCompositeOperation = 'lighter'
    g.lineCap = 'round'
    for (const p of e.projectiles) {
      const v = Math.hypot(p.vx, p.vy) || 1
      const ux = p.vx / v
      const uy = p.vy / v
      g.strokeStyle = 'rgba(90,220,255,0.45)'
      g.lineWidth = 1.6
      g.beginPath()
      g.moveTo(p.x - ux * 3, p.y - uy * 3)
      g.lineTo(p.x + ux, p.y + uy)
      g.stroke()
      g.strokeStyle = '#effcff'
      g.lineWidth = 0.6
      g.beginPath()
      g.moveTo(p.x - ux * 2.4, p.y - uy * 2.4)
      g.lineTo(p.x + ux * 0.8, p.y + uy * 0.8)
      g.stroke()
    }
    g.globalCompositeOperation = 'source-over'

    // La tourelle : votre vaisseau, qui pivote vers sa cible ; le bouclier autour d'elle.
    if (e.phase !== 'perdu') {
      if (e.bouclier > 0) {
        g.strokeStyle = `rgba(127,216,255,${0.55 + 0.2 * Math.sin(t / 200)})`
        g.lineWidth = 0.7
        g.beginPath()
        g.arc(C.x, C.y, C.rayon + 4, 0, Math.PI * 2)
        g.stroke()
      }
      if (!poser(tourelle(), C.x, C.y, 13, e.angle)) {
        g.fillStyle = '#9fe8ff'
        g.beginPath()
        g.arc(C.x, C.y, C.rayon, 0, Math.PI * 2)
        g.fill()
      }
    }

    // Les éclats, les ondes, les points.
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
      g.font = `900 ${x.taille}px Orbitron, sans-serif`
      g.fillStyle = x.couleur
      g.fillText(x.texte, x.x, x.y - (x.vie / 700) * 6)
    }
    g.globalAlpha = 1

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

    if (flashRouge > 0) {
      flashRouge -= dt
      g.fillStyle = `rgba(255,40,30,${(0.28 * Math.max(0, flashRouge)) / 220})`
      g.fillRect(-LARGEUR, -HAUTEUR, 3 * LARGEUR, 3 * HAUTEUR)
    }

    // L'en-tête : le score, la vague ; la barre de PV sous la tourelle.
    if (enJeu) {
      g.font = '700 4.2px Orbitron, sans-serif'
      g.textBaseline = 'top'
      g.textAlign = 'left'
      g.fillStyle = '#ffffff'
      g.fillText(String(e.score), 3, 3)
      g.textAlign = 'right'
      g.fillStyle = 'rgba(255,255,255,0.6)'
      g.fillText(`Vague ${e.vague}`, LARGEUR - 3, 3)
      const max = pvMaxDe(C, e)
      const l = 30
      const y = C.y + 9
      g.fillStyle = 'rgba(0,0,0,0.55)'
      g.fillRect(C.x - l / 2 - 0.4, y - 0.4, l + 0.8, 2.3)
      const part = Math.max(0, e.pv) / max
      g.fillStyle = part > 0.5 ? '#5dea8c' : part > 0.25 ? '#ffd27a' : '#ff5a4a'
      g.fillRect(C.x - l / 2, y, l * part, 1.5)
      g.font = '700 2.4px Orbitron, sans-serif'
      g.textAlign = 'center'
      g.fillStyle = 'rgba(255,255,255,0.85)'
      g.fillText(`${Math.ceil(Math.max(0, e.pv))} / ${max}`, C.x, y + 2.6)
    }
  }
}

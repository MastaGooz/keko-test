/**
 * LA COMMANDE ACTION À L'ÉCRAN — `?commande`, un side project (Keko, 07/11 :
 * « un jeu à commande action, style Paper Mario »). Une scène de théâtre vue
 * de côté : le héros à gauche, l'ennemi à droite ; le menu des attaques, la
 * consigne, les jauges et les écrans sont du DOM, le reste est un canvas.
 *
 * Les gestes portent l'horodatage de leur événement (`timeStamp`, la même
 * horloge que `performance.now()`) : la règle juge l'instant où le doigt
 * s'est posé, pas celui où la page l'a traité. Au clavier : espace (ou
 * Entrée) pour le geste, 1 et 2 pour les attaques.
 */
import './commande.css'
import {
  avancer,
  BONUS,
  choisir,
  COMMANDE as C,
  ennemiDe,
  lacher,
  nouveauCombat,
  peutAttaquer,
  prendre,
  pvMaxDe,
  rangDuBonus,
  toucher,
  type Attaque,
  type Bonus,
  type EtatCombat,
  type Evenement,
  type TypeEnnemi,
} from '../../logic/commande/combat.ts'
import { ecrireRecord, lireRecord, sprite } from '../invaders/commun.ts'
import {
  ouvrirLeSon,
  sonArrivee,
  sonAtterrit,
  sonBien,
  sonBlesse,
  sonButin,
  sonChef,
  sonGarde,
  sonKo,
  sonMarteau,
  sonPerdu,
  sonPleine,
  sonRate,
  sonRuee,
} from './sons.ts'

/** La scène : le héros et l'ennemi, en unités ; le sol est à y = 0, y monte. */
const X_HEROS = -21
const X_ENNEMI = 19
const TAILLE = 17
/** La hauteur où vole le Lutin ailé. */
const VOL = 10
/** Où le héros prend son élan pour sauter, et où il se tient pour frapper au marteau. */
const X_ELAN = X_ENNEMI - 15
const X_MARTEAU = X_ENNEMI - 12

/** Les personnages du générateur, comme ceux du survivor. */
const ID_HEROS = 'survivant'
const ID_ENNEMI: Record<TypeEnnemi, string> = { brigand: 'heros-12', piques: 'heros-17', lutin: 'heros-14', brute: 'heros-16', chapardeur: 'monstre-0' }
/** Un chef est plus grand. */
const TAILLE_CHEF = 1.3
const CLE_RECORD = 'keko-commande-record'

const clamp = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u)
const lisse = (u: number) => {
  const v = clamp(u)
  return v * v * (3 - 2 * v)
}
const melange = (a: number, b: number, u: number) => a + (b - a) * u
/** Une cloche de hauteur `haut` sur u de 0 à 1. */
const cloche = (haut: number, u: number) => 4 * haut * u * (1 - u)

type Pose = { x: number; y: number; regard: 1 | -1; vole: boolean; court: boolean }
type Eclat = { x: number; y: number; vx: number; vy: number; vie: number; duree: number; couleur: string; taille: number }
type Bulle = { x: number; y: number; texte: string; couleur: string; taille: number; vie: number; duree: number }

/** L'instant d'un geste, en secondes : son horodatage s'il est sur la bonne horloge. */
function instant(ev: Event): number {
  const n = performance.now()
  const t = ev.timeStamp
  return (t > 0 && t <= n + 1 ? t : n) / 1000
}

export function monterCommande(racine: HTMLElement, build: string): void {
  document.documentElement.classList.add('commande-page')
  racine.classList.add('commande')
  const canvas = document.createElement('canvas')
  canvas.className = 'commande-canvas'
  const g = canvas.getContext('2d')!

  function el<K extends keyof HTMLElementTagNameMap>(tag: K, classe: string, texte = ''): HTMLElementTagNameMap[K] {
    const n = document.createElement(tag)
    n.className = classe
    n.textContent = texte
    return n
  }

  // En haut : le héros et l'ennemi, chacun sa jauge.
  const haut = el('div', 'commande-haut')
  function camp(classe: string): { nom: HTMLDivElement; detail: HTMLDivElement; remplie: HTMLDivElement; bloc: HTMLDivElement } {
    const bloc = el('div', `commande-camp ${classe}`)
    const nom = el('div', 'commande-nom')
    const jauge = el('div', 'commande-jauge')
    const remplie = el('div', 'commande-jauge-remplie')
    jauge.append(remplie)
    const detail = el('div', '')
    bloc.append(nom, jauge, detail)
    return { nom, detail, remplie, bloc }
  }
  const campHeros = camp('commande-camp-heros')
  const campEnnemi = camp('commande-camp-ennemi')
  campHeros.nom.textContent = 'Héros'
  haut.append(campHeros.bloc, campEnnemi.bloc)

  const consigne = el('div', 'commande-consigne')
  const menu = el('div', 'commande-menu')
  function bouton(a: Attaque, nom: string): { b: HTMLButtonElement; geste: HTMLSpanElement } {
    const b = el('button', 'commande-attaque')
    b.type = 'button'
    const geste = el('span', 'commande-attaque-geste')
    b.append(el('span', 'commande-attaque-nom', nom), geste)
    b.addEventListener('click', () => attaquer(a))
    menu.append(b)
    return { b, geste }
  }
  const boutonSaut = bouton('saut', 'Saut')
  const boutonMarteau = bouton('marteau', 'Marteau')
  boutonSaut.geste.textContent = 'Touchez à chaque atterrissage'

  const ecran = el('div', 'commande-ecran')
  const pied = el('div', 'commande-build', `build ${build}`)
  racine.append(canvas, haut, consigne, menu, ecran, pied)

  const horloge = () => performance.now() / 1000
  let e: EtatCombat = nouveauCombat(C, 1, horloge())
  let enJeu = false
  /** L'instant où l'écran de fin accepte une tape (pas celle qui tombait déjà). */
  let rejouableA = 0
  const eclats: Eclat[] = []
  const bulles: Bulle[] = []
  let flashHeros = 0
  let flashEnnemi = 0
  let ecrase = 0
  let flashRouge = 0
  let flashOr = 0
  let secousse = 0
  /** Les ruées déjà sifflées dans ce tour. */
  let rueesSifflees = 0

  const imageHeros = () => sprite('perso-pixel', ID_HEROS, 'humain')
  const imageEnnemi = (type: TypeEnnemi) => sprite('perso-pixel', ID_ENNEMI[type], 'humain')
  imageHeros()
  for (const k of Object.keys(ID_ENNEMI) as TypeEnnemi[]) imageEnnemi(k)
  let record = lireRecord(CLE_RECORD)

  // ---------------------------------------------------------------- le cadre

  let dpr = 1
  let echelle = 1
  let sol = 0
  function cadrer(): void {
    dpr = Math.min(2, window.devicePixelRatio || 1)
    const w = window.innerWidth
    const h = window.innerHeight
    canvas.width = Math.round(w * dpr)
    canvas.height = Math.round(h * dpr)
    canvas.style.width = `${w}px`
    canvas.style.height = `${h}px`
    echelle = Math.min(w / 70, h / 100) * dpr
    sol = canvas.height * 0.58
  }
  cadrer()
  window.addEventListener('resize', cadrer)
  let ox = 0
  let oy = 0
  const sx = (x: number) => canvas.width / 2 + (x + ox) * echelle
  const sy = (y: number) => sol - (y + oy) * echelle

  // ---------------------------------------------------------------- les écrans

  function montrerEcran(titre: string, texte: string, go: string): void {
    ecran.replaceChildren(el('div', 'commande-titre', titre), el('div', 'commande-texte', texte), el('div', 'commande-go', go))
    ecran.hidden = false
  }

  function bilan(): string {
    const s = e.stats
    return `Rebonds : ${s.rebonds} · Marteaux chargés : ${s.charges} · Gardes : ${s.gardes} · Parades parfaites : ${s.parfaites}`
  }

  function lancer(): void {
    ouvrirLeSon()
    // `&etage=N` commence la course à l'étage N (pour tester sans jouer les premiers).
    const depart = Math.max(1, Math.floor(Number(new URLSearchParams(location.search).get('etage'))) || 1)
    e = nouveauCombat(C, (Math.random() * 2 ** 32) >>> 0, horloge(), depart)
    enJeu = true
    rueesSifflees = 0
    eclats.length = 0
    bulles.length = 0
    ecran.hidden = true
    sonArrivee()
  }

  montrerEcran(
    'Commande action',
    `Un combat au tour par tour : le bon geste au bon moment frappe plus fort, et pare les coups. Montez le plus haut possible, une amélioration à chaque étage.${record > 0 ? ` Record : étage ${record}.` : ''}`,
    'Touchez pour jouer',
  )

  /** Le choix de l'amélioration, après chaque victoire. */
  function montrerLeButin(soin: number): void {
    const offre = e.offre.map((b: Bonus, i: number) => {
      const carte = el('button', 'commande-choix')
      carte.type = 'button'
      const r = rangDuBonus(e, b)
      const rangTexte = b === 'repas' ? '' : r === 0 ? 'Nouveau' : `Niveau ${r + 1}`
      carte.append(el('span', 'commande-choix-nom', BONUS[b].nom), el('span', 'commande-choix-effet', BONUS[b].effet), el('span', 'commande-choix-rang', rangTexte))
      carte.addEventListener('click', () => {
        if (e.phase !== 'butin') return
        ecran.hidden = true
        ecran.classList.remove('commande-ecran-butin')
        for (const x of prendre(C, e, i, horloge())) vivre(x)
      })
      return carte
    })
    const liste = el('div', 'commande-offre')
    liste.append(...offre)
    ecran.replaceChildren(
      el('div', 'commande-sous-titre', `Étage ${e.etage} franchi`),
      el('div', 'commande-texte', soin > 0 ? `Le héros souffle : +${soin} PV. Choisissez une amélioration.` : 'Choisissez une amélioration.'),
      liste,
    )
    ecran.classList.add('commande-ecran-butin')
    ecran.hidden = false
  }

  function attaquer(a: Attaque): void {
    if (!enJeu) return
    ouvrirLeSon()
    choisir(C, e, a, horloge())
  }

  // ---------------------------------------------------------------- les gestes

  function geste(ev: Event): void {
    if (!enJeu) {
      if (horloge() >= rejouableA) lancer()
      return
    }
    ouvrirLeSon()
    for (const x of toucher(C, e, instant(ev))) vivre(x)
  }
  function lever(ev: Event): void {
    if (enJeu) for (const x of lacher(C, e, instant(ev))) vivre(x)
  }
  canvas.addEventListener('pointerdown', (ev) => {
    canvas.setPointerCapture(ev.pointerId)
    geste(ev)
  })
  canvas.addEventListener('pointerup', lever)
  canvas.addEventListener('pointercancel', lever)
  ecran.addEventListener('pointerdown', geste)
  window.addEventListener('keydown', (ev) => {
    if (ev.repeat) return
    if (ev.key === ' ' || ev.key === 'Enter') {
      ev.preventDefault()
      geste(ev)
    } else if (ev.key === '1') attaquer('saut')
    else if (ev.key === '2') attaquer('marteau')
  })
  window.addEventListener('keyup', (ev) => {
    if (ev.key === ' ' || ev.key === 'Enter') lever(ev)
  })

  // ---------------------------------------------------------------- les effets

  function eclater(x: number, y: number, couleur: string, n: number, force: number): void {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2
      const v = force * (0.4 + Math.random() * 0.6)
      eclats.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v + force * 0.4, vie: 0, duree: 350 + Math.random() * 300, couleur, taille: 0.4 + Math.random() * 0.6 })
    }
  }
  function bulle(x: number, y: number, texte: string, couleur = '#ffffff', taille = 3.4, duree = 700): void {
    bulles.push({ x, y, texte, couleur, taille, vie: 0, duree })
  }
  function vibrer(ms: number): void {
    try {
      navigator.vibrate?.(ms)
    } catch {
      // Sans vibreur, rien.
    }
  }
  const tailleEnnemi = () => TAILLE * (e.ennemi.estChef ? TAILLE_CHEF : 1)
  const teteEnnemi = () => (ennemiDe(C, e).volant ? VOL : 0) + tailleEnnemi() * 0.8

  function vivre(ev: Evenement): void {
    const yTete = teteEnnemi()
    switch (ev.type) {
      case 'bien':
        sonBien(ev.serie)
        vibrer(10)
        bulle(X_ENNEMI, yTete + 9, ev.serie >= 4 ? 'Superbe !' : ev.serie >= 2 ? 'Encore !' : 'Bien !', '#ffd27a', 3.2 + ev.serie * 0.3)
        break
      case 'rate':
        sonRate()
        bulle(X_ENNEMI - 6, yTete + 9, 'Trop tôt', '#b9b3c9', 3)
        break
      case 'atterrit':
        sonAtterrit()
        ecrase = 1
        flashEnnemi = 1
        secousse = Math.max(secousse, 0.35)
        bulle(X_ENNEMI + 6, yTete - 2, String(ev.degats), '#ff6a5a', 4.2)
        eclater(X_ENNEMI, yTete, '#fff2c0', 7, 14)
        break
      case 'piques':
        sonBlesse()
        vibrer(50)
        flashHeros = 1
        flashRouge = 1
        secousse = 0.6
        bulle(X_ENNEMI - 8, yTete + 8, 'Aïe, des piques !', '#ff8a7a', 3.2, 900)
        break
      case 'pleine':
        sonPleine()
        eclater(X_MARTEAU, TAILLE + 4, '#ffd27a', 8, 10)
        break
      case 'frappe': {
        sonMarteau(ev.fort)
        flashEnnemi = 1
        ecrase = 1
        bulle(X_ENNEMI + 6, yTete - 2, String(ev.degats), ev.fort ? '#ffd27a' : '#ff6a5a', ev.fort ? 6 : 4)
        if (ev.fort) {
          vibrer(35)
          secousse = 1
          flashOr = 1
          bulle(X_ENNEMI - 4, yTete + 9, 'Excellent !', '#ffd27a', 4.6, 900)
          eclater(X_ENNEMI - 3, TAILLE * 0.6, '#ffd27a', 22, 26)
        } else {
          const m = e.marteau
          const mot = m.appui === null ? 'Trop lent' : (m.frappe ?? 0) - m.appui < C.marteau.charge ? 'Trop tôt' : 'Trop tard'
          bulle(X_ENNEMI - 6, yTete + 9, mot, '#b9b3c9', 3)
          secousse = Math.max(secousse, 0.3)
        }
        break
      }
      case 'garde':
        if (ev.qualite === 'trop-tot') bulle(X_HEROS, TAILLE + 6, 'Trop tôt', '#b9b3c9', 3)
        break
      case 'coup':
        if (ev.garde === 'parfaite') {
          sonGarde(true)
          vibrer(15)
          flashOr = 1
          bulle(X_HEROS + 2, TAILLE + 7, 'Parfait !', '#ffd27a', 4.6, 900)
          eclater(X_HEROS + 6, TAILLE * 0.5, '#ffd27a', 18, 22)
        } else if (ev.garde === 'garde') {
          sonGarde(false)
          vibrer(20)
          bulle(X_HEROS + 2, TAILLE + 7, 'Garde !', '#d8ecff', 4, 800)
          eclater(X_HEROS + 6, TAILLE * 0.5, '#d8ecff', 12, 18)
        } else {
          sonBlesse()
          vibrer(60)
          flashRouge = 1
          secousse = 0.8
        }
        if (ev.degats > 0) {
          flashHeros = 1
          bulle(X_HEROS - 5, TAILLE + 1, `-${ev.degats}`, '#ff6a5a', 4.2)
        }
        break
      case 'riposte':
        flashEnnemi = 1
        bulle(X_ENNEMI + 6, yTete - 2, String(ev.degats), '#ffd27a', 4.2)
        break
      case 'ko':
        sonKo()
        eclater(X_ENNEMI, TAILLE * 0.5, '#ffffff', 16, 20)
        break
      case 'tour':
        rueesSifflees = 0
        break
      case 'arrivee':
        if (ev.chef) {
          sonChef()
          bulle(X_ENNEMI - 6, TAILLE * TAILLE_CHEF + 6, 'Un chef !', '#ffd27a', 4.4, 1100)
        } else sonArrivee()
        break
      case 'butin':
        sonButin()
        if (ev.soin > 0) bulle(X_HEROS, TAILLE + 6, `+${ev.soin} PV`, '#a6f07a', 3.6, 900)
        setTimeout(() => {
          if (e.phase === 'butin') montrerLeButin(ev.soin)
        }, 500)
        break
      case 'perdu': {
        sonPerdu()
        enJeu = false
        rejouableA = horloge() + 1.2
        const nouveau = e.etage > record
        if (nouveau) {
          record = e.etage
          ecrireRecord(CLE_RECORD, record)
        }
        setTimeout(
          () => montrerEcran('Le héros est tombé', `Étage ${e.etage}, contre : ${ennemiDe(C, e).nom}. ${nouveau ? 'Nouveau record !' : `Record : étage ${record}.`} ${bilan()}.`, 'Touchez pour rejouer'),
          800,
        )
        break
      }
    }
  }

  // ---------------------------------------------------------------- les positions

  function poseDuHeros(t: number): Pose {
    const chez: Pose = { x: X_HEROS, y: 0, regard: 1, vole: false, court: false }
    const retour = (x0: number, y0: number, haut: number): Pose => {
      const u = clamp((t - e.retour!) / C.retour)
      if (u >= 1) return chez
      return { x: melange(x0, X_HEROS, lisse(u)), y: melange(y0, 0, u) + cloche(haut, u), regard: -1, vole: haut > 0, court: haut === 0 }
    }
    if (e.phase === 'saut') {
      const elan = e.debut + C.course
      if (t < elan) return { x: melange(X_HEROS, X_ELAN, lisse((t - e.debut) / C.course)), y: 0, regard: 1, vole: false, court: true }
      const L = e.atterrissages
      const tete = teteEnnemi()
      if (t < L[0].t) {
        const u = (t - elan) / (L[0].t - elan)
        return { x: melange(X_ELAN, X_ENNEMI, u), y: melange(0, tete, u) + cloche(16, u), regard: 1, vole: true, court: false }
      }
      if (e.retour !== null && t >= e.retour) return retour(X_ENNEMI, tete, 14)
      for (let k = L.length - 1; k >= 1; k--) {
        if (t >= L[k - 1].t && t < L[k].t) {
          const d = L[k].t - L[k - 1].t
          return { x: X_ENNEMI, y: tete + cloche(50 * d * d, (t - L[k - 1].t) / d), regard: 1, vole: true, court: false }
        }
      }
      // Après le dernier atterrissage, la décision tombe dans un instant : on part déjà vers le rebond s'il est gagné.
      const der = L[L.length - 1]
      if (t >= der.t && der.tape === 'bien') {
        const d = C.saut.rebond * C.saut.raccourci ** (L.length - 1)
        return { x: X_ENNEMI, y: tete + cloche(50 * d * d, clamp((t - der.t) / d)), regard: 1, vole: true, court: false }
      }
      return { x: X_ENNEMI, y: tete, regard: 1, vole: false, court: false }
    }
    if (e.phase === 'marteau') {
      const m = e.marteau
      if (t < m.arrivee) return { x: melange(X_HEROS, X_MARTEAU, lisse((t - e.debut) / C.course)), y: 0, regard: 1, vole: false, court: true }
      if (e.retour !== null && t >= e.retour) return retour(X_MARTEAU, 0, 0)
      return { x: X_MARTEAU, y: 0, regard: 1, vole: false, court: false }
    }
    return chez
  }

  function poseDeLEnnemi(t: number): { x: number; y: number; penche: number; alpha: number } {
    const en = ennemiDe(C, e)
    const haut = en.volant ? VOL + Math.sin(t * 4) * 1.2 : 0
    if (e.pvEnnemi <= 0) {
      const u = clamp((t - e.koA) / 0.6)
      return { x: X_ENNEMI + 6 * u, y: haut * (1 - u), penche: 1.4 * lisse(u), alpha: 1 - u }
    }
    if (e.phase === 'arrivee') return { x: X_ENNEMI + 50 * (1 - lisse((t - e.debut) / C.arrivee)), y: haut, penche: 0, alpha: 1 }
    if (e.phase === 'ennemi') {
      for (const k of e.coups) {
        const ruee = k.impact - C.ennemi.ruee
        if (t >= k.elan && t < ruee) {
          // L'élan : il recule et se ramasse ; il tremble juste avant de partir.
          const u = (t - k.elan) / (ruee - k.elan)
          const tremble = u > 0.75 ? Math.sin(t * 90) * 0.35 : 0
          return { x: X_ENNEMI + 3 * lisse(u) + tremble, y: haut, penche: 0.18 * lisse(u), alpha: 1 }
        }
        if (t >= ruee && t < k.impact) {
          const u = (t - ruee) / C.ennemi.ruee
          return { x: melange(X_ENNEMI + 3, X_HEROS + 8, u * u), y: en.volant ? melange(haut, 3, u) : 0, penche: -0.3, alpha: 1 }
        }
        if (t >= k.impact && t < k.impact + C.ennemi.recul) {
          const u = (t - k.impact) / C.ennemi.recul
          const repousse = k.garde === 'parfaite' ? 1.6 : 1
          return { x: melange(X_HEROS + 8, X_ENNEMI, lisse(u * repousse)), y: melange(en.volant ? 3 : 0, haut, u) + cloche(k.garde === 'parfaite' ? 8 : 3, u), penche: k.garde === 'parfaite' ? -2 * u : 0, alpha: 1 }
        }
      }
    }
    return { x: X_ENNEMI, y: haut, penche: 0, alpha: 1 }
  }

  // ---------------------------------------------------------------- le dessin

  function dessinerLaScene(w: number, h: number): void {
    const ciel = g.createLinearGradient(0, 0, 0, sol)
    ciel.addColorStop(0, '#1b1430')
    ciel.addColorStop(1, '#4a2f5a')
    g.fillStyle = ciel
    g.fillRect(0, 0, w, h)
    // Le projecteur sur les planches.
    const lampe = g.createRadialGradient(w / 2, sol, 0, w / 2, sol, w * 0.7)
    lampe.addColorStop(0, 'rgba(255, 230, 170, 0.28)')
    lampe.addColorStop(1, 'rgba(255, 230, 170, 0)')
    g.fillStyle = lampe
    g.fillRect(0, 0, w, h)
    // Les planches.
    const bois = g.createLinearGradient(0, sol, 0, h)
    bois.addColorStop(0, '#8a5a32')
    bois.addColorStop(1, '#3a2414')
    g.fillStyle = bois
    g.fillRect(0, sol, w, h - sol)
    g.strokeStyle = 'rgba(0, 0, 0, 0.25)'
    g.lineWidth = Math.max(1, 0.2 * echelle)
    const planche = 3.2 * echelle
    for (let i = 1, y = sol + planche; y < h; i++, y += planche * (1 + i * 0.25)) {
      g.beginPath()
      g.moveTo(0, y)
      g.lineTo(w, y)
      g.stroke()
    }
    g.fillStyle = 'rgba(255, 220, 160, 0.35)'
    g.fillRect(0, sol, w, Math.max(1, 0.35 * echelle))
    // Les rideaux, de part et d'autre, et le lambrequin en haut.
    const large = w * 0.06
    for (const cote of [0, 1]) {
      const x0 = cote === 0 ? 0 : w - large
      const r = g.createLinearGradient(x0, 0, x0 + large, 0)
      const plis = 4
      for (let i = 0; i <= plis * 2; i++) r.addColorStop(i / (plis * 2), i % 2 === 0 ? '#5e0f1c' : '#a3243a')
      g.fillStyle = r
      g.fillRect(x0, 0, large, sol + 0.6 * echelle)
    }
    const bande = Math.max(h * 0.05, 3 * echelle)
    g.fillStyle = '#8a1c2a'
    g.fillRect(0, 0, w, bande)
    const festons = Math.ceil(w / (bande * 1.6))
    for (let i = 0; i < festons; i++) {
      const cx = (i + 0.5) * (w / festons)
      g.beginPath()
      g.ellipse(cx, bande, w / festons / 2, bande * 0.45, 0, 0, Math.PI)
      g.fill()
    }
    g.strokeStyle = '#d9a646'
    g.lineWidth = Math.max(2, 0.4 * echelle)
    for (let i = 0; i < festons; i++) {
      const cx = (i + 0.5) * (w / festons)
      g.beginPath()
      g.ellipse(cx, bande, w / festons / 2, bande * 0.45, 0, 0, Math.PI)
      g.stroke()
    }
  }

  function ombre(x: number, y: number): void {
    const r = TAILLE * 0.32 * (1 - Math.min(0.6, y / 40))
    g.fillStyle = 'rgba(0, 0, 0, 0.35)'
    g.beginPath()
    g.ellipse(sx(x), sy(0), r * echelle, r * 0.3 * echelle, 0, 0, Math.PI * 2)
    g.fill()
  }

  /** Un personnage, les pieds à (x, y). */
  function personnage(img: HTMLImageElement | null, x: number, y: number, regard: number, penche: number, blanc: number, etire = 1, taille = TAILLE): void {
    if (img === null) return
    const t = taille * echelle
    g.save()
    g.translate(sx(x), sy(y))
    g.rotate(penche * regard)
    g.scale(regard / Math.sqrt(etire), etire)
    g.drawImage(img, -t / 2, -t * 0.92, t, t)
    if (blanc > 0) {
      g.globalCompositeOperation = 'lighter'
      g.globalAlpha = blanc
      g.drawImage(img, -t / 2, -t * 0.92, t, t)
    }
    g.restore()
  }

  function dessinerLEnnemi(t: number): void {
    const en = ennemiDe(C, e)
    const p = poseDeLEnnemi(t)
    if (p.alpha <= 0) return
    const tE = tailleEnnemi()
    ombre(p.x, p.y)
    g.globalAlpha = p.alpha
    if (en.volant) {
      // Les ailes, qui battent.
      const bat = Math.sin(t * 22) * 0.5
      g.fillStyle = 'rgba(210, 235, 255, 0.75)'
      for (const s of [-1, 1]) {
        g.save()
        g.translate(sx(p.x + s * 1.5), sy(p.y + tE * 0.55))
        g.rotate(s * (0.6 + bat))
        g.beginPath()
        g.ellipse(s * 3 * echelle, 0, 3.4 * echelle, 1.6 * echelle, 0, 0, Math.PI * 2)
        g.fill()
        g.restore()
      }
    }
    personnage(imageEnnemi(en.type), p.x, p.y, -1, p.penche, flashEnnemi, 1 - ecrase * 0.25, tE)
    if (en.piques) {
      // Les piques du casque.
      const yh = p.y + tE * 0.8 * (1 - ecrase * 0.25)
      g.fillStyle = '#d6dbe4'
      g.strokeStyle = '#3a3f4a'
      g.lineWidth = Math.max(1, 0.25 * echelle)
      for (const dx of [-3, 0, 3]) {
        g.beginPath()
        g.moveTo(sx(p.x + dx - 1.2), sy(yh))
        g.lineTo(sx(p.x + dx), sy(yh + (dx === 0 ? 4 : 3)))
        g.lineTo(sx(p.x + dx + 1.2), sy(yh))
        g.closePath()
        g.fill()
        g.stroke()
      }
    }
    g.globalAlpha = 1
  }

  /** L'angle du marteau : 0 debout, positif vers l'avant. */
  function angleDuMarteau(t: number): number | null {
    if (e.phase !== 'marteau') return null
    const m = e.marteau
    if (e.retour !== null && t >= e.retour) return -0.9
    if (t < m.arrivee) return -0.9
    const leve = (s: number) => -0.5 - 1.5 * clamp((s - (m.appui ?? s)) / C.marteau.charge)
    if (m.frappe === null) {
      if (m.appui === null) return -0.5 + Math.sin(t * 6) * 0.08
      const a = leve(t)
      return m.pleine ? a + Math.sin(t * 70) * 0.05 : a
    }
    const depart = m.appui === null ? -0.5 : leve(m.frappe)
    return melange(depart, 1.75, lisse((t - m.frappe) / C.marteau.elan))
  }

  function dessinerLeHeros(t: number): void {
    const p = poseDuHeros(t)
    ombre(p.x, p.y)
    const course = p.court ? Math.abs(Math.sin(t * 18)) * 1.2 : 0
    const respire = !p.court && !p.vole ? Math.sin(t * 3) * 0.02 : 0
    personnage(imageHeros(), p.x, p.y + course, p.regard, p.court ? 0.12 : 0, flashHeros, 1 + respire)
    const angle = angleDuMarteau(t)
    if (angle !== null) {
      // Le marteau, tenu à la main : le manche, puis la tête en travers.
      const mx = sx(p.x + 1.5)
      const my = sy(p.y + TAILLE * 0.42)
      g.save()
      g.translate(mx, my)
      g.rotate(angle)
      g.fillStyle = '#7a5230'
      g.fillRect(-0.4 * echelle, -10 * echelle, 0.8 * echelle, 10 * echelle)
      g.fillStyle = '#9aa3b2'
      g.strokeStyle = '#3a3f4a'
      g.lineWidth = Math.max(1, 0.3 * echelle)
      g.beginPath()
      g.roundRect(-3.2 * echelle, -13 * echelle, 6.4 * echelle, 3.6 * echelle, 0.6 * echelle)
      g.fill()
      g.stroke()
      g.restore()
    }
    // Le bouclier, levé un instant à chaque tape de garde.
    if (e.phase === 'ennemi' && t - e.gardeA < 0.25) {
      const u = (t - e.gardeA) / 0.25
      g.globalAlpha = 1 - u * u
      g.fillStyle = '#c9953f'
      g.strokeStyle = '#ffe9b0'
      g.lineWidth = Math.max(1, 0.4 * echelle)
      g.beginPath()
      g.ellipse(sx(p.x + 5), sy(p.y + TAILLE * 0.45), 2 * echelle, 4.6 * echelle, 0, 0, Math.PI * 2)
      g.fill()
      g.stroke()
      g.globalAlpha = 1
    }
  }

  /** La jauge du marteau, au-dessus du héros : elle se remplit, l'étoile s'allume quand il faut lâcher. */
  function dessinerLaCharge(t: number): void {
    if (e.phase !== 'marteau') return
    const m = e.marteau
    if (m.appui === null || m.frappe !== null || t < m.appui) return
    const u = clamp((t - m.appui) / C.marteau.charge)
    const x0 = sx(X_MARTEAU - 7)
    const y0 = sy(TAILLE + 5)
    const L = 12 * echelle
    const H = 1.6 * echelle
    g.fillStyle = 'rgba(0, 0, 0, 0.6)'
    g.beginPath()
    g.roundRect(x0, y0, L, H, H / 2)
    g.fill()
    g.fillStyle = m.pleine ? '#ffd27a' : '#e6e1f0'
    g.beginPath()
    g.roundRect(x0, y0, Math.max(H, L * u), H, H / 2)
    g.fill()
    // L'étoile au bout.
    const cx = x0 + L + 2.6 * echelle
    const cy = y0 + H / 2
    const r = (m.pleine ? 2.2 + Math.sin(t * 20) * 0.3 : 1.6) * echelle
    g.fillStyle = m.pleine ? '#ffd27a' : 'rgba(255, 255, 255, 0.3)'
    if (m.pleine) {
      g.shadowColor = '#ffb030'
      g.shadowBlur = 2 * echelle
    }
    g.beginPath()
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + (i * Math.PI) / 5
      const rr = i % 2 === 0 ? r : r * 0.45
      g.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr)
    }
    g.closePath()
    g.fill()
    g.shadowBlur = 0
  }

  // ---------------------------------------------------------------- le chrome

  let consigneMontree = ''
  function majChrome(t: number): void {
    const en = ennemiDe(C, e)
    campHeros.remplie.style.width = `${(100 * e.pv) / pvMaxDe(C, e)}%`
    campHeros.detail.textContent = `PV ${e.pv} / ${pvMaxDe(C, e)}`
    campEnnemi.nom.textContent = en.nom
    campEnnemi.remplie.style.width = `${(100 * e.pvEnnemi) / en.pv}%`
    campEnnemi.detail.textContent = `Étage ${e.etage}`
    const choix = enJeu && e.phase === 'choix'
    menu.hidden = !choix
    if (choix) {
      boutonMarteau.b.disabled = !peutAttaquer(C, e, 'marteau')
      boutonMarteau.geste.textContent = boutonMarteau.b.disabled ? 'Hors de portée' : 'Tenez, lâchez à l’étoile'
    }
    let texte = ''
    if (enJeu) {
      if (e.phase === 'choix') texte = en.conseil
      else if (e.phase === 'saut') texte = en.piques ? '' : 'Touchez à l’atterrissage pour rebondir'
      else if (e.phase === 'marteau') texte = e.marteau.frappe !== null ? '' : e.marteau.appui === null || t < e.marteau.appui ? 'Posez le doigt et tenez' : 'Lâchez quand l’étoile s’allume'
      else if (e.phase === 'ennemi') texte = 'Touchez juste avant le coup pour parer'
    }
    if (texte !== consigneMontree) {
      consigne.textContent = texte
      consigneMontree = texte
    }
  }

  // ---------------------------------------------------------------- la boucle

  let avant = performance.now()
  function image(ms: number): void {
    const dt = Math.min(ms - avant, 100)
    avant = ms
    const t = horloge()
    if (enJeu) {
      for (const x of avancer(C, e, t)) vivre(x)
      // La ruée siffle : on l'entend partir.
      if (e.phase === 'ennemi') {
        const k = e.coups[rueesSifflees]
        if (k !== undefined && t >= k.impact - C.ennemi.ruee) {
          sonRuee()
          rueesSifflees += 1
        }
      }
    }
    for (let i = eclats.length - 1; i >= 0; i--) {
      const p = eclats[i]
      p.vie += dt
      p.x += (p.vx * dt) / 1000
      p.y += (p.vy * dt) / 1000
      p.vy -= (40 * dt) / 1000
      p.vx *= 0.96
      if (p.vie >= p.duree) eclats.splice(i, 1)
    }
    for (let i = bulles.length - 1; i >= 0; i--) {
      bulles[i].vie += dt
      if (bulles[i].vie >= bulles[i].duree) bulles.splice(i, 1)
    }
    flashHeros = Math.max(0, flashHeros - dt / 200)
    flashEnnemi = Math.max(0, flashEnnemi - dt / 200)
    ecrase = Math.max(0, ecrase - dt / 180)
    flashRouge = Math.max(0, flashRouge - dt / 300)
    flashOr = Math.max(0, flashOr - dt / 450)
    secousse = Math.max(0, secousse - dt / 300)

    const w = canvas.width
    const h = canvas.height
    ox = (Math.random() - 0.5) * secousse * 1.6
    oy = (Math.random() - 0.5) * secousse * 1.6
    dessinerLaScene(w, h)
    dessinerLEnnemi(t)
    dessinerLeHeros(t)
    dessinerLaCharge(t)
    for (const p of eclats) {
      g.globalAlpha = 1 - p.vie / p.duree
      g.fillStyle = p.couleur
      g.beginPath()
      g.arc(sx(p.x), sy(p.y), p.taille * echelle, 0, Math.PI * 2)
      g.fill()
    }
    g.globalAlpha = 1
    g.textAlign = 'center'
    g.strokeStyle = 'rgba(0, 0, 0, 0.75)'
    for (const b of bulles) {
      const u = b.vie / b.duree
      const gonfle = u < 0.15 ? 0.6 + (u / 0.15) * 0.5 : 1.1 - Math.min(0.1, (u - 0.15) * 0.4)
      g.globalAlpha = u > 0.7 ? 1 - (u - 0.7) / 0.3 : 1
      g.font = `800 ${b.taille * gonfle * echelle}px 'Baloo 2', sans-serif`
      g.lineWidth = 0.6 * echelle
      g.fillStyle = b.couleur
      const y = sy(b.y) - u * 4 * echelle
      g.strokeText(b.texte, sx(b.x), y)
      g.fillText(b.texte, sx(b.x), y)
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
      g.fillStyle = `rgba(255, 220, 140, ${0.22 * flashOr})`
      g.fillRect(0, 0, w, h)
    }
    haut.hidden = !enJeu && e.phase !== 'perdu'
    majChrome(t)
    requestAnimationFrame(image)
  }
  requestAnimationFrame(image)
}

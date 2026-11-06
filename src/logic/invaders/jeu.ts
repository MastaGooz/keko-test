/**
 * LES ENVAHISSEURS — un Space Invaders au doigt, en side project (Keko, 06/11 :
 * « un genre de space invaders sur notre format browser, juste pour le fun et
 * l'exploration »). Pur : le temps est injecté (`avancer` reçoit `dt`), tout
 * tirage passe par le RNG seedé, aucun DOM.
 *
 * Le monde est un rectangle de `LARGEUR` × `HAUTEUR` unités, en portrait ;
 * l'écran l'agrandit à sa taille. Le vaisseau suit le doigt de côté et tire
 * tout seul (Keko : « glisser, tir auto ») ; la formation marche de bord en
 * bord, descend à chaque bord, accélère quand elle se vide ; des astéroïdes
 * servent d'abris ; une soucoupe passe parfois en haut. Une vague vidée en
 * appelle une plus rapide.
 */
import { createRng } from '../rng.ts'

export const LARGEUR = 90
export const HAUTEUR = 160

export const INVADERS = {
  lignes: 5,
  colonnes: 6,
  ecartX: 11,
  ecartY: 10,
  /** Le haut de la formation à la première vague ; elle part un peu plus bas à chaque vague. */
  hautDepart: 30,
  descenteParVague: 3,
  descenteMax: 18,
  /** Le demi-côté d'un envahisseur (sa boîte de collision). */
  rayon: 4,
  /** La marche, en unités par seconde : de `marche` (pleine) à `marche × (1 + acceleration)` (le dernier). */
  marche: 6,
  acceleration: 5,
  /** Chaque vague marche de ce facteur plus vite que la précédente. */
  parVague: 0.15,
  /** La descente à chaque bord. */
  pas: 4,
  /** La marge aux bords. */
  marge: 3,
  /** Les tirs ennemis par seconde, à la première vague ; +`tirsParVague` à chaque vague. */
  tirsEnnemis: 0.9,
  tirsParVague: 0.25,
  vitesseTirEnnemi: 45,
  /** Le vaisseau : sa hauteur, sa demi-largeur, sa vitesse de côté, sa cadence de tir. */
  joueurY: 146,
  joueurDemi: 4.5,
  joueurVitesse: 120,
  cadence: 320,
  vitesseTir: 130,
  vies: 3,
  /** Touché, le vaisseau clignote et ne craint rien. */
  invincible: 1500,
  /** La ligne que la formation ne doit pas toucher. */
  ligneFatale: 140,
  /** Les abris : des astéroïdes, leur rayon et leurs PV. */
  abris: 4,
  abriY: 126,
  abriRayon: 6,
  abriPv: 8,
  /** La soucoupe : sa hauteur, sa vitesse, l'attente entre deux passages. */
  soucoupeY: 15,
  soucoupeVitesse: 22,
  soucoupeAttente: [18_000, 30_000] as [number, number],
  soucoupePoints: [100, 150, 200, 300] as const,
  /** Les points d'une ligne, du haut au bas. */
  points: [30, 20, 20, 10, 10] as const,
  /** La pause entre deux vagues. */
  entreVagues: 1800,
}

export type ConfigInvaders = typeof INVADERS

export type Ennemi = { id: number; ligne: number; colonne: number; vivant: boolean }
export type Tir = { x: number; y: number; ami: boolean }
export type Abri = { x: number; y: number; pv: number }
export type Soucoupe = { x: number; sens: 1 | -1 }

export type EtatInvaders = {
  seed: number
  rng: number
  /** Le temps de la partie, en ms. */
  t: number
  phase: 'jeu' | 'entreVagues' | 'perdu'
  vague: number
  score: number
  vies: number
  joueur: { x: number; invincibleJusqua: number; prochainTir: number }
  /** Le coin de la formation (le centre de l'envahisseur ligne 0, colonne 0) et son sens de marche. */
  formation: { x: number; y: number; sens: 1 | -1 }
  ennemis: Ennemi[]
  tirs: Tir[]
  abris: Abri[]
  soucoupe: Soucoupe | null
  prochaineSoucoupe: number
  /** La fin de la pause entre deux vagues. */
  repriseA: number
}

/** Ce qui s'est passé pendant un pas : l'écran en fait les sons et les éclats. */
export type EvenementInvaders =
  | { type: 'tir'; x: number; y: number }
  | { type: 'detruit'; x: number; y: number; ligne: number; points: number }
  | { type: 'abri'; x: number; y: number; detruit: boolean }
  | { type: 'touche'; x: number; y: number; vies: number }
  | { type: 'soucoupe'; x: number; y: number; points: number }
  | { type: 'vague'; vague: number }
  | { type: 'perdu'; score: number }

/** L'entrée du joueur : où est le doigt (en x du monde), ou rien. */
export type EntreeInvaders = { cibleX: number | null }

function tirer(e: EtatInvaders): number {
  const r = createRng(e.rng)
  const v = r.next()
  e.rng = r.getState()
  return v
}

/** La formation d'une vague, centrée, un peu plus bas à chaque vague. */
function formationDeLaVague(c: ConfigInvaders, vague: number): EtatInvaders['formation'] {
  const largeur = (c.colonnes - 1) * c.ecartX
  return { x: (LARGEUR - largeur) / 2, y: c.hautDepart + Math.min(c.descenteMax, (vague - 1) * c.descenteParVague), sens: 1 }
}

function ennemisDeLaVague(c: ConfigInvaders): Ennemi[] {
  const out: Ennemi[] = []
  for (let l = 0; l < c.lignes; l++) for (let k = 0; k < c.colonnes; k++) out.push({ id: l * c.colonnes + k, ligne: l, colonne: k, vivant: true })
  return out
}

function abrisNeufs(c: ConfigInvaders): Abri[] {
  return Array.from({ length: c.abris }, (_, i) => ({ x: (LARGEUR * (i + 0.5)) / c.abris, y: c.abriY, pv: c.abriPv }))
}

export function nouvellePartie(c: ConfigInvaders, seed: number): EtatInvaders {
  const e: EtatInvaders = {
    seed: seed >>> 0,
    rng: seed >>> 0,
    t: 0,
    phase: 'jeu',
    vague: 1,
    score: 0,
    vies: c.vies,
    joueur: { x: LARGEUR / 2, invincibleJusqua: 0, prochainTir: 0 },
    formation: formationDeLaVague(c, 1),
    ennemis: ennemisDeLaVague(c),
    tirs: [],
    abris: abrisNeufs(c),
    soucoupe: null,
    prochaineSoucoupe: 0,
    repriseA: 0,
  }
  e.prochaineSoucoupe = c.soucoupeAttente[0] + tirer(e) * (c.soucoupeAttente[1] - c.soucoupeAttente[0])
  return e
}

/** Le centre d'un envahisseur dans le monde. */
export function positionDe(c: ConfigInvaders, e: EtatInvaders, n: Ennemi): { x: number; y: number } {
  return { x: e.formation.x + n.colonne * c.ecartX, y: e.formation.y + n.ligne * c.ecartY }
}

/** La vitesse de marche : elle monte quand la formation se vide, et à chaque vague. */
export function vitesseDeMarche(c: ConfigInvaders, e: EtatInvaders): number {
  const vivants = e.ennemis.filter((n) => n.vivant).length
  const vide = 1 - vivants / e.ennemis.length
  return c.marche * (1 + c.acceleration * vide * vide) * (1 + c.parVague * (e.vague - 1))
}

/**
 * UN PAS DE `dt` ms. Rend l'état suivant (une copie) et ce qui s'est passé.
 * Le vaisseau va vers le doigt sans dépasser sa vitesse ; il tire à chaque
 * fin de cadence ; la formation marche, descend à chaque bord ; les tirs
 * volent et frappent ; vidée, la vague en appelle une autre après une pause.
 */
export function avancer(c: ConfigInvaders, etat: EtatInvaders, dt: number, entree: EntreeInvaders): { etat: EtatInvaders; evenements: EvenementInvaders[] } {
  const e = structuredClone(etat)
  const ev: EvenementInvaders[] = []
  if (e.phase === 'perdu' || dt <= 0) return { etat: e, evenements: ev }
  e.t += dt
  const s = dt / 1000

  // LE VAISSEAU suit le doigt, borné à sa vitesse et au monde.
  if (entree.cibleX !== null) {
    const voulu = Math.max(c.joueurDemi, Math.min(LARGEUR - c.joueurDemi, entree.cibleX))
    const pas = c.joueurVitesse * s
    e.joueur.x += Math.max(-pas, Math.min(pas, voulu - e.joueur.x))
  }

  // LA PAUSE ENTRE DEUX VAGUES : les tirs finissent leur vol, la suivante arrive.
  if (e.phase === 'entreVagues') {
    deplacerLesTirs(c, e, s)
    if (e.t >= e.repriseA) {
      e.phase = 'jeu'
      e.formation = formationDeLaVague(c, e.vague)
      e.ennemis = ennemisDeLaVague(c)
      e.tirs = []
      ev.push({ type: 'vague', vague: e.vague })
    }
    return { etat: e, evenements: ev }
  }

  // LE TIR AUTO.
  if (e.t >= e.joueur.prochainTir) {
    e.tirs.push({ x: e.joueur.x, y: c.joueurY - 5, ami: true })
    e.joueur.prochainTir = e.t + c.cadence
    ev.push({ type: 'tir', x: e.joueur.x, y: c.joueurY - 5 })
  }

  // LA MARCHE : au bord, la formation fait demi-tour et descend d'un pas.
  const vivants = e.ennemis.filter((n) => n.vivant)
  if (vivants.length > 0) {
    e.formation.x += e.formation.sens * vitesseDeMarche(c, e) * s
    const xs = vivants.map((n) => positionDe(c, e, n).x)
    const gauche = Math.min(...xs) - c.rayon
    const droite = Math.max(...xs) + c.rayon
    if (droite > LARGEUR - c.marge && e.formation.sens === 1) {
      e.formation.x -= droite - (LARGEUR - c.marge)
      e.formation.sens = -1
      e.formation.y += c.pas
    } else if (gauche < c.marge && e.formation.sens === -1) {
      e.formation.x += c.marge - gauche
      e.formation.sens = 1
      e.formation.y += c.pas
    }
  }

  // LES TIRS ENNEMIS : du bas d'une colonne tirée au hasard.
  const cadenceEnnemie = c.tirsEnnemis + c.tirsParVague * (e.vague - 1)
  if (vivants.length > 0 && tirer(e) < cadenceEnnemie * s) {
    const colonnes = [...new Set(vivants.map((n) => n.colonne))]
    const col = colonnes[Math.floor(tirer(e) * colonnes.length)]
    const bas = vivants.filter((n) => n.colonne === col).reduce((a, b) => (b.ligne > a.ligne ? b : a))
    const p = positionDe(c, e, bas)
    e.tirs.push({ x: p.x, y: p.y + c.rayon, ami: false })
  }

  // LA SOUCOUPE passe en haut, d'un bord à l'autre.
  if (e.soucoupe === null && e.t >= e.prochaineSoucoupe) {
    const sens = tirer(e) < 0.5 ? 1 : -1
    e.soucoupe = { x: sens === 1 ? -8 : LARGEUR + 8, sens }
  }
  if (e.soucoupe !== null) {
    e.soucoupe.x += e.soucoupe.sens * c.soucoupeVitesse * s
    if (e.soucoupe.x < -10 || e.soucoupe.x > LARGEUR + 10) {
      e.soucoupe = null
      e.prochaineSoucoupe = e.t + c.soucoupeAttente[0] + tirer(e) * (c.soucoupeAttente[1] - c.soucoupeAttente[0])
    }
  }

  deplacerLesTirs(c, e, s)
  frapper(c, e, ev)

  // LA FORMATION ÉCRASE LES ABRIS qu'elle atteint, et perd si elle touche la ligne.
  for (const n of e.ennemis) {
    if (!n.vivant) continue
    const p = positionDe(c, e, n)
    for (const a of e.abris) if (a.pv > 0 && Math.abs(p.x - a.x) < c.rayon + c.abriRayon && Math.abs(p.y - a.y) < c.rayon + c.abriRayon) a.pv = 0
    if (p.y + c.rayon >= c.ligneFatale) {
      e.vies = 0
      e.phase = 'perdu'
      ev.push({ type: 'perdu', score: e.score })
      return { etat: e, evenements: ev }
    }
  }

  // VIDÉE, la vague en appelle une autre.
  if (e.phase === 'jeu' && e.ennemis.every((n) => !n.vivant)) {
    e.phase = 'entreVagues'
    e.vague += 1
    e.repriseA = e.t + c.entreVagues
  }
  return { etat: e, evenements: ev }
}

function deplacerLesTirs(c: ConfigInvaders, e: EtatInvaders, s: number): void {
  for (const t of e.tirs) t.y += (t.ami ? -c.vitesseTir : c.vitesseTirEnnemi) * s
  e.tirs = e.tirs.filter((t) => t.y > -5 && t.y < HAUTEUR + 5)
}

/** Les tirs contre les abris, les envahisseurs, la soucoupe, le vaisseau. */
function frapper(c: ConfigInvaders, e: EtatInvaders, ev: EvenementInvaders[]): void {
  const restants: Tir[] = []
  for (const t of e.tirs) {
    let fini = false
    // Les abris arrêtent les deux camps.
    for (const a of e.abris) {
      if (a.pv <= 0) continue
      const r = c.abriRayon * (0.45 + (0.55 * a.pv) / c.abriPv)
      if (Math.hypot(t.x - a.x, t.y - a.y) < r) {
        a.pv -= 1
        ev.push({ type: 'abri', x: t.x, y: t.y, detruit: a.pv <= 0 })
        fini = true
        break
      }
    }
    if (!fini && t.ami) {
      for (const n of e.ennemis) {
        if (!n.vivant) continue
        const p = positionDe(c, e, n)
        if (Math.abs(t.x - p.x) < c.rayon && Math.abs(t.y - p.y) < c.rayon) {
          n.vivant = false
          const points = c.points[n.ligne] ?? 10
          e.score += points
          ev.push({ type: 'detruit', x: p.x, y: p.y, ligne: n.ligne, points })
          fini = true
          break
        }
      }
      if (!fini && e.soucoupe !== null && Math.abs(t.x - e.soucoupe.x) < 6 && Math.abs(t.y - c.soucoupeY) < 4) {
        const points = c.soucoupePoints[Math.floor(tirer(e) * c.soucoupePoints.length)]
        e.score += points
        ev.push({ type: 'soucoupe', x: e.soucoupe.x, y: c.soucoupeY, points })
        e.soucoupe = null
        e.prochaineSoucoupe = e.t + c.soucoupeAttente[0] + tirer(e) * (c.soucoupeAttente[1] - c.soucoupeAttente[0])
        fini = true
      }
    }
    if (!fini && !t.ami && Math.abs(t.x - e.joueur.x) < c.joueurDemi && Math.abs(t.y - c.joueurY) < 4) {
      fini = true
      if (e.t >= e.joueur.invincibleJusqua) {
        e.vies -= 1
        e.joueur.invincibleJusqua = e.t + c.invincible
        ev.push({ type: 'touche', x: e.joueur.x, y: c.joueurY, vies: e.vies })
        if (e.vies <= 0) {
          e.phase = 'perdu'
          ev.push({ type: 'perdu', score: e.score })
        }
      }
    }
    if (!fini) restants.push(t)
  }
  e.tirs = restants
}

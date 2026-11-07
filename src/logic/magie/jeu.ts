/**
 * LA TOUR DU MAGICIEN — `?magie`, un side project (Keko, 07/11 : « une tour au
 * milieu de l'écran (la tour d'un magicien), avec des ennemis qui
 * approchent, et on lance des sorts à la Magicka »).
 *
 * **Le sort se COMPOSE** : on empile jusqu'à trois éléments (feu, froid,
 * foudre, terre), puis on touche le terrain pour le lancer vers ce point. La
 * composition donne la FORME — de la terre, un ROCHER lancé sur le point ;
 * sinon de la foudre, un ÉCLAIR qui saute d'ennemi en ennemi ; sinon un
 * SOUFFLE en cône (de flammes ou de givre) — et chaque élément y ajoute son
 * effet : le feu brûle, le froid ralentit (trois froids gèlent), la terre
 * repousse. **Les opposés s'annulent** en entrant dans la file : le feu et le
 * froid, la foudre et la terre. Certains ennemis résistent à un élément (un
 * esprit de feu ne brûle pas, la foudre glisse sur le golem) : il faut
 * changer de sort.
 *
 * Les ennemis naissent hors de l'écran, par vagues, et marchent sur la tour ;
 * au pied de la tour, ils frappent. La partie s'arrête quand la tour tombe ;
 * le record est la vague atteinte.
 *
 * Pur et seedé : le temps est injecté (en secondes), l'état modifié en place.
 * Le monde a la tour à l'origine, y vers le bas (comme l'écran) ; la page dit
 * ce qu'elle montre (`Vue`), où naissent les ennemis.
 */
import { createRng } from '../rng.ts'

export type Element = 'feu' | 'froid' | 'foudre' | 'terre'
export const ELEMENTS: Element[] = ['feu', 'froid', 'foudre', 'terre']
export const OPPOSE: Record<Element, Element> = { feu: 'froid', froid: 'feu', foudre: 'terre', terre: 'foudre' }

export type TypeEnnemi = 'gobelin' | 'orc' | 'esprit' | 'golem'
export type Compte = Record<Element, number>

export const MAGIE = {
  /** Trois éléments au plus dans la file. */
  file: 3,
  /** Après un sort, le magicien reprend son souffle. */
  recharge: 0.35,
  tour: { pv: 20, rayon: 6, soinParVague: 2 },
  /** Le souffle : un cône devant la tour. */
  cone: { portee: 34, demiAngle: 0.5, degats: 5 },
  /** La brûlure : tant de dégâts par seconde par feu, tant de secondes. */
  brulure: { dps: 2, duree: 3 },
  /** Le froid ralentit de tant par froid ; à trois, il gèle. */
  gel: { ralenti: 0.25, duree: 3, glace: 3, dureeGlace: 2 },
  /** Le rocher : sa vitesse, ses dégâts par terre (et par autre élément), son rayon d'impact (le feu l'élargit), le recul qu'il donne par terre. */
  rocher: { vitesse: 85, degats: 7, degatsAutres: 3, rayon: 5, rayonParFeu: 3, recul: 5, porteeMax: 75 },
  /** L'éclair : il part sur l'ennemi le plus proche dans le cône, puis saute ; ses dégâts par foudre (et par autre élément). */
  eclair: { portee: 48, angle: 0.7, saut: 20, degats: 6, degatsAutres: 2, sautsParFoudre: 2 },
  ennemis: {
    gobelin: { nom: 'Gobelin', pv: 10, vitesse: 7, degats: 1, rayon: 2.6, depuis: 1, poids: 4 },
    orc: { nom: 'Orc', pv: 30, vitesse: 4.5, degats: 3, rayon: 3.6, depuis: 2, poids: 2 },
    esprit: { nom: 'Esprit de feu', pv: 14, vitesse: 6.5, degats: 2, rayon: 2.8, depuis: 3, poids: 2 },
    golem: { nom: 'Golem', pv: 40, vitesse: 3.5, degats: 4, rayon: 4.2, depuis: 4, poids: 1 },
  } satisfies Record<TypeEnnemi, { nom: string; pv: number; vitesse: number; degats: number; rayon: number; depuis: number; poids: number }>,
  /** Ce que chaque élément fait à chaque ennemi (1 : normal). */
  faiblesses: {
    gobelin: { feu: 1, froid: 1, foudre: 1, terre: 1 },
    orc: { feu: 1, froid: 1, foudre: 1, terre: 1 },
    esprit: { feu: 0, froid: 2, foudre: 1, terre: 1 },
    golem: { feu: 0.5, froid: 1, foudre: 0.25, terre: 2 },
  } satisfies Record<TypeEnnemi, Compte>,
  /** Un ennemi au pied de la tour frappe toutes les tant de secondes. */
  attaque: 1.2,
  vague: {
    /** Le nombre d'ennemis de la vague n : base + parVague × (n − 1). */
    base: 4,
    parVague: 2,
    /** Les ennemis d'une vague arrivent sur tant de secondes. */
    etalement: 14,
    /** La pause avant la vague suivante (et avant la première). */
    pause: 3,
    /** Les PV des ennemis : × (1 + durcissement × (n − 1)). */
    durcissement: 0.12,
    /** Ils naissent à tant hors de l'écran. */
    marge: 5,
  },
}

export type ConfigMagie = typeof MAGIE
export type Forme = 'aucun' | 'souffle' | 'eclair' | 'rocher'
/** Ce que montre l'écran, autour de la tour (en unités du monde). */
export type Vue = { gauche: number; droite: number; haut: number; bas: number }
export type Point = { x: number; y: number }

export type Ennemi = {
  id: number
  type: TypeEnnemi
  x: number
  y: number
  pv: number
  pvMax: number
  /** La brûlure en cours : ses dégâts par seconde, jusqu'à quand. */
  brule: { dps: number; fin: number } | null
  ralenti: { part: number; fin: number } | null
  /** Gelé jusque-là. */
  geleA: number
  /** Son prochain coup sur la tour. */
  coupA: number
}

export type Rocher = { id: number; x: number; y: number; cible: Point; n: Compte }

export type EtatMagie = {
  t: number
  graine: number
  phase: 'jeu' | 'perdu'
  pv: number
  file: Element[]
  /** Le prochain sort est possible à partir de là. */
  pretA: number
  vague: number
  /** Les ennemis à faire naître : leur type, l'instant. */
  aFaire: { type: TypeEnnemi; t: number }[]
  /** La vague suivante commence là (`null` pendant une vague). */
  prochaineVague: number | null
  ennemis: Ennemi[]
  rochers: Rocher[]
  prochainId: number
  abattus: number
}

export type Evenement =
  | { type: 'element'; element: Element }
  | { type: 'annule'; element: Element; contre: Element }
  | { type: 'pleine' }
  | { type: 'souffle'; dir: Point; n: Compte }
  | { type: 'eclair'; points: Point[]; n: Compte }
  | { type: 'jet'; id: number; n: Compte }
  | { type: 'impact'; x: number; y: number; rayon: number; n: Compte }
  | { type: 'touche'; id: number; x: number; y: number; degats: number; resiste: boolean }
  | { type: 'gele'; id: number }
  | { type: 'mort'; id: number; x: number; y: number; ennemi: TypeEnnemi }
  | { type: 'tour'; degats: number }
  | { type: 'vague'; vague: number }
  | { type: 'perdu' }

export function nouvellePartie(c: ConfigMagie, graine: number): EtatMagie {
  return { t: 0, graine: graine >>> 0, phase: 'jeu', pv: c.tour.pv, file: [], pretA: 0, vague: 0, aFaire: [], prochaineVague: c.vague.pause, ennemis: [], rochers: [], prochainId: 1, abattus: 0 }
}

const compter = (file: Element[]): Compte => ({ feu: 0, froid: 0, foudre: 0, terre: 0, ...Object.fromEntries(ELEMENTS.map((k) => [k, file.filter((x) => x === k).length])) })

/** La forme d'un sort : de la terre, un rocher ; sinon de la foudre, un éclair ; sinon du feu ou du froid, un souffle. */
export function formeDe(file: Element[]): Forme {
  const n = compter(file)
  if (n.terre > 0) return 'rocher'
  if (n.foudre > 0) return 'eclair'
  if (n.feu + n.froid > 0) return 'souffle'
  return 'aucun'
}

/** Le nom du sort que la file lancerait, pour la page. */
export function nomDuSort(file: Element[]): string {
  const n = compter(file)
  const forme = formeDe(file)
  const force = file.length > 1 ? ` ×${file.length}` : ''
  if (forme === 'rocher') return `${n.feu > 0 ? 'Météore' : n.froid > 0 ? 'Rocher de glace' : 'Rocher'}${force}`
  if (forme === 'eclair') return `${n.feu > 0 ? 'Éclair ardent' : n.froid > 0 ? 'Éclair glacé' : 'Éclair'}${force}`
  if (forme === 'souffle') return `${n.feu > 0 ? 'Jet de flammes' : 'Souffle de givre'}${force}`
  return ''
}

/** Un élément entre dans la file : il annule son opposé s'il y est, sinon il s'ajoute (trois au plus). */
export function ajouter(c: ConfigMagie, e: EtatMagie, element: Element): Evenement[] {
  if (e.phase !== 'jeu') return []
  const i = e.file.indexOf(OPPOSE[element])
  if (i >= 0) {
    e.file.splice(i, 1)
    return [{ type: 'annule', element, contre: OPPOSE[element] }]
  }
  if (e.file.length >= c.file) return [{ type: 'pleine' }]
  e.file.push(element)
  return [{ type: 'element', element }]
}

export function viderLaFile(e: EtatMagie): void {
  e.file = []
}

export function pret(e: EtatMagie): boolean {
  return e.phase === 'jeu' && e.t >= e.pretA
}

// ---------------------------------------------------------------- les coups

const dist = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y)

/** Les dégâts d'un paquet d'éléments sur un ennemi, ses faiblesses comprises ; puis la brûlure, le froid, le recul. */
function frapper(c: ConfigMagie, e: EtatMagie, en: Ennemi, parElement: Compte, n: Compte, ev: Evenement[], recul: Point | null = null): void {
  if (en.pv <= 0) return
  const f = c.faiblesses[en.type]
  let degats = 0
  for (const k of ELEMENTS) degats += parElement[k] * f[k]
  degats = Math.round(degats)
  const resiste = ELEMENTS.some((k) => parElement[k] > 0 && f[k] < 1)
  en.pv -= degats
  ev.push({ type: 'touche', id: en.id, x: en.x, y: en.y, degats, resiste })
  if (n.feu > 0 && f.feu > 0) en.brule = { dps: c.brulure.dps * n.feu * f.feu, fin: e.t + c.brulure.duree }
  if (n.froid > 0) {
    en.ralenti = { part: Math.min(0.75, c.gel.ralenti * n.froid), fin: e.t + c.gel.duree }
    if (n.froid >= c.gel.glace) {
      en.geleA = e.t + c.gel.dureeGlace
      ev.push({ type: 'gele', id: en.id })
    }
  }
  if (recul !== null && n.terre > 0) {
    const d = Math.hypot(en.x - recul.x, en.y - recul.y) || 1
    en.x += ((en.x - recul.x) / d) * c.rocher.recul * n.terre
    en.y += ((en.y - recul.y) / d) * c.rocher.recul * n.terre
  }
  if (en.pv <= 0) mourir(e, en, ev)
}

function mourir(e: EtatMagie, en: Ennemi, ev: Evenement[]): void {
  en.pv = 0
  e.abattus += 1
  ev.push({ type: 'mort', id: en.id, x: en.x, y: en.y, ennemi: en.type })
}

/** L'écart d'angle entre la direction `dir` (unitaire) et le point `p`, vu de la tour. */
function ecart(dir: Point, p: Point): number {
  const a = Math.atan2(p.y, p.x) - Math.atan2(dir.y, dir.x)
  return Math.abs(Math.atan2(Math.sin(a), Math.cos(a)))
}

/** Le sort part vers le point `cible` : la file se vide, le magicien reprend son souffle. */
export function lancer(c: ConfigMagie, e: EtatMagie, cible: Point): Evenement[] {
  if (!pret(e) || e.file.length === 0) return []
  const n = compter(e.file)
  const forme = formeDe(e.file)
  e.file = []
  e.pretA = e.t + c.recharge
  const l = Math.hypot(cible.x, cible.y) || 1
  const dir = { x: cible.x / l, y: cible.y / l }
  const ev: Evenement[] = []
  const vivants = e.ennemis.filter((x) => x.pv > 0)

  if (forme === 'souffle') {
    ev.push({ type: 'souffle', dir, n })
    const parElement: Compte = { feu: c.cone.degats * n.feu, froid: c.cone.degats * n.froid, foudre: 0, terre: 0 }
    for (const en of vivants) {
      const d = Math.hypot(en.x, en.y)
      const r = c.ennemis[en.type].rayon
      if (d - r <= c.cone.portee && ecart(dir, en) <= c.cone.demiAngle + Math.atan2(r, Math.max(d, 1))) frapper(c, e, en, parElement, n, ev)
    }
  } else if (forme === 'eclair') {
    // Le premier touché : le plus proche de la tour, dans le cône visé ; puis il saute au plus proche qu'il n'a pas touché.
    const parElement: Compte = { feu: c.eclair.degatsAutres * n.feu, froid: c.eclair.degatsAutres * n.froid, foudre: c.eclair.degats * n.foudre, terre: 0 }
    const sauts = 1 + c.eclair.sautsParFoudre * n.foudre
    const points: Point[] = [{ x: 0, y: 0 }]
    const touches: Ennemi[] = []
    let ici: Ennemi | undefined = vivants
      .filter((en) => Math.hypot(en.x, en.y) <= c.eclair.portee && ecart(dir, en) <= c.eclair.angle)
      .sort((a, b) => Math.hypot(a.x, a.y) - Math.hypot(b.x, b.y))[0]
    while (ici !== undefined && touches.length < sauts) {
      touches.push(ici)
      points.push({ x: ici.x, y: ici.y })
      const de: Ennemi = ici
      ici = vivants.filter((x) => !touches.includes(x) && dist(x, de) <= c.eclair.saut).sort((a, b) => dist(a, de) - dist(b, de))[0]
    }
    if (touches.length === 0) points.push({ x: dir.x * c.eclair.portee, y: dir.y * c.eclair.portee })
    ev.push({ type: 'eclair', points, n })
    for (const en of touches) frapper(c, e, en, parElement, n, ev)
  } else if (forme === 'rocher') {
    const porte = Math.min(l, c.rocher.porteeMax)
    const r: Rocher = { id: e.prochainId++, x: dir.x * c.tour.rayon, y: dir.y * c.tour.rayon, cible: { x: dir.x * porte, y: dir.y * porte }, n }
    e.rochers.push(r)
    ev.push({ type: 'jet', id: r.id, n })
  }
  return ev
}

// ---------------------------------------------------------------- le temps

/** Le point où naît un ennemi : juste hors de l'écran, dans une direction tirée. */
function horsDeLEcran(vue: Vue, marge: number, angle: number): Point {
  const dx = Math.cos(angle)
  const dy = Math.sin(angle)
  const bordX = dx > 0 ? vue.droite + marge : -vue.gauche - marge
  const bordY = dy > 0 ? vue.bas + marge : -vue.haut - marge
  const k = Math.min(Math.abs(dx) > 1e-6 ? bordX / dx : Infinity, Math.abs(dy) > 1e-6 ? bordY / dy : Infinity)
  return { x: dx * k, y: dy * k }
}

function commencerLaVague(c: ConfigMagie, e: EtatMagie, ev: Evenement[]): void {
  e.vague += 1
  e.prochaineVague = null
  const rng = createRng(e.graine)
  const nombre = c.vague.base + c.vague.parVague * (e.vague - 1)
  const types = (Object.keys(c.ennemis) as TypeEnnemi[]).filter((k) => c.ennemis[k].depuis <= e.vague)
  const total = types.reduce((s, k) => s + c.ennemis[k].poids, 0)
  // Le type nouveau de la vague ouvre la marche, pour qu'on le voie seul.
  const neuf = types.find((k) => c.ennemis[k].depuis === e.vague && e.vague > 1)
  for (let i = 0; i < nombre; i++) {
    let type: TypeEnnemi = types[0]
    if (i === 0 && neuf !== undefined) type = neuf
    else {
      let u = rng.next() * total
      for (const k of types) {
        u -= c.ennemis[k].poids
        if (u < 0) {
          type = k
          break
        }
      }
    }
    e.aFaire.push({ type, t: e.t + (i * c.vague.etalement) / nombre })
  }
  e.graine = rng.getState()
  ev.push({ type: 'vague', vague: e.vague })
}

/** Fait avancer la partie de `dt` secondes. */
export function avancer(c: ConfigMagie, e: EtatMagie, dt: number, vue: Vue): Evenement[] {
  const ev: Evenement[] = []
  if (e.phase !== 'jeu') return ev
  e.t += dt

  // Les vagues : la pause, puis les naissances.
  if (e.prochaineVague !== null && e.t >= e.prochaineVague) commencerLaVague(c, e, ev)
  if (e.aFaire.length > 0) {
    const rng = createRng(e.graine)
    while (e.aFaire.length > 0 && e.aFaire[0].t <= e.t) {
      const { type } = e.aFaire.shift()!
      const m = c.ennemis[type]
      const p = horsDeLEcran(vue, c.vague.marge, rng.next() * Math.PI * 2)
      const pv = Math.round(m.pv * (1 + c.vague.durcissement * (e.vague - 1)))
      e.ennemis.push({ id: e.prochainId++, type, x: p.x, y: p.y, pv, pvMax: pv, brule: null, ralenti: null, geleA: 0, coupA: 0 })
    }
    e.graine = rng.getState()
  }

  // Les rochers volent, puis éclatent sur leur point (ou sur le premier ennemi qu'ils croisent).
  for (let i = e.rochers.length - 1; i >= 0; i--) {
    const r = e.rochers[i]
    const reste = dist(r, r.cible)
    const pas = c.rocher.vitesse * dt
    const heurte = e.ennemis.find((en) => en.pv > 0 && dist(en, r) <= c.ennemis[en.type].rayon + 1)
    if (pas >= reste || heurte !== undefined) {
      if (heurte === undefined) {
        r.x = r.cible.x
        r.y = r.cible.y
      }
      const rayon = c.rocher.rayon + c.rocher.rayonParFeu * r.n.feu
      ev.push({ type: 'impact', x: r.x, y: r.y, rayon, n: r.n })
      const parElement: Compte = { feu: c.rocher.degatsAutres * r.n.feu, froid: c.rocher.degatsAutres * r.n.froid, foudre: 0, terre: c.rocher.degats * r.n.terre }
      for (const en of e.ennemis) if (en.pv > 0 && dist(en, r) <= rayon + c.ennemis[en.type].rayon) frapper(c, e, en, parElement, r.n, ev, { x: r.x, y: r.y })
      e.rochers.splice(i, 1)
    } else {
      r.x += ((r.cible.x - r.x) / reste) * pas
      r.y += ((r.cible.y - r.y) / reste) * pas
    }
  }

  // Les ennemis : la brûlure, le gel, la marche, les coups sur la tour.
  for (const en of e.ennemis) {
    if (en.pv <= 0) continue
    const m = c.ennemis[en.type]
    if (en.brule !== null) {
      if (e.t >= en.brule.fin) en.brule = null
      else {
        en.pv -= en.brule.dps * dt
        if (en.pv <= 0) {
          mourir(e, en, ev)
          continue
        }
      }
    }
    if (en.ralenti !== null && e.t >= en.ralenti.fin) en.ralenti = null
    const d = Math.hypot(en.x, en.y)
    const auPied = c.tour.rayon + m.rayon
    if (d > auPied) {
      const vitesse = e.t < en.geleA ? 0 : m.vitesse * (1 - (en.ralenti?.part ?? 0))
      const pas = Math.min(vitesse * dt, d - auPied)
      en.x -= (en.x / d) * pas
      en.y -= (en.y / d) * pas
    } else if (e.t >= en.coupA && e.t >= en.geleA) {
      en.coupA = e.t + c.attaque
      e.pv = Math.max(0, e.pv - m.degats)
      ev.push({ type: 'tour', degats: m.degats })
      if (e.pv <= 0) {
        e.phase = 'perdu'
        ev.push({ type: 'perdu' })
        return ev
      }
    }
  }
  e.ennemis = e.ennemis.filter((en) => en.pv > 0)

  // La vague finie : la tour se répare un peu, la suivante se prépare.
  if (e.prochaineVague === null && e.aFaire.length === 0 && e.ennemis.length === 0 && e.vague > 0) {
    e.pv = Math.min(c.tour.pv, e.pv + c.tour.soinParVague)
    e.prochaineVague = e.t + c.vague.pause
  }
  return ev
}

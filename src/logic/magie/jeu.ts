/**
 * LA TOUR DU MAGICIEN — `?magie`, un side project (Keko, 07/11 : « une tour au
 * milieu de l'écran (la tour d'un magicien), avec des ennemis qui
 * approchent, et on lance des sorts à la Magicka »).
 *
 * **Le sort se COMPOSE** : on empile jusqu'à trois éléments (feu, froid,
 * foudre, terre, vie, mort), puis on touche le terrain pour le lancer vers ce
 * point. La composition donne la FORME — de la terre, un ROCHER lancé sur le
 * point ; sinon de la foudre, un ÉCLAIR qui saute d'ennemi en ennemi ; sinon
 * de la mort, un RAYON qui transperce tout en ligne ; sinon un SOUFFLE en cône
 * (de flammes ou de givre) ; de la vie seule, un HALO autour de la tour — et
 * chaque élément y ajoute son effet : le feu brûle, le froid ralentit (trois
 * froids gèlent), la terre repousse, la mort affaiblit, la vie soigne la tour
 * (le halo) ; **la vie avec un élément d'attaque INVOQUE UN PETIT
 * ÉLÉMENTAIRE** de cet élément (Keko : « ce serait cool que vie + feu / glace
 * / foudre / terre crée un petit élémentaire »), posé où l'on touche, qui court
 * sur l'ennemi le plus proche et le frappe à sa manière, un temps. **Les
 * opposés s'annulent** en entrant dans la file : le feu et le froid, la foudre
 * et la terre, la vie et la mort (Keko, 07/11 : « on peut ajouter vie et mort,
 * comme dans Magicka ? »). Certains ennemis résistent à un élément (un esprit
 * de feu ne brûle pas, la foudre glisse sur le golem, la mort ne fait rien au
 * squelette, que la vie brûle) : il faut changer de sort.
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

export type Element = 'feu' | 'froid' | 'foudre' | 'terre' | 'vie' | 'mort'
export const ELEMENTS: Element[] = ['feu', 'froid', 'foudre', 'terre', 'vie', 'mort']
export const OPPOSE: Record<Element, Element> = { feu: 'froid', froid: 'feu', foudre: 'terre', terre: 'foudre', vie: 'mort', mort: 'vie' }

export type TypeEnnemi = 'gobelin' | 'orc' | 'esprit' | 'golem' | 'squelette'
export type Compte = Record<Element, number>
const VIDE: Compte = { feu: 0, froid: 0, foudre: 0, terre: 0, vie: 0, mort: 0 }

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
  /** Le rayon de mort : une ligne depuis la tour, qui transperce tout ce qu'elle croise (à tant de la ligne) ; ses dégâts par mort (et par autre élément). */
  rayon: { portee: 44, largeur: 3, degats: 8, degatsAutres: 3 },
  /** La mort affaiblit : les touchés prennent tant de dégâts en plus par mort, tant de secondes. */
  affaiblissement: { part: 0.25, max: 0.75, duree: 4 },
  /** La vie : le halo (de la vie seule) soigne la tour de tant par vie et brûle les morts-vivants dans son rayon. */
  vie: { soin: 3, rayon: 18, degats: 5 },
  /** L'élémentaire (la vie + un élément d'attaque) : posé à tant de la tour au plus, il vit tant de secondes (plus tant par vie en plus), tant à la fois ; chacun sa vitesse, sa portée, sa cadence, ses dégâts par élément. */
  elementaire: {
    max: 3,
    duree: 10,
    dureeParVie: 5,
    porteeInvocation: 30,
    par: {
      feu: { vitesse: 9, portee: 4, cadence: 0.7, degats: 2 },
      froid: { vitesse: 8, portee: 5, cadence: 0.8, degats: 2 },
      foudre: { vitesse: 6, portee: 16, cadence: 0.9, degats: 3 },
      terre: { vitesse: 4, portee: 4, cadence: 1.2, degats: 6 },
    } satisfies Partial<Record<Element, { vitesse: number; portee: number; cadence: number; degats: number }>>,
  },
  ennemis: {
    gobelin: { nom: 'Gobelin', pv: 10, vitesse: 7, degats: 1, rayon: 2.6, depuis: 1, poids: 4 },
    orc: { nom: 'Orc', pv: 30, vitesse: 4.5, degats: 3, rayon: 3.6, depuis: 2, poids: 2 },
    esprit: { nom: 'Esprit de feu', pv: 14, vitesse: 6.5, degats: 2, rayon: 2.8, depuis: 3, poids: 2 },
    golem: { nom: 'Golem', pv: 40, vitesse: 3.5, degats: 4, rayon: 4.2, depuis: 4, poids: 1 },
    squelette: { nom: 'Squelette', pv: 18, vitesse: 5.5, degats: 2, rayon: 3, depuis: 5, poids: 2 },
  } satisfies Record<TypeEnnemi, { nom: string; pv: number; vitesse: number; degats: number; rayon: number; depuis: number; poids: number }>,
  /** Ce que chaque élément fait à chaque ennemi (1 : normal). La vie ne blesse que les morts-vivants ; la mort ne leur fait rien. */
  faiblesses: {
    gobelin: { feu: 1, froid: 1, foudre: 1, terre: 1, vie: 0, mort: 1 },
    orc: { feu: 1, froid: 1, foudre: 1, terre: 1, vie: 0, mort: 1 },
    esprit: { feu: 0, froid: 2, foudre: 1, terre: 1, vie: 0, mort: 1 },
    golem: { feu: 0.5, froid: 1, foudre: 0.25, terre: 2, vie: 0, mort: 1 },
    squelette: { feu: 1, froid: 1, foudre: 1, terre: 1, vie: 2, mort: 0 },
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
export type Forme = 'aucun' | 'souffle' | 'eclair' | 'rocher' | 'rayon' | 'halo' | 'elementaire'
/** Les éléments qui peuvent faire un élémentaire (avec la vie). */
export type ElementDAttaque = 'feu' | 'froid' | 'foudre' | 'terre'
const ATTAQUE: ElementDAttaque[] = ['feu', 'froid', 'foudre', 'terre']
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
  /** Affaibli par la mort : il prend tant de dégâts en plus, jusqu'à quand. */
  affaibli: { part: number; fin: number } | null
  /** Gelé jusque-là. */
  geleA: number
  /** Son prochain coup sur la tour. */
  coupA: number
}

export type Rocher = { id: number; x: number; y: number; cible: Point; n: Compte }
/** Un élémentaire invoqué : son élément, combien de fois il était dans le sort (sa force), jusqu'à quand il vit, son prochain coup. */
export type Elementaire = { id: number; element: ElementDAttaque; force: number; x: number; y: number; ne: number; fin: number; coupA: number }

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
  elementaires: Elementaire[]
  prochainId: number
  abattus: number
}

export type Evenement =
  | { type: 'element'; element: Element }
  | { type: 'annule'; element: Element; contre: Element }
  | { type: 'pleine' }
  | { type: 'souffle'; dir: Point; n: Compte }
  | { type: 'eclair'; points: Point[]; n: Compte }
  | { type: 'rayon'; dir: Point; n: Compte }
  | { type: 'halo'; n: Compte }
  /** La tour regagne tant de PV (le halo). */
  | { type: 'soigne'; pv: number }
  | { type: 'invoque'; id: number; x: number; y: number; element: ElementDAttaque }
  /** Un élémentaire frappe un ennemi, de là à là. */
  | { type: 'coup'; id: number; de: Point; a: Point; element: ElementDAttaque }
  | { type: 'disparait'; id: number; x: number; y: number; element: ElementDAttaque }
  | { type: 'jet'; id: number; n: Compte }
  | { type: 'impact'; x: number; y: number; rayon: number; n: Compte }
  | { type: 'touche'; id: number; x: number; y: number; degats: number; resiste: boolean }
  | { type: 'gele'; id: number }
  | { type: 'mort'; id: number; x: number; y: number; ennemi: TypeEnnemi }
  | { type: 'tour'; degats: number }
  | { type: 'vague'; vague: number }
  | { type: 'perdu' }

export function nouvellePartie(c: ConfigMagie, graine: number): EtatMagie {
  return { t: 0, graine: graine >>> 0, phase: 'jeu', pv: c.tour.pv, file: [], pretA: 0, vague: 0, aFaire: [], prochaineVague: c.vague.pause, ennemis: [], rochers: [], elementaires: [], prochainId: 1, abattus: 0 }
}

const compter = (file: Element[]): Compte => ({ ...VIDE, ...Object.fromEntries(ELEMENTS.map((k) => [k, file.filter((x) => x === k).length])) })

/** Les dégâts de chaque élément du paquet : `degats` pour l'élément qui fait la forme, `autres` pour ceux qui l'accompagnent. */
const paquet = (n: Compte, principal: Element | null, degats: number, autres: number): Compte => ({ ...VIDE, ...Object.fromEntries(ELEMENTS.map((k) => [k, (k === principal ? degats : autres) * n[k]])) })

/** L'élément de l'élémentaire qu'une file invoquerait : le premier élément d'attaque posé (avec la vie) ; `null` sinon. */
export function elementDe(file: Element[]): ElementDAttaque | null {
  if (!file.includes('vie')) return null
  return (file.find((k) => (ATTAQUE as Element[]).includes(k)) as ElementDAttaque | undefined) ?? null
}

/** La forme d'un sort : de la vie et un élément d'attaque, un élémentaire ; sinon de la terre, un rocher ; sinon de la foudre, un éclair ; sinon de la mort, un rayon ; sinon du feu ou du froid, un souffle ; de la vie seule, un halo. */
export function formeDe(file: Element[]): Forme {
  const n = compter(file)
  if (elementDe(file) !== null) return 'elementaire'
  if (n.terre > 0) return 'rocher'
  if (n.foudre > 0) return 'eclair'
  if (n.mort > 0) return 'rayon'
  if (n.feu + n.froid > 0) return 'souffle'
  if (n.vie > 0) return 'halo'
  return 'aucun'
}

/** Le nom du sort que la file lancerait, pour la page (Keko : « feu + foudre = éclair de feu »). */
export function nomDuSort(file: Element[]): string {
  const n = compter(file)
  const forme = formeDe(file)
  const force = file.length > 1 ? ` ×${file.length}` : ''
  const de = n.feu > 0 ? ' de feu' : n.froid > 0 ? ' de glace' : n.mort > 0 ? ' de mort' : ''
  if (forme === 'elementaire') return `Élémentaire${{ feu: ' de feu', froid: ' de glace', foudre: ' de foudre', terre: ' de terre' }[elementDe(file)!]}${force}`
  if (forme === 'rocher') return `Rocher${de}${force}`
  if (forme === 'eclair') return `Éclair${n.feu > 0 ? ' de feu' : n.froid > 0 ? ' de givre' : n.mort > 0 ? ' de mort' : ''}${force}`
  if (forme === 'rayon') return `Rayon de mort${n.feu > 0 ? ' ardent' : n.froid > 0 ? ' glacé' : ''}${force}`
  if (forme === 'souffle') return `${n.feu > 0 ? 'Jet de flammes' : 'Souffle de givre'}${force}`
  if (forme === 'halo') return `Halo de vie${force}`
  return ''
}

/** Ce que fera le sort, en quelques mots : sa forme, puis ce que chaque élément y ajoute. */
export function effetsDuSort(c: ConfigMagie, file: Element[]): string[] {
  const n = compter(file)
  const forme = formeDe(file)
  if (forme === 'aucun') return []
  const effets: string[] = []
  if (forme === 'elementaire') {
    const el = elementDe(file)!
    const vies = n.vie
    effets.push(`combat ${c.elementaire.duree + c.elementaire.dureeParVie * (vies - 1)} s`, n[el] > 1 ? `frappe ×${n[el]}` : '', { feu: 'brûle', froid: 'ralentit', foudre: 'frappe de loin', terre: 'repousse' }[el])
    return effets.filter((x) => x !== '')
  }
  if (forme === 'rocher') effets.push(n.feu > 0 ? 'explose large' : 'éclate', 'repousse')
  if (forme === 'eclair') effets.push(`saute sur ${1 + c.eclair.sautsParFoudre * n.foudre} ennemis`)
  if (forme === 'rayon') effets.push('transperce en ligne')
  if (forme === 'souffle') effets.push('cône devant la tour')
  if (forme === 'halo') effets.push(`soigne la tour de ${c.vie.soin * n.vie}`, 'brûle les morts-vivants autour')
  if (n.feu > 0) effets.push('brûle')
  if (n.froid > 0) effets.push(n.froid >= c.gel.glace ? 'gèle' : 'ralentit')
  if (n.mort > 0) effets.push('affaiblit')
  return effets
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

/** La tour regagne `pv` (jusqu'à son maximum) ; l'événement dit combien. */
function soigner(c: ConfigMagie, e: EtatMagie, pv: number, ev: Evenement[]): void {
  const gagne = Math.min(c.tour.pv, e.pv + pv) - e.pv
  if (gagne <= 0) return
  e.pv += gagne
  ev.push({ type: 'soigne', pv: gagne })
}

/** Les dégâts d'un paquet d'éléments sur un ennemi, ses faiblesses comprises (et son affaiblissement) ; puis la brûlure, le froid, le recul, l'affaiblissement. */
function frapper(c: ConfigMagie, e: EtatMagie, en: Ennemi, parElement: Compte, n: Compte, ev: Evenement[], recul: Point | null = null): void {
  if (en.pv <= 0) return
  const f = c.faiblesses[en.type]
  let degats = 0
  for (const k of ELEMENTS) degats += parElement[k] * f[k]
  if (en.affaibli !== null && e.t < en.affaibli.fin) degats *= 1 + en.affaibli.part
  degats = Math.round(degats)
  // La vie ne blesse pas les vivants : ce n'est pas une résistance, c'est sa nature.
  const resiste = ELEMENTS.some((k) => k !== 'vie' && parElement[k] > 0 && f[k] < 1)
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
  if (n.mort > 0 && f.mort > 0) en.affaibli = { part: Math.min(c.affaiblissement.max, c.affaiblissement.part * n.mort), fin: e.t + c.affaiblissement.duree }
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
  const elementaire = elementDe(e.file)
  e.file = []
  e.pretA = e.t + c.recharge
  const l = Math.hypot(cible.x, cible.y) || 1
  const dir = { x: cible.x / l, y: cible.y / l }
  const ev: Evenement[] = []
  const vivants = e.ennemis.filter((x) => x.pv > 0)

  if (forme === 'souffle') {
    ev.push({ type: 'souffle', dir, n })
    const parElement = paquet(n, null, c.cone.degats, c.cone.degats)
    for (const en of vivants) {
      const d = Math.hypot(en.x, en.y)
      const r = c.ennemis[en.type].rayon
      if (d - r <= c.cone.portee && ecart(dir, en) <= c.cone.demiAngle + Math.atan2(r, Math.max(d, 1))) frapper(c, e, en, parElement, n, ev)
    }
  } else if (forme === 'halo') {
    // La vie seule : la tour se soigne, et les morts-vivants autour d'elle brûlent.
    ev.push({ type: 'halo', n })
    soigner(c, e, c.vie.soin * n.vie, ev)
    const parElement = paquet(n, 'vie', c.vie.degats, 0)
    for (const en of vivants) if (Math.hypot(en.x, en.y) - c.ennemis[en.type].rayon <= c.vie.rayon && c.faiblesses[en.type].vie > 0) frapper(c, e, en, parElement, n, ev)
  } else if (forme === 'elementaire') {
    // La vie et un élément d'attaque : un élémentaire naît au point touché (à portée d'invocation), le plus vieux s'efface s'ils sont trop.
    const el = elementaire!
    const porte = Math.min(l, c.elementaire.porteeInvocation)
    while (e.elementaires.length >= c.elementaire.max) {
      const vieux = e.elementaires.shift()!
      ev.push({ type: 'disparait', id: vieux.id, x: vieux.x, y: vieux.y, element: vieux.element })
    }
    const inv: Elementaire = { id: e.prochainId++, element: el, force: n[el], x: dir.x * porte, y: dir.y * porte, ne: e.t, fin: e.t + c.elementaire.duree + c.elementaire.dureeParVie * (n.vie - 1), coupA: e.t + 0.3 }
    e.elementaires.push(inv)
    ev.push({ type: 'invoque', id: inv.id, x: inv.x, y: inv.y, element: el })
  } else if (forme === 'rayon') {
    // La mort : une ligne depuis la tour, qui transperce tout ce qu'elle croise.
    ev.push({ type: 'rayon', dir, n })
    const parElement = paquet(n, 'mort', c.rayon.degats, c.rayon.degatsAutres)
    for (const en of vivants) {
      const le = en.x * dir.x + en.y * dir.y
      const ecartLigne = Math.abs(en.x * dir.y - en.y * dir.x)
      if (le > 0 && le - c.ennemis[en.type].rayon <= c.rayon.portee && ecartLigne <= c.rayon.largeur + c.ennemis[en.type].rayon) frapper(c, e, en, parElement, n, ev)
    }
  } else if (forme === 'eclair') {
    // Le premier touché : le plus proche de la tour, dans le cône visé ; puis il saute au plus proche qu'il n'a pas touché.
    const parElement = paquet(n, 'foudre', c.eclair.degats, c.eclair.degatsAutres)
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
      e.ennemis.push({ id: e.prochainId++, type, x: p.x, y: p.y, pv, pvMax: pv, brule: null, ralenti: null, affaibli: null, geleA: 0, coupA: 0 })
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
      const parElement = paquet(r.n, 'terre', c.rocher.degats, c.rocher.degatsAutres)
      for (const en of e.ennemis) if (en.pv > 0 && dist(en, r) <= rayon + c.ennemis[en.type].rayon) frapper(c, e, en, parElement, r.n, ev, { x: r.x, y: r.y })
      e.rochers.splice(i, 1)
    } else {
      r.x += ((r.cible.x - r.x) / reste) * pas
      r.y += ((r.cible.y - r.y) / reste) * pas
    }
  }

  // Les élémentaires : ils s'effacent à leur heure ; sinon ils courent sur l'ennemi le plus proche et le frappent à leur cadence, à la manière de leur élément.
  for (let i = e.elementaires.length - 1; i >= 0; i--) {
    const el = e.elementaires[i]
    if (e.t >= el.fin) {
      ev.push({ type: 'disparait', id: el.id, x: el.x, y: el.y, element: el.element })
      e.elementaires.splice(i, 1)
      continue
    }
    const p = c.elementaire.par[el.element]
    const cible = e.ennemis.filter((en) => en.pv > 0).sort((a, b) => dist(a, el) - dist(b, el))[0]
    if (cible === undefined) continue
    const d = dist(cible, el)
    const aPortee = p.portee + c.ennemis[cible.type].rayon
    if (d > aPortee) {
      const pas = Math.min(p.vitesse * dt, d - aPortee)
      el.x += ((cible.x - el.x) / d) * pas
      el.y += ((cible.y - el.y) / d) * pas
    } else if (e.t >= el.coupA) {
      el.coupA = e.t + p.cadence
      ev.push({ type: 'coup', id: el.id, de: { x: el.x, y: el.y }, a: { x: cible.x, y: cible.y }, element: el.element })
      const parElement: Compte = { ...VIDE, [el.element]: p.degats * el.force }
      const n: Compte = { ...VIDE, [el.element]: el.force }
      frapper(c, e, cible, parElement, n, ev, { x: el.x, y: el.y })
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
    if (en.affaibli !== null && e.t >= en.affaibli.fin) en.affaibli = null
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

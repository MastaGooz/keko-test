/**
 * LE VAISSEAU À L'ÉCRAN — `?vaisseau`, un side project (Keko, 08/11 : « on conduit un petit vaisseau dans l'espace,
 * le déplacement du vampire survivor, juste le vaisseau et un fond type espace avec quelques astéroïdes »).
 *
 * Tout est en PIXEL ART, dessiné dans un tampon de pixelfx (180 × 320, agrandi par un entier) : le vaisseau au centre
 * de l'écran, tourné vers son cap (le peintre du dépôt sait tourner : `place(x, y, flip, angle)`), sa flamme qui suit
 * la poussée et sème des braises (les particules du dépôt, en coordonnées du monde) ; le monde défile autour de lui,
 * trois couches d'étoiles en parallaxe et des nébuleuses de lumière, tirées des coordonnées de chaque case, et les
 * astéroïdes du champ seedé (`logic/vaisseau/jeu.ts`), des polygones rocheux ombrés qui tournent lentement. Un choc
 * fait une étincelle du dépôt, une secousse et une vibration. Le manche flottant du survivor se dessine sur une
 * surcouche en pixels d'écran.
 */
import './vaisseau.css'
import * as noyau from 'pixelfx'
import { asteroidesVisibles, avancerLeMonde, cargaisonVide, centreQuiSuit, directionDuManche, MANCHE, MINERAIS, nouveauMonde, solidite, stationDeLaCase, stationLaPlusProche, tire, totalDe, VAISSEAU as C, type Cargaison, type ConfigVaisseau, type Minerai, type Forage, type Vaisseau, type Vecteur } from '../../logic/vaisseau/jeu.ts'
import { acheter, ajouterLesPiecesDEssai, armesMontees, capacite, configDuHangar, demonter, EMPLACEMENTS, estMontee, FICHES_MINERAI, foreuseMontee, hangarNeuf, jaugesDe, monteeA, monter, peutAcheter, peutMonter, pieceDe, piecesDe, possede, radarMonte, vendre, type Jauge, type Piece, type Sorte } from '../../logic/vaisseau/hangar.ts'
import { drawWord, panel, spell } from 'pixelfx/fx/ui/_lib'
import { chargerHangar, sauverHangar } from './hangar.ts'
import { dessinerAsteroide, LUMIERE, rocheDe, TEINTES_MINERAI } from './asteroide.ts'
import { dessinerStation } from './station.ts'
import * as EXPLOSION from '../pixelfx/fx/keko/explosion-espace.js'
import * as TELEPORTATION from '../pixelfx/fx/keko/teleportation.js'
import { RASSEMBLE as TELEPORTE_A } from '../pixelfx/fx/keko/teleportation.js'
import * as MATERIALISATION from '../pixelfx/fx/keko/materialisation.js'
import { APPARAIT as ARRIVE_A, REFROIDI as REFROIDI_A } from '../pixelfx/fx/keko/materialisation.js'
import { Grains } from '../pixelfx/fx/keko/_espace.js'

type Instance = { t: number; options: Record<string, unknown>; update(dt: number): void; draw(frame: unknown, couche?: string): void; stop(): void; done(): boolean }
type Module = { meta?: Record<string, unknown> }
type Peintre = {
  place(x: number, y: number, flip?: boolean, angle?: number): Peintre
  px(x: number, y: number, c: number): void
  dot(x: number, y: number, c: number, a?: number): void
  circle(x: number, y: number, r: number, c: number | ((x: number, y: number) => number), a?: number): void
  ring(x: number, y: number, r: number, w: number, c: number | ((x: number, y: number) => number), a?: number): void
  text(texte: string, x: number, y: number, c: number, o?: { font?: string; scale?: number; align?: string; outline?: number; shadow?: number; a?: number }): void
  glowLine(x0: number, y0: number, x1: number, y1: number, r: number, c: number, k?: number): void
  arc(x: number, y: number, r: number, w: number, a0: number, a1: number, c: number | ((u: number, v: number) => number), a?: number): void
  poly(pts: number[][], c: number | ((x: number, y: number) => number), a?: number): void
  rect(x: number, y: number, w: number, h: number, c: number, a?: number): void
  measure(texte: string, o?: { font?: string; scale?: number }): [number, number]
  line(x0: number, y0: number, x1: number, y1: number, c: number, a?: number): void
  glow(x: number, y: number, r: number, c: number, k?: number): void
}
type Particules = { spawn(k: number, x: number, y: number, vx: number, vy: number, vie: number, c?: number, taille?: number): void; update(dt: number): void; draw(p: Peintre, couche?: string): void }
type Morceaux = { add(b: Record<string, unknown>): void; update(dt: number): void; draw(p: Peintre): void }
type Noyau = {
  createFrame(w: number, h: number): { w: number; h: number; color: Uint32Array; light: Uint32Array }
  clearFrame<T>(f: T): T
  createFx(mod: Module, o: Record<string, unknown>): Instance
  composite(f: unknown, sortie: Uint8ClampedArray, fond: Uint32Array | number | null): void
  painterFor(frame: unknown): Peintre
  fit(palette: string[], n: number): number[]
  hex(h: string): number
  Particles: new (o: Record<string, unknown>) => Particules
  Bits: new (o: Record<string, unknown>) => Morceaux
  B: Record<string, number>
  sparkle(p: Peintre, x: number, y: number, bras: number, c: number, pointe?: number, k?: number): void
  Rng: new (graine: number) => { next(): number; range(a: number, b: number): number }
  P: Record<string, number>
  PAL: Record<string, string[]>
  WHITE: number
}
const N = noyau as unknown as Noyau

/** La scène fait 180 px de large ; SA HAUTEUR SUIT L'ÉCRAN (Keko : « le score est trop bas, il n'est plus en haut » — à 320 px fixes, centrée, elle laissait cent pixels de noir au-dessus d'elle). */
const W = 180
let H = 320
const PAS = 1 / 60
const COQUE = N.fit(['#141a2a', '#2a3550', '#46587a', '#6f87ab', '#9fb4d2', '#d6e4f5', '#ffffff'], 7)
const VERRIERE = N.fit(['#0a3a4a', '#19a0c0', '#8ff0ff', '#ffffff'], 4)
/** La rune des crédits : du vert. */
const RUNE = N.fit(['#0a3a1e', '#1f8a4a', '#4ee08a', '#b8ffd0', '#ffffff'], 5)
/** La coque blindée du hangar : un acier plus sombre. */
const BLINDEE = N.fit(['#0e1216', '#20272e', '#36414a', '#54626c', '#7a8c98', '#adbdc6', '#ffffff'], 7)
const FEU = N.fit(N.PAL.fire, 8)
/** La flamme du propulseur ionique (cran 3 du hangar) : bleue. */
const ION = N.fit(['#061a3a', '#0a3a7a', '#1a7ad0', '#3ab0ff', '#80e0ff', '#c8f4ff', '#ffffff', '#ffffff'], 8)
const LASER = N.fit(['#3a0a10', '#a01020', '#ff2a3a', '#ff7a5a', '#ffd0a0', '#ffffff'], 6)
const PEPITE = N.fit(['#3a2a06', '#b8860b', '#ffd23a', '#fff6c0', '#ffffff'], 5)
/** L'ennemi : une coque rouge sombre, une verrière orange, un laser violet. */
const ROUGE = N.fit(['#1a0a0e', '#4a1a22', '#7a2a36', '#a8404c', '#d06a70', '#f0a0a0', '#ffffff'], 7)
const VERRIERE_ENNEMIE = N.fit(['#4a2a06', '#d07a18', '#ffc860', '#ffffff'], 4)
const VIOLET = N.fit(['#1a0a2a', '#5a1a90', '#9a3ae0', '#c070ff', '#e8c0ff', '#ffffff'], 6)
const BLANC = N.fit(['#ffffff', '#ffffff', '#ffffff', '#ffffff', '#ffffff', '#ffffff', '#ffffff'], 7)
/** Les teintes de la station : l'acier, la verrière, l'or du quai, le fanal, les cellules des panneaux. */
const TEINTES_STATION = {
  acier: N.fit(['#0c0e14', '#1c2230', '#2e3648', '#4a5468', '#6e7a90', '#9aa6ba', '#d0d8e6', '#ffffff'], 8),
  verre: VERRIERE,
  or: PEPITE,
  rouge: N.hex('#ff3a3a'),
  cellule: N.fit(['#0a1430', '#152a60', '#2a4a9a'], 3),
}
/** L'explosion d'un vaisseau : celle du dépôt sans son sol, à la taille du vaisseau (Keko : « l'effet nommé Explosion en version sans sol et à la taille du vaisseau ») ; le rival en rouge, ses morceaux de sa coque. */
const EXPLOSION_RIVAL = ['#3a0a12', '#a01030', '#e0304a', '#ff6a5a', '#ffa080', '#ffd0b0', '#ffe8dc', '#ffffff']
const FOND = N.hex('#07060f')
/**
 * Le texte pour la police en pixels du dépôt (3 × 5 et 5 × 7, des capitales sans accents) : « Décoller » → « DECOLLER ».
 * Un signe qu'elle n'a pas serait une espace.
 */
const texteNu = (s: string): string => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[’‘]/g, "'").replace(/[—–]/g, '-').replace(/[«»"]/g, '').toUpperCase()
const COULEURS_NEBULEUSE = ['#3a1a6a', '#14305a', '#5a1a40', '#103a3a'].map((h) => N.hex(h))

export function monterVaisseau(racine: HTMLElement, build: string): void {
  document.documentElement.classList.add('vaisseau-page')
  racine.classList.add('vaisseau')
  const parametres = new URLSearchParams(location.search)
  const suivre = parametres.get('controle') === 'suivre'
  /** `&minerai=N` : part avec N pepites a bord, pour voir le compteur sans miner (ce qui se teste doit s'ouvrir d'un lien). */
  const minerai0 = Math.max(0, Number(parametres.get('minerai')) || 0)
  /** `&ennemi` : l'ennemi naît tout de suite (pour le voir sans attendre) — à la même distance qu'en jeu : né à 90, on le voyait apparaître à l'écran (Keko : « il devrait toujours apparaître hors champ »). */
  const BASE: ConfigVaisseau = parametres.has('ennemi') ? { ...C, ennemi: { ...C.ennemi, apparait: 0 } } : C
  /**
   * LE HANGAR (Keko, 09/11 : « un menu avant de lancer la game où le joueur choisit son vaisseau en sélectionnant les
   * différentes pièces qu'il possède ») : les pièces possédées et montées, et le TRÉSOR des expéditions achevées, gardés
   * sur l'appareil (`ui/vaisseau/hangar.ts`). `&tresor=N` pose N fer de trésor, pour essayer les achats d'un lien.
   */
  /** `&credits=N` : pose N crédits, pour essayer les achats d'un lien. */
  const credits0 = parametres.has('credits') ? Math.max(0, Number(parametres.get('credits')) || 0) : null
  /** `&pieces` : des dizaines de pièces d'essai dans le catalogue, pour voir le hangar quand il y en a beaucoup (Keko). */
  if (parametres.has('pieces')) ajouterLesPiecesDEssai()
  let { hangar, tresor, credits } = chargerHangar()
  const sauver = (): void => sauverHangar(hangar, tresor, credits)
  if (parametres.has('tresor')) {
    tresor = { ...tresor, fer: Math.max(0, Number(parametres.get('tresor')) || 0) }
    sauver()
  }
  if (credits0 !== null) {
    credits = credits0
    sauver()
  }
  /** La configuration du vaisseau du joueur : celle de série passée par les pièces montées — refaite à chaque décollage. */
  let CONF: ConfigVaisseau = configDuHangar(BASE, hangar)

  const scene = document.createElement('div')
  scene.className = 'vaisseau-scene'
  const canvas = document.createElement('canvas')
  canvas.className = 'vaisseau-canvas'
  canvas.width = W
  canvas.height = H
  const g = canvas.getContext('2d')!
  scene.append(canvas)
  racine.append(scene)
  /**
   * L'ÉCRAN (l'accueil, le bilan, le hangar) EST EN PIXELS, dans le même tampon que le jeu (Keko, 09/11 : « je ne veux
   * plus un seul élément non pixel ») : un titre, un texte, puis le hangar et « Décoller » ; ses zones touchables sont
   * refaites à chaque image dessinée, en pixels du tampon.
   */
  let zones: { x: number; y: number; w: number; h: number; action: () => void }[] = []

  // ---------------------------------------------------------------- l'état
  /** `&quai` : le compte de l'extraction court dès le départ, sans sortir du parvis — pour juger l'arc d'un lien. */
  const monterLeMonde = () => {
    const monde = nouveauMonde(CONF)
    if (parametres.has('quai')) monde.sorti = true
    return monde
  }
  let m = monterLeMonde()
  m.minerai = minerai0
  m.cargaison.fer = minerai0
  let v: Vaisseau = m.vaisseau
  let perduA = -10
  /** L'instant de l'arrivée par téléportation (chaque expédition commence par là : le vaisseau n'est dessiné qu'à `ARRIVE_A`, blanchi jusqu'à `REFROIDI_A`, et ne répond pas avant). */
  let arriveA = -10
  let toucheA = -10
  /** L'instant où chaque rival a pris un obus (il blanchit), et celui du dernier coup pris par le bouclier (son anneau flashe). */
  const toucheEnnemiA = new Map<number, number>()
  let bouclierA = -10
  const flammesEnnemies = new Map<number, number>()
  let enJeu = false
  let zoom = 2
  let frame = N.createFrame(W, H)
  let img = g.createImageData(W, H)
  const R = new N.Rng(7)
  /** Les grains de l'espace : sans pesanteur ni montée (Keko : « des débris tombent vers le bas comme s'il y avait de la gravité »). */
  const braises = new Grains(R)
  /** Les étincelles des chocs vivent DANS LE MONDE : on garde leur point et on les replace sous la caméra à chaque image. */
  let effets: { fx: Instance; x: number; y: number }[] = []
  /** Le forage : les étincelles du point d'impact, les morceaux des roches éclatées (sans pesanteur : l'espace), les flashs. */
  const etincelles = new Grains(R)
  const morceaux = new N.Bits({ ground: () => Infinity })
  const flashs: { x: number; y: number; t0: number; r: number; c?: number[] }[] = []
  /** LE SCORE EN PIXELS (Keko : « dessiner le score en haut en pixel ») : une pépite ramassée VOLE du vaisseau au compteur, qui ne compte qu'à son arrivée, et s'allume. */
  const envols: { x: number; y: number; t0: number; minerai: Minerai }[] = []
  /** Ce que les compteurs montrent, par minerai (les pépites en vol n'y sont pas encore). Rien ne montre ce qui est déjà extrait (Keko). */
  const affiche: Cargaison = { ...cargaisonVide(), fer: minerai0 }
  const allumeA: Cargaison = { fer: -10, or: -10, cristal: -10 }
  const COMPTEUR = { x: 16, y: 10 }
  let secousse = 0
  let flamme = 0
  let t = 0
  /** La caméra : le vaisseau au centre, avec un peu d'avance dans le sens de la vitesse, amortie. */
  const camera = { x: 0, y: 0 }

  function cadrer(): void {
    // le zoom vient de la largeur, et de la hauteur aussi : l'écran en pixels (l'accueil et le hangar) veut 320 px de
    // tampon — sur un PC en 1080 de haut, 3 plutôt que 6 ; la hauteur du tampon est celle de l'écran à ce zoom, bornée à 480
    zoom = Math.max(1, Math.min(6, Math.floor(racine.clientWidth / W), Math.floor(racine.clientHeight / 320)))
    const h = Math.max(120, Math.min(480, Math.ceil(racine.clientHeight / zoom)))
    if (h !== H || canvas.height !== h) {
      H = h
      canvas.height = H
      frame = N.createFrame(W, H)
      img = g.createImageData(W, H)
    }
    canvas.style.width = `${W * zoom}px`
    canvas.style.height = `${H * zoom}px`
  }

  // ---------------------------------------------------------------- le manche (celui du survivor)
  let manche: { id: number; centre: Vecteur; doigt: Vecteur } | null = null
  const touches = new Set<string>()
  /**
   * Le décollage, depuis le hangar (le bouton) ou au clavier : l'expédition part à neuf avec le vaisseau tel que monté
   * (la configuration se refait des pièces) ; après une coque percée ou une extraction, pareil — le trésor et les pièces
   * restent, c'est tout ce qui reste.
   */
  function demarrer(): void {
    if (enJeu && m.phase === 'vol') return
    if (enJeu && t - perduA < 1.2) return
    CONF = configDuHangar(BASE, hangar)
    m = monterLeMonde()
    m.minerai = minerai0
    m.cargaison.fer = minerai0
    m.tresor = { ...tresor }
    m.banque = totalDe(tresor)
    effets = []
    flashs.length = 0
    envols.length = 0
    for (const k of MINERAIS) affiche[k] = 0
    affiche.fer = minerai0
    flammesEnnemies.clear()
    toucheEnnemiA.clear()
    v = m.vaisseau
    camera.x = 0
    camera.y = 0
    enJeu = true
    // L'ARRIVÉE (Keko : « une animation de téléportation aussi au début, comme si le vaisseau était téléporté sur
    // l'extracteur ») : la matérialisation à la place du vaisseau, qui n'apparaît qu'à son ouverture
    arriveA = t
    effets.push({ fx: N.createFx(MATERIALISATION as Module, { x: v.x - camera.x + W / 2, y: v.y - camera.y + H / 2, rayon: CONF.rayon, seed: 4 }), x: v.x, y: v.y })
  }

  // ---------------------------------------------------------------- le hangar, en pixels
  /** L'allure du vaisseau : les crans des pièces montées et ses armes, lus par le dessin (le rival est de série, sans arme) ; `bouclier` : la part du bouclier qui reste, pour son anneau. */
  type Allure = { propulseur: number; coque: number; /** Le cran de la foreuse montée, 0 sans foreuse. */ foreuse: number; radar: boolean; armes: string[]; bouclier: number }
  const ALLURE_SERIE: Allure = { propulseur: 1, coque: 1, foreuse: 1, radar: false, armes: [], bouclier: 0 }
  const allureMontee = (bouclier: number): Allure => ({ propulseur: monteeA(hangar, 'propulseur').cran, coque: monteeA(hangar, 'coque').cran, foreuse: foreuseMontee(hangar)?.cran ?? 0, radar: radarMonte(hangar) > 0, armes: armesMontees(hangar).map((pc) => pc.arme!.id), bouclier })
  /** L'écran est là quand rien ne vole : avant le premier décollage, et après une fin, le temps que l'effet passe. */
  const ecranVisible = (): boolean => !enJeu || (m.phase !== 'vol' && t - perduA > (m.phase === 'extrait' ? 1.7 : 1))
  let ecranEtait = false
  /** L'onglet ouvert, et la pièce choisie dans chacun (le hangar s'ouvre sur les pièces montées). */
  const ONGLETS: Sorte[] = ['propulseur', 'coque', 'outil', 'arme']
  /** Le nom d'un onglet ; les listes disent LEURS PLACES, occupées / portées par la coque (Keko : « ce n'est pas lisible »). */
  const NOMS_ONGLET: Record<Sorte, string> = { propulseur: 'PROPULSEUR', coque: 'COQUE', outil: 'OUTILS', arme: 'ARMES' }
  /** Les sous-catégories d'une catégorie : les familles de ses pièces (outils : foreuses, radars) ; `null` = toutes. */
  const NOMS_FAMILLE: Record<string, string> = { foreuse: 'FOREUSES', radar: 'RADARS' }
  const famillesDe = (o: Sorte): string[] => [...new Set(piecesDe(o).map((pc) => pc.famille).filter((f): f is string => f !== undefined))]
  const sousCategorie: Record<Sorte, string | null> = { propulseur: null, coque: null, outil: null, arme: null }
  /** La liste visible d'une catégorie : ses pièces, ou celles de la sous-catégorie choisie. */
  const listeVisible = (o: Sorte): Piece[] => piecesDe(o).filter((pc) => sousCategorie[o] === null || pc.famille === sousCategorie[o])
  /** LE DÉFILEMENT de la liste (Keko : « énormément de pièces, un moyen de se déplacer dans une longue liste ») : en rangées, par catégorie ; on la fait glisser au doigt, quatre rangées visibles. */
  const RANGEES = 4
  const defil: Record<Sorte, number> = { propulseur: 0, coque: 0, outil: 0, arme: 0 }
  /** Un glisser en cours sur la liste : d'où il part, le défilement d'alors, s'il a bougé (sinon c'est une tape). */
  let glisse: { x: number; y: number; defil0: number; bouge: boolean } | null = null
  /** La zone qui se fait glisser, refaite à chaque image comme les autres. */
  let zoneGlissante: { x: number; y: number; w: number; h: number } | null = null
  let onglet: Sorte = 'propulseur'
  /** LA VUE : le hangar (les pièces) ou L'ENTREPÔT (l'inventaire des ressources — Keko : « on en aura beaucoup à l'avenir »). */
  let vue: 'hangar' | 'entrepot' = 'hangar'
  /** LE BOUTON DE TEST en haut à droite (Keko : « reset toute progression ») : une première tape le fait demander « SUR ? » deux secondes, la seconde efface le hangar et le trésor de l'appareil. */
  let resetDemandeA = -10
  /**
   * LE SYMBOLE DES CRÉDITS (Keko : « un C avec une barre verticale au milieu ; les deux bouts du C à droite dépassent
   * la barre, le côté gauche bien arrondi ») : un C de rayon 3,2 ouvert de ±52° à droite, un fût au centre qui dépasse
   * en haut et en bas, vert, le fût plus clair, une ombre dessous. UNE SEULE TAILLE, partout (Keko).
   */
  function dessinerUnCredit(p: Peintre, x0: number, y0: number): void {
    // sur des pixels entiers : posé entre deux pixels, le même glyphe ne sortait pas pareil d'un endroit à l'autre (Keko l'a vu sur le bouton Vendre)
    const x = Math.round(x0)
    const y = Math.round(y0)
    const r = 3.2
    const ouverture = 0.9
    p.arc(x, y + 1, r, 1, ouverture, Math.PI * 2 - ouverture, RUNE[0])
    p.line(x, y - 2, x, y + 4, RUNE[0])
    p.arc(x, y, r, 1, ouverture, Math.PI * 2 - ouverture, RUNE[1])
    p.line(x, y - 3, x, y + 3, RUNE[2]) // (le fût s'arrête à la hauteur du C, ni plus haut ni plus bas — Keko)
    p.rect(x, y - 3, 1, 1, RUNE[3])
    p.glow(x, y, 5, RUNE[2], 0.3)
  }
  /** Un nombre en grande police suivi du symbole des crédits, calé à droite sur x (ou centré). */
  function nombreDeCredits(p: Peintre, n: number, x: number, y: number, c: number, centre = false): void {
    const w = p.measure(String(n), { font: 'big' })[0]
    const x0 = centre ? x - (w + 12) / 2 : x - w - 12
    p.text(String(n), x0, y, c, { font: 'big' })
    dessinerUnCredit(p, x0 + w + 7, y + 3)
  }
  /** Le minerai choisi à l'entrepôt. */
  let mineraiChoisi: Minerai = 'fer'
  /**
   * L'ICÔNE D'UN MINERAI, à sa seule taille — UNE FORME PAR MINERAI (Keko : « une icône différente pour la forme / texture
   * des différents minerais ») : le FER, un caillou anguleux et mat, grené ; l'OR, une pépite en losange qui brille ;
   * le CRISTAL, une pointe effilée à facettes, translucide.
   */
  function dessinerUneRessource(p: Peintre, x0: number, y0: number, minerai: Minerai): void {
    const k = 2 // UNE SEULE TAILLE, partout (Keko : « ne change jamais la taille des icônes »)
    // sur des pixels entiers : à cheval entre deux, le même tracé sortait différent d'un endroit à l'autre (Keko l'a vu entre l'entrepôt et la fiche)
    const x = Math.round(x0)
    const y = Math.round(y0)
    const T = TEINTES_MINERAI[minerai]
    if (minerai === 'fer') {
      p.poly([[x - 2 * k, y - k], [x - 0.5 * k, y - 2 * k], [x + 1.5 * k, y - 1.5 * k], [x + 2 * k, y + 0.5 * k], [x + 0.5 * k, y + 2 * k], [x - 1.5 * k, y + 1.5 * k]], T[1])
      p.poly([[x - 1.5 * k, y - k], [x - 0.5 * k, y - 1.5 * k], [x + k, y - k], [x + 0.5 * k, y + 0.5 * k], [x - k, y + 0.5 * k]], T[2])
      p.rect(x - k, y - k, 1, 1, T[3])
      p.rect(x + 0.5 * k, y + k, 1, 1, T[0])
      p.rect(x - 1.5 * k, y + k, 1, 1, T[0])
    } else if (minerai === 'or') {
      p.poly([[x, y - 2 * k], [x + 2 * k, y], [x, y + 2 * k], [x - 2 * k, y]], T[2])
      p.poly([[x, y - 2 * k + 1], [x + k - 0.5, y - k + 0.5], [x - k + 0.5, y - k + 0.5]], T[3])
      p.rect(x - k, y - 1, 1, 1, T[4])
      p.rect(x + 1, y + k - 1, k, 1, T[1])
      p.glow(x, y, 4 * k, T[2], 0.3)
    } else {
      p.poly([[x, y - 2.5 * k], [x + 1.2 * k, y - 0.5 * k], [x + 0.8 * k, y + 2 * k], [x - 0.8 * k, y + 2 * k], [x - 1.2 * k, y - 0.5 * k]], T[1])
      p.poly([[x, y - 2.5 * k], [x + 1.2 * k, y - 0.5 * k], [x + 0.3 * k, y + 2 * k], [x, y - 0.5 * k]], T[2])
      p.poly([[x, y - 2.5 * k], [x, y - 0.5 * k], [x - 0.4 * k, y + 2 * k], [x - 1.2 * k, y - 0.5 * k]], T[3])
      p.rect(x - 0.5 * k, y - 1.5 * k, 1, Math.max(1, k), T[4])
      p.glow(x, y, 4 * k, T[2], 0.35 * (0.7 + 0.3 * Math.sin(t * 3)))
    }
  }
  const choix: Record<Sorte, string> = { propulseur: 'propulseur-1', coque: 'coque-1', outil: 'foreuse-1', arme: 'arme-canon' }
  function ouvrirLeHangar(): void {
    for (const e of EMPLACEMENTS) choix[e] = hangar.montees[e]
    choix.outil = hangar.outils[0] ?? 'foreuse-1'
    choix.arme = hangar.armes[0] ?? 'arme-canon'
  }
  /** Les encres des plaques (l'écriture de `panel` des effets ui/ du dépôt), l'or des plaques vives. */
  const ENCRE = { outline: N.hex('#0d0a14'), rim: N.hex('#5a4f74'), top: N.hex('#2a2338'), body: N.hex('#211b2d'), low: N.hex('#15111c') }
  const ENCRE_OR = { outline: N.hex('#0d0a14'), rim: PEPITE[2], top: N.hex('#5a4208'), body: N.hex('#3a2a06'), low: N.hex('#1e1604') }
  const NUIT = N.hex('#0b0d14')
  /** Un mot en relief, en grande police (la lettre des effets ui/ du dépôt, `drawWord` : un biseau lit, un dessous ombré), centré sur x. */
  function motEnRelief(p: Peintre, s: string, x: number, y: number, k: number, or: boolean): void {
    const mot = spell(texteNu(s), 'big') as { letters: { g: unknown; x: number }[]; w: number }
    const items = mot.letters.filter((L) => L.g).map((L) => ({ g: L.g, x: x - (mot.w * k) / 2 + L.x * k, y, sx: k, sy: k }))
    drawWord(p, items, or ? { fill: [PEPITE[1], PEPITE[2], PEPITE[3]], edge: PEPITE[4], under: N.hex('#6a4a08'), outline: ENCRE.outline, shadow: 0 } : { fill: [COQUE[3], COQUE[4], COQUE[5]], edge: COQUE[6], under: COQUE[2], outline: ENCRE.outline, shadow: 0 })
  }
  /** Un bouton : une plaque et son mot ; `vif` l'allume (or) et le rend touchable, éteint il est gris et ne fait rien. */
  function bouton(p: Peintre, x: number, y: number, w: number, h: number, mot: string, vif: boolean, action: () => void, grand = false): void {
    panel(p, x, y, w, h, vif ? ENCRE_OR : ENCRE, { r: 2 })
    if (grand) motEnRelief(p, mot, x + w / 2, y + Math.floor((h - 7) / 2), 1, vif)
    else p.text(texteNu(mot), x + w / 2, y + Math.floor((h - 5) / 2), vif ? N.WHITE : COQUE[3], { align: 'center' })
    if (vif) zones.push({ x, y, w, h, action })
  }
  /**
   * LE GRAPHISME D'UNE PIÈCE, dans la case du panneau (Keko) : le propulseur, sa tuyère et sa flamme ; la coque, le fuselage
   * de sa peau ; une foreuse, son dôme et son canon ; le radar, son mât et son antenne ; une arme, ce qu'on voit sous
   * l'aile — les mêmes traits que sur le vaisseau, centrés sur (x, y), ET MIS À L'ÉCHELLE DE LA CASE (Keko : « chaque
   * visuel doit être rescalé pour loger dans la zone, pas taille réelle ») : d'après l'encombrement de chaque pièce,
   * largeur et hauteur une fois le nez en haut, pour remplir `bw` × `bh` à trois pixels du bord.
   */
  function dessinerLePictogramme(p: Peintre, pc: Piece, x: number, y: number, bw: number, bh: number): void {
    const [ew, eh] = pc.sorte === 'propulseur' ? [9, 9.5 + 1.5 * pc.cran] : pc.sorte === 'coque' ? (pc.cran === 3 ? [18, 18] : [14, 14]) : pc.sorte === 'outil' && pc.famille === 'foreuse' ? [7, 10 + pc.cran] : pc.sorte === 'outil' ? [9, 9] : [9, 10]
    const k = Math.max(1, Math.floor(Math.min((bw - 6) / ew, (bh - 6) / eh) * 2) / 2)
    const q = agrandi(p, k)
    // le propulseur s'étire vers l'arrière (sa flamme) : on recule l'origine pour centrer l'ensemble dans la case (la flamme ionique débordait en bas — Keko)
    const L = pc.sorte === 'propulseur' ? 4 + 1.5 * pc.cran : 0
    q.place(x, y - ((L - 2) / 2) * k, false, -Math.PI / 2)
    if (pc.sorte === 'propulseur') {
      const cp = pc.cran
      const tuyere = 1.8 + 0.5 * (cp - 1)
      const feu = cp >= 3 ? ION : FEU
      const Lf = L * (0.9 + 0.1 * Math.sin(t * 40))
      q.poly([[-1, -tuyere], [-1 - Lf, 0], [-1, tuyere]], feu[4])
      q.poly([[-1, -tuyere * 0.55], [-1 - Lf * 0.6, 0], [-1, tuyere * 0.55]], feu[6])
      q.glow(-2 - Lf * 0.4, 0, 4, feu[5], 0.5)
      q.poly([[-1, -tuyere], [-2.5, -tuyere * 0.72], [-2.5, tuyere * 0.72], [-1, tuyere]], COQUE[1])
      q.poly([[-1, -tuyere - 0.5], [3, -tuyere - 1], [3, tuyere + 1], [-1, tuyere + 0.5]], COQUE[3])
      q.line(-1, -tuyere - 0.5, 3, -tuyere - 1, COQUE[5])
    } else if (pc.sorte === 'coque') {
      const peau = pc.cran === 2 ? BLINDEE : COQUE
      const forme = [[7, 0], [2, -2.5], [-4, -3.3], [-5.5, -1.6], [-5.5, 1.6], [-4, 3.3], [2, 2.5]]
      for (const s of [-1, 1]) q.poly([[0, s * 2], [-4.5, s * 6.5], [-6, s * 6.5], [-4.5, s * 2]], peau[3])
      q.poly(forme, peau[4])
      q.poly(forme.map(([fx, fy]) => [fx * 0.75 + 0.5, fy * 0.6]), peau[5])
      if (pc.cran === 2) for (const [rx, ry] of [[3, -1.2], [3, 1.2], [-1.5, -2], [-1.5, 2], [-4, -1.2], [-4, 1.2]]) q.dot(rx, ry, peau[1])
      if (pc.cran === 3) q.ring(0, 0, 8, 1, VERRIERE[2], 0.6) // (l'anneau compte dans l'encombrement : il débordait de la case)
    } else if (pc.sorte === 'outil' && pc.famille === 'foreuse') {
      const cf = pc.cran
      const dome = 2.1 + 0.4 * (cf - 1)
      const canon = 4.5 + (cf - 1)
      q.circle(-1, 0, dome, COQUE[1])
      q.circle(-1.3, -0.4, dome * 0.62, COQUE[3])
      q.dot(-1.7, -0.8, COQUE[5])
      if (cf >= 3) q.ring(-1, 0, dome, 1, LASER[2], 0.7)
      q.line(-1, 0, -1 + canon, 0, COQUE[2])
      if (cf >= 2) q.line(0.5, 0, -1 + canon - 1, 0, COQUE[4])
      q.dot(-1 + canon, 0, LASER[3])
      q.glow(-1 + canon, 0, 4, LASER[3], 0.5)
    } else if (pc.sorte === 'outil') {
      const ar = t * 4
      q.circle(0, 0, 1.6, COQUE[1])
      q.line(-Math.cos(ar) * 4, -Math.sin(ar) * 4, Math.cos(ar) * 4, Math.sin(ar) * 4, COQUE[4])
      q.dot(0, 0, Math.sin(t * 6) > 0 ? RUNE[2] : RUNE[1])
      q.glow(0, 0, 6, RUNE[2], 0.3)
    } else {
      const arme = pc.arme!.id // (pas d'aile dessous : certains vaisseaux n'en auront pas — Keko)
      if (arme === 'canon') {
        q.line(-3, 0, 5, 0, COQUE[2])
        q.dot(5, 0, COQUE[5])
      } else if (arme === 'rafale') {
        q.line(-3, -1.2, 4, -1.2, COQUE[2])
        q.line(-3, 1.2, 4, 1.2, COQUE[2])
      } else {
        q.poly([[-4, -1.6], [3, -1.6], [3, 1.6], [-4, 1.6]], COQUE[1])
        q.line(-3, 0, 2, 0, COQUE[4])
        q.dot(4, 0, N.hex('#ff5a5a'))
      }
    }
    q.place(0, 0)
  }
  /** Un texte replié à `largeur` en petite police, ligne par ligne. */
  function replier(p: Peintre, s: string, largeur: number): string[] {
    const lignes: string[] = []
    let l = ''
    for (const mot of texteNu(s).split(' ')) {
      const essai = l === '' ? mot : `${l} ${mot}`
      if (l === '' || p.measure(essai)[0] <= largeur) l = essai
      else {
        lignes.push(l)
        l = mot
      }
    }
    if (l !== '') lignes.push(l)
    return lignes
  }
  /** Le même peintre, les coordonnées locales multipliées par k (l'ancre de `place` ne l'est pas) : le vaisseau en grand. */
  function agrandi(p: Peintre, k: number): Peintre {
    return {
      ...p,
      place: (x, y, flip, angle) => p.place(x, y, flip, angle),
      px: (x, y, c) => p.rect(x * k, y * k, k, k, c),
      dot: (x, y, c, a) => p.rect(Math.round(x * k - k / 2), Math.round(y * k - k / 2), k, k, c, a),
      circle: (x, y, r, c, a) => p.circle(x * k, y * k, r * k, c, a),
      ring: (x, y, r, w, c, a) => p.ring(x * k, y * k, r * k, w * k, c, a),
      poly: (pts, c, a) => p.poly(pts.map(([x, y]) => [x * k, y * k]), c, a),
      line: (x0, y0, x1, y1, c, a) => p.line(x0 * k, y0 * k, x1 * k, y1 * k, c, a),
      glow: (x, y, r, c, kk) => p.glow(x * k, y * k, r * k, c, kk),
    }
  }
  /** La scène (le sol du hangar jusqu'au bas de l'aire) a UNE HAUTEUR FIXE, celle qu'elle avait au hangar avec trois jauges (Keko : « il ne faut pas que la hauteur de la zone supérieure change en fonction des éléments en dessous »). */
  const hauteurDeScene = (): number => Math.max(96, Math.min(Math.floor((H - 10 - 290) / 2) + 120, H - 243))
  /** La largeur de la bande des onglets, à gauche de la scène, où rien d'autre ne se dessine. */
  const BANDE = 52
  let hautScene = 178
  /**
   * LE HANGAR, VU DE DESSUS (Keko : « je ne veux pas voir l'extracteur ni le niveau derrière, ni les consignes en
   * haut ; voir le vaisseau dans un hangar, posé ») : un sol de plaques rivetées, une aire d'atterrissage cerclée de
   * chevrons jaune et noir et de feux qui courent, deux lampes chaudes aux coins, des caisses, et le vaisseau posé au
   * milieu, moteur éteint, avec ses pièces — tout ce qu'on monte se voit. Une enseigne HANGAR ; le bilan de la
   * dernière expédition en bandeau, s'il y en a un (plus aucune consigne sinon).
   */
  function dessinerLeHangar(p: Peintre): void {
    zones = [] // (la scène se dessine la première : le bouton RESET pose la première zone de l'image)
    p.place(0, 0)
    hautScene = hauteurDeScene()
    // LA BANDE DES ONGLETS, à gauche, est CONDAMNÉE (Keko : « plus tard il y aura d'autres onglets, on ne veut pas le
    // vaisseau ou l'inventaire dans cette zone ») : rien de la scène ne s'y dessine, la scène vit à sa droite
    const cx = BANDE + Math.floor((W - BANDE) / 2)
    const cy = hautScene - 58
    p.rect(0, 0, W, H, NUIT)
    if (vue === 'hangar') {
      // le sol du hangar : des plaques, leurs joints sombres, un rivet par plaque
      p.rect(BANDE, 0, W - BANDE, hautScene, COQUE[0])
      for (let x = BANDE + 6; x < W; x += 24) p.line(x, 0, x, hautScene - 1, NUIT)
      for (let y = 4; y < hautScene; y += 24) p.line(BANDE, y, W - 1, y, NUIT)
      for (let x = BANDE + 6; x < W; x += 24) for (let y = 4; y < hautScene; y += 24) p.dot(x + 2, y + 2, COQUE[1])
    } else {
      // LE FOND DE L'ENTREPÔT (Keko : « un autre fond pour l'inventaire, pas le fond du hangar », puis « on dirait un
      // autre grid derrière, très peu lisible ») : un mur uni d'acier verdâtre, quelques mouchetures, rien qui fasse
      // des lignes sous la grille
      const MUR = N.hex('#121c18')
      p.rect(BANDE, 0, W - BANDE, hautScene, MUR)
      for (let i = 0; i < 70; i++) {
        const mx = BANDE + Math.floor(tire(i, 1, 77) * (W - BANDE))
        const my = Math.floor(tire(i, 2, 77) * hautScene)
        p.dot(mx, my, tire(i, 3, 77) < 0.5 ? N.hex('#0c1310') : N.hex('#1a2822'))
      }
    }
    // la bande des onglets : une plaque sombre, un trait qui la sépare de la scène
    p.rect(0, 0, BANDE, hautScene, NUIT)
    p.line(BANDE - 1, 0, BANDE - 1, hautScene - 1, COQUE[1])
    // les lampes : un boîtier, un halo chaud, hors de la bande
    for (const lx of [BANDE + 8, W - 9]) {
      p.glow(lx, 6, 50, N.hex('#ffd8a0'), 0.3)
      p.rect(lx - 3, 0, 6, 3, COQUE[2])
      p.rect(lx - 2, 3, 4, 1, PEPITE[3])
    }
    if (vue === 'hangar') {
      // l'aire : un disque sombre, l'anneau de chevrons, un cercle et une croix de guidage, huit feux qui courent
      const R0 = 30
      p.circle(cx, cy, R0 + 3, NUIT)
      p.circle(cx, cy, R0, COQUE[1])
      p.ring(cx, cy, R0 - 1, 3, (_v: number, ang: number) => (Math.floor((ang / Math.PI) * 8 + 16) % 2 === 0 ? PEPITE[1] : NUIT))
      p.ring(cx, cy, R0 - 9, 1, COQUE[2])
      p.line(cx - R0 + 11, cy, cx + R0 - 11, cy, COQUE[2])
      p.line(cx, cy - R0 + 11, cx, cy + R0 - 11, COQUE[2])
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2
        const allume = (Math.floor(t * 4) + i) % 8 < 3
        const fx = cx + Math.cos(a) * (R0 + 6)
        const fy = cy + Math.sin(a) * (R0 + 6)
        p.dot(fx, fy, allume ? PEPITE[3] : PEPITE[0])
        if (allume) p.glow(fx, fy, 5, PEPITE[2], 0.5)
      }
      // l'ombre du vaisseau sur l'aire, puis le vaisseau posé, agrandi deux fois, moteur éteint
      const K = 2
      p.circle(cx + 1, cy + 2, 7 * K, NUIT, 0.55)
      const al = allureMontee(monteeA(hangar, 'coque').bouclier ? 1 : 0)
      dessinerVaisseauA(agrandi(p, K), cx, cy, -Math.PI / 2, 0, al.coque >= 2 ? BLINDEE : COQUE, VERRIERE, 0, false, al)
    } else {
      // L'INVENTAIRE à la place du vaisseau (Keko) : une grille de cases, quatre par rangée, trois rangées — les minerais
      // dans les premières, les autres VIDES, pour la suite ; la case choisie est cerclée d'or
      // la grille remplit toute la zone à droite de la bande (Keko) : quatre colonnes, autant de rangées qu'il en tient
      const COL = 4
      const cw = 28
      const ch = 26
      const RANG = Math.max(1, Math.floor((hautScene - 8) / (ch + 3)))
      const gx = BANDE + Math.floor((W - BANDE - (COL * cw + (COL - 1) * 3)) / 2)
      const gy = Math.floor((hautScene - (RANG * (ch + 3) - 3)) / 2)
      for (let i = 0; i < COL * RANG; i++) {
        const x = gx + (i % COL) * (cw + 3)
        const y = gy + Math.floor(i / COL) * (ch + 3)
        const k = MINERAIS[i]
        if (k === undefined) {
          panel(p, x, y, cw, ch, { ...ENCRE, rim: ENCRE.top, top: ENCRE.body, body: ENCRE.low }, { r: 2 })
          continue
        }
        const choisi = k === mineraiChoisi
        panel(p, x, y, cw, ch, choisi ? ENCRE_OR : ENCRE, { r: 2 })
        dessinerUneRessource(p, x + cw / 2, y + 10, k)
        p.text(String(tresor[k]), x + cw / 2, y + ch - 7, tresor[k] > 0 ? N.WHITE : COQUE[3], { align: 'center' })
        zones.push({ x, y, w: cw, h: ch, action: () => (mineraiChoisi = k) })
      }
    }
    // LES ONGLETS EN COLONNE, à gauche de la scène (Keko : « en colonne sur la gauche de l'écran, qui est inutilisé ») :
    // HANGAR, ENTREPOT, l'actif en or ; la scène montre l'un ou l'autre
    const vues = ['hangar', 'entrepot'] as const
    vues.forEach((vv, i) => {
      const w = 44
      const y = 4 + i * 14
      const actif = vue === vv
      panel(p, 3, y, w, 12, actif ? ENCRE_OR : ENCRE, { r: 2 })
      p.text(vv === 'hangar' ? 'HANGAR' : 'ENTREPOT', 3 + w / 2, y + 4, actif ? N.WHITE : COQUE[4], { align: 'center' })
      if (!actif) zones.push({ x: 3, y, w, h: 12, action: () => (vue = vv) })
    })
    // le bouton de test, tout en bas à gauche de l'écran (Keko) : RESET, puis SUR ? ; la seconde tape remet toute la progression à zéro
    const demande = t - resetDemandeA < 2
    bouton(p, 3, H - 14, 30, 11, demande ? 'Sur ?' : 'Reset', true, () => {
      if (!demande) {
        resetDemandeA = t
        return
      }
      resetDemandeA = -10
      hangar = hangarNeuf()
      tresor = cargaisonVide()
      credits = 0
      sauver()
      ouvrirLeHangar()
    })
  }
  /**
   * Une jauge du panneau : son nom à gauche, puis — une quantité entière (points, armes) : DES CELLULES, une par unité,
   * pleines jusqu'à la valeur (Keko : « des jauges à cellules pour les éléments discrets ») ; sinon une barre creuse
   * pleine au plus du catalogue — et un repère blanc à la valeur de la pièce montée.
   */
  function dessinerUneJaugeDePiece(p: Peintre, y: number, j: Jauge, repere: number | null, rouge: boolean, x0 = 10): void {
    p.text(texteNu(j.nom), x0, y + 1, COQUE[4])
    const bx = x0 + 50
    const bw = W - 12 - bx
    const teinte = j.nom === 'Bouclier' ? VERRIERE[2] : rouge ? ROUGE[3] : PEPITE[2]
    const clair = j.nom === 'Bouclier' ? VERRIERE[3] : rouge ? ROUGE[5] : PEPITE[3]
    if (j.nombre) {
      // un simple nombre (les places d'outils, d'armes — Keko : « numérique et pas en jauge », sans rappel de la pièce en place)
      p.text(String(j.valeur), bx, y - 1, PEPITE[3], { font: 'big' })
      return
    }
    if (j.cellules) {
      const n = Math.max(1, Math.round(j.max))
      const lc = Math.floor((bw - (n - 1)) / n)
      for (let i = 0; i < n; i++) {
        const cx = bx + i * (lc + 1)
        p.rect(cx, y, lc, 5, ENCRE.outline)
        p.rect(cx + 1, y + 1, lc - 2, 3, COQUE[1])
        if (i < Math.round(j.valeur)) {
          p.rect(cx + 1, y + 1, lc - 2, 3, teinte)
          p.rect(cx + 1, y + 1, lc - 2, 1, clair)
        }
      }
      if (repere !== null) {
        const k = Math.round(repere * n)
        p.rect(bx + k * (lc + 1) - 1, y - 1, 1, 7, N.WHITE)
      }
      return
    }
    const part = j.valeur / j.max
    p.rect(bx, y, bw, 5, ENCRE.outline)
    p.rect(bx + 1, y + 1, bw - 2, 3, COQUE[1])
    const plein = Math.round((bw - 2) * Math.min(1, part))
    if (plein > 0) {
      p.rect(bx + 1, y + 1, plein, 3, teinte)
      p.rect(bx + 1, y + 1, plein, 1, clair)
    }
    if (repere !== null) p.rect(bx + 1 + Math.round((bw - 2) * Math.min(1, repere)) - 1, y - 1, 1, 7, N.WHITE)
  }
  /**
   * LE BAS DE L'ENTREPÔT (Keko : « la partie inférieure devient la zone avec une petite description du minerai
   * sélectionné et son prix en crédits ») : la fiche du minerai choisi dans la grille — son nom, deux lignes, sa valeur
   * en crédits la pépite, ce qu'on en a en stock —, VENDRE TOUT, et les crédits qu'on a. Rend le y sous le panneau.
   */
  function dessinerLEntrepot(p: Peintre, y: number): number {
    const k = mineraiChoisi
    const fiche = FICHES_MINERAI[k]
    // la description tient TROIS LIGNES, toujours (Keko : « fixe la hauteur à trois lignes pour éviter le changement de
    // taille quand on change de minerai »), et un peu d'air avant la valeur et le stock
    const LIGNES = 3
    const L = replier(p, fiche.dit, W - 20).slice(0, LIGNES)
    const hp = 19 + LIGNES * 7 + 10 + 24 + 18
    panel(p, 4, y, W - 8, hp, ENCRE, { r: 2 })
    // l'icône juste à gauche du nom, le nom décalé d'autant ; la description centrée dans ses trois lignes (Keko)
    const ln = p.measure(texteNu(fiche.nom), { font: 'big' })[0]
    dessinerUneRessource(p, W / 2 - ln / 2 - 4, y + 10, k) // (l'icône à deux pixels du nom, à cinq du bord haut ; le nom centré sur sa hauteur)
    p.text(texteNu(fiche.nom), W / 2 + 5, y + 7, PEPITE[3], { font: 'big', align: 'center' })
    const haut = y + 19 + Math.floor(((LIGNES - L.length) * 7) / 2)
    L.forEach((li, i) => p.text(li, W / 2, haut + i * 7, COQUE[5], { align: 'center' }))
    const ly = y + 19 + LIGNES * 7 + 10 // (dix pixels d'air sous la description : à trois lignes, le texte touchait la zone sombre)
    // la valeur en crédits de la pépite, ce qu'on en a, et les crédits qu'on a
    p.text('VALEUR UNITAIRE', 10, ly + 1, COQUE[4])
    nombreDeCredits(p, fiche.credits, W - 9, ly, PEPITE[3])
    p.text('EN STOCK', 10, ly + 12, COQUE[4])
    // le compte, puis l'icône du minerai à sa droite, comme le symbole des crédits au-dessus (Keko)
    p.text(String(tresor[k]), W - 21, ly + 11, tresor[k] > 0 ? N.WHITE : COQUE[3], { font: 'big', align: 'right' })
    dessinerUneRessource(p, W - 13, ly + 14, k)
    const by = ly + 24
    // VENDRE TOUT : le stock du minerai contre ses crédits (de moi : une valeur sans vente n'aurait pas de sens ; à rejuger)
    const gain = tresor[k] * fiche.credits
    bouton(p, W / 2 - 52, by, 104, 13, tresor[k] > 0 ? `Vendre : ${gain}` : 'Rien a vendre', tresor[k] > 0, () => {
      const r = vendre(tresor, credits, k)
      tresor = r.tresor
      credits = r.credits
      sauver()
    }, true)
    if (tresor[k] > 0) dessinerUnCredit(p, W / 2 + p.measure(`VENDRE : ${gain}`, { font: 'big' })[0] / 2 + 8, by + 6)
    y += hp + 4
    // les crédits qu'on a, sous le panneau
    p.text('CREDITS', W / 2 - 6, y + 2, COQUE[4], { align: 'right' })
    nombreDeCredits(p, credits, W / 2 + 30, y, PEPITE[3]) // (la même couleur que la valeur unitaire — Keko)
    return y + 12
  }
  /**
   * L'INTERFACE DU HANGAR, sous la scène, EN GRANDE POLICE (Keko : « les textes et l'interface sont un peu petits ») :
   * le trésor ; quatre onglets (propulseur, coque, foreuse, armes) ; LA LISTE DE TOUTES LES PIÈCES de l'onglet, une
   * ligne chacune — le nom, et à droite MONTEE, POSSEDEE ou le prix (doré si le trésor y suffit) —, la choisie
   * surlignée d'un chevron ; puis LE PANNEAU DE DESCRIPTION : le nom, SES JAUGES (`jaugesDe` : accélération, vitesse,
   * maniabilité ; blindage, bouclier, armes, poids ; forage, portée, aimant ; dégâts par seconde, par coup, portée —
   * la barre pleine au plus du catalogue, le poids en rouge, et un repère blanc à la valeur de la pièce montée, pour
   * comparer), et le bouton qui va avec : ACHETER (une tape paie ET monte), MONTER, DEMONTER (une arme), COQUE PLEINE
   * éteint, ou MONTEE sans bouton. « Décoller » en bas, la date du build tout en bas. Tout se sauve à chaque geste.
   */
  function dessinerLEcran(p: Peintre): void {
    p.place(0, 0)
    let y = hautScene + 4
    if (vue === 'entrepot') y = dessinerLEntrepot(p, y)
    else {
    // LE SÉLECTEUR DE CATÉGORIE À FLÈCHES (Keko : « on aura plus de parties de vaisseau, sur une ligne ça ne logera
    // pas ») : ‹ OUTILS › — autant de catégories qu'on veut ; une tape sur une flèche passe à la suivante
    const io = ONGLETS.indexOf(onglet)
    // les flèches aux deux bouts, à la hauteur de la barre, la barre entre elles (Keko : la barre dépassait des boutons)
    panel(p, 19, y, W - 38, 13, ENCRE, { r: 2 })
    // le titre ; pour les outils et les armes, LES PLACES EN CELLULES à sa droite — une case par place portée par la
    // coque, pleine si elle est occupée (Keko : « plutôt que x/x, des cellules qui se remplissent »)
    p.text(NOMS_ONGLET[onglet], W / 2, y + 3, PEPITE[3], { font: 'big', align: 'center' })
    if (onglet === 'outil' || onglet === 'arme') {
      const occupees = (onglet === 'outil' ? hangar.outils : hangar.armes).length
      const places = capacite(hangar, onglet)
      let cx = W / 2 + p.measure(NOMS_ONGLET[onglet], { font: 'big' })[0] / 2 + 6
      for (let i = 0; i < places; i++) {
        p.rect(cx, y + 3, 6, 7, ENCRE.outline)
        p.rect(cx + 1, y + 4, 4, 5, i < occupees ? PEPITE[2] : COQUE[1])
        if (i < occupees) p.rect(cx + 1, y + 4, 4, 1, PEPITE[3])
        cx += 8
      }
    }
    bouton(p, 4, y, 13, 13, '<', true, () => (onglet = ONGLETS[(io + ONGLETS.length - 1) % ONGLETS.length]))
    bouton(p, W - 17, y, 13, 13, '>', true, () => (onglet = ONGLETS[(io + 1) % ONGLETS.length]))
    y += 15
    // LES PUCES DE SOUS-CATÉGORIE (Keko : « sélectionner des sous-catégories, comme les foreuses / radars dans outils »)
    const familles = famillesDe(onglet)
    if (familles.length > 0) {
      const puces: (string | null)[] = [null, ...familles]
      const noms = puces.map((f) => (f === null ? 'TOUT' : (NOMS_FAMILLE[f] ?? f.toUpperCase())))
      const largeurs = noms.map((n) => p.measure(n)[0] + 8)
      let x = Math.floor((W - largeurs.reduce((a, b) => a + b, 0) - (puces.length - 1) * 2) / 2)
      puces.forEach((f, i) => {
        const actif = sousCategorie[onglet] === f
        panel(p, x, y, largeurs[i], 11, actif ? ENCRE_OR : ENCRE, { r: 2 })
        p.text(noms[i], x + largeurs[i] / 2, y + 3, actif ? N.WHITE : COQUE[4], { align: 'center' })
        if (!actif) {
          zones.push({ x, y, w: largeurs[i], h: 11, action: () => ((sousCategorie[onglet] = f), (defil[onglet] = 0)) })
        }
        x += largeurs[i] + 2
      })
      y += 13
    }
    // LA LISTE, quatre rangées visibles, qui se fait glisser ; en tête, les places occupées / portées (Keko : pas dans
    // les boutons) ; un ascenseur à droite quand elle déborde
    const liste = listeVisible(onglet)
    const hl = RANGEES * 13 + 4
    panel(p, 4, y, W - 8, hl, ENCRE, { r: 2 })
    const maxDefil = Math.max(0, liste.length - RANGEES)
    defil[onglet] = Math.max(0, Math.min(maxDefil, defil[onglet]))
    const depart = Math.round(defil[onglet])
    const yl = y + 2
    zoneGlissante = maxDefil > 0 ? { x: 4, y: yl, w: W - 8, h: RANGEES * 13 } : null
    for (let i = depart; i < Math.min(liste.length, depart + RANGEES); i++) {
      const pc = liste[i]
      const ly = yl + (i - depart) * 13
      const choisie = choix[onglet] === pc.id
      const montee = estMontee(hangar, pc.id)
      const aLui = possede(hangar, pc.id)
      if (choisie) {
        p.rect(6, ly, W - (maxDefil > 0 ? 18 : 12), 13, COQUE[1], 0.9)
        p.text('>', 9, ly + 3, PEPITE[3], { font: 'big' })
      }
      p.text(texteNu(pc.nom), 16, ly + 3, montee ? N.WHITE : aLui ? COQUE[5] : COQUE[3], { font: 'big' })
      // l'état à droite : EQUIPE, POSSEDE, ou le prix en crédits avec son icône, en beige comme à l'entrepôt (Keko)
      const xd = W - (maxDefil > 0 ? 15 : 9)
      if (montee) p.text('EQUIPE', xd, ly + 4, PEPITE[2], { align: 'right' })
      else if (aLui) p.text('POSSEDE', xd, ly + 4, COQUE[4], { align: 'right' })
      else nombreDeCredits(p, pc.prix, xd + 2, ly + 3, PEPITE[3])
      zones.push({ x: 4, y: ly, w: W - 8, h: 13, action: () => (choix[onglet] = pc.id) })
    }
    if (maxDefil > 0) {
      // l'ascenseur : la glissière, et le curseur long comme la part visible
      const hg = RANGEES * 13 - 2
      p.rect(W - 10, yl + 1, 3, hg, ENCRE.outline)
      const hc = Math.max(6, Math.round((hg * RANGEES) / liste.length))
      const yc = yl + 1 + Math.round(((hg - hc) * defil[onglet]) / maxDefil)
      p.rect(W - 10, yc, 3, hc, COQUE[3])
      p.rect(W - 10, yc, 3, 1, COQUE[5])
    }
    y += hl + 3
    // LE BOUTON, ENTRE LA LISTE ET LES STATS (Keko) : ACHETER (une tape paie ET équipe), EQUIPER, RETIRER, PLACES
    // PLEINES éteint, ou EQUIPE sans bouton
    const pc = pieceDe(choix[onglet]) ?? liste[0] ?? piecesDe(onglet)[0]
    // le bouton à la largeur de son mot, plus huit pixels de chaque côté (Keko : trop large pour « Équiper »)
    const largeurDe = (mot: string): number => p.measure(texteNu(mot), { font: 'big' })[0] + 16
    if (estMontee(hangar, pc.id)) {
      if (pc.sorte === 'arme' || pc.sorte === 'outil') {
        const bw = largeurDe('Retirer')
        bouton(p, W / 2 - bw / 2, y, bw, 13, 'Retirer', true, () => {
          hangar = demonter(hangar, pc.id)
          sauver()
        }, true)
      } else motEnRelief(p, 'Equipe', W / 2, y + 3, 1, true)
    } else if (possede(hangar, pc.id)) {
      const place = peutMonter(hangar, pc.id)
      const bw = largeurDe(place ? 'Equiper' : 'Places pleines')
      bouton(p, W / 2 - bw / 2, y, bw, 13, place ? 'Equiper' : 'Places pleines', place, () => {
        hangar = monter(hangar, pc.id)
        sauver()
      }, true)
    } else {
      // ACHETER en relief, puis le prix EN BEIGE (Keko) et l'icône des crédits
      const vif = peutAcheter(hangar, credits, pc.id)
      const wa = p.measure('ACHETER', { font: 'big' })[0]
      const wn = p.measure(String(pc.prix), { font: 'big' })[0]
      const bw = wa + 5 + wn + 12 + 16
      const bx = W / 2 - bw / 2
      bouton(p, bx, y, bw, 13, '', vif, () => {
        const r = acheter(hangar, credits, pc.id)
        if (r === null) return
        hangar = r.hangar
        credits = r.credits
        sauver()
      }, true)
      motEnRelief(p, 'Acheter', bx + 8 + wa / 2, y + 3, 1, vif)
      p.text(String(pc.prix), bx + 8 + wa + 5, y + 3, vif ? PEPITE[3] : COQUE[3], { font: 'big' })
      dessinerUnCredit(p, bx + 8 + wa + 5 + wn + 6, y + 6)
    }
    y += 16
    // LE PANNEAU DES STATS, à la hauteur de son contenu (Keko) : à gauche LE GRAPHISME DE LA PIÈCE dans sa case, à
    // droite le nom, les jauges (plus courtes) et le prix avec le solde
    const jauges = jaugesDe(pc)
    const enPlace = pc.sorte === 'arme' ? null : pc.sorte === 'outil' ? (pc.famille === 'foreuse' ? foreuseMontee(hangar) : null) : monteeA(hangar, pc.sorte)
    const reperes = enPlace !== null && enPlace.id !== pc.id ? jaugesDe(enPlace) : null
    const gx = 54
    // en bas, SOUS LES STATS ET L'IMAGE, sur toute la largeur, en petit : ce que les jauges ne disent pas (Keko)
    const note = pc.note === undefined ? [] : replier(p, pc.note, W - 20)
    const hh = Math.max(50, 16 + jauges.length * 10 + 4)
    const hd = hh + (note.length > 0 ? note.length * 7 + 7 : 0) // (quatre pixels d'air de plus avant la note — Keko)
    panel(p, 4, y, W - 8, hd, ENCRE, { r: 2 })
    panel(p, 8, y + 4, 42, hh - 8, { ...ENCRE, rim: ENCRE.top, top: ENCRE.low, body: ENCRE.low }, { r: 2 })
    dessinerLePictogramme(p, pc, 29, y + hh / 2, 42, hh - 8)
    p.text(texteNu(pc.nom), gx + (W - 12 - gx) / 2, y + 4, PEPITE[3], { font: 'big', align: 'center' })
    jauges.forEach((j, i) => dessinerUneJaugeDePiece(p, y + 16 + i * 10, j, reperes === null ? null : reperes[i].valeur / reperes[i].max, j.nom === 'Poids', gx))
    note.forEach((li, i) => p.text(li, W / 2, y + hh + 3 + i * 7, COQUE[4], { align: 'center' }))
    y += hd + 4
    }
    // DÉCOLLER, TOUT EN BAS (Keko : « plus gros et plus travaillé ») : un double cadre, une plaque d'or qu'un reflet
    // balaie toutes les quatre secondes, le mot en relief, des chevrons, une lueur qui respire
    const bw = 110
    const bh = 20
    const bx = W / 2 - bw / 2
    const byy = H - 33
    const respire = 0.6 + 0.4 * Math.sin(t * 4)
    p.glow(W / 2, byy + bh / 2, 44, PEPITE[2], 0.12 + 0.12 * respire)
    panel(p, bx - 2, byy - 2, bw + 4, bh + 4, ENCRE, { r: 3 })
    const cycle = (t % 4) / 4
    panel(p, bx, byy, bw, bh, ENCRE_OR, { r: 2, shine: cycle < 0.45 ? bx - 12 + ((bw + 36) * cycle) / 0.45 : null })
    motEnRelief(p, 'Decoller', W / 2, byy + 6, 1, true)
    p.text('>>', bx + 8, byy + 8, PEPITE[3])
    p.text('<<', bx + bw - 8, byy + 8, PEPITE[3], { align: 'right' })
    zones.push({ x: bx - 2, y: byy - 2, w: bw + 4, h: bh + 4, action: () => demarrer() })
    // la date du build, tout en bas (le garde-fou du cache : Keko vérifie qu'il voit la bonne version)
    p.text(texteNu(`build ${build}`), W - 3, H - 7, COQUE[2], { align: 'right' })
  }
  /** Un point de l'écran en pixels du tampon. */
  const enTampon = (x: number, y: number): Vecteur => {
    const r = canvas.getBoundingClientRect()
    return { x: (x - r.left) / zoom, y: (y - r.top) / zoom }
  }
  racine.addEventListener('pointerdown', (ev) => {
    if (ecranVisible()) {
      // l'écran en pixels : sur la liste, un glisser commence (la tape se décide au relâchement) ; ailleurs, une tape sur une zone
      const q = enTampon(ev.clientX, ev.clientY)
      const g = zoneGlissante
      if (g !== null && q.x >= g.x && q.x < g.x + g.w && q.y >= g.y && q.y < g.y + g.h) {
        glisse = { x: q.x, y: q.y, defil0: defil[onglet], bouge: false }
        return
      }
      const z = zones.find((z) => q.x >= z.x && q.x < z.x + z.w && q.y >= z.y && q.y < z.y + z.h)
      if (z !== undefined) z.action()
      return
    }
    if (manche !== null) return
    ev.preventDefault()
    racine.setPointerCapture(ev.pointerId)
    const p = { x: ev.clientX, y: ev.clientY }
    manche = { id: ev.pointerId, centre: p, doigt: p }
  })
  racine.addEventListener('pointermove', (ev) => {
    if (glisse !== null) {
      // la liste suit le doigt, une rangée par 13 pixels de tampon
      const q = enTampon(ev.clientX, ev.clientY)
      if (Math.abs(q.y - glisse.y) > 2) glisse.bouge = true
      defil[onglet] = glisse.defil0 - (q.y - glisse.y) / 13
      return
    }
    if (manche === null || ev.pointerId !== manche.id) return
    const doigt = { x: ev.clientX, y: ev.clientY }
    manche = { id: manche.id, centre: suivre ? manche.centre : centreQuiSuit(MANCHE, manche.centre, doigt), doigt }
  })
  const lever = (ev: PointerEvent) => {
    if (glisse !== null) {
      // relâché sans avoir bougé : c'était une tape, sur la rangée touchée
      if (!glisse.bouge) {
        const q = glisse
        const z = zones.find((z) => q.x >= z.x && q.x < z.x + z.w && q.y >= z.y && q.y < z.y + z.h)
        if (z !== undefined) z.action()
      }
      defil[onglet] = Math.round(defil[onglet])
      glisse = null
    }
    if (manche !== null && ev.pointerId === manche.id) manche = null
  }
  racine.addEventListener('pointerup', lever)
  racine.addEventListener('pointercancel', lever)
  window.addEventListener('keydown', (ev) => {
    touches.add(ev.key.toLowerCase())
    demarrer()
  })
  window.addEventListener('keyup', (ev) => touches.delete(ev.key.toLowerCase()))
  window.addEventListener('blur', () => {
    touches.clear()
    manche = null
  })
  function directionVoulue(): Vecteur {
    if (manche !== null) {
      if (!suivre) return directionDuManche(MANCHE, manche.doigt.x - manche.centre.x, manche.doigt.y - manche.centre.y)
      const r = canvas.getBoundingClientRect()
      return directionDuManche(MANCHE, (manche.doigt.x - (r.left + r.width / 2)) * 0.5, (manche.doigt.y - (r.top + r.height / 2)) * 0.5)
    }
    const x = (touches.has('arrowright') || touches.has('d') ? 1 : 0) - (touches.has('arrowleft') || touches.has('q') || touches.has('a') ? 1 : 0)
    const y = (touches.has('arrowdown') || touches.has('s') ? 1 : 0) - (touches.has('arrowup') || touches.has('z') || touches.has('w') ? 1 : 0)
    return { x, y }
  }

  // ---------------------------------------------------------------- dessiner
  /** Le ciel : trois couches d'étoiles en parallaxe et des nébuleuses de lumière, tirées des cases du monde. */
  function dessinerLeCiel(p: Peintre): void {
    const couches = [
      { parallaxe: 0.15, pas: 40, teintes: [COQUE[2], COQUE[3]], proba: 0.7 },
      { parallaxe: 0.35, pas: 34, teintes: [COQUE[3], COQUE[4]], proba: 0.6 },
      { parallaxe: 0.7, pas: 48, teintes: [COQUE[5], COQUE[6]], proba: 0.5 },
    ]
    couches.forEach((couche, n) => {
      const ox = camera.x * couche.parallaxe
      const oy = camera.y * couche.parallaxe
      // (les cases balayées partent du BORD de l'écran, pas de son centre : balayées depuis le centre, le haut restait
      // vide sur une demi-hauteur — Keko : « sur tél, les étoiles n'existent pas en haut de l'écran » ; sur PC le tampon
      // est si bas que ça ne se voyait pas)
      const i0 = Math.floor((ox - W / 2) / couche.pas) - 1
      const j0 = Math.floor((oy - H / 2) / couche.pas) - 1
      for (let j = j0; j <= j0 + Math.ceil(H / couche.pas) + 2; j++)
        for (let i = i0; i <= i0 + Math.ceil(W / couche.pas) + 2; i++) {
          if (tire(i, j, 11 + n) > couche.proba) continue
          const x = (i + tire(i, j, 21 + n)) * couche.pas - ox + W / 2
          const y = (j + tire(i, j, 31 + n)) * couche.pas - oy + H / 2
          const scintille = 0.6 + 0.4 * Math.sin(t * (1.5 + tire(i, j, 41 + n) * 3) + tire(i, j, 51 + n) * 6.28)
          const grosse = n === 2 && tire(i, j, 61) > 0.7
          p.dot(x, y, scintille > 0.85 ? couche.teintes[1] : couche.teintes[0], n === 0 ? 0.55 : 1)
          if (grosse) {
            p.dot(x + 1, y, couche.teintes[0], 0.6)
            p.dot(x - 1, y, couche.teintes[0], 0.6)
            p.dot(x, y + 1, couche.teintes[0], 0.6)
            p.dot(x, y - 1, couche.teintes[0], 0.6)
            p.glow(x, y, 5, couche.teintes[1], 0.25 * scintille)
          }
        }
    })
    // les nébuleuses : une par grande case, une lueur large et faible, loin derrière
    const pas = 220
    const ox = camera.x * 0.1
    const oy = camera.y * 0.1
    for (let j = Math.floor((oy - H / 2) / pas) - 1; j <= Math.floor((oy + H / 2) / pas) + 1; j++)
      for (let i = Math.floor((ox - W / 2) / pas) - 1; i <= Math.floor((ox + W / 2) / pas) + 1; i++) {
        if (tire(i, j, 71) > 0.6) continue
        const x = (i + tire(i, j, 72)) * pas - ox + W / 2
        const y = (j + tire(i, j, 73)) * pas - oy + H / 2
        p.glow(x, y, 50 + 40 * tire(i, j, 74), COULEURS_NEBULEUSE[Math.floor(tire(i, j, 75) * COULEURS_NEBULEUSE.length)], 0.5)
      }
  }

  /**
   * UN vaisseau (le joueur ou un ennemi), dessiné le nez vers +x puis tourné vers son cap : la coque, les ailes, la
   * verrière, le moteur et sa flamme, le foreur sur le toit. IL PREND LA LUMIÈRE DU MONDE (Keko : « on peut le faire
   * pour le vaisseau aussi ? ») : la direction de la lumière est ramenée dans son repère (tournée de −cap), la coque est
   * ombrée par une normale approchée (un fuseau bombé), les ailes par leur inclinaison, et le reflet de la verrière
   * glisse du côté de la lumière. `vise` : l'angle du canon (local) ; `tire` : il creuse.
   */
  function dessinerUnVaisseau(p: Peintre, corps: Vaisseau, flam: number, coque: number[], verre: number[], vise: number, tire: boolean, allure: Allure = ALLURE_SERIE): void {
    dessinerVaisseauA(p, corps.x - camera.x + W / 2, corps.y - camera.y + H / 2, corps.cap, flam, coque, verre, vise, tire, allure)
  }
  /**
   * Le même vaisseau à un point du tampon (l'aperçu du hangar s'en sert). LES PIÈCES SE VOIENT (Keko : choisir son
   * vaisseau pièce par pièce) : le propulseur élargit la tuyère et allonge la flamme à chaque cran, bleue au troisième
   * (ionique) ; la foreuse grossit le dôme et le canon, le canon prend une arête claire au deuxième, un liseré rouge
   * cerne le dôme au troisième (le long faisceau) ; la coque blindée est d'acier sombre et rivetée, la coque à bouclier
   * porte un anneau cyan tant qu'il en reste ; les armes sont sous les ailes, la première à gauche, la seconde à droite
   * — canon : un fût ; mitrailleuse : deux ; missiles : une nacelle à pointe rouge.
   */
  function dessinerVaisseauA(p: Peintre, sx: number, sy: number, cap: number, flam: number, coque: number[], verre: number[], vise: number, tire: boolean, allure: Allure): void {
    p.place(sx, sy, false, cap)
    const lx = Math.cos(cap) * LUMIERE.x + Math.sin(cap) * LUMIERE.y
    const ly = -Math.sin(cap) * LUMIERE.x + Math.cos(cap) * LUMIERE.y
    const tonDe = (lum: number) => (lum > 0.72 ? coque[6] : lum > 0.5 ? coque[5] : lum > 0.28 ? coque[4] : lum > 0.08 ? coque[3] : coque[2])
    const forme = [[9, 0], [3, -3], [-5, -4], [-7, -2], [-7, 2], [-5, 4], [3, 3]]
    const cp = allure.propulseur
    const tuyere = 1.8 + 0.5 * (cp - 1)
    const feu = cp >= 3 ? ION : FEU
    if (flam > 0.02) {
      const L = (3 + 7 * flam) * (1 + 0.25 * (cp - 1)) * (0.85 + 0.15 * Math.sin(t * 60))
      p.poly([[-7, -tuyere], [-7 - L, 0], [-7, tuyere]], feu[4])
      p.poly([[-7, -tuyere * 0.55], [-7 - L * 0.6, 0], [-7, tuyere * 0.55]], feu[6])
      p.glow(-8 - L * 0.4, 0, 6 + 6 * flam + 2 * (cp - 1), feu[5], 0.5 + 0.4 * flam)
    }
    for (const s of [-1, 1]) {
      const lumAile = 0.3 + 0.45 * (s * 0.5 * ly + LUMIERE.z)
      p.poly([[0, s * 2.5], [-6, s * 8], [-8, s * 8], [-6, s * 2.5]], (_x, y) => (s * y < 5 ? tonDe(lumAile) : tonDe(lumAile - 0.22)))
      p.line(-6.5, s * 7, -7.5, s * 7, N.hex('#d8403a'))
    }
    allure.armes.forEach((arme, i) => {
      const s = i === 0 ? -1 : 1
      if (arme === 'canon') {
        p.line(-5, s * 6.2, 1, s * 6.2, coque[2])
        p.dot(1, s * 6.2, coque[4])
      } else if (arme === 'rafale') {
        p.line(-5, s * 5.4, 0, s * 5.4, coque[2])
        p.line(-5, s * 7, 0, s * 7, coque[2])
      } else {
        p.poly([[-6.5, s * 5.2], [-1.5, s * 5.2], [-1.5, s * 7.4], [-6.5, s * 7.4]], coque[1])
        p.line(-6, s * 6.3, -2, s * 6.3, coque[3])
        p.dot(-1, s * 6.3, N.hex('#ff5a5a'))
      }
    })
    // (la coque portait un liseré sombre, un polygone un peu plus large dessous : agrandi au hangar il devenait un gros contour noir, que les ailes n'avaient pas — Keko l'a fait retirer)
    p.poly(forme, (x, y) => tonDe((x / 10) * lx * 0.35 + (y / 3.5) * ly * 0.8 + LUMIERE.z * 0.9))
    p.line(-5, 0, 6, 0, tonDe(LUMIERE.z * 0.9 - 0.1))
    if (allure.coque === 2) for (const [rx, ry] of [[4, -1.6], [4, 1.6], [-2, -2.6], [-2, 2.6], [-5, -1.6], [-5, 1.6]]) p.dot(rx, ry, coque[1])
    p.circle(3, 0, 1.8, verre[1])
    p.dot(3 + lx * 0.9, ly * 0.9, verre[2])
    p.dot(3 + lx * 1.4, ly * 1.4, verre[3])
    // la tuyère : plus large à chaque cran de propulseur, un cœur bleu quand il est ionique
    const fond = -8 - 0.5 * (cp - 1)
    p.poly([[-7, -tuyere], [fond, -tuyere * 0.72], [fond, tuyere * 0.72], [-7, tuyere]], coque[1])
    if (cp >= 3) p.dot(fond + 0.5, 0, ION[5])
    p.dot(-6, -3.6, N.hex('#ff5a5a'))
    p.dot(-6, 3.6, N.hex('#4aff7a'))
    p.glow(3, 0, 5, verre[2], 0.25)
    // le foreur sur le toit : un dôme au milieu de la coque, un canon qui vise — plus gros à chaque cran de foreuse
    const cf = allure.foreuse // (0 : pas de foreuse, pas de foreur sur le toit)
    if (cf > 0) {
      const dome = 2.1 + 0.4 * (cf - 1)
      const canon = 4.5 + (cf - 1)
      p.circle(-1.5, 0, dome, coque[1])
      p.circle(-1.8, -0.4, dome * 0.62, coque[3])
      p.dot(-2.2, -0.8, coque[5])
      if (cf >= 3) p.ring(-1.5, 0, dome, 1, LASER[2], 0.7)
      p.line(-1.5, 0, -1.5 + Math.cos(vise) * canon, Math.sin(vise) * canon, coque[2])
      if (cf >= 2) p.line(-1.5 + Math.cos(vise) * 1.5, Math.sin(vise) * 1.5, -1.5 + Math.cos(vise) * (canon - 1), Math.sin(vise) * (canon - 1), coque[4])
      p.dot(-1.5 + Math.cos(vise) * canon, Math.sin(vise) * canon, tire ? LASER[5] : LASER[2])
    }
    // le radar : un mât à l'arrière du toit et une antenne qui tourne, un point vert qui bat
    if (allure.radar) {
      const ar = t * 4
      p.dot(-4.5, 0, coque[1])
      p.line(-4.5 - Math.cos(ar) * 2, -Math.sin(ar) * 2, -4.5 + Math.cos(ar) * 2, Math.sin(ar) * 2, coque[4])
      p.dot(-4.5, 0, Math.sin(t * 6) > 0 ? RUNE[2] : RUNE[1])
    }
    if (allure.bouclier > 0) p.ring(0, 0, 10, 1, verre[2], 0.25 + 0.35 * allure.bouclier * (0.75 + 0.25 * Math.sin(t * 6)))
    p.place(0, 0)
  }

  function dessinerLeVaisseau(p: Peintre): void {
    const vise = m.forage !== null ? Math.atan2(m.forage.y - v.y, m.forage.x - v.x) - v.cap : 0
    const blanchi = t - toucheA < 0.1 || m.phase === 'extrait' || t - arriveA < REFROIDI_A
    const al = allureMontee(CONF.bouclier.points > 0 ? m.bouclier / CONF.bouclier.points : 0)
    dessinerUnVaisseau(p, v, flamme, blanchi ? BLANC : al.coque >= 2 ? BLINDEE : COQUE, blanchi ? BLANC : VERRIERE, vise, m.forage !== null, al)
    // le bouclier qui prend un coup : son anneau flashe blanc et s'ouvre
    if (t - bouclierA < 0.25) {
      const k = 1 - (t - bouclierA) / 0.25
      p.place(W / 2 - camera.x, H / 2 - camera.y)
      p.ring(v.x, v.y, CONF.rayon + 6 + (1 - k) * 5, 1, k > 0.5 ? N.WHITE : VERRIERE[2], k)
      p.glow(v.x, v.y, 14, VERRIERE[1], 0.6 * k)
      p.place(0, 0)
    }
  }

  function dessinerLesEnnemis(p: Peintre): void {
    for (const e of m.ennemis) {
      const b = e.corps
      const cible = e.forage !== null ? e.forage : e.fait === 'chasse' ? { x: v.x, y: v.y } : null
      const vise = cible !== null ? Math.atan2(cible.y - b.y, cible.x - b.x) - b.cap : 0
      const blanchi = t - (toucheEnnemiA.get(e.id) ?? -10) < 0.1
      dessinerUnVaisseau(p, b, flammesEnnemies.get(e.id) ?? 0, blanchi ? BLANC : ROUGE, blanchi ? BLANC : VERRIERE_ENNEMIE, vise, e.forage !== null)
      // sa vie restante, sous lui (Keko : « afficher la vie restante des ennemis et astéroïdes »)
      dessinerUneJauge(p, b.x - camera.x + W / 2, b.y - camera.y + H / 2 + CONF.ennemi.rayon + 4, 12, e.pv / CONF.ennemi.pv, ROUGE[4], blanchi)
    }
  }

  /**
   * Une jauge de vie en pixel : un pixel de haut, encadrée de sombre, large de `w`, pleine à `part` ; `chaud` la blanchit
   * (on vient de frapper). Le peintre est supposé à l'origine, (x, y) en coordonnées du tampon, centrées.
   */
  function dessinerUneJauge(p: Peintre, x: number, y: number, w: number, part: number, teinte: number, chaud: boolean): void {
    const x0 = Math.round(x - w / 2)
    const yy = Math.round(y)
    p.line(x0 - 1, yy - 1, x0 + w, yy - 1, COQUE[0])
    p.line(x0 - 1, yy + 1, x0 + w, yy + 1, COQUE[0])
    p.dot(x0 - 1, yy, COQUE[0])
    p.dot(x0 + w, yy, COQUE[0])
    p.line(x0, yy, x0 + w - 1, yy, COQUE[1])
    const plein = Math.max(part > 0 ? 1 : 0, Math.round(w * Math.min(1, part)))
    if (plein > 0) p.line(x0, yy, x0 + plein - 1, yy, chaud ? N.WHITE : teinte)
  }

  /** Les traits de l'ennemi : un fuseau violet-blanc le long de sa vitesse, une lueur. */
  function dessinerLesTirs(p: Peintre): void {
    p.place(W / 2 - camera.x, H / 2 - camera.y)
    for (const tr of m.tirs) {
      const l = Math.hypot(tr.vx, tr.vy) || 1
      const ux = tr.vx / l
      const uy = tr.vy / l
      p.line(tr.x - ux * 5, tr.y - uy * 5, tr.x - ux * 2, tr.y - uy * 2, VIOLET[2])
      p.line(tr.x - ux * 2, tr.y - uy * 2, tr.x, tr.y, VIOLET[4])
      p.px(tr.x, tr.y, N.WHITE)
      p.glow(tr.x, tr.y, 6, VIOLET[3], 0.6)
    }
    // les obus du joueur : canon, un fuseau cyan ; mitrailleuse, un tiret court ; missile, un corps clair à pointe rouge et sa flamme
    for (const o of m.obus) {
      const l = Math.hypot(o.vx, o.vy) || 1
      const ux = o.vx / l
      const uy = o.vy / l
      if (o.arme === 'missiles') {
        p.line(o.x - ux * 4, o.y - uy * 4, o.x, o.y, COQUE[5])
        p.px(o.x, o.y, N.hex('#ff5a5a'))
        p.line(o.x - ux * 7, o.y - uy * 7, o.x - ux * 4, o.y - uy * 4, FEU[5])
        p.glow(o.x - ux * 6, o.y - uy * 6, 6, FEU[4], 0.6)
      } else if (o.arme === 'rafale') {
        p.line(o.x - ux * 2, o.y - uy * 2, o.x, o.y, VERRIERE[2])
        p.px(o.x, o.y, N.WHITE)
        p.glow(o.x, o.y, 3, VERRIERE[1], 0.4)
      } else {
        p.line(o.x - ux * 4, o.y - uy * 4, o.x - ux, o.y - uy, VERRIERE[1])
        p.line(o.x - ux, o.y - uy, o.x, o.y, VERRIERE[2])
        p.px(o.x, o.y, N.WHITE)
        p.glow(o.x, o.y, 5, VERRIERE[2], 0.6)
      }
    }
    p.place(0, 0)
  }

  /** Un rayon de foreur : du canon au point d'impact, un cœur blanc qui tremble entre deux bords colorés, une lueur ; l'impact brûle. */
  function dessinerUnLaser(p: Peintre, depuis: Vaisseau, f: Forage, teintes: number[]): void {
    const vise = Math.atan2(f.y - depuis.y, f.x - depuis.x)
    const x0 = depuis.x + Math.cos(depuis.cap) * -1.5 + Math.cos(vise) * 4.5
    const y0 = depuis.y + Math.sin(depuis.cap) * -1.5 + Math.sin(vise) * 4.5
    const px = -Math.sin(vise)
    const py = Math.cos(vise)
    const vacille = 0.75 + 0.25 * Math.sin(t * 70)
    p.line(x0 + px, y0 + py, f.x + px, f.y + py, teintes[2], 0.7)
    p.line(x0 - px, y0 - py, f.x - px, f.y - py, teintes[2], 0.7)
    p.line(x0, y0, f.x, f.y, teintes[4], 1)
    p.line(x0, y0, f.x, f.y, N.WHITE, vacille)
    p.glowLine(x0, y0, f.x, f.y, 4, teintes[3], 0.45)
    p.circle(f.x, f.y, 1.2 + f.part, N.WHITE)
    p.glow(f.x, f.y, 8 + 10 * f.part, teintes[4], 0.6 + 0.4 * vacille)
    p.glow(f.x, f.y, 3, N.WHITE, 0.5)
  }

  function dessinerLesLasers(p: Peintre): void {
    p.place(W / 2 - camera.x, H / 2 - camera.y)
    if (m.forage !== null && m.phase === 'vol') dessinerUnLaser(p, v, m.forage, LASER)
    for (const e of m.ennemis) if (e.forage !== null) dessinerUnLaser(p, e.corps, e.forage, VIOLET)
    p.place(0, 0)
  }

  /** Les stations d'extraction en vue (leur dessin est dans `station.ts`), leur parvis, et les pépites déposées qui y volent. */
  function dessinerLesStations(p: Peintre): void {
    const proche = stationLaPlusProche(CONF, v.x, v.y)
    const i0 = Math.round(camera.x / CONF.station.case)
    const j0 = Math.round(camera.y / CONF.station.case)
    for (let j = j0 - 1; j <= j0 + 1; j++)
      for (let i = i0 - 1; i <= i0 + 1; i++) {
        const st = stationDeLaCase(CONF, i, j)
        const sx = st.x - camera.x + W / 2
        const sy = st.y - camera.y + H / 2
        if (sx < -40 || sy < -40 || sx > W + 40 || sy > H + 40) continue
        const aQuai = m.phase !== 'perdu' && st.x === proche.x && st.y === proche.y && Math.hypot(v.x - st.x, v.y - st.y) <= CONF.station.portee
        // le parvis : un cercle pointillé qui dit la portée, plus net à quai
        for (let k = 0; k < 36; k++) {
          const a = (k / 36) * Math.PI * 2 + t * 0.25
          p.dot(sx + Math.cos(a) * CONF.station.portee, sy + Math.sin(a) * CONF.station.portee, aQuai ? PEPITE[2] : COQUE[2], aQuai ? 0.9 : 0.45)
        }
        dessinerStation(p, sx, sy, t, CONF.station.rayon, aQuai, TEINTES_STATION)
        // LE COMPTE DE L'EXTRACTION (Keko) : à quai, un arc d'or CONTINU (Keko : « plutôt qu'en pointillé ») se referme
        // le long du parvis depuis le haut, la tête blanche, et le nombre de secondes qui restent au-dessus de la
        // station ; au bout, l'arc est plein et la station flambe d'or
        // (il se dessine aussi hors du parvis, tant que le compte redescend : la lumière reste et le cercle se vide,
        // au lieu de tout faire disparaître — Keko)
        const laProche = st.x === proche.x && st.y === proche.y
        if (laProche && m.extraction > 0) {
          // (Keko : « le cercle de chargement manque de juice, une lumière plutôt qu'un cercle juste blanc ») : l'arc est
          // UNE LUMIÈRE — une bande d'or sombre et large dessous, le trait d'or clair au cœur blanc vers la tête, une
          // lueur posée tout le long, une tête qui bat et scintille et sème des étincelles, la station de plus en plus
          // allumée à mesure que l'arc se referme
          const u = Math.min(1, m.extraction / CONF.extraction.duree)
          const bat = 0.75 + 0.25 * Math.sin(t * 9)
          const a0 = -Math.PI / 2
          const a1 = a0 + u * Math.PI * 2
          const r = CONF.station.portee - 2
          p.arc(sx, sy, r + 1, 4.5, a0, a1, PEPITE[1], 0.55)
          p.arc(sx, sy, r, 2.2, a0, a1, (ua, va) => (ua > 0.94 ? N.WHITE : va < 0.45 ? PEPITE[4] : PEPITE[3]))
          const pas = 7 / r
          for (let a = a0; a <= a1; a += pas) p.glow(sx + Math.cos(a) * r, sy + Math.sin(a) * r, 8, PEPITE[2], 0.28)
          // le départ de l'arc, en haut, a la même lumière que la tête (Keko : « l'effet de flare également au début »)
          // (les deux flares s'éteignent quand le cercle est plein — Keko)
          const dx0 = sx + Math.cos(a0) * r
          const dy0 = sy + Math.sin(a0) * r
          if (u < 1) {
            p.glow(dx0, dy0, 9, PEPITE[3], 0.6 + 0.4 * bat)
            p.glow(dx0, dy0, 3.5, N.WHITE, 0.5 * bat)
            N.sparkle(p, dx0, dy0, 1.5 + 1.5 * bat, N.WHITE, PEPITE[3], 0.7)
          }
          const hx = sx + Math.cos(a1) * r
          const hy = sy + Math.sin(a1) * r
          if (u < 1) {
            p.glow(hx, hy, 9, PEPITE[3], 0.6 + 0.4 * bat)
            p.glow(hx, hy, 3.5, N.WHITE, 0.5 * bat)
            N.sparkle(p, hx, hy, 1.5 + 1.5 * bat, N.WHITE, PEPITE[3], 0.7)
            // la tête sème des étincelles d'or (dans le monde : l'écran recule de la caméra)
            if (R.next() < 0.45) {
              const an = a1 + Math.PI / 2 + R.range(-0.6, 0.6)
              const vit = R.range(8, 30)
              etincelles.ajouter('etincelle', hx - W / 2 + camera.x, hy - H / 2 + camera.y, Math.cos(an) * vit, Math.sin(an) * vit, R.range(0.25, 0.6), R.next() < 0.5 ? PEPITE[3] : PEPITE[4], 1, 2)
            }
          }
          p.glow(sx, sy, CONF.station.portee * 1.3, PEPITE[2], 0.1 + 0.35 * u * bat)
          if (m.phase === 'extrait') p.glow(sx, sy, CONF.station.portee * 1.6, PEPITE[2], 0.5 + 0.2 * Math.sin(t * 6))
          else p.text(String(Math.ceil(CONF.extraction.duree - m.extraction)), sx, sy - CONF.station.rayon - 16, PEPITE[3], { font: 'big', scale: 1, align: 'center', outline: COQUE[0] })
        }
      }
  }

  /**
   * Une simple flèche jaune au bord de l'écran vers la station hors champ (Keko : « une simple flèche comme ce qu'on
   * avait pour l'ennemi, mais en jaune » — la petite station en icône, qui battait, « n'est pas très belle et clignote
   * bizarrement »). Elle ne bat pas.
   */
  function dessinerLePointeur(p: Peintre): void {
    const st = stationLaPlusProche(CONF, v.x, v.y)
    const dx = st.x - camera.x
    const dy = st.y - camera.y
    const marge = 10
    if (Math.abs(dx) < W / 2 - marge && Math.abs(dy) < H / 2 - marge) return
    // le point du bord dans sa direction
    const k = Math.min((W / 2 - marge) / Math.max(1e-6, Math.abs(dx)), (H / 2 - marge) / Math.max(1e-6, Math.abs(dy)))
    const x = W / 2 + dx * k
    const y = H / 2 + dy * k
    const a = Math.atan2(dy, dx)
    const pointe = [x + Math.cos(a) * 4, y + Math.sin(a) * 4]
    const g1 = [x + Math.cos(a + 2.5) * 4, y + Math.sin(a + 2.5) * 4]
    const g2 = [x + Math.cos(a - 2.5) * 4, y + Math.sin(a - 2.5) * 4]
    p.poly([pointe, g1, g2], PEPITE[2])
    p.px(pointe[0], pointe[1], PEPITE[3])
    p.glow(x, y, 6, PEPITE[2], 0.4)
  }

  /** LE RADAR (un outil du hangar) : le rival le plus proche à sa portée, hors de l'écran, est désigné par une flèche rouge au bord, qui bat. */
  function dessinerLeRadar(p: Peintre): void {
    if (CONF.radar.portee <= 0) return
    let cible: Vaisseau | null = null
    let dmin = CONF.radar.portee
    for (const e of m.ennemis) {
      const d = Math.hypot(e.corps.x - v.x, e.corps.y - v.y)
      if (d <= dmin) (dmin = d), (cible = e.corps)
    }
    if (cible === null) return
    const dx = cible.x - camera.x
    const dy = cible.y - camera.y
    const marge = 10
    if (Math.abs(dx) < W / 2 - marge && Math.abs(dy) < H / 2 - marge) return
    const k = Math.min((W / 2 - marge) / Math.max(1e-6, Math.abs(dx)), (H / 2 - marge) / Math.max(1e-6, Math.abs(dy)))
    const x = W / 2 + dx * k
    const y = H / 2 + dy * k
    const a = Math.atan2(dy, dx)
    const bat = Math.sin(t * 8) > 0
    const pointe = [x + Math.cos(a) * 4, y + Math.sin(a) * 4]
    const g1 = [x + Math.cos(a + 2.5) * 4, y + Math.sin(a + 2.5) * 4]
    const g2 = [x + Math.cos(a - 2.5) * 4, y + Math.sin(a - 2.5) * 4]
    p.poly([pointe, g1, g2], bat ? ROUGE[4] : ROUGE[3])
    p.px(pointe[0], pointe[1], ROUGE[5])
    p.glow(x, y, 6, ROUGE[3], bat ? 0.5 : 0.3)
  }

  /**
   * LE PORTÉ, en haut à gauche : une ligne par minerai qu'on a (fer, or, cristal — Keko : « des tiers de
   * ressources »), une pépite de sa couleur et son nombre ; les pépites ramassées y volent. RIEN NE MONTRE CE QUI EST
   * DÉJÀ EXTRAIT (Keko : « ne pas afficher les ressources déjà extraites ») : le total ne se lit qu'aux écrans de fin.
   * La coque en haut à droite.
   */
  function dessinerLeScore(p: Peintre): void {
    const visibles = MINERAIS.filter((k) => affiche[k] > 0 || envols.some((e) => e.minerai === k))
    const ligneDe = (k: Minerai) => COMPTEUR.y + visibles.indexOf(k) * 11
    // les pépites en vol : de la place du vaisseau à l'écran vers le compteur de leur minerai, en accélérant
    for (let i = envols.length - 1; i >= 0; i--) {
      const e = envols[i]
      const u = (t - e.t0) / 0.45
      if (u >= 1) {
        envols.splice(i, 1)
        affiche[e.minerai] += 1
        allumeA[e.minerai] = t
        continue
      }
      const T = TEINTES_MINERAI[e.minerai]
      const k = u * u * (3 - 2 * u)
      const x0 = e.x - camera.x + W / 2
      const y0 = e.y - camera.y + H / 2
      const x = x0 + (COMPTEUR.x - x0) * k
      const y = y0 + (ligneDe(e.minerai) + 4 - y0) * k
      p.poly([[x, y - 2], [x + 2, y], [x, y + 2], [x - 2, y]], T[2])
      p.dot(x, y - 1, T[3])
      p.glow(x, y, 6, T[2], 0.5)
    }
    // le bouclier, à gauche des cases de coque : une case cyan par point, qui se vide et se remplit
    for (let j = 0; j < CONF.bouclier.points; j++) {
      const x = W - 8 - (CONF.coque + CONF.bouclier.points - 1 - j) * 6 - 3
      const part = Math.max(0, Math.min(1, m.bouclier - j))
      p.poly([[x - 2, COMPTEUR.y + 2], [x + 2, COMPTEUR.y + 2], [x + 2, COMPTEUR.y + 6], [x - 2, COMPTEUR.y + 6]], VERRIERE[0])
      if (part > 0) {
        const haut = COMPTEUR.y + 6 - Math.max(1, Math.round(4 * part))
        p.poly([[x - 2, haut], [x + 2, haut], [x + 2, COMPTEUR.y + 6], [x - 2, COMPTEUR.y + 6]], t - bouclierA < 0.3 && Math.floor(t * 16) % 2 === 0 ? N.WHITE : VERRIERE[2])
      }
    }
    // la coque, en haut à droite : une case par point, pleine ou vide ; elle clignote quand on vient d'être touché
    for (let i = 0; i < CONF.coque; i++) {
      const x = W - 8 - (CONF.coque - 1 - i) * 6
      // la case se vide par le haut à mesure que le point s'entame (les chocs coûtent des fractions)
      const part = Math.max(0, Math.min(1, m.coque - i))
      const chaud = t - toucheA < 0.3 && Math.floor(t * 16) % 2 === 0
      p.poly([[x - 2, COMPTEUR.y + 2], [x + 2, COMPTEUR.y + 2], [x + 2, COMPTEUR.y + 6], [x - 2, COMPTEUR.y + 6]], COQUE[1])
      if (part > 0) {
        const haut = COMPTEUR.y + 6 - Math.max(1, Math.round(4 * part))
        p.poly([[x - 2, haut], [x + 2, haut], [x + 2, COMPTEUR.y + 6], [x - 2, COMPTEUR.y + 6]], chaud ? N.WHITE : COQUE[5])
        if (part >= 1) p.dot(x - 1, COMPTEUR.y + 3, COQUE[6])
      }
    }
    // les compteurs du porté : l'icône (une pépite de la couleur du minerai) qui saute avec le nombre quand une arrive
    for (const k of visibles) {
      const T = TEINTES_MINERAI[k]
      const allume = t - allumeA[k] < 0.18
      const haut = allume ? -1 : 0
      const ly = ligneDe(k)
      const ix = COMPTEUR.x - 9
      const iy = ly + 5 + haut
      p.poly([[ix, iy - 3], [ix + 3, iy], [ix, iy + 3], [ix - 3, iy]], T[2])
      p.dot(ix, iy - 1, T[3])
      p.dot(ix - 1, iy, T[4])
      p.dot(ix + 1, iy + 1, T[1])
      p.glow(ix, iy, 6, T[2], allume ? 0.8 : 0.3)
      p.text(String(affiche[k]), COMPTEUR.x, ly + haut, allume ? N.WHITE : T[3], { font: 'big', scale: 1, align: 'left', outline: COQUE[0] })
      if (allume) N.sparkle(p, ix, iy, 1 + 3 * Math.sin(((t - allumeA[k]) / 0.18) * Math.PI), T[4], T[2], 0.5)
    }
  }

  /** Les pépites libres, aux teintes de leur minerai. */
  function dessinerLesPepites(p: Peintre): void {
    for (const pe of m.pepites) {
      const T = TEINTES_MINERAI[pe.minerai]
      const k = 0.6 + 0.4 * Math.sin(t * 6 + pe.graine)
      p.poly([[pe.x, pe.y - 2], [pe.x + 2, pe.y], [pe.x, pe.y + 2], [pe.x - 2, pe.y]], T[2])
      p.dot(pe.x, pe.y - 1, T[3])
      p.dot(pe.x - 1, pe.y, T[4], k)
      p.dot(pe.x + 1, pe.y + 1, T[1])
      p.glow(pe.x, pe.y, 5, T[2], 0.35 * k)
    }
  }

  /** Le manche, EN PIXELS dans le tampon (plus de surcouche) : l'anneau au centre posé, le pouce dans la direction du doigt. */
  function dessinerLeManche(p: Peintre): void {
    if (manche === null) return
    p.place(0, 0)
    const r = C.manche.rayon / zoom
    const doigt = enTampon(manche.doigt.x, manche.doigt.y)
    if (suivre) {
      p.ring(doigt.x, doigt.y, 18 / zoom, 1, N.WHITE, 0.5)
      return
    }
    const centre = enTampon(manche.centre.x, manche.centre.y)
    p.circle(centre.x, centre.y, r, COQUE[0], 0.25)
    p.ring(centre.x, centre.y, r, 1, COQUE[4]) // (opaque : tramé, l'anneau faisait du bruit)
    const dx = manche.doigt.x - manche.centre.x
    const dy = manche.doigt.y - manche.centre.y
    const d = Math.hypot(dx, dy)
    const k = d > C.manche.rayon ? C.manche.rayon / d : 1
    p.circle(centre.x + (dx * k) / zoom, centre.y + (dy * k) / zoom, r * 0.42, COQUE[6])
  }

  // ---------------------------------------------------------------- la boucle
  let avant = performance.now()
  let accumule = 0
  function image(ms: number): void {
    const dt = Math.min(0.25, (ms - avant) / 1000)
    avant = ms
    t += dt
    if (enJeu) {
      accumule += dt
      const direction = t - arriveA < ARRIVE_A ? { x: 0, y: 0 } : directionVoulue() // (pas encore arrivé : il ne répond pas)
      while (accumule >= PAS) {
        accumule -= PAS
        const r = avancerLeMonde(CONF, m, PAS, direction)
        v = m.vaisseau
        // les lasers creusent : des étincelles au point d'impact, le long de la normale (le joueur, et chaque ennemi qui mine)
        const forages: { f: Forage; depuis: Vaisseau }[] = []
        if (m.forage !== null) forages.push({ f: m.forage, depuis: v })
        for (const e of m.ennemis) if (e.forage !== null) forages.push({ f: e.forage, depuis: e.corps })
        for (const { f, depuis } of forages) {
          if (R.next() >= 0.6) continue
          const nx = depuis.x - f.x
          const ny = depuis.y - f.y
          const d = Math.hypot(nx, ny) || 1
          const a = Math.atan2(ny, nx) + R.range(-1.1, 1.1)
          const vit = R.range(30, 90) * (0.6 + f.part)
          etincelles.ajouter('etincelle', f.x + (nx / d) * 0.5, f.y + (ny / d) * 0.5, Math.cos(a) * vit + depuis.vx * 0.2, Math.sin(a) * vit + depuis.vy * 0.2, R.range(0.2, 0.45), R.next() < 0.5 ? LASER[4] : LASER[3], 1, 2.5)
          if (R.next() < 0.25) etincelles.ajouter('braise', f.x, f.y, Math.cos(a) * vit * 0.5, Math.sin(a) * vit * 0.5, R.range(0.4, 0.8), 0, 1, 1.5)
        }
        for (const ev of r.evenements) {
          switch (ev.type) {
            case 'eclat': {
              // une roche éclate : un flash, ses morceaux qui partent en tournant et s'éteignent
              flashs.push({ x: ev.x, y: ev.y, t0: t, r: ev.rayon })
              const roche = rocheDe(ev.minerai)
              const n = 6 + Math.round(ev.rayon)
              for (let i = 0; i < n; i++) {
                const a = R.range(0, Math.PI * 2)
                const d = R.range(0, ev.rayon * 0.7)
                const vit = R.range(25, 90)
                morceaux.add({ kind: N.B.SHARD, x: ev.x + Math.cos(a) * d, y: ev.y + Math.sin(a) * d, vx: Math.cos(a) * vit, vy: Math.sin(a) * vit, g: 0, drag: 1.1, bounce: 0, life: R.range(0.8, 1.6), a: R.range(0, Math.PI * 2), va: R.range(-9, 9), s: R.range(1.5, 2.5 + ev.rayon * 0.15), c: roche[2 + Math.floor(R.next() * 4)] })
              }
              secousse = Math.max(secousse, Math.min(1, 0.3 + ev.rayon / 20))
              if (typeof navigator.vibrate === 'function') navigator.vibrate(30)
              break
            }
            case 'ramasse':
              flashs.push({ x: ev.x, y: ev.y, t0: t, r: 0, c: TEINTES_MINERAI[ev.minerai] })
              if (ev.par === 'joueur') envols.push({ x: v.x, y: v.y, t0: t, minerai: ev.minerai })
              break
            case 'touche': {
              // un trait perce la coque : le vaisseau blanchit, une étincelle rouge, une secousse, une vibration
              toucheA = t
              secousse = Math.max(secousse, 0.7)
              if (typeof navigator.vibrate === 'function') navigator.vibrate(40)
              for (let i = 0; i < 10; i++) {
                const a = R.range(0, Math.PI * 2)
                const vit = R.range(30, 110)
                etincelles.ajouter('etincelle', ev.x, ev.y, Math.cos(a) * vit, Math.sin(a) * vit, R.range(0.2, 0.5), R.next() < 0.5 ? N.WHITE : ROUGE[4], 1, 2.5)
              }
              flashs.push({ x: ev.x, y: ev.y, t0: t, r: -1 })
              break
            }
            case 'obus':
              // une arme tire : deux étincelles à la bouche
              for (let i = 0; i < 2; i++) etincelles.ajouter('etincelle', ev.x, ev.y, R.range(-20, 20), R.range(-20, 20), 0.12, N.WHITE, 1, 1.5)
              break
            case 'ennemiTouche': {
              // un obus touche le rival : il blanchit, des étincelles cyan
              toucheEnnemiA.set(ev.id, t)
              for (let i = 0; i < 6; i++) {
                const a = R.range(0, Math.PI * 2)
                const vit = R.range(30, 90)
                etincelles.ajouter('etincelle', ev.x, ev.y, Math.cos(a) * vit, Math.sin(a) * vit, R.range(0.15, 0.35), R.next() < 0.5 ? N.WHITE : VERRIERE[2], 1, 2)
              }
              break
            }
            case 'bouclier': {
              // le bouclier prend le coup : son anneau flashe, des étincelles cyan, une petite secousse
              bouclierA = t
              secousse = Math.max(secousse, 0.3)
              if (typeof navigator.vibrate === 'function') navigator.vibrate(20)
              for (let i = 0; i < 8; i++) {
                const a = R.range(0, Math.PI * 2)
                const vit = R.range(30, 100)
                etincelles.ajouter('etincelle', ev.x, ev.y, Math.cos(a) * vit, Math.sin(a) * vit, R.range(0.2, 0.4), R.next() < 0.5 ? N.WHITE : VERRIERE[2], 1, 2.5)
              }
              break
            }
            case 'ennemiDetruit': {
              // l'ennemi éclate comme une roche, en rouge, et rend ses pépites (la règle les a faites naître)
              effets.push({ fx: N.createFx(EXPLOSION as Module, { x: ev.x - camera.x + W / 2, y: ev.y - camera.y + H / 2, palette: EXPLOSION_RIVAL, debris: '#7a2a36', size: 0.35, seed: ev.id }), x: ev.x, y: ev.y })
              for (let i = 0; i < 14; i++) {
                const a = R.range(0, Math.PI * 2)
                const vit = R.range(30, 110)
                morceaux.add({ kind: N.B.SHARD, x: ev.x, y: ev.y, vx: Math.cos(a) * vit + ev.vx * 0.4, vy: Math.sin(a) * vit + ev.vy * 0.4, g: 0, drag: 1.2, bounce: 0, life: R.range(0.8, 1.5), a: R.range(0, Math.PI * 2), va: R.range(-10, 10), s: R.range(1.5, 3), c: ROUGE[1 + Math.floor(R.next() * 4)] })
              }
              secousse = Math.max(secousse, 0.6)
              flammesEnnemies.delete(ev.id)
              if (typeof navigator.vibrate === 'function') navigator.vibrate(40)
              break
            }
            case 'extrait': {
              // resté à quai jusqu'au bout : le vaisseau se TÉLÉPORTE (Keko) — dessiné blanchi jusqu'à l'éclair, puis
              // l'effet prend le relais et il n'est plus dessiné ; l'écran de fin vient quand l'effet est passé
              perduA = t
              effets.push({ fx: N.createFx(TELEPORTATION as Module, { x: v.x - camera.x + W / 2, y: v.y - camera.y + H / 2, rayon: CONF.rayon, seed: 3 }), x: v.x, y: v.y })
              secousse = 0.5
              if (typeof navigator.vibrate === 'function') navigator.vibrate([40, 60, 40])
              // le porté passe en banque : les compteurs du haut se vident (le total ne s'affiche pas : l'écran le dit)
              for (const k of MINERAIS) affiche[k] = 0
              // le trésor s'en souvient, sur l'appareil : c'est lui qui achète les pièces au hangar
              tresor = { ...m.tresor }
              sauver()
              // (le bilan ne s'affiche plus au hangar : Keko l'a fait retirer ; les compteurs et le trésor disent tout)
              break
            }
            case 'perdu': {
              // le joueur explose et disparaît ; l'écran de fin attend que la boule de feu soit passée
              perduA = t
              effets.push({ fx: N.createFx(EXPLOSION as Module, { x: v.x - camera.x + W / 2, y: v.y - camera.y + H / 2, debris: '#46587a', size: 0.45, seed: 5 }), x: v.x, y: v.y })
              for (let i = 0; i < 18; i++) {
                const a = R.range(0, Math.PI * 2)
                const vit = R.range(30, 120)
                morceaux.add({ kind: N.B.SHARD, x: v.x, y: v.y, vx: Math.cos(a) * vit + v.vx * 0.4, vy: Math.sin(a) * vit + v.vy * 0.4, g: 0, drag: 1.2, bounce: 0, life: R.range(0.9, 1.6), a: R.range(0, Math.PI * 2), va: R.range(-10, 10), s: R.range(1.5, 3), c: COQUE[1 + Math.floor(R.next() * 4)] })
              }
              secousse = 1
              if (typeof navigator.vibrate === 'function') navigator.vibrate([60, 40, 90])
              break
            }
            default:
              break
          }
        }
        for (const choc of r.chocs) {
          secousse = Math.min(1, 0.3 + choc.force / 120)
          if (typeof navigator.vibrate === 'function') navigator.vibrate(Math.round(10 + choc.force / 4))
          // une gerbe d'étincelles le long de la normale (celles du dépôt tombent : c'est l'espace)
          const nx = v.x - choc.x
          const ny = v.y - choc.y
          const l = Math.hypot(nx, ny) || 1
          const n = 6 + Math.round(choc.force / 8)
          for (let i = 0; i < n; i++) {
            const a = Math.atan2(ny / l, nx / l) + R.range(-1.2, 1.2)
            const vit = R.range(30, 60 + choc.force)
            etincelles.ajouter('etincelle', choc.x, choc.y, Math.cos(a) * vit, Math.sin(a) * vit, R.range(0.25, 0.6), R.next() < 0.5 ? N.WHITE : rocheDe(asteroidesVisibles(CONF, m, choc.x, choc.y, 20).find((r) => r.id === choc.asteroide)?.minerai ?? 'fer')[5], 1, 2.5)
          }
          flashs.push({ x: choc.x, y: choc.y, t0: t, r: -1 })
        }
        // les braises du moteur, en coordonnées du monde, derrière la tuyère
        if (v.poussee > 0.05) {
          const n = v.poussee > 0.6 ? 2 : 1
          for (let i = 0; i < n; i++) {
            const bx = v.x - Math.cos(v.cap) * 8
            const by = v.y - Math.sin(v.cap) * 8
            const vitesse = 30 + 40 * v.poussee
            braises.ajouter('braise', bx + R.range(-1, 1), by + R.range(-1, 1), v.vx * 0.3 - Math.cos(v.cap) * vitesse + R.range(-8, 8), v.vy * 0.3 - Math.sin(v.cap) * vitesse + R.range(-8, 8), R.range(0.25, 0.5), 0, 1, 2)
          }
        }
      }
      flamme += (v.poussee - flamme) * Math.min(1, dt * 14)
      for (const e of m.ennemis) {
        const f = flammesEnnemies.get(e.id) ?? 0
        flammesEnnemies.set(e.id, f + (e.corps.poussee - f) * Math.min(1, dt * 14))
        if (e.corps.poussee > 0.05 && R.next() < 0.5) {
          const b = e.corps
          const vitesse = 30 + 40 * b.poussee
          braises.ajouter('braise', b.x - Math.cos(b.cap) * 8 + R.range(-1, 1), b.y - Math.sin(b.cap) * 8 + R.range(-1, 1), b.vx * 0.3 - Math.cos(b.cap) * vitesse + R.range(-8, 8), b.vy * 0.3 - Math.sin(b.cap) * vitesse + R.range(-8, 8), R.range(0.25, 0.5), 0, 1, 2)
        }
      }
    }
    // la caméra suit, avec un peu d'avance dans le sens de la vitesse
    const viseX = v.x + v.vx * 0.35
    const viseY = v.y + v.vy * 0.35
    camera.x += (viseX - camera.x) * Math.min(1, dt * 4)
    camera.y += (viseY - camera.y) * Math.min(1, dt * 4)
    braises.update(dt)
    etincelles.update(dt)
    morceaux.update(dt)
    for (let i = flashs.length - 1; i >= 0; i--) if (t - flashs[i].t0 > 0.4) flashs.splice(i, 1)
    for (const e of effets) {
      e.fx.update(dt)
      e.fx.options.x = e.x - camera.x + W / 2
      e.fx.options.y = e.y - camera.y + H / 2
    }
    effets = effets.filter((e) => !e.fx.done())

    N.clearFrame(frame)
    const p = N.painterFor(frame)
    const visible = ecranVisible()
    if (visible && !ecranEtait) ouvrirLeHangar()
    ecranEtait = visible
    if (visible) {
      // LE HANGAR à la place du monde (Keko : « je ne veux pas voir l'extracteur ni le niveau derrière ») : la scène, puis l'interface
      dessinerLeHangar(p)
      dessinerLEcran(p)
      N.composite(frame, img.data, FOND)
      g.putImageData(img, 0, 0)
      canvas.style.transform = ''
      requestAnimationFrame(image)
      return
    }
    dessinerLeCiel(p)
    for (const a of asteroidesVisibles(C, m, camera.x, camera.y, Math.max(W, H) / 2 + C.champ.rayonMax + 4)) {
      // la roche qu'on creuse tremble, d'autant plus qu'elle est près d'éclater
      const creusee = m.forage !== null && m.forage.cible === a.id
      const tremble = creusee ? (0.5 + m.forage!.part) * 1.2 : 0
      dessinerAsteroide(p, a, t, a.x - camera.x + W / 2 + (tremble > 0 ? (R.next() - 0.5) * tremble : 0), a.y - camera.y + H / 2 + (tremble > 0 ? (R.next() - 0.5) * tremble : 0))
      // sa solidité restante, sous elle, dès qu'elle est entamée (Keko) — pas avant : le champ serait couvert de jauges
      const creuse = m.creuse.get(a.id) ?? 0
      if (creuse > 0) dessinerUneJauge(p, a.x - camera.x + W / 2, a.y - camera.y + H / 2 + a.rayon + 4, Math.max(8, Math.round(a.rayon * 1.6)), 1 - creuse / solidite(CONF, a), COQUE[5], creusee && Math.floor(t * 20) % 2 === 0)
    }
    // les braises, les morceaux, les pépites, les étincelles sont dans le monde : le peintre se place sur la caméra
    p.place(W / 2 - camera.x, H / 2 - camera.y)
    braises.draw(p)
    morceaux.draw(p)
    dessinerLesPepites(p)
    etincelles.draw(p)
    for (const f of flashs) {
      const u = (t - f.t0) / 0.4
      if (f.r === 0) {
        // une pépite montée à bord : un éclat
        N.sparkle(p, f.x, f.y, 1 + 3 * Math.sin(u * Math.PI), (f.c ?? PEPITE)[3], (f.c ?? PEPITE)[2], 0.5 * (1 - u))
        continue
      }
      if (f.r === -1) {
        // un choc : un point blanc et une lueur, trois images
        if (u < 0.4) {
          p.circle(f.x, f.y, 1.5 * (1 - u / 0.4) + 0.5, N.WHITE)
          p.glow(f.x, f.y, 10, LASER[4], 0.6 * (1 - u / 0.4))
        }
        continue
      }
      p.glow(f.x, f.y, f.r * 2 + 10, LASER[4], 0.8 * (1 - u))
      p.ring(f.x, f.y, f.r * 0.5 + f.r * 2.2 * u, 1, u < 0.3 ? N.WHITE : LASER[3], 1 - u)
    }
    p.place(0, 0)
    dessinerLesStations(p)
    dessinerLesEnnemis(p)
    if ((m.phase === 'vol' && t - arriveA >= ARRIVE_A) || (m.phase === 'extrait' && t - perduA < TELEPORTE_A)) dessinerLeVaisseau(p)
    dessinerLesTirs(p)
    dessinerLesLasers(p)
    dessinerLePointeur(p)
    dessinerLeRadar(p)
    dessinerLeScore(p)
    for (const e of effets) e.fx.draw(frame)
    dessinerLeManche(p)
    N.composite(frame, img.data, FOND)
    g.putImageData(img, 0, 0)
    secousse = Math.max(0, secousse - dt / 0.25)
    canvas.style.transform = secousse > 0 ? `translate(${(Math.random() - 0.5) * secousse * 8}px, ${(Math.random() - 0.5) * secousse * 8}px)` : ''
    requestAnimationFrame(image)
  }
  ouvrirLeHangar()
  cadrer()
  new ResizeObserver(cadrer).observe(racine)
  requestAnimationFrame(image)
}

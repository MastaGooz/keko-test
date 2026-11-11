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
import { acheter, ajouterLesPiecesDEssai, capacite, poidsTotal, configDuHangar, demonter, demonterA, EMPLACEMENTS, estMontee, FICHES_MINERAI, foreuseMontee, hangarNeuf, jaugesDe, montantCourt, monteeA, monter, monterA, peutAcheter, peutMonter, pieceDe, piecesDe, possede, aimantMonte, radarMonte, vendre, type Jauge, type Piece, type Sorte } from '../../logic/vaisseau/hangar.ts'
import { drawWord, spell } from 'pixelfx/fx/ui/_lib'
import { textWidth } from 'pixelfx'
import { HAUT_ACCENTS } from './police.ts'
import { canonDeLaForeuse, formesDeLAimant, formesDuChassis, formesDeLaForeuse, formesDeLArme, formesDuPropulseur, formesDuRadar, formesDuVaisseau, ovale, peindreDansUneCase, peindreFormes } from './rendu-vaisseau.ts'
import { chargerHangar, sauverHangar } from './hangar.ts'
import { ECLOSION_DE_L_ARRIVEE, jouer, latenceMs, regler, reveiller, type Son } from './sons.ts'
import { dessinerAsteroide, dessinerPepite, LUMIERE, rocheDe, TEINTES_MINERAI } from './asteroide.ts'
import { dessinerBase, dessinerStation, ENVERGURE_BASE } from './station.ts'
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
const FEU = N.fit(N.PAL.fire, 8)
/** La flamme du propulseur ionique (cran 3 du hangar) : bleue. */
const ION = N.fit(['#061a3a', '#0a3a7a', '#1a7ad0', '#3ab0ff', '#80e0ff', '#c8f4ff', '#ffffff', '#ffffff'], 8)
const LASER = N.fit(['#3a0a10', '#a01020', '#ff2a3a', '#ff7a5a', '#ffd0a0', '#ffffff'], 6)
const PEPITE = N.fit(['#3a2a06', '#b8860b', '#ffd23a', '#fff6c0', '#ffffff'], 5)
/** L'ennemi : une coque rouge sombre, une verrière orange, un laser violet. */
const ROUGE = N.fit(['#1a0a0e', '#4a1a22', '#7a2a36', '#a8404c', '#d06a70', '#f0a0a0', '#ffffff'], 7)
const VERRIERE_ENNEMIE = N.fit(['#4a2a06', '#d07a18', '#ffc860', '#ffffff'], 4)
const VIOLET = N.fit(['#1a0a2a', '#5a1a90', '#9a3ae0', '#c070ff', '#e8c0ff', '#ffffff'], 6)
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
/**
 * La lumière du vaisseau en vol : la DIRECTION de celle du monde (les roches, la station), relevée vers nous — rasante
 * comme celle des roches, elle laissait les ailes, des plaques à plat, dans le noir.
 */
const LUMIERE_DU_VOL = { x: LUMIERE.x, y: LUMIERE.y, z: 0.75 }
/**
 * Le reflet des bords à l'ombre, en vol : à un pixel l'unité, celui du hangar (un bleu clair) cernait tout le bas du
 * vaisseau d'un trait — ici un bleu sourd, un rouge sourd pour le rival.
 */
const REFLET_DU_VOL = N.hex('#2c4a78')
const REFLET_DU_RIVAL = N.hex('#6a2440')
const COULEURS_NEBULEUSE = ['#3a1a6a', '#14305a', '#5a1a40', '#103a3a'].map((h) => N.hex(h))

export function monterVaisseau(racine: HTMLElement, build: string): void {
  document.documentElement.classList.add('vaisseau-page')
  racine.classList.add('vaisseau')
  const parametres = new URLSearchParams(location.search)
  const suivre = parametres.get('controle') === 'suivre'
  /** `&minerai=N` : part avec N pepites a bord, pour voir le compteur sans miner (ce qui se teste doit s'ouvrir d'un lien). */
  const minerai0 = Math.max(0, Number(parametres.get('minerai')) || 0)
  /** `&coque=N` : part avec N points de coque au plus, pour juger le dernier point (tout passe au rouge) et la plaque touchée. */
  const coque0 = Math.max(0, Number(parametres.get('coque')) || 0)
  /** `&ennemi` : l'ennemi naît tout de suite (pour le voir sans attendre) — à la même distance qu'en jeu : né à 90, on le voyait apparaître à l'écran (Keko : « il devrait toujours apparaître hors champ »). */
  const BASE: ConfigVaisseau = parametres.has('ennemi') ? { ...C, ennemi: { ...C.ennemi, apparait: 0 }, base: { ...C.base, calme: 0 } } : C
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
  let zones: { x: number; y: number; w: number; h: number; action: () => void; son?: Son | null }[] = []

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
  /**
   * LES SONS EN AVANCE (Keko : « une petite latence » — 123 ms mesurés sur son téléphone, celle de l'appareil) : ce
   * qu'on sait arriver se joue AVANT, de la latence mesurée — le choc contre une roche (le vaisseau file droit sur
   * elle, l'impact est à moins de la latence), le prochain coup d'une arme (sa cadence est connue). L'instant de
   * l'annonce empêche de rejouer le son quand l'événement arrive.
   */
  let chocAnnonceA = -10
  const armeAnnonceeA = new Map<string, number>()
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
  /**
   * L'INTERFACE DU VOL, DANS LA LANGUE DE LA BASE (Keko, 11/11) : ce qu'elle a vu à l'image d'avant, pour réagir au
   * changement — les points de coque entiers (celui qui tombe éclate), la soute pleine (la plaque bondit, une fois),
   * la part de la jauge de soute (elle glisse).
   */
  let coqueVue = 0
  let soutePleineVue = false
  let souteVue = 0
  let secousse = 0
  let flamme = 0
  /** Le compte de l'extraction à l'image d'avant, et s'il montait : la voix de la charge suit le compte, pas le parvis. */
  let compteVu = 0
  let compteMonte = false
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
    if (coque0 > 0) m.coque = Math.min(m.coque, coque0)
    m.tresor = { ...tresor }
    m.banque = totalDe(tresor)
    effets = []
    flashs.length = 0
    envols.length = 0
    for (const k of MINERAIS) affiche[k] = 0
    affiche.fer = minerai0
    flammesEnnemies.clear()
    toucheEnnemiA.clear()
    coqueVue = Math.ceil(m.coque)
    soutePleineVue = false
    souteVue = 0
    v = m.vaisseau
    camera.x = 0
    camera.y = 0
    enJeu = true
    // L'ARRIVÉE (Keko : « une animation de téléportation aussi au début, comme si le vaisseau était téléporté sur
    // l'extracteur ») : la matérialisation à la place du vaisseau, qui n'apparaît qu'à son ouverture
    arriveA = t
    // son SON : la montée pendant la spirale, les clochettes à l'instant où le vaisseau paraît (`ARRIVE_A`)
    jouer('arrive', undefined, Math.max(0, ARRIVE_A - ECLOSION_DE_L_ARRIVEE))
    compteVu = 0
    effets.push({ fx: N.createFx(MATERIALISATION as Module, { x: v.x - camera.x + W / 2, y: v.y - camera.y + centreY(), rayon: CONF.rayon, seed: 4 }), x: v.x, y: v.y })
  }

  // ---------------------------------------------------------------- le hangar, en pixels
  /** L'allure du vaisseau : les crans des pièces montées et ses armes PLACE PAR PLACE ('' : une place libre — la place 1 est l'aile gauche, la 2 la droite), lus par le dessin (le rival est de série, sans arme) ; `bouclier` : la part du bouclier qui reste, pour son anneau. */
  type Allure = { propulseur: number; coque: number; /** Le cran de la foreuse montée, 0 sans foreuse. */ foreuse: number; radar: boolean; aimant: boolean; armes: string[]; bouclier: number }
  const ALLURE_SERIE: Allure = { propulseur: 1, coque: 1, foreuse: 1, radar: false, aimant: false, armes: [], bouclier: 0 }
  const allureMontee = (bouclier: number): Allure => ({ propulseur: monteeA(hangar, 'propulseur').cran, coque: monteeA(hangar, 'coque').cran, foreuse: foreuseMontee(hangar)?.cran ?? 0, radar: radarMonte(hangar) > 0, aimant: aimantMonte(hangar) > 1, armes: Array.from({ length: capacite(hangar, 'arme') }, (_, k) => pieceDe(hangar.armes[k] ?? '')?.arme?.id ?? ''), bouclier })
  /** L'écran est là quand rien ne vole : avant le premier décollage, et après une fin, le temps que l'effet passe. */
  /**
   * L'ACCUEIL (Keko, 11/11 : « un écran d'accueil avec une demande de tap pour lancer le hangar, afin de débloquer les
   * sons — actuellement il faut que je tape avant que le jeu lance le son ; un bel écran dans le thème graphique du
   * jeu, et le titre : Nova Drifter ») : le jeu s'ouvre dessus, et c'est SA tape qui fait naître le contexte audio — le
   * hangar arrive donc avec ses sons. `&direct` le saute (ce qui se teste doit s'ouvrir d'un lien).
   */
  let accueil = !parametres.has('direct')
  let accueilQuitteA: number | null = null
  const SORTIE_DE_L_ACCUEIL = 0.75
  function quitterLAccueil(): void {
    if (accueilQuitteA !== null) return
    accueilQuitteA = t
    jouer('decolle')
    if (typeof navigator.vibrate === 'function') navigator.vibrate(15)
  }
  const ecranVisible = (): boolean => !enJeu || (m.phase !== 'vol' && t - perduA > (m.phase === 'extrait' ? 1.7 : 1))
  let ecranEtait = false
  /** L'onglet ouvert, et la pièce choisie dans chacun (le hangar s'ouvre sur les pièces montées). */
  const ONGLETS: Sorte[] = ['coque', 'propulseur', 'outil', 'arme'] // (le châssis d'abord — Keko)
  /** Le nom d'un onglet ; les listes disent LEURS PLACES, occupées / portées par la coque (Keko : « ce n'est pas lisible »). */
  const NOMS_ONGLET: Record<Sorte, string> = { propulseur: 'Propulsion', coque: 'Châssis', outil: 'Outils', arme: 'Armes' }
  /** Les sous-catégories d'une catégorie : les familles de ses pièces (outils : foreuses, radars) ; `null` = toutes. */
  /** LES SOUS-CATÉGORIES, PAR ACTIVITÉ (Keko : « classer les outils par activité, minage / combat ») : la famille d'une pièce dit son activité. */
  const ACTIVITE: Record<string, string> = { foreuse: 'minage', aimant: 'minage', radar: 'combat' }
  const NOMS_FAMILLE: Record<string, string> = { minage: 'Minage', combat: 'Combat' }
  const sousDe = (pc: Piece): string | undefined => (pc.famille === undefined ? undefined : (ACTIVITE[pc.famille] ?? pc.famille))
  const famillesDe = (o: Sorte): string[] => [...new Set(piecesDe(o).map(sousDe).filter((f): f is string => f !== undefined))]
  const sousCategorie: Record<Sorte, string | null> = { propulseur: null, coque: null, outil: null, arme: null }
  /** La liste visible d'une catégorie : ses pièces, ou celles de la sous-catégorie choisie. */
  const listeVisible = (o: Sorte): Piece[] => piecesDe(o).filter((pc) => sousCategorie[o] === null || sousDe(pc) === sousCategorie[o])
  /** LE DÉFILEMENT de la liste (Keko : « énormément de pièces, un moyen de se déplacer dans une longue liste ») : en rangées, par catégorie ; on la fait glisser au doigt, quatre rangées visibles. */
  const RANGEES = 4
  const defil: Record<Sorte, number> = { propulseur: 0, coque: 0, outil: 0, arme: 0 }
  /** Un glisser en cours sur la liste : d'où il part, le défilement d'alors, s'il a bougé (sinon c'est une tape). */
  let glisse: { x: number; y: number; defil0: number; bouge: boolean; sorte: 'liste' | 'onglets' } | null = null
  /** LE DÉFILEMENT DE LA GRILLE D'ONGLETS, en pixels (Keko : « les deux du bas tombent sous la zone, ajoute un défilement »), et sa zone, refaite à chaque image (null : tout tient). */
  let defilOnglets = 0
  let zoneDesOnglets: { x: number; y: number; w: number; h: number } | null = null
  /** La zone qui se fait glisser, refaite à chaque image comme les autres. */
  let zoneGlissante: { x: number; y: number; w: number; h: number } | null = null
  let onglet: Sorte = 'propulseur'
  /**
   * LA PLACE OUVERTE, pour les outils et les armes au hangar (Keko : « deux slots, arme 1 et arme 2, outil 1 et
   * outil 2 ») : une case par place portée par le châssis dans la vue d'ensemble ; −1 pour une catégorie entière
   * (le châssis, les propulseurs, et tout au labo).
   */
  let place = -1
  type Case = { o: Sorte; k: number }
  const listeMontee = (o: Sorte): string[] => (o === 'arme' ? hangar.armes : o === 'outil' ? hangar.outils : [])
  /** Les cases de la vue d'ensemble, dans l'ordre : au hangar une par place (un nouveau châssis en ajoute), au labo une par catégorie. */
  const casesDuVaisseau = (): Case[] =>
    vue === 'hangar' ? ONGLETS.flatMap((o): Case[] => (o === 'outil' || o === 'arme' ? Array.from({ length: capacite(hangar, o) }, (_, k) => ({ o, k })) : [{ o, k: -1 }])) : ONGLETS.map((o) => ({ o, k: -1 }))
  /** La place ouverte, bornée à ce que porte le châssis monté (−1 hors des outils et des armes du hangar). */
  const placeOuverte = (): number => (vue === 'hangar' && (onglet === 'outil' || onglet === 'arme') ? Math.max(0, Math.min(place, capacite(hangar, onglet) - 1)) : -1)
  const titreDe = (c: Case): string => (c.k >= 0 ? `${c.o === 'arme' ? 'Arme' : 'Outil'} ${c.k + 1}` : NOMS_ONGLET[c.o])
  /**
   * L'ÉTAPE DU PARCOURS (Keko : « des étapes intermédiaires avant d'afficher tout le menu du bas ») : au hangar et au
   * labo, on ne voit qu'un niveau à la fois — LE VAISSEAU (quelle partie ?), puis LA LISTE de l'emplacement choisi
   * (laquelle ?), puis LA FICHE de la pièce (je la prends ?) ; une flèche ramène au niveau d'avant.
   */
  let etape: 'vaisseau' | 'liste' = 'vaisseau'
  /** LA VUE : le hangar (les pièces) ou L'ENTREPÔT (l'inventaire des ressources — Keko : « on en aura beaucoup à l'avenir »). */
  let vue: string = 'hangar'
  /**
   * LES VUES de la colonne : les trois vraies, puis, avec `&onglets=N` (Keko : « fais un test avec 10 onglets »), des
   * ONGLETS D'ESSAI jusqu'à N en tout — une icône, un nom, une scène vide —, pour juger la colonne quand elle se remplit.
   */
  // (et dix RÉSERVÉS de plus, numérotés — Keko : « rajoute dix placeholders pour tester »)
  const ESSAIS = ['carte', 'atelier', 'marche', 'equipage', 'missions', 'journal', 'trophees', 'radio', 'forge', ...Array.from({ length: 10 }, (_, i) => `essai-${i + 1}`)]
  const VUES: string[] = ['hangar', 'labo', 'entrepot', ...ESSAIS.slice(0, Math.max(0, Math.min(ESSAIS.length, Number(parametres.get('onglets') ?? 0) - 3)))]
  const estEssai = (vv: string): boolean => ESSAIS.includes(vv)
  const NOMS_VUE: Record<string, string> = { hangar: 'Hangar', labo: 'Labo', entrepot: 'Entrepôt', carte: 'Carte', atelier: 'Atelier', marche: 'Marché', equipage: 'Équipage', missions: 'Missions', journal: 'Journal', trophees: 'Trophées', radio: 'Radio', forge: 'Forge', ...Object.fromEntries(Array.from({ length: 10 }, (_, i) => [`essai-${i + 1}`, `Essai ${i + 1}`])) }
  /** LE BOUTON DE TEST en haut à droite (Keko : « reset toute progression ») : une première tape le fait demander « SUR ? » deux secondes, la seconde efface le hangar et le trésor de l'appareil. */
  let resetDemandeA = -10
  /**
   * LE DESSIN DU CRÉDIT, pixel par pixel (Keko, 10/11 : « plus flashy, il est un poil sombre, sur les boutons vendre on
   * ne le voit pas très bien ») : un C ÉPAIS, menthe vive — clair en haut, ombré en bas —, barré d'un fût BLANC qui
   * s'arrête à la hauteur du C (Keko), le tout CERNÉ de vert presque noir : c'est le cerne qui le détache de l'or et du
   * vert des boutons, où l'ancien trait d'un pixel se perdait.
   */
  const ENCRE_DU_CREDIT = N.hex('#04200f')
  const PIXELS_DU_CREDIT: [number, number, number][] = ['.33W33.', '33.W.33', '22.W...', '22.W...', '22.W...', '11.W.11', '.11W11.'].flatMap((ligne, j) =>
    [...ligne].flatMap((c, i): [number, number, number][] => (c === '.' ? [] : [[i - 3, j - 3, c === 'W' ? N.WHITE : c === '3' ? RUNE[3] : c === '2' ? RUNE[2] : N.hex('#2fb86a')]])),
  )
  const CERNE_DU_CREDIT: [number, number][] = (() => {
    const pris = new Set(PIXELS_DU_CREDIT.map(([dx, dy]) => `${dx},${dy}`))
    const cerne = new Set<string>()
    for (const [dx, dy] of PIXELS_DU_CREDIT) for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) if (!pris.has(`${dx + a},${dy + b}`)) cerne.add(`${dx + a},${dy + b}`)
    return [...cerne].map((k) => k.split(',').map(Number) as [number, number])
  })()
  /**
   * LE SYMBOLE DES CRÉDITS (Keko : « un C avec une barre verticale au milieu ; les deux bouts du C à droite dépassent
   * la barre, le côté gauche bien arrondi ») : le dessin ci-dessus dans son cerne, une lueur verte dessous, et un ÉCLAT
   * blanc qui le traverse en diagonale de temps en temps. UNE SEULE TAILLE, partout (Keko).
   */
  function dessinerUnCredit(p: Peintre, x0: number, y0: number): void {
    // sur des pixels entiers : posé entre deux pixels, le même glyphe ne sortait pas pareil d'un endroit à l'autre (Keko l'a vu sur le bouton Vendre)
    const x = Math.round(x0)
    const y = Math.round(y0)
    p.glow(x, y, 6, RUNE[2], 0.35)
    for (const [dx, dy] of CERNE_DU_CREDIT) p.rect(x + dx, y + dy, 1, 1, ENCRE_DU_CREDIT)
    // l'éclat : une diagonale blanche traverse le symbole de temps en temps, décalée d'un symbole à l'autre
    const u = (t * 0.4 + x * 0.013 + y * 0.021) % 1
    const eclat = u < 0.1 ? Math.round(-7 + (u / 0.1) * 14) : 99
    for (const [dx, dy, c] of PIXELS_DU_CREDIT) p.rect(x + dx, y + dy, 1, 1, Math.abs(dx + dy - eclat) <= 1 ? N.WHITE : c)
  }
  /** Annonce les sons qu'on sait venir, de la latence audio mesurée (voir `chocAnnonceA`). */
  function annoncerLesSons(): void {
    const avance = Math.min(0.25, Math.max(0, latenceMs() / 1000))
    if (avance < 0.02) return
    // LE CHOC : la première roche que le vaisseau touchera en filant droit, si c'est dans moins de la latence et que le
    // choc sera franc (la vitesse normale passe le seuil) — le son du bouclier s'il est levé, sinon celui de la coque
    if (t - chocAnnonceA > 0.4) {
      const vit = Math.hypot(v.vx, v.vy)
      if (vit > CONF.seuilChoc) {
        for (const a of asteroidesVisibles(CONF, m, v.x, v.y, vit * avance + CONF.champ.rayonMax + CONF.rayon)) {
          const ox = v.x - a.x
          const oy = v.y - a.y
          const rr = a.rayon + CONF.rayon
          const b = (ox * v.vx + oy * v.vy) / (vit * vit)
          const cc = (ox * ox + oy * oy - rr * rr) / (vit * vit)
          const disc = b * b - cc
          if (disc < 0 || cc <= 0) continue
          const tc = -b - Math.sqrt(disc)
          if (tc <= 0 || tc > avance) continue
          const nx = (ox + v.vx * tc) / rr
          const ny = (oy + v.vy * tc) / rr
          if (-(v.vx * nx + v.vy * ny) < CONF.seuilChoc) continue
          chocAnnonceA = t
          jouer(CONF.bouclier.points > 0 && m.bouclier >= 1 ? 'bouclier' : 'touche')
          break
        }
      }
    }
    // LES ARMES : le prochain coup part dans moins de la latence, et un rival est à portée
    CONF.armes.forEach((arme, i) => {
      const reste = (m.armesA[i] ?? 0) - m.t
      if (reste <= 0 || reste > avance || t - (armeAnnonceeA.get(arme.id) ?? -10) < 0.4) return
      if (!m.ennemis.some((e) => Math.hypot(e.corps.x - v.x, e.corps.y - v.y) <= arme.portee)) return
      armeAnnonceeA.set(arme.id, t)
      jouer(arme.id as Son)
    })
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
    etape = 'vaisseau'
    vueA = t
    etapeA = t
    feuille = false
    decollageA = null
    for (const e of EMPLACEMENTS) choix[e] = hangar.montees[e]
    choix.outil = hangar.outils.find((id) => id !== '') ?? 'foreuse-1'
    choix.arme = hangar.armes.find((id) => id !== '') ?? 'arme-canon'
  }
  const NUIT = N.hex('#0b0d14')
  // ================================================================ LA MATIÈRE ET LA LETTRE DE LA BASE
  /**
   * LES PLAQUES (Keko, 10/11 : « perfectionne au maximum… les éléments d'UI, leur texture ») : chaque élément est une
   * plaque de métal à BISEAU d'un pixel — la lumière en haut à gauche, l'ombre en bas à droite (c'est le biseau qui dit
   * l'état, en pixel art) ; ENFONCÉE, le biseau s'inverse et le contenu descend d'un pixel ; ÉTEINTE, elle perd son
   * biseau et se désature. Le corps est en deux tons, la frontière tramée, et un GRAIN de métal brossé (quelques pixels
   * semés, toujours les mêmes) ; l'OR a sa ligne spéculaire et son reflet qui passe. Les teintes glissent : les ombres
   * vers le violet et le brun, les lumières vers le chaud. Aucun noir pur : le contour est l'encre la plus sombre.
   */
  type Matiere = 'encre' | 'or' | 'creux' | 'eteint' | 'acier' | 'vert'
  type Teintes = { contour: number; ombre: number; corps: number; haut: number; lumiere: number; lumiere2: number; grain: number; spec?: number }
  const MATIERES: Record<Matiere, Teintes> = {
    encre: { contour: N.hex('#07050d'), ombre: N.hex('#110d1a'), corps: N.hex('#1b1626'), haut: N.hex('#231d31'), lumiere: N.hex('#463b61'), lumiere2: N.hex('#342b4a'), grain: N.hex('#2a2339') },
    or: { contour: N.hex('#2a1404'), ombre: N.hex('#8a4a0c'), corps: N.hex('#c98416'), haut: N.hex('#e3a628'), lumiere: N.hex('#ffe58a'), lumiere2: N.hex('#f6c94a'), grain: N.hex('#d8961e'), spec: N.hex('#fff7d6') },
    creux: { contour: N.hex('#07050d'), ombre: N.hex('#0a0811'), corps: N.hex('#110d19'), haut: N.hex('#0e0b16'), lumiere: N.hex('#2c2440'), lumiere2: N.hex('#211b30'), grain: N.hex('#161221') },
    eteint: { contour: N.hex('#0b0a10'), ombre: N.hex('#15131b'), corps: N.hex('#1a1820'), haut: N.hex('#1d1b24'), lumiere: N.hex('#1d1b24'), lumiere2: N.hex('#1d1b24'), grain: N.hex('#1f1d27') },
    acier: { contour: N.hex('#07070d'), ombre: N.hex('#121624'), corps: N.hex('#1c2236'), haut: N.hex('#232b42'), lumiere: N.hex('#4a5a80'), lumiere2: N.hex('#36425f'), grain: N.hex('#283149') },
    vert: { contour: N.hex('#03110a'), ombre: N.hex('#0a2a1a'), corps: N.hex('#0f3a25'), haut: N.hex('#14492f'), lumiere: N.hex('#4ee08a'), lumiere2: N.hex('#2a9a5c'), grain: N.hex('#165236') },
  }
  /** Un petit hachage de position, pour le grain (toujours le même au même pixel). */
  const grainA = (x: number, y: number): number => {
    let h = (x * 374761393 + y * 668265263) | 0
    h = (h ^ (h >>> 13)) * 1274126177
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296
  }
  type EtatPlaque = { enfonce?: boolean; survole?: boolean; flash?: boolean; reflet?: number | null; bord?: number }
  /**
   * UNE PLAQUE à (x, y), w × h, coins coupés d'un pixel. `reflet` : la position du reflet diagonal qui la balaie (null :
   * aucun) ; `bord` : une couleur de liseré qui remplace la lumière du biseau (une sélection, un compteur allumé).
   */
  function plaque(p: Peintre, x0: number, y0: number, w: number, h: number, m: Matiere, e: EtatPlaque = {}): void {
    if (w < 4 || h < 4) return
    const x = Math.round(x0)
    const y = Math.round(y0)
    const T = MATIERES[m]
    const enf = e.enfonce === true
    const plat = m === 'eteint'
    // le contour, coins coupés
    p.rect(x + 2, y, w - 4, 1, T.contour)
    p.rect(x + 2, y + h - 1, w - 4, 1, T.contour)
    p.rect(x, y + 2, 1, h - 4, T.contour)
    p.rect(x + w - 1, y + 2, 1, h - 4, T.contour)
    p.rect(x + 1, y + 1, 1, 1, T.contour)
    p.rect(x + w - 2, y + 1, 1, 1, T.contour)
    p.rect(x + 1, y + h - 2, 1, 1, T.contour)
    p.rect(x + w - 2, y + h - 2, 1, 1, T.contour)
    // le corps : le haut plus clair, la frontière tramée ; enfoncée, tout descend d'un ton
    const haut = enf ? T.corps : T.haut
    const corps = enf ? T.ombre : T.corps
    const mi = y + 1 + Math.floor((h - 2) * 0.48)
    p.rect(x + 2, y + 1, w - 4, 1, haut)
    p.rect(x + 1, y + 2, w - 2, mi - y - 2, haut)
    p.rect(x + 1, mi, w - 2, y + h - 2 - mi, corps)
    p.rect(x + 2, y + h - 2, w - 4, 1, corps)
    for (let px = x + 1; px < x + w - 1; px++) if ((px + mi) % 2 === 0) p.rect(px, mi, 1, 1, haut)
    // le grain du métal brossé : de courts traits clairs, semés
    if (!plat) {
      for (let py = y + 2; py < y + h - 2; py++) {
        for (let px = x + 2; px < x + w - 3; px++) {
          const g = grainA(px, py)
          if (g < 0.035) p.rect(px, py, g < 0.012 ? 2 : 1, 1, T.grain)
        }
      }
    }
    // la ligne spéculaire de l'or, à un tiers de la hauteur
    if (m === 'or' && !enf && h >= 9) p.rect(x + 3, y + 2 + Math.floor((h - 4) * 0.28), w - 6, 1, T.lumiere2)
    // le biseau : la lumière en haut et à gauche, l'ombre en bas et à droite ; inversé quand on enfonce
    if (!plat) {
      const lum = e.bord ?? (e.survole ? T.spec ?? T.lumiere : T.lumiere)
      const lum2 = e.bord ?? (e.survole ? T.lumiere : T.lumiere2)
      const sombre = T.ombre
      if (!enf) {
        p.rect(x + 2, y + 1, w - 4, 1, lum)
        p.rect(x + 1, y + 2, 1, h - 4, lum2)
        p.rect(x + 2, y + h - 2, w - 4, 1, sombre)
        p.rect(x + w - 2, y + 2, 1, h - 4, sombre)
      } else {
        p.rect(x + 2, y + 1, w - 4, 1, sombre)
        p.rect(x + 1, y + 2, 1, h - 4, sombre)
        p.rect(x + 2, y + h - 2, w - 4, 1, lum2)
        p.rect(x + w - 2, y + 2, 1, h - 4, lum2)
      }
    }
    // le reflet qui balaie : une diagonale blanche et ses deux franges
    if (e.reflet !== null && e.reflet !== undefined) {
      const spec = T.spec ?? T.lumiere
      for (let py = y + 1; py < y + h - 1; py++) {
        const cxr = Math.round(e.reflet - (py - y) * 0.6)
        for (let k = -2; k <= 2; k++) {
          const px = cxr + k
          if (px <= x || px >= x + w - 1) continue
          p.rect(px, py, 1, 1, Math.abs(k) <= 0 ? spec : T.lumiere, Math.abs(k) <= 1 ? 1 : 0.5)
        }
      }
    }
    // le flash : tout le liseré blanc, un instant
    if (e.flash) {
      p.rect(x + 2, y, w - 4, 1, N.WHITE)
      p.rect(x + 2, y + h - 1, w - 4, 1, N.WHITE)
      p.rect(x, y + 2, 1, h - 4, N.WHITE)
      p.rect(x + w - 1, y + 2, 1, h - 4, N.WHITE)
    }
  }
  /** L'ombre portée d'une plaque, un pixel dessous (elle disparaît quand on l'enfonce). */
  const ombrePortee = (p: Peintre, x: number, y: number, w: number, h: number): void => p.rect(Math.round(x) + 2, Math.round(y) + h, w - 4, 1, NUIT_OMBRE)

  /**
   * LA LETTRE (Keko : « perfectionne… les polices ») : NOTRE police (`police.ts`), avec ses minuscules et ses accents,
   * en trois voix — TITRE (la graisse agrandie par Scale2x : le nom de la vue, l'action principale), GRAS (les titres
   * de niveau, les noms, les nombres qui comptent) et le TEXTE ; les étiquettes en petites capitales (`mini`). Le y donné
   * est le haut des capitales.
   */
  const TEXTE = 'keko'
  const GRAS = 'keko-gras'
  const TITRE = 'keko-titre'
  const ENTETE = 'keko-entete'
  type Police = typeof TEXTE | typeof GRAS | typeof TITRE | typeof ENTETE
  const decalage = (f: Police): number => (f === TITRE ? HAUT_ACCENTS * 2 : HAUT_ACCENTS)
  function ecrire(p: Peintre, s: string, x: number, y: number, c: number, o: { police?: Police; align?: 'center' | 'right'; ombre?: number; contour?: number } = {}): void {
    const f = o.police ?? TEXTE
    p.text(s, Math.round(x), Math.round(y) - decalage(f), c, { font: f, align: o.align, shadow: o.ombre, outline: o.contour })
  }
  const largeurDe = (s: string, f: Police = TEXTE): number => textWidth(s, f)
  /**
   * UN MOT EN RELIEF (la lettre des effets ui/ du dépôt, `drawWord` : un dégradé, un haut lit, un dessous ombré, un
   * contour), centré sur x ; en or ou en acier ; `reflet` fait passer l'éclat diagonal du dépôt sur le mot.
   */
  function motEnRelief(p: Peintre, s: string, x: number, y: number, or: boolean, f: Police = GRAS, reflet: number | null = null, echelle = 1): void {
    const mot = spell(s, f) as { letters: { g: unknown; x: number }[]; w: number }
    const e = echelle
    const items = mot.letters.filter((L) => L.g).map((L) => ({ g: L.g, x: Math.round(x - (mot.w * e) / 2) + L.x * e, y: Math.round(y) - decalage(f) * e, sx: e, sy: e }))
    const st = or
      ? { fill: [N.hex('#a8650f'), PEPITE[2], N.hex('#ffe68a')], edge: N.hex('#fff7d6'), under: N.hex('#6b3a0c'), outline: N.hex('#1e0e03'), shadow: 0 }
      : { fill: [COQUE[3], COQUE[4], COQUE[5]], edge: COQUE[6], under: COQUE[2], outline: N.hex('#07050d'), shadow: 0 }
    drawWord(p, items, reflet === null ? st : { ...st, shine: Math.round(x - (mot.w * e) / 2) + reflet })
  }
  /** Un texte replié à `largeur`, ligne par ligne, dans sa police (les petites capitales passent sans accents). */
  function replier(s: string, largeur: number, f: Police | 'mini' = TEXTE): string[] {
    const src = f === 'mini' ? texteNu(s) : s
    const lignes: string[] = []
    let l = ''
    for (const mot of src.split(' ')) {
      const essai = l === '' ? mot : `${l} ${mot}`
      if (l === '' || textWidth(essai, f) <= largeur) l = essai
      else {
        lignes.push(l)
        l = mot
      }
    }
    if (l !== '') lignes.push(l)
    return lignes
  }
  /** Le symbole des crédits suivi d'un nombre, en gras, calé à droite sur x (ou centré). */
  function nombreDeCredits(p: Peintre, n: number, x: number, y: number, c: number, centre = false): void {
    const w = largeurDe(String(n), GRAS)
    const x0 = centre ? x - (w + 12) / 2 : x - w - 12
    ecrire(p, String(n), x0, y, c, { police: GRAS })
    dessinerUnCredit(p, x0 + w + 7, y + 3)
  }
  // ================================================================ LE GESTE : l'appui, le relâché, le survol, le refus
  /**
   * LE RETOUR DU GESTE, en couches (un retour qui compte en empile plusieurs — son, mouvement, lumière) : la zone
   * touchée S'ENFONCE (biseau inversé, contenu un pixel plus bas) puis REMONTE avec un liseré blanc d'un instant ; le
   * survol de la souris éclaire le biseau et fait passer le reflet ; un bouton ÉTEINT qu'on touche quand même TREMBLE
   * et bourdonne, et le compteur avec lui.
   */
  let enfonce: { x: number; y: number; t0: number } | null = null
  let survol: Vecteur | null = null
  let refus: { x: number; y: number; t0: number } | null = null
  const memeCoin = (a: { x: number; y: number } | null, x: number, y: number): boolean => a !== null && Math.abs(a.x - x) < 0.5 && Math.abs(a.y - y) < 0.5
  type EtatDuBouton = { dx: number; dy: number; enfonce: boolean; flash: boolean; survole: boolean }
  function etatDuBouton(x: number, y: number, w: number, h: number): EtatDuBouton {
    const age = enfonce !== null && memeCoin(enfonce, x, y) ? t - enfonce.t0 : 99
    const r = refus
    const tremble = r !== null && memeCoin(r, x, y) && t - r.t0 < 0.3 ? Math.round(Math.sin((t - r.t0) * 70) * 2 * (1 - (t - r.t0) / 0.3)) : 0
    const survole = survol !== null && survol.x >= x && survol.x < x + w && survol.y >= y && survol.y < y + h
    return { dx: tremble, dy: age < 0.1 ? 1 : 0, enfonce: age < 0.1, flash: age >= 0.1 && age < 0.17, survole }
  }
  /** Une zone touchable, avec le son qu'elle fait (null : aucun ; par défaut, le clic). */
  function zone(x: number, y: number, w: number, h: number, action: () => void, son: Son | null = 'clic'): void {
    zones.push({ x, y, w, h, action, son })
  }
  function zoneDeRefus(x: number, y: number, w: number, h: number): void {
    zones.push({ x, y, w, h, action: () => (refus = { x, y, t0: t }), son: 'refus' })
  }
  /** Le reflet d'une plaque survolée : il la traverse en boucle, vite. */
  const refletDeSurvol = (x: number, w: number, survole: boolean): number | null => (survole ? x - 10 + ((t * 1.6) % 1.2) * (w + 30) : null)
  /**
   * UN BOUTON DE LA BASE, le même partout : sa plaque (l'or s'il est vif, éteinte sinon — ou une autre matière), son
   * ombre portée, son état ; `dessin` peint son contenu au décalage donné.
   */
  function boutonBase(p: Peintre, x: number, y: number, w: number, h: number, vif: boolean, action: () => void, dessin: (dx: number, dy: number) => void, son: Son | null = 'clic', o: { matiere?: Matiere; reflet?: number | null } = {}): void {
    const e = etatDuBouton(x, y, w, h)
    const m: Matiere = vif ? (o.matiere ?? 'or') : 'eteint'
    if (!e.enfonce) ombrePortee(p, x + e.dx, y, w, h)
    plaque(p, x + e.dx, y + e.dy, w, h, m, { enfonce: e.enfonce, survole: e.survole && vif, flash: e.flash, reflet: o.reflet ?? (vif ? refletDeSurvol(x, w, e.survole) : null) })
    dessin(e.dx, e.dy)
    if (vif) zone(x, y, w, h + 1, action, son)
    else zoneDeRefus(x, y, w, h)
  }
  /** Un bouton à un mot, en relief. */
  function bouton(p: Peintre, x: number, y: number, w: number, h: number, mot: string, vif: boolean, action: () => void, son: Son | null = 'clic', matiere: Matiere = 'or'): void {
    boutonBase(p, x, y, w, h, vif, action, (dx, dy) => {
      if (vif && matiere === 'or') motEnRelief(p, mot, x + w / 2 + dx, y + dy + Math.floor((h - 7) / 2), true)
      else ecrire(p, mot, x + w / 2 + dx, y + dy + Math.floor((h - 7) / 2), vif ? COQUE[6] : COQUE[3], { align: 'center', police: GRAS })
    }, son, { matiere })
  }
  /** La hauteur des en-têtes. */
  const HT = 23
  /**
   * L'EN-TÊTE D'UN NIVEAU (la liste d'une place) : le RETOUR, un carré d'or au chevron épais et ombré, puis le titre
   * du niveau sur une plaque d'acier, dans la taille INTERMÉDIAIRE (la graisse : la grande lettre est au nom de la vue,
   * Keko : « la même police que tout en haut brise la hiérarchie ») mais LISIBLE — un aplat crème cerné de sombre, les
   * lettres écartées, au lieu du relief d'or dont le dégradé noyait sept pixels de haut ; deux petites pointes d'or
   * encadrent le titre.
   */
  function enTete(p: Peintre, y: number, mot: string, retour: () => void): void {
    boutonBase(p, 4, y, HT, HT, true, retour, (dx, dy) => {
      const cx = 4 + HT / 2 - 1 + dx
      const cy = y + Math.floor(HT / 2) + dy
      for (const [o, c] of [[1, N.hex('#6b3a0c')], [0, N.hex('#fff7d6')]] as const) {
        for (let e = 0; e < 3; e++) {
          p.line(cx + 3 + e, cy - 5 + o, cx - 2 + e, cy + o, c)
          p.line(cx - 2 + e, cy + o, cx + 3 + e, cy + 5 + o, c)
        }
      }
    }, 'retour')
    const x = 6 + HT
    const w = W - 10 - HT
    plaque(p, x, y, w, HT, 'acier')
    const lm = largeurDe(mot, ENTETE)
    const cx = x + w / 2
    ecrire(p, mot, cx, y + 8, N.hex('#fff3cf'), { police: ENTETE, align: 'center', contour: MATIERES.acier.contour })
    for (const s of [-1, 1]) {
      const px = Math.round(cx + s * (lm / 2 + 7))
      p.rect(px - 1, y + 11, 3, 1, PEPITE[1])
      p.rect(px, y + 10, 1, 3, PEPITE[2])
    }
  }
  // ================================================================ LA BASE, EN QUATRE ÉTAGES
  /**
   * L'INTERFACE DE LA BASE (Keko, 10/11 : « une organisation hiérarchique épurée, claire et ergonomique », puis
   * « perfectionne au maximum le gamefeel et le juice ») — quatre étages, du plus général au plus précis : LA BARRE DU
   * HAUT (la vue, en titre ; les crédits), LA SCÈNE (le vaisseau sur son aire, sous les lampes ; la planche du labo ;
   * l'inventaire), LE CONTENU (un niveau à la fois) et LA BARRE DES ONGLETS EN BAS, sous le pouce.
   */
  const HAUT_BARRE = 28
  const HAUT_NAV = 34
  const Y_SCENE = HAUT_BARRE
  /** La scène a UNE HAUTEUR FIXE pour un écran donné (Keko) : ce que laissent les deux barres et le plus haut des contenus. */
  const hauteurDeScene = (): number => Math.max(64, Math.min(168, H - HAUT_BARRE - HAUT_NAV - 222))
  let hautScene = 150
  let tBase = 0
  let dtBase = 1 / 60
  const ressort = (v: number, cible: number, raideur = 14): number => v + (cible - v) * Math.min(1, dtBase * raideur)
  const sortie = (u: number): number => 1 - Math.pow(1 - Math.max(0, Math.min(1, u)), 3)
  /** Un ressort qui DÉPASSE puis revient (l'onglet qui se lève, rebondit) : sa position et sa vitesse. */
  const ressorts: Record<string, { x: number; v: number }> = {}
  function rebond(cle: string, cible: number): number {
    const r = (ressorts[cle] ??= { x: cible, v: 0 })
    const pas = Math.min(dtBase, 1 / 30)
    r.v += ((cible - r.x) * 260 - r.v * 16) * pas
    r.x += r.v * pas
    return r.x
  }
  /** Les instants des gestes qui animent : la vue, le niveau, l'équipement, la feuille, le décollage. */
  let vueA = -10
  let etapeA = -10
  let equipeA = -10
  let feuille = false
  let feuilleA = -10
  let decollageA: number | null = null
  /** LA SECOUSSE de l'écran (un achat, un décollage) : sa force et son départ. */
  let secousseBaseA = -10
  let secousseBase = 0
  const secouer = (f: number): void => {
    secousseBaseA = t
    secousseBase = f
  }
  /** Le décalage de l'écran secoué, en pixels CSS (un pixel du tampon vaut `zoom`). */
  function transformDeLaBase(): string {
    const u = (t - secousseBaseA) / 0.22
    if (u >= 1) return ''
    const a = secousseBase * (1 - u) * zoom
    return `translate(${Math.round(Math.sin(t * 90) * a)}px, ${Math.round(Math.cos(t * 77) * a)}px)`
  }
  /** LE COMPTEUR DE CRÉDITS ROULE jusqu'au vrai compte et s'allume quand il change ; chaque écart monte en nombre flottant. */
  let creditsVus = credits
  let creditsConnus = credits
  let creditsA = -10
  let compteurX = W - 28
  const flottants: { texte: string; x: number; y: number; t0: number; c: number }[] = []
  /** Les étincelles (et les fumées) de l'interface, en pixels d'écran ; les pièces qui volent au compteur ; les pièces achetées qui volent jusqu'au hangar. */
  const eclats: { x: number; y: number; vx: number; vy: number; t0: number; vie: number; c: number; fumee?: boolean }[] = []
  const volantes: { x0: number; y0: number; t0: number }[] = []
  const envolsDePiece: { pc: Piece; x0: number; y0: number; t0: number }[] = []
  /** Les onglets qui ont du nouveau (une pièce achetée au labo attend au hangar) : une pastille, jusqu'à la visite. */
  const nouveautes = new Set<string>()
  const pulsations: Record<string, number> = {}
  let repereX = -1
  const NUIT_BARRE = N.hex('#0f0c17')
  const NUIT_OMBRE = N.hex('#040308')
  const CHAUD = N.hex('#ffd29a')
  function gerbe(x: number, y: number, n: number, couleurs: number[], force = 60): void {
    for (let i = 0; i < n; i++) {
      const a = R.next() * Math.PI * 2
      const v = force * (0.4 + 0.6 * R.next())
      eclats.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 25, t0: t, vie: 0.3 + 0.35 * R.next(), c: couleurs[i % couleurs.length] })
    }
  }
  function allerA(vv: string): void {
    feuille = false
    nouveautes.delete(vv)
    if (vv === vue) return
    vue = vv
    etape = 'vaisseau'
    vueA = t
    etapeA = t
  }
  function changerDEtape(e: 'vaisseau' | 'liste'): void {
    etape = e
    etapeA = t
  }
  function basculerLaFeuille(): void {
    feuille = !feuille
    feuilleA = t
    defilOnglets = 0
  }

  /** LA BASE ENTIÈRE, une image. */
  function dessinerLaBase(p: Peintre): void {
    zones = []
    p.place(0, 0)
    dtBase = Math.min(0.05, Math.max(0, t - tBase))
    tBase = t
    hautScene = hauteurDeScene()
    p.rect(0, 0, W, H, NUIT)
    if (credits !== creditsConnus) {
      const d = credits - creditsConnus
      flottants.push({ texte: `${d > 0 ? '+' : ''}${d}`, x: compteurX, y: HAUT_BARRE + 3, t0: t, c: d > 0 ? RUNE[3] : PEPITE[3] })
      creditsConnus = credits
      creditsA = t
    }
    creditsVus = Math.abs(credits - creditsVus) < 0.5 ? credits : ressort(creditsVus, credits, 8)
    dessinerLaScene(p)
    dessinerLeContenu(p)
    dessinerLaBarreDuHaut(p)
    dessinerLaNav(p)
    dessinerLaFeuille(p)
    dessinerLesEclats(p)
  }

  /**
   * LA SCÈNE, sur toute la largeur, SOUS LES LAMPES : deux cônes de lumière chaude tombent sur l'aire, des poussières y
   * flottent, le sol de plaques a son biseau, les bords s'assombrissent en trame (une vignette) ; elle se dévoile en
   * fondu tramé quand on change de vue.
   */
  function dessinerLaScene(p: Peintre): void {
    const y0 = Y_SCENE
    const y1 = y0 + hautScene
    const cx = W / 2
    const cy = y1 - Math.min(62, Math.floor(hautScene / 2) + 10)
    if (vue === 'hangar') {
      // le sol : des plaques d'acier, chacune son biseau (le haut et la gauche clairs, le bas et la droite sombres) et ses rivets
      p.rect(0, y0, W, hautScene, N.hex('#141a2b'))
      for (let gx = -18; gx < W; gx += 24) {
        for (let gy = y0 - 20; gy < y1; gy += 24) {
          p.rect(gx, gy, 24, 1, N.hex('#1f2840'))
          p.rect(gx, gy, 1, 24, N.hex('#1b2338'))
          p.rect(gx, gy + 23, 24, 1, N.hex('#0b0f1a'))
          p.rect(gx + 23, gy, 1, 24, N.hex('#0d111c'))
          for (const [rx, ry] of [[3, 3], [20, 3], [3, 20], [20, 20]]) {
            p.rect(gx + rx, gy + ry, 1, 1, N.hex('#2c3654'))
            p.rect(gx + rx + 1, gy + ry + 1, 1, 1, N.hex('#0b0f1a'))
          }
        }
      }
      // les bandes de sécurité au pied de l'aire : des chevrons jaunes et noirs, usés
      const yb = Math.min(y1 - 3, cy + 46)
      for (let x = 0; x < W; x++) {
        const jaune = Math.floor((x + (yb % 2)) / 4) % 2 === 0
        if (grainA(x, 7) < 0.15) continue
        p.rect(x, yb, 1, 2, jaune ? N.hex('#8a6a14') : N.hex('#15131a'))
      }
    } else if (vue === 'labo') {
      const PLAN = N.hex('#0a1626')
      p.rect(0, y0, W, hautScene, PLAN)
      for (let x = 6; x < W; x += 12) p.line(x, y0, x, y1 - 1, N.hex('#0e1f34'))
      for (let y = y0 + 6; y < y1; y += 12) p.line(0, y, W - 1, y, N.hex('#0e1f34'))
      for (let x = 6; x < W; x += 48) p.line(x, y0, x, y1 - 1, N.hex('#13294a'))
      // un trait de balayage qui descend la planche, comme un scanner
      const ys = y0 + Math.floor(((t * 22) % (hautScene + 20)) - 10)
      if (ys > y0 && ys < y1) {
        p.rect(0, ys, W, 1, N.hex('#1d4a7a'))
        p.glowLine(0, ys, W, ys, 3, N.hex('#3a8ad0'), 0.15)
      }
      ecrire(p, 'Arbre des recherches : bientôt', cx, y0 + Math.floor(hautScene / 2) - 4, N.hex('#2c5a8a'), { align: 'center' })
    } else if (vue === 'entrepot') {
      p.rect(0, y0, W, hautScene, N.hex('#111b17'))
      for (let i = 0; i < 110; i++) {
        const mx = Math.floor(tire(i, 1, 77) * W)
        const my = y0 + Math.floor(tire(i, 2, 77) * hautScene)
        p.rect(mx, my, tire(i, 4, 77) < 0.3 ? 2 : 1, 1, tire(i, 3, 77) < 0.5 ? N.hex('#0b120f') : N.hex('#18251f'))
      }
    } else {
      p.rect(0, y0, W, hautScene, N.hex('#0e0c16'))
      ecrire(p, 'Bientôt', cx, y0 + Math.floor(hautScene / 2) - 4, COQUE[2], { align: 'center', police: GRAS })
    }
    // LES LAMPES : un boîtier, son halo, et son cône de lumière qui tombe vers le milieu
    for (const lx of [10, W - 11]) {
      p.glowLine(lx, y0 + 3, lx + (cx - lx) * 0.55, cy + 10, 12, CHAUD, vue === 'hangar' ? 0.07 : 0.035)
      p.glow(lx, y0 + 5, 30, CHAUD, 0.35)
      p.rect(lx - 4, y0, 8, 3, COQUE[1])
      p.rect(lx - 4, y0, 8, 1, COQUE[2])
      p.rect(lx - 3, y0 + 3, 6, 1, N.hex('#fff2c8'))
    }
    if (vue === 'hangar') {
      // la flaque de lumière sur l'aire, et les poussières qui flottent dans les cônes
      p.glow(cx, cy + 4, 64, CHAUD, 0.1)
      for (let i = 0; i < 16; i++) {
        const u = (tire(i, 5, 31) + t * (0.03 + 0.03 * tire(i, 6, 31))) % 1
        const px = Math.round(cx + Math.sin(i * 2.1 + t * 0.4) * (14 + 40 * tire(i, 7, 31)))
        const py = Math.round(y1 - 8 - u * (hautScene - 12))
        if (Math.sin(t * 2 + i) > -0.2) p.rect(px, py, 1, 1, i % 3 === 0 ? N.hex('#fff0c8') : N.hex('#8a7a60'), 0.8)
      }
      dessinerLeHangarEnScene(p, cx, cy, y0, y1)
    } else if (vue === 'entrepot') dessinerLInventaire(p, y0)
    // LA VIGNETTE : les bords s'assombrissent, en trame de plus en plus serrée
    for (let k = 0; k < 4; k++) {
      const a = 0.55 - k * 0.13
      p.rect(0, y0 + k, W, 1, NUIT, a)
      p.rect(0, y1 - 1 - k, W, 1, NUIT, a)
      p.rect(k, y0, 1, hautScene, NUIT, a)
      p.rect(W - 1 - k, y0, 1, hautScene, NUIT, a)
    }
    const u = (t - vueA) / 0.25
    if (u < 1) p.rect(0, y0, W, hautScene, NUIT, 1 - sortie(u))
    p.rect(0, y1, W, 1, MATIERES.encre.lumiere2)
    p.rect(0, y1 + 1, W, 1, NUIT_OMBRE)
  }

  /** L'échelle du vaisseau dans le hangar : 2,5 pixels l'unité (il fait une quarantaine de pixels). */
  const ECHELLE = 2.5
  /**
   * Le hangar dans la scène : l'aire et ses feux ; LE VAISSEAU, rendu pixel par pixel (`rendu-vaisseau.ts`), EN VOL
   * STATIONNAIRE (il respire d'un pixel, son ombre sous lui s'élargit et se resserre), ses feux de position qui battent,
   * la lueur de sa tuyère au ralenti ; son décollage ; son poids en étiquette ; les zones de ses pièces.
   */
  function dessinerLeHangarEnScene(p: Peintre, cx: number, cy: number, y0: number, y1: number): void {
    let sy = cy - 2 + Math.round(Math.sin(t * 1.7) * 1.2)
    let flam = 0
    let jit = 0
    if (decollageA !== null) {
      const u = Math.min(1, (t - decollageA) / 0.95)
      flam = Math.min(1, 0.2 + u * 4)
      jit = u < 0.35 ? Math.round((R.next() - 0.5) * 2) : 0
      sy = cy - 2 - Math.round(Math.pow(Math.max(0, u - 0.28) / 0.72, 2.2) * (cy - y0 + 50))
      if (R.next() < 0.85) eclats.push({ x: cx + (R.next() - 0.5) * 5, y: sy + 26, vx: (R.next() - 0.5) * 30, vy: 40 + R.next() * 50, t0: t, vie: 0.3 + 0.3 * R.next(), c: FEU[3 + Math.floor(R.next() * 4)] })
      if (u < 0.5 && R.next() < 0.5) eclats.push({ x: cx + (R.next() - 0.5) * 30, y: cy + 14, vx: (R.next() - 0.5) * 70, vy: -5 - R.next() * 10, t0: t, vie: 0.7 + 0.4 * R.next(), c: N.hex('#4a4a58'), fumee: true })
      if (u >= 1) {
        decollageA = null
        demarrer()
      }
    }
    // l'aire : un socle d'acier biseauté, l'anneau de chevrons, le disque, un cercle et une croix de guidage, huit feux
    const R0 = 32
    p.circle(cx, cy, R0 + 4, N.hex('#07090f'))
    p.circle(cx, cy, R0 + 3, N.hex('#262c3c'))
    p.arc(cx, cy, R0 + 3, 1, Math.PI * 0.9, Math.PI * 1.6, N.hex('#3e4760'))
    p.circle(cx, cy, R0, N.hex('#272a33'))
    p.ring(cx, cy, R0 - 1, 3, (_v: number, ang: number) => (Math.floor((ang / Math.PI) * 8 + 16) % 2 === 0 ? N.hex('#c08a14') : N.hex('#15131a')))
    p.ring(cx, cy, R0 - 4, 1, N.hex('#1a1c24'))
    p.ring(cx, cy, R0 - 10, 1, N.hex('#363a48'))
    p.line(cx - R0 + 12, cy, cx + R0 - 12, cy, N.hex('#363a48'))
    p.line(cx, cy - R0 + 12, cx, cy + R0 - 12, N.hex('#363a48'))
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2
      const allume = decollageA !== null || (Math.floor(t * 4) + i) % 8 < 3
      const fx = Math.round(cx + Math.cos(a) * (R0 + 7))
      const fy = Math.round(cy + Math.sin(a) * (R0 + 7))
      p.rect(fx - 1, fy - 1, 3, 3, N.hex('#0b0a10'))
      p.rect(fx, fy, 1, 1, allume ? N.hex('#fff2a8') : N.hex('#5a3a08'))
      if (allume) p.glow(fx, fy, 6, PEPITE[2], 0.55)
    }
    // l'onde d'une pièce équipée
    const ue = (t - equipeA) / 0.5
    if (ue < 1) {
      p.ring(cx, cy, 10 + ue * 30, 2, ue < 0.25 ? N.WHITE : PEPITE[3], 1 - ue)
      p.glow(cx, cy, 40 * (1 - ue), PEPITE[2], 0.4 * (1 - ue))
    }
    // l'ombre du vaisseau sur l'aire, décalée à l'opposé des lampes ; elle suit sa respiration
    const al = allureMontee(monteeA(hangar, 'coque').bouclier ? 1 : 0)
    const haut = cy - sy
    if (haut < 60) {
      const k = Math.max(0.4, 1 - haut / 60)
      p.poly(ovale(cx + 3, cy + 5, 13 * k, 19 * k, 18).map(([x, y]) => [x, y]), N.hex('#15161d'), 0.85 * k)
    }
    // la tuyère au ralenti, puis le vaisseau
    const nozzle: [number, number] = [cx + jit, sy + 8.6 * ECHELLE]
    p.glow(nozzle[0], nozzle[1], 8 + 14 * flam, al.propulseur >= 3 ? ION[4] : FEU[5], 0.35 + 0.5 * flam + 0.08 * Math.sin(t * 9))
    const formes = formesDuVaisseau(al, flam, t)
    peindreFormes(p, formes, cx + jit, sy, ECHELLE, { blanc: t - equipeA < 0.08 ? 1 : 0 })
    // la verrière qui luit, les feux de position qui battent
    p.glow(cx + jit, sy - 3.4 * ECHELLE, 7, VERRIERE[2], 0.25)
    const bat = Math.floor(t * 1.5) % 2 === 0
    for (const [s, c] of [[-1, N.hex('#ff4a4a')], [1, N.hex('#4aff7a')]] as const) {
      const fx = Math.round(cx + jit + s * 8.4 * ECHELLE)
      const fy = Math.round(sy + 7.8 * ECHELLE)
      if (bat) {
        p.rect(fx, fy, 1, 1, N.WHITE)
        p.glow(fx, fy, 6, c, 0.7)
      }
    }
    if (al.bouclier > 0) p.ring(cx + jit, sy, 11 * ECHELLE, 1, VERRIERE[2], 0.3 + 0.25 * Math.sin(t * 3))
    p.place(0, 0)
    // LE POIDS, en étiquette dans le coin — écrit COMME LA LIGNE « Poids » D'UNE FICHE (Keko : « la différence de
    // police et de taille entre le mot et le chiffre casse la cohérence ») : le mot dans la lettre courante, le nombre
    // en gras crème, la même hauteur, la même ligne de pied
    const poids = `${poidsTotal(hangar)} T`
    const wm = largeurDe('Poids')
    const wv = largeurDe(poids, GRAS)
    plaque(p, 6, y1 - 20, wm + wv + 15, 15, 'encre')
    ecrire(p, 'Poids', 11, y1 - 16, COQUE[4])
    ecrire(p, poids, 11 + wm + 5, y1 - 16, N.hex('#fff2c8'), { police: GRAS })
    // LES ZONES DU VAISSEAU (une cible verte, les angles seulement, autour de la place ouverte)
    const zonesDe = (o: Sorte): [number, number, number, number][] => (o === 'propulseur' ? [[-10.5, -3.2, -6, 3.2]] : o === 'coque' ? [[-8.2, -9, 9.8, 9]] : o === 'outil' ? [[-6.5, -3.5, 4, 3.5]] : Array.from({ length: capacite(hangar, 'arme') }, (_, i): [number, number, number, number] => [-8.2, (i === 0 ? -1 : 1) * 8.8, 2.4, (i === 0 ? -1 : 1) * 4.2]))
    const cibles: Sorte[] = etape === 'vaisseau' ? ['propulseur', 'outil', 'arme', 'coque'] : [onglet]
    const vif = Math.sin(t * 5) > -0.3
    if (decollageA === null) for (const o of cibles) for (const [i, [x0, yy0, x1, yy1]] of zonesDe(o).entries()) {
      if (etape !== 'vaisseau' && o === 'arme' && i !== placeOuverte()) continue
      const sx0 = Math.round(cx + Math.min(yy0, yy1) * ECHELLE)
      const sx1 = Math.round(cx + Math.max(yy0, yy1) * ECHELLE)
      const sy0 = Math.round(sy - Math.max(x0, x1) * ECHELLE)
      const sy1 = Math.round(sy - Math.min(x0, x1) * ECHELLE)
      if (etape !== 'vaisseau') {
        const L = Math.max(2, Math.min(5, Math.floor((sx1 - sx0) / 3), Math.floor((sy1 - sy0) / 3)))
        const c = vif ? RUNE[3] : RUNE[2]
        const s = Math.round((1 - sortie((t - etapeA) / 0.25)) * 7)
        for (const [x, y, dx, dy] of [[sx0 - s, sy0 - s, 1, 1], [sx1 + s, sy0 - s, -1, 1], [sx0 - s, sy1 + s, 1, -1], [sx1 + s, sy1 + s, -1, -1]]) {
          p.line(x, y, x + dx * L, y, c)
          p.line(x, y, x, y + dy * L, c)
          p.rect(x, y, 1, 1, N.WHITE)
        }
      } else zone(sx0 - 2, sy0 - 2, sx1 - sx0 + 4, sy1 - sy0 + 4, () => ouvrirLEmplacement(o, o === 'arme' ? i : o === 'outil' ? 0 : -1))
    }
  }

  /** L'INVENTAIRE : cinq cases par rangée, qui s'allument une à une ; le minerai choisi en or et qui luit. */
  function dessinerLInventaire(p: Peintre, y0: number): void {
    const COL = 5
    const cw = 30
    const ch = 28
    const RANG = Math.max(1, Math.floor((hautScene - 10) / (ch + 3)))
    const gx = Math.floor((W - (COL * cw + (COL - 1) * 3)) / 2)
    const gy = y0 + Math.floor((hautScene - (RANG * (ch + 3) - 3)) / 2)
    for (let i = 0; i < COL * RANG; i++) {
      const age = t - vueA - i * 0.012
      if (age < 0) continue
      const x = gx + (i % COL) * (cw + 3)
      const y = gy + Math.floor(i / COL) * (ch + 3)
      const k = MINERAIS[i]
      if (k === undefined) {
        plaque(p, x, y, cw, ch, 'creux')
        continue
      }
      const choisi = k === mineraiChoisi
      const e = etatDuBouton(x, y, cw, ch)
      if (!e.enfonce) ombrePortee(p, x, y, cw, ch)
      plaque(p, x, y + e.dy, cw, ch, choisi ? 'or' : 'encre', { enfonce: e.enfonce, survole: e.survole, flash: e.flash || age < 0.06, reflet: choisi ? (((t * 0.5) % 1) < 0.3 ? x - 10 + (((t * 0.5) % 1) / 0.3) * (cw + 20) : null) : null })
      if (choisi) p.glow(x + cw / 2, y + 11, 14, PEPITE[2], 0.18 + 0.08 * Math.sin(t * 4))
      dessinerUneRessource(p, x + cw / 2, y + 11 + e.dy - (choisi ? Math.round(Math.abs(Math.sin(t * 3)) * 1) : 0), k)
      ecrire(p, montantCourt(tresor[k]), x + cw / 2, y + ch - 10 + e.dy, tresor[k] > 0 ? N.WHITE : COQUE[3], { align: 'center', police: GRAS })
      zone(x, y, cw, ch, () => (mineraiChoisi = k))
    }
  }

  /**
   * LA BARRE DU HAUT : l'icône et LE NOM DE LA VUE EN TITRE (la grande lettre lissée, en or, qu'un éclat traverse de
   * temps en temps ; il tombe à sa place quand la vue change), et LES CRÉDITS, qui roulent, sautent et s'allument.
   */
  function dessinerLaBarreDuHaut(p: Peintre): void {
    p.rect(0, 0, W, HAUT_BARRE, NUIT_BARRE)
    p.rect(0, 0, W, 1, MATIERES.encre.grain)
    p.rect(0, HAUT_BARRE - 2, W, 1, MATIERES.encre.lumiere2)
    p.rect(0, HAUT_BARRE - 1, W, 1, MATIERES.encre.contour)
    p.rect(0, HAUT_BARRE, W, 1, NUIT_OMBRE)
    const u = sortie((t - vueA) / 0.35)
    const chute = Math.round((1 - u) * -10)
    dessinerLIconeDeVue(p, vue, 12, 14 + chute, true)
    const nom = NOMS_VUE[vue]
    const w = largeurDe(nom, TITRE)
    const c = (t % 5) / 5
    motEnRelief(p, nom, 25 + w / 2, 7 + chute, true, TITRE, c < 0.14 ? -10 + (c / 0.14) * (w + 30) : null)
    // le compteur (en court au-delà de quatre chiffres : sa plaque mordait le titre « Entrepôt » dès le cinquième)
    const n = montantCourt(Math.round(creditsVus))
    const wn = largeurDe(n, GRAS)
    const wp = wn + 24
    const px = W - 5 - wp
    compteurX = px + wp / 2
    const allume = t - creditsA < 0.45
    const r = refus
    const tremble = r !== null && t - r.t0 < 0.3 ? Math.round(Math.sin((t - r.t0) * 70) * 2 * (1 - (t - r.t0) / 0.3)) : 0
    if (allume) p.glow(compteurX, 14, 24, RUNE[2], 0.3 * (1 - (t - creditsA) / 0.45))
    const saut = t - creditsA < 0.12 ? -1 : 0
    plaque(p, px + tremble, 5, wp, 17, 'encre', { bord: allume ? RUNE[3] : tremble !== 0 ? ROUGE[4] : undefined })
    dessinerUnCredit(p, px + 9 + tremble, 13 + saut)
    ecrire(p, n, px + 16 + tremble, 10 + saut, allume ? N.WHITE : PEPITE[3], { police: GRAS })
  }

  const PRINCIPALES = (): string[] => VUES.slice(0, 3)
  function dessinerLIconePlus(p: Peintre, x0: number, y0: number, actif: boolean): void {
    const x = Math.round(x0)
    const y = Math.round(y0)
    for (const [dx, dy] of [[-5, -5], [1, -5], [-5, 1], [1, 1]]) {
      p.rect(x + dx - 1, y + dy - 1, 6, 6, MATIERES.encre.contour)
      p.rect(x + dx, y + dy, 4, 4, actif ? PEPITE[2] : COQUE[3])
      p.rect(x + dx, y + dy, 4, 1, actif ? N.hex('#fff2a8') : COQUE[4])
      p.rect(x + dx, y + dy, 1, 4, actif ? N.hex('#ffe68a') : COQUE[4])
    }
  }
  /**
   * LA BARRE DES ONGLETS, EN BAS (sous le pouce) : une case par vue, son icône et son nom ; l'allumée SE LÈVE EN
   * REBONDISSANT, en or, un repère d'or glisse jusqu'à elle ; une pastille rouge dit qu'il y a du nouveau.
   */
  function dessinerLaNav(p: Peintre): void {
    const y0 = H - HAUT_NAV
    p.rect(0, y0, W, HAUT_NAV, NUIT_BARRE)
    p.rect(0, y0, W, 1, MATIERES.encre.contour)
    p.rect(0, y0 + 1, W, 1, MATIERES.encre.lumiere2)
    for (let x = 0; x < W; x++) if (grainA(x, y0) < 0.08) p.rect(x, y0 + 3 + Math.floor(grainA(y0, x) * (HAUT_NAV - 5)), 1, 1, MATIERES.encre.ombre)
    const slots = [...PRINCIPALES(), 'plus']
    const sw = W / slots.length
    const horsBarre = !PRINCIPALES().includes(vue)
    slots.forEach((vv, i) => {
      const actif = vv === 'plus' ? feuille || horsBarre : vv === vue && !feuille
      const x0 = Math.round(i * sw)
      const x1 = Math.round((i + 1) * sw)
      const cxs = Math.round((x0 + x1) / 2)
      const e = etatDuBouton(x0, y0, x1 - x0, HAUT_NAV)
      const leve = rebond(`nav-${vv}`, actif ? 1 : 0)
      const pulse = t - (pulsations[vv] ?? -10) < 0.3 ? Math.round(Math.sin(((t - (pulsations[vv] ?? 0)) / 0.3) * Math.PI) * 3) : 0
      const dy = -Math.round(leve * 3) + e.dy - pulse
      if (e.survole && !actif) p.rect(x0 + 2, y0 + 4, x1 - x0 - 4, HAUT_NAV - 6, N.hex('#19152a'))
      if (actif) p.glow(cxs, y0 + 13, 20, PEPITE[2], 0.2)
      const ic = vv === 'plus' && horsBarre && !feuille ? vue : vv
      const nom = vv === 'plus' ? (horsBarre && !feuille ? NOMS_VUE[vue] : 'Plus') : NOMS_VUE[vv]
      if (ic === 'plus') dessinerLIconePlus(p, cxs, y0 + 13 + dy, actif)
      else dessinerLIconeDeVue(p, ic, cxs, y0 + 13 + dy, actif)
      ecrire(p, nom, cxs, y0 + 22 + dy, actif ? PEPITE[3] : COQUE[4], { align: 'center', police: actif ? GRAS : TEXTE })
      if (nouveautes.has(vv)) {
        const bx = cxs + 7
        const by = y0 + 5 + dy
        p.rect(bx - 1, by - 1, 5, 5, MATIERES.encre.contour)
        p.rect(bx, by, 3, 3, N.hex('#ff3a4a'))
        p.rect(bx, by, 1, 1, N.hex('#ffb0b0'))
        p.glow(bx + 1, by + 1, 5, N.hex('#ff3a4a'), 0.4 + 0.3 * Math.sin(t * 6))
      }
      const action = vv === 'plus' ? basculerLaFeuille : () => (vv === vue ? (feuille = false) : allerA(vv))
      zone(x0, y0, x1 - x0, HAUT_NAV, action, vv === 'plus' ? (feuille ? 'retour' : 'ouvre') : actif ? null : 'onglet')
    })
    const ia = feuille || horsBarre ? slots.length - 1 : slots.indexOf(vue)
    const cible = ia * sw + sw / 2
    repereX = repereX < 0 ? cible : ressort(repereX, cible, 18)
    p.rect(Math.round(repereX - 12), y0 + 1, 24, 2, PEPITE[2])
    p.rect(Math.round(repereX - 8), y0 + 1, 16, 1, N.hex('#fff2a8'))
    p.glow(Math.round(repereX), y0 + 2, 12, PEPITE[2], 0.35)
  }

  /** LA FEUILLE « PLUS », qui monte de la barre du bas : les autres onglets, la remise à zéro, la date du build. */
  function dessinerLaFeuille(p: Peintre): void {
    zoneDesOnglets = null
    const u = sortie((t - feuilleA) / 0.22)
    const k = feuille ? u : 1 - u
    if (k <= 0.01) return
    const bas = H - HAUT_NAV
    const autres = VUES.slice(3)
    const COL = 4
    const tw = 42
    const th = 36
    const pas = th + 3
    const rangs = Math.ceil(autres.length / COL)
    const hPied = 38
    const hMax = bas - HAUT_BARRE - 10
    const visibles = Math.max(1, Math.min(rangs, Math.floor((hMax - 22 - hPied) / pas)))
    const hf = 22 + (autres.length > 0 ? visibles * pas : 16) + hPied
    // la feuille dépasse un peu sa place puis s'y pose
    const sur = feuille ? Math.round(Math.sin(Math.min(1, (t - feuilleA) / 0.3) * Math.PI) * 3) : 0
    const yf = Math.round(bas - (hf + 4) * k) - sur
    p.rect(0, HAUT_BARRE + 1, W, bas - HAUT_BARRE - 1, NUIT, 0.72 * k)
    if (feuille) zones = zones.filter((z) => z.y >= bas)
    plaque(p, 4, yf, W - 8, hf + 10, 'encre')
    motEnRelief(p, 'Autres onglets', W / 2, yf + 7, true)
    const yg = yf + 21
    if (autres.length === 0) ecrire(p, 'Aucun pour l’instant', W / 2, yg + 3, COQUE[3], { align: 'center' })
    const maxD = Math.max(0, rangs - visibles)
    defilOnglets = Math.max(0, Math.min(maxD, defilOnglets))
    const d0 = Math.round(defilOnglets)
    const gx = Math.floor((W - (COL * tw + (COL - 1) * 2)) / 2)
    autres.forEach((vv, i) => {
      const r = Math.floor(i / COL) - d0
      if (r < 0 || r >= visibles) return
      if (feuille && t - feuilleA < 0.08 + i * 0.015) return
      const x = gx + (i % COL) * (tw + 2)
      const y = yg + r * pas
      const actif = vv === vue
      const e = etatDuBouton(x, y, tw, th)
      if (!e.enfonce) ombrePortee(p, x, y, tw, th)
      plaque(p, x, y + e.dy, tw, th, actif ? 'or' : 'encre', { enfonce: e.enfonce, survole: e.survole, flash: e.flash })
      dessinerLIconeDeVue(p, vv, x + tw / 2, y + 13 + e.dy, actif)
      ecrire(p, NOMS_VUE[vv], x + tw / 2, y + th - 12 + e.dy, actif ? N.WHITE : COQUE[5], { align: 'center' })
      if (feuille) zone(x, y, tw, th, () => allerA(vv), 'onglet')
    })
    if (maxD > 0) {
      const hg = visibles * pas - 3
      const hc = Math.max(8, Math.round((hg * visibles) / rangs))
      const yc = yg + Math.round(((hg - hc) * defilOnglets) / maxD)
      p.rect(W - 9, yg, 2, hg, MATIERES.encre.contour)
      p.rect(W - 9, yc, 2, hc, COQUE[3])
      if (feuille) zoneDesOnglets = { x: 4, y: yg, w: W - 8, h: hg }
    }
    const yp = yf + hf + 10 - hPied
    p.rect(12, yp, W - 24, 1, MATIERES.encre.ombre)
    p.rect(12, yp + 1, W - 24, 1, MATIERES.encre.lumiere2)
    const demande = t - resetDemandeA < 2
    if (feuille) {
      const mot = demande ? 'Sûr ?' : 'Remise à zéro'
      const wr = largeurDe(mot, GRAS) + 16
      bouton(p, Math.round(W / 2 - wr / 2), yp + 6, wr, 15, mot, true, () => {
        if (!demande) {
          resetDemandeA = t
          return
        }
        resetDemandeA = -10
        hangar = hangarNeuf()
        tresor = cargaisonVide()
        credits = 0
        creditsVus = 0
        creditsConnus = 0
        sauver()
        ouvrirLeHangar()
      }, demande ? 'refus' : 'clic', demande ? 'or' : 'acier')
    }
    p.text(texteNu(`build ${build}`), W / 2, yp + 27, COQUE[3], { align: 'center' })
    if (feuille) zone(0, HAUT_BARRE, W, bas - HAUT_BARRE, basculerLaFeuille, 'retour')
  }

  /** LES ÉCLATS : étincelles et fumées, les pièces d'une vente vers le compteur, les pièces achetées vers le hangar, les nombres qui montent. */
  function dessinerLesEclats(p: Peintre): void {
    for (const e of eclats) {
      e.x += e.vx * dtBase
      e.y += e.vy * dtBase
      if (e.fumee) {
        e.vx *= 1 - 3 * dtBase
        e.vy -= 6 * dtBase
        const u = (t - e.t0) / e.vie
        p.circle(e.x, e.y, 2 + u * 5, e.c, 0.6 * (1 - u))
        continue
      }
      e.vy += 140 * dtBase
      e.vx *= 1 - 2 * dtBase
      const u = (t - e.t0) / e.vie
      const g = u < 0.35 ? 2 : 1
      p.rect(Math.round(e.x), Math.round(e.y), g, g, u < 0.15 ? N.WHITE : e.c)
      if (u < 0.3) p.glow(e.x, e.y, 3, e.c, 0.3)
    }
    for (let i = eclats.length - 1; i >= 0; i--) if (t - eclats[i].t0 > eclats[i].vie) eclats.splice(i, 1)
    for (let i = volantes.length - 1; i >= 0; i--) {
      const v = volantes[i]
      const u = (t - v.t0) / 0.5
      if (u < 0) continue
      if (u >= 1) {
        volantes.splice(i, 1)
        N.sparkle(p, compteurX - 8, 13, 4, RUNE[3], N.WHITE, 0.9)
        jouer('ramasse')
        continue
      }
      const e = u * u * (3 - 2 * u)
      const x = v.x0 + (compteurX - 8 - v.x0) * e
      const y = v.y0 + (13 - v.y0) * e - Math.sin(u * Math.PI) * 26
      p.glow(x, y, 5, RUNE[2], 0.4)
      dessinerUnCredit(p, x, y)
    }
    // les pièces achetées s'envolent vers l'onglet du hangar, qui saute et prend une pastille
    for (let i = envolsDePiece.length - 1; i >= 0; i--) {
      const v = envolsDePiece[i]
      const u = (t - v.t0) / 0.7
      if (u < 0) continue
      const sw = W / 4
      const xa = sw / 2
      const ya = H - HAUT_NAV + 13
      if (u >= 1) {
        envolsDePiece.splice(i, 1)
        pulsations.hangar = t
        nouveautes.add('hangar')
        gerbe(xa, ya, 12, [PEPITE[2], PEPITE[3], N.WHITE], 50)
        jouer('ramasse')
        continue
      }
      const e = u * u * (3 - 2 * u)
      const x = v.x0 + (xa - v.x0) * e
      const y = v.y0 + (ya - v.y0) * e - Math.sin(u * Math.PI) * 40
      const tc = Math.round(26 - 10 * e)
      p.glow(x, y, tc, PEPITE[2], 0.35)
      plaque(p, x - tc / 2, y - tc / 2, tc, tc, 'or')
      peindreDansUneCase(p, formesDeLaPiece(v.pc), x, y, tc, tc, { cadre: cadreDeLaPiece(v.pc) })
    }
    for (let i = flottants.length - 1; i >= 0; i--) {
      const f = flottants[i]
      const u = (t - f.t0) / 0.95
      if (u >= 1) {
        flottants.splice(i, 1)
        continue
      }
      ecrire(p, f.texte, f.x, Math.round(f.y + 2 - sortie(u) * 12), u > 0.72 && Math.floor(t * 30) % 2 === 0 ? N.WHITE : f.c, { police: GRAS, align: 'center', contour: NUIT_OMBRE })
    }
  }
  /** L'ICÔNE D'UN ONGLET, centrée sur (x, y), une douzaine de pixels : le VAISSEAU nez en haut, la FIOLE du labo et son liquide vert, la CAISSE de l'entrepôt. */
  function dessinerLIconeDeVue(p: Peintre, vv: string, x0: number, y0: number, actif: boolean): void {
    const x = Math.round(x0)
    const y = Math.round(y0)
    const a = 1 // (opaques toujours : à demi transparentes, elles sortaient tramées — l'onglet éteint se lit à son nom et sa plaque)
    const OMBRE = MATIERES.encre.contour
    if (vv === 'hangar') {
      p.poly([[x, y - 7], [x + 5, y + 5], [x, y + 3], [x - 5, y + 5]], OMBRE, a)
      p.poly([[x, y - 6], [x + 4, y + 4], [x, y + 2], [x - 4, y + 4]], COQUE[4], a)
      p.poly([[x, y - 6], [x, y + 2], [x - 4, y + 4]], COQUE[5], a)
      p.rect(x - 1, y - 2, 2, 2, RUNE[2], a)
      p.rect(x - 1, y + 4, 2, 2, PEPITE[2], a)
    } else if (vv === 'labo') {
      p.rect(x - 2, y - 7, 5, 6, OMBRE, a)
      p.poly([[x - 2, y - 2], [x + 3, y - 2], [x + 7, y + 6], [x - 6, y + 6]], OMBRE, a)
      p.rect(x - 1, y - 6, 3, 5, COQUE[4], a)
      p.poly([[x - 1, y - 2], [x + 2, y - 2], [x + 5, y + 5], [x - 4, y + 5]], COQUE[3], a)
      p.poly([[x - 2.5, y + 1], [x + 3.5, y + 1], [x + 5, y + 5], [x - 4, y + 5]], RUNE[2], a)
      p.rect(x - 2, y + 2, 1, 1, RUNE[3], a)
      p.rect(x + 1, y - 4 - Math.round((t * 4) % 3), 1, 1, RUNE[3], actif ? 1 : 0)
    } else if (estEssai(vv)) dessinerUneIconeDEssai(p, vv, x, y, OMBRE)
    else {
      const B = [N.hex('#3a2410'), N.hex('#7a4f24'), N.hex('#a8743a'), N.hex('#d8a865')]
      p.rect(x - 6, y - 5, 13, 11, OMBRE, a)
      p.rect(x - 5, y - 4, 11, 9, B[2], a)
      p.rect(x - 5, y - 4, 11, 1, B[3], a)
      p.rect(x - 5, y, 11, 1, B[1], a)
      p.line(x - 4, y - 3, x + 4, y + 3, B[1], a)
      p.rect(x - 5, y + 4, 11, 1, B[0], a)
    }
  }
  /** Les icônes des onglets d'essai (`&onglets=N`), une douzaine de pixels chacune, centrées sur (x, y). */
  function dessinerUneIconeDEssai(p: Peintre, vv: string, x: number, y: number, OMBRE: number): void {
    const ROUGE_ = N.hex('#d8483a')
    if (vv === 'carte') {
      p.rect(x - 6, y - 5, 13, 11, OMBRE)
      for (let k = 0; k < 3; k++) p.rect(x - 5 + k * 4, y - 4 + (k % 2), 4, 8, k % 2 ? N.hex('#c9b27a') : N.hex('#e6d39c'))
      p.rect(x + 1, y - 1, 2, 2, ROUGE_)
    } else if (vv === 'atelier') {
      for (let e = -1; e <= 1; e++) p.line(x - 5 + e, y + 5, x + 3 + e, y - 3, COQUE[4])
      p.rect(x + 1, y - 6, 5, 5, COQUE[5])
      p.rect(x + 3, y - 6, 2, 2, OMBRE)
    } else if (vv === 'marche') {
      p.poly([[x - 3, y - 6], [x + 3, y - 6], [x + 6, y - 3], [x + 6, y + 3], [x + 3, y + 6], [x - 3, y + 6], [x - 6, y + 3], [x - 6, y - 3]], OMBRE)
      p.poly([[x - 2, y - 5], [x + 2, y - 5], [x + 5, y - 2], [x + 5, y + 2], [x + 2, y + 5], [x - 2, y + 5], [x - 5, y + 2], [x - 5, y - 2]], PEPITE[2])
      p.rect(x - 1, y - 3, 2, 6, PEPITE[3])
    } else if (vv === 'equipage') {
      p.rect(x - 3, y - 7, 6, 6, OMBRE)
      p.rect(x - 2, y - 6, 4, 4, N.hex('#e8b48a'))
      p.poly([[x - 6, y + 6], [x - 4, y], [x + 4, y], [x + 6, y + 6]], N.hex('#3f6fb0'))
    } else if (vv === 'missions') {
      p.line(x - 4, y - 6, x - 4, y + 6, COQUE[5])
      p.poly([[x - 3, y - 6], [x + 6, y - 3], [x - 3, y]], ROUGE_)
    } else if (vv === 'journal') {
      p.rect(x - 5, y - 6, 11, 12, OMBRE)
      p.rect(x - 4, y - 5, 9, 10, N.hex('#5a3a8a'))
      p.rect(x - 4, y - 5, 2, 10, N.hex('#3a2460'))
      p.rect(x, y - 2, 4, 1, PEPITE[2])
    } else if (vv === 'trophees') {
      p.poly([[x - 5, y - 6], [x + 5, y - 6], [x + 3, y], [x - 3, y]], PEPITE[2])
      p.rect(x - 1, y, 2, 4, PEPITE[1])
      p.rect(x - 4, y + 4, 8, 2, PEPITE[1])
      p.rect(x - 3, y - 5, 2, 3, PEPITE[3])
    } else if (vv === 'radio') {
      p.line(x, y - 2, x, y + 6, COQUE[4])
      p.rect(x - 1, y - 3, 2, 2, RUNE[2])
      for (const r of [3, 6]) {
        p.line(x - r, y - 2 - r, x - r, y - 2 + r, RUNE[2])
        p.line(x + r, y - 2 - r, x + r, y - 2 + r, RUNE[2])
      }
    } else if (vv.startsWith('essai-')) {
      // un réservé : son numéro dans une case pointillée
      for (let k = -6; k <= 6; k += 2) {
        p.dot(x + k, y - 6, COQUE[3])
        p.dot(x + k, y + 6, COQUE[3])
        p.dot(x - 6, y + k, COQUE[3])
        p.dot(x + 6, y + k, COQUE[3])
      }
      p.text(vv.slice(6), x + 1, y - 3, COQUE[5], { font: 'big', align: 'center' })
    } else {
      p.rect(x - 6, y + 2, 12, 4, COQUE[3])
      p.rect(x - 3, y - 1, 6, 3, COQUE[4])
      p.rect(x - 1, y - 6, 2, 4, N.hex('#ff8a2a'))
    }
  }
  // ================================================================ LES PIÈCES, LES CASES, LA LISTE, LA FICHE
  /** Les formes d'une pièce seule, pour son pictogramme (le même rendu que le vaisseau). */
  function formesDeLaPiece(pc: Piece): ReturnType<typeof formesDuVaisseau> {
    if (pc.sorte === 'propulseur') return formesDuPropulseur(pc.cran, 0.55 + 0.15 * Math.sin(t * 7), t)
    if (pc.sorte === 'coque') return formesDuChassis(Math.min(3, pc.cran))
    if (pc.sorte === 'outil') return pc.famille === 'aimant' ? formesDeLAimant(pc.cran) : pc.famille === 'radar' ? formesDuRadar(t) : formesDeLaForeuse(pc.cran)
    return formesDeLArme(pc.arme?.id ?? 'canon', 1)
  }
  /**
   * LE CADRE d'une pièce qui s'anime : sa boîte LA PLUS GRANDE (la flamme à son plus long, le tour entier de l'antenne),
   * pour que la mise en case ne bouge pas avec l'animation — la tuyère reste fixe, seule la flamme gonfle.
   */
  function cadreDeLaPiece(pc: Piece): ReturnType<typeof formesDuVaisseau> | undefined {
    if (pc.sorte === 'propulseur') return formesDuPropulseur(pc.cran, 0.7, Math.PI / 120)
    if (pc.sorte === 'outil' && pc.famille === 'radar') return [{ pts: ovale(-4.5, 0, 2.9, 2.9, 12), mat: 'acier', relief: 'plat' }]
    return undefined
  }
  /** LE PICTOGRAMME D'UNE PIÈCE, mis à l'échelle de sa case (Keko : « chaque visuel rescalé pour loger dans la zone »). */
  function dessinerLePictogramme(p: Peintre, pc: Piece, x: number, y: number, bw: number, bh: number): void {
    peindreDansUneCase(p, formesDeLaPiece(pc), x, y, bw, bh, { cadre: cadreDeLaPiece(pc) })
  }
  /** Ouvre la liste d'un emplacement (depuis le vaisseau ou sa case). */
  function ouvrirLEmplacement(o: Sorte, k = -1): void {
    onglet = o
    place = k
    changerDEtape('liste')
    defil[o] = 0
    const occupant = k >= 0 ? listeMontee(o)[k] : undefined
    if (occupant !== undefined && occupant !== '') choix[o] = occupant
  }
  /**
   * LA VUE D'ENSEMBLE, sous la scène : une case par place (au hangar) ou par catégorie (au labo), deux par rangée, qui
   * ARRIVENT UNE À UNE (elles montent de quatre pixels, leur bord flashe) ; le survol les soulève d'un pixel. Chaque
   * case : un puits creusé avec la pièce rendue dedans (un « + » qui respire si la place est vide), le nom de la place
   * en petites capitales d'or, la pièce en clair.
   */
  function dessinerLesEmplacements(p: Peintre, y: number): number {
    const cw = Math.floor((W - 12) / 2)
    const ch = 36
    const cases = casesDuVaisseau()
    cases.forEach((c, i) => {
      const age = t - etapeA - i * 0.045
      if (age < 0) return
      const o = c.o
      const x = 4 + (i % 2) * (cw + 4)
      const yy = y + Math.floor(i / 2) * (ch + 4)
      let montee: Piece | undefined
      if (vue === 'hangar') montee = o === 'propulseur' || o === 'coque' ? monteeA(hangar, o) : pieceDe(listeMontee(o)[c.k] ?? '')
      else montee = piecesDe(o).find((pc) => !possede(hangar, pc.id))
      const e = etatDuBouton(x, yy, cw, ch)
      const monte = Math.round((1 - sortie(age / 0.2)) * 4) - (e.survole && !e.enfonce ? 1 : 0)
      const y2 = yy + e.dy + monte
      if (!e.enfonce) ombrePortee(p, x, yy + Math.max(0, monte), cw, ch)
      plaque(p, x, y2, cw, ch, 'encre', { enfonce: e.enfonce, survole: e.survole, flash: e.flash || age < 0.07 })
      plaque(p, x + 4, y2 + 4, 26, ch - 8, 'creux')
      const vide = vue === 'hangar' && montee === undefined
      if (vide) {
        const c2 = Math.sin(t * 3 + i) > 0 ? COQUE[3] : COQUE[2]
        p.rect(x + 16, y2 + ch / 2 - 5, 2, 10, c2)
        p.rect(x + 12, y2 + ch / 2 - 1, 10, 2, c2)
      } else if (montee !== undefined) dessinerLePictogramme(p, montee, x + 17, y2 + ch / 2, 26, ch - 8)
      const xt = x + 34 + (cw - 36) / 2
      p.text(texteNu(titreDe(c)), xt, y2 + 5, PEPITE[2], { align: 'center' })
      const ligne = vue === 'labo' ? `${piecesDe(o).filter((pc) => !possede(hangar, pc.id)).length} à débloquer` : vide ? 'Vide' : montee!.nom
      const L = replier(ligne, cw - 38)
      L.slice(0, 2).forEach((li, k) => ecrire(p, li, xt, y2 + 14 + k * 10, vue === 'labo' || vide ? COQUE[3] : COQUE[6], { align: 'center' }))
      zone(x, yy, cw, ch, () => ouvrirLEmplacement(o, c.k))
    })
    return y + Math.ceil(cases.length / 2) * (ch + 4)
  }

  /**
   * LE CONTENU, sous la scène — UN NIVEAU À LA FOIS : la vue d'ensemble (les cases, et DÉCOLLER au hangar), la liste
   * d'une place avec sa fiche, ou la fiche du minerai ; il se dévoile en fondu tramé à chaque changement.
   */
  function dessinerLeContenu(p: Peintre): void {
    p.place(0, 0)
    const y0 = Y_SCENE + hautScene + 2
    const y = y0 + 4
    zoneGlissante = null
    if (estEssai(vue)) {
      ecrire(p, 'Un onglet d’essai', W / 2, y + 12, COQUE[4], { align: 'center' })
      p.text('(&ONGLETS=N)', W / 2, y + 26, COQUE[2], { align: 'center' })
    } else if (vue === 'entrepot') dessinerLEntrepot(p, y)
    else if (etape === 'vaisseau') {
      dessinerLesEmplacements(p, y)
      if (vue === 'hangar') dessinerDecoller(p)
    } else dessinerLaListe(p, y)
    const u = (t - etapeA) / 0.16
    if (u < 1) p.rect(0, y0, W, H - HAUT_NAV - y0, NUIT, 1 - sortie(u))
    if (parametres.has('latence')) p.text(`SON ${latenceMs()} MS`, 4, H - HAUT_NAV - 10, N.WHITE, { font: 'big', outline: COQUE[0] })
  }

  /**
   * DÉCOLLER, l'action principale : une grande plaque d'or, le mot en TITRE, un battement de cœur de lumière, un reflet
   * qui passe, des chevrons qui courent vers le mot, des étincelles qui en montent.
   */
  function dessinerDecoller(p: Peintre): void {
    const bw = W - 24
    const bh = 28
    const bx = 12
    const by = H - HAUT_NAV - 38
    const coeur = Math.pow(Math.max(0, Math.sin(t * 3.2)), 6)
    p.glow(W / 2, by + bh / 2, 56, PEPITE[2], 0.08 + 0.14 * coeur)
    if (R.next() < 0.08) eclats.push({ x: bx + 6 + R.next() * (bw - 12), y: by + 2, vx: (R.next() - 0.5) * 8, vy: -14 - R.next() * 14, t0: t, vie: 0.5 + 0.4 * R.next(), c: R.next() < 0.5 ? PEPITE[3] : N.hex('#fff2a8') })
    const cycle = (t % 3.4) / 3.4
    const pret = decollageA === null
    boutonBase(p, bx, by, bw, bh, pret, () => {
      decollageA = t
      feuille = false
      secouer(1.5)
      gerbe(W / 2, by + bh / 2, 22, [PEPITE[2], PEPITE[3], N.WHITE], 80)
    }, (dx, dy) => {
      motEnRelief(p, 'Décoller', W / 2 + dx, by + 7 + dy, true, TITRE)
      const o = Math.floor(t * 8) % 3
      for (let i = 0; i < 3; i++) {
        const c = i === o ? N.hex('#fff2a8') : i === (o + 2) % 3 ? PEPITE[2] : N.hex('#a8650f')
        p.text('>', bx + 7 + i * 4 + dx, by + 12 + dy, c)
        p.text('<', bx + bw - 10 - i * 4 + dx, by + 12 + dy, c)
      }
    }, 'decolle', { reflet: cycle < 0.3 ? bx - 14 + ((bw + 40) * cycle) / 0.3 : refletDeSurvol(bx, bw, survol !== null && survol.x >= bx && survol.x < bx + bw && survol.y >= by && survol.y < by + bh) })
  }

  /** Le surlignage de la liste glisse jusqu'à la rangée choisie ; l'instant d'un nouveau choix (les jauges se remplissent à nouveau). */
  let surligneY = -1
  let choixA = -10
  const RANG_LISTE = 13
  /**
   * LA LISTE D'UNE PLACE : l'en-tête (le retour, le titre), les puces de sous-catégorie, la liste qui glisse au doigt
   * (quatre rangées, le surlignage qui glisse, une encoche d'or), puis LA FICHE de la pièce choisie.
   */
  function dessinerLaListe(p: Peintre, y0: number): void {
    let y = y0
    enTete(p, y, titreDe({ o: onglet, k: placeOuverte() }), () => changerDEtape('vaisseau'))
    y += HT + 3
    const liste = listeVisible(onglet).filter((pc) => (vue === 'labo') !== possede(hangar, pc.id))
    const familles = famillesDe(onglet)
    if (familles.length > 0) {
      const puces: (string | null)[] = [null, ...familles]
      const noms = puces.map((f) => (f === null ? 'Tout' : (NOMS_FAMILLE[f] ?? f)))
      const largeurs = noms.map((n) => largeurDe(n, GRAS) + 12)
      let x = Math.floor((W - largeurs.reduce((a, b) => a + b, 0) - (puces.length - 1) * 3) / 2)
      puces.forEach((f, i) => {
        const actif = sousCategorie[onglet] === f
        const xi = x
        const e = etatDuBouton(xi, y, largeurs[i], 13)
        if (!e.enfonce) ombrePortee(p, xi, y, largeurs[i], 13)
        plaque(p, xi, y + e.dy, largeurs[i], 13, actif ? 'or' : 'encre', { enfonce: e.enfonce, survole: e.survole, flash: e.flash })
        ecrire(p, noms[i], xi + largeurs[i] / 2, y + 3 + e.dy, actif ? N.WHITE : COQUE[5], { align: 'center', police: GRAS })
        if (!actif) zone(xi, y, largeurs[i], 13, () => ((sousCategorie[onglet] = f), (defil[onglet] = 0), (choixA = t)))
        x += largeurs[i] + 3
      })
      y += 16
    }
    const hl = RANGEES * RANG_LISTE + 4
    plaque(p, 4, y, W - 8, hl, 'creux')
    const maxDefil = Math.max(0, liste.length - RANGEES)
    defil[onglet] = Math.max(0, Math.min(maxDefil, defil[onglet]))
    const depart = Math.round(defil[onglet])
    const yl = y + 2
    zoneGlissante = maxDefil > 0 ? { x: 4, y: yl, w: W - 8, h: RANGEES * RANG_LISTE } : null
    const larg = W - (maxDefil > 0 ? 20 : 14)
    const ic = liste.findIndex((x) => x.id === choix[onglet])
    const iSel = ic < 0 ? 0 : ic
    const cibleY = yl + (iSel - depart) * RANG_LISTE
    surligneY = surligneY < 0 || Math.abs(surligneY - cibleY) > 60 ? cibleY : ressort(surligneY, cibleY, 24)
    if (liste.length > 0 && iSel >= depart && iSel < depart + RANGEES) {
      const sy = Math.round(surligneY)
      p.rect(7, sy, larg, RANG_LISTE, N.hex('#2a2440'))
      p.rect(7, sy, larg, 1, N.hex('#3e3560'))
      p.rect(7, sy + RANG_LISTE - 1, larg, 1, N.hex('#1a1528'))
      p.rect(7, sy + 1, 2, RANG_LISTE - 2, PEPITE[2])
      p.rect(7, sy + 1, 1, RANG_LISTE - 2, N.hex('#fff2a8'))
    }
    for (let i = depart; i < Math.min(liste.length, depart + RANGEES); i++) {
      const pc = liste[i]
      const ly = yl + (i - depart) * RANG_LISTE
      const choisie = i === iSel
      const montee = estMontee(hangar, pc.id)
      if (!choisie && survol !== null && survol.y >= ly && survol.y < ly + RANG_LISTE && survol.x >= 4 && survol.x < W - 4) p.rect(7, ly, larg, RANG_LISTE, N.hex('#1a1626'))
      ecrire(p, pc.nom, 14 + (choisie ? 1 : 0), ly + 3, choisie ? N.WHITE : montee ? COQUE[6] : COQUE[5], { police: choisie ? GRAS : TEXTE })
      const xd = W - (maxDefil > 0 ? 16 : 10)
      const ki = placeOuverte()
      // (« EQUIPE » ou rien, comme les autres parties — Keko : les places où la pièce est montée ailleurs ne se disent
      // plus ; pour une arme ou un outil, « EQUIPE » veut dire à LA PLACE OUVERTE, la même pièce pouvant se monter à plusieurs)
      if (ki >= 0 ? listeMontee(onglet)[ki] === pc.id : montee) p.text('EQUIPE', xd, ly + 4, PEPITE[2], { align: 'right' })
      else if (!possede(hangar, pc.id)) nombreDeCredits(p, pc.prix, xd + 2, ly + 3, peutAcheter(hangar, credits, pc.id) ? PEPITE[3] : COQUE[3])
      zone(4, ly, W - 8, RANG_LISTE, () => ((choix[onglet] = pc.id), (choixA = t)), choisie ? null : 'clic')
    }
    if (maxDefil > 0) {
      const hg = RANGEES * RANG_LISTE - 2
      p.rect(W - 11, yl + 1, 3, hg, MATIERES.creux.contour)
      const hc = Math.max(6, Math.round((hg * RANGEES) / liste.length))
      const yc = yl + 1 + Math.round(((hg - hc) * defil[onglet]) / maxDefil)
      p.rect(W - 11, yc, 3, hc, COQUE[3])
      p.rect(W - 11, yc, 3, 1, COQUE[5])
    }
    if (liste.length === 0) ecrire(p, vue === 'labo' ? 'Tout est débloqué' : 'Rien ici : passez au labo', W / 2, y + 22, COQUE[4], { align: 'center' })
    y += hl + 4
    const pc = liste[iSel]
    if (pc === undefined) return
    dessinerLaFiche(p, y, pc)
  }

  /** Une pièce montée : l'onde sur l'aire, le flash du vaisseau, des étincelles, une petite secousse. */
  function feterLEquipement(): void {
    equipeA = t
    secouer(1)
    const cy = Y_SCENE + hautScene - Math.min(62, Math.floor(hautScene / 2) + 10)
    gerbe(W / 2, cy, 18, [PEPITE[2], PEPITE[3], N.WHITE], 60)
  }

  /** LA FICHE d'une pièce : son bouton, puis ses stats (la pièce rendue dans son puits, le nom, les jauges, la note). */
  function dessinerLaFiche(p: Peintre, y0: number, pc: Piece): void {
    let y = y0
    const lb = (mot: string): number => largeurDe(mot, GRAS) + 22
    const ko = placeOuverte()
    if (ko >= 0 && possede(hangar, pc.id) && listeMontee(onglet)[ko] !== pc.id) {
      const bw = lb('Équiper')
      bouton(p, W / 2 - bw / 2, y, bw, 15, 'Équiper', true, () => {
        hangar = monterA(hangar, pc.id, ko)
        sauver()
        feterLEquipement()
      }, 'equipe')
    } else if (estMontee(hangar, pc.id)) {
      if (pc.sorte === 'arme' || pc.sorte === 'outil') {
        const bw = lb('Retirer')
        bouton(p, W / 2 - bw / 2, y, bw, 15, 'Retirer', true, () => {
          hangar = ko >= 0 ? demonterA(hangar, pc.sorte as 'arme' | 'outil', ko) : demonter(hangar, pc.id)
          sauver()
        }, 'retour', 'acier')
      } else {
        motEnRelief(p, 'Équipé', W / 2, y + 4, true)
        const s = 1 + Math.round(1.5 + 1.5 * Math.sin(t * 5))
        N.sparkle(p, W / 2 + largeurDe('Équipé', GRAS) / 2 + 6, y + 4, s, PEPITE[3], N.WHITE, 0.8)
      }
    } else if (possede(hangar, pc.id)) {
      const bw = lb('Équiper')
      bouton(p, W / 2 - bw / 2, y, bw, 15, 'Équiper', peutMonter(hangar, pc.id), () => {
        hangar = monter(hangar, pc.id)
        sauver()
        feterLEquipement()
      }, 'equipe')
    } else {
      // ACHETER, le prix et l'icône des crédits ; éteint s'il manque des crédits (il tremble alors) ; acheté, la pièce
      // s'envole vers l'onglet du hangar, qui prend une pastille. LE PRIX EST DANS UN PUITS SOMBRE creusé dans le bouton
      // (Keko : « le texte blanc sur fond jaune n'est pas idéal ») : le nombre crème et le crédit vert s'y lisent comme
      // au compteur du haut, que le bouton soit d'or ou éteint
      const vif = peutAcheter(hangar, credits, pc.id)
      const wa = largeurDe('Acheter', GRAS)
      const wn = largeurDe(String(pc.prix), GRAS)
      const wp = wn + 18
      const bw = 8 + wa + 5 + wp + 3
      const bx = Math.round(W / 2 - bw / 2)
      boutonBase(p, bx, y, bw, 15, vif, () => {
        const r = acheter(hangar, credits, pc.id)
        if (r === null) return
        hangar = r.hangar
        credits = r.credits
        sauver()
        secouer(1.2)
        gerbe(W / 2, y + 7, 24, [PEPITE[2], PEPITE[3], RUNE[3], N.WHITE], 80)
        envolsDePiece.push({ pc, x0: W / 2, y0: y + 40, t0: t + 0.1 })
        flottants.push({ texte: 'Débloqué !', x: W / 2, y: y - 14, t0: t, c: PEPITE[3] })
      }, (dx, dy) => {
        if (vif) motEnRelief(p, 'Acheter', bx + 8 + wa / 2 + dx, y + 4 + dy, true)
        else ecrire(p, 'Acheter', bx + 8 + dx, y + 4 + dy, COQUE[3], { police: GRAS })
        const px = bx + 8 + wa + 5 + dx
        plaque(p, px, y + 2 + dy, wp, 11, 'creux')
        ecrire(p, String(pc.prix), px + 4, y + 4 + dy, vif ? N.hex('#fff2c8') : COQUE[4], { police: GRAS })
        dessinerUnCredit(p, px + 4 + wn + 7, y + 7 + dy)
      }, 'achat')
    }
    y += 19
    const jauges = jaugesDe(pc)
    const enPlace = pc.sorte === 'arme' ? null : pc.sorte === 'outil' ? (pc.famille === 'foreuse' ? foreuseMontee(hangar) : null) : monteeA(hangar, pc.sorte)
    const reperes = enPlace !== null && enPlace.id !== pc.id ? jaugesDe(enPlace) : null
    const gx = 56
    const note = pc.note === undefined ? [] : replier(pc.note, W - 22)
    const hh = Math.max(52, 18 + jauges.length * 10 + 4)
    const hd = hh + (note.length > 0 ? note.length * 9 + 6 : 0)
    plaque(p, 4, y, W - 8, hd, 'encre')
    plaque(p, 8, y + 4, 44, hh - 8, 'creux')
    p.glow(30, y + hh / 2, 16, VERRIERE[1], 0.12)
    dessinerLePictogramme(p, pc, 30, y + hh / 2, 44, hh - 8)
    motEnRelief(p, pc.nom, gx + (W - 12 - gx) / 2, y + 5, false)
    jauges.forEach((j, i) => {
      const k = sortie((t - Math.max(etapeA, choixA) - 0.05 - i * 0.045) / 0.32)
      const jj = { ...j, valeur: j.nombre ? j.valeur : j.valeur * k }
      dessinerUneJaugeDePiece(p, y + 18 + i * 10, jj, reperes === null || reperes[i] === undefined ? null : reperes[i].valeur / reperes[i].max, j.nom === 'Poids', gx, k)
    })
    if (note.length > 0) {
      p.rect(10, y + hh - 1, W - 20, 1, MATIERES.encre.ombre)
      note.forEach((li, i) => ecrire(p, li, W / 2, y + hh + 3 + i * 9, COQUE[4], { align: 'center' }))
    }
  }

  /**
   * LA COLONNE DES BARRES commence après LE PLUS LONG DES NOMS de jauge, toutes pièces confondues (mesuré dans la
   * police, pas écrit : à 52 px, « Accélération » passait sous sa barre — Keko : « les jauges se superposent avec leur
   * texte, réduis la largeur des barres ») ; la même pour toutes les fiches, les barres se comparent d'une pièce à l'autre.
   */
  let colonneMesuree = 0
  function colonneDesJauges(): number {
    if (colonneMesuree === 0) {
      const noms = (['propulseur', 'coque', 'outil', 'arme'] as const).flatMap((o) => piecesDe(o)).flatMap((pc) => jaugesDe(pc).map((j) => j.nom))
      colonneMesuree = Math.max(...noms.map((n) => largeurDe(n))) + 4
    }
    return colonneMesuree
  }
  /**
   * UNE JAUGE : son nom, puis — un nombre (le poids, les places) ; des CELLULES pour ce qui se compte (blindage,
   * bouclier), qui s'allument une à une ; sinon une barre dans sa rainure, au dégradé lumineux, qu'un éclat parcourt
   * quand elle a fini de se remplir — et un repère blanc à la valeur de la pièce en place, pour comparer.
   */
  function dessinerUneJaugeDePiece(p: Peintre, y: number, j: Jauge, repere: number | null, rouge: boolean, x0 = 10, plein = 1): void {
    ecrire(p, j.nom, x0, y - 1, COQUE[4])
    const bx = x0 + colonneDesJauges()
    const bw = W - 12 - bx
    const teinte = j.nom === 'Bouclier' ? VERRIERE[2] : rouge ? ROUGE[3] : PEPITE[2]
    const clair = j.nom === 'Bouclier' ? VERRIERE[3] : rouge ? ROUGE[5] : N.hex('#ffe68a')
    const sombre = j.nom === 'Bouclier' ? VERRIERE[1] : rouge ? ROUGE[2] : N.hex('#a8650f')
    if (j.nombre) {
      ecrire(p, j.unite === undefined ? String(j.valeur) : `${j.valeur} ${j.unite}`, bx, y - 1, N.hex('#fff2c8'), { police: GRAS })
      return
    }
    if (j.cellules) {
      const n = Math.max(1, Math.round(j.max))
      const lc = Math.floor((bw - (n - 1)) / n)
      for (let i = 0; i < n; i++) {
        const cx = bx + i * (lc + 1)
        p.rect(cx, y, lc, 6, MATIERES.creux.contour)
        p.rect(cx + 1, y + 1, lc - 2, 4, MATIERES.creux.corps)
        if (i < Math.round(j.valeur)) {
          p.rect(cx + 1, y + 1, lc - 2, 4, teinte)
          p.rect(cx + 1, y + 1, lc - 2, 1, clair)
          p.rect(cx + 1, y + 4, lc - 2, 1, sombre)
        }
      }
      if (repere !== null) {
        const k = Math.round(repere * n)
        p.rect(bx + k * (lc + 1) - 1, y - 1, 1, 8, N.WHITE)
      }
      return
    }
    const part = j.valeur / j.max
    p.rect(bx, y, bw, 6, MATIERES.creux.contour)
    p.rect(bx + 1, y + 1, bw - 2, 4, MATIERES.creux.corps)
    p.rect(bx + 1, y + 1, bw - 2, 1, MATIERES.creux.ombre)
    const lp = Math.round((bw - 2) * Math.min(1, part))
    if (lp > 0) {
      p.rect(bx + 1, y + 1, lp, 4, teinte)
      p.rect(bx + 1, y + 1, lp, 1, clair)
      p.rect(bx + 1, y + 4, lp, 1, sombre)
      p.rect(bx + lp, y + 1, 1, 4, N.WHITE)
      // l'éclat qui parcourt la barre une fois remplie
      if (plein >= 1) {
        const u = (t * 0.6 + y * 0.013) % 1
        const xe = bx + 1 + Math.round(u * (lp + 12)) - 6
        for (let k = 0; k < 3; k++) if (xe + k > bx && xe + k < bx + lp) p.rect(xe + k, y + 1, 1, 4, k === 1 ? N.WHITE : clair)
      }
    }
    if (repere !== null) p.rect(bx + 1 + Math.round((bw - 2) * Math.min(1, repere)) - 1, y - 1, 1, 8, N.WHITE)
  }

  /**
   * LA FICHE DU MINERAI, sous l'inventaire : son icône et son nom en relief, sa description sur trois lignes fixes, sa
   * valeur unitaire et le stock, et VENDRE — les pièces volent jusqu'au compteur, qui roule.
   */
  function dessinerLEntrepot(p: Peintre, y: number): number {
    const k = mineraiChoisi
    const fiche = FICHES_MINERAI[k]
    const LIGNES = 4 // (quatre lignes fixes : avec les minuscules, les descriptions en prennent une de plus)
    const L = replier(fiche.dit, W - 20).slice(0, LIGNES)
    const hp = 20 + LIGNES * 9 + 8 + 26 + 20
    plaque(p, 4, y, W - 8, hp, 'encre')
    const ln = largeurDe(fiche.nom, GRAS)
    dessinerUneRessource(p, W / 2 - ln / 2 - 5, y + 10, k)
    motEnRelief(p, fiche.nom, W / 2 + 5, y + 7, true)
    const haut = y + 20 + Math.floor(((LIGNES - L.length) * 9) / 2)
    L.forEach((li, i) => ecrire(p, li, W / 2, haut + i * 9, COQUE[5], { align: 'center' }))
    const ly = y + 20 + LIGNES * 9 + 8
    p.rect(10, ly - 4, W - 20, 1, MATIERES.encre.ombre)
    ecrire(p, 'Valeur unitaire', 10, ly, COQUE[4])
    nombreDeCredits(p, fiche.credits, W - 9, ly, N.hex('#fff2c8'))
    ecrire(p, 'En stock', 10, ly + 12, COQUE[4])
    ecrire(p, String(tresor[k]), W - 21, ly + 12, tresor[k] > 0 ? N.WHITE : COQUE[3], { police: GRAS, align: 'right' })
    dessinerUneRessource(p, W - 13, ly + 15, k)
    const by = ly + 26
    const gain = tresor[k] * fiche.credits
    const vif = tresor[k] > 0
    const mot = vif ? `Vendre : ${gain}` : 'Rien à vendre'
    const wmot = largeurDe(mot, GRAS)
    const bw = wmot + (vif ? 12 : 0) + 22
    const bx = Math.round(W / 2 - bw / 2)
    boutonBase(p, bx, by, bw, 15, vif, () => {
      const n = Math.min(10, tresor[k])
      const r = vendre(tresor, credits, k)
      tresor = r.tresor
      credits = r.credits
      sauver()
      secouer(0.8)
      for (let i = 0; i < n; i++) volantes.push({ x0: W / 2 + (R.next() - 0.5) * 30, y0: by + 6, t0: t + i * 0.05 })
      gerbe(W / 2, by + 6, 14, [RUNE[2], RUNE[3], N.WHITE])
    }, (dx, dy) => {
      if (vif) motEnRelief(p, mot, bx + 11 + wmot / 2 + dx, by + 4 + dy, true)
      else ecrire(p, mot, bx + 11 + dx, by + 4 + dy, COQUE[3], { police: GRAS })
      if (vif) dessinerUnCredit(p, bx + 11 + wmot + 7 + dx, by + 7 + dy)
    }, 'vente', { matiere: 'vert' })
    return y + hp + 4
  }
  /** Un point de l'écran en pixels du tampon. */
  const enTampon = (x: number, y: number): Vecteur => {
    const r = canvas.getBoundingClientRect()
    return { x: (x - r.left) / zoom, y: (y - r.top) / zoom }
  }
  /** Une zone touchée : elle s'enfonce, agit, et sonne. */
  function appuyer(z: { x: number; y: number; action: () => void; son?: Son | null }): void {
    enfonce = { x: z.x, y: z.y, t0: t }
    z.action()
    const son = z.son === undefined ? 'clic' : z.son
    if (son !== null) jouer(son)
  }
  racine.addEventListener('pointerdown', (ev) => {
    reveiller() // (le contexte audio ne naît que sur un geste)
    if (accueil) {
      quitterLAccueil()
      return
    }
    if (ecranVisible()) {
      // l'écran en pixels : sur la liste, un glisser commence (la tape se décide au relâchement) ; ailleurs, une tape sur une zone
      if (decollageA !== null) return // (le vaisseau part : plus rien ne répond)
      const q = enTampon(ev.clientX, ev.clientY)
      const g = zoneGlissante
      if (g !== null && q.x >= g.x && q.x < g.x + g.w && q.y >= g.y && q.y < g.y + g.h) {
        glisse = { x: q.x, y: q.y, defil0: defil[onglet], bouge: false, sorte: 'liste' }
        racine.setPointerCapture(ev.pointerId) // (la souris qui sort du canvas garde le glisser)
        return
      }
      const go = zoneDesOnglets
      if (go !== null && q.x >= go.x && q.x < go.x + go.w && q.y >= go.y && q.y < go.y + go.h) {
        glisse = { x: q.x, y: q.y, defil0: defilOnglets, bouge: false, sorte: 'onglets' }
        racine.setPointerCapture(ev.pointerId)
        return
      }
      const z = zones.find((z) => q.x >= z.x && q.x < z.x + z.w && q.y >= z.y && q.y < z.y + z.h)
      if (z !== undefined) appuyer(z)
      return
    }
    if (manche !== null) return
    ev.preventDefault()
    racine.setPointerCapture(ev.pointerId)
    const p = { x: ev.clientX, y: ev.clientY }
    manche = { id: ev.pointerId, centre: p, doigt: p }
  })
  racine.addEventListener('pointermove', (ev) => {
    // LE SURVOL, à la souris (PC) : ce qu'on survole s'éclaire, et le pointeur devient une main
    if (ev.pointerType === 'mouse') {
      if (ecranVisible()) {
        const sv = enTampon(ev.clientX, ev.clientY)
        survol = sv
        canvas.style.cursor = zones.some((z) => sv.x >= z.x && sv.x < z.x + z.w && sv.y >= z.y && sv.y < z.y + z.h) ? 'pointer' : ''
      } else if (survol !== null) {
        survol = null
        canvas.style.cursor = ''
      }
    }
    if (glisse !== null) {
      // la liste suit le doigt, une rangée par 13 pixels de tampon
      const q = enTampon(ev.clientX, ev.clientY)
      if (Math.abs(q.y - glisse.y) > 2) glisse.bouge = true
      if (glisse.sorte === 'onglets') defilOnglets = glisse.defil0 - (q.y - glisse.y) / 37 // (la feuille « PLUS » défile d'une rangée par 37 pixels)
      else defil[onglet] = glisse.defil0 - (q.y - glisse.y) / 13
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
        if (z !== undefined) appuyer(z)
      }
      if (glisse.sorte === 'liste') defil[onglet] = Math.round(defil[onglet])
      else defilOnglets = Math.round(defilOnglets)
      glisse = null
    }
    if (manche !== null && ev.pointerId === manche.id) manche = null
  }
  // LA MOLETTE, sur PC (Keko : « sur PC je ne peux pas scroller la barre d'onglets ») : sur la grille d'onglets, elle la
  // fait défiler au pixel ; sur la liste des pièces, d'une rangée par cran
  racine.addEventListener('wheel', (ev) => {
    if (!ecranVisible()) return
    const q = enTampon(ev.clientX, ev.clientY)
    const dans = (z: { x: number; y: number; w: number; h: number } | null): boolean => z !== null && q.x >= z.x && q.x < z.x + z.w && q.y >= z.y && q.y < z.y + z.h
    const pas = ev.deltaMode === 1 ? ev.deltaY * 16 : ev.deltaY
    if (dans(zoneDesOnglets)) {
      ev.preventDefault()
      defilOnglets = Math.round(defilOnglets) + Math.sign(pas)
    } else if (dans(zoneGlissante)) {
      ev.preventDefault()
      defil[onglet] = Math.round(defil[onglet]) + Math.sign(pas)
    }
  }, { passive: false })
  racine.addEventListener('pointerleave', () => {
    survol = null
  })
  racine.addEventListener('pointerup', lever)
  racine.addEventListener('pointercancel', lever)
  window.addEventListener('keydown', (ev) => {
    reveiller()
    if (accueil) {
      quitterLAccueil()
      return
    }
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
  /**
   * LES NUÉES DU FOND, EN PIXELS (Keko, 11/11 : le vol au niveau de la base). Elles étaient des lueurs du tampon de
   * LUMIÈRE : un dégradé lisse — le seul du jeu —, coupé net au bord du canevas. Ce sont maintenant des aplats sombres
   * à trois tons, aux frontières TRAMÉES, cuits dans le FOND que la composition met sous tout le reste (`composite`
   * prend un fond par pixel). Un bruit de valeur à trois octaves dit la densité, un bruit lent dit la teinte ; les
   * deux sont lus sur une grille de quatre pixels ACCROCHÉE AU MONDE et interpolés (au pixel, c'était seize hachages
   * par pixel et par image), et la trame est indexée sur le monde elle aussi : rien ne fourmille quand le ciel glisse.
   * Recuit seulement quand la caméra a bougé d'un pixel de ce plan (parallaxe 0,1). Les nuées s'éteignent vers les
   * deux bords : la coupe du canevas ne se voit plus.
   */
  const PARALLAXE_DES_NUEES = 0.1
  const TRAME = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((n) => (n + 0.5) / 16)
  const melange = (a: number, b: number, k: number): number => {
    const r = (a & 255) + ((b & 255) - (a & 255)) * k
    const g = ((a >>> 8) & 255) + (((b >>> 8) & 255) - ((a >>> 8) & 255)) * k
    const bl = ((a >>> 16) & 255) + (((b >>> 16) & 255) - ((a >>> 16) & 255)) * k
    return ((255 << 24) | (Math.round(bl) << 16) | (Math.round(g) << 8) | Math.round(r)) >>> 0
  }
  /** Les tons des nuées, par teinte : le fond, puis trois pas vers la couleur — sombres, le décor ne dispute rien aux roches. */
  const TONS_DES_NUEES = COULEURS_NEBULEUSE.map((c) => [FOND, melange(FOND, c, 0.2), melange(FOND, c, 0.36), melange(FOND, c, 0.54)])
  const hacheDuCiel = (x: number, y: number, g: number): number => {
    let h = (Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(g, 1442695041)) | 0
    h = Math.imul(h ^ (h >>> 13), 1274126177)
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296
  }
  const bruitDuCiel = (x: number, y: number, g: number): number => {
    const i = Math.floor(x)
    const j = Math.floor(y)
    const fx = x - i
    const fy = y - j
    const ux = fx * fx * (3 - 2 * fx)
    const uy = fy * fy * (3 - 2 * fy)
    const a = hacheDuCiel(i, j, g)
    const b = hacheDuCiel(i + 1, j, g)
    const c = hacheDuCiel(i, j + 1, g)
    const d = hacheDuCiel(i + 1, j + 1, g)
    return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy
  }
  let fondDuCiel = new Uint32Array(0)
  let cleDuCiel = ''
  let grilleDensite = new Float32Array(0)
  let grilleTeinte = new Float32Array(0)
  function cuireLeCiel(): Uint32Array {
    const px = Math.floor(camera.x * PARALLAXE_DES_NUEES) - (W >> 1)
    const py = Math.floor(camera.y * PARALLAXE_DES_NUEES) - (H >> 1)
    const cle = `${px},${py},${H}`
    if (cle === cleDuCiel) return fondDuCiel
    cleDuCiel = cle
    if (fondDuCiel.length !== W * H) fondDuCiel = new Uint32Array(W * H)
    const PAS = 4
    const gx0 = Math.floor(px / PAS)
    const gy0 = Math.floor(py / PAS)
    const gw = Math.ceil(W / PAS) + 2
    const gh = Math.ceil(H / PAS) + 2
    if (grilleDensite.length < gw * gh) {
      grilleDensite = new Float32Array(gw * gh)
      grilleTeinte = new Float32Array(gw * gh)
    }
    for (let gj = 0; gj < gh; gj++)
      for (let gi = 0; gi < gw; gi++) {
        const wx = (gx0 + gi) * PAS
        const wy = (gy0 + gj) * PAS
        grilleDensite[gj * gw + gi] = 0.55 * bruitDuCiel(wx / 92, wy / 92, 1) + 0.3 * bruitDuCiel(wx / 39, wy / 39, 2) + 0.15 * bruitDuCiel(wx / 17, wy / 17, 3)
        grilleTeinte[gj * gw + gi] = bruitDuCiel(wx / 240, wy / 240, 4)
      }
    const nTeintes = TONS_DES_NUEES.length
    for (let iy = 0; iy < H; iy++) {
      const wy = py + iy
      const gy = wy / PAS - gy0
      const j = Math.floor(gy)
      const fy = gy - j
      for (let ix = 0; ix < W; ix++) {
        const wx = px + ix
        const gx = wx / PAS - gx0
        const i = Math.floor(gx)
        const fx = gx - i
        const k = j * gw + i
        const lire = (G: Float32Array): number => {
          const haut = G[k] + (G[k + 1] - G[k]) * fx
          const bas = G[k + gw] + (G[k + gw + 1] - G[k + gw]) * fx
          return haut + (bas - haut) * fy
        }
        const trame = TRAME[((wy & 3) << 2) | (wx & 3)]
        // la densité : rien sous 0,5, pleine à 0,72 ; éteinte vers les deux bords du canevas
        const bord = Math.min(1, Math.min(ix, W - 1 - ix) / 16)
        const d = Math.max(0, Math.min(1, (lire(grilleDensite) - 0.5) / 0.22)) * bord
        // trois tons, la frontière tramée sur la moitié du pas
        const f = d * 3
        const ton = Math.min(3, Math.floor(f) + (f - Math.floor(f) > 0.5 + (trame - 0.5) * 0.6 ? 1 : 0))
        const tt = Math.max(0, Math.min(0.999, (lire(grilleTeinte) - 0.28) / 0.44)) * nTeintes
        const teinte = Math.max(0, Math.min(nTeintes - 1, Math.floor(tt + (trame - 0.5) * 0.5)))
        fondDuCiel[iy * W + ix] = TONS_DES_NUEES[teinte][ton]
      }
    }
    return fondDuCiel
  }

  /** Le ciel : trois couches d'étoiles en parallaxe, puis la poussière du premier plan ; les nuées sont dans le fond (`cuireLeCiel`). */
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
      const j0 = Math.floor((oy - centreY()) / couche.pas) - 1
      for (let j = j0; j <= j0 + Math.ceil(H / couche.pas) + 2; j++)
        for (let i = i0; i <= i0 + Math.ceil(W / couche.pas) + 2; i++) {
          if (tire(i, j, 11 + n) > couche.proba) continue
          const x = (i + tire(i, j, 21 + n)) * couche.pas - ox + W / 2
          const y = (j + tire(i, j, 31 + n)) * couche.pas - oy + centreY()
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
    // LA POUSSIÈRE DU PREMIER PLAN : des grains sombres FIXES DANS LE MONDE (parallaxe 1, celle des roches), qui
    // s'étirent en traits à contre-vitesse quand on file — la vitesse se lit même loin de toute roche
    const vit = Math.hypot(v.vx, v.vy)
    const trait = Math.min(3, (vit / CONF.vitesseMax) * 3)
    const ux = vit > 1 ? v.vx / vit : 0
    const uy = vit > 1 ? v.vy / vit : 0
    const pas = 52
    const i0 = Math.floor((camera.x - W / 2) / pas) - 1
    const j0 = Math.floor((camera.y - centreY()) / pas) - 1
    for (let j = j0; j <= j0 + Math.ceil(H / pas) + 2; j++)
      for (let i = i0; i <= i0 + Math.ceil(W / pas) + 2; i++) {
        if (tire(i, j, 81) > 0.55) continue
        const x = (i + tire(i, j, 82)) * pas - camera.x + W / 2
        const y = (j + tire(i, j, 83)) * pas - camera.y + centreY()
        if (trait >= 1) p.line(x, y, x - ux * trait, y - uy * trait, COQUE[1])
        p.dot(x, y, COQUE[2])
      }
  }

  /**
   * LES BORDS DE L'ÉCRAN DU VOL : la même vignette tramée que la scène de la base, sur les deux côtés (le canevas
   * s'arrête avant le bord du téléphone : le monde s'y fond au lieu d'être coupé) ; par-dessus, L'ALERTE — un coup
   * dans la coque rougit les quatre bords un tiers de seconde, un coup dans le bouclier les bleuit, et au DERNIER
   * point de coque le rouge reste et bat lentement.
   */
  function dessinerLesBords(p: Peintre): void {
    for (let k = 0; k < 4; k++) {
      const a = 0.55 - k * 0.13
      p.rect(k, 0, 1, H, FOND, a)
      p.rect(W - 1 - k, 0, 1, H, FOND, a)
    }
    const du = t - toucheA
    const db = t - bouclierA
    const dernier = m.phase === 'vol' && m.coque <= 1
    const rouge = du < 0.3 ? 1 - du / 0.3 : dernier ? 0.3 + 0.18 * Math.sin(t * 5) : 0
    const bleu = db < 0.3 ? 1 - db / 0.3 : 0
    const force = Math.max(rouge, bleu)
    if (force <= 0) return
    const c = rouge >= bleu ? ROUGE[3] : VERRIERE[1]
    for (let k = 0; k < 6; k++) {
      const a = force * (0.7 - k * 0.12)
      // (les bords de la VUE, pas ceux du tampon : les bandeaux ne rougissent pas)
      const y0 = bandeHaut()
      const y1 = H - bandeBas()
      p.rect(0, y0 + k, W, 1, c, a)
      p.rect(0, y1 - 1 - k, W, 1, c, a)
      p.rect(k, y0 + 6, 1, y1 - y0 - 12, c, a)
      p.rect(W - 1 - k, y0 + 6, 1, y1 - y0 - 12, c, a)
    }
  }

  /**
   * UN VAISSEAU EN VOL (le joueur ou le rival) : LE MÊME RENDU PIXEL PAR PIXEL QUE CELUI DU HANGAR (Keko, 11/11 : « la
   * même amélioration graphique sur la partie en vol, afin que le jeu entier ait une cohérence ») — les mêmes formes,
   * les mêmes matières, tournées vers son cap, à UN pixel l'unité. Deux différences avec le hangar : la lumière est celle
   * DU MONDE (elle ne tourne pas avec lui : c'est celle des roches et de la station), et le canon du foreur suit sa
   * cible (`vise`, un angle dans le repère du vaisseau). Autour : la lueur de la tuyère et de la verrière, les feux de
   * position qui clignotent au bout des ailes, l'anneau du bouclier. Le rival est le châssis de série dans SES matières.
   */
  const MATIERES_DU_RIVAL = { coque: 'carmin', aile: 'grenat', verre: 'ambre', rouge: 'or', laser: 'violet' } as const
  function dessinerUnVaisseau(p: Peintre, corps: Vaisseau, flam: number, vise: number, allure: Allure, blanchi: boolean, rival: boolean): void {
    // (au pixel entier : entre deux pixels, la silhouette changerait à chaque image)
    const sx = Math.round(corps.x - camera.x + W / 2)
    const sy = Math.round(corps.y - camera.y + centreY())
    const ca = Math.cos(corps.cap)
    const sa = Math.sin(corps.cap)
    const ici = (x: number, y: number): [number, number] => [sx + x * ca - y * sa, sy + x * sa + y * ca]
    const cp = allure.propulseur
    if (flam > 0.02) {
      const [fx, fy] = ici(-8.4 - 0.5 * (cp - 1) - (1 + 3 * flam), 0)
      p.glow(fx, fy, 5 + 7 * flam + 2 * (cp - 1), rival ? FEU[4] : cp >= 3 ? ION[4] : FEU[5], 0.4 + 0.45 * flam + 0.08 * Math.sin(t * 9))
    }
    peindreFormes(p, formesDuVaisseau(allure, flam, t, vise), sx, sy, 1, { cap: corps.cap, lumiere: LUMIERE_DU_VOL, blanc: blanchi ? 1 : 0, matieres: rival ? MATIERES_DU_RIVAL : undefined, reflet: rival ? REFLET_DU_RIVAL : REFLET_DU_VOL })
    const [vx, vy] = ici(3.4, 0)
    p.glow(vx, vy, 4, rival ? VERRIERE_ENNEMIE[1] : VERRIERE[2], 0.3)
    // les feux de position, au bout des ailes : rouge à bâbord, vert à tribord ; le rival, deux feux d'ambre
    if (!blanchi && Math.floor(t * 1.5 + (rival ? 0.5 : 0)) % 2 === 0)
      for (const s of [-1, 1]) {
        const [ax, ay] = ici(-7.6, s * 8.2)
        const c = rival ? VERRIERE_ENNEMIE[2] : N.hex(s < 0 ? '#ff4a4a' : '#4aff7a')
        p.rect(Math.round(ax - 0.5), Math.round(ay - 0.5), 1, 1, N.WHITE)
        p.glow(ax, ay, 3, c, 0.8)
      }
    if (allure.bouclier > 0) p.ring(sx, sy, 11, 1, VERRIERE[2], 0.25 + 0.35 * allure.bouclier * (0.75 + 0.25 * Math.sin(t * 6)))
  }

  function dessinerLeVaisseau(p: Peintre): void {
    const vise = m.forage !== null ? Math.atan2(m.forage.y - v.y, m.forage.x - v.x) - v.cap : 0
    const blanchi = t - toucheA < 0.1 || m.phase === 'extrait' || t - arriveA < REFROIDI_A
    const al = allureMontee(CONF.bouclier.points > 0 ? m.bouclier / CONF.bouclier.points : 0)
    dessinerUnVaisseau(p, v, flamme, vise, al, blanchi, false)
    // le bouclier qui prend un coup : son anneau flashe blanc et s'ouvre
    if (t - bouclierA < 0.25) {
      const k = 1 - (t - bouclierA) / 0.25
      p.place(W / 2 - camera.x, centreY() - camera.y)
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
      dessinerUnVaisseau(p, b, flammesEnnemies.get(e.id) ?? 0, vise, ALLURE_SERIE, blanchi, true)
      // sa vie restante, sous lui (Keko : « afficher la vie restante des ennemis et astéroïdes »)
      dessinerUneJauge(p, b.x - camera.x + W / 2, b.y - camera.y + centreY() + CONF.ennemi.rayon + 4, 12, e.pv / CONF.ennemi.pv, ROUGE[4], ROUGE[5], blanchi)
    }
  }

  /**
   * Une jauge de vie en pixels, dans la langue des plaques : DEUX pixels de haut (le dessus `clair`, le dessous
   * `teinte` : un jonc éclairé d'en haut), un creux sombre, le contour d'encre aux coins coupés ; large de `w`, pleine
   * à `part` ; `chaud` la blanchit (on vient de frapper). Le peintre est supposé à l'origine, (x, y) en coordonnées du
   * tampon, centrées.
   */
  function dessinerUneJauge(p: Peintre, x: number, y: number, w: number, part: number, teinte: number, clair: number, chaud: boolean): void {
    const x0 = Math.round(x - w / 2)
    const yy = Math.round(y)
    const encre = MATIERES.encre.contour
    p.rect(x0, yy - 1, w, 4, encre)
    p.rect(x0 - 1, yy, w + 2, 2, encre)
    p.rect(x0, yy, w, 2, COQUE[1])
    const plein = Math.max(part > 0 ? 1 : 0, Math.round(w * Math.min(1, part)))
    if (plein > 0) {
      p.rect(x0, yy, plein, 1, chaud ? N.WHITE : clair)
      p.rect(x0, yy + 1, plein, 1, chaud ? N.WHITE : teinte)
    }
  }

  /** Les traits de l'ennemi : un fuseau violet-blanc le long de sa vitesse, une lueur. */
  function dessinerLesTirs(p: Peintre): void {
    p.place(W / 2 - camera.x, centreY() - camera.y)
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
  function dessinerUnLaser(p: Peintre, depuis: Vaisseau, f: Forage, teintes: number[], cran: number): void {
    // (il part de la bouche du canon dessiné : le pivot et la longueur sont ceux du peintre, lus, pas recopiés)
    const canon = canonDeLaForeuse(cran)
    const vise = Math.atan2(f.y - depuis.y, f.x - depuis.x)
    const x0 = depuis.x + Math.cos(depuis.cap) * canon.pivot + Math.cos(vise) * canon.bouche
    const y0 = depuis.y + Math.sin(depuis.cap) * canon.pivot + Math.sin(vise) * canon.bouche
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
    p.place(W / 2 - camera.x, centreY() - camera.y)
    if (m.forage !== null && m.phase === 'vol') dessinerUnLaser(p, v, m.forage, LASER, Math.max(1, foreuseMontee(hangar)?.cran ?? 1))
    for (const e of m.ennemis) if (e.forage !== null) dessinerUnLaser(p, e.corps, e.forage, VIOLET, ALLURE_SERIE.foreuse)
    p.place(0, 0)
  }

  /** Les stations d'extraction en vue (leur dessin est dans `station.ts`), leur parvis, et les pépites déposées qui y volent. */
  function dessinerLesStations(p: Peintre): void {
    const proche = stationLaPlusProche(CONF, v.x, v.y)
    const i0 = Math.round(camera.x / CONF.station.case)
    const j0 = Math.round(camera.y / CONF.station.case)
    for (let j = j0 - 1; j <= j0 + 1; j++)
      for (let i = i0 - 1; i <= i0 + 1; i++) {
        if (CONF.station.seule && (i !== 0 || j !== 0)) continue // (une seule station pour l'instant : la base)
        const st = stationDeLaCase(CONF, i, j)
        const sx = st.x - camera.x + W / 2
        const sy = st.y - camera.y + centreY()
        // la station du départ est LA BASE, une vraie station spatiale (`dessinerBase`) ; les autres, des extracteurs
        const base = i === 0 && j === 0
        const marge = base ? ENVERGURE_BASE : 40
        if (sx < -marge || sy < -marge || sx > W + marge || sy > H + marge) continue
        const aQuai = m.phase !== 'perdu' && st.x === proche.x && st.y === proche.y && Math.hypot(v.x - st.x, v.y - st.y) <= CONF.station.portee
        // le parvis : un cercle pointillé qui dit la portée, plus net à quai
        for (let k = 0; k < 36; k++) {
          const a = (k / 36) * Math.PI * 2 + t * 0.25
          p.dot(sx + Math.cos(a) * CONF.station.portee, sy + Math.sin(a) * CONF.station.portee, aQuai ? PEPITE[2] : COQUE[2], aQuai ? 0.9 : 0.45)
        }
        if (base) dessinerBase(p, sx, sy, t, aQuai, TEINTES_STATION)
        else dessinerStation(p, sx, sy, t, CONF.station.rayon, aQuai, TEINTES_STATION)
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
              etincelles.ajouter('etincelle', hx - W / 2 + camera.x, hy - centreY() + camera.y, Math.cos(an) * vit, Math.sin(an) * vit, R.range(0.25, 0.6), R.next() < 0.5 ? PEPITE[3] : PEPITE[4], 1, 2)
            }
          }
          p.glow(sx, sy, CONF.station.portee * 1.3, PEPITE[2], 0.1 + 0.35 * u * bat)
          if (m.phase === 'extrait') p.glow(sx, sy, CONF.station.portee * 1.6, PEPITE[2], 0.5 + 0.2 * Math.sin(t * 6))
          else {
            // le nombre de secondes, en RELIEF D'OR (le mot des titres de la base), AU-DESSUS de l'anneau (dedans, la
            // tête de l'arc et sa lueur le couvraient) : à chaque seconde qui tombe il saute d'un pixel et un reflet
            // le traverse
            const reste = CONF.extraction.duree - m.extraction
            const depuis = Math.ceil(reste) - reste
            motEnRelief(p, String(Math.ceil(reste)), sx, sy - CONF.station.portee - 22 - (depuis < 0.1 ? 1 : 0), true, TITRE, depuis < 0.4 ? Math.round((depuis / 0.4) * 30) - 8 : null)
          }
        }
      }
  }

  /**
   * LE BAS DE L'INTERFACE DU HAUT (la plaque de soute, puis les pastilles du porté) : les flèches du bord restent
   * dessous, pour ne jamais passer sous une plaque.
   */
  const BAS_DU_HUD = 5 + 18 + 3 + 13
  /**
   * LA VUE DU VOL EST FIXE : 180 × 320, sur tous les écrans (Keko, 11/11 : « selon le portable ou l'écran de PC, la zone
   * visible de l'espace en jeu est différente » — le tampon prenait la hauteur de l'écran, de 320 à 480 : un grand
   * téléphone voyait moitié plus d'espace en haut et en bas qu'un petit). Le monde se dessine autour de `centreY`, le
   * milieu de la vue ; ce qui dépasse des 320 de la vue est couvert par DEUX BANDEAUX, en haut et en bas, donnés à l'interface :
   * celui du haut porte la soute, le porté et la coque (posés juste au-dessus de la vue dès qu'il est assez haut — sinon
   * en haut de l'écran, sur la vue, comme avant), celui du bas est la place du pouce. Les pixels restent entiers.
   */
  const VUE = 320
  /**
   * Le partage du surplus : LE HAUT D'ABORD, jusqu'à la hauteur de l'interface (la soute et le porté tiennent alors
   * entiers dans leur bandeau, la limite de la vue ne les coupe pas — Keko : « la ligne tombe sur le conteneur de la
   * soute ») ; au-delà, moitié-moitié. Le centre de la vue n'est donc plus toujours celui du tampon : `centreY`.
   */
  const bandeHaut = (): number => {
    const surplus = Math.max(0, H - VUE)
    return Math.max(Math.min(surplus, BAS_DU_HUD + 4), Math.floor(surplus / 2))
  }
  const bandeBas = (): number => Math.max(0, H - VUE) - bandeHaut()
  /** Le centre de la vue dans le tampon (là où se dessine le point que vise la caméra). */
  function centreY(): number {
    return bandeHaut() + Math.min(H, VUE) / 2
  }
  /** Le haut de l'interface du vol (la plaque de soute), et son bas (sous les pastilles du porté). */
  const hautDuHud = (): number => Math.max(5, bandeHaut() - (BAS_DU_HUD - 5) - 4)
  const basDuHud = (): number => hautDuHud() + BAS_DU_HUD - 5
  /**
   * Les deux bandeaux, DISCRETS (Keko : « un peu plus discrètes ») : un aplat de la couleur du fond de la page — la
   * même que les marges à gauche et à droite du canevas (il fait 180 × un grossissement ENTIER : la largeur qui reste
   * est une marge), si bien que la vue est dans un seul cadre uni — sans plaque, ni grain, ni filet ; le bord de la vue
   * s'y fond par la même trame que ses côtés (`dessinerLesBords`).
   */
  function dessinerLesBandeaux(p: Peintre): void {
    const h = bandeHaut()
    const b = bandeBas()
    // (LES LUEURS aussi : le tampon a deux couches, la couleur et la LUMIÈRE, ajoutée par-dessus — un aplat opaque
    // couvre la première, pas la seconde ; les halos des pépites, des tirs, des tuyères du rival et des grosses étoiles
    // brillaient donc à travers les bandeaux — Keko : « pas opaques, l'avantage visuel persiste » ; on éteint la lumière
    // sous eux avant de les poser, celle de l'interface vient après)
    frame.light.fill(0, 0, h * W)
    frame.light.fill(0, (H - b) * W)
    if (h > 0) {
      p.rect(0, 0, W, h, FOND)
      for (let k = 0; k < 4; k++) p.rect(0, h + k, W, 1, FOND, 0.55 - k * 0.13)
    }
    if (b > 0) {
      p.rect(0, H - b, W, b, FOND)
      for (let k = 0; k < 4; k++) p.rect(0, H - b - 1 - k, W, 1, FOND, 0.55 - k * 0.13)
    }
  }
  /** Le point du bord de l'écran dans la direction (dx, dy) depuis son centre ; `null` si la cible est à l'écran. */
  function auBord(dx: number, dy: number): { x: number; y: number } | null {
    const marge = 10
    const cote = W / 2 - marge
    // (dans la vue : sous l'interface du haut ou le bandeau, au-dessus du bandeau du bas)
    const haut = centreY() - Math.max(bandeHaut(), basDuHud()) - 9
    const bas = H - bandeBas() - centreY() - marge
    if (Math.abs(dx) < cote && dy > -haut && dy < bas) return null
    const k = Math.min(cote / Math.max(1e-6, Math.abs(dx)), (dy < 0 ? haut : bas) / Math.max(1e-6, Math.abs(dy)))
    return { x: W / 2 + dx * k, y: centreY() + dy * k }
  }
  /**
   * UNE FLÈCHE DU BORD, dans la langue des plaques : un fer de flèche (une pointe autour d'une encoche), cerné
   * d'encre, la moitié tournée vers la lumière du monde (en haut à gauche) d'un ton plus clair, une lueur.
   */
  function dessinerUneFleche(p: Peintre, x: number, y: number, a: number, corps: number, clair: number, lueur: number): void {
    const cx = Math.round(x)
    const cy = Math.round(y)
    const ca = Math.cos(a)
    const sa = Math.sin(a)
    // le fer, PIXEL PAR PIXEL dans son repère (u le long de la visée, w en travers) : deux triangles fins tracés au
    // polygone donnaient une tache à cette taille ; 0 dehors, 1 et 2 ses deux moitiés
    const fer = (i: number, j: number): number => {
      const u = i * ca + j * sa
      const w = j * ca - i * sa
      const l = Math.abs(w)
      if (u > 5.4 || u < -4.4 || l > (5.4 - u) * 0.6) return 0
      if (u < -1.4 && l < (-1.4 - u) * 1.3) return 0
      return w < 0 ? 1 : 2
    }
    // la moitié éclairée est celle qui regarde en haut à gauche (la lumière du monde)
    const eclairee = 0.8 * ca - 0.6 * sa > 0 ? 1 : 2
    const encre = MATIERES.encre.contour
    for (let j = -8; j <= 8; j++)
      for (let i = -8; i <= 8; i++) {
        const moitie = fer(i, j)
        if (moitie !== 0) p.px(cx + i, cy + j, moitie === eclairee ? clair : corps)
        else if (fer(i - 1, j) + fer(i + 1, j) + fer(i, j - 1) + fer(i, j + 1) !== 0) p.px(cx + i, cy + j, encre)
      }
    p.glow(cx, cy, 7, corps, lueur)
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
    const ou = auBord(dx, dy)
    if (ou === null) return
    dessinerUneFleche(p, ou.x, ou.y, Math.atan2(dy, dx), PEPITE[2], PEPITE[3], 0.4)
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
    const ou = auBord(dx, dy)
    if (ou === null) return
    const bat = Math.sin(t * 8) > 0
    dessinerUneFleche(p, ou.x, ou.y, Math.atan2(dy, dx), bat ? ROUGE[4] : ROUGE[3], bat ? ROUGE[5] : ROUGE[4], bat ? 0.5 : 0.3)
  }

  /**
   * L'INTERFACE DU VOL, EN PLAQUES (Keko, 11/11 : « le travail fait sur l'interface de la base, sur la partie en
   * vol ») — les plaques d'encre, la lettre et les icônes de la base, à la place du texte cerné posé sur le ciel.
   * EN HAUT À GAUCHE, LA SOUTE : son nom, ce qu'on porte sur ce qu'on peut, et une jauge d'or qui glisse ; pleine, son
   * liseré bat en rouge, la plaque bondit et le dit une fois. DESSOUS, LE PORTÉ : une pastille par minerai qu'on a
   * (fer, or, cristal — Keko : « des tiers de ressources »), l'icône de l'entrepôt et son nombre ; les pépites
   * ramassées y volent, la pastille saute à leur arrivée. RIEN NE MONTRE CE QUI EST DÉJÀ EXTRAIT (Keko : « ne pas
   * afficher les ressources déjà extraites ») : le total ne se lit qu'aux écrans de fin. EN HAUT À DROITE, LA COQUE :
   * un jonc par point (le bouclier d'abord, en cyan) ; touchée, la plaque tremble comme le compteur de crédits qui
   * refuse, et le point perdu éclate ; au dernier point, tout passe au rouge. Le tout TOMBE en place à l'arrivée.
   */
  function dessinerLeScore(p: Peintre): void {
    const yHud = hautDuHud() - Math.round((1 - sortie((t - arriveA - 0.25) / 0.4)) * (basDuHud() + 4))
    const IVOIRE = N.hex('#fff2c8')
    const encre = MATIERES.encre.contour
    const visibles = MINERAIS.filter((k) => affiche[k] > 0 || envols.some((e) => e.minerai === k))
    // les places des pastilles du porté, de gauche à droite, larges de leur nombre
    const yPastilles = yHud + 18 + 3
    const places = new Map<Minerai, { x: number; w: number }>()
    let suivante = 5
    for (const k of visibles) {
      const w = 14 + largeurDe(String(affiche[k]), GRAS) + 5
      places.set(k, { x: suivante, w })
      suivante += w + 2
    }

    // ---- la soute
    const porte = MINERAIS.reduce((n, k) => n + affiche[k], 0)
    const pleine = porte >= CONF.capacite
    if (pleine && !soutePleineVue && t - arriveA > 0.9) {
      ;(ressorts.soute ??= { x: 0, v: 0 }).v = -110
      flottants.push({ texte: 'Soute pleine', x: 46, y: yPastilles + 28, t0: t, c: ROUGE[5] })
      if (typeof navigator.vibrate === 'function') navigator.vibrate([20, 40, 20])
    }
    soutePleineVue = pleine
    const plafond = `${CONF.capacite}/${CONF.capacite}`
    const ws = 5 + largeurDe('Soute') + 8 + largeurDe(plafond, GRAS) + 5
    const ys = yHud + Math.round(rebond('soute', 0))
    const bat = Math.floor(t * 4) % 2 === 0
    plaque(p, 5, ys, ws, 18, 'encre', { bord: pleine ? (bat ? ROUGE[4] : ROUGE[3]) : undefined })
    ecrire(p, 'Soute', 10, ys + 4, COQUE[4])
    ecrire(p, `${porte}/${CONF.capacite}`, 5 + ws - 5, ys + 4, pleine ? ROUGE[5] : IVOIRE, { police: GRAS, align: 'right' })
    // sa jauge : un creux, un jonc d'or au dessus clair
    souteVue = ressort(souteVue, Math.min(1, porte / CONF.capacite))
    const gw = ws - 10
    p.rect(9, ys + 12, gw + 2, 4, encre)
    p.rect(10, ys + 13, gw, 2, MATIERES.creux.lumiere2)
    const plein = Math.max(porte > 0 ? 1 : 0, Math.round(gw * souteVue))
    if (plein > 0) {
      p.rect(10, ys + 13, plein, 1, pleine ? ROUGE[5] : PEPITE[3])
      p.rect(10, ys + 14, plein, 1, pleine ? ROUGE[4] : PEPITE[2])
    }

    // ---- le porté : une pastille par minerai
    for (const k of visibles) {
      const { x, w } = places.get(k)!
      const T = TEINTES_MINERAI[k]
      const allume = t - allumeA[k] < 0.18
      const dy = Math.round(rebond(`porte-${k}`, 0))
      plaque(p, x, yPastilles + dy, w, 13, 'encre', { bord: allume ? T[2] : undefined })
      dessinerUneRessource(p, x + 7, yPastilles + 6 + dy, k)
      ecrire(p, String(affiche[k]), x + 14, yPastilles + 3 + dy, allume ? N.WHITE : IVOIRE, { police: GRAS })
      if (allume) {
        p.glow(x + 7, yPastilles + 6 + dy, 9, T[2], 0.7)
        N.sparkle(p, x + 7, yPastilles + 6 + dy, 1 + 3 * Math.sin(((t - allumeA[k]) / 0.18) * Math.PI), T[4], T[2], 0.5)
      }
    }

    // ---- la coque (et le bouclier, d'abord) : un jonc par point
    const nb = CONF.bouclier.points
    const wp = 5 + (nb + CONF.coque) * 5 - 1 + (nb > 0 ? 3 : 0) + 5
    const du = t - toucheA
    const tremble = du >= 0 && du < 0.3 ? Math.round(Math.sin(du * 70) * 2 * (1 - du / 0.3)) : 0
    const dernier = m.phase === 'vol' && m.coque <= 1
    const xp = W - 5 - wp
    const xDuJonc = (i: number): number => xp + 5 + i * 5 + (nb > 0 && i >= nb ? 3 : 0)
    // le point qui tombe éclate, à sa place
    const entiers = Math.ceil(m.coque - 1e-9)
    for (let i = entiers; i < coqueVue; i++) gerbe(xDuJonc(nb + i) + 2, yHud + 9, 9, [COQUE[5], COQUE[6], N.WHITE], 45)
    coqueVue = entiers
    plaque(p, xp + tremble, yHud, wp, 18, 'encre', { flash: du >= 0 && du < 0.08, bord: dernier ? (bat ? ROUGE[4] : ROUGE[3]) : du < 0.3 ? ROUGE[4] : undefined })
    const jonc = (i: number, part: number, vide: number, ombre: number, corps: number, haut: number, chaud: boolean): void => {
      const x = xDuJonc(i) + tremble
      p.rect(x, yHud + 4, 4, 10, vide)
      if (part <= 0) return
      // il se vide par le haut à mesure que le point s'entame (les chocs coûtent des fractions)
      const h = Math.max(1, Math.round(10 * part))
      const y = yHud + 14 - h
      p.rect(x, y, 4, h, chaud ? N.WHITE : corps)
      if (chaud) return
      p.rect(x, y, 4, 1, haut)
      p.rect(x + 3, y + 1, 1, h - 1, ombre)
    }
    const eclair = Math.floor(t * 16) % 2 === 0
    for (let j = 0; j < nb; j++) jonc(j, Math.max(0, Math.min(1, m.bouclier - j)), VERRIERE[0], VERRIERE[1], VERRIERE[2], VERRIERE[3], t - bouclierA < 0.3 && eclair)
    for (let i = 0; i < CONF.coque; i++) {
      const part = Math.max(0, Math.min(1, m.coque - i))
      if (dernier) jonc(nb + i, part, encre, ROUGE[3], ROUGE[4], ROUGE[5], du < 0.3 && eclair)
      else jonc(nb + i, part, encre, COQUE[4], COQUE[5], COQUE[6], du < 0.3 && eclair)
    }

    // ---- les pépites en vol : de la place du vaisseau à l'écran vers la pastille de leur minerai, en accélérant
    for (let i = envols.length - 1; i >= 0; i--) {
      const e = envols[i]
      const u = (t - e.t0) / 0.45
      if (u >= 1) {
        envols.splice(i, 1)
        affiche[e.minerai] += 1
        allumeA[e.minerai] = t
        ;(ressorts[`porte-${e.minerai}`] ??= { x: 0, v: 0 }).v = -70
        continue
      }
      const T = TEINTES_MINERAI[e.minerai]
      const place = places.get(e.minerai)
      const k = u * u * (3 - 2 * u)
      const x0 = e.x - camera.x + W / 2
      const y0 = e.y - camera.y + centreY()
      const x = x0 + ((place?.x ?? 5) + 7 - x0) * k
      const y = y0 + (yPastilles + 6 - y0) * k
      p.poly([[x, y - 2], [x + 2, y], [x, y + 2], [x - 2, y]], T[2])
      p.dot(x, y - 1, T[3])
      p.glow(x, y, 6, T[2], 0.5)
    }
  }

  /** Les pépites libres, aux teintes de leur minerai. */
  function dessinerLesPepites(p: Peintre): void {
    for (const pe of m.pepites) dessinerPepite(p, pe, t)
  }

  /** Les roches qui passent sur l'accueil : leur place en travers (0 à 1), leur départ, leur vitesse, et de quoi les dessiner. */
  const ROCHES_DE_L_ACCUEIL: { x: number; y: number; vit: number; rayon: number; graine: number; tourne: number; minerai: Minerai; richesse: number }[] = [
    { x: 0.1, y: 0.05, vit: 13, rayon: 13, graine: 9173, tourne: 0.25, minerai: 'fer', richesse: 0.5 },
    { x: 0.9, y: 0.4, vit: 17, rayon: 10, graine: 40311, tourne: -0.4, minerai: 'or', richesse: 0.9 },
    { x: 0.22, y: 0.62, vit: 22, rayon: 7, graine: 7741, tourne: 0.6, minerai: 'cristal', richesse: 1 },
    { x: 0.8, y: 0.85, vit: 11, rayon: 14, graine: 66102, tourne: -0.2, minerai: 'fer', richesse: 0.3 },
    { x: 0.6, y: 0.22, vit: 27, rayon: 5.5, graine: 1289, tourne: 0.9, minerai: 'or', richesse: 0.6 },
  ]
  /**
   * L'ÉCRAN D'ACCUEIL, dans la langue du jeu : on DÉRIVE — le ciel du vol défile (ses étoiles, ses nuées), des roches
   * du champ passent, le vaisseau TEL QU'IL EST MONTÉ au hangar file vers le haut, tuyère allumée ; au-dessus, une NOVA
   * (une étoile qui éclate : son cœur, ses rayons qui tournent, ses halos) et le titre en relief, NOVA en or, DRIFTER
   * en acier, qui tombent en place et qu'un reflet balaie ; en bas, « Toucher pour commencer » qui bat. À la tape, le
   * vaisseau s'arrache vers le haut, tout file, et le hangar s'ouvre.
   */
  function dessinerLAccueil(p: Peintre): void {
    zones = []
    p.place(0, 0)
    const us = accueilQuitteA === null ? 0 : Math.min(1, (t - accueilQuitteA) / SORTIE_DE_L_ACCUEIL)
    const elan = us * us
    const boucle = (a: number, b: number): number => ((a % b) + b) % b
    // on dérive : la caméra file vers le haut, un peu de travers ; à la sortie, tout s'emballe
    camera.x = t * 7
    camera.y = -t * 22 - elan * 500
    dessinerLeCiel(p)
    ROCHES_DE_L_ACCUEIL.forEach((r, i) => {
      const course = H + 90
      const y = boucle(r.y * course + t * r.vit + elan * 380, course) - 45
      dessinerAsteroide(p, { id: i + 1, x: 0, y: 0, rayon: r.rayon, graine: r.graine, angle0: i * 1.3, vitesseAngulaire: r.tourne, minerai: r.minerai, richesse: r.richesse }, t, Math.round(r.x * W), Math.round(y))
    })

    // LE VAISSEAU, celui du hangar, en grand : il respire, sa tuyère souffle une traînée ; à la tape il s'arrache
    const E = 3
    const cx = W / 2
    const sy = Math.round(H * 0.63 + Math.sin(t * 1.4) * 2.5 - Math.pow(Math.max(0, us - 0.15) / 0.85, 2.2) * (H * 0.63 + 70))
    const flam = accueilQuitteA === null ? 0.55 + 0.12 * Math.sin(t * 11) : 1
    const al = allureMontee(0)
    const chaud = al.propulseur >= 3 ? ION : FEU
    const ty = sy + 8.6 * E
    for (let k = 0; k < 18; k++) {
      const u = boucle(t * (1.5 + us * 2) + k / 18, 1)
      p.dot(cx + Math.sin(k * 7.3) * (1.5 + u * 5), ty + 3 + u * (46 + us * 70), chaud[Math.max(1, 6 - Math.floor(u * 5))], (1 - u) * 0.9)
    }
    p.glow(cx, ty, 12 + 16 * flam, al.propulseur >= 3 ? ION[4] : FEU[5], 0.4 + 0.45 * flam + 0.08 * Math.sin(t * 9))
    peindreFormes(p, formesDuVaisseau(al, flam, t), cx, sy, E, {})
    p.glow(cx, sy - 3.4 * E, 9, VERRIERE[2], 0.25)
    if (Math.floor(t * 1.5) % 2 === 0)
      for (const [s, c] of [[-1, N.hex('#ff4a4a')], [1, N.hex('#4aff7a')]] as const) {
        p.rect(Math.round(cx + s * 8.4 * E), Math.round(sy + 7.8 * E), 1, 1, N.WHITE)
        p.glow(Math.round(cx + s * 8.4 * E), Math.round(sy + 7.8 * E), 7, c, 0.7)
      }

    // LE TITRE tombe en place (NOVA, puis DRIFTER) ; derrière lui, la nova
    const eN = largeurDe('NOVA', GRAS) * 4 <= W - 12 ? 4 : 3
    const eD = largeurDe('DRIFTER', GRAS) * 3 <= W - 8 ? 3 : 2
    const yT = Math.round(Math.max(26, H * 0.13))
    const chuteN = Math.round((1 - sortie(t / 0.55)) * -(yT + 60)) - Math.round(elan * (yT + 120))
    const chuteD = Math.round((1 - sortie((t - 0.18) / 0.55)) * -(yT + 110)) - Math.round(elan * (yT + 160))
    const nx = Math.round(W / 2 + (largeurDe('NOVA', GRAS) * eN) / 2 - 4)
    const ny = yT - 6 + chuteN
    const bat = 0.5 + 0.5 * Math.sin(t * 2.3)
    const eclos = sortie((t - 0.5) / 0.6)
    if (eclos > 0) {
      p.glow(nx, ny, 70, VIOLET[2], 0.3 * eclos)
      p.glow(nx, ny, 34 + 6 * bat, PEPITE[2], (0.45 + 0.2 * bat) * eclos)
      p.glow(nx, ny, 12, N.WHITE, 0.8 * eclos)
      for (let k = 0; k < 8; k++) {
        const a = t * 0.12 + (k * Math.PI) / 4
        const l = (k % 2 === 0 ? 30 : 17) * eclos * (0.85 + 0.15 * Math.sin(t * 3 + k))
        p.line(nx + Math.cos(a) * 4, ny + Math.sin(a) * 4, nx + Math.cos(a) * l, ny + Math.sin(a) * l, k % 2 === 0 ? PEPITE[3] : PEPITE[2], k % 2 === 0 ? 0.55 : 0.35)
      }
      N.sparkle(p, nx, ny, (7 + 2 * bat) * eclos, N.WHITE, PEPITE[3], 0.95)
      p.circle(nx, ny, 2, N.WHITE)
    }
    const cycle = boucle(t - 1.2, 3.4)
    const wN = largeurDe('NOVA', GRAS) * eN
    const wD = largeurDe('DRIFTER', GRAS) * eD
    motEnRelief(p, 'NOVA', W / 2, yT + chuteN, true, GRAS, t > 1.2 && cycle < 0.7 ? -20 + ((wN + 40) * cycle) / 0.7 : null, eN)
    motEnRelief(p, 'DRIFTER', W / 2, yT + 11 * eN - 2 + chuteD, false, GRAS, t > 1.2 && cycle > 0.35 && cycle < 1.05 ? -20 + ((wD + 40) * (cycle - 0.35)) / 0.7 : null, eD)

    // LA DEMANDE : « Toucher pour commencer », qui bat, entre deux chevrons qui se rapprochent
    if (accueilQuitteA === null && t > 1.1) {
      const texte = 'Toucher pour commencer'
      const f: Police = largeurDe(texte, GRAS) <= W - 30 ? GRAS : TEXTE
      const yp = H - Math.max(30, Math.round(H * 0.1))
      const k = 0.5 + 0.5 * Math.sin(t * 3.4)
      const w = largeurDe(texte, f)
      ecrire(p, texte, W / 2, yp, k > 0.35 ? N.hex('#fff2c8') : COQUE[4], { police: f, align: 'center', contour: MATIERES.encre.contour })
      const dx = Math.round(k * 3)
      p.text('>', W / 2 - w / 2 - 12 + dx, yp + 1, PEPITE[2])
      p.text('<', W / 2 + w / 2 + 8 - dx, yp + 1, PEPITE[2])
    }
    // la sortie : la nuit de la base monte, puis le hangar s'ouvre
    if (us > 0.6) p.rect(0, 0, W, H, NUIT, (us - 0.6) / 0.4)
    if (us >= 1) {
      accueil = false
      camera.x = 0
      camera.y = 0
      ouvrirLeHangar()
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
    // dans la langue des plaques : l'anneau cerné d'encre, éclairé d'en haut à gauche, ombré en bas à droite
    const encre = MATIERES.encre.contour
    p.circle(centre.x, centre.y, r, COQUE[0], 0.25)
    p.ring(centre.x, centre.y, r + 1, 3, encre)
    p.ring(centre.x, centre.y, r, 1, COQUE[3]) // (opaque : tramé, l'anneau faisait du bruit)
    p.arc(centre.x, centre.y, r, 1, Math.PI * 0.95, Math.PI * 1.55, COQUE[5])
    p.arc(centre.x, centre.y, r, 1, -Math.PI * 0.05, Math.PI * 0.55, COQUE[2])
    const dx = manche.doigt.x - manche.centre.x
    const dy = manche.doigt.y - manche.centre.y
    const d = Math.hypot(dx, dy)
    const k = d > C.manche.rayon ? C.manche.rayon / d : 1
    // le pouce : un bouton bombé (le cerne, le corps, le dessus plus clair décalé vers la lumière, un éclat)
    const tx = Math.round(centre.x + (dx * k) / zoom)
    const ty = Math.round(centre.y + (dy * k) / zoom)
    const rp = Math.round(r * 0.42)
    p.circle(tx, ty, rp + 1, encre)
    p.circle(tx, ty, rp, COQUE[3])
    p.circle(tx - 1, ty - 1, rp - 2, COQUE[4])
    p.circle(tx - 2, ty - 2, rp - 5, COQUE[5])
    p.rect(tx - Math.round(rp * 0.5), ty - Math.round(rp * 0.55), 2, 1, COQUE[6])
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
              jouer('eclat', { dx: ev.x - v.x, dy: ev.y - v.y })
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
              if (ev.par === 'joueur') {
                envols.push({ x: v.x, y: v.y, t0: t, minerai: ev.minerai })
                jouer('ramasse')
              }
              break
            case 'touche': {
              // un trait perce la coque : le vaisseau blanchit, une étincelle rouge, une secousse, une vibration
              if (!(r.chocs.length > 0 && t - chocAnnonceA < 0.4)) jouer('touche') // (un choc annoncé en avance a déjà sonné)
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
              // une arme tire : deux étincelles à la bouche, et son son
              // (un coup annoncé en avance a déjà sonné)
              if (t - (armeAnnonceeA.get(ev.arme) ?? -10) < 0.4) armeAnnonceeA.delete(ev.arme)
              else jouer(ev.arme as Son)
              for (let i = 0; i < 2; i++) etincelles.ajouter('etincelle', ev.x, ev.y, R.range(-20, 20), R.range(-20, 20), 0.12, N.WHITE, 1, 1.5)
              break
            case 'ennemiTouche': {
              // un obus touche le rival : il blanchit, des étincelles cyan
              jouer('ennemiTouche', { dx: ev.x - v.x, dy: ev.y - v.y })
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
              if (!(r.chocs.length > 0 && t - chocAnnonceA < 0.4)) jouer('bouclier')
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
              jouer('ennemiDetruit', { dx: ev.x - v.x, dy: ev.y - v.y })
              effets.push({ fx: N.createFx(EXPLOSION as Module, { x: ev.x - camera.x + W / 2, y: ev.y - camera.y + centreY(), palette: EXPLOSION_RIVAL, debris: '#7a2a36', size: 0.35, seed: ev.id }), x: ev.x, y: ev.y })
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
              jouer('extrait')
              // resté à quai jusqu'au bout : le vaisseau se TÉLÉPORTE (Keko) — dessiné blanchi jusqu'à l'éclair, puis
              // l'effet prend le relais et il n'est plus dessiné ; l'écran de fin vient quand l'effet est passé
              perduA = t
              effets.push({ fx: N.createFx(TELEPORTATION as Module, { x: v.x - camera.x + W / 2, y: v.y - camera.y + centreY(), rayon: CONF.rayon, seed: 3 }), x: v.x, y: v.y })
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
              jouer('perdu')
              perduA = t
              effets.push({ fx: N.createFx(EXPLOSION as Module, { x: v.x - camera.x + W / 2, y: v.y - camera.y + centreY(), debris: '#46587a', size: 0.45, seed: 5 }), x: v.x, y: v.y })
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
      // les sons continus : le souffle du propulseur suit la flamme, la foreuse bourdonne quand elle creuse, la charge
      // de l'extraction monte avec l'arc d'or (et se tait quand le compte est au bout : le son de l'extraction la relève)
      if (m.extraction !== compteVu) compteMonte = m.extraction > compteVu
      compteVu = m.extraction
      regler(m.phase === 'vol' ? flamme : 0, m.phase === 'vol' && m.forage !== null, m.phase === 'vol' ? m.extraction / CONF.extraction.duree : 0, compteMonte)
      if (m.phase === 'vol') annoncerLesSons()
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
      e.fx.options.y = e.y - camera.y + centreY()
    }
    effets = effets.filter((e) => !e.fx.done())

    N.clearFrame(frame)
    const p = N.painterFor(frame)
    if (accueil) {
      regler(0, false, 0, false)
      dessinerLAccueil(p)
      N.composite(frame, img.data, cuireLeCiel())
      g.putImageData(img, 0, 0)
      canvas.style.transform = ''
      requestAnimationFrame(image)
      return
    }
    const visible = ecranVisible()
    if (visible && !ecranEtait) ouvrirLeHangar()
    ecranEtait = visible
    if (visible) {
      regler(0, false, 0, false) // (au hangar, plus de souffle, de foreuse ni de charge)
      // LE HANGAR à la place du monde (Keko : « je ne veux pas voir l'extracteur ni le niveau derrière ») : la scène, puis l'interface
      dessinerLaBase(p)
      N.composite(frame, img.data, FOND)
      g.putImageData(img, 0, 0)
      canvas.style.transform = transformDeLaBase()
      requestAnimationFrame(image)
      return
    }
    // le pas des ressorts et des éclats de l'interface (ceux de la base : la base ne le tient que quand elle se dessine)
    dtBase = Math.min(0.05, Math.max(0, t - tBase))
    tBase = t
    dessinerLeCiel(p)
    for (const a of asteroidesVisibles(C, m, camera.x, camera.y, Math.max(W, H) / 2 + C.champ.rayonMax + 4)) {
      // la roche qu'on creuse tremble, d'autant plus qu'elle est près d'éclater
      const creusee = m.forage !== null && m.forage.cible === a.id
      const tremble = creusee ? (0.5 + m.forage!.part) * 1.2 : 0
      dessinerAsteroide(p, a, t, a.x - camera.x + W / 2 + (tremble > 0 ? (R.next() - 0.5) * tremble : 0), a.y - camera.y + centreY() + (tremble > 0 ? (R.next() - 0.5) * tremble : 0))
      // sa solidité restante, sous elle, dès qu'elle est entamée (Keko) — pas avant : le champ serait couvert de jauges
      const creuse = m.creuse.get(a.id) ?? 0
      if (creuse > 0) dessinerUneJauge(p, a.x - camera.x + W / 2, a.y - camera.y + centreY() + a.rayon + 4, Math.max(8, Math.round(a.rayon * 1.6)), 1 - creuse / solidite(CONF, a), COQUE[4], COQUE[6], creusee && Math.floor(t * 20) % 2 === 0)
    }
    // les braises, les morceaux, les pépites, les étincelles sont dans le monde : le peintre se place sur la caméra
    p.place(W / 2 - camera.x, centreY() - camera.y)
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
    // (les effets sont dans le monde : ils passent SOUS les bandeaux et l'interface)
    for (const e of effets) e.fx.draw(frame)
    // (un effet laisse le peintre du tampon PLACÉ sur lui, avec son fondu et sa lumière : sans cette remise à neuf — le
    // peintre d'un tampon est unique, `painterFor` le rend remis à zéro —, tant qu'un effet vivait (la matérialisation
    // du départ), les bandeaux et l'interface se dessinaient ancrés au milieu de l'écran : Keko)
    N.painterFor(frame)
    dessinerLesBords(p)
    dessinerLesBandeaux(p)
    dessinerLePointeur(p)
    dessinerLeRadar(p)
    dessinerLeScore(p)
    dessinerLesEclats(p)
    // `&latence` : la latence audio mesurée par l'appareil, en bas à gauche (ce qui se teste doit s'ouvrir d'un lien)
    if (parametres.has('latence')) p.text(`SON ${latenceMs()} MS`, 6, basDuHud() + 8, N.WHITE, { font: 'big', outline: COQUE[0] }) // (en haut à gauche, sous le porté, bien lisible)
    dessinerLeManche(p)
    N.composite(frame, img.data, cuireLeCiel())
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

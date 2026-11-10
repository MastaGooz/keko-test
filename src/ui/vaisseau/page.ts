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
import { acheter, ajouterLesPiecesDEssai, armesMontees, capacite, poidsTotal, configDuHangar, demonter, EMPLACEMENTS, estMontee, FICHES_MINERAI, foreuseMontee, hangarNeuf, jaugesDe, monteeA, monter, monterA, peutAcheter, peutMonter, pieceDe, piecesDe, possede, aimantMonte, radarMonte, vendre, type Jauge, type Piece, type Sorte } from '../../logic/vaisseau/hangar.ts'
import { drawWord, panel, spell } from 'pixelfx/fx/ui/_lib'
import { chargerHangar, sauverHangar } from './hangar.ts'
import { jouer, latenceMs, regler, reveiller, type Son } from './sons.ts'
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
  type Allure = { propulseur: number; coque: number; /** Le cran de la foreuse montée, 0 sans foreuse. */ foreuse: number; radar: boolean; aimant: boolean; armes: string[]; bouclier: number }
  const ALLURE_SERIE: Allure = { propulseur: 1, coque: 1, foreuse: 1, radar: false, aimant: false, armes: [], bouclier: 0 }
  const allureMontee = (bouclier: number): Allure => ({ propulseur: monteeA(hangar, 'propulseur').cran, coque: monteeA(hangar, 'coque').cran, foreuse: foreuseMontee(hangar)?.cran ?? 0, radar: radarMonte(hangar) > 0, aimant: aimantMonte(hangar) > 1, armes: armesMontees(hangar).map((pc) => pc.arme!.id), bouclier })
  /** L'écran est là quand rien ne vole : avant le premier décollage, et après une fin, le temps que l'effet passe. */
  const ecranVisible = (): boolean => !enJeu || (m.phase !== 'vol' && t - perduA > (m.phase === 'extrait' ? 1.7 : 1))
  let ecranEtait = false
  /** L'onglet ouvert, et la pièce choisie dans chacun (le hangar s'ouvre sur les pièces montées). */
  const ONGLETS: Sorte[] = ['coque', 'propulseur', 'outil', 'arme'] // (le châssis d'abord — Keko)
  /** Le nom d'un onglet ; les listes disent LEURS PLACES, occupées / portées par la coque (Keko : « ce n'est pas lisible »). */
  const NOMS_ONGLET: Record<Sorte, string> = { propulseur: 'PROPULSION', coque: 'CHASSIS', outil: 'OUTILS', arme: 'ARMES' }
  /** Les sous-catégories d'une catégorie : les familles de ses pièces (outils : foreuses, radars) ; `null` = toutes. */
  /** LES SOUS-CATÉGORIES, PAR ACTIVITÉ (Keko : « classer les outils par activité, minage / combat ») : la famille d'une pièce dit son activité. */
  const ACTIVITE: Record<string, string> = { foreuse: 'minage', aimant: 'minage', radar: 'combat' }
  const NOMS_FAMILLE: Record<string, string> = { minage: 'MINAGE', combat: 'COMBAT' }
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
  const titreDe = (c: Case): string => (c.k >= 0 ? `${c.o === 'arme' ? 'ARME' : 'OUTIL'} ${c.k + 1}` : NOMS_ONGLET[c.o])
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
  const NOMS_VUE: Record<string, string> = { hangar: 'HANGAR', labo: 'LABO', entrepot: 'ENTREPOT', carte: 'CARTE', atelier: 'ATELIER', marche: 'MARCHE', equipage: 'EQUIPAGE', missions: 'MISSIONS', journal: 'JOURNAL', trophees: 'TROPHEES', radio: 'RADIO', forge: 'FORGE', ...Object.fromEntries(Array.from({ length: 10 }, (_, i) => [`essai-${i + 1}`, `ESSAI ${i + 1}`])) }
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
  /** Ouvre la liste d'un emplacement (depuis le vaisseau ou sa case). */
  function ouvrirLEmplacement(o: Sorte, k = -1): void {
    onglet = o
    place = k
    changerDEtape('liste')
    defil[o] = 0
    // la fiche s'ouvre sur la pièce de cette place, s'il y en a une
    const occupant = k >= 0 ? listeMontee(o)[k] : undefined
    if (occupant !== undefined) choix[o] = occupant
  }
  /**
   * LA VUE D'ENSEMBLE, sous la scène : une case par place (au hangar) ou par catégorie (au labo), deux par rangée, qui
   * s'allument UNE À UNE quand on arrive. Chaque case : un puits avec le graphisme de la pièce (ou un « + » si la place
   * est vide), le nom de la place en or, la pièce en clair. Une tape ouvre sa liste. Rend le y sous les cases.
   */
  function dessinerLesEmplacements(p: Peintre, y: number): number {
    const cw = Math.floor((W - 12) / 2)
    const ch = 34
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
      // en arrivant, la case monte de trois pixels et son bord flashe blanc
      const monte = Math.round((1 - sortie(age / 0.18)) * 3)
      const y2 = yy + e.dy + monte
      const col = age < 0.06 ? { ...ENCRE, rim: N.WHITE } : e.survole ? { ...ENCRE, rim: COQUE[3] } : ENCRE
      if (e.dy === 0) p.rect(x + 1, yy + ch + monte, cw - 2, 1, NUIT_OMBRE)
      panel(p, x, y2, cw, ch, col, { r: 2 })
      panel(p, x + 3, y2 + 3, 24, ch - 6, { ...ENCRE, rim: ENCRE.top, top: ENCRE.low, body: ENCRE.low }, { r: 2 })
      const vide = vue === 'hangar' && montee === undefined
      if (vide) {
        // une place vide : un « + » qui respire
        const c2 = Math.sin(t * 3 + i) > 0 ? COQUE[3] : COQUE[2]
        p.rect(x + 14, y2 + ch / 2 - 5, 2, 10, c2)
        p.rect(x + 10, y2 + ch / 2 - 1, 10, 2, c2)
      } else if (montee !== undefined) dessinerLePictogramme(p, montee, x + 15, y2 + ch / 2, 24, ch - 6)
      p.text(titreDe(c), x + cw / 2 + 12, y2 + 5, PEPITE[2], { align: 'center' })
      const ligne = vue === 'labo' ? `${piecesDe(o).filter((pc) => !possede(hangar, pc.id)).length} A DEBLOQUER` : vide ? 'VIDE' : texteNu(montee!.nom)
      const L = replier(p, ligne, cw - 34)
      L.slice(0, 2).forEach((li, k) => p.text(li, x + cw / 2 + 12, y2 + 14 + k * 7, vue === 'labo' || vide ? COQUE[3] : COQUE[5], { align: 'center' }))
      zone(x, yy, cw, ch, () => ouvrirLEmplacement(o, c.k))
    })
    return y + Math.ceil(cases.length / 2) * (ch + 4)
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
  // ================================================================ LE GESTE DE LA BASE : l'appui, le survol, le refus
  /**
   * LE RETOUR DU GESTE (Keko, 10/11 : « très juicy, avec un bon gamefeel ») : la zone qu'on vient d'enfoncer descend
   * d'un pixel puis remonte, le point que survole la souris éclaire le bord de ce qu'il touche (PC), et un bouton
   * éteint qu'on touche quand même TREMBLE et bourdonne — « pas assez » se sent avant de se lire.
   */
  let enfonce: { x: number; y: number; t0: number } | null = null
  let survol: Vecteur | null = null
  let refus: { x: number; y: number; t0: number } | null = null
  const memeCoin = (a: { x: number; y: number } | null, x: number, y: number): boolean => a !== null && Math.abs(a.x - x) < 0.5 && Math.abs(a.y - y) < 0.5
  /** L'état d'un bouton à dessiner : son décalage (enfoncé d'un pixel, ou qui tremble au refus), et s'il est survolé. */
  function etatDuBouton(x: number, y: number, w: number, h: number): { dx: number; dy: number; survole: boolean } {
    const appuye = enfonce !== null && memeCoin(enfonce, x, y) && t - enfonce.t0 < 0.12
    const r = refus
    const tremble = r !== null && memeCoin(r, x, y) && t - r.t0 < 0.3 ? Math.round(Math.sin((t - r.t0) * 70) * 2 * (1 - (t - r.t0) / 0.3)) : 0
    const survole = survol !== null && survol.x >= x && survol.x < x + w && survol.y >= y && survol.y < y + h
    return { dx: tremble, dy: appuye ? 1 : 0, survole }
  }
  /** Une zone touchable, avec le son qu'elle fait (null : aucun ; par défaut, le clic). */
  function zone(x: number, y: number, w: number, h: number, action: () => void, son: Son | null = 'clic'): void {
    zones.push({ x, y, w, h, action, son })
  }
  /** Le bouton éteint reste touchable : il tremble et bourdonne. */
  function zoneDeRefus(x: number, y: number, w: number, h: number): void {
    zones.push({ x, y, w, h, action: () => (refus = { x, y, t0: t }), son: 'refus' })
  }
  /**
   * UN BOUTON DE LA BASE, le même partout : la plaque d'or s'il est vif, d'encre sinon, une ombre portée d'un pixel
   * qui disparaît quand il s'enfonce, le bord éclairé au survol ; `dessin` peint son contenu au décalage donné.
   */
  function boutonBase(p: Peintre, x: number, y: number, w: number, h: number, vif: boolean, action: () => void, dessin: (dx: number, dy: number) => void, son: Son | null = 'clic', shine: number | null = null): void {
    const e = etatDuBouton(x, y, w, h)
    const base = vif ? ENCRE_OR : ENCRE
    const col = e.survole ? { ...base, rim: vif ? PEPITE[4] : COQUE[3] } : base
    if (e.dy === 0) p.rect(x + e.dx + 1, y + h, w - 2, 1, NUIT_OMBRE)
    panel(p, x + e.dx, y + e.dy, w, h, col, { r: 2, shine })
    dessin(e.dx, e.dy)
    if (vif) zone(x, y, w, h + 1, action, son)
    else zoneDeRefus(x, y, w, h)
  }
  /** Un bouton à un mot (en relief s'il est `grand`). */
  function bouton(p: Peintre, x: number, y: number, w: number, h: number, mot: string, vif: boolean, action: () => void, grand = false, son: Son | null = 'clic'): void {
    boutonBase(p, x, y, w, h, vif, action, (dx, dy) => {
      if (grand) motEnRelief(p, mot, x + w / 2 + dx, y + dy + Math.floor((h - 7) / 2), 1, vif)
      else p.text(texteNu(mot), x + w / 2 + dx, y + dy + Math.floor((h - 5) / 2), vif ? N.WHITE : COQUE[3], { align: 'center' })
    }, son)
  }
  /** La hauteur des en-têtes. */
  const HT = 19
  /**
   * L'EN-TÊTE D'UN NIVEAU (la liste d'une place) : le retour, un carré d'or au chevron épais, puis le titre du niveau
   * en relief sur une plaque cerclée d'or (Keko : « mettre en valeur les titres et le bouton retour »).
   */
  function enTete(p: Peintre, y: number, mot: string, retour: () => void): void {
    boutonBase(p, 4, y, HT, HT, true, retour, (dx, dy) => {
      const cx = 4 + HT / 2 - 1 + dx
      const cy = y + Math.floor(HT / 2) + dy
      for (const [o, c] of [[1, N.hex('#6a4a08')], [0, PEPITE[4]]] as const) {
        for (let e = 0; e < 3; e++) {
          p.line(cx + 3 + e, cy - 5 + o, cx - 2 + e, cy + o, c)
          p.line(cx - 2 + e, cy + o, cx + 3 + e, cy + 5 + o, c)
        }
      }
    }, 'retour')
    panel(p, 6 + HT, y, W - 10 - HT, HT, { ...ENCRE, rim: PEPITE[1] }, { r: 2 })
    motEnRelief(p, mot, 6 + HT + (W - 10 - HT) / 2, y + 6, 1, true)
  }
  /**
   * LE GRAPHISME D'UNE PIÈCE, dans la case du panneau (Keko) : le propulseur, sa tuyère et sa flamme ; la coque, le fuselage
   * de sa peau ; une foreuse, son dôme et son canon ; le radar, son mât et son antenne ; une arme, ce qu'on voit sous
   * l'aile — les mêmes traits que sur le vaisseau, centrés sur (x, y), ET MIS À L'ÉCHELLE DE LA CASE (Keko : « chaque
   * visuel doit être rescalé pour loger dans la zone, pas taille réelle ») : d'après l'encombrement de chaque pièce,
   * largeur et hauteur une fois le nez en haut, pour remplir `bw` × `bh` à trois pixels du bord.
   */
  function dessinerLePictogramme(p: Peintre, pc: Piece, x: number, y: number, bw: number, bh: number): void {
    const [ew, eh] = pc.sorte === 'propulseur' ? [9, 9.5 + 1.5 * pc.cran] : pc.sorte === 'coque' ? (pc.cran === 3 ? [18, 18] : [14, 14]) : pc.sorte === 'outil' && pc.famille === 'foreuse' ? [7, 10 + pc.cran] : pc.sorte === 'outil' && pc.famille === 'aimant' ? [2 * (2.6 + 0.6 * (pc.cran - 2)) + 2, 8.6 + 0.6 * (pc.cran - 2) + 1] : pc.sorte === 'outil' ? [9, 9] : [9, 10]
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
    } else if (pc.sorte === 'outil' && pc.famille === 'aimant') {
      // l'aimant : un fer à cheval rouge aux pointes d'acier, plus grand au second cran, qui attire des étincelles
      const r = 2.6 + 0.6 * (pc.cran - 2)
      // centré sur son encombrement (du fond du fer à cheval, −r, aux étincelles, +6) : il débordait de sa case — Keko
      const o = -(6 - r) / 2
      // (le peintre agrandi ne sait pas `arc` : le demi-cercle en segments)
      for (let i = 0; i < 8; i++) {
        const a0 = Math.PI / 2 + (i / 8) * Math.PI
        const a1 = Math.PI / 2 + ((i + 1) / 8) * Math.PI
        q.line(o + Math.cos(a0) * r, Math.sin(a0) * r, o + Math.cos(a1) * r, Math.sin(a1) * r, ROUGE[3])
      }
      q.line(o, -r, o + 3, -r, ROUGE[3])
      q.line(o, r, o + 3, r, ROUGE[3])
      q.line(o + 3, -r, o + 4.5, -r, COQUE[5])
      q.line(o + 3, r, o + 4.5, r, COQUE[5])
      const a = (t * 3) % 1
      q.dot(o + 6 - a * 2, -r + a * r, PEPITE[3], 1 - a)
      q.dot(o + 6 - a * 2, r - a * r, PEPITE[3], 1 - a)
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
  /** Le même peintre, mais tout ce qu'il peint l'est d'UNE SEULE COULEUR opaque, sans lueur : pour le contour d'une silhouette. */
  function silhouette(p: Peintre, c: number): Peintre {
    return {
      ...p,
      place: (x, y, flip, angle) => p.place(x, y, flip, angle),
      px: (x, y) => p.px(x, y, c),
      dot: (x, y) => p.dot(x, y, c),
      rect: (x, y, w, h) => p.rect(x, y, w, h, c),
      circle: (x, y, r) => p.circle(x, y, r, c),
      ring: (x, y, r, w) => p.ring(x, y, r, w, c),
      poly: (pts) => p.poly(pts, c),
      line: (x0, y0, x1, y1) => p.line(x0, y0, x1, y1, c),
      glow: () => undefined,
    }
  }
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
  // ================================================================ LA BASE, EN QUATRE ÉTAGES
  /**
   * L'INTERFACE DE LA BASE, REPENSÉE (Keko, 10/11 : « une organisation hiérarchique épurée, claire et ergonomique, PC
   * et téléphone ; cohérente, élégante, et surtout très juicy ») — quatre étages, du plus général au plus précis :
   * LA BARRE DU HAUT (où l'on est, ce qu'on a : la vue en grand, les crédits), LA SCÈNE (ce qu'on regarde : le
   * vaisseau sur son aire, la planche du labo, l'inventaire), LE CONTENU (ce qu'on fait, un niveau à la fois) et LA
   * BARRE DES ONGLETS EN BAS, sous le pouce : trois vues, et « PLUS » qui ouvre les autres, la remise à zéro et la
   * date du build.
   */
  const HAUT_BARRE = 22
  const HAUT_NAV = 32
  const Y_SCENE = HAUT_BARRE
  /** La scène a UNE HAUTEUR FIXE pour un écran donné (Keko : elle ne bouge pas avec ce qu'il y a dessous) : ce que laissent les deux barres et le plus haut des contenus. */
  const hauteurDeScene = (): number => Math.max(64, Math.min(168, H - HAUT_BARRE - HAUT_NAV - 218))
  let hautScene = 150
  /** Le pas de la dernière image de la base, pour les ressorts. */
  let tBase = 0
  let dtBase = 1 / 60
  const ressort = (v: number, cible: number, raideur = 14): number => v + (cible - v) * Math.min(1, dtBase * raideur)
  const sortie = (u: number): number => 1 - Math.pow(1 - Math.max(0, Math.min(1, u)), 3)
  /** Les instants des gestes qui animent : le changement de vue, de niveau, une pièce équipée, « PLUS », le décollage. */
  let vueA = -10
  let etapeA = -10
  let equipeA = -10
  let feuille = false
  let feuilleA = -10
  let decollageA: number | null = null
  /** LE COMPTEUR DE CRÉDITS ROULE jusqu'au vrai compte et s'allume quand il change ; chaque écart monte en nombre flottant. */
  let creditsVus = credits
  let creditsConnus = credits
  let creditsA = -10
  /** Le milieu du compteur, où volent les pièces d'une vente. */
  let compteurX = W - 28
  const flottants: { texte: string; x: number; y: number; t0: number; c: number }[] = []
  /** Les étincelles de l'interface, en pixels d'écran, et les pièces qui volent jusqu'au compteur. */
  const eclats: { x: number; y: number; vx: number; vy: number; t0: number; vie: number; c: number }[] = []
  const volantes: { x0: number; y0: number; t0: number }[] = []
  /** Le repère d'or de la barre du bas glisse d'un onglet à l'autre ; l'onglet allumé se lève. */
  let repereX = -1
  const leve: Record<string, number> = {}
  const NUIT_BARRE = N.hex('#100d18')
  const NUIT_OMBRE = N.hex('#050409')
  /** Une gerbe d'étincelles à (x, y). */
  function gerbe(x: number, y: number, n: number, couleurs: number[], force = 60): void {
    for (let i = 0; i < n; i++) {
      const a = R.next() * Math.PI * 2
      const v = force * (0.4 + 0.6 * R.next())
      eclats.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 25, t0: t, vie: 0.3 + 0.35 * R.next(), c: couleurs[i % couleurs.length] })
    }
  }
  /** Change de vue : la scène et le contenu se dévoilent, la feuille « PLUS » se ferme. */
  function allerA(vv: string): void {
    feuille = false
    if (vv === vue) return
    vue = vv
    etape = 'vaisseau'
    vueA = t
    etapeA = t
  }
  /** Change de niveau (le vaisseau, la liste d'une place) : le contenu se dévoile. */
  function changerDEtape(e: 'vaisseau' | 'liste'): void {
    etape = e
    etapeA = t
  }
  function basculerLaFeuille(): void {
    feuille = !feuille
    feuilleA = t
    defilOnglets = 0
  }

  /** LA BASE ENTIÈRE, une image : la scène, le contenu, les deux barres, la feuille « PLUS », les éclats. */
  function dessinerLaBase(p: Peintre): void {
    zones = []
    p.place(0, 0)
    dtBase = Math.min(0.05, Math.max(0, t - tBase))
    tBase = t
    hautScene = hauteurDeScene()
    p.rect(0, 0, W, H, NUIT)
    if (credits !== creditsConnus) {
      const d = credits - creditsConnus
      flottants.push({ texte: `${d > 0 ? '+' : ''}${d}`, x: compteurX, y: HAUT_BARRE + 2, t0: t, c: d > 0 ? RUNE[3] : PEPITE[3] })
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
   * LA SCÈNE, sur toute la largeur : le hangar vu de dessus (le vaisseau posé sur son aire, son poids en étiquette, les
   * zones qu'on touche), la planche bleue du labo, l'inventaire de l'entrepôt ; elle se dévoile en fondu tramé quand
   * on change de vue. Le vaisseau FLASHE quand on l'équipe, et DÉCOLLE pour de bon quand on part.
   */
  function dessinerLaScene(p: Peintre): void {
    const y0 = Y_SCENE
    const y1 = y0 + hautScene
    const cx = W / 2
    const cy = y1 - Math.min(58, Math.floor(hautScene / 2) + 8)
    if (vue === 'hangar') {
      // le sol du hangar : des plaques, leurs joints sombres, un rivet par plaque
      p.rect(0, y0, W, hautScene, COQUE[0])
      for (let x = 6; x < W; x += 24) p.line(x, y0, x, y1 - 1, NUIT)
      for (let y = y0 + 4; y < y1; y += 24) p.line(0, y, W - 1, y, NUIT)
      for (let x = 6; x < W; x += 24) for (let y = y0 + 4; y < y1; y += 24) p.dot(x + 2, y + 2, COQUE[1])
    } else if (vue === 'labo') {
      const PLAN = N.hex('#0b1726')
      p.rect(0, y0, W, hautScene, PLAN)
      for (let x = 6; x < W; x += 12) p.line(x, y0, x, y1 - 1, N.hex('#0f2034'))
      for (let y = y0 + 6; y < y1; y += 12) p.line(0, y, W - 1, y, N.hex('#0f2034'))
      // (l'espace attend L'ARBRE DES RECHERCHES — Keko)
      p.text('ARBRE DES RECHERCHES : BIENTOT', cx, y0 + Math.floor(hautScene / 2) - 2, N.hex('#24456a'), { align: 'center' })
    } else if (vue === 'entrepot') {
      const MUR = N.hex('#121c18')
      p.rect(0, y0, W, hautScene, MUR)
      for (let i = 0; i < 90; i++) {
        const mx = Math.floor(tire(i, 1, 77) * W)
        const my = y0 + Math.floor(tire(i, 2, 77) * hautScene)
        p.dot(mx, my, tire(i, 3, 77) < 0.5 ? N.hex('#0c1310') : N.hex('#1a2822'))
      }
    } else {
      p.rect(0, y0, W, hautScene, N.hex('#0e0c16'))
      p.text('BIENTOT', cx, y0 + Math.floor(hautScene / 2) - 3, COQUE[2], { font: 'big', align: 'center' })
    }
    // les lampes : un boîtier, un halo chaud
    for (const lx of [8, W - 9]) {
      p.glow(lx, y0 + 6, 50, N.hex('#ffd8a0'), 0.3)
      p.rect(lx - 3, y0, 6, 3, COQUE[2])
      p.rect(lx - 2, y0 + 3, 4, 1, PEPITE[3])
    }
    if (vue === 'hangar') dessinerLeHangarEnScene(p, cx, cy, y0, y1)
    else if (vue === 'entrepot') dessinerLInventaire(p, y0)
    // le dévoilement : un voile tramé qui se lève
    const u = (t - vueA) / 0.25
    if (u < 1) p.rect(0, y0, W, hautScene, NUIT, 1 - sortie(u))
    p.line(0, y1, W - 1, y1, ENCRE.rim)
    p.line(0, y1 + 1, W - 1, y1 + 1, NUIT_OMBRE)
  }

  /** Le hangar dans la scène : l'aire, le vaisseau (et son décollage), son poids, les zones des pièces. */
  function dessinerLeHangarEnScene(p: Peintre, cx: number, cy: number, y0: number, y1: number): void {
    // LE DÉCOLLAGE : le moteur s'allume, le vaisseau tremble, puis file vers le haut et sort de la scène
    let sy = cy
    let flam = 0
    let jit = 0
    if (decollageA !== null) {
      const u = Math.min(1, (t - decollageA) / 0.9)
      flam = Math.min(1, u * 4)
      jit = u < 0.35 ? Math.round((R.next() - 0.5) * 2) : 0
      sy = cy - Math.round(Math.pow(Math.max(0, u - 0.25) / 0.75, 2.2) * (cy - y0 + 40))
      if (R.next() < 0.8) eclats.push({ x: cx + (R.next() - 0.5) * 6, y: sy + 16, vx: (R.next() - 0.5) * 30, vy: 40 + R.next() * 50, t0: t, vie: 0.3 + 0.3 * R.next(), c: FEU[3 + Math.floor(R.next() * 4)] })
      if (u >= 1) {
        decollageA = null
        demarrer()
      }
    }
    // l'aire : un disque sombre, l'anneau de chevrons, un cercle et une croix de guidage, huit feux qui courent
    const R0 = 30
    const SOL = N.hex('#2c2f38')
    const REPERE = N.hex('#3c404c')
    p.circle(cx, cy, R0 + 3, NUIT)
    p.circle(cx, cy, R0, SOL)
    p.ring(cx, cy, R0 - 1, 3, (_v: number, ang: number) => (Math.floor((ang / Math.PI) * 8 + 16) % 2 === 0 ? PEPITE[1] : NUIT))
    p.ring(cx, cy, R0 - 9, 1, REPERE)
    p.line(cx - R0 + 11, cy, cx + R0 - 11, cy, REPERE)
    p.line(cx, cy - R0 + 11, cx, cy + R0 - 11, REPERE)
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2
      const allume = decollageA !== null || (Math.floor(t * 4) + i) % 8 < 3
      const fx = cx + Math.cos(a) * (R0 + 6)
      const fy = cy + Math.sin(a) * (R0 + 6)
      p.dot(fx, fy, allume ? PEPITE[3] : PEPITE[0])
      if (allume) p.glow(fx, fy, 5, PEPITE[2], 0.5)
    }
    // l'onde d'une pièce équipée, sur l'aire
    const ue = (t - equipeA) / 0.45
    if (ue < 1) p.ring(cx, cy, 12 + ue * 26, 2, ue < 0.3 ? N.WHITE : PEPITE[3], 1 - ue)
    // le vaisseau posé, agrandi deux fois, cerné de sa silhouette noire ; blanc l'instant où on l'équipe
    const K = 2
    const al = allureMontee(monteeA(hangar, 'coque').bouclier ? 1 : 0)
    const peau = al.coque >= 2 ? BLINDEE : COQUE
    p.glow(cx, sy, 24, N.hex('#8aa0c8'), 0.22)
    const contour = silhouette(p, N.hex('#04050a'))
    for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, -1], [-1, 1], [1, 1]]) dessinerVaisseauA(agrandi(contour, K), cx + dx + jit, sy + dy, -Math.PI / 2, 0, peau, VERRIERE, 0, false, { ...al, bouclier: 0 })
    dessinerVaisseauA(agrandi(p, K), cx + jit, sy, -Math.PI / 2, flam, peau, VERRIERE, 0, false, al)
    if (t - equipeA < 0.09) dessinerVaisseauA(agrandi(silhouette(p, N.WHITE), K), cx, sy, -Math.PI / 2, 0, peau, VERRIERE, 0, false, { ...al, bouclier: 0 })
    p.place(0, 0)
    // LE POIDS en étiquette, en bas à gauche de la scène
    const poids = `${poidsTotal(hangar)} T`
    const wm = p.measure('POIDS')[0]
    const wv = p.measure(poids, { font: 'big' })[0]
    panel(p, 4, y1 - 16, wm + wv + 13, 13, ENCRE, { r: 2 })
    p.text('POIDS', 9, y1 - 12, COQUE[4])
    p.text(poids, 9 + wm + 4, y1 - 13, PEPITE[3], { font: 'big' })
    // LES ZONES DU VAISSEAU (Keko : une cible verte, les angles seulement, autour de la zone où va la pièce) : à la vue
    // d'ensemble, on les touche sans les voir ; dans une liste, la place ouverte se montre
    const zonesDe = (o: Sorte): [number, number, number, number][] => (o === 'propulseur' ? [[-10.5, -3.2, -4.5, 3.2]] : o === 'coque' ? [[-7.5, -4.8, 9.8, 4.8]] : o === 'outil' ? [[-6.5, -3.5, 4, 3.5]] : Array.from({ length: capacite(hangar, 'arme') }, (_, i): [number, number, number, number] => [-8, (i === 0 ? -1 : 1) * 8.6, 2.5, (i === 0 ? -1 : 1) * 4.2]))
    const cibles: Sorte[] = etape === 'vaisseau' ? ['propulseur', 'outil', 'arme', 'coque'] : [onglet]
    const vif = Math.sin(t * 5) > -0.3
    if (decollageA === null) for (const o of cibles) for (const [i, [x0, yy0, x1, yy1]] of zonesDe(o).entries()) {
      if (etape !== 'vaisseau' && o === 'arme' && i !== placeOuverte()) continue
      const sx0 = Math.round(cx + Math.min(yy0, yy1) * K)
      const sx1 = Math.round(cx + Math.max(yy0, yy1) * K)
      const sy0 = Math.round(cy - Math.max(x0, x1) * K)
      const sy1 = Math.round(cy - Math.min(x0, x1) * K)
      const L = Math.max(1, Math.min(4, Math.floor((sx1 - sx0) / 3), Math.floor((sy1 - sy0) / 3)))
      const c = vif ? RUNE[3] : RUNE[2]
      if (etape !== 'vaisseau') {
        // la cible se resserre en arrivant
        const s = Math.round((1 - sortie((t - etapeA) / 0.25)) * 6)
        for (const [x, y, dx, dy] of [[sx0 - s, sy0 - s, 1, 1], [sx1 + s, sy0 - s, -1, 1], [sx0 - s, sy1 + s, 1, -1], [sx1 + s, sy1 + s, -1, -1]]) {
          p.line(x, y, x + dx * L, y, c)
          p.line(x, y, x, y + dy * L, c)
        }
      } else zone(sx0 - 2, sy0 - 2, sx1 - sx0 + 4, sy1 - sy0 + 4, () => ouvrirLEmplacement(o, o === 'arme' ? i : o === 'outil' ? 0 : -1))
    }
  }

  /** L'INVENTAIRE de l'entrepôt, dans la scène : cinq cases par rangée, autant de rangées qu'il en tient, qui s'allument une à une ; le minerai choisi en or. */
  function dessinerLInventaire(p: Peintre, y0: number): void {
    const COL = 5
    const cw = 30
    const ch = 26
    const RANG = Math.max(1, Math.floor((hautScene - 8) / (ch + 3)))
    const gx = Math.floor((W - (COL * cw + (COL - 1) * 3)) / 2)
    const gy = y0 + Math.floor((hautScene - (RANG * (ch + 3) - 3)) / 2)
    for (let i = 0; i < COL * RANG; i++) {
      if (t - vueA < i * 0.012) continue
      const x = gx + (i % COL) * (cw + 3)
      const y = gy + Math.floor(i / COL) * (ch + 3)
      const k = MINERAIS[i]
      if (k === undefined) {
        panel(p, x, y, cw, ch, { ...ENCRE, rim: ENCRE.top, top: ENCRE.body, body: ENCRE.low }, { r: 2 })
        continue
      }
      const choisi = k === mineraiChoisi
      const e = etatDuBouton(x, y, cw, ch)
      panel(p, x, y + e.dy, cw, ch, choisi ? ENCRE_OR : e.survole ? { ...ENCRE, rim: COQUE[3] } : ENCRE, { r: 2 })
      if (choisi) p.glow(x + cw / 2, y + 10, 12, PEPITE[2], 0.15 + 0.08 * Math.sin(t * 4))
      dessinerUneRessource(p, x + cw / 2, y + 10 + e.dy, k)
      p.text(String(tresor[k]), x + cw / 2, y + ch - 7 + e.dy, tresor[k] > 0 ? N.WHITE : COQUE[3], { align: 'center' })
      zone(x, y, cw, ch, () => (mineraiChoisi = k))
    }
  }

  /** LA BARRE DU HAUT : l'icône et LE NOM DE LA VUE en grand (le premier niveau de la hiérarchie), et LES CRÉDITS, qui roulent et s'allument. */
  function dessinerLaBarreDuHaut(p: Peintre): void {
    p.rect(0, 0, W, HAUT_BARRE, NUIT_BARRE)
    p.line(0, HAUT_BARRE - 1, W - 1, HAUT_BARRE - 1, ENCRE.rim)
    p.line(0, HAUT_BARRE, W - 1, HAUT_BARRE, NUIT_OMBRE)
    // le titre tombe à sa place quand la vue change
    const u = sortie((t - vueA) / 0.3)
    const chute = Math.round((1 - u) * -8)
    dessinerLIconeDeVue(p, vue, 11, 11 + chute, true)
    const mot = spell(texteNu(NOMS_VUE[vue]), 'big') as { w: number }
    motEnRelief(p, NOMS_VUE[vue], 22 + mot.w, 4 + chute, 2, true)
    // le compteur
    const n = String(Math.round(creditsVus))
    const wn = p.measure(n, { font: 'big' })[0]
    const wp = wn + 23
    const px = W - 4 - wp
    compteurX = px + wp / 2
    const allume = t - creditsA < 0.45
    const r = refus
    const tremble = r !== null && t - r.t0 < 0.3 ? Math.round(Math.sin((t - r.t0) * 70) * 2 * (1 - (t - r.t0) / 0.3)) : 0
    if (allume) p.glow(compteurX, 11, 22, RUNE[2], 0.25 * (1 - (t - creditsA) / 0.45))
    panel(p, px + tremble, 4, wp, 14, allume ? { ...ENCRE, rim: RUNE[3] } : tremble !== 0 ? { ...ENCRE, rim: ROUGE[4] } : ENCRE, { r: 3 })
    dessinerUnCredit(p, px + 9 + tremble, 10)
    p.text(n, px + 16 + tremble, 8, allume ? N.WHITE : PEPITE[3], { font: 'big' })
  }

  /** Les vues de la barre du bas ; les autres vont dans « PLUS ». */
  const PRINCIPALES = (): string[] => VUES.slice(0, 3)
  /** L'icône de « PLUS » : quatre carrés. */
  function dessinerLIconePlus(p: Peintre, x0: number, y0: number, actif: boolean): void {
    const x = Math.round(x0)
    const y = Math.round(y0)
    for (const [dx, dy] of [[-5, -5], [1, -5], [-5, 1], [1, 1]]) {
      p.rect(x + dx - 1, y + dy - 1, 6, 6, ENCRE.outline)
      p.rect(x + dx, y + dy, 4, 4, actif ? PEPITE[2] : COQUE[3])
      p.rect(x + dx, y + dy, 4, 1, actif ? PEPITE[3] : COQUE[4])
    }
  }
  /**
   * LA BARRE DES ONGLETS, EN BAS (sous le pouce, comme les applis — et sur PC, à la souris) : une case par vue, son icône
   * et son nom ; l'allumée se lève, en or, et un repère d'or glisse jusqu'à elle. « PLUS » montre la vue des autres
   * quand on y est.
   */
  function dessinerLaNav(p: Peintre): void {
    const y0 = H - HAUT_NAV
    p.rect(0, y0, W, HAUT_NAV, NUIT_BARRE)
    p.line(0, y0, W - 1, y0, ENCRE.rim)
    const slots = [...PRINCIPALES(), 'plus']
    const sw = W / slots.length
    const horsBarre = !PRINCIPALES().includes(vue)
    slots.forEach((vv, i) => {
      const actif = vv === 'plus' ? feuille || horsBarre : vv === vue && !feuille
      leve[vv] = ressort(leve[vv] ?? 0, actif ? 1 : 0, 18)
      const x0 = Math.round(i * sw)
      const x1 = Math.round((i + 1) * sw)
      const cxs = Math.round((x0 + x1) / 2)
      const e = etatDuBouton(x0, y0, x1 - x0, HAUT_NAV)
      const dy = -Math.round(leve[vv] * 3) + e.dy
      if (e.survole && !actif) p.rect(x0 + 2, y0 + 3, x1 - x0 - 4, HAUT_NAV - 5, N.hex('#1a1626'))
      if (actif) p.glow(cxs, y0 + 12, 18, PEPITE[2], 0.16)
      const ic = vv === 'plus' && horsBarre && !feuille ? vue : vv
      const nom = vv === 'plus' ? (horsBarre && !feuille ? NOMS_VUE[vue] : 'PLUS') : NOMS_VUE[vv]
      if (ic === 'plus') dessinerLIconePlus(p, cxs, y0 + 13 + dy, actif)
      else dessinerLIconeDeVue(p, ic, cxs, y0 + 13 + dy, actif)
      p.text(nom, cxs, y0 + 23 + dy, actif ? PEPITE[3] : COQUE[4], { align: 'center' })
      const action = vv === 'plus' ? basculerLaFeuille : () => (vv === vue ? (feuille = false) : allerA(vv))
      zone(x0, y0, x1 - x0, HAUT_NAV, action, vv === 'plus' ? (feuille ? 'retour' : 'ouvre') : actif ? null : 'onglet')
    })
    const ia = feuille || horsBarre ? slots.length - 1 : slots.indexOf(vue)
    const cible = ia * sw + sw / 2
    repereX = repereX < 0 ? cible : ressort(repereX, cible, 16)
    p.rect(Math.round(repereX - 11), y0 + 1, 22, 2, PEPITE[2])
    p.rect(Math.round(repereX - 7), y0 + 1, 14, 1, PEPITE[4])
  }

  /**
   * LA FEUILLE « PLUS », qui monte de la barre du bas : les autres onglets en grille (quatre par rangée, une icône et
   * un nom ; elle défile au doigt et à la molette quand ils sont nombreux), puis la remise à zéro et la date du build.
   * Une tape à côté la referme.
   */
  function dessinerLaFeuille(p: Peintre): void {
    zoneDesOnglets = null
    const u = sortie((t - feuilleA) / 0.2)
    const k = feuille ? u : 1 - u
    if (k <= 0.01) return
    const bas = H - HAUT_NAV
    const autres = VUES.slice(3)
    const COL = 4
    const tw = 40
    const th = 34
    const pas = th + 3
    const rangs = Math.ceil(autres.length / COL)
    const hPied = 36
    const hMax = bas - HAUT_BARRE - 10
    const visibles = Math.max(1, Math.min(rangs, Math.floor((hMax - 18 - hPied) / pas)))
    const hf = 18 + (autres.length > 0 ? visibles * pas : 14) + hPied
    const yf = Math.round(bas - (hf + 4) * k)
    p.rect(0, HAUT_BARRE + 1, W, bas - HAUT_BARRE - 1, NUIT, 0.7 * k)
    if (feuille) zones = zones.filter((z) => z.y >= bas)
    panel(p, 4, yf, W - 8, hf + 8, { ...ENCRE, rim: PEPITE[1] }, { r: 3 })
    p.text('AUTRES ONGLETS', W / 2, yf + 6, PEPITE[3], { align: 'center' })
    const yg = yf + 16
    if (autres.length === 0) p.text('AUCUN POUR L\'INSTANT', W / 2, yg + 3, COQUE[3], { align: 'center' })
    const maxD = Math.max(0, rangs - visibles)
    defilOnglets = Math.max(0, Math.min(maxD, defilOnglets))
    const d0 = Math.round(defilOnglets)
    const gx = Math.floor((W - (COL * tw + (COL - 1) * 3)) / 2)
    autres.forEach((vv, i) => {
      const r = Math.floor(i / COL) - d0
      if (r < 0 || r >= visibles) return
      const x = gx + (i % COL) * (tw + 3)
      const y = yg + r * pas
      const actif = vv === vue
      const e = etatDuBouton(x, y, tw, th)
      panel(p, x, y + e.dy, tw, th, actif ? ENCRE_OR : e.survole ? { ...ENCRE, rim: COQUE[3] } : ENCRE, { r: 2 })
      dessinerLIconeDeVue(p, vv, x + tw / 2, y + 13 + e.dy, actif)
      p.text(NOMS_VUE[vv], x + tw / 2, y + th - 8 + e.dy, actif ? N.WHITE : COQUE[4], { align: 'center' })
      if (feuille) zone(x, y, tw, th, () => allerA(vv), 'onglet')
    })
    if (maxD > 0) {
      const hg = visibles * pas - 3
      const hc = Math.max(8, Math.round((hg * visibles) / rangs))
      const yc = yg + Math.round(((hg - hc) * defilOnglets) / maxD)
      p.rect(W - 8, yg, 2, hg, ENCRE.outline)
      p.rect(W - 8, yc, 2, hc, COQUE[3])
      if (feuille) zoneDesOnglets = { x: 4, y: yg, w: W - 8, h: hg }
    }
    // le pied : la remise à zéro (une seconde tape la confirme), la date du build
    const yp = yf + hf + 8 - hPied
    p.line(10, yp, W - 11, yp, ENCRE.top)
    const demande = t - resetDemandeA < 2
    if (feuille) {
      const wr = p.measure(demande ? 'SUR ?' : 'REMISE A ZERO')[0] + 14
      bouton(p, Math.round(W / 2 - wr / 2), yp + 5, wr, 13, demande ? 'Sur ?' : 'Remise a zero', true, () => {
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
      }, false, demande ? 'refus' : 'clic')
    }
    p.text(texteNu(`build ${build}`), W / 2, yp + 24, COQUE[3], { align: 'center' })
    if (feuille) zone(0, HAUT_BARRE, W, bas - HAUT_BARRE, basculerLaFeuille, 'retour')
  }

  /** Les éclats de l'interface : les étincelles, les pièces d'une vente qui volent au compteur, les nombres qui montent. */
  function dessinerLesEclats(p: Peintre): void {
    for (const e of eclats) {
      e.x += e.vx * dtBase
      e.y += e.vy * dtBase
      e.vy += 140 * dtBase
      e.vx *= 1 - 2 * dtBase
      const u = (t - e.t0) / e.vie
      p.rect(Math.round(e.x), Math.round(e.y), u < 0.4 ? 2 : 1, u < 0.4 ? 2 : 1, e.c)
    }
    for (let i = eclats.length - 1; i >= 0; i--) if (t - eclats[i].t0 > eclats[i].vie) eclats.splice(i, 1)
    for (let i = volantes.length - 1; i >= 0; i--) {
      const v = volantes[i]
      const u = (t - v.t0) / 0.5
      if (u < 0) continue
      if (u >= 1) {
        volantes.splice(i, 1)
        N.sparkle(p, compteurX, 11, 4, RUNE[3], N.WHITE, 0.9)
        jouer('ramasse')
        continue
      }
      const e = u * u * (3 - 2 * u)
      const x = v.x0 + (compteurX - 8 - v.x0) * e
      const y = v.y0 + (11 - v.y0) * e - Math.sin(u * Math.PI) * 26
      dessinerUnCredit(p, x, y)
    }
    for (let i = flottants.length - 1; i >= 0; i--) {
      const f = flottants[i]
      const u = (t - f.t0) / 0.9
      if (u >= 1) {
        flottants.splice(i, 1)
        continue
      }
      p.text(f.texte, f.x, Math.round(f.y + 2 - sortie(u) * 12), u > 0.7 && Math.floor(t * 30) % 2 === 0 ? N.WHITE : f.c, { font: 'big', align: 'center', outline: NUIT_OMBRE })
    }
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
      p.text(j.unite === undefined ? String(j.valeur) : `${j.valeur} ${j.unite}`, bx, y + 1, PEPITE[3]) // (le poids en tonnes, « 24 T », en petite police comme le nom de la stat — Keko)
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
  /** LA LIGNE SOUS UN TITRE (le poids total, les crédits) : le mot et le nombre en grande police, centrés, l'icône des crédits s'il le faut — la petite police, essayée, a été retirée (Keko). */
  /** L'ICÔNE D'UN ONGLET, centrée sur (x, y), une douzaine de pixels : le VAISSEAU nez en haut, la FIOLE du labo et son liquide vert, la CAISSE de l'entrepôt. */
  function dessinerLIconeDeVue(p: Peintre, vv: string, x0: number, y0: number, actif: boolean): void {
    const x = Math.round(x0)
    const y = Math.round(y0)
    const a = 1 // (opaques toujours : à demi transparentes, elles sortaient tramées — l'onglet éteint se lit à son nom et sa plaque)
    const OMBRE = ENCRE.outline
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
  /**
   * LA FICHE DU MINERAI, sous l'inventaire : son icône et son nom, sa description sur trois lignes fixes (Keko), sa
   * valeur unitaire et le stock, et VENDRE — les pièces volent jusqu'au compteur, qui roule. Rend le y sous la fiche.
   */
  function dessinerLEntrepot(p: Peintre, y: number): number {
    const k = mineraiChoisi
    const fiche = FICHES_MINERAI[k]
    const LIGNES = 3
    const L = replier(p, fiche.dit, W - 20).slice(0, LIGNES)
    const hp = 19 + LIGNES * 7 + 10 + 24 + 18
    panel(p, 4, y, W - 8, hp, ENCRE, { r: 2 })
    const ln = p.measure(texteNu(fiche.nom), { font: 'big' })[0]
    dessinerUneRessource(p, W / 2 - ln / 2 - 4, y + 10, k)
    p.text(texteNu(fiche.nom), W / 2 + 5, y + 7, PEPITE[3], { font: 'big', align: 'center' })
    const haut = y + 19 + Math.floor(((LIGNES - L.length) * 7) / 2)
    L.forEach((li, i) => p.text(li, W / 2, haut + i * 7, COQUE[5], { align: 'center' }))
    const ly = y + 19 + LIGNES * 7 + 10
    p.text('VALEUR UNITAIRE', 10, ly + 1, COQUE[4])
    nombreDeCredits(p, fiche.credits, W - 9, ly, PEPITE[3])
    p.text('EN STOCK', 10, ly + 12, COQUE[4])
    p.text(String(tresor[k]), W - 21, ly + 11, tresor[k] > 0 ? N.WHITE : COQUE[3], { font: 'big', align: 'right' })
    dessinerUneRessource(p, W - 13, ly + 14, k)
    const by = ly + 24
    const gain = tresor[k] * fiche.credits
    const mot = tresor[k] > 0 ? `VENDRE : ${gain}` : 'RIEN A VENDRE'
    const wmot = p.measure(mot, { font: 'big' })[0]
    const bw = wmot + (tresor[k] > 0 ? 12 : 0) + 18
    const bx = Math.round(W / 2 - bw / 2)
    boutonBase(p, bx, by, bw, 13, tresor[k] > 0, () => {
      const n = Math.min(10, tresor[k])
      const r = vendre(tresor, credits, k)
      tresor = r.tresor
      credits = r.credits
      sauver()
      // les pièces partent du bouton, l'une après l'autre
      for (let i = 0; i < n; i++) volantes.push({ x0: W / 2 + (R.next() - 0.5) * 30, y0: by + 6, t0: t + i * 0.05 })
      gerbe(W / 2, by + 6, 12, [RUNE[2], RUNE[3], N.WHITE])
    }, (dx, dy) => {
      motEnRelief(p, mot, bx + 9 + wmot / 2 + dx, by + 3 + dy, 1, tresor[k] > 0)
      if (tresor[k] > 0) dessinerUnCredit(p, bx + 9 + wmot + 7 + dx, by + 6 + dy)
    }, 'vente')
    return y + hp + 4
  }
  /**
   * LE CONTENU, sous la scène — UN NIVEAU À LA FOIS (Keko) : la vue d'ensemble (les cases, et DÉCOLLER au hangar), ou
   * la liste d'une place avec sa fiche, ou la fiche du minerai ; il se dévoile en fondu tramé à chaque changement.
   * La date du build, discrète, au-dessus de la barre du bas.
   */
  function dessinerLeContenu(p: Peintre): void {
    p.place(0, 0)
    const y0 = Y_SCENE + hautScene + 2
    let y = y0 + 4
    zoneGlissante = null
    if (estEssai(vue)) {
      p.text("UN ONGLET D'ESSAI", W / 2, y + 12, COQUE[4], { align: 'center' })
      p.text('(&ONGLETS=N)', W / 2, y + 22, COQUE[2], { align: 'center' })
    } else if (vue === 'entrepot') dessinerLEntrepot(p, y)
    else if (etape === 'vaisseau') {
      dessinerLesEmplacements(p, y)
      if (vue === 'hangar') dessinerDecoller(p)
    } else dessinerLaListe(p, y)
    const u = (t - etapeA) / 0.16
    if (u < 1) p.rect(0, y0, W, H - HAUT_NAV - y0, NUIT, 1 - sortie(u))
    if (!(vue === 'hangar' && etape === 'vaisseau')) p.text(texteNu(`build ${build}`), W - 3, H - HAUT_NAV - 7, COQUE[2], { align: 'right' })
    if (parametres.has('latence')) p.text(`SON ${latenceMs()} MS`, 4, H - HAUT_NAV - 10, N.WHITE, { font: 'big', outline: COQUE[0] })
  }

  /** DÉCOLLER, l'action principale, au bas de la vue d'ensemble du hangar : une grande plaque d'or qui respire, un reflet qui passe, le mot en grand. */
  function dessinerDecoller(p: Peintre): void {
    const bw = W - 24
    const bh = 24
    const bx = 12
    const by = H - HAUT_NAV - 34
    const respire = 0.6 + 0.4 * Math.sin(t * 4)
    p.glow(W / 2, by + bh / 2, 50, PEPITE[2], 0.1 + 0.1 * respire)
    const cycle = (t % 3.2) / 3.2
    const pret = decollageA === null
    boutonBase(p, bx, by, bw, bh, pret, () => {
      decollageA = t
      feuille = false
      gerbe(W / 2, by + bh / 2, 18, [PEPITE[2], PEPITE[3], N.WHITE], 70)
    }, (dx, dy) => {
      motEnRelief(p, 'Decoller', W / 2 + dx, by + 5 + dy, 2, true)
      // des chevrons qui courent vers le mot
      const o = Math.floor(t * 8) % 3
      for (let i = 0; i < 2; i++) {
        p.text('>', bx + 6 + i * 4 + (i === o % 2 ? 1 : 0) + dx, by + 10 + dy, PEPITE[i === o % 2 ? 4 : 2])
        p.text('<', bx + bw - 9 - i * 4 - (i === o % 2 ? 1 : 0) + dx, by + 10 + dy, PEPITE[i === o % 2 ? 4 : 2])
      }
    }, 'decolle', cycle < 0.4 ? bx - 12 + ((bw + 36) * cycle) / 0.4 : null)
    p.text(texteNu(`build ${build}`), W - 3, H - HAUT_NAV - 7, COQUE[2], { align: 'right' })
  }

  /** La position du surlignage de la liste : il glisse jusqu'à la rangée choisie. */
  let surligneY = -1
  /** L'instant où l'on a choisi une autre pièce : ses jauges se remplissent de nouveau. */
  let choixA = -10
  /**
   * LA LISTE D'UNE PLACE : l'en-tête (le retour, le titre de la place), les puces de sous-catégorie, la liste qui glisse
   * au doigt (quatre rangées, le surlignage qui glisse), puis LA FICHE de la pièce choisie — son bouton (ACHETER,
   * ÉQUIPER, RETIRER, ou ÉQUIPÉ) et ses stats.
   */
  function dessinerLaListe(p: Peintre, y0: number): void {
    let y = y0
    enTete(p, y, titreDe({ o: onglet, k: placeOuverte() }), () => changerDEtape('vaisseau'))
    y += HT + 4
    // au HANGAR, les pièces qu'on possède ; au LABO, celles qu'on n'a pas encore
    const liste = listeVisible(onglet).filter((pc) => (vue === 'labo') !== possede(hangar, pc.id))
    const familles = famillesDe(onglet)
    if (familles.length > 0) {
      const puces: (string | null)[] = [null, ...familles]
      const noms = puces.map((f) => (f === null ? 'TOUT' : (NOMS_FAMILLE[f] ?? f.toUpperCase())))
      const largeurs = noms.map((n) => p.measure(n)[0] + 10)
      let x = Math.floor((W - largeurs.reduce((a, b) => a + b, 0) - (puces.length - 1) * 3) / 2)
      puces.forEach((f, i) => {
        const actif = sousCategorie[onglet] === f
        const xi = x
        if (actif) {
          panel(p, xi, y, largeurs[i], 11, ENCRE_OR, { r: 2 })
          p.text(noms[i], xi + largeurs[i] / 2, y + 3, N.WHITE, { align: 'center' })
        } else {
          // une puce éteinte : d'encre, elle s'enfonce et s'éclaire comme les boutons
          const e = etatDuBouton(xi, y, largeurs[i], 11)
          panel(p, xi, y + e.dy, largeurs[i], 11, e.survole ? { ...ENCRE, rim: COQUE[3] } : ENCRE, { r: 2 })
          p.text(noms[i], xi + largeurs[i] / 2, y + 3 + e.dy, COQUE[5], { align: 'center' })
          zone(xi, y, largeurs[i], 11, () => ((sousCategorie[onglet] = f), (defil[onglet] = 0), (choixA = t)))
        }
        x += largeurs[i] + 3
      })
      y += 14
    }
    const hl = RANGEES * 13 + 4
    panel(p, 4, y, W - 8, hl, { ...ENCRE, top: ENCRE.body }, { r: 2 })
    const maxDefil = Math.max(0, liste.length - RANGEES)
    defil[onglet] = Math.max(0, Math.min(maxDefil, defil[onglet]))
    const depart = Math.round(defil[onglet])
    const yl = y + 2
    zoneGlissante = maxDefil > 0 ? { x: 4, y: yl, w: W - 8, h: RANGEES * 13 } : null
    const larg = W - (maxDefil > 0 ? 18 : 12)
    // le surlignage glisse jusqu'à la rangée choisie
    const ic = liste.findIndex((x) => x.id === choix[onglet])
    const iSel = ic < 0 ? 0 : ic
    const cibleY = yl + (iSel - depart) * 13
    surligneY = surligneY < 0 || Math.abs(surligneY - cibleY) > 60 ? cibleY : ressort(surligneY, cibleY, 22)
    if (liste.length > 0 && iSel >= depart && iSel < depart + RANGEES) {
      const sy = Math.round(surligneY)
      p.rect(6, sy, larg, 13, COQUE[1])
      p.rect(6, sy, 2, 13, PEPITE[2])
    }
    for (let i = depart; i < Math.min(liste.length, depart + RANGEES); i++) {
      const pc = liste[i]
      const ly = yl + (i - depart) * 13
      const choisie = i === iSel
      const montee = estMontee(hangar, pc.id)
      if (!choisie && survol !== null && survol.y >= ly && survol.y < ly + 13 && survol.x >= 4 && survol.x < W - 4) p.rect(6, ly, larg, 13, N.hex('#1c1828'))
      p.text(texteNu(pc.nom), 12, ly + 3, choisie ? N.WHITE : montee ? COQUE[6] : COQUE[5], { font: 'big' })
      const xd = W - (maxDefil > 0 ? 15 : 9)
      const ki = placeOuverte()
      const ailleurs = ki >= 0 ? listeMontee(onglet).indexOf(pc.id) : -1
      if (ki >= 0 && montee && ailleurs !== ki) p.text(titreDe({ o: onglet, k: ailleurs }), xd, ly + 4, COQUE[4], { align: 'right' })
      else if (montee) p.text('EQUIPE', xd, ly + 4, PEPITE[2], { align: 'right' })
      else if (!possede(hangar, pc.id)) nombreDeCredits(p, pc.prix, xd + 2, ly + 3, peutAcheter(hangar, credits, pc.id) ? PEPITE[3] : COQUE[3])
      zone(4, ly, W - 8, 13, () => ((choix[onglet] = pc.id), (choixA = t)), choisie ? null : 'clic')
    }
    if (maxDefil > 0) {
      const hg = RANGEES * 13 - 2
      p.rect(W - 10, yl + 1, 3, hg, ENCRE.outline)
      const hc = Math.max(6, Math.round((hg * RANGEES) / liste.length))
      const yc = yl + 1 + Math.round(((hg - hc) * defil[onglet]) / maxDefil)
      p.rect(W - 10, yc, 3, hc, COQUE[3])
      p.rect(W - 10, yc, 3, 1, COQUE[5])
    }
    if (liste.length === 0) p.text(vue === 'labo' ? 'TOUT EST DEBLOQUE' : 'RIEN ICI : PASSEZ AU LABO', W / 2, y + 24, COQUE[4], { align: 'center' })
    y += hl + 4
    const pc = liste[iSel]
    if (pc === undefined) return
    dessinerLaFiche(p, y, pc)
  }

  /** Une pièce montée : l'onde sur l'aire, le flash du vaisseau, des étincelles sur lui. */
  function feterLEquipement(): void {
    equipeA = t
    const cy = Y_SCENE + hautScene - Math.min(58, Math.floor(hautScene / 2) + 8)
    gerbe(W / 2, cy, 16, [PEPITE[2], PEPITE[3], N.WHITE], 55)
  }

  /** LA FICHE d'une pièce : son bouton, puis ses stats (le graphisme à gauche, le nom, les jauges, la note). */
  function dessinerLaFiche(p: Peintre, y0: number, pc: Piece): void {
    let y = y0
    const largeurDe = (mot: string): number => p.measure(texteNu(mot), { font: 'big' })[0] + 18
    const ko = placeOuverte()
    if (ko >= 0 && possede(hangar, pc.id) && listeMontee(onglet)[ko] !== pc.id) {
      const bw = largeurDe('Equiper')
      bouton(p, W / 2 - bw / 2, y, bw, 14, 'Equiper', true, () => {
        hangar = monterA(hangar, pc.id, ko)
        sauver()
        feterLEquipement()
      }, true, 'equipe')
    } else if (estMontee(hangar, pc.id)) {
      if (pc.sorte === 'arme' || pc.sorte === 'outil') {
        const bw = largeurDe('Retirer')
        bouton(p, W / 2 - bw / 2, y, bw, 14, 'Retirer', true, () => {
          hangar = demonter(hangar, pc.id)
          sauver()
        }, true, 'retour')
      } else {
        motEnRelief(p, 'Equipe', W / 2, y + 3, 1, true)
        N.sparkle(p, W / 2 + 26, y + 3, 1 + Math.round(1.5 + 1.5 * Math.sin(t * 5)), PEPITE[3], N.WHITE, 0.8)
      }
    } else if (possede(hangar, pc.id)) {
      const bw = largeurDe('Equiper')
      bouton(p, W / 2 - bw / 2, y, bw, 14, 'Equiper', peutMonter(hangar, pc.id), () => {
        hangar = monter(hangar, pc.id)
        sauver()
        feterLEquipement()
      }, true, 'equipe')
    } else {
      // ACHETER en relief, le prix en beige et l'icône des crédits ; éteint s'il manque des crédits — il tremble alors
      const vif = peutAcheter(hangar, credits, pc.id)
      const wa = p.measure('ACHETER', { font: 'big' })[0]
      const wn = p.measure(String(pc.prix), { font: 'big' })[0]
      const bw = wa + 5 + wn + 12 + 18
      const bx = Math.round(W / 2 - bw / 2)
      boutonBase(p, bx, y, bw, 14, vif, () => {
        const r = acheter(hangar, credits, pc.id)
        if (r === null) return
        hangar = r.hangar
        credits = r.credits
        sauver()
        gerbe(W / 2, y + 7, 20, [PEPITE[2], PEPITE[3], RUNE[3], N.WHITE], 70)
      }, (dx, dy) => {
        motEnRelief(p, 'Acheter', bx + 9 + wa / 2 + dx, y + 3 + dy, 1, vif)
        p.text(String(pc.prix), bx + 9 + wa + 5 + dx, y + 3 + dy, vif ? PEPITE[3] : COQUE[3], { font: 'big' })
        dessinerUnCredit(p, bx + 9 + wa + 5 + wn + 6 + dx, y + 6 + dy)
      }, 'achat')
    }
    y += 18
    const jauges = jaugesDe(pc)
    const enPlace = pc.sorte === 'arme' ? null : pc.sorte === 'outil' ? (pc.famille === 'foreuse' ? foreuseMontee(hangar) : null) : monteeA(hangar, pc.sorte)
    const reperes = enPlace !== null && enPlace.id !== pc.id ? jaugesDe(enPlace) : null
    const gx = 54
    const note = pc.note === undefined ? [] : replier(p, pc.note, W - 20)
    const hh = Math.max(50, 16 + jauges.length * 10 + 4)
    const hd = hh + (note.length > 0 ? note.length * 7 + 7 : 0)
    panel(p, 4, y, W - 8, hd, ENCRE, { r: 2 })
    panel(p, 8, y + 4, 42, hh - 8, { ...ENCRE, rim: ENCRE.top, top: ENCRE.low, body: ENCRE.low }, { r: 2 })
    dessinerLePictogramme(p, pc, 29, y + hh / 2, 42, hh - 8)
    p.text(texteNu(pc.nom), gx + (W - 12 - gx) / 2, y + 4, PEPITE[3], { font: 'big', align: 'center' })
    // les jauges se remplissent en arrivant (de gauche à droite, l'une après l'autre)
    jauges.forEach((j, i) => {
      const k = sortie((t - Math.max(etapeA, choixA) - 0.05 - i * 0.04) / 0.3)
      const jj = { ...j, valeur: j.nombre ? j.valeur : j.valeur * k }
      dessinerUneJaugeDePiece(p, y + 16 + i * 10, jj, reperes === null || reperes[i] === undefined ? null : reperes[i].valeur / reperes[i].max, j.nom === 'Poids', gx)
    })
    note.forEach((li, i) => p.text(li, W / 2, y + hh + 3 + i * 7, COQUE[4], { align: 'center' }))
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
    // l'aimant : un petit fer à cheval rouge à l'arrière du toit
    if (allure.aimant) {
      p.line(-4.5, -1.5, -3, -1.5, ROUGE[3])
      p.line(-4.5, 1.5, -3, 1.5, ROUGE[3])
      p.line(-4.5, -1.5, -4.5, 1.5, ROUGE[3])
    }
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
    // LA SOUTE (la capacité de la coque) : sous les compteurs du porté, ce qu'on porte sur ce qu'on peut ; pleine, en rouge
    const soutePleine = m.minerai >= CONF.capacite
    p.text(`SOUTE ${m.minerai}/${CONF.capacite}`, COMPTEUR.x, COMPTEUR.y + visibles.length * 11 + (visibles.length > 0 ? 2 : 0), soutePleine ? (Math.floor(t * 4) % 2 === 0 ? ROUGE[4] : ROUGE[3]) : COQUE[3])
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
              jouer('extrait')
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
              jouer('perdu')
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
      // les sons continus : le souffle du propulseur suit la flamme, la foreuse bourdonne quand elle creuse
      regler(m.phase === 'vol' ? flamme : 0, m.phase === 'vol' && m.forage !== null)
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
      e.fx.options.y = e.y - camera.y + H / 2
    }
    effets = effets.filter((e) => !e.fx.done())

    N.clearFrame(frame)
    const p = N.painterFor(frame)
    const visible = ecranVisible()
    if (visible && !ecranEtait) ouvrirLeHangar()
    ecranEtait = visible
    if (visible) {
      regler(0, false) // (au hangar, plus de souffle ni de foreuse)
      // LE HANGAR à la place du monde (Keko : « je ne veux pas voir l'extracteur ni le niveau derrière ») : la scène, puis l'interface
      dessinerLaBase(p)
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
    // `&latence` : la latence audio mesurée par l'appareil, en bas à gauche (ce qui se teste doit s'ouvrir d'un lien)
    if (parametres.has('latence')) p.text(`SON ${latenceMs()} MS`, 6, 40, N.WHITE, { font: 'big', outline: COQUE[0] }) // (en haut à gauche, sous la soute, bien lisible)
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

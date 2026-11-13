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
import { asteroidesVisibles, avancerLeMonde, lancerLaBombe, porteeDeLaBombe, cargaisonVide, larguer, centreQuiSuit, directionDuManche, MANCHE, MINERAIS, nouveauMonde, partDeLaPostcombustion, postcombustion, rechargeDeLaPostcombustion, solidite, stationDeLaCase, stationLaPlusProche, tire, totalDe, VAISSEAU as C, type Cargaison, type ConfigVaisseau, type Minerai, type Forage, type Vaisseau, type Vecteur } from '../../logic/vaisseau/jeu.ts'
import { acheter, ajouterLesPiecesDEssai, capacite, poidsTotal, POIDS_SERIE, configDuHangar, demonter, demonterA, EMPLACEMENTS, estMontee, FICHES_MINERAI, foreuseMontee, hangarNeuf, jaugesDe, montantCourt, monteeA, monter, monterA, peutAcheter, peutMonter, pieceDe, piecesDe, possede, aimantMonte, radarMonte, type Jauge, type Piece, type Sorte } from '../../logic/vaisseau/hangar.ts'
import { drawWord, spell } from 'pixelfx/fx/ui/_lib'
import { textWidth } from 'pixelfx'
import { HAUT_ACCENTS } from './police.ts'
import { boiteDe, boucheMontee, gabaritDe, placeDOutil, queueDe, canonDeLaForeuse, formesDeLAimant, formesDuChassis, formesDeLaForeuse, formesDeLArme, formesDuPropulseur, formesDuRadar, formesDuVaisseau, LIVREES, ovale, peindreDansUneCase, peindreFormes, rampesDeLaLivree, tonsDeLaLivree } from './rendu-vaisseau.ts'
import { chargerConnues, chargerHangar, chargerLivree, chargerReglages, sauverConnues, sauverHangar, sauverLivree, sauverReglages } from './hangar.ts'
import { estTerminee, etapesFaites, modeleDe, noter, ongletOuvert, quetesNeuves, quetesSansTutoriel, reclamer, tutorielFini, TUTORIEL, type Activite, type Compteur } from '../../logic/vaisseau/quetes.ts'
import { annulerLOrdre, coursA, gainDe, historiqueDe, marcheNeuf, ordreNumero, ordresDe, poserUnOrdre, previsionDe, prixPlafond, reglerLeMarche, tendanceDe, vendreAuCours } from '../../logic/vaisseau/marche.ts'
import { aLaMecanique, BRANCHES, configDuLabo, coutDe, debloquer, estDebloque, laboNeuf, noeudDe, noeudsDe, NOMS_BRANCHE, passifsDe, peutDebloquer, pieceOuverte, rangOuvert, RANGS, type Branche, type Mecanique, type Noeud } from '../../logic/vaisseau/labo.ts'
import { ECLOSION_DE_L_ARRIVEE, jouer, latenceMs, regler, reveiller, type Son } from './sons.ts'
import { dessinerAsteroide, dessinerPepite, LUMIERE, rocheDe, TEINTES_MINERAI } from './asteroide.ts'
import { dessinerBase, dessinerStation, ENVERGURE_BASE, RECUL_DE_LA_BASE } from './station.ts'
import { animerAstre, astresVisibles, demiTailleDeLAstre, peindreAstre, rayonQuiCache, voilerLAstre, type Astre, type PeintreCeleste } from './celeste.ts'
import * as EXPLOSION from '../pixelfx/fx/keko/explosion-espace.js'
import * as TELEPORTATION from '../pixelfx/fx/keko/teleportation.js'
import { RASSEMBLE as TELEPORTE_A } from '../pixelfx/fx/keko/teleportation.js'
import * as MATERIALISATION from '../pixelfx/fx/keko/materialisation.js'
import * as QUETE_TERMINEE from '../pixelfx/fx/keko/quete-terminee.js'
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
  /** Ajoute de la lumière à un pixel (la couche de lumière du tampon). */
  light(x: number, y: number, c: number, k?: number): void
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
// (… ET, TÉLÉPHONE COUCHÉ, LE VOL EST EN PAYSAGE — 13/11, voir `cadrer` : le tampon du vol fait alors de 320 à 480 de
// large sur 180 à 240 de haut ; la base, elle, reste dessinée sur 180 de large)
let W = 180
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
  /**
   * L'HEURE DU MARCHÉ : celle de l'appareil — injectée d'ici, la règle n'a pas d'horloge. `&marche=N` la fait courir N
   * fois plus vite depuis l'ouverture de la page, pour voir la courbe bouger et un ordre se régler sans attendre (un
   * essai : l'heure accélérée part dans la sauvegarde, un ordre posé ainsi attendra que la vraie la rattrape).
   */
  const ouvertA = Date.now()
  const hate = Math.max(1, Number(parametres.get('marche')) || 1)
  const heureDuMarche = (): number => ouvertA + (Date.now() - ouvertA) * hate
  let { hangar, tresor, credits, labo, marche, quetes } = chargerHangar(heureDuMarche())
  /** `&tuto=0` : le tutoriel des quêtes est passé d'emblée (tous les onglets ouverts), pour essayer la suite d'un lien. */
  if (parametres.get('tuto') === '0' && !tutorielFini(quetes)) quetes = quetesSansTutoriel(1, (x) => aLaMecanique(labo, x as Mecanique))
  const sauver = (): void => sauverHangar(hangar, tresor, credits, labo, marche, quetes)
  /** LA LIVRÉE du vaisseau du joueur (Keko, 12/11) : la couleur de sa coque et de ses ailes, choisie au hangar. */
  let livree = LIVREES.some((l) => l.id === chargerLivree()) ? chargerLivree() : 'serie'
  const rampesDuJoueur = (): ReturnType<typeof rampesDeLaLivree> => rampesDeLaLivree(livree)
  /** LES RÉGLAGES du joueur (l'onglet « Paramètres ») : de quel côté de l'écran il vole. */
  let reglages = chargerReglages()
  /**
   * LES RESSOURCES CONNUES (Keko, 13/11 : « une ressource ne devrait apparaître dans l'onglet commerce que si le joueur
   * en a déjà ramassé et extrait au moins un exemplaire ») : celles qui sont passées par l'entrepôt au moins une fois —
   * la base les note dès qu'elle en voit en stock ; tout vendre ne les fait pas oublier.
   */
  const connues = new Set<string>(chargerConnues())
  function noterLesConnues(): void {
    let neuve = false
    for (const k of MINERAIS) {
      if (tresor[k] > 0 && !connues.has(k)) {
        connues.add(k)
        neuve = true
      }
    }
    if (neuve) sauverConnues([...connues])
  }
  /**
   * IL S'EST PASSÉ QUELQUE CHOSE qu'une quête peut compter (un décollage, du minerai extrait, une vente…) : la règle
   * fait avancer les quêtes concernées ; celle qui se termine s'annonce, en vol comme à la base.
   */
  function compter(c: Compteur, valeur: number): void {
    const avant = new Set(quetes.actives.filter(estTerminee).map((q) => q.modele))
    const etapesAvant = new Map(quetes.actives.map((q) => [q.modele, etapesFaites(q)]))
    quetes = noter(quetes, c, valeur)
    for (const q of quetes.actives) {
      // UNE ÉTAPE FAITE (une mission à étapes) : son toast à elle — « Étape 2/3 » et ce qu'elle demandait ; la dernière
      // laisse la place au toast de la mission
      const mo = modeleDe(q.modele)
      const faites = etapesFaites(q)
      faites.forEach((faite, j) => {
        if (!faite || etapesAvant.get(q.modele)?.[j] === true) return
        etapeFaiteA[`${q.modele}-${j}`] = t
        if (estTerminee(q)) return
        toasts.push(N.createFx(QUETE_TERMINEE as Module, { x: W / 2, y: 0, title: `Étape ${j + 1}/${faites.length}`, titleFont: GRAS, text: mo?.etapes?.[j].dit ?? '', font: TEXTE, seed: 9 + toasts.length, emblem: 'check', palette: PALETTE_D_ETAPE }))
        jouer('equipe')
      })
      if (!estTerminee(q) || avant.has(q.modele)) continue
      // UN TOAST, celui de l'« achievement » du dépôt (`keko/quete-terminee`) : il glisse, sa médaille y saute
      toasts.push(N.createFx(QUETE_TERMINEE as Module, { x: W / 2, y: 0, title: 'Mission réussie', titleFont: GRAS, text: modeleDe(q.modele)?.titre ?? '', font: TEXTE, seed: 9 + toasts.length }))
      pulsations.quetes = t
      jouer('achat')
    }
  }
  /**
   * LE TOAST D'UNE ÉTAPE N'A PAS LA MÉDAILLE (Keko, 13/11 : « une animation similaire mais sans la médaille, qui indique
   * qu'il vient de valider une étape et non de finir une mission ») : le même toast, EN VERT, une case cochée à la
   * place de la médaille, moins d'étoiles ; l'or et la médaille restent à la mission réussie.
   */
  const PALETTE_D_ETAPE = ['#06200f', '#0a3a1e', '#14663a', '#1f9a58', '#35c878', '#7ef0a8', '#d8ffe6', '#ffffff']
  /** Quand chaque étape d'une mission à étapes a été faite (sa case s'allume un instant sur la carte). */
  const etapeFaiteA: Record<string, number> = {}
  /** Les toasts en cours (une quête terminée), au-dessus de tout, en vol comme à la base ; empilés s'il y en a plusieurs. */
  let toasts: Instance[] = []
  function dessinerLesToasts(dt: number): void {
    if (toasts.length === 0) return
    // (EN VOL COUCHÉ, TOUT EN HAUT — Keko, 13/11 : « presque au milieu de l'écran, ça cache l'écran » : il se rangeait
    // sous l'interface du haut, qui, couchée, est dans les bandeaux de côté ou dans les coins — le milieu du haut est libre)
    const y0 = (enJeu && !ecranVisible() ? (paysage ? 3 : basDuHud() + 14) : HAUT_BARRE + 6) + 18
    toasts.forEach((fx, i) => {
      fx.update(dt)
      fx.options.x = W / 2
      fx.options.y = y0 + i * 38
      fx.draw(frame)
    })
    toasts = toasts.filter((fx) => !fx.done())
    N.painterFor(frame) // (un effet laisse le peintre placé sur lui)
  }
  /** La plus grande distance à la base déjà comptée dans ce vol (on ne recompte que vingt unités plus loin). */
  let distanceComptee = 0
  /** Ce que la branche commerce du labo donne au marché : une prime sur les gains, un plafond d'ordre relevé. */
  const avantages = (): { prime: number; plafond: number } => {
    const pa = passifsDe(labo)
    return { prime: pa.vente, plafond: pa.plafond }
  }
  /** `&armes` : donne les trois armes (canon, mitrailleuse, missiles) au hangar de cet appareil, pour les essayer. */
  if (parametres.has('armes')) hangar = { ...hangar, possedees: [...new Set([...hangar.possedees, 'arme-canon', 'arme-rafale', 'arme-missiles'])] }
  // (les pièces d'essai ne sont portées par aucun nœud du labo : `&pieces` les donne, pour remplir les listes du hangar)
  if (parametres.has('pieces')) hangar = { ...hangar, possedees: [...new Set([...hangar.possedees, ...(['propulseur', 'coque', 'outil', 'arme'] as const).flatMap((o) => piecesDe(o)).filter((pc) => pc.id.startsWith('essai-')).map((pc) => pc.id)])] }
  /**
   * `&cuirasse` : LE CUIRASSÉ, tout monté, pour l'essayer d'un lien — sa coque, le propulseur ionique (en quatre
   * exemplaires), ses huit armes (canons, mitrailleuses, missiles) et ses quatre outils (la foreuse longue, le grand
   * aimant, le radar, une seconde foreuse). Le temps de la page : rien n'est écrit sur l'appareil.
   */
  if (parametres.has('cuirasse')) {
    const armes = ['arme-canon', 'arme-canon', 'arme-rafale', 'arme-rafale', 'arme-missiles', 'arme-missiles', 'arme-canon', 'arme-canon']
    const outils = ['foreuse-3', 'aimant-2', 'radar', 'foreuse-2']
    hangar = { possedees: [...new Set([...hangar.possedees, 'coque-4', 'propulseur-3', ...armes, ...outils])], montees: { ...hangar.montees, coque: 'coque-4', propulseur: 'propulseur-3' }, outils, armes }
  }
  /** `&stock=N` : pose N pépites DE CHAQUE MINERAI à l'entrepôt, pour essayer l'arbre du labo d'un lien. */
  if (parametres.has('stock')) {
    const n = Math.max(0, Math.floor(Number(parametres.get('stock')) || 0))
    tresor = { fer: n, or: n, cristal: n }
    sauver()
  }
  if (parametres.has('tresor')) {
    tresor = { ...tresor, fer: Math.max(0, Number(parametres.get('tresor')) || 0) }
    sauver()
  }
  if (credits0 !== null) {
    credits = credits0
    sauver()
  }
  /** La configuration du vaisseau du joueur : celle de série passée par les pièces montées — refaite à chaque décollage. */
  let CONF: ConfigVaisseau = configDuLabo(configDuHangar(BASE, hangar), labo)

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
  let zones: { x: number; y: number; w: number; h: number; action: () => void; son?: Son | null; dx?: number; dy?: number }[] = []

  // ---------------------------------------------------------------- l'état
  /** `&quai` : le compte de l'extraction court dès le départ, sans sortir du parvis — pour juger l'arc d'un lien. */
  /** La graine du vol en cours (zéro avant le premier décollage : l'espace de toujours, celui de l'accueil). */
  let graineDuVol = 0
  const monterLeMonde = () => {
    const monde = nouveauMonde(CONF, graineDuVol || 1)
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
  /**
   * `&banc` : LE BANC DE RÉGLAGE EN VOL (Keko, 13/11 : « une mini-interface, via un bouton en vol, pour jouer
   * manuellement sur la vitesse, l'accélération, la maniabilité et le poids total — des jauges que je peux remplir et
   * vider en direct, avec le chiffre associé »). Un bouton « Réglages » en haut de la vue ouvre quatre curseurs ; le
   * vol continue dessous, et la configuration du vaisseau suit le doigt. Les valeurs sont BRUTES — la pointe en px/s,
   * la poussée en px/s² AVANT le poids, la rotation en rad/s, le poids en tonnes — et le poids divise la poussée et le
   * frein comme dans `configDuHangar`. Chaque vol repart des réglages du vaisseau monté ; « Reset » y revient.
   */
  const BANC = parametres.has('banc')
  let bancOuvert = false
  let banc: { pointe: number; poussee: number; rotation: number; poids: number } | null = null
  /** Les réglages du vaisseau au décollage : ce que « Reset » rend. */
  let bancDeDepart: { pointe: number; poussee: number; rotation: number; poids: number } | null = null
  const allegeParLePoids = (poids: number): number => Math.max(0.5, poids) / POIDS_SERIE // (en proportion simple, comme `configDuHangar`)
  function appliquerLeBanc(): void {
    if (banc === null) return
    const f = allegeParLePoids(banc.poids)
    CONF = { ...CONF, vitesseMax: Math.max(0.01, banc.pointe), poussee: banc.poussee / f, frein: BASE.frein / f, rotation: banc.rotation, masse: banc.poids }
  }
  function dessinerLeBanc(p: Peintre): void {
    if (!BANC || banc === null || m.phase !== 'vol' || souteOuverte) return
    const b = banc
    curseurs = []
    const IVOIRE = N.hex('#fff2c8')
    const y0 = paysage ? 2 : basDuHud() + 4
    const mot = bancOuvert ? 'Fermer' : 'Réglages'
    const bw = largeurDe('Réglages', GRAS) + 14
    // (ouvert : « Reset » à côté de « Fermer » — il rend au vaisseau ses réglages du décollage)
    const br = largeurDe('Reset', GRAS) + 14
    const xb = bancOuvert ? Math.round(W / 2 - (bw + 4 + br) / 2) : Math.round(W / 2 - bw / 2)
    bouton(p, xb, y0, bw, 13, mot, true, () => (bancOuvert = !bancOuvert), 'onglet', 'acier')
    if (!bancOuvert) return
    const change = bancDeDepart !== null && (b.pointe !== bancDeDepart.pointe || b.poussee !== bancDeDepart.poussee || b.rotation !== bancDeDepart.rotation || b.poids !== bancDeDepart.poids)
    bouton(p, xb + bw + 4, y0, br, 13, 'Reset', change, () => {
      if (bancDeDepart === null) return
      banc = { ...bancDeDepart }
      appliquerLeBanc()
    }, 'retour', 'rouge')
    const RANGS: { nom: string; v: number; min: number; max: number; pas: number; dit: string; regler: (x: number) => void }[] = [
      { nom: 'Vitesse', v: b.pointe, min: 0, max: 300, pas: 1, dit: `${Math.round(b.pointe)}`, regler: (x) => (b.pointe = x) },
      { nom: 'Accél.', v: b.poussee, min: 0, max: 300, pas: 1, dit: `${Math.round(b.poussee)}`, regler: (x) => (b.poussee = x) },
      { nom: 'Maniab.', v: b.rotation, min: 0, max: 15, pas: 0.1, dit: b.rotation.toFixed(1).replace('.', ','), regler: (x) => (b.rotation = x) },
      { nom: 'Poids', v: b.poids, min: 1, max: 100, pas: 1, dit: `${Math.round(b.poids)} T`, regler: (x) => (b.poids = x) },
    ]
    // (couché : deux colonnes, pour laisser voir le vaisseau ; debout : une)
    const cols = paysage ? 2 : 1
    const lc = 150
    const w = cols * lc + 6
    const lignes = Math.ceil(RANGS.length / cols)
    // (debout, les rangées sont serrées et la lecture tient sur une ligne : le panneau s'arrête au-dessus du vaisseau)
    const pas = paysage ? 18 : 15
    const h = 6 + lignes * pas + 13
    const x = Math.round((W - w) / 2)
    const y = y0 + 16
    for (let yy = Math.max(0, y); yy < Math.min(H, y + h); yy++) frame.light.fill(0, yy * W + Math.max(0, x), yy * W + Math.min(W, x + w))
    plaque(p, x, y, w, h, 'encre')
    RANGS.forEach((r, i) => {
      const cx = x + 3 + (i % cols) * lc
      const ry = y + 6 + Math.floor(i / cols) * pas
      ecrire(p, r.nom, cx + 3, ry + 2, COQUE[5])
      dessinerUnCurseur(p, cx + 46, ry, 64, (r.v - r.min) / (r.max - r.min), (u) => {
        r.regler(Math.round((r.min + u * (r.max - r.min)) / r.pas) * r.pas)
        appliquerLeBanc()
      })
      ecrire(p, r.dit, cx + lc - 4, ry + 2, IVOIRE, { police: GRAS, align: 'right' })
    })
    // CE QUE ÇA DONNE : la vitesse de croisière (le frein du vide la borne à poussée / frein, quel que soit le poids),
    // le temps pour l'atteindre depuis l'arrêt, et la vitesse du moment
    // (LE FREIN NE S'OPPOSE PLUS À LA POUSSÉE : la pointe est toujours atteinte, en pointe ÷ (poussée ÷ poids) secondes
    // — sauf sans poussée du tout)
    const acceleration = b.poussee / allegeParLePoids(b.poids)
    const croisiere = acceleration > 0 ? b.pointe : 0
    const temps = acceleration > 0 ? Math.ceil(b.pointe / (acceleration * PAS)) * PAS : null
    const yl = y + 6 + lignes * pas + 1
    ecrire(p, `Croisière ${Math.round(croisiere)}${temps === null ? ' : aucune poussée' : ` en ${temps.toFixed(1).replace('.', ',')} s`}`, x + 6, yl, COQUE[4])
    ecrire(p, `${cols === 1 ? '' : 'Vitesse '}${Math.round(Math.hypot(v.vx, v.vy))}`, x + w - 6, yl, PEPITE[3], { align: 'right', police: GRAS })
    zone(x, y, w, h, () => undefined, null)
  }
  /** Les braises d'un propulseur ionique : du blanc bleuté au bleu sombre (la rampe de sa flamme, du chaud au froid). */
  const BRAISES_D_ION = [ION[6], ION[5], ION[4], ION[3], ION[3], ION[2], ION[2], ION[1]]
  /** Les étincelles des chocs vivent DANS LE MONDE : on garde leur point et on les replace sous la caméra à chaque image. */
  let effets: { fx: Instance; x: number; y: number }[] = []
  /** Le forage : les étincelles du point d'impact, les morceaux des roches éclatées (sans pesanteur : l'espace), les flashs. */
  const etincelles = new Grains(R)
  const morceaux = new N.Bits({ ground: () => Infinity })
  const flashs: { x: number; y: number; t0: number; r: number; c?: number[] }[] = []
  const pops: { x: number; y: number; t0: number; c: number[] }[] = []
  /** LE SCORE EN PIXELS (Keko : « dessiner le score en haut en pixel ») : une pépite ramassée VOLE du vaisseau au compteur, qui ne compte qu'à son arrivée, et s'allume. */
  const envols: { x: number; y: number; t0: number; minerai: Minerai; trace: [number, number][] }[] = []
  /** Les pépites ARRIVÉES à leur compteur : un anneau, un éclat (« coin collect »). */
  const arrivees: { x: number; y: number; t0: number; c: number[] }[] = []
  /** Ce que les compteurs montrent, par minerai (les pépites en vol n'y sont pas encore). Rien ne montre ce qui est déjà extrait (Keko). */
  const affiche: Cargaison = { ...cargaisonVide(), fer: minerai0 }
  const allumeA: Cargaison = { fer: -10, or: -10, cristal: -10 }
  /** Combien de secondes la pastille d'un minerai reste affichée après la dernière pépite ramassée (elle se referme sur la fin). */
  const TENUE_DU_PORTE = 3
  /** Ce qu'on vient de ramasser de chaque minerai, tant que sa pastille est affichée (le « +3 » qu'elle porte). */
  const recents: Cargaison = cargaisonVide()
  /** Le vaisseau touche une pépite la soute pleine (à l'image d'avant) ; quand « Soute pleine » a été redit. */
  let refusVu = false
  /** Quand « Soute pleine » a été dit pour la dernière fois (le mot reste posé sous la soute un instant). */
  let soutePleineDiteA = -10
  /** … « touche » avec UNE MARGE (Keko : « non pas quand on touche un minerai mais laisser une petite marge de plus ») : à seize unités de plus que le ramassage. */
  const MARGE_DU_REFUS = 16
  let refusA = -10
  /** Où chaque pastille du porté est dessinée (elle GLISSE vers sa place quand une voisine s'en va). */
  const xDuPorte: Partial<Record<Minerai, number>> = {}
  /**
   * L'INTERFACE DU VOL, DANS LA LANGUE DE LA BASE (Keko, 11/11) : ce qu'elle a vu à l'image d'avant, pour réagir au
   * changement — les points de coque entiers (celui qui tombe éclate), la soute pleine (la plaque bondit, une fois),
   * la part de la jauge de soute (elle glisse).
   */
  /**
   * LA BARRE DE BLINDAGE (voir `dessinerLeScore`) : ce qu'on a vu du blindage et du bouclier à l'image d'avant (un
   * coup, c'est une baisse), le FANTÔME — le morceau perdu, qui tient un instant avant de se vider — et l'instant du coup.
   */
  /** La seconde du compte de l'extraction dont la frappe a déjà lancé ses étincelles (−1 : aucune ; 999 : l'extraction a éclaté). */
  let battementVu = -1
  let coqueConnue = 0
  let coqueFantome = 0
  let coqueCoupA = -10
  let bouclierConnu = 0
  /** `&coup=N` : un coup toutes les N secondes en vol, sans jamais percer la coque — le banc de la barre de blindage ; `&bouclier=N` y ajoute N points de bouclier. */
  const coupDEssai = Math.max(0, Number(parametres.get('coup')) || 0)
  const bouclierDEssai = Math.max(0, Math.floor(Number(parametres.get('bouclier')) || 0))
  let coupDEssaiA = 0
  let soutePleineVue = false
  let souteVue = 0
  let secousse = 0
  let flamme = 0
  /**
   * LA POUSSÉE, DANS LE REPÈRE DU VAISSEAU (Keko, 13/11 : avec les deux manches, « c'est pas un peu bizarre qu'une
   * navette puisse reculer, alors que le propulseur est à l'arrière ? ») — la règle ne change pas, on bouge dans tous
   * les sens ; c'est l'image qui dit comment : LE PROPULSEUR ne souffle que pour la part de la poussée qui va VERS
   * L'AVANT, et DES JETS DE MANŒUVRE font le reste — ceux du nez pour reculer, ceux d'un flanc pour glisser vers
   * l'autre. `avant` : de 0 à 1 ; `retro` : de 0 à 1 ; `cote` : de −1 (vers bâbord) à 1 (vers tribord). Lissées.
   */
  const pousseeVue = { avant: 0, retro: 0, cote: 0 }
  /** Le compte de l'extraction à l'image d'avant, et s'il montait : la voix de la charge suit le compte, pas le parvis. */
  let compteVu = 0
  let compteMonte = false
  let t = 0
  /** La caméra : le vaisseau au centre, avec un peu d'avance dans le sens de la vitesse, amortie. */
  const camera = { x: 0, y: 0 }
  /** Jusqu'où la caméra passe devant le vaisseau à pleine vitesse (en pixels de la vue), et à quelle allure elle rejoint son point. */
  // (SUR LES CÔTÉS, 74 : Keko, 12/11, voulait le même décalage qu'en hauteur — l'écran est plus haut que large, on voit peu
  // sur les côtés ; mais la demi-largeur de la vue fait 90 : à 95 le vaisseau sortirait de l'écran ; à 74 il reste à
  // seize pixels du bord arrière)
  // (PUIS — Keko : « que le joueur ait une portée égale dans toutes les directions » : la vue fait 160 de demi-hauteur et
  // 90 de demi-largeur ; avec 74 d'avance sur les côtés et AUCUNE en hauteur, on voit 164 devant soi de côté, 160 en
  // montant ou en descendant. Et la caméra rejoint son point plus vite, 4,5 au lieu de 3.)
  // (PUIS UN PEU D'AVANCE EN HAUTEUR QUAND MÊME, 40 — Keko : « c'est dommage que la caméra laisse le vaisseau au centre
  // de l'écran alors qu'il avance ; pas très grave si elle est un peu plus avancée sur le haut et le bas, ça fait partie
  // du design d'un jeu conçu pour un écran de téléphone » : 200 devant soi en hauteur, 164 de côté)
  const AVANCE_DE_LA_CAMERA = { x: 74, y: 40, suivi: 4.5 }
  /** … et en paysage, où la vue montre 160 de côté et 90 en hauteur : l'inverse — peu de côté, davantage en hauteur. */
  const AVANCE_EN_PAYSAGE = { x: 40, y: 60 }

  /**
   * LE VOL EN PAYSAGE (Keko, 13/11 — le jeu va vers les deux manches, la coop, le PvP : « adapter le jeu au format
   * paysage du téléphone », une étape à la fois, LE VOL D'ABORD) : quand la page est plus large que haute ET qu'on
   * vole, le tampon se couche. La vue du vol y est fixe elle aussi, 320 × 180 (le portrait tourné) ; la largeur en trop
   * va à DEUX BANDEAUX DE CÔTÉ — la place des pouces —, la hauteur en trop au bandeau du haut. La base, l'accueil et les
   * écrans de fin restent en portrait, au milieu de l'écran couché, en attendant leur tour.
   */
  let paysage = false
  const veutLePaysage = (): boolean => {
    const st = getComputedStyle(racine)
    const marge = (v: string): number => parseFloat(v) || 0
    const large = racine.clientWidth - marge(st.paddingLeft) - marge(st.paddingRight)
    const haut = racine.clientHeight - marge(st.paddingTop) - marge(st.paddingBottom)
    // (étape 2 : LE HANGAR aussi ; les autres onglets restent debout en attendant leur tour)
    // (TOUT SE COUCHE — Keko, 13/11 : l'accueil, le vol, le hangar, puis « le reste de l'interface de la base »)
    return large > haut
  }
  function cadrer(): void {
    // le zoom vient de la largeur, et de la hauteur aussi : l'écran en pixels (l'accueil et le hangar) veut 320 px de
    // tampon — sur un PC en 1080 de haut, 3 plutôt que 6 ; la hauteur du tampon est celle de l'écran à ce zoom, bornée à 480
    // (la place UTILE : celle de la page moins les marges de sécurité de l'appareil — l'encoche, la caméra, la barre de
    // gestes ; installée, l'app va jusqu'aux bords et la barre du haut passait sous la caméra — Keko, 11/11)
    const st = getComputedStyle(racine)
    const marge = (v: string): number => parseFloat(v) || 0
    const large = racine.clientWidth - marge(st.paddingLeft) - marge(st.paddingRight)
    const haut = racine.clientHeight - marge(st.paddingTop) - marge(st.paddingBottom)
    paysage = veutLePaysage()
    let w = 180
    let h: number
    if (paysage) {
      zoom = Math.max(1, Math.min(6, Math.floor(large / 320), Math.floor(haut / 180)))
      w = Math.max(320, Math.min(480, Math.floor(large / zoom)))
      h = Math.max(180, Math.min(240, Math.floor(haut / zoom)))
    } else {
      zoom = Math.max(1, Math.min(6, Math.floor(large / 180), Math.floor(haut / 320)))
      h = Math.max(120, Math.min(480, Math.floor(haut / zoom)))
    }
    if (h !== H || w !== W || canvas.height !== h || canvas.width !== w) {
      W = w
      H = h
      canvas.width = W
      canvas.height = H
      frame = N.createFrame(W, H)
      img = g.createImageData(W, H)
    }
    canvas.style.width = `${W * zoom}px`
    canvas.style.height = `${H * zoom}px`
  }

  // ---------------------------------------------------------------- le manche (celui du survivor)
  let manche: { id: number; centre: Vecteur; doigt: Vecteur } | null = null
  /**
   * LE REGARD (Keko, 12/11 : « une fois le joystick enfoncé, si le joueur maintient un deuxième doigt et fait des
   * mouvements, on déplace l'orientation du vaisseau — maintien 1 = direction et orientation, maintien 2 = prend le pas
   * sur l'orientation ; et c'est toujours l'orientation qui détermine où va la caméra : le joueur peut avancer mais
   * regarder en arrière ») : un SECOND MANCHE flottant, posé par le second doigt ; il ne pousse pas, il tourne le nez.
   */
  let regard: { id: number; centre: Vecteur; doigt: Vecteur; tir?: boolean; t0?: number } | null = null
  /**
   * LA CAPACITÉ ACTIVE (Keko, 12/11 : « que la barre de capacité en bas soit cliquable et qu'une fois le clic activé, il
   * faille un deuxième clic sur l'écran pour déclencher la capacité ; et lors de ce deuxième clic, on peut également
   * insérer une direction en fonction du glissement ») : UNE TAPE SUR SON BOUTON L'ARME (une seconde la désarme) ;
   * armée, LE PROCHAIN APPUI SUR L'ÉCRAN LA LANCE — au relâchement : droit devant le nez si le doigt n'a pas glissé,
   * dans le sens du glissement sinon. Pendant qu'il glisse, ce doigt est le manche du regard : le nez tourne, la caméra
   * avance, un trait dit où elle partira. L'essai : une bombe, trois charges par vol.
   */
  let capaciteArmee = false
  let armeeA = -10
  /** La part du regard dans l'avance de la caméra, lissée (elle ne saute pas avec le pouce). */
  let partDuRegard = 0
  /** Où est la souris sur la vue du vol (en pixels du tampon), depuis qu'elle a bougé ; rien si elle est sortie. */
  let souris: Vecteur | null = null
  /** `&doigts` : la ligne de diagnostic des manches (le dernier événement tactile, les doigts posés, qui tient quoi). */
  let journalDesDoigts = ''
  /** Le décalage de la caméra par rapport au vaisseau (lissé ; la caméra elle-même ne traîne pas). */
  const decalageDeLaCamera = { x: 0, y: 0 }
  const touches = new Set<string>()
  /**
   * Le décollage, depuis le hangar (le bouton) ou au clavier : l'expédition part à neuf avec le vaisseau tel que monté
   * (la configuration se refait des pièces) ; après une coque percée ou une extraction, pareil — le trésor et les pièces
   * restent, c'est tout ce qui reste.
   */
  function demarrer(): void {
    if (enJeu && m.phase === 'vol') return
    if (enJeu && t - perduA < 1.2) return
    souris = null // (la souris ne vise qu'une fois bougée pendant ce vol)
    CONF = configDuLabo(configDuHangar(BASE, hangar), labo) // (les passifs et les mécaniques du labo par-dessus les pièces montées)
    // UN AUTRE ESPACE À CHAQUE VOL (Keko : « randomiser à chaque vol pour l'instant, histoire de tester ») : une graine
    // tirée ici — le hasard est du côté de la page — entre dans le champ d'astéroïdes, dans le monde (le rival) et dans
    // le ciel ; `&graine=N` la fixe (0 : l'espace de toujours)
    // (LES OBUS PARTENT DE LA BOUCHE DE LEUR ARME, là où elle est dessinée sous son aile — c'est le rendu qui la connaît)
    CONF = { ...CONF, armes: CONF.armes.map((a) => ({ ...a, bouche: boucheMontee(monteeA(hangar, 'coque').cran, a.id, a.place ?? 0) })) }
    // (… ET CHAQUE FOREUSE CREUSE DE LÀ OÙ ELLE EST MONTÉE : le pivot de son canon, à sa place d'outil)
    CONF = { ...CONF, foreuses: CONF.foreuses.map((f) => ({ ...f, place: ouEstLaForeuse(f.outil, f.cran) })) }
    graineDuVol = parametres.has('graine') ? Math.max(0, Math.floor(Number(parametres.get('graine')) || 0)) : 1 + Math.floor(Math.random() * 1e6)
    CONF = { ...CONF, champ: { ...CONF.champ, graine: graineDuVol } }
    if (bouclierDEssai > 0) CONF = { ...CONF, bouclier: { ...CONF.bouclier, points: bouclierDEssai } }
    // `&zero` (Keko, 13/11 : « la coque et le propulseur de base avec un poids de 0 et toutes ces statistiques à 0 : voir,
    // avec aucune statistique, comment se déplace le vaisseau ») : un banc d'essai — le châssis et le propulseur ne
    // pèsent plus rien, et le propulseur ne donne ni poussée, ni pointe, ni rotation. Le reste (outils, armes) ne change pas.
    if (parametres.has('zero')) {
      const reste = Math.max(0.5, poidsTotal(hangar) - monteeA(hangar, 'coque').poids - monteeA(hangar, 'propulseur').poids)
      const leger = reste / (monteeA(hangarNeuf(), 'coque').poids + monteeA(hangarNeuf(), 'propulseur').poids + reste)
      // (… PUIS, à zéro partout, le vaisseau ne bougeait pas du tout : « mets l'accélération et la vitesse au minimum pour
      // que le vaisseau bouge ». `&zero` : trois dixièmes de l'accélération et de la pointe de série, aucune rotation ;
      // `&zero=a,v,r` : les trois parts, de 0 à 1 — accélération, pointe, maniabilité. Une pointe infime plutôt que
      // nulle : la page divise par elle, et zéro la figeait.)
      const parts = (parametres.get('zero') ?? '').split(',').map(Number)
      const part = (i: number, defaut: number): number => (Number.isFinite(parts[i]) && (parametres.get('zero') ?? '') !== '' ? Math.max(0, parts[i]) : defaut)
      // (LE POIDS DIVISE LA POUSSÉE COMME LE FREIN — voir `configDuHangar` : n'alléger que le frein, comme d'abord, donnait
      // un vaisseau qui freinait quatorze fois plus fort sans pousser plus, et plafonnait à 4 px/s : « ça ne bouge pas »)
      CONF = { ...CONF, poussee: (BASE.poussee * part(0, 0.3)) / leger, vitesseMax: Math.max(0.01, BASE.vitesseMax * part(1, 0.3)), rotation: BASE.rotation * part(2, 0), frein: BASE.frein / leger, masse: reste }
    }
    // (`&banc` : les curseurs partent de ce vaisseau)
    if (BANC) {
      const poids = CONF.masse ?? POIDS_SERIE
      // (CHAQUE VOL REPART DES RÉGLAGES DU VAISSEAU QU'ON VIENT DE PRENDRE — Keko, 13/11 ; ils sont gardés pour le bouton
      // « Reset », qui annule les essais du vol)
      bancDeDepart = { pointe: CONF.vitesseMax, poussee: CONF.poussee * allegeParLePoids(poids), rotation: CONF.rotation, poids }
      banc = { ...bancDeDepart }
      appliquerLeBanc()
    }
    m = monterLeMonde()
    // (ce que le hangar a semé ne suit pas le vaisseau dans l'espace : les fumées et les étincelles du décollage, les
    // nombres qui montent — Keko, 13/11 : deux points de fumée du décollage restaient à l'écran à l'arrivée en vol)
    eclats.length = 0
    flottants.length = 0
    volantes.length = 0
    m.minerai = minerai0
    m.cargaison.fer = minerai0
    if (coque0 > 0) m.coque = Math.min(m.coque, coque0)
    m.tresor = { ...tresor }
    m.banque = totalDe(tresor)
    m.refuses = refuses // (le même objet : le panneau de soute le règle en vol)
    effets = []
    flashs.length = 0
    pops.length = 0
    arrivees.length = 0
    envols.length = 0
    for (const k of MINERAIS) affiche[k] = 0
    affiche.fer = minerai0
    flammesEnnemies.clear()
    toucheEnnemiA.clear()
    if (bouclierDEssai > 0) m.bouclier = bouclierDEssai
    coqueConnue = m.coque
    coqueFantome = m.coque
    coqueCoupA = -10
    bouclierConnu = m.bouclier
    coupDEssaiA = t + 2.5
    soutePleineVue = false
    souteVue = 0
    souteOuverte = false
    v = m.vaisseau
    decalageDeLaCamera.x = 0
    decalageDeLaCamera.y = 0
    partDuRegard = 0
    camera.x = 0
    camera.y = 0
    enJeu = true
    // (les quêtes : un décollage de plus ; la distance à la base repart de zéro)
    distanceComptee = 0
    compter('vols', 1)
    sauver()
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
  type Allure = { propulseur: number; coque: number; /** Le cran de la foreuse montée, 0 sans foreuse. */ foreuse: number; radar: boolean; aimant: boolean; armes: string[]; bouclier: number; outils?: ({ famille: string; cran: number } | null)[]; foreusePlace?: number; vises?: number[] }
  const ALLURE_SERIE: Allure = { propulseur: 1, coque: 1, foreuse: 1, radar: false, aimant: false, armes: [], bouclier: 0 }
  /** Les outils montés, PLACE PAR PLACE (pour une coque qui les dessine chacun à sa place), et la place de la foreuse qui creuse. */
  const outilsParPlace = (): ({ famille: string; cran: number } | null)[] =>
    Array.from({ length: capacite(hangar, 'outil') }, (_, k) => {
      const pc = pieceDe(hangar.outils[k] ?? '')
      return pc === undefined ? null : { famille: pc.famille ?? 'foreuse', cran: pc.cran }
    })
  /** Où le pivot de la foreuse montée à la place d'outil `k` se trouve sur le vaisseau (en unités, depuis son centre). */
  const ouEstLaForeuse = (k: number, cran: number): { x: number; y: number } => {
    const pl = placeDOutil(monteeA(hangar, 'coque').cran, k)
    return { x: canonDeLaForeuse(cran).pivot + pl.x, y: pl.y }
  }
  const placeDeLaForeuse = (): number => Math.max(0, hangar.outils.indexOf(foreuseMontee(hangar)?.id ?? ''))
  const allureMontee = (bouclier: number): Allure => ({ propulseur: monteeA(hangar, 'propulseur').cran, coque: monteeA(hangar, 'coque').cran, foreuse: foreuseMontee(hangar)?.cran ?? 0, radar: radarMonte(hangar) > 0, aimant: aimantMonte(hangar) > 1, armes: Array.from({ length: capacite(hangar, 'arme') }, (_, k) => pieceDe(hangar.armes[k] ?? '')?.arme?.id ?? ''), bouclier, outils: outilsParPlace(), foreusePlace: placeDeLaForeuse() })
  /** L'écran est là quand rien ne vole : avant le premier décollage, et après une fin, le temps que l'effet passe. */
  /**
   * L'ACCUEIL (Keko, 11/11 : « un écran d'accueil avec une demande de tap pour lancer le hangar, afin de débloquer les
   * sons — actuellement il faut que je tape avant que le jeu lance le son ; un bel écran dans le thème graphique du
   * jeu, et le titre : Nova Drifter ») : le jeu s'ouvre dessus, et c'est SA tape qui fait naître le contexte audio — le
   * hangar arrive donc avec ses sons. `&direct` le saute (ce qui se teste doit s'ouvrir d'un lien).
   */
  let accueil = !parametres.has('direct')
  let accueilQuitteA: number | null = null
  /**
   * L'ÉCRAN EST D'ABORD ÉTEINT (Keko, 11/11 : « c'est possible de mettre du son à l'apparition du titre avant le tap ? »
   * — non : un navigateur ne joue rien avant un geste ; alors LE GESTE PASSE DEVANT) : « Toucher pour allumer », et
   * c'est cette première tape qui allume le tube et fait frapper le titre, AVEC LEURS SONS ; la seconde, sur
   * « Toucher pour commencer », ouvre le hangar. Les heures du titre (le départ de chaque mot, l'instant où la
   * demande paraît) sont comptées depuis l'allumage ; les sons les lisent, ils ne les recopient pas.
   */
  let accueilAllumeA: number | null = null
  const HEURES_DU_TITRE = { nova: 0.78, drifter: 1.1, pret: 1.8 }
  function allumerLAccueil(): void {
    if (accueilAllumeA !== null) return
    accueilAllumeA = t
    jouer('allume')
    // (chaque mot a son souffle puis son impact : le son part avec le mot, l'impact y tombe à l'instant de la frappe)
    jouer('frappe', undefined, HEURES_DU_TITRE.nova)
    jouer('frappe', undefined, HEURES_DU_TITRE.drifter)
    if (typeof navigator.vibrate === 'function') navigator.vibrate(10)
  }
  const SORTIE_DE_L_ACCUEIL = 0.75
  /** La secousse de l'écran quand un mot du titre frappe (en pixels du tampon ; `dessinerLAccueil` la pose). */
  let secousseDeLAccueil = 0
  function quitterLAccueil(): void {
    // (éteint : la tape allume ; pendant que le titre arrive : elle attend la demande)
    if (accueilAllumeA === null) return allumerLAccueil()
    if (t - accueilAllumeA < HEURES_DU_TITRE.pret) return
    if (accueilQuitteA !== null) return
    accueilQuitteA = t
    jouer('accueil')
    if (typeof navigator.vibrate === 'function') navigator.vibrate(15)
  }
  /**
   * LA SOUTE S'OUVRE EN VOL (Keko, 11/11 : « permettre l'accès à la soute via un bouton, avec la possibilité de larguer
   * des loots ; ils sont alors détruits ») : la plaque de soute, en haut à gauche, est un bouton. Ouverte, LE MONDE EST
   * EN PAUSE (de moi, à rejuger : au doigt, on ne trie pas sa soute sous le feu).
   */
  let souteOuverte = false
  /**
   * LA SOUTE DÉFILE (Keko, 13/11 : « plus tard on aura des dizaines de ressources : il faut pouvoir scroller ») : la
   * première rangée montrée, la zone qui se fait glisser (null : tout tient), et `&rangsoute=N`, qui borne les rangées
   * montrées pour l'essayer. ET « TOUT » SE CONFIRME (« un petit message de confirmation quand un joueur décide de
   * larguer la totalité d'une ressource ; pas besoin pour −1 ») : le minerai dont on demande le largage, ou null.
   */
  let defilSoute = 0
  let zoneDeLaSoute: { x: number; y: number; w: number; h: number } | null = null
  const RANGS_DE_SOUTE_MAX = parametres.has('rangsoute') ? Math.max(1, Math.floor(Number(parametres.get('rangsoute')) || 1)) : 99
  let largageDemande: Minerai | null = null
  let souteA = -10
  /** Les minerais dont on REFUSE la collecte (Keko : « bloquer la collecte d'un élément ») : gardés d'une expédition à l'autre, le temps de la page. */
  const refuses: Record<Minerai, boolean> = { fer: false, or: false, cristal: false }
  function ouvrirLaSoute(): void {
    souteOuverte = true
    souteA = t
    defilSoute = 0
    largageDemande = null
    manche = null
    touches.clear()
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
  const defil: Record<Sorte, number> = { propulseur: 0, coque: 0, outil: 0, arme: 0 }
  /** Un glisser en cours sur la liste : d'où il part, le défilement d'alors, s'il a bougé (sinon c'est une tape). */
  let glisse: { x: number; y: number; defil0: number; bouge: boolean; sorte: 'liste' | 'onglets' | 'arbre' | 'curseur' | 'ordres' | 'inventaire' | 'cases' | 'missions' | 'soute'; curseur?: Curseur } | null = null
  /** UN CURSEUR qu'on fait glisser de côté (le panneau de vente) : sa zone, et ce qu'il règle, de 0 à 1 ; refaits à chaque image comme les zones. */
  type Curseur = { x: number; y: number; w: number; h: number; regler: (u: number) => void }
  let curseurs: Curseur[] = []
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
  /** Une catégorie A DE QUOI MONTRER : une pièce possédée, ou débloquée au labo (Keko, 11/11 : « masquer le bouton arme ou outil dans le hangar si aucune pièce n'est dispo ») — sinon sa case et sa cible sur le vaisseau ne paraissent pas. */
  const aDesPieces = (o: Sorte): boolean => piecesDe(o).some((pc) => possede(hangar, pc.id) || pieceOuverte(labo, pc.id))
  const casesDuVaisseau = (): Case[] =>
    vue === 'hangar' ? ONGLETS.filter(aDesPieces).flatMap((o): Case[] => (o === 'outil' || o === 'arme' ? Array.from({ length: capacite(hangar, o) }, (_, k) => ({ o, k })) : [{ o, k: -1 }])) : ONGLETS.map((o) => ({ o, k: -1 }))
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
  // (« PARAMÈTRES », toujours là, le premier des autres onglets — Keko, 12/11 : « ajouter un onglet paramètres dans autres
  // onglets »)
  const VUES: string[] = ['hangar', 'labo', 'entrepot', 'quetes', 'reglages', ...ESSAIS.slice(0, Math.max(0, Math.min(ESSAIS.length, Number(parametres.get('onglets') ?? 0) - 4)))]
  const estEssai = (vv: string): boolean => ESSAIS.includes(vv)
  const NOMS_VUE: Record<string, string> = { hangar: 'Hangar', labo: 'Recherche', entrepot: 'Commerce', quetes: 'Missions', reglages: 'Paramètres', carte: 'Carte', atelier: 'Atelier', marche: 'Marché', equipage: 'Équipage', missions: 'Missions', journal: 'Journal', trophees: 'Trophées', radio: 'Radio', forge: 'Forge', ...Object.fromEntries(Array.from({ length: 10 }, (_, i) => [`essai-${i + 1}`, `Essai ${i + 1}`])) }
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
          // (annoncé en avance, on ne sait pas encore ce que coûtera le choc : sous un point entier de bouclier, on
          // annonce le blindage — c'est lui qui a la priorité)
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
  type Matiere = 'encre' | 'or' | 'creux' | 'eteint' | 'acier' | 'vert' | 'rouge' | 'clair'
  type Teintes = { contour: number; ombre: number; corps: number; haut: number; lumiere: number; lumiere2: number; grain: number; spec?: number }
  const MATIERES: Record<Matiere, Teintes> = {
    encre: { contour: N.hex('#07050d'), ombre: N.hex('#110d1a'), corps: N.hex('#1b1626'), haut: N.hex('#231d31'), lumiere: N.hex('#463b61'), lumiere2: N.hex('#342b4a'), grain: N.hex('#2a2339') },
    or: { contour: N.hex('#2a1404'), ombre: N.hex('#8a4a0c'), corps: N.hex('#c98416'), haut: N.hex('#e3a628'), lumiere: N.hex('#ffe58a'), lumiere2: N.hex('#f6c94a'), grain: N.hex('#d8961e'), spec: N.hex('#fff7d6') },
    creux: { contour: N.hex('#07050d'), ombre: N.hex('#0a0811'), corps: N.hex('#110d19'), haut: N.hex('#0e0b16'), lumiere: N.hex('#2c2440'), lumiere2: N.hex('#211b30'), grain: N.hex('#161221') },
    eteint: { contour: N.hex('#0b0a10'), ombre: N.hex('#15131b'), corps: N.hex('#1a1820'), haut: N.hex('#1d1b24'), lumiere: N.hex('#1d1b24'), lumiere2: N.hex('#1d1b24'), grain: N.hex('#1f1d27') },
    acier: { contour: N.hex('#07070d'), ombre: N.hex('#121624'), corps: N.hex('#1c2236'), haut: N.hex('#232b42'), lumiere: N.hex('#4a5a80'), lumiere2: N.hex('#36425f'), grain: N.hex('#283149') },
    vert: { contour: N.hex('#03110a'), ombre: N.hex('#0a2a1a'), corps: N.hex('#0f3a25'), haut: N.hex('#14492f'), lumiere: N.hex('#4ee08a'), lumiere2: N.hex('#2a9a5c'), grain: N.hex('#165236') },
    // (le rouge de ce qui défait — « Annuler l'ordre » ; Keko, 11/11 : « tenter en rouge le bouton annuler l'ordre, comme on tente en vert le bouton vendre »)
    // (L'ACIER CLAIR du conteneur de la soute : la touche qui l'ouvre — Keko, 13/11 : l'or « rappelle trop la barre de
    // blindage » ; « assez clair pour être mis en avant, dans les tons des éléments graphiques de la soute »)
    clair: { contour: N.hex('#07070d'), ombre: N.hex('#46587a'), corps: N.hex('#8399bd'), haut: N.hex('#9fb4d2'), lumiere: N.hex('#ffffff'), lumiere2: N.hex('#d6e4f5'), grain: N.hex('#8ea4c6'), spec: N.hex('#ffffff') },
    rouge: { contour: N.hex('#12040a'), ombre: N.hex('#2c0a14'), corps: N.hex('#3e0f1c'), haut: N.hex('#4e1424'), lumiere: N.hex('#f0707a'), lumiere2: N.hex('#a8323e'), grain: N.hex('#5a1828') },
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
    // (UN PANNEAU EST D'UN SEUL TON — Keko, 12/11 : « tu dessines la texture en deux parties, plus claire en haut et plus
    // foncée en bas ; ça sépare en deux à des endroits pas très cohérents » : la coupure à mi-hauteur tombait n'importe
    // où dans un grand panneau. Elle ne reste que sur les petites plaques — boutons, touches, en-têtes —, où elle fait
    // le bombé ; au-dessus de trente pixels de haut (« Décoller » en fait vingt-huit), tout le corps a le ton clair.)
    const uni = h > 30
    const haut = enf ? T.corps : T.haut
    const corps = uni ? haut : enf ? T.ombre : T.corps
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
  /** Les chiffres des fiches : fins, à pans coupés (`police.ts`). */
  const CHIFFRES = 'keko-chiffres'
  type Police = typeof TEXTE | typeof GRAS | typeof TITRE | typeof ENTETE | typeof CHIFFRES
  const decalage = (f: Police): number => (f === TITRE ? HAUT_ACCENTS * 2 : HAUT_ACCENTS)
  function ecrire(p: Peintre, s: string, x: number, y: number, c: number, o: { police?: Police; align?: 'center' | 'right'; ombre?: number; contour?: number } = {}): void {
    const f = o.police ?? TEXTE
    p.text(s, Math.round(x), Math.round(y) - decalage(f), c, { font: f, align: o.align, shadow: o.ombre, outline: o.contour })
  }
  const largeurDe = (s: string, f: Police = TEXTE): number => textWidth(s, f)
  /**
   * UN MOT EN RELIEF (la lettre des effets ui/ du dépôt, `drawWord` : un dégradé, un haut lit, un dessous ombré, un
   * contour), centré sur x ; en or ou en acier ; `reflet` fait passer l'éclat diagonal du dépôt sur le mot.
   * ADOUCI (Keko, 11/11 : « de petites lignes blanches, comme dans le L de Labo, qui rendent moche ; et le contraste
   * entre le jaune et le marron est trop fort, le marron est trop foncé ») : le haut lit n'est plus un filet presque
   * blanc mais le ton clair du dégradé, et le bas du dégradé comme le dessous sont remontés d'un brun sombre à un ocre.
   */
  function motEnRelief(p: Peintre, s: string, x: number, y: number, or: boolean | 'ivoire', f: Police = GRAS, reflet: number | null = null, echelle = 1): void {
    const mot = spell(s, f) as { letters: { g: unknown; x: number }[]; w: number }
    const e = echelle
    const items = mot.letters.filter((L) => L.g).map((L) => ({ g: L.g, x: Math.round(x - (mot.w * e) / 2) + L.x * e, y: Math.round(y) - decalage(f) * e, sx: e, sy: e }))
    // (« ivoire » : la lettre des plaques d'en-tête — un ivoire éclairé d'en haut, ombré de bronze dessous)
    const st = or === 'ivoire'
      ? { fill: [N.hex('#c9b98c'), N.hex('#efe2b8'), N.hex('#fff7d6')], edge: N.WHITE, under: N.hex('#8f7d54'), outline: N.hex('#0b0d16'), shadow: 0 }
      : or
      ? { fill: [N.hex('#e0a020'), PEPITE[2], N.hex('#ffe068')], edge: N.hex('#ffe68a'), under: N.hex('#b87a14'), outline: N.hex('#1e0e03'), shadow: 0 }
      : { fill: [COQUE[3], COQUE[4], COQUE[5]], edge: COQUE[5], under: N.hex('#57698c'), outline: N.hex('#07050d'), shadow: 0 }
    drawWord(p, items, reflet === null ? st : { ...st, shine: Math.round(x - (mot.w * e) / 2) + reflet })
  }
  /**
   * UN MOT QUI FRAPPE (les chiffres du « countdown » du dépôt) : la lettre grasse à l'échelle `e` — qui peut ne pas
   * être entière : le mot arrive énorme et retombe à sa taille sur un ressort raide —, centrée sur (cx, cy), en or,
   * cernée de deux pixels ; `flash` la blanchit.
   */
  function motFrappe(p: Peintre, s: string, cx: number, cy: number, e: number, flash: number): void {
    const mot = spell(s, GRAS) as { letters: { g: unknown; x: number }[]; w: number }
    const x0 = cx - (mot.w * e) / 2
    const y0 = cy - 5.5 * e // (les capitales tiennent sur les rangées 2 à 8 de la boîte de 11)
    const items = mot.letters.filter((L) => L.g).map((L) => ({ g: L.g, x: x0 + L.x * e, y: y0, sx: e, sy: e, flash }))
    drawWord(p, items, { fill: [N.hex('#a8650f'), PEPITE[2], N.hex('#ffe68a')], edge: N.hex('#fff7d6'), under: N.hex('#6b3a0c'), outline: N.hex('#1e0e03'), ow: 2, shadow: N.hex('#0a0408') })
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
  function nombreDeCredits(p: Peintre, n: number | string, x: number, y: number, c: number, centre = false): void {
    const s = typeof n === 'string' ? n : String(n)
    const w = largeurDe(s, GRAS)
    const x0 = centre ? x - (w + 12) / 2 : x - w - 12
    ecrire(p, s, x0, y, c, { police: GRAS })
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
  /**
   * L'ORIGINE DE LA FENÊTRE EN COURS (le paysage, étape 2) : couchée, la base se dessine par FENÊTRES — la scène dans
   * l'une, le contenu dans une autre —, chacune avec SON origine et SA largeur, pour que les fonctions du portrait
   * (qui comptent depuis 0 et jusqu'à `W`) s'y dessinent telles quelles. Le peintre, les zones touchables, l'état des
   * boutons et la couche de lumière passent par elle ; hors d'une fenêtre, elle est nulle.
   */
  const ORIGINE = { x: 0, y: 0 }
  /** Éteint la couche de lumière sur un rectangle de la fenêtre en cours (les aplats opaques ne la couvrent pas). */
  function eteindre(x0: number, y0: number, x1: number, y1: number): void {
    const fw = (frame as unknown as { w: number }).w
    const fh = (frame as unknown as { h: number }).h
    const a = Math.max(0, Math.min(fw, Math.round(x0 + ORIGINE.x)))
    const b = Math.max(0, Math.min(fw, Math.round(x1 + ORIGINE.x)))
    if (b <= a) return
    for (let y = Math.max(0, Math.round(y0 + ORIGINE.y)); y < Math.min(fh, Math.round(y1 + ORIGINE.y)); y++) frame.light.fill(0, y * fw + a, y * fw + b)
  }
  /**
   * Dessine `dessin` DANS UNE FENÊTRE : à partir de `x`, sur `w` de large. Le temps du dessin, `W` vaut `w`, le peintre
   * et les zones sont décalés, la souris est ramenée dans la fenêtre ; après lui, ce qu'il a semé en coordonnées de la
   * fenêtre (éclats, nombres qui montent, zones qui glissent, curseurs) est remis dans celles de l'écran.
   */
  function fenetre(p: Peintre, x: number, w: number, dessin: () => void): void {
    const largeur = W
    const souris0 = survol
    const n = [eclats.length, flottants.length, volantes.length, envolsDePiece.length, curseurs.length]
    ORIGINE.x = x
    W = w
    survol = souris0 === null ? null : { x: souris0.x - x, y: souris0.y }
    p.place(0, 0)
    dessin()
    W = largeur
    survol = souris0
    ORIGINE.x = 0
    p.place(0, 0)
    for (let i = n[0]; i < eclats.length; i++) eclats[i].x += x
    for (let i = n[1]; i < flottants.length; i++) flottants[i].x += x
    for (let i = n[2]; i < volantes.length; i++) volantes[i].x0 += x
    for (let i = n[3]; i < envolsDePiece.length; i++) envolsDePiece[i].x0 += x
    for (let i = n[4]; i < curseurs.length; i++) curseurs[i].x += x
    for (const z of [zoneGlissante, zoneDesOnglets, zoneDesCases, zoneDesMissions, zoneDeLInventaire, zoneDesOrdres, zoneDeLArbre]) {
      if (z === null || zonesDecalees.has(z)) continue
      z.x += x
      zonesDecalees.add(z)
    }
  }
  const zonesDecalees = new WeakSet<object>()
  function etatDuBouton(x: number, y: number, w: number, h: number): EtatDuBouton {
    const age = enfonce !== null && memeCoin(enfonce, x + ORIGINE.x, y + ORIGINE.y) ? t - enfonce.t0 : 99
    const r = refus
    const tremble = r !== null && memeCoin(r, x, y) && t - r.t0 < 0.3 ? Math.round(Math.sin((t - r.t0) * 70) * 2 * (1 - (t - r.t0) / 0.3)) : 0
    const survole = survol !== null && survol.x >= x && survol.x < x + w && survol.y >= y && survol.y < y + h
    return { dx: tremble, dy: age < 0.1 ? 1 : 0, enfonce: age < 0.1, flash: age >= 0.1 && age < 0.17, survole }
  }
  /** Une zone touchable, avec le son qu'elle fait (null : aucun ; par défaut, le clic). */
  function zone(x: number, y: number, w: number, h: number, action: () => void, son: Son | null = 'clic'): void {
    zones.push({ x: x + ORIGINE.x, y: y + ORIGINE.y, w, h, action, son, dx: ORIGINE.x, dy: ORIGINE.y })
  }
  function zoneDeRefus(x: number, y: number, w: number, h: number): void {
    zones.push({ x: x + ORIGINE.x, y: y + ORIGINE.y, w, h, action: () => (refus = { x, y, t0: t }), son: 'refus' })
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
    // (EN RELIEF, comme les titres au-dessus et en dessous — Keko, 12/11 : « ça manque de texture »)
    motEnRelief(p, mot, cx, y + 8, 'ivoire', ENTETE)
    for (const s of [-1, 1]) {
      const px = Math.round(cx + s * (lm / 2 + 7))
      p.rect(px - 1, y + 11, 3, 1, PEPITE[1])
      p.rect(px, y + 10, 1, 3, PEPITE[2])
    }
  }
  /** L'en-tête d'un bandeau de scène (les missions) : la plaque d'acier de `enTete`, sans son retour, centrée. */
  function dessinerLEnTeteDuBandeau(p: Peintre, mot: string, y: number): void {
    const lm = largeurDe(mot, ENTETE)
    const w = lm + 44
    const x = Math.round(W / 2 - w / 2)
    plaque(p, x, y, w, 19, 'acier')
    motEnRelief(p, mot, W / 2, y + 6, 'ivoire', ENTETE)
    for (const s of [-1, 1]) {
      const px = Math.round(W / 2 + s * (lm / 2 + 7))
      p.rect(px - 1, y + 9, 3, 1, PEPITE[1])
      p.rect(px, y + 8, 1, 3, PEPITE[2])
    }
  }
  // ================================================================ LA BASE, EN QUATRE ÉTAGES
  /**
   * L'INTERFACE DE LA BASE (Keko, 10/11 : « une organisation hiérarchique épurée, claire et ergonomique », puis
   * « perfectionne au maximum le gamefeel et le juice ») — quatre étages, du plus général au plus précis : LA BARRE DU
   * HAUT (la vue, en titre ; les crédits), LA SCÈNE (le vaisseau sur son aire, sous les lampes ; la planche du labo ;
   * l'inventaire), LE CONTENU (un niveau à la fois) et LA BARRE DES ONGLETS EN BAS, sous le pouce.
   */
  /**
   * LA BARRE DU HAUT A DEUX LIGNES (Keko, 12/11 : « c'est vraiment dommage de diminuer la taille des titres pour afficher
   * les crédits » — sur 180 pixels, un grand titre et un montant entier ne tiennent pas côte à côte) : le titre de la
   * vue en haut, toujours en grande lettre avec son icône ; LES CRÉDITS DESSOUS, sur leur ligne, en entier.
   */
  // (le filet sous le titre arrive À LA HAUTEUR DU HAUT DU CARTOUCHE des crédits — Keko, 12/11 : « descendre un poil la
  // ligne sous le titre » ; l'étage du titre fait trente pixels, la languette en dépasse de dix)
  const HAUT_DU_TITRE = 30
  const HAUT_DES_CREDITS = 10
  let HAUT_BARRE = HAUT_DU_TITRE + HAUT_DES_CREDITS
  /** Le milieu de la ligne des crédits (les pièces y volent). */
  let Y_CREDITS = HAUT_BARRE - 8
  /** Le bord gauche de la languette des crédits (refait à chaque image) : ce qui passe derrière l'en-tête s'y arrête. */
  let xDeLaLanguette = W
  let HAUT_NAV = 34
  /**
   * OÙ COMMENCE LA SCÈNE (Keko, 12/11 : l'en-tête n'est plus un rectangle — il s'arrête sous le titre, et seule la
   * LANGUETTE des crédits descend, à droite) : juste sous le titre, la languette passant devant son coin — sauf dans la
   * recherche et le commerce, dont la scène s'ouvre sur une rangée d'onglets que la languette cacherait : là, elle
   * commence sous la languette, comme avant.
   */
  const sceneSousLeTitre = (): boolean => vue !== 'labo' && vue !== 'entrepot'
  let Y_SCENE = HAUT_BARRE
  /** La scène a UNE HAUTEUR FIXE pour un écran donné (Keko) : ce que laissent les deux barres et le plus haut des contenus. */
  // (AU LABO, la scène est l'ARBRE — ses branches, ses rangs, la fiche du nœud — et prend tout l'écran entre les deux
  // barres : les pièces s'achètent au hangar, il n'y a plus rien dessous)
  // (À L'ENTREPÔT, la scène montre UNE RANGÉE DE PLUS que sa hauteur ordinaire n'en logerait — Keko, 11/11 : « afficher
  // en permanence deux lignes de plus, et scroller pour le reste », puis « enlève une ligne visible de base » — tant que
  // la fiche du minerai tient dessous)
  // (LA SCÈNE PREND TOUT CE QUE QUATRE RANGÉES DE CASES ET « DÉCOLLER » LUI LAISSENT — Keko, 11/11 : « augmenter la
  // hauteur, de manière à laisser uniquement quatre lignes de pièces en dessous, donc huit pièces avant d'avoir besoin
  // de scroller » : 6 de marge, des rangées de 40, 4 d'air, 38 de bouton et son pied ; plus de plafond — PUIS TROIS
  // RANGÉES au lieu de quatre (« on peut essayer avec trois lignes de pièces fixes ») : quarante pixels de plus au vaisseau)
  const sceneOrdinaire = (): number => Math.max(64, H - HAUT_BARRE - HAUT_NAV - 164)
  // (LA GRILLE DU COMMERCE GARDE SES RANGÉES d'avant la ligne des crédits — Keko, 12/11 : « rajouter la ligne qu'on a
  // perdue dans le grid des ressources et décaler le reste vers le bas » : comptées comme si la barre du haut faisait
  // encore 28 px ; c'est la fiche du minerai, dessous, qui descend)
  const rangeesDeLEntrepot = (): number => Math.max(1, Math.min(Math.floor((Math.max(64, Math.min(168, H - 28 - HAUT_NAV - 222)) - 10) / 31) + 1, Math.floor((H - 28 - HAUT_NAV - 120 - 10 - 28) / 31)))
  const hauteurDeScene = (): number => (vue === 'labo' ? Math.max(150, H - HAUT_BARRE - HAUT_NAV - 4) : vue === 'entrepot' ? rangeesDeLEntrepot() * 31 + 10 + 28 : vue === 'quetes' || vue === 'reglages' ? 36 : sceneOrdinaire()) // (28 : la barre des catégories)
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
  /** La vue de la barre d'où l'on est parti vers un « autre onglet » (la flèche de retour y ramène). */
  let vueDAvant = 'hangar'
  function allerA(vv: string): void {
    feuille = false
    nouveautes.delete(vv)
    if (vv === vue) return
    if (PRINCIPALES().includes(vue)) vueDAvant = vue
    vue = vv
    vente = null // (couchée, le rail reste touchable sous le panneau de vente : changer d'onglet le referme)
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
    curseurs = []
    zoneDeLArbre = null
    zoneDesOrdres = null
    zoneDeLInventaire = null
    zoneDesCases = null
    zoneDesMissions = null
    // LE MARCHÉ SE RÈGLE à chaque pas du cours : un ordre dont le prix a été atteint est vendu (même posé hier)
    {
      const r = reglerLeMarche(marche, credits, heureDuMarche(), avantages())
      if (r.vendus.length > 0) {
        compter('ventes', r.credits - credits)
        compter('ordresRegles', r.vendus.length)
        credits = r.credits
        flottants.push({ texte: 'Ordre vendu !', x: W / 2, y: HAUT_BARRE + 16, t0: t, c: RUNE[3] })
        jouer('vente')
      }
      if (r.vendus.length > 0 || r.marche.vuA - marche.vuA > 30_000) {
        marche = r.marche
        sauver()
      } else marche = { ...marche, ordres: r.marche.ordres }
    }
    noterLesConnues()
    p.place(0, 0)
    dtBase = Math.min(0.05, Math.max(0, t - tBase))
    tBase = t
    if (paysage) {
      dessinerLaBaseCouchee(p)
      return
    }
    HAUT_BARRE = HAUT_DU_TITRE + HAUT_DES_CREDITS
    HAUT_NAV = 34
    Y_CREDITS = HAUT_BARRE - 8
    Y_SCENE = sceneSousLeTitre() ? HAUT_DU_TITRE - 1 : HAUT_BARRE
    hautScene = hauteurDeScene() + (HAUT_BARRE - Y_SCENE) // (le contenu, dessous, ne bouge pas : la scène gagne la hauteur)
    p.rect(0, 0, W, H, NUIT)
    if (credits !== creditsConnus) {
      const d = credits - creditsConnus
      flottants.push({ texte: `${d > 0 ? '+' : ''}${d}`, x: Math.min(compteurX, W - 22), y: HAUT_BARRE + 3, t0: t, c: d > 0 ? RUNE[3] : PEPITE[3] })
      creditsConnus = credits
      creditsA = t
    }
    creditsVus = Math.abs(credits - creditsVus) < 0.5 ? credits : ressort(creditsVus, credits, 8)
    dessinerLaScene(p)
    dessinerLeContenu(p)
    dessinerLaBarreDuHaut(p)
    dessinerLaNav(p)
    dessinerLaFeuille(p)
    dessinerLeChangement(p)
    dessinerLesCouleurs(p)
    dessinerLaVente(p)
    dessinerLesEclats(p)
  }

  /**
   * LA BASE COUCHÉE (le paysage, étape 2 — Keko, 13/11 : « rail gauche ok ; le portrait doit rester dans tous les cas,
   * laisse le choix au joueur ») : téléphone couché, l'écran fait de 320 à 480 de large sur 180 à 240 de haut.
   * - À GAUCHE, LE RAIL des onglets, vertical, à la place de la barre du bas ;
   * - EN HAUT, UNE LIGNE FINE : le titre de la vue, les crédits à droite ;
   * - puis DEUX COLONNES : LA SCÈNE (le vaisseau sur son aire) prend ce qui reste, LE CONTENU (les cases et « Décoller »,
   *   la page d'une place) une colonne de 180 — la largeur du portrait : ses fonctions s'y dessinent telles quelles, par
   *   `fenetre` ; les panneaux (changer, couleurs, autres onglets) s'ouvrent dans cette colonne, le vaisseau reste visible.
   * TOUTES LES VUES SONT COUCHÉES (13/11) sur le même partage — ce que le portrait met en haut (la scène) est à gauche,
   * ce qu'il met dessous (le contenu) est dans la colonne : COMMERCE, la grille à gauche (ses colonnes suivent la
   * largeur), la fiche et les ordres à droite ; RECHERCHE, l'arbre à gauche sur toute la hauteur, la fiche du nœud à
   * droite ; MISSIONS et PARAMÈTRES, leur en-tête à gauche, les cartes à droite.
   */
  const RAIL = 28
  const HAUT_COUCHE = 22
  const COLONNE = 180
  function dessinerLaBaseCouchee(p: Peintre): void {
    HAUT_BARRE = HAUT_COUCHE
    HAUT_NAV = 0
    Y_CREDITS = 11
    Y_SCENE = HAUT_COUCHE
    p.rect(0, 0, W, H, NUIT)
    if (credits !== creditsConnus) {
      const d = credits - creditsConnus
      flottants.push({ texte: `${d > 0 ? '+' : ''}${d}`, x: Math.min(compteurX, W - 22), y: HAUT_BARRE + 3, t0: t, c: d > 0 ? RUNE[3] : PEPITE[3] })
      creditsConnus = credits
      creditsA = t
    }
    creditsVus = Math.abs(credits - creditsVus) < 0.5 ? credits : ressort(creditsVus, credits, 8)
    const xc = W - COLONNE
    // LES MISSIONS ET LES PARAMÈTRES N'ONT PAS DE SCÈNE, seulement un intitulé (Keko, 13/11 : « l'espace de gauche est
    // occupé par "contrats" alors que c'est juste censé être un intitulé de catégorie ») : couchés, leur bandeau reste
    // EN HAUT, sur toute la largeur, haut de 36 comme debout, et le contenu prend tout ce qu'il y a dessous — LES
    // MISSIONS SUR DEUX COLONNES quand l'écran en loge deux, les paramètres dans une colonne au milieu.
    const enBandeau = vue === 'quetes' || vue === 'reglages'
    if (enBandeau) {
      hautScene = 36
      fenetre(p, RAIL, W - RAIL, () => dessinerLaScene(p))
      eteindre(0, 0, RAIL, H)
      eteindre(0, 0, W, HAUT_COUCHE)
      if (vue === 'quetes') {
        // (une mission par ligne sur toute la largeur a été essayée et retirée le 13/11 — Keko : « c'était mieux quand il
        // y avait deux colonnes »)
        const cols = W - RAIL >= 360 ? 2 : 1
        const lw = Math.floor((W - RAIL) / cols)
        for (let c = 0; c < cols; c++) {
          partDesMissions = { col: c, cols }
          fenetre(p, RAIL + c * lw, lw, () => dessinerLeContenu(p))
        }
        partDesMissions = { col: 0, cols: 1 }
      } else {
        const lw = Math.min(240, W - RAIL)
        fenetre(p, RAIL + Math.floor((W - RAIL - lw) / 2), lw, () => dessinerLeContenu(p))
      }
    } else {
    // la scène, dans sa fenêtre : toute la hauteur sous la ligne du haut
    hautScene = H - HAUT_COUCHE
    fenetre(p, RAIL, xc - RAIL, () => dessinerLaScene(p))
    // (l'aire est plus large que sa fenêtre : ce qui en dépasse est recouvert, et sa lumière éteinte)
    p.rect(xc, 0, COLONNE, H, NUIT)
    p.rect(xc, HAUT_COUCHE, 1, H - HAUT_COUCHE, MATIERES.encre.contour)
    p.rect(xc + 1, HAUT_COUCHE, 1, H - HAUT_COUCHE, N.hex('#1f1a2b'))
    eteindre(xc, 0, W, H)
    eteindre(0, 0, RAIL, H)
    eteindre(0, 0, W, HAUT_COUCHE)
    // le contenu, dans la colonne : il commence sous la ligne du haut
    hautScene = 0
    fenetre(p, xc, COLONNE, () => dessinerLeContenu(p))
    }
    // les panneaux, dans la colonne ; puis la ligne du haut (leur voile ne l'éteint pas) et le rail, dont les onglets
    // restent touchables par-dessus
    // (« Changer » : la liste à gauche, par-dessus le vaisseau, la fiche à droite — si la fenêtre de gauche est assez
    // large pour une liste ; sinon tout dans la colonne, comme en portrait)
    const deux = xc - RAIL >= 150
    // (« AUTRES ONGLETS » ASSOMBRIT TOUT L'ÉCRAN, pas seulement sa colonne — Keko, 13/11 : « ça ne noircit que la moitié
    // droite » : le même voile sur la partie gauche, qui ferme la feuille d'une tape, comme lui)
    // (… ET ELLE S'OUVRE AU MILIEU DE L'ÉCRAN, plus large — Keko, 13/11 : « ça n'a pas vraiment de sens de la mettre
    // tout en bas à droite, on a la place »)
    if (feuille) {
      p.rect(RAIL, HAUT_COUCHE + 1, W - RAIL, H - HAUT_COUCHE - 1, NUIT, 0.72 * Math.min(1, (t - feuilleA) / 0.15))
      eteindre(RAIL, HAUT_COUCHE + 1, W, H)
    }
    const lf = Math.min(W - RAIL - 24, 280)
    const xf = RAIL + Math.floor((W - RAIL - lf) / 2)
    fenetre(p, xf, lf, () => dessinerLaFeuille(p))
    if (feuille) {
      zone(RAIL, HAUT_COUCHE + 1, W - RAIL, H - HAUT_COUCHE - 1, basculerLaFeuille, 'retour')
    }
    fenetre(p, xc, COLONNE, () => {
      if (!deux) dessinerLeChangement(p)
    })
    if (deux) {
      fenetre(p, RAIL, xc - RAIL, () => dessinerLeChangement(p, 'liste'))
      fenetre(p, xc, COLONNE, () => dessinerLeChangement(p, 'fiche'))
    }
    fenetre(p, xc, COLONNE, () => dessinerLesCouleurs(p))
    // (LA VENTE, en deux fenêtres elle aussi : sa courbe à gauche, par-dessus la grille, le reste dans la colonne — en
    // une seule pièce, elle fait jusqu'à 216 de haut, plus que l'écran couché)
    fenetre(p, RAIL, xc - RAIL, () => dessinerLaVente(p, 'courbe'))
    fenetre(p, xc, COLONNE, () => dessinerLaVente(p, 'reste'))
    dessinerLaLigneDuHaut(p)
    dessinerLeRail(p)
    dessinerLesEclats(p)
  }
  /** LA LIGNE DU HAUT de la base couchée : le pupitre en une ligne — l'icône et le titre de la vue, le cartouche des crédits. */
  function dessinerLaLigneDuHaut(p: Peintre): void {
    const yb = HAUT_COUCHE
    p.rect(RAIL, 0, W - RAIL, yb, N.hex('#17131f'))
    p.rect(RAIL, 0, W - RAIL, 1, N.hex('#322b47'))
    p.rect(RAIL, 1, W - RAIL, 1, N.hex('#1f1a2b'))
    p.rect(RAIL, yb - 2, W - RAIL, 1, N.hex('#4c4468'))
    p.rect(RAIL, yb - 1, W - RAIL, 1, MATIERES.encre.contour)
    const u = sortie((t - vueA) / 0.35)
    const chute = Math.round((1 - u) * -8)
    const nom = NOMS_VUE[vue].toUpperCase()
    const w = largeurDe(nom, TITRE)
    const c = (t % 5) / 5
    motEnRelief(p, nom, RAIL + 8 + w / 2, 4 + chute, true, TITRE, c < 0.14 ? -10 + (c / 0.14) * (w + 30) : null)
    // le cartouche des crédits, calé à droite
    const n = String(Math.max(0, Math.round(creditsVus)))
    const wn = largeurDe(n, GRAS)
    const allume = t - creditsA < 0.45
    const r = refus
    const tremble = r !== null && t - r.t0 < 0.3 ? Math.round(Math.sin((t - r.t0) * 70) * 2 * (1 - (t - r.t0) / 0.3)) : 0
    const saut = t - creditsA < 0.12 ? -1 : 0
    const wp = wn + 21
    const px = W - 4 - wp + tremble
    const yc = 5
    compteurX = px + wp - 9
    if (allume) p.glow(px + wp / 2, Y_CREDITS, 24, RUNE[2], 0.3 * (1 - (t - creditsA) / 0.45))
    // (onze de haut : un pixel d'air SOUS le nombre comme au-dessus — Keko, 13/11 : il touchait le contour du bas)
    p.rect(px, yc, wp, 11, allume ? RUNE[3] : tremble !== 0 ? ROUGE[4] : N.hex('#23785b'))
    p.rect(px + 1, yc + 1, wp - 2, 9, N.hex('#0c241d'))
    p.rect(px + 1, yc + 1, wp - 2, 1, N.hex('#16382d'))
    dessinerUnCredit(p, px + wp - 9, yc + 5 + saut)
    ecrire(p, n, px + wp - 16, yc + 2 + saut, allume ? N.WHITE : N.hex('#fff2c8'), { police: GRAS, align: 'right' })
  }
  /**
   * LE RAIL des onglets, à gauche de la base couchée : la barre du bas tournée — une case par onglet (son icône), celle
   * de la vue ouverte éclairée, un repère d'or qui glisse le long du bord ; la dernière ouvre « Autres onglets ».
   */
  let repereY = -1
  function dessinerLeRail(p: Peintre): void {
    p.rect(0, 0, RAIL, H, NUIT_BARRE)
    p.rect(RAIL - 1, 0, 1, H, MATIERES.encre.contour)
    p.rect(RAIL - 2, 0, 1, H, MATIERES.encre.lumiere2)
    const slots = [...PRINCIPALES(), 'plus']
    const sh = H / slots.length
    const horsBarre = !PRINCIPALES().includes(vue)
    slots.forEach((vv, i) => {
      const actif = vv === 'plus' ? feuille || horsBarre : vv === vue && !feuille
      const y0 = Math.round(i * sh)
      const y1 = Math.round((i + 1) * sh)
      const cy = Math.round((y0 + y1) / 2)
      const e = etatDuBouton(0, y0, RAIL, y1 - y0)
      const leve = rebond(`nav-${vv}`, actif ? 1 : 0)
      const pulse = t - (pulsations[vv] ?? -10) < 0.3 ? Math.round(Math.sin(((t - (pulsations[vv] ?? 0)) / 0.3) * Math.PI) * 3) : 0
      const dx = Math.round(leve * 2) + pulse
      if (e.survole && !actif) p.rect(2, y0 + 2, RAIL - 5, y1 - y0 - 4, N.hex('#19152a'))
      if (actif) p.glow(RAIL / 2, cy, 18, PEPITE[2], 0.2)
      const ic = vv === 'plus' && horsBarre && !feuille ? vue : vv
      if (ic === 'plus') dessinerLIconePlus(p, RAIL / 2 - 1 + dx, cy + e.dy, actif)
      else dessinerLIconeDeVue(p, ic, RAIL / 2 - 1 + dx, cy + e.dy, actif)
      if (nouveautes.has(vv) || (vv === 'quetes' && quetes.actives.some(estTerminee))) {
        const bx = RAIL - 9
        const by = cy - 9
        p.rect(bx - 1, by - 1, 5, 5, MATIERES.encre.contour)
        p.rect(bx, by, 3, 3, N.hex('#ff3a4a'))
        p.rect(bx, by, 1, 1, N.hex('#ffb0b0'))
        p.glow(bx + 1, by + 1, 5, N.hex('#ff3a4a'), 0.4 + 0.3 * Math.sin(t * 6))
      }
      const action = vv === 'plus' ? basculerLaFeuille : () => (vv === vue ? (feuille = false) : allerA(vv))
      zone(0, y0, RAIL, y1 - y0, action, vv === 'plus' ? (feuille ? 'retour' : 'ouvre') : actif ? null : 'onglet')
    })
    const ia = feuille || horsBarre ? slots.length - 1 : slots.indexOf(vue)
    const cible = ia * sh + sh / 2
    repereY = repereY < 0 ? cible : ressort(repereY, cible, 18)
    p.rect(0, Math.round(repereY - 10), 2, 20, PEPITE[2])
    p.rect(0, Math.round(repereY - 7), 1, 14, N.hex('#fff2a8'))
    p.glow(1, Math.round(repereY), 10, PEPITE[2], 0.35)
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
    const cy = y0 + Math.round(hautScene / 2) // (l'aire est au milieu de la scène : elle en prend toute la hauteur)
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
      const yb = y1 - 4
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
    } else if (vue === 'entrepot') {
      p.rect(0, y0, W, hautScene, N.hex('#111b17'))
      for (let i = 0; i < 110; i++) {
        const mx = Math.floor(tire(i, 1, 77) * W)
        const my = y0 + Math.floor(tire(i, 2, 77) * hautScene)
        p.rect(mx, my, tire(i, 4, 77) < 0.3 ? 2 : 1, 1, tire(i, 3, 77) < 0.5 ? N.hex('#0b120f') : N.hex('#18251f'))
      }
    } else if (vue === 'reglages') {
      p.rect(0, y0, W, hautScene, N.hex('#14101e'))
      for (let x = 0; x < W; x += 6) p.rect(x, y0, 1, hautScene, N.hex('#181326'))
      // (UNE FLÈCHE DE RETOUR, vers le panneau « Autres onglets » d'où l'on vient — Keko, 12/11 : rien ne disait qu'on sort
      // d'ici par la barre du bas ; c'est l'en-tête des pages du hangar, sa touche d'or et son titre)
      // (ELLE REFERME LES PARAMÈTRES : on retrouve l'onglet qu'on avait avant, le panneau « Autres onglets » ouvert
      // dessus, la tuile « Paramètres » éteinte — Keko, 12/11)
      enTete(p, y1 - 30, 'Commandes', () => {
        allerA(PRINCIPALES().includes(vueDAvant) ? vueDAvant : 'hangar')
        basculerLaFeuille()
      })
    } else if (vue === 'quetes') {
      // LE BANDEAU DES QUÊTES : pendant le tutoriel, « Formation » et ses étapes en pastilles ; ensuite, « Contrats »
      p.rect(0, y0, W, hautScene, N.hex('#14101e'))
      for (let x = 0; x < W; x += 6) p.rect(x, y0, 1, hautScene, N.hex('#181326'))
      const yt = y1
      if (!tutorielFini(quetes)) {
        dessinerLEnTeteDuBandeau(p, 'Formation', yt - 33)
        const n = TUTORIEL.length
        for (let i = 0; i < n; i++) {
          const px = Math.round(cx + (i - (n - 1) / 2) * 12)
          const fait = i < quetes.etape
          const ici = i === quetes.etape
          p.rect(px - 3, yt - 11, 7, 7, MATIERES.encre.contour)
          p.rect(px - 2, yt - 10, 5, 5, fait ? RUNE[2] : ici ? (Math.sin(t * 5) > 0 ? N.hex('#fff2a8') : PEPITE[2]) : COQUE[1])
          if (i > 0) p.rect(px - 9, yt - 8, 5, 1, fait || ici ? RUNE[1] : COQUE[1])
        }
      } else {
        // (seul, au milieu du bandeau : « Un par activité, toujours » est retiré — Keko, 12/11)
        // (LE NIVEAU ENTRE LE TITRE DE LA VUE ET LES CONTRATS — Keko : d'abord « plus petit que les contrats eux-mêmes, ce
        // qui brise la hiérarchie », puis, en grande lettre : « ne doit pas être aussi gros que le titre mission, ça brise
        // la hiérarchie dans l'autre sens ». Il n'y a pas de lettre entre la grasse et la grande (la grande est la
        // grasse doublée) : le mot prend donc LA PLAQUE D'EN-TÊTE du hangar — l'acier, la lettre écartée, les deux
        // pointes d'or —, qui pèse plus qu'un titre de carte sans égaler le titre de la vue)
        dessinerLEnTeteDuBandeau(p, 'Contrats', yt - 27)
      }
    } else {
      p.rect(0, y0, W, hautScene, N.hex('#0e0c16'))
      ecrire(p, 'Bientôt', cx, y0 + Math.floor(hautScene / 2) - 4, COQUE[2], { align: 'center', police: GRAS })
    }
    // LES LAMPES : un boîtier, son halo, et son cône de lumière qui tombe vers le milieu
    // (AU HANGAR SEULEMENT — Keko, 12/11 : « enlever les spotlights des autres onglets »)
    for (const lx of vue === 'hangar' ? [10, W - 11] : []) {
      // (elles pendent au bout d'une tige, sous la languette des crédits qui passe devant le coin de la scène)
      const yl = y0 + (HAUT_BARRE - Y_SCENE)
      p.rect(lx - 1, y0, 2, yl - y0, COQUE[1])
      p.glowLine(lx, yl + 3, lx + (cx - lx) * 0.55, cy + 10, 12, CHAUD, 0.07)
      p.glow(lx, yl + 5, 30, CHAUD, 0.35)
      p.rect(lx - 4, yl, 8, 3, COQUE[1])
      p.rect(lx - 4, yl, 8, 1, COQUE[2])
      p.rect(lx - 3, yl + 3, 6, 1, N.hex('#fff2c8'))
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
      // (l'aire dépasse la scène : ce qui en sort par le bas est recouvert, et sa lumière éteinte hors de la scène)
      p.rect(0, y1, W, H - y1, NUIT)
      eteindre(-1000, -1000, 2000, y0)
      eteindre(-1000, y1, 2000, 2000)
    } else if (vue === 'entrepot') dessinerLInventaire(p, y0)
    else if (vue === 'labo') dessinerLArbre(p, y0)
    // LA VIGNETTE : les bords s'assombrissent, en trame de plus en plus serrée
    for (let k = 0; k < 4; k++) {
      const a = 0.55 - k * 0.13
      // (pas en haut de la tech : la barre des branches y est, et l'icône de la branche ouverte, qui se lève de deux
      // pixels, entrait dans cette trame — Keko, 11/11 : « quand une icône est sélectionnée, son haut devient pixelisé »)
      if (vue !== 'labo' && vue !== 'entrepot') p.rect(0, y0 + k, W, 1, NUIT, a)
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
    // (le gabarit de la coque montée : un cuirassé est montré plus petit, ses repères sont ailleurs)
    const coqueMontee = monteeA(hangar, 'coque').cran
    const g = gabaritDe(coqueMontee)
    const ECH = ECHELLE * g.echelle
    const kG = g.anneau / 11
    let sy = cy - 2 + Math.round(Math.sin(t * 1.7) * 1.2)
    let flam = 0
    let jit = 0
    if (decollageA !== null) {
      const u = Math.min(1, (t - decollageA) / 0.95)
      flam = Math.min(1, 0.2 + u * 4)
      jit = u < 0.35 ? Math.round((R.next() - 0.5) * 2) : 0
      sy = cy - 2 - Math.round(Math.pow(Math.max(0, u - 0.28) / 0.72, 2.2) * (cy - y0 + 50))
      // (les éclats du décollage : au bout de la flamme, et à sa couleur — bleus pour un propulseur ionique)
      const cranP = monteeA(hangar, 'propulseur').cran
      const bout = Math.round((-queueDe(coqueMontee) + 0.5 * (cranP - 1) + Math.min(1.5, (2.5 + 8 * flam) * 0.15)) * ECH)
      if (R.next() < 0.85) eclats.push({ x: cx + (R.next() - 0.5) * 5, y: sy + bout, vx: (R.next() - 0.5) * 30, vy: 40 + R.next() * 50, t0: t, vie: 0.3 + 0.3 * R.next(), c: (cranP >= 3 ? ION : FEU)[3 + Math.floor(R.next() * 4)] })
      if (u < 0.5 && R.next() < 0.5) eclats.push({ x: cx + (R.next() - 0.5) * 30, y: cy + 14, vx: (R.next() - 0.5) * 70, vy: -5 - R.next() * 10, t0: t, vie: 0.7 + 0.4 * R.next(), c: N.hex('#4a4a58'), fumee: true })
      if (u >= 1) {
        decollageA = null
        demarrer()
      }
    }
    // l'aire : un socle d'acier biseauté, l'anneau de chevrons, le disque, un cercle et une croix de guidage, huit feux
    // L'AIRE A UNE TAILLE FIXE, GRANDE (Keko, 11/11 : d'abord « agrandir au max, sans sortir de la zone — il va y avoir des
    // vaisseaux beaucoup plus gros », puis, la hauteur d'un téléphone la rétrécissant : « dessiner le rond à une taille
    // fixe (grand) même s'il dépasse de la zone, il ne sera pas entier, c'est pas grave ») : elle tient dans la largeur ;
    // ce qui dépasse en haut et en bas est coupé par la scène (`dessinerLaScene` recouvre le dessous, les barres le dessus)
    const R0 = 74
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
      p.poly(ovale(cx + 3, cy + 5, 13 * k * kG * g.echelle, 19 * k * kG * g.echelle, 18).map(([x, y]) => [x, y]), N.hex('#15161d'), 0.85 * k)
    }
    // la tuyère au ralenti, puis le vaisseau
    const nozzle: [number, number] = [cx + jit, sy + (0.2 - queueDe(coqueMontee)) * ECH]
    p.glow(nozzle[0], nozzle[1], 8 + 14 * flam, al.propulseur >= 3 ? ION[4] : FEU[5], 0.35 + 0.5 * flam + 0.08 * Math.sin(t * 9))
    const formes = formesDuVaisseau(al, flam, t)
    peindreFormes(p, formes, cx + jit, sy, ECH, { blanc: t - equipeA < 0.08 ? 1 : 0, rampes: rampesDuJoueur() })
    // la verrière qui luit, les feux de position qui battent
    p.glow(cx + jit, sy - g.verriere * ECH, 7, VERRIERE[2], 0.25)
    const bat = Math.floor(t * 1.5) % 2 === 0
    for (const [s, c] of [[-1, N.hex('#ff4a4a')], [1, N.hex('#4aff7a')]] as const) {
      const fx = Math.round(cx + jit + s * (g.feux.y + 0.2) * ECH)
      const fy = Math.round(sy + (0.2 - g.feux.x) * ECH)
      if (bat) {
        p.rect(fx, fy, 1, 1, N.WHITE)
        p.glow(fx, fy, 6, c, 0.7)
      }
    }
    if (al.bouclier > 0) p.ring(cx + jit, sy, g.anneau * ECH, 1, VERRIERE[2], 0.3 + 0.25 * Math.sin(t * 3))
    p.place(0, 0)
    // LE POIDS, en étiquette dans le coin — écrit COMME LA LIGNE « Poids » D'UNE FICHE (Keko : « la différence de
    // police et de taille entre le mot et le chiffre casse la cohérence ») : le mot dans la lettre courante, le nombre
    // en gras crème, la même hauteur, la même ligne de pied
    const poids = `${poidsTotal(hangar)} T`
    const wm = largeurDe('Poids')
    const wv = largeurDe(poids, TEXTE)
    // (COUCHÉE, DANS LE COIN EN HAUT À DROITE de la scène, sous la lampe — Keko, 13/11 ; debout, en bas à gauche)
    const xp = paysage ? W - 5 - (wm + wv + 15) : 6
    const yp = paysage ? y0 + 7 : y1 - 20
    plaque(p, xp, yp, wm + wv + 15, 15, 'encre')
    ecrire(p, 'Poids', xp + 5, yp + 4, COQUE[4])
    // (LA MÊME LETTRE QUE LE MOT, la même taille — Keko, 12/11 : des chiffres d'une autre police « dénotent » — mais EN
    // RELIEF : l'ivoire éclairé d'en haut, ombré dessous, cerné ; « juste lui rajouter un style propre, un poil de texture »)
    motEnRelief(p, poids, xp + 5 + wm + 5 + wv / 2, yp + 4, 'ivoire', TEXTE)
    // LES ZONES DU VAISSEAU (une cible verte, les angles seulement, autour de la place ouverte)
    const zonesDe = (o: Sorte): [number, number, number, number][] => (o === 'propulseur' ? [[-10.5, -3.2, -6, 3.2]] : o === 'coque' ? [[-8.2, -9, 9.8, 9]] : o === 'outil' ? [[-6.5, -3.5, 4, 3.5]] : Array.from({ length: capacite(hangar, 'arme') }, (_, i): [number, number, number, number] => [-8.2, (i === 0 ? -1 : 1) * 8.8, 2.4, (i === 0 ? -1 : 1) * 4.2]))
    const cibles: Sorte[] = etape === 'vaisseau' ? (['propulseur', 'outil', 'arme', 'coque'] as Sorte[]).filter(aDesPieces) : [onglet]
    const vif = Math.sin(t * 5) > -0.3
    if (decollageA === null) for (const o of cibles) for (const [i, [x0, yy0, x1, yy1]] of zonesDe(o).entries()) {
      if (etape !== 'vaisseau' && o === 'arme' && i !== placeOuverte()) continue
      const sx0 = Math.round(cx + Math.min(yy0, yy1) * kG * ECH)
      const sx1 = Math.round(cx + Math.max(yy0, yy1) * kG * ECH)
      const sy0 = Math.round(sy - Math.max(x0, x1) * kG * ECH)
      const sy1 = Math.round(sy - Math.min(x0, x1) * kG * ECH)
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
  /**
   * LA GRILLE DÉFILE quand elle a plus de rangées que la scène n'en montre (Keko, 11/11 : « donner la possibilité de
   * scroller vers le bas ») : on la fait glisser au doigt, d'une rangée à la fois (la molette sur PC), une barre à
   * droite dit où l'on en est. Avec trois minerais, tout tient : elle ne défile pas encore (jugée avec des minerais
   * d'essai, retirés depuis).
   */
  const PAS_DE_L_INVENTAIRE = 31
  /**
   * LES CATÉGORIES DU COMMERCE (Keko, 11/11 : « rajouter en haut du commerce un truc pour trier les types de ressources
   * (tout / minerai / cristal / biologique pour l'instant) ») : la même barre d'onglets que les branches de la tech, en
   * haut de la scène ; la grille ne montre que les ressources de la catégorie ouverte. Le fer et l'or sont des
   * minerais, le cristal un cristal ; rien de biologique encore. Un classement d'écran : la règle n'en sait rien.
   */
  // (puis : « mets plutôt minerais / cristaux / méca / bio, et un symbole ADN à la biologie » — un engrenage pour la méca,
  // deux brins croisés et leurs barreaux pour le bio ; « Tout » reste en tête)
  const CATEGORIES = ['tout', 'minerai', 'cristal', 'meca', 'bio'] as const
  type Categorie = (typeof CATEGORIES)[number]
  const NOMS_DE_CATEGORIE: Record<Categorie, string> = { tout: 'Tout', minerai: 'Minerais', cristal: 'Cristaux', meca: 'Méca', bio: 'Bio' }
  const CATEGORIE_DE: Record<Minerai, Categorie> = { fer: 'minerai', or: 'minerai', cristal: 'cristal' }
  let categorie: Categorie = 'tout'
  /** Les ressources de la catégorie ouverte, dans l'ordre de la grille. */
  const ressourcesVues = (): Minerai[] => MINERAIS.filter((k) => connues.has(k) && (categorie === 'tout' || CATEGORIE_DE[k] === categorie))
  let defilInventaire = 0
  let zoneDeLInventaire: { x: number; y: number; w: number; h: number } | null = null
  function dessinerLInventaire(p: Peintre, y0: number): void {
    // la barre des catégories, en haut de la scène (la lumière des lampes éteinte dessous)
    eteindre(0, y0, W, y0 + H_BRANCHES + 1)
    // (PAS DE CATÉGORIE VIDE — Keko, 13/11 : « masquer les onglets du commerce qui sont vides ; une fois qu'on ramasse
    // notre première ressource méca ou bio, on débloque l'onglet » : seules les catégories qui ont une ressource connue
    // ont leur onglet ; « Tout » ne vient qu'à partir de deux — avant, la seule catégorie ; sans rien, « Tout » seul)
    const pleines = CATEGORIES.filter((c) => c !== 'tout' && MINERAIS.some((k) => connues.has(k) && CATEGORIE_DE[k] === c))
    const montrees: Categorie[] = pleines.length > 1 ? ['tout', ...pleines] : pleines.length === 1 ? pleines : ['tout']
    if (!montrees.includes(categorie)) categorie = montrees[0]
    dessinerUneBarreDOnglets(p, y0, 'categorie', montrees.map((c) => ({ nom: NOMS_DE_CATEGORIE[c], icone: c })), montrees.indexOf(categorie), (i) => {
      categorie = montrees[i]
      defilInventaire = 0
      vueA = t - 0.12
      // (la ressource choisie suit : la première de la catégorie, si celle d'avant n'y est pas)
      const vues = ressourcesVues()
      if (vues.length > 0 && !vues.includes(mineraiChoisi)) mineraiChoisi = vues[0]
    })
    const vues = ressourcesVues()
    const haut = hautScene - H_BRANCHES
    const cw = 30
    const ch = 28
    // (cinq colonnes debout ; couchée, autant que la fenêtre en loge, de deux à cinq)
    const COL = Math.max(2, Math.min(5, Math.floor((W - 5) / (cw + 3))))
    const RANG = Math.max(1, Math.floor((haut - 10) / (ch + 3)))
    const total = vues.length
    const rangees = Math.max(RANG, Math.ceil(total / COL))
    const maxD = Math.max(0, rangees - RANG)
    defilInventaire = Math.max(0, Math.min(maxD, defilInventaire))
    const d = Math.round(defilInventaire)
    const gx = Math.floor((W - (COL * cw + (COL - 1) * 3)) / 2)
    const gy = y0 + H_BRANCHES + Math.floor((haut - (RANG * (ch + 3) - 3)) / 2)
    for (let c = 0; c < COL * RANG; c++) {
      const age = t - vueA - c * 0.012
      if (age < 0) continue
      const x = gx + (c % COL) * (cw + 3)
      const y = gy + Math.floor(c / COL) * (ch + 3)
      const i = c + d * COL
      const k = vues[i]
      if (k === undefined) {
        plaque(p, x, y, cw, ch, 'creux')
        continue
      }
      const choisi = k === mineraiChoisi
      const b = etatDuBouton(x, y, cw, ch)
      if (!b.enfonce) ombrePortee(p, x, y, cw, ch)
      plaque(p, x, y + b.dy, cw, ch, choisi ? 'or' : 'encre', { enfonce: b.enfonce, survole: b.survole, flash: b.flash || age < 0.06, reflet: choisi ? (((t * 0.5) % 1) < 0.3 ? x - 10 + (((t * 0.5) % 1) / 0.3) * (cw + 20) : null) : null })
      if (choisi) p.glow(x + cw / 2, y + 11, 14, PEPITE[2], 0.18 + 0.08 * Math.sin(t * 4))
      dessinerUneRessource(p, x + cw / 2, y + 11 + b.dy - (choisi ? Math.round(Math.abs(Math.sin(t * 3)) * 1) : 0), k)
      ecrire(p, montantCourt(tresor[k]), x + cw / 2, y + ch - 10 + b.dy, tresor[k] > 0 ? N.WHITE : COQUE[3], { align: 'center', police: GRAS })
      zone(x, y, cw, ch, () => (mineraiChoisi = k))
    }
    if (maxD > 0) {
      const hg = RANG * (ch + 3) - 3
      const hc = Math.max(8, Math.round((hg * RANG) / rangees))
      const xb = gx + COL * (cw + 3) - 1
      p.rect(xb, gy, 2, hg, MATIERES.creux.contour)
      p.rect(xb, gy + Math.round(((hg - hc) * defilInventaire) / maxD), 2, hc, COQUE[3])
      zoneDeLInventaire = { x: 0, y: gy - 2, w: W, h: hg + 4 }
    }
  }

  /**
   * LA BARRE DU HAUT : l'icône et LE NOM DE LA VUE EN TITRE (la grande lettre lissée, en or, qu'un éclat traverse de
   * temps en temps ; il tombe à sa place quand la vue change), et LES CRÉDITS, qui roulent, sautent et s'allument.
   */
  function dessinerLaBarreDuHaut(p: Peintre): void {
    // L'EN-TÊTE, PENSÉ COMME UN ENSEMBLE (Keko, 12/11 : « peu harmonieux et pas pensé comme un ensemble cohérent —
    // agencement, style, rectangle des crédits de la même couleur que le fond donc peu visible ; rework cette zone pour
    // un rendu plus travaillé et pro ») : UN PUPITRE À DEUX ÉTAGES. En haut, L'ÉTAGE DU TITRE, un acier sombre éclairé
    // d'en haut : l'icône de la vue dans son logement creusé, le titre en grande lettre, deux rivets au bout. Dessous,
    // LE RAIL, plus sombre, en retrait sous l'ombre de l'étage : un pointillé y court jusqu'au CARTOUCHE DES CRÉDITS —
    // vert sombre liseré de vert, aux coins coupés, le montant entier en crème et sa pièce —, qui se détache du fond au
    // lieu de s'y fondre. Un liseré d'or sombre ferme le tout.
    const YT = HAUT_DU_TITRE - 2
    const ACIER = N.hex('#17131f')
    // (LE FILET DE L'EN-TÊTE : un gris d'acier clair — Keko : « la couleur marron ne va pas »)
    const FILET = N.hex('#4c4468')
    // (la lumière de la scène ne traverse pas l'en-tête)
    frame.light.fill(0, 0, (YT + 1) * W)
    p.rect(0, 0, W, YT, ACIER)
    p.rect(0, 0, W, 1, N.hex('#322b47'))
    p.rect(0, 1, W, 1, N.hex('#1f1a2b'))
    p.rect(0, YT - 2, W, 1, FILET)
    p.rect(0, YT - 1, W, 1, MATIERES.encre.contour)
    p.rect(0, YT, W, 1, NUIT_OMBRE)
    // (dans la recherche et le commerce, la bande à gauche de la languette prolonge leur rangée d'onglets)
    if (!sceneSousLeTitre()) p.rect(0, YT, W, HAUT_BARRE - YT, NUIT_BARRE)
    // l'icône de la vue, dans son logement
    // (deux pixels plus haut qu'avant : le filet touchait le bas du titre — Keko : « il faudrait au moins un petit espace »)
    plaque(p, 4, 3, 19, 19, 'creux')
    p.glow(13, 12, 10, PEPITE[2], 0.14)
    dessinerLIconeDeVue(p, vue, 13, 12, true)
    // le titre : il tombe à sa place quand la vue change, un éclat le traverse de temps en temps
    const u = sortie((t - vueA) / 0.35)
    const chute = Math.round((1 - u) * -10)
    // (EN CAPITALES : avec la lettre anguleuse, c'est ce qui fait le titre d'un pupitre de vaisseau — les minuscules ont des
    // panses rondes)
    const nom = NOMS_VUE[vue].toUpperCase()
    const w = largeurDe(nom, TITRE)
    const c = (t % 5) / 5
    motEnRelief(p, nom, 28 + w / 2, 7 + chute, true, TITRE, c < 0.14 ? -10 + (c / 0.14) * (w + 30) : null)
    // (deux rivets au bout de l'étage)
    for (const ry of [6, 17]) {
      p.rect(W - 7, ry, 2, 2, N.hex('#3a3350'))
      p.rect(W - 7, ry, 1, 1, N.hex('#5a4f74'))
    }
    // LE CARTOUCHE DES CRÉDITS, calé à droite du rail, large de son montant ENTIER (Keko : « le joueur devrait avoir le
    // montant complet pour les crédits, pas d'abréviation comme les ressources »)
    const n = String(Math.max(0, Math.round(creditsVus)))
    const wn = largeurDe(n, GRAS)
    const allume = t - creditsA < 0.45
    const r = refus
    const tremble = r !== null && t - r.t0 < 0.3 ? Math.round(Math.sin((t - r.t0) * 70) * 2 * (1 - (t - r.t0) / 0.3)) : 0
    const saut = t - creditsA < 0.12 ? -1 : 0
    // LA LANGUETTE (Keko, 12/11 : « vide cet espace en donnant une forme non rectangulaire à la zone » — le pointillé
    // et sa flèche, à gauche des crédits, ne plaisaient pas) : l'en-tête s'arrête sous le titre, et seul ce pan d'acier
    // descend, à droite, le bord gauche droit, cerné d'un filet ; le cartouche des crédits est dedans
    // (le cartouche fait onze de haut, un pixel de plus vers le haut : un pixel d'air sous le nombre comme au-dessus —
    // Keko, 13/11 : il touchait le contour du bas)
    const yc = HAUT_BARRE - 15
    const wp = wn + 21
    const px = W - 4 - wp + tremble
    compteurX = px + wp - 9
    // (À ANGLE DROIT — Keko : « évite la diagonale, tente un angle droit » ; le filet tourne au coin, descend le long du
    // bord gauche et passe sous le cartouche, à deux pixels de lui)
    const x0 = px - 5
    xDeLaLanguette = x0 - 1
    const yb = HAUT_BARRE - 1
    for (let y = YT - 2; y <= yb; y++) frame.light.fill(0, y * W + Math.max(0, x0 - 1), (y + 1) * W)
    p.rect(x0 - 1, YT - 1, W - x0 + 1, yb - YT + 2, MATIERES.encre.contour)
    p.rect(x0, YT - 2, W - x0, yb - YT + 2, FILET)
    p.rect(x0 + 1, YT - 2, W - x0 - 1, yb - YT + 1, ACIER)
    if (allume) p.glow(px + wp / 2, Y_CREDITS - 1, 24, RUNE[2], 0.3 * (1 - (t - creditsA) / 0.45))
    const bord = allume ? RUNE[3] : tremble !== 0 ? ROUGE[4] : N.hex('#23785b')
    p.rect(px, yc, wp, 11, bord)
    p.rect(px + 1, yc + 1, wp - 2, 9, N.hex('#0c241d'))
    p.rect(px + 1, yc + 1, wp - 2, 1, N.hex('#16382d'))
    for (const [cx, cy] of [[px, yc], [px + wp - 1, yc], [px, yc + 10], [px + wp - 1, yc + 10]]) p.rect(cx, cy, 1, 1, ACIER)
    dessinerUnCredit(p, px + wp - 9, yc + 5 + saut)
    ecrire(p, n, px + wp - 16, yc + 2 + saut, allume ? N.WHITE : N.hex('#fff2c8'), { police: GRAS, align: 'right' })
  }

  /**
   * LES ONGLETS DE LA BARRE : le hangar, la tech, le commerce, les quêtes — MOINS CEUX QUE LE TUTORIEL N'A PAS ENCORE
   * OUVERTS (Keko, 11/11 : « au début les quêtes servent de tuto : premier vol, unlock de l'onglet commerce, puis
   * tech… ») : la tech et le commerce paraissent quand on réclame la quête qui les ouvre.
   */
  const PRINCIPALES = (): string[] => VUES.slice(0, 4).filter((vv) => (vv === 'labo' ? ongletOuvert(quetes, 'labo') : vv === 'entrepot' ? ongletOuvert(quetes, 'entrepot') : true))
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
    // (à cinq cases, « Commerce » ne tient plus dans la sienne : seul l'onglet ouvert dit alors son nom, comme les branches de la tech)
    const tousLesNoms = slots.every((vv) => largeurDe(vv === 'plus' ? 'Plus' : NOMS_VUE[vv]) + 2 <= sw)
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
      // (la case « Plus » garde son nom : celui de la vue ouverte — « Paramètres » — débordait sur sa voisine ; son icône
      // et le titre du haut disent où l'on est)
      const nom = vv === 'plus' ? 'Plus' : NOMS_VUE[vv]
      const nomme = tousLesNoms || actif
      const yi = y0 + (nomme ? 13 : 17) + dy
      if (ic === 'plus') dessinerLIconePlus(p, cxs, yi, actif)
      else dessinerLIconeDeVue(p, ic, cxs, yi, actif)
      if (nomme) ecrire(p, nom, Math.max(largeurDe(nom, GRAS) / 2 + 1, Math.min(W - largeurDe(nom, GRAS) / 2 - 1, cxs)), y0 + 22 + dy, actif ? PEPITE[3] : COQUE[4], { align: 'center', police: actif ? GRAS : TEXTE })
      // (une pastille : du nouveau dans l'onglet, ou une quête à réclamer)
      if (nouveautes.has(vv) || (vv === 'quetes' && quetes.actives.some(estTerminee))) {
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
    // (couchée, il n'y a pas de barre du bas derrière laquelle finir : la feuille s'arrête au-dessus du bord)
    const bas = H - HAUT_NAV - (paysage ? 4 : 0)
    const autres = VUES.slice(4)
    const tw = 42
    // (couchée, elle est au milieu de l'écran et plus large : autant de tuiles par rangée que sa fenêtre en loge)
    const COL = paysage ? Math.max(4, Math.floor((W - 14) / (tw + 2))) : 4
    const th = 36
    const pas = th + 3
    const rangs = Math.ceil(autres.length / COL)
    const hPied = 38
    const hMax = bas - HAUT_BARRE - 10
    const visibles = Math.max(1, Math.min(rangs, Math.floor((hMax - 22 - hPied) / pas)))
    const hf = 22 + (autres.length > 0 ? visibles * pas : 16) + hPied
    // la feuille dépasse un peu sa place puis s'y pose
    const sur = feuille ? Math.round(Math.sin(Math.min(1, (t - feuilleA) / 0.3) * Math.PI) * 3) : 0
    // (ELLE MONTE DU BAS DE L'ÉCRAN, debout comme couchée — Keko, 13/11 : flottant au milieu, « c'est bizarre ; j'aimais
    // bien l'animation où il montait depuis le bas » ; couchée, le voile est celui de la base, sur tout l'écran)
    const yf = Math.round(bas - (hf + 4) * k) - sur
    if (!paysage) p.rect(0, HAUT_BARRE + 1, W, bas - HAUT_BARRE - 1, NUIT, 0.72 * k)
    if (feuille) zones = zones.filter((z) => z.y >= bas)
    plaque(p, 4, yf, W - 8, hf + 10, 'encre')
    motEnRelief(p, 'Autres onglets', W / 2, yf + 7, true)
    const yg = yf + 21
    if (autres.length === 0) ecrire(p, 'Aucun pour l’instant', W / 2, yg + 3, COQUE[3], { align: 'center' })
    const maxD = Math.max(0, rangs - visibles)
    defilOnglets = Math.max(0, Math.min(maxD, defilOnglets))
    const d0 = Math.round(defilOnglets)
    const gx = Math.floor((W - (COL * tw + (COL - 1) * 2)) / 2)
    // (la grille fait 174 px, plus que l'intérieur du panneau : elle est bornée à ses bords, sinon la première tuile en sort)
    const xDeLaTuile = (col: number): number => Math.max(8, Math.min(W - 8 - tw, gx + col * (tw + 2)))
    autres.forEach((vv, i) => {
      const r = Math.floor(i / COL) - d0
      if (r < 0 || r >= visibles) return
      if (feuille && t - feuilleA < 0.08 + i * 0.015) return
      const x = xDeLaTuile(i % COL)
      const y = yg + r * pas
      const actif = vv === vue
      const e = etatDuBouton(x, y, tw, th)
      if (!e.enfonce) ombrePortee(p, x, y, tw, th)
      plaque(p, x, y + e.dy, tw, th, actif ? 'or' : 'encre', { enfonce: e.enfonce, survole: e.survole, flash: e.flash })
      dessinerLIconeDeVue(p, vv, x + tw / 2, y + 13 + e.dy, actif)
      // (un nom plus large que la tuile — « Paramètres » — passe en petites capitales)
      if (largeurDe(NOMS_VUE[vv]) <= tw - 2) ecrire(p, NOMS_VUE[vv], x + tw / 2, y + th - 12 + e.dy, actif ? N.WHITE : COQUE[5], { align: 'center' })
      else p.text(texteNu(NOMS_VUE[vv]), x + tw / 2, y + th - 10 + e.dy, actif ? N.WHITE : COQUE[5], { align: 'center' })
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
        labo = laboNeuf()
        quetes = quetesNeuves()
        marche = marcheNeuf(heureDuMarche())
        tresor = cargaisonVide()
        connues.clear()
        sauverConnues([])
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
    // (AU DÉCOLLAGE, le feu du réacteur passe DERRIÈRE l'en-tête, comme le vaisseau — Keko, 12/11 : « les particules de
    // feu du réacteur sont au-dessus de la zone du titre au lieu d'être en dessous » : les éclats sont peints en dernier,
    // par-dessus tout ; pendant le décollage, ceux qui sont sous l'en-tête ou sa languette ne se peignent pas)
    const cache = (x: number, y: number): boolean => decollageA !== null && (paysage ? y < HAUT_COUCHE : y < HAUT_DU_TITRE || (y < HAUT_BARRE + 1 && x >= xDeLaLanguette - 2))
    for (const e of eclats) {
      e.x += e.vx * dtBase
      e.y += e.vy * dtBase
      if (cache(e.x, e.y + (e.fumee ? 6 : 0))) continue
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
        N.sparkle(p, compteurX, Y_CREDITS, 4, RUNE[3], N.WHITE, 0.9)
        jouer('ramasse')
        continue
      }
      const e = u * u * (3 - 2 * u)
      const x = v.x0 + (compteurX - v.x0) * e
      const y = v.y0 + (Y_CREDITS - v.y0) * e - Math.sin(u * Math.PI) * 26
      p.glow(x, y, 5, RUNE[2], 0.4)
      dessinerUnCredit(p, x, y)
    }
    // les pièces achetées s'envolent vers l'onglet du hangar, qui saute et prend une pastille
    for (let i = envolsDePiece.length - 1; i >= 0; i--) {
      const v = envolsDePiece[i]
      const u = (t - v.t0) / 0.7
      if (u < 0) continue
      const sw = W / (PRINCIPALES().length + 1)
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
      peindreDansUneCase(p, formesDeLaPiece(v.pc), x, y, tc, tc, { cadre: cadreDeLaPiece(v.pc), rampes: rampesDuJoueur() })
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
  /** L'ICÔNE D'UN ONGLET, centrée sur (x, y), une douzaine de pixels : le VAISSEAU nez en haut, le MONITEUR du labo et son tracé vert, le CONTENEUR de l'entrepôt. */
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
      // LA TECH (Keko, 11/11 : « on renomme le labo tech et on lui trouve une autre icône adaptée » — le moniteur est
      // passé au commerce) : UN PETIT ARBRE DE NŒUDS, celui que la vue montre — un nœud en haut, deux dessous, un
      // dernier au bout d'une branche, reliés d'un trait vert ; l'onglet ouvert, un grain clair descend l'arbre
      const trait = actif ? RUNE[2] : RUNE[1]
      const noeuds: [number, number][] = [[0, -5], [-4, 0], [4, 0], [-4, 5]]
      for (const [nx, ny] of noeuds) p.rect(x + nx - 2, y + ny - 2, 5, 5, OMBRE, a)
      p.rect(x - 1, y - 4, 3, 3, OMBRE, a)
      p.rect(x - 5, y - 3, 11, 3, OMBRE, a)
      p.rect(x, y - 4, 1, 2, trait, a)
      p.rect(x - 4, y - 2, 9, 1, trait, a)
      p.rect(x - 4, y + 2, 1, 2, trait, a)
      noeuds.forEach(([nx, ny], i) => {
        p.rect(x + nx - 1, y + ny - 1, 3, 3, i === 0 ? RUNE[3] : i === 3 ? COQUE[3] : COQUE[5], a)
        p.rect(x + nx - 1, y + ny - 1, 1, 1, i === 3 ? COQUE[4] : N.WHITE, a)
      })
      if (actif) {
        const k = Math.floor(t * 4) % 4
        const [nx, ny] = noeuds[k]
        p.rect(x + nx - 1, y + ny - 1, 3, 3, N.WHITE)
        p.glow(x + nx, y + ny, 6, RUNE[2], 0.5)
      }
    } else if (vv === 'entrepot') {
      // LE COMMERCE (ex-entrepôt) prend LE MONITEUR du labo (Keko : « on peut utiliser l'icône du labo pour l'entrepôt
      // et le renommer commerce ? ») : son tracé, c'est maintenant le cours
      // UN MONITEUR (Keko : « le labo, on peut mettre un genre de moniteur / ordi ? la fiole, ça ne fait pas trop
      // recherche spatiale ») : un écran d'acier sur son pied, sa dalle vert sombre où court un tracé de mesure — il
      // garde le vert du labo — ; l'onglet ouvert, le tracé défile, un point clair court dessus et l'écran luit
      p.rect(x - 6, y - 7, 13, 10, OMBRE, a)
      p.rect(x - 5, y - 6, 11, 8, COQUE[3], a)
      p.rect(x - 5, y - 6, 11, 1, COQUE[5], a)
      p.rect(x + 5, y - 5, 1, 7, COQUE[2], a)
      p.rect(x - 4, y - 5, 9, 6, N.hex('#06200f'), a)
      for (let k = 0; k < 9; k++) {
        const h = Math.round(2.5 + 1.6 * Math.sin(k * 1.25 + (actif ? t * 5 : 0.6)) + (k === 4 ? 1 : 0))
        p.rect(x - 4 + k, y - Math.max(0, Math.min(5, h)), 1, 1, RUNE[2], a)
      }
      if (actif) {
        const k = Math.floor(t * 9) % 9
        const h = Math.round(2.5 + 1.6 * Math.sin(k * 1.25 + t * 5) + (k === 4 ? 1 : 0))
        p.rect(x - 4 + k, y - Math.max(0, Math.min(5, h)), 1, 1, N.WHITE)
        p.glow(x, y - 2, 8, RUNE[2], 0.35)
      }
      p.rect(x - 2, y + 3, 5, 2, OMBRE, a)
      p.rect(x - 1, y + 3, 3, 1, COQUE[3], a)
      p.rect(x - 5, y + 4, 11, 3, OMBRE, a)
      p.rect(x - 4, y + 5, 9, 1, COQUE[4], a)
      p.rect(x + 2, y + 5, 1, 1, actif && Math.floor(t * 2) % 2 === 0 ? RUNE[3] : RUNE[1], a)
    } else if (vv === 'quetes') {
      // LES QUÊTES : une tablette à pince, trois lignes à cocher — la première cochée de vert
      p.rect(x - 5, y - 6, 11, 13, OMBRE, a)
      p.rect(x - 4, y - 5, 9, 11, COQUE[5], a)
      p.rect(x - 4, y - 5, 9, 1, COQUE[6], a)
      p.rect(x + 4, y - 4, 1, 10, COQUE[3], a)
      p.rect(x - 2, y - 7, 5, 3, OMBRE, a)
      p.rect(x - 1, y - 6, 3, 1, PEPITE[2], a)
      for (let k = 0; k < 3; k++) {
        p.rect(x - 3, y - 2 + k * 3, 2, 2, k === 0 ? RUNE[1] : COQUE[2], a)
        p.rect(x, y - 2 + k * 3, 4, 1, COQUE[2], a)
      }
      if (actif) {
        const k = Math.floor(t * 1.5) % 3
        p.rect(x - 3, y - 2 + k * 3, 2, 2, RUNE[3])
        p.glow(x, y, 8, PEPITE[2], 0.3)
      }
    } else if (vv === 'reglages') {
      // LES PARAMÈTRES : trois réglettes, leur curseur à des places différentes
      for (const [dy, cx] of [[-5, 2], [0, -3], [5, 1]] as const) {
        p.rect(x - 6, y + dy - 1, 13, 3, OMBRE, a)
        p.rect(x - 5, y + dy, 11, 1, actif ? COQUE[5] : COQUE[3], a)
        p.rect(x + cx - 2, y + dy - 2, 4, 5, OMBRE, a)
        p.rect(x + cx - 1, y + dy - 1, 2, 3, actif ? PEPITE[3] : COQUE[5], a)
      }
    } else if (estEssai(vv)) dessinerUneIconeDEssai(p, vv, x, y, OMBRE)
    else {
      // (plus aucune vue ne le porte depuis que le commerce a pris le moniteur ; gardé pour un vrai entrepôt)
      // UN CONTENEUR, plus « SF » (Keko : « changer le logo entrepôt pour une boîte plus SF, le carton c'est pas fou ») :
      // une caisse d'acier aux coins coupés — le dessus clair, le dessous sombre, quatre équerres aux coins, deux
      // nervures —, barrée d'un bandeau sombre où court un filet d'énergie cyan ; son voyant bat quand l'onglet est ouvert
      p.rect(x - 5, y - 5, 11, 11, OMBRE, a)
      p.rect(x - 6, y - 4, 13, 9, OMBRE, a)
      p.rect(x - 5, y - 4, 11, 9, COQUE[3], a)
      p.rect(x - 4, y - 4, 9, 1, COQUE[5], a)
      p.rect(x - 5, y - 3, 1, 7, COQUE[4], a)
      p.rect(x + 5, y - 3, 1, 7, COQUE[2], a)
      p.rect(x - 4, y + 4, 9, 1, COQUE[2], a)
      for (const nx of [-2, 2]) p.rect(x + nx, y - 3, 1, 7, COQUE[2], a)
      for (const [cx, cy] of [[-5, -4], [4, -4], [-5, 3], [4, 3]]) p.rect(x + cx, y + cy, 2, 2, cy < 0 ? COQUE[6] : COQUE[4], a)
      p.rect(x - 5, y - 1, 11, 3, N.hex('#0c1420'), a)
      p.rect(x - 4, y, 9, 1, VERRIERE[1], a)
      const bat = actif ? Math.floor(t * 3) % 2 === 0 : false
      p.rect(x - 1, y, 3, 1, bat ? N.WHITE : VERRIERE[2], a)
      if (actif) p.glow(x, y, 7, VERRIERE[1], bat ? 0.5 : 0.3)
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
    if (pc.sorte === 'coque') return formesDuChassis(pc.cran) // (le cuirassé, cran 4, a son propre dessin)
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
    peindreDansUneCase(p, formesDeLaPiece(pc), x, y, bw, bh, { cadre: cadreDeLaPiece(pc), rampes: rampesDuJoueur() })
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
  /**
   * LES CASES DÉFILENT quand elles ne tiennent pas au-dessus de « Décoller » (Keko, 11/11 : « ajouter un système de
   * scroll si les parties en bas ne logent pas — hypothétiquement, un vaisseau énorme avec beaucoup d'armes et
   * d'outils ») : on les fait glisser au doigt, d'une rangée à la fois (la molette sur PC), une barre à droite.
   */
  const PAS_DES_CASES = 40
  let defilCases = 0
  let zoneDesCases: { x: number; y: number; w: number; h: number } | null = null
  function dessinerLesEmplacements(p: Peintre, y: number): number {
    const cw = Math.floor((W - 12) / 2)
    const ch = 36
    const cases = casesDuVaisseau()
    const bas = H - HAUT_NAV - (vue === 'hangar' ? 42 : 4)
    const rangs = Math.ceil(cases.length / 2)
    const visibles = Math.max(1, Math.floor((bas - y + 4) / PAS_DES_CASES))
    const maxD = Math.max(0, rangs - visibles)
    defilCases = Math.max(0, Math.min(maxD, defilCases))
    const d = Math.round(defilCases)
    if (maxD > 0) {
      const hg = visibles * PAS_DES_CASES - 4
      const hc = Math.max(8, Math.round((hg * visibles) / rangs))
      p.rect(W - 3, y, 2, hg, MATIERES.creux.contour)
      p.rect(W - 3, y + Math.round(((hg - hc) * defilCases) / maxD), 2, hc, COQUE[3])
      zoneDesCases = { x: 0, y, w: W, h: hg }
    }
    cases.forEach((c, i) => {
      const age = t - etapeA - i * 0.045
      if (age < 0) return
      const rang = Math.floor(i / 2) - d
      if (rang < 0 || rang >= visibles) return
      const o = c.o
      const x = 4 + (i % 2) * (cw + 4)
      const yy = y + rang * (ch + 4)
      let montee: Piece | undefined
      if (vue === 'hangar') montee = o === 'propulseur' || o === 'coque' ? monteeA(hangar, o) : pieceDe(listeMontee(o)[c.k] ?? '')
      else montee = piecesDe(o).find((pc) => !possede(hangar, pc.id))
      const e = etatDuBouton(x, yy, cw, ch)
      const monte = Math.round((1 - sortie(age / 0.2)) * 4) - (e.survole && !e.enfonce ? 1 : 0)
      const y2 = yy + e.dy + monte
      if (!e.enfonce) ombrePortee(p, x, yy + Math.max(0, monte), cw, ch)
      plaque(p, x, y2, cw, ch, 'encre', { enfonce: e.enfonce, survole: e.survole, flash: e.flash || age < 0.07 })
      // (LE TITRE DE LA PLACE COIFFE LA CASE, plus fort que le nom de la pièce — Keko, 12/11 : « bizarre que le titre des
      // différentes pièces soit plus petit que le nom de la pièce qui est en dessous » ; il était en petites capitales
      // au-dessus du nom : il est en gras d'or, en relief, sur toute la largeur de la case ; dessous, le puits et le nom)
      const titre = titreDe(c)
      motEnRelief(p, titre, x + 5 + largeurDe(titre, GRAS) / 2, y2 + 3, true)
      const yp = y2 + 12
      const hp = ch - 15
      plaque(p, x + 4, yp, 26, hp, 'creux')
      const vide = vue === 'hangar' && montee === undefined
      if (vide) {
        const c2 = Math.sin(t * 3 + i) > 0 ? COQUE[3] : COQUE[2]
        p.rect(x + 16, yp + hp / 2 - 4, 2, 8, c2)
        p.rect(x + 13, yp + hp / 2 - 1, 8, 2, c2)
      } else if (montee !== undefined) dessinerLePictogramme(p, montee, x + 17, yp + hp / 2, 26, hp)
      const ligne = vide ? 'Vide' : montee!.nom
      const L = replier(ligne, cw - 38).slice(0, 2)
      L.forEach((li, k) => ecrire(p, li, x + 34, yp + (L.length === 1 ? 7 : 2) + k * 9, vue === 'labo' || vide ? COQUE[3] : COQUE[6]))
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
    else if (vue === 'quetes') dessinerLesQuetes(p, y)
    else if (vue === 'reglages') dessinerLesReglages(p, y)
    else if (vue === 'labo') {
      // (debout, rien : l'arbre et sa fiche tiennent toute la scène ; couchée, la fiche du nœud est ici)
      if (paysage) dessinerLInfoDuNoeud(p, y)
    } else if (etape === 'vaisseau') {
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
      motEnRelief(p, 'DÉCOLLER', W / 2 + dx, by + 9 + dy, true, TITRE)
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
   * LA PAGE D'UNE PLACE : l'en-tête (le retour, le titre), puis LA SEULE PIÈCE ÉQUIPÉE, sa fiche entière, et « Changer »
   * (Keko, 12/11 : « la hauteur ne laisse voir que deux pièces, ce qui rend le scrolling pénible — on n'affiche plus la
   * liste mais uniquement la pièce équipée, et un bouton changer qui ouvre un panneau avec toutes les pièces dispo, où
   * on peut équiper / acheter »). Une place vide le dit, et propose « Choisir ».
   */
  function dessinerLaListe(p: Peintre, y0: number): void {
    let y = y0
    enTete(p, y, titreDe({ o: onglet, k: placeOuverte() }), () => changerDEtape('vaisseau'))
    y += HT + 3
    const ko = placeOuverte()
    const pc = onglet === 'propulseur' || onglet === 'coque' ? monteeA(hangar, onglet) : pieceDe(listeMontee(onglet)[ko] ?? '')
    if (pc !== undefined) {
      dessinerLaFiche(p, y, pc, true)
      return
    }
    const bw = largeurDe('Choisir', GRAS) + 22
    bouton(p, W / 2 - bw / 2, y, bw, 15, 'Choisir', true, ouvrirLeChangement, 'ouvre')
    y += 19
    plaque(p, 4, y, W - 8, 30, 'encre')
    ecrire(p, 'Emplacement vide', W / 2, y + 11, COQUE[4], { align: 'center' })
  }

  /** LE PANNEAU « CHANGER » est ouvert ; depuis quand. */
  let changement = false
  let changementA = -10
  /** Dans le panneau du châssis : les pastilles de couleur sont dépliées (le bouton « Couleur »). */
  let couleursOuvertes = false
  let couleursA = -10
  function ouvrirLeChangement(): void {
    changement = true
    changementA = t
    couleursOuvertes = false
    choixA = t
    surligneY = -1
  }
  /**
   * LA GRILLE DES COULEURS, par-dessus le panneau du châssis : le châssis peint dans la couleur choisie, son nom, dix
   * grandes pastilles sur deux rangées (la choisie cerclée d'or — une tape repeint la coque et les ailes, au hangar
   * comme en vol), et « Fermer » ; une tape hors du panneau le ferme aussi.
   */
  function dessinerLesCouleurs(p: Peintre): void {
    if (vue !== 'hangar' || etape !== 'liste' || onglet !== 'coque') couleursOuvertes = false
    if (!couleursOuvertes) return
    const u0 = sortie((t - couleursA) / 0.18)
    const COLONNES = 5
    const cote = 26
    const pas = cote + 4
    const rangs = Math.ceil(LIVREES.length / COLONNES)
    const hp = 78 + rangs * pas + 15 + 4
    const x = 6
    const w = W - 12
    const y = Math.max(HAUT_BARRE + 3, Math.round((H - hp) / 2)) + Math.round((1 - u0) * 10)
    p.rect(0, 0, W, H, NUIT, 0.72 * u0)
    frame.light.fill(0)
    zones = []
    zoneGlissante = null
    plaque(p, x, y, w, hp, 'encre')
    motEnRelief(p, 'Couleur', W / 2, y + 7, true)
    // le châssis monté, dans la couleur choisie
    plaque(p, W / 2 - 24, y + 20, 48, 40, 'creux')
    const monte = monteeA(hangar, 'coque')
    if (monte !== undefined) dessinerLePictogramme(p, monte, W / 2, y + 40, 48, 40)
    ecrire(p, LIVREES.find((l) => l.id === livree)?.nom ?? '', W / 2, y + 64, N.hex('#fff3cf'), { align: 'center', police: GRAS })
    const x0 = Math.round((W - COLONNES * pas + 4) / 2)
    LIVREES.forEach((l, i) => {
      const cx = x0 + (i % COLONNES) * pas
      const cy = y + 78 + Math.floor(i / COLONNES) * pas
      const choisie = l.id === livree
      const [sombre, moyen, clair] = tonsDeLaLivree(l.id)
      const e = etatDuBouton(cx, cy, cote, cote)
      p.rect(cx - 1, cy - 1 + e.dy, cote + 2, cote + 2, choisie ? PEPITE[3] : MATIERES.encre.contour)
      p.rect(cx, cy + e.dy, cote, cote, MATIERES.encre.contour)
      p.rect(cx + 1, cy + 1 + e.dy, cote - 2, cote - 2, moyen)
      p.rect(cx + 1, cy + 1 + e.dy, cote - 2, 5, clair)
      p.rect(cx + 1, cy + cote - 8 + e.dy, cote - 2, 7, sombre)
      if (choisie) N.sparkle(p, cx + cote - 5, cy + 5, 2 + Math.round(1.5 + 1.5 * Math.sin(t * 5)), N.WHITE, PEPITE[3], 0.8)
      else zone(cx - 2, cy - 2, pas, pas, () => {
        livree = l.id
        sauverLivree(l.id)
      }, 'equipe')
    })
    const bf = largeurDe('Fermer', GRAS) + 22
    bouton(p, Math.round(W / 2 - bf / 2), y + 78 + rangs * pas, bf, 15, 'Fermer', true, () => (couleursOuvertes = false), 'retour', 'acier')
    zone(x, y, w, hp, () => {}, null)
    zone(0, 0, W, H, () => (couleursOuvertes = false), 'retour')
  }

  /**
   * LE PANNEAU « CHANGER » : toutes les pièces de la place, sur TOUTE LA HAUTEUR sous la barre du haut (la scène et la
   * barre des onglets sont couvertes : la liste a enfin de la place) — le titre, les puces de sous-catégorie, la liste
   * qui glisse au doigt (le surlignage qui glisse, une encoche d'or), LA FICHE de la pièce choisie avec « Équiper »,
   * « Acheter » ou « Retirer » ; on en sort par la flèche de retour de l'en-tête. Équiper ou retirer referme le panneau ; acheter le laisse ouvert.
   */
  /**
   * `partie` : COUCHÉ, LE PANNEAU EST EN DEUX FENÊTRES (Keko, 13/11 : « on devrait ouvrir la liste des pièces dans un
   * panneau à gauche, par-dessus l'image du vaisseau, car à droite il n'y a que deux lignes dans le menu déroulant ») :
   * LA LISTE à gauche, sur toute la hauteur de la scène ; LA FICHE de la pièce choisie et son bouton à droite, dans la
   * colonne. `tout` : le panneau du portrait, d'un seul tenant.
   */
  function dessinerLeChangement(p: Peintre, partie: 'tout' | 'liste' | 'fiche' = 'tout'): void {
    if (!changement) return
    if (vue !== 'hangar' || etape !== 'liste') {
      changement = false
      return
    }
    const u0 = sortie((t - changementA) / 0.18)
    // tout ce qui est dessous disparaît et ne répond plus (la barre du haut reste : on y lit ses crédits)
    p.rect(0, HAUT_BARRE, W, H - HAUT_BARRE, NUIT)
    eteindre(0, HAUT_BARRE, W, H)
    if (partie === 'fiche') {
      // (la fiche seule, dans la colonne : la pièce choisie dans la liste d'à côté)
      const liste = listeVisible(onglet).filter((pc) => possede(hangar, pc.id) || pieceOuverte(labo, pc.id))
      const pc = liste[Math.max(0, liste.findIndex((x) => x.id === choix[onglet]))]
      if (pc !== undefined) dessinerLaFiche(p, HAUT_BARRE + 6 + Math.round((1 - u0) * 10), pc)
      if (u0 < 1) p.rect(0, HAUT_BARRE, W, H - HAUT_BARRE, NUIT, 1 - u0)
      zone(0, 0, W, H, () => {}, null)
      return
    }
    zones = []
    curseurs = []
    zoneDesCases = null
    const fermer = (): void => {
      changement = false
      etapeA = t
    }
    let y = HAUT_BARRE + 4 + Math.round((1 - u0) * 10)
    const titre = titreDe({ o: onglet, k: placeOuverte() })
    // (LA FLÈCHE DE RETOUR du hangar, pas un bouton « Fermer » — Keko, 12/11)
    enTete(p, y, titre, fermer)
    y += HT + 3
    const yFermer = H
    // (LE HANGAR MONTRE CE QU'ON A, ET CE QUE LE LABO A DÉBLOQUÉ — Keko, 11/11 : « quand une pièce est débloquée au labo,
    // elle apparaît dans le hangar et le bouton équiper est un bouton acheter avec le prix »)
    const liste = listeVisible(onglet).filter((pc) => possede(hangar, pc.id) || pieceOuverte(labo, pc.id))
    // (PAS DE CATÉGORIE VIDE — Keko, 13/11 : « au début on n'a que le minage : on n'affiche que minage ; quand on
    // débloquera un autre outil, on affichera tous, minage et la catégorie de l'autre outil » : seules les familles qui
    // ont une pièce à montrer ont leur puce ; « Tout » ne vient qu'à partir de deux)
    const familles = famillesDe(onglet).filter((f) => piecesDe(onglet).some((pc) => sousDe(pc) === f && (possede(hangar, pc.id) || pieceOuverte(labo, pc.id))))
    if (sousCategorie[onglet] !== null && !familles.includes(sousCategorie[onglet] as string)) sousCategorie[onglet] = null
    if (familles.length > 0) {
      const puces: (string | null)[] = familles.length > 1 ? [null, ...familles] : familles
      const noms = puces.map((f) => (f === null ? 'Tout' : (NOMS_FAMILLE[f] ?? f)))
      const largeurs = noms.map((n) => largeurDe(n, GRAS) + 12)
      let x = Math.floor((W - largeurs.reduce((a, b) => a + b, 0) - (puces.length - 1) * 3) / 2)
      puces.forEach((f, i) => {
        const actif = sousCategorie[onglet] === f || puces.length === 1
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
    // (autant de rangées que la plus haute des fiches en laisse jusqu'en bas : la liste ne change pas de
    // taille d'une pièce à l'autre ; pas plus que la liste n'en a)
    // (la liste seule : elle prend toute la hauteur)
    const hf = partie === 'liste' ? -8 : Math.max(0, ...liste.map(hauteurDeLaFiche))
    const RANGEES = Math.max(2, Math.min(Math.max(2, liste.length), Math.floor((yFermer - 4 - y - 8 - hf) / RANG_LISTE)))
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
    if (liste.length === 0) ecrire(p, 'Rien ici : passez à la recherche', W / 2, y + 22, COQUE[4], { align: 'center' })
    y += hl + 4
    const pc = liste[iSel]
    if (pc !== undefined && partie === 'tout') dessinerLaFiche(p, y, pc)
    if (u0 < 1) p.rect(0, HAUT_BARRE, W, H - HAUT_BARRE, NUIT, 1 - u0)
    // (le reste du panneau ne fait rien : ce qui est dessous ne répond pas)
    zone(0, 0, W, H, () => {}, null)
  }

  /** Une pièce montée : l'onde sur l'aire, le flash du vaisseau, des étincelles, une petite secousse. */
  function feterLEquipement(): void {
    equipeA = t
    secouer(1)
    const cy = Y_SCENE + Math.round(hautScene / 2)
    gerbe(W / 2, cy, 18, [PEPITE[2], PEPITE[3], N.WHITE], 60)
  }

  // ================================================================ LE LABO : L'ARBRE DES RECHERCHES
  /**
   * L'ARBRE DU LABO (Keko, 11/11 — la règle est dans `logic/vaisseau/labo.ts`) : la scène montre LA BRANCHE choisie
   * (minage, combat, exploration : trois puces sous elle), ses trois rangs de haut en bas, reliés par un tronc qui
   * s'allume à mesure que les rangs s'ouvrent. La FORME dit la sorte du nœud — un carré pour une PIÈCE, un rond pour un
   * PASSIF, un losange pour une MÉCANIQUE —, la matière son état : éteint (rang fermé), encre (à débloquer ; une pastille
   * d'or s'il est payable), vert (débloqué). Sous l'arbre, LA FICHE du nœud choisi : ce qu'il donne, son coût EN MINERAI
   * (ce qu'on a / ce qu'il faut), « Débloquer » — puis, pour une pièce, « Acheter » en crédits, comme avant.
   */
  let branche: Branche = 'minage'
  const noeudChoisi: Record<Branche, string> = { minage: noeudsDe('minage')[0].id, combat: noeudsDe('combat')[0].id, exploration: noeudsDe('exploration')[0].id, commerce: noeudsDe('commerce')[0].id }
  let debloqueA = -10
  let debloqueId = ''
  /** Où chaque nœud de la branche est dessiné (refait à chaque image) : la gerbe d'un déblocage part de là. */
  const placesDesNoeuds: Record<string, { x: number; y: number }> = {}
  /** Les dessins des passifs et des mécaniques, sept pixels sur sept. */
  const ICONES_DU_LABO: Record<string, string[]> = {
    forage: ['#######', '.#####.', '.#####.', '..###..', '..###..', '...#...', '...#...'],
    soute: ['#######', '#.....#', '#######', '#.....#', '#.###.#', '#.....#', '#######'],
    pepite: ['...#...', '..###..', '.#####.', '#######', '.#####.', '..###..', '...#...'],
    blindage: ['#######', '#######', '#######', '#######', '.#####.', '..###..', '...#...'],
    cadence: ['.#.#.#.', '.#.#.#.', '.#.#.#.', '.#.#.#.', '.......', '#######', '#######'],
    critique: ['...#...', '...#...', '..###..', '#######', '..###..', '...#...', '...#...'],
    bouclier: ['..###..', '.#...#.', '#.....#', '#.....#', '#.....#', '.#...#.', '..###..'],
    // (les chevrons ont deux cases d'épaisseur : en biais d'une seule case, agrandis, ils sortaient en pointillé)
    vitesse: ['##.##..', '.##.##.', '..##.##', '..##.##', '.##.##.', '##.##..', '.......'],
    maniabilite: ['.####..', '#....#.', '#.....#', '#...###', '#....#.', '.#.....', '..###..'],
    acceleration: ['...#...', '..###..', '.##.##.', '##.#.##', '..###..', '.##.##.', '##...##'],
    aimant: ['##...##', '##...##', '#.....#', '#.....#', '#.....#', '.#...#.', '..###..'],
    postcombustion: ['...#...', '..##...', '..###..', '.####.#', '.######', '.#####.', '..###..'],
    combat: ['...#...', '..###..', '.#.#.#.', '###.###', '.#.#.#.', '..###..', '...#...'],
    exploration: ['.#####.', '.#####.', '.#####.', '.#.....', '.#.....', '.#.....', '###....'],
    // (une COURBE DE PRIX en zigzag, sur ses deux axes — Keko, 11/11 : « un symbole de courbe, qui monte et descend en
    // zigzag comme une courbe de prix », à la place des deux flèches de l'échange)
    commerce: ['#.....#', '#....#.', '#.#..#.', '##.#.#.', '#...#..', '#......', '#######'],
    vente: ['..###..', '.#...#.', '#..#..#', '#.###.#', '#..#..#', '.#...#.', '..###..'],
    plafond: ['#######', '...#...', '..###..', '.#####.', '...#...', '...#...', '...#...'],
    ordre: ['.......', '#.#.#.#', '.......', '..###..', '.#####.', '..###..', '.......'],
    prevision: ['......#', '.....#.', '#...#..', '.#.#...', '..#....', '.......', '#.#.#.#'],
    tuto: ['...#...', '..###..', '#######', '.#####.', '.#####.', '.##.##.', '.#...#.'],
    tout: ['###.###', '###.###', '###.###', '.......', '###.###', '###.###', '###.###'],
    minerai: ['..###..', '.#####.', '#######', '#######', '#######', '.#####.', '.......'],
    cristal: ['..##...', '..###..', '.####..', '.####.#', '.#####.', '.#####.', '..###..'],
    meca: ['.#.#.#.', '#######', '.#####.', '###.###', '.#####.', '#######', '.#.#.#.'],
    bio: ['.#...#.', '.#####.', '..#.#..', '...#...', '..#.#..', '.#####.', '.#...#.'],
  }
  /**
   * UN SYMBOLE DU LABO, EN RELIEF (Keko, 11/11 : « donner un peu de texture aux symboles des arbres du labo » — c'étaient
   * des aplats d'une seule teinte) : le dessin de sept sur sept, agrandi, devient un petit objet de métal — son bord du
   * haut et de gauche pris par la lumière, celui du bas et de droite dans l'ombre, un grain semé dans le corps (toujours
   * le même), et une ombre portée d'un pixel. `T` : ses trois tons, du sombre au clair.
   */
  function dessinerLeGlyphe(p: Peintre, nom: string, x0: number, y0: number, T: [number, number, number], k = 2, riche = false): void {
    const lignes = ICONES_DU_LABO[nom]
    if (lignes === undefined) return
    const x = Math.round(x0 - 3.5 * k)
    const y = Math.round(y0 - 3.5 * k)
    const n = 7 * k
    const plein = (i: number, j: number): boolean => i >= 0 && j >= 0 && i < n && j < n && lignes[Math.floor(j / k)][Math.floor(i / k)] === '#'
    const OMBRE = N.hex('#04060c')
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) if (plein(i, j) && !plein(i + 1, j + 1)) p.rect(x + i + 1, y + j + 1, 1, 1, OMBRE)
    for (let j = 0; j < n; j++)
      for (let i = 0; i < n; i++) {
        if (!plein(i, j)) continue
        // (la lumière vient d'en haut : seuls le dessus et le dessous prennent le clair et le sombre — éclairés aussi par
        // les côtés, les traits en biais d'un grand symbole sortaient en damier)
        const lit = !plein(i, j - 1)
        const sombre = !plein(i, j + 1)
        // (`riche` — les onglets du commerce et de la recherche : un grain sombre plus dense, et des paillettes claires)
        const g = grainA(i * 7 + nom.length, j * 13)
        p.rect(x + i, y + j, 1, 1, lit && !sombre ? T[2] : sombre && !lit ? T[0] : !lit && g < (riche ? 0.24 : 0.12) ? T[0] : riche && g > 0.9 ? T[2] : T[1])
      }
  }
  type EtatDuNoeud = 'ferme' | 'ouvert' | 'acquis'
  const etatDuNoeud = (n: Noeud): EtatDuNoeud => (estDebloque(labo, n.id) ? 'acquis' : rangOuvert(labo, n.branche, n.rang) ? 'ouvert' : 'ferme')
  /**
   * UN NŒUD, centré sur (x, y) — REFAIT EN GRAND (Keko, 11/11 : « nœuds tout petits, beaucoup d'espace vide, les
   * connexions très très fines… le rework pour le rendre bien plus juicy, beau et rendu pro ») : trente-quatre pixels au
   * lieu de vingt-deux, une vraie pièce de métal — cerné d'encre, son bord, son corps biseauté (clair en haut à gauche,
   * sombre en bas à droite), et dedans un puits pour la pièce, ou le symbole en grand. La FORME dit la sorte (carré :
   * une pièce ; rond : un passif ; losange : une mécanique), la MATIÈRE l'état : éteint et cadenassé (rang fermé), acier
   * bleu qui respire (à débloquer), vert coché qui scintille (débloqué). Choisi, il se lève et quatre équerres d'or
   * l'encadrent ; débloqué, il éclate en blanc.
   */
  // (… PUIS RAMENÉS À VINGT-SIX PIXELS — Keko, 13/11 : « en paysage comme en portrait je trouve les icônes trop
  // grosses » ; vingt-deux étaient trop peu, trente-quatre trop : entre les deux, et les rangs resserrés d'autant)
  function dessinerUnNoeud(p: Peintre, n: Noeud, x: number, y: number, choisi: boolean): void {
    const etat = etatDuNoeud(n)
    const e = etatDuBouton(x - 20, y - 20, 40, 40)
    const yy = y + e.dy - Math.round(rebond(`noeud-${n.id}`, choisi ? 1 : 0) * 2)
    const bat = 0.5 + 0.5 * Math.sin(t * 3.5 + x * 0.13)
    const ud = n.id === debloqueId ? (t - debloqueA) / 0.5 : 1
    const encre = N.hex('#04060c')
    const T =
      etat === 'acquis'
        ? { corps: RUNE[1], clair: RUNE[2], bord: RUNE[3], sombre: N.hex('#0a3a1e'), puits: N.hex('#06200f') }
        : etat === 'ouvert'
          ? { corps: N.hex('#22365c'), clair: N.hex('#3f62a0'), bord: bat > 0.5 ? N.hex('#a8caff') : N.hex('#6f97d8'), sombre: N.hex('#131e36'), puits: N.hex('#0b1322') }
          : // (un nœud fermé reste GRIS ACIER, pas noir : sur le bleu nuit de la planche il se confondait avec le fond — Keko, 11/11)
            { corps: N.hex('#2a3348'), clair: N.hex('#3d4962'), bord: N.hex('#586682'), sombre: N.hex('#191f2e'), puits: N.hex('#12161f') }
    const tons: [number, number, number] = etat === 'acquis' ? [N.hex('#9af0b8'), N.hex('#dcffe6'), N.WHITE] /* (trois tons proches : contrastés, un symbole en biais sortait en pointillé) */ : etat === 'ouvert' ? [COQUE[3], COQUE[5], COQUE[6]] : [COQUE[2], COQUE[3], COQUE[4]]
    // sa lueur : verte et posée s'il est acquis, bleue et qui respire s'il attend
    if (etat === 'acquis') p.glow(x, yy, 21, RUNE[2], 0.2 + 0.07 * bat)
    else if (etat === 'ouvert') p.glow(x, yy, 19, N.hex('#3a8ad0'), 0.08 + 0.14 * bat)
    if (n.sorte === 'piece') {
      // UNE PIÈCE : une plaque carrée, quatre rivets, un puits où la pièce est rendue
      p.rect(x - 14, yy - 14, 28, 29, encre)
      p.rect(x - 13, yy - 13, 26, 26, T.bord)
      p.rect(x - 12, yy - 12, 24, 24, T.corps)
      p.rect(x - 12, yy - 12, 24, 1, T.clair)
      p.rect(x - 12, yy - 12, 1, 24, T.clair)
      p.rect(x - 12, yy + 11, 24, 1, T.sombre)
      p.rect(x + 11, yy - 12, 1, 24, T.sombre)
      p.rect(x - 10, yy - 10, 20, 20, encre)
      p.rect(x - 9, yy - 9, 18, 18, T.puits)
      p.rect(x - 9, yy + 8, 18, 1, T.clair)
      const pc = pieceDe(n.piece ?? '')
      if (pc !== undefined) dessinerLePictogramme(p, pc, x, yy, 18, 18)
      if (etat === 'ferme') p.rect(x - 9, yy - 9, 18, 17, N.hex('#12161f'), 0.5)
    } else if (n.sorte === 'passif') {
      // UN PASSIF : un médaillon rond, son jonc, le symbole en grand
      p.circle(x, yy + 1, 14, encre)
      p.circle(x, yy, 14, encre)
      p.circle(x, yy, 13, T.bord)
      p.circle(x, yy, 11.5, T.corps)
      p.arc(x, yy, 11, 1, Math.PI * 0.9, Math.PI * 1.65, T.clair)
      p.arc(x, yy, 11, 1, -Math.PI * 0.1, Math.PI * 0.65, T.sombre)
      dessinerLeGlyphe(p, n.icone ?? '', x, yy, tons, 2)
    } else {
      // UNE MÉCANIQUE : un losange, son arête claire en haut, le symbole dedans
      const lo = (r: number, dy = 0): [number, number][] => [[x, yy - r + dy], [x + r, yy + dy], [x, yy + r + dy], [x - r, yy + dy]]
      p.poly(lo(17, 1), encre)
      p.poly(lo(17), encre)
      p.poly(lo(15.5), T.bord)
      p.poly(lo(13.5), T.corps)
      p.line(x - 12, yy - 1, x - 1, yy - 12, T.clair)
      p.line(x + 1, yy + 12, x + 12, yy + 1, T.sombre)
      dessinerLeGlyphe(p, n.icone ?? '', x, yy, tons, 2)
    }
    // SON ÉTAT, en pastille dans le coin : un cadenas (rang fermé), une coche (acquis), le crédit (une pièce débloquée
    // qu'on n'a pas encore achetée)
    const bx = x + 10
    const by = yy + 10
    if (etat === 'ferme') {
      p.rect(bx - 4, by - 4, 9, 9, encre)
      p.rect(bx - 3, by - 1, 7, 5, COQUE[3])
      p.rect(bx - 3, by - 1, 7, 1, COQUE[4])
      p.rect(bx - 2, by - 3, 1, 2, COQUE[3])
      p.rect(bx + 2, by - 3, 1, 2, COQUE[3])
      p.rect(bx - 1, by - 4, 3, 1, COQUE[3])
      p.rect(bx, by + 1, 1, 2, encre)
    } else if (etat === 'acquis' && n.sorte === 'piece' && !possede(hangar, n.piece ?? '')) dessinerUnCredit(p, bx, by)
    else if (etat === 'acquis') {
      p.circle(bx, by, 5, encre)
      p.circle(bx, by, 4, RUNE[2])
      for (const [dx, dy] of [[-2, 0], [-1, 1], [0, 0], [1, -1], [2, -2]]) p.rect(bx + dx, by + dy, 1, 2, N.WHITE)
      // un éclat de temps en temps
      const u = (t * 0.3 + x * 0.071 + y * 0.013) % 1
      if (u < 0.1) N.sparkle(p, x + 9, yy - 10, 2 + Math.round(Math.sin((u / 0.1) * Math.PI) * 2), RUNE[3], N.WHITE, 0.9)
    }
    // le déblocage : le nœud blanchit, une onde verte en part
    if (ud < 1) {
      if (ud < 0.3) {
        if (n.sorte === 'piece') p.rect(x - 13, yy - 13, 26, 26, N.WHITE, 1 - ud / 0.3)
        else p.circle(x, yy, 13, N.WHITE, 1 - ud / 0.3)
      }
      p.ring(x, yy, 11 + ud * 28, 2, ud < 0.25 ? N.WHITE : RUNE[3], 1 - ud)
      p.glow(x, yy, 40 * (1 - ud), RUNE[2], 0.6 * (1 - ud))
    }
    if (choisi) {
      // quatre équerres d'or, qui respirent
      const c = Math.sin(t * 5) > -0.3 ? N.hex('#fff2a8') : PEPITE[2]
      const r = 17 + Math.round(Math.abs(Math.sin(t * 2.5)) * 1.5)
      for (const [dx, dy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
        const ax = x + dx * r
        const ay = yy + dy * r
        p.rect(Math.min(ax, ax - dx * 6), ay - (dy < 0 ? 0 : 1), 7, 2, encre)
        p.rect(ax - (dx < 0 ? 0 : 1), Math.min(ay, ay - dy * 6), 2, 7, encre)
        p.rect(Math.min(ax, ax - dx * 5), ay, 6, 1, c)
        p.rect(ax, Math.min(ay, ay - dy * 5), 1, 6, c)
      }
    }
    // (sa zone est coupée à la fenêtre de l'arbre : un nœud à demi sorti ne prend pas les tapes de la barre ou de la fiche)
    const za = Math.max(y - 20, coupeHaut)
    const zb = Math.min(y + 20, coupeBas)
    if (zb - za > 8) zone(x - 20, za, 40, zb - za, () => ((noeudChoisi[n.branche] = n.id), (choixA = t)), choisi ? null : 'clic')
  }
  /**
   * L'ARBRE TIENT TOUTE LA SCÈNE DU LABO : les trois branches en puces en haut (Keko, 11/11 : « mettre la sélection du
   * type de l'arbre dans l'interface de l'arbre lui-même »), les rangs, et LA FICHE DU NŒUD choisi au pied (ce qu'il
   * donne, son coût, « Débloquer »). LES PIÈCES S'ACHÈTENT AU HANGAR (Keko, le même jour : « quand une pièce est
   * débloquée au labo, elle apparaît dans le hangar et le bouton équiper est un bouton acheter avec le prix ; on
   * débloque ainsi de la place au labo ») : le labo n'a plus de menu d'achat.
   */
  const H_INFO = 86
  /**
   * LE COÛT D'UN NŒUD, EN PUCES : le dessin du minerai, le nombre, ET SON NOM (Keko, 11/11 : « marquer la ressource en
   * texte — j'ai peur que ce soit compliqué sans cette indication ») ; rangées en LIGNES — une puce qui dépasse la
   * largeur passe à la ligne d'en dessous (« on crée une autre ligne »), et la fiche du nœud grandit d'autant.
   */
  type PuceDeCout = { k: Minerai; nombre: string; nom: string; w: number }
  function lignesDuCout(n: Noeud): PuceDeCout[][] {
    const cout = coutDe(n)
    const puces = MINERAIS.filter((k) => cout[k] > 0).map((k): PuceDeCout => {
      // (CE QUI MANQUE SE LIT : « ce qu'on a / ce qu'il faut » tant qu'on n'a pas assez — Keko, 12/11 : « je vois que
      // j'ai pas assez dans tech mais je sais pas combien il me manque » ; le souci de place du format X/Y ne se pose
      // pas ici, ce qu'on a étant alors plus petit que le coût ; quand on a assez, le coût seul)
      const nombre = tresor[k] < cout[k] ? `${montantCourt(tresor[k])}/${montantCourt(cout[k])}` : montantCourt(cout[k])
      const nom = FICHES_MINERAI[k].nom
      return { k, nombre, nom, w: largeurDe(nombre, GRAS) + 14 + largeurDe(nom) }
    })
    const lignes: PuceDeCout[][] = [[]]
    let large = 0
    for (const pu of puces) {
      const ligne = lignes[lignes.length - 1]
      if (ligne.length > 0 && large + ECART_DES_PUCES + pu.w > W - 24) {
        lignes.push([pu])
        large = pu.w
      } else {
        large += (ligne.length > 0 ? ECART_DES_PUCES : 0) + pu.w
        ligne.push(pu)
      }
    }
    return lignes
  }
  const ECART_DES_PUCES = 10
  /** Ce que la fiche du nœud choisi prend EN PLUS quand son coût tient sur plusieurs lignes. */
  function surplusDeLInfo(): number {
    const n = noeudDe(noeudChoisi[branche])
    return n !== undefined && etatDuNoeud(n) === 'ouvert' ? (lignesDuCout(n).length - 1) * 12 : 0
  }
  /** La hauteur de l'en-tête de l'arbre : les onglets des branches, puis le bandeau au nom de la branche. */
  const H_BRANCHES = 28
  function dessinerLArbre(p: Peintre, y0: number): void {
    const y1 = y0 + hautScene
    dessinerLesBranches(p, y0)
    // (couchée, la fiche du nœud est dans la colonne de droite : l'arbre a toute la hauteur)
    const hi = paysage ? -2 : H_INFO + surplusDeLInfo()
    // L'ARBRE D'ABORD, dans sa fenêtre ; puis la barre des branches et la fiche du nœud PAR-DESSUS (un nœud à demi sorti
    // de la fenêtre passe dessous — la lumière aussi : on l'éteint sous elles, elle traverse les aplats)
    dessinerLesRangs(p, y0 + H_BRANCHES + 1, y1 - hi - 2)
    eteindre(0, y0, W, y0 + H_BRANCHES + 1)
    dessinerLesBranches(p, y0)
    if (paysage) return
    eteindre(0, y1 - hi - 2, W, y1)
    p.rect(0, y1 - hi - 2, W, hi + 2, N.hex('#0a1626'))
    dessinerLInfoDuNoeud(p, y1 - hi)
  }
  /** Le dessin de chaque branche, sur son onglet. */
  const ICONE_DE_BRANCHE: Record<Branche, string> = { minage: 'forage', combat: 'combat', exploration: 'exploration', commerce: 'commerce' }
  /**
   * LES BRANCHES : UNE BARRE D'ONGLETS, LA MÊME QUE CELLE DU BAS (Keko, 11/11 : d'abord « un peu basiques par rapport à
   * leur rôle, et ça se passe comment quand on rajoute des catégories ? », puis, des onglets soudés à un bandeau :
   * « vraiment pas beau, pas très cohérent niveau style entre les boutons et la zone de texte, et inutile de mettre le
   * nombre de nœuds unlock / total »). Une seule pièce, donc, dans la langue de la barre de navigation : sur un fond de
   * barre, une case par branche — son dessin, son nom dessous —, l'ouverte en or qui se lève, un repère d'or qui glisse
   * jusqu'à elle (la pastille d'or d'une branche où un nœud est payable est retirée — Keko : « c'est pas utile »).
   * QUAND ON AJOUTERA DES BRANCHES : les cases sont égales tant que chaque nom tient dans la sienne (à trois : oui ; dès
   * quatre, « Exploration » ne tient plus) ; sinon l'ouverte prend la largeur de son nom et les autres, réduites à leur
   * dessin, se partagent le reste — 39 px chacune à quatre, 29 à cinq, 23 à six.
   */
  function dessinerLesBranches(p: Peintre, y: number): void {
    dessinerUneBarreDOnglets(p, y, 'branche', BRANCHES.map((b) => ({ nom: NOMS_BRANCHE[b], icone: ICONE_DE_BRANCHE[b] })), BRANCHES.indexOf(branche), (i) => ((branche = BRANCHES[i]), (choixA = t)))
  }
  /**
   * UNE BARRE D'ONGLETS dans une scène (les branches de la tech, les catégories du commerce) : chaque onglet a son
   * dessin et son nom, l'ouvert en or se lève, un repère d'or glisse jusqu'à lui (gardé par barre, sous `cle`).
   */
  const reperesDeBarre: Record<string, number> = {}
  /**
   * CHAQUE ONGLET A SA TEINTE (Keko, 13/11 : « des icônes qui sont surtout des formes — leur donner un peu plus de
   * texture et une couleur propre à chacun, en gardant le basculement dans le jaune quand ils sont sélectionnés ») :
   * les branches de la recherche aux couleurs de leurs missions (le minage cuivre, le combat rouge, l'exploration
   * bleue, le commerce vert), les catégories du commerce à celle de leur matière (la roche brune, le cristal cyan,
   * l'acier de la méca, le vert du bio). Du sombre au clair ; l'onglet ouvert passe à l'or.
   */
  const TEINTES_D_ONGLET: Record<string, [number, number, number]> = {
    forage: [N.hex('#8a4a12'), N.hex('#d9822b'), N.hex('#ffbe6e')],
    combat: [N.hex('#7a2a36'), N.hex('#d0525e'), N.hex('#ff9c8a')],
    exploration: [N.hex('#1f5fa8'), N.hex('#3f9be8'), N.hex('#a6d8ff')],
    commerce: [N.hex('#1c7a48'), N.hex('#35c878'), N.hex('#b4f5c0')],
    tout: [N.hex('#46587a'), N.hex('#9fb4d2'), N.hex('#ffffff')],
    minerai: [N.hex('#5a4632'), N.hex('#a88662'), N.hex('#e6cfa8')],
    cristal: [N.hex('#0a5a6a'), N.hex('#19a0c0'), N.hex('#8ff0ff')],
    meca: [N.hex('#4a3a6a'), N.hex('#8a78c0'), N.hex('#d4c8ff')],
    bio: [N.hex('#2a6a1e'), N.hex('#5ab83a'), N.hex('#c0f590')],
  }
  function dessinerUneBarreDOnglets(p: Peintre, y: number, cle: string, liste: { nom: string; icone: string }[], ia: number, choisir: (i: number) => void): void {
    const h = H_BRANCHES
    const n = liste.length
    p.rect(0, y, W, h, NUIT_BARRE)
    p.rect(0, y + h - 1, W, 1, MATIERES.encre.contour)
    p.rect(0, y + h, W, 1, NUIT_OMBRE)
    // LES LARGEURS : égales tant que CHAQUE NOM tient dans sa case (mesuré dans la police, pas supposé) ; sinon l'ouverte
    // prend la place de son nom et les autres, réduites à leur dessin, se partagent le reste
    const egale = W / n
    const tousLesNoms = liste.every((b) => largeurDe(b.nom) + 6 <= egale)
    const large = tousLesNoms ? egale : Math.max(egale, largeurDe(liste[ia].nom) + 12)
    const etroite = tousLesNoms || n < 2 ? egale : (W - large) / (n - 1)
    const debutDe = (i: number): number => (tousLesNoms ? i * egale : i <= ia ? i * etroite : (i - 1) * etroite + large)
    liste.forEach((b, i) => {
      const actif = i === ia
      const xa = Math.round(debutDe(i))
      const xb = Math.round(debutDe(i + 1))
      const cx = Math.round((xa + xb) / 2)
      const e = etatDuBouton(xa, y, xb - xa, h)
      const dy = -Math.round(rebond(`${cle}-${i}`, actif ? 1 : 0) * 2) + e.dy
      if (e.survole && !actif) p.rect(xa + 2, y + 2, xb - xa - 4, h - 5, N.hex('#19152a'))
      if (actif) p.glow(cx, y + 10, 20, PEPITE[2], 0.2)
      const nomme = tousLesNoms || actif
      const yi = y + (nomme ? 10 : 14) + dy
      dessinerLeGlyphe(p, b.icone, cx, yi, actif ? [N.hex('#dea01e'), PEPITE[2], N.hex('#fff2a8')] : (TEINTES_D_ONGLET[b.icone] ?? [COQUE[2], COQUE[4], COQUE[5]]), 2, true) // (le sombre de l'or tout près de l'or : un brun y semait des grains noirs — Keko : « son haut devient pixelisé bizarrement »)
      if (nomme) ecrire(p, b.nom, cx, y + 18 + dy, actif ? PEPITE[3] : (TEINTES_D_ONGLET[b.icone]?.[2] ?? COQUE[4]), { align: 'center' })
      if (!actif) zone(xa, y, xb - xa, h, () => choisir(i), 'onglet')
    })
    const cible = (debutDe(ia) + debutDe(ia + 1)) / 2
    const rx = (reperesDeBarre[cle] = reperesDeBarre[cle] === undefined ? cible : ressort(reperesDeBarre[cle], cible, 18))
    p.rect(Math.round(rx - 12), y + h - 2, 24, 2, PEPITE[2])
    p.rect(Math.round(rx - 8), y + h - 2, 16, 1, N.hex('#fff2a8'))
    p.glow(Math.round(rx), y + h - 2, 12, PEPITE[2], 0.35)
  }
  /**
   * LES RANGS DE LA BRANCHE, DANS UNE FENÊTRE QUI DÉFILE (Keko, 11/11 : « si on rajoute des tiers 4, 5, 6, on fait
   * comment pour avancer dans l'arbre ? ») — et REFAITS (« beaucoup d'espace vide, les connexions très très fines ») :
   *
   * - LE PRIX D'UN NŒUD N'EST PAS DANS L'ARBRE : il est dans sa fiche, au pied (Keko, 11/11 — d'abord des bandeaux « Rang N »
   *   au coût commun : « pas sûr que marquer les paliers comme ça soit une bonne idée, je veux des prix individuels » ;
   *   puis une étiquette sous chaque nœud : « ne mets pas les coûts dans l'arbre, dans la description ça suffit ») ;
   * - LES CONDUITS sont épais (cinq pixels : cernés d'encre, un cœur clair) : de la source au premier rang, puis de
   *   CHAQUE nœud au rang d'après. Un rang ouvert est sous tension, immobile ; SEUL LE CHEMIN QUI MÈNE AUX NŒUDS
   *   DÉBLOQUÉS brille et s'anime — des grains de lumière y descendent ;
   * - les rangs font 56 px, l'arbre se centre dans la fenêtre ; s'ils la dépassent, on fait glisser l'arbre au doigt
   *   (la molette sur PC) — la barre des branches et la fiche du nœud ne bougent pas ; un fondu aux bords, une barre à
   *   droite. Le défilement est gardé par branche.
   */
  const PAS_DES_RANGS = 46
  const defilDeLArbre: Record<Branche, number> = { minage: 0, combat: 0, exploration: 0, commerce: 0 }
  let zoneDeLArbre: { x: number; y: number; w: number; h: number } | null = null
  let coupeHaut = 0
  let coupeBas = 0
  function dessinerLesRangs(p: Peintre, ya: number, yb: number): void {
    const PLAN = N.hex('#0a1626')
    const fenetre = yb - ya
    const n = RANGS.length
    // (les rangs ont UNE hauteur, ils ne s'étirent plus pour remplir la fenêtre — Keko, 11/11 : « diminuer un peu la
    // hauteur des liens entre les étages » ; l'arbre, plus court qu'elle, s'y centre)
    const pas = PAS_DES_RANGS
    const total = n * pas + 8
    const marge = Math.max(0, Math.floor((fenetre - total) / 2))
    const maxD = Math.max(0, Math.round(total - fenetre))
    defilDeLArbre[branche] = Math.max(0, Math.min(maxD, defilDeLArbre[branche]))
    const d = Math.round(defilDeLArbre[branche])
    zoneDeLArbre = maxD > 0 ? { x: 0, y: ya, w: W, h: fenetre } : null
    coupeHaut = ya
    coupeBas = yb
    /** Un rectangle, coupé à la fenêtre. */
    const coupe = (x: number, y: number, w: number, h: number, c: number): void => {
      const a = Math.max(y, ya)
      const b = Math.min(y + h, yb)
      if (b > a && w > 0) p.rect(x, a, w, b - a, c)
    }
    /**
     * UN CONDUIT, vertical (x, de y0 à y1) ou horizontal (y, de x0 à x1) : cerné d'encre, un corps, un cœur. TROIS ÉTATS
     * (Keko, 11/11 : « on ne devrait animer le chemin que sur les portions débloquées, non ? ») : 0, éteint (le rang est
     * fermé) ; 1, sous tension mais IMMOBILE (le rang est ouvert, le nœud au bout ne l'est pas) ; 2, ACTIF — le chemin
     * qui relie la source aux nœuds débloqués : lui seul brille, et des grains de lumière le parcourent.
     */
    type Etat = 0 | 1 | 2
    // DES PISTES DE CIRCUIT IMPRIMÉ, PLUS DE LA TUYAUTERIE (Keko, 13/11 : les liens épais, cernés, à raccords, « font
    // un peu tuyauterie, plomberie ; j'aurais préféré quelque chose qui rappelle un circuit imprimé, quelque chose
    // d'informatique ou de digital ») : chaque lien est UNE PAIRE DE PISTES FINES, d'un pixel, côte à côte — un bus de
    // données ; éteintes, elles sont du cuivre terne ; sous tension, bleues ; actives, cyan vif, et DES BITS y
    // courent (des tirets clairs, espacés, décalés d'une piste à l'autre). Les rencontres sont des PASTILLES percées.
    const piste = (e: Etat): number => (e === 2 ? N.hex('#6fe6ff') : e === 1 ? N.hex('#2f6f9c') : N.hex('#33415a'))
    const BIT = N.hex('#f2fdff')
    const conduitV = (x: number, y0: number, y1: number, e: Etat): void => {
      if (y1 <= y0) return
      // (UNE SEULE PISTE — Keko, 13/11, à l'essai : « la même, mais juste une ligne au lieu de deux »)
      for (const [dx, phase] of [[0, 0]]) {
        coupe(x + dx, y0, 1, y1 - y0, piste(e))
        if (e === 2) for (let yp = y0 + ((t * 40 + phase) % 14); yp < y1 - 1; yp += 14) coupe(x + dx, Math.round(yp), 1, 2, BIT)
      }
      if (e !== 2) return
      const a = Math.max(y0, ya + 3)
      const b = Math.min(y1, yb - 3)
      if (b > a) p.glowLine(x, a, x, b, 3, N.hex('#3ab0e0'), 0.14)
    }
    const conduitH = (y: number, x0: number, x1: number, e: Etat): void => {
      if (x1 < x0) return
      for (const [dy, phase] of [[0, 0]]) {
        coupe(x0, y + dy, x1 - x0 + 1, 1, piste(e))
        if (e !== 2 || x1 === x0) continue
        // (les bits partent du milieu vers les deux bouts)
        const mx = (x0 + x1) / 2
        for (let o = (t * 40 + phase) % 14; o < (x1 - x0) / 2; o += 14) {
          for (const xp of [mx - o, mx + o]) if (xp >= x0 && xp <= x1 - 1) coupe(Math.round(xp), y + dy, 2, 1, BIT)
        }
      }
      if (e === 2 && x1 > x0 && y > ya + 3 && y < yb - 3) p.glowLine(x0, y, x1, y, 3, N.hex('#3ab0e0'), 0.14)
    }
    const cx = Math.round(W / 2)
    const rangs = RANGS.map((r, k) => {
      const noeuds = noeudsDe(branche, r)
      const ecart = Math.min(36, (W - 12) / noeuds.length)
      const haut = Math.round(ya + 4 + marge + pas * k - d)
      return { r, haut, bus: haut + 5, y: haut + 25, ouvert: rangOuvert(labo, branche, r), places: noeuds.map((nd, i) => ({ n: nd, x: Math.round(cx + (i - (noeuds.length - 1) / 2) * ecart) })) }
    })
    // LES CONDUITS : la source nourrit le premier rang, chaque nœud le rang d'après. Le rang ouvert, tout y est sous
    // tension ; n'est ACTIF que ce qui mène à un nœud débloqué — sa descente, le bout de bus qui la relie à ce qui
    // l'alimente, et la sortie du nœud d'au-dessus qui l'alimente
    rangs.forEach((rg, k) => {
      const base: Etat = rg.ouvert ? 1 : 0
      const acquis = rg.places.filter((pl) => estDebloque(labo, pl.n.id))
      const vivant = acquis.length > 0
      const dessus = k === 0 ? [{ x: cx, y: ya - 2, source: true }] : rangs[k - 1].places.map((pl) => ({ x: pl.x, y: rangs[k - 1].y, source: estDebloque(labo, pl.n.id) }))
      const etatDe = (a: { source: boolean }): Etat => (a.source ? (vivant ? 2 : 1) : 0)
      for (const a of dessus) conduitV(a.x, a.y, rg.bus, etatDe(a))
      const xs = [...dessus.map((a) => a.x), ...rg.places.map((pl) => pl.x)]
      conduitH(rg.bus, Math.min(...xs), Math.max(...xs), base)
      const actifs = vivant ? [...dessus.filter((a) => a.source).map((a) => a.x), ...acquis.map((pl) => pl.x)] : []
      if (actifs.length > 0) conduitH(rg.bus, Math.min(...actifs), Math.max(...actifs), 2)
      for (const pl of rg.places) conduitV(pl.x, rg.bus, rg.y, estDebloque(labo, pl.n.id) ? 2 : base)
      // (plus de pastilles aux rencontres — Keko, 13/11 : « enlève les ronds dans les angles » ; les pistes se croisent nues)
    })
    for (const rg of rangs) {
      if (rg.y + 20 < ya || rg.y - 20 > yb) continue
      for (const pl of rg.places) {
        placesDesNoeuds[pl.n.id] = { x: pl.x + ORIGINE.x, y: rg.y } // (à l'écran : la fiche, couchée, est dans une autre fenêtre)
        dessinerUnNoeud(p, pl.n, pl.x, rg.y, noeudChoisi[branche] === pl.n.id)
      }
    }
    // l'arbre continue : un fondu au bord, et la barre de défilement
    if (d > 0) for (let k = 0; k < 6; k++) p.rect(0, ya + k, W, 1, PLAN, 0.85 - k * 0.14)
    if (d < maxD) for (let k = 0; k < 6; k++) p.rect(0, yb - 1 - k, W, 1, PLAN, 0.85 - k * 0.14)
    if (maxD > 0) {
      const hg = fenetre - 8
      const hc = Math.max(10, Math.round((hg * fenetre) / total))
      const yc = ya + 4 + Math.round(((hg - hc) * d) / maxD)
      p.rect(W - 3, ya + 4, 2, hg, N.hex('#0e1f34'))
      p.rect(W - 3, yc, 2, hc, COQUE[3])
      p.rect(W - 3, yc, 2, 1, COQUE[5])
    }
  }
  /** LA FICHE DU NŒUD choisi, au pied de l'arbre : son nom, ce qu'il donne, puis son coût en minerai et « Débloquer » — ou ce qu'il est devenu. */
  function dessinerLInfoDuNoeud(p: Peintre, y: number): void {
    const n = noeudDe(noeudChoisi[branche])
    if (n === undefined) return
    const etat = etatDuNoeud(n)
    const surplus = surplusDeLInfo()
    const ox = ORIGINE.x
    const milieu = W / 2
    const h = H_INFO - 4 + surplus
    plaque(p, 4, y, W - 8, h, 'encre')
    motEnRelief(p, n.nom, W / 2, y + 5, etat === 'acquis')
    const L = replier(n.dit, W - 20).slice(0, 3)
    const hautDuTexte = y + 16 + Math.floor(((3 - L.length) * 9) / 2)
    L.forEach((li, i) => ecrire(p, li, W / 2, hautDuTexte + i * 9, COQUE[5], { align: 'center' }))
    // (deux lignes au pied : LE COÛT, puis LE BOUTON dessous — Keko : « une ligne avec les coûts et en dessous la ligne
    // avec le bouton, pour éviter la ligne trop large »)
    const ya = y + h - 33 - surplus
    const yb = y + h - 19
    const pc = n.sorte === 'piece' ? pieceDe(n.piece ?? '') : undefined
    if (etat === 'ferme') ecrire(p, `Demande un noeud du rang ${n.rang - 1}`, W / 2, ya + 8, COQUE[4], { align: 'center' })
    else if (etat === 'ouvert') {
      // CE QU'IL FAUT, par minerai — vert quand on l'a, rouge sinon ; ce qu'on a ne s'écrit à côté QUE S'IL EN MANQUE
      // (Keko : « en format X/Y, si le joueur a beaucoup de la ressource, on va avoir un souci de place »)
      const cout = coutDe(n)
      const bw = largeurDe('Débloquer', GRAS) + 22
      lignesDuCout(n).forEach((ligne, li) => {
        let xc = Math.round((W - ligne.reduce((a, pu) => a + pu.w, 0) - (ligne.length - 1) * ECART_DES_PUCES) / 2)
        const yl = ya + li * 12
        for (const pu of ligne) {
          const a = tresor[pu.k] >= cout[pu.k]
          const wn = largeurDe(pu.nombre, GRAS)
          // (LE NOMBRE, PUIS L'ICÔNE, PUIS LE NOM — Keko, 12/11 : « X/Y icône nom plutôt qu'icône X/Y nom »)
          ecrire(p, pu.nombre, xc, yl, a ? RUNE[3] : ROUGE[5], { police: GRAS })
          dessinerUneRessource(p, xc + wn + 7, yl + 4, pu.k)
          ecrire(p, pu.nom, xc + wn + 14, yl, a ? RUNE[2] : ROUGE[4])
          xc += pu.w + ECART_DES_PUCES
        }
      })
      bouton(p, Math.round(W / 2 - bw / 2), yb, bw, 15, 'Débloquer', peutDebloquer(labo, tresor, n.id), () => {
        const r = debloquer(labo, tresor, n.id)
        if (r === null) return
        labo = r.labo
        tresor = r.tresor
        compter('noeuds', 1)
        sauver()
        debloqueA = t
        debloqueId = n.id
        secouer(1.2)
        const vu = placesDesNoeuds[n.id]
        const ou = vu === undefined ? { x: milieu, y: Y_SCENE + 60 } : { x: vu.x - ox, y: vu.y }
        gerbe(ou.x, ou.y, 26, [RUNE[2], RUNE[3], PEPITE[3], N.WHITE], 80)
        flottants.push({ texte: 'Débloqué !', x: ou.x, y: ou.y - 18, t0: t, c: RUNE[3] })
        // (une pièce : elle attend au hangar, dont l'onglet saute et prend sa pastille)
        if (pc !== undefined) {
          pulsations.hangar = t
          nouveautes.add('hangar')
        }
      }, 'achat')
    } else if (pc !== undefined && !possede(hangar, pc.id)) {
      // une pièce débloquée : elle est en vente au hangar — « Voir » y mène, sur elle
      const bw = largeurDe('Voir', GRAS) + 22
      ecrire(p, 'En vente au hangar', W / 2, ya, RUNE[2], { align: 'center' })
      bouton(p, Math.round(W / 2 - bw / 2), yb, bw, 15, 'Voir', true, () => {
        allerA('hangar')
        sousCategorie[pc.sorte] = null
        ouvrirLEmplacement(pc.sorte, pc.sorte === 'arme' || pc.sorte === 'outil' ? 0 : -1)
        choix[pc.sorte] = pc.id
        choixA = t
      })
    } else {
      const mot = pc !== undefined ? 'Acheté : la pièce est au hangar' : n.sorte === 'passif' ? 'Acquis : actif sur tous vos vaisseaux' : n.mecanique === 'postcombustion' ? 'Acquis : disponible en vol' : 'Acquis : visible au commerce'
      ecrire(p, mot, W / 2, ya + 8, RUNE[2], { align: 'center' })
    }
  }

  /** ACHETER une pièce débloquée au labo (au hangar, à la place d'« Équiper ») : le bouton, son prix et l'icône des crédits. */
  function dessinerLAchat(p: Peintre, y: number, pc: Piece): void {
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
      if (vue !== 'hangar') envolsDePiece.push({ pc, x0: W / 2, y0: y + 40, t0: t + 0.1 }) // (au hangar, elle y est déjà)
      flottants.push({ texte: 'Acheté !', x: W / 2, y: y - 14, t0: t, c: PEPITE[3] })
    }, (dx, dy) => {
      if (vif) motEnRelief(p, 'Acheter', bx + 8 + wa / 2 + dx, y + 4 + dy, true)
      else ecrire(p, 'Acheter', bx + 8 + dx, y + 4 + dy, COQUE[3], { police: GRAS })
      const px = bx + 8 + wa + 5 + dx
      plaque(p, px, y + 2 + dy, wp, 11, 'creux')
      ecrire(p, String(pc.prix), px + 4, y + 4 + dy, vif ? N.hex('#fff2c8') : COQUE[4], { police: GRAS })
      dessinerUnCredit(p, px + 4 + wn + 7, y + 7 + dy)
    }, 'achat')
  }

  /** La hauteur que prendra la fiche d'une pièce (son bouton, sa plaque, sa note) : la liste s'y ajuste. */
  function hauteurDeLaFiche(pc: Piece | undefined): number {
    if (pc === undefined) return 0
    const note = pc.note === undefined ? 0 : replier(pc.note, W - 22).length
    return 19 + Math.max(52, 18 + jaugesDe(pc).length * 10 + 4) + (note > 0 ? note * 9 + 6 : 0)
  }
  /** LA FICHE d'une pièce : son bouton, puis ses stats (la pièce rendue dans son puits, le nom, les jauges, la note). */
  function dessinerLaFiche(p: Peintre, y0: number, pc: Piece, resume = false): void {
    let y = y0
    const lb = (mot: string): number => largeurDe(mot, GRAS) + 22
    const ko = placeOuverte()
    if (resume) {
      // (sur la page de la place : la pièce équipée, et « Changer », qui ouvre le panneau de toutes les pièces)
      // (PAS DE BOUTON tant qu'il n'y a RIEN D'AUTRE à équiper ou à acheter — Keko, 12/11 ; la fiche remonte à sa place)
      // (le châssis l'a toujours : sa couleur se choisit dans le panneau ; un outil ou une arme aussi, même seuls de
      // leur sorte : c'est dans le panneau qu'on les RETIRE — Keko, 12/11)
      const aChanger = onglet === 'outil' || onglet === 'arme' || piecesDe(onglet).some((x) => x.id !== pc.id && (possede(hangar, x.id) || pieceOuverte(labo, x.id)))
      if (aChanger) {
        const bw = lb('Changer')
        bouton(p, W / 2 - bw / 2, y, bw, 15, 'Changer', true, ouvrirLeChangement, 'ouvre')
      }
      // LA COULEUR DU CHÂSSIS : son bouton est ICI, sur la page du châssis, à gauche de « Changer » (Keko, 12/11 : dans le
      // panneau, il se superposait à « Acheter », plus large qu'« Équiper ») ; il porte la pastille de la couleur choisie
      // et ouvre la grille des couleurs
      if (onglet === 'coque') {
        const bc = 5 + 9 + 4 + textWidth('COULEUR', 'mini') + 5
        boutonBase(p, 4, y, bc, 15, true, () => ((couleursOuvertes = true), (couleursA = t)), (dx, dy) => {
          const [sombre, moyen, clair] = tonsDeLaLivree(livree)
          p.rect(4 + 5 + dx, y + 3 + dy, 9, 9, MATIERES.encre.contour)
          p.rect(4 + 6 + dx, y + 4 + dy, 7, 7, moyen)
          p.rect(4 + 6 + dx, y + 4 + dy, 7, 2, clair)
          p.rect(4 + 6 + dx, y + 9 + dy, 7, 2, sombre)
          p.text('COULEUR', 4 + 18 + dx, y + 5 + dy, N.hex('#fff3cf'))
        }, 'ouvre', { matiere: 'acier' })
      } else if (!aChanger) y -= 19
    } else if (ko >= 0 && possede(hangar, pc.id) && listeMontee(onglet)[ko] !== pc.id) {
      const bw = lb('Équiper')
      bouton(p, W / 2 - bw / 2, y, bw, 15, 'Équiper', true, () => {
        hangar = monterA(hangar, pc.id, ko)
        sauver()
        changement = false
        feterLEquipement()
      }, 'equipe')
    } else if (estMontee(hangar, pc.id)) {
      if (pc.sorte === 'arme' || pc.sorte === 'outil') {
        const bw = lb('Retirer')
        bouton(p, W / 2 - bw / 2, y, bw, 15, 'Retirer', true, () => {
          hangar = ko >= 0 ? demonterA(hangar, pc.sorte as 'arme' | 'outil', ko) : demonter(hangar, pc.id)
          sauver()
          changement = false
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
        changement = false
        feterLEquipement()
      }, 'equipe')
    } else {
      // (débloquée au labo, pas encore achetée : « Acheter » à la place d'« Équiper »)
      dessinerLAchat(p, y, pc)
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
      const dit = j.unite === undefined ? String(j.valeur) : `${j.valeur} ${j.unite}`
      motEnRelief(p, dit, bx + largeurDe(dit, TEXTE) / 2, y - 1, 'ivoire', TEXTE)
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
    if (ressourcesVues().length === 0) {
      // (une catégorie vide — la méca et le bio, pour l'instant)
      plaque(p, 4, y, W - 8, 40, 'encre')
      motEnRelief(p, NOMS_DE_CATEGORIE[categorie], W / 2, y + 8, false)
      ecrire(p, 'Aucune ressource pour l’instant', W / 2, y + 23, COQUE[4], { align: 'center' })
      return y + 44
    }
    // (la ressource choisie est toujours une ressource montrée)
    if (!ressourcesVues().includes(mineraiChoisi)) mineraiChoisi = ressourcesVues()[0]
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
    // LE COURS du moment (il bouge : le marché) et le stock ; les ordres posés sont SOUS la fiche
    ecrire(p, 'Cours', 10, ly, COQUE[4])
    dessinerLeCours(p, k, W - 9, ly)
    ecrire(p, 'En stock', 10, ly + 12, COQUE[4])
    ecrire(p, montantCourt(tresor[k]), W - 21, ly + 12, tresor[k] > 0 ? N.WHITE : COQUE[3], { police: GRAS, align: 'right' })
    dessinerUneRessource(p, W - 13, ly + 15, k)
    const by = ly + 26
    const vif = tresor[k] > 0
    const mot = vif ? 'Vendre' : 'Rien à vendre'
    const bw = largeurDe(mot, GRAS) + 22
    bouton(p, Math.round(W / 2 - bw / 2), by, bw, 15, mot, vif, () => ouvrirLaVente(k), 'ouvre', 'vert')
    dessinerLesOrdres(p, y + hp + 5, k)
    return y + hp + 4
  }
  // ================================================================ LES PARAMÈTRES
  /**
   * L'ONGLET DES PARAMÈTRES (Keko, 12/11 : « ajouter un onglet paramètres dans autres onglets, et permettre de régler si
   * le joueur veut le déplacement à gauche ou à droite — et l'orientation / les capacités de l'autre côté ») : une carte
   * par réglage. LE CÔTÉ DU VOL : deux touches, « Gauche » et « Droite » (la choisie en or), et un petit écran dessiné
   * qui montre les deux moitiés — le manche d'un côté, le regard et les capacités de l'autre.
   */
  function dessinerLesReglages(p: Peintre, y0: number): void {
    // (le petit écran est PLUS LARGE — « VISE » touchait ses bords — et les lignes du texte ont un pixel d'air de plus :
    // le p de « posez » touchait le L de « L'orientation » — Keko, 12/11)
    const EW = 52
    const lignes = replier('Sur téléphone : le côté de l’écran où vous posez le pouce qui vole. L’orientation et les capacités sont de l’autre côté.', W - 20 - EW - 6)
    const h = Math.max(96, 17 + lignes.length * 11 + 6 + 22)
    plaque(p, 4, y0, W - 8, h, 'encre')
    motEnRelief(p, 'Déplacement', 10 + largeurDe('Déplacement', GRAS) / 2, y0 + 5, true)
    lignes.forEach((li, i) => ecrire(p, li, 10, y0 + 17 + i * 11, COQUE[5]))
    // le petit écran : ses deux moitiés
    const ex = W - 8 - EW - 2
    const ey = y0 + 6
    plaque(p, ex, ey, EW, 56, 'creux')
    p.rect(ex + EW / 2, ey + 3, 1, 50, MATIERES.encre.lumiere2)
    const aGauche = reglages.vol === 'gauche'
    const xv = ex + Math.round(aGauche ? EW / 4 : (EW * 3) / 4)
    const xr = ex + Math.round(aGauche ? (EW * 3) / 4 : EW / 4)
    // (le manche du vol : un anneau gris et son pouce ; le regard : un anneau bleu plus petit)
    p.ring(xv, ey + 38, 7, 1, COQUE[4])
    p.circle(xv + 1, ey + 36, 2, COQUE[6])
    p.ring(xr, ey + 38, 5, 1, VERRIERE[1])
    p.circle(xr - 1, ey + 37, 1, VERRIERE[3])
    p.text('VOL', xv, ey + 9, COQUE[5], { align: 'center' })
    p.text('VISE', xr, ey + 9, VERRIERE[2], { align: 'center' })
    // les deux touches
    const bw = 52
    const yb = y0 + h - 22
    for (const [i, cote] of (['gauche', 'droite'] as const).entries()) {
      const x = Math.round(W / 2 - bw - 2 + i * (bw + 4))
      const choisi = reglages.vol === cote
      bouton(p, x, yb, bw, 16, cote === 'gauche' ? 'Gauche' : 'Droite', true, () => {
        if (choisi) return
        reglages = { vol: cote }
        sauverReglages(reglages)
      }, choisi ? null : 'equipe', choisi ? 'or' : 'acier')
    }
  }

  // ================================================================ LES QUÊTES
  /**
   * L'ONGLET DES QUÊTES (Keko, 11/11 — la règle est dans `logic/vaisseau/quetes.ts`) : une carte par quête active —
   * le symbole de son activité (une étoile pour le tutoriel), son titre, sa récompense en crédits, ce qu'elle demande,
   * et sa barre d'avancée. Terminée, la carte se borde d'or et porte « Réclamer » : les crédits volent au compteur, la
   * quête suivante prend sa place, et l'onglet qu'elle ouvre saute dans la barre du bas.
   */
  const ICONE_D_ACTIVITE: Record<Activite, string> = { minage: 'forage', combat: 'combat', exploration: 'exploration', commerce: 'commerce' }
  /**
   * LA CARTE D'UNE MISSION, REFAITE (Keko, 12/11 : « la récompense à droite du titre va poser un souci quand le titre
   * est trop long — il faudrait que le titre puisse prendre deux lignes ; de plus le texte en dessous s'arrête d'un
   * coup, plus de place ; rework tout ça pour un rendu bien lisible et beau »). LA CARTE A LA HAUTEUR DE SON TEXTE :
   * en haut, le symbole dans son puits, LE TITRE sur toute la largeur (deux lignes au besoin) et CE QU'ELLE DEMANDE en
   * entier, replié ; un filet ; AU PIED, la barre d'avancée, son compte, et LA RÉCOMPENSE dans un puits à droite — la
   * place qu'elle prenait au titre lui est rendue. Terminée, le pied devient « Réclamer », la récompense dans le bouton.
   */
  /** (elle suit la fenêtre : couchées, les cartes sont plus larges que debout) */
  const largeurDuTexteDeMission = (): number => W - 32 - 10
  /**
   * LA COULEUR D'UNE MISSION (Keko, 12/11 : « les boîtes de quête manquent de couleur », et le filet sombre sous le
   * texte « se voit très mal, foncé sur fond foncé ») : chaque activité a SA TEINTE — le minage cuivre, le combat rouge,
   * l'exploration bleue, le commerce vert, le tutoriel doré — du sombre au clair ; elle prend le liseré de gauche, le
   * symbole et la lueur de son puits, le titre, le filet et la barre d'avancée. Terminée, la carte passe à l'or.
   */
  const TEINTES_D_ACTIVITE: Record<Activite | 'tuto', [number, number, number]> = {
    minage: [N.hex('#8a4a12'), N.hex('#d9822b'), N.hex('#ffbe6e')],
    combat: [ROUGE[2], ROUGE[4], N.hex('#ff9c8a')],
    exploration: [N.hex('#1f5fa8'), N.hex('#3f9be8'), N.hex('#a6d8ff')],
    commerce: [RUNE[1], RUNE[2], N.hex('#b4f5c0')],
    // (le tutoriel en OR — Keko, 12/11 : « jaune / doré, différent des quêtes du pool » ; le violet d'abord essayé)
    tuto: [N.hex('#a8650f'), PEPITE[2], N.hex('#fff2a8')],
  }
  /**
   * LE PIED D'UNE CARTE, en deux rangées sous le filet (Keko, 12/11 : « on devrait mettre toutes les récompenses —
   * crédits, ressources, déblocage — sous la jauge de progression ») : LA JAUGE sur toute la largeur avec son compte
   * (terminée : « Réclamer » à sa place), puis LES RÉCOMPENSES, toutes ensemble, de gauche à droite — les crédits dans
   * leur puits, puis l'onglet débloqué (son icône, son nom en or). Leurs hauteurs :
   */
  const piedDeLaMission = (mo: { ouvre?: string }, fini: boolean): { jauge: number; lots: number } => ({ jauge: fini ? 15 : 9, lots: mo.ouvre === undefined ? 11 : 15 })
  function hauteurDeLaMission(mo: { titre: string; dit: string; ouvre?: string; etapes?: unknown[] }, fini: boolean): number {
    const nt = Math.min(2, replier(mo.titre, largeurDuTexteDeMission(), GRAS).length)
    const nd = replier(mo.dit, largeurDuTexteDeMission()).length
    const pied = piedDeLaMission(mo, fini)
    return 5 + Math.max(20, nt * 10 + 1 + nd * 9 + (mo.etapes === undefined ? 0 : 3 + mo.etapes.length * 10)) + 6 + pied.jauge + 3 + pied.lots + 4
  }
  /**
   * LES CARTES DÉFILENT quand elles ne tiennent pas toutes (leur hauteur suit leur texte) : au doigt ou à la molette,
   * UNE CARTE À LA FOIS — celle du haut est toujours entière, celle du bas passe sous la barre des onglets ; une barre
   * à droite dit où l'on est.
   */
  const PAS_DES_MISSIONS = 55
  let defilMissions = 0
  let zoneDesMissions: { x: number; y: number; w: number; h: number } | null = null
  /** LA COLONNE EN COURS (couchées, les missions se rangent en grille de deux colonnes : une carte sur deux dans chacune). */
  let partDesMissions = { col: 0, cols: 1 }
  function dessinerLesQuetes(p: Peintre, y0: number): void {
    const bas = H - HAUT_NAV - 2
    // (le milieu DE LA FENÊTRE, retenu au dessin : à l'heure d'une action, `W` est celui de l'écran)
    const milieu = W / 2
    // UNE SEULE GRILLE (Keko, 13/11 : « pourquoi ne pas les mettre dans un seul grid — deux colonnes — et permettre le
    // scroll vers le bas de l'ensemble, plutôt que chaque colonne indépendamment ? ») : les cartes se rangent PAR
    // RANGÉES de `cols`, une rangée a la hauteur de sa plus haute carte, et c'est la grille entière qui défile, une
    // rangée à la fois — une seule barre, à droite de la dernière colonne. Chaque colonne est dessinée dans sa fenêtre.
    const { col, cols } = partDesMissions
    const barreIci = col === cols - 1
    const hauteurs: number[] = []
    quetes.actives.forEach((q, i) => {
      const mo = modeleDe(q.modele)
      const h = mo === undefined ? 0 : hauteurDeLaMission(mo, estTerminee(q)) + 3
      const r = Math.floor(i / cols)
      hauteurs[r] = Math.max(hauteurs[r] ?? 0, h)
    })
    // (jusqu'où défiler : la première rangée à partir de laquelle tout le reste tient)
    let maxD = 0
    while (maxD < hauteurs.length - 1 && hauteurs.slice(maxD).reduce((a, b) => a + b, 0) - 3 > bas - y0) maxD += 1
    defilMissions = Math.max(0, Math.min(maxD, defilMissions))
    const d = Math.round(defilMissions)
    if (maxD > 0) {
      const hg = bas - y0
      if (barreIci) {
        const hc = Math.max(8, Math.round((hg * (hauteurs.length - maxD)) / hauteurs.length))
        p.rect(W - 3, y0, 2, hg, MATIERES.creux.contour)
        p.rect(W - 3, y0 + Math.round(((hg - hc) * defilMissions) / maxD), 2, hc, COQUE[3])
      }
      // (la zone qui défile couvre toute la grille : posée par la première colonne, large de toutes)
      if (col === 0) zoneDesMissions = { x: 0, y: y0, w: W * cols, h: hg }
    }
    quetes.actives.forEach((q, i) => {
      const mo = modeleDe(q.modele)
      const rang = Math.floor(i / cols)
      if (mo === undefined || i % cols !== col || rang < d) return
      const fini = estTerminee(q)
      const h = hauteurDeLaMission(mo, fini)
      const haut = y0 + hauteurs.slice(d, rang).reduce((x, y) => x + y, 0)
      if (haut >= bas) return
      const age = t - vueA - i * 0.05
      if (age < 0) return
      const y = haut + Math.round((1 - sortie(age / 0.2)) * 4)
      // (UNE MISSION TERMINÉE GARDE SA COULEUR — Keko, 12/11 : « ne change pas la couleur d'une mission quand elle est
      // terminée » ; elle passait à l'or : son liseré et sa lueur sont à la teinte de son activité)
      const T: [number, number, number] = TEINTES_D_ACTIVITE[mo.activite ?? 'tuto']
      if (fini && y + h <= bas) p.glow(W / 2, y + h / 2, 70, T[1], 0.07 + 0.05 * Math.sin(t * 4))
      plaque(p, 4, y, W - (maxD > 0 && barreIci ? 10 : 8), h, 'encre', { bord: fini ? T[1] : undefined, flash: age < 0.07 })
      // (le liseré de gauche, à la teinte de l'activité)
      p.rect(5, y + 2, 2, h - 4, T[1])
      p.rect(5, y + 2, 1, h - 4, T[2])
      plaque(p, 9, y + 5, 20, 20, 'creux')
      p.glow(19, y + 15, 13, T[1], 0.3)
      dessinerLeGlyphe(p, mo.activite === undefined ? 'tuto' : ICONE_D_ACTIVITE[mo.activite], 19, y + 15, T)
      const titre = replier(mo.titre, largeurDuTexteDeMission(), GRAS).slice(0, 2)
      titre.forEach((li, k) => ecrire(p, li, 32, y + 5 + k * 10, T[2], { police: GRAS }))
      const dit = replier(mo.dit, largeurDuTexteDeMission())
      dit.forEach((li, k) => ecrire(p, li, 32, y + 5 + titre.length * 10 + 1 + k * 9, COQUE[5]))
      // SES ÉTAPES, s'il y en a : une case par étape — vide, ou verte et cochée ; celle qu'on vient de faire s'allume
      if (mo.etapes !== undefined) {
        const faites = etapesFaites(q)
        mo.etapes.forEach((et, j) => {
          const ye = y + 5 + titre.length * 10 + 1 + dit.length * 9 + 3 + j * 10
          const faite = faites[j]
          p.rect(32, ye, 7, 7, MATIERES.encre.contour)
          p.rect(33, ye + 1, 5, 5, faite ? RUNE[2] : MATIERES.creux.corps)
          if (faite) {
            // (la coche : deux traits clairs)
            p.rect(34, ye + 3, 1, 2, N.WHITE)
            p.rect(35, ye + 4, 1, 1, N.WHITE)
            p.rect(36, ye + 2, 1, 2, N.WHITE)
            const da = t - (etapeFaiteA[`${q.modele}-${j}`] ?? -10)
            if (da < 0.6) {
              p.glow(35, ye + 3, 9, RUNE[3], 0.8 * (1 - da / 0.6))
              N.sparkle(p, 35, ye + 3, 1 + 3 * Math.sin((da / 0.6) * Math.PI), N.WHITE, RUNE[3], 0.6)
            }
          }
          ecrire(p, et.dit, 43, ye - 1, faite ? N.hex('#b4f5c0') : COQUE[5])
        })
      }
      // LE PIED, sous un filet (à la teinte de l'activité, clair sur le sombre de la carte — un pointillé)
      const pied = piedDeLaMission(mo, fini)
      const xd = W - (maxD > 0 && barreIci ? 12 : 10)
      const yj = y + h - 4 - pied.lots - 3 - pied.jauge
      const yl = y + h - 4 - pied.lots
      for (let x = 10; x < xd + 1; x += 2) p.rect(x, yj - 3, 1, 1, T[1])
      // LES RÉCOMPENSES, toutes sur une rangée : les crédits dans leur puits, puis l'onglet qu'elle débloque
      {
        const prix = `+${mo.credits}`
        const wn = largeurDe(prix, GRAS)
        const wp = wn + 18
        const yc = yl + Math.floor((pied.lots - 11) / 2)
        plaque(p, 10, yc, wp, 11, 'creux')
        ecrire(p, prix, 14, yc + 2, N.hex('#fff2c8'), { police: GRAS })
        dessinerUnCredit(p, 14 + wn + 7, yc + 5)
        if (mo.ouvre !== undefined) {
          const xo = 10 + wp + 6
          dessinerLIconeDeVue(p, mo.ouvre, xo + 6, yl + 7, true)
          ecrire(p, NOMS_VUE[mo.ouvre], xo + 15, yl + 4, PEPITE[3], { police: GRAS })
        }
      }
      if (fini) {
        if (yj + 15 > bas) return // (son bouton passe sous la barre des onglets : il ne répond pas de là)
        const bw = largeurDe('Réclamer', GRAS) + 22
        bouton(p, Math.round(W / 2 - bw / 2), yj, bw, 15, 'Réclamer', true, () => {
          const r = reclamer(quetes, i, credits, (x) => aLaMecanique(labo, x as Mecanique))
          if (r === null) return
          quetes = r.etat
          credits = r.credits
          sauver()
          secouer(1)
          for (let k = 0; k < 8; k++) volantes.push({ x0: milieu + (R.next() - 0.5) * 40, y0: yj + 7, t0: t + k * 0.05 })
          gerbe(milieu, yj + 7, 20, [PEPITE[2], PEPITE[3], RUNE[3], N.WHITE], 70)
          vueA = t - 0.1
          // l'onglet qu'elle ouvre : il saute dans la barre et prend sa pastille
          if (r.ouvre !== undefined) {
            pulsations[r.ouvre] = t
            nouveautes.add(r.ouvre)
            flottants.push({ texte: `${NOMS_VUE[r.ouvre]} débloqué !`, x: milieu, y: y - 4, t0: t, c: RUNE[3] })
          }
        }, 'achat')
      } else {
        // LA JAUGE, sur toute la largeur, et son compte à droite
        const compte = `${montantCourt(Math.floor(q.progres))}/${montantCourt(mo.cible)}`
        const wc = largeurDe(compte, GRAS)
        const bx = 10 // (deux pixels d'air après le liseré de gauche)
        const by = yj + 2
        const bw = xd - wc - 4 - bx
        p.rect(bx, by, bw, 6, MATIERES.creux.contour)
        p.rect(bx + 1, by + 1, bw - 2, 4, MATIERES.creux.corps)
        const lp = Math.round((bw - 2) * Math.min(1, q.progres / mo.cible))
        if (lp > 0) {
          p.rect(bx + 1, by + 1, lp, 4, T[1])
          p.rect(bx + 1, by + 1, lp, 1, T[2])
          p.rect(bx + 1, by + 4, lp, 1, T[0])
        }
        ecrire(p, compte, xd, by - 1, COQUE[5], { police: GRAS, align: 'right' })
      }
    })
  }

  // ================================================================ LA VENTE : LE PANNEAU DU MARCHÉ
  /**
   * LE PANNEAU DE VENTE (Keko, 11/11 — la règle est dans `logic/vaisseau/marche.ts`) : « Vendre » ne vend plus tout d'un
   * coup, il ouvre ce panneau par-dessus l'entrepôt. LA COURBE du cours (le prix en ordonnée, le temps en abscisse, le
   * point clair est maintenant), LA QUANTITÉ sur un curseur de 0 au stock, puis le choix : AU COURS (vendu tout de
   * suite) ou À PRIX FIXÉ (un second curseur, du cours au plafond ; un trait d'or le pose sur la courbe) — l'ordre
   * attend alors que le cours l'atteigne. Le même panneau OUVRE UN ORDRE POSÉ (une tape sur sa rangée, sous la fiche) :
   * sa courbe et son trait d'or, et « Annuler ».
   */
  let vente: Minerai | null = null
  let venteA = -10
  let venteQuantite = 0
  let venteFixe = false
  let ventePrix = 0
  /** L'ordre ouvert dans le panneau (son numéro), ou null : une vente neuve. */
  let ordreOuvert: number | null = null
  const prixDit = (x: number): string => x.toFixed(1).replace('.', ',')
  function ouvrirLaVente(k: Minerai): void {
    vente = k
    ordreOuvert = null
    venteA = t
    venteQuantite = tresor[k]
    venteFixe = false
    ventePrix = Math.min(prixPlafond(k, avantages()), Math.round(coursA(k, heureDuMarche()) * 11.5) / 10)
  }
  /**
   * LE COURS, écrit comme un nombre ordinaire, avec SA FLÈCHE à gauche (Keko, 11/11 : « plutôt qu'écrire le chiffre du
   * cours en rouge ou vert, écris-le normalement et mets une flèche verte qui monte ou une rouge qui descend à gauche
   * du chiffre ») : verte vers le haut en hausse, rouge vers le bas en baisse, un tiret gris quand le cours est stable —
   * la tendance sur dix minutes (`tendanceDe`), pas d'un pas à l'autre : elle changeait de sens sans arrêt.
   */
  function dessinerLeCours(p: Peintre, k: Minerai, xDroite: number, y: number): void {
    const maintenant = heureDuMarche()
    const texte = prixDit(coursA(k, maintenant))
    nombreDeCredits(p, texte, xDroite, y, N.hex('#fff2c8'))
    const sens = tendanceDe(k, maintenant)
    const xf = Math.round(xDroite - largeurDe(texte, GRAS) - 12 - 8)
    // (stable : un tiret gris)
    if (sens === 0) {
      p.rect(xf - 3, y + 2, 7, 3, MATIERES.encre.contour)
      p.rect(xf - 2, y + 3, 5, 1, COQUE[3])
      return
    }
    const c = sens > 0 ? RUNE[2] : ROUGE[4]
    const clair = sens > 0 ? RUNE[3] : ROUGE[5]
    const encre = MATIERES.encre.contour
    // une pointe de cinq pixels de large sur trois de haut, sa tige dessous (ou dessus)
    for (let j = 0; j < 3; j++) {
      const yy = sens > 0 ? y + j : y + 6 - j
      p.rect(xf - j - 1, yy, 2 * j + 3, 1, encre)
      p.rect(xf - j, yy, 2 * j + 1, 1, j === 0 ? clair : c)
    }
    p.rect(xf - 1, sens > 0 ? y + 3 : y, 3, 4, encre)
    p.rect(xf, sens > 0 ? y + 3 : y, 1, 4, c)
  }
  function ouvrirLOrdre(id: number): void {
    const o = ordreNumero(marche, id)
    if (o === undefined) return
    vente = o.minerai
    ordreOuvert = id
    venteA = t
  }
  /**
   * LES ORDRES EN ATTENTE du minerai choisi, SOUS SA FICHE (Keko, 11/11 : « plutôt qu'ouvrir l'ordre actif quand on
   * clique sur vendre, on affiche les ordres actifs sous la description du matériau, sous le bouton vendre, avec la
   * possibilité de scroller vers le bas s'il y en a trop et de les ouvrir en cliquant dessus ; le bouton vendre permet
   * de passer d'autres ordres ou de vendre le reste ») : une rangée par ordre — sa quantité, son prix, ce qu'il
   * rapportera — ; la liste glisse au doigt quand elle dépasse ; une tape ouvre l'ordre (sa courbe, « Annuler »).
   */
  const RANG_ORDRE = 17
  let defilOrdres = 0
  let zoneDesOrdres: { x: number; y: number; w: number; h: number } | null = null
  function dessinerLesOrdres(p: Peintre, y0: number, k: Minerai): void {
    const liste = ordresDe(marche, k)
    if (liste.length === 0) return
    p.text('ORDRES EN ATTENTE', 8, y0 + 1, PEPITE[2])
    const y = y0 + 11
    const visibles = Math.max(1, Math.floor((H - HAUT_NAV - 3 - y) / RANG_ORDRE))
    const maxD = Math.max(0, liste.length - visibles)
    defilOrdres = Math.max(0, Math.min(maxD, defilOrdres))
    const d = Math.round(defilOrdres)
    const larg = W - 8 - (maxD > 0 ? 6 : 0)
    for (let i = d; i < Math.min(liste.length, d + visibles); i++) {
      const o = liste[i]
      const ly = y + (i - d) * RANG_ORDRE
      const e = etatDuBouton(4, ly, larg, 15)
      plaque(p, 4, ly + e.dy, larg, 15, 'encre', { enfonce: e.enfonce, survole: e.survole, flash: e.flash })
      dessinerUneRessource(p, 13, ly + 7 + e.dy, k)
      const q = montantCourt(o.quantite)
      const wq = largeurDe(q, GRAS)
      ecrire(p, q, 21, ly + 4 + e.dy, N.WHITE, { police: GRAS })
      ecrire(p, 'à', 21 + wq + 4, ly + 4 + e.dy, COQUE[4])
      const xp = 21 + wq + 4 + largeurDe('à') + 4
      const prix = prixDit(o.prix)
      ecrire(p, prix, xp, ly + 4 + e.dy, N.hex('#fff2c8'), { police: GRAS })
      dessinerUnCredit(p, xp + largeurDe(prix, GRAS) + 7, ly + 7 + e.dy)
      nombreDeCredits(p, `= ${gainDe(o.quantite, o.prix, avantages())}`, 4 + larg - 4, ly + 4 + e.dy, PEPITE[3])
      zone(4, ly, larg, 16, () => ouvrirLOrdre(o.id), 'ouvre')
    }
    if (maxD > 0) {
      const hg = visibles * RANG_ORDRE - 2
      const hc = Math.max(8, Math.round((hg * visibles) / liste.length))
      p.rect(W - 7, y, 3, hg, MATIERES.creux.contour)
      p.rect(W - 7, y + Math.round(((hg - hc) * defilOrdres) / maxD), 3, hc, COQUE[3])
      zoneDesOrdres = { x: 4, y, w: W - 8, h: visibles * RANG_ORDRE }
    }
  }
  /** Un curseur : sa rainure, sa part pleine, son bouton ; `regler` reçoit sa place de 0 à 1. */
  function dessinerUnCurseur(p: Peintre, x: number, y: number, w: number, u: number, regler: (u: number) => void): void {
    p.rect(x, y + 3, w, 6, MATIERES.creux.contour)
    p.rect(x + 1, y + 4, w - 2, 4, MATIERES.creux.corps)
    const lp = Math.round((w - 2) * Math.max(0, Math.min(1, u)))
    if (lp > 0) {
      p.rect(x + 1, y + 4, lp, 4, PEPITE[2])
      p.rect(x + 1, y + 4, lp, 1, N.hex('#ffe68a'))
      p.rect(x + 1, y + 7, lp, 1, N.hex('#b87a14'))
    }
    const bx = x + 1 + lp - 3
    plaque(p, bx, y, 7, 12, 'or')
    curseurs.push({ x: x + 1, y: y - 4, w: w - 2, h: 20, regler })
  }
  function dessinerLaVente(p: Peintre, partie: 'tout' | 'courbe' | 'reste' = 'tout'): void {
    if (vente === null) return
    const milieu = W / 2
    const k = vente
    const u0 = sortie((t - venteA) / 0.2)
    const maintenant = heureDuMarche()
    const cours = coursA(k, maintenant)
    const ordre = ordreOuvert === null ? undefined : ordreNumero(marche, ordreOuvert)
    // (l'ordre ouvert vient de se régler, ou n'est plus : le panneau se ferme)
    if (ordreOuvert !== null && ordre === undefined) {
      vente = null
      return
    }
    const stock = tresor[k]
    // (sous « Fermer », LE MÊME ÉCART qu'entre les deux boutons, quatre pixels — Keko : d'abord « la boîte s'arrête pile en
    // bas du bouton », puis, pour la vente : « l'espace est un peu grand, il faudrait le même que sous le bouton vendre »)
    // LE COMMERCE COMMENCE NU (Keko, 12/11) : ni courbe, ni prix fixé — vendre au cours, c'est tout ; la recherche,
    // branche commerce, les débloque (`courbe`, `ordres`). Le panneau a la hauteur de ce qu'il montre.
    const aCourbe = aLaMecanique(labo, 'courbe')
    const aOrdres = aLaMecanique(labo, 'ordres')
    if (!aOrdres) venteFixe = false
    // (COUCHÉE, DEUX PARTIES — `courbe` : la courbe seule, dans la fenêtre de gauche, plus haute ; `reste` : tout le reste,
    // dans la colonne)
    const gh = partie === 'courbe' ? Math.max(50, Math.min(96, H - HAUT_BARRE - 52)) : 50
    const hp = partie === 'courbe' ? 27 + gh : (ordre !== undefined ? 153 : 216) - (aCourbe && partie === 'tout' ? 0 : 55) - (ordre === undefined && !aOrdres ? 18 : 0)
    const x = 6
    const w = W - 12
    const y = Math.max(HAUT_BARRE + 3, Math.round((H - hp) / 2)) + Math.round((1 - u0) * 10)
    // le voile : tout ce qui est dessous s'éteint et ne répond plus
    p.rect(0, 0, W, H, NUIT, 0.72 * u0)
    if (partie !== 'reste') {
      frame.light.fill(0)
      zones = []
      curseurs = []
      zoneDesOrdres = null
      zoneDeLInventaire = null
    }
    if (partie === 'courbe' && !aCourbe) {
      // (pas encore de courbe : la fenêtre de gauche n'est qu'un voile, qui ferme)
      zone(0, 0, W, H, () => (vente = null), 'retour')
      return
    }
    plaque(p, x, y, w, hp, 'encre')
    const nom = FICHES_MINERAI[k].nom
    if (partie === 'courbe') motEnRelief(p, 'Cours', W / 2, y + 7, 'ivoire')
    else {
      dessinerUneRessource(p, W / 2 - largeurDe(nom, GRAS) / 2 - 5, y + 10, k)
      motEnRelief(p, nom, W / 2 + 5, y + 7, true)
    }
    if (aCourbe && partie !== 'reste') {
      // LA COURBE : les derniers cours, à l'échelle de leur creux et de leur crête (et du prix fixé, s'il y en a un)
      const gx = x + 6
      const gy = y + 21
      const gw = w - 12
      plaque(p, gx, gy, gw, gh, 'creux')
      const h = historiqueDe(k, maintenant)
      const fixe = ordre !== undefined ? ordre.prix : venteFixe ? ventePrix : null
      // LA PRÉVISION (une mécanique de la branche commerce) : les dix pas à venir, à la suite de la courbe, en pointillé
      const avenir = aLaMecanique(labo, 'prevision') ? previsionDe(k, maintenant, 10) : []
      const bas = Math.min(...h, ...avenir, fixe ?? Infinity)
      const haut = Math.max(...h, ...avenir, fixe ?? -Infinity)
      const marge = Math.max(0.1, (haut - bas) * 0.12)
      const yDe = (prix: number): number => Math.round(gy + gh - 5 - ((prix - (bas - marge)) / (haut - bas + 2 * marge)) * (gh - 10))
      const xDe = (i: number): number => Math.round(gx + 4 + (i / (h.length + avenir.length - 1)) * (gw - 9))
      const monte = h[h.length - 1] >= h[0]
      const teinte = monte ? RUNE[2] : ROUGE[4]
      // (le prix de base, en pointillé discret : au-dessus, c'est un bon moment pour vendre)
      const yb0 = yDe(FICHES_MINERAI[k].credits)
      if (yb0 > gy + 2 && yb0 < gy + gh - 2) for (let xx = gx + 3; xx < gx + gw - 3; xx += 4) p.rect(xx, yb0, 2, 1, COQUE[2])
      for (let i = 1; i < h.length; i++) p.line(xDe(i - 1), yDe(h[i - 1]), xDe(i), yDe(h[i]), teinte)
      if (fixe !== null) {
        const yf = yDe(fixe)
        for (let xx = gx + 3; xx < gx + gw - 3; xx += 3) p.rect(xx, yf, 2, 1, PEPITE[2])
      }
      avenir.forEach((prix, i) => {
        const xa = xDe(h.length + i)
        p.rect(xa, yDe(prix), 1, 1, COQUE[5])
        if (i % 2 === 0) p.rect(Math.round((xa + xDe(h.length + i - 1)) / 2), Math.round((yDe(prix) + yDe(i === 0 ? cours : avenir[i - 1])) / 2), 1, 1, COQUE[3])
      })
      const xn = xDe(h.length - 1)
      const yn = yDe(cours)
      p.glow(xn, yn, 5, teinte, 0.5 + 0.3 * Math.sin(t * 5))
      p.rect(xn - 1, yn - 1, 3, 3, N.WHITE)
      p.text(prixDit(haut), gx + 3, gy + 3, COQUE[3])
      p.text(prixDit(bas), gx + 3, gy + gh - 9, COQUE[3])
    }
    if (partie === 'courbe') {
      zone(x, y, w, hp, () => {}, null)
      zone(0, 0, W, H, () => (vente = null), 'retour')
      return
    }
    let ly = y + 21 + (aCourbe && partie === 'tout' ? 55 : 0)
    ecrire(p, 'Cours', x + 6, ly, COQUE[4])
    dessinerLeCours(p, k, x + w - 5, ly)
    ly += 13
    const lb = (mot: string): number => largeurDe(mot, GRAS) + 22
    if (ordre !== undefined) {
      // UN ORDRE ATTEND : ce qu'il vend, à quel prix, et l'annuler (les pépites reviennent)
      ecrire(p, 'Ordre posé', x + 6, ly, COQUE[4])
      nombreDeCredits(p, `${montantCourt(ordre.quantite)} à ${prixDit(ordre.prix)}`, x + w - 5, ly, PEPITE[3])
      ly += 12
      ecrire(p, 'Vendu dès que le cours l’atteint', W / 2, ly, COQUE[3], { align: 'center' })
      ly += 14
      const ba = lb('Annuler l’ordre')
      bouton(p, Math.round(W / 2 - ba / 2), ly, ba, 15, 'Annuler l’ordre', true, () => {
        const r = annulerLOrdre(marche, tresor, ordre.id)
        marche = r.marche
        tresor = r.tresor
        sauver()
        vente = null
      }, 'retour', 'rouge')
      ly += 19
    } else {
      // LA QUANTITÉ : de zéro au stock
      const q = Math.max(0, Math.min(stock, venteQuantite))
      ecrire(p, 'Quantité', x + 6, ly, COQUE[4])
      ecrire(p, `${montantCourt(q)} / ${montantCourt(stock)}`, x + w - 6, ly, q > 0 ? N.WHITE : COQUE[3], { police: GRAS, align: 'right' })
      ly += 11
      dessinerUnCurseur(p, x + 8, ly, w - 16, stock > 0 ? q / stock : 0, (u) => (venteQuantite = Math.round(u * stock)))
      ly += 18
      // LE CHOIX : au cours, ou à prix fixé (une fois les ordres débloqués à la recherche)
      const choix: [string, boolean][] = aOrdres ? [['Au cours', false], ['Prix fixé', true]] : []
      const lws = choix.map(([mot]) => largeurDe(mot, GRAS) + 14)
      let xc = Math.round((W - (lws[0] ?? 0) - (lws[1] ?? 0) - 4) / 2)
      choix.forEach(([mot, f], i) => {
        const actif = venteFixe === f
        const e = etatDuBouton(xc, ly, lws[i], 13)
        plaque(p, xc, ly + e.dy, lws[i], 13, actif ? 'or' : 'encre', { enfonce: e.enfonce, survole: e.survole, flash: e.flash })
        ecrire(p, mot, xc + lws[i] / 2, ly + 3 + e.dy, actif ? N.WHITE : COQUE[5], { align: 'center', police: GRAS })
        if (!actif) zone(xc, ly - 2, lws[i], 17, () => (venteFixe = f))
        xc += lws[i] + 4
      })
      if (aOrdres) ly += 18
      const plafond = prixPlafond(k, avantages())
      if (venteFixe) {
        ventePrix = Math.max(cours, Math.min(plafond, ventePrix))
        ecrire(p, 'Prix', x + 6, ly, COQUE[4])
        nombreDeCredits(p, prixDit(ventePrix), x + w - 5, ly, PEPITE[3])
        ly += 11
        dessinerUnCurseur(p, x + 8, ly, w - 16, plafond > cours ? (ventePrix - cours) / (plafond - cours) : 1, (u) => (ventePrix = Math.round((cours + u * (plafond - cours)) * 10) / 10))
        ly += 17
      } else {
        ecrire(p, 'Vendu tout de suite,', W / 2, ly + 3, COQUE[3], { align: 'center' })
        ecrire(p, 'au cours du moment', W / 2, ly + 13, COQUE[3], { align: 'center' })
        ly += 28
      }
      const prix = venteFixe ? ventePrix : cours
      ecrire(p, 'Gain', x + 6, ly, COQUE[4])
      nombreDeCredits(p, String(gainDe(q, prix, avantages())), x + w - 5, ly, q > 0 ? N.hex('#fff2c8') : COQUE[3])
      ly += 14
      const mot = venteFixe ? 'Poser l’ordre' : 'Vendre'
      const bw = lb(mot)
      bouton(p, Math.round(W / 2 - bw / 2), ly, bw, 15, mot, q > 0, () => {
        if (venteFixe) {
          const r = poserUnOrdre(marche, tresor, k, q, ventePrix, heureDuMarche(), avantages())
          if (r === null) return
          marche = r.marche
          tresor = r.tresor
          flottants.push({ texte: 'Ordre posé', x: milieu, y: HAUT_BARRE + 16, t0: t, c: PEPITE[3] })
          compter('ordresPoses', 1)
        } else {
          const r = vendreAuCours(tresor, credits, k, q, heureDuMarche(), avantages())
          if (r === null) return
          compter('ventes', r.credits - credits)
          tresor = r.tresor
          credits = r.credits
          secouer(0.8)
          for (let i = 0; i < Math.min(10, q); i++) volantes.push({ x0: milieu + (R.next() - 0.5) * 30, y0: ly + 6, t0: t + i * 0.05 })
          gerbe(milieu, ly + 6, 14, [RUNE[2], RUNE[3], N.WHITE])
        }
        sauver()
        vente = null
      }, venteFixe ? 'equipe' : 'vente', 'vert')
      ly += 19
    }
    const bf = lb('Fermer')
    bouton(p, Math.round(W / 2 - bf / 2), ly, bf, 15, 'Fermer', true, () => (vente = null), 'retour', 'acier')
    // (les zones se cherchent dans l'ordre : le panneau, qui ne fait rien, puis le voile, qui ferme, passent après ses boutons)
    zone(x, y, w, hp, () => {}, null)
    zone(0, 0, W, H, () => (vente = null), 'retour')
  }

  /** Un point de l'écran en pixels du tampon. */
  const enTampon = (x: number, y: number): Vecteur => {
    const r = canvas.getBoundingClientRect()
    return { x: (x - r.left) / zoom, y: (y - r.top) / zoom }
  }
  /** Une zone touchée : elle s'enfonce, agit, et sonne. */
  function appuyer(z: { x: number; y: number; action: () => void; son?: Son | null }): void {
    enfonce = { x: z.x, y: z.y, t0: t }
    const n = [eclats.length, flottants.length, volantes.length, envolsDePiece.length]
    z.action()
    // (ce que l'action a semé — une gerbe, un nombre qui monte, des pièces qui volent — l'était dans la fenêtre de sa zone)
    const dx = (z as { dx?: number }).dx ?? 0
    if (dx !== 0) {
      for (let i = n[0]; i < eclats.length; i++) eclats[i].x += dx
      for (let i = n[1]; i < flottants.length; i++) flottants[i].x += dx
      for (let i = n[2]; i < volantes.length; i++) volantes[i].x0 += dx
      for (let i = n[3]; i < envolsDePiece.length; i++) envolsDePiece[i].x0 += dx
    }
    const son = z.son === undefined ? 'clic' : z.son
    if (son !== null) jouer(son)
  }
  racine.addEventListener('pointerdown', (ev) => {
    reveiller() // (le contexte audio ne naît que sur un geste)
    // (l'accueil se quitte AU RELÂCHEMENT : au doigt, c'est lui — pas l'appui — que le navigateur compte comme un geste)
    if (accueil) return
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
      // un curseur : il suit le doigt dès l'appui
      const cu = curseurs.find((c) => q.x >= c.x - 4 && q.x < c.x + c.w + 4 && q.y >= c.y && q.y < c.y + c.h)
      if (cu !== undefined) {
        glisse = { x: q.x, y: q.y, defil0: 0, bouge: true, sorte: 'curseur', curseur: cu }
        cu.regler(Math.max(0, Math.min(1, (q.x - cu.x) / cu.w)))
        racine.setPointerCapture(ev.pointerId)
        return
      }
      // les cases du hangar, quand le vaisseau a plus de places qu'il n'en tient au-dessus de « Décoller »
      const zc = zoneDesCases
      if (zc !== null && !feuille && q.x >= zc.x && q.x < zc.x + zc.w && q.y >= zc.y && q.y < zc.y + zc.h) {
        glisse = { x: q.x, y: q.y, defil0: defilCases, bouge: false, sorte: 'cases' }
        racine.setPointerCapture(ev.pointerId)
        return
      }
      // les cartes des missions, quand elles ne tiennent pas toutes
      const zm = zoneDesMissions
      if (zm !== null && !feuille && q.x >= zm.x && q.x < zm.x + zm.w && q.y >= zm.y && q.y < zm.y + zm.h) {
        glisse = { x: q.x, y: q.y, defil0: defilMissions, bouge: false, sorte: 'missions' }
        racine.setPointerCapture(ev.pointerId)
        return
      }
      // la grille de l'entrepôt, quand elle a plus de rangées qu'elle n'en montre : elle se fait glisser
      const zi = zoneDeLInventaire
      if (zi !== null && !feuille && q.x >= zi.x && q.x < zi.x + zi.w && q.y >= zi.y && q.y < zi.y + zi.h) {
        glisse = { x: q.x, y: q.y, defil0: defilInventaire, bouge: false, sorte: 'inventaire' }
        racine.setPointerCapture(ev.pointerId)
        return
      }
      // la liste des ordres de l'entrepôt, quand elle dépasse : elle se fait glisser (une tape sur un ordre se décide au relâchement)
      const zo = zoneDesOrdres
      if (zo !== null && !feuille && q.x >= zo.x && q.x < zo.x + zo.w && q.y >= zo.y && q.y < zo.y + zo.h) {
        glisse = { x: q.x, y: q.y, defil0: defilOrdres, bouge: false, sorte: 'ordres' }
        racine.setPointerCapture(ev.pointerId)
        return
      }
      // l'arbre du labo, quand il dépasse sa fenêtre : il se fait glisser (une tape sur un nœud se décide au relâchement)
      const za = zoneDeLArbre
      if (za !== null && !feuille && q.x >= za.x && q.x < za.x + za.w && q.y >= za.y && q.y < za.y + za.h) {
        glisse = { x: q.x, y: q.y, defil0: defilDeLArbre[branche], bouge: false, sorte: 'arbre' }
        racine.setPointerCapture(ev.pointerId)
        return
      }
      const z = zones.find((z) => q.x >= z.x && q.x < z.x + z.w && q.y >= z.y && q.y < z.y + z.h)
      if (z !== undefined) appuyer(z)
      return
    }
    // (en vol : la plaque de soute et, ouverte, ses boutons — sinon le manche)
    {
      const q = enTampon(ev.clientX, ev.clientY)
      // (`&banc` ouvert : un curseur suit le doigt dès l'appui, comme à la base)
      // (les zones de deux rangées voisines se recouvrent : c'est le curseur le plus proche du doigt qui répond)
      const cuBanc = BANC && bancOuvert ? curseurs.filter((c) => q.x >= c.x - 4 && q.x < c.x + c.w + 4 && q.y >= c.y && q.y < c.y + c.h).sort((a, b) => Math.abs(q.y - a.y - a.h / 2) - Math.abs(q.y - b.y - b.h / 2))[0] : undefined
      if (cuBanc !== undefined) {
        glisse = { x: q.x, y: q.y, defil0: 0, bouge: true, sorte: 'curseur', curseur: cuBanc }
        cuBanc.regler(Math.max(0, Math.min(1, (q.x - cuBanc.x) / cuBanc.w)))
        racine.setPointerCapture(ev.pointerId)
        return
      }
      // (la liste de la soute, quand elle dépasse : elle se fait glisser, la tape se décide au relâchement)
      const zs = souteOuverte ? zoneDeLaSoute : null
      if (zs !== null && q.x >= zs.x && q.x < zs.x + zs.w && q.y >= zs.y && q.y < zs.y + zs.h) {
        glisse = { x: q.x, y: q.y, defil0: defilSoute, bouge: false, sorte: 'soute' }
        racine.setPointerCapture(ev.pointerId)
        return
      }
      const z = zones.find((z) => q.x >= z.x && q.x < z.x + z.w && q.y >= z.y && q.y < z.y + z.h)
      if (z !== undefined) {
        appuyer(z)
        return
      }
      if (souteOuverte) return
    }
    {
      // (deux appuis rapprochés, dans le temps et sur l'écran : la postcombustion ; le second appui pose quand même le manche)
      const maintenant = performance.now()
      if (maintenant - appuiA < 320 && Math.hypot(ev.clientX - appuiOu.x, ev.clientY - appuiOu.y) < 70) lancerLaPostcombustion()
      appuiA = maintenant
      appuiOu = { x: ev.clientX, y: ev.clientY }
    }
    // L'ÉCRAN A DEUX MOITIÉS (Keko, 12/11 : « et si on disait moitié gauche du téléphone = déplacement, et moitié droite
    // = orientation / visée de compétence ? » — « le premier doigt est le manche, le suivant vise » empêchait de lancer
    // une bombe à l'arrêt, et « le prochain appui vise » prenait le doigt du vol) : un doigt posé À GAUCHE est LE MANCHE ;
    // un doigt posé À DROITE est LE REGARD — ou, une capacité armée, SA VISÉE. Un seul de chaque ; l'un ne dépend plus de
    // l'autre. (À la souris, qui n'a qu'un pointeur : le manche partout, la visée quand une capacité est armée.)
    const cadre = canvas.getBoundingClientRect()
    // (le côté du vol se choisit dans les paramètres : `aGauche` veut dire « du côté du vol »)
    const aGauche = ev.pointerType === 'mouse' ? !capaciteArmee : ev.clientX < cadre.left + cadre.width / 2 === (reglages.vol === 'gauche')
    // (un manche « tenu » par un doigt qui n'est plus posé — voir le filet, plus bas : il y a moins de doigts sur l'écran
    // que de manches pris ; le doigt qui arrive de son côté le reprend alors)
    const fantome = ev.pointerType === 'touch' && doigtsPoses < (manche === null ? 0 : 1) + (regard === null ? 0 : 1)
    const q = { x: ev.clientX, y: ev.clientY }
    if (aGauche) {
      if (manche !== null && !fantome) return
      ev.preventDefault()
      racine.setPointerCapture(ev.pointerId)
      manche = { id: ev.pointerId, centre: q, doigt: q }
    } else {
      if (regard !== null && !fantome) return
      ev.preventDefault()
      racine.setPointerCapture(ev.pointerId)
      regard = { id: ev.pointerId, centre: q, doigt: q, tir: capaciteArmee, t0: t }
    }
  })
  racine.addEventListener('pointermove', (ev) => {
    // LE SURVOL, à la souris (PC) : ce qu'on survole s'éclaire, et le pointeur devient une main
    if (ev.pointerType === 'mouse') {
      if (ecranVisible()) {
        const sv = enTampon(ev.clientX, ev.clientY)
        survol = sv
        canvas.style.cursor = zones.some((z) => sv.x >= z.x && sv.x < z.x + z.w && sv.y >= z.y && sv.y < z.y + z.h) ? 'pointer' : ''
      } else {
        if (survol !== null) {
          survol = null
          canvas.style.cursor = ''
        }
        // (en vol : la souris vise — voir `regardVoulu`)
        souris = enTampon(ev.clientX, ev.clientY)
      }
    }
    if (glisse !== null) {
      // la liste suit le doigt, une rangée par 13 pixels de tampon
      const q = enTampon(ev.clientX, ev.clientY)
      if (Math.abs(q.y - glisse.y) > 2) glisse.bouge = true
      if (glisse.sorte === 'curseur') {
        const cu = glisse.curseur!
        cu.regler(Math.max(0, Math.min(1, (q.x - cu.x) / cu.w)))
        return
      }
      if (glisse.sorte === 'cases') defilCases = glisse.defil0 - (q.y - glisse.y) / PAS_DES_CASES
      else if (glisse.sorte === 'missions') defilMissions = glisse.defil0 - (q.y - glisse.y) / PAS_DES_MISSIONS
      else if (glisse.sorte === 'soute') defilSoute = glisse.defil0 - (q.y - glisse.y) / 25
      else if (glisse.sorte === 'inventaire') defilInventaire = glisse.defil0 - (q.y - glisse.y) / PAS_DE_L_INVENTAIRE
      else if (glisse.sorte === 'ordres') defilOrdres = glisse.defil0 - (q.y - glisse.y) / RANG_ORDRE
      else if (glisse.sorte === 'arbre') defilDeLArbre[branche] = glisse.defil0 - (q.y - glisse.y) // (l'arbre suit le doigt, au pixel)
      else if (glisse.sorte === 'onglets') defilOnglets = glisse.defil0 - (q.y - glisse.y) / 37 // (la feuille « PLUS » défile d'une rangée par 37 pixels)
      else if (glisse.sorte === 'liste') defil[onglet] = glisse.defil0 - (q.y - glisse.y) / 13
      return
    }
    if (regard !== null && ev.pointerId === regard.id) {
      const d = { x: ev.clientX, y: ev.clientY }
      regard = { id: regard.id, centre: centreQuiSuit(MANCHE, regard.centre, d), doigt: d, tir: regard.tir, t0: regard.t0 }
      return
    }
    if (manche === null || ev.pointerId !== manche.id) return
    const doigt = { x: ev.clientX, y: ev.clientY }
    manche = { id: manche.id, centre: suivre ? manche.centre : centreQuiSuit(MANCHE, manche.centre, doigt), doigt }
  })
  const lever = (ev: PointerEvent) => {
    reveiller() // (au doigt, c'est le relâchement qui rend le son à la page)
    if (accueil) {
      if (ev.type === 'pointerup') quitterLAccueil()
      return
    }
    if (glisse !== null) {
      // relâché sans avoir bougé : c'était une tape, sur la rangée touchée
      if (!glisse.bouge) {
        const q = glisse
        const z = zones.find((z) => q.x >= z.x && q.x < z.x + z.w && q.y >= z.y && q.y < z.y + z.h)
        if (z !== undefined) appuyer(z)
      }
      if (glisse.sorte === 'liste') defil[onglet] = Math.round(defil[onglet])
      else if (glisse.sorte === 'onglets') defilOnglets = Math.round(defilOnglets)
      else if (glisse.sorte === 'ordres') defilOrdres = Math.round(defilOrdres)
      else if (glisse.sorte === 'inventaire') defilInventaire = Math.round(defilInventaire)
      else if (glisse.sorte === 'cases') defilCases = Math.round(defilCases)
      else if (glisse.sorte === 'missions') defilMissions = Math.round(defilMissions)
      else if (glisse.sorte === 'soute') defilSoute = Math.round(defilSoute)
      glisse = null
    }
    if (manche !== null && ev.pointerId === manche.id) manche = null
    if (regard !== null && ev.pointerId === regard.id) {
      // (le doigt qui visait se lève : la capacité part — sauf si l'appui a été annulé par le système)
      if (regard.tir && ev.type === 'pointerup') {
        capaciteArmee = false
        if (lancerLaBombe(CONF, m, regardVoulu())) {
          jouer('canon')
          if (typeof navigator.vibrate === 'function') navigator.vibrate(15)
        }
      }
      regard = null
    }
  }
  // LA MOLETTE, sur PC (Keko : « sur PC je ne peux pas scroller la barre d'onglets ») : sur la grille d'onglets, elle la
  // fait défiler au pixel ; sur la liste des pièces, d'une rangée par cran
  racine.addEventListener('wheel', (ev) => {
    if (!ecranVisible()) {
      // (en vol : la molette fait défiler la soute ouverte)
      const zs = souteOuverte ? zoneDeLaSoute : null
      const qs = enTampon(ev.clientX, ev.clientY)
      if (zs !== null && qs.x >= zs.x && qs.x < zs.x + zs.w && qs.y >= zs.y && qs.y < zs.y + zs.h) {
        ev.preventDefault()
        defilSoute = Math.round(defilSoute) + Math.sign(ev.deltaY)
      }
      return
    }
    const q = enTampon(ev.clientX, ev.clientY)
    const dans = (z: { x: number; y: number; w: number; h: number } | null): boolean => z !== null && q.x >= z.x && q.x < z.x + z.w && q.y >= z.y && q.y < z.y + z.h
    const pas = ev.deltaMode === 1 ? ev.deltaY * 16 : ev.deltaY
    if (dans(zoneDesOnglets)) {
      ev.preventDefault()
      defilOnglets = Math.round(defilOnglets) + Math.sign(pas)
    } else if (dans(zoneGlissante)) {
      ev.preventDefault()
      defil[onglet] = Math.round(defil[onglet]) + Math.sign(pas)
    } else if (dans(zoneDesCases)) {
      ev.preventDefault()
      defilCases = Math.round(defilCases) + Math.sign(pas)
    } else if (dans(zoneDesMissions)) {
      ev.preventDefault()
      defilMissions = Math.round(defilMissions) + Math.sign(pas)
    } else if (dans(zoneDeLInventaire)) {
      ev.preventDefault()
      defilInventaire = Math.round(defilInventaire) + Math.sign(pas)
    } else if (dans(zoneDesOrdres)) {
      ev.preventDefault()
      defilOrdres = Math.round(defilOrdres) + Math.sign(pas)
    } else if (dans(zoneDeLArbre)) {
      ev.preventDefault()
      defilDeLArbre[branche] += Math.sign(pas) * 24
    }
  }, { passive: false })
  racine.addEventListener('pointerleave', () => {
    survol = null
    souris = null
  })
  racine.addEventListener('pointerup', lever)
  racine.addEventListener('pointercancel', lever)
  /**
   * LE FILET DES DEUX MANCHES (Keko, 12/11 : « quand je lance le premier joystick et que j'active le deuxième, si je
   * lâche le premier et que je le réenclenche, je ne peux plus bouger » — pas reproduit en émulation, où le relâchement
   * arrive bien ; sur l'appareil, tout se passe comme si le relâchement du premier doigt s'était perdu : le manche reste
   * « tenu » par un doigt qui n'est plus là, et le doigt reposé n'a plus de place). On demande donc AUX ÉVÉNEMENTS
   * TACTILES, qui disent à chaque instant quels doigts sont VRAIMENT posés : plus aucun — les deux manches tombent ; un
   * seul alors qu'on en tient deux — celui des deux qui est le plus loin de ce doigt tombe. Et un appui qui arrive alors
   * que les deux manches sont pris, avec moins de deux doigts posés avant lui, prend la place du manche.
   */
  let doigtsPoses = 0
  const recompter = (ev: TouchEvent): void => {
    doigtsPoses = ev.touches.length
    journalDesDoigts = `${ev.type.slice(5)} ${doigtsPoses}`
    if (doigtsPoses === 0) {
      manche = null
      regard = null
    } else if (doigtsPoses === 1 && manche !== null && regard !== null) {
      const d = ev.touches[0]
      const loin = (q: Vecteur): number => Math.hypot(q.x - d.clientX, q.y - d.clientY)
      if (loin(manche.doigt) <= loin(regard.doigt)) regard = null
      else manche = null
    }
  }
  racine.addEventListener('touchstart', (ev) => {
    doigtsPoses = ev.touches.length
    journalDesDoigts = `start ${doigtsPoses}`
  }, { passive: true })
  racine.addEventListener('touchend', recompter, { passive: true })
  racine.addEventListener('touchcancel', recompter, { passive: true })
  window.addEventListener('keydown', (ev) => {
    reveiller()
    if (accueil) {
      quitterLAccueil()
      return
    }
    if (souteOuverte) {
      if (ev.key === 'Escape') souteOuverte = false
      return
    }
    if (ev.key === ' ' || ev.key === 'Shift') lancerLaPostcombustion()
    touches.add(ev.key.toLowerCase())
    demarrer()
  })
  window.addEventListener('keyup', (ev) => touches.delete(ev.key.toLowerCase()))
  window.addEventListener('blur', () => {
    touches.clear()
    manche = null
  })
  /**
   * LA POSTCOMBUSTION (la première mécanique du labo) : une DOUBLE TAPE en vol — ou sa plaque, ou Espace / Maj au
   * clavier — lance une pointe de vitesse ; la règle dit si elle part (débloquée, rechargée).
   */
  let appuiA = -1e9
  let appuiOu = { x: 0, y: 0 }
  function lancerLaPostcombustion(): void {
    if (!enJeu || souteOuverte || t - arriveA < ARRIVE_A || !postcombustion(CONF, m)) return
    jouer('decolle')
    secousse = Math.max(secousse, 0.5)
    flashs.push({ x: v.x, y: v.y, t0: t, r: 7 })
    if (typeof navigator.vibrate === 'function') navigator.vibrate(25)
  }
  /** Où le second doigt regarde (longueur 0 à 1), ou rien s'il n'est pas posé. */
  function regardVoulu(): Vecteur | undefined {
    if (regard !== null) return directionDuManche(MANCHE, regard.doigt.x - regard.centre.x, regard.doigt.y - regard.centre.y)
    // SUR PC, LA SOURIS VISE (Keko, 12/11 : « mouvement sur ZQSD et vise via souris ») : le nez se tourne vers le
    // pointeur, d'autant plus franchement — et la caméra avance d'autant plus — qu'il est loin du vaisseau (à fond à
    // soixante pixels) ; tout près de lui, rien. Dès que la souris a bougé pendant le vol, tant qu'elle est sur le jeu
    // et qu'elle ne tient pas le manche.
    if (souris === null || manche !== null || !enJeu) return undefined
    const dx = souris.x - (v.x - camera.x + W / 2)
    const dy = souris.y - (v.y - camera.y + centreY())
    const d = Math.hypot(dx, dy)
    if (d < 8) return undefined
    const force = Math.min(1, (d - 8) / 52)
    return { x: (dx / d) * force, y: (dy / d) * force }
  }
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
    const cle = `${px},${py},${W},${H},${graineDuVol}`
    if (cle === cleDuCiel) return fondDuCiel
    // (LES NUÉES SUIVENT LA GRAINE DU VOL — Keko, 11/11 : « le background des nuages colorés est toujours le même » ;
    // à zéro, les nuées de toujours)
    const gr = graineDuVol * 8
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
        grilleDensite[gj * gw + gi] = 0.55 * bruitDuCiel(wx / 92, wy / 92, gr + 1) + 0.3 * bruitDuCiel(wx / 39, wy / 39, gr + 2) + 0.15 * bruitDuCiel(wx / 17, wy / 17, gr + 3)
        grilleTeinte[gj * gw + gi] = bruitDuCiel(wx / 240, wy / 240, gr + 4)
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

  /**
   * LES ASTRES DU FOND (`celeste.ts`) : chacun est peint UNE FOIS dans un petit tampon, gardé ici par sa clé (quarante
   * au plus), puis POSÉ à chaque image — ses pixels recopiés tels quels dans la couleur du tampon du jeu. Une sphère de
   * cinquante pixels de rayon repeinte à chaque image (un bruit fractal par pixel) aurait coûté le vol.
   */
  const tamponsDesAstres = new Map<string, { w: number; h: number; color: Uint32Array }>()
  function poserLAstre(a: Astre): void {
    const d = demiTailleDeLAstre(a)
    let sp = tamponsDesAstres.get(a.cle)
    if (sp === undefined) {
      const f = N.createFrame(d * 2 + 1, d * 2 + 1)
      peindreAstre(N.painterFor(f) as unknown as PeintreCeleste, a, d, d)
      voilerLAstre(f.color, a) // (la distance : ses couleurs se fondent dans celle du ciel)
      sp = { w: f.w, h: f.h, color: f.color }
      if (tamponsDesAstres.size >= 40) tamponsDesAstres.delete(tamponsDesAstres.keys().next().value as string)
      tamponsDesAstres.set(a.cle, sp)
    }
    const x0 = Math.round(a.x) - d
    const y0 = Math.round(a.y) - d
    for (let j = Math.max(0, -y0); j < Math.min(sp.h, H - y0); j++) {
      const ligne = (y0 + j) * W
      for (let i = Math.max(0, -x0); i < Math.min(sp.w, W - x0); i++) {
        const c = sp.color[j * sp.w + i]
        if (c >>> 24 !== 0) frame.color[ligne + x0 + i] = c
      }
    }
  }
  /** Le ciel : les astres du fond, trois couches d'étoiles en parallaxe (un astre les cache), puis la poussière du premier plan ; les nuées sont dans le fond (`cuireLeCiel`). */
  function dessinerLeCiel(p: Peintre): void {
    // les astres d'abord, du plus loin au plus proche ; une étoile qui tombe sur l'un d'eux ne se dessine pas
    const astres = astresVisibles(camera.x, camera.y, W, H, centreY(), parametres.has('astres'), graineDuVol) // (`&astres` : la vitrine, un astre de chaque sorte autour de la base)
    for (const a of astres) poserLAstre(a)
    const caches = astres.map((a) => ({ x: a.x, y: a.y, r2: rayonQuiCache(a) ** 2 })).filter((c) => c.r2 > 0)
    const cachee = (x: number, y: number): boolean => caches.some((c) => (x - c.x) * (x - c.x) + (y - c.y) * (y - c.y) < c.r2)
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
          if (cachee(x, y)) continue
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
    // ce qui vit sur les astres : la lueur et les grains du trou noir, les soleils qui scintillent
    for (const a of astres) animerAstre(p as unknown as PeintreCeleste, a, t)
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
  }

  /**
   * L'ALERTE DES BORDS, dessinée APRÈS les bandeaux (Keko, 13/11 : les effets qui colorent les bords « ne sont pas de la
   * même taille en fonction du bord » — les bandeaux et leur fondu repassaient sur certains bords et pas sur d'autres,
   * et les barres du haut et du bas couraient jusque dans les bandeaux de côté) : le même cadre de six pixels sur les
   * quatre bords DE LA VUE.
   */
  function dessinerLAlerte(p: Peintre): void {
    const du = t - toucheA
    const db = t - bouclierA
    const dernier = m.phase === 'vol' && m.coque <= 1
    const rouge = du < 0.3 ? 1 - du / 0.3 : dernier ? 0.3 + 0.18 * Math.sin(t * 5) : 0
    const bleu = db < 0.3 ? 1 - db / 0.3 : 0
    const force = Math.max(rouge, bleu)
    if (force <= 0) return
    const c = rouge >= bleu ? ROUGE[3] : VERRIERE[1]
    // (LE CADRE EST TRAMÉ À LA MAIN, EN MIROIR — Keko, 13/11 : « toujours plus épais à gauche et en haut » : la trame
    // d'un aplat translucide est calée sur le coin haut-gauche du tampon, ses points ne tombaient pas pareil sur les
    // bords opposés. Ici chaque point est décidé par sa profondeur depuis SON bord et sa place depuis SON coin : les
    // quatre bords sont le reflet l'un de l'autre.)
    const TRAME = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5]
    const x0 = bandeCote()
    const x1 = W - bandeCote()
    const y0 = bandeHaut()
    const y1 = H - bandeBas()
    const point = (x: number, y: number): void => {
      const dx = Math.min(x - x0, x1 - 1 - x)
      const dy = Math.min(y - y0, y1 - 1 - y)
      const k = Math.min(dx, dy)
      const a = force * (0.7 - k * 0.18)
      if (a > (TRAME[(k & 3) * 4 + (Math.max(dx, dy) & 3)] + 0.5) / 16) p.px(x, y, c)
    }
    // (quatre pixels d'épaisseur — six étaient trop, Keko, 13/11)
    for (let k = 0; k < 4; k++) {
      for (let x = x0 + k; x < x1 - k; x++) {
        point(x, y0 + k)
        point(x, y1 - 1 - k)
      }
      for (let y = y0 + k + 1; y < y1 - 1 - k; y++) {
        point(x0 + k, y)
        point(x1 - 1 - k, y)
      }
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
  function dessinerUnVaisseau(p: Peintre, corps: Vaisseau, flam: number, vise: number, allure: Allure, blanchi: boolean, rival: boolean, devie = 0): void {
    // (au pixel entier : entre deux pixels, la silhouette changerait à chaque image)
    const sx = Math.round(corps.x - camera.x + W / 2)
    const sy = Math.round(corps.y - camera.y + centreY())
    const ca = Math.cos(corps.cap)
    const sa = Math.sin(corps.cap)
    const ici = (x: number, y: number): [number, number] => [sx + x * ca - y * sa, sy + x * sa + y * ca]
    const cp = allure.propulseur
    const g = gabaritDe(allure.coque)
    if (flam > 0.02) {
      const [fx, fy] = ici(queueDe(allure.coque) - 0.5 * (cp - 1) - (1 + 3 * flam), 0)
      p.glow(fx, fy, 5 + 7 * flam + 2 * (cp - 1), rival ? FEU[4] : cp >= 3 ? ION[4] : FEU[5], 0.4 + 0.45 * flam + 0.08 * Math.sin(t * 9))
    }
    peindreFormes(p, formesDuVaisseau(allure, flam, t, vise, devie), sx, sy, 1, { cap: corps.cap, lumiere: LUMIERE_DU_VOL, blanc: blanchi ? 1 : 0, matieres: rival ? MATIERES_DU_RIVAL : undefined, rampes: rival ? undefined : rampesDuJoueur(), reflet: rival ? REFLET_DU_RIVAL : REFLET_DU_VOL })
    const [vx, vy] = ici(g.verriere, 0)
    p.glow(vx, vy, 4, rival ? VERRIERE_ENNEMIE[1] : VERRIERE[2], 0.3)
    // les feux de position, au bout des ailes : rouge à bâbord, vert à tribord ; le rival, deux feux d'ambre
    if (!blanchi && Math.floor(t * 1.5 + (rival ? 0.5 : 0)) % 2 === 0)
      for (const s of [-1, 1]) {
        const [ax, ay] = ici(g.feux.x, s * g.feux.y)
        const c = rival ? VERRIERE_ENNEMIE[2] : N.hex(s < 0 ? '#ff4a4a' : '#4aff7a')
        p.rect(Math.round(ax - 0.5), Math.round(ay - 0.5), 1, 1, N.WHITE)
        p.glow(ax, ay, 3, c, 0.8)
      }
    if (allure.bouclier > 0) p.ring(sx, sy, g.anneau, 1, VERRIERE[2], 0.25 + 0.35 * allure.bouclier * (0.75 + 0.25 * Math.sin(t * 6)))
  }

  /** La déviation de la flamme du joueur (voir `dessinerLeVaisseau`), et son cap à l'image d'avant. */
  let devieDeLaFlamme = 0
  let capVu = 0
  let virageVu = 0
  function dessinerLeVaisseau(p: Peintre): void {
    const vise = m.forage !== null ? Math.atan2(m.forage.y - v.y, m.forage.x - v.x) - v.cap : 0
    // (CHAQUE FOREUSE VISE SA ROCHE : son angle, depuis son pivot, par place d'outil)
    const vises: number[] = []
    CONF.foreuses.forEach((fo, j) => {
      const f = m.forages[j]
      if (f === null || f === undefined || fo.place === undefined) return
      const ox = v.x + fo.place.x * Math.cos(v.cap) - fo.place.y * Math.sin(v.cap)
      const oy = v.y + fo.place.x * Math.sin(v.cap) + fo.place.y * Math.cos(v.cap)
      vises[fo.outil] = Math.atan2(f.y - oy, f.x - ox) - v.cap
    })
    const blanchi = t - toucheA < 0.1 || m.phase === 'extrait' || t - arriveA < REFROIDI_A
    const al = { ...allureMontee(CONF.bouclier.points > 0 ? m.bouclier / CONF.bouclier.points : 0), vises }
    // LA FLAMME TRAÎNE (Keko, 13/11 : « que la flamme du réacteur se déplace un petit peu comme les particules sur les
    // côtés, au lieu d'être rigide ») : sa pointe se déporte à l'opposé du glissement de côté du vaisseau, et reste en
    // arrière quand il vire ; un ressort l'y amène et l'en ramène, un frémissement la fait vivre
    {
      let dCap = v.cap - capVu
      while (dCap > Math.PI) dCap -= 2 * Math.PI
      while (dCap < -Math.PI) dCap += 2 * Math.PI
      capVu = v.cap
      const omega = dtBase > 0.001 ? dCap / dtBase : 0
      const deCote = -v.vx * Math.sin(v.cap) + v.vy * Math.cos(v.cap)
      const cible = Math.max(-5, Math.min(5, -deCote * 0.035 + omega * 1.1)) + Math.sin(t * 23) * 0.3
      devieDeLaFlamme = ressort(devieDeLaFlamme, cible, 9)
      // (le virage, de −1 à 1 : il allume les jets du nez — voir plus bas)
      virageVu = ressort(virageVu, Math.max(-1, Math.min(1, omega / 4)), 14)
    }
    dessinerUnVaisseau(p, v, flamme, vise, al, blanchi, false, devieDeLaFlamme)
    // LES JETS DE MANŒUVRE : de courtes flammes froides, blanches au cœur et bleues au bout — DEUX AU NEZ, qui soufflent
    // vers l'avant quand on recule ; UNE PAR FLANC, qui souffle à l'opposé du côté où l'on glisse. Elles frémissent.
    {
      const sx = Math.round(v.x - camera.x + W / 2)
      const sy = Math.round(v.y - camera.y + centreY())
      const ca = Math.cos(v.cap)
      const sa = Math.sin(v.cap)
      /** Un jet : d'où il sort (repère du vaisseau), vers où il souffle, et sa force (0 à 1). */
      const jet = (x: number, y: number, dx: number, dy: number, force: number): void => {
        if (force < 0.12) return
        const L = (2 + 4 * force) * (0.8 + 0.2 * Math.sin(t * 55 + x * 3 + y))
        const x0 = sx + x * ca - y * sa
        const y0 = sy + x * sa + y * ca
        const ux = dx * ca - dy * sa
        const uy = dx * sa + dy * ca
        p.line(x0, y0, x0 + ux * L, y0 + uy * L, VERRIERE[1], 0.9)
        p.line(x0, y0, x0 + ux * L * 0.5, y0 + uy * L * 0.5, N.WHITE)
        p.glow(x0 + ux * L * 0.5, y0 + uy * L * 0.5, 3 + 2 * force, VERRIERE[1], 0.5 * force)
      }
      const gj = gabaritDe(al.coque)
      for (const cote of [-1, 1]) jet(gj.nez, cote * 2.2, 1, cote * 0.25, pousseeVue.retro)
      // (on glisse vers tribord — `cote` positif : c'est le flanc bâbord qui souffle, vers bâbord)
      jet(-1, -gj.flanc, -0.15, -1, Math.max(0, pousseeVue.cote))
      jet(-1, gj.flanc, -0.15, 1, Math.max(0, -pousseeVue.cote))
      // AU VIRAGE, un jet au flanc du nez, du côté EXTÉRIEUR — MAIS SEULEMENT QUAND LE REGARD TIENT LE NEZ (le second
      // manche, la souris). Keko, 13/11 : d'abord « à chaque virage, même sans le deuxième stick », puis, à l'essai :
      // « ça fait un peu bizarre » — d'un seul manche le nez tourne sans cesse, les jets clignotaient à chaque
      // correction de cap ; les jets de manœuvre sont réservés au pilotage à deux manches
      if (regardVoulu() !== undefined) {
        jet(gj.nez - 1.4, -2.6, 0.1, -1, Math.max(0, virageVu))
        jet(gj.nez - 1.4, 2.6, 0.1, 1, Math.max(0, -virageVu))
      }
    }
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
  function dessinerUnLaser(p: Peintre, depuis: Vaisseau, f: Forage, teintes: number[], cran: number, place: { x: number; y: number } = { x: 0, y: 0 }): void {
    // (il part de la bouche du canon dessiné : le pivot et la longueur sont ceux du peintre, lus, pas recopiés)
    const canon = canonDeLaForeuse(cran)
    const vise = Math.atan2(f.y - depuis.y, f.x - depuis.x)
    // (`place` : où la foreuse est montée sur cette coque, en décalage du milieu du toit)
    const x0 = depuis.x + Math.cos(depuis.cap) * (canon.pivot + place.x) - Math.sin(depuis.cap) * place.y + Math.cos(vise) * canon.bouche
    const y0 = depuis.y + Math.sin(depuis.cap) * (canon.pivot + place.x) + Math.cos(depuis.cap) * place.y + Math.sin(vise) * canon.bouche
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
    // (UN RAYON PAR FOREUSE, de sa place à sa roche)
    if (m.phase === 'vol') {
      if (CONF.foreuses.length === 0) {
        if (m.forage !== null) dessinerUnLaser(p, v, m.forage, LASER, Math.max(1, foreuseMontee(hangar)?.cran ?? 1), placeDOutil(monteeA(hangar, 'coque').cran, placeDeLaForeuse()))
      } else
        CONF.foreuses.forEach((fo, j) => {
          const f = m.forages[j]
          if (f !== null && f !== undefined) dessinerUnLaser(p, v, f, LASER, fo.cran, placeDOutil(monteeA(hangar, 'coque').cran, fo.outil))
        })
    }
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
        if (base) {
          // (l'arrière de la base est plus loin : il ne suit qu'une part de la caméra — la parallaxe qui dit la profondeur)
          dessinerBase(p, sx, sy, t, aQuai, TEINTES_STATION, { x: (camera.x - st.x) * RECUL_DE_LA_BASE, y: (camera.y - st.y) * RECUL_DE_LA_BASE })
          // L'OMBRE DU VAISSEAU SUR LE PONT : il vole AU-DESSUS (Keko : « que le joueur comprenne qu'il peut voler
          // au-dessus ») — une tache sombre décalée à l'opposé de la lampe, tant qu'elle tombe sur le pont
          const ox = v.x - camera.x + W / 2 + 4
          const oy = v.y - camera.y + centreY() + 5
          if (m.phase === 'vol' && t - arriveA >= ARRIVE_A && Math.hypot(ox - sx, oy - sy) < 22) p.poly(ovale(ox, oy, 5, 6, 12), TEINTES_STATION.acier[0], 0.6)
        }
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
          // LE COMPTE FRAPPE, COMME LE « COUNTDOWN » DU DÉPÔT (Keko, 11/11 : « quand on est sur l'extracteur, on peut
          // utiliser une animation du style countdown de pixelfx ? elle est plus punchy ») : l'arc d'or reste (c'est la
          // charge, sur dix secondes) ; chaque SECONDE qui tombe est une FRAPPE — le chiffre arrive énorme et blanc et
          // retombe à sa taille sur un ressort raide, en tremblant ; l'arc blanchit, un cadre chauffé à blanc emplit
          // l'anneau deux images, une onde de choc en part, quatorze étincelles giclent de son tour ; dix GRADUATIONS
          // (une par seconde) s'allument au passage de la tête. Au bout, l'anneau ÉCLATE en onde de choc et « EXTRACTION »
          // frappe dans une couronne de rayons. Hors du parvis, le compte redescend sans frapper.
          const TAU = Math.PI * 2
          const monte = compteMonte && m.phase === 'vol'
          const battement = Math.floor(m.extraction + 1e-6)
          const ub = monte ? m.extraction - battement : 1
          const yMot = sy - CONF.station.portee - 20
          const mondeX = (x: number): number => x - W / 2 + camera.x
          const mondeY = (y: number): number => y - centreY() + camera.y
          const nt = Math.round(CONF.extraction.duree)
          for (let k = 0; k < nt; k++) {
            const an = a0 + (k / nt) * TAU
            const pres = u < 1 && Math.abs(an - a1) < 0.2
            const ca = Math.cos(an)
            const sa = Math.sin(an)
            p.line(sx + ca * (r + 5), sy + sa * (r + 5), sx + ca * (r + 8), sy + sa * (r + 8), (monte && ub < 0.07) || pres ? N.WHITE : an <= a1 + 1e-6 ? PEPITE[3] : COQUE[2])
          }
          if (monte && ub < 0.3) {
            const rk = ub / 0.3
            p.ring(sx, sy, r + 6 + 22 * sortie(rk), 1.5 * (1 - rk) + 1, rk < 0.3 ? N.WHITE : PEPITE[3], Math.min(1, 1.3 * (1 - rk)))
          }
          if (monte && ub < 0.07) {
            p.arc(sx, sy, r, 3, a0, a1, N.WHITE)
            p.ring(sx, sy, r - 5, ub < 0.035 ? 4 : 2, ub < 0.035 ? N.WHITE : PEPITE[4], ub < 0.035 ? 0.9 : 0.6)
          }
          if (monte && battement !== battementVu) {
            battementVu = battement
            for (let k = 0; k < 14; k++) {
              const an = (k / 14) * TAU + R.range(-0.1, 0.1)
              const vit = R.range(40, 110)
              etincelles.ajouter('etincelle', mondeX(sx + Math.cos(an) * (r + 2)), mondeY(sy + Math.sin(an) * (r + 2)), Math.cos(an) * vit, Math.sin(an) * vit, R.range(0.15, 0.35), R.next() < 0.5 ? N.WHITE : PEPITE[3], 1, 2)
            }
          }
          if (m.phase === 'extrait') {
            p.glow(sx, sy, CONF.station.portee * 1.6, PEPITE[2], 0.5 + 0.2 * Math.sin(t * 6))
            // l'anneau éclate : l'onde de choc, une seconde onde, les étincelles, puis le mot dans ses rayons
            const ue = t - perduA
            if (battementVu !== 999) {
              battementVu = 999
              for (let k = 0; k < 36; k++) {
                const an = R.range(0, TAU)
                const vit = R.range(60, 170)
                etincelles.ajouter('etincelle', mondeX(sx + Math.cos(an) * r), mondeY(sy + Math.sin(an) * r), Math.cos(an) * vit, Math.sin(an) * vit, R.range(0.2, 0.5), R.next() < 0.4 ? N.WHITE : R.next() < 0.5 ? PEPITE[3] : PEPITE[2], 1, 2)
              }
            }
            const bk = ue / 0.4
            if (bk >= 0 && bk < 1) p.ring(sx, sy, r + 4 + 30 * sortie(bk), Math.max(1, 6 * (1 - bk)), bk < 0.2 ? N.WHITE : PEPITE[3], Math.min(1, 1.4 * (1 - bk)))
            const ik = (ue - 0.05) / 0.3
            if (ik > 0 && ik < 1) p.ring(sx, sy, r + 22 * sortie(ik), 1, PEPITE[3], Math.min(1, 1.2 * (1 - ik)))
            if (ue >= 0 && ue < 1.35) {
              const rk = Math.min(1, ue / 0.18) * (ue > 1.05 ? Math.max(0, 1 - (ue - 1.05) / 0.3) : 1)
              for (let k = 0; k < 18; k++) {
                const an = (k / 18) * TAU + ue * 0.35
                const ca = Math.cos(an)
                const sa = Math.sin(an)
                const r0 = 1 / Math.sqrt((ca / (largeurDe('EXTRACTION', GRAS) + 6)) ** 2 + (sa / 14) ** 2) + 3 * rk // (l'ovale du mot, à l'échelle 2)
                const r1 = r0 + (k % 2 === 0 ? 26 : 13) * 0.7 * rk
                if (rk > 0.02) p.line(sx + ca * r0, yMot + sa * r0, sx + ca * r1, yMot + sa * r1, k % 2 === 0 ? PEPITE[3] : PEPITE[2], 0.9 * rk)
              }
              const tremble = ue < 0.3 ? 4 * (1 - ue / 0.3) : 0
              p.glow(sx, yMot, 46, PEPITE[2], 0.25 + (ue < 0.12 ? 0.7 * (1 - ue / 0.12) : 0))
              motFrappe(p, 'EXTRACTION', sx + Math.round(Math.sin(t * 90) * tremble), yMot + Math.round(Math.cos(t * 77) * tremble), (2 + 0.45 * Math.exp(-ue * 26) * Math.cos(ue * 38)) * rk ** 0.2, ue < 0.035 ? 1 : ue < 0.07 ? 0.4 : 0)
            }
          } else {
            // le chiffre : énorme et blanc une image, puis le ressort ; il tremble 0,22 s
            // (À L'ÉCHELLE 2, plus 3 — Keko, 12/11 : « une grosse différence entre le mot extraction et les chiffres du
            // countdown, ils sont trop gros » ; le mot qu'il remplace est à l'échelle 1)
            const reste = CONF.extraction.duree - m.extraction
            const tremble = monte && ub < 0.22 ? 3 * (1 - ub / 0.22) : 0
            p.glow(sx, yMot, 26, PEPITE[2], 0.2 + (monte && ub < 0.12 ? 0.6 * (1 - ub / 0.12) : 0))
            motFrappe(p, String(Math.ceil(reste)), sx + Math.round(Math.sin(t * 90) * tremble), yMot + Math.round(Math.cos(t * 77) * tremble), monte ? 2 + 1.1 * Math.exp(-ub * 26) * Math.cos(ub * 38) : 2, monte ? (ub < 0.035 ? 1 : ub < 0.07 ? 0.4 : 0) : 0)
          }
        } else if (laProche) {
          battementVu = -1
          // « ZONE D'EXTRACTION », au-dessus du parvis, gris bleuté (Keko, 12/11 : « afin d'aider le joueur à
          // comprendre ») : tant que le compte ne court pas ; dès qu'il court, le chiffre prend sa place
          // (Keko, ensuite : « juste le mot extraction avec une flèche qui pointe vers en dessous », sans barre ; un
          // fond sombre reste sous le mot : le mât de la base passe juste derrière)
          if (m.phase === 'vol' && m.sorti) { // (pas avant d'avoir quitté le parvis une première fois — Keko : on y naît, le compte n'y court pas encore)
            // (EN RELIEF — Keko, 12/11 : « le mot extraction manque de texture » : la lettre grasse des titres de fiche, un
            // acier bleuté éclairé d'en haut, ombré dessous, cerné de sombre, qu'un éclat traverse de temps en temps ; la
            // flèche a les trois mêmes tons)
            const mot = 'Extraction'
            const wm = largeurDe(mot, GRAS)
            const ym = sy - CONF.station.portee - 18
            const c = (t % 4) / 4
            motEnRelief(p, mot, sx, ym, false, GRAS, c < 0.16 ? -8 + (c / 0.16) * (wm + 20) : null)
            // la flèche, sous le mot, qui descend et remonte d'un pixel
            const yf = ym + 11 + (Math.floor(t * 3) % 2)
            for (let k = 0; k < 6; k++) p.rect(Math.round(sx) - 5 + k, yf - 1 + k, 11 - 2 * k, 1, N.hex('#07050d'))
            for (let k = 0; k < 4; k++) p.rect(Math.round(sx) - 3 + k, yf + k, 7 - 2 * k, 1, k === 0 ? COQUE[5] : k === 1 ? COQUE[4] : N.hex('#57698c'))
          }
        }
      }
  }

  /**
   * LE BAS DE L'INTERFACE DU HAUT (la plaque de soute, puis les pastilles du porté) : les flèches du bord restent
   * dessous, pour ne jamais passer sous une plaque.
   */
  const BAS_DU_HUD = 5 + 18 + 7 + 13 // (7 : le pied du pupitre — son filet, son cerne — entre les plaques et le porté)
  /**
   * LA VUE DU VOL EST FIXE : 180 × 320, sur tous les écrans (Keko, 11/11 : « selon le portable ou l'écran de PC, la zone
   * visible de l'espace en jeu est différente » — le tampon prenait la hauteur de l'écran, de 320 à 480 : un grand
   * téléphone voyait moitié plus d'espace en haut et en bas qu'un petit). Le monde se dessine autour de `centreY`, le
   * milieu de la vue ; ce qui dépasse des 320 de la vue est couvert par DEUX BANDEAUX, en haut et en bas, donnés à l'interface :
   * celui du haut porte la soute, le porté et la coque (posés juste au-dessus de la vue dès qu'il est assez haut — sinon
   * en haut de l'écran, sur la vue, comme avant), celui du bas est la place du pouce. Les pixels restent entiers.
   */
  const VUE_PORTRAIT = 320
  /** La hauteur de la vue du vol (320 debout, 180 couché), et sa largeur couchée ; les bandeaux de côté en paysage. */
  const vueH = (): number => (paysage ? 180 : VUE_PORTRAIT)
  const bandeCote = (): number => (paysage ? Math.max(0, Math.floor((W - 320) / 2)) : 0)
  /** L'interface du vol est dans les bandeaux de côté (couché, et s'ils sont assez larges) : la vue est alors libre. */
  const interfaceEnBande = (): boolean => paysage && bandeCote() >= 30
  /**
   * Le partage du surplus : LE HAUT D'ABORD, jusqu'à la hauteur de l'interface (la soute et le porté tiennent alors
   * entiers dans leur bandeau, la limite de la vue ne les coupe pas — Keko : « la ligne tombe sur le conteneur de la
   * soute ») ; au-delà, moitié-moitié. Le centre de la vue n'est donc plus toujours celui du tampon : `centreY`.
   */
  const bandeHaut = (): number => {
    // (en paysage, pas de bandeau en haut : la vue monte jusqu'au bord, la hauteur en trop va en bas, sous les pouces)
    if (paysage) return 0
    const surplus = Math.max(0, H - vueH())
    return Math.max(Math.min(surplus, BAS_DU_HUD + 4), Math.floor(surplus / 2))
  }
  const bandeBas = (): number => Math.max(0, H - vueH()) - bandeHaut()
  /** Le centre de la vue dans le tampon (là où se dessine le point que vise la caméra). */
  function centreY(): number {
    return bandeHaut() + Math.min(H, vueH()) / 2
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
    // (DISCRETS, DE NOUVEAU : habillés d'acier grenu et d'un filet le 13/11, ils « attiraient l'œil et donnaient
    // l'impression d'un jeu encore plus petit » — Keko, le jour même : « c'était mieux en noir »)
    if (h > 0) {
      p.rect(0, 0, W, h, FOND)
      for (let k = 0; k < 4; k++) p.rect(0, h + k, W, 1, FOND, 0.55 - k * 0.13)
    }
    if (b > 0) {
      p.rect(0, H - b, W, b, FOND)
      for (let k = 0; k < 4; k++) p.rect(0, H - b - 1 - k, W, 1, FOND, 0.55 - k * 0.13)
    }
    // (en paysage : les deux bandeaux de côté, la place des pouces)
    const cote = bandeCote()
    if (cote > 0) {
      for (let y = 0; y < H; y++) {
        frame.light.fill(0, y * W, y * W + cote)
        frame.light.fill(0, y * W + W - cote, (y + 1) * W)
      }
      p.rect(0, 0, cote, H, FOND)
      p.rect(W - cote, 0, cote, H, FOND)
      for (let k = 0; k < 4; k++) {
        p.rect(cote + k, 0, 1, H, FOND, 0.55 - k * 0.13)
        p.rect(W - cote - 1 - k, 0, 1, H, FOND, 0.55 - k * 0.13)
      }
    }
  }
  /** LA PLAQUE DE LA POSTCOMBUSTION, en bas à gauche de la vue (si elle est débloquée) : d'or quand elle est prête, sa recharge en barre ; une tape la lance aussi. */
  function dessinerLaPlaqueDeLaPostcombustion(p: Peintre): void {
    if (!CONF.postcombustion.active || m.phase !== 'vol') return
    const r = rechargeDeLaPostcombustion(CONF, m)
    const pret = r >= 1
    const w = 40
    const h = 15
    const x = 4
    const y = H - bandeBas() - h - 5
    plaque(p, x, y, w, h, pret ? 'or' : 'encre')
    p.text('BOOST', x + w / 2, y + 3, pret ? N.WHITE : COQUE[3], { align: 'center' })
    p.rect(x + 3, y + h - 5, w - 6, 2, MATIERES.creux.contour)
    p.rect(x + 3, y + h - 5, Math.round((w - 6) * r), 2, pret ? N.hex('#fff2a8') : ION[3])
    zone(x - 4, y - 6, w + 8, h + 11, lancerLaPostcombustion, null)
  }
  /**
   * LA BARRE DES CAPACITÉS, en bas à droite de la vue (Keko, 12/11 : « je voyais plutôt la capacité comme des carrés
   * avec une icône et le nombre de charges en chiffre ; ainsi on peut en loger quatre en bas à droite de l'écran ») :
   * QUATRE CASES CARRÉES. Une capacité montée : son icône, et ses charges EN CHIFFRE dans le coin ; ARMÉE, la case passe
   * à l'or et bat ; sans charge, elle s'éteint. Une case libre ne se montre pas. (Une seule capacité existe : la bombe
   * d'essai, tout à droite.) Et, pendant qu'on vise, la flèche qui part du vaisseau.
   */
  function dessinerLaCapacite(p: Peintre): void {
    if (m.phase !== 'vol') return
    p.place(0, 0)
    const COTE = 20
    const CASES = 4
    const y = H - bandeBas() - COTE - 5
    const reste = m.charges
    if (reste <= 0) capaciteArmee = false
    // (LES CASES LIBRES NE SE MONTRENT PAS — Keko, 12/11 : « masquer les slots de capacité vides » ; les capacités montées
    // se rangent contre le bord droit, la première tout à droite ; il y a place pour `CASES`)
    // (AUCUNE POUR L'INSTANT : la bombe d'essai est retirée — Keko, 12/11 : « tu peux enlever la capacité bombe et ses
    // charges infinies » ; le geste est jugé. Tout le reste est gardé pour la première vraie capacité : la barre, l'armement,
    // la visée à droite, la flèche, et la règle de la bombe dans `jeu.ts`.)
    const MONTEES: number = 0
    if (MONTEES === 0) capaciteArmee = false
    for (let i = 0; i < Math.min(CASES, MONTEES); i++) {
      const x = W - 4 - (i + 1) * COTE - i * 2
      const armee = capaciteArmee
      const bat = armee && Math.floor((t - armeeA) * 5) % 2 === 0
      if (armee) p.glow(x + COTE / 2, y + COTE / 2, 22, PEPITE[2], 0.25 + 0.15 * Math.sin(t * 8))
      plaque(p, x, y, COTE, COTE, reste <= 0 ? 'eteint' : armee ? 'or' : 'acier', { bord: bat ? N.WHITE : undefined })
      // la bombe : un rond sombre, sa mèche, une étincelle
      const bx = x + 8
      const by = y + 10
      p.circle(bx, by, 5, MATIERES.encre.contour)
      p.circle(bx, by, 4, reste <= 0 ? COQUE[2] : N.hex('#3a3350'))
      p.rect(bx - 2, by - 3, 2, 1, reste <= 0 ? COQUE[3] : N.hex('#8a80a8'))
      p.rect(bx + 2, by - 6, 1, 2, MATIERES.encre.contour)
      if (reste > 0) p.rect(bx + 3, by - 7, 1, 1, Math.floor(t * 8) % 2 === 0 ? N.hex('#fff2a8') : FEU[3])
      // ses charges, en chiffre, dans le coin
      ecrire(p, String(reste), x + COTE - 2, y + COTE - 9, reste <= 0 ? COQUE[3] : N.hex('#fff2c8'), { police: GRAS, align: 'right', contour: MATIERES.encre.contour })
      if (reste > 0 && !souteOuverte && t - arriveA >= ARRIVE_A) zone(x - 1, y - 6, COTE + 2, COTE + 11, () => ((capaciteArmee = !capaciteArmee), (armeeA = t)), 'onglet')
    }
    // LA VISÉE : UNE FLÈCHE D'OR QUI PART DU VAISSEAU (Keko, 12/11 : « on ne devrait pas faire partir la flèche de
    // l'endroit où se trouve le pouce, mais du vaisseau, dans le sens de visée, et envoyer la bombe plus ou moins loin en
    // fonction du niveau dans lequel le joueur pousse ») : dans le sens du glissement, LONGUE COMME LA BOMBE IRA LOIN ;
    // au bout, le cercle où elle éclatera. Sans glissement : droit devant le nez, à mi-portée.
    if (regard !== null && regard.tir) {
      const d = regardVoulu()
      const n = d === undefined ? 0 : Math.hypot(d.x, d.y)
      const ux = n > 0.05 ? d!.x / n : Math.cos(v.cap)
      const uy = n > 0.05 ? d!.y / n : Math.sin(v.cap)
      const sx = v.x - camera.x + W / 2
      const sy = v.y - camera.y + centreY()
      const portee = porteeDeLaBombe(CONF, d)
      const cerne = N.hex('#2a1404')
      const x0 = sx + ux * 10
      const y0 = sy + uy * 10
      const bx = sx + ux * portee
      const by = sy + uy * portee
      for (const [e, c] of [[5, cerne], [3, PEPITE[2]], [1, N.hex('#fff2a8')]] as const) {
        for (let k = -(e - 1) / 2; k <= (e - 1) / 2; k++) p.line(x0 - uy * k, y0 + ux * k, bx - ux * 5 - uy * k, by - uy * 5 + ux * k, c)
      }
      const aile = (k: number, recul: number): [number, number] => [bx - ux * recul - uy * k, by - uy * recul + ux * k]
      p.poly([[bx + ux * 3, by + uy * 3], aile(7, 8), aile(-7, 8)], cerne)
      p.poly([[bx + ux * 1, by + uy * 1], aile(5, 7), aile(-5, 7)], PEPITE[2])
      p.poly([[bx + ux * 1, by + uy * 1], aile(5, 7), [bx - ux * 7, by - uy * 7]], PEPITE[3])
      p.glow(bx, by, 10, PEPITE[2], 0.5)
      p.ring(bx, by, CONF.bombe.rayon, 1, PEPITE[2], 0.35 + 0.2 * Math.sin(t * 9))
    }
  }
  /** Les bombes en vol : un rond sombre qui tourne sur lui-même, sa mèche qui crache. */
  function dessinerLesBombes(p: Peintre): void {
    p.place(W / 2 - camera.x, centreY() - camera.y)
    for (const b of m.bombes) {
      p.circle(b.x, b.y, 3, MATIERES.encre.contour)
      p.circle(b.x, b.y, 2, N.hex('#3a3350'))
      p.px(b.x - 1, b.y - 1, N.hex('#8a80a8'))
      p.glow(b.x, b.y, 8, FEU[3], 0.7)
      if (R.next() < 0.7) etincelles.ajouter('etincelle', b.x, b.y, -b.vx * 0.2 + R.range(-20, 20), -b.vy * 0.2 + R.range(-20, 20), R.range(0.15, 0.35), R.next() < 0.5 ? FEU[4] : N.hex('#fff2a8'), 1, 2)
    }
    p.place(0, 0)
  }
  /** Le point du bord de l'écran dans la direction (dx, dy) depuis son centre ; `null` si la cible est à l'écran. */
  function auBord(dx: number, dy: number): { x: number; y: number } | null {
    const marge = 10
    // (COUCHÉ, LES FLÈCHES VONT AUX BORDS DE L'ÉCRAN — Keko, 13/11 : elles restaient au bord de la vue, à cinquante pixels
    // du bord de l'écran, et sous la place de l'interface du haut, qui n'y est plus : sur les côtés elles sont dans les
    // bandeaux, contre le bord — si le bandeau est assez large pour qu'elles ne mordent pas la soute et le blindage ; en
    // haut, au bord de la vue)
    const cote = interfaceEnBande() && bandeCote() >= 44 ? W / 2 - 7 : W / 2 - bandeCote() - marge
    // (dans la vue : sous l'interface du haut ou le bandeau, au-dessus du bandeau du bas)
    const haut = centreY() - (interfaceEnBande() ? bandeHaut() : Math.max(bandeHaut(), basDuHud())) - 9
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
   * afficher les ressources déjà extraites ») : le total ne se lit qu'aux écrans de fin. EN HAUT À DROITE, LE BLINDAGE :
   * une barre d'or à cases et, dessous, les cellules bleues du bouclier — un coup s'y joue comme le « health bar hit »
   * du dépôt (voir plus bas) ; au dernier point, tout passe au rouge. Le tout TOMBE en place à l'arrivée.
   */
  function dessinerLeScore(p: Peintre): void {
    const yHud = hautDuHud() - Math.round((1 - sortie((t - arriveA - 0.25) / 0.4)) * (basDuHud() + 4))
    const IVOIRE = N.hex('#fff2c8')
    const encre = MATIERES.encre.contour
    // LE PORTÉ NE MONTRE QUE CE QU'ON VIENT DE RAMASSER (Keko, 12/11 : « affiche les minerais ramassés récemment et
    // après quelques secondes on les fait disparaître » — à dix minerais, la rangée ne tiendrait pas) : une pastille
    // paraît quand une pépite de son minerai vole vers elle, reste TENUE_DU_PORTE secondes après la dernière, se
    // referme et s'en va ; le détail entier reste dans la soute
    const visibles = MINERAIS.filter((k) => envols.some((e) => e.minerai === k) || (affiche[k] > 0 && t - allumeA[k] < TENUE_DU_PORTE))
    for (const k of MINERAIS)
      if (!visibles.includes(k)) {
        delete xDuPorte[k]
        recents[k] = 0
      }
    // (LE NOMBRE DE LA PASTILLE EST CE QU'ON VIENT DE RAMASSER, « +3 », pas le total porté de ce minerai — Keko, 12/11 ;
    // il repart de zéro quand la pastille s'en va ; le total est sur la plaque de soute, le détail dans la soute)
    const ditRecent = (k: Minerai): string => (recents[k] > 0 ? `+${recents[k]}` : '')
    // les places des pastilles du porté, de gauche à droite, larges de leur nombre
    // DANS LES BANDEAUX DE CÔTÉ, EN BARRES VERTICALES (Keko, 13/11 : « pourquoi on ne met pas l'UI — la soute à gauche
    // et la vie à droite — dans les bandes ? quand c'est possible, sinon on le met sur l'écran », puis, sur des plaques
    // horizontales réarrangées : « je pensais à des barres verticales ») : à gauche LA SOUTE, une jauge debout sur son
    // bouton ; à droite LE BLINDAGE, une barre debout à cases, le bouclier en colonne à côté. Plus rien sur la vue. Trop
    // étroits (voir `interfaceEnBande`), l'interface reste sur la vue, en plaques, comme avant.
    const enBande = interfaceEnBande()
    // (LE CREUX DES BARRES EST UN ACIER BLEUTÉ, PAS DU NOIR — Keko, 13/11 : vide, une barre se perdait sur le fond sombre,
    // avec ou sans plaque derrière : la partie vide se lit maintenant sur le noir des bandeaux comme sur le ciel)
    const CREUX_DES_BARRES = [N.hex('#465679'), N.hex('#2f3b58')]
    const H_BARRE = 64
    // (sans pupitre derrière elles, les plaques éteignent elles-mêmes la lumière du monde sous elles : les feux de la
    // base passaient à travers)
    const eteindreSous = (x: number, y: number, w: number, h: number): void => {
      for (let yy = Math.max(0, y); yy < Math.min(H, y + h); yy++) frame.light.fill(0, yy * W + Math.max(0, x), yy * W + Math.min(W, x + w))
    }
    const yPastilles = enBande ? yHud + H_BARRE + 26 : yHud + 18 + 7
    /** La largeur de la plaque de soute couchée sur le pupitre : celle du logement du blindage, en face. */
    const L_SOUTE = 5 + 9 + 3 + 52 + 5
    // LE PUPITRE DU VOL (Keko, 12/11 : « retravailler l'interface en vol, en particulier la zone du haut, avec le
    // blindage, le bouclier et la soute — un rendu plus travaillé, plus professionnel, avec de la texture, en gardant
    // l'animation de dégâts du blindage ; un panneau supérieur cohérent dans le style du jeu et entre ses éléments ; et
    // que l'on comprenne bien que la soute est un bouton cliquable ») : LE MÊME PUPITRE QUE L'EN-TÊTE DE LA BASE — un
    // étage d'acier sombre, grenu, éclairé d'en haut, fermé d'un filet gris ; il monte jusqu'en haut de l'écran. Dedans,
    // à gauche LA SOUTE, un vrai bouton (voir plus bas) ; à droite LE BLINDAGE ET LE BOUCLIER dans un logement creusé.
    // EN PAYSAGE, LE PUPITRE N'A PAS DE MILIEU (Keko, 13/11 : « la barre en haut est vide au milieu, on devrait retirer
    // la partie centrale pour libérer de la visibilité ») : deux morceaux, un sous la soute, un sous le blindage, fermés
    // d'un filet sur leur bord intérieur ; entre les deux, le ciel.
    {
      const yb = yHud + 22
      const morceau = (x0: number, x1: number): void => {
        for (let y = 0; y <= Math.min(H - 1, yb); y++) frame.light.fill(0, y * W + x0, y * W + x1)
        p.rect(x0, 0, x1 - x0, yb, N.hex('#17131f'))
        for (let y = Math.max(2, yb - 26); y < yb - 2; y++) for (let x = x0; x < x1; x++) {
          const g = grainA(x, y)
          if (g > 0.9) p.rect(x, y, 1, 1, N.hex('#201a2c'))
          else if (g < 0.06) p.rect(x, y, 1, 1, N.hex('#120f19'))
        }
        p.rect(x0, 0, x1 - x0, 1, N.hex('#322b47'))
        p.rect(x0, 1, x1 - x0, 1, N.hex('#1f1a2b'))
        p.rect(x0, yb - 1, x1 - x0, 1, N.hex('#4c4468'))
        p.rect(x0, yb, x1 - x0, 1, MATIERES.encre.contour)
        p.rect(x0, yb + 1, x1 - x0, 1, NUIT_OMBRE, 0.6)
        p.rect(x0, yb + 2, x1 - x0, 1, NUIT_OMBRE, 0.3)
        // (le bord intérieur d'un morceau : le filet tourne, cerné)
        for (const [xe, dedans] of [[x0, 1], [x1 - 1, -1]] as const) {
          if (xe <= 0 || xe >= W - 1) continue
          p.rect(xe, 0, 1, yb, N.hex('#4c4468'))
          p.rect(xe - dedans, 0, 1, yb + 1, MATIERES.encre.contour)
        }
      }
      if (enBande) {
        // (rien : les bandeaux portent l'interface)
      } else if (paysage) {
        morceau(0, 4 + L_SOUTE + 5)
        morceau(W - 5 - (5 + 9 + 3 + 52 + 5) - 5, W)
      }
      // (DEBOUT, PLUS DE PUPITRE — Keko, 13/11 : « enlève le fond en haut, le noir est plus discret qu'un rectangle » :
      // la soute et le blindage sont posés sur le noir du bandeau)
    }
    const places = new Map<Minerai, { x: number; w: number; y: number }>()
    let suivante = 5
    for (const [rang, k] of visibles.entries()) {
      const w = 14 + largeurDe(ditRecent(k), GRAS) + 5
      if (enBande) {
        // (empilées sous la soute, dans le bandeau)
        places.set(k, { x: 3, w, y: yPastilles + rang * 15 })
        continue
      }
      // (elle glisse vers sa place ; neuve, elle y naît)
      const vu = xDuPorte[k] ?? suivante
      const x = Math.abs(suivante - vu) < 0.5 ? suivante : vu + (suivante - vu) * 0.25
      xDuPorte[k] = x
      places.set(k, { x: Math.round(x), w, y: yPastilles })
      suivante += w + 2
    }

    // ---- la soute
    const porte = MINERAIS.reduce((n, k) => n + affiche[k], 0)
    const pleine = porte >= CONF.capacite
    if (pleine && !soutePleineVue && t - arriveA > 0.9) {
      ;(ressorts.soute ??= { x: 0, v: 0 }).v = -110
      soutePleineDiteA = t
      if (typeof navigator.vibrate === 'function') navigator.vibrate([20, 40, 20])
    }
    soutePleineVue = pleine
    // … ET LE REDIT CHAQUE FOIS QU'ON TOUCHE UNE PÉPITE LA SOUTE PLEINE (Keko, 12/11), au même endroit : au contact
    // (la pépite reste là, la règle ne la ramasse pas), puis une fois par seconde tant qu'on reste dessus
    const refus = pleine && m.phase === 'vol' && m.pepites.some((q) => Math.hypot(q.x - m.vaisseau.x, q.y - m.vaisseau.y) <= CONF.forage.ramassage + MARGE_DU_REFUS)
    if (refus && (!refusVu || t - refusA > 1)) {
      refusA = t
      ;(ressorts.soute ??= { x: 0, v: 0 }).v = -70
      soutePleineDiteA = t
    }
    refusVu = refus
    // (LE MOT NE MONTE PAS — Keko : « mets juste le texte à son emplacement direct » : posé sous la plaque de soute, à
    // la place des pastilles, une seconde et quelque)
    if (t - soutePleineDiteA < 1.3) ecrire(p, 'Soute pleine', enBande ? bandeCote() + 4 : suivante + 2, enBande ? yHud + 2 : yPastilles + 3, ROUGE[5], { police: GRAS, contour: NUIT_OMBRE })
    // LA SOUTE EST UN BOUTON, ET ÇA SE VOIT : une plaque d'acier EN RELIEF sur le pupitre — elle s'enfonce sous le doigt —
    // avec, soudée à son bout droit, UNE TOUCHE D'OR au chevron sombre : la même touche que le retour des pages du
    // hangar, la langue de ce qui se tape. Dessus : « Soute », ce qu'on porte sur ce qu'on peut (en relief ivoire, rouge
    // quand elle est pleine), et sa jauge d'or dans une rainure. Toute la plaque — avec la rangée du porté dessous, pour
    // une cible assez haute au doigt — ouvre la soute.
    const actif = m.phase === 'vol' && !souteOuverte && t - arriveA >= ARRIVE_A
    souteVue = ressort(souteVue, Math.min(1, porte / CONF.capacite))
    // LE SYMBOLE DE LA SOUTE (Keko, 13/11 : « créer un symbole comme pour le blindage — on remplace le mot soute par ça
    // en portrait et on l'ajoute en paysage ») : UNE CAISSE d'or — son couvercle clair, son corps, un fermoir sombre au
    // milieu —, cernée ; rouge quand la soute est pleine.
    const dessinerLaCaisse = (x: number, y: number): void => dessinerLaCaisseDeSoute(p, x, y)
    // PLUS DE CHIFFRES SUR LA SOUTE (Keko, 13/11 : « on va supprimer l'affichage des chiffres de la soute dans la barre —
    // on l'a déjà quand on l'ouvre, ça suffit ; on garde le symbole, la barre et la petite flèche qui indique qu'on peut
    // cliquer, on condense et on repense l'agencement pour un truc stylisé et harmonieux, en portrait comme en
    // paysage ») : LA SOUTE EST LE MIROIR DU BLINDAGE — la même plaque (mêmes dimensions), son symbole au même endroit
    // que l'écusson, une jauge du même gabarit que la barre de blindage (un creux cerné, l'or clair d'un côté, sombre de
    // l'autre), et au bout SA TOUCHE D'OR au chevron.
    // (LA TOUCHE EST EN ACIER CLAIR, sa flèche bleue sur bleu nuit — les tons du conteneur ; elle ne change pas, soute
    // pleine ou pas)
    // (PLUS DE PLAQUE DE FOND, ni ici ni sous le blindage — Keko, 13/11 : « essaie de supprimer les rectangles qui
    // contiennent les PV et la soute » : le symbole, la barre cernée et la touche sont posés tels quels)
    // (… ET PLEINE, ELLE LE SIGNALE SANS ROUGE — Keko, 13/11 : « un petit effet, mais pas rouge, sur la barre de soute
    // pleine » : son cerne devient clair et respire, et un reflet blanc la parcourt toutes les deux secondes)
    const cerneDeLaSoute = pleine ? (Math.sin(t * 4) > 0 ? COQUE[6] : COQUE[5]) : encre
    const reflet = pleine ? (t % 1.8) / 0.5 : 2
    // (LA JAUGE EST VIOLETTE — Keko, 13/11 : « une autre couleur pour la barre de la soute quand elle se remplit, le jaune
    // est déjà utilisé pour le blindage » ; ni l'or du blindage, ni le bleu du bouclier, ni le rouge de l'alerte)
    // (… PUIS GRISE, le gris de la soute pleine, sans son effet — Keko, 13/11, après le violet : pleine, c'est le cerne
    // clair et le reflet qui le disent)
    const SOUTE = [COQUE[3], COQUE[4], COQUE[5]]
    // (PLEINE, LA JAUGE EST GRISÉE — Keko, 13/11 : « en grisé plutôt que rouge », et plus de bord qui rougit sur la plaque ;
    // le mot « Soute pleine » reste rouge)
    if (enBande) {
      // DEBOUT : la plaque du blindage d'en face — le symbole en tête, la jauge qui se remplit par le bas, la touche au pied
      const pw = 22
      const x0 = Math.round(bandeCote() / 2) - 11
      const hp = H_BARRE + 22
      const HG = H_BARRE - 13
      const eb = actif ? etatDuBouton(x0, yHud, pw, hp) : { enfonce: false, survole: false, flash: false, dy: 0 }
      const ys = yHud + Math.round(rebond('soute', 0)) + eb.dy
      dessinerLaCaisse(x0 + 7, ys + 5)
      const gx = x0 + 7
      const gy = ys + 17
      p.rect(gx - 1, gy - 1, 10, HG + 2, cerneDeLaSoute)
      p.rect(gx, gy, 8, HG, CREUX_DES_BARRES[1])
      p.rect(gx, gy, 1, HG, CREUX_DES_BARRES[0])
      const plein = Math.max(porte > 0 ? 1 : 0, Math.round(HG * souteVue))
      if (plein > 0) {
        p.rect(gx, gy + HG - plein, 8, plein, pleine ? COQUE[4] : SOUTE[1])
        p.rect(gx, gy + HG - plein, 1, plein, pleine ? COQUE[5] : SOUTE[2])
        p.rect(gx + 6, gy + HG - plein, 2, plein, pleine ? COQUE[3] : SOUTE[0])
        p.rect(gx, gy + HG - plein, 8, 1, COQUE[5])
      }
      if (reflet < 1) {
        const yr = gy + HG - 2 - Math.round(reflet * (HG - 2))
        p.rect(gx, yr, 8, 2, N.WHITE)
        p.glow(gx + 4, yr + 1, 7, COQUE[5], 0.5)
      }
      // la touche d'or, au pied
      const yt = gy + HG + 3
      plaque(p, x0 + 3, yt, pw - 6, 11, 'clair', { enfonce: eb.enfonce })
      for (let k = 0; k < 3; k++) {
        p.rect(x0 + 8 + k, yt + 5 + k, 6 - 2 * k, 1, N.hex('#0c1420'))
        p.rect(x0 + 8 + k, yt + 4 + k, 6 - 2 * k, 1, VERRIERE[1])
      }
      if (actif) zone(0, yHud, bandeCote(), hp + 2, ouvrirLaSoute, 'ouvre')
    } else {
      // COUCHÉE sur le pupitre : le symbole, la jauge, la touche — aussi large que le logement du blindage
      // (la touche est plus large et moins haute, comme celle du vol couché — Keko, 13/11)
      const TOUCHE = 18
      const ws = L_SOUTE
      const xs = 4
      const eb = actif ? etatDuBouton(xs, yHud, ws, 18) : { enfonce: false, survole: false, flash: false, dy: 0 }
      const ys = yHud + Math.round(rebond('soute', 0)) + eb.dy
      eteindreSous(xs, ys, ws, 19)
      dessinerLaCaisse(xs + 5, ys + 5)
      // la touche d'or et son chevron
      const xt = xs + ws - TOUCHE - 1
      plaque(p, xt, ys + 3, TOUCHE, 12, 'clair', { enfonce: eb.enfonce })
      for (let k = 0; k < 3; k++) {
        p.rect(xt + 6 + k, ys + 8 + k, 6 - 2 * k, 1, N.hex('#0c1420'))
        p.rect(xt + 6 + k, ys + 7 + k, 6 - 2 * k, 1, VERRIERE[1])
      }
      if (actif) zone(xs, yHud, Math.max(ws, suivante - 5), 18 + 7 + 13, ouvrirLaSoute, 'ouvre')
      // sa jauge, au gabarit de la barre de blindage : un creux cerné, l'or clair dessus, sombre dessous
      const gx = xs + 5 + 9 + 3
      const gw = xt - 3 - gx
      const gy = ys + 5
      p.rect(gx - 1, gy - 1, gw + 2, 10, cerneDeLaSoute)
      p.rect(gx, gy, gw, 8, CREUX_DES_BARRES[1])
      p.rect(gx, gy, gw, 1, CREUX_DES_BARRES[0])
      const plein = Math.max(porte > 0 ? 1 : 0, Math.round(gw * souteVue))
      if (plein > 0) {
        p.rect(gx, gy, plein, 8, pleine ? COQUE[4] : SOUTE[1])
        p.rect(gx, gy, plein, 1, pleine ? COQUE[5] : SOUTE[2])
        p.rect(gx, gy + 6, plein, 2, pleine ? COQUE[3] : SOUTE[0])
        p.rect(gx + plein - 1, gy, 1, 8, COQUE[5])
      }
      if (reflet < 1) {
        const xr = gx + Math.round(reflet * (gw - 2))
        p.rect(xr, gy, 2, 8, N.WHITE)
        p.glow(xr + 1, gy + 4, 7, COQUE[5], 0.5)
      }
    }

    // ---- le porté : une pastille par minerai
    for (const k of visibles) {
      const { x, w, y: yp } = places.get(k)!
      const T = TEINTES_MINERAI[k]
      const allume = t - allumeA[k] < 0.18
      // (sur sa fin, elle SE REFERME, sans clignoter — Keko, 12/11 : le clignotement « laisse entendre qu'on le perd »)
      const reste = TENUE_DU_PORTE - (t - allumeA[k])
      if (reste < 0.18 && !envols.some((e) => e.minerai === k)) {
        const h = Math.max(1, Math.round((13 * reste) / 0.18))
        p.rect(x, yp + Math.floor((13 - h) / 2), w, h, encre)
        continue
      }
      const dy = Math.round(rebond(`porte-${k}`, 0))
      plaque(p, x, yp + dy, w, 13, 'encre', { bord: allume ? T[2] : undefined })
      dessinerUneRessource(p, x + 7, yp + 6 + dy, k)
      ecrire(p, ditRecent(k), x + 14, yp + 3 + dy, allume ? N.WHITE : IVOIRE, { police: GRAS })
      if (allume) {
        p.glow(x + 7, yp + 6 + dy, 9, T[2], 0.7)
        N.sparkle(p, x + 7, yp + 6 + dy, 1 + 3 * Math.sin(((t - allumeA[k]) / 0.18) * Math.PI), T[4], T[2], 0.5)
      }
    }

    // ---- LE BLINDAGE ET LE BOUCLIER (Keko, 11/11 : « dans pixelfx j'aime beaucoup l'animation de health bar hit, on
    // peut rework notre barre de blindage pour intégrer cette animation ? une barre jaune qui représente le blindage et
    // une section bleue en dessous qui représente le bouclier, dans un design différent, avec une animation de damage
    // aussi ») — la mise en scène de `ui/health-bar-hit` du dépôt, à nos teintes : LE BLINDAGE est une barre d'or à
    // cases (une par point) ; un coup, et la plaque SURSAUTE et plonge, son cadre rougit, le MORCEAU PERDU blanchit deux
    // images, lâche des éclats, TIENT en fantôme pâle, puis SE VIDE derrière une arête blanche qui crache des étincelles ;
    // l'écusson bondit et blanchit. LE BOUCLIER, dessous, est une rangée de CELLULES D'ÉNERGIE penchées, bleues : un coup
    // et la cellule perdue CRÉPITE (blanc, éteint, blanc) puis s'éteint, une onde claire court sur les autres ; elle se
    // recharge en se remplissant. Au dernier point de blindage, l'or passe au rouge et bat.
    // LE BOUCLIER EST AU BOUT DE LA MÊME BARRE (Keko, 13/11 : « on met le bouclier au bout de la barre plutôt que de
    // rajouter une ligne ; la barre de vie a toujours la même taille, et chaque séparateur vaut 1 — plus le vaisseau a
    // de vie, plus il y a de séparateurs, comme dans League of Legends ; le bouclier est toujours au bout de la barre et
    // encaisse les premiers dégâts ») : la barre, de longueur fixe, porte `coque + bouclier` points ; l'or d'abord, les
    // points du bouclier EN BLEU à son bout, un trait de séparation par point. Un point de bouclier perdu CRÉPITE puis
    // s'éteint, une onde claire court sur les autres ; il se recharge en se remplissant.
    // (LE BOUCLIER EST COLLÉ À LA VIE — Keko, 13/11 : « si je perds de la vie, le bouclier reste au bout de la jauge au
    // lieu d'être au bout du blindage » : ses points suivent le dernier point de coque, où qu'il soit ; `rel` compte
    // depuis la fin de la coque. Rend `null` là où il n'y a pas de bouclier : le creux de la barre.)
    // (IL A SA TEINTE TOUT LE TEMPS, recharge comprise — Keko, 13/11 : « il ne devrait pas être foncé durant sa
    // régénération et devenir normal dès qu'il atteint un nombre entier » ; c'est de la vie en plus, à la fraction près.
    // Un coup : le morceau perdu clignote blanc, une onde claire court sur ce qui reste.)
    const teinteDuBouclier = (rel: number, k: 0 | 1 | 2): number | null => {
      const nb = CONF.bouclier.points
      if (nb <= 0 || rel < 0 || rel >= nb) return null
      const db = t - bouclierA
      if (rel >= m.bouclier) return db >= 0 && db < 0.32 && rel < m.bouclier + 1 && Math.floor(t * 30) % 2 === 0 ? N.WHITE : null
      const onde = db >= 0 && db < 0.45 ? Math.exp(-Math.pow((m.bouclier - rel) / Math.max(1, nb) - db / 0.3, 2) * 40) : 0
      if (onde > 0.5) return k === 0 ? N.WHITE : VERRIERE[2]
      return k === 0 ? VERRIERE[2] : k === 1 ? VERRIERE[1] : N.hex('#12708a')
    }
    // (UN CERNE ROUGE SUR LA BARRE DE VIE — Keko, 13/11 : « un petit effet visuel rouge sur la barre de vie » : au coup,
    // son cerne rougit un tiers de seconde ; au dernier point il reste rouge et bat, avec une lueur)
    const cerneDuBlindage = (): number => {
      const du = t - toucheA
      if (du >= 0 && du < 0.3) return du < 0.08 ? ROUGE[5] : ROUGE[4]
      if (m.phase === 'vol' && m.coque <= 1) return Math.sin(t * 5) > 0 ? ROUGE[5] : ROUGE[3]
      return encre
    }
    // (LES TRAITS DES POINTS SONT FONDUS DANS LA BARRE — Keko, 13/11 : « trop prononcés : plus fins, et dans une couleur
    // proche de la barre mais plus sombre » : un pixel, la teinte de ce qu'il traverse, assombrie)
    const assombrie = (c: number): number => {
      const k = 0.66
      return ((255 << 24) | (Math.round(((c >>> 16) & 255) * k) << 16) | (Math.round(((c >>> 8) & 255) * k) << 8) | Math.round((c & 255) * k)) >>> 0
    }
    // LE SYMBOLE DE LA BARRE DE VIE EST UN PETIT VAISSEAU (Keko, 13/11 : « à la place d'un bouclier, un petit vaisseau :
    // ce serait plus clair pour les joueurs » — la barre dit l'état DU VAISSEAU) : nez en haut, en acier clair à gauche
    // et sombre à droite, sa verrière bleue, sa flamme d'or ; cerné ; blanc au coup. Sa couleur ne suit pas la vie.
    // (… PUIS AGRANDI ET PLUS TRAVAILLÉ — Keko, 13/11 : « un tout petit peu plus gros et plus travaillé, pour matcher le
    // niveau de l'icône de la soute » : onze pixels de large au lieu de sept, dans la place du conteneur d'en face — le
    // fuselage éclairé à gauche, les ailes à nervure, la verrière en deux bleus, les feux rouge et vert au bout des
    // ailes, deux tuyères et leurs flammes. (x, y) reste le coin de l'ancien 7 × 8 : le dessin déborde de deux de chaque côté.)
    // (… ET FINALEMENT, LE VAISSEAU DU JOUEUR EN MINIATURE — Keko, 13/11, après une dizaine d'icônes dessinées à la main :
    // « on tourne en rond ; une icône miniature qui correspond à la forme et à la couleur choisie par le joueur du
    // vaisseau actuel — certains vaisseaux seront beaucoup plus gros que d'autres, il faudra les réduire à la même
    // taille » : LE RENDU DU HANGAR (`peindreFormes`, les formes du vaisseau monté, sa livrée), mis à l'échelle pour
    // que SA BOÎTE tienne dans quinze pixels — un gros vaisseau y tient comme un petit. (x, y) reste le coin de
    // l'ancien 7 × 8 : la miniature est centrée sur sa place.)
    const dessinerLEcusson = (x: number, y: number, blanc: boolean): void => {
      const formes = formesDuVaisseau(allureMontee(0), 0, 0)
      const [xa, ya, xb, yb] = boiteDe(formes)
      const COTE = 15
      // (nez en haut : la largeur à l'écran vient de y, la hauteur de x)
      const s = Math.min(COTE / Math.max(0.5, yb - ya), COTE / Math.max(0.5, xb - xa))
      const cx = Math.round(x + 3 - ((ya + yb) / 2) * s)
      const cy = Math.round(y + 4 + ((xa + xb) / 2) * s)
      // (SON CERNE : la même silhouette, toute d'encre, posée d'un pixel de chaque côté — sans lui, la miniature se
      // perdait sur le décor)
      const D_ENCRE = Object.fromEntries((['coque', 'blinde', 'aile', 'verre', 'metal', 'acier', 'rouge', 'or', 'feu', 'ion', 'laser', 'emeraude', 'carmin', 'grenat', 'ambre', 'violet'] as const).map((mat) => [mat, new Array<number>(8).fill(encre)]))
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) peindreFormes(p, formes, cx + dx, cy + dy, s, { rampes: D_ENCRE, reflet: encre })
      peindreFormes(p, formes, cx, cy, s, { rampes: rampesDuJoueur(), blanc: blanc ? 1 : 0 })
      p.place(0, 0)
    }
    if (enBande) {
      // LE BLINDAGE DEBOUT — la même mise en scène que la barre couchée (le « health bar hit » du dépôt), tournée : la
      // barre d'or à cases se vide PAR LE HAUT ; un coup, et la plaque sursaute, son cadre rougit, le morceau perdu
      // blanchit, tient en fantôme pâle puis se vide sous une arête blanche qui crache des étincelles ; l'écusson, en
      // tête, bondit. LE BOUCLIER : une colonne de cellules bleues à côté, qui crépitent et s'éteignent une à une.
      const nb = CONF.bouclier.points
      const TOT = CONF.coque + nb
      const du = t - toucheA
      const db = t - bouclierA
      const dernier = m.phase === 'vol' && m.coque <= 1
      const TIENT = 0.42
      const VIDE = 0.85
      const fantomeA = (valeur: number): number => {
        const dc = t - coqueCoupA
        if (dc >= VIDE) return valeur
        if (dc < TIENT) return Math.max(valeur, coqueFantome)
        const u = (dc - TIENT) / (VIDE - TIENT)
        const doux = u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2
        return valeur + Math.max(0, coqueFantome - valeur) * (1 - doux)
      }
      const BH = H_BARRE
      const lw = 8
      const sursaut = du >= 0 && du < 0.28 ? 3 * (1 - du / 0.28) : db >= 0 && db < 0.2 ? 1.5 * (1 - db / 0.2) : 0
      const pw = 22
      const px0 = W - Math.round(bandeCote() / 2) - Math.round(pw / 2) + Math.round(Math.sin(t * 90) * sursaut)
      const oy = yHud + Math.round(Math.cos(t * 77) * sursaut * 0.7) + (du >= 0 && du < 0.6 ? Math.round(3 * Math.exp(-du * 10) * Math.cos(du * 24)) : 0)
      const bx = px0 + 7
      const by = oy + 17
      const or = dernier ? [ROUGE[5], ROUGE[4], ROUGE[3]] : [PEPITE[3], PEPITE[2], PEPITE[1]]
      const yDe = (part: number): number => by + BH * (1 - part)
      if (m.coque < coqueConnue - 1e-6) {
        const depuis = fantomeA(coqueConnue)
        coqueFantome = depuis
        coqueCoupA = t
        for (let i = 0; i < 11; i++) gerbe(bx + 1 + R.next() * (lw - 2), yDe((m.coque + (depuis - m.coque) * R.next()) / TOT), 1, [N.WHITE, or[0], or[1], or[2]], 75)
      }
      coqueConnue = m.coque
      if (nb > 0 && m.bouclier < bouclierConnu - 0.01) gerbe(bx + lw / 2, yDe((m.coque + m.bouclier) / TOT), 9, [N.WHITE, VERRIERE[2], VERRIERE[1]], 55)
      bouclierConnu = m.bouclier
      // (LA MÊME PLAQUE D'ACIER QUE LA SOUTE — Keko, 13/11 : deux contenants différents « cassent la cohérence de l'UI », et
      // sombres, on y distinguait mal une barre vide : l'acier est plus clair que le creux des barres)
      // l'écusson, en tête : il bondit et blanchit au coup
      const bond = du >= 0 && du < 0.5 ? Math.round(-3 * Math.exp(-du * 12) * Math.abs(Math.cos(du * 22))) : 0
      const blanc = du >= 0 && du < 0.07
      const ex = px0 + Math.round(pw / 2) - 4
      // (un pixel à droite : la miniature est dans l'axe de la barre qu'elle coiffe — Keko, 13/11 : la barre semblait
      // « un petit peu décalée »)
      dessinerLEcusson(ex + 1, oy + 4 + bond, blanc)
      // la barre : le creux, le plein (clair à gauche, sombre à droite), le fantôme, les séparations des cases
      const val = Math.max(0, Math.min(1, m.coque / TOT))
      const fant = Math.max(val, Math.min(1, fantomeA(m.coque) / TOT))
      const dc = t - coqueCoupA
      p.rect(bx - 1, by - 1, lw + 2, BH + 2, cerneDuBlindage())
      if (dernier) p.glow(bx + lw / 2, by + BH / 2, BH * 0.6, ROUGE[4], 0.22 + 0.14 * Math.sin(t * 5))
      const traits = new Set<number>()
      for (let i = 1; i < TOT; i++) traits.add(Math.round(yDe(i / TOT)))
      for (let y = 0; y < BH; y++) {
        const u = 1 - (y + 0.5) / BH
        for (let x = 0; x < lw; x++) {
          let c: number
          if (u < val) c = x < 1 ? or[0] : x < lw - 2 ? or[1] : or[2]
          else if (u < fant) c = dc < 0.07 || x < 1 ? N.WHITE : x < lw - 2 ? N.hex('#ffe9a8') : or[1]
          else c = teinteDuBouclier((u - fant) * TOT, x < 1 ? 0 : x < lw - 2 ? 1 : 2) ?? (x < 1 ? CREUX_DES_BARRES[0] : CREUX_DES_BARRES[1])
          p.px(bx + x, by + y, traits.has(by + y) ? assombrie(c) : c)
        }
      }
      if (dc < VIDE && val > 0) p.rect(bx, Math.min(by + BH - 1, Math.round(yDe(val))), lw, 1, N.WHITE)
      if (dc > TIENT && dc < VIDE) {
        const gy = yDe(fant)
        p.rect(bx - 1, Math.round(gy) - 1, lw + 2, 2, N.WHITE)
        p.glow(bx + lw / 2, gy, 10, or[1], 0.6)
        if (R.next() < 0.5) eclats.push({ x: bx + 1 + R.next() * (lw - 2), y: gy, vx: R.range(-40, 40), vy: -R.range(20, 70), t0: t, vie: 0.1 + 0.12 * R.next(), c: R.next() < 0.5 ? N.WHITE : or[0] })
      }
      p.glow(bx + lw / 2, yDe(val * 0.5), BH * 0.4, or[1], dernier ? 0.12 + 0.1 * Math.sin(t * 5) : 0.1)
      if (dc < 0.3) p.glow(bx + lw / 2, yDe((val + fant) / 2), 26, dc < 0.08 ? N.WHITE : or[1], 0.6 * (1 - dc / 0.3))
    } else {
    const nb = CONF.bouclier.points
    const TOT = CONF.coque + nb
    const du = t - toucheA
    const db = t - bouclierA
    const dernier = m.phase === 'vol' && m.coque <= 1
    const TIENT = 0.42
    const VIDE = 0.85
    const fantomeA = (valeur: number): number => {
      const dc = t - coqueCoupA
      if (dc >= VIDE) return valeur
      if (dc < TIENT) return Math.max(valeur, coqueFantome)
      const u = (dc - TIENT) / (VIDE - TIENT)
      const doux = u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2
      return valeur + Math.max(0, coqueFantome - valeur) * (1 - doux)
    }
    const BW = 52
    const wp = 5 + 9 + 3 + BW + 5
    const sursaut = du >= 0 && du < 0.28 ? 3 * (1 - du / 0.28) : db >= 0 && db < 0.2 ? 1.5 * (1 - db / 0.2) : 0
    const ox = W - 5 - wp + Math.round(Math.sin(t * 90) * sursaut)
    const oy = yHud + Math.round(Math.cos(t * 77) * sursaut * 0.7) + (du >= 0 && du < 0.6 ? Math.round(3 * Math.exp(-du * 10) * Math.cos(du * 24)) : 0)
    const bx = ox + 5 + 9 + 3
    const by = oy + 5
    const bh = 8
    const or = dernier ? [ROUGE[5], ROUGE[4], ROUGE[3]] : [PEPITE[3], PEPITE[2], PEPITE[1]]
    // un coup dans le blindage : le fantôme part d'où on en était, des éclats tombent du morceau perdu
    if (m.coque < coqueConnue - 1e-6) {
      const depuis = fantomeA(coqueConnue)
      coqueFantome = depuis
      coqueCoupA = t
      for (let i = 0; i < 11; i++) gerbe(bx + (BW * (m.coque + (depuis - m.coque) * R.next())) / TOT, by + 1 + R.next() * (bh - 2), 1, [N.WHITE, or[0], or[1], or[2]], 75)
    }
    coqueConnue = m.coque
    // un coup dans le bouclier : des étincelles froides sur la cellule perdue
    if (nb > 0 && m.bouclier < bouclierConnu - 0.01) gerbe(bx + (BW * (m.coque + m.bouclier)) / TOT, by + bh / 2, 9, [N.WHITE, VERRIERE[2], VERRIERE[1]], 55)
    bouclierConnu = m.bouclier

    eteindreSous(ox, oy, wp, 19)
    // l'écusson : une plaque de blindage, qui bondit et blanchit au coup
    const bond = du >= 0 && du < 0.5 ? Math.round(-3 * Math.exp(-du * 12) * Math.abs(Math.cos(du * 22))) : 0
    const blanc = du >= 0 && du < 0.07
    dessinerLEcusson(ox + 5, oy + 5 + bond, blanc)
    p.glow(ox + 8, oy + 9, 9, or[1], 0.2 + (du >= 0 && du < 0.2 ? 0.4 : 0))

    // la barre de blindage : le creux, le plein (clair dessus, sombre dessous), le fantôme, les séparations des cases
    const val = Math.max(0, Math.min(1, m.coque / TOT))
    const fant = Math.max(val, Math.min(1, fantomeA(m.coque) / TOT))
    const dc = t - coqueCoupA
    p.rect(bx - 1, by - 1, BW + 2, bh + 2, cerneDuBlindage())
    if (dernier) p.glow(bx + BW / 2, by + bh / 2, BW * 0.6, ROUGE[4], 0.22 + 0.14 * Math.sin(t * 5))
    const traits = new Set<number>()
    for (let i = 1; i < TOT; i++) traits.add(Math.round((BW * i) / TOT))
    for (let x = 0; x < BW; x++) {
      const u = (x + 0.5) / BW
      for (let v = 0; v < bh; v++) {
        let c: number
        if (u < val) c = v < 1 ? or[0] : v < bh - 2 ? or[1] : or[2]
        else if (u < fant) c = dc < 0.07 || v < 1 ? N.WHITE : v < bh - 2 ? N.hex('#ffe9a8') : or[1]
        else c = teinteDuBouclier((u - fant) * TOT, v < 1 ? 0 : v < bh - 2 ? 1 : 2) ?? (v < 1 ? CREUX_DES_BARRES[0] : CREUX_DES_BARRES[1])
        p.px(bx + x, by + v, traits.has(x) ? assombrie(c) : c)
      }
    }
    if (dc < VIDE && val > 0) p.rect(bx + Math.max(0, Math.round(BW * val) - 1), by, 1, bh, N.WHITE)
    if (dc > TIENT && dc < VIDE) {
      // l'arête qui se vide : blanche, lumineuse, elle crache des étincelles
      const gx = bx + BW * fant
      p.rect(Math.round(gx) - 1, by - 1, 2, bh + 2, N.WHITE)
      p.glow(gx, by + bh / 2, 10, or[1], 0.6)
      if (R.next() < 0.5) eclats.push({ x: gx, y: by + 1 + R.next() * (bh - 2), vx: R.range(-20, 60), vy: -R.range(20, 70), t0: t, vie: 0.1 + 0.12 * R.next(), c: R.next() < 0.5 ? N.WHITE : or[0] })
    }
    p.glow(bx + BW * val * 0.5, by + bh / 2, BW * 0.4, or[1], dernier ? 0.12 + 0.1 * Math.sin(t * 5) : 0.1)
    if (dc < 0.3) p.glow(bx + (BW * (val + fant)) / 2, by + bh / 2, 26, dc < 0.08 ? N.WHITE : or[1], 0.6 * (1 - dc / 0.3))

    }

    // ---- LES PÉPITES EN VOL, à la manière du « coin collect » du dépôt (Keko, 12/11 : « on peut s'inspirer de coin
    // collect pour la récolte des minerais en vol ») : la pépite part du vaisseau en ARC, par-dessus, et accélère vers la
    // pastille de son minerai ; elle TOURNE, laisse une TRAÎNÉE et sème des étincelles ; arrivée, la pastille saute, un
    // ANNEAU s'ouvre autour d'elle et un éclat y passe
    for (let i = envols.length - 1; i >= 0; i--) {
      const e = envols[i]
      const u = (t - e.t0) / 0.5
      const T = TEINTES_MINERAI[e.minerai]
      const place = places.get(e.minerai)
      const xa = (place?.x ?? 5) + 7
      const ya = (place?.y ?? yPastilles) + 6
      if (u >= 1) {
        envols.splice(i, 1)
        affiche[e.minerai] += 1
        recents[e.minerai] += 1
        allumeA[e.minerai] = t
        ;(ressorts[`porte-${e.minerai}`] ??= { x: 0, v: 0 }).v = -90
        arrivees.push({ x: xa, y: ya, t0: t, c: T })
        continue
      }
      const x0 = e.x - camera.x + W / 2
      const y0 = e.y - camera.y + centreY()
      const k = u * u
      const mx = x0 + (xa - x0) * 0.35
      const my = Math.min(y0, ya) - 24
      const x = (1 - k) * (1 - k) * x0 + 2 * (1 - k) * k * mx + k * k * xa
      const y = (1 - k) * (1 - k) * y0 + 2 * (1 - k) * k * my + k * k * ya
      e.trace.unshift([x, y])
      if (e.trace.length > 7) e.trace.pop()
      e.trace.forEach(([tx, ty], j) => j > 0 && p.line(e.trace[j - 1][0], e.trace[j - 1][1], tx, ty, j < 3 ? T[3] : T[2], 1.15 - j / 7))
      // (elle tourne : sa largeur bat)
      const w = Math.max(0.35, Math.abs(Math.cos(t * 13 + e.t0 * 40)))
      p.poly([[x, y - 4], [x + 3 * w + 1, y], [x, y + 4], [x - 3 * w - 1, y]], MATIERES.encre.contour)
      p.poly([[x, y - 3], [x + 3 * w, y], [x, y + 3], [x - 3 * w, y]], T[2])
      p.poly([[x, y - 3], [x + 3 * w, y], [x, y]], T[3])
      p.dot(x - w, y - 1, T[4] ?? N.WHITE)
      p.glow(x, y, 9, T[2], 0.55)
      if (R.next() < 0.35) eclats.push({ x: x + R.range(-2, 2), y: y + R.range(-2, 2), vx: R.range(-10, 10), vy: R.range(-12, 6), t0: t, vie: R.range(0.15, 0.3), c: T[3] })
    }
    for (let i = arrivees.length - 1; i >= 0; i--) {
      const a = arrivees[i]
      const u = (t - a.t0) / 0.3
      if (u >= 1) {
        arrivees.splice(i, 1)
        continue
      }
      // (sans lueur : avec celle de la pastille qui s'allume, elle noyait le nombre sous une boule blanche)
      p.ring(a.x, a.y, 5 + 7 * sortie(u), 1, u < 0.3 ? N.WHITE : a.c[3], 1.25 - u)
      N.sparkle(p, a.x - 3, a.y - 3, 3 * Math.sin(u * Math.PI), a.c[4] ?? N.WHITE, a.c[3], 0.5)
    }
  }

  /**
   * LE SYMBOLE DE LA SOUTE, posé dans la place d'un 9 × 8 dont (x, y) est le coin : LE CONTENEUR DE L'ANCIEN ENTREPÔT
   * (Keko, 13/11 : la caisse à verrou « ressemble à un coffre, ça ne fait pas très science-fiction ; on avait une
   * icône pour l'entrepôt, elle était pas mal ») — une caisse d'acier aux coins coupés, le dessus clair, le dessous
   * sombre, quatre équerres, deux nervures, barrée d'un bandeau sombre où court un filet d'énergie cyan dont le voyant
   * bat. Elle ne change pas de couleur quand la soute est pleine.
   */
  function dessinerLaCaisseDeSoute(p: Peintre, x0: number, y0: number): void {
    const x = x0 + 4
    const y = y0 + 4
    const OMBRE = MATIERES.encre.contour
    p.rect(x - 5, y - 5, 11, 11, OMBRE)
    p.rect(x - 6, y - 4, 13, 9, OMBRE)
    p.rect(x - 5, y - 4, 11, 9, COQUE[3])
    p.rect(x - 4, y - 4, 9, 1, COQUE[5])
    p.rect(x - 5, y - 3, 1, 7, COQUE[4])
    p.rect(x + 5, y - 3, 1, 7, COQUE[2])
    p.rect(x - 4, y + 4, 9, 1, COQUE[2])
    for (const nx of [-2, 2]) p.rect(x + nx, y - 3, 1, 7, COQUE[2])
    for (const [cx, cy] of [[-5, -4], [4, -4], [-5, 3], [4, 3]]) p.rect(x + cx, y + cy, 2, 2, cy < 0 ? COQUE[6] : COQUE[4])
    p.rect(x - 5, y - 1, 11, 3, N.hex('#0c1420'))
    p.rect(x - 4, y, 9, 1, VERRIERE[1])
    p.rect(x - 1, y, 3, 1, Math.floor(t * 2) % 2 === 0 ? N.WHITE : VERRIERE[2])
  }

  /**
   * LA SOUTE OUVERTE : le vol s'assombrit derrière (il est en pause), et un panneau au milieu de la vue — son nom et
   * ce qu'on porte sur ce qu'on peut ; une rangée par minerai (son icône, son nom, combien on en a) avec DEUX BOUTONS,
   * « −1 » et « Tout », éteints quand il n'y en a pas ; une ligne qui dit que le minerai largué est perdu ; « Fermer ».
   * Une tape hors du panneau ferme aussi. Larguer fait tomber le compte, voler un « −N » rouge, et vibrer.
   */
  function dessinerLaSoute(p: Peintre): void {
    if (!souteOuverte) return
    const IVOIRE = N.hex('#fff2c8')
    const u = sortie((t - souteA) / 0.14)
    // (les lueurs du monde passeraient à travers le voile et le panneau : la couche de lumière est éteinte)
    frame.light.fill(0)
    p.rect(0, bandeHaut(), W, H - bandeHaut() - bandeBas(), FOND, 0.62 * u)
    const w = 160
    const EN_TETES = 9
    // (autant de rangées que la vue en loge ; au-delà, la liste défile, une rangée à la fois)
    const hautDeVue = H - bandeHaut() - bandeBas()
    const VIS = Math.max(1, Math.min(MINERAIS.length, RANGS_DE_SOUTE_MAX, Math.floor((hautDeVue - 12 - (20 + EN_TETES + 14 + 22)) / 25)))
    const maxD = MINERAIS.length - VIS
    defilSoute = Math.max(0, Math.min(maxD, defilSoute))
    const d0 = Math.round(defilSoute)
    const h = 20 + EN_TETES + VIS * 25 + 14 + 22
    const x = Math.round((W - w) / 2)
    const y = Math.round(centreY() - h / 2 + (1 - u) * 10)
    ombrePortee(p, x, y, w, h)
    plaque(p, x, y, w, h, 'encre')
    // (le symbole de la soute à gauche de son nom — Keko, 13/11)
    dessinerLaCaisseDeSoute(p, x + 8, y + 6)
    motEnRelief(p, 'Soute', x + 8 + 13 + largeurDe('Soute', GRAS) / 2, y + 6, true)
    // (LE TOTAL, COMME SUR LE PUPITRE DU VOL — Keko, 12/11 : en relief ivoire ; rouge, la soute pleine)
    const total = `${m.minerai}/${CONF.capacite}`
    // (… ET IL NE ROUGIT PAS, soute pleine — Keko, 13/11)
    motEnRelief(p, total, x + w - 8 - largeurDe(total, GRAS) / 2, y + 6, 'ivoire', GRAS)
    const jeter = (k: Minerai, combien: number, bx: number, by: number): void => {
      const n = larguer(m, k, combien)
      if (n <= 0) return
      affiche[k] = Math.max(0, affiche[k] - n)
      flottants.push({ texte: `-${n}`, x: bx, y: by, t0: t, c: ROUGE[5] })
      if (typeof navigator.vibrate === 'function') navigator.vibrate(12)
    }
    // les deux colonnes : COLLECTE (on prend ce minerai, ou on le refuse) et LARGUER
    const bt = x + w - 8 - 30
    const b1 = bt - 3 - 22
    const bc = b1 - 6 - 28
    p.text('COLLECTE', bc + 14, y + 21, COQUE[3], { align: 'center' })
    p.text('LARGUER', b1 + 27, y + 21, COQUE[3], { align: 'center' })
    zoneDeLaSoute = maxD > 0 && largageDemande === null ? { x, y: y + 20 + EN_TETES, w, h: VIS * 25 } : null
    if (maxD > 0) {
      const hg = VIS * 25 - 3
      const hc = Math.max(8, Math.round((hg * VIS) / MINERAIS.length))
      p.rect(x + w - 4, y + 20 + EN_TETES, 2, hg, MATIERES.creux.contour)
      p.rect(x + w - 4, y + 20 + EN_TETES + Math.round(((hg - hc) * defilSoute) / maxD), 2, hc, COQUE[3])
    }
    MINERAIS.forEach((k, i) => {
      if (i < d0 || i >= d0 + VIS) return
      const ry = y + 20 + EN_TETES + (i - d0) * 25
      const combien = m.cargaison[k]
      plaque(p, x + 5, ry, w - 10, 22, 'creux')
      // (LA PÉPITE TELLE QU'ELLE EST DANS L'ESPACE — Keko : « changer l'image du minerai dans le panneau pour qu'il
      // matche l'image du minerai verrouillé sur la map » : vive et dans son halo si on la collecte, éteinte au cerne
      // teinté si on la refuse ; le même dessin, qui culbute pareil)
      dessinerPepite(p, { id: 0, x: x + 15, y: ry + 11, vx: 0, vy: 0, graine: 7919 * (i + 1), minerai: k }, t, refuses[k])
      ecrire(p, FICHES_MINERAI[k].nom, x + 25, ry + 3, combien > 0 ? COQUE[5] : COQUE[3])
      ecrire(p, String(combien), x + 25, ry + 12, combien > 0 ? IVOIRE : COQUE[3], { police: GRAS })
      // (« Oui » en vert : l'aimant le prend ; « Non » EN ROUGE — Keko, 13/11 : refusé, ses pépites restent dehors)
      bouton(p, bc, ry + 3, 28, 16, refuses[k] ? 'Non' : 'Oui', true, () => (refuses[k] = !refuses[k]), 'onglet', refuses[k] ? 'rouge' : 'vert')
      bouton(p, b1, ry + 3, 22, 16, '-1', combien > 0, () => jeter(k, 1, b1 + 11, ry), 'retour', 'acier')
      // (« Tout » ne largue pas : il DEMANDE — voir la confirmation plus bas)
      bouton(p, bt, ry + 3, 30, 16, 'Tout', combien > 0, () => (largageDemande = k), 'ouvre', 'acier')
    })
    const yb = y + 20 + EN_TETES + VIS * 25
    p.text(texteNu('Le minerai largué est perdu'), W / 2, yb + 3, COQUE[3], { align: 'center' })
    // (« FERMER » COMME DANS LA VENTE DU COMMERCE — Keko, 12/11 : la même plaque d'acier, la même taille)
    const bw = largeurDe('Fermer', GRAS) + 22
    bouton(p, Math.round(W / 2 - bw / 2), yb + 14, bw, 15, 'Fermer', true, () => (souteOuverte = false), 'retour', 'acier')
    // (hors du panneau : une tape ferme ; dedans, elle ne fait rien — posées APRÈS les boutons, qui passent d'abord)
    zone(x, y, w, h, () => undefined, null)
    zone(0, 0, W, H, () => (souteOuverte = false), 'retour')
    // LA CONFIRMATION D'UN LARGAGE ENTIER, par-dessus : ce qui est dessous s'assombrit et ne répond plus ; « Larguer »
    // en rouge le fait, « Annuler » ou une tape à côté y renonce
    const kd = largageDemande
    if (kd !== null) {
      const combien = m.cargaison[kd]
      if (combien <= 0) {
        largageDemande = null
        return
      }
      zones = []
      frame.light.fill(0) // (les halos des pépites de la liste passeraient à travers le voile)
      p.rect(x, y, w, h, FOND, 0.7)
      const cw = 140
      const ch = 62
      const cx = Math.round((W - cw) / 2)
      const cy = Math.round(y + h / 2 - ch / 2)
      ombrePortee(p, cx, cy, cw, ch)
      plaque(p, cx, cy, cw, ch, 'encre', { bord: ROUGE[4] })
      const question = `Larguer tout le ${FICHES_MINERAI[kd].nom} ?`
      motEnRelief(p, largeurDe(question, GRAS) <= cw - 12 ? question : 'Tout larguer ?', W / 2, cy + 7, true)
      const perdu = `${combien} ${combien > 1 ? 'unités perdues' : 'unité perdue'}`
      const lp = largeurDe(perdu) + 14
      dessinerPepite(p, { id: 0, x: Math.round(W / 2 - lp / 2) + 4, y: cy + 27, vx: 0, vy: 0, graine: 7919, minerai: kd }, t, false)
      ecrire(p, perdu, Math.round(W / 2 - lp / 2) + 14, cy + 23, COQUE[5])
      const bl = largeurDe('Larguer', GRAS) + 18
      const ba = largeurDe('Annuler', GRAS) + 18
      const xb0 = Math.round(W / 2 - (bl + 4 + ba) / 2)
      bouton(p, xb0, cy + ch - 21, ba, 15, 'Annuler', true, () => (largageDemande = null), 'retour', 'acier')
      bouton(p, xb0 + ba + 4, cy + ch - 21, bl, 15, 'Larguer', true, () => {
        jeter(kd, combien, W / 2, cy)
        largageDemande = null
      }, 'retour', 'rouge')
      zone(cx, cy, cw, ch, () => undefined, null)
      zone(0, 0, W, H, () => (largageDemande = null), 'retour')
    }
  }

  /** Les pépites libres, aux teintes de leur minerai. */
  function dessinerLesPepites(p: Peintre): void {
    for (const pe of m.pepites) dessinerPepite(p, pe, t, m.refuses[pe.minerai])
  }

  /**
   * L'ÉCRAN S'ALLUME COMME UN TUBE (Keko : « pour l'ouverture de l'écran titre, au lieu d'apparaître comme ça, une
   * transition dans le style de CRT off ») — la moitié « on » de `transitions/crt-off` du dépôt, refaite à la taille
   * de notre tampon : le noir, un éclat au cœur, une LIGNE blanche qui file vers les deux bords en crépitant, l'image
   * qui s'ouvre de la ligne vers le haut et le bas (brûlée de lumière, ses lisières qui luisent), puis le tube chauffe :
   * une lueur qui retombe, une bande de rafraîchissement qui descend une fois, des lignes de balayage. Posé PAR-DESSUS
   * l'accueil dessiné ; le noir éteint aussi la couche de lumière (les halos passeraient à travers).
   */
  const TUBE = N.fit(['#060a14', '#0e1a33', '#1a3360', '#2a5a9a', '#4a8fd0', '#8cc4f0', '#d4ecff', '#ffffff'], 8)
  const ALLUMAGE = { point: 0.14, ligne: 0.28, image: 0.58, chaud: 1.2 }
  function allumerLEcran(p: Peintre, t: number): void {
    const A = ALLUMAGE
    if (t >= A.chaud) return
    const XC = W / 2
    const YC = Math.round(H / 2)
    const fl = 0.85 + 0.15 * tire(Math.floor(t * 30), 7, 1)
    if (t >= A.image) {
      // le tube chauffe : la lueur retombe, la bande descend une fois, les lignes de balayage
      const u = (t - A.image) / (A.chaud - A.image)
      const bande = -20 + u * (H + 40)
      for (let y = 0; y < H; y++) {
        const k = 0.22 * (1 - u) ** 2 + 0.3 * Math.max(0, 1 - Math.abs(y - bande) / 10) ** 2 * (1 - u) + (y & 1 ? 0.05 * (1 - u) : 0)
        if (k > 0.01) for (let x = 0; x < W; x++) p.light(x, y, TUBE[5], k)
      }
      return
    }
    const ouvert = t < A.ligne ? 0 : H * sortie((t - A.ligne) / (A.image - A.ligne))
    if (ouvert > 2) {
      // l'image s'ouvre : le noir recule en haut et en bas, la bande visible est brûlée, ses lisières luisent
      const haut = Math.round(YC - ouvert / 2)
      const bas = Math.round(YC + ouvert / 2)
      frame.light.fill(0, 0, Math.max(0, haut) * W)
      frame.light.fill(0, Math.min(H, bas) * W)
      if (haut > 0) p.rect(0, 0, W, haut, FOND)
      if (bas < H) p.rect(0, bas, W, H - bas, FOND)
      const serre = 1 - ouvert / H
      for (let y = Math.max(0, haut); y < Math.min(H, bas); y++) {
        const e = Math.min(y - haut, bas - 1 - y)
        const k = 0.55 * serre * serre + (y & 1 ? 0.08 * serre : 0) + 0.35 * Math.max(0, 1 - e / 6) ** 2
        for (let x = 0; x < W; x++) p.light(x, y, TUBE[5], k * fl)
      }
      for (const y of [haut - 1, bas]) if (y >= 0 && y < H) p.rect(0, y, W, 1, serre > 0.6 ? TUBE[6] : TUBE[5])
      return
    }
    // le noir, puis l'éclat et la ligne
    frame.light.fill(0)
    p.rect(0, 0, W, H, FOND)
    if (t < A.point) return
    const w = t < A.ligne ? XC * (1 - Math.pow(2, (-10 * (t - A.point)) / (A.ligne - A.point))) : XC
    if (w >= 1) {
      const f = Math.floor(t * 30)
      for (let x = Math.max(0, Math.floor(XC - w)); x < Math.min(W, Math.ceil(XC + w)); x++) {
        const u = Math.abs(x + 0.5 - XC) / w
        const y = YC + (tire(x >> 3, f, 2) < 0.2 ? 1 : 0)
        p.px(x, y, u < 0.85 ? N.WHITE : TUBE[6])
        if (u < 0.92) {
          p.px(x, y - 1, TUBE[6])
          p.px(x, y + 1, u < 0.6 ? TUBE[6] : TUBE[5])
        }
        if (u < 0.8) {
          p.dot(x, y - 2, TUBE[4], 0.5)
          p.dot(x, y + 2, TUBE[4], 0.5)
        }
        if (tire(x, f, 3) < 0.06) p.px(x, y + (tire(x, f, 4) < 0.5 ? -1 : 1) * (2 + Math.floor(tire(x, f, 5) * 4)), tire(x, f, 6) < 0.5 ? N.WHITE : TUBE[5])
        p.light(x, y, TUBE[6], 0.5 * fl * (1 - u * 0.6))
      }
      for (let x = Math.floor(XC - w); x <= XC + w; x += 9) p.glow(x, YC, 10, TUBE[5], 0.35 * fl)
      p.glow(XC, YC, Math.min(70, 16 + w * 0.4), TUBE[5], 0.4 * fl)
    }
    const s0 = t - A.point
    if (s0 < 0.14) {
      N.sparkle(p, XC, YC, 12 * (1 - s0 / 0.14) + 2, N.WHITE, TUBE[5], 0.9)
      p.glow(XC, YC, 40, N.WHITE, 0.5 * (1 - s0 / 0.14))
    }
  }

  /**
   * L'ÉCRAN ÉTEINT : le noir du tube, sa veilleuse rouge qui respire en bas, le pictogramme de mise en marche (un
   * anneau ouvert et sa barre) et « Toucher pour allumer », qui battent doucement au bleu du tube — rien d'autre.
   */
  function dessinerLEcranEteint(p: Peintre): void {
    p.rect(0, 0, W, H, FOND)
    const k = 0.5 + 0.5 * Math.sin(t * 2.6)
    const c = k > 0.45 ? TUBE[5] : TUBE[4]
    const cx = W / 2
    const cy = Math.round(H / 2) - 14
    p.arc(cx, cy, 9, 2, -Math.PI / 2 + 0.7, Math.PI * 1.5 - 0.7, c)
    p.rect(cx - 1, cy - 12, 2, 9, c)
    p.glow(cx, cy, 22, TUBE[4], 0.18 + 0.14 * k)
    const texte = 'Toucher pour allumer'
    const f: Police = largeurDe(texte, GRAS) <= W - 16 ? GRAS : TEXTE
    ecrire(p, texte, cx, cy + 22, c, { police: f, align: 'center' })
    // la veilleuse
    const v = 0.5 + 0.5 * Math.sin(t * 1.3)
    p.rect(cx - 1, H - 14, 2, 2, v > 0.3 ? N.hex('#ff3a3a') : N.hex('#7a1a1a'))
    p.glow(cx, H - 13, 6, N.hex('#ff3a3a'), 0.15 + 0.35 * v)
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
   * en acier, qui fusent et frappent comme le « combo counter » du dépôt, puis qu'un reflet balaie ; l'écran entier
   * s'ALLUME d'abord comme un tube (`allumerLEcran`) ; en bas, « Toucher pour commencer » qui bat. À la tape, le
   * vaisseau s'arrache vers le haut, tout file, et le hangar s'ouvre.
   */
  function dessinerLAccueil(p: Peintre): void {
    zones = []
    p.place(0, 0)
    if (accueilAllumeA === null) {
      dessinerLEcranEteint(p)
      return
    }
    /** Le temps écoulé depuis l'allumage : l'heure du tube et du titre. */
    const ta = t - accueilAllumeA
    const us = accueilQuitteA === null ? 0 : Math.min(1, (t - accueilQuitteA) / SORTIE_DE_L_ACCUEIL)
    const elan = us * us
    const boucle = (a: number, b: number): number => ((a % b) + b) % b
    // TÉLÉPHONE COUCHÉ (Keko, 13/11 : « passe l'écran toucher pour allumer et l'écran d'accueil en compatible paysage ») :
    // le titre et la demande À GAUCHE, le vaisseau À DROITE, au milieu de la hauteur — debout, tout est sur l'axe
    const cxT = paysage ? Math.round(W * 0.33) : W / 2
    const cxV = paysage ? Math.round(W * 0.74) : W / 2
    const hV = paysage ? 0.56 : 0.63
    const largeT = paysage ? 2 * cxT : W
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
    const gA = gabaritDe(monteeA(hangar, 'coque').cran)
    const E = 3 * gA.echelle
    const cx = cxV
    const sy = Math.round(H * hV + Math.sin(t * 1.4) * 2.5 - Math.pow(Math.max(0, us - 0.15) / 0.85, 2.2) * (H * hV + 70))
    const flam = accueilQuitteA === null ? 0.55 + 0.12 * Math.sin(t * 11) : 1
    const al = allureMontee(0)
    const chaud = al.propulseur >= 3 ? ION : FEU
    const ty = sy + (0.2 - queueDe(monteeA(hangar, 'coque').cran)) * E
    for (let k = 0; k < 18; k++) {
      const u = boucle(t * (1.5 + us * 2) + k / 18, 1)
      p.dot(cx + Math.sin(k * 7.3) * (1.5 + u * 5), ty + 3 + u * (46 + us * 70), chaud[Math.max(1, 6 - Math.floor(u * 5))], (1 - u) * 0.9)
    }
    p.glow(cx, ty, 12 + 16 * flam, al.propulseur >= 3 ? ION[4] : FEU[5], 0.4 + 0.45 * flam + 0.08 * Math.sin(t * 9))
    peindreFormes(p, formesDuVaisseau(al, flam, t), cx, sy, E, { rampes: rampesDuJoueur() })
    p.glow(cx, sy - gA.verriere * E, 9, VERRIERE[2], 0.25)
    if (Math.floor(t * 1.5) % 2 === 0)
      for (const [s, c] of [[-1, N.hex('#ff4a4a')], [1, N.hex('#4aff7a')]] as const) {
        p.rect(Math.round(cx + s * (gA.feux.y + 0.2) * E), Math.round(sy + (0.2 - gA.feux.x) * E), 1, 1, N.WHITE)
        p.glow(Math.round(cx + s * (gA.feux.y + 0.2) * E), Math.round(sy + (0.2 - gA.feux.x) * E), 7, c, 0.7)
      }

    // LE TITRE ARRIVE COMME LE « COMBO COUNTER » DU DÉPÔT (Keko : « un truc plus travaillé, dans le genre de
    // l'apparition du texte dans ui/combo counter de pixelfx ») : chaque mot FUSE de son côté sur des traits de vitesse
    // — étiré, penché, deux images rémanentes derrière lui —, puis FRAPPE et s'arrête net : les lettres blanchissent, une
    // étoile à pointes éclate derrière, un anneau roule, des étincelles giclent, l'écran tremble, le mot dépasse et
    // revient. NOVA par la gauche, DRIFTER par la droite ; la nova naît de la frappe de NOVA.
    const eN = largeurDe('NOVA', GRAS) * 4 <= largeT - 12 ? 4 : 3
    const eD = largeurDe('DRIFTER', GRAS) * 3 <= largeT - 8 ? 3 : 2
    const yT = paysage ? Math.round(H / 2 - 48) : Math.round(Math.max(26, H * 0.13))
    const monte = -Math.round(elan * (yT + 160))
    const VOL = 0.12
    const TN = HEURES_DU_TITRE.nova
    const TD = HEURES_DU_TITRE.drifter
    const xDe = (tau: number, sens: number): number => {
      if (tau < 0) return sens * -(W + 60)
      if (tau < VOL) return sens * -(W * 0.95) * Math.pow(1 - tau / VOL, 2)
      return sens * 7 * Math.exp(-(tau - VOL) * 18) * Math.sin((tau - VOL) * 34)
    }
    const OR = { fill: [N.hex('#a8650f'), PEPITE[2], N.hex('#ffe68a')], edge: N.hex('#fff7d6'), under: N.hex('#6b3a0c'), outline: N.hex('#1e0e03'), ow: 2, shadow: N.hex('#0a0408') }
    const ACIER = { fill: [COQUE[3], COQUE[4], COQUE[5]], edge: COQUE[6], under: COQUE[2], outline: N.hex('#07050d'), ow: 2, shadow: N.hex('#04040a') }
    type Mot = { s: string; e: number; y: number; t0: number; sens: number; style: typeof OR; vif: number; clair: number; sombre: number }
    const MOTS: Mot[] = [
      { s: 'NOVA', e: eN, y: yT, t0: TN, sens: 1, style: OR, vif: PEPITE[2], clair: PEPITE[3], sombre: N.hex('#6b3a0c') },
      { s: 'DRIFTER', e: eD, y: yT + 11 * eN - 2, t0: TD, sens: -1, style: ACIER, vif: COQUE[4], clair: COQUE[5], sombre: COQUE[2] },
    ]
    const lettres = (mot: Mot, dx: number, etire: number, penche: number, flash: number): { g: unknown; x: number; y: number; sx: number; sy: number; slant: number; flash: number }[] => {
      const m = spell(mot.s, GRAS) as { letters: { g: unknown; x: number }[]; w: number }
      const x0 = Math.round(cxT + dx - (m.w * mot.e * etire) / 2)
      return m.letters.filter((L) => L.g).map((L) => ({ g: L.g, x: x0 + L.x * mot.e * etire, y: mot.y + monte - decalage(GRAS) * mot.e, sx: mot.e * etire, sy: mot.e, slant: penche, flash }))
    }
    secousseDeLAccueil = 0
    // la nova, née de la frappe de NOVA, au coin du mot
    const nx = Math.round(cxT + (largeurDe('NOVA', GRAS) * eN) / 2 - 4)
    const ny = yT - 6 + monte
    const bat = 0.5 + 0.5 * Math.sin(t * 2.3)
    const eclos = sortie((ta - TN - VOL) / 0.5)
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
    const cycle = boucle(ta - TD - 0.9, 3.4)
    MOTS.forEach((mot, n) => {
      const tau = ta - mot.t0
      if (tau < 0) return
      const vole = tau < VOL
      const frappe = tau - VOL
      const cxm = cxT
      const cym = mot.y + monte + Math.round(3.5 * mot.e)
      // les traits de vitesse : pleins pendant le vol, puis ils s'éteignent
      const kTraits = vole ? 1 : Math.max(0, 1 - frappe / 0.35) * 0.9
      if (kTraits > 0.02) {
        const f = Math.floor(t * 30)
        for (let i = 0; i < 16; i++) {
          if (tire(f, i, 3 + n) > kTraits) continue
          const y = cym + Math.round((tire(f, i, 1 + n) - 0.5) * 12 * mot.e)
          const L = 16 + tire(f, i, 2) * 50
          const x = W / 2 + (tire(f, i, 4) - 0.5) * (W + 20)
          p.line(x - L / 2, y, x + L / 2, y, mot.clair, 0.75)
          p.line(x + (mot.sens > 0 ? L / 4 : -L / 2), y, x + (mot.sens > 0 ? L / 2 : -L / 4), y, N.WHITE)
        }
      }
      // la frappe : l'étoile à pointes deux images, l'anneau qui roule, les étincelles, la lumière, la secousse
      if (frappe >= 0) {
        if (frappe < 0.07) {
          for (let i = 0; i < 10; i++) {
            const an = (i / 10) * Math.PI * 2 + (tire(i, 7, n) - 0.5) * 0.3
            const L = (18 + tire(i, 8, n) * 14) * (mot.e / 3)
            const ca = Math.cos(an) * 1.5
            const sa = Math.sin(an)
            if (frappe < 0.035) {
              p.line(cxm, cym, cxm + ca * L, cym + sa * L, N.WHITE)
              p.line(cxm, cym + 1, cxm + ca * L, cym + sa * L + 1, mot.clair)
            } else p.line(cxm + ca * L * 0.5, cym + sa * L * 0.5, cxm + ca * L * 1.3, cym + sa * L * 1.3, mot.vif)
          }
        }
        const rk = frappe / 0.34
        if (rk < 1) p.ring(cxm, cym, 18 + 46 * sortie(rk), 1, rk < 0.3 ? N.WHITE : mot.clair, 1.15 - rk)
        for (let i = 0; i < 26; i++) {
          const vie = 0.14 + 0.22 * tire(i, 11, n)
          const u = frappe / vie
          if (u >= 1) continue
          const an = (tire(i, 12, n) - 0.5) * 2.4 + (tire(i, 13, n) < 0.5 ? Math.PI : 0)
          const d = (120 + 180 * tire(i, 14, n)) * vie * (1 - (1 - u) * (1 - u)) * 0.6
          p.dot(cxm + (tire(i, 15, n) - 0.5) * 40 + Math.cos(an) * d, cym + (tire(i, 16, n) - 0.5) * 10 + Math.sin(an) * d * 0.6, u < 0.3 ? N.WHITE : i % 2 === 0 ? mot.clair : mot.vif, 1 - u)
        }
        if (frappe < 0.2) p.glow(cxm, cym, 80, mot.vif, 0.55 * (1 - frappe / 0.2))
        if (frappe < 0.1) p.glow(cxm, cym, 40, N.WHITE, 0.7 * (1 - frappe / 0.1))
        if (frappe < 0.25) secousseDeLAccueil = Math.max(secousseDeLAccueil, 3 * (1 - frappe / 0.25))
      }
      // les images rémanentes, pendant le vol
      if (vole) for (const [retard, c] of [[0.03, mot.sombre], [0.015, mot.vif]] as const) drawWord(p, lettres(mot, xDe(tau - retard, mot.sens), 1.22, mot.sens, 0), { fill: [c], edge: c, under: c, outline: 0, shadow: 0 })
      // le mot : étiré et penché en vol, blanc à la frappe, puis son reflet
      const larg = largeurDe(mot.s, GRAS) * mot.e
      const quand = n === 0 ? cycle : cycle - 0.35
      const reflet = ta > TD + 0.9 && quand > 0 && quand < 0.7 ? Math.round(cxT - larg / 2) - 20 + ((larg + 40) * quand) / 0.7 : null
      drawWord(p, lettres(mot, xDe(tau, mot.sens), vole ? 1.22 : 1, vole ? mot.sens : 0, frappe >= 0 && frappe < 0.07 ? 1 : 0), reflet === null ? mot.style : { ...mot.style, shine: reflet })
    })

    // LA DEMANDE : « Toucher pour commencer », qui bat, entre deux chevrons qui se rapprochent
    if (accueilQuitteA === null && ta > HEURES_DU_TITRE.pret) {
      const texte = 'Toucher pour commencer'
      const f: Police = largeurDe(texte, GRAS) <= largeT - 30 ? GRAS : TEXTE
      const yp = H - Math.max(paysage ? 24 : 30, Math.round(H * 0.1))
      const k = 0.5 + 0.5 * Math.sin(t * 3.4)
      const w = largeurDe(texte, f)
      ecrire(p, texte, cxT, yp, k > 0.35 ? N.hex('#fff2c8') : COQUE[4], { police: f, align: 'center', contour: MATIERES.encre.contour })
      const dx = Math.round(k * 3)
      p.text('>', cxT - w / 2 - 12 + dx, yp + 1, PEPITE[2])
      p.text('<', cxT + w / 2 + 8 - dx, yp + 1, PEPITE[2])
    }
    allumerLEcran(p, ta)
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
    if (parametres.has('doigts')) {
      p.place(0, 0)
      p.text(`M${manche === null ? '-' : manche.id} R${regard === null ? '-' : regard.id} ${journalDesDoigts}`.toUpperCase(), 4, H - 12, N.WHITE, { outline: COQUE[0] })
    }
    if (regard !== null && regard.tir) {
      // (LA VISÉE D'UNE CAPACITÉ N'EST PAS UN MANCHE — Keko : « il est associé à l'orientation » : rien sous le pouce ;
      // la flèche part du vaisseau, voir `dessinerLaCapacite`)
    } else if (regard !== null && (t - (regard.t0 ?? -1) > 0.16 || Math.hypot(regard.doigt.x - regard.centre.x, regard.doigt.y - regard.centre.y) > 6)) {
      // (IL NE PARAÎT PAS SUR UNE SIMPLE TAPE — Keko, 13/11 : « il apparaît quand je fais le double tap pour l'accélération,
      // c'est pas beau » : seulement si le doigt reste posé un instant, ou glisse)
      // LE MANCHE DU REGARD, plus petit, BLEU, DANS LA LANGUE DU PREMIER (Keko, 12/11 : « donner une texture au deuxième
      // stick, comme le premier ») : l'anneau cerné d'encre, éclairé d'en haut à gauche, ombré en bas à droite, sur un
      // fond à peine teinté ; le pouce bombé — le cerne, le corps, le dessus plus clair décalé vers la lumière, un éclat
      p.place(0, 0)
      const RG = [N.hex('#0c3a52'), N.hex('#12708a'), VERRIERE[1], VERRIERE[2], VERRIERE[3]]
      const rayon = C.manche.rayon * 0.7
      const rr = rayon / zoom
      const c0 = enTampon(regard.centre.x, regard.centre.y)
      const ddx = regard.doigt.x - regard.centre.x
      const ddy = regard.doigt.y - regard.centre.y
      const dd = Math.hypot(ddx, ddy)
      const kk = dd > rayon ? rayon / dd : 1
      const encre = MATIERES.encre.contour
      p.circle(c0.x, c0.y, rr, RG[0], 0.25)
      p.ring(c0.x, c0.y, rr + 1, 3, encre)
      p.ring(c0.x, c0.y, rr, 1, RG[2])
      p.arc(c0.x, c0.y, rr, 1, Math.PI * 0.95, Math.PI * 1.55, RG[4])
      p.arc(c0.x, c0.y, rr, 1, -Math.PI * 0.05, Math.PI * 0.55, RG[1])
      const px = Math.round(c0.x + (ddx * kk) / zoom)
      const py = Math.round(c0.y + (ddy * kk) / zoom)
      const rp = Math.round(rr * 0.42)
      p.circle(px, py, rp + 1, encre)
      p.circle(px, py, rp, RG[1])
      p.circle(px - 1, py - 1, Math.max(1, rp - 2), RG[2])
      p.circle(px - 2, py - 2, Math.max(1, rp - 4), RG[3])
      p.rect(px - Math.round(rp * 0.5), py - Math.round(rp * 0.55), 2, 1, N.WHITE)
    }
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
    // (le tampon se couche ou se relève quand on décolle ou qu'on rentre, téléphone couché)
    if (veutLePaysage() !== paysage) cadrer()
    if (coupDEssai > 0 && enJeu && m.phase === 'vol' && t >= coupDEssaiA) {
      coupDEssaiA = t + coupDEssai
      if (m.bouclier > 0) {
        m.bouclier = Math.max(0, m.bouclier - 1)
        m.toucheA = m.t
        bouclierA = t
      } else {
        m.coque = m.coque > 1.3 ? m.coque - 0.8 : CONF.coque
        m.toucheA = m.t
        if (m.coque < CONF.coque) toucheA = t
      }
    }
    // (la soute ouverte : le monde est en pause, ses sons continus se taisent)
    if (souteOuverte && (!enJeu || m.phase !== 'vol')) souteOuverte = false
    if (enJeu && souteOuverte) regler(0, false, 0, false)
    if (enJeu && !souteOuverte) {
      accumule += dt
      const direction = t - arriveA < ARRIVE_A ? { x: 0, y: 0 } : directionVoulue() // (pas encore arrivé : il ne répond pas)
      {
        // (où l'on pousse, vu du vaisseau : devant / derrière, d'un flanc / de l'autre)
        const n = Math.hypot(direction.x, direction.y)
        const f = Math.min(1, n)
        const ux = n > 0 ? direction.x / n : 0
        const uy = n > 0 ? direction.y / n : 0
        const devant = ux * Math.cos(v.cap) + uy * Math.sin(v.cap)
        const deCote = -ux * Math.sin(v.cap) + uy * Math.cos(v.cap)
        const k = Math.min(1, dt * 14)
        pousseeVue.avant += (f * Math.max(0, devant) - pousseeVue.avant) * k
        pousseeVue.retro += (f * Math.max(0, -devant) - pousseeVue.retro) * k
        pousseeVue.cote += (f * deCote - pousseeVue.cote) * k
      }
      const ouRegarder = t - arriveA < ARRIVE_A ? undefined : regardVoulu()
      while (accumule >= PAS) {
        accumule -= PAS
        // (LE TIR PASSE À LA MAIN quand le manche du regard est tenu — pas pour la visée d'une capacité, ni à la souris)
        const r = avancerLeMonde(CONF, m, PAS, direction, ouRegarder, regard !== null && !regard.tir)
        v = m.vaisseau
        // (les quêtes : la plus grande distance à la base, comptée tous les vingt pas d'éloignement)
        {
          const loin = Math.hypot(v.x, v.y)
          if (loin > distanceComptee + 20) {
            distanceComptee = loin
            compter('distance', loin)
          }
        }
        // la postcombustion : une traînée bleue derrière la tuyère
        if (partDeLaPostcombustion(CONF, m) > 0.3) {
          const ca = Math.cos(v.cap)
          const sa = Math.sin(v.cap)
          for (let i = 0; i < 2; i++) etincelles.ajouter('etincelle', v.x - ca * 5 + R.range(-1.5, 1.5), v.y - sa * 5 + R.range(-1.5, 1.5), -ca * R.range(30, 80) + v.vx * 0.3, -sa * R.range(30, 80) + v.vy * 0.3, R.range(0.2, 0.45), R.next() < 0.4 ? N.WHITE : ION[3 + Math.floor(R.next() * 3)], 1, 2)
        }
        // les lasers creusent : des étincelles au point d'impact, le long de la normale (le joueur, et chaque ennemi qui mine)
        const forages: { f: Forage; depuis: Vaisseau }[] = []
        for (const f of m.forages) if (f !== null) forages.push({ f, depuis: v })
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
                compter('ramassees', 1)
                envols.push({ x: v.x, y: v.y, t0: t, minerai: ev.minerai, trace: [] })
                jouer('ramasse')
                // (le « pop » du coin collect : un disque blanc qui se referme, un anneau, des étoiles lancées en rond)
                pops.push({ x: ev.x, y: ev.y, t0: t, c: TEINTES_MINERAI[ev.minerai] })
                for (let i = 0; i < 5; i++) {
                  const a = (i / 5) * Math.PI * 2 + R.range(-0.3, 0.3)
                  const vit = R.range(40, 80)
                  etincelles.ajouter('etincelle', ev.x + Math.cos(a) * 2, ev.y + Math.sin(a) * 2, Math.cos(a) * vit + v.vx * 0.5, Math.sin(a) * vit + v.vy * 0.5, R.range(0.2, 0.4), TEINTES_MINERAI[ev.minerai][i % 2 === 0 ? 3 : 4], 1, 3)
                }
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
              // (un coup critique : un éclair de plus, une petite secousse)
              if (ev.critique) {
                flashs.push({ x: ev.x, y: ev.y, t0: t, r: 6 })
                secousse = Math.max(secousse, 0.35)
              }
              for (let i = 0; i < 6; i++) {
                const a = R.range(0, Math.PI * 2)
                const vit = R.range(30, 90)
                etincelles.ajouter('etincelle', ev.x, ev.y, Math.cos(a) * vit, Math.sin(a) * vit, R.range(0.15, 0.35), R.next() < 0.5 ? N.WHITE : VERRIERE[2], 1, 2)
              }
              break
            }
            case 'bouclier': {
              // le bouclier prend le coup : son anneau flashe, des étincelles cyan, une petite secousse
              // (LE BLINDAGE A LA PRIORITÉ — Keko, 13/11 : un coup qui vide le bouclier ET entame la coque sonne comme un
              // coup dans le blindage, « le joueur doit avoir l'info prioritaire » : le son du bouclier se tait alors)
              if (!(r.chocs.length > 0 && t - chocAnnonceA < 0.4) && !r.evenements.some((e) => e.type === 'touche')) jouer('bouclier')
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
            case 'explosion': {
              // la bombe éclate : l'explosion du dépôt, une secousse, un éclair, des morceaux
              jouer('ennemiDetruit', { dx: ev.x - v.x, dy: ev.y - v.y })
              effets.push({ fx: N.createFx(EXPLOSION as Module, { x: ev.x - camera.x + W / 2, y: ev.y - camera.y + centreY(), size: 0.6, seed: Math.round(ev.x * 7 + ev.y) }), x: ev.x, y: ev.y })
              flashs.push({ x: ev.x, y: ev.y, t0: t, r: ev.rayon })
              secousse = Math.max(secousse, 1)
              if (typeof navigator.vibrate === 'function') navigator.vibrate(50)
              break
            }
            case 'ennemiDetruit': {
              // l'ennemi éclate comme une roche, en rouge, et rend ses pépites (la règle les a faites naître)
              jouer('ennemiDetruit', { dx: ev.x - v.x, dy: ev.y - v.y })
              compter('rivaux', 1)
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
              // (les quêtes : ce qui vient d'être extrait, l'extraction, le chemin parcouru)
              for (const k of MINERAIS) compter(k, ev.cargaison[k])
              compter('pepites', ev.pepites)
              compter('extractions', 1)
              compter('parcouru', v.parcouru)
              sauver()
              // (le bilan ne s'affiche plus au hangar : Keko l'a fait retirer ; les compteurs et le trésor disent tout)
              break
            }
            case 'perdu': {
              // le joueur explose et disparaît ; l'écran de fin attend que la boule de feu soit passée
              jouer('perdu')
              perduA = t
              compter('parcouru', v.parcouru)
              sauver()
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
        if (pousseeVue.avant > 0.05) {
          const n = pousseeVue.avant > 0.6 ? 2 : 1
          for (let i = 0; i < n; i++) {
            // (ELLES NAISSENT AU BOUT DE LA FLAMME, pas à la queue du vaisseau — Keko, 13/11 : « on dirait que les
            // particules naissent trop tôt » — la longueur de la flamme est celle de `formesDuPropulseur` ; et À LA
            // COULEUR DE LA FLAMME : bleues derrière un propulseur ionique, elles restaient couleur feu)
            const cran = monteeA(hangar, 'propulseur').cran
            const flamme = (2.5 + 8 * pousseeVue.avant) * (1 + 0.25 * (cran - 1))
            // (… PUIS DE NOUVEAU À LA TUYÈRE, au début de la flamme — c'est la flamme qui n'est plus rigide)
            const coque = monteeA(hangar, 'coque').cran
            const tuyeres = gabaritDe(coque).tuyeres
            const deCote = tuyeres[Math.floor(R.next() * tuyeres.length)].y
            const recul = -queueDe(coque) + 0.5 * (cran - 1) + Math.min(1.5, flamme * 0.15)
            const bx = v.x - Math.cos(v.cap) * recul - Math.sin(v.cap) * deCote
            const by = v.y - Math.sin(v.cap) * recul + Math.cos(v.cap) * deCote
            const vitesse = 30 + 40 * pousseeVue.avant
            braises.ajouter('braise', bx + R.range(-1, 1), by + R.range(-1, 1), v.vx * 0.3 - Math.cos(v.cap) * vitesse + R.range(-8, 8), v.vy * 0.3 - Math.sin(v.cap) * vitesse + R.range(-8, 8), R.range(0.25, 0.5), cran >= 3 ? BRAISES_D_ION : 0, 1, 2)
          }
        }
      }
      flamme += (pousseeVue.avant - flamme) * Math.min(1, dt * 14)
      // les sons continus : le souffle du propulseur suit la flamme, la foreuse bourdonne quand elle creuse, la charge
      // de l'extraction monte avec l'arc d'or (et se tait quand le compte est au bout : le son de l'extraction la relève)
      if (m.extraction !== compteVu) compteMonte = m.extraction > compteVu
      compteVu = m.extraction
      regler(m.phase === 'vol' ? Math.max(flamme, 0.6 * v.poussee) : 0, m.phase === 'vol' && m.forage !== null, m.phase === 'vol' ? m.extraction / CONF.extraction.duree : 0, compteMonte)
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
    // LA CAMÉRA REGARDE DEVANT (Keko, 12/11 : « quand le vaisseau avance dans une direction, avancer la caméra vers
    // l'avant pour voir plus loin devant — souvent je me prends des astéroïdes parce que je n'ai pas une portée de vue
    // assez loin ; comme dans Enter the Gungeon quand on vise ») : elle vise un point EN AVANT du vaisseau, dans le sens
    // de sa vitesse — à pleine vitesse, plus de la moitié de la demi-vue : 52 px de côté, 95 en hauteur (la vue est plus
    // haute que large), un peu plus sous la postcombustion — et le rejoint en douceur. À l'arrêt, le vaisseau est au
    // centre. (Avant : 0,35 s de vitesse, 38 px au plus.)
    // (ELLE SUIT LE NEZ — Keko : « c'est toujours l'orientation qui détermine où va la caméra » : d'autant plus loin
    // qu'on va vite, ou que le second doigt pousse son manche — on peut alors regarder devant soi à l'arrêt, ou derrière
    // soi en avançant)
    // (LE REGARD S'INSTALLE EN DOUCEUR — Keko : « la caméra est trop réactive au deuxième stick » : sa part monte et
    // retombe sur près d'une seconde au lieu de suivre le pouce à l'instant, et tant qu'on regarde la caméra rejoint son
    // point deux fois moins vite)
    const rg = regardVoulu()
    partDuRegard += ((rg === undefined ? 0 : Math.min(1, Math.hypot(rg.x, rg.y))) - partDuRegard) * Math.min(1, dt * 1.6)
    const suivi = AVANCE_DE_LA_CAMERA.suivi * (1 - 0.55 * Math.min(1, partDuRegard * 3))
    // (C'EST LE DÉCALAGE QU'ON LISSE, PAS LA CAMÉRA — Keko, 12/11 : « quand je vais à droite et pointe le deuxième stick
    // à gauche, je ne vois plus le vaisseau ; et quand je vais en haut ou en bas, avec la vitesse j'ai plus de caméra
    // derrière que devant » : une caméra qui RATTRAPE son point traîne derrière un vaisseau rapide — d'autant de pixels
    // que sa vitesse divisée par l'allure du rattrapage, vingt-cinq à cinquante — et ce retard s'ajoutait au décalage.
    // La caméra est maintenant posée SUR le vaisseau, plus un décalage qui, lui, glisse vers sa cible : plus de retard,
    // le vaisseau ne s'éloigne jamais du centre de plus que le décalage.)
    // (LA CIBLE DU DÉCALAGE NE PASSE PLUS PAR ZÉRO DEUX FOIS — Keko : « quand je change de direction avec uniquement le
    // premier stick, la caméra bouge, puis s'arrête et reprend, un peu en deux temps » : elle valait « nez × vitesse » ;
    // à un demi-tour le nez se retourne d'un coup alors que la vitesse retombe à zéro puis remonte — la caméra partait,
    // revenait au centre, repartait. SANS REGARD, la cible suit maintenant LE VECTEUR VITESSE, tiré à mi-chemin vers le
    // manche quand on pousse (l'intention précède la vitesse) : il glisse d'un bord à l'autre d'un seul mouvement. AVEC
    // LE REGARD, elle passe au nez, à mesure que sa part monte.)
    const dv = directionVoulue()
    const pousse = Math.min(1, Math.hypot(dv.x, dv.y))
    const mx = v.vx / CONF.vitesseMax
    const my = v.vy / CONF.vitesseMax
    const cx = Math.max(-1.2, Math.min(1.2, mx + 0.5 * pousse * (dv.x - mx)))
    const cy = Math.max(-1.2, Math.min(1.2, my + 0.5 * pousse * (dv.y - my)))
    const avance = paysage ? AVANCE_EN_PAYSAGE : AVANCE_DE_LA_CAMERA
    // (UN VAISSEAU À TOURELLES ne tourne pas vers son regard : la caméra avance vers LE REGARD lui-même, pas vers le nez)
    const nr = rg === undefined ? 0 : Math.hypot(rg.x, rg.y)
    const versOu = CONF.tourelles && rg !== undefined && nr > 0.05 ? { x: rg.x / nr, y: rg.y / nr } : { x: Math.cos(v.cap), y: Math.sin(v.cap) }
    const cibleX = (cx * (1 - partDuRegard) + versOu.x * partDuRegard) * avance.x
    const cibleY = (cy * (1 - partDuRegard) + versOu.y * partDuRegard) * avance.y
    decalageDeLaCamera.x += (cibleX - decalageDeLaCamera.x) * Math.min(1, dt * suivi)
    decalageDeLaCamera.y += (cibleY - decalageDeLaCamera.y) * Math.min(1, dt * suivi)
    camera.x = v.x + decalageDeLaCamera.x
    camera.y = v.y + decalageDeLaCamera.y
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
    // (le peintre se place À PARTIR DE L'ORIGINE DE LA FENÊTRE en cours — nulle hors de la base couchée)
    {
      const q = p as unknown as { placeBrute?: (x: number, y: number, f?: boolean, a?: number) => unknown; place: (x: number, y: number, f?: boolean, a?: number) => unknown }
      if (q.placeBrute === undefined) {
        const brute = q.place
        q.placeBrute = brute
        q.place = function (this: unknown, x: number, y: number, f?: boolean, a?: number) {
          return brute.call(this, x + ORIGINE.x, y + ORIGINE.y, f, a)
        }
      }
    }
    if (accueil) {
      regler(0, false, 0, false)
      dessinerLAccueil(p)
      N.composite(frame, img.data, cuireLeCiel())
      g.putImageData(img, 0, 0)
      canvas.style.transform = secousseDeLAccueil > 0.2 ? `translate(${Math.round(Math.sin(t * 90) * secousseDeLAccueil * zoom)}px, ${Math.round(Math.cos(t * 77) * secousseDeLAccueil * zoom)}px)` : ''
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
      dessinerLesToasts(dt)
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
    for (const a of asteroidesVisibles(CONF, m, camera.x, camera.y, Math.max(W, H) / 2 + CONF.champ.rayonMax + 4)) {
      // la roche qu'on creuse tremble, d'autant plus qu'elle est près d'éclater
      const laser = m.forages.find((f) => f !== null && f.cible === a.id) ?? null
      const creusee = laser !== null
      const tremble = laser !== null ? (0.5 + laser.part) * 1.2 : 0
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
    // les « pops » d'une pépite montée à bord : un disque blanc qui se referme, puis un anneau qui s'ouvre
    for (let i = pops.length - 1; i >= 0; i--) {
      const f = pops[i]
      const u = (t - f.t0) / 0.32
      if (u >= 1) {
        pops.splice(i, 1)
        continue
      }
      if (u < 0.3) p.circle(f.x, f.y, 4.5 * (1 - u / 0.3) + 1, u < 0.15 ? N.WHITE : f.c[4] ?? N.WHITE)
      p.ring(f.x, f.y, 3 + 9 * sortie(u), Math.max(1, 2 * (1 - u)), u < 0.3 ? N.WHITE : f.c[3], 1.2 - u)
      p.glow(f.x, f.y, 12, f.c[2], 0.7 * (1 - u))
    }
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
    dessinerLesBombes(p)
    dessinerLesLasers(p)
    // (les effets sont dans le monde : ils passent SOUS les bandeaux et l'interface)
    for (const e of effets) e.fx.draw(frame)
    // (un effet laisse le peintre du tampon PLACÉ sur lui, avec son fondu et sa lumière : sans cette remise à neuf — le
    // peintre d'un tampon est unique, `painterFor` le rend remis à zéro —, tant qu'un effet vivait (la matérialisation
    // du départ), les bandeaux et l'interface se dessinaient ancrés au milieu de l'écran : Keko)
    N.painterFor(frame)
    dessinerLesBords(p)
    dessinerLesBandeaux(p)
    dessinerLAlerte(p)
    dessinerLePointeur(p)
    dessinerLeRadar(p)
    zones = []
    dessinerLeScore(p)
    dessinerLeBanc(p)
    dessinerLaPlaqueDeLaPostcombustion(p)
    dessinerLaCapacite(p)
    dessinerLaSoute(p)
    dessinerLesEclats(p)
    // `&latence` : la latence audio mesurée par l'appareil, en bas à gauche (ce qui se teste doit s'ouvrir d'un lien)
    if (parametres.has('latence')) p.text(`SON ${latenceMs()} MS`, 6, basDuHud() + 8, N.WHITE, { font: 'big', outline: COQUE[0] }) // (en haut à gauche, sous le porté, bien lisible)
    dessinerLeManche(p)
    dessinerLesToasts(dt)
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

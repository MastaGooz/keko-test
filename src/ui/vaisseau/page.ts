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
import { ancreDansLeMonde, boucheDansLeMonde, liesAuDrain, encaisser, type Ennemi, type Evenement, type Monde, impactDuRayon, asteroidesVisibles, avancerLeMonde, finDuTrio, lancerLaBombe, porteeDeLaBombe, cargaisonVide, larguer, centreQuiSuit, directionDuManche, MANCHE, MINERAIS, nouveauMonde, partDeLaPostcombustion, postcombustion, rechargeDeLaPostcombustion, solidite, stationDeLaCase, stationLaPlusProche, tire, totalDe, VAISSEAU as C, type Cargaison, type ConfigVaisseau, type Minerai, type Forage, type Vaisseau, type Vecteur, xpDuNiveau, ennemiLePlusProche, ennemiVerrouille, verrouiller, angleDuBalayage } from '../../logic/vaisseau/jeu.ts'
import { ETALONS, acheter, ajouterLesPiecesDEssai, capacite, poidsTotal, POIDS_SERIE, configDuHangar, demonter, demonterA, EMPLACEMENTS, estMontee, FICHES_MINERAI, foreuseMontee, hangarNeuf, jaugesDe, montantCourt, monteeA, monter, monterA, peutAcheter, peutMonter, perdreLesMontees, estDeBase, exemplaires, libres, pieceDe, piecesDe, placeLourde, possede, aimantMonte, radarMonte, type Jauge, type Piece, type Sorte } from '../../logic/vaisseau/hangar.ts'
import { drawWord, spell } from 'pixelfx/fx/ui/_lib'
import { firePuff, hotFirst, smokePuff } from 'pixelfx/fx/fire/_lib'
import { VOLT, bowed, crackle, stroke, zigzag } from 'pixelfx/fx/lightning/_lib'
import { snowflake } from 'pixelfx/fx/ice/_lib'
import { textWidth } from 'pixelfx'
import { HAUT_ACCENTS } from './police.ts'
import { boucheMontee, gabaritDe, placeDOutil, queueDe, tuyeresOmni, formesDuSocleDeTourelle, formesDeLaTeteDeTourelle, formesDeLaCapsule, formesDuCristalPose, formesDeLaScie, formesDeLaBalise, formesDuBecDeBalise, canonDeLaForeuse, formesDeLAimant, formesDuChassis, formesDeLaForeuse, formesDeLArme, formesDuPropulseur, formesDuRadar, formesDuVaisseau, formesDuVer, LIVREES, COULEURS_DE_JOUEUR, ovale, peindreDansUneCase, peindreFormes, rampesDeLaLivree, tonsDeLaLivree, tonsDeLaMatiere, ANCRES_DU_KRAKEN, type Habit } from './rendu-vaisseau.ts'
import { peauDe, peauxDe, rampesDeLaPeau, tonsDeLaPeau, type Peau } from './peaux.ts'
import { boiteDe } from './rendu-vaisseau.ts'
import { dessinerLeBouclier } from './bouclier.ts'
import { sauvegardeDe, chargerArme, sauverArme, chargerConnues, chargerHangar, chargerLivree, chargerReglages, sauverConnues, sauverHangar, sauverLivree, sauverReglages } from './hangar.ts'
import { estTerminee, etapesFaites, modeleDe, noter, ongletOuvert, quetesNeuves, quetesSansTutoriel, reclamer, tutorielFini, TUTORIEL, type Activite, type Compteur, type Modele, type Quete } from '../../logic/vaisseau/quetes.ts'
import { ajouterLeVaisseau, avecLeHangar, choisirLeVaisseau, coutEnMinerai, estDuModele, flotteNeuve, hangarActif, missionDe, aLeVaisseau, modeleDeVaisseau, MODELES, NOMS_CLASSE, noterEnVol, pieceOuverteSur, RACES, reclamerLaMission, talentsHorsDeLaRace, vaisseauxDe, vieSelonLaRace, type Race } from '../../logic/vaisseau/flotte.ts'
import { annulerLOrdre, coursA, gainDe, historiqueDe, marcheNeuf, ordreNumero, ordresDe, poserUnOrdre, previsionDe, prixPlafond, reglerLeMarche, tendanceDe, vendreAuCours } from '../../logic/vaisseau/marche.ts'
import { aLaMecanique, BRANCHES, configDuLabo, coutDe, debloquer, estDebloque, laboNeuf, noeudDe, noeudsDe, NOMS_BRANCHE, passifsDe, peutDebloquer, rangOuvert, RANGS, type Branche, type Mecanique, type Noeud } from '../../logic/vaisseau/labo.ts'
import { ECLOSION_DE_L_ARRIVEE, jouer as jouerLeSon, latenceMs, regler, reveiller, type GenreDePropulsion, type Son } from './sons.ts'
import { dessinerAsteroide, dessinerPepite, LUMIERE, rocheDe, TEINTES_MINERAI } from './asteroide.ts'
import { dessinerBase, dessinerStation, ENVERGURE_BASE, RECUL_DE_LA_BASE } from './station.ts'
import { animerAstre, astresVisibles, demiTailleDeLAstre, peindreAstre, rayonQuiCache, voilerLAstre, type Astre, type PeintreCeleste } from './celeste.ts'
import * as EXPLOSION from '../pixelfx/fx/keko/explosion-espace.js'
import * as ECLATEMENT_ORGANIQUE from '../pixelfx/fx/keko/eclatement-organique.js'
import * as EFFONDREMENT_NEANT from '../pixelfx/fx/keko/effondrement-neant.js'
import * as TELEPORTATION from '../pixelfx/fx/keko/teleportation.js'
import { RASSEMBLE as TELEPORTE_A } from '../pixelfx/fx/keko/teleportation.js'
import * as MATERIALISATION from '../pixelfx/fx/keko/materialisation.js'
import * as QUETE_TERMINEE from '../pixelfx/fx/keko/quete-terminee.js'
import * as VORTEX_FX from '../pixelfx/fx/keko/vortex.js'
import { apresUnChoix, DUREE_DU_CHOIX, ouvrirLeChoix, proposer, reserveApresLeDelai, type Choix, type Talent } from '../../logic/vaisseau/talents.ts'
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
  /** Un pixel TRANSLUCIDE, mélangé sans trame (la fumée, la brume) ; un disque translucide, sa couleur et son alpha selon (d : 0 au centre, 1 au bord ; l'angle). */
  blend(x: number, y: number, c: number, a: number): void
  disc(x: number, y: number, r: number, c: number | ((d: number, ang: number) => number), a: number | ((d: number, ang: number) => number)): void
}
type Particules = { spawn(k: number, x: number, y: number, vx: number, vy: number, vie: number, c?: number, taille?: number, delai?: number, drapeau?: number): void; update(dt: number): void; draw(p: Peintre, couche?: string): void }
type Morceaux = { list: unknown[]; add(b: Record<string, unknown>): void; update(dt: number): void; draw(p: Peintre): void }
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
  /** Vrai le temps que l'aperçu des armes rejoue les événements du vol : ni son, ni vibration, ni compte de mission. */
  let enApercu = false
  const jouer = (son: Son, ou?: { dx: number; dy: number }, dans = 0): void => {
    if (!enApercu) jouerLeSon(son, ou, dans)
  }
  const vibrer = (motif: number | number[]): void => {
    if (!enApercu) navigator.vibrate(motif)
  }
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
  // (le jeu du vortex a sa sauvegarde à lui)
  if (parametres.has('vortex')) sauvegardeDe('vortex')
  let { flotte, tresor, credits, labo, marche, quetes } = chargerHangar(heureDuMarche())
  // (LA SALAMANDRE EST DONNÉE D'OFFICE dans le jeu du vortex, pour l'essai — Keko, 15/11)
  if (parametres.has('vortex')) for (const id of ['salamandre', 'sentinelle', 'ingenieur', 'frimas', 'pulsar', 'kraken', 'vouivre', 'prisme', 'neant', 'mante', 'tesseract']) flotte = ajouterLeVaisseau(flotte, id) // (et la Sentinelle, puis l'Ingénieur, puis le Frimas, dès le début — Keko, 15/11 ; puis le Pulsar, le Kraken, la Vouivre et le Prisme, 16/11)
  // (`&vaisseau=ID` : pilote ce vaisseau de la flotte d'emblée — avec `&direct`, on décolle avec lui)
  if (parametres.has('vaisseau')) flotte = choisirLeVaisseau(flotte, parametres.get('vaisseau') ?? '')
  /**
   * LE HANGAR est celui DU VAISSEAU PILOTÉ (la flotte, 14/11 — `logic/vaisseau/flotte.ts`) : la page le travaille à
   * part, `sauver` le range dans la flotte. Les pièces qu'on voit sont celles DE SON MODÈLE ; celles qu'on peut
   * acheter, celles que SES missions ont ouvertes.
   */
  let hangar = hangarActif(flotte)
  const piecesIci = (o: Sorte): Piece[] => piecesDe(o).filter((pc) => estDuModele(flotte, pc.id) || pc.id.startsWith('essai-'))
  const pieceOuverteIci = (id: string): boolean => pieceOuverteSur(flotte, id)
  /** `&tuto=0` : le tutoriel des quêtes est passé d'emblée (tous les onglets ouverts), pour essayer la suite d'un lien. */
  // (… et pas de tutoriel : ses trois onglets sont là d'emblée)
  if ((parametres.get('tuto') === '0' || parametres.has('vortex')) && !tutorielFini(quetes)) quetes = quetesSansTutoriel(1, (x) => aLaMecanique(labo, x as Mecanique))
  const sauver = (): void => {
    flotte = avecLeHangar(flotte, hangar)
    sauverHangar(flotte, tresor, credits, labo, marche, quetes)
  }
  /** LA LIVRÉE du vaisseau du joueur (Keko, 12/11) : la couleur de sa coque et de ses ailes, choisie au hangar. */
  /** (CHAQUE VAISSEAU A LA SIENNE — Keko, 14/11 : relue à chaque changement de vaisseau) */
  // (DANS LE JEU DU VORTEX, LA COULEUR EST CELLE DU JOUEUR, pas du vaisseau — Keko, 15/11 : « chaque joueur aura une
  // couleur pour bien s'identifier » ; rouge, bleu, vert ou jaune, rouge au départ)
  const VORTEX_ = parametres.has('vortex')
  // (… PUIS SEULEMENT SA MARQUE — Keko, 16/11 ; … PUIS PLUS DE COULEUR DU JOUEUR DU TOUT : TROIS APPARENCES PAR VAISSEAU —
  // Keko, 17/11 : « on va enlever le petit marquage coloré… on va le remplacer par un vrai changement de carrosserie » :
  // dans le vortex, la « livrée » est l'apparence du vaisseau piloté, gardée vaisseau par vaisseau ; voir `peaux.ts`. Le
  // Nova Drifter garde sa livrée de châssis entier.)
  const porteurDeLaLivree = (): string => (VORTEX_ ? 'peau-' + flotte.actif : flotte.actif)
  const livreesPossibles = (): typeof LIVREES => LIVREES.filter((l) => !COULEURS_DE_JOUEUR.includes(l.id) || l.id === 'rouge')
  /** L'apparence choisie de chaque modèle du vortex (lue une fois, puis gardée ici). */
  const peauxChoisies = new Map<string, string>()
  const peauDuModele = (modele: string): Peau => {
    if (!peauxChoisies.has(modele)) peauxChoisies.set(modele, chargerLivree('peau-' + modele))
    return peauDe(modele, peauxChoisies.get(modele) ?? '')
  }
  const peauCourante = (): Peau => peauDuModele(flotte.actif)
  function choisirLaPeau(id: string): void {
    peauxChoisies.set(flotte.actif, id)
    sauverLivree(porteurDeLaLivree(), id)
    livree = id
  }
  /** Le modèle à qui est une coque (son pictogramme prend l'apparence de ce modèle-là). */
  const MODELE_DE_LA_COQUE: Record<number, string> = { 1: 'chasseur', 2: 'chasseur', 3: 'chasseur', 5: 'salamandre', 6: 'sentinelle', 7: 'ingenieur', 8: 'frimas', 9: 'pulsar', 10: 'kraken', 11: 'vouivre', 12: 'prisme', 13: 'neant', 14: 'mante', 15: 'tesseract' }
  const livreeDuVaisseau = (): string => {
    if (VORTEX_) return peauCourante().id
    const l = chargerLivree(porteurDeLaLivree())
    return livreesPossibles().some((x) => x.id === l) ? l : 'serie'
  }
  let livree = livreeDuVaisseau()
  const rampesDuJoueur = (): ReturnType<typeof rampesDeLaLivree> => (VORTEX_ ? rampesDeLaPeau(peauCourante()) : rampesDeLaLivree(livree))
  /** L'habit de l'apparence du vaisseau piloté (ses détails), dans le vortex. */
  const habitDuJoueur = (coque: number): Habit | undefined => (VORTEX_ ? peauCourante().habit(coque) : undefined)
  /** LES FEUX DE POSITION : rouge à bâbord, vert à tribord — dans le vortex, tous deux à l'accent de l'apparence (un feu rouge ou vert s'y lisait comme la couleur d'un autre joueur). */
  const couleurDuFeu = (s: number): number => (VORTEX_ ? peauCourante().accent[4] : N.hex(s < 0 ? '#ff4a4a' : '#4aff7a'))
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
    if (enApercu) return // (l'aperçu des armes ne compte pour aucune mission)
    const avant = new Set(quetes.actives.filter(estTerminee).map((q) => q.modele))
    const etapesAvant = new Map(quetes.actives.map((q) => [q.modele, etapesFaites(q)]))
    quetes = noter(quetes, c, valeur)
    // (LA MISSION DU VAISSEAU PILOTÉ compte les mêmes choses ; terminée, elle s'annonce comme un contrat)
    const avantV = missionDe(flotte, flotte.actif)
    // (PAS AVANT QU'ELLE SOIT AFFICHÉE — Keko, 14/11 : « quand je finis la formation, la première quête du vaisseau est
    // complète dès son apparition » : l'onglet « Vaisseaux » ne vient qu'après la formation, rien ne compte avant)
    if (tutorielFini(quetes)) flotte = noterEnVol(flotte, c, valeur)
    const apresV = missionDe(flotte, flotte.actif)
    if (apresV !== null && apresV.finie && avantV !== null && !avantV.finie) {
      toasts.push(N.createFx(QUETE_TERMINEE as Module, { x: W / 2, y: 0, title: 'Mission réussie', titleFont: GRAS, text: `${modeleDeVaisseau(flotte.actif).nom} : ${apresV.mission.titre}`, font: TEXTE, seed: 9 + toasts.length }))
      pulsations.quetes = t
      jouer('achat')
    }
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
    // (six légères, deux lourdes — les deux dernières places)
    const armes = ['arme-canon', 'arme-canon', 'arme-rafale', 'arme-rafale', 'arme-canon', 'arme-canon', 'arme-missiles', 'arme-missiles']
    const outils = ['foreuse-3', 'aimant-2', 'radar', 'foreuse-2']
    flotte = choisirLeVaisseau(ajouterLeVaisseau(avecLeHangar(flotte, hangar), 'cuirasse'), 'cuirasse')
    livree = livreeDuVaisseau()
    // (DE VRAIS EXEMPLAIRES — Keko, 14/11 : « j'ai un moteur de remorqueur construit mais pas de chiffre » : ce lien
    // refaisait le hangar SANS ses exemplaires, et tout y redevenait « de base ». Ce qu'il donne est construit, un
    // exemplaire par place prise ; ce qu'on a construit en plus est gardé.)
    const avant = hangarActif(flotte)
    const deBase = modeleDeVaisseau('cuirasse').serie.possedees
    const construites: Record<string, number> = { ...(avant.construites ?? {}) }
    for (const id of new Set(['propulseur-l3', ...armes, ...outils])) {
      if (deBase.includes(id)) continue
      construites[id] = Math.max(construites[id] ?? 0, (id === 'propulseur-l3' ? 1 : 0) + armes.filter((x) => x === id).length + outils.filter((x) => x === id).length)
    }
    hangar = { possedees: [...new Set([...avant.possedees, 'propulseur-l3', ...armes, ...outils])], montees: { coque: 'coque-4', propulseur: 'propulseur-l3' }, outils, armes, construites }
  }
  /** `&ouvertes` : toutes les pièces de chaque vaisseau qu'on a sont OUVERTES à l'achat, sans faire leurs missions — pour essayer les achats d'un lien (le temps de la page, tant qu'on ne sauve rien). */
  if (parametres.has('ouvertes')) {
    flotte = avecLeHangar(flotte, hangar)
    flotte = { ...flotte, vaisseaux: Object.fromEntries(Object.entries(flotte.vaisseaux).map(([id, e]) => [id, { ...e, ouvertes: [...modeleDeVaisseau(id).pieces] }])) }
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
  /**
   * LE MONDE A SON CANEVAS, SOUS CELUI DE L'INTERFACE (Keko, 14/11 : « on peut empêcher les éléments d'UI — les flèches,
   * les validations d'objectifs, la vie, la soute, les joysticks, le mot extraction et le countdown — de bouger avec le
   * zoom ? ») : quand le champ de vision s'élargit, LE MONDE se peint dans un tampon plus grand, montré à la même
   * taille d'écran sur ce canevas-ci ; L'INTERFACE reste dans le tampon de toujours, à sa taille, sur le canevas du
   * dessus, transparent là où elle ne dessine rien. Les deux occupent la même case de la grille. Au champ normal, ce
   * canevas est caché et tout se peint dans le premier, comme avant.
   */
  const canvasMonde = document.createElement('canvas')
  canvasMonde.className = 'vaisseau-canvas'
  canvasMonde.style.gridArea = '1 / 1'
  canvasMonde.style.display = 'none'
  canvas.style.gridArea = '1 / 1'
  const gMonde = canvasMonde.getContext('2d')!
  scene.append(canvasMonde)
  scene.append(canvas)
  /**
   * LE CLIC DROIT N'OUVRE PAS LE MENU DU NAVIGATEUR (« Enregistrer l'image… »), ET LE CURSEUR EST DANS LA LANGUE DU JEU
   * (Keko, 15/11) : une flèche en pixels — acier clair, cernée d'encre —, dessinée ici dans un petit canevas et donnée
   * au navigateur en image ; sur ce qui se clique, la même en or. TROIS pixels d'écran par pixel du dessin, à peu près
   * ceux de l'interface sur PC (Keko, 15/11 : à deux, « c'est trop fin »).
   */
  racine.addEventListener('contextmenu', (ev) => ev.preventDefault())
  const curseurEnPixels = (corps: string, clair: string): string => {
    // (une flèche : `#` le cerne, `o` le corps, `+` son arête claire)
    const DESSIN = ['#..........', '##.........', '#+#........', '#+o#.......', '#+oo#......', '#+ooo#.....', '#+oooo#....', '#+ooooo#...', '#+oooooo#..', '#+ooooooo#.', '#+oooo#####', '#+o#oo#....', '#+#.#oo#...', '##..#oo#...', '#....#oo#..', '.....###...']
    const K = 3
    const c = document.createElement('canvas')
    c.width = 11 * K
    c.height = DESSIN.length * K
    const g2 = c.getContext('2d')
    if (g2 === null) return 'auto'
    DESSIN.forEach((ligne, y) => {
      for (let x = 0; x < ligne.length; x++) {
        const ch = ligne[x]
        if (ch === '.') continue
        g2.fillStyle = ch === '#' ? '#07050d' : ch === '+' ? clair : corps
        g2.fillRect(x * K, y * K, K, K)
      }
    })
    return `url(${c.toDataURL('image/png')}) ${K - 1} ${K - 1}, auto`
  }
  const CURSEUR = curseurEnPixels('#9fb4d2', '#ffffff')
  const CURSEUR_QUI_CLIQUE = curseurEnPixels('#f6c94a', '#fff2a8')
  racine.style.cursor = CURSEUR
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
    // (le jeu du vortex : les deux canons tirent À TOUR DE RÔLE — le second part une demi-cadence après le premier)
    if (parametres.has('vortex') && CONF.armes.length === 2) monde.armesA = [0, CONF.armes[0].cadence / 2]
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
  /** Les météores dont l'impact a déjà sonné, en avance (voir `annoncerLesSons`). */
  const meteoresAnnoncees = new Set<number>()
  /** L'instant où chaque rival a pris un obus (il blanchit), et celui du dernier coup pris par le bouclier (son anneau flashe). */
  const toucheEnnemiA = new Map<number, number>()
  let bouclierA = -10
  /** Les coups récents que le bouclier a pris : où (dans le monde), quand, et s'il en a été vidé (la bulle se fêle). */
  const coupsAuBouclier: { x: number; y: number; t0: number; brise: boolean }[] = []
  const flammesEnnemies = new Map<number, number>()
  let enJeu = false
  let zoom = 2
  /**
   * LE CHAMP DE VISION SE RÈGLE PAR DEUX BOUTONS, « + » ET « − », SOUS LA BARRE DE VIE (Keko, 14/11 — d'abord essayé au
   * second manche, « en le montant et en le descendant, zoomer ou dézoomer la vue, afin d'augmenter le champ de vision
   * du joueur » ; puis : « reviens à la rotation du vaisseau sur le second stick et ajoute plutôt un bouton plus ou
   * moins pour le zoom sous la barre de vie ») : `champ` — 1, la vue de toujours ; 2, on voit deux fois
   * plus loin. LE TAMPON GRANDIT D'AUTANT et s'affiche à la même taille d'écran : chaque pixel du jeu est plus petit
   * (l'interface du vol aussi). Par pas de deux pixels de tampon (un quart de champ d'abord : « par à-coups ») ; `champVoulu`
   * glisse entre eux. En vol seulement : la base garde son tampon.
   */
  let champ = 1
  let champVoulu = 1
  /** Ce que les boutons ont demandé : le champ y glisse. */
  let champCible = 1
  let champApplique = 1
  /** Sur PC (un pointeur fin), en vol : le jeu couvre toute la page (voir `cadrer`). `&couvre=0` rend les marges. */
  const PC = typeof matchMedia === 'function' && matchMedia('(pointer: fine)').matches && parametres.get('couvre') !== '0'
  const doitCouvrir = (): boolean => PC && enJeu && !ecranVisible()
  let couvreApplique = false
  /** De combien le tampon de l'interface dépasse la vue de référence (sur PC : elle est dessinée plus fin) ; et ce qu'un de ses pixels vaut à l'écran, au plus. */
  let echelleUI = 1
  const PIXEL_D_INTERFACE_SUR_PC = 2.5 // (3 d'abord : encore trop gros)
  /** Le champ du tampon QU'ON PEINT : celui du monde pendant qu'on peint le monde, 1 pour l'interface. */
  let champDeLaVue = 1
  const CHAMP_MAX = 2
  /** `&zoom=boutons` : les boutons « + » et « − » d'avant, à la place du zoom automatique. */
  const ZOOM_A_LA_MAIN = parametres.get('zoom') === 'boutons'
  /** Le zoom automatique : sous cette vitesse (px/s) la vue de près, à celle-là et au-delà le champ le plus large, `CHAMP_AUTO`. `&champ=N` l'essaie (1 à 2). */
  const VITESSE_DE_PRES = 35
  const VITESSE_DU_LARGE = 125
  const CHAMP_AUTO = Math.max(1, Math.min(CHAMP_MAX, Number(parametres.get('champ')) || 1.7))
  const champDuMoment = (): number => (enJeu && !ecranVisible() ? champ : 1)
  /**
   * LE ZOOM DU VORTEX, AU GESTE (Keko, 17/11 : « quand on met le deuxième doigt sur l'écran, ou quand on clique avec la
   * souris, et qu'on monte vers le haut ou vers le bas, on va zoomer, dézoomer… jusqu'à 1… jusqu'à 2. Et on commence de
   * base à 1,5 ») : `pince` est ce doigt (ou la souris tenue) — monter rapproche la vue, descendre l'éloigne, toute la
   * course sur `COURSE_DU_ZOOM` de la hauteur de l'écran. `&champ=N` part de N.
   */
  let champDuVortex = parametres.has('champ') ? CHAMP_AUTO : 1.5
  let pince: { id: number; y0: number; champ0: number; doigt: Vecteur } | null = null
  // (0,4 d'abord — Keko, 17/11 : « réduis la taille du slider de moitié, on n'a pas besoin d'une précision aussi importante »)
  const COURSE_DU_ZOOM = 0.2
  /**
   * LA RÉGLETTE DU ZOOM (Keko, 17/11 : « un petit slider sur une ligne sous le pouce quand on zoome et qu'on dézoome, que le
   * joueur voit le minimum et le maximum ») : une ligne verticale, « + » en haut (1, la vue de près), « − » en bas (2, la
   * plus large), le curseur où en est le champ. Elle est posée au premier contact et ne bouge plus ; au doigt, un peu à
   * gauche du pouce (dessous, il la cacherait). Elle s'efface au relâchement. En pixels CSS : `x`, `haut`, `bas`.
   */
  let reglette: { x: number; haut: number; bas: number; vueA: number } | null = null
  const A_COTE_DU_POUCE = 34
  /**
   * LA RÉGLETTE FIXE, À L'ESSAI (Keko, 17/11 : « à la place d'utiliser le deuxième stick pour faire le slider de zoom, on
   * met le slider de zoom sous la barre de vie, verticalement, quand on est en mode paysage, et en bas à droite de l'écran,
   * quand on est en mode portrait, de manière horizontale ») : on la tire (la vue suit le curseur), une tape sur « + » ou
   * « − » fait un pas d'un quart. Couchée : « + » en haut ; debout : « + » à droite. `&zoom=pince` rend le geste du
   * deuxième doigt (et de la souris tenue) avec sa réglette sous le pouce. `regletteFixe` : sa place à cette image, dans
   * le tampon de l'interface — `a0` le bout « + » de la course, `a1` le bout « − », `axe` la colonne (ou la rangée).
   */
  const ZOOM_PAR_PINCE = parametres.get('zoom') === 'pince'
  let regletteFixe: { verticale: boolean; axe: number; a0: number; a1: number } | null = null
  let regletteTenue: number | null = null
  const PLAQUE_DE_REGLETTE = 14
  const ECART_DE_REGLETTE = 4
  /** Ce que vise un point du tampon sur la réglette fixe : 'plus', 'moins', 'course', ou null hors d'elle. */
  function surLaRegletteFixe(q: Vecteur): 'plus' | 'moins' | 'course' | null {
    const r = regletteFixe
    if (r === null) return null
    const travers = r.verticale ? q.x - r.axe + 0.5 : q.y - r.axe + 0.5
    const long = r.verticale ? q.y : q.x
    if (Math.abs(travers) > PLAQUE_DE_REGLETTE / 2 + 3) return null
    const bout = ECART_DE_REGLETTE + PLAQUE_DE_REGLETTE + 2
    const lo = Math.min(r.a0, r.a1)
    const hi = Math.max(r.a0, r.a1)
    if (long < lo - bout || long > hi + bout) return null
    if (long < lo - ECART_DE_REGLETTE) return r.a0 < r.a1 ? 'plus' : 'moins'
    if (long > hi + ECART_DE_REGLETTE) return r.a0 < r.a1 ? 'moins' : 'plus'
    return 'course'
  }
  /** La vue que donne ce point de la course. */
  function champSurLaReglette(q: Vecteur): number {
    const r = regletteFixe!
    const long = r.verticale ? q.y : q.x
    return Math.max(1, Math.min(CHAMP_MAX, 1 + ((long - r.a0) / (r.a1 - r.a0)) * (CHAMP_MAX - 1)))
  }
  function poserLaPince(ev: PointerEvent): void {
    pince = { id: ev.pointerId, y0: ev.clientY, champ0: champDuVortex, doigt: { x: ev.clientX, y: ev.clientY } }
    const course = Math.max(1, racine.clientHeight * COURSE_DU_ZOOM)
    const x = ev.clientX - (ev.pointerType === 'mouse' ? 0 : A_COTE_DU_POUCE)
    reglette = { x, haut: ev.clientY - (champDuVortex - 1) * course, bas: ev.clientY + (CHAMP_MAX - champDuVortex) * course, vueA: t }
  }
  /** « + » zoome (le champ se resserre), « − » dézoome ; côte à côte, ou l'un sur l'autre (`empiles`, dans le bandeau couché). */
  function dessinerLeZoom(p: Peintre, x: number, y: number, empiles: boolean): void {
    const B = 13
    const HB = 11
    const un = (bx: number, by: number, plus: boolean): void => {
      const possible = plus ? champCible > 1 + 1e-6 : champCible < CHAMP_MAX - 1e-6
      const e = etatDuBouton(bx, by, B, HB)
      plaque(p, bx, by + e.dy, B, HB, possible ? 'clair' : 'eteint', { enfonce: e.enfonce, flash: e.flash })
      const c = possible ? N.hex('#10182a') : COQUE[3]
      p.rect(bx + 4, by + 5 + e.dy, 5, 1, c)
      if (plus) p.rect(bx + 6, by + 3 + e.dy, 1, 5, c)
      // (la zone déborde du dessin : c'est un petit bouton sous un pouce)
      if (possible) zone(bx - 2, by - 2, B + 4, HB + 4, () => (champCible = Math.max(1, Math.min(CHAMP_MAX, champCible + (plus ? -0.25 : 0.25)))), 'clic')
    }
    un(x, y, empiles)
    if (empiles) un(x, y + HB + 4, false)
    else un(x + B + 4, y, true)
  }
  let frame = N.createFrame(W, H)
  let img = g.createImageData(W, H)
  let frameMonde = N.createFrame(W, H)
  let imgMonde = gMonde.createImageData(W, H)
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
  /** (LES INSECTES SONT BIOLOGIQUES — Keko, 14/11 : leurs grains de propulsion « en vert plutôt qu'en feu ») */
  const BRAISES_VERTES = ['#f0ffd8', '#c8f77a', '#96e04a', '#62bd34', '#3f9428', '#2a6c20', '#1a4818', '#0e2a10'].map((h) => N.hex(h))
  // (L'EXPÉRIENCE EST AUX COULEURS DU CRISTAL, la barre comme les pépites — Keko, 15/11 ; elles ont été violettes un jour)
  const XP = TEINTES_MINERAI.cristal
  const SANG_VERT = [N.hex('#d8ff8a'), N.hex('#8ee03c'), N.hex('#4aa82a'), N.hex('#2a6c20')]
  /** Les taches que laissent les insectes écrasés (dans le monde) : elles pâlissent et s'en vont en quelques secondes. */
  let taches: { x: number; y: number; t0: number; graine: number }[] = []
  const VIE_D_UNE_TACHE = 5
  function dessinerLesTaches(p: Peintre): void {
    taches = taches.filter((ta) => t - ta.t0 < VIE_D_UNE_TACHE)
    p.place(W / 2 - camera.x, centreY() - camera.y)
    for (const ta of taches) {
      const age = t - ta.t0
      const k = Math.min(1, age / 0.12)
      const fondu = age > VIE_D_UNE_TACHE - 1.5 ? (VIE_D_UNE_TACHE - age) / 1.5 : 1
      for (let i = 0; i < 7; i++) {
        const a = ((ta.graine * 37 + i * 131) % 360) * (Math.PI / 180)
        const d = i === 0 ? 0 : (2 + ((ta.graine * 13 + i * 7) % 6)) * k
        const r = i === 0 ? 3.2 * k : 0.8 + ((ta.graine + i * 5) % 3) * 0.6
        p.circle(ta.x + Math.cos(a) * d, ta.y + Math.sin(a) * d, r, i % 3 === 0 ? SANG_VERT[2] : SANG_VERT[3], 0.85 * fondu)
      }
      if (age < 0.25) p.circle(ta.x, ta.y, 2.2, SANG_VERT[0], 1 - age / 0.25)
    }
    p.place(0, 0)
  }
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
      // (SUR PC, LA BASE EST DESSINÉE PLUS FIN — Keko, 15/11 : « l'interface est trop grosse sur PC, c'est vraiment énorme ;
      // sur téléphone c'est bon » : un pixel du tampon y vaut trois pixels d'écran au plus, au lieu de six, et le
      // tampon peut être plus grand — la scène et les listes y gagnent de la place)
      zoom = Math.max(1, Math.min(PC ? 3 : 6, Math.floor(large / 320), Math.floor(haut / 180)))
      w = Math.max(320, Math.min(PC ? 640 : 480, Math.floor(large / zoom)))
      h = Math.max(180, Math.min(PC ? 360 : 240, Math.floor(haut / zoom)))
    } else {
      zoom = Math.max(1, Math.min(6, Math.floor(large / 180), Math.floor(haut / 320)))
      h = Math.max(120, Math.min(480, Math.floor(haut / zoom)))
    }
    // SUR PC, EN VOL, LE JEU COUVRE TOUTE LA PAGE (Keko, 14/11 : « adapter l'écran à celui d'un PC pour que l'écran de jeu
    // recouvre toute la page Internet, quitte à ce que le vaisseau soit plus zoomé ») : le tampon prend LA FORME DE LA
    // PAGE, taillé DANS la vue fixe (320 × 180, ou 180 × 320 debout) — on ne voit jamais plus loin qu'un autre joueur,
    // on voit un peu moins sur le côté qui dépasse — et il est agrandi d'un facteur QUELCONQUE, plus forcément entier,
    // jusqu'aux bords : plus de marges autour, plus de bandeaux noirs. Au doigt et à la base, rien ne change.
    couvreApplique = doitCouvrir()
    if (couvreApplique && large > 0 && haut > 0) {
      const VW = paysage ? 320 : 180
      const VH = paysage ? 180 : 320
      const r = large / haut
      // (LA VUE DE RÉFÉRENCE Y TIENT TOUJOURS ENTIÈRE — Keko, 15/11 : « sur PC je suis beaucoup trop zoomé, je ne vois pas
      // loin, alors que sur téléphone je vois beaucoup plus loin » : le tampon était d'abord taillé DANS la vue de
      // référence — une fenêtre moins allongée qu'elle perdait ses côtés, une fenêtre à peu près carrée n'en gardait
      // que la moitié. Il la CONTIENT maintenant : on voit au moins autant qu'au téléphone, et davantage du côté qui dépasse.)
      if (r > VW / VH) {
        h = VH
        w = Math.min(640, Math.round(VH * r))
      } else {
        w = VW
        h = Math.min(640, Math.round(VW / r))
      }
      // L'INTERFACE EST DESSINÉE PLUS FIN SUR PC (Keko, 15/11 : « sur téléphone c'est la bonne échelle, mais sur PC
      // l'interface est dessinée beaucoup trop gros ») : son tampon est plus grand que la vue de référence — un pixel
      // d'interface vaut TROIS pixels d'écran au plus, au lieu de cinq ou six — ; le monde, lui, garde son tampon à
      // lui, à l'échelle du jeu (`champApplique` en tient compte).
      echelleUI = Math.max(1, large / w / PIXEL_D_INTERFACE_SUR_PC)
      w = Math.round(w * echelleUI)
      h = Math.round(h * echelleUI)
      zoom = large / w
    } else echelleUI = 1
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
    // (le champ de vision : LE TAMPON DU MONDE grandit, l'écran qu'il couvre ne change pas ; celui de l'interface ne bouge pas)
    champApplique = champDuMoment() / echelleUI
    const wm = Math.round(W * champApplique)
    const hm = Math.round(H * champApplique)
    if (frameMonde.w !== wm || frameMonde.h !== hm) {
      frameMonde = N.createFrame(wm, hm)
      canvasMonde.width = wm
      canvasMonde.height = hm
      imgMonde = gMonde.createImageData(wm, hm)
    }
    canvasMonde.style.width = canvas.style.width
    canvasMonde.style.height = canvas.style.height
    canvasMonde.style.display = champApplique !== 1 ? '' : 'none'
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
   * LA CONFIGURATION D'UN VOL, POUR UNE ARME (sortie de `demarrer` — Keko, 17/11 : l'aperçu des armes, au hangar, arme un
   * petit monde à part avec la même configuration que le vrai vol) : les pièces montées, le labo, l'arme du vortex et sa
   * place sur le vaisseau, l'espace du vortex, la vie de la race. `graine` : celle de l'espace.
   */
  function configDuVol(arme: string, graine: number): ConfigVaisseau {
      let conf = configDuLabo(configDuHangar(BASE, hangar), labo) // (les passifs et les mécaniques du labo par-dessus les pièces montées)
      // UN AUTRE ESPACE À CHAQUE VOL (Keko : « randomiser à chaque vol pour l'instant, histoire de tester ») : une graine
      // tirée ici — le hasard est du côté de la page — entre dans le champ d'astéroïdes, dans le monde (le rival) et dans
      // le ciel ; `&graine=N` la fixe (0 : l'espace de toujours)
      // (LES OBUS PARTENT DE LA BOUCHE DE LEUR ARME, là où elle est dessinée sous son aile — c'est le rendu qui la connaît)
      conf = { ...conf, armes: conf.armes.map((a) => ({ ...a, bouche: boucheMontee(monteeA(hangar, 'coque').cran, a.id, a.place ?? 0) })) }
      // (… ET CHAQUE FOREUSE CREUSE DE LÀ OÙ ELLE EST MONTÉE : le pivot de son canon, à sa place d'outil)
      conf = { ...conf, foreuses: conf.foreuses.map((f) => ({ ...f, place: ouEstLaForeuse(f.outil, f.cran) })) }
      conf = { ...conf, champ: { ...conf.champ, graine: graine } }
      // (LE JEU DU VORTEX : l'espace vide — ni roche, ni rival, ni quai)
      // LE VAISSEAU DU JEU DU VORTEX A UN CANON DANS CHAQUE AILE, QUI TIRENT À TOUR DE ROLE (Keko, 14/11) : deux canons,
      // chacun à la moitié de la cadence — le vaisseau tire aussi souvent qu'avec un seul, une aile puis l'autre
      if (VORTEX) {
        const canon = pieceDe(arme)?.arme
        // (… ET ILS NE TIRENT QUE DEVANT : cinquante degrés de part et d'autre du nez — `&arc=N` l'essaie, en degrés)
        // (PLUS DE RALENTI EN MARCHE ARRIÈRE : le nez regarde l'ennemi, on recule devant lui à pleine poussée — Keko, 15/11)
        // (LE LANCE-FLAMMES DE LA SALAMANDRE : un seul, au nez — Keko, 15/11)
        // (LES DRONES DE LA SENTINELLE : trois, répartis sur l'orbite — Keko, 15/11)
        // (LES TOURELLES DE L'INGÉNIEUR : une arme, qui les pose — Keko, 15/11)
        // (LE NAPALM DE LA SALAMANDRE : un mortier, au nez)
        // (L'ORBE DU PULSAR : une, qui se forme entre ses deux cornes — 16/11)
        if (canon?.napalm !== undefined || canon?.crachat !== undefined || canon?.plasma !== undefined || canon?.essaim !== undefined || canon?.sphere !== undefined || canon?.puits !== undefined || canon?.meteore !== undefined || canon?.rail !== undefined || canon?.balayage !== undefined || canon?.canalise !== undefined || canon?.chaine !== undefined || canon?.aura !== undefined) conf = { ...conf, marcheArriere: 1, alternance: false, armes: [{ ...canon, place: 0, bouche: boucheMontee(monteeA(hangar, 'coque').cran, canon.id, 0) }] }
        // (LA SCIE DE L'INGÉNIEUR : une, lancée du vaisseau)
        // (LE GIVRE DU FRIMAS : une traînée, semée derrière lui)
        // (LES TENTACULES DU KRAKEN : leurs ancres, là où le rendu dessine leurs racines — 16/11)
        else if (canon?.tentacule !== undefined) conf = { ...conf, marcheArriere: 1, alternance: false, armes: [{ ...canon, place: 0, tentacule: { ...canon.tentacule, ancres: ANCRES_DU_KRAKEN } }] }
        // (L'ESSAIM DU KRAKEN : un nuage, autour de lui)
        else if (canon?.nuee !== undefined || canon?.rejeton !== undefined || canon?.mine !== undefined || canon?.fleau !== undefined || canon?.parasite !== undefined || canon?.drain !== undefined || canon?.vrille !== undefined || canon?.ponte !== undefined || canon?.epines !== undefined) conf = { ...conf, marcheArriere: 1, alternance: false, armes: [{ ...canon, place: 0 }] }
        else if (canon?.pose !== undefined || canon?.scie !== undefined || canon?.balise !== undefined || canon?.givre !== undefined || canon?.nova !== undefined || canon?.salve !== undefined || canon?.tornade !== undefined) conf = { ...conf, marcheArriere: 1, alternance: false, armes: [{ ...canon, place: 0 }] }
        else if (canon?.orbite !== undefined) conf = { ...conf, marcheArriere: 1, alternance: false, armes: [0, 1, 2].map((k) => ({ ...canon, place: k, orbite: { ...canon.orbite!, phase: (k * 2 * Math.PI) / 3 } })) }
        else if (canon?.flamme !== undefined) conf = { ...conf, marcheArriere: 1, alternance: false, armes: [{ ...canon, place: 0, bouche: boucheMontee(monteeA(hangar, 'coque').cran, canon.id, 0) }] }
        else if (canon !== undefined) conf = { ...conf, marcheArriere: 1, alternance: true, arcDeTir: tirA360 ? 0 : ARC_DU_VORTEX, armes: [0, 1].map((place) => ({ ...canon, cadence: canon.cadence * 2, place, bouche: boucheMontee(monteeA(hangar, 'coque').cran, canon.id, place) })) }
      }
      if (VORTEX) conf = { ...conf, champ: { ...conf.champ, densite: 0 }, station: { ...conf.station, portee: -1 }, invasion: { ...conf.invasion, active: true, viePortail: Math.max(1, Number(parametres.get('portail')) || conf.invasion.viePortail) /* (`&portail=N` : la vie du portail au départ, pour voir la fin d'un lien) */ }, ennemi: { ...conf.ennemi, ...INSECTE }, bouclier: { ...conf.bouclier, points: Math.max(conf.bouclier.points, BOUCLIER_DU_VORTEX) } }
      // LE RIVAL EST UN CUIRASSÉ LOURDEMENT ARMÉ (Keko, 14/11, à l'essai : « pour voir si je peux arriver à le tuer avec mon
      // chasseur ») : gros, lent, qui vire mal, très solide, et qui tire trois fois plus souvent, de plus loin ; il ne
      // fuit plus. `&rival=serie` rend le petit rival d'avant. *Chiffres au jugé.*
      // (SES VRAIES ARMES — Keko, 14/11 : « deux canons, le reste en mitraillette, tous ses slots d'armes légères
      // remplis, et deux missiles dans ses slots lourds » : celles du catalogue, chacune à sa bouche sur la coque)
      if (RIVAL_CUIRASSE && !VORTEX) {
        const armes = ARMES_DU_RIVAL.flatMap((id, place) => {
          const a = pieceDe(id)?.arme
          return a === undefined ? [] : [{ ...a, place, bouche: boucheMontee(4, a.id, place) }]
        })
        conf = { ...conf, ennemi: { ...conf.ennemi, pv: 160, poussee: 45, vitesseMax: 42, rotation: 0.7, rayon: 18, voit: 150, tient: 75, lache: 300, fuit: 99999, armes } }
      }
      // LA VIE SELON LA RACE (Keko, 17/11 — voir `vieSelonLaRace`) : les Éthérés, un gros bouclier sur un blindage fragile ;
      // l'Essaim, pas de bouclier, une coque qui se régénère
      if (VORTEX) conf = { ...conf, ...vieSelonLaRace(modeleDeVaisseau(flotte.actif).race, { coque: conf.coque, bouclier: conf.bouclier, regeneration: conf.regeneration, plaques: conf.plaques, corruption: conf.corruption }, modeleDeVaisseau(flotte.actif).plaques) }
      if (bouclierDEssai > 0) conf = { ...conf, bouclier: { ...conf.bouclier, points: bouclierDEssai } }
    return conf
  }
  /**
   * Le décollage, depuis le hangar (le bouton) ou au clavier : l'expédition part à neuf avec le vaisseau tel que monté
   * (la configuration se refait des pièces) ; après une coque percée ou une extraction, pareil — le trésor et les pièces
   * restent, c'est tout ce qui reste.
   */
  function demarrer(): void {
    // (ce que l'aperçu des armes a semé au hangar ne suit pas dans le vol)
    effets = []
    flashs.length = 0
    pops.length = 0
    taches = []
    consumes = []
    impactsDeMeteore.length = 0
    etincelles.vider()
    braises.vider()
    morceaux.list.length = 0
    if (enJeu && m.phase === 'vol') return
    if (enJeu && t - perduA < 1.2) return
    souris = null // (la souris ne vise qu'une fois bougée pendant ce vol)
    graineDuVol = parametres.has('graine') ? Math.max(0, Math.floor(Number(parametres.get('graine')) || 0)) : 1 + Math.floor(Math.random() * 1e6)
    CONF = configDuVol(armeDuVortex(), graineDuVol)
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
  type Allure = { /** Le ver : ses anneaux sur le chemin de sa tête (voir `cheminDuVer`). */ chemin?: [number, number][]; propulseur: number; coque: number; /** Le cran de la foreuse montée, 0 sans foreuse. */ foreuse: number; radar: boolean; aimant: boolean; armes: string[]; bouclier: number; outils?: ({ famille: string; cran: number } | null)[]; foreusePlace?: number; vises?: number[]; habit?: Habit }
  /**
   * L'ARME DU JEU DU VORTEX (Keko, 15/11 : « Arme et le nom de l'arme, avec un bouton pour changer ») : le canon, un par
   * aile — LA MÊME SUR LES DEUX AILES, et c'est elle que le vaisseau porte au hangar comme en vol, et qui tire.
   */
  // (LA MITRAILLEUSE EST OUVERTE AUSSI, pour l'essayer — Keko, 15/11 : « débloque-moi la mitrailleuse pour tester » ;
  // l'arme équipée est gardée sur l'appareil)
  // (CHAQUE VAISSEAU A SES ARMES — la Salamandre, son lance-flammes ; l'arme équipée est gardée par vaisseau)
  const ARMES_PAR_VAISSEAU: Record<string, string[]> = { chasseur: ['arme-canon', 'arme-rafale', 'arme-minimissiles'], salamandre: ['arme-flammes', 'arme-rayon', 'arme-napalm'], sentinelle: ['arme-drones', 'arme-chaine', 'arme-aura'], ingenieur: ['arme-tourelles', 'arme-scie', 'arme-fleau'], frimas: ['arme-nova', 'arme-eclats', 'arme-tornade'], pulsar: ['arme-plasma', 'arme-essaim', 'arme-meteore'], kraken: ['arme-tentacules', 'arme-nuee', 'arme-rejetons'], vouivre: ['arme-crachat', 'arme-mines', 'arme-poison'], prisme: ['arme-faisceau', 'arme-cristaux', 'arme-rail'], neant: ['arme-puits', 'arme-drain', 'arme-vrilles'], mante: ['arme-parasites', 'arme-oeufs', 'arme-epines'], tesseract: ['arme-balises'] }
  const armesDuVortex = (): string[] => ARMES_PAR_VAISSEAU[flotte.actif] ?? ARMES_PAR_VAISSEAU.chasseur
  const armesChoisies: Record<string, string> = {}
  const armeDuVortex = (): string => {
    const l = armesDuVortex()
    const a = (armesChoisies[flotte.actif] ??= chargerArme(flotte.actif))
    return l.includes(a) ? a : l[0]
  }
  const choisirLArme = (id: string): void => {
    armesChoisies[flotte.actif] = id
    sauverArme(flotte.actif, id)
  }
  // (`&arme=ID` : décoller avec cette arme du vaisseau piloté, sans la garder — pour l'essayer d'un lien)
  if (parametres.has('arme') && armesDuVortex().includes(parametres.get('arme') ?? '')) armesChoisies[flotte.actif] = parametres.get('arme') ?? ''
  const ALLURE_SERIE: Allure = { propulseur: 1, coque: 1, foreuse: 1, radar: false, aimant: false, armes: [], bouclier: 0 }
  /** Le rival en cuirassé (à l'essai, 14/11 ; `&rival=serie` : le petit rival d'avant) : son allure, tout armé. */
  const RIVAL_CUIRASSE = parametres.get('rival') !== 'serie'
  /** Ses armes, place par place : six légères — SIX CANONS (Keko, 14/11 : les quatre mitrailleuses remplacées) —, deux lourdes (les missiles). */
  const ARMES_DU_RIVAL = ['arme-canon', 'arme-canon', 'arme-canon', 'arme-canon', 'arme-canon', 'arme-canon', 'arme-missiles', 'arme-missiles']
  const ALLURE_DU_RIVAL: Allure = RIVAL_CUIRASSE ? { propulseur: 3, coque: 4, foreuse: 3, radar: true, aimant: false, armes: ARMES_DU_RIVAL.map((id) => pieceDe(id)?.arme?.id ?? ''), bouclier: 0, outils: [{ famille: 'foreuse', cran: 3 }, { famille: 'radar', cran: 2 }, { famille: 'foreuse', cran: 2 }, null], foreusePlace: 0 } : ALLURE_SERIE
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
  const allureMontee = (bouclier: number): Allure => ({ propulseur: monteeA(hangar, 'propulseur').cran, coque: monteeA(hangar, 'coque').cran, foreuse: parametres.has('vortex') && ((pieceDe(armeDuVortex())?.arme?.canalise !== undefined && pieceDe(armeDuVortex())?.arme?.id !== 'faisceau') || pieceDe(armeDuVortex())?.arme?.balayage?.trace !== undefined) ? 3 : (foreuseMontee(hangar)?.cran ?? 0), radar: radarMonte(hangar) > 0, aimant: aimantMonte(hangar) > 1, armes: parametres.has('vortex') ? (pieceDe(armeDuVortex())?.arme?.balayage?.trace !== undefined || pieceDe(armeDuVortex())?.arme?.orbite !== undefined || pieceDe(armeDuVortex())?.arme?.pose !== undefined || pieceDe(armeDuVortex())?.arme?.canalise !== undefined || pieceDe(armeDuVortex())?.arme?.chaine !== undefined || pieceDe(armeDuVortex())?.arme?.aura !== undefined || pieceDe(armeDuVortex())?.arme?.scie !== undefined || pieceDe(armeDuVortex())?.arme?.balise !== undefined || pieceDe(armeDuVortex())?.arme?.givre !== undefined || pieceDe(armeDuVortex())?.arme?.nova !== undefined || pieceDe(armeDuVortex())?.arme?.salve !== undefined || pieceDe(armeDuVortex())?.arme?.tornade !== undefined || pieceDe(armeDuVortex())?.arme?.plasma !== undefined || pieceDe(armeDuVortex())?.arme?.essaim !== undefined || pieceDe(armeDuVortex())?.arme?.sphere !== undefined || pieceDe(armeDuVortex())?.arme?.puits !== undefined || pieceDe(armeDuVortex())?.arme?.meteore !== undefined || pieceDe(armeDuVortex())?.arme?.rail !== undefined || pieceDe(armeDuVortex())?.arme?.tentacule !== undefined || pieceDe(armeDuVortex())?.arme?.nuee !== undefined || pieceDe(armeDuVortex())?.arme?.rejeton !== undefined || pieceDe(armeDuVortex())?.arme?.crachat !== undefined || pieceDe(armeDuVortex())?.arme?.mine !== undefined || pieceDe(armeDuVortex())?.arme?.fleau !== undefined || pieceDe(armeDuVortex())?.arme?.parasite !== undefined || pieceDe(armeDuVortex())?.arme?.drain !== undefined || pieceDe(armeDuVortex())?.arme?.vrille !== undefined || pieceDe(armeDuVortex())?.arme?.ponte !== undefined || pieceDe(armeDuVortex())?.arme?.epines !== undefined ? [] : pieceDe(armeDuVortex())?.arme?.flamme !== undefined || pieceDe(armeDuVortex())?.arme?.napalm !== undefined || pieceDe(armeDuVortex())?.arme?.balayage !== undefined ? [0] : [0, 1]).map(() => pieceDe(armeDuVortex())?.arme?.id ?? '') : Array.from({ length: capacite(hangar, 'arme') }, (_, k) => pieceDe(hangar.armes[k] ?? '')?.arme?.id ?? ''), bouclier, outils: outilsParPlace(), foreusePlace: placeDeLaForeuse(), habit: habitDuJoueur(monteeA(hangar, 'coque').cran) })
  /** L'écran est là quand rien ne vole : avant le premier décollage, et après une fin, le temps que l'effet passe. */
  /**
   * L'ACCUEIL (Keko, 11/11 : « un écran d'accueil avec une demande de tap pour lancer le hangar, afin de débloquer les
   * sons — actuellement il faut que je tape avant que le jeu lance le son ; un bel écran dans le thème graphique du
   * jeu, et le titre : Nova Drifter ») : le jeu s'ouvre dessus, et c'est SA tape qui fait naître le contexte audio — le
   * hangar arrive donc avec ses sons. `&direct` le saute (ce qui se teste doit s'ouvrir d'un lien).
   */
  /**
   * `?vortex` : UN AUTRE JEU SUR LE MÊME MOTEUR (Keko, 14/11 : « on peut essayer un nouveau jeu basé sur notre moteur ?
   * Lance directement le jeu sans passer via la base : on garde la map de l'espace mais sans astéroïde ni ennemis ni
   * point d'extraction ; on dessine un vortex au milieu de la map ») : pas d'accueil, pas de base — on vole tout de
   * suite ; le champ est vide, aucun rival ne naît, la station n'existe pas ; au centre du monde, LE VORTEX
   * (`keko/vortex`, le « Portal » du dépôt sans son sol). Rien n'y touche la sauvegarde du Nova Drifter.
   */
  const VORTEX = parametres.has('vortex')
  /** Le bouclier de base du jeu du vortex, en points (un chiffre de moi, à rejuger). */
  const BOUCLIER_DU_VORTEX = 3
  /** L'INSECTE de l'invasion, en chiffres de rival (de moi, à rejuger) : deux obus de canon l'abattent ; il marche à 40, vire vite ; il lâche UNE PÉPITE (de l'expérience) et ne tire pas — il mord. */
  const INSECTE = { pv: 12, poussee: 90, vitesseMax: 40, rotation: 6, rayon: 5, butinRendu: 1, armes: [] as never[] }
  let vortexFx: Instance | null = null
  /** (« Tir face » est gardé, le bouton qui le comparait à un tir à 360° est retiré — Keko, 15/11 ; `&tir=360` l'essaie encore.) */
  const tirA360 = parametres.get('tir') === '360'
  const ARC_DU_VORTEX = ((Number(parametres.get('arc')) || 50) * Math.PI) / 180
  /** Quand la dernière vague a commencé, quand le dernier insecte a traversé (l'interface le marque). */
  let passeA = -10
  /** Quand la vague en cours a commencé, et de quels cadrans elle vient : l'interface le montre par des flèches au bord. */
  let vagueA = -10
  let cadransDeLaVague: number[] = []
  /** L'ANNONCE D'UNE VAGUE : une flèche rouge au bord de l'écran, vers le milieu de chaque cadran d'où elle arrive, six secondes. */
  function dessinerLAnnonceDeLaVague(p: Peintre): void {
    const age = t - vagueA
    if (age < 0 || age > 6) return
    const bat = Math.sin(t * 9) > 0
    for (const q of cadransDeLaVague) {
      const a = (q + 0.5) * (Math.PI / 2)
      const dx = Math.cos(a) * CONF.invasion.naissance - camera.x
      const dy = Math.sin(a) * CONF.invasion.naissance - camera.y
      const ou = auBord(dx / champApplique, dy / champApplique)
      if (ou === null) continue
      dessinerUneFleche(p, ou.x, ou.y, Math.atan2(dy, dx), bat ? ROUGE[4] : ROUGE[3], bat ? ROUGE[5] : ROUGE[4], bat ? 0.5 : 0.3)
    }
  }
  /** Quand la dernière pépite d'expérience est montée à bord ; quand le dernier niveau a été gagné. */
  let xpA = -10
  let niveauA = -10
  /** Abattu, la caméra glisse du vaisseau vers le portail (0 : sur le vaisseau, 1 : sur le portail). */
  let versLePortail = 0
  let crashFait = false
  /** LE CHOIX D'UN TALENT en cours (null : on joue), ceux gardés en réserve, la fin du délai, l'instant de l'ouverture. */
  let choixDeTalent: Choix | null = null
  let reserveDeTalents = 0
  let talentFinA = 0
  let talentA = -10
  /**
   * LA BARRE D'EXPÉRIENCE (Keko, 14/11 : « une barre qui se remplit avec les pépites ; ne mets pas le mot XP ni aucun
   * symbole : juste le chiffre du niveau, en prévoyant qu'il peut aller jusqu'à trois chiffres ») : le niveau à
   * gauche, dans la place de trois chiffres, puis la barre ; elle s'allume à chaque pépite, flambe au niveau gagné.
   */
  /**
   * LE MÉDAILLON DU NIVEAU (Keko, 15/11 : « intégrer un peu mieux le chiffre dans la barre d'XP, pour donner une
   * cohérence à l'ensemble ; là, on dirait deux choses séparées ») : une plaque cernée d'encre comme la barre, liserée de
   * cristal, SOUDÉE à son bout — la barre en sort ; le chiffre dedans, dans la teinte de la barre (plus l'or du blindage).
   * Il bondit et blanchit au passage d'un niveau, avec elle.
   */
  function dessinerLeMedaillon(p: Peintre, x: number, y: number, w: number, h: number, niveau: number, G: number): void {
    const neuf = t - niveauA < 0.8
    const encre = neuf ? N.WHITE : MATIERES.encre.contour
    // (les coins coupés d'un pixel)
    p.rect(x + 1, y, w - 2, h, encre)
    p.rect(x, y + 1, w, h - 2, encre)
    p.rect(x + 1, y + 1, w - 2, h - 2, TEINTES_MINERAI.cristal[1])
    p.rect(x + 2, y + 2, w - 4, h - 4, N.hex('#16202f'))
    p.rect(x + 2, y + 2, w - 4, 1, N.hex('#2f3b58'))
    const dit = String(niveau)
    const saut = neuf ? Math.round(-2 * G * Math.abs(Math.sin((t - niveauA) * 14)) * (1 - (t - niveauA) / 0.8)) : 0
    motEnRelief(p, dit, x + w / 2, y + Math.round((h - 7 * G) / 2) + saut, 'cristal', GRAS, null, G) // (centré sur ses capitales : sept rangées)
    if (neuf) p.glow(x + w / 2, y + h / 2, w, XP[2], 0.6 * (1 - (t - niveauA) / 0.8))
  }
  function dessinerLExperience(p: Peintre, x: number, y: number, large: number): void {
    const inv = m.invasion
    const wn = largeurDe('000', GRAS)
    const neuf = t - niveauA < 0.8
    // (le médaillon, à gauche, plus haut que la barre de trois pixels de chaque côté ; la barre sort de son flanc droit)
    const wm = Math.max(15, largeurDe(String(inv.niveau), GRAS) + 8)
    dessinerLeMedaillon(p, x + wn + 3 - wm, y - 3, wm, 13, inv.niveau, 1)
    const bx = x + wn + 3
    const bw = large - wn - 3
    const part = Math.max(0, Math.min(1, inv.xp / xpDuNiveau(CONF, inv.niveau)))
    const allume = t - xpA < 0.15
    p.rect(bx - 1, y, bw + 2, 7, neuf ? N.WHITE : MATIERES.encre.contour)
    p.rect(bx, y + 1, bw, 5, N.hex('#2f3b58'))
    p.rect(bx, y + 1, bw, 1, N.hex('#465679'))
    const plein = Math.round(bw * part)
    if (plein > 0) {
      p.rect(bx, y + 1, plein, 5, allume || neuf ? N.WHITE : XP[2])
      if (!allume && !neuf) {
        p.rect(bx, y + 1, plein, 1, XP[3])
        p.rect(bx, y + 5, plein, 1, XP[1])
      }
      p.glow(bx + plein, y + 3, 6, XP[2], allume ? 0.8 : 0.3)
    }
    if (neuf) p.glow(bx + bw / 2, y + 3, bw * 0.6, XP[2], 0.5 * (1 - (t - niveauA) / 0.8))
  }
  /** LA MÊME, DEBOUT, dans le bandeau de gauche : le niveau en haut, centré sur `axe`, puis la barre qui descend — elle se remplit par le bas, comme le blindage d'en face. */
  function dessinerLExperienceDebout(p: Peintre, axe: number, y: number, G = 1): void {
    const inv = m.invasion
    const neuf = t - niveauA < 0.8
    const lw = 8
    const bx = axe - lw / 2
    // (le médaillon en tête ; la barre sort de son pied)
    const wm = Math.max(lw + 8, (largeurDe(String(inv.niveau), GRAS) + 6) * G + 2)
    const hm = 11 * G + 4
    dessinerLeMedaillon(p, Math.round(axe - wm / 2), y - 2, wm, hm, inv.niveau, G)
    const by = y - 2 + hm
    // (elle s'arrête AU MILIEU DE L'ÉCRAN — Keko, 14/11 : « qu'elle ne descende pas plus loin que la moitié »)
    const bh = Math.max(20, Math.round(H / 2) - by)
    const part = Math.max(0, Math.min(1, inv.xp / xpDuNiveau(CONF, inv.niveau)))
    const allume = t - xpA < 0.15
    p.rect(bx - 1, by - 1, lw + 2, bh + 2, neuf ? N.WHITE : MATIERES.encre.contour)
    p.rect(bx, by, lw, bh, N.hex('#2f3b58'))
    p.rect(bx, by, 1, bh, N.hex('#465679'))
    const plein = Math.round(bh * part)
    if (plein > 0) {
      p.rect(bx, by + bh - plein, lw, plein, allume || neuf ? N.WHITE : XP[2])
      if (!allume && !neuf) {
        p.rect(bx, by + bh - plein, 1, plein, XP[3])
        p.rect(bx + lw - 2, by + bh - plein, 2, plein, XP[1])
      }
      p.glow(axe, by + bh - plein, 6, XP[2], allume ? 0.8 : 0.3)
    }
    if (neuf) p.glow(axe, by + bh / 2, bh * 0.6, XP[2], 0.5 * (1 - (t - niveauA) / 0.8))
  }
  /**
   * LE COMPTE DU RETOUR (Keko, 14/11 : « quand je meurs, à la place de mettre fin à la partie, utilise le compte à
   * rebours qu'on avait dans la zone d'extraction et mets-le au milieu du portail, visible uniquement par le joueur qui
   * est mort ; à la fin, tu fais respawn le joueur — une pénalité de 10 secondes ») : le chiffre qui frappe à chaque
   * seconde, au centre du portail, là où il est à l'écran.
   */
  /**
   * LE VERROU (Keko, 15/11 : « quand on clique ou qu'on tape sur un ennemi, un petit verrouillage s'affiche dessus ; il
   * devient l'ennemi prioritaire, s'il est à portée de tir ; une seconde tape le déverrouille ») : quatre coins de visée
   * autour de lui — ils se referment sur lui en arrivant, blanchis un instant, puis respirent d'un pixel ; rouges quand il
   * est à portée des armes, gris au-delà (le plus proche tire alors à sa place). Déverrouillé, ils s'ouvrent et s'effacent.
   */
  let verrouA = -10
  let deverrou: { x: number; y: number; t0: number } | null = null
  function dessinerLesCoins(p: Peintre, sx: number, sy: number, demi: number, c: number, alpha = 1): void {
    // (PLUS ÉPAIS SUR PC — Keko, 15/11 : des traits de deux pixels, des branches de six)
    const ep = couvreApplique ? 2 : 1
    const L = couvreApplique ? 6 : 4
    for (const [kx, ky] of [[-1, -1], [1, -1], [-1, 1], [1, 1]] as const) {
      const x = Math.round(sx + kx * demi)
      const y = Math.round(sy + ky * demi)
      // (le coin : un trait de L pixels de chaque côté, vers l'intérieur, épais de `ep` vers l'intérieur, cerné d'encre)
      const hx = kx < 0 ? x : x - L + 1
      const hy = ky < 0 ? y : y - ep + 1
      const vx = kx < 0 ? x : x - ep + 1
      const vy = ky < 0 ? y : y - L + 1
      p.rect(hx - 1, hy - 1, L + 2, ep + 2, MATIERES.encre.contour, alpha)
      p.rect(vx - 1, vy - 1, ep + 2, L + 2, MATIERES.encre.contour, alpha)
      p.rect(hx, hy, L, ep, c, alpha)
      p.rect(vx, vy, ep, L, c, alpha)
    }
  }
  function dessinerLeVerrou(p: Peintre): void {
    const versEcran = (x: number, y: number): [number, number] => [(x - camera.x) / champApplique + W / 2, (y - camera.y) / champApplique + centreY()]
    const rs = CONF.ennemi.rayon / champApplique
    if (deverrou !== null) {
      const u = (t - deverrou.t0) / 0.2
      if (u >= 1) deverrou = null
      else {
        const [sx, sy] = versEcran(deverrou.x, deverrou.y)
        dessinerLesCoins(p, sx, sy, rs + 5 + 7 * u, COQUE[4], 1 - u)
      }
    }
    const e = ennemiVerrouille(m)
    if (e === null || m.phase !== 'vol') return
    const [sx, sy] = versEcran(e.corps.x, e.corps.y)
    const portee = Math.max(0, ...CONF.armes.map((a) => a.portee))
    const aPortee = Math.hypot(e.corps.x - m.vaisseau.x, e.corps.y - m.vaisseau.y) <= portee
    const du = t - verrouA
    const ferme = du < 0.18 ? 8 * Math.pow(1 - du / 0.18, 2) : 0
    const respire = du >= 0.18 && Math.sin(t * 6) > 0.6 ? 1 : 0
    const c = du < 0.1 ? N.WHITE : aPortee ? N.hex('#ff4a4a') : COQUE[3]
    dessinerLesCoins(p, sx, sy, rs + 5 + ferme + respire, c)
    if (aPortee) p.glow(sx, sy, rs + 8, N.hex('#ff4a4a'), du < 0.18 ? 0.5 : 0.12)
  }
  function dessinerLeRetour(p: Peintre): void {
    if (m.phase !== 'perdu') return
    const reste = Math.max(0, m.invasion.retourA - m.t)
    const sx = -camera.x / champApplique + W / 2
    const sy = -camera.y / champApplique + centreY()
    const ub = Math.ceil(reste) - reste
    const tremble = ub < 0.22 ? 3 * (1 - ub / 0.22) : 0
    p.glow(sx, sy, 30, PEPITE[2], 0.25 + (ub < 0.12 ? 0.6 * (1 - ub / 0.12) : 0))
    motFrappe(p, String(Math.max(1, Math.ceil(reste))), sx + Math.round(Math.sin(t * 90) * tremble), sy - 6 + Math.round(Math.cos(t * 77) * tremble), 2 + 1.1 * Math.exp(-ub * 26) * Math.cos(ub * 38), ub < 0.035 ? 1 : ub < 0.07 ? 0.4 : 0)
  }
  /**
   * LE CHOIX D'UN TALENT (Keko, 14/11 : « à chaque fois que la barre est remplie à 100 %, on met le jeu en pause pour
   * tout le monde ; on choisit un talent parmi 3 propositions ; une fois que tout le monde a choisi, la partie reprend.
   * Il y a un compte à rebours de 30 secondes ; si personne n'a choisi au bout de 30 secondes, le choix est mis en
   * réserve pour le joueur qui n'a pas choisi, et il aura 2 choix la prochaine fois ») : un voile, le niveau, le temps
   * qui reste, et trois cartes — une tape en prend une.
   */
  function dessinerLeChoixDeTalent(p: Peintre): void {
    const ch = choixDeTalent
    if (ch === null) return
    const u0 = sortie((t - talentA) / 0.2)
    p.rect(0, 0, W, H, NUIT, 0.72 * u0)
    zones = []
    const cartes = proposer(graineDuVol, m.invasion.niveau, ch.rang, talentsHorsDeLaRace(modeleDeVaisseau(flotte.actif).race))
    const cote = W >= 300
    const cw = cote ? Math.min(100, Math.floor((W - 16 - 8) / 3)) : W - 24
    const hc = cote ? 78 : 44
    const hautTotal = 40 + (cote ? hc : cartes.length * (hc + 4))
    const y0 = Math.max(4, Math.round((H - hautTotal) / 2)) + Math.round((1 - u0) * 8)
    motEnRelief(p, `Niveau ${m.invasion.niveau}`, W / 2, y0, true, TITRE)
    const reste = Math.max(0, talentFinA - t)
    const consigne = ch.aFaire > 1 ? `Choisissez un talent (${ch.aFaire} à choisir)` : 'Choisissez un talent'
    ecrire(p, consigne, W / 2, y0 + 16, COQUE[5], { align: 'center' })
    // le temps qui reste : une barre qui se vide, et les secondes
    const lb = Math.min(140, W - 60)
    const xb = Math.round(W / 2 - lb / 2)
    p.rect(xb - 1, y0 + 30, lb + 2, 4, MATIERES.encre.contour)
    p.rect(xb, y0 + 31, Math.round(lb * (reste / DUREE_DU_CHOIX)), 2, reste < 5 ? ROUGE[4] : PEPITE[2])
    ecrire(p, String(Math.ceil(reste)), xb + lb + 4, y0 + 28, reste < 5 ? ROUGE[5] : COQUE[5], { police: GRAS })
    const prendre = (ta: Talent) => (): void => {
      CONF = ta.appliquer(CONF)
      // (un point de blindage ou de bouclier gagné est donné tout de suite)
      if (ta.id === 'blindage') m.coque = Math.min(CONF.coque, m.coque + 1)
      if (ta.id === 'bouclier') m.bouclier = Math.min(CONF.bouclier.points, m.bouclier + 1)
      jouer('equipe')
      secouer(1)
      choixDeTalent = apresUnChoix(ch)
      talentFinA = t + DUREE_DU_CHOIX
      talentA = t
    }
    cartes.forEach((ta, i) => {
      const age = t - talentA - 0.06 * i
      if (age < 0) return
      const x = cote ? Math.round(W / 2 - (3 * cw + 8) / 2) + i * (cw + 4) : 12
      const y = y0 + 40 + (cote ? 0 : i * (hc + 4)) + Math.round((1 - sortie(age / 0.2)) * 6)
      const e = etatDuBouton(x, y, cw, hc)
      if (!e.enfonce) ombrePortee(p, x, y, cw, hc)
      plaque(p, x, y + e.dy, cw, hc, 'encre', { bord: e.survole ? PEPITE[2] : PEPITE[1], enfonce: e.enfonce, flash: e.flash || age < 0.07 })
      const T: [number, number, number] = [N.hex('#a8650f'), PEPITE[2], N.hex('#fff2a8')]
      if (cote) {
        plaque(p, x + cw / 2 - 11, y + 5 + e.dy, 22, 20, 'creux')
        dessinerLeGlyphe(p, ta.icone, Math.round(x + cw / 2), y + 15 + e.dy, T)
        replier(ta.nom, cw - 8, GRAS).slice(0, 2).forEach((li, k) => ecrire(p, li, x + cw / 2, y + 28 + k * 9 + e.dy, PEPITE[3], { align: 'center', police: GRAS }))
        replier(ta.dit, cw - 8).slice(0, 4).forEach((li, k) => ecrire(p, li, x + cw / 2, y + 48 + k * 8 + e.dy, COQUE[5], { align: 'center' }))
      } else {
        plaque(p, x + 4, y + 4 + e.dy, 22, hc - 8, 'creux')
        dessinerLeGlyphe(p, ta.icone, x + 15, y + Math.round(hc / 2) + e.dy, T)
        ecrire(p, ta.nom, x + 31, y + 5 + e.dy, PEPITE[3], { police: GRAS })
        replier(ta.dit, cw - 36).slice(0, 3).forEach((li, k) => ecrire(p, li, x + 31, y + 16 + k * 9 + e.dy, COQUE[5]))
      }
      zone(x, y, cw, hc, prendre(ta), 'achat')
    })
    // (rien d'autre ne répond pendant le choix)
    zone(0, 0, W, H, () => {}, null)
  }
  /**
   * L'INTERFACE DE L'INVASION : UNE RANGÉE EN HAUT DE L'ÉCRAN, de gauche à droite (Keko, 14/11 : « commence par une
   * petite icône de portail plutôt que le nom portail ; à droite de cette icône, le pourcentage — la même police et la
   * même texture que la vague, mais en violet ; n'affiche plus du tout les vagues ; ensuite, dans toute la longueur de
   * l'écran jusqu'à la droite, la barre d'expérience ») : le portail en petit, sa vie en pour cent, puis l'expérience.
   */
  function dessinerLInvasion(p: Peintre): void {
    const inv = m.invasion
    dessinerLeVerrou(p)
    // (À NEUF PIXELS DES BORDS, les deux blocs rapprochés l'un de l'autre — Keko, 14/11 : « qu'ils s'éloignent des bords »)
    const MARGE = 9
    const x0 = paysage ? Math.max(MARGE, largeurDeBande() + MARGE) : MARGE
    const droite = paysage ? W - Math.max(MARGE, largeurDeBande() + MARGE) : W - MARGE
    const y = paysage ? 4 : hautDuHud() - RANG_DE_L_EXPERIENCE + 1
    // DANS LE BANDEAU NOIR DE GAUCHE, quand il y en a un (Keko, 14/11 : « tout bien réfléchi, le portail avec son
    // pourcentage tout en haut à gauche de l'écran, si possible dans la bande noire comme la vie ; et en dessous,
    // verticalement, la barre d'expérience avec le niveau en haut et la barre qui descend ») : le miroir du blindage
    // d'en face — l'icône, son pour cent dessous, le niveau, puis la barre debout, qui se remplit par le bas.
    const enBande = interfaceEnBande()
    // l'icône : un petit vortex — un anneau violet, son puits sombre, deux bras clairs qui tournent
    const axe = Math.round(largeurDeBande() / 2)
    // (EN DOUBLE SUR PC, l'icône, le pour cent et le niveau — Keko, 15/11 : « un peu trop petits » ; le double, pas une
    // taille entre deux, pour que tous les pixels restent de la même taille)
    const G = enBande && couvreApplique ? 2 : 1
    // (ET SUR PC, L'ICÔNE À GAUCHE DU POUR CENT, TOUT EN HAUT À GAUCHE — Keko, 15/11 —, le niveau et sa barre dessous, sous l'icône)
    const enLigne = G > 1
    const cx = enLigne ? 8 + 12 : enBande ? axe : x0 + 5
    const cy = enLigne ? 8 + 9 : enBande ? 10 * G : y + 4 // (sur PC, trois plus haut : MESURÉ, son centre était sous celui du pour cent — Keko, 15/11) // (un pixel plus bas : dans l'axe du pourcentage — Keko, 14/11)
    const touche = t - passeA < 0.5
    p.circle(cx, cy, 5.6 * G, N.hex('#12081f'))
    p.circle(cx, cy, 4.6 * G, touche ? N.WHITE : N.hex('#a35cff'))
    p.circle(cx, cy, 3 * G, N.hex('#2a0f4d'))
    for (const k of [0, 1]) {
      const a = t * 3 + k * Math.PI
      p.rect(Math.round(cx + Math.cos(a) * 2 * G), Math.round(cy + Math.sin(a) * 2 * G), G, G, N.hex('#f1dcff'))
      p.rect(Math.round(cx + Math.cos(a + 0.7) * G), Math.round(cy + Math.sin(a + 0.7) * G), G, G, N.hex('#cf9bff'))
    }
    p.glow(cx, cy, 8 * G, N.hex('#a35cff'), touche ? 0.8 : 0.3)
    // sa vie : dans la place de « 100 % », pour que la barre d'expérience ne bouge pas
    if (enBande) {
      const dit = `${Math.max(0, Math.ceil(inv.vie))}%` // (sans espace : le bandeau est étroit)
      const secoue = touche ? Math.round(Math.sin((t - passeA) * 60) * 2 * G * (1 - (t - passeA) / 0.5)) : 0
      if (enLigne) {
        motEnRelief(p, dit, cx + 16 + (largeurDe(dit, GRAS) * G) / 2 + secoue, cy - 8, 'violet', GRAS, null, G)
        dessinerLExperienceDebout(p, cx, cy + 22, G)
      } else {
        motEnRelief(p, dit, axe + secoue, 19, 'violet')
        dessinerLExperienceDebout(p, axe, 32)
      }
      dessinerLeRetour(p)
      return
    }
    const vie = `${Math.max(0, Math.ceil(inv.vie))} %`
    const wv = largeurDe('100 %', GRAS)
    const xv = x0 + 13
    motEnRelief(p, vie, xv + largeurDe(vie, GRAS) / 2 + (touche ? Math.round(Math.sin((t - passeA) * 60) * 2 * (1 - (t - passeA) / 0.5)) : 0), y, 'violet')
    const xe = xv + wv + 2
    dessinerLExperience(p, xe, y, droite - xe)
    dessinerLeRetour(p)
  }
  /**
   * LA PAUSE (Keko, 17/11 : « un petit bouton menu qui permet de mettre le jeu en pause et de retourner à la base pour
   * finir la partie prématurément ») : le bouton, une plaque d'acier clair aux trois traits, tout en bas à droite (sous la
   * réglette du zoom couché, à sa droite debout) ; ouverte, LE MONDE EST EN PAUSE (comme la soute) sous un voile, et deux
   * boutons — « Reprendre », « Retour à la base » (comme « Hangar » à la fin d'une partie).
   */
  let pauseOuverte = false
  let pauseA = -10
  function dessinerLeBoutonMenu(p: Peintre, x: number, y: number): void {
    if (m.invasion.finie || choixDeTalent !== null) return
    const B = PLAQUE_DE_REGLETTE
    boutonBase(p, x, y, B, B, true, () => {
      pauseOuverte = true
      pauseA = t
      manche = null
      touches.clear()
    }, (dx, dy) => {
      for (const k of [0, 1, 2]) {
        p.rect(x + 4 + dx, y + 5 + k * 3 + dy, 7, 1, MATIERES.clair.lumiere2)
        p.rect(x + 3 + dx, y + 3 + k * 3 + dy, 8, 2, N.hex('#10182a'))
      }
    }, 'ouvre', { matiere: 'clair' })
  }
  function dessinerLaPause(p: Peintre): void {
    if (pauseOuverte && (!enJeu || m.invasion.finie)) pauseOuverte = false
    if (!pauseOuverte) return
    const u0 = sortie((t - pauseA) / 0.25)
    p.rect(0, 0, W, H, NUIT, 0.75 * u0)
    zones = []
    const cy = Math.round(H / 2)
    motEnRelief(p, 'Pause', W / 2, cy - 34 + Math.round((1 - u0) * 8), true, TITRE)
    const bw = largeurDe('Retour à la base', GRAS) + 30
    const bx = Math.round(W / 2 - bw / 2)
    bouton(p, bx, cy - 8, bw, 17, 'Reprendre', true, () => (pauseOuverte = false), 'retour')
    bouton(p, bx, cy + 14, bw, 17, 'Retour à la base', true, () => {
      pauseOuverte = false
      choixDeTalent = null
      reserveDeTalents = 0
      taches = []
      enJeu = false
    }, 'retour', 'acier')
    zone(0, 0, W, H, () => {}, null)
  }
  /**
   * LES PLAQUES DE BLINDAGE DES HUMAINS (Keko, 17/11 : « à la place du bouclier bleu, des plaques de blindage représentées
   * en gris, comme le bouclier, mais divisées par segments séparés, à côté de la barre de blindage ») : à la place de la
   * barre fine du bouclier, une plaque d'acier par portion de la barre, À CÔTÉ DE LA PORTION QU'ELLE PROTÈGE — la première
   * contre le haut de la barre (le plein) ; un trait d'encre entre deux ; cassée, un creux ; à l'instant où elle casse,
   * elle blanchit et tremble. `debout` : le long d'une barre debout ; (x, y) le coin de la bande, `L` sa longueur.
   */
  /**
   * LA CORRUPTION SUR LA BARRE (les Innommés, Keko, 17/11 : « quelque chose qui visuellement se voit sur la barre de vie
   * pour comprendre rapidement son fonctionnement ») : la part corrompue de la coque, entre l'or sain et le vide, en
   * VIOLET QUI ONDULE (des bandes claires qui descendent vers le vide) ; à une purge, elle s'éclaire. `pos` : le pixel le
   * long de la barre ; `bord` : 0 le liseré clair, 1 le corps, 2 l'ombre.
   */
  const CORRUPTION = [N.hex('#f0c8ff'), N.hex('#b05ef0'), N.hex('#7a2cc8'), N.hex('#4a1488')]
  let purgeA = -10
  const tonDeLaCorruption = (pos: number, bord: number): number => {
    if (t - purgeA < 0.12) return CORRUPTION[0]
    const onde = ((pos + Math.floor(t * 9)) % 5 + 5) % 5 === 0
    return bord === 0 ? CORRUPTION[0] : onde ? CORRUPTION[1] : bord === 1 ? CORRUPTION[2] : CORRUPTION[3]
  }
  /** LA VIE DE L'ESSAIM, EN VERT (Keko, 17/11) : sa barre n'est pas du blindage, c'est de la chair qui se régénère. */
  const VERT_DE_LA_VIE = [N.hex('#b4f57a'), N.hex('#5ccf3c'), N.hex('#2e8a24')]
  const vieVerte = (): boolean => VORTEX && modeleDeVaisseau(flotte.actif).race === 'essaim'
  const ACIER_DES_PLAQUES = [N.hex('#d4dce8'), N.hex('#8e99ac'), N.hex('#56607a')]
  const plaquesCasseesA: number[] = []
  function dessinerLesPlaques(p: Peintre, debout: boolean, x: number, y: number, L: number): void {
    const n = m.plaques.length
    const fin = 3
    const encre = MATIERES.encre.contour
    if (debout) p.rect(x - 1, y - 1, fin + 2, L + 2, encre)
    else p.rect(x - 1, y - 1, L + 2, fin + 2, encre)
    for (let k = 0; k < n; k++) {
      const a0 = Math.round((k * L) / n)
      const a1 = Math.round(((k + 1) * L) / n) - (k < n - 1 ? 1 : 0)
      const long = a1 - a0
      if (long <= 0) continue
      const age = t - (plaquesCasseesA[k] ?? -10)
      const tremble = age < 0.25 ? Math.round(Math.sin(age * 80) * 1.5 * (1 - age / 0.25)) : 0
      // (debout, la plaque du haut est en haut ; couchée, le plein est à droite)
      const px = debout ? x + tremble : x + L - a1
      const py = debout ? y + a0 : y + tremble
      const w = debout ? fin : long
      const h = debout ? long : fin
      if (age < 0.1) {
        p.rect(px, py, w, h, N.WHITE)
        continue
      }
      if (!m.plaques[k]) {
        p.rect(px, py, w, h, N.hex('#2f3b58')) // (le creux des barres)
        continue
      }
      p.rect(px, py, w, h, ACIER_DES_PLAQUES[1])
      // (le biseau : clair en haut et à gauche, sombre en bas et à droite)
      p.rect(px, py, w, 1, ACIER_DES_PLAQUES[0])
      p.rect(px, py, 1, h, ACIER_DES_PLAQUES[0])
      p.rect(px, py + h - 1, w, 1, ACIER_DES_PLAQUES[2])
      p.rect(px + w - 1, py, 1, h, ACIER_DES_PLAQUES[2])
    }
  }
  /** LA FIN DE LA PARTIE : le portail est tombé — un voile, la vague atteinte, « Rejouer ». */
  let finA = -10
  function dessinerLaFin(p: Peintre): void {
    if (!m.invasion.finie) return
    const u0 = sortie((t - finA) / 0.4)
    p.rect(0, 0, W, H, NUIT, 0.78 * u0)
    zones = []
    const cy = Math.round(H / 2)
    motEnRelief(p, 'Portail perdu', W / 2, cy - 30 + Math.round((1 - u0) * 8), true, TITRE)
    ecrire(p, `Vague ${Math.max(1, m.invasion.vague)} / Niveau ${m.invasion.niveau}`, W / 2, cy - 8, COQUE[6], { align: 'center', police: GRAS })
    if (t - finA > 0.8) {
      const bw = largeurDe('Rejouer', GRAS) + 30
      bouton(p, Math.round(W / 2 - bw / 2), cy + 10, bw, 17, 'Rejouer', true, () => {
        choixDeTalent = null
        reserveDeTalents = 0
        taches = []
        enJeu = false
        demarrer()
      }, 'achat')
      // (… ou retour au hangar)
      const bh = largeurDe('Hangar', GRAS) + 30
      bouton(p, Math.round(W / 2 - bh / 2), cy + 32, bh, 17, 'Hangar', true, () => {
        choixDeTalent = null
        reserveDeTalents = 0
        taches = []
        enJeu = false
      }, 'retour', 'acier')
    }
    zone(0, 0, W, H, () => {}, null)
  }
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
  // (dans le jeu du vortex, la mort n'est pas la fin : on reste en vol, le temps de revenir au portail)
  const ecranVisible = (): boolean => !enJeu || (!VORTEX && m.phase !== 'vol' && t - perduA > (m.phase === 'extrait' ? 1.7 : 1))
  let ecranEtait = false
  /** L'onglet ouvert, et la pièce choisie dans chacun (le hangar s'ouvre sur les pièces montées). */
  const ONGLETS: Sorte[] = ['coque', 'propulseur', 'arme', 'outil'] // (le châssis d'abord — Keko ; puis propulsion, armement, outils — 14/11)
  /** Le nom d'un onglet ; les listes disent LEURS PLACES, occupées / portées par la coque (Keko : « ce n'est pas lisible »). */
  const NOMS_ONGLET: Record<Sorte, string> = { propulseur: 'Propulsion', coque: 'Châssis', outil: 'Outils', arme: 'Armement' }
  /** Les sous-catégories d'une catégorie : les familles de ses pièces (outils : foreuses, radars) ; `null` = toutes. */
  /** LES SOUS-CATÉGORIES, PAR ACTIVITÉ (Keko : « classer les outils par activité, minage / combat ») : la famille d'une pièce dit son activité. */
  const ACTIVITE: Record<string, string> = { foreuse: 'minage', aimant: 'minage', radar: 'combat' }
  const NOMS_FAMILLE: Record<string, string> = { minage: 'Minage', combat: 'Combat' }
  const sousDe = (pc: Piece): string | undefined => (pc.famille === undefined ? undefined : (ACTIVITE[pc.famille] ?? pc.famille))
  const famillesDe = (o: Sorte): string[] => [...new Set(piecesIci(o).map(sousDe).filter((f): f is string => f !== undefined))]
  const sousCategorie: Record<Sorte, string | null> = { propulseur: null, coque: null, outil: null, arme: null }
  /** La liste visible d'une catégorie : ses pièces, ou celles de la sous-catégorie choisie. */
  const listeVisible = (o: Sorte): Piece[] => piecesIci(o).filter((pc) => (sousCategorie[o] === null || sousDe(pc) === sousCategorie[o]) && (o !== 'arme' || placeOuverte() < 0 || (pc.lourde ?? false) === placeLourde(hangar, placeOuverte())))
  /** LE DÉFILEMENT de la liste (Keko : « énormément de pièces, un moyen de se déplacer dans une longue liste ») : en rangées, par catégorie ; on la fait glisser au doigt, quatre rangées visibles. */
  const defil: Record<Sorte, number> = { propulseur: 0, coque: 0, outil: 0, arme: 0 }
  /** Un glisser en cours sur la liste : d'où il part, le défilement d'alors, s'il a bougé (sinon c'est une tape). */
  let glisse: { x: number; y: number; defil0: number; bouge: boolean; sorte: 'liste' | 'vaisseaux' | 'onglets' | 'arbre' | 'curseur' | 'ordres' | 'inventaire' | 'cases' | 'missions' | 'soute'; curseur?: Curseur } | null = null
  /** UN CURSEUR qu'on fait glisser de côté (le panneau de vente) : sa zone, et ce qu'il règle, de 0 à 1 ; refaits à chaque image comme les zones. */
  type Curseur = { x: number; y: number; w: number; h: number; regler: (u: number) => void }
  let curseurs: Curseur[] = []
  /** LE DÉFILEMENT DE LA GRILLE D'ONGLETS, en pixels (Keko : « les deux du bas tombent sous la zone, ajoute un défilement »), et sa zone, refaite à chaque image (null : tout tient). */
  let defilOnglets = 0
  let zoneDesOnglets: { x: number; y: number; w: number; h: number } | null = null
  /** La zone qui se fait glisser, refaite à chaque image comme les autres ; `defil` : ce qu'elle fait défiler, si ce n'est pas la liste des pièces. */
  let zoneGlissante: { x: number; y: number; w: number; h: number; defil?: 'vaisseaux' } | null = null
  /** LE DÉFILEMENT DE LA LISTE DES VAISSEAUX, en rangées (Keko, 16/11 : en paysage, avec dix vaisseaux, elle ne tenait plus). */
  let defilVaisseaux = 0
  let onglet: Sorte = 'propulseur'
  /**
   * LA PLACE OUVERTE, pour les outils et les armes au hangar (Keko : « deux slots, arme 1 et arme 2, outil 1 et
   * outil 2 ») : une case par place portée par le châssis dans la vue d'ensemble ; −1 pour une catégorie entière
   * (le châssis, les propulseurs, et tout au labo).
   */
  let place = -1
  /** Au hangar, sous « Équipement » : la liste de places ouverte (l'armement ou les outils), ou null : les quatre catégories. */
  /**
   * (PAR CALIBRE — Keko, 14/11 : « plutôt que plusieurs slots légers ou lourds, une catégorie armes légères avec ses
   * slots, une catégorie armes moyennes, armes lourdes, etc. ; pour les outils c'est pareil : outils légers, outils
   * lourds » : une catégorie par sorte ET par calibre que le châssis porte. Aujourd'hui : armes légères, armes lourdes,
   * outils légers — le calibre moyen et les outils lourds n'existent pas encore.)
   */
  let categorieOuverte: { o: 'arme' | 'outil'; lourde: boolean } | null = null
  /** Les places d'une sorte et d'un calibre, dans l'ordre (les outils sont tous légers). */
  const placesDuCalibre = (o: 'arme' | 'outil', lourde: boolean): number[] => Array.from({ length: capacite(hangar, o) }, (_, k) => k).filter((k) => (o === 'arme' ? placeLourde(hangar, k) : false) === lourde)
  const nomDuCalibre = (o: 'arme' | 'outil', lourde: boolean): string => (o === 'arme' ? (lourde ? 'Armes lourdes' : 'Armes légères') : 'Outils') // (LES OUTILS N'ONT PAS DE CLASSES — Keko, 14/11 : « on va pas commencer à faire des classes différentes d'outils »)
  type Case = { o: Sorte; k: number; /** Une catégorie de places : son calibre. */ lourde?: boolean }
  const listeMontee = (o: Sorte): string[] => (o === 'arme' ? hangar.armes : o === 'outil' ? hangar.outils : [])
  /** Les cases de la vue d'ensemble, dans l'ordre : au hangar une par place (un nouveau châssis en ajoute), au labo une par catégorie. */
  /** Une catégorie A DE QUOI MONTRER : une pièce possédée, ou débloquée au labo (Keko, 11/11 : « masquer le bouton arme ou outil dans le hangar si aucune pièce n'est dispo ») — sinon sa case et sa cible sur le vaisseau ne paraissent pas. */
  const aDesPieces = (o: Sorte): boolean => piecesIci(o).some((pc) => possede(hangar, pc.id) || pieceOuverteIci(pc.id))
  const casesDuVaisseau = (): Case[] =>
    // (AU HANGAR, QUATRE CATÉGORIES — Keko, 14/11 : « plutôt que d'afficher toutes les pièces une par une, afficher
    // châssis, propulsion, armement, outils ; pour l'armement et les outils, qui sont en plusieurs exemplaires, on ouvre
    // leur liste à ce moment-là » : `categorieOuverte` dit laquelle des deux listes de places est à l'écran)
    vue === 'hangar' ? (categorieOuverte !== null ? placesDuCalibre(categorieOuverte.o, categorieOuverte.lourde).map((k): Case => ({ o: categorieOuverte!.o, k })) : ONGLETS.filter(aDesPieces).flatMap((o): Case[] => (o === 'arme' || o === 'outil' ? [false, true].filter((lourde) => placesDuCalibre(o, lourde).length > 0).map((lourde) => ({ o, k: -1, lourde })) : [{ o, k: -1 }]))) : ONGLETS.map((o) => ({ o, k: -1 }))
  /** La place ouverte, bornée à ce que porte le châssis monté (−1 hors des outils et des armes du hangar). */
  const placeOuverte = (): number => (vue === 'hangar' && (onglet === 'outil' || onglet === 'arme') ? Math.max(0, Math.min(place, capacite(hangar, onglet) - 1)) : -1)
  /** (les places LOURDES d'un châssis sont ses dernières places d'arme : « Lourde 1 », « Lourde 2 ») */
  const titreDe = (c: Case): string => {
    if (c.o !== 'arme' && c.o !== 'outil') return NOMS_ONGLET[c.o]
    // (une catégorie : « Armes légères » ; une place : son numéro DANS sa catégorie, « Arme 2 »)
    if (c.k < 0) return nomDuCalibre(c.o, c.lourde ?? false)
    const lourde = c.o === 'arme' && placeLourde(hangar, c.k)
    return `${c.o === 'arme' ? 'Arme' : 'Outil'} ${placesDuCalibre(c.o, lourde).indexOf(c.k) + 1}`
  }
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
  /**
   * LA BASE DU JEU DU VORTEX (Keko, 15/11 : « un clone du hangar qu'on avait déjà, mais un peu différent : toujours
   * hangar, recherche et les quêtes ; pour l'instant on ne met pas l'onglet commerce ; et le bouton paramètres, on
   * peut l'enlever carrément, il n'y a plus rien dedans ») : trois onglets, pas de commerce, pas de paramètres.
   */
  const VUES: string[] = parametres.has('vortex') ? ['hangar', 'labo', 'quetes'] : ['hangar', 'labo', 'entrepot', 'quetes', 'reglages', ...ESSAIS.slice(0, Math.max(0, Math.min(ESSAIS.length, Number(parametres.get('onglets') ?? 0) - 4)))]
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
      // (les balises : leur heure est celle de la pose, pas d'un tir — rien à annoncer)
      if (arme.balise !== undefined) return
      if (reste <= 0 || reste > avance || t - (armeAnnonceeA.get(arme.id) ?? -10) < 0.4) return
      if (!m.ennemis.some((e) => Math.hypot(e.corps.x - v.x, e.corps.y - v.y) <= arme.portee)) return
      armeAnnonceeA.set(arme.id, t)
      jouer(arme.id as Son)
    })
    // LES MÉTÉORES : leur impact est écrit dès leur départ (voir Arme.meteore)
    for (const mt of m.meteores) {
      if (meteoresAnnoncees.has(mt.id) || mt.tombe - m.t > avance) continue
      meteoresAnnoncees.add(mt.id)
      jouer('impactMeteore', { dx: mt.x - v.x, dy: mt.y - v.y })
    }
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
  type Matiere = 'encre' | 'or' | 'creux' | 'eteint' | 'acier' | 'vert' | 'rouge' | 'clair' | 'metal'
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
    // (LE MÉTAL CLAIR de « Construire » — Keko, 14/11 : « plutôt qu'en jaune comme Équiper, une couleur métal clair, un
    // genre de gris clair, avec des reflets, pour bien le distinguer » : un gris neutre, sans le bleu de l'acier clair)
    metal: { contour: N.hex('#08080c'), ombre: N.hex('#4c505c'), corps: N.hex('#9ba1ad'), haut: N.hex('#b8bdc8'), lumiere: N.hex('#ffffff'), lumiere2: N.hex('#e4e7ee'), grain: N.hex('#a7adb8'), spec: N.hex('#ffffff') },
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
  function motEnRelief(p: Peintre, s: string, x: number, y: number, or: boolean | 'ivoire' | 'violet' | 'cristal', f: Police = GRAS, reflet: number | null = null, echelle = 1): void {
    const mot = spell(s, f) as { letters: { g: unknown; x: number }[]; w: number }
    const e = echelle
    const items = mot.letters.filter((L) => L.g).map((L) => ({ g: L.g, x: Math.round(x - (mot.w * e) / 2) + L.x * e, y: Math.round(y) - decalage(f) * e, sx: e, sy: e }))
    // (« ivoire » : la lettre des plaques d'en-tête — un ivoire éclairé d'en haut, ombré de bronze dessous)
    // (« violet » : la vie du portail, dans la lettre et le relief des titres d'or, aux teintes du vortex)
    // (« cristal » : le niveau, aux teintes de la barre d'expérience)
    // (LE BAS DES CHIFFRES N'EST PLUS SOMBRE — Keko, 17/11 : « des pixels très sombres en bas des chiffres donnent
    // l'impression qu'ils sont coupés » : MESURÉ, le dégradé passe sur toute la boîte de la lettre, ses deux dernières
    // rangées prenaient le ton le plus sombre et la rangée du dessous un ton plus sombre encore — sur le « 1 » du niveau, un
    // vert presque noir contre le cerne. Le ton du bas et le dessous sont maintenant à peine plus sombres que le milieu.)
    const st = or === 'cristal'
      ? { fill: [N.hex('#22c8a0'), TEINTES_MINERAI.cristal[2], TEINTES_MINERAI.cristal[3]], edge: TEINTES_MINERAI.cristal[3], under: N.hex('#14a884'), outline: N.hex('#04120e'), shadow: 0 }
      : or === 'violet'
      ? { fill: [N.hex('#8c4cf0'), N.hex('#a35cff'), N.hex('#cf9bff')], edge: N.hex('#f1dcff'), under: N.hex('#7438d8'), outline: N.hex('#12081f'), shadow: 0 }
      : or === 'ivoire'
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
  /**
   * (`manque` : CE QUI MANQUE pour que le bouton réponde — 'credits', un minerai… Keko, 14/11 : « il me manque des
   * minerais alors que j'ai l'argent, et l'animation d'erreur fait trembler les crédits : il faudrait faire trembler
   * les minerais manquants ». Absent : un refus d'avant, qui secoue le compteur de crédits comme toujours.)
   */
  let refus: { x: number; y: number; t0: number; manque?: string[] } | null = null
  /** Le tremblement d'une chose qui manque, pendant un refus qui la nomme. */
  const trembleDe = (quoi: string): number => {
    const r = refus
    return r !== null && t - r.t0 < 0.3 && r.manque !== undefined && r.manque.includes(quoi) ? Math.round(Math.sin((t - r.t0) * 70) * 2 * (1 - (t - r.t0) / 0.3)) : 0
  }
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
  function zoneDeRefus(x: number, y: number, w: number, h: number, manque?: string[]): void {
    zones.push({ x: x + ORIGINE.x, y: y + ORIGINE.y, w, h, action: () => (refus = { x, y, t0: t, manque }), son: 'refus' })
  }
  /** Le reflet d'une plaque survolée : il la traverse en boucle, vite. */
  const refletDeSurvol = (x: number, w: number, survole: boolean): number | null => (survole ? x - 10 + ((t * 1.6) % 1.2) * (w + 30) : null)
  /**
   * UN BOUTON DE LA BASE, le même partout : sa plaque (l'or s'il est vif, éteinte sinon — ou une autre matière), son
   * ombre portée, son état ; `dessin` peint son contenu au décalage donné.
   */
  function boutonBase(p: Peintre, x: number, y: number, w: number, h: number, vif: boolean, action: () => void, dessin: (dx: number, dy: number) => void, son: Son | null = 'clic', o: { matiere?: Matiere; reflet?: number | null; /** Ce qui manque, s'il est éteint (voir `refus`). */ manque?: string[]; /** Refusé, le bouton ne tremble pas lui-même : c'est ce qui manque, dedans, qui tremble. */ fixe?: boolean } = {}): void {
    const e0 = etatDuBouton(x, y, w, h)
    const e = o.fixe ? { ...e0, dx: 0 } : e0
    const m: Matiere = vif ? (o.matiere ?? 'or') : 'eteint'
    if (!e.enfonce) ombrePortee(p, x + e.dx, y, w, h)
    plaque(p, x + e.dx, y + e.dy, w, h, m, { enfonce: e.enfonce, survole: e.survole && vif, flash: e.flash, reflet: o.reflet ?? (vif ? refletDeSurvol(x, w, e.survole) : null) })
    dessin(e.dx, e.dy)
    if (vif) zone(x, y, w, h + 1, action, son)
    else zoneDeRefus(x, y, w, h, o.manque)
  }
  /** Un bouton à un mot, en relief. */
  function bouton(p: Peintre, x: number, y: number, w: number, h: number, mot: string, vif: boolean, action: () => void, son: Son | null = 'clic', matiere: Matiere = 'or', manque?: string[]): void {
    boutonBase(p, x, y, w, h, vif, action, (dx, dy) => {
      if (vif && matiere === 'or') motEnRelief(p, mot, x + w / 2 + dx, y + dy + Math.floor((h - 7) / 2), true)
      else ecrire(p, mot, x + w / 2 + dx, y + dy + Math.floor((h - 7) / 2), vif ? COQUE[6] : COQUE[3], { align: 'center', police: GRAS })
    }, son, { matiere, manque })
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
    // (LE HANGAR SE ROUVRE SUR SA VUE D'ENSEMBLE — Keko, 14/11 : pas sur l'équipement où on l'avait laissé)
    equipementOuvert = false
    categorieOuverte = null
    changement = false
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
    dessinerLesVaisseaux(p)
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
    // (couché, le voile couvre TOUT l'écran, pas la seule colonne où le panneau est dessiné)
    if ((vaisseauxOuverts || armesOuvertes) && vue === 'hangar' && etape === 'vaisseau') p.rect(0, 0, W, H, NUIT, 0.72 * sortie((t - vaisseauxA) / 0.18))
    if (VORTEX) {
      // (COUCHÉ, LE PANNEAU DES VAISSEAUX EST EN DEUX, comme celui des pièces : la liste à gauche, par-dessus la scène, la fiche dans la colonne)
      fenetre(p, RAIL, xc - RAIL, () => dessinerLesVaisseaux(p, false, 'liste'))
      fenetre(p, xc, COLONNE, () => dessinerLesVaisseaux(p, false, 'fiche'))
    } else fenetre(p, xc, COLONNE, () => dessinerLesVaisseaux(p, false))
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
    const tremble = r !== null && t - r.t0 < 0.3 && (r.manque === undefined || r.manque.includes('credits')) ? Math.round(Math.sin((t - r.t0) * 70) * 2 * (1 - (t - r.t0) / 0.3)) : 0
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
      if (nouveautes.has(vv) || (vv === 'quetes' && (quetes.actives.some(estTerminee) || (tutorielFini(quetes) && vaisseauxDe(flotte).some((nav) => missionDe(flotte, nav.id)?.finie === true))))) {
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
        // DEUX ONGLETS (Keko, 14/11 : « un onglet de mission en plus de contrats, on pourrait l'appeler "vaisseaux" ») :
        // les contrats, et la mission en cours de chaque vaisseau — une pastille d'or quand l'une d'elles se réclame
        const noms = ['Contrats', 'Vaisseaux']
        const ls = noms.map((nm) => largeurDe(nm, GRAS) + 20)
        let xb = Math.round(cx - (ls[0] + ls[1] + 4) / 2)
        noms.forEach((nm, i) => {
          const actif = (i === 1) === missionsDeVaisseau
          const xi = xb
          const e = etatDuBouton(xi, yt - 26, ls[i], 17)
          if (!e.enfonce) ombrePortee(p, xi, yt - 26, ls[i], 17)
          plaque(p, xi, yt - 26 + e.dy, ls[i], 17, actif ? 'or' : 'encre', { enfonce: e.enfonce, survole: e.survole, flash: e.flash })
          ecrire(p, nm, xi + ls[i] / 2, yt - 21 + e.dy, actif ? N.WHITE : COQUE[5], { align: 'center', police: GRAS })
          // (sur LES DEUX onglets — Keko, 14/11 : « je ne la vois pas dans les contrats »)
          // (… ET SUR L'ONGLET OUVERT AUSSI — Keko, 14/11)
          if ((i === 1 ? vaisseauxDe(flotte).some((nav) => missionDe(flotte, nav.id)?.finie === true) : quetes.actives.some(estTerminee))) {
            p.rect(xi + ls[i] - 5, yt - 28, 5, 5, MATIERES.encre.contour)
            p.rect(xi + ls[i] - 4, yt - 27, 3, 3, Math.sin(t * 5) > 0 ? N.hex('#fff2a8') : PEPITE[2])
          }
          if (!actif) zone(xi, yt - 26, ls[i], 17, () => ((missionsDeVaisseau = i === 1), (defilMissions = 0), (vueA = t)), 'onglet')
          xb += ls[i] + 4
        })
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
      // (un vaisseau sans tuyère n'en a pas : sa poussée est celle de l'accueil et du vol — voir plus bas)
      if (g.omni === undefined && !organique(coqueMontee) && R.next() < 0.85) eclats.push({ x: cx + (R.next() - 0.5) * 5, y: sy + bout, vx: (R.next() - 0.5) * 30, vy: 40 + R.next() * 50, t0: t, vie: 0.3 + 0.3 * R.next(), c: (cranP >= 3 ? ION : FEU)[3 + Math.floor(R.next() * 4)] })
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
    // (UN VAISSEAU SANS TUYÈRE, au décollage : les ondes ou les bulles de l'accueil et du vol, sous lui)
    if (organique(coqueMontee) && decollageA !== null) dessinerLaPousseeSansTuyere(p, coqueMontee, nozzle[0], nozzle[1], ECH, flam)
    if (g.omni === undefined && !organique(coqueMontee)) p.glow(nozzle[0], nozzle[1], 8 + 14 * flam, al.propulseur >= 3 ? ION[4] : FEU[5], 0.35 + 0.5 * flam + 0.08 * Math.sin(t * 9))
    const formes = formesDuVaisseau(al, flam, t)
    peindreFormes(p, formes, cx + jit, sy, ECH, { blanc: t - equipeA < 0.08 ? 1 : 0, rampes: rampesDuJoueur() })
    // (UNE SOUCOUPE : au décollage, celles du dessous soufflent fort — Keko, 15/11 : « au garage, quand le vaisseau décolle,
    // on ne voit pas de propulsion » ; À L'ARRÊT, RIEN — « n'allume pas les propulseurs à l'arrêt dans le hangar »)
    if (g.omni !== undefined && decollageA !== null) dessinerLesJetsOmni(p, coqueMontee, cx + jit, sy, -Math.PI / 2, ECH, flam, 0, 0, ECH * 0.6)
    // la verrière qui luit, les feux de position qui battent
    // (le Néant n'a pas de verrière : sa lueur bleue grisait l'horizon de son trou noir)
    if (!sansVerriere(coqueMontee)) p.glow(cx + jit, sy - g.verriere * ECH, 7, VERRIERE[2], 0.25)
    const bat = Math.floor(t * 1.5) % 2 === 0
    const feux = g.feux
    if (feux !== null) for (const [s, c] of [[-1, couleurDuFeu(-1)], [1, couleurDuFeu(1)]] as const) {
      const fx = Math.round(cx + jit + s * (feux.y + 0.2) * ECH)
      const fy = Math.round(sy + (0.2 - feux.x) * ECH)
      if (bat) {
        p.rect(fx, fy, 1, 1, N.WHITE)
        p.glow(fx, fy, 6, c, 0.7)
      }
    }
    if (al.bouclier > 0) dessinerLeBouclier(p, cx + jit, sy, g.anneau * ECH, t, 1, [])
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
    // (SUR LA VUE D'ENSEMBLE, LE POIDS EST DANS LE RÉSUMÉ, plus dans la scène — Keko, 14/11 ; l'étiquette reste quand on
    // change les pièces, où on le regarde bouger)
    const dansLeResume = etape === 'vaisseau' && !equipementOuvert
    if (!dansLeResume) plaque(p, xp, yp, wm + wv + 15, 15, 'encre')
    if (!dansLeResume) ecrire(p, 'Poids', xp + 5, yp + 4, COQUE[4])
    // (LA MÊME LETTRE QUE LE MOT, la même taille — Keko, 12/11 : des chiffres d'une autre police « dénotent » — mais EN
    // RELIEF : l'ivoire éclairé d'en haut, ombré dessous, cerné ; « juste lui rajouter un style propre, un poil de texture »)
    if (!dansLeResume) motEnRelief(p, poids, xp + 5 + wm + 5 + wv / 2, yp + 4, 'ivoire', TEXTE)
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
    const tremble = r !== null && t - r.t0 < 0.3 && (r.manque === undefined || r.manque.includes('credits')) ? Math.round(Math.sin((t - r.t0) * 70) * 2 * (1 - (t - r.t0) / 0.3)) : 0
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
  const PRINCIPALES = (): string[] => VUES.slice(0, VORTEX ? 3 : 4).filter((vv) => (vv === 'labo' ? ongletOuvert(quetes, 'labo') : vv === 'entrepot' ? ongletOuvert(quetes, 'entrepot') : true))
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
      if (nouveautes.has(vv) || (vv === 'quetes' && (quetes.actives.some(estTerminee) || (tutorielFini(quetes) && vaisseauxDe(flotte).some((nav) => missionDe(flotte, nav.id)?.finie === true))))) {
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
    const autres = VORTEX ? [] : VUES.slice(4)
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
        flotte = flotteNeuve()
        livree = livreeDuVaisseau()
        hangar = hangarActif(flotte)
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
    // (UN PANNEAU OUVERT PAR-DESSUS LE HANGAR — les vaisseaux, les couleurs — cache les étincelles de « Décoller », qui
    // continuaient de jaillir à travers : Keko, 15/11)
    if ((vaisseauxOuverts || armesOuvertes || couleursOuverts()) && vue === 'hangar') {
      eclats.length = 0
      return
    }
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
    // (le cuirassé, cran 4, a son propre dessin ; dans le vortex, une coque porte l'apparence de son modèle)
    if (pc.sorte === 'coque') return VORTEX_ && MODELE_DE_LA_COQUE[pc.cran] !== undefined ? formesDuChassis(pc.cran, peauDuModele(MODELE_DE_LA_COQUE[pc.cran]).habit(pc.cran)) : formesDuChassis(pc.cran)
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
    const modele = VORTEX_ && pc.sorte === 'coque' ? MODELE_DE_LA_COQUE[pc.cran] : undefined
    peindreDansUneCase(p, formesDeLaPiece(pc), x, y, bw, bh, { cadre: cadreDeLaPiece(pc), rampes: modele !== undefined ? rampesDeLaPeau(peauDuModele(modele)) : rampesDuJoueur() })
  }
  /** Ouvre la liste d'un emplacement (depuis le vaisseau ou sa case). */
  function ouvrirLEmplacement(o: Sorte, k = -1): void {
    onglet = o
    place = k
    changerDEtape('liste')
    defil[o] = 0
    const occupant = k >= 0 ? listeMontee(o)[k] : undefined
    if (occupant !== undefined && occupant !== '') choix[o] = occupant
    // (LE PANNEAU DES PIÈCES S'OUVRE DIRECTEMENT — Keko, 14/11 : la page d'avant, la pièce équipée et « Changer », « ne
    // sert à rien, elle est redondante » : la liste et la fiche tout de suite ; en sortir ramène aux cases)
    if (vue === 'hangar') ouvrirLeChangement()
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
  /**
   * LE CHOIX DU VAISSEAU (la flotte, 14/11), au-dessus des cases du hangar dès qu'on en a deux : son nom entre deux
   * flèches ; une tape passe au suivant — le hangar, la scène et les cases sont alors les siens.
   */
  function dessinerLeChoixDuVaisseau(p: Peintre, y: number): number {
    const liste = vaisseauxDe(flotte)
    // (PLUS DE DESSIN : le vaisseau est juste au-dessus, dans la scène — Keko, 14/11 : « juste le nom et un bouton
    // changer » ; le nom est toujours là, le bouton dès qu'on a deux vaisseaux)
    // LE VAISSEAU PILOTÉ, EN TÊTE DU HANGAR, ET UN VRAI BOUTON « CHANGER » (Keko, 14/11 : « pas très mis en avant, et il
    // faudrait autre chose que des flèches pour changer, un vrai bouton » — c'était son nom entre deux flèches) : une
    // plaque à liseré d'or, son châssis dans un puits, son nom en or, sa classe dessous ; le bouton ouvre LE PANNEAU DES
    // VAISSEAUX (`dessinerLesVaisseaux`), où on choisit lequel piloter.
    const mo = modeleDeVaisseau(flotte.actif)
    const h = 20
    plaque(p, 4, y, W - 8, h, 'encre', { bord: PEPITE[1] })
    // (LA COULEUR DU JOUEUR, une pastille À GAUCHE DU NOM, qui ouvre le choix — Keko, 15/11 : « plutôt qu'un bouton
    // couleur, le rectangle à gauche du nom du vaisseau »)
    let xn = 11
    if (VORTEX) {
      const e = etatDuBouton(8, y + 3, 14, 14)
      const [sombre, moyen, clair] = tonsDeLaPeau(peauCourante())
      p.rect(8, y + 3 + e.dy, 14, 14, e.survole ? PEPITE[3] : MATIERES.encre.contour)
      p.rect(9, y + 4 + e.dy, 12, 12, moyen)
      p.rect(9, y + 4 + e.dy, 12, 3, clair)
      p.rect(9, y + 13 + e.dy, 12, 3, sombre)
      xn = 27
      // (LA PASTILLE SEULE, pas le nom — Keko, 15/11)
      zone(6, y + 1, 18, h - 2, () => ((couleursOuvertes = true), (couleursA = t)), 'ouvre')
    }
    motEnRelief(p, mo.nom, xn + largeurDe(mo.nom, GRAS) / 2, y + 6, true)
    if (liste.length > 1 || VORTEX) {
      const bw = largeurDe('Changer', GRAS) + 16
      // (EN ACIER CLAIR, le mot sombre — Keko, 14/11 : jaune, il « renvoie trop au bouton décollage en dessous » ; « un
      // petit peu plus visible que le bouton équipement, mais pas jaune »)
      const bxc = W - 7 - bw
      boutonBase(p, bxc, y + 2, bw, 16, true, () => ((vaisseauxOuverts = true), (vaisseauxA = t), (vaisseauChoisi = flotte.actif), (surligneVaisseau = -1), (defilVaisseaux = Math.max(0, rangeesDesVaisseaux().findIndex((r) => 'mo' in r && r.mo.id === flotte.actif) - 2))), (dx, dy) => ecrire(p, 'Changer', bxc + bw / 2 + dx, y + 2 + dy + 4, N.hex('#10182a'), { align: 'center', police: GRAS }), 'ouvre', { matiere: 'clair' })
    }
    return y + h + 3
  }
  /**
   * LE PANNEAU DES VAISSEAUX, par-dessus le hangar : une carte par vaisseau qu'on a — son châssis, son nom, sa classe,
   * sa mission en cours ; celui qu'on pilote est cerclé d'or (« Piloté »), une tape sur un autre le prend et referme.
   */
  let vaisseauxOuverts = false
  let vaisseauxA = -10
  /** Le vaisseau choisi dans la liste du panneau (jeu du vortex), et où son surlignage en est. */
  let vaisseauChoisi = ''
  /**
   * L'ARME DU JEU DU VORTEX (Keko, 15/11 : « Arme et le nom de l'arme, avec un bouton pour changer ») : le canon, un par
   * aile ; son panneau liste les armes du catalogue — les autres, verrouillées pour l'instant.
   */
  let armesOuvertes = false
  let armeChoisie = ''
  function dessinerLesArmesEnListe(p: Peintre, voile: boolean, partie: 'tout' | 'liste' | 'fiche'): void {
    const u0 = sortie((t - vaisseauxA) / 0.18)
    p.rect(0, HAUT_BARRE, W, H - HAUT_BARRE, NUIT, voile || partie !== 'tout' ? 1 : 0)
    eteindre(0, HAUT_BARRE, W, H)
    if (partie !== 'fiche') zones = []
    zoneGlissante = null
    zoneDesCases = null
    let y = HAUT_BARRE + 4 + Math.round((1 - u0) * 10)
    // (LES ARMES DE CE VAISSEAU, ET ELLES SEULES — Keko, 15/11 : « le chasseur montre le canon, la mitraillette et les
    // missiles, et c'est tout ; la salamandre, le lance-flammes »)
    const toutes = armesDuVortex().map((id) => pieceDe(id)).filter((pc): pc is NonNullable<typeof pc> => pc !== undefined)
    const choisie = toutes.find((pc) => pc.id === armeChoisie) ?? toutes[0]
    const aSoi = armesDuVortex().includes(choisie.id)
    if (partie !== 'fiche') {
      enTete(p, y, 'Armes', () => ((armesOuvertes = false), (etapeA = t)))
      y += HT + 3
      const iSel = toutes.indexOf(choisie)
      const hl = toutes.length * RANG_LISTE + 4
      plaque(p, 4, y, W - 8, hl, 'creux')
      const yl = y + 2
      const cibleY = yl + iSel * RANG_LISTE
      surligneVaisseau = surligneVaisseau < 0 ? cibleY : ressort(surligneVaisseau, cibleY, 24)
      p.rect(7, Math.round(surligneVaisseau), W - 14, RANG_LISTE, N.hex('#2a2440'))
      p.rect(7, Math.round(surligneVaisseau) + 1, 2, RANG_LISTE - 2, PEPITE[2])
      toutes.forEach((pc, i) => {
        const ly = yl + i * RANG_LISTE
        const equipee = pc.id === armeDuVortex()
        const a = armesDuVortex().includes(pc.id)
        const ici = i === iSel
        ecrire(p, pc.nom, 14, ly + 3, !a ? (ici ? COQUE[4] : COQUE[3]) : ici ? N.hex('#f6ecd2') : COQUE[5])
        if (equipee) p.text('EQUIPE', W - 10, ly + 4, PEPITE[2], { align: 'right' })
        else if (!a) p.text('VERROUILLE', W - 10, ly + 4, COQUE[3], { align: 'right' })
        zone(4, ly, W - 8, RANG_LISTE, () => (armeChoisie = pc.id), ici ? null : 'clic')
      })
      y += hl + 4
      if (choisie.id === armeDuVortex()) motEnRelief(p, 'Équipé', W / 2, y + 4, true)
      else if (aSoi) {
        const bw = largeurDe('Équiper', GRAS) + 22
        bouton(p, Math.round(W / 2 - bw / 2), y, bw, 15, 'Équiper', true, () => {
          choisirLArme(choisie.id)
          feterLEquipement()
        }, 'equipe')
      } else ecrire(p, 'Pas encore disponible', W / 2, y + 4, COQUE[4], { align: 'center' })
      y += 19
      if (partie === 'liste') {
        if (u0 < 1) p.rect(0, HAUT_BARRE, W, H - HAUT_BARRE, NUIT, 1 - u0)
        zone(0, 0, W, H, () => {}, null)
        return
      }
    }
    // L'APERÇU ET CE QU'ELLE FAIT (Keko, 17/11 : « dans l'écran de sélection des armes, on enlève la cadence, les dégâts et
    // toutes les informations statistiques ; plus de jauge : juste le nom de l'arme et une petite description, avec une
    // animation — on voit le vaisseau et un ennemi, avec le projectile en animation, pour voir ce que ça donne en jeu ») :
    // l'aperçu (`dessinerLApercuDeLArme`), le nom, la description sans chiffres (`DESCRIPTIONS_DES_ARMES`)
    // (UN PETIT ESPACE SOUS LA DESCRIPTION, comme celle des vaisseaux — Keko, 17/11 : « elle touche le bord inférieur de son
    // cadre » : la plaque se taille à ses lignes, trois pixels sous la dernière)
    // (LA PLAQUE GARDE TOUJOURS LA PLACE DE TROIS LIGNES — Keko, 17/11 : « dessine toujours le rectangle de la même taille ;
    // s'il y a deux lignes, centre-les verticalement »)
    const lignes = replier(DESCRIPTIONS_DES_ARMES[choisie.id] ?? choisie.dit, W - 22).slice(0, 3)
    const bas = 21 + 3 * 9 + 3
    const hA = Math.max(64, Math.min(110, H - y - 4 - bas))
    plaque(p, 4, y, W - 8, hA + bas, 'encre')
    dessinerLApercuDeLArme(p, 8, y + 4, W - 16, hA, choisie.id)
    motEnRelief(p, choisie.nom, W / 2, y + hA + 9, aSoi)
    const centre = Math.round(((3 - lignes.length) * 9) / 2)
    lignes.forEach((li, i) => ecrire(p, li, W / 2, y + hA + 21 + centre + i * 9, COQUE[4], { align: 'center' }))
    if (u0 < 1) p.rect(0, HAUT_BARRE, W, H - HAUT_BARRE, NUIT, 1 - u0)
    zone(0, 0, W, H, () => {}, null)
  }
  /** LES ARMES, DITES SANS CHIFFRES (Keko, 17/11 : « juste le nom de l'arme et une petite description ») : ce qu'elle fait, à voir. */
  const DESCRIPTIONS_DES_ARMES: Record<string, string> = {
    'arme-canon': 'Des obus lourds, tirés d’une aile puis de l’autre, droit devant.',
    'arme-rafale': 'Une pluie de balles rapides, qui s’éparpillent un peu.',
    'arme-minimissiles': 'Des missiles guidés, qui rattrapent leur cible et explosent à l’impact.',
    'arme-flammes': 'Un cône de feu au nez : il arrose de près, et ce qu’il touche brûle encore.',
    'arme-rayon': 'Un rayon tombe du toit et trace au sol un trait de feu, qui laisse des flammes.',
    'arme-napalm': 'Une boule de gel lancée en cloche, qui laisse une flaque de feu.',
    'arme-drones': 'Trois drones en orbite fondent sur les ennemis proches et les frappent d’arcs électriques.',
    'arme-chaine': 'Un éclair qui rebondit d’ennemi en ennemi.',
    'arme-aura': 'Un champ électrique autour du vaisseau, qui grille ce qui s’approche.',
    'arme-tourelles': 'Il pose sur son passage de petites tourelles qui tirent seules.',
    'arme-scie': 'Une scie circulaire lancée vers l’ennemi, qui coupe tout à l’aller et au retour.',
    'arme-fleau': 'Une masse à pics qui tourne sans cesse autour de lui, au bout de sa chaîne.',
    'arme-givre': 'Une traînée de givre derrière lui, qui ralentit et gèle les insectes.',
    'arme-nova': 'Une onde de froid tout autour de lui, qui gèle et laisse le sol en verglas.',
    'arme-poison': 'Il sème derrière lui une traînée de poison où les insectes se rongent.',
    'arme-epines': 'Une grande épine d’os, qui transperce tous les insectes sur sa course.',
    'arme-oeufs': 'Il pond des œufs, qui éclosent d’eux-mêmes : trois petits vers en sortent et mordent les insectes.',
    'arme-eclats': 'De gros éclats de glace tout autour, le premier droit sur la cible : ils gèlent ce qu’ils touchent.',
    'arme-tornade': 'Une tornade de givre qui poursuit les insectes, les ralentit et les lacère.',
    'arme-plasma': 'Une lente sphère de plasma, qui lance de petits traits sur tout ce qui passe près d’elle.',
    'arme-essaim': 'Une gerbe de petits missiles de plasma, qui zigzaguent puis fondent sur les insectes.',
    'arme-meteore': 'Une météore d’arcane tombe du ciel sur un insecte, sans jamais le manquer.',
    'arme-tentacules': 'Une tentacule à aiguille, qui fouette et pique très vite.',
    'arme-nuee': 'Une nuée de minuscules insectes l’entoure et lance ses bras vers les ennemis.',
    'arme-rejetons': 'Il pond des rejetons, qui nagent vers les insectes et les agrippent de leurs tentacules.',
    'arme-crachat': 'Un crachat d’acide devant lui, qui ronge les insectes et les rend fragiles.',
    'arme-mines': 'Des pustules d’acide semées autour de lui, qui éclatent en gaz au passage d’un insecte.',
    'arme-parasites': 'Un petit cerveau à crocs s’accroche à un insecte et le dévore, puis bondit sur un autre à sa mort.',
    'arme-faisceau': 'Un rayon continu depuis son cristal, qui chauffe de plus en plus sur la même cible.',
    'arme-cristaux': 'Des cristaux posés par trois, reliés de faisceaux qui brûlent ce qui les traverse.',
    'arme-rail': 'Un trait d’énergie instantané, qui traverse toute une ligne d’insectes.',
    'arme-puits': 'Une singularité qui aspire les insectes vers son cœur, puis éclate.',
    'arme-drain': 'Il accroche les âmes qui l’approchent et les draine, à toute distance ; leur vie purge sa corruption.',
    'arme-vrilles': 'Des tentacules d’ombre sortent du sol autour de lui et fouettent.',
    'arme-balises': 'Des glyphes posés par trois, reliés de rayons qui frappent ce qui les franchit.',
  }
  /**
   * L'APERÇU D'UNE ARME (Keko, 17/11 : « on voit le vaisseau et un ennemi avec le projectile en animation, pour voir ce
   * que ça donne en jeu ») : UN PETIT MONDE À PART, armé de la même configuration que le vrai vol (`configDuVol`) — le
   * vaisseau piloté au milieu, deux insectes qui foncent sur lui depuis la droite et le mordent sans l'entamer, remplacés
   * quand l'arme les abat — JAMAIS AUTREMENT (Keko, 17/11 : « il persiste des bugs de disparition de l'ennemi ») ; ils ne
   * lâchent pas de pépites ; il ne meurt pas (sa coque est refaite à chaque pas). On le fait avancer par la règle (`avancerLeMonde`), et on le PEINT AVEC
   * LES FONCTIONS DU VOL, le temps de les prêter à ce monde (`m`, `CONF`, `v`, la caméra), rognées à son cadre : ce qu'on
   * voit est ce que fait l'arme en jeu. Il repart de zéro quand on change d'arme (plus toutes les quatorze secondes : tout
   * s'y effaçait d'un coup).
   */
  let apercu: { arme: string; conf: ConfigVaisseau; monde: Monde; t: number; nes: number } | null = null
  const APERCU_LOIN = 200
  function apercuDe(arme: string): { arme: string; conf: ConfigVaisseau; monde: Monde; t: number; nes: number } {
    if (apercu === null || apercu.arme !== arme || apercu.monde.phase !== 'vol') {
      const base = configDuVol(arme, 1)
      // (des insectes deux fois plus lents qu'en vol : l'arme a le temps de se montrer avant qu'ils n'arrivent)
      const conf: ConfigVaisseau = { ...base, invasion: { ...base.invasion, premiere: 1e9 }, ennemi: { ...base.ennemi, vitesseMax: base.ennemi.vitesseMax * 0.5, poussee: base.ennemi.poussee * 0.5 } }
      const monde = nouveauMonde(conf, 1)
      // (LOIN DU PORTAIL — mesuré : posés dessus, les insectes qui arrivaient au vaisseau « passaient » le portail et
      // disparaissaient avant d'être touchés ; à 200 de lui, ils foncent sur le vaisseau)
      monde.vaisseau = { ...monde.vaisseau, x: -APERCU_LOIN, y: 0, cap: 0, vx: 0, vy: 0 }
      apercu = { arme, conf, monde, t, nes: 0 }
    }
    return apercu
  }
  /** Fait avancer l'aperçu jusqu'à maintenant (les globales du vol lui sont prêtées) ; rend le temps avancé. */
  /**
   * LES ARMES QUI POSENT SUR LE PASSAGE DU VAISSEAU (Keko, 17/11 : « la traînée de givre, les mines et les balises reliées
   * ne sont pas bien animées, car le vaisseau se déplace de haut en bas ») : la traînée naît derrière lui, une balise ou un
   * cristal tous les 40 de trajet, les mines autour de lui — en glissant de 22 de haut en bas, il empilait tout sur place.
   * Avec elles, il FAIT UN CIRCUIT : un ovale à travers le cadre, le nez dans sa course.
   */
  // (… ET LE DRAIN D'ÂME : il accroche, puis s'en va — on voit le lien tenir à distance)
  const ARMES_EN_CIRCUIT = new Set(['arme-givre', 'arme-poison', 'arme-oeufs', 'arme-mines', 'arme-balises', 'arme-cristaux', 'arme-drain'])
  function avancerLApercu(a: { arme: string; conf: ConfigVaisseau; monde: Monde; t: number; nes: number }, w: number, h: number): number {
    const circuit = ARMES_EN_CIRCUIT.has(a.arme)
    // (l'ovale : centré sur le cadre, aux trois dixièmes de sa largeur et de sa hauteur, parcouru à 45 par seconde environ)
    const rx = w * 0.3
    const ry = h * 0.3
    const omega = 45 / Math.max(1, (rx + ry) / 2)
    const xc = -APERCU_LOIN + 14
    const fait = Math.min(0.1, Math.max(0, t - a.t))
    let reste = fait
    a.t = t
    // (LE CIRCUIT COMMENCE SUR L'OVALE — Keko, 18/11 : « un petit rond de poison apparaît seul au milieu » : le monde
    // posait le vaisseau au centre, il y laissait sa première flaque au premier pas, puis sautait sur l'ovale)
    if (circuit && a.monde.t === 0) a.monde.vaisseau = { ...a.monde.vaisseau, x: xc + rx, y: 0, vx: 0, vy: ry * omega }
    while (reste > 1e-6) {
      const pas = Math.min(1 / 60, reste)
      reste -= pas
      while (a.monde.ennemis.length < 2) {
        const k = a.nes++
        const an = (((k * 0.618) % 1) - 0.5) * 1.3
        const e: Ennemi = { id: a.monde.prochainId++, corps: { ...a.monde.vaisseau, x: -APERCU_LOIN + 34 + Math.cos(an) * 38, y: Math.sin(an) * 30, vx: 0, vy: 0, cap: Math.PI, poussee: 0 }, pv: a.conf.ennemi.pv, fait: 'marche', roche: null, forage: null, tirA: 0, butin: 0, cargaison: cargaisonVide() }
        a.monde.ennemis.push(e)
      }
      // (IL REGARDE L'INSECTE LE PLUS PROCHE, comme le manche du regard en vol : en glissant, son nez suivait sa course, et les
      // armes qui ne tirent que devant ne tiraient plus)
      const va = a.monde.vaisseau
      const proche = a.monde.ennemis.reduce<Ennemi | null>((b, e) => (b === null || Math.hypot(e.corps.x - va.x, e.corps.y - va.y) < Math.hypot(b.corps.x - va.x, b.corps.y - va.y) ? e : b), null)
      const regard = circuit ? { x: va.vx, y: va.vy } : proche === null ? { x: 1, y: 0 } : { x: proche.corps.x - va.x, y: proche.corps.y - va.y }
      // (IL NE SUBIT AUCUN DÉGÂT — Keko, 17/11 : « empêche le vaisseau de subir des dégâts durant la prévisualisation » :
      // intouchable le temps du pas, la règle ignore les morsures et les chocs ; levé après, il ne clignote pas)
      a.monde.intouchableJusque = Infinity
      const r = avancerLeMonde(a.conf, a.monde, pas, { x: 0, y: 0 }, regard)
      a.monde.intouchableJusque = -1
      // (CE QUE LE VOL FAIT DE SES ÉVÉNEMENTS, TEL QUEL — les morts des insectes, les impacts, les éclairs, les arcs : Keko,
      // 17/11, « un ennemi tué disparaît sans animation de mort, et l'animation de hit n'apparaît pas » ; muet)
      v = a.monde.vaisseau
      celebrer(r)
      // (le lance-flammes : ses flammes, comme en vol)
      if (a.monde.crache && a.conf.armes.length > 0) {
        const a0 = a.conf.armes[0]
        const va = a.monde.vaisseau
        const bo = a0.bouche ?? { x: 0, y: 0 }
        const bx = va.x + Math.cos(va.cap) * bo.x - Math.sin(va.cap) * bo.y
        const by = va.y + Math.sin(va.cap) * bo.x + Math.cos(va.cap) * bo.y
        const cone = a0.flamme?.cone ?? 0.4
        for (let i = 0; i < 6; i++) {
          const an = va.cap + R.range(-cone * 0.8, cone * 0.8)
          const fl = R.range(0.2, 0.3)
          const vit = ((a0.portee + a.conf.ennemi.rayon) / (0.7 * fl)) * R.range(0.9, 1.05)
          flammesDuNez.push({ x: bx, y: by, vx: Math.cos(an) * vit, vy: Math.sin(an) * vit, t0: t - R.range(0, pas), fl, sm: R.next() < 0.55, sl: R.range(0.25, 0.45), s: R.range(1.2, 2.4), f: R.next() })
        }
      }
      // (IL GLISSE DOUCEMENT DE HAUT EN BAS, toujours à la même place — mesuré : poussé par les insectes qui le heurtent, il
      // sortait du cadre ; et ce qu'il pose « sur son passage » — balises, cristaux, givre — ne se posait pas à l'arrêt ;
      // il tourne et vise tout seul ; un insecte qui l'atteint le mord, comme en vol — il n'est plus retiré : il disparaissait
      // sans mourir, au fléau surtout, qui laisse les insectes venir au contact)
      const tm = a.monde.t
      if (circuit) a.monde.vaisseau = { ...a.monde.vaisseau, x: xc + rx * Math.cos(omega * tm), y: ry * Math.sin(omega * tm), vx: -rx * omega * Math.sin(omega * tm), vy: ry * omega * Math.cos(omega * tm) }
      else a.monde.vaisseau = { ...a.monde.vaisseau, x: -APERCU_LOIN, y: 22 * Math.sin(0.9 * tm), vx: 0, vy: 22 * 0.9 * Math.cos(0.9 * tm) }
      // (PAS DE PÉPITES dans l'aperçu — Keko, 17/11 : les insectes abattus n'y lâchent rien)
      a.monde.pepites = []
      // (il ne meurt pas : sa coque, son bouclier, ses plaques sont refaits)
      a.monde.coque = a.conf.coque
      a.monde.bouclier = a.conf.bouclier.points
      a.monde.plaques = a.monde.plaques.map(() => true)
      a.monde.corruption = 0
      v = a.monde.vaisseau
    }
    return fait
  }
  function dessinerLApercuDeLArme(p: Peintre, x: number, y: number, w: number, h: number, arme: string): void {
    const a = apercuDe(arme)
    p.place(0, 0)
    p.rect(x - 1, y - 1, w + 2, h + 2, MATIERES.encre.contour)
    p.rect(x, y, w, h, N.hex('#05060c'))
    for (let k = 0; k < 14; k++) p.rect(x + ((k * 37) % w), y + ((k * 23) % h), 1, 1, k % 4 === 0 ? COQUE[5] : COQUE[3])
    const fw = frame.w
    const ax = Math.round(x + ORIGINE.x)
    const ay = Math.round(y + ORIGINE.y)
    const avantC = frame.color.slice()
    const avantL = frame.light.slice()
    // (LES GLOBALES DU VOL SONT PRÊTÉES À L'APERÇU, le temps de l'avancer et de le peindre ; ce que ses événements
    // touchent du vol — la secousse, le blanchiment du vaisseau, l'éclat de l'expérience — est remis ensuite)
    const garde = { m, CONF, v, cx: camera.x, cy: camera.y, arme: armesChoisies[flotte.actif], secousse, toucheA, xpA, purgeA }
    m = a.monde
    CONF = a.conf
    v = m.vaisseau
    armesChoisies[flotte.actif] = arme
    enApercu = true
    // (le centre du cadre montre le point (14, 0) du petit monde : le vaisseau à gauche, les insectes à droite)
    camera.x = W / 2 - APERCU_LOIN + 14 - (x + w / 2)
    camera.y = centreY() - (y + h / 2)
    try {
      const dtA = avancerLApercu(a, w, h)
      // (les gerbes et les effets avancent avec lui : au hangar, le vol ne les fait pas avancer)
      braises.update(dtA)
      etincelles.update(dtA)
      morceaux.update(dtA)
      for (let i = flashs.length - 1; i >= 0; i--) if (t - flashs[i].t0 > 0.4) flashs.splice(i, 1)
      for (const e of effets) {
        e.fx.update(dtA)
        e.fx.options.x = e.x - camera.x + W / 2
        e.fx.options.y = e.y - camera.y + centreY()
      }
      effets = effets.filter((e) => !e.fx.done())
      dessinerLesTaches(p)
      dessinerLeGivre(p)
      dessinerLesNovas(p)
      dessinerLesFlaques(p)
      dessinerLesMeteoresAuSol(p)
      dessinerLesFlaquesAcides(p)
      dessinerLesMines(p)
      dessinerLesTourelles(p)
      dessinerLesBalises(p)
      dessinerLesEnnemis(p)
      dessinerLesTentacules(p)
      dessinerLesVrilles(p)
      dessinerLesOeufs(p)
      dessinerLesEclosions(p)
      dessinerLesMiniVers(p)
      dessinerLesEpines(p)
      dessinerLesFleaux(p)
      dessinerLeVaisseau(p)
      dessinerLesTirs(p)
      dessinerLesScies(p)
      dessinerLesTornades(p)
      dessinerLePlasma(p)
      dessinerLesMeteores(p)
      dessinerLesEclatsBrises(p)
      dessinerLesNuees(p)
      dessinerLeDrain(p)
      dessinerLesRejetons(p)
      dessinerLesCrachats(p)
      dessinerLesGaz(p)
      dessinerLesParasites(p)
      dessinerLElectricite(p)
      dessinerLesLasers(p)
      dessinerLesGerbes(p)
      for (const e of effets) e.fx.draw(frame)
    } finally {
      m = garde.m
      CONF = garde.CONF
      v = garde.v
      camera.x = garde.cx
      camera.y = garde.cy
      secousse = garde.secousse
      toucheA = garde.toucheA
      xpA = garde.xpA
      purgeA = garde.purgeA
      enApercu = false
      if (garde.arme === undefined) delete armesChoisies[flotte.actif]
      else armesChoisies[flotte.actif] = garde.arme
      p.place(0, 0)
    }
    // (rogné à son cadre : hors de lui, l'écran d'avant)
    for (let yy = 0; yy < frame.h; yy++) {
      const dansY = yy >= ay && yy < ay + h
      for (let xx = 0; xx < fw; xx++) {
        if (dansY && xx >= ax && xx < ax + w) continue
        const i = yy * fw + xx
        frame.color[i] = avantC[i]
        frame.light[i] = avantL[i]
      }
    }
  }
  const couleursOuverts = (): boolean => couleursOuvertes
  let surligneVaisseau = -1
  /** L'instant où une case de la grille des vaisseaux a été choisie (elle saute et flashe). */
  let choixVaisseauA = -10
  // (LE PETIT SYMBOLE DES RACES, sept pixels, est parti — Keko, 17/11 : l'emblème de la fiche le remplace)
  /**
   * L'EMBLÈME D'UNE RACE (Keko, 17/11 : « des symboles plus travaillés », dans la fiche du vaisseau, à la place de son
   * image), une trentaine de pixels, cerné d'encre, centré sur (cx, cy) : LES HUMAINS, un écu d'or aux deux chevrons,
   * entre deux ailes ; L'ESSAIM, trois alvéoles de ruche, des antennes et deux mandibules, en vert ; LES ÉTHÉRÉS, une étoile
   * de rune à huit branches, une gemme au cœur, un anneau où tourne une lueur, en cyan ; LES INNOMMÉS, un œil fendu au
   * milieu de six vrilles qui ondulent, en violet. Ils vivent un peu (la lueur qui tourne, les vrilles, l'iris qui bat).
   */
  function dessinerLEmblemeDeRace(p: Peintre, race: Race, cx: number, cy: number): void {
    const encre = MATIERES.encre.contour
    // (un polygone cerné d'un pixel d'encre)
    const cerne = (pts: number[][], c: number): void => {
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) p.poly(pts.map(([x, y]) => [x + dx, y + dy]), encre)
      p.poly(pts, c)
    }
    const trait = (x0: number, y0: number, x1: number, y1: number, c: number): void => {
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) p.line(x0 + dx, y0 + dy, x1 + dx, y1 + dy, encre)
      p.line(x0, y0, x1, y1, c)
    }
    if (race === 'humains') {
      const G = ['#5a3a08', '#a8650f', '#d99a1c', '#f2c23a', '#fff2a8'].map((c) => N.hex(c))
      for (const s of [-1, 1])
        for (let k = 2; k >= 0; k--) cerne([[cx + s * 6, cy - 7 + k * 4], [cx + s * (16 - k * 2), cy - 10 + k * 5], [cx + s * (14 - k * 2), cy - 6 + k * 5], [cx + s * 6, cy - 3 + k * 4]], G[k === 1 ? 2 : 1])
      cerne([[cx - 8, cy - 11], [cx + 8, cy - 11], [cx + 8, cy + 1], [cx, cy + 11], [cx - 8, cy + 1]], G[2])
      p.poly([[cx - 7, cy - 10], [cx, cy - 10], [cx, cy + 9], [cx - 7, cy + 1]], G[3])
      for (const [dy, c] of [[-5, G[4]], [0, G[1]]] as [number, number][]) {
        p.line(cx - 5, cy + dy - 1, cx, cy + dy + 3, c)
        p.line(cx, cy + dy + 3, cx + 5, cy + dy - 1, c)
        p.line(cx - 5, cy + dy, cx, cy + dy + 4, c)
        p.line(cx, cy + dy + 4, cx + 5, cy + dy, c)
      }
      p.rect(cx - 1, cy - 15, 3, 1, G[4])
      p.rect(cx, cy - 16, 1, 3, G[4])
      return
    }
    if (race === 'essaim') {
      const G = ['#0e2a08', '#1f5a12', '#3a8a1c', '#7cd04a', '#c8f080'].map((c) => N.hex(c))
      trait(cx - 2, cy - 9, cx - 7, cy - 15, G[3])
      trait(cx + 2, cy - 9, cx + 7, cy - 15, G[3])
      const alveole = (x: number, y: number, r: number): number[][] => Array.from({ length: 6 }, (_, k) => [x + Math.cos(Math.PI / 6 + (k * Math.PI) / 3) * r, y + Math.sin(Math.PI / 6 + (k * Math.PI) / 3) * r])
      for (const [x, y] of [[cx - 6, cy + 3], [cx + 6, cy + 3], [cx, cy - 4]]) {
        cerne(alveole(x, y, 6.6), G[1])
        p.poly(alveole(x, y, 4.6), G[2])
        p.poly(alveole(x - 0.8, y - 0.8, 2.4), G[3])
      }
      for (const s of [-1, 1]) cerne([[cx + s * 3, cy + 9], [cx + s * 9, cy + 13], [cx + s * 6, cy + 16], [cx + s * 2, cy + 12]], G[3])
      return
    }
    if (race === 'etheres') {
      const G = ['#06243a', '#0e4a6a', '#1e80a8', '#5ad0f0', '#c8f6ff'].map((c) => N.hex(c))
      p.ring(cx, cy, 14, 1, G[1])
      const etoile = (n: number, re: number, ri: number, tourne: number): number[][] => Array.from({ length: n * 2 }, (_, k) => {
        const r = k % 2 === 0 ? re : ri
        const a = tourne + (k * Math.PI) / n
        return [cx + Math.cos(a) * r, cy + Math.sin(a) * r]
      })
      cerne(etoile(8, 11, 4.5, -Math.PI / 2), G[2])
      p.poly(etoile(4, 11, 3, -Math.PI / 2), G[3])
      p.poly([[cx, cy - 4], [cx + 3, cy], [cx, cy + 4], [cx - 3, cy]], G[4])
      const a = t * 1.4
      p.rect(Math.round(cx + Math.cos(a) * 14), Math.round(cy + Math.sin(a) * 14), 2, 2, G[4])
      p.glow(cx + Math.cos(a) * 14, cy + Math.sin(a) * 14, 5, G[3], 0.4)
      return
    }
    const G = ['#1a0a2a', '#3c1a6a', '#6a30b0', '#b878ff', '#e8d0ff'].map((c) => N.hex(c))
    for (let k = 0; k < 6; k++) {
      const a0 = (k * Math.PI) / 3 + Math.PI / 6
      let [x, y] = [cx + Math.cos(a0) * 8, cy + Math.sin(a0) * 6]
      for (let i = 1; i <= 4; i++) {
        const a = a0 + Math.sin(t * 2 + k + i * 0.9) * 0.35
        const [nx, ny] = [cx + Math.cos(a) * (8 + i * 2.2), cy + Math.sin(a) * (6 + i * 2.2)]
        trait(x, y, nx, ny, i < 3 ? G[3] : G[2])
        ;[x, y] = [nx, ny]
      }
    }
    const amande = Array.from({ length: 16 }, (_, k) => {
      const u = k < 8 ? -1 + (k / 7) * 2 : 1 - ((k - 8) / 7) * 2
      return [cx + u * 12, cy + (k < 8 ? -1 : 1) * (1 - u * u) * 7]
    })
    // (plus clair : sur le fond sombre de la fiche, l'œil et ses vrilles se perdaient)
    cerne(amande, G[1])
    const bat = 0.5 + 0.5 * Math.sin(t * 2.4)
    p.circle(cx, cy, 4.6, G[3])
    p.circle(cx, cy, 3.2, bat > 0.5 ? G[4] : G[3])
    p.rect(cx, cy - 4, 1, 8, G[0])
    p.rect(cx - 2, cy - 3, 1, 1, G[4])
  }
  /** Les teintes d'une race, du sombre au clair : le jonc de son médaillon et son nom. */
  const TEINTES_DES_RACES: Record<Race, number[]> = {
    humains: ['#5a3a08', '#a8650f', '#f2c23a'].map((c) => N.hex(c)),
    essaim: ['#14380c', '#3a8a1c', '#7cd04a'].map((c) => N.hex(c)),
    etheres: ['#0a3450', '#1e80a8', '#5ad0f0'].map((c) => N.hex(c)),
    innommes: ['#2a1050', '#6a30b0', '#b878ff'].map((c) => N.hex(c)),
  }
  /** Le rayon du médaillon d'une race, son jonc compris. */
  const RAYON_DU_MEDAILLON = 19
  /**
   * Le nom d'une race, TOUJOURS SUR UNE LIGNE (Keko, 17/11 : « ne marque pas le nom de la race en deux lignes »), SANS SON
   * ARTICLE : « Les Innommés » entier élargissait la colonne de l'identité et écrasait les barres des jauges.
   */
  const lignesDuNomDeRace = (race: Race): string[] => [(RACES.find((r) => r.id === race)?.nom ?? '').replace(/^(Les |L’|L')/, '')]
  /** La hauteur de l'identité d'une race : son médaillon, puis son nom. */
  const hauteurDeLIdentite = (race: Race): number => 2 * RAYON_DU_MEDAILLON + 1 + 3 + lignesDuNomDeRace(race).length * 8
  /**
   * L'IDENTITÉ D'UNE RACE, dans la fiche d'un vaisseau (Keko, 17/11 : « le nom de la race en dessous du symbole », et plus
   * de cadre en portrait) : son emblème dans un MÉDAILLON ROND — un jonc à ses teintes, éclairé en haut à gauche, le fond
   * de ses portraits et un halo —, puis son nom à sa couleur, centré sous lui. `cx` : le centre, `y` : le haut. Grisée
   * quand le vaisseau n'est pas à soi.
   */
  function dessinerLIdentiteDeRace(p: Peintre, race: Race, cx: number, y: number, aSoi: boolean): void {
    const [sombre, moyen, clair] = TEINTES_DES_RACES[race]
    const [, bas, halo] = FONDS_DES_RACES[race]
    const encre = MATIERES.encre.contour
    const R = RAYON_DU_MEDAILLON
    const cy = y + R
    p.circle(cx, cy + 1, R, encre)
    p.circle(cx, cy, R, encre)
    p.circle(cx, cy, R - 1, moyen)
    p.circle(cx, cy, R - 2.5, encre)
    p.circle(cx, cy, R - 3.5, bas)
    p.glow(cx, cy, R - 4, halo, 0.6)
    p.arc(cx, cy, R - 1, 1, Math.PI * 0.9, Math.PI * 1.65, clair)
    p.arc(cx, cy, R - 1, 1, -Math.PI * 0.1, Math.PI * 0.65, sombre)
    dessinerLEmblemeDeRace(p, race, cx, cy)
    if (!aSoi) p.disc(cx, cy, R, N.hex('#12161f'), 0.55)
    lignesDuNomDeRace(race).forEach((li, i) => ecrire(p, li, cx, y + 2 * R + 4 + i * 8, aSoi ? clair : COQUE[3], { align: 'center' }))
  }
  /** Le fond d'un portrait, aux teintes de la race : le haut, le bas, le halo derrière le vaisseau. */
  const FONDS_DES_RACES: Record<Race, number[]> = {
    humains: ['#0e1626', '#16223a', '#2a4470'].map((c) => N.hex(c)),
    essaim: ['#0a1206', '#14220c', '#2e5a18'].map((c) => N.hex(c)),
    etheres: ['#06121c', '#0c2232', '#1e6080'].map((c) => N.hex(c)),
    innommes: ['#0e0616', '#1c0c30', '#4a2272'].map((c) => N.hex(c)),
  }
  /**
   * LE PORTRAIT D'UN VAISSEAU (Keko, 17/11) : vu DE PRÈS ET DE TROIS QUARTS — le nez tourné vers le haut à droite, l'image
   * écrasée en hauteur (`aplatir`), assez grand pour être un peu rogné par son cadre —, dans son apparence, sur le fond de
   * sa race, un halo derrière lui ; il vit (sa flamme, ses tentacules, ses anneaux) et flotte doucement. `n` : son rang,
   * pour qu'ils ne flottent pas tous ensemble.
   */
  const cadresDesPortraits = new Map<string, [number, number, number, number]>()
  function peindreLePortrait(p: Peintre, mo: ReturnType<typeof modeleDeVaisseau>, x: number, y: number, w: number, h: number, n: number): void {
    const [haut, bas, halo] = FONDS_DES_RACES[mo.race]
    for (let j = 0; j < h; j++) p.rect(x, y + j, w, 1, j < h * 0.45 ? haut : bas)
    for (let k = 0; k < 4; k++) p.rect(x + Math.floor(((n * 7 + k * 13) % 17) / 17 * w), y + Math.floor(((n * 5 + k * 11) % 13) / 13 * h * 0.5), 1, 1, COQUE[4])
    p.glow(x + w / 2, y + h * 0.56, Math.min(w, h) * 0.45, halo, 0.5)
    const coque = pieceDe(mo.serie.montees.coque)?.cran ?? 1
    const pe = peauDuModele(mo.id)
    const al: Allure = { propulseur: pieceDe(mo.serie.montees.propulseur)?.cran ?? 1, coque, foreuse: 0, radar: false, aimant: false, armes: [], bouclier: 0, habit: pe.habit(coque) }
    const formes = formesDuVaisseau(al, 0.5 + 0.15 * Math.sin(t * 7 + n), t)
    // (LE CADRE EST CELUI D'UNE POSE FIXE, gardé par modèle — Keko, 17/11 : « le Frimas, le Pulsar et tous les vaisseaux
    // humains ont un genre de tremblement bizarre » : la boîte prise sur les formes de l'image changeait avec la flamme, qui
    // frémit à chaque image, et l'échelle du portrait avec elle — la même leçon que `Options.cadre`)
    if (!cadresDesPortraits.has(mo.id)) cadresDesPortraits.set(mo.id, boiteDe(formesDuVaisseau(al, 0.65, 0)))
    const [x0, y0, x1, y1] = cadresDesPortraits.get(mo.id)!
    const echelle = (Math.min(w, h) * 1.35) / Math.max(1, x1 - x0, y1 - y0)
    const flotte_ = Math.round(Math.sin(t * 1.6 + n * 0.9))
    // (le cadre rogne : rien ne déborde de la case)
    const rogne = { rect: (rx: number, ry: number, rw: number, rh: number, c: number, a?: number): void => {
      if (rx >= x && ry >= y && rx < x + w && ry < y + h) p.rect(rx, ry, rw, rh, c, a)
    }, glow: (): void => {} }
    peindreFormes(rogne, formes, x + w / 2, y + h * 0.56 + flotte_, echelle, { cap: -Math.PI / 2 + 0.62, aplatir: 0.66, rampes: rampesDeLaPeau(pe) })
  }
  /**
   * LE PANNEAU DES VAISSEAUX DU JEU DU VORTEX, comme celui des pièces (Keko, 15/11) : la liste de TOUS les modèles — ceux
   * qu'on a, et ceux que la recherche n'a pas encore débloqués, grisés —, et la fiche du choisi : son châssis, sa
   * classe, ce qu'il est, ses jauges de vol (vitesse, accélération, maniabilité, sur les étalons du jeu), son blindage
   * et son bouclier ; puis « Piloter », « Piloté », ou ce qu'il faut pour l'avoir.
   */
  /**
   * LA FICHE D'UN VAISSEAU : son châssis dans un puits (assombri s'il n'est pas à soi), son nom, sa classe, ses jauges
   * de vol sur les étalons du jeu (sans sa classe), son blindage et son bouclier — celui de base du jeu du vortex compris —, et, `avecDit`,
   * ce qu'il est. Au panneau des vaisseaux, et sous le nom au hangar (Keko, 15/11). Rend sa hauteur.
   */
  function dessinerLaFicheDuVaisseau(p: Peintre, y: number, mo: ReturnType<typeof modeleDeVaisseau>, aSoi: boolean, depuis: number, avecDit: boolean, avecNom = true): number {
    const jaugesDuModele = (de: ReturnType<typeof modeleDeVaisseau>): Jauge[] => {
      const cf = configDuHangar(BASE, de.serie)
      const sur = (v: number, e: { max: number }): number => Math.max(0.05, Math.min(1, v / e.max))
      // (la vie de SA RACE — Keko, 17/11 ; L'ESSAIM N'A PAS DE LIGNE DE RÉGÉNÉRATION — « on régénère les PV en % » : elle
      // vaut la même part pour tous les siens, une jauge ne dirait rien)
      const vie = vieSelonLaRace(de.race, { coque: cf.coque, bouclier: { ...cf.bouclier, points: Math.max(cf.bouclier.points, BOUCLIER_DU_VORTEX) }, regeneration: cf.regeneration, plaques: cf.plaques, corruption: cf.corruption }, de.plaques)
      const jauges: Jauge[] = [
        { nom: 'Vitesse', valeur: sur(cf.vitesseMax, ETALONS.vitesse), max: 1 },
        { nom: 'Accélération', valeur: sur(cf.poussee, ETALONS.acceleration), max: 1 },
        { nom: 'Maniabilité', valeur: sur(cf.rotation, ETALONS.maniabilite), max: 1 },
        // (L'ESSAIM N'A PAS DE BLINDAGE, IL A DE LA VIE — Keko, 17/11 : « on devrait passer cette barre de vie en vert pour refléter un aspect plus point de vie »)
        de.race === 'essaim' ? { nom: 'Vie', valeur: vie.coque, max: 8, cellules: true } : { nom: 'Blindage', valeur: vie.coque, max: 8, cellules: true },
        vie.bouclier.points > 0 ? { nom: 'Bouclier', valeur: vie.bouclier.points, max: 8, cellules: true } : vie.plaques > 0 ? { nom: 'Plaques', valeur: vie.plaques, max: 8, cellules: true } : vie.corruption.ronge > 0 ? { nom: 'Purge', valeur: Math.round(vie.corruption.purge * 8), max: 8, cellules: true } : { nom: '', valeur: 0, max: 8 },
      ]
      return jauges.filter((j) => j.nom !== '')
    }
    const jauges = jaugesDuModele(mo)
    // (le repère du vaisseau piloté, JAUGE PAR JAUGE, PAR SON NOM : deux races n'ont pas les mêmes lignes)
    const repereDe = (l: Jauge[] | null, j: Jauge): number | null => {
      const q = l?.find((x) => x.nom === j.nom)
      return q === undefined ? null : q.valeur / q.max
    }
    // (UN REPÈRE BLANC À LA VALEUR DU VAISSEAU PILOTÉ, quand on en regarde un autre — Keko, 15/11 : « pour comparer celui
    // qui est équipé à celui qu'on est en train de regarder » ; comme les jauges des pièces)
    const pilote = mo.id === flotte.actif ? null : jaugesDuModele(modeleDeVaisseau(flotte.actif))
    const dit = avecDit ? replier(mo.dit, W - 22).slice(0, 3) : []
    // (sans le nom — au hangar, il est juste au-dessus —, les jauges montent et la fiche raccourcit)
    // (plus de « Classe légère / lourde » sous le nom — Keko, 15/11 : les jauges remontent sous lui)
    // LA FICHE EN DEUX ÉTAGES (Keko, 17/11 : « l'emplacement du symbole fait encore un côté portrait rectangulaire, c'est
    // pas hyper bien organisé ; le nom de la race en dessous du symbole ») : le NOM DU VAISSEAU en titre sur toute la
    // largeur, un filet ; dessous, à gauche, l'IDENTITÉ — le médaillon de la race et son nom —, un filet vertical, à
    // droite les JAUGES ; puis ce qu'il est
    const yj = avecNom ? 21 : 6
    const hh = avecNom ? Math.max(yj + hauteurDeLIdentite(mo.race) + 3, yj + jauges.length * 10 + 2) : yj + jauges.length * 10 + 2
    const hd = hh + (dit.length > 0 ? dit.length * 9 + 6 : 0)
    // (sans le nom, sans l'image non plus — Keko, 15/11 : « on a déjà l'image juste à côté » : les jauges prennent toute la largeur)
    // (la colonne de l'identité tient le plus long nom de race sur une ligne)
    const gx = avecNom ? Math.max(62, 8 + 2 + Math.max(...RACES.map((r) => largeurDe(lignesDuNomDeRace(r.id)[0]))) + 2 + 5) : 10
    plaque(p, 4, y, W - 8, hd, 'encre')
    if (avecNom) {
      motEnRelief(p, mo.nom, W / 2, y + 5, aSoi)
      p.rect(10, y + 16, W - 20, 1, MATIERES.encre.ombre)
      p.rect(gx - 5, y + yj - 1, 1, hh - yj - 3, MATIERES.encre.ombre)
      // (L'EMBLÈME DE SA RACE, À LA PLACE DE SON IMAGE — Keko, 17/11 : « on vire l'image du vaisseau, car elle est déjà
      // au-dessus » — son portrait, dans la grille —, « on aura plus de place pour des symboles plus travaillés »)
      dessinerLIdentiteDeRace(p, mo.race, Math.round((8 + gx - 5) / 2), y + yj + Math.floor((hh - yj - 3 - hauteurDeLIdentite(mo.race)) / 2), aSoi)
    }
    // (la colonne des libellés à la mesure des SIENS — « Accélération », pas les noms des pièces —, les barres gardent leur longueur)
    const colonne = avecNom ? Math.max(...jauges.map((j) => largeurDe(j.nom)), largeurDe('Accélération')) + 4 : undefined
    jauges.forEach((j, i) => {
      const k = sortie((t - depuis - 0.05 - i * 0.045) / 0.32)
      dessinerUneJaugeDePiece(p, y + yj + i * 10, { ...j, valeur: j.cellules ? j.valeur : j.valeur * k }, repereDe(pilote, j), false, gx, k, colonne)
    })
    if (dit.length > 0) {
      p.rect(10, y + hh - 1, W - 20, 1, MATIERES.encre.ombre)
      dit.forEach((li, i) => ecrire(p, li, W / 2, y + hh + 3 + i * 9, COQUE[4], { align: 'center' }))
    }
    return hd
  }
  // (LE CUIRASSÉ EST MIS DE CÔTÉ — Keko, 15/11 : la Salamandre a sa place)
  // (RANGÉS PAR RACE — Keko, 17/11 : « je voudrais diviser les vaisseaux en catégories : la race qui les utilise »)
  const modelesDuVortex = (): ReturnType<typeof modeleDeVaisseau>[] => RACES.flatMap((r) => MODELES.filter((mo) => mo.id !== 'cuirasse' && mo.race === r.id))
  /** Les rangées de la liste des vaisseaux : le nom de chaque race, puis ses vaisseaux. */
  const rangeesDesVaisseaux = (): ({ race: string } | { mo: ReturnType<typeof modeleDeVaisseau> })[] =>
    RACES.flatMap((r) => [{ race: r.nom }, ...MODELES.filter((mo) => mo.id !== 'cuirasse' && mo.race === r.id).map((mo) => ({ mo }))])
  /** La hauteur de la fiche d'un vaisseau au panneau (nom et dessin, cinq jauges, ce qu'il est) — voir `dessinerLaFicheDuVaisseau`. */
  // (LA GRILLE A UNE HAUTEUR FIXE — Keko, 17/11 : « la hauteur du grid varie en fonction du texte en dessous ; je voudrais
  // que le grid ait une hauteur fixe, la description limitée à trois lignes » : la fiche réserve toujours trois lignes)
  // (la plus haute des fiches : cinq jauges, ou l'identité d'une race au nom sur deux lignes — voir `dessinerLaFicheDuVaisseau`)
  const hauteurDeLaFicheDuVaisseau = (_mo: ReturnType<typeof modeleDeVaisseau>): number => 21 + Math.max(5 * 10 + 2, ...RACES.map((r) => hauteurDeLIdentite(r.id) + 3)) + 3 * 9 + 6
  function dessinerLesVaisseauxEnListe(p: Peintre, voile: boolean, partie: 'tout' | 'liste' | 'fiche'): void {
    const u0 = sortie((t - vaisseauxA) / 0.18)
    p.rect(0, HAUT_BARRE, W, H - HAUT_BARRE, NUIT, voile || partie !== 'tout' ? 1 : 0)
    eteindre(0, HAUT_BARRE, W, H)
    // (en paysage, la fiche se dessine APRÈS la liste, dans l'autre colonne : elle ne doit pas lui retirer son défilement)
    if (partie !== 'fiche') (zones = []), (zoneGlissante = null)
    zoneDesCases = null
    const fermer = (): void => {
      vaisseauxOuverts = false
      etapeA = t
    }
    let y = HAUT_BARRE + 4 + Math.round((1 - u0) * 10)
    const tous = modelesDuVortex()
    const choisi = tous.find((mo) => mo.id === vaisseauChoisi) ?? tous[0]
    const a = aLeVaisseau(flotte, choisi.id)
    // LE BOUTON « PILOTER » (ou « Piloté », ou « Pas encore disponible ») — Keko, 17/11 : DEBOUT, ENTRE LA GRILLE ET LA FICHE
    // (« on remonte le grid un peu pour placer le bouton dessous ») ; COUCHÉ, SOUS LA FICHE, dans la colonne de droite (« on
    // a un espace vide ; ainsi le grid peut être un peu plus gros à gauche »). Il prend `HAUT_DU_PILOTER` de haut.
    const boutonPiloter = (yb: number): void => {
      if (choisi.id === flotte.actif) {
        motEnRelief(p, 'Piloté', W / 2, yb + 4, true)
      } else if (a) {
        const bw = largeurDe('Piloter', GRAS) + 22
        bouton(p, Math.round(W / 2 - bw / 2), yb, bw, 15, 'Piloter', true, () => {
          sauver()
          flotte = choisirLeVaisseau(flotte, choisi.id)
          hangar = hangarActif(flotte)
          livree = livreeDuVaisseau()
          sauver()
          etapeA = t
          vaisseauxOuverts = false
          feterLEquipement()
        }, 'equipe')
      } else ecrire(p, 'Pas encore disponible', W / 2, yb + 4, COQUE[4], { align: 'center' }) // (comme les armes — Keko, 15/11)
    }
    const HAUT_DU_PILOTER = 19
    if (partie !== 'fiche') {
    enTete(p, y, 'Vaisseaux', fermer)
    y += HT + 3
    // LA GRILLE DES VAISSEAUX (Keko, 17/11 : « un grid de 12 cases où, plutôt que le nom, on met le portrait du vaisseau —
    // une vue du vaisseau de près dans un autre angle, un peu comme le portrait d'un personnage ; les races indiquées par un
    // petit symbole à côté du nom ; beaucoup plus ergonomique et juicy ») : douze cases, LES RACES ALIGNÉES — debout, une
    // rangée par race (trois colonnes) ; couché, une colonne par race (trois rangées) ; dans chaque case, LE PORTRAIT
    // (`peindreLePortrait`), et dessous le symbole de la race et le nom. La choisie est cerclée d'or et saute un peu ; la
    // pilotée porte « PILOTE » ; une tape en choisit une autre.
    const reserve = partie === 'liste' ? 4 : HAUT_DU_PILOTER + hauteurDeLaFicheDuVaisseau(choisi) + 4
    const parColonne = partie === 'liste'
    const ESP = 3
    const COLS = parColonne ? RACES.length : 3
    const RANGS = parColonne ? 3 : RACES.length
    const cw = Math.floor((W - 8 - (COLS - 1) * ESP) / COLS)
    const ch = Math.max(30, Math.min(60, Math.floor((H - 4 - y - 4 - reserve - (RANGS - 1) * ESP) / RANGS)))
    const xg = Math.round((W - (COLS * cw + (COLS - 1) * ESP)) / 2)
    zoneGlissante = null
    // (LES NOMS S'ÉCRIVENT APRÈS TOUTES LES CASES — Keko, 17/11 : couché, « Salamandre » déborde d'un pixel et la case
    // d'à côté le coupait ; écrit par-dessus, il mord sur l'espace entre les cases, sans toucher la voisine)
    const noms: (() => void)[] = []
    RACES.forEach((race, r) => {
      MODELES.filter((mo) => mo.id !== 'cuirasse' && mo.race === race.id).forEach((mo, k) => {
        const col = parColonne ? r : k
        const rang = parColonne ? k : r
        const cx = xg + col * (cw + ESP)
        const cy = y + rang * (ch + ESP)
        const ici = mo.id === choisi.id
        const aSoi = aLeVaisseau(flotte, mo.id)
        const e = etatDuBouton(cx, cy, cw, ch)
        const age = t - choixVaisseauA
        const saute = ici && age < 0.3 ? -Math.round(2 * Math.sin((age / 0.3) * Math.PI)) : 0
        const dy = e.dy + saute
        p.rect(cx - 1, cy - 1 + dy, cw + 2, ch + 2, MATIERES.encre.contour)
        p.rect(cx, cy + dy, cw, ch, MATIERES.creux.corps)
        const hp = ch - 11
        peindreLePortrait(p, mo, cx + 1, cy + 1 + dy, cw - 2, hp, r * 3 + k)
        if (!aSoi) p.rect(cx + 1, cy + 1 + dy, cw - 2, hp, N.hex('#0a0c14'), 0.6)
        // (LE CADRE D'OR DU CHOISI N'ENTOURE QUE SON PORTRAIT — Keko, 17/11 : il passait sur les noms longs, « Salamandre »,
        // « Tesseract », et les noms gardent tous la même taille ; l'éclair du choix en or pâle)
        if (ici) {
          const or = age < 0.1 ? N.hex('#fff2a8') : PEPITE[2 + (Math.floor(t * 4) % 2)]
          p.rect(cx, cy + dy, cw, 1, or)
          p.rect(cx, cy + hp + 1 + dy, cw, 1, or)
          p.rect(cx, cy + dy, 1, hp + 2, or)
          p.rect(cx + cw - 1, cy + dy, 1, hp + 2, or)
        }
        // (LE PILOTÉ : SON NOM EN JAUNE ET UNE PETITE ÉTOILE JAUNE DANS LE COIN — Keko, 17/11, à la place du carré blanc)
        const pilote = mo.id === flotte.actif
        if (pilote) N.sparkle(p, cx + cw - 6, cy + 6 + dy, 3, PEPITE[2], PEPITE[2], 0.8)
        // (plus d'insigne de race dans la case — Keko, 17/11 : la fiche, dessous, porte l'emblème de la race)
        noms.push(() => ecrire(p, mo.nom, cx + cw / 2, cy + hp + 3 + dy, pilote ? PEPITE[2] : ici ? N.hex('#f6ecd2') : aSoi ? COQUE[5] : COQUE[3], { align: 'center' }))
        zone(cx - 1, cy - 1, cw + 2, ch + 2, () => {
          vaisseauChoisi = mo.id
          choixVaisseauA = t
        }, ici ? null : 'clic')
      })
    })
    noms.forEach((ecrireLeNom) => ecrireLeNom())
    const hl = RANGS * (ch + ESP) - ESP
    y += hl + 4
    }
    if (partie === 'liste') {
      if (u0 < 1) p.rect(0, HAUT_BARRE, W, H - HAUT_BARRE, NUIT, 1 - u0)
      zone(0, 0, W, H, () => {}, null)
      return
    }
    if (partie === 'tout') {
      boutonPiloter(y)
      y += HAUT_DU_PILOTER
    }
    const hd = dessinerLaFicheDuVaisseau(p, y, choisi, a, vaisseauxA, true)
    if (partie === 'fiche') boutonPiloter(y + hd + 5)
    if (u0 < 1) p.rect(0, HAUT_BARRE, W, H - HAUT_BARRE, NUIT, 1 - u0)
    zone(0, 0, W, H, () => {}, null)
  }
  function dessinerLesVaisseaux(p: Peintre, voile = true, partie: 'tout' | 'liste' | 'fiche' = 'tout'): void {
    if (vue !== 'hangar' || etape !== 'vaisseau' || equipementOuvert) (vaisseauxOuverts = false), (armesOuvertes = false)
    if (VORTEX && armesOuvertes) return dessinerLesArmesEnListe(p, voile, partie)
    if (!vaisseauxOuverts) return
    if (VORTEX) return dessinerLesVaisseauxEnListe(p, voile, partie)
    const u0 = sortie((t - vaisseauxA) / 0.18)
    const liste = vaisseauxDe(flotte)
    const hc = 40
    const hp = 22 + liste.length * (hc + 4) + 19 + 4
    const x = 6
    const w = W - 12
    const y = Math.max(HAUT_BARRE + 3, Math.round((H - hp) / 2)) + Math.round((1 - u0) * 10)
    if (voile) p.rect(0, 0, W, H, NUIT, 0.72 * u0)
    frame.light.fill(0)
    zones = []
    zoneGlissante = null
    zoneDesCases = null
    plaque(p, x, y, w, hp, 'encre')
    motEnRelief(p, 'Vos vaisseaux', W / 2, y + 7, true)
    liste.forEach((mo, i) => {
      const cy = y + 22 + i * (hc + 4)
      const pilote = mo.id === flotte.actif
      const e = etatDuBouton(x + 4, cy, w - 8, hc)
      plaque(p, x + 4, cy + e.dy, w - 8, hc, pilote ? 'acier' : 'encre', { bord: pilote ? PEPITE[2] : undefined, enfonce: e.enfonce, survole: e.survole && !pilote, flash: e.flash })
      plaque(p, x + 8, cy + 4 + e.dy, 36, hc - 8, 'creux')
      const co = pieceDe(mo.serie.montees.coque)
      if (co !== undefined) dessinerLePictogramme(p, co, x + 26, cy + hc / 2 + e.dy, 36, hc - 8)
      motEnRelief(p, mo.nom, x + 49 + largeurDe(mo.nom, GRAS) / 2, cy + 5 + e.dy, pilote)
      ecrire(p, NOMS_CLASSE[mo.classe], x + 49, cy + 16 + e.dy, COQUE[4])
      const mi = missionDe(flotte, mo.id)
      ecrire(p, mi === null ? 'Missions finies' : mi.finie ? 'Mission à réclamer' : mi.mission.titre, x + 49, cy + 26 + e.dy, mi !== null && mi.finie ? PEPITE[3] : COQUE[5])
      if (pilote) ecrire(p, 'PILOTÉ', x + w - 10, cy + 5, PEPITE[2], { align: 'right', police: GRAS })
      else
        zone(x + 4, cy, w - 8, hc, () => {
          sauver()
          flotte = choisirLeVaisseau(flotte, mo.id)
          livree = livreeDuVaisseau()
          hangar = hangarActif(flotte)
          sauver()
          etapeA = t
          defilCases = 0
          categorieOuverte = null
          vaisseauxOuverts = false
          feterLEquipement()
        }, 'equipe')
    })
    const bf = largeurDe('Fermer', GRAS) + 22
    bouton(p, Math.round(W / 2 - bf / 2), y + 22 + liste.length * (hc + 4), bf, 15, 'Fermer', true, () => (vaisseauxOuverts = false), 'retour', 'acier')
    zone(x, y, w, hp, () => {}, null)
    zone(0, 0, W, H, () => (vaisseauxOuverts = false), 'retour')
  }
  /** Ce que la dernière destruction a coûté : les pièces perdues, dites au hangar une dizaine de secondes (depuis qu'on le voit). */
  let pertes: { noms: string[]; t0: number | null } | null = null
  function dessinerLesPertes(p: Peintre, y: number): number {
    // (LE MESSAGE EST RETIRÉ — Keko, 14/11 : « quand on perd une partie, n'affiche pas en rouge un message pour dire ce
    // qu'on a perdu » ; les pièces sont perdues quand même, le hangar le montre par ses places vides. `&pertes` le rend.)
    if (!parametres.has('pertes')) pertes = null
    if (pertes === null) return y
    if (pertes.t0 === null) pertes.t0 = t
    const age = t - pertes.t0
    if (age > 10) {
      pertes = null
      return y
    }
    // (une pièce perdue deux fois se dit « ×2 »)
    const comptes = new Map<string, number>()
    for (const n of pertes.noms) comptes.set(n, (comptes.get(n) ?? 0) + 1)
    const lignes = replier(`Perdu avec le vaisseau : ${[...comptes].map(([n, k]) => (k > 1 ? `${n} ×${k}` : n)).join(', ')}.`, W - 20)
    const h = lignes.length * 9 + 7
    plaque(p, 4, y, W - 8, h, 'encre', { bord: ROUGE[4], flash: age < 0.08 })
    lignes.forEach((li, k) => ecrire(p, li, W / 2, y + 4 + k * 9, ROUGE[5], { align: 'center' }))
    return y + h + 3
  }
  /**
   * LE HANGAR NE MONTRE PLUS LES PIÈCES D'EMBLÉE (Keko, 14/11 : « on ne va pas afficher les pièces directement dans le
   * hangar : le nom du vaisseau et un bouton changer ; dessous, un résumé de l'équipement, une vision d'ensemble ; et
   * pour ouvrir le panneau des pièces, on clique sur un bouton Équipement ») : le nom, LE RÉSUMÉ — le châssis, la
   * propulsion, puis les places d'outil et d'arme en pastilles (pleine : une pièce y est montée ; les lourdes en
   * orange) —, le bouton « Équipement », et DÉCOLLER. `equipementOuvert` : les cases des pièces sont à l'écran.
   */
  let equipementOuvert = false
  function dessinerLApercu(p: Peintre, y0: number): void {
    let y = dessinerLesPertes(p, dessinerLeChoixDuVaisseau(p, y0))
    // (LE HANGAR DU JEU DU VORTEX : on y choisit son vaisseau, et sa couleur par la pastille à gauche du nom ; rien sur les pièces)
    if (VORTEX) {
      // SOUS LE NOM : « COULEUR » ET « CHANGER » (Keko, 15/11 : « on reprend le système d'avant, un bouton couleur et un
      // bouton changer, en dessous du nom ; couleur ouvre le panneau des couleurs, changer un panneau comme pour les
      // pièces, sauf que ce sont des vaisseaux »)
      // (LA FICHE DU VAISSEAU PILOTÉ SOUS SON NOM — Keko, 15/11 : « afficher le panneau de statistiques du chasseur sous le nom »)
      // (sans son nom, déjà sur la plaque ; « Changer » est remonté sur la plaque, à droite : sous la fiche, il passait
      // sous « Décoller »)
      y += dessinerLaFicheDuVaisseau(p, y, modeleDeVaisseau(flotte.actif), true, etapeA, false, false) + 4
      // SON ARME DE BASE, dessous (Keko, 15/11 : « un canon sur chaque aile ; pas d'image : juste le nom, canon, et les
      // statistiques ») : les jauges du canon au catalogue, sans le poids
      // (UNE LIGNE : « Arme », le nom de l'arme, et « Changer » — Keko, 15/11 : ni « un sur chaque aile », ni les chiffres)
      const nomArme = pieceDe(armeDuVortex())?.nom ?? ''
      const ha = 20
      plaque(p, 4, y, W - 8, ha, 'encre')
      // (le nom seul, sans « Arme » devant — Keko, 15/11)
      motEnRelief(p, nomArme, 10 + largeurDe(nomArme, GRAS) / 2, y + 6, true)
      const bwa = largeurDe('Changer', GRAS) + 16
      const bxa = W - 7 - bwa
      boutonBase(p, bxa, y + 2, bwa, 16, true, () => ((armesOuvertes = true), (vaisseauxA = t), (armeChoisie = armeDuVortex()), (surligneVaisseau = -1)), (dx, dy) => ecrire(p, 'Changer', bxa + bwa / 2 + dx, y + 2 + dy + 4, COQUE[5], { align: 'center' }), 'ouvre', { matiere: 'acier' })
      // (UN BOUTON SECONDAIRE — Keko, 15/11 : « pas le même graphisme que changer de vaisseau, un peu moins visible » :
      // l'acier sombre, la lettre courante en gris clair, au lieu de l'acier clair et du gras)
      return
    }
    const lignes: { nom: string; valeur?: string; places?: { pleine: boolean; lourde: boolean }[] }[] = [
      { nom: 'Châssis', valeur: monteeA(hangar, 'coque').nom },
      { nom: 'Propulsion', valeur: monteeA(hangar, 'propulseur').nom },
      { nom: 'Outils', places: Array.from({ length: capacite(hangar, 'outil') }, (_, k) => ({ pleine: pieceDe(hangar.outils[k] ?? '') !== undefined, lourde: false })) },
      { nom: 'Armes', places: Array.from({ length: capacite(hangar, 'arme') }, (_, k) => ({ pleine: pieceDe(hangar.armes[k] ?? '') !== undefined, lourde: placeLourde(hangar, k) })) },
      { nom: 'Poids total', valeur: `${poidsTotal(hangar)} T` },
    ]
    const h = lignes.length * 11 + 6
    plaque(p, 4, y, W - 8, h, 'encre')
    lignes.forEach((l, i) => {
      const yl = y + 5 + i * 11
      ecrire(p, l.nom, 10, yl, COQUE[4])
      if (l.valeur !== undefined) ecrire(p, l.valeur, W - 10, yl, COQUE[6], { align: 'right' })
      if (l.places !== undefined) {
        if (l.places.length === 0) ecrire(p, 'Aucune place', W - 10, yl, COQUE[3], { align: 'right' })
        l.places.forEach((pl, k) => {
          const px = W - 10 - (l.places!.length - k) * 9 + 2
          // (UNE PLACE LOURDE EST ORANGE, plus cerclée de rouge — Keko, 14/11 ; vide, un orange sourd la dit encore)
          p.rect(px, yl, 7, 7, MATIERES.encre.contour)
          p.rect(px + 1, yl + 1, 5, 5, pl.pleine ? (pl.lourde ? N.hex('#f07a1c') : PEPITE[2]) : pl.lourde ? N.hex('#4a2a12') : MATIERES.creux.corps)
          if (pl.pleine) p.rect(px + 1, yl + 1, 5, 1, pl.lourde ? N.hex('#ffb066') : N.hex('#fff2a8'))
        })
      }
      if (i > 0) p.rect(10, yl - 3, W - 20, 1, MATIERES.encre.ombre)
    })
    y += h + 4
    // « COULEUR » À CÔTÉ D'« ÉQUIPEMENT » (Keko, 14/11 : « la couleur va concerner la totalité de l'appareil » — son
    // bouton était sur la page du châssis) : il porte la pastille de la couleur choisie et ouvre la grille des couleurs
    const bw = largeurDe('Équipement', GRAS) + 24
    // (« STYLE », plus « Couleur » — Keko, 14/11)
    const bc = 5 + 9 + 5 + largeurDe('Style', GRAS) + 7
    const bx = Math.round((W - bc - 4 - bw) / 2)
    boutonBase(p, bx, y, bc, 17, true, () => ((couleursOuvertes = true), (couleursA = t)), (dx, dy) => {
      const [sombre, moyen, clair] = tonsDeLaLivree(livree)
      p.rect(bx + 5 + dx, y + 4 + dy, 9, 9, MATIERES.encre.contour)
      if (livree === 'serie') {
        // (le style de base : gris, barré de rouge, comme dans le panneau)
        p.rect(bx + 6 + dx, y + 5 + dy, 7, 7, N.hex('#6b7280'))
        for (let k = 1; k < 6; k++) {
          p.rect(bx + 6 + k + dx, y + 5 + k + dy, 1, 1, N.hex('#e02a2a'))
          p.rect(bx + 12 - k + dx, y + 5 + k + dy, 1, 1, N.hex('#e02a2a'))
        }
      } else {
        p.rect(bx + 6 + dx, y + 5 + dy, 7, 7, moyen)
        p.rect(bx + 6 + dx, y + 5 + dy, 7, 2, clair)
        p.rect(bx + 6 + dx, y + 10 + dy, 7, 2, sombre)
      }
      ecrire(p, 'Style', bx + 19 + dx, y + 5 + dy, COQUE[6], { police: GRAS })
    }, 'ouvre', { matiere: 'acier' })
    bouton(p, bx + bc + 4, y, bw, 17, 'Équipement', true, () => ((equipementOuvert = true), (categorieOuverte = null), (etapeA = t), (defilCases = 0)), 'ouvre', 'acier')
  }
  function dessinerLesEmplacements(p: Peintre, y: number): number {
    if (vue === 'hangar') {
      // (les cases des pièces : on y vient par « Équipement », on en repart par la flèche)
      if (categorieOuverte !== null) enTete(p, y, nomDuCalibre(categorieOuverte.o, categorieOuverte.lourde), () => ((categorieOuverte = null), (etapeA = t), (defilCases = 0)))
      else enTete(p, y, 'Équipement', () => ((equipementOuvert = false), (etapeA = t)))
      y += HT + 3
    }
    const cw = Math.floor((W - 12) / 2)
    const ch = 36
    const cases = casesDuVaisseau()
    const bas = H - HAUT_NAV - 4
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
      // (une CATÉGORIE de places — l'armement, les outils : la première pièce montée pour le dessin, et son compte)
      const groupe = vue === 'hangar' && (o === 'arme' || o === 'outil') && c.k < 0
      const duGroupe = groupe ? placesDuCalibre(o as 'arme' | 'outil', c.lourde ?? false) : []
      const prises = duGroupe.map((k) => listeMontee(o)[k] ?? '').filter((id) => pieceDe(id) !== undefined)
      if (groupe) montee = pieceDe(prises[0] ?? '')
      else if (vue === 'hangar') montee = o === 'propulseur' || o === 'coque' ? monteeA(hangar, o) : pieceDe(listeMontee(o)[c.k] ?? '')
      else montee = piecesIci(o).find((pc) => !possede(hangar, pc.id))
      const e = etatDuBouton(x, yy, cw, ch)
      const monte = Math.round((1 - sortie(age / 0.2)) * 4) - (e.survole && !e.enfonce ? 1 : 0)
      const y2 = yy + e.dy + monte
      if (!e.enfonce) ombrePortee(p, x, yy + Math.max(0, monte), cw, ch)
      plaque(p, x, y2, cw, ch, 'encre', { enfonce: e.enfonce, survole: e.survole, flash: e.flash || age < 0.07 })
      // (LE TITRE DE LA PLACE COIFFE LA CASE, plus fort que le nom de la pièce — Keko, 12/11 : « bizarre que le titre des
      // différentes pièces soit plus petit que le nom de la pièce qui est en dessous » ; il était en petites capitales
      // au-dessus du nom : il est en gras d'or, en relief, sur toute la largeur de la case ; dessous, le puits et le nom)
      const titre = titreDe(c)
      // (UN TITRE TROP LONG POUR LA CASE passe dans la lettre courante — Keko, 14/11 : « armes lourdes et armes légères
      // sont presque en train de déborder du rectangle »)
      // (… PUIS TOUS LES TITRES DE CASE DANS CETTE LETTRE : « des éléments en gras et d'autres non, c'est moche »)
      const policeDuTitre = TEXTE
      motEnRelief(p, titre, x + 5 + largeurDe(titre, policeDuTitre) / 2, y2 + 3, true, policeDuTitre)
      const yp = y2 + 12
      const hp = ch - 15
      // (LE PUITS RÉTRÉCI, 20 au lieu de 26 : « le nom des pièces dépasse de leur rectangle » — Keko, 14/11 ;
      // « Mitrailleuse », d'un seul mot, ne se replie pas : il lui fallait six pixels de plus)
      plaque(p, x + 4, yp, 20, hp, 'creux')
      const vide = vue === 'hangar' && montee === undefined
      if (vide) {
        const c2 = Math.sin(t * 3 + i) > 0 ? COQUE[3] : COQUE[2]
        p.rect(x + 13, yp + hp / 2 - 4, 2, 8, c2)
        p.rect(x + 10, yp + hp / 2 - 1, 8, 2, c2)
      } else if (montee !== undefined) dessinerLePictogramme(p, montee, x + 14, yp + hp / 2, 20, hp)
      const ligne = groupe ? `${prises.length} / ${duGroupe.length}` : vide ? 'Vide' : montee!.nom
      const L = replier(ligne, cw - 31).slice(0, 2)
      L.forEach((li, k) => ecrire(p, li, x + 28, yp + (L.length === 1 ? 7 : 2) + k * 9, vue === 'labo' || vide ? COQUE[3] : COQUE[6]))
      zone(x, yy, cw, ch, () => {
        if (!groupe) return ouvrirLEmplacement(o, c.k)
        categorieOuverte = { o: o as 'arme' | 'outil', lourde: c.lourde ?? false }
        etapeA = t
        defilCases = 0
      })
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
      if (vue === 'hangar' && !equipementOuvert) {
        dessinerLApercu(p, y)
        dessinerDecoller(p)
      } else dessinerLesEmplacements(p, y)
    } else if (vue === 'hangar' && !changement) {
      // (le panneau refermé — la flèche, « Équiper », « Retirer » : on revient aux cases, sans passer par la page de la place)
      changerDEtape('vaisseau')
      dessinerLesEmplacements(p, y)
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
    }, sonDuDecollage(), { reflet: cycle < 0.3 ? bx - 14 + ((bw + 40) * cycle) / 0.3 : refletDeSurvol(bx, bw, survol !== null && survol.x >= bx && survol.x < bx + bw && survol.y >= by && survol.y < by + bh) })
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
    if (vue !== 'hangar' || etape !== 'vaisseau' || equipementOuvert) couleursOuvertes = false
    if (!couleursOuvertes) return
    if (VORTEX) {
      dessinerLesPeaux(p)
      return
    }
    const u0 = sortie((t - couleursA) / 0.18)
    const LISTE = livreesPossibles()
    const COLONNES = Math.min(5, LISTE.length)
    const cote = 26
    const pas = cote + 4
    const rangs = Math.ceil(LISTE.length / COLONNES)
    // (COUCHÉ, PAS D'APERÇU — Keko, 16/11 : « en mode paysage, je ne peux plus cliquer sur Fermer, le bouton a disparu » :
    // douze couleurs sur trois rangées, le panneau faisait 187 de haut sur un écran de 180 ; le vaisseau reste visible
    // dans la scène, à gauche, et prend la couleur sur-le-champ)
    const apercu = H >= 260
    const yGrille = apercu ? 78 : 34
    const hp = yGrille + rangs * pas + 15 + 4
    const x = 6
    const w = W - 12
    const y = Math.max(HAUT_BARRE + 3, Math.round((H - hp) / 2)) + Math.round((1 - u0) * 10)
    p.rect(0, 0, W, H, NUIT, 0.72 * u0)
    frame.light.fill(0)
    zones = []
    zoneGlissante = null
    plaque(p, x, y, w, hp, 'encre')
    motEnRelief(p, VORTEX ? 'Couleur' : 'Style', W / 2, y + 7, true)
    // le châssis monté, dans la couleur choisie
    if (apercu) {
      plaque(p, W / 2 - 24, y + 20, 48, 40, 'creux')
      const monte = monteeA(hangar, 'coque')
      if (monte !== undefined) dessinerLePictogramme(p, monte, W / 2, y + 40, 48, 40)
    }
    ecrire(p, LIVREES.find((l) => l.id === livree)?.nom ?? '', W / 2, y + yGrille - 14, N.hex('#fff3cf'), { align: 'center', police: GRAS })
    const x0 = Math.round((W - COLONNES * pas + 4) / 2)
    LISTE.forEach((l, i) => {
      const cx = x0 + (i % COLONNES) * pas
      const cy = y + yGrille + Math.floor(i / COLONNES) * pas
      const choisie = l.id === livree
      const [sombre, moyen, clair] = tonsDeLaLivree(l.id)
      const e = etatDuBouton(cx, cy, cote, cote)
      p.rect(cx - 1, cy - 1 + e.dy, cote + 2, cote + 2, choisie ? PEPITE[3] : MATIERES.encre.contour)
      p.rect(cx, cy + e.dy, cote, cote, MATIERES.encre.contour)
      if (l.id === 'serie') {
        // LE STYLE DE BASE : un rectangle GRIS barré d'une CROIX ROUGE (Keko, 14/11 : « pour signifier que c'est le
        // standard, sans couleur ajoutée »)
        p.rect(cx + 1, cy + 1 + e.dy, cote - 2, cote - 2, N.hex('#6b7280'))
        p.rect(cx + 1, cy + 1 + e.dy, cote - 2, 2, N.hex('#8b93a1'))
        for (let k = 4; k < cote - 4; k++) {
          p.rect(cx + k - 1, cy + k + e.dy, 3, 2, N.hex('#e02a2a'))
          p.rect(cx + cote - 2 - k, cy + k + e.dy, 3, 2, N.hex('#e02a2a'))
        }
      } else {
        p.rect(cx + 1, cy + 1 + e.dy, cote - 2, cote - 2, moyen)
        p.rect(cx + 1, cy + 1 + e.dy, cote - 2, 5, clair)
        p.rect(cx + 1, cy + cote - 8 + e.dy, cote - 2, 7, sombre)
      }
      if (choisie) N.sparkle(p, cx + cote - 5, cy + 5, 2 + Math.round(1.5 + 1.5 * Math.sin(t * 5)), N.WHITE, PEPITE[3], 0.8)
      else zone(cx - 2, cy - 2, pas, pas, () => {
        livree = l.id
        sauverLivree(porteurDeLaLivree(), l.id)
      }, 'equipe')
    })
    const bf = largeurDe('Fermer', GRAS) + 22
    bouton(p, Math.round(W / 2 - bf / 2), y + yGrille + rangs * pas, bf, 15, 'Fermer', true, () => (couleursOuvertes = false), 'retour', 'acier')
    zone(x, y, w, hp, () => {}, null)
    zone(0, 0, W, H, () => (couleursOuvertes = false), 'retour')
  }

  /**
   * LES TROIS APPARENCES DU VAISSEAU (Keko, 17/11 : « pour chaque vaisseau, trois couleurs différentes qui vont vraiment
   * changer le vaisseau profondément ») : trois cartes côte à côte, le châssis peint dans chacune — on voit ce qu'on
   * choisit —, son nom dessous ; la choisie cerclée d'or ; une tape la prend, au hangar comme en vol. « Fermer », ou une
   * tape hors du panneau.
   */
  function dessinerLesPeaux(p: Peintre): void {
    const u0 = sortie((t - couleursA) / 0.18)
    const LISTE = peauxDe(flotte.actif)
    const cran = monteeA(hangar, 'coque').cran
    const cw = Math.min(56, Math.floor((W - 24 - (LISTE.length - 1) * 4) / LISTE.length))
    const ch = Math.min(52, Math.max(34, H - 112))
    const hp = 22 + ch + 14 + 21
    const w = LISTE.length * cw + (LISTE.length - 1) * 4 + 12
    const x = Math.round((W - w) / 2)
    const y = Math.max(HAUT_BARRE + 3, Math.round((H - hp) / 2)) + Math.round((1 - u0) * 10)
    p.rect(0, 0, W, H, NUIT, 0.72 * u0)
    frame.light.fill(0)
    zones = []
    zoneGlissante = null
    plaque(p, x, y, w, hp, 'encre')
    motEnRelief(p, 'Apparence', W / 2, y + 7, true)
    LISTE.forEach((pe, i) => {
      const cx = x + 6 + i * (cw + 4)
      const cy = y + 22
      const choisie = pe.id === peauCourante().id
      const e = etatDuBouton(cx, cy, cw, ch + 12)
      p.rect(cx - 1, cy - 1 + e.dy, cw + 2, ch + 2, choisie ? PEPITE[3] : MATIERES.encre.contour)
      plaque(p, cx, cy + e.dy, cw, ch, 'creux')
      peindreDansUneCase(p, formesDuChassis(cran, pe.habit(cran)), cx + cw / 2, cy + ch / 2 + e.dy, cw - 6, ch - 6, { rampes: rampesDeLaPeau(pe) })
      ecrire(p, pe.nom, cx + cw / 2, cy + ch + 3 + e.dy, choisie ? N.hex('#fff3cf') : COQUE[4], { align: 'center', police: choisie ? GRAS : TEXTE })
      // (plus d'étoile dans le coin de la choisie — Keko, 17/11 : « le rectangle de sélection est toujours le vaisseau choisi »)
      if (!choisie) zone(cx - 2, cy - 2, cw + 4, ch + 16, () => choisirLaPeau(pe.id), 'equipe')
    })
    const bf = largeurDe('Fermer', GRAS) + 22
    bouton(p, Math.round(W / 2 - bf / 2), y + 22 + ch + 14 + 2, bf, 15, 'Fermer', true, () => (couleursOuvertes = false), 'retour', 'acier')
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
      const liste = listeVisible(onglet).filter((pc) => possede(hangar, pc.id) || pieceOuverteIci(pc.id))
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
    const liste = listeVisible(onglet).filter((pc) => possede(hangar, pc.id) || pieceOuverteIci(pc.id))
    // (PAS DE CATÉGORIE VIDE — Keko, 13/11 : « au début on n'a que le minage : on n'affiche que minage ; quand on
    // débloquera un autre outil, on affichera tous, minage et la catégorie de l'autre outil » : seules les familles qui
    // ont une pièce à montrer ont leur puce ; « Tout » ne vient qu'à partir de deux)
    const familles = famillesDe(onglet).filter((f) => piecesIci(onglet).some((pc) => sousDe(pc) === f && (possede(hangar, pc.id) || pieceOuverteIci(pc.id))))
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
      // (UNE PIÈCE DONT ON N'A AUCUN EXEMPLAIRE EST GRISÉE — Keko, 14/11 : débloquée, mais à construire avant de l'équiper)
      const aucune = !possede(hangar, pc.id)
      ecrire(p, pc.nom, 14 + (choisie ? 1 : 0), ly + 3, aucune ? (choisie ? COQUE[4] : COQUE[3]) : choisie ? N.hex('#f6ecd2') : montee ? COQUE[6] : COQUE[5])
      // (… ET SON TEXTE EST À PEINE BEIGE, plus blanc — Keko, 14/11, à l'essai ; son nombre, un beige plus sourd)
      // (LA LIGNE CHOISIE N'EST PLUS EN GRAS — Keko, 14/11, à l'essai : le surlignage et le blanc la disent)
      // (LE NOMBRE D'EXEMPLAIRES CONSTRUITS, après le nom, DANS LE MÊME STYLE QUE LUI — Keko, 14/11 : il était en gras et en
      // or même sur une ligne non choisie ; et il n'est QUE sur cette ligne : ni sur la page de la place, ni sur le dessin
      // de la pièce ; rien pour une pièce de base)
      // (ENTRE PARENTHÈSES, un ton sous le nom — Keko, 14/11 : « plutôt que x1, x2, mets le nombre entre parenthèses et
      // change légèrement sa couleur par rapport au texte »)
      // (CE QUI RESTE LIBRE SUR CE QU'ON A, dès qu'un exemplaire est monté quelque part — Keko, 14/11 : « un moyen de voir
      // que tu possèdes une pièce mais qu'elle est déjà attribuée à un autre emplacement » : « (1/2) », un libre sur deux)
      const total = exemplaires(hangar, pc.id)
      const restants = Math.max(0, libres(hangar, pc.id))
      if (total > 0) ecrire(p, restants < total ? `(${restants}/${total})` : `(${total})`, 14 + (choisie ? 1 : 0) + largeurDe(pc.nom) + 5, ly + 3, choisie ? N.hex('#b9ad8e') : COQUE[4])
      const xd = W - (maxDefil > 0 ? 16 : 10)
      const ki = placeOuverte()
      // (« EQUIPE » ou rien, comme les autres parties — Keko : les places où la pièce est montée ailleurs ne se disent
      // plus ; pour une arme ou un outil, « EQUIPE » veut dire à LA PLACE OUVERTE, la même pièce pouvant se monter à plusieurs)
      if (ki >= 0 ? listeMontee(onglet)[ki] === pc.id : montee) p.text('EQUIPE', xd, ly + 4, PEPITE[2], { align: 'right' })
      // (… ET « AILLEURS », en bleu, quand tous ses exemplaires sont montés à d'autres places : on l'a, mais plus de libre)
      else if (total > 0 && restants === 0) p.text('AILLEURS', xd, ly + 4, N.hex('#7fa8d8'), { align: 'right' })
      // (PLUS DE PRIX SUR LA LIGNE — Keko, 14/11 : il ne disait que les crédits ; le prix entier est sur « Construire »)
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
    if (n.sorte === 'vaisseau') {
      // UN VAISSEAU (les pièces, avant le 14/11) : une plaque carrée, un puits où son châssis est rendu
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
      const pc = n.vaisseau === undefined ? undefined : pieceDe(modeleDeVaisseau(n.vaisseau).serie.montees.coque)
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
    } else if (etat === 'acquis') {
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
        if (n.sorte === 'vaisseau') p.rect(x - 13, yy - 13, 26, 26, N.WHITE, 1 - ud / 0.3)
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
      // (RIEN AU-DESSUS DU PREMIER RANG — Keko, 14/11 : « pas de chemin entre le haut de l'écran et le premier nœud : le
      // chemin commence au premier nœud » ; la source qui descendait du bord est retirée, avec son bus)
      if (k === 0) return
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
    const navire = n.sorte === 'vaisseau' ? n.vaisseau : undefined
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
          const tx = xc + trembleDe(pu.k)
          ecrire(p, pu.nombre, tx, yl, a ? RUNE[3] : ROUGE[5], { police: GRAS })
          dessinerUneRessource(p, tx + wn + 7, yl + 4, pu.k)
          ecrire(p, pu.nom, tx + wn + 14, yl, a ? RUNE[2] : ROUGE[4])
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
        // (un vaisseau : il rejoint la flotte et attend au hangar, dont l'onglet saute et prend sa pastille)
        if (navire !== undefined) {
          flotte = ajouterLeVaisseau(avecLeHangar(flotte, hangar), navire)
          sauver()
          pulsations.hangar = t
          nouveautes.add('hangar')
        }
      }, 'achat', 'or', MINERAIS.filter((k) => tresor[k] < cout[k]))
    } else {
      const mot = navire !== undefined ? 'Acquis : il vous attend au hangar' : n.sorte === 'passif' ? 'Acquis : actif sur tous vos vaisseaux' : n.mecanique === 'postcombustion' ? 'Acquis : disponible en vol' : 'Acquis : visible au commerce'
      ecrire(p, mot, W / 2, ya + 8, RUNE[2], { align: 'center' })
    }
  }

  /** ACHETER une pièce débloquée au labo (au hangar, à la place d'« Équiper ») : le bouton, son prix et l'icône des crédits. */
  function dessinerLAchat(p: Peintre, y: number, pc: Piece): void {
    // CONSTRUIRE (« Acheter », avant le 14/11 : on construit un EXEMPLAIRE, autant qu'on veut) : UN SEUL BOUTON QUI PORTE TOUT SON PRIX (Keko, 14/11 : « le bouton acheter englobe les crédits mais pas
    // les minerais, c'est dommage » — le coût en minerai pendait sous lui). Le mot en haut ; dessous, UN PUITS SOMBRE
    // (« le texte blanc sur fond jaune n'est pas idéal ») où se suivent les crédits puis chaque minerai : crème quand on
    // l'a, ROUGE quand il manque (« ce qu'on a / ce qu'il faut »). Sans coût en minerai, il tient sur une rangée, le
    // puits à droite du mot. REFUSÉ, CE SONT LES PRIX QUI MANQUENT QUI TREMBLENT, pas le bouton ni le compteur du haut
    // quand on a les crédits. Acheté, la pièce s'envole vers l'onglet du hangar, qui prend une pastille.
    const vif = peutAcheter(hangar, credits, pc.id, tresor)
    const cout = coutEnMinerai(pc.id)
    const lots: { cle: string; texte: string; manque: boolean; k?: Minerai }[] = [
      { cle: 'credits', texte: String(pc.prix), manque: credits < pc.prix },
      ...MINERAIS.filter((k) => cout[k] > 0).map((k) => ({ cle: k as string, texte: tresor[k] < cout[k] ? `${montantCourt(tresor[k])}/${montantCourt(cout[k])}` : montantCourt(cout[k]), manque: tresor[k] < cout[k], k })),
    ]
    const ECART = 7
    const ws = lots.map((l) => largeurDe(l.texte, GRAS) + 11)
    const wp = 4 + ws.reduce((a, b) => a + b, 0) + (lots.length - 1) * ECART + 3
    const wa = largeurDe('Construire', GRAS)
    const deux = lots.length > 1
    const bw = deux ? Math.max(wa + 20, wp + 6) : 8 + wa + 5 + wp + 3
    const bh = deux ? 27 : 15
    const bx = Math.round(W / 2 - bw / 2)
    boutonBase(p, bx, y, bw, bh, vif, () => {
      const r = acheter(hangar, credits, pc.id, tresor)
      if (r === null) return
      hangar = r.hangar
      credits = r.credits
      tresor = r.tresor
      sauver()
      secouer(1.2)
      gerbe(W / 2, y + 7, 24, [PEPITE[2], PEPITE[3], RUNE[3], N.WHITE], 80)
      if (vue !== 'hangar') envolsDePiece.push({ pc, x0: W / 2, y0: y + 40, t0: t + 0.1 }) // (au hangar, elle y est déjà)
      flottants.push({ texte: 'Construit !', x: W / 2, y: y - 14, t0: t, c: PEPITE[3] })
      choixA = t - 1
    }, (_dx, dy) => {
      const xm = deux ? Math.round(W / 2 - wa / 2) : bx + 8
      // (sur le métal clair, le mot est SOMBRE)
      ecrire(p, 'Construire', xm, y + 4 + dy, vif ? N.hex('#14161f') : COQUE[3], { police: GRAS })
      const px = deux ? Math.round(W / 2 - wp / 2) : bx + 8 + wa + 5
      const py = y + (deux ? 14 : 2) + dy
      plaque(p, px, py, wp, 11, 'creux')
      let xl = px + 4
      lots.forEach((l, i) => {
        const tx = xl + trembleDe(l.cle)
        ecrire(p, l.texte, tx, py + 2, l.manque ? ROUGE[5] : N.hex('#fff2c8'), { police: GRAS })
        if (l.k === undefined) dessinerUnCredit(p, tx + ws[i] - 4, py + 5)
        else dessinerUneRessource(p, tx + ws[i] - 5, py + 5, l.k)
        xl += ws[i] + ECART
      })
    }, 'achat', { manque: lots.filter((l) => l.manque).map((l) => l.cle), fixe: true, matiere: 'metal', reflet: vif && (t % 2.6) / 2.6 < 0.3 ? bx - 14 + ((bw + 40) * ((t % 2.6) / 2.6)) / 0.3 : undefined })
  }
  /** Ce que le bouton « Acheter » prend EN PLUS quand la pièce coûte aussi du minerai (sa seconde rangée) — rien, si elle est déjà à soi ou ne coûte que des crédits. */
  const ligneDuCout = (pc: Piece): number => (!estDeBase(hangar, pc.id) && MINERAIS.some((k) => coutEnMinerai(pc.id)[k] > 0) ? 12 : 0)
  /**
   * LES BOUTONS D'UNE FICHE, dans le panneau « Changer » : d'abord ce qu'on fait de la pièce À CETTE PLACE (« Équiper »
   * s'il reste un exemplaire, « Retirer » ou « Équipé » si elle y est), puis « CONSTRUIRE » un exemplaire de plus — pour
   * tout ce qui n'est pas de base. `premiere` : la première rangée existe (sinon « Construire » prend sa place).
   */
  function boutonsDeLaFiche(pc: Piece): { ici: boolean; premiere: boolean; construire: boolean } {
    const ko = placeOuverte()
    const ici = ko >= 0 ? listeMontee(onglet)[ko] === pc.id : estMontee(hangar, pc.id)
    const premiere = ici || libres(hangar, pc.id) > 0
    // (ce qu'on n'a pas, que les missions n'ont pas ouvert et qui n'est pas de base ne se construit pas — une pièce d'essai)
    const construire = !estDeBase(hangar, pc.id) && (possede(hangar, pc.id) || pieceOuverteIci(pc.id))
    return { ici, premiere, construire }
  }

  /** La hauteur que prendra la fiche d'une pièce (son bouton, sa plaque, sa note) : la liste s'y ajuste. */
  function hauteurDeLaFiche(pc: Piece | undefined): number {
    if (pc === undefined) return 0
    const note = pc.note === undefined ? 0 : replier(pc.note, W - 22).length
    const bo = boutonsDeLaFiche(pc)
    return 19 + (bo.construire ? ligneDuCout(pc) + (bo.premiere ? 19 : 0) : 0) + Math.max(52, 18 + jaugesDe(pc).length * 10 + 4) + (note > 0 ? note * 9 + 6 : 0)
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
      const aChanger = onglet === 'outil' || onglet === 'arme' || piecesIci(onglet).some((x) => x.id !== pc.id && (possede(hangar, x.id) || pieceOuverteIci(x.id)))
      if (aChanger) {
        const bw = lb('Changer')
        bouton(p, W / 2 - bw / 2, y, bw, 15, 'Changer', true, ouvrirLeChangement, 'ouvre')
      }
      // LA COULEUR DU CHÂSSIS : son bouton est ICI, sur la page du châssis, à gauche de « Changer » (Keko, 12/11 : dans le
      // panneau, il se superposait à « Acheter », plus large qu'« Équiper ») ; il porte la pastille de la couleur choisie
      // et ouvre la grille des couleurs
      // (LA COULEUR N'EST PLUS ICI : elle est sur la vue d'ensemble du hangar, à côté d'« Équipement » — Keko, 14/11)
      if (!aChanger) y -= 19
    } else {
      const bo = boutonsDeLaFiche(pc)
      if (bo.ici) {
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
      } else if (bo.premiere) {
        const bw = lb('Équiper')
        bouton(p, W / 2 - bw / 2, y, bw, 15, 'Équiper', ko >= 0 || peutMonter(hangar, pc.id), () => {
          hangar = ko >= 0 ? monterA(hangar, pc.id, ko) : monter(hangar, pc.id)
          sauver()
          changement = false
          feterLEquipement()
        }, 'equipe')
      }
      // (CONSTRUIRE un exemplaire — le premier, ou un de plus : sous le premier bouton, ou à sa place s'il n'y en a pas)
      if (bo.construire) {
        if (bo.premiere) y += 19
        dessinerLAchat(p, y, pc)
        y += ligneDuCout(pc)
      }
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
  function dessinerUneJaugeDePiece(p: Peintre, y: number, j: Jauge, repere: number | null, rouge: boolean, x0 = 10, plein = 1, colonne = colonneDesJauges()): void {
    ecrire(p, j.nom, x0, y - 1, COQUE[4])
    const bx = x0 + colonne
    const bw = W - 12 - bx
    // (les plaques des humains, en acier gris, comme leur barre en vol)
    const acier = j.nom === 'Plaques'
    const vert = j.nom === 'Vie' || j.nom === 'Régénération'
    const violet = j.nom === 'Purge'
    const teinte = j.nom === 'Bouclier' ? VERRIERE[2] : acier ? ACIER_DES_PLAQUES[1] : vert ? VERT_DE_LA_VIE[1] : violet ? CORRUPTION[2] : rouge ? ROUGE[3] : PEPITE[2]
    const clair = j.nom === 'Bouclier' ? VERRIERE[3] : acier ? ACIER_DES_PLAQUES[0] : vert ? VERT_DE_LA_VIE[0] : violet ? CORRUPTION[1] : rouge ? ROUGE[5] : N.hex('#ffe68a')
    const sombre = j.nom === 'Bouclier' ? VERRIERE[1] : acier ? ACIER_DES_PLAQUES[2] : vert ? VERT_DE_LA_VIE[2] : violet ? CORRUPTION[3] : rouge ? ROUGE[2] : N.hex('#a8650f')
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
  const piedDeLaMission = (mo: { ouvre?: string; piece?: unknown }, fini: boolean): { jauge: number; lots: number } => ({ jauge: fini ? 15 : 9, lots: mo.ouvre === undefined && mo.piece === undefined ? 11 : 15 })
  function hauteurDeLaMission(mo: { titre: string; dit: string; ouvre?: string; piece?: unknown; etapes?: unknown[] }, fini: boolean): number {
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
  /** L'onglet « Vaisseaux » des missions est ouvert (sinon : les contrats). */
  let missionsDeVaisseau = false
  /** Une carte de mission : un contrat, ou la mission d'un vaisseau (sa récompense est UNE PIÈCE ouverte à l'achat sur lui). */
  type CarteDeMission = { q: Quete; mo: (Modele & { piece?: Piece; navire?: string }) | undefined }
  const missionFinie = (q: Quete, mo: Modele | undefined): boolean => mo !== undefined && q.progres >= mo.cible
  const cartesDesVaisseaux = (): CarteDeMission[] =>
    vaisseauxDe(flotte).flatMap((nav): CarteDeMission[] => {
      const mi = missionDe(flotte, nav.id)
      if (mi === null) return []
      const dit = nav.id === flotte.actif ? mi.mission.dit : `${mi.mission.dit} Pilotez ce vaisseau pour avancer.`
      return [{ q: { modele: `nav-${nav.id}`, progres: mi.progres }, mo: { id: `nav-${nav.id}`, titre: `${nav.nom} : ${mi.mission.titre}`, dit, compteur: mi.mission.compteur, cible: mi.mission.cible, credits: 0, piece: pieceDe(mi.mission.ouvre), navire: nav.id } }]
    })
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
    const cartes: CarteDeMission[] = missionsDeVaisseau && tutorielFini(quetes) ? cartesDesVaisseaux() : quetes.actives.map((q) => ({ q, mo: modeleDe(q.modele) }))
    if (cartes.length === 0 && col === 0) replier('Toutes les pièces de vos vaisseaux sont ouvertes.', W - 20).forEach((li, k) => ecrire(p, li, W / 2, y0 + 12 + k * 9, COQUE[4], { align: 'center' }))
    const hauteurs: number[] = []
    cartes.forEach(({ q, mo }, i) => {
      const h = mo === undefined ? 0 : hauteurDeLaMission(mo, missionFinie(q, mo)) + 3
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
    cartes.forEach(({ q, mo }, i) => {
      const rang = Math.floor(i / cols)
      if (mo === undefined || i % cols !== col || rang < d) return
      const fini = missionFinie(q, mo)
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
      // (la mission d'un vaisseau porte SON CHÂSSIS dans le puits)
      const chassis = mo.navire === undefined ? undefined : pieceDe(modeleDeVaisseau(mo.navire).serie.montees.coque)
      if (chassis !== undefined) dessinerLePictogramme(p, chassis, 19, y + 15, 20, 20)
      else dessinerLeGlyphe(p, mo.activite === undefined ? 'tuto' : ICONE_D_ACTIVITE[mo.activite], 19, y + 15, T)
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
      if (mo.piece !== undefined) {
        // (la mission d'un vaisseau : LA PIÈCE qu'elle ouvre à l'achat, son dessin et son nom)
        plaque(p, 10, yl, 15, 15, 'creux')
        dessinerLePictogramme(p, mo.piece, 17, yl + 7, 15, 15)
        ecrire(p, mo.piece.nom, 29, yl + 4, PEPITE[3], { police: GRAS })
      } else {
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
          if (mo.navire !== undefined) {
            // LA MISSION D'UN VAISSEAU : sa pièce s'ouvre à l'achat, au hangar de ce vaisseau
            const rv = reclamerLaMission(avecLeHangar(flotte, hangar), mo.navire)
            if (rv === null) return
            flotte = rv.flotte
            sauver()
            secouer(1)
            gerbe(milieu, yj + 7, 20, [PEPITE[2], PEPITE[3], RUNE[3], N.WHITE], 70)
            vueA = t - 0.1
            pulsations.hangar = t
            nouveautes.add('hangar')
            flottants.push({ texte: `${pieceDe(rv.ouvre)?.nom ?? 'Pièce'} : à construire au hangar`, x: milieu, y: y - 4, t0: t, c: RUNE[3] })
            return
          }
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
        glisse = g.defil === 'vaisseaux' ? { x: q.x, y: q.y, defil0: defilVaisseaux, bouge: false, sorte: 'vaisseaux' } : { x: q.x, y: q.y, defil0: defil[onglet], bouge: false, sorte: 'liste' }
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
      // (LA RÉGLETTE FIXE DU ZOOM : sa course se tire, ses plaques font un pas)
      const surR = VORTEX && !ZOOM_PAR_PINCE ? surLaRegletteFixe(q) : null
      if (surR !== null) {
        ev.preventDefault()
        if (surR === 'course') {
          regletteTenue = ev.pointerId
          racine.setPointerCapture(ev.pointerId)
          champDuVortex = champSurLaReglette(q)
        } else {
          champDuVortex = Math.max(1, Math.min(CHAMP_MAX, champDuVortex + (surR === 'plus' ? -0.25 : 0.25)))
          jouer('clic')
        }
        return
      }
      const z = zones.find((z) => q.x >= z.x && q.x < z.x + z.w && q.y >= z.y && q.y < z.y + z.h)
      if (z !== undefined) {
        appuyer(z)
        return
      }
      if (souteOuverte) return
    }
    // LE VERROU, dans le jeu du vortex : la souris verrouille au clic ; le doigt, par une tape brève sur l'ennemi — décidée
    // au relâchement, pour qu'un pouce posé sur un insecte pour piloter ne verrouille rien
    if (VORTEX && m.phase === 'vol') {
      const vise = ennemiSous(ev.clientX, ev.clientY)
      if (ev.pointerType === 'mouse') {
        if (vise !== null) basculerLeVerrou(vise)
        // (la souris tenue zoome, avec `&zoom=pince` : voir `pince`)
        if (ZOOM_PAR_PINCE) {
          racine.setPointerCapture(ev.pointerId)
          poserLaPince(ev)
        }
        return
      }
      tapeVerrou = vise === null ? null : { id: ev.pointerId, x: ev.clientX, y: ev.clientY, a: performance.now(), cible: vise }
      // (LE DEUXIÈME DOIGT ZOOME : le manche est déjà tenu, par un doigt bien posé — `doigtsPoses` compte encore ceux
      // d'avant celui-ci : l'appui arrive avant `touchstart`)
      if (ZOOM_PAR_PINCE && manche !== null && pince === null && ev.pointerType === 'touch' && doigtsPoses >= 1) {
        ev.preventDefault()
        racine.setPointerCapture(ev.pointerId)
        poserLaPince(ev)
        return
      }
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
    // (dans le jeu du vortex, UN SEUL MANCHE : tout doigt posé, où que ce soit, est celui du vol ; la souris ne pilote pas)
    if (VORTEX && ev.pointerType === 'mouse') return
    const aGauche = VORTEX || (ev.pointerType === 'mouse' ? !capaciteArmee : ev.clientX < cadre.left + cadre.width / 2 === (reglages.vol === 'gauche'))
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
        canvas.style.cursor = zones.some((z) => sv.x >= z.x && sv.x < z.x + z.w && sv.y >= z.y && sv.y < z.y + z.h) ? CURSEUR_QUI_CLIQUE : ''
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
      else if (glisse.sorte === 'vaisseaux') defilVaisseaux = glisse.defil0 - (q.y - glisse.y) / 13
      return
    }
    if (regletteTenue !== null && ev.pointerId === regletteTenue) {
      if (regletteFixe !== null) champDuVortex = champSurLaReglette(enTampon(ev.clientX, ev.clientY))
      return
    }
    if (pince !== null && ev.pointerId === pince.id) {
      // monter rapproche (vers 1), descendre éloigne (vers 2)
      const course = Math.max(1, racine.clientHeight * COURSE_DU_ZOOM)
      champDuVortex = Math.max(1, Math.min(CHAMP_MAX, pince.champ0 + (ev.clientY - pince.y0) / course))
      pince.doigt = { x: ev.clientX, y: ev.clientY }
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
  /**
   * LES FLAMMES DU LANCE-FLAMMES (la Salamandre, Keko, 15/11) : des particules crachées par la buse dans le cône, tant
   * qu'il crache — blanc-jaune à la bouche, puis orange, rouge, une fumée qui s'éteint ; elles grossissent en volant.
   * (Son souffle est une voix continue : `regler`.) Et LES FLAMMES SUR LES INSECTES QUI BRÛLENT (Keko, 15/11 : « des
   * petites particules de flamme qui spawnent sur lui ») : petites, elles montent en rapetissant.
   */
  // (LES BOUFFÉES DE LA FIREBALL du dépôt — Keko, 15/11 : « ces flammes de sa traînée sont plus réalistes » : chacune
  // naît blanche et petite, gonfle en refroidissant vers l'orange et le rouge (`firePuff`), et un peu plus de la moitié
  // s'éteignent en FUMÉE (`smokePuff`) ; `fl` sa vie de flamme, `sm` si elle fume, `sl` combien, `s` sa taille, `f` sa
  // place dans le jet (plus loin, un peu plus froide))
  let flammesDuNez: { x: number; y: number; vx: number; vy: number; t0: number; fl: number; sm: boolean; sl: number; s: number; f: number }[] = []
  let flammesDesBrules: { x: number; y: number; vx: number; vy: number; t0: number; vie: number }[] = []
  /** Une tape commencée sur un ennemi (au doigt) : elle le verrouille si elle est brève et ne bouge pas. */
  let tapeVerrou: { id: number; x: number; y: number; a: number; cible: number } | null = null
  /** L'ennemi sous ce point de l'écran (le plus proche, à une marge près, pour qu'une petite cible se touche), ou null. */
  function ennemiSous(clientX: number, clientY: number): number | null {
    const q = enTampon(clientX, clientY)
    const wx = camera.x + (q.x - W / 2) * champApplique
    const wy = camera.y + (q.y - centreY()) * champApplique
    const marge = Math.max(CONF.ennemi.rayon + 6, 12 * champApplique)
    let meilleur: number | null = null
    let dm = marge
    for (const e of m.ennemis) {
      const d = Math.hypot(e.corps.x - wx, e.corps.y - wy)
      if (d <= dm) (dm = d), (meilleur = e.id)
    }
    return meilleur
  }
  function basculerLeVerrou(id: number): void {
    const avant = ennemiVerrouille(m)
    verrouiller(m, id)
    if (m.verrou === id) {
      verrouA = t
      deverrou = null
      jouer('verrou')
    } else if (avant !== null) {
      deverrou = { x: avant.corps.x, y: avant.corps.y, t0: t }
      jouer('deverrou')
    }
    if (typeof navigator.vibrate === 'function') navigator.vibrate(8)
  }
  const lever = (ev: PointerEvent) => {
    reveiller() // (au doigt, c'est le relâchement qui rend le son à la page)
    if (tapeVerrou !== null && ev.pointerId === tapeVerrou.id) {
      const tv = tapeVerrou
      tapeVerrou = null
      if (ev.type === 'pointerup' && performance.now() - tv.a < 350 && Math.hypot(ev.clientX - tv.x, ev.clientY - tv.y) < 14 && m.ennemis.some((e) => e.id === tv.cible)) basculerLeVerrou(tv.cible)
    }
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
      else if (glisse.sorte === 'vaisseaux') defilVaisseaux = Math.round(defilVaisseaux)
      else if (glisse.sorte === 'onglets') defilOnglets = Math.round(defilOnglets)
      else if (glisse.sorte === 'ordres') defilOrdres = Math.round(defilOrdres)
      else if (glisse.sorte === 'inventaire') defilInventaire = Math.round(defilInventaire)
      else if (glisse.sorte === 'cases') defilCases = Math.round(defilCases)
      else if (glisse.sorte === 'missions') defilMissions = Math.round(defilMissions)
      else if (glisse.sorte === 'soute') defilSoute = Math.round(defilSoute)
      glisse = null
    }
    if (manche !== null && ev.pointerId === manche.id) manche = null
    if (pince !== null && ev.pointerId === pince.id) pince = null
    if (regletteTenue === ev.pointerId) regletteTenue = null
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
      if (zoneGlissante?.defil === 'vaisseaux') defilVaisseaux = Math.round(defilVaisseaux) + Math.sign(pas)
      else defil[onglet] = Math.round(defil[onglet]) + Math.sign(pas)
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
      pince = null
      regletteTenue = null
    } else if (doigtsPoses === 1 && manche !== null && pince !== null) {
      // (le doigt qui zoomait et celui du manche : le plus loin du doigt qui reste tombe)
      const d = ev.touches[0]
      const loin = (q: Vecteur): number => Math.hypot(q.x - d.clientX, q.y - d.clientY)
      if (loin(manche.doigt) > loin(pince.doigt)) manche = null
      else pince = null
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
    // (PAS DANS LE JEU DU VORTEX EN COURS DE PARTIE — Keko, 15/11 : abattu, une touche de déplacement relançait tout de
    // suite une partie neuve ; le retour au portail attend sa pénalité, la fin attend « Rejouer »)
    if (VORTEX && enJeu) return
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
    // LE JEU DU VORTEX SE JOUE À UN SEUL MANCHE (Keko, 15/11 : « et si on laissait complètement tomber le stick droit, et
    // que le vaisseau s'orientait lui-même vers l'ennemi proche qu'il cible ? un gameplay Vampire Survivors : un seul
    // joystick, et sur PC uniquement les touches de déplacement — on laisse tomber la souris et le suivi du curseur ») :
    // le nez se tourne SEUL vers l'insecte le plus proche à portée des canons (un peu au-delà, pour être prêt) ;
    // personne en vue, il suit le manche.
    if (VORTEX && tirA360) return undefined
    // (LA SENTINELLE NE SE TOURNE PAS VERS SA CIBLE : ses drones tirent dans toutes les directions, son nez suit le manche)
    // (… NI L'INGÉNIEUR : ses tourelles visent seules)
    if (VORTEX && CONF.armes.length > 0 && CONF.armes.every((a) => a.orbite !== undefined || a.pose !== undefined || a.chaine !== undefined || a.aura !== undefined || a.scie !== undefined || a.balise !== undefined || a.givre !== undefined || a.nova !== undefined || a.salve !== undefined || a.tornade !== undefined || a.nuee !== undefined || a.rejeton !== undefined || a.mine !== undefined || a.fleau !== undefined || a.drain !== undefined || a.vrille !== undefined || a.ponte !== undefined)) return undefined
    if (VORTEX) {
      // (… D'ASSEZ LOIN pour être prêt, même avec une arme courte : le lance-flammes ne porte qu'à 45)
      const cible = enJeu && m.phase === 'vol' ? ennemiLePlusProche(m, Math.max(110, Math.max(0, ...CONF.armes.map((a) => a.portee)) * 1.35)) : null
      if (cible === null) return undefined
      const d = Math.hypot(cible.x - v.x, cible.y - v.y) || 1
      return { x: (cible.x - v.x) / d, y: (cible.y - v.y) / d }
    }
    // (le second manche TOURNE LE NEZ, de nouveau — Keko, 14/11 : le zoom, essayé sur lui, est passé à deux boutons)
    if (regard !== null) return directionDuManche(MANCHE, regard.doigt.x - regard.centre.x, regard.doigt.y - regard.centre.y)
    // SUR PC, LA SOURIS VISE (Keko, 12/11 : « mouvement sur ZQSD et vise via souris ») : le nez se tourne vers le
    // pointeur, d'autant plus franchement — et la caméra avance d'autant plus — qu'il est loin du vaisseau (à fond à
    // soixante pixels) ; tout près de lui, rien. Dès que la souris a bougé pendant le vol, tant qu'elle est sur le jeu
    // et qu'elle ne tient pas le manche.
    if (souris === null || manche !== null || !enJeu) return undefined
    const dx = souris.x - ((v.x - camera.x) / champApplique + W / 2)
    const dy = souris.y - ((v.y - camera.y) / champApplique + centreY())
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
    // (A et Q à gauche, pour les deux claviers — et donc E et D à droite, Keko, 15/11)
    const x = (touches.has('arrowright') || touches.has('d') || touches.has('e') ? 1 : 0) - (touches.has('arrowleft') || touches.has('q') || touches.has('a') ? 1 : 0)
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
    if (flam > 0.02 && g.omni === undefined && !organique(allure.coque)) {
      const [fx, fy] = ici(queueDe(allure.coque) - 0.5 * (cp - 1) - (1 + 3 * flam), 0)
      p.glow(fx, fy, 5 + 7 * flam + 2 * (cp - 1), rival ? FEU[4] : cp >= 3 ? ION[4] : FEU[5], 0.4 + 0.45 * flam + 0.08 * Math.sin(t * 9))
    }
    peindreFormes(p, formesDuVaisseau(allure, flam, t, vise, devie), sx, sy, 1, { cap: corps.cap, lumiere: LUMIERE_DU_VOL, blanc: blanchi ? 1 : 0, matieres: rival ? MATIERES_DU_RIVAL : undefined, rampes: rival ? undefined : rampesDuJoueur(), reflet: rival ? REFLET_DU_RIVAL : REFLET_DU_VOL })
    // (LE CŒUR DE LUMIÈRE DU TESSERACT RAYONNE — Keko, 18/11 : « le vaisseau de lumière » : une lueur qui bat avec lui, de
    // la couleur de son cœur, et un halo plus large, de celle de ses arêtes)
    if (allure.coque === 15 && !rival) {
      const ru = rampesDuJoueur()
      const lu = ru?.lumiere ?? [0, 0, 0, ...tonsDeLaMatiere('lumiere')]
      const sp = ru?.spectre ?? [0, 0, 0, ...tonsDeLaMatiere('spectre')]
      const bat = 0.5 + 0.5 * Math.sin(t * 3)
      p.glow(sx, sy, 16 + 3 * bat, sp[4], 0.3 + 0.1 * bat)
      p.glow(sx, sy, 7 + 2 * bat, lu[4], 0.55 + 0.2 * bat)
    }
    const [vx, vy] = ici(g.verriere, 0)
    if (!sansVerriere(allure.coque)) p.glow(vx, vy, 4, rival ? VERRIERE_ENNEMIE[1] : VERRIERE[2], 0.3)
    // les feux de position, au bout des ailes : rouge à bâbord, vert à tribord ; le rival, deux feux d'ambre
    const feux = g.feux
    if (feux !== null && !blanchi && Math.floor(t * 1.5 + (rival ? 0.5 : 0)) % 2 === 0)
      for (const s of [-1, 1]) {
        const [ax, ay] = ici(feux.x, s * feux.y)
        const c = rival ? VERRIERE_ENNEMIE[2] : couleurDuFeu(s)
        p.rect(Math.round(ax - 0.5), Math.round(ay - 0.5), 1, 1, N.WHITE)
        p.glow(ax, ay, 3, c, 0.8)
      }
    // LE BOUCLIER, UNE BULLE DE PLAQUES (Keko, 17/11 : « s'inspirer de l'effet Force field » ; c'était un anneau) : voir
    // `bouclier.ts` ; celui du joueur prend ses coups (l'onde, les plaques qui blanchissent) et se fêle quand il se vide
    while (coupsAuBouclier.length > 0 && t - coupsAuBouclier[0].t0 > 1.2) coupsAuBouclier.shift()
    const coups = rival ? [] : coupsAuBouclier.map((c) => ({ angle: Math.atan2(c.y - corps.y, c.x - corps.x), age: t - c.t0, brise: c.brise }))
    if (allure.bouclier > 0 || coups.some((c) => c.brise && c.age < 0.8)) dessinerLeBouclier(p, sx, sy, g.anneau, t, allure.bouclier, coups)
  }

  /**
   * LE CHEMIN DU VER (Keko, 17/11 : « qu'il se déplace un peu comme dans Snake ») : là où le vaisseau est passé, un point
   * tous les demi-pixels de trajet, les plus récents devant — trente-cinq unités de chemin, de quoi poser ses neuf
   * anneaux ; un saut (le retour au portail, l'aperçu qui recommence) l'efface. L'aperçu des armes a le sien. Rend les
   * anneaux, en unités du vaisseau : chacun à `ECART_DES_ANNEAUX` du précédent LE LONG DU CHEMIN, la tête au centre ; là
   * où le chemin manque (il vient de naître, il n'a pas bougé), il se prolonge tout droit derrière lui.
   * (… LE CHEMIN PART DE LÀ OÙ IL EST, pas de son dernier point gardé — Keko, 17/11 : « il vibre bizarrement » : les
   * anneaux sautaient d'un demi-pixel à chaque point ajouté ; et sa QUEUE est gardée, d'où partent ses bulles)
   */
  const tracesDuVer = { vol: [] as [number, number][], apercu: [] as [number, number][] }
  let queueDuVer: { x: number; y: number; cap: number } | null = null
  const ECART_DES_ANNEAUX = 2.5
  function cheminDuVer(): [number, number][] {
    const tr = enApercu ? tracesDuVer.apercu : tracesDuVer.vol
    if (tr.length === 0 || Math.hypot(tr[0][0] - v.x, tr[0][1] - v.y) > 30) tr.splice(0, tr.length, [v.x, v.y])
    else if (Math.hypot(tr[0][0] - v.x, tr[0][1] - v.y) >= 0.5) tr.unshift([v.x, v.y])
    // (on ne garde que ce qu'il faut de chemin)
    let long = 0
    for (let i = 1; i < tr.length; i++) {
      long += Math.hypot(tr[i][0] - tr[i - 1][0], tr[i][1] - tr[i - 1][1])
      if (long > 35) {
        tr.length = i + 1
        break
      }
    }
    const ca = Math.cos(v.cap)
    const sa = Math.sin(v.cap)
    // (le point du chemin à `d` derrière la tête : depuis là où il est, puis la trace, puis tout droit)
    const ch: [number, number][] = [[v.x, v.y], ...tr]
    const auDos = (d: number): [number, number] => {
      let reste = d
      for (let i = 1; i < ch.length; i++) {
        const l = Math.hypot(ch[i][0] - ch[i - 1][0], ch[i][1] - ch[i - 1][1])
        if (l < 1e-6) continue
        if (reste <= l) return [ch[i - 1][0] + ((ch[i][0] - ch[i - 1][0]) * reste) / l, ch[i - 1][1] + ((ch[i][1] - ch[i - 1][1]) * reste) / l]
        reste -= l
      }
      const [qx, qy] = ch[ch.length - 1]
      const [px, py] = ch.length >= 2 && Math.hypot(ch[ch.length - 1][0] - ch[ch.length - 2][0], ch[ch.length - 1][1] - ch[ch.length - 2][1]) > 1e-6 ? ch[ch.length - 2] : [qx + ca, qy + sa]
      const l = Math.hypot(qx - px, qy - py) || 1
      return [qx + ((qx - px) / l) * reste, qy + ((qy - py) / l) * reste]
    }
    {
      const [qx, qy] = auDos(9 * ECART_DES_ANNEAUX + 2)
      const [ax, ay] = auDos(9 * ECART_DES_ANNEAUX)
      queueDuVer = { x: qx, y: qy, cap: Math.atan2(ay - qy, ax - qx) }
    }
    const anneaux: [number, number][] = []
    for (let k = 1; k <= 9; k++) {
      const [wx, wy] = auDos(k * ECART_DES_ANNEAUX)
      const dx = wx - v.x
      const dy = wy - v.y
      anneaux.push([dx * ca + dy * sa, -dx * sa + dy * ca])
    }
    return anneaux
  }
  /** La déviation de la flamme du joueur (voir `dessinerLeVaisseau`), et son cap à l'image d'avant. */
  let devieDeLaFlamme = 0
  let capVu = 0
  let virageVu = 0
  /**
   * LES JETS D'UNE SOUCOUPE (Keko, 15/11 : « des propulseurs plus petits, comme les propulseurs avant du chasseur : de
   * petits jets, pas des propulseurs de feu ») : de courts jets froids, blancs au cœur et bleus au bout, aux tuyères
   * qui font face à l'opposé de la poussée (`dx`, `dy`, dans le repère du vaisseau) — d'autant plus forts qu'elles lui
   * font face ; `repos` : un souffle de toutes, au vol stationnaire. (sx, sy) le centre à l'écran, `s` les pixels par
   * unité (la place des tuyères), `sl` celle de la longueur des jets — plus courts, en grand, que le vaisseau ne grandit.
   */
  function dessinerLesJetsOmni(p: Peintre, coque: number, sx: number, sy: number, cap: number, s: number, dx: number, dy: number, repos = 0, sl = s): void {
    const ca = Math.cos(cap)
    const sa = Math.sin(cap)
    for (const tu of tuyeresOmni(coque)) {
      const f = Math.max(repos, -(tu.ux * dx + tu.uy * dy))
      if (f < 0.12) continue
      const L = (2 + 4 * f) * (0.8 + 0.2 * Math.sin(t * 55 + tu.x * 3 + tu.y)) * sl
      const x0 = sx + (tu.x * ca - tu.y * sa) * s
      const y0 = sy + (tu.x * sa + tu.y * ca) * s
      const ux = tu.ux * ca - tu.uy * sa
      const uy = tu.ux * sa + tu.uy * ca
      // (en grand, un jet de deux pixels d'épaisseur)
      const ep = sl >= 1.5 ? [0, 1] : [0]
      for (const e of ep) {
        const ox = -uy * e
        const oy = ux * e
        p.line(x0 + ox, y0 + oy, x0 + ox + ux * L, y0 + oy + uy * L, VERRIERE[1], 0.9)
        p.line(x0 + ox, y0 + oy, x0 + ox + ux * L * 0.5, y0 + oy + uy * L * 0.5, N.WHITE)
      }
      p.glow(x0 + ux * L * 0.5, y0 + uy * L * 0.5, (3 + 2 * f) * Math.max(1, sl), VERRIERE[1], 0.5 * f)
    }
  }
  function dessinerLeVaisseau(p: Peintre): void {
    // (la tourelle du rayon thermique vise sa cible, comme la foreuse sa roche)
    const impact = impactDuRayon(CONF, m)
    const vise = impact !== null ? Math.atan2(impact.y - v.y, impact.x - v.x) - v.cap : m.canal !== null ? Math.atan2(m.canal.y - v.y, m.canal.x - v.x) - v.cap : m.forage !== null ? Math.atan2(m.forage.y - v.y, m.forage.x - v.x) - v.cap : 0
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
    const al0 = allureMontee(CONF.bouclier.points > 0 ? m.bouclier / CONF.bouclier.points : 0)
    const al = { ...al0, vises, ...(al0.coque === 14 ? { chemin: cheminDuVer() } : {}) }
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
    // (INTOUCHABLE APRÈS UN COUP, IL CLIGNOTE — Keko, 17/11 : « subir des dégâts, clignoter une petite seconde » : une
    // tranche de 70 ms sur deux, il n'est pas dessiné ; voir `invulnerabilite` dans `jeu.ts`)
    const clignote = m.phase === 'vol' && m.t < m.intouchableJusque && Math.floor((m.intouchableJusque - m.t) / 0.07) % 2 === 1
    if (!clignote) dessinerUnVaisseau(p, v, flamme, vise, al, blanchi, false, devieDeLaFlamme)
    // LES JETS DE MANŒUVRE : de courtes flammes froides, blanches au cœur et bleues au bout — DEUX AU NEZ, qui soufflent
    // vers l'avant quand on recule ; UNE PAR FLANC, qui souffle à l'opposé du côté où l'on glisse. Elles frémissent.
    {
      const sx = Math.round(v.x - camera.x + W / 2)
      const sy = Math.round(v.y - camera.y + centreY())
      const ca = Math.cos(v.cap)
      const sa = Math.sin(v.cap)
      /** Un jet : d'où il sort (repère du vaisseau), vers où il souffle, et sa force (0 à 1). */
      // (LES BÊTES NE SOUFFLENT PAS DE FLAMME FROIDE — Keko, 16/11 : « sur le Kraken et la Vouivre, des petites expulsions
      // vertes dans le style de leur propulsion » : de petites bulles de bile ou de venin, crachées par saccades, qui
      // s'écartent, enflent et crèvent ; et LE NÉANT N'EN A PAS DU TOUT — « il ne devrait pas en avoir »)
      const bete = al.coque === 10 || al.coque === 11 || al.coque === 14
      const jet = (x: number, y: number, dx: number, dy: number, force: number): void => {
        if (force < 0.12 || plieLEspace(al.coque)) return
        const L = (2 + 4 * force) * (0.8 + 0.2 * Math.sin(t * 55 + x * 3 + y))
        const x0 = sx + x * ca - y * sa
        const y0 = sy + x * sa + y * ca
        const ux = dx * ca - dy * sa
        const uy = dx * sa + dy * ca
        if (bete) {
          const [cb, cl] = couleursDesBulles(al.coque)
          for (let k = 0; k < 3; k++) {
            const u = (((t * (3 + 2 * force) + k / 3 + x * 0.37 + y * 0.21) % 1) + 1) % 1
            const d = 1 + u * (3 + 5 * force)
            const cote = Math.sin(k * 2.7 + x + y) * u * 1.5
            const bx = x0 + ux * d - uy * cote
            const by = y0 + uy * d + ux * cote
            const r = (0.5 + 0.5 * ((k * 0.618) % 1)) * (1 + 0.8 * u) * (0.7 + 0.5 * force)
            const c = k === 0 ? cl : cb
            if (u > 0.85) for (const [ex, ey] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) p.dot(bx + ex * (r + 0.8), by + ey * (r + 0.8), c, 0.7 * force)
            else if (r >= 1.1) p.ring(bx, by, r, 1, c, 0.9 * force)
            else p.dot(bx, by, c, force)
          }
          return
        }
        p.line(x0, y0, x0 + ux * L, y0 + uy * L, VERRIERE[1], 0.9)
        p.line(x0, y0, x0 + ux * L * 0.5, y0 + uy * L * 0.5, N.WHITE)
        p.glow(x0 + ux * L * 0.5, y0 + uy * L * 0.5, 3 + 2 * force, VERRIERE[1], 0.5 * force)
      }
      const gj = gabaritDe(al.coque)
      // UNE SOUCOUPE : de petits jets froids à ses tuyères, celles qui font face à l'opposé de la direction ; pas de jets
      // de manœuvre au nez ni aux flancs (elle ne tourne pas)
      if (gj.omni !== undefined) dessinerLesJetsOmni(p, al.coque, sx, sy, v.cap, 1, pousseeVue.avant - pousseeVue.retro, pousseeVue.cote)
      else {
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
    }
    // (le bouclier qui prend un coup : c'est la bulle qui le montre, voir `dessinerLeBouclier` ; l'anneau qui flashait est parti)
  }

  /**
   * UN INSECTE de l'invasion, vu de dessus, la tête vers son cap : un abdomen rayé, un thorax, une tête à mandibules,
   * six pattes qui marchent ; EN CHASSE, il rougit, ses yeux passent du jaune au rouge, ses mandibules claquent et
   * ses pattes s'affolent ; blanc un instant sous un coup.
   */
  /**
   * (`deforme` : SON CORPS EST DÉFORMÉ ET PRIS DE LUMIÈRE VIOLETTE — le portail l'avale : étiré de `long` le long de
   * l'axe `axe` (vers le centre du vortex), resserré de `large` en travers, ses teintes passées au violet, `part` de 0 à 1.)
   */
  function dessinerUnInsecte(p: Peintre, x: number, y: number, cap: number, phase: number, blanchi: boolean, aggro: boolean, deforme?: { axe: number; long: number; large: number; part: number }): void {
    const ca = Math.cos(cap)
    const sa = Math.sin(cap)
    const da = deforme === undefined ? 0 : deforme.axe
    const dc = Math.cos(da)
    const ds = Math.sin(da)
    const P = (ux: number, uy: number): [number, number] => {
      const rx = ux * ca - uy * sa
      const ry = ux * sa + uy * ca
      if (deforme === undefined) return [x + rx, y + ry]
      // (dans le repère de l'axe : on étire le long, on resserre en travers, avec une ondulation qui court le long du corps)
      const le = (rx * dc + ry * ds) * deforme.long
      const tr = (-rx * ds + ry * dc) * deforme.large + Math.sin(le * 0.9 + t * 40) * 1.2 * deforme.part
      return [x + le * dc - tr * ds, y + le * ds + tr * dc]
    }
    const ovaleTourne = (cx: number, cy: number, rx: number, ry: number): [number, number][] => Array.from({ length: 12 }, (_, i) => P(cx + Math.cos((i / 12) * Math.PI * 2) * rx, cy + Math.sin((i / 12) * Math.PI * 2) * ry))
    const ENCRE = N.hex('#0a0610')
    // (des teintes CLAIRES : sur le noir de l'espace, un violet sombre et des pattes d'encre ne se voyaient pas)
    const pris = deforme !== undefined
    const CORPS = blanchi ? N.WHITE : pris ? N.hex('#a35cff') : aggro ? N.hex('#b02a4a') : N.hex('#7446b0')
    const CLAIR = blanchi ? N.WHITE : pris ? N.hex('#f1dcff') : aggro ? N.hex('#ff7a8c') : N.hex('#c39bf5')
    const PATTE = blanchi ? N.WHITE : pris ? N.hex('#cf9bff') : aggro ? N.hex('#d05a70') : N.hex('#9a78cc')
    // les pattes : trois par flanc, qui vont et viennent en opposition
    for (const s of [-1, 1])
      for (let k = 0; k < 3; k++) {
        const pas = Math.sin(t * (aggro ? 22 : 13) + phase + k * 2.1 + (s > 0 ? Math.PI : 0)) * 1.3
        const [ax, ay] = P(-1.2 + k * 1.5, s * 1.4)
        const [gx, gy] = P(-1.8 + k * 2 + pas * 0.5, s * 4.6)
        const [fx, fy] = P(-2.6 + k * 2.6 + pas, s * 7.2)
        p.line(ax, ay, gx, gy, PATTE)
        p.line(gx, gy, fx, fy, PATTE)
      }
    p.poly(ovaleTourne(-4.6, 0, 4.7, 3.5), ENCRE)
    p.poly(ovaleTourne(-4.6, 0, 3.8, 2.6), CORPS)
    for (const ux of [-6.4, -4.6, -2.9]) {
      const [x0, y0] = P(ux, -2)
      const [x1, y1] = P(ux, 2)
      p.line(x0, y0, x1, y1, CLAIR)
    }
    p.poly(ovaleTourne(0, 0, 3, 2.6), ENCRE)
    p.poly(ovaleTourne(0, 0, 2.1, 1.7), CLAIR)
    p.poly(ovaleTourne(3.7, 0, 2.5, 2.3), ENCRE)
    p.poly(ovaleTourne(3.7, 0, 1.7, 1.5), CORPS)
    // les mandibules, qui claquent en chasse
    const ouvre = aggro ? 0.9 + 0.7 * Math.sin(t * 18 + phase) : 0.5
    for (const s of [-1, 1]) {
      const [x0, y0] = P(5.2, s * 0.9)
      const [x1, y1] = P(7.6, s * (0.6 + ouvre))
      p.line(x0, y0, x1, y1, blanchi ? N.WHITE : N.hex('#e6d8b0'))
    }
    for (const s of [-1, 1]) {
      const [ex, ey] = P(4.4, s * 0.9)
      p.px(ex, ey, blanchi ? N.WHITE : aggro ? N.hex('#ff4a4a') : N.hex('#ffd24a'))
    }
    if (aggro && !blanchi) p.glow(x, y, 9, N.hex('#ff3a4a'), 0.25 + 0.1 * Math.sin(t * 9 + phase))
  }
  /**
   * LES INSECTES PRIS PAR LE PORTAIL (Keko, 14/11 : « quand un ennemi entre dans le vortex, une petite animation
   * d'aspiration de son image dans le vortex, plutôt qu'une explosion jaune ») — d'abord un tourbillon de siphon, puis :
   * voir `dessinerLesAspires`.
   */
  /** Le cap et l'état de chaque insecte à la dernière image où on l'a dessiné (pour celui que le portail vient de prendre). */
  const dernierVu = new Map<number, { cap: number; aggro: boolean }>()
  let aspires: { x: number; y: number; cap: number; id: number; t0: number; aggro: boolean }[] = []
  const DUREE_DE_L_ASPIRATION = 0.55
  function dessinerLesAspires(p: Peintre): void {
    aspires = aspires.filter((a) => t - a.t0 < DUREE_DE_L_ASPIRATION)
    for (const a of aspires) {
      // UNE DISTORSION ET UNE LUMIÈRE VIOLETTE SUR SON CORPS (Keko, 14/11 : « pas une aspiration comme dans un siphon : une
      // distorsion et un effet de lumière violet sur le corps de l'objet aspiré ») : il ne tourne pas — il glisse droit
      // vers le centre, son corps S'ÉTIRE vers lui et se resserre, ondule, vire au violet puis au blanc, baigné d'une
      // lueur violette, et se réduit à un trait de lumière qui s'éteint
      const u = (t - a.t0) / DUREE_DE_L_ASPIRATION
      const axe = Math.atan2(-a.y, -a.x)
      const k = 1 - u * u * 0.85
      const wx = a.x * k
      const wy = a.y * k
      const sx = wx - camera.x + W / 2
      const sy = wy - camera.y + centreY()
      const long = 1 + 2.6 * u * u
      const large = Math.max(0.08, 1 - 1.05 * u)
      p.glow(sx, sy, 10 + 10 * u, N.hex('#a35cff'), 0.55 * (1 - u * 0.5))
      if (u < 0.85) dessinerUnInsecte(p, sx, sy, a.cap, a.id * 1.7, u > 0.6, a.aggro, { axe, long, large, part: u })
      // (le trait de lumière : de lui vers le centre, de plus en plus net à mesure qu'il s'efface)
      const l = (6 + 16 * u) * (u < 0.85 ? 1 : 1 - (u - 0.85) / 0.15)
      p.glowLine(sx, sy, sx + Math.cos(axe) * l, sy + Math.sin(axe) * l, 3, N.hex('#cf9bff'), 0.25 + 0.6 * u)
      if (u > 0.5) p.line(sx - Math.cos(axe) * l * 0.4, sy - Math.sin(axe) * l * 0.4, sx + Math.cos(axe) * l, sy + Math.sin(axe) * l, u > 0.8 ? N.WHITE : N.hex('#f1dcff'), Math.min(1, (u - 0.5) * 3) * (u < 0.85 ? 1 : 1 - (u - 0.85) / 0.15))
    }
  }
  /**
   * L'INSECTE SE CONSUME (Keko, 15/11 : « quand un ennemi meurt par le feu, plutôt que de le faire exploser, s'inspirer
   * de l'animation Burn away — dans les transitions de pixelfx — comme s'il se consumait d'un coup ») : la même
   * mécanique, à sa taille. Son image est FIGÉE à sa mort, puis rongée en un peu plus d'une demi-seconde par UN FRONT DE
   * BRAISE, des bords vers le cœur (une distance au centre troublée de bruit, comme le champ de l'effet) : devant le
   * front, il roussit ; sur la ligne, il est chauffé à blanc ; derrière, il refroidit le long de la rampe du feu de
   * l'effet jusqu'au charbon, puis n'est plus. Le front, en passant, lâche des langues de feu, des braises et de la
   * fumée (les particules du dépôt) ; au bout, une bouffée de braises et de fumée.
   */
  const RAMPE_DU_FEU = N.fit(['#4a1712', '#8a1f17', '#c9281f', '#f2561d', '#ff8a2a', '#ffc23d', '#ffe26b', '#fff3a6', '#ffffff'], 9)
  /** Le rouge du rayon thermique : la rampe de « Laser grid » du dépôt. */
  const RAMPE_DU_LASER = N.fit(['#1a0408', '#4a0a12', '#8a1020', '#d01c2a', '#ff4a4a', '#ff9a90', '#ffe4e0', '#ffffff'], 8)
  const ROUSSI = N.hex('#3a2216')
  const CHARBON = N.hex('#2a1a16')
  const FUMEE_DU_FEU = N.hex('#6a5a60')
  const DUREE_DE_LA_CONSUMATION = 0.6
  type Consume = { x: number; y: number; vx: number; vy: number; t0: number; S: number; color: Uint32Array; champ: Float32Array; kMin: number; kMax: number; passe: Uint8Array; fini: boolean }
  let consumes: Consume[] = []
  const feuDesConsumes = new N.Particles({ rng: new N.Rng(17), sparks: [RAMPE_DU_FEU[7], RAMPE_DU_FEU[6], RAMPE_DU_FEU[4], RAMPE_DU_FEU[2]] })
  let feuDesConsumesA = -1
  const alea = (i: number, j: number, g: number): number => {
    const v = Math.sin(i * 12.9898 + j * 78.233 + g * 37.719) * 43758.5453
    return v - Math.floor(v)
  }
  function consumer(id: number, x: number, y: number, vx: number, vy: number): void {
    const S = 28
    const c0 = S / 2
    const f = N.createFrame(S, S)
    const vu = dernierVu.get(id)
    dessinerUnInsecte(N.painterFor(f), c0, c0, vu?.cap ?? 0, id * 1.7, false, vu?.aggro ?? false)
    let rMax = 1
    for (let j = 0; j < S; j++) for (let i = 0; i < S; i++) if (f.color[j * S + i] >>> 24 !== 0) rMax = Math.max(rMax, Math.hypot(i - c0, j - c0))
    const champ = new Float32Array(S * S)
    let kMin = Infinity
    let kMax = -Infinity
    for (let j = 0; j < S; j++)
      for (let i = 0; i < S; i++) {
        const k = j * S + i
        if (f.color[k] >>> 24 === 0) continue
        // (le bord brûle d'abord : un pour le bord, zéro pour le cœur — troublé à deux échelles)
        const v = Math.hypot(i - c0, j - c0) / rMax + 0.4 * alea(i >> 1, j >> 1, id) + 0.12 * alea(i, j, id + 5)
        champ[k] = -v
        kMin = Math.min(kMin, -v)
        kMax = Math.max(kMax, -v)
      }
    if (kMin === Infinity) return
    consumes.push({ x, y, vx, vy, t0: t, S, color: f.color, champ, kMin, kMax, passe: new Uint8Array(S * S), fini: false })
  }
  // (`&consume` : LE BANC — un insecte se consume à côté du vaisseau toutes les 1,6 s, hors de toute flamme, pour le juger seul)
  let bancConsumeA = -10
  let bancConsumeN = 0
  /**
   * L'ÉLECTRICITÉ DE LA SENTINELLE, PEINTE PAR LES ÉCLAIRS DU DÉPÔT (`pixelfx/fx/lightning/_lib` — Keko, 15/11 :
   * « fouiner dans les effets électriques de pixelfx ») : leur forme (`zigzag`, `bowed` — des fourches qui
   * s'amincissent) et leur encre (`stroke`, `crackle` — un halo violet profond, un corps pâle, un cœur blanc, une lueur
   * le long), leur palette `VOLT`. LES ARCS DES DRONES, brefs ; LA CHAÎNE, maillon après maillon, qui frappe, bourdonne
   * puis s'éteint en bégayant ; L'AURA, un anneau qui crépite autour du vaisseau et des arcs vers ce qui est dedans.
   * Leur forme change toutes les deux images (elles grésillent) ; dessinés à l'écran.
   */
  const COULEURS_VOLT = N.fit(VOLT, 8)
  /**
   * (LES BOUTS D'UN ÉCLAIR SUIVENT CE QU'ILS RELIENT — Keko, 15/11 : « ils restent à leur position de départ et d'arrivée
   * pendant toute l'animation ; quand le vaisseau ou l'ennemi se déplace, il faudrait qu'ils continuent à évoluer » :
   * chaque bout est ACCROCHÉ — au vaisseau, à un drone, à un ennemi —, sa place relue à chaque image ; un ennemi mort
   * entre-temps garde la dernière)
   */
  type Ancre = { sorte: 'vaisseau' } | { sorte: 'drone'; k: number } | { sorte: 'ennemi'; id: number }
  let arcsElectriques: { x0: number; y0: number; x1: number; y1: number; de: Ancre; vers: Ancre; t0: number; vie: number; g: number; fort: boolean }[] = []
  const ouEst = (a: Ancre): { x: number; y: number } | undefined => (a.sorte === 'vaisseau' ? (m.phase === 'vol' ? { x: v.x, y: v.y } : undefined) : a.sorte === 'drone' ? m.drones[a.k] : m.ennemis.find((e) => e.id === a.id)?.corps)
  let zapA = -10
  function dessinerLElectricite(p: Peintre): void {
    const C = COULEURS_VOLT
    const ecran = (x: number, y: number): [number, number] => [x - camera.x + W / 2, y - camera.y + centreY()]
    const image = Math.floor(t * 15)
    arcsElectriques = arcsElectriques.filter((a) => t - a.t0 < a.vie)
    for (const a of arcsElectriques) {
      const ici = ouEst(a.de)
      if (ici !== undefined) (a.x0 = ici.x), (a.y0 = ici.y)
      const la = ouEst(a.vers)
      if (la !== undefined) (a.x1 = la.x), (a.y1 = la.y)
      const age = t - a.t0
      if (age < 0) continue
      const u = age / a.vie
      // (un maillon de chaîne : il frappe, bourdonne, puis s'éteint en bégayant ; un arc de drone : un éclair qui retombe)
      const k = a.fort ? (u < 0.15 ? 1 : u < 0.7 ? 0.78 + 0.22 * Math.sin(t * 61 + a.g) : (1 - (u - 0.7) / 0.3) * (Math.floor(age * 60) % 3 === 1 ? 0.5 : 1)) : 1 - u
      const [x0, y0] = ecran(a.x0, a.y0)
      const [x1, y1] = ecran(a.x1, a.y1)
      const R = new N.Rng((a.g * 7919 + image * 31) | 0)
      const L = Math.hypot(x1 - x0, y1 - y0)
      // (un peu moins épais que l'encre du dépôt — Keko, 15/11)
      if (a.fort) stroke(p, bowed(R, x0, y0, x1, y1, -L * R.range(0.05, 0.15), 0.2, 0.1), k, C, 0.75, { light: 0.45 })
      else crackle(p, zigzag(R, x0, y0, x1, y1, 0.3, 0.12), k, C, 0.5)
      p.glow(x1, y1, a.fort ? 9 : 5, C[5], 0.6 * k)
    }
    // L'AURA
    const au = CONF.armes.find((a) => a.aura !== undefined)?.aura
    if (au !== undefined && m.phase === 'vol' && t - arriveA >= ARRIVE_A) {
      const [sx, sy] = ecran(v.x, v.y)
      const r = au.rayon
      p.ring(sx, sy, r, 1, C[4], 0.25 + 0.1 * Math.sin(t * 9))
      p.glow(sx, sy, r, C[3], 0.12)
      const R = new N.Rng((image * 131 + 7) | 0)
      for (let k = 0; k < 7; k++) {
        const a0 = R.range(0, Math.PI * 2)
        const a1 = a0 + R.range(0.25, 0.6)
        const rr = r + R.range(-2, 2)
        crackle(p, zigzag(R, sx + Math.cos(a0) * rr, sy + Math.sin(a0) * rr, sx + Math.cos(a1) * rr, sy + Math.sin(a1) * rr, 0.35, 0.1), 0.55, C, 0.35)
      }
      // (des arcs vers ce qui est dedans, qui sautent d'une image à l'autre)
      let zappe = false
      for (const e of m.ennemis) {
        const d = Math.hypot(e.corps.x - v.x, e.corps.y - v.y)
        if (d > au.rayon + CONF.ennemi.rayon || (image + e.id) % 3 !== 0) continue
        const [ex, ey] = ecran(e.corps.x, e.corps.y)
        const an = Math.atan2(ey - sy, ex - sx)
        crackle(p, zigzag(R, sx + Math.cos(an) * 8, sy + Math.sin(an) * 8, ex, ey, 0.3, 0.1), 0.85, C, 0.5)
        p.glow(ex, ey, 5, C[5], 0.5)
        zappe = true
      }
      if (zappe && t - zapA > 0.12) {
        zapA = t
        jouer('zap')
      }
    }
  }
  /** L'ONDE D'UNE EXPLOSION DE MINI-MISSILE : un anneau orange qui s'ouvre jusqu'à son rayon, en 0,25 s. */
  let ondesDeZone: { x: number; y: number; t0: number; r: number }[] = []
  function dessinerLesConsumes(p: Peintre): void {
    ondesDeZone = ondesDeZone.filter((o) => t - o.t0 < 0.25)
    for (const o of ondesDeZone) {
      const u = (t - o.t0) / 0.25
      const ox = o.x - camera.x + W / 2
      const oy = o.y - camera.y + centreY()
      p.ring(ox, oy, 3 + (o.r - 3) * Math.sqrt(u), 1, u < 0.3 ? N.hex('#fff2a8') : FEU[4], 1 - u)
      // (le cœur de l'explosion : une lueur chaude qui s'éteint — à la place de l'éclair des chocs, dont l'anneau s'ouvrait
      // jusqu'à presque trois fois son rayon : c'était lui, le grand cercle)
      p.glow(ox, oy, 12 * (1 - u) + 4, FEU[5], 0.8 * (1 - u))
    }
    if (parametres.has('consume') && enJeu && m.phase === 'vol' && t - bancConsumeA > 1.6) {
      bancConsumeA = t
      bancConsumeN += 1
      consumer(900000 + bancConsumeN, v.x + 28, v.y - 22, 0, 0)
      jouer('consume', { dx: 28, dy: -22 })
    }
    const dtf = Math.min(0.05, Math.max(0, t - feuDesConsumesA))
    feuDesConsumesA = t
    feuDesConsumes.update(dtf)
    consumes = consumes.filter((b) => !b.fini)
    const F = RAMPE_DU_FEU
    for (const b of consumes) {
      const age = t - b.t0
      const u = Math.min(1, age / DUREE_DE_LA_CONSUMATION)
      // (le front : du premier pixel à brûler jusqu'au-delà du dernier, le temps que le dernier refroidisse et disparaisse)
      const k = b.kMin - 0.02 + (b.kMax + 0.52 - b.kMin) * Math.pow(u, 1.15)
      // (il glisse encore un peu, en freinant)
      const glisse = 0.22 * (1 - Math.exp(-age * 5))
      const ox = b.x + b.vx * glisse
      const oy = b.y + b.vy * glisse
      const sx0 = Math.round(ox - camera.x + W / 2 - b.S / 2)
      const sy0 = Math.round(oy - camera.y + centreY() - b.S / 2)
      for (let j = 0; j < b.S; j++)
        for (let i = 0; i < b.S; i++) {
          const idx = j * b.S + i
          const c = b.color[idx]
          if (c >>> 24 === 0) continue
          const s = k - b.champ[idx]
          const X = sx0 + i
          const Y = sy0 + j
          if (s < 0) {
            // devant le front : il roussit, et la braise l'éclaire
            p.px(X, Y, c)
            if (s > -0.2) {
              p.rect(X, Y, 1, 1, ROUSSI, 0.6 * (1 + s / 0.2))
              p.light(X, Y, F[4], 0.25 * (1 + s / 0.2))
            }
            continue
          }
          if (s >= 0.5) continue
          // le front passe sur lui : il lâche une langue de feu, une braise, un peu de fumée
          if (b.passe[idx] === 0) {
            b.passe[idx] = 1
            const wx = ox - b.S / 2 + i + 0.5
            const wy = oy - b.S / 2 + j + 0.5
            const r = R.next()
            if (r < 0.3) feuDesConsumes.spawn(N.P.FIRE, wx, wy - 1, R.range(-8, 8), -R.range(25, 50), R.range(0.18, 0.4), 0, R.range(0.8, 1.6))
            else if (r < 0.4) feuDesConsumes.spawn(N.P.EMBER, wx, wy, R.range(-30, 30), -R.range(40, 100), R.range(0.4, 0.9), 0, R.next() < 0.25 ? 2 : 1)
            else if (r < 0.45) feuDesConsumes.spawn(N.P.SMOKE, wx, wy - 2, R.range(-5, 5), -R.range(14, 28), R.range(0.6, 1), FUMEE_DU_FEU, R.range(2.2, 3.6))
          }
          // la braise : chauffée à blanc sur la ligne, elle refroidit le long de la rampe jusqu'au charbon
          const col = s < 0.06 ? (alea(i, j, b.t0) > 0.5 ? F[8] : F[7]) : s < 0.12 ? F[6] : s < 0.18 ? F[5] : s < 0.24 ? F[4] : s < 0.3 ? F[3] : s < 0.36 ? F[2] : s < 0.43 ? F[1] : CHARBON
          p.px(X, Y, col)
          if (s < 0.3) p.light(X, Y, F[5], 0.5 * (1 - s / 0.3))
        }
      if (u < 1) p.glow(ox - camera.x + W / 2, oy - camera.y + centreY(), 11, F[5], 0.4 * (1 - u))
      else {
        // au bout : une bouffée de braises et de fumée
        b.fini = true
        for (let n = 0; n < 8; n++) {
          const a = R.range(0, Math.PI * 2)
          const vit = R.range(30, 80)
          feuDesConsumes.spawn(N.P.EMBER, ox, oy, Math.cos(a) * vit, Math.sin(a) * vit * 0.7 - 30, R.range(0.4, 0.8), 0, R.next() < 0.3 ? 2 : 1)
        }
        for (let n = 0; n < 3; n++) feuDesConsumes.spawn(N.P.SMOKE, ox + R.range(-3, 3), oy + R.range(-2, 2), R.range(-6, 6), -R.range(10, 22), R.range(0.8, 1.3), FUMEE_DU_FEU, R.range(3, 4.5))
      }
    }
    p.place(W / 2 - camera.x, centreY() - camera.y)
    feuDesConsumes.draw(p, 'back')
    feuDesConsumes.draw(p, 'front')
    p.place(0, 0)
  }
  /**
   * LES FLAQUES DE NAPALM (Keko, 15/11) : une tache roussie au sol et des langues de feu qui y naissent et montent sans
   * cesse (les bouffées de la Fireball), une lueur ; elles s'allument d'un coup et s'éteignent en baissant. Sous les
   * insectes et les vaisseaux.
   */
  function dessinerLesFlaques(p: Peintre): void {
    if (m.flaques.length === 0) return
    p.place(W / 2 - camera.x, centreY() - camera.y)
    const H_FEU = hotFirst(RAMPE_DU_FEU)
    for (const f of m.flaques) {
      const age = m.t - f.nee
      const k = Math.min(1, age / 0.12) * Math.min(1, (f.duree - age) / 0.8)
      if (k <= 0) continue
      p.circle(f.x, f.y, f.rayon * (0.6 + 0.4 * Math.min(1, age / 0.12)), N.hex('#2a120c'), 0.55 * k)
      p.glow(f.x, f.y, f.rayon * 1.5, FEU[4], 0.35 * k)
      for (let j = 0; j < 10; j++) {
        const a = alea(f.id, j, 1) * Math.PI * 2
        const d = Math.sqrt(alea(f.id, j, 2)) * f.rayon * 0.85
        const ph = (t * (1.6 + alea(f.id, j, 3)) + alea(f.id, j, 4)) % 1
        firePuff(p, f.x + Math.cos(a) * d, f.y + Math.sin(a) * d - ph * 6, (1 - ph) * k, (1.3 + 1.4 * alea(f.id, j, 5)) * (0.5 + 0.5 * k), alea(f.id, j, 6), H_FEU, 0.06, 0, -1)
      }
    }
    p.place(0, 0)
  }
  /** LA GLACE DU FRIMAS : la rampe des effets de glace du dépôt, du plus sombre au blanc. */
  const GLACE = ['#151a3d', '#212f6b', '#2c58aa', '#3a8bd8', '#62c8f4', '#a6ecff', '#dcfbff', '#ffffff'].map((c) => N.hex(c))
  /** (un flocon sans branches : petit, il se dessine en étoile) */
  const FLOCON = { branches: [] as [number, number][], plate: false, fork: false }
  /**
   * LA TRAÎNÉE DE GIVRE DU FRIMAS (voir `Arme.givre`), sous tout : chaque plaque, une tache de glace bleue translucide
   * qui se pose en grandissant et fond en pâlissant, un cœur plus clair ; des cristaux — les petits flocons des effets
   * de glace du dépôt — qui scintillent dessus, des points de givre blanc.
   */
  function dessinerLeGivre(p: Peintre): void {
    if (m.givres.length === 0) return
    p.place(W / 2 - camera.x, centreY() - camera.y)
    // LA TRAÎNÉE DE POISON DU VER, UNE SEULE FLAQUE (Keko, 17/11 : « on dirait une superposition de taches bizarres ; une
    // texture plus uniforme, comme si c'était une seule et même flaque, comme le crachat de la Vouivre qui laisse une trace
    // dans le sol ») : ses plaques se peignent EN DEUX PASSES, PLEINES — d'abord leur bord vif, toutes ; puis leur dedans,
    // toutes, qui recouvre les bords intérieurs : il ne reste qu'un liseré autour du ruban ; le dedans est un goudron dont
    // les veines vert-jaune sont tirées DE LA POSITION DANS LE MONDE — continus d'une plaque à l'autre.
    // Elle s'efface en rétrécissant.
    const rayonDuPoison = (g: (typeof m.givres)[number]): number => {
      const age = m.t - g.nee
      // (… À SA LARGEUR DÈS SA POSE — Keko, 17/11 : « elle commence par un petit point et s'élargit » : la plus jeune, en tête,
      // grandissait encore ; elle ne fait plus que rétrécir en s'effaçant)
      return g.rayon * Math.min(1, Math.max(0, (g.duree - age) / 0.9))
    }
    for (const g of m.givres) {
      if (g.poison !== true) continue
      const r = rayonDuPoison(g)
      if (r >= 1) p.circle(g.x, g.y, r, GOUDRON[5])
    }
    for (const g of m.givres) {
      if (g.poison !== true) continue
      const r = rayonDuPoison(g) - 1
      if (r < 0.6) continue
      p.circle(g.x, g.y, r, (d, ang) => {
        const x = g.x + Math.cos(ang) * d * r
        const y = g.y + Math.sin(ang) * d * r
        const veine = Math.abs(Math.sin(x * 0.33 + Math.sin(y * 0.21 + m.t * 0.8) * 2.2) + Math.sin(y * 0.29 - x * 0.13 - m.t * 0.6))
        if (veine < 0.07) return GOUDRON[6]
        if (veine < 0.18) return GOUDRON[5]
        // (plus de reflet huileux violet — Keko, 17/11 : « c'est un peu bizarre, les taches violettes » : sur un ruban
        // si étroit, ce n'étaient plus des reflets, mais des taches)
        return veine < 0.45 ? GOUDRON[4] : GOUDRON[3]
      })
    }
    for (const g of m.givres) {
      if (g.poison !== true) continue
      const r = rayonDuPoison(g)
      const q = (m.t * 0.8 + alea(g.id, 1, 1)) % 1
      if (r > 3 && alea(g.id, 1, 4) < 0.4) p.dot(g.x + (alea(g.id, 1, 2) - 0.5) * r, g.y + (alea(g.id, 1, 3) - 0.5) * r - q * 5, q < 0.5 ? MIASME[7] : MIASME[6], 0.8 * (1 - q))
    }
    // LE VERGLAS DE LA NOVA (Keko, 17/11) : une grande plaque de glace lisse, plus claire au bord, fêlée de lignes blanches
    // qui partent du milieu, son bord givré, des reflets qui passent
    for (const g of m.givres) {
      if (g.verglas !== true) continue
      const age = m.t - g.nee
      const k = Math.min(1, age / 0.3) * Math.min(1, (g.duree - age) / 0.8)
      if (k <= 0) continue
      const r = g.rayon * (0.4 + 0.6 * (1 - Math.pow(1 - Math.min(1, age / 0.35), 3)))
      p.disc(g.x, g.y, r, (d) => (d > 0.85 ? GLACE[5] : d > 0.55 ? GLACE[4] : GLACE[3]), (d) => (0.22 + 0.2 * d * d) * k)
      for (let j = 0; j < 7; j++) {
        let a = alea(g.id, j, 11) * Math.PI * 2
        let x = g.x + Math.cos(a) * r * 0.15
        let y = g.y + Math.sin(a) * r * 0.15
        for (let s = 0; s < 4; s++) {
          a += (alea(g.id, j * 4 + s, 12) - 0.5) * 0.8
          const l = r * (0.18 + 0.1 * alea(g.id, j * 4 + s, 13))
          p.line(x, y, x + Math.cos(a) * l, y + Math.sin(a) * l, GLACE[6], 0.5 * k)
          x += Math.cos(a) * l
          y += Math.sin(a) * l
        }
      }
      for (let j = 0; j < 28; j++) {
        const a = (j / 28) * Math.PI * 2 + alea(g.id, j, 14) * 0.2
        if (alea(g.id, j, 15) < 0.5) p.px(Math.round(g.x + Math.cos(a) * r), Math.round(g.y + Math.sin(a) * r), N.WHITE)
      }
      for (let j = 0; j < 3; j++) {
        const sc = 0.5 + 0.5 * Math.sin(m.t * (2.5 + j) + alea(g.id, j, 16) * 6)
        if (sc > 0.8) N.sparkle(p, g.x + (alea(g.id, j, 17) - 0.5) * r * 1.2, g.y + (alea(g.id, j, 18) - 0.5) * r * 1.2, 2, N.WHITE, GLACE[5], 0.7 * k)
      }
    }
    for (const g of m.givres) {
      if (g.poison === true || g.verglas === true) continue
      const age = m.t - g.nee
      const k = Math.min(1, age / 0.15) * Math.min(1, (g.duree - age) / 0.8)
      if (k <= 0) continue
      const r = g.rayon * (0.55 + 0.45 * Math.min(1, age / 0.15))
      p.circle(g.x, g.y, r, GLACE[2], 0.16 * k)
      p.circle(g.x + 0.5, g.y - 0.5, r * 0.6, GLACE[4], 0.12 * k)
    }
    for (const g of m.givres) {
      if (g.poison === true || g.verglas === true) continue
      const age = m.t - g.nee
      const k = Math.min(1, age / 0.15) * Math.min(1, (g.duree - age) / 0.8)
      if (k <= 0) continue
      for (let j = 0; j < 2; j++) {
        const a = alea(g.id, j, 1) * Math.PI * 2
        const d = Math.sqrt(alea(g.id, j, 2)) * g.rayon * 0.8
        const scint = 0.5 + 0.5 * Math.sin(t * (3 + 2 * alea(g.id, j, 3)) + alea(g.id, j, 4) * 6)
        snowflake(p, Math.round(g.x + Math.cos(a) * d), Math.round(g.y + Math.sin(a) * d), 1.4 + 1.2 * alea(g.id, j, 5), alea(g.id, j, 6) * 3, FLOCON, GLACE, { a: 0.85 * k, hot: scint > 0.85 ? 1 : 0 })
      }
      if (alea(g.id, 7, 1) < 0.5) p.rect(Math.round(g.x + (alea(g.id, 7, 2) - 0.5) * g.rayon), Math.round(g.y + (alea(g.id, 7, 3) - 0.5) * g.rayon), 1, 1, N.WHITE, 0.7 * k)
    }
    p.place(0, 0)
  }
  /**
   * LA NOVA DE GIVRE DU FRIMAS (voir `Arme.nova`) — LA « FROST NOVA » DE PIXELFX VUE DE DESSUS (Keko, 17/11) : un flocon qui
   * éclate au cœur ; UN FRONT DE FROID qui s'ouvre jusqu'à son rayon, blanc puis bleu ; à son passage, DES CRISTAUX qui
   * jaillissent du sol, pointés vers le dehors, plus grands près du vaisseau, qui tiennent puis fondent ; des éclats de
   * glace qui filent.
   */
  const novas: { x: number; y: number; r: number; t0: number; id: number }[] = []
  const DUREE_DE_LA_NOVA = 1.4
  function dessinerLesNovas(p: Peintre): void {
    for (let i = novas.length - 1; i >= 0; i--) if (t - novas[i].t0 > DUREE_DE_LA_NOVA) novas.splice(i, 1)
    if (novas.length === 0) return
    p.place(W / 2 - camera.x, centreY() - camera.y)
    for (const nv of novas) {
      const age = t - nv.t0
      const front = nv.r * (1 - Math.pow(1 - Math.min(1, age / 0.35), 3))
      // (les cristaux : ils jaillissent quand le front les atteint, tiennent, puis fondent)
      for (let j = 0; j < 16; j++) {
        const q = 0.3 + 0.65 * alea(nv.id, j, 1)
        const d = q * nv.r
        if (front < d) continue
        const ne = age - 0.35 * (1 - Math.cbrt(1 - Math.min(1, d / nv.r)))
        const pousse = Math.min(1, ne / 0.1)
        const fond = Math.max(0, Math.min(1, (age - 0.9) / 0.5))
        const h = (6 - 3.5 * q) * pousse * (1 - fond)
        if (h < 0.5) continue
        const a = alea(nv.id, j, 2) * Math.PI * 2
        const bx = nv.x + Math.cos(a) * d
        const by = nv.y + Math.sin(a) * d
        const ux = Math.cos(a)
        const uy = Math.sin(a)
        const w = 1.2 + 0.6 * (1 - q)
        p.poly([[bx - uy * w, by + ux * w], [bx + ux * h, by + uy * h], [bx + uy * w, by - ux * w], [bx - ux * h * 0.3, by - uy * h * 0.3]], GLACE[5])
        p.line(bx, by, bx + ux * h, by + uy * h, ne < 0.05 ? N.WHITE : GLACE[6])
      }
      // (le front : un anneau qui s'ouvre, blanc puis bleu, de plus en plus fin)
      const u = Math.min(1, age / 0.5)
      if (u < 1) {
        p.ring(nv.x, nv.y, front, Math.max(1, 3.5 * (1 - u)), u < 0.3 ? N.WHITE : GLACE[6], 1 - u)
        p.glow(nv.x, nv.y, front, GLACE[4], 0.35 * (1 - u))
      }
      // (le flocon qui éclate au cœur, et les éclats qui filent)
      if (age < 0.25) snowflake(p, Math.round(nv.x), Math.round(nv.y), 2 + 5 * (age / 0.25), age * 8, FLOCON, GLACE, { a: 1 - age / 0.25, hot: 1 })
      if (age < 0.5)
        for (let j = 0; j < 12; j++) {
          const a = alea(nv.id, j, 21) * Math.PI * 2
          const d = nv.r * 1.1 * Math.min(1, age / 0.5) * (0.5 + 0.5 * alea(nv.id, j, 22))
          p.px(Math.round(nv.x + Math.cos(a) * d), Math.round(nv.y + Math.sin(a) * d), j % 3 === 0 ? N.WHITE : GLACE[6])
        }
    }
    p.place(0, 0)
  }
  /**
   * LES TORNADES DE GIVRE DU FRIMAS (voir `Arme.tornade`), LE « BLIZZARD VORTEX » DU DÉPÔT VU D'EN HAUT (Keko, 15/11 :
   * « inspire-toi de Blizzard Vortex de pixelfx — vue d'en haut ») — ses ingrédients, mis à plat :
   * - LE CORPS : un disque d'air chargé de neige, translucide (mélangé sans trame), plus dense au bord — on y regarde à
   *   travers plus de neige —, strié de trois bandes en spirale qui tournent ;
   * - LA LUMIÈRE FROIDE dans sa gorge : des lueurs bleues, un cœur blanc ;
   * - LES TRAÎNÉES DE VENT : des arcs de neige, une tête blanche et une queue qui pâlit, plus rapides près du cœur, et
   *   ASPIRÉES vers lui (en vue de côté, elles montent le long de l'entonnoir) ;
   * - LES FLOCONS EN ORBITE, leur petite traînée derrière eux, les plus gros en croix avec leur lueur ;
   * - LA NEIGE QUI BOUILLONNE AU PIED : des bouffées douces qui tournent sur le bord et s'en échappent.
   * Elle s'ouvre en naissant et se resserre en s'éteignant.
   */
  function dessinerLesTornades(p: Peintre): void {
    if (m.tornades.length === 0) return
    p.place(W / 2 - camera.x, centreY() - camera.y)
    for (const tn of m.tornades) {
      const to = CONF.armes[tn.arme]?.tornade
      if (to === undefined) continue
      const age = m.t - tn.nee
      const k = Math.min(1, age / 0.3) * Math.min(1, (to.duree - age) / 0.5)
      if (k <= 0) continue
      const R = to.rayon * (0.45 + 0.55 * k)
      const rot = m.t * 5 + tn.id
      // (le pied : des bouffées de neige qui tournent sur le bord et s'en échappent, sous le reste)
      for (let j = 0; j < 6; j++) {
        const vie = 0.9 + 0.4 * alea(tn.id, j, 1)
        const u = ((m.t + alea(tn.id, j, 2) * vie) % vie) / vie
        const an = alea(tn.id, j, 3) * Math.PI * 2 + m.t * 4.5
        const d = R * (0.8 + 0.6 * u)
        const ra = 1.5 + 3 * u
        const a = 0.45 * (1 - u) * Math.min(1, u / 0.1) * k
        p.disc(tn.x + Math.cos(an) * d, tn.y + Math.sin(an) * d, ra, GLACE[6], (dd) => a * (1 - dd * dd))
      }
      // (le corps : translucide, dense au bord, trois bandes en spirale)
      p.disc(tn.x, tn.y, R, (d, ang) => {
        const rim = d * d * d
        const swirl = 0.5 + 0.5 * Math.sin(3 * ang - rot * 1.4 + d * 7)
        // (des bandes claires et des creux sombres, bien distincts : on lit le tourbillon)
        return rim > 0.6 ? GLACE[6] : swirl > 0.55 ? GLACE[6] : GLACE[2]
      }, (d, ang) => {
        const rim = d * d * d
        const swirl = 0.5 + 0.5 * Math.sin(3 * ang - rot * 1.4 + d * 7)
        return (0.06 + 0.22 * rim + 0.4 * swirl * swirl) * Math.min(1, (1 - d) / 0.15) * k
      })
      // (la lumière froide dans sa gorge — retenue : trop forte, elle en faisait une boule de lumière)
      p.glow(tn.x, tn.y, R * 1.5, GLACE[4], 0.14 * k)
      p.glow(tn.x, tn.y, R * 0.5, GLACE[5], (0.22 + 0.06 * Math.sin(m.t * 12)) * k)
      p.glow(tn.x, tn.y, 2, N.WHITE, 0.25 * k)
      // (les traînées de vent : des arcs aspirés vers le cœur, plus rapides près de lui)
      for (let j = 0; j < 9; j++) {
        const vie = 0.6 + 0.35 * alea(tn.id, j, 4)
        const u = ((m.t + alea(tn.id, j, 5) * vie) % vie) / vie
        const r = R * (1.05 - 0.7 * u)
        const w = (7 + 4 * alea(tn.id, j, 6)) * (1.5 - r / R)
        const th = alea(tn.id, j, 7) * Math.PI * 2 + m.t * w
        const fondu = Math.min(1, u / 0.12) * (u > 0.75 ? (1 - u) / 0.25 : 1) * k
        const L = 0.8 + 0.6 * alea(tn.id, j, 8)
        const n = Math.ceil(L / 0.09)
        for (let i = 0; i <= n; i++) {
          const a = th - i * 0.09
          const q = i / n
          const rr = r + q * 1.5
          p.dot(tn.x + Math.cos(a) * rr, tn.y + Math.sin(a) * rr, q < 0.15 ? N.WHITE : q < 0.5 ? GLACE[6] : GLACE[5], fondu * (q < 0.6 ? 1 : 1.5 - q * 1.2))
        }
      }
      // (les flocons en orbite : une petite traînée, une tête claire ; les gros en croix, avec leur lueur)
      for (let j = 0; j < 12; j++) {
        const r = R * (0.35 + 0.75 * alea(tn.id, j, 9))
        const w = (6 + 4 * alea(tn.id, j, 10)) * (1.5 - r / R)
        const th = alea(tn.id, j, 11) * Math.PI * 2 + m.t * w
        const x = tn.x + Math.cos(th) * r
        const y = tn.y + Math.sin(th) * r
        p.line(tn.x + Math.cos(th - 0.3) * r, tn.y + Math.sin(th - 0.3) * r, x, y, GLACE[4], 0.6 * k)
        p.dot(x, y, j % 2 === 0 ? N.WHITE : GLACE[6], k)
        if (j % 4 === 0) {
          for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) p.dot(x + dx, y + dy, GLACE[6], k)
          p.glow(x, y, 4, GLACE[5], 0.3 * k)
        }
      }
    }
    p.place(0, 0)
  }
  /**
   * LE PLASMA DU PULSAR (Keko, 16/11 : « des explosions de plasma violet-bleu »), les teintes du « Plasma explosion » de
   * pixelfx — dont l'effet, de deux cents pixels, ne tient pas dans la vue du vol : ses ingrédients, redessinés à la taille
   * de l'éclat. L'ORBE en vol : une boule qui bout — un cœur blanc, des bandes bleues et violettes qui tournent —, une
   * traîne violette, une lueur, un arc qui crépite de temps en temps. L'ÉCLAT : un flash blanc ; la boule qui enfle puis
   * se creuse en coquille ; deux ondes, bleue et violette ; des arcs d'éclair qui partent d'elle ; des étincelles.
   */
  const PLASMA = ['#0a0828', '#1a1c6e', '#2c3cc0', '#4a7cf0', '#7cc0ff', '#c8ecff', '#ffffff'].map((c) => N.hex(c))
  const PLASMA_V = ['#1c0a30', '#4a1a8c', '#8a3ce0', '#c48cff', '#f0d8ff'].map((c) => N.hex(c))
  const DUREE_DE_L_ECLAT = 0.55
  const eclatsDePlasma: { x: number; y: number; t0: number; r: number; id: number }[] = []
  /**
   * L'ESSAIM DU PULSAR, L'« ARCANE MISSILES » DE PIXELFX EN PLASMA (Keko, 16/11) : chaque missile, une TÊTE en couches —
   * violette, bleue, blanche au cœur — et deux rayons qui tournent ; derrière lui, UN RUBAN qui s'effile, deux brins qui
   * s'y enroulent ; quand il disparaît (il touche, ou sa course finit), UN « POP » : un disque blanc, une croix, un anneau
   * qui s'ouvre. Le ruban se garde ici, par missile, d'une image à l'autre.
   */
  const rubans = new Map<number, [number, number][]>()
  const taillesVues = new Map<number, number>()
  const popsDEssaim: { x: number; y: number; t0: number; k: number }[] = []
  /** (les petits traits arcaniques de la sphère : les mêmes, aux six dixièmes) */
  const tailleDuTrait = (arme: string): number => (arme === 'arcane' ? 0.6 : 1)
  const DUREE_DU_POP = 0.3
  function dessinerLEssaim(p: Peintre): void {
    const missiles = m.obus.filter((o) => o.arme === 'essaim' || o.arme === 'arcane')
    const tailles = new Map(missiles.map((o) => [o.id, tailleDuTrait(o.arme)]))
    const vivants = new Set(missiles.map((o) => o.id))
    for (const [id, pts] of rubans) if (!vivants.has(id)) {
      if (pts.length > 0) popsDEssaim.push({ x: pts[0][0], y: pts[0][1], t0: t, k: taillesVues.get(id) ?? 1 })
      taillesVues.delete(id)
      rubans.delete(id)
    }
    for (const o of missiles) {
      const pts = rubans.get(o.id) ?? []
      pts.unshift([o.x, o.y])
      // (un ruban plus long : on y lit les zigzags)
      if (pts.length > (o.arme === 'arcane' ? 8 : 14)) pts.pop()
      rubans.set(o.id, pts)
      taillesVues.set(o.id, tailles.get(o.id) ?? 1)
    }
    for (let i = popsDEssaim.length - 1; i >= 0; i--) if (t - popsDEssaim[i].t0 > DUREE_DU_POP) popsDEssaim.splice(i, 1)
    for (const o of missiles) {
      const pts = rubans.get(o.id) ?? []
      const n = pts.length
      const K = tailles.get(o.id) ?? 1
      // (le ruban : il s'effile vers la queue, clair près de la tête, violet au bout)
      for (let i = n - 1; i >= 1; i--) {
        const u = i / Math.max(1, n - 1)
        const [x0, y0] = pts[i]
        const [x1, y1] = pts[i - 1]
        const c = u < 0.2 ? PLASMA[4] : u < 0.5 ? PLASMA[3] : PLASMA_V[2]
        p.line(x0, y0, x1, y1, c, 1 - u * 0.7)
        p.disc(x0, y0, (1.7 * Math.pow(1 - u, 0.8) + 0.3) * K, u < 0.4 ? PLASMA[3] : PLASMA_V[2], (d) => (1 - u) * 0.75 * (1 - d))
        // (les deux brins qui s'enroulent, vifs quand ils passent devant)
        const L = Math.hypot(x1 - x0, y1 - y0) || 1
        const nx = -(y1 - y0) / L
        const ny = (x1 - x0) / L
        for (const s of [0, Math.PI]) {
          const ph = u * 10 - t * 26 + o.id + s
          if (Math.cos(ph) > -0.2) p.dot(x0 + nx * Math.sin(ph) * 2.4 * K, y0 + ny * Math.sin(ph) * 2.4 * K, Math.cos(ph) > 0.4 ? PLASMA_V[4] : PLASMA_V[3], 1 - u)
        }
      }
      // (la tête : des couches, deux rayons qui tournent, sa lueur)
      for (let k = 0; k < 2; k++) {
        const a = t * 24 + k * Math.PI + o.id
        const l = (3.6 + Math.sin(t * 50 + k)) * K
        p.line(o.x + Math.cos(a) * 2 * K, o.y + Math.sin(a) * 2 * K, o.x + Math.cos(a) * l, o.y + Math.sin(a) * l, PLASMA[5])
      }
      p.glow(o.x, o.y, 9 * K, PLASMA_V[2], 0.5)
      p.circle(o.x, o.y, 2.5 * K, PLASMA_V[2])
      p.circle(o.x, o.y, 1.8 * K, PLASMA[3])
      p.circle(o.x, o.y, 1.1 * K, PLASMA[5])
      p.px(Math.round(o.x), Math.round(o.y), N.WHITE)
      p.glow(o.x, o.y, 3, PLASMA[4], 0.3)
    }
    for (const q of popsDEssaim) {
      const u = (t - q.t0) / DUREE_DU_POP
      if (u < 0.4) {
        const r = (4 * (1 - u / 0.4) + 1) * q.k
        p.circle(q.x, q.y, r + 1, PLASMA[4])
        p.circle(q.x, q.y, r, N.WHITE)
        const l = Math.round((8 * (1 - u / 0.4) + 2) * q.k)
        for (let d = -l; d <= l; d++) {
          const a = Math.abs(d) / l
          const c = a < 0.3 ? N.WHITE : a < 0.65 ? PLASMA[5] : PLASMA_V[3]
          p.dot(q.x + d, q.y, c, 1.15 - a)
          p.dot(q.x, q.y + d * 0.7, c, 1.15 - a)
        }
      }
      p.ring(q.x, q.y, (2 + 9 * (1 - (1 - u) * (1 - u) * (1 - u))) * q.k, 1, u < 0.3 ? N.WHITE : PLASMA_V[3], Math.min(1, 1.2 - u))
      p.glow(q.x, q.y, 10 * q.k, PLASMA_V[2], 0.4 * (1 - u))
    }
  }
  /**
   * LA SPHÈRE DE PLASMA (Keko, 16/11 : « la sphère qu'on dessine lors de l'explosion ») : la boule de l'éclat, pleine et à
   * demeure — PUIS UNE ORBE À MOITIÉ TRANSPARENTE ET VIDE (Keko, 16/11) : un voile à peine teinté, une paroi qui bout, des
   * ondes qui courent du cœur au bord, des arcs brisés qui la traversent, un arc d'anneau qui tourne, sa lueur ; elle s'ouvre en naissant, se resserre en s'éteignant, et FLASHE quand
   * elle tire (`sphereTirA`).
   */
  // (10 : à 8, on n'y lisait ni les ondes ni les arcs)
  const RAYON_DE_LA_SPHERE = 10
  const sphereTirA = new Map<number, number>()
  /** L'instant du dernier « tsip » des petits traits (pas plus d'un tous les dixièmes). */
  let arcaneSonneA = -10
  /** LES TRAITS DU RAILGUN qui viennent de partir (voir l'événement `rail`) : un trait épais qui s'amincit et pâlit. */
  const DUREE_DU_RAIL = 0.32
  const traitsDuRail: { x0: number; y0: number; x1: number; y1: number; t0: number }[] = []
  /** LES ÉCLATS DE GLACE QUI SE BRISENT (voir l'événement `eclatement`) : un éclair blanc et une étoile, 0,2 s. */
  const eclatsBrises: { x: number; y: number; t0: number }[] = []
  let eclatementSonneA = -10
  function dessinerLesSpheres(p: Peintre): void {
    for (const s of m.spheres) {
      const sp = CONF.armes[s.arme]?.sphere
      if (sp === undefined) continue
      const age = m.t - s.nee
      const k = Math.min(1, age / 0.18) * Math.min(1, (sp.duree - age) / 0.25)
      if (k <= 0) continue
      const R = RAYON_DE_LA_SPHERE * (0.4 + 0.6 * k) * (1 + 0.06 * Math.sin(t * 9 + s.id))
      const flash = Math.max(0, 1 - (t - (sphereTirA.get(s.id) ?? -10)) / 0.15)
      // (UNE ORBE À MOITIÉ TRANSPARENTE ET VIDE — Keko, 16/11 : « l'espèce d'étoile à l'intérieur, c'est un peu moche, et ça
      // lui donne une texture pleine ; plutôt une orbe à moitié transparente, vide, parcourue par des ondes et de
      // l'énergie » : plus de cœur blanc ni de lueur au centre ; un voile à peine teinté, une paroi qui bout, des ondes qui
      // courent du cœur au bord, des arcs qui la traversent)
      p.glow(s.x, s.y, R * 2.2, PLASMA_V[2], (0.3 + 0.2 * flash) * k)
      p.disc(s.x, s.y, R, (d, ang) => {
        const dd = d + 0.06 * Math.sin(ang * 5 + t * 20 + s.id)
        return dd > 0.86 ? (flash > 0.3 ? PLASMA[5] : PLASMA_V[3]) : dd > 0.72 ? PLASMA[4] : PLASMA_V[2]
      }, (d, ang) => {
        const dd = d + 0.06 * Math.sin(ang * 5 + t * 20 + s.id)
        const bord = Math.min(1, (1 - d) / 0.1)
        return (dd > 0.86 ? 0.9 : dd > 0.72 ? 0.4 + 0.2 * flash : 0.07 + 0.12 * d * d) * k * bord
      })
      // (les ondes : trois anneaux tremblés qui naissent au cœur et s'ouvrent jusqu'à la paroi, en s'effaçant ; un tir en relance une, vive)
      for (let j = 0; j < 3; j++) {
        const u = (t * 1.3 + j / 3 + s.id * 0.37) % 1
        const r = R * (0.12 + 0.72 * u)
        const a = (0.55 * (1 - u) + 0.3 * flash) * k
        for (let an = 0; an < Math.PI * 2; an += 0.5 / Math.max(1, r)) {
          const rr = r + Math.sin(an * 4 + t * 9 + j) * 0.7
          p.dot(s.x + Math.cos(an) * rr, s.y + Math.sin(an) * rr, u < 0.45 ? PLASMA[5] : PLASMA[4], a)
        }
      }
      // (l'énergie : deux arcs brisés qui la traversent d'un point de la paroi à un autre, changés à chaque image)
      const ticA = Math.floor(t * 18)
      for (let j = 0; j < 2; j++) {
        if (alea(s.id + ticA, j, 11) < 0.3) continue
        const a0 = alea(s.id + ticA, j, 12) * Math.PI * 2
        const a1 = a0 + Math.PI * (0.55 + 0.6 * alea(s.id + ticA, j, 13))
        let px = s.x + Math.cos(a0) * R * 0.82
        let py = s.y + Math.sin(a0) * R * 0.82
        const qx = s.x + Math.cos(a1) * R * 0.82
        const qy = s.y + Math.sin(a1) * R * 0.82
        for (let q = 1; q <= 4; q++) {
          const f = q / 4
          const jit = q === 4 ? 0 : (alea(s.id + ticA, j, 14 + q) - 0.5) * R * 0.5
          const nx = px + (qx - px) * (1 / (5 - q)) + jit * Math.cos(a0 + Math.PI / 2)
          const ny = py + (qy - py) * (1 / (5 - q)) + jit * Math.sin(a0 + Math.PI / 2)
          p.line(px, py, nx, ny, f < 0.5 ? PLASMA[5] : PLASMA_V[4], 0.75 * k)
          px = nx
          py = ny
        }
      }
      // (UN SEUL ARC D'ANNEAU qui tourne autour, discret : l'anneau plein et le second arc, avec les arcs qui crépitaient
      // au dehors, brouillaient le bord — l'énergie est dedans)
      const a0 = t * 3 + s.id
      for (const dep of [a0, a0 + Math.PI]) for (let a = dep; a < dep + 1.2; a += 0.1) p.dot(s.x + Math.cos(a) * (R + 2), s.y + Math.sin(a) * (R + 2), PLASMA_V[4], 0.5 * k)
    }
  }
  /**
   * LE PUITS (voir Arme.puits) — UN MINI TROU NOIR (Keko, 16/11 : « pour le puits au milieu, un genre de mini trou noir,
   * c'est plus cool » ; c'était une singularité de plasma violet, au Pulsar d'abord). EN VOL : une petite bille noire cerclée
   * de magenta, sa traîne sombre. OUVERT : l'espace s'assombrit autour de lui ; un DISQUE D'ACCRÉTION — trois bras en
   * spirale qui s'enroulent vers lui en tournant, de plus en plus chauds vers le centre — ; des grains aspirés du bord
   * qui y tombent en tournant ; L'ANNEAU DE PHOTONS, mince et vif, plus clair d'un côté ; L'HORIZON, un disque noir qui
   * grossit jusqu'à l'éclat ; le cercle de son rayon qui bat de plus en plus vite. L'éclat : il s'effondre (`effondrements`).
   */
  const VIDE = ['#06010a', '#1a0516', '#3d0a33', '#701560', '#b0228f', '#f53cd1', '#ff86e6', '#ffd2f6'].map((c) => N.hex(c))
  const NOIR_DU_TROU = N.hex('#020004')
  const effondrements: { x: number; y: number; t0: number; r: number }[] = []
  function dessinerLesPuits(p: Peintre): void {
    for (let i = effondrements.length - 1; i >= 0; i--) if (t - effondrements[i].t0 > 0.5) effondrements.splice(i, 1)
    for (const pu of m.puits) {
      const conf = CONF.armes[pu.arme]?.puits
      if (conf === undefined) continue
      if (!pu.ouvert) {
        const dx = pu.x - pu.x0
        const dy = pu.y - pu.y0
        const l = Math.hypot(dx, dy) || 1
        for (let k = 1; k <= 4; k++) p.circle(pu.cx - (dx / l) * k * 2.5, pu.cy - (dy / l) * k * 2.5, 2.5 - k * 0.4, VIDE[2], 0.45 - k * 0.08)
        p.glow(pu.cx, pu.cy, 6, VIDE[4], 0.35)
        p.circle(pu.cx, pu.cy, 3, VIDE[5])
        p.circle(pu.cx, pu.cy, 2.2, NOIR_DU_TROU)
        continue
      }
      const age = m.t - pu.arrive
      const u = Math.min(1, age / conf.duree)
      const naissance = Math.min(1, age / 0.25)
      const R0 = conf.rayon
      const c = (2.5 + 3 * u) * naissance + 0.5
      // (l'espace s'assombrit autour de lui)
      p.disc(pu.x, pu.y, R0 * 0.7 * naissance, VIDE[0], (d) => 0.55 * (1 - d) * (1 - d))
      // (le cercle de son rayon, qui bat de plus en plus vite)
      p.ring(pu.x, pu.y, R0 * naissance, 1, VIDE[3], 0.2 + 0.18 * Math.sin(age * (8 + 14 * u)))
      // (LE DISQUE D'ACCRÉTION : trois bras en spirale qui s'enroulent vers l'horizon, de plus en plus chauds vers lui)
      const disque = Math.min(R0 * 0.55, c * 4.5) * naissance
      for (let b = 0; b < 3; b++)
        for (let q = 0; q < 30; q++) {
          const f = q / 30
          const r = c + 1 + (disque - c - 1) * (1 - f)
          const a = age * 6 + (b * 2 * Math.PI) / 3 + f * 4.6
          p.dot(pu.x + Math.cos(a) * r, pu.y + Math.sin(a) * r, f > 0.8 ? VIDE[7] : f > 0.55 ? VIDE[6] : f > 0.3 ? VIDE[5] : VIDE[4], (0.25 + 0.7 * f) * naissance)
        }
      // (des grains aspirés du bord, qui tombent vers lui en tournant de plus en plus vite)
      for (let g = 0; g < 14; g++) {
        const ph = (age * 0.9 + g / 14) % 1
        const a = g * 2.4 + ph * ph * 7
        const r = c + (R0 - c) * (1 - ph) * (1 - ph)
        p.dot(pu.x + Math.cos(a) * r, pu.y + Math.sin(a) * r, ph > 0.75 ? N.WHITE : VIDE[5], 0.85 * naissance)
      }
      // (L'ANNEAU DE PHOTONS : mince, vif, plus clair du côté où le disque vient vers nous ; puis L'HORIZON, noir)
      for (let a = 0; a < Math.PI * 2; a += 0.5 / Math.max(1, c + 1)) {
        const face = 0.5 + 0.5 * Math.cos(a - age * 6)
        p.dot(pu.x + Math.cos(a) * (c + 1), pu.y + Math.sin(a) * (c + 1), face > 0.6 ? N.WHITE : face > 0.3 ? VIDE[6] : VIDE[4], 1)
      }
      // (pas de lueur posée sur lui : la lumière s'ajoute par-dessus tout, et l'horizon virait au magenta — il reste noir)
      p.circle(pu.x, pu.y, c, NOIR_DU_TROU)
    }
    // (L'EFFONDREMENT : l'horizon se referme d'un coup sur un point blanc, puis une onde magenta s'ouvre, un trait sombre devant elle)
    for (const e of effondrements) {
      const age = t - e.t0
      if (age < 0.1) {
        const k = 1 - age / 0.1
        p.circle(e.x, e.y, 6 * k + 1, NOIR_DU_TROU)
        p.circle(e.x, e.y, 1, N.WHITE)
        p.glow(e.x, e.y, 10, VIDE[6], 0.9)
        continue
      }
      const u = (age - 0.1) / 0.4
      const r = e.r * 1.2 * (1 - (1 - u) * (1 - u))
      p.ring(e.x, e.y, r + 1.5, 1, VIDE[1], 0.6 * (1 - u))
      p.ring(e.x, e.y, r, u < 0.4 ? 2 : 1, u < 0.25 ? VIDE[7] : u < 0.6 ? VIDE[6] : VIDE[4], 0.9 * (1 - u))
      if (u < 0.3) p.glow(e.x, e.y, 12, VIDE[5], 0.7 * (1 - u / 0.3))
    }
  }
  function dessinerLeRailgun(p: Peintre): void {
    for (let i = traitsDuRail.length - 1; i >= 0; i--) if (t - traitsDuRail[i].t0 > DUREE_DU_RAIL) traitsDuRail.splice(i, 1)
    for (const r of traitsDuRail) {
      const u = (t - r.t0) / DUREE_DU_RAIL
      const v1 = 1 - u
      const L = Math.hypot(r.x1 - r.x0, r.y1 - r.y0) || 1
      const nx = -(r.y1 - r.y0) / L
      const ny = (r.x1 - r.x0) / L
      // (le trait : une gaine bleue large qui s'amincit, une bande cyan, une âme blanche ; il pâlit de la bouche au bout —
      // AUX COULEURS DU PRISME, depuis qu'il est à lui : Keko, 16/11, « ça colle mieux avec les cristaux »)
      const demi = Math.max(0, Math.round(3 * v1))
      for (let o = -demi - 1; o <= demi + 1; o++) {
        const bord = Math.abs(o) / (demi + 1)
        const c = bord < 0.3 ? N.WHITE : bord < 0.7 ? FAISCEAU[3] : FAISCEAU[1]
        p.line(r.x0 + nx * o, r.y0 + ny * o, r.x1 + nx * o, r.y1 + ny * o, c, (bord < 0.3 ? 1 : 0.75) * v1)
      }
      // (des nœuds de lumière le long du trait, et le flash à la bouche)
      for (let q = 0; q <= 8; q++) p.glow(r.x0 + ((r.x1 - r.x0) * q) / 8, r.y0 + ((r.y1 - r.y0) * q) / 8, 6 * v1 + 2, q % 2 === 0 ? FAISCEAU[3] : FAISCEAU[1], 0.4 * v1)
      if (u < 0.3) p.glow(r.x0, r.y0, 10, N.WHITE, 0.8 * (1 - u / 0.3))
      // (une spirale d'énergie autour du trait, qui s'efface)
      for (let d = 0; d < L; d += 2) {
        const off = Math.sin(d * 0.35 - t * 40) * (3 + 3 * u)
        p.dot(r.x0 + ((r.x1 - r.x0) * d) / L + nx * off, r.y0 + ((r.y1 - r.y0) * d) / L + ny * off, FAISCEAU[2], 0.7 * v1)
      }
    }
  }
  /**
   * LA MÉTÉORE D'ARCANE DU PULSAR (voir Arme.meteore) — en vue de dessus, CE QUI DIT « D'EN HAUT » (Keko, 16/11 : « tu
   * arriverais à faire un effet où on comprend visuellement que ça vient d'en haut malgré la vue top down ? ») : AU SOL,
   * sous l'insecte, un cercle de runes qui SE RESSERRE et une ombre qui GRANDIT et fonce ; DANS LE CIEL, la météore
   * arrive d'en haut à droite DE PLUS EN PLUS VITE (une chute, pas un vol), GROSSE quand elle est haute — près de nous —,
   * et elle RAPETISSE en tombant, sa traîne derrière elle, jusqu'à se poser pile sur son ombre ; à l'impact, un éclair,
   * le trait de sa chute qui s'efface, une onde au sol, des éclats projetés, un cratère qui refroidit.
   */
  const CIEL_DE_LA_METEORE = { x: 0.4, y: -0.92, hauteur: 120 }
  /** La taille du point de chute (le cercle serré, le cratère) : elle ne frappe que l'insecte, il tient sur lui (Keko, 16/11 : « réduire la taille du cercle »). */
  const POINT_DE_CHUTE = 7
  const DUREE_DU_CRATERE = 1.4
  /**
   * LA MÉTÉORE EN ÉTOILE FILANTE (Keko, 16/11 : « utiliser l'effet "star fall" de pixelfx pour voir, enfin t'en
   * inspirer — garde la méthode actuelle en réserve ») : la tête est une ÉTOILE À QUATRE BRANCHES qui scintille, un
   * cœur blanc, deux lueurs ; la traîne, un long trait effilé qui reprend le chemin de la chute (blanc en tête, puis
   * mauve, puis violet), doublé près de la tête, des paillettes qui s'en détachent ; l'impact, un rond blanc, un
   * éclat à huit rayons, un anneau qui court au sol, une marque qui brille et refroidit — la palette arcane de
   * pixelfx. Le cercle de runes et l'ombre restent. `&meteore=eclat` rend la première météore (l'éclat d'arcane qui
   * rapetisse, le cratère).
   */
  const METEORE_EN_ECLAT = parametres.get('meteore') === 'eclat'
  const ARCANE = ['#140a26', '#2b1252', '#481c88', '#6b2cc0', '#9a48ec', '#c684ff', '#ecc8ff', '#ffffff'].map((c) => N.hex(c))
  /** L'étoile à quatre branches de pixelfx (`sparkle`) : des bras de `bras` pixels, leurs bouts plus pâles, un cœur blanc, sa lueur. */
  const scintillement = (p: Peintre, x: number, y: number, bras: number, c: number, bout: number, k = 0.6): void => {
    const n = Math.round(bras)
    if (n < 1) return
    const X = Math.floor(x)
    const Y = Math.floor(y)
    for (let d = 1; d <= n; d++) for (const [ax, ay] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) p.px(X + ax * d, Y + ay * d, d > n * 0.6 ? bout : c)
    if (n >= 3) for (const [ax, ay] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) p.px(X + ax, Y + ay, c)
    p.px(X, Y, N.WHITE)
    p.glow(x, y, 4 + n * 2, c, k)
  }
  /** L'éclat à huit rayons de pixelfx (`flare`) : longs sur les axes, plus courts entre, qui pâlissent vers leur bout. */
  const eclatAHuitRayons = (p: Peintre, x: number, y: number, L: number, k: number): void => {
    if (L < 1) return
    for (let i = 0; i < 8; i++) {
      const an = (i * Math.PI) / 4
      const len = i % 4 === 0 ? L : i % 2 === 0 ? L * 0.6 : L * 0.3
      for (let d = 0; d <= len; d += 0.5) {
        const u = d / len
        p.dot(x + Math.cos(an) * d, y + Math.sin(an) * d, u < 0.35 ? N.WHITE : u < 0.7 ? ARCANE[6] : ARCANE[5], u < 0.6 ? 1 : k * 1.5 * (1 - u) + 0.2)
      }
    }
  }
  const impactsDeMeteore: { x: number; y: number; t0: number; r: number; id: number }[] = []
  /**
   * LE LANCER (Keko, 16/11 : « un effet visuel sur le vaisseau quand il lance la météore, pour qu'on comprenne que ça
   * vient de lui ») : un éclair et une étoile à la proue, un cercle de runes qui s'ouvre autour du vaisseau, et UNE
   * ÉTOILE QUI MONTE de la proue vers le ciel, dans la diagonale même par où la météore redescend sur sa cible.
   */
  const lancersDeMeteore: { x0: number; y0: number; t0: number; id: number }[] = []
  const DUREE_DU_LANCER = 0.4
  /** Où est la météore à la part `u` de sa chute (0 : au ciel, 1 : au sol), et sa hauteur (1 à 0) : elle tombe, elle accélère. */
  const meteoreEnLAir = (x: number, y: number, u: number): { x: number; y: number; h: number } => {
    const h = 1 - u * u
    return { x: x + CIEL_DE_LA_METEORE.x * CIEL_DE_LA_METEORE.hauteur * h, y: y + CIEL_DE_LA_METEORE.y * CIEL_DE_LA_METEORE.hauteur * h, h }
  }
  function dessinerLesMeteoresAuSol(p: Peintre): void {
    for (let i = impactsDeMeteore.length - 1; i >= 0; i--) if (t - impactsDeMeteore[i].t0 > DUREE_DU_CRATERE) impactsDeMeteore.splice(i, 1)
    if (m.meteores.length === 0 && impactsDeMeteore.length === 0) return
    p.place(W / 2 - camera.x, centreY() - camera.y)
    // (EN ÉTOILE : une marque qui brille où elle est tombée, et refroidit en 0,7 s)
    if (!METEORE_EN_ECLAT)
      for (const c of impactsDeMeteore) {
        const k = 1 - (t - c.t0) / 0.7
        if (k <= 0) continue
        p.dot(c.x, c.y, k > 0.6 ? N.WHITE : ARCANE[6], Math.min(1, k * 1.5))
        for (const ax of [-1, 1]) p.dot(c.x + ax, c.y, ARCANE[5], Math.min(1, k * 1.2))
        p.glow(c.x, c.y, 10, ARCANE[5], 0.35 * k)
      }
    // (LE CRATÈRE : une tache sombre, son bord qui rougeoie violet puis refroidit, quelques braises)
    for (const c of METEORE_EN_ECLAT ? impactsDeMeteore : []) {
      const u = (t - c.t0) / DUREE_DU_CRATERE
      const k = 1 - u
      p.disc(c.x, c.y, c.r * 0.9, PLASMA_V[0], (d) => 0.6 * k * Math.min(1, (1 - d) / 0.3))
      p.ring(c.x, c.y, c.r * 0.9, 1, u < 0.25 ? PLASMA_V[4] : u < 0.55 ? PLASMA_V[3] : PLASMA_V[2], 0.8 * k)
      for (let j = 0; j < 7; j++) {
        const a = alea(c.id, j, 41) * Math.PI * 2
        const r = c.r * (0.25 + 0.6 * alea(c.id, j, 42))
        if (alea(c.id + Math.floor(t * 6), j, 43) < 0.75) p.dot(c.x + Math.cos(a) * r, c.y + Math.sin(a) * r, PLASMA_V[3], k)
      }
    }
    for (const mt of m.meteores) {
      const conf = CONF.armes[mt.arme]?.meteore
      if (conf === undefined) continue
      const u = Math.max(0, Math.min(1, (m.t - mt.lancee) / conf.chute))
      const R = POINT_DE_CHUTE
      // (L'OMBRE : petite et pâle quand la météore est haute, large et sombre quand elle touche)
      p.disc(mt.x, mt.y, R * (0.3 + 0.7 * u), PLASMA_V[0], (d) => (0.2 + 0.5 * u) * (1 - d * d))
      // (LE CERCLE DE RUNES : il se resserre sur l'insecte en tournant, et s'allume — de presque deux fois l'insecte à sa taille)
      const rr = R * (1 + 0.8 * (1 - u) * (1 - u))
      const a0 = m.t * 2.4 + mt.id
      p.ring(mt.x, mt.y, rr, 1, u > 0.75 ? PLASMA_V[4] : PLASMA_V[3], 0.35 + 0.55 * u)
      for (let j = 0; j < 6; j++) {
        const a = a0 + (j * Math.PI) / 3
        const gx = Math.round(mt.x + Math.cos(a) * (rr + 2.5))
        const gy = Math.round(mt.y + Math.sin(a) * (rr + 2.5))
        // (une rune : un petit losange, son cœur blanc une fois sur deux)
        const c = j % 2 === 0 ? PLASMA_V[4] : PLASMA_V[3]
        p.dot(gx, gy - 1, c, 0.9)
        p.dot(gx - 1, gy, c, 0.9)
        p.dot(gx + 1, gy, c, 0.9)
        p.dot(gx, gy + 1, c, 0.9)
        p.dot(gx, gy, j % 2 === 0 ? N.WHITE : PLASMA_V[2], 0.9)
      }
      // (quatre crans qui pointent vers le centre : c'est là qu'elle tombe)
      for (let j = 0; j < 4; j++) {
        const a = -a0 * 0.5 + (j * Math.PI) / 2
        p.line(mt.x + Math.cos(a) * rr * 0.55, mt.y + Math.sin(a) * rr * 0.55, mt.x + Math.cos(a) * rr * 0.8, mt.y + Math.sin(a) * rr * 0.8, PLASMA_V[3], 0.3 + 0.5 * u)
      }
      if (u > 0.6) p.glow(mt.x, mt.y, R * 1.2, PLASMA_V[3], ((u - 0.6) / 0.4) * 0.6)
    }
  }
  function dessinerLesMeteores(p: Peintre): void {
    for (let i = lancersDeMeteore.length - 1; i >= 0; i--) if (t - lancersDeMeteore[i].t0 > DUREE_DU_LANCER) lancersDeMeteore.splice(i, 1)
    if (m.meteores.length === 0 && impactsDeMeteore.length === 0 && lancersDeMeteore.length === 0) return
    p.place(W / 2 - camera.x, centreY() - camera.y)
    const L0 = Math.hypot(CIEL_DE_LA_METEORE.x, CIEL_DE_LA_METEORE.y)
    const dx = CIEL_DE_LA_METEORE.x / L0
    const dy = CIEL_DE_LA_METEORE.y / L0
    // (LE LANCER : il suit le vaisseau — la proue d'aujourd'hui, pas celle du départ —, sauf l'étoile qui monte, partie de là où elle était)
    const armeM = CONF.armes.find((a) => a.meteore !== undefined)
    for (const l of lancersDeMeteore) {
      const age = t - l.t0
      const k = age / DUREE_DU_LANCER
      const b = armeM === undefined ? { x: l.x0, y: l.y0 } : boucheDansLeMonde(v, armeM)
      // (le cercle de runes qui s'ouvre autour du vaisseau, en tournant, et pâlit)
      const e = 1 - Math.pow(1 - k, 3)
      const rr = 11 + 9 * e
      p.ring(v.x, v.y, rr, 1, k < 0.3 ? ARCANE[6] : ARCANE[5], 0.8 * (1 - k))
      for (let j = 0; j < 6; j++) {
        const a = age * 4 + (j * Math.PI) / 3 + l.id
        const gx = Math.round(v.x + Math.cos(a) * rr)
        const gy = Math.round(v.y + Math.sin(a) * rr)
        for (const [ax, ay] of [[0, -1], [-1, 0], [1, 0], [0, 1]]) p.dot(gx + ax, gy + ay, ARCANE[5], 1 - k)
        p.dot(gx, gy, N.WHITE, 1 - k)
      }
      // (l'éclair et l'étoile à la proue, qui s'éteignent vite)
      if (age < 0.18) {
        const f = 1 - age / 0.18
        p.glow(b.x, b.y, 14, ARCANE[5], 0.9 * f)
        if (f > 0.5) p.circle(b.x, b.y, 3 * f + 0.5, N.WHITE)
        scintillement(p, b.x, b.y, 2 + 6 * f, ARCANE[6], ARCANE[5], 0.5)
      }
      // (L'ÉTOILE QUI MONTE : elle file de la proue vers le ciel, vite, sa traîne derrière elle, et s'y perd)
      if (age < 0.3) {
        const vit = 420
        const d = vit * age
        const hx = l.x0 + dx * d
        const hy = l.y0 + dy * d
        const L = Math.min(d, 30)
        for (let s = 0; s <= L; s += 1) {
          const f = s / Math.max(1, L)
          p.dot(hx - dx * s, hy - dy * s, f < 0.15 ? N.WHITE : f < 0.45 ? ARCANE[6] : f < 0.75 ? ARCANE[5] : ARCANE[4], Math.min(1, 1.2 - f))
          if (f < 0.4) p.dot(hx - dx * s + 1, hy - dy * s, ARCANE[5], 0.8 - f)
        }
        const f = 1 - age / 0.3
        scintillement(p, hx, hy, 2 + 3 * f, ARCANE[6], ARCANE[5], 0.5 * f)
        p.circle(hx, hy, 1, N.WHITE)
      }
    }
    for (const mt of m.meteores) {
      const conf = CONF.armes[mt.arme]?.meteore
      if (conf === undefined) continue
      const u = Math.max(0, Math.min(1, (m.t - mt.lancee) / conf.chute))
      const q = meteoreEnLAir(mt.x, mt.y, u)
      if (!METEORE_EN_ECLAT) {
        // (LA TRAÎNE de l'étoile filante : vingt segments le long du chemin des 0,17 dernière seconde, blanc en tête,
        // puis mauve, puis violet ; un second trait à côté près de la tête lui donne du corps)
        const n = 20
        for (let k = n; k >= 1; k--) {
          const ta = m.t - (k * 0.17) / n
          if (ta < mt.lancee) continue
          const a = meteoreEnLAir(mt.x, mt.y, Math.min(1, (ta - mt.lancee) / conf.chute))
          const b = meteoreEnLAir(mt.x, mt.y, Math.min(1, (ta + 0.17 / n - mt.lancee) / conf.chute))
          const f = k / n
          if (f < 0.55) p.line(a.x + 1, a.y, b.x + 1, b.y, f < 0.2 ? ARCANE[6] : ARCANE[5], Math.min(1, 1.1 - f * 1.4))
          p.line(a.x, a.y, b.x, b.y, f < 0.15 ? N.WHITE : f < 0.4 ? ARCANE[6] : f < 0.7 ? ARCANE[5] : ARCANE[4], Math.min(1, 1.3 - f))
          if (k % 3 === 0) p.glow(a.x, a.y, 7 * (1 - f) + 2, ARCANE[5], 0.3 * (1 - f))
        }
        // (des paillettes qui s'en détachent et scintillent un instant)
        const tic = Math.floor(m.t * 15)
        for (let g = 0; g < 6; g++) {
          const f = alea(mt.id + tic, g, 31) * 0.8
          const b = meteoreEnLAir(mt.x, mt.y, Math.max(0, u - f * 0.3))
          const ox = (alea(mt.id + tic, g, 32) - 0.5) * 5
          const oy = (alea(mt.id + tic, g, 33) - 0.5) * 5
          if (alea(mt.id + tic, g, 34) < 0.3) scintillement(p, b.x + ox, b.y + oy, 1.4, ARCANE[6], ARCANE[5], 0.2)
          else p.dot(b.x + ox, b.y + oy, g % 2 === 0 ? N.WHITE : ARCANE[6], 0.9 * (1 - f))
        }
        // (LA TÊTE : une étoile à quatre branches qui scintille, un cœur blanc, deux lueurs — un peu plus grande en haut)
        const bras = (4.5 + Math.sin(m.t * 40 + mt.id)) * (1 + 0.4 * q.h)
        scintillement(p, q.x, q.y, bras, ARCANE[6], ARCANE[5], 0.6)
        p.circle(q.x, q.y, 1.4, N.WHITE)
        p.glow(q.x, q.y, 16, ARCANE[5], 0.6)
        p.glow(q.x, q.y, 5, N.WHITE, 0.35)
        continue
      }
      // (grosse en haut, près de nous ; elle rapetisse en tombant)
      const s = 1 + 1.3 * q.h
      // (LA TRAÎNE : vers le ciel d'où elle vient, plus longue à mesure qu'elle accélère, de plus en plus fine et pâle)
      const L = 8 + 34 * u
      for (let d = L; d >= 0; d -= 1) {
        const f = d / L
        const w = 2.4 * s * (1 - f) + 0.4
        p.circle(q.x + dx * d, q.y + dy * d, w, f < 0.25 ? PLASMA_V[4] : f < 0.6 ? PLASMA_V[3] : PLASMA_V[2], 0.85 * (1 - f))
      }
      // (des étincelles qui s'en détachent, de côté)
      const tic = Math.floor(m.t * 20)
      for (let g = 0; g < 7; g++) {
        const f = alea(mt.id + tic, g, 31)
        const cote = (alea(mt.id + tic, g, 32) - 0.5) * 6 * s * f
        p.dot(q.x + dx * L * f - dy * cote, q.y + dy * L * f + dx * cote, g % 2 === 0 ? N.WHITE : PLASMA_V[4], 0.9 * (1 - f))
      }
      // (LA TÊTE : un éclat d'arcane, son halo, un cœur blanc, un liseré qui bat)
      p.glow(q.x, q.y, 9 * s, PLASMA_V[2], 0.6)
      p.disc(q.x, q.y, 2.8 * s, (d, ang) => (d < 0.3 ? N.WHITE : d < 0.5 ? PLASMA_V[4] : d + 0.12 * Math.sin(ang * 4 + m.t * 30) < 0.82 ? PLASMA_V[3] : PLASMA_V[2]), (d) => Math.min(1, (1 - d) / 0.2))
    }
    // (L'IMPACT EN ÉTOILE : un rond blanc, l'éclat à huit rayons, un anneau qui court au sol en pâlissant)
    if (!METEORE_EN_ECLAT)
      for (const c of impactsDeMeteore) {
        const age = t - c.t0
        if (age < 0.45) {
          const k = age / 0.45
          const e = 1 - Math.pow(1 - k, 3)
          p.ring(c.x, c.y, 3 + 13 * e, Math.max(1, Math.round(2.5 * (1 - k))), k < 0.2 ? N.WHITE : k < 0.5 ? ARCANE[6] : ARCANE[5], Math.min(1, 1.15 - k))
        }
        if (age < 0.22) {
          const k = age / 0.22
          if (k < 0.35) p.circle(c.x, c.y, 5 * (1 - k / 0.35) + 1, N.WHITE)
          eclatAHuitRayons(p, c.x, c.y, 12 * Math.pow(1 - k, 1.5) + 2, 1 - k)
          p.glow(c.x, c.y, 20, ARCANE[5], 0.9 * (1 - k))
        }
      }
    // (L'IMPACT : un éclair blanc, le trait de sa chute qui s'efface, une onde qui court au sol)
    for (const c of METEORE_EN_ECLAT ? impactsDeMeteore : []) {
      const age = t - c.t0
      if (age < 0.12) {
        const k = 1 - age / 0.12
        p.glow(c.x, c.y, c.r * 2.6, N.WHITE, k)
        p.circle(c.x, c.y, c.r * 0.9 * k + 1, N.WHITE, k)
      }
      if (age < 0.2) {
        const k = 1 - age / 0.2
        for (let o = -1; o <= 1; o++) p.line(c.x + o, c.y, c.x + o + dx * 70 * k, c.y + dy * 70 * k, o === 0 ? N.WHITE : PLASMA_V[3], 0.8 * k)
      }
      if (age < 0.45) {
        const u = age / 0.45
        p.ring(c.x, c.y, c.r * (0.6 + 1.2 * Math.sqrt(u)), u < 0.4 ? 2 : 1, u < 0.3 ? PLASMA[5] : PLASMA_V[3], 0.9 * (1 - u))
      }
    }
  }
  /** L'ÉCLAT QUI SE BRISE (l'Ice Shatter en vue de dessus) : un éclair blanc, une étoile à quatre branches, une lueur froide. */
  function dessinerLesEclatsBrises(p: Peintre): void {
    for (let i = eclatsBrises.length - 1; i >= 0; i--) if (t - eclatsBrises[i].t0 > 0.22) eclatsBrises.splice(i, 1)
    if (eclatsBrises.length === 0) return
    p.place(W / 2 - camera.x, centreY() - camera.y)
    for (const b of eclatsBrises) {
      const k = 1 - (t - b.t0) / 0.22
      const x = Math.round(b.x)
      const y = Math.round(b.y)
      p.glow(x, y, 12, GLACE[4], 0.6 * k)
      if (k > 0.6) p.circle(x, y, 3 * k, N.WHITE, k)
      const n = Math.round(6 * k)
      for (let d = 1; d <= n; d++) for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) p.px(x + dx * d, y + dy * d, d > n * 0.6 ? GLACE[5] : N.WHITE)
    }
  }
  function dessinerLePlasma(p: Peintre): void {
    for (let i = eclatsDePlasma.length - 1; i >= 0; i--) if (t - eclatsDePlasma[i].t0 > DUREE_DE_L_ECLAT) eclatsDePlasma.splice(i, 1)
    const orbes = m.obus.filter((o) => o.arme === 'plasma')
    if (orbes.length === 0 && eclatsDePlasma.length === 0 && rubans.size === 0 && popsDEssaim.length === 0 && m.spheres.length === 0 && m.puits.length === 0 && effondrements.length === 0 && traitsDuRail.length === 0 && !m.obus.some((o) => o.arme === 'essaim' || o.arme === 'arcane')) return
    p.place(W / 2 - camera.x, centreY() - camera.y)
    dessinerLesSpheres(p)
    dessinerLesPuits(p)
    dessinerLEssaim(p)
    dessinerLeRailgun(p)
    for (const o of orbes) {
      const l = Math.hypot(o.vx, o.vy) || 1
      const ux = o.vx / l
      const uy = o.vy / l
      // (elle se forme en sortant des cornes : petite d'abord)
      const k = Math.min(1, ((o.vie0 ?? o.vie) - o.vie) / 0.12 + 0.35)
      for (let j = 5; j >= 1; j--) p.disc(o.x - ux * j * 2.2, o.y - uy * j * 2.2, 2.6 * (1 - j / 6) * k, PLASMA_V[2], 0.5 * (1 - j / 6))
      p.glow(o.x, o.y, 13 * k, PLASMA_V[2], 0.55)
      const R = (4.6 + 0.5 * Math.sin(t * 18 + o.id)) * k
      p.disc(o.x, o.y, R, (d, ang) => {
        const b = 0.5 + 0.5 * Math.sin(ang * 3 + t * 25 + o.id)
        return d > 0.75 ? PLASMA_V[2] : d > 0.45 ? (b > 0.5 ? PLASMA[4] : PLASMA_V[3]) : d > 0.2 ? PLASMA[5] : N.WHITE
      }, (d) => Math.min(1, (1 - d) / 0.2))
      p.glow(o.x, o.y, 6 * k, PLASMA[4], 0.45)
      // (un arc qui crépite, un instant sur trois)
      const tic = Math.floor(t * 14 + o.id)
      if (tic % 3 === 0) {
        const a = alea(o.id, tic, 1) * Math.PI * 2
        p.line(o.x + Math.cos(a) * R, o.y + Math.sin(a) * R, o.x + Math.cos(a + 0.5) * (R + 3), o.y + Math.sin(a + 0.5) * (R + 3), PLASMA[5], 0.85)
      }
    }
    for (const e of eclatsDePlasma) {
      const u = (t - e.t0) / DUREE_DE_L_ECLAT
      const v1 = 1 - u
      // (les lueurs : bleue large, violette au cœur)
      p.glow(e.x, e.y, e.r * (1.4 - 0.4 * u), PLASMA_V[2], 0.5 * v1)
      p.glow(e.x, e.y, e.r * 0.7, PLASMA[4], 0.4 * v1)
      // (la boule : elle enfle jusqu'aux trois quarts du rayon, puis se creuse en coquille qui s'amincit — vide au milieu :
      // un voile clair à faible opacité y tournait au gris)
      const rb = e.r * (0.25 + 0.55 * Math.min(1, u / 0.3))
      const creux = Math.max(0, (u - 0.2) / 0.8)
      p.disc(e.x, e.y, rb, (d, ang) => {
        const dd = d + 0.1 * Math.sin(ang * 5 + t * 30 + e.id)
        return dd > 0.82 ? PLASMA_V[3] : dd > 0.6 ? PLASMA_V[2] : dd > 0.35 ? PLASMA[4] : u < 0.25 ? N.WHITE : PLASMA[5]
      }, (d) => (d < creux ? 0 : 0.92 * Math.min(1, (d - creux) / 0.12)) * v1 * Math.min(1, (1 - d) / 0.12))
      // (le flash blanc des premiers centièmes)
      if (u < 0.15) p.disc(e.x, e.y, e.r * (0.35 + u * 2), N.WHITE, (d) => (1 - u / 0.15) * (1 - d * d))
      // (les deux ondes)
      p.ring(e.x, e.y, e.r * (0.3 + 0.75 * Math.sqrt(u)), 1, u < 0.3 ? PLASMA[5] : PLASMA_V[3], v1)
      p.ring(e.x, e.y, e.r * (0.2 + 0.55 * Math.sqrt(u)), 1, PLASMA[3], 0.6 * v1)
      // (les arcs d'éclair, qui changent de forme à chaque image, la première moitié)
      if (u < 0.5) {
        const tic = Math.floor(t * 24)
        for (let j = 0; j < 4; j++) {
          const a = alea(e.id + tic, j, 1) * Math.PI * 2
          let px = e.x + Math.cos(a) * rb * 0.8
          let py = e.y + Math.sin(a) * rb * 0.8
          const fin = e.r * (0.85 + 0.35 * alea(e.id + tic, j, 2))
          for (let s = 1; s <= 4; s++) {
            const rr = rb * 0.8 + ((fin - rb * 0.8) * s) / 4
            const jit = (alea(e.id + tic, j, 3 + s) - 0.5) * 4
            const nx = e.x + Math.cos(a) * rr - Math.sin(a) * jit
            const ny = e.y + Math.sin(a) * rr + Math.cos(a) * jit
            p.line(px, py, nx, ny, s < 3 ? N.WHITE : PLASMA[5], 1 - u * 1.6)
            px = nx
            py = ny
          }
          p.glow(px, py, 3, PLASMA[4], 0.5 * (1 - u * 2))
        }
      }
    }
    p.place(0, 0)
  }
  /** LE VIOLET DE L'OMBRE, du noir au blanc (la palette « void » des effets d'ombre de pixelfx). */
  const OMBRE = ['#06040b', '#150c26', '#2a1150', '#461a84', '#6f2cc0', '#9d5cec', '#cfa6ff', '#f6eaff'].map((c) => N.hex(c))
  const entre01 = (x: number): number => Math.max(0, Math.min(1, x))
  const lisse = (a: number, b: number, x: number): number => {
    const u = entre01((x - a) / (b - a))
    return u * u * (3 - 2 * u)
  }
  /**
   * LE DRAIN D'ÂME (voir `Arme.drain`) — L'EFFET SOUL DRAIN DE PIXELFX, SANS SES ÂMES (Keko, 17/11 : « on utilise le même
   * effet, sans le petit fantôme qui flotte, juste les effets de drain violet ») : de chaque insecte à portée, UN ENTONNOIR
   * de lignes — une courbe propre à l'insecte, pâle, qui s'éclaire en approchant du vaisseau, des tirets qui y coulent vers
   * lui, des traînées plus rapides à tête blanche — ; sur l'insecte, une brume pâle qu'on arrache ; sur le vaisseau, la
   * lueur qui grossit à mesure qu'il boit, des grains qui tournent autour, un anneau à chaque arrivée. Le rayon se devine,
   * un cercle à peine marqué. Tant qu'il purge la corruption, la barre s'éclaire et un frisson sonne de temps en temps.
   */
  let corruptionVue = 0
  let drainSonneA = -10
  let accrocheSonneA = -10
  function dessinerLeDrain(p: Peintre): void {
    const dr = CONF.armes.find((a) => a.drain !== undefined)?.drain
    const avant = corruptionVue
    corruptionVue = m.corruption
    if (dr === undefined || m.phase !== 'vol' || t - arriveA < ARRIVE_A) return
    const C = OMBRE
    const sx = v.x
    const sy = v.y
    const pris = liesAuDrain(m)
    p.place(W / 2 - camera.x, centreY() - camera.y)
    // LA ZONE D'ACCROCHE, UN TOURBILLON SUR SON BORD (Keko, 17/11 : « plutôt qu'un cercle de pointillés, un petit tourbillon
    // sur la périphérie ») : un voile à peine marqué ; quatre traînées qui tournent sur le bord, la tête vive, la queue qui
    // s'éteint en s'enroulant vers l'intérieur ; trois plus pâles qui tournent dans l'autre sens, un peu dehors ; et des
    // grains aspirés du dehors, qui spiralent jusqu'au bord et s'y perdent
    const R = dr.rayon
    p.ring(sx, sy, R, 1, C[2], 0.35)
    const traine = (n: number, vit: number, r0: number, long: number, rentre: number, tons: number[]): void => {
      for (let k = 0; k < n; k++) {
        const tete = t * vit + (k / n) * Math.PI * 2
        const pas = 1.2 / r0
        for (let a = 0; a <= long; a += pas) {
          const u = a / long
          const an = tete - Math.sign(vit) * a
          const rr = r0 - rentre * u
          p.px(Math.round(sx + Math.cos(an) * rr), Math.round(sy + Math.sin(an) * rr), tons[Math.min(tons.length - 1, Math.floor(u * tons.length))])
        }
      }
    }
    traine(3, -0.7, R + 3, 0.7, 2, [C[3], C[2]])
    traine(4, 1.3, R, 1.1, 5, [N.WHITE, C[7], C[6], C[5], C[4], C[3]])
    for (let k = 0; k < 4; k++) {
      const tete = t * 1.3 + (k / 4) * Math.PI * 2
      p.glow(sx + Math.cos(tete) * R, sy + Math.sin(tete) * R, 5, C[5], 0.4)
    }
    for (let k = 0; k < 10; k++) {
      const q = (((t * 0.45 + k / 10) % 1) + 1) % 1
      const an = (k * 2.399) + t * 1.3 + q * 1.6
      const rr = R + 10 * (1 - q)
      p.px(Math.round(sx + Math.cos(an) * rr), Math.round(sy + Math.sin(an) * rr), q > 0.75 ? C[7] : q > 0.4 ? C[5] : C[3])
    }
    for (const e of pris) {
      const ex = e.corps.x
      const ey = e.corps.y
      const L = Math.hypot(sx - ex, sy - ey) || 1
      const nx = -(sy - ey) / L
      const ny = (sx - ex) / L
      // (sa courbe : une cubique de l'insecte au vaisseau, cambrée d'un côté propre à lui)
      const cambre = (((e.id * 7919) % 100) / 100 - 0.5) * 0.9 * Math.min(L, 50)
      const c1x = ex + (sx - ex) * 0.35 + nx * cambre
      const c1y = ey + (sy - ey) * 0.35 + ny * cambre
      const c2x = sx + (ex - sx) * 0.25 + nx * cambre * 0.3
      const c2y = sy + (ey - sy) * 0.25 + ny * cambre * 0.3
      const le = (u: number): [number, number] => {
        const q = 1 - u
        return [q * q * q * ex + 3 * q * q * u * c1x + 3 * q * u * u * c2x + u * u * u * sx, q * q * q * ey + 3 * q * q * u * c1y + 3 * q * u * u * c2y + u * u * u * sy]
      }
      // (la ligne pâle, plus vive vers le vaisseau ; des tirets qui coulent vers lui)
      let [px, py] = le(0)
      const pas = Math.max(0.04, 1.5 / L)
      for (let u = pas; u <= 1.0001; u += pas) {
        const [x, y] = le(u)
        p.line(px, py, x, y, u > 0.6 ? C[5] : C[4], 0.45 + 0.5 * u)
        const tiret = (((u * 5 - t * 2.2 + e.id * 0.3) % 1) + 1) % 1
        if (tiret < 0.18) p.px(Math.round(x), Math.round(y), u > 0.5 ? C[7] : C[6])
        ;[px, py] = [x, y]
      }
      // (deux traînées qui filent, de plus en plus vite, la tête blanche)
      for (let k = 0; k < 2; k++) {
        const ph = (((t * 1.4 + k * 0.5 + e.id * 0.37) % 1) + 1) % 1
        const q = Math.pow(ph, 2.2)
        const q2 = Math.pow(Math.max(0, ph - 0.07), 2.2)
        const [hx, hy] = le(q)
        const [qx, qy] = le(q2)
        p.line(qx, qy, hx, hy, C[6])
        p.px(Math.round(hx), Math.round(hy), N.WHITE)
        p.glow(hx, hy, 3, C[6], 0.35)
      }
      // (sur l'insecte, la brume pâle qu'on arrache)
      for (let k = 0; k < 3; k++) {
        const ph = (((t * 1.1 + k / 3 + e.id * 0.21) % 1) + 1) % 1
        const a = e.id * 1.7 + k * 2.1
        if (ph < 0.7) p.px(Math.round(ex + Math.cos(a) * (2 + ph * 4)), Math.round(ey + Math.sin(a) * (2 + ph * 4) - ph * 3), ph < 0.35 ? C[7] : C[5])
      }
      p.glow(ex, ey, 7, C[5], 0.4)
    }
    // (sur le vaisseau : la lueur qui grossit avec ce qu'il boit, les grains qui tournent, l'anneau des arrivées)
    if (pris.length > 0) {
      const f = Math.min(1, pris.length / 3)
      p.glow(sx, sy, 14 + 8 * f, C[5], 0.3 + 0.25 * f)
      for (let k = 0; k < 6; k++) {
        const a = t * 4 + (k * Math.PI * 2) / 6
        const z = Math.sin(a)
        p.px(Math.round(sx + Math.cos(a) * 11), Math.round(sy + Math.sin(a) * 4 - 1), z > 0 ? C[7] : C[4])
        if (z > 0) p.glow(sx + Math.cos(a) * 11, sy + Math.sin(a) * 4 - 1, 3, C[6], 0.3)
      }
      const arrivee = (t * 1.4) % 0.5
      if (arrivee < 0.25) {
        const k = arrivee / 0.25
        p.ring(sx, sy, 5 + 9 * (1 - (1 - k) * (1 - k)), Math.max(1, 2 * (1 - k)), k < 0.4 ? C[7] : k < 0.7 ? C[5] : C[3], 0.8 * (1 - k))
      }
      // (la vie prise purge la corruption : la barre s'éclaire, un frisson de temps en temps)
      if (m.corruption < avant - 1e-6) {
        purgeA = t
        if (t - drainSonneA > 1.4) {
          drainSonneA = t
          jouer('purge')
        }
      }
    }
    p.place(0, 0)
  }
  /**
   * LES VRILLES D'OMBRE (voir `Arme.vrille`) — L'EFFET SHADOW TENDRILS DE PIXELFX, VU DE DESSUS (Keko, 17/11) : UNE FLAQUE
   * D'OMBRE s'ouvre (un noir cerclé de violet, des rides, une brume qui monte), une TENTACULE en jaillit — un corps sombre
   * plus clair du côté de la lumière, un liseré vif, une pulsation qui la parcourt, un crochet au bout, la pointe blanche —,
   * ondule, se penche vers sa dernière proie ; à la fin, elle rentre et la flaque se referme.
   * QUAND ELLE SAISIT (Keko, 17/11 : « la tentacule saisit un ennemi et s'enroule autour de lui ») : elle file en courbe
   * jusqu'à l'insecte en 0,15 s et S'ENROULE autour de lui — un tour et demi qui se resserre, qui bat quand elle serre —,
   * une lueur qui court de la flaque à l'étreinte, sans cesse ; un grand qu'elle tient l'entraîne, elle s'étire.
   */
  const penchantsDesVrilles = new Map<number, number>()
  function dessinerLesVrilles(p: Peintre): void {
    for (const [id] of penchantsDesVrilles) if (!m.vrilles.some((r) => r.id === id)) penchantsDesVrilles.delete(id)
    if (m.vrilles.length === 0 || m.phase !== 'vol') return
    const C = OMBRE
    const LX = -0.6
    const LY = -0.8
    p.place(W / 2 - camera.x, centreY() - camera.y)
    for (const r of m.vrilles) {
      const vr = CONF.armes[r.arme]?.vrille
      if (vr === undefined) continue
      const age = m.t - r.nee
      const reste = vr.duree - age
      const ph = (r.id * 2.399) % (Math.PI * 2)
      // LA FLAQUE : elle s'ouvre en 0,3 s, se referme dans les 0,45 dernières
      const ouvre = 1 - Math.pow(1 - entre01(age / 0.3), 3)
      const ferme = Math.pow(entre01((0.45 - reste) / 0.45), 3)
      const rf = 7 * ouvre * (1 - ferme)
      if (rf > 0.5) {
        p.glow(r.x, r.y, rf * 2.2 + 4, C[4], 0.4)
        p.circle(r.x, r.y, rf + 1, C[5])
        p.circle(r.x, r.y, rf, C[2])
        p.circle(r.x + 0.5, r.y + 0.5, rf * 0.75, C[1])
        p.circle(r.x + 0.5, r.y + 0.5, rf * 0.45, C[0])
        // (des rides qui s'ouvrent dans le noir)
        const ride = (((t * 1.3 + r.id * 0.29) % 1) + 1) % 1
        p.ring(r.x, r.y, 1 + (rf - 1) * ride, 1, C[4], 0.8 * (1 - ride))
        // (la brume et les grains qui en montent)
        for (let k = 0; k < 4; k++) {
          const q = (((t * 0.9 + k / 4 + r.id * 0.13) % 1) + 1) % 1
          const a = ph + k * 1.9
          p.dot(r.x + Math.cos(a) * rf * 0.6, r.y + Math.sin(a) * rf * 0.4 - q * 8, k % 2 === 0 ? C[6] : C[5], 0.8 * (1 - q))
        }
      }
      // LA TENTACULE : elle jaillit (dépasse, puis se pose), ondule ; elle rentre dans les 0,5 dernières secondes
      const jaillit = entre01((age - 0.08) / 0.25)
      const surpasse = 1 + 2.2 * Math.pow(jaillit - 1, 3) + 1.2 * Math.pow(jaillit - 1, 2)
      const rentre = 1 - Math.pow(entre01((0.5 - reste) / 0.5), 2)
      const proie = r.cible === null ? undefined : m.ennemis.find((e) => e.id === r.cible)
      // (son échine : une suite de points, puis leur angle et leur demi-largeur)
      const W0 = 2.3
      const chemin: [number, number][] = []
      let pulsation = -1
      // (où l'échine quitte la courbe pour s'enrouler : la boucle est fine, on voit l'insecte dedans)
      let enroule = Infinity
      if (proie !== undefined) {
        // (ELLE TIENT : une courbe de la flaque à l'insecte, puis un tour et demi autour de lui ; elle s'y déploie en 0,15 s)
        const ex = proie.corps.x
        const ey = proie.corps.y
        const L = Math.hypot(ex - r.x, ey - r.y) || 1
        const nx = -(ey - r.y) / L
        const ny = (ex - r.x) / L
        const cote = r.id % 2 === 0 ? 1 : -1
        const cx = (r.x + ex) / 2 + nx * cote * L * 0.25
        const cy = (r.y + ey) / 2 + ny * cote * L * 0.25
        const rc = CONF.ennemi.rayon + 2.5 + 0.5 * Math.sin(t * 14 + r.id)
        // (elle aborde l'insecte par le bord : la courbe s'arrête sur son cercle)
        const a0 = Math.atan2(cy - ey, cx - ex)
        const bx = ex + Math.cos(a0) * rc
        const by = ey + Math.sin(a0) * rc
        const nC = Math.max(8, Math.ceil(L / 0.5))
        for (let i = 0; i <= nC; i++) {
          const s0 = i / nC
          const q = 1 - s0
          const onde = Math.sin(Math.PI * s0) * Math.sin(t * 6 + r.id - s0 * 7) * 1.2
          chemin.push([q * q * r.x + 2 * q * s0 * cx + s0 * s0 * bx + nx * onde, q * q * r.y + 2 * q * s0 * cy + s0 * s0 * by + ny * onde])
        }
        enroule = chemin.length
        const tours = Math.PI * 3
        const nT = Math.ceil((tours * rc) / 0.5)
        for (let i = 1; i <= nT; i++) {
          const a = a0 - cote * (i / nT) * tours
          const rr = rc * (1 - 0.25 * (i / nT))
          chemin.push([ex + Math.cos(a) * rr, ey + Math.sin(a) * rr])
        }
        // (elle s'y déploie : seule la part atteinte se dessine)
        const deploye = 1 - Math.pow(1 - entre01((m.t - r.saisieA) / 0.15), 2)
        chemin.length = Math.max(2, Math.round(chemin.length * deploye * rentre))
        penchantsDesVrilles.set(r.id, Math.atan2(ey - r.y, ex - r.x))
        pulsation = ((m.t - r.saisieA) * 70) % (chemin.length * 0.5 + 12)
      } else {
        // (LIBRE : elle ondule, penchée vers sa dernière proie, son crochet au bout)
        const longueur = 21 * Math.max(0, surpasse) * rentre
        const penche = (penchantsDesVrilles.get(r.id) ?? ph) + 0.25 * Math.sin(t * 1.6 + ph)
        let th = penche
        let x = r.x
        let y = r.y
        const n = Math.ceil(longueur / 0.5)
        for (let i = 0; i <= n; i++) {
          const s0 = i * 0.5
          chemin.push([x, y])
          th += 0.5 * (0.16 * Math.sin((s0 / 13) * Math.PI * 2 - 6 * t + ph) * 2.2 + (r.id % 2 === 0 ? 1 : -1) * 0.25 * lisse(0.58, 1, s0 / Math.max(1, longueur)))
          x += Math.cos(th) * 0.5
          y += Math.sin(th) * 0.5
        }
      }
      if (chemin.length < 3) continue
      const pts = chemin.map(([x, y], i) => {
        const [x2, y2] = chemin[Math.min(chemin.length - 1, i + 1)]
        const [x1, y1] = chemin[Math.max(0, i - 1)]
        const u = i / (chemin.length - 1)
        const w = i >= enroule ? 1 - 0.5 * ((i - enroule) / Math.max(1, chemin.length - enroule)) : proie !== undefined ? 1 + (W0 - 1) * Math.pow(1 - i / enroule, 0.75) : W0 * Math.pow(1 - u, 0.75) + 0.45
        return { x, y, th: Math.atan2(y2 - y1, x2 - x1), w, u, s: i * 0.5 }
      })
      // (le corps : plus clair du côté de la lumière)
      for (const q of pts) {
        const nx = -Math.sin(q.th)
        const ny = Math.cos(q.th)
        const ks = nx * LX + ny * LY >= 0 ? 1 : -1
        for (let w = -q.w; w <= q.w; w += 0.5) {
          const u = (w / q.w) * ks
          p.px(Math.round(q.x + nx * w), Math.round(q.y + ny * w), u > 0.55 ? C[5] : u > -0.45 ? C[4] : C[3])
        }
      }
      // (les liserés : vif du côté de la lumière, violet de l'autre ; une lueur lente, et, quand elle tient, celle qui court
      // de la flaque à l'étreinte)
      const lente = ((age * 40) % (pts.length * 0.9)) - 4
      for (const q of pts) {
        const nx = -Math.sin(q.th)
        const ny = Math.cos(q.th)
        const f = nx * LX + ny * LY
        const lit = (f >= 0 ? 1 : -1) * q.w
        p.px(Math.round(q.x - nx * lit), Math.round(q.y - ny * lit), C[2])
        p.px(Math.round(q.x + nx * lit), Math.round(q.y + ny * lit), Math.abs(f) > 0.8 && q.u > 0.15 ? C[7] : C[6])
        const dp = Math.min(pulsation < 0 ? 99 : Math.abs(q.s - pulsation), Math.abs(q.s - lente) * 1.6)
        if (dp < 2.5) p.px(Math.round(q.x), Math.round(q.y), dp < 1 ? N.WHITE : C[7])
      }
      // (la pointe : blanche, une lueur ; l'étreinte luit)
      const bout = pts[pts.length - 1]
      p.px(Math.round(bout.x), Math.round(bout.y), N.WHITE)
      p.glow(bout.x, bout.y, 4, C[6], 0.25)
      if (proie !== undefined) p.glow(proie.corps.x, proie.corps.y, 8, C[5], 0.3 + 0.15 * Math.sin(t * 14 + r.id))
      // (le col d'encre là où elle sort de la flaque)
      if (rf > 1) p.ring(r.x, r.y, W0 + 1.2, 1, C[5], 0.8)
    }
    p.place(0, 0)
  }
  /**
   * LES MINI-VERS (voir `Arme.ponte` ; Keko, 18/11 : « des copies du gros ver en miniature ») : LE VER LUI-MÊME
   * (`formesDuVer`), à l'apparence du joueur, peint à `ECHELLE_DU_MINI_VER` de sa taille ; ses anneaux posés sur LE CHEMIN
   * DE SA TÊTE à lui, comme le grand ; il naît en grandissant (0,25 s), et ses dernières 0,4 s il rapetisse.
   */
  const ECHELLE_DU_MINI_VER = 0.5
  const cheminsDesMiniVers = new Map<number, [number, number][]>()
  /** Les tons de la chair du Ver (sombre, moyen, clair), à l'apparence du joueur. */
  const tonsDeLaChairDuVer = (): number[] => {
    const rv = rampesDuJoueur()?.ver
    return rv !== undefined ? [rv[2], rv[3], rv[4]] : tonsDeLaMatiere('ver')
  }
  function dessinerLesMiniVers(p: Peintre): void {
    for (const [id] of cheminsDesMiniVers) if (!m.miniVers.some((w) => w.id === id)) cheminsDesMiniVers.delete(id)
    if (m.miniVers.length === 0 || m.phase !== 'vol') return
    p.place(0, 0)
    const motif = habitDuJoueur(14)?.motif
    const rampes = rampesDuJoueur()
    for (const w of m.miniVers) {
      const po = CONF.armes[w.arme]?.ponte
      if (po === undefined) continue
      // (son chemin à lui, un point tous les quarts de pixel)
      let ch = cheminsDesMiniVers.get(w.id)
      if (ch === undefined) {
        ch = [[w.x, w.y]]
        cheminsDesMiniVers.set(w.id, ch)
      } else if (Math.hypot(ch[0][0] - w.x, ch[0][1] - w.y) >= 0.25) ch.unshift([w.x, w.y])
      if (ch.length > 80) ch.length = 80
      const vie = m.t - w.ne
      const s = ECHELLE_DU_MINI_VER * Math.min(1, vie / 0.25) * Math.max(0, Math.min(1, (po.duree - vie) / 0.4))
      if (s < 0.08) continue
      const ca = Math.cos(w.cap)
      const sa = Math.sin(w.cap)
      const c0 = ch
      const auDos = (d: number): [number, number] => {
        let reste = d
        for (let i = 1; i < c0.length; i++) {
          const l = Math.hypot(c0[i][0] - c0[i - 1][0], c0[i][1] - c0[i - 1][1])
          if (l < 1e-6) continue
          if (reste <= l) return [c0[i - 1][0] + ((c0[i][0] - c0[i - 1][0]) * reste) / l, c0[i - 1][1] + ((c0[i][1] - c0[i - 1][1]) * reste) / l]
          reste -= l
        }
        const [qx, qy] = c0[c0.length - 1]
        return [qx - ca * reste, qy - sa * reste]
      }
      // (ses neuf anneaux, en unités du ver : l'écart du grand, à son échelle)
      const anneaux: [number, number][] = []
      for (let k = 1; k <= 9; k++) {
        const [wx, wy] = auDos(k * ECART_DES_ANNEAUX * s)
        const dx = wx - w.x
        const dy = wy - w.y
        anneaux.push([(dx * ca + dy * sa) / s, (-dx * sa + dy * ca) / s])
      }
      peindreFormes(p, formesDuVer(t + w.id * 0.37, 0, 0, motif, anneaux), w.x - camera.x + W / 2, w.y - camera.y + centreY(), s, { cap: w.cap, lumiere: LUMIERE_DU_VOL, rampes, reflet: REFLET_DU_VOL })
    }
  }
  /**
   * L'ŒUF, D'APRÈS L'« EGG HATCH » DE PIXELFX, EN ŒUF D'INSECTE VU DE DESSUS (Keko, 17/11 : « pas très joli ; inspire-toi
   * de l'éclosion d'un œuf de pixelfx, en version insecte ») : une coque CUIREUSE, ovale, vert pâle, éclairée d'en haut à
   * gauche, cernée de sombre ; dedans, LA LARVE roulée, une ombre qui remue ; il OSCILLE TROIS FOIS, chaque fois plus
   * fort, et chaque oscillation OUVRE DES FISSURES où luit le poison — un éclair blanc à leur ouverture, la coque qui
   * s'éclaire autour ; il frissonne juste avant d'éclater (l'éclatement, ses coquilles et sa gerbe : `coquilles`).
   */
  const COQUE_D_OEUF = ['#10160a', '#2c3814', '#56682a', '#8ea050', '#c4d488', '#eef6c8'].map((c) => N.hex(c))
  const OSCILLATIONS: [number, number][] = [[0.25, 0.18], [0.5, 0.28], [0.72, 0.4]]
  function dessinerUnOeuf(p: Peintre, o: (typeof m.oeufs)[number], u: number, age: number): void {
    const C = COQUE_D_OEUF
    const G = GOUDRON
    // (le stade : combien de fissures sont ouvertes)
    const stade = OSCILLATIONS.filter(([u0]) => u >= u0).length
    // (il oscille autour de sa base, chaque fois plus fort ; il frissonne à la fin)
    let a = 0
    for (const [u0, amp] of OSCILLATIONS) {
      const q = (u - u0) * 1.5
      if (q > 0 && q < 0.5) a += amp * Math.sin(q * 30) * Math.exp(-q * 7)
    }
    if (u > 0.9) a += 0.08 * Math.sin(age * 90)
    // (en attendant, un frisson toutes les 2,5 s : quelque chose remue dedans)
    if (u === 0 && (age + o.id * 0.37) % 2.5 < 0.3) a += 0.12 * Math.sin(age * 40)
    const rot = o.cap + a
    const pose = Math.min(1, age / 0.15)
    const rx = 4.4 * pose
    const ry = 3.4 * pose
    const ca = Math.cos(rot)
    const sa = Math.sin(rot)
    const lueur = stade / 3 + 0.2 * Math.max(0, Math.sin(age * 9)) * (stade / 3)
    p.circle(o.x + 1, o.y + 1.5, ry, N.hex('#06040a'), 0.4)
    if (lueur > 0.05) p.glow(o.x, o.y, 6 + 3 * stade, G[6], 0.15 + 0.25 * lueur)
    else p.glow(o.x, o.y, 6, G[5], 0.1 + 0.06 * Math.sin(age * 2 + o.id))
    // (les fissures : trois stades, en zigzag, tirées de l'œuf)
    const fissures: [number, number, number][] = []
    for (let f = 0; f < 3; f++) {
      let fx = (alea(o.id, f, 1) - 0.5) * 2
      let fy = (alea(o.id, f, 2) - 0.5) * 1.6
      let fa = alea(o.id, f, 3) * Math.PI * 2
      for (let k = 0; k < 4; k++) {
        fissures.push([Math.round(fx), Math.round(fy), f])
        fa += (alea(o.id, f * 7 + k, 4) - 0.5) * 1.6
        fx += Math.cos(fa) * 1.1
        fy += Math.sin(fa) * 1.1
      }
    }
    const ouverte = (ux: number, uy: number): number => {
      for (const [x, y, f] of fissures) if (f < stade && x === ux && y === uy) return f
      return -1
    }
    const R2 = Math.ceil(Math.max(rx, ry)) + 1
    for (let dy = -R2; dy <= R2; dy++)
      for (let dx = -R2; dx <= R2; dx++) {
        // (dans le repère de l'œuf)
        const ux = dx * ca + dy * sa
        const uy = -dx * sa + dy * ca
        const e = (ux / Math.max(0.5, rx)) ** 2 + (uy / Math.max(0.5, ry)) ** 2
        if (e > 1.25) continue
        const px = Math.round(o.x + dx)
        const py = Math.round(o.y + dy)
        if (e > 1) {
          p.px(px, py, C[0])
          continue
        }
        // (la fissure ouverte : la lueur du poison, un éclair blanc quand elle s'ouvre)
        const f = ouverte(Math.round(ux), Math.round(uy))
        if (f >= 0) {
          const frais = u - OSCILLATIONS[f][0] < 0.08
          p.px(px, py, frais ? N.WHITE : G[(Math.floor(age * 12) + dx) % 3 === 0 ? 7 : 6])
          continue
        }
        // (la coque, éclairée d'en haut à gauche ; la larve roulée dedans, une ombre qui remue)
        const nx = ux / Math.max(0.5, rx)
        const ny = uy / Math.max(0.5, ry)
        const nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny))
        const lum = -0.6 * (nx * ca - ny * sa) - 0.6 * (nx * sa + ny * ca) + 0.55 * nz
        const remue = Math.sin(age * 5 + o.id)
        const larve = Math.hypot(ux - 0.4 * remue, uy) < 1.6 && Math.hypot(ux - 0.4 * remue + 0.9, uy + 0.4) > 0.8
        let c = lum > 0.75 ? C[5] : lum > 0.4 ? C[4] : lum > 0.05 ? C[3] : C[2]
        if (larve && lum < 0.75) c = stade >= 2 ? G[5] : C[2]
        p.px(px, py, c)
      }
    // (la coque s'éclaire autour des fissures ouvertes)
    if (stade >= 1) p.glow(o.x, o.y, 4, G[6], 0.12 * stade)
  }
  /**
   * L'ÉCLOSION : LA COQUE ÉCLATE (d'après l'« Egg hatch » de pixelfx) — trois ou quatre coquilles qui volent en tournant et
   * ralentissent, leur bord brisé encore lumineux, une gerbe de rayons vert-jaune qui jaillit, un éclair, de la bave.
   */
  const coquilles: { x: number; y: number; vx: number; vy: number; a: number; va: number; t0: number; r: number }[] = []
  const eclosions: { x: number; y: number; t0: number; id: number }[] = []
  function dessinerLesEclosions(p: Peintre): void {
    for (let i = coquilles.length - 1; i >= 0; i--) if (t - coquilles[i].t0 > 0.7) coquilles.splice(i, 1)
    for (let i = eclosions.length - 1; i >= 0; i--) if (t - eclosions[i].t0 > 0.5) eclosions.splice(i, 1)
    if (coquilles.length === 0 && eclosions.length === 0) return
    p.place(W / 2 - camera.x, centreY() - camera.y)
    const G = GOUDRON
    for (const e of eclosions) {
      const q = (t - e.t0) / 0.5
      if (q < 0.15) p.circle(e.x, e.y, 3 + 4 * q, N.WHITE, 1 - q / 0.15)
      for (let k = 0; k < 7; k++) {
        const an = alea(e.id, k, 1) * Math.PI * 2
        const L = 10 * (1 - Math.pow(1 - Math.min(1, q / 0.2), 3)) * (k % 2 === 0 ? 1 : 0.65) * (1 - q * 0.6)
        p.line(e.x, e.y, e.x + Math.cos(an) * L, e.y + Math.sin(an) * L, G[6], 0.8 * (1 - q))
        p.line(e.x, e.y, e.x + Math.cos(an) * L * 0.4, e.y + Math.sin(an) * L * 0.4, N.WHITE, 1 - q)
      }
      p.glow(e.x, e.y, 10, G[6], 0.5 * (1 - q))
    }
    const pas = Math.min(0.05, dtBase)
    for (const c of coquilles) {
      const age = t - c.t0
      c.x += c.vx * pas
      c.y += c.vy * pas
      c.vx *= 1 - 3 * pas
      c.vy *= 1 - 3 * pas
      c.a += c.va * pas
      const f = 1 - age / 0.7
      // (une coquille : un arc de coque, sa face éclairée, son bord brisé lumineux au début)
      for (let k = -2; k <= 2; k++) {
        const an = c.a + k * 0.35
        const x = c.x + Math.cos(an) * c.r
        const y = c.y + Math.sin(an) * c.r
        p.px(Math.round(x), Math.round(y), k === 0 ? COQUE_D_OEUF[5] : COQUE_D_OEUF[4])
        if (age < 0.25 && (k === -2 || k === 2)) p.px(Math.round(x), Math.round(y), G[7])
      }
      if (f < 0.3 && Math.floor(age * 20) % 2 === 0) continue
    }
    p.place(0, 0)
  }
  function dessinerLesOeufs(p: Peintre): void {
    if (m.oeufs.length === 0 || m.phase !== 'vol') return
    p.place(W / 2 - camera.x, centreY() - camera.y)
    for (const o of m.oeufs) {
      const po = CONF.armes[o.arme]?.ponte
      if (po === undefined) continue
      // (il attend, un frisson de temps en temps ; sa dernière seconde, il oscille, se fissure et éclate)
      const age = m.t - o.pondu
      dessinerUnOeuf(p, o, Math.max(0, Math.min(1, age - (po.eclosion - 1))), age)
    }
    p.place(0, 0)
  }
  /**
   * LES TENTACULES DU KRAKEN (voir `Arme.tentacule`) : de sa racine jusqu'à l'insecte, une COURBE (une quadratique, son
   * point de contrôle écarté de la corde de son virage), qui ONDULE (un écart qui bat, nul aux deux bouts), tracée jusqu'à
   * son allongement ; épaisse à la racine, fine au bout ; de la chair, cernée de sombre, éclairée d'un côté, des ventouses
   * pâles ; au bout, L'AIGUILLE d'os, sur la tangente — plantée, elle s'enfonce et la chair palpite.
   */
  const CHAIR = ['#2a0a18', '#5a1430', '#8e2a48', '#c04a62', '#e8808a', '#ffc4c0'].map((c) => N.hex(c))
  const OS = ['#4a3e2c', '#a8987a', '#d6ccb0', '#fffaf0'].map((c) => N.hex(c))
  const BILE = ['#3a5a0c', '#a8d42a', '#e0f870'].map((c) => N.hex(c))
  /**
   * L'ÉPINE D'OS DU VER (voir `Arme.epines`) : une grande lance d'os de quatorze pixels, dessinée par-dessus les insectes
   * qu'elle transperce ; cernée de sombre, éclairée d'un côté, effilée jusqu'à sa pointe blanche, deux barbes de harpon
   * derrière la pointe, le talon noueux d'un os ; une traîne de poussière d'os. Au bout de sa course, elle file encore un
   * instant en s'effaçant.
   */
  const epinesFinies: { x: number; y: number; cap: number; t0: number }[] = []
  const LONGUEUR_DE_L_EPINE = 14
  function dessinerUneEpine(p: Peintre, x: number, y: number, ux: number, uy: number, long: number, a: number): void {
    const nx = -uy
    const ny = ux
    const pt = (u: number, w: number): number[] => [x + ux * u + nx * w, y + uy * u + ny * w]
    p.poly([pt(2, 0), pt(-long * 0.4, 2.2), pt(-long, 2.4), pt(-long, -2.4), pt(-long * 0.4, -2.2)], OS[0], a)
    p.poly([pt(1, 0), pt(-long * 0.4, 1.3), pt(-long + 0.5, 1.5), pt(-long + 0.5, -1.5), pt(-long * 0.4, -1.3)], OS[1], a)
    p.line(pt(0, -0.4)[0], pt(0, -0.4)[1], pt(-long + 1, -0.9)[0], pt(-long + 1, -0.9)[1], OS[2], a)
    // (les barbes du harpon)
    for (const c of [-1, 1]) p.line(pt(-2.5, c * 0.8)[0], pt(-2.5, c * 0.8)[1], pt(-5.5, c * 2.8)[0], pt(-5.5, c * 2.8)[1], OS[2], a)
    // (le talon : les deux nœuds d'un bout d'os)
    for (const c of [-1, 1]) {
      p.circle(pt(-long, c * 1.4)[0], pt(-long, c * 1.4)[1], 1.9, OS[0], a)
      p.circle(pt(-long, c * 1.4)[0], pt(-long, c * 1.4)[1], 1.2, c < 0 ? OS[2] : OS[1], a)
    }
    // (la pointe)
    p.line(pt(-2, 0)[0], pt(-2, 0)[1], pt(1, 0)[0], pt(1, 0)[1], OS[3], a)
  }
  function dessinerLesEpines(p: Peintre): void {
    for (let i = epinesFinies.length - 1; i >= 0; i--) if (t - epinesFinies[i].t0 > 0.2) epinesFinies.splice(i, 1)
    if ((m.brochettes.length === 0 && epinesFinies.length === 0) || m.phase !== 'vol') return
    p.place(W / 2 - camera.x, centreY() - camera.y)
    for (const b of m.brochettes) {
      const vit = Math.hypot(b.vx, b.vy) || 1
      const ux = b.vx / vit
      const uy = b.vy / vit
      const long = LONGUEUR_DE_L_EPINE
      for (let j = 1; j <= 4; j++) p.dot(b.x - ux * (long + j * 2.5), b.y - uy * (long + j * 2.5), OS[j < 3 ? 2 : 1], 0.55 - j * 0.12)
      p.glow(b.x - ux * 3, b.y - uy * 3, 7, OS[2], 0.25)
      dessinerUneEpine(p, b.x, b.y, ux, uy, long, 1)
    }
    // (au bout de sa course : elle file encore un peu, et s'efface)
    for (const e of epinesFinies) {
      const age = t - e.t0
      const ux = Math.cos(e.cap)
      const uy = Math.sin(e.cap)
      dessinerUneEpine(p, e.x + ux * age * 60, e.y + uy * age * 60, ux, uy, LONGUEUR_DE_L_EPINE, Math.max(0, 1 - age / 0.2))
    }
    p.place(0, 0)
  }
  function dessinerLesTentacules(p: Peintre): void {
    if (m.tentacules.length === 0 || m.phase !== 'vol') return
    p.place(W / 2 - camera.x, centreY() - camera.y)
    for (const tn of m.tentacules) {
      const te = CONF.armes[tn.arme]?.tentacule
      if (te === undefined || tn.u <= 0.01) continue
      const A = ancreDansLeMonde(m.vaisseau, te.ancres[tn.ancre] ?? [0, 0])
      const dx = tn.tx - A.x
      const dy = tn.ty - A.y
      const L = Math.hypot(dx, dy) || 1
      const px = -dy / L
      const py = dx / L
      const cx = A.x + dx / 2 + px * tn.virage * L
      const cy = A.y + dy / 2 + py * tn.virage * L
      const plantee = tn.fait === 'plantee'
      // (le point de la courbe à s, et son ondulation)
      const point = (s: number): [number, number] => {
        const q = 1 - s
        const bx = q * q * A.x + 2 * q * s * cx + s * s * tn.tx
        const by = q * q * A.y + 2 * q * s * cy + s * s * tn.ty
        const onde = Math.sin(Math.PI * s) * Math.sin(t * 7 + tn.ancre * 2.1 - s * 6) * 1.2
        return [bx + px * onde, by + py * onde]
      }
      const n = Math.max(6, Math.ceil((L * tn.u) / 1.2))
      const pts: [number, number][] = []
      for (let i = 0; i <= n; i++) pts.push(point((i / n) * tn.u))
      const epais = (i: number): number => 2.3 - 1.4 * (i / n) + (plantee ? 0.25 * Math.sin(t * 30 - i) : 0)
      // (le cerne sombre, puis la chair, puis sa lumière d'un côté, puis les ventouses)
      for (let i = 0; i <= n; i++) p.circle(pts[i][0], pts[i][1], epais(i) + 0.8, CHAIR[0])
      for (let i = 0; i <= n; i++) p.circle(pts[i][0], pts[i][1], epais(i), i % 4 < 2 ? CHAIR[2] : CHAIR[3])
      for (let i = 0; i <= n; i++) p.circle(pts[i][0] - 0.6, pts[i][1] - 0.6, Math.max(0.5, epais(i) * 0.45), CHAIR[4])
      for (let i = 2; i < n; i += 3) {
        const [ax, ay] = pts[i]
        p.dot(ax + px * epais(i) * 0.7, ay + py * epais(i) * 0.7, CHAIR[5], 0.9)
      }
      // (l'aiguille, sur la tangente du bout)
      const [x1, y1] = pts[n]
      const [x0, y0] = pts[Math.max(0, n - 1)]
      const tl = Math.hypot(x1 - x0, y1 - y0) || 1
      const ux = (x1 - x0) / tl
      const uy = (y1 - y0) / tl
      const enfonce = plantee ? -1.5 : 0
      p.line(x1 - ux * 0.5, y1 - uy * 0.5, x1 + ux * (4 + enfonce), y1 + uy * (4 + enfonce), OS[1])
      p.line(x1 - ux * 0.5 + uy * 0.5, y1 - uy * 0.5 - ux * 0.5, x1 + ux * (2.5 + enfonce), y1 + uy * (2.5 + enfonce), OS[2])
      p.px(Math.round(x1 + ux * (4 + enfonce)), Math.round(y1 + uy * (4 + enfonce)), OS[3])
      if (plantee) p.glow(tn.tx, tn.ty, 5, BILE[1], 0.35)
    }
    p.place(0, 0)
  }
  /**
   * LA NUÉE DU KRAKEN (voir `Arme.nuee` ; « l'essaim » d'abord, renommée le 17/11) : un voile à peine visible, et UNE NUÉE DE MOUCHERONS — chacun un corps sombre et
   * une aile claire qui bat, qui tremblent. AU REPOS, tous tournent autour du vaisseau, serrés, chacun sur son orbite.
   * DES BRAS (Keko, 16/11 : « l'essaim se déforme et s'étend vers les ennemis ») : trois sur cinq quittent le nuage pour
   * ses bras — chacun à sa place le long du bras (une fraction de sa longueur, tendue d'autant qu'il est allongé), un bras
   * renflé au milieu, un peu courbe, qui ondule ; au bout d'un bras tendu, ils grouillent sur l'insecte.
   */
  // (quatre-vingt-dix, chacun un corps sombre et une aile claire : sur le portail violet, des points clairs seuls se perdaient)
  const MOUCHERONS = 90
  function dessinerLesNuees(p: Peintre): void {
    if (m.nuees.length === 0 || m.phase !== 'vol') return
    p.place(W / 2 - camera.x, centreY() - camera.y)
    for (const n of m.nuees) {
      const nu = CONF.armes[n.arme]?.nuee
      if (nu === undefined) continue
      const R = nu.rayon
      const bras = n.bras
      p.disc(n.x, n.y, R, BILE[0], (d) => 0.16 * (1 - d * d))
      // (le voile le long des bras)
      for (const b of bras) for (let q = 1; q <= 4; q++) {
        const s = (q / 4) * b.u
        p.disc(n.x + (b.tx - n.x) * s, n.y + (b.ty - n.y) * s, 3.5, BILE[0], (d) => 0.14 * (1 - d * d))
      }
      const tic = Math.floor(t * 24)
      for (let j = 0; j < MOUCHERONS; j++) {
        let x: number
        let y: number
        const b = bras.length > 0 && j % 5 < 3 ? bras[j % bras.length] : undefined
        if (b !== undefined) {
          const L = Math.hypot(b.tx - n.x, b.ty - n.y) || 1
          const px = -(b.ty - n.y) / L
          const py = (b.tx - n.x) / L
          const s = alea(j, 1, 60)
          if (b.u >= 0.85 && s > 0.75) {
            // (au bout du bras tendu : il grouille sur l'insecte)
            const a = alea(j, 1, 41) * Math.PI * 2 + t * (6 + 4 * alea(j, 1, 42))
            const r = 2 + 3.5 * alea(j, 1, 43)
            x = b.tx + Math.cos(a) * r
            y = b.ty + Math.sin(a) * r
          } else {
            // (le long du bras : renflé au milieu, un peu courbe, il ondule)
            const le = s * b.u
            const large = (1.5 + 3.5 * Math.sin(Math.PI * Math.min(1, le + 0.1))) * (alea(j, 1, 61) * 2 - 1)
            const courbe = Math.sin(Math.PI * le) * (b.cible % 2 === 0 ? 1 : -1) * L * 0.12 + Math.sin(t * 5 + le * 7 + b.cible) * 1.5
            x = n.x + (b.tx - n.x) * le + px * (large + courbe)
            y = n.y + (b.ty - n.y) * le + py * (large + courbe)
          }
        } else {
          const a = alea(j, 1, 44) * Math.PI * 2 + t * (1.5 + 2.5 * alea(j, 1, 45)) * (j % 2 === 0 ? 1 : -1)
          const r = R * (0.35 + 0.65 * Math.sqrt(alea(j, 1, 46))) * (0.85 + 0.15 * Math.sin(t * (3 + alea(j, 1, 47) * 4) + j))
          x = n.x + Math.cos(a) * r
          y = n.y + Math.sin(a) * r * 0.85
        }
        // (ils tremblent, et battent de l'aile)
        x += (alea(j, tic, 49) - 0.5) * 1.2
        y += (alea(j, tic, 50) - 0.5) * 1.2
        const ix = Math.round(x)
        const iy = Math.round(y)
        // (le corps, sombre ; l'aile, claire, d'un côté puis de l'autre — elle bat)
        p.px(ix, iy, CHITINE_SOMBRE)
        const bat = alea(j, tic, 51) < 0.5 ? 1 : -1
        p.px(ix + bat, iy - 1, alea(j, tic, 52) < 0.25 ? N.WHITE : j % 4 === 0 ? CHAIR[4] : BILE[2])
      }
    }
    p.place(0, 0)
  }
  /**
   * LES REJETONS DU KRAKEN (voir `Arme.rejeton`) : une petite bête — UNE CLOCHE de chair, plus longue que large, ombrée
   * comme une sphère (cernée de sombre, claire du côté de la lumière), un chapeau de chitine devant, deux yeux de bile —
   * et CINQ TENTACULES (Keko, 16/11 : « je trouve les rejetons rectangulaires ; il faudrait qu'on voie plus les tentacules
   * à l'arrière, et qu'à l'arrêt elles flottent autour ») : chacune une corde de huit maillons, épaisse et cernée, qui
   * suit la cloche (chaque maillon tiré par le précédent), poussée d'une houle ; À L'ARRÊT leurs racines s'écartent tout
   * autour de la cloche et elles flottent en étoile, qui tourne doucement ; EN NAGE elles se resserrent derrière et
   * traînent. QUAND IL FOUETTE, une tentacule part en courbe jusqu'à l'insecte et revient.
   */
  const MAILLONS = 8
  const LONGUEUR_DU_MAILLON = 1.8
  const TENTACULES_DU_REJETON = 5
  const cordesDesRejetons = new Map<number, { cordes: [number, number][][]; cap: number; vu: number; nage: number }>()
  const coupsDeRejeton: { id: number; tx: number; ty: number; t0: number; virage: number }[] = []
  const DUREE_DU_COUP = 0.2
  function dessinerLesRejetons(p: Peintre): void {
    for (const [id] of cordesDesRejetons) if (!m.rejetons.some((r) => r.id === id)) cordesDesRejetons.delete(id)
    for (let i = coupsDeRejeton.length - 1; i >= 0; i--) if (t - coupsDeRejeton[i].t0 > DUREE_DU_COUP) coupsDeRejeton.splice(i, 1)
    if (m.rejetons.length === 0 || m.phase !== 'vol') return
    p.place(W / 2 - camera.x, centreY() - camera.y)
    for (const r of m.rejetons) {
      const vit = Math.hypot(r.vx, r.vy)
      let etat = cordesDesRejetons.get(r.id)
      if (etat === undefined) {
        etat = { cordes: Array.from({ length: TENTACULES_DU_REJETON }, () => Array.from({ length: MAILLONS }, (): [number, number] => [r.x, r.y])), cap: Math.atan2(r.vy, r.vx), vu: t, nage: 0 }
        cordesDesRejetons.set(r.id, etat)
      }
      const pas = Math.min(0.1, t - etat.vu)
      // (son cap suit sa nage ; à l'arrêt, il garde le sien ; « nage » glisse de 0, à l'arrêt, à 1, lancé)
      if (vit > 5) {
        const voulu = Math.atan2(r.vy, r.vx)
        let e = voulu - etat.cap
        while (e > Math.PI) e -= Math.PI * 2
        while (e < -Math.PI) e += Math.PI * 2
        etat.cap += e * Math.min(1, pas * 8)
      }
      etat.nage += (Math.min(1, vit / 35) - etat.nage) * Math.min(1, pas * 4)
      etat.vu = t
      const hx = Math.cos(etat.cap)
      const hy = Math.sin(etat.cap)
      const nage = etat.nage
      // (les cordes : chacune part de sa racine sur le bord de la cloche — tout autour à l'arrêt, serrées derrière en
      // nage —, chaque maillon tiré vers le dehors de sa racine et par le précédent, poussé d'une houle)
      etat.cordes.forEach((c, k) => {
        const autour = etat!.cap + Math.PI / 5 + (k * 2 * Math.PI) / TENTACULES_DU_REJETON + t * 0.7
        const derriere = etat!.cap + Math.PI + (k - (TENTACULES_DU_REJETON - 1) / 2) * 0.32
        let ecart = derriere - autour
        while (ecart > Math.PI) ecart -= Math.PI * 2
        while (ecart < -Math.PI) ecart += Math.PI * 2
        const an = autour + ecart * nage
        const ux = Math.cos(an)
        const uy = Math.sin(an)
        c[0] = [r.x + ux * 2.6, r.y + uy * 2.6]
        for (let i = 1; i < MAILLONS; i++) {
          const houle = Math.sin(t * 5 + k * 1.7 + i * 0.8) * (0.45 - 0.2 * nage)
          let qx = c[i][0] + ux * 0.3 - uy * houle
          let qy = c[i][1] + uy * 0.3 + ux * houle
          const dx = qx - c[i - 1][0]
          const dy = qy - c[i - 1][1]
          const d = Math.hypot(dx, dy) || 1
          qx = c[i - 1][0] + (dx / d) * LONGUEUR_DU_MAILLON
          qy = c[i - 1][1] + (dy / d) * LONGUEUR_DU_MAILLON
          c[i] = [qx, qy]
        }
        // (cernée de sombre, épaisse à la racine, claire dessus)
        for (let i = 1; i < MAILLONS; i++) {
          const u = i / MAILLONS
          p.line(c[i - 1][0] + 1, c[i - 1][1] + 1, c[i][0] + 1, c[i][1] + 1, CHAIR[0], 0.8)
          if (u < 0.55) p.line(c[i - 1][0], c[i - 1][1] + 1, c[i][0], c[i][1] + 1, CHAIR[2])
          p.line(c[i - 1][0], c[i - 1][1], c[i][0], c[i][1], u < 0.4 ? CHAIR[4] : CHAIR[3])
        }
        p.px(Math.round(c[MAILLONS - 1][0]), Math.round(c[MAILLONS - 1][1]), BILE[2])
      })
      // (le coup de tentacule, s'il fouette : une courbe jusqu'à l'insecte, qui part et revient)
      for (const cp of coupsDeRejeton) {
        if (cp.id !== r.id) continue
        const u = (t - cp.t0) / DUREE_DU_COUP
        const tendu = u < 0.5 ? u / 0.5 : (1 - u) / 0.5
        const L = Math.hypot(cp.tx - r.x, cp.ty - r.y) || 1
        const cx = (r.x + cp.tx) / 2 - ((cp.ty - r.y) / L) * cp.virage * L
        const cy = (r.y + cp.ty) / 2 + ((cp.tx - r.x) / L) * cp.virage * L
        let ax = r.x
        let ay = r.y
        const n = 8
        for (let i = 1; i <= n; i++) {
          const s = (i / n) * tendu
          const q = 1 - s
          const bx = q * q * r.x + 2 * q * s * cx + s * s * cp.tx
          const by = q * q * r.y + 2 * q * s * cy + s * s * cp.ty
          p.line(ax, ay, bx, by, CHAIR[0])
          p.line(ax, ay - 1, bx, by - 1, i < n / 2 ? CHAIR[3] : CHAIR[4])
          ax = bx
          ay = by
        }
        p.px(Math.round(ax), Math.round(ay), OS[3])
      }
      // (la cloche : plus longue que large — trois disques le long du cap —, ombrée comme une sphère ; le chapeau de
      // chitine devant, deux yeux de bile, une lueur)
      p.glow(r.x, r.y, 7, BILE[1], 0.2)
      const lx = -0.6
      const ly = -0.8
      for (const [o, rr] of [[-1.1, 2.6], [0.4, 3.2], [1.7, 2.5]] as [number, number][]) {
        const cx = r.x + hx * o
        const cy = r.y + hy * o
        p.disc(cx, cy, rr + 0.8, CHAIR[0], 1)
      }
      for (const [o, rr] of [[-1.1, 2.6], [0.4, 3.2], [1.7, 2.5]] as [number, number][]) {
        const cx = r.x + hx * o
        const cy = r.y + hy * o
        p.disc(cx, cy, rr, (d, ang) => {
          const cl = Math.cos(ang) * lx + Math.sin(ang) * ly
          return d > 0.75 ? (cl > 0.2 ? CHAIR[3] : CHAIR[1]) : cl * d > 0.3 ? CHAIR[4] : CHAIR[2]
        }, 1)
      }
      p.disc(r.x + hx * 1.8, r.y + hy * 1.8, 1.9, (d, ang) => (Math.cos(ang) * lx + Math.sin(ang) * ly > 0.3 && d > 0.4 ? CHITINE_CLAIRE : CHITINE_DU_REJETON), 1)
      for (const sg of [-1, 1]) p.px(Math.round(r.x + hx * 2.6 - hy * sg * 1.3), Math.round(r.y + hy * 2.6 + hx * sg * 1.3), BILE[2])
    }
    p.place(0, 0)
  }
  /**
   * L'ACIDE DE LA VOUIVRE (voir `Arme.crachat`). LA FLAQUE : un secteur — le cône craché, posé au sol —, un vert sombre
   * translucide qui bout (des taches plus claires qui bougent), plus clair au bord, des bulles qui crèvent ; elle s'étale
   * en naissant, pâlit en s'effaçant. LE CRACHAT : une gerbe de gouttes qui filent de la gueule dans le cône, plus vite au
   * milieu, et s'éteignent en arrivant. Sur un insecte RONGÉ (dessiné avec les insectes) : une tache verte qui fume.
   */
  const VENIN = ['#1a3006', '#2e5a08', '#4e8e10', '#7cc81c', '#b8f040', '#f0ffb0'].map((c) => N.hex(c))
  // (LES TEINTES DES EFFETS D'ACIDE DE PIXELFX — Keko, 17/11 : « Poison Cloud, Toxic Puddle et Acid Splash, ce serait bien
  // de t'en inspirer pour rework les trucs d'acide ») : le goudron de la flaque toxique et ses reflets huileux, le miasme
  // du nuage de poison (vert-jaune au cœur, violet au bord), l'acide qui éclabousse et sa vapeur pâle
  const GOUDRON = ['#06070a', '#0c100c', '#141a10', '#1e2814', '#2e3c18', '#5a7a1c', '#a6d42a', '#ecff86'].map((c) => N.hex(c))
  const HUILE = ['#2a1648', '#5a2e8e', '#1e7a86', '#6adccc'].map((c) => N.hex(c))
  const MIASME = ['#0e0816', '#24123a', '#3e2056', '#5a3a62', '#6a6a3a', '#96aa30', '#cce040', '#f4ffa0'].map((c) => N.hex(c))
  const ECLABOUSSURE = ['#0e140a', '#1c3010', '#2c5214', '#457e18', '#6aae1c', '#a0dc2a', '#dcff6a', '#f8ffd0'].map((c) => N.hex(c))
  const VAPEUR = N.hex('#c8d2c0')
  const DUREE_DU_CRACHAT = 0.28
  const crachats: { x: number; y: number; cap: number; cone: number; portee: number; t0: number; id: number }[] = []
  function dessinerLesFlaquesAcides(p: Peintre): void {
    if (m.flaquesAcides.length === 0) return
    p.place(W / 2 - camera.x, centreY() - camera.y)
    for (const f of m.flaquesAcides) {
      const a = CONF.armes[f.arme]
      const cr = a?.crachat
      if (a === undefined || cr === undefined) continue
      const age = m.t - f.nee
      const etale = Math.min(1, age / 0.25)
      const k = Math.min(1, (cr.duree - age) / 0.6)
      if (k <= 0) continue
      const L = a.portee * (0.55 + 0.45 * etale)
      // (UNE ÉCLABOUSSURE, PLUS UN SECTEUR — Keko, 16/11 : « la flaque conique ne semble pas très organique, cône droit… » :
      // des flancs qui ondulent, un bord en lobes inégaux, une pointe qui s'arrondit, des taches qui bougent dedans, des
      // gouttes projetées au-delà ; la règle, elle, garde son cône)
      const ou = (d: number, ang: number): number => {
        // (combien on est dedans : > 0 dedans, le bord à 0)
        const e = Math.abs(Math.atan2(Math.sin(ang - f.cap), Math.cos(ang - f.cap)))
        const flanc = cr.cone * (1 + 0.22 * Math.sin(d * 11 + f.id) + 0.12 * Math.sin(d * 23 + f.id * 2.3)) * Math.min(1, 0.35 + d * 2.2)
        const lobe = 0.86 + 0.1 * Math.sin(ang * 13 + f.id) + 0.06 * Math.sin(ang * 31 + f.id * 3.1)
        return Math.min((flanc - e) / 0.08, (lobe - d) / 0.06, (d - 0.08) / 0.06)
      }
      // (LA FLAQUE TOXIQUE DE PIXELFX, VUE DE DESSUS — Keko, 17/11) : un goudron sombre éclairé du dedans par des VEINES
      // vert-jaune qui ondulent et battent, un REFLET HUILEUX violet et sarcelle qui glisse dessus, un bord qui luit ; la
      // forme et le bord fondu restent ceux qu'on avait réglés
      const G = GOUDRON
      const dedans = (d: number, ang: number): { veine: number; huile: number; teinte: number } => {
        const px = Math.cos(ang) * d * L
        const py = Math.sin(ang) * d * L
        const pouls = 0.6 + 0.4 * Math.sin(m.t * 3 + px * 0.05 + f.id)
        const veine = Math.abs(Math.sin(px * 0.33 + Math.sin(py * 0.21 + m.t * 0.8 + f.id) * 2.2) + Math.sin(py * 0.29 - px * 0.13 - m.t * 0.6)) / pouls
        const huile = Math.sin(px * 0.11 + m.t * 0.5 + f.id) * Math.sin(py * 0.13 - m.t * 0.4)
        return { veine, huile, teinte: Math.sin(px * 0.05 - py * 0.04 + m.t * 0.3) }
      }
      p.disc(f.x, f.y, L, (d, ang) => {
        if (ou(d, ang) < 1.5) return G[6]
        const { veine, huile, teinte } = dedans(d, ang)
        if (veine < 0.07) return G[7]
        if (veine < 0.16) return G[6]
        if (huile > 0.62) return teinte > 0 ? HUILE[3] : HUILE[1]
        if (huile > 0.45) return teinte > 0 ? HUILE[2] : HUILE[0]
        // (un goudron plus clair que celui du dépôt, fait pour un sol clair : sur le noir de l'espace, on ne le voyait pas)
        return veine < 0.32 ? G[6] : veine < 0.7 ? G[5] : G[4]
      }, (d, ang) => {
        const o = ou(d, ang)
        if (o <= 0) return 0
        // (UN BORD QUI SE FOND — Keko, 16/11 : « des bords progressivement transparents, une tache moins nette »)
        const fondu = Math.min(1, o / 3)
        const base = fondu * fondu * (3 - 2 * fondu) * k
        const { veine } = dedans(d, ang)
        return (veine < 0.16 ? 0.9 : 0.5) * base
      })
      // (la lueur qui en monte : elle se voit de loin, sur le fond sombre)
      p.glow(f.x + Math.cos(f.cap) * L * 0.55, f.y + Math.sin(f.cap) * L * 0.55, L * 0.6, G[5], 0.2 * k)
      // (les gouttes projetées au-delà du bord, de travers)
      for (let j = 0; j < 7; j++) {
        const an = f.cap + (alea(f.id, j, 21) * 2 - 1) * cr.cone * 1.25
        const d = L * (0.9 + 0.22 * alea(f.id, j, 22))
        const r = 0.6 + 1.3 * alea(f.id, j, 23)
        p.disc(f.x + Math.cos(an) * d, f.y + Math.sin(an) * d, r, G[5], (dd) => 0.55 * (1 - dd * dd) * k)
      }
      // (DES BULLES LUISANTES : elles bombent, sombres, une lueur dedans et un reflet blanc ; elles crèvent en un anneau qui
      // court et quelques éclaboussures)
      for (let j = 0; j < 6; j++) {
        const vie = 1.6 + 0.8 * alea(f.id, j, 1)
        const cycle = (m.t + alea(f.id, j, 2) * vie) / vie
        const u = cycle % 1
        const an = f.cap + (alea(f.id, j, 3) * 2 - 1) * cr.cone * 0.8
        const d = L * (0.25 + 0.65 * alea(f.id, j, 4 + Math.floor(cycle)))
        const bx = f.x + Math.cos(an) * d
        const by = f.y + Math.sin(an) * d
        const rmax = 1 + 1.6 * alea(f.id, j, 5)
        if (u < 0.7) {
          const r = rmax * (1 - Math.pow(1 - u / 0.7, 3))
          if (r < 0.5) continue
          p.circle(bx, by, r + 0.6, G[1], k)
          p.circle(bx, by, r, G[4], k)
          p.circle(bx + r * 0.15, by + r * 0.15, r * 0.55, G[6], k)
          if (r > 1.1) p.px(Math.round(bx - r * 0.4), Math.round(by - r * 0.5), N.WHITE)
        } else {
          const q = (u - 0.7) / 0.3
          p.ring(bx, by, 1 + 4 * q, 1, q < 0.4 ? N.WHITE : G[7], (1 - q) * k)
          for (let e = 0; e < 3; e++) {
            const ae = alea(f.id, j * 7 + e, Math.floor(cycle)) * Math.PI * 2
            p.dot(bx + Math.cos(ae) * (1 + 5 * q), by + Math.sin(ae) * (1 + 5 * q) - 3 * q * (1 - q), e % 2 === 0 ? HUILE[3] : G[6], (1 - q) * k)
          }
        }
      }
      // (LA VAPEUR : des rubans qui montent de la flaque en ondulant, vert-jaune près d'elle, pâles en s'élevant)
      for (let j = 0; j < 3; j++) {
        const vie = 2.2
        const age = (m.t * 0.8 + alea(f.id, j, 31) * vie) % vie
        const uv = age / vie
        const an = f.cap + (alea(f.id, j, 32) * 2 - 1) * cr.cone * 0.6
        const d0 = L * (0.3 + 0.5 * alea(f.id, j, 33))
        const x0 = f.x + Math.cos(an) * d0
        const y0 = f.y + Math.sin(an) * d0
        const tete = age * 9
        const queue = Math.max(0, tete - 14)
        const fondu = Math.min(1, uv / 0.12) * (1 - Math.max(0, (uv - 0.5) / 0.5))
        for (let h = queue; h <= tete; h += 0.5) {
          const sv = (h - queue) / Math.max(1, tete - queue)
          p.blend(x0 + 2.5 * Math.sin(h * 0.25 + j + age * 1.6) * (0.3 + sv), y0 - h, h < 5 ? G[6] : VAPEUR, fondu * Math.sin(Math.PI * sv) * 0.4 * k)
        }
      }
    }
    p.place(0, 0)
  }
  function dessinerLesCrachats(p: Peintre): void {
    for (let i = crachats.length - 1; i >= 0; i--) if (t - crachats[i].t0 > DUREE_DU_CRACHAT) crachats.splice(i, 1)
    if (crachats.length === 0) return
    p.place(W / 2 - camera.x, centreY() - camera.y)
    for (const c of crachats) {
      const u = (t - c.t0) / DUREE_DU_CRACHAT
      // (L'ÉCLABOUSSURE DE PIXELFX — Keko, 17/11 : un éclair blanc à la gueule, des gouttes à tête vive, et là où elles
      // retombent, un grésillement — une étoile blanche qui s'ouvre)
      const E = ECLABOUSSURE
      if (u < 0.25) {
        const q = u / 0.25
        p.circle(c.x, c.y, 2 + 3 * q, q < 0.5 ? N.WHITE : E[7], 1 - q)
        N.sparkle(p, c.x, c.y, 2 + 4 * (1 - q), E[7], E[6], 0.6 * (1 - q))
      }
      for (let j = 0; j < 26; j++) {
        const an = c.cap + (alea(c.id, j, 1) * 2 - 1) * c.cone
        const vit = (0.65 + 0.35 * alea(c.id, j, 2)) * (1 - Math.abs(an - c.cap) / (c.cone * 2.5))
        const d = c.portee * Math.min(1, u * 1.4) * vit
        const x = c.x + Math.cos(an) * d
        const y = c.y + Math.sin(an) * d
        const r = (1.6 - u) * (0.6 + 0.6 * alea(c.id, j, 3))
        p.circle(x, y, Math.max(0.5, r), j % 3 === 0 ? E[6] : E[5], 1 - u * 0.7)
        p.px(Math.round(x - Math.cos(an) * r * 0.4), Math.round(y - Math.sin(an) * r * 0.4), u < 0.5 ? E[7] : E[6])
        if (j % 4 === 0) p.line(x, y, x - Math.cos(an) * 3, y - Math.sin(an) * 3, E[4], 0.6 * (1 - u))
        if (j % 3 === 0 && u > 0.68) {
          const q = (u - 0.68) / 0.32
          p.px(Math.round(x), Math.round(y), N.WHITE)
          for (const [dx, dy] of [[1, 0], [-1, 0], [0, -1]]) p.dot(x + dx * (1 + q * 2), y + dy * (1 + q * 2), E[7], 1 - q)
        }
      }
      if (u < 0.4) p.glow(c.x, c.y, 8, E[5], 0.6 * (1 - u / 0.4))
    }
    p.place(0, 0)
  }
  /**
   * LES BÊTES POUSSENT EN LÂCHANT DES BULLES (Keko, 16/11 : « pour le Léviathan et la Vouivre, autre chose qu'un propulseur
   * comme ça ? la couleur verte est bien, mais l'aspect feu, c'est pas très cohérent ») : le Kraken et la Vouivre n'ont
   * plus de flamme ; en poussée, leur queue lâche des BULLES — de bile, de venin —, des anneaux clairs et des gouttes
   * pleines, qui s'en vont lentement, ralentissent, enflent un peu et crèvent.
   */
  // (LE NÉANT n'a pas de tuyère non plus : il lâche des éclats de néant, magenta — Keko, 16/11)
  // (… ET LA MANTE, LE PRISME ET LE TESSERACT — Keko, 17/11 : une bête de l'Essaim, deux formes des Innommés)
  const organique = (coque: number): boolean => coque >= 10
  /** Les Innommés ne lâchent rien : ils plissent l'espace (le Néant ses ondes, le Prisme des éclats, le Tesseract des cadres). */
  const plieLEspace = (coque: number): boolean => coque === 12 || coque === 13 || coque === 15
  /** Pas de verrière à faire luire : un cœur, un cristal, une bête, un œil. */
  const sansVerriere = (coque: number): boolean => coque >= 12
  /** Les tons du sillage d'un Innommé (sombre, moyen, clair), à l'apparence du joueur. */
  const tonsDuSillage = (coque: number): number[] => {
    const m = coque === 12 ? 'energie' : coque === 15 ? 'spectre' : 'rayonnement'
    const r = rampesDuJoueur()?.[m]
    return r !== undefined ? [r[2], r[3], r[4]] : tonsDeLaMatiere(m)
  }
  const couleursDesBulles = (coque: number): [number, number] => (coque === 13 ? [VIDE[3], VIDE[5]] : coque === 11 ? [VENIN[3], VENIN[5]] : [BILE[1], BILE[2]])
  /**
   * LE NÉANT POUSSE PAR ONDES (Keko, 16/11 : « la propulsion aussi, essaie de trouver un autre effet, peut-être des ondes ou un
   * truc original ») : il ne lâche rien — il PLISSE L'ESPACE derrière lui. En poussée, des fronts d'onde en arc, ouverts
   * vers l'arrière, naissent à sa poupe et s'ouvrent en s'effaçant, comme le sillage d'une onde gravitationnelle : un
   * trait clair doublé d'un trait sombre juste devant (l'espace creusé), une rafale plus serrée à pleine poussée.
   */
  const ondes: { x: number; y: number; cap: number; t0: number; k: number; coque: number }[] = []
  let ondeA = -10
  let ondeEn = { x: 0, y: 0 }
  // (… PLUS GRANDES ET PLUS VIVES : à 15 de rayon et en pâle, on n'en voyait qu'un petit arc derrière lui)
  // (… PUIS BEAUCOUP PLUS DISCRÈTES — Keko, 16/11 : « les ondes sont beaucoup trop visibles, je pensais à quelque chose de
  // beaucoup plus discret » : un seul trait sombre, à peine translucide, qui s'ouvre jusqu'à 11, plus espacées)
  const DUREE_DE_L_ONDE = 0.55
  function dessinerUneOnde(p: Peintre, x: number, y: number, cap: number, u: number, k: number, e = 1, coque = 13): void {
    const [, moyen, clair] = tonsDuSillage(coque)
    if (coque === 12) {
      // LE PRISME SÈME DES ÉCLATS (Keko, 17/11) : un petit losange de cristal se détache, tourne sur lui-même et s'éteint
      const r = (1.1 + 1.3 * u) * e
      const a = cap + u * 6 + x * 0.3
      const [ux, uy] = [Math.cos(a), Math.sin(a)]
      p.poly([[x + ux * r * 1.4, y + uy * r * 1.4], [x - uy * r * 0.6, y + ux * r * 0.6], [x - ux * r * 1.4, y - uy * r * 1.4], [x + uy * r * 0.6, y - ux * r * 0.6]], u < 0.3 ? clair : moyen, 0.85 * (1 - u) * k)
      if (u < 0.2) p.dot(x, y, N.WHITE, 0.8 * k)
      return
    }
    if (coque === 15) {
      // LE TESSERACT LAISSE DES CADRES (Keko, 17/11) : un carré de lumière qui s'ouvre en tournant et s'éteint — l'empreinte
      // d'une face de son hypercube
      const h = (1.5 + 6 * (1 - (1 - u) * (1 - u))) * e
      const a = cap + Math.PI / 4 + u * 1.4
      const coin = (j: number): [number, number] => [x + Math.cos(a + (j * Math.PI) / 2) * h, y + Math.sin(a + (j * Math.PI) / 2) * h]
      for (let j = 0; j < 4; j++) {
        const [x0, y0] = coin(j)
        const [x1, y1] = coin(j + 1)
        p.line(x0, y0, x1, y1, u < 0.4 ? clair : moyen, 0.45 * (1 - u) * k)
      }
      return
    }
    const r = (3 + 8 * (1 - (1 - u) * (1 - u))) * e
    const ouvre = 0.8 + 0.2 * u
    const a0 = cap + Math.PI - ouvre
    const a1 = cap + Math.PI + ouvre
    p.arc(x, y, r, Math.max(1, Math.round(e)), a0, a1, u < 0.4 ? clair : moyen, 0.35 * (1 - u) * k)
  }
  /**
   * LE SON DE LA POUSSÉE, selon le vaisseau (Keko, 16/11) : les bêtes (le Kraken, la Vouivre) gargouillent, le Néant
   * bourdonne, les autres soufflent — en vol (`regler`) comme au décollage du hangar (`sonDuDecollage`).
   */
  const genreDePropulsion = (): GenreDePropulsion => {
    const c = monteeA(hangar, 'coque').cran
    return c === 10 || c === 11 || c === 14 ? 'bete' : plieLEspace(c) ? 'neant' : 'souffle'
  }
  const sonDuDecollage = (): Son => ({ bete: 'decolleBete', neant: 'decolleNeant', souffle: 'decolle' } as const)[genreDePropulsion()]
  /**
   * LA MORT D'UN VAISSEAU À SON IMAGE (Keko, 16/11 : « quand un vaisseau meurt, il explose — on a gardé ça parce qu'au
   * début on n'avait que le chasseur ; il faudrait des explosions qui matchent le vaisseau et son système d'énergie :
   * un réacteur bleu, des flammes bleues ; un vaisseau organique, du sang vert ; le Néant, quelque chose d'approprié ») :
   * - LES BÊTES (Kraken, Vouivre) CRÈVENT — `eclatement-organique` : du sang de bile ou de venin, des lambeaux de chair ;
   * - LE NÉANT S'EFFONDRE sur lui-même — `effondrement-neant` : un trou noir qui avale ses anneaux, puis une onde ;
   * - LES AUTRES EXPLOSENT, à la couleur de ce qui les pousse — le plasma violet du Pulsar ; la glace du Frimas et le
   *   cristal du Prisme, en éclats ; le bleu d'un réacteur ionique (un propulseur de cran 3, les jets froids de la
   *   soucoupe) ; le feu orange des autres —, et leurs débris à la couleur de leur coque.
   */
  const FEUX_DE_MORT: Record<string, { palette: string[]; feu: string[]; debris: string; eclats?: string[] }> = {
    ion: { palette: ['#08143a', '#1440a0', '#1a6ad8', '#3a9cf0', '#60c8ff', '#a0ecff', '#e0f8ff', '#ffffff'], feu: ['#ffffff', '#e0f8ff', '#a0ecff', '#60c8ff', '#3a9cf0', '#1a6ad8', '#1440a0', '#0e2468', '#08143a'], debris: '#46587a' },
    plasma: { palette: ['#140a26', '#2a0c5a', '#4a1a8c', '#8a3ce0', '#9a5cf0', '#c48cff', '#f0d8ff', '#ffffff'], feu: ['#ffffff', '#f0d8ff', '#c48cff', '#9a5cf0', '#8a3ce0', '#6a2cc0', '#4a1a8c', '#2a0c5a', '#140a26'], debris: '#3a2c5c' },
    glace: { palette: ['#0c1024', '#151a3d', '#212f6b', '#2c58aa', '#3a8bd8', '#7ed4f8', '#e6fbff', '#ffffff'], feu: ['#ffffff', '#e6fbff', '#a6ecff', '#7ed4f8', '#3a8bd8', '#2c58aa', '#212f6b', '#151a3d', '#0c1024'], debris: '#4e477a', eclats: ['#e6fbff', '#a6ecff', '#62c8f4', '#3a8bd8'] },
    cristal: { palette: ['#040a1a', '#0a2a6a', '#1a5ad0', '#40a0ff', '#80d8ff', '#c8f4ff', '#e8fbff', '#ffffff'], feu: ['#ffffff', '#c8f4ff', '#80d8ff', '#40a0ff', '#1a5ad0', '#124aa8', '#0a2a6a', '#081a44', '#040a1a'], debris: '#2a3866', eclats: ['#ffffff', '#b8d8f4', '#7aa0d8', '#80d8ff'] },
  }
  function effetDeLaMort(x: number, y: number): Instance {
    const coque = monteeA(hangar, 'coque').cran
    if (coque === 10 || coque === 11 || coque === 14)
      return N.createFx(ECLATEMENT_ORGANIQUE as Module, { x, y, size: 0.55, seed: 5, chair: coque === 10 ? '#56303a' : coque === 14 ? '#2e5a18' : '#34523c', sang: coque === 11 ? ['#1a3006', '#2e5a08', '#4e8e10', '#7cc81c', '#b8f040', '#f0ffb0'] : ['#1a2a06', '#3a5a0c', '#6a9a14', '#a8d42a', '#e0f870', '#ffffe0'] })
    if (coque === 13) return N.createFx(EFFONDREMENT_NEANT as Module, { x, y, size: 0.75, seed: 5 })
    // (le Tesseract s'effondre aussi, dans sa lumière vert d'eau)
    if (coque === 15) return N.createFx(EFFONDREMENT_NEANT as Module, { x, y, size: 0.7, seed: 7, palette: ['#020a08', '#04201a', '#083a30', '#0c5a48', '#18a080', '#50e8c0', '#a0ffe0', '#e8fff8'] })
    const genre = coque === 9 ? 'plasma' : coque === 8 ? 'glace' : coque === 12 ? 'cristal' : coque === 6 || monteeA(hangar, 'propulseur').cran >= 3 ? 'ion' : null
    if (genre === null) return N.createFx(EXPLOSION as Module, { x, y, debris: '#46587a', size: 0.45, seed: 5 })
    const f = FEUX_DE_MORT[genre]
    return N.createFx(EXPLOSION as Module, { x, y, palette: f.palette, feu: f.feu, debris: coque === 6 ? '#464b68' : f.debris, eclats: f.eclats ?? null, size: 0.45, seed: 5 })
  }
  const sonDeLaMort = (): Son => ({ bete: 'perduBete', neant: 'perduNeant', souffle: 'perdu' } as const)[genreDePropulsion()]
  /**
   * LA POUSSÉE D'UN VAISSEAU SANS TUYÈRE, À L'ARRÊT DU MONDE (l'accueil, le décollage du hangar) : le vaisseau est fixe
   * à l'écran, sa poussée défile sous lui en boucle — les ONDES du Néant, les BULLES du Kraken et de la Vouivre —, la même
   * que celle qu'il sème en vol (Keko, 16/11 : « la propulsion d'un vaisseau doit être la même dans l'écran d'accueil, au
   * décollage du hangar et en jeu — pas exactement, l'échelle n'est pas la même, mais le joueur doit l'identifier comme
   * cohérente » : au décollage, elles lâchaient des points qui tombaient). `ty` : sa poupe ; `E` : son échelle ; `us` : 0 au
   * ralenti, 1 à pleine poussée.
   */
  function dessinerLaPousseeSansTuyere(p: Peintre, coque: number, cx: number, ty: number, E: number, us: number): void {
    const boucle = (a: number, b: number): number => ((a % b) + b) % b
    if (plieLEspace(coque)) {
      const n = coque === 12 ? 6 : 4
      for (let k = 0; k < n; k++) {
        const u = boucle(t * (1.6 + us * 1.6) + k / n, 1)
        const dx = coque === 12 ? Math.sin(k * 2.3) * 3 * (E / 2) : 0
        dessinerUneOnde(p, cx + dx, ty + 2 + u * (coque === 12 ? 14 : 8) * (E / 2), -Math.PI / 2, u, 0.6 + 0.4 * us, E / 2, coque)
      }
      return
    }
    const [cb, cl] = couleursDesBulles(coque)
    for (let k = 0; k < 16; k++) {
      const u = boucle(t * (1.6 + us * 2) + k / 16, 1)
      const x = cx + Math.sin(k * 7.3 + u * 4) * (1.5 + u * 6)
      // (courte : elle crève juste derrière — longue, on la prenait pour une attaque)
      const y = ty + 3 + u * (16 + us * 40)
      const r = (0.6 + 0.9 * ((k * 0.618) % 1)) * (1 + 0.6 * u) * (E / 2)
      const c = k % 3 === 0 ? cl : cb
      if (u > 0.9) for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) p.dot(x + dx * (r + 1.5), y + dy * (r + 1.5), c, 0.8)
      else if (r >= 1.6) {
        p.ring(x, y, r, 1, c, 0.9 * (1 - u * 0.5))
        p.dot(x - r * 0.4, y - r * 0.4, N.WHITE, 0.85)
      } else p.circle(x, y, Math.max(0.6, r * 0.7), c, 1 - u * 0.5)
    }
  }
  function dessinerLesOndes(p: Peintre): void {
    for (let i = ondes.length - 1; i >= 0; i--) if (t - ondes[i].t0 > DUREE_DE_L_ONDE) ondes.splice(i, 1)
    if (ondes.length === 0) return
    p.place(W / 2 - camera.x, centreY() - camera.y)
    for (const o of ondes) dessinerUneOnde(p, o.x, o.y, o.cap, (t - o.t0) / DUREE_DE_L_ONDE, o.k, 1, o.coque)
    p.place(0, 0)
  }
  const bulles: { x: number; y: number; vx: number; vy: number; t0: number; vie: number; r: number; c: number }[] = []
  function dessinerLesBulles(p: Peintre): void {
    for (let i = bulles.length - 1; i >= 0; i--) if (t - bulles[i].t0 > bulles[i].vie) bulles.splice(i, 1)
    if (bulles.length === 0) return
    p.place(W / 2 - camera.x, centreY() - camera.y)
    for (const b of bulles) {
      const age = t - b.t0
      const u = age / b.vie
      // (elles ralentissent vite : une bulle n'a pas d'élan)
      const frein = (1 - Math.exp(-age * 3)) / 3
      const x = b.x + b.vx * frein + Math.sin(age * 6 + b.r * 9) * 0.8
      const y = b.y + b.vy * frein
      const r = b.r * (1 + 0.4 * u)
      if (u > 0.9) {
        // (elle crève : quatre éclaboussures)
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) p.dot(x + dx * (r + 1), y + dy * (r + 1), b.c, 0.8)
      } else if (r >= 1.1) {
        p.ring(x, y, r, 1, b.c, 0.85 * (1 - u * 0.5))
        p.dot(x - r * 0.4, y - r * 0.4, N.WHITE, 0.8)
      } else p.dot(x, y, b.c, 1 - u * 0.5)
    }
    p.place(0, 0)
  }
  /**
   * LES MINES D'ACIDE DE LA VOUIVRE (voir `Arme.mine`). EN VOL : une pustule qui monte et retombe en cloche (sa hauteur
   * décale le dessin vers le haut, son ombre reste au sol), qui tremble. POSÉE : un bubon sur un bourrelet de lie, qui
   * BAT comme les pustules de la bête (boum-boum), luit, et fume un peu ; il bat plus vite ses deux dernières secondes.
   * L'ÉCLATEMENT : un nuage de gaz vert et violet — des bouffées qui s'ouvrent jusqu'au rayon et s'effacent en roulant.
   */
  const LIE = ['#26122e', '#3c1c48', '#563068', '#7a4c8e'].map((c) => N.hex(c))
  const DUREE_DU_GAZ = 0.8
  const gaz: { x: number; y: number; rayon: number; t0: number; id: number }[] = []
  const pouls = (u: number): number => Math.exp(-(((u - 0.08) / 0.06) ** 2)) + 0.7 * Math.exp(-(((u - 0.27) / 0.06) ** 2))
  /**
   * UN AMAS DE CLOQUES (une mine d'acide) : `n` cloques — la plus grosse au milieu, les autres autour, à des angles et des
   * tailles tirés de l'id —, cernées de lie sombre puis claire, une bulle de venin, un reflet ; chacune bat (``pouls``) à
   * sa phase, `vite` battements par seconde ; `k` : l'échelle.
   */
  function dessinerUnAmas(p: Peintre, x: number, y: number, id: number, age: number, vite: number, n: number, k: number): void {
    const cloques: [number, number, number, number][] = [[0, 0, 2.4, 0]]
    for (let j = 1; j < n; j++) {
      const a = alea(id, j, 61) * Math.PI * 2 + j * 2.1
      const d = 2.3 + 1.2 * alea(id, j, 62)
      cloques.push([Math.cos(a) * d, Math.sin(a) * d * 0.85, 1.2 + 0.9 * alea(id, j, 63), alea(id, j, 64)])
    }
    // (d'abord tous les cernes, puis toutes les bulles : les cloques se touchent sans se couper)
    for (const [dx, dy, r] of cloques) p.circle(x + dx * k, y + dy * k, (r + 0.9) * k, LIE[0])
    for (const [dx, dy, r, ph] of cloques) {
      const rr = r * (1 + 0.28 * pouls((age * vite + ph) % 1)) * k
      const cx = x + dx * k
      const cy = y + dy * k
      p.circle(cx, cy, rr + 0.4, LIE[2])
      p.circle(cx, cy, rr, VENIN[2])
      p.circle(cx - rr * 0.25, cy - rr * 0.25, rr * 0.55, VENIN[4])
      p.px(Math.round(cx - rr * 0.45), Math.round(cy - rr * 0.5), VENIN[5])
    }
  }
  function dessinerLesMines(p: Peintre): void {
    if (m.mines.length === 0) return
    p.place(W / 2 - camera.x, centreY() - camera.y)
    for (const mn of m.mines) {
      const mi = CONF.armes[mn.arme]?.mine
      if (mi === undefined) continue
      const age = m.t - mn.lancee
      if (age < mi.vol) {
        // (son ombre au sol, là où elle va tomber)
        const u = age / mi.vol
        p.circle(mn.x0 + (mn.x - mn.x0) * u, mn.y0 + (mn.y - mn.y0) * u, 1.6, N.hex('#06040a'), 0.4)
        continue
      }
      // (UN AMAS DE CLOQUES — Keko, 16/11 : « plutôt l'apparence d'un amas de bulles, un peu plus grosses, comme plusieurs
      // petites cloques, plusieurs petites pustules regroupées ») : six cloques de tailles différentes, serrées, chacune
      // cernée de lie, son reflet, et qui bat à son rythme — plus vite les deux dernières secondes)
      const reste = mi.vol + mi.duree - age
      const vite = reste < 2 ? 3.2 : 1.6
      p.glow(mn.x, mn.y, 10, VENIN[3], 0.25 + 0.1 * Math.sin(t * 4 + mn.id))
      dessinerUnAmas(p, mn.x, mn.y, mn.id, age, vite, 6, 1)
      // (un filet de gaz qui s'en échappe)
      const fu = (t * 0.9 + mn.id * 0.53) % 1
      p.dot(mn.x + Math.sin(mn.id + fu * 4) * 1.5, mn.y - 2 - fu * 6, VENIN[3], 0.6 * (1 - fu))
    }
    p.place(0, 0)
  }
  function dessinerLesGaz(p: Peintre): void {
    for (let i = gaz.length - 1; i >= 0; i--) if (t - gaz[i].t0 > DUREE_DU_GAZ) gaz.splice(i, 1)
    const enVol = m.mines.filter((mn) => {
      const mi = CONF.armes[mn.arme]?.mine
      return mi !== undefined && m.t - mn.lancee < mi.vol
    })
    if (gaz.length === 0 && enVol.length === 0) return
    p.place(W / 2 - camera.x, centreY() - camera.y)
    // (les pustules en vol, en cloche, au-dessus de tout)
    for (const mn of enVol) {
      const mi = CONF.armes[mn.arme]!.mine!
      const u = (m.t - mn.lancee) / mi.vol
      const h = Math.sin(Math.PI * u) * 16
      const x = mn.x0 + (mn.x - mn.x0) * u
      const y = mn.y0 + (mn.y - mn.y0) * u - h
      p.glow(x, y, 6, VENIN[3], 0.35)
      dessinerUnAmas(p, x, y, mn.id, m.t - mn.lancee, 4, 3, 0.8)
    }
    for (const g of gaz) {
      const u = (t - g.t0) / DUREE_DU_GAZ
      const v1 = 1 - u
      // (LE NUAGE DE POISON DE PIXELFX — Keko, 17/11 : un miasme éclairé du dedans, vert-jaune au cœur, qui vire au violet
      // vers ses bords ; ses bords s'enroulent en volutes ; des grains qui scintillent dérivent avec lui)
      const M = MIASME
      if (u < 0.15) p.glow(g.x, g.y, g.rayon * 0.8, M[6], 0.6 * (1 - u / 0.15))
      p.glow(g.x, g.y, g.rayon * 0.7, M[5], 0.25 * v1)
      // (des bouffées qui s'ouvrent jusqu'au rayon et roulent)
      for (let j = 0; j < 9; j++) {
        const a = alea(g.id, j, 1) * Math.PI * 2 + u * (alea(g.id, j, 2) - 0.5) * 2
        const d = g.rayon * (0.15 + 0.7 * alea(g.id, j, 3)) * Math.sqrt(Math.min(1, u * 2.5))
        const r = g.rayon * (0.22 + 0.18 * alea(g.id, j, 4)) * (0.6 + 0.6 * u)
        const loin = d / g.rayon
        p.disc(g.x + Math.cos(a) * d, g.y + Math.sin(a) * d, r, (dd) => {
          const v = dd * 0.8 + loin * 0.3
          return v < 0.3 ? M[7] : v < 0.55 ? M[6] : v < 0.8 ? M[5] : v < 0.95 ? M[3] : M[2]
        }, (dd) => (1 - dd * dd) * 0.6 * v1)
      }
      // (les volutes : trois bords de gaz qui s'enroulent sur eux-mêmes en s'ouvrant)
      for (let j = 0; j < 3; j++) {
        const a0 = alea(g.id, j, 11) * Math.PI * 2
        const rr = g.rayon * (0.55 + 0.4 * Math.sqrt(u))
        const cx = g.x + Math.cos(a0) * rr
        const cy = g.y + Math.sin(a0) * rr
        const spin = u * Math.PI * 4 * (j % 2 === 0 ? 1 : -1)
        const r0 = 2 + g.rayon * 0.12
        for (let b = 0; b < 4.6; b += 0.2) {
          const rb = r0 * (1 - b * 0.12)
          p.blend(cx + Math.cos(spin + b) * rb, cy + Math.sin(spin + b) * rb, b < 2 ? M[6] : M[5], 0.6 * v1 * (1 - b / 5.5))
        }
      }
      // (des grains qui scintillent en dérivant vers le dehors)
      for (let j = 0; j < 8; j++) {
        const a = alea(g.id, j, 41) * Math.PI * 2
        const d = g.rayon * (0.2 + 0.9 * u) * (0.5 + 0.5 * alea(g.id, j, 42))
        const sc = 0.6 + 0.4 * Math.sin(t * 9 + j * 1.7)
        p.dot(g.x + Math.cos(a) * d, g.y + Math.sin(a) * d, sc > 0.8 ? M[7] : M[6], v1 * sc)
      }
      p.ring(g.x, g.y, g.rayon * (0.3 + 0.7 * Math.sqrt(u)), 1, M[6], 0.6 * v1)
    }
    p.place(0, 0)
  }
  /**
   * LE FLÉAU DE L'INGÉNIEUR (voir `Arme.fleau`), sous le vaisseau : LA CHAÎNE, des maillons d'acier alternés, clair et
   * sombre, du vaisseau à la masse ; LA MASSE, une boule d'acier cernée, éclairée d'un côté, hérissée de huit pics qui
   * tournent avec elle ; derrière elle, un FLOU DE VITESSE — quelques traces qui pâlissent le long de sa course.
   */
  const ACIER_DU_FLEAU = ['#151520', '#2a2a3a', '#45455a', '#68687f', '#9797ad', '#d6d6e6'].map((c) => N.hex(c))
  function dessinerLesFleaux(p: Peintre): void {
    if (m.fleaux.length === 0 || m.phase !== 'vol') return
    p.place(W / 2 - camera.x, centreY() - camera.y)
    const v0 = m.vaisseau
    for (const f of m.fleaux) {
      const fl = CONF.armes[f.arme]?.fleau
      if (fl === undefined) continue
      const dx = f.x - v0.x
      const dy = f.y - v0.y
      const L = Math.hypot(dx, dy) || 1
      // (la chaîne : une ligne d'acier sur son ombre, un maillon clair tous les deux pixels — fine et sombre, on la perdait)
      p.line(v0.x + 1, v0.y + 1, f.x + 1, f.y + 1, ACIER_DU_FLEAU[0])
      p.line(v0.x, v0.y, f.x, f.y, ACIER_DU_FLEAU[3])
      const n = Math.floor(L / 2)
      for (let k = 1; k < n; k += 2) p.px(Math.round(v0.x + (dx * k) / n), Math.round(v0.y + (dy * k) / n), ACIER_DU_FLEAU[5])
      // (le flou de vitesse : la masse un peu en arrière sur sa course, plusieurs fois, de plus en plus pâle)
      const rvx = f.vx - v0.vx
      const rvy = f.vy - v0.vy
      for (let j = 4; j >= 1; j--) p.circle(f.x - rvx * 0.012 * j, f.y - rvy * 0.012 * j, fl.rayon * (1 - j * 0.12), ACIER_DU_FLEAU[3], 0.35 * (1 - j / 5))
      // (la masse : cernée, éclairée d'en haut à gauche ; huit pics qui tournent avec elle)
      const tourne = t * 9
      for (let k = 0; k < 8; k++) {
        const a = tourne + (k * Math.PI) / 4
        p.line(f.x + Math.cos(a) * fl.rayon * 0.7, f.y + Math.sin(a) * fl.rayon * 0.7, f.x + Math.cos(a) * (fl.rayon + 2.2), f.y + Math.sin(a) * (fl.rayon + 2.2), ACIER_DU_FLEAU[4])
        p.px(Math.round(f.x + Math.cos(a) * (fl.rayon + 2.2)), Math.round(f.y + Math.sin(a) * (fl.rayon + 2.2)), ACIER_DU_FLEAU[5])
      }
      p.circle(f.x, f.y, fl.rayon * 0.85 + 0.8, ACIER_DU_FLEAU[0])
      p.circle(f.x, f.y, fl.rayon * 0.85, ACIER_DU_FLEAU[2])
      p.circle(f.x - 0.8, f.y - 0.8, fl.rayon * 0.45, ACIER_DU_FLEAU[4])
      p.px(Math.round(f.x - 1.4), Math.round(f.y - 1.4), ACIER_DU_FLEAU[5])
    }
    p.place(0, 0)
  }
  /**
   * LES PARASITES DU VER (voir `Arme.parasite` ; Keko, 18/11 : « pas des parasites de poison ; de petits cerveaux avec
   * des dents qui s'accrochent, un peu comme les métroïdes ») : UN CERVEAU — deux lobes mauves, le sillon au milieu, des
   * circonvolutions — sous une MEMBRANE translucide cernée de cyan, quatre CROCS de la chair du Ver devant lui. EN VOL, les crocs vers
   * sa proie, il palpite et deux filaments traînent derrière. EN PLEIN BOND, il culbute en cloche, son ombre au sol.
   * ACCROCHÉ, il est posé sur le dos de son hôte, les crocs plantés dedans, et il enfle à chaque gorgée — l'hôte luit mauve.
   * (Mauves et cyan : roses, on les perdait sur les insectes, roses eux aussi.)
   */
  const CERVEAU = ['#1c0a2e', '#5a3a8e', '#a084dc', '#d4c4fa', '#ffffff'].map((c) => N.hex(c))
  const MEMBRANE = ['#0a3a40', '#2aa8a8', '#7af0e0'].map((c) => N.hex(c))
  /**
   * Un cerveau à crocs en (x, y), les crocs vers (ux, uy) ; `gros` sa taille ; `mord` : 0 crocs ouverts, 1 refermés ;
   * `chair` les tons de ses crocs (sombre, moyen, clair).
   * (LES CROCS ONT LA CHAIR DU VER — Keko, 18/11 : « la partie inférieure des parasites, celle qui est claire, de la même
   * couleur que le ver, pour donner une cohérence » : ils étaient d'os ; ils suivent l'apparence du joueur)
   */
  function dessinerUnCerveau(p: Peintre, x: number, y: number, ux: number, uy: number, gros: number, mord: number, chair: number[]): void {
    const nx = -uy
    const ny = ux
    // (la membrane : un dôme translucide, plus grand que le cerveau, cerné de cyan)
    p.disc(x, y, 3.6 * gros, MEMBRANE[1], (d) => 0.12 + 0.3 * d * d)
    p.ring(x, y, 3.6 * gros, 0.6, MEMBRANE[2], 0.55)
    // (les crocs : quatre, devant, qui se referment quand il mord)
    for (const k of [-1.5, -0.5, 0.5, 1.5]) {
      const bx = x + ux * 1.9 * gros + nx * k * 0.85 * gros
      const by = y + uy * 1.9 * gros + ny * k * 0.85 * gros
      const lg = (Math.abs(k) > 1 ? 2.2 : 1.6) * gros
      const pince = k * (0.35 - 0.45 * mord) * gros
      const tx = bx + ux * lg + nx * pince
      const ty = by + uy * lg + ny * pince
      p.line(bx, by, tx, ty, chair[0])
      p.line(bx + ux * 0.4, by + uy * 0.4, tx, ty, chair[1])
      p.px(Math.round(tx), Math.round(ty), chair[2])
    }
    // (le cerveau : cerné de sombre ; DEUX LOBES CLAIRS de part et d'autre du sillon sombre, un pli sur chacun, un reflet —
    // mesuré : tout en plis, à cette taille, il ne se lisait que comme une boule sombre)
    p.circle(x, y, 2.6 * gros + 0.7, CERVEAU[0])
    p.circle(x, y, 2.6 * gros, CERVEAU[2])
    for (const s of [-1, 1]) p.circle(x + nx * s * 1.05 * gros - ux * 0.2 * gros, y + ny * s * 1.05 * gros - uy * 0.2 * gros, 1.35 * gros, CERVEAU[3])
    p.line(x - ux * 2.4 * gros, y - uy * 2.4 * gros, x + ux * 2.1 * gros, y + uy * 2.1 * gros, CERVEAU[1])
    for (const s of [-1, 1]) {
      p.px(Math.round(x + nx * s * 1.2 * gros + ux * 0.6 * gros), Math.round(y + ny * s * 1.2 * gros + uy * 0.6 * gros), CERVEAU[2])
      p.px(Math.round(x + nx * s * 1.4 * gros - ux * 0.9 * gros), Math.round(y + ny * s * 1.4 * gros - uy * 0.9 * gros), CERVEAU[4])
    }
    // (le reflet sur la membrane)
    p.px(Math.round(x - ux * 2.4 * gros - nx * 1.8 * gros), Math.round(y - uy * 2.4 * gros - ny * 1.8 * gros), MEMBRANE[2])
  }
  function dessinerLesParasites(p: Peintre): void {
    if (m.parasites.length === 0 || m.phase !== 'vol') return
    p.place(W / 2 - camera.x, centreY() - camera.y)
    const rv = rampesDuJoueur()?.ver
    const chair = rv !== undefined ? [rv[2], rv[3], rv[4]] : tonsDeLaMatiere('ver')
    for (const pa of m.parasites) {
      if (pa.hote !== null) {
        const hote = m.ennemis.find((e) => e.id === pa.hote)
        if (hote === undefined) continue
        const hx = hote.corps.x
        const hy = hote.corps.y
        // (ACCROCHÉ : sur le dos de l'hôte, les crocs plantés dedans ; il enfle à chaque gorgée, l'hôte luit mauve)
        const ph = (t * 2.6 + pa.id * 0.31) % 1
        const gorgee = pouls(ph)
        p.glow(hx, hy, 6, CERVEAU[3], 0.2 + 0.25 * gorgee)
        dessinerUnCerveau(p, hx, hy - 3.2, 0, 1, 1 + 0.15 * gorgee, 0.6 + 0.4 * gorgee, chair)
        continue
      }
      // (EN PLEIN BOND — Keko, 17/11 : « une petite animation où on le voit sauter » : il monte en cloche au-dessus du sol et
      // retombe sur sa proie ; son ombre file au sol, sous lui ; il culbute, grossit au sommet ; une traînée mauve le suit)
      if (pa.bond !== undefined) {
        const b = pa.bond
        const cible = m.ennemis.find((e) => e.id === pa.cible)
        const tx = cible?.corps.x ?? pa.x
        const ty = cible?.corps.y ?? pa.y
        const u = Math.min(1, (m.t - pa.depuis) / b.duree)
        const dist = Math.hypot(tx - b.x0, ty - b.y0)
        const haut = 6 + dist * 0.25
        const ou = (q: number): [number, number, number] => {
          const e = q * q * (3 - 2 * q)
          return [b.x0 + (tx - b.x0) * e, b.y0 + (ty - b.y0) * e, Math.sin(Math.PI * q) * haut]
        }
        const [gx, gy, h] = ou(u)
        p.circle(gx, gy, 2 + 0.8 * (1 - h / haut), N.hex('#06040a'), 0.45)
        for (let j = 1; j <= 5; j++) {
          const q = u - j * 0.05
          if (q <= 0) break
          const [ax, ay, ah] = ou(q)
          p.dot(ax, ay - ah, j % 2 === 0 ? CERVEAU[3] : MEMBRANE[2], 0.8 * (1 - j / 6))
        }
        const gros = 1 + 0.35 * Math.sin(Math.PI * u)
        const rot = u * Math.PI * 2 + Math.atan2(ty - b.y0, tx - b.x0) - Math.PI
        dessinerUnCerveau(p, gx, gy - h, Math.cos(rot), Math.sin(rot), gros, 0, chair)
        continue
      }
      // (EN VOL : les crocs vers sa proie, il palpite ; deux filaments traînent derrière lui et ondulent)
      const l = Math.hypot(pa.vx, pa.vy) || 1
      const ux = pa.vx / l
      const uy = pa.vy / l
      for (const s of [-1, 1]) {
        let x = pa.x - ux * 2.4 - uy * s * 1.2
        let y = pa.y - uy * 2.4 + ux * s * 1.2
        for (let k = 1; k <= 3; k++) {
          const onde = Math.sin(t * 18 - k * 1.2 + s) * 0.6
          const x1 = x - ux * 1.5 - uy * onde
          const y1 = y - uy * 1.5 + ux * onde
          p.line(x, y, x1, y1, k === 1 ? MEMBRANE[2] : MEMBRANE[1], 0.8 - k * 0.2)
          x = x1
          y = y1
        }
      }
      dessinerUnCerveau(p, pa.x, pa.y, ux, uy, 1 + 0.08 * Math.sin(t * 14 + pa.id), 0.5 + 0.5 * Math.sin(t * 9 + pa.id), chair)
    }
    p.place(0, 0)
  }
  /** L'instant du dernier grésillement d'acide (un à la fois). */
  let rongeSonneA = -10
  const CHITINE_CLAIRE = N.hex('#7c4a4c')
  const CHITINE_DU_REJETON = N.hex('#56303a')
  const CHITINE_SOMBRE = N.hex('#1a0c12')
  /** L'instant du dernier bourdonnement de morsure (un à la fois). */
  let morsureSonneA = -10
  /** L'instant du dernier claquement de tentacule (trois à la fois : un seul son). */
  let fouetSonneA = -10
  /** L'instant du dernier craquement de givre (voir l'événement `gele`). */
  let geleSonneA = -10
  /** Les lignes de balises qui viennent de s'éclairer (voir `dessinerLesBalises`). */
  const lignesEclairees: { x0: number; y0: number; x1: number; y1: number; t0: number; bleu?: boolean }[] = []
  /** (SOUS LES VAISSEAUX ET LES INSECTES : dessinées avec les tirs, elles cachaient le vaisseau posé dessus.) */
  function dessinerLesTourelles(p: Peintre): void {
    // LES TOURELLES DE L'INGÉNIEUR, PEINTES COMME LES VAISSEAUX (`formesDuSocleDeTourelle`, `formesDeLaTeteDeTourelle` —
    // Keko, 15/11 : les carrés à un trait n'étaient « pas très jolis ») : le socle fixe, la tête qui pivote vers sa cible,
    // à la lumière du vol et à la couleur du joueur. Elles se DÉPLIENT en naissant (elles grandissent, une onde de
    // poussière), CLIGNOTENT leurs trois dernières secondes.
    const SOCLE = formesDuSocleDeTourelle()
    const TETE = formesDeLaTeteDeTourelle()
    const CAPSULE = formesDeLaCapsule()
    for (const tu of m.tourelles) {
      const po = CONF.armes[tu.arme]?.pose
      if (po === undefined) continue
      // (EN VOL : UNE CAPSULE LANCÉE EN CLOCHE, comme le napalm — Keko, 15/11 : son ombre au sol, elle plus haut au
      // milieu de sa course, un petit caisson qui tourne sur lui-même, un voyant jaune)
      if (!tu.deployee) {
        const u = Math.max(0, Math.min(1, (m.t - tu.lancee) / Math.max(0.01, tu.nee - tu.lancee)))
        const gx = tu.x0 + (tu.x - tu.x0) * u - camera.x + W / 2
        const gy = tu.y0 + (tu.y - tu.y0) * u - camera.y + centreY()
        const h = Math.sin(Math.PI * u) * 14
        p.circle(gx, gy, 3, N.hex('#0a0608'), 0.45)
        // (la capsule PEINTE COMME LES VAISSEAUX, en métal, un peu plus grande — Keko, 15/11 — ; elle tourne sur elle-même)
        peindreFormes(p, CAPSULE, Math.round(gx), Math.round(gy - h), 1.1, { cap: u * Math.PI * 3, lumiere: LUMIERE_DU_VOL, reflet: REFLET_DU_VOL })
        p.glow(gx, gy - h, 5, PEPITE[2], 0.25)
        continue
      }
      const age = m.t - tu.nee
      const reste = po.duree - age
      if (reste < 3 && Math.floor(reste * 6) % 2 === 0) continue
      // (un peu plus grande que le dessin, pour qu'on la lise — MAIS PLUS PETITE QUE LE VAISSEAU, Keko, 15/11 : à 1,5
      // elle le dépassait)
      const k = 1.1 * (0.35 + 0.65 * sortie(Math.min(1, age / 0.25)))
      const sx = Math.round(tu.x - camera.x + W / 2)
      const sy = Math.round(tu.y - camera.y + centreY())
      if (age < 0.4) p.ring(sx, sy, 5 + age * 30, 1, N.hex('#8a8a96'), 1 - age / 0.4)
      peindreFormes(p, SOCLE, sx, sy, k, { cap: -Math.PI / 2, lumiere: LUMIERE_DU_VOL, rampes: rampesDuJoueur(), reflet: REFLET_DU_VOL })
      peindreFormes(p, TETE, sx, sy, k, { cap: tu.cap, lumiere: LUMIERE_DU_VOL, rampes: rampesDuJoueur(), reflet: REFLET_DU_VOL })
      // (plus de jauge de durée sous le socle — Keko, 17/11 : « inutile d'avoir une barre pour la durée de la tourelle » ;
      // le clignotement des trois dernières secondes reste)
    }
  }
  /**
   * LA SCIE DE L'INGÉNIEUR (voir `Arme.scie`) : peinte comme les vaisseaux, en acier, elle TOURNE vite — ses reflets
   * passent sur les dents — et laisse derrière elle deux ombres de son disque, plus pâles, le long de sa course.
   */
  function dessinerLesScies(p: Peintre): void {
    if (m.scies.length === 0) return
    const SCIE = formesDeLaScie()
    for (const s of m.scies) {
      const sx = s.x - camera.x + W / 2
      const sy = s.y - camera.y + centreY()
      const vit = Math.hypot(s.vx, s.vy)
      if (vit > 30)
        for (let k = 1; k <= 2; k++) p.circle(sx - (s.vx / vit) * k * 3, sy - (s.vy / vit) * k * 3, 4.5, N.hex('#8a8a96'), 0.22 / k)
      peindreFormes(p, SCIE, Math.round(sx), Math.round(sy), 1.1, { cap: m.t * 26, lumiere: LUMIERE_DU_VOL, reflet: REFLET_DU_VOL })
    }
  }
  /**
   * LES BALISES DE L'INGÉNIEUR (voir `Arme.balise`), sous les vaisseaux et les insectes : un fin pointillé jaune entre
   * deux balises reliées — on voit le piège, ce n'est pas un laser —, puis chaque balise, peinte comme les vaisseaux, son
   * bec tourné vers chacune de celles d'en face, son fanal qui palpite ; elle se plante en naissant (elle grandit, une
   * onde de poussière), clignote ses trois dernières secondes.
   */
  function dessinerLesBalises(p: Peintre): void {
    // LES LIGNES QUI S'ÉCLAIRENT (Keko, 15/11 : « éclairer la ligne à chaque fois qu'elle est franchie ») : un trait
    // blanc au cœur, dans une large lueur d'or, qui s'éteint en un quart de seconde
    for (let i = lignesEclairees.length - 1; i >= 0; i--) {
      const l = lignesEclairees[i]
      const u = (t - l.t0) / (l.bleu === true ? 0.35 : 0.25)
      if (u >= 1) {
        lignesEclairees.splice(i, 1)
        continue
      }
      const x0 = l.x0 - camera.x + W / 2
      const y0 = l.y0 - camera.y + centreY()
      const x1 = l.x1 - camera.x + W / 2
      const y1 = l.y1 - camera.y + centreY()
      // (LE FAISCEAU D'UN CRISTAL S'ACTIVE : une gaine bleue large, un corps cyan, une âme blanche — le rayon du Prisme)
      if (l.bleu === true) {
        p.glowLine(x0, y0, x1, y1, 8, FAISCEAU[2], 0.6 * (1 - u))
        const nx = -(y1 - y0) / (Math.hypot(x1 - x0, y1 - y0) || 1)
        const ny = (x1 - x0) / (Math.hypot(x1 - x0, y1 - y0) || 1)
        if (u < 0.6) for (const o of [-1, 1]) p.line(x0 + nx * o, y0 + ny * o, x1 + nx * o, y1 + ny * o, FAISCEAU[3], 0.8 * (1 - u / 0.6))
        p.line(x0, y0, x1, y1, u < 0.5 ? N.WHITE : FAISCEAU[4], 1 - u)
        continue
      }
      p.glowLine(x0, y0, x1, y1, 6, PEPITE[2], 0.55 * (1 - u))
      p.line(x0, y0, x1, y1, u < 0.4 ? N.WHITE : PEPITE[3], 1 - u)
    }
    if (m.balises.length === 0) return
    const PLOT = formesDeLaBalise()
    const BEC = formesDuBecDeBalise()
    const CRISTAL = formesDuCristalPose()
    const cristal = (b: { arme: number }): boolean => CONF.armes[b.arme]?.id === 'cristal'
    const ecran = (x: number, y: number): [number, number] => [Math.round(x - camera.x + W / 2), Math.round(y - camera.y + centreY())]
    for (const b of m.balises) for (const li of b.liens) {
      const o = m.balises.find((x) => x.id === li.vers)
      if (o === undefined) continue
      const [x0, y0] = ecran(b.x, b.y)
      const [x1, y1] = ecran(o.x, o.y)
      const l = Math.hypot(x1 - x0, y1 - y0)
      // (DEUX CRISTAUX : un faisceau d'énergie qui les relie en permanence, faible, où des impulsions filent — on voit le
      // piège ; il s'allume quand on le traverse)
      if (cristal(b)) {
        p.glowLine(x0, y0 - 2, x1, y1 - 2, 3, FAISCEAU[2], 0.2 + 0.06 * Math.sin(m.t * 4 + b.id))
        p.line(x0, y0 - 2, x1, y1 - 2, FAISCEAU[2], 0.5)
        const pas = (m.t * 1.5 + b.id * 0.37) % 1
        for (let k = 0; k < 3; k++) {
          const u = (k / 3 + pas) % 1
          p.rect(Math.round(x0 + (x1 - x0) * u), Math.round(y0 - 2 + (y1 - y0) * u), 1, 1, FAISCEAU[4], 0.9)
        }
        continue
      }
      const n = Math.floor(l / 3)
      const pas = (m.t * 6) % 1
      for (let k = 1; k < n; k++) {
        const u = (k + pas) / n
        if (u > 0.08 && u < 0.92) p.rect(Math.round(x0 + (x1 - x0) * u), Math.round(y0 + (y1 - y0) * u), 1, 1, PEPITE[2], 0.55)
      }
    }
    for (const b of m.balises) {
      const ba = CONF.armes[b.arme]?.balise
      if (ba === undefined) continue
      const age = m.t - b.nee
      // (UN TRIANGLE CLIGNOTE ENSEMBLE ses trois dernières secondes : il s'éteint d'un bloc, à la fin de sa dernière balise)
      const reste = finDuTrio(m, b, ba.duree) - m.t
      if (reste < 3 && Math.floor(reste * 6) % 2 === 0) continue
      // (un peu plus grande que le dessin, pour qu'on la lise, plus petite qu'une tourelle)
      const k = 1.3 * (0.4 + 0.6 * sortie(Math.min(1, age / 0.2)))
      const [sx, sy] = ecran(b.x, b.y)
      // (UN CRISTAL : il pousse du sol en naissant, une onde bleue ; son âme palpite)
      if (cristal(b)) {
        if (age < 0.35) p.ring(sx, sy, 4 + age * 30, 1, FAISCEAU[3], 1 - age / 0.35)
        p.circle(sx, sy + 2, 3, N.hex('#0a0608'), 0.4)
        peindreFormes(p, CRISTAL, sx, sy, k * 1.2, { cap: 0, lumiere: LUMIERE_DU_VOL, reflet: REFLET_DU_VOL })
        p.glow(sx, sy - 2, 5, FAISCEAU[3], 0.3 + 0.2 * Math.sin(m.t * 5 + b.id))
        continue
      }
      if (age < 0.35) p.ring(sx, sy, 4 + age * 30, 1, N.hex('#8a8a96'), 1 - age / 0.35)
      peindreFormes(p, PLOT, sx, sy, k, { cap: -Math.PI / 2, lumiere: LUMIERE_DU_VOL, rampes: rampesDuJoueur(), reflet: REFLET_DU_VOL })
      // (un bec vers chaque balise reliée, dans un sens ou dans l'autre)
      for (const o of m.balises)
        if (b.liens.some((li) => li.vers === o.id) || o.liens.some((li) => li.vers === b.id)) peindreFormes(p, BEC, sx, sy, k, { cap: Math.atan2(o.y - b.y, o.x - b.x), lumiere: LUMIERE_DU_VOL, rampes: rampesDuJoueur(), reflet: REFLET_DU_VOL })
      p.glow(sx, sy, 4, PEPITE[2], 0.25 + 0.2 * Math.sin(m.t * 5 + b.id))
    }
  }
  function dessinerLesEnnemis(p: Peintre): void {
    if (VORTEX) {
      dessinerLesAspires(p)
      dessinerLesConsumes(p)
      for (const e of m.ennemis) {
        const b = e.corps
        const sx = b.x - camera.x + W / 2
        const sy = b.y - camera.y + centreY()
        const blanchi = t - (toucheEnnemiA.get(e.id) ?? -10) < 0.1
        dessinerUnInsecte(p, sx, sy, b.cap, e.id * 1.7, blanchi, e.fait === 'aggro')
        // IL EST GELÉ (le givre) : une gangue de glace bleue sur lui, un liseré clair, des éclats de givre qui scintillent
        if ((e.geleA ?? -1) > m.t) {
          p.circle(sx, sy, 5, GLACE[4], 0.32)
          p.ring(sx, sy, 5, 1, GLACE[6], 0.45)
          for (let j = 0; j < 3; j++) if (Math.sin(t * 7 + e.id + j * 2.1) > 0.3) p.rect(Math.round(sx + Math.cos(e.id + j * 2.1) * 3.5), Math.round(sy + Math.sin(e.id + j * 2.1) * 3.5), 1, 1, N.WHITE, 0.9)
        }
        // IL EST EMPOISONNÉ (la traînée du Ver) : une lueur de miasme, deux bulles qui montent
        if ((e.poisonA ?? -1) > m.t) {
          p.glow(sx, sy, 6, MIASME[5], 0.3)
          for (let k = 0; k < 2; k++) {
            const ph = (t * 1.5 + k / 2 + e.id * 0.31) % 1
            p.dot(sx + Math.sin(e.id + k * 2.5) * 2.5, sy - 1 - ph * 6, ph < 0.5 ? MIASME[7] : MIASME[5], 1 - ph)
          }
        }
        // IL EST RONGÉ (l'acide de la Vouivre) : une tache verte sur lui, qui fume — trois volutes qui montent et pâlissent
        if (e.acide !== undefined && e.acide.jusque > m.t) {
          p.glow(sx, sy, 7, VENIN[3], 0.3 + 0.1 * Math.sin(t * 9 + e.id))
          p.circle(sx, sy, 3.5, VENIN[2], 0.35)
          // (… ET IL GRÉSILLE, comme l'éclaboussure de pixelfx — Keko, 17/11 : une vapeur pâle qui monte en ondulant, et de
          // petites étoiles blanches qui pètent sur lui)
          for (let k = 0; k < 2; k++) {
            const ph = (t * 0.9 + k / 2 + e.id * 0.29) % 1
            for (let h = 0; h < 6; h += 0.5) p.blend(sx + Math.sin(e.id * 2.3 + k * 2.1 + h * 0.5 + t * 2) * (1 + h * 0.3), sy - 2 - ph * 6 - h, h < 2 ? ECLABOUSSURE[6] : VAPEUR, 0.35 * (1 - ph) * Math.sin((Math.PI * h) / 6))
          }
          const pet = (t * 5 + e.id * 0.37) % 1
          if (pet < 0.35) {
            const n = Math.floor(t * 5 + e.id * 0.37)
            const ox = sx + (alea(e.id, n, 1) - 0.5) * 6
            const oy = sy + (alea(e.id, n, 2) - 0.5) * 6
            const q = pet / 0.35
            p.px(Math.round(ox), Math.round(oy), N.WHITE)
            for (const [dx, dy] of [[1, 0], [-1, 0], [0, -1]]) p.dot(ox + dx * (1 + q * 2), oy + dy * (1 + q * 2), ECLABOUSSURE[7], 1 - q)
          }
        }
        // IL EST IRRADIÉ (les cristaux du Prisme) : une lueur bleue qui bat, des étincelles d'énergie qui montent
        if (e.irradie !== undefined && e.irradie.jusque > m.t) {
          p.glow(sx, sy, 7, FAISCEAU[3], 0.35 + 0.15 * Math.sin(t * 17 + e.id))
          for (let k = 0; k < 3; k++) {
            const ph = (t * 1.8 + k / 3 + e.id * 0.41) % 1
            p.rect(Math.round(sx + Math.sin(e.id * 2.7 + k * 2.1) * 3), Math.round(sy - 2 - ph * 8), 1, 1, ph < 0.4 ? N.WHITE : FAISCEAU[4], 1 - ph)
          }
        }
        // IL BRÛLE (le lance-flammes) : il rougeoie, et des braises s'en échappent
        if ((e.bruleA ?? -1) > m.t) {
          const reste = Math.min(1, ((e.bruleA ?? 0) - m.t) / Math.max(0.1, e.dureeBrulure ?? 2))
          p.glow(sx, sy, 8, N.hex('#ff6a1a'), (0.35 + 0.15 * Math.sin(t * 23 + e.id)) * (0.4 + 0.6 * reste))
          for (let k = 0; k < 3; k++) {
            const ph = (t * 1.6 + k / 3 + e.id * 0.37) % 1
            const bx = sx + Math.sin(e.id * 3.1 + k * 2.3) * 3
            p.rect(Math.round(bx), Math.round(sy - 2 - ph * 9), 1, 1, ph < 0.4 ? N.hex('#ffd04a') : N.hex('#ff6a1a'), (1 - ph) * reste)
          }
        }
        dernierVu.set(e.id, { cap: b.cap, aggro: e.fait === 'aggro' })
        if (e.pv < CONF.ennemi.pv) dessinerUneJauge(p, sx, sy + CONF.ennemi.rayon + 5, 10, e.pv / CONF.ennemi.pv, ROUGE[4], ROUGE[5], blanchi)
      }
      return
    }
    for (const e of m.ennemis) {
      const b = e.corps
      const cible = e.forage !== null ? e.forage : e.fait === 'chasse' ? { x: v.x, y: v.y } : null
      const vise = cible !== null ? Math.atan2(cible.y - b.y, cible.x - b.x) - b.cap : 0
      const blanchi = t - (toucheEnnemiA.get(e.id) ?? -10) < 0.1
      dessinerUnVaisseau(p, b, flammesEnnemies.get(e.id) ?? 0, vise, ALLURE_DU_RIVAL, blanchi, true)
      // sa vie restante, sous lui (Keko : « afficher la vie restante des ennemis et astéroïdes »)
      dessinerUneJauge(p, b.x - camera.x + W / 2, b.y - camera.y + centreY() + CONF.ennemi.rayon + 4, RIVAL_CUIRASSE ? 28 : 12, e.pv / CONF.ennemi.pv, ROUGE[4], ROUGE[5], blanchi)
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
      if (tr.arme === 'missiles') {
        // (un missile du rival : un corps clair à pointe violette, sa flamme)
        p.line(tr.x - ux * 4, tr.y - uy * 4, tr.x, tr.y, COQUE[5])
        p.px(tr.x, tr.y, VIOLET[4])
        p.line(tr.x - ux * 7, tr.y - uy * 7, tr.x - ux * 4, tr.y - uy * 4, FEU[5])
        p.glow(tr.x - ux * 6, tr.y - uy * 6, 6, FEU[4], 0.6)
        continue
      }
      if (tr.arme === 'rafale') {
        // (une balle de mitrailleuse : un tiret court)
        p.line(tr.x - ux * 2, tr.y - uy * 2, tr.x, tr.y, VIOLET[3])
        p.px(tr.x, tr.y, N.WHITE)
        p.glow(tr.x, tr.y, 3, VIOLET[3], 0.4)
        continue
      }
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
      } else if (o.arme === 'napalm') {
        // UNE BOULE DE NAPALM EN CLOCHE : son ombre au sol, là où elle est ; elle, plus haut — d'autant plus qu'elle est
        // au milieu de sa course —, une goutte de gel en feu, son cœur, sa lueur
        const u = 1 - o.vie / Math.max(0.01, o.vie0 ?? 1)
        const hauteur = Math.sin(Math.PI * Math.max(0, Math.min(1, u))) * 12
        p.circle(o.x, o.y, 1.8, N.hex('#0a0608'), 0.45)
        p.circle(o.x, o.y - hauteur, 2.6, FEU[2])
        p.circle(o.x - 0.5, o.y - hauteur - 0.5, 1.7, FEU[5])
        p.px(Math.round(o.x - 1), Math.round(o.y - hauteur - 1), N.hex('#fff2a8'))
        p.glow(o.x, o.y - hauteur, 6, FEU[4], 0.6)
      } else if (o.arme === 'minimissile') {
        // UN MISSILE (Keko, 15/11 : « il ressemble trop à une balle ») : un corps de six pixels sur deux, clair d'un côté,
        // ombré de l'autre, l'ogive rouge, deux ailerons à la queue, une flamme longue et sa lueur
        const nx = -uy
        const ny = ux
        const qx = o.x - ux * 6
        const qy = o.y - uy * 6
        p.line(qx, qy, o.x - ux, o.y - uy, COQUE[5])
        p.line(qx + nx, qy + ny, o.x - ux + nx, o.y - uy + ny, COQUE[3])
        p.line(o.x - ux * 1.5, o.y - uy * 1.5, o.x + nx * 0.5, o.y + ny * 0.5, N.hex('#ff5a5a'))
        p.line(qx - nx * 1.6, qy - ny * 1.6, qx + nx * 2.6, qy + ny * 2.6, COQUE[4])
        const fl = 4 + Math.sin(t * 60 + o.id) * 1.2
        p.line(qx - ux, qy - uy, qx - ux * (1 + fl), qy - uy * (1 + fl), FEU[4])
        p.line(qx - ux, qy - uy, qx - ux * 2.5, qy - uy * 2.5, N.hex('#fff2a8'))
        p.glow(qx - ux * 2.5, qy - uy * 2.5, 6, FEU[4], 0.6)
      } else if (o.arme === 'eclats') {
        // (UN GROS ÉCLAT DE GLACE — Keko, 16/11 : « beaucoup plus gros » : un cristal en losange de onze pixels sur cinq,
        // une face claire et une face à l'ombre le long de son arête, un liseré sombre, la pointe blanche, une lueur
        // froide et une traîne de givre)
        const nx = -uy
        const ny = ux
        const pt = (a: number, b: number): number[] => [o.x + ux * a + nx * b, o.y + uy * a + ny * b]
        for (let j = 1; j <= 3; j++) p.dot(o.x - ux * (9 + j * 2), o.y - uy * (9 + j * 2), GLACE[5], 0.5 - j * 0.13)
        p.glow(o.x - ux * 3, o.y - uy * 3, 9, GLACE[4], 0.45)
        p.poly([pt(1, 0), pt(-3, 3), pt(-10, 0), pt(-3, -3)], GLACE[1])
        p.poly([pt(0, 0), pt(-3, 2), pt(-9, 0)], GLACE[4])
        p.poly([pt(0, 0), pt(-9, 0), pt(-3, -2)], GLACE[6])
        p.line(o.x - ux * 8, o.y - uy * 8, o.x, o.y, GLACE[5])
        p.line(o.x - ux * 2, o.y - uy * 2, o.x, o.y, N.WHITE)
        p.px(o.x + ux, o.y + uy, N.WHITE)
      } else if (o.arme === 'fragment') {
        // (UN PETIT FRAGMENT, celui de l'Ice Shatter de pixelfx : un trait de deux ou trois pixels qui tourne sur
        // lui-même en filant, bleu, la pointe blanche)
        const a = t * 22 + o.id
        const ca = Math.cos(a)
        const sa = Math.sin(a)
        const s = 1.4 + (o.id % 3) * 0.5
        for (let d = -s / 2; d <= s / 2; d += 0.5) p.dot(o.x + ca * d, o.y + sa * d, d > s / 2 - 0.6 ? N.WHITE : GLACE[4 + (o.id % 3)], 1)
        p.glow(o.x, o.y, 3, GLACE[5], 0.3)
      } else if (o.arme === 'plasma' || o.arme === 'essaim' || o.arme === 'arcane') {
        // (l'orbe de plasma et les missiles de l'essaim : dessinés avec leurs éclats, voir `dessinerLePlasma`)
      } else if (o.arme === 'tourelle') {
        // (une balle de tourelle : un traceur d'or, court)
        p.line(o.x - ux * 3, o.y - uy * 3, o.x, o.y, PEPITE[2])
        p.px(o.x, o.y, N.hex('#fff2a8'))
        p.glow(o.x, o.y, 3, PEPITE[2], 0.4)
      } else if (o.arme === 'drone') {
        // (un trait de drone : court, cyan, la tête blanche)
        p.line(o.x - ux * 3, o.y - uy * 3, o.x, o.y, VERRIERE[1])
        p.px(o.x, o.y, N.WHITE)
        p.glow(o.x, o.y, 3, VERRIERE[2], 0.45)
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
    // LES DRONES DE LA SENTINELLE : là où la règle les a menés — à leur place sur l'orbite, ou autour de leur cible —, une
    // petite traînée derrière eux (le long de leur vitesse) ; un corps à la couleur du joueur, un œil cyan, une lueur
    if (m.phase === 'vol' && t - arriveA >= ARRIVE_A) {
      // (les drones à la sarcelle de la Sentinelle, leur œil à la marque du joueur — Keko, 16/11)
      const [sombre, moyen, clair] = tonsDeLaMatiere('sarcelle')
      const oeil = VORTEX_ ? peauCourante().accent[4] : N.WHITE
      for (const d of m.drones) {
        for (let k = 4; k >= 1; k--) p.circle(d.x - d.vx * k * 0.014, d.y - d.vy * k * 0.014, 1.8 * (1 - k / 5), moyen, 0.45 * (1 - k / 5))
        // (un peu plus gros qu'un point : sur le portail, on les perdait)
        p.circle(d.x, d.y, 3.3, MATIERES.encre.contour)
        p.circle(d.x, d.y, 2.6, moyen)
        p.rect(Math.round(d.x) - 2, Math.round(d.y) - 1, 2, 1, clair)
        p.rect(Math.round(d.x) - 1, Math.round(d.y) + 1, 3, 1, sombre)
        p.rect(Math.round(d.x) - 1, Math.round(d.y), 3, 1, oeil)
        p.glow(d.x, d.y, 6, VERRIERE[2], d.cible === null ? 0.35 : 0.55)
      }
    }
    // LE RAYON THERMIQUE, À LA MANIÈRE DE « LASER GRID » DU DÉPÔT (Keko, 15/11 : « tu peux utiliser laser grid pour
    // t'inspirer ») : un CŒUR BLANC où des impulsions défilent vers la pointe, un CORPS ROUGE de part et d'autre (clair
    // d'un côté, sombre de l'autre), une LUEUR INÉGALE qui ondule le long de lui ; derrière sa pointe, LA BRÛLURE qu'il
    // laisse en tournant, qui refroidit du blanc au rouge sombre ; à sa pointe, un point chauffé à blanc qui crache des
    // étincelles. Il s'allonge en naissant ; juste avant de partir, l'émetteur se charge.
    {
      const C = RAMPE_DU_LASER
      // … PUIS UN TRAIT AU SOL (Keko, 16/11 : « un truc qui part du toit du vaisseau, qui va vers le bas, qui touche
      // l'endroit où le rayon touche le sol ») : le laser de la tourelle descend jusqu'au POINT D'IMPACT ; derrière lui, le
      // trait déjà tracé refroidit du blanc au rouge sombre ; au point, le sol chauffé à blanc, un anneau qui bat, une lueur
      const im = impactDuRayon(CONF, m)
      if (im !== null && m.phase === 'vol') {
        const l = im.ligne
        const L = Math.hypot(l.x1 - l.x0, l.y1 - l.y0) || 1
        const ux = (l.x1 - l.x0) / L
        const uy = (l.y1 - l.y0) / L
        const fait = L * im.part
        // (la queue seulement : le trait suit sa cible, il glisse — les flaques, elles, restent où elles sont tombées)
        for (let d = Math.max(0, fait - 16); d <= fait; d += 0.7) {
          const k = (fait - d) / 16
          p.dot(l.x0 + ux * d, l.y0 + uy * d, k < 0.1 ? N.WHITE : k < 0.35 ? C[6] : k < 0.75 ? C[4] : C[3], Math.max(0.3, 1 - k * 0.5))
        }
        dessinerUnLaser(p, v, { sorte: 'roche', cible: 0, x: im.x, y: im.y, part: 1 }, C, 3, placeDOutil(monteeA(hangar, 'coque').cran, 0))
        p.glow(im.x, im.y, 13, C[4], 0.6)
        p.ring(im.x, im.y, 3.5 + 1.5 * Math.sin(t * 30), 1, C[6], 0.8)
        p.circle(im.x, im.y, 2, N.WHITE)
        p.glow(im.x, im.y, 5, N.WHITE, 0.5)
      }
      const r = angleDuBalayage(CONF, m)
      if (r !== null && m.phase === 'vol') {
        const L = r.longueur * Math.min(1, r.part / 0.08)
        // la brûlure de la pointe, qui refroidit derrière elle (derrière : à l'opposé de son sens)
        for (let k = 13; k >= 0; k--) {
          const a = r.angle - r.sens * k * 0.055
          if ((a - r.depart) * r.sens < 0) continue
          const c = k < 2 ? N.WHITE : k < 5 ? C[6] : k < 9 ? C[4] : C[3]
          p.dot(v.x + Math.cos(a) * L, v.y + Math.sin(a) * L, c, 1 - k / 14)
          p.dot(v.x + Math.cos(a) * (L - 1), v.y + Math.sin(a) * (L - 1), C[3], 0.6 - k / 24)
        }
        const ex = v.x + Math.cos(r.angle) * L
        const ey = v.y + Math.sin(r.angle) * L
        const nx = -Math.sin(r.angle)
        const ny = Math.cos(r.angle)
        p.line(v.x + nx, v.y + ny, ex + nx, ey + ny, C[4])
        p.line(v.x - nx, v.y - ny, ex - nx, ey - ny, C[3])
        ;(p.line as unknown as (x0: number, y0: number, x1: number, y1: number, c: (u: number) => number) => void)(v.x, v.y, ex, ey, (u: number) => ((((u * 5 - t * 3) % 1) + 1) % 1 < 0.12 ? C[6] : N.WHITE))
        for (let d = 0; d <= L; d += 5) {
          const h = 0.5 + 0.5 * Math.sin(d * 0.37 + t * 9) * Math.sin(d * 0.13 - t * 5)
          p.glow(v.x + Math.cos(r.angle) * d, v.y + Math.sin(r.angle) * d, 6 + 4 * h, C[3], 0.14 + 0.3 * h * h)
        }
        p.px(Math.round(ex), Math.round(ey), N.WHITE)
        p.glow(ex, ey, 10, C[4], 0.55)
        p.glow(ex, ey, 4, N.WHITE, 0.4)
        p.glow(v.x, v.y, 8, C[4], 0.55)
      } else if (m.phase === 'vol') {
        const i = CONF.armes.findIndex((a) => a.balayage !== undefined)
        const reste = i < 0 ? 99 : (m.armesA[i] ?? 0) - m.t
        if (reste > 0 && reste < 0.5) p.glow(v.x, v.y, 4 + 10 * (1 - reste / 0.5), C[4], 0.6 * (1 - reste / 0.5))
      }
    }
    // les flammes du lance-flammes, en bouffées de la Fireball : la fumée d'abord, puis le feu, le plus vieux dessous
    const H_FEU = hotFirst(RAMPE_DU_FEU)
    flammesDuNez = flammesDuNez.filter((f) => t - f.t0 < f.fl + (f.sm ? f.sl : 0))
    const auFeu: [number, number, number, (typeof flammesDuNez)[number]][] = []
    for (const f of flammesDuNez) {
      const age = t - f.t0
      const ta = Math.min(age, f.fl)
      const k = 1 - 0.3 * (ta / f.fl)
      const x = f.x + f.vx * ta * k
      const y = f.y + f.vy * ta * k
      if (age < f.fl) {
        auFeu.push([age, x, y, f])
        continue
      }
      // éteinte : sa fumée dérive encore un peu, lentement, et se dissipe
      const sa = age - f.fl
      smokePuff(p, x + f.vx * 0.12 * sa, y + f.vy * 0.12 * sa - 8 * sa, 1 - sa / f.sl, f.s * 0.9, FUMEE_DU_FEU)
    }
    auFeu.sort((a, b) => b[0] - a[0])
    for (const [age, x, y, f] of auFeu) {
      const u = age / f.fl
      const l = Math.hypot(f.vx, f.vy) || 1
      // (sa pointe traîne en arrière de sa course)
      firePuff(p, x, y, 1 - u, f.s * (1 + 1.3 * u), f.f, H_FEU, 0.07, -f.vx / l, -f.vy / l)
    }
    // les petites flammes des insectes qui brûlent : des bouffées qui montent en rapetissant
    flammesDesBrules = flammesDesBrules.filter((f) => t - f.t0 < f.vie)
    for (const f of flammesDesBrules) {
      const age = t - f.t0
      const u = age / f.vie
      firePuff(p, f.x + f.vx * age, f.y + f.vy * age, 1 - u, 1.4, 0.3, H_FEU, 0.1, 0, -1)
    }
    if (m.crache && m.phase === 'vol') {
      const bo = CONF.armes[0]?.bouche ?? { x: 0, y: 0 }
      p.glow(v.x + Math.cos(v.cap) * bo.x, v.y + Math.sin(v.cap) * bo.x, 10, N.hex('#ffb04a'), 0.5)
    }
    p.place(0, 0)
  }

  /**
   * LE FAISCEAU DU PRISME (Keko, 16/11 : « le rayon est bleu, énergie pure ») : du cristal qui tourne à sa proue jusqu'à sa
   * cible — une gaine bleue qui s'élargit en chauffant, un corps cyan, une âme blanche où des impulsions filent vers la
   * cible, une lueur ondulante le long ; au départ, le cristal s'illumine ; à l'impact, un éclat blanc et un anneau qui
   * bat.
   */
  const FAISCEAU = ['#0a2a6a', '#1a5ad0', '#40a0ff', '#80d8ff', '#c8f4ff', '#ffffff'].map((c) => N.hex(c))
  function dessinerLeFaisceau(p: Peintre, a: { bouche?: { x: number; y: number } }, tx: number, ty: number, chauffe: number): void {
    const bo = a.bouche ?? { x: 0, y: 0 }
    const x0 = v.x + Math.cos(v.cap) * bo.x - Math.sin(v.cap) * bo.y
    const y0 = v.y + Math.sin(v.cap) * bo.x + Math.cos(v.cap) * bo.y
    const L = Math.hypot(tx - x0, ty - y0) || 1
    const ux = (tx - x0) / L
    const uy = (ty - y0) / L
    const px = -uy
    const py = ux
    const large = 1 + Math.round(chauffe * 1.5)
    p.glowLine(x0, y0, tx, ty, 5 + 3 * chauffe, FAISCEAU[2], 0.35 + 0.25 * chauffe)
    for (let o = -large; o <= large; o++) {
      const bord = Math.abs(o) / (large + 0.5)
      p.line(x0 + px * o, y0 + py * o, tx + px * o, ty + py * o, bord > 0.6 ? FAISCEAU[2] : FAISCEAU[3], bord > 0.6 ? 0.7 : 0.9)
    }
    ;(p.line as unknown as (x0: number, y0: number, x1: number, y1: number, c: (u: number) => number) => void)(x0, y0, tx, ty, (u: number) => ((((u * 4 - t * 4) % 1) + 1) % 1 < 0.15 ? FAISCEAU[4] : N.WHITE))
    for (let d = 0; d <= L; d += 6) {
      const h = 0.5 + 0.5 * Math.sin(d * 0.4 - t * 12)
      p.glow(x0 + ux * d, y0 + uy * d, 3 + 3 * h, FAISCEAU[3], 0.12 + 0.2 * h)
    }
    p.glow(x0, y0, 7 + 3 * chauffe, FAISCEAU[4], 0.7)
    p.circle(tx, ty, 1.5 + chauffe * 1.5, N.WHITE)
    p.ring(tx, ty, 3 + 2 * chauffe + Math.sin(t * 20), 1, FAISCEAU[3], 0.7)
    p.glow(tx, ty, 8 + 8 * chauffe, FAISCEAU[3], 0.6)
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
    // LE RAYON THERMIQUE : LE LASER DE LA FOREUSE (Keko, 15/11 : « un rayon comme celui qui sert à forer »), depuis sa
    // tourelle sur le toit jusqu'à sa cible, au rouge de « Laser grid » ; sa pointe grossit quand il chauffe
    if (m.phase === 'vol' && m.canal !== null) {
      if (CONF.armes[m.canal.arme]?.id === 'faisceau') dessinerLeFaisceau(p, CONF.armes[m.canal.arme], m.canal.x, m.canal.y, m.canal.chauffe)
      else dessinerUnLaser(p, v, { sorte: 'roche', cible: 0, x: m.canal.x, y: m.canal.y, part: m.canal.chauffe }, RAMPE_DU_LASER, 3, placeDOutil(monteeA(hangar, 'coque').cran, 0))
    }
    p.place(0, 0)
  }

  /** Les stations d'extraction en vue (leur dessin est dans `station.ts`), leur parvis, et les pépites déposées qui y volent. */
  /**
   * LE TEXTE DE L'EXTRACTION — le chiffre du compte, « EXTRACTION » dans ses rayons, le mot « Extraction » et sa flèche —,
   * au-dessus du parvis d'une station dessinée en (sx, sy), de portée `portee` À L'ÉCRAN. À part : il est de l'interface,
   * il ne rapetisse pas avec le champ de vision.
   */
  function dessinerLeTexteDeLExtraction(p: Peintre, sx: number, sy: number, portee: number): void {
    const TAU = Math.PI * 2
    const yMot = sy - portee - 20
    if (m.extraction > 0) {
      const monte = compteMonte && m.phase === 'vol'
      const battement = Math.floor(m.extraction + 1e-6)
      const ub = monte ? m.extraction - battement : 1
      if (m.phase === 'extrait') {
        const ue = t - perduA
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
        return
      }
      // le chiffre : énorme et blanc une image, puis le ressort ; il tremble 0,22 s
      // (À L'ÉCHELLE 2, plus 3 — Keko, 12/11 : « une grosse différence entre le mot extraction et les chiffres du
      // countdown, ils sont trop gros » ; le mot qu'il remplace est à l'échelle 1)
      const reste = CONF.extraction.duree - m.extraction
      const tremble = monte && ub < 0.22 ? 3 * (1 - ub / 0.22) : 0
      p.glow(sx, yMot, 26, PEPITE[2], 0.2 + (monte && ub < 0.12 ? 0.6 * (1 - ub / 0.12) : 0))
      motFrappe(p, String(Math.ceil(reste)), sx + Math.round(Math.sin(t * 90) * tremble), yMot + Math.round(Math.cos(t * 77) * tremble), monte ? 2 + 1.1 * Math.exp(-ub * 26) * Math.cos(ub * 38) : 2, monte ? (ub < 0.035 ? 1 : ub < 0.07 ? 0.4 : 0) : 0)
      return
    }
    // « ZONE D'EXTRACTION », au-dessus du parvis, gris bleuté (Keko, 12/11 : « afin d'aider le joueur à
    // comprendre ») : tant que le compte ne court pas ; dès qu'il court, le chiffre prend sa place
    // (Keko, ensuite : « juste le mot extraction avec une flèche qui pointe vers en dessous », sans barre)
    if (m.phase === 'vol' && m.sorti) { // (pas avant d'avoir quitté le parvis une première fois — Keko : on y naît, le compte n'y court pas encore)
      // (EN RELIEF — Keko, 12/11 : « le mot extraction manque de texture » : la lettre grasse des titres de fiche, un
      // acier bleuté éclairé d'en haut, ombré dessous, cerné de sombre, qu'un éclat traverse de temps en temps ; la
      // flèche a les trois mêmes tons)
      const mot = 'Extraction'
      const wm = largeurDe(mot, GRAS)
      const ym = sy - portee - 18
      const c = (t % 4) / 4
      motEnRelief(p, mot, sx, ym, false, GRAS, c < 0.16 ? -8 + (c / 0.16) * (wm + 20) : null)
      // la flèche, sous le mot, qui descend et remonte d'un pixel
      const yf = ym + 11 + (Math.floor(t * 3) % 2)
      for (let k = 0; k < 6; k++) p.rect(Math.round(sx) - 5 + k, yf - 1 + k, 11 - 2 * k, 1, N.hex('#07050d'))
      for (let k = 0; k < 4; k++) p.rect(Math.round(sx) - 3 + k, yf + k, 7 - 2 * k, 1, k === 0 ? COQUE[5] : k === 1 ? COQUE[4] : N.hex('#57698c'))
    }
  }
  /** (`passe` : « tout », comme avant ; « monde », sans le texte de l'extraction ; « texte », lui seul, à l'écran de l'interface) */
  function dessinerLesStations(p: Peintre, passe: 'tout' | 'monde' | 'texte' = 'tout'): void {
    const proche = stationLaPlusProche(CONF, v.x, v.y)
    const i0 = Math.round(camera.x / CONF.station.case)
    const j0 = Math.round(camera.y / CONF.station.case)
    for (let j = j0 - 1; j <= j0 + 1; j++)
      for (let i = i0 - 1; i <= i0 + 1; i++) {
        if (CONF.station.seule && (i !== 0 || j !== 0)) continue // (une seule station pour l'instant : la base)
        const st = stationDeLaCase(CONF, i, j)
        // (le texte seul se pose à l'écran de l'interface : le monde y est réduit du champ)
        const reduit = passe === 'texte' ? champApplique : 1
        const sx = (st.x - camera.x) / reduit + W / 2
        const sy = (st.y - camera.y) / reduit + centreY()
        // la station du départ est LA BASE, une vraie station spatiale (`dessinerBase`) ; les autres, des extracteurs
        const base = i === 0 && j === 0
        const marge = base ? ENVERGURE_BASE : 40
        if (sx < -marge || sy < -marge || sx > W + marge || sy > H + marge) continue
        if (passe === 'texte') {
          if (st.x === proche.x && st.y === proche.y) dessinerLeTexteDeLExtraction(p, sx, sy, CONF.station.portee / reduit)
          continue
        }
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
          }
        } else if (laProche) battementVu = -1
        // (le texte de l'extraction : ici quand tout se peint d'un tenant ; sinon l'interface le peindra, à sa taille)
        if (laProche && passe === 'tout') dessinerLeTexteDeLExtraction(p, sx, sy, CONF.station.portee)
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
  // (quand le jeu couvre la page — sur PC —, la vue est TOUT le tampon : ni bandeau ni marge)
  const vueH = (): number => (couvreApplique ? H : Math.round((paysage ? 180 : VUE_PORTRAIT) * champDeLaVue))
  const bandeCote = (): number => (paysage && !couvreApplique ? Math.max(0, Math.floor((W - Math.round(320 * champDeLaVue)) / 2)) : 0)
  /** L'interface du vol est dans les bandeaux de côté (couché, et s'ils sont assez larges) : la vue est alors libre. */
  /**
   * LA LARGEUR DE LA COLONNE D'INTERFACE, de chaque côté : le bandeau noir du téléphone couché — ou, SUR PC, où le jeu
   * couvre la page, une colonne de même largeur posée SUR le jeu (Keko, 15/11 : « il faudrait que l'interface sur PC
   * suive la même disposition que sur téléphone en paysage : les barres sur le côté »).
   */
  const largeurDeBande = (): number => (couvreApplique && paysage ? 36 : bandeCote())
  const interfaceEnBande = (): boolean => paysage && largeurDeBande() >= 30
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
  /** (debout, dans le jeu du vortex, la barre d'expérience prend la première rangée de l'écran : le reste de l'interface descend d'autant) */
  const RANG_DE_L_EXPERIENCE = 11
  const hautDuHud = (): number => Math.max(5, bandeHaut() - (BAS_DU_HUD - 5) - 4) + (VORTEX && !paysage ? RANG_DE_L_EXPERIENCE : 0)
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
    // (SUR PC, EN DEÇÀ DES COLONNES D'INTERFACE posées sur le jeu — 15/11 : grossie, la flèche mordait la barre de vie)
    const cote = couvreApplique && paysage ? W / 2 - largeurDeBande() - marge : interfaceEnBande() && bandeCote() >= 44 ? W / 2 - 7 : W / 2 - bandeCote() - marge
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
    // (PLUS GROSSE SUR PC — Keko, 15/11 : une fois et demie ; le fer est tracé pixel par pixel, ses pixels restent entiers)
    const e = couvreApplique ? 1.5 : 1
    const R = Math.ceil(8 * e)
    // (… et rentrée d'autant vers l'écran, pour ne pas mordre le bord)
    const cx = Math.round(x - Math.cos(a) * (e - 1) * 6)
    const cy = Math.round(y - Math.sin(a) * (e - 1) * 6)
    const ca = Math.cos(a) / e
    const sa = Math.sin(a) / e
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
    for (let j = -R; j <= R; j++)
      for (let i = -R; i <= R; i++) {
        const moitie = fer(i, j)
        if (moitie !== 0) p.px(cx + i, cy + j, moitie === eclairee ? clair : corps)
        else if (fer(i - 1, j) + fer(i + 1, j) + fer(i, j - 1) + fer(i, j + 1) !== 0) p.px(cx + i, cy + j, encre)
      }
    p.glow(cx, cy, 7 * e, corps, lueur)
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
    const ou = auBord(dx / champApplique, dy / champApplique) // (à l'écran : le monde y est réduit du champ)
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
    const ou = auBord(dx / champApplique, dy / champApplique) // (à l'écran : le monde y est réduit du champ)
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
    // (PAS DE PUPITRE dans le jeu du vortex : ses barres sont posées à même le ciel)
    if (!VORTEX) {
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
    // (LE JEU DU VORTEX N'A PAS DE SOUTE — Keko, 14/11 : « enlève la soute de l'interface, on n'en aura pas besoin »)
    const places = new Map<Minerai, { x: number; w: number; y: number }>()
    if (!VORTEX) {
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
    if (t - soutePleineDiteA < 1.3) ecrire(p, 'Soute pleine', enBande ? largeurDeBande() + 4 : suivante + 2, enBande ? yHud + 2 : yPastilles + 3, ROUGE[5], { police: GRAS, contour: NUIT_OMBRE })
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
      const x0 = Math.round(largeurDeBande() / 2) - 11
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
      if (actif) zone(0, yHud, largeurDeBande(), hp + 2, ouvrirLaSoute, 'ouvre')
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
    // LE JEU DU VORTEX A DEUX BARRES (Keko, 14/11 : « enlève l'icône de bouclier et mets un bouclier bleu de base ; à la
    // place d'être au bout de la barre de vie, le bouclier bleu devient une deuxième barre collée à la barre jaune du
    // blindage, mais plus fine ») : la barre d'or ne porte que le blindage ; le bouclier a la sienne, fine, contre elle.
    const DEUX_BARRES = VORTEX
    const partDuBouclier = (): number => (CONF.bouclier.points > 0 ? Math.max(0, Math.min(1, m.bouclier / CONF.bouclier.points)) : 0)
    const teinteDeLaBarreFine = (plein: boolean, k: 0 | 1): number => {
      const db = t - bouclierA
      if (!plein) return CREUX_DES_BARRES[1]
      if (db >= 0 && db < 0.12) return N.WHITE
      return k === 0 ? VERRIERE[2] : VERRIERE[1]
    }
    const dessinerLEcusson = (x: number, y: number, blanc: boolean, pair = false): void => {
      if (DEUX_BARRES) return
      // UN BOUCLIER, finalement (Keko, 14/11 : « à la place de l'icône du vaisseau au-dessus de la barre de vie, tu peux
      // mettre finalement un symbole de bouclier » — la miniature du vaisseau piloté l'avait remplacé le 13/11) : un écu
      // d'acier, cerné d'encre, la moitié gauche prise par la lumière, un reflet en haut ; blanc un instant sous un coup
      const cx = x + 3
      // (PLUS PETIT — Keko, 14/11 : « il est trop gros » : neuf sur dix, onze sur douze avant)
      const y0 = y - 1
      // (ses rangées, de haut en bas : la demi-largeur de chacune)
      // (`pair` : LARGE D'UN NOMBRE PAIR DE PIXELS, huit — couché, il coiffe une barre de huit : large de neuf, il ne
      // pouvait être qu'à un demi-pixel de son axe ; Keko, 14/11 : « pas tout à fait au milieu de la barre de PV »)
      const DEMI = pair ? [3, 4, 4, 4, 4, 3, 3, 2, 1] : [3, 4, 4, 4, 4, 3, 3, 2, 1, 0]
      const droite = (d: number): number => (pair ? d : d + 1)
      const CLAIR = blanc ? N.WHITE : COQUE[6]
      const MOYEN = blanc ? N.WHITE : COQUE[4]
      DEMI.forEach((d, i) => p.rect(cx - d - 1, y0 + i, d + droite(d) + 2, 1, encre))
      p.rect(cx - 3, y0 - 1, 3 + droite(3), 1, encre)
      p.rect(cx - (pair ? 1 : 0), y0 + DEMI.length, pair ? 2 : 1, 1, encre)
      DEMI.forEach((d, i) => {
        if (d < 1) return p.rect(cx, y0 + i, 1, 1, MOYEN)
        p.rect(cx - d, y0 + i, d, 1, CLAIR)
        p.rect(cx, y0 + i, droite(d), 1, MOYEN)
      })
      if (!blanc) {
        p.rect(cx - 2, y0 + 1, 2, 1, N.WHITE)
        p.rect(cx - 3, y0 + 2, 1, 2, N.WHITE)
        p.rect(cx, y0 + 1, 1, 7, COQUE[3])
      }
    }
    if (enBande) {
      // LE BLINDAGE DEBOUT — la même mise en scène que la barre couchée (le « health bar hit » du dépôt), tournée : la
      // barre d'or à cases se vide PAR LE HAUT ; un coup, et la plaque sursaute, son cadre rougit, le morceau perdu
      // blanchit, tient en fantôme pâle puis se vide sous une arête blanche qui crache des étincelles ; l'écusson, en
      // tête, bondit. LE BOUCLIER : une colonne de cellules bleues à côté, qui crépitent et s'éteignent une à une.
      const nb = DEUX_BARRES ? 0 : CONF.bouclier.points
      const TOT = CONF.coque + nb
      const du = t - toucheA
      const db = t - bouclierA
      const dernier = m.phase === 'vol' && m.coque <= 1
      const TIENT = 0.15 // (0,42 avant — Keko, 14/11 : la trace du coup restait trop longtemps avant de se vider)
      const VIDE = 0.5
      const fantomeA = (valeur: number): number => {
        const dc = t - coqueCoupA
        if (dc >= VIDE) return valeur
        if (dc < TIENT) return Math.max(valeur, coqueFantome)
        const u = (dc - TIENT) / (VIDE - TIENT)
        const doux = u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2
        return valeur + Math.max(0, coqueFantome - valeur) * (1 - doux)
      }
      // (DANS LE JEU DU VORTEX, ELLE DESCEND JUSQU'AU MILIEU DE L'ÉCRAN, et elle est plus fine — Keko, 14/11 : six de large au lieu de huit)
      // (SUR PC, ELLE COMMENCE À LA HAUTEUR DU POUR CENT DU PORTAIL, d'en face — Keko, 15/11 : « elle commence un peu haut » ;
      // MESURÉ, sept pixels plus bas ; elle finit toujours au milieu de l'écran, avec la barre d'expérience)
      const BAISSE = DEUX_BARRES && couvreApplique ? 7 : 0
      const BH = DEUX_BARRES ? Math.max(30, Math.round(H / 2) - yHud - BAISSE) : H_BARRE
      const lw = DEUX_BARRES ? 6 : 8
      const sursaut = du >= 0 && du < 0.28 ? 3 * (1 - du / 0.28) : db >= 0 && db < 0.2 ? 1.5 * (1 - db / 0.2) : 0
      const pw = 22
      const px0 = W - Math.round(largeurDeBande() / 2) - Math.round(pw / 2) + Math.round(Math.sin(t * 90) * sursaut)
      const oy = yHud + Math.round(Math.cos(t * 77) * sursaut * 0.7) + (du >= 0 && du < 0.6 ? Math.round(3 * Math.exp(-du * 10) * Math.cos(du * 24)) : 0)
      // (dans le jeu du vortex, LE BOUCLIER EST À GAUCHE du blindage — Keko, 14/11 : la barre d'or se décale à droite)
      const bx = px0 + 7 + Math.floor((8 - lw) / 2) + (DEUX_BARRES ? 2 : 0)
      // (dans le jeu du vortex, sans l'écu en tête, la barre monte à sa place — Keko, 14/11)
      // (… PUIS JUSQU'EN HAUT : son sommet est celui de la barre d'expérience — Keko, 14/11)
      const by = oy + (DEUX_BARRES ? BAISSE : 17)
      const or = dernier ? [ROUGE[5], ROUGE[4], ROUGE[3]] : vieVerte() ? VERT_DE_LA_VIE : [PEPITE[3], PEPITE[2], PEPITE[1]]
      const yDe = (part: number): number => by + BH * (1 - part)
      if (m.coque < coqueConnue - 0.04) { // (la corruption qui ronge d'un rien à chaque image n'est pas un coup)
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
      dessinerLEcusson(ex + 1, oy + 4 + bond, blanc, true)
      // la barre : le creux, le plein (clair à gauche, sombre à droite), le fantôme, les séparations des cases
      const val = Math.max(0, Math.min(1, m.coque / TOT))
      const corrompu = Math.max(0, Math.min(val, m.corruption / TOT))
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
          if (u < val - corrompu) c = x < 1 ? or[0] : x < lw - 2 ? or[1] : or[2]
          else if (u < val) c = tonDeLaCorruption(y, x < 1 ? 0 : x < lw - 2 ? 1 : 2)
          else if (u < fant) c = dc < 0.07 ? N.WHITE : x < 1 ? N.hex('#ff6a5a') : x < lw - 2 ? N.hex('#e02a2a') : N.hex('#9a1a1a') // (LA ZONE PERDUE EN ROUGE, plus en jaune très clair — Keko, 14/11)
          else c = (DEUX_BARRES ? null : teinteDuBouclier((u - fant) * TOT, x < 1 ? 0 : x < lw - 2 ? 1 : 2)) ?? (x < 1 ? CREUX_DES_BARRES[0] : CREUX_DES_BARRES[1])
          p.px(bx + x, by + y, traits.has(by + y) ? assombrie(c) : c)
        }
      }
      if (dc < VIDE && val > 0) p.rect(bx, Math.min(by + BH - 1, Math.round(yDe(val))), lw, 1, N.WHITE)
      if (DEUX_BARRES && CONF.bouclier.points > 0) {
        // LE BOUCLIER : une barre fine, bleue, contre le flanc GAUCHE du blindage, qui se vide par le haut
        const fin = 3
        const xf = bx - fin - 1
        p.rect(xf - 1, by - 1, fin + 2, BH + 2, encre)
        const plein = Math.round(BH * partDuBouclier())
        for (let y = 0; y < BH; y++) p.rect(xf, by + y, fin, 1, teinteDeLaBarreFine(BH - y <= plein, 1))
        if (plein > 0) p.rect(xf, by + BH - plein, 1, plein, teinteDeLaBarreFine(true, 0))
      } else if (DEUX_BARRES && m.plaques.length > 0) dessinerLesPlaques(p, true, bx - 4, by, BH)
      // (LE ZOOM, sous la barre : « + » puis « − », l'un sur l'autre dans le bandeau)
      if (ZOOM_A_LA_MAIN) dessinerLeZoom(p, W - Math.round(largeurDeBande() / 2) - 7, by + BH + 6, true)
      // (LA RÉGLETTE FIXE DU ZOOM, couchée : sous la barre de vie, sur son axe — sans la secousse du coup)
      else if (VORTEX && !ZOOM_PAR_PINCE) {
        // (L'AXE EST CELUI DE TOUTE LA BARRE, BOUCLIER COMPRIS — Keko, 17/11 : « pas totalement alignée verticalement avec la
        // barre de vie au-dessus » : MESURÉ, la réglette était sur l'axe de la seule barre d'or, deux pixels à droite du
        // milieu de l'ensemble — le bouclier bleu, de bx − 5 à bx − 1 cerne compris, et l'or de bx − 1 à bx + 6 ; douze
        // pixels, l'axe entre bx et bx + 1)
        const axe = bx + (CONF.bouclier.points > 0 || CONF.plaques > 0 ? 1 : lw / 2) - Math.round(Math.sin(t * 90) * sursaut)
        // (… UN PEU PLUS COURTE, LE BOUTON DU MENU TOUT EN BAS SOUS ELLE — Keko, 17/11 : « réduire un petit peu la jauge de zoom
        // pour mettre en dessous, tout en bas à droite, un petit bouton menu » ; 56 de course avant)
        const yMenu = H - 6 - PLAQUE_DE_REGLETTE
        const a0 = yHud + BAISSE + BH + 6 + PLAQUE_DE_REGLETTE + ECART_DE_REGLETTE
        const a1 = a0 + Math.min(40, yMenu - 4 - PLAQUE_DE_REGLETTE - ECART_DE_REGLETTE - a0)
        regletteFixe = a1 - a0 >= 16 ? { verticale: true, axe, a0, a1 } : null
        if (regletteFixe !== null) peindreLaReglette(p, true, axe, a0, a1)
        dessinerLeBoutonMenu(p, axe - 7, yMenu)
      }
      if (dc > TIENT && dc < VIDE) {
        const gy = yDe(fant)
        p.rect(bx - 1, Math.round(gy) - 1, lw + 2, 2, N.WHITE)
        p.glow(bx + lw / 2, gy, 10, or[1], 0.6)
        if (R.next() < 0.5) eclats.push({ x: bx + 1 + R.next() * (lw - 2), y: gy, vx: R.range(-40, 40), vy: -R.range(20, 70), t0: t, vie: 0.1 + 0.12 * R.next(), c: R.next() < 0.5 ? N.WHITE : or[0] })
      }
      p.glow(bx + lw / 2, yDe(val * 0.5), BH * 0.4, or[1], dernier ? 0.12 + 0.1 * Math.sin(t * 5) : 0.1)
      if (dc < 0.3) p.glow(bx + lw / 2, yDe((val + fant) / 2), 26, dc < 0.08 ? N.WHITE : or[1], 0.6 * (1 - dc / 0.3))
    } else {
    const nb = DEUX_BARRES ? 0 : CONF.bouclier.points
    const TOT = CONF.coque + nb
    const du = t - toucheA
    const db = t - bouclierA
    const dernier = m.phase === 'vol' && m.coque <= 1
    const TIENT = 0.15 // (0,42 avant — Keko, 14/11 : la trace du coup restait trop longtemps avant de se vider)
    const VIDE = 0.5
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
    const by = oy + (DEUX_BARRES ? 1 : 5) // (dans le jeu du vortex, la barre remonte sous la rangée du haut)
    // (PLUS FINE DANS LE JEU DU VORTEX — Keko, 15/11 : six, la largeur qu'elle a debout, au lieu de huit)
    const bh = DEUX_BARRES ? 6 : 8
    const or = dernier ? [ROUGE[5], ROUGE[4], ROUGE[3]] : vieVerte() ? VERT_DE_LA_VIE : [PEPITE[3], PEPITE[2], PEPITE[1]]
    // un coup dans le blindage : le fantôme part d'où on en était, des éclats tombent du morceau perdu
    if (m.coque < coqueConnue - 0.04) { // (la corruption qui ronge d'un rien à chaque image n'est pas un coup)
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
    // (un pixel plus bas : MESURÉ, le bouclier rétréci était un demi-pixel au-dessus de l'axe de la barre — Keko, 14/11 : « centrer le bouclier par rapport à la barre de vie »)
    dessinerLEcusson(ox + 5, oy + 6 + bond, blanc)
    if (!DEUX_BARRES) p.glow(ox + 8, oy + 9, 9, or[1], 0.2 + (du >= 0 && du < 0.2 ? 0.4 : 0))

    // la barre de blindage : le creux, le plein (clair dessus, sombre dessous), le fantôme, les séparations des cases
    const val = Math.max(0, Math.min(1, m.coque / TOT))
    const corrompu = Math.max(0, Math.min(val, m.corruption / TOT))
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
        if (u < val - corrompu) c = v < 1 ? or[0] : v < bh - 2 ? or[1] : or[2]
        else if (u < val) c = tonDeLaCorruption(x, v < 1 ? 0 : v < bh - 2 ? 1 : 2)
        else if (u < fant) c = dc < 0.07 ? N.WHITE : v < 1 ? N.hex('#ff6a5a') : v < bh - 2 ? N.hex('#e02a2a') : N.hex('#9a1a1a') // (la zone perdue en rouge)
        else c = (DEUX_BARRES ? null : teinteDuBouclier((u - fant) * TOT, v < 1 ? 0 : v < bh - 2 ? 1 : 2)) ?? (v < 1 ? CREUX_DES_BARRES[0] : CREUX_DES_BARRES[1])
        p.px(bx + x, by + v, traits.has(x) ? assombrie(c) : c)
      }
    }
    if (dc < VIDE && val > 0) p.rect(bx + Math.max(0, Math.round(BW * val) - 1), by, 1, bh, N.WHITE)
    if (DEUX_BARRES && CONF.bouclier.points > 0) {
      // LE BOUCLIER : une barre fine, bleue, collée sous le blindage
      const fin = 3
      p.rect(bx - 1, by + bh, BW + 2, fin + 2, encre)
      const plein = Math.round(BW * partDuBouclier())
      for (let x = 0; x < BW; x++) p.rect(bx + x, by + bh + 1, 1, fin, teinteDeLaBarreFine(x < plein, 1))
      if (plein > 0) p.rect(bx, by + bh + 1, plein, 1, teinteDeLaBarreFine(true, 0))
    } else if (DEUX_BARRES && m.plaques.length > 0) dessinerLesPlaques(p, false, bx, by + bh + 1, BW)
    // (LE ZOOM, sous la barre, calé à sa droite : « − » puis « + »)
    if (ZOOM_A_LA_MAIN) dessinerLeZoom(p, bx + BW - 30, by + bh + 5, false)
    // (LA RÉGLETTE FIXE DU ZOOM, debout : couchée en bas à droite de l'écran, au milieu du bandeau du bas, « + » à droite)
    else if (VORTEX && !ZOOM_PAR_PINCE) {
      const axe = bandeBas() >= 22 ? H - Math.round(bandeBas() / 2) : H - 12
      // (… UN PEU PLUS COURTE, LE BOUTON DU MENU À SA DROITE, tout en bas à droite — Keko, 17/11)
      const xMenu = W - 6 - PLAQUE_DE_REGLETTE
      const a0 = xMenu - 6 - PLAQUE_DE_REGLETTE - ECART_DE_REGLETTE
      const a1 = a0 - 44
      regletteFixe = { verticale: false, axe, a0, a1 }
      peindreLaReglette(p, false, axe, a0, a1)
      dessinerLeBoutonMenu(p, xMenu, axe - 7)
    }
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
    // (VIOLETTES dans le jeu du vortex — Keko, 14/11 : en gris-blanc, « on les voit mal parmi les étoiles »)
    for (const pe of m.pepites) dessinerPepite(p, pe, t, m.refuses[pe.minerai], VORTEX ? XP : undefined)
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
    // (UNE BÊTE, à l'accueil aussi, lâche des bulles et pas de feu — Keko, 16/11 : « n'oublie pas l'effet de propulsion dans
    // l'écran d'accueil ») : une colonne de bulles qui s'écartent, enflent et crèvent en s'éloignant
    const coqueA = monteeA(hangar, 'coque').cran
    if (organique(coqueA)) dessinerLaPousseeSansTuyere(p, coqueA, cx, ty, E, us)
    else if (gA.omni === undefined) {
      for (let k = 0; k < 18; k++) {
        const u = boucle(t * (1.5 + us * 2) + k / 18, 1)
        p.dot(cx + Math.sin(k * 7.3) * (1.5 + u * 5), ty + 3 + u * (46 + us * 70), chaud[Math.max(1, 6 - Math.floor(u * 5))], (1 - u) * 0.9)
      }
      p.glow(cx, ty, 12 + 16 * flam, al.propulseur >= 3 ? ION[4] : FEU[5], 0.4 + 0.45 * flam + 0.08 * Math.sin(t * 9))
    }
    peindreFormes(p, formesDuVaisseau(al, flam, t), cx, sy, E, { rampes: rampesDuJoueur() })
    // (UNE SOUCOUPE, à l'accueil : ses jets du dessous la portent, plus forts quand elle s'arrache — Keko, 15/11)
    if (gA.omni !== undefined) dessinerLesJetsOmni(p, monteeA(hangar, 'coque').cran, cx, sy, -Math.PI / 2, E, flam, 0, 0, E * 0.6)
    if (!sansVerriere(monteeA(hangar, 'coque').cran)) p.glow(cx, sy - gA.verriere * E, 9, VERRIERE[2], 0.25)
    const feuxA = gA.feux
    if (feuxA !== null && Math.floor(t * 1.5) % 2 === 0)
      for (const [s, c] of [[-1, couleurDuFeu(-1)], [1, couleurDuFeu(1)]] as const) {
        p.rect(Math.round(cx + s * (feuxA.y + 0.2) * E), Math.round(sy + (0.2 - feuxA.x) * E), 1, 1, N.WHITE)
        p.glow(Math.round(cx + s * (feuxA.y + 0.2) * E), Math.round(sy + (0.2 - feuxA.x) * E), 7, c, 0.7)
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

  /** La réglette du zoom (voir `reglette`) : la ligne, ses deux bouts « + » et « − », le curseur ; elle part peu après le relâchement. */
  function dessinerLaReglette(p: Peintre): void {
    if (reglette === null) return
    if (pince !== null) reglette.vueA = t
    if (t - reglette.vueA > 0.15 || !enJeu || ecranVisible()) {
      reglette = null
      return
    }
    p.place(0, 0)
    const haut = enTampon(reglette.x, reglette.haut)
    const bas = enTampon(reglette.x, reglette.bas)
    peindreLaReglette(p, true, Math.round(haut.x), Math.round(haut.y), Math.round(bas.y))
  }
  /**
   * UNE RÉGLETTE DU ZOOM, debout ou couchée : `axe` est sa colonne (sa rangée), entre `axe − 1` et `axe` ; `a0` le bout
   * « + » de la course (la vue de près), `a1` le bout « − » ; les plaques sont au-delà des bouts.
   */
  function peindreLaReglette(p: Peintre, verticale: boolean, axe: number, a0: number, a1: number): void {
    // (un rectangle dans le repère de la réglette : `a` le long, `b` en travers de l'axe)
    const R = (a: number, b: number, la: number, lb: number, c: number): void => {
      if (la <= 0 || lb <= 0) return
      if (verticale) p.rect(axe + b, a, lb, la, c)
      else p.rect(a, axe + b, la, lb, c)
    }
    const encre = MATIERES.encre.contour
    const lo = Math.min(a0, a1)
    const hi = Math.max(a0, a1)
    const ac = Math.round(a0 + (a1 - a0) * ((champDuVortex - 1) / (CHAMP_MAX - 1)))
    // (TOUT EST SUR UN SEUL AXE, entre les colonnes axe − 1 et axe — Keko, 17/11 : « attention à ce que les boutons plus et
    // moins soient bien centrés par rapport à la barre » : la barre, les plaques, leurs signes et le curseur ont tous une
    // largeur paire ; et les plaques s'écartent des bouts de la course, le curseur à fond ne les mord plus)
    // la ligne : cernée d'encre, claire du côté « + » du curseur (la part zoomée), sombre de l'autre
    R(lo - 4, -3, hi - lo + 9, 6, encre)
    if (a0 < a1) {
      R(a0 - 4, -2, ac - a0 + 4, 4, COQUE[4])
      R(ac, -2, a1 - ac + 5, 4, COQUE[1])
    } else {
      R(ac, -2, a0 - ac + 5, 4, COQUE[4])
      R(a1 - 4, -2, ac - a1 + 4, 4, COQUE[1])
    }
    // les deux bouts (Keko, 17/11 : « agrandis les boutons plus et moins et donne-leur un style un peu plus joli ») : la
    // plaque d'acier clair des boutons, le signe gravé — l'encre, et sous elle un trait de lumière
    // (14 de côté, des traits de deux : le signe tombe au milieu de la plaque ; le « − » reste couché sur une réglette couchée)
    const B = PLAQUE_DE_REGLETTE
    const signe = N.hex('#10182a')
    const grave = MATIERES.clair.lumiere2
    for (const [along, plus] of [[lo - ECART_DE_REGLETTE - B, a0 < a1], [hi + ECART_DE_REGLETTE, a0 > a1]] as const) {
      const px = verticale ? axe - 7 : along
      const py = verticale ? along : axe - 7
      plaque(p, px, py, B, B, 'clair')
      p.rect(px + 4, py + 8, 8, 1, grave)
      p.rect(px + 3, py + 6, 8, 2, signe)
      if (plus) {
        p.rect(px + 6, py + 3, 2, 8, signe)
        p.rect(px + 8, py + 4, 1, 2, grave)
        p.rect(px + 8, py + 9, 1, 2, grave)
        p.rect(px + 7, py + 11, 2, 1, grave)
      }
    }
    // le curseur : un plot d'or, en travers de la course
    if (verticale) plaque(p, axe - 7, ac - 3, 14, 7, 'or')
    else plaque(p, ac - 3, axe - 7, 7, 14, 'or')
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
    dessinerLaReglette(p)
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
  /** Les gerbes du monde — braises, morceaux, pépites, étincelles, « pops », flashs —, sous la caméra. */
  function dessinerLesGerbes(p: Peintre): void {
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
  }
  /**
   * CE QUE LE VOL FAIT DE SES ÉVÉNEMENTS : les sons, les éclats, les flashs, les morts des insectes, les impacts… Sorti de
   * `image` pour que l'APERÇU DES ARMES le rejoue tel quel (Keko, 17/11 : « quand un ennemi est tué, il disparaît sans
   * animation de mort, et l'animation de hit n'apparaît pas non plus ») — là, `enApercu` coupe les sons, les vibrations
   * et les compteurs des missions.
   */
  function celebrer(r: ReturnType<typeof avancerLeMonde>): void {
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
          if (typeof navigator.vibrate === 'function') vibrer(30)
          break
        }
        case 'ramasse':
          flashs.push({ x: ev.x, y: ev.y, t0: t, r: 0, c: TEINTES_MINERAI[ev.minerai] })
          if (ev.par === 'joueur') {
            compter('ramassees', 1)
            // (dans le jeu du vortex, la pépite est de l'expérience : pas d'envol vers la soute, la barre s'allume)
            if (VORTEX) xpA = t
            else envols.push({ x: v.x, y: v.y, t0: t, minerai: ev.minerai, trace: [] })
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
          if (typeof navigator.vibrate === 'function') vibrer(40)
          for (let i = 0; i < 10; i++) {
            const a = R.range(0, Math.PI * 2)
            const vit = R.range(30, 110)
            etincelles.ajouter('etincelle', ev.x, ev.y, Math.cos(a) * vit, Math.sin(a) * vit, R.range(0.2, 0.5), R.next() < 0.5 ? N.WHITE : ROUGE[4], 1, 2.5)
          }
          flashs.push({ x: ev.x, y: ev.y, t0: t, r: -1 })
          break
        }
        case 'arc':
          // (un drone frappe d'un arc électrique)
          arcsElectriques.push({ x0: ev.x0, y0: ev.y0, x1: ev.x1, y1: ev.y1, de: { sorte: 'drone', k: ev.drone }, vers: { sorte: 'ennemi', id: ev.id }, t0: t, vie: 0.16, g: R.range(0, 1e4), fort: false })
          if (t - zapA > 0.06) {
            zapA = t
            jouer('zap', { dx: ev.x1 - v.x, dy: ev.y1 - v.y })
          }
          break
        case 'chaine':
          // (la chaîne d'éclairs : maillon après maillon, de quelques centièmes)
          for (let k = 0; k < ev.points.length - 1; k++) arcsElectriques.push({ x0: ev.points[k].x, y0: ev.points[k].y, x1: ev.points[k + 1].x, y1: ev.points[k + 1].y, de: k === 0 ? { sorte: 'vaisseau' } : { sorte: 'ennemi', id: ev.ids[k - 1] }, vers: { sorte: 'ennemi', id: ev.ids[k] }, t0: t + k * 0.035, vie: 0.34, g: R.range(0, 1e4), fort: true })
          jouer('chaine')
          secousse = Math.max(secousse, 0.2)
          break
        case 'balayage':
          // (le rayon part : son son, qui dure le tour — SAUF S'IL A DÉJÀ SONNÉ, annoncé en avance de la latence, comme
          // un obus ; Keko, 16/11 : « quand on enchaîne deux lasers d'affilée, ça fait deux fois le bruit de lancement »)
          if (t - (armeAnnonceeA.get(ev.arme) ?? -10) < 0.4) armeAnnonceeA.delete(ev.arme)
          else jouer('rayon')
          secousse = Math.max(secousse, 0.15)
          break
        case 'flaque': {
          // UNE BOULE S'ÉCRASE EN FLAQUE : son « splotch » et l'embrasement, une gerbe de flammes et de gouttes
          jouer('flaque', { dx: ev.x - v.x, dy: ev.y - v.y })
          for (let i = 0; i < 10; i++) {
            const a = R.range(0, Math.PI * 2)
            const vit = R.range(15, 45)
            feuDesConsumes.spawn(N.P.FIRE, ev.x, ev.y, Math.cos(a) * vit, Math.sin(a) * vit - 10, R.range(0.2, 0.4), 0, R.range(1.2, 2.2))
          }
          for (let i = 0; i < 6; i++) {
            const a = R.range(0, Math.PI * 2)
            feuDesConsumes.spawn(N.P.EMBER, ev.x, ev.y, Math.cos(a) * R.range(30, 70), Math.sin(a) * R.range(30, 70), R.range(0.3, 0.6), 0, 1)
          }
          break
        }
        case 'explosionDeZone': {
          // (L'ORBE DE PLASMA ÉCLATE : sa gerbe à elle, violette et bleue, son « zap », des étincelles — pas de feu)
          if (ev.arme === 'plasma') {
            jouer('eclatPlasma', { dx: ev.x - v.x, dy: ev.y - v.y })
            eclatsDePlasma.push({ x: ev.x, y: ev.y, t0: t, r: ev.rayon, id: Math.round(ev.x * 13 + ev.y * 7) })
            for (let i = 0; i < 14; i++) {
              const a = R.range(0, Math.PI * 2)
              const vit = R.range(40, 110)
              etincelles.ajouter('etincelle', ev.x, ev.y, Math.cos(a) * vit, Math.sin(a) * vit, R.range(0.2, 0.45), [N.WHITE, PLASMA[5], PLASMA[4], PLASMA_V[3]][Math.floor(R.next() * 4)], 1, 2)
            }
            secousse = Math.max(secousse, 0.22)
            break
          }
          // UN MINI-MISSILE EXPLOSE (Keko, 15/11) : un éclair, un anneau qui s'ouvre jusqu'à son rayon, une boule de
          // feu (les flammes, braises et fumées du dépôt), son « boum »
          jouer('explosionMini', { dx: ev.x - v.x, dy: ev.y - v.y })
          // (L'ONDE À LA TAILLE DE LA ZONE — Keko, 15/11 : le grand cercle était l'éclair des chocs ; réduite aux deux
          // tiers, « trop réduite » : elle s'ouvre jusqu'au bord de la zone de dégâts ; et PLUS DE FEU À L'IMPACT : des flammes plus nombreuses et plus grosses,
          // qui ROULENT — décalées de quelques centièmes — et fument en s'éteignant)
          ondesDeZone.push({ x: ev.x, y: ev.y, t0: t, r: ev.rayon })
          for (let i = 0; i < 16; i++) {
            const a = R.range(0, Math.PI * 2)
            const d = R.range(0, ev.rayon * 0.35)
            const vit = R.range(8, 32)
            feuDesConsumes.spawn(N.P.FIRE, ev.x + Math.cos(a) * d, ev.y + Math.sin(a) * d, Math.cos(a) * vit, Math.sin(a) * vit - 8, R.range(0.25, 0.5), 0, R.range(1.6, 3), R.range(0, 0.09), R.next() < 0.5 ? 1 : 0)
          }
          for (let i = 0; i < 6; i++) {
            const a = R.range(0, Math.PI * 2)
            feuDesConsumes.spawn(N.P.EMBER, ev.x, ev.y, Math.cos(a) * R.range(40, 90), Math.sin(a) * R.range(40, 90), R.range(0.3, 0.6), 0, 1)
          }
          for (let i = 0; i < 2; i++) feuDesConsumes.spawn(N.P.SMOKE, ev.x + R.range(-3, 3), ev.y + R.range(-3, 3), R.range(-5, 5), R.range(-8, -2), R.range(0.6, 1), FUMEE_DU_FEU, R.range(2.5, 3.5))
          secousse = Math.max(secousse, 0.2)
          break
        }
        case 'tourelleLancee':
          jouer('lance')
          break
        case 'scieLancee':
          // (UN LANCER ANNONCÉ EN AVANCE A DÉJÀ SONNÉ, comme un obus — Keko, 15/11 : relancée aussitôt rattrapée,
          // l'annonce de la latence jouait le son, puis le lancer le rejouait : « le son du tir se fait deux fois »)
          if (t - (armeAnnonceeA.get(ev.arme) ?? -10) < 0.4) armeAnnonceeA.delete(ev.arme)
          else jouer('scie')
          break
        case 'balisePosee':
          // (une balise plantée : son clic, un peu de poussière)
          // (un cristal : un tintement de verre, des éclats bleus)
          jouer(ev.arme === 'cristal' ? 'cristalPose' : 'balisePosee', { dx: ev.x - v.x, dy: ev.y - v.y })
          for (let i = 0; i < 5; i++) {
            const a = R.range(0, Math.PI * 2)
            etincelles.ajouter('etincelle', ev.x, ev.y, Math.cos(a) * R.range(10, 30), Math.sin(a) * R.range(10, 30), R.range(0.15, 0.3), ev.arme === 'cristal' ? FAISCEAU[R.next() < 0.5 ? 3 : 4] : N.hex('#8a8a96'), 1, 2)
          }
          break
        case 'baliseFinie':
          for (let i = 0; i < 4; i++) {
            const a = R.range(0, Math.PI * 2)
            etincelles.ajouter('etincelle', ev.x, ev.y, Math.cos(a) * R.range(10, 25), Math.sin(a) * R.range(10, 25), R.range(0.2, 0.3), R.next() < 0.5 ? N.WHITE : ev.arme === 'cristal' ? FAISCEAU[3] : PEPITE[2], 1, 2)
          }
          break
        case 'ligne':
          // (une ligne franchie s'éclaire : son « zing », l'éclair dessiné avec les balises)
          jouer(ev.arme === 'cristal' ? 'cristalLigne' : 'balise', { dx: (ev.x0 + ev.x1) / 2 - v.x, dy: (ev.y0 + ev.y1) / 2 - v.y })
          lignesEclairees.push({ x0: ev.x0, y0: ev.y0, x1: ev.x1, y1: ev.y1, t0: t, bleu: ev.arme === 'cristal' })
          break
        case 'scieRattrapee':
          // (le vaisseau rattrape sa scie : un clac, deux étincelles)
          jouer('rattrape')
          for (let i = 0; i < 4; i++) {
            const a = R.range(0, Math.PI * 2)
            etincelles.ajouter('etincelle', ev.x, ev.y, Math.cos(a) * R.range(15, 35), Math.sin(a) * R.range(15, 35), R.range(0.12, 0.25), R.next() < 0.5 ? N.WHITE : PEPITE[2], 1, 1.5)
          }
          break
        case 'tourellePosee':
          // (une tourelle posée : son clac, un peu de poussière)
          jouer('pose', { dx: ev.x - v.x, dy: ev.y - v.y })
          for (let i = 0; i < 8; i++) {
            const a = R.range(0, Math.PI * 2)
            etincelles.ajouter('etincelle', ev.x, ev.y, Math.cos(a) * R.range(15, 40), Math.sin(a) * R.range(15, 40), R.range(0.2, 0.4), R.next() < 0.5 ? N.hex('#8a8a96') : PEPITE[2], 1, 2)
          }
          break
        case 'tourelleFinie':
          // (une tourelle s'éteint : quelques étincelles)
          for (let i = 0; i < 6; i++) {
            const a = R.range(0, Math.PI * 2)
            etincelles.ajouter('etincelle', ev.x, ev.y, Math.cos(a) * R.range(10, 30), Math.sin(a) * R.range(10, 30), R.range(0.2, 0.35), R.next() < 0.5 ? N.WHITE : N.hex('#8a8a96'), 1, 2)
          }
          break
        case 'obus':
          // une arme tire : deux étincelles à la bouche, et son son
          // (un coup annoncé en avance a déjà sonné)
          if (t - (armeAnnonceeA.get(ev.arme) ?? -10) < 0.4) armeAnnonceeA.delete(ev.arme)
          else jouer(ev.arme as Son)
          for (let i = 0; i < 2; i++) etincelles.ajouter('etincelle', ev.x, ev.y, R.range(-20, 20), R.range(-20, 20), 0.12, N.WHITE, 1, 1.5)
          break
        case 'ennemiTouche': {
          // un obus touche le rival : il blanchit, des étincelles cyan
          // (un insecte, dans le jeu du vortex : un son organique — Keko, 15/11)
          jouer(VORTEX ? 'insecteTouche' : 'ennemiTouche', { dx: ev.x - v.x, dy: ev.y - v.y })
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
          coupsAuBouclier.push({ x: ev.x, y: ev.y, t0: t, brise: m.bouclier <= 0 })
          secousse = Math.max(secousse, 0.3)
          if (typeof navigator.vibrate === 'function') vibrer(20)
          for (let i = 0; i < 8; i++) {
            const a = R.range(0, Math.PI * 2)
            const vit = R.range(30, 100)
            etincelles.ajouter('etincelle', ev.x, ev.y, Math.cos(a) * vit, Math.sin(a) * vit, R.range(0.2, 0.4), R.next() < 0.5 ? N.WHITE : VERRIERE[2], 1, 2.5)
          }
          break
        }
        case 'corrompu': {
          // LE COUP CORROMPT (les Innommés) : comme un coup dans la coque — le son, la secousse —, mais les étincelles
          // sont violettes et la barre ne baisse pas : sa part touchée devient violette
          if (!(r.chocs.length > 0 && t - chocAnnonceA < 0.4)) jouer('touche')
          toucheA = t
          secousse = Math.max(secousse, 0.6)
          if (typeof navigator.vibrate === 'function') vibrer(35)
          for (let i = 0; i < 10; i++) {
            const a = R.range(0, Math.PI * 2)
            const vit = R.range(30, 100)
            etincelles.ajouter('etincelle', ev.x, ev.y, Math.cos(a) * vit, Math.sin(a) * vit, R.range(0.2, 0.5), i % 3 === 0 ? N.WHITE : CORRUPTION[1 + (i % 2)], 1, 2.5)
          }
          break
        }
        case 'purge': {
          // UN INSECTE ABATTU PURGE LA CORRUPTION : un frisson qui remonte, un filet violet de l'insecte au vaisseau, la
          // barre qui s'éclaire
          jouer('purge')
          purgeA = t
          for (let i = 0; i < 6; i++) {
            const u = i / 6
            etincelles.ajouter('etincelle', ev.x + (v.x - ev.x) * u, ev.y + (v.y - ev.y) * u, (v.x - ev.x) * 1.5, (v.y - ev.y) * 1.5, 0.12 + 0.05 * i, i % 2 === 0 ? CORRUPTION[0] : CORRUPTION[1], 1, 2)
          }
          break
        }
        case 'plaque': {
          // UNE PLAQUE DE BLINDAGE PREND LE COUP ET CASSE (les humains, Keko, 17/11) : un clang de métal, des éclats
          // d'acier qui giclent, une secousse ; sa plaque, dans la barre, blanchit puis se creuse
          jouer('plaque')
          plaquesCasseesA[ev.k] = t
          secousse = Math.max(secousse, 0.35)
          if (typeof navigator.vibrate === 'function') vibrer(25)
          for (let i = 0; i < 10; i++) {
            const a = R.range(0, Math.PI * 2)
            const vit = R.range(30, 110)
            etincelles.ajouter('etincelle', ev.x, ev.y, Math.cos(a) * vit, Math.sin(a) * vit, R.range(0.2, 0.45), i % 3 === 0 ? N.WHITE : ACIER_DES_PLAQUES[i % 2], 1, 2.5)
          }
          break
        }
        case 'explosion': {
          // la bombe éclate : l'explosion du dépôt, une secousse, un éclair, des morceaux
          jouer('ennemiDetruit', { dx: ev.x - v.x, dy: ev.y - v.y })
          effets.push({ fx: N.createFx(EXPLOSION as Module, { x: ev.x - camera.x + W / 2, y: ev.y - camera.y + centreY(), size: 0.6, seed: Math.round(ev.x * 7 + ev.y) }), x: ev.x, y: ev.y })
          flashs.push({ x: ev.x, y: ev.y, t0: t, r: ev.rayon })
          secousse = Math.max(secousse, 1)
          if (typeof navigator.vibrate === 'function') vibrer(50)
          break
        }
        case 'retour': {
          // LE JOUEUR REVIENT AU PORTAIL : la matérialisation du départ, et son son
          arriveA = t
          jouer('arrive', undefined, Math.max(0, ARRIVE_A - ECLOSION_DE_L_ARRIVEE))
          effets.push({ fx: N.createFx(MATERIALISATION as Module, { x: -camera.x + W / 2, y: -camera.y + centreY(), rayon: CONF.rayon, seed: 4 }), x: 0, y: 0 })
          break
        }
        case 'niveau': {
          // UN NIVEAU : le jeu se met en pause, on choisit un talent (un de plus s'il y en avait déjà un à choisir)
          niveauA = t
          jouer('achat')
          const enCours = choixDeTalent as Choix | null
          if (enCours === null) {
            choixDeTalent = ouvrirLeChoix(reserveDeTalents)
            reserveDeTalents = 0
            talentFinA = t + DUREE_DU_CHOIX
            talentA = t
          } else choixDeTalent = { aFaire: enCours.aFaire + 1, rang: enCours.rang }
          break
        }
        case 'fin': {
          // LE PORTAIL EST TOMBÉ : la partie s'arrête sur son écran de fin
          finA = t
          jouer('perdu')
          secousse = 1
          break
        }
        case 'traverse': {
          // UN INSECTE TRAVERSE LE PORTAIL : il y est ASPIRÉ, et le portail le dit
          // (SANS POSITION, AU MÊME VOLUME OÙ QU'ON SOIT — Keko, 14/11 : « pour que les joueurs aient bien l'information »)
          jouer('breche')
          {
            // (son image est aspirée : la règle l'a déjà retiré du monde, on garde où il était et vers où il regardait)
            const parti = dernierVu.get(ev.id)
            aspires.push({ x: ev.x, y: ev.y, cap: parti?.cap ?? Math.atan2(-ev.y, -ev.x), id: ev.id, t0: t, aggro: parti?.aggro ?? false })
            dernierVu.delete(ev.id)
          }
          for (let i = 0; i < 10; i++) {
            const a = R.range(0, Math.PI * 2)
            etincelles.ajouter('etincelle', ev.x, ev.y, -Math.cos(a) * R.range(10, 40), -Math.sin(a) * R.range(10, 40), R.range(0.2, 0.5), R.next() < 0.5 ? N.hex('#cf9bff') : N.WHITE, 1, 2)
          }
          passeA = t
          break
        }
        case 'vague': {
          // (d'où elle vient : des flèches rouges au bord, quelques secondes)
          vagueA = t
          cadransDeLaVague = ev.cadrans
          jouer('equipe')
          break
        }
        case 'salve': {
          // (une salve d'éclats part : son crissement — sauf s'il a sonné en avance —, une couronne de givre autour
          // du vaisseau)
          if (t - (armeAnnonceeA.get(ev.arme) ?? -10) < 0.4) armeAnnonceeA.delete(ev.arme)
          else jouer(ev.arme as Son)
          for (let i = 0; i < 12; i++) {
            const a = (i / 12) * Math.PI * 2
            etincelles.ajouter('etincelle', ev.x + Math.cos(a) * 6, ev.y + Math.sin(a) * 6, Math.cos(a) * R.range(30, 60), Math.sin(a) * R.range(30, 60), R.range(0.12, 0.25), R.next() < 0.5 ? N.WHITE : GLACE[5], 1, 1.5)
          }
          break
        }
        case 'eclatement': {
          // (UN ÉCLAT SE BRISE : celui de l'Ice Shatter — un éclair blanc, une étoile, de la poudre de glace et des
          // paillettes qui partent en cône derrière l'insecte, le tintement du verre)
          if (t - eclatementSonneA > 0.08) {
            eclatementSonneA = t
            jouer('eclatement', { dx: ev.x - v.x, dy: ev.y - v.y })
          }
          eclatsBrises.push({ x: ev.x, y: ev.y, t0: t })
          for (let i = 0; i < 7; i++) {
            const a = ev.cap + R.range(-0.6, 0.6)
            const vit = R.range(30, 90)
            etincelles.ajouter('etincelle', ev.x, ev.y, Math.cos(a) * vit, Math.sin(a) * vit, R.range(0.15, 0.35), [N.WHITE, GLACE[6], GLACE[5], GLACE[4]][Math.floor(R.next() * 4)], 1, 2.5)
          }
          break
        }
        case 'tentacule':
          // (une tentacule fouette : un claquement mouillé — un seul à la fois, elles partent souvent ensemble)
          if (t - fouetSonneA > 0.12) {
            fouetSonneA = t
            jouer('fouet', { dx: ev.x - v.x, dy: ev.y - v.y })
          }
          break
        case 'crachat':
          // (la Vouivre crache : son crachat gluant — sauf s'il a sonné en avance —, la gerbe de gouttes dans le cône)
          if (t - (armeAnnonceeA.get(ev.arme) ?? -10) < 0.4) armeAnnonceeA.delete(ev.arme)
          else jouer(ev.arme as Son)
          crachats.push({ x: ev.x, y: ev.y, cap: ev.cap, cone: ev.cone, portee: ev.portee, t0: t, id: Math.round(t * 1000) })
          break
        case 'fleauFrappe':
          // (la masse frappe : un choc sourd et métallique, des étincelles, une petite secousse)
          jouer('fleau', { dx: ev.x - v.x, dy: ev.y - v.y })
          for (let i = 0; i < 7; i++) {
            const a = R.range(0, Math.PI * 2)
            etincelles.ajouter('etincelle', ev.x, ev.y, Math.cos(a) * R.range(30, 80), Math.sin(a) * R.range(30, 80), R.range(0.12, 0.3), R.next() < 0.5 ? N.WHITE : PEPITE[2], 1, 1.5)
          }
          secousse = Math.max(secousse, 0.15)
          break
        case 'chaineFrappe':
          // (la chaîne fouette un insecte : un cliquetis sec, deux étincelles — moins que la masse)
          jouer('maillons', { dx: ev.x - v.x, dy: ev.y - v.y })
          for (let i = 0; i < 3; i++) {
            const a = R.range(0, Math.PI * 2)
            etincelles.ajouter('etincelle', ev.x, ev.y, Math.cos(a) * R.range(20, 50), Math.sin(a) * R.range(20, 50), R.range(0.1, 0.2), N.WHITE, 1, 1)
          }
          break
        case 'parasiteLance':
          // (un cerveau est lancé : son petit couinement mouillé — sauf s'il a sonné en avance)
          if (t - (armeAnnonceeA.get(ev.arme) ?? -10) < 0.4) armeAnnonceeA.delete(ev.arme)
          else jouer(ev.arme as Son)
          break
        case 'parasiteAccroche':
          // (il s'accroche : ses crocs se plantent, une giclée)
          jouer('piqure', { dx: ev.x - v.x, dy: ev.y - v.y })
          toucheEnnemiA.set(ev.id, t)
          for (let i = 0; i < 5; i++) {
            const a = R.range(0, Math.PI * 2)
            etincelles.ajouter('etincelle', ev.x, ev.y, Math.cos(a) * R.range(15, 40), Math.sin(a) * R.range(15, 40), R.range(0.15, 0.3), R.next() < 0.5 ? CERVEAU[3] : MEMBRANE[2], 1, 1.5)
          }
          break
        case 'parasiteSaute':
          // (son hôte mort, il bondit hors de lui : un « blop », une gerbe de chair et de membrane)
          jouer('ponte', { dx: ev.x - v.x, dy: ev.y - v.y })
          for (let i = 0; i < 9; i++) {
            const a = R.range(0, Math.PI * 2)
            etincelles.ajouter('etincelle', ev.x, ev.y, Math.cos(a) * R.range(20, 60), Math.sin(a) * R.range(20, 60), R.range(0.2, 0.4), [CERVEAU[3], MEMBRANE[2], LIE[3]][Math.floor(R.next() * 3)], 1, 1.5)
          }
          break
        case 'parasiteMort':
          // (il meurt, sans hôte : il se dessèche — trois miettes)
          for (let i = 0; i < 3; i++) {
            const a = R.range(0, Math.PI * 2)
            etincelles.ajouter('etincelle', ev.x, ev.y, Math.cos(a) * R.range(5, 15), Math.sin(a) * R.range(5, 15), R.range(0.2, 0.35), CERVEAU[1], 1, 1)
          }
          break
        case 'mineLancee':
          // (une pustule part de son dos : un « blop » — sauf s'il a sonné en avance)
          if (t - (armeAnnonceeA.get(ev.arme) ?? -10) < 0.4) armeAnnonceeA.delete(ev.arme)
          else jouer(ev.arme as Son)
          break
        case 'gaz':
          // (ELLE ÉCLATE : le nuage de gaz, son « pchouf » mouillé, des gouttes, une petite secousse)
          gaz.push({ x: ev.x, y: ev.y, rayon: ev.rayon, t0: t, id: Math.round(ev.x * 13 + ev.y * 7 + t * 100) })
          jouer('gaz', { dx: ev.x - v.x, dy: ev.y - v.y })
          for (let i = 0; i < 12; i++) {
            const a = R.range(0, Math.PI * 2)
            etincelles.ajouter('etincelle', ev.x, ev.y, Math.cos(a) * R.range(25, 70), Math.sin(a) * R.range(25, 70), R.range(0.2, 0.4), [VENIN[4], VENIN[3], LIE[3]][Math.floor(R.next() * 3)], 1, 1.5)
          }
          secousse = Math.max(secousse, 0.18)
          break
        case 'mineFinie':
          // (elle s'éteint sans avoir servi : elle se dégonfle, un filet de gaz)
          for (let i = 0; i < 4; i++) {
            const a = R.range(0, Math.PI * 2)
            etincelles.ajouter('etincelle', ev.x, ev.y, Math.cos(a) * R.range(5, 15), Math.sin(a) * R.range(5, 15) - 10, R.range(0.3, 0.5), VENIN[2], 1, 1)
          }
          break
        case 'ronge':
          // (un insecte se met à être rongé : un grésillement — un seul à la fois)
          if (t - rongeSonneA > 0.15) {
            rongeSonneA = t
            jouer('ronge', { dx: ev.x - v.x, dy: ev.y - v.y })
          }
          break
        case 'rejeton':
          // (un rejeton est pondu : un « blop » gluant, une giclée de bile)
          jouer('ponte', { dx: ev.x - v.x, dy: ev.y - v.y })
          for (let i = 0; i < 8; i++) {
            const a = R.range(0, Math.PI * 2)
            etincelles.ajouter('etincelle', ev.x, ev.y, Math.cos(a) * R.range(15, 45), Math.sin(a) * R.range(15, 45), R.range(0.15, 0.35), R.next() < 0.5 ? BILE[1] : CHAIR[3], 1, 1.5)
          }
          break
        case 'coupDeRejeton': {
          // (il fouette : la tentacule part en courbe, le claquement mouillé)
          const h = (ev.id * 37 + Math.round(t * 10)) % 2 === 0 ? 1 : -1
          coupsDeRejeton.push({ id: ev.id, tx: ev.x, ty: ev.y, t0: t, virage: h * 0.3 })
          if (t - fouetSonneA > 0.1) {
            fouetSonneA = t
            jouer('fouet', { dx: ev.x - v.x, dy: ev.y - v.y })
          }
          break
        }
        case 'vrille':
          // (une vrille d'ombre sort : un « blop » sombre, une giclée d'encre violette hors de la flaque)
          jouer('ponte', { dx: ev.x - v.x, dy: ev.y - v.y })
          for (let i = 0; i < 10; i++) {
            const a = R.range(0, Math.PI * 2)
            etincelles.ajouter('etincelle', ev.x, ev.y, Math.cos(a) * R.range(15, 50), Math.sin(a) * R.range(15, 50), R.range(0.15, 0.4), i % 3 === 0 ? OMBRE[6] : OMBRE[4], 1, 1.5)
          }
          break
        case 'epines':
          // (l'épine part de sa tête : elle fend l'air)
          jouer('epine', { dx: ev.x - v.x, dy: ev.y - v.y })
          break
        case 'transperce':
          // (un insecte est transpercé : le « tchk » charnu, un seul à la fois, une giclée d'ichor)
          if (t - morsureSonneA > 0.08) {
            morsureSonneA = t
            jouer('piqure', { dx: ev.x - v.x, dy: ev.y - v.y })
          }
          for (let i = 0; i < 5; i++) {
            const a = R.range(0, Math.PI * 2)
            etincelles.ajouter('etincelle', ev.x, ev.y, Math.cos(a) * R.range(10, 30), Math.sin(a) * R.range(10, 30), R.range(0.15, 0.3), i % 2 === 0 ? MIASME[5] : OS[2], 1, 1)
          }
          break
        case 'epineFinie':
          epinesFinies.push({ x: ev.x, y: ev.y, cap: ev.cap, t0: t })
          break
        case 'oeuf':
          // (le Ver pond : un petit « blop »)
          jouer('ponte', { dx: ev.x - v.x, dy: ev.y - v.y })
          break
        case 'eclosion': {
          // (l'œuf éclot : la coque éclate en coquilles qui volent, une gerbe de rayons, de la bave)
          jouer('ponte', { dx: ev.x - v.x, dy: ev.y - v.y })
          eclosions.push({ x: ev.x, y: ev.y, t0: t, id: ev.id })
          const n = 3 + Math.floor(R.next() * 2)
          for (let i = 0; i < n; i++) {
            const a = (i / n) * Math.PI * 2 + R.range(-0.4, 0.4)
            const vit = R.range(30, 55)
            coquilles.push({ x: ev.x + Math.cos(a) * 2, y: ev.y + Math.sin(a) * 2, vx: Math.cos(a) * vit, vy: Math.sin(a) * vit, a, va: R.range(-9, 9), t0: t, r: R.range(1.6, 2.4) })
          }
          for (let i = 0; i < 8; i++) {
            const a = R.range(0, Math.PI * 2)
            etincelles.ajouter('etincelle', ev.x, ev.y, Math.cos(a) * R.range(15, 45), Math.sin(a) * R.range(15, 45), R.range(0.15, 0.35), i % 2 === 0 ? GOUDRON[6] : COQUE_D_OEUF[4], 1, 1.5)
          }
          break
        }
        case 'miniVerFini': {
          // (un mini-ver se dissout : quelques miettes de sa chair)
          const chair = tonsDeLaChairDuVer()
          for (let i = 0; i < 6; i++) {
            const a = R.range(0, Math.PI * 2)
            etincelles.ajouter('etincelle', ev.x, ev.y, Math.cos(a) * R.range(8, 22), Math.sin(a) * R.range(8, 22), R.range(0.2, 0.4), chair[i % 3], 1, 1.5)
          }
          break
        }
        case 'morsureMiniVer':
          // (un mini-ver mord : le claquement de mâchoires, un seul à la fois ; une giclée d'ichor)
          if (t - morsureSonneA > 0.12) {
            morsureSonneA = t
            jouer('morsure', { dx: ev.x - v.x, dy: ev.y - v.y })
          }
          for (let i = 0; i < 3; i++) {
            const a = R.range(0, Math.PI * 2)
            etincelles.ajouter('etincelle', ev.x, ev.y, Math.cos(a) * R.range(10, 25), Math.sin(a) * R.range(10, 25), R.range(0.12, 0.25), i === 0 ? OS[2] : CHAIR[4], 1, 1)
          }
          break
        case 'accroche':
          // (le drain accroche une âme : un anneau qui se referme sur l'insecte, un souffle sourd — un seul à la fois)
          if (t - accrocheSonneA > 0.12) {
            accrocheSonneA = t
            jouer('accroche', { dx: ev.x - v.x, dy: ev.y - v.y })
          }
          for (let i = 0; i < 8; i++) {
            const a = (i / 8) * Math.PI * 2
            etincelles.ajouter('etincelle', ev.x + Math.cos(a) * 9, ev.y + Math.sin(a) * 9, -Math.cos(a) * 45, -Math.sin(a) * 45, 0.18, i % 2 === 0 ? OMBRE[7] : OMBRE[5], 1, 1.5)
          }
          break
        case 'saisie':
          // (elle saisit : le claquement, une giclée d'ombre sur l'insecte)
          if (t - fouetSonneA > 0.1) {
            fouetSonneA = t
            jouer('fouet', { dx: ev.x - v.x, dy: ev.y - v.y })
          }
          for (let i = 0; i < 6; i++) {
            const a = R.range(0, Math.PI * 2)
            etincelles.ajouter('etincelle', ev.x, ev.y, Math.cos(a) * R.range(20, 55), Math.sin(a) * R.range(20, 55), R.range(0.1, 0.25), i % 2 === 0 ? OMBRE[7] : OMBRE[5], 1, 1.5)
          }
          break
        case 'serre':
          // (elle serre : un grain d'ombre gicle de l'étreinte)
          for (let i = 0; i < 2; i++) {
            const a = R.range(0, Math.PI * 2)
            etincelles.ajouter('etincelle', ev.x, ev.y, Math.cos(a) * R.range(10, 30), Math.sin(a) * R.range(10, 30), R.range(0.15, 0.3), OMBRE[6], 1, 1.5)
          }
          break
        case 'arrache':
          // (un grand s'arrache : le claquement d'une corde qui rompt, une gerbe d'ombre)
          jouer('brise', { dx: ev.x - v.x, dy: ev.y - v.y })
          for (let i = 0; i < 12; i++) {
            const a = R.range(0, Math.PI * 2)
            etincelles.ajouter('etincelle', ev.x, ev.y, Math.cos(a) * R.range(25, 70), Math.sin(a) * R.range(25, 70), R.range(0.15, 0.4), i % 3 === 0 ? N.WHITE : OMBRE[5], 1, 2)
          }
          break
        case 'vrilleFinie':
          // (elle rentre : la flaque se referme sur une bouffée d'ombre)
          for (let i = 0; i < 6; i++) {
            const a = R.range(0, Math.PI * 2)
            etincelles.ajouter('etincelle', ev.x, ev.y, Math.cos(a) * R.range(8, 22), Math.sin(a) * R.range(8, 22), R.range(0.2, 0.4), R.next() < 0.5 ? OMBRE[3] : OMBRE[5], 1, 1.5)
          }
          break
        case 'rejetonFini':
          // (il s'éteint : il se flétrit en une bouffée de chair et de bile)
          for (let i = 0; i < 6; i++) {
            const a = R.range(0, Math.PI * 2)
            etincelles.ajouter('etincelle', ev.x, ev.y, Math.cos(a) * R.range(8, 25), Math.sin(a) * R.range(8, 25), R.range(0.2, 0.4), R.next() < 0.5 ? CHAIR[2] : BILE[0], 1, 1.5)
          }
          break
        case 'morsure':
          // (le nuage mord : l'insecte blanchit, un bourdonnement qui grince — un seul à la fois)
          toucheEnnemiA.set(ev.id, t)
          if (t - morsureSonneA > 0.25) {
            morsureSonneA = t
            jouer('morsure', { dx: ev.x - v.x, dy: ev.y - v.y })
          }
          break
        case 'piqure':
          // (l'aiguille se plante : son « tchk » charnu, une giclée de bile)
          jouer('piqure', { dx: ev.x - v.x, dy: ev.y - v.y })
          for (let i = 0; i < 6; i++) {
            const a = R.range(0, Math.PI * 2)
            etincelles.ajouter('etincelle', ev.x, ev.y, Math.cos(a) * R.range(20, 55), Math.sin(a) * R.range(20, 55), R.range(0.15, 0.3), R.next() < 0.5 ? BILE[1] : BILE[2], 1, 1.5)
          }
          break
        case 'sphere':
          // (une sphère part : la décharge — sauf si elle a sonné en avance —, des grains de plasma à la bouche)
          if (t - (armeAnnonceeA.get(ev.arme) ?? -10) < 0.4) armeAnnonceeA.delete(ev.arme)
          else jouer(ev.arme as Son)
          for (let i = 0; i < 8; i++) {
            const a = R.range(0, Math.PI * 2)
            etincelles.ajouter('etincelle', ev.x, ev.y, Math.cos(a) * R.range(30, 70), Math.sin(a) * R.range(30, 70), R.range(0.12, 0.25), R.next() < 0.5 ? N.WHITE : PLASMA_V[3], 1, 1.5)
          }
          break
        case 'sphereTir': {
          // (elle tire ses petits traits : elle flashe, un petit « tsip » — pas plus d'un tous les dixièmes)
          const s = m.spheres.find((x) => Math.hypot(x.x - ev.x, x.y - ev.y) < 0.5)
          if (s !== undefined) sphereTirA.set(s.id, t)
          if (t - arcaneSonneA > 0.1) {
            arcaneSonneA = t
            jouer('arcane', { dx: ev.x - v.x, dy: ev.y - v.y })
          }
          break
        }
        case 'puits':
          // (un puits part : son lancer sourd — sauf s'il a sonné en avance —, des grains violets à la bouche)
          if (t - (armeAnnonceeA.get(ev.arme) ?? -10) < 0.4) armeAnnonceeA.delete(ev.arme)
          else jouer('puits')
          for (let i = 0; i < 6; i++) {
            const a = R.range(0, Math.PI * 2)
            etincelles.ajouter('etincelle', ev.x, ev.y, Math.cos(a) * R.range(20, 50), Math.sin(a) * R.range(20, 50), R.range(0.12, 0.25), R.next() < 0.5 ? VIDE[5] : VIDE[3], 1, 1.5)
          }
          break
        case 'meteore':
          // (une météore part du ciel : son sifflement qui tombe — sauf s'il a sonné en avance)
          if (t - (armeAnnonceeA.get(ev.arme) ?? -10) < 0.4) armeAnnonceeA.delete(ev.arme)
          else jouer('meteore')
          lancersDeMeteore.push({ x0: ev.x0, y0: ev.y0, t0: t, id: ev.id })
          break
        case 'meteoreImpact':
          // (elle frappe : son coup — sauf s'il a sonné en avance —, le cratère, des éclats projetés, une secousse)
          if (meteoresAnnoncees.has(ev.id)) meteoresAnnoncees.delete(ev.id)
          else jouer('impactMeteore', { dx: ev.x - v.x, dy: ev.y - v.y })
          impactsDeMeteore.push({ x: ev.x, y: ev.y, t0: t, r: POINT_DE_CHUTE, id: ev.id })
          for (let i = 0; i < 14; i++) {
            const a = R.range(0, Math.PI * 2)
            const vit = R.range(40, 110)
            etincelles.ajouter('etincelle', ev.x, ev.y, Math.cos(a) * vit, Math.sin(a) * vit, R.range(0.2, 0.45), [N.WHITE, PLASMA_V[4], PLASMA_V[3], PLASMA_V[2]][Math.floor(R.next() * 4)], 1, 2)
          }
          secousse = Math.max(secousse, 0.35)
          break
        case 'puitsOuvert':
          // (il s'ouvre : l'aspiration, qui monte pendant qu'il tire)
          jouer('aspire', { dx: ev.x - v.x, dy: ev.y - v.y })
          break
        case 'puitsEclate':
          // (il éclate : le trou noir s'effondre — l'horizon se referme, une onde magenta s'ouvre —, une secousse)
          jouer('eclatPlasma', { dx: ev.x - v.x, dy: ev.y - v.y })
          effondrements.push({ x: ev.x, y: ev.y, t0: t, r: ev.rayon })
          for (let i = 0; i < 16; i++) {
            const a = R.range(0, Math.PI * 2)
            const vit = R.range(40, 120)
            etincelles.ajouter('etincelle', ev.x, ev.y, Math.cos(a) * vit, Math.sin(a) * vit, R.range(0.2, 0.45), [N.WHITE, VIDE[6], VIDE[5], VIDE[4]][Math.floor(R.next() * 4)], 1, 2)
          }
          secousse = Math.max(secousse, 0.3)
          break
        case 'sphereFinie':
          // (elle s'éteint : elle se resserre et lâche une petite gerbe, sans dégâts)
          eclatsDePlasma.push({ x: ev.x, y: ev.y, t0: t, r: RAYON_DE_LA_SPHERE * 1.4, id: Math.round(ev.x * 13 + ev.y * 7) })
          jouer('dissipe', { dx: ev.x - v.x, dy: ev.y - v.y })
          break
        case 'rail': {
          // (LE RAILGUN : le trait, son claquement — sauf s'il a sonné en avance —, des étincelles tout le long, une secousse)
          if (t - (armeAnnonceeA.get(ev.arme) ?? -10) < 0.4) armeAnnonceeA.delete(ev.arme)
          else jouer(ev.arme as Son)
          traitsDuRail.push({ x0: ev.x0, y0: ev.y0, x1: ev.x1, y1: ev.y1, t0: t })
          for (let i = 0; i < 18; i++) {
            const q = R.next()
            const a = R.range(0, Math.PI * 2)
            etincelles.ajouter('etincelle', ev.x0 + (ev.x1 - ev.x0) * q, ev.y0 + (ev.y1 - ev.y0) * q, Math.cos(a) * R.range(15, 50), Math.sin(a) * R.range(15, 50), R.range(0.15, 0.35), [N.WHITE, FAISCEAU[4], FAISCEAU[2]][Math.floor(R.next() * 3)], 1, 1.5)
          }
          secousse = Math.max(secousse, 0.25)
          break
        }
        case 'essaim':
          // (un essaim part : sa volée de sifflements — sauf s'il a sonné en avance —, des grains de plasma à la bouche)
          if (t - (armeAnnonceeA.get(ev.arme) ?? -10) < 0.4) armeAnnonceeA.delete(ev.arme)
          else jouer(ev.arme as Son)
          for (let i = 0; i < 8; i++) {
            const a = R.range(0, Math.PI * 2)
            etincelles.ajouter('etincelle', ev.x, ev.y, Math.cos(a) * R.range(30, 80), Math.sin(a) * R.range(30, 80), R.range(0.12, 0.25), R.next() < 0.5 ? N.WHITE : PLASMA_V[3], 1, 1.5)
          }
          break
        case 'tornade':
          // (une tornade part : le souffle du vent qui se lève — sauf s'il a sonné en avance)
          if (t - (armeAnnonceeA.get(ev.arme) ?? -10) < 0.4) armeAnnonceeA.delete(ev.arme)
          else jouer(ev.arme as Son)
          break
        case 'tornadeFinie':
          // (elle s'éteint : un dernier tourbillon de flocons qui s'éparpille)
          for (let i = 0; i < 10; i++) {
            const a = R.range(0, Math.PI * 2)
            etincelles.ajouter('etincelle', ev.x, ev.y, Math.cos(a) * R.range(15, 45), Math.sin(a) * R.range(15, 45), R.range(0.2, 0.45), R.next() < 0.5 ? N.WHITE : GLACE[5], 1, 1.5)
          }
          break
        case 'nova':
          // (une nova de givre part : son claquement froid, la secousse, le froid tout autour)
          jouer('nova')
          novas.push({ x: ev.x, y: ev.y, r: ev.rayon, t0: t, id: Math.round(t * 1000) })
          secousse = Math.max(secousse, 0.3)
          break
        case 'gele':
          // (un insecte entre dans le givre : un craquement de glace — pas plus d'un tous les dixièmes)
          if (t - geleSonneA > 0.1) {
            geleSonneA = t
            jouer('gel', { dx: ev.x - v.x, dy: ev.y - v.y })
          }
          break
        case 'ennemiDetruit': {
          // MORT GELÉ : il vole en ÉCLATS DE GLACE — des morceaux de glace qui tournent, des étincelles froides, un
          // flocon qui éclate, le bruit du verre qui se brise
          if (VORTEX && ev.gele === true) {
            jouer('brise', { dx: ev.x - v.x, dy: ev.y - v.y })
            compter('rivaux', 1)
            for (let i = 0; i < 12; i++) {
              const a = R.range(0, Math.PI * 2)
              const vit = R.range(25, 95)
              morceaux.add({ kind: N.B.SHARD, x: ev.x, y: ev.y, vx: Math.cos(a) * vit + ev.vx * 0.3, vy: Math.sin(a) * vit + ev.vy * 0.3, g: 0, drag: 1.4, bounce: 0, life: R.range(0.5, 1.1), a: R.range(0, Math.PI * 2), va: R.range(-12, 12), s: R.range(1.2, 2.6), c: GLACE[3 + Math.floor(R.next() * 4)] })
            }
            for (let i = 0; i < 10; i++) {
              const a = R.range(0, Math.PI * 2)
              etincelles.ajouter('etincelle', ev.x, ev.y, Math.cos(a) * R.range(30, 90), Math.sin(a) * R.range(30, 90), R.range(0.15, 0.35), R.next() < 0.5 ? N.WHITE : GLACE[5], 1, 2)
            }
            flashs.push({ x: ev.x, y: ev.y, t0: t, r: 5 })
            flammesEnnemies.delete(ev.id)
            if (typeof navigator.vibrate === 'function') vibrer(15)
            break
          }
          // MORT PAR LE FEU : il se consume, sans sang ni éclat (voir `consumer`)
          if (VORTEX && ev.brule === true) {
            jouer('consume', { dx: ev.x - v.x, dy: ev.y - v.y })
            compter('rivaux', 1)
            consumer(ev.id, ev.x, ev.y, ev.vx, ev.vy)
            flammesEnnemies.delete(ev.id)
            if (typeof navigator.vibrate === 'function') vibrer(12)
            break
          }
          if (VORTEX) {
            // UN INSECTE S'ÉCRASE (Keko, 14/11 : « pas une animation d'explosion : une destruction d'insecte, avec du sang
            // vert et un bruit de splash ») : une giclée de gouttes vertes, des éclaboussures qui retombent, une
            // tache qui reste quelques secondes
            jouer('splash', { dx: ev.x - v.x, dy: ev.y - v.y })
            compter('rivaux', 1)
            for (let i = 0; i < 22; i++) {
              const a = R.range(0, Math.PI * 2)
              const vit = R.range(25, 120)
              etincelles.ajouter('etincelle', ev.x, ev.y, Math.cos(a) * vit + ev.vx * 0.3, Math.sin(a) * vit + ev.vy * 0.3, R.range(0.2, 0.55), SANG_VERT[Math.floor(R.next() * 3)], 1, 4)
            }
            for (let i = 0; i < 10; i++) {
              const a = R.range(0, Math.PI * 2)
              const vit = R.range(8, 40)
              braises.ajouter('braise', ev.x + R.range(-2, 2), ev.y + R.range(-2, 2), Math.cos(a) * vit, Math.sin(a) * vit, R.range(0.5, 1), BRAISES_VERTES, 1, 3)
            }
            taches.push({ x: ev.x, y: ev.y, t0: t, graine: ev.id })
            flammesEnnemies.delete(ev.id)
            if (typeof navigator.vibrate === 'function') vibrer(15)
            break
          }
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
          if (typeof navigator.vibrate === 'function') vibrer(40)
          break
        }
        case 'extrait': {
          jouer('extrait')
          // resté à quai jusqu'au bout : le vaisseau se TÉLÉPORTE (Keko) — dessiné blanchi jusqu'à l'éclair, puis
          // l'effet prend le relais et il n'est plus dessiné ; l'écran de fin vient quand l'effet est passé
          perduA = t
          effets.push({ fx: N.createFx(TELEPORTATION as Module, { x: v.x - camera.x + W / 2, y: v.y - camera.y + centreY(), rayon: CONF.rayon, seed: 3 }), x: v.x, y: v.y })
          secousse = 0.5
          if (typeof navigator.vibrate === 'function') vibrer([40, 60, 40])
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
          jouer(sonDeLaMort())
          perduA = t
          // LES PIÈCES CONSTRUITES QUI ÉTAIENT MONTÉES SONT PERDUES AVEC LE VAISSEAU (Keko, 14/11 : « comme un vrai jeu
          // d'extraction ») : le hangar le dira au retour
          // (pas dans le jeu du vortex : on y revient au portail dix secondes plus tard, avec tout son équipement)
          if (!VORTEX) {
            const pr = perdreLesMontees(hangar, modeleDeVaisseau(flotte.actif).serie)
            hangar = pr.hangar
            if (pr.perdues.length > 0) pertes = { noms: pr.perdues.map((id) => pieceDe(id)?.nom ?? id), t0: null }
          }
          compter('parcouru', v.parcouru)
          sauver()
          effets.push({ fx: effetDeLaMort(v.x - camera.x + W / 2, v.y - camera.y + centreY()), x: v.x, y: v.y })
          for (let i = 0; i < 18; i++) {
            const a = R.range(0, Math.PI * 2)
            const vit = R.range(30, 120)
            morceaux.add({ kind: N.B.SHARD, x: v.x, y: v.y, vx: Math.cos(a) * vit + v.vx * 0.4, vy: Math.sin(a) * vit + v.vy * 0.4, g: 0, drag: 1.2, bounce: 0, life: R.range(0.9, 1.6), a: R.range(0, Math.PI * 2), va: R.range(-10, 10), s: R.range(1.5, 3), c: COQUE[1 + Math.floor(R.next() * 4)] })
          }
          secousse = 1
          if (typeof navigator.vibrate === 'function') vibrer([60, 40, 90])
          break
        }
        default:
          break
      }
    }
  }
  function image(ms: number): void {
    const dt = Math.min(0.25, (ms - avant) / 1000)
    avant = ms
    t += dt
    // (le tampon se couche ou se relève quand on décolle ou qu'on rentre, téléphone couché)
    // LE CHAMP DE VISION glisse vers ce que les boutons « + » et « − » ont demandé (un quart par tape, en un sixième de
    // seconde) ; à chaque pas, le tampon est refait et les manches gardent leur place à l'écran
    if (VORTEX) {
      // (le jeu du vortex était dézoomé au maximum, en permanence — Keko, 14/11 ; LE ZOOM Y EST MAINTENANT AU GESTE, voir
      // `champDuVortex` : il suit le doigt, sans glisser)
      champCible = champDuVortex
      champVoulu = champCible
    } else if (ZOOM_A_LA_MAIN) {
      if (champVoulu !== champCible) {
        const pas = dt * 1.5
        champVoulu = Math.abs(champCible - champVoulu) <= pas ? champCible : champVoulu + Math.sign(champCible - champVoulu) * pas
      }
    } else {
      // LE ZOOM AUTOMATIQUE, PAR LA VITESSE (Keko, 14/11, à l'essai — les boutons « + » et « − » étaient « pas
      // pratiques ») : à l'arrêt et à petite allure, la vue de près ; elle s'élargit à mesure qu'on va vite, jusqu'à
      // `CHAMP_AUTO` à la pointe d'un chasseur. Elle SUIT EN DOUCEUR (une seconde et quelque), pour ne pas « respirer »
      // à chaque coup de manche.
      const vit = enJeu && m.phase === 'vol' ? Math.hypot(v.vx, v.vy) : 0
      const u = Math.max(0, Math.min(1, (vit - VITESSE_DE_PRES) / (VITESSE_DU_LARGE - VITESSE_DE_PRES)))
      champCible = 1 + (CHAMP_AUTO - 1) * u * u * (3 - 2 * u)
      champVoulu += (champCible - champVoulu) * Math.min(1, dt / 1.1)
    }
    champ = Math.round(champVoulu * 90) / 90
    if (veutLePaysage() !== paysage || champDuMoment() / echelleUI !== champApplique || doitCouvrir() !== couvreApplique) cadrer()
    if (coupDEssai > 0 && enJeu && m.phase === 'vol' && t >= coupDEssaiA) {
      coupDEssaiA = t + coupDEssai
      if (m.bouclier > 0) {
        m.bouclier = Math.max(0, m.bouclier - 1)
        m.toucheA = m.t
        bouclierA = t
        // (le coup d'essai vient d'un côté qui tourne : la bulle montre son onde, et sa fêlure au dernier point)
        coupsAuBouclier.push({ x: v.x + Math.cos(t * 2.3) * 20, y: v.y + Math.sin(t * 2.3) * 20, t0: t, brise: m.bouclier <= 0 })
      } else if (m.plaques.length > 0 || CONF.corruption.ronge > 0) {
        // (un vaisseau à plaques ou corruptible : le coup d'essai passe par la règle, comme un vrai — au bout, tout revient)
        if (m.coque <= 1.3) {
          m.coque = CONF.coque
          m.plaques = m.plaques.map(() => true)
          m.corruption = 0
        } else {
          const evs: Evenement[] = []
          encaisser(CONF, m, v.x, v.y, 0.8, evs)
          for (const e of evs) if (e.type === 'plaque') (plaquesCasseesA[e.k] = t), jouer('plaque')
          if (evs.some((e) => e.type === 'touche' || e.type === 'corrompu')) toucheA = t
        }
      } else {
        m.coque = m.coque > 1.3 ? m.coque - 0.8 : CONF.coque
        m.toucheA = m.t
        if (m.coque < CONF.coque) toucheA = t
      }
    }
    // (la soute ouverte : le monde est en pause, ses sons continus se taisent)
    if (souteOuverte && (!enJeu || m.phase !== 'vol')) souteOuverte = false
    // LE CHOIX D'UN TALENT : le jeu est en pause pour tout le monde ; le délai passé, ce qui reste à choisir part en réserve
    if (choixDeTalent !== null && t >= talentFinA) {
      reserveDeTalents += reserveApresLeDelai(choixDeTalent)
      choixDeTalent = null
    }
    if (enJeu && (souteOuverte || choixDeTalent !== null || pauseOuverte)) regler(0, false, 0, false)
    if (enJeu && !souteOuverte && choixDeTalent === null && !pauseOuverte) {
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
        // (LE TIR RESTE AUTOMATIQUE, manche du regard tenu ou non — Keko, 14/11 : « pas hyper pratique » ; il passait à
        // la main quand on le tenait. Le second manche ne fait plus que tourner le nez et avancer la caméra — la caméra
        // seule pour un vaisseau à tourelles. La règle du tir à la main reste dans `jeu.ts`, plus appelée.)
        const r = avancerLeMonde(CONF, m, PAS, direction, ouRegarder, false)
        // (`&crash=N` : le vaisseau est détruit N secondes après le décollage, pour essayer la perte des pièces d'un lien)
        if (parametres.has('crash') && !crashFait && m.phase === 'vol' && m.t > (Number(parametres.get('crash')) || 3)) {
          crashFait = true // (une fois : dans le jeu du vortex on revient, et on ne remeurt pas aussitôt)
          m.coque = 0
          m.phase = 'perdu'
          m.invasion.retourA = m.t + CONF.invasion.penalite
          r.evenements.push({ type: 'perdu' })
        }
        v = m.vaisseau
        // le lance-flammes crache : des flammes dans le cône, depuis la buse ; son souffle
        if (m.crache) {
          const a0 = CONF.armes[0]
          const bo = a0.bouche ?? { x: 0, y: 0 }
          const ca = Math.cos(v.cap)
          const sa = Math.sin(v.cap)
          const bx = v.x + ca * bo.x - sa * bo.y
          const by = v.y + sa * bo.x + ca * bo.y
          const cone = a0.flamme?.cone ?? 0.4
          // (six par pas, et plus gros au départ : rapides, quatre petites laissaient des trous près de la buse)
          for (let i = 0; i < 6; i++) {
            const an = v.cap + R.range(-cone * 0.8, cone * 0.8)
            // (LA FLAMME VA JUSQU'OÙ ELLE TOUCHE — Keko, 15/11 : « un ennemi tout au bout, je le touche alors que la flamme
            // n'arrive pas jusqu'à lui » : le feu s'éteint, en fumée, aux 78 % de sa vie, après 0,6 × vitesse × vie de
            // course (le frein compris) — la vitesse en sort, pour que ce point tombe sur la portée, rayon de la cible compris)
            // (la flamme freine d'un tiers en volant : elle a couru 0,7 × vitesse × vie de flamme quand elle s'éteint)
            const fl = R.range(0.2, 0.3)
            const vit = ((a0.portee + CONF.ennemi.rayon) / (0.7 * fl)) * R.range(0.9, 1.05)
            flammesDuNez.push({ x: bx, y: by, vx: Math.cos(an) * vit + v.vx, vy: Math.sin(an) * vit + v.vy, t0: t - R.range(0, PAS), fl, sm: R.next() < 0.55, sl: R.range(0.25, 0.45), s: R.range(1.2, 2.4), f: R.next() })
          }
        }
        // le rayon thermique : des étincelles et de petites flammes là où il frappe, plus quand il chauffe
        if (m.canal !== null && m.phase === 'vol') {
          const ch = m.canal.chauffe
          if (R.next() < 0.4 + 0.5 * ch) {
            const a = R.range(0, Math.PI * 2)
            const vit = R.range(30, 90)
            const bleu = CONF.armes[m.canal.arme]?.id === 'faisceau'
            etincelles.ajouter('etincelle', m.canal.x, m.canal.y, Math.cos(a) * vit, Math.sin(a) * vit, R.range(0.12, 0.3), R.next() < 0.4 ? N.WHITE : bleu ? FAISCEAU[R.next() < 0.5 ? 4 : 3] : RAMPE_DU_LASER[R.next() < 0.5 ? 6 : 4], 1, 1.5)
          }
          if (CONF.armes[m.canal.arme]?.id !== 'faisceau' && R.next() < 0.2 + 0.4 * ch) flammesDesBrules.push({ x: m.canal.x + R.range(-2, 2), y: m.canal.y + R.range(-2, 2), vx: R.range(-6, 6), vy: R.range(-14, -4), t0: t, vie: R.range(0.15, 0.3) })
        }
        // le rayon sème des flammes à sa pointe et le long de lui
        {
          // (le trait au sol : le sol éclate en étincelles au point d'impact, des flammes y naissent)
          const im = impactDuRayon(CONF, m)
          if (im !== null && m.phase === 'vol') {
            for (let n = 0; n < 3; n++) {
              const a = R.range(0, Math.PI * 2)
              const vit = R.range(40, 110)
              etincelles.ajouter('etincelle', im.x, im.y, Math.cos(a) * vit, Math.sin(a) * vit, R.range(0.15, 0.35), R.next() < 0.4 ? N.WHITE : RAMPE_DU_LASER[R.next() < 0.5 ? 6 : 4], 1, 1.5)
            }
            if (R.next() < 0.7) flammesDesBrules.push({ x: im.x + R.range(-2, 2), y: im.y + R.range(-2, 2), vx: R.range(-6, 6), vy: R.range(-14, -4), t0: t, vie: R.range(0.2, 0.35) })
          }
          const r = angleDuBalayage(CONF, m)
          if (r !== null && m.phase === 'vol') {
            const ex = v.x + Math.cos(r.angle) * r.longueur
            const ey = v.y + Math.sin(r.angle) * r.longueur
            // (des étincelles à la pointe, qui partent à l'opposé du sens du tour, comme les balayeurs de « Laser grid »)
            for (let n = 0; n < 2; n++) {
              const a = r.angle - (r.sens * Math.PI) / 2 + R.range(-0.9, 0.9)
              const vit = R.range(50, 130)
              etincelles.ajouter('etincelle', ex, ey, Math.cos(a) * vit, Math.sin(a) * vit, R.range(0.15, 0.35), R.next() < 0.4 ? N.WHITE : RAMPE_DU_LASER[R.next() < 0.5 ? 6 : 4], 1, 1.5)
            }
            if (R.next() < 0.5) flammesDesBrules.push({ x: ex, y: ey, vx: R.range(-6, 6), vy: R.range(-14, -4), t0: t, vie: R.range(0.18, 0.3) })
          }
        }
        // les boules de napalm sèment de petites flammes (à leur hauteur, en cloche)
        for (const o of m.obus) {
          if (o.arme !== 'napalm' || R.next() > 0.5) continue
          const u = 1 - o.vie / Math.max(0.01, o.vie0 ?? 1)
          flammesDesBrules.push({ x: o.x, y: o.y - Math.sin(Math.PI * Math.max(0, Math.min(1, u))) * 12, vx: -o.vx * 0.1, vy: -o.vy * 0.1 - 6, t0: t, vie: R.range(0.15, 0.3) })
        }
        // les mini-missiles laissent une traînée de fumée
        for (const o of m.obus) if (o.arme === 'minimissile' && R.next() < 0.6) feuDesConsumes.spawn(N.P.SMOKE, o.x - o.vx * 0.03, o.y - o.vy * 0.03, R.range(-3, 3), R.range(-3, 3), R.range(0.3, 0.5), FUMEE_DU_FEU, R.range(0.9, 1.4))
        // les insectes qui brûlent : de petites flammes naissent sur eux et montent
        for (const e of m.ennemis) {
          if ((e.bruleA ?? -1) <= m.t || R.next() > 0.5) continue
          flammesDesBrules.push({ x: e.corps.x + R.range(-3, 3), y: e.corps.y + R.range(-3, 3), vx: e.corps.vx * 0.7 + R.range(-6, 6), vy: e.corps.vy * 0.7 - R.range(12, 26), t0: t - R.range(0, PAS), vie: R.range(0.25, 0.45) })
        }
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
        celebrer(r)
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
        // les braises du moteur, en coordonnées du monde, derrière la tuyère — EN VOL SEULEMENT (Keko, 15/11 : abattu, le
        // manche tenu en faisait encore naître, figées là où le vaisseau était mort)
        // (une soucoupe ne sème pas de braises : ses jets sont froids)
        if (gabaritDe(monteeA(hangar, 'coque').cran).omni === undefined && pousseeVue.avant > 0.05 && m.phase === 'vol') {
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
            // (LE VER : au bout de SA QUEUE, là où le chemin l'a mise — Keko, 17/11 : « la propulsion ne colle pas à l'endroit
            // exact de sa queue, surtout quand il tourne »)
            const auVer = coque === 14 && queueDuVer !== null
            const bx = auVer ? queueDuVer!.x : v.x - Math.cos(v.cap) * recul - Math.sin(v.cap) * deCote
            const by = auVer ? queueDuVer!.y : v.y - Math.sin(v.cap) * recul + Math.cos(v.cap) * deCote
            const vitesse = 30 + 40 * pousseeVue.avant
            // (UNE BÊTE NE CRACHE PAS DE BRAISES : elle lâche des bulles — voir `bulles`)
            // (pas une file : une sur deux, éparpillées de côté, de toutes tailles — serrées, elles faisaient encore un jet)
            // (… ET COURTES — Keko, 16/11 : « trop long, on va penser que c'est une attaque, ça laisse une traînée » : une demi-
            // seconde au plus, lentes : elles crèvent juste derrière la bête ; puis « encore un poil » : un tiers de seconde au plus)
            if (plieLEspace(coque)) {
              // (le néant : une onde tous les 12 pixels parcourus — un sillage régulier à toute vitesse —, ou toutes les 0,35 s ;
              // le prisme, un éclat tous les 6, un peu de côté ; le tesseract, un cadre tous les 14)
              const pas = coque === 12 ? 6 : coque === 15 ? 14 : 12
              if (t - ondeA > (coque === 12 ? 0.2 : 0.35) || Math.hypot(bx - ondeEn.x, by - ondeEn.y) > pas) {
                ondeA = t
                ondeEn = { x: bx, y: by }
                const cote = coque === 12 ? R.range(-2.5, 2.5) : 0
                ondes.push({ x: bx - Math.sin(v.cap) * cote, y: by + Math.cos(v.cap) * cote, cap: v.cap, t0: t, k: 0.6 + 0.4 * pousseeVue.avant, coque })
              }
            } else if (organique(coque)) {
              if (R.next() < 0.45) {
                const cote = R.range(-1, 1)
                bulles.push({ x: bx - Math.sin(v.cap) * cote * 2.5, y: by + Math.cos(v.cap) * cote * 2.5, vx: -Math.cos(v.cap) * vitesse * 0.13 - Math.sin(v.cap) * cote * 11 + R.range(-4, 4), vy: -Math.sin(v.cap) * vitesse * 0.13 + Math.cos(v.cap) * cote * 11 + R.range(-4, 4), t0: t, vie: R.range(0.18, 0.35), r: R.next() < 0.35 ? R.range(1.6, 2.6) : R.range(0.5, 1.2), c: couleursDesBulles(coque)[R.next() < 0.6 ? 0 : 1] })
              }
            }
            else braises.ajouter('braise', bx + R.range(-1, 1), by + R.range(-1, 1), v.vx * 0.3 - Math.cos(v.cap) * vitesse + R.range(-8, 8), v.vy * 0.3 - Math.sin(v.cap) * vitesse + R.range(-8, 8), R.range(0.25, 0.5), cran >= 3 ? BRAISES_D_ION : 0, 1, 2)
          }
        }
      }
      flamme += (pousseeVue.avant - flamme) * Math.min(1, dt * 14)
      // les sons continus : le souffle du propulseur suit la flamme, la foreuse bourdonne quand elle creuse, la charge
      // de l'extraction monte avec l'arc d'or (et se tait quand le compte est au bout : le son de l'extraction la relève)
      if (m.extraction !== compteVu) compteMonte = m.extraction > compteVu
      compteVu = m.extraction
      regler(m.phase === 'vol' ? Math.max(flamme, 0.6 * v.poussee) : 0, m.phase === 'vol' && (m.forage !== null || m.canal !== null), m.phase === 'vol' ? m.extraction / CONF.extraction.duree : 0, compteMonte, m.phase === 'vol' && m.crache, genreDePropulsion())
      if (m.phase === 'vol') annoncerLesSons()
      for (const e of m.ennemis) {
        const f = flammesEnnemies.get(e.id) ?? 0
        flammesEnnemies.set(e.id, f + (e.corps.poussee - f) * Math.min(1, dt * 14))
        if (e.corps.poussee > 0.05 && R.next() < 0.5) {
          const b = e.corps
          const vitesse = 30 + 40 * b.poussee
          braises.ajouter('braise', b.x - Math.cos(b.cap) * 8 + R.range(-1, 1), b.y - Math.sin(b.cap) * 8 + R.range(-1, 1), b.vx * 0.3 - Math.cos(b.cap) * vitesse + R.range(-8, 8), b.vy * 0.3 - Math.sin(b.cap) * vitesse + R.range(-8, 8), R.range(0.25, 0.5), VORTEX ? BRAISES_VERTES : 0, 1, 2)
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
    // (dans le jeu du vortex, la caméra ne suit pas le nez qui se tourne seul vers les insectes : elle regarde devant la course)
    const rg = VORTEX ? undefined : regardVoulu()
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
    // (abattu dans le jeu du vortex : la caméra glisse vers le portail, où le compte du retour s'affiche)
    if (VORTEX) {
      versLePortail = m.phase === 'perdu' ? versLePortail + (1 - versLePortail) * Math.min(1, dt * 2.5) : 0
      camera.x *= 1 - versLePortail
      camera.y *= 1 - versLePortail
    }
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
    let p = N.painterFor(frame)
    // (le peintre se place À PARTIR DE L'ORIGINE DE LA FENÊTRE en cours — nulle hors de la base couchée)
    const ancrer = (pe: Peintre): void => {
      const q = pe as unknown as { placeBrute?: (x: number, y: number, f?: boolean, a?: number) => unknown; place: (x: number, y: number, f?: boolean, a?: number) => unknown }
      if (q.placeBrute === undefined) {
        const brute = q.place
        q.placeBrute = brute
        q.place = function (this: unknown, x: number, y: number, f?: boolean, a?: number) {
          return brute.call(this, x + ORIGINE.x, y + ORIGINE.y, f, a)
        }
      }
    }
    ancrer(p)
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
    // LE CHAMP ÉLARGI : LE MONDE SE PEINT DANS SON TAMPON, plus grand — `W`, `H`, `frame` et le champ de la vue sont les
    // siens le temps de le peindre ; l'interface retrouvera les siens ensuite
    const separe = champApplique !== 1
    const interface_ = { frame, W, H }
    if (separe) {
      frame = frameMonde
      W = frame.w
      H = frame.h
      champDeLaVue = champApplique
      N.clearFrame(frame)
      p = N.painterFor(frame)
      ancrer(p)
      for (const e of effets) {
        e.fx.options.x = e.x - camera.x + W / 2
        e.fx.options.y = e.y - camera.y + centreY()
      }
    }
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
    dessinerLesGerbes(p)
    p.place(0, 0)
    if (VORTEX) {
      // LE VORTEX, au centre du monde, sous le vaisseau : il tourne sans fin
      if (vortexFx === null) vortexFx = N.createFx(VORTEX_FX as Module, { x: 0, y: 0, seed: 4 })
      vortexFx.update(dt)
      vortexFx.options.x = -camera.x + W / 2
      vortexFx.options.y = -camera.y + centreY()
      vortexFx.draw(frame)
      N.painterFor(frame)
      dessinerLesTaches(p)
    } else dessinerLesStations(p, separe ? 'monde' : 'tout')
    dessinerLeGivre(p)
    dessinerLesNovas(p)
    dessinerLesFlaques(p)
    dessinerLesMeteoresAuSol(p)
    dessinerLesFlaquesAcides(p)
    dessinerLesMines(p)
    dessinerLesTourelles(p)
    dessinerLesBalises(p)
    dessinerLesEnnemis(p)
    dessinerLesBulles(p)
    dessinerLesOndes(p)
    dessinerLesTentacules(p)
    dessinerLesVrilles(p)
    dessinerLesOeufs(p)
    dessinerLesEclosions(p)
    dessinerLesMiniVers(p)
    dessinerLesEpines(p)
    dessinerLesFleaux(p)
    if ((m.phase === 'vol' && t - arriveA >= ARRIVE_A) || (m.phase === 'extrait' && t - perduA < TELEPORTE_A)) dessinerLeVaisseau(p)
    dessinerLesTirs(p)
    dessinerLesScies(p)
    dessinerLesTornades(p)
    dessinerLePlasma(p)
    dessinerLesMeteores(p)
    dessinerLesEclatsBrises(p)
    dessinerLesNuees(p)
    dessinerLeDrain(p)
    dessinerLesRejetons(p)
    dessinerLesCrachats(p)
    dessinerLesGaz(p)
    dessinerLesParasites(p)
    dessinerLElectricite(p)
    dessinerLesBombes(p)
    dessinerLesLasers(p)
    // (les effets sont dans le monde : ils passent SOUS les bandeaux et l'interface)
    for (const e of effets) e.fx.draw(frame)
    // (un effet laisse le peintre du tampon PLACÉ sur lui, avec son fondu et sa lumière : sans cette remise à neuf — le
    // peintre d'un tampon est unique, `painterFor` le rend remis à zéro —, tant qu'un effet vivait (la matérialisation
    // du départ), les bandeaux et l'interface se dessinaient ancrés au milieu de l'écran : Keko)
    N.painterFor(frame)
    if (separe) {
      // le monde est fini : on le montre, et L'INTERFACE reprend son tampon, à sa taille
      N.composite(frame, imgMonde.data, cuireLeCiel())
      gMonde.putImageData(imgMonde, 0, 0)
      frame = interface_.frame
      W = interface_.W
      H = interface_.H
      champDeLaVue = 1
      p = N.painterFor(frame)
      ancrer(p)
      if (!VORTEX) dessinerLesStations(p, 'texte')
    }
    dessinerLesBords(p)
    dessinerLesBandeaux(p)
    dessinerLAlerte(p)
    dessinerLePointeur(p)
    dessinerLeRadar(p)
    zones = []
    dessinerLeScore(p)
    if (VORTEX) dessinerLInvasion(p)
    if (VORTEX) dessinerLAnnonceDeLaVague(p)
    dessinerLeBanc(p)
    dessinerLaPlaqueDeLaPostcombustion(p)
    dessinerLaCapacite(p)
    dessinerLaSoute(p)
    dessinerLesEclats(p)
    // `&latence` : la latence audio mesurée par l'appareil, en bas à gauche (ce qui se teste doit s'ouvrir d'un lien)
    if (parametres.has('latence')) p.text(`SON ${latenceMs()} MS`, 6, basDuHud() + 8, N.WHITE, { font: 'big', outline: COQUE[0] }) // (en haut à gauche, sous le porté, bien lisible)
    dessinerLeManche(p)
    dessinerLesToasts(dt)
    if (VORTEX) dessinerLeChoixDeTalent(p)
    if (VORTEX) dessinerLaFin(p)
    if (VORTEX) dessinerLaPause(p)
    // (séparée du monde, l'interface est transparente là où elle ne peint rien : le monde est dessous)
    if (separe) N.composite(frame, img.data, null)
    else N.composite(frame, img.data, cuireLeCiel())
    g.putImageData(img, 0, 0)
    secousse = Math.max(0, secousse - dt / 0.25)
    canvas.style.transform = secousse > 0 ? `translate(${(Math.random() - 0.5) * secousse * 8}px, ${(Math.random() - 0.5) * secousse * 8}px)` : ''
    canvasMonde.style.transform = canvas.style.transform
    requestAnimationFrame(image)
  }
  ouvrirLeHangar()
  cadrer()
  // (`&direct`, dans le jeu du vortex : on vole tout de suite, sans accueil ni hangar)
  if (VORTEX && parametres.has('direct')) demarrer()
  // (`&talent=N` : le choix d'un talent s'ouvre d'emblée, avec N choix à faire — pour le voir d'un lien)
  if (VORTEX && parametres.has('talent')) {
    choixDeTalent = ouvrirLeChoix(Math.max(0, (Number(parametres.get('talent')) || 1) - 1))
    talentFinA = 4 + DUREE_DU_CHOIX
    talentA = 4
  }
  new ResizeObserver(cadrer).observe(racine)
  requestAnimationFrame(image)
}

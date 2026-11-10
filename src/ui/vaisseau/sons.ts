// LES SONS DU VAISSEAU. Ils sont COMPOSÉS par `synthe.ts` (Keko, 10/11 : « plus ronds / doux et moins type arcade old
// school, avec une qualité la plus haute possible ») : des sinus, du souffle filtré, une réverbération, en stéréo, à
// la fréquence du contexte — calculés une fois dans un Worker, puis rejoués. LES ANCIENS, ceux de ZzFX (Keko, 10/11 :
// « on peut essayer ZzFX ? » — une ligne de paramètres par son, MIT, de Frank Force), restent derrière `&sons=arcade`,
// pour comparer à l'oreille. Le contexte audio ne naît que sur un geste (`reveiller`), et aucun son ne peut casser le
// jeu : tout passe dans un try. Les réglages sont de moi, MESURÉS (niveaux, spectre) mais pas écoutés : à juger à
// l'oreille.
import { ZZFX } from 'zzfx'
import { NOMS_DES_SONS, synthetiser, variantesDe, type Son } from './synthe.ts'

export type { Son }

/** `&sons=arcade` : les sons d'avant, ceux de ZzFX, et l'ancienne voix de la foreuse. */
const ARCADE = new URLSearchParams(location.search).get('sons') === 'arcade'
/** Le gain des sons composés (ZzFX joue les siens à 0,3) : leurs crêtes sont réglées pour lui, son par son. */
const VOLUME = 0.5

/** Les paramètres ZzFX : volume, hasard, fréquence, attaque, tenue, relâche, forme, courbe, glissé, glissé², saut, temps du saut, répétition, bruit, modulation, écrasement, écho, volume de tenue, déclin, trémolo, filtre. */
type Parametres = (number | undefined)[]

const SONS_ARCADE = {
  /** une roche éclate : un souffle grave et bruité */
  eclat: [0.5, 0.1, 110, 0, 0.05, 0.3, 4, 1, -5, , , , , 1.5],
  /** une pépite monte à bord : un tintement qui saute vers l'aigu */
  ramasse: [0.3, 0, 1200, 0, 0.02, 0.08, 1, 2, , , 300, 0.04],
  /** le canon : un coup sec qui descend */
  canon: [0.4, 0.05, 480, 0, 0.02, 0.09, 1, 1.5, -9, , , , , , , , , 0.6],
  /** la mitrailleuse : un claquement très court */
  rafale: [0.18, 0.05, 820, 0, 0.01, 0.04, 2, 1, -20],
  /** un missile part : un souffle qui monte */
  missiles: [0.35, 0.05, 180, 0.02, 0.1, 0.3, 4, 1, 10, , , , , 1],
  /** un obus touche le rival : un tac métallique */
  ennemiTouche: [0.25, 0.1, 300, 0, 0.01, 0.06, 2, 1, -15],
  /** le rival explose */
  ennemiDetruit: [0.8, 0.1, 80, 0.01, 0.1, 0.6, 4, 0.5, -2, , , , , 2],
  /** un trait du rival perce la coque */
  touche: [0.5, 0.1, 170, 0, 0.03, 0.18, 3, 2, -10, , , , , 1],
  /** le bouclier prend le coup : un ping vitré */
  bouclier: [0.35, 0.05, 640, 0, 0.05, 0.2, 0, 1, , , -200, 0.05],
  /** l'extraction : une montée claire */
  extrait: [0.5, 0, 300, 0.1, 0.3, 0.5, 0, 1, 5, , 400, 0.1, 0.1],
  /** la coque percée : un grondement long */
  perdu: [0.9, 0.1, 60, 0.02, 0.3, 1, 4, 0.5, -1, , , , , 2],
  // LES SONS DE LA BASE (Keko, 10/11 : « très juicy, un bon gamefeel ») — un retour à chaque geste
  /** un bouton : un tic sec et clair */
  clic: [0.22, 0, 950, 0, 0.008, 0.03, 1, 2, , , , , , , , , , 0.5],
  /** un onglet : un blip qui monte */
  onglet: [0.28, 0, 520, 0.005, 0.03, 0.08, 0, 1.5, 9],
  /** le retour, la fermeture : le même blip, qui descend */
  retour: [0.26, 0, 640, 0.005, 0.03, 0.08, 0, 1.5, -9],
  /** « PLUS » s'ouvre : un souffle court qui monte */
  ouvre: [0.22, 0, 300, 0.02, 0.04, 0.1, 0, 1, 14],
  /** un achat : la pièce qui saute, deux fois */
  achat: [0.45, 0, 880, 0, 0.05, 0.28, 1, 1.5, , , 440, 0.06, 0.12],
  /** une pièce équipée : un clac métallique et une montée */
  equipe: [0.5, 0.05, 180, 0, 0.03, 0.22, 3, 1.4, 5, , 300, 0.05],
  /** une vente : des pièces qui tintent */
  vente: [0.4, 0, 1400, 0, 0.03, 0.16, 1, 2, , , 700, 0.05, 0.07],
  /** un bouton éteint qu'on touche : un bourdon bas, battu */
  refus: [0.35, 0, 130, 0, 0.06, 0.12, 2, 1, , , , , 0.04],
  /** le décollage : un grondement qui monte */
  decolle: [0.7, 0.1, 70, 0.05, 0.45, 0.5, 4, 1, 5, , , , , 1.2],
} satisfies Record<Son, Parametres>

/**
 * LE CONTEXTE AU PLUS COURT (Keko : « encore un petit décalage, le son de collision arrive avec une petite latence ») :
 * ZzFX crée son contexte avec la latence par défaut ; on le remplace par un contexte qui demande la plus petite latence
 * que l'appareil accepte (`latencyHint: 0`, en secondes — le navigateur la borne à ce qu'il sait tenir).
 */
try {
  const court = new AudioContext({ latencyHint: 0 })
  const ancien = ZZFX.audioContext
  ZZFX.audioContext = court
  void ancien.close()
} catch {
  // on garde le contexte de ZzFX
}

/** La latence de sortie mesurée par le navigateur, en millisecondes (`&latence` l'affiche en vol). */
export function latenceMs(): number {
  try {
    const ctx = ZZFX.audioContext
    return Math.round(((ctx.baseLatency ?? 0) + ((ctx as AudioContext & { outputLatency?: number }).outputLatency ?? 0)) * 1000)
  } catch {
    return -1
  }
}
/**
 * LES TAMPONS PRÊTS (Keko : « une légère latence sur les sons ») : jouer ne fait que brancher une source sur un
 * tampon déjà calculé. Les sons composés coûtent plus cher qu'une ligne de ZzFX (jusqu'à 80 ms pour les plus longs,
 * sur le PC) : ils se calculent DANS UN WORKER, dès l'ouverture de la page, la base d'abord — le fil principal ne
 * fait que les ranger. Un son demandé avant d'être prêt se calcule sur place, une fois ; si le Worker manque, ils se
 * préparent un par un, entre deux images.
 */
const tampons = new Map<string, AudioBuffer>()
function ranger(son: Son, variante: number, g: Float32Array, d: Float32Array): AudioBuffer {
  const ctx = ZZFX.audioContext
  const b = ctx.createBuffer(2, g.length, ctx.sampleRate)
  b.getChannelData(0).set(g)
  b.getChannelData(1).set(d)
  tampons.set(`${son}:${variante}`, b)
  return b
}
function tampon(son: Son, variante: number): AudioBuffer {
  const pret = tampons.get(`${son}:${variante}`)
  if (pret !== undefined) return pret
  if (ARCADE) {
    const echantillons = ZZFX.buildSamples(...(SONS_ARCADE[son] as Parametres)) as number[]
    const b = ZZFX.audioContext.createBuffer(1, echantillons.length, ZZFX.sampleRate)
    b.getChannelData(0).set(echantillons)
    tampons.set(`${son}:${variante}`, b)
    return b
  }
  const { g, d } = synthetiser(son, ZZFX.audioContext.sampleRate, variante)
  return ranger(son, variante, g, d)
}
/** Sans Worker : un son par tour de boucle, pour ne jamais tenir le fil plus que le temps d'un son. */
function preparerUnParUn(): void {
  const reste = NOMS_DES_SONS.flatMap((son) => Array.from({ length: variantesDe(son) }, (_, v) => [son, v] as const)).filter(([son, v]) => !tampons.has(`${son}:${v}`))
  if (reste.length === 0) return
  try {
    tampon(...reste[0])
  } catch {
    return
  }
  setTimeout(preparerUnParUn, 30)
}
if (!ARCADE) {
  try {
    const travailleur = new Worker(new URL('./synthe.worker.ts', import.meta.url), { type: 'module' })
    travailleur.onmessage = (e: MessageEvent<{ son: Son; variante: number; g: Float32Array; d: Float32Array }>): void => {
      try {
        if (!tampons.has(`${e.data.son}:${e.data.variante}`)) ranger(e.data.son, e.data.variante, e.data.g, e.data.d)
      } catch {
        // ce son se calculera à sa première lecture
      }
    }
    travailleur.onerror = preparerUnParUn
    travailleur.postMessage({ sr: ZZFX.audioContext.sampleRate })
  } catch {
    preparerUnParUn()
  }
}
let prepares = false

/** Réveille le contexte audio : à appeler dans un geste (le navigateur n'en joue pas avant). */
export function reveiller(): void {
  try {
    if (ZZFX.audioContext.state !== 'running') void ZZFX.audioContext.resume()
    // les sons de ZzFX : tous les tampons d'un coup, au premier geste (quelques millisecondes)
    if (ARCADE && !prepares) {
      prepares = true
      for (const son of NOMS_DES_SONS) tampon(son, 0)
    }
  } catch {
    // sans audio, on joue en silence
  }
}

/**
 * LES VARIANTES : un son très répété (la pépite, la mitrailleuse) a plusieurs tampons, joués à la suite — la pépite
 * monte d'un cran à chaque prise et repart du bas après un silence. (Pas de `playbackRate` : l'appareil de Keko ne
 * sait pas piloter la vitesse de lecture.)
 */
const tours = new Map<Son, { v: number; t: number }>()
function varianteSuivante(son: Son, t: number): number {
  const n = ARCADE ? 1 : variantesDe(son)
  if (n === 1) return 0
  const dernier = tours.get(son)
  const v = dernier === undefined || t - dernier.t > 1.2 ? 0 : (dernier.v + 1) % n
  tours.set(son, { v, t })
  return v
}

/** À cette distance du vaisseau, un son ne s'entend plus (unités du monde : un peu plus que la demi-hauteur de l'écran). */
const PORTEE = 320

/**
 * Joue un son (rien si le contexte dort encore). LE SON DANS L'ESPACE (Keko : « j'entends l'ennemi détruire des
 * rochers comme si j'étais à côté ») : passé `ou`, l'écart au vaisseau, le volume tombe avec la distance (au carré,
 * muet à `PORTEE`) et le son glisse à gauche ou à droite selon l'écart horizontal.
 */
export function jouer(son: Son, ou?: { dx: number; dy: number }): void {
  try {
    if (ZZFX.audioContext.state !== 'running') return
    let volume = 1
    let pan = 0
    if (ou !== undefined) {
      const d = Math.hypot(ou.dx, ou.dy)
      if (d >= PORTEE) return
      volume = (1 - d / PORTEE) ** 2
      pan = Math.max(-1, Math.min(1, ou.dx / 160))
    }
    const ctx = ZZFX.audioContext
    const source = ctx.createBufferSource()
    source.buffer = tampon(son, varianteSuivante(son, ctx.currentTime))
    const gain = ctx.createGain()
    gain.gain.value = (ARCADE ? ZZFX.volume : VOLUME) * volume
    source.connect(new StereoPannerNode(ctx, { pan })).connect(gain).connect(ctx.destination)
    source.start()
  } catch {
    // un son raté ne casse rien
  }
}

/**
 * LES SONS CONTINUS (Keko : « un son pour la foreuse, et un bruit de propulsion quand on avance ») : deux voix qui
 * tournent en permanence, muettes, dont on règle le volume à chaque image — LE PROPULSEUR, un souffle (du bruit
 * filtré bas, qui s'ouvre et monte avec la poussée), LA FOREUSE, un bourdon (voir `voixDeForage`). Elles naissent au premier réglage après le réveil du contexte ; le volume
 * glisse (`setTargetAtTime`) pour ne jamais claquer.
 */
type Voix = { gain: GainNode; filtre?: BiquadFilterNode }
let propulsion: Voix | null = null
let forage: Voix | null = null

function voixDePropulsion(ctx: AudioContext): Voix {
  // une seconde de bruit blanc, en boucle
  const b = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate)
  const d = b.getChannelData(0)
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1
  const bruit = ctx.createBufferSource()
  bruit.buffer = b
  bruit.loop = true
  const filtre = ctx.createBiquadFilter()
  filtre.type = 'lowpass'
  filtre.frequency.value = 300
  const gain = ctx.createGain()
  gain.gain.value = 0
  bruit.connect(filtre).connect(gain).connect(ctx.destination)
  bruit.start()
  return { gain, filtre }
}

/**
 * LA FOREUSE, UN BOURDON ROND : les huit premiers harmoniques de 74 Hz EN SINUS (le deuxième devant : un petit
 * haut-parleur ne rend pas le fondamental), deux oscillateurs à quatre cents d'écart qui se battent lentement, un
 * passe-bas à 700 Hz, un trémolo à 14 Hz qui ronronne. L'ancienne (`&sons=arcade`) grinçait : une dent de scie et un
 * carré, battus à 22 Hz.
 */
const HARMONIQUES_DE_LA_FOREUSE = [0.5, 1, 0.7, 0.5, 0.25, 0.3, 0.1, 0.12]
function voixDeForage(ctx: AudioContext): Voix {
  const filtre = ctx.createBiquadFilter()
  filtre.type = 'lowpass'
  filtre.frequency.value = ARCADE ? 900 : 700
  const tremolo = ctx.createGain()
  tremolo.gain.value = ARCADE ? 0.6 : 0.75
  const lfo = ctx.createOscillator()
  lfo.frequency.value = ARCADE ? 22 : 14
  const profondeur = ctx.createGain()
  profondeur.gain.value = ARCADE ? 0.4 : 0.25
  lfo.connect(profondeur).connect(tremolo.gain)
  const gain = ctx.createGain()
  gain.gain.value = 0
  if (ARCADE) {
    for (const [type, f, v] of [['sawtooth', 74, 0.5], ['square', 149, 0.25]] as const) {
      const o = ctx.createOscillator()
      o.type = type
      o.frequency.value = f
      const g = ctx.createGain()
      g.gain.value = v
      o.connect(g).connect(filtre)
      o.start()
    }
  } else {
    const onde = ctx.createPeriodicWave(new Float32Array(HARMONIQUES_DE_LA_FOREUSE.length + 1), Float32Array.from([0, ...HARMONIQUES_DE_LA_FOREUSE]))
    for (const cents of [0, 4]) {
      const o = ctx.createOscillator()
      o.setPeriodicWave(onde)
      o.frequency.value = 74
      o.detune.value = cents
      const g = ctx.createGain()
      g.gain.value = 0.5
      o.connect(g).connect(filtre)
      o.start()
    }
  }
  filtre.connect(tremolo).connect(gain).connect(ctx.destination)
  lfo.start()
  return { gain, filtre }
}

/** Règle les sons continus, à chaque image : la poussée du vaisseau (0 à 1), et si la foreuse creuse. */
export function regler(poussee: number, creuse: boolean): void {
  try {
    const ctx = ZZFX.audioContext
    if (ctx.state !== 'running') return
    if (propulsion === null && poussee > 0.02) propulsion = voixDePropulsion(ctx)
    if (forage === null && creuse) forage = voixDeForage(ctx)
    const t = ctx.currentTime
    if (propulsion !== null) {
      propulsion.gain.gain.setTargetAtTime(ZZFX.volume * 0.1 * poussee, t, 0.05) // (0,55 puis 0,35 puis 0,15 : trop fort — Keko : « un son quasi permanent, il doit être discret »)
      propulsion.filtre!.frequency.setTargetAtTime(250 + 650 * poussee, t, 0.08)
    }
    if (forage !== null) forage.gain.gain.setTargetAtTime(creuse ? ZZFX.volume * (ARCADE ? 0.28 : 0.38) : 0, t, 0.04) // (0,18 avant : Keko la veut plus forte ; 0,38 : le bourdon rond, au même niveau mesuré que l'ancien à 0,28)
  } catch {
    // un son raté ne casse rien
  }
}

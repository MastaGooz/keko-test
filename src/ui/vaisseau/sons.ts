// LES SONS DU VAISSEAU, synthétisés par ZzFX (Keko, 10/11 : « on peut essayer ZzFX ? » — la seconde dépendance de code
// après pixelfx, MIT, de Frank Force) : chaque son est une ligne de paramètres, ses échantillons sont calculés UNE
// fois, à la première lecture, puis rejoués. Le contexte audio ne naît que sur un geste (`reveiller`), et aucun son ne
// peut casser le jeu : tout passe dans un try. Les réglages sont de moi, à juger à l'oreille (l'éditeur de ZzFX,
// https://killedbyapixel.github.io/ZzFX/, relit une ligne telle quelle).
import { ZZFX } from 'zzfx'

/** Les paramètres ZzFX : volume, hasard, fréquence, attaque, tenue, relâche, forme, courbe, glissé, glissé², saut, temps du saut, répétition, bruit, modulation, écrasement, écho, volume de tenue, déclin, trémolo, filtre. */
type Parametres = (number | undefined)[]

const SONS = {
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
} satisfies Record<string, Parametres>

export type Son = keyof typeof SONS

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
 * LES TAMPONS PRÊTS (Keko : « une légère latence sur les sons ») : chaque son est calculé et copié dans un AudioBuffer
 * UNE fois, dès le réveil du contexte, pas à sa première lecture ; jouer ne fait plus que brancher une source sur ce
 * tampon (ZzFX recréait et recopiait le tampon à chaque coup).
 */
const tampons = new Map<Son, AudioBuffer>()
function tampon(son: Son): AudioBuffer {
  let b = tampons.get(son)
  if (b === undefined) {
    const echantillons = ZZFX.buildSamples(...(SONS[son] as Parametres)) as number[]
    b = ZZFX.audioContext.createBuffer(1, echantillons.length, ZZFX.sampleRate)
    b.getChannelData(0).set(echantillons)
    tampons.set(son, b)
  }
  return b
}
let prepares = false

/** Réveille le contexte audio : à appeler dans un geste (le navigateur n'en joue pas avant). */
export function reveiller(): void {
  try {
    if (ZZFX.audioContext.state !== 'running') void ZZFX.audioContext.resume()
    // tous les tampons d'un coup, au premier geste (quelques millisecondes) : aucun son ne se calcule plus en jeu
    if (!prepares) {
      prepares = true
      for (const son of Object.keys(SONS) as Son[]) tampon(son)
    }
  } catch {
    // sans audio, on joue en silence
  }
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
    source.buffer = tampon(son)
    const gain = ctx.createGain()
    gain.gain.value = ZZFX.volume * volume
    source.connect(new StereoPannerNode(ctx, { pan })).connect(gain).connect(ctx.destination)
    source.start()
  } catch {
    // un son raté ne casse rien
  }
}

/**
 * LES SONS CONTINUS (Keko : « un son pour la foreuse, et un bruit de propulsion quand on avance ») : deux voix qui
 * tournent en permanence, muettes, dont on règle le volume à chaque image — LE PROPULSEUR, un souffle (du bruit
 * filtré bas, qui s'ouvre et monte avec la poussée), LA FOREUSE, un bourdonnement grinçant (deux oscillateurs graves,
 * filtrés, battus par un trémolo rapide). Elles naissent au premier réglage après le réveil du contexte ; le volume
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

function voixDeForage(ctx: AudioContext): Voix {
  const filtre = ctx.createBiquadFilter()
  filtre.type = 'lowpass'
  filtre.frequency.value = 900
  const tremolo = ctx.createGain()
  tremolo.gain.value = 0.6
  const lfo = ctx.createOscillator()
  lfo.frequency.value = 22
  const profondeur = ctx.createGain()
  profondeur.gain.value = 0.4
  lfo.connect(profondeur).connect(tremolo.gain)
  const gain = ctx.createGain()
  gain.gain.value = 0
  for (const [type, f, v] of [['sawtooth', 74, 0.5], ['square', 149, 0.25]] as const) {
    const o = ctx.createOscillator()
    o.type = type
    o.frequency.value = f
    const g = ctx.createGain()
    g.gain.value = v
    o.connect(g).connect(filtre)
    o.start()
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
    if (forage !== null) forage.gain.gain.setTargetAtTime(creuse ? ZZFX.volume * 0.28 : 0, t, 0.04) // (0,18 avant : Keko la veut plus forte)
  } catch {
    // un son raté ne casse rien
  }
}

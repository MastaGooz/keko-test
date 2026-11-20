// LES SONS DU VAISSEAU. Ils sont COMPOSÉS par `synthe.ts` (Keko, 10/11 : « plus ronds / doux et moins type arcade old
// school, avec une qualité la plus haute possible ») : des sinus, du souffle filtré, une réverbération, en stéréo, à
// la fréquence du contexte — calculés une fois dans un Worker, puis rejoués. LES ANCIENS, ceux de ZzFX (Keko, 10/11 :
// « on peut essayer ZzFX ? » — une ligne de paramètres par son, MIT, de Frank Force), restent derrière `&sons=arcade`,
// pour comparer à l'oreille. Le contexte audio ne naît que sur un geste (`reveiller`), et aucun son ne peut casser le
// jeu : tout passe dans un try. Les réglages sont de moi, MESURÉS (niveaux, spectre) mais pas écoutés : à juger à
// l'oreille.
import { ZZFX } from 'zzfx'
import { ECLOSION_DE_L_ARRIVEE, NOMS_DES_SONS, synthetiser, variantesDe, type Son } from './synthe.ts'

export type { Son }
export { ECLOSION_DE_L_ARRIVEE }

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
} satisfies Partial<Record<Son, Parametres>>
/** La ligne ZzFX d'un son, s'il en avait une : les sons nés après le synthé (l'arrivée) n'en ont pas, et restent composés. */
function ancienDe(son: Son): Parametres | undefined {
  return ARCADE ? (SONS_ARCADE as Partial<Record<Son, Parametres>>)[son] : undefined
}

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
  const ancien = ancienDe(son)
  if (ancien !== undefined) {
    const echantillons = ZZFX.buildSamples(...ancien) as number[]
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
 * muet à `PORTEE`) et le son glisse à gauche ou à droite selon l'écart horizontal. `dans` : le son part dans tant de
 * secondes, sur l'horloge audio (pour tomber sur une image qui n'est pas encore là).
 */
export function jouer(son: Son, ou?: { dx: number; dy: number }, dans = 0): void {
  try {
    // LE SON DU GESTE QUI RÉVEILLE (Keko : « je clique sur l'écran d'accueil, puis sur Décoller, et je n'ai aucun son
    // au décollage ») : `resume()` ne rend le contexte que quelques millisecondes plus tard — le son demandé dans le
    // même geste trouvait le contexte endormi et se taisait. Il ATTEND maintenant le réveil, et part s'il arrive dans
    // les 400 ms (au-delà, le geste est passé : on ne lâche pas une salve de vieux sons au premier réveil venu).
    if (ZZFX.audioContext.state !== 'running') {
      const demande = performance.now()
      void ZZFX.audioContext.resume().then(() => {
        if (performance.now() - demande < 400 && ZZFX.audioContext.state === 'running') jouer(son, ou, dans)
      }).catch(() => undefined)
      return
    }
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
    gain.gain.value = (ancienDe(son) === undefined ? VOLUME : ZZFX.volume) * volume
    source.connect(new StereoPannerNode(ctx, { pan })).connect(gain).connect(ctx.destination)
    source.start(ctx.currentTime + dans)
  } catch {
    // un son raté ne casse rien
  }
}

/**
 * LES SONS CONTINUS (Keko : « un son pour la foreuse, et un bruit de propulsion quand on avance ») : deux voix qui
 * tournent en permanence, muettes, dont on règle le volume à chaque image — LE PROPULSEUR, un souffle (du bruit
 * filtré bas, qui s'ouvre et monte avec la poussée), LA FOREUSE, un bourdon (voir `voixDeForage`). Elles naissent au premier réglage après le réveil du contexte ; le volume
 * glisse (`setTargetAtTime`) pour ne jamais claquer. Et LA CHARGE de l'extraction (voir `voixDeCharge`), et LE LANCE-FLAMMES (voir `voixDeFlamme`).
 */
type Voix = { gain: GainNode; filtre?: BiquadFilterNode; notes?: OscillatorNode[]; lfo?: OscillatorNode }
/**
 * LA VOIX DU PROPULSEUR, SELON LE VAISSEAU (Keko, 16/11 : « au Léviathan et à la Vouivre, un son plus biologique et gazeux
 * en déplacement ; le Néant, un son plus science-fiction, vibrant, très grave, un peu dimensionnel ») : le SOUFFLE de
 * toujours ; la BÊTE, un gargouillis de gaz ; le NÉANT, un bourdon grave qui bat. Une voix par genre, née au besoin ;
 * celles des autres genres se taisent.
 */
export type GenreDePropulsion = 'souffle' | 'bete' | 'neant' | 'ethere'
const propulsions = new Map<GenreDePropulsion, Voix>()
let propulsion: Voix | null = null
let forage: Voix | null = null
let charge: (Voix & { notes: OscillatorNode[]; lfo: OscillatorNode }) | null = null
let chargeMuette = true
let flamme: Voix | null = null
let bourdon: Voix | null = null

/**
 * LA NUÉE, UN BOURDONNEMENT CONTINU (Keko, 20/11 : « change le bruit de l'essaim, c'est un peu bizarre ; pas un son par
 * à-coups : un genre de bourdonnement léger mais continu, qui s'intensifie un petit peu quand l'essaim attaque » — c'était
 * le grincement de la morsure, rejoué à chaque morsure) : cinq ailes, des dents de scie entre 180 et 236 Hz qui ne
 * s'accordent jamais (elles battent entre elles), chacune tremblant de quelques hertz à son rythme ; un passe-bande vers
 * 900 Hz qui en garde le froissement ; un battement d'ailes à 24 Hz, à peine. Au repos, à peine audible ; quand l'essaim
 * mord, plus fort (0,075 puis 0,09 — Keko, 20/11 : « monte très légèrement le bruit de l'essaim quand il attaque »), plus
 * haut, plus clair ; il grossit un peu avec l'essaim.
 */
const AILES_DE_LA_NUEE = [180, 191, 203, 219, 236]
function voixDeLaNuee(ctx: AudioContext): Voix {
  const filtre = ctx.createBiquadFilter()
  filtre.type = 'bandpass'
  filtre.frequency.value = 900
  filtre.Q.value = 0.8
  const battement = ctx.createGain()
  battement.gain.value = 0.85
  const lfo = ctx.createOscillator()
  lfo.frequency.value = 24
  const profondeur = ctx.createGain()
  profondeur.gain.value = 0.15
  lfo.connect(profondeur).connect(battement.gain)
  const gain = ctx.createGain()
  gain.gain.value = 0
  const notes = AILES_DE_LA_NUEE.map((f, k) => {
    const o = ctx.createOscillator()
    o.type = 'sawtooth'
    o.frequency.value = f
    // (chaque aile tremble à son rythme : quelques hertz, 5 à 9 fois par seconde)
    const vib = ctx.createOscillator()
    vib.frequency.value = 5 + k
    const ampleur = ctx.createGain()
    ampleur.gain.value = 3 + k
    vib.connect(ampleur).connect(o.frequency)
    vib.start()
    const g = ctx.createGain()
    g.gain.value = 0.2
    o.connect(g).connect(filtre)
    o.start()
    ;(o as OscillatorNode & { rapport?: number }).rapport = f / AILES_DE_LA_NUEE[0]
    return o
  })
  filtre.connect(battement).connect(gain).connect(ctx.destination)
  lfo.start()
  return { gain, filtre, notes, lfo }
}

/**
 * LE LANCE-FLAMMES, UNE VOIX CONTINUE (Keko, 15/11 : « le bruit est un peu bizarre, il faudrait un bruit continu, là on
 * dirait un bruit par à-coups » — c'était un son court, rejoué) : un SOUFFLE grave (du bruit en boucle, passe-bas
 * ~700 Hz, qui flotte un peu) et, dessus, un CRÉPITEMENT (une seconde de petits claquements semés au hasard, en
 * boucle, passe-haut) ; le volume monte vite quand il crache, retombe un peu moins vite.
 */
function voixDeFlamme(ctx: AudioContext): Voix {
  const n = ctx.sampleRate
  const b = ctx.createBuffer(1, n, n)
  const d = b.getChannelData(0)
  for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1
  const souffle = ctx.createBufferSource()
  souffle.buffer = b
  souffle.loop = true
  const filtre = ctx.createBiquadFilter()
  filtre.type = 'lowpass'
  filtre.frequency.value = 700
  filtre.Q.value = 0.8
  // (il flotte : une ondulation lente du passe-bas)
  const lfo = ctx.createOscillator()
  lfo.frequency.value = 7
  const profondeur = ctx.createGain()
  profondeur.gain.value = 160
  lfo.connect(profondeur).connect(filtre.frequency)
  const cb = ctx.createBuffer(1, n, n)
  const c = cb.getChannelData(0)
  for (let k = 0; k < 90; k++) {
    const at = Math.floor(Math.random() * (n - 400))
    const fort = 0.3 + 0.7 * Math.random()
    for (let i = 0; i < 300; i++) c[at + i] += (Math.random() * 2 - 1) * fort * Math.exp(-i / 50)
  }
  const crepite = ctx.createBufferSource()
  crepite.buffer = cb
  crepite.loop = true
  const aigu = ctx.createBiquadFilter()
  aigu.type = 'highpass'
  aigu.frequency.value = 1800
  const gCrepite = ctx.createGain()
  gCrepite.gain.value = 0.5
  const gain = ctx.createGain()
  gain.gain.value = 0
  souffle.connect(filtre).connect(gain)
  crepite.connect(aigu).connect(gCrepite).connect(gain)
  gain.connect(ctx.destination)
  souffle.start()
  crepite.start()
  lfo.start()
  return { gain, filtre }
}

/**
 * LA BÊTE : un FOND DE GAZ continu — du bruit dans un passe-bande qui ondule doucement (3,7 et 1,3 Hz), sans à-coups, et un
 * peu de bruit grave —, et par-dessus, semées par `regler`, DE PETITES BULLES (voir `bulle`) : celles de son décollage, en
 * plus discret, en continu. (Le volume était d'abord HACHÉ à 9 Hz — Keko, 16/11 : « un bruit par à-coups, au lieu de
 * quelque chose de continu ; j'aime bien le petit bruit de bulle du décollage : en vol, ce petit bruit, plus discret et
 * permanent ».)
 */
function voixDeBete(ctx: AudioContext): Voix {
  const b = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate)
  const d = b.getChannelData(0)
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1
  const bruit = ctx.createBufferSource()
  bruit.buffer = b
  bruit.loop = true
  const filtre = ctx.createBiquadFilter()
  filtre.type = 'bandpass'
  filtre.frequency.value = 420
  filtre.Q.value = 3.2
  const ondule = ctx.createOscillator()
  ondule.frequency.value = 3.7
  const ampOndule = ctx.createGain()
  ampOndule.gain.value = 160
  ondule.connect(ampOndule).connect(filtre.frequency)
  const ondule2 = ctx.createOscillator()
  ondule2.frequency.value = 1.3
  const ampOndule2 = ctx.createGain()
  ampOndule2.gain.value = 110
  ondule2.connect(ampOndule2).connect(filtre.frequency)
  const hache = ctx.createGain()
  hache.gain.value = 0.5
  const grave = ctx.createBiquadFilter()
  grave.type = 'lowpass'
  grave.frequency.value = 220
  const gainGrave = ctx.createGain()
  gainGrave.gain.value = 0.5
  const gain = ctx.createGain()
  gain.gain.value = 0
  bruit.connect(filtre).connect(hache).connect(gain)
  bruit.connect(grave).connect(gainGrave).connect(gain)
  gain.connect(ctx.destination)
  bruit.start()
  ondule.start()
  ondule2.start()
  return { gain, filtre }
}

/** UNE PETITE BULLE de la bête : un sinus bref qui grimpe d'une octave (un « bloup »), posé sur l'horloge audio, vite éteint. */
let prochaineBulle = 0
function bulle(ctx: AudioContext, quand: number, volume: number): void {
  const o = ctx.createOscillator()
  const f = 190 + 420 * Math.random()
  o.frequency.setValueAtTime(f, quand)
  o.frequency.exponentialRampToValueAtTime(f * 2.1, quand + 0.045)
  const g = ctx.createGain()
  g.gain.setValueAtTime(0.0001, quand)
  g.gain.exponentialRampToValueAtTime(volume, quand + 0.004)
  g.gain.exponentialRampToValueAtTime(0.0001, quand + 0.06 + 0.04 * Math.random())
  o.connect(g).connect(new StereoPannerNode(ctx, { pan: (Math.random() - 0.5) * 0.8 })).connect(ctx.destination)
  o.start(quand)
  o.stop(quand + 0.12)
}

/**
 * LE NÉANT : deux dents de scie à 41 et 41,7 Hz (elles battent), une troisième à l'octave, dans un passe-bas qui respire
 * lentement (0,23 Hz : le son « tourne », dimensionnel) ; un trémolo de 6 Hz le fait vibrer. Très grave : ses harmoniques
 * le portent jusqu'à un petit haut-parleur.
 */
function voixDuNeant(ctx: AudioContext): Voix {
  const filtre = ctx.createBiquadFilter()
  filtre.type = 'lowpass'
  filtre.frequency.value = 260
  filtre.Q.value = 5
  const respire = ctx.createOscillator()
  respire.frequency.value = 0.23
  const ampRespire = ctx.createGain()
  ampRespire.gain.value = 90
  respire.connect(ampRespire).connect(filtre.frequency)
  const vibre = ctx.createGain()
  vibre.gain.value = 0.65
  const tremolo = ctx.createOscillator()
  tremolo.frequency.value = 6
  const ampTremolo = ctx.createGain()
  ampTremolo.gain.value = 0.35
  tremolo.connect(ampTremolo).connect(vibre.gain)
  for (const [f, niv] of [[41, 0.5], [41.7, 0.5], [82.3, 0.28]] as [number, number][]) {
    const o = ctx.createOscillator()
    o.type = 'sawtooth'
    o.frequency.value = f
    const g = ctx.createGain()
    g.gain.value = niv
    o.connect(g).connect(filtre)
    o.start()
  }
  const gain = ctx.createGain()
  gain.gain.value = 0
  filtre.connect(vibre).connect(gain).connect(ctx.destination)
  respire.start()
  tremolo.start()
  return { gain, filtre }
}

/**
 * LES VECTRANS (Keko, 19/11 : « un son de propulsion différent pour les éthérés ; d'une technologie différente » — ils
 * soufflaient comme les humains) — PUIS UNE ONDE D'ÉNERGIE (Keko, 19/11 : « des petits sons aigus, un peu de glace, pas
 * très joli ; une onde un peu énergétique ; pareil pour le son en vol ») : plus de bourdon cristallin ni de sifflement
 * d'ions — UN BOURDON GRAVE ET ROND (un sinus à 82 Hz, sa quinte, une dent de scie à l'octave pour qu'un petit
 * haut-parleur l'entende), dans un passe-bas résonant qui ONDULE (0,7 Hz) ; et il BAT PAR PULSATIONS, des vagues
 * d'énergie, de 3 par seconde à l'arrêt à 7 à pleine poussée ; avec la poussée, il monte d'une quarte et s'ouvre.
 * SES NIVEAUX, CALCULÉS CONTRE LE SOUFFLE (pas écoutés) : à ces niveaux, la valeur efficace du bourdon est d'environ 0,18,
 * et les pulsations la ramènent vers 0,12 en moyenne — celle d'un bruit blanc passé sous 900 Hz.
 */
const BASE_ETHERE = 82.4
function voixDesEtheres(ctx: AudioContext): Voix {
  const filtre = ctx.createBiquadFilter()
  filtre.type = 'lowpass'
  filtre.frequency.value = 600
  filtre.Q.value = 6
  // (le filtre ondule : la vague)
  const ondule = ctx.createOscillator()
  ondule.frequency.value = 0.7
  const ampOndule = ctx.createGain()
  ampOndule.gain.value = 220
  ondule.connect(ampOndule).connect(filtre.frequency)
  const notes: OscillatorNode[] = []
  for (const [rapport, niv, type] of [[1, 0.25, 'sine'], [1.5, 0.12, 'sine'], [2, 0.06, 'sawtooth']] as [number, number, OscillatorType][]) {
    const o = ctx.createOscillator()
    o.type = type
    o.frequency.value = BASE_ETHERE * rapport
    ;(o as OscillatorNode & { rapport?: number }).rapport = rapport
    const g = ctx.createGain()
    g.gain.value = niv
    o.connect(g).connect(filtre)
    o.start()
    notes.push(o)
  }
  // (les pulsations : le volume bat, de 0,3 à 1)
  const pulse = ctx.createGain()
  pulse.gain.value = 0.65
  const lfo = ctx.createOscillator()
  lfo.frequency.value = 3
  const ampLfo = ctx.createGain()
  ampLfo.gain.value = 0.35
  lfo.connect(ampLfo).connect(pulse.gain)
  const gain = ctx.createGain()
  gain.gain.value = 0
  filtre.connect(pulse).connect(gain).connect(ctx.destination)
  ondule.start()
  lfo.start()
  return { gain, filtre, notes, lfo }
}

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

/**
 * LA CHARGE DE L'EXTRACTION (Keko : « quand l'extracteur se charge, quand le joueur est dedans et que le cercle se
 * remplit ») : une note ronde qui MONTE avec l'arc d'or — des harmoniques en sinus, le deuxième devant, deux
 * oscillateurs à cinq cents d'écart. Du début à la fin du compte elle monte d'une octave (ré3 → ré4 : elle arrive sur
 * la nappe et la première clochette du son de l'extraction, qui prend sa suite), son passe-bas s'ouvre, son trémolo
 * presse le pas, son volume enfle. Hors du parvis, le compte redescend : la note redescend avec lui, à mi-voix.
 * Niveau calculé contre la foreuse (voir docs/vaisseau.md).
 */
const HARMONIQUES_DE_LA_CHARGE = [0.5, 1, 0.6, 0.35, 0.15, 0.1]
const RE3 = 146.83
function voixDeCharge(ctx: AudioContext): NonNullable<typeof charge> {
  const filtre = ctx.createBiquadFilter()
  filtre.type = 'lowpass'
  filtre.frequency.value = 600
  const tremolo = ctx.createGain()
  tremolo.gain.value = 0.8
  const lfo = ctx.createOscillator()
  lfo.frequency.value = 3
  const profondeur = ctx.createGain()
  profondeur.gain.value = 0.2
  lfo.connect(profondeur).connect(tremolo.gain)
  const gain = ctx.createGain()
  gain.gain.value = 0
  const onde = ctx.createPeriodicWave(new Float32Array(HARMONIQUES_DE_LA_CHARGE.length + 1), Float32Array.from([0, ...HARMONIQUES_DE_LA_CHARGE]))
  const notes = [0, 5].map((cents) => {
    const o = ctx.createOscillator()
    o.setPeriodicWave(onde)
    o.frequency.value = RE3
    o.detune.value = cents
    const g = ctx.createGain()
    g.gain.value = 0.5
    o.connect(g).connect(filtre)
    o.start()
    return o
  })
  filtre.connect(tremolo).connect(gain).connect(ctx.destination)
  lfo.start()
  return { gain, filtre, notes, lfo }
}

/**
 * Règle les sons continus, à chaque image : la poussée du vaisseau (0 à 1), si la foreuse creuse, où en est le compte
 * de l'extraction (`compte`, de 0 à 1) et s'il monte (à quai) ou redescend (hors du parvis).
 */
export function regler(poussee: number, creuse: boolean, compte: number, monte: boolean, crache = false, genre: GenreDePropulsion = 'souffle', nuee: { taille: number; mord: boolean } | null = null): void {
  try {
    const ctx = ZZFX.audioContext
    if (ctx.state !== 'running') return
    // (le genre du vaisseau : sa voix, née au besoin ; les autres se taisent — `&sons=arcade` garde le souffle)
    const g = ARCADE ? 'souffle' : genre
    if (!propulsions.has(g) && poussee > 0.02) propulsions.set(g, g === 'bete' ? voixDeBete(ctx) : g === 'neant' ? voixDuNeant(ctx) : g === 'ethere' ? voixDesEtheres(ctx) : voixDePropulsion(ctx))
    for (const [autre, vx] of propulsions) if (autre !== g) vx.gain.gain.setTargetAtTime(0, ctx.currentTime, 0.05)
    propulsion = propulsions.get(g) ?? null
    if (forage === null && creuse) forage = voixDeForage(ctx)
    if (charge === null && compte > 0) charge = voixDeCharge(ctx)
    if (flamme === null && crache) flamme = voixDeFlamme(ctx)
    if (bourdon === null && nuee !== null) bourdon = voixDeLaNuee(ctx)
    const t = ctx.currentTime
    // (la nuée : à peine au repos, un peu plus quand elle mord, et avec sa taille ; elle se tait sans nuée)
    if (bourdon !== null) {
      const fort = nuee === null ? 0 : (nuee.mord ? 0.09 : 0.035) * (1 + 0.4 * nuee.taille)
      bourdon.gain.gain.setTargetAtTime(ZZFX.volume * fort, t, nuee?.mord === true ? 0.08 : 0.25)
      bourdon.filtre!.frequency.setTargetAtTime(nuee?.mord === true ? 1300 : 850, t, 0.15)
      for (const o of bourdon.notes ?? []) o.frequency.setTargetAtTime(AILES_DE_LA_NUEE[0] * ((o as OscillatorNode & { rapport?: number }).rapport ?? 1) * (nuee?.mord === true ? 1.12 : 1), t, 0.2)
    }
    if (flamme !== null) flamme.gain.gain.setTargetAtTime(crache ? ZZFX.volume * 0.38 : 0, t, crache ? 0.03 : 0.07) // (0,5 d'abord — Keko, 15/11 : « un tout petit peu moins fort »)
    if (propulsion !== null) {
      if (g === 'bete') {
        // (le fond de gaz, discret ; et les bulles, de 5 à 13 par seconde selon la poussée, au hasard, à peine)
        propulsion.gain.gain.setTargetAtTime(ZZFX.volume * 0.07 * poussee, t, 0.05)
        propulsion.filtre!.frequency.setTargetAtTime(320 + 380 * poussee, t, 0.1)
        if (poussee > 0.05) {
          if (prochaineBulle < t) prochaineBulle = t + 0.02
          while (prochaineBulle < t + 0.1) {
            bulle(ctx, prochaineBulle, ZZFX.volume * 0.05 * (0.5 + 0.5 * poussee))
            prochaineBulle += (0.4 + 1.2 * Math.random()) / (5 + 8 * poussee)
          }
        }
      } else if (g === 'neant') {
        // (le bourdon, grave : 0,22 d'abord — Keko, 16/11 : « réduis le volume du son que fait la propulsion du Néant en vol »)
        propulsion.gain.gain.setTargetAtTime(ZZFX.volume * 0.1 * poussee, t, 0.08)
        propulsion.filtre!.frequency.setTargetAtTime(200 + 260 * poussee, t, 0.12)
      } else if (g === 'ethere') {
        // (l'onde : elle monte d'une quarte avec la poussée, son passe-bas s'ouvre, ses pulsations pressent le pas ;
        // discrète comme le souffle)
        propulsion.gain.gain.setTargetAtTime(ZZFX.volume * 0.1 * poussee, t, 0.06)
        propulsion.filtre!.frequency.setTargetAtTime(500 + 900 * poussee, t, 0.1)
        propulsion.lfo?.frequency.setTargetAtTime(3 + 4 * poussee, t, 0.15)
        for (const o of propulsion.notes ?? []) o.frequency.setTargetAtTime(BASE_ETHERE * ((o as OscillatorNode & { rapport?: number }).rapport ?? 1) * 2 ** ((5 * poussee) / 12), t, 0.12)
      } else {
        propulsion.gain.gain.setTargetAtTime(ZZFX.volume * 0.1 * poussee, t, 0.05) // (0,55 puis 0,35 puis 0,15 : trop fort — Keko : « un son quasi permanent, il doit être discret »)
        propulsion.filtre!.frequency.setTargetAtTime(250 + 650 * poussee, t, 0.08)
      }
    }
    if (forage !== null) forage.gain.gain.setTargetAtTime(creuse ? ZZFX.volume * (ARCADE ? 0.2 : 0.27) : 0, t, 0.04) // (baissée d'un tiers, environ 3 dB — Keko, 13/11 : « diminuer un peu le volume de la foreuse ») // (0,18 avant : Keko la veut plus forte ; 0,38 : le bourdon rond, au même niveau mesuré que l'ancien à 0,28)
    if (charge !== null) {
      const u = Math.max(0, Math.min(1, compte))
      charge.gain.gain.setTargetAtTime(u > 0 ? ZZFX.volume * 0.16 * (0.5 + 0.5 * u) * (monte ? 1 : 0.5) : 0, t, 0.06)
      // la hauteur ne se règle que pendant le compte : au bout (ou au hangar) la voix se tait SUR sa note, sans
      // retomber ; et un compte qui commence pose sa note pendant que la voix est muette, sans glisser
      if (u > 0) {
        const regle = (p: AudioParam, valeur: number, lissage: number): void => {
          if (chargeMuette) p.setValueAtTime(valeur, t)
          else p.setTargetAtTime(valeur, t, lissage)
        }
        for (const o of charge.notes) regle(o.frequency, RE3 * 2 ** u, 0.05)
        regle(charge.filtre!.frequency, 600 + 1800 * u, 0.08)
        regle(charge.lfo.frequency, 3 + 6 * u, 0.08)
      }
      chargeMuette = u === 0
    }
  } catch {
    // un son raté ne casse rien
  }
}

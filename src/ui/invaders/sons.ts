/**
 * LES SONS DES ENVAHISSEURS, synthétisés au Web Audio : aucun fichier. Le
 * contexte ne naît que sur un geste (la tape qui lance la partie), et aucun
 * son ne peut casser le jeu — sans Web Audio, on joue en silence.
 */
let ctx: AudioContext | null = null
let maitre: GainNode | null = null
let bruit: AudioBuffer | null = null

/** Ouvre le contexte : à appeler depuis un geste. */
export function ouvrirLeSon(): void {
  try {
    if (ctx === null) {
      const Constructeur = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (Constructeur === undefined) return
      ctx = new Constructeur()
      maitre = ctx.createGain()
      maitre.gain.value = 0.25
      maitre.connect(ctx.destination)
    }
    if (ctx.state === 'suspended') void ctx.resume()
  } catch {
    ctx = null
  }
}

function pret(): AudioContext | null {
  return ctx !== null && ctx.state === 'running' ? ctx : null
}

function enveloppe(g: GainNode, t0: number, pic: number, duree: number): void {
  g.gain.setValueAtTime(0.0001, t0)
  g.gain.exponentialRampToValueAtTime(pic, t0 + 0.005)
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + duree)
}

export function note(type: OscillatorType, depart: number, arrivee: number, duree: number, pic: number, decale = 0): void {
  const c = pret()
  if (c === null) return
  try {
    const t0 = c.currentTime + decale
    const o = c.createOscillator()
    o.type = type
    o.frequency.setValueAtTime(depart, t0)
    o.frequency.exponentialRampToValueAtTime(Math.max(20, arrivee), t0 + duree)
    const g = c.createGain()
    enveloppe(g, t0, pic, duree)
    o.connect(g).connect(maitre!)
    o.start(t0)
    o.stop(t0 + duree + 0.05)
  } catch {
    // Un son raté ne casse rien.
  }
}

export function souffle(duree: number, frequence: number, pic: number): void {
  const c = pret()
  if (c === null) return
  try {
    if (bruit === null) {
      bruit = c.createBuffer(1, c.sampleRate, c.sampleRate)
      const d = bruit.getChannelData(0)
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1
    }
    const t0 = c.currentTime
    const s = c.createBufferSource()
    s.buffer = bruit
    const f = c.createBiquadFilter()
    f.type = 'lowpass'
    f.frequency.setValueAtTime(frequence, t0)
    f.frequency.exponentialRampToValueAtTime(80, t0 + duree)
    const g = c.createGain()
    enveloppe(g, t0, pic, duree)
    s.connect(f).connect(g).connect(maitre!)
    s.start(t0)
    s.stop(t0 + duree + 0.05)
  } catch {
    // Un son raté ne casse rien.
  }
}

/** Le tir : un petit « piou » aigu, discret (il part sans arrêt). */
export function sonTir(): void {
  note('square', 1400, 500, 0.07, 0.05)
}

/** Un envahisseur saute : un éclat de bruit et un choc. */
export function sonExplosion(): void {
  souffle(0.25, 2400, 0.5)
  note('triangle', 220, 60, 0.18, 0.25)
}

/** Le vaisseau touché : grave, qui tombe. */
export function sonTouche(): void {
  souffle(0.5, 900, 0.7)
  note('sawtooth', 300, 40, 0.5, 0.3)
}

/** La soucoupe abattue : une cascade montante. */
export function sonSoucoupe(): void {
  souffle(0.3, 3000, 0.4)
  ;[660, 880, 1100, 1320].forEach((f, i) => note('square', f, f, 0.08, 0.08, i * 0.06))
}

/** Un abri touché : un caillou. */
export function sonAbri(): void {
  souffle(0.08, 1200, 0.15)
}

/** Une vague nouvelle : un arpège. */
export function sonVague(): void {
  ;[262, 330, 392, 523].forEach((f, i) => note('triangle', f, f, 0.16, 0.18, i * 0.09))
}

/** La partie perdue : une descente. */
export function sonPerdu(): void {
  ;[392, 330, 262, 196].forEach((f, i) => note('triangle', f, f * 0.97, 0.3, 0.2, i * 0.22))
}

/** Le pas de la formation : les quatre notes graves de l'original, une par pas. */
const PAS = [98, 87, 78, 73]
let pas = 0
export function sonPas(): void {
  note('square', PAS[pas % PAS.length], PAS[pas % PAS.length] * 0.9, 0.09, 0.12)
  pas += 1
}

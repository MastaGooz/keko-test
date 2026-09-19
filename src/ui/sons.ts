/**
 * Les sons du combat, synthétisés à la volée.
 *
 * Aucun fichier, aucune dépendance : tout est fabriqué au Web Audio à partir
 * d'oscillateurs et de bruit. C'est la même borne que les dessins — rien à
 * télécharger, rien à stocker dans le dépôt.
 *
 * Deux règles tenues ici :
 *
 * 1. **Le contexte audio ne naît que sur un geste.** Les navigateurs refusent
 *    de démarrer le son autrement. Tous les sons du jeu partent d'une tape,
 *    donc le premier appel suffit à l'ouvrir.
 * 2. **Aucun son ne doit pouvoir casser le jeu.** Tout est enveloppé : un
 *    navigateur sans Web Audio joue en silence, sans rien remarquer.
 */

const CLE = 'keko-son'

let ctx: AudioContext | null = null
let maitre: GainNode | null = null
let bruit: AudioBuffer | null = null
let actif = lireReglage()

function lireReglage(): boolean {
  try {
    return localStorage.getItem(CLE) !== 'muet'
  } catch {
    // Navigation privée, stockage bloqué : on joue, c'est le défaut.
    return true
  }
}

function ecrireReglage(valeur: boolean): void {
  try {
    localStorage.setItem(CLE, valeur ? 'actif' : 'muet')
  } catch {
    // Sans persistance le son marche quand même, il ne survit pas au rechargement.
  }
}

/** Ouvre le contexte au premier besoin. `null` = on ne fait pas de son. */
function contexte(): AudioContext | null {
  if (!actif) return null
  if (ctx === null) {
    const Constructeur =
      window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (Constructeur === undefined) return null
    try {
      ctx = new Constructeur()
    } catch {
      return null
    }
    maitre = ctx.createGain()
    maitre.gain.value = 0.3
    maitre.connect(ctx.destination)
  }
  // Un onglet revenu au premier plan peut avoir suspendu le contexte.
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

/** Une seconde de bruit blanc, fabriquée une fois et réutilisée. */
function bruitBlanc(c: AudioContext): AudioBuffer {
  if (bruit === null) {
    bruit = c.createBuffer(1, c.sampleRate, c.sampleRate)
    const donnees = bruit.getChannelData(0)
    for (let i = 0; i < donnees.length; i += 1) donnees[i] = Math.random() * 2 - 1
  }
  return bruit
}

/**
 * Une enveloppe qui ne claque pas. Les rampes exponentielles n'acceptent pas
 * zéro, d'où le plancher minuscule plutôt qu'un vrai silence.
 */
function enveloppe(g: GainNode, t0: number, pic: number, montee: number, duree: number): void {
  g.gain.setValueAtTime(0.0001, t0)
  g.gain.exponentialRampToValueAtTime(pic, t0 + montee)
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + duree)
}

function souffle(c: AudioContext, t0: number, duree: number, type: BiquadFilterType, frequence: number, pic: number): void {
  const source = c.createBufferSource()
  source.buffer = bruitBlanc(c)
  const filtre = c.createBiquadFilter()
  filtre.type = type
  filtre.frequency.value = frequence
  const g = c.createGain()
  enveloppe(g, t0, pic, 0.005, duree)
  source.connect(filtre).connect(g).connect(maitre!)
  source.start(t0)
  source.stop(t0 + duree + 0.05)
}

function note(
  c: AudioContext,
  t0: number,
  type: OscillatorType,
  depart: number,
  arrivee: number,
  duree: number,
  pic: number,
): void {
  const o = c.createOscillator()
  o.type = type
  o.frequency.setValueAtTime(depart, t0)
  o.frequency.exponentialRampToValueAtTime(Math.max(20, arrivee), t0 + duree)
  const g = c.createGain()
  enveloppe(g, t0, pic, 0.006, duree)
  o.connect(g).connect(maitre!)
  o.start(t0)
  o.stop(t0 + duree + 0.05)
}

/**
 * Le coup porté. `force` (0 à 1) vient du coût de la carte : la Dague fait un
 * claquement sec et aigu, le Moulinet un choc grave. On entend le poids de la
 * carte qu'on vient de jouer.
 */
export function sonFrappe(force: number): void {
  const c = contexte()
  if (c === null) return
  const t = c.currentTime
  const f = Math.min(1, Math.max(0, force))
  note(c, t, 'triangle', 320 - f * 150, 60, 0.13 + f * 0.1, 0.5 + f * 0.25)
  souffle(c, t, 0.05 + f * 0.03, 'bandpass', 2600 - f * 1200, 0.32)
}

/** Un corps tombe : une chute grave, plus longue que le coup lui-même. */
export function sonAcheve(): void {
  const c = contexte()
  if (c === null) return
  const t = c.currentTime
  note(c, t + 0.04, 'sawtooth', 210, 42, 0.38, 0.38)
  souffle(c, t + 0.04, 0.22, 'lowpass', 700, 0.3)
}

/** Le joueur encaisse : sourd, mat, sans éclat. Ça ne doit pas être agréable. */
export function sonEncaisse(): void {
  const c = contexte()
  if (c === null) return
  const t = c.currentTime
  note(c, t, 'square', 128, 48, 0.26, 0.34)
  souffle(c, t, 0.1, 'lowpass', 340, 0.34)
}

/** On lève une carte : un effleurement, presque rien. */
export function sonViser(): void {
  const c = contexte()
  if (c === null) return
  note(c, c.currentTime, 'triangle', 1180, 900, 0.045, 0.12)
}

/** Fin de tour : la main est défaussée et repiochée. Un froissement. */
export function sonPioche(): void {
  const c = contexte()
  if (c === null) return
  const t = c.currentTime
  for (let i = 0; i < 4; i += 1) {
    souffle(c, t + i * 0.045, 0.05, 'highpass', 1500 + i * 260, 0.16)
  }
}

/** La fin du combat. Trois notes qui montent, ou qui s'effondrent. */
export function sonIssue(victoire: boolean): void {
  const c = contexte()
  if (c === null) return
  const t = c.currentTime
  const accord = victoire ? [294, 392, 587] : [233, 175, 116]
  accord.forEach((frequence, i) => {
    note(c, t + i * 0.13, victoire ? 'triangle' : 'sawtooth', frequence, frequence * 0.98, 0.42, 0.3)
  })
}

export function sonActif(): boolean {
  return actif
}

/** Bascule, et renvoie le nouvel état. */
export function basculerSon(): boolean {
  actif = !actif
  ecrireReglage(actif)
  if (!actif && ctx !== null) void ctx.suspend()
  return actif
}

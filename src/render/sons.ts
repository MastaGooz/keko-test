/**
 * LES SONS FOURNIS PAR KEKO — des fichiers, cette fois.
 *
 * Le jeu 2D synthétise tout au Web Audio (`ui/sons.ts`), sans un seul fichier :
 * c'était la borne du prototype. Elle tombe pour le son comme elle était tombée
 * pour les images — *ce que Keko fabrique lui-même, le jeu le sert.*
 *
 * Deux règles tenues ici, et ce sont celles de `ui/sons.ts` :
 *
 * 1. **le contexte audio ne naît que sur un geste** — les navigateurs refusent
 *    de démarrer le son autrement. Tous nos sons partent d'une tape ou d'un
 *    clic, donc le premier appel suffit à l'ouvrir ;
 * 2. **aucun son ne peut casser le jeu** : sans Web Audio, sans fichier, sans
 *    décodeur, ça joue en silence et rien ne remonte.
 *
 * **ET LE DÉCODAGE A UN REPLI.** Le fichier de Keko est de l'AAC brut (ADTS,
 * sorti de ffmpeg) : Chrome et Safari le décodent, Firefox peut refuser selon
 * le système. On garde donc un `<audio>` sous le coude, qui lui accepte tout ce
 * que le navigateur sait lire — *un son qui ne se décode pas doit se jouer
 * quand même, pas se taire en silence.*
 */

/** Le son d'une carte qu'on PREND. Fourni par Keko. */
export const SON_PRENDRE = 'Take card.aac'

/**
 * Celui d'une carte qu'on POSE dans un slot. *Prendre et poser sont deux
 * gestes, donc deux sons* — le second a d'abord été le premier, faute d'avoir
 * l'autre fichier.
 */
export const SON_POSER = 'Card drop.aac'

/**
 * L'URL d'un fichier de `public/`. **Elle porte la date du build** : les
 * fichiers y sont copiés tels quels, sans empreinte de contenu dans leur nom,
 * donc sans ça le navigateur resservirait celui qu'il a en cache — le piège
 * déjà payé sur les images. Le nom est encodé : celui-ci contient une espace.
 */
function url(nom: string): string {
  return `${import.meta.env.BASE_URL}${encodeURIComponent(nom)}?v=${encodeURIComponent(__BUILD_TIME__)}`
}

let contexte: AudioContext | null = null
let audible = true

function ouvrir(): AudioContext | null {
  if (!audible) return null
  if (contexte === null) {
    const Fabrique = window.AudioContext ?? (window as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (Fabrique === undefined) {
      audible = false
      return null
    }
    // `interactive` DEMANDE LA PLUS COURTE LATENCE DE SORTIE que l'appareil
    // sache tenir. C'est le défaut de la spécification, mais il vaut mieux le
    // dire : sur un téléphone, le tampon audio par défaut d'un contexte
    // « balanced » s'entend — c'est un retard entre le doigt et le son.
    contexte = new Fabrique({ latencyHint: 'interactive' })
  }
  // Ouvert hors d'un geste, il naît SUSPENDU : on le relance au premier son,
  // qui part toujours d'une tape ou d'un clic.
  if (contexte.state === 'suspended') void contexte.resume()
  return contexte
}

/**
 * ON RÉVEILLE LE SON AU PREMIER CONTACT, pas au premier son.
 *
 * Un contexte créé hors d'un geste naît SUSPENDU, et le reprendre coûte du
 * temps — sur un téléphone, assez pour que le premier son arrive après le
 * geste qui l'a demandé. *Le réveil doit avoir lieu avant qu'on en ait
 * besoin*, et le premier contact de la page suffit.
 *
 * Un tampon d'une image, joué à volume nul : certains navigateurs ne
 * considèrent le contexte comme vraiment démarré qu'après une première
 * lecture.
 */
export function amorcerLeSon(): void {
  const ctx = ouvrir()
  if (ctx === null) return
  const source = ctx.createBufferSource()
  source.buffer = ctx.createBuffer(1, 1, ctx.sampleRate)
  const gain = ctx.createGain()
  gain.gain.value = 0
  source.connect(gain).connect(ctx.destination)
  source.start()
}

/** Par où le son est passé, pour la ligne de diagnostic. */
let chemin = '—'

/**
 * CE QUE L'APPAREIL DIT DE SA PROPRE LATENCE.
 *
 * *Une impression de retard ne se discute pas, elle se mesure* — et je ne peux
 * pas mesurer sur le téléphone de Keko. Cette ligne existe pour ça, comme
 * celle des gros plans en 2D : elle dit par quel chemin le son sort, et ce que
 * le navigateur avoue de son propre tampon.
 */
export function diagnosticSon(): string {
  if (contexte === null) return 'son : pas encore ouvert'
  const ms = (v: number | undefined): string =>
    v === undefined || Number.isNaN(v) ? '?' : `${Math.round(v * 1000)} ms`
  const sortie = (contexte as AudioContext & { outputLatency?: number }).outputLatency
  return `son : ${chemin} · ${contexte.state} · base ${ms(contexte.baseLatency)} · sortie ${ms(sortie)}`
}

const TAMPONS = new Map<string, AudioBuffer>()
const REPLIS = new Map<string, HTMLAudioElement>()
const EN_COURS = new Map<string, Promise<void>>()

/**
 * Charge et décode un son, une fois. **On ne met en cache que les succès** :
 * une promesse rejetée retenue condamnerait le son pour toute la session —
 * c'est la leçon des textures de cartes, payée une fois.
 */
export function precharger(nom: string): Promise<void> {
  const deja = EN_COURS.get(nom)
  if (deja !== undefined) return deja
  const chargement = (async (): Promise<void> => {
    const reponse = await fetch(url(nom))
    const octets = await reponse.arrayBuffer()
    const ctx = ouvrir()
    if (ctx === null) throw new Error('pas de Web Audio')
    // `decodeAudioData` rend une promesse sur les navigateurs modernes, mais
    // rejette aussi par le rappel d'erreur sur les plus vieux : on enveloppe.
    const tampon = await new Promise<AudioBuffer>((ok, non) => {
      void ctx.decodeAudioData(octets, ok, non)
    })
    TAMPONS.set(nom, tampon)
  })().catch(() => {
    // LE REPLI : un élément audio ordinaire, qui lit ce que le décodeur a
    // refusé. On le clone à chaque lecture, sinon deux sons rapprochés se
    // coupent l'un l'autre.
    const el = new Audio(url(nom))
    el.preload = 'auto'
    REPLIS.set(nom, el)
  })
  EN_COURS.set(nom, chargement)
  return chargement
}

/**
 * Joue un son. Il est chargé s'il ne l'est pas encore — *le premier geste ne
 * doit pas être muet*, même si le préchargement n'a pas eu le temps d'aboutir.
 */
export function jouerSon(nom: string, volume = 1): void {
  const tampon = TAMPONS.get(nom)
  if (tampon !== undefined) {
    const ctx = ouvrir()
    if (ctx === null) return
    const source = ctx.createBufferSource()
    source.buffer = tampon
    const gain = ctx.createGain()
    gain.gain.value = volume
    source.connect(gain).connect(ctx.destination)
    source.start()
    chemin = 'Web Audio'
    return
  }

  const repli = REPLIS.get(nom)
  if (repli !== undefined) {
    chemin = 'repli <audio>'
    const copie = repli.cloneNode() as HTMLAudioElement
    copie.volume = Math.min(1, volume)
    void copie.play().catch(() => undefined)
    return
  }

  // Pas encore prêt : on le charge, et on le joue dès qu'il l'est. Un son en
  // retard vaut mieux qu'un son perdu, et ça n'arrive qu'à la toute première
  // fois si le préchargement n'a pas abouti.
  void precharger(nom).then(() => {
    if (TAMPONS.has(nom) || REPLIS.has(nom)) jouerSon(nom, volume)
  })
}

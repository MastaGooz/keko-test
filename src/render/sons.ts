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
 * Celui d'une carte qu'on RETOURNE : le flip du paquet, quand le dos cède la
 * place à la face. Fourni par Keko. *Le nom est recopié depuis le disque* —
 * minuscule en tête, comme le fichier — parce que GitHub Pages sert depuis
 * Linux et qu'une casse devinée fait un 404 en ligne.
 */
export const SON_RETOURNER = 'card flip.aac'

/**
 * Celui d'une pièce qui CULBUTE avant de se fixer dans son slot. Fourni par
 * Keko : « à jouer dès que la carte commence à tourner avant de se fixer ».
 *
 * Il part donc au LÂCHER, comme la culbute elle-même — *la rotation commence
 * à la première image, elle n'attend pas que la carte soit montée.*
 */
export const SON_TOURNER = 'Card spin.aac'

/**
 * Celui d'une pièce qui SE FIXE, à l'instant où l'onde s'en échappe. Fourni
 * par Keko : « à jouer au moment où la carte se fixe et déclenche l'onde ».
 *
 * *C'est le troisième temps d'un même geste* — on prend, on lâche, ça tourne,
 * et ça s'encastre : chaque temps a son son, et aucun n'en double un autre.
 */
export const SON_EQUIPER = 'Equip.aac'

/**
 * LE FILM QUI CRAQUE, pendant qu'on déchire le sachet. Fourni par Keko : « le
 * son cracks se joue progressivement en fonction de l'avancée de
 * l'ouverture ». *Il joue en boucle, et le gain dit quand on l'entend* : voir `jouerEnBoucle`.
 */
export const SON_CRAQUE = 'cracks.aac'

/** Le POP de l'arrachement — « au moment final de l'ouverture ». Fourni par Keko. */
export const SON_POP = 'pop.aac'

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
  // `suspended`, ou `interrupted` sur iOS (un appel, un autre onglet) : tout
  // ce qui n'est pas `running` se reprend. *Et la reprise ne passe que depuis
  // un geste sur iPhone* — c'est aux appelants d'être dans un geste.
  if (contexte.state !== 'running') void contexte.resume()
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
  return `son : ${chemin} · ${contexte.state} · t ${contexte.currentTime.toFixed(2)} · base ${ms(contexte.baseLatency)} · sortie ${ms(sortie)}`
}

/**
 * REPREND LE CONTEXTE S'IL NE TOURNE PAS — à appeler DEPUIS UN GESTE. Keko :
 * « ça fonctionne uniquement sur la partie déchirure auto, pas durant le slide
 * tactile ». *Sur iPhone la reprise ne passe que depuis un geste*, et un
 * glisser en est un à chaque `pointermove` : on la redemande à chaque pas, ça
 * ne coûte rien quand le contexte tourne déjà.
 */
export function reveillerLeSon(): void {
  ouvrir()
}

/** Par où un son sortira : son tampon décodé, le repli `<audio>`, ou rien encore. */
export function cheminDe(nom: string): 'tampon' | 'repli' | 'aucun' {
  return TAMPONS.has(nom) ? 'tampon' : REPLIS.has(nom) ? 'repli' : 'aucun'
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
    TETES.set(nom, teteDe(tampon))
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
 *
 * `vitesse` accélère la lecture (1 = telle quelle) : un son plus court ET plus
 * aigu, comme une bande qu'on fait tourner plus vite. Keko, sur le flip : « tu
 * peux accélérer le son flip quand tu le joues ? » *Le fichier ne change pas,
 * c'est sa lecture qui change* — le repli `<audio>` le sait aussi.
 */
export function jouerSon(nom: string, volume = 1, dans = 0, vitesse = 1): void {
  const tampon = TAMPONS.get(nom)
  if (tampon !== undefined) {
    const ctx = ouvrir()
    if (ctx === null) return
    const source = ctx.createBufferSource()
    source.buffer = tampon
    source.playbackRate.value = vitesse
    const gain = ctx.createGain()
    gain.gain.value = volume
    source.connect(gain).connect(ctx.destination)
    // IL PART À SON PREMIER ÉCHANTILLON AUDIBLE, pas au début du fichier — et
    // s'il est programmé, en avance de ce que la sortie mettra à le rendre :
    // *un son qu'on sait venir se programme, on ne l'attend pas.*
    source.start(ctx.currentTime + Math.max(0, dans - latenceDe(ctx)), TETES.get(nom) ?? 0)
    chemin = 'Web Audio'
    return
  }

  const repli = REPLIS.get(nom)
  if (repli !== undefined) {
    chemin = 'repli <audio>'
    const copie = repli.cloneNode() as HTMLAudioElement
    copie.volume = Math.min(1, volume)
    copie.playbackRate = vitesse
    const lire = (): void => void copie.play().catch(() => undefined)
    if (dans > 0) setTimeout(lire, dans * 1000)
    else lire()
    return
  }

  // Pas encore prêt : on le charge, et on le joue dès qu'il l'est. Un son en
  // retard vaut mieux qu'un son perdu, et ça n'arrive qu'à la toute première
  // fois si le préchargement n'a pas abouti.
  void precharger(nom).then(() => {
    if (TAMPONS.has(nom) || REPLIS.has(nom)) jouerSon(nom, volume, dans, vitesse)
  })
}

/**
 * OÙ UN SON COMMENCE VRAIMENT, en secondes depuis le début de son tampon.
 *
 * *Un fichier porte du silence en tête* — l'amorce que l'encodeur AAC ajoute,
 * plus ce que l'enregistrement a laissé avant le premier bruit : mesuré, 46 ms
 * sur le pop, 49 sur le craquement, 38 sur la prise de carte. **Chaque son
 * partait donc en retard de son propre silence**, et sur un téléphone la
 * latence de sortie s'y ajoute — Keko : « le pop se produit trop tard ». On
 * cherche le premier échantillon qui dépasse `SEUIL_TETE`, et c'est là que la
 * lecture commence.
 */
const SEUIL_TETE = 0.02
const TETES = new Map<string, number>()
function teteDe(tampon: AudioBuffer): number {
  const d = tampon.getChannelData(0)
  for (let i = 0; i < d.length; i++) if (Math.abs(d[i]!) > SEUIL_TETE) return i / tampon.sampleRate
  return 0
}

/** Ce que la sortie met à rendre un son, en secondes — ce que l'appareil en avoue. */
function latenceDe(ctx: AudioContext): number {
  return (ctx as { outputLatency?: number }).outputLatency ?? ctx.baseLatency ?? 0
}

/** Un son en boucle dont on DOSE le niveau. Voir `jouerEnBoucle`. */
export interface SonEnBoucle {
  /** Son niveau, de 0 à 1 — lissé, donc sans clic. */
  doser(niveau: number): void
  /** On n'en a plus besoin : il se tait, et ne repartira pas. */
  arreter(): void
  /** La dernière consigne — pour le diagnostic. */
  niveau(): number
}

/** Ce que met le niveau à rejoindre sa consigne, en secondes : assez court pour suivre un doigt, assez long pour ne pas cliquer. */
const LISSAGE = 0.03

/**
 * UN SON EN BOUCLE, TEL QUEL, DONT ON DOSE LE NIVEAU.
 *
 * Keko : « le son cracks se joue progressivement en fonction de l'avancée de
 * l'ouverture ». *Une première version faisait AVANCER le son* — une seule
 * source à vitesse de lecture zéro, dont la vitesse poursuivait la place du
 * front — et elle était muette sur son téléphone alors que le même fichier en
 * boucle s'y entend : **« j'entends toujours rien sur le cracks » puis « ok je
 * l'entends donc il existe ».** Une vitesse de lecture qu'on pilote image par
 * image depuis zéro n'est pas tenue partout ; un gain, si. Elle reste dans
 * `git log`.
 *
 * **LA BOUCLE JOUE À SA VITESSE NATURELLE, et c'est le GAIN qui dit quand on
 * l'entend** : ouvert tant que le front avance, fermé dès qu'il s'arrête — ce
 * qui craque est le film qu'on déchire, pas le film qu'on tient. Le niveau
 * est lissé (`LISSAGE`) : *un gain qui saute de 0 à 1 clique*, et un craquement
 * de plus n'est pas celui qu'on veut.
 *
 * **C'est aussi le banc `?craque`**, à niveau 1 sans jamais le baisser — *un
 * son qui ne s'entend pas dans le jeu peut être muet pour deux raisons*, le
 * fichier ou la façon dont le jeu le joue, et le banc ne garde que le fichier.
 *
 * **LE REPLI NE SE DOSE PAS** : un `<audio>` en boucle joue à son volume, et
 * c'est tout ce qu'il sait faire — *un son entier vaut mieux qu'un silence.*
 */
export function jouerEnBoucle(nom: string, volume = 1): SonEnBoucle {
  let arrete = false
  let consigne = 1
  let gain: GainNode | null = null
  let ctxDuGain: AudioContext | null = null
  let arreter: () => void = () => undefined
  void precharger(nom).then(() => {
    if (arrete) return
    const tampon = TAMPONS.get(nom)
    const ctx = tampon !== undefined ? ouvrir() : null
    if (tampon !== undefined && ctx !== null) {
      const source = ctx.createBufferSource()
      source.buffer = tampon
      source.loop = true
      source.loopStart = TETES.get(nom) ?? 0
      gain = ctx.createGain()
      gain.gain.value = consigne * volume
      ctxDuGain = ctx
      source.connect(gain).connect(ctx.destination)
      source.start(0, source.loopStart)
      chemin = 'Web Audio'
      arreter = () => source.stop()
      return
    }
    const repli = REPLIS.get(nom)
    if (repli === undefined) return
    chemin = 'repli <audio>'
    const copie = repli.cloneNode() as HTMLAudioElement
    copie.loop = true
    copie.volume = Math.min(1, volume)
    void copie.play().catch(() => undefined)
    arreter = () => copie.pause()
  })
  return {
    doser(niveau) {
      consigne = Math.min(1, Math.max(0, niveau))
      if (gain !== null && ctxDuGain !== null) {
        if (ctxDuGain.state !== 'running') void ctxDuGain.resume()
        gain.gain.setTargetAtTime(consigne * volume, ctxDuGain.currentTime, LISSAGE)
      }
    },
    niveau: () => consigne,
    arreter() {
      arrete = true
      arreter()
    },
  }
}

/**
 * LE CLIC DOUX ET JUICY — synthétisé, aucun fichier. Keko, après `card flip` :
 * « non c'est pas terrible… tu peux créer un son de clic doux et juicy
 * toi ? »
 *
 * Trois voix, et chacune fait un travail que les autres ne font pas :
 *
 * - **la BULLE** : une sinusoïde qui MONTE (420 → 880 Hz en 70 ms) puis
 *   s'éteint — *une hauteur qui monte se lit comme une goutte qui saute*, là
 *   où une hauteur qui descend se lit comme un coup ;
 * - **l'ÉCHO** une quinte au-dessus, un cheveu plus tard et plus doux : c'est
 *   ce qui donne la couleur « bonbon » plutôt qu'un bip de menu ;
 * - **le TOC** : un souffle de bruit très court passé dans un passe-bande,
 *   pour l'attaque — *un clic sans transitoire se lit comme un ton.*
 *
 * Enveloppes exponentielles, jamais à zéro exact (la règle de `ui/sons.ts` :
 * `exponentialRampToValueAtTime` refuse zéro). Aucun son ne casse le jeu :
 * sans Web Audio, ça ne joue rien.
 */
export function jouerClicDoux(volume = 1): void {
  const ctx = ouvrir()
  if (ctx === null) return
  const t0 = ctx.currentTime + 0.005
  // PLUS FORT, ET UN COMPRESSEUR POUR NE PAS ÉCRÊTER. Keko : « le son n'est
  // pas assez fort par rapport aux autres ». *Les fichiers de Keko montent à
  // 0,9–1,2 de crête* ; le clic n'en faisait que 0,5. Il passe à ×1,6, et le
  // compresseur tient les trois voix sous le plafond quand elles se cumulent —
  // *un son qu'on monte au-delà de 1 écrête sur ses crêtes.*
  const sortie = ctx.createGain()
  sortie.gain.value = volume * 1.6
  const compresseur = ctx.createDynamicsCompressor()
  compresseur.threshold.value = -10
  compresseur.knee.value = 6
  compresseur.ratio.value = 8
  compresseur.attack.value = 0.002
  compresseur.release.value = 0.08
  sortie.connect(compresseur).connect(ctx.destination)

  // MOINS DE BULLE. Keko : « on peut changer le son pour un truc un peu moins
  // "bulle" ». *Ce qui faisait la bulle était la hauteur qui MONTE* d'une
  // octave. Le clic devient une touche qu'on enfonce : un ton qui DESCEND à
  // peine (un tiers de ton), en triangle plutôt qu'en sinus — un peu de
  // grain, pas de sifflet — posé sur un petit coup sourd qui donne le poids.
  const voix = (
    forme: OscillatorType,
    depart: number,
    f0: number,
    f1: number,
    duree: number,
    niveau: number,
  ): void => {
    const o = ctx.createOscillator()
    o.type = forme
    o.frequency.setValueAtTime(f0, t0 + depart)
    o.frequency.exponentialRampToValueAtTime(f1, t0 + depart + duree * 0.6)
    const g = ctx.createGain()
    g.gain.setValueAtTime(0.0001, t0 + depart)
    g.gain.exponentialRampToValueAtTime(niveau, t0 + depart + 0.004)
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + depart + duree)
    o.connect(g).connect(sortie)
    o.start(t0 + depart)
    o.stop(t0 + depart + duree + 0.02)
  }
  voix('triangle', 0, 760, 640, 0.09, 0.8)
  voix('sine', 0, 190, 110, 0.07, 0.7)

  // LE TOC : 25 ms de bruit, passe-bande vers 2,5 kHz.
  const n = Math.round(ctx.sampleRate * 0.025)
  const tampon = ctx.createBuffer(1, n, ctx.sampleRate)
  const d = tampon.getChannelData(0)
  for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n) ** 3
  const bruit = ctx.createBufferSource()
  bruit.buffer = tampon
  const filtre = ctx.createBiquadFilter()
  filtre.type = 'bandpass'
  filtre.frequency.value = 3200
  filtre.Q.value = 0.9
  const gb = ctx.createGain()
  gb.gain.value = 0.35
  bruit.connect(filtre).connect(gb).connect(sortie)
  bruit.start(t0)
  chemin = 'Web Audio'
}

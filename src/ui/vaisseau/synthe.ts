/**
 * LE SYNTHÉ DES SONS DU VAISSEAU (Keko, 10/11 : « retravailler les sons du jeu, pour les rendre plus ronds / doux et
 * moins type arcade old school, avec une qualité la plus haute possible »).
 *
 * ZzFX fait un son d'une ligne : une forme d'onde (carré, dent de scie, bruit), un glissé, un écrasement — c'est la
 * borne d'arcade, par construction. Ici chaque son est COMPOSÉ, couche par couche, et calculé échantillon par
 * échantillon à la fréquence du contexte audio (48 kHz le plus souvent), en stéréo :
 *
 * - des NOTES faites de sinus purs (un fondamental et quelques partiels qui s'éteignent plus vite que lui : le maillet,
 *   la cloche, le verre), montées en demi-cosinus et éteintes en exponentielle — ni clic d'attaque, ni coupure ;
 * - du SOUFFLE : du bruit passé dans un filtre à variable d'état dont la coupure glisse (jamais de bruit blanc nu) ;
 * - une SATURATION douce (tanh) sur les graves, qui leur donne les harmoniques qu'un haut-parleur de téléphone sait
 *   rendre (il ne descend pas sous 200 Hz) ;
 * - une RÉVERBÉRATION courte cuite dans le tampon (la Freeverb de Jezar : huit peignes amortis, quatre passe-tout,
 *   les deux canaux décalés) : c'est elle qui arrondit, un son sec est un son de borne.
 *
 * Les sons de l'interface sont accordés entre eux (ré majeur pentatonique). PUR : pas de DOM, pas d'AudioContext,
 * le hasard est seedé — le même son rend les mêmes échantillons, et Node sait le mesurer.
 */
import { createRng, type Rng } from '../../logic/rng.ts'

export type Stereo = { g: Float32Array; d: Float32Array }
type Table = Stereo & { sr: number }

const TAU = Math.PI * 2

/** Un glissé : vers cette fréquence, en ce temps — une approche exponentielle (vive puis posée), ou `droit` : régulière. */
type Glisse = { vers: number; en: number; droit?: boolean }
/** Un partiel : son rapport au fondamental, son niveau, et son déclin relatif à celui de la note. */
type Partiel = [rapport: number, niveau: number, declin?: number]
type Note = { f: number; glisse?: Glisse; a?: number; d: number; partiels?: Partiel[]; battement?: number; sature?: number }
type Souffle = { f: number; glisse?: Glisse; q?: number; bande?: boolean; a?: number; d: number; large?: boolean }

function frequence(f: number, gl: Glisse | undefined, t: number): number {
  if (gl === undefined) return f
  if (gl.droit) return f * (gl.vers / f) ** Math.min(1, t / gl.en)
  return gl.vers + (f - gl.vers) * Math.exp(-t / gl.en)
}

/** L'enveloppe : une montée en demi-cosinus sur `a` secondes, puis un déclin exponentiel (−60 dB au bout de `d`). */
function enveloppe(t: number, a: number, d: number): number {
  const montee = t < a ? 0.5 - 0.5 * Math.cos((Math.PI * t) / a) : 1
  return montee * Math.exp((-6.9 * Math.max(0, t - a)) / d)
}

/** Pose une piste sur la table à l'instant `t0`, ramenée à la crête `niveau`, placée entre gauche (−1) et droite (1). */
function poser(m: Table, x: Float32Array, t0: number, niveau: number, pan: number): void {
  let crete = 0
  for (let i = 0; i < x.length; i++) crete = Math.max(crete, Math.abs(x[i]))
  if (crete === 0) return
  const i0 = Math.round(t0 * m.sr)
  const angle = ((pan + 1) * Math.PI) / 4
  const kg = (Math.cos(angle) * niveau) / crete
  const kd = (Math.sin(angle) * niveau) / crete
  const n = Math.min(x.length, m.g.length - i0)
  for (let i = 0; i < n; i++) {
    m.g[i0 + i] += x[i] * kg
    m.d[i0 + i] += x[i] * kd
  }
}

/** Une note : des sinus. `battement` (en cents) double la note d'une jumelle à peine désaccordée, qui la fait miroiter. */
function note(m: Table, t0: number, niveau: number, pan: number, n: Note): void {
  const a = n.a ?? 0.003
  const len = Math.ceil((a + n.d) * m.sr)
  const x = new Float32Array(len)
  const partiels = n.partiels ?? [[1, 1, 1]]
  const voix = n.battement === undefined ? [1] : [1, 2 ** (n.battement / 1200)]
  for (const desaccord of voix) for (const [rapport, niv, declin = 1] of partiels) {
    let phase = 0
    for (let i = 0; i < len; i++) {
      const t = i / m.sr
      const f = frequence(n.f, n.glisse, t) * rapport * desaccord
      phase += (TAU * f) / m.sr
      if (f < m.sr * 0.45) x[i] += niv * enveloppe(t, a, n.d * declin) * Math.sin(phase)
    }
  }
  if (n.sature !== undefined) {
    let crete = 0
    for (let i = 0; i < len; i++) crete = Math.max(crete, Math.abs(x[i]))
    for (let i = 0; i < len; i++) x[i] = Math.tanh((x[i] / crete) * n.sature)
  }
  poser(m, x, t0, niveau, pan)
}

/** Un souffle : du bruit dans un filtre à variable d'état (passe-bas, ou passe-bande) dont la coupure glisse. */
function souffle(m: Table, h: Rng, t0: number, niveau: number, pan: number, s: Souffle): void {
  const a = s.a ?? 0.002
  const len = Math.ceil((a + s.d) * m.sr)
  const k = 1 / (s.q ?? 0.707)
  // « large » : deux bruits différents, un par oreille — un souffle qui entoure au lieu de sortir d'un point
  for (const cote of s.large ? [-0.85, 0.85] : [pan]) {
    const x = new Float32Array(len)
    let ic1 = 0
    let ic2 = 0
    for (let i = 0; i < len; i++) {
      const t = i / m.sr
      const g = Math.tan((Math.PI * Math.min(m.sr * 0.45, frequence(s.f, s.glisse, t))) / m.sr)
      const a1 = 1 / (1 + g * (g + k))
      const a2 = g * a1
      const v3 = h.next() * 2 - 1 - ic2
      const v1 = a1 * ic1 + a2 * v3
      const v2 = ic2 + a2 * ic1 + g * a2 * v3
      ic1 = 2 * v1 - ic1
      ic2 = 2 * v2 - ic2
      x[i] = (s.bande ? v1 : v2) * enveloppe(t, a, s.d)
    }
    poser(m, x, t0, niveau, cote)
  }
}

/** La réverbération (Freeverb) : `salle` la longueur de la queue (0 à 1), `dose` l'énergie du son réverbéré face au sec. */
function reverberer(m: Table, salle: number, dose: number): void {
  const n = m.g.length
  const k = m.sr / 44100
  const amorti = 0.45
  const retour = 0.7 + 0.28 * salle
  // l'entrée : les deux canaux ensemble, adoucis (un pôle vers 4 kHz) — la queue est plus sombre que le son
  const entree = new Float32Array(n)
  const c = Math.exp((-TAU * 4000) / m.sr)
  let lisse = 0
  for (let i = 0; i < n; i++) {
    lisse = (m.g[i] + m.d[i]) * 0.5 * (1 - c) + lisse * c
    entree[i] = lisse
  }
  let sec = 0
  for (let i = 0; i < n; i++) sec += m.g[i] * m.g[i] + m.d[i] * m.d[i]
  const canaux = [0, 1].map((canal) => {
    const sortie = new Float32Array(n)
    for (const longueur of [1116, 1188, 1277, 1356, 1422, 1491, 1557, 1617]) {
      const tampon = new Float32Array(Math.round((longueur + canal * 23) * k))
      let garde = 0
      let j = 0
      for (let i = 0; i < n; i++) {
        const y = tampon[j]
        garde = y * (1 - amorti) + garde * amorti
        tampon[j] = entree[i] + garde * retour
        sortie[i] += y
        if (++j === tampon.length) j = 0
      }
    }
    for (const longueur of [556, 441, 341, 225]) {
      const tampon = new Float32Array(Math.round((longueur + canal * 23) * k))
      let j = 0
      for (let i = 0; i < n; i++) {
        const b = tampon[j]
        tampon[j] = sortie[i] + b * 0.5
        sortie[i] = b - sortie[i]
        if (++j === tampon.length) j = 0
      }
    }
    return sortie
  })
  let mouille = 0
  for (const s of canaux) for (let i = 0; i < n; i++) mouille += s[i] * s[i]
  if (mouille === 0) return
  const gain = dose * Math.sqrt(sec / mouille)
  for (let i = 0; i < n; i++) {
    m.g[i] += canaux[0][i] * gain
    m.d[i] += canaux[1][i] * gain
  }
}

/** Rogne le silence de la fin, ramène la crête à `niveau`, et éteint les vingt dernières millisecondes. */
function finir(m: Table, niveau: number): Stereo {
  let crete = 0
  for (let i = 0; i < m.g.length; i++) crete = Math.max(crete, Math.abs(m.g[i]), Math.abs(m.d[i]))
  if (crete === 0) return { g: new Float32Array(1), d: new Float32Array(1) }
  let fin = m.g.length - 1
  while (fin > 0 && Math.abs(m.g[fin]) < crete * 0.001 && Math.abs(m.d[fin]) < crete * 0.001) fin--
  const n = fin + 1
  const fondu = Math.min(n, Math.round(0.02 * m.sr))
  const g = m.g.slice(0, n)
  const d = m.d.slice(0, n)
  for (let i = 0; i < n; i++) {
    const reste = n - 1 - i
    const f = (reste < fondu ? 0.5 - 0.5 * Math.cos((Math.PI * reste) / fondu) : 1) * (niveau / crete)
    g[i] *= f
    d[i] *= f
  }
  return { g, d }
}

// LES TIMBRES : un fondamental, et des partiels qui meurent avant lui (c'est ce qui fait une percussion accordée)
/** le maillet sur une lame de bois : rond, presque un sinus, un rien de quatrième harmonique à l'attaque */
const MAILLET: Partiel[] = [[1, 1, 1], [2, 0.1, 0.5], [4, 0.09, 0.25]]
/** la clochette : des harmoniques à peine fausses, qui s'éteignent vite */
const CLOCHE: Partiel[] = [[1, 1, 1], [2, 0.22, 0.6], [3.01, 0.1, 0.4], [4.2, 0.05, 0.25]]
/** le verre : des partiels qui ne sont pas des harmoniques */
const VERRE: Partiel[] = [[1, 1, 1], [2.76, 0.18, 0.4], [5.4, 0.06, 0.2]]
/** un grave qu'un petit haut-parleur entend : le fondamental, et ses trois premiers harmoniques */
const CORPS: Partiel[] = [[1, 1, 1], [2, 0.5, 0.8], [3, 0.3, 0.6], [4, 0.15, 0.45]]

// LES NOTES de l'interface : ré majeur pentatonique (ré, mi, fa dièse, la, si)
const RE4 = 293.66
const FA4 = 349.23
const LA4 = 440
const RE5 = 587.33
const MI5 = 659.26
const FAD5 = 739.99
const LA5 = 880
const SI5 = 987.77
const RE6 = 1174.66
const MI6 = 1318.51
const FAD6 = 1479.98
const LA6 = 1760
const SI6 = 1975.53
const MI7 = 2637.02

/**
 * L'ÉCLOSION DE L'ARRIVÉE : l'instant, dans le son `arrive`, où la montée cède aux clochettes. La page fait tomber
 * cet instant sur l'ouverture de la matérialisation (le moment où le vaisseau paraît) — elle le lit ici, elle ne le
 * recopie pas.
 */
export const ECLOSION_DE_L_ARRIVEE = 0.66

type Recette = {
  /** la durée de la table, queue de réverbération comprise (le silence de la fin est rogné) */
  duree: number
  /** la crête du son fini (mesurée contre l'ancien son : voir docs/vaisseau.md) */
  niveau: number
  /** la réverbération : la salle (0 à 1), la dose */
  salle?: [number, number]
  /** combien de variantes : un son très répété ne se rejoue pas deux fois pareil */
  variantes?: number
  faire: (m: Table, h: Rng, v: number) => void
}

/** Des éclats : `n` petits souffles en bande, semés dans le temps et dans l'espace. */
function eclats(m: Table, h: Rng, n: number, de: number, a: number, niveau: number): void {
  for (let i = 0; i < n; i++) {
    const f = 600 + 1300 * h.next()
    souffle(m, h, de + (a - de) * h.next(), niveau * (0.5 + 0.5 * h.next()), h.next() * 1.2 - 0.6, { f, q: 2.5, bande: true, d: 0.03 + 0.03 * h.next() })
  }
}

const RECETTES = {
  // EN VOL
  /** une roche éclate : un coup sourd, un souffle qui retombe, des gravats */
  eclat: {
    duree: 0.9, niveau: 0.7, salle: [0.45, 0.22],
    faire: (m, h) => {
      note(m, 0, 0.8, 0, { f: 220, glisse: { vers: 110, en: 0.05 }, d: 0.2, partiels: CORPS, sature: 2 })
      souffle(m, h, 0, 1, 0, { f: 2200, glisse: { vers: 600, en: 0.07 }, d: 0.24 })
      eclats(m, h, 7, 0.02, 0.26, 0.6)
    },
  },
  /** une pépite monte à bord : deux notes de maillet, une quinte qui monte — quatre hauteurs qui se suivent */
  ramasse: {
    duree: 0.7, niveau: 0.21, salle: [0.4, 0.16], variantes: 4,
    faire: (m, _h, v) => {
      const [bas, haut] = [[LA5, MI6], [SI5, FAD6], [RE6, LA6], [MI6, SI6]][v]
      note(m, 0, 0.6, -0.15, { f: bas, d: 0.09, partiels: MAILLET })
      note(m, 0.045, 1, 0.15, { f: haut, d: 0.26, partiels: MAILLET })
    },
  },
  /**
   * LE CANON LASER (le Chasseur, Keko, 18/11 : « la sensation d'un tir de laser à la Star Wars ») : un « piou » — une note
   * qui tombe très vite de l'aigu au grave, métallique (des partiels serrés), battue, sur un claquement d'énergie bref
   * (… PLUS GRAVE ET PLUS ROND — Keko, 18/11 : « trop criard ; c'est un laser assez lourd, un son un petit peu plus grave,
   * un petit peu plus rond » : il part de 720 Hz au lieu de 1 900, ses partiels sont harmoniques et faibles (plus de
   * quinte métallique), à peine battu, sans saturation ; dessous, un corps grave qui s'enfonce donne le poids ; le
   * claquement passe de 5 000 à 1 600 Hz, en passe-bas)
   */
  // (… PLUS GRAVE ET PLUS PULSANT — Keko, 18/11 : « toujours un peu trop aigu et un peu trop mou ; un son un peu plus grave
  // et plus pulsant » : il part de 420 Hz au lieu de 720 et tombe en 0,08 s au lieu de 0,18 — c'est la lenteur de la chute
  // qui le rendait mou ; une jumelle désaccordée de 60 cents le fait battre, une dizaine de pulsations par seconde ; un coup
  // sourd un peu saturé dessous, l'attaque sèche)
  laser: {
    duree: 0.4, niveau: 0.26, salle: [0.3, 0.1], variantes: 4,
    faire: (m, h) => {
      const f = 420 * (0.95 + 0.1 * h.next())
      note(m, 0, 1, 0, { f, glisse: { vers: f * 0.24, en: 0.08 }, a: 0.001, d: 0.16, battement: 60, partiels: [[1, 1, 1], [2, 0.3, 0.6], [3, 0.08, 0.4]], sature: 1.4 })
      note(m, 0, 0.85, 0, { f: 115, glisse: { vers: 48, en: 0.07 }, a: 0.001, d: 0.12, partiels: [[1, 1, 1], [2, 0.2, 0.6]], sature: 1.5 })
      souffle(m, h, 0, 0.3, 0, { f: 1300, glisse: { vers: 400, en: 0.03 }, q: 0.8, a: 0.001, d: 0.03 })
    },
  },
  /** le canon : un « poum » feutré */
  canon: {
    duree: 0.7, niveau: 0.3, salle: [0.4, 0.16],
    faire: (m, h) => {
      note(m, 0, 1, 0, { f: 290, glisse: { vers: 125, en: 0.035 }, d: 0.18, partiels: CORPS, sature: 2 })
      souffle(m, h, 0, 0.6, 0, { f: 3000, glisse: { vers: 700, en: 0.03 }, d: 0.08 })
    },
  },
  /** la mitrailleuse : un « tup » très court, trois hauteurs voisines */
  rafale: {
    duree: 0.3, niveau: 0.24, salle: [0.25, 0.08], variantes: 3,
    faire: (m, h, v) => {
      note(m, 0, 1, 0, { f: 430 + 30 * v, glisse: { vers: 230 + 16 * v, en: 0.02 }, d: 0.07, partiels: CORPS })
      souffle(m, h, 0, 0.5, 0, { f: 3200, glisse: { vers: 1000, en: 0.015 }, d: 0.03 })
    },
  },
  /** LA MITRAILLEUSE DU CHASSEUR (18/11) : un « tac » court et rond, sans souffle aigu — elle tire vite, il ne doit pas fatiguer */
  mitraille: {
    duree: 0.25, niveau: 0.2, salle: [0.25, 0.08], variantes: 4,
    faire: (m, h, v) => {
      note(m, 0, 1, 0, { f: 360 + 25 * v, glisse: { vers: 170 + 10 * v, en: 0.025 }, a: 0.001, d: 0.06, partiels: [[1, 1, 1], [2, 0.3, 0.6], [3, 0.1, 0.4]] })
      souffle(m, h, 0, 0.35, 0, { f: 1800, glisse: { vers: 700, en: 0.015 }, q: 0.8, a: 0.001, d: 0.025 })
    },
  },
  /** un missile part : un souffle large qui s'ouvre */
  missiles: {
    duree: 1, niveau: 0.42, salle: [0.5, 0.18],
    faire: (m, h) => {
      souffle(m, h, 0, 1, 0, { f: 350, glisse: { vers: 1600, en: 0.3, droit: true }, q: 1.4, bande: true, a: 0.06, d: 0.4, large: true })
      note(m, 0, 0.4, 0, { f: 150, glisse: { vers: 300, en: 0.3, droit: true }, a: 0.05, d: 0.35, partiels: CORPS })
    },
  },
  /** un obus touche le rival : un « tonk » de métal mat */
  ennemiTouche: {
    duree: 0.4, niveau: 0.24, salle: [0.35, 0.12],
    faire: (m, h) => {
      note(m, 0, 1, 0, { f: 480, a: 0.001, d: 0.09, partiels: [[1, 1, 1], [2.4, 0.35, 0.5], [4.1, 0.12, 0.3]] })
      souffle(m, h, 0, 0.25, 0, { f: 2500, d: 0.015 })
    },
  },
  /**
   * UN TIR TOUCHE UN INSECTE (le jeu du vortex — Keko, 15/11 : le « tonk » de métal « fait un peu trop tape sur un bout
   * de bois, il faudrait un son plus organique ») : un petit coup sourd et charnu, un ÉCRASEMENT MOUILLÉ (un souffle en
   * bande qui retombe vite), un infime craquement de carapace ; trois variantes, il revient souvent
   */
  insecteTouche: {
    duree: 0.35, niveau: 0.22, salle: [0.25, 0.08], variantes: 3,
    faire: (m, h) => {
      const g = 0.9 + 0.2 * h.next()
      note(m, 0, 0.8, 0, { f: 170 * g, glisse: { vers: 85 * g, en: 0.04 }, a: 0.002, d: 0.07, partiels: CORPS, sature: 1.4 })
      souffle(m, h, 0, 0.75, (h.next() - 0.5) * 0.3, { f: 1300 * g, glisse: { vers: 380, en: 0.06 }, q: 1.6, bande: true, a: 0.002, d: 0.09 })
      souffle(m, h, 0.005, 0.2, 0, { f: 3400, q: 2.2, bande: true, a: 0.001, d: 0.012 })
    },
  },
  /** le rival explose : un grand coup sourd, un souffle long, des débris */
  ennemiDetruit: {
    duree: 2, niveau: 0.95, salle: [0.8, 0.3],
    faire: (m, h) => {
      note(m, 0, 0.8, 0, { f: 170, glisse: { vers: 62, en: 0.15 }, a: 0.004, d: 0.7, partiels: CORPS, sature: 2.5 })
      souffle(m, h, 0, 1, 0, { f: 2800, glisse: { vers: 320, en: 0.2 }, a: 0.004, d: 0.75, large: true })
      eclats(m, h, 9, 0.05, 0.55, 0.45)
    },
  },
  /**
   * un insecte s'écrase (le jeu du vortex — Keko, 14/11 : « pas une explosion : une destruction d'insecte, avec du sang
   * vert et un bruit de splash ») : un choc mou et court, un souffle mouillé qui retombe, deux gouttes qui claquent
   * (… UNE EXPLOSION BIOLOGIQUE — Keko, 18/11 : « moins bruit de caisse claire, là on dirait vraiment un claquement ;
   * qu'on entende vraiment un son biologique, d'explosion biologique, de bonne qualité » : la caisse claire, c'était le
   * corps à quatre partiels saturé sous un souffle large autour de 1 100 Hz et un second vers 2 600 Hz. Plus rien d'aigu :
   * UN « BOUMF » SOURD (une fondamentale grave, presque sans partiels, qui s'enfonce), UN SOUFFLE ÉTOUFFÉ (passe-bas, qui
   * se referme — la chair qui cède), UN GARGOUILLIS (de petites résonances serrées, entre 300 et 800 Hz, en rafale), DES
   * BULLES QUI ÉCLATENT (des notes qui montent vite, le bruit d'un liquide) et quelques gouttes qui retombent)
   */
  splash: {
    duree: 0.8, niveau: 0.7, salle: [0.3, 0.1], variantes: 4,
    faire: (m, h) => {
      // (le boumf : la panse qui crève)
      note(m, 0, 0.9, 0, { f: 105 * (0.92 + 0.16 * h.next()), glisse: { vers: 42, en: 0.14 }, a: 0.006, d: 0.22, partiels: [[1, 1, 1], [2, 0.18, 0.6]], sature: 1.25 })
      // (la chair qui cède : un souffle grave, étouffé, qui se referme)
      souffle(m, h, 0, 0.8, 0, { f: 900, glisse: { vers: 180, en: 0.16 }, q: 0.9, a: 0.004, d: 0.2, large: true })
      // (le gargouillis : de petites résonances serrées, en rafale)
      for (let k = 0; k < 7; k++) {
        const t0 = 0.01 + k * 0.022 * (0.7 + 0.6 * h.next())
        souffle(m, h, t0, 0.45 * (1 - k / 9), (h.next() - 0.5) * 0.6, { f: 320 + 480 * h.next(), glisse: { vers: 200 + 200 * h.next(), en: 0.03 }, q: 7, bande: true, a: 0.002, d: 0.035 })
      }
      // (les bulles qui éclatent : des notes qui montent vite, rondes)
      for (let k = 0; k < 4; k++) {
        const f = 260 + 340 * h.next()
        note(m, 0.04 + 0.05 * k + 0.03 * h.next(), 0.22 * (1 - k / 6), (h.next() - 0.5) * 0.8, { f, glisse: { vers: f * 2.2, en: 0.03, droit: true }, a: 0.002, d: 0.045 })
      }
      // (quelques gouttes qui retombent, plus tard, plus douces)
      for (let k = 0; k < 3; k++) {
        const f = 380 + 300 * h.next()
        note(m, 0.22 + 0.09 * k + 0.05 * h.next(), 0.1, (h.next() - 0.5) * 1, { f, glisse: { vers: f * 1.8, en: 0.025, droit: true }, a: 0.002, d: 0.035 })
      }
    },
  },
  /**
   * un insecte passe le portail (le jeu du vortex — Keko, 14/11 : le son de l'extraction, joué là, « on dirait une
   * validation d'un menu alors que c'est un événement négatif ») : UNE PERTE — un grave qui s'effondre, deux notes
   * dissonantes qui DESCENDENT, un souffle avalé
   */
  breche: {
    duree: 1, niveau: 0.6, salle: [0.55, 0.22],
    faire: (m, h) => {
      note(m, 0, 0.9, 0, { f: 160, glisse: { vers: 55, en: 0.22, droit: true }, a: 0.006, d: 0.5, partiels: CORPS, sature: 2 })
      note(m, 0, 0.5, -0.25, { f: 466, glisse: { vers: 330, en: 0.25, droit: true }, a: 0.01, d: 0.4, partiels: [[1, 1, 1], [1.06, 0.7, 0.9]], battement: 14 })
      note(m, 0.12, 0.4, 0.25, { f: 330, glisse: { vers: 220, en: 0.25, droit: true }, a: 0.01, d: 0.4, partiels: [[1, 1, 1], [1.06, 0.6, 0.9]], battement: 11 })
      souffle(m, h, 0, 0.6, 0, { f: 1800, glisse: { vers: 240, en: 0.3, droit: true }, q: 1.1, bande: true, a: 0.02, d: 0.4, large: true })
    },
  },
  /** un trait du rival perce la coque : un choc mat, la tôle qui répond */
  touche: {
    duree: 0.7, niveau: 0.75, salle: [0.4, 0.15],
    faire: (m, h) => {
      note(m, 0, 1, 0, { f: 250, glisse: { vers: 125, en: 0.03 }, d: 0.18, partiels: CORPS, sature: 2 })
      souffle(m, h, 0, 0.8, 0, { f: 2200, glisse: { vers: 700, en: 0.04 }, d: 0.09 })
      note(m, 0, 0.6, 0, { f: 415, d: 0.14, partiels: [[1, 1, 1], [1.48, 0.6, 0.7]] })
    },
  },
  /**
   * le bouclier prend le coup : UN CHOC D'ÉNERGIE (Keko, 14/11 : la quinte de verre d'avant « ressemble plus à une
   * validation dans un menu qu'à de vrais dégâts ») — un coup sourd et saturé, un bourdonnement électrique dissonant
   * qui tombe, un crépitement
   */
  bouclier: {
    duree: 0.8, niveau: 0.6, salle: [0.4, 0.15],
    faire: (m, h) => {
      note(m, 0, 0.9, 0, { f: 190, glisse: { vers: 85, en: 0.05 }, a: 0.003, d: 0.2, partiels: CORPS, sature: 2.2 })
      note(m, 0, 0.6, -0.2, { f: 880, glisse: { vers: 300, en: 0.07 }, a: 0.003, d: 0.22, partiels: [[1, 1, 1], [1.41, 0.7, 0.8], [2.1, 0.4, 0.5]], battement: 38 })
      souffle(m, h, 0, 0.8, 0.1, { f: 3400, glisse: { vers: 900, en: 0.08 }, q: 1.2, bande: true, a: 0.002, d: 0.16, large: true })
      souffle(m, h, 0.05, 0.35, -0.2, { f: 5200, glisse: { vers: 2400, en: 0.05 }, q: 3, bande: true, a: 0.002, d: 0.08 })
    },
  },
  /**
   * une plaque de blindage prend le coup et casse (les humains, Keko, 17/11) : UN CLANG DE MÉTAL — un coup sec et sourd,
   * une tôle qui sonne (des partiels qui ne s'accordent pas, ceux d'une plaque), un grésillement, des éclats qui tombent
   */
  plaque: {
    duree: 0.9, niveau: 0.62, salle: [0.4, 0.16],
    faire: (m, h) => {
      note(m, 0, 0.9, 0, { f: 180, glisse: { vers: 115, en: 0.03 }, a: 0.002, d: 0.12, partiels: CORPS, sature: 2 })
      note(m, 0, 0.7, 0.15, { f: 640, a: 0.002, d: 0.34, partiels: [[1, 1, 1], [2.76, 0.6, 0.7], [5.4, 0.35, 0.5], [8.93, 0.2, 0.35]] })
      souffle(m, h, 0, 0.6, 0, { f: 4200, glisse: { vers: 1500, en: 0.05 }, d: 0.07 })
      eclats(m, h, 5, 0.03, 0.2, 0.5)
    },
  },
  /**
   * la corruption purgée (les Innommés, Keko, 17/11) : un frisson qui remonte — une note claire qui glisse vers l'octave,
   * battue, et un souffle qui s'élève
   */
  purge: {
    duree: 0.6, niveau: 0.28, salle: [0.45, 0.2],
    faire: (m, h) => {
      note(m, 0, 0.7, 0, { f: 520, glisse: { vers: 1040, en: 0.18 }, a: 0.01, d: 0.22, partiels: [[1, 1, 1], [2, 0.3, 0.6]], battement: 9 })
      souffle(m, h, 0, 0.3, 0.1, { f: 3000, glisse: { vers: 5000, en: 0.15 }, q: 2, bande: true, a: 0.01, d: 0.12 })
    },
  },
  /** l'extraction : l'accord de ré qui monte, en clochettes, sur une nappe */
  extrait: {
    duree: 2.2, niveau: 0.55, salle: [0.75, 0.3],
    faire: (m) => {
      note(m, 0, 0.3, 0, { f: RE4, a: 0.08, d: 0.9, partiels: [[1, 1, 1], [2, 0.2, 1]] })
      for (const [i, f] of [RE5, FAD5, LA5].entries()) note(m, 0.08 * i, 0.7, -0.3 + 0.3 * i, { f, d: 0.38, partiels: CLOCHE, battement: 5 })
      note(m, 0.24, 1, 0, { f: RE6, d: 0.85, partiels: CLOCHE, battement: 5 })
    },
  },
  /** la coque percée : un grondement qui s'affaisse, trois notes qui descendent (ré mineur) */
  perdu: {
    duree: 2.6, niveau: 1, salle: [0.85, 0.35],
    faire: (m, h) => {
      note(m, 0, 0.9, 0, { f: 190, glisse: { vers: 58, en: 0.4 }, a: 0.01, d: 1.3, partiels: CORPS, sature: 2 })
      souffle(m, h, 0, 0.9, 0, { f: 1600, glisse: { vers: 240, en: 0.5 }, a: 0.02, d: 1.2, large: true })
      for (const [i, f] of [LA4, FA4, RE4].entries()) note(m, 0.22 * i, 0.5, 0, { f, a: 0.01, d: 0.6, partiels: MAILLET })
    },
  },
  /**
   * LA BÊTE CRÈVE (Keko, 16/11 : la mort à l'image du vaisseau) : un coup sourd et mouillé, une giclée (un souffle qui
   * se ferme), une poignée de bulles qui éclatent, puis les trois notes qui descendent de `perdu`
   */
  perduBete: {
    duree: 2.6, niveau: 1, salle: [0.75, 0.3],
    faire: (m, h) => {
      note(m, 0, 0.9, 0, { f: 130, glisse: { vers: 48, en: 0.25 }, a: 0.006, d: 0.7, partiels: CORPS, battement: 120, sature: 2 })
      souffle(m, h, 0, 0.8, 0, { f: 1100, glisse: { vers: 260, en: 0.35 }, q: 1.4, bande: true, a: 0.01, d: 0.8, large: true })
      for (let k = 0; k < 12; k++) {
        const f = 160 + 380 * h.next()
        note(m, 0.04 + k * 0.045 + 0.03 * h.next(), 0.3 * (1 - k / 16), (h.next() - 0.5) * 0.9, { f, glisse: { vers: f * 2.2, en: 0.05, droit: true }, a: 0.004, d: 0.07 })
      }
      for (const [i, f] of [LA4, FA4, RE4].entries()) note(m, 0.3 + 0.22 * i, 0.5, 0, { f, a: 0.01, d: 0.6, partiels: MAILLET })
    },
  },
  /**
   * LE NÉANT S'EFFONDRE : tout est aspiré (un souffle qui monte et se serre), un silence d'un souffle, puis un grondement
   * très grave qui vibre et un balayage résonant qui retombe ; les trois notes de `perdu` par-dessus
   */
  perduNeant: {
    duree: 2.9, niveau: 1, salle: [0.85, 0.35],
    faire: (m, h) => {
      souffle(m, h, 0, 0.7, 0, { f: 180, glisse: { vers: 2600, en: 0.45, droit: true }, q: 2.5, bande: true, a: 0.42, d: 0.06, large: true })
      note(m, 0.5, 1, 0, { f: 52, glisse: { vers: 33, en: 0.9 }, a: 0.006, d: 1.5, partiels: [[1, 1, 1], [2, 0.7, 0.9], [3, 0.45, 0.7], [5, 0.2, 0.5]], battement: 200, sature: 2 })
      souffle(m, h, 0.5, 0.6, 0, { f: 1300, glisse: { vers: 140, en: 0.7 }, q: 4.5, bande: true, a: 0.01, d: 1.1, large: true })
      for (const [i, f] of [LA4, FA4, RE4].entries()) note(m, 0.75 + 0.22 * i, 0.45, 0, { f, a: 0.01, d: 0.6, partiels: MAILLET })
    },
  },
  // À LA BASE — un retour à chaque geste (Keko : « très juicy, un bon gamefeel »)
  /** un bouton : un « toc » de bois, court */
  clic: {
    duree: 0.3, niveau: 0.12, salle: [0.3, 0.12],
    faire: (m, h) => {
      note(m, 0, 1, 0, { f: 720, glisse: { vers: 540, en: 0.012 }, a: 0.002, d: 0.07, partiels: [[1, 1, 1], [2, 0.12, 0.5]] })
      souffle(m, h, 0, 0.15, 0, { f: 3000, d: 0.02 })
    },
  },
  /**
   * UN INSECTE SE CONSUME (le lance-flammes, Keko, 15/11 : « avec un son qui matche bien ») : l'embrasement — un souffle
   * qui s'ouvre d'un coup, un « whoump » —, puis des crépitements serrés et un grésillement aigu qui s'éteint
   */
  consume: {
    duree: 0.95, niveau: 0.3, salle: [0.3, 0.12], variantes: 3,
    faire: (m, h) => {
      souffle(m, h, 0, 1, 0, { f: 240, glisse: { vers: 1300, en: 0.16, droit: true }, q: 1.1, bande: true, a: 0.03, d: 0.28, large: true })
      souffle(m, h, 0.04, 0.45, 0, { f: 3400, q: 0.9, bande: true, a: 0.06, d: 0.5 })
      eclats(m, h, 10, 0.05, 0.65, 0.55)
    },
  },
  /**
   * UN DRONE TIRE : un « piou » de laser, GRAVE ET ROND (Keko, 15/11 : d'abord « un truc plus laser », puis, le premier
   * — 3 200 → 420 Hz, des harmoniques impairs, un zip — « on dirait des petits oiseaux qui chantent » : plus bas, plus
   * rond) : une chute de 1 100 à 280 Hz presque en sinus, une voix à l'octave du dessous qui lui donne du corps, deux
   * voix à peine désaccordées ; pas trop fort, ils tirent souvent
   */
  drone: {
    duree: 0.32, niveau: 0.13, salle: [0.25, 0.1], variantes: 3,
    faire: (m, h) => {
      const pan = (h.next() - 0.5) * 0.6
      const f = 1100 * (0.95 + 0.1 * h.next())
      note(m, 0, 1, pan, { f, glisse: { vers: 280, en: 0.12 }, a: 0.003, d: 0.15, battement: 10, partiels: [[1, 1, 1], [2, 0.16, 0.6]] })
      note(m, 0, 0.45, pan, { f: f / 2, glisse: { vers: 140, en: 0.12 }, a: 0.003, d: 0.13 })
    },
  },
  /**
   * UN MISSILE PART, SON MOTEUR S'ALLUME (Keko, 15/11 : « un truc qui évoque la propulsion d'un missile, qui s'allume et
   * qui se lance » — le « fssht » d'avant était trop court et trop aigu) : l'ALLUMAGE — un claquement sec et un petit
   * coup sourd —, puis LA POUSSÉE — un souffle grave et rugueux qui enfle en 40 ms, gronde, et s'éloigne en glissant
   * vers le bas —, et un grondement sous lui
   */
  minimissile: {
    duree: 0.7, niveau: 0.2, salle: [0.3, 0.12], variantes: 3,
    faire: (m, h) => {
      const pan = (h.next() - 0.5) * 0.5
      souffle(m, h, 0, 0.6, pan, { f: 3000, q: 1.5, bande: true, a: 0.001, d: 0.02 })
      note(m, 0, 0.5, 0, { f: 160, glisse: { vers: 90, en: 0.03 }, a: 0.001, d: 0.05 })
      souffle(m, h, 0.015, 1, pan, { f: 900, glisse: { vers: 420, en: 0.4 }, q: 0.9, bande: true, a: 0.04, d: 0.42, large: true })
      souffle(m, h, 0.015, 0.45, pan, { f: 2200, glisse: { vers: 1100, en: 0.3 }, q: 1.2, bande: true, a: 0.03, d: 0.2 })
      note(m, 0.015, 0.35, 0, { f: 70, glisse: { vers: 52, en: 0.35 }, a: 0.04, d: 0.35, partiels: CORPS, sature: 1.3 })
    },
  },
  /**
   * UN MISSILE EXPLOSE : un « boum » GRAVE (Keko, 15/11 : « un petit peu plus grave ») — un coup sourd qui tombe de 80 à
   * 32 Hz, un souffle bas qui retombe, quelques crépitements
   */
  // (… PLUS PROFOND ET MOINS MOU — Keko, 18/11 : « un peu mou et trop aigu ; un son d'explosion un petit peu plus profond » :
  // son coup sourd tombait de 80 à 32 Hz, sous ce qu'un haut-parleur de téléphone rend — on n'entendait que le souffle à
  // 900 Hz et les crépitements. Le corps est maintenant entre 140 et 55 Hz, saturé pour que ses harmoniques s'entendent ;
  // dessous, le grave d'avant ; un grondement en passe-bas qui traîne ; un claquement d'attaque de quelques millisecondes,
  // le punch ; des crépitements moins forts)
  explosionMini: {
    duree: 1, niveau: 0.36, salle: [0.42, 0.16], variantes: 3,
    faire: (m, h) => {
      note(m, 0, 1, 0, { f: 140, glisse: { vers: 55, en: 0.12 }, a: 0.001, d: 0.34, partiels: [[1, 1, 1], [2, 0.5, 0.8], [3, 0.25, 0.6]], sature: 2 })
      note(m, 0, 0.6, 0, { f: 60, glisse: { vers: 34, en: 0.25 }, a: 0.002, d: 0.42 })
      souffle(m, h, 0, 0.8, 0, { f: 520, glisse: { vers: 110, en: 0.4 }, q: 0.9, a: 0.002, d: 0.48, large: true })
      souffle(m, h, 0, 0.35, 0, { f: 2400, q: 0.7, bande: true, a: 0.0005, d: 0.012 })
      eclats(m, h, 3, 0.06, 0.4, 0.12)
    },
  },
  /**
   * LE RAYON THERMIQUE FAIT SON TOUR : une montée d'énergie — un bourdon riche qui glisse vers l'aigu pendant le tour —,
   * un souffle qui balaie d'une oreille à l'autre, des crépitements ; il dure le temps du tour
   */
  // (… QUI MONTE DU GRAVE VERS L'AIGU — Keko, 18/11 : « il va plutôt de l'aigu vers le grave, c'est un peu bizarre ; un
  // rayon, on l'imagine partir du grave et aller vers l'aigu, comme s'il se concentrait » : le bourdon montait à peine
  // (150 → 260) et le second souffle redescendait de 2 400 à 900 Hz. Tout monte maintenant : le bourdon de 90 à 420 Hz,
  // battu de moins en moins vite — il se resserre —, deux souffles qui grimpent l'un après l'autre, et à la fin une
  // pointe claire, la concentration)
  // (… SANS SA FIN DANS LES AIGUS — Keko, 18/11 : « la première partie rend bien, le monter vers les aigus à la fin rend
  // moche » : la seconde voix, le second souffle et la pointe claire sont partis ; le premier souffle plafonne à 1 000 Hz
  // au lieu de 1 600, les crépitements s'arrêtent à 0,6 s — reste la montée grave du bourdon)
  rayon: {
    duree: 1.3, niveau: 0.3, salle: [0.35, 0.14], variantes: 2,
    faire: (m, h) => {
      note(m, 0, 1, 0, { f: 90, glisse: { vers: 420, en: 0.95, droit: true }, a: 0.06, d: 0.95, battement: 14, partiels: [[1, 1, 1], [2, 0.55, 1], [3, 0.35, 1], [4, 0.2, 1]], sature: 1.3 })
      souffle(m, h, 0, 0.5, -0.5, { f: 400, glisse: { vers: 1000, en: 0.6, droit: true }, q: 1.2, bande: true, a: 0.1, d: 0.55 })
      eclats(m, h, 5, 0.1, 0.6, 0.2)
    },
  },
  /** UNE BOULE DE NAPALM PART : un « thoump » de mortier, sourd, et un glouglou de gel */
  napalm: {
    duree: 0.5, niveau: 0.24, salle: [0.3, 0.12], variantes: 3,
    faire: (m, h) => {
      note(m, 0, 1, 0, { f: 110, glisse: { vers: 62, en: 0.08 }, a: 0.002, d: 0.14, partiels: CORPS, sature: 1.4 })
      souffle(m, h, 0, 0.5, 0, { f: 700, glisse: { vers: 300, en: 0.08 }, q: 1.4, bande: true, a: 0.003, d: 0.1 })
      note(m, 0.03, 0.25, 0, { f: 320, glisse: { vers: 520, en: 0.05, droit: true }, a: 0.004, d: 0.06 })
    },
  },
  /** LA BOULE S'ÉCRASE EN FLAQUE DE FEU : un « splotch » mouillé, puis l'embrasement — un souffle qui s'ouvre et crépite */
  flaque: {
    duree: 0.8, niveau: 0.28, salle: [0.3, 0.12], variantes: 3,
    faire: (m, h) => {
      souffle(m, h, 0, 0.8, 0, { f: 1100, glisse: { vers: 280, en: 0.07 }, q: 1.5, bande: true, a: 0.002, d: 0.1 })
      note(m, 0, 0.5, 0, { f: 130, glisse: { vers: 70, en: 0.05 }, a: 0.002, d: 0.09, partiels: CORPS })
      souffle(m, h, 0.04, 0.9, 0, { f: 350, glisse: { vers: 1500, en: 0.2, droit: true }, q: 0.9, bande: true, a: 0.05, d: 0.35, large: true })
      eclats(m, h, 6, 0.08, 0.5, 0.35)
    },
  },
  /** UN ARC ÉLECTRIQUE (un drone, l'aura) : un claquement sec et grésillant, un petit bourdon d'électricité */
  zap: {
    duree: 0.25, niveau: 0.13, salle: [0.2, 0.08], variantes: 4,
    faire: (m, h) => {
      souffle(m, h, 0, 1, (h.next() - 0.5) * 0.6, { f: 3600, q: 1.8, bande: true, a: 0.001, d: 0.035 })
      note(m, 0, 0.35, 0, { f: 95 + 30 * h.next(), a: 0.001, d: 0.06, partiels: [[1, 1, 1], [3, 0.5, 1], [5, 0.3, 1], [7, 0.2, 1]] })
    },
  },
  /** LA CHAÎNE D'ÉCLAIRS : un grand craquement, ses rebonds en cascade, un grondement d'électricité */
  chaine: {
    duree: 0.8, niveau: 0.3, salle: [0.35, 0.14], variantes: 3,
    faire: (m, h) => {
      for (let k = 0; k < 5; k++) souffle(m, h, k * 0.035, 1 - k * 0.15, (h.next() - 0.5) * 0.8, { f: 4200 - k * 400, glisse: { vers: 1500, en: 0.08 }, q: 1.4, bande: true, a: 0.001, d: 0.07 })
      note(m, 0, 0.6, 0, { f: 75, glisse: { vers: 50, en: 0.2 }, a: 0.002, d: 0.25, partiels: [[1, 1, 1], [3, 0.5, 1], [5, 0.3, 1]], sature: 1.4 })
    },
  },
  /** UNE TOURELLE TIRE : un « tac » mécanique, sec, un petit coup sourd dessous — pas un laser */
  tourelle: {
    duree: 0.25, niveau: 0.13, salle: [0.2, 0.08], variantes: 3,
    faire: (m, h) => {
      souffle(m, h, 0, 1, (h.next() - 0.5) * 0.5, { f: 1700, q: 1.6, bande: true, a: 0.001, d: 0.035 })
      note(m, 0, 0.6, 0, { f: 190, glisse: { vers: 110, en: 0.05 }, a: 0.002, d: 0.06 })
    },
  },
  /** UNE CAPSULE DE TOURELLE EST LANCÉE : un déclic de ressort et un petit souffle qui monte */
  lance: {
    duree: 0.35, niveau: 0.16, salle: [0.25, 0.1], variantes: 2,
    faire: (m, h) => {
      note(m, 0, 0.6, 0, { f: 700, a: 0.001, d: 0.04, partiels: [[1, 1, 1], [2.6, 0.4, 0.5]] })
      souffle(m, h, 0.01, 0.7, 0, { f: 500, glisse: { vers: 1400, en: 0.14, droit: true }, q: 1.2, bande: true, a: 0.01, d: 0.14 })
    },
  },
  /**
   * LA SCIE EST LANCÉE : le sifflement d'une lame qui tourne — un ton métallique, des partiels inharmoniques, battu vite
   * (les dents), qui glisse vers le bas en s'éloignant —, et le souffle du lancer
   */
  scie: {
    duree: 0.9, niveau: 0.2, salle: [0.3, 0.12], variantes: 3,
    faire: (m, h) => {
      const f = 1500 * (0.95 + 0.1 * h.next())
      note(m, 0, 0.7, 0, { f, glisse: { vers: f * 0.7, en: 0.7 }, a: 0.01, d: 0.75, battement: 38, partiels: [[1, 1, 1], [1.51, 0.45, 0.8], [2.73, 0.25, 0.6]] })
      souffle(m, h, 0, 0.6, 0, { f: 700, glisse: { vers: 1800, en: 0.12, droit: true }, q: 1.2, bande: true, a: 0.005, d: 0.16 })
      souffle(m, h, 0.05, 0.3, 0, { f: 4200, glisse: { vers: 2600, en: 0.6 }, q: 2, bande: true, a: 0.02, d: 0.6 })
    },
  },
  /**
   * UNE LIGNE DE BALISES S'ÉCLAIRE (Keko, 15/11 : la ligne franchie s'éclaire, à la place des rivets) : un « zing »
   * électrique et clair — un ton qui monte d'un coup puis retombe, battu, un grésillement court
   */
  balise: {
    duree: 0.35, niveau: 0.16, salle: [0.25, 0.1], variantes: 3,
    faire: (m, h) => {
      const f = 1300 * (0.94 + 0.12 * h.next())
      note(m, 0, 0.8, 0, { f: f * 0.7, glisse: { vers: f, en: 0.02, droit: true }, a: 0.001, d: 0.16, battement: 24, partiels: [[1, 1, 1], [2, 0.35, 0.7], [3, 0.2, 0.5]] })
      souffle(m, h, 0, 0.5, 0, { f: 3800, q: 1.6, bande: true, a: 0.001, d: 0.05 })
    },
  },
  /**
   * UN INSECTE ENTRE DANS LE GIVRE : la glace qui le saisit — un craquement sec et aigu, trois tintements de cristal
   * inharmoniques qui s'égrènent, un souffle froid très bref
   */
  gel: {
    duree: 0.45, niveau: 0.12, salle: [0.3, 0.12], variantes: 4,
    faire: (m, h) => {
      const pan = (h.next() - 0.5) * 0.6
      souffle(m, h, 0, 0.7, pan, { f: 5200, q: 2, bande: true, a: 0.001, d: 0.03 })
      for (let k = 0; k < 3; k++) note(m, 0.012 + k * 0.03 + 0.01 * h.next(), 0.4 - k * 0.08, pan, { f: 2600 + 1400 * h.next(), a: 0.001, d: 0.12 + 0.05 * k, partiels: [[1, 1, 1], [2.76, 0.4, 0.5], [5.4, 0.2, 0.3]] })
      souffle(m, h, 0, 0.25, pan, { f: 2400, glisse: { vers: 1200, en: 0.15 }, q: 0.8, bande: true, a: 0.01, d: 0.15 })
    },
  },
  /**
   * UNE SALVE D'ÉCLATS DE GLACE PART : la glace qui éclate en couronne — un claquement sec et clair, une gerbe de
   * tintements aigus jetés d'une oreille à l'autre, un sifflement froid qui s'éloigne
   */
  eclats: {
    duree: 0.6, niveau: 0.2, salle: [0.3, 0.12], variantes: 3,
    faire: (m, h) => {
      souffle(m, h, 0, 0.9, 0, { f: 3600, glisse: { vers: 2000, en: 0.04 }, q: 1.4, bande: true, a: 0.001, d: 0.05 })
      for (let k = 0; k < 8; k++) note(m, 0.005 + k * 0.012, 0.32, Math.cos((k * Math.PI) / 4) * 0.8, { f: 2400 + 1600 * h.next(), a: 0.001, d: 0.09 + 0.06 * h.next(), partiels: [[1, 1, 1], [2.76, 0.35, 0.5]] })
      souffle(m, h, 0.02, 0.35, 0, { f: 5000, glisse: { vers: 2600, en: 0.35 }, q: 2, bande: true, a: 0.01, d: 0.35 })
    },
  },
  /**
   * UNE NOVA DE GIVRE PART (le Frimas, 17/11) : le froid qui s'abat d'un coup tout autour — un claquement sourd, une onde
   * de souffle froid qui s'ouvre d'une oreille à l'autre, une pluie de tintements de cristal qui jaillissent
   */
  nova: {
    duree: 0.9, niveau: 0.24, salle: [0.4, 0.16], variantes: 3,
    faire: (m, h) => {
      note(m, 0, 0.6, 0, { f: 260, glisse: { vers: 120, en: 0.18 }, a: 0.002, d: 0.22, partiels: [[1, 1, 1], [2, 0.3, 0.6]] })
      souffle(m, h, 0, 0.8, -0.5, { f: 1800, glisse: { vers: 4200, en: 0.3 }, q: 1.2, bande: true, a: 0.01, d: 0.45, large: true })
      souffle(m, h, 0.02, 0.6, 0.5, { f: 2400, glisse: { vers: 5000, en: 0.3 }, q: 1.6, bande: true, a: 0.01, d: 0.4 })
      for (let k = 0; k < 10; k++) note(m, 0.04 + k * 0.025 + 0.01 * h.next(), 0.28, Math.cos((k * Math.PI) / 5) * 0.85, { f: 2200 + 1800 * h.next(), a: 0.001, d: 0.1 + 0.08 * h.next(), partiels: [[1, 1, 1], [2.76, 0.35, 0.5], [5.4, 0.15, 0.3]] })
    },
  },
  /**
   * UNE TORNADE DE GIVRE SE LÈVE : le vent qui monte — un souffle filtré qui enfle et tourne d'une oreille à l'autre,
   * son sifflement qui monte, quelques tintements de glace emportés
   */
  tornade: {
    duree: 1.4, niveau: 0.22, salle: [0.4, 0.16], variantes: 2,
    faire: (m, h) => {
      souffle(m, h, 0, 0.8, -0.6, { f: 500, glisse: { vers: 1400, en: 0.7, droit: true }, q: 1.2, bande: true, a: 0.25, d: 0.9, large: true })
      souffle(m, h, 0.15, 0.6, 0.6, { f: 900, glisse: { vers: 2200, en: 0.7, droit: true }, q: 2.2, bande: true, a: 0.2, d: 0.8 })
      note(m, 0.1, 0.18, 0, { f: 700, glisse: { vers: 1300, en: 0.8, droit: true }, a: 0.2, d: 0.8, battement: 6 })
      for (let k = 0; k < 4; k++) note(m, 0.3 + k * 0.15 + 0.05 * h.next(), 0.18, (h.next() - 0.5) * 0.9, { f: 2600 + 1500 * h.next(), a: 0.001, d: 0.12, partiels: [[1, 1, 1], [2.76, 0.3, 0.5]] })
    },
  },
  /**
   * UNE ORBE DE PLASMA PART (le Pulsar, 16/11) : une décharge d'énergie qui se condense — un bourdon riche qui plonge puis
   * remonte en vibrant, un souffle électrique bref, un ton clair qui ondule
   */
  plasma: {
    duree: 0.7, niveau: 0.22, salle: [0.35, 0.14], variantes: 3,
    faire: (m, h) => {
      note(m, 0, 1, 0, { f: 260, glisse: { vers: 140, en: 0.07 }, a: 0.002, d: 0.3, battement: 14, partiels: [[1, 1, 1], [2, 0.5, 0.8], [3, 0.35, 0.6], [5, 0.2, 0.4]], sature: 1.3 })
      souffle(m, h, 0, 0.5, 0, { f: 3000, glisse: { vers: 1400, en: 0.08 }, q: 1.5, bande: true, a: 0.001, d: 0.07 })
      note(m, 0.03, 0.3, 0, { f: 900 * (0.95 + 0.1 * h.next()), glisse: { vers: 1400, en: 0.35, droit: true }, a: 0.01, d: 0.4, battement: 11 })
    },
  },
  /**
   * UN ESSAIM DE MISSILES DE PLASMA PART (16/11) : une volée de six sifflements d'énergie qui montent, lancés l'un après
   * l'autre en quelques centièmes d'une oreille à l'autre, sur un petit bourdon qui vibre
   */
  essaim: {
    duree: 0.8, niveau: 0.22, salle: [0.35, 0.14], variantes: 3,
    faire: (m, h) => {
      note(m, 0, 0.5, 0, { f: 180, glisse: { vers: 120, en: 0.1 }, a: 0.002, d: 0.18, battement: 16, partiels: [[1, 1, 1], [2, 0.5, 0.8], [3, 0.3, 0.6]] })
      for (let k = 0; k < 6; k++) {
        const f = 700 + 260 * h.next()
        note(m, k * 0.028 + 0.008 * h.next(), 0.42, (k % 2 === 0 ? -1 : 1) * (0.25 + 0.12 * k), { f, glisse: { vers: f * 2.1, en: 0.14, droit: true }, a: 0.003, d: 0.16, battement: 22, partiels: [[1, 1, 1], [2, 0.3, 0.6]] })
      }
      souffle(m, h, 0, 0.35, 0, { f: 2600, glisse: { vers: 4200, en: 0.15, droit: true }, q: 1.6, bande: true, a: 0.005, d: 0.14 })
    },
  },
  /**
   * LE RAILGUN TIRE (16/11) : une charge qui siffle en montant très vite, puis LE CLAQUEMENT — un souffle large et brillant,
   * un coup grave qui tombe —, et une traîne métallique qui vibre et s'éloigne
   */
  rail: {
    duree: 1.2, niveau: 0.34, salle: [0.45, 0.18], variantes: 2,
    faire: (m, h) => {
      note(m, 0, 0.35, 0, { f: 600, glisse: { vers: 3200, en: 0.07, droit: true }, a: 0.01, d: 0.08, partiels: [[1, 1, 1], [2, 0.3, 0.6]] })
      souffle(m, h, 0.07, 1, 0, { f: 5200, glisse: { vers: 1600, en: 0.12 }, q: 0.9, bande: true, a: 0.001, d: 0.16, large: true })
      note(m, 0.07, 0.9, 0, { f: 110, glisse: { vers: 38, en: 0.25 }, a: 0.002, d: 0.35, partiels: CORPS, sature: 1.8 })
      note(m, 0.08, 0.3, -0.4, { f: 1900, glisse: { vers: 900, en: 0.8 }, a: 0.003, d: 0.85, battement: 19, partiels: [[1, 1, 1], [2.76, 0.3, 0.5]] })
      note(m, 0.09, 0.25, 0.4, { f: 1420, glisse: { vers: 680, en: 0.8 }, a: 0.003, d: 0.85, battement: 15, partiels: [[1, 1, 1], [2.76, 0.3, 0.5]] })
    },
  },
  /** UNE TENTACULE FOUETTE (le Kraken, 16/11) : un sifflement d'air bref qui monte, et un claquement mouillé, sourd */
  fouet: {
    duree: 0.4, niveau: 0.16, salle: [0.25, 0.1], variantes: 4,
    faire: (m, h) => {
      souffle(m, h, 0, 0.7, (h.next() - 0.5) * 0.5, { f: 900, glisse: { vers: 2400, en: 0.12, droit: true }, q: 1.3, bande: true, a: 0.02, d: 0.1 })
      souffle(m, h, 0.12, 0.6, 0, { f: 700, glisse: { vers: 300, en: 0.05 }, q: 1.6, bande: true, a: 0.001, d: 0.05 })
      note(m, 0.12, 0.35, 0, { f: 170, glisse: { vers: 90, en: 0.05 }, a: 0.002, d: 0.06 })
    },
  },
  /** L'ESSAIM MORD : un bourdonnement d'insectes qui grince — des bourdons serrés, battus vite, un grésillement */
  morsure: {
    duree: 0.4, niveau: 0.12, salle: [0.2, 0.08], variantes: 4,
    faire: (m, h) => {
      for (let k = 0; k < 3; k++) note(m, 0.02 * k, 0.4, (h.next() - 0.5) * 0.8, { f: 200 + 90 * h.next(), a: 0.02, d: 0.22, battement: 34 + 10 * k, partiels: [[1, 1, 1], [2, 0.6, 1], [3, 0.4, 1], [5, 0.2, 1]] })
      souffle(m, h, 0, 0.3, 0, { f: 3000, q: 1.5, bande: true, a: 0.01, d: 0.12 })
    },
  },
  /**
   * LES MINI-VERS MORDENT : le même bourdonnement que la nuée, plus bas (Keko, 19/11 : « le son d'attaque des mini-vers
   * qui sortent des œufs est un petit peu trop fort »), à moitié de son niveau
   */
  morsureVer: {
    duree: 0.4, niveau: 0.06, salle: [0.2, 0.08], variantes: 4,
    faire: (m, h) => {
      for (let k = 0; k < 3; k++) note(m, 0.02 * k, 0.4, (h.next() - 0.5) * 0.8, { f: 200 + 90 * h.next(), a: 0.02, d: 0.22, battement: 34 + 10 * k, partiels: [[1, 1, 1], [2, 0.6, 1], [3, 0.4, 1], [5, 0.2, 1]] })
      souffle(m, h, 0, 0.3, 0, { f: 3000, q: 1.5, bande: true, a: 0.01, d: 0.12 })
    },
  },
  /** LA VOUIVRE CRACHE : un raclement de gorge bref, puis le jet — un souffle mouillé qui s'élargit, des éclaboussures */
  // (… PUIS UN SON ROND DE LIQUIDE — Keko, 16/11 : « un son un peu claquant, presque comme un coup de taser ; plutôt un
  // bruit plus rond de liquide » : plus de bourdon battu ni de claquements aigus — trois BULLES qui crèvent, des notes
  // pures qui glissent vers le haut, sur un clapotis sourd et doux)
  crachat: {
    duree: 0.6, niveau: 0.22, salle: [0.3, 0.12], variantes: 3,
    faire: (m, h) => {
      souffle(m, h, 0, 0.7, 0, { f: 700, glisse: { vers: 320, en: 0.18 }, q: 0.9, bande: true, a: 0.02, d: 0.22, large: true })
      for (let k = 0; k < 3; k++) {
        const f = 240 + 160 * h.next() + 90 * k
        note(m, 0.02 + 0.06 * k + 0.02 * h.next(), 0.55 - 0.1 * k, (h.next() - 0.5) * 0.5, { f, glisse: { vers: f * 2, en: 0.05, droit: true }, a: 0.004, d: 0.07 })
      }
    },
  },
  /** LE FLÉAU FRAPPE : un choc sourd et lourd, un tintement de métal par-dessus, le cliquetis de la chaîne */
  fleau: {
    duree: 0.5, niveau: 0.24, salle: [0.3, 0.12], variantes: 3,
    faire: (m, h) => {
      note(m, 0, 1, 0, { f: 120, glisse: { vers: 60, en: 0.06 }, a: 0.001, d: 0.12, partiels: CORPS, sature: 1.6 })
      note(m, 0.002, 0.35, (h.next() - 0.5) * 0.5, { f: 900 + 300 * h.next(), a: 0.001, d: 0.15, partiels: [[1, 1, 1], [2.71, 0.4, 0.5], [5.2, 0.2, 0.3]] })
      for (let k = 0; k < 3; k++) souffle(m, h, 0.04 + 0.03 * k, 0.2, 0, { f: 3500, q: 2, bande: true, a: 0.001, d: 0.02 })
    },
  },
  /** LA CHAÎNE DU FLÉAU FOUETTE : un cliquetis de maillons, sec et clair (« chaine » est la chaîne d'éclairs) */
  maillons: {
    duree: 0.25, niveau: 0.12, salle: [0.2, 0.08], variantes: 3,
    faire: (m, h) => {
      for (let k = 0; k < 3; k++) note(m, 0.015 * k, 0.6 - k * 0.15, (h.next() - 0.5) * 0.5, { f: 1800 + 700 * h.next(), a: 0.001, d: 0.04, partiels: [[1, 1, 1], [2.71, 0.4, 0.5]] })
    },
  },
  /** UNE LARVE EST CRACHÉE : un petit couinement mouillé — une note qui monte et se tord, un souffle bref */
  parasite: {
    duree: 0.35, niveau: 0.15, salle: [0.25, 0.1], variantes: 3,
    faire: (m, h) => {
      const f = 520 + 160 * h.next()
      note(m, 0, 0.8, 0, { f, glisse: { vers: f * 1.6, en: 0.09, droit: true }, a: 0.004, d: 0.1, battement: 18, partiels: [[1, 1, 1], [2, 0.3, 0.6]] })
      souffle(m, h, 0, 0.35, 0, { f: 900, glisse: { vers: 500, en: 0.08 }, q: 1.4, bande: true, a: 0.003, d: 0.07 })
    },
  },
  /** UNE MINE D'ACIDE PART DU DOS : un « blop » gras, une note ronde qui monte, un petit souffle */
  mine: {
    duree: 0.4, niveau: 0.17, salle: [0.25, 0.1], variantes: 3,
    faire: (m, h) => {
      note(m, 0, 0.9, 0, { f: 200, glisse: { vers: 360, en: 0.08, droit: true }, a: 0.003, d: 0.1, partiels: [[1, 1, 1], [2, 0.3, 0.6]] })
      souffle(m, h, 0, 0.35, 0, { f: 700, glisse: { vers: 1300, en: 0.1, droit: true }, q: 1.4, bande: true, a: 0.005, d: 0.1 })
    },
  },
  /** LA MINE ÉCLATE EN GAZ : un « pchouf » mouillé — un coup sourd, un souffle large qui s'étale et siffle en retombant */
  gaz: {
    duree: 0.9, niveau: 0.28, salle: [0.35, 0.14], variantes: 3,
    faire: (m, h) => {
      note(m, 0, 0.7, 0, { f: 90, glisse: { vers: 45, en: 0.12 }, a: 0.002, d: 0.2, partiels: CORPS, sature: 1.4 })
      souffle(m, h, 0, 1, 0, { f: 1400, glisse: { vers: 500, en: 0.3 }, q: 0.8, bande: true, a: 0.002, d: 0.45, large: true })
      souffle(m, h, 0.05, 0.4, 0, { f: 4200, glisse: { vers: 2800, en: 0.5 }, q: 1.5, bande: true, a: 0.02, d: 0.5 })
    },
  },
  /** L'ACIDE RONGE UN INSECTE : un grésillement qui siffle et s'éteint */
  ronge: {
    duree: 0.45, niveau: 0.12, salle: [0.2, 0.08], variantes: 3,
    faire: (m, h) => {
      souffle(m, h, 0, 0.8, (h.next() - 0.5) * 0.5, { f: 5200, glisse: { vers: 3600, en: 0.35 }, q: 1.2, bande: true, a: 0.005, d: 0.35 })
      souffle(m, h, 0, 0.3, 0, { f: 1500, q: 2, bande: true, a: 0.002, d: 0.1 })
    },
  },
  /** UN REJETON EST PONDU : un « blop » gluant — une note ronde qui plonge, un gargouillis qui remonte */
  ponte: {
    duree: 0.45, niveau: 0.16, salle: [0.25, 0.1], variantes: 3,
    faire: (m, h) => {
      note(m, 0, 0.9, 0, { f: 320, glisse: { vers: 140, en: 0.08 }, a: 0.003, d: 0.12, partiels: [[1, 1, 1], [2, 0.3, 0.6]] })
      note(m, 0.06, 0.4, 0, { f: 240 + 60 * h.next(), glisse: { vers: 480, en: 0.1, droit: true }, a: 0.005, d: 0.12, battement: 22 })
      souffle(m, h, 0, 0.3, 0, { f: 900, glisse: { vers: 400, en: 0.1 }, q: 1.5, bande: true, a: 0.002, d: 0.08 })
    },
  },
  /** L'AIGUILLE SE PLANTE : un « tchk » charnu — un coup sec et grave, un petit bruit humide qui gargouille */
  piqure: {
    duree: 0.35, niveau: 0.17, salle: [0.2, 0.08], variantes: 4,
    faire: (m, h) => {
      note(m, 0, 0.8, 0, { f: 260, glisse: { vers: 120, en: 0.04 }, a: 0.001, d: 0.05, partiels: CORPS, sature: 1.3 })
      souffle(m, h, 0, 0.6, 0, { f: 2400, q: 2, bande: true, a: 0.001, d: 0.02 })
      note(m, 0.03, 0.25, 0, { f: 380 + 120 * h.next(), glisse: { vers: 520, en: 0.04, droit: true }, a: 0.003, d: 0.05, battement: 30 })
    },
  },
  /** L'ÉPINE D'OS PART (le Ver, 18/11) : un « fssh » lourd qui fend l'air — un souffle qui descend —, et le claquement sec de l'os */
  epine: {
    duree: 0.4, niveau: 0.2, salle: [0.25, 0.1], variantes: 3,
    faire: (m, h) => {
      souffle(m, h, 0, 0.9, 0, { f: 1800, glisse: { vers: 600, en: 0.2 }, q: 1.4, bande: true, a: 0.01, d: 0.2 })
      note(m, 0, 0.5, 0, { f: 900 + 200 * h.next(), glisse: { vers: 500, en: 0.03 }, a: 0.001, d: 0.03, partiels: [[1, 1, 1], [2.3, 0.5, 0.6]] })
    },
  },
  /** L'HYPERCUBE PART (le Tesseract, 18/11) : un « vwoum » d'énergie qui monte, battu — le cube qui se retourne —, un souffle qui s'élève */
  hypercube: {
    duree: 0.45, niveau: 0.13, salle: [0.3, 0.12], variantes: 3,
    faire: (m, h) => {
      const f = 330 * (0.95 + 0.1 * h.next())
      note(m, 0, 0.8, 0, { f, glisse: { vers: f * 2, en: 0.18, droit: true }, a: 0.01, d: 0.2, battement: 18, partiels: [[1, 1, 1], [1.5, 0.35, 0.7]] })
      souffle(m, h, 0, 0.35, 0, { f: 1800, glisse: { vers: 3200, en: 0.2, droit: true }, q: 1.4, bande: true, a: 0.02, d: 0.15 })
    },
  },
  /** L'HYPERCUBE TOUCHE LE SOL (le Tesseract, 18/11) : un « tonk » creux et cristallin — un coup bref, une note ronde de verre épais qui sonne un instant */
  rebondHypercube: {
    duree: 0.5, niveau: 0.15, salle: [0.3, 0.12], variantes: 3,
    faire: (m, h) => {
      note(m, 0, 0.7, 0, { f: 150, glisse: { vers: 80, en: 0.05 }, a: 0.001, d: 0.08, partiels: CORPS, sature: 1.2 })
      note(m, 0, 0.6, 0, { f: 620 * (0.95 + 0.1 * h.next()), a: 0.002, d: 0.25, partiels: [[1, 1, 1], [2.76, 0.3, 0.5], [5.4, 0.12, 0.3]] })
      souffle(m, h, 0, 0.35, 0, { f: 3000, q: 1.3, bande: true, a: 0.001, d: 0.04 })
    },
  },
  /**
   * LE DÉ DU DESTIN PARAÎT ET ROULE (le Tesseract, 18/11) : une note de verre qui s'ouvre, puis des « tic » cristallins de
   * plus en plus espacés — le dé qui roule et ralentit —, et à 0,9 s (son `roule`) un tintement de cloche : le chiffre est tombé
   */
  de: {
    duree: 1.5, niveau: 0.12, salle: [0.35, 0.14], variantes: 3,
    faire: (m, h) => {
      note(m, 0, 0.5, 0, { f: 520, glisse: { vers: 1040, en: 0.15, droit: true }, a: 0.02, d: 0.15, battement: 16 })
      let t0 = 0.08
      for (let k = 0; k < 9 && t0 < 0.82; k++) {
        note(m, t0, 0.45, (h.next() - 0.5) * 0.5, { f: 1500 + 700 * h.next(), a: 0.001, d: 0.03, partiels: [[1, 1, 1], [2.76, 0.3, 0.5]] })
        souffle(m, h, t0, 0.15, 0, { f: 4000, q: 2, bande: true, a: 0.001, d: 0.015 })
        t0 += 0.05 + 0.017 * k * k
      }
      note(m, 0.9, 0.7, 0, { f: 990, a: 0.002, d: 0.5, battement: 6, partiels: [[1, 1, 1], [2.76, 0.35, 0.6], [5.4, 0.15, 0.35]] })
    },
  },
  /**
   * LA COUPE (le Tesseract, 18/11) : le cube traverse le plan en 2 s — un chant de verre qui monte pendant que la tranche
   * s'ouvre, puis redescend pendant qu'elle se referme, battu, dans un souffle large qui scintille
   */
  coupe: {
    duree: 2.4, niveau: 0.11, salle: [0.45, 0.18], variantes: 2,
    faire: (m, h) => {
      const f = 392 * (0.97 + 0.06 * h.next())
      note(m, 0, 0.7, 0, { f, glisse: { vers: f * 1.5, en: 1, droit: true }, a: 0.3, d: 0.75, battement: 10, partiels: [[1, 1, 1], [2, 0.3, 0.7], [3, 0.15, 0.5]] })
      note(m, 1, 0.7, 0, { f: f * 1.5, glisse: { vers: f, en: 1 }, a: 0.05, d: 1, battement: 10, partiels: [[1, 1, 1], [2, 0.3, 0.7], [3, 0.15, 0.5]] })
      souffle(m, h, 0, 0.3, 0, { f: 2600, glisse: { vers: 4200, en: 1, droit: true }, q: 1.6, bande: true, a: 0.8, d: 1.2, large: true })
    },
  },
  /** LE POINT FINAL DE LA COUPE FRAPPE ET SON FAISCEAU JAILLIT : un coup sourd, un « tching » de cristal clair qui monte, un souffle qui s'élève */
  pointCoupe: {
    duree: 0.9, niveau: 0.2, salle: [0.4, 0.16], variantes: 3,
    faire: (m, h) => {
      note(m, 0, 0.8, 0, { f: 140, glisse: { vers: 60, en: 0.12 }, a: 0.001, d: 0.18, partiels: CORPS, sature: 1.4 })
      note(m, 0, 0.7, 0, { f: 1320 * (0.97 + 0.06 * h.next()), glisse: { vers: 2100, en: 0.15, droit: true }, a: 0.001, d: 0.45, battement: 8, partiels: [[1, 1, 1], [2.76, 0.3, 0.5], [5.4, 0.12, 0.3]] })
      souffle(m, h, 0, 0.4, 0, { f: 2400, glisse: { vers: 6000, en: 0.2, droit: true }, q: 1.5, bande: true, a: 0.005, d: 0.25 })
    },
  },
  /** LE DÉ S'ABAT : un coup grave et lourd, un éclat de verre qui se brise, des éclats qui tintent */
  impactDe: {
    duree: 0.9, niveau: 0.26, salle: [0.4, 0.16], variantes: 3,
    faire: (m, h) => {
      note(m, 0, 1, 0, { f: 120, glisse: { vers: 42, en: 0.2 }, a: 0.002, d: 0.3, partiels: CORPS, sature: 1.6 })
      souffle(m, h, 0, 0.8, 0, { f: 3200, glisse: { vers: 1000, en: 0.1 }, q: 1.2, bande: true, a: 0.001, d: 0.12 })
      for (let k = 0; k < 5; k++) note(m, 0.02 + 0.05 * k * (0.6 + 0.4 * h.next()), 0.28 * (1 - k / 7), (h.next() - 0.5) * 0.9, { f: 1300 + 1500 * h.next(), a: 0.002, d: 0.1 + 0.12 * h.next(), partiels: [[1, 1, 1], [2.76, 0.3, 0.5]] })
    },
  },
  /** UN PETIT TRAIT ARCANIQUE PART DE LA SPHÈRE : un « tsip » clair et bref qui monte, à peine battu */
  arcane: {
    duree: 0.25, niveau: 0.1, salle: [0.25, 0.1], variantes: 4,
    faire: (m, h) => {
      const f = 1500 + 500 * h.next()
      note(m, 0, 1, (h.next() - 0.5) * 0.6, { f, glisse: { vers: f * 1.7, en: 0.06, droit: true }, a: 0.002, d: 0.08, battement: 26, partiels: [[1, 1, 1], [2, 0.25, 0.6]] })
      souffle(m, h, 0, 0.3, 0, { f: 4200, q: 1.8, bande: true, a: 0.001, d: 0.025 })
    },
  },
  /**
   * LE DRAIN D'ÂME ACCROCHE UNE ÂME (le Néant, Keko, 17/11 : le frisson de la purge était « un petit peu trop agressif ») :
   * un souffle sourd qui monte lentement, une note grave et ronde qui ondule — rien de vif, il en sonne beaucoup
   */
  accroche: {
    duree: 0.7, niveau: 0.1, salle: [0.45, 0.2], variantes: 3,
    faire: (m, h) => {
      souffle(m, h, 0, 0.6, 0, { f: 500, glisse: { vers: 1100, en: 0.35 }, q: 1.1, bande: true, a: 0.12, d: 0.3 })
      note(m, 0.02, 0.5, 0, { f: 196 * (0.97 + 0.06 * h.next()), glisse: { vers: 262, en: 0.4 }, a: 0.1, d: 0.35, battement: 5 })
    },
  },
  /** LA SPHÈRE S'ÉTEINT : un souffle d'énergie qui se resserre et retombe, doux */
  dissipe: {
    duree: 0.6, niveau: 0.14, salle: [0.35, 0.14], variantes: 2,
    faire: (m, h) => {
      souffle(m, h, 0, 0.7, 0, { f: 2600, glisse: { vers: 700, en: 0.3 }, q: 1.3, bande: true, a: 0.01, d: 0.3 })
      note(m, 0, 0.4, 0, { f: 520, glisse: { vers: 260, en: 0.3 }, a: 0.01, d: 0.3, battement: 12 })
    },
  },
  /**
   * L'ORBE ÉCLATE : une gerbe d'énergie, pas une explosion de feu — un éclair clair et grésillant, un coup grave qui
   * tombe, une traîne qui scintille et ondule d'une oreille à l'autre
   */
  /** UN PUITS DE PLASMA PART (le Pulsar, 16/11) : un « vloum » sourd et lourd, un ton qui tombe, un souffle bref */
  puits: {
    duree: 0.6, niveau: 0.22, salle: [0.35, 0.14], variantes: 3,
    faire: (m, h) => {
      note(m, 0, 1, 0, { f: 180 * (0.95 + 0.1 * h.next()), glisse: { vers: 70, en: 0.25 }, a: 0.004, d: 0.35, battement: 7, partiels: [[1, 1, 1], [2, 0.4, 0.7], [3, 0.2, 0.5]], sature: 1.2 })
      souffle(m, h, 0, 0.4, 0, { f: 900, glisse: { vers: 300, en: 0.15 }, q: 1.2, bande: true, a: 0.003, d: 0.12 })
    },
  },
  /**
   * UNE MÉTÉORE D'ARCANE TOMBE (le Pulsar, 16/11) : un sifflement qui descend pendant toute la chute (0,6 s), battu, avec
   * un souffle qui grossit — on l'entend venir d'en haut ; l'impact a son son à lui (`impactMeteore`)
   */
  meteore: {
    duree: 0.75, niveau: 0.13, salle: [0.35, 0.14], variantes: 3,
    faire: (m, h) => {
      const f = 2200 + 300 * h.next()
      note(m, 0, 0.8, 0, { f, glisse: { vers: f * 0.35, en: 0.6 }, a: 0.12, d: 0.1, battement: 9, partiels: [[1, 1, 1], [1.5, 0.3, 0.7]] })
      souffle(m, h, 0, 0.6, 0, { f: 3000, glisse: { vers: 900, en: 0.6 }, q: 1.4, bande: true, a: 0.45, d: 0.12 })
    },
  },
  /** LA MÉTÉORE FRAPPE LE SOL : un coup grave et lourd, un claquement, puis une pluie d'éclats d'arcane qui tintent */
  impactMeteore: {
    duree: 1, niveau: 0.28, salle: [0.45, 0.18], variantes: 3,
    faire: (m, h) => {
      souffle(m, h, 0, 1, 0, { f: 3600, glisse: { vers: 1200, en: 0.08 }, q: 1.2, bande: true, a: 0.001, d: 0.1 })
      note(m, 0, 1, 0, { f: 110, glisse: { vers: 38, en: 0.25 }, a: 0.002, d: 0.35, partiels: CORPS, sature: 1.7 })
      for (let k = 0; k < 6; k++) note(m, 0.03 + 0.06 * k * (0.6 + 0.4 * h.next()), 0.3 * (1 - k / 8), (h.next() - 0.5) * 0.9, { f: 1600 + 1800 * h.next(), a: 0.002, d: 0.12 + 0.15 * h.next(), battement: 14, partiels: [[1, 1, 1], [1.5, 0.3, 0.6]] })
    },
  },
  /**
   * LE PUITS S'OUVRE ET ASPIRE (2 s) : un souffle qui monte en se resserrant vers l'aigu, un bourdon grave qui gonfle et
   * bat de plus en plus vite — on entend la nuée tirée vers le centre, jusqu'à l'éclat
   */
  aspire: {
    duree: 2.2, niveau: 0.2, salle: [0.4, 0.16], variantes: 2,
    faire: (m, h) => {
      souffle(m, h, 0, 0.7, 0, { f: 400, glisse: { vers: 2600, en: 1.9, droit: true }, q: 1.6, bande: true, a: 1.6, d: 0.3, large: true })
      note(m, 0, 0.6, 0, { f: 55, glisse: { vers: 110, en: 1.9, droit: true }, a: 1.5, d: 0.3, battement: 6, partiels: [[1, 1, 1], [2, 0.5, 0.8], [3, 0.3, 0.6]], sature: 1.3 })
    },
  },
  eclatPlasma: {
    duree: 1.1, niveau: 0.32, salle: [0.45, 0.18], variantes: 3,
    faire: (m, h) => {
      souffle(m, h, 0, 1, 0, { f: 4200, glisse: { vers: 1800, en: 0.06 }, q: 1.3, bande: true, a: 0.001, d: 0.08 })
      note(m, 0, 0.9, 0, { f: 120, glisse: { vers: 40, en: 0.2 }, a: 0.002, d: 0.3, partiels: CORPS, sature: 1.6 })
      note(m, 0.01, 0.35, -0.5, { f: 1500, glisse: { vers: 700, en: 0.6 }, a: 0.005, d: 0.7, battement: 17, partiels: [[1, 1, 1], [1.5, 0.4, 0.7]] })
      note(m, 0.02, 0.3, 0.5, { f: 1180, glisse: { vers: 560, en: 0.6 }, a: 0.005, d: 0.7, battement: 13, partiels: [[1, 1, 1], [1.5, 0.4, 0.7]] })
      for (let k = 0; k < 5; k++) souffle(m, h, 0.03 + 0.05 * k + 0.02 * h.next(), 0.4 - k * 0.06, (h.next() - 0.5) * 0.9, { f: 3800 - 300 * k, q: 1.8, bande: true, a: 0.001, d: 0.04 })
    },
  },
  /** UN INSECTE GELÉ VOLE EN ÉCLATS : du verre qui se brise — un claquement, une pluie de tintements, un coup sourd */
  brise: {
    duree: 0.8, niveau: 0.24, salle: [0.35, 0.14], variantes: 3,
    faire: (m, h) => {
      souffle(m, h, 0, 1, 0, { f: 4200, glisse: { vers: 2400, en: 0.06 }, q: 1.2, bande: true, a: 0.001, d: 0.08 })
      note(m, 0, 0.45, 0, { f: 140, glisse: { vers: 80, en: 0.06 }, a: 0.002, d: 0.08 })
      for (let k = 0; k < 7; k++) note(m, 0.01 + 0.07 * h.next() * k * 0.6, 0.35 * (1 - k / 9), (h.next() - 0.5) * 0.9, { f: 2200 + 3200 * h.next(), a: 0.001, d: 0.1 + 0.15 * h.next(), partiels: [[1, 1, 1], [2.76, 0.35, 0.5]] })
    },
  },
  /** UN ÉCLAT DE GLACE SE BRISE SUR UN INSECTE (le Frimas, 16/11) : un petit « tchiing » de verre — un claquement bref, trois tintements qui s'égrènent ; discret, il revient souvent */
  eclatement: {
    duree: 0.4, niveau: 0.12, salle: [0.3, 0.12], variantes: 4,
    faire: (m, h) => {
      souffle(m, h, 0, 0.7, 0, { f: 5200, glisse: { vers: 3000, en: 0.04 }, q: 1.4, bande: true, a: 0.001, d: 0.04 })
      for (let k = 0; k < 3; k++) note(m, 0.005 + 0.035 * k * (0.7 + 0.6 * h.next()), 0.45 * (1 - k / 4), (h.next() - 0.5) * 0.7, { f: 2600 + 2400 * h.next(), a: 0.001, d: 0.06 + 0.08 * h.next(), partiels: [[1, 1, 1], [2.76, 0.3, 0.5]] })
    },
  },
  /** UNE BALISE EST PLANTÉE : un « tchok » métallique bref, puis un bip court qui l'arme */
  balisePosee: {
    duree: 0.3, niveau: 0.14, salle: [0.22, 0.09], variantes: 2,
    faire: (m, h) => {
      note(m, 0, 1, 0, { f: 420, glisse: { vers: 300, en: 0.03 }, a: 0.001, d: 0.06, partiels: [[1, 1, 1], [2.71, 0.4, 0.5]] })
      souffle(m, h, 0, 0.4, 0, { f: 1200, q: 1.2, bande: true, a: 0.001, d: 0.025 })
      note(m, 0.07, 0.35, 0, { f: 1760, a: 0.002, d: 0.04 })
    },
  },
  /**
   * UN CRISTAL DU PRISME EST POSÉ : un tintement de verre DOUX (Keko, 16/11 : le premier, à 1 900 Hz, attaque sèche, était
   * « un petit peu trop agressif et aigu ») — une note ronde plus grave, une attaque adoucie, un seul partiel discret, une
   * quinte qui répond à peine
   * (… PUIS ENCORE PLUS GRAVE ET DOUX — Keko, 16/11 : « c'est un son qui revient beaucoup durant la partie, on veut quelque
   * chose de discret et de doux » : un « tom » rond à 440 Hz, sinus presque pur, attaque de 20 ms, une octave qui
   * l'effleure, deux fois moins fort qu'au premier jet)
   */
  cristalPose: {
    duree: 0.5, niveau: 0.065, salle: [0.4, 0.16], variantes: 3,
    faire: (m, h) => {
      const f = 440 * (0.97 + 0.06 * h.next())
      note(m, 0, 0.9, 0, { f, a: 0.02, d: 0.28, partiels: [[1, 1, 1], [2, 0.08, 0.5]] })
      note(m, 0.04, 0.2, 0, { f: f * 2, a: 0.025, d: 0.18 })
    },
  },
  /** LE FAISCEAU ENTRE DEUX CRISTAUX S'ACTIVE : un « vvvom » d'énergie — un ton battu qui monte vite, un scintillement aigu */
  cristalLigne: {
    duree: 0.45, niveau: 0.15, salle: [0.3, 0.12], variantes: 3,
    faire: (m, h) => {
      const f = 520 * (0.94 + 0.12 * h.next())
      note(m, 0, 0.8, 0, { f, glisse: { vers: f * 2.2, en: 0.06, droit: true }, a: 0.002, d: 0.2, battement: 30, partiels: [[1, 1, 1], [2, 0.5, 0.8], [3, 0.25, 0.6]] })
      note(m, 0.02, 0.35, 0, { f: 2600, a: 0.002, d: 0.16, battement: 12 })
      souffle(m, h, 0, 0.3, 0, { f: 4200, q: 1.4, bande: true, a: 0.002, d: 0.06 })
    },
  },
  /** LE VAISSEAU RATTRAPE SA SCIE : un clac métallique court, un tintement */
  rattrape: {
    duree: 0.35, niveau: 0.16, salle: [0.25, 0.1], variantes: 2,
    faire: (m, h) => {
      note(m, 0, 1, 0, { f: 880, a: 0.001, d: 0.09, partiels: [[1, 1, 1], [2.71, 0.45, 0.6], [4.1, 0.25, 0.4]] })
      souffle(m, h, 0, 0.4, 0, { f: 2400, q: 1.5, bande: true, a: 0.001, d: 0.025 })
    },
  },
  /** UNE TOURELLE EST POSÉE : un clac métallique (des partiels inharmoniques), puis un servo qui monte */
  pose: {
    duree: 0.55, niveau: 0.24, salle: [0.3, 0.12], variantes: 2,
    faire: (m, h) => {
      note(m, 0, 1, 0, { f: 520, a: 0.001, d: 0.18, partiels: [[1, 1, 1], [2.71, 0.5, 0.6], [5.13, 0.3, 0.4]] })
      souffle(m, h, 0, 0.5, 0, { f: 900, q: 1.2, bande: true, a: 0.001, d: 0.04 })
      note(m, 0.08, 0.3, 0, { f: 260, glisse: { vers: 620, en: 0.18 }, a: 0.02, d: 0.2, partiels: [[1, 1, 1], [3, 0.3, 0.7]] })
    },
  },
  /** UN ENNEMI VERROUILLÉ : deux bips électroniques serrés qui montent, la visée qui se ferme */
  verrou: {
    duree: 0.35, niveau: 0.16, salle: [0.25, 0.1],
    faire: (m, h) => {
      note(m, 0, 0.8, 0.05, { f: MI6, a: 0.002, d: 0.035, partiels: [[1, 1, 1], [2, 0.18, 0.6]] })
      note(m, 0.06, 1, 0.05, { f: LA6, a: 0.002, d: 0.06, partiels: [[1, 1, 1], [2, 0.18, 0.6]] })
      souffle(m, h, 0.06, 0.12, 0, { f: 4200, d: 0.02 })
    },
  },
  /** … déverrouillé : un seul bip, qui glisse vers le bas */
  deverrou: {
    duree: 0.3, niveau: 0.12, salle: [0.25, 0.1],
    faire: (m) => {
      note(m, 0, 1, 0.05, { f: LA6, glisse: { vers: MI6, en: 0.05 }, a: 0.002, d: 0.06, partiels: [[1, 1, 1], [2, 0.18, 0.6]] })
    },
  },
  /** un onglet : deux notes de maillet, une quarte qui monte */
  onglet: {
    duree: 0.6, niveau: 0.25, salle: [0.4, 0.18],
    faire: (m) => {
      note(m, 0, 0.7, -0.1, { f: MI5, d: 0.12, partiels: MAILLET })
      note(m, 0.05, 1, 0.1, { f: LA5, d: 0.2, partiels: MAILLET })
    },
  },
  /** le retour, la fermeture : la même quarte, qui descend */
  retour: {
    duree: 0.6, niveau: 0.21, salle: [0.4, 0.18],
    faire: (m) => {
      note(m, 0, 0.7, 0.1, { f: LA5, d: 0.12, partiels: MAILLET })
      note(m, 0.05, 1, -0.1, { f: MI5, d: 0.2, partiels: MAILLET })
    },
  },
  /** « Plus » s'ouvre : un peu d'air qui monte, une note qui glisse dessous */
  ouvre: {
    duree: 0.7, niveau: 0.26, salle: [0.45, 0.2],
    faire: (m, h) => {
      souffle(m, h, 0, 1, 0, { f: 500, glisse: { vers: 1800, en: 0.14, droit: true }, q: 1.2, bande: true, a: 0.05, d: 0.16, large: true })
      note(m, 0, 0.7, 0, { f: 392, glisse: { vers: RE5, en: 0.1, droit: true }, a: 0.03, d: 0.2 })
    },
  },
  /** un achat : un appui grave, deux clochettes à la quinte, une étincelle au-dessus */
  achat: {
    duree: 1.3, niveau: 0.5, salle: [0.6, 0.25],
    faire: (m) => {
      note(m, 0, 0.5, 0, { f: 240, glisse: { vers: 140, en: 0.03 }, d: 0.12, partiels: CORPS, sature: 2 })
      note(m, 0, 0.8, -0.2, { f: MI6, d: 0.3, partiels: CLOCHE, battement: 6 })
      note(m, 0.07, 1, 0.2, { f: SI6, d: 0.5, partiels: CLOCHE, battement: 6 })
      note(m, 0.14, 0.25, 0, { f: MI7, d: 0.3 })
    },
  },
  /** une pièce équipée : elle s'enclenche (un « clonk » feutré), puis une quinte de maillet qui monte */
  equipe: {
    duree: 0.9, niveau: 0.75, salle: [0.45, 0.18],
    faire: (m, h) => {
      souffle(m, h, 0, 0.6, 0, { f: 2600, glisse: { vers: 800, en: 0.02 }, d: 0.045 })
      note(m, 0, 0.9, 0, { f: 270, glisse: { vers: 145, en: 0.03 }, d: 0.1, partiels: CORPS, sature: 2 })
      note(m, 0.07, 0.7, -0.1, { f: LA4, d: 0.16, partiels: MAILLET })
      note(m, 0.13, 0.8, 0.1, { f: MI5, d: 0.28, partiels: MAILLET })
    },
  },
  /** une vente : cinq pièces de verre qui tintent, d'une oreille à l'autre */
  vente: {
    duree: 1.1, niveau: 0.31, salle: [0.5, 0.22],
    faire: (m, h) => {
      for (const [i, f] of [MI6, LA6, FAD6, SI6, MI7].entries()) {
        note(m, 0.05 * i + 0.012 * h.next(), 0.6 + 0.4 * h.next(), i % 2 === 0 ? -0.3 : 0.3, { f, a: 0.002, d: 0.18 + 0.03 * i, partiels: VERRE })
      }
    },
  },
  /** un bouton éteint qu'on touche : deux notes basses et mates, qui descendent */
  refus: {
    duree: 0.6, niveau: 0.4, salle: [0.3, 0.1],
    faire: (m) => {
      note(m, 0, 1, 0, { f: 311.13, a: 0.004, d: 0.11, partiels: CORPS })
      note(m, 0.11, 0.9, 0, { f: 261.63, a: 0.004, d: 0.14, partiels: CORPS })
    },
  },
  /**
   * le tube s'allume (l'écran d'accueil, à la première tape) : le « toc » du relais,
   * un ronflement grave qui s'installe quand l'image s'ouvre (vers 0,3 s), un souffle qui s'ouvre avec elle
   */
  allume: {
    duree: 1.6, niveau: 0.32, salle: [0.5, 0.2],
    faire: (m, h) => {
      note(m, 0, 0.8, 0, { f: 420, glisse: { vers: 180, en: 0.012 }, a: 0.002, d: 0.06, partiels: [[1, 1, 1], [2, 0.2, 0.5]] })
      souffle(m, h, 0, 0.3, 0, { f: 2400, d: 0.03 })
      // (LE SIFFLEMENT DU TUBE EST RETIRÉ — Keko, 14/11 : « un petit bruit de sifflement, c'est pas très joli » : un sinus
      // nu qui montait de 1 800 à 5 200 Hz)
      note(m, 0.28, 0.7, 0, { f: 55, glisse: { vers: 73.4, en: 0.3, droit: true }, a: 0.12, d: 1, partiels: CORPS, sature: 2 })
      souffle(m, h, 0.28, 0.45, 0, { f: 300, glisse: { vers: 1400, en: 0.3, droit: true }, q: 0.9, bande: true, a: 0.1, d: 0.5, large: true })
    },
  },
  /**
   * un mot du titre arrive et frappe : LA VITESSE ET L'ESPACE PROFOND (Keko : « un peu trop aigu, je voyais un truc
   * plus diffus et qui renvoie à la vitesse et à l'espace profond » — la première version était un coup, un éclat de
   * souffle clair et deux cloches). Un PASSAGE : un souffle large qui monte pendant le vol du mot (0,12 s) puis s'éloigne
   * en descendant longuement, d'une oreille à l'autre ; à la frappe, un coup SOURD qui tombe sur sa note, et une NAPPE
   * grave — l'octave et la quinte, en sinus qui miroitent — qui s'enfle après lui ; le tout dans une grande salle.
   * Deux variantes qui se suivent : NOVA sur ré, DRIFTER sur la, dessous ; la tape de l'accueil (`accueil`) referme
   * l'accord de ré, et c'est elle qui apporte les clochettes.
   */
  frappe: {
    duree: 3, niveau: 0.4, salle: [0.95, 0.5], variantes: 2,
    faire: (m, h, v) => {
      const [grave, pan] = [[73.42, -0.3], [55, 0.3]][v]
      souffle(m, h, 0, 0.55, -pan * 2, { f: 280, glisse: { vers: 1000, en: 0.12, droit: true }, q: 0.8, bande: true, a: 0.1, d: 0.1, large: true })
      souffle(m, h, 0.12, 0.6, pan * 2, { f: 1000, glisse: { vers: 130, en: 0.6, droit: true }, q: 0.8, bande: true, a: 0.01, d: 1.3, large: true })
      note(m, 0.12, 1, 0, { f: grave * 1.6, glisse: { vers: grave, en: 0.06 }, a: 0.008, d: 1, partiels: CORPS, sature: 2 })
      note(m, 0.12, 0.38, -0.4, { f: grave * 2, a: 0.25, d: 1.8, battement: 8 })
      note(m, 0.12, 0.26, 0.4, { f: grave * 3, a: 0.35, d: 1.7, battement: 8 })
    },
  },
  /**
   * l'accueil : la tape qui lance le jeu (Keko : « un autre son que celui du décollage quand on clique l'écran
   * d'accueil », puis « un peu trop aigu, on peut lui donner plus de rondeur et de profondeur ? » — la première
   * version montait l'accord de ré en CLOCHETTES, de 587 à 1 480 Hz). Le même accord, DEUX OCTAVES PLUS BAS et en notes
   * RONDES (ré, la, ré, fa# de 147 à 370 Hz : un sinus et deux partiels doux, une attaque lente, des jumelles qui
   * miroitent), de gauche à droite, sur un appui grave qui tombe sur ré et un souffle sourd qui s'ouvre ; une grande
   * salle. Il referme l'accord que les deux frappes du titre ont posé.
   */
  accueil: {
    duree: 2.6, niveau: 0.42, salle: [0.85, 0.4],
    faire: (m, h) => {
      note(m, 0, 0.7, 0, { f: 110, glisse: { vers: 73.42, en: 0.06 }, a: 0.006, d: 0.7, partiels: CORPS, sature: 2 })
      souffle(m, h, 0, 0.3, 0, { f: 260, glisse: { vers: 800, en: 0.4, droit: true }, q: 0.9, bande: true, a: 0.12, d: 0.6, large: true })
      const rond: Partiel[] = [[1, 1, 1], [2, 0.3, 0.6], [3, 0.08, 0.4]]
      for (const [i, f] of [146.83, 220, RE4, 369.99].entries()) note(m, 0.08 * i, 0.7 - i * 0.06, -0.3 + i * 0.2, { f, a: 0.02, d: 0.9 + i * 0.15, partiels: rond, battement: 6 })
    },
  },
  /** le décollage : un souffle qui s'ouvre, un grave qui monte d'une octave */
  decolle: {
    duree: 2.4, niveau: 0.75, salle: [0.7, 0.22],
    faire: (m, h) => {
      souffle(m, h, 0, 1, 0, { f: 200, glisse: { vers: 2200, en: 0.9, droit: true }, q: 0.9, bande: true, a: 0.5, d: 0.7, large: true })
      souffle(m, h, 0, 0.6, 0, { f: 400, glisse: { vers: 1200, en: 0.9, droit: true }, a: 0.3, d: 0.8 })
      note(m, 0, 0.5, 0, { f: 98, glisse: { vers: 196, en: 0.9, droit: true }, a: 0.3, d: 0.9, partiels: CORPS, sature: 2 })
    },
  },
  /**
   * LE DÉCOLLAGE D'UNE BÊTE — le Kraken, la Vouivre (Keko, 16/11 : « un son un peu plus biologique et gazeux lors de leur
   * décollage au hangar ») : une bouffée de gaz mouillé qui s'ouvre, une vingtaine de bulles qui éclatent en montant
   * (des « bloups » : un sinus bref qui grimpe), un gargouillis grave qui bat
   */
  decolleBete: {
    duree: 2.4, niveau: 0.7, salle: [0.55, 0.18], variantes: 2,
    faire: (m, h) => {
      souffle(m, h, 0, 0.8, 0, { f: 260, glisse: { vers: 1300, en: 1, droit: true }, q: 1.3, bande: true, a: 0.45, d: 0.8, large: true })
      souffle(m, h, 0.1, 0.5, 0, { f: 180, glisse: { vers: 500, en: 1 }, a: 0.3, d: 0.9 })
      note(m, 0, 0.55, 0, { f: 62, glisse: { vers: 110, en: 1, droit: true }, a: 0.25, d: 1, partiels: CORPS, battement: 160, sature: 1.6 })
      for (let k = 0; k < 22; k++) {
        const t0 = 0.05 + k * 0.055 + 0.04 * h.next()
        const f = 180 + 420 * h.next() + k * 12
        note(m, t0, 0.32 * (1 - k / 30), (h.next() - 0.5) * 0.8, { f, glisse: { vers: f * 2.1, en: 0.045, droit: true }, a: 0.004, d: 0.05 + 0.04 * h.next() })
      }
    },
  },
  /**
   * LE DÉCOLLAGE DU NÉANT (Keko, 16/11 : « un son plus science-fiction, vibrant, très grave, un peu dimensionnel ») : un
   * grondement de 44 Hz qui monte d'une quarte, deux voix qui battent à six coups par seconde (il vibre), ses harmoniques
   * pour qu'un petit haut-parleur l'entende ; un balayage résonant qui traverse le spectre et revient (l'espace qui se
   * plie) ; un scintillement aigu qui descend à l'envers, à peine
   */
  decolleNeant: {
    duree: 2.8, niveau: 0.75, salle: [0.8, 0.3],
    faire: (m, h) => {
      note(m, 0, 0.8, -0.3, { f: 44, glisse: { vers: 59, en: 1.4, droit: true }, a: 0.5, d: 1.9, partiels: [[1, 1, 1], [2, 0.7, 0.9], [3, 0.45, 0.8], [4, 0.3, 0.6], [6, 0.12, 0.5]], battement: 220, sature: 1.5 })
      note(m, 0.04, 0.6, 0.3, { f: 44.6, glisse: { vers: 59.6, en: 1.4, droit: true }, a: 0.55, d: 1.9, partiels: [[1, 1, 1], [2, 0.6, 0.9], [3, 0.4, 0.8], [5, 0.15, 0.5]], battement: 180, sature: 1.3 })
      souffle(m, h, 0, 0.55, 0, { f: 140, glisse: { vers: 1100, en: 1.1, droit: true }, q: 4.5, bande: true, a: 0.6, d: 1, large: true })
      souffle(m, h, 0.9, 0.35, 0, { f: 1100, glisse: { vers: 160, en: 0.4 }, q: 4, bande: true, a: 0.2, d: 0.9, large: true })
      note(m, 0.2, 0.08, 0, { f: 1900, glisse: { vers: 700, en: 1.2, droit: true }, a: 0.8, d: 0.8, battement: 35 })
    },
  },
  /**
   * le vaisseau se matérialise (Keko : « le son pour le spawn du vaisseau ») : pendant la spirale, un souffle et une
   * note qui montent d'une octave en s'enflant ; à l'éclosion, une quinte de clochettes (la, ré) sur un appui rond, une
   * étincelle de verre au-dessus — la même famille que l'extraction, en plus court : on arrive comme on repart
   */
  arrive: {
    duree: 2, niveau: 0.5, salle: [0.7, 0.3],
    faire: (m, h) => {
      const e = ECLOSION_DE_L_ARRIVEE
      souffle(m, h, 0, 0.4, 0, { f: 400, glisse: { vers: 2600, en: e, droit: true }, q: 1.5, bande: true, a: e * 0.9, d: 0.14, large: true })
      note(m, 0, 0.3, 0, { f: RE4, glisse: { vers: RE5, en: e, droit: true }, a: e * 0.9, d: 0.14 })
      note(m, e, 0.45, 0, { f: 230, glisse: { vers: 150, en: 0.1 }, d: 0.24, partiels: CORPS, sature: 1.5 })
      note(m, e, 0.7, -0.3, { f: LA5, d: 0.45, partiels: CLOCHE, battement: 5 })
      note(m, e + 0.03, 0.85, 0.3, { f: RE6, d: 0.75, partiels: CLOCHE, battement: 5 })
      note(m, e + 0.12, 0.22, 0, { f: LA6, d: 0.3, partiels: VERRE })
    },
  },
} satisfies Record<string, Recette>

export type Son = keyof typeof RECETTES
export const NOMS_DES_SONS = Object.keys(RECETTES) as Son[]

/** Combien de variantes a ce son (une, le plus souvent). */
export function variantesDe(son: Son): number {
  return (RECETTES[son] as Recette).variantes ?? 1
}

/** Calcule un son à la fréquence d'échantillonnage `sr` : deux canaux, prêts à copier dans un tampon. */
export function synthetiser(son: Son, sr: number, variante = 0): Stereo {
  const r: Recette = RECETTES[son]
  const n = Math.ceil(r.duree * sr)
  const m: Table = { sr, g: new Float32Array(n), d: new Float32Array(n) }
  // la graine : le rang du son et sa variante — le même son, les mêmes échantillons
  r.faire(m, createRng(1 + NOMS_DES_SONS.indexOf(son) * 101 + variante * 7), variante)
  if (r.salle !== undefined) reverberer(m, r.salle[0], r.salle[1])
  return finir(m, r.niveau)
}

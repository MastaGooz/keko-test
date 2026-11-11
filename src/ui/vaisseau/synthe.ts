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
  /** le rival explose : un grand coup sourd, un souffle long, des débris */
  ennemiDetruit: {
    duree: 2, niveau: 0.95, salle: [0.8, 0.3],
    faire: (m, h) => {
      note(m, 0, 0.8, 0, { f: 170, glisse: { vers: 62, en: 0.15 }, a: 0.004, d: 0.7, partiels: CORPS, sature: 2.5 })
      souffle(m, h, 0, 1, 0, { f: 2800, glisse: { vers: 320, en: 0.2 }, a: 0.004, d: 0.75, large: true })
      eclats(m, h, 9, 0.05, 0.55, 0.45)
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
  /** le bouclier prend le coup : une quinte de verre, qui miroite */
  bouclier: {
    duree: 1, niveau: 0.4, salle: [0.6, 0.25],
    faire: (m) => {
      note(m, 0, 1, -0.2, { f: MI5, a: 0.004, d: 0.38, partiels: VERRE, battement: 8 })
      note(m, 0, 0.7, 0.2, { f: SI5, a: 0.004, d: 0.32, partiels: VERRE, battement: 6 })
      note(m, 0, 0.2, 0, { f: SI6, a: 0.004, d: 0.2 })
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
  // À LA BASE — un retour à chaque geste (Keko : « très juicy, un bon gamefeel »)
  /** un bouton : un « toc » de bois, court */
  clic: {
    duree: 0.3, niveau: 0.12, salle: [0.3, 0.12],
    faire: (m, h) => {
      note(m, 0, 1, 0, { f: 720, glisse: { vers: 540, en: 0.012 }, a: 0.002, d: 0.07, partiels: [[1, 1, 1], [2, 0.12, 0.5]] })
      souffle(m, h, 0, 0.15, 0, { f: 3000, d: 0.02 })
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
   * le tube s'allume (l'écran d'accueil, à la première tape) : le « toc » du relais, le sifflement du tube qui monte
   * et s'éteint, un ronflement grave qui s'installe quand l'image s'ouvre (vers 0,3 s), un souffle qui s'ouvre avec elle
   */
  allume: {
    duree: 1.6, niveau: 0.32, salle: [0.5, 0.2],
    faire: (m, h) => {
      note(m, 0, 0.8, 0, { f: 420, glisse: { vers: 180, en: 0.012 }, a: 0.002, d: 0.06, partiels: [[1, 1, 1], [2, 0.2, 0.5]] })
      souffle(m, h, 0, 0.3, 0, { f: 2400, d: 0.03 })
      note(m, 0.12, 0.22, 0, { f: 1800, glisse: { vers: 5200, en: 0.22, droit: true }, a: 0.06, d: 0.5 })
      note(m, 0.28, 0.7, 0, { f: 55, glisse: { vers: 73.4, en: 0.3, droit: true }, a: 0.12, d: 1, partiels: CORPS, sature: 2 })
      souffle(m, h, 0.28, 0.45, 0, { f: 300, glisse: { vers: 1400, en: 0.3, droit: true }, q: 0.9, bande: true, a: 0.1, d: 0.5, large: true })
    },
  },
  /**
   * un mot du titre arrive et frappe (le « combo counter ») : un souffle qui fuse pendant le vol (0,12 s), puis
   * l'impact — un coup grave saturé, un éclat de souffle, une cloche qui reste. Deux variantes qui se suivent : NOVA
   * sur ré, DRIFTER une quinte au-dessus, sur la ; la tape de l'accueil (`accueil`) referme l'accord de ré.
   */
  frappe: {
    duree: 1.5, niveau: 0.5, salle: [0.65, 0.26], variantes: 2,
    faire: (m, h, v) => {
      const [grave, cloche, pan] = [[73.4, RE5, -0.25], [110, LA5, 0.25]][v]
      souffle(m, h, 0, 0.5, -pan * 2, { f: 500, glisse: { vers: 3200, en: 0.12, droit: true }, q: 1.4, bande: true, a: 0.09, d: 0.06, large: true })
      note(m, 0.12, 1, 0, { f: grave * 2.2, glisse: { vers: grave, en: 0.03 }, d: 0.3, partiels: CORPS, sature: 2.5 })
      souffle(m, h, 0.12, 0.7, pan, { f: 4200, glisse: { vers: 900, en: 0.04 }, d: 0.12 })
      note(m, 0.12, 0.55, pan, { f: cloche, d: 0.7, partiels: CLOCHE, battement: 6 })
      note(m, 0.12, 0.3, -pan, { f: cloche * 2, d: 0.4, partiels: CLOCHE })
      eclats(m, h, 6, 0.13, 0.3, 0.25)
    },
  },
  /**
   * l'accueil : la tape qui lance le jeu (Keko : « un autre son que celui du décollage quand on clique l'écran
   * d'accueil ») — un appui rond, un souffle qui s'ouvre, et l'accord de ré qui monte en clochettes (ré, la, ré, fa#),
   * de gauche à droite : on entre
   */
  accueil: {
    duree: 1.9, niveau: 0.5, salle: [0.7, 0.3],
    faire: (m, h) => {
      note(m, 0, 0.5, 0, { f: 147, glisse: { vers: 110, en: 0.05 }, d: 0.25, partiels: CORPS, sature: 2 })
      souffle(m, h, 0, 0.5, 0, { f: 600, glisse: { vers: 2600, en: 0.35, droit: true }, q: 1.1, bande: true, a: 0.08, d: 0.4, large: true })
      for (const [i, f] of [RE5, LA5, RE6, FAD6].entries()) note(m, 0.07 * i, 0.75 - i * 0.08, -0.3 + i * 0.2, { f, d: 0.5 + i * 0.12, partiels: CLOCHE, battement: 5 })
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

/**
 * LA POLICE DE LA BASE (Keko, 10/11 : « perfectionne au maximum… les polices ») : une police pixel À NOUS, inscrite dans
 * la table des polices de pixelfx (`FONTS`) pour que `p.text`, `p.measure` et les mots en relief (`spell` / `drawWord`)
 * la lisent telle quelle.
 *
 * Les capitales sont celles du 5 × 7 du dépôt ; s'y ajoutent DE VRAIES MINUSCULES (une grande hauteur d'x, 5 pixels, des
 * jambages de 2 — c'est la hauteur d'x qui fait la lisibilité d'une petite police) et LES ACCENTS DU FRANÇAIS, sur deux
 * rangées réservées au-dessus des capitales. Une boîte de 11 rangées : 2 pour les accents des capitales, 7 pour les
 * capitales (la hauteur d'x commence à la troisième), 2 pour les jambages. `keko-gras` est la même, épaissie d'un pixel
 * vers la droite : les titres se distinguent par la graisse, pas par une taille qui mélangerait les pixels (« mixels »).
 */
import { FONTS } from 'pixelfx'

type Glyphe = { w: number; rows: boolean[][] }
type Police = { h: number; space: number; gap: number; glyphs: Record<string, Glyphe> }

const HAUT = 11

/** Les capitales, chiffres et signes 5 × 7 du dépôt (recopiés pour pouvoir les composer avec les accents). */
const CAPITALES: Record<string, string> = {
  A: '.###.|#...#|#...#|#####|#...#|#...#|#...#', B: '####.|#...#|#...#|####.|#...#|#...#|####.',
  C: '.###.|#...#|#....|#....|#....|#...#|.###.', D: '####.|#...#|#...#|#...#|#...#|#...#|####.',
  E: '#####|#....|#....|####.|#....|#....|#####', F: '#####|#....|#....|####.|#....|#....|#....',
  G: '.###.|#...#|#....|#.###|#...#|#...#|.####', H: '#...#|#...#|#...#|#####|#...#|#...#|#...#',
  I: '###|.#.|.#.|.#.|.#.|.#.|###', J: '..###|...#.|...#.|...#.|...#.|#..#.|.##..',
  K: '#...#|#..#.|#.#..|##...|#.#..|#..#.|#...#', L: '#....|#....|#....|#....|#....|#....|#####',
  M: '#...#|##.##|#.#.#|#.#.#|#...#|#...#|#...#', N: '#...#|#...#|##..#|#.#.#|#..##|#...#|#...#',
  O: '.###.|#...#|#...#|#...#|#...#|#...#|.###.', P: '####.|#...#|#...#|####.|#....|#....|#....',
  Q: '.###.|#...#|#...#|#...#|#.#.#|#..#.|.##.#', R: '####.|#...#|#...#|####.|#.#..|#..#.|#...#',
  S: '.####|#....|#....|.###.|....#|....#|####.', T: '#####|..#..|..#..|..#..|..#..|..#..|..#..',
  U: '#...#|#...#|#...#|#...#|#...#|#...#|.###.', V: '#...#|#...#|#...#|#...#|#...#|.#.#.|..#..',
  W: '#...#|#...#|#...#|#.#.#|#.#.#|#.#.#|.#.#.', X: '#...#|#...#|.#.#.|..#..|.#.#.|#...#|#...#',
  Y: '#...#|#...#|.#.#.|..#..|..#..|..#..|..#..', Z: '#####|....#|...#.|..#..|.#...|#....|#####',
  0: '.###.|#...#|#..##|#.#.#|##..#|#...#|.###.', 1: '.#.|##.|.#.|.#.|.#.|.#.|###',
  2: '.###.|#...#|....#|...#.|..#..|.#...|#####', 3: '#####|...#.|..#..|...#.|....#|#...#|.###.',
  4: '...#.|..##.|.#.#.|#..#.|#####|...#.|...#.', 5: '#####|#....|####.|....#|....#|#...#|.###.',
  6: '..##.|.#...|#....|####.|#...#|#...#|.###.', 7: '#####|....#|...#.|..#..|.#...|.#...|.#...',
  8: '.###.|#...#|#...#|.###.|#...#|#...#|.###.', 9: '.###.|#...#|#...#|.####|....#|...#.|.##..',
  '!': '#|#|#|#|#|.|#', '?': '.###.|#...#|....#|...#.|..#..|.....|..#..', '+': '.....|..#..|..#..|#####|..#..|..#..|.....',
  '-': '....|....|....|####|....|....|....', '.': '.|.|.|.|.|.|#', ':': '.|.|#|.|.|#|.',
  '/': '....#|....#|...#.|..#..|.#...|#....|#....', '%': '##...|##..#|...#.|..#..|.#...|#..##|...##',
  '×': '.....|.....|#...#|.#.#.|..#..|.#.#.|#...#', "'": '#|#|.|.|.|.|.',
  '<': '...#|..#.|.#..|#...|.#..|..#.|...#', '>': '#...|.#..|..#.|...#|..#.|.#..|#...', '=': '....|....|####|....|####|....|....',
  '(': '..#|.#.|#..|#..|#..|.#.|..#', ')': '#..|.#.|..#|..#|..#|.#.|#..', '#': '.#.#.|.#.#.|#####|.#.#.|#####|.#.#.|.#.#.',
  '«': '.....|.....|..#.#|.#.#.|#.#..|.#.#.|..#.#', '»': '.....|.....|#.#..|.#.#.|..#.#|.#.#.|#.#..',
}
/** La virgule et le point-virgule descendent sous la ligne : leurs 9 rangées (7 + 2 de jambage). */
const DESCENDANTS: Record<string, string> = {
  ',': '..|..|..|..|..|..|.#|.#|#.', ';': '..|..|.#|..|..|..|.#|.#|#.',
}
/**
 * LES MINUSCULES, sur 9 rangées : 2 de hampe (b, d, f, h, k, l, t), 5 de hauteur d'x, 2 de jambage (g, j, p, q, y).
 * Quatre pixels de large pour la plupart, cinq pour m, v, w, x.
 */
const MINUSCULES: Record<string, string> = {
  a: '....|....|.##.|...#|.###|#..#|.###|....|....',
  b: '#...|#...|###.|#..#|#..#|#..#|###.|....|....',
  c: '....|....|.###|#...|#...|#...|.###|....|....',
  d: '...#|...#|.###|#..#|#..#|#..#|.###|....|....',
  e: '....|....|.##.|#..#|####|#...|.###|....|....',
  f: '..##|.#..|###.|.#..|.#..|.#..|.#..|....|....',
  g: '....|....|.###|#..#|#..#|#..#|.###|...#|###.',
  h: '#...|#...|###.|#..#|#..#|#..#|#..#|....|....',
  i: '#|.|#|#|#|#|#|.|.',
  j: '.#|..|.#|.#|.#|.#|.#|.#|#.',
  k: '#...|#...|#..#|#.#.|##..|#.#.|#..#|....|....',
  l: '#.|#.|#.|#.|#.|#.|.#|..|..',
  m: '.....|.....|####.|#.#.#|#.#.#|#.#.#|#.#.#|.....|.....',
  n: '....|....|###.|#..#|#..#|#..#|#..#|....|....',
  o: '....|....|.##.|#..#|#..#|#..#|.##.|....|....',
  p: '....|....|###.|#..#|#..#|#..#|###.|#...|#...',
  q: '....|....|.###|#..#|#..#|#..#|.###|...#|...#',
  r: '....|....|#.##|##..|#...|#...|#...|....|....',
  s: '....|....|.###|#...|.##.|...#|###.|....|....',
  t: '.#..|.#..|###.|.#..|.#..|.#..|..##|....|....',
  u: '....|....|#..#|#..#|#..#|#..#|.###|....|....',
  v: '.....|.....|#...#|#...#|.#.#.|.#.#.|..#..|.....|.....',
  w: '.....|.....|#...#|#...#|#.#.#|#.#.#|.#.#.|.....|.....',
  x: '.....|.....|#...#|.#.#.|..#..|.#.#.|#...#|.....|.....',
  y: '....|....|#..#|#..#|#..#|#..#|.###|...#|###.',
  z: '....|....|####|...#|..#.|.#..|####|....|....',
}
/** Les accents, sur deux rangées, à poser au-dessus d'une lettre de leur largeur (centrés). */
const ACCENTS: Record<string, string[]> = {
  aigu: ['..#', '.#.'],
  grave: ['#..', '.#.'],
  circ: ['.#.', '#.#'],
  trema: ['...', '#.#'],
}
/** Les lettres accentuées : la lettre de base et son accent ; la cédille va dessous. */
const COMPOSEES: Record<string, [string, keyof typeof ACCENTS | 'cedille']> = {
  é: ['e', 'aigu'], è: ['e', 'grave'], ê: ['e', 'circ'], ë: ['e', 'trema'],
  à: ['a', 'grave'], â: ['a', 'circ'], ä: ['a', 'trema'],
  ù: ['u', 'grave'], û: ['u', 'circ'], ü: ['u', 'trema'],
  ô: ['o', 'circ'], ö: ['o', 'trema'], î: ['ı', 'circ'], ï: ['ı', 'trema'],
  ç: ['c', 'cedille'],
  É: ['E', 'aigu'], È: ['E', 'grave'], Ê: ['E', 'circ'], À: ['A', 'grave'], Â: ['A', 'circ'],
  Ô: ['O', 'circ'], Î: ['I', 'circ'], Ç: ['C', 'cedille'],
}

const rangees = (src: string): boolean[][] => src.split('|').map((r) => [...r].map((c) => c === '#'))
const vide = (w: number): boolean[] => new Array(w).fill(false)

function construire(): Record<string, Glyphe> {
  const g: Record<string, Glyphe> = {}
  // capitales et signes : 2 rangées d'accent au-dessus, 2 de jambage dessous
  for (const [ch, src] of Object.entries(CAPITALES)) {
    const r = rangees(src)
    const w = r[0].length
    g[ch] = { w, rows: [vide(w), vide(w), ...r, vide(w), vide(w)] }
  }
  for (const [ch, src] of Object.entries(DESCENDANTS)) {
    const r = rangees(src)
    const w = r[0].length
    g[ch] = { w, rows: [vide(w), vide(w), ...r] }
  }
  for (const [ch, src] of Object.entries(MINUSCULES)) {
    const r = rangees(src)
    const w = r[0].length
    g[ch] = { w, rows: [vide(w), vide(w), ...r] }
  }
  // le i sans point, pour y poser î et ï : une colonne de trois de large, le fût au milieu
  g['ı'] = { w: 3, rows: [vide(3), vide(3), vide(3), vide(3), ...Array.from({ length: 5 }, () => [false, true, false]), vide(3), vide(3)] }
  for (const [ch, [base, accent]] of Object.entries(COMPOSEES)) {
    const b = g[base]
    const rows = b.rows.map((r) => [...r])
    if (accent === 'cedille') {
      const c = Math.floor(b.w / 2)
      rows[9][c] = true
      rows[10][Math.max(0, c - 1)] = true
    } else {
      const a = ACCENTS[accent]
      const majuscule = base === base.toUpperCase() && base !== 'ı'
      const haut = majuscule ? 0 : 2 // (les minuscules ont leur accent au-dessus de la hauteur d'x)
      const x0 = Math.floor((b.w - 3) / 2)
      a.forEach((ligne, k) => [...ligne].forEach((px, i) => {
        if (px === '#' && x0 + i >= 0 && x0 + i < b.w) rows[haut + k][x0 + i] = true
      }))
    }
    g[ch] = { w: b.w, rows }
  }
  // l'apostrophe typographique, les guillemets doubles, les tirets
  g['’'] = g["'"]
  g['—'] = g['-']
  g['–'] = g['-']
  return g
}

/**
 * LES GRASSES DESSINÉES À LA MAIN : les lettres à trois fûts. Épaissir d'un pixel y bouche les deux creux d'un pixel
 * (Keko : « on ne voit pas les pieds de la lettre, c'est un seul bloc »). Elles prennent la place qu'il leur faut : des
 * fûts de deux, des creux d'un — le m sur huit colonnes, M, W et w sur sept. Capitales sur 7 rangées, minuscules sur 9.
 */
const GRASSES_A_LA_MAIN: Record<string, string> = {
  m: '........|........|#######.|##.##.##|##.##.##|##.##.##|##.##.##|........|........',
  w: '.......|.......|##...##|##...##|##.#.##|#######|.##.##.|.......|.......',
  M: '##...##|###.###|#######|##.#.##|##...##|##...##|##...##',
  W: '##...##|##...##|##...##|##.#.##|##.#.##|#######|.##.##.',
}

/** La graisse : chaque pixel s'étend d'un pixel vers la droite — sauf les lettres dessinées à la main, ci-dessus. */
function engraisser(glyphes: Record<string, Glyphe>): Record<string, Glyphe> {
  const g: Record<string, Glyphe> = {}
  for (const [ch, gl] of Object.entries(glyphes)) {
    const w = gl.w + 1
    g[ch] = { w, rows: gl.rows.map((r) => Array.from({ length: w }, (_, x) => (r[x] ?? false) || (r[x - 1] ?? false))) }
  }
  for (const [ch, src] of Object.entries(GRASSES_A_LA_MAIN)) {
    const r = rangees(src)
    const w = r[0].length
    // les mêmes rangées que le glyphe maigre : 2 d'accent au-dessus, et 2 de jambage sous une capitale
    g[ch] = { w, rows: r.length === 7 ? [vide(w), vide(w), ...r, vide(w), vide(w)] : [vide(w), vide(w), ...r] }
  }
  return g
}

/**
 * LE TITRE : la graisse agrandie deux fois par SCALE2X (l'agrandisseur du pixel art, d'Andrea Mazzoleni) — chaque pixel
 * devient quatre, et un coin se coupe quand ses deux voisins le disent : les diagonales s'adoucissent d'un vrai pixel
 * au lieu de faire des marches de deux. Une police grande sans gros pixels carrés.
 */
function scale2x(glyphes: Record<string, Glyphe>): Record<string, Glyphe> {
  const g: Record<string, Glyphe> = {}
  for (const [ch, gl] of Object.entries(glyphes)) {
    const h = gl.rows.length
    const w = gl.w
    const at = (x: number, y: number): boolean => x >= 0 && y >= 0 && x < w && y < h && gl.rows[y][x]
    const rows: boolean[][] = Array.from({ length: h * 2 }, () => new Array(w * 2).fill(false))
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const P = at(x, y)
      const A = at(x, y - 1)
      const B = at(x + 1, y)
      const C = at(x - 1, y)
      const D = at(x, y + 1)
      rows[y * 2][x * 2] = C === A && C !== D && A !== B ? A : P
      rows[y * 2][x * 2 + 1] = A === B && A !== C && B !== D ? B : P
      rows[y * 2 + 1][x * 2] = D === C && D !== B && C !== A ? C : P
      rows[y * 2 + 1][x * 2 + 1] = B === D && B !== A && D !== C ? D : P
    }
    g[ch] = { w: w * 2, rows }
  }
  return g
}

/** La graisse doublée sans lissage : chaque pixel devient un carré de quatre. */
function doubler(glyphes: Record<string, Glyphe>): Record<string, Glyphe> {
  const g: Record<string, Glyphe> = {}
  for (const [ch, gl] of Object.entries(glyphes)) {
    const rows: boolean[][] = []
    for (const r of gl.rows) {
      const large = Array.from({ length: gl.w * 2 }, (_, x) => r[x >> 1] ?? false)
      rows.push(large, [...large])
    }
    g[ch] = { w: gl.w * 2, rows }
  }
  return g
}

/**
 * LES LETTRES DU TITRE, PAR SEGMENTS : chaque lettre relie des nœuds d'une grille — trois colonnes (0 la gauche, 1 le
 * milieu, 2 la droite), cinq rangées (0 le haut, 2 le milieu, 4 le bas) — par des traits épais ; `c` dit quels coins de
 * sa boîte sont coupés (T/B, L/R), `gros` les coupe deux fois plus (le D, le V), `large` l'élargit d'un trait (M, W),
 * `etroit` la réduit à un fût (I). Une diagonale est tracée un pixel plus fine, pour ne pas boucher.
 */
type Trace = { s: [number, number, number, number][]; c?: string; gros?: boolean; large?: boolean; etroit?: boolean }
const RECT: [number, number, number, number][] = [[0, 0, 0, 4], [0, 0, 2, 0], [2, 0, 2, 4], [0, 4, 2, 4]]
const TRACES: Record<string, Trace> = {
  A: { s: [[0, 4, 0, 0], [0, 0, 2, 0], [2, 0, 2, 4], [0, 2, 2, 2]], c: 'TL TR' },
  B: { s: [...RECT, [0, 2, 2, 2]], c: 'TR BR' },
  C: { s: [[2, 0, 0, 0], [0, 0, 0, 4], [0, 4, 2, 4]], c: 'TL BL' },
  D: { s: RECT, c: 'TR BR', gros: true },
  E: { s: [[0, 0, 0, 4], [0, 0, 2, 0], [0, 2, 1.5, 2], [0, 4, 2, 4]] },
  F: { s: [[0, 0, 0, 4], [0, 0, 2, 0], [0, 2, 1.5, 2]] },
  G: { s: [[2, 0, 0, 0], [0, 0, 0, 4], [0, 4, 2, 4], [2, 4, 2, 2], [2, 2, 1, 2]], c: 'TL BL BR' },
  H: { s: [[0, 0, 0, 4], [2, 0, 2, 4], [0, 2, 2, 2]] },
  I: { s: [[0, 0, 0, 4]], etroit: true },
  J: { s: [[2, 0, 2, 4], [2, 4, 0, 4], [0, 4, 0, 3]], c: 'BL BR' },
  K: { s: [[0, 0, 0, 4], [0, 2, 1, 2], [1, 2, 2, 0], [1, 2, 2, 4]] },
  L: { s: [[0, 0, 0, 4], [0, 4, 2, 4]] },
  M: { s: [[0, 0, 0, 4], [2, 0, 2, 4], [0, 0, 2, 0], [1, 0, 1, 2]], c: 'TL TR', large: true },
  N: { s: [[0, 0, 0, 4], [2, 0, 2, 4], [0, 0, 2, 4]] },
  O: { s: RECT, c: 'TL TR BL BR' },
  P: { s: [[0, 0, 0, 4], [0, 0, 2, 0], [2, 0, 2, 2], [0, 2, 2, 2]], c: 'TR' },
  Q: { s: [...RECT, [1, 3, 2, 4]], c: 'TL TR BL' },
  R: { s: [[0, 0, 0, 4], [0, 0, 2, 0], [2, 0, 2, 2], [0, 2, 2, 2], [1, 2, 2, 4]], c: 'TR' },
  S: { s: [[2, 0, 0, 0], [0, 0, 0, 2], [0, 2, 2, 2], [2, 2, 2, 4], [2, 4, 0, 4]], c: 'TL BR' },
  T: { s: [[0, 0, 2, 0], [1, 0, 1, 4]] },
  U: { s: [[0, 0, 0, 4], [0, 4, 2, 4], [2, 0, 2, 4]], c: 'BL BR' },
  V: { s: [[0, 0, 0, 4], [0, 4, 2, 4], [2, 0, 2, 4]], c: 'BL BR', gros: true },
  W: { s: [[0, 0, 0, 4], [2, 0, 2, 4], [0, 4, 2, 4], [1, 2, 1, 4]], c: 'BL BR', large: true },
  X: { s: [[0, 0, 2, 4], [2, 0, 0, 4]] },
  Y: { s: [[0, 0, 0, 2], [2, 0, 2, 2], [0, 2, 2, 2], [1, 2, 1, 4]] },
  Z: { s: [[0, 0, 2, 0], [2, 0, 0, 4], [0, 4, 2, 4]] },
  0: { s: [...RECT, [1, 1.5, 1, 2.5]], c: 'TL TR BL BR' },
  1: { s: [[1, 0, 1, 4], [0, 0, 1, 0], [0, 4, 2, 4]] },
  2: { s: [[0, 0, 2, 0], [2, 0, 2, 2], [2, 2, 0, 2], [0, 2, 0, 4], [0, 4, 2, 4]], c: 'TR' },
  3: { s: [[0, 0, 2, 0], [2, 0, 2, 4], [0, 4, 2, 4], [0.7, 2, 2, 2]], c: 'TR BR' },
  4: { s: [[0, 0, 0, 2], [0, 2, 2, 2], [2, 0, 2, 4]] },
  5: { s: [[2, 0, 0, 0], [0, 0, 0, 2], [0, 2, 2, 2], [2, 2, 2, 4], [2, 4, 0, 4]], c: 'BR' },
  6: { s: [[2, 0, 0, 0], [0, 0, 0, 4], [0, 4, 2, 4], [2, 4, 2, 2], [2, 2, 0, 2]], c: 'TL BL BR' },
  7: { s: [[0, 0, 2, 0], [2, 0, 2, 4]], c: 'TR' },
  8: { s: [...RECT, [0, 2, 2, 2]], c: 'TL TR BL BR' },
  9: { s: [[0, 0, 2, 0], [0, 0, 0, 2], [0, 2, 2, 2], [2, 0, 2, 4], [2, 4, 0, 4]], c: 'TL TR BR' },
  '-': { s: [[0.3, 2, 1.7, 2]] },
  '.': { s: [[0, 4, 0, 4]], etroit: true },
  '!': { s: [[0, 0, 0, 2.5], [0, 4, 0, 4]], etroit: true },
  "'": { s: [[0, 0, 0, 1]], etroit: true },
  '’': { s: [[0, 0, 0, 1]], etroit: true },
}
/** Les capitales accentuées : la lettre, et son accent posé au-dessus (la cédille dessous). */
const ACCENTUEES: Record<string, [string, 'aigu' | 'grave' | 'circ' | 'trema' | 'cedille']> = {
  É: ['E', 'aigu'], È: ['E', 'grave'], Ê: ['E', 'circ'], Ë: ['E', 'trema'], À: ['A', 'grave'], Â: ['A', 'circ'],
  Ô: ['O', 'circ'], Û: ['U', 'circ'], Ù: ['U', 'grave'], Î: ['I', 'circ'], Ï: ['I', 'trema'], Ç: ['C', 'cedille'],
}
function tracerLeTitre(): Record<string, Glyphe> {
  const W = 11
  const H = 11
  const T = 3
  const COUPE = 2
  const HAUT_DU_TITRE = HAUT * 2
  const Y0 = 4 // (les capitales commencent sous les quatre rangées d'accent, comme dans la graisse doublée)
  const tracer = (tr: Trace): Glyphe => {
    const w = tr.etroit ? T : W + (tr.large ? T : 0)
    const rows: boolean[][] = Array.from({ length: HAUT_DU_TITRE }, () => new Array(w).fill(false))
    const nx = (i: number): number => Math.round((i * (w - T)) / 2)
    const ny = (j: number): number => Math.round((j * (H - T)) / 4)
    for (const [x0, y0, x1, y1] of tr.s) {
      const ax = nx(x0)
      const ay = ny(y0)
      const bx = nx(x1)
      const by = ny(y1)
      const biais = ax !== bx && ay !== by
      const e = biais ? T - 1 : T
      const n = Math.max(Math.abs(bx - ax), Math.abs(by - ay), 1)
      for (let k = 0; k <= n; k++) {
        const x = Math.round(ax + ((bx - ax) * k) / n)
        const y = Math.round(ay + ((by - ay) * k) / n)
        for (let dy = 0; dy < T; dy++) for (let dx = 0; dx < e; dx++) if (y + dy < H && x + dx < w) rows[Y0 + y + dy][x + dx] = true
      }
    }
    const c = COUPE * (tr.gros ? 2 : 1)
    for (const coin of (tr.c ?? '').split(' ').filter((x) => x !== '')) {
      for (let i = 0; i < c; i++) for (let j = 0; j < c - i; j++) rows[Y0 + (coin.includes('T') ? i : H - 1 - i)][coin.includes('L') ? j : w - 1 - j] = false
    }
    return { w, rows }
  }
  const g: Record<string, Glyphe> = {}
  for (const [ch, tr] of Object.entries(TRACES)) {
    g[ch] = tracer(tr)
    if (ch.toLowerCase() !== ch) g[ch.toLowerCase()] = g[ch]
  }
  for (const [ch, [base, accent]] of Object.entries(ACCENTUEES)) {
    const gl = tracer(TRACES[base])
    const m = Math.floor(gl.w / 2)
    const poser = (x: number, y: number): void => {
      if (x >= 0 && x < gl.w) gl.rows[y][x] = true
    }
    if (accent === 'aigu') for (const [x, y] of [[m + 1, 0], [m + 2, 0], [m, 1], [m + 1, 1], [m - 1, 2], [m, 2]]) poser(x, y)
    else if (accent === 'grave') for (const [x, y] of [[m - 2, 0], [m - 1, 0], [m - 1, 1], [m, 1], [m, 2], [m + 1, 2]]) poser(x, y)
    else if (accent === 'circ') for (const [x, y] of [[m, 0], [m - 1, 1], [m, 1], [m + 1, 1], [m - 2, 2], [m - 1, 2], [m + 1, 2], [m + 2, 2]]) poser(x, y)
    else if (accent === 'trema') for (const [x, y] of [[m - 2, 1], [m - 1, 1], [m + 1, 1], [m + 2, 1], [m - 2, 2], [m - 1, 2], [m + 1, 2], [m + 2, 2]]) poser(x, y)
    else for (const [x, y] of [[m, Y0 + H], [m + 1, Y0 + H + 1], [m - 1, Y0 + H + 2], [m, Y0 + H + 2]]) poser(x, y)
    g[ch] = gl
    g[ch.toLowerCase()] = gl
  }
  return g
}

const GLYPHES = construire()
const table = FONTS as unknown as Record<string, Police>
table.keko = { h: HAUT, space: 3, gap: 1, glyphs: GLYPHES }
const GRAS = engraisser(GLYPHES)
table['keko-gras'] = { h: HAUT, space: 3, gap: 1, glyphs: GRAS }
// l'en-tête d'un niveau : la graisse, ses lettres ÉCARTÉES d'un pixel de plus (la graisse mange l'espace entre deux
// fûts, et c'est l'espace qui fait lire un mot en petite taille)
table['keko-entete'] = { h: HAUT, space: 4, gap: 2, glyphs: GRAS }
// LE TITRE (Keko, 12/11 : d'abord « un style un peu trop rond, qui ne colle pas super bien au thème SF », puis, sur une
// planche de quatre pistes : « j'aime bien la B ») : UNE LETTRE À NOUS, TRACÉE PAR SEGMENTS — large et basse (onze sur
// onze, des traits de trois pixels), les coins en pans coupés, façon marquage de vaisseau ; des capitales seulement (une
// minuscule rend sa capitale). Ce qu'elle ne sait pas tracer retombe sur la graisse doublée. Les anciennes restent sous
// `keko-titre-double` (doublée telle quelle) et `keko-titre-rond` (lissée par scale2x).
table['keko-titre'] = { h: HAUT * 2, space: 6, gap: 2, glyphs: { ...doubler(GRAS), ...tracerLeTitre() } }
table['keko-titre-double'] = { h: HAUT * 2, space: 6, gap: 2, glyphs: doubler(GRAS) }
table['keko-titre-rond'] = { h: HAUT * 2, space: 6, gap: 2, glyphs: scale2x(GRAS) }

/** La hauteur de la boîte, et le décalage de la ligne des capitales sous son haut (les 2 rangées d'accent). */
export const HAUT_POLICE = HAUT
export const HAUT_ACCENTS = 2

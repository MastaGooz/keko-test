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

/** La graisse : chaque pixel s'étend d'un pixel vers la droite. */
function engraisser(glyphes: Record<string, Glyphe>): Record<string, Glyphe> {
  const g: Record<string, Glyphe> = {}
  for (const [ch, gl] of Object.entries(glyphes)) {
    const w = gl.w + 1
    g[ch] = { w, rows: gl.rows.map((r) => Array.from({ length: w }, (_, x) => (r[x] ?? false) || (r[x - 1] ?? false))) }
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

const GLYPHES = construire()
const table = FONTS as unknown as Record<string, Police>
table.keko = { h: HAUT, space: 3, gap: 1, glyphs: GLYPHES }
const GRAS = engraisser(GLYPHES)
table['keko-gras'] = { h: HAUT, space: 3, gap: 1, glyphs: GRAS }
table['keko-titre'] = { h: HAUT * 2, space: 6, gap: 2, glyphs: scale2x(GRAS) }

/** La hauteur de la boîte, et le décalage de la ligne des capitales sous son haut (les 2 rangées d'accent). */
export const HAUT_POLICE = HAUT
export const HAUT_ACCENTS = 2

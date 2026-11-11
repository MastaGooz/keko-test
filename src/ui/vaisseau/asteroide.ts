/**
 * L'ASTÉROÏDE EN PIXEL ART (Keko : « on peut donner un aspect plus travaillé à la texture des astéroïdes ? », puis,
 * pour les filons : « peut-être rework la structure des astéroïdes pour un ensemble plus cohérent avec les veines »,
 * puis, le 11/11 : « rework un peu les astéroïdes pour un meilleur rendu »).
 *
 * Une roche EN FACETTES : le polygone (une silhouette de caillou, des pans inégaux, un peu aplatie) est pavé par un
 * Voronoï de quelques graines tirées de la sienne (elles tournent avec lui), et chaque cellule est un PAN D'UN DÔME qui
 * prend la lumière selon sa place (la lumière vient d'en haut à gauche, un peu de face) — la roche entière se lit en
 * volume, claire en haut à gauche, sombre en bas à droite, et en tournant les pans changent de ton l'un après l'autre.
 * Entre les blocs, des JOINTS sombres d'un pixel ; et LES VEINES DE MINERAI SONT DES ARÊTES COLORÉES : un joint sur
 * quatre sur une roche pauvre, tous sur une riche, d'un pixel, de la teinte du minerai, vives sur un pan éclairé,
 * éteintes dans l'ombre, un pixel sombre dessous — c'est la même structure qui fait la roche et ses filons (les joints
 * larges à nodules ronds, essayés : « des plaques et des ronds, pas beau »). Par-dessus : un GRAIN (un bruit fractal
 * seedé, quantifié à un ton, seuillé), des CRATÈRES sur les grosses, une LUMIÈRE DE BORD sur l'arête éclairée et une
 * ombre sur l'arête opposée, un liseré sombre. LA COULEUR DE LA ROCHE DIT SON MINERAI : grise pour le fer, ocre pour
 * l'or, bleutée pour le cristal ; des PÉPITES incrustées disent la richesse. Le cristal scintille sur ses veines.
 *
 * Tout est fonction de la graine et du temps : rien n'est stocké, et le même astéroïde se redessine pareil.
 */
import * as noyau from 'pixelfx'
import { tire, type Asteroide, type Minerai } from '../../logic/vaisseau/jeu.ts'

export type PeintreRoche = {
  poly(pts: number[][], c: number | ((x: number, y: number) => number), a?: number): void
  circle(x: number, y: number, r: number, c: number, a?: number): void
  arc(x: number, y: number, r: number, w: number, a0: number, a1: number, c: number, a?: number): void
  dot(x: number, y: number, c: number, a?: number): void
  line(x0: number, y0: number, x1: number, y1: number, c: number, a?: number): void
}
type Noyau = { fit(palette: string[], n: number): number[]; fbm(x: number, y: number, seed?: number, octaves?: number): number; PAL: Record<string, string[]> }
const N = noyau as unknown as Noyau

/** Les trois roches, du sombre au clair, huit tons : la grise, l'ocre, la bleutée. */
const ROCHES = [
  N.fit(N.PAL.stone, 8),
  N.fit(['#120d08', '#2a1e14', '#47321e', '#69492a', '#8e6638', '#b08a58', '#d2b088', '#f0dcc0'], 8),
  N.fit(['#0a0e18', '#1a2232', '#2c3a50', '#425470', '#5c7090', '#7f94b4', '#a8bcd6', '#d8e6f8'], 8),
]
/** Les teintes des trois minerais (sombre → clair → blanc) : l'acier du fer, l'or, la turquoise du cristal. Les pépites, les veines et les compteurs les partagent. */
export const TEINTES_MINERAI: Record<Minerai, number[]> = {
  fer: N.fit(['#243040', '#5a7088', '#a4b8cc', '#e8f0f8', '#ffffff'], 5),
  or: N.fit(['#3a2a06', '#b8860b', '#ffd23a', '#fff6c0', '#ffffff'], 5),
  cristal: N.fit(['#063a30', '#10a080', '#3ff0c8', '#b8fff0', '#ffffff'], 5),
}
/** La lumière du monde : d'en haut à gauche, un peu de face (le z). Les astéroïdes ET le vaisseau la prennent. */
export const LUMIERE = { x: -0.55, y: -0.72, z: 0.42 }

/**
 * Les sommets du polygone de la roche, tirés de sa graine, tournés, RELATIFS au centre. Une silhouette de CAILLOU, pas
 * de patate : six à neuf sommets à des angles inégaux (des pans longs, des pans courts), et la roche est un peu aplatie
 * sur un de ses axes — toujours dans le cercle de son rayon, celui que la règle heurte.
 */
function sommets(a: Asteroide, cosA: number, sinA: number): { pts: number[][]; aplat: number } {
  const n = 6 + Math.floor(tire(a.graine, 1) * 4)
  const aplat = 0.76 + 0.24 * tire(a.graine, 3)
  const pts: number[][] = []
  for (let k = 0; k < n; k++) {
    const th = ((k + (tire(a.graine, 4, k) - 0.5) * 0.7) / n) * Math.PI * 2
    const r = a.rayon * (0.74 + 0.26 * tire(a.graine, 2, k))
    const lx = Math.cos(th) * r
    const ly = Math.sin(th) * r * aplat
    pts.push([lx * cosA - ly * sinA, lx * sinA + ly * cosA])
  }
  return { pts, aplat }
}

/**
 * LA COULEUR DE LA ROCHE DIT SON MINERAI (Keko, 09/11 : « la couleur de la roche doit indiquer le minerai, ce qui
 * permet aux veines et aux pépites d'indiquer la richesse ») : le fer dans la grise, l'or dans l'ocre, le cristal dans
 * la bleutée. Les morceaux d'un astéroïde éclaté en sont. (Tirée de la graine avant, purement esthétique.)
 */
const ROCHE_DU: Record<Minerai, number[]> = { fer: ROCHES[0], or: ROCHES[1], cristal: ROCHES[2] }
export const rocheDe = (minerai: Minerai): number[] => ROCHE_DU[minerai]

/** Une cellule de la roche : son point (tourné, relatif au centre), le ton de sa facette. */
type Cellule = { x: number; y: number; ton: number }
/** Un cratère : son centre (tourné, relatif au centre), son rayon. */
type Cratere = { x: number; y: number; r: number }

/**
 * Dessine l'astéroïde `a` dans le peintre, son centre en (cx, cy) (coordonnées du tampon), tourné de son angle à
 * l'instant t. Le peintre est supposé placé à l'origine.
 */
export function dessinerAsteroide(p: PeintreRoche, a: Asteroide, t: number, cx: number, cy: number): void {
  const C = rocheDe(a.minerai)
  const T = TEINTES_MINERAI[a.minerai]
  const angle = a.angle0 + t * a.vitesseAngulaire
  const R = a.rayon
  const cosA = Math.cos(angle)
  const sinA = Math.sin(angle)
  const { pts, aplat } = sommets(a, cosA, sinA)
  const n = pts.length

  // LES FACETTES : des graines dans la roche, tournées avec elle, ÉCARTÉES l'une de l'autre (de quatre candidates, la
  // plus loin des précédentes : deux graines collées faisaient une facette en éclat et une veine en flaque) — peu sur
  // une petite roche, qui n'était plus que des joints
  const nc = R < 6.5 ? 2 : R < 8 ? 3 : 3 + Math.floor((R - 5.5) / 2.2)
  const locales: number[][] = []
  for (let i = 0; i < nc; i++) {
    let mieux = [0, 0]
    let ecart = -1
    for (let k = 0; k < 4; k++) {
      const th = tire(a.graine, 30, i, k) * Math.PI * 2
      const d = R * (0.12 + 0.6 * Math.sqrt(tire(a.graine, 31, i, k)))
      const c = [Math.cos(th) * d, Math.sin(th) * d * aplat]
      let e = Infinity
      for (const o of locales) e = Math.min(e, Math.hypot(c[0] - o[0], c[1] - o[1]))
      if (e > ecart) (ecart = e), (mieux = c)
    }
    locales.push(mieux)
  }
  // LE VOLUME : chaque facette est un pan d'un DÔME — sa normale est celle du dôme en son point (droit vers nous au
  // centre, couchée vers le bord), un peu bousculée ; son ton est la lumière qu'elle reçoit. La roche entière se lit
  // donc éclairée d'en haut à gauche et sombre en bas à droite, et les pans changent de ton un à un quand elle tourne
  const cellules: Cellule[] = locales.map(([lx, ly], i) => {
    const x = lx * cosA - ly * sinA
    const y = lx * sinA + ly * cosA
    const q = Math.min(0.92, Math.hypot(lx, ly / aplat) / (R * 0.8))
    const l = Math.hypot(x, y) || 1
    const bx = (tire(a.graine, 32, i) - 0.5) * 0.5
    const by = (tire(a.graine, 33, i) - 0.5) * 0.5
    const nx = (x / l) * q + bx * cosA - by * sinA
    const ny = (y / l) * q + bx * sinA + by * cosA
    const nz = Math.sqrt(Math.max(0.05, 1 - q * q))
    const eclat = (nx * LUMIERE.x + ny * LUMIERE.y + nz * LUMIERE.z) / Math.hypot(nx, ny, nz)
    const ton = eclat > 0.78 ? 6 : eclat > 0.56 ? 5 : eclat > 0.34 ? 4 : eclat > 0.12 ? 3 : eclat > -0.12 ? 2 : 1
    return { x, y, ton }
  })
  // LES VEINES : DES ARÊTES COLORÉES (Keko : « colorer les arêtes de la couleur du minerai, là ça fait juste des
  // plaques et des ronds ») — chaque joint entre deux blocs est, ou non, une veine, tiré de la paire et de la richesse :
  // une roche pauvre a un joint sur quatre de minerai, une riche les a tous ; au moins un, celui du premier bloc avec
  // son plus proche voisin, pour qu'on lise toujours le minerai
  const veines = new Set<number>()
  for (let i = 0; i < nc; i++) for (let j = i + 1; j < nc; j++) if (tire(a.graine, 34, i, j) < a.richesse) veines.add(i * 64 + j)
  {
    let j = -1
    let dj = Infinity
    for (let k = 1; k < nc; k++) {
      const d = Math.hypot(cellules[k].x - cellules[0].x, cellules[k].y - cellules[0].y)
      if (d < dj) (dj = d), (j = k)
    }
    if (j > 0) veines.add(j)
  }
  // LES CRATÈRES (les grosses roches seules : un, puis deux) : un creux rond, sa paroi côté lumière dans l'ombre, la
  // paroi d'en face éclairée — ce qui dit « astéroïde » plutôt que « caillou »
  const crateres: Cratere[] = []
  for (let i = 0; i < (R >= 12 ? 2 : R >= 8.5 ? 1 : 0); i++) {
    const th = tire(a.graine, 15, i) * Math.PI * 2
    const d = R * (0.15 + 0.3 * tire(a.graine, 16, i))
    const lx = Math.cos(th) * d
    const ly = Math.sin(th) * d * aplat
    crateres.push({ x: lx * cosA - ly * sinA, y: lx * sinA + ly * cosA, r: Math.max(1.7, R * (0.15 + 0.08 * tire(a.graine, 17, i))) })
  }

  // le liseré : le même polygone, un pixel plus large
  p.poly(pts.map(([x, y]) => [cx + x * (1 + 1.3 / R), cy + y * (1 + 1.3 / R)]), C[0])
  // la roche : la facette du pixel, son ton, le grain, les joints, les veines, les cratères, la lumière de bord
  const scintille = Math.sin(t * 3) > 0.7
  p.poly(pts.map(([x, y]) => [cx + x, cy + y]), (x, y) => {
    const dx = x - cx
    const dy = y - cy
    const d = Math.hypot(dx, dy)
    // les deux cellules les plus proches
    let c1 = 0
    let c2 = 0
    let d1 = Infinity
    let d2 = Infinity
    for (let i = 0; i < nc; i++) {
      const dd = Math.hypot(dx - cellules[i].x, dy - cellules[i].y)
      if (dd < d1) (d2 = d1), (c2 = c1), (d1 = dd), (c1 = i)
      else if (dd < d2) (d2 = dd), (c2 = i)
    }
    // la distance À L'ARÊTE entre les deux facettes (la médiatrice de leurs graines), en pixels : un trait d'épaisseur
    // constante (la différence des deux distances s'élargissait en flaque loin de deux graines proches)
    const vx = cellules[c2].x - cellules[c1].x
    const vy = cellules[c2].y - cellules[c1].y
    const lv = Math.hypot(vx, vy) || 1
    const joint = (d2 * d2 - d1 * d1) / (2 * lv)
    // la facette voisine est-elle du côté de la lampe ? (alors ce pixel est le bord éclairé de son bloc)
    const voisinLumiere = (vx / lv) * LUMIERE.x + (vy / lv) * LUMIERE.y
    // la distance au bord : au pan le plus proche du polygone
    let auBord = Infinity
    for (let k = 0; k < n; k++) {
      const [x0, y0] = pts[k]
      const [x1, y1] = pts[(k + 1) % n]
      const ex = x1 - x0
      const ey = y1 - y0
      const u = Math.max(0, Math.min(1, ((dx - x0) * ex + (dy - y0) * ey) / (ex * ex + ey * ey)))
      auBord = Math.min(auBord, Math.hypot(dx - x0 - ex * u, dy - y0 - ey * u))
    }
    let ton = cellules[c1].ton
    // une veine : l'arête entre les deux blocs, d'un pixel, de la teinte du minerai — vive sur un pan éclairé, éteinte
    // dans l'ombre (elle suit le volume au lieu de le recouvrir), un pixel sombre du côté opposé à la lumière
    if (veines.has(Math.min(c1, c2) * 64 + Math.max(c1, c2)) && auBord > 1.4) {
      if (joint < 0.6) {
        if (a.minerai === 'cristal' && scintille && ((x * 7 + y * 13) & 7) === 0) return T[4]
        const clair = Math.max(ton, cellules[c2].ton)
        return clair >= 4 ? T[3] : clair >= 2 ? T[2] : T[1]
      }
      if (joint < 1.5 && voisinLumiere > 0.25) return ton >= 3 ? C[1] : C[0]
    } else if (nc > 1 && joint < 0.55 && auBord > 1) return C[Math.max(1, ton - 2)] // le joint sombre entre deux blocs
    // le grain : un bruit à l'échelle du quart de la roche, qui ne bouge que d'un ton et seulement où il est franc
    const grain = N.fbm((dx * cosA + dy * sinA) / (R * 0.45), (-dx * sinA + dy * cosA) / (R * 0.45), a.graine & 0xffff, 2)
    if (grain > 0.34) ton += 1
    else if (grain < -0.34) ton -= 1
    // le relief des blocs : le bord tourné vers la lampe prend un ton, le bord opposé en perd un
    if (R > 7.5 && joint < 1.6 && auBord > 1) {
      if (voisinLumiere > 0.4) ton += 1
      else if (voisinLumiere < -0.5) ton -= 1
    }
    // un cratère : le fond un ton dessous, la paroi côté lampe dans l'ombre, celle d'en face éclairée, et sa lèvre
    for (const k of crateres) {
      const ox = dx - k.x
      const oy = dy - k.y
      const dc = Math.hypot(ox, oy)
      if (dc > k.r + 1) continue
      const cote = (ox * LUMIERE.x + oy * LUMIERE.y) / (dc || 1)
      if (dc <= k.r) ton = dc > k.r - 1.2 && cote > 0.2 ? Math.min(ton, 2) - 1 : dc > k.r - 1.2 && cote < -0.3 ? ton + 1 : ton - 1
      else if (cote < -0.1) ton += 1
    }
    // la lumière de bord : l'arête éclairée prend un éclat, l'arête à l'ombre s'assombrit
    const versLumiere = (dx * LUMIERE.x + dy * LUMIERE.y) / (d || 1)
    if (auBord < 1.2 && R > 6) {
      if (versLumiere > 0.35) ton = Math.max(ton + 1, 6)
      else if (versLumiere < -0.3) ton = Math.min(ton, 1)
    } else if (auBord < 2.4 && R > 9 && versLumiere < -0.45) ton = Math.max(2, ton - 1) // (l'ombre propre s'épaissit sur une grosse roche)
    return C[Math.max(1, Math.min(7, ton))]
  })
  // LES PÉPITES INCRUSTÉES (Keko : « rajouter des pépites pour indiquer la richesse / concentration ») : des points
  // clairs du minerai dans les blocs, d'autant plus nombreux que la roche est riche, un pixel sombre dessous
  const npe = Math.round(R * a.richesse * 0.5)
  for (let i = 0; i < npe; i++) {
    const th = tire(a.graine, 50, i) * Math.PI * 2
    const d = R * (0.1 + 0.5 * tire(a.graine, 51, i))
    const lx = Math.cos(th) * d
    const ly = Math.sin(th) * d * aplat
    const x = cx + lx * cosA - ly * sinA
    const y = cy + lx * sinA + ly * cosA
    p.dot(x + 1, y + 1, T[0], 0.8)
    p.dot(x, y, a.minerai === 'cristal' && Math.sin(t * 4 + i * 1.9) > 0.5 ? T[4] : T[3])
  }
}

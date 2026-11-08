/**
 * L'ASTÉROÏDE EN PIXEL ART (Keko : « on peut donner un aspect plus travaillé à la texture des astéroïdes ? », puis,
 * pour les filons : « peut-être rework la structure des astéroïdes pour un ensemble plus cohérent avec les veines »).
 *
 * Une roche EN CELLULES : le polygone est pavé par un Voronoï de quelques graines tirées de la sienne (elles tournent
 * avec lui), et chaque cellule est un BLOC qui prend la lumière selon sa direction depuis le centre (la lumière vient
 * d'en haut à gauche, un peu de face) et un relief qui lui est propre — en tournant, les blocs s'allument et
 * s'éteignent l'un après l'autre, la roche se lit en volume. Entre les blocs, des JOINTS sombres d'un pixel ; et LES
 * VEINES DE MINERAI SONT DES ARÊTES COLORÉES : un joint sur quatre sur une roche pauvre, tous sur une riche, fins, de
 * la teinte du minerai, plus clairs côté lumière, un pixel sombre dessous — c'est la même structure qui fait la roche et
 * ses filons (les joints larges à nodules ronds, essayés : « des plaques et des ronds, pas beau »). Par-dessus : un GRAIN (un bruit fractal seedé, quantifié à un ton, seuillé), une LUMIÈRE
 * DE BORD sur l'arête éclairée et une ombre sur l'arête opposée, quelques piqûres, un liseré sombre. LA COULEUR DE LA ROCHE DIT SON
 * MINERAI : grise pour le fer, ocre pour l'or, bleutée pour le cristal ; des PÉPITES incrustées disent la richesse. Le cristal scintille sur ses veines.
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

/** Les sommets du polygone de la roche, tirés de sa graine, tournés de `angle`, centrés en (cx, cy). */
function sommets(a: Asteroide, angle: number, cx: number, cy: number): { pts: number[][]; n: number; rayons: number[] } {
  const n = 7 + Math.floor(tire(a.graine, 1) * 4)
  const pts: number[][] = []
  const rayons: number[] = []
  for (let k = 0; k < n; k++) {
    const th = angle + (k / n) * Math.PI * 2
    const r = a.rayon * (0.72 + 0.28 * tire(a.graine, 2, k))
    rayons.push(r)
    pts.push([cx + Math.cos(th) * r, cy + Math.sin(th) * r])
  }
  return { pts, n, rayons }
}

/**
 * LA COULEUR DE LA ROCHE DIT SON MINERAI (Keko, 09/11 : « la couleur de la roche doit indiquer le minerai, ce qui
 * permet aux veines et aux pépites d'indiquer la richesse ») : le fer dans la grise, l'or dans l'ocre, le cristal dans
 * la bleutée. Les morceaux d'un astéroïde éclaté en sont. (Tirée de la graine avant, purement esthétique.)
 */
const ROCHE_DU: Record<Minerai, number[]> = { fer: ROCHES[0], or: ROCHES[1], cristal: ROCHES[2] }
export const rocheDe = (minerai: Minerai): number[] => ROCHE_DU[minerai]

/** Une cellule de la roche : son point (déjà tourné, relatif au centre), le ton de son bloc. */
type Cellule = { x: number; y: number; ton: number }

/**
 * Dessine l'astéroïde `a` dans le peintre, son centre en (cx, cy) (coordonnées du tampon), tourné de son angle à
 * l'instant t. Le peintre est supposé placé à l'origine.
 */
export function dessinerAsteroide(p: PeintreRoche, a: Asteroide, t: number, cx: number, cy: number): void {
  const C = rocheDe(a.minerai)
  const T = TEINTES_MINERAI[a.minerai]
  const angle = a.angle0 + t * a.vitesseAngulaire
  const { pts, n, rayons } = sommets(a, angle, cx, cy)
  const R = a.rayon
  const cosA = Math.cos(angle)
  const sinA = Math.sin(angle)

  // LES CELLULES : des graines dans le disque, tournées avec la roche ; chacune un ton selon la lumière reçue par son bloc
  // (trois cellules de plus par 3 unités de rayon : davantage, une petite roche n'était plus que des joints)
  const nc = 3 + Math.floor(R / 3)
  const cellules: Cellule[] = []
  for (let i = 0; i < nc; i++) {
    const th = tire(a.graine, 30, i) * Math.PI * 2
    const d = R * (0.15 + 0.7 * Math.sqrt(tire(a.graine, 31, i)))
    const lx = Math.cos(th) * d
    const ly = Math.sin(th) * d
    // la normale du bloc : vers l'extérieur depuis le centre, inclinée selon un relief propre
    const l = Math.hypot(lx, ly) || 1
    const pente = 0.45 + 0.4 * tire(a.graine, 32, i)
    const wx = (lx / l) * cosA - (ly / l) * sinA
    const wy = (lx / l) * sinA + (ly / l) * cosA
    const eclat = (wx * LUMIERE.x + wy * LUMIERE.y) * pente + LUMIERE.z * (1 - pente) * 1.6 + 0.12 + (tire(a.graine, 33, i) - 0.5) * 0.3
    const ton = eclat > 0.62 ? 5 : eclat > 0.42 ? 4 : eclat > 0.22 ? 3 : eclat > 0.05 ? 2 : 1
    cellules.push({ x: lx * cosA - ly * sinA, y: lx * sinA + ly * cosA, ton })
  }
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
  const largeurVeine = R > 9 ? 1 : 0.8

  // le liseré : le même polygone, un pixel plus large
  p.poly(pts.map(([x, y]) => [cx + (x - cx) * (1 + 1.3 / R), cy + (y - cy) * (1 + 1.3 / R)]), C[0])
  // la roche : la cellule du pixel, son ton, le grain, les joints, les veines, la lumière de bord
  const scintille = Math.sin(t * 3) > 0.7
  p.poly(pts, (x, y) => {
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
    const joint = d2 - d1
    // le rayon du bord dans cette direction (interpolé entre les deux sommets du quartier), pour la lumière de bord
    let th = Math.atan2(dy, dx) - angle
    th = ((th % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)
    const k = Math.min(n - 1, Math.floor((th / (Math.PI * 2)) * n))
    const u = (th / (Math.PI * 2)) * n - k
    const rBord = rayons[k] * (1 - u) + rayons[(k + 1) % n] * u
    const auBord = rBord - d
    // une veine : l'arête entre les deux blocs, fine, de la teinte du minerai, plus claire côté lumière, un pixel sombre dessous
    if (veines.has(Math.min(c1, c2) * 64 + Math.max(c1, c2)) && auBord > 0.8) {
      if (joint < largeurVeine) {
        if (a.minerai === 'cristal' && scintille && ((x * 7 + y * 13) & 7) === 0) return T[4]
        const vx = cellules[c2].x - cellules[c1].x
        const vy = cellules[c2].y - cellules[c1].y
        const lv = Math.hypot(vx, vy) || 1
        // le côté du joint tourné vers la lumière brille
        const versLaLumiere = ((cellules[c1].x - cellules[c2].x) * LUMIERE.x + (cellules[c1].y - cellules[c2].y) * LUMIERE.y) / lv
        return versLaLumiere > 0 ? T[3] : T[2]
      }
      if (joint < largeurVeine + 0.9) return T[0]
    } else if (joint < 0.7 && auBord > 1) return C[1] // le joint sombre entre deux blocs
    // le ton du bloc, puis le grain : un bruit à l'échelle du quart de la roche, qui ne bouge que d'un ton et seulement où il est franc
    let ton = cellules[c1].ton
    const grain = N.fbm((dx * cosA + dy * sinA) / (R * 0.45), (-dx * sinA + dy * cosA) / (R * 0.45), a.graine & 0xffff, 2)
    if (grain > 0.3) ton += 1
    else if (grain < -0.3) ton -= 1
    // l'arête du bloc côté lumière est un peu plus claire (le relief des blocs)
    if (joint < 1.8 && auBord > 1) {
      const vx = cellules[c2].x - cellules[c1].x
      const vy = cellules[c2].y - cellules[c1].y
      const lv = Math.hypot(vx, vy) || 1
      if ((vx / lv) * LUMIERE.x + (vy / lv) * LUMIERE.y < -0.4) ton += 1
    }
    // la lumière de bord : l'arête éclairée prend un éclat, l'arête à l'ombre s'assombrit
    const nx = dx / (d || 1)
    const ny = dy / (d || 1)
    const versLumiere = nx * LUMIERE.x + ny * LUMIERE.y
    if (auBord < 1.3 && R > 6) {
      if (versLumiere > 0.35) ton = Math.max(ton, 6)
      else if (versLumiere < -0.3) ton = Math.min(ton, 1)
    }
    return C[Math.max(1, Math.min(6, ton))]
  })
  // quelques piqûres
  const np = Math.floor(R / 3)
  for (let i = 0; i < np; i++) {
    const th = angle + tire(a.graine, 15, i) * Math.PI * 2
    const d = R * (0.2 + 0.55 * tire(a.graine, 16, i))
    p.dot(cx + Math.cos(th) * d, cy + Math.sin(th) * d, C[2], 0.9)
  }
  // LES PÉPITES INCRUSTÉES (Keko : « rajouter des pépites pour indiquer la richesse / concentration ») : des points
  // clairs du minerai dans les blocs, d'autant plus nombreux que la roche est riche, un pixel sombre dessous
  const npe = Math.round(R * a.richesse * 0.5)
  for (let i = 0; i < npe; i++) {
    const th = angle + tire(a.graine, 50, i) * Math.PI * 2
    const d = R * (0.1 + 0.55 * tire(a.graine, 51, i))
    const x = cx + Math.cos(th) * d
    const y = cy + Math.sin(th) * d
    p.dot(x + 1, y + 1, T[0], 0.8)
    p.dot(x, y, a.minerai === 'cristal' && Math.sin(t * 4 + i * 1.9) > 0.5 ? T[4] : T[3])
  }
}

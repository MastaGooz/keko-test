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
import { tire, type Asteroide, type Minerai, type Pepite } from '../../logic/vaisseau/jeu.ts'

export type PeintreRoche = {
  poly(pts: number[][], c: number | ((x: number, y: number) => number), a?: number): void
  circle(x: number, y: number, r: number, c: number, a?: number): void
  arc(x: number, y: number, r: number, w: number, a0: number, a1: number, c: number, a?: number): void
  dot(x: number, y: number, c: number, a?: number): void
  line(x0: number, y0: number, x1: number, y1: number, c: number, a?: number): void
  glow(x: number, y: number, r: number, c: number, a?: number): void
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

/**
 * UNE PÉPITE LIBRE (Keko, 11/11 : « les minerais drop par les astéroïdes sont trop proches des étoiles du décor,
 * surtout le fer ») : elle était un losange de cinq pixels sous une lueur — exactement une grosse étoile. C'est
 * maintenant un ÉCLAT DE ROCHE : un petit polygone plein qui CULBUTE (une étoile ne tourne pas), cerné de sombre,
 * son pan éclairé et son pan à l'ombre, dans un HALO de la teinte du minerai qui bat, et un reflet blanc en croix qui
 * passe de temps en temps. Le peintre est supposé placé sur la caméra (les coordonnées sont celles du monde).
 */
/** Les trois gris d'une pépite refusée (l'ombre, le corps, le pan éclairé). */
const GRIS_REFUS = N.fit(['#2c2c38', '#4a4a58', '#6c6c7a'], 3)
/** (`teintes` : une autre rampe que celle du minerai — le jeu du vortex les veut violettes) */
export function dessinerPepite(p: PeintreRoche, pe: Pepite, t: number, refusee = false, teintes?: number[]): void {
  const T = teintes ?? TEINTES_MINERAI[pe.minerai]
  const x = Math.round(pe.x)
  const y = Math.round(pe.y)
  const angle = tire(pe.graine, 60) * 6.28 + t * (1.2 + 1.6 * tire(pe.graine, 61)) * (tire(pe.graine, 62) < 0.5 ? -1 : 1)
  const bat = 0.5 + 0.5 * Math.sin(t * 5 + tire(pe.graine, 63) * 6.28)
  const forme = (plus: number): number[][] => {
    const pts: number[][] = []
    for (let k = 0; k < 5; k++) {
      const th = angle + ((k + (tire(pe.graine, 64, k) - 0.5) * 0.5) / 5) * Math.PI * 2
      const r = 2.3 + 1.1 * tire(pe.graine, 65, k) + plus
      pts.push([x + 0.5 + Math.cos(th) * r, y + 0.5 + Math.sin(th) * r])
    }
    return pts
  }
  // UNE PÉPITE REFUSÉE (Keko : « grise les pépites bloquées dans l'espace, mais il faudrait quand même qu'on puisse
  // identifier quel matériau c'est ») : un éclat ÉTEINT — gris, sans halo ni reflet, il ne bat plus —, qui garde SON
  // MINERAI en deux endroits : son cerne à la teinte sombre du minerai, et un cœur d'un pixel à sa teinte vive
  if (refusee) {
    p.poly(forme(1.1), T[1])
    p.poly(forme(0), (px, py) => {
      const k = (px - x) * LUMIERE.x + (py - y) * LUMIERE.y
      return k > 0.9 ? GRIS_REFUS[2] : k < -1.2 ? GRIS_REFUS[0] : GRIS_REFUS[1]
    })
    p.dot(x, y, T[2])
    return
  }
  p.glow(x, y, 8, T[2], 0.3 + 0.25 * bat)
  p.poly(forme(1.1), T[0])
  // le pan vers la lampe clair, le pan opposé sombre, le reste à la teinte
  p.poly(forme(0), (px, py) => {
    const k = (px - x) * LUMIERE.x + (py - y) * LUMIERE.y
    return k > 0.9 ? T[3] : k < -1.2 ? T[1] : T[2]
  })
  // le reflet : une croix blanche brève, à contretemps d'une pépite à l'autre
  const u = (t * 0.7 + tire(pe.graine, 66)) % 1
  if (u < 0.16) {
    const gx = x - 1
    const gy = y - 1
    p.dot(gx, gy, T[4])
    if (u > 0.03 && u < 0.13) for (const [ax, ay] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) p.dot(gx + ax, gy + ay, T[4], 0.8)
    if (u > 0.06 && u < 0.1) for (const [ax, ay] of [[2, 0], [-2, 0], [0, 2], [0, -2]]) p.dot(gx + ax, gy + ay, T[3], 0.6)
  }
}

// ============================================================ LES PÉPITES ET LES ROCHES DU VORTEX (21/11)
/**
 * (Keko, 21/11 : « rework les pépites et les astéroïdes : des pépites vraiment plus remarquables, moins proches des
 * étoiles — la couleur est bien —, un petit effet d'animation, différentes pépites : une petite, une moyenne, une
 * grosse ; et sur les astéroïdes, qu'on voie les pépites incrustées, bien dessinées, pas juste des filons ; des formes
 * plus variées, moins rondes, quelque chose de plus naturel, avec des pépites plus ou moins grosses selon la taille de
 * l'astéroïde ; et un petit symbole d'aimant, de la couleur des pépites, qui attire toutes les pépites de la carte » —
 * « un éclat qui scintille et un léger flottement », choisi parmi trois.)
 *
 * (PAS EN DIAMANT — Keko, 21/11, à la première version : « la forme des pépites en diamant, je ne suis pas fan ; je
 * préfère la forme plus naturelle des pépites » : des gemmes taillées, dessinées pixel par pixel, essayées et retirées.)
 */
/** Le rayon d'une pépite libre selon sa valeur : la petite (1), la moyenne (3), la grosse (10). */
const rayonDePepite = (valeur: number): number => (valeur >= 10 ? 4.6 : valeur >= 3 ? 3.4 : 2.4)
/**
 * UNE PÉPITE DU VORTEX, LIBRE : UN MORCEAU DE MINERAI — un caillou irrégulier tiré de sa graine (plus de pans sur une
 * grosse), cerné du sombre de sa teinte, son pan vers la lampe clair et l'opposé dans l'ombre, un reflet blanc sur la
 * grosse et la moyenne —, à la taille de sa valeur, qui culbute doucement et FLOTTE d'un pixel, dans un halo qui
 * respire, et UN ÉCLAT EN ÉTOILE qui s'ouvre sur elle de temps en temps, à contretemps des autres.
 */
export function dessinerPepiteDuVortex(p: PeintreRoche, pe: Pepite, t: number, T: number[]): void {
  const v = pe.valeur ?? 1
  const R = rayonDePepite(v)
  const flotte = Math.round(Math.sin(t * 2.6 + tire(pe.graine, 70) * 6.28))
  const x = Math.round(pe.x)
  const y = Math.round(pe.y) + flotte
  const bat = 0.5 + 0.5 * Math.sin(t * 3.5 + tire(pe.graine, 63) * 6.28)
  const angle = tire(pe.graine, 60) * 6.28 + t * (0.5 + 0.7 * tire(pe.graine, 61)) * (tire(pe.graine, 62) < 0.5 ? -1 : 1)
  const n = v >= 10 ? 8 : v >= 3 ? 6 : 5
  const forme = (plus: number): number[][] => {
    const pts: number[][] = []
    for (let k = 0; k < n; k++) {
      const th = angle + ((k + (tire(pe.graine, 64, k) - 0.5) * 0.55) / n) * Math.PI * 2
      const r = R * (0.72 + 0.32 * tire(pe.graine, 65, k)) + plus
      pts.push([x + 0.5 + Math.cos(th) * r, y + 0.5 + Math.sin(th) * r])
    }
    return pts
  }
  p.glow(x, y, 4 + R * 2, T[2], 0.2 + 0.15 * bat)
  p.poly(forme(1.1), T[0])
  p.poly(forme(0), (px, py) => {
    const k = ((px - x - 0.5) * LUMIERE.x + (py - y - 0.5) * LUMIERE.y) / R
    return k > 0.45 ? T[3] : k < -0.4 ? T[1] : T[2]
  })
  if (v >= 3) p.dot(x - Math.round(R * 0.35), y - Math.round(R * 0.4), 0xffffffff)
  // (l'éclat : une étoile à quatre branches qui s'ouvre et se referme, plus grande sur une grosse)
  const u = (t * 0.5 + tire(pe.graine, 66)) % 1
  if (u < 0.16) {
    const k = Math.sin((u / 0.16) * Math.PI)
    const gx = x - Math.round(R * 0.35)
    const gy = y - Math.round(R * 0.4)
    const L = Math.round((v >= 10 ? 4 : v >= 3 ? 3 : 2) * k)
    p.dot(gx, gy, 0xffffffff)
    for (let e = 1; e <= L; e++) for (const [ax, ay] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) p.dot(gx + ax * e, gy + ay * e, e === L ? T[3] : 0xffffffff, 1 - e / (L + 1))
    p.glow(gx, gy, 3 + R, 0xffffffff, 0.4 * k)
  }
}
const AIMANT = [
  'oooo...oooo',
  'o44o...o44o',
  'o44o...o44o',
  'oooo...oooo',
  'o33o...o32o',
  'o32o...o22o',
  'o32o...o21o',
  'o322ooo221o',
  '.o3222221o.',
  '..o22211o..',
  '...ooooo...',
]
/** Pose un dessin en chiffres, son centre en (x, y), aux tons de `T` (« o » le plus sombre, « 4 » le blanc). */
function poserLeDessin(p: PeintreRoche, d: string[], x: number, y: number, T: number[]): void {
  const x0 = x - Math.floor(d[0].length / 2)
  const y0 = y - Math.floor(d.length / 2)
  for (let j = 0; j < d.length; j++)
    for (let i = 0; i < d[j].length; i++) {
      const ch = d[j][i]
      if (ch === '.') continue
      p.dot(x0 + i, y0 + j, ch === 'o' ? T[0] : ch === '4' ? 0xffffffff : T[Number(ch)])
    }
}
/**
 * L'AIMANT (Keko, 21/11 : « un petit symbole de la couleur des pépites, un symbole d'aimant ; quand on le prend, ça
 * attire toutes les pépites de la carte ») : un fer à cheval à la teinte des pépites, ses deux pôles blancs, cerné,
 * qui flotte et bat sous son halo, plus vif que les pépites.
 */
export function dessinerAimant(p: PeintreRoche, x0: number, y0: number, t: number, T: number[], graine = 0): void {
  const x = Math.round(x0)
  const y = Math.round(y0) + Math.round(Math.sin(t * 2.6 + tire(graine, 70) * 6.28))
  const bat = 0.5 + 0.5 * Math.sin(t * 5)
  p.glow(x, y, 13, T[2], 0.3 + 0.3 * bat)
  poserLeDessin(p, AIMANT, x, y, T)
}

/**
 * LA ROCHE DU VORTEX — UNE SILHOUETTE NATURELLE (Keko : « moins ronde, une autre manière de les dessiner, quelque chose
 * de plus naturel ») : un polygone de dix à dix-sept sommets à des angles inégaux, ses rayons tirés de la graine sur
 * une forme allongée (deux ondes larges : un côté long, un côté creux) — des arêtes de caillou, pas une patate. OMBRÉE
 * comme un volume : la normale d'un dôme qui suit la silhouette (le rayon du bord à cet angle), la lumière d'en haut à
 * gauche, CINQ APLATS SOMBRES (Keko, 21/11 : « trop clairs » — un ton plus bas qu'à la première version) dont les
 * frontières ondulent (un bruit large, pas de grain ni de trame), un bord vif côté lampe et sombre en face, un cerne
 * d'un pixel ; des cratères et des fissures sur les grosses.
 *
 * SES PÉPITES SONT PRISES DANS LA PIERRE, COMME LES PÉPITES D'UN COOKIE (Keko, 21/11 : « intégrées comme ça, c'est très
 * moche, on dirait qu'elles sont plaquées dessus ; que ce soit l'astéroïde qui dise : j'ai des petites pépites qui
 * dépassent de ma surface ; des parties de pépites incrustées, un peu comme les pépites d'un cookie ») : un ÉCLAT
 * irrégulier par gemme qu'elle rend (`gemmes`, plus gros pour une plus grosse), sans cerne, ÉCLAIRÉ COMME LA ROCHE À SA
 * PLACE (dans l'ombre de la roche, l'éclat est sombre), logé dans un creux — un pixel d'ombre du côté opposé à la
 * lampe, une lèvre de pierre claire du côté de la lampe ; un sur trois est au bord, et DÉPASSE de la silhouette.
 * Sans gemmes : une roche nue (la tempête).
 */
export function dessinerRocheDuVortex(p: PeintreRoche, a: Asteroide, t: number, cx: number, cy: number, gemmes: number[] = [], T: number[] = TEINTES_MINERAI.cristal): void {
  const C = rocheDe(a.minerai)
  const angle = a.angle0 + t * a.vitesseAngulaire
  const R = a.rayon
  const cosA = Math.cos(angle)
  const sinA = Math.sin(angle)
  // les sommets, en coordonnées propres (avant rotation)
  const n = 10 + Math.min(7, Math.floor(R / 4))
  const allonge = 0.12 + 0.14 * tire(a.graine, 80)
  const ph2 = tire(a.graine, 81) * 6.28
  const ph3 = tire(a.graine, 82) * 6.28
  const angles: number[] = []
  const rayons: number[] = []
  for (let k = 0; k < n; k++) {
    const th = ((k + (tire(a.graine, 83, k) - 0.5) * 0.6) / n) * Math.PI * 2
    const onde = 1 - allonge + allonge * Math.cos(2 * th + ph2) + 0.08 * Math.cos(3 * th + ph3)
    angles.push(th)
    rayons.push(R * Math.max(0.55, Math.min(1, (onde + allonge * 0.6) * (0.86 + 0.14 * tire(a.graine, 84, k)))))
  }
  // (le rayon du bord à un angle propre : sur le segment de ses deux sommets)
  const bordA = (th: number): number => {
    const u = ((th % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)
    for (let k = 0; k < n; k++) {
      const a0 = angles[k]
      const a1 = k + 1 < n ? angles[k + 1] : angles[0] + Math.PI * 2
      const uu = u < a0 ? u + Math.PI * 2 : u
      if (uu >= a0 && uu <= a1) {
        const x0 = Math.cos(a0) * rayons[k]
        const y0 = Math.sin(a0) * rayons[k]
        const k1 = (k + 1) % n
        const x1 = Math.cos(a1) * rayons[k1]
        const y1 = Math.sin(a1) * rayons[k1]
        const dx = Math.cos(u)
        const dy = Math.sin(u)
        const den = dx * (y1 - y0) - dy * (x1 - x0)
        return Math.abs(den) < 1e-9 ? rayons[k] : (x0 * (y1 - y0) - y0 * (x1 - x0)) / den
      }
    }
    return rayons[0]
  }
  const tourne = (lx: number, ly: number): number[] => [cx + 0.5 + lx * cosA - ly * sinA, cy + 0.5 + lx * sinA + ly * cosA]
  const propre = (px: number, py: number): number[] => {
    const dx = px - cx - 0.5
    const dy = py - cy - 0.5
    return [dx * cosA + dy * sinA, -dx * sinA + dy * cosA]
  }
  // la lumière, en coordonnées propres
  const lxp = LUMIERE.x * cosA + LUMIERE.y * sinA
  const lyp = -LUMIERE.x * sinA + LUMIERE.y * cosA
  const ll = Math.hypot(lxp, lyp)
  const pts = angles.map((th, k) => tourne(Math.cos(th) * rayons[k], Math.sin(th) * rayons[k]))
  // les cratères (les grosses seules)
  const crateres: { x: number; y: number; r: number }[] = []
  for (let i = 0; i < (R >= 20 ? 3 : R >= 13 ? 2 : R >= 9 ? 1 : 0); i++) {
    const th = tire(a.graine, 15, i) * Math.PI * 2
    const d = bordA(th) * (0.3 + 0.4 * tire(a.graine, 16, i))
    crateres.push({ x: Math.cos(th) * d, y: Math.sin(th) * d, r: Math.max(1.6, R * (0.09 + 0.06 * tire(a.graine, 17, i))) })
  }
  // LES ÉCLATS DE PÉPITE : un par gemme, la plus grosse d'abord, écartés ; un sur trois au bord (il dépasse)
  type Eclat = { x: number; y: number; r: number; g: number; bord: boolean }
  const eclats: Eclat[] = []
  let place = 0.26 * Math.PI * R * R
  for (const [i, val] of [...gemmes].sort((u, v) => v - u).entries()) {
    const r = val >= 10 ? 3.2 : val >= 3 ? 2.3 : 1.5
    if (Math.PI * r * r > place) continue
    const auBord = tire(a.graine, 92, i) < 0.34
    for (let essai = 0; essai < 24; essai++) {
      const th = tire(a.graine, 90, i, essai) * Math.PI * 2
      const b = bordA(th)
      const d = auBord ? b - r * 0.25 : (b - r - 1.5) * (0.1 + 0.8 * tire(a.graine, 91, i, essai))
      if (d < 0) continue
      const x = Math.cos(th) * d
      const y = Math.sin(th) * d
      if (eclats.some((o) => Math.hypot(o.x - x, o.y - y) < o.r + r + 1.5)) continue
      eclats.push({ x, y, r, g: hacheDe(a.graine, i), bord: auBord })
      place -= Math.PI * r * r
      break
    }
  }
  // (la forme d'un éclat : un rayon irrégulier selon l'angle, en coordonnées propres)
  const rayonDeLEclat = (e: Eclat, th: number): number => e.r * Math.max(0.6, 1 + 0.24 * Math.cos(2 * th + tire(e.g, 1) * 6.28) + 0.14 * Math.cos(3 * th + tire(e.g, 2) * 6.28))
  const dansLEclat = (lx: number, ly: number): Eclat | null => {
    for (const e of eclats) {
      const ox = lx - e.x
      const oy = ly - e.y
      if (Math.hypot(ox, oy) <= rayonDeLEclat(e, Math.atan2(oy, ox))) return e
    }
    return null
  }
  // L'ÉCLAIRAGE DE LA PIERRE en un point propre : celui du dôme qui suit la silhouette, au-delà du bord celui du bord
  const eclairage = (lx: number, ly: number): { e: number; q: number; sx: number; sy: number } => {
    const bord = bordA(Math.atan2(ly, lx))
    const q = Math.min(0.999, Math.hypot(lx, ly) / bord)
    const l = Math.hypot(lx, ly) || 1
    const nx = (lx / l) * q
    const ny = (ly / l) * q
    const nz = Math.sqrt(1 - q * q)
    let e = (nx * lxp + ny * lyp) + nz * LUMIERE.z
    e += 0.16 * N.fbm(lx / (R * 0.5) + (a.graine % 97), ly / (R * 0.5), a.graine & 0xffff, 2)
    return { e, q, sx: nx, sy: ny }
  }
  // (la couleur d'un éclat : ses quatre tons selon la lumière de la roche à sa place, plus son propre volume)
  const couleurDeLEclat = (e: Eclat, lx: number, ly: number, lumiere: number): number => {
    const k = ((lx - e.x) * lxp + (ly - e.y) * lyp) / (ll * e.r)
    const v = lumiere * 2.6 + k * 1.1 + 0.6
    if (k > 0.55 && lumiere > 0.25 && e.r >= 2) return 0xffffffff
    return T[Math.max(0, Math.min(3, Math.floor(v)))]
  }
  // le cerne : la silhouette un pixel plus large
  p.poly(pts.map(([x, y]) => [cx + 0.5 + (x - cx - 0.5) * (1 + 1.2 / R), cy + 0.5 + (y - cy - 0.5) * (1 + 1.2 / R)]), C[0])
  // (le pas d'un pixel vers la lampe, en coordonnées propres)
  const vx = (lxp / ll) * 1.2
  const vy = (lyp / ll) * 1.2
  p.poly(pts, (px, py) => {
    const [lx, ly] = propre(px, py)
    const { e: e0, q, sx, sy } = eclairage(lx, ly)
    let e = e0
    for (const k of crateres) {
      const ox = lx - k.x
      const oy = ly - k.y
      const dc = Math.hypot(ox, oy)
      if (dc > k.r + 1) continue
      const cote = (ox * lxp + oy * lyp) / ((dc || 1) * ll)
      e = dc <= k.r ? (cote > 0.1 ? e - 0.5 : e - 0.18) : cote < -0.2 ? e + 0.3 : e
    }
    // l'éclat de pépite, s'il est là
    const ec = dansLEclat(lx, ly)
    if (ec !== null) return couleurDeLEclat(ec, lx, ly, e)
    // son creux : le pixel juste après lui en s'éloignant de la lampe est dans l'ombre, le pixel juste avant est la
    // lèvre de pierre qui prend la lumière
    if (dansLEclat(lx + vx, ly + vy) !== null) e -= 0.45
    else if (dansLEclat(lx - vx, ly - vy) !== null) e += 0.3
    // (le bord, sur un pixel : vif côté lampe, sombre en face)
    if (q > 1 - 1.4 / R) e += (sx * lxp + sy * lyp) > 0.15 ? 0.3 : -0.25
    const ton = e > 0.95 ? 5 : e > 0.7 ? 4 : e > 0.4 ? 3 : e > 0.1 ? 2 : 1
    return C[ton]
  })
  // les fissures : deux ou trois traits sombres brisés, partis d'un bord, qui restent dans la pierre
  for (let i = 0; i < (R >= 16 ? 2 : R >= 11 ? 1 : 0); i++) {
    let th = tire(a.graine, 18, i) * Math.PI * 2
    const d = bordA(th) * 0.92
    let [x, y] = [Math.cos(th) * d, Math.sin(th) * d]
    const pas = 2 + Math.floor(R / 10)
    for (let k = 0; k < pas; k++) {
      th += (tire(a.graine, 19, i, k) - 0.5) * 1.4
      const lg = R * (0.14 + 0.08 * tire(a.graine, 20, i, k))
      const nx2 = x - Math.cos(th) * lg
      const ny2 = y - Math.sin(th) * lg
      if (Math.hypot(nx2, ny2) > bordA(Math.atan2(ny2, nx2)) - 1.5) break
      const [ax, ay] = tourne(x, y)
      const [bx, by] = tourne(nx2, ny2)
      p.line(Math.floor(ax), Math.floor(ay), Math.floor(bx), Math.floor(by), C[1])
      ;[x, y] = [nx2, ny2]
    }
  }
  // LES ÉCLATS QUI DÉPASSENT : leur part hors de la pierre, cernée comme elle, éclairée comme son bord
  for (const ec of eclats) {
    if (!ec.bord) continue
    const contour = (plus: number): number[][] => {
      const q: number[][] = []
      for (let k = 0; k < 14; k++) {
        const th = (k / 14) * Math.PI * 2
        const r = rayonDeLEclat(ec, th) + plus
        q.push(tourne(ec.x + Math.cos(th) * r, ec.y + Math.sin(th) * r))
      }
      return q
    }
    const dehors = (px: number, py: number): boolean => {
      const [lx, ly] = propre(px, py)
      return Math.hypot(lx, ly) > bordA(Math.atan2(ly, lx)) + 0.2
    }
    p.poly(contour(1.1), (px, py) => (dehors(px, py) && dansLEclat(...(propre(px, py) as [number, number])) === null ? C[0] : 0))
    p.poly(contour(0), (px, py) => {
      if (!dehors(px, py)) return 0
      const [lx, ly] = propre(px, py)
      return couleurDeLEclat(ec, lx, ly, eclairage(lx, ly).e)
    })
  }
}
/** Une graine dérivée (pour la forme de chaque éclat). */
const hacheDe = (g: number, i: number): number => Math.floor(tire(g, 93, i) * 0x7fffffff)

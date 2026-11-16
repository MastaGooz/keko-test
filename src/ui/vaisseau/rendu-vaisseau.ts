/**
 * LE VAISSEAU DU HANGAR, RENDU PIXEL PAR PIXEL (Keko, 10/11 : « retravaille les éléments de pixel art — vaisseau,
 * parties — pour un rendu optimal et sublimé ») : au lieu de polygones à aplats agrandis, chaque pièce est une FORME
 * (un contour en unités du vaisseau, une matière, un relief) et chaque pixel de l'écran est éclairé à part :
 *
 * - LE RELIEF donne une normale : le fuselage est un CYLINDRE (la lumière glisse en travers), la verrière et le dôme du
 *   foreur des DÔMES, les ailes des PLAQUES un peu penchées ; la lumière vient d'en haut à gauche (les lampes du hangar).
 * - LES RAMPES GLISSENT EN TEINTE (les ombres vers le violet, les lumières vers le clair et chaud), six tons par matière,
 *   et la frontière entre deux tons est TRAMÉE (Bayer 2 × 2) — pas de dégradé lisse, pas d'« ombrage en coussin ».
 * - LES BORDS : un biseau (le bord tourné vers la lumière s'éclaire, l'autre s'assombrit), une ombre de contact sous ce
 *   qui est posé dessus, un REFLET (rim light) froid sur les bords à l'ombre, et un CONTOUR SÉLECTIF : sombre à l'ombre,
 *   de la couleur de la matière côté lumière — jamais un noir uniforme.
 * - LES REFLETS SPÉCULAIRES sur le métal et le verre ; les FLAMMES sont émissives (pas éclairées, pas cernées).
 *
 * Le même rendu sert aux pictogrammes des pièces dans l'interface : une pièce seule, mise à l'échelle de sa case.
 */
import * as noyau from 'pixelfx'

type Peintre = { rect(x: number, y: number, w: number, h: number, c: number, a?: number): void; glow(x: number, y: number, r: number, c: number, k?: number): void }
const hex = (noyau as unknown as { hex(h: string): number }).hex

export type Matiere = 'coque' | 'blinde' | 'aile' | 'verre' | 'metal' | 'acier' | 'rouge' | 'or' | 'feu' | 'ion' | 'laser' | 'emeraude' | 'carmin' | 'grenat' | 'ambre' | 'violet' | 'glace' | 'marque' | 'suie' | 'cuivre' | 'perle' | 'sarcelle' | 'kaki' | 'graphite' | 'nacre' | 'indigo' | 'obsidienne' | 'mauve' | 'plasma' | 'chitine' | 'chair' | 'bile' | 'os' | 'ecaille' | 'venin' | 'lie'
export type Relief = 'cyl' | 'plat' | 'dome' | 'emis'
export type Forme = {
  pts: [number, number][]
  mat: Matiere
  relief: Relief
  /** Pour un dôme : son centre et ses rayons (en unités du vaisseau). */
  dome?: { x: number; y: number; rx: number; ry: number }
  /** Pour une plaque : de quel côté elle penche (−1, +1 ; 0 à plat). */
  penche?: number
  /** Pour une flamme : la base (x de la tuyère) et la pointe, pour son dégradé. */
  feu?: { base: number; pointe: number }
}

/** Les rampes, du plus sombre au plus clair, en teinte glissante. */
const RAMPES: Record<Matiere, number[]> = {
  coque: ['#151330', '#252b52', '#3a4b7a', '#5878a6', '#8eb0d4', '#d2eaff'].map(hex),
  blinde: ['#13161c', '#242d33', '#38484b', '#566b69', '#889f96', '#cbe0d2'].map(hex),
  aile: ['#16122c', '#29264c', '#413c6e', '#625e98', '#938ec2', '#d2cdf0'].map(hex),
  verre: ['#051a2c', '#0a3756', '#0f6a92', '#24aacc', '#7ee8fb', '#ffffff'].map(hex),
  metal: ['#0c0a12', '#1c1925', '#302c3b', '#4b4657', '#716b7f', '#aaa3b5'].map(hex),
  acier: ['#151520', '#2a2a3a', '#45455a', '#68687f', '#9797ad', '#d6d6e6'].map(hex),
  rouge: ['#26080f', '#561220', '#93202e', '#d0443a', '#ff8456', '#ffcf9a'].map(hex),
  or: ['#2a1606', '#6b3a0c', '#a8650f', '#d99a1c', '#f2c23a', '#fff2a8'].map(hex),
  feu: ['#5a1206', '#b8320a', '#f06a14', '#ffb02e', '#ffe680', '#ffffff'].map(hex),
  ion: ['#0a2a6a', '#1250b8', '#1a8ae8', '#40c0ff', '#a0ecff', '#ffffff'].map(hex),
  laser: ['#3a0a10', '#a01020', '#ff2a3a', '#ff7a5a', '#ffd0a0', '#ffffff'].map(hex),
  emeraude: ['#062a18', '#0c5a32', '#16935a', '#2ed08a', '#8affc6', '#ffffff'].map(hex),
  // le RIVAL du vol : sa coque rouge sombre, ses ailes grenat, sa verrière d'ambre, son laser violet
  carmin: ['#1c0810', '#481622', '#7a2a36', '#aa4450', '#d67278', '#f6b4ac'].map(hex),
  grenat: ['#16070f', '#35101e', '#571c2e', '#7e3042', '#ad5360', '#de908e'].map(hex),
  ambre: ['#2a1404', '#6a3608', '#c87214', '#ffb840', '#ffe49a', '#ffffff'].map(hex),
  violet: ['#1a0a2a', '#5a1a90', '#9a3ae0', '#c070ff', '#e8c0ff', '#ffffff'].map(hex),
  // les CRISTAUX du Frimas : une glace bleue, presque blanche dans la lumière
  glace: ['#151a3d', '#212f6b', '#2c58aa', '#3a8bd8', '#7ed4f8', '#e6fbff'].map(hex),
  // LA MARQUE DU JOUEUR (Keko, 16/11 : « la couleur choisie sert juste à marquer certains emplacements, des petits ») :
  // le bout des ailes, des voyants ; sa rampe vient de la couleur du joueur, celle-ci n'est que celle par défaut (le rouge
  // des bouts d'ailes de toujours)
  marque: ['#26080f', '#561220', '#93202e', '#d0443a', '#ff8456', '#ffcf9a'].map(hex),
  // CHAQUE VAISSEAU A SA COULEUR À LUI (Keko, 16/11 : « le reste du vaisseau a sa propre couleur et sa propre identité ») :
  // la Salamandre, de la suie et du cuivre ; la Sentinelle, de la perle et de la sarcelle ; l'Ingénieur, du kaki et du
  // graphite ; le Frimas, de la nacre et de l'indigo — le chasseur garde l'acier bleuté de la série
  suie: ['#100a10', '#211619', '#352527', '#4f3a36', '#79594c', '#b8917a'].map(hex),
  cuivre: ['#1e0a08', '#43180f', '#73311b', '#a8542c', '#d9864c', '#ffc890'].map(hex),
  perle: ['#14152a', '#282b45', '#464b68', '#737a96', '#aab2c8', '#eef2fa'].map(hex),
  sarcelle: ['#061a20', '#0b3438', '#135a5a', '#1f8882', '#46beb2', '#a6f0e0'].map(hex),
  kaki: ['#121306', '#262810', '#3f421e', '#5e6232', '#888d52', '#c6c98e'].map(hex),
  graphite: ['#0d0d12', '#1b1b22', '#2d2d36', '#45454f', '#686874', '#a2a2ae'].map(hex),
  nacre: ['#1a1430', '#2f2852', '#4e477a', '#7c75a8', '#b4aed6', '#efecfc'].map(hex),
  indigo: ['#0c0822', '#1a1244', '#2b1f6a', '#403092', '#6852bc', '#ac96ea'].map(hex),
  // LE PULSAR (Keko, 16/11 : « des tons un peu violets ») : une carapace d'obsidienne, des ailes mauves, et LE PLASMA —
  // du violet au bleu, puis au blanc (les teintes du « Plasma explosion » de pixelfx)
  obsidienne: ['#0b0816', '#171128', '#261c40', '#3a2c5c', '#58457f', '#8a74b0'].map(hex),
  mauve: ['#170a26', '#2e1448', '#4c2272', '#6e369c', '#9a5cc8', '#d6a8f0'].map(hex),
  plasma: ['#2a0c5a', '#4a1a8c', '#8a3ce0', '#4a7cf0', '#7cc0ff', '#f0f8ff'].map(hex),
  // LE KRAKEN (Keko, 16/11 : « organique, les vaisseaux zergs ») : une chitine brun violacé, une chair rose sang, une bile
  // jaune-vert qui luit (ses yeux, son jet), de l'os pour ses aiguilles et ses épines
  chitine: ['#120a14', '#24131f', '#3a1f2c', '#56303a', '#7c4a4c', '#b07a6c'].map(hex),
  chair: ['#2a0a18', '#5a1430', '#8e2a48', '#c04a62', '#e8808a', '#ffc4c0'].map(hex),
  bile: ['#1a2a06', '#3a5a0c', '#6a9a14', '#a8d42a', '#e0f870', '#ffffe0'].map(hex),
  os: ['#2a2218', '#4a3e2c', '#76664a', '#a8987a', '#d6ccb0', '#fffaf0'].map(hex),
  // LA VOUIVRE (Keko, 16/11 : « organique, la corrosion et le toxique ») : des écailles vert sombre, un venin vert acide qui
  // luit (ses sacs, sa gueule, son jet), une lie violette pour ses membranes — le vert et le violet du poison
  ecaille: ['#0a120e', '#14241a', '#22382a', '#34523c', '#4f7454', '#86a87c'].map(hex),
  venin: ['#1a3006', '#2e5a08', '#4e8e10', '#7cc81c', '#b8f040', '#f0ffb0'].map(hex),
  lie: ['#140a18', '#26122e', '#3c1c48', '#563068', '#7a4c8e', '#a678b8'].map(hex),
}
/** Trois tons d'une matière (sombre, moyen, clair), pour ce que la page peint à la main (les drones). */
export function tonsDeLaMatiere(m: Matiere): [number, number, number] {
  return [RAMPES[m][2], RAMPES[m][3], RAMPES[m][4]]
}
const CONTOUR = hex('#07050e')
const BLANC = hex('#ffffff')
const BAYER = [0, 2, 3, 1]
/** Les quatre voisins d'un pixel (dx, dy), à plat : pas de tableau fabriqué à chaque pixel. */
const VOISINS = [1, 0, -1, 0, 0, 1, 0, -1]

/**
 * LES LIVRÉES (Keko, 12/11 : « un système de changement de couleur du châssis ») : la couleur de la coque et des ailes
 * du joueur. Chacune est UNE TEINTE (en degrés), une saturation et une clarté ; ses rampes en sont tirées comme celles
 * de la série — six tons du sombre au clair, la teinte qui glisse (plus froide dans l'ombre), les ailes un cran plus
 * sombres et décalées. La première, « Série », garde les rampes d'origine.
 */
export type Livree = { id: string; nom: string; teinte: number; saturation: number; clarte: number }
export const LIVREES: Livree[] = [
  { id: 'serie', nom: 'Série', teinte: 215, saturation: 0.4, clarte: 1 },
  // (le rouge : celui du rival, et ce n'est pas grave — Keko : « l'ennemi est un placeholder »)
  { id: 'rouge', nom: 'Rouge', teinte: 356, saturation: 0.7, clarte: 1 },
  { id: 'braise', nom: 'Braise', teinte: 22, saturation: 0.7, clarte: 1 },
  { id: 'or', nom: 'Or', teinte: 44, saturation: 0.75, clarte: 1 },
  { id: 'jade', nom: 'Jade', teinte: 135, saturation: 0.45, clarte: 1 },
  { id: 'lagon', nom: 'Lagon', teinte: 178, saturation: 0.55, clarte: 1 },
  { id: 'iris', nom: 'Iris', teinte: 272, saturation: 0.5, clarte: 1 },
  { id: 'rose', nom: 'Rose', teinte: 328, saturation: 0.55, clarte: 1 },
  { id: 'ivoire', nom: 'Ivoire', teinte: 40, saturation: 0.1, clarte: 1.18 },
  { id: 'nuit', nom: 'Nuit', teinte: 235, saturation: 0.18, clarte: 0.55 },
  // LES COULEURS DES JOUEURS du jeu du vortex (Keko, 15/11 : « une couleur au choix entre rouge, bleu, vert et jaune —
  // chaque joueur aura une couleur pour bien s'identifier ») : franches, bien distinctes ; le rouge est celui d'au-dessus
  { id: 'bleu', nom: 'Bleu', teinte: 214, saturation: 0.78, clarte: 1 },
  { id: 'vert', nom: 'Vert', teinte: 122, saturation: 0.6, clarte: 1 },
  { id: 'jaune', nom: 'Jaune', teinte: 50, saturation: 0.85, clarte: 1.08 },
  // (… PUIS UN PANEL PLUS LARGE — Keko, 16/11 : « ce serait sympa pour les joueurs de choisir parmi un panel de couleurs
  // un peu plus large » : douze, le tour du cercle des teintes, et le blanc ; des identifiants à elles, les livrées du Nova
  // Drifter gardent les leurs)
  { id: 'orange', nom: 'Orange', teinte: 26, saturation: 0.9, clarte: 1.04 },
  { id: 'lime', nom: 'Lime', teinte: 84, saturation: 0.75, clarte: 1.08 },
  { id: 'turquoise', nom: 'Turquoise', teinte: 166, saturation: 0.7, clarte: 1.02 },
  { id: 'cyan', nom: 'Cyan', teinte: 190, saturation: 0.85, clarte: 1.06 },
  { id: 'violet', nom: 'Violet', teinte: 274, saturation: 0.72, clarte: 1.04 },
  { id: 'magenta', nom: 'Magenta', teinte: 310, saturation: 0.78, clarte: 1.02 },
  { id: 'dragee', nom: 'Dragée', teinte: 334, saturation: 0.7, clarte: 1.3 },
  { id: 'blanc', nom: 'Blanc', teinte: 220, saturation: 0.06, clarte: 1.22 },
]
/** Les couleurs qu'un joueur du jeu du vortex peut prendre, dans l'ordre ; les autres livrées sont celles du Nova Drifter. */
export const COULEURS_DE_JOUEUR = ['rouge', 'orange', 'jaune', 'lime', 'vert', 'turquoise', 'cyan', 'bleu', 'violet', 'magenta', 'dragee', 'blanc']
function tsl(h: number, s: number, l: number): number {
  const a = s * Math.min(l, 1 - l)
  const f = (n: number): number => {
    const k = (n + (((h % 360) + 360) % 360) / 30) % 12
    return Math.round(255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))))
  }
  return hex('#' + [f(0), f(8), f(4)].map((v) => v.toString(16).padStart(2, '0')).join(''))
}
const CLARTES = [0.13, 0.23, 0.35, 0.5, 0.69, 0.9]
function rampeDeLaTeinte(h: number, s: number, clarte: number, sombre: number): number[] {
  return CLARTES.map((l, i) => tsl(h + 14 - (i / 5) * 22, Math.min(1, s * (i === 5 ? 1.5 : 1)), Math.max(0.04, Math.min(0.95, (l - sombre) * clarte))))
}
const rampesGardees = new Map<string, Partial<Record<Matiere, number[]>> | undefined>()
/** Les rampes d'une livrée, pour `Options.rampes` : la coque, la coque blindée (plus terne), les ailes. Rien pour la série. */
export function rampesDeLaLivree(id: string): Partial<Record<Matiere, number[]>> | undefined {
  if (!rampesGardees.has(id)) {
    const l = LIVREES.find((x) => x.id === id)
    rampesGardees.set(id, l === undefined || l.id === 'serie' ? undefined : { coque: rampeDeLaTeinte(l.teinte, l.saturation, l.clarte, 0), blinde: rampeDeLaTeinte(l.teinte, l.saturation * 0.6, l.clarte * 0.92, 0.02), aile: rampeDeLaTeinte(l.teinte + 16, l.saturation * 0.9, l.clarte, 0.03) })
  }
  return rampesGardees.get(id)
}
const marquesGardees = new Map<string, number[]>()
/**
 * LA MARQUE d'une couleur de joueur, pour `Options.rampes.marque` (le jeu du vortex) : la même teinte, plus vive et un
 * peu plus claire — elle ne couvre que de petites zones, il faut qu'elle s'y lise.
 */
export function rampeDeLaMarque(id: string): number[] | undefined {
  const l = LIVREES.find((x) => x.id === id)
  if (l === undefined || l.id === 'serie') return undefined
  if (!marquesGardees.has(id)) marquesGardees.set(id, rampeDeLaTeinte(l.teinte, Math.min(1, l.saturation * 1.2), l.clarte * 1.08, 0))
  return marquesGardees.get(id)
}
/** Trois tons d'une livrée (sombre, moyen, clair), pour sa pastille. */
export function tonsDeLaLivree(id: string): [number, number, number] {
  const r = rampesDeLaLivree(id)?.coque ?? RAMPES.coque
  return [r[2], r[3], r[4]]
}

/** La lumière, en unités du vaisseau (le nez vers +x) : de l'avant et de la gauche, et d'en haut. */
const LUM = (() => {
  const v = [0.55, -0.55, 0.63]
  const n = Math.hypot(v[0], v[1], v[2])
  return v.map((c) => c / n)
})()
/** Le demi-vecteur (lumière + regard vers nous), pour le spéculaire. */
const DEMI = (() => {
  const v = [LUM[0], LUM[1], LUM[2] + 1]
  const n = Math.hypot(v[0], v[1], v[2])
  return v.map((c) => c / n)
})()

function dedans(pts: [number, number][], x: number, y: number): boolean {
  let d = false
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i]
    const [xj, yj] = pts[j]
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) d = !d
  }
  return d
}
/** La demi-largeur d'un fuseau à l'abscisse x (le plus grand |y| du contour à cette abscisse). */
function demiLargeur(pts: [number, number][], x: number): number {
  let m = 0
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [x0, y0] = pts[j]
    const [x1, y1] = pts[i]
    if ((x0 - x) * (x1 - x) > 0 || x0 === x1) continue
    const y = y0 + ((y1 - y0) * (x - x0)) / (x1 - x0)
    m = Math.max(m, Math.abs(y))
  }
  return m
}
/** Un ovale en polygone. */
export function ovale(cx: number, cy: number, rx: number, ry: number, n = 16): [number, number][] {
  return Array.from({ length: n }, (_, i): [number, number] => [cx + Math.cos((i / n) * Math.PI * 2) * rx, cy + Math.sin((i / n) * Math.PI * 2) * ry])
}
/** Un trait épais en polygone, de (x0, y0) à (x1, y1). */
export function barre(x0: number, y0: number, x1: number, y1: number, e: number): [number, number][] {
  const l = Math.hypot(x1 - x0, y1 - y0) || 1
  const nx = (-(y1 - y0) / l) * (e / 2)
  const ny = ((x1 - x0) / l) * (e / 2)
  return [[x0 + nx, y0 + ny], [x1 + nx, y1 + ny], [x1 - nx, y1 - ny], [x0 - nx, y0 - ny]]
}

export type Options = {
  /** 0 à 1 : le tout blanc (le flash d'une pièce équipée). */
  blanc?: number
  /** La couleur du reflet sur les bords à l'ombre. */
  reflet?: number
  /** Le cap : −π/2, le nez en haut (le hangar). */
  cap?: number
  /**
   * Les formes qui donnent LA BOÎTE d'une mise en case, à la place des formes peintes : une pièce qui s'anime (la flamme
   * qui gonfle, l'antenne qui tourne) change de boîte à chaque image, et recentrée sur elle, c'est la pièce FIXE qui
   * tremblait (Keko : « on dirait que le propulseur bouge de haut en bas alors qu'il devrait être fixe »).
   */
  cadre?: Forme[]
  /**
   * LA LUMIÈRE DU MONDE, donnée dans le repère de L'ÉCRAN (x à droite, y en bas, z vers nous) : en vol, le vaisseau
   * tourne et la lumière reste où elle est — celle des roches et de la station. Sans elle, la lumière du hangar, fixée
   * au vaisseau (de l'avant et de la gauche).
   */
  lumiere?: { x: number; y: number; z: number }
  /** Des matières à la place d'autres (le rival : la coque en carmin, la verrière en ambre). Un seul pas, pas de chaîne. */
  matieres?: Partial<Record<Matiere, Matiere>>
  /** Des RAMPES à la place de celles d'une matière (la livrée du joueur : sa coque, ses ailes). Elles passent avant `matieres`. */
  rampes?: Partial<Record<Matiere, number[]>>
}

/**
 * Peint des formes centrées sur (cx, cy) de l'écran, à `s` pixels l'unité. Le peintre est à l'origine de l'écran.
 * Rend la boîte de l'écran couverte, pour qui veut y poser une lueur.
 */
export function peindreFormes(p: Peintre, formes: Forme[], cx: number, cy: number, s: number, o: Options = {}): void {
  const cap = o.cap ?? -Math.PI / 2
  const ca = Math.cos(cap)
  const sa = Math.sin(cap)
  // la lumière dans le repère du vaisseau : celle du hangar, ou celle du monde ramenée de −cap
  let L = LUM
  let D = DEMI
  if (o.lumiere) {
    const v = [o.lumiere.x * ca + o.lumiere.y * sa, -o.lumiere.x * sa + o.lumiere.y * ca, o.lumiere.z]
    const n = Math.hypot(v[0], v[1], v[2]) || 1
    L = v.map((c) => c / n)
    const d = [L[0], L[1], L[2] + 1]
    const nd = Math.hypot(d[0], d[1], d[2])
    D = d.map((c) => c / nd)
  }
  const rampeDe = (f: Forme): number[] => o.rampes?.[f.mat] ?? RAMPES[o.matieres?.[f.mat] ?? f.mat]
  // local → écran : on tourne de cap, puis on agrandit
  const versEcran = (x: number, y: number): [number, number] => [cx + (x * ca - y * sa) * s, cy + (x * sa + y * ca) * s]
  // écran → local
  let x0 = Infinity
  let y0 = Infinity
  let x1 = -Infinity
  let y1 = -Infinity
  for (const f of formes) for (const [x, y] of f.pts) {
    const [ex, ey] = versEcran(x, y)
    x0 = Math.min(x0, ex)
    y0 = Math.min(y0, ey)
    x1 = Math.max(x1, ex)
    y1 = Math.max(y1, ey)
  }
  x0 = Math.floor(x0) - 2
  y0 = Math.floor(y0) - 2
  x1 = Math.ceil(x1) + 2
  y1 = Math.ceil(y1) + 2
  const W = x1 - x0
  const H = y1 - y0
  if (W <= 0 || H <= 0 || W * H > 40000) return
  const ids = new Int16Array(W * H).fill(-1)
  const lum = new Float32Array(W * H)
  const spec = new Float32Array(W * H)
  const loc = new Float32Array(W * H * 2)
  // 1. quelle forme couvre chaque pixel (la dernière posée est dessus)
  // (LA BOÎTE DE CHAQUE FORME D'ABORD — le cuirassé, 13/11 : quatre-vingts formes sur dix mille pixels, chacune essayée
  // point par point, coûtaient 105 ms par image, « ça rame à mort » ; un pixel n'est dans la boîte que de deux ou trois)
  const nf = formes.length
  const boites = new Float32Array(nf * 4)
  for (let k = 0; k < nf; k++) {
    let a = Infinity
    let b = Infinity
    let c = -Infinity
    let d = -Infinity
    for (const pt of formes[k].pts) {
      if (pt[0] < a) a = pt[0]
      if (pt[0] > c) c = pt[0]
      if (pt[1] < b) b = pt[1]
      if (pt[1] > d) d = pt[1]
    }
    boites[k * 4] = a
    boites[k * 4 + 1] = b
    boites[k * 4 + 2] = c
    boites[k * 4 + 3] = d
  }
  for (let py = 0; py < H; py++) for (let px = 0; px < W; px++) {
    const dx = (x0 + px + 0.5 - cx) / s
    const dy = (y0 + py + 0.5 - cy) / s
    const lx = dx * ca + dy * sa
    const ly = -dx * sa + dy * ca
    const i = py * W + px
    loc[i * 2] = lx
    loc[i * 2 + 1] = ly
    for (let k = nf - 1; k >= 0; k--) {
      if (lx < boites[k * 4] || lx > boites[k * 4 + 2] || ly < boites[k * 4 + 1] || ly > boites[k * 4 + 3]) continue
      if (dedans(formes[k].pts, lx, ly)) {
        ids[i] = k
        break
      }
    }
  }
  // la direction de la lumière à l'écran (pour les biseaux et le reflet)
  const lex = L[0] * ca - L[1] * sa
  const ley = L[0] * sa + L[1] * ca
  const ln = Math.hypot(lex, ley) || 1
  // (le pas d'un pixel VERS la lumière : en haut à gauche pour le nez en haut)
  const versLum: [number, number] = [Math.abs(lex) / ln > 0.38 ? Math.sign(lex) : 0, Math.abs(ley) / ln > 0.38 ? Math.sign(ley) : 0]
  // 2. l'éclairage de chaque pixel
  for (let py = 0; py < H; py++) for (let px = 0; px < W; px++) {
    const i = py * W + px
    const k = ids[i]
    if (k < 0) continue
    const f = formes[k]
    const lx = loc[i * 2]
    const ly = loc[i * 2 + 1]
    let n: [number, number, number] = [0, 0, 1]
    if (f.relief === 'cyl') {
      const hw = demiLargeur(f.pts, lx) || 1
      const v = Math.max(-1, Math.min(1, ly / hw)) * 0.96
      n = [0.12, v, Math.sqrt(1 - v * v)]
    } else if (f.relief === 'dome' && f.dome) {
      const dx = (lx - f.dome.x) / f.dome.rx
      const dy = (ly - f.dome.y) / f.dome.ry
      const d2 = Math.min(0.96, dx * dx + dy * dy)
      n = [dx, dy, Math.sqrt(1 - d2)]
    } else if (f.relief === 'plat') {
      // une plaque penchée, un peu plus claire vers l'avant (la lumière vient de devant)
      const c = f.penche ?? 0
      n = [0.08 + lx * 0.012, c * 0.3, 0.95]
    }
    const nl = Math.hypot(n[0], n[1], n[2])
    const d = (n[0] * L[0] + n[1] * L[1] + n[2] * L[2]) / nl
    // (la lumière ne pousse pas jusqu'au blanc : le blanc est réservé au spéculaire)
    let b = 0.14 + 0.66 * Math.max(0, d)
    if (f.relief === 'emis' && f.feu) {
      // la flamme : plus chaude près de la tuyère, et au cœur
      const u = Math.max(0, Math.min(1, (lx - f.feu.pointe) / (f.feu.base - f.feu.pointe)))
      const hw = demiLargeur(f.pts, lx) || 1
      const coeur = 1 - Math.min(1, Math.abs(ly) / hw)
      b = 0.15 + 0.6 * u + 0.35 * coeur
    } else {
      // le biseau : regarder vers la lumière et à l'opposé
      const ax = px + versLum[0]
      const ay = py + versLum[1]
      const bx = px - versLum[0]
      const by = py - versLum[1]
      const kA = ax >= 0 && ay >= 0 && ax < W && ay < H ? ids[ay * W + ax] : -1
      const kB = bx >= 0 && by >= 0 && bx < W && by < H ? ids[by * W + bx] : -1
      // vers la lumière : le bord s'éclaire ; si c'est une pièce posée dessus, c'est son ombre de contact
      if (kA !== k) b += kA > k ? -0.24 : 0.2
      // à l'opposé : le bord s'assombrit
      if (kB !== k && kB < k) b -= 0.12
      if (f.relief === 'cyl' || f.relief === 'dome') {
        const h = (n[0] * D[0] + n[1] * D[1] + n[2] * D[2]) / nl
        spec[i] = Math.pow(Math.max(0, h), f.mat === 'verre' ? 18 : 30)
      }
    }
    lum[i] = b
  }
  const blanc = o.blanc ?? 0
  const reflet = o.reflet ?? hex('#4a86b4')
  // 3. la peinture : les tons tramés, le spéculaire, le reflet sur les bords à l'ombre
  for (let py = 0; py < H; py++) for (let px = 0; px < W; px++) {
    const i = py * W + px
    const k = ids[i]
    if (k < 0) continue
    const f = formes[k]
    const R = rampeDe(f)
    if (blanc > 0.5) {
      p.rect(x0 + px, y0 + py, 1, 1, BLANC)
      continue
    }
    // la trame ne sert qu'à la frontière entre deux tons (une bande étroite), et jamais sur une plaque à plat
    const v = lum[i] * (R.length - 1)
    const fr = v - Math.floor(v)
    const tramee = f.relief !== 'plat' && fr > 0.42 && fr < 0.58
    let idx = Math.floor(v) + (tramee ? (BAYER[(py & 1) * 2 + (px & 1)] >= 2 ? 1 : 0) : fr >= 0.5 ? 1 : 0)
    idx = Math.max(0, Math.min(R.length - 1, idx))
    let c = R[idx]
    if (spec[i] > 0.55) c = R[R.length - 1]
    else if (spec[i] > 0.3 && idx < R.length - 1) c = R[Math.min(R.length - 1, idx + 1)]
    // le reflet froid : un bord tourné à l'opposé de la lumière, s'il donne sur le vide
    if (f.relief !== 'emis') {
      const bx = px - versLum[0]
      const by = py - versLum[1]
      const vide = bx < 0 || by < 0 || bx >= W || by >= H || ids[by * W + bx] < 0
      if (vide && lum[i] < 0.62) c = reflet
    }
    p.rect(x0 + px, y0 + py, 1, 1, c)
  }
  // 4. le contour sélectif, autour de ce qui n'est pas émissif
  for (let py = 0; py < H; py++) for (let px = 0; px < W; px++) {
    const i = py * W + px
    if (ids[i] >= 0) continue
    let meilleur = -1
    let bMax = -1
    for (let v4 = 0; v4 < 4; v4++) {
      const qx = px + VOISINS[v4 * 2]
      const qy = py + VOISINS[v4 * 2 + 1]
      if (qx < 0 || qy < 0 || qx >= W || qy >= H) continue
      const kq = ids[qy * W + qx]
      if (kq < 0 || formes[kq].relief === 'emis') continue
      if (lum[qy * W + qx] > bMax) {
        bMax = lum[qy * W + qx]
        meilleur = kq
      }
    }
    if (meilleur < 0) continue
    const c = blanc > 0.5 ? BLANC : bMax > 0.7 ? rampeDe(formes[meilleur])[1] : CONTOUR
    p.rect(x0 + px, y0 + py, 1, 1, c)
  }
}

/** Ce que porte le vaisseau : les crans et les pièces montées. */
export type Allure = {
  propulseur: number
  coque: number
  foreuse: number
  radar: boolean
  aimant: boolean
  armes: string[]
  bouclier: number
  /** Les outils PLACE PAR PLACE (null : une place libre) — pour une coque qui a des places d'outils à des endroits à elle. */
  outils?: ({ famille: string; cran: number } | null)[]
  /** La place de la foreuse qui creuse (celle qui suit sa cible). */
  foreusePlace?: number
  /** L'angle de visée de la foreuse de chaque place d'outil (absent : vers l'avant) — chacune suit SA roche. */
  vises?: number[]
}

/**
 * LE GABARIT D'UNE COQUE (Keko, 13/11 : « fabrique-moi un vaisseau de 200 T de type cuirassé, avec le nombre de
 * propulseurs adapté, très armé et outillé ») : tout ce que le reste du rendu supposait d'UN SEUL vaisseau — où sont
 * ses tuyères (des décalages, en unités du vaisseau, de la tuyère de série), ses places d'armes (un décalage et un
 * flanc), ses feux de position, sa verrière, son nez et ses flancs (les jets de manœuvre), le rayon de l'anneau de
 * son bouclier, et l'échelle à laquelle le montrer en grand (le hangar, l'accueil). Les coques 1 à 3 ont le gabarit
 * de toujours ; la 4, LE CUIRASSÉ, est deux fois et demie plus long : quatre tuyères, huit places d'armes sur ses
 * deux bords.
 */
export type Gabarit = {
  tuyeres: { x: number; y: number }[]
  armes: { x: number; y: number; s: number }[]
  feux: { x: number; y: number }
  verriere: number
  nez: number
  flanc: number
  anneau: number
  echelle: number
  /** Les places d'OUTILS, là où chacun est dessiné (absent : tous au milieu du toit, comme toujours). */
  outils?: { x: number; y: number }[]
  /** Les armes sont SUR le pont (dessinées par-dessus la coque) au lieu de dessous les ailes. */
  surLePont?: boolean
  /** UNE SOUCOUPE : pas de tuyère à la poupe, mais `n` petites tuyères tout autour, à `rayon`, la première à `depart`. */
  omni?: { n: number; rayon: number; depart: number }
}
const GABARIT_DE_SERIE: Gabarit = { tuyeres: [{ x: 0, y: 0 }], armes: [{ x: 0, y: 0, s: -1 }, { x: 0, y: 0, s: 1 }], feux: { x: -7.6, y: 8.2 }, verriere: 3.4, nez: 6.4, flanc: 5.2, anneau: 11, echelle: 1 }
// LE CUIRASSÉ, REFAIT PLUS GRAND (Keko, 13/11 : « plus gros encore, deux fois plus imposant ; une structure plus sympa,
// avec de vrais emplacements d'armes et d'outils matérialisés à des endroits différents ») : 72 unités de long sur 34
// de large (le vaisseau de série : 18 sur 17). Ses HUIT TOURELLES sont sur deux ponts latéraux, quatre par bord, chacune
// sur son socle ; ses QUATRE OUTILS sur l'échine, de la proue à la poupe ; quatre tuyères à la poupe.
/** Les centres des socles d'armes (x le long du vaisseau, de la proue à la poupe) et leur écart à l'axe. */
const TOURELLES_DU_CUIRASSE = { xs: [16, 5, -6, -17], y: 13.6 }
const OUTILS_DU_CUIRASSE = [{ x: 11, y: 0 }, { x: 2, y: 0 }, { x: -7, y: 0 }, { x: -16, y: 0 }]
const GABARIT_DU_CUIRASSE: Gabarit = {
  tuyeres: [0].map((y) => ({ x: -26.1, y })),
  // (les formes d'une arme sont dessinées autour de (−2, ±6,2) : le décalage l'amène sur son socle)
  armes: TOURELLES_DU_CUIRASSE.xs.flatMap((x) => [-1, 1].map((sg) => ({ x: x + 2, y: sg * (TOURELLES_DU_CUIRASSE.y - 6.2), s: sg }))),
  outils: OUTILS_DU_CUIRASSE,
  surLePont: true,
  feux: { x: -29, y: 16.6 },
  verriere: 24,
  nez: 35,
  flanc: 17,
  anneau: 40,
  echelle: 0.5,
}
// LA SALAMANDRE (Keko, 15/11) : un peu plus trapue que le chasseur, deux tuyères côte à côte, UNE place d'arme — le
// lance-flammes, dans l'axe, sa buse dépassant du nez
const GABARIT_DE_LA_SALAMANDRE: Gabarit = { tuyeres: [{ x: -0.5, y: -2.4 }, { x: -0.5, y: 2.4 }], armes: [{ x: 0, y: 0, s: 1 }], feux: { x: -7.2, y: 9.2 }, verriere: 2.4, nez: 6.5, flanc: 7, anneau: 13, echelle: 1 }
// LA SENTINELLE (Keko, 15/11) : ronde, cerclée d'un anneau ; deux tuyères ; ses armes sont des drones, hors de la coque
// (… PUIS UNE SOUCOUPE — Keko, 15/11 : « sans devant ni derrière, des propulseurs plus petits mais de tous les côtés,
// huit autour » : plus de tuyère à la poupe)
const GABARIT_DE_LA_SENTINELLE: Gabarit = { tuyeres: [], omni: { n: 8, rayon: 9.4, depart: Math.PI / 8 }, armes: [{ x: 0, y: 0, s: 1 }], feux: { x: -6, y: 8.4 }, verriere: 0, nez: 7.4, flanc: 7, anneau: 13, echelle: 1 }
// L'INGÉNIEUR (Keko, 15/11 : « des formes assez carrées, qui dénotent avec les autres ») : un caisson, deux tuyères
// carrées côte à côte à la poupe ; son arme est posée dans le monde
const GABARIT_DE_L_INGENIEUR: Gabarit = { tuyeres: [{ x: 0.2, y: -2.8 }, { x: 0.2, y: 2.8 }], armes: [{ x: 0, y: 0, s: 1 }], feux: { x: -6.4, y: 7.6 }, verriere: 4.6, nez: 7.4, flanc: 7.6, anneau: 13, echelle: 1 }
// LE FRIMAS (Keko, 15/11 : « alien, une autre race, un peu exotique ») : un corps en goutte entre deux croissants de
// cristal qui se referment devant lui comme des pinces ; une seule tuyère, à la pointe de la queue, qui souffle froid
const GABARIT_DU_FRIMAS: Gabarit = { tuyeres: [{ x: 2.4, y: 0 }], armes: [{ x: 0, y: 0, s: 1 }], feux: { x: 7.1, y: 3.9 }, verriere: 4.2, nez: 7.6, flanc: 6.5, anneau: 12.5, echelle: 1 }
// LE PULSAR (Keko, 16/11 : « alien, exotique, le plasma et l'énergie ») : une raie — deux grandes ailes en nageoires — autour
// d'un CŒUR DE PLASMA, deux cornes de décharge au nez entre lesquelles l'orbe se forme ; une tuyère, à la queue
const GABARIT_DU_PULSAR: Gabarit = { tuyeres: [{ x: 1.6, y: 0 }], armes: [{ x: 0, y: 0, s: 1 }], feux: { x: -5.3, y: 9.6 }, verriere: -1.4, nez: 9.4, flanc: 6, anneau: 12.5, echelle: 1 }
// LE KRAKEN (Keko, 16/11) : un manteau de chitine sur de la chair, deux nageoires de chair, des tentacules qui traînent
// derrière ; ses trois tentacules à aiguille partent de trois racines, à l'avant (`ANCRES_DU_KRAKEN`) ; un jet de bile
// à la queue
/** Les racines des tentacules du Kraken, en unités du vaisseau : la règle les reçoit d'ici (`Arme.tentacule.ancres`). */
// (UNE SEULE, À LA PROUE — Keko, 16/11 : « plutôt que trois tentacules qui attaquent à cette vitesse, un seul, beaucoup
// plus rapide »)
export const ANCRES_DU_KRAKEN: [number, number][] = [[7.2, 0]]
const GABARIT_DU_KRAKEN: Gabarit = { tuyeres: [{ x: 1, y: 0 }], armes: [{ x: 0, y: 0, s: 1 }], feux: { x: -4.4, y: 7.6 }, verriere: 5.8, nez: 8.2, flanc: 6.4, anneau: 12.5, echelle: 1 }
// LA VOUIVRE (Keko, 16/11) : un corps de serpent en écailles, deux sacs à venin sur des membranes, une gueule à mandibules
// qui crache ; un jet de venin à la queue
const GABARIT_DE_LA_VOUIVRE: Gabarit = { tuyeres: [{ x: -0.2, y: 0 }], armes: [{ x: 0, y: 0, s: 1 }], feux: { x: -6.2, y: 6.6 }, verriere: 8.4, nez: 9.8, flanc: 6.6, anneau: 13, echelle: 1 }
export const gabaritDe = (coque: number): Gabarit => (coque === 11 ? GABARIT_DE_LA_VOUIVRE : coque === 10 ? GABARIT_DU_KRAKEN : coque === 4 ? GABARIT_DU_CUIRASSE : coque === 5 ? GABARIT_DE_LA_SALAMANDRE : coque === 6 ? GABARIT_DE_LA_SENTINELLE : coque === 7 ? GABARIT_DE_L_INGENIEUR : coque === 8 ? GABARIT_DU_FRIMAS : coque === 9 ? GABARIT_DU_PULSAR : GABARIT_DE_SERIE)
/** La queue d'une coque : l'abscisse du fond de ses tuyères (pour un propulseur de série). */
export const queueDe = (coque: number): number => -8.4 + (gabaritDe(coque).tuyeres[0]?.x ?? 0)
/** Où l'outil de la place `k` est dessiné, en décalage du milieu du toit (nul pour une coque sans places à elle). */
export const placeDOutil = (coque: number, k: number): { x: number; y: number } => {
  const places = gabaritDe(coque).outils
  if (places === undefined) return { x: 0, y: 0 }
  const pl = places[Math.max(0, Math.min(places.length - 1, k))]
  return { x: pl.x + 2.2, y: pl.y }
}
/** LES TUYÈRES D'UNE SOUCOUPE (`Gabarit.omni`) : pour chacune, le bout (repère du vaisseau) et la direction où elle souffle. */
export function tuyeresOmni(coque: number): { x: number; y: number; ux: number; uy: number }[] {
  const o = gabaritDe(coque).omni
  if (o === undefined) return []
  return Array.from({ length: o.n }, (_, k) => {
    const a = o.depart + (k * 2 * Math.PI) / o.n
    return { x: Math.cos(a) * (o.rayon + 0.9), y: Math.sin(a) * (o.rayon + 0.9), ux: Math.cos(a), uy: Math.sin(a) }
  })
}
/** Une petite tuyère de soucoupe — une buse de manœuvre, comme celles du nez du chasseur —, tournée vers l'extérieur. */
function formesDeLaTuyereOmni(o: { n: number; rayon: number; depart: number }, k: number): Forme[] {
  const a = o.depart + (k * 2 * Math.PI) / o.n
  const P = (r: number, w: number): [number, number] => [Math.cos(a) * r - Math.sin(a) * w, Math.sin(a) * r + Math.cos(a) * w]
  const r0 = o.rayon - 0.5
  const r1 = o.rayon + 0.9
  return [
    { pts: [P(r0, -0.85), P(r1, -0.6), P(r1, 0.6), P(r0, 0.85)], mat: 'metal', relief: 'plat' },
    { pts: [P(r1 - 0.45, -0.68), P(r1, -0.6), P(r1, 0.6), P(r1 - 0.45, 0.68)], mat: 'acier', relief: 'plat' },
  ]
}
/**
 * UNE TOURELLE DE L'INGÉNIEUR, PEINTE COMME LES VAISSEAUX (Keko, 15/11 : « les tours, c'est juste des carrés avec un
 * trait ; un truc un peu plus texturé, plus proche des textures des vaisseaux — pas forcément un carré ») : LE SOCLE,
 * fixe — une plaque octogonale sur quatre pieds en croix, chacun son patin, quatre boulons jaunes —, et LA TÊTE, qui
 * pivote — une couronne d'acier, un carter kaki, un fût et son frein de bouche, une veilleuse à la marque du joueur.
 */
export function formesDuSocleDeTourelle(): Forme[] {
  const f: Forme[] = []
  for (const [dx, dy] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
    f.push({ pts: barre(0, 0, dx * 4.1, dy * 4.1, 1.4), mat: 'metal', relief: 'plat' })
    f.push({ pts: ovale(dx * 4.1, dy * 4.1, 1.2, 1.2, 10), mat: 'acier', relief: 'dome', dome: { x: dx * 4.1, y: dy * 4.1, rx: 1.2, ry: 1.2 } })
  }
  const octo = (r: number): [number, number][] => Array.from({ length: 8 }, (_, k) => [Math.cos(Math.PI / 8 + (k * Math.PI) / 4) * r, Math.sin(Math.PI / 8 + (k * Math.PI) / 4) * r])
  f.push({ pts: octo(4.4), mat: 'graphite', relief: 'plat' })
  f.push({ pts: octo(3.6), mat: 'acier', relief: 'plat' })
  for (let k = 0; k < 4; k++) {
    const a = (k * Math.PI) / 2
    f.push({ pts: ovale(Math.cos(a) * 3.9, Math.sin(a) * 3.9, 0.5, 0.5, 8), mat: 'or', relief: 'dome', dome: { x: Math.cos(a) * 3.9, y: Math.sin(a) * 3.9, rx: 0.5, ry: 0.5 } })
  }
  return f
}
/**
 * LA CAPSULE D'UNE TOURELLE LANCÉE (Keko, 15/11 : « trop petite par rapport à la tourelle ; un aspect métallisé ») : la
 * tourelle repliée — un caisson octogonal d'acier, un couvercle plus clair, quatre boulons jaunes, un voyant vert.
 */
export function formesDeLaCapsule(): Forme[] {
  const octo = (r: number): [number, number][] => Array.from({ length: 8 }, (_, k) => [Math.cos(Math.PI / 8 + (k * Math.PI) / 4) * r, Math.sin(Math.PI / 8 + (k * Math.PI) / 4) * r])
  const f: Forme[] = [
    { pts: octo(4.2), mat: 'metal', relief: 'plat' },
    { pts: octo(3.1), mat: 'acier', relief: 'plat' },
  ]
  for (let k = 0; k < 4; k++) {
    const a = Math.PI / 4 + (k * Math.PI) / 2
    f.push({ pts: ovale(Math.cos(a) * 3.4, Math.sin(a) * 3.4, 0.55, 0.55, 8), mat: 'or', relief: 'dome', dome: { x: Math.cos(a) * 3.4, y: Math.sin(a) * 3.4, rx: 0.55, ry: 0.55 } })
  }
  f.push({ pts: ovale(0, 0, 1.6, 1.6, 12), mat: 'metal', relief: 'dome', dome: { x: 0, y: 0, rx: 1.6, ry: 1.6 } })
  f.push({ pts: ovale(0, 0, 0.6, 0.6, 8), mat: 'marque', relief: 'dome', dome: { x: 0, y: 0, rx: 0.6, ry: 0.6 } })
  return f
}
/**
 * LA SCIE CIRCULAIRE DE L'INGÉNIEUR (Keko, 15/11 : « une scie circulaire qui tourne, qu'on lance et qui revient ») : un
 * disque d'acier à douze dents en biais, un plateau plus sombre percé de trois lumières, un moyeu jaune.
 */
export function formesDeLaScie(): Forme[] {
  const n = 12
  const dents: [number, number][] = []
  for (let k = 0; k < n; k++) {
    const a = (k * 2 * Math.PI) / n
    dents.push([Math.cos(a) * 3.7, Math.sin(a) * 3.7], [Math.cos(a + (2 * Math.PI) / n * 0.8) * 4.9, Math.sin(a + (2 * Math.PI) / n * 0.8) * 4.9])
  }
  const f: Forme[] = [
    { pts: dents, mat: 'acier', relief: 'plat' },
    { pts: ovale(0, 0, 3.2, 3.2, 16), mat: 'metal', relief: 'plat' },
  ]
  for (let k = 0; k < 3; k++) {
    const a = (k * 2 * Math.PI) / 3
    f.push({ pts: ovale(Math.cos(a) * 2, Math.sin(a) * 2, 0.6, 0.6, 8), mat: 'graphite', relief: 'plat' })
  }
  f.push({ pts: ovale(0, 0, 1.2, 1.2, 10), mat: 'or', relief: 'dome', dome: { x: 0, y: 0, rx: 1.2, ry: 1.2 } })
  f.push({ pts: ovale(0, 0, 0.45, 0.45, 6), mat: 'acier', relief: 'plat' })
  return f
}
/**
 * UNE BALISE DE L'INGÉNIEUR (Keko, 15/11 : des balises-pièges qui se tirent des rivets) : un plot hexagonal d'acier sur
 * trois pattes, un collier plus clair, un fanal jaune au sommet ; son BEC — un petit canon à rivets — se dessine à part,
 * tourné vers la balise d'en face (`formesDuBecDeBalise`).
 */
export function formesDeLaBalise(): Forme[] {
  const hexa = (r: number): [number, number][] => Array.from({ length: 6 }, (_, k) => [Math.cos((k * Math.PI) / 3) * r, Math.sin((k * Math.PI) / 3) * r])
  const f: Forme[] = []
  for (let k = 0; k < 3; k++) {
    const a = Math.PI / 6 + (k * 2 * Math.PI) / 3
    f.push({ pts: barre(0, 0, Math.cos(a) * 3.6, Math.sin(a) * 3.6, 1), mat: 'metal', relief: 'plat' })
  }
  f.push({ pts: hexa(2.7), mat: 'graphite', relief: 'plat' })
  f.push({ pts: hexa(2), mat: 'acier', relief: 'plat' })
  // (le fanal : la marque du joueur — à plusieurs, on sait à qui est le piège)
  f.push({ pts: ovale(0, 0, 1, 1, 10), mat: 'marque', relief: 'dome', dome: { x: 0, y: 0, rx: 1, ry: 1 } })
  return f
}
/** Le bec d'une balise : un court canon à rivets, vers l'avant (le cap le tourne vers la balise d'en face). */
export function formesDuBecDeBalise(): Forme[] {
  return [
    { pts: barre(1.6, 0, 4.2, 0, 0.9), mat: 'acier', relief: 'cyl' },
    { pts: barre(3.6, 0, 4.4, 0, 1.3), mat: 'metal', relief: 'cyl' },
  ]
}
export function formesDeLaTeteDeTourelle(): Forme[] {
  // (un carter anguleux, pas un dôme — rond et gros, il cachait le socle —, le canon épais et long)
  return [
    { pts: ovale(0, 0, 2.6, 2.6, 16), mat: 'metal', relief: 'dome', dome: { x: 0, y: 0, rx: 2.6, ry: 2.6 } },
    { pts: barre(1.5, 0, 6.4, 0, 1), mat: 'acier', relief: 'cyl' },
    { pts: barre(5.5, 0, 6.8, 0, 1.45), mat: 'metal', relief: 'cyl' },
    // (le carter au kaki de l'Ingénieur, la veilleuse à la marque du joueur)
    { pts: [[2.6, -1.7], [1, -2.3], [-2.2, -2.3], [-2.8, -1.2], [-2.8, 1.2], [-2.2, 2.3], [1, 2.3], [2.6, 1.7]], mat: 'kaki', relief: 'cyl' },
    { pts: [[0.6, -2.3], [-0.2, -2.3], [-0.2, 2.3], [0.6, 2.3]], mat: 'acier', relief: 'plat' },
    { pts: ovale(-1.7, 0, 0.7, 0.7, 8), mat: 'marque', relief: 'dome', dome: { x: -1.7, y: 0, rx: 0.7, ry: 0.7 } },
  ]
}
/** Des formes déplacées de (dx, dy) — une arme à sa place, une tuyère à la sienne. */
function decaler(formes: Forme[], dx: number, dy: number): Forme[] {
  if (dx === 0 && dy === 0) return formes
  return formes.map((f) => ({ ...f, pts: f.pts.map(([x, y]): [number, number] => [x + dx, y + dy]), dome: f.dome === undefined ? undefined : { ...f.dome, x: f.dome.x + dx, y: f.dome.y + dy }, feu: f.feu === undefined ? undefined : { base: f.feu.base + dx, pointe: f.feu.pointe + dx } }))
}

/** LES FORMES DE LA COQUE d'un cran : le fuseau et la verrière ; le blindé ses plaques, le bouclier ses émetteurs. */
/**
 * UNE PUSTULE QUI BAT (la Vouivre, Keko, 16/11 : « un aspect plus bubonique : des pustules qui battent ») : un bourrelet
 * enflammé de lie, le bubon de venin dessus, qui ENFLE ET DÉSENFLE en double battement, comme un pouls (`t` : l'instant ;
 * à zéro, le pictogramme, immobile).
 */
function pustule(x: number, y: number, r: number, t: number, phase: number): Forme[] {
  const ph = (t * 1.6 + phase) % 1
  // (deux coups rapprochés, puis un repos : boum-boum… boum-boum)
  const pouls = t === 0 ? 0 : Math.exp(-(((ph - 0.08) / 0.05) ** 2)) + 0.7 * Math.exp(-(((ph - 0.25) / 0.05) ** 2))
  const rr = r * (1 + 0.28 * pouls)
  return [
    { pts: ovale(x, y, r * 1.3 + 0.2, r * 1.3 + 0.2, 12), mat: 'lie', relief: 'dome', dome: { x, y, rx: r * 1.3 + 0.2, ry: r * 1.3 + 0.2 } },
    { pts: ovale(x, y, rr, rr, 12), mat: 'venin', relief: 'dome', dome: { x, y, rx: rr, ry: rr } },
  ]
}
export function formesDeLaCoque(cran: number, t = 0): Forme[] {
  if (cran === 11) {
    // LA VOUIVRE, UN SERPENT D'ÉCAILLES : un corps long et fuselé ; des anneaux d'écailles en chevrons, cernés de lie ; trois
    // pustules de venin sur l'échine ; À LA GUEULE, deux MANDIBULES d'os en crochet, le venin qui luit entre elles
    const f: Forme[] = [{ pts: [[8.8, 0], [7.8, -2.4], [5.2, -3.5], [1.2, -3.9], [-3, -3.6], [-6.4, -2.7], [-8.8, -1.3], [-9.8, 0], [-8.8, 1.3], [-6.4, 2.7], [-3, 3.6], [1.2, 3.9], [5.2, 3.5], [7.8, 2.4]], mat: 'ecaille', relief: 'cyl' }]
    for (const x of [4.6, 1.6, -1.4, -4.4, -7]) f.push({ pts: [[x + 0.6, 0], [x - 0.6, -3.2 + Math.abs(x + 1) * 0.08], [x - 1.2, -3.1 + Math.abs(x + 1) * 0.08], [x - 0.2, 0], [x - 1.2, 3.1 - Math.abs(x + 1) * 0.08], [x - 0.6, 3.2 - Math.abs(x + 1) * 0.08]], mat: 'lie', relief: 'plat' })
    // (UN CORPS BUBONIQUE — Keko, 16/11 : des pustules de toutes tailles, semées sur l'échine et les flancs, qui battent
    // chacune à son rythme)
    for (const [x, y, r, ph] of [[2.8, 0, 0.95, 0], [-0.2, 0.3, 0.85, 0.37], [-3.2, -0.2, 0.75, 0.71], [-6, 0.1, 0.6, 0.15], [4.6, -2.2, 0.55, 0.52], [1.4, 2.6, 0.6, 0.88], [-1.8, -2.7, 0.65, 0.23], [-4.8, 2.3, 0.5, 0.63], [5.8, 1.6, 0.45, 0.41], [-7.6, -1.2, 0.45, 0.79]] as [number, number, number, number][]) f.push(...pustule(x, y, r, t, ph))
    for (const sg of [-1, 1]) f.push({ pts: [[10.2, sg * 0.5], [9.4, sg * 1.6], [7.6, sg * 2.2], [7.2, sg * 1.5], [8.6, sg * 1.2], [9.4, sg * 0.4]], mat: 'os', relief: 'plat', penche: sg })
    f.push({ pts: ovale(8.6, 0, 1.1, 0.75, 10), mat: 'venin', relief: 'dome', dome: { x: 8.6, y: 0, rx: 1.1, ry: 0.75 } })
    return f
  }
  if (cran === 10) {
    // LE KRAKEN, UN MANTEAU DE CHITINE : un corps renflé, bosselé, la tête en avant ; trois plaques de carapace sur le
    // dos, séparées par des sillons de chair ; une grappe d'YEUX de bile à l'avant ; et LES TROIS RACINES des tentacules
    // (des bourrelets de chair, à leurs ancres)
    const f: Forme[] = [{ pts: [[8.2, 0], [7.4, -2.2], [5.2, -3.9], [2, -4.9], [-1.6, -4.7], [-4.6, -4.1], [-7, -2.8], [-8.2, -1], [-8.2, 1], [-7, 2.8], [-4.6, 4.1], [-1.6, 4.7], [2, 4.9], [5.2, 3.9], [7.4, 2.2]], mat: 'chitine', relief: 'cyl' }]
    // (les sillons de chair, en arc, entre les plaques)
    for (const x of [2.6, -0.9, -4.3]) f.push({ pts: [[x + 0.4, -4.1], [x - 0.5, -2], [x - 0.8, 0], [x - 0.5, 2], [x + 0.4, 4.1], [x - 0.2, 4.2], [x - 1.2, 2], [x - 1.5, 0], [x - 1.2, -2], [x - 0.2, -4.2]], mat: 'chair', relief: 'plat' })
    // (une crête d'épines d'os sur l'échine)
    for (const x of [0.9, -2.6, -6]) f.push({ pts: [[x + 0.9, 0], [x - 0.6, -0.55], [x - 0.3, 0], [x - 0.6, 0.55]], mat: 'os', relief: 'plat' })
    // (la racine de la tentacule)
    for (const [x, y] of ANCRES_DU_KRAKEN) f.push({ pts: ovale(x, y, 1.5, 1.5, 12), mat: 'chair', relief: 'dome', dome: { x, y, rx: 1.5, ry: 1.5 } })
    // (les yeux : une grappe de bile)
    for (const [x, y, r] of [[5.8, -1.3, 0.75], [6.3, 0.9, 0.6], [5.2, 0.1, 0.5], [4.6, -2.1, 0.45]] as [number, number, number][]) f.push({ pts: ovale(x, y, r, r, 10), mat: 'bile', relief: 'dome', dome: { x, y, rx: r, ry: r } })
    return f
  }
  if (cran === 9) {
    // LE PULSAR, UNE CARAPACE D'OBSIDIENNE : un corps fuselé, le CŒUR DE PLASMA au milieu dans sa bague, deux évents qui
    // luisent sur l'échine ; au nez, DEUX CORNES DE DÉCHARGE mauves, une étincelle de plasma au bout de chacune
    const f: Forme[] = [{ pts: [[6.2, 0], [4.6, -1.6], [1.6, -2.6], [-2, -2.8], [-5.2, -2.2], [-7.4, -1], [-7.8, 0], [-7.4, 1], [-5.2, 2.2], [-2, 2.8], [1.6, 2.6], [4.6, 1.6]], mat: 'obsidienne', relief: 'cyl' }]
    for (const sg of [-1, 1]) {
      f.push({ pts: [[3, sg * 0.9], [6.4, sg * 0.9], [9.4, sg * 0.55], [9.7, sg * 1.1], [6.6, sg * 2], [2.8, sg * 2.4]], mat: 'mauve', relief: 'plat', penche: sg })
      f.push({ pts: ovale(9.25, sg * 0.85, 0.5, 0.5, 8), mat: 'plasma', relief: 'dome', dome: { x: 9.25, y: sg * 0.85, rx: 0.5, ry: 0.5 } })
    }
    for (const [x, r] of [[-4.3, 0.55], [-5.8, 0.42]]) f.push({ pts: ovale(x, 0, r, r, 8), mat: 'plasma', relief: 'dome', dome: { x, y: 0, rx: r, ry: r } })
    f.push({ pts: ovale(-1.4, 0, 2.6, 2.6, 18), mat: 'metal', relief: 'dome', dome: { x: -1.4, y: 0, rx: 2.6, ry: 2.6 } })
    f.push({ pts: ovale(-1.4, 0, 1.9, 1.9, 16), mat: 'plasma', relief: 'dome', dome: { x: -1.4, y: 0, rx: 1.9, ry: 1.9 } })
    return f
  }
  if (cran === 8) {
    // LE FRIMAS, UNE CARAPACE D'AILLEURS : un corps en goutte, la pointe en avant ; trois chevrons de carapace sur le dos,
    // comme les anneaux d'un insecte ; un CŒUR de glace au milieu ; un ŒIL fendu à la proue, de glace aussi
    // (sa couleur à lui : une carapace de nacre, des chevrons et des croissants d'indigo, la glace ; le bout des cornes est
    // la marque du joueur)
    const f: Forme[] = [{ pts: [[7.6, 0], [5.6, -1.5], [2.6, -2.7], [-1, -3.3], [-4, -3.1], [-6.2, -2], [-7.1, 0], [-6.2, 2], [-4, 3.1], [-1, 3.3], [2.6, 2.7], [5.6, 1.5]], mat: 'nacre', relief: 'cyl' }]
    for (const x of [-2.4, -4.2, -6]) f.push({ pts: [[x + 0.9, 0], [x - 0.3, -2.1 + (x + 6) * 0.15], [x - 1.1, -2 + (x + 6) * 0.15], [x - 0.1, 0], [x - 1.1, 2 - (x + 6) * 0.15], [x - 0.3, 2.1 - (x + 6) * 0.15]], mat: 'indigo', relief: 'plat' })
    f.push({ pts: ovale(0.2, 0, 1.6, 1.6, 14), mat: 'glace', relief: 'dome', dome: { x: 0.2, y: 0, rx: 1.6, ry: 1.6 } })
    f.push({ pts: [[5.8, 0], [4.6, -0.8], [3, -0.6], [2.6, 0], [3, 0.6], [4.6, 0.8]], mat: 'glace', relief: 'dome', dome: { x: 4.2, y: 0, rx: 1.7, ry: 0.8 } })
    return f
  }
  if (cran === 7) {
    // L'INGÉNIEUR, UN CAISSON (Keko, 15/11 : « mécanique, carré ») : une coque rectangulaire aux coins coupés ; une cabine
    // carrée vitrée à la proue ; la SOUTE À TOURELLES sur le dos, trois modules carrés rangés ; des plaques boulonnées
    // (sa couleur à lui : un caisson kaki, des caissons latéraux de graphite ; les voyants des modules sont la marque)
    const f: Forme[] = [{ pts: [[7.4, -3.4], [6.4, -4.4], [-6.4, -4.4], [-7.4, -3.4], [-7.4, 3.4], [-6.4, 4.4], [6.4, 4.4], [7.4, 3.4]], mat: 'kaki', relief: 'cyl' }]
    f.push({ pts: [[6.6, -2], [4, -2], [4, 2], [6.6, 2]], mat: 'acier', relief: 'plat' })
    f.push({ pts: [[6.2, -1.5], [4.4, -1.5], [4.4, 1.5], [6.2, 1.5]], mat: 'verre', relief: 'plat' })
    f.push({ pts: [[2.6, -3], [-6, -3], [-6, 3], [2.6, 3]], mat: 'metal', relief: 'plat' })
    for (const x of [1.6, -1.2, -4]) f.push({ pts: [[x, -2.2], [x - 2.2, -2.2], [x - 2.2, 2.2], [x, 2.2]], mat: 'acier', relief: 'plat' })
    for (const x of [0.5, -2.3, -5.1]) f.push({ pts: [[x + 0.6, -0.6], [x - 0.6, -0.6], [x - 0.6, 0.6], [x + 0.6, 0.6]], mat: 'marque', relief: 'plat' })
    for (const [x, y] of [[6.6, -3.6], [6.6, 3.6], [-6.6, -3.6], [-6.6, 3.6]]) f.push({ pts: [[x + 0.4, y - 0.4], [x - 0.4, y - 0.4], [x - 0.4, y + 0.4], [x + 0.4, y + 0.4]], mat: 'metal', relief: 'plat' })
    return f
  }
  if (cran === 6) {
    // LA SENTINELLE, UNE SOUCOUPE (Keko, 15/11) : un disque, SANS AVANT NI ARRIÈRE — un dôme vitré au centre, huit
    // rivets en couronne, trois BERCEAUX de drone (vides : les drones sont dehors) répartis sur le dessus, des feux
    // verts entre eux ; les huit tuyères sont tout autour (voir `formesDeLaTuyereOmni`)
    // (sa couleur à elle : un disque de perle dans un anneau de sarcelle ; ses trois feux sont la marque du joueur)
    const f: Forme[] = [{ pts: ovale(0, 0, 6.8, 6.8, 28), mat: 'perle', relief: 'cyl' }]
    for (let k = 0; k < 8; k++) {
      const a = (k * Math.PI) / 4
      f.push({ pts: ovale(Math.cos(a) * 5.6, Math.sin(a) * 5.6, 0.45, 0.45, 8), mat: 'metal', relief: 'dome', dome: { x: Math.cos(a) * 5.6, y: Math.sin(a) * 5.6, rx: 0.45, ry: 0.45 } })
    }
    for (let k = 0; k < 3; k++) {
      const a = -Math.PI / 2 + (k * 2 * Math.PI) / 3
      const x = Math.cos(a) * 3.9
      const y = Math.sin(a) * 3.9
      f.push({ pts: ovale(x, y, 1.4, 1.4, 12), mat: 'metal', relief: 'dome', dome: { x, y, rx: 1.4, ry: 1.4 } })
      const b = a + Math.PI / 3
      f.push({ pts: ovale(Math.cos(b) * 3.9, Math.sin(b) * 3.9, 0.75, 0.75, 8), mat: 'marque', relief: 'dome', dome: { x: Math.cos(b) * 3.9, y: Math.sin(b) * 3.9, rx: 0.75, ry: 0.75 } })
    }
    f.push({ pts: ovale(0, 0, 2.3, 2.3, 18), mat: 'verre', relief: 'dome', dome: { x: 0, y: 0, rx: 2.3, ry: 2.3 } })
    return f
  }
  if (cran === 5) {
    // LA SALAMANDRE, UNE AUTRE SILHOUETTE (Keko, 15/11 : « changer légèrement la forme, la rendre plus distinguable du
    // chasseur ») : pas une fléchette — un corps rond et trapu, le nez court et camus, une échine d'acier ; ses
    // réservoirs sont ses nacelles, de part et d'autre (voir `formesDesAiles`) ; la verrière en avant
    // (sa couleur à elle : de la suie, l'échine d'acier, des pylônes de cuivre, la verrière d'ambre)
    const f: Forme[] = [{ pts: [[6.5, 0], [5.8, -2.6], [3.5, -4.2], [-1, -4.7], [-6, -4.5], [-8.4, -3], [-8.9, 0], [-8.4, 3], [-6, 4.5], [-1, 4.7], [3.5, 4.2], [5.8, 2.6]], mat: 'suie', relief: 'cyl' }]
    f.push({ pts: [[0.5, -1], [-7, -1.3], [-7, 1.3], [0.5, 1]], mat: 'acier', relief: 'plat' })
    for (const x of [-2.2, -4.6]) f.push({ pts: [[x + 0.4, -1.5], [x - 0.4, -1.5], [x - 0.4, 1.5], [x + 0.4, 1.5]], mat: 'metal', relief: 'plat' })
    f.push({ pts: ovale(2.4, 0, 2.3, 1.6, 18), mat: 'ambre', relief: 'dome', dome: { x: 2.4, y: 0, rx: 2.3, ry: 1.6 } })
    return f
  }
  if (cran === 4) {
    // LE CUIRASSÉ : une longue coque d'acier riveté — la proue en coin, les flancs droits, la poupe carrée —, deux
    // plaques de blindage le long des flancs, une échine de superstructure à membrures, la tour de la passerelle
    // vitrée vers l'avant, deux émetteurs de bouclier à la poupe ; et SES EMPLACEMENTS, vides ou non : huit socles de
    // tourelle sur les ponts latéraux, quatre socles d'outil sur l'échine
    const f: Forme[] = [{ pts: [[38, 0], [31, -5], [20, -9.5], [4, -11.5], [-20, -11.5], [-30, -9.5], [-33, -6.5], [-33, 6.5], [-30, 9.5], [-20, 11.5], [4, 11.5], [20, 9.5], [31, 5]], mat: 'blinde', relief: 'cyl' }]
    for (const sg of [-1, 1]) f.push({ pts: [[18, sg * 6.4], [-24, sg * 7.4], [-24, sg * 10.6], [18, sg * 8.6]], mat: 'blinde', relief: 'plat', penche: sg })
    f.push({ pts: [[15, -3.8], [-19, -4.6], [-22, -3], [-22, 3], [-19, 4.6], [15, 3.8]], mat: 'acier', relief: 'cyl' })
    for (const x of [6.5, -2.5, -11.5, -20]) f.push({ pts: [[x, -4.2], [x - 1, -4.2], [x - 1, 4.2], [x, 4.2]], mat: 'metal', relief: 'plat' })
    for (const pl of OUTILS_DU_CUIRASSE) {
      f.push({ pts: ovale(pl.x, pl.y, 3.3, 3.3, 16), mat: 'metal', relief: 'dome', dome: { x: pl.x, y: pl.y, rx: 3.3, ry: 3.3 } })
      f.push({ pts: ovale(pl.x, pl.y, 2.3, 2.3, 14), mat: 'blinde', relief: 'dome', dome: { x: pl.x, y: pl.y, rx: 2.3, ry: 2.3 } })
    }
    for (const sg of [-1, 1]) f.push({ pts: ovale(-27, sg * 5, 1.6, 1.6, 12), mat: 'emeraude', relief: 'dome', dome: { x: -27, y: sg * 5, rx: 1.6, ry: 1.6 } })
    f.push({ pts: ovale(24, 0, 5.8, 4, 18), mat: 'acier', relief: 'dome', dome: { x: 24, y: 0, rx: 5.8, ry: 4 } })
    f.push({ pts: ovale(25, 0, 4.2, 2.6, 18), mat: 'verre', relief: 'dome', dome: { x: 25, y: 0, rx: 4.2, ry: 2.6 } })
    return f
  }
  const mat: Matiere = cran === 2 ? 'blinde' : 'coque'
  const fuseau: [number, number][] =
    cran === 2
      ? [[8.5, 0], [6.2, -1.9], [3, -3.5], [-3, -4.6], [-6.2, -4.6], [-7.6, -2.8], [-7.6, 2.8], [-6.2, 4.6], [-3, 4.6], [3, 3.5], [6.2, 1.9]]
      : cran === 3
        ? [[9.6, 0], [6.4, -1.7], [2.4, -3.1], [-2.8, -3.8], [-6, -3.5], [-7.2, -2.1], [-7.2, 2.1], [-6, 3.5], [-2.8, 3.8], [2.4, 3.1], [6.4, 1.7]]
        : [[9, 0], [6.2, -1.6], [3, -3], [-2, -3.8], [-5, -4], [-7, -2.4], [-7, 2.4], [-5, 4], [-2, 3.8], [3, 3], [6.2, 1.6]]
  const f: Forme[] = [{ pts: fuseau, mat, relief: 'cyl' }]
  if (cran === 2) {
    // deux plaques de blindage rivetées sur les flancs
    for (const s of [-1, 1]) f.push({ pts: [[2, s * 2.2], [-4.5, s * 2.8], [-4.5, s * 4.1], [2, s * 3.1]], mat: 'blinde', relief: 'plat', penche: s })
  }
  if (cran === 3) {
    // les émetteurs du bouclier, deux pastilles vertes de part et d'autre
    for (const s of [-1, 1]) f.push({ pts: ovale(-3.4, s * 2.7, 0.9, 0.9, 10), mat: 'emeraude', relief: 'dome', dome: { x: -3.4, y: s * 2.7, rx: 0.9, ry: 0.9 } })
  }
  f.push({ pts: ovale(3.4, 0, 2.5, 1.55, 18), mat: 'verre', relief: 'dome', dome: { x: 3.4, y: 0, rx: 2.5, ry: 1.55 } })
  return f
}
/** LES AILES, deux plaques penchées, le bout rouge — le cuirassé, lui, a deux longs bords d'armement. */
/**
 * UN CROISSANT DU FRIMAS (côté `sg`) : une corne courbe qui part de la queue, s'écarte du corps et se referme devant le
 * nez, épaisse au milieu, effilée aux deux bouts — et trois épines de cristal sur son bord extérieur.
 */
function formesDuCroissant(sg: number): Forme[] {
  const R = 8.6
  const cx = -0.5
  const d0 = 25
  const d1 = 160
  const ext: [number, number][] = []
  const int: [number, number][] = []
  for (let d = d0; d <= d1; d += 9) {
    const a = (d * Math.PI) / 180
    const w = 0.2 + 2.3 * Math.sin((Math.PI * (d - d0)) / (d1 - d0))
    ext.push([cx + Math.cos(a) * R, sg * Math.sin(a) * R])
    int.unshift([cx + Math.cos(a) * (R - w), sg * Math.sin(a) * (R - w)])
  }
  const f: Forme[] = [{ pts: [...ext, ...int], mat: 'indigo', relief: 'plat', penche: sg }]
  // (DEUX NERVURES FINES ET COURBES le tiennent au corps — une barre droite faisait trop « humain »)
  f.push({ pts: [[1.4, sg * 2.6], [0.9, sg * 4.4], [-0.2, sg * 6.9], [-1.3, sg * 6.9], [-0.3, sg * 4.4], [0.2, sg * 2.8]], mat: 'nacre', relief: 'plat', penche: sg })
  f.push({ pts: [[-3.6, sg * 3], [-4.6, sg * 4.2], [-5.8, sg * 5.6], [-6.7, sg * 5.3], [-5.4, sg * 3.9], [-4.6, sg * 2.8]], mat: 'nacre', relief: 'plat', penche: sg })
  for (const d of [62, 95, 128]) {
    const a = (d * Math.PI) / 180
    const ux = Math.cos(a)
    const uy = Math.sin(a)
    const b0 = [cx + Math.cos(a - 0.09) * (R - 0.3), sg * Math.sin(a - 0.09) * (R - 0.3)] as [number, number]
    const b1 = [cx + Math.cos(a + 0.09) * (R - 0.3), sg * Math.sin(a + 0.09) * (R - 0.3)] as [number, number]
    const pointe = [cx + ux * (R + 1.9), sg * uy * (R + 1.9)] as [number, number]
    f.push({ pts: [b0, pointe, b1], mat: 'glace', relief: 'plat', penche: sg })
  }
  // (le bout de la corne, devant : une goutte de glace)
  const at = (d0 * Math.PI) / 180
  f.push({ pts: ovale(cx + Math.cos(at) * (R - 0.4), sg * Math.sin(at) * (R - 0.4), 0.85, 0.85, 8), mat: 'marque', relief: 'dome', dome: { x: cx + Math.cos(at) * (R - 0.4), y: sg * Math.sin(at) * (R - 0.4), rx: 0.85, ry: 0.85 } })
  return f
}
export function formesDesAiles(coque = 1, t = 0): Forme[] {
  const f: Forme[] = []
  if (coque === 11) {
    // (la vouivre : deux MEMBRANES de lie, nervurées d'écailles, chacune portant un gros SAC À VENIN qui luit ; un petit
    // ergot au bout, à la marque du joueur)
    for (const sg of [-1, 1]) {
      f.push({ pts: [[3.2, sg * 3.3], [0.6, sg * 6.4], [-3.4, sg * 7.6], [-6.8, sg * 7], [-7.6, sg * 5], [-5.4, sg * 3.3]], mat: 'lie', relief: 'plat', penche: sg })
      for (const [x0, y0, x1, y1] of [[1.4, 3.6, -0.6, 6.6], [-2, 3.6, -3.6, 7.3], [-5, 3.4, -6.6, 6.6]] as [number, number, number, number][]) f.push({ pts: barre(x0, sg * y0, x1, sg * y1, 0.5), mat: 'ecaille', relief: 'plat' })
      // (le sac à venin bat aussi, lentement, et porte deux pustules)
      const gonfle = t === 0 ? 1 : 1 + 0.1 * Math.sin(t * 3 + sg)
      f.push({ pts: ovale(-2.4, sg * 5.3, 2.4 * gonfle, 1.5 * gonfle, 16), mat: 'venin', relief: 'dome', dome: { x: -2.4, y: sg * 5.3, rx: 2.4 * gonfle, ry: 1.5 * gonfle } })
      f.push(...pustule(-1.2, sg * 4.6, 0.55, t, sg > 0 ? 0.3 : 0.8), ...pustule(-3.8, sg * 6.1, 0.45, t, sg > 0 ? 0.6 : 0.1))
      f.push({ pts: ovale(-6.8, sg * 6.4, 0.8, 0.8, 8), mat: 'marque', relief: 'dome', dome: { x: -6.8, y: sg * 6.4, rx: 0.8, ry: 0.8 } })
    }
    return f
  }
  if (coque === 10) {
    // (le kraken : deux NAGEOIRES DE CHAIR, ourlées d'épines d'os ; une glande sur chacune, à la marque du joueur)
    for (const sg of [-1, 1]) {
      f.push({ pts: [[3.4, sg * 3.6], [1.2, sg * 6], [-1.8, sg * 7.8], [-4.6, sg * 8.2], [-6.4, sg * 6.8], [-6.2, sg * 4.8], [-4.2, sg * 4.6]], mat: 'chair', relief: 'plat', penche: sg })
      for (const [x, y] of [[1, 6], [-2, 7.7], [-5, 8]] as [number, number][]) f.push({ pts: [[x + 0.7, sg * (y - 0.3)], [x - 0.2, sg * (y + 1.6)], [x - 0.6, sg * (y - 0.1)]], mat: 'os', relief: 'plat' })
      f.push({ pts: ovale(-2.6, sg * 6.1, 0.85, 0.85, 10), mat: 'marque', relief: 'dome', dome: { x: -2.6, y: sg * 6.1, rx: 0.85, ry: 0.85 } })
    }
    return f
  }
  if (coque === 9) {
    // (le pulsar : deux grandes NAGEOIRES de raie, mauves, le bord d'attaque sombre, parcourues de deux veines de plasma ;
    // le bout est la marque du joueur)
    for (const sg of [-1, 1]) {
      f.push({ pts: [[3.2, sg * 2.2], [1.4, sg * 4.6], [-1.4, sg * 7.4], [-4.6, sg * 9.6], [-6, sg * 9.4], [-5.2, sg * 7.4], [-5.6, sg * 5], [-6.8, sg * 2.6]], mat: 'mauve', relief: 'plat', penche: sg })
      f.push({ pts: [[3.2, sg * 2.2], [1.4, sg * 4.6], [-1.4, sg * 7.4], [-4.6, sg * 9.6], [-4.9, sg * 9], [-1.9, sg * 6.9], [0.7, sg * 4.4], [2.4, sg * 2.3]], mat: 'obsidienne', relief: 'plat', penche: sg })
      f.push({ pts: barre(0.2, sg * 3.4, -3.8, sg * 7.8, 0.55), mat: 'plasma', relief: 'plat' })
      f.push({ pts: barre(-2.6, sg * 3, -4.7, sg * 6.4, 0.45), mat: 'plasma', relief: 'plat' })
      f.push({ pts: ovale(-5.3, sg * 9.2, 0.8, 0.8, 8), mat: 'marque', relief: 'dome', dome: { x: -5.3, y: sg * 9.2, rx: 0.8, ry: 0.8 } })
    }
    return f
  }
  if (coque === 8) {
    // (le frimas : PAS D'AILES — deux CROISSANTS de carapace qui se referment devant lui)
    for (const sg of [-1, 1]) f.push(...formesDuCroissant(sg))
    return f
  }
  if (coque === 7) {
    // (l'ingénieur : PAS D'AILES — deux CAISSONS latéraux, plaques de graphite rayées d'acier, comme un engin de chantier)
    for (const sg of [-1, 1]) {
      f.push({ pts: [[4.4, sg * 4], [-6, sg * 4], [-6, sg * 7.4], [4.4, sg * 7.4]], mat: 'graphite', relief: 'plat', penche: sg })
      for (let k = 0; k < 4; k++) {
        const x = 3.6 - k * 2.6
        // (des bandes d'acier sur le graphite, plus le jaune : il se lisait comme la marque d'un joueur — Keko, 16/11)
        f.push({ pts: [[x, sg * 6.4], [x - 1.3, sg * 6.4], [x - 1.3, sg * 7.4], [x, sg * 7.4]], mat: 'acier', relief: 'plat' })
      }
      f.push({ pts: [[4.4, sg * 4], [3.4, sg * 4], [3.4, sg * 6.4], [4.4, sg * 6.4]], mat: 'acier', relief: 'plat' })
    }
    return f
  }
  if (coque === 6) {
    // (la soucoupe : PAS D'AILES — un ANNEAU tout autour d'elle, où sont fixées ses huit tuyères)
    f.push({ pts: ovale(0, 0, 9.6, 9.6, 32), mat: 'sarcelle', relief: 'plat' })
    f.push({ pts: ovale(0, 0, 8.3, 8.3, 32), mat: 'acier', relief: 'plat' })
    return f
  }
  if (coque === 5) {
    // (la salamandre : PAS D'AILES — deux GROS RÉSERVOIRS DE LAITON en nacelles, portés par de courts pylônes, le bout
    // rouge, une bague d'acier à l'arrière)
    for (const sg of [-1, 1]) {
      f.push({ pts: [[0.6, sg * 4.2], [-4.6, sg * 4.2], [-5.6, sg * 6.4], [-0.4, sg * 6.4]], mat: 'cuivre', relief: 'plat', penche: sg })
      f.push({ pts: ovale(-2, sg * 7.6, 5.4, 2.1, 22), mat: 'or', relief: 'dome', dome: { x: -2, y: sg * 7.6, rx: 5.4, ry: 2.1 } })
      f.push({ pts: [[-5.4, sg * 5.7], [-6.3, sg * 5.8], [-6.3, sg * 9.4], [-5.4, sg * 9.5]], mat: 'metal', relief: 'plat' })
      f.push({ pts: ovale(3.1, sg * 7.6, 1.2, 1.4, 12), mat: 'marque', relief: 'dome', dome: { x: 3.1, y: sg * 7.6, rx: 1.2, ry: 1.4 } })
    }
    return f
  }
  if (coque === 4) {
    // (les deux ponts latéraux du cuirassé, et sur chacun ses quatre socles de tourelle)
    for (const sg of [-1, 1]) {
      f.push({ pts: [[27, sg * 8.6], [22, sg * 15.2], [-26, sg * 17], [-31, sg * 17], [-31, sg * 10]], mat: 'aile', relief: 'plat', penche: sg })
      f.push({ pts: [[27, sg * 8.6], [22, sg * 15.2], [20.4, sg * 15.2], [25.2, sg * 8.8]], mat: 'acier', relief: 'plat', penche: sg })
      f.push({ pts: [[-28.4, sg * 15.2], [-31, sg * 15.2], [-31, sg * 17], [-28.8, sg * 17]], mat: 'rouge', relief: 'plat', penche: sg })
      for (const x of TOURELLES_DU_CUIRASSE.xs) f.push({ pts: ovale(x, sg * TOURELLES_DU_CUIRASSE.y, 3, 2.7, 14), mat: 'metal', relief: 'dome', dome: { x, y: sg * TOURELLES_DU_CUIRASSE.y, rx: 3, ry: 2.7 } })
    }
    return f
  }
  for (const s of [-1, 1]) {
    f.push({ pts: [[1.2, s * 2.4], [-4.8, s * 8.2], [-8, s * 8.7], [-8, s * 7], [-6.2, s * 2.6]], mat: 'aile', relief: 'plat', penche: s })
    // le bord d'attaque, une bande d'acier qui accroche la lumière
    f.push({ pts: [[1.2, s * 2.4], [-4.8, s * 8.2], [-5.6, s * 8.05], [0.2, s * 2.5]], mat: 'acier', relief: 'plat', penche: s })
    f.push({ pts: [[-6.6, s * 7.3], [-8, s * 7.5], [-8, s * 8.7], [-7.1, s * 8.5]], mat: 'marque', relief: 'plat', penche: s })
  }
  return f
}
/**
 * LE CHÂSSIS ENTIER d'un cran, pour son pictogramme : la coque ET les ailes (Keko, 10/11 : « le châssis doit inclure
 * tout ce qui ne fait pas partie des autres pièces — les emplacements d'armes sont sur les ailes, donc bien une partie
 * du châssis »). Sur le vaisseau, les deux restent séparées : les armes et la tuyère passent entre l'aile et la coque.
 */
export function formesDuChassis(cran: number): Forme[] {
  return [...formesDesAiles(cran), ...formesDeLaCoque(cran)]
}
/** LA TUYÈRE d'un cran de propulseur, et sa flamme (longue de 0 à 1). */
/**
 * `devie` : LA FLAMME N'EST PAS RIGIDE (Keko, 13/11) — sa pointe se déporte de côté (en unités du vaisseau), son ventre
 * à moitié moins : elle traîne derrière un vaisseau qui vire ou qui glisse, comme ses braises.
 */
export function formesDuPropulseur(cran: number, flamme: number, t: number, devie = 0): Forme[] {
  const tu = 1.8 + 0.5 * (cran - 1)
  const fond = -8.4 - 0.5 * (cran - 1)
  const f: Forme[] = []
  if (flamme > 0.02) {
    const L = (2.5 + 8 * flamme) * (1 + 0.25 * (cran - 1)) * (0.85 + 0.15 * Math.sin(t * 60))
    f.push({ pts: [[fond + 0.4, -tu * 0.8], [fond - L * 0.55, -tu * 0.55 + devie * 0.4], [fond - L, devie], [fond - L * 0.55, tu * 0.55 + devie * 0.4], [fond + 0.4, tu * 0.8]], mat: cran >= 3 ? 'ion' : 'feu', relief: 'emis', feu: { base: fond, pointe: fond - L } })
  }
  f.push({ pts: [[-6.6, -tu], [fond, -tu * 0.8], [fond, tu * 0.8], [-6.6, tu]], mat: 'metal', relief: 'cyl' })
  // la bague de la tuyère : un anneau d'acier, bleu au cœur pour l'ionique
  f.push({ pts: [[fond + 1.1, -tu * 0.86], [fond, -tu * 0.8], [fond, tu * 0.8], [fond + 1.1, tu * 0.86]], mat: cran >= 3 ? 'ion' : 'acier', relief: 'plat' })
  return f
}
/**
 * LE CANON DU FOREUR d'un cran : son pivot sur le toit (x, en unités du vaisseau), le rayon de son dôme, et la distance
 * du pivot à la BOUCHE. Le rayon du vol part de la bouche : il la lit ici, il ne la recopie pas.
 */
export function canonDeLaForeuse(cran: number): { pivot: number; dome: number; bouche: number } {
  const dome = 1.5 + 0.25 * (cran - 1)
  return { pivot: -2.2, dome, bouche: 3.2 + 0.8 * (cran - 1) + dome }
}
/** LE FOREUR sur le toit, d'un cran : un dôme et un canon, vers l'avant ou tourné de `vise` (en vol, il suit sa cible). */
export function formesDeLaForeuse(cran: number, vise = 0): Forme[] {
  // la tourelle derrière la verrière : un socle, un dôme d'acier (une bague rouge au cran 3), le canon
  const { pivot: x, dome, bouche } = canonDeLaForeuse(cran)
  const bx = x + Math.cos(vise) * bouche
  const by = Math.sin(vise) * bouche
  const f: Forme[] = [
    // (le relief en cylindre suppose un fût le long de l'axe : tourné, le fût est une plaque)
    { pts: barre(x, 0, bx, by, cran >= 2 ? 1.1 : 0.85), mat: 'acier', relief: vise === 0 ? 'cyl' : 'plat' },
    { pts: ovale(x, 0, dome + 0.5, dome + 0.5, 18), mat: 'metal', relief: 'dome', dome: { x, y: 0, rx: dome + 0.5, ry: dome + 0.5 } },
  ]
  if (cran >= 3) f.push({ pts: ovale(x, 0, dome + 0.15, dome + 0.15, 18), mat: 'rouge', relief: 'dome', dome: { x, y: 0, rx: dome + 0.15, ry: dome + 0.15 } })
  f.push({ pts: ovale(x, 0, dome - 0.2, dome - 0.2, 16), mat: 'acier', relief: 'dome', dome: { x, y: 0, rx: dome - 0.2, ry: dome - 0.2 } })
  f.push({ pts: ovale(bx, by, 0.6, 0.6, 8), mat: 'laser', relief: 'dome', dome: { x: bx, y: by, rx: 0.6, ry: 0.6 } })
  return f
}
/** L'AIMANT : un fer à cheval rouge à l'arrière du toit, les pôles d'acier. */
export function formesDeLAimant(cran: number): Forme[] {
  const r = 1.8 + 0.3 * (cran - 1)
  return [
    { pts: [[-5.8, -r - 0.5], [-4.6, -r - 0.5], [-4.6, r + 0.5], [-5.8, r + 0.5]], mat: 'rouge', relief: 'plat' },
    { pts: [[-4.6, -r - 0.5], [-2.6, -r - 0.5], [-2.6, -r + 0.6], [-4.6, -r + 0.6]], mat: 'rouge', relief: 'plat' },
    { pts: [[-4.6, r - 0.6], [-2.6, r - 0.6], [-2.6, r + 0.5], [-4.6, r + 0.5]], mat: 'rouge', relief: 'plat' },
    { pts: [[-2.6, -r - 0.5], [-1.8, -r - 0.5], [-1.8, -r + 0.6], [-2.6, -r + 0.6]], mat: 'acier', relief: 'plat' },
    { pts: [[-2.6, r - 0.6], [-1.8, r - 0.6], [-1.8, r + 0.5], [-2.6, r + 0.5]], mat: 'acier', relief: 'plat' },
  ]
}
/** LE RADAR : un mât et une antenne qui tourne. */
export function formesDuRadar(t: number): Forme[] {
  const a = t * 4
  return [
    { pts: barre(-4.5 - Math.cos(a) * 2.4, -Math.sin(a) * 2.4, -4.5 + Math.cos(a) * 2.4, Math.sin(a) * 2.4, 0.9), mat: 'acier', relief: 'plat' },
    { pts: ovale(-4.5, 0, 1, 1, 10), mat: 'metal', relief: 'dome', dome: { x: -4.5, y: 0, rx: 1, ry: 1 } },
  ]
}
/**
 * LA BOUCHE D'UNE ARME sous l'aile `s`, en unités du vaisseau : le bout de son fût, tel que `formesDeLArme` le dessine
 * juste dessous (le canon finit à x = 2, les deux fûts de la mitrailleuse à 0,6 — entre eux —, le missile sort du nez de
 * sa nacelle, à −0,6). Les obus du vol en partent.
 */
export function boucheDeLArme(id: string, s: number): { x: number; y: number } {
  if (id === 'flammes' || id === 'napalm') return { x: 11.8, y: 0 }
  // (l'orbe de plasma se forme entre les deux cornes du Pulsar ; l'essaim en part aussi)
  if (id === 'plasma' || id === 'essaim' || id === 'rail') return { x: 9.6, y: 0 }
  // (la Vouivre crache de sa gueule, entre ses mandibules)
  if (id === 'crachat') return { x: 9.8, y: 0 }
  if (id === 'rayon') return { x: 10.2, y: 0 }
  return id === 'canon' ? { x: 2, y: s * 6.2 } : id === 'rafale' ? { x: 0.6, y: s * 6.2 } : { x: -0.6, y: s * 6.3 }
}
/** La place d'arme `k` d'une coque (au-delà de ses places : la dernière), et la bouche d'une arme qui y est montée. */
export const placeDArme = (coque: number, k: number): { x: number; y: number; s: number } => {
  const places = gabaritDe(coque).armes
  return places[Math.max(0, Math.min(places.length - 1, k))]
}
export function boucheMontee(coque: number, id: string, k: number): { x: number; y: number } {
  const pl = placeDArme(coque, k)
  const b = boucheDeLArme(id, pl.s)
  return { x: b.x + pl.x, y: b.y + pl.y }
}
/** UNE ARME sous l'aile `s` (−1 la gauche, +1 la droite). */
export function formesDeLArme(id: string, s: number): Forme[] {
  // (les drones ne sont pas sur la coque : ils tournent autour, dessinés par la page ; les tourelles sont posées dans le monde)
  if (id === 'drone' || id === 'tourelle' || id === 'scie' || id === 'balise' || id === 'givre' || id === 'eclats' || id === 'tornade' || id === 'plasma' || id === 'essaim' || id === 'rail' || id === 'tentacule' || id === 'nuee' || id === 'rejeton' || id === 'crachat') return []
  // (le rayon thermique : une tige d'émetteur, un cristal au bout ; le napalm : un tube large, un mortier)
  if (id === 'rayon') {
    return [
      { pts: barre(4, 0, 9.6, 0, 1.1), mat: 'metal', relief: 'cyl' },
      { pts: barre(7.6, 0, 9, 0, 1.6), mat: 'acier', relief: 'cyl' },
      { pts: ovale(10.2, 0, 1.2, 1.2, 12), mat: 'ion', relief: 'dome', dome: { x: 10.2, y: 0, rx: 1.2, ry: 1.2 } },
    ]
  }
  if (id === 'napalm') {
    return [
      { pts: barre(4, 0, 10.4, 0, 1.9), mat: 'metal', relief: 'cyl' },
      { pts: barre(9.4, 0, 11.2, 0, 2.3), mat: 'acier', relief: 'cyl' },
      { pts: ovale(11.3, 0, 0.8, 1.4, 10), mat: 'feu', relief: 'dome', dome: { x: 11.3, y: 0, rx: 0.8, ry: 1.4 } },
    ]
  }
  if (id === 'flammes') {
    // LE LANCE-FLAMMES : une buse dans l'axe, qui dépasse du nez — le fût, la bague, la veilleuse au bout
    return [
      { pts: barre(4, 0, 10.6, 0, 1.3), mat: 'metal', relief: 'cyl' },
      { pts: barre(9.2, 0, 11.2, 0, 1.8), mat: 'acier', relief: 'cyl' },
      { pts: ovale(11.6, 0, 0.6, 0.6, 10), mat: 'feu', relief: 'dome', dome: { x: 11.6, y: 0, rx: 0.6, ry: 0.6 } },
    ]
  }
  if (id === 'canon') {
    return [
      { pts: barre(-5.2, s * 6.2, 1.6, s * 6.2, 1.1), mat: 'metal', relief: 'cyl' },
      { pts: barre(0.6, s * 6.2, 2, s * 6.2, 1.5), mat: 'acier', relief: 'cyl' },
    ]
  }
  if (id === 'rafale') {
    return [
      { pts: barre(-5, s * 5.4, 0.6, s * 5.4, 0.8), mat: 'metal', relief: 'cyl' },
      { pts: barre(-5, s * 7, 0.6, s * 7, 0.8), mat: 'metal', relief: 'cyl' },
      { pts: [[-5.6, s * 4.9], [-3.2, s * 4.9], [-3.2, s * 7.5], [-5.6, s * 7.5]], mat: 'acier', relief: 'plat' },
    ]
  }
  return [
    { pts: [[-6.6, s * 5.1], [-1.8, s * 5.1], [-0.6, s * 6.3], [-1.8, s * 7.5], [-6.6, s * 7.5]], mat: 'metal', relief: 'cyl' },
    { pts: [[-1.8, s * 5.5], [-0.8, s * 6.3], [-1.8, s * 7.1]], mat: 'rouge', relief: 'plat' },
  ]
}

/** TOUT LE VAISSEAU, dans l'ordre où les pièces se recouvrent (les ailes dessous, le foreur sur le toit, tourné de `vise`). */
export function formesDuVaisseau(a: Allure, flamme: number, t: number, vise = 0, devie = 0): Forme[] {
  const g = gabaritDe(a.coque)
  const f: Forme[] = [...formesDesAiles(a.coque, t)]
  const armes: Forme[] = []
  a.armes.forEach((id, i) => {
    if (id === '') return
    const pl = placeDArme(a.coque, i)
    armes.push(...decaler(formesDeLArme(id, pl.s), pl.x, pl.y))
  })
  // (sous les ailes pour un chasseur ; sur le pont, par-dessus tout, pour un cuirassé)
  if (!g.surLePont) f.push(...armes)
  // (autant de tuyères que le gabarit en porte : le même propulseur, en plusieurs exemplaires)
  // (le frimas n'a pas de tuyère de métal : son souffle froid sort de la pointe de sa queue)
  // (le pulsar non plus : il souffle du plasma, violet ; ni le kraken : un jet de bile)
  const organique = a.coque === 8 || a.coque === 9 || a.coque === 10 || a.coque === 11
  for (const tu of g.tuyeres) f.push(...decaler(formesDuPropulseur(a.propulseur, flamme, t, devie).filter((x) => !organique || x.relief === 'emis').map((x): Forme => (x.relief === 'emis' && a.coque === 9 ? { ...x, mat: 'plasma' } : x.relief === 'emis' && a.coque === 10 ? { ...x, mat: 'bile' } : x.relief === 'emis' && a.coque === 11 ? { ...x, mat: 'venin' } : x)), tu.x, tu.y))
  // (LE KRAKEN TRAÎNE QUATRE TENTACULES derrière lui, qui ondulent — sous la flamme et le manteau)
  if (a.coque === 10) for (const y0 of [-2.7, -0.9, 0.9, 2.7]) {
    let x = -6.6
    let y = y0
    for (let k = 0; k < 5; k++) {
      const an = Math.PI + y0 * 0.09 + Math.sin(t * 3.2 + y0 * 1.7 - k * 0.9) * 0.18 * (1 + k * 0.5) + devie * 0.04 * k
      const nx = x + Math.cos(an) * 1.5
      const ny = y + Math.sin(an) * 1.5
      f.unshift({ pts: barre(x, y, nx, ny, 1.25 * (1 - k / 6)), mat: k % 2 === 0 ? 'chair' : 'chitine', relief: 'plat' })
      x = nx
      y = ny
    }
  }
  // (une soucoupe : ses petites tuyères tout autour, sous l'anneau ; leurs jets sont dessinés par la page)
  if (g.omni !== undefined) for (let k = 0; k < g.omni.n; k++) f.unshift(...formesDeLaTuyereOmni(g.omni, k))
  // (la flamme doit passer SOUS la coque : on la met en tête)
  const feux = f.filter((x) => x.relief === 'emis')
  const reste = f.filter((x) => x.relief !== 'emis')
  const tout = [...feux, ...reste, ...formesDeLaCoque(a.coque, t)]
  if (g.surLePont) tout.push(...armes)
  if (g.outils !== undefined && a.outils !== undefined) {
    // CHAQUE OUTIL À SA PLACE : la foreuse qui creuse suit sa cible, les autres pointent vers l'avant
    a.outils.forEach((o, k) => {
      if (o === null) return
      const pl = g.outils![Math.max(0, Math.min(g.outils!.length - 1, k))]
      if (o.famille === 'foreuse') tout.push(...decaler(formesDeLaForeuse(o.cran, a.vises !== undefined ? (a.vises[k] ?? 0) : k === a.foreusePlace ? vise : 0), pl.x + 2.2, pl.y))
      else if (o.famille === 'aimant') tout.push(...decaler(formesDeLAimant(o.cran), pl.x + 3.8, pl.y))
      else tout.push(...decaler(formesDuRadar(t), pl.x + 4.5, pl.y))
    })
    return tout
  }
  if (a.aimant) tout.push(...formesDeLAimant(2))
  if (a.radar) tout.push(...formesDuRadar(t))
  if (a.foreuse > 0) tout.push(...formesDeLaForeuse(a.foreuse, vise))
  return tout
}

/** La boîte des formes, en unités du vaisseau : [xmin, ymin, xmax, ymax]. */
export function boiteDe(formes: Forme[]): [number, number, number, number] {
  let a = Infinity
  let b = Infinity
  let c = -Infinity
  let d = -Infinity
  for (const f of formes) for (const [x, y] of f.pts) {
    a = Math.min(a, x)
    b = Math.min(b, y)
    c = Math.max(c, x)
    d = Math.max(d, y)
  }
  return [a, b, c, d]
}

/** Peint des formes, nez en haut, MISES À L'ÉCHELLE pour tenir dans une case bw × bh centrée sur (x, y). */
export function peindreDansUneCase(p: Peintre, formes: Forme[], x: number, y: number, bw: number, bh: number, o: Options = {}): void {
  const [xa, ya, xb, yb] = boiteDe(o.cadre ?? formes)
  // nez en haut : la largeur à l'écran vient de y, la hauteur de x
  // (jusqu'à un quart de pixel l'unité : un cuirassé de 72 unités tient dans une case de vingt pixels)
  const s = Math.max(0.25, Math.min(4, (bw - 6) / Math.max(0.5, yb - ya), (bh - 6) / Math.max(0.5, xb - xa)))
  const cx = Math.round(x - ((ya + yb) / 2) * s)
  const cy = Math.round(y + ((xa + xb) / 2) * s)
  peindreFormes(p, formes, cx, cy, s, o)
}

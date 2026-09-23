/**
 * LA CARTE, PEINTE DANS UN CANVAS POUR SERVIR DE TEXTURE.
 *
 * C'est le choix de rendu central du moteur 3D, et il répond au risque
 * principal d'un jeu de cartes en trois dimensions : **le texte**. Une carte
 * de ce jeu porte un nom, un cartouche d'effet et un type gravé ; en 3D il n'y
 * a que deux façons de les afficher, et une seule tient ici.
 *
 * - *Du texte 3D* (géométrie ou police SDF) : net à toute échelle, mais il
 *   faut recomposer toute la mise en page dans la scène, et chaque ligne
 *   devient un objet de plus à animer avec la carte.
 * - *Du HTML superposé* : on garde le gabarit CSS, mais il flotte AU-DESSUS de
 *   la scène — il ne reçoit ni la lumière, ni l'inclinaison, ni les ombres.
 *   Autant rester en 2D.
 * - **Une texture peinte** : la carte est une image, donc elle s'incline, se
 *   plie à la lumière et porte son ombre comme un objet. Le texte y est net
 *   tant que la texture est plus grande que la carte à l'écran — d'où `LARGE`
 *   ci-dessous, qui couvre largement une carte de téléphone.
 *
 * Les proportions reprennent celles du gabarit « Serment de cendre »
 * (`ui/carte.css`) : la carte fait 100 de large pour 140 de haut, et tout s'y
 * mesure en centièmes de largeur. On les garde à l'identique pour que la
 * carte 3D soit la MÊME carte, et pas une deuxième version qui dérivera.
 */
import { art, urlImageDeKeko } from '../ui/art.ts'

/** Ce qu'il faut savoir d'une carte pour la peindre. */
export type CarteAPeindre = {
  nom: string
  cout: number
  /** Le cartouche, une entrée par ligne. */
  effet: readonly string[]
  /** Le type gravé au pied : « Attaque », « Trésor »… */
  type: string
}

/**
 * La largeur de la texture, en pixels.
 *
 * Une carte fait au plus ~350 px de large à l'écran (celle qu'on regarde de
 * près, sur un grand écran) : 768 garde de la marge pour la densité de pixels
 * et pour la perspective, sans peser inutilement.
 *
 * **LA MÉMOIRE COMPTE ICI PLUS QU'AILLEURS.** Une texture est stockée
 * décompressée sur le GPU : 1024 x 1434 en RGBA font près de 6 Mo, mipmaps en
 * plus, et il y en a une PAR CARTE de la main. Sur un téléphone, une carte qui
 * s'approche demande son niveau le plus détaillé, et c'est là que le budget
 * casse — d'où une carte qui noircit pendant qu'on la déplace et redevient
 * normale une fois reposée. À 768 le même jeu tient dans un peu plus de la
 * moitié.
 */
const LARGE = 768
const HAUT = Math.round(LARGE * 1.4)

/** Un centième de la largeur : l'unité du gabarit (le `cqw` du CSS). */
const U = LARGE / 100

/** La découpe de la coque, reprise telle quelle du gabarit. */
const DECOUPE: readonly [number, number][] = [
  [4, 0], [91, 1.5], [100, 8], [98, 92], [93, 98],
  [55, 99], [50, 100], [44, 99], [3, 97], [0, 88], [1, 5],
]

/** L'écusson du coût : pointe en bas, comme sur toute carte qui coûte. */
const ECUSSON: readonly [number, number][] = [
  [0, 0], [98, 5], [90, 68], [50, 100], [10, 76],
]

function chemin(ctx: CanvasRenderingContext2D, points: readonly [number, number][], x: number, y: number, l: number, h: number): void {
  ctx.beginPath()
  points.forEach(([px, py], i) => {
    const cx = x + (px / 100) * l
    const cy = y + (py / 100) * h
    if (i === 0) ctx.moveTo(cx, cy)
    else ctx.lineTo(cx, cy)
  })
  ctx.closePath()
}

/** Le laiton du cadre, en dégradé oblique comme dans le CSS. */
function laiton(ctx: CanvasRenderingContext2D): CanvasGradient {
  const g = ctx.createLinearGradient(0, 0, LARGE, HAUT)
  g.addColorStop(0, '#f2ddaa')
  g.addColorStop(0.21, '#a88c5f')
  g.addColorStop(0.23, '#d2b787')
  g.addColorStop(0.53, '#d2b787')
  g.addColorStop(0.8, '#695c45')
  g.addColorStop(1, '#e7cda0')
  return g
}

/**
 * Charge l'illustration : l'image de Keko si elle existe, le dessin SVG sinon.
 *
 * **Le repli est explicite ici**, là où la carte 2D le laisse au CSS (qui
 * ignore tout seul une couche de fond qui échoue). Un canvas, lui, ne dessine
 * rien du tout : sans ce repli, une image retirée laisserait un trou noir.
 */
async function illustration(nom: string): Promise<HTMLImageElement | null> {
  const dessin = art(nom)
  const keko = urlImageDeKeko(nom)
  for (const url of [keko, dessin]) {
    if (url === null) continue
    const image = await charger(url)
    if (image !== null) return image
  }
  return null
}

function charger(url: string): Promise<HTMLImageElement | null> {
  return new Promise((resoudre) => {
    const image = new Image()
    image.crossOrigin = 'anonymous'
    image.onload = () => resoudre(image)
    image.onerror = () => resoudre(null)
    image.src = url
  })
}

/**
 * Peint l'illustration en `cover` : elle remplit la boîte et déborde du côté
 * le plus long. Même cadrage que le `background-size: cover` de la carte 2D,
 * donc une image dessinée pour l'une va dans l'autre.
 */
function couvrir(ctx: CanvasRenderingContext2D, image: HTMLImageElement, x: number, y: number, l: number, h: number): void {
  const echelle = Math.max(l / image.width, h / image.height)
  const il = image.width * echelle
  const ih = image.height * echelle
  ctx.drawImage(image, x + (l - il) / 2, y + (h - ih) / 2, il, ih)
}

/**
 * Le texte d'effet a trois crans de taille, comme en 2D : un effet long
 * descend d'un cran plutôt que de déborder sur le type.
 */
function cran(lignes: readonly string[]): number {
  const n = lignes.join(' ').replace(/<[^>]+>/g, '').length
  if (n <= 44) return 6 * U
  if (n <= 100) return 5.8 * U
  return 5 * U
}

/** Retire le balisage des lignes d'effet : le canvas ne lit que du texte. */
function nu(ligne: string): string {
  return ligne.replace(/<[^>]+>/g, '')
}

/**
 * Peint la carte et rend le canvas.
 *
 * Asynchrone pour deux raisons, et les deux sont des pièges : l'illustration
 * doit être chargée AVANT d'être peinte, et **les polices aussi** — un canvas
 * qui dessine avant `document.fonts.ready` retombe silencieusement sur la
 * police par défaut, et la carte sort en sans-serif sans qu'aucune erreur ne
 * le dise.
 */
export async function peindreCarte(carte: CarteAPeindre): Promise<HTMLCanvasElement> {
  const canvas = document.createElement('canvas')
  canvas.width = LARGE
  canvas.height = HAUT
  const ctx = canvas.getContext('2d')
  if (ctx === null) return canvas

  const [image] = await Promise.all([illustration(carte.nom), document.fonts.ready])

  // LA PLAQUE : le laiton, assombri d'un voile uniforme. C'est ce voile seul
  // qui fait le relief -- une ombre sous la coque la « différenciait trop du
  // fond » (Keko).
  ctx.fillStyle = laiton(ctx)
  ctx.fillRect(0, 0, LARGE, HAUT)
  ctx.fillStyle = '#00000030'
  ctx.fillRect(0, 0, LARGE, HAUT)

  // LA COQUE DÉCHIRÉE, en laiton plein.
  ctx.save()
  chemin(ctx, DECOUPE, 0, 0, LARGE, HAUT)
  ctx.clip()
  ctx.fillStyle = laiton(ctx)
  ctx.fillRect(0, 0, LARGE, HAUT)
  ctx.restore()

  // LA SURFACE ET L'ILLUSTRATION EN PLEIN FORMAT, un cheveu à l'intérieur de
  // la coque, à la même découpe.
  const marge = 1.163 * U
  ctx.save()
  chemin(ctx, DECOUPE, marge, marge, LARGE - marge * 2, HAUT - marge * 2)
  ctx.clip()
  ctx.fillStyle = '#171b1d'
  ctx.fillRect(0, 0, LARGE, HAUT)
  if (image !== null) couvrir(ctx, image, marge, marge, LARGE - marge * 2, HAUT - marge * 2)

  // LE VOILE SOUS LE TEXTE : le tiers du bas passe sous le nom et le
  // cartouche, donc l'image doit s'y éteindre pour qu'ils se lisent.
  const voile = ctx.createLinearGradient(0, HAUT * 0.5, 0, HAUT)
  voile.addColorStop(0, '#00000000')
  voile.addColorStop(0.35, '#000000a8')
  voile.addColorStop(1, '#000000e0')
  ctx.fillStyle = voile
  ctx.fillRect(0, HAUT * 0.5, LARGE, HAUT * 0.5)
  ctx.restore()

  peindreEcusson(ctx, carte.cout)
  peindreTextes(ctx, carte)
  return canvas
}

function peindreEcusson(ctx: CanvasRenderingContext2D, cout: number): void {
  const x = 0.01 * LARGE
  const y = 0.004 * HAUT
  const l = 0.19 * LARGE
  const h = 0.165 * HAUT

  ctx.save()
  ctx.shadowColor = '#0000008c'
  ctx.shadowOffsetX = 0.35 * U
  ctx.shadowOffsetY = 0.5 * U
  chemin(ctx, ECUSSON, x, y, l, h)
  ctx.fillStyle = '#1a1316'
  ctx.fill()
  ctx.restore()

  // Le filet de laiton clair, puis la couleur de la nature.
  const filet = ctx.createLinearGradient(x, y, x + l, y + h)
  filet.addColorStop(0, '#f4dfb0')
  filet.addColorStop(0.7, '#c9a86e')
  filet.addColorStop(1, '#a88c5f')
  chemin(ctx, ECUSSON, x + 1.1 * U, y + 0.9 * U, l - 2.2 * U, h - 2.2 * U)
  ctx.fillStyle = filet
  ctx.fill()

  const couleur = ctx.createLinearGradient(x, y, x + l, y + h)
  couleur.addColorStop(0, '#df7650')
  couleur.addColorStop(0.62, '#a4312c')
  couleur.addColorStop(1, '#672729')
  chemin(ctx, ECUSSON, x + 2.5 * U, y + 2.2 * U, l - 5 * U, h - 5.2 * U)
  ctx.fillStyle = couleur
  ctx.fill()

  // LE CHIFFRE EST REMONTÉ : la pointe vers le bas met le centre visuel de
  // l'écusson plus haut que le centre de sa boîte.
  ctx.fillStyle = '#fff0cd'
  ctx.font = `600 ${18.5 * U}px "Grenze Gotisch", Georgia, serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.shadowColor = '#5b2727'
  ctx.shadowOffsetX = 0.581 * U
  ctx.shadowOffsetY = 0.872 * U
  ctx.fillText(String(cout), x + l / 2, y + h * 0.42)
  ctx.shadowColor = 'transparent'
}

function peindreTextes(ctx: CanvasRenderingContext2D, carte: CarteAPeindre): void {
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  // LE NOM, sur le haut de la bande de texte, souligné d'un fin trait.
  ctx.font = `700 ${8.4 * U}px "Grenze Gotisch", Georgia, serif`
  ctx.fillStyle = '#f7ead0'
  ctx.shadowColor = '#14181a'
  ctx.shadowOffsetY = 0.5 * U
  ctx.shadowBlur = 3 * U
  const yNom = HAUT * 0.67
  ctx.fillText(carte.nom, LARGE / 2, yNom)
  ctx.shadowColor = 'transparent'
  ctx.shadowOffsetY = 0
  ctx.shadowBlur = 0

  const trait = ctx.createLinearGradient(LARGE * 0.22, 0, LARGE * 0.78, 0)
  trait.addColorStop(0, '#f7ead000')
  trait.addColorStop(0.2, '#f7ead099')
  trait.addColorStop(0.8, '#f7ead099')
  trait.addColorStop(1, '#f7ead000')
  ctx.fillStyle = trait
  ctx.fillRect(LARGE * 0.22, yNom + 5.2 * U, LARGE * 0.56, Math.max(1, 0.25 * U))

  // LE CARTOUCHE : ce que fait la carte, centré, une ligne par entrée.
  const taille = cran(carte.effet)
  ctx.font = `400 ${taille}px "Crimson Pro", Georgia, serif`
  ctx.fillStyle = '#f1e6cf'
  ctx.shadowColor = '#000000aa'
  ctx.shadowOffsetY = 0.4 * U
  ctx.shadowBlur = 0.8 * U
  carte.effet.forEach((ligne, i) => {
    ctx.fillText(nu(ligne), LARGE / 2, HAUT * 0.755 + i * taille * 1.25)
  })
  ctx.shadowColor = 'transparent'

  // LE PIED : sa nature gravée, en petites capitales espacées.
  ctx.font = `600 ${3.6 * U}px "Barlow Condensed", "Arial Narrow", sans-serif`
  ctx.fillStyle = '#c9b892'
  ctx.letterSpacing = `${1.2 * U}px`
  ctx.fillText(carte.type.toUpperCase(), LARGE / 2, HAUT * 0.955)
  ctx.letterSpacing = '0px'
}

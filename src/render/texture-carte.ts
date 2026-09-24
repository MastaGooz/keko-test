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
import * as THREE from 'three'
import { art, urlDuFond, urlImageDeKeko } from '../ui/art.ts'

/** Ce qu'il faut savoir d'une carte pour la peindre. */
export type CarteAPeindre = {
  /**
   * L'identifiant de l'EXEMPLAIRE, et il n'est pas décoratif : c'est la clé
   * React de la carte dans la main. Bâtie sur l'index, elle changeait au
   * moindre réordonnancement — React démontait alors la carte et en remontait
   * une autre, ce qui la faisait **clignoter en noir** le temps de repeindre.
   * Le modèle du jeu porte déjà cet identifiant (`Carte.id`).
   */
  id: string
  nom: string
  cout: number
  /**
   * LE COMPTE DE CARTES d'une pièce d'équipement, s'il s'agit d'une pièce.
   *
   * Elle porte alors ce chiffre là où une carte porte sa gemme de coût, dans
   * une petite case **en forme de carte** : une carte pour dire « des cartes ».
   * C'est son POIDS, et c'est la seule information qui rende « équiper plus
   * dilue » lisible sur la pièce elle-même. Tranché par Keko en 2D, repris
   * tel quel ici.
   */
  compteur?: number
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

/**
 * LE FOND COMMUN, chargé UNE FOIS pour toutes les cartes.
 *
 * La promesse est mémorisée, pas l'image : `peindreCarte` est appelée par
 * modèle, et sans ça le premier écran lancerait autant de chargements qu'il y
 * a de cartes différentes — pour un fichier qui pèse un mégaoctet et demi.
 * *Une ressource partagée se charge une fois, même si dix appelants la
 * demandent en même temps.*
 */
let fondCommun: Promise<HTMLImageElement | null> | null = null

function fond(): Promise<HTMLImageElement | null> {
  fondCommun ??= charger(urlDuFond())
  return fondCommun
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

/**
 * Coupe les lignes du cartouche pour qu'aucune ne dépasse `max`.
 *
 * Le canvas n'a pas de mise en page : il faut mesurer mot à mot. Un mot seul
 * plus large que la carte reste sur sa ligne — mieux vaut un mot qui déborde
 * qu'un mot coupé en deux.
 */
function replier(
  ctx: CanvasRenderingContext2D,
  entrees: readonly string[],
  max: number,
): string[] {
  const sorties: string[] = []
  for (const entree of entrees) {
    let courante = ''
    for (const mot of nu(entree).split(' ')) {
      const essai = courante === '' ? mot : `${courante} ${mot}`
      if (courante !== '' && ctx.measureText(essai).width > max) {
        sorties.push(courante)
        courante = mot
      } else courante = essai
    }
    sorties.push(courante)
  }
  return sorties
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

  const [image, decor] = await Promise.all([
    illustration(carte.nom),
    fond(),
    document.fonts.ready,
  ])

  // LES COINS SONT RONDS, et c'est la texture qui les porte : tout ce qui
  // suit est peint dans un rectangle arrondi, et le canvas reste transparent
  // en dehors. Rayon : 3 % de la largeur, comme le `border-radius` du gabarit
  // 2D. Le matériau coupe ces coins (`alphaTest`) et laisse voir le laiton
  // arrondi du corps de la carte.
  ctx.beginPath()
  ctx.roundRect(0, 0, LARGE, HAUT, LARGE * 0.03)
  ctx.clip()

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
  // LE FOND COMMUN D'ABORD, LE SUJET PAR-DESSUS. Demandé par Keko : une seule
  // image de décor pour toutes les cartes, et le modèle ne porte plus que ce
  // qu'il montre. Le repli reste celui d'avant — sans fond, la surface sombre
  // suffit et rien ne casse.
  if (decor !== null) couvrir(ctx, decor, marge, marge, LARGE - marge * 2, HAUT - marge * 2)
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

  if (carte.compteur === undefined) peindreCout(ctx, carte.cout)
  else peindreCompteur(ctx, carte.compteur)
  peindreTextes(ctx, carte)
  return canvas
}

/**
 * LE COMPTEUR D'UNE PIÈCE : une case en forme de carte, de fer sombre.
 *
 * Volontairement PAS l'écusson d'énergie, qui est le même sur toute carte qui
 * coûte : *ce chiffre n'est pas un coût*, c'est ce que la pièce ajoute au
 * deck. Deux symboles pour deux choses.
 */
function peindreCompteur(ctx: CanvasRenderingContext2D, nombre: number): void {
  const l = 0.155 * LARGE
  const h = l * 1.4
  const x = 0.022 * LARGE
  const y = 0.016 * HAUT
  const coin = 1.6 * U

  ctx.save()
  ctx.shadowColor = '#0000008c'
  ctx.shadowOffsetX = 0.35 * U
  ctx.shadowOffsetY = 0.5 * U
  ctx.beginPath()
  ctx.roundRect(x, y, l, h, coin)
  const fer = ctx.createLinearGradient(x, y, x + l, y + h)
  fer.addColorStop(0, '#3b4148')
  fer.addColorStop(1, '#1b1f24')
  ctx.fillStyle = fer
  ctx.fill()
  ctx.restore()

  ctx.beginPath()
  ctx.roundRect(x + 0.9 * U, y + 0.9 * U, l - 1.8 * U, h - 1.8 * U, coin * 0.8)
  ctx.strokeStyle = '#8d9aa6'
  ctx.lineWidth = 0.7 * U
  ctx.stroke()

  ctx.fillStyle = '#e8eef4'
  ctx.font = `600 ${15 * U}px "Grenze Gotisch", Georgia, serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(String(nombre), x + l / 2, y + h * 0.54)
}

/**
 * LE STYLE DU SYMBOLE DE COÛT, le temps d'en choisir un.
 *
 * Keko sur l'écusson actuel : « on dirait un bouclier, ça ne renvoie pas trop
 * à l'énergie, et la couleur rouge est un peu bizarre ». Les deux gênes ont la
 * même racine : c'est un BLASON — pointe en bas, comme un écu — et il est
 * ROUGE, alors que l'énergie du joueur est un orbe d'OR dans l'interface.
 * *Deux objets qui doivent être le même n'ont jamais eu ni la même forme ni la
 * même couleur.*
 *
 * Les candidats se jugent sur `?ecusson`, à la taille réelle. Cette variable
 * n'existe que pour ça : une fois le choix fait, il ne reste qu'un dessin.
 */
export type StyleCout = 'blason' | 'losange' | 'hexagone' | 'orbe' | 'eclat'
let styleCout: StyleCout = 'blason'

export function choisirStyleCout(style: StyleCout): void {
  styleCout = style
}

/** Le socle sombre, le filet de laiton, puis le coeur : commun à tous. */
function serti(
  ctx: CanvasRenderingContext2D,
  forme: (marge: number) => void,
  coeur: [string, string, string],
  x: number,
  y: number,
  l: number,
  h: number,
): void {
  ctx.save()
  ctx.shadowColor = '#0000008c'
  ctx.shadowOffsetX = 0.35 * U
  ctx.shadowOffsetY = 0.5 * U
  forme(0)
  ctx.fillStyle = '#12100c'
  ctx.fill()
  ctx.restore()

  const filet = ctx.createLinearGradient(x, y, x + l, y + h)
  filet.addColorStop(0, '#f4dfb0')
  filet.addColorStop(0.7, '#c9a86e')
  filet.addColorStop(1, '#a88c5f')
  forme(1.1 * U)
  ctx.fillStyle = filet
  ctx.fill()

  const dedans = ctx.createLinearGradient(x, y, x + l, y + h)
  dedans.addColorStop(0, coeur[0])
  dedans.addColorStop(0.62, coeur[1])
  dedans.addColorStop(1, coeur[2])
  forme(2.6 * U)
  ctx.fillStyle = dedans
  ctx.fill()
}

/** L'AMBRE : la couleur de l'énergie dans ce jeu, celle de l'orbe du joueur. */
const AMBRE: [string, string, string] = ['#8a6a2c', '#4a3713', '#241a08']

/**
 * Le chiffre, en ivoire, centré sur la forme.
 *
 * **Il est plus petit que sur le blason**, et ce n'est pas un réglage d'humeur :
 * l'écu est plus HAUT que large (0,165 de la carte contre 0,19), alors que ces
 * formes-ci sont inscrites dans un carré. Le même corps de police y remplissait
 * toute la figure et recouvrait le coeur d'ambre — *on ne voyait plus que le
 * chiffre, donc plus aucune des cinq pistes ne se distinguait.*
 */
function chiffre(ctx: CanvasRenderingContext2D, cout: number, cx: number, cy: number): void {
  ctx.fillStyle = '#fff0cd'
  ctx.font = `600 ${13.5 * U}px "Grenze Gotisch", Georgia, serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.shadowColor = '#2a1c06'
  ctx.shadowOffsetX = 0.581 * U
  ctx.shadowOffsetY = 0.872 * U
  ctx.fillText(String(cout), cx, cy)
  ctx.shadowColor = 'transparent'
}

function polygone(
  ctx: CanvasRenderingContext2D,
  cotes: number,
  depart: number,
  cx: number,
  cy: number,
  r: number,
): void {
  ctx.beginPath()
  for (let i = 0; i < cotes; i += 1) {
    const a = depart + (i * 2 * Math.PI) / cotes
    const px = cx + Math.cos(a) * r
    const py = cy + Math.sin(a) * r
    if (i === 0) ctx.moveTo(px, py)
    else ctx.lineTo(px, py)
  }
  ctx.closePath()
}

function peindreCout(ctx: CanvasRenderingContext2D, cout: number): void {
  if (styleCout === 'blason') return peindreEcusson(ctx, cout)

  // Un peu plus large que l'écu : inscrite dans un carré, une forme perd de la
  // surface utile par rapport à un écu qui s'étire en hauteur.
  const l = 0.205 * LARGE
  const cx = 0.012 * LARGE + l / 2
  const cy = 0.006 * HAUT + l / 2
  const r = l / 2
  const x = cx - r
  const y = cy - r

  if (styleCout === 'losange') {
    // LE LOSANGE, POINTE EN HAUT : l'inverse exact de l'écu. Une pointe qui
    // monte se lit comme un éclat, une pointe qui descend comme un bouclier.
    serti(ctx, (m) => polygone(ctx, 4, -Math.PI / 2, cx, cy, r - m), AMBRE, x, y, l, l)
  } else if (styleCout === 'hexagone') {
    // L'HEXAGONE : une pièce mécanique, aucune parenté héraldique.
    serti(ctx, (m) => polygone(ctx, 6, -Math.PI / 2, cx, cy, r - m), AMBRE, x, y, l, l)
  } else if (styleCout === 'orbe') {
    // L'ORBE : exactement l'objet que porte déjà le joueur, en petit. C'est la
    // règle de Keko prise au mot — « que le symbole soit toujours le même ».
    serti(
      ctx,
      (m) => {
        ctx.beginPath()
        ctx.arc(cx, cy, r - m, 0, Math.PI * 2)
      },
      AMBRE,
      x,
      y,
      l,
      l,
    )
    const lueur = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.35, 0, cx, cy, r)
    lueur.addColorStop(0, '#ffd98a66')
    lueur.addColorStop(1, '#ffd98a00')
    ctx.beginPath()
    ctx.arc(cx, cy, r - 2.6 * U, 0, Math.PI * 2)
    ctx.fillStyle = lueur
    ctx.fill()
  } else {
    // L'ÉCLAT : un scintillement à QUATRE branches derrière un disque. Il en a
    // eu six, et six branches égales font une étoile de David — *une forme
    // géométrique n'est jamais seulement une forme*, elle traîne ce qu'on lit
    // d'elle ailleurs. Quatre branches fines ne disent que la lumière.
    ctx.save()
    ctx.shadowColor = '#0000008c'
    ctx.shadowOffsetY = 0.5 * U
    ctx.beginPath()
    for (let i = 0; i < 8; i += 1) {
      const a = -Math.PI / 2 + (i * Math.PI) / 4
      const rr = i % 2 === 0 ? r : r * 0.3
      const px = cx + Math.cos(a) * rr
      const py = cy + Math.sin(a) * rr
      if (i === 0) ctx.moveTo(px, py)
      else ctx.lineTo(px, py)
    }
    ctx.closePath()
    const or = ctx.createLinearGradient(x, y, x + l, y + l)
    or.addColorStop(0, '#f4dfb0')
    or.addColorStop(1, '#a88c5f')
    ctx.fillStyle = or
    ctx.fill()
    ctx.restore()
    ctx.beginPath()
    ctx.arc(cx, cy, r * 0.56, 0, Math.PI * 2)
    ctx.fillStyle = '#241a08'
    ctx.fill()
    ctx.beginPath()
    ctx.arc(cx, cy, r * 0.56, 0, Math.PI * 2)
    ctx.strokeStyle = '#c9a86e'
    ctx.lineWidth = 1.1 * U
    ctx.stroke()
  }

  chiffre(ctx, cout, cx, cy)
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
  //
  // **IL SE REPLIE.** En 2D c'est le navigateur qui coupe les lignes ; un
  // canvas, lui, écrit tout droit et laisse déborder *sans rien signaler* —
  // la composition de l'Espadon sortait des deux côtés de la carte. Le repli
  // se fait à la taille choisie, et s'il coûte une ligne de trop on descend
  // d'un cran : c'est exactement ce que `cran` fait pour un effet long.
  let taille = cran(carte.effet)
  ctx.font = `400 ${taille}px "Crimson Pro", Georgia, serif`
  let lignes = replier(ctx, carte.effet, LARGE * 0.86)
  if (lignes.length > carte.effet.length + 1) {
    taille *= 0.82
    ctx.font = `400 ${taille}px "Crimson Pro", Georgia, serif`
    lignes = replier(ctx, carte.effet, LARGE * 0.86)
  }
  ctx.fillStyle = '#f1e6cf'
  ctx.shadowColor = '#000000aa'
  ctx.shadowOffsetY = 0.4 * U
  ctx.shadowBlur = 0.8 * U
  lignes.forEach((ligne, i) => {
    ctx.fillText(ligne, LARGE / 2, HAUT * 0.755 + i * taille * 1.25)
  })
  ctx.shadowColor = 'transparent'

  // LE PIED : sa nature gravée, en petites capitales espacées.
  ctx.font = `600 ${3.6 * U}px "Barlow Condensed", "Arial Narrow", sans-serif`
  ctx.fillStyle = '#c9b892'
  ctx.letterSpacing = `${1.2 * U}px`
  ctx.fillText(carte.type.toUpperCase(), LARGE / 2, HAUT * 0.955)
  ctx.letterSpacing = '0px'
}

/**
 * LES TEXTURES SONT PARTAGÉES ENTRE LES CARTES IDENTIQUES.
 *
 * Deux Gardes dans la main, c'est le même dessin : une seule texture suffit.
 * Ça compte pour deux raisons, et la seconde est la plus importante :
 *
 * - **la mémoire.** Une texture vit décompressée sur le GPU, plusieurs mégas
 *   pièce ; un deck en contient volontiers quatre exemplaires de la même
 *   carte ;
 * - **la stabilité.** Une carte qu'on remonte retrouve sa texture déjà prête,
 *   donc elle ne repasse jamais par son état sombre.
 *
 * Elles ne sont jamais libérées, et c'est voulu : le nombre de MODÈLES est
 * borné (quelques dizaines), alors que le nombre d'exemplaires manipulés dans
 * une partie ne l'est pas.
 */
const TEXTURES = new Map<string, Promise<THREE.CanvasTexture>>()

/** Ce qui distingue deux dessins de carte. L'exemplaire n'y entre pas. */
export function signature(carte: CarteAPeindre): string {
  return `${carte.nom}|${carte.cout}|${carte.compteur ?? ''}|${carte.type}|${carte.effet.join('~')}`
}

export function textureDeCarte(carte: CarteAPeindre): Promise<THREE.CanvasTexture> {
  const cle = signature(carte)
  const connue = TEXTURES.get(cle)
  if (connue !== undefined) return connue

  const promesse = peindreCarte(carte).then((canvas) => {
    const texture = new THREE.CanvasTexture(canvas)
    // La carte se regarde de près et en biais : sans filtrage anisotrope le
    // texte se brouille dès qu'elle s'incline.
    texture.anisotropy = 8
    texture.colorSpace = THREE.SRGBColorSpace
    return texture
  })
  TEXTURES.set(cle, promesse)
  return promesse
}

/**
 * UN EMPLACEMENT VIDE A LA FORME DE LA CARTE QU'IL ATTEND, et il la GARDE.
 *
 * C'est la règle du jeu 2D, et elle a un prix qu'on paie volontiers : un
 * emplacement qui change de taille selon ce qu'il contient, ou selon la
 * présence de son voisin, est un emplacement qu'on rate au doigt. Il dit
 * aussi ce qu'il attend — sans son nom, c'est un pointillé muet.
 */
const SLOTS = new Map<string, THREE.CanvasTexture>()

export function textureSlot(nom: string, accent: string): THREE.CanvasTexture {
  const cle = `${nom}|${accent}`
  const connue = SLOTS.get(cle)
  if (connue !== undefined) return connue

  const l = 512
  const h = Math.round(l * 1.4)
  const canvas = document.createElement('canvas')
  canvas.width = l
  canvas.height = h
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  SLOTS.set(cle, texture)

  const ctx = canvas.getContext('2d')
  if (ctx === null) return texture

  const marge = l * 0.03
  ctx.strokeStyle = accent
  ctx.lineWidth = l * 0.016
  ctx.setLineDash([l * 0.07, l * 0.05])
  ctx.beginPath()
  ctx.roundRect(marge, marge, l - marge * 2, h - marge * 2, l * 0.05)
  ctx.stroke()

  ctx.setLineDash([])
  ctx.fillStyle = accent
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = `600 ${Math.round(l * 0.11)}px Cinzel, Georgia, serif`
  ctx.fillText(nom.toUpperCase(), l / 2, h / 2)
  texture.needsUpdate = true
  return texture
}

/**
 * LA PASTILLE D'OR : combien d'exemplaires d'un modèle une pièce apporte.
 *
 * Elle vit **SOUS** la carte du set, jamais sur son coin — là, elle cachait la
 * gemme de coût et se lisait comme un badge de plus. Tranché par Keko :
 * « sous la carte, pas par-dessus ».
 */
const PASTILLES = new Map<number, THREE.CanvasTexture>()

export function texturePastille(nombre: number): THREE.CanvasTexture {
  const connue = PASTILLES.get(nombre)
  if (connue !== undefined) return connue

  const l = 256
  const h = 128
  const canvas = document.createElement('canvas')
  canvas.width = l
  canvas.height = h
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  PASTILLES.set(nombre, texture)

  const ctx = canvas.getContext('2d')
  if (ctx === null) return texture

  const r = h * 0.42
  ctx.beginPath()
  ctx.roundRect(l / 2 - r * 1.5, h / 2 - r, r * 3, r * 2, r)
  const or = ctx.createLinearGradient(0, h / 2 - r, 0, h / 2 + r)
  or.addColorStop(0, '#f6dFa4')
  or.addColorStop(1, '#b8913f')
  ctx.fillStyle = or
  ctx.fill()
  ctx.strokeStyle = '#6a5121'
  ctx.lineWidth = h * 0.035
  ctx.stroke()

  ctx.fillStyle = '#2a1f07'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = `700 ${Math.round(h * 0.5)}px Cinzel, Georgia, serif`
  ctx.fillText(`×${nombre}`, l / 2, h * 0.54)
  texture.needsUpdate = true
  return texture
}

/**
 * LA TEXTURE DU CONTOUR LUMINEUX.
 *
 * Elle reproduit le `box-shadow` du jeu 2D, qui est ce que Keko veut voir :
 * `0 0 0 2px blanc` puis `0 0 1.5rem blanc translucide` — **un liseré net ET
 * un flou continu qui émet**.
 *
 * En 3D, un plan de couleur unie ne peut pas faire ça : il donne un rectangle
 * dur. Trois rectangles emboîtés non plus — on lisait les paliers (Keko :
 * « j'aime pas trop le dégradé en 3 couches »). *Le flou doit être dans la
 * matière, pas dans le nombre de plans*, donc dans une texture.
 *
 * Elle est peinte au canvas avec `shadowBlur`, qui est exactement le même
 * moteur de flou que le `box-shadow` du CSS : le rendu est le même, à ceci
 * près qu'il devient une image qu'on peut plaquer.
 *
 * Une seule pour toutes les cartes : elle ne dépend d'aucune d'elles.
 */
let contour: THREE.CanvasTexture | null = null

/**
 * Le débord du flou, en fraction de la largeur de la carte.
 *
 * **La texture et le plan le partagent**, et c'est indispensable : ils doivent
 * décrire la même chose pour que le liseré tombe exactement sur le bord.
 *
 * **SERRÉ, ET C'EST UNE CORRECTION.** À 26 %, la lumière débordait bien trop
 * loin — Keko : « ça éclaire beaucoup trop autour de la carte […] il faudrait
 * un glow assez proche de la carte ». Un halo qui s'étale n'éclaire pas la
 * carte, il éclaire l'écran.
 */
export const DEBORD_CONTOUR = 0.13

export function textureContour(): THREE.CanvasTexture {
  if (contour !== null) return contour

  // LA CARTE OCCUPE LE CENTRE, ET LE DÉBORD DOIT ÊTRE EXACTEMENT CELUI DU
  // PLAN qui portera la texture — sinon la partie utile passe derrière la
  // carte et on ne voit plus rien. C'est arrivé : à débord plus large dans la
  // texture que dans la géométrie, le liseré et le cœur du flou étaient
  // masqués, il ne restait que la frange la plus pâle.
  const l = 512
  const debord = Math.round(l * DEBORD_CONTOUR)
  const h = Math.round(l * 1.4)
  const canvas = document.createElement('canvas')
  canvas.width = l + debord * 2
  canvas.height = h + debord * 2
  const ctx = canvas.getContext('2d')
  if (ctx === null) {
    contour = new THREE.CanvasTexture(canvas)
    return contour
  }

  ctx.fillStyle = '#ffffff'
  // LE FLOU D'ABORD, en plusieurs passes SERRÉES : une seule donne un halo
  // trop sage, et c'est l'accumulation qui fait la lumière -- exactement comme
  // deux `box-shadow` empilés dans le CSS. Les rayons restent COURTS : étalé
  // sur tout le débord, le halo devient une brume qui n'éclaire rien ; c'est
  // près du bord qu'une lumière se lit.
  ctx.shadowColor = 'rgba(255, 255, 255, 0.95)'
  // Le contour suit les coins ronds de la carte : un halo carré autour d'une
  // carte arrondie se lirait comme un cadre posé dessus.
  const coin = l * 0.03
  const rect = (x: number, y: number, lg: number, ht: number): void => {
    ctx.beginPath()
    ctx.roundRect(x, y, lg, ht, coin)
    ctx.fill()
  }
  // LA LUMIÈRE DOIT ÊTRE ÉTEINTE AVANT LE BORD DU PLAN, sinon on voit le
  // rectangle qui la délimite — Keko : « on voit le rectangle qui délimite la
  // lumière ». C'est ce qui règle les rayons : assez courts pour que l'alpha
  // soit retombé à zéro bien avant le débord, pas seulement faible.
  //
  // Les rayons sont donnés en `shadowBlur`, dont la portée utile vaut à peu
  // près la MOITIÉ. Se vérifie sur le profil d'alpha de la texture, en lisant
  // une ligne de pixels du bord vers le centre : il doit commencer par des
  // zéros francs.
  for (const rayon of [debord * 0.85, debord * 0.45, debord * 0.2]) {
    ctx.shadowBlur = rayon
    rect(debord, debord, l, h)
  }

  // PUIS LE LISERÉ NET, sans ombre : c'est lui qui donne l'arête franche que
  // le flou seul n'a pas. Il déborde d'environ 2 % de la carte, comme les 2 px
  // du jeu 2D -- mesuré dans les pixels de CETTE texture, pas de l'écran.
  ctx.shadowColor = 'transparent'
  ctx.shadowBlur = 0
  const arete = Math.round(l * 0.022)
  rect(debord - arete, debord - arete, l + arete * 2, h + arete * 2)

  contour = new THREE.CanvasTexture(canvas)
  contour.colorSpace = THREE.SRGBColorSpace
  return contour
}

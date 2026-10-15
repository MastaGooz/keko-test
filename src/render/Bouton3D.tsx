/**
 * UN BOUTON DANS LA SCÈNE, ET NON EN HTML PAR-DESSUS.
 *
 * **C'est une contrainte d'empilement, pas une préférence.** Un bouton HTML
 * doit être au-dessus du canvas pour recevoir le clic — un canvas capte le
 * pointeur partout, même là où il ne dessine rien — donc la carte qu'on
 * promène passait forcément DERRIÈRE lui. Keko : « le bouton prendre/terminer
 * est au-dessus de la carte quand je la drague alors qu'il devrait être en
 * dessous ». Et le descendre sous le canvas le rendait à la fois inerte et
 * noirci par le voile de l'écran.
 *
 * *Aucun ordre de calques ne pouvait satisfaire les deux* : tant que le bouton
 * et la carte vivent dans des mondes différents, leur ordre est décidé
 * ailleurs que par leur profondeur. Dans la scène, il l'est — la carte tenue
 * est devant, le bouton derrière, et le clic suit le même rayon que tout le
 * reste.
 *
 * Le dessin reprend celui des boutons CSS : une plaque arrondie, un liseré,
 * un mot. Peint une fois par libellé et par ton, comme les emplacements.
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { hauteurVisibleA } from './Cadrage.tsx'
import { FAMILLE_RONDE, policeRonde } from './texture-carte.ts'
import { jouerClicDoux } from './sons.ts'

/**
 * LA HAUTEUR D'UN BOUTON SE COMPTE EN PIXELS, pas en unités de scène.
 *
 * Un bouton mesuré dans le monde suit le cadrage : il ferait 27 px de haut sur
 * un téléphone et 69 sur un moniteur, alors que c'est le doigt qui le touche,
 * et **le doigt ne change pas de taille avec l'écran**. Le projet demande
 * 48 px au minimum ; la conversion se fait donc à l'envers, depuis la fenêtre.
 *
 * **MAIS PAS UN NOMBRE FIXE NON PLUS.** À 52 px partout, il touchait le cadre
 * voisin sur un téléphone et se perdait sur un écran de PC — Keko : « sur
 * téléphone le bouton descendre touche le bloc de l'équipement, il faudrait le
 * réduire un poil, mais sur PC il est tout petit il faudrait le grossir ».
 *
 * *Le doigt ne change pas de taille, mais la PAGE si* : un bouton doit rester
 * atteignable au doigt **et** proportionné à ce qui l'entoure. D'où une part
 * de la hauteur d'écran, bornée en bas par le plancher tactile du projet et en
 * haut pour qu'il ne devienne pas une enseigne.
 */
/**
 * TROIS CRANS, PARCE QU'UN BOUTON SE JUGE PAR RAPPORT À SES VOISINS.
 *
 * - `ecran` : ce qui engage la page entière (« Prendre », « Terminer ») ;
 * - `rail` : les deux départs, au bas de la colonne du hub ;
 * - `mineur` : ce qu'on consulte ou ce qui décide d'une carte (« Jeter », « Reprendre »).
 */
export type CranBouton = 'ecran' | 'rail' | 'mineur'

/** Part de hauteur d'écran, plancher, plafond — un rang par cran. */
const CRANS: Record<CranBouton, { part: number; min: number; max: number }> = {
  ecran: { part: 0.09, min: 48, max: 76 },
  rail: { part: 0.09, min: 32, max: 76 },
  mineur: { part: 0.076, min: 42, max: 62 },
}

function hauteurBoutonPx(hauteurFenetrePx: number, cran: CranBouton): number {
  /**
   * **SUR TÉLÉPHONE, SEULE LA BORNE BASSE COMMANDE** — 9 % de 390 px font 35,
   * donc le bouton vaut son plancher et rien d'autre. Les plafonds, eux, ne
   * mordent que sur grand écran : *changer un plancher ne touche que le
   * téléphone, changer un plafond ne touche que le PC.*
   *
   * **ET LE RAIL A LE SIEN, PLUS BAS QUE LE PLANCHER TACTILE.** Keko : « je
   * voudrais réduire la taille des boutons descendre et équipement gratuit
   * (police et bouton) sur téléphone, car ils sont trop gros et les onglets du
   * hub au-dessus sont compressés, c'est moche ».
   *
   * *Un bouton se juge par rapport à ses voisins* : au milieu de l'écran du
   * butin, 48 px se lisent comme une action ; dans une colonne où huit
   * destinations se partagent ce qui reste, les mêmes 48 px se lisent comme
   * une enseigne. **Deux boutons qui prennent deux fois le plancher tactile
   * dans une bande de 390 px en prennent le quart**, et c'est ce quart qui
   * manquait au rail.
   *
   * La police suit sans réglage à part : la plaque est peinte à hauteur de
   * toile fixe, donc son corps est une fraction de la hauteur rendue. *Réduire
   * le bouton réduit son texte dans le même rapport* — les deux ne peuvent pas
   * diverger.
   */
  const { part, min, max } = CRANS[cran]
  return Math.max(min, Math.min(max, hauteurFenetrePx * part))
}

/** La hauteur d'un bouton en unités de scène, à cette profondeur. */
function hauteurMonde(px: number, z: number, hauteurFenetrePx: number): number {
  return (px * hauteurVisibleA(z, hauteurFenetrePx)) / hauteurFenetrePx
}

/** Les tons disponibles : le fond, le liseré, l'encre. */
/**
 * LE RAYON DES COINS — ZÉRO : la plaque est un rectangle franc.
 *
 * Demandé par Keko : « on peut mettre le bouton descendre et place en angle
 * droit aussi ? » *Un arrondi est une forme de gabarit, une arête franche est
 * de la ferronnerie* — la règle qui a ramené la barre de vie de la capsule au
 * biseau, puis les infobulles à zéro, puis le bouton de rangement.
 *
 * Il vit en un seul endroit parce que TROIS dessins le lisent : la plaque, le
 * masque du balayage et le halo du survol. *Trois rayons écrits chacun de leur
 * côté se désaccorderaient au premier réglage*, et le halo déborderait d'une
 * forme qui ne serait plus la sienne.
 */
const RAYON = 0

const TONS = {
  or: { fond: ['#3a2f16', '#221b0e'], trait: '#c9a95a', encre: '#f2e4bd' },
  perdre: { fond: ['#4a1712', '#2a0f0c'], trait: '#b3382a', encre: '#ffc9c0' },
  garder: { fond: ['#153322', '#0d1f15'], trait: '#3f8f5a', encre: '#c4e8d2' },
  /**
   * LA PIERRE : le ton d'un bouton de CONFORT, pas d'une décision.
   *
   * « Équipement gratuit » part avec un chargement de fortune ; il ne doit pas
   * rivaliser avec « Descendre », qui est le départ ordinaire. *Deux boutons
   * d'or l'un sous l'autre se disputent le regard* — celui-ci prend donc la
   * matière du lieu, sans son accent.
   */
  pierre: { fond: ['#2b2a2c', '#171718'], trait: '#7d786a', encre: '#ddd5c2' },
  /**
   * LE STICKER : le ton de la collection d'emoji, et il change la FORME avec la
   * couleur. Keko : « le bouton "ouvrir un autre paquet" n'est pas du tout
   * dans la DA du jeu ». *La plaque de laiton en Cinzel est la ferronnerie de
   * l'archive* — et le mode emoji a retiré la ferronnerie de tout le reste, un
   * objet après l'autre : le contour, la plaque, le dos, le sachet. Le bouton
   * était le dernier à la parler.
   *
   * Il prend donc la langue du sachet : **une pastille** (le rayon de la
   * pastille « 5 CARTES »), **l'encre du titre** — du jaune pâle à l'orange,
   * le haut plus clair parce que la lumière vient du haut — **et le cerne des
   * stickers**, trait sombre, filet crème, ombre vers le bas. Baloo 2 en 800,
   * casse ordinaire : *une pastille est le vocabulaire d'une app*, et une app
   * n'écrit pas ses boutons en capitales espacées.
   */
  // PUIS SANS NOIR. Keko : « l'outline noir assombrit le bouton et le texte
  // noir ne colle pas à l'ambiance colorée fun du jeu ». *Le noir est le cerne
  // d'un sticker posé sur un film bleu sombre* ; sur un bouton qui doit
  // appeler, il éteint. Le trait devient un orange brûlé (celui du bas du
  // dégradé, plus profond), le texte est BLANC cerné de cet orange — la
  // grammaire des boutons de jeu mobile, et l'encre qui rit.
  emoji: { fond: ['#fff0a8', '#ffc42a', '#ff8a1f'], trait: '#e2560c', encre: '#ffffff' },
} as const

export type TonBouton = keyof typeof TONS

/** Un ton qui se dessine en pastille de sticker plutôt qu'en plaque. */
const enSticker = (ton: TonBouton): boolean => ton === 'emoji'
/** Le rayon des coins, en part de la hauteur : nul pour la ferronnerie, une demi-hauteur pour la pastille. */
const rayonDe = (ton: TonBouton): number => (enSticker(ton) ? 0.5 : RAYON)

const TEXTURES = new Map<string, { texture: THREE.CanvasTexture; rapport: number }>()

/**
 * La plaque peinte. **Le rapport largeur/hauteur sort de la mesure du texte**,
 * pas d'une constante : « Jeter » et « Nouvelle descente » ne peuvent pas
 * tenir dans la même boîte, et une plaque étirée déformerait ses coins.
 */
function plaque(
  texte: string,
  ton: TonBouton,
  rapportMin = 0,
): { texture: THREE.CanvasTexture; rapport: number } {
  const cle = `${texte}|${ton}|${rapportMin}`
  const connue = TEXTURES.get(cle)
  if (connue !== undefined) return connue

  /**
   * **UN LIBELLÉ PEUT TENIR SUR DEUX LIGNES**, et il le faut : « Équipement
   * gratuit » sur une seule aurait un rapport de 5,5 contre 2,97 pour
   * « Descendre », donc il aurait doublé la largeur du rail — *un bouton dans
   * une colonne ne peut pas être plus large que sa colonne*, et l'y forcer
   * aurait mangé la moitié de l'écran sur un téléphone.
   *
   * **LA TOILE GARDE SA HAUTEUR, quel que soit le nombre de lignes**, et c'est
   * ce qui donne à deux boutons voisins la MÊME taille de police : la plaque
   * est rendue à une hauteur fixe à l'écran, donc une toile plus haute serait
   * réduite d'autant, et son texte avec. *Deux lignes se serrent dans la
   * hauteur, elles ne la repoussent pas.*
   */
  const sticker = enSticker(ton)
  const lignes = texte.split('\n').map((l) => (sticker ? l : l.toUpperCase()))
  const h = 128
  /**
   * **LA LANGUE DES BOUTONS EST CELLE DU JEU : Cinzel, capitales, espacées.**
   *
   * Ils étaient peints en `system-ui` — *le seul sans-serif système de tout
   * l'écran*, en gras et plus gros que le reste. Keko : « la police du bouton
   * deck est trop grosse par rapport aux autres polices de l'interface, on peut
   * pas mettre la même police que celle des catégories du coffre ? là ça dénote
   * totalement ». **Ce n'était pas une question de taille, c'était une question
   * de FAMILLE** : un bouton qui parle une autre langue que la page dénote quel
   * que soit son corps.
   *
   * Même recette que les onglets du coffre : capitales, `0,08em` d'approche, et
   * un corps du même ORDRE — 12,5 px sur un bouton de 48, 10,9 sur le petit,
   * pour 8,8 px d'onglet et 13,6 px d'entrée de rail. *Il reste au-dessus de
   * l'onglet parce qu'il agit* ; il n'a plus à crier pour le dire.
   */
  const APPROCHE = sticker ? '0.01em' : '0.08em'
  const REMPLISSAGE = sticker ? 0.9 : 0.62
  const police = (corps: number): string =>
    sticker ? `800 ${corps}px ${FAMILLE_RONDE}` : `600 ${corps}px Cinzel, Georgia, serif`
  const mesure = document.createElement('canvas').getContext('2d')
  const largeurTexte = (corps: number): number => {
    if (mesure === null) return h * 2
    mesure.font = police(corps)
    mesure.letterSpacing = APPROCHE
    return Math.max(...lignes.map((l) => mesure.measureText(l).width))
  }

  /**
   * **LA MASSE D'UN BOUTON EST DANS SA LARGEUR, pas dans sa hauteur.** La
   * hauteur est bloquée au plancher tactile — 48 px, ce que le doigt demande —
   * donc c'est le seul endroit où il restait du gras : le remplissage valait
   * plus que la hauteur de la plaque (1,1 h), soit 37 % de la plaque pour du
   * vide. *Un bouton reste tapable en étant moins large* ; il ne reste pas
   * lisible en étant moins haut.
   */
  const corpsVise = Math.round(h * (sticker ? 0.3 : 0.26))
  let large = Math.round(largeurTexte(corpsVise) + h * REMPLISSAGE)
  // **UN RAPPORT PLANCHER**, pour que deux boutons d'un même groupe aient la
  // même largeur : *deux actions de même rang ne peuvent pas avoir deux
  // tailles.* La plaque s'élargit, son texte reste centré.
  large = Math.max(large, Math.round(rapportMin * h))

  const toile = document.createElement('canvas')
  toile.width = large
  toile.height = h
  const ctx = toile.getContext('2d')
  const texture = new THREE.CanvasTexture(toile)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 4
  const fait = { texture, rapport: large / h }
  TEXTURES.set(cle, fait)
  if (ctx === null) return fait

  const { fond, trait, encre } = TONS[ton]
  const marge = h * 0.06
  const rayon = h * rayonDe(ton)

  const peindre = (): void => {
    ctx.clearRect(0, 0, large, h)
    const degrade = ctx.createLinearGradient(0, 0, 0, h)
    fond.forEach((c, i) => degrade.addColorStop(i / (fond.length - 1), c))

    if (sticker) {
      // LE STICKER : le trait sombre porte l'ombre, le filet crème se pose
      // dessus, l'encre remplit — l'ordre du titre du sachet, et ses
      // épaisseurs en part de la hauteur. Chaque couche est la pastille
      // rentrée d'autant : *un cerne est une dilatation*, et sur une pastille
      // la dilatation d'un arrondi est un arrondi.
      const pastille = (retrait: number): void => {
        ctx.beginPath()
        ctx.roundRect(marge + retrait, marge + retrait, large - (marge + retrait) * 2, h - (marge + retrait) * 2, rayon)
      }
      // Le filet CRÈME dehors, l'encre dedans, et l'ombre portée sous la
      // pastille dans le ton brûlé — *une ombre colorée garde la couleur là
      // où une ombre noire la salit.*
      ctx.save()
      ctx.shadowColor = '#b8400a99'
      ctx.shadowBlur = h * 0.05
      ctx.shadowOffsetY = h * 0.05
      pastille(0)
      ctx.fillStyle = '#fffaf0'
      ctx.fill()
      ctx.restore()
      pastille(h * 0.05)
      ctx.fillStyle = degrade
      ctx.fill()
    } else {
      ctx.beginPath()
      ctx.roundRect(marge, marge, large - marge * 2, h - marge * 2, rayon)
      ctx.fillStyle = degrade
      ctx.fill()
      ctx.strokeStyle = trait
      ctx.lineWidth = Math.max(1, h * 0.018)
      ctx.stroke()
    }

    /**
     * **LE TEXTE ENTRE DANS LA PLAQUE, ce n'est plus la plaque qui suit le
     * texte** — parce qu'elle a déjà été mesurée et que sa largeur est partie
     * dans le plan. Un canvas qui peint avant `document.fonts.ready` retombe
     * SILENCIEUSEMENT sur Georgia, plus étroite : la deuxième passe en Cinzel
     * déborderait. *Une valeur déjà consommée ailleurs ne peut plus changer,
     * donc c'est le corps qui cède* — la règle du cartouche des cartes.
     */
    const place = large - h * REMPLISSAGE
    const corps = Math.max(1, Math.min(corpsVise, Math.floor((corpsVise * place) / largeurTexte(corpsVise))))
    const interligne = Math.round(corps * 1.34)
    ctx.font = police(corps)
    ctx.letterSpacing = APPROCHE
    ctx.fillStyle = encre
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    // LE BLOC SE CENTRE, pas chaque ligne : deux lignes posées l'une sous
    // l'autre depuis le milieu pencheraient vers le bas. Et l'approche décale
    // le dernier caractère, donc on recentre d'une demi-approche.
    const haut = h * (sticker ? 0.52 : 0.53) - ((lignes.length - 1) * interligne) / 2
    const centre = large / 2 - (sticker ? 0 : corps * 0.04)
    if (sticker) {
      // LE MOT BLANC, CERNÉ D'ORANGE BRÛLÉ : le cerne se trace avant, sinon il
      // mord sur les lettres, et une petite ombre du même ton le pose.
      ctx.lineJoin = 'round'
      ctx.strokeStyle = trait
      ctx.lineWidth = corps * 0.22
      ctx.save()
      ctx.shadowColor = '#b8400a'
      ctx.shadowOffsetY = corps * 0.08
      lignes.forEach((ligne, i) => ctx.strokeText(ligne, centre, haut + i * interligne))
      ctx.restore()
    }
    lignes.forEach((ligne, i) => ctx.fillText(ligne, centre, haut + i * interligne))
    texture.needsUpdate = true
  }

  peindre()
  // ET ON REPEINT QUAND LA POLICE ARRIVE : la règle est écrite pour les cartes
  // et pour les slots, elle vaut pour tout ce qui peint.
  if (document.fonts.status !== 'loaded') void document.fonts.ready.then(peindre)
  // ET LA RONDE SE DEMANDE EXPLICITEMENT : une police que seul un canvas
  // emploie n'est jamais téléchargée par le DOM — le piège de Noto Color
  // Emoji, payé sur la plaque claire.
  if (sticker) void policeRonde().then(peindre)
  return fait
}

/**
 * LE SURVOL S'ÉCRIT EN DEUX TEXTURES, et aucune ne redessine le bouton.
 *
 * Le MASQUE dit où est la plaque — blanc dedans, noir dehors. Il sert
 * d'`alphaMap` au balayage, ce qui permet de faire GLISSER la bande sans que
 * ses bords sortent des coins arrondis : *ce qui bouge est la lumière, ce qui
 * tient est la forme.* (three lit le canal VERT d'une `alphaMap`, d'où un
 * masque franchement noir et blanc, jamais une couche transparente.)
 *
 * La LUEUR est le halo posé derrière, peint au `shadowBlur` du canvas — le
 * même moteur de flou que le `box-shadow` du CSS, comme le contour des cartes.
 */
const MASQUES = new Map<string, THREE.CanvasTexture>()

function masqueBouton(rapport: number, rayonPart: number): THREE.CanvasTexture {
  const cle = `${rapport.toFixed(3)}|${rayonPart}`
  const connu = MASQUES.get(cle)
  if (connu !== undefined) return connu

  const h = 128
  const large = Math.round(h * rapport)
  const toile = document.createElement('canvas')
  toile.width = large
  toile.height = h
  const texture = new THREE.CanvasTexture(toile)
  MASQUES.set(cle, texture)
  const ctx = toile.getContext('2d')
  if (ctx === null) return texture

  ctx.fillStyle = '#000000'
  ctx.fillRect(0, 0, large, h)
  const marge = h * 0.06
  ctx.beginPath()
  ctx.roundRect(marge, marge, large - marge * 2, h - marge * 2, h * rayonPart)
  ctx.fillStyle = '#ffffff'
  ctx.fill()
  texture.needsUpdate = true
  return texture
}

/**
 * LA BANDE QUI BALAIE : un lustre oblique, transparent à ses deux bouts.
 *
 * C'est l'effet que Keko avait retenu sur la barre de vie — « l'effet de
 * brillance qui se déplace est super » — et c'est lui qui fait lire du MÉTAL
 * là où un éclaircissement uniforme ne donne qu'une couleur plus claire.
 */
let bandeBalayage: THREE.CanvasTexture | null = null

function balayage(): THREE.CanvasTexture {
  if (bandeBalayage !== null) return bandeBalayage

  const large = 256
  const h = 128
  const toile = document.createElement('canvas')
  toile.width = large
  toile.height = h
  const texture = new THREE.CanvasTexture(toile)
  // LA BANDE NE SE RÉPÈTE PAS : décalée, elle doit SORTIR du bouton, pas y
  // rentrer par l'autre bord. Un bord transparent prolongé fait exactement ça.
  texture.wrapS = THREE.ClampToEdgeWrapping
  texture.wrapT = THREE.ClampToEdgeWrapping
  bandeBalayage = texture
  const ctx = toile.getContext('2d')
  if (ctx === null) return texture

  // Oblique, comme le lustre des cartes et de la jauge : une brillance
  // verticale se lirait comme une barre, pas comme un reflet qui glisse.
  ctx.translate(large / 2, h / 2)
  ctx.rotate(-0.42)
  const g = ctx.createLinearGradient(-large * 0.22, 0, large * 0.22, 0)
  g.addColorStop(0, 'rgba(255, 246, 222, 0)')
  g.addColorStop(0.5, 'rgba(255, 246, 222, 0.85)')
  g.addColorStop(1, 'rgba(255, 246, 222, 0)')
  ctx.fillStyle = g
  ctx.fillRect(-large * 0.22, -h, large * 0.44, h * 2)
  texture.needsUpdate = true
  return texture
}

const LUEURS = new Map<string, THREE.CanvasTexture>()

function lueurBouton(rapport: number, rayonPart: number): THREE.CanvasTexture {
  const cle = `${rapport.toFixed(3)}|${rayonPart}`
  const connue = LUEURS.get(cle)
  if (connue !== undefined) return connue

  const h = 128
  const debord = Math.round(h * DEBORD_LUEUR)
  const large = Math.round(h * rapport)
  const toile = document.createElement('canvas')
  toile.width = large + debord * 2
  toile.height = h + debord * 2
  const texture = new THREE.CanvasTexture(toile)
  texture.colorSpace = THREE.SRGBColorSpace
  LUEURS.set(cle, texture)
  const ctx = toile.getContext('2d')
  if (ctx === null) return texture

  ctx.fillStyle = '#ffffff'
  ctx.shadowColor = 'rgba(255, 255, 255, 0.95)'
  // Des rayons COURTS : la lumière doit être éteinte avant le bord du plan,
  // sinon on voit le rectangle qui la délimite. Même règle que le contour des
  // cartes, et elle se vérifie sur le profil d'alpha.
  for (const rayon of [debord * 0.8, debord * 0.4]) {
    ctx.shadowBlur = rayon
    ctx.beginPath()
    ctx.roundRect(debord, debord, large, h, h * rayonPart)
    ctx.fill()
  }
  texture.needsUpdate = true
  return texture
}

/** Ce que la lueur déborde du bouton, en fraction de sa hauteur. */
const DEBORD_LUEUR = 0.28

type Props = {
  texte: string
  ton: TonBouton
  position: [number, number, number]
  /** Ce que ce bouton engage — voir `CranBouton`. */
  cran?: CranBouton
  /**
   * Éteint : il ne répond plus et **on voit à travers**. C'est ce qui permet à
   * la carte qu'on promène de rester lisible même quand elle le croise.
   */
  eteint?: boolean
  /**
   * Un rapport largeur/hauteur PLANCHER, partagé par les boutons d'un même
   * groupe : *deux actions de même rang se lisent à la même taille.*
   */
  rapportMin?: number
  onCliquer?: () => void
}

export function Bouton3D({
  texte,
  ton,
  position,
  cran = 'ecran',
  eteint = false,
  rapportMin = 0,
  onCliquer,
}: Props): React.JSX.Element {
  const { size } = useThree()
  const { texture, rapport } = useMemo(
    () => plaque(texte, ton, rapportMin),
    [texte, ton, rapportMin],
  )
  const materiau = useMemo(
    () => new THREE.MeshBasicMaterial({ map: texture, transparent: true, toneMapped: false, depthWrite: false }),
    [texture],
  )

  /**
   * LE SURVOL RÉCHAUFFE LE BOUTON. Demandé par Keko : « quand on hover le
   * bouton descendre, ce serait sympa de lui donner une petite animation
   * lumineuse, voire plus ».
   *
   * Trois choses qui se cumulent, et chacune fait un travail que les autres ne
   * font pas : la plaque s'ÉCLAIRCIT (elle chauffe), un halo la DÉBORDE (elle
   * rayonne), un lustre la TRAVERSE (c'est du métal). Plus un rien d'échelle —
   * *un bouton qui s'avance se propose.*
   *
   * **Un bouton ÉTEINT ne s'allume pas** : il ne fait rien, et c'est sa bulle
   * qui dit pourquoi. Et le survol est réservé à la SOURIS — au doigt le
   * `pointerout` n'arrive jamais, le bouton resterait allumé après la tape.
   */
  const [survole, setSurvole] = useState(false)
  const vivant = survole && !eteint
  const groupe = useRef<THREE.Group>(null)
  const halo = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        map: lueurBouton(rapport, rayonDe(ton)),
        color: '#ffd89a',
        transparent: true,
        opacity: 0,
        toneMapped: false,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [rapport, ton],
  )
  const lustre = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        map: balayage().clone(),
        alphaMap: masqueBouton(rapport, rayonDe(ton)),
        transparent: true,
        opacity: 0,
        toneMapped: false,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [rapport, ton],
  )

  // ON REND LE CURSEUR EN PARTANT, toujours : un composant qui disparaît
  // pendant qu'on le survole laisserait la main posée sur la page.
  useEffect(() => {
    return () => {
      document.body.style.cursor = ''
    }
  }, [])
  useEffect(() => {
    document.body.style.cursor = vivant ? 'pointer' : ''
  }, [vivant])

  /**
   * LE CLIC A DU JUICE — pour le bouton sticker. Keko : « on peut rajouter du
   * juice au clic du bouton ? une animation par ex ». Trois temps, et tout le
   * poids vient du contraste de vitesse, la règle du bond des créatures :
   *
   * 1. **il s'ÉCRASE** sous le doigt (plus large, plus bas) en 70 ms ;
   * 2. **il REBONDIT** en élastique, plus grand que nature puis de retour ;
   * 3. **il FLAMBE** : la plaque blanchit et le halo s'allume d'un coup, puis
   *    s'éteint pendant le rebond.
   *
   * *L'action attend la fin de l'écrasement* (`DELAI_ACTION`) : un bouton qui
   * disparaît à l'instant où on le touche n'a jamais été pressé. Un pop part
   * avec. Les tons de l'archive ne bougent pas.
   */
  const juice = enSticker(ton)
  // L'HORLOGE DE LA SCÈNE, lue au clic : c'est elle qui anime la suite.
  const horloge = useRef(0)
  useFrame((etat) => {
    horloge.current = etat.clock.elapsedTime
  })
  const presse = useRef(-1)
  const parti = useRef(false)
  const DELAI_ACTION = 0.26

  const feu = useRef(0)
  useFrame((etat, delta) => {
    feu.current += ((vivant ? 1 : 0) - feu.current) * (1 - Math.exp(-11 * delta))
    const v = feu.current
    materiau.opacity = eteint ? 0.35 : 1
    // La couleur MULTIPLIE la texture : au-delà de 1 elle éclaircit la plaque
    // au lieu de la recouvrir. *L'image reste lisible pendant qu'elle chauffe.*
    materiau.color.setScalar(1 + v * 0.3)
    halo.opacity = v * 0.5
    lustre.opacity = v * 0.55
    // LE LUSTRE TRAVERSE, IL NE CLIGNOTE PAS : il repart d'un bord à intervalle
    // régulier, et le masque l'empêche de déborder des coins arrondis.
    const carte = lustre.map
    if (carte !== null) carte.offset.x = 0.5 - ((etat.clock.elapsedTime * 0.55) % 1.6)
    const g = groupe.current
    if (g === null) return
    let sx = 1 + v * 0.035
    let sy = sx
    if (presse.current >= 0) {
      const t = etat.clock.elapsedTime - presse.current
      if (t < 0.07) {
        // L'ÉCRASEMENT : vite, et un peu plus large que haut.
        const k = t / 0.07
        sx *= 1 + 0.1 * k
        sy *= 1 - 0.16 * k
      } else {
        // LE REBOND ÉLASTIQUE, puis le repos.
        const s = t - 0.07
        const e = Math.exp(-6 * s) * Math.cos(2 * Math.PI * 3.2 * s)
        sx *= 1 + 0.1 * e
        sy *= 1 - 0.16 * e
        const gonfle = 0.14 * Math.exp(-7 * s) * Math.sin(Math.PI * Math.min(1, s / 0.25))
        sx *= 1 + gonfle
        sy *= 1 + gonfle
      }
      const flamme = Math.exp(-5 * t)
      materiau.color.setScalar(1 + v * 0.3 + flamme * 0.45)
      // PLUS DE HALO AU CLIC — Keko : « tu peux enlever le halo de lumière
      // dans l'animation du bouton ? » La plaque blanchit encore, rien ne déborde.
      if (!parti.current && t >= DELAI_ACTION) {
        parti.current = true
        onCliquer?.()
      }
      if (t > 1.2) presse.current = -1
    }
    g.scale.set(sx, sy, 1)
  })

  const haut = hauteurMonde(hauteurBoutonPx(size.height, cran), position[2], size.height)
  return (
    <group ref={groupe} position={position}>
      {/* LE HALO, DERRIÈRE : seul son débord se voit, la plaque masque le
          reste. Il ne capte pas le pointeur, sinon il élargirait la zone
          sensible du bouton de tout son débord. */}
      <mesh position={[0, 0, -0.002]} material={halo} raycast={() => null}>
        <planeGeometry args={[haut * (rapport + DEBORD_LUEUR * 2), haut * (1 + DEBORD_LUEUR * 2)]} />
      </mesh>

      <mesh
        material={materiau}
        onPointerDown={(e) => {
          e.stopPropagation()
          if (eteint) return
          if (!juice) {
            onCliquer?.()
            return
          }
          if (presse.current >= 0 && !parti.current) return
          presse.current = horloge.current
          parti.current = false
          // UN CLIC SYNTHÉTISÉ, doux et juicy : voir `jouerClicDoux`. Le pop
          // puis `card flip` ont été essayés avant — Keko : « pas terrible ».
          jouerClicDoux()
        }}
        onPointerOver={(e) => {
          if (e.pointerType === 'mouse') setSurvole(true)
        }}
        onPointerOut={() => setSurvole(false)}
      >
        <planeGeometry args={[haut * rapport, haut]} />
      </mesh>

      {/* LE LUSTRE, DEVANT la plaque et masqué par sa forme. */}
      <mesh position={[0, 0, 0.002]} material={lustre} raycast={() => null}>
        <planeGeometry args={[haut * rapport, haut]} />
      </mesh>
    </group>
  )
}

/**
 * LA HAUTEUR D'UN BOUTON EN UNITÉS DE SCÈNE, sans passer par sa plaque.
 *
 * Un bouton peut être du HTML — celui du deck l'est, pour porter le SVG du
 * paquet — mais *il se tape comme les autres, donc il obéit au même plancher
 * tactile.* La règle vit ici, une seule fois.
 */
export function hauteurBoutonMonde(
  cran: CranBouton,
  z: number,
  hauteurFenetrePx: number,
): number {
  return hauteurMonde(hauteurBoutonPx(hauteurFenetrePx, cran), z, hauteurFenetrePx)
}

/**
 * Ce que ce bouton occupera dans la scène, pour poser deux voisins sans les
 * coller et pour le décaler sous une carte.
 */
export function tailleBouton(
  texte: string,
  ton: TonBouton,
  cran: CranBouton,
  z: number,
  hauteurFenetrePx: number,
  rapportMin = 0,
): { largeur: number; hauteur: number } {
  const hauteur = hauteurMonde(hauteurBoutonPx(hauteurFenetrePx, cran), z, hauteurFenetrePx)
  return { hauteur, largeur: hauteur * plaque(texte, ton, rapportMin).rapport }
}

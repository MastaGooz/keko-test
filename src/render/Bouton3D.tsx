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
function hauteurBoutonPx(hauteurFenetrePx: number, petit: boolean): number {
  /**
   * **SUR TÉLÉPHONE, SEULE LA BORNE BASSE COMMANDE** — 9 % de 390 px font 35,
   * donc le bouton vaut son plancher et rien d'autre. Il était à 54, au-dessus
   * du plancher tactile que le projet s'est fixé (48) : *un bouton qui dépasse
   * le minimum qu'il devait tenir n'est plus un minimum, c'est un choix*, et
   * Keko l'a repris — « sur téléphone je trouve les boutons deck, descendre et
   * équipement gratuit trop gros par rapport à l'échelle des autres éléments ».
   *
   * Il tombe donc AU plancher, pas en dessous : **48 px est une limite, pas un
   * réglage** — c'est ce que le doigt demande, et il ne rétrécit pas avec
   * l'écran. Le petit garde son cran d'écart (42), comme le bouton de rangement
   * du coffre qui vit déjà sous le plancher : *il se tape moins souvent et il
   * n'engage rien.*
   *
   * Les plafonds ne bougent pas : sur un grand écran c'est la part de hauteur
   * qui commande, et elle avait été réglée là.
   */
  const part = hauteurFenetrePx * (petit ? 0.076 : 0.09)
  return petit
    ? Math.max(42, Math.min(62, part))
    : Math.max(48, Math.min(76, part))
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
} as const

export type TonBouton = keyof typeof TONS

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
  const lignes = texte.split('\n').map((l) => l.toUpperCase())
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
  const APPROCHE = '0.08em'
  const REMPLISSAGE = 0.62
  const police = (corps: number): string => `600 ${corps}px Cinzel, Georgia, serif`
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
  const corpsVise = Math.round(h * 0.26)
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
  const rayon = h * RAYON

  const peindre = (): void => {
    ctx.clearRect(0, 0, large, h)
    const degrade = ctx.createLinearGradient(0, 0, 0, h)
    degrade.addColorStop(0, fond[0])
    degrade.addColorStop(1, fond[1])

    ctx.beginPath()
    ctx.roundRect(marge, marge, large - marge * 2, h - marge * 2, rayon)
    ctx.fillStyle = degrade
    ctx.fill()
    ctx.strokeStyle = trait
    ctx.lineWidth = Math.max(1, h * 0.018)
    ctx.stroke()

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
    const haut = h * 0.53 - ((lignes.length - 1) * interligne) / 2
    const centre = large / 2 - corps * 0.04
    lignes.forEach((ligne, i) => ctx.fillText(ligne, centre, haut + i * interligne))
    texture.needsUpdate = true
  }

  peindre()
  // ET ON REPEINT QUAND LA POLICE ARRIVE : la règle est écrite pour les cartes
  // et pour les slots, elle vaut pour tout ce qui peint.
  if (document.fonts.status !== 'loaded') void document.fonts.ready.then(peindre)
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

function masqueBouton(rapport: number): THREE.CanvasTexture {
  const cle = rapport.toFixed(3)
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
  ctx.roundRect(marge, marge, large - marge * 2, h - marge * 2, h * RAYON)
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

function lueurBouton(rapport: number): THREE.CanvasTexture {
  const cle = rapport.toFixed(3)
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
    ctx.roundRect(debord, debord, large, h, h * RAYON)
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
  /** Un cran plus petit : les issues d'une carte, pas celles de l'écran. */
  petit?: boolean
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
  petit = false,
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
        map: lueurBouton(rapport),
        color: '#ffd89a',
        transparent: true,
        opacity: 0,
        toneMapped: false,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [rapport],
  )
  const lustre = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        map: balayage().clone(),
        alphaMap: masqueBouton(rapport),
        transparent: true,
        opacity: 0,
        toneMapped: false,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [rapport],
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
    if (groupe.current !== null) groupe.current.scale.setScalar(1 + v * 0.035)
  })

  const haut = hauteurMonde(hauteurBoutonPx(size.height, petit), position[2], size.height)
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
          if (!eteint) onCliquer?.()
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
  petit: boolean,
  z: number,
  hauteurFenetrePx: number,
): number {
  return hauteurMonde(hauteurBoutonPx(hauteurFenetrePx, petit), z, hauteurFenetrePx)
}

/**
 * Ce que ce bouton occupera dans la scène, pour poser deux voisins sans les
 * coller et pour le décaler sous une carte.
 */
export function tailleBouton(
  texte: string,
  ton: TonBouton,
  petit: boolean,
  z: number,
  hauteurFenetrePx: number,
  rapportMin = 0,
): { largeur: number; hauteur: number } {
  const hauteur = hauteurMonde(hauteurBoutonPx(hauteurFenetrePx, petit), z, hauteurFenetrePx)
  return { hauteur, largeur: hauteur * plaque(texte, ton, rapportMin).rapport }
}

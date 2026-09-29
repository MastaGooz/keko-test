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
  const part = hauteurFenetrePx * (petit ? 0.076 : 0.09)
  return petit
    ? Math.max(46, Math.min(62, part))
    : Math.max(54, Math.min(76, part))
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
   * « Fourbir » remplit le chargement d'un coup ; il ne doit pas rivaliser avec
   * « Descendre », qui est la seule action qui quitte le hub. *Deux boutons d'or
   * côte à côte se disputent le regard* — celui-ci prend donc la matière du
   * lieu, sans son accent.
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
function plaque(texte: string, ton: TonBouton): { texture: THREE.CanvasTexture; rapport: number } {
  const cle = `${texte}|${ton}`
  const connue = TEXTURES.get(cle)
  if (connue !== undefined) return connue

  const h = 128
  const police = `600 ${Math.round(h * 0.36)}px system-ui, -apple-system, "Segoe UI", sans-serif`
  const mesure = document.createElement('canvas').getContext('2d')
  let large = h * 3
  if (mesure !== null) {
    mesure.font = police
    large = Math.round(mesure.measureText(texte).width + h * 1.1)
  }

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

  ctx.font = police
  ctx.fillStyle = encre
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(texte, large / 2, h * 0.53)
  texture.needsUpdate = true
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
  onCliquer?: () => void
}

export function Bouton3D({ texte, ton, position, petit = false, eteint = false, onCliquer }: Props): React.JSX.Element {
  const { size } = useThree()
  const { texture, rapport } = useMemo(() => plaque(texte, ton), [texte, ton])
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
 * Ce que ce bouton occupera dans la scène, pour poser deux voisins sans les
 * coller et pour le décaler sous une carte.
 */
export function tailleBouton(
  texte: string,
  ton: TonBouton,
  petit: boolean,
  z: number,
  hauteurFenetrePx: number,
): { largeur: number; hauteur: number } {
  const hauteur = hauteurMonde(hauteurBoutonPx(hauteurFenetrePx, petit), z, hauteurFenetrePx)
  return { hauteur, largeur: hauteur * plaque(texte, ton).rapport }
}

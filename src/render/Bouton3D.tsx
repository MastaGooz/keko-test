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
import { useMemo } from 'react'
import { useThree } from '@react-three/fiber'
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
  const part = hauteurFenetrePx * (petit ? 0.072 : 0.085)
  return petit
    ? Math.max(42, Math.min(60, part))
    : Math.max(48, Math.min(72, part))
}

/** La hauteur d'un bouton en unités de scène, à cette profondeur. */
function hauteurMonde(px: number, z: number, hauteurFenetrePx: number): number {
  return (px * hauteurVisibleA(z, hauteurFenetrePx)) / hauteurFenetrePx
}

/** Les tons disponibles : le fond, le liseré, l'encre. */
const TONS = {
  or: { fond: ['#3a2f16', '#221b0e'], trait: '#c9a95a', encre: '#f2e4bd' },
  perdre: { fond: ['#4a1712', '#2a0f0c'], trait: '#b3382a', encre: '#ffc9c0' },
  garder: { fond: ['#153322', '#0d1f15'], trait: '#3f8f5a', encre: '#c4e8d2' },
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
  const rayon = h * 0.22
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
  materiau.opacity = eteint ? 0.35 : 1

  const haut = hauteurMonde(hauteurBoutonPx(size.height, petit), position[2], size.height)
  return (
    <mesh
      position={position}
      material={materiau}
      onPointerDown={(e) => {
        e.stopPropagation()
        if (!eteint) onCliquer?.()
      }}
    >
      <planeGeometry args={[haut * rapport, haut]} />
    </mesh>
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

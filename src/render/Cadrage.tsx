/**
 * LE CADRAGE : la caméra recule pour que la carte ne dépasse jamais sa taille
 * plafond à l'écran.
 *
 * En 3D, une carte fait 1 de large et sa taille en pixels suit la hauteur de
 * la fenêtre : ~37 % de la hauteur, quelle qu'elle soit. Sur un téléphone c'est
 * exactement la taille du jeu 2D — mais sur un écran de PC, ça donnait des
 * cartes deux fois plus grandes que l'ancienne version. Keko : « sur PC c'est
 * beaucoup trop gros ». Le jeu 2D, lui, plafonne : `--large: min(11rem, …)`,
 * soit 264 x 370 px à 24 px/rem.
 *
 * On reprend ce plafond. Tant que la fenêtre est basse, la caméra reste à sa
 * distance de base ; dès que 37 % de la hauteur dépasserait le plafond, elle
 * recule d'autant. *Tout recule avec elle* — ennemis compris — ce qui est
 * exactement ce que fait le 2D, où les corps sont plafonnés eux aussi.
 *
 * **Les positions qui dépendent du cadrage se calculent à partir d'ici**
 * (`distanceMain`, `hauteurVisibleA`) et pas à partir de constantes : la
 * main doit rester collée au bord bas, le zoom à sa distance de lecture,
 * quelle que soit la profondeur de la caméra.
 */
import { useEffect } from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'

/** Le champ de la caméra, en degrés. */
export const FOV = 42

/** La profondeur de la main : c'est là que la taille des cartes se juge. */
export const Z_MAIN = 1.1

/** La distance caméra → main quand rien ne contraint : celle du téléphone. */
const DISTANCE_DE_BASE = 4.9

/** Le plafond du jeu 2D : 11rem x 1,4 à 24 px/rem. */
export const PLAFOND_CARTE_PX = 370

/** La hauteur d'une carte, en unités de scène. */
const HAUT_CARTE = 1.4

function tanDemiChamp(): number {
  return Math.tan((FOV / 2) * (Math.PI / 180))
}

/** À quelle distance de la main la caméra doit se tenir pour cette fenêtre. */
export function distanceMain(hauteurFenetrePx: number): number {
  // hauteur de carte à l'écran = HAUT × fenêtre / (2 d tan(fov/2)) ≤ plafond
  const requise = (HAUT_CARTE * hauteurFenetrePx) / (PLAFOND_CARTE_PX * 2 * tanDemiChamp())
  return Math.max(DISTANCE_DE_BASE, requise)
}

/** Où se tient la caméra, en z, pour cette fenêtre. */
export function zCamera(hauteurFenetrePx: number): number {
  return Z_MAIN + distanceMain(hauteurFenetrePx)
}

/** La hauteur du champ visible à la profondeur `z`, pour cette fenêtre. */
export function hauteurVisibleA(z: number, hauteurFenetrePx: number): number {
  return 2 * (zCamera(hauteurFenetrePx) - z) * tanDemiChamp()
}

/**
 * Où un point de la scène se projette sur le plan `zPlan`, vu de la caméra.
 *
 * **Deux objets à des profondeurs différentes ne se comparent pas en x et y.**
 * La carte qu'on tient vit devant le rang des créatures : le doigt peut être
 * pile sur un corps à l'écran alors que les deux points sont à une demi-unité
 * l'un de l'autre dans la scène. On ramène donc le lâcher sur le plan des
 * corps avant de chercher qui est dessous — c'est la version 3D du
 * `elementFromPoint` que le jeu 2D utilise sous le doigt.
 */
export function surLePlan(
  point: [number, number, number],
  zPlan: number,
  hauteurFenetrePx: number,
): [number, number] {
  const zCam = zCamera(hauteurFenetrePx)
  const k = (zCam - zPlan) / (zCam - point[2])
  return [point[0] * k, point[1] * k]
}

export function Cadrage(): null {
  const { camera, size } = useThree()
  useEffect(() => {
    camera.position.z = zCamera(size.height)
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.fov = FOV
      camera.updateProjectionMatrix()
    }
  }, [camera, size.height])

  return null
}

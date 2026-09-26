/**
 * CE QUI EST COMMUN AUX TROIS SILLAGES.
 *
 * Trois façons de montrer une carte en transit entre la main et un tas, à
 * comparer en jouant. Keko a écarté le premier semis de grains — « je trouve
 * le truc un peu bateau » — et veut voir les autres pistes avant de trancher.
 *
 * **Elles vivent derrière une URL, pas derrière un réglage caché** : il n'y a
 * pas encore de panneau en 3D et Keko juge depuis son téléphone. Même motif
 * que `?main=20` et que la planche `?ecusson` — *ce qui se teste doit pouvoir
 * s'ouvrir d'un lien.*
 *
 * Ce qui est partagé est ce qui ne doit surtout pas diverger : **la durée** —
 * la scène s'en sert pour caler les chocs des tas et la naissance des cartes —
 * et **la courbe**, parce que les trois doivent raconter le même trajet.
 */
import * as THREE from 'three'

/** La durée d'une traînée, en secondes. */
export const DUREE_TRAINEE = 0.34

/** Les trois pistes, au choix par `?r3f&sillage=…`. */
export type Sillage = 'comete' | 'esquilles' | 'glyphes'

const PISTES: readonly Sillage[] = ['comete', 'esquilles', 'glyphes']

export function SILLAGE_URL(): Sillage {
  const demande = new URLSearchParams(location.search).get('sillage')
  return PISTES.find((p) => p === demande) ?? 'comete'
}

export type PropsSillage = {
  depuis: [number, number, number]
  vers: [number, number, number]
  /** L'instant du départ, en secondes d'horloge de la scène. */
  debut: number
}

export function lisser(x: number): number {
  return x * x * (3 - 2 * x)
}

export function borne(x: number): number {
  return x < 0 ? 0 : x > 1 ? 1 : x
}

/**
 * L'ARC DU TRAJET, ET IL EST PROPRE À CHAQUE TRAÎNÉE.
 *
 * Le creux et le gauchissement sont tirés au hasard : *cinq traînées qui
 * suivraient exactement la même corde se liraient comme un seul trait.* La
 * bosse penche un peu, parce qu'une cloche parfaitement symétrique se lit
 * comme un tracé géométrique et non comme un jet.
 */
export function courbeEntre(
  depuis: [number, number, number],
  vers: [number, number, number],
): THREE.QuadraticBezierCurve3 {
  const a = new THREE.Vector3(...depuis)
  const b = new THREE.Vector3(...vers)
  const milieu = a.clone().lerp(b, 0.5)
  milieu.x += (Math.random() - 0.5) * 0.5
  milieu.y += 0.55 + Math.random() * 0.5
  milieu.z += 0.25
  return new THREE.QuadraticBezierCurve3(a, milieu, b)
}

/**
 * LE GRAIN DE LUMIÈRE : un dégradé radial, jamais un carré.
 * `PointsMaterial` rend des carrés durs sans texture, et un semis de carrés se
 * lit comme du bruit.
 */
export const GRAIN = ((): THREE.CanvasTexture | null => {
  const toile = document.createElement('canvas')
  toile.width = 64
  toile.height = 64
  const ctx = toile.getContext('2d')
  if (ctx === null) return null
  const d = ctx.createRadialGradient(32, 32, 0, 32, 32, 32)
  d.addColorStop(0, 'rgba(255, 249, 226, 1)')
  d.addColorStop(0.3, 'rgba(255, 213, 132, 0.65)')
  d.addColorStop(1, 'rgba(255, 186, 96, 0)')
  ctx.fillStyle = d
  ctx.fillRect(0, 0, 64, 64)
  return new THREE.CanvasTexture(toile)
})()

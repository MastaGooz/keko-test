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
  /**
   * L'inclinaison de la carte qui vient de s'éteindre là, s'il y en avait une.
   *
   * La tête reprend son angle et se couche sur sa route en chemin : *sans ça,
   * le raccord entre la carte et la traînée se verrait comme un à-coup.*
   */
  rotationDepart?: number
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
 * CE QUE LA CARTE DEVIENT EN S'ÉTEIGNANT — et c'est LITTÉRALEMENT la tête de la
 * comète.
 *
 * Keko : « ce serait super que la carte qui devient lumière rétrécisse vraiment
 * et devienne effectivement la tête de la comète, non ? » *Elle s'embrasait
 * puis disparaissait, et une traînée partait de là : deux évènements au même
 * endroit, pas une transformation.* Pour que ce soit un seul objet, il faut que
 * les deux se rejoignent sur TOUT — la taille, la place, l'inclinaison et le
 * dessin.
 *
 * D'où ces valeurs ici plutôt que dans la comète : elles sont le contrat entre
 * la carte qui s'éteint et la traînée qui la reprend. *Une valeur écrite des
 * deux côtés se serait désaccordée au premier réglage*, et le raccord est
 * précisément ce qui ne doit jamais se voir.
 */
export const TETE_SILLAGE = 0.15

/** L'étirement de la tête dans le sens de la marche. */
export const ETIRE_TETE: readonly [number, number] = [0.93, 1.18]

/** La part de l'embrasement au bout de laquelle la traînée prend le relais. */
export const PART_ENVOL = 0.72

export const CREME = '#fff4dd'
export const AMBRE = '#e8ac54'

/**
 * LA TÊTE EST UNE CARTE, PAS UN DISQUE.
 *
 * Keko : « tu crois que la tête de la comète pourrait évoquer la forme d'un
 * rectangle, comme si la carte était une comète ? » Un rectangle au rapport du
 * gabarit, coins arrondis compris, ne peut être qu'une carte — là où un disque
 * pouvait être n'importe quoi.
 *
 * *La toile a le rapport de la carte* : peinte carrée puis étirée, ses coins
 * arrondis seraient des ovales et le rayon ne serait plus celui du gabarit.
 *
 * Un cadre et rien dedans : à une trentaine de pixels, un médaillon ou un
 * second filet tournent en bouillie. **Un symbole ne se règle pas à la taille
 * où on le dessine, mais à celle où on le regarde.**
 */
export const TEXTURE_TETE = ((): THREE.CanvasTexture | null => {
  const L = 72
  const H = Math.round(L * 1.4)
  const toile = document.createElement('canvas')
  toile.width = L
  toile.height = H
  const ctx = toile.getContext('2d')
  if (ctx === null) return null
  const m = 5
  ctx.beginPath()
  ctx.roundRect(m, m, L - 2 * m, H - 2 * m, L * 0.09)
  ctx.fillStyle = CREME
  ctx.fill()
  ctx.lineWidth = 7
  ctx.strokeStyle = AMBRE
  ctx.stroke()
  return new THREE.CanvasTexture(toile)
})()

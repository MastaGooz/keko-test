/**
 * L'ONDE D'UNE PIÈCE QUI SE FIXE DANS SON SLOT.
 *
 * Demandé par Keko, au bout de la culbute : « quand elle se fixe dedans on
 * fait un petit effet d'onde, comme si une énergie magique s'en échappait ».
 *
 * **ELLE PASSE SOUS LA CARTE, ET ELLE A SA FORME.** Trois anneaux ronds
 * posés par-dessus ont vécu une version ; Keko : « je voudrais que l'onde
 * soit sous la carte posée, pas par-dessus, et que l'onde soit la même forme
 * que la carte, en une seule vague ».
 *
 * *Les trois corrections disent la même chose* : ce qui s'échappe doit
 * s'échapper DE la carte. Un cercle par-dessus est un effet appliqué ; un
 * contour de carte qui sort de dessous elle, c'est la carte qui rayonne. Et
 * une seule vague, parce qu'elle part exactement à la taille de l'objet —
 * *la première dit déjà tout, les suivantes n'étaient qu'un écho.*
 *
 * **Ce module ne monte rien : il prête sa matière et son mouvement à
 * `Carte3D`.** L'onde a d'abord été un composant voisin, monté au moment du
 * dépôt puis monté en permanence, déclenché par une prop puis par une ref —
 * et **dans tous les cas sa boucle s'arrêtait à l'instant du lâcher**, mesuré
 * à la sonde. *Le plus sûr moyen qu'une mise en scène parte à l'heure est de
 * la confier à l'objet qui la joue.*
 *
 * **Additive, et en or.** L'or est la couleur de tout ce qui a de la valeur
 * ici ; et une lumière qui s'AJOUTE au fond est une lueur, là où une couleur
 * qui le recouvre est une peinture claire — la leçon du contour des cartes.
 */
import * as THREE from 'three'

/** Ce que dure l'onde, en secondes. */
export const DUREE_ONDE = 0.72

/** De combien elle s'écarte de la carte, en parts de sa largeur. */
const ECART_ONDE = 1.15

/** L'épaisseur du trait, en parts de la largeur de la carte. */
const TRAIT = 0.055

/** Un rectangle aux coins arrondis, dans le plan XY, centré sur l'origine. */
function contour(large: number, haut: number, rayon: number): THREE.Path {
  const l = large / 2
  const h = haut / 2
  const r = Math.min(rayon, l, h)
  const p = new THREE.Path()
  p.moveTo(-l + r, -h)
  p.lineTo(l - r, -h)
  p.absarc(l - r, -h + r, r, -Math.PI / 2, 0, false)
  p.lineTo(l, h - r)
  p.absarc(l - r, h - r, r, 0, Math.PI / 2, false)
  p.lineTo(-l + r, h)
  p.absarc(-l + r, h - r, r, Math.PI / 2, Math.PI, false)
  p.lineTo(-l, -h + r)
  p.absarc(-l + r, -h + r, r, Math.PI, (3 * Math.PI) / 2, false)
  return p
}

/**
 * LE TRAIT DE L'ONDE : le contour de la carte, creusé de l'intérieur.
 *
 * Une forme pleine avec un TROU, et non deux tracés superposés : c'est la
 * seule façon d'obtenir un liseré fermé qui suit les coins arrondis. Ses
 * dimensions sont celles du gabarit, passées par la carte — *deux modules qui
 * décriraient la même forme chacun de leur côté divergeraient au premier
 * réglage.*
 */
export function geometrieDOnde(
  large: number,
  haut: number,
  rayon: number,
): THREE.ShapeGeometry {
  const e = large * TRAIT
  const forme = new THREE.Shape(contour(large, haut, rayon).getPoints(24))
  forme.holes.push(contour(large - e * 2, haut - e * 2, Math.max(0, rayon - e)))
  return new THREE.ShapeGeometry(forme, 24)
}

/** La matière d'une onde : de l'or qui s'ajoute au fond. */
export function matiereDOnde(): THREE.MeshBasicMaterial {
  return new THREE.MeshBasicMaterial({
    color: '#ffd9a0',
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    toneMapped: false,
    side: THREE.DoubleSide,
  })
}

/**
 * Pose l'onde à `dt` secondes de son départ. Rend `true` quand elle a fini.
 *
 * Elle part EXACTEMENT à la taille de la carte et s'écarte : posée derrière
 * elle, elle n'existe que par ce qui dépasse — *c'est ce qui la fait sortir
 * de dessous plutôt que se poser dessus.*
 */
export function poserLOnde(
  dt: number,
  maille: THREE.Mesh | null,
  matiere: THREE.MeshBasicMaterial,
): boolean {
  if (maille === null) return true
  const q = dt / DUREE_ONDE
  if (q < 0 || q >= 1) {
    matiere.opacity = 0
    maille.scale.setScalar(1)
    return q >= 1
  }
  // ELLE PART VITE ET S'ÉTEINT LENTEMENT, le contraste de vitesse du bond des
  // créatures : une onde régulière se lit comme une animation, pas comme
  // quelque chose qui s'échappe.
  const e = 1 - (1 - q) * (1 - q) * (1 - q)
  maille.scale.setScalar(1 + ECART_ONDE * e)
  matiere.opacity = (1 - q) * (1 - q) * 0.95
  return false
}

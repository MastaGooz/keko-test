/**
 * L'ONDE D'UNE PIÈCE QUI SE FIXE DANS SON SLOT.
 *
 * Demandé par Keko, au bout de la culbute : « quand elle se fixe dedans on
 * fait un petit effet d'onde, comme si une énergie magique s'en échappait ».
 *
 * **ELLE PASSE SOUS LA CARTE, ET ELLE A SA FORME.** Trois anneaux ronds posés
 * par-dessus ont vécu une version ; Keko : « je voudrais que l'onde soit sous
 * la carte posée, pas par-dessus, et que l'onde soit la même forme que la
 * carte, en une seule vague ».
 *
 * *Les trois corrections disaient la même chose* : ce qui s'échappe doit
 * s'échapper DE la carte. Un cercle par-dessus est un effet appliqué ; un
 * contour de carte qui sort de dessous elle, c'est la carte qui rayonne.
 *
 * **ET ELLE EST FAITE DE POUSSIÈRE.** Keko : « qu'elle aille moins loin, soit
 * moins épaisse, et soit accompagnée de petites étincelles — je visualise une
 * onde à texture un peu de poussière ». Le trait seul était propre, donc
 * *synthétique* : c'est la remarque déjà faite au sillage de la comète, où un
 * ruban lisse avait eu besoin de ses esquilles. **Un liseré dit la FORME, le
 * semis dit la MATIÈRE** — et il faut les deux.
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
const ECART_ONDE = 0.42

/** L'épaisseur du trait, en parts de la largeur de la carte. */
const TRAIT = 0.028

/** Combien de grains s'en détachent. */
const GRAINS = 26

/** Jusqu'où va le plus lointain, en parts de la largeur. */
const PORTEE_GRAIN = 0.6

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

/** La matière de l'onde : de l'or qui s'ajoute au fond. */
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
 * UN TIRAGE SANS HASARD, dérivé de l'index du grain.
 *
 * Le décor ne passe pas par le RNG seedé du jeu — il ne décide de rien — mais
 * il ne doit pas non plus tirer à chaque image : *un semis qui se réarrange
 * sous les yeux n'est plus une matière, c'est du bruit.* Deux grains voisins
 * reçoivent des valeurs sans rapport, ce qui suffit à ce que ça ne se lise pas
 * comme un motif.
 */
function tirage(i: number, sel: number): number {
  const x = Math.sin(i * 12.9898 + sel * 78.233) * 43758.5453
  return x - Math.floor(x)
}

export type Poussiere = {
  geometrie: THREE.BufferGeometry
  matiere: THREE.PointsMaterial
  semis: { x: number; y: number; dx: number; dy: number; portee: number; retard: number }[]
}

/**
 * LA POUSSIÈRE : des grains posés SUR le contour, qui s'en détachent.
 *
 * Ils partent du tracé lui-même, jamais du centre : *une poussière qui jaillit
 * du milieu se lit comme une explosion, une poussière qui se détache d'un bord
 * se lit comme de la matière qui s'envole.*
 *
 * **L'intensité passe par la COULEUR, pas par l'opacité.** En mélange additif,
 * un grain noir est un grain invisible — et c'est la seule façon de faire
 * vivre chaque grain à son rythme avec un seul matériau.
 */
export function poussiereDOnde(large: number, haut: number, rayon: number): Poussiere {
  const trace = contour(large, haut, rayon).getSpacedPoints(GRAINS * 4)
  const semis = Array.from({ length: GRAINS }, (_, i) => {
    const p = trace[Math.floor(tirage(i, 0) * trace.length) % trace.length]!
    // La direction part du centre, avec un écart : des grains strictement
    // radiaux font une étoile, et une étoile est un motif.
    const angle = Math.atan2(p.y, p.x) + (tirage(i, 1) - 0.5) * 0.5
    return {
      x: p.x,
      y: p.y,
      dx: Math.cos(angle),
      dy: Math.sin(angle),
      portee: large * PORTEE_GRAIN * (0.35 + tirage(i, 2) * 0.65),
      retard: tirage(i, 3) * 0.22,
    }
  })
  const geometrie = new THREE.BufferGeometry()
  geometrie.setAttribute('position', new THREE.BufferAttribute(new Float32Array(GRAINS * 3), 3))
  geometrie.setAttribute('color', new THREE.BufferAttribute(new Float32Array(GRAINS * 3), 3))
  const matiere = new THREE.PointsMaterial({
    size: large * 0.045,
    sizeAttenuation: true,
    vertexColors: true,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    toneMapped: false,
  })
  return { geometrie, matiere, semis }
}

/**
 * Pose l'onde à `dt` secondes de son départ. Rend `true` quand elle a fini.
 *
 * Elle part EXACTEMENT à la taille de la carte et s'écarte : posée derrière
 * elle, elle n'existe que par ce qui dépasse — *c'est ce qui la fait sortir de
 * dessous plutôt que se poser dessus.*
 */
export function poserLOnde(
  dt: number,
  maille: THREE.Mesh | null,
  matiere: THREE.MeshBasicMaterial,
  poussiere: Poussiere,
): boolean {
  const q = dt / DUREE_ONDE
  const fini = q >= 1 || q < 0

  if (maille !== null) {
    if (fini) {
      matiere.opacity = 0
      maille.scale.setScalar(1)
    } else {
      // ELLE PART VITE ET S'ÉTEINT LENTEMENT, le contraste de vitesse du bond
      // des créatures : une onde régulière se lit comme une animation, pas
      // comme quelque chose qui s'échappe.
      const e = 1 - (1 - q) * (1 - q) * (1 - q)
      maille.scale.setScalar(1 + ECART_ONDE * e)
      matiere.opacity = (1 - q) * (1 - q) * 0.95
    }
  }

  const places = poussiere.geometrie.getAttribute('position') as THREE.BufferAttribute
  const teintes = poussiere.geometrie.getAttribute('color') as THREE.BufferAttribute
  poussiere.semis.forEach((grain, i) => {
    const g = fini ? -1 : (dt - grain.retard) / (DUREE_ONDE - grain.retard)
    if (g < 0 || g >= 1) {
      teintes.setXYZ(i, 0, 0, 0)
      return
    }
    const e = 1 - (1 - g) * (1 - g) * (1 - g)
    places.setXYZ(i, grain.x + grain.dx * grain.portee * e, grain.y + grain.dy * grain.portee * e, 0)
    // Il s'allume d'un coup et s'éteint en traînant : un grain qui monterait
    // en douceur se lirait comme une lampe, pas comme une étincelle.
    const vif = (1 - g) * (1 - g) * (0.6 + tirage(i, 4) * 0.8)
    teintes.setXYZ(i, vif, vif * 0.87, vif * 0.62)
  })
  places.needsUpdate = true
  teintes.needsUpdate = true

  return fini
}

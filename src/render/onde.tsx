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
export const DUREE_ONDE = 0.58

/** De combien elle s'écarte de la carte, en parts de sa largeur. */
const ECART_ONDE = 0.3

/**
 * La longueur de la TRAÎNE, vers l'intérieur, en parts de la largeur.
 *
 * Ce n'est plus une épaisseur : le front est net sur le bord EXTÉRIEUR et ne
 * fond que vers le dedans. *Une crête suivie d'une traîne se lit plus fine
 * qu'une bande symétrique de même largeur*, parce que l'oeil place le trait là
 * où il est franc.
 */
const TRAINE = 0.07

/** En combien de points le contour est échantillonné. */
const SEGMENTS = 160

/** Combien de grains s'en détachent. */
const GRAINS = 26

/** Jusqu'où va le plus lointain, en parts de la largeur. */
const PORTEE_GRAIN = 0.55

/** Où l'on range un grain qui ne joue pas : derrière tout, hors du champ. */
const LOIN = -900

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
 * CE QUI FAIT RESPIRER LE TRAIT : une somme de sinus sur le tour.
 *
 * Les fréquences sont ENTIÈRES, et il le faut : le contour est fermé, donc une
 * fréquence qui ne retombe pas juste laisserait une couture visible là où le
 * tracé se referme. Trois harmoniques suffisent — *deux font un battement
 * régulier, quatre font du bruit.*
 */
function ondule(t: number): number {
  const a = Math.sin(t * Math.PI * 2 * 3 + 0.7)
  const b = Math.sin(t * Math.PI * 2 * 7 + 2.1)
  const c = Math.sin(t * Math.PI * 2 * 13 + 4.3)
  return (a * 0.5 + b * 0.32 + c * 0.18 + 1) / 2
}

/**
 * LE TRAIT DE L'ONDE : UN FRONT NET, UNE TRAÎNE QUI S'ÉTEINT DEDANS.
 *
 * Il a d'abord été un liseré plein, puis une bande fondue des DEUX côtés —
 * Keko : « je voudrais un truc plus fin, qui progresse un peu moins loin, et
 * qui est plein juste sur le bord, avec vers l'intérieur un dégradé de moins
 * en moins opaque qui le suit ».
 *
 * *C'est la forme d'une vague, et elle n'est pas symétrique* : une crête
 * franche à l'avant, une traîne derrière. Deux rangées suffisent donc — le
 * contour lui-même, à pleine lumière, et une rangée en retrait, éteinte.
 *
 * **LE DÉGRADÉ PASSE PAR L'ALPHA, PAS PAR LA COULEUR, et ça a coûté un bug
 * visible.** *Le canvas du jeu est TRANSPARENT* : en mélange additif, un
 * sommet noir mais d'alpha plein n'ajoute aucune couleur ET écrit quand même
 * de l'alpha — donc un pixel NOIR OPAQUE par-dessus la page. Keko : « il y a
 * un bug qui laisse des particules noires après l'effet ». Les couleurs de
 * sommet sont donc en RGBA, et c'est l'alpha qui s'éteint.
 *
 * **Elle respire le long du tour** : sans ça, un front d'intensité constante
 * reste un tracé, juste un peu plus doux. C'est la modulation qui la rend
 * vivante.
 *
 * Ses dimensions sont celles du gabarit, passées par la carte — *deux modules
 * qui décriraient la même forme chacun de leur côté divergeraient au premier
 * réglage.*
 */
export function geometrieDOnde(
  large: number,
  haut: number,
  rayon: number,
): THREE.BufferGeometry {
  const points = contour(large, haut, rayon).getSpacedPoints(SEGMENTS)
  const n = SEGMENTS
  const e = large * TRAINE
  const places: number[] = []
  const teintes: number[] = []

  for (let i = 0; i < n; i++) {
    const p = points[i]!
    const avant = points[(i - 1 + n) % n]!
    const apres = points[(i + 1) % n]!
    // LA NORMALE SORT DE LA TANGENTE, pas du centre : sur un rectangle, une
    // direction radiale part de travers dès qu'on s'éloigne des diagonales, et
    // la traîne s'épaissirait aux coins.
    const tx = apres.x - avant.x
    const ty = apres.y - avant.y
    const l = Math.hypot(tx, ty) || 1
    let nx = -ty / l
    let ny = tx / l
    if (nx * p.x + ny * p.y < 0) {
      nx = -nx
      ny = -ny
    }
    // Le front est SUR le contour, la traîne rentre : rien ne dépasse devant.
    places.push(p.x, p.y, 0, p.x - nx * e, p.y - ny * e, 0)
    const m = 0.45 + 0.55 * ondule(i / n)
    teintes.push(1, 0.87, 0.62, m, 1, 0.87, 0.62, 0)
  }

  const indices: number[] = []
  for (let i = 0; i < n; i++) {
    const a = i * 2
    const b = ((i + 1) % n) * 2
    indices.push(a, a + 1, b + 1, a, b + 1, b)
  }

  const geometrie = new THREE.BufferGeometry()
  geometrie.setAttribute('position', new THREE.Float32BufferAttribute(places, 3))
  geometrie.setAttribute('color', new THREE.Float32BufferAttribute(teintes, 4))
  geometrie.setIndex(indices)
  return geometrie
}

/**
 * La matière de l'onde : de l'or qui s'ajoute au fond.
 *
 * Sa couleur est BLANCHE parce que la teinte vit dans les sommets — c'est eux
 * qui portent à la fois l'or et le dégradé.
 */
export function matiereDOnde(): THREE.MeshBasicMaterial {
  return new THREE.MeshBasicMaterial({
    color: '#ffffff',
    vertexColors: true,
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
 * **L'intensité passe par l'ALPHA de chaque sommet**, ce qui permet de les
 * faire vivre à leur rythme avec un seul matériau — et un grain éteint est
 * en plus **renvoyé hors du champ**. Les deux, parce qu'un grain noir d'alpha
 * plein tache le canvas transparent (voir le trait), et parce qu'un grain
 * qu'on ne dessine pas est le seul qui ne puisse rien tacher du tout.
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
      // LE RETARD EST UNE PART DE LA DURÉE, pas un temps écrit à la main :
      // sinon régler la vitesse de l'onde étalerait ou tasserait les grains
      // sans qu'on l'ait demandé.
      retard: tirage(i, 3) * DUREE_ONDE * 0.3,
    }
  })
  const geometrie = new THREE.BufferGeometry()
  const places = new Float32Array(GRAINS * 3)
  // AU LOIN TANT QU'ILS NE JOUENT PAS : un grain qui attend son tour à
  // l'origine serait un point posé au milieu de la carte.
  for (let i = 0; i < GRAINS; i++) places[i * 3 + 2] = LOIN
  geometrie.setAttribute('position', new THREE.BufferAttribute(places, 3))
  geometrie.setAttribute('color', new THREE.BufferAttribute(new Float32Array(GRAINS * 4), 4))
  const matiere = new THREE.PointsMaterial({
    size: large * 0.04,
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
      teintes.setXYZW(i, 1, 0.87, 0.62, 0)
      places.setXYZ(i, 0, 0, LOIN)
      return
    }
    const e = 1 - (1 - g) * (1 - g) * (1 - g)
    places.setXYZ(i, grain.x + grain.dx * grain.portee * e, grain.y + grain.dy * grain.portee * e, 0)
    // Il s'allume d'un coup et s'éteint en traînant : un grain qui monterait
    // en douceur se lirait comme une lampe, pas comme une étincelle.
    const vif = (1 - g) * (1 - g) * (0.6 + tirage(i, 4) * 0.8)
    teintes.setXYZW(i, 1, 0.87, 0.62, Math.min(1, vif))
  })
  places.needsUpdate = true
  teintes.needsUpdate = true

  return fini
}

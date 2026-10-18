/**
 * LE RENDU TOON D'UNE FIGURINE — three.js, hors React.
 *
 * Les boules fusionnent en une surface lisse par MARCHING CUBES (l'objet
 * d'exemple de three, champ de metaballs), recolorée sommet par sommet par
 * la boule qui domine à cet endroit (une pondération en 1 / d⁶ : les taches
 * de ventre gardent un bord net). Les solides durs sont des géométries
 * ordinaires. Tout est rendu avec `MeshToonMaterial` et une rampe à trois
 * paliers, et chaque maillage porte son CONTOUR : la même géométrie,
 * gonflée le long des normales, faces arrière, couleur du contour (la
 * « coque inversée », le plus vieux truc du cel shading).
 *
 * Deux usages : une VIGNETTE (un rendu, une image), et la VISIONNEUSE (une
 * figurine qui tourne dans un canvas).
 */
import * as THREE from 'three'
import { MarchingCubes } from 'three/examples/jsm/objects/MarchingCubes.js'
import { genererFigurine, type Figurine, type Solide } from '../../logic/procgen/figurine.ts'
import { genererVaisseau3D } from '../../logic/procgen/vaisseau3d.ts'

export type Sorte3D = 'figurine' | 'vaisseau3d'

const RESOLUTION = 56
const ISOLATION = 80
// Plus il est grand, moins les boules s'influencent de loin : à 12 tout
// fondait en une patate, à 36 la tête se détache du corps et les joints restent lisses.
const SOUSTRAIT = 36
const EPAISSEUR_CONTOUR = 0.022

let rampe: THREE.DataTexture | null = null
function rampeToon(): THREE.DataTexture {
  if (rampe) return rampe
  // Trois paliers : l'ombre, le ton, la lumière.
  const data = new Uint8Array([90, 90, 90, 255, 170, 170, 170, 255, 255, 255, 255, 255])
  rampe = new THREE.DataTexture(data, 3, 1, THREE.RGBAFormat)
  rampe.minFilter = THREE.NearestFilter
  rampe.magFilter = THREE.NearestFilter
  rampe.generateMipmaps = false
  rampe.needsUpdate = true
  return rampe
}

/** Le matériau du contour : la coque inversée. */
function materiauContour(couleur: string): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    side: THREE.BackSide,
    uniforms: { uCouleur: { value: new THREE.Color(couleur) }, uEpaisseur: { value: EPAISSEUR_CONTOUR } },
    // Le gonflement se fait en ESPACE VUE : la même épaisseur quel que soit
    // l'objet, même aplati (en espace local, une aile écrasée faisait une tache noire).
    vertexShader: `
      uniform float uEpaisseur;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vec3 n = normalize(normalMatrix * normal);
        mv.xyz += n * uEpaisseur;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `
      uniform vec3 uCouleur;
      void main() { gl_FragColor = vec4(uCouleur, 1.0); }`,
  })
}

function materiauToon(couleur: string, opacite = 1, vertexColors = false): THREE.MeshToonMaterial {
  const m = new THREE.MeshToonMaterial({ color: vertexColors ? '#ffffff' : couleur, gradientMap: rampeToon(), vertexColors })
  if (opacite < 1) {
    m.transparent = true
    m.opacity = opacite
  }
  return m
}

/** La surface des boules, recolorée sommet par sommet. */
function surfaceDesBoules(f: Figurine): THREE.Mesh | null {
  if (!f.boules.length) return null
  const mc = new MarchingCubes(RESOLUTION, materiauToon('#ffffff', 1, true), false, true, 90000)
  mc.isolation = ISOLATION
  mc.reset()
  for (const b of f.boules) {
    // Rayon r dans [-1, 1] : la surface est à strength / d² - subtract = isolation.
    const force = (b.r / 2) ** 2 * (ISOLATION + SOUSTRAIT)
    mc.addBall((b.x + 1) / 2, (b.y + 1) / 2, (b.z + 1) / 2, force, SOUSTRAIT, new THREE.Color(b.couleur))
  }
  mc.update()
  // Les couleurs : la boule qui domine, en 1 / d⁶, sinon le mélange est terne.
  const g = mc.geometry
  const n = g.drawRange.count
  const pos = g.attributes.position.array as Float32Array
  const col = g.attributes.color.array as Float32Array
  const couleurs = f.boules.map((b) => new THREE.Color(b.couleur))
  for (let i = 0; i < n; i++) {
    const x = pos[i * 3]
    const y = pos[i * 3 + 1]
    const z = pos[i * 3 + 2]
    let sr = 0
    let sg = 0
    let sb = 0
    let sw = 0
    for (let k = 0; k < f.boules.length; k++) {
      const b = f.boules[k]
      const d2 = (x - b.x) ** 2 + (y - b.y) ** 2 + (z - b.z) ** 2
      const w = (b.r * b.r) / (d2 * d2 * d2 + 1e-9)
      sr += couleurs[k].r * w
      sg += couleurs[k].g * w
      sb += couleurs[k].b * w
      sw += w
    }
    col[i * 3] = sr / sw
    col[i * 3 + 1] = sg / sw
    col[i * 3 + 2] = sb / sw
  }
  g.attributes.color.needsUpdate = true
  // La géométrie seule, détachée de l'objet MarchingCubes (qui garde ses tampons).
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(pos.slice(0, n * 3), 3))
  geo.setAttribute('normal', new THREE.BufferAttribute((g.attributes.normal.array as Float32Array).slice(0, n * 3), 3))
  geo.setAttribute('color', new THREE.BufferAttribute(col.slice(0, n * 3), 3))
  const mesh = new THREE.Mesh(geo, materiauToon('#ffffff', 1, true))
  const contour = new THREE.Mesh(geo, materiauContour(f.palette.contour))
  mesh.add(contour)
  return mesh
}

const GEOS = {
  sphere: new THREE.SphereGeometry(1, 24, 16),
  cone: new THREE.ConeGeometry(1, 1, 18),
  octaedre: new THREE.OctahedronGeometry(1, 0),
  boite: new THREE.BoxGeometry(1, 1, 1),
}

/** La géométrie d'un solide : partagée pour les formes unités, construite pour le reste. */
function geometrieDe(s: Solide): { geo: THREE.BufferGeometry; partagee: boolean } {
  if (s.forme === 'cylindre') {
    const [h, b] = s.rayons ?? [1, 1]
    return { geo: new THREE.CylinderGeometry(h, b, 1, 24), partagee: false }
  }
  if (s.forme === 'prisme' && s.pts) {
    // Le polygone dans le plan de la Shape, extrudé le long de z, puis couché.
    const shape = new THREE.Shape(s.pts.map(([a, b]) => new THREE.Vector2(a, b)))
    const ep = s.epaisseur ?? 0.1
    const biseau = Math.min(s.biseau ?? 0.02, ep * 0.4)
    const geo = new THREE.ExtrudeGeometry(shape, { depth: ep - 2 * biseau, bevelEnabled: true, bevelThickness: biseau, bevelSize: biseau, bevelSegments: 2, curveSegments: 6 })
    geo.translate(0, 0, -(ep - 2 * biseau) / 2)
    if (s.axe === 'x') geo.rotateY(-Math.PI / 2) // (z, y) du vaisseau, épaisseur le long de x
    else geo.rotateX(Math.PI / 2) // (x, z) du vaisseau, épaisseur le long de y
    geo.computeVertexNormals()
    return { geo, partagee: false }
  }
  if (s.forme === 'boite') return { geo: GEOS.boite, partagee: true }
  if (s.forme === 'cone') return { geo: GEOS.cone, partagee: true }
  if (s.forme === 'octaedre') return { geo: GEOS.octaedre, partagee: true }
  return { geo: GEOS.sphere, partagee: true }
}

/** Les solides durs, montés dans un groupe. */
function monterSolides(solides: readonly Solide[], contour: string, groupe: THREE.Group): void {
  for (const s of solides) {
    const { geo } = geometrieDe(s)
    const mesh = new THREE.Mesh(geo, materiauToon(s.couleur, s.opacite ?? 1))
    mesh.position.set(s.x, s.y, s.z)
    mesh.scale.set(s.s[0], s.s[1], s.s[2])
    mesh.rotation.set(s.rot[0], s.rot[1], s.rot[2])
    // Un cône est posé par sa base, pas par son centre.
    if (s.forme === 'cone') mesh.translateY(s.s[1] / 2)
    if (!s.sansContour) mesh.add(new THREE.Mesh(geo, materiauContour(contour)))
    groupe.add(mesh)
  }
}

/** La figurine montée : un groupe, prêt à poser dans une scène. */
export function monterFigurine(f: Figurine): THREE.Group {
  const groupe = new THREE.Group()
  const surface = surfaceDesBoules(f)
  if (surface) groupe.add(surface)
  monterSolides(f.solides, f.palette.contour, groupe)
  return groupe
}

/** L'objet 3D d'une sorte, monté et orienté pour la vue. */
function monter(sorte: Sorte3D, id: string): THREE.Group {
  if (sorte === 'figurine') {
    const g = monterFigurine(genererFigurine(id))
    g.rotation.y = -0.35
    return g
  }
  const v = genererVaisseau3D(id)
  const g = new THREE.Group()
  monterSolides(v.solides, v.palette.ombre, g)
  // Vu de trois quarts, d'au-dessus, le nez vers le bas gauche.
  g.rotation.set(0.55, -0.6, 0)
  g.scale.setScalar(1.15)
  return g
}

/** Une scène prête : lumières et caméra. */
function scene(): { scene: THREE.Scene; camera: THREE.PerspectiveCamera } {
  const sc = new THREE.Scene()
  const cle = new THREE.DirectionalLight('#ffffff', 2.6)
  cle.position.set(2.5, 4, 4)
  sc.add(cle)
  const contre = new THREE.DirectionalLight('#cfe0ff', 0.6)
  contre.position.set(-3, 1, -2)
  sc.add(contre)
  sc.add(new THREE.AmbientLight('#ffffff', 0.55))
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 20)
  camera.position.set(0, 0.5, 3.4)
  camera.lookAt(0, 0.02, 0)
  return { scene: sc, camera }
}

let rendeurVignettes: THREE.WebGLRenderer | null = null

/** Le rendu d'une figurine en image (data URL), à la taille demandée. */
export function vignette3D(sorte: Sorte3D, id: string, taille: number): string {
  if (!rendeurVignettes) {
    rendeurVignettes = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true })
    rendeurVignettes.setPixelRatio(1)
    rendeurVignettes.outputColorSpace = THREE.SRGBColorSpace
  }
  const r = rendeurVignettes
  const px = Math.min(512, taille * 2)
  r.setSize(px, px, false)
  r.setClearColor(0x000000, 0)
  const { scene: sc, camera } = scene()
  const groupe = monter(sorte, id)
  sc.add(groupe)
  r.render(sc, camera)
  const url = r.domElement.toDataURL('image/png')
  liberer(groupe)
  return url
}

function liberer(groupe: THREE.Group): void {
  groupe.traverse((o) => {
    if (o instanceof THREE.Mesh) {
      if (!(Object.values(GEOS) as THREE.BufferGeometry[]).includes(o.geometry)) o.geometry.dispose()
      // Le contour partage la géométrie : il est libéré avec elle.
      const m = o.material as THREE.Material
      m.dispose()
    }
  })
}

/** La visionneuse : une figurine qui tourne dans un canvas, jusqu'à `arreter()`. */
export function visionneuse(canvas: HTMLCanvasElement, sorte: Sorte3D, id: string, taille: number): { arreter: () => void } {
  const r = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
  r.setPixelRatio(Math.min(2, window.devicePixelRatio || 1))
  r.setSize(taille, taille, false)
  r.outputColorSpace = THREE.SRGBColorSpace
  r.setClearColor(0x000000, 0)
  const { scene: sc, camera } = scene()
  const groupe = monter(sorte, id)
  const y0 = groupe.rotation.y
  sc.add(groupe)
  let vivant = true
  const t0 = performance.now()
  const image = (t: number) => {
    if (!vivant) return
    groupe.rotation.y = y0 + ((t - t0) / 1000) * 0.9
    groupe.position.y = Math.sin((t - t0) / 600) * 0.02
    r.render(sc, camera)
    requestAnimationFrame(image)
  }
  requestAnimationFrame(image)
  return {
    arreter: () => {
      vivant = false
      liberer(groupe)
      r.dispose()
    },
  }
}

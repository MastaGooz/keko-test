/**
 * CE QUI VOLE ENTRE LA MAIN ET LES TAS : UNE COMÈTE, PAS UN SEMIS.
 *
 * Keko : « je trouve le truc un peu bateau, des petites particules
 * transparentes… t'as un truc plus original et stylé ? »
 *
 * *Un semis de grains n'a pas de forme*, et c'est ce qui le rendait banal : il
 * dit « il se passe quelque chose » sans dire QUOI, et n'importe quel jeu en
 * met partout. Ce qui traverse l'écran ici est un objet précis — une carte qui
 * part au tas, une carte qui en sort — donc il lui faut **un corps, une tête et
 * un sens.**
 *
 * Trois pièces, et chacune fait un travail que les deux autres ne font pas :
 *
 * - **LE SILLAGE**, un ruban de lumière tendu le long de l'arc, large derrière
 *   la tête et effilé vers la queue. C'est lui qui donne la TRAJECTOIRE : un
 *   grain isolé ne dit pas d'où il vient, un ruban raconte tout le chemin d'un
 *   coup d'oeil ;
 * - **LA TÊTE**, un coeur clair qui ouvre la route. C'est elle qui donne le
 *   SENS — sans elle, le ruban se lirait aussi bien à l'envers ;
 * - **LES ESQUILLES**, une poignée d'éclats qui se détachent et dérivent. Elles
 *   donnent la MATIÈRE : un ruban seul est lisse, donc synthétique ; ce qui
 *   s'en détache le rend chaud et vivant.
 *
 * **L'OR DU JEU, PAS UN BLANC NEUTRE.** Le laiton des cartes, l'ambre de
 * l'énergie, le filet des tas : c'est la couleur de tout ce qui a de la valeur
 * ici. Un sillage blanc aurait été un effet posé par-dessus le jeu ; celui-ci
 * en fait partie.
 *
 * **Le ruban est construit à la main**, pas avec une ligne : `LineBasicMaterial`
 * est plafonné à 1 px de large sur la plupart des machines — la règle est déjà
 * écrite pour la flèche de visée. On tend donc deux bords autour de la courbe
 * et on les coud en triangles.
 *
 * **Il fait toujours face à la caméra.** La perpendiculaire se prend dans le
 * plan de l'écran (produit vectoriel avec l'axe de vue), sinon un ruban posé de
 * profil devient invisible au milieu de sa course.
 */
import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

/** La durée d'une traînée, en secondes. */
export const DUREE_TRAINEE = 0.34

/** Ce qui sépare le départ de la tête de celui de la queue. */
const RETARD_QUEUE = 0.38

/** Le nombre de tronçons du ruban : assez pour que la courbe ne se casse pas. */
const SEGMENTS = 24

/** La demi-largeur du sillage, en unités de scène (une carte fait 1 de large). */
const LARGEUR = 0.085

const ESQUILLES = 9

/**
 * LE GRAIN DES ESQUILLES : un dégradé radial, jamais un carré.
 * `PointsMaterial` rend des carrés durs sans texture, et un semis de carrés se
 * lit comme du bruit.
 */
const GRAIN = ((): THREE.CanvasTexture | null => {
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

/**
 * LA MATIÈRE DU SILLAGE, peinte une fois.
 *
 * Deux axes, deux rôles : **en longueur** l'éclat s'éteint de la tête vers la
 * queue, **en travers** il se fond sur les deux bords. *Une arête franche
 * trahirait un rectangle* — la même leçon que le halo des cartes, où l'alpha
 * devait être retombé à zéro avant le bord du plan.
 */
const SILLAGE = ((): THREE.CanvasTexture | null => {
  const L = 128
  const H = 32
  const toile = document.createElement('canvas')
  toile.width = L
  toile.height = H
  const ctx = toile.getContext('2d')
  if (ctx === null) return null
  for (let x = 0; x < L; x += 1) {
    // La tête est à gauche : l'éclat s'éteint vite, sinon la queue pèse autant
    // que le nez et le sens de marche se perd.
    const i = Math.pow(1 - x / (L - 1), 1.7)
    const g = ctx.createLinearGradient(0, 0, 0, H)
    g.addColorStop(0, 'rgba(255, 168, 64, 0)')
    g.addColorStop(0.34, `rgba(255, 206, 122, ${i * 0.5})`)
    g.addColorStop(0.5, `rgba(255, 250, 228, ${i})`)
    g.addColorStop(0.66, `rgba(255, 206, 122, ${i * 0.5})`)
    g.addColorStop(1, 'rgba(255, 168, 64, 0)')
    ctx.fillStyle = g
    ctx.fillRect(x, 0, 1, H)
  }
  return new THREE.CanvasTexture(toile)
})()

type Props = {
  depuis: [number, number, number]
  vers: [number, number, number]
  /** L'instant du départ, en secondes d'horloge de la scène. */
  debut: number
}

function lisser(x: number): number {
  return x * x * (3 - 2 * x)
}

function borne(x: number): number {
  return x < 0 ? 0 : x > 1 ? 1 : x
}

export function Trainee({ depuis, vers, debut }: Props): React.JSX.Element {
  const ruban = useRef<THREE.Mesh>(null)
  const tete = useRef<THREE.Points>(null)
  const eclats = useRef<THREE.Points>(null)

  /**
   * LA COURBE, ET ELLE EST PROPRE À CHAQUE TRAÎNÉE.
   *
   * Le creux et le gauchissement sont tirés une fois : *cinq traînées qui
   * suivraient exactement la même corde se liraient comme un seul trait.*
   */
  const courbe = useMemo(() => {
    const a = new THREE.Vector3(...depuis)
    const b = new THREE.Vector3(...vers)
    const milieu = a.clone().lerp(b, 0.5)
    const creux = 0.55 + Math.random() * 0.5
    const biais = (Math.random() - 0.5) * 0.5
    // La bosse monte, et elle penche un peu : une cloche parfaitement
    // symétrique se lit comme un tracé géométrique, pas comme un jet.
    milieu.x += biais
    milieu.y += creux
    milieu.z += 0.25
    return new THREE.QuadraticBezierCurve3(a, milieu, b)
  }, [depuis, vers])

  /** Le décalage et la dérive de chaque esquille, tirés une fois. */
  const semis = useMemo(
    () =>
      Array.from({ length: ESQUILLES }, () => ({
        // Où elle se tient le long du sillage : jamais sur la tête, qui a déjà
        // son coeur — ce sont des éclats qui RESTENT en arrière.
        part: 0.15 + Math.random() * 0.85,
        derive: [
          (Math.random() - 0.5) * 0.42,
          (Math.random() - 0.5) * 0.34,
          (Math.random() - 0.5) * 0.2,
        ] as [number, number, number],
      })),
    [],
  )

  /** Le ruban : deux bords cousus en triangles, tissés une fois pour toutes. */
  const toile = useMemo(() => {
    const g = new THREE.BufferGeometry()
    const n = SEGMENTS + 1
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 2 * 3), 3))
    const uv = new Float32Array(n * 2 * 2)
    for (let i = 0; i < n; i += 1) {
      const u = i / SEGMENTS
      uv[i * 4] = u
      uv[i * 4 + 1] = 0
      uv[i * 4 + 2] = u
      uv[i * 4 + 3] = 1
    }
    g.setAttribute('uv', new THREE.BufferAttribute(uv, 2))
    const index: number[] = []
    for (let i = 0; i < SEGMENTS; i += 1) {
      index.push(i * 2, i * 2 + 1, i * 2 + 2, i * 2 + 1, i * 2 + 3, i * 2 + 2)
    }
    g.setIndex(index)
    return g
  }, [])

  const matiere = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        map: SILLAGE,
        transparent: true,
        depthWrite: false,
        toneMapped: false,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
      }),
    [],
  )

  const grains = useMemo(() => {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(ESQUILLES * 3), 3))
    return g
  }, [])

  const noyau = useMemo(() => {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(3), 3))
    return g
  }, [])

  const matiereEclats = useMemo(
    () =>
      new THREE.PointsMaterial({
        map: GRAIN,
        size: 0.13,
        transparent: true,
        depthWrite: false,
        toneMapped: false,
        blending: THREE.AdditiveBlending,
      }),
    [],
  )

  const matiereTete = useMemo(
    () =>
      new THREE.PointsMaterial({
        map: GRAIN,
        size: 0.42,
        transparent: true,
        depthWrite: false,
        toneMapped: false,
        blending: THREE.AdditiveBlending,
      }),
    [],
  )

  const travail = useMemo(
    () => ({
      p: new THREE.Vector3(),
      q: new THREE.Vector3(),
      tangente: new THREE.Vector3(),
      cote: new THREE.Vector3(),
      vue: new THREE.Vector3(0, 0, 1),
    }),
    [],
  )

  useFrame((etat) => {
    const m = ruban.current
    const n = tete.current
    const e = eclats.current
    if (m === null || n === null || e === null) return

    const t = etat.clock.elapsedTime - debut
    const vie = DUREE_TRAINEE * (1 + RETARD_QUEUE)
    // TANT QU'ELLE N'EST PAS PARTIE, ELLE N'EXISTE PAS. Les traînées sont
    // montées d'un coup et s'égrènent ensuite : celles qui attendent leur tour
    // gardaient une géométrie à zéro, donc leur tête se posait à l'ORIGINE de
    // la scène — un point blanc en plein milieu de l'écran, une bonne seconde
    // avant que quoi que ce soit ne vole. *Un objet qui n'a pas encore de place
    // ne doit pas être visible, pas être placé au centre.*
    const actif = t >= 0 && t < vie
    m.visible = actif
    n.visible = actif
    e.visible = actif
    if (!actif) return

    // LA QUEUE PART APRÈS LA TÊTE, et arrive après elle : c'est ce décalage,
    // et lui seul, qui donne sa longueur au sillage. Il naît court, s'étire en
    // chemin, puis se résorbe dans le tas — *un ruban de longueur fixe se lit
    // comme un objet rigide qu'on déplace.*
    const avantTete = lisser(borne(t / DUREE_TRAINEE))
    const avantQueue = lisser(borne((t - DUREE_TRAINEE * RETARD_QUEUE) / DUREE_TRAINEE))

    const positions = toile.getAttribute('position') as THREE.BufferAttribute
    for (let i = 0; i <= SEGMENTS; i += 1) {
      const u = i / SEGMENTS
      const s = avantTete + (avantQueue - avantTete) * u
      courbe.getPoint(s, travail.p)
      courbe.getTangent(s, travail.tangente)
      // LA PERPENDICULAIRE SE PREND DANS LE PLAN DE L'ÉCRAN : un ruban orienté
      // dans l'espace se met de profil en cours de route et disparaît.
      travail.cote.crossVectors(travail.tangente, travail.vue).normalize()
      // Le nez est fin, le corps large juste derrière, la queue effilée : c'est
      // ce profil qui fait lire une comète plutôt qu'un trait.
      const large = LARGEUR * Math.pow(1 - u, 0.75) * Math.min(1, 0.2 + u * 7)
      travail.q.copy(travail.cote).multiplyScalar(large)
      positions.setXYZ(
        i * 2,
        travail.p.x + travail.q.x,
        travail.p.y + travail.q.y,
        travail.p.z + travail.q.z,
      )
      positions.setXYZ(
        i * 2 + 1,
        travail.p.x - travail.q.x,
        travail.p.y - travail.q.y,
        travail.p.z - travail.q.z,
      )
    }
    positions.needsUpdate = true

    courbe.getPoint(avantTete, travail.p)
    const coeur = noyau.getAttribute('position') as THREE.BufferAttribute
    coeur.setXYZ(0, travail.p.x, travail.p.y, travail.p.z)
    coeur.needsUpdate = true

    const semences = grains.getAttribute('position') as THREE.BufferAttribute
    for (let i = 0; i < ESQUILLES; i += 1) {
      const g = semis[i]!
      const s = avantTete + (avantQueue - avantTete) * g.part
      courbe.getPoint(s, travail.q)
      // ELLES S'ÉCARTENT EN VIEILLISSANT : une esquille collée au ruban n'en
      // est pas une, elle en fait partie.
      const age = borne((avantTete - s) * 3.4)
      semences.setXYZ(
        i,
        travail.q.x + g.derive[0] * age,
        travail.q.y + g.derive[1] * age,
        travail.q.z + g.derive[2] * age,
      )
    }
    semences.needsUpdate = true

    // Elle s'allume vite et s'éteint en arrivant : ce qu'on doit voir, c'est le
    // trajet, pas ce qui se pose au bout.
    const avance = t / vie
    const eclat = Math.min(1, avance * 6) * (1 - Math.pow(avance, 2.2))
    matiere.opacity = eclat
    matiereEclats.opacity = eclat * 0.95
    // La tête s'efface avant le reste : elle entre dans le tas, le sillage la
    // suit. Sans ça on verrait un point rester posé sur le paquet.
    matiereTete.opacity = eclat * (1 - lisser(borne((avantTete - 0.75) * 4)))
    matiereTete.size = 0.42 - 0.2 * avance
  })

  return (
    <group>
      <mesh ref={ruban} geometry={toile} material={matiere} raycast={() => null} />
      <points ref={tete} geometry={noyau} material={matiereTete} raycast={() => null} />
      <points ref={eclats} geometry={grains} material={matiereEclats} raycast={() => null} />
    </group>
  )
}

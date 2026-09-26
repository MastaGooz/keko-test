/**
 * CE QUI VOLE ENTRE LA MAIN ET LES TAS : UNE COMÈTE **DESSINÉE**.
 *
 * Keko, sur la première version : « je trouve le truc un peu bateau, des
 * petites particules transparentes ». Puis, une fois la comète en place :
 * « j'aime bien la comète c'est sûr, mais c'est possible d'avoir un rendu plus
 * *dessin* — moins particule — avec peut-être le centre de la comète en
 * opacité 100 % ? L'idée est de matcher le dessin des cartes, un peu
 * minimaliste / stylisé. »
 *
 * **CE QUI FAIT « PARTICULE » N'EST PAS LA FORME, C'EST LE MÉLANGE ADDITIF.**
 * Une couleur qui s'ajoute au fond est toujours une lueur : elle n'a pas de
 * bord, elle n'a pas de matière, elle se lit comme de la lumière parasite. Le
 * même ruban, posé en mélange NORMAL avec des aplats et une arête franche,
 * devient un trait peint. *C'est le mélange qu'on a changé, pas le dessin.*
 *
 * Trois pièces, toutes opaques en leur coeur :
 *
 * - **LA TÊTE, QUI EST UNE CARTE** — un rectangle de crème à 100 % cerclé
 *   d'ambre, au rapport du gabarit, couché dans le sens de la marche. Keko la
 *   voulait pleine (*un centre translucide n'a pas de centre*), puis
 *   rectangulaire : « comme si la carte était une comète ». *C'est ce qui fait
 *   que l'effet dit enfin ce qu'il transporte* ;
 * - **LE SILLAGE**, un ruban à DEUX APLATS — un coeur de crème opaque, une
 *   bordure d'ambre — qui s'affine en pointe. La transparence ne fait plus
 *   l'effilement, c'est la GÉOMÉTRIE : un trait dessiné se termine en pointe,
 *   il ne s'évapore pas ;
 * - **TROIS LOSANGES** qui traînent derrière, pleins eux aussi. Ce sont des
 *   formes, pas des grains : le losange est déjà le médaillon du dos de carte.
 *
 * **Deux aplats, pas trois.** Keko avait écarté un dégradé en trois couches sur
 * le contour des cartes — au-delà de deux tons, on lit les paliers au lieu de
 * lire la matière.
 *
 * **La longueur du sillage n'est pas un réglage, c'est un DÉCALAGE** : la queue
 * part 38 % plus tard que la tête et arrive 38 % plus tard. Le ruban naît donc
 * court, s'étire en chemin et se résorbe dans le tas — *un ruban de longueur
 * fixe se lit comme un objet rigide qu'on déplace.*
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
import type { PropsSillage } from './sillage.ts'
import { borne, courbeEntre, DUREE_TRAINEE, lisser } from './sillage.ts'

/** Ce qui sépare le départ de la tête de celui de la queue. */
const RETARD_QUEUE = 0.38

/** Le nombre de tronçons du ruban : assez pour que la courbe ne se casse pas. */
const SEGMENTS = 24

/** La demi-largeur du sillage, en unités de scène (une carte fait 1 de large). */
const LARGEUR = 0.062

/** La largeur de la tête. Sa hauteur en découle : c'est une CARTE. */
const TETE = 0.15

/** Le rapport du gabarit, celui de toutes les cartes du jeu. */
const RAPPORT = 1.4

const LOSANGES = 3

const CREME = '#fff4dd'
const AMBRE = '#e8ac54'

/**
 * LA MATIÈRE DU SILLAGE : DEUX APLATS, ET UNE ARÊTE FRANCHE.
 *
 * En travers, un coeur de crème pleine bordé d'ambre — *pas de dégradé*, c'est
 * lui qui faisait « particule ». En longueur, l'opacité ne bouge presque pas :
 * l'effilement est dans la forme, et seul le tout dernier bout s'estompe pour
 * que la pointe ne se coupe pas net.
 *
 * Les transitions gardent UN pixel de fondu. *Une arête franche n'est pas une
 * arête crénelée* : sans ce pixel, le bord scintille dès que le ruban bouge.
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
    const u = x / (L - 1)
    // La queue ne s'éteint que sur son dernier quart : avant, le trait est
    // plein. Un dégradé sur toute la longueur redonnerait une traînée de gaz.
    const reste = u < 0.72 ? 1 : 1 - (u - 0.72) / 0.28
    const g = ctx.createLinearGradient(0, 0, 0, H)
    const bord = 0.5 - 0.5 * 0.94
    const coeur = 0.5 - 0.5 * 0.42
    g.addColorStop(0, 'rgba(232, 172, 84, 0)')
    g.addColorStop(bord - 0.02, 'rgba(232, 172, 84, 0)')
    g.addColorStop(bord, `rgba(232, 172, 84, ${reste})`)
    g.addColorStop(coeur - 0.02, `rgba(232, 172, 84, ${reste})`)
    g.addColorStop(coeur, `rgba(255, 244, 221, ${reste})`)
    g.addColorStop(1 - coeur, `rgba(255, 244, 221, ${reste})`)
    g.addColorStop(1 - coeur + 0.02, `rgba(232, 172, 84, ${reste})`)
    g.addColorStop(1 - bord, `rgba(232, 172, 84, ${reste})`)
    g.addColorStop(1 - bord + 0.02, 'rgba(232, 172, 84, 0)')
    g.addColorStop(1, 'rgba(232, 172, 84, 0)')
    ctx.fillStyle = g
    ctx.fillRect(x, 0, 1, H)
  }
  return new THREE.CanvasTexture(toile)
})()

/**
 * LA TÊTE EST UNE CARTE, PAS UN DISQUE.
 *
 * Keko : « tu crois que la tête de la comète pourrait évoquer la forme d'un
 * rectangle, comme si la carte était une comète ? » *C'est la dernière chose
 * qui manquait pour que l'effet dise ce qu'il transporte* — le sillage donnait
 * la trajectoire et la vitesse, mais un disque en tête pouvait être n'importe
 * quoi. Un rectangle au rapport du gabarit, coins arrondis compris, ne peut
 * être qu'une carte.
 *
 * *La toile a le rapport de la carte* : peinte carrée puis étirée, ses coins
 * arrondis seraient des ovales et le rayon ne serait plus celui du gabarit.
 *
 * Un cadre et rien dedans : à une trentaine de pixels, un médaillon ou un
 * second filet tournent en bouillie. **Un symbole ne se règle pas à la taille
 * où on le dessine, mais à celle où on le regarde** — la leçon du médaillon
 * des tas, prise dans l'autre sens.
 */
const COEUR = ((): THREE.CanvasTexture | null => {
  const L = 72
  const H = Math.round(L * RAPPORT)
  const toile = document.createElement('canvas')
  toile.width = L
  toile.height = H
  const ctx = toile.getContext('2d')
  if (ctx === null) return null
  const m = 5
  // Le même rayon que le gabarit : 3 % de la largeur de la carte.
  ctx.beginPath()
  ctx.roundRect(m, m, L - 2 * m, H - 2 * m, L * 0.09)
  ctx.fillStyle = CREME
  ctx.fill()
  ctx.lineWidth = 7
  ctx.strokeStyle = AMBRE
  ctx.stroke()
  return new THREE.CanvasTexture(toile)
})()

/** LES LOSANGES : la forme du médaillon des cartes, pleine et cerclée. */
const LOSANGE = ((): THREE.CanvasTexture | null => {
  const C = 64
  const toile = document.createElement('canvas')
  toile.width = C
  toile.height = C
  const ctx = toile.getContext('2d')
  if (ctx === null) return null
  const m = C / 2
  const r = C * 0.36
  ctx.beginPath()
  ctx.moveTo(m, m - r)
  ctx.lineTo(m + r * 0.62, m)
  ctx.lineTo(m, m + r)
  ctx.lineTo(m - r * 0.62, m)
  ctx.closePath()
  ctx.fillStyle = CREME
  ctx.fill()
  ctx.lineWidth = 5
  ctx.strokeStyle = AMBRE
  ctx.stroke()
  return new THREE.CanvasTexture(toile)
})()

export function TraineeComete({ depuis, vers, debut }: PropsSillage): React.JSX.Element {
  const ruban = useRef<THREE.Mesh>(null)
  const tete = useRef<THREE.Mesh>(null)
  const eclats = useRef<THREE.InstancedMesh>(null)

  const courbe = useMemo(() => courbeEntre(depuis, vers), [depuis, vers])

  /** Le retard et l'écart de chaque losange, tirés une fois. */
  const semis = useMemo(
    () =>
      Array.from({ length: LOSANGES }, (_, i) => ({
        part: 0.3 + (i / LOSANGES) * 0.6,
        ecart: new THREE.Vector3(
          (Math.random() - 0.5) * 0.3,
          (Math.random() - 0.5) * 0.24,
          0,
        ),
        taille: 0.5 + Math.random() * 0.4,
        roulis: Math.random() * Math.PI,
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

  // MÉLANGE NORMAL, PAS ADDITIF : c'est tout ce qui sépare un trait peint d'une
  // lueur. L'additif ne peut pas produire un aplat, il éclaircit toujours ce
  // qu'il recouvre.
  const matiere = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        map: SILLAGE,
        transparent: true,
        depthWrite: false,
        toneMapped: false,
        side: THREE.DoubleSide,
      }),
    [],
  )

  const matiereTete = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        map: COEUR,
        transparent: true,
        depthWrite: false,
        toneMapped: false,
      }),
    [],
  )

  const matiereEclats = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        map: LOSANGE,
        transparent: true,
        depthWrite: false,
        toneMapped: false,
      }),
    [],
  )

  const formeTete = useMemo(() => new THREE.PlaneGeometry(TETE, TETE * RAPPORT), [])
  const formeEclat = useMemo(() => new THREE.PlaneGeometry(TETE * 0.62, TETE * 0.62), [])

  /**
   * DE COMBIEN LA CARTE PENCHE, et c'est propre à chaque traînée : cinq cartes
   * qui filent exactement dans le même axe se lisent comme une machine.
   */
  const penchant = useMemo(() => (Math.random() - 0.5) * 0.5, [])

  const travail = useMemo(
    () => ({
      p: new THREE.Vector3(),
      q: new THREE.Vector3(),
      tangente: new THREE.Vector3(),
      cote: new THREE.Vector3(),
      vue: new THREE.Vector3(0, 0, 1),
      pantin: new THREE.Object3D(),
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
    // avant que quoi que ce soit ne vole.
    const actif = t >= 0 && t < vie
    m.visible = actif
    n.visible = actif
    e.visible = actif
    if (!actif) return

    // LA QUEUE PART APRÈS LA TÊTE, et arrive après elle : c'est ce décalage,
    // et lui seul, qui donne sa longueur au sillage.
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
      // L'EFFILEMENT EST GÉOMÉTRIQUE, pas fait d'opacité : un trait dessiné se
      // termine en pointe, il ne s'évapore pas.
      const large = LARGEUR * (1 - u) * Math.min(1, 0.4 + u * 9)
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
    courbe.getTangent(avantTete, travail.tangente)
    n.position.copy(travail.p)
    // ELLE POINTE OÙ ELLE VA, et elle s'étire dans ce sens : un disque rond ne
    // dit pas de quel côté ça file.
    // ELLE FILE DANS SA LONGUEUR. La hauteur d'un plan est son axe Y local,
    // donc on retranche un quart de tour pour la coucher sur la tangente : la
    // carte fend l'air par sa tranche, et le sillage sort de son bord arrière.
    n.rotation.set(0, 0, Math.atan2(travail.tangente.y, travail.tangente.x) - Math.PI / 2 + penchant)
    // Un rien d'étirement dans le sens de la marche : le contraste de vitesse
    // du reste du jeu, appliqué à une carte lancée.
    n.scale.set(0.93, 1.18, 1)

    const pantin = travail.pantin
    for (let i = 0; i < LOSANGES; i += 1) {
      const g = semis[i]!
      const s = avantTete + (avantQueue - avantTete) * g.part
      courbe.getPoint(s, travail.q)
      const age = borne((avantTete - s) * 3.2)
      pantin.position.set(
        travail.q.x + g.ecart.x * age,
        travail.q.y + g.ecart.y * age,
        travail.q.z,
      )
      pantin.rotation.set(0, 0, g.roulis + age * 1.6)
      pantin.scale.setScalar(g.taille * (1 - 0.4 * age))
      pantin.updateMatrix()
      e.setMatrixAt(i, pantin.matrix)
    }
    e.instanceMatrix.needsUpdate = true

    // ELLE NE S'ALLUME PAS, ELLE EST LÀ. Une montée progressive redonnerait une
    // lueur qui s'installe ; un dessin apparaît d'un coup et ne s'efface qu'à
    // la toute fin, en entrant dans le tas.
    const avance = t / vie
    const sortie = 1 - lisser(borne((avance - 0.72) / 0.28))
    matiere.opacity = sortie
    matiereEclats.opacity = sortie
    // Le coeur reste PLEIN tant qu'il vole : c'est ce que Keko demandait.
    matiereTete.opacity = sortie
    n.scale.multiplyScalar(0.8 + 0.2 * sortie)
  })

  return (
    <group>
      <mesh
        ref={ruban}
        geometry={toile}
        material={matiere}
        frustumCulled={false}
        raycast={() => null}
      />
      <instancedMesh
        ref={eclats}
        args={[formeEclat, matiereEclats, LOSANGES]}
        frustumCulled={false}
        raycast={() => null}
      />
      <mesh
        ref={tete}
        geometry={formeTete}
        material={matiereTete}
        renderOrder={1}
        frustumCulled={false}
        raycast={() => null}
      />
    </group>
  )
}

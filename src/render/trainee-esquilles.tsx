/**
 * PISTE 2 — CE QUI VOLE EST FAIT DE CARTES.
 *
 * *La comète dit « de la lumière passe » ; celle-ci dit « une CARTE passe ».*
 * Le sillage est une poignée d'éclats qui ont la forme, les proportions et la
 * matière d'une carte du jeu — laiton cerclé, coeur sombre, médaillon d'or —
 * en tout petit, qui culbutent le long de l'arc.
 *
 * Ce qu'elle achète, et que les deux autres n'ont pas : **on sait ce qui
 * voyage sans l'avoir appris.** Rien à deviner, rien à associer — la chose
 * qu'on a vue brûler dans la main est la chose qui file vers le tas, en
 * morceaux.
 *
 * Ce qu'elle coûte : **elle est moins lisible en petit.** Un éclat de 0,17 de
 * large fait une vingtaine de pixels sur un téléphone, donc à cette échelle
 * c'est surtout le laiton qu'on lit, pas la forme. La comète, elle, ne dépend
 * d'aucun détail.
 *
 * **Elles culbutent chacune sur son axe**, sinon quatre rectangles qui
 * tournent ensemble se lisent comme un objet rigide. Et **elles se redressent
 * en arrivant** : une carte qui entre dans un tas y entre à plat.
 *
 * *Une seule instance dessinée `ESQUILLES` fois* : quatre matériaux identiques
 * seraient quatre appels de dessin pour le même quadrilatère.
 */
import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { PropsSillage } from './sillage.ts'
import { borne, courbeEntre, DUREE_TRAINEE, lisser } from './sillage.ts'

const ESQUILLES = 7

/** La largeur d'un éclat, en unités de scène : une carte de main fait 1. */
const LARGE = 0.17
const RAPPORT = 1.4

/**
 * LA MATIÈRE D'UN ÉCLAT : une carte réduite à ce qui la fait reconnaître.
 *
 * À vingt pixels, le dos complet ne donnerait qu'une bouillie — *un symbole ne
 * se dessine pas à la taille où on le peint, mais à celle où on le regarde*,
 * la leçon du médaillon des tas. Il reste donc trois traits : le cadre de
 * laiton, le fond de nuit, un éclat d'or au centre.
 */
const ECLAT = ((): THREE.CanvasTexture | null => {
  const L = 72
  const H = Math.round(L * RAPPORT)
  const toile = document.createElement('canvas')
  toile.width = L
  toile.height = H
  const ctx = toile.getContext('2d')
  if (ctx === null) return null
  const r = 8
  const cadre = (m: number): void => {
    ctx.beginPath()
    ctx.roundRect(m, m, L - 2 * m, H - 2 * m, r)
  }
  ctx.fillStyle = '#14161d'
  cadre(5)
  ctx.fill()
  // Le liseré de laiton, avec sa propre lueur : c'est lui qu'on lira en
  // premier, et de loin le seul détail qui survive à la réduction.
  ctx.shadowColor = 'rgba(255, 214, 140, 0.9)'
  ctx.shadowBlur = 9
  ctx.strokeStyle = '#f0d9a2'
  ctx.lineWidth = 6
  cadre(6)
  ctx.stroke()
  ctx.shadowBlur = 0
  ctx.strokeStyle = 'rgba(138, 111, 60, 0.9)'
  ctx.lineWidth = 2
  cadre(14)
  ctx.stroke()
  // Le médaillon : un losange d'or, la forme que porte le dos des cartes.
  ctx.fillStyle = 'rgba(255, 228, 165, 0.95)'
  ctx.beginPath()
  ctx.moveTo(L / 2, H / 2 - 13)
  ctx.lineTo(L / 2 + 9, H / 2)
  ctx.lineTo(L / 2, H / 2 + 13)
  ctx.lineTo(L / 2 - 9, H / 2)
  ctx.closePath()
  ctx.fill()
  return new THREE.CanvasTexture(toile)
})()

export function TraineeEsquilles({ depuis, vers, debut }: PropsSillage): React.JSX.Element {
  const tas = useRef<THREE.InstancedMesh>(null)
  const courbe = useMemo(() => courbeEntre(depuis, vers), [depuis, vers])

  /** Le retard, l'écart et la culbute de chaque éclat : tirés une fois. */
  const semis = useMemo(
    () =>
      Array.from({ length: ESQUILLES }, (_, i) => ({
        retard: (i / ESQUILLES) * 0.4 + Math.random() * 0.14,
        ecart: new THREE.Vector3(
          (Math.random() - 0.5) * 0.5,
          (Math.random() - 0.5) * 0.4,
          (Math.random() - 0.5) * 0.25,
        ),
        axe: new THREE.Vector3(
          Math.random() - 0.5,
          Math.random() - 0.5,
          Math.random() - 0.5,
        ).normalize(),
        tours: 1.4 + Math.random() * 2.2,
        taille: 0.65 + Math.random() * 0.5,
      })),
    [],
  )

  const forme = useMemo(() => new THREE.PlaneGeometry(LARGE, LARGE * RAPPORT), [])
  const matiere = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        map: ECLAT,
        transparent: true,
        depthWrite: false,
        toneMapped: false,
        side: THREE.DoubleSide,
      }),
    [],
  )

  const pantin = useMemo(() => new THREE.Object3D(), [])
  const p = useMemo(() => new THREE.Vector3(), [])

  useFrame((etat) => {
    const m = tas.current
    if (m === null) return
    const t = etat.clock.elapsedTime - debut
    const vie = DUREE_TRAINEE * 1.45
    // Tant qu'elle n'est pas partie, elle n'existe pas : une géométrie laissée
    // à zéro pose ses éclats à l'origine de la scène.
    const actif = t >= 0 && t < vie
    m.visible = actif
    if (!actif) return

    for (let i = 0; i < ESQUILLES; i += 1) {
      const g = semis[i]!
      const a = lisser(borne((t - g.retard * DUREE_TRAINEE) / DUREE_TRAINEE))
      courbe.getPoint(a, p)
      // L'ÉCART SE RÉSORBE : dispersés à l'arrivée, les éclats se liraient
      // comme une explosion au lieu de désigner le tas qui les reçoit.
      const reste = (1 - a) * (1 - a)
      pantin.position.set(
        p.x + g.ecart.x * reste,
        p.y + g.ecart.y * reste,
        p.z + g.ecart.z * reste,
      )
      // ELLE SE REDRESSE EN ARRIVANT : une carte entre dans un tas à plat.
      pantin.quaternion.setFromAxisAngle(g.axe, g.tours * Math.PI * 2 * (1 - a) * (1 - a))
      // Et elle rétrécit en entrant : elle rejoint l'épaisseur du paquet.
      pantin.scale.setScalar(g.taille * (1 - 0.45 * a * a))
      pantin.updateMatrix()
      m.setMatrixAt(i, pantin.matrix)
    }
    m.instanceMatrix.needsUpdate = true

    const avance = t / vie
    matiere.opacity = Math.min(1, avance * 7) * (1 - Math.pow(avance, 2.4))
  })

  return (
    <instancedMesh
      ref={tas}
      args={[forme, matiere, ESQUILLES]}
      frustumCulled={false}
      raycast={() => null}
    />
  )
}

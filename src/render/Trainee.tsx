/**
 * UNE TRAÎNÉE DE LUMIÈRE ENTRE LE PAQUET ET LA MAIN.
 *
 * Keko : « c'est un peu moche que la carte apparaisse direct grande sur la
 * pioche et se déplace dans la main comme ça […] on peut pas réellement faire
 * piocher les cartes une à une, où la carte est représentée par un effet de
 * particules qui vole vers la main, puis la carte apparaît lumineuse et prend
 * son image ensuite ? un truc fluide ».
 *
 * **CE QUI VOLE N'EST PLUS LA CARTE, ET ÇA RÈGLE DEUX DÉFAUTS D'UN COUP.**
 * Faire voyager une carte entière posait deux problèmes qu'on ne pouvait pas
 * traiter séparément :
 *
 * - *elle partait presque à sa taille finale*. Un tas fait 68 % d'une carte de
 *   main : partir de là ne se lit pas comme « on l'a prise dans le paquet »,
 *   juste comme un glissement ;
 * - *elle arrivait DROITE.* On lui donnait la position de sa place dans
 *   l'éventail, mais pas sa rotation — la main se formait donc à plat, puis
 *   basculait d'un coup quand les vraies cartes prenaient le relais.
 *
 * Une traînée n'a ni taille de carte ni inclinaison : *elle ne peut pas être en
 * désaccord avec la main qu'elle rejoint.* La carte, elle, naît directement à
 * sa place — c'est `Carte3D` qui la pose, avec son éventail, comme n'importe
 * quelle autre.
 *
 * **LE POINT EST UNE TEXTURE, pas un carré.** `PointsMaterial` rend des carrés
 * durs sans elle, et un semis de carrés se lit comme du bruit. Un dégradé
 * radial additif donne des braises.
 *
 * **ELLES CONVERGENT.** Chaque particule part avec son écart et le perd en
 * chemin : dispersées à l'arrivée, elles se liraient comme une explosion ;
 * resserrées, elles désignent l'endroit exact où la carte va naître.
 */
import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

/** La durée d'une traînée, en secondes. */
export const DUREE_TRAINEE = 0.34

const NOMBRE = 26

/** Le grain de lumière, peint une fois pour toutes. */
const GRAIN = ((): THREE.CanvasTexture | null => {
  const toile = document.createElement('canvas')
  toile.width = 64
  toile.height = 64
  const ctx = toile.getContext('2d')
  if (ctx === null) return null
  const d = ctx.createRadialGradient(32, 32, 0, 32, 32, 32)
  d.addColorStop(0, 'rgba(255, 246, 222, 1)')
  d.addColorStop(0.35, 'rgba(255, 214, 140, 0.55)')
  d.addColorStop(1, 'rgba(255, 200, 120, 0)')
  ctx.fillStyle = d
  ctx.fillRect(0, 0, 64, 64)
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

export function Trainee({ depuis, vers, debut }: Props): React.JSX.Element {
  const points = useRef<THREE.Points>(null)

  /** Le décalage et l'écart de chaque grain : tirés une fois, jamais rejoués. */
  const semis = useMemo(
    () =>
      Array.from({ length: NOMBRE }, () => ({
        retard: Math.random() * 0.34,
        ecart: [
          (Math.random() - 0.5) * 1.5,
          (Math.random() - 0.5) * 1.1,
          (Math.random() - 0.5) * 0.5,
        ] as [number, number, number],
        // Une bosse propre à chaque grain : sans elle ils suivent tous la même
        // corde et la traînée se lit comme un trait.
        bosse: 0.25 + Math.random() * 0.75,
      })),
    [],
  )

  const geometrie = useMemo(() => {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(NOMBRE * 3), 3))
    return g
  }, [])

  const materiau = useMemo(
    () =>
      new THREE.PointsMaterial({
        map: GRAIN,
        size: 0.26,
        transparent: true,
        depthWrite: false,
        toneMapped: false,
        blending: THREE.AdditiveBlending,
      }),
    [],
  )

  useFrame((etat) => {
    const p = points.current
    if (p === null) return
    const t = etat.clock.elapsedTime - debut
    const tableau = geometrie.getAttribute('position') as THREE.BufferAttribute
    let vivantes = 0

    for (let i = 0; i < NOMBRE; i++) {
      const g = semis[i]!
      const k = Math.max(0, Math.min(1, (t - g.retard * DUREE_TRAINEE) / DUREE_TRAINEE))
      if (k > 0 && k < 1) vivantes++
      const a = lisser(k)
      // L'ÉCART SE RÉSORBE : au départ les grains s'éparpillent, à l'arrivée
      // ils se resserrent sur le point où la carte va naître.
      const reste = (1 - a) * (1 - a)
      const arc = Math.sin(a * Math.PI) * g.bosse
      tableau.setXYZ(
        i,
        depuis[0] + (vers[0] - depuis[0]) * a + g.ecart[0] * reste,
        depuis[1] + (vers[1] - depuis[1]) * a + g.ecart[1] * reste + arc * 0.5,
        depuis[2] + (vers[2] - depuis[2]) * a + g.ecart[2] * reste + arc * 0.2,
      )
    }
    tableau.needsUpdate = true

    // La traînée s'allume vite et s'éteint en arrivant : ce qu'on doit voir,
    // c'est le trajet, pas les grains posés au bout.
    const avance = Math.max(0, Math.min(1, t / (DUREE_TRAINEE * 1.34)))
    materiau.opacity = Math.min(1, avance * 4) * (1 - avance * avance)
    materiau.size = 0.3 - 0.14 * avance
    p.visible = vivantes > 0 || avance < 1
  })

  return <points ref={points} geometry={geometrie} material={materiau} raycast={() => null} />
}

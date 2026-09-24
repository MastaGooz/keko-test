/**
 * LA SECOUSSE D'ÉCRAN, à chaque impact.
 *
 * En 2D elle était un `transform` sur `.app` — avec les deux pièges connus :
 * il déplace les enfants en `position: fixed` et crée un contexte
 * d'empilement. Ici c'est la CAMÉRA qui tremble : rien dans le DOM ne bouge,
 * et les étiquettes ancrées suivent d'elles-mêmes, puisqu'elles sont
 * projetées à chaque image.
 *
 * Sa force est en unités de scène, donc une fraction du champ visible, pas
 * des pixels : la même animation doit raconter la même chose sur un
 * téléphone et sur un écran de PC — la leçon de la secousse 2D, mesurée à
 * 51 % de la frappe sur le petit écran contre 11 % sur le grand.
 */
import { useFrame } from '@react-three/fiber'
import { lireHorloge } from './horloge.tsx'

const DUREE = 0.36

let depuis = -1
let amplitude = 0

/** Déclenche une secousse : `forte` pour un coup encaissé, sinon un coup porté. */
export function secouer(force: 'normale' | 'forte' = 'normale'): void {
  depuis = lireHorloge()
  amplitude = force === 'forte' ? 0.11 : 0.06
}

export function Secousse(): null {
  useFrame((etat) => {
    const dt = etat.clock.elapsedTime - depuis
    if (depuis < 0 || dt < 0 || dt > DUREE) {
      etat.camera.position.x = 0
      etat.camera.position.y = 0
      return
    }
    const k = 1 - dt / DUREE
    etat.camera.position.x = Math.sin(dt * 70) * amplitude * k
    etat.camera.position.y = Math.cos(dt * 52) * amplitude * 0.55 * k
  })
  return null
}

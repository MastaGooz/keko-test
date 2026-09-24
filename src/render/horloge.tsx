/**
 * L'HORLOGE DE LA SCÈNE, LISIBLE DEPUIS L'EXTÉRIEUR.
 *
 * Les animations se calent sur `clock.elapsedTime` de R3F : c'est la seule
 * horloge qui s'arrête quand l'onglet est caché, donc la seule qui ne fasse
 * pas sauter un coup en plein vol au retour. Mais elle ne se lit que DANS le
 * canvas (`useThree`), et c'est la scène, dehors, qui décide quand un coup
 * part. Ce composant la recopie à chaque image dans une variable de module.
 */
import { useFrame } from '@react-three/fiber'

let maintenant = 0

export function Horloge(): null {
  useFrame((etat) => {
    maintenant = etat.clock.elapsedTime
  })
  return null
}

/** L'instant présent, en secondes d'horloge de scène. */
export function lireHorloge(): number {
  return maintenant
}

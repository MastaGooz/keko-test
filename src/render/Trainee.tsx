/**
 * CE QUI VOLE ENTRE LA MAIN ET LES TAS — trois pistes, une à choisir.
 *
 * Le premier essai était un semis de grains transparents ; Keko : « je trouve
 * le truc un peu bateau ». Il a demandé à voir les autres pistes avant de
 * trancher, donc les trois cohabitent derrière une URL :
 *
 * | | `?r3f&sillage=…` | ce qu'elle raconte |
 * |---|---|---|
 * | comète (défaut) | `comete` | de la lumière file, avec une tête et un sillage |
 * | éclats de carte | `esquilles` | **une carte** file, en morceaux qui culbutent |
 * | sceaux | `glyphes` | rien ne file : le trajet **s'écrit** d'un bout à l'autre |
 *
 * *Elles partagent la durée et la courbe* (`sillage.ts`) et rien d'autre : la
 * scène cale les chocs des tas et la naissance des cartes sur cette durée, donc
 * changer de piste ne doit jamais décaler le reste du cycle.
 *
 * **La piste se lit ici, une fois pour toutes**, pas dans la scène : c'est un
 * banc d'essai, et le jour où Keko tranche il ne restera qu'un import à garder.
 */
import { SILLAGE_URL } from './sillage.ts'
import type { PropsSillage } from './sillage.ts'
import { TraineeComete } from './trainee-comete.tsx'
import { TraineeEsquilles } from './trainee-esquilles.tsx'
import { TraineeGlyphes } from './trainee-glyphes.tsx'

export { DUREE_TRAINEE } from './sillage.ts'

const PISTE = SILLAGE_URL()

export function Trainee(props: PropsSillage): React.JSX.Element {
  if (PISTE === 'esquilles') return <TraineeEsquilles {...props} />
  if (PISTE === 'glyphes') return <TraineeGlyphes {...props} />
  return <TraineeComete {...props} />
}

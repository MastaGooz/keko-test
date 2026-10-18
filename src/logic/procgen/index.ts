/**
 * LE GÉNÉRATEUR D'ICÔNES — pur : un identifiant entre, un dessin sort.
 *
 * Les familles : un vaisseau de combat ou de minage, une station, une
 * planète, un astéroïde. La seed est dérivée de l'id
 * (`seedDe`), donc *même id, même visuel, toujours*, sur n'importe quel
 * appareil. C'est `ui/procgen/svg.ts` qui rend le dessin.
 */
import type { Dessin, Famille } from './types.ts'
import { genererVaisseau } from './vaisseau.ts'
import { genererPlanete } from './planete.ts'
import { genererAsteroide } from './asteroide.ts'
import { genererStation } from './station.ts'
import { createRng } from '../rng.ts'

export { BOITE, FAMILLES, type Clip, type Dessin, type Famille, type Forme } from './types.ts'
import { seedDe } from './seed.ts'
export { seedDe }

export function genererDessin(famille: Famille, id: string): Dessin {
  if (famille === 'combat' || famille === 'minage') return genererVaisseau(id, famille)
  if (famille === 'vaisseau') {
    // Un vaisseau quelconque : la classe est tirée de l'id, hors de la suite
    // du dessin (qui repart de la seed).
    return genererVaisseau(id, createRng(seedDe(id) ^ 0x5bd1e995).next() < 0.6 ? 'combat' : 'minage')
  }
  if (famille === 'station') return genererStation(id)
  if (famille === 'planete') return genererPlanete(id)
  return genererAsteroide(id)
}

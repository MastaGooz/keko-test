/**
 * LE GÉNÉRATEUR D'ICÔNES — pur : un identifiant entre, un dessin sort.
 *
 * Trois familles, un vaisseau, une planète ou un astéroïde. La seed est dérivée de l'id
 * (`seedDe`), donc *même id, même visuel, toujours*, sur n'importe quel
 * appareil. C'est `ui/procgen/svg.ts` qui rend le dessin.
 */
import type { Dessin, Famille } from './types.ts'
import { genererVaisseau } from './vaisseau.ts'
import { genererPlanete } from './planete.ts'
import { genererAsteroide } from './asteroide.ts'

export { BOITE, FAMILLES, type Clip, type Dessin, type Famille, type Forme } from './types.ts'
export { seedDe } from './seed.ts'

export function genererDessin(famille: Famille, id: string): Dessin {
  if (famille === 'vaisseau') return genererVaisseau(id)
  if (famille === 'planete') return genererPlanete(id)
  return genererAsteroide(id)
}

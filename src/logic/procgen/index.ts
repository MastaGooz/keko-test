/**
 * LE GÉNÉRATEUR D'ICÔNES — pur : un identifiant entre, un dessin sort.
 *
 * Deux familles, un vaisseau ou une planète. La seed est dérivée de l'id
 * (`seedDe`), donc *même id, même visuel, toujours*, sur n'importe quel
 * appareil. C'est `ui/procgen/svg.ts` qui rend le dessin.
 */
import type { Dessin, Famille } from './types.ts'
import { genererVaisseau } from './vaisseau.ts'
import { genererPlanete } from './planete.ts'

export { BOITE, FAMILLES, type Clip, type Dessin, type Famille, type Forme } from './types.ts'
export { seedDe } from './seed.ts'

export function genererDessin(famille: Famille, id: string): Dessin {
  return famille === 'vaisseau' ? genererVaisseau(id) : genererPlanete(id)
}

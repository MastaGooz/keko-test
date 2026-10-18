/**
 * LE GÉNÉRATEUR D'ICÔNES — pur : un identifiant entre, un dessin sort.
 *
 * Les familles : un vaisseau de combat ou de minage, une station, un vaisseau
 * alien ou biologique, une planète, un astéroïde. La seed est dérivée de l'id
 * (`seedDe`), donc *même id, même visuel, toujours*, sur n'importe quel
 * appareil. C'est `ui/procgen/svg.ts` qui rend le dessin.
 */
import type { Dessin, Famille, Race } from './types.ts'
import { genererVaisseau } from './vaisseau.ts'
import { genererPlanete } from './planete.ts'
import { genererAsteroide } from './asteroide.ts'
import { genererStation } from './station.ts'
import { genererAlien } from './alien.ts'
import { genererBio } from './bio.ts'
import { dessinerOrigami, genererOrigami } from './origami.ts'
import { genererGribouillis } from './gribouillis.ts'
import { createRng } from '../rng.ts'

export { BOITE, FAMILLES, RACES, ROLES, type Clip, type Dessin, type Famille, type Forme, type Race } from './types.ts'
import { seedDe } from './seed.ts'
export { seedDe }
export { dessinerOrigami, dureeTotale, genererOrigami, type Modele } from './origami.ts'

export function genererDessin(famille: Famille, id: string, race: Race = 'humain'): Dessin {
  if (famille === 'alien') return genererAlien(id, 'combat')
  if (famille === 'vaisseau') {
    // Un vaisseau quelconque : le rôle est tiré de l'id, hors de la suite du
    // dessin (qui repart de la seed).
    famille = createRng(seedDe(id) ^ 0x5bd1e995).next() < 0.6 ? 'combat' : 'minage'
  }
  if (famille === 'combat' || famille === 'minage' || famille === 'station') {
    if (race === 'alien') return genererAlien(id, famille)
    if (race === 'biologique') return genererBio(id, famille)
  }
  if (famille === 'combat' || famille === 'minage') return genererVaisseau(id, famille)
  if (famille === 'station') return genererStation(id)
  if (famille === 'planete') return genererPlanete(id)
  if (famille === 'origami') return dessinerOrigami(genererOrigami(id), 1)
  if (famille === 'gribouillis') return genererGribouillis(id)
  return genererAsteroide(id)
}

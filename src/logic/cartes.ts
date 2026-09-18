/**
 * Contenu du prototype : deck de départ et ennemis. Données pures.
 * Les chiffres sont là pour être bousculés après le premier playtest.
 */
import type { Carte, Ennemi } from './combat.ts'

type Modele = Omit<Carte, 'id'>

/**
 * Rendement croissant avec la lenteur : 3,0 / 3,5 / 4,0 dégâts par temps.
 * Le gros coup paie mieux, mais il laisse frapper avant de tomber.
 */
const DAGUE: Modele = { nom: 'Dague', type: 'combat', vitesse: 1, degats: 3 }
const TAILLADE: Modele = { nom: 'Taillade', type: 'combat', vitesse: 2, degats: 7 }
const MOULINET: Modele = { nom: 'Moulinet', type: 'combat', vitesse: 4, degats: 16 }

export function deckDeDepart(): Carte[] {
  return [
    ...exemplaires(5, DAGUE, 'dague'),
    ...exemplaires(3, TAILLADE, 'taillade'),
    ...exemplaires(2, MOULINET, 'moulinet'),
  ]
}

/** Un trésor en tant que carte : inerte en combat, il n'occupe qu'une place. */
export function carteTresor(id: string, nom: string): Carte {
  return { id, nom, type: 'tresor', vitesse: 0, degats: 0 }
}

/**
 * Trois rythmes bien distincts, pour sentir ce que change la période.
 * `compteur` est l'ouverture : le Roquet frappe presque tout de suite, sinon
 * il meurt avant d'avoir existé et son rythme ne se sent jamais.
 */
export const ROQUET: Ennemi = { nom: 'Roquet', pv: 18, pvMax: 18, degats: 4, periode: 3, compteur: 1 }
export const GARDE: Ennemi = { nom: 'Garde', pv: 28, pvMax: 28, degats: 8, periode: 5, compteur: 3 }
export const BRUTE: Ennemi = { nom: 'Brute', pv: 40, pvMax: 40, degats: 14, periode: 8, compteur: 6 }

export const ENNEMIS: Ennemi[] = [ROQUET, GARDE, BRUTE]

function exemplaires(nombre: number, modele: Modele, prefixe: string): Carte[] {
  return Array.from({ length: nombre }, (_, i) => ({ ...modele, id: `${prefixe}-${i + 1}` }))
}

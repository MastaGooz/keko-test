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
 * Calibrés par simulation (400+ combats par point) pour que la cupidité se
 * paie : avec le deck pur on gagne ~88 %, à 4 trésors on tombe à ~45 %.
 * Avant ce réglage les trois se gagnaient à 100 % quoi qu'on joue — aucune
 * décision ne comptait, donc rien n'était lisible.
 *
 * `compteur` est l'ouverture, distincte de la période : sans elle le Roquet
 * meurt avant d'avoir frappé et son rythme ne se sent jamais.
 *
 * Attention en bougeant ces chiffres : la marge est un rasoir. Le Garde passe
 * de 89 % à 43 % de victoires entre 51 et 53 PV. Un combat est une course, et
 * une course n'a pas de pente douce.
 */
export const ROQUET: Ennemi = { nom: 'Roquet', pv: 36, pvMax: 36, degats: 5, periode: 2, compteur: 1 }
export const GARDE: Ennemi = { nom: 'Garde', pv: 51, pvMax: 51, degats: 9, periode: 4, compteur: 2 }
export const BRUTE: Ennemi = { nom: 'Brute', pv: 54, pvMax: 54, degats: 12, periode: 7, compteur: 4 }

export const ENNEMIS: Ennemi[] = [ROQUET, GARDE, BRUTE]

function exemplaires(nombre: number, modele: Modele, prefixe: string): Carte[] {
  return Array.from({ length: nombre }, (_, i) => ({ ...modele, id: `${prefixe}-${i + 1}` }))
}

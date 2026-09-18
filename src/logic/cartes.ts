/**
 * Contenu du prototype : deck de départ et groupes d'ennemis. Données pures.
 * Les chiffres sont là pour être bousculés après le playtest.
 */
import type { Carte, Ennemi } from './combat.ts'
import type { Rng } from './rng.ts'
import { randomInt } from './rng.ts'

type Modele = Omit<Carte, 'id'>

/**
 * Rendement croissant avec le coût : 3,0 / 3,5 / 4,0 dégâts par énergie.
 * Le gros coup paie mieux, mais il mange presque tout le tour.
 */
const DAGUE: Modele = { nom: 'Dague', type: 'combat', cout: 1, degats: 3 }
const TAILLADE: Modele = { nom: 'Taillade', type: 'combat', cout: 2, degats: 7 }
const MOULINET: Modele = { nom: 'Moulinet', type: 'combat', cout: 4, degats: 16 }

export function deckDeDepart(): Carte[] {
  return [
    ...exemplaires(5, DAGUE, 'dague'),
    ...exemplaires(3, TAILLADE, 'taillade'),
    ...exemplaires(2, MOULINET, 'moulinet'),
  ]
}

/** Un trésor en tant que carte : inerte en combat, il n'occupe qu'une place. */
export function carteTresor(id: string, nom: string, valeur: number): Carte {
  return { id, nom, type: 'tresor', cout: 0, degats: 0, valeur }
}

/**
 * Des noms plutôt que « Trésor 1 » : une main pleine de babioles doit se lire
 * comme du butin encombrant, pas comme du remplissage. C'est la sensation
 * qu'on teste, autant qu'elle ait une chance d'exister.
 */
/**
 * Valeurs très inégales, et volontairement : à poids identique, le joueur
 * doit préférer peu de gros trésors à beaucoup de petits. Un Camée occupe
 * exactement la même place qu'une Couronne pour cinq fois moins d'or.
 */
const BUTIN: [string, number][] = [
  ['Couronne', 240], ['Diadème', 210], ['Sceptre', 185], ['Reliquaire', 160],
  ['Ostensoir', 140], ['Calice', 120], ['Cassette', 105], ['Idole', 90],
  ['Médaillon', 75], ['Torque', 65], ['Aiguière', 55], ['Camée', 45],
]

/** `nombre` trésors tirés dans le butin, sans doublon tant qu'il y en a. */
export function tresorsEmportes(nombre: number, rng: Rng): Carte[] {
  const restants = [...BUTIN]
  return Array.from({ length: nombre }, (_, i) => {
    const [nom, valeur] = restants.length > 0
      ? restants.splice(randomInt(rng, 0, restants.length - 1), 1)[0]!
      : BUTIN[i % BUTIN.length]!
    return carteTresor(`tresor-${i + 1}`, nom, valeur)
  })
}

/** Le deck emporté dans le donjon : les cartes de combat plus le butin ramassé. */
export function deckAvecTresors(nombre: number, rng: Rng): Carte[] {
  return [...deckDeDepart(), ...tresorsEmportes(nombre, rng)]
}

/**
 * Groupes calibrés par simulation. Deux règles tenues :
 *
 * 1. La pression totale reste comparable d'un groupe à l'autre — c'est le
 *    nombre de corps qu'on fait varier, pas la difficulté brute.
 * 2. Les PV d'un corps restent à portée des cartes. Un groupe de gros sacs
 *    de PV ramène au rendement pur : sans achèvement possible, le Moulinet
 *    redevient le seul choix et le multi-cibles ne décide plus rien.
 *
 * `periode` se compte en TOURS : 1 = frappe chaque tour, 2 = un tour sur deux
 * en frappant plus fort. `compteur` est l'ouverture.
 */
export type Groupe = { nom: string; ennemis: Ennemi[] }

function ennemi(nom: string, pv: number, degats: number, periode: number, compteur: number): Ennemi {
  return { nom, pv, pvMax: pv, degats, periode, compteur }
}

export const GROUPES: Groupe[] = [
  {
    nom: 'Le Garde',
    ennemis: [ennemi('Garde', 70, 9, 1, 1)],
  },
  {
    nom: 'Deux roquets',
    ennemis: [ennemi('Roquet', 36, 5, 1, 1), ennemi('Cabot', 34, 5, 1, 1)],
  },
  {
    nom: 'La meute',
    ennemis: [
      ennemi('Meneur', 25, 4, 1, 1),
      ennemi('Suiveur', 23, 4, 1, 1),
      ennemi('Traînard', 23, 7, 2, 2),
    ],
  },
]

function exemplaires(nombre: number, modele: Modele, prefixe: string): Carte[] {
  return Array.from({ length: nombre }, (_, i) => ({ ...modele, id: `${prefixe}-${i + 1}` }))
}

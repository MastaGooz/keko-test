/**
 * Les armes, et le deck qu'elles donnent.
 *
 * Règle centrale du jeu : **c'est l'équipement qui fait le deck**. Le
 * personnage est générique, une arme apporte son set de cartes, et la rareté
 * fait la force du set.
 *
 * Et une conséquence qu'il ne faut pas perdre de vue en ajoutant de
 * l'équipement : **équiper plus n'est pas mieux**. Chaque carte ajoutée fait
 * tirer les bonnes moins souvent. La taille du deck est une ressource.
 *
 * Limite du moteur, à lever avant la deuxième arme : une carte n'a qu'un coût
 * et des dégâts. Deux armes ne peuvent donc différer que par leur courbe
 * coût/dégâts — suffisant pour une arme de référence, trop pauvre pour créer
 * une identité.
 */
import type { Carte } from './combat.ts'

export type Rarete = 'commune' | 'rare' | 'epique'

/** Un modèle de carte : tout sauf l'identifiant d'exemplaire. */
export type Modele = Omit<Carte, 'id'>

export type Arme = {
  id: string
  nom: string
  rarete: Rarete
  /** Nombre de mains occupées. Une arme à deux mains prend les deux slots. */
  mains: 1 | 2
  /** Son set : le deck qu'elle apporte, modèle par modèle. */
  set: { modele: Modele; nombre: number }[]
}

const ESTOC: Modele = { nom: 'Estoc', type: 'combat', cout: 1, degats: 3 }
const TAILLADE: Modele = { nom: 'Taillade', type: 'combat', cout: 2, degats: 6 }
const MOULINET: Modele = { nom: 'Moulinet', type: 'combat', cout: 4, degats: 14 }

/**
 * Le Glaive : l'arme commune, gratuite, toujours disponible. C'est le
 * garde-fou contre la spirale de la mort — on ne peut jamais se retrouver
 * sans rien à emporter.
 *
 * Elle est délibérément **compétente et sans relief** : c'est la référence à
 * laquelle toutes les autres se compareront. Une arme de départ excitante
 * rendrait les suivantes fades.
 *
 * Rendement croissant avec le coût (3,0 / 3,0 / 3,5 dégâts par énergie) : le
 * gros coup paie un peu mieux mais mange presque tout le tour.
 */
export const GLAIVE: Arme = {
  id: 'glaive',
  nom: 'Glaive',
  rarete: 'commune',
  mains: 1,
  set: [
    { modele: ESTOC, nombre: 5 },
    { modele: TAILLADE, nombre: 3 },
    { modele: MOULINET, nombre: 2 },
  ],
}

/** L'arme qu'on ne peut pas perdre : il y en a toujours une au râtelier. */
export const ARME_GRATUITE = GLAIVE

/**
 * Le deck emporté, somme des sets de tout ce qui est équipé. Les identifiants
 * portent l'arme d'origine : deux armes peuvent donner la même carte sans que
 * leurs exemplaires se confondent.
 */
export function deckDeLEquipement(equipement: Arme[]): Carte[] {
  return equipement.flatMap((arme) =>
    arme.set.flatMap(({ modele, nombre }) =>
      Array.from({ length: nombre }, (_, i) => ({
        ...modele,
        id: `${arme.id}-${modele.nom.toLowerCase()}-${i + 1}`,
      })),
    ),
  )
}

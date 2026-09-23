/**
 * LE PONT ENTRE LES RÈGLES ET LA SCÈNE 3D.
 *
 * `logic/` ne connaît ni le DOM ni three, et c'est ce qui a permis de changer
 * de moteur sans toucher aux règles. Ce module est le seul endroit qui traduit
 * l'un vers l'autre — l'équivalent de `main.ts` pour le jeu 2D.
 */
import type { Carte, EtatCombat } from '../logic/combat.ts'
import { CONFIG_DEFAUT, creerCombat } from '../logic/combat.ts'
import { createRng } from '../logic/rng.ts'
import { ennemisPourProfondeur } from '../logic/cartes.ts'
import { REGLAGE_DEFAUT } from '../logic/descente.ts'
import { deckEmporte, creerHub } from '../logic/hub.ts'
import { lignes, nature, sansBalises } from '../ui/texte-carte.ts'
import type { CarteAPeindre } from './texture-carte.ts'

/**
 * Une carte du modèle, telle qu'on la peint.
 *
 * Le texte vient du module partagé (`ui/texte-carte.ts`) : c'est le même que
 * celui de la carte 2D, aux balises près — un canvas ne sait pas les lire.
 */
export function aPeindre(carte: Carte): CarteAPeindre {
  return {
    id: carte.id,
    nom: carte.nom,
    cout: carte.cout,
    effet: lignes(carte).map(sansBalises),
    type: nature(carte),
  }
}

/**
 * Un combat prêt à jouer, avec le chargement gratuit.
 *
 * On part du hub plutôt que d'un deck écrit à la main : c'est la règle du jeu
 * — *le deck est la somme de ce qu'on porte* — et ça garantit que la scène 3D
 * montre ce que le joueur emporterait vraiment.
 */
export function combatDeDepart(seed: number): { combat: EtatCombat; rng: ReturnType<typeof createRng> } {
  const rng = createRng(seed)
  const hub = creerHub()
  const deck = deckEmporte(hub.chargement)
  // LES PV SONT CEUX DE LA DESCENTE, pas ceux du combat isolé. `CONFIG_DEFAUT`
  // en donne 30, calibrés pour un duel unique ; les groupes, eux, sont calibrés
  // pour une run de six paliers à 90 PV. Les mélanger rendait le premier combat
  // injouable — *un chiffre de règle ne se lit pas hors de son barème.*
  const combat = creerCombat(deck, ennemisPourProfondeur(1, 6, rng), rng, {
    ...CONFIG_DEFAUT,
    pvMax: REGLAGE_DEFAUT.pvMax,
  })
  return { combat, rng }
}

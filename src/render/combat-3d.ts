/**
 * LE PONT ENTRE LES RÈGLES ET LA SCÈNE 3D.
 *
 * `logic/` ne connaît ni le DOM ni three, et c'est ce qui a permis de changer
 * de moteur sans toucher aux règles. Ce module est le seul endroit qui traduit
 * l'un vers l'autre — l'équivalent de `main.ts` pour le jeu 2D.
 */
import type { Carte } from '../logic/combat.ts'
import { createRng } from '../logic/rng.ts'
import type { Descente } from '../logic/descente.ts'
import { commencerDescente } from '../logic/descente.ts'
import { creerHub, equipement } from '../logic/hub.ts'
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
 * UNE DESCENTE PRÊTE À JOUER, avec le chargement gratuit.
 *
 * On part du hub plutôt que d'un deck écrit à la main : c'est la règle du jeu
 * — *le deck est la somme de ce qu'on porte* — et ça garantit que la scène 3D
 * montre ce que le joueur emporterait vraiment.
 *
 * C'est `commencerDescente` qui monte le combat, pas nous : il sait quels PV
 * donner (ceux de la run, 90, et non les 30 du duel isolé de `CONFIG_DEFAUT`)
 * et comment adoucir le premier palier. *Un chiffre de règle ne se lit pas
 * hors de son barème*, et la meilleure façon de ne pas s'y tromper est de ne
 * pas le recopier.
 */
export function descenteDeDepart(seed: number): { descente: Descente; rng: ReturnType<typeof createRng> } {
  const rng = createRng(seed)
  const hub = creerHub()
  const descente = commencerDescente(rng, undefined, equipement(hub.chargement), hub.chargement.pile)
  return { descente, rng }
}

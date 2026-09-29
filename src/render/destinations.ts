/**
 * LES DESTINATIONS DU HUB — ce que le rail propose.
 *
 * Tranché par Keko après avoir vu la grille de portraits : « pas fou comme
 * interface finalement le hub, il faudrait un truc plus professionnel ».
 * *Un écran qui ne sert qu'à en choisir un autre est un écran de trop* : la
 * page de place ne portait aucun état, aucun chiffre, aucune décision, et
 * aucun habillage ne sauve un écran qui n'a rien à dire.
 *
 * Le rail est la forme des jeux d'extraction — une barre de destinations
 * permanente, et le lieu choisi occupe tout le reste de l'écran. **On arrive
 * donc directement dans l'armurerie**, et le vide disparaît parce que la page
 * vide disparaît.
 *
 * **LE COFFRE EST UNE DESTINATION, PLUS UNE COLONNE DE L'ARMURERIE.** Tranché
 * par Keko : « l'armurerie sert à équiper, je pense qu'on se prend la tête à
 * fusionner armurerie et coffre… on a un onglet armurerie avec le panneau
 * équipement, et un onglet coffre avec le coffre actuel ».
 *
 * *Deux meubles côte à côte, c'était deux moitiés d'écran et aucune des deux à
 * sa taille* : les cartes du chargement étaient bornées par un panneau large
 * d'un tiers d'écran, et le coffre n'en montrait que quinze. Séparés, chacun
 * prend toute la place — **et rien ne meurt** : les onglets, le bouton de
 * rangement, la réorganisation et les piles restent tels quels dans le coffre.
 *
 * Ce que ça change, et c'est le coeur de la demande de Keko : **on n'équipe
 * plus en glissant d'un meuble à l'autre, on tape un slot et on choisit.** Le
 * geste n'a plus à traverser deux panneaux, donc les deux panneaux n'ont plus
 * à être à l'écran en même temps.
 *
 * **Huit entrées, deux ouvertes.** C'est le banc d'essai que Keko voulait —
 * « voir ce que ça donne si on avait 8 PNJ différents » — et le rail le rend
 * gratuit : les six autres sont des places tenues, éteintes, qui disent ce que
 * le hub aura sans rien promettre. *Six métiers inventés pour juger une mise
 * en page, ce serait trancher du design en passant.*
 */

/** Le lieu qu'une destination ouvre. */
export type Lieu = 'armurerie' | 'coffre'

export type Destination = {
  /** Ce qui s'affiche dans le rail. */
  nom: string
  /** Le lieu qu'elle ouvre, quand elle en ouvre un. */
  lieu?: Lieu
  /** Est-ce que ce lieu existe ? Les autres sont des places tenues. */
  ouvert: boolean
}

export const DESTINATIONS: readonly Destination[] = [
  { nom: 'Armurerie', lieu: 'armurerie', ouvert: true },
  { nom: 'Coffre', lieu: 'coffre', ouvert: true },
  { nom: 'Bientôt', ouvert: false },
  { nom: 'Bientôt', ouvert: false },
  { nom: 'Bientôt', ouvert: false },
  { nom: 'Bientôt', ouvert: false },
  { nom: 'Bientôt', ouvert: false },
  { nom: 'Bientôt', ouvert: false },
]

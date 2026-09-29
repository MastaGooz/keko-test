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
 * **Huit entrées, une seule ouverte.** C'est le banc d'essai que Keko voulait —
 * « voir ce que ça donne si on avait 8 PNJ différents » — et le rail le rend
 * gratuit : les sept autres sont des places tenues, éteintes, qui disent ce que
 * le hub aura sans rien promettre. *Sept métiers inventés pour juger une mise
 * en page, ce serait trancher du design en passant.*
 */
export type Destination = {
  /** Ce qui s'affiche dans le rail. */
  nom: string
  /** Est-ce que ce lieu existe ? Les autres sont des places tenues. */
  ouvert: boolean
}

export const DESTINATIONS: readonly Destination[] = [
  { nom: 'Armurerie', ouvert: true },
  { nom: 'Bientôt', ouvert: false },
  { nom: 'Bientôt', ouvert: false },
  { nom: 'Bientôt', ouvert: false },
  { nom: 'Bientôt', ouvert: false },
  { nom: 'Bientôt', ouvert: false },
  { nom: 'Bientôt', ouvert: false },
  { nom: 'Bientôt', ouvert: false },
]

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
/**
 * LES DEUX LIEUX QUI EXISTENT.
 *
 * **« Expédition » est né des boutons.** Ils vivaient au bas du rail, sous les
 * destinations — Keko : « les boutons sont collés c'est moche et les catégories
 * du hub sont toujours peu lisibles sur téléphone. Et si on faisait une
 * catégorie expédition dans le hub qui permette de lancer la partie, où on
 * mettrait les deux boutons ? Comme ça on garde la colonne des catégories
 * uniquement pour les catégories. »
 *
 * *C'est la bonne réponse, et elle règle les trois griefs d'un coup* : deux
 * boutons dans une bande de quatre-vingts pixels ne peuvent pas ne pas être
 * collés, et la place qu'ils prenaient est exactement celle qui manquait aux
 * huit entrées. **Une colonne de destinations ne porte que des destinations** —
 * quitter le hub en est une, pas une exception posée en bas.
 */
export type LieuHub = 'armurerie' | 'expedition'

export type Destination = {
  /** Ce qui s'affiche dans le rail. */
  nom: string
  /** Est-ce que ce lieu existe ? Les autres sont des places tenues. */
  ouvert: boolean
  /** Le lieu qu'elle ouvre, quand elle en ouvre un. */
  lieu?: LieuHub
  /**
   * CE QUI COMPTE LE PLUS, et une seule entrée le porte.
   *
   * Demandé par Keko : « il faudrait que l'onglet expédition soit le premier
   * et qu'il ait un style légèrement différent pour que le joueur comprenne
   * que c'est le plus important. » *Une liste sans hiérarchie se lit de haut
   * en bas dans l'ordre où elle est écrite* — donc l'ordre le dit d'abord, et
   * l'accent le confirme.
   */
  majeur?: boolean
}

export const DESTINATIONS: readonly Destination[] = [
  { nom: 'Expédition', ouvert: true, lieu: 'expedition', majeur: true },
  { nom: 'Armurerie', ouvert: true, lieu: 'armurerie' },
  { nom: 'Bientôt', ouvert: false },
  { nom: 'Bientôt', ouvert: false },
  { nom: 'Bientôt', ouvert: false },
  { nom: 'Bientôt', ouvert: false },
  { nom: 'Bientôt', ouvert: false },
  { nom: 'Bientôt', ouvert: false },
]

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
export type LieuHub =
  | 'armurerie'
  | 'expedition'
  | 'marche'
  | 'charognard'
  | 'forgeron'
  | 'couturiere'
  | 'enchanteresse'
  | 'alchimiste'
  | 'taverne'
  | 'cartographe'
  | 'infirmerie'
  | 'chapelle'
  | 'mercenaires'
  | 'bibliotheque'

export type Destination = {
  /** Ce qui s'affiche dans le rail. */
  nom: string
  /**
   * Est-ce que ce lieu existe ? Les autres sont des places tenues.
   *
   * **ELLES SONT TOUTES OUVERTES**, et chacune mène à son propre lieu — vide,
   * mais nommé et encadré. Keko : « on peut mettre un écran placeholder pour
   * chaque catégorie du hub (juste le titre, encadré mais vide) pour tester la
   * navigation ? » *Six entrées sur huit éteintes, ça ne se navigue pas* : on
   * jugeait un rail à moitié mort plutôt que le hub qu'il sera.
   */
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
  /**
   * LE FICHIER DE SON EMBLÈME, dans `public/`, sans extension.
   *
   * **Une place tenue n'en nomme pas**, et le rendu lui prête celui de
   * l'armurerie le temps de juger — Keko : « mets l'armurerie dans tous les
   * onglets en mode placeholder pour test ». *C'est un repli d'affichage, pas
   * une donnée* : le jour où chaque destination a son dessin, il n'y a qu'une
   * ligne à retirer, et rien à changer ici.
   */
  embleme?: string
}

export const DESTINATIONS: readonly Destination[] = [
  { nom: 'Expédition', ouvert: true, lieu: 'expedition', majeur: true, embleme: 'Exploration' },
  { nom: 'Armurerie', ouvert: true, lieu: 'armurerie', embleme: 'Armurerie' },
  // LES SIX MÉTIERS DU HUB, nommés par Keko. **Chacun a son lieu**, vide pour
  // l'instant : un panneau à son nom, et rien dedans — « juste le titre,
  // encadré mais vide, pour tester la navigation ». *Un écran vide qui porte
  // son nom se navigue déjà*, et c'est tout ce qu'on cherche à éprouver. Ce
  // que chacun fera se tranchera quand on l'ouvrira.
  { nom: 'Marché', ouvert: true, lieu: 'marche' },
  { nom: 'Charognard', ouvert: true, lieu: 'charognard' },
  { nom: 'Forgeron', ouvert: true, lieu: 'forgeron' },
  { nom: 'Couturière', ouvert: true, lieu: 'couturiere' },
  { nom: 'Enchanteresse', ouvert: true, lieu: 'enchanteresse' },
  { nom: 'Alchimiste', ouvert: true, lieu: 'alchimiste' },
  /**
   * SIX DE PLUS, POUR QUE LA LISTE DÉBORDE. Demandé par Keko : « rajoute des
   * onglets, nomme-les comme tu veux, et permets de scroller pour les faire
   * défiler vu que ça va pas loger ».
   *
   * *Ce sont des noms de banc d'essai*, pas un catalogue de métiers : ils
   * existent pour qu'il y ait plus d'entrées que de place, et c'est la seule
   * chose qu'on éprouve ici. Le jour où le hub se décide pour de bon, ils se
   * retirent ou se renomment sans que rien d'autre ne bouge.
   */
  { nom: 'Taverne', ouvert: true, lieu: 'taverne' },
  { nom: 'Cartographe', ouvert: true, lieu: 'cartographe' },
  { nom: 'Infirmerie', ouvert: true, lieu: 'infirmerie' },
  { nom: 'Chapelle', ouvert: true, lieu: 'chapelle' },
  { nom: 'Mercenaires', ouvert: true, lieu: 'mercenaires' },
  { nom: 'Bibliothèque', ouvert: true, lieu: 'bibliotheque' },
]

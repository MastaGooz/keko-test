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
  | 'ecuries'
  | 'tanneur'
  | 'herboriste'
  | 'reliquaire'
  | 'arene'
  | 'guilde'

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
  /**
   * UNE PLACE QUI NE SE MONTRE QUE SUR DEMANDE.
   *
   * Keko : « tu peux enlever les onglets du hub à part expédition /
   * armurerie ? cache les autres ». *Deux lieux existent, les autres sont des
   * noms* — et un rail de vingt entrées dont dix-huit ne font rien se lit
   * comme un menu en attente plutôt que comme un hub.
   *
   * **Elles restent dans la table, elles ne sont pas supprimées** : ce sont
   * les six métiers que Keko a nommés et les six du banc de défilement, et
   * `?r3f&lieux` les remontre toutes. *Ce qui a servi à choisir doit rester
   * ouvrable, même une fois le choix fait* — et sans elles il n'y a plus rien
   * à faire défiler.
   */
  cachee?: boolean
  /**
   * LE PNJ DU LIEU : le nom de son fichier dans `public/`, sans extension.
   *
   * *Un lieu habité n'est pas un lieu vide*, même quand il n'a encore rien à
   * faire : le portrait lui donne un corps avant que son contenu existe. Il se
   * pose dans la colonne de droite, exactement comme l'armurier dans
   * l'armurerie — **même gabarit, 576 x 2064**, sujet contre les quatre bords.
   *
   * *Une seule table pour les deux* : l'armurier passait par sa propre
   * fonction, et une fonction par PNJ aurait fait une ligne de code par
   * dessin.
   */
  pnj?: string
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
  { nom: "Maître d'armes", ouvert: true, lieu: 'armurerie', embleme: 'Armurerie', pnj: 'Armurier' },
  // LES SIX MÉTIERS DU HUB, nommés par Keko. **Chacun a son lieu**, vide pour
  // l'instant : un panneau à son nom, et rien dedans — « juste le titre,
  // encadré mais vide, pour tester la navigation ». *Un écran vide qui porte
  // son nom se navigue déjà*, et c'est tout ce qu'on cherche à éprouver. Ce
  // que chacun fera se tranchera quand on l'ouvrira.
  { nom: 'Marché', ouvert: true, lieu: 'marche', cachee: true },
  { nom: 'Charognard', ouvert: true, lieu: 'charognard', pnj: 'Charognard' },
  { nom: 'Forgeron', ouvert: true, lieu: 'forgeron', cachee: true },
  { nom: 'Couturière', ouvert: true, lieu: 'couturiere', cachee: true },
  { nom: 'Enchanteresse', ouvert: true, lieu: 'enchanteresse', cachee: true },
  { nom: 'Alchimiste', ouvert: true, lieu: 'alchimiste', cachee: true },
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
  { nom: 'Taverne', ouvert: true, lieu: 'taverne', cachee: true },
  { nom: 'Cartographe', ouvert: true, lieu: 'cartographe', cachee: true },
  { nom: 'Infirmerie', ouvert: true, lieu: 'infirmerie', cachee: true },
  { nom: 'Chapelle', ouvert: true, lieu: 'chapelle', cachee: true },
  { nom: 'Mercenaires', ouvert: true, lieu: 'mercenaires', cachee: true },
  { nom: 'Bibliothèque', ouvert: true, lieu: 'bibliotheque', cachee: true },
  { nom: 'Écuries', ouvert: true, lieu: 'ecuries', cachee: true },
  { nom: 'Tanneur', ouvert: true, lieu: 'tanneur', cachee: true },
  { nom: 'Herboriste', ouvert: true, lieu: 'herboriste', cachee: true },
  { nom: 'Reliquaire', ouvert: true, lieu: 'reliquaire', cachee: true },
  { nom: 'Arène', ouvert: true, lieu: 'arene', cachee: true },
  { nom: 'Guilde', ouvert: true, lieu: 'guilde', cachee: true },
]

/**
 * CE QUE LE RAIL MONTRE : les deux lieux qui existent, et rien d'autre.
 *
 * `?r3f&lieux` les remontre toutes — c'est le banc du défilement, qui n'a plus
 * d'objet avec deux entrées.
 */
export function destinationsMontrees(): readonly Destination[] {
  const montreTout =
    typeof location !== 'undefined' && new URLSearchParams(location.search).has('lieux')
  return montreTout ? DESTINATIONS : DESTINATIONS.filter((d) => d.cachee !== true)
}

/** Le PNJ d'un lieu, s'il en a un — le nom de son fichier dans `public/`. */
export function pnjDuLieu(lieu: LieuHub): string | undefined {
  return DESTINATIONS.find((d) => d.lieu === lieu)?.pnj
}

/**
 * LES TROMBINES À LA PLACE DES ÉCUS, le temps de juger (`?r3f&trombines`).
 *
 * Keko : « tu crois qu'à la place des symboles dans les catégories du hub, on
 * pourrait afficher l'image des PNJ (réduite) ? »
 *
 * *Un portrait réduit n'est pas un symbole réduit* : les dessins font
 * 576 x 2064, donc un corps en pied — dans une ligne de 48 px il ferait 13 px
 * de large, et le visage sept. **Ce qui marche, c'est de RECADRER sur la
 * tête** : une vignette carrée, le vocabulaire des jeux d'extraction, et il
 * n'y a rien à redessiner.
 *
 * Derrière une URL parce que c'est Keko qui tranche, et *ce qui se teste doit
 * pouvoir s'ouvrir d'un lien.*
 */
export function trombinesAuRail(): boolean {
  return typeof location !== 'undefined' && new URLSearchParams(location.search).has('trombines')
}

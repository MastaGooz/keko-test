/**
 * OÙ TOUT SE POSE DANS L'ARMURERIE — et **un seul calcul pour les deux
 * mondes**.
 *
 * Les cartes vivent dans le canvas, les cadres et les onglets sont du HTML par
 * -dessus : s'ils se plaçaient chacun de leur côté, ils se décaleraient au
 * premier réglage et le cadre ne tomberait plus autour de sa grille. *Ce qui
 * doit coïncider se calcule à un seul endroit*, exactement comme le contrat de
 * la tête de comète.
 *
 * Tout est en **fractions du champ visible**, jamais en unités écrites à la
 * main : la page doit tenir de 667 x 320 à un écran de PC, et le nombre de
 * lignes du coffre doit suivre la hauteur qu'on a. Keko : « il faudrait plus
 * de cases pour occuper la hauteur de l'écran, différent donc entre PC et
 * téléphone ».
 *
 * **LA PAGE EST UN BANDEAU ET TROIS COLONNES** : le coffre, l'équipement, les
 * stats. Elle avait deux panneaux collés aux bords et un énorme vide au milieu
 * — Keko : « c'est moche » — puis deux colonnes et un pied, et enfin trois :
 * « on devrait passer les stats à droite de l'écran en colonne vu qu'on peut
 * réduire le coffre en largeur, et pourquoi pas passer le bouton pour lancer
 * la run sous la colonne des stats ».
 *
 * *Ce que ça achète, et ce n'était pas qu'un rangement* : le pied disparaît, et
 * ses 26 % de hauteur reviennent aux deux panneaux — donc des pièces de
 * chargement plus grandes et une ligne de coffre de plus. **Une bande qui ne
 * porte qu'une rangée de chiffres coûte toute sa hauteur à ce qu'il y a
 * au-dessus.*
 */
import { Z_MAIN, hauteurVisibleA } from './Cadrage.tsx'
import { hauteurBoutonMonde, tailleBouton } from './Bouton3D.tsx'
import { estConsommable } from '../logic/armes.ts'
import { aPeindre, pieceAPeindre } from './combat-3d.ts'
import { signature } from './texture-carte.ts'
import type { ContenuCoffre, Hub } from '../logic/hub.ts'
import { CAPACITE_PILE, estTresor } from '../logic/hub.ts'

export const Z_PLAN = Z_MAIN

/**
 * LES DEUX FAÇONS DE PARTIR, et leurs libellés vivent ICI parce que le plan
 * doit les mesurer pour dimensionner le rail : *ce qui décide d'une largeur ne
 * peut pas être écrit ailleurs que là où la largeur se calcule.*
 */
export const TEXTE_DESCENDRE = 'Descendre'
export const TEXTE_FORTUNE = 'Équipement\ngratuit'

/** Ce qu'on consulte sans rien décider : le deck que le chargement produit. */
export const TEXTE_DECK = 'Deck'

/**
 * **LE COFFRE A CINQ COLONNES, PARTOUT.** Tranché par Keko après comparaison :
 * « je préfère 5 colonnes partout ».
 *
 * *Avant, le compte était une CONSÉQUENCE* : la case tenait sa taille du
 * chargement (0,68 de la sienne), et le nombre tombait de la largeur divisée par
 * cette taille. Sur un écran haut ça donnait 5 ; sur un écran large et court —
 * un téléphone en paysage avec la barre du navigateur — le chargement était
 * borné par la HAUTEUR, donc la case rétrécissait et la largeur n'avait pas
 * bougé : **7 colonnes de cartes minuscules.**
 *
 * C'est donc l'inverse maintenant : **on fixe le compte et la case prend ce qui
 * reste.** À 956 x 340 la carte passe de ~24 à ~33 px, et le coffre montre moins
 * de rangées — *l'échange est réel, et c'est Keko qui l'a tranché.*
 *
 * `?r3f&colonnes=<n>` reste ouvrable pour en essayer un autre : *ce qui a servi
 * à choisir doit rester ouvrable, même une fois le choix fait.*
 */
const COLONNES_COFFRE = 5

export function COLONNES_URL(): number {
  const demande = Number(new URLSearchParams(location.search).get('colonnes'))
  return Number.isFinite(demande) && demande >= 2
    ? Math.min(12, Math.round(demande))
    : COLONNES_COFFRE
}




/**
 * LA TAILLE D'UNE CASE DE LA PILE EST IMPOSÉE PAR L'ARITHMÉTIQUE, pas choisie.
 *
 * Deux lignes de cases doivent tenir dans la hauteur d'un slot. Une carte fait
 * 1,4 fois sa largeur, donc deux cases de largeur `c` font `2,8 c` de haut ;
 * pour que ça vaille la hauteur d'un slot (1,4), il faut **`c = 1 / 2`**.
 */
export const PILE = 0.5

/**
 * LE RAPPORT DU PORTRAIT DU PNJ — celui de son DESSIN, pas un idéal.
 *
 * `Armurier.png` fait 576 x 2064, sujet contre les quatre bords. *Sa colonne
 * prend ce rapport* : c'est la seule façon qu'il la remplisse sans vide ni
 * rognage. Le jour où un PNJ arrive dans un autre cadrage, c'est ce chiffre
 * qu'on bouge — ou bien on redessine au rapport, mais les deux ne peuvent pas
 * diverger.
 *
 * *Il a fait l'aller-retour* : 0,28 (le rapport conseillé), puis 0,40 quand
 * Keko a redessiné « pour bien occuper la colonne » sans l'avoir lu, puis 0,28
 * de nouveau une fois le dessin recadré. **Les deux fois, c'est le chiffre qui
 * a suivi le fichier** — jamais l'inverse.
 */
export const RAPPORT_PNJ = 0.28

/**
 * LES ONGLETS DU COFFRE, dans l'ordre où on les lit.
 *
 * `tresors` n'est pas un type d'équipement : c'est ce qu'on rapporte et qui ne
 * repart jamais. Il tient sa place ici parce que **le coffre est ce qu'on
 * possède**, pas ce qu'on peut porter.
 */
export const ONGLETS = ['tout', 'armes', 'armures', 'consommables', 'tresors'] as const
export type Onglet = (typeof ONGLETS)[number]

export const NOM_ONGLET: Record<Onglet, string> = {
  tout: 'Tout',
  armes: 'Armes',
  armures: 'Armures',
  consommables: 'Objets',
  tresors: 'Trésors',
}

export type Rect = {
  /** Le centre, en unités de scène. */
  x: number
  y: number
  /** Les dimensions, en unités de scène. */
  l: number
  h: number
}

export type PlanArmurerie = {
  demiHaut: number
  demiLarge: number
  /**
   * LE RAIL DES DESTINATIONS, sur le bord gauche — et il remplace l'écran de
   * place.
   *
   * Tranché par Keko après lui avoir montré trois formes de hub : « pas fou
   * comme interface finalement le hub, il faudrait un truc plus
   * professionnel ». *Un écran qui ne sert qu'à en choisir un autre est un
   * écran de trop* — la grille de portraits ne portait aucun état, aucun
   * chiffre, aucune décision, et aucun habillage ne sauve un écran qui n'a
   * rien à dire.
   *
   * Le rail est la forme des jeux d'extraction (Tarkov et les siens) : une
   * barre de destinations permanente, et le lieu choisi occupe tout le reste.
   * **C'est aussi la seule des trois qui tienne au doigt sans être
   * redessinée** : *une liste se raccourcit, une illustration ne se reflow
   * pas.* Le décor de ville à points chauds — la forme de Darkest Dungeon —
   * est plus beau et demande une grande image par lieu.
   */
  rail: Rect
  /** La liste elle-même : le rail moins la bande du bouton, en bas. */
  railListe: Rect
  /** Le panneau du lieu d'expédition : tout ce que le rail laisse. */
  expedition: Rect
  /** Le cadre du coffre, bandeau d'onglets compris. */
  coffre: Rect
  /** La bande des onglets, dans le coffre. */
  onglets: Rect
  /** Le bouton qui range le coffre, dans l'en-tête au-dessus des onglets. */
  tri: Rect
  /** La zone des cases, dans le coffre. */
  grille: Rect
  /** La barre de défilement, à droite de la grille. */
  barre: Rect
  colonnes: number
  lignes: number
  /**
   * COMBIEN DE RANGÉES ON DESSINE — et ce n'est pas `lignes + 1`.
   *
   * *L'étirement du pas est PLAFONNÉ à 8 %*, donc `lignes` rangées ne
   * remplissent pas toujours le meuble : à 2,5 rangées de haut, on en tient
   * deux et il reste une demi-rangée de vide. Tirer `lignes + 1` couvrait ce
   * vide **au repos seulement** — dès qu'on défilait d'une demi-rangée, la
   * couverture reculait d'autant et le bas du meuble se vidait. *La rangée
   * suivante n'entrait donc pas coupée par le bas : elle surgissait entière
   * quand le compteur de ligne basculait.*
   *
   * On compte donc les rangées qu'il faut pour couvrir la hauteur RÉELLE au
   * pas RÉEL, plus une pour le décalage. **Ce qu'on dessine se déduit de ce
   * qu'on couvre, jamais de ce qui tient.**
   */
  lignesTirees: number
  pasX: number
  pasY: number
  /** Le cadre de l'équipement. */
  equipement: Rect
  mains: [[number, number, number], [number, number, number]]
  armure: [number, number, number]
  pile: [number, number, number][]
  /**
   * LES NOMS DE GROUPE, au-dessus des slots qu'ils nomment.
   *
   * Ils ont d'abord été écrits DANS la case vide, un mot par slot. Deux
   * défauts : rien ne nommait la pile — Keko, « rien n'indique les slots
   * consommables » — et les mots n'avaient pas la même taille d'un slot à
   * l'autre, parce que `textureSlot` peignait avant que Cinzel ne soit
   * chargée et gardait sa texture en cache. *Un nom au-dessus d'un GROUPE dit
   * ce que la case dit, et il le dit une fois pour deux slots.*
   */
  nomArmes: Rect
  nomArmure: Rect
  nomObjets: Rect
  /**
   * La taille d'une carte, en fraction d'une carte de la main — **la même
   * partout dans l'armurerie**, coffre compris.
   */
  tailleCharge: number
  /** Celle d'une case de la pile : la même, depuis que tout s'aligne. */
  taillePile: number
  /** Celle d'une case du coffre : un cran sous, pour en montrer plus. */
  tailleCoffre: number
  /** La colonne des stats, à droite : quatre cartouches empilés. */
  /** La bande des quatre mesures, en haut de l'équipement. */
  stats: Rect
  /** La colonne de l'armurier, à droite, au-dessus du bouton. */
  pnj: Rect
  /** Le bouton de départ, sous les stats. */
  bouton: [number, number, number]
  /**
   * LE BOUTON DE FORTUNE, sous l'armurier.
   *
   * Demandé par Keko : « un bouton sous le PNJ armurier, qu'on va remonter en
   * haut de sa colonne d'ailleurs ; similaire au bouton descendre, sauf qu'il
   * génère un stuff de niveau minimal aléatoire ». *C'est l'armurier qui le
   * donne*, donc il se pose sous lui — et le portrait lui cède sa bande basse
   * plutôt que de la partager.
   */
  boutonFortune: [number, number, number]
  /**
   * « Deck » : la bande réservée juste sous les mesures. C'est un RECTANGLE et
   * non une position de scène, parce que le bouton est du HTML — *il porte le
   * symbole du paquet, qui est un SVG du jeu*, et le repeindre au canvas
   * l'aurait dédoublé.
   */
  deck: Rect
  /** Le rapport que les DEUX boutons de départ partagent. */
  rapportDepart: number
}

/** Combien de pixels vaut une unité de scène, à la profondeur du plan. */
export function pixelsParUnite(hauteurFenetrePx: number): number {
  return hauteurFenetrePx / hauteurVisibleA(Z_PLAN, hauteurFenetrePx)
}

/**
 * Le rectangle en PIXELS d'écran, prêt pour du CSS : `left`, `top`, `width`,
 * `height`. L'axe Y de la scène monte, celui de l'écran descend.
 */
export function enPixels(
  r: Rect,
  hauteurFenetrePx: number,
  largeurFenetrePx: number,
): { left: number; top: number; width: number; height: number } {
  const k = pixelsParUnite(hauteurFenetrePx)
  return {
    left: largeurFenetrePx / 2 + (r.x - r.l / 2) * k,
    top: hauteurFenetrePx / 2 - (r.y + r.h / 2) * k,
    width: r.l * k,
    height: r.h * k,
  }
}

export function planArmurerie(
  hauteurFenetrePx: number,
  largeurFenetrePx: number,
  aDeuxMains: boolean,
): PlanArmurerie {
  const demiHaut = hauteurVisibleA(Z_PLAN, hauteurFenetrePx) / 2
  const demiLarge = (demiHaut * largeurFenetrePx) / hauteurFenetrePx

  // LES BANDES SE COMPTENT EN FRACTIONS DE HAUTEUR : sur un téléphone couché
  // le champ fait la moitié de celui d'un écran de PC, et un bandeau en unités
  // fixes y mangerait tout.
  const marge = Math.min(demiLarge * 0.045, 0.5)
  // LE PIED N'EST PLUS QU'UNE MARGE : ce qu'il portait vit dans la colonne de
  // droite, et sa hauteur est revenue aux panneaux.
  const hPied = demiHaut * 0.07
  /**
    * PLUS DE BANDEAU DE TITRE, et sa hauteur revient aux panneaux.
    *
    * Keko : « on peut enlever le titre armurerie en haut pour gagner de la
    * place vu que c'est marqué déjà à gauche ». *Le rail nomme le lieu où
    * l'on est* — son entrée ouverte le dit, en clair et en permanence — donc
    * le bandeau ne faisait que le répéter. **Une bande qui ne porte qu'un mot
    * déjà écrit ailleurs coûte toute sa hauteur à ce qu'il y a en dessous** :
    * c'est le même raisonnement qui avait fait disparaître le pied.
    */
  const hautPanneaux = demiHaut - marge
  const basPanneaux = -demiHaut + hPied
  const hPanneaux = hautPanneaux - basPanneaux
  const yPanneaux = (hautPanneaux + basPanneaux) / 2

  // TROIS COLONNES, ET C'EST LE COFFRE QUI CÈDE. Il est ce qu'on fouille, donc
  // il mérite la place — mais il la rend en LARGEUR plutôt qu'en lignes : une
  // colonne de cases en moins ne coûte presque rien, et elle paie la colonne
  // des stats. *Une colonne qui se remplit mérite la place, une colonne à
  // trois slots ne la réclame pas.*
  // LE RAIL PREND SA BANDE AVANT TOUT LE RESTE, et le reste se calcule depuis
  // son bord : *une bande réservée ne se partage pas.* Sa largeur est bornée
  // par la HAUTEUR comme tout le reste ici — sur un téléphone couché le champ
  // est deux fois plus petit, et une bande en fraction de largeur seule y
  // mangerait le coffre. Elle ne descend jamais sous son bouton : il vit
  // dedans, et *une colonne qui ne contient pas ce qu'on y met n'est pas une
  // colonne.*
  // LES DEUX DÉPARTS ONT LA MÊME PLAQUE. Demandé par Keko — *deux actions de
  // même rang, l'une sous l'autre, ne peuvent pas avoir deux tailles.* On prend
  // donc la plus large des deux et on la donne aux deux, la police étant déjà
  // commune depuis que la toile garde sa hauteur.
  const bDescendre = tailleBouton(TEXTE_DESCENDRE, 'or', 'ecran', Z_PLAN, hauteurFenetrePx)
  const bFortune = tailleBouton(TEXTE_FORTUNE, 'pierre', 'ecran', Z_PLAN, hauteurFenetrePx)
  const lBouton = Math.max(bDescendre.largeur, bFortune.largeur)
  const rapportDepart = lBouton / bDescendre.hauteur
  /**
   * LA COLONNE NE SUIT PLUS SON BOUTON — mais elle suit toujours SON CONTENU.
   *
   * Elle était bornée par le plus large des deux départs : réduire un bouton
   * la rétrécissait, et le nom des destinations avec. Les boutons partis, la
   * borne est partie avec eux — et le rail est tombé de 99 à 85 px à
   * 667 x 320, où « Expédition » ne tenait plus. *La règle n'a pas changé, son
   * objet oui* : **une colonne qui ne contient pas ce qu'on y met n'est pas
   * une colonne**, et ce qu'on y met est désormais un mot de dix lettres.
   *
   * D'où un plancher en pixels d'écran, pas en fraction du champ : c'est le
   * texte qu'il doit tenir, et un texte se mesure en pixels.
   */
  const lRail = Math.max(
    Math.min(2 * demiLarge * 0.15, demiHaut * 0.66),
    (118 * hauteurVisibleA(Z_PLAN, hauteurFenetrePx)) / hauteurFenetrePx,
  )
  const xRail = -demiLarge + marge + (lRail - marge) / 2
  const gauche = -demiLarge + lRail
  // LE LIEU D'EXPÉDITION prend tout ce que le rail laisse, comme les trois
  // meubles de l'armurerie réunis.
  const lExpedition = demiLarge - gauche - 2 * marge
  const xExpedition = gauche + marge + lExpedition / 2

  const largeurUtile = demiLarge - gauche - 2 * marge - 2 * marge
  // Les stats sont un rail de cartouches : leur largeur est celle de leur
  // contenu, pas une part du reste. On la borne pour qu'un grand écran ne
  // l'étire pas en panneau.
  // LA COLONNE FAIT AU MOINS LA LARGEUR DE SON BOUTON. Il vit dedans, et sa
  // largeur sort de son texte : trop étroite, la colonne le laissait déborder
  // sur l'équipement — *une colonne qui ne contient pas ce qu'on y met n'est
  // pas une colonne.* C'est aussi ce qui permet de grossir le bouton sans
  // rouvrir la collision.
  /**
   * LA COLONNE DE L'ARMURIER N'EST PLUS TENUE PAR LE BOUTON.
   *
   * Elle avait un PLANCHER à la largeur de « Descendre » — il vivait dedans, et
   * *une colonne qui ne contient pas ce qu'on y met n'est pas une colonne.* Le
   * bouton est parti dans le rail, et le plancher est resté : sur un téléphone,
   * où le rail a pris un cinquième de la largeur, c'est lui qui commandait, et
   * le portrait mangeait plus de place que le panneau d'équipement (211 px
   * contre 183 à 844 x 390). Les onglets et les stats débordaient de leurs
   * cadres — Keko : « je pense que le PNJ prend trop de place ».
   *
   * **Une contrainte posée pour un contenu se relit quand ce contenu s'en
   * va** — sinon elle reste comme une cicatrice, à tenir de la place pour
   * quelque chose qui n'est plus là.
   */
  /**
   * LA COLONNE DU PNJ A LE RAPPORT D'UN CORPS DEBOUT, pas une part de largeur.
   *
   * Elle en était une (15 % de l'utile), héritée du temps où elle portait les
   * stats et un bouton. Ceux-ci partis, il n'y reste qu'un portrait — et une
   * colonne de 96 x 357 px a un rapport de 0,27 pour un dessin qui en fait
   * 0,68 : **il ne remplissait que 40 % de sa hauteur**, calé en bas, le reste
   * en vide. Keko : « je trouve le PNJ un peu moche, il est seul dans sa
   * colonne tout en bas avec un espace vide au-dessus ».
   *
   * *Une colonne qui ne contient qu'une image doit avoir le rapport de cette
   * image*, sinon l'un des deux axes est perdu. On part donc de la HAUTEUR —
   * c'est elle qui est donnée — et **le rapport est celui du dessin**.
   *
   * Il a valu 0,28 le temps d'un commit, la valeur que j'avais conseillée pour
   * un personnage debout ; Keko a redessiné l'armurier « pour bien occuper la
   * colonne » et l'a cadré en **0,40**, sujet contre les quatre bords. *C'est
   * le dessin qui décide, pas le conseil* : une colonne taillée pour un rapport
   * que l'image n'a pas rouvre exactement le vide qu'on venait de fermer.
   *
   * Le plafond en part d'utile reste : sur un écran de PC, la hauteur est telle
   * qu'un rapport seul mangerait le coffre.
   */
  const lStats = Math.min(hPanneaux * RAPPORT_PNJ, largeurUtile * 0.24)
  // LE COFFRE REND ENCORE UN PEU DE LARGEUR : l'équipement lui en demande,
  // maintenant que ses sept cartes sont à la même taille et tiennent sur
  // quatre colonnes.
  const lCoffre = (largeurUtile - lStats) * 0.55
  const lEquip = largeurUtile - lStats - lCoffre
  const xCoffre = gauche + marge + lCoffre / 2
  const xStats = demiLarge - marge - lStats / 2
  const xEquip = xStats - lStats / 2 - marge - lEquip / 2

  const coffre: Rect = { x: xCoffre, y: yPanneaux, l: lCoffre, h: hPanneaux }

  // Le bandeau d'onglets vit DANS le cadre, sous son titre : le titre nomme le
  // meuble, les onglets disent ce qu'on y regarde.
  const hOnglets = Math.min(hPanneaux * 0.17, 0.6)
  // L'EN-TÊTE NE PORTE QUE LA PLAQUE, qui est à cheval sur le bord : au-delà,
  // c'est du vide au-dessus des onglets, et il se voyait.
  const hEntete = Math.min(hPanneaux * 0.07, 0.24)
  const onglets: Rect = {
    x: xCoffre,
    y: yPanneaux + hPanneaux / 2 - hEntete - hOnglets / 2,
    l: lCoffre,
    h: hOnglets,
  }

  /**
   * LE BOUTON QUI RANGE, dans l'en-tête, contre le bord droit du meuble.
   *
   * Keko : « un bouton dans le coffre, au-dessus des catégories, pour ranger le
   * coffre en triant les objets par catégorie et par rareté ; il aurait un
   * symbole de rangement, pas du texte ».
   *
   * *L'en-tête ne portait que la plaque du meuble*, centrée et à cheval sur le
   * bord : il y reste toute la largeur. Et il est AU-DESSUS des onglets, donc
   * il ne dit pas ce qu'on regarde mais ce qu'on fait au meuble entier — ce
   * qui est exactement la différence entre les deux.
   */
  // IL TIENT DANS LA BANDE, ET DANS LE COIN HAUT-GAUCHE. Keko : « le bouton est
  // mal positionné, il déborde sur le bord du panneau coffre ; je voyais le
  // bouton dans le coin haut-gauche du panneau ». *Un bouton à cheval sur un
  // cadre se lit comme une pièce qui a glissé*, alors que la plaque du meuble,
  // elle, chevauche exprès — elle NOMME le cadre, elle n'agit pas dessus.
  //
  // **LE MÊME ÉCART AU HAUT ET À GAUCHE**, et c'est un seul nombre qui le dit :
  // deux marges calculées chacune de leur côté se désaccordent au premier
  // réglage. Keko l'a voulu ensuite plus large — « la même distance qu'entre le
  // bord et le premier bouton de catégorie ».
  //
  // **ET C'EST LE CARRÉ QUI DESCEND SOUS LA BANDE, PAS LA BANDE QUI GROSSIT.**
  // *Un carré dans une bande trop courte ne peut pas avoir de marge* : à 23 px
  // d'en-tête, une marge de quinze l'aurait réduit à rien, et rouvrir la bande
  // coûtait une rangée de coffre. Or la bande des onglets est LARGEMENT plus
  // haute que son texte, qui s'y centre : il reste un vide au-dessus du premier
  // onglet, et le carré s'y avance. *Une place libre n'appartient à personne
  // tant que rien ne s'y dessine.*
  const ecartTri = Math.min(marge * 0.8, hEntete * 0.6)
  const cote = Math.min(hEntete * 0.95, hOnglets * 0.4)
  const tri: Rect = {
    x: xCoffre - lCoffre / 2 + ecartTri + cote / 2,
    y: yPanneaux + hPanneaux / 2 - ecartTri - cote / 2,
    l: cote,
    h: cote,
  }

  // LA BARRE DE DÉFILEMENT MANGE SA PLACE À DROITE : sinon elle passerait sur
  // la dernière colonne de cases.
  const gouttiere = Math.min(0.34, lCoffre * 0.05)
  const padGrille = marge * 0.7
  const grille: Rect = {
    x: xCoffre - gouttiere / 2,
    y: (onglets.y - hOnglets / 2 + (yPanneaux - hPanneaux / 2 + padGrille)) / 2,
    l: lCoffre - 2 * padGrille - gouttiere,
    h: onglets.y - hOnglets / 2 - (yPanneaux - hPanneaux / 2) - padGrille,
  }

  /**
   * UNE SEULE TAILLE DE CARTE DANS TOUTE L'ARMURERIE.
   *
   * Keko : « toutes les cartes du coffre ET de l'équipement ont la même taille
   * — la taille actuelle de l'équipement est bien, faisons ça dans le coffre ».
   *
   * *Le coffre avait la sienne, écrite à la main* — 0,52, puis 0,44, puis 0,54,
   * puis 0,62 — et à chaque réglage il fallait la rejuger contre celle du
   * chargement. **Une page qui montre le même objet à deux endroits n'a aucune
   * raison de le montrer à deux échelles** : c'est la même carte, c'est la même
   * taille, et elle se calcule une fois.
   *
   * C'est l'équipement qui la fixe, parce que c'est lui qui est CONTRAINT : ses
   * sept slots doivent tenir dans un panneau, alors que le coffre n'a qu'à
   * remplir le sien avec ce qu'il peut.
   */
  /**
   * LES QUATRE MESURES PASSENT EN BANDE, en haut de l'équipement.
   *
   * Elles tenaient la colonne de droite, en rail vertical — et depuis que
   * l'armurier la coiffe, *elles se lisaient comme SES statistiques.* Keko :
   * « on dirait que c'est les stats du PNJ maintenant… et si on plaçait les
   * stats en haut de l'onglet équipement sur une ligne ? »
   *
   * Elles sont bien où elles doivent être : ce qu'on emporte se mesure
   * au-dessus de ce qu'on équipe. **Ça coûte une bande de hauteur au
   * chargement**, donc des cartes un peu plus petites — le prix est connu et
   * assumé, « vu qu'on a peu de place ».
   */
  // Sa hauteur est celle que le RAIL avait par ligne, pas une part généreuse :
  // les symboles s'y inscrivent, et à bande trop haute ils grossissent avec
  // elle — un coeur de 70 px à côté d'un chiffre de 20 ne se lit plus comme
  // une mesure.
  // ET ELLE A UN PLANCHER, PARCE QU'ELLE PORTE UN CHIFFRE QUI N'EN A PAS.
  //
  // Keko : « on avait agrandi le symbole des PA pour que les bords du cercle ne
  // touchent pas le chiffre ; mais sur la page web du téléphone le cercle est
  // toujours petit, alors qu'en app installée c'est la bonne taille ».
  //
  // *La cause n'est pas le téléphone, c'est la BARRE DU NAVIGATEUR* : elle
  // mange une centaine de pixels, donc la bande — une fraction du champ
  // visible — rétrécit avec elle. Le chiffre, lui, est en `rem`, et le `rem`
  // est PLANCHONNÉ à 16 px par son `clamp` : il ne bouge plus. Mesuré en cadre :
  // à 386 px de haut, disque 29,9 px pour un chiffre de 18 (rapport 1,66) ; à
  // 296 px, disque 22,7 px pour le même 18 — le chiffre touche le cercle.
  //
  // **Une bande doit être au moins aussi haute que ce qu'elle contient**, et
  // c'est ici que ça se règle, pas sur l'orbe : le corriger là-bas l'aurait
  // fait déborder sur le titre du groupe d'en dessous. Ce que ça coûte est
  // connu — quelques pixels de moins pour les cartes du chargement, sur les
  // seuls écrans courts.
  //
  // 24,5 px : la hauteur qu'a la bande à 844 x 390, là où le rapport a été
  // validé. Au-dessus de cette taille elle ne mord jamais ; en dessous, le
  // `rem` est de toute façon bloqué à son plancher, donc la constante vaut
  // dans tout son domaine.
  const PLANCHER_STATS_PX = 24.5
  const hStats = Math.max(
    Math.min(hPanneaux * 0.075, 0.4),
    PLANCHER_STATS_PX / pixelsParUnite(hauteurFenetrePx),
  )

  const COLONNES_EQUIP = 3
  const RANGEES_EQUIP = 2
  /**
   * LE BOUTON « DECK » PREND SA BANDE, il ne s'installe pas dans le jeu.
   *
   * Demandé par Keko — « sous les stats, dans l'espace libre, un bouton deck
   * pour permettre au joueur de consulter son deck actuel ». Il y avait bien du
   * vide sous la bande de mesures, mais c'était le JEU du bloc centré, pas une
   * place : 45 px pour un bouton qui en demande 46 au plancher tactile. *Une
   * bande réservée ne se partage pas* — sinon le bouton mordrait le titre du
   * premier groupe dès qu'un écran se resserre, exactement ce que les noms de
   * groupe avaient déjà coûté.
   *
   * Il est PETIT : *on ne décide pas dessus*, on consulte — il ne peut pas se
   * lire au même rang que « Descendre ».
   */
  /**
   * **LA PLAQUE SERRE SON CONTENU.** Demandé par Keko — « réduis la taille du
   * bouton du deck, le padding pas le contenu ». Elle avait la hauteur d'un
   * petit bouton tactile, soit 42 px pour un couple chiffre + symbole de 24 :
   * **18 px d'air pour 24 de matière.** *Un bouton qui tient dans sa main a
   * déjà la taille qu'il faut* — c'est l'air autour qui le faisait gros.
   *
   * Le contenu se borne EXACTEMENT comme les mesures de la bande (`/8.03`),
   * puisqu'ils partagent leur règle de taille ; la plaque n'ajoute que son air.
   */
  const contenuDeck = Math.min(
    // **CE FACTEUR NE MORD QUE SUR GRAND ÉCRAN** : sur téléphone c'est la
    // largeur de la bande qui borne, donc le monter n'y change rien. Keko :
    // « sur PC on peut augmenter un petit peu la taille du bouton deck ».
    hauteurBoutonMonde('mineur', Z_PLAN, hauteurFenetrePx) * 0.95,
    (lEquip - marge * 2) / 8.03,
  )
  const hDeck = contenuDeck * 1.4
  const bandeDeck = hDeck + marge
  const hDedans = hPanneaux - hEntete - hStats - bandeDeck
  // La bande d'un nom de groupe. Il y en a une par rangée, et elles entrent
  // dans le calcul de la taille : un titre pris sur la place des cartes les
  // ferait déborder du panneau, exactement ce qui est arrivé sur téléphone.
  const hNom = Math.min(hDedans * 0.1, 0.34)
  const tailleCharge = Math.min(
    1,
    (lEquip - marge * 2) / (COLONNES_EQUIP * 1.12),
    (hDedans * 0.96 - RANGEES_EQUIP * hNom) / (RANGEES_EQUIP * 1.4 * 1.12),
  )

  /**
   * LE COFFRE EST UN CRAN SOUS LE CHARGEMENT — et c'est un arbitrage de Keko,
   * pas un oubli de la règle précédente.
   *
   * Tout était à la même taille, et à deux rangées d'équipement les cartes ont
   * tellement grandi que le coffre n'en montrait plus que six. Keko :
   * « finalement on pourrait réduire un peu la taille ? 6 éléments par page
   * c'est un peu limite ». *Un coffre est un endroit où l'on CHERCHE* : il lui
   * faut du monde sous les yeux, là où le chargement montre ce qu'on emporte.
   *
   * Ce qui reste de la règle d'avant : **une seule taille de RÉFÉRENCE**, celle
   * du chargement, et le coffre en est une fraction. Il n'y a toujours pas deux
   * chiffres à rejuger l'un contre l'autre.
   */
  // LA CASE CÈDE, LE COMPTE COMMANDE : elle prend la largeur divisée par le
  // nombre de colonnes, au lieu que le nombre tombe de sa taille.
  const colonnesVoulues = COLONNES_URL()
  const tailleCoffre = grille.l / (colonnesVoulues * 1.16)

  // Une case, plus un cheveu : la grille doit respirer sans s'étaler.
  const pasX = tailleCoffre * 1.16
  const pasY = tailleCoffre * 1.4 * 1.12
  const barre: Rect = {
    x: xCoffre + lCoffre / 2 - padGrille - gouttiere / 2,
    y: grille.y,
    l: gouttiere * 0.44,
    h: grille.h,
  }
  const colonnes = colonnesVoulues
  const lignes = Math.max(1, Math.floor(grille.h / pasY))
  // LES LIGNES S'ÉTIRENT UN PEU POUR REMPLIR, mais à peine : à pas fixe il
  // restait une fraction de rangée en bas du coffre, et à pas libre les deux
  // rangées d'un coffre à grandes cartes se retrouvaient aux deux bouts du
  // panneau. *Une grille se lit à son pas régulier* — ce qui reste en bas est
  // de l'étagère vide, et une étagère vide est ce qu'on attend d'un coffre.
  const pasYPlein = Math.min(grille.h / lignes, pasY * 1.08)
  // ET LA GRILLE SE CENTRE EN LARGEUR. À grandes cartes, le coffre n'en tient
  // plus que trois par ligne : calées à gauche, elles laissaient une colonne
  // de vide contre le bord droit du meuble — *un vide au bout d'une rangée se
  // lit comme une case qu'on n'a pas dessinée.* Le compte de colonnes ne
  // dépend pas du contenu, donc rien ne saute quand une ligne s'ajoute.
  const pasXPlein = Math.min(grille.l / colonnes, pasX * 1.1)
  // Assez de rangées pour couvrir le meuble quel que soit le décalage : ce
  // qui monte par le haut doit être remplacé par le bas dans la même image.
  const lignesTirees = Math.ceil(grille.h / pasYPlein) + 1

  /**
   * L'ÉQUIPEMENT : UNE RANGÉE DE CE QU'ON PORTE, UNE RANGÉE DE CE QU'ON BOIT.
   *
   * **Toutes ses cartes ont la même taille**, demandé par Keko. La pile valait
   * la moitié d'une pièce — une arithmétique imposée par deux lignes de cases
   * dans la hauteur d'un slot — et ça faisait deux échelles dans un même
   * panneau : *une case plus petite dit « moins important », alors qu'une
   * potion emportée pèse autant qu'une arme dans le deck.*
   *
   * D'où **trois rangées** : les pièces équipées en haut — deux ou trois selon
   * qu'une arme prend les deux mains — et la pile en bloc de deux par deux
   * dessous. *Quatre consommables sur une seule ligne tenaient aussi*, mais la
   * largeur les bornait à quatre colonnes et le panneau restait à moitié vide :
   * **c'est la contrainte la plus dure qui fixe la taille, donc mieux vaut
   * qu'elle porte sur le petit côté.** À trois colonnes, les cartes gagnent un
   * tiers.
   *
   * **Chaque rangée se centre**, elle ne s'aligne pas à gauche : deux cartes
   * calées sur une grille de trois laisseraient un trou au bout, et un trou au
   * bout d'une rangée se lit comme une case libre.
   *
   * **LA PIÈCE SE DIMENSIONNE, ELLE N'EST PAS DE TAILLE FIXE.** Le champ
   * visible est plus PETIT en unités de scène sur un téléphone — la caméra n'y
   * recule pas — donc on part de la PLACE et on en déduit la taille : la
   * largeur (quatre colonnes) ou la hauteur (deux rangées), la plus dure
   * gagne, et jamais au-delà de 1.
   */
  // Le bas de la bande des mesures : c'est le voisin du haut du bouton « Deck ».
  const basStats = yPanneaux + hPanneaux / 2 - hEntete - hStats
  const yDedans = basStats - bandeDeck - hDedans / 2
  const taillePile = tailleCharge
  const pasCharge = tailleCharge * 1.12
  const pasRangee = tailleCharge * 1.4 * 1.12

  // DEUX ÉTAGES, CHACUN COIFFÉ DE SON NOM, et le tout centré dans le panneau :
  // nom, rangée, nom, rangée. On empile depuis le haut du bloc, pas depuis le
  // bord du panneau — *un bloc plus court que sa boîte doit se centrer dedans,
  // sinon tout le jeu s'accumule d'un seul côté.*
  const hBloc = 2 * hNom + 2 * pasRangee
  const yHautBloc = yDedans + hBloc / 2
  const yNomPorte = yHautBloc - hNom / 2
  const yPorte = yHautBloc - hNom - pasRangee / 2
  const yNomObjets = yHautBloc - hNom - pasRangee - hNom / 2
  const yObjets = yHautBloc - 2 * hNom - 2 * pasRangee + pasRangee / 2

  // La rangée du haut se centre sur ce qu'elle porte : deux cartes si l'arme
  // prend les deux mains, trois sinon.
  const hautes = aDeuxMains ? 2 : 3
  const place = (rang: number): number => xEquip + (rang - (hautes - 1) / 2) * pasCharge
  // « Armes » couvre les deux mains — ou la seule, quand une arme les prend
  // toutes les deux et que le second slot est masqué.
  //
  // LES DEUX FILETS NE SE TOUCHENT PAS. Bout à bout, ils faisaient UN trait
  // continu sous les trois slots, donc on ne voyait plus où « Armes » s'arrête
  // et où « Armure » commence — Keko : « il faudrait que la ligne coupe entre
  // arme et armure ». *Un séparateur qui touche son voisin n'en sépare plus
  // aucun* ; c'est la coupure qui porte l'information, pas le trait.
  const coupe = pasCharge * 0.14
  const lArmes = (aDeuxMains ? 1 : 2) * pasCharge - coupe
  const xArmes = aDeuxMains ? place(0) : (place(0) + place(1)) / 2

  // LES DEUX DÉPARTS SONT L'UN SOUS L'AUTRE, AU BAS DU RAIL. « Descendre »
  // part avec ce qu'on a équipé, « Équipement gratuit » avec un chargement de
  // fortune : *ce sont deux façons de faire la même chose*, donc elles se
  // lisent au même endroit, et la seconde sous la première parce qu'elle est
  // le repli. Demandé par Keko.
  // ILS SE TOUCHENT PRESQUE, et c'est ce qui les fait lire comme UNE pile :
  // on les écarte de la hauteur RÉELLE d'un bouton, pas d'une bande réservée
  // deux fois plus haute — *deux boutons séparés d'un vide se lisent comme deux
  // objets sans rapport.*
  const hBouton = bDescendre.hauteur
  /**
   * LE RAIL NE PORTE PLUS DE BOUTON — ils sont partis dans « Expédition ».
   *
   * Ils ont vécu deux passes au bas de la colonne, et chacune a buté sur la
   * même arithmétique : *deux boutons dans une bande de quatre-vingts pixels
   * ne peuvent pas ne pas être collés*, et ce qu'ils prenaient était
   * exactement ce qui manquait aux huit entrées. Les rendre plus petits ne
   * faisait que déplacer le problème — et rétrécissait le rail avec eux,
   * puisqu'*une colonne ne descend jamais sous son bouton.*
   *
   * **La liste prend donc toute la colonne**, et les deux départs vivent dans
   * le lieu qu'ils ouvrent, où ils ont la place de respirer.
   */

  return {
    demiHaut,
    demiLarge,
    rail: { x: xRail, y: yPanneaux, l: lRail - marge, h: hPanneaux },
    railListe: { x: xRail, y: yPanneaux, l: lRail - marge, h: hPanneaux },
    coffre,
    onglets,
    tri,
    grille,
    barre,
    colonnes,
    lignes,
    lignesTirees,
    pasX: pasXPlein,
    pasY: pasYPlein,
    equipement: { x: xEquip, y: yPanneaux, l: lEquip, h: hPanneaux },
    mains: [
      [place(0), yPorte, Z_PLAN],
      [place(1), yPorte, Z_PLAN],
    ],
    armure: [place(hautes - 1), yPorte, Z_PLAN],
    tailleCharge,
    taillePile,
    tailleCoffre,
    // LA PILE EST UNE RANGÉE, centrée comme celle du haut. Elle a été un bloc
    // de deux par deux ; à trois cases, une seule ligne se lit d'un coup.
    pile: Array.from({ length: CAPACITE_PILE }, (_, i) => [
      xEquip + (i - (CAPACITE_PILE - 1) / 2) * pasCharge,
      yObjets,
      Z_PLAN,
    ]),
    nomArmes: { x: xArmes, y: yNomPorte, l: lArmes, h: hNom },
    nomArmure: { x: place(hautes - 1), y: yNomPorte, l: pasCharge - coupe, h: hNom },
    nomObjets: { x: xEquip, y: yNomObjets, l: CAPACITE_PILE * pasCharge, h: hNom },
    stats: {
      x: xEquip,
      y: yPanneaux + hPanneaux / 2 - hEntete - hStats / 2,
      l: lEquip - marge * 2,
      h: hStats,
    },
    // L'ARMURIER REPREND TOUTE SA COLONNE, le bouton de fortune étant parti
    // dans le rail. *Une contrainte posée pour un contenu se relit quand ce
    // contenu s'en va* — sinon elle reste comme une cicatrice, à tenir de la
    // place pour quelque chose qui n'est plus là.
    pnj: { x: xStats, y: yPanneaux, l: lStats, h: hPanneaux },
    // LES DEUX DÉPARTS SONT AU MILIEU DE LEUR LIEU, l'un sous l'autre et
    // écartés d'un bouton : *ce qui engage une partie occupe le centre de
    // l'écran*, et deux actions de même rang se lisent comme une pile sans se
    // toucher. « Descendre » au-dessus, le repli en dessous.
    bouton: [xExpedition, yPanneaux + hBouton, Z_PLAN],
    boutonFortune: [xExpedition, yPanneaux - hBouton, Z_PLAN],
    expedition: { x: xExpedition, y: yPanneaux, l: lExpedition, h: hPanneaux },
    // **IL A LA LARGEUR DE SON CONTENU, pas celle du panneau** : étiré sur toute
    // la bande il se lisait comme un bandeau, pas comme un bouton. *Ce qui
    // s'étire d'un bord à l'autre est un titre ; ce qui se tape est une pièce.*
    deck: {
      x: xEquip,
      /**
       * **IL SE CENTRE ENTRE SES VOISINS, pas dans la boîte qu'on lui a
       * réservée.** Keko : « on peut descendre un poil le bouton deck qu'il ne
       * soit pas collé à la ligne des stats ? » Mesuré, il avait **9,5 px
       * au-dessus pour 21 en dessous** : sa bande le centrait bien, mais la
       * bande n'est pas ce qui l'entoure à l'oeil — sous elle vient encore le
       * jeu du bloc d'équipement, qui se centre dans ce qui reste.
       *
       * *Un décalage fixe ne pouvait pas marcher* : ce jeu n'est pas une
       * fraction constante, il dépend du format. On prend donc le milieu entre
       * le bas des mesures et le haut du bloc — **ses deux vrais voisins** — et
       * l'équilibre tient partout sans que rien d'autre ne bouge.
       */
      y: (basStats + yHautBloc) / 2,
      l: Math.min(lEquip - marge * 2, hDeck * 1.95),
      h: hDeck,
    },
    rapportDepart,
  }
}

/**
 * La place d'une case du coffre, dans la grille visible.
 *
 * `decalage` est le reste du défilement — la part de ligne dont toute la
 * grille est remontée. Il vaut zéro quand on tombe pile sur une ligne.
 */
export function placeCase(
  plan: PlanArmurerie,
  rang: number,
  decalage = 0,
): [number, number, number] {
  const colonne = rang % plan.colonnes
  const ligne = Math.floor(rang / plan.colonnes)
  // La grille se cale en HAUT de sa zone : on lit un coffre de haut en bas, et
  // une grille centrée verticalement sauterait à chaque ligne qui s'ajoute.
  // En largeur, au contraire, elle se centre : le nombre de colonnes ne dépend
  // pas de ce qu'il y a dedans, donc rien ne bouge jamais.
  const x0 = plan.grille.x - (plan.colonnes * plan.pasX) / 2 + plan.pasX / 2
  const y0 = plan.grille.y + plan.grille.h / 2 - plan.pasY / 2
  return [x0 + colonne * plan.pasX, y0 - ligne * plan.pasY + decalage, Z_PLAN]
}

/**
 * LA CASE DU COFFRE SOUS CE POINT, ou `null` si le point tombe à côté.
 *
 * C'est `placeCase` à l'envers, et ça doit le rester : *deux calculs qui se
 * répondent doivent se lire l'un sous l'autre*, sinon le premier réglage de pas
 * les désaccorde. Le décalage continu du défilement entre dans les deux.
 */
export function caseSousLePoint(
  plan: PlanArmurerie,
  x: number,
  y: number,
  decalage = 0,
): number | null {
  const x0 = plan.grille.x - (plan.colonnes * plan.pasX) / 2 + plan.pasX / 2
  const y0 = plan.grille.y + plan.grille.h / 2 - plan.pasY / 2 + decalage
  const colonne = Math.round((x - x0) / plan.pasX)
  const ligne = Math.round((y0 - y) / plan.pasY)
  if (colonne < 0 || colonne >= plan.colonnes) return null
  // Une rangée de plus que ce qui tient : le défilement continu en montre
  // toujours une à moitié sortie, et on doit pouvoir y déposer.
  if (ligne < 0 || ligne >= plan.lignesTirees) return null
  // ON RESTE DANS LA CASE, pas seulement dans sa colonne : entre deux cases, le
  // dépôt ne vise personne, et *échanger avec un voisin qu'on n'a pas désigné
  // serait pire que ne rien faire.*
  const centre = [x0 + colonne * plan.pasX, y0 - ligne * plan.pasY]
  if (Math.abs(x - centre[0]!) > plan.tailleCoffre * 0.6) return null
  if (Math.abs(y - centre[1]!) > plan.tailleCoffre * 0.84) return null
  return ligne * plan.colonnes + colonne
}

/**
 * CE QUE L'ONGLET MONTRE — **et un seul filtre pour les deux mondes**.
 *
 * La scène place les cartes, l'interface dimensionne le pouce de la barre de
 * défilement : les deux ont besoin du même compte. *Deux filtres écrits
 * séparément se seraient désaccordés au premier onglet ajouté.*
 */
/**
 * UNE PILE DU COFFRE : un exemplaire montré, et combien il y en a derrière.
 *
 * Keko : « il faudrait regrouper par stack les objets qu'on a en double dans
 * le coffre, avec un petit compteur ». *Cinq potions occupaient cinq cases
 * d'une étagère où l'on CHERCHE* — et cinq fois le même dessin ne se lit pas
 * cinq fois plus vite, il se lit moins bien.
 *
 * `ids` porte TOUS les exemplaires, parce que ranger déplace la pile entière :
 * échanger deux représentants laisserait leurs doublures derrière eux.
 */
export type Pile<T> = { objet: T; nombre: number; ids: string[] }

/**
 * CE QUI FAIT DEUX OBJETS « LES MÊMES » : ce qu'ils MONTRENT.
 *
 * Pas leur identifiant — il est unique par exemplaire, et il le faut : tout se
 * désigne par id dans le hub, deux pièces qui partageraient le leur se
 * déplaceraient ensemble. Pas leur modèle non plus, qu'une pièce d'équipement
 * n'a pas. *La signature de la carte peinte dit exactement ce qu'on voit*, et
 * c'est déjà la clé du cache de textures : deux objets qui partagent une
 * texture sont, à l'oeil, le même objet.
 */
function empiler<T extends { id: string }>(liste: T[], cle: (o: T) => string): Pile<T>[] {
  const piles: Pile<T>[] = []
  const parCle = new Map<string, Pile<T>>()
  for (const objet of liste) {
    const k = cle(objet)
    const deja = parCle.get(k)
    if (deja === undefined) {
      const pile = { objet, nombre: 1, ids: [objet.id] }
      parCle.set(k, pile)
      piles.push(pile)
    } else {
      deja.nombre += 1
      deja.ids.push(objet.id)
    }
  }
  return piles
}

/**
 * CE QUE L'ONGLET MONTRE — **une seule liste, dans l'ordre du coffre.**
 *
 * Les pièces et les trésors ont vécu dans deux listes que la grille montrait à
 * la suite ; *un ordre d'affichage tiré de deux listes concaténées ne peut pas
 * les entrelacer*, donc on ne pouvait pas ranger un trésor entre deux armes.
 * Keko l'a demandé, et c'est le modèle qui a cédé : **le coffre est une
 * étagère, pas deux.**
 */
export function contenuDuCoffre(hub: Hub, onglet: Onglet): Pile<ContenuCoffre>[] {
  const garde = (o: ContenuCoffre): boolean => {
    if (onglet === 'tout') return true
    if (estTresor(o)) return onglet === 'tresors'
    if (onglet === 'armes') return 'mains' in o
    if (onglet === 'armures') return !('mains' in o) && !estConsommable(o)
    if (onglet === 'consommables') return estConsommable(o)
    return false
  }
  return empiler(hub.reserve.filter(garde), (o) =>
    signature(estTresor(o) ? aPeindre(o) : pieceAPeindre(o)),
  )
}

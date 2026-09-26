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
import { tailleBouton } from './Bouton3D.tsx'
import type { Objet } from '../logic/armes.ts'
import { estConsommable } from '../logic/armes.ts'
import type { Carte } from '../logic/combat.ts'
import type { Hub } from '../logic/hub.ts'
import { CAPACITE_PILE } from '../logic/hub.ts'

export const Z_PLAN = Z_MAIN



/**
 * LA TAILLE D'UNE CASE DE LA PILE EST IMPOSÉE PAR L'ARITHMÉTIQUE, pas choisie.
 *
 * Deux lignes de cases doivent tenir dans la hauteur d'un slot. Une carte fait
 * 1,4 fois sa largeur, donc deux cases de largeur `c` font `2,8 c` de haut ;
 * pour que ça vaille la hauteur d'un slot (1,4), il faut **`c = 1 / 2`**.
 */
export const PILE = 0.5

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
  /** Le bandeau du titre, en haut. */
  titre: Rect
  /** Le cadre du coffre, bandeau d'onglets compris. */
  coffre: Rect
  /** La bande des onglets, dans le coffre. */
  onglets: Rect
  /** La zone des cases, dans le coffre. */
  grille: Rect
  /** La barre de défilement, à droite de la grille. */
  barre: Rect
  colonnes: number
  lignes: number
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
  /** La colonne des stats, à droite : quatre cartouches empilés. */
  stats: Rect
  /** Le bouton de départ, sous les stats. */
  bouton: [number, number, number]
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
  const hTitre = demiHaut * 0.19
  // LE PIED N'EST PLUS QU'UNE MARGE : ce qu'il portait vit dans la colonne de
  // droite, et sa hauteur est revenue aux panneaux.
  const hPied = demiHaut * 0.07
  const hautPanneaux = demiHaut - hTitre - marge * 0.5
  const basPanneaux = -demiHaut + hPied
  const hPanneaux = hautPanneaux - basPanneaux
  const yPanneaux = (hautPanneaux + basPanneaux) / 2

  // TROIS COLONNES, ET C'EST LE COFFRE QUI CÈDE. Il est ce qu'on fouille, donc
  // il mérite la place — mais il la rend en LARGEUR plutôt qu'en lignes : une
  // colonne de cases en moins ne coûte presque rien, et elle paie la colonne
  // des stats. *Une colonne qui se remplit mérite la place, une colonne à
  // trois slots ne la réclame pas.*
  const largeurUtile = 2 * demiLarge - 2 * marge - 2 * marge
  // Les stats sont un rail de cartouches : leur largeur est celle de leur
  // contenu, pas une part du reste. On la borne pour qu'un grand écran ne
  // l'étire pas en panneau.
  // LA COLONNE FAIT AU MOINS LA LARGEUR DE SON BOUTON. Il vit dedans, et sa
  // largeur sort de son texte : trop étroite, la colonne le laissait déborder
  // sur l'équipement — *une colonne qui ne contient pas ce qu'on y met n'est
  // pas une colonne.* C'est aussi ce qui permet de grossir le bouton sans
  // rouvrir la collision.
  const lBouton = tailleBouton('Descendre', 'or', false, Z_PLAN, hauteurFenetrePx).largeur
  const lStats = Math.min(
    Math.max(largeurUtile * 0.15, lBouton * 1.14),
    largeurUtile * 0.3,
  )
  // LE COFFRE REND ENCORE UN PEU DE LARGEUR : l'équipement lui en demande,
  // maintenant que ses sept cartes sont à la même taille et tiennent sur
  // quatre colonnes.
  const lCoffre = (largeurUtile - lStats) * 0.55
  const lEquip = largeurUtile - lStats - lCoffre
  const xCoffre = -demiLarge + marge + lCoffre / 2
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
  const COLONNES_EQUIP = 3
  const RANGEES_EQUIP = 2
  const hDedans = hPanneaux - hEntete
  // La bande d'un nom de groupe. Il y en a une par rangée, et elles entrent
  // dans le calcul de la taille : un titre pris sur la place des cartes les
  // ferait déborder du panneau, exactement ce qui est arrivé sur téléphone.
  const hNom = Math.min(hDedans * 0.1, 0.34)
  const tailleCharge = Math.min(
    1,
    (lEquip - marge * 2) / (COLONNES_EQUIP * 1.12),
    (hDedans * 0.96 - RANGEES_EQUIP * hNom) / (RANGEES_EQUIP * 1.4 * 1.12),
  )

  // Une case, plus un cheveu : la grille doit respirer sans s'étaler.
  const pasX = tailleCharge * 1.16
  const pasY = tailleCharge * 1.4 * 1.12
  const barre: Rect = {
    x: xCoffre + lCoffre / 2 - padGrille - gouttiere / 2,
    y: grille.y,
    l: gouttiere * 0.44,
    h: grille.h,
  }
  const colonnes = Math.max(2, Math.floor(grille.l / pasX))
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
  const yDedans = yPanneaux + hPanneaux / 2 - hEntete - hDedans / 2
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
  const lArmes = (aDeuxMains ? 1 : 2) * pasCharge
  const xArmes = aDeuxMains ? place(0) : (place(0) + place(1)) / 2

  // LE BOUTON VIT SOUS LES STATS, dans la même colonne : c'est ce qu'on fait
  // une fois qu'on a lu ce qu'on emporte. Sa bande est réservée en haut de la
  // colonne, sinon le dernier cartouche s'assoirait dessus.
  const hBouton = Math.min(1, hPanneaux * 0.2)

  return {
    demiHaut,
    demiLarge,
    titre: { x: 0, y: demiHaut - hTitre / 2, l: 2 * demiLarge, h: hTitre },
    coffre,
    onglets,
    grille,
    barre,
    colonnes,
    lignes,
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
    // LA PILE EST UNE RANGÉE, centrée comme celle du haut. Elle a été un bloc
    // de deux par deux ; à trois cases, une seule ligne se lit d'un coup.
    pile: Array.from({ length: CAPACITE_PILE }, (_, i) => [
      xEquip + (i - (CAPACITE_PILE - 1) / 2) * pasCharge,
      yObjets,
      Z_PLAN,
    ]),
    nomArmes: { x: xArmes, y: yNomPorte, l: lArmes, h: hNom },
    nomArmure: { x: place(hautes - 1), y: yNomPorte, l: pasCharge, h: hNom },
    nomObjets: { x: xEquip, y: yNomObjets, l: CAPACITE_PILE * pasCharge, h: hNom },
    stats: { x: xStats, y: yPanneaux + hBouton / 2, l: lStats, h: hPanneaux - hBouton },
    bouton: [xStats, basPanneaux + hBouton / 2, Z_PLAN],
  }
}

/** La place d'une case du coffre, dans la grille visible. */
export function placeCase(
  plan: PlanArmurerie,
  rang: number,
): [number, number, number] {
  const colonne = rang % plan.colonnes
  const ligne = Math.floor(rang / plan.colonnes)
  // La grille se cale en HAUT de sa zone : on lit un coffre de haut en bas, et
  // une grille centrée verticalement sauterait à chaque ligne qui s'ajoute.
  // En largeur, au contraire, elle se centre : le nombre de colonnes ne dépend
  // pas de ce qu'il y a dedans, donc rien ne bouge jamais.
  const x0 = plan.grille.x - (plan.colonnes * plan.pasX) / 2 + plan.pasX / 2
  const y0 = plan.grille.y + plan.grille.h / 2 - plan.pasY / 2
  return [x0 + colonne * plan.pasX, y0 - ligne * plan.pasY, Z_PLAN]
}

/**
 * CE QUE L'ONGLET MONTRE — **et un seul filtre pour les deux mondes**.
 *
 * La scène place les cartes, l'interface dimensionne le pouce de la barre de
 * défilement : les deux ont besoin du même compte. *Deux filtres écrits
 * séparément se seraient désaccordés au premier onglet ajouté.*
 */
export function contenuDuCoffre(hub: Hub, onglet: Onglet): { pieces: Objet[]; tresors: Carte[] } {
  const estArme = (o: Objet): boolean => 'mains' in o
  const estArmure = (o: Objet): boolean => !('mains' in o) && !estConsommable(o)
  const pieces =
    onglet === 'tout'
      ? hub.reserve
      : onglet === 'armes'
        ? hub.reserve.filter(estArme)
        : onglet === 'armures'
          ? hub.reserve.filter(estArmure)
          : onglet === 'consommables'
            ? hub.reserve.filter(estConsommable)
            : []
  const tresors = onglet === 'tout' || onglet === 'tresors' ? hub.tresors : []
  return { pieces, tresors }
}

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
import type { Objet } from '../logic/armes.ts'
import { estConsommable } from '../logic/armes.ts'
import type { Carte } from '../logic/combat.ts'
import type { Hub } from '../logic/hub.ts'
import { CAPACITE_PILE } from '../logic/hub.ts'

export const Z_PLAN = Z_MAIN

/**
 * La taille d'une case du coffre, en fraction d'une carte de la main.
 *
 * **Elle a baissé de 0,52 à 0,44 pour gagner une ligne.** Keko : « il faudrait
 * plus de cases pour occuper la hauteur de l'écran ». *Une case plus petite ne
 * coûte rien à la lecture* — on cherche dans le coffre au cadre et à la
 * silhouette, on lit le détail en zoomant — et elle rend une rangée entière.
 */
export const REDUIT = 0.44

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
  /** La taille d'une pièce du chargement, en fraction d'une carte de la main. */
  tailleCharge: number
  /** Celle d'une case de la pile : la MOITIÉ, par arithmétique. */
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
  const lStats = Math.min(largeurUtile * 0.15, 2.05)
  const lCoffre = (largeurUtile - lStats) * 0.615
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

  // Une case, plus un cheveu : la grille doit respirer sans s'étaler.
  const pasX = REDUIT * 1.16
  const pasY = REDUIT * 1.4 * 1.12
  const barre: Rect = {
    x: xCoffre + lCoffre / 2 - padGrille - gouttiere / 2,
    y: grille.y,
    l: gouttiere * 0.44,
    h: grille.h,
  }
  const colonnes = Math.max(3, Math.floor(grille.l / pasX))
  const lignes = Math.max(2, Math.floor(grille.h / pasY))
  // LES LIGNES SE RÉPARTISSENT DANS LA HAUTEUR, elles ne s'empilent pas depuis
  // le haut : à pas fixe, il restait toujours une fraction de rangée en bas du
  // coffre — *un vide qui n'est le bord de rien se lit comme un oubli.* Le pas
  // s'étire donc jusqu'à remplir, sans jamais dépasser d'un tiers : au-delà,
  // ce ne serait plus une grille mais des cases éparpillées.
  const pasYPlein = Math.min(grille.h / lignes, pasY * 1.34)

  /**
   * L'ÉQUIPEMENT : deux mains sur une ligne, le torse et la pile sur l'autre.
   *
   * **LA PIÈCE SE DIMENSIONNE, ELLE N'EST PAS DE TAILLE FIXE.** Le champ
   * visible est plus PETIT en unités de scène sur un téléphone — la caméra n'y
   * recule pas, elle ne le fait que pour plafonner la taille des cartes sur
   * grand écran — donc un cadre qui tenait deux rangées de 1,4 sur un moniteur
   * n'en tenait plus qu'une et demie sur un téléphone : *les slots se
   * chevauchaient et débordaient par le bas.* Keko l'a vu tout de suite.
   *
   * On part donc de la PLACE et on en déduit la taille, jamais l'inverse —
   * deux contraintes, la plus dure gagne :
   *
   * - la hauteur, parce qu'il faut DEUX rangées de 1,4 plus leur air ;
   * - la largeur, parce qu'il faut DEUX colonnes plus la leur.
   *
   * Et jamais au-delà de 1 : le chargement se lit à la taille de la main, pas
   * plus grand. *C'est la même leçon que `--piece-equip` en 2D, où la hauteur
   * d'écran imposait déjà la taille des slots.*
   */
  const hEnteteEquip = hEntete
  const dedans = hPanneaux - hEnteteEquip
  const yDedans = yPanneaux + hPanneaux / 2 - hEnteteEquip - dedans / 2
  const tailleCharge = Math.min(
    1,
    (dedans * 0.94) / (2 * 1.4 * 1.06),
    (lEquip - marge * 2) / (2 * 1.12),
  )
  // LA CASE DE LA PILE FAIT LA MOITIÉ D'UNE PIÈCE, par arithmétique et non par
  // choix : deux lignes de cases doivent tenir dans la hauteur d'un slot, et
  // une carte fait 1,4 fois sa largeur, donc `c = P / 2` exactement.
  const taillePile = tailleCharge / 2
  const pasCharge = tailleCharge * 1.12
  const pasRangee = tailleCharge * 1.4 * 1.06
  const yMains = yDedans + pasRangee / 2
  const yArmure = yDedans - pasRangee / 2
  const xArme = aDeuxMains ? xEquip : xEquip - pasCharge / 2
  const pasPileX = taillePile * 1.1
  const pasPileY = taillePile * 1.4 * 1.06

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
    pasX,
    pasY: pasYPlein,
    equipement: { x: xEquip, y: yPanneaux, l: lEquip, h: hPanneaux },
    mains: [
      [xArme, yMains, Z_PLAN],
      [xEquip + pasCharge / 2, yMains, Z_PLAN],
    ],
    armure: [xEquip - pasCharge / 2, yArmure, Z_PLAN],
    tailleCharge,
    taillePile,
    pile: Array.from({ length: CAPACITE_PILE }, (_, i) => [
      xEquip + pasCharge / 2 + (i % 2 === 0 ? -pasPileX / 2 : pasPileX / 2),
      yArmure + (i < 2 ? pasPileY / 2 : -pasPileY / 2),
      Z_PLAN,
    ]),
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
  // La grille se cale en HAUT À GAUCHE de sa zone : on lit un coffre de haut
  // en bas, et une grille centrée sauterait à chaque ligne qui s'ajoute.
  const x0 = plan.grille.x - plan.grille.l / 2 + plan.pasX / 2
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

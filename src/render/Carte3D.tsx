/**
 * UNE CARTE, EN VOLUME.
 *
 * Un pavé très plat plutôt qu'un plan : une carte a une tranche, et c'est elle
 * qui fait qu'on la voit comme un objet posé et non comme une image collée.
 * La tranche capte la lumière quand la carte s'incline — c'est gratuit, et
 * c'est ce qui manque le plus à une carte en CSS.
 *
 * La face porte la texture peinte par `texture-carte.ts`, le dos et la tranche
 * portent le laiton du gabarit.
 *
 * **Les matériaux sont construits en JavaScript et passés en tableau**, et ce
 * n'est pas un détail de style : `<primitive>` ne monte un objet QU'UNE FOIS.
 * Les cinq faces de laiton déclarées comme cinq `<primitive>` du même matériau
 * se démontaient l'une l'autre, le tableau de matériaux du pavé finissait
 * troué, et **la scène restait noire sans une seule erreur en console**.
 *
 * **La carte ne décide pas d'où elle est.** Sa place, son inclinaison et sa
 * taille lui sont données ; elle les rejoint en s'amortissant. C'est ce qui
 * permet à la main de recalculer tout l'éventail à chaque geste sans que rien
 * ne saute — la même règle qu'en 2D, où le rendu se reconstruit entièrement.
 */
import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import { hauteurVisibleA } from './Cadrage.tsx'
import { geometrieDOnde, matiereDOnde, poserLOnde, poussiereDOnde } from './onde.tsx'
import type { CarteAPeindre } from './texture-carte.ts'
import { animationDeLEmoji, urlAnimationEmoji, type Animation } from './emoji-anime.ts'
import {
  DEBORD_AUREOLE,
  DEBORD_CONTOUR,
  eclatDe,
  METAL_3D,
  PART_DISQUE,
  textureNombre,
  signature,
  textureAureole,
  textureContour,
  peindreCarte,
  textureDeCarte,
  dosDe,
  textureDuDos,
  RAYON_CARTE,
  rayonDe,
  tailleQuIlFaut,
  tonDuLustre,
  TON_CREME,
  RAYON_SIMPLE,
  RAYONS_DANS_LA_CARTE,
  masqueDuSujetDe,
} from './texture-carte.ts'

/** La carte fait 1 de large ; le reste en découle, comme dans le gabarit. */
/** Ce que dure l'éclat d'une carte qui vient d'arriver, en secondes. */
export const DUREE_APPARITION = 0.4

export const LARGE = 1
export const HAUT = 1.4
/**
 * CE QUE LA PEINTURE D'UN APLAT AJOUTE EN ÉMISSIF, en part de l'albédo — voir
 * `aplat` dans `Carte3D`. *Le chiffre comble ce que l'éclairage du paquet
 * retire* : ses trois lampes ne rendent qu'environ 0,7 de l'albédo en Lambert
 * pur, donc 0,3 ramène la peinture à sa valeur. Mesuré sur le dos de carte
 * contre le sachet, qui montre la même peinture telle quelle.
 */
const COMPLEMENT_APLAT = 0.3
/**
 * LE GAIN DE SATURATION DE L'APLAT, en sortie du nuanceur — voir `aplat`.
 * *Le sachet ne montre pas sa peinture telle quelle* : son nuanceur multiplie
 * ses lampes par la couleur du film (un métal filtre son reflet), donc il
 * SATURE ce qu'il éclaire. Mesuré sur le bouquet : saturation moyenne 0,79 sur
 * le sachet contre 0,62 sur la carte, à clarté égale. C'est ce gain qui les
 * rapproche, et c'est lui qu'on règle si Keko les veut plus ou moins francs.
 */
export const SATURATION_APLAT = 0.4

const EPAISSEUR = 0.012

/**
 * LE NOMBRE D'EXEMPLAIRES : un chiffre dans un DISQUE, **à cheval sur le coin
 * bas-droit**.
 *
 * *Un disque n'a pas besoin qu'on lui réserve une place* : posé à cheval sur
 * le coin, moitié dedans moitié dehors, il ne recouvre rien. C'est le
 * raisonnement du chiffre des jauges, qui déborde sa barre plutôt que d'être
 * contenu par elle — et c'est ce qu'une case en forme de carte, plus grande et
 * alignée sur la carte, ne pouvait pas faire.
 *
 * Il reste posé EN PLUS de la texture, jamais peint dedans : *le nombre n'est
 * pas une propriété de l'objet, c'est une propriété de l'étagère* — une Potion
 * empilée et une Potion équipée partagent leur dessin.
 *
 * La valeur est le DIAMÈTRE du disque en part de carte.
 */
const CHIFFRE_PILE = 0.31
/** À cheval sur le coin : ce qu'il en garde DANS la carte. */
const DEDANS_PILE = 0.55

/**
 * CE QUE VAUT UN SURVOL QUI NE FAIT QUE DÉSIGNER.
 *
 * *Deux gestes qui font le même travail se règlent au même chiffre* : la carte
 * du coffre qui grossit sous le pointeur, et la loupe du zoom quand la carte
 * est DÉJÀ lisible — sur un écran de PC, une carte du deck ou du set d'une
 * pièce fait trois cents pixels, donc la loupe n'a plus rien à rendre lisible.
 * **Il ne lui reste qu'à dire laquelle on regarde, et une désignation n'a pas
 * besoin d'être un agrandissement.**
 *
 * Il vit ici parce que les deux écrans le lisent, et *une valeur écrite des
 * deux côtés se désaccorde au premier réglage.*
 */
export const GROSSIT_SURVOL = 1.14

/**
 * QUELLE PART DE LA CARTE LE DISQUE DOIT PRENDRE, sur un écran donné.
 *
 * *Le disque n'appartient pas à la carte, il appartient à l'interface* : c'est
 * un repère qu'on lit du coin de l'oeil, pas un élément du dessin. Réglé en
 * part de carte, il valait 14 px sur un téléphone — la taille validée — et
 * 48 px sur un écran de PC, où les cases font trois fois plus. Keko : « les
 * chiffres indiquant le nombre de cartes, la taille est bonne sur tél mais sur
 * PC c'est trop gros ».
 *
 * Il se compte donc en **rem**, comme tout le chrome du projet — mais le rem
 * seul l'a rendu trop discret sur un grand écran (Keko : « tu as trop réduit
 * sur le PC »), parce que la racine ne grandit que de moitié quand la carte
 * triple. *Ce qui est vrai des deux côtés, c'est que la vérité est entre les
 * deux* : on prend donc le PLUS GRAND des deux règles — une part de carte, et
 * une taille en rem — et le rem ne commande plus que sur les petits écrans,
 * là où la carte est si menue qu'une fraction ne suffirait pas.
 *
 * **Et les bornes restent en part de carte** : sous 12 % il cesserait d'être
 * lisible, au-dessus de 34 % il déborderait de la gouttière de la grille.
 */
export function tailleDuCompte(carteEnPx: number, rems = 0.9, plancher = 0.2): number {
  if (carteEnPx <= 0) return CHIFFRE_PILE
  const rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16
  return THREE.MathUtils.clamp(Math.max(plancher, (rems * rem) / carteEnPx), 0.12, 0.34)
}

/**
 * LE RAYON DES COINS — et il vient de la TEXTURE, il n'est plus écrit deux fois.
 *
 * Il valait `0.03` ici et `RAYON_CARTE` là-bas : **deux constantes
 * indépendantes pour une seule forme**, c'est-à-dire exactement le défaut que
 * le projet se répète — *deux endroits qui décrivent la même valeur se
 * désaccordent au premier réglage.* Il a fallu qu'un mode demande des coins
 * plus ronds pour qu'il morde.
 */
export const RAYON_COIN = RAYON_CARTE

/**
 * LA CULBUTE : ce que fait une pièce qu'on vient de poser dans un slot.
 *
 * Demandé par Keko — « elle grossit comme si on l'approchait de la caméra,
 * elle tourne plusieurs fois sur elle-même face/dos en plongeant d'un coup
 * vers le slot, et quand elle se fixe une onde d'énergie s'en échappe ».
 *
 * **Tout le poids vient du CONTRASTE DE VITESSE**, comme le bond des créatures
 * et la carte qui s'abat : elle monte lentement, marque le temps qu'il faut
 * pour qu'on la voie tourner, puis tombe d'un coup. Les deux phases ne durent
 * pas pareil — la chute fait un tiers du temps pour la moitié du trajet.
 */
export const DUREE_CULBUTE = 0.66

/**
 * LE FLIP : un demi-tour sur place, et rien d'autre.
 *
 * Keko : « j'aime pas trop l'animation de révélation de carte, un simple flip
 * serait mieux je pense ».
 *
 * *La culbute faisait bien le travail et c'était le mauvais geste* : elle monte
 * vers la caméra, grossit de moitié et fait DEUX tours entiers — **une mise en
 * scène d'équipement**, écrite pour une pièce qu'on claque dans un slot. Sur
 * une carte qu'on retourne, elle raconte un évènement là où il n'y a qu'un
 * geste. *Un flip ne déplace rien : on tourne la carte, on voit ce qu'il y a
 * derrière.*
 *
 * **ELLE N'EST PAS REMPLACÉE, elle est DOUBLÉE** : la culbute reste le geste de
 * l'armurerie, qui est une archive et que personne ne rejoue. *Une archive
 * qu'on retouche sans la rejouer est une archive qu'on casse.*
 */
export const DUREE_FLIP = 0.38

/**
 * LE DEVELOPPEMENT : ce que fait une carte qu'on vient de retourner.
 *
 * **C'EST UN TIRAGE PHOTOGRAPHIQUE** : elle arrive SUREXPOSEE, et l'image
 * remonte a mesure que la lumiere se resorbe par flaques. C'est l'autre facon
 * de reveler une carte, et elle dit quelque chose que la culbute ne dit pas :
 * *une culbute montre un dos puis une face, et entre les deux il n'y a que du
 * mouvement* — un developpement montre la carte qui ARRIVE.
 *
 * Elle dure plus longtemps qu'une culbute, et c'est le point : *une culbute
 * est un geste, un developpement est une lecture* — il faut le temps de voir
 * l'image monter.
 */
// DEUX FOIS PLUS VITE — Keko : « accélérer l'apparition des 5 cartes à la
// fin (positionnement et révélation plus rapide) ». Le développement ne se
// joue plus qu'au bilan, où les cinq cartes sont déjà connues : *on les
// relit, on ne les découvre pas*.
export const DUREE_DEVELOP = 0.75

/** La part du temps passée à monter et à tourner ; le reste est la chute. */
const PART_MONTEE = 0.64
/** De combien elle s'approche de la caméra, en part de sa propre largeur. */
const APPROCHE_CULBUTE = 1.15
/** Et de combien elle grossit en chemin. */
const ENFLE_CULBUTE = 0.5
/** Combien de tours entiers elle fait — face, dos, face. */
const TOURS_CULBUTE = 2

/**
 * À quelle distance de sa cible une carte est considérée comme ARRIVÉE.
 *
 * L'amortissement est asymptotique : elle n'atteint jamais exactement sa
 * place, donc il faut un seuil — un demi-centième de carte, soit moins d'un
 * pixel à l'écran.
 */
const SEUIL_ARRIVEE = 0.005

/** Ce que la carte regardée bascule quand le curseur va d'un bord à l'autre. */
export const INCLINAISON_REFLET = 0.34
/**
 * LE REBOND ÉLASTIQUE — voir `rebond`. L'amplitude du premier dépassement, la
 * pulsation (2π fois la fréquence : 2,4 oscillations par seconde), l'amorti
 * (à 4 par seconde, le troisième aller-retour n'est plus qu'un frisson), et la
 * durée au bout de laquelle on cesse de calculer. *Chiffres à l'oeil*, à
 * rejuger.
 */
const ELASTIQUE = { amplitude: 0.26, pulsation: 2 * Math.PI * 3.4, amorti: 5.5, duree: 1.1 } as const
/**
 * LE POMPAGE DE LA RÉVÉLATION — voir `pompe`. Un cran sous le rebond de
 * l'approche : *la carte encaisse la gerbe qu'elle crache*, elle ne bondit pas.
 */
/**
 * LE LIN TRESSÉ — Keko : « on peut travailler un peu les cartes pour leur
 * donner une texture plus intéressante ? Tu penses qu'on peut simuler le lin
 * tressé ? »
 *
 * *C'est le fini des vraies cartes à collectionner* : un gaufrage de fils
 * croisés pressé dans le carton, qui casse l'aplat de l'impression et accroche
 * la lumière quand on penche la carte. Il est fait AU NUANCEUR, sans image :
 * deux bruits étirés, l'un en fils horizontaux, l'autre en fils verticaux,
 * chacun irrégulier le long de son fil — *un tissage régulier se lit comme une
 * grille, le lin a des fils épais et des fils minces.*
 *
 * - au repos il module la peinture de quelques pour cent (`FORCE_LIN`) ;
 * - sous le reflet il se creuse : *le gaufrage ne se voit vraiment que quand
 *   la lumière rase* ;
 * - il s'efface quand un fil devient plus fin que le pixel, la règle du réseau
 *   du foil : *un détail trop fin pour l'écran doit disparaître, pas moirer.*
 *
 * Mode emoji seulement (`aplat`). `?lin=0` le retire, `?lin=0.2` le force.
 */
const FORCE_LIN = (() => {
  const v = new URLSearchParams(location.search).get('lin')
  const n = v === null ? NaN : Number(v)
  // RETIRÉ PAR DÉFAUT — Keko : « ça rend pas super finalement ». Le banc
  // reste : `?lin=0.09` le rend tel qu'il a été jugé.
  return Number.isFinite(n) ? n : 0
})()
/** Combien de fils sur la largeur de la carte. */
const FILS_LIN = 150

/**
 * LA BORDURE BRILLANTE — Keko : « on peut essayer de rendre la bordure
 * brillante à la place ? Comme les zones brillantes du booster ? »
 *
 * *C'est la recette du film du sachet, posée sur le cadre seul* : un grand
 * reflet qui se MULTIPLIE (il éclaircit sans délaver, la couleur du cran reste
 * lisible dessous), un éclat serré TEINTÉ (un métal filtre son reflet), et le
 * Fresnel au ras.
 *
 * **ET LE CADRE RESTE PLAT.** Une première version lui donnait un biseau
 * calculé, et Keko : « on dirait que le brillant est en 3D (bombé), je voulais
 * pas toucher au relief, juste lui donner le même effet glowy dans la
 * lumière ». La lumière n'est donc plus une affaire de normale bombée : c'est
 * la RÉFLEXION de la lampe clé du sachet (`lampe`, en haut à droite) sur la
 * face plate — le haut-droit du cadre brille, et la tache court quand la
 * carte penche. Plafonnée sous le seuil du bloom (`plafond`) : sinon elle
 * rayonne hors de la carte.
 *
 * La bande suit le rectangle arrondi de la carte (`RAYON_SIMPLE`), à
 * l'épaisseur de la bordure peinte (`CONTOUR_PLAQUE`). Mode emoji seulement ;
 * `?brillant=0` le retire.
 */
/**
 * LES RAYONS CLAIRS BRILLENT — Keko : « pour les faisceaux derrière l'emoji,
 * dans le fond, on pourrait rendre brillants les faisceaux clairs (et laisser
 * tels quels les foncés) ? »
 *
 * La même lumière que le cadre — la réflexion de la clé du sachet, qui se
 * multiplie et sature — mais sur un lobe plus large (`large`) : les rayons
 * couvrent toute la fenêtre, et *une tache serrée n'en allumerait qu'un.*
 * Les rayons sont retrouvés au nuanceur (`RAYONS_DANS_LA_CARTE`), le sticker
 * est épargné par son masque (`masqueSujet`). `?rayonsbrillants=0` les éteint.
 */
const AVEC_RAYONS_BRILLANTS = new URLSearchParams(location.search).get('rayonsbrillants') !== '0'
// À FOND, POUR ESSAI — Keko : « tu peux booster le brillant des rayons à fond
// pour test ». Avant : { large: 3, reflet: 1.6, sature: 1.2 }. Le plafond du
// bloom (BRILLANT.plafond) reste la seule borne.
const RAYONS_BRILLANTS = { large: 1.2, reflet: 5, sature: 3 } as const
/** Un masque blanc d'un pixel : la place du masque du sujet tant qu'il n'est pas là. */
const MASQUE_VIDE = (() => {
  const t = new THREE.DataTexture(new Uint8Array([255, 255, 255, 255]), 1, 1)
  t.needsUpdate = true
  return t
})()

const AVEC_BRILLANT = new URLSearchParams(location.search).get('brillant') !== '0'
/** L'épaisseur du cadre, en largeurs de carte : la bordure peinte de 2,7 U. */
const CONTOUR_PLAQUE = 0.027
const BRILLANT = {
  /** La clé du sachet, en espace vue : 45° dans le plan, en haut à droite, à 36,9° d'incidence. */
  lampe: [0.424, 0.424, 0.8],
  // PLUS GLOWY — Keko : « un effet plus glowy sur la bordure exposée à la
  // lumière ». Un lobe plus large et plus fort, une lueur qui rayonne vers
  // l'intérieur (`lueur`, sur `portee` largeurs), un plafond relevé.
  large: 6,
  serre: 40,
  reflet: 1.8,
  eclat: 1.2,
  /** De combien la partie éclairée pousse sa saturation au-delà de la peinture. */
  sature: 1.4,
  fresnel: 1.0,
  // L'ÉCLAT EST DE LA COULEUR DU CRAN, ET PLUS DU BLANC : voir `sature`.
  metal: 0.95,
  /** La luminance au-delà de laquelle le bloom ferait rayonner le cadre hors de la carte. */
  plafond: 0.9,
} as const

const POMPE_CARTE = { amplitude: 0.09, pulsation: Math.PI * 3, amorti: 7, duree: 0.8 } as const
/** L'ordre de rendu d'une carte au premier plan : après tout le reste — voir `devant`. */
const ORDRE_DEVANT = 10

/**
 * CE QU'UN ÉCRAN PEUT DIRE À UNE CARTE DE SON CURSEUR, quand c'est lui qui le
 * tient (`curseurPartage`). `x` et `y` en demi-largeurs et demi-hauteurs de
 * carte, de −0,5 à 0,5. `dessus` dit qu'on la regarde : elle s'incline, brille
 * et s'avance — *que ce soit un doigt, une souris ou le téléphone qu'on
 * bouge* (Keko : « quand on bouge la carte en bougeant le tel, il y ait la
 * lumière aussi comme avec le tap »). `tenu` dit qu'un POINTEUR la tient :
 * c'est ce que le gyroscope lit pour s'effacer derrière le doigt.
 */
export interface CurseurDeCarte {
  dessus: boolean
  x: number
  y: number
  tenu?: boolean
  /**
   * DOSE la lumière, de 0 à 1 (1 si absent) : *un pointeur allume en plein,
   * le téléphone allume d'autant qu'il penche* — Keko : « afficher le reflet
   * uniquement quand la carte est penchée, pas sur sa position neutre ou
   * proche ».
   */
  eclat?: number
}
/**
 * Et de combien elle s'avance vers le regard, EN PART DE SA LARGEUR.
 *
 * En unités de scène, la même avancée était un cheveu sur une carte zoomée et
 * un bond sur une case de coffre — *une distance absolue n'est pas une
 * distance : elle vaut ce que vaut l'objet autour d'elle.*
 */
const AVANCEE_REFLET = 0.05

/**
 * LA FEUILLE HOLOGRAPHIQUE : la force de la bande, et sa vitesse.
 *
 * **C'est le SEUL signal qui reste à une holo**, et c'est pour ça qu'elle est
 * plus franche que le lustre du survol (0,13) : *le diamant, lui, a trois
 * couches pour se dire* — son cadre irisé est peint dans la texture, son liseré
 * s'allume, son auréole déborde — alors que le bonus n'a plus que celle-ci.
 *
 * Elle AVANCE AVEC LE TEMPS tant qu'on ne la promène pas, et c'est la seconde
 * exception du jeu après l'auréole, pour la même raison : *une carte posée dans
 * un paquet ne bouge pas*, donc rien d'autre ne pourrait faire jouer sa
 * feuille. Au survol, c'est le curseur qui reprend la bande — **on la promène,
 * exactement comme celle du lustre.**
 */
const FORCE_HOLO = 0.28
const VITESSE_HOLO = 0.17

/**
 * LES PAILLETTES COSMOS DE LA FEUILLE HOLO. Keko : « on peut produire une
 * texture plus travaillée pour les cartes holographiques » — il a choisi les
 * paillettes « cosmos », sur toute la carte sauf l'emoji.
 *
 * ***Chaque paillette est un petit miroir penché au hasard***, et elle ne
 * s'allume que quand elle renvoie la lampe clé du sachet (celle de
 * `BRILLANT`) vers l'oeil. *C'est ce qui en fait une feuille et non un semis
 * peint* : au moindre penchant — doigt, souris, gyroscope — ce ne sont plus
 * les mêmes qui brillent. Deux couches : une poussière FINE de points, et de
 * rares GROSSES paillettes en étoile à quatre branches. Chacune prend sa
 * teinte du spectre, ramenée vers le blanc, et scintille un peu sur l'horloge
 * pour qu'une carte posée ne soit pas morte. L'emoji est épargné par le
 * masque du sujet (`masqueDuSujet`), comme pour les rayons brillants.
 *
 * `serre` est l'exposant du reflet : plus il est haut, plus une paillette doit
 * être exactement dans l'axe pour s'allumer, et moins il y en a d'allumées.
 */
const COSMOS = {
  fin: 40,
  gros: 14,
  partFin: 0.7,
  partGros: 0.45,
  dispersion: 0.35,
  serreFin: 30,
  serreGros: 18,
  /** Le rayon d'un point, en part de sa cellule. */
  rayonFin: 0.22,
  rayonGros: 0.14,
  force: 8,
  /**
   * SUR L'EMOJI, UN AUTRE EFFET QUE LA FEUILLE : son CERNE devient
   * arc-en-ciel. Keko : « sur l'emoji je voyais plutôt un effet différent du
   * reste de la carte pour la distinguer (autre que les paillettes) » — il a
   * choisi le cerne arc-en-ciel. *Le sticker reste un sticker* : le dessin
   * garde ses couleurs, c'est son contour qui est holographique.
   *
   * Le masque du sujet (96 px) est trop grossier pour isoler un contour de
   * 2,8 %, donc le cerne se reconnaît à SA COULEUR : le crème presque blanc
   * (`DOS_CREME`), dans la zone de l'emoji. Le blanc d'un dessin (un oeil,
   * un ballon) le prend aussi, et c'est accepté.
   *
   * `tour` dit combien de fois le spectre fait le tour de l'emoji, `lobe` la
   * finesse de l'éclat quand on le penche vers la lampe.
   */
  cerne: { couleur: 1, sature: 1.8, tour: 1, lobe: 5 },
}
const AVEC_COSMOS = new URLSearchParams(location.search).get('cosmos') !== '0'

/**
 * LA CARTE EST FAITE DE DEUX PIÈCES, et c'est ce qui donne les coins ronds.
 *
 * Une forme 2D aux coins arrondis, EXTRUDÉE de l'épaisseur, porte le laiton —
 * c'est le CORPS, avec sa tranche — et un plan posé un cheveu devant porte la
 * face peinte, dont les coins sont transparents (la texture est peinte dans
 * un rectangle arrondi, et `alphaTest` coupe ce qui est hors du dessin). Aux
 * coins, le plan laisse donc voir le laiton arrondi du corps : le cadre
 * déborde d'un cheveu, comme la coque du gabarit 2D.
 *
 * **Pas `RoundedBoxGeometry`, et ça a coûté un aller-retour** : elle arrondit
 * dans les TROIS dimensions et borne son rayon par la plus petite — ici
 * l'épaisseur, 0,012. Le rayon demandé (0,03) était écrasé à presque rien :
 * les coins du corps restaient droits pendant que la face, elle, était bien
 * arrondie. Keko : « on voit que la bordure a été arrondie, mais derrière une
 * autre forme dorée reste et est un angle droit ». *Une carte est une forme
 * plate avec une épaisseur, pas un volume aux arêtes molles* — l'extrusion
 * dit exactement ça.
 *
 * Pourquoi pas la face directement sur l'extrusion : ses UV sont en
 * coordonnées de scène, pas de 0 à 1, donc la texture s'y plaquerait de
 * travers. Le plan devant garde des UV propres.
 *
 * Les géométries sont partagées par toutes les cartes : elles ne changent
 * jamais.
 */
function formeDeCarte(r: number): THREE.Shape {
  const l = LARGE / 2
  const h = HAUT / 2
  const forme = new THREE.Shape()
  forme.moveTo(-l + r, -h)
  forme.lineTo(l - r, -h)
  forme.absarc(l - r, -h + r, r, -Math.PI / 2, 0, false)
  forme.lineTo(l, h - r)
  forme.absarc(l - r, h - r, r, 0, Math.PI / 2, false)
  forme.lineTo(-l + r, h)
  forme.absarc(-l + r, h - r, r, Math.PI / 2, Math.PI, false)
  forme.lineTo(-l, -h + r)
  forme.absarc(-l + r, -h + r, r, Math.PI, (3 * Math.PI) / 2, false)
  return forme
}

/**
 * UN CORPS PAR RAYON DE COIN, et il n'y en a que deux.
 *
 * **Ce n'est pas un pavé arrondi** : `RoundedBoxGeometry` borne son rayon à la
 * moitié de la plus petite dimension, donc sur une plaque de 0,012
 * d'épaisseur il tombe à 0,006 et le corps reste carré. *Pour une plaque mince,
 * on extrude un profil* — le piège silencieux déjà payé une fois.
 *
 * **Et il doit suivre la face**, sinon on voit aux coins le laiton d'un corps
 * plus carré : c'est le défaut que Keko avait signalé, « derrière une autre
 * forme dorée reste et est un angle droit ». Elles sont mémorisées, donc deux
 * objets pour tout le jeu.
 */
const CORPS = new Map<number, THREE.ExtrudeGeometry>()

function geometrieDuCorps(r: number): THREE.ExtrudeGeometry {
  let corps = CORPS.get(r)
  if (corps === undefined) {
    corps = new THREE.ExtrudeGeometry(formeDeCarte(r), {
      depth: EPAISSEUR,
      bevelEnabled: false,
      curveSegments: 8,
    })
    // L'extrusion part de z = 0 vers l'avant : on la recentre sur l'épaisseur,
    // pour que la face posée à +EPAISSEUR/2 affleure bien le corps.
    corps.translate(0, 0, -EPAISSEUR / 2)
    CORPS.set(r, corps)
  }
  return corps
}
const GEOMETRIE_FACE = new THREE.PlaneGeometry(LARGE, HAUT)
/** Libère une toile de l'animé, et le masque du sujet qu'elle porte. */
function libererToile(t: THREE.Texture | null): void {
  const masque = t?.userData.masqueSujet as THREE.Texture | undefined
  masque?.dispose()
  t?.dispose()
}
/** Le contour de l'onde : la forme de la carte, creusée. Partagée par toutes. */
const GEOMETRIE_ONDE = geometrieDOnde(LARGE, HAUT, RAYON_COIN)

type Props = {
  carte: CarteAPeindre
  position: [number, number, number]
  /** Inclinaison voulue, en radians. */
  rotation?: [number, number, number]
  taille?: number
  /**
   * LA TAILLE SUR LAQUELLE SE CHOISIT LA TOILE, quand ce n'est pas la
   * courante.
   *
   * *Une carte qui n'est pas encore sortie est déjà là* : au paquet, les
   * quatre suivantes attendent à taille ZÉRO derrière celle qu'on regarde,
   * donc elles peindraient leur face sur la plus petite toile du jeu pour la
   * repeindre en grand dès que leur tour vient. **Cinq repeintures dans la
   * même image font un gel**, et c'est ce que Keko lisait à l'ouverture.
   *
   * On peint donc UNE FOIS, à la plus grande taille qu'elle atteindra. *Le
   * travail ne se supprime pas, il se DÉPLACE* — et il se déplace là où rien
   * ne presse, pendant que le sachet se balance.
   */
  tailleTexture?: number
  /** Vitesse de rattrapage. Plus haut = plus sec. */
  ressort?: number
  /**
   * La vitesse de rattrapage de la PROFONDEUR, quand elle doit être plus vive
   * que le reste.
   *
   * **La profondeur n'est pas une position, c'est un ordre** : une carte est
   * devant sa voisine ou elle ne l'est pas. Amortie au même rythme que le
   * mouvement, elle traîne — la carte survolée avait repris sa place dans
   * l'éventail que sa voisine ne repassait devant elle qu'un instant après.
   * Keko : « elle repasse un peu tard à sa position en depth ».
   *
   * Reste réglable plutôt que fixé, parce que les grands déplacements en z —
   * la carte qu'on regarde de près, celle qu'on tient — ont besoin, eux, de
   * voyager avec le reste.
   */
  ressortZ?: number
  /**
   * UN JETON QUI DIT « CETTE FOIS, NE GLISSE PAS ».
   *
   * L'amortissement est juste quand une carte VA quelque part — on la suit du
   * regard. Il ment quand c'est le CONTENU qui change sous elle : le coffre
   * qui défile d'une ligne garde ses cartes du milieu, qui glissaient donc
   * vers le haut, pendant que la ligne entrante naissait déjà en place. Keko :
   * « la ligne du bas change de cartes instantanément tandis que les deux
   * autres au-dessus se déplacent ».
   *
   * *Une grille qui défile par lignes tourne une page, elle ne fait pas un
   * travelling.* Dès que ce jeton change, la carte se pose d'un coup à sa
   * place — et tout le monde saute ensemble.
   */
  saut?: unknown
  /**
   * DE QUOI LA COUPER AU BORD DE SA FENÊTRE.
   *
   * Le coffre défile en continu : ses rangées du haut et du bas sont à moitié
   * sorties du meuble, et *une carte qui déborde de son cadre ne se lit plus
   * comme rangée dedans.* Les plans sont donnés par l'écran qui la montre —
   * une carte ne sait pas ce qui la borne.
   */
  clipper?: THREE.Plane[] | null
  /**
   * La carte est au-dessus de la zone qui la joue : elle s'allume et frémit.
   *
   * **C'est le seul repère possible ici**, et c'est la règle du jeu 2D : la
   * zone qui déclenche n'a pas de bord à surligner — elle est tout l'écran
   * au-dessus de la main — donc le repère doit voyager avec le doigt.
   */
  engagee?: boolean
  /**
   * Elle peut être jouée maintenant. Une carte trop chère reste **saisissable
   * et zoomable** — on veut pouvoir la ranger et la regarder — mais elle
   * s'éteint, et lâcher ne déclenche rien.
   */
  jouable?: boolean
  /**
   * Elle porte son ombre. Vrai partout sauf pour une carte qui flotte SEULE
   * au-dessus du décor : son ombre tombe alors en plein champ, loin d'elle,
   * et ne se lit plus comme une ombre mais comme une tache noire. *Une carte
   * de la main s'en tire parce que ses voisines reçoivent la sienne.*
   */
  ombre?: boolean
  /**
   * Elle est en train de se faire jeter : **le contour passe au ROUGE, et la
   * carte reste ENTIÈRE.**
   *
   * Elle a été assombrie et désaturée dans le jeu 2D, et Keko l'a repris : « au
   * lieu de la foncer, on devrait mettre une lueur rouge autour ». Une carte
   * éteinte se lit comme déjà perdue, alors qu'elle ne l'est pas — et on doit
   * pouvoir la LIRE avant de valider.
   *
   * Elle ne frémit pas : le frémissement dit « lâche et ça part », c'est le
   * vocabulaire d'un geste en cours. Une carte posée dans le rebut attend, elle
   * ne s'impatiente pas.
   */
  peril?: boolean
  /**
   * EST-ELLE VERROUILLÉE ? Le prêt de l'armurier.
   *
   * Keko : « on ne peut pas prendre l'arme ou l'armure de prêt et la placer
   * dans le coffre — on va mettre un effet visuel qui indique son
   * verrouillage ». *Un refus silencieux se lit comme une panne*, et c'est la
   * règle du projet depuis les cartes injouables de la main.
   *
   * **Un contour BLEU ARGENTÉ qui ne respire pas**, là où celui de
   * l'engagement pulse en or : *un état qui dit « figé » ne peut pas
   * scintiller*, et une couleur froide ne peut pas se confondre avec l'or de
   * ce qui engage. Tranché par Keko — et **la case du prêt porte le même
   * bleu**, pour que le bouton et l'équipement se répondent.
   */
  verrou?: boolean
  /**
   * Elle montre son DOS et non sa face. Le dos est peint par le même module,
   * depuis la même anatomie : *c'est la même carte vue de l'autre côté*, pas
   * un second objet.
   */
  dos?: boolean
  /**
   * L'instant où elle vient d'arriver dans la main, en secondes d'horloge de
   * la scène.
   *
   * **ELLE NAÎT LUMINEUSE ET PREND SON IMAGE ENSUITE** — Keko : « la carte
   * apparaît lumineuse et prend son image ensuite, un truc fluide ». La
   * traînée de particules meurt à l'endroit exact où elle se forme, donc la
   * lumière fait la couture entre les deux : *sans elle, la carte
   * apparaîtrait, ce qui est précisément ce qu'on voulait éviter.*
   *
   * Elle naît À SA PLACE, avec l'inclinaison de l'éventail — c'est tout
   * l'intérêt de ne plus faire voyager la carte elle-même : une carte qu'on
   * déplace arrive droite et bascule après coup.
   */
  apparue?: number | null
  /**
   * ELLE RÉPOND AU CURSEUR : elle s'incline sous lui, s'avance d'un cheveu, et
   * un lustre balaie sa face là où il se pose.
   *
   * Demandé par Keko pour la carte qu'on regarde de près — « un effet qui
   * bouge les cartes en 3D quand elles sont zoomées et qu'on passe le curseur
   * dessus, avec de la brillance ». *C'est le seul écran où l'on REGARDE une
   * carte sans rien en faire* : ailleurs le pointeur sert à la prendre, et
   * une carte qui bascule sous le doigt au moment où on la saisit serait du
   * bruit.
   *
   * **Souris seulement.** Au doigt le `pointerout` n'arrive jamais — la carte
   * resterait penchée après la tape — et c'est la règle déjà écrite pour tout
   * survol du projet.
   */
  reflet?: boolean
  /**
   * LE REFLET RÉPOND AUSSI AU DOIGT, tant que celui-ci est POSÉ dessus.
   *
   * Demandé par Keko : « sur tél, quand on zoome sur une des cartes ajoutées,
   * on peut faire l'effet de mouvement / brillance ? »
   *
   * *Ce n'est pas une exception à la règle du survol, c'en est l'application* :
   * si le survol est réservé à la souris, c'est parce qu'au doigt le
   * `pointerout` n'arrive jamais et que la carte resterait penchée. Ici
   * l'écran sait exactement quand le doigt se lève — c'est lui qui a armé le
   * maintien — donc il coupe, et le défaut n'existe pas.
   */
  refletAuDoigt?: boolean
  /**
   * ELLE PASSE DEVANT TOUT, QUELLE QUE SOIT SA PROFONDEUR. Keko, sur la carte
   * qui sort du défilé : « en fonction de l'inclinaison elle traverse celle de
   * derrière : on devrait la faire passer complètement au premier plan lors
   * du slide ». *Une saillie en z ne peut pas gagner contre tous les angles* —
   * la pile penche, la passée se redresse, et il reste toujours un penchant où
   * les deux plans se croisent. Dessinée EN DERNIER, après avoir effacé la
   * profondeur, elle recouvre tout ce qui a été dessiné avant : la face garde
   * son test de profondeur contre son propre corps, et rien d'autre ne peut
   * la couper.
   */
  devant?: boolean
  /**
   * UN JETON QUI DIT « TU VIENS D'ÊTRE POSÉE DANS UN SLOT » : la carte joue
   * alors sa culbute et se moque de l'amortissement.
   *
   * **C'EST UN JETON, PAS UN INSTANT**, et ça a coûté une fausse piste : un
   * instant lu dehors (`lireHorloge`) peut être en retard de plusieurs
   * secondes sur `clock.elapsedTime` — *l'horloge qui compte est celle de la
   * scène, et seule la scène la connaît.* La carte note donc elle-même quand
   * la culbute commence, comme `saut` lui fait sauter sa place.
   *
   * Elle montre son DOS en tournant : un plan de plus, monté pour l'occasion
   * seulement. *Une carte qui tourne sans verso n'est pas une carte, c'est une
   * image qui disparaît un temps sur deux.*
   */
  culbute?: unknown
  /**
   * LE REBOND ÉLASTIQUE : un jeton, comme la culbute. Quand il change, la
   * carte oscille autour de sa taille — une sinusoïde amortie, continue, qui
   * se pose d'elle-même (`ELASTIQUE`). Keko : « l'effet bounce va et vient et
   * est un peu abrupt, on peut lui donner un aspect plus élastique ? » *Des
   * cibles qui se suivent changent de direction d'un coup* ; un élastique ne
   * change jamais de direction d'un coup, il ralentit avant de repartir.
   */
  rebond?: unknown
  /**
   * UN JETON DE POMPAGE : quand il change, la carte gonfle d'un coup et
   * retombe — Keko : « un petit effet de pump sur la carte au moment où les
   * particules sont générées à sa révélation ». Il se cumule au rebond.
   */
  pompe?: unknown
  /** De combien elle gonfle, en part de sa taille : `POMPE_CARTE.amplitude` par défaut. */
  amplitudePompe?: number
  /**
   * SON FLIP : le même jeton, pour un simple demi-tour sur place.
   *
   * ***LE DEMI-TOUR PART DE DOS, ET C'EST CE QUI LE REND INVISIBLE AU
   * RACCORD.*** Au moment où il commence, la carte montre déjà son dos sur sa
   * face AVANT ; on la bascule donc d'un coup à `π` — on voit alors son VERSO,
   * qui porte la même texture de dos — puis on tourne de `π` à `2π`. *Le saut
   * ne se voit pas parce que les deux surfaces montrent la même chose*, et à
   * l'arrivée la face avant, qui porte la carte depuis le premier instant,
   * revient devant.
   *
   * **Un demi-tour franc est donc possible sans jamais échanger de texture** —
   * l'astuce classique du flip, et elle tombe ici d'elle-même.
   */
  flip?: unknown
  /**
   * SON DEVELOPPEMENT : le meme jeton, pour l'autre facon de se reveler.
   *
   * **La prop ABSENTE veut dire « pas de developpement »**, et c'est elle qui
   * decide si le pave du nom se charge : *le temps de regarder un dos est
   * exactement le temps qu'il faut pour peindre ce qui vient dessus* — la
   * lecon de la carte face cachee qui peignait sa face trop tard.
   */
  developpe?: unknown
  /**
   * Sa culbute vient de finir : elle est fixée, et l'onde part.
   *
   * **Elle dit ce qui se passe, pas ce que ça veut dire.** Le son de
   * l'équipement appartient à l'armurerie, pas à la carte — même partage que
   * `geste-carte.ts`, où le hook annonce « tapée », « lâchée ici », et laisse
   * l'écran décider. *C'est ce qui permet à la même carte de servir en combat,
   * au butin et au hub sans rien savoir d'eux.*
   */
  onFixee?: () => void
  /**
   * Elle a fini de se déplacer : elle est VISUELLEMENT à sa place.
   *
   * Ce n'est pas `onFixee`, qui marque l'instant d'un choc ; c'est la fin du
   * mouvement, culbute ou simple glissement amorti. *L'état du jeu change au
   * lâcher, la carte met encore un moment à y arriver* — et il y a des choses
   * qu'on ne doit pas effacer avant qu'elle soit posée.
   */
  onArrivee?: () => void
  /**
   * ELLE NE RÉPOND PLUS AU POINTEUR : ni tape, ni glisser, ni survol.
   *
   * Le temps qu'une mise en scène se joue, la carte n'est plus un objet qu'on
   * manipule — Keko : « durant l'animation, il faut que la carte devienne non
   * cliquable, sinon tu peux la recliquer, la draguer, etc. » *Une carte qu'on
   * peut reprendre en plein vol est une carte à deux endroits à la fois.*
   */
  inerte?: boolean
  /**
   * COMBIEN D'EXEMPLAIRES IDENTIQUES CETTE CARTE REPRESENTE — au coffre, la
   * pile. Rien en dessous de deux : *une mention qui dit « il y en a un » ne
   * dit rien.*
   *
   * Keko : « il faudrait regrouper par stack les objets qu'on a en double dans
   * le coffre, avec un petit compteur ». Elle est posee EN PLUS de la texture
   * et jamais peinte dedans, pour la raison qui vaut partout ici : **la meme
   * carte partout.** Une Potion empilee et une Potion equipee doivent
   * partager leur dessin, donc leur texture — et le compte n'est pas une
   * propriete de l'objet, c'est une propriete de l'etagere.
   */
  pile?: number
  /**
   * LE DIAMÈTRE DU DISQUE, en part de la carte — **et il n'est pas le même
   * partout.**
   *
   * *Un symbole ne se règle pas à la taille où on le dessine, mais à celle où
   * on le regarde* : la règle est déjà écrite pour le médaillon du dos, plus
   * grand sur un tas que sur une carte. Une case du coffre ne fait que 46 px
   * de large sur un téléphone, donc le chiffre doit y prendre beaucoup de
   * place ; dans le zoom la carte en fait quatre fois plus.
   */
  pileTaille?: number
  /**
   * LE CURSEUR D'UNE AUTRE CARTE, quand deux n'en font qu'une à l'oeil.
   *
   * Une pile du coffre est dessinée en deux cartes — celle du dessus et son
   * épaisseur — mais elle se regarde comme un seul objet : les deux lisent
   * donc le même curseur et s'inclinent ensemble.
   */
  curseurPartage?: CurseurDeCarte
  onPeinte?: () => void
  onPointerDown?: (e: ThreeEvent<PointerEvent>) => void
  onPointerOver?: (e: ThreeEvent<PointerEvent>) => void
  onPointerOut?: (e: ThreeEvent<PointerEvent>) => void
}

export function Carte3D({
  carte,
  position,
  rotation = [0, 0, 0],
  taille = 1,
  tailleTexture,
  ressort = 9,
  ressortZ,
  engagee = false,
  jouable = true,
  ombre = true,
  peril = false,
  verrou = false,
  dos = false,
  saut = null,
  clipper = null,
  apparue = null,
  reflet = false,
  refletAuDoigt = false,
  devant = false,
  culbute = null,
  flip = null,
  rebond = null,
  pompe = null,
  amplitudePompe = POMPE_CARTE.amplitude,
  developpe,
  onFixee,
  onArrivee,
  inerte = false,
  pile,
  pileTaille = CHIFFRE_PILE,
  curseurPartage,
  onPeinte,
  onPointerDown,
  onPointerOver,
  onPointerOut,
}: Props): React.JSX.Element {
  const groupe = useRef<THREE.Group>(null)
  const corpsMesh = useRef<THREE.Mesh>(null)
  const faceMesh = useRef<THREE.Mesh>(null)
  /**
   * AU PREMIER PLAN : le corps se dessine après tout le reste, en effaçant la
   * profondeur juste avant, et la face juste après lui — voir `devant`. Le
   * rendu des ombres passe par une cible à part, et on n'y efface rien.
   */
  useEffect(() => {
    const c = corpsMesh.current
    const f = faceMesh.current
    if (c === null) return
    c.renderOrder = devant ? ORDRE_DEVANT : 0
    if (f !== null) f.renderOrder = devant ? ORDRE_DEVANT + 1 : 0
    // ON EFFACE LA PROFONDEUR PARTOUT SAUF DANS UNE PASSE D'OMBRE — et c'est
    // le MATÉRIAU qui le dit, pas la cible. Keko, après le bloom : « on a
    // toujours le problème de carte qui se traverse ». *Le garde-fou testait
    // « la cible est l'écran »* ; depuis le bloom la scène se rend dans une
    // cible, donc la correction ne jouait plus jamais. Une passe d'ombre se
    // reconnaît à son matériau de profondeur.
    c.onBeforeRender = devant
      ? (renderer, _scene, _camera, _geometrie, materiau) => {
          const m = materiau as THREE.Material & {
            isMeshDepthMaterial?: boolean
            isMeshDistanceMaterial?: boolean
          }
          if (m.isMeshDepthMaterial !== true && m.isMeshDistanceMaterial !== true) {
            renderer.clearDepth()
          }
        }
      : () => undefined
  }, [devant])
  // LA FACE, LE CORPS ET LE DOS LISENT LE MÊME RAYON : voir `rayonDe`.
  const rayon = rayonDe(carte)
  /**
   * UN EMOJI EST UN APLAT, ET SA CARTE NE DOIT PAS ÊTRE DÉLAVÉE PAR LA LUMIÈRE.
   *
   * Keko : « j'ai l'impression que les couleurs des cartes sont beaucoup plus
   * fades que celles du booster ». *Et c'était mesuré* : le visage qui rit du
   * bouquet sort à 153 / 133 / 70 sur le dos de carte et à 202 / 192 / 45 sur
   * le sachet — la MÊME peinture, saturation 0,56 contre 0,83.
   *
   * **Deux choses le délavaient, et plus de lumière n'en corrigeait aucune**
   * (essayé, mesuré : l'ambiant triplé rend la carte plus claire, pas plus
   * saturée) :
   * - le REFLET BLANC du matériau standard — metalness 0,15 et roughness 0,55
   *   font un lobe large qui pose un cinquième de blanc sur toute la face.
   *   *Un reflet blanc désature tout ce qu'il touche*, et un emoji n'accroche
   *   pas la lumière : il n'a pas de reflet à avoir ;
   * - l'éclairage lui-même, qui ne rend que les deux tiers de l'albédo, avec
   *   la teinte de la lampe d'appoint bleue par-dessus.
   *
   * Le sachet, lui, montre sa peinture telle quelle dans son nuanceur — c'est
   * la référence que Keko a validée. La face et le verso passent donc en
   * LAMBERT PUR (plus de reflet), et la peinture S'AJOUTE EN ÉMISSIF de
   * `COMPLEMENT_APLAT` pour rendre ce que l'éclairage retire : la lumière
   * garde son modelé quand la carte s'incline, la couleur garde sa pureté.
   * Le lustre du survol, le foil et la feuille holo vivent dans le nuanceur
   * injecté et ne bougent pas.
   *
   * *Mode emoji seulement*, comme le contour, le rayon et le dos : l'archive
   * garde sa plaque de métal, qui elle accroche la lumière.
   */
  const aplat = carte.contour === 'simple'
  const { size, viewport } = useThree()
  const dpr = viewport.dpr

  /**
   * LE DISQUE DU COMPTE A SON MATÉRIAU, et non plus un matériau en ligne : *il
   * faut pouvoir lui poser les plans de découpe*, et un matériau déclaré dans le
   * JSX se recrée sans qu'on puisse le recompiler. Il déborde du coin de la
   * carte, donc il survivait à la coupe du coffre comme l'auréole.
   */
  const matCompte = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        transparent: true,
        // IL N'ÉCRIT PAS DE PROFONDEUR : son plan déborde de la carte, et *ce
        // qui est transparent ne doit rien cacher.*
        depthWrite: false,
        toneMapped: false,
      }),
    [],
  )
  const { face, laiton, halo, verso, aureole } = useMemo(() => {
    // LA FACE D'UN APLAT N'A PAS DE REFLET : voir `aplat`, plus haut.
    const reflet = aplat ? { roughness: 1, metalness: 0 } : { roughness: 0.55, metalness: 0.15 }
    const laiton = new THREE.MeshStandardMaterial({
      // LA TRANCHE SUIT LE CADRE. La coque peinte prend la teinte de la
      // rareté ; si le corps restait laiton, l'épaisseur trahirait le métal
      // d'à côté dès que la carte s'incline — *un objet n'est pas fait de deux
      // matières sur deux millimètres.*
      color: METAL_3D.commune,
      metalness: 0.85,
      roughness: 0.38,
      emissive: '#ffcf7a',
      emissiveIntensity: 0,
    })
    // La couleur MULTIPLIE la texture : elle vaut blanc quand la carte est
    // jouable, et c'est elle qui l'assombrit sinon.
    const face = new THREE.MeshStandardMaterial({
      // SOMBRE TANT QUE LA TEXTURE N'EST PAS LÀ. En blanc, une carte dont la
      // peinture tarde ou échoue est une dalle éclatante au milieu de la main,
      // et on croit à un bug de rendu plutôt qu'à une image manquante — c'est
      // la règle déjà écrite pour les créatures. Le `useFrame` rend sa couleur
      // à la carte dès que sa texture arrive.
      color: '#1b1a22',
      ...reflet,
      // L'émissif est l'OR de l'apparition — ou le BLANC de l'aplat, qui y
      // ajoute sa propre peinture (voir `aplat`).
      emissive: aplat ? '#ffffff' : '#ffcf7a',
      emissiveIntensity: 0,
      // Les coins de la texture sont transparents : on les coupe franchement
      // plutôt que de les fondre, sinon la face se mélangerait au laiton.
      alphaTest: 0.5,
    })

    // UNE CARTE INJOUABLE PASSE EN NOIR ET BLANC, pas seulement en sombre.
    // Keko : « il faudrait que la carte soit vraiment en noir et blanc ».
    // Assombrir ne suffit pas : une carte sombre se lit comme une carte mal
    // éclairée, alors qu'une carte désaturée se lit comme une carte hors jeu —
    // c'est le `grayscale` du jeu 2D.
    //
    // **Un matériau ne sait pas désaturer**, donc on le lui apprend : trois
    // lignes injectées dans son nuanceur, pilotées par un uniforme. C'est
    // gratuit en mémoire, là où peindre une seconde texture grise par modèle
    // doublerait le budget — et la mémoire de texture est justement ce qui
    // coince sur un téléphone.
    /**
     * LE LUSTRE VIT DANS LE NUANCEUR, PAS DANS UN PLAN POSÉ DESSUS.
     *
     * Une bande claire oblique qui balaie la face quand le curseur s'y
     * promène. Un second plan aurait demandé sa propre texture PAR CARTE
     * (pour lui donner son propre décalage) et un masque à la forme des coins
     * arrondis ; trois lignes de nuanceur ne coûtent rien et se plaquent
     * exactement sur ce qui est peint.
     *
     * **La varying est la NÔTRE, pas `vMapUv`.** Celle de three n'existe que
     * si la map est là AU MOMENT DE LA COMPILATION — or la texture d'une
     * carte arrive plus tard, de façon asynchrone : le shader ne compilerait
     * pas au premier rendu. `uv`, lui, est toujours déclaré.
     *
     * Le lustre s'ajoute à `diffuseColor` AVANT le test d'alpha, donc il
     * n'allume jamais les coins transparents.
     */
    face.onBeforeCompile = (nuanceur) => {
      nuanceur.uniforms.uGris = { value: 0 }
      nuanceur.uniforms.uSature = { value: 0 }
      nuanceur.uniforms.uLustre = { value: 0.5 }
      nuanceur.uniforms.uLustreForce = { value: 0 }
      nuanceur.uniforms.uIris = { value: 0 }
      nuanceur.uniforms.uHolo = { value: 0 }
      nuanceur.uniforms.uTonLustre = {
        value: new THREE.Vector3(TON_CREME[0], TON_CREME[1], TON_CREME[2]),
      }
      nuanceur.uniforms.uBordure = { value: 0 }
      nuanceur.uniforms.uTemps = { value: 0 }
      nuanceur.uniforms.uDevelop = { value: 0 }
      nuanceur.uniforms.uLin = { value: aplat ? FORCE_LIN : 0 }
      nuanceur.uniforms.uBrillant = { value: aplat && AVEC_BRILLANT ? 1 : 0 }
      nuanceur.uniforms.uRayons = { value: 0 }
      nuanceur.uniforms.uMasqueSujet = { value: MASQUE_VIDE }
      face.userData.nuanceur = nuanceur
      nuanceur.vertexShader = `varying vec2 vLustreUv;
${nuanceur.vertexShader}`.replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
         vLustreUv = uv;`,
      )
      nuanceur.fragmentShader = nuanceur.fragmentShader.replace(
        '#include <map_fragment>',
        `#include <map_fragment>
         float luminance = dot(diffuseColor.rgb, vec3(0.2126, 0.7152, 0.0722));
         // LE CRÈME DU CERNE des stickers : voir COSMOS.cerne. *Pas le blanc,
         // le CRÈME* — Keko : « tout le blanc de l'emoji est remplacé par
         // l'arc-en-ciel, il faudrait le limiter au blanc de l'outline ». Le
         // cerne est #fffaf0, soit en linéaire 1 / 0,955 / 0,871 : il lui
         // manque environ 0,13 de bleu, là où les blancs d'un emoji sont
         // NEUTRES (écart presque nul). C'est cet écart qui le signe.
         float ecartCreme = diffuseColor.r - diffuseColor.b;
         float blancTexture = smoothstep(0.88, 0.95, diffuseColor.r)
           * smoothstep(0.80, 0.84, diffuseColor.b)
           * smoothstep(0.07, 0.10, ecartCreme)
           * (1.0 - smoothstep(0.17, 0.22, ecartCreme));
         diffuseColor.rgb = mix(diffuseColor.rgb, vec3(luminance), uGris);
         float bande = (vLustreUv.x + vLustreUv.y) * 0.5;

         // L'IRISATION : elle tourne avec l'ANGLE DE VUE, pas avec le temps.
         // C'est ce qui sépare un hologramme d'un arc-en-ciel peint — la
         // couleur ne bouge que si l'objet bouge.
         float incidence = 1.0 - abs(dot(normalize(vViewPosition), normalize(vNormal)));
         float trame = vLustreUv.x * 0.62 + vLustreUv.y * 0.38;
         float teinte = fract(trame * 1.15 + incidence * 1.9 + uLustre * 0.4);
         vec3 arc = 0.5 + 0.5 * cos(6.28318 * (teinte + vec3(0.0, 0.33, 0.67)));
         // LE RÉSEAU : de fines stries, comme celles qui font la diffraction
         // d'un vrai foil — *sans elles on lit un dégradé, pas un métal
         // gravé* — ET IL S'EFFACE QUAND IL DEVIENT PLUS FIN QUE LE PIXEL.
         //
         // Une case de coffre fait 46 px sur un téléphone : soixante stries y
         // tomberaient à une par pixel et **battraient au moindre mouvement**.
         // La dérivée d'écran dit combien une strie couvre ; au-delà d'un
         // quart de période on les fond, et il ne reste que l'arc-en-ciel
         // lisse. *Un réseau trop fin pour l'écran doit disparaître, pas
         // moirer* — c'est le repli d'un détail, pas sa suppression : sur une
         // carte regardée de près il est là.
         float phase = trame * 64.0 + incidence * 7.0;
         float net = 1.0 - smoothstep(0.18, 0.5, fwidth(phase));

         // ELLE ACCROCHE LE MÉTAL, ET RIEN QUE LUI.
         //
         // Keko : « l'image est couverte de lignes en diagonale, comme si la
         // texture avait changé, c'est voulu ? » Non : le réseau passait sur
         // TOUTE la carte, illustration comprise, et des stries en travers d'un
         // dessin ne se lisent pas comme un reflet, elles se lisent comme une
         // autre texture. *Un foil est une feuille posée sur le CADRE, pas une
         // trame imprimée sur l'image.*
         //
         // Le carré de la luminance ne suffisait pas — il atténuait sans
         // couper. Un seuil doux tranche : sous 38 % de clarté il n'y a plus
         // rien, au-dessus de 75 % il y a tout. Le cadre s'embrase, la lame
         // brille parce qu'elle EST claire, et le fond de nuit garde son
         // dessin.
         float metal = smoothstep(0.38, 0.75, luminance);
         float reseau = 1.0 - 0.3 * net * metal * (0.5 - 0.5 * sin(phase * 6.28318));
         // Il reste un souffle d'irisation partout : *une carte foil n'est pas
         // un cadre foil sur une carte mate.*
         float prise = 0.06 + 0.94 * metal;
         diffuseColor.rgb += arc * uIris * prise * reseau * (0.11 + uLustreForce * 1.9);

         // ET CE SOUFFLE EST AU DIAMANT SEUL, jamais à une holo.
         //
         // *C'est LUI qui repeignait le cadre* : constant sur toute la carte, il
         // teintait le cran au lieu de passer dessus — une holo commune et une
         // holo épique se lisaient du même arc-en-ciel. Le diamant peut se le
         // permettre, **sa couleur EST l'arc-en-ciel** ; un bonus qui s'ajoute
         // à un cran, non.

         // ET LA BANDE DE BRILLANCE PREND LES MÊMES COULEURS. Keko : « je
         // voudrais un effet holographique aussi sur son effet de brillance
         // quand on la fait bouger ». *Un foil n'a pas un reflet blanc* : ce
         // qui passe dessus se décompose.
         float ecart = bande - uLustre;
         // ET IL PREND LA COULEUR DE LA CARTE. Keko : « ce serait bien que le
         // reflet de lumière soit de la couleur de la carte (blanc comme
         // actuellement pour commun, vert pour uncommon etc) ».
         //
         // *Un reflet prend la couleur de ce qu'il touche*, et le jeu le disait
         // déjà de l'or — « un effet qui rend la lumière un peu dorée quand on
         // bouge la carte ». **Ce n'était qu'un cas** : la teinte vient
         // maintenant d'une table, et le crème n'est plus qu'un défaut.
         vec3 blanc = uTonLustre;
         // ET LE REFLET SE DÉCOMPOSE SUR LES DEUX : *un foil n'a pas un reflet
         // blanc*, et une feuille holographique non plus. C'est la seule chose
         // que l'holo emprunte encore au diamant, et elle ne vaut QUE sous le
         // doigt — donc elle ne teint rien au repos.
         float irise = max(uIris, step(0.0001, uHolo));
         vec3 tonLustre = mix(blanc, arc * 1.5, irise);
         diffuseColor.rgb += tonLustre
           * uLustreForce
           * (exp(-ecart * ecart * 95.0) + 0.5 * exp(-ecart * ecart * 480.0));

         // ET LA FEUILLE HOLOGRAPHIQUE, QUI N'EST QU'UNE BANDE QUI PASSE.
         //
         // Keko : « holographique ne doit pas changer la couleur de la carte :
         // on rajoute l'effet holographique par-dessus ».
         //
         // *Un voile irisé permanent REPEINT le cadre* — c'est là que le cran
         // se lit — alors qu'une bande qui traverse ne fait que glisser dessus.
         // D'où une force à elle, et non un emprunt à uLustreForce : celui-ci
         // alimente AUSSI l'arc ambiant juste au-dessus, et les mêler aurait
         // remis le voile qu'on vient de retirer.
         //
         // Elle prend l'arc-en-ciel tel quel : *une feuille holographique n'a
         // pas de couleur à elle, elle décompose celle qui passe dessus.* Et
         // elle couvre toute la carte, illustration comprise — un reflet ne
         // s'arrête pas au cadre, à la différence du RÉSEAU de stries, qui lui
         // se lirait comme une trame imprimée sur le dessin.
         //
         // ET ELLE A SON PROPRE SPECTRE, QUI TOURNE QUATRE FOIS PLUS VITE.
         //
         // *L'arc du foil ne fait qu'un tour sur toute la carte* : dans une
         // bande d'un cinquième, il ne déroule que quarante degrés de teinte,
         // donc **la feuille se lisait comme une nappe verte** et non comme un
         // reflet irisé — soit exactement le défaut qu'on venait de retirer,
         // repris par l'autre bout.
         //
         // **Une feuille holographique DÉCOMPOSE** : le long d'un même reflet on
         // voit passer tout le spectre. Quatre tours le lui rendent sans
         // moirer — on est deux ordres de grandeur au-dessus du RÉSEAU, qui en
         // fait soixante-quatre et doit, lui, se fondre quand il passe sous le
         // pixel.
         float teinteH = fract(trame * 4.0 + incidence * 1.9 + uLustre * 0.4);
         vec3 arcH = 0.5 + 0.5 * cos(6.28318 * (teinteH + vec3(0.0, 0.33, 0.67)));
         diffuseColor.rgb += arcH * uHolo * reseau
           * (exp(-ecart * ecart * 90.0) + 0.6 * exp(-ecart * ecart * 420.0));

         // ET LA BORDURE DU DIAMANT S'ALLUME, avec une lumière qui EN FAIT LE
         // TOUR. Keko : « on peut ajouter un effet de lumière qui shine la
         // bordure de la carte ? »
         //
         // La bande est calculée sur la DISTANCE AU BORD, pas sur la
         // luminance : le masque de métal du foil accroche aussi la lame d'un
         // Glaive et le plastron, et *une bordure qui s'allume au milieu de la
         // carte n'est plus une bordure.* La distance en y se compte en
         // largeurs de carte (elle en fait 1,4 de haut), sinon le liseré serait
         // plus épais en haut qu'à gauche.
         vec2 versLeBord = min(vLustreUv, 1.0 - vLustreUv);
         float auBord = min(versLeBord.x, versLeBord.y * 1.4);
         float cadre = 1.0 - smoothstep(0.016, 0.052, auBord);

         // Le point de lumière tourne à l'ANGLE, comme l'auréole : c'est le
         // même mouvement vu de l'intérieur du cadre. L'écart au centre est
         // remis aux proportions de la carte, sinon la lumière traînerait sur
         // les grands côtés et filerait dans les coins.
         vec2 dc = (vLustreUv - 0.5) * vec2(1.0, 1.4);
         float tourne = fract(atan(dc.y, dc.x) * 0.15915494 - uTemps * 0.13);
         float pointe = pow(0.5 + 0.5 * cos(6.28318 * tourne), 16.0);
         // Un fond constant PLUS le point qui passe : *un liseré qui ne
         // s'allume qu'au passage n'est pas une bordure lumineuse, c'est un
         // clignotant.*
         diffuseColor.rgb +=
           mix(vec3(1.0), arc, 0.55) * uBordure * cadre * (0.2 + pointe * 2.0);

         // LE DEVELOPPEMENT, et il se joue en DERNIER : il recouvre tout le
         // reste, lustre et foil compris. *Une carte qui n'est pas encore
         // revelee ne peut pas deja briller de ce qu'elle est* — c'est la
         // regle qui garde le dos en laiton, prise un cran plus loin.
         if (uDevelop > 0.0) {
           // C'EST UN TIRAGE PHOTOGRAPHIQUE : la carte arrive SUREXPOSEE, et
           // l'image remonte a mesure que la lumiere se resorbe.
           //
           // *Le nom, le cadre et le texte sont lisibles des la premiere
           // image* — ce ne sont pas eux qui se developpent, c'est le bain
           // qui s'eclaircit. La premiere version faisait l'inverse : elle
           // posait un pave du NOM par-dessus une carte eteinte, donc elle
           // racontait une mosaique typographique et non une revelation.
           float voile = uDevelop * uDevelop * 0.82;

           // LES FLAQUES : des taches de lumiere qui SE CONTRACTENT vers leur
           // centre. *Un voile uniforme qui s'eclaircit se lit comme une
           // opacite qu'on baisse* — ce qui fait le bain, ce sont des zones
           // qui s'en vont a des vitesses differentes.
           for (int i = 0; i < 8; i++) {
             float fi = float(i);
             vec2 c = vec2(hDev(fi * 1.7), hDev(fi * 1.7 + 11.3));
             float R = (0.17 + hDev(fi * 1.7 + 23.9) * 0.23) * uDevelop;
             // LA DISTANCE SE MESURE A L'ECRAN, pas en uv : la carte fait une
             // fois et demie sa largeur en hauteur, donc une flaque ronde en
             // uv serait un ovale sur la carte.
             float d = length((vLustreUv - c) * vec2(1.0, 1.4));
             voile += smoothstep(R, R * 0.22, d) * (0.45 + hDev(fi * 1.7 + 5.1) * 0.55);
           }

           // LE GRAIN D'EMULSION : il casse la rondeur des flaques. *Trois
           // disques parfaits se lisent comme trois disques*, pas comme un
           // bain.
           voile *= 0.86 + 0.14 * hDev(floor(vLustreUv.x * 90.0) + floor(vLustreUv.y * 126.0) * 97.0);

           // AU-DELA DE BLANC, la lumiere DEBORDE : une surexposition n'est
           // pas un voile a 100 %, elle brule. ET ELLE A LA COULEUR DU CRAN --
           // Keko : « l'effet de lumiere qui devoile les cartes devrait etre
           // de la couleur de la rarete ». C'est le ton du lustre, derive de
           // METAUX et deja pousse a une energie commune : *un reflet prend la
           // couleur de ce qu'il touche*, et ce bain-ci aussi. Le bas de
           // l'echelle garde la creme, comme partout.
           diffuseColor.rgb = mix(diffuseColor.rgb, uTonLustre * 1.12, clamp(voile, 0.0, 1.0));
         }`,
      )
      // LA SATURATION DE L'APLAT SE POSE EN SORTIE, après la conversion sRGB :
      // *la part émissive de la peinture ne passe pas par diffuseColor*, donc
      // un gain posé là où uGris travaille la manquerait. Voir `aplat`.
      nuanceur.fragmentShader = nuanceur.fragmentShader.replace(
        '#include <dithering_fragment>',
        `#include <dithering_fragment>
         float lumSortie = dot(gl_FragColor.rgb, vec3(0.2126, 0.7152, 0.0722));
         gl_FragColor.rgb = mix(vec3(lumSortie), gl_FragColor.rgb, 1.0 + uSature);

         // LA BORDURE BRILLANTE, en sortie : voir BRILLANT.
         // ***LES DÉRIVÉES D'ÉCRAN SE CALCULENT HORS DE TOUT if*** : dans une
         // branche que les pixels voisins ne prennent pas, dFdx est indéfini,
         // et le pilote rendait des NaN que le bloom étalait en blocs entiers
         // de carte manquants. Vu à l'écran. Le repère se calcule donc pour
         // tous, et la bande décide seulement de son poids.
         vec3 dpx = dFdx(-vViewPosition);
         vec3 dpy = dFdy(-vViewPosition);
         vec2 dux = dFdx(vLustreUv);
         vec2 duy = dFdy(vLustreUv);
         // LE REPÈRE DE LA FACE, en espace vue — protégé contre le vecteur
         // nul, qu'un normalize change en NaN. Il sert à la bordure ET aux
         // paillettes de l'holo, donc il se calcule hors de leurs if.
         float det = dux.x * duy.y - dux.y * duy.x;
         float sg = det < 0.0 ? -1.0 : 1.0;
         vec3 Tb = (dpx * duy.y - dpy * dux.y) * sg;
         vec3 Bb = (dpy * dux.x - dpx * duy.x) * sg;
         vec3 Tc = Tb / max(length(Tb), 1e-6);
         vec3 Bc = Bb / max(length(Bb), 1e-6);
         vec3 Nc = cross(Tc, Bc);
         Nc /= max(length(Nc), 1e-6);
         vec3 Vc = normalize(vViewPosition);
         vec3 Lc = normalize(vec3(${BRILLANT.lampe.map((v) => v.toFixed(3)).join(', ')}));
         // LA LARGEUR D'UN PIXEL EN U, pour adoucir les paillettes au pixel.
         float pixU = abs(dux.x) + abs(duy.x);
         if (uBrillant > 0.0) {
           // LE RECTANGLE ARRONDI DE LA CARTE, en largeurs de carte.
           vec2 pc = (vLustreUv - 0.5) * vec2(1.0, 1.4);
           vec2 qc = abs(pc) - (vec2(0.5, 0.7) - ${RAYON_SIMPLE.toFixed(4)});
           float dc = length(max(qc, 0.0)) + min(max(qc.x, qc.y), 0.0) - ${RAYON_SIMPLE.toFixed(4)};
           float bande = smoothstep(-${(CONTOUR_PLAQUE + 0.003).toFixed(4)}, -${(CONTOUR_PLAQUE - 0.002).toFixed(4)}, dc);
           // LE REFLET DE LA LAMPE CLÉ, comme sur le sachet — Keko : « la
           // lumière ne suit pas vraiment la source de lumière comme le
           // booster (haut droit) ». C'est maintenant une vraie RÉFLEXION :
           // chaque pixel renvoie le regard sur la face plate, et brille
           // d'autant que ce rayon pointe vers la lampe. Le haut-droit du cadre
           // s'allume au repos, et la tache court quand on penche la carte
           // vers la lampe ou à l'opposé. *Aucune normale ne bouge* : c'est la
           // géométrie du regard qui place le reflet.
           vec3 Rc = reflect(-Vc, Nc);
           float sc = max(dot(Rc, Lc), 0.0);
           float nappe = pow(sc, ${BRILLANT.large.toFixed(1)});
           float eclair = pow(sc, ${BRILLANT.serre.toFixed(1)});
           // LE MÉTAL TEINTE CE QU'IL RENVOIE : la couleur du cran, poussée
           // à pleine clarté, ramenée vers le blanc.
           vec3 cc = gl_FragColor.rgb;
           float lumAvant = dot(cc, vec3(0.2126, 0.7152, 0.0722));
           vec3 purc = cc / max(max(cc.r, cc.g), max(cc.b, 0.02));
           vec3 teintec = mix(vec3(1.0), purc, ${BRILLANT.metal.toFixed(2)});
           float feuc = 1.0 + uLustreForce * 1.5;
           // LE GRAND REFLET SE MULTIPLIE, L'ÉCLAT S'AJOUTE, TEINTÉ.
           cc *= 1.0 + nappe * ${BRILLANT.reflet.toFixed(2)} * bande * feuc;
           cc += teintec * eclair * ${BRILLANT.eclat.toFixed(2)} * bande * feuc;
           // ET LE FRESNEL DE LA FACE ELLE-MÊME : plus elle penche, plus son
           // cadre renvoie.
           float fresc = pow(1.0 - clamp(abs(dot(Nc, Vc)), 0.0, 1.0), 2.0);
           cc += teintec * fresc * ${BRILLANT.fresnel.toFixed(2)} * bande;
           // ***ET LA LUMIÈRE RESTE DANS LA CARTE.*** Keko : « la lumière
           // déborde de la carte ». *C'est le bloom* : tout ce qui passe son
           // seuil de luminance (0,8 en cible 8 bits) rayonne hors du cadre.
           // Le brillant est donc plafonné sous ce seuil — il ne monte jamais
           // plus haut que ce que la peinture montait déjà.
           // ET LA PARTIE ÉCLAIRÉE SE SATURE — Keko : « le halo déborde vers
           // l'intérieur de la carte, c'est pas souhaitable ; en fait je
           // voudrais que la partie éclairée du cadre soit plus saturée et
           // vive ». *Une lumière qui tire vers le blanc délave* ; celle-ci
           // pousse la couleur du cran AU-DELÀ d'elle-même, comme un métal
           // coloré sous la lampe. Ni lueur intérieure ni blanc au coeur.
           float lumc = dot(cc, vec3(0.2126, 0.7152, 0.0722));
           cc = max(mix(vec3(lumc), cc, 1.0 + ${BRILLANT.sature.toFixed(2)} * nappe * bande * feuc), 0.0);
           // LES RAYONS CLAIRS DE LA FENÊTRE BRILLENT AUSSI : voir
           // RAYONS_BRILLANTS. On retrouve le secteur et le fondu de
           // peindreRayons, à partir du haut de la carte comme sur la toile.
           if (uRayons > 0.0) {
             vec2 tp = vec2(vLustreUv.x, 1.0 - vLustreUv.y);
             vec2 cr = vec2(${RAYONS_DANS_LA_CARTE.x.toFixed(4)} + ${RAYONS_DANS_LA_CARTE.l.toFixed(4)} * 0.5, ${RAYONS_DANS_LA_CARTE.y.toFixed(4)} + ${RAYONS_DANS_LA_CARTE.h.toFixed(4)} * 0.5);
             vec2 dr = vec2(tp.x - cr.x, (tp.y - cr.y) * 1.4);
             float fenetre = step(${RAYONS_DANS_LA_CARTE.x.toFixed(4)}, tp.x) * step(tp.x, ${RAYONS_DANS_LA_CARTE.x.toFixed(4)} + ${RAYONS_DANS_LA_CARTE.l.toFixed(4)})
               * step(${RAYONS_DANS_LA_CARTE.y.toFixed(4)}, tp.y) * step(tp.y, ${RAYONS_DANS_LA_CARTE.y.toFixed(4)} + ${RAYONS_DANS_LA_CARTE.h.toFixed(4)});
             float fr = fract((atan(dr.y, dr.x) - ${RAYONS_DANS_LA_CARTE.depart.toFixed(3)}) / ${((Math.PI * 4) / RAYONS_DANS_LA_CARTE.nombre).toFixed(5)});
             float clair = smoothstep(0.0, 0.025, fr) * (1.0 - smoothstep(0.475, 0.5, fr));
             float rr = ${RAYONS_DANS_LA_CARTE.rayon.toFixed(4)};
             float fonduR = 1.0 - clamp((length(dr) - rr * 0.08) / (rr * 0.92), 0.0, 1.0);
             float libre = texture2D(uMasqueSujet, vLustreUv).r;
             float kr = clair * fonduR * libre * fenetre;
             float nappeR = pow(sc, ${RAYONS_BRILLANTS.large.toFixed(1)});
             cc *= 1.0 + nappeR * ${RAYONS_BRILLANTS.reflet.toFixed(2)} * kr * feuc;
             float lumR = dot(cc, vec3(0.2126, 0.7152, 0.0722));
             cc = max(mix(vec3(lumR), cc, 1.0 + ${RAYONS_BRILLANTS.sature.toFixed(2)} * nappeR * kr * feuc), 0.0);
           }
           float lumApres = dot(cc, vec3(0.2126, 0.7152, 0.0722));
           float plafond = max(lumAvant, ${BRILLANT.plafond.toFixed(2)});
           cc *= min(1.0, plafond / max(lumApres, 0.0001));
           gl_FragColor.rgb = cc;
         }

         // LES PAILLETTES COSMOS DE LA FEUILLE HOLO : voir COSMOS.
         if (uHolo > 0.0 && ${AVEC_COSMOS ? 'true' : 'false'}) {
           float libreH = texture2D(uMasqueSujet, vLustreUv).r;
           vec3 cosmos = vec3(0.0);
           for (int k = 0; k < 2; k++) {
             bool fin = k == 0;
             float n = fin ? ${COSMOS.fin.toFixed(1)} : ${COSMOS.gros.toFixed(1)};
             vec2 pg = vLustreUv * vec2(1.0, 1.4) * n;
             vec2 cel = floor(pg);
             vec2 dans = fract(pg) - 0.5;
             float fk = float(k);
             float h1 = hDev(cel.x * 17.0 + cel.y * 131.0 + fk * 7.0);
             float h2 = hDev(cel.x * 59.0 + cel.y * 23.0 + fk * 13.0 + 3.0);
             float h3 = hDev(cel.x * 7.0 + cel.y * 97.0 + fk * 29.0 + 11.0);
             float h4 = hDev(cel.x * 41.0 + cel.y * 67.0 + fk * 5.0 + 19.0);
             float present = step(h1, fin ? ${COSMOS.partFin.toFixed(2)} : ${COSMOS.partGros.toFixed(2)});
             // SA PLACE DANS SA CELLULE, et son miroir penché au hasard.
             vec2 d = dans - (vec2(h2, h3) - 0.5) * 0.5;
             vec3 nf = Nc + (Tc * (h3 - 0.5) + Bc * (h4 - 0.5)) * ${(COSMOS.dispersion * 2).toFixed(2)};
             nf /= max(length(nf), 1e-6);
             float sf = max(dot(reflect(-Vc, nf), Lc), 0.0);
             float allume = pow(sf, fin ? ${COSMOS.serreFin.toFixed(1)} : ${COSMOS.serreGros.toFixed(1)});
             float scintille = 0.65 + 0.35 * sin(uTemps * (2.0 + 3.0 * h4) + h2 * 6.28318);
             // LA FORME : un point, et des branches pour les grosses.
             float aa = pixU * n;
             float rP = fin ? ${COSMOS.rayonFin.toFixed(2)} : ${COSMOS.rayonGros.toFixed(2)};
             float point = 1.0 - smoothstep(rP - aa, rP + aa, length(d));
             float branches = fin ? 0.0
               : exp(-abs(d.x) * 40.0 / max(1.0, aa * 8.0)) * exp(-abs(d.y) * 9.0)
               + exp(-abs(d.y) * 40.0 / max(1.0, aa * 8.0)) * exp(-abs(d.x) * 9.0);
             float forme = max(point, branches * 0.9);
             vec3 spectre = 0.5 + 0.5 * cos(6.28318 * (fract(h4 * 3.0 + incidence * 1.9) + vec3(0.0, 0.33, 0.67)));
             cosmos += mix(vec3(1.0), spectre, 0.8) * forme * present * allume * scintille;
           }
           // ET L'ÉCRITURE RESTE PAR-DESSUS — Keko : « il faudrait que
           // l'écriture soit par-dessus car les paillettes gênent la lecture ».
           // Sous le haut de la plaque, une paillette ne se pose que sur ce qui
           // est CLAIR : les lettres, sombres, n'en reçoivent aucune, et le
           // titre se lit comme imprimé sur la feuille.
           float sousPlaque = step(${(RAYONS_DANS_LA_CARTE.y + RAYONS_DANS_LA_CARTE.h).toFixed(4)}, 1.0 - vLustreUv.y);
           float lumH = dot(gl_FragColor.rgb, vec3(0.2126, 0.7152, 0.0722));
           float lisible = mix(1.0, smoothstep(0.72, 0.9, lumH), sousPlaque);
           gl_FragColor.rgb += cosmos * libreH * lisible * uHolo * ${COSMOS.force.toFixed(2)};
           // LE CERNE ARC-EN-CIEL DE L'EMOJI : voir COSMOS.cerne. Le spectre
           // fait le tour de l'emoji, tourne avec l'angle du regard, et
           // s'allume quand on le penche vers la lampe.
           float surEmoji = smoothstep(0.05, 0.3, 1.0 - libreH);
           float cerneE = surEmoji * blancTexture;
           vec2 tpE = vec2(vLustreUv.x, 1.0 - vLustreUv.y);
           vec2 crE = vec2(${(RAYONS_DANS_LA_CARTE.x + RAYONS_DANS_LA_CARTE.l * 0.5).toFixed(4)}, ${(RAYONS_DANS_LA_CARTE.y + RAYONS_DANS_LA_CARTE.h * 0.5).toFixed(4)});
           vec2 drE = vec2(tpE.x - crE.x, (tpE.y - crE.y) * 1.4);
           vec3 Rf = reflect(-Vc, Nc);
           float teinteE = fract(atan(drE.y, drE.x) / 6.28318 * ${COSMOS.cerne.tour.toFixed(1)} + incidence * 2.0 + (Rf.x + Rf.y) * 1.2);
           // LE SPECTRE SATURÉ : la palette en cosinus est pastel, une puissance
           // la creuse vers les couleurs franches, et le gain rend la clarté.
           vec3 arcE = pow(0.5 + 0.5 * cos(6.28318 * (teinteE + vec3(0.0, 0.33, 0.67))), vec3(${COSMOS.cerne.sature.toFixed(2)})) * 1.5;
           float lobeE = pow(max(dot(Rf, Lc), 0.0), ${COSMOS.cerne.lobe.toFixed(1)});
           vec3 holoE = mix(vec3(1.0), arcE, ${COSMOS.cerne.couleur.toFixed(2)}) * (0.9 + 0.35 * lobeE);
           float vivant = clamp(uHolo / ${FORCE_HOLO.toFixed(3)}, 0.0, 1.0);
           gl_FragColor.rgb = mix(gl_FragColor.rgb, gl_FragColor.rgb * holoE, cerneE * vivant);
         }

         // LE LIN TRESSÉ, en sortie : il presse TOUTE la carte, peinture
         // émissive comprise — voir FORCE_LIN.
         if (uLin > 0.0) {
           vec2 pl = vLustreUv * vec2(1.0, 1.4) * ${FILS_LIN.toFixed(1)};
           // LES FILS DE TRAME, horizontaux : vite en y, lentement en x — un
           // fil change d'épaisseur sur sa longueur, pas d'un pixel à l'autre.
           float trameH = bruitLin(vec2(pl.x * 0.07, pl.y));
           // LES FILS DE CHAÎNE, verticaux, décalés pour ne pas répéter la trame.
           float chaineV = bruitLin(vec2(pl.x, pl.y * 0.07) + 37.0);
           // LE CROISEMENT : un fil passe dessus, puis dessous — le damier
           // des cellules alterne celui qui ressort.
           float dessus = mod(floor(pl.x) + floor(pl.y), 2.0);
           float relief = mix(trameH, chaineV, 0.35 + 0.3 * dessus) - 0.5;
           // IL S'EFFACE SOUS LE PIXEL : voir le réseau du foil.
           float net = 1.0 - smoothstep(0.35, 0.9, fwidth(pl.x));
           // ET IL SE CREUSE SOUS LE REFLET : la lumière rasante le révèle.
           float force = uLin * (1.0 + 2.5 * uLustreForce) * net;
           gl_FragColor.rgb *= 1.0 + relief * 2.0 * force;
         }`,
      )
      nuanceur.fragmentShader = `uniform float uGris;
uniform float uSature;
uniform float uLustre;
uniform float uLustreForce;
uniform float uIris;
uniform float uHolo;
uniform vec3 uTonLustre;
uniform float uBordure;
uniform float uTemps;
uniform float uDevelop;
varying vec2 vLustreUv;
// LE HACHAGE DES FLAQUES : il leur donne une place FIXE. *Un semis qui se
// retire a chaque image n'est plus une matiere, c'est du bruit* — et ici il
// ferait grouiller la surexposition au lieu de la faire se resorber.
float hDev(float n) { return fract(sin(n * 43.317) * 43758.5453); }
uniform float uLin;
uniform float uBrillant;
uniform float uRayons;
uniform sampler2D uMasqueSujet;
// LE BRUIT DU LIN : une valeur par noeud d'une grille, lissée entre eux.
float bruitLin(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float n = i.x + i.y * 57.0;
  return mix(mix(hDev(n), hDev(n + 1.0), f.x), mix(hDev(n + 57.0), hDev(n + 58.0), f.x), f.y);
}
${nuanceur.fragmentShader}`
    }
    /**
     * SANS CETTE CLÉ, DEUX MATÉRIAUX PEUVENT PARTAGER UN PROGRAMME QUI N'EST
     * PAS LE LEUR.
     *
     * three met les programmes compilés en cache, et **sa clé ignore ce que
     * `onBeforeCompile` a injecté** : deux `MeshStandardMaterial` de mêmes
     * réglages y sont indiscernables, même si l'un a reçu trois lignes de
     * nuanceur et l'autre non. Celui qui hérite du mauvais programme sort une
     * carte uniformément blanche ou noire — *et seulement parfois*, puisque ça
     * dépend de l'ordre dans lequel ils ont été compilés.
     *
     * C'est le correctif que three prescrit dès qu'on touche au nuanceur.
     */
    face.customProgramCacheKey = () =>
      'carte-face-desaturable-lustree-irisee-tintee-bordee-developpee2-holo-lin-brillant-rayons-cosmos'
    // L'ordre des faces d'un pavé dans three : droite, gauche, haut, bas,
    // AVANT, arrière. Seule l'avant porte la carte.
    // LE CONTOUR : un plan derrière la carte, qui porte une TEXTURE de lueur
    // — un liseré net entouré d'un flou continu, peint au canvas avec le même
    // moteur de flou que le `box-shadow` du jeu 2D.
    //
    // **Un plan de couleur unie ne peut pas faire ça** : il donne un rectangle
    // dur, « juste clair, mais il n'émet aucune lumière » (Keko). Trois
    // rectangles emboîtés non plus — on lisait les paliers. *Le flou est dans
    // la matière, pas dans le nombre de plans.*
    //
    // Additif : la lumière s'AJOUTE au fond au lieu de le recouvrir, ce qui
    // est la différence entre une lueur et une peinture claire. Et
    // `toneMapped: false` pour qu'elle garde son éclat au lieu d'être ramenée
    // dans la plage du reste de la scène.
    const halo = new THREE.MeshBasicMaterial({
      map: textureContour(),
      color: '#ffe6ab',
      transparent: true,
      opacity: 0,
      toneMapped: false,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
    /**
     * LE VERSO, pour la culbute seule. Il n'est plaqué que pendant qu'elle
     * tourne : le reste du temps le laiton du corps suffit, et *un plan de
     * plus par carte pour une seconde d'animation ne vaut pas son prix.*
     */
    const verso = new THREE.MeshStandardMaterial({
      color: '#1b1a22',
      ...reflet,
      emissive: '#ffffff',
      emissiveIntensity: aplat ? COMPLEMENT_APLAT : 0,
      alphaTest: 0.5,
    })
    /**
     * L'AURÉOLE CHROMATIQUE DU DIAMANT — demandée par Keko : « un effet de
     * brillance chromatique autour de la carte, animé ».
     *
     * **Elle épouse la carte au lieu de l'entourer d'un rond** : c'est la même
     * texture de contour que le halo ordinaire, donc la même silhouette et le
     * même flou. Ce qui change est la COULEUR, qui tourne avec l'angle autour
     * du centre — *un arc-en-ciel qui fait le tour d'un objet se lit comme une
     * irisation, un arc-en-ciel qui le traverse se lit comme un drapeau.*
     *
     * Elle est le seul effet du jeu dont le temps soit le moteur, et c'est
     * assumé : une pièce légendaire posée dans un coffre ne bouge pas, donc
     * rien d'autre ne pourrait l'animer. Ailleurs, *la couleur ne bouge que si
     * l'objet bouge* — ici il n'y a pas d'objet qui bouge.
     */
    const aureole = new THREE.ShaderMaterial({
      uniforms: {
        uTexte: { value: textureAureole() },
        uTemps: { value: 0 },
        uForce: { value: 0 },
        // **UNE SEULE AURÉOLE POUR DEUX MÉTAUX.** L'or en veut une aussi
        // (Keko), mais dorée et non chromatique : *un métal qui a UNE couleur
        // ne rayonne pas un arc-en-ciel.* Un facteur de mélange plutôt qu'un
        // second matériau — même nuanceur, même texture, deux réglages.
        uArc: { value: 1 },
        uTon: { value: new THREE.Color('#ffb545') },
      },
      /**
       * **ELLE SE FAIT COUPER COMME LE RESTE — et un `ShaderMaterial` ne le
       * sait pas tout seul.** Keko : « quand le coffre est rempli et qu'on
       * scrolle, les cartes du bas sont coupées mais l'effet holographique des
       * diamants ou le brillant des cartes or n'est pas coupé ».
       *
       * Les plans de découpe posés sur un matériau n'agissent que si son
       * nuanceur porte les morceaux de three qui font le `discard` — les autres
       * matériaux de la carte les ont d'office, celui-ci est écrit à la main.
       * Il faut donc les quatre `#include` ET `clipping: true`, qui est ce qui
       * déclare `NUM_CLIPPING_PLANES` au moment de la compilation. *Un matériau
       * écrit à la main ne bénéficie d'aucune des règles du moteur qu'il ne
       * demande pas.*
       */
      clipping: true,
      vertexShader: `varying vec2 vUvA;
        #include <clipping_planes_pars_vertex>
        void main() {
          vUvA = uv;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * mvPosition;
          #include <clipping_planes_vertex>
        }`,
      fragmentShader: `uniform sampler2D uTexte;
        uniform float uTemps;
        uniform float uForce;
        uniform float uArc;
        uniform vec3 uTon;
        varying vec2 vUvA;
        #include <clipping_planes_pars_fragment>
        void main() {
          #include <clipping_planes_fragment>
          float masque = texture2D(uTexte, vUvA).a;
          vec2 d = vUvA - 0.5;
          float angle = atan(d.y, d.x) / 6.28318;
          float teinte = fract(angle + uTemps * 0.09);
          vec3 arc = 0.5 + 0.5 * cos(6.28318 * (teinte + vec3(0.0, 0.33, 0.67)));
          vec3 ton = mix(uTon, arc, uArc);
          gl_FragColor = vec4(ton * masque * uForce, masque * uForce);
        }`,
      transparent: true,
      depthWrite: false,
      toneMapped: false,
      blending: THREE.AdditiveBlending,
    })
    return { face, laiton, halo, verso, aureole }
  }, [])

  // ELLE SE POSE SUR LE MATÉRIAU, elle ne le reconstruit pas : le rebâtir à
  // chaque changement de carte referait aussi son nuanceur, et la carte
  // repasserait par son état sombre.
  useEffect(() => {
    // UNE CARTE FACE CACHÉE REPREND LE LAITON COMMUN. *Le dos ne dit rien de ce
    // qu'il y a dessous* — et c'est le CORPS qu'on voit sur ses bords, donc le
    // teinter par la rareté annonçait le métal avant le retournement. La règle
    // était déjà écrite pour la face peinte du dos ; elle manquait au volume.
    const cran = dos === true ? 'commune' : (carte.rarete ?? 'commune')
    laiton.color.set(METAL_3D[cran] ?? METAL_3D.commune!)
  }, [laiton, carte.rarete, dos])

  /**
   * UNE PETITE CARTE PREND UNE PETITE TEXTURE.
   *
   * À 0,44 de large — la case du coffre — une carte fait une centaine de
   * pixels à l'écran pour une texture de 768 : le GPU la minifie de deux
   * niveaux et demi et **mélange deux étages de mipmap**, dont un plus petit
   * qu'elle. Keko : « pourquoi les cartes réduites sont floues ? » *Ce n'était
   * pas la peinture, c'était la minification.*
   *
   * Le seuil est celui du chargement : au-dessus, la carte se lit en grand et
   * mérite sa pleine résolution. Une carte qui grandit en cours de geste
   * change de texture en chemin — elle y GAGNE en netteté, donc le relais se
   * lit dans le bon sens.
   */
  /**
   * LA TEXTURE SE CHOISIT SUR LA TAILLE RÉELLE, densité d'écran comprise.
   *
   * Le seuil se lisait sur la taille dans la SCÈNE (0,6), donc il ignorait et
   * le cadrage et le `devicePixelRatio` : une carte du chargement prenait une
   * toile de 256 px alors qu'elle en couvre 280 sur un écran haute densité, et
   * *une texture plus petite que ce qu'elle couvre est floue par
   * construction.* On compte donc les pixels physiques qu'elle occupe, et on
   * prend la toile qui les couvre.
   */
  const largeurPx =
    (tailleTexture ?? taille) * (size.height / hauteurVisibleA(position[2], size.height)) * dpr

  useEffect(() => {
    let vivant = true
    /**
     * UNE CARTE FACE CACHÉE PEINT QUAND MÊME SA FACE.
     *
     * **Sans ça, elle se retourne sur son propre dos.** La face ne chargeait sa
     * texture qu'à l'instant où `dos` devenait faux ; d'ici qu'elle arrive, elle
     * gardait celle du dos — donc la carte culbutait et retombait **en montrant
     * encore le dos**. Keko : « parfois quand j'ouvre une carte, le dos reste et
     * je vois rien ».
     *
     * *Le « parfois » était la mesure du problème* : la culbute dure 660 ms, et
     * un portrait Commons met de 57 à 759 ms à arriver. Ça passait ou non selon
     * le portrait et le réseau — donc jamais sur un téléphone.
     *
     * On chauffe donc le cache pendant qu'on montre le dos : *le temps de
     * regarder un dos est exactement le temps qu'il faut pour peindre la face.*
     * La promesse est mémorisée par `textureDeCarte`, donc le second appel — au
     * retournement — la retrouve déjà résolue et la pose dans la même image.
     */
    if (dos) void textureDeCarte(carte, largeurPx).catch(() => {})
    // LA TEXTURE VIENT D'UN CACHE PARTAGÉ : deux cartes du même modèle se la
    // prêtent, et une carte remontée la retrouve déjà prête — donc elle ne
    // repasse jamais par son état sombre. Rien n'est libéré ici pour la même
    // raison : elle ne nous appartient pas.
    void (dos ? textureDuDos(rayon, dosDe(carte)) : textureDeCarte(carte, largeurPx))
      .then((texture) => {
        if (!vivant) return
        // ON N'ÉCRASE PAS UNE ANIMATION VIVANTE. *Deux écrivains se disputent
        // `face.map`* : le cache partagé et la texture privée de l'emoji animé.
        // Cet effet se relance à chaque changement de PALIER de toile — donc
        // quand la carte change de taille, par exemple en passant du défilé au
        // bilan — et il reposait alors la carte STATIQUE par-dessus
        // l'animation, qui ne la reprenait jamais. Keko : « à la fin du paquet
        // quand on voit les cartes, les cartes animées ne bougent plus ».
        if (texToiles.current[tampon.current] !== null && !dos) return
        face.map = texture
        face.needsUpdate = true
        onPeinte?.()
      })
      // L'échec est déjà signalé par le cache, qui s'y vide pour permettre une
      // nouvelle tentative. Ici on absorbe seulement le rejet : sans ça il
      // remonterait en « unhandled rejection », du bruit qui masquerait la vraie
      // ligne.
      .catch(() => {})
    return () => {
      vivant = false
    }
    // ON DÉPEND DE LA SIGNATURE DU MODÈLE, PAS DE L'OBJET, et ça a coûté une
    // page figée. Un parent qui construit sa carte à la volée
    // (`aPeindre(phase.loot)`) en fabrique une NOUVELLE à chaque rendu : l'effet
    // se relançait, `onPeinte` incrémentait un compteur d'état, le rendu
    // repartait — boucle infinie, sans une seule erreur en console. *Une
    // dépendance d'effet ne doit jamais être un objet qu'on vient de
    // construire*, et ici la bonne clé est celle du cache de textures.
    //
    // `onPeinte` reste volontairement hors des dépendances, pour la même
    // famille de raison : une fonction recréée à chaque rendu du parent
    // repeindrait la carte en boucle.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    // LA DÉPENDANCE EST LA TOILE, PAS LA LARGEUR : celle-ci varie à chaque
    // pixel de redimensionnement et pendant qu'une carte grandit sous le
    // doigt, alors que la texture, elle, ne change qu'aux paliers.
  }, [signature(carte), face, dos, tailleQuIlFaut(largeurPx)])

  /**
   * L'EMOJI ANIMÉ — une texture PRIVÉE, repeinte image par image.
   *
   * Keko : « pourquoi les emoji animés ne sont pas animés sur les cartes ? »
   * *Parce qu'un canvas ne joue rien* : voir `emoji-anime.ts` pour le décodage
   * et pour les trois formats du CDN.
   *
   * **Elle ne peut pas venir du cache partagé** : celui-ci sert la même texture
   * à toutes les cartes d'un modèle, et *deux cartes animées ne sont jamais au
   * même instant de leur animation.* Elle est donc à nous, et on la libère.
   *
   * **Et la toile est RÉUTILISÉE** : sans ça on allouerait trente toiles de
   * trois cents kilo-octets par seconde. Il ne reste qu'un `needsUpdate`.
   */
  const anim = useRef<Animation | null>(null)
  /**
   * DEUX TOILES, ET C'EST CE QUI SUPPRIME LE CLIGNOTEMENT.
   *
   * ***`peindreCarte` EFFACE SA TOILE AVANT DE PEINDRE*** - elle commence par
   * `canvas.width = ...`, ce qui vide le canvas - **et elle peint ensuite de
   * facon asynchrone.** Avec une toile unique, la toile que la texture montre
   * est donc VIDE pendant tout le temps de la peinture : si un envoi au GPU
   * tombe dans cette fenetre, la carte apparait en laiton nu. Keko : « la
   * derniere carte du booster continue de flash en gris (elle est animee) ».
   *
   * *Ca ne se voyait pas sur la machine de dev* : une peinture y coute 2 a
   * 3 ms, donc elle se termine bien avant l'image suivante et l'envoi trouve
   * toujours une toile pleine. **Sur un telephone a trois pixels par point, la
   * toile fait 768 px et la peinture depasse l'image** - l'envoi en retard
   * tombe alors en plein milieu de la peinture SUIVANTE, et prend le vide.
   *
   * ***On ne peint donc jamais dans la toile qu'on montre*** : on alterne, et
   * on ne bascule la texture qu'une fois la peinture finie. Le prix est une
   * seconde toile et une seconde texture - *deux, pas trente*, ce qui etait
   * toute la raison de reutiliser la premiere.
   */
  const toiles = useRef<(HTMLCanvasElement | null)[]>([null, null])
  const texToiles = useRef<(THREE.CanvasTexture | null)[]>([null, null])
  /** Le tampon que la texture montre ; on peint dans l'autre. */
  const tampon = useRef(0)
  const derniere = useRef(-1)
  const peintureEnCours = useRef(false)
  /**
   * LE PALIER DE TOILE DE LA DERNIÈRE PEINTURE — **et il faut le suivre.**
   *
   * ***Changer `canvas.width` ne réalloue pas la texture côté GPU.*** Three
   * met à jour une `CanvasTexture` en réuploadant le canvas dans la texture
   * DÉJÀ allouée : si celle-ci fait 768 et le canvas 256, la nouvelle image se
   * retrouve **dans le coin** et le reste garde ce qu'il avait. Keko : « elle
   * clignotait en full gris en mode gros bug », et au bilan on voyait *une
   * petite carte dessinée dans une grande.*
   *
   * La carte change de palier chaque fois qu'elle change de taille — en sortant
   * du sachet, en passant au bilan — donc ça arrive à tous les coups. **On jette
   * la texture et on en refait une**, ce qui est le seul moyen d'en changer les
   * dimensions.
   */
  const palierToile = useRef(-1)

  useEffect(() => {
    const id = carte.animation
    if (id === undefined) return
    let vivant = true
    void animationDeLEmoji(urlAnimationEmoji(id)).then((a) => {
      if (vivant) anim.current = a
    })
    return () => {
      vivant = false
      anim.current = null
      derniere.current = -1
      palierToile.current = -1
      // *Ce qui est à nous se libère* — à la différence de la texture du cache
      // partagé, qui sert encore à d'autres cartes.
      texToiles.current.forEach(libererToile)
      texToiles.current = [null, null]
      toiles.current = [null, null]
    }
  }, [carte.animation])

  useFrame((etat) => {
    const a = anim.current
    // RIEN NE SE JOUE SUR UN DOS : *une carte retournée ne dit rien de ce
    // qu'elle est*, et repeindre sous le dos serait du travail pour personne.
    if (a === null || dos || peintureEnCours.current) return
    const i = Math.min(
      a.images.length - 1,
      Math.floor(((etat.clock.elapsedTime * 1000) % a.duree) / (a.duree / a.images.length)),
    )
    // ON NE REPEINT QUE SI L'IMAGE A CHANGÉ : l'animation tourne à quinze
    // images par seconde, l'écran à soixante.
    // LE PALIER A CHANGÉ : on repart d'une toile neuve, et il faut repeindre
    // même si l'image de l'animation, elle, n'a pas bougé.
    const palier = tailleQuIlFaut(largeurPx)
    const change = palier !== palierToile.current
    if (change) {
      palierToile.current = palier
      texToiles.current.forEach(libererToile)
      texToiles.current = [null, null]
      toiles.current = [null, null]
    }
    if (i === derniere.current && !change) return
    derniere.current = i
    peintureEnCours.current = true
    // ON PEINT DANS L'AUTRE TAMPON : celui que la texture montre ne doit jamais
    // etre efface sous les yeux du joueur.
    const libre = 1 - tampon.current
    void peindreCarte({ ...carte, image: a.images[i] }, palier, toiles.current[libre] ?? undefined)
      .then((canvas) => {
        peintureEnCours.current = false
        if (anim.current === null) return
        // UNE TOILE NEUVE DEMANDE UNE TEXTURE NEUVE : *on ne change pas les
        // dimensions d'une texture déjà allouée*, on la jette.
        if (texToiles.current[libre] == null || toiles.current[libre] !== canvas) {
          libererToile(texToiles.current[libre])
          const t = new THREE.CanvasTexture(canvas)
          t.anisotropy = 8
          t.colorSpace = THREE.SRGBColorSpace
          // LE MASQUE DU SUJET VOYAGE AVEC ELLE, comme avec la texture du
          // cache : sans lui, les rayons clairs de l'animé ne brillaient pas.
          const masque = masqueDuSujetDe(canvas)
          if (masque !== undefined) t.userData.masqueSujet = new THREE.CanvasTexture(masque)
          texToiles.current[libre] = t
        }
        toiles.current[libre] = canvas
        tampon.current = libre
        const tex = texToiles.current[libre]!
        // ELLE REPREND LA MAIN À CHAQUE IMAGE, et pas seulement à la première.
        // *Une texture posée une fois pour toutes est une texture qu'on peut
        // lui prendre* — et c'est ce que faisait l'effet du cache partagé à
        // chaque changement de palier. **Un seul propriétaire ne suffit pas
        // quand deux écrivains visent le même champ : il faut que celui qui
        // doit gagner le redise.**
        if (face.map !== tex) {
          face.map = tex
          face.needsUpdate = true
        }
        tex.needsUpdate = true
        // SON MASQUE A ÉTÉ REPEINT AVEC ELLE : voir `masqueDuSujet`.
        const masque = tex.userData.masqueSujet as THREE.Texture | undefined
        if (masque !== undefined) masque.needsUpdate = true
      })
      .catch(() => {
        peintureEnCours.current = false
      })
  })

  /**
   * La place LISSÉE, tenue à part de celle du groupe.
   *
   * Sans elle, le frémissement serait mangé par l'amortissement : on
   * l'ajouterait à la position, et l'image suivante la ramènerait vers la
   * cible en croyant corriger un écart. *Le tremblement se pose PAR-DESSUS le
   * mouvement, il n'en fait pas partie.*
   */
  const lisse = useRef({
    p: new THREE.Vector3(...position),
    r: new THREE.Euler(...rotation),
    t: taille,
    feu: 0,
    /** L'éclat de la carte : 1 quand elle est jouable, moins quand elle est éteinte. */
    vif: 1,
    /** Où le curseur se tient sur la carte, amorti, en parts de −0,5 à 0,5. */
    vx: 0,
    vy: 0,
    /** Combien le reflet est présent : 1 sous le curseur, 0 sinon. */
    brille: 0,
    /** D'où la culbute est partie, figé à son premier instant. */
    depart: new THREE.Vector3(),
    departT: 1,
    /** Quand elle a commencé, en secondes d'horloge de scène ; `null` sinon. */
    debutCulbute: null as number | null,
    /** Quand son flip a commencé ; `null` sinon. */
    debutFlip: null as number | null,
    /** Quand son rebond élastique a commencé ; `null` sinon. */
    debutRebond: null as number | null,
    debutPompe: null as number | null,
    /** Quand son developpement a commence ; `null` sinon. */
    debutDevelop: null as number | null,
    /** Quand l'onde s'échappe du slot — à la fin de la culbute. */
    debutOnde: null as number | null,
    /** Elle est à sa place : on ne le signale qu'au moment où ça CHANGE. */
    arrivee: true,
  })

  /**
   * L'ONDE VIT DANS LA CARTE, et c'est ce qui l'a fait marcher.
   *
   * Elle a d'abord été un composant voisin, monté par l'écran au moment du
   * dépôt puis monté en permanence, déclenché par une prop puis par une ref :
   * **dans tous les cas sa boucle d'animation s'arrêtait à l'instant du
   * lâcher**, mesuré à la sonde. La carte, elle, voit sa culbute sans faute —
   * *le plus sûr moyen qu'une mise en scène parte à l'heure est de la confier
   * à l'objet qui la joue.*
   *
   * Ses rayons sont en unités de CARTE, donc l'échelle du groupe les met
   * d'elle-même à la taille du slot : rien à convertir.
   */
  const vague = useRef<THREE.Mesh>(null)
  const matiereOnde = useMemo(() => matiereDOnde(), [])
  // LA POUSSIÈRE EST PROPRE À CHAQUE CARTE : son semis est figé au montage,
  // sans quoi les grains se réarrangeraient à chaque rendu.
  const poussiere = useMemo(() => poussiereDOnde(LARGE, HAUT, RAYON_COIN), [])

  // LE DOIGT SE LÈVE SANS PRÉVENIR LA CARTE : c'est l'écran qui le sait, et
  // il le dit en reprenant sa prop. *Sans cette coupure, la carte resterait
  // penchée* — exactement le défaut qui avait fait réserver le survol à la
  // souris.
  useEffect(() => {
    if (!refletAuDoigt) curseur.dessus = false
  }, [refletAuDoigt])

  /** Le jeton vu au dernier tour, pour savoir qu'il vient de changer. */
  const jetonCulbute = useRef(culbute)
  const jetonFlip = useRef(flip)
  const jetonRebond = useRef(rebond)
  const jetonPompe = useRef(pompe)
  const jetonDevelop = useRef(developpe)

  /**
   * ON COUPE LE RAYON À LA SOURCE plutôt que de retirer les écouteurs.
   *
   * Un mesh sans `onPointerDown` laisse quand même passer le survol, et R3F
   * prévient TOUS les objets que le rayon traverse : il faut que celui-ci
   * cesse d'exister pour le lancer de rayon, pas seulement qu'il se taise.
   *
   * La valeur est lue dans une REF, et la fonction n'est construite qu'une
   * fois : changer la prop `raycast` d'un objet entre deux rendus est le genre
   * de chose qui se restaure mal.
   */
  const estInerte = useRef(inerte)
  estInerte.current = inerte
  const raycastDuCorps = useMemo(
    () =>
      function (this: THREE.Mesh, rayon: THREE.Raycaster, touches: THREE.Intersection[]): void {
        if (estInerte.current) return
        THREE.Mesh.prototype.raycast.call(this, rayon, touches)
      },
    [],
  )

  /**
   * OÙ LE CURSEUR SE TIENT, brut. Il vit dans une `ref` et non dans l'état :
   * il change à chaque image, et un rendu React par image donnerait le même
   * résultat pour bien plus cher — la règle déjà tenue par le geste et par la
   * projection des étiquettes.
   */
  const propre = useRef<CurseurDeCarte>({ dessus: false, x: 0, y: 0 })
  /**
   * ET IL PEUT ÊTRE PARTAGÉ — c'est ce qui fait bouger UNE PILE D'UN BLOC.
   *
   * Keko : « quand je fais bouger la carte du dessus d'une pile avec ma
   * souris, elle traverse celle d'en dessous, il faudrait bouger tout le
   * paquet ». *Deux cartes empilées ne sont pas deux objets à l'oeil*, donc
   * elles ne peuvent pas répondre séparément : la doublure lit le curseur de
   * la carte du dessus et s'incline exactement comme elle. Rotations
   * identiques autour de centres alignés : les deux plans restent parallèles,
   * ils ne peuvent plus se traverser.
   */
  const curseur = curseurPartage ?? propre.current

  const suivreLeCurseur = (e: ThreeEvent<PointerEvent>): void => {
    if (!reflet) return
    if (e.pointerType !== 'mouse' && !refletAuDoigt) return
    const g = groupe.current
    if (g === null) return
    // ON LIT LE POINT DANS LE REPÈRE DE LA CARTE : sa matrice monde porte
    // déjà sa taille, donc le résultat est en unités de carte quel que soit
    // le zoom.
    const local = g.worldToLocal(e.point.clone())
    curseur.dessus = true
    curseur.x = THREE.MathUtils.clamp(local.x / LARGE, -0.5, 0.5)
    curseur.y = THREE.MathUtils.clamp(local.y / HAUT, -0.5, 0.5)
  }

  // ELLE REJOINT SA PLACE, elle n'y saute pas. L'amortissement exponentiel est
  // indépendant de la fréquence d'écran : à 120 Hz comme à 60, le mouvement
  // dure le même temps.
  // LES PLANS DE DÉCOUPE SE POSENT SUR LES MATÉRIAUX, et il faut recompiler :
  // passer de « rien » à « deux plans » change le nuanceur, pas seulement une
  // valeur. Les matériaux sont propres à l'instance, donc on ne coupe jamais
  // la carte du voisin.
  // LA TOILE DU COMPTE se choisit sur les pixels physiques qu'il couvre, et le
  // dessin s'y peint à sa taille d'affichage : *réduire un bitmap n'est pas
  // rendre du texte.*
  useEffect(() => {
    if (pile === undefined || pile <= 0) return
    matCompte.map = textureNombre(pile, (largeurPx * pileTaille) / PART_DISQUE)
    matCompte.needsUpdate = true
  }, [matCompte, pile, largeurPx, pileTaille])

  useEffect(() => {
    for (const m of [face, laiton, halo, verso, aureole, matCompte]) {
      m.clippingPlanes = clipper
      m.needsUpdate = true
    }
  }, [clipper, face, laiton, halo, verso, aureole, matCompte])

  // LA TEXTURE DU DOS N'ARRIVE QUE QUAND LA CULBUTE COMMENCE : elle sort du
  // même cache partagé que les faces, donc la première la paie et les
  // suivantes la retrouvent prête.
  //
  // **MAIS LE FLIP, LUI, LA DEMANDE DÈS LE MONTAGE.** Il bascule la carte à
  // `π` au premier instant pour montrer son verso : *si la texture arrivait à
  // l'image d'après, on verrait un plan nu pendant une image*, juste là où le
  // raccord doit être invisible. La promesse est mémorisée, donc le coût est
  // nul — c'est le même cache que le dos qu'elle montre déjà.
  useEffect(() => {
    const demande = culbute ?? flip
    if (demande === null || demande === undefined || verso.map !== null) return
    let vivant = true
    void textureDuDos(rayon, dosDe(carte))
      .then((texture) => {
        if (!vivant) return
        verso.map = texture
        verso.color.setScalar(1)
        verso.needsUpdate = true
      })
      .catch(() => {})
    return () => {
      vivant = false
    }
  }, [culbute, flip, verso])

  const jeton = useRef(saut)

  useFrame((etat, delta) => {
    const g = groupe.current
    if (g === null) return
    // LE SAUT D'ABORD : la place lissée rejoint sa cible sans transition, et
    // l'amortissement qui suit n'a plus rien à rattraper.
    if (jeton.current !== saut) {
      jeton.current = saut
      lisse.current.p.set(position[0], position[1], position[2])
      lisse.current.r.set(rotation[0], rotation[1], rotation[2])
      lisse.current.t = taille
    }
    const k = 1 - Math.exp(-ressort * delta)
    const kz = 1 - Math.exp(-(ressortZ ?? ressort) * delta)
    const l = lisse.current
    l.p.x += (position[0] - l.p.x) * k
    l.p.y += (position[1] - l.p.y) * k
    l.p.z += (position[2] - l.p.z) * kz
    l.r.x += (rotation[0] - l.r.x) * k
    l.r.y += (rotation[1] - l.r.y) * k
    l.r.z += (rotation[2] - l.r.z) * k
    l.t += (taille - l.t) * k

    // LE FRÉMISSEMENT : court, rapide, et de deux fréquences qui ne retombent
    // jamais en phase — sinon il se lit comme un balancement régulier, donc
    // comme une animation, et non comme une carte qui vibre d'impatience.
    const t = etat.clock.elapsedTime
    const feuVise = engagee || peril ? 1 : verrou ? 0.52 : 0
    l.feu += (feuVise - l.feu) * (1 - Math.exp(-12 * delta))

    /**
     * **LE LISERÉ SE RÈGLE AVANT LE PLACEMENT, et c'est un correctif.**
     *
     * Il respire à peine — c'est ce qui le fait lire comme une lumière et non
     * comme un trait peint, sur la même horloge que le frémissement mais bien
     * plus lente : *deux battements rapides se liraient comme un clignotement
     * d'alerte.*
     *
     * Il vivait à la FIN de cette boucle, donc **après le `return` de la
     * culbute** : son opacité restait figée à la valeur qu'elle avait au
     * lâcher, c'est-à-dire allumée, puisqu'on lâche précisément au-dessus d'un
     * slot qui accepte. Or le plan du contour est DERRIÈRE la carte : à
     * mi-tour il passe DEVANT, et comme il est additif il délavait ce qu'il
     * recouvrait. Keko : « durant son animation de rotation, j'ai l'impression
     * qu'elle devient transparente, ou que certaines parties le sont » — et
     * c'était vrai, par bandes, là où la texture du contour est la plus
     * lumineuse.
     *
     * *Ce qui ne dépend que de l'état ne doit pas vivre derrière un `return`
     * qui, lui, ne parle que de placement.* `l.feu` retombait bien à zéro ;
     * c'est la matière qui ne le lisait plus.
     */
    halo.color.set(peril ? '#ff6a52' : verrou && !engagee ? '#a9c9e4' : '#ffe6ab')
    // LE VERROU NE RESPIRE PAS : *ce qui est figé ne scintille pas.* La
    // pulsation reste à l'engagement, qui est un geste en cours.
    halo.opacity =
      verrou && !engagee && !peril ? l.feu : l.feu * (0.88 + Math.sin(t * 6) * 0.12)

    // **LE FRÉMISSEMENT SUIT `engagee`, LA COULEUR SUIT `peril`**, et les deux
    // se cumulent. Le péril coupait le tremblement, ce qui était juste pour
    // une carte POSÉE dans le rebut — elle n'est plus dans un geste — mais
    // faux pour une carte qu'on TIENT au-dessus de lui : là on est en plein
    // geste, et Keko veut qu'elle vibre en rouge. *Un état dit ce qui va
    // arriver, l'autre dit qu'on est en train de le faire.*
    const amp = engagee ? l.feu * 0.014 : 0

    /**
     * ELLE S'INCLINE SOUS LE CURSEUR, et le lustre le suit.
     *
     * L'inclinaison se pose PAR-DESSUS la rotation lissée, comme le
     * frémissement se pose par-dessus la position : mêlée à elle, elle serait
     * mangée par l'amortissement, qui la ramènerait vers la cible en croyant
     * corriger un écart.
     *
     * Elle s'avance aussi d'un cheveu — *un objet qu'on regarde vient vers
     * soi* — et c'est ce qui fait que l'inclinaison se lit comme du volume et
     * non comme une image qui gondole.
     */
    const kReflet = 1 - Math.exp(-9 * delta)
    const dessus = reflet && curseur.dessus
    l.brille += ((dessus ? (curseur.eclat ?? 1) : 0) - l.brille) * kReflet
    l.vx += ((dessus ? curseur.x : 0) - l.vx) * kReflet
    l.vy += ((dessus ? curseur.y : 0) - l.vy) * kReflet

    /**
     * LA CULBUTE PREND LA MAIN SUR TOUT LE RESTE, et c'est voulu : pendant
     * qu'elle se joue, la carte n'est plus un objet qui rejoint sa place, elle
     * est une mise en scène. L'amortissement reprend à la fin, remis à la
     * cible pour qu'il n'ait rien à rattraper.
     */
    if (jetonDevelop.current !== developpe) {
      jetonDevelop.current = developpe
      if (developpe !== null && developpe !== undefined) l.debutDevelop = t
    }
    if (jetonFlip.current !== flip) {
      jetonFlip.current = flip
      if (flip !== null && flip !== undefined) l.debutFlip = t
    }
    if (jetonPompe.current !== pompe) {
      jetonPompe.current = pompe
      // UNE CARTE QUI TOURNE POMPE QUAND ELLE A FINI DE TOURNER. Keko : « la
      // première carte révélée n'a pas d'effet pump ». *Elle en avait un*, mais
      // il se jouait pendant le flip, de dos puis de profil — et un pompage
      // vu par la tranche ne se voit pas. Il attend donc la fin du demi-tour.
      if (pompe !== null && pompe !== undefined)
        l.debutPompe = t + (l.debutFlip !== null ? Math.max(0, DUREE_FLIP - (t - l.debutFlip)) : 0)
    }
    if (jetonRebond.current !== rebond) {
      jetonRebond.current = rebond
      if (rebond !== null && rebond !== undefined) l.debutRebond = t
    }
    if (jetonCulbute.current !== culbute) {
      jetonCulbute.current = culbute
      if (culbute !== null && culbute !== undefined) {
        l.debutCulbute = t
        l.depart.copy(l.p)
        l.departT = l.t
      }
    }
    if (l.debutCulbute !== null) {
      const dt = t - l.debutCulbute
      if (dt < DUREE_CULBUTE) {
        const p = dt / DUREE_CULBUTE
        // ELLE MONTE VERS LA CAMÉRA, puis TOMBE D'UN COUP. Le premier temps
        // freine en arrivant (on la regarde tourner), le second part de rien
        // et accélère jusqu'au bout — *c'est le contraste qui fait le poids,
        // pas la distance.*
        let x: number, y: number, z: number, ech: number
        const haut = APPROCHE_CULBUTE * l.departT
        const grosse = l.departT * (1 + ENFLE_CULBUTE)
        // Elle ne fait qu'un tiers du chemin en montant : le reste se fait
        // dans la chute, et c'est ce qui la rend brutale.
        const xHaut = l.depart.x + (position[0] - l.depart.x) * 0.35
        const yHaut = l.depart.y + (position[1] - l.depart.y) * 0.35 + haut * 0.1
        if (p < PART_MONTEE) {
          const q = p / PART_MONTEE
          const m = 1 - (1 - q) * (1 - q) * (1 - q)
          x = l.depart.x + (xHaut - l.depart.x) * m
          y = l.depart.y + (yHaut - l.depart.y) * m
          z = l.depart.z + haut * m
          ech = l.departT + (grosse - l.departT) * m
        } else {
          const q = (p - PART_MONTEE) / (1 - PART_MONTEE)
          const c = q * q * q
          x = xHaut + (position[0] - xHaut) * c
          y = yHaut + (position[1] - yHaut) * c
          z = l.depart.z + haut * (1 - c) + (position[2] - l.depart.z) * c
          ech = grosse + (taille - grosse) * c
        }
        g.position.set(x, y, z)
        g.scale.setScalar(ech)
        // LES TOURS SE FONT SUR TOUTE LA SÉQUENCE et tombent JUSTE : deux
        // tours entiers, donc la face revient devant au moment où elle se
        // fixe. Un compte qui ne retombe pas rond finirait de biais.
        const r = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2
        g.rotation.set(0, TOURS_CULBUTE * Math.PI * 2 * r, 0)
        return
      }
      // ELLE SE POSE, et l'amortissement repart de la cible : sinon il
      // rattraperait un écart que la mise en scène vient d'inventer. C'est
      // aussi l'instant où l'onde s'échappe.
      l.debutOnde = t
      l.debutCulbute = null
      l.p.set(position[0], position[1], position[2])
      l.r.set(rotation[0], rotation[1], rotation[2])
      l.t = taille
      // LA CARTE DIT QU'ELLE S'EST FIXÉE ; ce que ça veut dire appartient à
      // l'écran. *Elle ne connaît pas les sons* — même partage que le geste,
      // où le hook annonce « tapée », « lâchée ici », et rien de plus.
      onFixee?.()
    }

    /**
     * EST-ELLE ARRIVÉE ? On ne le dit qu'à la TRANSITION, sinon ce serait un
     * message par image. Une culbute en cours compte comme un voyage : la
     * place lissée y est déjà à la cible alors que la carte, elle, tourne
     * encore en l'air.
     */
    const posee =
      l.debutCulbute === null &&
      Math.abs(l.p.x - position[0]) < SEUIL_ARRIVEE &&
      Math.abs(l.p.y - position[1]) < SEUIL_ARRIVEE &&
      Math.abs(l.t - taille) < SEUIL_ARRIVEE
    if (posee !== l.arrivee) {
      l.arrivee = posee
      if (posee) onArrivee?.()
    }

    g.position.set(
      l.p.x + Math.sin(t * 37) * amp,
      l.p.y + Math.cos(t * 29) * amp,
      l.p.z + l.brille * AVANCEE_REFLET * l.t,
    )
    g.rotation.set(
      l.r.x - l.vy * INCLINAISON_REFLET,
      l.r.y + l.vx * INCLINAISON_REFLET,
      l.r.z + (engagee ? Math.sin(t * 23) * l.feu * 0.018 : 0),
    )
    // LE REBOND ÉLASTIQUE SE POSE PAR-DESSUS LA TAILLE LISSÉE, comme le
    // frémissement par-dessus la place : une sinusoïde amortie qui part de 1,
    // monte, repasse en dessous, et s'éteint — voir ELASTIQUE.
    let elastique = 1
    if (l.debutRebond !== null) {
      const s = t - l.debutRebond
      if (s >= ELASTIQUE.duree) l.debutRebond = null
      else elastique = 1 + ELASTIQUE.amplitude * Math.exp(-ELASTIQUE.amorti * s) * Math.sin(ELASTIQUE.pulsation * s)
    }
    if (l.debutPompe !== null) {
      const s = t - l.debutPompe
      if (s >= POMPE_CARTE.duree) l.debutPompe = null
      // ELLE NE FAIT QUE GONFLER, JAMAIS SE CONTRACTER : Keko, « quand la carte
      // pump elle laisse apparaître les cartes de derrière durant la
      // contraction ». Un sinus redressé — des rebonds au-dessus de 1, jamais
      // en dessous —, à la même cadence de trois battements par seconde.
      else if (s >= 0)
        elastique *=
          1 + amplitudePompe * Math.exp(-POMPE_CARTE.amorti * s) * Math.abs(Math.sin(POMPE_CARTE.pulsation * s))
    }
    g.scale.setScalar(l.t * elastique)

    /**
     * LE DEMI-TOUR SE POSE PAR-DESSUS LE PLACEMENT, il ne le remplace pas.
     *
     * *C'est tout ce qui le sépare de la culbute* : celle-ci court-circuite la
     * place, la taille et l'amortissement parce qu'elle EST un voyage ; le flip
     * ne touche qu'à un angle, donc la carte continue de rejoindre sa place
     * pendant qu'elle tourne. **Il écrase quand même l'inclinaison du reflet** :
     * une carte qui tourne n'a pas de face à offrir au curseur.
     *
     * La course va de `π` à `2π`, et elle ne retombe pas par hasard : *la carte
     * montre son verso au premier instant et sa face avant au dernier*, donc
     * les deux bouts sont exactement ce qu'on voyait avant et ce qu'on veut
     * voir après.
     */
    if (l.debutFlip !== null) {
      const dt = t - l.debutFlip
      if (dt >= DUREE_FLIP) l.debutFlip = null
      else {
        const p = dt / DUREE_FLIP
        // Vive au départ, posée à l'arrivée — *on lance la carte, on ne la
        // pousse pas jusqu'au bout.*
        const e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2
        g.rotation.y = Math.PI * (1 + e)
      }
    }

    // ET LE CONTOUR S'ALLUME. **Rien ne touche plus à la carte elle-même** :
    // une émission, même faible, lave l'illustration au moment précis où l'on
    // décide de la jouer. Keko : « plutôt qu'une lueur sur la carte on peut pas
    // un contour brillant ? ». La lumière est donc DERRIÈRE, et ce qui dépasse
    // fait le liseré.
    // DANS LA MAIN, TOUT CE QUI EST INJOUABLE EST ÉTEINT. Sans ce retour, une
    // carte trop chère ne répond pas et **rien ne dit pourquoi** : on croit à
    // un bug. Keko : « j'ai un bug où je ne peux pas jouer de carte
    // offensive » — c'était l'énergie, refusée en silence.
    //
    // On assombrit au lieu de rendre translucide : les cartes se recouvrent en
    // éventail, et une carte transparente laisse voir sa voisine au travers —
    // c'est la règle du jeu 2D, et elle tient d'autant plus ici que le
    // matériau ne sait pas désaturer sans un shader.
    const eteinte = 1 - Math.exp(-14 * delta)
    const cible = jouable ? 1 : 0.52
    l.vif += (cible - l.vif) * eteinte
    // La couleur MULTIPLIE la texture : sans texture, la laisser monter à 1
    // donnerait une dalle blanche. On attend qu'il y ait quelque chose à
    // éclairer.
    if (face.map !== null) face.color.setScalar(l.vif)
    laiton.color.setRGB(0.718 * l.vif, 0.604 * l.vif, 0.416 * l.vif)

    // La désaturation suit le même amortissement : la carte s'éteint ET perd
    // ses couleurs d'un seul mouvement.
    const gris = (1 - l.vif) / (1 - 0.52)
    const nuanceur = face.userData.nuanceur as
      | { uniforms: Record<string, { value: number | THREE.Texture | THREE.Vector3 }> }
      | undefined
    if (nuanceur !== undefined) {
      nuanceur.uniforms.uGris!.value = gris
      // L'APLAT SE SATURE D'AUTANT QU'IL EST VIF : une carte éteinte ne se
      // sature pas. Voir `aplat` et SATURATION_APLAT.
      nuanceur.uniforms.uSature!.value = aplat ? SATURATION_APLAT * l.vif : 0
      // LE MASQUE DU SUJET VIENT AVEC LA TEXTURE DE LA FACE : voir
      // RAYONS_BRILLANTS. Sans lui (animé, dos, autre mode), rien ne brille.
      const masque = (face.map?.userData.masqueSujet ?? null) as THREE.Texture | null
      nuanceur.uniforms.uMasqueSujet!.value = masque ?? MASQUE_VIDE
      nuanceur.uniforms.uRayons!.value = masque !== null && AVEC_RAYONS_BRILLANTS && dos !== true ? 1 : 0
      // L'IRISATION N'EST PAS UNE OPTION DE MATÉRIAU, c'est une propriété de
      // la carte : un uniforme plutôt qu'un second programme, sinon chaque
      // rareté compilerait son nuanceur.
      //
      // **ET LE MÉTAL S'ÉTEINT AVEC LA FACE.** Quand la carte est face cachée,
      // c'est CETTE surface qui porte le dos — le `verso` n'existe que le temps
      // d'une culbute. Le foil continuait donc de courir sur le dos, et à
      // l'ouverture d'un paquet le diamant se signalait **avant d'être
      // retourné** : il n'y avait plus rien à révéler. *Le dos ne dit rien de
      // ce qu'il y a dessous*, c'est déjà la règle qui le garde en laiton.
      const montre = dos !== true
      // LA BANDE SE POSE SOUS LE CURSEUR, elle ne le fuit pas : la diagonale
      // de la carte vaut `(u + v) / 2`, et le point visé y tombe exactement.
      // *Un reflet qu'on ne peut pas promener n'est pas un reflet, c'est une
      // animation.*
      const sousLeDoigt = 0.5 + (l.vx + l.vy) * 0.5
      // ET SUR UNE HOLO, ELLE SE PROMÈNE TOUTE SEULE tant que personne ne la
      // tient. *Le passage est un MÉLANGE et non un test* : à seuil, la bande
      // sauterait de sa course à la place du curseur dès qu'on approche.
      const holo = montre && carte.holo === true
      const seule = -0.3 + 1.6 * ((t * VITESSE_HOLO) % 1)
      nuanceur.uniforms.uLustre!.value = holo
        ? seule + (sousLeDoigt - seule) * l.brille
        : sousLeDoigt
      // Il RESPIRE à peine, sur l'horloge lente du liseré : c'est ce qui le
      // fait lire comme de la lumière et non comme un aplat peint.
      // ELLE EST DISCRÈTE. Keko l'a trouvée « un peu forte » : un lustre qui
      // délave l'illustration cesse d'être une matière et devient un voile.
      nuanceur.uniforms.uLustreForce!.value = l.brille * (0.13 + Math.sin(t * 3) * 0.03)
      // L'ÉCLAT SE DEMANDE À LA TABLE, il ne se lit plus sur une égalité de
      // chaîne : l'orange du mode emoji s'appelle aussi « légendaire » sans
      // rien devoir irriser.
      const eclat = montre ? eclatDe(carte.rarete) : null
      /**
       * ET L'HOLOGRAPHIQUE SE CUMULE AU CRAN, il ne le remplace pas.
       *
       * Keko : « holographique ne doit pas changer la couleur de la carte : on
       * rajoute l'effet holographique par-dessus ».
       *
       * *Et le foil lui-même ne s'emprunte pas tel quel* : il a un SOUFFLE
       * permanent, qui teinte toute la carte et repeint donc le cran. L'holo
       * n'en garde que la BANDE — celle qui traverse — et elle a son uniforme
       * à elle. *Une feuille se pose dessus, un voile se substitue.*
       */
      nuanceur.uniforms.uIris!.value = eclat === 'iris' ? 1 : 0
      // ELLE S'ÉTEINT AVEC LA CARTE, comme tout le reste : *une pièce hors jeu
      // ne rayonne pas*, et une carte face cachée ne dit pas ce qu'elle est.
      nuanceur.uniforms.uHolo!.value = holo ? l.vif * FORCE_HOLO : 0
      // LE TOUR DE LUMIÈRE EST AU DIAMANT SEUL, et il s'éteint avec la carte :
      // une pièce hors jeu ne rayonne pas.
      nuanceur.uniforms.uTemps!.value = t
      nuanceur.uniforms.uBordure!.value = eclat === 'iris' ? l.vif : 0
      // ET LE REFLET PREND LA COULEUR DU CRAN — le crème sur un dos, parce
      // qu'*une carte retournée ne dit rien de ce qu'elle est.*
      const ton = montre ? tonDuLustre(carte.rarete) : TON_CREME
      const vTon = nuanceur.uniforms.uTonLustre!.value as THREE.Vector3
      vTon.set(ton[0], ton[1], ton[2])
      // LE PAVE SE POSE DES QU'IL EST LA — voir l'effet qui le charge.
      // LE DEVELOPPEMENT SE PILOTE ICI, et pas dans le bloc de la culbute :
      // *toute matiere posee apres le `return` de la culbute est figee pendant
      // qu'elle se joue* — la regle deja payee par le liseré du contour. Les
      // deux ne se jouent jamais ensemble, mais on ne pose pas une valeur
      // derriere une porte qui peut se fermer.
      if (l.debutDevelop !== null) {
        const dv = (t - l.debutDevelop) / DUREE_DEVELOP
        if (dv >= 1) {
          l.debutDevelop = null
          nuanceur.uniforms.uDevelop!.value = 0
          // ELLE S'EST REVELEE, et c'est le meme message que « elle s'est
          // fixee » : *la carte dit ce qui lui arrive, l'ecran decide de ce
          // que ca veut dire.*
          onFixee?.()
        } else {
          // LA LUMIERE SE RETIRE REGULIEREMENT, et c'est le SHADER qui donne
          // sa forme au geste : le voile global tombe au carre, les flaques
          // tiennent jusqu'au bout. *Deux vitesses dans un seul chiffre* — une
          // courbe de plus ici ne ferait que les confondre.
          nuanceur.uniforms.uDevelop!.value = Math.pow(1 - dv, 1.15)
        }
      }
    }

    // L'AURÉOLE TOURNE ET RESPIRE. Deux fréquences qui ne retombent jamais en
    // phase, comme le frémissement : *un battement régulier se lit comme un
    // clignotement d'alerte.*
    /**
     * UNE CARTE FACE CACHÉE NE RAYONNE PAS, SI PRÉCIEUSE SOIT-ELLE.
     *
     * *Le dos ne dit rien de ce qu'il y a dessous* — c'est déjà la règle qui le
     * garde en laiton quand le cadre de la face change de métal. L'auréole, elle,
     * vit DERRIÈRE la carte, donc elle débordait du dos : à l'ouverture d'un
     * paquet, le légendaire se signalait **avant même d'être retourné**, et il
     * n'y avait plus rien à révéler.
     *
     * Elle s'allume donc au retournement, ce qui est exactement son moment.
     */
    const parure = dos === true ? null : eclatDe(carte.rarete)
    if (parure !== null) {
      const chromatique = parure === 'iris'
      aureole.uniforms.uTemps!.value = t
      aureole.uniforms.uArc!.value = chromatique ? 1 : 0
      // L'OR RAYONNE PLUS SAGEMENT QUE LE DIAMANT : il n'a qu'une couleur,
      // donc rien ne fait varier sa lueur — *une lumière qui ne change pas
      // doit être plus discrète, sinon elle devient un décor.*
      aureole.uniforms.uForce!.value =
        l.vif *
        ((chromatique ? 1.05 : 0.78) +
          Math.sin(t * 1.7) * 0.16 +
          Math.sin(t * 2.6) * 0.09)
    } else {
      // ON L'ÉTEINT EXPLICITEMENT : un uniforme garde sa dernière valeur, donc
      // une carte qui CESSE d'être précieuse — ou qui se retourne — resterait
      // allumée. *Ce qui ne se remet pas à zéro ne s'éteint jamais.*
      aureole.uniforms.uForce!.value = 0
    }

    // L'APPARITION : la carte s'allume, puis la lumière tombe et l'image
    // prend le dessus. Elle grandit d'un cheveu en même temps — sans ça,
    // l'éclat se lirait comme un reflet plutôt que comme une naissance.
    let eclat = 0
    if (apparue !== null) {
      const dt = etat.clock.elapsedTime - apparue
      if (dt >= 0 && dt < DUREE_APPARITION) {
        const k = dt / DUREE_APPARITION
        eclat = (1 - k) * (1 - k)
        g.scale.setScalar(l.t * (1 + 0.1 * eclat))
      }
    }
    // L'APLAT : la peinture s'ajoute en émissif, par-dessus l'éclat de
    // l'apparition — voir `aplat`. La carte d'emoji ne connaît pas
    // l'apparition, donc l'éclat y vaut toujours zéro.
    face.emissiveIntensity = (aplat ? COMPLEMENT_APLAT : 0) + eclat * 1.5
    laiton.emissiveIntensity = eclat * 1.1
    if (aplat) {
      if (face.emissiveMap !== face.map) {
        face.emissiveMap = face.map
        face.needsUpdate = true
      }
      if (verso.emissiveMap !== verso.map) {
        verso.emissiveMap = verso.map
        verso.needsUpdate = true
      }
    }
    // L'ONDE, une fois la carte fixée dans son slot.
    if (l.debutOnde !== null) {
      if (poserLOnde(t - l.debutOnde, vague.current, matiereOnde, poussiere)) l.debutOnde = null
    }

  })

  return (
    <group ref={groupe} position={position}>
      {/* LE CONTOUR, derrière la carte : un plan plus grand qu'elle, qui porte
          la texture de lueur. Seul ce qui dépasse se voit — le centre est
          masqué par la carte. Il ne capte pas le pointeur : sans `raycast`
          neutralisé, il élargirait la zone sensible de tout son débord. */}
      <mesh position={[0, 0, -EPAISSEUR]} material={halo} raycast={() => null}>
        <planeGeometry args={[LARGE + DEBORD_CONTOUR * 2, HAUT + DEBORD_CONTOUR * 2]} />
      </mesh>

      {/* L'AURÉOLE DES DEUX MÉTAUX PRÉCIEUX, un cheveu derrière le halo
          ordinaire : quand une pièce est engagée, c'est l'or de l'engagement
          qu'on doit lire en premier — *un état du jeu passe devant une
          parure.* */}
      {eclatDe(carte.rarete) !== null && (
        <mesh position={[0, 0, -EPAISSEUR * 1.2]} material={aureole} raycast={() => null}>
          <planeGeometry args={[LARGE + DEBORD_AUREOLE * 2, HAUT + DEBORD_AUREOLE * 2]} />
        </mesh>
      )}

      {/* L'ONDE : le contour de la carte, posé DERRIÈRE elle. Elle part
          exactement à sa taille, donc on ne voit que ce qui dépasse — *c'est
          ce qui la fait sortir de dessous plutôt que se poser dessus.* Elle
          est toujours là et dort à opacité nulle : un objet qui naît au milieu
          d'un geste peut manquer la boucle, un objet qui existe déjà ne peut
          pas. */}
      <mesh
        ref={vague}
        geometry={GEOMETRIE_ONDE}
        material={matiereOnde}
        position={[0, 0, -EPAISSEUR * 1.5]}
        raycast={() => null}
        scale={1}
      />
      {/* LA POUSSIÈRE : des grains détachés du contour. *Un liseré dit la
          forme, le semis dit la matière* — la leçon des esquilles de la
          comète, où un ruban lisse avait eu besoin d'elles. */}
      <points
        geometry={poussiere.geometrie}
        material={poussiere.matiere}
        position={[0, 0, -EPAISSEUR * 1.5]}
        raycast={() => null}
        frustumCulled={false}
      />

      {/* LE NOMBRE D'EXEMPLAIRES, À CHEVAL SUR LE COIN BAS-DROIT. Il est
          enfant de la carte, donc il suit sa place amortie, sa taille et son
          inclinaison : *ce qui annote une carte bouge avec elle.* */}
      {pile !== undefined && pile > 0 && (
        <mesh
          position={[
            LARGE / 2 - pileTaille * (DEDANS_PILE - 0.5),
            -HAUT / 2 + pileTaille * (DEDANS_PILE - 0.5),
            EPAISSEUR / 2 + 0.003,
          ]}
          raycast={() => null}
        >
          {/* La toile est plus large que le disque : son ombre y loge. */}
          <planeGeometry args={[pileTaille / PART_DISQUE, pileTaille / PART_DISQUE]} />
          {/* LA TOILE SE CHOISIT SUR LES PIXELS PHYSIQUES qu'elle couvre, et le
              dessin s'y peint à sa taille d'affichage : *réduire un bitmap n'est
              pas rendre du texte.* La règle est celle des cartes. */}
          <primitive object={matCompte} attach="material" />
        </mesh>
      )}

      {/* LE CORPS : le laiton, tranche et coins arrondis compris. C'est lui
          qui porte les évènements — il couvre toute la carte.

          ELLE PROJETTE UNE OMBRE, ELLE N'EN REÇOIT PAS. Une carte qui reçoit
          des ombres reçoit aussi la SIENNE : à faible précision de carte
          d'ombre — ce qui est le cas sur un téléphone — ça se voit comme des
          taches sombres sur sa propre face, d'autant plus qu'elle est proche
          de la caméra. Le sol reçoit les ombres, c'est tout ce qu'il faut. */}
      <mesh
        ref={corpsMesh}
        castShadow={ombre}
        geometry={geometrieDuCorps(rayon)}
        material={laiton}
        raycast={raycastDuCorps}
        onPointerDown={onPointerDown}
        onPointerMove={reflet ? suivreLeCurseur : undefined}
        onPointerOver={(e) => {
          suivreLeCurseur(e)
          onPointerOver?.(e)
        }}
        onPointerOut={(e) => {
          curseur.dessus = false
          onPointerOut?.(e)
        }}
      >
        {/* LA FACE : la carte peinte, un cheveu devant le corps. Ses coins
            transparents laissent voir le laiton arrondi derrière. */}
        <mesh
          ref={faceMesh}
          geometry={GEOMETRIE_FACE}
          material={face}
          position={[0, 0, EPAISSEUR / 2 + 0.001]}
          raycast={() => null}
        />
        {/* LE VERSO, le temps d'une culbute OU d'un flip : sans lui, la carte
            disparaît un demi-tour sur deux et le geste ne se lit plus.
            *Mesuré à l'écran sur le flip* : le plan manquait, donc la première
            moitié du demi-tour montrait le laiton nu du corps — **la carte
            tournait bien, elle n'avait simplement pas de dos.** */}
        {(culbute ?? flip) !== null && (culbute ?? flip) !== undefined && (
          <mesh
            geometry={GEOMETRIE_FACE}
            material={verso}
            position={[0, 0, -EPAISSEUR / 2 - 0.001]}
            rotation={[0, Math.PI, 0]}
            raycast={() => null}
            // LE VERSO SE RANGE AVEC LA FACE, APRÈS LE CORPS. Une carte
            // `devant` efface la profondeur avant son corps : le verso, resté
            // à l'ordre 0, se dessinait AVANT et le corps le recouvrait — le
            // dos virait au laiton pendant tout le flip. Keko : « le dos devient
            // gris durant le flip au lieu de garder son image ».
            renderOrder={devant ? ORDRE_DEVANT + 1 : 0}
          />
        )}
      </mesh>
    </group>
  )
}

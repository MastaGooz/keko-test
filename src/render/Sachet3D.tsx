/**
 * LE SACHET QU'ON DÉCHIRE — ce qu'on ouvre avant de voir les cartes.
 *
 * *Un paquet qui montre ses cinq dos d'emblée n'est pas un paquet, c'est une
 * main face cachée* : rien n'est fermé, donc il n'y a rien à ouvrir. Le sachet
 * rend au geste ce que l'écran avait perdu — **on ouvre, puis on regarde.**
 *
 * **ON ARRACHE LA BANDE DU HAUT, ON NE CONSUME PAS LE SACHET**, et c'est toute
 * la correction. La première version faisait descendre un front incandescent
 * du haut vers le bas jusqu'à ce qu'il ne reste rien : *ça se lit comme un
 * objet qui brûle, pas comme un objet qu'on ouvre* — et surtout il ne restait
 * plus de sachet d'où les cartes auraient pu sortir.
 *
 * Trois pièces, et chacune fait un travail que les deux autres ne font pas :
 *
 * - **LE CORPS** reste. Son bord haut se carbonise au passage du front, et
 *   c'est lui qui rend les cartes ;
 * - **LA BANDE** se détache et s'envole en tournoyant. *Ce qu'on arrache doit
 *   aller quelque part* — sans elle, la déchirure serait une gomme ;
 * - **LA GERBE** d'étincelles monte de l'ouverture, bien au-dessus du sachet.
 *   Elle a son propre plan parce qu'*un effet ne peut pas déborder de la
 *   géométrie qui le porte.*
 *
 * **LE FRONT COURT À L'HORIZONTALE, LE LONG DE LA LIGNE POINTILLÉE** que la
 * texture a déjà dessinée. *Un sachet se déchire là où il est prévu pour* —
 * et c'est ce qui fait que le geste se comprend sans l'avoir appris.
 *
 * Les trois matériaux sont des `ShaderMaterial` écrits à la main, et le projet
 * connaît le prix : *un matériau écrit à la main ne bénéficie d'aucune des
 * règles du moteur qu'il ne demande pas* — pas de plans de découpe, pas
 * d'ombres. Aucun des deux ne sert ici : le sachet ne vit pas dans un meuble,
 * et il s'en va.
 */
import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import { hauteurVisibleA } from './Cadrage.tsx'
import { suivreLInclinaison, type Inclinaison } from './inclinaison.ts'
import {
  SON_CRAQUE,
  SON_POP,
  SON_EQUIPER,
  amorcerLeSon,
  cheminDe,
  diagnosticSon,
  jouerEnBoucle,
  reveillerLeSon,
  jouerSon,
  precharger,
  type SonEnBoucle,
} from './sons.ts'
import {
  LIGNE_DECHIRURE,
  POCHE,
  RAPPORT_SACHET,
  textureDesPlis,
  textureDuSachet,
  brillanceDuSachet,
} from './texture-carte.ts'

/**
 * LES TROIS TEMPS DE L'OUVERTURE, en secondes.
 *
 * *Le feu doit avoir le temps de prendre* — un front qui traverse en trois
 * dixièmes se lit comme un essuie-glace — et pas celui de lasser : on ouvre
 * un paquet après l'autre.
 *
 * ***ILS SONT EN SECONDES ET PLUS EN PARTS D'UN TOUT.*** Ils tenaient dans
 * `PART_FRONT`, une seule coupure entre la course et le reste — **et le reste
 * portait DEUX choses** : la bande qui s'envole et le film qui descend. Le jour
 * où il a fallu les séparer, une part ne pouvait plus le dire : *deux objets
 * qui durent chacun leur temps ne se décrivent pas par une fraction commune.*
 *
 * **LE FRONT puis la CHUTE** : on n'arrache pas ce qui tient encore par un
 * bout, et **la chute attend la gerbe** — voir `DUREE_GERBE`. *La bande, elle,
 * n'a plus de durée* : elle est projetée, et c'est le film qui dit quand
 * elle a fini — voir `LANCER`.
 */
const DUREE_FRONT = 0.63
const DUREE_CHUTE = 0.87
/**
 * LE POMPAGE DE L'ARRACHEMENT : le sachet gonfle d'un coup en crachant la
 * gerbe, puis se tasse — et c'est seulement ensuite qu'il descend. Keko : « on
 * peut faire un petit effet de gonflement sur le paquet au moment de la gerbe
 * finale avant qu'il descende ? Un petit pump juicy comme s'il crachait les
 * particules ». La descente attend donc `DUREE_POMPE` ; *elle entre encore
 * sous la vie de la gerbe*, donc l'ouverture entière ne s'allonge pas.
 * `POMPE` : de combien il gonfle (en part de sa taille), et sa pulsation.
 */
// PLUS FORT ET PLUS LENT — Keko : « peu visible, tu peux l'augmenter ? ».
// *Un gonflement de 9 % qui s'éteint en un dixième de seconde passe sous
// l'oeil* : 20 %, un amorti qui le laisse respirer, et la descente qui
// l'attend d'autant.
const DUREE_POMPE = 0.3
const POMPE = { amplitude: 0.2, amorti: 7, pulsation: 2 * Math.PI * 1.9 }

/**
 * LA BANDE EST PROJETÉE, une fois arrachée — c'est le lancer de lexicodex.
 *
 * Keko : **« je voudrais que la bande soit projetée avec plus de puissance,
 * l'ouverture est un petit feu d'artifice. Regarde sur lexicodex comment la
 * partie bande déchirée se comporte »**.
 *
 * ***RELEVÉ DANS LEUR CODE*** (`completeTear` et `updateFlying`) : la bande est
 * poussée à `v = (dir × 2,4 ; 6,5 ; 3,2)` dans leurs unités — un sachet de 3
 * de large — sous une pesanteur de **16**, **sans aucun frein**, et elle
 * CULBUTE sur trois axes à `w = (2..4 ; ±1,5 ; −dir × 4..7)` rad/s ; elle est
 * retirée à 2,2 s, hors cadre depuis longtemps. *Convertis en largeurs de
 * sachet* (leur unité vaut un tiers de largeur) : un lancer à
 * `(0,8 ; 2,17 ; 1,07)` largeurs par seconde, une pesanteur de 5,33. **La
 * bande monte à 0,44 largeur au-dessus de la fente en quatre dixièmes de
 * seconde, retombe à sa hauteur de départ à 0,8 s, et file ensuite** — c'est
 * ce qui fait le feu d'artifice : *une montée franche, puis une chute qui ne
 * ralentit jamais.*
 *
 * **LA PLUME EST PARTIE AVEC SES FREINS.** Elle avait été faite sur la
 * demande d'avant — « flottant comme une plume avec la friction de l'air » —
 * et c'est l'inverse d'une projection : *un frein est ce qui retire de la
 * puissance à un lancer.* Ses chiffres restent dans `git log`.
 *
 * **ET LA CULBUTE EST FIXE, au milieu de leurs plages** : *une matière n'est
 * pas un tirage de partie* — la règle des plis, seedés en dur — et un paquet
 * rejoué à la même graine doit montrer la même bande. Elle roule dans le sens
 * du lancer (`z`, négatif vers la droite), tangue vers la caméra (`x`) et
 * vrille à peine (`y`) : *c'est la culbute qui montre tour à tour l'envers
 * crème et l'imprimé*, et c'est ce que Keko avait lu comme une plume.
 *
 * **ELLE S'EFFACE AVEC LE FILM, toujours.** Keko : « quand le paquet n'est
 * plus visible, elle ne doit plus l'être non plus ». Son fondu lit la
 * descente du film (`FONDU_BANDE`), donc elle est partie à l'instant exact
 * où lui quitte le cadre — *deux objets qui doivent disparaître ensemble
 * lisent le même chiffre.* À ce lancer, elle a de toute façon presque quitté
 * le cadre par le bas à cet instant-là ; le fondu couvre les écrans hauts, où
 * le bas est loin.
 *
 * Tout est en LARGEURS DE SACHET et en secondes.
 */
const LANCER = {
  /** La vitesse de départ : à droite, franchement en l'air, et vers la caméra. */
  v: { x: 0.8, y: 2.17, z: 1.07 },
  /** La pesanteur, en largeurs par seconde carrée — la leur, convertie. */
  pesanteur: 5.33,
  /** La culbute, en radians par seconde sur chaque axe. */
  culbute: { x: 3, y: 0.75, z: -5.5 },
  /** La vie au-delà de laquelle on cesse d'attendre qu'elle sorte du cadre. */
  vieMax: 8,
} as const
/**
 * À PARTIR D'OÙ LA BANDE S'EFFACE, en part de la DESCENTE DU FILM. À 0,5 le
 * film n'est descendu que d'un tiers (sa course accélère) ; elle s'éteint sur
 * la seconde moitié et vaut zéro quand le film est hors cadre. *À 0 elle
 * s'effacerait dès que le film bouge, à 1 elle disparaîtrait d'un coup.*
 */
const FONDU_BANDE = 0.5
/**
 * OÙ LE FRONT COMMENCE, en parts de largeur. *Il sort des deux bords* : une
 * déchirure qui commencerait pile sur le bord se lirait comme un bord qui
 * s'efface.
 */
const FRONT_DEPART = -0.06

/**
 * LA COURBE DU FRONT : il suit le DOIGT, largeur pour largeur.
 *
 * Keko : **« les étincelles sont toujours un peu en retard à gauche de mon
 * doigt quand je slide sur le téléphone pour déchirer le booster »**.
 *
 * ***ET CE N'ÉTAIT PAS LA GERBE, C'ÉTAIT LE FRONT.*** Il partait lentement et
 * accélérait (1,45), ce qui est bien ce qu'une déchirure fait quand elle court
 * SEULE — mais **ici c'est le doigt qui la mène** : mesuré, le front n'allait
 * qu'à **42 % de la vitesse du doigt** au départ et ne le rattrapait qu'au
 * bout. Il prenait jusqu'à 0,185 largeur de retard, soit une cinquantaine de
 * pixels.
 *
 * ***UNE MAIN BAT UNE COURBE.*** À l'exposant 1 le front avance de 1,12 largeur
 * quand le doigt en fait 1 — donc il est sous lui du premier au dernier pixel,
 * et le retard tombe à 0,02 largeur au pire.
 *
 * **ET LA PHASE AUTOMATIQUE N'Y PERD RIEN**, ce qui n'allait pas de soi : elle
 * reprend là où le doigt a lâché, c'est-à-dire sur le dernier tiers de la
 * course, et sa durée est fixée par l'horloge et non par la courbe. *Elle y
 * file à vitesse constante au lieu d'accélérer* — et c'est de toute façon ce
 * qu'un film déjà amorcé fait.
 */
const COURBE_FRONT = 1

/**
 * LES TROIS GRANDEURS DU BORD DÉCHIRÉ, en parts de la HAUTEUR DU SACHET.
 *
 * Elles s'appliquent aux deux morceaux, qui n'ont pas la même hauteur : le
 * nuanceur les convertit dans le repère de chacun. *Écrites en parts du
 * morceau, le charbon de la bande serait six fois plus fin que celui du
 * corps* — et personne ne le verrait en lisant le code.
 */
/**
 * DE COMBIEN LES CARTES BOMBENT LE FILM, en parts de la LARGEUR du sachet.
 * *Un paquet de cinq cartes est une brique mince* — au-delà, la poche se lit
 * comme un ballon.
 *
 * **BAISSÉ TROIS FOIS** (0,095 → 0,07 → 0,05 → 0,042), Keko : « on dirait
 * qu'il est très épais », « le paquet semble encore trop épais », puis « on
 * peut diminuer encore un peu l'épaisseur du paquet ? »
 *
 * *Cinq cartes de douze millièmes font six centièmes de largeur de CARTE*,
 * soit 4,7 centièmes de largeur de SACHET — **on est donc désormais sous
 * l'épaisseur réelle**, et c'est voulu : une poche vue de face se lit toujours
 * plus bombée qu'elle n'est, parce que son galbe prend toute la lumière.
 *
 * **ET ÇA ADOUCIT LE RELIEF D'AUTANT** : la pente du flanc est le gradient du
 * profil FOIS cette hauteur, donc baisser l'épaisseur retire de l'angle
 * partout — c'est le second levier de « moins angulaire », après la marge du
 * congé.
 */
const REL_BOMBE = 0.042

/**
 * DE COMBIEN LES DEUX ARÊTES DU VENTRE SONT ARRONDIES — 0 vif, 1 sans arête.
 * *Une arête se voit à sa RUPTURE de pente* : ce congé en rend l'essentiel,
 * donc le pli se lit encore, sans le tranchant d'un pliage.
 *
 * **ET IL ÉTAIT INOPÉRANT AVANT QUE LA BORNE DU GRADIENT NE SOIT LEVÉE** :
 * celle-ci écrêtait la normale au milieu du flanc, donc elle y posait une
 * FACETTE PLATE — mesuré, 24,2° constants sur 56 % de la largeur du flanc.
 * *Un chanfrein à facette se lit comme une coupe au couteau*, et le congé ne
 * pouvait rien y faire : il adoucissait une pente que la borne reprenait.
 */
const ARRONDI_VENTRE = 0.85

/**
 * DE COMBIEN LA COUTURE DIAGONALE DES COINS EST ARRONDIE, en parts de la
 * hauteur du ventre. *Un minimum fait un pli en V, et aucun lissage posé
 * dessus ne peut l'ouvrir* — il faut un minimum qui soit lui-même arrondi.
 */
const RAYON_COIN_VENTRE = 0.35

/**
 * COMBIEN LA CARTE DES PLIS PÈSE DANS LA NORMALE, et de combien elle ombre
 * l'imprimé. *Un seul chiffre chacun* : la carte sait déjà où les plis sont
 * nombreux et où ils ne le sont pas.
 */
/**
 * DE COMBIEN LE CONGÉ MORD SUR LE DESSUS, en parts de largeur de sachet.
 *
 * ***C'EST LE SEUL RÉGLAGE QUI RENDE LE RELIEF MOINS ANGULAIRE.*** À hauteur
 * et à largeur de flanc fixes, **la pente moyenne du flanc est fixe** — le
 * congé ne fait que la déplacer du bord vers le milieu, et c'est pour ça que
 * le monter n'adoucissait rien. *La seule façon de la BAISSER est d'étaler la
 * transition sur plus de longueur.*
 *
 * **Et elle ne peut s'étaler que vers le DEDANS** : vers le dehors il n'y a
 * plus de sachet. **C'est aussi ce qu'un film fait** — il se tend sur l'angle
 * de la carte, donc il commence à descendre un peu AVANT l'arête : *un pli
 * qui casserait pile sur le bord du carton supposerait qu'on l'ait marqué à
 * l'ongle.*
 *
 * Le sommet ne descend pas d'un pixel et la hauteur ne bouge pas : seul le
 * début de la descente avance.
 */
const MARGE_VENTRE = 0.035

/**
 * LA BORNE DE LA PENTE DU VENTRE, en pente d'UV — et elle se DÉDUIT du profil
 * au lieu de s'écrire. *Le profil est borné par construction*, donc sa pente
 * maximale est connue : la rampe mêlée à sa smoothstep monte au plus de
 * `1 + ARRONDI/2`, la division du minimum arrondi la multiplie, et c'est le
 * flanc le plus ÉTROIT qui la convertit en pente d'UV. On garde cinq pour cent
 * de marge pour les différences finies, et il ne reste qu'un garde-fou.
 */
const BORNE_PENTE = (
  ((1 + ARRONDI_VENTRE / 2) / (1 - 0.25 * RAYON_COIN_VENTRE)) /
  Math.min(POCHE.flancX + MARGE_VENTRE, POCHE.flancY + MARGE_VENTRE / RAPPORT_SACHET) *
  1.05
).toFixed(1)

const PLI = 0.8
const OMBRE = 0.09

/**
 * LE FILM EST UN MÉTAL À 70 %, et c'est ce qui teinte ses reflets.
 *
 * Keko : « leur paquet a des lumières plus intenses qui prennent mieux la
 * couleur du paquet (pas blanc totalement) et surtout la texture rend plus
 * brillante, le nôtre fait trop mate ».
 *
 * ***LA RÉPONSE EST DANS LEUR MATÉRIAU, ET ELLE EST CHIFFRÉE.*** Leur sachet
 * est un `MeshStandardMaterial` dont la rugosité et la métallicité viennent
 * d'une carte : son aplat de fond vaut `rgb(255, 0.38 x 255, 0.70 x 255)`,
 * c'est-à-dire **rugosité 0,38 et métallicité 0,70** — et *un métal TEINTE son
 * reflet avec sa propre couleur*, là où un plastique le renvoie blanc. **Leur
 * reflet n'est pas blanc parce que leur film est un métal.**
 *
 * *C'est aussi ce qui règle le délavage par l'autre bout* : un éclat teinté par
 * l'imprimé ne peut pas le pousser vers le blanc, donc on peut le monter haut
 * sans effacer le « Ouvrir ici ». **La teinte n'est pas un ornement, c'est le
 * garde-fou.**
 */
const METAL = 0.85

/**
 * LES QUATRE LOBES DU REFLET, et le galbe.
 *
 * *Le lustre MULTIPLIE* — il éclaircit sans effacer la teinte, donc il peut
 * monter haut ; **les éclats des sources AJOUTENT**, parce qu'un point chaud
 * est de la lumière en plus et non la même lumière en plus fort.
 */
/**
 * LE GAIN D'ENSEMBLE DES QUATRE LAMPES — et c'est le SEUL chiffre qui soit de
 * moi dans ce groupe. *Leurs directions, leurs couleurs et leur rapport
 * d'intensité sont relevés* ; le niveau général, lui, se règle à l'oeil.
 *
 * Keko : « on peut renforcer encore le flashy des reflets qui épousent la
 * couleur du paquet ? » — **mesuré sur les pixels, le point chaud ne valait que
 * 1,09 fois le fond.** Un reflet qui ne dépasse son décor que de neuf pour cent
 * n'est pas un reflet, c'est une nuance.
 */
const GAIN_SOURCES = 2.1

const LUSTRE = 1.35
const ECLATS = 0.75
const FRESNEL = 0.3

/**
 * LES QUATRE SOURCES, et chacune a SA COULEUR.
 *
 * ***C'EST ÇA, LE « FLASHY QUAND LE PAQUET BOUGE ».*** Leur scène n'a pas une
 * lumière, elle en a cinq, et seule la première est blanche : une grande dalle
 * claire en haut à gauche, **une haute dalle CYAN à droite**, une dalle ROSE en
 * bas à gauche, une VIOLETTE en bas à droite, et un bandeau neutre derrière.
 * *Un sachet qui tourne sous une seule lampe ne fait que passer du sombre au
 * clair ; sous quatre teintes, il déroule un spectre.*
 *
 * Les directions et les couleurs sont les leurs, normalisées — **on ne choisit
 * rien, on relève.**
 */
const SOURCES: ReadonlyArray<{
  readonly dir: readonly [number, number, number]
  readonly couleur: readonly [number, number, number]
  readonly force: number
}> = [
  // ***LES FORCES AUSSI SONT RELEVÉES, et elles ne l'étaient pas.*** J'avais pris
  // leurs directions et leurs couleurs puis CHOISI les intensités — 0,52 contre
  // 0,40 au cyan, donc une clé à peine plus forte que son accent. **Chez eux le
  // rapport est de 2,4 à 1** (dalle blanche 2,4 contre 1,04 de luminance au
  // cyan), et c'est ce qui tient la hiérarchie : *un accent qui pèse autant que
  // la clé ne l'accompagne plus, il la contredit.*
  // la clé, blanche : c'est elle qui modèle le ventre et porte le lustre
  // LA CLÉ, blanche : elle modèle le ventre, porte le lustre et allume les
  // éclats des plis. **SA DIAGONALE EST À 45° DANS LE PLAN DE L'ÉCRAN** (x =
  // -y) — celle que tout le jeu respecte, et chez eux elle penchait de 36°,
  // donc le flanc du HAUT prenait tout et celui de GAUCHE rien.
  //
  // ***ET SON INCIDENCE EST UNE SECONDE GRANDEUR, INDEPENDANTE DE CETTE
  // DIAGONALE*** : c'est sa part de z, donc de combien elle arrive DE FACE.
  // Keko : « le paquet manque de reflet et de lumiere en position neutre ».
  // Elle etait a 44 degres de la normale, donc le demi-vecteur a 22, et un
  // lobe en puissance 26 n'y rend que 14 pour cent -- le plateau ne pouvait
  // pas briller au repos. A 36,9 degres il en rend 25.
  { dir: [-0.424, 0.424, 0.8], couleur: [1, 1, 1], force: 0.52 },
  // le cyan, à droite — la plus haute de leurs dalles
  { dir: [0.949, 0, 0.316], couleur: [0.29, 0.86, 1], force: 0.226 },
  // le rose, en bas à gauche
  { dir: [-0.491, -0.655, 0.573], couleur: [1, 0.37, 0.53], force: 0.167 },
  // le violet, en bas à droite
  { dir: [0.594, -0.446, 0.669], couleur: [0.5, 0.44, 1], force: 0.17 },
]

/** Le serré du lobe de chaque source. *Leur rugosité de 0,38 est un lobe net.* */
const SERRE = 46



const AMPLI = 0.02
const CHARBON = 0.035
const BRAISE = 0.013
/** Raccourci de lecture : la part du sachet que prend la bande. */
const L = LIGNE_DECHIRURE

/**
 * LA BANDE SE RECOURBE VERS L'AVANT PENDANT QU'ON LA DÉCHIRE.
 *
 * Keko : **« quand on déchire le paquet, la petite bande en haut, on peut faire
 * en sorte qu'elle se plie comme dans lexicodex ? Durant le déchirement elle se
 * recourbe vers l'avant »**.
 *
 * ***RELEVÉ DANS LEUR CODE*** (`setTear`, qui déplace les sommets de la bande au
 * CPU) : derrière le front, chaque sommet TOURNE autour de l'axe de la fente,
 * vers la caméra, d'un angle qui croît avec sa hauteur au-dessus d'elle —
 * `d = l · (1,1 + u · 1,4)` dans leurs unités (sachet de 3 sur 5) — et la
 * bande entière se soulève d'un rien. `l` est une rampe lissée sur 0,35 de
 * largeur derrière le front : *le film ne se plie pas d'un bloc, il se
 * recourbe à mesure qu'il se décolle.*
 *
 * **ICI C'EST LE NUANCEUR DE SOMMETS QUI LE FAIT**, pas le CPU : la bande a
 * déjà sa matière à elle, et le front y arrive déjà (`uFront`). Les chiffres
 * sont les leurs, convertis en LARGEURS DE SACHET — leur unité de hauteur vaut
 * un tiers de largeur, donc 1,4 par unité fait 4,2 par largeur. Au sommet de
 * notre bande (0,22 largeur) l'angle atteint **2,0 rad** : *le haut passe la
 * verticale et retombe devant*, comme un bord de papier qui s'enroule.
 *
 * **ET ELLE MONTRE SON ENVERS**, puisqu'elle se retourne : la face arrière est
 * le crème du support, celui que l'arrache met déjà à nu.
 */
/** La rampe du pli derrière le front, en part de la largeur (la leur). */
const PLI_RAMPE = 0.35
/** L'angle à la fente même, en radians (le leur). */
const PLI_BASE = 1.1
/** Ce que l'angle gagne par largeur de sachet au-dessus de la fente. */
const PLI_PENTE = 4.2
/** De combien la bande pliée se soulève, en largeurs : x, y, z (les leurs ÷ 3). */
const PLI_LEVEE = [0.02, 0.033, 0.053] as const

/**
 * JUSQU'OÙ LE DOIGT PEUT TIRER, en part de la course du front.
 *
 * *Un geste prépare, le relâchement conclut* : sans cette borne, tirer très
 * loin arracherait la bande au milieu du mouvement — donc sans décision.
 */
const TIRE_MAX = 0.9

/**
 * À PARTIR D'OÙ LE GESTE EST ACQUIS.
 *
 * En dessous, un lâcher ne conclut rien : **la déchirure reste où elle est**,
 * et le geste suivant la reprend de là. *Un sachet qu'on effleure ne s'ouvre
 * pas*, mais un sachet qu'on a commencé à déchirer ne se recolle pas non plus.
 *
 * **CE QUI EST DÉCHIRÉ LE RESTE.** Keko : « si le joueur slide back ou arrête
 * de slider, la déchirure ne s'annule pas : tout ce qui est déchiré le reste,
 * et si on lâche à plus de la moitié ça continue comme actuellement ». *Un film
 * qu'on a déchiré ne se recolle pas* — le front est donc un CLIQUET : le doigt
 * ne peut que le faire avancer (voir `bouger`), et un lâcher le laisse là. Le
 * `RETOUR` de 0,28 s qui refermait le sachet est parti avec ; il reste dans
 * `git log`.
 */
const SEUIL_TIRE = 0.5
/**
 * LE NIVEAU DU CRAQUEMENT PENDANT LA DÉCHIRURE. *C'est celui du banc
 * `?craque`, que Keko a entendu* — « ok je l'entends donc il existe » — donc
 * on ne le change pas : le fichier est à 0,024 de RMS, dix fois sous le pop,
 * et s'il faut plus fort c'est l'export qu'il faut remonter, pas un gain.
 */
const VOLUME_CRAQUE = 1
/**
 * COMBIEN DE TEMPS LE CRAQUEMENT SURVIT AU DERNIER PAS DU FRONT, en secondes.
 * *Un doigt avance par à-coups* — les évènements de pointeur n'arrivent pas à
 * chaque image — donc un gain qui se fermerait à la première image sans
 * avancée hacherait le son en pointillé. Un dixième de seconde couvre le trou
 * entre deux évènements, pas une pause.
 */
const TENUE_CRAQUE = 0.1
/** Le banc des étincelles : il tient la découpe à mi-course. Voir `useFrame`. */
const BANC_GERBE =
  typeof location !== 'undefined' && new URLSearchParams(location.search).has('gerbe')
/**
 * LE SACHET PENCHE AVEC LE TÉLÉPHONE. Keko : « tu crois que le paquet et les
 * cartes pourraient bouger quand on bouge le téléphone ? Sachet d'abord. »
 *
 * *Le reflet du film ne vit que si l'objet bouge* — et sur téléphone il n'y a
 * ni survol ni, hors du geste, de doigt posé : le balancement était tout ce
 * qui le faisait vivre. **L'inclinaison du téléphone est le même geste**, et
 * elle alimente la même cible de rotation que le curseur.
 *
 * **LE SACHET RESTE DROIT DANS LE MONDE QUAND LE TÉLÉPHONE PENCHE** : on
 * incline le haut du téléphone vers l'arrière, le haut du sachet vient vers
 * soi — comme un objet qui flotterait DANS le téléphone plutôt que collé à
 * l'écran. *C'est un choix de signe*, et il s'inverse en une ligne.
 *
 * `GYRO_GAIN` dit combien de la rotation du téléphone le sachet reprend, et
 * `GYRO_BORNE` jusqu'où : *une inclinaison qui suit le téléphone sans borne
 * finit par coucher l'objet*, la règle du penchant au doigt. Un quart de tour
 * de téléphone ne vaut donc que la borne. Le doigt posé et le survol passent
 * devant — pendant qu'on déchire, c'est le doigt qui penche. `?gyro=0` le
 * coupe, pour comparer.
 */
const GYRO_GAIN = 0.6
const GYRO_BORNE = 0.22
export const SANS_GYRO =
  typeof location !== 'undefined' && new URLSearchParams(location.search).get('gyro') === '0'
/** Le banc du craquement : le fichier en boucle, sans condition. Voir `jouerEnBoucle`. */
const BANC_CRAQUE =
  typeof location !== 'undefined' && new URLSearchParams(location.search).has('craque')
/** `?son` : la ligne de diagnostic du son pendant la déchirure. */
const BANC_SON =
  typeof location !== 'undefined' && new URLSearchParams(location.search).has('son')

/**
 * LE FRÉMISSEMENT DE LA DÉCHIRURE : combien une avancée l'excite (par largeur
 * de front), de combien il déplace le sachet (en part de sa taille) et de
 * combien il le fait tourner (radians). Voir `frisson`.
 */
const FRISSON = { gain: 14, deplacement: 0.012, angle: 0.025 }

/** Ce que le survol penche et avance : *un objet qu'on tourne vers soi.* */
const PENCHE = 0.26
const AVANCEE = 0.1
/**
 * CE QUE LE FILM NU GARDE DE SON REFLET, l'imprimé gardant tout : lustre,
 * lampes et éclats des plis y sont multipliés. *Chiffre à l'oeil*, à rejuger
 * par Keko — à 1 le sachet brille partout comme avant, à 0 seul l'imprimé
 * luit.
 */
const BRILLANCE_FILM = 0.75
/**
 * ET LES SOUDURES, ENCORE MOINS. Keko : « diminuer la brillance des parties
 * jaunes en haut et en bas (avec les dents) ». *Du film pressé à plat ne luit
 * pas comme du film tendu.* La carte de brillance porte trois niveaux : 0 la
 * soudure, 0,5 le film, 1 l'imprimé.
 */
const BRILLANCE_SOUDURE = 0.03
/** Le point de la fente tel que le relief le pose, recalculé à chaque image. */
const fenteReelle = new THREE.Vector3()
/**
 * LA SOURCE EST POSÉE UN PEU SOUS LA FENTE, en largeurs de sachet.
 *
 * Keko, une fois l'origine calée sur la fente réelle : « il faudrait encore
 * descendre un peu, car visuellement on voit les choses au-dessus de la fente
 * avec leur mouvement ». *Une étincelle naît allumée et part vers le haut* :
 * ce qu'on lit comme son point de naissance est déjà au-dessus de la ligne,
 * et son halo rayonne encore un dixième de largeur autour. Le retrait
 * compense ce qu'on voit, pas ce qu'on calcule — c'est un chiffre à l'oeil,
 * et il est à Keko.
 */
const RETRAIT_SOURCE = 0.04

/**
 * LE BALANCEMENT DE REPOS, en radians, et la BORNE du penchant au survol.
 *
 * Ils vivaient en dur dans la boucle et dans `penche`. *Ils décident aussi de
 * combien le bas du sachet RECULE*, donc le paquet a besoin de les lire — et
 * **deux endroits qui décriraient le même balancement se désaccorderaient au
 * premier réglage.**
 */
const BERCE_X = 0.055
const BERCE_Y = 0.085
const BORNE_PENCHE = 0.7

/**
 * DE COMBIEN LE COIN BAS DU SACHET RECULE AU PIRE, en largeurs de sachet.
 *
 * Keko : **« sur PC, quand je laisse le paquet bouger seul, on voit parfois la
 * carte le traverser en bas — on voit un coin de dos de carte traverser le
 * booster. »**
 *
 * ***C'EST LA RÈGLE DU PROJET, PAYÉE UNE SECONDE FOIS : une rotation est une
 * translation déguisée en profondeur.*** Un écart en z qui suffit à trancher
 * l'ordre de deux plans À PLAT ne suffit plus dès que l'un des deux tourne —
 * déjà payé sur le flip du défilé, où la carte traversait sa voisine.
 *
 * **LE COIN BAS RECULE DE DEUX TERMES QUI SE CUMULENT** : la rotation X
 * l'enfonce de `(H/2)·sin(ax)`, la rotation Y de `(L/2)·sin(ay)`. *L'avancée du
 * survol se retranche*, puisqu'elle accompagne le penchant.
 *
 * ***ET LE Z SE CALCULE, IL NE S'ÉCRIT PAS*** — la règle que la gerbe a déjà
 * coûtée : les cartes attendaient à un `0,06` posé à la main, que le
 * balancement a repris, et qu'un réglage de `PENCHE` aurait repris de nouveau.
 */
const RECUL_AU_SURVOL =
  (RAPPORT_SACHET / 2) * Math.sin(BERCE_X + BORNE_PENCHE * PENCHE) +
  0.5 * Math.sin(BERCE_Y + BORNE_PENCHE * PENCHE * 1.3) -
  AVANCEE
// ET LE TÉLÉPHONE PENCHE SANS AVANCER : au gyroscope le sachet prend jusqu'à
// `GYRO_BORNE` sur chaque axe PAR-DESSUS le balancement, et rien ne se
// retranche — c'est donc lui le pire cas, et le recul le lit aussi.
const RECUL_AU_GYRO =
  (RAPPORT_SACHET / 2) * Math.sin(BERCE_X + GYRO_BORNE) + 0.5 * Math.sin(BERCE_Y + GYRO_BORNE)
export const RECUL_DU_BAS = Math.max(RECUL_AU_SURVOL, RECUL_AU_GYRO)

/** Une texture d'un pixel transparent, le temps que le sachet soit peint. */
const VIDE = (() => {
  const t = new THREE.DataTexture(new Uint8Array([0, 0, 0, 0]), 1, 1)
  t.needsUpdate = true
  return t
})()

/**
 * CE QUI EST COMMUN AUX DEUX MORCEAUX : la déchirure elle-même.
 *
 * Le corps et la bande lisent la MÊME texture, chacun sa tranche (`uV0`,
 * `uV1`), et portent le MÊME bord déchiré — l'un par le haut, l'autre par le
 * bas. *Deux nuanceurs qui décriraient la même déchirure se désaccorderaient
 * au premier réglage*, et le raccord est précisément ce qui ne doit pas se
 * voir : les deux bords sont le même trait.
 */
/**
 * LE VENTRE DU SACHET — **le paquet de cartes qui est DEDANS le bombe.**
 *
 * Keko : « y'a pas d'effet de 3D : il faudrait que les reflets de lumière se
 * reflètent sur les bords bombés en avant, comme si le paquet de cartes dedans
 * bombait le paquet et que les bords étaient plus en arrière que la zone des
 * cartes ».
 *
 * ***ET C'EST DE LA GÉOMÉTRIE, PAS UNE NORMALE TRUQUÉE.*** Les sommets sont
 * vraiment poussés vers l'avant : la silhouette se bombe, la perspective joue,
 * et le reflet court sur le ventre parce qu'il y a un ventre. *Une normale
 * seule aurait donné un objet plat qui s'éclaire comme un objet rond* — et
 * c'est précisément ce que Keko lisait comme « pas d'effet de 3D » sur la
 * version d'avant, où seuls les 13 % extérieurs tournaient.
 *
 * **LE PROFIL EST UN PLATEAU PUIS UNE CHUTE**, et non un dôme : un paquet de
 * cartes est une BRIQUE — son dessus est plat et c'est au bord que le film
 * retombe. *C'est la RUPTURE de pente qui dessine une arête, pas la courbure* :
 * un demi-sinus, même aplati, est dérivable partout et n'en a aucune.
 *
 * **ET IL S'ÉTEINT AUX SOUDURES**, parce que le film y est PINCÉ à plat : le
 * ventre est la place des cartes, pas celle du sachet.
 */
const VENTRE = `
float ventre(vec2 p) {
  // DEHORS DE LA BOITE DE LA CARTE, sur chaque axe : negatif dessus, donc le
  // plateau vaut 1 partout ou il y a une carte dessous.
  vec2 d = abs(p - vec2(0.5, ${POCHE.centreY.toFixed(4)}))
         - vec2(${POCHE.demiX.toFixed(4)}, ${POCHE.demiY.toFixed(4)});
  // LA TRANSITION DEBORDE SUR LE DESSUS de MARGE_VENTRE, et c'est le seul
  // reglage qui rende le relief moins angulaire : *a hauteur et a largeur de
  // flanc fixes, la pente moyenne est fixe* -- le conge ne fait que la
  // deplacer. Elle ne peut s'etaler que vers le dedans, et c'est aussi ce
  // qu'un film fait : il se tend sur l'angle de la carte, donc il commence a
  // descendre avant l'arete. **La marge se compte en parts de LARGEUR**, donc
  // elle se divise par le rapport sur l'axe des y.
  float fx = 1.0 - clamp((d.x + ${MARGE_VENTRE.toFixed(4)}) / ${(POCHE.flancX + MARGE_VENTRE).toFixed(4)}, 0.0, 1.0);
  float fy = 1.0 - clamp((d.y + ${(MARGE_VENTRE / RAPPORT_SACHET).toFixed(4)}) / ${(POCHE.flancY + MARGE_VENTRE / RAPPORT_SACHET).toFixed(4)}, 0.0, 1.0);
  // LA COUTURE DES DEUX AXES EST UN MINIMUM ARRONDI, pas un minimum.
  //
  // Keko : « les aretes sont encore un peu trop marquees, surtout les
  // diagonales en haut droite et haut gauche ». ***Et aucun lissage pose sur
  // le resultat ne pouvait les ouvrir*** : une fonction croissante commute
  // avec un minimum, donc adoucir f revenait a adoucir chaque axe -- le V de
  // la couture restait un V exact. *Il faut arrondir le MINIMUM lui-meme.*
  //
  // La forme est le minimum polynomial classique : hors de la bande de
  // melange il vaut le minimum au bit pres, dedans il raccorde les deux pentes
  // par une parabole. Le terme qu'il retranche vaut k/4 la ou les deux axes
  // sont a egalite -- donc partout sur le plateau, uniformement : on le rend
  // par la division, et le plateau reste plat et a sa hauteur.
  float ec = clamp(0.5 + (fy - fx) / (2.0 * ${RAYON_COIN_VENTRE.toFixed(2)}), 0.0, 1.0);
  float f = mix(fy, fx, ec) - ${RAYON_COIN_VENTRE.toFixed(2)} * ec * (1.0 - ec);
  f = clamp(f / ${(1 - 0.25 * RAYON_COIN_VENTRE).toFixed(4)}, 0.0, 1.0);

  // LE CONGE DES DEUX ARETES DU PROFIL, et il se dose. *Un film n'a pas de pli
  // vif : il se tend sur l'angle de la carte, donc il garde un rayon.* On
  // melange la rampe droite avec sa smoothstep -- a 0 l'arete est vive, a 1 il
  // n'y a plus d'arete du tout (le dome qu'on avait ecarte), et entre les deux
  // la pente du MILIEU du flanc ne bouge presque pas pendant que les deux
  // jonctions s'arrondissent.
  return mix(f, f * f * (3.0 - 2.0 * f), ${ARRONDI_VENTRE.toFixed(2)});
}
`

const DECHIRURE = `
/**
 * LE FROISSÉ DU FILM — et c'est ce qui fait un SACHET plutôt qu'une image de
 * sachet.
 *
 * Keko : « dans lexicodex le paquet a une texture vraiment paquet, y'a des
 * petits plis et une vraie lumière, comme si le paquet avait la vraie matière
 * brillante ». ***Et c'est une MATIÈRE, pas un dessin*** : un pli imprimé dans
 * la texture serait toujours éclairé du même côté, donc il se lirait comme une
 * tache. **Un pli n'existe que parce que la lumière le trouve.**
 *
 * **DES ARÊTES, PAS DES VAGUES.** La valeur absolue replie chaque sinus sur
 * lui-même, donc
 * il a un minimum ANGULEUX — *une somme de sinus nus donne une tôle ondulée,
 * une somme de sinus repliés donne du papier froissé.*
 *
 * **ET LE DOMAINE EST TORDU AVANT D'ÊTRE LU** : sans ça les crêtes
 * restent parallèles et on lit une trame. *Deux sinus qui déplacent les
 * coordonnées des autres suffisent à casser la régularité* — c'est le moteur du
 * grain, pris par l'autre bout.
 *
 * **LES PLIS SONT PLUS SERRÉS EN X QU'EN Y**, parce qu'un sachet se froisse
 * dans le sens de sa longueur : il est pincé par ses deux soudures, donc ce qui
 * travaille est sa largeur.
 */


float ondule(float x) {
  // ELLE N'EST PAS DROITE, et c'est une somme de sinus plutôt qu'un hachage :
  // *un bruit par pixel donne une dentelure, une somme de sinus donne une
  // déchirure.* Trois fréquences qui ne retombent pas en phase.
  return sin(x * 13.0) * 0.1 + sin(x * 27.0 + 1.7) * 0.055 + sin(x * 47.0 + 3.1) * 0.03;
}

float des(vec2 m) {
  return fract(sin(dot(m, vec2(12.9898, 78.233))) * 43758.5453);
}
`

/**
 * LA MATIÈRE D'UN MORCEAU. **`estLeCorps` et non `haut`** : le morceau du
 * HAUT est la bande, et c'est le CORPS qui porte le bord déchiré en haut —
 * *un paramètre qui nomme la place dit l'inverse de ce dont on se sert*, et
 * il m'a fait écrire la déchirure à l'envers une fois.
 */
function matiereDuMorceau(estLeCorps: boolean): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    transparent: true,
    // IL NE S'ÉCRIT PAS DANS LA PROFONDEUR : la braise est additive et déborde
    // de la matière, donc elle masquerait ce qu'il y a derrière alors qu'elle
    // n'est que de la lumière.
    depthWrite: false,
    uniforms: {
      // VOIR versLineaire() : 1 quand la scène se rend dans une cible.
      uLineaire: { value: 0 },
      uSachet: { value: VIDE },
      // LA CARTE DE BRILLANCE : ce qui luit en plein (l'imprimé) et ce qui luit
      // moins (le film nu) — voir BRILLANCE_FILM.
      uBrillance: { value: VIDE },
      // LA CARTE DES PLIS : une normal map peinte une fois. *Les deux morceaux
      // lisent la MÊME*, sinon le pli s'arrêterait à la déchirure.
      uPlis: { value: VIDE },
      uV0: { value: 0 },
      uV1: { value: 1 },
      // LE FRONT PART HORS DU SACHET, et il le faut : à zéro, la gaussienne
      // de la braise vaut déjà 1 contre le bord gauche — *un sachet fermé
      // n'a aucune raison d'être allumé.* Il n'y a pas besoin d'un uniforme
      // de plus pour le dire, la place suffit.
      uFront: { value: -1 },
      uTemps: { value: 0 },
      uFondu: { value: 1 },
      // LE LUSTRE DU SURVOL : où le curseur se pose sur la DIAGONALE du
      // sachet, et combien il éclaire. *Deux morceaux qui calculeraient
      // chacun la leur montreraient deux reflets décalés au raccord.*
      // **CE QUE LE SACHET PENCHE**, en radians (x, y). *La lumière ne bouge
      // pas, c'est l'objet qui tourne sous elle* — et c'est la seule façon
      // d'avoir un reflet qui se comporte comme une matière : un lustre
      // piloté par la position du curseur reste un dessin qu'on promène.
      uPenche: { value: new THREE.Vector2() },
      uSurvol: { value: 0 },
      // DE COMBIEN LES CARTES BOMBENT LE FILM, en unités de scène.
      uBombe: { value: 0 },
      // LE PLI : 1 sur la bande, 0 sur le corps — *seul ce qu'on arrache se
      // recourbe.* La fente est à `uFente` sous l'origine du plan, et la
      // largeur du sachet convertit les chiffres de lexicodex en scène.
      uPli: { value: 0 },
      uFente: { value: 0 },
      uTaille: { value: 1 },
    },
    vertexShader: `uniform float uV0;
uniform float uV1;
uniform float uBombe;
uniform float uFront;
uniform float uPli;
uniform float uFente;
uniform float uTaille;
varying vec2 vUv;
varying float vPli;
${VENTRE}
void main() {
  vUv = uv;
  // LE REPÈRE DU SACHET ENTIER, ici aussi : *le ventre ne doit pas s'arrêter à
  // la déchirure*, sinon les deux morceaux ne seraient plus la même poche.
  vec2 sach = vec2(uv.x, mix(uV0, uV1, uv.y));
  vec3 pos = position;
  pos.z += ventre(sach) * uBombe;

  // LE PLI DE LA BANDE : derriere le front, elle TOURNE autour de l'axe de la
  // fente vers la camera, d'autant plus que le sommet est haut au-dessus
  // d'elle -- c'est le setTear de lexicodex, porte au nuanceur. La rampe l
  // se lisse sur PLI_RAMPE de largeur : *le film se recourbe a mesure qu'il
  // se decolle, il ne se plie pas d'un bloc.* Sur le corps uPli vaut zero,
  // donc rien ne bouge.
  float l = uPli * smoothstep(0.0, ${PLI_RAMPE.toFixed(2)}, uFront - uv.x);
  float u = pos.y + uFente;
  float d = l * (${PLI_BASE.toFixed(2)} + ${PLI_PENTE.toFixed(2)} * u / uTaille);
  float c = cos(d);
  float sn = sin(d);
  pos.y = -uFente + u * c - pos.z * sn;
  pos.z = u * sn + pos.z * c;
  // ET ELLE SE SOULEVE D'UN RIEN, comme la leur : ce qu'on decolle ne reste
  // pas colle a ce dont on le decolle.
  pos += l * uTaille * vec3(${PLI_LEVEE[0].toFixed(3)}, ${PLI_LEVEE[1].toFixed(3)}, ${PLI_LEVEE[2].toFixed(3)});
  vPli = d;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}`,
    fragmentShader: `uniform sampler2D uSachet;
uniform float uLineaire;
uniform sampler2D uBrillance;
uniform sampler2D uPlis;

// LA SORTIE REDESCEND EN LINEAIRE QUAND LA SCENE SE REND DANS UNE CIBLE (le
// bloom), et seulement alors. Ce nuanceur ecrit des couleurs PRETES A
// L'AFFICHAGE -- c'est le sachet que Keko a valide, a l'ecran, sans
// encodage de sortie. Rendu dans la cible lineaire du bloom puis encode en
// sRGB a la fin, il se faisait encoder DEUX FOIS : plus clair, moins
// sature. Keko : « le paquet semble un peu trop clair et moins sature ».
// On defait donc l'encodage ici (l'EOTF sRGB), pour que celui de la fin
// rende exactement ce que l'ecran montrait.
vec3 versLineaire(vec3 c) {
  return mix(c / 12.92, pow((c + 0.055) / 1.055, vec3(2.4)), step(0.04045, c));
}
uniform float uV0;
uniform float uV1;
uniform float uFront;
uniform float uTemps;
uniform float uFondu;
uniform vec2 uPenche;
uniform float uSurvol;
varying vec2 vUv;
varying float vPli;
${VENTRE}
${DECHIRURE}

// LES QUATRE LAMPES, EN UN SEUL ENDROIT. *Deux faces qui décriraient les mêmes
// lampes se désaccorderaient au premier réglage* : l'endroit du film et son
// envers argenté lisent la même fonction, sur la normale qu'on leur donne. La
// première est la clé, et c'est aussi elle qui modèle le ventre.
vec3 lampes(vec3 Nn, vec2 pen) {
  vec3 somme = vec3(0.0);
  vec3 Ls; vec3 Hs;
  Ls = normalize(vec3(${SOURCES[0]!.dir[0]!.toFixed(3)} + pen.x, ${SOURCES[0]!.dir[1]!.toFixed(3)} + pen.y, ${SOURCES[0]!.dir[2]!.toFixed(3)}));
  Hs = normalize(Ls + vec3(0.0, 0.0, 1.0));
  somme += vec3(${SOURCES[0]!.couleur[0]!.toFixed(2)}, ${SOURCES[0]!.couleur[1]!.toFixed(2)}, ${SOURCES[0]!.couleur[2]!.toFixed(2)})
         * pow(max(dot(Nn, Hs), 0.0), ${SERRE}.0) * ${(SOURCES[0]!.force * GAIN_SOURCES).toFixed(3)};
  Ls = normalize(vec3(${SOURCES[1]!.dir[0]!.toFixed(3)} + pen.x, ${SOURCES[1]!.dir[1]!.toFixed(3)} + pen.y, ${SOURCES[1]!.dir[2]!.toFixed(3)}));
  Hs = normalize(Ls + vec3(0.0, 0.0, 1.0));
  somme += vec3(${SOURCES[1]!.couleur[0]!.toFixed(2)}, ${SOURCES[1]!.couleur[1]!.toFixed(2)}, ${SOURCES[1]!.couleur[2]!.toFixed(2)})
         * pow(max(dot(Nn, Hs), 0.0), ${SERRE}.0) * ${(SOURCES[1]!.force * GAIN_SOURCES).toFixed(3)};
  Ls = normalize(vec3(${SOURCES[2]!.dir[0]!.toFixed(3)} + pen.x, ${SOURCES[2]!.dir[1]!.toFixed(3)} + pen.y, ${SOURCES[2]!.dir[2]!.toFixed(3)}));
  Hs = normalize(Ls + vec3(0.0, 0.0, 1.0));
  somme += vec3(${SOURCES[2]!.couleur[0]!.toFixed(2)}, ${SOURCES[2]!.couleur[1]!.toFixed(2)}, ${SOURCES[2]!.couleur[2]!.toFixed(2)})
         * pow(max(dot(Nn, Hs), 0.0), ${SERRE}.0) * ${(SOURCES[2]!.force * GAIN_SOURCES).toFixed(3)};
  Ls = normalize(vec3(${SOURCES[3]!.dir[0]!.toFixed(3)} + pen.x, ${SOURCES[3]!.dir[1]!.toFixed(3)} + pen.y, ${SOURCES[3]!.dir[2]!.toFixed(3)}));
  Hs = normalize(Ls + vec3(0.0, 0.0, 1.0));
  somme += vec3(${SOURCES[3]!.couleur[0]!.toFixed(2)}, ${SOURCES[3]!.couleur[1]!.toFixed(2)}, ${SOURCES[3]!.couleur[2]!.toFixed(2)})
         * pow(max(dot(Nn, Hs), 0.0), ${SERRE}.0) * ${(SOURCES[3]!.force * GAIN_SOURCES).toFixed(3)};
  return somme;
}

void main() {
  // LE REPÈRE DU SACHET ENTIER, pas celui du morceau : *les deux doivent
  // porter LE MÊME froissé*, sinon le pli s'arrête net à la déchirure et la
  // bande qui s'envole n'est plus faite du même film. Et il est mis au carré
  // par le rapport, sans quoi les plis seraient étirés deux fois en hauteur.
  vec2 sach = vec2(vUv.x, mix(uV0, uV1, vUv.y));
  vec4 tex = texture2D(uSachet, sach);
  // CE QUI LUIT, ET DE COMBIEN. Keko : « les petits carres bleus, les emoji et
  // le titre pourraient briller comme actuellement, et le fond du booster un
  // peu moins ». L'imprime garde tout son reflet, le film nu n'en garde que
  // BRILLANCE_FILM : c'est la carte de rugosite de lexicodex, prise par
  // l'autre bout -- une matiere pour le film, une autre pour ce qu'on y a
  // imprime. Le galbe de Fresnel, lui, est la forme du sachet : il ne la lit
  // pas.
  float vb = texture2D(uBrillance, sach).r;
  float bril = vb < 0.5
    ? mix(${BRILLANCE_SOUDURE.toFixed(2)}, ${BRILLANCE_FILM.toFixed(2)}, vb * 2.0)
    : mix(${BRILLANCE_FILM.toFixed(2)}, 1.0, (vb - 0.5) * 2.0);

  /**
   * LA NORMALE DU VENTRE, et c'est elle qui raconte la FORME.
   *
   * Les deux pentes se comptent dans le MONDE : un pas en y couvre
   * le rapport du sachet fois plus de longueur qu'un pas en x, donc la même
   * différence de hauteur y vaut une pente d'autant plus faible. *Sans ça le
   * ventre serait deux fois trop raide dans sa hauteur.*
   *
   * ***ET LA BORNE DE LA PENTE SE CALCULE, elle n'est plus un chiffre.*** Elle
   * avait été posée contre la tangente VERTICALE de la puissance 0,55, qui
   * n'existe plus depuis que le profil est un plateau et un flanc : *une borne
   * posée contre une singularité ne vaut plus quand la singularité
   * disparaît.* Montée une fois de 3 à 9, elle mordait encore — et ce qu'elle
   * écrêtait était le MILIEU du flanc, où elle posait une **facette plate**
   * que le congé ne pouvait pas ouvrir.
   *
   * Le profil est borné par construction, donc sa pente maximale se déduit :
   * la rampe mêlée à sa smoothstep monte au plus de 1 + ARRONDI/2, la
   * division du minimum arrondi la multiplie, et le flanc le plus étroit la
   * convertit en pente d'UV. La borne ne reste là que comme garde-fou.
   */
  float eb = 0.012;
  float gx = (ventre(sach + vec2(eb, 0.0)) - ventre(sach - vec2(eb, 0.0))) / (2.0 * eb);
  float gy = (ventre(sach + vec2(0.0, eb)) - ventre(sach - vec2(0.0, eb))) / (2.0 * eb);
  gx = clamp(gx, -${BORNE_PENTE}, ${BORNE_PENTE});
  gy = clamp(gy, -${BORNE_PENTE}, ${BORNE_PENTE});
  vec3 Nv = normalize(vec3(
    -gx * ${REL_BOMBE.toFixed(4)},
    -gy * ${(REL_BOMBE / RAPPORT_SACHET).toFixed(4)},
    1.0));

  // ***LA PENTE DES PLIS SE LIT, ELLE NE SE CALCULE PLUS.*** C'est une carte
  // de SEGMENTS peinte au canvas (voir peindreLesPlis) et c'est la seule
  // façon d'avoir un trait qui commence et qui finit : *un champ procédural
  // est partout à la fois, donc il ne sait faire que des ondes.*
  vec3 np = texture2D(uPlis, sach).xyz * 2.0 - 1.0;
  float hx = np.x;
  float hy = np.y;
  // **LES DEUX GRADIENTS S'AJOUTENT AVANT DE SE NORMALISER.** Le froissé n'est
  // plus qu'un DÉTAIL posé sur la forme : Keko — « la texture est trop présente,
  // et les reflets dedans empêchent de voir les motifs ». *Un relief de matière
  // qui pèse autant qu'un relief de forme efface la forme.*
  // **PLUS DE MODULATION PAR LE MOU** : *c'est la CARTE qui sait où sont les
  // plis*, et elle en pose quarante sur soixante-dix dans la marge. Une seconde
  // règle par-dessus dirait deux fois la même chose — et se désaccorderait de
  // la première au premier réglage.
  float pli = ${PLI.toFixed(2)};
  vec3 N = normalize(vec3(
    -(gx * ${REL_BOMBE.toFixed(4)} + hx * pli),
    -(gy * ${(REL_BOMBE / RAPPORT_SACHET).toFixed(4)} + hy * pli),
    1.0));

  // LA BANDE PLIEE TOURNE SES NORMALES AVEC ELLE : *une surface qui se
  // recourbe vers la camera doit s'eclairer comme telle*, sinon le pli ne
  // serait qu'une silhouette. Meme rotation que les sommets, autour de l'axe
  // de la fente. Sur le corps vPli vaut zero.
  {
    float cp = cos(vPli);
    float sp = sin(vPli);
    Nv = vec3(Nv.x, Nv.y * cp - Nv.z * sp, Nv.y * sp + Nv.z * cp);
    N = vec3(N.x, N.y * cp - N.z * sp, N.y * sp + N.z * cp);
  }

  // L'ENVERS EST LA MEME FACE, RETOURNEE. Keko : « la meme couleur un peu
  // doree que le cote face, avec la meme texture ». *La bande est la soudure
  // creme striee, et son dos lui ressemble* -- donc pas de matiere a part :
  // la meme texture, le meme froisse, les memes lampes, et seules les normales
  // se retournent pour qu'une face vue de dos s'eclaire comme une face. Le
  // creme, l'argent et le bleu du film ont ete essayes avant ; ils sont dans
  // git log.
  if (!gl_FrontFacing) {
    Nv = -Nv;
    N = -N;
  }

  // LE PENCHANT S'APPLIQUE AUX QUATRE SOURCES, et pas à la clé seule : *elles
  // sont fixes dans la pièce et c'est le sachet qui tourne*, donc elles
  // balaient toutes ensemble. Une seule qui bougerait se lirait comme une lampe
  // qu'on promène.
  //
  // ***L'AXE HORIZONTAL EST VOLONTAIREMENT A CONTRE-PHYSIQUE.*** Une lampe
  // fixe de la piece subit, dans le repere du SACHET, la rotation INVERSE de
  // l'objet : au premier ordre, une rotation de b autour de Y donne
  // L.x - L.z * b (elle part a GAUCHE) et une rotation de a autour de X donne
  // L.y + L.z * a (elle MONTE). Les deux axes n'ont donc pas le meme signe.
  //
  // **Le y suit cette regle, le x la prend a l'envers, et c'est un choix de
  // Keko** : « je preferais la lumiere a droite comme c'etait avant, le paquet
  // s'eclairait plus sur la fin de l'ouverture du coup c'etait mieux ».
  // *On tire la dechirure vers la DROITE*, donc le sachet s'allume a mesure
  // qu'on l'ouvre -- et au REPOS la lampe reste en haut-gauche, ce qu'il avait
  // valide. **Ne pas le "corriger" en croyant a un bug** : le signe juste a ete
  // essaye, mesure et ecarte.
  vec2 pen = vec2(uPenche.y, uPenche.x) * 2.4;

  // ***LA CLÉ N'EST PLUS ÉCRITE DEUX FOIS.*** Elle avait sa direction ici et une
  // autre dans la table des sources : **deux endroits qui décrivent la même
  // lampe se désaccordent au premier réglage**, et ils l'avaient déjà fait —
  // 36° d'un côté, 41° de l'autre. Elle vit dans la table, et c'est elle qui
  // modèle le ventre, porte le lustre et allume les éclats des plis.
  vec3 L = normalize(vec3(
    ${SOURCES[0]!.dir[0]!.toFixed(3)} + pen.x,
    ${SOURCES[0]!.dir[1]!.toFixed(3)} + pen.y,
    ${SOURCES[0]!.dir[2]!.toFixed(3)}));
  vec3 H = normalize(L + vec3(0.0, 0.0, 1.0));

  // L'OMBRE DES PLIS : elle module l'IMPRIMÉ lui-même. *C'est elle qui dit que
  // le dessin est posé sur quelque chose de froissé* — sans elle, le reflet
  // flotterait au-dessus d'une image plate.
  // **LE VOLUME S'ÉCRIT DANS L'IMPRIMÉ, LES PLIS PRESQUE PAS.** C'est le
  // partage que Keko demande : le ventre est clair, les bords retombent dans
  // l'ombre, et le froissé ne fait plus que frémir par-dessus (±2,5 %).
  // *Ce qui empêchait de lire les motifs, c'était que la matière pesait autant
  // que la forme.*
  // **ET LE PLANCHER DESCEND : 0,70 -> 0,62.** *Ce qui fait « mate », ce n'est
  // pas l'absence de reflet, c'est l'excès d'AMBIANT* — une surface éclairée de
  // partout n'a plus de part sombre à laquelle son reflet se compare. Le
  // plafond ne bouge pas (1,14), c'est l'écart qui se creuse.
  // LE PLANCHER D'AMBIANT EST REVENU A SA VALEUR D'ORIGINE apres un aller-retour (0,5, 0,56, 0,59 : « trop sombre » a chaque fois) : le « trop clair » du depart etait le double encodage sous le bloom, corrige depuis. Keko : « c'est
  // toujours trop clair le sachet ». *Multiplie, ne pose pas* : le film fonce
  // en gardant sa couleur, et son maximum retombe a 1.
  tex.rgb *= 0.74 + 0.52 * (dot(Nv, L) * 0.5 + 0.5);
  tex.rgb *= 1.0 - ${OMBRE.toFixed(3)} + ${(2 * OMBRE).toFixed(3)} * (dot(N, L) * 0.5 + 0.5);


  // CE QUI SE MESURE LE LONG DU BORD SE COMPTE EN PARTS DU SACHET, PAS DU
  // MORCEAU. Les deux n'ont pas la même hauteur — la bande n'en fait que
  // 0,145 — donc une même amplitude en UV y dessinerait deux traits
  // différents, et *les deux bords cesseraient d'être le même trait.*
  float ech = ${(estLeCorps ? 1 / (1 - L) : 1 / L).toFixed(4)};

  // LE BORD DÉCHIRÉ, dans le repère de CE morceau : le corps l'a en HAUT
  // (\`vUv.y = 1\`), la bande en BAS (\`vUv.y = 0\`). **Les deux ondulent en
  // SENS OPPOSÉ dans leur propre repère** : c'est ce qu'il faut pour qu'ils
  // décrivent la même ligne du canvas une fois chacun dans sa tranche, et
  // *le raccord est précisément ce qui ne doit pas se voir.*
  float onde = ondule(vUv.x) * ${AMPLI} * ech;
  float bord = ${estLeCorps ? '1.0 - onde' : '-onde'};
  float dedans = ${estLeCorps ? '(bord - vUv.y)' : '(vUv.y - bord)'};

  // CE QUI A DÉJÀ ÉTÉ TOUCHÉ : à gauche du front. *Le front court, il ne
  // tombe pas d'un bloc* — sinon la bande se détacherait d'un seul coup et on
  // n'aurait rien vu courir.
  // **Les bornes d'un \`smoothstep\` ne s'inversent pas** : la spécification
  // GLSL laisse le résultat indéfini quand \`edge0 >= edge1\`. On prend donc
  // le complément plutôt que de compter sur un pilote clément.
  float passe = 1.0 - smoothstep(uFront - 0.03, uFront + 0.03, vUv.x);

  // L'ARRACHE : juste au bord, la matière montre son ENVERS. *Sans elle le
  // sachet se coupe net, et une coupe nette n'est pas une déchirure.*
  //
  // **ELLE VA VERS LE CRÈME, PLUS VERS LE CHARBON.** Un film imprimé qui se
  // déchire ne noircit pas : *il laisse voir son support*, et le support de ce
  // sachet est le crème de son liseré. Le charbon disait un feu — et un paquet
  // d'emoji ne brûle pas, il s'ouvre.
  float arrache = (1.0 - smoothstep(0.0, ${CHARBON} * ech, dedans)) * passe;
  vec3 corps = mix(tex.rgb, vec3(1.0, 0.98, 0.94), arrache * 0.72);

  // LE SPÉCULAIRE : **c'est lui le « brillant » d'un sachet**, et il remplace
  // la bande de lustre qui courait sous le curseur. *Une bande posée sur une
  // diagonale est un dessin qu'on promène* ; celui-ci est calculé sur la
  // normale des plis, donc il s'accroche aux crêtes et saute les creux —
  // exactement ce que fait du mylar.
  //
  // **DEUX LOBES, et ils ne font pas le même travail** : un SERRÉ qui donne les
  // éclats sur les arêtes, un LARGE qui donne le satiné du reste. *Le serré
  // seul se lit comme des paillettes, le large seul comme du plastique mat.*
  //
  // **ET IL BRILLE À FOND SANS DÉLAVER, ce qui tient à son ÉTROITESSE.** Keko
  // voulait « une lumière plus vive qui brille à fond » ; monter l'intensité
  // en ÉLARGISSANT le lobe donne l'inverse — de grandes nappes blanches, donc
  // un voile, le défaut déjà payé sur le souffle du foil. *Le relief a baissé
  // en même temps, donc la normale varie moins : à exposant égal la tache
  // s'étale.* **On resserre d'autant qu'on allège le froissé**, et c'est le
  // produit des deux qui décide de ce qu'on voit.
  // **ET LES DEUX LOBES NE REGARDENT PAS LA MÊME NORMALE.** C'est tout le
  // partage : *le grand reflet appartient à la FORME*, donc il se calcule sur
  // le ventre seul et court dessus quand on incline — c'est ce que Keko
  // appelle « les reflets sur les bords bombés ». Les plis, eux, n'ont droit
  // qu'à des scintillements serrés.
  //
  // *Mêlés sur une seule normale, le lobe large accrochait les plis et rendait
  // les nappes blanches qu'on venait de retirer.*
  // **ET LE GRAND REFLET SE MULTIPLIE, IL NE S'AJOUTE PAS.** Keko : « les
  // reflets dedans empêchent de voir bien les motifs ».
  //
  // ***C'est exactement ça qui les effaçait*** : une lumière AJOUTÉE pousse
  // tous les canaux vers le blanc, donc elle efface la teinte de ce qu'elle
  // éclaire ; **une lumière MULTIPLIÉE éclaircit en gardant la couleur** — le
  // dessin reste lisible SOUS le reflet, et on peut donc le monter très haut.
  // *C'est ce que dit le film de lexicodex, dont le reflet est violet sur le
  // violet et or sur l'or* — vérifié à la capture.
  float lustre = pow(max(dot(Nv, H), 0.0), 26.0);
  corps *= 1.0 + lustre * ${LUSTRE.toFixed(2)} * bril;

  /**
   * ET LE MÉTAL TEINTE CE QU'IL RENVOIE — **c'est toute la demande de Keko.**
   *
   * *Un diélectrique renvoie la lumière telle qu'elle est* : son reflet est
   * blanc quelle que soit sa couleur, et c'est ce que faisaient nos éclats.
   * ***UN MÉTAL, LUI, FILTRE : son reflet prend sa propre teinte*** — c'est
   * pour ça qu'un cuivre a des reflets cuivrés et un or des reflets dorés.
   *
   * Le leur est métallique à 0,70 (relevé sur leur carte), donc on mélange :
   * **la teinte du film poussée à pleine clarté, ramenée vers le blanc du
   * reste.** Et c'est ce qui autorise enfin l'intensité — *un éclat de la
   * couleur de l'imprimé ne peut pas pousser l'imprimé vers le blanc.*
   */
  vec3 pur = corps / max(max(corps.r, corps.g), max(corps.b, 0.02));
  vec3 teinte = mix(vec3(1.0), pur, ${METAL.toFixed(2)});

  // **LE SURVOL PORTE SUR LES ÉCLATS TEINTÉS, plus sur le lustre.** C'est ce
  // qui avait dû être bridé de moitié : le lobe large couvre presque toute la
  // face, donc à pleine force il délavait le « Ouvrir ici ». *Teinté, un éclat
  // n'a plus rien à délaver* — l'intensité revient là où elle ne coûte rien.
  float feu = 1.0 + uSurvol * 1.3;

  // LES QUATRE SOURCES — la clé blanche, le cyan, le rose, le violet — par la
  // fonction qui les porte toutes : voir lampes(). *La clé y recalcule le H
  // du ventre à l'identique*, puisque c'est la même lampe.
  corps += teinte * lampes(Nv, pen) * feu * bril;

  // **LES ÉCLATS DES PLIS RESTENT À PART, et eux seuls lisent la normale des
  // plis** : ce sont de vrais points chauds, trop petits pour effacer quoi que
  // ce soit. *Un point qui sature est une étincelle, une nappe qui sature est
  // un voile.* Ils sont teintés comme les autres — un pli de film argenté
  // n'étincelle pas en blanc, il étincelle de la couleur du film.
  float eclats = pow(max(dot(N, H), 0.0), 150.0);
  corps += teinte * vec3(1.0, 0.97, 0.90) * eclats * ${ECLATS.toFixed(2)} * feu * bril;

  /**
   * ET LE BORD DU VENTRE S'ALLUME — **c'est du FRESNEL, pas un liseré.**
   *
   * *Un film plastique renvoie d'autant plus de lumière qu'on le regarde de
   * biais* : au sommet du coussin on voit à travers, sur ses flancs il devient
   * un miroir. **C'est ce qui donne son galbe à un sachet de booster**, et ça
   * ne se dessine pas — c'est l'inclinaison de la surface qui le produit.
   *
   * *Et il se calcule sur la normale du VENTRE*, jamais sur celle des plis :
   * un pli est une rainure de quelques pixels, et il allumerait une poussière
   * de points là où on veut une bande douce le long du galbe.
   *
   * **IL EST LE SEUL TERME QUI RESTE À MOITIÉ BLANC** : *au ras, un métal
   * renvoie tout* — c'est la seule part du reflet qu'une teinte ne filtre pas.
   */
  float fresnel = pow(1.0 - clamp(Nv.z, 0.0, 1.0), 3.0);
  corps += mix(vec3(0.82, 0.90, 1.0), teinte, ${(METAL / 2).toFixed(2)})
         * fresnel * ${FRESNEL.toFixed(2)};

  // L'ÉCLAT : une bande étroite au front, qui FRÉMIT. *Ce n'est plus une
  // braise* — elle allait de l'or chaud au blanc, c'est-à-dire un dégradé de
  // TEMPÉRATURE, et il n'y a rien qui chauffe ici. **C'est la lumière du
  // déchirement**, blanche au coeur et à peine crème en bordure : la même que
  // le liseré, donc la même que l'envers du film qu'on vient de mettre à nu.
  //
  // Elle ne vit qu'AUTOUR du point qui court : un éclat qui resterait allumé
  // derrière lui ferait une ligne de néon. Et il FRÉMIT sans vaciller — *un
  // vacillement est le mouvement d'une flamme.*
  float vif = exp(-pow((vUv.x - uFront) / 0.09, 2.0));
  float fremit = 0.86 + 0.14 * sin(vUv.x * 41.0 + uTemps * 11.0);
  float eclat = exp(-pow(dedans / (${BRAISE} * ech), 2.0)) * fremit * max(vif, passe * 0.22);
  vec3 lueur = mix(${ton(FENTE_BORD)}, ${ton(FENTE_COEUR)}, smoothstep(0.4, 1.0, eclat));

  // L'ENVERS EST ARGENTE : quand la bande passe la verticale, on voit son DOS,
  // et le dos d'un film de booster est son metal -- *l'interieur du sachet
  // est argente*, c'est aussi ce que dit le fragment de lexicodex. Il a ete
  // creme le temps d'un essai ; Keko : « c'est bizarre qu'elle soit blanche
  // de l'autre cote ». *Un dos qui garderait l'imprime ferait une bande
  // imprimee des deux cotes* : il garde donc la MATIERE et perd le dessin.
  // Meme froisse, meme ventre, normales retournees -- et comme un argent n'a
  // qu'une teinte, ses reflets sont ceux des lampes sans filtre : c'est le
  // film tel qu'il serait sans son imprime.
  float a = max(tex.a, eclat * 0.9) * uFondu;
  vec3 sortie = corps + lueur * eclat;
  if (uLineaire > 0.5) sortie = versLineaire(clamp(sortie, 0.0, 1.0));
  gl_FragColor = vec4(sortie, a);
  if (gl_FragColor.a < 0.004) discard;
}`,
  })
}

/**
 * LA GERBE : des ÉTINCELLES qui jaillissent de la fente, EN CLOCHE.
 *
 * Keko : « je trouve les confettis pas terribles, ce serait mieux d'avoir des
 * petites étincelles qui se produisent quand on avance dans l'ouverture, avec
 * une trajectoire en cloche comme dans lexicodex ; puis à l'ouverture finale
 * les étincelles jaillissent en plus grand nombre de toute l'ouverture, en
 * volant plus haut ».
 *
 * ***ET CE QUI MANQUAIT N'ÉTAIT PAS LA FORME DU GRAIN, C'ÉTAIT LA
 * TRAJECTOIRE.*** Les confettis étaient un SEMIS QUI DÉFILE — une grille de
 * cellules qui remonte — donc chaque grain montait tout droit, à la même
 * vitesse, pour toujours. *Un champ qui défile ne peut pas faire une cloche* :
 * il n'a ni départ, ni vitesse propre, ni pesanteur. C'est exactement la leçon
 * des plis, reprise ici : **un champ procédural continu ne sait faire que des
 * ondes ; ce qui a un début et une fin, il faut l'instancier.**
 *
 * Chaque étincelle est donc une PARTICULE — un quad instancié — avec sa place
 * de départ, sa vitesse et sa pesanteur. La cloche sort du calcul, elle n'est
 * pas dessinée : y vaut vy fois t moins g fois t au carré.
 *
 * **LE TRAIT A SUIVI LA TANGENTE, PUIS IL EST TOMBÉ AVEC LE TRAIT.** Il
 * s'allongeait dans le sens de la vitesse et se couchait à mesure qu'elle
 * retombait, pour que l'orientation RACONTE la cloche là où la forme ne dit
 * rien. *L'argument valait sur une image figée* ; à l'écran c'est le
 * DÉPLACEMENT qui raconte la trajectoire, et un éclat qui monte puis retombe
 * la dit aussi bien — **sans se lire comme un tracé**, ce que Keko a renvoyé.
 *
 * **ET C'EST UN ÉMETTEUR, PLUS UN CHAMP** — Keko : « elles ne doivent jaillir
 * que lors de l'ouverture (mouvement), pas à l'arrêt quand on arrête d'avancer
 * l'ouverture ». *La trajectoire était instanciée, le MOMENT ne l'était pas* :
 * chaque particule rejouait son vol en boucle et un uniforme ne faisait que
 * doser sa lumière — donc une déchirure tenue à mi-course coulait sans fin.
 * **La même leçon, payée une troisième fois, sur le temps au lieu de la
 * forme.**
 *
 * Le CPU écrit donc une NAISSANCE par étincelle émise (`aVol` : l'instant,
 * l'abscisse, la dérive, le jet), et il n'émet **que si le front a avancé
 * depuis l'image d'avant** — c'est exactement ce que fait lexicodex, dont
 * l'appel est `s > 0 && emitTearSparks(min(12, 1 + round(s * 90)))`.
 *
 * **DEUX RÉGIMES, ET LE SECOND N'EST PAS UN RÉGLAGE DU PREMIER** :
 *
 * - **pendant la déchirure**, elles naissent JUSTE DERRIÈRE le front — leur
 *   abscisse est tirée au carré, donc tassée contre lui : *ce qui produit
 *   l'étincelle est la découpe qui avance*, pas la fente déjà ouverte. Leur
 *   nombre suit l'avancée, donc la vitesse du doigt ;
 * - **à l'arrachement**, une RAFALE part de toute la largeur, deux fois plus
 *   haut. *Un jaillissement n'est pas une gerbe plus forte, c'est une autre
 *   gerbe* : sa source, son nombre et sa hauteur changent ensemble.
 *
 * **UN SEUL MAILLAGE PORTE LES DEUX**, parce que tout ce qui les sépare est
 * écrit dans la naissance : *un second objet pour le jaillissement aurait
 * dédoublé le nuanceur*, et les deux auraient divergé au premier réglage.
 *
 * **ET ELLES N'ONT QU'UNE COULEUR : CELLE DE LA FENTE.** Les cinq couleurs du
 * jeu étaient ce qui les séparait d'une gerbe de forge ; Keko a tranché mieux
 * — « la même couleur que la lumière générée par l'ouverture pour qu'on ait
 * l'impression qu'elles ne font qu'un ». *Elles lisent donc les deux tons du
 * liseré*, crème en bordure et presque-blanc au coeur — **un point qui sature
 * blanchit, sa frange garde la couleur**, la règle du halo du foil.
 */
const ETINCELLES = 256
/** La durée d'un vol, en secondes. */
const VIE_ETINCELLE = 0.48
/**
 * LE DÉBIT : combien d'étincelles une largeur de sachet d'AVANCÉE fait naître.
 *
 * Keko : **« elles ne doivent jaillir que lors de l'ouverture (mouvement),
 * pas à l'arrêt quand on arrête d'avancer l'ouverture »**. C'est donc ce
 * nombre, et lui seul, qui décide du nombre d'étincelles à l'écran : *à front
 * immobile il ne naît rien*, et un doigt qui tire deux fois plus vite en fait
 * naître deux fois plus par seconde.
 *
 * `RAFALE_MAX` borne une seule image, parce qu'un front peut sauter — à la
 * reprise d'un geste, ou quand une image a été longue.
 */
const DEBIT_ETINCELLE = 108
const RAFALE_MAX = 22
/**
 * LE JAILLISSEMENT est UNE RAFALE, plus un régime. Il part d'un coup à
 * l'arrachement — *un jaillissement n'a pas de montée, c'est ce qui en fait
 * un* — et ses naissances s'étalent sur un dixième de seconde, sans quoi les
 * cent quinze partiraient et retomberaient à l'unisson.
 */
const ECLAT_NOMBRE = 115
const ECLAT_ETALE = 0.11
/**
 * LA CLOCHE : la vitesse de départ, en largeurs de sachet par vie.
 *
 * Keko : **« c'est possible que les particules volent moins haut avant de
 * retomber ? je voudrais un modèle plus étincelles que confettis »**. La
 * cloche fait donc un tiers de moins — 0,17 largeur pendant la découpe,
 * 0,36 au jaillissement.
 *
 * ***ET LA PESANTEUR N'EST PLUS UN CHIFFRE : ELLE VAUT LA VITESSE.*** Les deux
 * étaient égales à dessein — l'apogée tombe alors au MILIEU de la vie et le
 * retour à sa fin, donc le vol tient exactement dans la vie qu'on lui donne —
 * **et une égalité qui s'écrit deux fois se désaccorde au premier réglage.**
 * Le vol vaut `vy·t·(1−t)`, donc la cloche monte à `vy/4` et retombe à `t=1`
 * quelle que soit la vitesse.
 */
const JET = 0.68
/**
 * LE JAILLISSEMENT EST UN FEU D'ARTIFICE — et c'est un autre régime que la
 * découpe, pas un réglage de celle-ci.
 *
 * Keko : **« je trouve l'explosion de particules à l'ouverture finale pas
 * terrible, je voudrais vraiment un effet feu d'artifice avec les particules
 * qui montent et fadent sans redescendre trop via gravité, comme dans
 * lexicodex »**.
 *
 * ***RELEVÉ DANS LEUR `completeTear`*** : 110 étincelles, un angle tiré dans
 * `±0,45·π` autour de la verticale, une vitesse de `2 + 7·hasard` dans leurs
 * unités (un sachet de 3 de large), **une pesanteur de 3 et un FREIN de 2,2
 * par seconde**, une vie de 0,6 à 1,5 s, un fondu linéaire qui commence à
 * 45 % de la vie. *Ce n'est pas la pesanteur qui arrête l'étincelle, c'est
 * l'air* : elle file, ralentit, et s'éteint à peu près là où l'air l'a
 * arrêtée — une pesanteur d'une largeur par seconde carrée ne la fait
 * redescendre que d'un rien. **Une parabole, elle, retombe toujours** : c'est
 * ce que Keko lisait comme une explosion.
 *
 * Tout est en LARGEURS DE SACHET et en secondes — convertis des leurs au
 * départ, la vitesse divisée par trois comme la pesanteur, le frein tel quel.
 *
 * **PUIS LE FREIN A DOUBLÉ, ET LE FONDU A RECULÉ.** Keko : « ce serait bien
 * que les particules soient rapides au début puis ralentissent avant de fader
 * en l'air, comme un vrai feu d'artifice ». *Le contraste est tout* : à 2,2
 * de frein l'étincelle gardait encore un tiers de sa vitesse quand le fondu
 * commençait, donc elle s'effaçait en marchant. À 4,5 elle a perdu 90 % de sa
 * vitesse en une demi-seconde — **elle file, s'arrête, puis s'éteint sur
 * place** — et le fondu attend 60 % de la vie pour qu'on la voie suspendue.
 * La vitesse de départ monte d'autant, pour que la portée (`v / frein`) ne
 * change pas : *un frein plus fort sans un lancer plus fort fait un pétard,
 * pas un feu d'artifice.*
 */
const FEU = {
  /** La vitesse de départ, tirée uniformément entre les deux. */
  vMin: 1.2,
  vMax: 5.5,
  /** Le frein de l'air, par seconde : `v *= exp(−frein·dt)`. */
  frein: 4.5,
  /** La pesanteur, en largeurs par seconde carrée — faible exprès. */
  pesanteur: 1,
  /** La vie nominale, en secondes ; chaque étincelle tire la sienne entre 0,75 et 1,25 fois. */
  vie: 0.8,
  /** À partir de quelle part de sa vie l'étincelle s'efface, linéairement jusqu'à la fin. */
  fondu: 0.6,
  /**
   * UNE PART DU FEU PART VERS LE BAS, ET MOINS VITE.
   *
   * Keko : « pour la gerbe finale on peut faire partir une partie des
   * particules également vers le bas (mais moins vite) pour éviter cet
   * effet de ligne ? » *Un jaillissement qui naît sur toute la largeur et ne
   * monte que vers le haut a un BORD : la fente* — on lit une règle tracée
   * sous le feu d'artifice. Des étincelles qui en tombent aussi effacent ce
   * bord. Elles partent dans le cône miroir, au même frein, et c'est le
   * ralenti qui dit qu'elles retombent au lieu d'être lancées.
   */
  partBas: 0.5,
  vitesseBas: 0.4,
} as const

/**
 * COMBIEN DE SA VIE UNE ÉTINCELLE MET À S'ALLUMER, en part de sa vie.
 *
 * Keko : **« la gerbe finale spawn un peu trop haut et ne monte pas assez, sa
 * vélocité doit être supérieure — genre feu d'artifice »**.
 *
 * ***ELLE NAISSAIT PILE À LA FENTE, ET ON NE LA VOYAIT QU'UNE FOIS PARTIE.***
 * Le fondu d'entrée prenait 7 % de la vie à toutes les étincelles — et sur un
 * jaillissement qui monte vite, 7 % de la vie c'est déjà 7 % de largeur de
 * sachet au-dessus de la fente (mesuré, 0,071 en moyenne, 0,096 au pire). *Ce
 * qu'on lit comme le point de naissance est le point où le grain devient
 * visible*, et plus la vitesse monte, plus il s'éloigne de la fente — monter
 * la vélocité sans toucher au fondu aurait AGGRAVÉ le « spawn trop haut ».
 *
 * **Une rafale naît donc ALLUMÉE** : elle sort du flash de la rupture, qui est
 * déjà blanc, donc rien ne pope. La découpe garde son fondu — ses étincelles
 * naissent une par une le long d'un front, et là un grain qui apparaît d'un
 * coup se verrait.
 */
const MONTEE_DECOUPE = 0.07
const MONTEE_ECLAT = 0.012

/**
 * CE QUE DURE LA GERBE FINALE, en secondes — ***calculée, jamais écrite.***
 *
 * Keko : **« il faudrait que le paquet reste en place durant la gerbe finale,
 * et qu'il descende une fois la gerbe terminée »**.
 *
 * *Deux choses se jouaient donc en même temps* — le film qui se retire et les
 * étincelles qui jaillissent — **et l'une mangeait l'autre** : la gerbe sort
 * de la fente, et la fente partait vers le bas pendant qu'elle volait.
 *
 * ***ELLE SE DÉDUIT DE LA VIE DES ÉTINCELLES***, étalement des naissances
 * compris et au pire cas de leur variance : la dernière née doit avoir fini
 * son vol. **Un chiffre écrit à la main se désaccorderait au premier réglage
 * de `VIE_ETINCELLE`** — la règle que le recul des cartes a déjà coûtée.
 */
const DUREE_GERBE = ECLAT_ETALE + FEU.vie * 1.25

/**
 * CE QUE DURE L'OUVERTURE ENTIÈRE, et **la part que le front en occupe.**
 *
 * *Elles vivent ici, après la gerbe, parce qu'elles en DÉPENDENT* : après
 * l'arrachement, le film descend ET la gerbe vole, EN MÊME TEMPS — Keko : « il
 * faudrait que le paquet descende dès le son pop ». La phase qui suit
 * l'arrachement dure donc le plus long des deux : le sachet ne se démonte pas
 * avant que la dernière étincelle se soit éteinte, même quand le film est
 * déjà hors cadre.
 *
 * *Le film a attendu la gerbe le temps d'un épisode* — « le paquet reste en
 * place durant la gerbe finale » — parce qu'alors la gerbe était une cloche
 * qui retombait sur la fente, et la fente partait pendant qu'elle volait.
 * **Depuis que la gerbe est un feu d'artifice qui s'éteint en l'air, elle n'a
 * plus besoin de la fente** : Keko a rouvert l'ordre, et c'est cohérent.
 */
export const DUREE_BRULURE = DUREE_FRONT + Math.max(DUREE_GERBE, DUREE_POMPE + DUREE_CHUTE)
const PART_FRONT = DUREE_FRONT / DUREE_BRULURE
/**
 * LA SOURCE EST LE FRONT LUI-MÊME, dispersée AUTOUR de lui.
 *
 * Keko : **« les étincelles devraient spawn là où le booster se déchire (donc
 * à l'extrémité droite de la déchirure en cours) ; là on dirait qu'elles
 * spawn un peu en retard »**.
 *
 * ***ET ELLES L'ÉTAIENT, PAR CONSTRUCTION*** : la source se tirait au CARRÉ
 * derrière le front, donc elle était en retard de 0,087 largeur en moyenne et
 * jamais en avance. *Un tirage qui ne va que d'un côté n'est pas une
 * dispersion, c'est un décalage.* Il est désormais SYMÉTRIQUE — « range de
 * variance autour du x du point de déchirure », dit Keko — donc le front est
 * la MOYENNE des naissances au lieu d'en être la borne.
 */
const DISPERSION_SOURCE = 0.06
/**
 * LA PLAGE D'ANGLES, et c'est elle qui tue l'effet FONTAINE.
 *
 * Keko : **« on peut donner une variance à l'angle des particules entre 15 et
 * 165 degrés par ex pour éviter l'effet fontaine ; effet fontaine = angle trop
 * réduit et spawn au même point »**.
 *
 * ***SON DIAGNOSTIC EST EXACT ET IL SE MESURE*** : la dérive s'ajoutait à un
 * jet constant, donc l'angle de départ tenait dans **77° à 103°** — un cône de
 * vingt-six degrés autour de la verticale, c'est-à-dire une fontaine. On tire
 * désormais l'ANGLE puis on le décompose, ce qui a ouvert la plage à 150°.
 *
 * **PUIS KEKO L'A RESSERRÉE À 120°** — « on peut réduire un peu l'angle des
 * particules ? 30-150 degrés ? » — et ***ça ne retire pas un centième à la
 * portée***, contre toute attente : depuis que la pesanteur est une constante,
 * celle-ci est BALISTIQUE, donc maximale à 45° et nulle au ras. Les angles
 * qu'on retire sont ceux qui portaient le MOINS. Ce qui change est la
 * répartition — **la cloche moyenne monte de 19 %**, et la part d'étincelles
 * qui partent bas tombe de 40 % à 25 %.
 *
 * **ET LES DEUX RAS SONT COUPÉS**, pas par prudence : à zéro une étincelle ne
 * décolle pas du film et rampe dessus — *ce qui jaillit d'une fente doit en
 * sortir.*
 *
 * **PUIS À 60°, PARCE QUE LA GERBE SE LISAIT COMME UN TRAIT.** Keko : « les
 * étincelles devraient jaillir plus vers le haut, en mode ça sort du paquet ;
 * là ça fait un trait trop horizontal ».
 *
 * ***ET C'EST LE RAPPORT HAUTEUR / LARGEUR QUI LE DIT, pas la hauteur.*** La
 * cloche vaut `vy·tf/4` et la portée `vx·tf`, donc leur rapport est
 * `tan(angle)/4` : à 30° il ne vaut que **0,14**, soit une étincelle sept fois
 * plus longue que haute. Mesuré sur la gerbe entière, la cloche moyenne valait
 * 0,081 pour 0,164 de portée — **une gerbe deux fois plus large que haute,
 * c'est-à-dire un trait.**
 *
 * **À 60-120° elle devient aussi haute que large** (0,104 contre 0,109, soit
 * un rapport de 0,95) : la portée moyenne tombe d'un tiers et la cloche gagne
 * 28 %. ***Et le ZÉNITH ne bouge pas d'un millième*** — c'est la répartition
 * qui change, pas le vol le plus haut, donc le réglage validé n'est pas touché.
 *
 * **ÇA NE RAMÈNE PAS LA FONTAINE**, et le diagnostic de Keko dit pourquoi :
 * elle demandait *un cône étroit ET une source ponctuelle*. Il reste soixante
 * degrés — plus du double du cône d'alors — et la source est dispersée sur
 * `DISPERSION_SOURCE`. *Les deux causes se cumulaient, aucune ne suffit seule.*
 */
const ANGLE_MIN = (60 * Math.PI) / 180
const ANGLE_MAX = (120 * Math.PI) / 180

/**
 * LA PLAGE DU JAILLISSEMENT, plus serrée que celle de la découpe.
 *
 * Keko : **« les particules de la gerbe finale volent un peu plus haut, avec un
 * angle plus restreint, et spawn sur toute la longueur »**.
 *
 * ***LES TROIS DEMANDES N'EN FONT QU'UNE, ET C'EST UN RIDEAU.*** Une source
 * ponctuelle et un cône étroit font une fontaine — *c'est le diagnostic de Keko
 * lui-même, et il tient* — **mais une source ÉTALÉE et un cône étroit font
 * exactement l'inverse** : une nappe qui monte sur toute la largeur de la
 * fente. Les deux causes se cumulaient, aucune ne suffit seule.
 *
 * **C'est donc le seul régime qui puisse se resserrer autant**, et c'est aussi
 * le seul qui ait toute l'ouverture pour naître : la découpe, elle, n'a qu'un
 * front.
 *
 * **PUIS ELLE S'EST ROUVERTE AVEC LE FEU D'ARTIFICE**, au cône de lexicodex
 * (`±0,45·π`, presque un demi-disque) : *ce qui faisait le trait horizontal
 * n'était pas l'angle, c'était la parabole* — une rasante sans frein file tout
 * droit, une rasante freinée s'arrête à une largeur et s'éteint. Voir `FEU`.
 *
 * **ET ELLE S'EST RESSERRÉE À ±60°.** Keko : « les particules du feu
 * d'artifice vont un peu trop loin sur les côtés ». *La portée latérale d'une
 * étincelle freinée vaut `v·sin(angle) / frein`*, donc c'est le cône, et lui
 * seul, qui la règle sans toucher à la montée : de ±81° à ±60°, la portée
 * latérale moyenne perd un cinquième et la plus longue 13 %, et la part des
 * rasantes tombe avec.
 */
const ANGLE_ECLAT_MIN = Math.PI / 2 - Math.PI / 3
const ANGLE_ECLAT_MAX = Math.PI / 2 + Math.PI / 3
/**
 * LA PESANTEUR, en multiples de la vitesse de départ du régime.
 *
 * Keko : **« on peut augmenter la gravité des particules pour éviter qu'elles
 * aillent trop loin sur les côtés ? »**
 *
 * ***ET IL N'Y EN AVAIT PAS, AU SENS OÙ UNE PESANTEUR EST UNE CONSTANTE.*** Le
 * vol vaut `vy·t·(1−t)`, ce qui revient à une pesanteur ÉGALE À `vy` — donc
 * réglée par étincelle pour que chaque vol dure exactement une vie. *Une
 * rasante avait ainsi une pesanteur quasi nulle* et filait tout droit du
 * premier au dernier instant : mesuré, **0,755 largeur de sachet**, deux fois
 * et demie la hauteur de sa propre cloche.
 *
 * **À pesanteur CONSTANTE, le vol se termine quand l'étincelle retombe** —
 * `tf = vy / pesanteur`, jamais plus tard que sa vie — et la portée redevient
 * balistique : `sin(2θ)`, nulle au ras comme au zénith, maximale à 45°.
 *
 * ***SA VALEUR NATURELLE EST LA VITESSE DE DÉPART***, et c'est ce qui rend le
 * réglage sûr : à 1, l'étincelle VERTICALE retombe toujours pile à la fin de
 * sa vie, donc **la cloche du zénith ne bouge pas d'un millième** — 0,170
 * largeur à la découpe, 0,360 au jaillissement, exactement ce que Keko avait
 * validé. Seules les rasantes se raccourcissent.
 *
 * **ELLE EST RELATIVE AU RÉGIME**, comme la vitesse et la hauteur de cloche :
 * *le jaillissement n'est pas un réglage de la découpe*, et une pesanteur
 * absolue y laisserait la gerbe filer quatre fois plus loin, sa vitesse étant
 * double. À 0, on retrouve le vol d'avant.
 *
 * ***ET AU-DELÀ DE 1 ELLE CESSE DE CHANGER LA FORME : elle ne fait plus que
 * RÉTRÉCIR.*** Keko : « augmente encore la pesanteur ». Sous 1, le bornage
 * `min(1, …)` protège le zénith et seules les rasantes se raccourcissent —
 * *c'est un réglage de forme.* Au-delà, le bornage ne mord plus nulle part :
 * la portée et la cloche valent toutes deux `v² / pesanteur`, donc **toute la
 * gerbe se contracte du même facteur.** À 1,5, tout vaut les deux tiers.
 *
 * **CONSÉQUENCE À CONNAÎTRE** : passé ce point, *la monter ou baisser la
 * vitesse de départ font exactement la même chose* — diviser par `k` revient à
 * diviser `JET` par `√k`. Ce n'est plus qu'un facteur d'échelle, et la cloche
 * du zénith n'est plus protégée : elle tombe de 0,170 à 0,113.
 */
const PESANTEUR = 1.5
/**
 * LA LUMIÈRE DU DÉCHIREMENT : crème en bordure, blanche au coeur.
 *
 * Keko : **« il faut que les étincelles aient la même couleur que la lumière
 * générée par l'ouverture pour qu'on ait l'impression qu'elles ne font qu'un,
 * inutile de les faire multicolores »**.
 *
 * ***DONC C'EST LA MÊME CONSTANTE, PAS UNE COULEUR VOISINE*** : le liseré de
 * la fente et l'étincelle qui en sort la lisent tous les deux — *deux endroits
 * qui décriraient la même couleur se désaccorderaient au premier réglage.*
 * **Chez lexicodex c'est exactement le même choix** : leurs étincelles de
 * déchirure ne tirent que deux teintes, un crème `(1 ; 0,82 ; 0,55)` et du
 * blanc, moitié-moitié.
 *
 * *Les cinq couleurs du jeu tombent avec* : elles étaient ce qui séparait ces
 * étincelles d'une gerbe de forge — **et une seule couleur qui est celle de la
 * fente le fait mieux**, puisqu'elle ne dit plus « du feu » du tout, elle dit
 * « cette lumière-là ».
 */
const FENTE_BORD: readonly [number, number, number] = [1.5, 1.35, 1.05]
const FENTE_COEUR: readonly [number, number, number] = [2.2, 2.1, 1.9]
/** De combien une étincelle brûle plus fort que le liseré qui la lâche. */
const GAIN_ETINCELLE = 1.78

/** Un ton en GLSL, mis à l'échelle : *une couleur se décrit en un seul endroit.* */
function ton(c: readonly [number, number, number], k = 1): string {
  return `vec3(${(c[0] * k).toFixed(2)}, ${(c[1] * k).toFixed(2)}, ${(c[2] * k).toFixed(2)})`
}
/**
 * L'ÉCLAT D'UNE ÉTINCELLE : le côté de son quad, en largeurs de sachet.
 *
 * Keko : **« ça fait des traînées blanches, on dirait des traits, je voyais
 * plus des étincelles en mode flair »**.
 *
 * ***ET LE TRAIT ÉTAIT LA FAUTE, PAS SON RÉGLAGE.*** Il avait été allongé
 * pour fuir le confetti — « un trait deux fois plus long que large est une
 * pastille » — puis grossi d'une moitié : au lancer il mesurait **0,283
 * largeur de sachet**, c'est-à-dire près de quatre-vingts pixels. *Un dessin
 * qui tient l'écran sur sa longueur n'est plus un grain, c'est un tracé.*
 *
 * **UN FLAIR N'A PAS DE LONGUEUR, IL A DES BRANCHES.** Ce qui sépare un éclat
 * d'un confetti n'était donc pas son rapport mais sa FORME : un coeur saturé,
 * une frange qui rayonne, et quatre branches fines qui partent en croix.
 * *Quatre branches ne disent aucune direction* — c'est ce qui les distingue
 * d'un trait — et le projet avait déjà tranché ce dessin pour la gemme des
 * trésors : **six branches égales font une étoile de David, quatre branches
 * fines ne disent que la lumière.**
 *
 * **LE GRAIN NE RAPETISSE PAS POUR AUTANT** : son coeur plein vaut
 * `TAILLE_ECLAT × COEUR_ECLAT`, soit à un millième près la largeur qu'avait le
 * trait. *On lui retire sa longueur, pas sa grosseur* — ce que Keko avait
 * demandé deux messages plus tôt.
 */
const TAILLE_ECLAT = 0.2
/** CE QUE LE COEUR PLEIN OCCUPE du quad ; le reste est frange et branches. */
const COEUR_ECLAT = 0.23
/**
 * BEAUCOUP PLUS DE GLOW. Keko : « c'est possible d'avoir des particules avec
 * beaucoup plus de glow / lumière ? »
 *
 * *Un halo n'existe que s'il a de la place pour mourir* : à 0,11 de quad son
 * lobe large tombait en cube et s'éteignait au bord, donc on ne voyait que le
 * coeur et les branches. **Le quad double** (0,11 → 0,2), *et le coeur comme
 * les branches gardent leur taille ABSOLUE* — 0,046 de coeur plein, 0,11 de
 * branches (`PORTEE_BRANCHE`) — donc l'éclat ne grossit pas, il rayonne plus
 * loin. Le halo passe en carré (une décroissance plus lente) et triple de
 * poids (`POIDS_HALO`). *C'est la règle du glow du sachet, un cran plus
 * loin : un point chaud ne s'arrête pas à son bord* — et sans passe de flou,
 * la seule façon d'en faire est de le peindre dans le grain.
 */
const PORTEE_BRANCHE = 0.55
const POIDS_HALO = 1.1
/** LA DEMI-ÉPAISSEUR D'UNE BRANCHE, en part du quad : sa finesse. */
const FINESSE_BRANCHE = 0.16

/**
 * LE SEMIS EST TIRÉ UNE FOIS, SEEDÉ EN DUR, et ce n'est pas le RNG du jeu :
 * *une matière n'est pas un tirage de partie.* Il ne porte que ce qui ne change
 * jamais d'un vol à l'autre — la cadence du scintillement et sa phase, la
 * durée de vie, et l'angle de la croix.
 *
 * **LE VOL, LUI, EST ÉCRIT PAR LE CPU À CHAQUE NAISSANCE** (`aVol`), et c'est
 * tout le changement : ***un champ procédural est partout à la fois, donc il
 * coule tant qu'on le laisse branché*** — c'est ce qui faisait jaillir des
 * étincelles d'une déchirure immobile. Un émetteur, lui, ne produit que
 * lorsqu'on émet. *La leçon était écrite depuis les plis du sachet : ce qui
 * COMMENCE et qui FINIT, il faut l'instancier* — elle se repaie ici sur le
 * MOMENT au lieu de la forme.
 */
function semisDesEtincelles(): THREE.InstancedBufferGeometry {
  let graine = 20260413 >>> 0
  const hasard = (): number => {
    graine = (graine + 0x6d2b79f5) >>> 0
    let t = Math.imul(graine ^ (graine >>> 15), 1 | graine)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  const g = new THREE.InstancedBufferGeometry()
  const quad = new THREE.PlaneGeometry(1, 1)
  g.index = quad.index
  g.setAttribute('position', quad.getAttribute('position'))
  const graines = new Float32Array(ETINCELLES * 4)
  for (let i = 0; i < ETINCELLES; i += 1) {
    graines[i * 4] = hasard()
    graines[i * 4 + 1] = hasard()
    graines[i * 4 + 2] = hasard()
    graines[i * 4 + 3] = hasard()
  }
  g.setAttribute('aGraine', new THREE.InstancedBufferAttribute(graines, 4))
  // AUCUNE NE VOLE AU DÉPART : une place jamais servie porte une naissance
  // NÉGATIVE, et le nuanceur la renvoie hors du champ. *Ce n'est plus le jet
  // nul qui le dit* — depuis que la moitié du feu d'artifice part vers le bas,
  // un jet négatif est une étincelle comme une autre, et la marquer sur le jet
  // la jetait avec les places vides : Keko ne voyait aucune particule
  // descendre, et il n'y en avait aucune.
  const naissances = new Float32Array(ETINCELLES * 4)
  for (let i = 0; i < ETINCELLES; i += 1) naissances[i * 4] = -1
  const vols = new THREE.InstancedBufferAttribute(naissances, 4)
  vols.setUsage(THREE.DynamicDrawUsage)
  g.setAttribute('aVol', vols)
  // LA MONTÉE EST ÉCRITE À LA NAISSANCE AUSSI : *le nuanceur ne sait pas de
  // quel régime une étincelle est née*, et les deux ne s'allument pas pareil.
  const montees = new THREE.InstancedBufferAttribute(new Float32Array(ETINCELLES), 1)
  montees.setUsage(THREE.DynamicDrawUsage)
  g.setAttribute('aMontee', montees)
  // LE RÉGIME AUSSI : 0 pour la découpe (une cloche sans frein, en parts de
  // vie), 1 pour le feu d'artifice (un frein et une pesanteur, en secondes).
  // *Les deux vols n'ont pas la même physique*, et le nuanceur doit savoir
  // laquelle jouer.
  const regimes = new THREE.InstancedBufferAttribute(new Float32Array(ETINCELLES), 1)
  regimes.setUsage(THREE.DynamicDrawUsage)
  g.setAttribute('aRegime', regimes)
  g.instanceCount = ETINCELLES
  return g
}

/**
 * ON ÉMET, ON NE FAIT PLUS COULER — et c'est ainsi que lexicodex procède :
 * leur `emitTearSparks` est appelé avec `min(12, 1 + round(Δprogress × 90))`
 * **et seulement si `Δ > 0`**, plus une rafale unique à la rupture.
 *
 * Chaque étincelle reçoit son départ : l'instant, l'abscisse, la dérive et le
 * jet. *Le curseur tourne en anneau* — une naissance écrase la plus vieille
 * place, vivante ou non, exactement comme leur pool de mille.
 */
function emettre(
  vols: THREE.InstancedBufferAttribute,
  montees: THREE.InstancedBufferAttribute,
  regimes: THREE.InstancedBufferAttribute,
  curseur: { current: number },
  nb: number,
  front: number,
  t: number,
  eclat: boolean,
): void {
  const a = vols.array as Float32Array
  const m = montees.array as Float32Array
  const r = regimes.array as Float32Array
  for (let i = 0; i < nb; i += 1) {
    const s = curseur.current
    curseur.current = (s + 1) % ETINCELLES
    const o = s * 4
    // LA SOURCE EST LE FRONT, disperse SYMETRIQUEMENT autour de lui pendant la
    // decoupe -- *le front est la moyenne des naissances, pas leur borne* --
    // et etalee sur toute l'ouverture au jaillissement.
    // LE JAILLISSEMENT NAIT SUR TOUTE LA LONGUEUR, la decoupe AUTOUR DU FRONT.
    // *Le front est la moyenne des naissances, pas leur borne.* Et l'abscisse
    // de l'eclat se tire DIRECTEMENT uniforme : elle se tirait en retrait du
    // front puis se bornait, donc un sixieme des etincelles s'empilait
    // exactement au bord gauche -- **un tirage qu'on borne n'est plus
    // uniforme, c'est un tas pose contre sa borne.**
    const x = eclat
      ? Math.random()
      : Math.min(
          1,
          Math.max(0, front + (Math.random() * 2 - 1) * DISPERSION_SOURCE),
        )
    // ON TIRE L'ANGLE, PUIS ON LE DECOMPOSE. *Une derive ajoutee a un jet
    // constant ne fait varier l'angle que d'un cone*, et un cone etroit se lit
    // comme une fontaine : la plage passe de 26 a 150 degres. Le
    // jaillissement, lui, se resserre encore -- il a toute la fente pour
    // naitre, donc son cone ne peut pas faire une fontaine.
    const aMin = eclat ? ANGLE_ECLAT_MIN : ANGLE_MIN
    const aMax = eclat ? ANGLE_ECLAT_MAX : ANGLE_MAX
    // ET UNE PART DU FEU TOMBE : le cone miroir, sous la fente -- voir FEU.partBas.
    const bas = eclat && Math.random() < FEU.partBas
    const ang = (aMin + Math.random() * (aMax - aMin)) * (bas ? -1 : 1)
    a[o] = t + (eclat ? Math.random() * ECLAT_ETALE : 0)
    a[o + 1] = x - 0.5
    if (eclat) {
      // LE FEU D'ARTIFICE : une vitesse en largeurs PAR SECONDE, tirée entre
      // les deux bornes de lexicodex, et c'est le nuanceur qui la freine. Pas
      // de `tf` ici -- *le frein borne la portee, pas la vie.* Voir FEU.
      const v = (FEU.vMin + Math.random() * (FEU.vMax - FEU.vMin)) * (bas ? FEU.vitesseBas : 1)
      a[o + 2] = v * Math.cos(ang)
      a[o + 3] = v * Math.sin(ang)
    } else {
      const v = JET * (0.85 + 0.3 * Math.random())
      const vx = v * Math.cos(ang)
      const vy = v * Math.sin(ang)
      // LA PESANTEUR COUPE LE VOL QUAND L'ETINCELLE RETOMBE. En t / tf la
      // trajectoire garde exactement sa forme -- il suffit donc de mettre les
      // deux vitesses a l'echelle, et le nuanceur ne change pas d'une ligne.
      const tf = PESANTEUR <= 0 ? 1 : Math.min(1, vy / (JET * PESANTEUR))
      a[o + 2] = vx * tf
      a[o + 3] = vy * tf
    }
    // UNE RAFALE NAÎT ALLUMÉE, la découpe s'allume : voir MONTEE_ECLAT.
    m[s] = eclat ? MONTEE_ECLAT : MONTEE_DECOUPE
    // LE REGIME : 0 la decoupe, 1 le feu creme, 2 le feu TEINTE de la couleur
    // de la carte la plus rare -- une etincelle sur deux, tiree a la naissance.
    r[s] = eclat ? (Math.random() < 0.5 ? 2 : 1) : 0
  }
  vols.needsUpdate = true
  montees.needsUpdate = true
  regimes.needsUpdate = true
}

/**
 * LES FAISCEAUX DE LUMIÈRE QUI S'ÉCHAPPENT DE LA FENTE.
 *
 * Keko : « tu crois que sur la partie déchirée du paquet on peut laisser
 * échapper des faisceaux de lumière, et au moment final plusieurs faisceaux
 * qui accompagnent les particules ? »
 *
 * **Le sachet contient quelque chose de lumineux, et la déchirure le laisse
 * voir.** Chaque faisceau est un quad additif posé à la fente, qui monte en
 * s'élargissant et s'éteint vers sa pointe — *un rayon étroit à sa source et
 * large au loin se lit comme de la lumière qui sort, un rectangle comme une
 * planche.* Deux régimes, qui sont ceux des étincelles :
 *
 * - **pendant la découpe**, seuls les faisceaux dont la place est déjà OUVERTE
 *   s'allument (`u < front`), doucement, et ils vacillent chacun à son rythme
 *   — le frémissement de la déchirure les ravive ;
 * - **à l'arrachement**, tous s'embrasent d'un coup, s'allongent et
 *   s'éteignent en accompagnant la gerbe ; *la moitié prend la couleur du
 *   cran le plus rare*, comme la moitié des étincelles.
 *
 * Ils sont ENFANTS DE LA GERBE : ils héritent de sa place sur la fente réelle
 * et de son échelle (`taille`), donc ils suivent le penchant et le
 * frémissement sans une ligne de plus. Tirage FIXE — *une matière n'est pas un
 * tirage de partie.*
 */
const FAISCEAUX = Array.from({ length: 9 }, (_, i) => {
  const h = (k: number): number => {
    const x = Math.sin((i + 1) * 12.9898 + k * 78.233) * 43758.5453
    return x - Math.floor(x)
  }
  return {
    u: 0.06 + ((i + 0.5) / 9) * 0.88 + (h(1) - 0.5) * 0.06,
    angle: (h(2) - 0.5) * 0.9,
    longueur: 0.32 + h(3) * 0.28,
    largeur: 0.26 + h(4) * 0.16,
    rythme: 5 + h(5) * 7,
    phase: h(6) * 6.28,
    teinte: i % 2 === 1,
  }
})
/** La force d'un faisceau pendant la découpe, et à l'embrasement. */
// PLUS DOUX, PLUS LARGE, PLUS COURT. Keko : « ça fait laser, je voyais plutôt
// comme de la vraie lumière s'échapper un peu ». *Ce qui faisait le laser :
// un coeur blanc fin, des bords nets et une grande longueur.* Le coeur part,
// le profil devient une gaussienne sans bord, les rayons s'élargissent et
// raccourcissent, et ils se recouvrent — c'est le recouvrement qui fait une
// nappe de lumière plutôt que des traits.
const FORCE_FAISCEAU = { decoupe: 0.4, eclat: 2.2 }

/** Le smoothstep du GLSL, côté CPU. */
function smoothstepJs(a: number, b: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

function matiereDuFaisceau(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    // PAR-DESSUS TOUT LE SACHET, bande comprise. Keko : « il faudrait que la
    // lumière passe devant la bande qui se déchire au-dessus, on peut la
    // dessiner par-dessus le paquet ? » *La bande se recourbe VERS la caméra*,
    // donc elle passait devant la lumière qui sort de dessous elle. Sans test
    // de profondeur et dessinée en dernier (renderOrder 3), la lumière se pose
    // sur tout — et comme elle est additive, elle ne masque rien.
    depthTest: false,
    side: THREE.DoubleSide,
    // LE MÊME AJOUT FRANC QUE LA GERBE : le RVB EST la lumière ajoutée.
    blending: THREE.CustomBlending,
    blendEquation: THREE.AddEquation,
    blendSrc: THREE.OneFactor,
    blendDst: THREE.OneFactor,
    uniforms: {
      uForce: { value: 0 },
      uCouleur: { value: new THREE.Vector3(FENTE_BORD[0], FENTE_BORD[1], FENTE_BORD[2]) },
      uLineaire: { value: 0 },
    },
    vertexShader: `varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`,
    fragmentShader: `uniform float uForce;
uniform vec3 uCouleur;
uniform float uLineaire;
varying vec2 vUv;
vec3 versLineaire(vec3 c) {
  return mix(c / 12.92, pow((c + 0.055) / 1.055, vec3(2.4)), step(0.04045, c));
}
void main() {
  float le = vUv.y;
  // ETROIT A LA SOURCE, LARGE AU LOIN : la largeur utile croit avec la hauteur.
  float c = abs(vUv.x - 0.5) * 2.0 / (0.45 + 0.55 * le);
  // UNE GAUSSIENNE SANS BORD : *de la lumière n'a pas d'arête.* Elle est
  // nulle au bord du quad, donc le rectangle ne se voit jamais.
  float profil = exp(-c * c * 2.2) * (1.0 - smoothstep(0.6, 1.0, c));
  // IL NAIT DOUX ET S'EFFILE : une rampe courte au pied, une queue longue.
  // (PAS long : c'est un mot reserve du GLSL, et le nuanceur ne compilait pas.)
  float etire = smoothstep(0.0, 0.12, le) * pow(1.0 - le, 2.4);
  vec3 lum = uCouleur * profil * etire * uForce;
  if (max(lum.r, max(lum.g, lum.b)) < 0.003) discard;
  if (uLineaire > 0.5) lum = versLineaire(clamp(lum, 0.0, 1.0)) + max(lum - 1.0, 0.0);
  gl_FragColor = vec4(lum, min(1.0, max(lum.r, max(lum.g, lum.b))));
}`,
  })
}

function matiereDeLaGerbe(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    // UNE ÉTINCELLE N'A PAS DE DOS : son quad est orienté sur sa VITESSE, donc
    // le repère (perpendiculaire, tangente) est INDIRECT — le quad est
    // retourné, et `FrontSide` les écartait tous les cent dix. *Rien ne le
    // signalait* : le nuanceur compile, le dessin part avec ses instances, et
    // zéro pixel sort.
    side: THREE.DoubleSide,
    // UN AJOUT FRANC, PAS UN AJOUT PONDÉRÉ PAR L'ALPHA. `AdditiveBlending`
    // multiplie la couleur par l'alpha avant de l'ajouter : un fragment déjà
    // prémultiplié se retrouvait donc **au carré**, et une décroissance au
    // carré rabote le grain à son coeur — *c'est ce qui faisait des confettis
    // minuscules à bord net plutôt que des lueurs.* Ici le RVB EST la lumière
    // ajoutée.
    blending: THREE.CustomBlending,
    blendEquation: THREE.AddEquation,
    blendSrc: THREE.OneFactor,
    blendDst: THREE.OneFactor,
    // UN SEUL UNIFORME, ET C'EST L'HORLOGE. *Le front, la force et l'eclat ont
    // disparu avec le champ continu* : plus rien dans la gerbe ne depend de la
    // PLACE de la decoupe -- tout est ecrit a la naissance.
    uniforms: {
      uTemps: { value: 0 },
      // VOIR versLineaire() dans le corps : la gerbe aussi écrit des couleurs
      // prêtes à l'affichage.
      uLineaire: { value: 0 },
      // LA COULEUR DU SOMMET DU PAQUET, pour la moitié teintée du feu : crème
      // par défaut, donc indiscernable des autres tant qu'on ne la pose pas.
      uRare: { value: new THREE.Vector3(FENTE_BORD[0], FENTE_BORD[1], FENTE_BORD[2]) },
    },
    vertexShader: `uniform float uTemps;
attribute vec4 aGraine;
attribute vec4 aVol;
attribute float aMontee;
attribute float aRegime;
varying vec2 vQ;
varying float vVie;
varying float vTeinte;

void main() {
  // CHAQUE ÉTINCELLE PORTE SA NAISSANCE, et son âge en découle. Une place
  // jamais servie a une naissance NÉGATIVE (pas un jet nul : un jet négatif
  // est une étincelle qui tombe), et une étincelle qui a passé sa vie est
  // finie : les deux sortent du champ -- un grain qu'on renvoie au loin est le
  // seul qui ne puisse rien tacher.
  // ET LA VIE EST CELLE DE SON REGIME : courte pour la decoupe, longue pour le
  // feu d'artifice, qui doit avoir le temps de monter et de s'eteindre.
  bool feu = aRegime > 0.5;
  // ET LA MOITIÉ DU FEU EST TEINTÉE (regime 2) : c'est le fragment qui mélange.
  vTeinte = aRegime > 1.5 ? 1.0 : 0.0;
  float vie = feu
    ? ${FEU.vie.toFixed(2)} * (0.75 + 0.5 * aGraine.z)
    : ${VIE_ETINCELLE.toFixed(2)} * (0.82 + 0.36 * aGraine.z);
  float t = (uTemps - aVol.x) / vie;
  if (aVol.x < 0.0 || t < 0.0 || t >= 1.0) {
    vQ = vec2(0.0);
    vVie = 0.0;
    gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
    return;
  }

  // LA CLOCHE, ET LA PESANTEUR VAUT LA VITESSE : le vol monte a vy/4 au milieu
  // de la vie et retombe pile a sa fin, quelle que soit la vitesse de depart.
  // *Son abscisse, sa derive et son jet ont ete tires a la naissance*, donc
  // rien ici ne sait ou en est la decoupe.
  float vy = aVol.w;
  vec2 vol;
  if (feu) {
    // LE FEU D'ARTIFICE : L'AIR FREINE, LA PESANTEUR N'EST QU'UN RIEN. En
    // secondes, avec v0 la vitesse de depart et vt la vitesse terminale
    // (pesanteur / frein, vers le bas) : v(s) = vt + (v0 - vt) exp(-k s), donc
    // p(s) = p0 + vt s + (v0 - vt) (1 - exp(-k s)) / k. *L'etincelle file,
    // ralentit et s'arrete a peu pres la ou elle s'eteint* -- c'est ce qui
    // separe un feu d'artifice d'une explosion qui retombe. Voir FEU.
    float s = t * vie;
    float k = ${FEU.frein.toFixed(2)};
    vec2 v0 = vec2(aVol.z, vy);
    vec2 vt = vec2(0.0, -${FEU.pesanteur.toFixed(2)} / k);
    vol = vec2(aVol.y, 0.0) + vt * s + (v0 - vt) * (1.0 - exp(-k * s)) / k;
  } else {
    vol = vec2(aVol.y + aVol.z * t, vy * t * (1.0 - t));
  }

  // ELLE S'ALLUME, SCINTILLE ET MEURT : une étincelle a une durée, et c'est
  // son extinction qui l'empêche de se lire comme une bille lancée. **Chaque
  // grain a sa PROPRE cadence** -- un battement commun se lirait comme un
  // clignotement d'alerte, la regle deja payee sur l'aureole du diamant.
  // ET LA MONTEE EST CELLE DE SON REGIME : une rafale nait allumee, la
  // decoupe s'allume (voir MONTEE_ECLAT). Le feu d'artifice s'efface
  // LINEAIREMENT des 45 % de sa vie -- un fondu qui dure, la ou la decoupe
  // s'eteint sur son dernier tiers.
  float extinction = feu
    ? 1.0 - max(0.0, (t - ${FEU.fondu.toFixed(2)}) / (1.0 - ${FEU.fondu.toFixed(2)}))
    : smoothstep(1.0, 0.70, t);
  float fondu = smoothstep(0.0, aMontee, t) * extinction;
  float scintille = 0.62 + 0.38 * sin(uTemps * (38.0 + aGraine.x * 34.0) + aGraine.y * 37.0);

  // L'ÉCLAT EST UN CARRÉ, ET IL NE S'ALLONGE DE RIEN. *Quatre branches en
  // croix ne disent aucune direction*, donc le quad n'a pas a suivre la
  // tangente -- et c'est tout ce qui separe un flair d'une trainee. Son angle
  // est FIXE et propre a chaque grain : alignes, les croix feraient une
  // grille.
  float ang = aGraine.w * 6.2832;
  vec2 u = vec2(cos(ang), sin(ang));
  vec2 q = position.xy;
  // ET SA TAILLE BAT AVEC SA LUMIÈRE : un flair pulse, il ne se contente pas
  // de s'eteindre. Le quad garde de quoi contenir sa frange au plus fort.
  float ech = ${TAILLE_ECLAT.toFixed(3)} * (0.82 + 0.18 * scintille);
  vec2 ecart = (u * q.x + vec2(-u.y, u.x) * q.y) * ech;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(vol + ecart, 0.0, 1.0);

  vQ = q * 2.0;
  vVie = fondu * scintille;
}`,
    fragmentShader: `uniform vec3 uRare;
uniform float uLineaire;
vec3 versLineaire(vec3 c) {
  return mix(c / 12.92, pow((c + 0.055) / 1.055, vec3(2.4)), step(0.04045, c));
}
varying vec2 vQ;
varying float vVie;
varying float vTeinte;

void main() {
  float d = length(vQ);
  vec2 a = abs(vQ);
  // TROIS TERMES, ET AUCUN NE FAIT LE TRAVAIL DES DEUX AUTRES.
  // Le COEUR saturé dit que c'est une lumière ; le HALO dit qu'elle RAYONNE --
  // *un point chaud ne s'arrête pas à son bord*, la règle du glow du sachet ;
  // et les QUATRE BRANCHES disent que c'est un éclat et non une pastille.
  float coeur = smoothstep(${COEUR_ECLAT.toFixed(2)}, 0.0, d);
  coeur = coeur * coeur;
  // LE HALO A DE LA PLACE ET DU POIDS : en carré, il meurt lentement jusqu'au
  // bord du quad, qui a double pour lui (voir POIDS_HALO).
  float halo = smoothstep(1.0, 0.0, d);
  halo = halo * halo;
  // UNE BRANCHE DÉCROÎT LENTEMENT LE LONG DE SON AXE ET D'UN COUP EN TRAVERS :
  // c'est ce rapport-la qui en fait une branche et non un lobe. *On prend leur
  // MAXIMUM* -- un produit creuserait le centre, qui appartient aux deux. Les
  // branches gardent leur portee d'avant dans un quad qui a double : on les
  // lit dans un repere ramene a PORTEE_BRANCHE.
  vec2 b = a / ${PORTEE_BRANCHE.toFixed(2)};
  float bx = smoothstep(1.0, 0.0, b.x) * smoothstep(${FINESSE_BRANCHE.toFixed(2)}, 0.0, b.y);
  float by = smoothstep(1.0, 0.0, b.y) * smoothstep(${FINESSE_BRANCHE.toFixed(2)}, 0.0, b.x);
  float croix = max(bx, by);
  croix = croix * croix;
  // ET LE COEUR EST BLANC, LA FRANGE CRÈME. *Un point qui sature tire vers le
  // blanc, sa frange garde la couleur* — c'est la règle du halo du foil, et
  // c'est AUSSI ce que fait la lumière de la fente, qui passe du crème au
  // presque-blanc à mesure qu'elle chauffe. **Les deux lisent donc les deux
  // mêmes tons**, et l'étincelle ne peut plus se détacher de ce qui la lâche.
  // LA FRANGE PREND LA COULEUR DU SOMMET DU PAQUET sur la moitié teintée du
  // feu d'artifice ; LE COEUR RESTE BLANC -- *un point qui sature tire vers le
  // blanc, sa frange garde la couleur.* La couleur est poussee au meme gain
  // que la creme : une etincelle est de la lumiere ajoutee.
  vec3 creme = mix(${ton(FENTE_BORD, GAIN_ETINCELLE)}, uRare * ${GAIN_ETINCELLE.toFixed(2)}, vTeinte);
  vec3 blanc = ${ton(FENTE_COEUR, GAIN_ETINCELLE)};
  vec3 lum = (creme * (halo * ${POIDS_HALO.toFixed(2)} + croix * 0.9) + blanc * coeur) * vVie;
  if (max(lum.r, max(lum.g, lum.b)) < 0.003) discard;
  // ET L'ALPHA SUIT LA LUMIÈRE, il ne vaut jamais un. *La toile du jeu est
  // TRANSPARENTE* : un fragment sombre mais d'alpha plein écrit un pixel NOIR
  // OPAQUE par-dessus la page — le défaut déjà payé sur les grains de l'onde.
  // Une étincelle dépasse 1 : seule sa part affichable redescend en linéaire,
  // le reste garde son éclat pour le bloom.
  if (uLineaire > 0.5) lum = versLineaire(clamp(lum, 0.0, 1.0)) + max(lum - 1.0, 0.0);
  gl_FragColor = vec4(lum, min(1.0, max(lum.r, max(lum.g, lum.b))));
}`,
  })
}

/**
 * DE COMBIEN LE FILM DESCEND APRES L'ARRACHEMENT, en part de sa course.
 *
 * *Une pochette qu'on retire ACCELERE* : la main amorce, puis le film file et
 * quitte le cadre. Une rampe droite se lirait comme un panneau qui glisse.
 */
function chuteDuFilm(pv: number): number {
  return Math.pow(pv, 1.7)
}
/** La part de la chute du film à laquelle le paquet se dit ouvert — voir `onOuvert`. */
const PART_OUVERT = 0.66

/**
 * UNE RAMPE SANS ARÊTE, bornée à [0, 1] : la `smoothstep` du nuanceur, côté
 * TypeScript. *Une rampe droite s'allume et s'éteint d'un coup* — la règle
 * déjà payée sur le voile sous le texte des cartes.
 */
function smooth(x: number): number {
  const u = Math.min(1, Math.max(0, x))
  return u * u * (3 - 2 * u)
}

export function Sachet3D({
  taille,
  position,
  descente,
  ouvre = false,
  lueurRare,
  onOuvert,
  onParti,
  onDechire,
  onOuvrir,
  gyro: gyroPrete,
  lineaire = false,
}: {
  /** Sa largeur en unités de scène ; sa hauteur suit son rapport. */
  readonly taille: number
  readonly position: readonly [number, number, number]
  /**
   * DE COMBIEN LE FILM DOIT DESCENDRE POUR QUITTER LE CADRE.
   *
   * Keko : **« ce serait bien qu'à l'ouverture du booster, le paquet descende,
   * laissant la carte derrière lui apparaître comme si on enlevait le paquet
   * vers le bas »**.
   *
   * ***C'EST LE PARENT QUI LA DONNE, parce que le sachet ne connaît pas le
   * champ visible*** — la règle du projet : *le Z se calcule, il ne s'écrit
   * pas*, et une distance d'écran se déduit de l'écran. Elle vaut la demi-
   * hauteur du champ plus la demi-hauteur du sachet, donc **il est hors cadre
   * à l'instant où le composant se démonte** : rien ne disparaît d'un coup, et
   * il n'y a plus de fondu du tout.
   *
   * **ET LA BANDE LA LIT AUSSI** : c'est à elle qu'on compare sa chute pour
   * savoir qu'elle a quitté le cadre — voir `onParti`.
   */
  readonly descente: number
  /** Vrai dès qu'il doit s'ouvrir sans geste. Il ne se referme pas. */
  readonly ouvre?: boolean
  /**
   * LA COULEUR DE LA CARTE LA PLUS RARE DU PAQUET, en CSS : la moitié des
   * étincelles du feu d'artifice la prennent. Sans elle, toutes sont crème.
   */
  readonly lueurRare?: string
  /** La bande vient d'être arrachée — *c'est l'instant du flash.* */
  readonly onDechire?: () => void
  /** Tout est fini : *c'est l'écran qui décide de la suite.* */
  readonly onOuvert?: () => void
  /**
   * LA BANDE EST SORTIE DU CADRE, et il n'y a plus rien à montrer.
   *
   * *C'est un second instant, après `onOuvert` au plus tôt* : la bande
   * s'efface avec le film, ou sort du cadre avant lui. **Le démonter sur
   * `onOuvert` pourrait la couper en plein vol** — c'est donc sur celui-ci
   * que le parent le démonte.
   */
  readonly onParti?: () => void
  /** Le geste est acquis : la déchirure part toute seule. */
  readonly onOuvrir?: () => void
  /**
   * LE GYROSCOPE DU PAQUET, s'il en tient un : le sachet le lit au lieu d'en
   * créer un. *Sur iPhone, le capteur se demande depuis un geste, et deux
   * demandes dans le même relâchement n'en font pas deux qui passent* — un
   * seul capteur, pris par le paquet, sert le sachet ET les cartes, avec un
   * seul zéro : la tenue du moment où le paquet apparaît.
   */
  readonly gyro?: { readonly current: Inclinaison | null }
  /** La scène se rend dans une cible linéaire (le bloom) : voir versLineaire() dans le nuanceur. */
  readonly lineaire?: boolean
}): React.ReactElement {
  const groupe = useRef<THREE.Group>(null)
  const relief = useRef<THREE.Group>(null)
  const bande = useRef<THREE.Group>(null)
  /** Ce qui emporte le film vers le bas : *le corps seul, pas la bande.* */
  const chute = useRef<THREE.Group>(null)
  /** La gerbe, dont l'origine SUIT la fente réelle : voir `fenteReelle`. */
  const gerbeMesh = useRef<THREE.Mesh>(null)
  const corps = useMemo(() => matiereDuMorceau(true), [])
  const bandeMat = useMemo(() => {
    const m = matiereDuMorceau(false)
    // ELLE SE RETOURNE EN SE PLIANT, donc elle a un dos à montrer : voir
    // l'envers dans le nuanceur. Le corps, lui, ne se retourne jamais.
    m.side = THREE.DoubleSide
    return m
  }, [])
  const gerbe = useMemo(() => matiereDeLaGerbe(), [])
  // LES FAISCEAUX : un matériau par faisceau, puisque chacun a sa force.
  const faisceauxMat = useMemo(() => FAISCEAUX.map(() => matiereDuFaisceau()), [])
  const faisceaux = useRef<(THREE.Mesh | null)[]>([])
  const planFaisceau = useMemo(() => new THREE.PlaneGeometry(1, 1).translate(0, 0.5, 0), [])
  useEffect(() => {
    corps.uniforms.uLineaire!.value = lineaire ? 1 : 0
    bandeMat.uniforms.uLineaire!.value = lineaire ? 1 : 0
    gerbe.uniforms.uLineaire!.value = lineaire ? 1 : 0
    for (const m of faisceauxMat) m.uniforms.uLineaire!.value = lineaire ? 1 : 0
  }, [corps, bandeMat, gerbe, faisceauxMat, lineaire])
  useEffect(
    () => () => {
      for (const m of faisceauxMat) m.dispose()
      planFaisceau.dispose()
    },
    [faisceauxMat, planFaisceau],
  )
  const semis = useMemo(() => semisDesEtincelles(), [])
  /** Les naissances : c'est le CPU qui les écrit, une par étincelle émise. */
  const vols = useMemo(
    () => semis.getAttribute('aVol') as THREE.InstancedBufferAttribute,
    [semis],
  )
  const montees = useMemo(
    () => semis.getAttribute('aMontee') as THREE.InstancedBufferAttribute,
    [semis],
  )
  const regimes = useMemo(
    () => semis.getAttribute('aRegime') as THREE.InstancedBufferAttribute,
    [semis],
  )
  const { size } = useThree()

  /** Où en est l'ouverture, de 0 à 1 — tirée à la main, puis filée seule. */
  const p = useRef(0)
  /** Le geste en cours : d'où le doigt est parti, et d'où l'ouverture l'était. */
  const tire = useRef<{
    x0: number
    y0: number
    p0: number
    /** Où le doigt s'est posé SUR le sachet, en parts de sa largeur. */
    x: number
    y: number
  } | null>(null)
  /** Vrai une fois le geste acquis : plus rien ne le retient. */
  const file = useRef(false)
  const avant = useRef<number | null>(null)
  const dit = useRef(false)
  const ditDechire = useRef(false)
  const ditParti = useRef(false)
  /** Le craquement du film, tant qu'on le déchire. Voir `jouerEnBoucle`. */
  const craque = useRef<SonEnBoucle | null>(null)
  /** La ligne de diagnostic de `?son`, ou rien. */
  const diag = useRef<HTMLDivElement | null>(null)
  /** L'inclinaison du téléphone, rapportée à celle du moment où le sachet est apparu. */
  const gyroPropre = useRef<Inclinaison | null>(null)
  const gyro = gyroPrete ?? gyroPropre
  useEffect(() => {
    if (SANS_GYRO || gyroPrete !== undefined) return
    // LE ZÉRO EST LA TENUE DU TÉLÉPHONE QUAND LE SACHET APPARAÎT : l'écoute
    // se monte avec lui, et il se remonte à chaque paquet — voir `inclinaison`.
    gyroPropre.current = suivreLInclinaison()
    return () => {
      gyroPropre.current?.arreter()
      gyroPropre.current = null
    }
  }, [gyroPrete])
  /** Où en était le front à l'image d'avant, et quand il a bougé pour la dernière fois. */
  const pfAvant = useRef(0)
  const dernierPas = useRef(-Infinity)
  /** Le pop a été programmé au lâcher : l'arrachement n'a plus à le jouer. */
  const popProgramme = useRef(false)
  // LES DEUX SONS SE CHARGENT AVEC LE SACHET, pas au premier craquement : *un
  // son qui arrive après le geste qui l'a demandé arrive trop tard* — et le
  // craquement ne peut pas se SUIVRE tant que son tampon n'est pas décodé.
  useEffect(() => {
    void precharger(SON_CRAQUE)
    void precharger(SON_POP)
    void precharger(SON_EQUIPER)
    // ET LE SON SE RÉVEILLE AU PREMIER CONTACT, comme sur l'archive : le
    // préchargement crée le contexte HORS d'un geste, donc suspendu, et le
    // reprendre coûte du temps — *le réveil doit avoir lieu avant qu'on en ait
    // besoin.* La page du paquet ne le faisait jamais.
    //
    // **ET SUR TACTILE, C'EST LE RELÂCHEMENT QUI ACTIVE LA PAGE, pas le
    // contact.** Keko : « c'est en mode suspended quand je glisse, mais si je
    // lâche et que je reprends ça devient running ; il faut toucher l'écran
    // une fois avant de déchirer ». *C'est la politique des navigateurs* —
    // les évènements qui activent une page sont `pointerup`, `touchend`, et
    // `pointerdown` À LA SOURIS seulement — et un contexte suspendu ne se
    // reprend qu'après une activation. **Le tout premier contact d'une
    // session ne peut donc pas avoir de son**, quoi qu'on fasse ; on reprend
    // au relâchement, quel qu'il soit, pour que le geste suivant en ait.
    const amorcer = (): void => amorcerLeSon()
    window.addEventListener('pointerdown', amorcer, { once: true })
    const reveiller = (): void => reveillerLeSon()
    window.addEventListener('pointerup', reveiller)
    window.addEventListener('touchend', reveiller, { passive: true })
    // LA LIGNE DE DIAGNOSTIC, derrière `?son` : le même motif que l'archive.
    if (BANC_SON) {
      const el = document.createElement('div')
      el.style.cssText =
        'position:fixed;left:0;top:0;z-index:99;padding:4px 8px;font:12px monospace;color:#fff;background:rgba(0,0,0,.6);pointer-events:none;white-space:pre-wrap'
      document.body.appendChild(el)
      diag.current = el
    }
    return () => {
      window.removeEventListener('pointerdown', amorcer)
      window.removeEventListener('pointerup', reveiller)
      window.removeEventListener('touchend', reveiller)
      craque.current?.arreter()
      diag.current?.remove()
      diag.current = null
    }
  }, [])
  // LE BANC `?craque` : le craquement en boucle, tel quel, dès le premier
  // contact avec la page — *le contexte audio ne naît que sur un geste.*
  useEffect(() => {
    if (!BANC_CRAQUE) return
    let arreter: (() => void) | null = null
    const demarrer = (): void => {
      arreter = jouerEnBoucle(SON_CRAQUE).arreter
    }
    window.addEventListener('pointerdown', demarrer, { once: true })
    return () => {
      window.removeEventListener('pointerdown', demarrer)
      arreter?.()
    }
  }, [])
  /**
   * LE VOL : où la bande en est de sa projection, en largeurs de sachet.
   *
   * *C'est une vraie intégration, plus une courbe sur une part* : l'air freine
   * une vitesse, pas une position, et on ne sait pas d'avance quand elle sort
   * du cadre — ça dépend de l'écran.
   */
  const vol = useRef({ t: 0, x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0 })
  /** Où en est l'anneau des étincelles, et le front de l'image d'avant. */
  const anneau = useRef(0)
  const frontAvant = useRef(FRONT_DEPART)
  const frisson = useRef(0)
  /** Ce qu'il reste de débit à émettre : *une avancée d'un dixième d'étincelle
   * n'en émet aucune, mais dix de suite en émettent une.* */
  const resteEmis = useRef(0)
  /** Où le curseur touche le sachet, en parts de sa largeur et de sa hauteur. */
  const curseur = useRef({ x: 0, y: 0 })
  const survol = useRef(false)
  /** Le curseur a-t-il quitté le sachet depuis le début du geste. */
  const sorti = useRef(false)
  const feu = useRef(0)

  const H = taille * RAPPORT_SACHET
  const hBande = H * LIGNE_DECHIRURE
  const hCorps = H - hBande
  /**
   * CE QUE LE SACHET MESURE À L'ÉCRAN, en pixels.
   *
   * *Un geste se compte en pixels*, et la déchirure se compte en parts de
   * sachet : il faut donc la conversion, qui suit le recul de la caméra sans
   * qu'on s'en occupe. **Tirer sur toute sa largeur ouvre tout** — le chemin
   * du doigt et le chemin du front sont le même chemin.
   */
  const largePx = taille * (size.height / hauteurVisibleA(position[2], size.height))

  useEffect(() => {
    let vivant = true
    const plis = textureDesPlis()
    corps.uniforms.uPlis!.value = plis
    bandeMat.uniforms.uPlis!.value = plis
    void textureDuSachet().then((t) => {
      if (!vivant) return
      corps.uniforms.uSachet!.value = t
      bandeMat.uniforms.uSachet!.value = t
    })
    void brillanceDuSachet().then((t) => {
      if (!vivant) return
      corps.uniforms.uBrillance!.value = t
      bandeMat.uniforms.uBrillance!.value = t
    })
    return () => {
      vivant = false
    }
  }, [corps, bandeMat])

  useEffect(() => {
    // LES TRANCHES DE TEXTURE. Une `CanvasTexture` est retournée (`flipY`),
    // donc `uv.y = 1` est le HAUT du canvas : la bande y vit de `1 - L` à 1.
    corps.uniforms.uV0!.value = 0
    corps.uniforms.uV1!.value = 1 - LIGNE_DECHIRURE
    bandeMat.uniforms.uV0!.value = 1 - LIGNE_DECHIRURE
    bandeMat.uniforms.uV1!.value = 1
    // LES DEUX MORCEAUX SE BOMBENT DE LA MÊME HAUTEUR, en unités de scène :
    // *c'est une seule poche*, et le raccord ne doit pas se voir.
    corps.uniforms.uBombe!.value = taille * REL_BOMBE
    bandeMat.uniforms.uBombe!.value = taille * REL_BOMBE
    // LE PLI, sur la bande seule : sa fente est à une demi-bande sous l'origine
    // de son plan, et c'est la largeur du sachet qui convertit les chiffres
    // relevés chez lexicodex.
    bandeMat.uniforms.uPli!.value = 1
    bandeMat.uniforms.uFente!.value = hBande / 2
    bandeMat.uniforms.uTaille!.value = taille
    corps.uniforms.uTaille!.value = taille
  }, [corps, bandeMat, taille, hBande])

  /**
   * LE PLAN DE LA BANDE, et son ordre de dessin est RENVERSÉ.
   *
   * Un plan se dessine du HAUT vers le bas, et la matière n'écrit pas la
   * profondeur : *le dernier triangle dessiné gagne.* Une fois la bande pliée,
   * son sommet passe la verticale et retombe DEVANT sa base — dessiné en
   * premier, il se faisait recouvrir par elle sur une bande de quelques pixels
   * au-dessus de la fente. **On renverse donc les triangles** : la base
   * d'abord, le sommet replié en dernier. *Deux fois plus de rangées* qu'avant,
   * parce qu'un pli de deux radians sur dix segments montre ses facettes.
   */
  const planBande = useMemo(() => {
    const g = new THREE.PlaneGeometry(taille, hBande, 36, 24)
    const idx = g.getIndex()!
    const a = idx.array
    const r = new Uint16Array(a.length)
    for (let i = 0; i < a.length; i += 3) {
      const j = a.length - 3 - i
      r[i] = a[j]!
      r[i + 1] = a[j + 1]!
      r[i + 2] = a[j + 2]!
    }
    g.setIndex(new THREE.BufferAttribute(r, 1))
    return g
  }, [taille, hBande])
  useEffect(() => () => planBande.dispose(), [planBande])

  // LES MATIÈRES SE JETTENT AVEC LE COMPOSANT : un `ShaderMaterial` garde son
  // programme compilé, et l'écran en monte trois par paquet ouvert. Le curseur
  // se rend avec elles — *un objet qui disparaît sous la souris laisserait une
  // main posée sur la page.*
  useEffect(
    () => () => {
      corps.dispose()
      bandeMat.dispose()
      gerbe.dispose()
      semis.dispose()
      document.body.style.cursor = ''
    },
    [corps, bandeMat, gerbe, semis],
  )

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    const dt = avant.current === null ? 0 : Math.min(0.1, t - avant.current)
    avant.current = t
    corps.uniforms.uTemps!.value = t
    bandeMat.uniforms.uTemps!.value = t
    gerbe.uniforms.uTemps!.value = t
    // LA COULEUR DU SOMMET DU PAQUET, lue TELLE QUELLE (en sRGB, comme la
    // creme) : *une etincelle est de la lumiere ajoutee*, et la convertir en
    // lineaire l'assombrirait d'un bon tiers sans que rien ne le dise.
    if (lueurRare !== undefined && /^#[0-9a-f]{6}$/i.test(lueurRare)) {
      const v = gerbe.uniforms.uRare!.value as THREE.Vector3
      v.set(
        parseInt(lueurRare.slice(1, 3), 16) / 255,
        parseInt(lueurRare.slice(3, 5), 16) / 255,
        parseInt(lueurRare.slice(5, 7), 16) / 255,
      )
    }

    if (ouvre) file.current = true

    // DEUX ÉTATS, ET UN SEUL CHIFFRE LES PORTE. Le doigt pose `p` lui-même ;
    // une fois le geste acquis l'horloge prend le relais DEPUIS LÀ — *on ne
    // rejoue pas le chemin déjà fait.* Un geste abandonné ne rend RIEN : ce
    // qui est déchiré le reste, et `p` attend le doigt suivant.
    if (file.current) p.current = Math.min(1, p.current + dt / DUREE_BRULURE)

    // LE RELIEF DU SURVOL : il s'incline vers le curseur et s'avance d'un
    // cheveu. *Sans l'avancée, une inclinaison se lit comme une image qui
    // gondole ; avec elle, comme un objet qu'on tourne vers soi* — la règle
    // déjà payée sur la carte regardée de près. Il s'éteint dès que la
    // déchirure file : à ce moment-là il n'y a plus rien à proposer.
    const vu = survol.current && !file.current
    const k = 1 - Math.pow(0.0015, dt)
    feu.current += ((vu ? 1 : 0) - feu.current) * k
    const r = relief.current
    if (r !== null) {
      /**
       * IL SE BALANCE TANT QU'ON NE L'A PAS DÉCHIRÉ, et ce n'est pas une
       * coquetterie : **le reflet du film ne vit que si l'objet bouge.**
       *
       * *Au doigt il n'y a pas de survol* — donc sans ce balancement le sachet
       * serait, sur téléphone, un sachet brillant qui ne brille jamais. Il
       * respirait déjà ; **on lui ajoute une inclinaison, qui est le même
       * geste**, et c'est elle que la lumière lit.
       *
       * **Deux périodes qui ne retombent jamais en phase**, comme la
       * respiration des créatures : *un balancement régulier se lit comme une
       * mécanique.*
       */
      // ET IL CONTINUE DE SE BALANCER SOUS LA MAIN. Keko : « on peut maintenir
      // les petites variations d'orientation même quand le joueur bouge le tel
      // / maintient le tap / hover, autour de l'orientation actuelle ». *Le
      // balancement s'ajoutait au penchant tenu, et le survol l'éteignait* ;
      // il ne s'éteint plus que quand la déchirure file toute seule.
      const berce = file.current ? 0 : 1
      // ET LE TÉLÉPHONE PENCHE LE SACHET, derrière le doigt et le survol : il
      // ne s'ajoute que quand rien ne le tient — voir GYRO_GAIN.
      const incl = gyro.current?.lire() ?? null
      const borne = (v: number): number => Math.min(GYRO_BORNE, Math.max(-GYRO_BORNE, v))
      const gyroX = incl === null || vu ? 0 : borne(incl.x * GYRO_GAIN)
      const gyroY = incl === null || vu ? 0 : borne(-incl.y * GYRO_GAIN)
      const cibleX =
        (vu ? -curseur.current.y * PENCHE : 0) + Math.sin(t * 0.62) * BERCE_X * berce + gyroX
      const cibleY =
        (vu ? curseur.current.x * PENCHE * 1.3 : 0) + Math.sin(t * 0.9) * BERCE_Y * berce + gyroY
      r.rotation.x += (cibleX - r.rotation.x) * k
      r.rotation.y += (cibleY - r.rotation.y) * k
      r.position.z += (taille * AVANCEE * feu.current - r.position.z) * k
      /**
       * IL FRÉMIT QUAND LA DÉCHIRURE AVANCE. Keko : « on peut faire un effet
       * de frémissement juicy du paquet quand la déchirure progresse ? »
       *
       * *C'est la règle des étincelles : ce qui produit l'effet est la découpe
       * qui AVANCE, pas la fente déjà ouverte.* L'avancée nourrit une énergie
       * (`frisson`) qui s'éteint en un dixième de seconde : un doigt qui tire
       * vite secoue fort, un doigt qui s'arrête laisse le sachet se calmer.
       * Elle se pose PAR-DESSUS le placement, jamais dans l'amortissement —
       * *mêlée à lui, il la mangerait en croyant corriger un écart* (la règle
       * du frémissement des cartes). Deux fréquences qui ne retombent jamais
       * en phase par axe : un tremblement régulier se lit comme un moteur.
       */
      frisson.current *= Math.exp(-14 * dt)
      const f = Math.min(1, frisson.current)
      r.position.x = taille * FRISSON.deplacement * f * (Math.sin(t * 71) * 0.6 + Math.sin(t * 113) * 0.4)
      r.position.y = taille * FRISSON.deplacement * f * (Math.sin(t * 83) * 0.6 + Math.sin(t * 131) * 0.4)
      r.rotation.z = FRISSON.angle * f * Math.sin(t * 97)
      // LE NUANCEUR LIT LE PENCHANT RÉEL, pas sa cible : *une lumière qui
      // arriverait avant l'objet qu'elle éclaire se lirait comme un décalage*,
      // et l'amortissement est précisément ce qui donne son poids au geste.
      corps.uniforms.uPenche!.value.set(r.rotation.x, r.rotation.y)
      bandeMat.uniforms.uPenche!.value.set(r.rotation.x, r.rotation.y)

      /**
       * LA GERBE NAÎT DE LA FENTE RÉELLE, pas de la fente au repos.
       *
       * Keko : « on peut descendre un peu la position des particules quand on
       * déchire le paquet et à l'explosion finale ? On dirait qu'elles spawn
       * au-dessus de l'endroit voulu ».
       *
       * *Et elles y étaient, par construction* : la gerbe vit hors du relief
       * — une gerbe ne s'incline pas avec la pochette — donc son origine était
       * posée à la hauteur de la fente D'UN SACHET DROIT. Or on déchire le
       * doigt posé sur le pointillé, c'est-à-dire en haut : `cibleX` penche
       * alors le haut du sachet vers l'arrière, et la fente DESCEND à l'écran
       * — de `(1 − cos a)` par la rotation, et encore par la perspective
       * puisqu'elle s'éloigne. Au penchant plein, cinq centièmes de hauteur
       * de monde, une quinzaine de pixels sur un téléphone, toujours vers le
       * haut. *Une rotation est une translation déguisée en profondeur*,
       * payée une quatrième fois.
       *
       * L'origine suit donc le point de la fente tel que le relief le pose —
       * sa rotation ET son avancée — et les trajectoires, elles, restent dans
       * l'axe de l'écran : le maillage ne fait que se déplacer. **Le film qui
       * descend n'est pas suivi** (`chute`), sinon le feu d'artifice partirait
       * avec lui.
       */
      const g = gerbeMesh.current
      if (g !== null) {
        fenteReelle
          .set(0, hCorps / 2 - hBande / 2 - taille * RETRAIT_SOURCE, taille * (REL_BOMBE + 0.02))
          .applyEuler(r.rotation)
          .add(r.position)
        g.position.copy(fenteReelle)
      }
    }
    corps.uniforms.uSurvol!.value = feu.current
    bandeMat.uniforms.uSurvol!.value = feu.current

    /**
     * `?gerbe` TIENT LA DÉCHIRURE À MI-COURSE, et c'est le seul moyen de juger
     * les étincelles.
     *
     * *On ne peut pas tenir un glisser depuis l'outil* — il relâche toujours,
     * et un lâcher sous `SEUIL_TIRE` refermait alors le sachet : c'est écrit
     * depuis le jour où la gerbe est passée devant le film, et ça avait coûté
     * des évènements `pointer*` fabriqués à la main. **Le banc s'arrête donc
     * là où la découpe émet**, et le jaillissement, lui, se voit en ouvrant
     * pour de bon. (Depuis que la déchirure ne se recolle plus, un lâcher la
     * laisserait en place — mais le banc montre aussi le FRONT qui avance, et
     * c'est lui qui émet.)
     *
     * Il ne force rien pendant qu'on tire : *un banc qui prendrait la main sur
     * le geste ne montrerait plus le geste.*
     */
    if (BANC_GERBE && tire.current === null && !file.current) {
      // IL TIRE, PUIS IL S'ARRÊTE — et c'est ce qu'il doit montrer depuis que
      // les étincelles naissent du MOUVEMENT. Il avance sur les six dixièmes
      // du cycle et TIENT les quatre autres, plus longtemps qu'une étincelle
      // ne vit : *on voit donc la gerbe naître, puis s'éteindre faute
      // d'avancée.* Une rampe continue ne dirait que la moitié.
      const c = (t * 0.5) % 1
      p.current = PART_FRONT * (0.22 + 0.56 * Math.min(1, c / 0.62))
    }

    if (p.current <= 0 && !file.current) {
      // IL RESPIRE TANT QU'ON NE L'A PAS TOUCHÉ. *Un objet qui attend un geste
      // doit dire qu'il attend* — et c'est le vocabulaire du jeu, celui des
      // créatures et des slots qui accueillent.
      groupe.current?.scale.setScalar(1 + Math.sin(t * 1.7) * 0.013)
      corps.uniforms.uFront!.value = -1
      bandeMat.uniforms.uFront!.value = -1
      // RIEN À ÉTEINDRE : les étincelles déjà nées finissent leur vol, et il
      // n'en naîtra pas d'autre tant que le front n'avance pas. *C'est tout ce
      // qu'un émetteur demande.*
      frontAvant.current = FRONT_DEPART
      resteEmis.current = 0
      return
    }
    groupe.current?.scale.setScalar(1)

    const pp = p.current
    const pf = Math.min(1, pp / PART_FRONT)

    // LE FILM CRAQUE AVEC LE FRONT. Keko : « le son cracks se joue
    // progressivement en fonction de l'avancée de l'ouverture ». *Le son ne
    // se joue pas, il s'avance* : c'est le front qui lui dit où il en est,
    // qu'il suive le doigt ou l'horloge — voir `suivreLeSon`. Il naît à la
    // première avancée, donc toujours dans un geste.
    if (pf > 0 && pf < 1 && craque.current !== null) {
      // LA BOUCLE JOUE, LE GAIN DIT QUAND ON L'ENTEND : ouvert tant que le
      // front avance — avec un dixième de seconde de tenue, le temps d'un trou
      // entre deux évènements de pointeur — fermé dès qu'il s'arrête. *Ce qui
      // craque est le film qu'on déchire, pas le film qu'on tient.* Elle est
      // née dans `prendre`, au geste : ici on ne fait que la doser.
      if (pf > pfAvant.current) dernierPas.current = t
      craque.current.doser(t - dernierPas.current < TENUE_CRAQUE ? 1 : 0)
    }
    pfAvant.current = pf
    // `?son` : l'appareil dit ce qu'il voit pendant la déchirure — *une
    // impression ne se discute pas, elle se mesure*, et je ne mesure pas sur
    // le téléphone de Keko.
    if (diag.current !== null)
      diag.current.textContent = `${diagnosticSon()} · craque ${cheminDe(SON_CRAQUE)} · pf ${pf.toFixed(2)} · dose ${craque.current?.niveau() ?? '—'} · doigt ${tire.current !== null ? 'oui' : 'non'}`
    // IL SORT DES DEUX BORDS : *une déchirure qui commence pile sur le bord se
    // lit comme un bord qui s'efface*, et une qui s'arrête pile à droite y
    // laisse un point de braise posé là pour toujours.
    const front = FRONT_DEPART + Math.pow(pf, COURBE_FRONT) * 1.12
    corps.uniforms.uFront!.value = front
    bandeMat.uniforms.uFront!.value = front

    /*
     * L'ÉMISSION SUIT L'AVANCÉE, PAS LA PLACE DU FRONT.
     *
     * Keko : **« elles ne doivent jaillir que lors de l'ouverture (mouvement),
     * pas à l'arrêt quand on arrête d'avancer l'ouverture. Regarde lexicodex
     * comment ils font »**.
     *
     * ***ET ILS FONT EXACTEMENT ÇA*** : leur appel est
     * `s > 0 && emitTearSparks(min(12, 1 + round(s * 90)))`, où `s` est
     * l'avancée depuis l'image précédente. **Le `s > 0` est toute la
     * réponse** — *ce qui produit l'étincelle est la découpe qui AVANCE, pas
     * la fente déjà ouverte.*
     *
     * Notre champ, lui, était piloté par `pf`, c'est-à-dire la POSITION du
     * front : à mi-course tenue, il coulait indéfiniment.
     */
    const avance = front - frontAvant.current
    frontAvant.current = front
    if (avance > 0) {
      frisson.current = Math.min(1.2, frisson.current + avance * FRISSON.gain)
      resteEmis.current += avance * DEBIT_ETINCELLE
      const nb = Math.floor(resteEmis.current)
      if (nb > 0) {
        resteEmis.current -= nb
        emettre(vols, montees, regimes, anneau, Math.min(nb, RAFALE_MAX), front, t, false)
      }
    }

    // OÙ EN EST L'ENVOL DE LA BANDE. *Il sert au vol de la bande et à son
    // fondu*, donc il se calcule UNE fois : deux endroits qui décriraient le
    // même instant se désaccorderaient au premier réglage. (La gerbe l'a lu
    // tant qu'elle était un champ ; elle naît désormais d'une rafale.)
    // CE QUI SUIT L'ARRACHEMENT SE COMPTE EN SECONDES, et chaque objet y prend
    // la sienne : la bande s'envole tout de suite, le film attend que la gerbe
    // soit retombee. *Une part commune ne pouvait pas porter deux durees.*
    const tApres = Math.max(0, (pp - PART_FRONT) * DUREE_BRULURE)
    // LE FILM PART DÈS L'ARRACHEMENT, avec le pop — il n'attend plus la gerbe.
    const pc = Math.min(1, Math.max(0, (tApres - DUREE_POMPE) / DUREE_CHUTE))

    // LES FAISCEAUX : voir FAISCEAUX. La découpe allume ce qui est ouvert, le
    // frémissement les ravive ; l'arrachement les embrase puis les éteint.
    {
      const rare = gerbe.uniforms.uRare!.value as THREE.Vector3
      const tp = pf >= 1 ? tApres : -1
      // L'EMBRASEMENT MONTE FORT ET S'ÉTEINT AVEC LA GERBE. Keko : « il faudrait
      // que la lumière augmente à l'explosion mais disparaisse après la
      // gerbe ». *Une exponentielle ne s'éteint jamais* : sa queue restait
      // visible après les étincelles. La lumière monte en 80 ms, tient, puis
      // descend à ZÉRO exactement quand la gerbe finit (DUREE_GERBE).
      const montee = tp < 0 ? 0 : Math.min(1, tp / 0.08)
      const declin = tp < 0 ? 1 : 1 - smoothstepJs(DUREE_GERBE * 0.25, DUREE_GERBE, tp)
      const embrase = montee * declin
      const eteintDecoupe = tp < 0 ? 1 : Math.exp(-6 * tp)
      for (const [i, f] of FAISCEAUX.entries()) {
        const m = faisceaux.current[i]
        if (m === undefined || m === null) continue
        const ouvert = Math.min(1, Math.max(0, (front - f.u) / 0.08))
        const vacille = 0.72 + 0.28 * Math.sin(t * f.rythme + f.phase)
        const decoupe =
          FORCE_FAISCEAU.decoupe * ouvert * vacille * (1 + Math.min(1, frisson.current) * 0.8) * eteintDecoupe
        const eclat = FORCE_FAISCEAU.eclat * embrase * (0.85 + 0.15 * Math.sin(t * f.rythme * 1.7 + f.phase))
        const force = Math.max(decoupe, eclat)
        m.visible = force > 0.004
        if (!m.visible) continue
        const mat = faisceauxMat[i]!
        mat.uniforms.uForce!.value = force
        const c = mat.uniforms.uCouleur!.value as THREE.Vector3
        const k = f.teinte ? Math.min(1, embrase * 1.5) : 0
        c.set(
          FENTE_BORD[0] + (rare.x * 1.5 - FENTE_BORD[0]) * k,
          FENTE_BORD[1] + (rare.y * 1.5 - FENTE_BORD[1]) * k,
          FENTE_BORD[2] + (rare.z * 1.5 - FENTE_BORD[2]) * k,
        )
        // IL S'ALLONGE EN S'OUVRANT, ET PLUS ENCORE À L'ARRACHEMENT.
        // À LA GERBE, LES RAYONS S'ÉTIRENT — Keko : « il faudrait augmenter la
        // longueur, pas forcément l'intensité, au moment de la gerbe finale ».
        // Ils montent jusqu'à 3,2 fois leur longueur de découpe, en 0,15 s.
        const longueur = f.longueur * (0.55 + 0.45 * ouvert) * (1 + 2.2 * (tp < 0 ? 0 : 1 - Math.exp(-14 * tp)))
        m.position.set(f.u - 0.5, 0, 0)
        m.rotation.set(0, 0, f.angle)
        m.scale.set(f.largeur * (1 + 0.6 * embrase), longueur, 1)
      }
    }

    if (pf >= 1 && !ditDechire.current) {
      ditDechire.current = true
      // LE POP, « au moment final de l'ouverture » : l'arrachement, le même
      // instant que le flash et la rafale. Le craquement se tait avec — *ce
      // qui craquait vient de céder.*
      craque.current?.arreter()
      craque.current = null
      // S'il n'a pas été programmé au lâcher — le banc `?gerbe`, ou un sachet
      // ouvert sans geste — il part maintenant, tard d'une image.
      if (!popProgramme.current) {
        jouerSon(SON_POP)
        jouerSon(SON_EQUIPER)
      }
      // LE JAILLISSEMENT EST UNE RAFALE, AU MÊME INSTANT QUE LE FLASH. *Deux
      // endroits qui décriraient le même instant se désaccorderaient au
      // premier réglage*, donc c'est le drapeau du flash qui le porte — et
      // c'est aussi ce que fait lexicodex, dont la rupture appelle son
      // `emitTearSparks(14)` à côté du son et de la secousse.
      emettre(vols, montees, regimes, anneau, ECLAT_NOMBRE, front, t, true)
      onDechire?.()
    }

    /*
     * LA BANDE EST PROJETÉE une fois le front arrivé au bout.
     *
     * Une balistique franche, sans frein — le lancer de lexicodex — et une
     * culbute sur trois axes : *ce qu'on arrache est éjecté, et rien ne le
     * retient.* Elle S'EFFACE AVEC LE FILM : son fondu lit `pc`, la descente
     * du film, donc elle est partie quand lui a quitté le cadre. Le bord du
     * cadre reste un second terme, pour le cas où elle sortirait avant. Voir
     * `LANCER` et `FONDU_BANDE`.
     */
    if (bande.current !== null && pf >= 1 && !ditParti.current) {
      const b = bande.current
      const q = vol.current
      if (q.t === 0) {
        q.vx = LANCER.v.x
        q.vy = LANCER.v.y
        q.vz = LANCER.v.z
      }
      q.t += dt
      // SEULE LA PESANTEUR AGIT : la chute accélère du premier au dernier
      // instant, et c'est ce qui fait lire une projection plutôt qu'un glissé.
      q.vy -= LANCER.pesanteur * dt
      q.x += q.vx * dt
      q.y += q.vy * dt
      q.z += q.vz * dt
      b.position.x = taille * q.x
      b.position.y = hCorps / 2 + taille * q.y
      b.position.z = taille * q.z
      // LA CULBUTE S'INTÈGRE, elle ne se pose pas : une rotation qui court
      // sans fin, à vitesse constante sur chaque axe — un objet lancé ne
      // cesse pas de tourner.
      b.rotation.x += LANCER.culbute.x * dt
      b.rotation.y += LANCER.culbute.y * dt
      b.rotation.z += LANCER.culbute.z * dt
      // LE FONDU LIT LA DESCENTE DU FILM : plein tant que le film tient,
      // éteint quand il a quitté le cadre. *L'uniforme attendait depuis que
      // le film a cessé de s'effacer* — il n'a plus que la bande à servir.
      const fondu = 1 - smooth((pc - FONDU_BANDE) / (1 - FONDU_BANDE))
      bandeMat.uniforms.uFondu!.value = fondu
      // PARTIE : éteinte avec le film, ou sortie du cadre avant lui.
      // `descente` est la demi-hauteur du champ plus celle du sachet, donc en
      // dessous il reste au moins un demi-sachet de marge.
      //
      // **MAIS JAMAIS AVANT `onOuvert`.** Keko : « une fois le paquet ouvert
      // le jeu bloque, la carte ne bouge plus, ne zoome pas ». *Le parent
      // DÉMONTE le sachet sur ce signal* — et avec le lancer balistique la
      // bande sort du cadre par le bas AVANT que le film ait fini sa descente,
      // donc avant que `onOuvert` ait dit au défilé qu'il peut répondre. Le
      // sachet partait sans jamais dire « ouvert », et le paquet restait mort.
      // *La plume ne pouvait pas le faire : elle mettait trois secondes.* Un
      // signal qui en conclut un autre ne peut pas le précéder.
      // ET PAS AVANT QUE LA GERBE SOIT ÉTEINTE (`pp >= 1`) : le sachet porte
      // les étincelles, et le démonter sur le seul départ du film les
      // couperait en plein vol — depuis que le film ne les attend plus.
      if (
        dit.current &&
        pp >= 1 &&
        (fondu <= 0 || b.position.y < -descente || q.t > LANCER.vieMax)
      ) {
        ditParti.current = true
        onParti?.()
      }
    }

    /*
     * LE FILM DESCEND ET DECOUVRE LA CARTE, il ne s'efface plus.
     *
     * Keko : **« ce serait bien qu'à l'ouverture du booster, le paquet
     * descende, laissant la carte derrière lui apparaître comme si on enlevait
     * le paquet vers le bas »**.
     *
     * ***ET C'EST LE FILM QUI RÉVÈLE, PLUS LA CARTE QUI MONTE.*** Il
     * s'effaçait sur le dernier quart pendant que la carte sortait par la
     * fente ; *un fondu dit « ce sachet n'existait pas », un retrait dit
     * « on l'a enlevé ».* La carte n'a donc plus à bouger d'un pixel : c'est le
     * départ du film qui la découvre, du haut vers le bas.
     *
     * **SEUL LE CORPS DESCEND, jamais la bande ni la gerbe** : la bande est en
     * train de s'envoler à droite et les étincelles finissent leur vol à
     * l'endroit d'où elles ont été lancées. *Ce qu'on retire est la pochette,
     * pas ce qui vient d'en sortir.*
     *
     * **ET IL PART DÈS L'ARRACHEMENT, avec le pop.** Il a attendu la gerbe le
     * temps d'un épisode — « le paquet reste en place durant la gerbe
     * finale » — parce qu'elle était une cloche qui retombait sur la fente.
     * Keko l'a rouvert quand elle est devenue un feu d'artifice qui s'éteint
     * en l'air : « il faudrait que le paquet descende dès le son pop ». Voir
     * `DUREE_BRULURE`.
     */
    if (chute.current !== null) {
      chute.current.position.y = -descente * chuteDuFilm(pc)
      // LE POMPAGE : un gonflement qui monte d'un coup et retombe en se
      // tassant d'un rien, *le contraste de vitesse du bond des créatures*.
      // Plus large que haut d'un cheveu : un sac qui crache s'ouvre en travers.
      const tp = pf >= 1 ? tApres : -1
      const g = tp < 0 ? 0 : POMPE.amplitude * Math.exp(-POMPE.amorti * tp) * Math.sin(POMPE.pulsation * tp + 0.35) / Math.sin(0.35 + Math.PI / 2)
      chute.current.scale.set(1 + g * 1.15, 1 + g * 0.85, 1 + g)
    }

    // « OUVERT » QUAND LE FILM A DÉCOUVERT LA CARTE, pas quand il est hors
    // cadre : c'est lui qui la découvre, et c'est sur lui qu'elle se
    // rapproche. Keko : « il faudrait que le zoom commence plus tôt, la carte
    // reste trop longtemps avant le zoom ». À PART_OUVERT de la chute, le film
    // a parcouru près de la moitié de sa course et dégagé les quatre
    // cinquièmes de la carte : elle rebondit pendant qu'il finit de partir,
    // ce qui se lit comme une carte qui jaillit de sa pochette. La gerbe peut
    // finir de s'éteindre pendant ce temps.
    if (pc >= PART_OUVERT && !dit.current) {
      dit.current = true
      onOuvert?.()
    }
  })

  /**
   * ON TIRE LA LANGUETTE VERS LA DROITE, et le front suit le doigt.
   *
   * Demandé par Keko : « pour ouvrir le booster il faudrait slider vers la
   * droite ». *C'est le geste de l'objet* — on ne tape pas un sachet, on
   * l'ouvre en tirant — et il rend au joueur ce qu'une tape lui prenait :
   * **la déchirure est à sa main, pas à une animation qui se déroule.**
   *
   * **LE DOIGT NE PEUT PAS ALLER JUSQU'À L'ARRACHEMENT** (`TIRE_MAX`) : *un
   * geste prépare, le relâchement conclut.* Sans cette borne, tirer très loin
   * ferait partir la bande au milieu du mouvement, donc sans qu'on l'ait
   * décidé.
   *
   * **LE SUIVI EST POSÉ SUR LA FENÊTRE**, et retiré par SIGNAL : le doigt sort
   * forcément du sachet — sortir *est* le geste — et *un écouteur retiré par
   * référence retire celui d'un autre rendu.*
   */
  /**
   * OÙ LE POINTEUR TOMBE SUR LE SACHET, en parts de sa largeur et de sa
   * hauteur. *Un seul endroit le calcule* : le survol et le geste s'en servent
   * tous les deux, et **deux conversions qui décriraient la même place se
   * désaccorderaient au premier réglage.**
   */
  const viseDepuis = (e: ThreeEvent<PointerEvent>): { x: number; y: number } => ({
    x: (e.point.x - position[0]) / taille,
    y: (e.point.y - position[1]) / H,
  })

  /**
   * LE PENCHANT EST BORNÉ. Le doigt va bien au-delà du sachet en tirant — et
   * *une inclinaison qui suit un doigt sans borne finit par coucher l'objet*,
   * donc par montrer sa tranche plutôt que sa lumière.
   */
  const penche = (x: number, y: number): void => {
    curseur.current = {
      x: Math.min(BORNE_PENCHE, Math.max(-BORNE_PENCHE, x)),
      y: Math.min(BORNE_PENCHE, Math.max(-BORNE_PENCHE, y)),
    }
  }

  const prendre = (e: ThreeEvent<PointerEvent>): void => {
    if (file.current || tire.current !== null) return
    e.stopPropagation()
    tire.current = { x0: e.clientX, y0: e.clientY, p0: p.current, ...viseDepuis(e) }
    // LA BOUCLE DU CRAQUEMENT NAÎT ICI, DANS LE GESTE, à gain zéro. Keko :
    // « le son fonctionne sur PC mais pas sur tél ». *Elle naissait dans la
    // boucle d'image, au premier pas du front* — et sur iPhone un contexte
    // audio suspendu ne se reprend que depuis un geste : la source partait
    // dans un contexte qui ne tournait pas, et ne jouait qu'au pop, trop tard.
    // Le banc `?craque`, lui, la lançait au `pointerdown` — et il s'entendait.
    // **Un son qui doit tourner part d'un geste, même s'il n'a rien à dire
    // encore** ; c'est la boucle d'image qui le dose ensuite.
    if (craque.current === null) {
      craque.current = jouerEnBoucle(SON_CRAQUE, VOLUME_CRAQUE)
      craque.current.doser(0)
    }
    /**
     * **LE DOIGT POSÉ PENCHE LE SACHET**, comme le survol penche à la souris.
     *
     * Keko : « il faudrait pouvoir bouger le booster quand on hover / maintient
     * le tap dessus, comme pour les cartes, afin de voir comment la lumière joue
     * dessus ».
     *
     * *Ce n'est pas une exception à la règle du survol, c'en est
     * l'application.* Si le relief est réservé à la souris, c'est parce qu'au
     * doigt le `pointerout` n'arrive jamais et que le sachet resterait penché —
     * **ici on sait exactement quand le doigt se lève**, puisque c'est ce geste
     * qui l'a armé. Le défaut n'existe pas. C'est mot pour mot ce que la carte
     * zoomée a déjà réglé.
     *
     * **ET ÇA NE COÛTE PAS UN GESTE DE PLUS** : tirer vers la droite déchire,
     * bouger le doigt ailleurs ne fait qu'incliner — *donc on voit la lumière
     * courir PENDANT qu'on ouvre*, ce qui est exactement ce qu'on cherche à
     * montrer.
     */
    survol.current = true
    sorti.current = false
    const ctrl = new AbortController()
    const bouger = (ev: PointerEvent): void => {
      const g = tire.current
      if (g === null) return
      // LE CONTEXTE AUDIO SE REPREND DEPUIS LE GESTE, à chaque pas : sur
      // iPhone il ne se reprend que là, et le craquement se dose pendant ce
      // glisser — voir `reveillerLeSon`.
      reveillerLeSon()
      const part = g.p0 / PART_FRONT + (ev.clientX - g.x0) / largePx
      // UN CLIQUET : le front ne recule jamais. *Un film déchiré ne se
      // recolle pas* — un doigt qui revient en arrière ne fait qu'incliner le
      // sachet, et la déchirure reprend quand il repasse son point le plus
      // loin. Tranché par Keko : « tout ce qui est déchiré le reste ».
      p.current = Math.max(p.current, Math.min(TIRE_MAX, Math.max(0, part)) * PART_FRONT)
      // LE CURSEUR SE SUIT EN PIXELS, pas par un second lancer de rayon : le
      // doigt sort du sachet dès qu'on tire — *sortir EST le geste* — donc il
      // n'y a plus rien à toucher. `largePx` dit déjà ce que vaut une largeur
      // de sachet à l'écran, et l'écran descend quand la scène monte.
      penche(g.x + (ev.clientX - g.x0) / largePx, g.y - (ev.clientY - g.y0) / (largePx * RAPPORT_SACHET))
    }
    const finir = (): void => {
      // AU DOIGT, LE RELIEF TOMBE AVEC LE GESTE — *c'est ce qui permet de
      // l'allumer au doigt sans refaire le défaut du `pointerout` qui
      // n'arrive jamais.* À la souris il ne tombe que si le curseur a quitté
      // le sachet en route, auquel cas `quitter` s'est tu pour ne pas
      // redresser la pochette en plein tirage.
      if (e.pointerType === 'mouse' && !sorti.current) return
      survol.current = false
      document.body.style.cursor = ''
    }
    // AU LÂCHER, DEUX ISSUES ET AUCUNE NE RECULE : passé `SEUIL_TIRE` la
    // déchirure file toute seule ; en dessous elle RESTE où elle est, et le
    // geste suivant repart de là (`p0`).
    const lacher = (): void => {
      ctrl.abort()
      const acquis = tire.current !== null && p.current / PART_FRONT >= SEUIL_TIRE
      tire.current = null
      finir()
      if (!acquis) return
      file.current = true
      // LE POP SE PROGRAMME ICI, PAS À L'ARRACHEMENT. Keko : « le pop se
      // produit trop tard ». *Dès le lâcher, l'instant de l'arrachement est
      // connu* — le front finit sa course à l'horloge, donc il reste
      // exactement ce qu'il manque de course, en secondes — et un son qu'on
      // sait venir se programme sur l'horloge audio, en avance de la latence
      // de sortie, au lieu d'attendre l'image qui le constate : *une image de
      // retard plus la latence du téléphone, c'est ce qu'on entendait.*
      popProgramme.current = true
      jouerSon(SON_POP, 1, Math.max(0, PART_FRONT - p.current) * DUREE_BRULURE)
      // ET « EQUIP » PART AVEC LE POP, au même instant programmé — Keko : « on
      // peut jouer Equip.aac en même temps que le pop ? » *Deux sons qui disent
      // le même instant se programment sur la même horloge.*
      jouerSon(SON_EQUIPER, 1, Math.max(0, PART_FRONT - p.current) * DUREE_BRULURE)
      onOuvrir?.()
    }
    // UNE ANNULATION N'EST PAS UN LÂCHER : c'est le système qui reprend le
    // geste, donc le sachet ne s'ouvre pas — et ce qui est déchiré le reste.
    const annuler = (): void => {
      ctrl.abort()
      tire.current = null
      finir()
    }
    window.addEventListener('pointermove', bouger, { signal: ctrl.signal })
    window.addEventListener('pointerup', lacher, { signal: ctrl.signal })
    window.addEventListener('pointercancel', annuler, { signal: ctrl.signal })
  }

  const viser = (e: ThreeEvent<PointerEvent>): void => {
    if (e.pointerType !== 'mouse') return
    e.stopPropagation()
    const { x, y } = viseDepuis(e)
    penche(x, y)
    if (!survol.current && !file.current) {
      survol.current = true
      document.body.style.cursor = 'grab'
    }
  }

  const quitter = (): void => {
    // ON NE REDRESSE PAS UN SACHET QU'ON EST EN TRAIN DE TIRER : le curseur
    // sort forcément de la pochette en la déchirant — *sortir EST le geste* —
    // et c'est précisément là qu'on veut voir la lumière courir. On retient
    // seulement qu'il est sorti, pour que le lâcher en tire les conséquences.
    sorti.current = true
    if (tire.current !== null) return
    survol.current = false
    document.body.style.cursor = ''
  }

  return (
    <group ref={groupe} position={position as unknown as THREE.Vector3Tuple}>
      {/* LA GERBE, DEVANT le sachet et bien plus haute que lui : elle part de
          la fente et monte au-delà du bord. Elle vit HORS du groupe du
          relief — *une gerbe d'étincelles ne s'incline pas avec la pochette*,
          elle monte dans l'axe de l'écran.

          **ELLE ÉTAIT DERRIÈRE, et Keko l'a vu** : « les confettis semblent
          sortir de derrière le paquet plutôt que devant — ils sortent de
          l'ouverture, donc ils devraient être devant la partie du haut ».
          *Ce qui jaillit d'une fente passe devant ce qui l'entoure*, sinon on
          lit une lueur posée au fond du décor.

          **LE Z SE CALCULE, il ne s'écrit pas** : le sachet avance de AVANCEE
          au survol et son ventre pousse encore de REL_BOMBE, donc son point le
          plus proche est la somme des deux — la gerbe se pose au-delà. Et ça
          ne masque rien : elle est ADDITIVE et n'écrit pas la profondeur, donc
          elle n'ajoute que de la lumière là où une étincelle passe.

          **ET SA POSITION N'EST PAS EN JSX** : c'est la boucle d'image qui
          la pose, sur la fente réelle du relief — voir `fenteReelle`. Écrite
          ici, React la réécrirait au premier rendu venu, et la gerbe sauterait
          d'une image à la hauteur du sachet droit. */}
      <mesh
        ref={gerbeMesh}
        geometry={semis}
        material={gerbe}
        scale={taille}
        frustumCulled={false}
        raycast={() => null}
        renderOrder={2}
      >
        {/* LES FAISCEAUX, enfants de la gerbe : sa place sur la fente réelle,
            son échelle, et rien à recalculer. Voir FAISCEAUX. */}
        {FAISCEAUX.map((_, i) => (
          <mesh
            key={i}
            ref={(m) => {
              faisceaux.current[i] = m
            }}
            geometry={planFaisceau}
            material={faisceauxMat[i]}
            visible={false}
            frustumCulled={false}
            raycast={() => null}
            renderOrder={3}
          />
        ))}
      </mesh>

      {/* LE RELIEF porte l'inclinaison et l'avancée. Il lui faut son propre
          groupe : le groupe du dessus tient la place et la respiration, et
          *deux sources qui écriraient la même transformation se battraient à
          chaque image.* */}
      <group ref={relief}>
        {/* LE CORPS : il reste, et c'est de lui que les cartes sortiront.

            IL A SON PROPRE GROUPE, qui porte sa descente — *et le groupe n'a
            pas de `position` en JSX*, sinon React la réécrirait au premier
            rendu venu et le film remonterait d'une image. */}
        <group ref={chute}>
          <mesh
            position={[0, -hBande / 2, 0]}
            onPointerDown={prendre}
            onPointerMove={viser}
            onPointerOut={quitter}
          >
            {/* IL LUI FAUT DES SEGMENTS : *un plan à quatre sommets ne peut
                pas se bomber*, il n'a rien entre ses coins à déplacer. */}
            <planeGeometry args={[taille, hCorps, 36, 56]} />
            <primitive object={corps} attach="material" />
          </mesh>
        </group>

        {/* LA BANDE : son GROUPE porte le vol, son plan porte le dessin — et le
            plan est à l'origine du groupe, sinon la rotation la ferait tourner
            autour du centre du SACHET et l'enverrait décrire un cercle. *Un
            objet tournoie sur lui-même, donc son pivot est son centre.* */}
        {/* ELLE SE DESSINE APRÈS LE CORPS, quoi qu'en dise la profondeur :
            pliée, son sommet retombe DEVANT lui, et le tri des transparents se
            fait sur la place de l'objet, pas sur ses sommets — selon le
            penchant, il la mettait derrière. La gerbe passe encore après,
            *une étincelle ne se cache pas sous un film qui n'écrit pas sa
            profondeur.* */}
        <group ref={bande} position={[0, hCorps / 2, 0]}>
          <mesh
            geometry={planBande}
            renderOrder={1}
            onPointerDown={prendre}
            onPointerMove={viser}
            onPointerOut={quitter}
          >
            <primitive object={bandeMat} attach="material" />
          </mesh>
        </group>
      </group>
    </group>
  )
}

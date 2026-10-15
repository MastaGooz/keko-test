/**
 * LA CARTE, PEINTE DANS UN CANVAS POUR SERVIR DE TEXTURE.
 *
 * C'est le choix de rendu central du moteur 3D, et il répond au risque
 * principal d'un jeu de cartes en trois dimensions : **le texte**. Une carte
 * de ce jeu porte un nom, un cartouche d'effet et un type gravé ; en 3D il n'y
 * a que deux façons de les afficher, et une seule tient ici.
 *
 * - *Du texte 3D* (géométrie ou police SDF) : net à toute échelle, mais il
 *   faut recomposer toute la mise en page dans la scène, et chaque ligne
 *   devient un objet de plus à animer avec la carte.
 * - *Du HTML superposé* : on garde le gabarit CSS, mais il flotte AU-DESSUS de
 *   la scène — il ne reçoit ni la lumière, ni l'inclinaison, ni les ombres.
 *   Autant rester en 2D.
 * - **Une texture peinte** : la carte est une image, donc elle s'incline, se
 *   plie à la lumière et porte son ombre comme un objet. Le texte y est net
 *   tant que la texture est plus grande que la carte à l'écran — d'où `LARGE`
 *   ci-dessous, qui couvre largement une carte de téléphone.
 *
 * Les proportions reprennent celles du gabarit « Serment de cendre »
 * (`ui/carte.css`) : la carte fait 100 de large pour 140 de haut, et tout s'y
 * mesure en centièmes de largeur. On les garde à l'identique pour que la
 * carte 3D soit la MÊME carte, et pas une deuxième version qui dérivera.
 */
import * as THREE from 'three'
import { art, fondPropre, urlDuCout, urlDuDosDeCarte, urlDuFond, urlImageDeKeko } from '../ui/art.ts'
import { boiteDe, mesurerBoite } from './silhouette.ts'

/** Ce qu'il faut savoir d'une carte pour la peindre. */
export type CarteAPeindre = {
  /**
   * L'identifiant de l'EXEMPLAIRE, et il n'est pas décoratif : c'est la clé
   * React de la carte dans la main. Bâtie sur l'index, elle changeait au
   * moindre réordonnancement — React démontait alors la carte et en remontait
   * une autre, ce qui la faisait **clignoter en noir** le temps de repeindre.
   * Le modèle du jeu porte déjà cet identifiant (`Carte.id`).
   */
  id: string
  nom: string
  /**
   * Son coût en points d'action — et `null` quand elle N'EN A PAS.
   *
   * Le projet veut « le même écusson sur toute carte qui coûte de l'énergie »,
   * et c'est précisément pour ça qu'il faut pouvoir n'en poser aucun : *une
   * orbe de PA sur une carte qui ne se joue pas mentirait sur ce qu'elle est.*
   * Une carte-personnage du troisième mode n'a pas de coût, donc son coin
   * haut-gauche reste nu.
   */
  cout: number | null
  /**
   * LE COMPTE DE CARTES d'une pièce d'équipement, s'il s'agit d'une pièce.
   *
   * Elle porte alors ce chiffre là où une carte porte sa gemme de coût, dans
   * une petite case **en forme de carte** : une carte pour dire « des cartes ».
   * C'est son POIDS, et c'est la seule information qui rende « équiper plus
   * dilue » lisible sur la pièce elle-même. Tranché par Keko en 2D, repris
   * tel quel ici.
   */
  compteur?: number
  /** Le cartouche, une entrée par ligne. */
  effet: readonly string[]
  /**
   * CE QU'UNE PIÈCE APPORTE, MODÈLE PAR MODÈLE — et c'est un DESSIN, pas une
   * phrase. Demandé par Keko : « une icône de carte un peu comme en haut à
   * gauche, avec un chiffre dedans, et le nom de la carte à sa droite, plutôt
   * que "3×" ».
   *
   * *Le « × » disait un nombre, la petite carte dit ce qu'on compte* : c'est
   * le même symbole que le compteur du coin, donc la pièce répète en petit ce
   * qu'elle annonce en grand. Quand il est là, il remplace le cartouche.
   */
  /** Le type gravé au pied : « Attaque », « Trésor »… */
  type: string
  /**
   * UN TRÉSOR, et c'est la FORME de son cadre qui le dit.
   *
   * Keko : « j'ai besoin d'un contour trésor et cartes de deck différents pour
   * bien visualiser, et je peux pas utiliser l'or pour les trésors, ce qui est
   * dommage. » *La couleur est prise par la rareté*, et « trésor ou carte de
   * deck » n'est pas une échelle, c'est une famille : **une échelle se dit en
   * couleur, une famille se dit en forme.**
   *
   * Les quatre alliages restent donc intacts, et le trésor se distingue par sa
   * SILHOUETTE — voir `CADRE_TRESOR`.
   */
  tresor?: boolean
  /**
   * SON CONTOUR EST SIMPLE — un liseré régulier plutôt qu'une coque arrachée.
   *
   * Demandé par Keko pour le mode emoji : « je voudrais rework l'organisation
   * des cartes : un contour plus simple, plus dans le ton des emojis ».
   *
   * *Le gabarit « Serment de cendre » parle la FERRONNERIE* — une plaque de
   * laiton, une coque déchirée posée dessus, deux encoches à la hauteur du
   * titre, un dégradé oblique qui court du clair au presque noir. **Il est
   * juste là où il est né** : une carte de combat EST une plaque de métal. Un
   * emoji, non — c'est un aplat net aux formes franches, et un cadre arraché à
   * côté de lui se lit comme la pièce d'un autre jeu.
   *
   * **ET C'EST LA FORME QUI CÈDE, PAS LA COULEUR.** La rareté vit dans la
   * teinte du cadre et elle ne bouge pas d'un ton : *une échelle se dit en
   * couleur, une famille se dit en forme* — et dans ce mode **il n'y a qu'une
   * famille**, donc la forme n'a rien à dire et peut se taire. C'est aussi ce
   * qui rend la bascule sûre : le seul axe que la carte porte est intact.
   *
   * `?contour=fin|plaque|large` essaie son épaisseur, voir `PISTE_CONTOUR`.
   */
  contour?: 'simple'
  /**
   * SA ZONE DE TEXTE EST UNE BULLE — et sa police suit.
   *
   * Demandé par Keko pour le mode emoji : « la police et la zone de texte
   * (dégradé noir) sont hors du thème ; on veut une police et un style pour la
   * zone de texte proche de l'univers smartphone / fun des emoji ».
   *
   * *Le gabarit éteint son image sous un voile NOIR et écrit dessus en clair* —
   * c'est la grammaire d'une plaque de métal gravée, et elle est juste là où
   * elle est née. **Un emoji vient d'un clavier**, donc sa carte parle la langue
   * d'une application : une plaque CLAIRE posée sur l'image, du texte sombre
   * dessus, une police ronde et le type en pastille.
   *
   * **ET ÇA PORTE DEUX DÉCISIONS DANS UN SEUL CHAMP, à dessein** : la plaque et
   * la police disent la même chose — *de quel univers cette carte parle* — et
   * les séparer demanderait de pouvoir choisir une plaque claire avec un texte
   * gothique, ce qui n'a pas de sens. C'est l'inverse du couple `<b>` / `<d>`,
   * où **deux décisions qui ne portent pas sur les mêmes mots ne peuvent pas
   * voyager dans la même balise.**
   *
   * `?texte=sombre` rend le dégradé noir — *ce qui a servi à choisir doit
   * rester ouvrable, même une fois le choix fait.*
   */
  texte?: 'bulle'
  /**
   * SA FAMILLE — et c'est son DÉCOR qui la dit, pas son cadre : rouge pour une
   * arme, vert pour un objet, or pour un trésor, le bleu d'origine pour une
   * armure. Une pièce la porte, et les cartes de son set en héritent.
   */
  ciel?: Ciel
  /**
   * LES MOTS-CLÉS QU'ELLE EMPLOIE — pour l'encadré du zoom, jamais pour le
   * cartouche. *La carte NOMME, le glossaire EXPLIQUE.*
   */
  motsCles?: readonly string[]
  /**
   * LA VALEUR D'UN TRÉSOR, dite par un SYMBOLE et un chiffre — pas par une
   * phrase du cartouche.
   *
   * Keko : « pour le gain en or on ne va pas l'afficher directement dans la
   * description ; on va afficher une valeur de qualité avec un petit symbole,
   * hors du champ de description — peut-être un symbole suivi de la valeur ? »
   *
   * *Et ça tombe juste sur l'économie*, qui n'est toujours pas tranchée : la
   * carte cesse de promettre de l'OR et se contente de dire ce qu'elle VAUT.
   * La note le demandait déjà — « ce qu'il faut montrer, c'est la valeur du
   * butin au hub, quelle que soit sa forme finale ».
   */
  valeur?: number
  /**
   * SA RARETÉ, si elle en a une — et c'est le CADRE qui la porte.
   *
   * Keko voulait « un code vert/bleu/violet/orange classique ». Le support est
   * la coque de laiton elle-même, teintée : *ce qui est rare est fait d'un
   * autre métal.* Le dégradé garde exactement son profil de lumière, seule la
   * teinte se décale — donc ça reste du métal, et non une couleur posée dessus.
   *
   * **Le laiton nu EST le commun** : la carte ordinaire ne change pas d'un
   * pixel, et seules les pièces rares se signalent. *Une échelle dont le
   * premier cran est le silence se lit mieux qu'une échelle qui crie partout.*
   *
   * **Et la couleur ne dit QUE la rareté.** Le type — arme, armure, objet,
   * carte de deck — se lit à la forme : le symbole du coin, l'illustration, le
   * mot du pied. *Une échelle se dit en couleur, une famille se dit en forme*,
   * et deux codes couleur sur un même objet n'en laissent lire aucun.
   */
  rarete?: string
  /**
   * HOLOGRAPHIQUE — **un bonus de l'EXEMPLAIRE, pas du modèle.**
   *
   * Tranché par Keko : « chaque carte peut également être holographique et/ou
   * animé (deux bonus de rareté applicables à toutes les raretés) », et ils se
   * tirent À L'OUVERTURE d'un paquet. *Deux exemplaires du même emoji peuvent
   * donc différer*, ce qui est tout l'intérêt d'en ouvrir un de plus.
   *
   * **IL N'ENTRE PAS DANS LA PEINTURE, DONC PAS DANS `signature()`.** Le foil
   * vit dans le NUANCEUR — c'est ce qui le rend indépendant de la teinte du
   * cadre : *une couleur qui dépend de l'angle sous lequel on regarde ne peut
   * pas être une image peinte*, et c'est la définition même d'un hologramme.
   * Deux exemplaires, l'un holo et l'autre non, partagent donc leur texture :
   * **le bonus est gratuit en mémoire.**
   *
   * *C'est la seule propriété de `CarteAPeindre` qui ne change rien à ce que
   * le peintre dessine*, et elle y vit quand même parce que c'est cet objet
   * qui voyage jusqu'à `Carte3D`.
   */
  holo?: boolean
  /**
   * LA MATIÈRE DE LA PIÈCE QUI L'A PRODUITE — elle choisit le DESSIN.
   *
   * Quatre armures donnent la même Protection, et Keko en a dessiné quatre :
   * tissu, cuir, maille, plate. *C'est le motif des trois tiers de la potion,
   * avec une autre variante* — là c'est la rareté qui choisit le fichier, ici
   * la matière.
   *
   * **Elle entre dans `signature()`**, sans quoi les quatre partageraient une
   * texture et l'on n'en verrait qu'une.
   */
  matiere?: string
  /**
   * SON ILLUSTRATION DONNÉE PAR URL, au lieu d'être cherchée par nom.
   *
   * Tout le jeu cherche son dessin dans une TABLE indexée par nom de modèle —
   * ce qui suppose un catalogue fermé, écrit à la main. *Le troisième mode
   * engendre ses cartes depuis Wikidata*, donc son illustration est une URL
   * qu'il découvre : il n'y a pas de table à écrire, et il ne faut pas qu'il y
   * en ait une.
   *
   * Elle prend la main sur les deux autres chemins, le repli SVG reste
   * derrière : *un canvas ne dessine rien du tout si l'image manque*, et une
   * carte sans dessin doit quand même sortir.
   */
  illustration?: string
  /**
   * UN EMOJI EN GUISE D'ILLUSTRATION — le cinquieme mode.
   *
   * Demande par Keko : « on utilise des emoji : noto color emoji et noto
   * animated emoji ». *Il n'y a pas d'image a charger* : le caractere se peint
   * au canvas avec la police, et le resultat entre dans le pipeline par la
   * meme porte qu'une photo. **Donc le decor, le bloom, le rognage et le ciel
   * marchent sans une ligne de plus** -- *un second chemin de peinture aurait
   * derive du premier au premier reglage.*
   */
  emoji?: string
  /**
   * UNE ILLUSTRATION DEJA PRETE, qui passe devant tout le reste.
   *
   * *C'est ce qui rend l'emoji ANIME possible sans refondre le peintre* : une
   * frame decodee est une image comme une autre, donc **la carte se repeint
   * entiere a chaque image** -- mesure, 1 a 2 ms, soit douze pour cent d'un
   * coeur pour deux cartes animees a trente images par seconde. *Decouper la
   * peinture en deux couches aurait coute dix fois plus de code pour le meme
   * resultat.*
   */
  image?: CanvasImageSource & { width: number; height: number }
  /**
   * L'IDENTIFIANT DE L'EMOJI ANIME, s'il en a un -- les points de code separes
   * par des tirets.
   *
   * *Il ne sert pas a peindre* : il dit a `Carte3D` qu'il y a une animation a
   * aller chercher. **Il n'entre donc PAS dans `signature()`**, parce que la
   * carte animee ne passe pas par le cache partage -- *deux cartes animees ne
   * sont jamais au meme instant de leur animation.*
   */
  animation?: string
  /**
   * SON ILLUSTRATION RENTRE ENTIÈRE, au lieu de se faire rogner.
   *
   * Tranché par Keko pour le mode peintures : « si portrait, hauteur de l'image
   * = hauteur de la zone d'illustration (bandes noires sur les côtés) et
   * inversement ? ainsi on garantit la totalité de l'œuvre ».
   *
   * *Et il fallait le faire* : mesuré sur 313 images de peintures, **52 % sont
   * en portrait et 43 % en paysage**, rapport médian 0,89 — là où le gabarit
   * attend 0,70. **Seules 21 % y tiennent**, et un `cover` rognerait de plus de
   * moitié 22 % des œuvres : La Cène deviendrait un fragment.
   *
   * Ça ne coûte rien, parce que le mécanisme existait déjà : `couvrir` prend un
   * `PLAFOND_ROGNAGE`, réglé à 25 % pour les animaux dont *le rognage médian
   * vaut 8 %*. **Ici le plafond vaut ZÉRO**, et ce qui reste découvert laisse
   * voir le fond peint de la carte — qui est déjà là et fait le passe-partout.
   *
   * *C'est exactement ce qu'une peinture EST* : une toile dans un cadre.
   */
  illustrationEntiere?: boolean
  /**
   * SES DEUX MESURES DE COMBAT, aux deux bouts du pied — l'attaque à gauche,
   * la défense à droite, le type gravé entre elles.
   *
   * **ELLES NE PORTENT PAS DE SYMBOLE, elles portent leur COULEUR.** Keko
   * avait essayé une épée et un bouclier dans le cartouche, puis les a
   * retirés : « c'est pas terrible, on va supprimer les symboles à part celui
   * des PA ». *Un dessin qui redit un nom ne l'ajoute pas, il le répète en
   * moins clair* — et ici il n'y a pas de nom à redire, seulement un chiffre.
   *
   * Or le projet a déjà la règle qu'il faut : **un chiffre porte la couleur de
   * sa nature**, rouge ce qu'on inflige et bleu ce qu'on encaisse. Les deux
   * teintes sont celles du cartouche, au pixel — *on ne colore pas, on
   * reprend* — et la position fait le reste, comme sur toute carte de combat
   * du genre.
   */
  attaque?: number
  defense?: number
}

/**
 * La largeur de la texture, en pixels.
 *
 * Une carte fait au plus ~350 px de large à l'écran (celle qu'on regarde de
 * près, sur un grand écran) : 768 garde de la marge pour la densité de pixels
 * et pour la perspective, sans peser inutilement.
 *
 * **LA MÉMOIRE COMPTE ICI PLUS QU'AILLEURS.** Une texture est stockée
 * décompressée sur le GPU : 1024 x 1434 en RGBA font près de 6 Mo, mipmaps en
 * plus, et il y en a une PAR CARTE de la main. Sur un téléphone, une carte qui
 * s'approche demande son niveau le plus détaillé, et c'est là que le budget
 * casse — d'où une carte qui noircit pendant qu'on la déplace et redevient
 * normale une fois reposée. À 768 le même jeu tient dans un peu plus de la
 * moitié.
 */
const LARGE = 768
const HAUT = Math.round(LARGE * 1.4)

/**
 * LE RAYON DES COINS D'UNE CARTE, en fraction de sa LARGEUR.
 *
 * Il vivait en dur dans le `roundRect` de la face ; la case vide et le slot
 * allumé doivent l'épouser, et *trois valeurs écrites chacune de leur côté se
 * désaccordent au premier réglage* — c'est déjà ce qui les avait laissées à
 * 5 % pour une carte à 3.
 */
export const RAYON_CARTE = 0.03

/**
 * LE RAYON DU CONTOUR SIMPLE — plus rond, et c'est le mode emoji seulement.
 *
 * Demandé par Keko : « on peut arrondir encore un peu les coins ». *Un emoji
 * est un carré très arrondi*, donc la carte qui le porte peut l'être un peu
 * plus que la plaque de métal du jeu d'extraction — où 3 % est le
 * `border-radius` du gabarit, réglé et validé.
 *
 * **ET LES TROIS SURFACES LE SUIVENT** : la face, le corps extrudé et le dos.
 * *La face seule laisserait voir aux coins le laiton d'un corps plus carré* —
 * le défaut que Keko avait déjà signalé une fois, « derrière une autre forme
 * dorée reste et est un angle droit » — et un dos plus carré que son corps
 * dépasserait de sa silhouette. D'où `rayonDe`, que les trois lisent :
 * ***trois endroits qui décriraient le même rayon se désaccorderaient au
 * premier réglage.***
 */
export const RAYON_SIMPLE = 0.055

/** Le rayon des coins de CETTE carte-ci. */
export function rayonDe(carte: CarteAPeindre): number {
  return carte.contour === 'simple' ? RAYON_SIMPLE : RAYON_CARTE
}

/**
 * CE QUE LA TOILE DU SLOT ALLUMÉ AJOUTE DE CHAQUE CÔTÉ, en fraction de la
 * largeur d'une carte — la place de sa lueur. Le plan en grandit d'autant, et
 * *le débord de la texture doit être EXACTEMENT celui du plan* : plus large
 * dans la texture, le tracé passerait sous la carte. Règle du contour des
 * cartes, repayée ici.
 */
export const DEBORD_SLOT = 0.08

/** Un centième de la largeur : l'unité du gabarit (le `cqw` du CSS). */
const U = LARGE / 100

/** La découpe de la coque, reprise telle quelle du gabarit. */
const DECOUPE: readonly [number, number][] = [
  [4, 0], [91, 1.5], [100, 8], [98, 92], [93, 98],
  [55, 99], [50, 100], [44, 99], [3, 97], [0, 88], [1, 5],
]

/**
 * LE CADRE D'UN TRÉSOR : un sertissage, pas une déchirure.
 *
 * Toutes les cartes du jeu portent la coque DÉCHIRÉE du gabarit — c'est la
 * signature du dessin. Le trésor, lui, porte un cadre FRANC à coins coupés,
 * la ferronnerie qu'on parle déjà sur la barre de vie, les cartouches et les
 * cadres des meubles.
 *
 * *Et ça dit quelque chose de vrai* : un trésor est sorti du donjon ENTIER,
 * là où les cartes que fabrique l'équipement en sont arrachées.
 *
 * **Le biseau se compte en largeurs de carte** — 6,5 % en x, donc 6,5 / 1,4 en
 * y — sinon il serait plus long en haut qu'à gauche et ne se lirait plus comme
 * un angle à 45°.
 *
 * **Et il s'arrête avant l'ORBE DU COÛT**, qui vit dans ce coin sur toute
 * carte : le disque approche le coin à 9 % de la largeur en diagonale, donc
 * une coupe à 6,5 passe dessous sans le mordre. *Un coin coupé qui tranche le
 * chiffre de coût ne serait pas un cadre, ce serait un défaut.*
 */
const CADRE_TRESOR: readonly [number, number][] = [
  [6.5, 0], [93.5, 0], [100, 4.64], [100, 95.36],
  [93.5, 100], [6.5, 100], [0, 95.36], [0, 4.64],
]

/**
 * TROIS CADRES À L'ESSAI POUR LA CARTE DE DECK — `?r3f&cadre=1|2|3`.
 *
 * Keko : « je voudrais que tu me proposes un nouveau cadre pour les cartes de
 * deck (celles générées par l'équipement) afin de bien les distinguer. »
 *
 * *Le principe ne change pas* : **une échelle se dit en couleur, une famille se
 * dit en forme** — la rareté a pris la couleur, donc le type prend la
 * silhouette. C'est déjà ce qui sépare le trésor du reste, et il ne restait
 * plus qu'à départager la PIÈCE d'équipement de la CARTE qu'elle produit.
 *
 * *Elles ne se regardent côte à côte qu'à un seul endroit* — le zoom d'une
 * pièce, où le set s'étale à sa droite — mais c'est là que la confusion se
 * paie, puisque c'est précisément là qu'on compare.
 *
 * Trois pistes, et chacune raconte autre chose :
 *
 * | | `cadre=` | ce que ça dit |
 * |---|---|---|
 * | **franc** | `1` | la carte est une IMAGE, pas un objet : plus de silhouette, un liseré régulier |
 * | **encoché** | `2` | une plaque qu'on CLIPSE : deux entailles au milieu des côtés |
 * | **crans** | `3` | une fiche qu'on TIRE : deux crans hauts, comme un onglet |
 *
 * **La pièce garde la coque déchirée**, et c'est voulu : *elle est le métal
 * brut dont les cartes sont arrachées*, donc c'est elle qui doit porter la
 * déchirure. Si Keko préfère l'inverse, il n'y a qu'à échanger les deux.
 */
const CADRE_FRANC: readonly [number, number][] = [
  [0, 0], [100, 0], [100, 100], [0, 100],
]

/**
 * LES ENCOCHES, À LA HAUTEUR DU TITRE — retenu par Keko, et recalé par lui :
 * « j'aime bien les encoches mais je les voudrais au niveau du titre ».
 *
 * *Le nom est peint à 66,5 % de la hauteur* (`yNom`), donc les deux entailles
 * s'y centrent : elles cessent d'être un accident au milieu du montant pour
 * devenir la ligne qui porte le nom. **Les deux repères se calculent depuis la
 * même constante**, sinon le premier réglage du gabarit les désaccorderait.
 */
const Y_ENCOCHE = 66.5
const CADRE_ENCOCHE: readonly [number, number][] = [
  [0, 0], [100, 0], [100, Y_ENCOCHE - 7], [95.5, Y_ENCOCHE], [100, Y_ENCOCHE + 7], [100, 100],
  [0, 100], [0, Y_ENCOCHE + 7], [4.5, Y_ENCOCHE], [0, Y_ENCOCHE - 7],
]

const CADRE_CRANS: readonly [number, number][] = [
  [0, 0], [100, 0], [100, 17], [94, 21.5], [100, 26], [100, 100],
  [0, 100], [0, 26], [6, 21.5], [0, 17],
]

/**
 * LE COIN CORNÉ : la coque DÉCHIRÉE, moins son coin haut-droit.
 *
 * *La pièce est une plaque, la carte est une feuille* — et rien ne dit
 * « feuille » comme un coin qui se relève. C'est le seul signe de cette liste
 * qui ne parle pas de ferronnerie, et c'est précisément ce qui le rend lisible :
 * il change la NATURE de l'objet, pas sa découpe.
 *
 * Le coin haut-DROIT, jamais le gauche : l'orbe du coût vit dans celui-là sur
 * toute carte du jeu, et *un rabat qui mange un chiffre de coût ne serait pas
 * un cadre, ce serait un défaut.*
 */
const CORNE = 17
const CADRE_CORNE: readonly [number, number][] = [
  [4, 0], [91 - CORNE, 1.2], [91, CORNE / 1.4], [98, 92], [93, 98],
  [55, 99], [50, 100], [44, 99], [3, 97], [0, 88], [1, 5],
]

/** Le rabat lui-même : le triangle qu'on vient de retirer, replié sur la face. */
const RABAT: readonly [number, number][] = [
  [91 - CORNE, 1.2], [91, CORNE / 1.4], [91 - CORNE * 0.42, CORNE / 1.4 + 1.5],
]

/**
 * LES PERFORATIONS : deux trous de reliure dans la bande haute.
 *
 * *Une carte de deck n'existe jamais seule* — elle vient en trois exemplaires,
 * elle se pioche, elle se défausse, elle se remélange. Deux trous disent
 * « fiche enfilée sur un anneau », donc « appartient à un paquet », ce qu'aucune
 * pièce d'équipement n'est.
 *
 * Ils vivent à DROITE de l'orbe, dans la bande qu'on voit encore quand la carte
 * est recouverte aux trois quarts par sa voisine.
 */
const PERFORATIONS: readonly (readonly [number, number, number])[] = [
  [62, 5.2, 2.5],
  [76, 5.2, 2.5],
]

/**
 * L'AJOUR : une fente traversante dans le montant droit.
 *
 * *Ce qui a été arraché laisse un trou.* La carte de deck est découpée DANS la
 * pièce — la note le dit déjà : « un trésor est sorti du donjon entier, là où
 * les cartes que fabrique l'équipement en sont arrachées » — et c'est la seule
 * piste qui le rende visible sur l'objet lui-même.
 *
 * Elle est verticale et longue, donc elle se lit même réduite : *une fente fine
 * survit à la réduction là où un motif s'empâte.*
 */
const AJOUR: readonly [number, number, number, number] = [96.4, 30, 1.8, 26]

export type PisteCadre = 'franc' | 'encoche' | 'crans' | 'corne' | 'perfore' | 'ajour'

/**
 * **L'ENCOCHÉ EST LE CADRE DES CARTES DE DECK, plus un essai.** Keko l'avait
 * retenu — « j'aime bien les encoches mais je les voudrais au niveau du titre
 * et avec la bordure un poil plus épaisse » — puis, en découvrant l'écran du
 * deck : « pourquoi on n'a plus [le] design des cartes de deck ? » *Il était
 * resté derrière son paramètre d'URL*, donc invisible dans le jeu.
 *
 * Les cinq autres pistes restent joignables pour comparer, et `?cadre=0` rend
 * la coque déchirée nue : *ce qui a servi à choisir doit rester ouvrable*, même
 * une fois le choix fait.
 *
 * Lue UNE fois : c'est un réglage de session, donc il ne change jamais en cours
 * de route et n'a pas à entrer dans `signature()`.
 */
const PISTE_CADRE: PisteCadre | null = (() => {
  const demande = new URLSearchParams(location.search).get('cadre')
  const pistes: Record<string, PisteCadre> = {
    '1': 'franc',
    '2': 'encoche',
    '3': 'crans',
    '4': 'corne',
    '5': 'perfore',
    '6': 'ajour',
  }
  if (demande === null) return 'encoche'
  return pistes[demande] ?? null
})()

/**
 * TROIS ÉPAISSEURS POUR LE CONTOUR SIMPLE — `?contour=fin|plaque|large`.
 *
 * *Une fois la forme réglée, c'est tout ce qui reste à décider*, et ça ne se
 * juge qu'à l'oeil : un trait fin laisse la carte à son illustration, un trait
 * large la cercle comme une vignette d'application. **Le défaut est le cran du
 * milieu**, un cheveu plus fin que la coque encochée qu'il remplace (1,85).
 *
 * En centièmes de largeur, comme tout le gabarit. Lue UNE fois : c'est un
 * réglage de session, donc elle n'a pas à entrer dans `signature()`.
 */
export type PisteContour = 'fin' | 'plaque' | 'large'
const CONTOURS: Record<PisteContour, number> = { fin: 0.85, plaque: 2.7, large: 3.1 }
const PISTE_CONTOUR: PisteContour = (() => {
  const demande = new URLSearchParams(location.search).get('contour')
  return demande === 'fin' || demande === 'large' ? demande : 'plaque'
})()

/**
 * LA PLAQUE DE TEXTE : où elle commence, et l'air qu'elle laisse au sujet.
 *
 * **Elle part juste au-dessus du nom**, peint à 66,5 % : il reste de quoi loger
 * ses capitales et un peu d'air. *Elle couvre donc les 38 % du bas* — la
 * proportion d'une carte de collection moderne, et c'est ce qui en fait une
 * carte plutôt qu'une image légendée.
 *
 * **L'AIR EST CE QUI RAPETISSE LE SUJET.** Keko : « on peut peut-être diminuer
 * un peu la taille de l'émoji ». *Il n'y avait rien à régler dans son dessin* —
 * l'emoji est peint sur une toile carrée et posé en `contain` dans la fenêtre
 * d'art, donc **c'est la fenêtre qui décide de sa taille.** Jusqu'ici elle
 * valait toute la surface : l'emoji descendait à 98 % de la hauteur, c'est-à-
 * dire SOUS le nom, son tiers inférieur noyé dans le dégradé. Borné au-dessus
 * de la plaque, il perd 19 % et gagne une marge nette de tous les côtés.
 *
 * *Et le BLOOM lit la même boîte*, comme il lit déjà le même rognage : **le
 * bloom n'est pas le sujet, c'est de la lumière tombée sur le décor** — cadré
 * autrement, il éclairerait sous la plaque.
 */
const HAUT_BULLE = 0.605
const AIR_SUJET = 7

/**
 * `?texte=sombre` rend le dégradé noir du gabarit.
 *
 * *Ce qui a servi à choisir doit rester ouvrable, même une fois le choix fait* —
 * et c'est aussi le seul moyen de revoir côte à côte ce que la plaque remplace.
 */
const PISTE_TEXTE: 'bulle' | 'sombre' =
  new URLSearchParams(location.search).get('texte') === 'sombre' ? 'sombre' : 'bulle'

/** Cette carte-ci porte-t-elle la plaque claire et la police ronde ? */
function enBulle(carte: CarteAPeindre): boolean {
  return carte.texte === 'bulle' && PISTE_TEXTE === 'bulle'
}

const SILHOUETTES: Partial<Record<PisteCadre, readonly [number, number][]>> = {
  franc: CADRE_FRANC,
  encoche: CADRE_ENCOCHE,
  crans: CADRE_CRANS,
  corne: CADRE_CORNE,
}

/**
 * LA PLACE DE L'ORBE DU COÛT, en un seul endroit.
 *
 * Elle servait à `peindreCout` seule ; le jonc du cadre de trésor doit
 * maintenant s'écarter d'elle, et *deux endroits qui décrivent la même place
 * se désaccordent au premier réglage.* La valeur d'un butin s'y cale aussi,
 * puisque les deux forment une ligne d'en-tête : **elle descend donc avec.**
 *
 * **ET SA MARGE HAUTE SE MESURE AU SOMMET DU SABLIER, pas au bord de la
 * toile.** Keko, après avoir redessiné `Cost.webp` : « avec le nouveau il
 * touche le haut de la carte, je voudrais le même écart qu'avec la gauche ».
 *
 * *Le dessin déborde du disque par le haut* — le petit sablier — alors qu'à
 * gauche c'est le disque nu qui affleure. Posés à marge de toile égale, les
 * deux écarts n'étaient donc pas les mêmes à l'oeil, et le sablier passait
 * carrément **sur** le laiton du cadre. C'est le même raisonnement que le
 * compteur des pièces, pris dans l'autre sens : *une marge se mesure au bord
 * qu'on VOIT.*
 *
 * Mesuré sur la texture, en unités de carte : le bord intérieur du cadre est à
 * 1,823 des deux côtés, le bord gauche du disque à **4,424** — donc un écart de
 * **2,601** — et le coefficient est celui qui pose le sommet du sablier là
 * aussi.
 *
 * *Il dépend donc du DESSIN, et il se remesure à chaque version* : marge haute
 * de 2,23 % de la toile → 0,0246 ; 4,03 % → 0,0198 ; 7,20 % → **0,018**. **Un
 * fichier qui rebouge le sablier le rouvre** — on relève les trois repères (le
 * bord du cadre, le bord gauche du sujet, le sommet du sablier) dans une sonde,
 * et rien d'autre ne change.
 */
const ORBE_L = 0.205 * LARGE
const ORBE_CX = 0.022 * LARGE + ORBE_L / 2
const ORBE_CY = 0.018 * HAUT + ORBE_L / 2

/** L'écusson du coût : pointe en bas, comme sur toute carte qui coûte. */
const ECUSSON: readonly [number, number][] = [
  [0, 0], [98, 5], [90, 68], [50, 100], [10, 76],
]

/**
 * CE QUI MARQUE UNE CARTE DE DECK, une fois la coque et l'illustration posées.
 *
 * *Toutes les cartes du jeu portent la coque déchirée — c'est la signature du
 * gabarit.* Trois de ces pistes la GARDENT donc et ajoutent un signe, plutôt
 * que d'inventer une quatrième silhouette : **un dessin tient mieux par ce
 * qu'il partage que par ce qu'il découpe.**
 *
 * Elle se pose APRÈS l'illustration et AVANT les textes, comme le second jonc
 * du trésor : *un trou n'a jamais à traverser un nom.*
 */
function marquerLaCarte(
  ctx: CanvasRenderingContext2D,
  piste: PisteCadre,
  rarete: string | undefined,
): void {
  // LE FOND QUI SE VOIT PAR LE TROU : le même laiton assombri que la plaque,
  // donc ce qui est percé montre l'épaisseur de la carte et non du vide.
  const fond = (): void => {
    ctx.fillStyle = laiton(ctx, rarete)
    ctx.fill()
    ctx.fillStyle = '#000000b0'
    ctx.fill()
  }

  if (piste === 'corne') {
    // LE RABAT : le triangle qu'on vient de retirer, replié sur la face. Il
    // prend le laiton en plus clair — *un pli montre l'envers, et l'envers
    // reçoit la lumière autrement* — et il porte son ombre vers l'intérieur,
    // sans quoi il se lirait comme un aplat collé.
    ctx.save()
    ctx.shadowColor = '#00000090'
    ctx.shadowOffsetX = -0.9 * U
    ctx.shadowOffsetY = 1.2 * U
    ctx.shadowBlur = 1.4 * U
    chemin(ctx, RABAT as readonly [number, number][], 0, 0, LARGE, HAUT)
    const pli = ctx.createLinearGradient(0.74 * LARGE, 0, 0.93 * LARGE, 0.14 * HAUT)
    pli.addColorStop(0, '#cbb98b')
    pli.addColorStop(1, '#6d6144')
    ctx.fillStyle = pli
    ctx.fill()
    ctx.restore()
    return
  }

  if (piste === 'perfore') {
    for (const [px, py, r] of PERFORATIONS) {
      ctx.beginPath()
      ctx.arc((px / 100) * LARGE, (py / 100) * HAUT, (r / 100) * LARGE, 0, Math.PI * 2)
      fond()
      // UN LISERÉ CLAIR EN BAS DU TROU : c'est ce qui lui donne son épaisseur.
      // *Un rond sombre sans lumière est une tache, pas un perçage.*
      ctx.strokeStyle = '#ffffff22'
      ctx.lineWidth = 0.4 * U
      ctx.stroke()
    }
    return
  }

  const [ax, ay, al, ah] = AJOUR
  ctx.beginPath()
  ctx.roundRect(
    (ax / 100) * LARGE - ((al / 100) * LARGE) / 2,
    (ay / 100) * HAUT,
    (al / 100) * LARGE,
    (ah / 100) * HAUT,
    (al / 100) * LARGE * 0.5,
  )
  fond()
  ctx.strokeStyle = '#ffffff26'
  ctx.lineWidth = 0.35 * U
  ctx.stroke()
}

function chemin(ctx: CanvasRenderingContext2D, points: readonly [number, number][], x: number, y: number, l: number, h: number): void {
  ctx.beginPath()
  points.forEach(([px, py], i) => {
    const cx = x + (px / 100) * l
    const cy = y + (py / 100) * h
    if (i === 0) ctx.moveTo(cx, cy)
    else ctx.lineTo(cx, cy)
  })
  ctx.closePath()
}

/**
 * LES CINQ MÉTAUX DE LA RARETÉ — **laiton, bronze, argent, or, diamant.**
 *
 * Tranché par Keko, qui a écarté sa propre première idée : « je pense que
 * c'est pas hyper cohérent d'utiliser les couleurs de rareté RPG classiques,
 * on peut tenter laiton / bronze / argent / or / diamant ? »
 *
 * *Et c'est exactement juste* : la carte de ce jeu EST une plaque de métal.
 * Un vert et un violet posés dessus restaient des couleurs de jeu vidéo
 * plaquées sur un objet ; une échelle d'alliages, elle, **est déjà dans la
 * matière** — la carte ne change pas de langue pour dire sa valeur, elle
 * change d'alliage. Le vocabulaire dit la règle, comme « enchantement »
 * plutôt que « maîtrise ».
 *
 * Chacun donne les cinq tons du même dégradé — clair, sombre, moyen, très
 * sombre, clair — **et c'est une seule structure de lumière pour cinq
 * teintes** : le cadre garde son relief, son reflet oblique et son bord
 * éclairé, il ne change que de métal. *Cinq dégradés écrits chacun de leur
 * côté auraient divergé au premier réglage.*
 *
 * Le COMMUN est le laiton du gabarit, au ton près : la carte ordinaire ne
 * bouge pas d'un pixel.
 *
 * **Le danger de cette échelle est que trois de ses crans sont jaunes.** Le
 * laiton reste donc terne et un peu olive, le bronze part dans le CUIVRE — plus
 * rouge, plus sombre — et l'or est franchement saturé et clair : ce qui les
 * sépare n'est pas la teinte seule, c'est la teinte ET la valeur. L'argent et
 * le diamant, eux, sont les deux froids, et le diamant se distingue en étant
 * **plus clair que tout le reste**, presque blanc.
 */
/**
 * LE LAITON A DISPARU DE L'ÉCHELLE, ET DES CARTES.
 *
 * Il a d'abord cessé d'être une rareté — Keko : « ça ajoute une rareté pour
 * rien et c'est pas très lisible en comparaison à l'or » — puis il a cessé
 * d'être le métal par défaut, une fois les trésors entrés dans l'échelle :
 * « on peut appliquer les couleurs de rareté aux trésors maintenant ? et on
 * laisse tomber le laiton ? »
 *
 * **Le premier cran est donc le BRONZE, et il vaut pour tout ce qui ne dit
 * rien** : les cartes de deck, le dos. *Un métal qui ne sert qu'à dire
 * « aucun rang » est un cran de plus à distinguer pour rien.*
 */
const METAUX: Record<string, readonly [string, string, string, string, string]> = {
  commune: ['#eab98d', '#8a512c', '#bd7f52', '#432516', '#dda379'],
  rare: ['#f4f7fa', '#8a949e', '#ccd5dd', '#4a525b', '#e4eaf0'],
  // L'OR EST POUSSÉ EN SATURATION, pas en clarté (Keko : « appuyer un peu
  // sur le doré pour bien le différencier du laiton »). *Le laiton est un
  // jaune ROMPU, l'or est un jaune PUR* : ce qui les sépare n'est pas leur
  // teinte — elles sont voisines — mais le gris qu'il y a dedans. Éclaircir
  // l'or l'aurait rapproché du laiton clair ; le saturer l'en éloigne.
  epique: ['#fff29a', '#b8820a', '#ffc61f', '#5c3a00', '#ffd45e'],
  legendaire: ['#ffffff', '#a9c8e0', '#e6f3fd', '#7192aa', '#f6fcff'],

  /**
   * LES CINQ COULEURS DU MODE EMOJI — **blanc, vert, bleu, violet, orange.**
   *
   * Tranché par Keko : « on va changer le système de rareté : commun, peu
   * commun, rare, épique, légendaire (blanc, vert, bleu, violet, orange) »,
   * puis « le mode emoji seulement » quand je lui ai demandé la portée.
   *
   * ***C'est l'échelle que le mode descente avait ÉCARTÉE***, et il faut le
   * savoir : « je pense que c'est pas hyper cohérent d'utiliser les couleurs
   * de rareté RPG classiques ». *L'argument d'alors tenait, et il ne porte pas
   * ici* — une carte de combat EST une plaque de métal, donc un violet posé
   * dessus restait une couleur de jeu vidéo plaquée sur un objet. **Une carte
   * d'emoji n'est pas un objet du monde** : elle ne se joue pas, elle se
   * collectionne, et le code couleur est la langue de ce genre-là.
   *
   * **LES CLÉS NOMMENT LA COULEUR, pas le cran**, à la différence des quatre
   * métaux. *Deux échelles cohabitent dans cette table*, et trois de leurs
   * crans portent le même nom (`rare`, `epique`, `legendaire`) : les nommer
   * par leur cran les aurait fait se recouvrir en silence. C'est `carte-emoji`
   * qui fait la table cran → couleur, telle que Keko l'a dictée.
   *
   * **Une seule structure de lumière pour cinq teintes**, comme pour les
   * métaux : clair en haut à gauche, plateau moyen, nuit dans le coin
   * bas-droit. *Le cadre garde son relief et son reflet oblique, il ne change
   * que de couleur* — cinq dégradés écrits chacun de leur côté auraient
   * divergé au premier réglage.
   *
   * Le BLANC est volontairement un gris clair et non un blanc pur : *le bas
   * d'une échelle ne doit pas se lire comme un métal précieux*, et le blanc
   * pur est déjà pris par le diamant de l'autre échelle.
   */
  blanc: ['#f2f4f6', '#878d94', '#c8ced4', '#42464b', '#e2e6ea'],
  vert: ['#c9f0cf', '#2f7a42', '#68c182', '#11341c', '#a4e2b1'],
  bleu: ['#c6e2ff', '#205b9e', '#5a9ede', '#0d2742', '#9fcdfa'],
  violet: ['#e0ccff', '#5c2f9e', '#9a6ddb', '#2a1346', '#c7a7f5'],
  orange: ['#ffe0b8', '#a85c12', '#ef9b3a', '#45220a', '#ffc277'],
}

/**
 * LA COULEUR DU REFLET, CRAN PAR CRAN — et le crème pour qui n'en a pas.
 *
 * Demandé par Keko : « ce serait bien que le reflet de lumière soit de la
 * couleur de la carte (blanc comme actuellement pour commun, vert pour uncommon
 * etc) ».
 *
 * ***Un reflet prend la couleur de ce qu'il touche***, et le jeu le disait déjà
 * pour l'or — « un effet qui rend la lumière un peu dorée quand on bouge la
 * carte ». Ce n'était qu'un cas : **c'est vrai de toute plaque colorée**, et
 * c'est ce qui sépare une plaque verte d'une plaque claire.
 *
 * **LES QUATRE TEINTES SONT DÉRIVÉES, PAS CHOISIES** : on prend le ton MOYEN du
 * métal — son plateau, le plus saturé des cinq — et on le pousse à une énergie
 * commune (1,05 de luminance, un cheveu au-dessus du crème). *Sans cette
 * normalisation un violet renverrait moins de lumière qu'un jaune à teinte
 * égale*, parce qu'une couleur saturée est sombre par construction.
 *
 * **ET LA MÉTHODE SE VALIDE SUR L'OR.** Appliquée à l'orange, elle rend
 * `(1,51 ; 0,98 ; 0,37)` — soit à deux centièmes près la lumière que Keko avait
 * réglée à la main pour l'or. *Deux chemins indépendants qui tombent au même
 * endroit disent que le chemin est bon.*
 *
 * **C'est une table À PART de `METAUX`, et ce n'est pas un doublon** : un métal
 * et la lumière qu'il renvoie sont deux faits — le premier est peint dans la
 * texture et plafonne à 1, le second est additif et monte au-delà. *Les lier
 * demanderait de normaliser à chaque image ce qui se calcule une fois.*
 *
 * **LE CRÈME RESTE LE DÉFAUT**, donc trois choses ne bougent pas d'un pixel :
 * le bas des deux échelles, le dos d'une carte — *une carte retournée ne dit
 * rien de ce qu'elle est* — et l'or, qui garde la valeur validée par Keko plutôt
 * que sa dérivée. **L'argent et le diamant n'en ont pas besoin** : le premier
 * est déjà un gris, le second décompose le reflet en arc-en-ciel.
 */
const TON_LUSTRE: Record<string, readonly [number, number, number]> = {
  epique: [1.5, 1.06, 0.42],
  vert: [0.64, 1.2, 0.81],
  bleu: [0.64, 1.12, 1.57],
  violet: [1.28, 0.9, 1.82],
  orange: [1.51, 0.98, 0.37],
}

/** Le crème chaud du lustre, pour tout ce qui n'a pas de teinte à renvoyer. */
export const TON_CREME: readonly [number, number, number] = [1, 0.95, 0.82]

/** La lumière qu'un cran renvoie. Voir {@link TON_LUSTRE}. */
export function tonDuLustre(rarete: string | undefined): readonly [number, number, number] {
  return TON_LUSTRE[rarete ?? ''] ?? TON_CREME
}

/**
 * LA PLAQUE CLAIRE PREND LA TEINTE DE SON CRAN — et les deux tons sont DÉRIVÉS.
 *
 * Keko : « je voudrais que l'encadré soit coloré en fonction de la rareté
 * également (blanc, vert, bleu etc) au lieu d'être blanc partout ».
 *
 * *C'est la méthode de `TON_LUSTRE`, reprise à l'autre bout de l'échelle* — « on
 * prend le ton MOYEN du métal, le plus saturé des cinq, et on le pousse à une
 * énergie commune ». Ici on garde sa TEINTE, on ramène son pigment à une
 * fraction, et **on recale sur une luminance commune.** Le calcul est celui de
 * `virerLeCiel`, à un pixel près : saturation dosée, teinte imposée, ClipColor.
 *
 * ***LA NORMALISATION EST CE QUI PROTÈGE LE TEXTE.*** Il est SOMBRE sur cette
 * plaque, donc son contraste dépend entièrement de la clarté du fond : sans
 * elle, un jaune clair et un violet sombre à pigment égal donneraient deux
 * lisibilités très différentes. Mesuré sur la texture peinte, le nom reste
 * entre **11,5 et 13,2** de contraste sur les cinq crans, et le cartouche
 * entre 5,9 et 6,8 — *contre 4,5 sur le blanc d'avant, qui était déjà au
 * plancher.*
 *
 * **ET LE PIGMENT A TRIPLÉ EN DEUX PASSES À L'ÉCRAN.** À 0,45 les chiffres
 * étaient impeccables et *on ne voyait rien* : le haut du dégradé restait quasi
 * blanc, donc l'oeil moyennait et lisait « blanc » sur les cinq crans. À 0,85
 * Keko les trouvait « toujours un peu pâles ». ***Un pastel qui ne se voit pas
 * ne dit pas son cran*** — il faut que le HAUT porte déjà sa couleur, pas
 * seulement le bas.
 *
 * ***ET C'EST LE MOT DU TYPE QUI BORNE, PAS LE CARTOUCHE.*** Mesuré sur les cinq
 * crans : à 0,85 il n'était qu'à **4,08** de contraste, donc déjà sous le
 * plancher de 4,5, et il perd 0,2 à chaque cran de pigment — *il tombe deux
 * fois plus vite que le cartouche.* **Renforcer la teinte demande donc de
 * foncer les deux textes**, et c'est ce qui rend le réglage gratuit : à 1,40 le
 * cartouche passe de 5,59 à **6,41** et le type de 4,08 à **4,77**, pour
 * **47 % de pigment en plus.** *La couleur se renforce et le texte y gagne.*
 *
 * ***MAIS LE PIGMENT NE FAIT RIEN À UNE TEINTE QUI SATURE — C'EST LA LUMINANCE
 * QUI COMMANDE.*** Keko, après ces 47 % : « les encadrés verts sont bien mais
 * les autres couleurs sont toujours fades ». *Et c'est exact, parce que ces
 * 47 % ne les avaient pas touchés d'un centième* : le chroma qui sort vaut
 * `(1 − L) × plein / hi`, et **le rapport `plein / hi` ne dépend que de la
 * TEINTE** — tout le pigment ajouté est mangé par le ClipColor. Ce qui avait
 * bougé, c'était la luminance (0,855 → 0,795), et elle profite à tous dans le
 * même rapport : **l'écart entre le vert et les autres n'avait donc pas été
 * réduit, il avait été creusé**, le vert gagnant EN PLUS sur le pigment parce
 * qu'il ne saturait pas encore.
 *
 * ***ET LE CHROMA LINÉAIRE N'EST PAS CE QUE L'OEIL LIT.*** Mesuré en CIELAB, le
 * vert et l'orange ont le MÊME écart au gris (0,54) pour **68,4 contre 47,6 de
 * C\*ab** ; le bleu en a plus que le violet (0,35 contre 0,27) et en paraît
 * moins coloré (26,4 contre 37,6). *Le vert est la teinte la plus lumineuse du
 * spectre* — il pèse 0,59 dans la luminance quand le bleu pèse 0,11 — donc
 * c'est le seul qui garde sa couleur posé haut en clarté. **Le critère est donc
 * le C\*ab, pas l'écart au gris.**
 *
 * **D'OÙ LA DESCENTE : chaque teinte perd de la clarté jusqu'à ce qu'elle
 * ATTEIGNE LE NIVEAU DU VERT**, et pas plus bas que ce que le texte supporte.
 *
 * ***ET LA CIBLE A DÛ ÊTRE LE CHROMA, PAS LE CLIP.*** Une première passe
 * descendait jusqu'à ce que le ClipColor cesse de ronger la teinte — `1 − hi`,
 * une formule fermée — et Keko l'a reprise : « je trouve les couleurs des
 * encadrés trop fades (sauf le vert qui est bien) ». **Il avait raison, et la
 * mesure dit pourquoi** : au terme de cette descente le bleu n'était qu'à 34 de
 * C\*ab contre 74 au vert — *le clip avait cessé de le ronger bien avant qu'il
 * ait une couleur.* « Ne plus être écrasé » n'est pas « être coloré ».
 *
 * La cible est donc le chroma du vert, **le seul cran que Keko ait validé**, et
 * ce qu'elle rend, mesuré : **bleu +84 %, violet +48 %, orange +16 %**, le
 * blanc immobile au pixel (il ne sature pas, donc il n'a rien à gagner — et
 * *le bas d'une échelle ne doit pas parler*) et le vert à un point de 255 près,
 * puisqu'il y était déjà.
 *
 * **CE QUI RESTE UN MUR EST PHYSIQUE, et il ne concerne plus que le bleu** :
 * même descendu à 0,31, il plafonne à 63 — au-delà, la clarté qu'on dépense ne
 * rend plus de couleur du tout. *Une teinte qui pèse 0,11 dans la luminance ne
 * peut pas être aussi colorée qu'un vert qui en pèse 0,59.*
 *
 * **ET LE PIGMENT SUIT LA SATURATION DU MÉTAL, il ne la force pas.** Le cran du
 * bas est un gris à peine bleuté — 0,047 d'écart au gris — donc *le forcer à
 * une saturation commune en ferait un bleu pâle*, qui entrerait en collision
 * avec le cran `bleu`. À pigment relatif il reste un gris, ce qui est exactement
 * ce que « blanc » doit dire.
 *
 * **LE DÉFAUT RESTE LA PLAQUE D'AVANT**, comme le crème pour le lustre : une
 * carte sans rang ne bouge pas d'un pixel. *Les quatre autres modes n'ont pas
 * de plaque aujourd'hui* — mais le jour où elle y arrive, c'est le bas de
 * l'échelle qui ne doit pas se mettre à parler.
 */
/**
 * LES TROIS ENCRES DE LA PLAQUE — **et elles foncent chaque fois que la teinte
 * se renforce.**
 *
 * *C'est la troisième passe*, et l'argument est le même que les deux
 * précédentes : **le pigment se paie sur le texte, et il le paie bien.** Une
 * plaque qui descend pour gagner de la couleur descend pour tous ses textes,
 * donc ils foncent avec elle — et comme ils foncent plus vite que leur fond,
 * *les trois finissent mieux lotis qu'avant sur les cinq crans*, de 10,2 à 13,7
 * pour le nom là où il était à 9,8 au mieux.
 *
 * **ELLES VIVENT ICI PARCE QUE LA DESCENTE LES LIT.** Le plancher de
 * `descenteDeLaPlaque` est le contraste du mot du type : *deux endroits qui
 * décriraient la même encre se désaccorderaient au premier réglage* — et celui
 * -là ne se verrait pas, il rendrait seulement la borne fausse.
 *
 * Mesuré sur le pire cran (le bleu, qui descend le plus) : **nom 5,6,
 * cartouche 5,2, type 5,1.**
 */
const NOM_BULLE = '#111920'
const CARTOUCHE_BULLE = '#16202a'
const TYPE_BULLE = '#0d141b'

// LA PLAQUE REDEVIENT UN BLANC LÉGÈREMENT TEINTÉ. Keko, une fois le décor
// passé à la nuit du cran : « on peut éclaircir les encadrés là où il y a le
// texte, pour qu'il soit blanc légèrement teinté ? » *Le cran se lit désormais
// sur toute la carte* — cadre, rayons, décor — donc la plaque n'a plus à le
// crier : elle redevient la surface claire qui porte le texte. Pigment divisé
// par trois, clarté remontée, et la descente vers le chroma du vert ne mord
// presque plus (voir CHROMA_PLAQUE). Les trois passes de pigment d'avant sont
// dans git log, avec leurs mesures.
const PIGMENT_PLAQUE = [0.45, 0.55, 0.6] as const
const LUM_PLAQUE = [0.94, 0.88, 0.85] as const
const PLAQUE_CLAIRE = ['#fdfefe', '#eaeef4', '#dde4ec'] as const
/**
 * La part de couleur du cran dans la pastille du type, le reste est blanc.
 * **Le blanc prend son ton moyen entier** : à 0,42 il sortait à `#e8ebed` sur
 * une plaque à `#dde4ec` — Keko : « pour le common, on peut griser un peu la
 * bulle, elle est trop claire, on la distingue mal du fond ». *Un gris mêlé de
 * blanc n'est plus un gris*, là où une couleur mêlée de blanc reste un teint.
 */
const TEINT_PASTILLE: Record<string, number> = { blanc: 1 }
const TEINT_PASTILLE_DEFAUT = 0.42
/**
 * DE COMBIEN LE DÉCOR D'UNE CARTE REMONTE DE LA NUIT VERS LE TON MOYEN DU
 * CRAN. Keko : « on peut éclaircir un peu les fonds des cartes (derrière les
 * illustrations) ? » *On ne pose pas de voile clair* — on part d'une base un
 * peu moins nocturne, et le dégradé, le vignettage et le grain restent ceux
 * de `peindreDecor`.
 */
const ECLAIRCIE_DECOR = 0.22
/**
 * **ET LE COMMUN NE REMONTE PAS.** Keko : « je trouve les fonds des cartes
 * common trop éclaircis comparés aux autres ». *Sa nuit est déjà un gris
 * moyen* (`#42464b`), là où les quatre autres partent d'une nuit franche : la
 * même part le menait deux fois plus haut. Il garde donc sa nuit telle quelle.
 */
const ECLAIRCIE_PAR_CRAN: Record<string, number> = { blanc: 0 }

/** Le mélange sRGB de deux couleurs, `part` de la première. */
function melange(a: string, b: string, part: number): string {
  const ca = couleurDe(a)
  const cb = couleurDe(b)
  const c = ca.map((v, i) => Math.round(v * part + cb[i]! * (1 - part)))
  return `#${c.map((v) => v.toString(16).padStart(2, '0')).join('')}`
}
/**
 * JUSQU'OÙ UNE PLAQUE PEUT S'ASSOMBRIR — **et c'est le TEXTE qui le dit, en
 * contraste et pas en clarté.**
 *
 * La descente était bornée par un chiffre de luminance (0,065), *donc par un
 * proxy* : à teinte égale, deux plaques de même luminance de composition ne
 * donnent pas le même contraste, puisque l'oeil ne pèse pas les trois canaux
 * comme le ClipColor. **La borne est maintenant le contraste lui-même**, sur
 * le couple le plus fragile : *le mot du type sur sa pastille*, qui est à la
 * fois le plus petit texte de la carte et son fond le plus sombre.
 *
 * **5 et non 4,5**, qui est le plancher AA : le mot du type fait 4 U, et *un
 * texte posé pile sur un plancher n'a aucune marge le jour où la police
 * change.* Mesuré, il n'est de toute façon pas ce qui arrête les crans
 * aujourd'hui — c'est le rendement, voir `GAIN_PLAQUE`.
 */
const PLANCHER_PLAQUE = 5

/**
 * LE NIVEAU DE COULEUR À ATTEINDRE, en C\*ab — **et il est MESURÉ SUR LE
 * VERT.**
 *
 * Keko : « je trouve les couleurs des encadrés de textes trop fades (sauf le
 * vert qui est bien) ». *Le vert est donc le seul cran validé*, et ce qu'il
 * vaut est 74 de chroma : **la cible n'est pas choisie, elle est relevée.**
 *
 * *Elle est un PLAFOND et non un plancher* : un cran qui l'atteint s'arrête là
 * — une plaque plus colorée que celle que Keko a validée sortirait du registre
 * « zone de texte à fond clair » sans qu'il l'ait demandé. **À remesurer si le
 * vert change** : c'est lui qui la porte.
 */
const CHROMA_PLAQUE = 18

/**
 * CE QU'UN PAS DE CLARTÉ DOIT RENDRE DE COULEUR POUR VALOIR LA PEINE.
 *
 * ***C'est ce qui arrête l'orange en haut de sa course et le blanc avant son
 * premier pas.*** Au-delà d'un certain point, descendre ne rend plus rien —
 * l'orange plafonne à 82 et REDESCEND, le gris du premier cran n'a jamais rien
 * à gagner. *Une clarté qu'on dépense doit rendre de la couleur*, sinon on
 * assombrit une plaque pour rien.
 */
const GAIN_PLAQUE = 0.15

/** La luminance de COMPOSITION — celle du ClipColor, pas celle du WCAG. */
function lumDeComposition(t: number[]): number {
  return 0.3 * t[0]! + 0.59 * t[1]! + 0.11 * t[2]!
}

/** Les trois canaux d'un `#rrggbb`, en [0,1]. */
function canaux(c: string): number[] {
  return [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16) / 255)
}

/** sRGB -> linéaire, le seul endroit où la courbe de l'écran compte. */
function lineaire(x: number): number {
  return x <= 0.04045 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4)
}

/**
 * LA LUMINANCE RELATIVE — celle du contraste, et c'est elle qui borne.
 *
 * *À ne pas confondre avec la luminance de composition juste au-dessus* : la
 * première dit ce que l'oeil reçoit (donc la lisibilité d'un texte), la seconde
 * ce que le ClipColor conserve (donc la teinte). **Les deux sont nécessaires et
 * aucune ne remplace l'autre.**
 */
function lumRelative(c: string): number {
  const t = canaux(c).map(lineaire)
  return 0.2126 * t[0]! + 0.7152 * t[1]! + 0.0722 * t[2]!
}

/**
 * LE CHROMA CIELAB D'UNE COULEUR — **et c'est le seul critère qui dise ce que
 * l'oeil lit.**
 *
 * Le chroma linéaire ne le dit pas : *le vert et l'orange ont le même écart au
 * gris pour 30 % de couleur d'écart*, et le bleu en a plus que le violet tout
 * en paraissant moins coloré. Le vert pèse 0,59 dans la luminance quand le bleu
 * pèse 0,11, donc c'est le seul qui garde sa couleur posé haut en clarté.
 *
 * **Il se calcule à l'exécution, et ça ne coûte rien** : cinq crans, mémorisés
 * dans `PLAQUES`, une poignée de pas chacun. *Un critère juste calculé cinq
 * fois par session vaut mieux qu'un proxy qui tient dans une formule fermée.*
 */
function chromaDeLab(c: string): number {
  const t = canaux(c).map(lineaire)
  const f = (v: number): number => (v > 216 / 24389 ? Math.cbrt(v) : (841 / 108) * v + 4 / 29)
  const x = f((0.4124 * t[0]! + 0.3576 * t[1]! + 0.1805 * t[2]!) / 0.95047)
  const y = f(0.2126 * t[0]! + 0.7152 * t[1]! + 0.0722 * t[2]!)
  const z = f((0.0193 * t[0]! + 0.1192 * t[1]! + 0.9505 * t[2]!) / 1.08883)
  return Math.hypot(500 * (x - y), 200 * (y - z))
}

/**
 * La teinte PURE d'un métal — sa saturation portée à 1 — et son pigment dosé.
 *
 * **LE PIGMENT PEUT DÉPASSER 1, LA SATURATION NON.** Au-delà, la teinte
 * sortirait de [0,1] AVANT le ClipColor, qui la ramènerait **en la déformant** :
 * un orange sursaturé virerait de teinte au lieu de saturer. *Une borne qui ne
 * mord que sur les crans les plus francs les protège tous.*
 *
 * Elle est partagée par le ton et par la descente, parce que les deux lisent le
 * même `hi` : *deux endroits qui décriraient la même teinte se désaccorderaient
 * au premier réglage.*
 */
function teinteDuMetal(metal: string, pigment: number): { pur: number[]; sat: number } {
  const c = [1, 3, 5].map((i) => parseInt(metal.slice(i, i + 2), 16) / 255)
  const bas = Math.min(...c)
  const haut = Math.max(...c)
  return {
    pur: haut > bas ? c.map((x) => (x - bas) / (haut - bas)) : [0.5, 0.5, 0.5],
    sat: Math.min(1, (haut - bas) * pigment),
  }
}

/**
 * DE COMBIEN CE CRAN DOIT DESCENDRE POUR QUE SA COULEUR SE VOIE.
 *
 * **DEUX DESCENTES, ET ELLES NE PAIENT PAS LA MÊME CHOSE.** La première retire
 * ce que le ClipColor rongeait, la seconde ACHÈTE de la couleur :
 *
 * - *le clip écrase la teinte tant que `L + hi > 1`*, donc la clarté juste
 *   suffisante est `1 − hi` — **une formule fermée**, et elle rend ZÉRO pour un
 *   cran qui ne sature pas. **C'est elle qui tient le gris du premier barreau
 *   immobile** : il ne sature pas, donc le clip ne le ronge pas, donc il n'a
 *   rien à récupérer. *Le bas d'une échelle ne doit pas parler*, et c'est
 *   l'arithmétique qui le dit, pas une exception écrite à la main ;
 * - **au-delà, il n'y a plus de formule** : le chroma perçu ne se déduit pas de
 *   la luminance, il se MESURE (`chromaDeLab`). On descend donc par petits pas,
 *   et trois choses peuvent arrêter la course — *chacune pour sa raison* : la
 *   cible du vert (`CHROMA_PLAQUE`), le rendement nul (`GAIN_PLAQUE`), et le
 *   contraste du mot du type (`PLANCHER_PLAQUE`).
 *
 * ***C'EST LA SECONDE QUI RÉPOND À KEKO***, et la mesure dit pourquoi la
 * première ne pouvait pas : à son terme, le bleu n'était qu'à 34 de C\*ab
 * contre 74 au vert — *le clip avait cessé de le ronger bien avant qu'il ait
 * une couleur.*
 *
 * **Le pas de 0,005 est un pas de MESURE**, pas un réglage : cinq crans fois
 * une soixantaine de pas, mémorisés dans `PLAQUES`, et rien ne le refait de la
 * session.
 */
function descenteDeLaPlaque(metal: string): number {
  const { pur, sat } = teinteDuMetal(metal, PIGMENT_PLAQUE[1])
  // CE CRAN SATURE-T-IL ? Le clip mord tant que `L + hi > 1`, donc un cran dont
  // le `hi` ne porte même pas jusqu'à la luminance de la plaque n'est pas
  // rongé : *il n'a rien à récupérer, et aucune clarté dépensée ne lui rendra
  // de la couleur.* **C'est ce qui tient le gris du premier barreau immobile**,
  // par l'arithmétique et non par une exception écrite à la main.
  const ecartHaut = (Math.max(...pur) - lumDeComposition(pur)) * sat
  if (LUM_PLAQUE[1]! - (1 - ecartHaut) <= 0) return 0
  // CE QUE LE TEXTE SUPPORTE, en luminance relative de la PASTILLE — le couple
  // le plus fragile de la carte. *On compare des contrastes, donc on borne la
  // grandeur qui les porte*, une fois pour toutes plutôt qu'à chaque pas.
  const plancher = PLANCHER_PLAQUE * (lumRelative(TYPE_BULLE) + 0.05) - 0.05
  let d = 0
  let chroma = chromaDeLab(tonDeLaPlaque(metal, PIGMENT_PLAQUE[1], LUM_PLAQUE[1]!))
  while (chroma < CHROMA_PLAQUE) {
    const essai = d + 0.005
    if (lumRelative(tonDeLaPlaque(metal, PIGMENT_PLAQUE[2]!, LUM_PLAQUE[2]! - essai)) < plancher) break
    const rendu = chromaDeLab(tonDeLaPlaque(metal, PIGMENT_PLAQUE[1]!, LUM_PLAQUE[1]! - essai))
    if (rendu - chroma < GAIN_PLAQUE) break
    d = essai
    chroma = rendu
  }
  return d
}

/**
 * Un ton de plaque : la teinte du métal, dosée, à la luminance voulue.
 *
 * La forme est celle de `virerLeCiel` — *même formule, un seul pixel* — donc
 * **de l'arithmétique et rien d'autre** : les modes de fusion non séparables du
 * canvas (`hue`, `saturation`, `color`) sont silencieusement ignorés sur
 * certains appareils, et une dégradation muette vaut moins qu'un chemin qui
 * marche partout.
 */
function tonDeLaPlaque(metal: string, pigment: number, cible: number): string {
  const { pur: u, sat } = teinteDuMetal(metal, pigment)
  const ecart = cible - sat * lumDeComposition(u)
  let t = u.map((x) => x * sat + ecart)
  // ClipColor : une teinte portée à une luminance donnée peut sortir de [0,1].
  // **Les deux passes sont nécessaires** — ramener les négatifs peut faire
  // dépasser 1 — et on ramène vers la luminance, qui est ce qu'on garde.
  const vers = (borne: number, val: number): void => {
    const l = lumDeComposition(t)
    if (Math.abs(val - l) > 1e-6) {
      const k = (borne - l) / (val - l)
      t = t.map((x) => l + (x - l) * k)
    }
  }
  if (Math.min(...t) < 0) vers(0, Math.min(...t))
  if (Math.max(...t) > 1) vers(1, Math.max(...t))
  return (
    '#' +
    t
      .map((x) =>
        Math.round(Math.max(0, Math.min(1, x)) * 255)
          .toString(16)
          .padStart(2, '0'),
      )
      .join('')
  )
}

/**
 * Les trois tons de la plaque, mémorisés par cran : le haut du dégradé, son
 * bas, et **la pastille du type**.
 *
 * ***LA PASTILLE EST DE LA PLAQUE, PAS UNE PIÈCE POSÉE DESSUS.*** Elle était
 * d'un gris fixe, un cran sous le blanc — donc sur une plaque teintée elle
 * ressortait **plus claire que son fond**, c'est-à-dire en relief là où elle
 * doit être un creux, et grise au milieu d'un vert. *Un badge qui ne parle pas
 * la langue de ce qui le porte se lit comme un calque mal posé*, la règle déjà
 * tenue par l'opacité de cette même plaque.
 *
 * **Elle garde son écart de luminance** (0,042 sous le bas du dégradé), qui est
 * exactement celui du gris d'avant : *ce qui la distingue est sa profondeur,
 * pas sa couleur.*
 */
const PLAQUES = new Map<string, readonly [string, string, string]>()

// LA PLAQUE EST BLANCHE, QUEL QUE SOIT LE CRAN. Keko, après le blanc teinté :
// « on peut essayer carrément en blanc ? » *C'est la plaque de la carte sans
// rang* (PLAQUE_CLAIRE), posée sur les cinq crans : le cran se lit au cadre,
// aux rayons et au décor. `?plaque=cran` rend la teinte dérivée du métal —
// *ce qui a servi à choisir doit rester ouvrable.*
const PLAQUE_BLANCHE =
  typeof location === 'undefined' || new URLSearchParams(location.search).get('plaque') !== 'cran'

function tonsDeLaPlaque(rarete: string | undefined): readonly [string, string, string] {
  const cran = rarete ?? ''
  const metal = METAUX[cran]
  if (metal === undefined || PLAQUE_BLANCHE) return PLAQUE_CLAIRE
  const garde = PLAQUES.get(cran)
  if (garde !== undefined) return garde
  // UN SEUL DÉCALAGE POUR LES TROIS NIVEAUX, et il se calcule sur celui du BAS.
  // Appliqué niveau par niveau, chacun descendrait jusqu'à son propre plancher
  // et le dégradé s'écraserait en un aplat : *ce qui doit se conserver, c'est
  // l'écart entre les trois.*
  const d = descenteDeLaPlaque(metal[2])
  const tons: readonly [string, string, string] = [
    tonDeLaPlaque(metal[2], PIGMENT_PLAQUE[0], LUM_PLAQUE[0] - d),
    tonDeLaPlaque(metal[2], PIGMENT_PLAQUE[1], LUM_PLAQUE[1] - d),
    tonDeLaPlaque(metal[2], PIGMENT_PLAQUE[2], LUM_PLAQUE[2] - d),
  ]
  PLAQUES.set(cran, tons)
  return tons
}

/**
 * CE QU'UNE RARETÉ FAIT RAYONNER — rien, l'or, ou l'arc-en-ciel.
 *
 * *Les trois comportements se lisaient sur une ÉGALITÉ DE CHAÎNE* —
 * `rarete === 'legendaire'` pour l'irisation, `=== 'epique'` pour le lustre
 * doré — et c'était tenable tant qu'il n'y avait qu'une échelle. **Avec les
 * cinq couleurs, un `legendaire` orange se serait mis à irriser** et un
 * `epique` violet à reluire comme de l'or, alors que Keko n'a demandé ni l'un
 * ni l'autre : chez lui l'éclat est un BONUS, pas un cran.
 *
 * La table le dit donc à un seul endroit, et les cinq couleurs n'y ont aucune
 * entrée : *ce qui ne rayonne pas n'a rien à déclarer.*
 */
export const ECLAT_DE_LA_RARETE: Readonly<Record<string, 'or' | 'iris'>> = {
  epique: 'or',
  legendaire: 'iris',
}

/**
 * L'ÉCLAT D'UN CRAN — et l'holographique n'en est pas un.
 *
 * **IL NE LIT QUE LA RARETÉ.** Il a porté un drapeau `holo` le temps d'un
 * commit, et c'est Keko qui l'a repris : « holographique ne doit pas changer la
 * couleur de la carte, on rajoute l'effet holographique par-dessus ».
 *
 * *Et il avait raison sur ce que ça coûtait, parce qu'un éclat n'est pas une
 * couche mais TROIS* : le foil posé sur le métal, **le liseré du cadre** et
 * **l'auréole**. Les deux dernières ne se posent pas par-dessus la carte, elles
 * PEIGNENT l'endroit même où le cran se lit — donc une holo commune et une holo
 * épique se retrouvaient cerclées du même arc-en-ciel, et **le bonus effaçait le
 * cran qu'il était censé décorer.**
 *
 * L'holographique ne garde donc que le FOIL, la seule des trois qui soit
 * vraiment une feuille posée dessus. C'est `Carte3D` qui cumule les deux.
 */
export function eclatDe(rarete: string | undefined): 'or' | 'iris' | null {
  return ECLAT_DE_LA_RARETE[rarete ?? ''] ?? null
}

/**
 * L'ÉCHELLE DES MÉTAUX, DU BAS VERS LE HAUT.
 *
 * *Elle existe parce qu'un reveal la REMONTE* : le compteur de la dernière
 * carte fait défiler les crans dans l'ordre et s'arrête sur le bon. **Une
 * échelle qu'on parcourt a besoin d'être écrite comme une échelle**, pas comme
 * une table indexée par nom.
 */
export const ECHELLE_METAL = ['commune', 'rare', 'epique', 'legendaire'] as const

/** La même échelle, pour les cinq couleurs du mode emoji. */
export const ECHELLE_COULEUR = ['blanc', 'vert', 'bleu', 'violet', 'orange'] as const

/**
 * LA LUEUR D'AMBIANCE D'UNE RARETÉ — de quoi un reveal teinte TOUT L'ÉCRAN.
 *
 * *C'est une table à part de `METAL_3D`, et il le faut* : celle-là peint une
 * tranche de deux millimètres sur une carte éclairée, celle-ci doit se lire en
 * halo sur une pierre presque noire. **À la même valeur, l'argent du cadre et
 * le diamant du cadre sont indiscernables en halo** — ils ne sont séparés que
 * par leur pigment, et un pigment ne survit pas à la diffusion.
 *
 * Elles vivent donc côte à côte, pour qu'on ne puisse pas en régler une en
 * oubliant l'autre : *deux endroits qui décrivent la même rareté se
 * désaccordent au premier réglage.*
 */
export const AMBIANCE: Record<string, string> = {
  // Le cuivre du bronze, assez chaud pour ne pas se lire comme un brun sale.
  commune: '#c97b3c',
  // L'argent perd son bleu ici : en halo il virerait au diamant.
  rare: '#aab8c4',
  epique: '#ffc61f',
  // LE DIAMANT EST FRANCHEMENT CYAN, là où son cadre n'est qu'un blanc bleuté.
  // *Le haut d'une échelle doit se voir de loin*, et c'est le seul cran dont
  // l'arrivée doit faire lever la tête.
  legendaire: '#6fe9ff',

  // LES CINQ COULEURS, saturées d'un cran : *un pigment ne survit pas à la
  // diffusion*, donc un halo doit crier un peu plus que le cadre qu'il annonce.
  blanc: '#dfe6ee',
  vert: '#4fd97a',
  bleu: '#4fa3ff',
  violet: '#b36bff',
  orange: '#ff9a2e',
}

/** La couleur du CORPS en 3D — la tranche et le cheveu de cadre qui déborde. */
export const METAL_3D: Record<string, string> = {
  commune: '#9c6237',
  rare: '#c3ccd4',
  epique: '#f2b81a',
  // LA TRANCHE SUIT LE CADRE : bleutée comme lui, sinon l'épaisseur trahirait
  // l'argent dès que la carte s'incline.
  legendaire: '#a6d3ff',

  // LA TRANCHE SUIT LE CADRE ici aussi : un cheveu plus sombre que le plateau,
  // puisqu'elle est vue de côté.
  blanc: '#cfd5db',
  vert: '#4f9e63',
  bleu: '#3f7fbf',
  violet: '#7d4fb8',
  orange: '#d8821f',
}



/**
 * LE DIAMANT EST IRISÉ, et c'est ce qui le sépare de l'argent.
 *
 * Keko : « je trouve que le diamant est exactement comme l'argent
 * visuellement, je propose de lui rajouter un côté holographique ». *Deux
 * métaux froids et clairs ne se distinguent pas par leur clarté* — il en
 * faudrait un blanc et un plus blanc, ce qui n'existe pas. Ce qui les sépare,
 * c'est que l'un a UNE couleur et l'autre les a TOUTES.
 *
 * Le dégradé garde donc exactement la même structure de lumière que les quatre
 * autres — clair, sombre, moyen, nuit, bord, aux mêmes offsets — mais chaque
 * palier prend une teinte différente du spectre. *Une irisation n'est pas une
 * couleur de plus, c'est un arc-en-ciel qui traverse la même lumière.*
 */
/**
 * **ET ELLE EST BLEUTÉE D'UN CRAN DE PLUS.** Keko : « on peut bleuter un peu
 * plus le cadre des cartes diamant ? le cadre est encore un peu trop proche de
 * l'argent ».
 *
 * *L'argent est un gris BLEUTÉ* (`#ccd5dd` au plateau), donc un diamant dont
 * les paliers neutres restent proches du blanc lui ressemble par ses trois
 * quarts — l'irisation ne le sépare que là où elle est franche. Chaque palier
 * descend donc vers le cyan et le bleu, **et gagne en saturation** : *ce qui
 * distingue deux métaux froids n'est pas leur clarté, c'est le pigment qu'il y
 * a dedans.*
 *
 * **L'accent chaud reste**, un seul, et plus pâle qu'avant : un arc-en-ciel
 * dont on retire le jaune n'est plus un arc-en-ciel, c'est un bleu. *C'est lui
 * qui empêche l'irisation de se lire comme une teinte unique* — et il suffit
 * qu'il passe une fois dans la course pour qu'on voie le spectre.
 */
const IRISATION: readonly (readonly [number, string])[] = [
  [0, '#e4f4ff'],
  [0.11, '#4fd3ff'],
  [0.21, '#2f56b0'],
  [0.23, '#8fcdff'],
  [0.32, '#d98aff'],
  [0.43, '#a8f2ff'],
  [0.53, '#fff0b4'],
  [0.66, '#7d7bff'],
  [0.8, '#1f4c8c'],
  [0.9, '#7ad8ff'],
  [1, '#d2ecff'],
]

/**
 * LE CONTOUR SIMPLE : trois tons voisins, sur la VERTICALE.
 *
 * **Ce qui fait « métal », c'est l'OBLIQUE et l'ÉCART.** Le laiton court sur la
 * diagonale et traverse cinq paliers, du clair au presque noir — donc son cadre
 * change franchement de luminosité d'un coin à l'autre, et c'est précisément ce
 * qui le fait lire comme une surface qui accroche la lumière. *Un emoji
 * n'accroche rien* : il a un aplat et, au mieux, un peu de volume.
 *
 * Trois arrêts voisins pris dans le MÊME métal — `bord`, `moyen`, `sombre` —
 * donc **on n'invente aucune couleur** : c'est la teinte du cran, posée à plat,
 * avec la lumière du haut que tout le jeu respecte. Le ton `moyen` est le
 * plateau, le plus saturé des cinq : *c'est déjà lui que `TON_LUSTRE` prend
 * pour dire la couleur d'un cran.*
 */
/**
 * LES RAYONS EN ÉVENTAIL DERRIÈRE L'EMOJI — le vocabulaire des cartes à
 * collectionner, dans la teinte du cran et dosés par la rareté.
 *
 * Keko, sur le fond de la fenêtre d'art : « tu aurais des idées ? », puis
 * « essayons le 2 » — des rayons, parmi six pistes. *La règle qui tient la
 * carte ne bouge pas* : **une échelle se dit en couleur**, donc les rayons
 * prennent le ton du cran (le plateau moyen de `METAUX`, celui que le lustre
 * et la plaque lisent déjà) — et ils parlent d'autant plus fort que le cran
 * est haut (`FORCE_RAYONS`). *Le bas de l'échelle ne doit pas parler* : le
 * blanc n'en a presque pas.
 *
 * Ils partent du CENTRE DU SUJET et s'éteignent vers les bords de la fenêtre :
 * *un rayon qui va jusqu'au cadre est un motif, un rayon qui meurt est une
 * lumière.* Seize rayons alternés, un peu tournés pour qu'aucun ne tombe sur
 * un axe, ajoutés en `lighter` comme les confettis du dos — *une couleur peu
 * opaque posée sur un fond sombre se salit, ajoutée elle éclaire.*
 *
 * `?rayons=0` les retire : *ce qui a servi à choisir doit rester ouvrable.*
 */
const NB_RAYONS = 16
const FORCE_RAYONS: Record<string, number> = {
  // LE BLANC EST REMONTÉ au niveau du vert. Keko : « on peut augmenter le
  // contraste des fonds des cartes common ? les rayons clairs ne le sont pas
  // assez ». *À 0,05 ils se devinaient sur un gris moyen*, là où les quatre
  // autres se lisent sur une nuit franche ; le bas de l'échelle parle peu,
  // mais il doit encore se lire.
  blanc: 0.14,
  vert: 0.13,
  bleu: 0.17,
  violet: 0.22,
  orange: 0.28,
}
/** L'opacité des touches dans la fenêtre d'art, et leur échelle par rapport à celles du dos. */
const TOUCHES_CARTE = 0.09
const TOUCHES_ECHELLE = 0.8
/** Les touches ne s'affichent plus par défaut — Keko : « pas terrible finalement » ; `?touches=1` les rend. */
const SANS_TOUCHES =
  typeof location === 'undefined' || new URLSearchParams(location.search).get('touches') !== '1'
/** `?decor=bleu` : le bleu nuit commun derrière l'emoji, au lieu de la nuit du cran. */
const DECOR_BLEU =
  typeof location !== 'undefined' && new URLSearchParams(location.search).get('decor') === 'bleu'
const SANS_RAYONS =
  typeof location !== 'undefined' && new URLSearchParams(location.search).get('rayons') === '0'
/**
 * LA LUEUR DU SUJET NE SE PEINT PLUS EN MODE EMOJI. Keko : « j'ai l'impression
 * qu'il y a un halo lumineux autour des emojis non ? on peut essayer sans ? »
 * *Le bloom avait été réglé pour des illustrations détourées aux bords doux* ;
 * un emoji est un aplat net, et sa lueur se lit comme un halo posé autour.
 * `?lueur=1` la rend — *ce qui a servi à choisir doit rester ouvrable.* Les
 * autres modes ne changent pas d'un pixel.
 */
const AVEC_LUEUR_EMOJI =
  typeof location !== 'undefined' && new URLSearchParams(location.search).get('lueur') === '1'

/**
 * LE MASQUE DU SUJET : la carte entière en blanc, la silhouette de
 * l'illustration découpée dedans, à sa place. Keko : « pour les faisceaux
 * derrière l'emoji, on pourrait rendre brillants les faisceaux clairs (et
 * laisser tels quels les foncés) ? »
 *
 * *Les rayons, le nuanceur sait les retrouver* — seize secteurs alternés, même
 * centre, même départ, même fondu (`RAYONS_DANS_LA_CARTE`). **Ce qu'il ne sait
 * pas, c'est où est l'emoji** : sans ce masque, la brillance passerait sur le
 * sticker posé devant les rayons. Il est petit (96 de large) — *un masque
 * filtré à la lecture n'a pas besoin de la finesse de ce qu'il découpe* — et il
 * est peint par le MÊME `couvrir`, aux mêmes coordonnées : *deux dessins qui
 * décrivent la même chose divergent au premier réglage.*
 */
const MASQUES_DU_SUJET = new WeakMap<HTMLCanvasElement, HTMLCanvasElement>()
export function masqueDuSujetDe(canvas: HTMLCanvasElement): HTMLCanvasElement | undefined {
  return MASQUES_DU_SUJET.get(canvas)
}
function masqueDuSujet(
  image: HTMLImageElement | HTMLCanvasElement | null,
  marge: number,
  aY: number,
  aH: number,
  rognage: number,
  /** La toile à repeindre, pour l'animé : elle garde sa texture. */
  dans?: HTMLCanvasElement,
): HTMLCanvasElement {
  const m = dans ?? document.createElement('canvas')
  // Redonner sa largeur remet aussi le contexte à zéro (échelle, fusion).
  m.width = 96
  m.height = Math.round(96 * 1.4)
  const c = m.getContext('2d')
  if (c === null) return m
  c.fillStyle = '#ffffff'
  c.fillRect(0, 0, m.width, m.height)
  if (image !== null) {
    c.scale(m.width / LARGE, m.width / LARGE)
    c.globalCompositeOperation = 'destination-out'
    couvrir(c, image, marge, aY, LARGE - marge * 2, aH, rognage)
  }
  return m
}

/**
 * OÙ SONT LES RAYONS DANS LA CARTE, pour le nuanceur — en parts de la largeur
 * et de la hauteur, l'origine en haut à gauche comme sur la toile. Écrit à
 * partir des mêmes nombres que `peindreRayons` et que son appel : la fenêtre
 * d'art en mode emoji (`marge` = la bordure, jusqu'à `HAUT_BULLE`).
 */
export const RAYONS_DANS_LA_CARTE = (() => {
  const marge = CONTOURS[PISTE_CONTOUR] * U
  const x = marge / LARGE
  const y = marge / HAUT
  const l = (LARGE - marge * 2) / LARGE
  const h = (HAUT * HAUT_BULLE - marge) / HAUT
  return {
    x,
    y,
    l,
    h,
    nombre: NB_RAYONS,
    depart: 0.21,
    /** Le rayon du fondu, en largeurs : la demi-diagonale de la fenêtre. */
    rayon: Math.hypot(l, h * 1.4) / 2,
  }
})()

function peindreRayons(
  ctx: CanvasRenderingContext2D,
  rarete: string | undefined,
  x: number,
  y: number,
  l: number,
  h: number,
): void {
  const force = rarete === undefined ? 0 : (FORCE_RAYONS[rarete] ?? 0)
  const ton = rarete === undefined ? undefined : METAUX[rarete]?.[2]
  if (force <= 0 || ton === undefined) return
  const cx = x + l / 2
  const cy = y + h / 2
  const rayon = Math.hypot(l, h) / 2
  ctx.save()
  ctx.beginPath()
  ctx.rect(x, y, l, h)
  ctx.clip()
  ctx.globalCompositeOperation = 'lighter'
  // L'EXTINCTION VERS LES BORDS : pleine au centre, nulle au coin le plus loin.
  const fondu = ctx.createRadialGradient(cx, cy, rayon * 0.08, cx, cy, rayon)
  fondu.addColorStop(0, ton)
  fondu.addColorStop(1, ton + '00')
  ctx.fillStyle = fondu
  ctx.globalAlpha = force
  const depart = 0.21
  const pas = (Math.PI * 2) / NB_RAYONS
  for (let i = 0; i < NB_RAYONS; i += 2) {
    const a0 = depart + i * pas
    const a1 = a0 + pas
    ctx.beginPath()
    ctx.moveTo(cx, cy)
    ctx.arc(cx, cy, rayon * 1.05, a0, a1)
    ctx.closePath()
    ctx.fill()
  }
  ctx.restore()
}

function aplat(ctx: CanvasRenderingContext2D, rarete?: string): CanvasGradient {
  const g = ctx.createLinearGradient(0, 0, 0, HAUT)
  const [, sombre, moyen, , bord] = METAUX[rarete ?? 'commune'] ?? METAUX.commune!
  g.addColorStop(0, bord)
  g.addColorStop(0.45, moyen)
  g.addColorStop(1, sombre)
  return g
}

/** Le laiton du cadre, en dégradé oblique comme dans le CSS. */
function laiton(ctx: CanvasRenderingContext2D, rarete?: string): CanvasGradient {
  const g = ctx.createLinearGradient(0, 0, LARGE, HAUT)
  // ELLE PASSE PAR LA TABLE, plus par une égalité de chaîne : l'orange du
  // mode emoji s'appelle aussi « légendaire », et il ne doit pas irriser.
  if (ECLAT_DE_LA_RARETE[rarete ?? ''] === 'iris') {
    for (const [ou, ton] of IRISATION) g.addColorStop(ou, ton)
    return g
  }
  // Sans rareté, c'est le premier cran : une carte de deck, le dos.
  const [clair, sombre, moyen, nuit, bord] = METAUX[rarete ?? 'commune'] ?? METAUX.commune!
  g.addColorStop(0, clair)
  g.addColorStop(0.21, sombre)
  g.addColorStop(0.23, moyen)
  /**
   * **LE PLATEAU MOYEN S'ALLONGE, ET LA NUIT SE REPLIE DANS LE COIN.**
   *
   * Keko : « il y a une couleur assombrissante sur l'entaille de droite qui la
   * rend peu visible, on peut la décaler ? » — et c'était mesurable. Le dégradé
   * court sur la DIAGONALE, donc le montant droit à la hauteur du titre tombait
   * à 77 % de sa course, juste dans le ton `nuit` (qui commençait à 80 %) ;
   * l'entaille gauche, elle, est à 45 %, en plein ton moyen.
   *
   * *Et le creux d'une entaille vaut « 30 % de noir » sur le métal, pas une
   * couleur à elle* : l'écart absolu s'effondre quand le métal est déjà sombre —
   * 0,24 de luminance sur un laiton clair, 0,06 sur un laiton nuit. **Un
   * contraste relatif ne reste pas un contraste.**
   *
   * Le plateau va donc jusqu'à 78 % et la nuit ne commence qu'à 93 % : la
   * structure de lumière du métal ne change pas — clair, sombre, moyen, nuit,
   * bord — c'est sa part la plus noire qui se replie dans le coin bas-droit.
   */
  g.addColorStop(0.78, moyen)
  g.addColorStop(0.93, nuit)
  g.addColorStop(1, bord)
  return g
}

/**
 * Charge l'illustration : l'image de Keko si elle existe, le dessin SVG sinon.
 *
 * **Le repli est explicite ici**, là où la carte 2D le laisse au CSS (qui
 * ignore tout seul une couche de fond qui échoue). Un canvas, lui, ne dessine
 * rien du tout : sans ce repli, une image retirée laisserait un trou noir.
 */
/**
 * UN EMOJI PEINT SUR UNE TOILE CARREE, qui sert ensuite d'illustration.
 *
 * **IL FAUT DEMANDER LA POLICE EXPLICITEMENT.** `document.fonts.ready` ne
 * promet que ce que la page UTILISE deja : une police Google Fonts qu'aucun
 * element n'emploie n'est jamais telechargee, et *le canvas retombe alors en
 * silence sur la police systeme* -- qui rend bien un emoji sur la plupart des
 * machines, et rien du tout sur certaines. C'est la regle deja payee par le
 * cartouche, en pire : ici le repli n'est pas une autre police, c'est un carre
 * vide.
 *
 * La toile est CARREE et l'emoji centre dedans : *le cadrage se decide ensuite*
 * -- `couvrir` le pose comme il poserait une photo.
 */
const TOILE_EMOJI = 512
const EMOJIS = new Map<string, HTMLCanvasElement>()
const POLICES_EMOJI = new Map<string, Promise<unknown>>()

/**
 * LA POLICE SE DEMANDE POUR CE CARACTERE-LA, pas « en general ».
 *
 * ***Google Fonts decoupe Noto Color Emoji en ONZE sous-ensembles*** par plage
 * Unicode, et `document.fonts.load(police)` sans texte n'en telecharge que
 * quelques-uns. **Un emoji d'une plage non chargee retombe alors en silence sur
 * la police systeme** -- qui en rend bien un sur Windows et sur Mac, et rien du
 * tout ailleurs. *Mesure : trois sous-ensembles sur onze etaient charges apres
 * un appel nu, et `fonts.check` repondait quand meme `true`.*
 *
 * C'est la regle du canvas qui peint avant `document.fonts.ready`, un cran plus
 * fin : **il ne suffit pas que la police soit la, il faut que le GLYPHE y
 * soit.**
 */
export function policeDeLEmoji(emoji: string): Promise<unknown> {
  const deja = POLICES_EMOJI.get(emoji)
  if (deja !== undefined) return deja
  const p = document.fonts.load(`64px "Noto Color Emoji"`, emoji).catch(() => null)
  POLICES_EMOJI.set(emoji, p)
  return p
}

export function imageDeLEmoji(emoji: string): HTMLCanvasElement | null {
  const deja = EMOJIS.get(emoji)
  if (deja !== undefined) return deja
  const toile = document.createElement('canvas')
  toile.width = TOILE_EMOJI
  toile.height = TOILE_EMOJI
  const ctx = toile.getContext('2d')
  if (ctx === null) return null
  // *Le glyphe ne remplit pas sa boite* : on le pose a 80 % de la toile, assez
  // pour que les emoji hauts (une tour, un drapeau) ne touchent pas les bords.
  ctx.font = `${Math.round(TOILE_EMOJI * 0.8)}px "Noto Color Emoji", "Apple Color Emoji", "Segoe UI Emoji", sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(emoji, TOILE_EMOJI / 2, TOILE_EMOJI / 2)
  EMOJIS.set(emoji, toile)
  return toile
}

/**
 * L'EMOJI EN STICKER : le glyphe cerné de crème, avec son ombre, sur sa toile.
 *
 * Keko : « quand l'emoji est foncé comme le "Plus" il ne se distingue pas
 * assez du fond, c'est dommage ». *Un glyphe gris sur une nuit verte n'a
 * presque pas d'écart de luminance*, et c'est le halo flouté qu'on venait de
 * retirer qui le détachait un peu. Trois réponses étaient possibles — un cerne
 * partout, un cerne seulement quand l'écart manque, une lueur claire derrière
 * — et Keko a pris la première : **c'est la langue du mode**, un emoji est un
 * sticker sur un téléphone, et le dos comme le sachet le disent déjà.
 *
 * C'est `collerSticker` qui le fait — *le même cerne que le dos, par la même
 * dilatation* — posé une fois sur une toile de la taille du glyphe, qui sert
 * ensuite d'illustration comme le glyphe nu servait. L'unité est choisie pour
 * que le cerne fasse `CERNE_CARTE` de la toile. `?sticker=0` rend le glyphe nu.
 *
 * **L'emoji ANIMÉ n'en porte pas** : ses images arrivent déjà prêtes
 * (`prete`), une par image, et dilater chacune serait un calcul par image.
 */
const CERNE_CARTE = 0.028
/**
 * LA TOILE DU STICKER DÉBORDE CELLE DU GLYPHE. Keko : « sur certaines cartes
 * comme le trèfle, l'outline blanc est "coupé" en haut de l'emoji comme s'il
 * atteignait un bord ». *Il l'atteignait* : un glyphe haut sort de son em-box
 * et touche le bord de ses 512, et le cerne — plus l'ombre, qui descend de
 * 35 px — n'avait nulle part où aller. La toile prend donc `MARGE_STICKER` de
 * chaque côté, et **le sujet ne rétrécit pas pour autant** : la fenêtre d'art
 * rend exactement cet air (voir `air`, dans `peindreCarte`).
 */
const MARGE_STICKER = 0.1
const SANS_STICKER =
  typeof location !== 'undefined' && new URLSearchParams(location.search).get('sticker') === '0'
const STICKERS = new Map<string, HTMLCanvasElement>()

function stickerDeLEmoji(emoji: string): HTMLCanvasElement | null {
  const deja = STICKERS.get(emoji)
  if (deja !== undefined) return deja
  const glyphe = imageDeLEmoji(emoji)
  if (glyphe === null) return null
  const toile = stickerDUneImage(glyphe, TOILE_EMOJI)
  if (toile !== null) STICKERS.set(emoji, toile)
  return toile
}

/**
 * LE MÊME STICKER, POUR N'IMPORTE QUELLE IMAGE CARRÉE de `cote` pixels — le
 * glyphe peint, ou une image de l'emoji ANIMÉ. Keko : « les emojis animés
 * n'ont pas de contours blancs ». *L'animé passe par le même peintre que le
 * glyphe* : un seul endroit dit l'épaisseur du cerne, sa marge et son ombre.
 */
function stickerDUneImage(image: CanvasImageSource, cote: number): HTMLCanvasElement | null {
  // LE CERNE SE CALCULE SUR UNE TOILE : `cerneDe` lit ses pixels.
  let glyphe: HTMLCanvasElement
  if (image instanceof HTMLCanvasElement && image.width === cote) glyphe = image
  else {
    glyphe = document.createElement('canvas')
    glyphe.width = cote
    glyphe.height = cote
    glyphe.getContext('2d')?.drawImage(image, 0, 0, cote, cote)
  }
  const n = Math.round(cote * (1 + MARGE_STICKER * 2))
  const toile = document.createElement('canvas')
  toile.width = n
  toile.height = n
  const ctx = toile.getContext('2d')
  if (ctx === null) return null
  // L'UNITÉ : `collerSticker` épaissit de DOS_CERNE unités, donc une unité
  // vaut l'épaisseur voulue divisée par DOS_CERNE — l'ombre suit dans le même
  // rapport.
  const u = (CERNE_CARTE * cote) / DOS_CERNE
  // À LA FINESSE DU GLYPHE : voir `cerneDe`.
  collerSticker(ctx, glyphe, n / 2, n / 2, cote, 0, u, false, cote)
  return toile
}

/**
 * Une image de l'emoji animé, en sticker — `null` sous `?sticker=0`, où
 * l'image reste nue comme le glyphe statique.
 */
export function stickerAnime(image: CanvasImageSource, cote: number): HTMLCanvasElement | null {
  return SANS_STICKER ? null : stickerDUneImage(image, cote)
}

async function illustration(
  nom: string,
  rarete?: string,
  matiere?: string,
  directe?: string,
  emoji?: string,
  prete?: CanvasImageSource & { width: number; height: number },
  sticker = false,
): Promise<HTMLImageElement | HTMLCanvasElement | null> {
  // UNE IMAGE DEJA PRETE PASSE DEVANT TOUT : c'est le chemin de l'emoji anime,
  // et *elle n'a rien a charger*, donc rien a attendre.
  if (prete !== undefined) return prete as HTMLCanvasElement
  if (emoji !== undefined && emoji !== '') {
    // ON ATTEND LA POLICE AVANT DE PEINDRE : sans ca la premiere carte sort
    // avec la police systeme, et *sa toile part en cache telle quelle* -- donc
    // le defaut survivrait au chargement.
    await policeDeLEmoji(emoji)
    const peint = sticker ? stickerDeLEmoji(emoji) : imageDeLEmoji(emoji)
    if (peint !== null) return peint
  }
  const dessin = art(nom)
  const keko = urlImageDeKeko(nom, rarete, matiere)
  // UNE URL DONNÉE PASSE DEVANT LA TABLE : le troisième mode découvre ses
  // illustrations, il n'en tient pas la liste. Le repli reste derrière.
  for (const url of [directe ?? null, keko, dessin]) {
    if (url === null) continue
    const image = await charger(url)
    if (image !== null) return image
  }
  return null
}

/**
 * LE FOND COMMUN, chargé UNE FOIS pour toutes les cartes.
 *
 * La promesse est mémorisée, pas l'image : `peindreCarte` est appelée par
 * modèle, et sans ça le premier écran lancerait autant de chargements qu'il y
 * a de cartes différentes — pour un fichier qui pèse un mégaoctet et demi.
 * *Une ressource partagée se charge une fois, même si dix appelants la
 * demandent en même temps.*
 */
const FONDS = new Map<string, Promise<HTMLImageElement | null>>()

function fond(famille?: string): Promise<HTMLImageElement | null> {
  const cle = famille !== undefined && fondPropre(famille) ? famille : ''
  const deja = FONDS.get(cle)
  if (deja !== undefined) return deja
  const promesse = charger(urlDuFond(cle === '' ? undefined : cle))
  FONDS.set(cle, promesse)
  return promesse
}

/**
 * LE CIEL D'UNE ARME, VIRÉ AU ROUGE — et viré PIXEL PAR PIXEL.
 *
 * Demandé par Keko : « on peut mettre le background des armes en rouge au lieu
 * du bleu ? »
 *
 * **Le `globalCompositeOperation = 'hue'` ne tient pas**, et c'est la leçon de
 * cette passe : il marchait sur la machine de dev et pas sur l'appareil de
 * Keko — « ça n'a rien changé du tout ». `hue`, `saturation`, `color` et
 * `luminosity` sont les modes NON SÉPARABLES du canvas, les moins bien tenus
 * du lot : un navigateur qui ne les implémente pas ne lève rien, il **ignore
 * l'opération**. *Une dégradation silencieuse vaut moins qu'un chemin qui
 * marche partout* — exactement la raison qui avait déjà écarté `ctx.filter`.
 *
 * On refait donc ce que `hue` promettait, à la main : pour chaque pixel on
 * GARDE sa saturation et sa luminance, et on lui donne la teinte du rouge.
 * C'est la formule de la spécification de composition, et elle n'a besoin que
 * d'arithmétique — donc elle rend le même résultat sur tous les appareils.
 *
 * *Le ciel étoilé reste le même ciel, il change d'heure* : la matière, les
 * étoiles et le dégradé qui monte survivent, là où un rectangle rouge posé
 * dessus les aurait écrasés.
 */
type Ciel = 'arme' | 'armure' | 'objet' | 'tresor'

/**
 * LA TEINTE DE CHAQUE FAMILLE. Tranché par Keko : « on peut utiliser le
 * background en version verte pour les objets et jaune pour les trésors ? »,
 * puis « les cartes générées par les armes rouges, les armures bleues et les
 * objets verts, comme la carte objet correspondante ».
 *
 * **LES QUATRE PASSENT PAR LA TABLE, l'armure comprise** — même quand sa
 * teinte est celle du fichier. Laisser le bleu d'origine hors du virage
 * l'aurait laissé seul à pleine saturation quand les trois autres ont été
 * adoucis : *quatre repères du même rang se règlent au même endroit, sinon
 * l'un d'eux dérive au premier réglage.*
 *
 * Chaque entrée est un vecteur de TEINTE déjà normalisé — son plus petit canal
 * vaut 0, son plus grand 1 — parce que c'est exactement ce que la formule
 * demande : la saturation vient du pixel, pas de la table.
 */
const CIELS: Record<Ciel, [number, number, number]> = {
  arme: [1, 0, 0],
  armure: [0, 0.42, 1],
  objet: [0, 1, 0.12],
  tresor: [1, 0.74, 0],
}

/**
 * CE QUI RESTE DU PIGMENT après le virage. Keko : « je me demande si on ne va
 * pas un peu loin avec les couleurs, ça embrouille un peu les choses non ? »
 *
 * **Et il avait raison sur un point précis** : la couleur est l'axe de la
 * RARETÉ — bronze, argent, or, diamant — et quatre ciels francs la lui
 * disputaient, jusqu'à la contredire (un butin au ciel d'or dans un cadre de
 * bronze disait deux métaux à la fois). *Une échelle se dit en couleur, une
 * famille se dit en forme*, et la forme dit déjà la famille : coque déchirée
 * pour une pièce, encoche pour une carte de deck, coins coupés pour un butin.
 *
 * Tranché par Keko : **garder les quatre, mais les désaturer.** Le ciel cesse
 * alors d'être un code et redevient une AMBIANCE — il se lit du coin de l'oeil
 * dans une main où les familles se mélangent, et il ne rivalise plus avec le
 * métal du cadre, qui lui est franc.
 *
 * **ET LE BUTIN GARDE LE SIEN, quand les trois autres descendent encore d'un
 * cran.** Keko : « on peut diminuer un peu la saturation des backgrounds rouge
 * bleu et vert, mais pas jaune ». *Ce n'est pas une exception arbitraire* : le
 * jaune est la teinte dont la luminance est la plus proche de celle du blanc,
 * donc **l'écart qu'on lui retire est le plus petit des quatre** — à pigment
 * égal il s'efface le premier, et il vire au beige gris avant que les trois
 * autres n'aient bougé.
 */
const PIGMENT_CIEL: Record<Ciel, number> = {
  arme: 0.37,
  armure: 0.37,
  objet: 0.37,
  tresor: 0.5,
}

/**
 * COMBIEN DE FOIS LE DÉCOR S'AJOUTE À LUI-MÊME. Keko : « je trouve les
 * backgrounds des cartes un poil sombres (saturation ok mais pas assez
 * éclairé) ».
 *
 * *On monte l'EXPOSITION, on ne tire pas un rideau clair* : une addition de
 * l'image sur elle-même garde son contraste, sa matière et son pigment, là où
 * un voile blanc écraserait les trois — et c'est justement la saturation que
 * Keko voulait garder.
 *
 * **Ça ne pouvait plus passer par l'opacité** : elle plafonne à 1, donc au-delà
 * du double il faut une passe de plus. C'est le vrai nom de la grandeur, et
 * elle se lit comme telle.
 *
 * **ET LE BLEU EN DEMANDE PLUS QUE LES AUTRES.** Keko : « on peut éclaircir
 * encore un poil le background bleu des armures ? » *Ce n'est pas un caprice,
 * c'est de la colorimétrie* : le bleu ne pèse que 0,11 dans la luminance quand
 * le vert en pèse 0,59 — donc à exposition égale il PARAÎT plus sombre, et il
 * l'est vraiment pour l'oeil. **Chaque ciel a donc son exposition**, et la
 * table dit lequel a besoin de combien plutôt qu'un chiffre unique qui aurait
 * raison pour un seul d'entre eux.
 */
const EXPO_CIEL: Record<Ciel, number> = {
  arme: 2.6,
  armure: 3.3,
  objet: 2.6,
  tresor: 2.6,
}

/** L'exposition d'un ciel sans famille — une carte de récompense, une planche. */
const EXPO_DECOR = 2.6

/**
 * LE CIEL D'UNE CARTE, VIRÉ À SA COULEUR — et viré PIXEL PAR PIXEL.
 *
 * Demandé par Keko : « on peut mettre le background des armes en rouge au lieu
 * du bleu ? », puis « en version verte pour les objets et jaune pour les
 * trésors ».
 *
 * **Le `globalCompositeOperation = 'hue'` ne tient pas**, et c'est la leçon de
 * cette passe : il marchait sur la machine de dev et pas sur l'appareil de
 * Keko — « ça n'a rien changé du tout ». `hue`, `saturation`, `color` et
 * `luminosity` sont les modes NON SÉPARABLES du canvas, les moins bien tenus
 * du lot : un navigateur qui ne les implémente pas ne lève rien, il **ignore
 * l'opération**. *Une dégradation silencieuse vaut moins qu'un chemin qui
 * marche partout* — exactement la raison qui avait déjà écarté `ctx.filter`.
 *
 * On refait donc ce que `hue` promettait, à la main : pour chaque pixel on
 * GARDE sa saturation et sa luminance, et on lui donne la teinte voulue. C'est
 * la formule de la spécification de composition, et elle n'a besoin que
 * d'arithmétique — donc elle rend le même résultat sur tous les appareils.
 *
 * *Le ciel étoilé reste le même ciel, il change d'heure* : la matière, les
 * étoiles et le dégradé qui monte survivent, là où un rectangle de couleur
 * posé dessus les aurait écrasés.
 */
function virerLeCiel(pixels: Uint8ClampedArray, ciel: Ciel): void {
  const [ur, uv, ub] = CIELS[ciel]
  const pigment = PIGMENT_CIEL[ciel]
  // La teinte portée à une saturation de 1 ; sa propre luminance sert à
  // recaler le résultat sur celle du pixel.
  const lumTeinte = 0.3 * ur + 0.59 * uv + 0.11 * ub
  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i]! / 255
    const v = pixels[i + 1]! / 255
    const b = pixels[i + 2]! / 255
    const sat = Math.max(r, v, b) - Math.min(r, v, b)
    const lum = 0.3 * r + 0.59 * v + 0.11 * b
    const ecart = lum - sat * lumTeinte
    let cr = ur * sat + ecart
    let cv = uv * sat + ecart
    let cb = ub * sat + ecart
    // ClipColor : une teinte portée à une luminance donnée peut sortir de
    // [0,1] — on ramène alors vers la luminance, qui est ce qu'on garde.
    const bas = Math.min(cr, cv, cb)
    const haut = Math.max(cr, cv, cb)
    if (bas < 0 && lum - bas > 1e-6) {
      const k = lum / (lum - bas)
      cr = lum + (cr - lum) * k
      cv = lum + (cv - lum) * k
      cb = lum + (cb - lum) * k
    }
    if (haut > 1 && haut - lum > 1e-6) {
      const k = (1 - lum) / (haut - lum)
      cr = lum + (cr - lum) * k
      cv = lum + (cv - lum) * k
      cb = lum + (cb - lum) * k
    }
    // ET ON EN REND LA MOITIÉ À SA LUMINANCE : le ciel garde sa teinte et perd
    // son pigment, donc il ne dispute plus la couleur au métal du cadre.
    pixels[i] = (lum + (cr - lum) * pigment) * 255
    pixels[i + 1] = (lum + (cv - lum) * pigment) * 255
    pixels[i + 2] = (lum + (cb - lum) * pigment) * 255
  }
}

/**
 * LE RAYON DU FLOU DU BLOOM, en pixels de sa PETITE toile.
 *
 * Un pixel de cette toile vaut seize pixels de la carte peinte, donc un rayon
 * de 2 étale la lumière sur 84 — **onze pour cent de la largeur**, ce qu'il
 * faut pour qu'elle se lise comme une lueur et non comme un liseré.
 */
const RAYON_BLOOM = 2

/**
 * LE BLOOM SE FLOUTE VRAIMENT, il ne se contente plus d'être RÉDUIT.
 *
 * Keko : « y'a d'étranges taches sur le contour des emojis, c'est assez
 * bizarre… c'est dû à la qualité basse des images qui sont zoomées trop ? »
 *
 * ***Il avait raison sur la cause, et ce n'était pas l'emoji*** : la basse
 * résolution est celle de **la toile du bloom**, quarante-quatre pixels de
 * large agrandis dix-sept fois. Chacun de ses pixels devient une plaque de
 * seize pixels sur la carte — six à l'écran — et ces plaques ne suivent plus
 * la silhouette qu'elles sont censées éclairer.
 *
 * **CE N'EST PAS UN DÉFAUT NEUF, C'EST UN DÉFAUT QUE L'EMOJI RÉVÈLE.** Une
 * illustration de Keko est un sujet DÉTOURÉ aux bords doux qui couvre toute la
 * fenêtre, donc son bloom est partout et se lit comme de l'ambiance ; un emoji
 * est un **aplat net posé sur du vide**, donc son bloom est un CONTOUR — et un
 * contour en marches de seize pixels se lit comme des taches.
 *
 * ***Un flou par réduction ne floute que ce qui est plus petit que le pas de
 * réduction.*** Une lame fine fond dans le halo ; un aplat massif garde son
 * bord, et l'agrandissement n'en fait qu'une rampe LINÉAIRE — donc une arête
 * de dérivée aux deux bouts, exactement ce que le voile sous le texte avait
 * déjà coûté : *ce n'est pas la vitesse qu'on voit, c'est la cassure.*
 *
 * **Le flou est dans la MATIÈRE, pas dans la géométrie** — la règle déjà payée
 * sur le contour des cartes et sur le halo des créatures. Faute de
 * `ctx.filter`, qui demande Safari 16.4 quand la page vise 16.2, c'est une
 * moyenne glissante en deux passes séparées. Elle coûte deux mille sept cents
 * pixels, soit rien, même répétée trente fois par seconde pour un emoji animé.
 *
 * **ET ELLE FLOUTE LE PRÉMULTIPLIÉ, puis rend la toile OPAQUE.** En mélange
 * additif, ce qu'un pixel ajoute vaut `rgb × a` : c'est donc cette quantité-là
 * qu'il faut moyenner. *Flouter un RGB non prémultiplié mêlerait la couleur de
 * pixels transparents à celle des opaques* — la frange de bord classique, et
 * la même famille que les grains noirs opaques de l'onde.
 *
 * Ce qui sort de la toile compte pour du noir : *une lumière se dilue au bord,
 * elle n'y rebondit pas.*
 */
function adoucir(d: Uint8ClampedArray, l: number, h: number, r: number): void {
  const n = l * h
  const fenetre = r * 2 + 1
  const src = new Float32Array(n * 3)
  for (let i = 0; i < n; i++) {
    const a = d[i * 4 + 3]! / 255
    src[i * 3] = d[i * 4]! * a
    src[i * 3 + 1] = d[i * 4 + 1]! * a
    src[i * 3 + 2] = d[i * 4 + 2]! * a
  }
  const mi = new Float32Array(n * 3)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < l; x++) {
      let cr = 0
      let cv = 0
      let cb = 0
      for (let k = -r; k <= r; k++) {
        const xx = x + k
        if (xx < 0 || xx >= l) continue
        const j = (y * l + xx) * 3
        cr += src[j]!
        cv += src[j + 1]!
        cb += src[j + 2]!
      }
      const j = (y * l + x) * 3
      mi[j] = cr / fenetre
      mi[j + 1] = cv / fenetre
      mi[j + 2] = cb / fenetre
    }
  }
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < l; x++) {
      let cr = 0
      let cv = 0
      let cb = 0
      for (let k = -r; k <= r; k++) {
        const yy = y + k
        if (yy < 0 || yy >= h) continue
        const j = (yy * l + x) * 3
        cr += mi[j]!
        cv += mi[j + 1]!
        cb += mi[j + 2]!
      }
      const i = (y * l + x) * 4
      d[i] = cr / fenetre
      d[i + 1] = cv / fenetre
      d[i + 2] = cb / fenetre
      d[i + 3] = 255
    }
  }
}

/** Une image virée à la couleur d'une famille, rendue dans un canvas. */
function auCiel(image: HTMLImageElement, ciel: Ciel): HTMLCanvasElement | null {
  const toile = document.createElement('canvas')
  toile.width = image.naturalWidth
  toile.height = image.naturalHeight
  const ctx = toile.getContext('2d', { willReadFrequently: true })
  if (ctx === null) return null
  ctx.drawImage(image, 0, 0)
  try {
    const champ = ctx.getImageData(0, 0, toile.width, toile.height)
    virerLeCiel(champ.data, ciel)
    ctx.putImageData(champ, 0, 0)
  } catch {
    // UNE LECTURE DE PIXELS PEUT ÊTRE REFUSÉE si l'image vient d'une autre
    // origine. Elles viennent toutes de `public/`, donc ça n'arrive pas ici —
    // mais *une teinte qui échoue doit rendre le ciel bleu, pas une carte
    // noire.* C'est la règle du repli d'illustration.
    return null
  }
  return toile
}

/**
 * LE CIEL D'UNE FAMILLE SE FABRIQUE UNE FOIS, pour toutes ses cartes.
 *
 * *Une passe par pixels sur un décor de 1024 px coûte quelques millisecondes* —
 * une fois par famille. La refaire par carte la paierait vingt fois pour un
 * résultat identique, et c'est exactement la raison qui mémorise déjà le décor
 * lui-même.
 */
/**
 * **LE DÉCOR EST PEINT, PAS CHARGÉ — et c'est un aplat pour commencer.**
 *
 * Keko : « le background est super moche en webp… sinon tu peux dessiner le
 * fond via le code ? essaie de faire un fond uni simple pour commencer ».
 *
 * *Et ça règle le problème par sa racine* : l'image pesait 13 Ko pour 1,5
 * mégapixel — **0,071 bit par pixel**, quatre fois sous ce qu'un dégradé
 * demande pour ne pas bander. Une couleur peinte n'a ni compression, ni
 * poids, ni palier de résolution : elle est nette à toutes les tailles de
 * toile, et elle ne retarde plus le premier rendu puisqu'il n'y a plus rien à
 * attendre.
 *
 * **`?fond=image` rend les fichiers** — *ce qui a servi à choisir doit rester
 * ouvrable*, et c'est le seul moyen de comparer les deux d'un lien.
 */
const FOND_PEINT = new URLSearchParams(location.search).get('fond') !== 'image'

/**
 * LA COULEUR DE BASE : la moyenne MESURÉE du décor commun, déjà exposée.
 *
 * *On ne l'invente pas* — (1, 26, 36) est la moyenne du fichier bleu nuit, et
 * l'exposition la portait à 2,6 fois. L'aplat part donc exactement là où
 * l'image arrivait, et **il n'a pas besoin d'exposition** : multiplier une
 * couleur unie ne fait que donner une autre couleur unie, autant poser la
 * bonne du premier coup.
 */
const BASE_FOND: readonly [number, number, number] = [3, 68, 94]

/**
 * LA BASE DU DOS : la pierre du lieu, pas le ciel des faces.
 *
 * Keko, en voyant le dos sur le fond commun : « le background peut être plutôt
 * noir ? ou gris foncé ? » *Un dos n'a pas de voile sous son texte — il n'a pas
 * de texte* — donc son fond se voit en entier, et le bleu nuit des faces y
 * paraissait deux fois plus clair qu'il ne l'est sur une carte. **Un gris
 * sombre laisse l'or du cadre porter la carte**, ce qui est tout ce qu'un dos
 * a à faire.
 */
const BASE_DOS: readonly [number, number, number] = [28, 30, 34]

/**
 * L'AMPLITUDE DU GRAIN — celle d'un dither, pas celle d'une matière.
 *
 * `overlay` sur un fond sombre fait varier le résultat de ±0,25 à pleine
 * opacité ; à 0,06 il ne reste qu'environ **±4 niveaux sur 255**, assez pour
 * casser une bande de dégradé, trop peu pour qu'on distingue un grain.
 */
const ALPHA_GRAIN = 0.06

/** Cette même couleur, virée à la teinte d'une famille. */
function teinteDuCiel(ciel: Ciel | undefined): [number, number, number] {
  if (ciel === undefined) return [...BASE_FOND]
  // On réemploie le virage du décor plutôt que d'écrire quatre couleurs à la
  // main : *deux façons de dire la même teinte divergent au premier réglage.*
  const px = new Uint8ClampedArray([...BASE_FOND, 255])
  virerLeCiel(px, ciel)
  return [px[0]!, px[1]!, px[2]!]
}

/**
 * LA TUILE DE GRAIN, tirée une fois pour tout le jeu.
 *
 * *Un semis qui se réarrange d'une carte à l'autre n'est plus une matière* :
 * le bruit sort d'un hachage de la position, donc il est le même à chaque
 * peinture. C'est la règle déjà tenue par le semis de l'onde.
 */
let tuileGrain: HTMLCanvasElement | null = null

function grainDuDecor(): HTMLCanvasElement {
  if (tuileGrain !== null) return tuileGrain
  const t = document.createElement('canvas')
  t.width = 128
  t.height = 128
  const c = t.getContext('2d')!
  const champ = c.createImageData(128, 128)
  for (let y = 0; y < 128; y += 1) {
    for (let x = 0; x < 128; x += 1) {
      // Un hachage entier : deux voisins n'ont aucune parenté, donc le motif
      // ne dessine ni grille ni diagonale.
      let h = Math.imul(x, 0x27d4eb2d) ^ Math.imul(y, 0x165667b1)
      h = Math.imul(h ^ (h >>> 15), 0x2545f491)
      const v = (h >>> 24) & 255
      const i = (y * 128 + x) * 4
      champ.data[i] = v
      champ.data[i + 1] = v
      champ.data[i + 2] = v
      champ.data[i + 3] = 255
    }
  }
  c.putImageData(champ, 0, 0)
  tuileGrain = t
  return t
}

/**
 * **LE DÉCOR PEINT : un dégradé, un vignettage, un grain.** Demandé par Keko
 * après l'aplat — « fais les 3 déjà, on verra le caractère après ».
 *
 * Chacun fait un travail que les deux autres ne font pas, comme le ruban et
 * les esquilles de la comète :
 *
 * - **le DÉGRADÉ donne le volume.** La lumière du jeu vient du haut, donc le
 *   fond y est plus clair — *sans lui, la carte se lit comme un rectangle de
 *   couleur et le sujet n'a pas d'air* ;
 * - **le VIGNETTAGE donne le cadrage** : les coins s'assombrissent et le
 *   regard se referme sur le sujet. C'est le vocabulaire du gabarit 2D, dont
 *   la matière en porte un ;
 * - **le GRAIN donne la matière — et il n'est pas décoratif.** *Un dégradé
 *   sombre sur un canvas 8 bits BANDE par construction* : entre le haut du
 *   ciel et le noir il n'y a qu'une centaine de niveaux pour un millier de
 *   pixels de hauteur, donc des bandes de dix pixels. C'est exactement le
 *   défaut qu'on fuyait en quittant l'image compressée, et le bruit est ce qui
 *   le dissout.
 */
function peindreDecor(
  ctx: CanvasRenderingContext2D,
  ciel: Ciel | undefined,
  impose?: readonly [number, number, number],
  /**
   * LA BOITE A COUVRIR, quand ce n'est pas une carte.
   *
   * *Le sachet est fait de la meme matiere que le dos* — meme degrade, meme
   * vignettage, meme dither — **mais il n'a pas ses proportions**. Une seconde
   * fonction aurait diverge au premier reglage : c'est la regle du coeur des
   * armures, payee des qu'un dessin existe en double.
   */
  boite?: { readonly l: number; readonly h: number },
  /**
   * SANS GRAIN POUR LA FACE D'UN EMOJI. Keko : « les fonds semblent avoir une
   * texture un peu granuleuse, c'est le cas ? » — oui, le dither — « coupe-le
   * pour les emojis ». *Un dither réglé sur le bleu nuit cesse d'être
   * invisible sur un décor remonté vers le ton moyen*, et un aplat net n'a pas
   * de bande à dissoudre. Le dos et le sachet le gardent.
   */
  grain: boolean = true,
): void {
  const L_ = boite?.l ?? LARGE
  const H_ = boite?.h ?? HAUT
  const base = impose ?? teinteDuCiel(ciel)
  const ton = (k: number): string =>
    `rgb(${Math.round(Math.min(255, base[0] * k))}, ${Math.round(Math.min(255, base[1] * k))}, ${Math.round(Math.min(255, base[2] * k))})`

  const vertical = ctx.createLinearGradient(0, 0, 0, H_)
  vertical.addColorStop(0, ton(1.32))
  vertical.addColorStop(0.45, ton(1))
  vertical.addColorStop(1, ton(0.6))
  ctx.fillStyle = vertical
  ctx.fillRect(0, 0, L_, H_)

  /**
   * LE VIGNETTAGE EST UNE ELLIPSE, pas un disque : la carte est une fois et
   * demie plus haute que large, donc un dégradé circulaire mordrait sur les
   * côtés bien avant d'atteindre le haut. On dessine un disque dans un repère
   * étiré — *une forme suit les proportions de ce qu'elle borde.*
   */
  ctx.save()
  ctx.translate(L_ / 2, H_ / 2)
  ctx.scale(1, H_ / L_)
  const vignette = ctx.createRadialGradient(0, 0, L_ * 0.3, 0, 0, L_ * 0.75)
  vignette.addColorStop(0, '#00000000')
  vignette.addColorStop(1, '#00000066')
  ctx.fillStyle = vignette
  ctx.fillRect(-L_, -L_, L_ * 2, L_ * 2)
  ctx.restore()

  /**
   * **LE GRAIN SE PEINT EN PIXELS DE LA TOILE, pas en unités de carte.**
   *
   * Tout le dessin parle en unités de 768 et le contexte est mis à l'échelle ;
   * un motif posé dans ce repère aurait un grain trois fois plus fin sur une
   * toile de 256 que sur une de 768 — donc il moirerait sur la petite, comme
   * le réseau du foil quand il passe sous le pixel. On rend donc la
   * transformation identité le temps de le poser : le clip, lui, a déjà été
   * converti, il tient.
   *
   * `overlay` est NEUTRE à 128 : un bruit centré sur ce gris ne change pas la
   * couleur moyenne, il ne fait que l'agiter de quelques niveaux — ce qu'on
   * demande à un dithering.
   *
   * **ET IL DOIT ÊTRE INVISIBLE.** Keko, sur la première passe : « la texture
   * est très moche, on dirait le bruit parasite sur un vieil écran télé, il
   * faut un truc plus minimaliste ». *Et c'était ma faute de cadrage* : je
   * l'avais réglé comme une MATIÈRE (0,38 d'alpha, soit ±48 niveaux), alors
   * qu'un dithering n'a besoin que de ±3 pour dissoudre une bande. **Un bruit
   * blanc qu'on voit est de la neige ; un bruit blanc qu'on ne voit pas est un
   * dither.**
   *
   * La matière, elle, viendra du caractère — étoiles ou métal brossé — et elle
   * aura une forme, ce qu'un bruit par pixel n'a pas.
   */
  if (!grain) return
  ctx.save()
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  const motif = ctx.createPattern(grainDuDecor(), 'repeat')
  if (motif !== null) {
    ctx.globalCompositeOperation = 'overlay'
    ctx.globalAlpha = ALPHA_GRAIN
    ctx.fillStyle = motif
    // ON COUVRE LA TOILE, pas une carte supposee : le sachet n'a pas le rapport
    // d'une carte, et *un grain qui s'arrete avant le bord laisse une bande qui
    // bande.* La transformation vient d'etre remise a l'identite, donc ces deux
    // nombres sont bien des pixels.
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height)
  }
  ctx.restore()
}

const cieux = new Map<Ciel, Promise<HTMLImageElement | HTMLCanvasElement | null>>()

function fondTeinte(ciel: Ciel): Promise<HTMLImageElement | HTMLCanvasElement | null> {
  const deja = cieux.get(ciel)
  if (deja !== undefined) return deja
  // UNE FAMILLE QUI A SON PROPRE DÉCOR NE SE VIRE PAS : il est déjà de sa
  // couleur, et *un virage posé dessus lui prendrait la sienne.*
  const promesse = fondPropre(ciel)
    ? fond(ciel)
    : // Et si la teinte échoue, on rend le ciel BLEU plutôt que rien : *un
      // décor de la mauvaise couleur vaut mieux qu'une carte sans décor.*
      fond().then((image) => (image === null ? null : (auCiel(image, ciel) ?? image)))
  cieux.set(ciel, promesse)
  return promesse
}

/**
 * LE SYMBOLE SE POSE EN QUALITÉ HAUTE, et c'est tout ce qu'il fallait.
 *
 * Keko : « je trouve l'image du symbole des PA sur les cartes un peu moche,
 * comme s'il n'était pas lissé ».
 *
 * *Et c'est exactement ça* : le dessin fait 1254 px de côté, l'orbe du coin en
 * occupe vingt-cinq sur une carte de main, et le jeton du cartouche une dizaine
 * — **une réduction de cinquante fois.** Un `drawImage` la fait par défaut en
 * qualité BASSE, c'est-à-dire en lisant quatre pixels de la source et en
 * ignorant les deux mille cinq cents autres : le cercle se crénèle et le filet
 * d'ambre clignote d'une taille de carte à l'autre.
 *
 * **ET LA PYRAMIDE DE MOITIÉS, QUE J'AI ÉCRITE D'ABORD, ÉTAIT UNE FAUSSE BONNE
 * IDÉE.** Réduire de moitié en moitié est le bon réflexe quand chaque passe est
 * mauvaise — c'est ce que fait un mipmap — mais *deux passes soignées ne valent
 * pas une seule* : chacune refiltre ce que la précédente a déjà lissé. Mesuré
 * contre un rééchantillonnage de référence, écart moyen sur 255 à la taille
 * d'une carte de main :
 *
 * | | une passe |
 * |---|---|
 * | qualité basse, le défaut | 23,6 |
 * | **qualité haute** | **7,8** |
 * | paliers de moitiés, chacun en qualité haute | 14,8 |
 *
 * *La bonne réponse était la ligne qui manquait, pas l'échafaudage autour.*
 *
 * Si un navigateur ignorait `imageSmoothingQuality`, il retomberait sur la
 * qualité basse — l'état d'avant, pas pire.
 *
 * **ET IL SE POSE EN `contain`, JAMAIS DANS UN CARRÉ IMPOSÉ.** Le fichier a
 * d'abord été carré (1254 x 1254), donc l'étirer dans une boîte carrée ne se
 * voyait pas ; la mise à jour de Keko fait 1226 x 1167, et le même code
 * l'aurait **comprimée de 5 % en largeur** — le disque serait devenu un ovale,
 * sans qu'aucune erreur ne le dise. *Une image dessinée par Keko se pose comme
 * il l'a dessinée* : on lit le rapport de ce qu'on a vraiment chargé, la règle
 * déjà payée sur les créatures et sur le dos de carte.
 *
 * **Et c'est EXACTEMENT ce que fait le `<img>` de l'orbe du joueur**
 * (`object-fit: contain`), ce qui est tout l'intérêt : *un seul fichier, trois
 * endroits, et ils ne peuvent pas se poser de trois façons.*
 *
 * *Ce que `contain` borne ici est la LARGEUR*, puisque le dessin est plus large
 * que haut — donc **le diamètre du disque ne bouge pas** (80,7 % de la largeur
 * contre 81,7 % avant, mesuré), et les réglages validés par Keko sur le chiffre
 * qu'il contient tiennent sans retouche.
 */
function poserSymbole(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  taille: number,
): void {
  ctx.imageSmoothingQuality = 'high'
  const echelle = Math.min(taille / image.width, taille / image.height)
  const l = image.width * echelle
  const h = image.height * echelle
  ctx.drawImage(image, x + (taille - l) / 2, y + (taille - h) / 2, l, h)
}

/** Le symbole du coût, chargé une fois lui aussi. */
let symboleCout: Promise<HTMLImageElement | null> | null = null

function coutPeint(): Promise<HTMLImageElement | null> {
  symboleCout ??= charger(urlDuCout())
  return symboleCout
}

function charger(url: string): Promise<HTMLImageElement | null> {
  return new Promise((resoudre) => {
    const image = new Image()
    image.crossOrigin = 'anonymous'
    image.onload = () => resoudre(image)
    image.onerror = () => resoudre(null)
    image.src = url
  })
}

/**
 * LE ROGNAGE SE PLAFONNE : une image trop loin du rapport de la carte RENTRE
 * au lieu de se faire couper.
 *
 * `cover` remplit toujours la boîte, donc il rogne autant qu'il faut — ce qui
 * va très bien tant que l'image est à peu près au gabarit, et détruit celles
 * qui ne le sont pas. Keko, sur le chat de Schrödinger (960 x 511, rapport
 * 1,88) : « l'image est centrée mais le dessin de wiki montre le chat sur la
 * gauche ». En `cover` on lui coupait **63 % de sa largeur.**
 *
 * **MESURÉ SUR 500 IMAGES DU CATALOGUE**, et c'est la mesure qui fixe le
 * chiffre : le rognage médian vaut **8 %** — donc l'immense majorité sont des
 * portraits verticaux qu'il ne faut surtout pas toucher — et seules **5,4 %**
 * dépassent le quart. À ce plafond, **aucune image ne couvre moins de 70 % de
 * la boîte** : *elle reste grande, elle n'est plus amputée.*
 *
 * | plafond | cartes touchées | couverture la plus basse |
 * |---|---|---|
 * | 10 % | 43 % | 58 % |
 * | 20 % | 8,0 % | 66 % |
 * | **25 %** | **5,4 %** | **70 %** |
 * | 35 % | 1,4 % | 81 % |
 *
 * **ET ON NE DÉCALE PAS**, ce qui était l'autre piste : il faudrait savoir OÙ
 * est le sujet, et **2 754 des 2 973 images sont des JPEG**, donc sans canal
 * alpha à mesurer. *Un mécanisme qui ne vaudrait que pour les douze SVG du
 * catalogue n'est pas une règle, c'est une exception* — et sur une photo,
 * deviner le sujet revient à le couper une fois sur deux. La règle du projet
 * est écrite dans l'autre sens : **un repère calé sur la marge d'un dessin se
 * déplace avec le dessin**, et ici il n'y a aucune marge fiable.
 *
 * **ET TOUT SE CALE EN HAUT — ce qui déborde comme ce qui manque.** Keko :
 * « parfois l'image est coupée en hauteur, tu crois qu'on pourrait adapter la
 * hauteur/largeur d'une manière plus adéquate ? »
 *
 * *Les deux cas tombent sous la même raison* : **le bas de la carte passe sous
 * le voile du texte** (plein à 78 %) **et sous le nom** (peint à 66,5 %). Ce
 * qui manque en bas ne se voit pas ; ce qu'on y coupe ne se perd pas.
 *
 * **Ce que le centrage coûtait, mesuré sur 85 portraits** : 19 % sont plus
 * hauts que le gabarit, donc rognés en hauteur — et centrés, **ils perdaient
 * la MOITIÉ de ce rognage par le HAUT, c'est-à-dire la tête.**
 *
 * | | rapport | coupé | dont EN HAUT |
 * |---|---|---|---|
 * | Hokusai | 0,48 | 25 % | **13 %** |
 * | Mourad II | 0,57 | 19 % | **9 %** |
 * | Hannibal Barca | 0,64 | 10 % | **5 %** |
 *
 * *Sur un portrait, le visage est en haut* — c'est vrai d'une photo
 * d'identité, d'un buste peint et d'une estampe en pied. **Caler en haut ne
 * perd donc jamais le sujet, et ce qu'il sacrifie était déjà sous le texte.**
 *
 * **ET ON NE DÉCALE PAS AU JUGÉ**, ce qui était l'autre piste : il faudrait
 * savoir OÙ est le sujet, et **2 754 des 2 973 images sont des JPEG**, donc
 * sans canal alpha à mesurer. *Un mécanisme qui ne vaudrait que pour les douze
 * SVG du catalogue n'est pas une règle, c'est une exception* — et sur une
 * photo, deviner le sujet revient à le couper une fois sur deux. La règle du
 * projet est écrite dans l'autre sens : **un repère calé sur la marge d'un
 * dessin se déplace avec le dessin**, et ici il n'y a aucune marge fiable.
 * *Le haut, lui, n'est pas une devinette : c'est une propriété du genre.*
 *
 * Ce qui reste découvert laisse voir le **fond peint** — dégradé, vignettage,
 * grain — qui est déjà là et n'a rien à apprendre.
 *
 * Ce qui reste découvert laisse voir le **fond peint** — dégradé, vignettage,
 * grain — qui est déjà là et n'a rien à apprendre.
 *
 * **Sans plafond, le cadrage est celui d'avant au pixel** : c'est l'absence du
 * paramètre qui dit « ne rien changer ici », comme `caseDeCarte` sans
 * assiette. Le DÉCOR ne le passe donc pas — il est au gabarit, et le rogner
 * moins laisserait un trou dans le fond de la carte.
 */
const PLAFOND_ROGNAGE = 0.25

// Le décor d'une arme est un CANVAS (le fichier viré au rouge), pas une
// image : les deux portent `width`/`height`, donc le cadrage ne change pas.
function couvrir(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement | HTMLCanvasElement,
  x: number,
  y: number,
  l: number,
  h: number,
  plafond?: number,
): void {
  const pleine = Math.max(l / image.width, h / image.height)
  const rentre = Math.min(l / image.width, h / image.height)
  const echelle = plafond === undefined ? pleine : Math.min(pleine, rentre / (1 - plafond))
  const il = image.width * echelle
  const ih = image.height * echelle
  // CALÉ EN HAUT DÈS QU'IL Y A UN PLAFOND, qu'il reste du jeu ou qu'on
  // déborde : *ce qui sort de la carte sort par le bas, là où le texte est*.
  // Sans plafond, le `cover` remplit exactement et il n'y a rien à décider —
  // c'est le décor, et l'absence du paramètre dit « ne rien changer ici ».
  ctx.drawImage(image, x + (l - il) / 2, plafond === undefined ? y + (h - ih) / 2 : y, il, ih)
}

/**
 * LES TROIS CRANS DU CARTOUCHE, du plus grand au plus petit — et **on prend le
 * plus grand qui TIENT**, pas celui que le nombre de caractères annonce.
 *
 * Keko : « pourquoi le texte de description de Riposte est si petit, alors
 * qu'il y a clairement la place sur 3 lignes ? on se limite à deux lignes et
 * petite écriture ».
 *
 * *Deux règles se combattaient, et elles ont fait exactement l'inverse de ce
 * qu'on voulait* : le cran se choisissait sur la LONGUEUR du texte, puis une
 * seconde descendait encore d'un cran dès que le repli coûtait une ligne de
 * plus. Un effet d'une seule phrase qui tombait sur trois lignes se faisait
 * donc rapetisser **jusqu'à n'en plus tenir que deux** — alors que la bande
 * en accepte trois sans discuter.
 *
 * **Compter les caractères, c'est deviner ; replier, c'est mesurer.** La bande
 * a une hauteur, le repli donne un nombre de lignes, et le produit se compare :
 * on essaie les crans dans l'ordre et on garde le premier qui rentre. *C'est la
 * règle de la composition d'une pièce et du nom d'une carte — la taille cède
 * jusqu'à ce que tout tienne* — simplement prise par l'autre bout, puisqu'ici
 * c'est la place qui est large et le texte qui était trop petit.
 *
 * La règle des trois lignes n'était d'ailleurs pas une règle : elle valait pour
 * la COMPOSITION d'une pièce, où une entrée par ligne est ce qu'on dessine, et
 * elle avait suivi jusqu'au cartouche, où une phrase n'a aucune raison de
 * compter ses lignes.
 */
const CRANS_EFFET = [7, 6.4, 5.4] as const

/**
 * **LE CORPS QUE L'ENCADRÉ DOIT PRENDRE POUR PARLER À LA VOIX D'UNE CARTE.**
 *
 * Les deux textes sont écrits dans leur propre repère de 100 unités de large —
 * la carte pour le cartouche, la plaque pour le glossaire — donc à l'écran leur
 * corps est dans le rapport de leurs LARGEURS. *Deux repères qui s'ignorent
 * donnent deux échelles*, et c'est ce que Keko lisait comme « trop gros sur
 * PC » : la plaque a un plancher en pixels pour rester lisible sur téléphone,
 * et sur un grand écran ce plancher ne mord plus.
 *
 * On prend le cran du HAUT, celui d'une description ordinaire. *Le cartouche
 * d'une carte longue descend d'un cran, mais l'encadré ne peut pas le suivre* :
 * il se montre à côté de plusieurs cartes, et **un encadré qui changerait de
 * corps d'une carte à l'autre se lirait comme deux objets différents.**
 */
export function corpsGlossaire(largeurCarte: number, largeurPlaque: number): number {
  return CRANS_EFFET[0] * (largeurCarte / largeurPlaque)
}
/** Jusqu'où le cartouche peut descendre avant de mordre sur le pied. */
const BAS_CARTOUCHE = 0.915
/** D'où part sa première ligne. */
const HAUT_CARTOUCHE = 0.755
/** L'interligne, en part du corps. */
const INTERLIGNE_EFFET = 1.25

/**
 * LE TITRE A DEUX CRANS, ET IL PASSE À LA LIGNE AVANT DE RAPETISSER.
 *
 * Keko : « je trouve la police du titre trop grosse pour les mots courts et
 * trop petite pour les mots longs, on peut pas faire 2 lignes de titre quand
 * c'est trop long plutôt que réduire ? »
 *
 * *Les deux moitiés de sa phrase disent la même chose* : ce qui gêne n'est
 * aucune des deux tailles, c'est l'ÉCART entre deux cartes voisines — « Plus »
 * en grand à côté de « Visage avec un léger sourire » en minuscule. Mesuré sur
 * les cinq catalogues, la taille allait de **10,5 U à 5,66 U** (soit 1,86 fois)
 * et **848 cartes touchaient le plancher**, donc sortaient tronquées.
 *
 * **C'est la règle du cartouche, prise par l'autre bout** — « on prend le plus
 * grand cran qui tient, plus celui que la longueur annonce » — et c'est aussi
 * celle que Keko avait posée pour les encadrés du glossaire : *« je voudrais
 * que la taille soit fixe, on va à la ligne si ça ne loge pas ».*
 *
 * Ce que ça donne, mesuré :
 *
 * **DEUX CRANS, ET LE SECOND EST CELUI QUI TIENT DEUX LIGNES.** La bande du
 * titre est courte — voir `basDuNom` : à peine une quinzaine d'unités entre la
 * plaque et l'encre du cartouche — donc deux lignes n'y tiennent qu'à 7,3 U.
 * *Ce n'est pas un chiffre choisi, c'est le plus grand qui rentre*, mesuré
 * dans les deux moteurs de carte.
 *
 * Ce que ça donne : **l'écart entre deux cartes voisines tombe de 86 % à
 * 23 %**, et **plus une seule carte n'est tronquée** — contre 848 au plancher.
 *
 * | | 9,5 U | 7,3 U | la taille cède |
 * |---|---|---|---|
 * | **emoji** | 74,4 % | 25,4 % | 0,3 % |
 * | animaux | 62,0 % | 38,0 % | 0 % |
 * | peintures | 46,6 % | 50,5 % | 2,9 % |
 * | personnages | 89,5 % | 10,4 % | 0,1 % |
 * | le jeu | **100 %** | — | — |
 *
 * **ET KEKO A TRANCHÉ LA TAILLE FIXE** — « je préfère taille fixe » — **mais
 * sur la PLAQUE CLAIRE seulement**, voir `CRAN_PLAQUE` : c'est là que l'écart
 * se voyait, et c'est là qu'il y a une zone de texte dont le bord se compare.
 * En gabarit le titre est calé sur l'encoche du cadre, un réglage qu'il a
 * validé — *une taille fixe l'en décrocherait pour supprimer un écart qui n'y
 * existe pas*, puisque 100 % des noms du jeu tiennent sur une ligne.
 *
 * `?titre=crans` rend les deux crans à la plaque : *ce qui a servi à choisir
 * doit rester ouvrable.*
 */
const CRANS_NOM: readonly number[] = [9.5, 7.3]

/** La plaque prend sa taille fixe, sauf si l'on redemande les deux crans. */
const PLAQUE_FIXE = new URLSearchParams(location.search).get('titre') !== 'crans'

/** L'interligne du titre, en part du corps — serré, ce n'est pas un paragraphe. */
const INTERLIGNE_NOM = 0.9

/**
 * CE QUI BORNE LE TITRE PAR LE HAUT : la plaque quand il y en a une, la montée
 * du voile sinon.
 *
 * *Sur une plaque claire la borne est dure* — le texte est sombre, il ne peut
 * pas sortir du blanc. **En gabarit il n'y a rien de dur** : le nom est posé
 * sur l'illustration, cerné de noir, et ce qui le borne est que *plus haut le
 * voile sombre s'éteint et le texte cesse d'être net.* À 58 % le voile vaut
 * encore 0,42, ce qui suffit à un texte cerné ; c'est trois points sous la
 * plaque, et ces trois points sont ce qui permet au gabarit de tenir un cran
 * de plus.
 */
const HAUT_NOM_GABARIT = 0.58

/**
 * ET CE QUI LE BORNE PAR LE BAS N'EST PAS LE CARTOUCHE, C'EST SON ENCRE.
 *
 * `HAUT_CARTOUCHE` est le CENTRE de sa première ligne, donc ses capitales
 * montent bien au-dessus — de son ascendante, soit 0,82 du corps au pire cas
 * (une capitale accentuée en Baloo 2). **Borner le titre à 105,7 U faisait
 * tomber son trait de soulignement en plein dans le cartouche**, et ça ne se
 * voyait pas au calcul : *une ligne de base n'est pas un bord.*
 *
 * On prend le pire cas — le plus grand cran du cartouche, sa plus haute
 * capitale — parce que *la taille du cartouche n'est pas encore connue quand
 * on choisit celle du titre.*
 */
const basDuNom = (): number => HAUT_CARTOUCHE * HAUT - 0.82 * CRANS_EFFET[0] * U

/**
 * Le dégagement TOTAL, moitié en haut et moitié en bas : sans lui le bloc
 * affleurerait la plaque et le cartouche, et *un contenant qui ne contient pas
 * ment.*
 *
 * **Il est petit parce que la borne du bas est déjà PESSIMISTE** — elle réserve
 * l'ascendante d'une capitale accentuée que la plupart des cartouches n'ont
 * pas, donc il reste en pratique deux à trois unités de plus. *Un coussin
 * posé par-dessus un pire cas se paie deux fois*, et ici il se paierait d'un
 * cran de titre entier.
 */
const AIR_NOM = 0.5

/**
 * L'AIR AU-DESSUS DU TITRE, SUR UNE PLAQUE CLAIRE — et il est CONSTANT.
 *
 * Keko : **« quand il y a deux lignes la distance par rapport au haut de la
 * zone de texte à fond blanc est réduite : je voudrais qu'il soit le même peu
 * importe le nombre de lignes. »**
 *
 * *Le bloc se CENTRAIT dans la bande*, donc un titre de deux lignes montait de
 * deux unités et venait affleurer la plaque pendant qu'un titre d'une ligne
 * gardait son dégagement. **Un bloc dont la hauteur change doit s'accrocher
 * par le bord qui ne bouge pas** — la règle déjà payée sur la colonne de
 * boutons du butin — et ici ce bord est le haut de la plaque.
 *
 * ***ET C'EST CE QUI IMPOSE LA TAILLE, au lieu de la choisir.*** Avec un air
 * fixe en haut, le pire cas — deux lignes — doit tenir dans ce qui reste :
 * `t = (bande − air) / (ascendante + interligne + descendante)`. Écrire 7,3
 * et poser l'air par-dessus ne laisserait que 0,8 U de dégagement, soit un
 * titre collé au bord ; *une taille fixe qui ne tient pas son pire cas n'est
 * pas une taille fixe*, la boucle de cession la rendrait variable au premier
 * nom long.
 */
const AIR_HAUT_NOM = 1.8

/**
 * LA BOÎTE D'UN TITRE, et elle est COMMUNE à tous les titres.
 *
 * *On ne mesure pas l'encre du nom qu'on écrit* : un « É » monte plus haut
 * qu'un « e », donc deux titres de deux lignes se verraient attribuer deux
 * tailles — c'est exactement l'écart qu'on vient de retirer. **La boîte de
 * POLICE, elle, est bien trop généreuse** (1,60 fois le corps pour Baloo 2,
 * contre 1,06 d'encre réelle) : elle réserve la place d'accents et de
 * jambages qu'un nom n'a pas tous à la fois, et à ce compte-là deux lignes ne
 * tiendraient jamais.
 *
 * On prend donc l'encre d'une chaîne de RÉFÉRENCE qui porte tous les extrêmes
 * du français — capitales accentuées et jambages — mesurée une fois par
 * police. *C'est la règle des chiffres d'une liste, qui partagent la boîte
 * commune pour ne pas sauter d'une ligne à l'autre.*
 */
const EXTREMES_NOM = 'ÉÀÇgjqyp'

/**
 * **ET ELLE NE SE MET PAS EN CACHE.** Une boîte mesurée avant que la police
 * n'arrive répondrait pour la police de repli, et *le cache la garderait pour
 * toute la session* — c'est le piège déjà payé sur les cases du chargement.
 * Un `measureText` coûte un microseconde contre 1,6 ms pour peindre une
 * carte : il n'y a rien à économiser ici.
 */
function boiteDuNom(ctx: CanvasRenderingContext2D, taille: number): { haut: number; bas: number } {
  const m = ctx.measureText(EXTREMES_NOM)
  return { haut: m.actualBoundingBoxAscent / taille, bas: m.actualBoundingBoxDescent / taille }
}

/**
 * Coupe un titre pour qu'aucune de ses lignes ne dépasse `max`.
 *
 * **Un mot ne se coupe jamais** : un mot plus large que la carte reste seul
 * sur sa ligne et c'est la taille qui cédera — *mieux vaut un mot qui déborde
 * qu'un nom coupé en deux.* La règle de `replier`, en plus simple : un titre
 * n'a ni jeton ni mot lié.
 */
/**
 * LA TAILLE FIXE DE LA PLAQUE : la plus grande à laquelle DEUX lignes tiennent.
 *
 * *Elle se calcule, elle ne s'écrit pas* — **une taille de référence doit se
 * dériver de ce à quoi elle fait référence** : l'air au-dessus, la bande
 * disponible, et les métriques réelles de la police. Mesurée à ~6,5 U.
 *
 * Les ratios de `boiteDuNom` ne dépendent pas de la taille d'essai, donc un
 * seul appel suffit.
 */
function cranDeLaPlaque(
  ctx: CanvasRenderingContext2D,
  police: (t: number) => string,
  sous: number,
  hautBande: number,
): number {
  const essai = 10 * U
  ctx.font = police(essai)
  const b = boiteDuNom(ctx, essai)
  const place = basDuNom() - hautBande - (AIR_HAUT_NOM + AIR_NOM) * U
  return place / (b.haut + INTERLIGNE_NOM + Math.max(b.bas, sous))
}

function replierNom(ctx: CanvasRenderingContext2D, nom: string, max: number): string[] {
  const lignes: string[] = []
  let courante = ''
  for (const mot of nom.split(' ')) {
    const essai = courante === '' ? mot : `${courante} ${mot}`
    if (courante !== '' && ctx.measureText(essai).width > max) {
      lignes.push(courante)
      courante = mot
    } else courante = essai
  }
  if (courante !== '') lignes.push(courante)
  return lignes
}

/**
 * CHOISIT LE CRAN DU TITRE : le plus grand qui tienne en DEUX LIGNES au plus.
 *
 * `sous` est la place que le trait de soulignement réclame sous la dernière
 * ligne — nulle sur une plaque claire, qui n'en a pas. **C'est lui qui décide
 * tout en gabarit** : il coûte 0,68 du corps, donc deux lignes à 9,5 U y
 * demandent 22,8 U pour 19,5 disponibles, et le titre descend d'un cran. *Sur
 * la plaque, qui n'a pas de trait, le cran du haut tient les deux lignes.*
 *
 * **Et sous le dernier cran, la taille cède**, exactement comme pour le
 * cartouche : *un canvas écrit tout droit et laisse déborder sans rien
 * signaler*, donc il faut un fond à l'échelle et pas seulement deux marches.
 */
function corpsDuNom(
  ctx: CanvasRenderingContext2D,
  nom: string,
  max: number,
  police: (t: number) => string,
  sous: number,
  hautBande: number,
  fixe: boolean,
): { taille: number; lignes: string[]; haut: number } {
  const place = basDuNom() - hautBande - AIR_NOM * U
  const essai = (t: number): { lignes: string[]; haut: number } => {
    ctx.font = police(t)
    const lignes = replierNom(ctx, nom, max)
    const b = boiteDuNom(ctx, t)
    const haut =
      b.haut * t + (lignes.length - 1) * INTERLIGNE_NOM * t + Math.max(b.bas * t, sous * t)
    return { lignes, haut }
  }
  // LA TAILLE FIXE NE S'ESSAIE PAS, ELLE EST DÉJÀ LA BONNE : elle a été
  // calculée pour que deux lignes tiennent. *Il ne reste que le cas où le nom
  // en demande trois*, et là c'est la taille qui cède, comme ailleurs.
  const crans = fixe ? [cranDeLaPlaque(ctx, police, sous, hautBande) / U] : CRANS_NOM
  for (const cran of crans) {
    const r = essai(cran * U)
    if (r.lignes.length <= 2 && r.haut <= place) return { taille: cran * U, ...r }
  }
  let t = (crans[crans.length - 1] as number) * U
  let r = essai(t)
  while ((r.lignes.length > 2 || r.haut > place) && t > 5 * U) {
    t *= 0.95
    r = essai(t)
  }
  return { taille: t, ...r }
}

function corpsDuCartouche(
  ctx: CanvasRenderingContext2D,
  effet: readonly string[],
  max: number,
  famille = SERIF_EFFET,
): { taille: number; lignes: Mot[][] } {
  const place = HAUT * (BAS_CARTOUCHE - HAUT_CARTOUCHE)
  const pose = (t: number): Mot[][] => {
    ctx.font = `400 ${t}px ${famille}`
    return replier(ctx, effet, max, t, famille)
  }
  const tient = (t: number, l: readonly Mot[][]): boolean =>
    (l.length - 1) * t * INTERLIGNE_EFFET <= place
  for (const c of CRANS_EFFET) {
    const t = c * U
    const l = pose(t)
    if (tient(t, l)) return { taille: t, lignes: l }
  }
  // MÊME AU PLUS PETIT CRAN ÇA PEUT NE PAS TENIR : la taille cède alors d'elle-
  // même. *Un canvas écrit tout droit et laisse déborder sans rien signaler*,
  // donc il faut un fond à l'échelle, pas seulement trois marches.
  let t = CRANS_EFFET[CRANS_EFFET.length - 1]! * U
  let l = pose(t)
  while (!tient(t, l) && t > 2 * U) {
    t *= 0.92
    l = pose(t)
  }
  return { taille: t, lignes: l }
}

/**
 * Coupe les lignes du cartouche pour qu'aucune ne dépasse `max`.
 *
 * Le canvas n'a pas de mise en page : il faut mesurer mot à mot. Un mot seul
 * plus large que la carte reste sur sa ligne — mieux vaut un mot qui déborde
 * qu'un mot coupé en deux.
 */
function replier(
  ctx: CanvasRenderingContext2D,
  entrees: readonly string[],
  max: number,
  taille: number,
  famille = SERIF_EFFET,
): Mot[][] {
  const sorties: Mot[][] = []
  for (const entree of entrees) {
    let courante: Mot[] = []
    for (const mot of enMots(entree)) {
      const essai = [...courante, mot]
      // UN SYMBOLE EST UN MOT COMME UN AUTRE, mais sa largeur n'est pas celle
      // de son écriture : on mesure le DESSIN, sinon la ligne déborderait de
      // la différence — et *le canvas ne prévient jamais qu'il déborde.*
      if (courante.length > 0 && largeurLigne(ctx, essai, taille, famille) > max) {
        // ON NE COUPE PAS DEVANT UN MOT LIÉ : il repart avec celui qui le
        // précède, et on recule tant que le premier de la nouvelle ligne en est
        // un. *Jamais jusqu'à vider la ligne qu'on ferme* — une ligne vide ne
        // ferait que reporter le problème d'un cran.
        const report: Mot[] = [mot]
        while (courante.length > 1 && report[0].colle === true) {
          report.unshift(courante.pop() as Mot)
        }
        sorties.push(courante)
        courante = report
      } else courante = essai
    }
    sorties.push(courante)
  }
  return sorties
}


/**
 * LES CHIFFRES D'UNE CARTE SE DESSINENT, ILS NE S'ÉCRIVENT PLUS.
 *
 * Demandé par Keko : « pour l'Estoc, plutôt que "de 1 PA", on peut dessiner le
 * symbole de PA avec 1 dedans ? »
 *
 * **IL EN A EU TROIS, ET IL N'EN RESTE QU'UN.** Une épée rouge pour les dégâts
 * et le bouclier du combat pour le bloc ont vécu un essai ; Keko : « c'est pas
 * terrible en fait, on va supprimer les symboles à part celui des PA ». *Ce
 * qui distingue celui-ci des deux autres, c'est qu'il ne remplace pas un mot :
 * « PA » n'est pas un mot, c'est déjà un symbole écrit en lettres.* Les dégâts
 * et le bloc, eux, ont un nom — et un dessin qui redit un nom n'ajoute rien.
 *
 * *Et ça tient une règle que le projet suit déjà* : **le même symbole partout.**
 * L'orbe du coût est celle de la carte et celle du joueur ; le bouclier est
 * exactement celui de la barre de vie, au tracé près. Le cartouche cesse de
 * décrire ce que l'écran montre ailleurs — il le MONTRE.
 *
 * Le texte les porte sous forme de jetons (`{pa:1}`, `{epee:6}`,
 * `{bouclier:5}`) : *un jeton est un mot comme un autre pour le repli*, donc
 * il ne se coupe jamais de son chiffre, et le rendu 2D s'en sort avec un repli
 * en clair.
 */
type Jeton = { type: 'pa'; valeur: number } | { type: 'coeur' } | { type: 'main' }

function lireJeton(mot: string): Jeton | null {
  // LE COEUR N'A PAS DE VALEUR : son chiffre est du TEXTE, écrit avant lui —
  // « +15 ♥ ». *L'orbe des PA met son chiffre DEDANS parce qu'elle dit un
  // coût ; le coeur dit une mesure, et une mesure se lit à côté de son
  // symbole* — la grammaire de la bande de stats de l'armurerie.
  if (mot === '{coeur}') return { type: 'coeur' }
  // L'ÉVENTAIL NON PLUS : « +1 🖐 » se lit comme « +15 ♥ », et c'est voulu —
  // *une mesure se lit à côté de son symbole*, quelle que soit la mesure.
  if (mot === '{main}') return { type: 'main' }
  // L'ORBE, ELLE, PORTE TOUJOURS SON CHIFFRE — qu'elle dise un coût sur une
  // carte de combat ou une mesure sur une pièce. *Elle a eu une version nue le
  // temps d'un essai, le chiffre écrit devant comme pour le coeur* ; Keko l'a
  // reprise : « on peut mettre le 1 à l'intérieur du symbole ? » **C'est le
  // même objet qu'au coin de la carte et qu'au coin de l'écran, et celui-là a
  // toujours eu son chiffre dedans.**
  const m = /^\{(pa):(\d+)\}$/.exec(mot)
  if (m === null) return null
  return { type: 'pa', valeur: Number(m[2]) }
}

/**
 * LA HAUTEUR D'UN SYMBOLE, en part du corps du texte qui l'entoure.
 *
 * Keko : « les symboles sont un peu trop gros, mais la taille des chiffres
 * dedans est bien ». **Les deux se règlent donc séparément** : le dessin suit
 * ce nombre, le chiffre suit le CORPS DU TEXTE — *ce qui se lit comme un
 * chiffre se mesure au texte qui l'entoure, pas au cadre où il est posé.*
 * Mêlés, réduire le symbole aurait emporté son chiffre avec lui.
 */
const HAUT_JETON = 1.28

/**
 * LE COEUR DESCEND D'UN CRAN, comme dans la bande de stats. Keko : « tu peux
 * réduire un peu la taille du coeur dans la description des objets ? il est un
 * peu gros par rapport au texte ».
 *
 * *À hauteur égale, une masse pleine pèse plus lourd qu'un disque cerclé* : ce
 * qui se lit n'est pas la boîte du symbole, c'est l'encre qu'il y a dedans. Le
 * rapport est celui que Keko a déjà validé sur la bande de stats (75 % contre
 * 84 %) — **deux dessins de densité différente ne se règlent pas au même
 * chiffre**, et le même couple se règle du même rapport partout.
 */
const PART_COEUR = 75 / 84

/**
 * L'ÉVENTAIL DE LA MAIN, en un seul endroit — *deux dessins qui décrivent la
 * même chose divergent au premier réglage.*
 *
 * Il vit dans la bande de stats de l'armurerie depuis que les mesures y sont
 * passées ; la Robe le fait entrer dans un cartouche, et `MainIcone` le lit
 * désormais ici plutôt que de porter ses propres nombres. C'est la règle déjà
 * payée par le coeur, qu'il avait fallu rejouer au `Path2D` pour la même
 * raison.
 */
export const MAIN_EVENTAIL = {
  /** Le viewBox d'origine : tout le reste est dans ce repère. */
  boite: [40, 34] as const,
  /** Une carte de l'éventail, et le pivot autour duquel les trois s'ouvrent. */
  carte: { x: 13.5, y: 5, l: 13, h: 20, r: 2 },
  pivot: [20, 30] as const,
  angles: [-22, 0, 22] as const,
  /** Celle du milieu est claire : c'est elle qu'on tient. */
  clair: '#f0d9a2',
  terne: '#c8ab6d',
  cerne: '#2a2118',
  trait: 1.5,
}

/**
 * ET IL EST UN CRAN PLUS GRAND QUE LE COEUR, pour la raison inverse.
 *
 * *À hauteur égale, trois traits espacés pèsent moins qu'une masse pleine* —
 * c'est exactement l'argument qui descend le coeur, pris par l'autre bout, et
 * ce sont les deux rapports que Keko a déjà validés sur la bande de stats
 * (75 et 93 contre 84 pour l'orbe).
 */
const PART_MAIN = 93 / 84

/**
 * **LES COULEURS DU COEUR, ET ELLES SONT LUES AUX DEUX ENDROITS.** Keko : « tu
 * peux rendre le coeur dans le texte des armures un peu plus flashy ? il est
 * trop sombre ».
 *
 * *Il était écrit deux fois* — une fois dans le dégradé SVG de la bande de
 * stats, une fois ici au canvas — et **deux endroits qui décrivent la même
 * couleur se désaccordent au premier réglage.** Celui-ci allait justement les
 * séparer : c'est le même symbole, il n'a pas à changer de teinte selon
 * l'écran où on le regarde.
 *
 * Ce qui a bougé, et pourquoi il paraissait sombre sur une carte :
 *
 * - **le bas du dégradé remonte** de 35 à 52 de luminance. *Un dégradé qui
 *   finit presque noir se moyenne en gris dès que la figure est petite* — sur
 *   une carte le coeur fait la taille du corps du texte, dix fois moins que
 *   dans la bande ;
 * - **le cerne s'allège**, de `#2a1013` à `#5c1b24` et de 2 à 1,6 d'épaisseur.
 *   Il sert à détacher la figure d'un fond CLAIR ; sur le voile sombre d'un
 *   cartouche il ne détache rien, il ne fait que manger le remplissage — et à
 *   cette taille, 5 % de la hauteur de chaque côté, c'est un tiers de la
 *   figure.
 *
 * La luminance moyenne passe de 70 à 96.
 */
export const COEUR_HAUT = '#ff7b82'
export const COEUR_MI = '#d33244'
export const COEUR_BAS = '#8e1a26'
export const COEUR_CERNE = '#5c1b24'
export const COEUR_TRAIT = 1.6

/** Le corps du chiffre posé dans l'orbe, en part du corps du texte. */
const CHIFFRE_DANS_PA = 0.94

/**
 * LE CHIFFRE RENTRE, QUEL QU'IL SOIT. *Un contenant qui ne contient pas ment*,
 * donc c'est la police qui cède — la règle déjà tenue par le disque du compte
 * des piles.
 */
function dansLeDisque(
  ctx: CanvasRenderingContext2D,
  valeur: number,
  corps: number,
  tientDans: number,
): string {
  let c = corps
  const police = (t: number): string => `600 ${t}px "Grenze Gotisch", Georgia, serif`
  ctx.font = police(c)
  while (ctx.measureText(String(valeur)).width > tientDans && c > corps * 0.5) {
    c *= 0.93
    ctx.font = police(c)
  }
  return police(c)
}

/**
 * LA PLACE RÉSERVÉE EST CELLE DU DESSIN, pas un carré pour tout le monde. Le
 * coeur est plus large que haut (40 x 37, le viewBox des stats) : à place
 * carrée il débordait de 4 % de chaque côté et venait coller le mot d'à côté.
 */
function largeurJeton(_ctx: CanvasRenderingContext2D, jeton: Jeton, taille: number): number {
  const h = taille * HAUT_JETON
  if (jeton.type === 'coeur') return h * PART_COEUR * (40 / 37)
  // L'ÉVENTAIL EST PLUS LARGE QUE HAUT (40 x 34) : *la place réservée est celle
  // du dessin*, plus un carré pour tout le monde — la règle que le coeur avait
  // déjà coûtée.
  if (jeton.type === 'main') return h * PART_MAIN * (40 / 34)
  return h
}

/** Dessine le jeton, son bord gauche en `x`, centré sur la ligne de base `y`. */
function peindreJeton(
  ctx: CanvasRenderingContext2D,
  jeton: Jeton,
  x: number,
  y: number,
  taille: number,
  symbole: HTMLImageElement | null,
): void {
  const h = taille * HAUT_JETON
  ctx.save()
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  if (jeton.type === 'coeur') {
    /**
     * **C'EST LE MÊME DESSIN QUE LE COEUR DES STATS, au tracé près.** Keko :
     * « j'ai l'impression que le logo de coeur n'est pas le même que dans les
     * stats au-dessus ».
     *
     * *Et il ne l'était pas* : j'en avais redessiné un en courbes de Bézier
     * plutôt que de reprendre le sien. **Deux dessins qui décrivent la même
     * chose divergent au premier réglage** — la règle déjà payée sur le paquet
     * des tas, qu'on n'a pas repeint au canvas pour cette raison.
     *
     * Le chemin SVG se rejoue tel quel dans un `Path2D`, à l'échelle de son
     * viewBox (40 x 37), avec son dégradé, son cerne et son reflet.
     */
    const hc = h * PART_COEUR
    const e = hc / 37
    ctx.translate(x, y - hc / 2)
    ctx.scale(e, e)
    const c = ctx.createLinearGradient(0, 0, 12, 37)
    c.addColorStop(0, COEUR_HAUT)
    c.addColorStop(0.6, COEUR_MI)
    c.addColorStop(1, COEUR_BAS)
    const forme = new Path2D(
      'M20 34.5C20 34.5 2.8 22.6 2.8 12.6 2.8 6.6 7.4 2 13.2 2 16.6 2 19 4.1 20 6.3 21 4.1 23.4 2 26.8 2 32.6 2 37.2 6.6 37.2 12.6 37.2 22.6 20 34.5 20 34.5Z',
    )
    ctx.fillStyle = c
    ctx.fill(forme)
    ctx.strokeStyle = COEUR_CERNE
    ctx.lineWidth = COEUR_TRAIT
    ctx.lineJoin = 'round'
    ctx.stroke(forme)
    // La lumière vient du haut, comme partout : un reflet sur le lobe gauche.
    const reflet = new Path2D('M9.5 9.5C10.6 7.4 12.6 6.2 14.6 6.4')
    ctx.strokeStyle = '#ffffffaa'
    ctx.lineCap = 'round'
    ctx.stroke(reflet)
    ctx.restore()
    return
  }

  if (jeton.type === 'main') {
    // L'ÉVENTAIL, REJOUÉ TEL QUEL depuis sa géométrie partagée : trois cartes
    // qui s'ouvrent, la claire au milieu. *Le paquet de pioche dit déjà « des
    // cartes » ; celui-ci dit « en main ».*
    const hm = h * PART_MAIN
    const e = hm / MAIN_EVENTAIL.boite[1]
    ctx.translate(x, y - hm / 2)
    ctx.scale(e, e)
    ctx.lineWidth = MAIN_EVENTAIL.trait
    ctx.lineJoin = 'round'
    ctx.strokeStyle = MAIN_EVENTAIL.cerne
    const { carte: k, pivot } = MAIN_EVENTAIL
    MAIN_EVENTAIL.angles.forEach((angle, i) => {
      ctx.save()
      ctx.translate(pivot[0], pivot[1])
      ctx.rotate((angle * Math.PI) / 180)
      ctx.translate(-pivot[0], -pivot[1])
      ctx.beginPath()
      ctx.roundRect(k.x, k.y, k.l, k.h, k.r)
      ctx.fillStyle = i === 1 ? MAIN_EVENTAIL.clair : MAIN_EVENTAIL.terne
      ctx.fill()
      ctx.stroke()
      ctx.restore()
    })
    ctx.restore()
    return
  }

  // L'ORBE DU COÛT, EN PETIT : le même objet que le coin de la carte et que le
  // coin de l'écran. Le disque peint reste le repli, parce qu'*un canvas ne
  // dessine rien du tout si l'image manque*.
  if (symbole !== null) poserSymbole(ctx, symbole, x, y - h / 2, h)
  else {
    ctx.beginPath()
    ctx.arc(x + h / 2, y, h / 2, 0, Math.PI * 2)
    ctx.fillStyle = '#1d1b17'
    ctx.fill()
    ctx.strokeStyle = '#f3e3c0'
    ctx.lineWidth = Math.max(1, h * 0.07)
    ctx.stroke()
  }
  ctx.fillStyle = '#f7ead0'
  ctx.font = dansLeDisque(ctx, jeton.valeur, taille * CHIFFRE_DANS_PA, h * 0.62)
  ctx.fillText(String(jeton.valeur), x + h / 2, y + h * 0.02)
  ctx.restore()
}

/**
 * UN MOT DU CARTOUCHE : du texte avec sa graisse, ou un symbole.
 *
 * Keko : « on peut mettre tous les chiffres et mots clés en gras (attaque,
 * bloquer) ». *Le canvas ne lit pas le balisage* — il retirait les `<b>` avec
 * le reste, donc les chiffres étaient gras en 2D et plats en 3D. Il faut donc
 * écrire une ligne en MORCEAUX, chacun avec sa police.
 */
/**
 * **UN MOT-CLÉ EST JAUNE, et c'est la couleur du titre de son encadré.**
 * Demandé par Keko : « on peut mettre en jaune les mots clés dans les textes
 * des cartes ? on peut utiliser la même couleur du titre des encadrés ».
 *
 * *Deux signaux pour un seul fait seraient un de trop* : le mot est déjà en
 * gras comme les chiffres, donc rien ne le distinguait de « attaque », qui
 * n'est pas un mot-clé et n'a pas d'encadré. **La couleur dit qu'il y a une
 * définition quelque part**, et c'est celle du titre qui la porte.
 */
/**
 * **UN MOT-CLÉ EST JAUNE, et c'est le jaune du JEU.** Il a d'abord été la crème
 * du titre de son encadré (`#e9d9ae`) ; Keko : « on peut mettre les mots clés
 * dans une couleur plus proche du jaune, plus visibles ? »
 *
 * *Une crème désaturée ne se distingue pas de l'ivoire du texte qu'elle
 * traverse* — elle disait « un peu plus clair », pas « va lire ailleurs ».
 * C'est l'ambre de l'énergie, la couleur que le jeu 2D porte depuis toujours
 * sur `--energie`, donc **on n'invente rien** : le jaune de ce jeu existe déjà.
 *
 * **Et le titre de l'encadré la suit**, puisque c'est tout le principe : la
 * couleur dit qu'il y a une définition quelque part, et c'est celle du titre
 * qui la porte. Elle était écrite deux fois — *deux endroits qui décrivent la
 * même couleur se désaccordent au premier réglage*, et c'est exactement ce qui
 * serait arrivé ici.
 */
const OR_MOT_CLE = '#ffc65c'

/**
 * **UN CHIFFRE PORTE LA COULEUR DE SA NATURE** : rouge ce qu'on inflige, bleu
 * ce qu'on encaisse. Demandé par Keko.
 *
 * *C'est une règle du jeu 2D que le 3D n'avait pas portée* — « seul le chiffre
 * DANS le texte garde la couleur de sa nature », écrit le jour où l'écusson du
 * coût a cessé d'être coloré. Les deux teintes sont celles de la racine
 * (`--ennemi`, et l'accent des cartes de défense) : **on ne colore pas, on
 * reprend.**
 *
 * **Mais c'est par CHIFFRE et non par carte**, et c'est ce qui change du 2D :
 * là-bas l'accent teinte tous les gras d'une même carte, donc le Coup de
 * bouclier peignait en bleu le chiffre de ce qu'il INFLIGE. *Une carte peut
 * dire les deux choses dans la même phrase* — la Riposte le fait — donc la
 * nature se balise au chiffre, pas à la carte.
 *
 * **ET LES TROIS ONT LE MÊME ÉCART AU GRIS, sinon une seule se lit.** Le bleu
 * a d'abord été l'accent pâle des cartes de défense (`#9fd0ff`) : il était
 * bien peint — mesuré sur la texture, 271 pixels exactement à cette valeur —
 * et il se lisait blanc. *Une couleur claire et peu saturée posée à côté d'un
 * crème ne dit pas une couleur, elle dit un reflet.* Les trois valent
 * aujourd'hui 148 à 163 d'écart entre leur canal le plus fort et le plus
 * faible : **deux teintes qui doivent se lire comme une paire ne peuvent pas
 * avoir deux saturations**, sinon l'une crie et l'autre se fond.
 */
const ROUGE_DEGATS = '#ff6b6b'
const BLEU_BLOC = '#5cc8ff'

/**
 * **ET LE SOIN EST VERT**, demandé par Keko dans la foulée des deux autres.
 *
 * C'est le vert de la SÈVE — le voile qui illumine la barre de vie quand elle
 * reçoit un soin — éclairci jusqu'à l'écart au gris des trois autres : *on
 * reprend la teinte du jeu, on n'en invente pas une.* Le médian de la sève
 * (`#4fc985`) n'avait que 122 d'écart, et la leçon du bleu pâle vaut ici aussi.
 */
const VERT_SOIN = '#50e88c'

/** Ce qu'un mot dit de lui-même, et qui décide de sa couleur. */
type Teinte = 'cle' | 'degats' | 'bloc' | 'soin'

const TEINTES: Record<Teinte, string> = {
  cle: OR_MOT_CLE,
  degats: ROUGE_DEGATS,
  bloc: BLEU_BLOC,
  soin: VERT_SOIN,
}

/**
 * **UN MOT PEUT ÊTRE LIÉ À CELUI QUI LE PRÉCÈDE** (`colle`) : le repli ne
 * coupera jamais devant lui.
 *
 * Keko, sur la Projection : « on devrait placer le "et" sur la deuxième ligne
 * avec étourdissement non ? », puis sur l'Agilité : « pareil, on peut mettre le
 * "votre" en dessous ». *Un mot-outil laissé seul au bout de sa ligne se lit
 * comme une coupure ratée* — il annonce un mot qui n'arrive qu'à la ligne
 * suivante.
 *
 * **L'insécable ne suffisait pas**, et c'est ce qui demande un drapeau : le
 * texte porte `&nbsp;`, que le DOM 2D respecte tout seul, mais au canvas les
 * deux mots sont séparés par une BALISE — « et » est ordinaire, le mot-clé est
 * jaune. *Deux couleurs ne peuvent pas tenir dans un seul mot*, donc le lien se
 * marque au lieu de se fondre.
 */
type Mot = ({ texte: string; gras: boolean; teinte?: Teinte } | { jeton: Jeton }) & {
  colle?: boolean
}

/** Découpe une entrée balisée en mots, chacun porteur de sa graisse. */
function enMots(entree: string): Mot[] {
  const mots: Mot[] = []
  let gras = false
  let teinte: Teinte | undefined
  // **UNE BALISE, UN AXE** : `<b>` porte la GRAISSE, les quatre autres la
  // COULEUR — `<k>` pour un mot-clé, `<d>` pour ce qu'on inflige, `<p>` pour ce
  // qu'on encaisse, `<s>` pour ce qu'on soigne.
  //
  // *Elles mettaient aussi en gras, et ça ne pouvait plus tenir* : Keko veut le
  // VERBE de la couleur de son chiffre — « Inflige » en rouge, « Bloque » en
  // bleu — mais le gras reste réservé aux chiffres et aux mots-règles. **Deux
  // décisions qui ne portent pas sur les mêmes mots ne peuvent pas voyager dans
  // la même balise**, et une couleur qui emporte une graisse avec elle oblige à
  // choisir entre les deux.
  //
  // Les deux s'imbriquent donc librement : `<d>Inflige <b>6</b></d>` colore les
  // deux mots et n'appuie que le chiffre.
  const COLORENT: Record<string, Teinte> = { '<k>': 'cle', '<d>': 'degats', '<p>': 'bloc', '<s>': 'soin' }
  // L'INSÉCABLE SURVIT AU DÉCOUPAGE, il n'est plus aplati en espace. C'est lui
  // qui porte le lien, et il valait un espace ordinaire jusqu'ici — donc le
  // `&nbsp;` du texte ne servait qu'au DOM.
  let colle = false
  // On coupe sur les balises ET sur les espaces : une balise peut ouvrir au
  // milieu d'une ligne, et un mot ne porte qu'une graisse.
  for (const bout of entree.replace(/&nbsp;/g, ' ').split(/(<\/?[^>]+>)/)) {
    if (bout === '') continue
    if (bout.startsWith('<')) {
      if (bout === '<b>') gras = true
      else if (bout === '</b>') gras = false
      else if (COLORENT[bout] !== undefined) teinte = COLORENT[bout]
      else if (bout === '</k>' || bout === '</d>' || bout === '</p>' || bout === '</s>') {
        teinte = undefined
      }
      continue
    }
    for (const brut of bout.split(' ')) {
      if (brut === '') continue
      // UN INSÉCABLE LIE DEUX MOTS PAR-DESSUS LA BALISE QUI LES SÉPARE, et il
      // compte des DEUX CÔTÉS : en fin de mot il retient le suivant, en tête il
      // se rattache au précédent. *Le second cas est celui du deux-points
      // français*, qui prend son espace insécable AVANT lui — et il arrive donc
      // en tête de bout, juste après une balise fermante.
      //
      // *À l'intérieur d'un même mot, il n'y a rien à marquer* : les deux
      // moitiés sont déjà inséparables et de la même couleur, il suffit de
      // rendre l'espace à l'affichage.
      const avant = brut.startsWith(' ')
      const apres = brut.endsWith(' ')
      const mot = brut.replace(/^ /, '').replace(/ $/, '').replace(/ /g, ' ')
      // Un insécable SEUL entre deux balises ne porte pas de mot : il ne fait
      // que passer le lien au suivant.
      if (mot === '') {
        colle = colle || avant || apres
        continue
      }
      const lie = colle || avant
      const jeton = lireJeton(mot)
      mots.push(jeton === null ? { texte: mot, gras, teinte, colle: lie } : { jeton, colle: lie })
      colle = apres
    }
  }
  return mots
}

/**
 * LES DEUX VOIX DU TEXTE D'UNE CARTE.
 *
 * Le SERIF est celle du gabarit — la voix des effets, face au Cinzel des noms.
 * La RONDE est celle d'une carte qui parle la langue d'une application : *Baloo
 * 2 est arrondie comme un emoji et lisible en corps de texte*, ce qu'une
 * fantaisie plus marquée ne tient pas sur deux lignes de cartouche.
 *
 * **Elle se demande EXPLICITEMENT**, et c'est le piège déjà payé sur Noto Color
 * Emoji : *une police Google n'est téléchargée que si le DOM l'emploie*, or ces
 * cartes ne sont peintes que sur un canvas — donc `document.fonts.ready` peut se
 * résoudre sans elle, et la texture partirait en cache écrite en Trebuchet.
 */
const SERIF_EFFET = '"Crimson Pro", Georgia, serif'
const RONDE = 'Baloo 2'
export const FAMILLE_RONDE = `"${RONDE}", "Trebuchet MS", sans-serif`

let RONDE_PRETE: Promise<unknown> | null = null
export function policeRonde(): Promise<unknown> {
  RONDE_PRETE ??= Promise.all([
    document.fonts.load(`400 64px "${RONDE}"`),
    document.fonts.load(`700 64px "${RONDE}"`),
    document.fonts.load(`800 64px "${RONDE}"`),
  ]).catch(() => null)
  return RONDE_PRETE
}

/**
 * La police d'un mot : le gras est celui du cartouche, pas un second corps.
 *
 * **La famille traverse toute la chaîne du texte**, mesure comprise : *si le
 * repli mesurait dans une police et l'écriture dans une autre, les lignes
 * seraient coupées au mauvais endroit* — et le canvas ne prévient jamais qu'il
 * déborde.
 */
function policeMot(taille: number, gras: boolean, famille = SERIF_EFFET): string {
  return `${gras ? 700 : 400} ${taille}px ${famille}`
}

function largeurMot(
  ctx: CanvasRenderingContext2D,
  mot: Mot,
  taille: number,
  famille = SERIF_EFFET,
): number {
  if ('jeton' in mot) return largeurJeton(ctx, mot.jeton, taille)
  ctx.font = policeMot(taille, mot.gras, famille)
  return ctx.measureText(mot.texte).width
}

/** La largeur d'une ligne, symboles et graisses compris. */
function largeurLigne(
  ctx: CanvasRenderingContext2D,
  mots: readonly Mot[],
  taille: number,
  famille = SERIF_EFFET,
): number {
  ctx.font = policeMot(taille, false, famille)
  const espace = ctx.measureText(' ').width
  return mots.reduce(
    (large, mot, i) => large + largeurMot(ctx, mot, taille, famille) + (i > 0 ? espace : 0),
    0,
  )
}

/**
 * Écrit une ligne centrée sur `cx`, en dessinant ses symboles au passage.
 *
 * **L'espace se porte en TÊTE de mot, jamais en queue.** Keko : « tu as mis un
 * espace avant et après ou juste après ? » — *juste après* : le symbole se
 * dessinait dès que le mot précédent était posé, donc il venait coller le mot
 * d'à côté et l'espace partait de l'autre côté. **Un seul endroit décide de
 * l'espace**, et c'est le mot qui arrive.
 */
function ecrireLigne(
  ctx: CanvasRenderingContext2D,
  mots: readonly Mot[],
  cx: number,
  y: number,
  taille: number,
  symbole: HTMLImageElement | null,
  famille = SERIF_EFFET,
): void {
  const couleur = ctx.fillStyle
  ctx.font = policeMot(taille, false, famille)
  const espace = ctx.measureText(' ').width
  let x = cx - largeurLigne(ctx, mots, taille, famille) / 2

  ctx.save()
  ctx.textAlign = 'left'
  mots.forEach((mot, i) => {
    if (i > 0) x += espace
    if ('jeton' in mot) {
      peindreJeton(ctx, mot.jeton, x, y, taille, symbole)
      x += largeurJeton(ctx, mot.jeton, taille)
      return
    }
    ctx.font = policeMot(taille, mot.gras, famille)
    ctx.fillStyle = mot.teinte === undefined ? couleur : TEINTES[mot.teinte]
    ctx.fillText(mot.texte, x, y)
    x += ctx.measureText(mot.texte).width
  })
  ctx.restore()
}

/**
 * Peint la carte et rend le canvas.
 *
 * Asynchrone pour deux raisons, et les deux sont des pièges : l'illustration
 * doit être chargée AVANT d'être peinte, et **les polices aussi** — un canvas
 * qui dessine avant `document.fonts.ready` retombe silencieusement sur la
 * police par défaut, et la carte sort en sans-serif sans qu'aucune erreur ne
 * le dise.
 */
export async function peindreCarte(
  carte: CarteAPeindre,
  largeur = LARGE,
  /**
   * UNE TOILE A REUTILISER — pour l'emoji anime, et seulement pour lui.
   *
   * *Une carte animee se repeint trente fois par seconde* : sans ca on
   * allouerait trente toiles de trois cents kilo-octets chaque seconde, et
   * **la texture devrait changer d'image a chaque fois.** Avec une toile
   * reutilisee, il ne reste qu'un `needsUpdate`.
   */
  toile?: HTMLCanvasElement,
): Promise<HTMLCanvasElement> {
  const canvas = toile ?? document.createElement('canvas')
  canvas.width = Math.round(largeur)
  canvas.height = Math.round(largeur * 1.4)
  const ctx = canvas.getContext('2d')
  if (ctx === null) return canvas
  /**
   * ON PEINT À LA TAILLE D'AFFICHAGE, on ne réduit plus après coup.
   *
   * La petite carte était peinte à 768 puis **rééchantillonnée en bitmap** :
   * le texte y était rastérisé à 19 px puis écrasé à 10, donc mou par
   * construction — Keko : « la résolution des textes hors zoom est très peu
   * lisible, la solution actuelle n'est pas terrible ».
   *
   * Une mise à l'échelle du CONTEXTE change tout : le moteur de police rend
   * alors chaque glyphe **à sa taille finale**, avec son antialiasing et son
   * hinting. Tout le dessin continue de parler en unités de 768 (`U`), donc
   * rien d'autre ne bouge. *Ce qui rend un texte net, ce n'est pas la taille
   * de la toile, c'est de le tracer une seule fois, à la bonne taille.*
   */
  if (largeur !== LARGE) ctx.scale(largeur / LARGE, largeur / LARGE)

  const [image, decor, symbole] = await Promise.all([
    illustration(
      carte.nom,
      carte.rarete,
      carte.matiere,
      carte.illustration,
      carte.emoji,
      carte.image,
      enBulle(carte) && !SANS_STICKER,
    ),
    // LE CIEL DIT LA FAMILLE : ce n'est pas un voile posé sur le décor, c'est
    // un AUTRE décor — le même fichier, viré une fois pour toutes à la couleur
    // de la famille. Une armure garde le bleu d'origine. Voir `fondTeinte`.
    FOND_PEINT ? null : carte.ciel === undefined ? fond() : fondTeinte(carte.ciel),
    coutPeint(),
    document.fonts.ready,
    // ET LA RONDE SE DEMANDE EXPLICITEMENT : voir `policeRonde`. *Une police
    // que seul le canvas emploie n'est jamais téléchargée*, donc
    // `document.fonts.ready` se résoudrait sans elle.
    carte.texte === 'bulle' ? policeRonde() : null,
  ])

  // LES COINS SONT RONDS, et c'est la texture qui les porte : tout ce qui
  // suit est peint dans un rectangle arrondi, et le canvas reste transparent
  // en dehors. Rayon : 3 % de la largeur, comme le `border-radius` du gabarit
  // 2D. Le matériau coupe ces coins (`alphaTest`) et laisse voir le laiton
  // arrondi du corps de la carte.
  const rayon = rayonDe(carte)
  ctx.beginPath()
  ctx.roundRect(0, 0, LARGE, HAUT, LARGE * rayon)
  ctx.clip()

  // LA PLAQUE : le laiton, assombri d'un voile uniforme. C'est ce voile seul
  // qui fait le relief -- une ombre sous la coque la « différenciait trop du
  // fond » (Keko). Sa teinte dit la RARETÉ ; le dos, lui, reste laiton —
  // *une carte retournée ne dit rien de ce qu'elle est.*
  ctx.fillStyle = laiton(ctx, carte.rarete)
  ctx.fillRect(0, 0, LARGE, HAUT)
  ctx.fillStyle = '#00000030'
  ctx.fillRect(0, 0, LARGE, HAUT)

  // LA COQUE, en laiton plein — déchirée, franche si c'est un trésor, ENCOCHÉE
  // si c'est une carte de DECK (les autres pistes restent sous `?cadre=`). Une
  // pièce d'équipement se reconnaît à son compteur : elle garde la déchirure,
  // parce que *c'est d'elle que les cartes sont arrachées.*
  const simple = carte.contour === 'simple'
  const deDeck = !simple && carte.tresor !== true && carte.compteur === undefined
  const piste = deDeck ? PISTE_CADRE : null
  const coque =
    carte.tresor === true ? CADRE_TRESOR : (piste !== null && SILHOUETTES[piste]) || DECOUPE
  /**
   * LE TRACÉ DU CADRE À UNE MARGE DONNÉE — et le contour simple est le seul qui
   * ne soit pas un polygone.
   *
   * **Il épouse exactement la carte** : même rectangle, même rayon de coin, donc
   * le liseré fait le tour sans jamais changer d'épaisseur. *C'est tout ce qu'on
   * lui demande* — une coque déchirée raconte un arrachement, un liseré régulier
   * ne raconte rien, et c'est ce qu'il faut quand il n'y a qu'une famille.
   *
   * **Le rayon se compte sur le bord EXTÉRIEUR**, donc il décroît d'autant qu'on
   * rentre : à rayon constant, les coins du cadre seraient plus épais que ses
   * côtés. Règle déjà payée sur les cases vides du chargement.
   */
  const tracer = (m: number): void => {
    if (simple) {
      ctx.beginPath()
      ctx.roundRect(m, m, LARGE - m * 2, HAUT - m * 2, Math.max(0, LARGE * rayon - m))
    } else chemin(ctx, coque, m, m, LARGE - m * 2, HAUT - m * 2)
  }
  ctx.save()
  tracer(0)
  ctx.clip()
  ctx.fillStyle = simple ? aplat(ctx, carte.rarete) : laiton(ctx, carte.rarete)
  ctx.fillRect(0, 0, LARGE, HAUT)
  ctx.restore()

  // LA SURFACE ET L'ILLUSTRATION EN PLEIN FORMAT, un cheveu à l'intérieur de
  // la coque, à la même découpe.
  /**
   * LA BORDURE EST UN POIL PLUS ÉPAISSE SUR LA PISTE ENCOCHÉE — demandé par
   * Keko en même temps que le recalage des entailles.
   *
   * *Elle n'a pas à être la même partout* : c'est un second signe, et il va
   * dans le sens du premier — une carte de deck est cerclée plus franchement
   * qu'une pièce, donc les deux se distinguent même là où l'encoche est cachée
   * par la voisine.
   */
  const marge = (simple ? CONTOURS[PISTE_CONTOUR] : piste === 'encoche' ? 1.85 : 1.163) * U
  /**
   * LE ROGNAGE DE CETTE CARTE-CI : zéro quand l'œuvre doit rentrer entière.
   *
   * **Le bloom le lit AUSSI**, et il le faut : *le bloom n'est pas le sujet,
   * c'est de la lumière tombée sur le décor* — cadré autrement que l'image, il
   * remplirait de lumière les bandes où il n'y a rien.
   */
  const rognage = carte.illustrationEntiere === true ? 0 : PLAFOND_ROGNAGE
  /**
   * LA BOÎTE DU SUJET — et ce n'est pas celle du DÉCOR.
   *
   * Le décor est le fond de la carte : il couvre toute la surface, et le rogner
   * moins y laisserait un trou. **Le sujet, lui, s'arrête au-dessus de la
   * plaque de texte quand il y en a une** : voir `HAUT_BULLE`.
   *
   * *Sans plaque, elle vaut la surface entière au pixel* — c'est l'absence du
   * thème qui dit « ne rien changer ici », comme `caseDeCarte` sans assiette.
   */
  /**
   * ET LE BLOOM A SA PROPRE BOÎTE, PLUS GRANDE QUE CELLE DU SUJET.
   *
   * Keko : « l'aura s'arrête net en haut comme si un mur invisible la
   * bloquait ». ***C'était un mur, et c'était le bord de la toile du bloom.***
   *
   * La chaîne, mesurée : la plaque a pris le bas de la carte, donc la fenêtre
   * du sujet est devenue plus LARGE que haute ; un emoji carré en `contain` y
   * est donc borné par la hauteur et la remplit entièrement ; et `couvrir`
   * cale en haut dès qu'il y a un plafond, donc le dessin touchait le bord
   * supérieur de sa boîte **par construction.** Le bloom étant peint dans
   * cette même boîte, sur une toile de 44 px, le flou de `adoucir` était coupé
   * net par le bord de la toile — *une ligne horizontale franche là où il
   * devrait s'éteindre.*
   *
   * C'est la règle déjà payée trois fois — le contour des cartes, le halo des
   * créatures, le slot allumé du chargement : ***une lueur qui se termine par
   * une arête n'est pas une lueur***, et **le débord de la texture doit être
   * exactement celui du plan.**
   *
   * Le sujet est donc posé EN RETRAIT dans sa fenêtre : la lumière a
   * `AIR_SUJET` de chaque côté pour mourir, elle s'éteint sur le cadre en haut
   * et sous la plaque opaque en bas. *Et ça règle la troisième demande par la
   * même porte* — « diminuer un peu la taille des emoji » : l'air qu'on donne
   * à la lueur, le sujet le rend.
   *
   * *Sans plaque, `air` vaut zéro et les trois boîtes se confondent au pixel*
   * — c'est l'absence du thème qui dit « ne rien changer ici », comme
   * `caseDeCarte` sans assiette.
   */
  const bulle = enBulle(carte)
  const fY = marge
  const fH = (bulle ? HAUT * HAUT_BULLE : HAUT - marge) - fY
  // LE STICKER PORTE SA MARGE DANS SA TOILE, donc la fenêtre lui rend l'air
  // d'autant : *le glyphe garde la taille qu'il avait nu.* La toile est plus
  // haute d'un facteur f, la boîte qui la contient doit l'être aussi.
  const f = bulle && !SANS_STICKER ? 1 + MARGE_STICKER * 2 : 1
  const air = bulle ? Math.max(0, AIR_SUJET * U * f - ((f - 1) * fH) / 2) : 0
  const aY = fY + air
  const aH = fH - air * 2
  ctx.save()
  tracer(marge)
  ctx.clip()
  // LE DÉCOR D'UNE CARTE D'EMOJI PREND LA NUIT DE SON CRAN, plus le bleu nuit
  // commun. Keko : « on peut ne plus utiliser Background.webp pour voir ? » —
  // *il n'était déjà plus utilisé*, le fond est peint depuis l'aplat ; ce
  // qu'il voyait, c'est le bleu nuit de base. La carte parle alors son cran
  // sur toute sa surface : le cadre, la plaque, les rayons, et le décor.
  // `?decor=bleu` rend le bleu nuit commun.
  const metalDecor = bulle && !DECOR_BLEU && carte.rarete !== undefined ? METAUX[carte.rarete] : undefined
  // ET ELLE REMONTE UN PEU VERS LE TON MOYEN : voir ECLAIRCIE_DECOR.
  const nuitHex =
    metalDecor === undefined
      ? undefined
      : melange(metalDecor[2], metalDecor[3], ECLAIRCIE_PAR_CRAN[carte.rarete!] ?? ECLAIRCIE_DECOR)
  if (FOND_PEINT)
    peindreDecor(ctx, carte.ciel, nuitHex === undefined ? undefined : couleurDe(nuitHex), undefined, !bulle)
  else {
    ctx.fillStyle = '#171b1d'
    ctx.fillRect(0, 0, LARGE, HAUT)
  }
  // LE FOND COMMUN D'ABORD, LE SUJET PAR-DESSUS. Demandé par Keko : une seule
  // image de décor pour toutes les cartes, et le modèle ne porte plus que ce
  // qu'il montre. Le repli reste celui d'avant — sans fond, la surface sombre
  // suffit et rien ne casse.
  if (decor !== null) {
    couvrir(ctx, decor, marge, marge, LARGE - marge * 2, HAUT - marge * 2)
    /**
     * ET SON EXPOSITION MONTE. Keko, deux passes plus tard : « je trouve le
     * background toujours trop sombre (miniature et zoom) ».
     *
     * *Le bloom n'éclaire qu'AUTOUR du sujet* — c'est ce qu'il voulait, et ça
     * ne dit rien des coins, qui restaient à 7 de luminance sur 255,
     * c'est-à-dire noirs. **Ce qui manquait, c'était le décor lui-même.**
     *
     * On le REDESSINE en `lighter` plutôt que de poser un voile clair : *une
     * addition de l'image sur elle-même garde son contraste et sa matière*, là
     * où un voile uniforme écrase les deux en les noyant de gris. C'est une
     * exposition qu'on monte, pas un rideau qu'on tire.
     */
    ctx.save()
    ctx.globalCompositeOperation = 'lighter'
    // ET ELLE SE COMPTE EN PASSES, pas en opacité : un `globalAlpha` plafonne
    // à 1, donc au-delà du double il faut REDESSINER. *L'exposition est un
    // nombre de fois, pas une transparence* — on ajoute l'image entière tant
    // qu'il reste de l'exposition à donner, et la dernière passe prend le
    // reste.
    const expo = carte.ciel === undefined ? EXPO_DECOR : EXPO_CIEL[carte.ciel]
    for (let reste = expo - 1; reste > 0.001; reste -= 1) {
      ctx.globalAlpha = Math.min(1, reste)
      couvrir(ctx, decor, marge, marge, LARGE - marge * 2, HAUT - marge * 2)
    }
    ctx.restore()
  }

  // LES TOUCHES DU CLAVIER, PUIS LES RAYONS DU CRAN, derrière le sujet — mode
  // emoji seulement. Keko : « et 1 + 2 on essaie ? ». *Les touches sont la
  // langue du dos et du sachet* — l'emoji est un sticker posé sur son
  // clavier — et elles prennent ici le ton du cran, à peine, parce que dans
  // la fenêtre d'art seule la couleur du cran a le droit de parler. *Ils sont
  // du décor, pas de la lumière du sujet* : ils viennent avant le bloom, qui
  // les éclaire comme il éclaire le reste. `?touches=0` et `?rayons=0`.
  if (bulle && !SANS_TOUCHES) {
    const ton = carte.rarete === undefined ? undefined : METAUX[carte.rarete]?.[2]
    if (ton !== undefined) {
      ctx.save()
      ctx.beginPath()
      ctx.rect(marge, fY, LARGE - marge * 2, fH)
      ctx.clip()
      peindreTouches(ctx, LARGE, HAUT, U * TOUCHES_ECHELLE, false, ton)
      ctx.restore()
    }
  }
  if (bulle && !SANS_RAYONS) peindreRayons(ctx, carte.rarete, marge, fY, LARGE - marge * 2, fH)

  /**
   * FOND, PUIS LUMIÈRE, PUIS SUJET — et c'est Keko qui a trouvé l'ordre : « on
   * peut pas faire dans l'ordre background > éclairage > illustration ? »
   *
   * **Je le croyais impossible, et je me trompais sur un fait vérifiable** :
   * j'avais posé la lumière PAR-DESSUS l'illustration en la supposant opaque.
   * Elle ne l'est pas — *ses images sont détourées* (94 % de pixels non opaques
   * pour le Glaive), donc le fond commun se voit dessous et la lumière a sa
   * place entre les deux. **Une supposition sur un fichier se mesure en une
   * ligne ; je ne l'avais pas fait.**
   *
   * Ce que l'ordre achète : **l'illustration n'est plus éclaircie du tout.**
   * Elle se pose nette sur une lumière qui, elle, a déjà fait son travail.
   *
   * **Et la lumière garde la FORME DE L'ARME**, qui est tout ce que Keko
   * demandait : on floute le SUJET — pas le fond, qui n'a pas de forme — et on
   * l'ajoute au fond. *Ce qui rayonne, c'est l'objet ; ce qui reçoit, c'est le
   * décor.*
   *
   * Le flou se fait par réduction puis agrandissement, jamais par `ctx.filter`
   * (Safari 16.4 contre une page qui vise 16.2, et un filtre ignoré
   * redessinerait le sujet NET en double exposition). L'alpha du sujet
   * traverse la réduction, donc le halo épouse sa silhouette.
   */
  if (image !== null && (!bulle || AVEC_LUEUR_EMOJI)) {
    const lArt = LARGE - marge * 2
    /**
     * LA TOILE DU BLOOM COUVRE LA FENÊTRE, LE SUJET EST EN RETRAIT DEDANS.
     *
     * *C'est la seule façon qu'une lueur s'éteigne au lieu d'être coupée* : son
     * flou est une moyenne glissante de deux pixels, donc il lui faut deux
     * pixels de toile au-delà du dessin — et `air * ech` en vaut trois.
     *
     * **Ce qui sort de la toile compte pour du noir** (voir `adoucir`) : une
     * lumière se dilue au bord, elle n'y rebondit pas. Donc le bord de la toile
     * n'est plus un mur, il est le point où il n'y a plus rien.
     *
     * *Sans plaque, `air` vaut zéro et cette toile est celle d'avant au pixel.*
     */
    const ech = 44 / lArt
    const petit = document.createElement('canvas')
    petit.width = 44
    petit.height = Math.max(1, Math.round(fH * ech))
    // ON LA RELIT À CHAQUE PEINTURE depuis qu'on la floute — d'où le drapeau,
    // qui évite au navigateur de la garder sur le GPU pour rien.
    const pctx = petit.getContext('2d', { willReadFrequently: true })
    if (pctx !== null) {
      pctx.imageSmoothingQuality = 'high'
      couvrir(pctx, image, 0, air * ech, petit.width, petit.height - air * ech * 2, rognage)
      /**
       * ET LA LUMIÈRE PREND LA COULEUR DU CIEL. Keko : « quand je zoom sur une
       * arme, l'image affichée est bleue, et certaines des cartes générées
       * aussi (ex : Fendre) ».
       *
       * *Le bloom n'est pas le sujet, c'est de la lumière tombée sur le
       * décor* — une lame bleue ajoutée sur tout le champ repeignait le ciel
       * teinté, d'autant plus que le sujet est large et clair. **Un
       * reflet prend la couleur de ce qu'il touche**, la règle déjà tenue par
       * le lustre de l'or.
       *
       * Il se vire sur la petite toile — quarante-quatre pixels de large —
       * donc ça ne coûte rien, là où teinter la carte entière se paierait à
       * chaque peinture.
       */
      const flou = pctx.getImageData(0, 0, petit.width, petit.height)
      if (carte.ciel !== undefined) virerLeCiel(flou.data, carte.ciel)
      // ET ON LE FLOUTE POUR DE BON. Voir {@link adoucir} : la réduction seule
      // laisse un aplat net avec son bord, donc un LISERÉ en marches plutôt
      // qu'une lueur. Le virage passe avant, sur des couleurs encore franches.
      adoucir(flou.data, petit.width, petit.height, RAYON_BLOOM)
      pctx.putImageData(flou, 0, 0)
      ctx.save()
      ctx.globalCompositeOperation = 'lighter'
      /**
       * ET ELLE SE RENFORCE QUAND LA CARTE EST PETITE. Keko : « j'ai
       * l'impression que la lumière du background se voit beaucoup moins sur
       * les cartes quand elles sont réduites ».
       *
       * *La peinture, elle, est identique* — mesuré à 256, 512 et 768 : même
       * luminance au pixel près, en proportion de la carte. **Ce qui change
       * est ce que l'oeil en fait** : le halo occupe la même fraction de carte,
       * mais cette fraction vaut 300 px au zoom et quatorze dans une case de
       * coffre, et un dégradé doux étalé sur quatorze pixels ne se lit plus.
       *
       * C'est la règle de la loupe du zoom, prise par l'autre bout : **on vise
       * le résultat perçu, pas le paramètre.** L'exposant reste faible — il ne
       * s'agit pas de rattraper le rapport des tailles (×6), seulement de
       * rendre l'effet lisible en petit sans l'écraser en grand.
       */
      ctx.globalAlpha = 0.34 * Math.pow(LARGE / largeur, 0.34)
      ctx.imageSmoothingQuality = 'high'
      ctx.drawImage(petit, marge, fY, lArt, fH)
      ctx.restore()
    }
  }


  if (image !== null) {
    couvrir(ctx, image, marge, aY, LARGE - marge * 2, aH, rognage)
  }
  // LE MASQUE DU SUJET, pour que les rayons clairs brillent SANS l'emoji
  // posé dessus — voir `masqueDuSujet`. L'ANIMÉ (`toile`) le prend aussi, et
  // le repeint À CHAQUE IMAGE dans la même petite toile : un masque réuni sur
  // toute l'animation laissait un fantôme sombre partout où l'emoji passe.
  if (bulle && !SANS_RAYONS && (FORCE_RAYONS[carte.rarete ?? ''] ?? 0) > 0) {
    MASQUES_DU_SUJET.set(
      canvas,
      masqueDuSujet(image as HTMLCanvasElement | null, marge, aY, aH, rognage, MASQUES_DU_SUJET.get(canvas)),
    )
  }

  // CE QUI PORTE LE TEXTE : un voile qui éteint l'image, ou une plaque posée
  // dessus. *Les deux font le même travail* — rendre le nom et le cartouche
  // lisibles — et ils ne le font pas dans la même langue : voir `CarteAPeindre.texte`.
  if (bulle) peindreBulle(ctx, marge, rayon, carte.rarete)
  else peindreVoile(ctx)
  ctx.restore()

  // LA MARQUE D'UNE CARTE DE DECK, quand une piste est à l'essai.
  if (piste === 'corne' || piste === 'perfore' || piste === 'ajour') {
    marquerLaCarte(ctx, piste, carte.rarete)
  }

  // ET LE TRÉSOR PORTE UN SECOND JONC, en retrait du premier.
  //
  // *Le coin coupé se lit dans l'éventail, le jonc se lit au coffre* : à 97 px
  // de large un biseau ne fait que 6 px, alors qu'un double trait se voit
  // encore. Deux signaux pour un seul fait, et ils disent la même chose — un
  // objet SERTI plutôt qu'une carte arrachée.
  //
  // Il se pose APRÈS l'illustration et AVANT les textes : le nom et le
  // cartouche passent dessus, et l'orbe du coût le recouvre là où ils se
  // croisent. *Un filet n'a jamais à traverser un chiffre.*
  if (carte.tresor === true) {
    const jonc = 3.2 * U
    ctx.save()
    // IL S'INTERROMPT AUTOUR DE L'ORBE, il ne passe pas dessous.
    //
    // Keko : « le symbole de coût se superpose avec la seconde ligne du cadre
    // et c'est moche ». L'orbe est un DISQUE posé dans le coin, donc ses côtés
    // sont transparents : le filet ressortait de part et d'autre et venait
    // mourir sur son bord. *Un trait qui rentre dans un objet et n'en sort pas
    // se lit comme un raccord raté.*
    //
    // Le décaler était exclu — l'orbe est le même symbole à la même place sur
    // TOUTE carte, c'est la règle de Keko — et l'enfoncer davantage aurait
    // demandé de l'inset au-delà du disque, soit un cinquième de la carte.
    // Reste la bonne réponse : *un sertissage s'ouvre pour laisser passer la
    // pierre.* Le tracé se découpe donc d'un disque un cheveu plus large que
    // l'orbe, par la règle du non-zéro inversée.
    ctx.beginPath()
    ctx.rect(0, 0, LARGE, HAUT)
    ctx.arc(ORBE_CX, ORBE_CY, ORBE_L / 2 + 1.1 * U, 0, Math.PI * 2)
    ctx.clip('evenodd')
    ctx.strokeStyle = laiton(ctx, carte.rarete)
    ctx.lineWidth = 0.55 * U
    ctx.globalAlpha = 0.72
    chemin(ctx, coque, jonc, jonc, LARGE - jonc * 2, HAUT - jonc * 2)
    ctx.stroke()
    ctx.globalAlpha = 1
    ctx.restore()
  }

  // TROIS CAS, PAS DEUX : l'orbe d'un coût, la case d'un compteur de cartes,
  // ou RIEN du tout. *Un coin nu vaut mieux qu'un symbole qui ment.*
  if (carte.compteur !== undefined) peindreCompteur(ctx, carte.compteur)
  else if (carte.cout !== null) peindreCout(ctx, carte.cout, symbole)
  if (carte.valeur !== undefined) peindreValeur(ctx, carte.valeur)
  peindreTextes(ctx, carte, symbole)
  return canvas
}

/**
 * UNE CASE EN FORME DE CARTE, de fer sombre, avec son chiffre dedans.
 *
 * Elle sert au COMPTEUR du coin : ce que la pièce ajoute au deck. Elle a servi
 * aussi à chaque ligne de la composition, dans le cartouche, jusqu'à ce que
 * celle-ci parte — *le zoom montre le set en vraies cartes, le cartouche le
 * répétait en moins lisible.*
 */
/**
 * LES CHIFFRES DE GRENZE GOTISCH SONT ELZÉVIRIENS, et c'est ce qui décentre.
 *
 * Le « 3 » descend sous la ligne de base, le « 1 » s'arrête dessus, le « 6 »
 * monte plus haut : leurs boîtes réelles n'ont pas la même hauteur. *Les
 * centrer CHACUN sur la sienne ferait sauter la ligne de base d'un voisin à
 * l'autre* — dans une liste de composition, deux chiffres côte à côte ne
 * peuvent pas être posés à deux hauteurs. On centre donc sur la boîte COMMUNE
 * à tous les chiffres, mesurée une fois pour toutes au canvas : 57 au-dessus
 * de la ligne de base et 10 en dessous, pour 100 px de police.
 */
const MILIEU_CHIFFRE = (0.57 - 0.1) / 2

function caseDeCarte(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  l: number,
  nombre: number,
): void {
  const h = l * 1.4
  const coin = l * 0.105
  const filet = Math.max(0.4, l * 0.058)

  ctx.save()
  ctx.shadowColor = '#0000008c'
  ctx.shadowOffsetX = l * 0.023
  ctx.shadowOffsetY = l * 0.033
  ctx.beginPath()
  ctx.roundRect(x, y, l, h, coin)
  const fer = ctx.createLinearGradient(x, y, x + l, y + h)
  fer.addColorStop(0, '#3b4148')
  fer.addColorStop(1, '#1b1f24')
  ctx.fillStyle = fer
  ctx.fill()
  ctx.restore()

  ctx.beginPath()
  ctx.roundRect(x + filet, y + filet, l - filet * 2, h - filet * 2, coin * 0.8)
  ctx.strokeStyle = '#8d9aa6'
  ctx.lineWidth = filet * 0.78
  ctx.stroke()

  const police = l * 0.97
  ctx.fillStyle = '#e8eef4'
  ctx.font = `600 ${police}px "Grenze Gotisch", Georgia, serif`
  ctx.textAlign = 'center'
  /**
   * UN CHIFFRE SE CENTRE SUR SON PROPRE ENCRE.
   *
   * Keko : « pourquoi le 3 en haut à gauche n'est pas centré verticalement
   * dans le symbole alors que pour le 6 c'est le cas ? » *Grenze Gotisch a des
   * chiffres elzéviriens* : mesuré à 100 px, le 6 monte à 57 et s'arrête à 1
   * sous la ligne de base, le 3 monte à 48 et descend à 10. Posés sur la même
   * boîte de police, leurs encres se retrouvent à onze points d'écart — le 6
   * tombait juste, le 3 pendait.
   *
   * *La case est seule sur sa carte* : rien ne l'oblige à s'aligner sur
   * personne, et ce qu'on veut est qu'elle soit centrée quel que soit le
   * chiffre. (Elle a eu un second mode, à ligne de base commune, du temps où
   * plusieurs cases s'empilaient dans le cartouche d'une pièce : *deux chiffres
   * voisins ne peuvent pas être posés à deux hauteurs.* Il est parti avec la
   * composition, et `git log` le garde.)
   */
  ctx.textBaseline = 'middle'
  const encre = ctx.measureText(String(nombre))
  const milieu = (encre.actualBoundingBoxDescent - encre.actualBoundingBoxAscent) / 2
  ctx.fillText(String(nombre), x + l / 2, y + h * 0.5 - milieu)
}

/**
 * LE COMPTEUR D'UNE PIÈCE : une case en forme de carte, de fer sombre.
 *
 * Volontairement PAS l'écusson d'énergie, qui est le même sur toute carte qui
 * coûte : *ce chiffre n'est pas un coût*, c'est ce que la pièce ajoute au
 * deck. Deux symboles pour deux choses.
 */
function peindreCompteur(ctx: CanvasRenderingContext2D, nombre: number): void {
  const l = 0.155 * LARGE
  // SON ÉCART AU BORD GAUCHE VAUT CELUI DU HAUT, et il fallait le CALCULER :
  // la coque de la carte est une découpe déchirée, pas un rectangle, et son
  // bord gauche rentre de 3 % au niveau du compteur là où le bord haut ne
  // rentre presque pas. Posés à la même distance du canvas, les deux écarts
  // n'étaient donc pas les mêmes à l'oeil — Keko : « décaler un poil le
  // symbole vers la droite, son écart au bord doit être le même que l'écart au
  // bord du haut ». *Une marge se mesure au bord qu'on VOIT, pas au bord de la
  // toile.*
  const x = 0.05 * LARGE
  // ET IL DESCEND D'UN CHEVEU. Demandé par Keko, pour la même raison en
  // miroir : la case est plus large que haute, donc à marges égales elle
  // paraît collée au bord du haut.
  const y = 0.034 * HAUT
  caseDeCarte(ctx, x, y, l, nombre)
}

/**
 * LE STYLE DU SYMBOLE DE COÛT, le temps d'en choisir un.
 *
 * Keko sur l'écusson actuel : « on dirait un bouclier, ça ne renvoie pas trop
 * à l'énergie, et la couleur rouge est un peu bizarre ». Les deux gênes ont la
 * même racine : c'est un BLASON — pointe en bas, comme un écu — et il est
 * ROUGE, alors que l'énergie du joueur est un orbe d'OR dans l'interface.
 * *Deux objets qui doivent être le même n'ont jamais eu ni la même forme ni la
 * même couleur.*
 *
 * Les candidats se jugent sur `?ecusson`, à la taille réelle. Cette variable
 * n'existe que pour ça : une fois le choix fait, il ne reste qu'un dessin.
 */
export type StyleCout = 'blason' | 'losange' | 'hexagone' | 'orbe' | 'eclat'
let styleCout: StyleCout = 'orbe'

export function choisirStyleCout(style: StyleCout): void {
  styleCout = style
}

/** Le socle sombre, le filet de laiton, puis le coeur : commun à tous. */
function serti(
  ctx: CanvasRenderingContext2D,
  forme: (marge: number) => void,
  coeur: [string, string, string],
  x: number,
  y: number,
  l: number,
  h: number,
): void {
  ctx.save()
  ctx.shadowColor = '#0000008c'
  ctx.shadowOffsetX = 0.35 * U
  ctx.shadowOffsetY = 0.5 * U
  forme(0)
  ctx.fillStyle = '#12100c'
  ctx.fill()
  ctx.restore()

  const filet = ctx.createLinearGradient(x, y, x + l, y + h)
  filet.addColorStop(0, '#f4dfb0')
  filet.addColorStop(0.7, '#c9a86e')
  filet.addColorStop(1, '#a88c5f')
  forme(1.1 * U)
  ctx.fillStyle = filet
  ctx.fill()

  const dedans = ctx.createLinearGradient(x, y, x + l, y + h)
  dedans.addColorStop(0, coeur[0])
  dedans.addColorStop(0.62, coeur[1])
  dedans.addColorStop(1, coeur[2])
  forme(2.6 * U)
  ctx.fillStyle = dedans
  ctx.fill()
}

/** L'AMBRE : la couleur de l'énergie dans ce jeu, celle de l'orbe du joueur. */
const AMBRE: [string, string, string] = ['#8a6a2c', '#4a3713', '#241a08']

/**
 * Le chiffre, en ivoire, centré sur la forme.
 *
 * **Il est plus petit que sur le blason**, et ce n'est pas un réglage d'humeur :
 * l'écu est plus HAUT que large (0,165 de la carte contre 0,19), alors que ces
 * formes-ci sont inscrites dans un carré. Le même corps de police y remplissait
 * toute la figure et recouvrait le coeur d'ambre — *on ne voyait plus que le
 * chiffre, donc plus aucune des cinq pistes ne se distinguait.*
 */
function chiffre(ctx: CanvasRenderingContext2D, cout: number, cx: number, cy: number): void {
  ctx.fillStyle = '#fff0cd'
  ctx.font = `600 ${13.5 * U}px "Grenze Gotisch", Georgia, serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.shadowColor = '#2a1c06'
  ctx.shadowOffsetX = 0.581 * U
  ctx.shadowOffsetY = 0.872 * U
  ctx.fillText(String(cout), cx, cy)
  ctx.shadowColor = 'transparent'
}

/**
 * LA VALEUR D'UN TRÉSOR : une gemme, puis le chiffre à sa droite.
 *
 * **Elle est EN HAUT, CENTRÉE, sur la ligne de l'orbe** — demandé par Keko.
 * Elle a d'abord vécu sous l'orbe, sur la bande gauche, par la règle qui veut
 * que *tout ce qui sert à décider tienne dans le quart que l'éventail laisse
 * voir* ; centrée, elle est cachée par la voisine tant qu'on ne lève pas la
 * carte. *Mais un trésor ne se joue pas* : on ne décide pas dessus en combat,
 * on décide au butin et au coffre, où la carte est entière. **La règle vaut
 * pour ce sur quoi on décide dans la MAIN, et une valeur de butin n'en est
 * pas.**
 *
 * Elle se cale sur le CENTRE de l'orbe, pas sur le haut de la carte : les deux
 * forment alors une ligne d'en-tête, là où deux hauteurs voisines mais
 * différentes se liraient comme un défaut d'alignement.
 *
 * **Le chiffre est À CÔTÉ du symbole, pas dedans**, et c'est la grammaire des
 * MESURES — celle de la bande de stats de l'armurerie. L'orbe et la case en
 * forme de carte mettent leur chiffre dedans parce qu'ils disent un COÛT et un
 * POIDS ; une valeur se mesure. *Trois grammaires pour trois choses, et aucune
 * ne se confond avec une autre.*
 *
 * **La gemme n'a AUCUNE facette.** À 97 px de large — la case du coffre — elle
 * en fait six : un trait de plus y tournerait en bouillie, la leçon de la tête
 * de comète. Une silhouette pleine et une table plus claire suffisent à faire
 * lire une pierre taillée.
 *
 * **Et elle n'est pas dorée par hasard** : l'or est déjà la couleur de tout ce
 * qui a de la valeur ici. Ça ne la confond pas avec la rareté épique, qui vit
 * sur le CADRE et nulle part ailleurs.
 */
function peindreValeur(ctx: CanvasRenderingContext2D, valeur: number): void {
  const l = 6.2 * U
  const h = l * 1.16
  const ecart = 1.7 * U
  // ON MESURE LE COUPLE ENTIER AVANT DE LE POSER : centrer la gemme seule
  // enverrait le chiffre à droite, et *une bulle qui désigne ce qu'on regarde
  // se centre sur le couple, jamais sur une de ses moitiés.*
  ctx.font = `600 ${8.6 * U}px "Grenze Gotisch", Georgia, serif`
  const texte = String(valeur)
  const x = (LARGE - (l + ecart + ctx.measureText(texte).width)) / 2
  // ELLE REMONTE D'UN CHEVEU au-dessus de la ligne de l'orbe (Keko). *Un
  // chiffre et un disque de tailles différentes ne se centrent pas à l'oeil au
  // même endroit* : le badge est deux fois moins haut, donc aligné au milieu
  // mathématique il paraît tomber. Ça garde 1,9 % de hauteur avant le jonc.
  const y = ORBE_CY - h / 2 - 0.012 * HAUT

  const gy = y + h * 0.36
  const cx = x + l / 2

  // LA PIERRE RAYONNE AVANT D'ÊTRE DESSINÉE. Un halo chaud posé sous elle, et
  // c'est ce qui la fait lire comme un objet ÉCLAIRÉ plutôt que comme un
  // pictogramme. *Le flou est dans la matière* — la réponse déjà donnée au
  // contour des cartes et au halo des créatures.
  const rayon = l * 1.9
  const lueur = ctx.createRadialGradient(cx, y + h * 0.45, 0, cx, y + h * 0.45, rayon)
  lueur.addColorStop(0, '#ffcf6b7a')
  lueur.addColorStop(0.4, '#ffc04a36')
  lueur.addColorStop(1, '#ffb43000')
  ctx.fillStyle = lueur
  ctx.fillRect(cx - rayon, y + h * 0.45 - rayon, rayon * 2, rayon * 2)

  const taille = (points: readonly (readonly [number, number])[]): void => {
    ctx.beginPath()
    points.forEach(([px, py], i) => {
      if (i === 0) ctx.moveTo(x + px * l, y + py * h)
      else ctx.lineTo(x + px * l, y + py * h)
    })
    ctx.closePath()
  }

  /**
   * LE CERNE D'ABORD, sous tout le reste : la gemme se pose sur
   * l'illustration, qui peut être claire. *Un symbole sans cerne disparaît sur
   * son propre fond.*
   *
   * **Il porte la couleur du chiffre d'à côté, pas du noir.** Keko : « je
   * trouve l'outline noir sur la gemme des trésors un peu moche, on peut
   * mettre cet outline de la même couleur que le texte à côté ? » *Un cerne
   * noir sur une pierre dorée en fait un pictogramme découpé*, là où le même
   * trait en crème la relie à sa valeur — les deux moitiés du couple se lisent
   * alors comme un seul objet.
   *
   * Ce que le noir faisait, c'était DÉTACHER du fond : le crème le rend par
   * l'OMBRE, exactement comme le chiffre, qui porte la sienne depuis toujours.
   * *Un cerne sépare par sa couleur, une ombre sépare par sa profondeur* — et
   * ici la seconde suffit.
   */
  taille([[0.2, 0], [0.8, 0], [1, 0.36], [0.5, 1], [0, 0.36]])
  ctx.save()
  ctx.shadowColor = '#0d0a04'
  ctx.shadowBlur = 1.6 * U
  ctx.strokeStyle = '#fff0cd'
  ctx.lineWidth = 0.85 * U
  ctx.lineJoin = 'round'
  ctx.stroke()
  ctx.restore()

  // LA TAILLE EST FAITE D'APLATS, JAMAIS DE TRAITS. La gemme ne dépasse jamais
  // une vingtaine de pixels à l'écran — 6 dans une case de coffre — et *un
  // filet de facette y disparaît ou scintille, alors que deux tons voisins se
  // moyennent proprement.* C'est la leçon de la tête de comète, où l'effilement
  // a dû devenir géométrique plutôt que fait d'opacité.
  //
  // Cinq facettes pour quatre tons : la table, la couronne coupée en deux, la
  // culasse coupée en deux. *C'est l'asymétrie gauche-droite qui dit
  // « taillée »* — un dégradé seul ne dirait que « bombée ». La lumière vient
  // du haut et de la gauche, comme le laiton du cadre.
  const facettes: readonly (readonly [readonly (readonly [number, number])[], string])[] = [
    [[[0, 0.36], [0.5, 0.36], [0.5, 1]], '#eab02e'],
    [[[0.5, 0.36], [1, 0.36], [0.5, 1]], '#a5700f'],
    [[[0.2, 0], [0.28, 0.36], [0, 0.36]], '#ffe081'],
    [[[0.8, 0], [1, 0.36], [0.72, 0.36]], '#e7b235'],
    [[[0.2, 0], [0.8, 0], [0.72, 0.36], [0.28, 0.36]], '#fff3c4'],
  ]
  for (const [points, ton] of facettes) {
    taille(points)
    ctx.fillStyle = ton
    ctx.fill()
  }

  // LE RONDISTE prend la lumière : c'est la ligne la plus large d'une pierre
  // taillée, donc celle qui accroche. Un seul trait, et il reste DANS la
  // gemme — il ne la déborde pas.
  ctx.beginPath()
  ctx.moveTo(x + l * 0.06, gy)
  ctx.lineTo(x + l * 0.94, gy)
  ctx.strokeStyle = '#fff6da'
  ctx.globalAlpha = 0.55
  ctx.lineWidth = 0.28 * U
  ctx.stroke()
  ctx.globalAlpha = 1

  // ET UN ÉCLAT À QUATRE BRANCHES, à cheval sur l'arête. Le projet avait déjà
  // tranché cette forme en cherchant le symbole du coût : *six branches égales
  // font une étoile de David, quatre branches fines ne disent que la lumière.*
  // Moitié dedans moitié dehors, parce qu'*un éclat contenu dans la pierre se
  // lit comme une tache peinte, un éclat qui déborde se lit comme de la lumière
  // qui accroche* — le raisonnement du chiffre des jauges, qui déborde sa barre
  // plutôt que d'être contenu par elle.
  const ex = x + l * 0.3
  const ey = y + h * 0.1
  const r = l * 0.42
  ctx.beginPath()
  ctx.moveTo(ex, ey - r)
  ctx.quadraticCurveTo(ex, ey, ex + r * 0.7, ey)
  ctx.quadraticCurveTo(ex, ey, ex, ey + r)
  ctx.quadraticCurveTo(ex, ey, ex - r * 0.7, ey)
  ctx.quadraticCurveTo(ex, ey, ex, ey - r)
  ctx.closePath()
  ctx.fillStyle = '#fffdf2'
  ctx.fill()

  ctx.fillStyle = '#fff0cd'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  ctx.shadowColor = '#0d0a04'
  ctx.shadowBlur = 1.6 * U
  ctx.fillText(texte, x + l + ecart, y + h * 0.52)
  ctx.shadowBlur = 0
  ctx.shadowColor = 'transparent'
  ctx.textAlign = 'center'
}

function polygone(
  ctx: CanvasRenderingContext2D,
  cotes: number,
  depart: number,
  cx: number,
  cy: number,
  r: number,
): void {
  ctx.beginPath()
  for (let i = 0; i < cotes; i += 1) {
    const a = depart + (i * 2 * Math.PI) / cotes
    const px = cx + Math.cos(a) * r
    const py = cy + Math.sin(a) * r
    if (i === 0) ctx.moveTo(px, py)
    else ctx.lineTo(px, py)
  }
  ctx.closePath()
}

function peindreCout(
  ctx: CanvasRenderingContext2D,
  cout: number,
  symbole: HTMLImageElement | null,
): void {
  if (styleCout === 'blason') return peindreEcusson(ctx, cout)

  // Un peu plus large que l'écu : inscrite dans un carré, une forme perd de la
  // surface utile par rapport à un écu qui s'étire en hauteur.
  const l = ORBE_L
  // SA MARGE GAUCHE SE MESURE AU BORD QU'ON VOIT, pas au bord de la toile —
  // la même leçon que le compteur des pièces, et il a fallu la repayer ici :
  // la coque de la carte est une découpe DÉCHIRÉE, et près du coin son bord
  // gauche rentre plus que le bord haut. À distance égale du canvas, l'écart
  // paraissait donc plus serré à gauche. Keko : « l'écart avec le bord est
  // trop faible par rapport à l'écart avec le bord du haut ».
  const cx = ORBE_CX
  const cy = ORBE_CY
  const r = l / 2
  const x = cx - r
  const y = cy - r

  // L'IMAGE DE KEKO REMPLACE LE CERCLE DESSINÉ, quand elle est là. Le dessin
  // reste derrière elle comme repli : *un canvas ne dessine rien du tout si
  // l'image manque*, et on aurait un chiffre posé sur le vide.
  if (styleCout === 'orbe' && symbole !== null) {
    poserSymbole(ctx, symbole, x, y, l)
    chiffre(ctx, cout, cx, cy)
    return
  }

  if (styleCout === 'losange') {
    // LE LOSANGE, POINTE EN HAUT : l'inverse exact de l'écu. Une pointe qui
    // monte se lit comme un éclat, une pointe qui descend comme un bouclier.
    serti(ctx, (m) => polygone(ctx, 4, -Math.PI / 2, cx, cy, r - m), AMBRE, x, y, l, l)
  } else if (styleCout === 'hexagone') {
    // L'HEXAGONE : une pièce mécanique, aucune parenté héraldique.
    serti(ctx, (m) => polygone(ctx, 6, -Math.PI / 2, cx, cy, r - m), AMBRE, x, y, l, l)
  } else if (styleCout === 'orbe') {
    // L'ORBE : exactement l'objet que porte déjà le joueur, en petit. C'est la
    // règle de Keko prise au mot — « que le symbole soit toujours le même ».
    serti(
      ctx,
      (m) => {
        ctx.beginPath()
        ctx.arc(cx, cy, r - m, 0, Math.PI * 2)
      },
      AMBRE,
      x,
      y,
      l,
      l,
    )
    const lueur = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.35, 0, cx, cy, r)
    lueur.addColorStop(0, '#ffd98a66')
    lueur.addColorStop(1, '#ffd98a00')
    ctx.beginPath()
    ctx.arc(cx, cy, r - 2.6 * U, 0, Math.PI * 2)
    ctx.fillStyle = lueur
    ctx.fill()
  } else {
    // L'ÉCLAT : un scintillement à QUATRE branches derrière un disque. Il en a
    // eu six, et six branches égales font une étoile de David — *une forme
    // géométrique n'est jamais seulement une forme*, elle traîne ce qu'on lit
    // d'elle ailleurs. Quatre branches fines ne disent que la lumière.
    ctx.save()
    ctx.shadowColor = '#0000008c'
    ctx.shadowOffsetY = 0.5 * U
    ctx.beginPath()
    for (let i = 0; i < 8; i += 1) {
      const a = -Math.PI / 2 + (i * Math.PI) / 4
      const rr = i % 2 === 0 ? r : r * 0.3
      const px = cx + Math.cos(a) * rr
      const py = cy + Math.sin(a) * rr
      if (i === 0) ctx.moveTo(px, py)
      else ctx.lineTo(px, py)
    }
    ctx.closePath()
    const or = ctx.createLinearGradient(x, y, x + l, y + l)
    or.addColorStop(0, '#f4dfb0')
    or.addColorStop(1, '#a88c5f')
    ctx.fillStyle = or
    ctx.fill()
    ctx.restore()
    ctx.beginPath()
    ctx.arc(cx, cy, r * 0.56, 0, Math.PI * 2)
    ctx.fillStyle = '#241a08'
    ctx.fill()
    ctx.beginPath()
    ctx.arc(cx, cy, r * 0.56, 0, Math.PI * 2)
    ctx.strokeStyle = '#c9a86e'
    ctx.lineWidth = 1.1 * U
    ctx.stroke()
  }

  chiffre(ctx, cout, cx, cy)
}

function peindreEcusson(ctx: CanvasRenderingContext2D, cout: number): void {
  const x = 0.01 * LARGE
  const y = 0.004 * HAUT
  const l = 0.19 * LARGE
  const h = 0.165 * HAUT

  ctx.save()
  ctx.shadowColor = '#0000008c'
  ctx.shadowOffsetX = 0.35 * U
  ctx.shadowOffsetY = 0.5 * U
  chemin(ctx, ECUSSON, x, y, l, h)
  ctx.fillStyle = '#1a1316'
  ctx.fill()
  ctx.restore()

  // Le filet de laiton clair, puis la couleur de la nature.
  const filet = ctx.createLinearGradient(x, y, x + l, y + h)
  filet.addColorStop(0, '#f4dfb0')
  filet.addColorStop(0.7, '#c9a86e')
  filet.addColorStop(1, '#a88c5f')
  chemin(ctx, ECUSSON, x + 1.1 * U, y + 0.9 * U, l - 2.2 * U, h - 2.2 * U)
  ctx.fillStyle = filet
  ctx.fill()

  const couleur = ctx.createLinearGradient(x, y, x + l, y + h)
  couleur.addColorStop(0, '#df7650')
  couleur.addColorStop(0.62, '#a4312c')
  couleur.addColorStop(1, '#672729')
  chemin(ctx, ECUSSON, x + 2.5 * U, y + 2.2 * U, l - 5 * U, h - 5.2 * U)
  ctx.fillStyle = couleur
  ctx.fill()

  // LE CHIFFRE EST REMONTÉ : la pointe vers le bas met le centre visuel de
  // l'écusson plus haut que le centre de sa boîte.
  ctx.fillStyle = '#fff0cd'
  ctx.font = `600 ${18.5 * U}px "Grenze Gotisch", Georgia, serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.shadowColor = '#5b2727'
  ctx.shadowOffsetX = 0.581 * U
  ctx.shadowOffsetY = 0.872 * U
  ctx.fillText(String(cout), x + l / 2, y + h * 0.42)
  ctx.shadowColor = 'transparent'
}

/**
 * LE VOILE SOUS LE TEXTE : le bas de la carte passe sous le nom et le
 * cartouche, donc l'image doit s'y éteindre pour qu'ils se lisent.
 *
 * **IL MONTE EN COURBE, PLUS EN DEUX SEGMENTS.** Keko : « je trouve le dégradé
 * noir trop abrupt, on peut le rendre plus progressif ? » Il avait trois
 * arrêts, donc une CASSURE DE PENTE à 66 % de la hauteur : il montait d'un coup
 * jusqu'aux deux tiers d'opacité puis restait presque plat. *Ce n'est pas la
 * vitesse qu'on voit, c'est la cassure* — une rampe sans dérivée nulle aux deux
 * bouts se lit comme une arête.
 *
 * **Le départ remonte, et ce n'est pas un retour en arrière** : Keko avait fait
 * baisser le voile parce qu'il devenait NOIR trop haut, pas parce qu'il
 * commençait trop haut. Une courbe douce passe sous le seuil du visible pendant
 * sa première moitié — à 50 % de la carte elle ne pèse que 10 % d'opacité,
 * contre un départ franc à 57 % auparavant. *Elle commence plus haut et se voit
 * plus bas.*
 *
 * Ce qui ne pouvait pas bouger, c'est l'opacité AU NOM, peint à 66,5 % : la
 * courbe y vaut 0,67, soit exactement ce que l'ancien palier donnait.
 */
function peindreVoile(ctx: CanvasRenderingContext2D): void {
  const DEBUT_VOILE = 0.42
  const PLEIN_VOILE = 0.78
  const ALPHA_VOILE = 0.88
  const noir = (a: number): string =>
    `#000000${Math.round(a * 255)
      .toString(16)
      .padStart(2, '0')}`
  const voile = ctx.createLinearGradient(0, HAUT * DEBUT_VOILE, 0, HAUT)
  // Une smoothstep : sa pente est nulle aux deux bouts, donc ni le haut ni le
  // bas de la rampe ne laissent d'arête. Seize arrêts suffisent — au-delà, le
  // pas est sous le quantum de l'alpha.
  for (let i = 0; i <= 16; i += 1) {
    const t = i / 16
    const y = DEBUT_VOILE + t * (PLEIN_VOILE - DEBUT_VOILE)
    voile.addColorStop((y - DEBUT_VOILE) / (1 - DEBUT_VOILE), noir(t * t * (3 - 2 * t) * ALPHA_VOILE))
  }
  voile.addColorStop(1, noir(ALPHA_VOILE))
  ctx.fillStyle = voile
  ctx.fillRect(0, HAUT * DEBUT_VOILE, LARGE, HAUT * (1 - DEBUT_VOILE))
}

/**
 * LA PLAQUE CLAIRE : ce qui porte le texte d'une carte qui parle la langue
 * d'une application.
 *
 * Keko : « la zone de texte (dégradé noir) est hors du thème ; on veut un style
 * proche de l'univers smartphone / fun des emoji ».
 *
 * *Un voile qui s'éteint est le vocabulaire d'une plaque gravée* — l'image
 * meurt dans le métal et la lettre s'y creuse. **Une plaque POSÉE dit l'inverse
 * et c'est ce qu'on veut ici** : l'image reste entière au-dessus, et le texte
 * vit sur une étiquette blanche, comme une légende sous une photo.
 *
 * Quatre choses la portent, et chacune fait un travail que les autres ne font
 * pas :
 *
 * - **ELLE PORTE SON OMBRE VERS LE HAUT.** C'est la seule chose qui dise
 *   qu'elle est POSÉE sur l'image et non découpée dedans — *une plaque sans
 *   ombre se lit comme un trou dans le dessin* ;
 * - **SES COINS DU BAS SONT CEUX DE LA CARTE**, rayon de la carte moins la
 *   marge : elle s'arrête sur le cadre, donc elle doit l'épouser. La règle du
 *   tracé du contour, repayée ici ;
 * - **SON DÉGRADÉ EST À PEINE VISIBLE** (deux tons voisins, du plus clair en
 *   haut au plus pigmenté en bas) : la lumière du jeu vient du haut, et *un
 *   aplat parfaitement uni se lit comme un rectangle de couleur, pas comme une
 *   surface*. **C'est aussi lui qui porte la teinte du cran** — voir
 *   `tonsDeLaPlaque` — et c'est le ton du BAS qui en porte le plus : *la part
 *   ombrée d'une surface garde plus de couleur que la part éclairée* ;
 * - **ELLE EST OPAQUE.** Un reste de transparence laisserait voir l'emoji
 *   dessous, et *ça se lit comme un calque mal posé* — la règle déjà tenue par
 *   la pierre des encadrés du glossaire.
 */
function peindreBulle(
  ctx: CanvasRenderingContext2D,
  marge: number,
  rayon: number,
  rarete: string | undefined,
): void {
  const y = HAUT * HAUT_BULLE
  const l = LARGE - marge * 2
  const h = HAUT - marge - y
  const hautR = 5 * U
  const basR = Math.max(0, LARGE * rayon - marge)
  const [clair, pigmente] = tonsDeLaPlaque(rarete)
  const fond = ctx.createLinearGradient(0, y, 0, HAUT)
  fond.addColorStop(0, clair)
  fond.addColorStop(1, pigmente)
  ctx.save()
  ctx.shadowColor = 'rgba(0,0,0,0.55)'
  ctx.shadowOffsetY = -1.4 * U
  ctx.shadowBlur = 4 * U
  ctx.fillStyle = fond
  ctx.beginPath()
  ctx.roundRect(marge, y, l, h, [hautR, hautR, basR, basR])
  ctx.fill()
  ctx.restore()
}

function peindreTextes(
  ctx: CanvasRenderingContext2D,
  carte: CarteAPeindre,
  symbole: HTMLImageElement | null,
): void {
  /**
   * LA VOIX DE CETTE CARTE-CI.
   *
   * Keko : « la police est hors du thème ; on veut une police proche de
   * l'univers smartphone / fun des emoji ».
   *
   * *Le gabarit parle deux langues* — le gothique des noms, le serif des effets
   * — **et les deux disent le métal.** Sur une plaque claire elles se lisent
   * comme un titre de parchemin collé sur un écran : c'est la même faute que la
   * coque déchirée autour d'un aplat net, un cran plus loin.
   *
   * **Une seule famille remplace les deux**, et c'est juste ici : *une
   * application n'a qu'une voix, elle la décline en graisses.* Le nom prend le
   * 800, le cartouche le 400, le type le 700.
   */
  const bulle = enBulle(carte)
  const famille = bulle ? FAMILLE_RONDE : SERIF_EFFET
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  /**
   * LE NOM, sur le haut de la bande de texte, souligné d'un fin trait.
   *
   * **Il a grossi d'un quart**, et le type du pied avec — Keko : « c'est
   * surtout le titre et le type de la carte que je voudrais mieux voir, on va
   * essayer plus gros ». Ce sont les deux seules choses qu'on lit sur une
   * carte qu'on ne zoome pas : *ce qui sert à reconnaître doit être lisible à
   * la taille où l'on cherche*, et la composition, elle, se consulte au zoom.
   *
   * **ET IL PASSE À LA LIGNE AVANT DE RAPETISSER** : voir `CRANS_NOM`. Il a
   * longtemps été écrit d'un trait, la taille cédant jusqu'à ce qu'il tienne —
   * donc les noms courts sortaient en grand et les longs en minuscule, ce que
   * Keko a fini par signaler. *Le canvas ne prévient jamais qu'il déborde*,
   * mais ce n'est pas une raison pour que ce soit toujours la taille qui
   * paie.
   */
  /**
   * LA LARGEUR UTILE EST CELLE DU CADRE À LA HAUTEUR DU TITRE, pas celle de la
   * carte — et elle se CALCULE, elle ne se devine pas.
   *
   * Keko : « le texte du titre peut déborder sur les côtés de la carte (et se
   * superposer aux encoches du cadre) quand il est trop long ». **Trois termes
   * se cumulaient, et le troisième était invisible** :
   *
   * | | |
   * |---|---|
   * | l'encoche mord PILE à cette hauteur | 4,5 % de chaque côté |
   * | la marge de la coque | 1,85 % |
   * | **l'ombre portée du texte** (`shadowBlur`) | **3 % de plus que l'encre** |
   *
   * *Le nom est peint à `Y_ENCOCHE`, donc il tombe exactement dans la partie
   * la plus étroite du cadre* — ce n'est pas un hasard, c'est le réglage que
   * Keko avait demandé. Il reste 87,3 % entre les deux entailles, moins
   * l'ombre : **81,3 %**, et on garde un peu d'air.
   *
   * **ON PREND LE PIRE CAS, celui de la piste encochée**, et pas la largeur de
   * la piste courante : *une borne qui dépend d'un paramètre d'essai se
   * désaccorderait le jour où le défaut change.* Les autres pistes y perdent
   * trois pour cent sur les seuls noms longs.
   */
  /**
   * **ET LA PLAQUE N'A PAS D'ENCOCHE À ÉVITER.** Les 78 % sont la largeur du
   * cadre ENTAILLÉ à la hauteur du titre, ombre portée comprise ; une plaque
   * claire n'a ni entaille ni ombre, et son cadre ne mord que de sa marge.
   *
   * *À 78 %, les noms longs se rétrécissaient pour rien* — « Visage avec un
   * léger sourire » sortait deux crans sous « Plus », et **deux noms de même
   * rang qui se lisent à deux tailles donnent deux objets différents.** Il
   * reste de quoi loger le dégagement de la plaque.
   */
  const tientDans = LARGE * (bulle ? 0.88 : 0.78)
  const policeNom = (t: number): string =>
    bulle ? `800 ${t}px ${FAMILLE_RONDE}` : `700 ${t}px "Grenze Gotisch", Georgia, serif`
  /**
   * LE TRAIT NE COMPTE QU'EN GABARIT, et c'est lui qui décide du cran.
   *
   * Il réclame sa place sous la dernière ligne ; une plaque claire n'en a pas,
   * *la graisse et la couleur y suffisent à séparer le titre du sous-texte.*
   */
  const sousLeNom = bulle ? 0 : 0.68
  const hautDuNom = HAUT * (bulle ? HAUT_BULLE : HAUT_NOM_GABARIT)
  const nom = corpsDuNom(
    ctx,
    carte.nom,
    tientDans,
    policeNom,
    sousLeNom,
    hautDuNom,
    bulle && PLAQUE_FIXE,
  )
  const tailleNom = nom.taille
  ctx.font = policeNom(tailleNom)
  /**
   * ET SI MÊME ÇA NE SUFFIT PLUS, ON COUPE.
   *
   * ***Un plancher de taille n'est pas une garantie de tenue*** : la boucle
   * s'arrête à 5 U, et le plus long nom du catalogue des peintures fait **cent
   * caractères** — « L'Ange exterminateur et les démons maléfiques
   * interrompant les orgies des vicieux et des insatiables ». Deux lignes et
   * deux crans n'en viennent pas toujours à bout, et *le canvas déborderait
   * sans rien signaler.*
   *
   * **Mais ça ne concerne plus que deux cartes sur douze mille**, contre 848
   * qui touchaient le plancher du temps où le nom tenait sur une ligne. *Et ce
   * qui sert à RECONNAÎTRE une carte, ce sont ses premiers mots* — le nom
   * entier reste dans le catalogue pour les écrans qui ont la place.
   *
   * On coupe par POINT DE CODE : un `slice` tranche en deux un caractère hors
   * BMP et laisse une moitié de paire orpheline.
   */
  const lignesNom = nom.lignes.map((ligne) => {
    if (ctx.measureText(ligne).width <= tientDans) return ligne
    const lettres = [...ligne]
    while (lettres.length > 1 && ctx.measureText(`${lettres.join('')}…`).width > tientDans) {
      lettres.pop()
    }
    return `${lettres.join('').trimEnd()}…`
  })
  /**
   * ET SUR UNE PLAQUE CLAIRE, LE TEXTE EST SOMBRE ET SANS OMBRE.
   *
   * *Le cerne du gabarit sépare par la PROFONDEUR* — il détache une lettre
   * claire d'un fond sombre et mouvant — **et sur du blanc il ne détache plus
   * rien : il salit.** La règle est déjà écrite pour le coeur des armures, où
   * le cerne mangeait un tiers de la figure sans rien détacher.
   */
  ctx.fillStyle = bulle ? NOM_BULLE : '#f7ead0'
  ctx.shadowColor = bulle ? 'transparent' : '#14181a'
  ctx.shadowOffsetY = bulle ? 0 : 0.5 * U
  ctx.shadowBlur = bulle ? 0 : 3 * U
  /**
   * SUR UNE PLAQUE, LE BLOC PEND PAR LE HAUT — EN GABARIT IL SE CENTRE.
   *
   * Keko : « la distance par rapport au haut de la zone de texte à fond blanc
   * est réduite quand il y a deux lignes, je voudrais qu'elle soit la même ».
   * **Un bloc dont la hauteur change doit s'accrocher par le bord qui ne bouge
   * pas** : l'encre de la première ligne tombe donc toujours à `AIR_HAUT_NOM`
   * sous la plaque, qu'il y ait une ligne ou deux.
   *
   * **EN GABARIT, RIEN NE CHANGE, et c'est voulu.** *Le nom d'une ligne y est
   * calé sur `Y_ENCOCHE`* — « je les voudrais au niveau du titre », Keko —
   * donc le pendre par un air constant le décrocherait de son encoche de
   * quatre unités. Et il n'y a pas de « zone de texte à fond blanc » là-bas :
   * la demande ne le concerne pas. Un bloc de deux lignes s'y centre, faute
   * d'encoche unique à viser.
   */
  const yNom = HAUT * 0.665
  const hautEncre = boiteDuNom(ctx, tailleNom).haut * tailleNom
  const yPremiere = bulle
    ? hautDuNom + AIR_HAUT_NOM * U + hautEncre
    : lignesNom.length === 1
      ? yNom
      : hautDuNom + (basDuNom() - hautDuNom - nom.haut) / 2 + hautEncre
  const pasNom = INTERLIGNE_NOM * tailleNom
  lignesNom.forEach((ligne, i) => {
    ctx.fillText(ligne, LARGE / 2, yPremiere + i * pasNom)
  })
  const yDerniere = yPremiere + (lignesNom.length - 1) * pasNom
  ctx.shadowColor = 'transparent'
  ctx.shadowOffsetY = 0
  ctx.shadowBlur = 0

  /**
   * LE TRAIT SOUS LE NOM — et il n'existe pas sur une plaque claire.
   *
   * *Il structure une plaque gravée*, où le nom et l'effet sont deux
   * inscriptions qu'il faut séparer. **Dans une application, un titre suivi
   * d'un sous-texte gris n'a pas de séparateur** : la graisse et la couleur
   * suffisent, et c'est ce qui fait lire les deux comme un bloc plutôt que
   * comme deux champs.
   */
  if (!bulle) {
    const trait = ctx.createLinearGradient(LARGE * 0.22, 0, LARGE * 0.78, 0)
    trait.addColorStop(0, '#f7ead000')
    trait.addColorStop(0.2, '#f7ead099')
    trait.addColorStop(0.8, '#f7ead099')
    trait.addColorStop(1, '#f7ead000')
    ctx.fillStyle = trait
    // Le trait suit la DERNIÈRE ligne du nom : il se pose sous ses jambages,
    // quelle que soit la taille à laquelle il a fallu l'écrire — et il ne peut
    // pas rester accroché à la première, *sinon il couperait le titre en deux.*
    ctx.fillRect(LARGE * 0.22, yDerniere + tailleNom * sousLeNom, LARGE * 0.56, Math.max(1, 0.25 * U))
  }

  // LE CARTOUCHE : ce que fait la carte, centré, une ligne par entrée.
  //
  // **IL SE REPLIE.** En 2D c'est le navigateur qui coupe les lignes ; un
  // canvas, lui, écrit tout droit et laisse déborder *sans rien signaler* —
  // la composition de l'Espadon sortait des deux côtés de la carte. Le repli
  // se fait à la taille choisie, et s'il coûte une ligne de trop on descend
  // d'un cran : c'est exactement ce que `cran` fait pour un effet long.
  const { taille, lignes } = corpsDuCartouche(ctx, carte.effet, LARGE * 0.86, famille)
  // LE SOUS-TEXTE FONCE AVEC CHAQUE CRAN DE COULEUR, et c'est la troisième
  // passe : la plaque descend maintenant jusqu'à 0,485 de luminance sur le bleu
  // pour que la teinte se voie. Il tient **5,2 au pire** et 12,8 sur le vert,
  // donc mieux qu'avant partout — *le pigment se paie sur le texte, et il le
  // paie bien.*
  ctx.fillStyle = bulle ? CARTOUCHE_BULLE : '#f1e6cf'
  ctx.shadowColor = bulle ? 'transparent' : '#000000aa'
  ctx.shadowOffsetY = bulle ? 0 : 0.4 * U
  ctx.shadowBlur = bulle ? 0 : 0.8 * U
  lignes.forEach((ligne, i) => {
    ecrireLigne(
      ctx,
      ligne,
      LARGE / 2,
      HAUT * HAUT_CARTOUCHE + i * taille * INTERLIGNE_EFFET,
      taille,
      symbole,
      famille,
    )
  })
  ctx.shadowColor = 'transparent'

  peindrePied(ctx, carte, bulle)
}

/**
 * LE PIED : sa nature gravée, en petites capitales espacées — ou en PASTILLE
 * quand la carte parle la langue d'une application.
 *
 * *Un mot gravé entre deux filets est de la ferronnerie* ; **une pastille
 * arrondie est LE vocabulaire d'une app**, et c'est exactement ce que ce mot
 * est : une étiquette de catégorie, pas une valeur de jeu.
 *
 * **ET LA CAPSULE REVIENT ICI, alors que le projet l'a bannie partout
 * ailleurs.** La règle était « un arrondi est une forme de gabarit, une arête
 * franche est de la ferronnerie » — elle a ramené la barre de vie au biseau,
 * les infobulles à zéro, le bouton de rangement à l'angle droit. *Elle ne vaut
 * que là où le jeu parle ferronnerie* : ici il parle d'un clavier, et c'est la
 * capsule qui est la forme juste.
 */
function peindrePied(ctx: CanvasRenderingContext2D, carte: CarteAPeindre, bulle = false): void {
  /**
   * SA PLACE SE CALCULE CONTRE LES DEUX VOISINS, et c'est la pastille qui le
   * demande : *un mot gravé n'occupe que son encre, une pastille occupe une
   * boîte.*
   *
   * **Le pire cas du cartouche est un effet de QUATRE lignes** : il descend
   * alors au dernier cran (5,4 U), donc sa dernière ligne de base tombe à
   * 90 % de la hauteur et le bas de ses glyphes à 91,4 %. En dessous, la
   * plaque s'arrête sur la marge du cadre. **Il reste 6,5 % de hauteur pour
   * une pastille** — d'où 7,4 U de haut, posée à 94,8 %, qui laisse un peu
   * plus d'un pour cent de chaque côté.
   *
   * *Mesuré avant correction* : à 8,2 U posée à 94,5 %, elle mordait sur la
   * dernière ligne d'un effet à quatre lignes.
   */
  const y = HAUT * (bulle ? 0.948 : 0.955)
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  if (bulle) {
    const mot = carte.type.toUpperCase()
    const esp = 0.55 * U
    ctx.font = `700 ${4 * U}px ${FAMILLE_RONDE}`
    ctx.letterSpacing = `${esp}px`
    /**
     * L'APPROCHE AJOUTE SON BLANC APRÈS LA DERNIÈRE LETTRE, donc la mesure
     * compte un espace qui n'existe pas à l'oeil : centrée dessus, la pastille
     * paraîtrait poussée à gauche de la moitié. *On mesure l'encre et on pose
     * le mot à gauche* — la règle déjà payée sur l'entrée majeure du rail.
     */
    const encre = ctx.measureText(mot).width - esp
    const l = encre + 6.4 * U
    const h = 7.4 * U
    // LA PASTILLE PORTE LA COULEUR DU CRAN, maintenant que la plaque est
    // blanche. Keko : « on peut teinter la bulle qui contient le texte du type
    // de la couleur de la rareté ? » *C'est le ton MOYEN du métal* — celui du
    // cadre, des rayons et du reflet — donc on n'invente aucune couleur. Le mot
    // reste sombre : mesuré, 4,9 de contraste sur le violet, 6,5 sur le bleu,
    // 8,3 à 11,7 ailleurs. Sans rang, elle garde le gris de la plaque claire.
    // **ET C'EST UN TEINT, PAS LA COULEUR PLEINE.** Keko, en le voyant : « là
    // c'est carrément coloré, je voyais un truc plus "teint" entre le blanc et
    // la couleur de rareté ». La pastille est donc le ton moyen MÊLÉ de blanc
    // (`TEINT_PASTILLE`, la part de couleur qui reste).
    const metal = carte.rarete === undefined ? undefined : METAUX[carte.rarete]
    ctx.fillStyle =
      metal === undefined
        ? tonsDeLaPlaque(carte.rarete)[2]
        : melange(metal[2], '#ffffff', TEINT_PASTILLE[carte.rarete!] ?? TEINT_PASTILLE_DEFAUT)
    ctx.beginPath()
    ctx.roundRect(LARGE / 2 - l / 2, y - h / 2, l, h, h / 2)
    ctx.fill()
    // LE MOT FONCE AVEC ELLE, ET C'EST LUI QUI BORNE LA COULEUR : il est le
    // plus petit texte de la carte posé sur son fond le plus sombre, donc c'est
    // le couple qui tombe le premier quand la plaque s'assombrit. *C'est lui
    // que `PLANCHER_PLAQUE` protège, pas le cartouche.* Il tient **5,1 au
    // pire** et 13,0 sur le vert.
    ctx.fillStyle = TYPE_BULLE
    ctx.textAlign = 'left'
    ctx.fillText(mot, LARGE / 2 - encre / 2, y)
    ctx.textAlign = 'center'
    ctx.letterSpacing = '0px'
  } else {
    ctx.font = `600 ${4.6 * U}px "Barlow Condensed", "Arial Narrow", sans-serif`
    ctx.fillStyle = '#c9b892'
    ctx.letterSpacing = `${1.2 * U}px`
    ctx.fillText(carte.type.toUpperCase(), LARGE / 2, y)
    ctx.letterSpacing = '0px'
  }

  // LES DEUX MESURES ENCADRENT LE TYPE, et leur couleur dit laquelle est
  // laquelle. Elles sont EN DEHORS du centrage du type : il garde sa place au
  // milieu de la carte, quels que soient les deux chiffres.
  if (carte.attaque === undefined && carte.defense === undefined) return
  ctx.font = bulle
    ? `800 ${7.4 * U}px ${FAMILLE_RONDE}`
    : `600 ${7.4 * U}px "Grenze Gotisch", Georgia, serif`
  // LE CERNE SÉPARE PAR LA PROFONDEUR, PAS PAR LA COULEUR : le pied passe sur
  // le laiton sombre de la coque, donc un chiffre nu s'y noierait — la règle
  // déjà tenue par le chiffre des jauges.
  ctx.shadowColor = 'rgba(0,0,0,0.85)'
  ctx.shadowBlur = 2.2 * U
  const marge = LARGE * 0.115
  if (carte.attaque !== undefined) {
    ctx.fillStyle = ROUGE_DEGATS
    ctx.textAlign = 'left'
    ctx.fillText(String(carte.attaque), marge, y)
  }
  if (carte.defense !== undefined) {
    ctx.fillStyle = BLEU_BLOC
    ctx.textAlign = 'right'
    ctx.fillText(String(carte.defense), LARGE - marge, y)
  }
  ctx.shadowBlur = 0
  ctx.textAlign = 'center'
}

/**
 * LES TEXTURES SONT PARTAGÉES ENTRE LES CARTES IDENTIQUES.
 *
 * Deux Gardes dans la main, c'est le même dessin : une seule texture suffit.
 * Ça compte pour deux raisons, et la seconde est la plus importante :
 *
 * - **la mémoire.** Une texture vit décompressée sur le GPU, plusieurs mégas
 *   pièce ; un deck en contient volontiers quatre exemplaires de la même
 *   carte ;
 * - **la stabilité.** Une carte qu'on remonte retrouve sa texture déjà prête,
 *   donc elle ne repasse jamais par son état sombre.
 *
 * Elles ne sont jamais libérées, et c'est voulu : le nombre de MODÈLES est
 * borné (quelques dizaines), alors que le nombre d'exemplaires manipulés dans
 * une partie ne l'est pas.
 */
/**
 * LE DOS DE CARTE.
 *
 * **Il sert aujourd'hui aux deux tas** (`Tas3D`), plaqué sur le dessus du
 * paquet. `textureDuDos` et la prop `dos` de `Carte3D` sont prêtes pour une
 * vraie carte face cachée — Keko l'a fait juger au centre de l'armurerie, puis
 * demandé de retirer le banc d'essai « mais on le garde pour plus tard ».
 *
 * **Il part de la MÊME anatomie que la face** — plaque de laiton, coque
 * déchirée, surface sombre à la même découpe — et c'est ce qui en fait la même
 * carte vue de l'autre côté plutôt qu'un second objet. Un dos dessiné à part
 * aurait dérivé, exactement comme les quatre fonctions qui peignaient chacune
 * leur carte avant `corpsCarte`.
 *
 * **Il n'a rien à montrer, seulement une matière** : pas de texte, pas de
 * sujet, rien qui puisse dire quelle carte est dessous. Tout ce qu'il porte est
 * donc SYMÉTRIQUE — un dos qui aurait un haut et un bas se lirait à l'envers
 * une fois sur deux.
 *
 * Le vocabulaire est celui des cartes, sans rien inventer : le fond commun de
 * Keko comme matière, le laiton du cadre, une fenêtre en arche devenue anneau,
 * et l'éclat à quatre branches — *quatre et non six, parce que six branches
 * égales font une étoile de David*, la leçon déjà payée sur la planche des
 * symboles de coût.
 */

let dosDeKeko: Promise<HTMLImageElement | null> | null = null

function dessinDuDos(): Promise<HTMLImageElement | null> {
  dosDeKeko ??= charger(urlDuDosDeCarte())
  return dosDeKeko
}

/**
 * **LE DOS : LE DÉCOR DU JEU, LE CADRE DE KEKO.**
 *
 * Il était entièrement peint — plaque, semis de losanges, rayons, médaillon,
 * joncs. Keko a dessiné le cadre et le logo central, et c'est tout ce qu'il a
 * dessiné : « il va falloir que tu fasses le background du dos de carte ».
 *
 * *Le fond est donc le MÊME que celui de la face* — dégradé, vignettage, grain
 * — à une chose près : **il n'a pas de ciel de famille.** Une carte retournée
 * ne dit rien de ce qu'elle est, c'est la règle qui garde déjà le dos en
 * laiton quand le cadre de la face change de métal.
 *
 * **ET LES DEUX TAS NE SE DISTINGUENT PLUS PAR LEUR COEUR.** Le dos peint en
 * portait un : un éventail pour la pioche, une carte barrée pour la défausse.
 * Posés sur le losange de Keko, ils l'écrasaient — *un symbole ajouté au
 * milieu d'un logo n'est pas une étiquette, c'est une rature.* Et
 * il reste de quoi les distinguer : **c'est leur PLACE qui le dit**, pioche à
 * gauche et défausse à droite — la règle que le 2D tenait déjà.
 *
 * *Mais c'est désormais le SEUL signal*, et il faut le savoir : en 3D le tas
 * ne porte que son compte, pas son nom. **À rouvrir avec Keko s'il veut que
 * les deux se distinguent autrement qu'à leur coin.**
 *
 * **ET LE DESSIN SE CALE SUR SON SUJET, pas sur sa toile.** Le premier fichier
 * laissait une marge transparente inégale en haut et en bas : étiré bêtement
 * sur la carte, il serait parti de travers. On mesure donc la boîte du sujet et
 * on l'étire, elle, sur toute la carte — *un repère calé sur la marge d'un
 * dessin se déplace avec le dessin*, et c'est la troisième fois que cette règle
 * se paie.
 *
 * **ET C'EST CE QUI REND UN REDESSIN GRATUIT.** Keko l'a repris au gabarit des
 * illustrations (1024 x 1463), sujet à 1 % de chacun des quatre bords : *aucune
 * ligne n'a bougé ici.* Un calage mesuré n'est pas une rustine pour un fichier,
 * c'est ce qui permet d'en changer.
 */
/**
 * `?dos=gabarit` rend le dos du jeu d'extraction aux cartes d'emoji.
 *
 * *Ce qui a servi à choisir doit rester ouvrable, même une fois le choix fait* —
 * et c'est le seul moyen de revoir côte à côte ce que le dos neuf remplace.
 */
const PISTE_DOS: 'emoji' | 'gabarit' =
  new URLSearchParams(location.search).get('dos') === 'gabarit' ? 'gabarit' : 'emoji'

/** Le dos que cette carte-ci porte — **le même critère que son contour.** */
export function dosDe(carte: CarteAPeindre): 'emoji' | 'gabarit' {
  return carte.contour === 'simple' && PISTE_DOS === 'emoji' ? 'emoji' : 'gabarit'
}

/**
 * LE BLEU DU DOS, et c'est la seule couleur du jeu qui ne vienne de rien.
 *
 * *Les cinq crans sont pris par la rareté et les quatre ciels par la famille* —
 * **or le dos ne dit ni l'une ni l'autre** : il lui fallait donc une teinte à
 * lui, qui ne puisse se confondre avec aucun signal. Le bleu franc des
 * applications est le seul endroit libre de l'écran, et c'est aussi celui que
 * l'univers du mode réclame.
 *
 * Elle passe par `peindreDecor`, donc **elle hérite du dégradé, du vignettage
 * et du dither de la face** : *le dos est la même carte vue de l'autre côté, il
 * n'a pas à être fait d'une autre matière.*
 */
const DOS_BLEU: readonly [number, number, number] = [44, 96, 214]

/** Le crème du liseré et du découpage — celui des textes du gabarit. */
const DOS_CREME = '#fffaf0'

/**
 * LA MARGE DE DÉCOUPE D'UN STICKER, en centièmes de largeur.
 *
 * **Elle est la même pour les trois**, et c'est ce qui les fait lire comme une
 * planche : *une découpeuse ne change pas de réglage entre deux autocollants.*
 * Elle voyage dans une variable de module parce que le coeur se peint dans son
 * propre repère de 40 x 37, où une épaisseur en unités de carte ne veut plus
 * rien dire.
 */
const DOS_CERNE = 1.5

/**
 * LE PAS DU MOTIF, en centièmes de largeur — **et c'est un CLAVIER.**
 *
 * Un emoji vient d'un clavier : c'est l'argument qui a donné sa plaque claire à
 * la carte et sa pastille au type, et le dos le dit par son motif. Des carrés
 * très arrondis en quinconce, à peine plus clairs que le fond : *ça ne se
 * regarde pas, ça se reconnaît* — et c'est tout ce qu'un fond de dos doit
 * faire.
 */
const DOS_PAS = 11
const DOS_TOUCHE = 7.2

/**
 * **LE DOS DE LA COLLECTION D'EMOJI.**
 *
 * Keko : « je voudrais que tu me fasses un dos de carte thématique (celui-là
 * est obsolète et hors thème) ». *Et il l'était* : le dos du jeu d'extraction
 * est une ferronnerie — cadre de laiton, losange gravé, pierre sombre —
 * c'est-à-dire exactement ce que le contour simple et la plaque claire ont
 * retiré de la face. **Une carte ne peut pas parler deux langues selon le côté
 * qu'on regarde.**
 *
 * Quatre choses le portent, et chacune fait un travail que les autres ne font
 * pas :
 *
 * - **LE STICKER**, au centre : un disque jaune cerné de crème épais, avec son
 *   ombre portée. *C'est le découpage qui fait le sticker*, pas le dessin
 *   dedans — et un sticker est ce qu'un emoji EST sur un téléphone ;
 * - **LE MOTIF DE TOUCHES** (`DOS_PAS`), qui dit d'où la carte sort ;
 * - **LES CINQ COULEURS DU JEU** semées dans ce motif, à peine. *Elles y sont
 *   TOUTES, donc elles ne disent rien d'une carte en particulier* — et
 *   ensemble elles disent la collection. On n'invente aucune teinte : ce sont
 *   les tons moyens de `METAUX`, les mêmes que les cadres ;
 * - **LE LISERÉ CRÈME**, à la même épaisseur que le contour de la face :
 *   *c'est ce qui en fait le même objet vu de l'autre côté*, et la seule chose
 *   que les deux faces partagent.
 *
 * ***ET IL N'EST PAS SYMÉTRIQUE À 180°, ce qui est une règle que le dos du
 * gabarit tenait.*** Elle existait parce qu'« un dos qui aurait un haut et un
 * bas se lirait à l'envers une fois sur deux » — *et rien dans ce jeu ne montre
 * un dos à l'envers* : la culbute tourne sur l'axe vertical, le paquet pose ses
 * cinq cartes droites. **Un dos qui ne dirait pas l'emoji ne serait pas
 * thématique**, et c'est ce que Keko a demandé ; la symétrie gauche-droite, qui
 * est celle qu'on lit, est tenue.
 *
 * *Un smiley dit le GENRE et non le contenu* — un drapeau et un visage sont
 * tous deux des emoji — exactement comme une pokéball ne dit pas quel Pokémon
 * est sous la carte.
 */
async function peindreDosEmoji(rayon: number): Promise<HTMLCanvasElement> {
  const canvas = document.createElement('canvas')
  canvas.width = LARGE
  canvas.height = HAUT
  const ctx = canvas.getContext('2d')
  if (ctx === null) return canvas

  // LE LISERÉ D'ABORD, LE FOND DEDANS — la découpe de la face à l'identique :
  // même rectangle, même rayon, et *le rayon se compte sur le bord EXTÉRIEUR*
  // donc il décroît d'autant qu'on rentre.
  ctx.beginPath()
  ctx.roundRect(0, 0, LARGE, HAUT, LARGE * rayon)
  ctx.clip()
  const bord = ctx.createLinearGradient(0, 0, LARGE * 0.5, HAUT)
  bord.addColorStop(0, DOS_CREME)
  bord.addColorStop(0.55, '#f0dfc0')
  bord.addColorStop(1, '#dcc8a6')
  ctx.fillStyle = bord
  ctx.fillRect(0, 0, LARGE, HAUT)

  const marge = CONTOURS[PISTE_CONTOUR] * U
  ctx.save()
  ctx.beginPath()
  ctx.roundRect(
    marge,
    marge,
    LARGE - marge * 2,
    HAUT - marge * 2,
    Math.max(0, LARGE * rayon - marge),
  )
  ctx.clip()
  peindreDecor(ctx, undefined, DOS_BLEU)
  peindreTouches(ctx)

  // LE HALO DU STICKER : de la lumière tombée sur le fond, qui le détache du
  // motif sans lui donner de bord. *Le flou est dans la matière*, la règle du
  // contour des cartes et du halo des créatures.
  const cx = LARGE / 2
  const cy = HAUT / 2
  const r = 25 * U
  const halo = ctx.createRadialGradient(cx, cy, r * 0.8, cx, cy, r * 2.1)
  halo.addColorStop(0, '#ffffff2e')
  halo.addColorStop(1, '#ffffff00')
  ctx.fillStyle = halo
  ctx.fillRect(0, 0, LARGE, HAUT)

  await peindreBouquet(ctx, cx, cy)
  ctx.restore()
  return canvas
}

/**
 * LE MOTIF DE TOUCHES — une grille en quinconce, centrée sur la carte.
 *
 * **Elle se CENTRE au lieu de partir d'un coin** : une grille calée en haut à
 * gauche laisse une rangée coupée d'un côté et pas de l'autre, *et ça se lit
 * comme un motif mal posé.*
 *
 * **Et les cinq couleurs tombent par une fonction de la PLACE**, pas par un
 * tirage : *un semis qui se réarrangerait d'une peinture à l'autre ne serait
 * plus une matière.* Aucun hasard n'est consommé — il n'y a rien à rejouer.
 */
function peindreTouches(
  ctx: CanvasRenderingContext2D,
  l = LARGE,
  h = HAUT,
  u = U,
  masque = false,
  teinteImposee?: string,
): void {
  const pas = DOS_PAS * u
  const cote = DOS_TOUCHE * u
  const teintes = ['blanc', 'vert', 'bleu', 'violet', 'orange'].map((c) => METAUX[c]![2]!)
  const colonnes = Math.ceil(l / pas) + 2
  const lignes = Math.ceil(h / pas) + 2
  for (let j = -1; j < lignes; j++) {
    for (let i = -1; i < colonnes; i++) {
      // LE QUINCONCE : une demi-case de décalage une ligne sur deux. *Une
      // grille droite se lit comme un tableau, un quinconce comme un semis.*
      const x = l / 2 + (i - colonnes / 2 + (j % 2 === 0 ? 0 : 0.5)) * pas
      const y = h / 2 + (j - lignes / 2) * pas
      const k = (i * 7 + j * 11 + 34) % 17
      // UNE TEINTE IMPOSÉE : toutes les touches la prennent, à peine — c'est
      // la fenêtre d'art d'une carte, où seule la couleur du cran a le droit
      // de parler (voir TOUCHES_CARTE).
      const teinte = teinteImposee !== undefined ? teinteImposee : k < 5 ? teintes[k] : undefined
      // LES COULEURS S'AJOUTENT, ELLES NE SE POSENT PAS. En peinture normale,
      // un vert à 16 % sur un bleu franc ne donne pas un vert : il donne un
      // bleu sale — *une couleur peu opaque posée sur une autre se moyenne avec
      // elle.* En `lighter` elle s'ajoute, donc elle ÉCLAIRE : c'est la
      // différence entre une tache et un confetti.
      // EN MASQUE, SEULES LES TOUCHES CLAIRES BRILLENT. Keko : « je veux que
      // les touches brillent en fonction de leur niveau de clarté : certaines
      // sont plus claires et devraient briller fort, les autres autant que le
      // fond ». Les teintées sont les claires ; les autres ne se distinguent
      // du film que d'un rien, donc elles le laissent tel quel sur la carte de
      // brillance (voir brillanceDuSachet).
      if (masque && teinte === undefined) continue
      ctx.globalCompositeOperation = masque ? 'source-over' : teinte === undefined ? 'source-over' : 'lighter'
      ctx.fillStyle = masque ? '#ffffff' : (teinte ?? '#ffffff')
      ctx.globalAlpha = masque ? 1 : teinteImposee !== undefined ? TOUCHES_CARTE : teinte === undefined ? 0.055 : 0.3
      ctx.beginPath()
      ctx.roundRect(x - cote / 2, y - cote / 2, cote, cote, cote * 0.32)
      ctx.fill()
    }
  }
  ctx.globalAlpha = 1
  ctx.globalCompositeOperation = 'source-over'
}

/**
 * **LE BOUQUET : UN TAS DE VRAIS EMOJI, DÉCOUPÉS ET ENTASSÉS.**
 *
 * Keko, en deux fois : « je trouve l'icône de smiley un peu simplette... tu
 * crois qu'on pourrait faire un bouquet d'emoji (coeur, visage, un genre de
 * mixte) en logo ? », puis **« je voyais un bouquet plus chargé et chaotique,
 * utilisant de vrais emoji de notre pool »**.
 *
 * ***ET C'EST LA SECONDE MOITIÉ QUI COMPTE : des formes que JE dessine ne
 * seront jamais des emoji.*** Un disque jaune à deux yeux, un coeur et une
 * étoile peints à la main sont une IMITATION — soignée, mais une imitation — là
 * où le catalogue est fait de glyphes qui existent. *Le logo d'une collection
 * se compose de ce qu'elle contient*, et la carte sait déjà peindre un emoji :
 * c'est `imageDeLEmoji`, le même chemin que l'illustration de la face.
 *
 * **UN PAR RAYON, OU PRESQUE** — visages, symboles, gens, ciel, activités,
 * animaux, nourriture, voyage, objets, drapeaux. *Ils sont de partout, donc ils
 * ne disent rien d'une carte en particulier* : c'est l'argument des cinq
 * couleurs du motif, pris une seconde fois. **Et les deux premiers sont les
 * deux premiers du MONDE** — 😂 puis ❤️ au classement d'usage d'Unicode, celui
 * -là même qui décide des raretés du catalogue.
 *
 * **LE CHAOS SE COMPOSE, il ne se tire pas.** Les douze places sont écrites à
 * la main : *un tas tiré au hasard produit des trous et des collisions*, et
 * celui-ci doit tenir dans sa carte, laisser le motif respirer autour, et
 * garder son gros au centre. Trois anneaux — un gros, quatre moyens, sept
 * petits — et chacun penche d'un angle à lui, parce que *douze stickers droits
 * se lisent comme une grille.*
 *
 * **L'ORDRE DE LA LISTE EST L'ORDRE DE PEINTURE**, et il n'est pas trié par
 * taille : trois petits de la périphérie sont posés EN DERNIER, donc ils
 * passent devant leurs voisins. *Un tas dont tout le petit est dessous est un
 * tas rangé.*
 */
const BOUQUET: readonly { emoji: string; x: number; y: number; t: number; a: number }[] = [
  { emoji: '⭐', x: 2, y: -30, t: 16, a: 0.18 },
  { emoji: '🐱', x: -30, y: -14, t: 17, a: -0.4 },
  { emoji: '🍕', x: 30, y: -4, t: 17, a: 0.4 },
  { emoji: '⚽', x: -16, y: 27, t: 15, a: 0.3 },
  { emoji: '🚀', x: -6, y: 24, t: 18, a: -0.5 },
  { emoji: '🔥', x: -17, y: -20, t: 21, a: -0.22 },
  { emoji: '❤️', x: 16, y: -19, t: 22, a: 0.28 },
  { emoji: '👍', x: -20, y: 5, t: 21, a: 0.3 },
  { emoji: '🎉', x: 19, y: 10, t: 22, a: -0.33 },
  // LE GROS AU CENTRE, posé une fois ses voisins en place : *il est le sujet,
  // il doit rester entier.*
  { emoji: '😂', x: 0, y: -2, t: 29, a: -0.06 },
  // ET QUATRE PAR-DESSUS, tous en périphérie : ils ne cachent rien du centre et
  // ils cassent l'empilement régulier.
  { emoji: '🌈', x: -31, y: 12, t: 15, a: -0.3 },
  { emoji: '🏁', x: 30, y: -24, t: 15, a: 0.5 },
  { emoji: '💎', x: 7, y: 23, t: 16, a: 0.25 },
  { emoji: '🎁', x: 25, y: 24, t: 15, a: -0.25 },
]

/**
 * LA TOILE SUR LAQUELLE SE CALCULE LE CERNE, en pixels de côté. *Un cerne est
 * une forme douce* : à 256 il est net sur une carte de 768 et sur le sachet, et
 * sa transformée de distance tient en quelques millisecondes par glyphe.
 */
const TOILE_CERNE = 256

async function peindreBouquet(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  u = U,
  masque = false,
): Promise<void> {
  // ON ATTEND LA POLICE POUR CHAQUE CARACTÈRE, et les douze ENSEMBLE : *une
  // toile peinte avant que le glyphe soit là part en cache telle quelle*, donc
  // le défaut survivrait au chargement. La règle est déjà payée sur la face.
  await Promise.all(BOUQUET.map((p) => policeDeLEmoji(p.emoji)))
  for (const p of BOUQUET) {
    const image = imageDeLEmoji(p.emoji)
    // UN GLYPHE QUI MANQUE SE SAUTE, il ne laisse pas de trou carré : *le dos
    // doit sortir même si une police n'arrive pas.*
    if (image === null) continue
    collerSticker(ctx, image, cx + p.x * u, cy + p.y * u, p.t * u, p.a, u, masque)
  }
}

/**
 * LE CERNE D'UN EMOJI : sa silhouette DILATÉE d'un disque, en crème.
 *
 * Keko : « les contours blancs autour des emojis du paquet / dos de carte sont
 * un peu bizarres et font des artefacts moches — autour des moustaches du chat
 * ça fait plein de petits piques alors qu'il a juste trois moustaches ».
 *
 * ***ET C'ÉTAIT STRUCTUREL, PAS UN RÉGLAGE.*** Le cerne était l'UNION de seize
 * copies de la silhouette décalées sur un cercle. Pour un disque, l'union de
 * seize disques décalés fait un disque plus gros ; pour une MOUSTACHE — un
 * trait fin — elle fait seize traits en étoile, et aucun nombre de passes ne
 * remplit l'intérieur entre eux. *Le festonnage qu'on avait vu « entre les
 * passes » était le même défaut, vu sur une forme ronde.*
 *
 * Un cerne est une DILATATION : chaque point du contour s'épaissit d'un
 * disque, et c'est l'enveloppe de tous ces disques — pas leur échantillonnage.
 * On la calcule exactement : la silhouette est lue en alpha sur une toile
 * réduite, une transformée de distance euclidienne (Felzenszwalb, deux passes
 * séparables) donne à chaque pixel sa distance au glyphe, et le cerne est
 * l'ensemble des pixels à moins de `rayon` — avec un pixel de rampe pour que le
 * bord soit lisse. *Une moustache y devient une moustache plus épaisse, à bout
 * rond.*
 *
 * **Le rayon est en pixels de cette toile**, donc il dépend de la taille à
 * laquelle le sticker sera collé : mémorisé par glyphe ET par rayon, il n'y en
 * a qu'un par couple, et le dos comme le sachet ne le paient qu'une fois.
 */
/** Un cerne calculé : sa toile, et de combien elle déborde le carré du glyphe. */
interface Cerne {
  toile: HTMLCanvasElement
  /** La taille de la toile rapportée à celle du glyphe : le cerne se colle plus grand d'autant. */
  echelle: number
}
const CERNES_EMOJI = new WeakMap<HTMLCanvasElement, Map<number, Cerne>>()

/**
 * ET SA FINESSE SE CHOISIT. Keko, sur la face des cartes : « je trouve
 * l'outline blanc pas très lisse, il fait parfois bizarre, comme des
 * aspérités ». *Le cerne se calculait sur 256 pixels* — assez pour un sticker
 * de quelques dizaines de pixels sur le dos, pas pour un glyphe qui en fait
 * six cents sur une carte zoomée : agrandi deux fois et demie, son bord d'un
 * pixel devenait une marche, et la silhouette binaire d'où il part montrait
 * ses crans. La face le calcule à la taille du glyphe (`finesse` = 512), le
 * dos et le sachet gardent leurs 256. Mémorisé par rayon ET par finesse.
 */
function cerneDe(image: HTMLCanvasElement, rayon: number, finesse = TOILE_CERNE): Cerne {
  const r = Math.max(1, Math.round(rayon * 2) / 2)
  let parRayon = CERNES_EMOJI.get(image)
  if (parRayon === undefined) {
    parRayon = new Map()
    CERNES_EMOJI.set(image, parRayon)
  }
  const cle = r + finesse * 1000
  const garde = parRayon.get(cle)
  if (garde !== undefined) return garde

  // LA TOILE DÉBORDE LE GLYPHE D'UNE MARGE AU MOINS ÉGALE AU RAYON. Keko, sur
  // la première version : « c'est pire, l'outline est coupé droit par
  // endroits ». *Un glyphe occupe 80 % de son carré*, et un cerne d'un
  // dixième en sort dès qu'il touche son bord — la dilatation se faisait
  // couper net par la toile. Le glyphe est donc peint en retrait, et le cerne
  // se colle plus grand d'autant (`echelle`).
  const marge = Math.ceil(r) + 2
  const n = finesse + 2 * marge
  const toile = document.createElement('canvas')
  toile.width = n
  toile.height = n
  const echelle = n / finesse
  const cerne: Cerne = { toile, echelle }
  const ctx = toile.getContext('2d', { willReadFrequently: true })
  if (ctx === null) return cerne
  ctx.drawImage(image, marge, marge, finesse, finesse)
  const alpha = ctx.getImageData(0, 0, n, n).data

  // LA SILHOUETTE EST ADOUCIE AVANT D'ÊTRE DILATÉE. Keko : « l'outline blanc
  // autour des emoji des cartes a toujours des reliefs bizarres et n'est pas
  // lisse ». *Une dilatation est exacte : elle reproduit chaque accident du
  // contour* — un poil, une dent, une marche du glyphe — à la distance près.
  // Le masque passe donc par un flou en boîte, deux fois (ce qui approche une
  // gaussienne), puis se coupe à mi-hauteur : **le contour moyen ne bouge
  // pas, ses accidents plus petits que le rayon s'y fondent.** Le rayon suit
  // la finesse, ni plus ni moins que ce qu'un oeil lit comme un relief.
  const masque = new Float32Array(n * n)
  for (let i = 0; i < n * n; i++) masque[i] = alpha[i * 4 + 3]! / 255
  adoucirLeMasque(masque, n, Math.max(1, Math.round(finesse / 128)))
  adoucirLeMasque(masque, n, Math.max(1, Math.round(finesse / 128)))

  // LA DISTANCE AU GLYPHE, au carré, par deux passes séparables.
  const INF = 1e12
  const f = new Float64Array(n * n)
  for (let i = 0; i < n * n; i++) f[i] = masque[i]! > 0.5 ? 0 : INF
  const d = new Float64Array(n)
  const v = new Int32Array(n)
  const z = new Float64Array(n + 1)
  const ligne = new Float64Array(n)
  const dt1 = (): void => {
    let k = 0
    v[0] = 0
    z[0] = -INF
    z[1] = INF
    const croise = (q: number, p: number): number =>
      (ligne[q]! + q * q - (ligne[p]! + p * p)) / (2 * q - 2 * p)
    for (let q = 1; q < n; q++) {
      let sx = croise(q, v[k]!)
      while (sx <= z[k]!) {
        k--
        sx = croise(q, v[k]!)
      }
      k++
      v[k] = q
      z[k] = sx
      z[k + 1] = INF
    }
    k = 0
    for (let q = 0; q < n; q++) {
      while (z[k + 1]! < q) k++
      const vk = v[k]!
      d[q] = (q - vk) * (q - vk) + ligne[vk]!
    }
  }
  // Colonnes, puis lignes.
  for (let x = 0; x < n; x++) {
    for (let y = 0; y < n; y++) ligne[y] = f[y * n + x]!
    dt1()
    for (let y = 0; y < n; y++) f[y * n + x] = d[y]!
  }
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) ligne[x] = f[y * n + x]!
    dt1()
    for (let x = 0; x < n; x++) f[y * n + x] = d[x]!
  }

  // LE CERNE : tout ce qui est à moins de `r` du glyphe, bord adouci sur un
  // pixel, en crème.
  const sortie = ctx.createImageData(n, n)
  const px = sortie.data
  const creme = couleurDe(DOS_CREME)
  for (let i = 0; i < n * n; i++) {
    const dist = Math.sqrt(f[i]!)
    const a = Math.max(0, Math.min(1, r + 0.5 - dist))
    px[i * 4] = creme[0]
    px[i * 4 + 1] = creme[1]
    px[i * 4 + 2] = creme[2]
    px[i * 4 + 3] = Math.round(a * 255)
  }
  ctx.putImageData(sortie, 0, 0)
  parRayon.set(cle, cerne)
  return cerne
}

/** Un flou en boîte, séparable, sur un masque carré de côté n — en place. */
function adoucirLeMasque(m: Float32Array, n: number, r: number): void {
  const tmp = new Float32Array(n * n)
  const fenetre = r * 2 + 1
  for (let y = 0; y < n; y++) {
    let somme = 0
    for (let k = -r; k <= r; k++) somme += k < 0 ? 0 : m[y * n + k]!
    for (let x = 0; x < n; x++) {
      tmp[y * n + x] = somme / fenetre
      const sortant = x - r
      const entrant = x + r + 1
      if (sortant >= 0) somme -= m[y * n + sortant]!
      if (entrant < n) somme += m[y * n + entrant]!
    }
  }
  for (let x = 0; x < n; x++) {
    let somme = 0
    for (let k = -r; k <= r; k++) somme += k < 0 ? 0 : tmp[k * n + x]!
    for (let y = 0; y < n; y++) {
      m[y * n + x] = somme / fenetre
      const sortant = y - r
      const entrant = y + r + 1
      if (sortant >= 0) somme -= tmp[sortant * n + x]!
      if (entrant < n) somme += tmp[entrant * n + x]!
    }
  }
}

/** Les trois canaux d'une couleur CSS `#rrggbb`. */
function couleurDe(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]
}

/**
 * COLLER UN STICKER : son ombre, son cerne, puis le glyphe.
 *
 * *Ce qui fait le sticker est le cerne et l'ombre portée* — sans eux, douze
 * emoji entassés se lisent comme une bouillie, parce que **rien ne dit où l'un
 * s'arrête et où l'autre commence.** C'est la règle de la plaque claire, prise
 * par le même bout : elle porte son ombre pour dire qu'elle est POSÉE sur
 * l'image et non découpée dedans.
 *
 * **LE CERNE EST UNE DILATATION** (`cerneDe`), plus la silhouette répétée sur
 * un cercle : voir là-bas pourquoi les copies faisaient des piques. **Et
 * l'ombre se pose sur le cerne**, qui est la vraie découpe du sticker — c'est
 * lui qui touche le fond.
 */
function collerSticker(
  ctx: CanvasRenderingContext2D,
  image: HTMLCanvasElement,
  x: number,
  y: number,
  taille: number,
  angle: number,
  u = U,
  masque = false,
  finesse = TOILE_CERNE,
): void {
  const d = taille
  // LE RAYON DU CERNE EN PIXELS DE SA TOILE : l'épaisseur voulue à l'écran,
  // ramenée à l'échelle à laquelle le sticker sera collé.
  const cerne = cerneDe(image, (DOS_CERNE * u * finesse) / d, finesse)
  // La toile du cerne déborde le glyphe : elle se colle plus grande d'autant.
  const dc = d * cerne.echelle
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(angle)
  if (masque) {
    // EN MASQUE, LE STICKER EST SA DÉCOUPE, pleine : le cerne couvre le glyphe
    // et son contour, et c'est toute la surface qui brille.
    ctx.drawImage(cerne.toile, -dc / 2, -dc / 2, dc, dc)
    ctx.restore()
    return
  }
  ctx.save()
  ctx.shadowColor = '#00000055'
  ctx.shadowOffsetY = 1.1 * u
  ctx.shadowBlur = 2.6 * u
  ctx.drawImage(cerne.toile, -dc / 2, -dc / 2, dc, dc)
  ctx.restore()
  ctx.drawImage(cerne.toile, -dc / 2, -dc / 2, dc, dc)
  ctx.drawImage(image, -d / 2, -d / 2, d, d)
  ctx.restore()
}

async function peindreDos(rayon: number): Promise<HTMLCanvasElement> {
  const canvas = document.createElement('canvas')
  canvas.width = LARGE
  canvas.height = HAUT
  const ctx = canvas.getContext('2d')
  if (ctx === null) return canvas

  const dessin = await dessinDuDos()

  ctx.beginPath()
  ctx.roundRect(0, 0, LARGE, HAUT, LARGE * rayon)
  ctx.clip()

  peindreDecor(ctx, undefined, BASE_DOS)

  if (dessin !== null) {
    mesurerBoite('dos-de-carte', dessin)
    const b = boiteDe('dos-de-carte')
    const l = dessin.naturalWidth
    const h = dessin.naturalHeight
    // La boîte est donnée en fractions du cadre : on en tire la région à
    // prendre dans l'image, et elle vient couvrir la carte entière.
    const sx = b.gauche * l
    const sy = b.haut * h
    ctx.drawImage(dessin, sx, sy, l - sx - b.droite * l, h - sy - b.bas * h, 0, 0, LARGE, HAUT)
  }

  return canvas
}

/*
 * LE DOS EN IMAGE A DISPARU AVEC LE TAS QUI LE PLAQUAIT. Il servait aux deux
 * paquets, qui sont du SVG et avaient besoin d'une URL plutôt que d'une
 * texture ; ils sont désormais dessinés de bout en bout. *Du code mort ment sur
 * ce que le jeu fait* — et `git log` garde la recette, qui n'était qu'un
 * repeint du même canvas en 256.
 */

/**
 * UN DOS PAR RAYON DE COIN ET PAR PISTE, et il n'y en a que deux.
 *
 * *Le dos ne dit rien de ce qu'est la carte* — il ne porte ni rareté ni nom —
 * **mais il doit porter sa FORME** : un dos plus carré que son corps extrudé
 * dépasserait de sa silhouette aux coins. D'où le rayon dans la clé.
 *
 * **ET LA PISTE AVEC, depuis qu'il y en a deux.** Les deux collections ne
 * parlent pas la même langue — l'emoji a son sticker, le gabarit sa
 * ferronnerie — et *sans elle, le premier mode chargé imposerait son dos à
 * l'autre*, puisque les deux partagent le rayon dès qu'un mode change de
 * contour.
 */
const DOS = new Map<string, Promise<THREE.CanvasTexture>>()

export function textureDuDos(
  rayon = RAYON_CARTE,
  piste: 'emoji' | 'gabarit' = 'gabarit',
): Promise<THREE.CanvasTexture> {
  const cle = `${piste}|${rayon}`
  let dos = DOS.get(cle)
  if (dos === undefined) {
    dos = (piste === 'emoji' ? peindreDosEmoji(rayon) : peindreDos(rayon)).then(
      (canvas) => {
        const texture = new THREE.CanvasTexture(canvas)
        texture.anisotropy = 8
        texture.colorSpace = THREE.SRGBColorSpace
        return texture
      },
    )
    DOS.set(cle, dos)
  }
  return dos
}

/**
 * LE SACHET — ce qu'on déchire pour ouvrir un paquet.
 *
 * *Un paquet qui montre ses cinq dos d'emblée n'est pas un paquet, c'est une
 * main face cachée* : rien n'est fermé, donc il n'y a rien à ouvrir.
 *
 * **IL PARLE LA LANGUE DU DOS DE CARTE, et c'est tout le rework.** Keko : « je
 * voudrais que tu rework le paquet de cartes pour coller à la DA et au thème du
 * jeu ». *Il parlait encore la FERRONNERIE* — fond d'ambre, soleil de rayons,
 * filets de laiton, losanges de métal, petites capitales en Cinzel — c'est-à
 * -dire exactement ce que le contour simple, la plaque claire et le dos de
 * carte avaient retiré, un par un, à tout le reste du mode. **Et c'était le
 * dernier objet à le parler, alors que c'est l'écran qu'on voit en PREMIER.**
 *
 * ***UN EMBALLAGE DOIT ÊTRE FAIT DE LA MÊME CHOSE QUE CE QU'IL CONTIENT.***
 * Il ne reprend donc pas « un style voisin » : il appelle les MÊMES peintres
 * que le dos — `peindreDecor` pour la matière, `peindreTouches` pour le motif,
 * `peindreBouquet` pour la marque. *Deux dessins qui décrivent la même chose
 * divergent au premier réglage*, et c'est la règle que le coeur des armures a
 * déjà coûtée.
 *
 * **CE QUI RESTE DE L'ANCIEN, parce que ça ne disait pas la ferronnerie mais
 * l'EMBALLAGE** — et c'est la seule chose qu'aucun autre objet du jeu ne porte :
 *
 * - **LES DEUX BANDES THERMOSOUDÉES**, en haut et en bas, striées et
 *   dentelées. *Une carte, un cadre et un panneau ont des bords francs ; un
 *   emballage a des soudures.* Elles passent de l'aluminium au CRÈME, qui est
 *   la couleur du liseré des cartes ;
 * - **LA LIGNE POINTILLÉE « Ouvrir ici »**, juste sous la bande du haut : elle
 *   dit où ça se déchire AVANT qu'on y touche, donc elle annonce le geste ;
 * - **LE FORMAT HAUT ET ÉTROIT** (1 : 1,9). *Une pochette au format d'une carte
 *   se lit comme une carte géante*, donc comme un dos de plus, et on ne
 *   comprend plus qu'il y a quelque chose dedans.
 *
 * **ET LES ANGLES PASSENT DU BISEAU À L'ARRONDI.** *Un arrondi est une forme de
 * gabarit, une arête franche est de la ferronnerie* — la règle qui a ramené la
 * barre de vie de la capsule au biseau, et qui se joue ici **à l'envers**,
 * parce qu'ici le jeu ne parle pas ferronnerie : il parle d'un clavier.
 */
const SACHET_LARGE = 520

/**
 * OÙ LE SACHET SE DÉCHIRE, en part de sa hauteur depuis le haut.
 *
 * **C'EST UN CONTRAT PARTAGÉ**, pas un réglage du dessin : la texture pose la
 * ligne pointillée à cette hauteur, et `Sachet3D` y coupe ses deux plans —
 * celui qui reste, et la bande qui s'envole. *Deux valeurs qui décrivent la
 * même ligne se désaccordent au premier réglage*, et le raccord est
 * précisément ce qui ne doit jamais se voir.
 */
export const LIGNE_DECHIRURE = 0.145

/**
 * LA CARTE DANS SA POCHE : sa largeur, en parts de celle du sachet.
 *
 * Keko : « il faut que la zone bombée corresponde à la taille d'une carte et
 * que la zone enfoncée des bords corresponde à juste le bord du paquet ».
 * **C'est donc elle qui décide de tout le reste** — le bord, la hauteur du
 * sachet, la place du plateau et la largeur de ses flancs.
 */
const PART_CARTE = 0.78

/**
 * LE BORD DU SACHET AUTOUR DE SA CARTE, en parts de la largeur.
 *
 * *Le même tout autour* : c'est la distance sur laquelle le film retombe, et
 * un emballage n'a pas de raison d'être plus large d'un côté.
 */
const BORD_SACHET = (1 - PART_CARTE) / 2

/**
 * ***SA HAUTEUR SE DÉDUIT, ELLE NE SE CHOISIT PAS.***
 *
 * Keko : « le ratio du paquet ne match pas le ratio des cartes, il est trop
 * haut et pas assez large je crois, à vérifier ». **Mesuré : la carte vaut
 * 1,40 et le sachet valait 1,90** — donc une carte posée dedans n'en occupait
 * que 59 % de la hauteur, et tout le reste était du vide.
 *
 * Le sachet contient exactement : **la carte, son bord en haut et en bas, et
 * la bande qu'on déchire.** C'est cette somme, et rien d'autre.
 */
const SACHET_HAUT = Math.round(
  (SACHET_LARGE * (PART_CARTE * (HAUT / LARGE) + 2 * BORD_SACHET)) / (1 - LIGNE_DECHIRURE),
)
/**
 * LE RAYON DES ANGLES, en parts de la LARGEUR.
 *
 * *C'est celui de la carte* (`RAYON_SIMPLE`), et ce n'est pas une coïncidence
 * qu'on entretient : **le sachet et ce qu'il contient sont du même objet.**
 */
const SACHET_RAYON = RAYON_SIMPLE

/**
 * DE COMBIEN LE CREUX D'UNE DENT RENTRE, en parts de la hauteur du sachet.
 * *Les POINTES, elles, touchent le bord* : c'est une decoupe, donc elle ne peut
 * qu'enlever de la matiere.
 */
const PROF_DENT = 0.011

/**
 * L'UNITÉ DU SACHET — son centième de largeur, comme `U` l'est pour la carte.
 *
 * *Les peintres partagés parlent tous en centièmes de largeur* : sans ça le
 * motif de touches aurait un pas d'une carte sur un objet qui n'en a pas les
 * proportions, et il ne se lirait plus comme le même motif.
 */
const US = SACHET_LARGE / 100
/**
 * LE TITRE DU SACHET. Keko : « essayons "Emojis" ». *Le projet n'avait pas de
 * nom affiché, donc on n'en inventait pas* — c'est Keko qui le pose, et c'est
 * un essai : un mot, une ligne à changer.
 */
/**
 * LE VISAGE DU TITRE SE CHANGE D'UN LIEN. Keko : « on peut essayer un autre
 * emoji (face) que celui-ci ? » — *ce qui se teste doit pouvoir s'ouvrir d'un
 * lien* : `?visage=🤩` pose n'importe quel emoji à la place du « o », et le
 * défaut est celui qu'il a retenu en dernier.
 */
const VISAGE_DU_TITRE =
  (typeof location !== 'undefined' && new URLSearchParams(location.search).get('visage')) || '😄'
const TITRE_DU_SACHET = `Em${VISAGE_DU_TITRE}jis`

/**
 * LE TITRE EST UNE RANGÉE DE STICKERS, PAS UN MOT. Keko : « je suis pas hyper
 * fan du titre "Emojis" sur le paquet… on peut avoir un truc plus juicy et
 * fun ? Peut-être en utilisant un emoji dans le texte… aussi c'est très droit
 * comme titre, peut-être placer les lettres d'une manière plus originale ».
 *
 * Deux choses, et elles tiennent ensemble :
 *
 * - **un emoji REMPLACE une lettre** — le « o », qui est un visage à un
 *   cheveu près. *Le logo d'une collection se compose de ce qu'elle contient*,
 *   la règle du bouquet ; il est collé par `collerSticker`, donc avec le cerne
 *   et l'ombre des autres stickers de la planche ;
 * - **chaque lettre est posée À PART** : sa hauteur, son penchant et sa taille
 *   viennent de trois tables, fixes — *une matière n'est pas un tirage de
 *   partie*, le titre doit être le même à chaque chargement. Six lettres
 *   droites sur une ligne font une enseigne ; six stickers collés un peu de
 *   travers font un paquet qu'on a envie d'ouvrir.
 *
 * Le masque de brillance passe par le MÊME peintre (`masque`) : *deux dessins
 * qui décrivent la même chose divergent au premier réglage*, et c'est ce qui
 * garantit qu'une lettre brille exactement là où elle est imprimée.
 */
const PICTO = /\p{Extended_Pictographic}/u
/** Le décalage vertical de chaque glyphe, en part de la taille de police. */
const TITRE_HAUTEURS = [0.03, -0.07, 0.05, -0.05, 0.04, -0.06]
/** Son penchant, en radians. */
const TITRE_PENCHES = [-0.12, 0.09, -0.06, 0.11, -0.09, 0.07]
/** Et sa taille, en part de la taille commune. */
const TITRE_ECHELLES = [1.04, 0.98, 1.1, 0.97, 1.04, 1.0]
/** La toile de l'emoji du titre, en part du corps : voir `peindreTitreDuSachet`. */
const TAILLE_EMOJI_TITRE = 0.78

/** La même silhouette, dans une autre couleur : l'alpha reste, le pigment change. */
function teinter(toile: HTMLCanvasElement, couleur: string): HTMLCanvasElement {
  const copie = document.createElement('canvas')
  copie.width = toile.width
  copie.height = toile.height
  const ctx = copie.getContext('2d')
  if (ctx === null) return toile
  ctx.drawImage(toile, 0, 0)
  ctx.globalCompositeOperation = 'source-in'
  ctx.fillStyle = couleur
  ctx.fillRect(0, 0, copie.width, copie.height)
  return copie
}

async function peindreTitreDuSachet(
  ctx: CanvasRenderingContext2D,
  l: number,
  cy: number,
  masque: boolean,
): Promise<void> {
  const glyphes = Array.from(TITRE_DU_SACHET)
  await policeRonde()
  await Promise.all(glyphes.filter((g) => PICTO.test(g)).map((g) => policeDeLEmoji(g)))
  const taille = l * 0.19
  ctx.save()
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = `800 ${taille}px ${FAMILLE_RONDE}`
  ctx.lineJoin = 'round'
  const n = TITRE_HAUTEURS.length
  const echelle = (i: number): number => TITRE_ECHELLES[i % n]!
  // LA LARGEUR DE CHAQUE GLYPHE, à son échelle : un emoji vaut à peu près un
  // carré de la taille de police, moins ses marges.
  const largeurs = glyphes.map((g, i) =>
    PICTO.test(g) ? taille * TAILLE_EMOJI_TITRE * 0.9 : ctx.measureText(g).width * echelle(i),
  )
  const ecart = l * 0.006
  const total = largeurs.reduce((a, b) => a + b, 0) + ecart * (glyphes.length - 1)
  let x = l / 2 - total / 2
  for (const [i, g] of glyphes.entries()) {
    const cx = x + largeurs[i]! / 2
    const y = cy + TITRE_HAUTEURS[i % n]! * taille
    ctx.save()
    ctx.translate(cx, y)
    ctx.rotate(TITRE_PENCHES[i % n]!)
    ctx.scale(echelle(i), echelle(i))
    if (PICTO.test(g)) {
      // L'EMOJI PORTE LE CERNE DES LETTRES, pas celui des stickers. Keko : « il
      // faudrait appliquer le même style (outline blanc fin + contour noir +
      // ombre en bas) à l'emoji du titre pour matcher les lettres ». *Un mot
      // dont une lettre est habillée autrement n'est plus un mot.* Les trois
      // couches, aux mêmes épaisseurs : le trait sombre déborde de l'encre de
      // l * 0,015 et porte l'ombre, le crème de l * 0,007 par-dessus, puis le
      // glyphe. Chaque cerne est une dilatation (`cerneDe`), le sombre teinté
      // depuis le crème par `source-in`.
      const image = imageDeLEmoji(g)
      if (image !== null) {
        // À LA TAILLE D'UN « o », ET À SA HAUTEUR. Keko : « on peut réduire un
        // peu la taille de l'emoji pour la rapprocher de la taille d'un
        // "O" ? » *Le glyphe occupe 80 % de sa toile*, et un « o » de Baloo 2
        // fait un peu plus de la moitié du corps : la toile vaut donc
        // TAILLE_EMOJI_TITRE du corps, et le sticker descend au centre des
        // bas-de-casse, sous le milieu de l'em-box.
        const d = taille * TAILLE_EMOJI_TITRE
        ctx.translate(0, taille * 0.07)
        const sombre = cerneDe(image, (l * 0.015 * TOILE_CERNE) / d)
        const clair = cerneDe(image, (l * 0.007 * TOILE_CERNE) / d)
        const ds = d * sombre.echelle
        const dc = d * clair.echelle
        if (masque) {
          ctx.drawImage(sombre.toile, -ds / 2, -ds / 2, ds, ds)
        } else {
          ctx.save()
          ctx.shadowColor = '#00000066'
          ctx.shadowBlur = l * 0.02
          ctx.shadowOffsetX = l * 0.01
          ctx.shadowOffsetY = l * 0.016
          ctx.drawImage(teinter(sombre.toile, '#16202a'), -ds / 2, -ds / 2, ds, ds)
          ctx.restore()
          ctx.drawImage(clair.toile, -dc / 2, -dc / 2, dc, dc)
          ctx.drawImage(image, -d / 2, -d / 2, d, d)
        }
      }
    } else if (masque) {
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = l * 0.03
      ctx.strokeText(g, 0, 0)
      ctx.fillStyle = '#ffffff'
      ctx.fillText(g, 0, 0)
    } else {
      // L'OMBRE PORTÉE, vers le bas-droit : *c'est ce qui dit qu'il est POSÉ
      // sur le film et non imprimé dedans* — la règle de la plaque claire et
      // des stickers. Le cerne se trace AVANT le remplissage, sinon il mord sur
      // les lettres.
      ctx.shadowColor = '#00000066'
      ctx.shadowBlur = l * 0.02
      ctx.shadowOffsetX = l * 0.01
      ctx.shadowOffsetY = l * 0.016
      ctx.strokeStyle = '#16202a'
      ctx.lineWidth = l * 0.03
      ctx.strokeText(g, 0, 0)
      ctx.shadowColor = 'transparent'
      ctx.strokeStyle = DOS_CREME
      ctx.lineWidth = l * 0.014
      ctx.strokeText(g, 0, 0)
      // ET LA COULEUR D'UN EMOJI : du jaune pâle à l'orange, de haut en bas.
      // Keko : « on peut styliser / colorer un peu le titre ? il est fade ».
      // *Un crème sur du bleu est un aplat* ; le jaune-orange est la couleur du
      // visage qui rit au centre du bouquet, donc le titre et la marque parlent
      // la même langue. Le haut est presque blanc : la lumière vient du haut.
      const encre = ctx.createLinearGradient(0, -taille * 0.47, 0, taille * 0.47)
      encre.addColorStop(0, '#fff6b0')
      encre.addColorStop(0.45, '#ffcf2a')
      encre.addColorStop(1, '#ff7a1a')
      ctx.fillStyle = encre
      ctx.fillText(g, 0, 0)
    }
    ctx.restore()
    x += largeurs[i]! + ecart
  }
  ctx.restore()
}

let SACHET: Promise<{ film: THREE.CanvasTexture; brillance: THREE.CanvasTexture }> | null = null

/**
 * Le contour du sachet : un rectangle à quatre angles ARRONDIS.
 *
 * *Il a eu quatre angles abattus*, la ferronnerie du lieu — et c'est
 * exactement ce que le rework retire. **Le rayon se compte sur le bord
 * EXTÉRIEUR**, donc il décroît d'autant qu'on rentre : à rayon constant, les
 * coins du liseré seraient plus épais que ses côtés. *Règle déjà payée sur les
 * cases vides du chargement, puis sur le contour simple des cartes.*
 */
function cheminDuSachet(ctx: CanvasRenderingContext2D, l: number, h: number, r: number): void {
  const p = h * PROF_DENT
  ctx.beginPath()
  ctx.moveTo(0, h - r)
  ctx.lineTo(0, r)
  ctx.quadraticCurveTo(0, 0, r, 0)
  dentsDuBord(ctx, l, r, l - r, 0, p)
  ctx.quadraticCurveTo(l, 0, l, r)
  ctx.lineTo(l, h - r)
  ctx.quadraticCurveTo(l, h, l - r, h)
  dentsDuBord(ctx, l, l - r, r, h, h - p)
  ctx.quadraticCurveTo(0, h, 0, h - r)
  ctx.closePath()
}

/**
 * LA DENTELURE D'UN BORD, **pointes vers le DEHORS.**
 *
 * Keko : « les bandes superieure et inferieure doivent avoir les petits pics
 * vers l'exterieur, comme sur lexicodex ». *Elle mordait vers l'INTERIEUR*,
 * donc le sachet gardait un bord franc : **on lisait une bande dentelee POSEE
 * sur un rectangle, pas un film DECOUPE en zigzag.**
 *
 * ***C'est la SILHOUETTE qui doit porter la decoupe***, pas un dessin pose
 * dessus — une molette crantee coupe le film de part en part, elle ne decore
 * pas sa marge.
 *
 * **Le compte de dents est ARRONDI a l'entier sur la portee**, sinon la
 * derniere serait tronquee au coin : *une dentelure qui ne retombe pas juste se
 * lit comme une decoupe ratee.*
 */
function dentsDuBord(
  ctx: CanvasRenderingContext2D,
  l: number,
  x0: number,
  x1: number,
  pointe: number,
  creux: number,
): void {
  const n = Math.max(2, Math.round(Math.abs(x1 - x0) / (l / 26)))
  const pas = (x1 - x0) / n
  for (let i = 0; i < n; i += 1) {
    ctx.lineTo(x0 + pas * (i + 0.5), creux)
    ctx.lineTo(x0 + pas * (i + 1), pointe)
  }
}

/**
 * UNE BANDE THERMOSOUDEE : du film, strie, qui va jusqu'au BORD.
 *
 * ***ELLE NE DESSINE PLUS SA DENTELURE : c'est la silhouette du sachet qui la
 * porte*** (`cheminDuSachet`), et le clip du sachet la lui taille. **Un seul
 * endroit decrit la decoupe**, donc les pics de la bande et ceux du sachet ne
 * peuvent pas se desaccorder — *deux traces qui decriraient le meme zigzag
 * divergeraient au premier reglage.*
 *
 * **ELLE EST CREME, PLUS ALUMINIUM.** Le gris d'alu etait juste pour un sachet
 * de ferronnerie ; ici *le creme etait deja la couleur du lisere des cartes*, et
 * une soudure est precisement l'endroit ou le film se replie sur lui-meme —
 * donc ou il montre son envers. **On ne change pas la piece, on change sa
 * matiere.** Et depuis que le lisere est parti, **c'est elle seule qui porte le
 * creme** : le sachet n'a plus de bord clair, il a deux soudures.
 */
function peindreSoudure(
  ctx: CanvasRenderingContext2D,
  l: number,
  h: number,
  ep: number,
  versLeBas: boolean,
): void {
  const dent = l / 26
  const dehors = versLeBas ? 0 : h
  const dedans = versLeBas ? ep : h - ep
  ctx.save()

  const film = ctx.createLinearGradient(0, dehors, 0, dedans)
  film.addColorStop(0, DOS_CREME)
  film.addColorStop(0.45, '#f0dfc0')
  film.addColorStop(1, '#d9c5a3')
  ctx.fillStyle = film
  ctx.fillRect(0, Math.min(dehors, dedans), l, ep)

  // LE GAUFRAGE : des stries VERTICALES, parce que c'est ainsi qu'une soudure
  // se presse. *Un aplat clair ne dit pas une soudure, il dit une marge.*
  ctx.globalAlpha = 0.3
  ctx.strokeStyle = '#a89470'
  ctx.lineWidth = Math.max(1, l * 0.004)
  for (let x = dent / 4; x < l; x += dent / 2) {
    ctx.beginPath()
    ctx.moveTo(x, Math.min(dehors, dedans))
    ctx.lineTo(x, Math.max(dehors, dedans))
    ctx.stroke()
  }
  ctx.restore()
}
/**
 * LA PASTILLE DU CONTENU : « 5 CARTES », en clair sur le bleu.
 *
 * *C'est le vocabulaire d'une app*, exactement comme la pastille du type au bas
 * d'une carte — et c'est un `border-radius: 999px` assumé pour la même raison :
 * **la règle « un arrondi est une forme de gabarit » ne vaut que là où le jeu
 * parle ferronnerie.** Ici il parle d'un clavier.
 *
 * *Elle remplace un cartouche à coins coupés, un mot gravé entre deux filets et
 * deux lignes de petites capitales* — trois pièces de ferronnerie pour dire un
 * nombre.
 */
function peindrePastilleDuSachet(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  mot: string,
  corps: number,
): void {
  ctx.font = `700 ${corps}px ${FAMILLE_RONDE}`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.letterSpacing = `${corps * 0.08}px`
  const w = ctx.measureText(mot).width + corps * 1.5
  const h = corps * 1.9
  ctx.beginPath()
  ctx.roundRect(cx - w / 2, cy - h / 2, w, h, h / 2)
  const plaque = ctx.createLinearGradient(0, cy - h / 2, 0, cy + h / 2)
  plaque.addColorStop(0, DOS_CREME)
  plaque.addColorStop(1, '#e4d6bd')
  ctx.fillStyle = plaque
  ctx.fill()
  ctx.fillStyle = '#16202a'
  ctx.fillText(mot, cx, cy + corps * 0.04)
  ctx.letterSpacing = '0px'
  ctx.textBaseline = 'alphabetic'
}

/**
 * LA CARTE DE BRILLANCE DU SACHET : ce qui luit, en blanc sur noir.
 *
 * Keko : « c'est possible que certaines parties du booster soient plus
 * brillantes que d'autres ? par ex les petits carrés bleus, les emoji et le
 * titre pourraient briller comme actuellement, et le fond du booster un peu
 * moins ». *C'est la carte de rugosité de lexicodex*, celle que la note
 * disait « à rouvrir le jour où il faudra que le bouquet cesse de briller
 * comme le film qui le porte » — ici c'est l'inverse qui est demandé, et
 * c'est la même carte : **le film porte une matière, l'imprimé en porte une
 * autre.**
 *
 * Elle se peint AVEC LES MÊMES PEINTRES que le film, en mode masque : les
 * touches pleines, les stickers par leur découpe, le titre par son tracé —
 * *deux dessins qui décrivent la même chose divergent au premier réglage*, et
 * c'est ce qui garantit qu'un carré brille exactement là où il est imprimé.
 * Le nuanceur la lit comme une DONNÉE (pas de sRGB) : 0 le film, 1 l'imprimé.
 */
async function peindreLaBrillanceDuSachet(): Promise<HTMLCanvasElement> {
  const l = SACHET_LARGE
  const h = SACHET_HAUT
  const canvas = document.createElement('canvas')
  canvas.width = l
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (ctx === null) return canvas
  // TROIS NIVEAUX : le film à mi-gris, l'imprimé en blanc, et les SOUDURES en
  // noir — Keko : « diminuer la brillance des parties jaunes en haut et en bas
  // (avec les dents) ». *Une soudure est du film pressé à plat*, ce n'est ni
  // un imprimé ni un film tendu : elle a sa propre matière. Le nuanceur lit
  // les trois (voir BRILLANCE_SOUDURE et BRILLANCE_FILM).
  ctx.fillStyle = '#808080'
  ctx.fillRect(0, 0, l, h)
  peindreTouches(ctx, l, h, US, true)
  const cyT = h * 0.27
  const cyM = h * 0.56
  await peindreTitreDuSachet(ctx, l, cyT, true)
  await peindreBouquet(ctx, l / 2, cyM, US * 0.75, true)
  // LES SOUDURES, aux mêmes mesures que sur le film (voir peindreLeSachet).
  ctx.fillStyle = '#000000'
  ctx.fillRect(0, 0, l, h * 0.047)
  ctx.fillRect(0, h - h * 0.047, l, h * 0.047)
  return canvas
}

async function peindreLeSachet(): Promise<{
  film: HTMLCanvasElement
  brillance: HTMLCanvasElement
}> {
  const l = SACHET_LARGE
  const h = SACHET_HAUT
  const r = l * SACHET_RAYON
  const canvas = document.createElement('canvas')
  canvas.width = l
  canvas.height = h
  const brillance = await peindreLaBrillanceDuSachet()
  const ctx = canvas.getContext('2d')
  if (ctx === null) return { film: canvas, brillance }

  // LE FILM VA JUSQU'AU BORD — **il n'y a plus de lisere.** Keko : « on peut
  // enlever le contour du paquet ». *Un sachet n'a pas de cadre* : il a un film
  // imprime et deux soudures, et c'est tout. Le creme ne vit donc plus que la
  // ou le film se replie sur lui-meme.
  ctx.save()
  cheminDuSachet(ctx, l, h, r)
  ctx.clip()

  // LA MATIÈRE EST CELLE DU DOS, par le même peintre : dégradé vertical,
  // vignettage elliptique, dither. *Le sachet et ce qu'il contient sont du même
  // objet*, donc ils ne peuvent pas être faits de deux matières.
  peindreDecor(ctx, undefined, DOS_BLEU, { l, h })
  peindreTouches(ctx, l, h, US)

  const yL = h * LIGNE_DECHIRURE

  // LE HALO DE LA MARQUE : de la lumière tombée sur le fond, qui détache le
  // bouquet du motif sans lui donner de bord. *Le flou est dans la matière.*
  /**
   * **LE BOUQUET SE MESURE À LA BANDE QU'ON LUI LAISSE**, et c'est ce que le
   * raccourcissement du sachet a rendu visible : *il était dimensionné en
   * LARGEUR et placé en HAUTEUR*, donc il n'a pas bougé quand la place, elle,
   * a fondu de 19 % — et sa fusée est venue mordre l'éventail.
   *
   * ***Un contenu qui ne suit qu'une dimension déborde dès que l'autre se
   * resserre*** : la règle déjà payée sur la bande de stats et les onglets du
   * coffre.
   */
  /**
   * **L'ÉVENTAIL EST PARTI, ET LE SACHET PORTE UN TITRE.** Keko : « on peut
   * supprimer les 3 cartes dessinées sur le paquet et descendre vers le bas
   * les emoji pour écrire un titre au-dessus ? Essayons "Emojis" ». *Le
   * sachet disait deux fois ce qu'il contient* — le bouquet ET trois faces de
   * cartes — et il ne nommait rien. Le mot prend la place du haut, le bouquet
   * descend dans celle que l'éventail a rendue. Trois étages, et chacun dit
   * une chose : le NOM, la MARQUE, le CONTENU (la pastille et l'échelle).
   */
  const cyT = h * 0.27
  const cyM = h * 0.56
  const halo = ctx.createRadialGradient(l / 2, cyM, l * 0.16, l / 2, cyM, l * 0.46)
  halo.addColorStop(0, '#ffffff2e')
  halo.addColorStop(1, '#ffffff00')
  ctx.fillStyle = halo
  ctx.fillRect(0, 0, l, h)

  // LE TITRE : une rangée de stickers, en Baloo 2 — voir `peindreTitreDuSachet`.
  await peindreTitreDuSachet(ctx, l, cyT, false)

  // LA MARQUE : LE BOUQUET DU DOS, en grand. *Le logo d'une collection se
  // compose de ce qu'elle contient* — et c'est déjà lui qui dit à quel jeu ces
  // cartes appartiennent, donc le sachet n'a pas de second signe à porter.
  await peindreBouquet(ctx, l / 2, cyM, US * 0.75)

  peindrePastilleDuSachet(ctx, l / 2, h * 0.8, '5 CARTES', l * 0.052)

  // LES CINQ CRANS, en pastilles : *ce qu'on peut y trouver*, dit par l'échelle
  // du mode plutôt que par une phrase. **Cinq et non quatre** : les losanges de
  // métal disaient l'échelle de l'archive, pas celle de cette collection.
  const rc = l * 0.028
  const pas = l * 0.095
  for (const [i, cran] of ['blanc', 'vert', 'bleu', 'violet', 'orange'].entries()) {
    const cx = l / 2 + (i - 2) * pas
    const cy = h * 0.873
    ctx.beginPath()
    ctx.arc(cx, cy, rc, 0, Math.PI * 2)
    ctx.fillStyle = METAUX[cran]![2]!
    ctx.fill()
    // LE MÊME CERNE CRÈME QUE LES STICKERS : *c'est une planche d'autocollants,
    // et une découpeuse ne change pas de réglage entre deux pièces.*
    ctx.strokeStyle = DOS_CREME
    ctx.lineWidth = DOS_CERNE * US * 0.9
    ctx.stroke()
  }

  // LA LIGNE POINTILLÉE « Ouvrir ici » : elle dit où ça se déchire AVANT qu'on
  // y touche. *Un objet qui attend un geste doit dire lequel.*
  //
  // **SES FLÈCHES NE VONT QUE VERS LA DROITE**, depuis qu'on ouvre en tirant :
  // *deux flèches opposées disent « ça s'ouvre », une seule direction dit
  // « tire par ici ».*
  ctx.save()
  ctx.strokeStyle = '#fffaf0bb'
  ctx.lineWidth = Math.max(1.5, l * 0.007)
  ctx.setLineDash([l * 0.03, l * 0.024])
  ctx.beginPath()
  ctx.moveTo(l * 0.06, yL)
  ctx.lineTo(l * 0.94, yL)
  ctx.stroke()
  ctx.restore()

  // ET LE MOT EST EN BALOO 2, EN CASSE ORDINAIRE. *Les petites capitales d'un
  // serif gravé sont la voix d'une plaque de métal* ; une application écrit
  // « Ouvrir ici ».
  //
  // **IL SE POSE AU DÉPART DE LA DÉCOUPE, PAS AU MILIEU DU SACHET.** Keko :
  // « les étincelles sont toujours un peu en retard à gauche de mon doigt ».
  // ***Centré, le mot invitait à poser le doigt au milieu*** — alors que le
  // front part toujours du bord gauche : un demi-sachet d'écart dès le premier
  // pixel, qu'aucun réglage de vitesse ne peut rattraper.
  //
  // *Un repère qui dit de poser le doigt ailleurs qu'au départ de la découpe
  // garantit le décalage qu'on cherche à corriger ailleurs* — et les chevrons
  // n'ont jamais dit autre chose : ils montrent la droite, donc le mot est à
  // gauche.
  ctx.textAlign = 'left'
  ctx.fillStyle = '#fffaf0ee'
  ctx.font = `800 ${l * 0.058}px ${FAMILLE_RONDE}`
  ctx.letterSpacing = `${l * 0.004}px`
  ctx.fillText('Ouvrir ici  ▸▸▸', l * 0.06, yL - l * 0.028)
  ctx.letterSpacing = '0px'
  ctx.textAlign = 'center'

  // LES DEUX SOUDURES, en dernier : elles se posent SUR l'imprimé, parce que
  // c'est ainsi qu'un sachet se ferme — on imprime le film, puis on le soude.
  peindreSoudure(ctx, l, h, h * 0.047, true)
  peindreSoudure(ctx, l, h, h * 0.047, false)
  ctx.restore()
  return { film: canvas, brillance }
}

/** Le rapport du sachet, pour que le plan qui le porte l'ait aussi. */
export const RAPPORT_SACHET = SACHET_HAUT / SACHET_LARGE

/**
 * LA POCHE : **où la carte est dans son sachet**, en UV du sachet, et sur
 * quelle distance le film retombe autour d'elle.
 *
 * *C'est la texture qui le sait* — elle seule connaît la taille d'une carte,
 * le bord qu'on lui laisse et la bande qu'on déchire. `Sachet3D` ne fait que
 * la bomber. **Deux endroits qui décriraient la même boîte se
 * désaccorderaient au premier réglage.**
 *
 * **ELLE EST CENTRÉE SUR LE SACHET ENTIER.** Keko : « il faut que la hauteur
 * entre l'arête supérieure et le haut du paquet soit la même qu'entre l'arête
 * d'en bas et le bas du paquet ».
 *
 * *Elle était centrée sur la zone SOUS la déchirure*, ce qui paraît juste —
 * c'est là que la carte tient — **et donnait 0,217 d'air en haut contre 0,072
 * en bas**, soit trois fois plus. ***Un coussin décentré se lit comme un
 * coussin de travers***, et l'oeil compare au bord de l'objet, pas au bord de
 * sa partie utile.
 *
 * **Et l'arête haute tombe alors sur le pointillé** (0,8558 contre 0,8550) :
 * *le film se plie là où on l'ouvre*, ce qui n'était pas cherché mais qui
 * tombe bien.
 */
export const POCHE = {
  demiX: PART_CARTE / 2,
  demiY: (PART_CARTE * (HAUT / LARGE)) / RAPPORT_SACHET / 2,
  centreY: 0.5,
  flancX: BORD_SACHET,
  flancY: BORD_SACHET / RAPPORT_SACHET,
}

/**
 * LA CARTE DES PLIS DU FILM : **des SEGMENTS, pas un champ.**
 *
 * Keko, trois fois de suite : « on dirait des vagues », « ça fait toujours des
 * vagues », « je voyais vraiment des traits droits de plis… tu peux pas fouiller
 * lexicodex et voir comment ils font ? »
 *
 * ***ET LA RÉPONSE EST QU'ILS NE LE FONT PAS DANS UN SHADER.*** Leur `stage.js`
 * n'a que huit fonctions GLSL — `packBulge`, `tearLine`, `sdRoundRect`… — et pas
 * une seule ne parle de pli. **Les plis sont une normal map peinte au canvas**,
 * passée à un `MeshStandardMaterial` en `normalScale` 0,45. *J'ai cherché trois
 * fois une formule là où il y avait un DESSIN.*
 *
 * **ET C'EST STRUCTUREL, PAS UN GOÛT** : un champ procédural continu est
 * partout à la fois, donc il ne peut produire que des ondes ou des lignes de
 * niveau — ***il n'a aucun moyen de faire un trait qui COMMENCE et qui
 * FINIT.*** Un pli de papier, lui, a deux bouts.
 *
 * Soixante-dix traits, et chacun porte quatre décisions :
 *
 * - **une DIRECTION et une LONGUEUR** : c'est un segment droit, et c'est tout
 *   ce que Keko demandait depuis le début ;
 * - **un profil GAUSSIEN en travers**, large de deux à sept pixels — *un pli
 *   marqué est une rainure, pas une marche* ;
 * - **une amplitude SIGNÉE** : un pli se voit par-dessus ou par-dessous selon
 *   le sens où le papier s'est replié ;
 * - **une extinction aux DEUX BOUTS** (`sin`), sinon le trait s'arrête net et
 *   se lit comme un trait tracé plutôt que comme une marque.
 *
 * **QUARANTE SUR SOIXANTE-DIX SONT DES PLIS DE BORD**, posés dans la marge et
 * ***perpendiculaires au bord qu'ils longent*** : c'est là que le film a du mou,
 * et c'est dans cette direction qu'il se tasse. Les trente autres courent où ils
 * veulent, plus longs et plus doux — *un sachet n'est pas plissé qu'à ses
 * bords, il l'est surtout là.*
 *
 * **ET LE CHAMP SE FLOUTE DEUX FOIS AVANT DE DEVENIR UNE NORMALE.** Sans ça
 * chaque trait garderait l'escalier de sa propre rastérisation, et *une arête
 * crénelée scintille dès que l'objet bouge.*
 *
 * **LE TIRAGE EST SEEDÉ EN DUR**, et ce n'est pas le RNG du jeu : *une matière
 * n'est pas un tirage de partie* — le sachet doit avoir exactement les mêmes
 * plis à chaque chargement, sinon ce n'est plus un objet, c'est un effet.
 */
const PLIS_LARGE = 512
const NB_PLIS = 70
const PLIS_DE_BORD = 40

function peindreLesPlis(): HTMLCanvasElement {
  const L = PLIS_LARGE
  const H = Math.round(L * RAPPORT_SACHET)
  const champ = new Float32Array(L * H)

  // UN RNG SEEDÉ ET LOCAL : mulberry32, le même que celui du jeu, mais il ne
  // décide de rien — il ne fait que figer un dessin.
  let graine = 1234 >>> 0
  const rnd = (): number => {
    graine = (graine + 0x6d2b79f5) >>> 0
    let t = Math.imul(graine ^ (graine >>> 15), 1 | graine)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }

  const margeX = POCHE.flancX * L
  const margeY = POCHE.flancY * H

  for (let i = 0; i < NB_PLIS; i += 1) {
    const auBord = i < PLIS_DE_BORD
    let x0 = 0
    let y0 = 0
    let angle = 0
    if (auBord) {
      // LE CÔTÉ, puis la profondeur dans la marge — et l'angle est celui du
      // bord PLUS un quart de tour : *un film se tasse en travers de son bord.*
      const cote = Math.floor(rnd() * 4)
      const prof = rnd() * 2
      if (cote === 0) {
        x0 = rnd() * L
        y0 = margeY * prof
        angle = Math.PI / 2 + (rnd() - 0.5) * 0.9
      } else if (cote === 1) {
        x0 = rnd() * L
        y0 = H - margeY * prof
        angle = Math.PI / 2 + (rnd() - 0.5) * 0.9
      } else if (cote === 2) {
        x0 = margeX * prof
        y0 = rnd() * H
        angle = (rnd() - 0.5) * 0.9
      } else {
        x0 = L - margeX * prof
        y0 = rnd() * H
        angle = (rnd() - 0.5) * 0.9
      }
    } else {
      x0 = rnd() * L
      y0 = rnd() * H
      angle = rnd() * Math.PI
    }

    const lon = (auBord ? 20 : 60) + rnd() * (auBord ? 60 : 200)
    const amp = (rnd() - 0.5) * (auBord ? 1.6 : 0.9)
    const larg = 2 + rnd() * 5
    const dx = Math.cos(angle)
    const dy = Math.sin(angle)
    const fen = Math.ceil(larg * 2)

    for (let t = 0; t < lon; t += 1) {
      const cx = x0 + dx * t
      const cy = y0 + dy * t
      const bout = Math.sin((t / lon) * Math.PI)
      for (let a = -fen; a <= fen; a += 1) {
        for (let b = -fen; b <= fen; b += 1) {
          const px = Math.round(cx + a)
          const py = Math.round(cy + b)
          if (px < 0 || py < 0 || px >= L || py >= H) continue
          // LA DISTANCE PERPENDICULAIRE au trait, pas la distance au centre :
          // *c'est elle qui fait une rainure et non une tache.*
          const d = Math.abs(a * -dy + b * dx)
          champ[py * L + px] += amp * bout * Math.exp(-(d * d) / (larg * larg)) * 0.08
        }
      }
    }
  }

  // LE GRAIN FIN PARTOUT, et le GAUFRAGE des deux soudures — vertical, comme
  // les stries qu'on y peint déjà : *la soudure est pressée, donc elle a un
  // relief, et deux dessins de la même chose ne peuvent pas se contredire.*
  for (let y = 0; y < H; y += 1) {
    const part = y / H
    const soudure = part < 0.047 || part > 0.953
    for (let x = 0; x < L; x += 1) {
      champ[y * L + x] += (rnd() - 0.5) * 0.05
      if (soudure) champ[y * L + x] += Math.sin(x * 1.35) * 0.9
    }
  }

  const tampon = new Float32Array(L * H)
  for (let passe = 0; passe < 2; passe += 1) {
    for (let y = 1; y < H - 1; y += 1) {
      for (let x = 1; x < L - 1; x += 1) {
        let somme = 0
        for (let a = -1; a <= 1; a += 1) for (let b = -1; b <= 1; b += 1) somme += champ[(y + a) * L + x + b]!
        tampon[y * L + x] = somme / 9
      }
    }
    champ.set(tampon)
  }

  const canvas = document.createElement('canvas')
  canvas.width = L
  canvas.height = H
  const ctx = canvas.getContext('2d')
  if (ctx === null) return canvas
  const image = ctx.createImageData(L, H)
  const lire = (x: number, y: number): number =>
    champ[Math.min(H - 1, Math.max(0, y)) * L + Math.min(L - 1, Math.max(0, x))]!
  const relief = 2.2
  for (let y = 0; y < H; y += 1) {
    for (let x = 0; x < L; x += 1) {
      const gx = (lire(x + 1, y) - lire(x - 1, y)) * relief
      // EN Y, LA DÉRIVÉE EST INVERSÉE : la texture se lit de bas en haut.
      const gy = (lire(x, y - 1) - lire(x, y + 1)) * relief
      const norme = Math.hypot(gx, gy, 1)
      const o = (y * L + x) * 4
      image.data[o] = (-gx / norme / 2 + 0.5) * 255
      image.data[o + 1] = (-gy / norme / 2 + 0.5) * 255
      image.data[o + 2] = (1 / norme / 2 + 0.5) * 255
      image.data[o + 3] = 255
    }
  }
  ctx.putImageData(image, 0, 0)
  return canvas
}

let PLIS: THREE.CanvasTexture | null = null

/** La normal map des plis — peinte une fois, partagée par les deux morceaux. */
export function textureDesPlis(): THREE.CanvasTexture {
  PLIS ??= (() => {
    const t = new THREE.CanvasTexture(peindreLesPlis())
    // ***PAS DE sRGB*** : une normale est une DONNÉE, pas une couleur, et la
    // convertir la ferait pencher d'un côté sans qu'aucune erreur ne le dise.
    t.colorSpace = THREE.NoColorSpace
    t.anisotropy = 8
    return t
  })()
  return PLIS
}

/**
 * IL ATTEND LA POLICE, comme tout ce qui peint du texte dans ce projet.
 *
 * *Un canvas qui dessine avant `document.fonts.ready` retombe SILENCIEUSEMENT
 * sur la police par défaut*, et la texture part en cache telle quelle — la
 * règle déjà payée par les cartes, puis par les cases du chargement.
 */
export function textureDuSachet(): Promise<THREE.CanvasTexture> {
  return toilesDuSachet().then((t) => t.film)
}

/** La carte de brillance du sachet, peinte avec le film : voir peindreLaBrillanceDuSachet. */
export function brillanceDuSachet(): Promise<THREE.CanvasTexture> {
  return toilesDuSachet().then((t) => t.brillance)
}

function toilesDuSachet(): Promise<{ film: THREE.CanvasTexture; brillance: THREE.CanvasTexture }> {
  SACHET ??= Promise.all([document.fonts.ready, policeRonde()]).then(async () => {
    const toiles = await peindreLeSachet()
    const film = new THREE.CanvasTexture(toiles.film)
    film.anisotropy = 8
    film.colorSpace = THREE.SRGBColorSpace
    // UNE DONNÉE, PAS UNE COULEUR : la brillance ne passe pas par le sRGB,
    // comme la carte des plis.
    const brillance = new THREE.CanvasTexture(toiles.brillance)
    brillance.anisotropy = 8
    return { film, brillance }
  })
  return SACHET
}

const TEXTURES = new Map<string, Promise<THREE.CanvasTexture>>()

/** Ce qui distingue deux dessins de carte. L'exemplaire n'y entre pas. */
export function signature(carte: CarteAPeindre): string {
  // L'ILLUSTRATION ENTRE DANS LA CLÉ : deux personnages peuvent partager un
  // nom, et c'est leur portrait qui les sépare. *Deux cartes qui ne montrent
  // pas la même chose ne peuvent pas partager une texture.*
  // ET LE CADRAGE AUSSI : *deux cartes qui ne montrent pas la même chose ne
  // peuvent pas partager une texture*, et une image rognée n'est pas la même
  // image que la même rentrée entière.
  return `${carte.nom}|${carte.cout}|${carte.compteur ?? ''}|${carte.type}|${carte.rarete ?? ''}|${carte.matiere ?? ''}|${carte.valeur ?? ''}|${carte.ciel ?? ''}|${carte.illustration ?? ''}|${carte.illustrationEntiere === true ? 'E' : ''}|${carte.contour ?? ''}|${carte.texte ?? ''}|${carte.attaque ?? ''}/${carte.defense ?? ''}|${carte.effet.join('~')}`
}

/**
 * LA PETITE CARTE A SA PROPRE TEXTURE, ET C'EST POURQUOI ELLE EST NETTE.
 *
 * Keko : « pourquoi les cartes réduites sont floues ? » *Ce n'était pas la
 * peinture, c'était le MIPMAP.* Une carte du coffre fait une centaine de
 * pixels à l'écran pour une texture de 768 : le GPU la minifie de 2,3 niveaux
 * et **mélange deux étages de mipmap**, dont un plus petit qu'elle — le texte
 * s'y brouille par construction, quel que soit le soin mis à le peindre.
 *
 * On redessine donc la carte dans une toile à sa taille, une fois, et c'est
 * elle qu'on plaque : *il n'y a plus de minification à faire*, donc plus rien
 * à mélanger. Le rééchantillonnage du canvas en `high` vaut mieux que la
 * réduction en boîte que le GPU fabrique pour ses mipmaps.
 *
 * **Ça vaut son cache à part** : le même modèle peut être au coffre ET au
 * chargement, et les deux tailles cohabitent. Une petite pèse 0,4 Mo contre
 * 4,4 — c'est la moins chère des deux.
 */

/**
 * LES TROIS TAILLES DE TEXTURE, et **c'est la taille RÉELLE à l'écran qui
 * choisit**, pas un seuil en unités de scène.
 *
 * Il n'y en avait que deux, et le seuil se lisait sur la taille de la carte
 * dans la scène : une carte du chargement passait donc en 256 px de texture
 * alors qu'elle en occupe 280 sur un écran haute densité — *une texture plus
 * petite que ce qu'elle couvre est floue par construction*, quel que soit le
 * soin mis à la peindre. Keko : « la résolution des textes des cartes hors
 * zoom ».
 *
 * La netteté se joue en pixels PHYSIQUES : ce sont eux qu'on compte, densité
 * d'écran comprise.
 */
const TAILLES = [160, 224, 288, 384, 512, 768, 1024] as const

/** La toile qu'il faut pour couvrir cette largeur sans étirer ni minifier. */
export function tailleQuIlFaut(largeurPx: number): number {
  return TAILLES.find((t) => t >= largeurPx) ?? TAILLES[TAILLES.length - 1]!
}

export function textureDeCarte(
  carte: CarteAPeindre,
  largeurPx = 768,
): Promise<THREE.CanvasTexture> {
  const voulue = tailleQuIlFaut(largeurPx)
  const cle = `${signature(carte)}#${voulue}`
  const connue = TEXTURES.get(cle)
  if (connue !== undefined) return connue

  const promesse = peindreCarte(carte, voulue)
    .then((canvas) => {
      const texture = new THREE.CanvasTexture(canvas)
      // LE MASQUE DU SUJET VOYAGE AVEC ELLE : voir `masqueDuSujet`.
      const masque = MASQUES_DU_SUJET.get(canvas)
      if (masque !== undefined) texture.userData.masqueSujet = new THREE.CanvasTexture(masque)
      // La carte se regarde de près et en biais : sans filtrage anisotrope le
      // texte se brouille dès qu'elle s'incline.
      texture.anisotropy = 8
      texture.colorSpace = THREE.SRGBColorSpace
      return texture
    })
    .catch((raison: unknown) => {
      // UNE PROMESSE REJETÉE EN CACHE CONDAMNE LE MODÈLE POUR TOUTE LA SESSION.
      // Sans ce retrait, une peinture qui échoue une fois — une image qui ne
      // charge pas, une police qui tarde — laisse toutes les cartes de ce
      // modèle sans texture jusqu'au rechargement. *Un cache doit retenir les
      // succès, pas les échecs.*
      TEXTURES.delete(cle)
      console.error('[carte] peinture échouée', signature(carte), raison)
      throw raison
    })
  TEXTURES.set(cle, promesse)
  return promesse
}

/**
 * UN EMPLACEMENT VIDE A LA FORME DE LA CARTE QU'IL ATTEND, et il la GARDE.
 *
 * C'est la règle du jeu 2D, et elle a un prix qu'on paie volontiers : un
 * emplacement qui change de taille selon ce qu'il contient, ou selon la
 * présence de son voisin, est un emplacement qu'on rate au doigt. Il dit
 * aussi ce qu'il attend — sans son nom, c'est un pointillé muet.
 */
/**
 * L'ENCADRÉ DU GLOSSAIRE : ce que fait un mot-clé, dit une fois, au zoom.
 *
 * Keko : « on ne précise pas l'effet [sur la carte], et quand le joueur zoome
 * on affiche un encadré à côté : Étourdissement : annule l'action en cours ».
 *
 * *La carte NOMME, l'encadré EXPLIQUE* — et ils ne vivent pas au même moment :
 * le cartouche se lit d'un coup d'oeil dans la main, le glossaire se lit quand
 * on a pris le temps d'ouvrir la carte.
 *
 * **Il parle la langue des meubles, pas celle des cartes** : plaque de pierre,
 * filet de laiton, deux coins coupés. *Ce n'est pas un objet du jeu qu'on
 * manipule, c'est de l'interface* — lui donner le laiton déchiré d'une carte en
 * aurait fait une seconde carte posée à côté.
 */
const GLOSSAIRES = new Map<string, THREE.CanvasTexture>()

/** Le rapport hauteur/largeur de l'encadré, pour que le plan le suive. */
// LA PLAQUE A LA HAUTEUR DE CE QU'ELLE PORTE : un rapport fixe laissait la
// moitié basse vide sur un seul mot-clé, et *un encadré à moitié vide se lit
// comme un encadré qu'on a oublié de remplir.* Le pas a baissé avec l'écart
// du titre au texte — *rapprocher deux lignes sans resserrer leur boîte
// déplace le bloc vers le haut au lieu de le serrer.*
/**
 * **TOUT L'ENCADRÉ SE MESURE EN MULTIPLES DE SON CORPS.** Keko : « sur PC le
 * texte des encadrés est trop gros, il devrait être de la même taille que la
 * description de la carte — titre ET texte, avec le titre en majuscules ».
 *
 * Ses dimensions étaient écrites en unités de plaque, donc *l'encadré avait sa
 * propre échelle* : la plaque a un plancher en pixels d'écran pour rester
 * lisible sur téléphone, et sur un grand écran ce plancher ne mord plus — elle
 * suit la carte, et son texte avec. **Un contenu qui ne connaît pas la taille
 * de son voisin ne peut pas s'y accorder.**
 *
 * Les rapports sont ceux qu'avait le corps de 6,4 : la marge, le pas d'une
 * entrée, l'interligne et les deux lignes de base. *Un seul chiffre les porte
 * tous*, donc l'encadré garde exactement ses proportions à toute taille — et le
 * titre, lui, passe de 0,94 à 1,0 fois le corps, puisque Keko les veut égaux.
 */
const MARGE_GLOSSAIRE = (corps: number) => corps * 1.094
const PAS_GLOSSAIRE = (corps: number) => corps * 2.969

/**
 * LE CORPS DU SENS EST FIXE, ET C'EST LE TEXTE QUI VA À LA LIGNE. Keko : « la
 * taille du texte sous le titre est plus petite pour "esquive" que pour
 * "étourdissement" ; je voudrais que la taille soit fixe (on va à la ligne si
 * ça ne loge pas), garder la taille d'étourdissement comme référence ».
 *
 * *Et c'est le bon arbitrage ici, alors que c'est l'inverse sur une carte* :
 * le cartouche d'une carte CÈDE parce que sa bande est bornée — le pied est
 * juste dessous, il n'y a nulle part où descendre. **L'encadré, lui, n'a pas de
 * fond** : il grandit vers le haut et vers le bas, là où le champ est libre,
 * et c'est précisément ce que Keko avait demandé en le posant à côté de la
 * carte plutôt qu'en dessous.
 *
 * *Ce qu'une taille qui cède coûtait* : deux définitions voisines se lisaient à
 * deux voix, et **la plus longue — donc celle qu'on a le plus de mal à lire —
 * était la plus petite.** C'est l'exact inverse de ce qu'il faut.
 */
/** Le corps de REPLI, et celui qu'on garde quand la carte n'en impose pas. */
const CORPS_GLOSSAIRE = 6.4

/** L'interligne du sens, quand sa définition tient sur plusieurs lignes. */
const INTERLIGNE_GLOSSAIRE = (corps: number) => corps * 1.156

/**
 * LE REPLI SE MESURE DANS LE REPÈRE DE LA PLAQUE (100 de large), donc il ne
 * dépend pas de sa taille à l'écran : *une plaque deux fois plus grande porte
 * exactement les mêmes lignes*, et la hauteur se calcule avant de savoir
 * combien de pixels elle occupera. Sans ça le rapport dépendrait de la largeur,
 * qui elle-même se borne sur le rapport — et le calcul tournerait en rond.
 */
let regle: CanvasRenderingContext2D | null = null

function lignesDuSens(sens: string, corps: number): string[] {
  if (regle === null) regle = document.createElement('canvas').getContext('2d')
  const place = 100 - 2 * MARGE_GLOSSAIRE(corps)
  if (regle === null) return [sens]
  regle.font = `400 ${corps}px "Crimson Pro", Georgia, serif`
  const lignes: string[] = []
  let courante = ''
  for (const mot of sens.split(' ')) {
    const essai = courante === '' ? mot : `${courante} ${mot}`
    if (courante !== '' && regle.measureText(essai).width > place) {
      lignes.push(courante)
      courante = mot
    } else courante = essai
  }
  if (courante !== '') lignes.push(courante)
  return lignes
}

/** Ce qu'une entrée occupe en hauteur : son pas, plus ses lignes en trop. */
function hautEntree(sens: string, corps: number): number {
  return PAS_GLOSSAIRE(corps) + (lignesDuSens(sens, corps).length - 1) * INTERLIGNE_GLOSSAIRE(corps)
}

/**
 * L'ÉPAISSEUR DU FILET. Elle vaut ce qui RESTE une fois le tracé rogné à
 * l'intérieur, donc le `stroke` en demande le double.
 */
const FILET_GLOSSAIRE = 1.1

export function rapportGlossaire(
  entrees: readonly { mot: string; sens: string }[],
  corps = CORPS_GLOSSAIRE,
): number {
  // Une plaque vide n'existe pas, mais le rapport sert de DIVISEUR en amont :
  // on rend celui d'une entrée plutôt que zéro.
  if (entrees.length === 0) return (2 * MARGE_GLOSSAIRE(corps) + PAS_GLOSSAIRE(corps)) / 100
  let h = 2 * MARGE_GLOSSAIRE(corps)
  for (const entree of entrees) h += hautEntree(entree.sens, corps)
  return h / 100
}

export function textureGlossaire(
  entrees: readonly { mot: string; sens: string }[],
  largeurPx: number,
  corps = CORPS_GLOSSAIRE,
): THREE.CanvasTexture {
  // ON PEINT À LA TAILLE D'AFFICHAGE : réduire un bitmap n'est pas rendre du
  // texte, la leçon déjà payée sur les cartes et sur le disque du compte.
  const L = Math.min(1024, Math.max(256, Math.round(largeurPx)))
  const rapport = rapportGlossaire(entrees, corps)
  // LE NOMBRE DE LIGNES ENTRE DANS LA CLÉ : il se mesure, donc il peut changer
  // quand la police arrive — *une mesure faite avant `document.fonts.ready`
  // répond pour Georgia*, et la texture gardée serait alors d'une hauteur qui
  // n'est plus la bonne.
  const cle = `${entrees.map((e) => e.mot).join('~')}|${L}|${corps.toFixed(3)}|${rapport.toFixed(4)}`
  const deja = GLOSSAIRES.get(cle)
  if (deja !== undefined) return deja

  const H = Math.round(L * rapport)
  const canvas = document.createElement('canvas')
  canvas.width = L
  canvas.height = H
  const ctx = canvas.getContext('2d')!
  // Tout le dessin parle en unités de 100 de large, comme la carte.
  ctx.scale(L / 100, L / 100)
  const H100 = 100 * rapport
  const biseau = 4.5

  // LA PLAQUE : la pierre du lieu et deux coins coupés — de la ferronnerie,
  // pas un gabarit. Les mêmes coins que les cartouches de l'armurerie.
  ctx.beginPath()
  ctx.moveTo(biseau, 0)
  ctx.lineTo(100, 0)
  ctx.lineTo(100, H100 - biseau)
  ctx.lineTo(100 - biseau, H100)
  ctx.lineTo(0, H100)
  ctx.lineTo(0, biseau)
  ctx.closePath()
  // LA PIERRE EST OPAQUE. Keko : « le fond des encadrés explicatifs doit être
  // en opacité 100 %, pas semi-transparent ». *Un encadré se pose SUR ce qu'il
  // explique* — il recouvre une carte du set et le voile du zoom — et le peu de
  // transparence qu'il gardait laissait passer ce qu'il y avait dessous : ça se
  // lit comme un calque mal posé, pas comme une plaque.
  const pierre = ctx.createLinearGradient(0, 0, 0, H100)
  pierre.addColorStop(0, '#1b1f22')
  pierre.addColorStop(1, '#12161a')
  ctx.fillStyle = pierre
  ctx.fill()
  /**
   * LE FILET EST PLUS ÉPAIS, ET IL EST ROGNÉ À L'INTÉRIEUR. Demandé par Keko.
   *
   * *Un `stroke` de canvas est CENTRÉ sur son tracé*, donc la moitié sortait
   * du canvas et se perdait — l'épaissir n'aurait fait grossir que la part
   * invisible. On clippe donc sur la MÊME forme et on double la largeur : il
   * n'en reste que la moitié intérieure, exactement la règle déjà payée sur
   * les cases vides du chargement.
   */
  ctx.save()
  ctx.clip()
  ctx.strokeStyle = '#8d7a4e'
  ctx.lineWidth = FILET_GLOSSAIRE * 2
  ctx.stroke()
  ctx.restore()

  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'
  let haut = MARGE_GLOSSAIRE(corps)
  entrees.forEach((entree) => {
    // LE TITRE EST LE MOT DE LA CARTE, REPRIS TEL QUEL : même police, même
    // casse, même couleur, même graisse. *L'encadré définit un mot qu'on vient
    // de lire* — il n'a pas à le redessiner d'une autre main.
    //
    // **Il était en CINZEL, et c'est ce qui l'empêchait de passer en
    // minuscules.** Keko : « passe les titres en minuscule, juste maj première
    // lettre » — or *Cinzel n'a pas de bas-de-casse*, ses minuscules sont des
    // PETITES CAPITALES : mesuré, un « x » y monte à 60 quand un « X » monte à
    // 70. La casse ordinaire n'y aurait donné qu'un mot en petites capitales à
    // initiale haute, pas des minuscules.
    //
    // *Et le commentaire d'avant disait faux* : il justifiait Cinzel par « la
    // voix des noms, exactement comme sur une carte », alors que sur une carte
    // le mot-clé vit dans le CARTOUCHE — donc en Crimson, comme tout le texte
    // d'effet. L'encadré parlait d'une voix que la carte n'a jamais eue.
    // ET C'EST LA MÊME COULEUR QUE DANS LE TEXTE, lue au même endroit : *la
    // couleur dit qu'il y a une définition quelque part, et c'est celle du
    // titre qui la porte* — deux valeurs écrites chacune de leur côté se
    // seraient désaccordées au premier réglage, et ça a failli arriver.
    ctx.fillStyle = OR_MOT_CLE
    const place = 100 - 2 * MARGE_GLOSSAIRE(corps)
    // LE TITRE A LE CORPS DU TEXTE, et il reste en capitales et en Cinzel :
    // *la voix change, pas la taille.* Il CÈDE quand même s'il ne tient pas en
    // largeur — un canvas écrit tout droit et laisse déborder sans rien
    // signaler.
    let titre = corps
    // **LE TITRE N'A PAS DE DEUX-POINTS, et le sens prend une majuscule.**
    // Tranché par Keko. *Un mot-clé est un nom, pas l'amorce d'une phrase* :
    // les deux-points en faisaient une légende, alors que l'encadré est une
    // entrée de glossaire — un titre, puis sa définition.
    //
    // **ET IL EST EN CASSE ORDINAIRE**, demandé par Keko : il a été en
    // capitales le temps que l'encadré soit plus gros que la carte, et *des
    // capitales sont une enseigne — elles disent un rang, pas un nom.* Il est à
    // la taille du texte depuis, donc il n'a plus à crier pour s'en distinguer :
    // sa police suffit, Cinzel contre Crimson, la voix des noms contre celle des
    // effets. C'est exactement le raisonnement qui avait refusé Grenze Gotisch
    // en capitales espacées sur le bandeau du hub.
    const mot = entree.mot.charAt(0).toUpperCase() + entree.mot.slice(1)
    ctx.font = `700 ${titre}px "Crimson Pro", Georgia, serif`
    const largeMot = ctx.measureText(mot).width
    if (largeMot > place) {
      titre *= place / largeMot
      ctx.font = `700 ${titre}px "Crimson Pro", Georgia, serif`
    }
    ctx.fillText(mot, MARGE_GLOSSAIRE(corps), haut + corps * 1.016)
    ctx.fillStyle = '#cfc6b4'
    // LE SENS NE CÈDE PLUS : son corps est fixe et c'est la PHRASE qui se
    // replie. La majuscule se pose au rendu et non dans la donnée, qui reste
    // une phrase ordinaire.
    const sens = entree.sens.charAt(0).toUpperCase() + entree.sens.slice(1)
    ctx.font = `400 ${corps}px "Crimson Pro", Georgia, serif`
    const lignes = lignesDuSens(sens, corps)
    lignes.forEach((ligne, n) => {
      ctx.fillText(
        ligne,
        MARGE_GLOSSAIRE(corps),
        haut + corps * 2.422 + n * INTERLIGNE_GLOSSAIRE(corps),
      )
    })
    haut += PAS_GLOSSAIRE(corps) + (lignes.length - 1) * INTERLIGNE_GLOSSAIRE(corps)
  })

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 4
  GLOSSAIRES.set(cle, texture)
  return texture
}

const SLOTS = new Map<string, THREE.CanvasTexture>()

export function textureSlot(nom: string, accent: string): THREE.CanvasTexture {
  const cle = `${nom}|${accent}`
  const connue = SLOTS.get(cle)
  if (connue !== undefined) return connue

  const l = 512
  const h = Math.round(l * 1.4)
  const canvas = document.createElement('canvas')
  canvas.width = l
  canvas.height = h
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  SLOTS.set(cle, texture)

  const ctx = canvas.getContext('2d')
  if (ctx === null) return texture

  const peindre = (): void => {
    ctx.clearRect(0, 0, l, h)
    /**
     * LE POINTILLÉ ÉPOUSE LA CARTE, il ne se pose pas dedans.
     *
     * Keko : « les pointillés des slots sont un peu décalés par rapport aux
     * cartes, l'idéal serait de les avoir pile poil autour de la taille de la
     * carte ». Ils étaient rentrés de 3 % de la largeur, avec un arrondi de
     * 5 % là où la carte en a 3 : *une case qui montre une forme plus petite
     * que ce qu'elle reçoit ne montre pas la place, elle en montre une autre.*
     *
     * Le plan de la case fait EXACTEMENT la taille d'une carte, donc la marge
     * est celle d'un `stroke` : un trait de canvas est CENTRÉ sur son tracé,
     * donc il faut le rentrer d'une demi-épaisseur pour que son bord EXTÉRIEUR
     * tombe sur le bord du plan. Et le rayon se compte sur ce bord extérieur —
     * celui de la carte — donc le tracé porte ce rayon MOINS la demi-épaisseur.
     */
    const trait = l * 0.016
    const marge = trait / 2
    ctx.strokeStyle = accent
    ctx.lineWidth = trait
    ctx.setLineDash([l * 0.07, l * 0.05])
    ctx.beginPath()
    ctx.roundRect(marge, marge, l - marge * 2, h - marge * 2, RAYON_CARTE * l - marge)
    ctx.stroke()

    if (nom !== '') {
      ctx.setLineDash([])
      ctx.fillStyle = accent
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      /**
       * **LE NOM SE REPLIE, il ne rétrécit pas.** Keko : « dans les slots
       * d'armes il faudrait marquer main gauche / main droite (sur deux lignes
       * pour loger) plutôt que juste gauche / droite ».
       *
       * *Une case a de la hauteur et pas de largeur* — c'est un rectangle de
       * carte, une fois et demie plus haut que large — donc **c'est la ligne
       * qui cède, pas le corps.** La règle est celle de l'encadré du
       * glossaire, pour la même raison : *on replie là où il y a de la place,
       * on rétrécit là où il n'y en a pas.*
       *
       * Le corps ne cède qu'en dernier recours, si un seul MOT ne tient pas :
       * on ne peut pas couper un mot en deux, et *un canvas écrit tout droit et
       * laisse déborder sans rien signaler.*
       */
      const place = l * 0.82
      let corps = Math.round(l * 0.11)
      const police = (t: number): string => `600 ${t}px Cinzel, Georgia, serif`
      ctx.font = police(corps)
      /**
       * **LA COUPURE EST DÉCLARÉE, elle ne se déduit pas.** « Main droite »
       * tient sur une ligne et « Main gauche » n'y tient pas : repliées à la
       * mesure, les deux cases voisines se seraient lues l'une sur une ligne et
       * l'autre sur deux. *Deux cases qui disent la même sorte de chose se
       * lisent de la même façon* — c'est tout l'intérêt du mot sur une case
       * vide, qui n'existe que parce que les deux voisines disent deux choses
       * DIFFÉRENTES.
       *
       * Le saut de ligne vient donc de l'appelant, comme pour les plaques de bouton, et
       * le repli à la mesure reste derrière : *un nom qu'on n'a pas pensé à
       * couper ne doit pas déborder pour autant.*
       */
      const lignes: string[] = []
      for (const bloc of nom.toUpperCase().split('\n')) {
        let courante = ''
        for (const mot of bloc.split(' ')) {
          const essai = courante === '' ? mot : `${courante} ${mot}`
          if (courante !== '' && ctx.measureText(essai).width > place) {
            lignes.push(courante)
            courante = mot
          } else courante = essai
        }
        if (courante !== '') lignes.push(courante)
      }
      const large = Math.max(...lignes.map((ligne) => ctx.measureText(ligne).width))
      if (large > place) {
        corps = Math.round(corps * (place / large))
        ctx.font = police(corps)
      }
      // Le bloc se CENTRE sur la case : une ligne de plus le fait grandir des
      // deux côtés, elle ne le pousse pas vers le bas.
      const pas = corps * 1.22
      lignes.forEach((ligne, i) => {
        ctx.fillText(ligne, l / 2, h / 2 + (i - (lignes.length - 1) / 2) * pas)
      })
    }
    texture.needsUpdate = true
  }

  peindre()
  /**
   * ET ON REPEINT QUAND LA POLICE ARRIVE.
   *
   * Un canvas qui dessine avant `document.fonts.ready` retombe SILENCIEUSEMENT
   * sur la police par défaut — la règle est écrite pour les cartes, elle ne
   * l'était pas ici. Comme la texture est mise en cache, le premier slot
   * peint gardait Georgia et les suivants avaient Cinzel : **deux mots de même
   * corps qui n'ont pas la même taille à l'écran.** Keko : « les slots arme /
   * armure ne sont pas écrits à la même taille ».
   */
  if (nom !== '' && document.fonts.status !== 'loaded') {
    void document.fonts.ready.then(peindre)
  }
  return texture
}

/**
 * COMBIEN D'EXEMPLAIRES — **un chiffre dans un DISQUE, à cheval sur le coin.**
 *
 * Cinq formes ont précédé, et chacune a appris quelque chose : une bulle d'or
 * pleine sous la carte (« la bulle n'est pas élégante, elle casse avec le
 * style épuré et stylisé »), « ×3 » en texte nu dans le coin haut-droit (« il
 * faudrait mettre le nombre sous la carte, pas dedans »), le même sous la
 * carte puis grossi d'un tiers (« sur téléphone c'est trop petit »), une case
 * de laiton en bas à droite (« ça va masquer des éléments de la carte… je le
 * voyais vraiment sur le COIN de la carte, et pas dans un symbole de carte »),
 * et le chiffre seul cerné de noir — jusqu'à **« on peut mettre le chiffre
 * dans un conteneur type cercle ? »**
 *
 * *Ce que la case avait de faux n'était pas d'être un contenant, c'était de
 * dire quelque chose* : une carte pour dire des cartes, alors que le coin
 * haut-gauche le disait déjà pour un autre fait. **Un rond ne prétend à rien**,
 * donc il contient sans parler.
 *
 * Ce qui reste des deux formes précédentes : il est PETIT et **à cheval sur le
 * coin**, moitié dedans moitié dehors, donc il ne recouvre rien. C'est le
 * raisonnement du chiffre des jauges, qui déborde sa barre plutôt que d'être
 * contenu par elle.
 *
 * Le « × » ne revient pas : seul, dans un coin, un chiffre ne peut être qu'un
 * compte.
 */
const BADGES = new Map<string, THREE.CanvasTexture>()

/**
 * LE DISQUE, en part de la toile : le reste est le jeu de son ombre.
 *
 * Keko : « on peut mettre le chiffre dans un conteneur type cercle ? » *Un
 * rond est le seul contenant qui ne prétende pas être autre chose* — la case
 * en forme de carte disait « des cartes », et elle le disait déjà en haut à
 * gauche pour un autre fait. Il reste petit et à cheval sur le coin, donc il
 * ne masque toujours rien.
 */
export const PART_DISQUE = 0.78

/**
 * LA TOILE DU DISQUE COLLE À SA TAILLE À L'ÉCRAN, à huit pixels près.
 *
 * Les cartes se contentent d'une échelle de toiles parce qu'elles sont grandes
 * et qu'une marge y coûte peu ; **un badge de quarante pixels, lui, n'a pas de
 * marge à donner.** Un palier trop haut, et la texture se minifie ; minifiée,
 * elle passe par la moitié de sa taille — et c'est le flou qu'on cherchait.
 *
 * Le pas de huit borne le cache : il n'y a de toute façon qu'une poignée de
 * tailles dans une session, une par format d'écran.
 */
export function toileDuNombre(largeurPx: number): number {
  return Math.min(256, Math.max(32, Math.ceil(largeurPx / 8) * 8))
}

/**
 * ET ON PEINT À LA TAILLE D'AFFICHAGE, on ne réduit pas après coup.
 *
 * Keko : « on dirait que le contour n'est pas très net, on peut rendre les
 * chiffres avec un contour plus net ? » *Réduire un bitmap n'est pas rendre du
 * texte* — c'est la leçon déjà payée sur les cartes elles-mêmes : peint à 256
 * pour être affiché sur 31, le chiffre était rastérisé à 160 px puis écrasé à
 * 20 par les mipmaps, donc mou par construction.
 *
 * Tout le dessin continue de parler en unités de 256 ; c'est le CONTEXTE qui
 * est mis à l'échelle, donc le moteur de police trace chaque glyphe **à sa
 * taille finale**, avec son antialiasing et son hinting. Une ligne.
 */
export function textureNombre(nombre: number, largeurPx = 256): THREE.CanvasTexture {
  const toile = toileDuNombre(largeurPx)
  const cle = `${nombre}#${toile}`
  const connue = BADGES.get(cle)
  if (connue !== undefined) return connue

  const c = 256
  const canvas = document.createElement('canvas')
  canvas.width = toile
  canvas.height = toile
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  /**
   * **PAS DE MIPMAPS, ET C'ÉTAIT LÀ LE FLOU.**
   *
   * Keko, après la mise à la taille d'affichage : « c'est toujours un peu flou
   * le chiffre ». *Une toile à la bonne taille ne suffit pas* : dès qu'une
   * texture est ne serait-ce qu'un peu minifiée, three échantillonne ENTRE le
   * niveau plein et le niveau demi — donc la moitié de ce qu'on voit vient
   * d'une image deux fois plus petite, quelle que soit la finesse du dessin.
   *
   * Un badge est toujours à sa taille ou tout près : le niveau plein suffit,
   * et sans chaîne de mipmaps il n'y a plus rien de flou à mélanger. C'est ce
   * que les cartes, elles, ne peuvent pas se permettre — une carte s'éloigne,
   * s'incline, et un `LinearFilter` seul y scintillerait.
   */
  texture.generateMipmaps = false
  texture.minFilter = THREE.LinearFilter
  texture.magFilter = THREE.LinearFilter
  BADGES.set(cle, texture)

  const ctx = canvas.getContext('2d')
  if (ctx === null) return texture

  const peindre = (): void => {
    ctx.setTransform(toile / c, 0, 0, toile / c, 0, 0)
    ctx.clearRect(0, 0, c, c)
    const rayon = (c * PART_DISQUE) / 2
    const filet = rayon * 0.11

    // LE DISQUE : sombre au centre, cerclé de laiton. La même ferronnerie que
    // les cartouches et les cadres, en tout petit.
    ctx.save()
    ctx.shadowColor = '#000000b0'
    ctx.shadowBlur = rayon * 0.35
    ctx.shadowOffsetY = rayon * 0.08
    ctx.beginPath()
    ctx.arc(c / 2, c / 2, rayon - filet / 2, 0, Math.PI * 2)
    const fond = ctx.createLinearGradient(0, c / 2 - rayon, 0, c / 2 + rayon)
    fond.addColorStop(0, '#2a2317')
    fond.addColorStop(1, '#0e0c08')
    ctx.fillStyle = fond
    ctx.fill()
    ctx.restore()

    ctx.beginPath()
    ctx.arc(c / 2, c / 2, rayon - filet / 2, 0, Math.PI * 2)
    ctx.strokeStyle = '#c9a04e'
    ctx.lineWidth = filet
    ctx.stroke()

    // LE CHIFFRE REMPLIT SON DISQUE. Keko : « on peut grossir le chiffre dans
    // la bulle ? » *Une pastille qui garde de la marge tout autour se lit
    // comme un point, pas comme un compte* — à 40 % du diamètre le chiffre
    // flottait, il en prend maintenant 54.
    //
    // MAIS IL RENTRE, QUEL QU'IL SOIT : à deux chiffres il déborderait, et *un
    // contenant qui ne contient pas ment.* On mesure, et c'est la police qui
    // cède — la corde utile vaut un peu plus de trois quarts du diamètre
    // intérieur, ce qui garde « 13 » presque aussi gros qu'un chiffre seul.
    //
    // **ET IL N'EST PAS EN GRAS.** Keko le soupçonnait, et il avait raison sur
    // le fond : Grenze Gotisch est une gothique, ses pleins sont déjà épais, et
    // à vingt pixels le 700 referme les contrepoinçons — le creux d'un 6, la
    // fente d'un 3. *Ce qui se bouche se lit comme ce qui est flou.* Le 600 est
    // d'ailleurs la graisse des chiffres des cases de la carte.
    const dedans = (rayon - filet) * 1.7
    let police = rayon * 1.62
    ctx.font = `600 ${police}px "Grenze Gotisch", Georgia, serif`
    const large = ctx.measureText(String(nombre)).width
    if (large > dedans) {
      police *= dedans / large
      ctx.font = `600 ${police}px "Grenze Gotisch", Georgia, serif`
    }
    ctx.textAlign = 'center'
    // LA LIGNE DE BASE, pas une boîte de ligne : `middle` se mesure sur la
    // boîte de POLICE, jambages compris, et un chiffre n'en a pas.
    ctx.textBaseline = 'alphabetic'
    const or = ctx.createLinearGradient(0, c / 2 - rayon, 0, c / 2 + rayon)
    or.addColorStop(0, '#f8e7b8')
    or.addColorStop(1, '#d8b471')
    ctx.fillStyle = or
    ctx.fillText(String(nombre), c / 2, c / 2 + police * MILIEU_CHIFFRE)
    texture.needsUpdate = true
  }

  peindre()
  // Un canvas qui peint avant `document.fonts.ready` retombe SILENCIEUSEMENT
  // sur la police par défaut, et sa texture part en cache telle quelle.
  if (document.fonts.status !== 'loaded') void document.fonts.ready.then(peindre)
  return texture
}

/**
 * LA TEXTURE DU CONTOUR LUMINEUX.
 *
 * Elle reproduit le `box-shadow` du jeu 2D, qui est ce que Keko veut voir :
 * `0 0 0 2px blanc` puis `0 0 1.5rem blanc translucide` — **un liseré net ET
 * un flou continu qui émet**.
 *
 * En 3D, un plan de couleur unie ne peut pas faire ça : il donne un rectangle
 * dur. Trois rectangles emboîtés non plus — on lisait les paliers (Keko :
 * « j'aime pas trop le dégradé en 3 couches »). *Le flou doit être dans la
 * matière, pas dans le nombre de plans*, donc dans une texture.
 *
 * Elle est peinte au canvas avec `shadowBlur`, qui est exactement le même
 * moteur de flou que le `box-shadow` du CSS : le rendu est le même, à ceci
 * près qu'il devient une image qu'on peut plaquer.
 *
 * Une seule pour toutes les cartes : elle ne dépend d'aucune d'elles.
 */
let contour: THREE.CanvasTexture | null = null

/**
 * Le débord du flou, en fraction de la largeur de la carte.
 *
 * **La texture et le plan le partagent**, et c'est indispensable : ils doivent
 * décrire la même chose pour que le liseré tombe exactement sur le bord.
 *
 * **SERRÉ, ET C'EST UNE CORRECTION.** À 26 %, la lumière débordait bien trop
 * loin — Keko : « ça éclaire beaucoup trop autour de la carte […] il faudrait
 * un glow assez proche de la carte ». Un halo qui s'étale n'éclaire pas la
 * carte, il éclaire l'écran.
 */
export const DEBORD_CONTOUR = 0.13

export function textureContour(): THREE.CanvasTexture {
  if (contour !== null) return contour

  // LA CARTE OCCUPE LE CENTRE, ET LE DÉBORD DOIT ÊTRE EXACTEMENT CELUI DU
  // PLAN qui portera la texture — sinon la partie utile passe derrière la
  // carte et on ne voit plus rien. C'est arrivé : à débord plus large dans la
  // texture que dans la géométrie, le liseré et le cœur du flou étaient
  // masqués, il ne restait que la frange la plus pâle.
  const l = 512
  const debord = Math.round(l * DEBORD_CONTOUR)
  const h = Math.round(l * 1.4)
  const canvas = document.createElement('canvas')
  canvas.width = l + debord * 2
  canvas.height = h + debord * 2
  const ctx = canvas.getContext('2d')
  if (ctx === null) {
    contour = new THREE.CanvasTexture(canvas)
    return contour
  }

  ctx.fillStyle = '#ffffff'
  // LE FLOU D'ABORD, en plusieurs passes SERRÉES : une seule donne un halo
  // trop sage, et c'est l'accumulation qui fait la lumière -- exactement comme
  // deux `box-shadow` empilés dans le CSS. Les rayons restent COURTS : étalé
  // sur tout le débord, le halo devient une brume qui n'éclaire rien ; c'est
  // près du bord qu'une lumière se lit.
  ctx.shadowColor = 'rgba(255, 255, 255, 0.95)'
  // Le contour suit les coins ronds de la carte : un halo carré autour d'une
  // carte arrondie se lirait comme un cadre posé dessus.
  const coin = l * 0.03
  const rect = (x: number, y: number, lg: number, ht: number): void => {
    ctx.beginPath()
    ctx.roundRect(x, y, lg, ht, coin)
    ctx.fill()
  }
  // LA LUMIÈRE DOIT ÊTRE ÉTEINTE AVANT LE BORD DU PLAN, sinon on voit le
  // rectangle qui la délimite — Keko : « on voit le rectangle qui délimite la
  // lumière ». C'est ce qui règle les rayons : assez courts pour que l'alpha
  // soit retombé à zéro bien avant le débord, pas seulement faible.
  //
  // Les rayons sont donnés en `shadowBlur`, dont la portée utile vaut à peu
  // près la MOITIÉ. Se vérifie sur le profil d'alpha de la texture, en lisant
  // une ligne de pixels du bord vers le centre : il doit commencer par des
  // zéros francs.
  for (const rayon of [debord * 0.85, debord * 0.45, debord * 0.2]) {
    ctx.shadowBlur = rayon
    rect(debord, debord, l, h)
  }

  // PUIS LE LISERÉ NET, sans ombre : c'est lui qui donne l'arête franche que
  // le flou seul n'a pas. Il déborde d'environ 2 % de la carte, comme les 2 px
  // du jeu 2D -- mesuré dans les pixels de CETTE texture, pas de l'écran.
  ctx.shadowColor = 'transparent'
  ctx.shadowBlur = 0
  const arete = Math.round(l * 0.022)
  rect(debord - arete, debord - arete, l + arete * 2, h + arete * 2)

  contour = new THREE.CanvasTexture(canvas)
  contour.colorSpace = THREE.SRGBColorSpace
  return contour
}

/**
 * LA LUEUR DE L'AURÉOLE : **la même silhouette, mais SANS ARÊTE.**
 *
 * Keko, sur la première auréole qui reprenait le contour ordinaire : « c'est
 * pas terrible, je voyais un truc plus lumière, ça la fait outline ». *Ce qui
 * faisait l'outline était le liseré net* — la dernière passe du contour, celle
 * qui lui donne son arête franche. Elle est indispensable pour dire « cette
 * carte est engagée », qui est un ÉTAT et veut un bord ; elle est exactement ce
 * qu'il ne faut pas pour dire « cette carte rayonne ».
 *
 * **Une lumière n'a pas de bord, elle a une décroissance.** Cette texture n'a
 * donc que le flou, en passes longues, sur un débord bien plus large — et
 * l'alpha y retombe à zéro avant le bord du plan, sinon on verrait le rectangle
 * qui la délimite.
 */
let aureole: THREE.CanvasTexture | null = null

/** Le débord de l'auréole : deux fois et demie celui du contour. */
export const DEBORD_AUREOLE = 0.34

export function textureAureole(): THREE.CanvasTexture {
  if (aureole !== null) return aureole

  const l = 512
  const debord = Math.round(l * DEBORD_AUREOLE)
  const h = Math.round(l * 1.4)
  const canvas = document.createElement('canvas')
  canvas.width = l + debord * 2
  canvas.height = h + debord * 2
  const ctx = canvas.getContext('2d')
  if (ctx === null) {
    aureole = new THREE.CanvasTexture(canvas)
    return aureole
  }

  ctx.fillStyle = '#ffffff'
  ctx.shadowColor = 'rgba(255, 255, 255, 0.72)'
  const coin = l * 0.03
  const rect = (x: number, y: number, lg: number, ht: number): void => {
    ctx.beginPath()
    ctx.roundRect(x, y, lg, ht, coin)
    ctx.fill()
  }
  // TROIS PORTÉES, de la plus longue à la plus courte : c'est l'empilement qui
  // fait une décroissance douce là où une seule passe donne un bord de brume.
  // La portée utile d'un flou vaut à peu près la MOITIÉ de son rayon, donc le
  // plus long reste sous le double du débord — *une lueur qui se termine par
  // une arête n'est pas une lueur.*
  for (const rayon of [debord * 1.05, debord * 0.6, debord * 0.3]) {
    ctx.shadowBlur = rayon
    rect(debord, debord, l, h)
  }
  // ET PAS DE LISERÉ. C'est toute la différence avec le contour.

  aureole = new THREE.CanvasTexture(canvas)
  aureole.colorSpace = THREE.SRGBColorSpace
  return aureole
}

/**
 * UN SLOT QUI ACCUEILLE : SON PROPRE POINTILLÉ, EN VIF.
 *
 * Il a d'abord été le contour lumineux des cartes, teinté en bleu et posé
 * derrière la case. Keko : « je trouve l'effet un peu grossier — ça dépasse
 * des pointillés et le contour est très épais ; on peut pas plutôt dessiner le
 * rectangle pointillé en plus vif et lumineux, et l'intérieur en doré ? »
 *
 * *Un halo qui déborde désigne une ZONE, pas un emplacement.* La case, elle,
 * a déjà sa forme — le pointillé — et il suffit de l'allumer : même tracé,
 * même place, en or et avec sa propre lueur. Rien ne dépasse, puisque rien
 * n'est ajouté.
 *
 * Il se pose DEVANT la carte et non derrière : un slot occupé s'échange, donc
 * il doit s'allumer aussi, et sa carte masquerait tout ce qu'on mettrait
 * dessous. L'intérieur reste à peine teinté pour cette raison — c'est le
 * cadre qui parle, le fond ne fait que dire « ici ».
 */
let slotVif: THREE.CanvasTexture | null = null

export function textureSlotVif(): THREE.CanvasTexture {
  if (slotVif !== null) return slotVif

  const l = 512
  const h = Math.round(l * 1.4)
  /**
   * SA TOILE DÉBORDE, parce que sa LUEUR déborde.
   *
   * Le tracé doit tomber au même endroit que celui de la case vide — sur le
   * bord de la carte — mais ses trois passes de lueur s'étalent au-delà : à
   * toile égale, elles seraient coupées net par le bord, et *une lueur qui se
   * termine par une arête n'est pas une lueur.* On peint donc sur une toile
   * plus grande et le plan grandit d'autant, exactement comme le contour des
   * cartes. Le débord est le MÊME en pixels sur les deux axes, sinon la forme
   * se déformerait.
   */
  const bord = Math.round(l * DEBORD_SLOT)
  const canvas = document.createElement('canvas')
  canvas.width = l + bord * 2
  canvas.height = h + bord * 2
  const ctx = canvas.getContext('2d')
  if (ctx === null) {
    slotVif = new THREE.CanvasTexture(canvas)
    return slotVif
  }

  // LE MÊME TRACÉ QUE LA CASE VIDE — même marge, même rayon, même cadence de
  // tirets : c'est ce qui fait que le pointillé s'ALLUME au lieu de s'ajouter.
  const trait = l * 0.018
  const marge = bord + trait / 2
  const trace = (): void => {
    ctx.beginPath()
    ctx.roundRect(marge, marge, l - trait, h - trait, RAYON_CARTE * l - trait / 2)
  }

  // L'intérieur, à peine : une carte posée dessus doit rester lisible.
  ctx.fillStyle = 'rgba(255, 255, 255, 0.075)'
  trace()
  ctx.fill()

  // Le pointillé, en trois passes de lueur de plus en plus serrée : c'est
  // l'accumulation qui fait la lumière, comme le contour des cartes.
  ctx.setLineDash([l * 0.07, l * 0.05])
  ctx.lineWidth = trait
  ctx.strokeStyle = '#ffffff'
  ctx.shadowColor = 'rgba(255, 255, 255, 0.9)'
  for (const rayon of [l * 0.045, l * 0.022, 0]) {
    ctx.shadowBlur = rayon
    trace()
    ctx.stroke()
  }

  slotVif = new THREE.CanvasTexture(canvas)
  slotVif.colorSpace = THREE.SRGBColorSpace
  return slotVif
}

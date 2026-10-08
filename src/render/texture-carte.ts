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
}

/** La couleur du CORPS en 3D — la tranche et le cheveu de cadre qui déborde. */
export const METAL_3D: Record<string, string> = {
  commune: '#9c6237',
  rare: '#c3ccd4',
  epique: '#f2b81a',
  // LA TRANCHE SUIT LE CADRE : bleutée comme lui, sinon l'épaisseur trahirait
  // l'argent dès que la carte s'incline.
  legendaire: '#a6d3ff',
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

/** Le laiton du cadre, en dégradé oblique comme dans le CSS. */
function laiton(ctx: CanvasRenderingContext2D, rarete?: string): CanvasGradient {
  const g = ctx.createLinearGradient(0, 0, LARGE, HAUT)
  if (rarete === 'legendaire') {
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
async function illustration(
  nom: string,
  rarete?: string,
  matiere?: string,
  directe?: string,
): Promise<HTMLImageElement | null> {
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

function grain(): HTMLCanvasElement {
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
  largeur: number,
  impose?: readonly [number, number, number],
): void {
  const base = impose ?? teinteDuCiel(ciel)
  const ton = (k: number): string =>
    `rgb(${Math.round(Math.min(255, base[0] * k))}, ${Math.round(Math.min(255, base[1] * k))}, ${Math.round(Math.min(255, base[2] * k))})`

  const vertical = ctx.createLinearGradient(0, 0, 0, HAUT)
  vertical.addColorStop(0, ton(1.32))
  vertical.addColorStop(0.45, ton(1))
  vertical.addColorStop(1, ton(0.6))
  ctx.fillStyle = vertical
  ctx.fillRect(0, 0, LARGE, HAUT)

  /**
   * LE VIGNETTAGE EST UNE ELLIPSE, pas un disque : la carte est une fois et
   * demie plus haute que large, donc un dégradé circulaire mordrait sur les
   * côtés bien avant d'atteindre le haut. On dessine un disque dans un repère
   * étiré — *une forme suit les proportions de ce qu'elle borde.*
   */
  ctx.save()
  ctx.translate(LARGE / 2, HAUT / 2)
  ctx.scale(1, HAUT / LARGE)
  const vignette = ctx.createRadialGradient(0, 0, LARGE * 0.3, 0, 0, LARGE * 0.75)
  vignette.addColorStop(0, '#00000000')
  vignette.addColorStop(1, '#00000066')
  ctx.fillStyle = vignette
  ctx.fillRect(-LARGE, -LARGE, LARGE * 2, LARGE * 2)
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
  ctx.save()
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  const motif = ctx.createPattern(grain(), 'repeat')
  if (motif !== null) {
    ctx.globalCompositeOperation = 'overlay'
    ctx.globalAlpha = ALPHA_GRAIN
    ctx.fillStyle = motif
    ctx.fillRect(0, 0, largeur, Math.round(largeur * 1.4))
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
 * **ET CE QUI NE REMPLIT PAS LA HAUTEUR SE CALE EN HAUT, pas au centre.** Le
 * bas de la carte passe sous le voile du texte (plein à 78 %) et sous le nom
 * (peint à 66,5 %), donc *une bande centrée mettrait la moitié du sujet sous
 * le texte.* C'est la règle du portrait des PNJ au rail, reprise ici.
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
  // Calé en haut s'il reste du jeu vertical, centré sinon : `ih < h` ne peut
  // arriver QUE sous plafond, donc le cas sans plafond garde son centrage.
  ctx.drawImage(image, x + (l - il) / 2, ih < h ? y : y + (h - ih) / 2, il, ih)
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

function corpsDuCartouche(
  ctx: CanvasRenderingContext2D,
  effet: readonly string[],
  max: number,
): { taille: number; lignes: Mot[][] } {
  const place = HAUT * (BAS_CARTOUCHE - HAUT_CARTOUCHE)
  const pose = (t: number): Mot[][] => {
    ctx.font = `400 ${t}px "Crimson Pro", Georgia, serif`
    return replier(ctx, effet, max, t)
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
): Mot[][] {
  const sorties: Mot[][] = []
  for (const entree of entrees) {
    let courante: Mot[] = []
    for (const mot of enMots(entree)) {
      const essai = [...courante, mot]
      // UN SYMBOLE EST UN MOT COMME UN AUTRE, mais sa largeur n'est pas celle
      // de son écriture : on mesure le DESSIN, sinon la ligne déborderait de
      // la différence — et *le canvas ne prévient jamais qu'il déborde.*
      if (courante.length > 0 && largeurLigne(ctx, essai, taille) > max) {
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

/** La police d'un mot : le gras est celui du cartouche, pas un second corps. */
function policeMot(taille: number, gras: boolean): string {
  return `${gras ? 700 : 400} ${taille}px "Crimson Pro", Georgia, serif`
}

function largeurMot(ctx: CanvasRenderingContext2D, mot: Mot, taille: number): number {
  if ('jeton' in mot) return largeurJeton(ctx, mot.jeton, taille)
  ctx.font = policeMot(taille, mot.gras)
  return ctx.measureText(mot.texte).width
}

/** La largeur d'une ligne, symboles et graisses compris. */
function largeurLigne(ctx: CanvasRenderingContext2D, mots: readonly Mot[], taille: number): number {
  ctx.font = policeMot(taille, false)
  const espace = ctx.measureText(' ').width
  return mots.reduce(
    (large, mot, i) => large + largeurMot(ctx, mot, taille) + (i > 0 ? espace : 0),
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
): void {
  const couleur = ctx.fillStyle
  ctx.font = policeMot(taille, false)
  const espace = ctx.measureText(' ').width
  let x = cx - largeurLigne(ctx, mots, taille) / 2

  ctx.save()
  ctx.textAlign = 'left'
  mots.forEach((mot, i) => {
    if (i > 0) x += espace
    if ('jeton' in mot) {
      peindreJeton(ctx, mot.jeton, x, y, taille, symbole)
      x += largeurJeton(ctx, mot.jeton, taille)
      return
    }
    ctx.font = policeMot(taille, mot.gras)
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
): Promise<HTMLCanvasElement> {
  const canvas = document.createElement('canvas')
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
    illustration(carte.nom, carte.rarete, carte.matiere, carte.illustration),
    // LE CIEL DIT LA FAMILLE : ce n'est pas un voile posé sur le décor, c'est
    // un AUTRE décor — le même fichier, viré une fois pour toutes à la couleur
    // de la famille. Une armure garde le bleu d'origine. Voir `fondTeinte`.
    FOND_PEINT ? null : carte.ciel === undefined ? fond() : fondTeinte(carte.ciel),
    coutPeint(),
    document.fonts.ready,
  ])

  // LES COINS SONT RONDS, et c'est la texture qui les porte : tout ce qui
  // suit est peint dans un rectangle arrondi, et le canvas reste transparent
  // en dehors. Rayon : 3 % de la largeur, comme le `border-radius` du gabarit
  // 2D. Le matériau coupe ces coins (`alphaTest`) et laisse voir le laiton
  // arrondi du corps de la carte.
  ctx.beginPath()
  ctx.roundRect(0, 0, LARGE, HAUT, LARGE * RAYON_CARTE)
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
  const deDeck = carte.tresor !== true && carte.compteur === undefined
  const piste = deDeck ? PISTE_CADRE : null
  const coque =
    carte.tresor === true ? CADRE_TRESOR : (piste !== null && SILHOUETTES[piste]) || DECOUPE
  ctx.save()
  chemin(ctx, coque, 0, 0, LARGE, HAUT)
  ctx.clip()
  ctx.fillStyle = laiton(ctx, carte.rarete)
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
  const marge = (piste === 'encoche' ? 1.85 : 1.163) * U
  ctx.save()
  chemin(ctx, coque, marge, marge, LARGE - marge * 2, HAUT - marge * 2)
  ctx.clip()
  if (FOND_PEINT) peindreDecor(ctx, carte.ciel, largeur)
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
  if (image !== null) {
    const lArt = LARGE - marge * 2
    const hArt = HAUT - marge * 2
    const petit = document.createElement('canvas')
    petit.width = 44
    petit.height = Math.max(1, Math.round((44 * hArt) / lArt))
    const pctx = petit.getContext('2d')
    if (pctx !== null) {
      pctx.imageSmoothingQuality = 'high'
      couvrir(pctx, image, 0, 0, petit.width, petit.height, PLAFOND_ROGNAGE)
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
      if (carte.ciel !== undefined) {
        const flou = pctx.getImageData(0, 0, petit.width, petit.height)
        virerLeCiel(flou.data, carte.ciel)
        pctx.putImageData(flou, 0, 0)
      }
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
      ctx.drawImage(petit, marge, marge, lArt, hArt)
      ctx.restore()
    }
  }


  if (image !== null) {
    couvrir(ctx, image, marge, marge, LARGE - marge * 2, HAUT - marge * 2, PLAFOND_ROGNAGE)
  }

  /**
   * LE VOILE SOUS LE TEXTE : le bas de la carte passe sous le nom et le
   * cartouche, donc l'image doit s'y éteindre pour qu'ils se lisent.
   *
   * **IL MONTE EN COURBE, PLUS EN DEUX SEGMENTS.** Keko : « je trouve le
   * dégradé noir trop abrupt, on peut le rendre plus progressif ? » Il avait
   * trois arrêts, donc une CASSURE DE PENTE à 66 % de la hauteur : il montait
   * d'un coup jusqu'aux deux tiers d'opacité puis restait presque plat. *Ce
   * n'est pas la vitesse qu'on voit, c'est la cassure* — une rampe sans
   * dérivée nulle aux deux bouts se lit comme une arête.
   *
   * **Le départ remonte, et ce n'est pas un retour en arrière** : Keko avait
   * fait baisser le voile parce qu'il devenait NOIR trop haut, pas parce qu'il
   * commençait trop haut. Une courbe douce passe sous le seuil du visible
   * pendant sa première moitié — à 50 % de la carte elle ne pèse que 10 %
   * d'opacité, contre un départ franc à 57 % auparavant. *Elle commence plus
   * haut et se voit plus bas.*
   *
   * Ce qui ne pouvait pas bouger, c'est l'opacité AU NOM, peint à 66,5 % : la
   * courbe y vaut 0,67, soit exactement ce que l'ancien palier donnait.
   */
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

function peindreTextes(
  ctx: CanvasRenderingContext2D,
  carte: CarteAPeindre,
  symbole: HTMLImageElement | null,
): void {
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
   * **ET IL SE RÉTRÉCIT S'IL NE TIENT PAS.** Un nom est écrit d'un trait,
   * sans repli — plus gros, « Reliquaire d'ossements » serait sorti des deux
   * côtés de la carte *sans rien signaler*, exactement ce qui était arrivé au
   * cartouche de l'Espadon. Le canvas ne prévient jamais qu'il déborde.
   */
  let tailleNom = 10.5 * U
  const tientDans = LARGE * 0.84
  ctx.font = `700 ${tailleNom}px "Grenze Gotisch", Georgia, serif`
  while (ctx.measureText(carte.nom).width > tientDans && tailleNom > 6 * U) {
    tailleNom *= 0.94
    ctx.font = `700 ${tailleNom}px "Grenze Gotisch", Georgia, serif`
  }
  ctx.fillStyle = '#f7ead0'
  ctx.shadowColor = '#14181a'
  ctx.shadowOffsetY = 0.5 * U
  ctx.shadowBlur = 3 * U
  const yNom = HAUT * 0.665
  ctx.fillText(carte.nom, LARGE / 2, yNom)
  ctx.shadowColor = 'transparent'
  ctx.shadowOffsetY = 0
  ctx.shadowBlur = 0

  const trait = ctx.createLinearGradient(LARGE * 0.22, 0, LARGE * 0.78, 0)
  trait.addColorStop(0, '#f7ead000')
  trait.addColorStop(0.2, '#f7ead099')
  trait.addColorStop(0.8, '#f7ead099')
  trait.addColorStop(1, '#f7ead000')
  ctx.fillStyle = trait
  // Le trait suit le nom : il se pose sous ses jambages, quelle que soit la
  // taille à laquelle il a fallu l'écrire.
  ctx.fillRect(LARGE * 0.22, yNom + tailleNom * 0.68, LARGE * 0.56, Math.max(1, 0.25 * U))

  // LE CARTOUCHE : ce que fait la carte, centré, une ligne par entrée.
  //
  // **IL SE REPLIE.** En 2D c'est le navigateur qui coupe les lignes ; un
  // canvas, lui, écrit tout droit et laisse déborder *sans rien signaler* —
  // la composition de l'Espadon sortait des deux côtés de la carte. Le repli
  // se fait à la taille choisie, et s'il coûte une ligne de trop on descend
  // d'un cran : c'est exactement ce que `cran` fait pour un effet long.
  const { taille, lignes } = corpsDuCartouche(ctx, carte.effet, LARGE * 0.86)
  ctx.fillStyle = '#f1e6cf'
  ctx.shadowColor = '#000000aa'
  ctx.shadowOffsetY = 0.4 * U
  ctx.shadowBlur = 0.8 * U
  lignes.forEach((ligne, i) => {
    ecrireLigne(
      ctx,
      ligne,
      LARGE / 2,
      HAUT * HAUT_CARTOUCHE + i * taille * INTERLIGNE_EFFET,
      taille,
      symbole,
    )
  })
  ctx.shadowColor = 'transparent'

  peindrePied(ctx, carte)
}

/** LE PIED : sa nature gravée, en petites capitales espacées. */
function peindrePied(ctx: CanvasRenderingContext2D, carte: CarteAPeindre): void {
  const y = HAUT * 0.955
  ctx.font = `600 ${4.6 * U}px "Barlow Condensed", "Arial Narrow", sans-serif`
  ctx.fillStyle = '#c9b892'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.letterSpacing = `${1.2 * U}px`
  ctx.fillText(carte.type.toUpperCase(), LARGE / 2, y)
  ctx.letterSpacing = '0px'

  // LES DEUX MESURES ENCADRENT LE TYPE, et leur couleur dit laquelle est
  // laquelle. Elles sont EN DEHORS du centrage du type : il garde sa place au
  // milieu de la carte, quels que soient les deux chiffres.
  if (carte.attaque === undefined && carte.defense === undefined) return
  ctx.font = `600 ${7.4 * U}px "Grenze Gotisch", Georgia, serif`
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
async function peindreDos(): Promise<HTMLCanvasElement> {
  const canvas = document.createElement('canvas')
  canvas.width = LARGE
  canvas.height = HAUT
  const ctx = canvas.getContext('2d')
  if (ctx === null) return canvas

  const dessin = await dessinDuDos()

  ctx.beginPath()
  ctx.roundRect(0, 0, LARGE, HAUT, LARGE * RAYON_CARTE)
  ctx.clip()

  peindreDecor(ctx, undefined, LARGE, BASE_DOS)

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

let DOS: Promise<THREE.CanvasTexture> | null = null

export function textureDuDos(): Promise<THREE.CanvasTexture> {
  DOS ??= peindreDos().then((canvas) => {
    const texture = new THREE.CanvasTexture(canvas)
    texture.anisotropy = 8
    texture.colorSpace = THREE.SRGBColorSpace
    return texture
  })
  return DOS
}

const TEXTURES = new Map<string, Promise<THREE.CanvasTexture>>()

/** Ce qui distingue deux dessins de carte. L'exemplaire n'y entre pas. */
export function signature(carte: CarteAPeindre): string {
  // L'ILLUSTRATION ENTRE DANS LA CLÉ : deux personnages peuvent partager un
  // nom, et c'est leur portrait qui les sépare. *Deux cartes qui ne montrent
  // pas la même chose ne peuvent pas partager une texture.*
  return `${carte.nom}|${carte.cout}|${carte.compteur ?? ''}|${carte.type}|${carte.rarete ?? ''}|${carte.matiere ?? ''}|${carte.valeur ?? ''}|${carte.ciel ?? ''}|${carte.illustration ?? ''}|${carte.attaque ?? ''}/${carte.defense ?? ''}|${carte.effet.join('~')}`
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

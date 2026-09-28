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
import {
  DEBORD_CONTOUR,
  PART_DISQUE,
  textureNombre,
  signature,
  textureContour,
  textureDeCarte,
  textureDuDos,
  tailleQuIlFaut,
} from './texture-carte.ts'

/** La carte fait 1 de large ; le reste en découle, comme dans le gabarit. */
/** Ce que dure l'éclat d'une carte qui vient d'arriver, en secondes. */
export const DUREE_APPARITION = 0.4

export const LARGE = 1
export const HAUT = 1.4
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

/** Le rayon des coins : 3 % de la largeur, comme le `border-radius` du gabarit. */
export const RAYON_COIN = 0.03

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
const INCLINAISON_REFLET = 0.34
/**
 * Et de combien elle s'avance vers le regard, EN PART DE SA LARGEUR.
 *
 * En unités de scène, la même avancée était un cheveu sur une carte zoomée et
 * un bond sur une case de coffre — *une distance absolue n'est pas une
 * distance : elle vaut ce que vaut l'objet autour d'elle.*
 */
const AVANCEE_REFLET = 0.05

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
function formeDeCarte(): THREE.Shape {
  const l = LARGE / 2
  const h = HAUT / 2
  const r = RAYON_COIN
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

const GEOMETRIE_CORPS = new THREE.ExtrudeGeometry(formeDeCarte(), {
  depth: EPAISSEUR,
  bevelEnabled: false,
  curveSegments: 8,
})
// L'extrusion part de z = 0 vers l'avant : on la recentre sur l'épaisseur,
// pour que la face posée à +EPAISSEUR/2 affleure bien le corps.
GEOMETRIE_CORPS.translate(0, 0, -EPAISSEUR / 2)
const GEOMETRIE_FACE = new THREE.PlaneGeometry(LARGE, HAUT)
/** Le contour de l'onde : la forme de la carte, creusée. Partagée par toutes. */
const GEOMETRIE_ONDE = geometrieDOnde(LARGE, HAUT, RAYON_COIN)

type Props = {
  carte: CarteAPeindre
  position: [number, number, number]
  /** Inclinaison voulue, en radians. */
  rotation?: [number, number, number]
  taille?: number
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
  curseurPartage?: { dessus: boolean; x: number; y: number }
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
  ressort = 9,
  ressortZ,
  engagee = false,
  jouable = true,
  ombre = true,
  peril = false,
  dos = false,
  saut = null,
  clipper = null,
  apparue = null,
  reflet = false,
  refletAuDoigt = false,
  culbute = null,
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
  const { size, viewport } = useThree()
  const dpr = viewport.dpr

  const { face, laiton, halo, verso } = useMemo(() => {
    const laiton = new THREE.MeshStandardMaterial({
      color: '#b79a6a',
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
      roughness: 0.55,
      metalness: 0.15,
      emissive: '#ffcf7a',
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
      nuanceur.uniforms.uLustre = { value: 0.5 }
      nuanceur.uniforms.uLustreForce = { value: 0 }
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
         diffuseColor.rgb = mix(diffuseColor.rgb, vec3(luminance), uGris);
         float bande = (vLustreUv.x + vLustreUv.y) * 0.5;
         float ecart = bande - uLustre;
         diffuseColor.rgb += vec3(1.0, 0.95, 0.82)
           * uLustreForce
           * (exp(-ecart * ecart * 95.0) + 0.5 * exp(-ecart * ecart * 480.0));`,
      )
      nuanceur.fragmentShader = `uniform float uGris;
uniform float uLustre;
uniform float uLustreForce;
varying vec2 vLustreUv;
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
    face.customProgramCacheKey = () => 'carte-face-desaturable-lustree'
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
      roughness: 0.55,
      metalness: 0.15,
      alphaTest: 0.5,
    })
    return { face, laiton, halo, verso }
  }, [])

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
  const largeurPx = taille * (size.height / hauteurVisibleA(position[2], size.height)) * dpr

  useEffect(() => {
    let vivant = true
    // LA TEXTURE VIENT D'UN CACHE PARTAGÉ : deux cartes du même modèle se la
    // prêtent, et une carte remontée la retrouve déjà prête — donc elle ne
    // repasse jamais par son état sombre. Rien n'est libéré ici pour la même
    // raison : elle ne nous appartient pas.
    void (dos ? textureDuDos() : textureDeCarte(carte, largeurPx))
      .then((texture) => {
        if (!vivant) return
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
  const propre = useRef({ dessus: false, x: 0, y: 0 })
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
  useEffect(() => {
    for (const m of [face, laiton, halo, verso]) {
      m.clippingPlanes = clipper
      m.needsUpdate = true
    }
  }, [clipper, face, laiton, halo, verso])

  // LA TEXTURE DU DOS N'ARRIVE QUE QUAND LA CULBUTE COMMENCE : elle sort du
  // même cache partagé que les faces, donc la première la paie et les
  // suivantes la retrouvent prête.
  useEffect(() => {
    if (culbute === null || culbute === undefined || verso.map !== null) return
    let vivant = true
    void textureDuDos()
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
  }, [culbute, verso])

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
    const feuVise = engagee || peril ? 1 : 0
    l.feu += (feuVise - l.feu) * (1 - Math.exp(-12 * delta))
    const t = etat.clock.elapsedTime
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
    l.brille += ((dessus ? 1 : 0) - l.brille) * kReflet
    l.vx += ((dessus ? curseur.x : 0) - l.vx) * kReflet
    l.vy += ((dessus ? curseur.y : 0) - l.vy) * kReflet

    /**
     * LA CULBUTE PREND LA MAIN SUR TOUT LE RESTE, et c'est voulu : pendant
     * qu'elle se joue, la carte n'est plus un objet qui rejoint sa place, elle
     * est une mise en scène. L'amortissement reprend à la fin, remis à la
     * cible pour qu'il n'ait rien à rattraper.
     */
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
    g.scale.setScalar(l.t)

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
      | { uniforms: Record<string, { value: number }> }
      | undefined
    if (nuanceur !== undefined) {
      nuanceur.uniforms.uGris!.value = gris
      // LA BANDE SE POSE SOUS LE CURSEUR, elle ne le fuit pas : la diagonale
      // de la carte vaut `(u + v) / 2`, et le point visé y tombe exactement.
      // *Un reflet qu'on ne peut pas promener n'est pas un reflet, c'est une
      // animation.*
      nuanceur.uniforms.uLustre!.value = 0.5 + (l.vx + l.vy) * 0.5
      // Il RESPIRE à peine, sur l'horloge lente du liseré : c'est ce qui le
      // fait lire comme de la lumière et non comme un aplat peint.
      // ELLE EST DISCRÈTE. Keko l'a trouvée « un peu forte » : un lustre qui
      // délave l'illustration cesse d'être une matière et devient un voile.
      nuanceur.uniforms.uLustreForce!.value = l.brille * (0.13 + Math.sin(t * 3) * 0.03)
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
    face.emissiveIntensity = eclat * 1.5
    laiton.emissiveIntensity = eclat * 1.1
    // L'ONDE, une fois la carte fixée dans son slot.
    if (l.debutOnde !== null) {
      if (poserLOnde(t - l.debutOnde, vague.current, matiereOnde, poussiere)) l.debutOnde = null
    }

    // LE LISERÉ RESPIRE, à peine : c'est ce qui le fait lire comme une lumière
    // et non comme un trait peint. Sur la même horloge que le frémissement,
    // mais bien plus lente — deux battements rapides se liraient comme un
    // clignotement d'alerte.
    halo.color.set(peril ? '#ff6a52' : '#ffe6ab')
    halo.opacity = l.feu * (0.88 + Math.sin(t * 6) * 0.12)
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
          <meshBasicMaterial
            map={textureNombre(pile)}
            transparent
            // IL N'ÉCRIT PAS DE PROFONDEUR : son plan déborde de la carte, et
            // *ce qui est transparent ne doit rien cacher.*
            depthWrite={false}
            toneMapped={false}
          />
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
        castShadow={ombre}
        geometry={GEOMETRIE_CORPS}
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
        <mesh geometry={GEOMETRIE_FACE} material={face} position={[0, 0, EPAISSEUR / 2 + 0.001]} raycast={() => null} />
        {/* LE VERSO, le temps de la culbute : sans lui, la carte disparaît un
            demi-tour sur deux et le geste ne se lit plus. */}
        {culbute !== null && culbute !== undefined && (
          <mesh
            geometry={GEOMETRIE_FACE}
            material={verso}
            position={[0, 0, -EPAISSEUR / 2 - 0.001]}
            rotation={[0, Math.PI, 0]}
            raycast={() => null}
          />
        )}
      </mesh>
    </group>
  )
}

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
import {
  LIGNE_DECHIRURE,
  POCHE,
  RAPPORT_SACHET,
  textureDesPlis,
  textureDuSachet,
} from './texture-carte.ts'

/**
 * CE QUE DURE L'OUVERTURE, en secondes.
 *
 * *Le feu doit avoir le temps de prendre* — un front qui traverse en trois
 * dixièmes se lit comme un essuie-glace — et pas celui de lasser : on ouvre
 * un paquet après l'autre.
 */
export const DUREE_BRULURE = 1.5

/**
 * QUAND LE FRONT A FINI SA COURSE, en part de la durée.
 *
 * Avant : il court sur la ligne. Après : la bande part. *Les deux ne se
 * chevauchent pas* — on n'arrache pas ce qui tient encore par un bout.
 */
const PART_FRONT = 0.42

/**
 * LA COURBE DU FRONT : il part lentement et ACCÉLÈRE.
 *
 * C'est ce que fait une déchirure — elle amorce, puis elle file — et c'est
 * l'inverse de tout le reste du jeu, où le mouvement part vite et s'achève
 * lentement. *Un front qui ralentirait en arrivant se lirait comme un store
 * qu'on baisse.*
 */
const COURBE_FRONT = 1.45

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
 * **BAISSÉ DEUX FOIS** (0,095 → 0,07 → 0,05), Keko : « on dirait qu'il est très
 * épais », puis « le paquet semble encore trop épais ». *Cinq cartes de douze
 * millièmes font six centièmes de largeur de carte*, donc la poche réelle est
 * de cet ordre : on est enfin dans le vrai.
 */
const REL_BOMBE = 0.05

/**
 * DE COMBIEN LES DEUX ARÊTES DU VENTRE SONT ARRONDIES — 0 vif, 1 sans arête.
 * *Une arête se voit à sa RUPTURE de pente* : ce congé en rend un peu plus de
 * la moitié, donc le pli se lit encore, sans le tranchant d'un pliage.
 */
const ARRONDI_VENTRE = 0.7

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
const PLI = 0.5
const OMBRE = 0.05

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
const METAL = 0.7

/**
 * LES QUATRE LOBES DU REFLET, et le galbe.
 *
 * *Le lustre MULTIPLIE* — il éclaircit sans effacer la teinte, donc il peut
 * monter haut ; **les éclats des sources AJOUTENT**, parce qu'un point chaud
 * est de la lumière en plus et non la même lumière en plus fort.
 */
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
  // éclats des plis. **SA DIRECTION EST À 45° DANS LE PLAN DE L'ÉCRAN** — c'est
  // la diagonale haut-gauche que tout le jeu respecte, et chez eux elle penchait
  // de 36°, donc le flanc du HAUT prenait tout et celui de GAUCHE rien.
  { dir: [-0.492, 0.492, 0.719], couleur: [1, 1, 1], force: 0.52 },
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

/** Le `smoothstep` du GLSL, cote JavaScript. */
function lissage(e0: number, e1: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)))
  return t * t * (3 - 2 * t)
}

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
 * En dessous, le sachet se referme. *Un sachet qu'on effleure ne s'ouvre pas*,
 * et c'est ce qui permet de le prendre en main sans l'engager.
 */
const SEUIL_TIRE = 0.5

/** Ce que met un geste abandonné à se refermer, en secondes. */
const RETOUR = 0.28

/** Ce que le survol penche et avance : *un objet qu'on tourne vers soi.* */
const PENCHE = 0.26
const AVANCEE = 0.1

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
  float fx = 1.0 - clamp(d.x / ${POCHE.flancX.toFixed(4)}, 0.0, 1.0);
  float fy = 1.0 - clamp(d.y / ${POCHE.flancY.toFixed(4)}, 0.0, 1.0);
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
      uSachet: { value: VIDE },
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
    },
    vertexShader: `uniform float uV0;
uniform float uV1;
uniform float uBombe;
varying vec2 vUv;
${VENTRE}
void main() {
  vUv = uv;
  // LE REPÈRE DU SACHET ENTIER, ici aussi : *le ventre ne doit pas s'arrêter à
  // la déchirure*, sinon les deux morceaux ne seraient plus la même poche.
  vec2 sach = vec2(uv.x, mix(uV0, uV1, uv.y));
  vec3 pos = position;
  pos.z += ventre(sach) * uBombe;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}`,
    fragmentShader: `uniform sampler2D uSachet;
uniform sampler2D uPlis;
uniform float uV0;
uniform float uV1;
uniform float uFront;
uniform float uTemps;
uniform float uFondu;
uniform vec2 uPenche;
uniform float uSurvol;
varying vec2 vUv;
${VENTRE}
${DECHIRURE}

void main() {
  // LE REPÈRE DU SACHET ENTIER, pas celui du morceau : *les deux doivent
  // porter LE MÊME froissé*, sinon le pli s'arrête net à la déchirure et la
  // bande qui s'envole n'est plus faite du même film. Et il est mis au carré
  // par le rapport, sans quoi les plis seraient étirés deux fois en hauteur.
  vec2 sach = vec2(vUv.x, mix(uV0, uV1, vUv.y));
  vec4 tex = texture2D(uSachet, sach);

  /**
   * LA NORMALE DU VENTRE, et c'est elle qui raconte la FORME.
   *
   * Les deux pentes se comptent dans le MONDE : un pas en y couvre
   * le rapport du sachet fois plus de longueur qu'un pas en x, donc la même
   * différence de hauteur y vaut une pente d'autant plus faible. *Sans ça le
   * ventre serait deux fois trop raide dans sa hauteur.*
   *
   * **ET LA PENTE SE BORNE** : la puissance 0,55 donne une tangente VERTICALE
   * tout au bord, donc une normale qui part à l'infini sur la dernière rangée
   * de pixels. C'est voulu pour la forme — *le film retombe d'un coup* — mais
   * un reflet n'a rien à y faire.
   */
  float eb = 0.012;
  float gx = (ventre(sach + vec2(eb, 0.0)) - ventre(sach - vec2(eb, 0.0))) / (2.0 * eb);
  float gy = (ventre(sach + vec2(0.0, eb)) - ventre(sach - vec2(0.0, eb))) / (2.0 * eb);
  gx = clamp(gx, -9.0, 9.0);
  gy = clamp(gy, -9.0, 9.0);
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

  // LE PENCHANT S'APPLIQUE AUX QUATRE SOURCES, et pas à la clé seule : *elles
  // sont fixes dans la pièce et c'est le sachet qui tourne*, donc elles
  // balaient toutes ensemble. Une seule qui bougerait se lirait comme une lampe
  // qu'on promène.
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
  tex.rgb *= 0.62 + 0.52 * (dot(Nv, L) * 0.5 + 0.5);
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
  corps *= 1.0 + lustre * ${LUSTRE.toFixed(2)};

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

  // SOURCE 1 : la clé, blanche — *elle réutilise le H qu'on vient de calculer*,
  // puisque c'est la même lampe que celle qui modèle le ventre.
  {
    corps += teinte * vec3(${SOURCES[0]!.couleur[0]!.toFixed(2)}, ${SOURCES[0]!.couleur[1]!.toFixed(2)}, ${SOURCES[0]!.couleur[2]!.toFixed(2)})
           * pow(max(dot(Nv, H), 0.0), ${SERRE}.0) * ${SOURCES[0]!.force.toFixed(2)} * feu;
  }

  // SOURCE 2 : le cyan
  {
    vec3 Ls = normalize(vec3(${SOURCES[1]!.dir[0]!.toFixed(3)} + pen.x, ${SOURCES[1]!.dir[1]!.toFixed(3)} + pen.y, ${SOURCES[1]!.dir[2]!.toFixed(3)}));
    vec3 Hs = normalize(Ls + vec3(0.0, 0.0, 1.0));
    corps += teinte * vec3(${SOURCES[1]!.couleur[0]!.toFixed(2)}, ${SOURCES[1]!.couleur[1]!.toFixed(2)}, ${SOURCES[1]!.couleur[2]!.toFixed(2)})
           * pow(max(dot(Nv, Hs), 0.0), ${SERRE}.0) * ${SOURCES[1]!.force.toFixed(2)} * feu;
  }

  // SOURCE 3 : le rose
  {
    vec3 Ls = normalize(vec3(${SOURCES[2]!.dir[0]!.toFixed(3)} + pen.x, ${SOURCES[2]!.dir[1]!.toFixed(3)} + pen.y, ${SOURCES[2]!.dir[2]!.toFixed(3)}));
    vec3 Hs = normalize(Ls + vec3(0.0, 0.0, 1.0));
    corps += teinte * vec3(${SOURCES[2]!.couleur[0]!.toFixed(2)}, ${SOURCES[2]!.couleur[1]!.toFixed(2)}, ${SOURCES[2]!.couleur[2]!.toFixed(2)})
           * pow(max(dot(Nv, Hs), 0.0), ${SERRE}.0) * ${SOURCES[2]!.force.toFixed(2)} * feu;
  }

  // SOURCE 4 : le violet
  {
    vec3 Ls = normalize(vec3(${SOURCES[3]!.dir[0]!.toFixed(3)} + pen.x, ${SOURCES[3]!.dir[1]!.toFixed(3)} + pen.y, ${SOURCES[3]!.dir[2]!.toFixed(3)}));
    vec3 Hs = normalize(Ls + vec3(0.0, 0.0, 1.0));
    corps += teinte * vec3(${SOURCES[3]!.couleur[0]!.toFixed(2)}, ${SOURCES[3]!.couleur[1]!.toFixed(2)}, ${SOURCES[3]!.couleur[2]!.toFixed(2)})
           * pow(max(dot(Nv, Hs), 0.0), ${SERRE}.0) * ${SOURCES[3]!.force.toFixed(2)} * feu;
  }

  // **LES ÉCLATS DES PLIS RESTENT À PART, et eux seuls lisent la normale des
  // plis** : ce sont de vrais points chauds, trop petits pour effacer quoi que
  // ce soit. *Un point qui sature est une étincelle, une nappe qui sature est
  // un voile.* Ils sont teintés comme les autres — un pli de film argenté
  // n'étincelle pas en blanc, il étincelle de la couleur du film.
  float eclats = pow(max(dot(N, H), 0.0), 150.0);
  corps += teinte * vec3(1.0, 0.97, 0.90) * eclats * ${ECLATS.toFixed(2)} * feu;

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
  vec3 lueur = mix(vec3(1.5, 1.35, 1.05), vec3(2.2, 2.1, 1.9), smoothstep(0.4, 1.0, eclat));

  float a = max(tex.a, eclat * 0.9) * uFondu;
  gl_FragColor = vec4(corps + lueur * eclat, a);
  if (gl_FragColor.a < 0.004) discard;
}`,
  })
}

/**
 * LA GERBE : les CONFETTIS qui montent de l'ouverture.
 *
 * **Ils ont été des étincelles d'or**, et c'était la ferronnerie une dernière
 * fois : *une étincelle sort d'un feu ou d'une forge*, et on n'ouvre ni l'un ni
 * l'autre. **Un paquet qu'on déchire lâche des confettis** — c'est ce que le
 * geste raconte, et les cinq couleurs du jeu étaient déjà là pour le dire.
 *
 * Trois choses les séparent d'un semis d'étincelles, et aucune n'est de la
 * décoration :
 *
 * - **ILS ONT UNE FORME** : un petit rectangle, pas un point. *Un grain rond
 *   additif est une lueur ; une arête est un objet* ;
 * - **ILS TOURNENT, chacun à son rythme.** Un confetti est une feuille, donc il
 *   culbute en montant — et *vingt rectangles qui tournent du même angle se
 *   lisent comme une grille qui glisse* ;
 * - **ILS PRENNENT LES CINQ COULEURS DES CRANS**, par une fonction de la
 *   CELLULE et non par un tirage par image : c'est la règle du motif de touches
 *   du dos, et *un semis qui se réarrange n'est plus une matière.*
 *
 * **Elle a son propre plan**, bien plus haut que le sachet, parce qu'*un effet
 * ne peut pas déborder de la géométrie qui le porte* : posées dans le corps,
 * les étincelles s'arrêteraient net au bord déchiré, c'est-à-dire exactement
 * là où elles doivent commencer.
 */
function matiereDeLaGerbe(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: { uFront: { value: 0 }, uTemps: { value: 0 }, uForce: { value: 0 } },
    vertexShader: `varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`,
    fragmentShader: `uniform float uFront;
uniform float uTemps;
uniform float uForce;
varying vec2 vUv;
${DECHIRURE}

void main() {
  // LE SEMIS MONTE : une grille de cellules qui défile vers le haut. *Un grain
  // tiré à chaque image n'est plus une matière, c'est du bruit.*
  vec2 cellule = vec2(vUv.x * 26.0, vUv.y * 22.0 - uTemps * 2.3);
  vec2 m = floor(cellule);
  float tiree = des(m);
  vec2 dans = fract(cellule) - 0.5;
  dans.x += (des(m + 7.3) - 0.5) * 0.5;

  // LE CONFETTI : un rectangle qui CULBUTE. Sa rotation part de sa cellule et
  // avance avec le temps, donc chacun tourne a son rythme — *et il s'aplatit en
  // passant de profil*, ce que le cosinus donne sans qu'on ait rien a ecrire.
  float ang = des(m + 3.1) * 6.283 + uTemps * (2.0 + des(m + 5.7) * 4.0);
  vec2 q = vec2(dans.x * cos(ang) - dans.y * sin(ang), dans.x * sin(ang) + dans.y * cos(ang));
  q.y *= 1.0 / max(0.25, abs(cos(ang * 1.7)));
  vec2 b = abs(q) - vec2(0.17, 0.11);
  float d = length(max(b, 0.0)) + min(max(b.x, b.y), 0.0);
  float grain = smoothstep(0.05, 0.0, d) * step(0.58, tiree);

  // ELLES SORTENT DE LA FENTE, donc elles s'éteignent en montant — *une
  // étincelle a une durée* — et elles se resserrent vers le milieu, comme une
  // gerbe qui s'évase puis retombe.
  float monte = exp(-vUv.y * 2.6);
  float evase = exp(-pow((vUv.x - 0.5) / (0.16 + vUv.y * 0.3), 2.0));

  // PENDANT QUE LE FRONT COURT, elles ne jaillissent que de LÀ OÙ il passe :
  // *une gerbe pleine largeur avant que la fente soit ouverte annoncerait une
  // ouverture qui n'a pas eu lieu.*
  float ouvert = max(smoothstep(uFront + 0.06, uFront - 0.02, vUv.x) * 0.55,
                     exp(-pow((vUv.x - uFront) / 0.07, 2.0)));

  // LES CINQ CRANS, pris sur la cellule : blanc, vert, bleu, violet, orange.
  // *Elles y sont TOUTES, donc elles ne disent rien d'une carte en
  // particulier* — et ensemble elles disent la collection, exactement comme les
  // confettis du motif du dos.
  float k = floor(des(m + 11.9) * 5.0);
  vec3 teinte = k < 1.0 ? vec3(2.3, 2.3, 2.3)
              : k < 2.0 ? vec3(0.5, 2.6, 1.1)
              : k < 3.0 ? vec3(0.6, 1.7, 2.8)
              : k < 4.0 ? vec3(1.7, 1.0, 2.7)
                        : vec3(2.7, 1.5, 0.5);

  float a = grain * monte * evase * ouvert * uForce;
  gl_FragColor = vec4(teinte * a, a);
  if (a < 0.004) discard;
}`,
  })
}

export function Sachet3D({
  taille,
  position,
  ouvre = false,
  onOuvert,
  onDechire,
  onOuvrir,
}: {
  /** Sa largeur en unités de scène ; sa hauteur suit son rapport. */
  readonly taille: number
  readonly position: readonly [number, number, number]
  /** Vrai dès qu'il doit s'ouvrir sans geste. Il ne se referme pas. */
  readonly ouvre?: boolean
  /** La bande vient d'être arrachée — *c'est l'instant du flash.* */
  readonly onDechire?: () => void
  /** Tout est fini : *c'est l'écran qui décide de la suite.* */
  readonly onOuvert?: () => void
  /** Le geste est acquis : la déchirure part toute seule. */
  readonly onOuvrir?: () => void
}): React.ReactElement {
  const groupe = useRef<THREE.Group>(null)
  const relief = useRef<THREE.Group>(null)
  const bande = useRef<THREE.Group>(null)
  const corps = useMemo(() => matiereDuMorceau(true), [])
  const bandeMat = useMemo(() => matiereDuMorceau(false), [])
  const gerbe = useMemo(() => matiereDeLaGerbe(), [])
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
  }, [corps, bandeMat])

  // LES MATIÈRES SE JETTENT AVEC LE COMPOSANT : un `ShaderMaterial` garde son
  // programme compilé, et l'écran en monte trois par paquet ouvert. Le curseur
  // se rend avec elles — *un objet qui disparaît sous la souris laisserait une
  // main posée sur la page.*
  useEffect(
    () => () => {
      corps.dispose()
      bandeMat.dispose()
      gerbe.dispose()
      document.body.style.cursor = ''
    },
    [corps, bandeMat, gerbe],
  )

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    const dt = avant.current === null ? 0 : Math.min(0.1, t - avant.current)
    avant.current = t
    corps.uniforms.uTemps!.value = t
    bandeMat.uniforms.uTemps!.value = t
    gerbe.uniforms.uTemps!.value = t

    if (ouvre) file.current = true

    // TROIS ÉTATS, ET UN SEUL CHIFFRE LES PORTE. Le doigt pose `p` lui-même ;
    // une fois le geste acquis l'horloge prend le relais DEPUIS LÀ — *on ne
    // rejoue pas le chemin déjà fait* — et un geste abandonné le rend.
    if (file.current) p.current = Math.min(1, p.current + dt / DUREE_BRULURE)
    else if (tire.current === null && p.current > 0)
      p.current = Math.max(0, p.current - dt / RETOUR)

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
      const berce = file.current ? 0 : 1 - feu.current
      const cibleX = (vu ? -curseur.current.y * PENCHE : 0) + Math.sin(t * 0.62) * 0.055 * berce
      const cibleY = (vu ? curseur.current.x * PENCHE * 1.3 : 0) + Math.sin(t * 0.9) * 0.085 * berce
      r.rotation.x += (cibleX - r.rotation.x) * k
      r.rotation.y += (cibleY - r.rotation.y) * k
      r.position.z += (taille * AVANCEE * feu.current - r.position.z) * k
      // LE NUANCEUR LIT LE PENCHANT RÉEL, pas sa cible : *une lumière qui
      // arriverait avant l'objet qu'elle éclaire se lirait comme un décalage*,
      // et l'amortissement est précisément ce qui donne son poids au geste.
      corps.uniforms.uPenche!.value.set(r.rotation.x, r.rotation.y)
      bandeMat.uniforms.uPenche!.value.set(r.rotation.x, r.rotation.y)
    }
    corps.uniforms.uSurvol!.value = feu.current
    bandeMat.uniforms.uSurvol!.value = feu.current

    if (p.current <= 0 && !file.current) {
      // IL RESPIRE TANT QU'ON NE L'A PAS TOUCHÉ. *Un objet qui attend un geste
      // doit dire qu'il attend* — et c'est le vocabulaire du jeu, celui des
      // créatures et des slots qui accueillent.
      groupe.current?.scale.setScalar(1 + Math.sin(t * 1.7) * 0.013)
      corps.uniforms.uFront!.value = -1
      bandeMat.uniforms.uFront!.value = -1
      gerbe.uniforms.uForce!.value = 0
      return
    }
    groupe.current?.scale.setScalar(1)

    const pp = p.current
    const pf = Math.min(1, pp / PART_FRONT)
    // IL SORT DES DEUX BORDS : *une déchirure qui commence pile sur le bord se
    // lit comme un bord qui s'efface*, et une qui s'arrête pile à droite y
    // laisse un point de braise posé là pour toujours.
    const front = -0.06 + Math.pow(pf, COURBE_FRONT) * 1.12
    corps.uniforms.uFront!.value = front
    bandeMat.uniforms.uFront!.value = front
    gerbe.uniforms.uFront!.value = front

    // LA GERBE monte dès que la fente s'ouvre, culmine à l'arrachement, puis
    // retombe lentement : *une gerbe qui s'arrêterait net se lirait comme une
    // coupure de courant.*
    gerbe.uniforms.uForce!.value =
      pf * (pp < PART_FRONT ? 1 : Math.max(0, 1 - (pp - PART_FRONT) / 0.5))

    if (pf >= 1 && !ditDechire.current) {
      ditDechire.current = true
      onDechire?.()
    }

    // LA BANDE S'ENVOLE une fois le front arrivé au bout. Elle monte, part à
    // droite et RETOMBE — *ce qu'on arrache est emporté puis lâché* — en
    // tournoyant sur elle-même, parce qu'un morceau de film n'a aucune raison
    // de rester à plat.
    const pv = Math.max(0, (pp - PART_FRONT) / (1 - PART_FRONT))
    if (bande.current !== null) {
      const b = bande.current
      b.position.x = taille * 1.15 * pv * pv
      b.position.y = hCorps / 2 + H * (0.52 * pv - 1.15 * pv * pv)
      b.rotation.z = -pv * 7.2
      b.scale.setScalar(Math.max(0.2, 1 - pv * 0.55))
    }
    bandeMat.uniforms.uFondu!.value = Math.max(0, 1 - Math.pow(pv, 2.2))

    // LE CORPS S'EFFACE PENDANT QUE LES CARTES MONTENT. Il restait entier
    // jusqu'au dernier instant, puis le composant se demontait : *un sachet
    // qui disparait d'un coup se lit comme un bug de rendu.* Il part sur le
    // dernier quart, donc apres l'arrachement et pendant la sortie -- ce
    // qu'on a vide n'a plus a rester.
    corps.uniforms.uFondu!.value = 1 - lissage(0.74, 1, pp)

    if (pp >= 1 && !dit.current) {
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
      x: Math.min(0.7, Math.max(-0.7, x)),
      y: Math.min(0.7, Math.max(-0.7, y)),
    }
  }

  const prendre = (e: ThreeEvent<PointerEvent>): void => {
    if (file.current || tire.current !== null) return
    e.stopPropagation()
    tire.current = { x0: e.clientX, y0: e.clientY, p0: p.current, ...viseDepuis(e) }
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
      const part = g.p0 / PART_FRONT + (ev.clientX - g.x0) / largePx
      p.current = Math.min(TIRE_MAX, Math.max(0, part)) * PART_FRONT
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
    const lacher = (): void => {
      ctrl.abort()
      const acquis = tire.current !== null && p.current / PART_FRONT >= SEUIL_TIRE
      tire.current = null
      finir()
      if (!acquis) return
      file.current = true
      onOuvrir?.()
    }
    // UNE ANNULATION N'EST PAS UN LÂCHER : c'est le système qui reprend le
    // geste, donc le sachet se referme au lieu de s'ouvrir.
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
      {/* LA GERBE, DERRIÈRE le sachet et bien plus haute que lui : elle part
          de la fente et monte au-delà du bord. Elle vit HORS du groupe du
          relief — *une gerbe d'étincelles ne s'incline pas avec la pochette*,
          elle monte dans l'axe de l'écran. */}
      <mesh position={[0, hCorps / 2 - hBande / 2 + taille * 0.62, -0.02]} raycast={() => null}>
        <planeGeometry args={[taille * 1.5, taille * 1.3]} />
        <primitive object={gerbe} attach="material" />
      </mesh>

      {/* LE RELIEF porte l'inclinaison et l'avancée. Il lui faut son propre
          groupe : le groupe du dessus tient la place et la respiration, et
          *deux sources qui écriraient la même transformation se battraient à
          chaque image.* */}
      <group ref={relief}>
        {/* LE CORPS : il reste, et c'est de lui que les cartes sortiront. */}
        <mesh
          position={[0, -hBande / 2, 0]}
          onPointerDown={prendre}
          onPointerMove={viser}
          onPointerOut={quitter}
        >
          {/* IL LUI FAUT DES SEGMENTS : *un plan à quatre sommets ne peut pas
              se bomber*, il n'a rien entre ses coins à déplacer. */}
          <planeGeometry args={[taille, hCorps, 36, 56]} />
          <primitive object={corps} attach="material" />
        </mesh>

        {/* LA BANDE : son GROUPE porte le vol, son plan porte le dessin — et le
            plan est à l'origine du groupe, sinon la rotation la ferait tourner
            autour du centre du SACHET et l'enverrait décrire un cercle. *Un
            objet tournoie sur lui-même, donc son pivot est son centre.* */}
        <group ref={bande} position={[0, hCorps / 2, 0]}>
          <mesh onPointerDown={prendre} onPointerMove={viser} onPointerOut={quitter}>
            <planeGeometry args={[taille, hBande, 36, 10]} />
            <primitive object={bandeMat} attach="material" />
          </mesh>
        </group>
      </group>
    </group>
  )
}

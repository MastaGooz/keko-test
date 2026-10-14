import { NoToneMapping } from 'three'
/**
 * L'OUVERTURE D'UN PAQUET — le premier écran du troisième mode.
 *
 * Cinq cartes face cachée ; on en tape une, elle culbute et se révèle. Choisi
 * par Keko parmi trois écrans, et c'est celui qui exerce le plus de ce qui
 * existe déjà : **le dos de carte, les quatre métaux, l'auréole chromatique du
 * diamant, la culbute face/dos et son onde.** Rien de tout ça n'est réécrit
 * ici — `Carte3D` sait déjà le faire, et cet écran ne fait que le lui demander.
 *
 * *C'est la règle du projet depuis le début* : un écran décide de ce que les
 * choses VEULENT DIRE, les objets savent comment elles se dessinent.
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Carte3D, DUREE_FLIP, INCLINAISON_REFLET, type CurseurDeCarte } from './Carte3D.tsx'
import { suivreLInclinaison, type Inclinaison } from './inclinaison.ts'
import { Bouton3D } from './Bouton3D.tsx'
import { RECUL_DU_BAS, SANS_GYRO, Sachet3D } from './Sachet3D.tsx'
import { Cadrage, FOV, Z_MAIN, hauteurVisibleA, zCamera } from './Cadrage.tsx'
import { Horloge } from './horloge.tsx'
import {
  AMBIANCE,
  ECHELLE_COULEUR,
  ECHELLE_METAL,
  POCHE,
  RAPPORT_SACHET,
  type CarteAPeindre,
} from './texture-carte.ts'
import { carteDeLEmoji } from './carte-emoji.ts'
import { carteDeLaPeinture } from './carte-peinture.ts'
import { chargerEmojis } from '../ui/emoji.ts'
import { chargerPeintures } from '../ui/peintures.ts'
import { createRng } from '../logic/rng.ts'
import {
  CARTES_PAR_PAQUET,
  ECHELLE_CINQ,
  ECHELLE_QUATRE,
  ouvrirPaquet,
  parCran,
  type Echelle,
} from '../logic/paquet.ts'
import { tirerBonus, type Bonus } from '../logic/emoji/tirage.ts'
import type { CarteEmoji } from '../logic/emoji/types.ts'
import type { CartePeinture } from '../logic/paintings/types.ts'

/**
 * L'EMOJI EST LE MODE PRINCIPAL ; LES PEINTURES RESTENT À CÔTÉ.
 *
 * Tranché par Keko : « on laisse définitivement tomber les animaux et les
 * personnages, on garde le projet emoji qui devient le principal ». Les deux
 * catalogues abandonnés sont partis — *du code mort ment sur ce que le jeu
 * fait* — et avec eux le plateau, qui lisait le graphe de leurs articles.
 *
 * **Les peintures ne sont nommées dans aucun des deux camps**, donc elles
 * restent ouvrables par `?paquet&art` : *ce qui a servi à choisir doit rester
 * ouvrable, même une fois le choix fait*, et elles ne coûtent rien à qui
 * n'ouvre pas le lien.
 *
 * **Les deux passent par le MÊME tirage** (`logic/paquet.ts`), qui ne demande
 * à une carte que son identité et son cran : c'est précisément pour ça qu'il
 * ne vit dans le dossier d'aucun mode.
 */
type CarteDuMode = CartePeinture | CarteEmoji

/**
 * LES DEUX CATALOGUES PASSENT PAR LE MEME PEINTRE, et le discriminant est
 * STRUCTUREL — `emoji` n'existe que sur une carte d'emoji : *un drapeau de
 * mode pose a cote se desaccorderait de la carte qu'il decrit.*
 */
function carteAPeindreDuMode(c: CarteDuMode, bonus?: Bonus): CarteAPeindre {
  if ('emoji' in c) return carteDeLEmoji(c, bonus)
  return carteDeLaPeinture(c)
}

/**
 * LE CHIFFRE QUE LA DERNIERE CARTE FAIT DEFILER, et son unite.
 *
 * **Il doit etre celui dont la rarete DERIVE** : *un chiffre qui grimpe et une
 * teinte qui grimpe avec lui ne disent la meme chose que s'ils mesurent la
 * meme chose.* **Pour une peinture c'est le nombre de VERSIONS
 * LINGUISTIQUES**, qui pese trois cinquiemes de sa formule et s'accorde a
 * 0,971 avec elle.
 */
function compteurDuMode(c: CarteDuMode, total = 0): { valeur: number; unite: string } {
  // POUR UN EMOJI C'EST LE NOMBRE D'EMOJI QU'IL DEPASSE au classement d'usage
  // d'Unicode. **Il fallait un chiffre qui MONTE avec la rarete** : le rang,
  // lui, descend -- un compteur qui s'arreterait a « 3 » pour la carte la plus
  // rare monterait vers le commun, et *la teinte monte avec le compteur.*
  if ('emoji' in c) return { valeur: Math.max(0, total - c.rang), unite: 'emoji dépassés' }
  return { valeur: c.langues, unite: 'langues sur Wikipédia' }
}

/**
 * LA RANGÉE SE DIMENSIONNE SUR LA PLACE, jamais à une taille écrite à la main.
 *
 * C'est la règle que la grille du zoom et le chargement de l'armurerie ont
 * déjà payée : *le champ visible est plus PETIT en unités de scène sur un
 * téléphone*, donc une carte de taille fixe y déborde. Deux contraintes — la
 * largeur pour que cinq cartes tiennent, la hauteur pour qu'une carte tienne —
 * et la plus dure gagne.
 */
function tailleDeLaRangee(
  largeurVisible: number,
  hauteurVisible: number,
  colonnes: number,
  lignes: number,
): number {
  const parLargeur = (largeurVisible * 0.9) / (colonnes + (colonnes - 1) * 0.12)
  const parHauteur = (hauteurVisible * 0.64) / (lignes * 1.4 + (lignes - 1) * 0.17)
  return Math.min(parLargeur, parHauteur)
}

/**
 * COMBIEN DE COLONNES AU BILAN — **cinq en paysage, trois en portrait.**
 *
 * *Cinq cartes alignées sur la largeur d'un téléphone debout font 55 px de
 * large chacune* : on y voit cinq couleurs et plus un seul nom. **Un bilan est
 * fait pour relire ce qu'on vient d'avoir**, donc il cède la ligne plutôt que
 * la taille — et trois colonnes sur deux lignes rendent 70 % de largeur à
 * chaque carte.
 *
 * Le seuil est le RAPPORT de la fenêtre et non une largeur en pixels : *ce qui
 * décide n'est pas la taille de l'écran, c'est sa forme.*
 */
function colonnesDuBilan(largeurVisible: number, hauteurVisible: number): number {
  return largeurVisible / hauteurVisible >= 1.15 ? CARTES_PAR_PAQUET : 3
}

/**
 * LE SACHET EST PLUS GRAND QU'UNE CARTE, et il doit l'être : *il en contient
 * cinq.* Un sachet à la taille d'une carte se lirait comme une sixième carte
 * posée au milieu, et on ne comprendrait pas qu'il y a quelque chose dedans.
 *
 * Il se dimensionne sur la place, comme tout ici — la hauteur borne sur un
 * téléphone, la largeur sur un écran de PC.
 */
/**
 * LA CARTE PENCHE AVEC LE TÉLÉPHONE, comme le sachet — et c'est le même
 * capteur, lu de la même façon (`inclinaison.ts`, zéro à la première lecture).
 *
 * Keko : « les cartes ne bougent plus quand je hover / maintiens le tap,
 * normalement elles s'inclinent — et elles doivent le faire aussi quand je
 * bouge le tel : exactement comme le paquet booster ».
 *
 * *Le sachet convertit l'inclinaison en rotation* (`GYRO_GAIN`, borné à
 * `GYRO_BORNE`) ; la carte, elle, ne connaît qu'un CURSEUR en demi-largeurs,
 * que `Carte3D` multiplie par `INCLINAISON_REFLET`. On lui donne donc la même
 * rotation, exprimée dans ses unités — **et avec la lumière**, comme sous le
 * doigt : Keko l'a demandé en le voyant pencher sans briller (« qu'il y ait
 * la lumière aussi comme avec le tap »).
 *
 * **Le doigt et la souris passent devant** : tant que `curseur.tenu` dit
 * qu'un pointeur la tient, le gyroscope ne touche à rien. Même signes que le
 * sachet : le haut du téléphone qui s'éloigne penche le haut de la carte vers
 * l'arrière, le côté droit qui descend penche la carte à droite.
 */
/**
 * LA SORTIE D'UNE CARTE PASSÉE : son ressort (celui de `Carte3D` vaut 9) et
 * l'angle qu'elle prend en partant à droite, en radians. *Chiffres à l'oeil*,
 * à rejuger par Keko : un départ se juge en le regardant.
 */
const RESSORT_SORTIE = 5
const ANGLE_SORTIE = 0.14
const GYRO_GAIN_CARTE = 0.6
const GYRO_BORNE_CARTE = 0.22
/**
 * LA LUMIÈRE SE DOSE SUR L'ANGLE, au gyroscope seulement. Keko : « afficher le
 * reflet uniquement quand la carte est penchée, pas sur sa position neutre ou
 * proche ». *Un téléphone tenu en main n'est jamais exactement dans sa tenue
 * de départ*, et une bande de lumière qui ne s'éteint jamais cesse d'être un
 * reflet. Rien sous `GYRO_SEUIL_ECLAT`, plein à partir de `GYRO_PLEIN_ECLAT`,
 * en radians de rotation de la carte — l'inclinaison, elle, suit dès le
 * premier degré.
 */
const GYRO_SEUIL_ECLAT = 0.05
const GYRO_PLEIN_ECLAT = 0.16
function PencheAuGyro({
  curseur,
  gyro,
}: {
  curseur: CurseurDeCarte
  gyro: { current: Inclinaison | null }
}): null {
  useFrame(() => {
    if (curseur.tenu) return
    const incl = gyro.current?.lire() ?? null
    if (incl === null) {
      curseur.dessus = false
      return
    }
    const borne = (v: number): number =>
      Math.min(GYRO_BORNE_CARTE, Math.max(-GYRO_BORNE_CARTE, v))
    // rotation.x de la carte = -vy * INCLINAISON ; rotation.y = vx * INCLINAISON.
    const rx = borne(incl.x * GYRO_GAIN_CARTE)
    const ry = borne(-incl.y * GYRO_GAIN_CARTE)
    const angle = Math.hypot(rx, ry)
    const part = (angle - GYRO_SEUIL_ECLAT) / (GYRO_PLEIN_ECLAT - GYRO_SEUIL_ECLAT)
    const t = Math.min(1, Math.max(0, part))
    curseur.eclat = t * t * (3 - 2 * t)
    curseur.dessus = true
    curseur.x = ry / INCLINAISON_REFLET
    curseur.y = -rx / INCLINAISON_REFLET
  })
  return null
}

function tailleDuSachet(largeurVisible: number, hauteurVisible: number): number {
  // EN PORTRAIT C'EST LA LARGEUR QUI BORNE, et 0,42 y laissait le sachet perdu
  // au milieu d'un écran vide : *un objet qu'on doit déchirer au doigt a besoin
  // d'être sous le doigt.* En paysage la hauteur commande de toute façon, donc
  // rien n'y bouge.
  return Math.min(largeurVisible * 0.6, (hauteurVisible * 0.68) / RAPPORT_SACHET)
}

/**
 * LA GRAINE DE LA SESSION, TIREE AU CHARGEMENT. Keko : « on peut randomiser les
 * personnages ? j'ai toujours la meme seed je crois ».
 *
 * *Le tirage etait bien seede, et c'est la BASE qui ne bougeait pas* : elle
 * valait 1 sans parametre, donc le premier paquet de chaque rechargement etait
 * toujours le meme. Le numero, lui, avancait bien a chaque ouverture — **le
 * defaut ne se voyait donc qu'en relancant la page**, et jamais en enchainant
 * les paquets.
 *
 * **`?paquet=43` rejoue toujours un tirage precis**, exactement comme
 * `?seed=42` rejoue une descente : *ce qui a servi a signaler un cas doit
 * rester ouvrable.* Sans parametre, on tire.
 *
 * Deux sources melees, parce qu'elles ne ratent pas les memes cas : l'horloge
 * seule donne des graines voisines quand on recharge vite, le hasard du
 * navigateur seul n'est pas garanti distinct d'un onglet a l'autre.
 *
 * Elle vit au niveau du MODULE et non dans un etat : *une graine qui se
 * retirerait a un rendu changerait le paquet sous les yeux*, et React double
 * les initialiseurs en mode strict.
 */
/**
 * LA CARTE DU BANC `?bonus` : les deux coupes de champagne (U+1F942).
 *
 * *Choisie par Keko*, et c'est un identifiant et non un nom : **le nom est du
 * texte affiche**, qui peut etre retouche — l'identifiant, lui, vient d'Unicode
 * et ne bougera jamais. La regle du tresor, prise ici.
 *
 * Elle est `animable`, ce qui est la seule condition que le banc ne peut pas
 * fabriquer lui-meme.
 */
const BANC_BONUS = '1f942'

const GRAINE = (() => {
  const demandee = new URLSearchParams(location.search).get('paquet')
  if (demandee !== null && demandee !== '' && !Number.isNaN(Number(demandee))) return Number(demandee)
  const tiree = (Date.now() ^ (Math.random() * 2 ** 32)) >>> 0
  // ON LA DIT, sinon un tirage interessant est perdu : il n'y a pas de place a
  // l'ecran pour l'afficher, et `?paquet=<n>` le rejoue a l'identique.
  console.info(`paquet : graine ${tiree} — ?paquet=${tiree} rejoue cette serie`)
  return tiree
})()

/**
 * CE QUE DURE LA MONTEE DU COMPTEUR DE LA DERNIERE CARTE.
 *
 * Il DECELERE en arrivant : *un compteur qui s'arrete net se lit comme une
 * coupure, un compteur qui ralentit se lit comme une arrivee.* C'est le
 * contraste de vitesse du bond des creatures, pris par l'autre bout.
 */
const MONTEE = 1300

/**
 * DE COMBIEN UNE CARTE DE LA PILE SE RANGE DERRIERE SA VOISINE.
 *
 * Elles attendent a taille pleine derriere celle qu'on regarde, donc **deux
 * plans au meme z se battraient pixel par pixel.** Il n'en faut pas plus : *plus
 * aucune ne tourne apres le premier flip*, et un ecart qui tranche l'ordre de
 * deux plans A PLAT suffit — la regle que le flip et le balancement du sachet
 * ont deja coutee, prise ici par son bon bout.
 *
 * **Il se compte depuis celle qu'on regarde**, pas depuis le debut du paquet :
 * la courante est donc toujours a sa place, et les suivantes avancent d'un
 * cheveu quand leur tour approche.
 */
const ECART_PILE = 0.004

/**
 * Le rang d'une teinte dans son echelle. `-1` pour ce qui n'en porte pas.
 *
 * **L'ECHELLE EST CELLE DU MODE**, et il le faut depuis que le mode emoji
 * compte cinq couleurs : *un nom de cran ne suffit pas a retrouver son rang*
 * — `legendaire` est le quatrieme metal et la cinquieme couleur, et les deux
 * tables se recouvrent sur trois noms.
 */
function rangDansLEchelle(rarete: string | undefined, echelle: readonly string[]): number {
  return echelle.indexOf(rarete ?? echelle[0]!)
}

/** La lueur d'une teinte, avec le premier cran pour repli. */
function lueurDans(rang: number, echelle: readonly string[]): string {
  const cran = echelle[Math.max(0, rang)] ?? echelle[0]!
  return AMBIANCE[cran] ?? AMBIANCE[echelle[0]!]!
}

export function Paquet3D(): React.ReactElement {
  const params = new URLSearchParams(location.search)
  /**
   * QUEL CATALOGUE — L'EMOJI PAR DÉFAUT, `&art` les peintures.
   *
   * Tranché par Keko : « on garde le projet emoji qui devient le principal ».
   * *Un mode principal s'ouvre sans paramètre* — c'est la règle qui a fait
   * tomber `?r3f` le jour où le moteur 3D a rattrapé le jeu.
   *
   * **`?paquet&emoji` continue de marcher**, et il le faut : *tous les liens
   * déjà donnés à Keko le portent*, et une adresse qu'on a distribuée ne doit
   * pas cesser de marcher le jour où elle devient inutile.
   */
  const peintures = params.has('art')
  const emojis = !peintures
  /**
   * `?paquet&emoji&peau` AJOUTE LES VARIANTES DE COULEUR DE PEAU.
   *
   * Keko : « il me semblait qu'on aurait plutot 3000+ emoji ». **Oui -- 3 963
   * au lieu de 1 923**, et les 2 040 de plus sont toutes des variantes de peau.
   * *Le banc se regarde a cote du catalogue plutot qu'a sa place*, parce que
   * c'est une decision de design : voir `--peau` dans le pipeline.
   */
  const peau = params.has('peau')
  /**
   * `?paquet&culbute` REND LA CULBUTE, et le développement est le défaut.
   *
   * *Une carte qui se révèle en tournant ne dit rien de ce qu'elle est* : on
   * voit un dos, puis une face, et entre les deux il n'y a que du mouvement.
   * Le développement annonce **le nom avant l'image** — et c'est précisément
   * ce qu'on cherche à l'ouverture d'un paquet, où la question est « qui
   * est-ce ? » et non « est-ce que ça tourne bien ? »
   *
   * La culbute reste ouvrable : *ce qui a servi à choisir doit rester
   * ouvrable, même une fois le choix fait.* Elle garde tout son emploi à
   * l'armurerie, où l'on POSE une pièce — là, il n'y a rien à lire, il y a un
   * geste à voir.
   */
  const culbuter = new URLSearchParams(location.search).has('culbute')
  /**
   * `?paquet&nu` SAUTE LE SACHET et ouvre directement sur les cinq dos.
   *
   * *Ce qui a servi à choisir doit rester ouvrable* — et surtout, juger une
   * carte ne doit pas coûter une déchirure à chaque fois : quand c'est le
   * DESSIN qu'on regarde, le sachet est un péage.
   */
  const nu = new URLSearchParams(location.search).has('nu')
  /**
   * `?bonus` FORCE LA DERNIERE CARTE : les deux coupes de champagne, ANIMEE et
   * sans holo. Demande par Keko, « pour test ».
   *
   * ***L'ANIME NE SE FORCE PAS SEUL : il demande un emoji ANIMABLE.*** On ne
   * peut pas animer ce que Google n'a pas anime — 614 emoji sur 1 923 — donc
   * poser le drapeau sur une carte quelconque ne donnerait qu'un cartouche qui
   * ment. **Le banc ECHANGE donc la derniere carte**, il ne se contente pas de
   * la marquer.
   *
   * *Ce qui se teste doit pouvoir s'ouvrir d'un lien* — et c'est la derniere
   * carte parce que c'est celle qui porte le compteur, donc le moment du
   * paquet.
   */
  const bonusForce = new URLSearchParams(location.search).has('bonus')
  const [catalogue, setCatalogue] = useState<CarteDuMode[] | null>(null)
  const [erreur, setErreur] = useState<string | null>(null)
  /** Le numéro du paquet : il change à chaque ouverture, et il seede le tirage. */
  const [numero, setNumero] = useState(0)
  /**
   * LE PAQUET EST RETOURNÉ, OU IL NE L'EST PAS — un seul drapeau pour cinq
   * cartes.
   *
   * Keko : **« ce serait cool que quand on slide des cartes vers la droite, la
   * carte d'en dessous soit déjà révélée directement de face ; en gros quand on
   * flip la première carte on flippe le paquet, puis on révèle les cartes une
   * par une en slidant »**.
   *
   * ***LE FLIP NE SE JOUE DONC QU'UNE FOIS, ET IL PORTE TOUT LE PAQUET.***
   * Chaque carte avait le sien, donc le geste alternait sans fin entre
   * retourner et passer — *deux gestes pour une carte quand elle n'a qu'une
   * suite possible.* Il n'en reste qu'un : on retourne la pile, puis on défile.
   *
   * **ET CE QU'UNE CARTE DÉCLENCHE NE BOUGE PAS** : l'éclat, la teinte de
   * l'écran et le compteur de la dernière se jouent quand elle ARRIVE au
   * premier plan. *Chaque carte garde son instant* — c'est tout ce qu'un paquet
   * a à vendre, et ce n'est pas le retournement qui le portait.
   */
  const [retourne, setRetourne] = useState(false)
  /**
   * LA PILE EST OUVERTE : les suivantes attendent À TAILLE PLEINE derrière.
   *
   * *Elles ne peuvent pas y être pendant le flip* — **un demi-tour balaie une
   * demi-largeur de profondeur**, donc la carte qui tourne traverserait sa
   * voisine, le défaut que Keko avait lui-même nommé. Elles montent donc à leur
   * taille une fois le demi-tour fini, **exactement derrière celle qu'on
   * regarde** : on ne les voit pas grandir, et quand la première part à droite
   * la suivante est déjà là, de face.
   *
   * *Après ce flip, plus aucune carte ne tourne du défilé* : l'écart en z n'a
   * donc plus qu'à trancher l'ordre de deux plans à plat.
   */
  const [pileOuverte, setPileOuverte] = useState(false)
  /**
   * LE JETON DE CULBUTE, PAR CARTE. `Carte3D` le compare à ce qu'il avait :
   * *c'est un jeton, pas un instant* — l'horloge qui compte est celle de la
   * scène, et seule la scène la connaît.
   */
  const [jetons, setJetons] = useState<Readonly<Record<string, number>>>({})
  const [fenetre, setFenetre] = useState({ l: window.innerWidth, h: window.innerHeight })
  /**
   * LE RANG DE LA PLUS RARE REVELEE — c'est lui qui teinte la scene.
   *
   * *L'ambiance d'un paquet MONTE a mesure qu'on trouve mieux*, donc elle
   * raconte l'ouverture entiere et pas seulement la derniere carte. `-1` tant
   * qu'on n'a rien retourne : la pierre reste nue.
   */
  const [sommet, setSommet] = useState(-1)
  /**
   * L'ECLAT DU REVEAL COURANT. Il porte une CLE, parce que c'est elle qui le
   * remonte a neuf : *une classe qu'on retire et qu'on repose ne redemarre pas
   * une animation sans un reflow force* — la regle du gonflement des tas.
   */
  const [eclat, setEclat] = useState<{ readonly cle: number; readonly ton: string } | null>(null)
  /** Vrai pendant que le compteur de la derniere carte defile. */
  const [monte, setMonte] = useState(false)
  /** Le sachet est parti : c'est ce qui met les cartes en rangée. */
  const [ouvert, setOuvert] = useState(nu)
  /**
   * ET SA BANDE AUSSI : elle tombe en plume après que le film est descendu,
   * donc le sachet reste monté — hors cadre, inerte — le temps qu'elle sorte.
   * *Le démonter sur `ouvert` la couperait en plein vol.*
   */
  const [parti, setParti] = useState(nu)
  /** Il brûle : la tape est passée, et il n'y a plus à y revenir. */
  const [brule, setBrule] = useState(false)
  /**
   * QUELLE CARTE EST SOUS LES YEUX, et si le défilé est terminé.
   *
   * Keko : « je voudrais qu'on ait une ouverture de booster plus proche de
   * celle de lexicodex (une carte à la fois) ».
   *
   * ***CE QUE ÇA CHANGE N'EST PAS LA MISE EN PAGE, C'EST LE TEMPS.*** Cinq
   * cartes posées côte à côte se révèlent dans l'ordre qu'on veut, et aucune
   * n'a de moment à elle : on les retourne en les tapant, et la cinquième
   * arrive pendant qu'on regarde encore la troisième. **Une à la fois, chacune
   * a son instant** — et c'est tout ce qu'un paquet a à vendre.
   *
   * `montree` est l'index dans `paquet`, `fini` dit qu'on est passé au bilan.
   */
  const [montree, setMontree] = useState(0)

  /**
   * LE CURSEUR DE LA CARTE REGARDÉE, tenu par l'ÉCRAN.
   *
   * *Les cartes du défilé sont inertes* — tout passe par le geste de
   * l'écran — donc aucun évènement de pointeur ne les atteint, et
   * `reflet={vue}` était branché sur une carte qui ne pouvait rien entendre.
   * Keko : « les cartes ne bougent plus quand je hover / maintiens le tap ».
   *
   * C'est donc l'écran qui suit le pointeur, EN PIXELS, comme le sachet le
   * fait pour son survol (`viseDepuis`) : la carte du défilé est au centre de
   * l'écran, à une taille connue, donc sa boîte se calcule et le point se
   * ramène en demi-largeurs de carte. À la souris elle s'incline au SURVOL ;
   * au doigt, TANT QU'IL EST POSÉ — et un doigt posé qui se lève est une tape
   * ou un balayage, ce qui ne change rien au geste. Le gyroscope prend le
   * relais quand rien ne la tient : voir `PencheAuGyro`.
   */
  const curseurDefile = useRef<CurseurDeCarte>({ dessus: false, x: 0, y: 0, tenu: false })
  const refBoite = useRef<{ cx: number; cy: number; l: number; h: number } | null>(null)
  const gyro = useRef<Inclinaison | null>(null)
  useEffect(() => {
    if (SANS_GYRO) return
    // LE ZÉRO EST LA TENUE DU MOMENT OÙ LE PAQUET APPARAÎT — et c'est LE
    // capteur du paquet, prêté au sachet : voir `Sachet3D.gyro`.
    gyro.current = suivreLInclinaison()
    return () => {
      gyro.current?.arreter()
      gyro.current = null
    }
  }, [])
  const [fini, setFini] = useState(false)
  /** La clé du flash de l'arrachement — *une animation se remonte à neuf.* */
  const [flash, setFlash] = useState(0)
  const racine = useRef<HTMLDivElement>(null)
  const refChiffre = useRef<HTMLParagraphElement>(null)
  const image = useRef(0)

  useEffect(() => {
    let vivant = true
    const charger = emojis
      ? chargerEmojis(peau ? 'emoji-peau' : 'emoji')
      : chargerPeintures()
    void charger.then((cartes: CarteDuMode[]) => {
      if (!vivant) return
      if (cartes.length === 0) setErreur('Catalogue vide ou introuvable.')
      else setCatalogue(cartes)
    })
    return () => {
      vivant = false
    }
  }, [emojis, peau])

  useEffect(() => {
    const suivre = () => setFenetre({ l: window.innerWidth, h: window.innerHeight })
    window.addEventListener('resize', suivre)
    window.addEventListener('orientationchange', suivre)
    return () => {
      window.removeEventListener('resize', suivre)
      window.removeEventListener('orientationchange', suivre)
    }
  }, [])

  // UNE BOUCLE D'ANIMATION SE COUPE AU DEMONTAGE, sinon elle ecrit dans un
  // noeud qui n'existe plus — et React ne dit rien, il laisse faire.
  useEffect(() => () => cancelAnimationFrame(image.current), [])

  /**
   * L'ECHELLE DE RARETE DU MODE — cinq couleurs pour les emoji, quatre metaux
   * pour les trois autres. Tranche par Keko : « le mode emoji seulement ».
   *
   * **ELLE SE WIDENISE EN `Echelle<string>`, et c'est le seul endroit du
   * projet ou il le faut** : le mode se decide a l'EXECUTION, sur un parametre
   * d'URL, donc le type du cran ne peut pas etre connu a la compilation. *Les
   * deux tables, elles, restent typees chacune sur ses propres crans* — c'est
   * la qu'une faute se verrait.
   */
  const echelle: Echelle<string> = emojis ? ECHELLE_CINQ : ECHELLE_QUATRE
  /** Les teintes du cadre, dans l'ordre : c'est elle que le reveal remonte. */
  const teintes: readonly string[] = emojis ? ECHELLE_COULEUR : ECHELLE_METAL

  // Le catalogue rangé par cran, une fois pour toutes : un écran qui ouvre dix
  // paquets ne doit pas reparcourir trois mille cartes dix fois.
  const tas = useMemo(
    () => (catalogue === null ? null : parCran(catalogue, echelle)),
    [catalogue, echelle],
  )

  /**
   * LE PAQUET COURANT. Seedé sur son numéro, donc **rejouable** : Keko peut
   * signaler un tirage précis, exactement comme `?seed=42` rejoue une descente.
   */
  const tirage = useMemo((): { cartes: CarteDuMode[]; bonus: Readonly<Record<string, Bonus>> } => {
    if (tas === null) return { cartes: [], bonus: {} }
    const rng = createRng((GRAINE + numero * 7919) >>> 0)
    const cartes = ouvrirPaquet(tas, rng, echelle)
    /**
     * LES BONUS SE TIRENT ICI, APRES LES CARTES ET AVEC LE MEME RNG.
     *
     * Tranche par Keko : « tires a l'ouverture » plutot que « propriete de la
     * carte ». ***Ca change ce qu'est un exemplaire*** : deux copies du meme
     * emoji peuvent differer, et c'est exactement ce qui fait l'interet d'en
     * ouvrir un de plus.
     *
     * **Ils ne concernent que le mode emoji**, parce que c'est la portee que
     * Keko a donnee a tout le changement. *Les autres modes n'appellent donc
     * pas le hasard*, et leur suite de tirage ne bouge pas d'un cran.
     */
    const bonus: Record<string, Bonus> = {}
    if (emojis) {
      for (const c of cartes) {
        bonus[c.id] = tirerBonus('animable' in c && c.animable, () => rng.next())
      }
    }
    // LE BANC PASSE APRES LE TIRAGE, jamais a sa place : *la suite du hasard ne
    // bouge pas*, donc `?paquet=42&bonus` rend le meme paquet que `?paquet=42`
    // a sa derniere carte pres.
    //
    // ON CHERCHE DANS TOUT LE CATALOGUE, pas dans le tas du cran qui sortait :
    // la carte est NOMMEE, donc c'est elle qui apporte sa rarete. *Un banc qui
    // montre une autre carte que celle qu'on vient y chercher n'est pas un
    // banc* — le prix est qu'un paquet ouvert avec `?bonus` compte un `rare` de
    // plus ou de moins, et il est connu.
    if (emojis && bonusForce && cartes.length > 0) {
      const voulue = [...tas.values()].flat().find((c) => c.id === BANC_BONUS)
      if (voulue !== undefined) cartes[cartes.length - 1] = voulue
      bonus[cartes[cartes.length - 1]!.id] = { holo: false, anime: true }
    }
    return { cartes, bonus }
  }, [tas, numero, echelle, emojis, bonusForce])
  const paquet = tirage.cartes

  /**
   * LES CARTES À PEINDRE, MÉMORISÉES — et ce n'est pas une optimisation.
   *
   * **`Carte3D` charge sa texture dans un effet qui dépend de la carte.** Un
   * parent qui la construit à la volée en fabrique une NOUVELLE à chaque
   * rendu : l'effet se relance, `onPeinte` pousse un rendu, et la page GÈLE —
   * sans une seule erreur en console. *C'est le défaut le plus coûteux de tout
   * ce moteur, et il ne dit rien du tout.*
   */
  const aPeindre = useMemo(
    () => paquet.map((c) => carteAPeindreDuMode(c, tirage.bonus[c.id])),
    [paquet, tirage],
  )


  /** Le chiffre de la carte brute : celui dont la rarete DERIVE. */
  function compteurDe(id: string): { valeur: number; unite: string } {
    const brute = paquet.find((c) => c.id === id)
    return brute === undefined ? { valeur: 0, unite: '' } : compteurDuMode(brute, catalogue?.length ?? 0)
  }

  function rangDe(id: string): number {
    return rangDansLEchelle(aPeindre.find((c) => c.id === id)?.rarete, teintes)
  }

  /**
   * LE COMPTEUR DE LA DERNIERE CARTE : il monte vers les vues, et **la couleur
   * REMONTE L'ECHELLE avec lui** pour s'arreter sur le bon barreau.
   *
   * *C'est la seule facon honnete de faire monter la couleur* : notre rarete
   * derive des vues, donc un chiffre qui grimpe et une teinte qui grimpe avec
   * lui disent la meme chose. Une interpolation vers la couleur finale, elle,
   * l'aurait annoncee des la premiere image.
   *
   * **Tout s'ecrit dans le DOM, jamais dans l'etat** : une valeur qui change a
   * chaque image declencherait un rendu par image — et ce rendu reconstruirait
   * cinq cartes a nuanceur. C'est le chemin de `Projeter`, pour la meme raison.
   */
  function monterLeCompteur(id: string): void {
    const cible = compteurDe(id).valeur
    const rangFinal = Math.max(0, rangDe(id))
    const depart = performance.now()
    setMonte(true)
    const pas = (): void => {
      const p = Math.min(1, (performance.now() - depart) / MONTEE)
      // Une deceleration cubique : vive au depart, posee a l'arrivee.
      const avance = 1 - Math.pow(1 - p, 3)
      if (refChiffre.current !== null)
        refChiffre.current.textContent = Math.round(cible * avance).toLocaleString('fr-FR')
      // L'ECHELLE SE REMONTE EN PROPORTION, et elle s'arrete au bon cran :
      // *les couleurs PASSENT dans l'ordre*, elles ne sautent pas a la bonne.
      const rang = Math.min(rangFinal, Math.floor(avance * (rangFinal + 1)))
      racine.current?.style.setProperty('--lueur', lueurDans(rang, teintes))
      racine.current?.style.setProperty('--lueur-force', String(0.1 + avance * 0.5))
      if (p < 1) image.current = requestAnimationFrame(pas)
      else setSommet((h) => Math.max(h, rangFinal))
    }
    image.current = requestAnimationFrame(pas)
  }

  /**
   * CE QU'UNE CARTE DÉCLENCHE EN ARRIVANT AU PREMIER PLAN.
   *
   * *Ce n'est plus sa révélation qui le porte* — le paquet est retourné d'un
   * coup — **mais son INSTANT, qui n'a pas bougé** : l'éclat, la teinte de
   * l'écran, et le compteur quand c'est la dernière.
   */
  function decouvrir(i: number): void {
    const carte = paquet[i]
    if (carte === undefined) return
    setEclat((e) => ({ cle: (e?.cle ?? 0) + 1, ton: lueurDans(rangDe(carte.id), teintes) }))
    // LA DERNIERE SE DIT AU COMPTEUR, les autres d'un coup : *ce qui distingue
    // un moment est qu'il ne se produit qu'une fois.*
    if (i === paquet.length - 1) monterLeCompteur(carte.id)
    else setSommet((h) => Math.max(h, rangDe(carte.id)))
  }

  /**
   * UN SEUL GESTE FAIT TOUT AVANCER : retourner, puis passer à la suivante.
   *
   * **C'est le geste de lexicodex, et c'est ce qui le rend lisible** : on ne
   * demande jamais au joueur de choisir entre deux actions, on lui demande de
   * continuer. *Une carte qu'on vient de retourner n'a qu'une suite possible.*
   *
   * **ET IL S'ARRÊTE AU BILAN**, où le bouton reprend la main : *un geste qui
   * continue de répondre quand il n'y a plus rien à avancer ne dit plus où
   * l'on en est.*
   */
  function avancer(): void {
    if (!ouvert || fini || paquet.length === 0) return
    // LE PREMIER GESTE RETOURNE LE PAQUET, les suivants le défilent. *Le flip
    // ne porte donc que la première carte* — les autres sont déjà de face
    // quand leur tour vient, et il n'y a plus rien à retourner.
    if (!retourne) {
      const premiere = paquet[0]
      if (premiere === undefined) return
      setRetourne(true)
      setJetons((j) => ({ ...j, [premiere.id]: (j[premiere.id] ?? 0) + 1 }))
      decouvrir(0)
      return
    }
    if (montree + 1 < paquet.length) {
      setMontree(montree + 1)
      decouvrir(montree + 1)
    } else setFini(true)
  }

  /**
   * LA PILE S'OUVRE QUAND LE DEMI-TOUR EST FINI, pas avant. *Une carte qui
   * tourne traverse ce qui est posé derrière elle*, donc les suivantes
   * attendent à taille nulle le temps du flip.
   */
  useEffect(() => {
    if (!retourne) return
    const t = setTimeout(() => setPileOuverte(true), DUREE_FLIP * 1000)
    return () => clearTimeout(t)
  }, [retourne])

  function ouvrirUnAutre(): void {
    cancelAnimationFrame(image.current)
    setOuvert(nu)
    setParti(nu)
    setBrule(false)
    setRetourne(false)
    setPileOuverte(false)
    setMontree(0)
    setFini(false)
    setSommet(-1)
    setEclat(null)
    setMonte(false)
    racine.current?.style.removeProperty('--lueur')
    racine.current?.style.removeProperty('--lueur-force')
    setNumero((n) => n + 1)
  }

  /**
   * LE GESTE DU DÉFILÉ — **une tape OU un balayage horizontal.**
   *
   * *Lexicodex ne connaît que le balayage* : vérifié à la main, une tape et un
   * double-tap n'y font rien. **On garde les deux**, et c'est une règle du
   * projet, pas un confort : « sur téléphone le glisser seul est fragile, la
   * tape doit toujours marcher — c'est elle qui porte la fonctionnalité. »
   *
   * **IL EST POSÉ UNE SEULE FOIS ET LIT L'ÉTAT PAR UNE RÉF.** `avancer` est
   * recréée à chaque rendu, donc un écouteur qui la capturerait travaillerait
   * sur un paquet périmé — *c'est le piège des écouteurs retirés par
   * référence*, déjà payé sur la main de combat, et la réf est la réponse que
   * le projet lui a donnée.
   *
   * **ET IL IGNORE CE QUI SUIT UN GESTE DE TROP PRÈS** : le retournement dure
   * deux tiers de seconde, donc deux balayages enchaînés sauteraient la carte
   * qu'on vient de retourner — *on ne révèle pas pour cacher aussitôt.*
   */
  const refAvancer = useRef<() => void>(() => undefined)
  refAvancer.current = avancer
  useEffect(() => {
    const arret = new AbortController()
    const { signal } = arret
    const depart = { x: 0, y: 0 }
    let dernier = 0
    // LA CARTE SOUS LE POINTEUR, en demi-largeurs : voir `curseurDefile`.
    const c = curseurDefile.current
    let doigtPose = false
    const viser = (e: PointerEvent): boolean => {
      const b = refBoite.current
      if (b === null) return false
      c.x = Math.max(-0.5, Math.min(0.5, (e.clientX - b.cx) / b.l))
      c.y = Math.max(-0.5, Math.min(0.5, -(e.clientY - b.cy) / b.h))
      return Math.abs(e.clientX - b.cx) <= b.l / 2 && Math.abs(e.clientY - b.cy) <= b.h / 2
    }
    addEventListener(
      'pointerdown',
      (e) => {
        depart.x = e.clientX
        depart.y = e.clientY
        if (e.pointerType !== 'mouse') {
          // AU DOIGT, C'EST LE MAINTIEN QUI PENCHE : il suit le doigt même
          // sorti de la carte, comme le sachet suit celui qui le déchire.
          doigtPose = true
          viser(e)
          c.dessus = true
          c.tenu = true
          c.eclat = 1
        }
      },
      { signal },
    )
    addEventListener(
      'pointermove',
      (e) => {
        if (e.pointerType === 'mouse') {
          // À LA SOURIS, LE SURVOL : dedans elle s'incline, dehors elle se
          // redresse — le `pointerout` que la carte inerte ne reçoit pas.
          c.dessus = viser(e)
          c.tenu = c.dessus
          c.eclat = 1
        } else if (doigtPose) {
          viser(e)
        }
      },
      { signal },
    )
    const lacher = (e: PointerEvent): void => {
      if (e.pointerType === 'mouse') return
      doigtPose = false
      c.dessus = false
      c.tenu = false
    }
    addEventListener('pointercancel', lacher, { signal })
    addEventListener(
      'pointerup',
      (e) => {
        lacher(e)
        const dx = e.clientX - depart.x
        const dy = e.clientY - depart.y
        const tape = Math.hypot(dx, dy) < 12
        const balaye = Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)
        if (!tape && !balaye) return
        const t = performance.now()
        if (t - dernier < 400) return
        dernier = t
        refAvancer.current()
      },
      { signal },
    )
    return () => arret.abort()
  }, [])

  const hVisible = hauteurVisibleA(Z_MAIN, fenetre.h)
  const lVisible = hVisible * (fenetre.l / fenetre.h)
  const colonnes = colonnesDuBilan(lVisible, hVisible)
  const lignes = Math.ceil(CARTES_PAR_PAQUET / colonnes)
  const taille = tailleDeLaRangee(lVisible, hVisible, colonnes, lignes)
  const pas = taille * 1.12
  const y = hVisible * 0.06
  /**
   * LA PLACE D'UNE CARTE AU BILAN — **et chaque ligne se centre sur SON
   * compte.** La dernière en porte deux quand les autres en portent trois :
   * calées sur la grille, elles se seraient collées à gauche, et *un trou au
   * bout d'une rangée se lit comme une case qu'on a oublié de remplir.*
   */
  function placeAuBilan(i: number): [number, number, number] {
    const colonne = i % colonnes
    const ligne = Math.floor(i / colonnes)
    const surCetteLigne = Math.min(colonnes, CARTES_PAR_PAQUET - ligne * colonnes)
    const hauteurTotale = lignes * 1.4 + (lignes - 1) * 0.17
    return [
      (colonne - (surCetteLigne - 1) / 2) * pas,
      y + (hauteurTotale / 2 - 0.7 - ligne * 1.57) * taille,
      Z_MAIN,
    ]
  }
  /**
   * OÙ VA UNE CARTE, selon qu'elle est passée, à l'écran, ou encore dessous.
   *
   * ***LES SUIVANTES SONT À TAILLE ZÉRO, ET C'EST CE QUI A RATÉ LE FLIP.***
   * Elles étaient posées exactement derrière la carte qu'on regarde, à la même
   * taille — invisibles tant que celle de devant est à plat. **Mais un flip
   * n'est à plat qu'à ses deux bouts** : dès que la carte se met de biais, elle
   * découvre sa voisine, qui ne tourne pas. Keko : « on dirait que seule la
   * partie droite de la carte flip, c'est super bizarre » — *ce qu'il voyait
   * n'était pas une carte coupée en deux, c'était DEUX cartes*, l'une qui
   * tourne et l'autre immobile derrière.
   *
   * *Une carte de taille nulle ne cache rien et ne se découvre pas*, et sa
   * texture reste chargée : **elle est là, elle n'est simplement pas encore
   * sortie.** Quand elle devient la courante, `Carte3D` amortit sa taille et
   * elle grandit depuis rien — il n'y a aucune animation à écrire.
   *
   * **Et celles qu'on a vues sortent par la DROITE**, assez loin pour quitter
   * le champ : *ce qui est passé n'a plus à être lu*, et le bilan les reprendra
   * toutes à la fin. Le côté est de Keko — « quand on passe à la suivante je
   * voudrais qu'on slide l'ancienne carte vers la droite » — et *c'est le sens
   * d'une pile qu'on défausse de la main droite*, pas celui d'une page qu'on
   * tourne.
   */
  function placeAuDefile(i: number): [number, number, number] {
    if (i < montree) return [lVisible * 1.1, 0, zDefile]
    // LES SUIVANTES SE RANGENT D'UN CHEVEU DERRIÈRE, et c'est tout ce qu'il
    // faut : *elles ne tournent plus*, donc un écart qui tranche l'ordre de
    // deux plans à plat suffit. À taille nulle la question ne se posait pas ;
    // à taille pleine, deux plans au même z se battent pixel par pixel.
    return [0, 0, zDefile - (i - montree) * ECART_PILE]
  }

  /**
   * CE QU'UNE CARTE MESURE AU DÉFILÉ : sa taille dès que la pile est ouverte.
   *
   * *Elles sont toutes à la même place et à la même taille*, donc invisibles
   * sous celle qu'on regarde — **et c'est ce qui fait que la suivante est déjà
   * là, de face, quand la première part à droite.** Le temps du flip, elles
   * restent à zéro : une carte de taille nulle ne se fait pas traverser.
   *
   * **ELLE N'EST APPELÉE QU'UNE FOIS LE SACHET PARTI** — tant qu'il est là, la
   * carte vaut la poche — donc c'est bien la taille d'APRÈS qu'elle rend, et le
   * rapprochement n'est rien d'autre que le passage de l'une à l'autre.
   */
  function tailleAuDefile(i: number): number {
    return i <= montree || pileOuverte ? tailleDuDefile : 0
  }
  /** La largeur du sachet : c'est elle qui place la fente et borne ce qui en sort. */
  const lSachet = tailleDuSachet(lVisible, hVisible)
  const hSachet = lSachet * RAPPORT_SACHET
  /**
   * LA PROFONDEUR DU DÉFILÉ : derrière le pire recul du sachet.
   *
   * Keko : « sur PC, quand je laisse le paquet bouger seul, on voit parfois un
   * coin de dos de carte traverser le booster. » Le sachet se balance, donc son
   * coin bas s'enfonce de `RECUL_DU_BAS` — *une rotation est une translation
   * déguisée en profondeur*, la règle déjà payée sur le flip.
   *
   * ***ET LA CARTE Y RESTE TANT QUE LE FILM EST LÀ.*** C'est ce qui lui permet
   * de ne pas bouger d'un pixel pendant qu'il descend : *un pas en z vaut de la
   * taille apparente*, donc la ramener devant pendant la descente serait
   * exactement le « elle se fait grossir » qu'on retire. **Une fois le film
   * parti, elle reprend le plan de la main** (`zDefile`) — il n'y a plus rien à
   * couvrir. **Le sachet, lui, ne bouge pas** — on ne déplace pas ce que Keko a
   * validé.
   */
  const Z_DEDANS = Z_MAIN - lSachet * RECUL_DU_BAS
  /**
   * LA CARTE DU DÉFILÉ EST LA CARTE DE LA POCHE, au pixel.
   *
   * Keko : **« il faut que la carte soit à la même taille et position que le
   * relief à l'intérieur du booster, là elle apparaît petite et se fait
   * grossir ; il faudrait que le booster glisse et révèle la carte »**.
   *
   * ***UNE CARTE QUI NE BOUGE PAS NE PEUT PAS GROSSIR, ET C'EST TOUT CE QU'IL
   * Y AVAIT À FAIRE.*** Elle attendait à une taille à elle (`min(taille,
   * 0,6 sachet)`) et c'est `Carte3D` qui l'amenait à sa taille de défilé —
   * *l'amortissement était la bonne porte quand la carte MONTAIT par la fente,
   * et il raconte le contraire depuis que c'est le film qui s'en va.*
   *
   * **LA POCHE EST LA SEULE TAILLE QU'UNE CARTE PUISSE AVOIR ICI** : c'est la
   * boîte sur laquelle le ventre du sachet se bombe, donc le relief qu'on voit
   * à travers le film EST le bord de cette carte. *Elle ne se choisit pas, elle
   * se lit* (`POCHE`), et une retouche de la poche l'emmène avec elle.
   *
   * **ET ELLE SE CORRIGE DE LA PROFONDEUR**, parce que la carte attend DERRIÈRE
   * le sachet : à taille de monde égale, un objet plus loin paraît plus petit —
   * donc elle est plus large d'autant que le champ est plus large là où elle
   * est. *Sans ce terme, la carte rentrerait de 5 % dans le relief.*
   */
  const grande =
    lSachet *
    (POCHE.demiX * 2) *
    (hauteurVisibleA(Z_DEDANS, fenetre.h) / hVisible)
  /**
   * ET UNE FOIS LE FILM PARTI, ELLE SE RAPPROCHE.
   *
   * Keko : **« une fois le paquet descendu et le dos de carte visible, je pense
   * qu'on peut le zoomer à la taille d'avant, un peu comme si on se
   * rapprochait »**.
   *
   * ***LA POCHE EST UNE TAILLE D'ATTENTE, PLUS UNE TAILLE DE DÉFILÉ.*** Elle
   * reste ce qu'elle doit être tant que le sachet est là — *le relief qu'on
   * voit bomber à travers le film EST le bord de cette carte*, donc le film
   * glisse et découvre exactement ce qu'il laissait deviner. **Ce que la
   * correction d'avant interdisait n'était pas de grossir, c'était de grossir
   * PENDANT que le film descend** : on retirait alors la pochette et ce qu'il y
   * avait dedans enflait, ce qui raconte le contraire du geste.
   *
   * **Ici le film n'est plus là** (`ouvert` ne tombe qu'à la fin de sa
   * descente), donc plus rien ne contredit le mouvement : *une carte qui
   * grossit seule à l'écran se lit comme une carte dont on s'approche.*
   *
   * **ET C'EST LA TAILLE D'AVANT, au chiffre près** : la largeur plafonnée à
   * 78 %, et la hauteur à 58 % **pour que la culbute tienne dans le cadre** —
   * elle s'approche de la caméra et enfle de moitié, donc sans ce plafond elle
   * sortait par le haut et par le bas en paysage. *Un plafond posé pour une
   * orientation se mesure dans l'autre* : en portrait c'est la largeur qui
   * commande, donc il n'y coûte rien.
   */
  const tailleDuDefile = Math.min(lVisible * 0.78, (hVisible * 0.58) / 1.4)
  // LA BOÎTE DE LA CARTE DU DÉFILÉ À L'ÉCRAN, en pixels, pour `curseurDefile` :
  // elle est au centre, à `Z_MAIN`, et `hVisible` dit ce que vaut une unité de
  // monde en pixels à cette profondeur. *Une ref, parce que l'écouteur est
  // posé une fois et doit lire la boîte du moment.*
  const pxParUnite = fenetre.h / hVisible
  refBoite.current = {
    cx: fenetre.l / 2,
    cy: fenetre.h / 2,
    l: tailleDuDefile * pxParUnite,
    h: tailleDuDefile * 1.4 * pxParUnite,
  }
  /**
   * ET ELLE AVANCE AVEC, puisqu'il n'y a plus rien à couvrir.
   *
   * `Z_DEDANS` protège d'un sachet qui se balance ; **le sachet parti, la carte
   * reprend le plan de la main.** Le pas est minuscule — 1,4 % de taille
   * apparente — donc *ce n'est pas lui qui fait le rapprochement*, c'est la
   * taille ; il retire seulement une correction de profondeur qui n'a plus
   * d'objet.
   */
  const zDefile = ouvert ? Z_MAIN : Z_DEDANS
  /**
   * LA DERNIERE CARTE, des qu'elle arrive au premier plan. *Elle ne s'annonce
   * que s'il y en a eu d'autres avant* : sur un paquet d'une seule carte, « la
   * derniere » ne dirait rien.
   *
   * **ELLE ARRIVE DEJA DE FACE depuis que le paquet se retourne d'un coup**,
   * donc le mot et le compteur se disent au meme instant plutot qu'en deux
   * temps. *C'est le prix du geste unique*, et il est connu.
   */
  const derniere =
    !fini && paquet.length > 1 && montree === paquet.length - 1 ? (paquet[montree] ?? null) : null

  /**
   * L'UNITE DU COMPTEUR est une propriete du MODE, pas d'une carte : on la lit
   * sur la premiere du paquet, qui existe toujours. *La lire sur `derniere`
   * la ferait disparaitre au bilan*, ou elle retombe a `null` pendant que le
   * compteur est encore a l'ecran.
   */
  const unite = paquet.length > 0 ? compteurDuMode(paquet[0]!, catalogue?.length ?? 0).unite : ''

  return (
    <div
      className="paquet-3d"
      ref={racine}
      style={
        {
          '--lueur': lueurDans(sommet, teintes),
          '--lueur-force': sommet < 0 ? 0 : 0.18 + sommet * 0.1,
        } as React.CSSProperties
      }
    >
      <div className="paquet-fond" />
      <div className="paquet-lueur" />
      {eclat !== null && (
        <div
          key={eclat.cle}
          className="paquet-eclat"
          style={{ '--lueur': eclat.ton } as React.CSSProperties}
        />
      )}
      {/*
        LE FLASH DE L'ARRACHEMENT : un blanc plein écran, très court. *C'est
        ce qui fait que la bande ne se « détache » pas, elle s'ARRACHE* — un
        geste qui coûte quelque chose aveugle une image. Il est monté à neuf
        par sa clé, pour la raison habituelle : une classe qu'on retire et
        qu'on repose ne redémarre pas sans un reflow forcé.
      */}
      {flash > 0 && <div key={`fl${flash}`} className="paquet-flash" />}
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ position: [0, 0, zCamera(fenetre.h)], fov: FOV }}
        gl={{ toneMapping: NoToneMapping }}
        style={{ position: 'fixed', inset: 0 }}
      >
        <Cadrage />
        <Horloge />
        <PencheAuGyro curseur={curseurDefile.current} gyro={gyro} />
        <ambientLight intensity={0.55} />
        <directionalLight
          position={[2.5, 3.5, 4]}
          intensity={2.2}
          castShadow
          shadow-mapSize={[1024, 1024]}
          shadow-bias={-0.0008}
          shadow-normalBias={0.02}
        />
        <directionalLight position={[-4, 1, 2]} intensity={0.9} color="#8fb4ff" />

        {/*
          LE SACHET TIENT LA SCÈNE SEUL, et il n'y a rien d'autre à l'écran :
          *un paquet fermé ne montre pas ce qu'il contient.* Il est MONTÉ À
          NEUF à chaque ouverture (clé), parce que son horloge et son « c'est
          fini » vivent dans des refs — et une ref ne se remet pas à zéro parce
          qu'une prop a changé.
        */}
        {!parti && paquet.length > 0 && (
          <Sachet3D
            key={numero}
            gyro={gyro}
            taille={lSachet}
            position={[0, 0, Z_MAIN]}
            // CE QU'IL FAUT POUR QU'IL QUITTE LE CADRE : la demi-hauteur du
            // champ plus la sienne. *Le sachet ne connait pas le champ
            // visible*, donc c'est l'ecran qui la lui donne -- la regle du Z
            // qui se calcule.
            descente={hVisible / 2 + hSachet / 2}
            ouvre={brule}
            onOuvrir={() => setBrule(true)}
            // L'ARRACHEMENT : le flash, et rien d'autre. *La carte ne bouge
            // plus* — c'est le film qui descend et la découvre, donc il n'y a
            // plus ni émergence à déclencher ni image à attendre.
            onDechire={() => setFlash((f) => f + 1)}
            onOuvert={() => setOuvert(true)}
            onParti={() => setParti(true)}
            // LA MOITIÉ DU FEU D'ARTIFICE PREND LA COULEUR DE LA CARTE LA PLUS
            // RARE DU PAQUET — Keko. *C'est l'« omen » de lexicodex* : leurs
            // étincelles de rupture prennent la couleur de la meilleure rareté.
            // La lueur d'AMBIANCE et non le ton du cadre : *un pigment ne
            // survit pas à la diffusion*, et une étincelle est de la lumière.
            lueurRare={lueurDans(
              paquet.reduce((h, c) => Math.max(h, rangDe(c.id)), -1),
              teintes,
            )}
          />
        )}

        {/*
          ELLES SONT LÀ DÈS LE DÉBUT, CACHÉES DANS LE SACHET.

          Keko : **« lors de l'explosion finale à l'ouverture y'a comme un
          freeze de l'écran »** — mesuré, **224 ms** d'image gelée au moment
          exact de l'arrachement, et *la gerbe n'y était pour rien* : la même
          mesure sur la version d'avant en donnait 169.

          ***LA MOITIÉ EST UN `getProgramInfoLog`*** — 106 ms, relevés en
          chronométrant les 226 méthodes du contexte WebGL. C'est l'appel par
          lequel three vérifie qu'un programme a bien été lié, et **il BLOQUE
          jusqu'à la fin de la compilation**, que le pilote mènerait autrement
          en parallèle. Le reste est la peinture des cinq faces. *Les cinq
          cartes ne se montaient qu'à l'arrachement*, donc tout ce travail
          tombait dans la même image — pile sur le flash, c'est-à-dire au seul
          instant de l'écran où quelque chose bouge vite.

          **Le travail ne se supprime pas, il se DÉPLACE** : elles se montent
          dès le départ, derrière un sachet qui les couvre entièrement, et
          leurs nuanceurs se compilent pendant qu'il se balance — *là où rien
          ne presse.* C'est la règle des deux poses du joueur, préchargées au
          démarrage parce qu'une image qui arrive au moment où on la montre
          arrive trop tard.

          **ET ELLES NE BOUGENT PAS D'UN PIXEL, MÊME EN SORTANT** : c'est le
          film qui descend et les découvre. *Une carte qui n'est pas encore
          sortie est déjà là, elle est simplement cachée* — exactement ce que
          le défilé fait déjà des suivantes, à taille zéro.
        */}
        {aPeindre.map((carte, i) => {
          const vue = retourne
          return (
            <Carte3D
              key={carte.id}
              carte={carte}
              // LE DOS TANT QU'ELLE N'EST PAS RETOURNÉE : c'est la même carte
              // vue de l'autre côté, pas un second objet.
              dos={!vue}
              // LE JETON NE SE POSE QUE SUR LA PREMIÈRE CARTE : *le flip
              // retourne le PAQUET*, donc une seule tourne et les quatre
              // autres attendent déjà de face. Les leurs restent à zéro, donc
              // `Carte3D` ne joue rien — et il passe à `undefined` quand la
              // mise en scène ne vaut pas, ce qui rend la prop absente et lui
              // évite de charger le pavé du nom pour rien.
              // LE FLIP AU DÉFILÉ, LE DÉVELOPPEMENT AU BILAN. Keko : « j'aime
              // pas trop l'animation de révélation de carte, un simple flip
              // serait mieux ». *La culbute est une mise en scène
              // d'équipement* — elle monte, grossit et fait deux tours — là où
              // retourner une carte est un geste et rien de plus. Elle reste
              // joignable par `?culbute`, qui était déjà son banc.
              culbute={culbuter ? (jetons[carte.id] ?? 0) : undefined}
              flip={!culbuter && !fini ? (jetons[carte.id] ?? 0) : undefined}
              developpe={culbuter || !fini ? undefined : (jetons[carte.id] ?? 0)}
              // ELLE EST DÉJÀ À SA PLACE DE DÉFILÉ, ET ELLE N'EN BOUGERA
              // PLUS. Keko : « il faut que la carte soit à la même taille et
              // position que le relief à l'intérieur du booster, là elle
              // apparaît petite et se fait grossir ; il faudrait que le booster
              // glisse et révèle la carte ».
              //
              // ***C'EST LA POCHE DU SACHET, ET LA POCHE EST CENTRÉE SUR LUI***
              // (`POCHE.centreY` vaut 0,5) — donc la carte attend au centre du
              // film, à la taille du relief qu'on voit bomber à travers. **La
              // place avant et la place après sont le MÊME point**, et il n'y a
              // donc rien à animer : le film descend, la carte était déjà là.
              //
              // ELLE EST DERRIÈRE LE PIRE RECUL DU SACHET (`Z_DEDANS`) TANT
              // QU'IL EST LÀ : *le film descend DEVANT elle*, donc le recul la
              // couvre aussi longtemps qu'il passe. **Elle reprend le plan de la
              // main une fois qu'il a quitté le cadre**, en même temps qu'elle
              // grossit — c'est le rapprochement que Keko a demandé, et il ne
              // peut avoir lieu qu'une fois le film parti.
              position={fini ? placeAuBilan(i) : placeAuDefile(i)}
              // LES CINQ SONT À LA TAILLE DE LA POCHE TANT QUE LE SACHET EST
              // LÀ, superposées — *ce qui est exactement ce qu'elles sont : une
              // pile qu'on tire* — et c'est ce qui fait compiler leurs cinq
              // nuanceurs pendant qu'il se balance. **Le film parti, elles
              // passent à la taille du défilé** : c'est le rapprochement.
              // **Elles retombent à zéro le temps d'un demi-tour**, pour que la
              // première tourne sans les traverser, puis la pile se rouvre : la
              // suivante est alors DÉJÀ là, de face, derrière celle qu'on
              // regarde.
              taille={!ouvert ? grande : fini ? taille : tailleAuDefile(i)}
              // ON PEINT UNE FOIS, À LA PLUS GRANDE TAILLE QU'ELLE ATTEINDRA.
              // Sans ça, les quatre suivantes — qui attendent à taille ZÉRO —
              // peignent sur la plus petite toile du jeu puis repeignent en
              // grand dès que leur tour vient, et la cinquième change de
              // palier en sortant du sachet. **Cinq repeintures dans la même
              // image font un gel** : mesuré, 84 ms à l'instant où le sachet
              // s'efface. *Le défilé est le plus grand des deux, sauf sur un
              // écran très haut où le bilan tient sur une ligne.*
              tailleTexture={Math.max(grande, tailleDuDefile, taille)}
              // ELLE RÉPOND AU CURSEUR DÈS LE DOS. *Un dos n'a rien à montrer*,
              // disait la note — mais il a une matière à faire jouer, et c'est
              // ce que Keko a demandé : « il faudrait que ça marche pour le
              // dos de carte au début aussi ».
              reflet
              // LA PASSÉE S'EN VA MOINS VITE, ET UN PEU DE TRAVERS. Keko :
              // « baisser un peu la vitesse à laquelle la carte est déplacée
              // vers la droite quand on dévoile les cartes, et donner un léger
              // angle de rotation ». *C'est le geste d'une pile qu'on défausse
              // de la main droite* : une carte lâchée tourne un peu en partant.
              // Le ressort ne vaut que pour la sortie — l'approche et le bilan
              // gardent le leur — et l'angle est une cible comme la place,
              // amortie par le même ressort.
              ressort={!fini && i < montree ? RESSORT_SORTIE : undefined}
              rotation={!fini && i < montree ? [0, 0, -ANGLE_SORTIE] : undefined}
              // ET C'EST L'ÉCRAN QUI TIENT SON CURSEUR — pour TOUTE LA PILE,
              // pas pour la seule carte qu'on regarde. Keko : « quand on bouge
              // une carte, elle traverse celle derrière, il faut bouger toute
              // la pile ensemble ». *Une rotation est une translation déguisée
              // en profondeur* : les suivantes sont à ECART_PILE derrière, et
              // une carte seule qui penche les traverse. Le même curseur sur
              // toutes, c'est la règle des piles du coffre — rotations
              // identiques autour de centres alignés, les plans restent
              // parallèles. Voir `curseurDefile`.
              curseurPartage={!fini && i >= montree ? curseurDefile.current : undefined}
              refletAuDoigt={!fini && i >= montree}
              ombre
              // ELLE NE PORTE PLUS DE GESTE À ELLE. *Tout passe par le geste
              // de l'écran* — une tape sur la carte et une tape à côté font la
              // même chose, parce qu'il n'y a qu'une suite possible. Ça retire
              // au passage le cas que l'ancienne version devait écarter : les
              // cinq superposées dans le sachet, dont une tape en retournait
              // une au hasard.
              inerte
            />
          )
        })}

        {/*
          LE BOUTON N'EXISTE QU'AU BILAN. Pendant le défilé il n'y a rien à
          décider — *on continue, c'est tout* — et un bouton posé là
          disputerait le geste à la carte. « Tout révéler » est parti avec :
          il répondait à cinq dos posés côte à côte, et il n'y en a plus.
        */}
        {ouvert && fini && paquet.length > 0 && (
          <Bouton3D
            texte="Ouvrir un autre paquet"
            ton="or"
            cran="ecran"
            position={[0, -hVisible * 0.38, Z_MAIN]}
            onCliquer={ouvrirUnAutre}
          />
        )}
      </Canvas>

      {ouvert && !fini && (derniere !== null || monte) && (
        <div className="paquet-dernier">
          <p className="paquet-dernier__mot">Dernière carte</p>
          {monte && (
            <>
              <p className="paquet-compteur" ref={refChiffre}>
                0
              </p>
              <p className="paquet-compteur__unite">{unite}</p>
            </>
          )}
        </div>
      )}

      {catalogue === null && erreur === null && <p className="paquet-mot">Ouverture du paquet…</p>}
      {erreur !== null && <p className="paquet-mot">{erreur}</p>}
    </div>
  )
}

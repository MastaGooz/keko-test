import { NoToneMapping, type Group } from 'three'
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
import { cloneElement, useEffect, useMemo, useRef, useState, type ReactElement, type ReactNode } from 'react'
import { Decollage, type BoiteALEcran } from './Decollage.tsx'
import type { Exemplaire } from '../logic/emoji/collection.ts'
import { Canvas, useFrame } from '@react-three/fiber'
import { Carte3D, DUREE_FLIP, INCLINAISON_REFLET, type CurseurDeCarte } from './Carte3D.tsx'
import { suivreLInclinaison, type Inclinaison } from './inclinaison.ts'
import { Bouton3D } from './Bouton3D.tsx'
import { EclatDeRevelation } from './EclatDeRevelation.tsx'
import { RECUL_DU_BAS, SANS_GYRO, Sachet3D } from './Sachet3D.tsx'
import { Cadrage, FOV, Z_MAIN, hauteurVisibleA, zCamera } from './Cadrage.tsx'
import { Horloge } from './horloge.tsx'
import { FondAnime } from './FondAnime.tsx'
import { Bloom } from './Bloom.tsx'
import { SON_EQUIPER, SON_POSER, SON_PRENDRE, jouerSon, precharger } from './sons.ts'
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
/**
 * LE RESSORT DU REBOND, bien plus vif que celui de `Carte3D` (9) : Keko,
 * « plus juicy : le zoom plus rapide et un effet un peu caoutchouc qui
 * bounce, avec des petits allers-retours ». *Un caoutchouc est raide* — les
 * allers-retours se jouent en dixièmes de seconde, et un ressort à 9 ne les
 * suivrait pas : il les moyennerait en une bosse molle.
 */
const RESSORT_REBOND = 22
/**
 * LE BILAN SE RANGE VITE. Keko : « accélérer l'apparition des 5 cartes à la
 * fin (positionnement et révélation plus rapide) ». Le ressort par défaut
 * d'une carte (9) mettait une demi-seconde à les poser ; à 18, elles sont en
 * place en un quart.
 */
const RESSORT_BILAN = 18
/** Quand la gerbe de chaque carte du bilan part : une fois les cartes presque posées. */
const DELAI_ECLATS_BILAN = 0.2
/**
 * LE POMPAGE DU BILAN, bien plus fort que celui de la révélation (0,09).
 * Keko : « augmenter fortement le pump des 5 cartes à la fin quand elles se
 * placent ». Il déborde un instant sur l'écart entre deux cartes (12 %) :
 * *elles se bousculent en arrivant*, puis chacune retombe à sa place.
 */
const POMPE_BILAN = 0.24
/**
 * ON NE ZOOME QU'UNE FOIS LES CARTES POSÉES. Keko : « bloquer le zoom tant que
 * les 5 cartes ne sont pas bien positionnées ». À `RESSORT_BILAN`, il reste
 * moins d'un centième du chemin au bout de ce temps.
 */
const DELAI_ZOOM_BILAN = 0.35
/** La part du flip au bout de laquelle la pile s'ouvre et le geste reprend — voir `pileOuverte`. */
const PART_PILE_OUVERTE = 1
/** La distance de sortie en portrait, en largeurs de carte : la référence du ressort. */
const DISTANCE_SORTIE_REF = 1.4
const ANGLE_SORTIE = 0.14
/**
 * DE COMBIEN LA PASSÉE SORT DEVANT LA PILE, en largeurs de carte. *Ça se
 * calcule* : la pile penche au plus de 0,22 rad (la borne du gyroscope, et le
 * curseur plein ne fait que 0,17), donc son bord avance au plus de
 * 0,5 × sin 0,22 ≈ 0,11 largeur ; la passée, qui se redresse, garde encore un
 * peu de son penchant au départ. Un quart de largeur couvre les deux — et
 * elle grossit de sept pour cent en passant : *une carte qu'on jette vient un
 * peu vers soi.*
 */
const SAILLIE_SORTIE = 0.25
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
/**
 * ET IL PENCHE TOUTES LES CARTES QU'ON LUI DONNE : celle du défilé, et les
 * cinq du bilan. *Un curseur tenu n'est pas touché* — c'est le doigt qui
 * commande alors. **Sans lecture, il ne fait rien** : sur un PC sans capteur,
 * c'est le survol de la souris qui tient `dessus`, et le gyroscope n'a pas à
 * le défaire à chaque image.
 */
export function PencheAuGyro({
  curseurs,
  gyro,
}: {
  curseurs: readonly CurseurDeCarte[]
  gyro: { current: Inclinaison | null }
}): null {
  // CE QUI SORT DE LA LISTE SE REDRESSE : un curseur que le gyroscope tenait
  // garderait sinon son dernier penchant pour toujours.
  const tenus = useRef<readonly CurseurDeCarte[]>([])
  useFrame(() => {
    for (const k of tenus.current) if (!curseurs.includes(k) && !k.tenu) k.dessus = false
    tenus.current = curseurs
    const incl = gyro.current?.lire() ?? null
    if (incl === null) return
    const borne = (v: number): number =>
      Math.min(GYRO_BORNE_CARTE, Math.max(-GYRO_BORNE_CARTE, v))
    // rotation.x de la carte = -vy * INCLINAISON ; rotation.y = vx * INCLINAISON.
    const rx = borne(incl.x * GYRO_GAIN_CARTE)
    const ry = borne(-incl.y * GYRO_GAIN_CARTE)
    const angle = Math.hypot(rx, ry)
    const part = (angle - GYRO_SEUIL_ECLAT) / (GYRO_PLEIN_ECLAT - GYRO_SEUIL_ECLAT)
    const t = Math.min(1, Math.max(0, part))
    const eclat = t * t * (3 - 2 * t)
    for (const curseur of curseurs) {
      if (curseur.tenu) continue
      curseur.eclat = eclat
      curseur.dessus = true
      curseur.x = ry / INCLINAISON_REFLET
      curseur.y = -rx / INCLINAISON_REFLET
    }
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
/** La carte du banc `&perso` : 🫠, que Keko a redessiné (`Test.png`). */
const BANC_PERSO = '1fae0'
/** `?bloom=0` : sans le halo des points brillants — voir `Bloom`. */
const SANS_BLOOM =
  typeof location !== 'undefined' && new URLSearchParams(location.search).get('bloom') === '0'
/** `?fond=sombre` : le fond d'avant, sans lumières ni emoji — voir `FondAnime`. */
const FOND_SOMBRE =
  typeof location !== 'undefined' && new URLSearchParams(location.search).get('fond') === 'sombre'

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

/**
 * LA TRANSITION ENTRE DEUX PAQUETS. Keko : « je trouve la transition quand on
 * clique sur ouvrir un nouveau booster manquante, il faudrait quelque chose ».
 * Le clic remettait tout à zéro d'un coup : les cinq cartes disparaissaient et
 * le sachet était déjà là, *sans que rien ne dise d'où il venait.*
 *
 * Deux temps, et chacun dit un geste :
 *
 * - **LA SORTIE** : les cartes du bilan plongent sous l'écran l'une après
 *   l'autre (`cascade`), en se ramassant d'abord d'un cheveu vers le haut
 *   (un « back » à l'entrée) et en tournant chacune de son côté — *on range
 *   la main avant d'en prendre une autre* ;
 * - **L'ARRIVÉE** : le nouveau sachet tombe d'en haut et se pose en
 *   dépassant un peu sa place (un « back » à la sortie), légèrement penché.
 *   **Les cartes qui attendent derrière lui tombent AVEC lui** — elles sont
 *   dans le même groupe —, sinon on les verrait au centre pendant sa chute.
 *
 * Les deux se posent PAR-DESSUS le placement des cartes, dans un groupe
 * parent : *le ressort de chaque carte n'en sait rien*, et ne peut donc pas
 * le manger en croyant corriger un écart.
 *
 * **ET ILS SE CHEVAUCHENT.** Keko : « on peut lancer la descente du booster
 * plus tôt pour que la descente des cartes et l'arrivée du booster soient plus
 * proches ? » Le paquet suivant est tiré DÈS LE CLIC : les cartes qui partent
 * sont une COPIE figée de celles du bilan (`partantes`, les mêmes éléments,
 * donc les mêmes objets montés : leur clé porte le numéro du paquet) qui finit
 * sa chute pendant que le sachet tombe déjà, `retard` après elles.
 */
const SORTIE = { duree: 0.42, cascade: 0.05, recul: 1.2, tour: 0.5 } as const
const ARRIVEE = { duree: 0.6, depassement: 1.5, penche: 0.16, retard: 0.35 } as const
/** Le temps que la dernière carte a quitté l'écran. */
const DUREE_SORTIE = SORTIE.duree + SORTIE.cascade * 4

function Envol({
  sortie,
  rang,
  distance,
  children,
}: {
  readonly sortie: boolean
  readonly rang: number
  readonly distance: number
  readonly children: ReactNode
}): React.JSX.Element {
  const g = useRef<Group>(null)
  const debut = useRef<number | null>(null)
  useFrame(({ clock }) => {
    const o = g.current
    if (o === null) return
    if (!sortie) {
      debut.current = null
      o.position.y = 0
      o.rotation.z = 0
      return
    }
    if (debut.current === null) debut.current = clock.elapsedTime
    const u = Math.min(1, Math.max(0, clock.elapsedTime - debut.current - rang * SORTIE.cascade) / SORTIE.duree)
    // ELLE SE RAMASSE PUIS PLONGE : un « back » à l'entrée.
    const e = (SORTIE.recul + 1) * u * u * u - SORTIE.recul * u * u
    o.position.y = -distance * e
    o.rotation.z = (rang % 2 === 0 ? -1 : 1) * SORTIE.tour * u * u
  })
  return <group ref={g}>{children}</group>
}

function Arrivee({
  distance,
  retard = 0,
  children,
}: {
  readonly distance: number
  /** Combien il attend en haut avant de tomber, en secondes. */
  readonly retard?: number
  readonly children: ReactNode
}): React.JSX.Element {
  const g = useRef<Group>(null)
  const debut = useRef<number | null>(null)
  useFrame(({ clock }) => {
    const o = g.current
    if (o === null) return
    if (debut.current === null) debut.current = clock.elapsedTime
    const u = Math.min(1, Math.max(0, clock.elapsedTime - debut.current - retard) / ARRIVEE.duree)
    // IL SE POSE EN DÉPASSANT SA PLACE : un « back » à la sortie.
    const c = ARRIVEE.depassement
    const e = 1 + (c + 1) * (u - 1) ** 3 + c * (u - 1) ** 2
    o.position.y = distance * (1 - e)
    o.rotation.z = ARRIVEE.penche * (1 - e)
  })
  return <group ref={g}>{children}</group>
}

/**
 * LE SACHET SE PREND D'UNE TAPE AVANT DE SE DÉCHIRER.
 *
 * Keko : « y'a vraiment rien à faire sur tel pour que le son soit actif avant
 * que le joueur tape ? » — non : *un navigateur ne rend le son qu'après un
 * geste*, et au doigt c'est le RELÂCHEMENT qui compte. La déchirure se joue
 * doigt posé, donc le premier sachet d'une session craquait dans le vide.
 * Plutôt qu'un écran « toucher pour commencer », **la tape devient un temps
 * du rituel** (tranché par Keko, « essayons la 2 ») : le sachet attend en
 * retrait, une tape le saisit et l'approche avec un son, et c'est seulement
 * alors qu'on le déchire.
 *
 * Le retrait est un RECUL EN PROFONDEUR (`recul`, en part de la distance à
 * la caméra), pas une échelle : **les cartes qui attendent derrière reculent
 * avec lui** — chacune porte son `Prise` —, et une perspective commune les
 * garde cachées là où une échelle autour de l'origine les aurait déplacées.
 */
const PRISE = { recul: 0.45, duree: 0.42, depassement: 1.6 } as const

function Prise({
  pris,
  distance,
  children,
}: {
  readonly pris: boolean
  /** La distance de la caméra au plan de la main. */
  readonly distance: number
  readonly children: ReactNode
}): React.JSX.Element {
  const g = useRef<Group>(null)
  const debut = useRef<number | null>(null)
  const dejaPris = useRef(pris)
  useFrame(({ clock }) => {
    const o = g.current
    if (o === null) return
    if (!pris) {
      debut.current = null
      o.position.z = -distance * PRISE.recul
      return
    }
    if (dejaPris.current) {
      o.position.z = 0
      return
    }
    if (debut.current === null) debut.current = clock.elapsedTime
    const u = Math.min(1, (clock.elapsedTime - debut.current) / PRISE.duree)
    // IL VIENT À LA MAIN EN DÉPASSANT SA PLACE : un « back » à la sortie.
    const c = PRISE.depassement
    const e = 1 + (c + 1) * (u - 1) ** 3 + c * (u - 1) ** 2
    o.position.z = -distance * PRISE.recul * (1 - e)
  })
  return <group ref={g}>{children}</group>
}

/**
 * LE NUMÉRO DU PAQUET SURVIT AU DÉMONTAGE. *Aller voir sa collection démonte
 * le paquet*, et sans ça on reviendrait au numéro zéro — donc **au même tirage
 * que le premier**, la graine ne bougeant pas de la session. Il n'avance que
 * quand un paquet est OUVERT : revenir sur un sachet qu'on n'a pas déchiré
 * rend le même sachet, *on ne retire pas un paquet en changeant de page.*
 */
let numeroCourant = 0

type PropsPaquet = {
  /** Le paquet est ouvert : ses cartes entrent dans la collection. Une fois par paquet. */
  onPaquetOuvert?: (ids: readonly string[], bonus: Readonly<Record<string, Bonus>>) => void
  /**
   * Rien ne se joue : le sachet attend, ou c'est le bilan. *C'est là, et là
   * seulement, que la barre de navigation se montre* — pendant la déchirure et
   * le défilé, elle disputerait l'écran à la carte.
   */
  onCalme?: (calme: boolean) => void
  /**
   * LE SACHET ARRIVE DÉJÀ PRIS : pas de « Touche le paquet ». Keko : « on peut
   * enlever l'étape "touche le paquet" dans l'ouverture ? Et mettre plutôt une
   * étape globale tout au début de l'app ». ***La prise n'était pas qu'une mise
   * en scène*** : c'est sa tape qui rendait le son à la page sur tactile. *C'est
   * l'écran d'accueil qui la porte désormais* (voir `Jeu`), une fois par
   * session — exactement comme le bouton « Ouvrir un autre paquet » la portait
   * déjà pour le sachet suivant.
   */
  sansPrise?: boolean
  /**
   * IL RESTE UN PAQUET À OUVRIR : sinon le bilan n'offre pas « Ouvrir un autre
   * paquet », et c'est `Jeu` qui dit quand le prochain arrive. Voir `reserve.ts`.
   */
  peutContinuer?: boolean
  /** Le sachet est là et pas encore déchiré : c'est sous lui que `Jeu` dit combien il en reste. */
  onSachetEnAttente?: (attend: boolean) => void
  /**
   * UNE CARTE DU PAQUET EST DÉTRUITE POUR SON STICKER. Keko : « l'option quand
   * on dévoile une carte à l'ouverture de booster de la détruire pour gagner
   * son sticker ». *Sans elle, pas de bouton* : `&art` et `&peau` n'en ont pas.
   */
  onDetruire?: (id: string, ex: Exemplaire) => void
}

export function Paquet3D({
  onPaquetOuvert,
  onCalme,
  sansPrise = false,
  peutContinuer = true,
  onSachetEnAttente,
  onDetruire,
}: PropsPaquet = {}): React.ReactElement {
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
  /** `&holo` : toutes les cartes du paquet sont holographiques, pour juger la feuille. */
  const holoForce = new URLSearchParams(location.search).has('holo')
  /** `&perso` : la première carte est 🫠, peinte depuis l'emoji dessiné par Keko. */
  const persoForce = new URLSearchParams(location.search).has('perso')
  const [catalogue, setCatalogue] = useState<CarteDuMode[] | null>(null)
  const [erreur, setErreur] = useState<string | null>(null)
  /** Le numéro du paquet : il change à chaque ouverture, et il seede le tirage. */
  const [numero, setNumero] = useState(() => numeroCourant)
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
  /**
   * LES GERBES DU BILAN : chaque carte rejaillit à sa place quand elles se
   * rangent — Keko : « ajouter les effets de particules à nouveau sur chaque
   * carte ». Les boîtes sont FIGÉES à l'instant du départ : une boîte
   * recalculée à chaque rendu relancerait la gerbe à chaque survol.
   */
  type Boite = { cx: number; cy: number; l: number; h: number }
  const [eclatsBilan, setEclatsBilan] = useState<{
    readonly cle: number
    readonly gerbes: readonly {
      readonly ton: string
      readonly rang: number
      readonly boite: Boite
      readonly holo: boolean
    }[]
  } | null>(null)
  const refGerbesBilan = useRef<() => { ton: string; rang: number; boite: Boite; holo: boolean }[]>(() => [])
  const [eclat, setEclat] = useState<{
    readonly cle: number
    readonly ton: string
    readonly rang: number
    readonly boite: { cx: number; cy: number; l: number; h: number } | null
    readonly id: string
    readonly holo: boolean
  } | null>(null)
  /** Le sachet est parti : c'est ce qui met les cartes en rangée. */
  const [ouvert, setOuvert] = useState(nu)
  /**
   * LE RAPPROCHEMENT REBONDIT. Keko : « quand on zoome le dos de carte après
   * révélation, on peut le zoomer plus et le dézoomer ensuite pour revenir à
   * la taille actuelle, pour donner un effet bounce un peu juicy ? »
   *
   * *L'amortissement de `Carte3D` est exponentiel, donc il ne dépasse jamais
   * sa cible* : pour qu'il rebondisse, c'est la CIBLE qui dépasse, puis
   * redescend. Le temps de `DUREE_SURSAUT` après le départ du film, la carte
   * vise `1 + SURSAUT` fois sa taille de défilé ; ensuite elle vise la bonne,
   * et le même ressort la ramène. **Deux cibles qui se suivent, aucune
   * animation à écrire** — la mécanique du rapprochement lui-même.
   */
  // LE REBOND EST ÉLASTIQUE, ET C'EST LA CARTE QUI LE JOUE : un jeton change,
  // `Carte3D` oscille autour de sa taille (voir `rebond` et ELASTIQUE). Les
  // cibles par paliers ont vécu un commit — Keko : « l'effet bounce va et
  // vient et est un peu abrupt ». Ici on ne garde que le ressort vif le temps
  // du rapprochement, pour que la carte arrive vite à la taille autour de
  // laquelle elle rebondit.
  const [rebond, setRebond] = useState(0)
  const [rebondit, setRebondit] = useState(false)
  // LES DEUX SONS DU DÉFILÉ SE CHARGENT AVEC LE PAQUET : *un son qui arrive
  // après le geste arrive trop tard.*
  useEffect(() => {
    void precharger(SON_POSER)
    void precharger(SON_PRENDRE)
    void precharger(SON_EQUIPER)
  }, [])
  useEffect(() => {
    if (!ouvert) return
    setRebond((r) => r + 1)
    setRebondit(true)
    // LA CARTE SE POSE EN ZOOMANT : le son de la pose, demandé par Keko — « le
    // son card drop au moment où la carte zoome ». Pas au premier sachet sauté
    // (`nu`) : là rien ne tombe, on arrive déjà posé.
    if (!nu) jouerSon(SON_POSER)
    const fin = window.setTimeout(() => setRebondit(false), 600)
    return () => clearTimeout(fin)
  }, [ouvert])
  /**
   * ET SA BANDE AUSSI : elle tombe en plume après que le film est descendu,
   * donc le sachet reste monté — hors cadre, inerte — le temps qu'elle sorte.
   * *Le démonter sur `ouvert` la couperait en plein vol.*
   */
  const [parti, setParti] = useState(nu)
  /** Il brûle : la tape est passée, et il n'y a plus à y revenir. */
  const [brule, setBrule] = useState(false)
  // LE SACHET EST-IL PRIS ? Voir `Prise`. Sans sachet (`&nu`), il l'est d'office.
  const [pris, setPris] = useState(nu || sansPrise)
  const refPris = useRef(nu || sansPrise)
  refPris.current = pris
  // LE DOIGT S'EST POSÉ SUR LE SACHET : seule une tape QUI A COMMENCÉ SUR LUI
  // le prend. Keko : « y'a marqué touche le paquet mais ça marche même si je
  // touche ailleurs ». *Une invite dit où toucher ; ailleurs, rien.*
  const sachetTouche = useRef(false)
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
   * CHAQUE CARTE QUI APPARAÎT PREND LA TENUE DU MOMENT POUR ZÉRO. Keko :
   * « l'inclinaison d'une carte doit prendre pour position de base
   * l'orientation du téléphone au moment où elle apparaît, pas au moment où le
   * booster ou les cartes précédentes sont apparues ». La première apparaît
   * quand le film est parti (`ouvert`), les suivantes à chaque `montree`.
   */
  useEffect(() => {
    if (ouvert) gyro.current?.recaler()
  }, [ouvert, montree])

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
  /**
   * AU BILAN, CHAQUE CARTE A SON CURSEUR, ET ELLE N'EST PLUS INERTE. Keko :
   * « on peut permettre de bouger les cartes dans l'écran qui met les 5 cartes
   * à la fin (comme on le fait quand elles sont seules ?) et permettre aussi le
   * clic/tap pour zoomer sur une des cartes de cet écran ? »
   *
   * *Cinq cartes côte à côte ne sont plus une pile* : chacune répond pour elle
   * — au survol à la souris, au doigt posé, et au gyroscope quand rien ne la
   * tient. Les curseurs vivent ICI et non dans `Carte3D` parce que c'est
   * l'écran qui sait quand le doigt se lève : *le `pointerout` n'arrive jamais
   * au doigt*, la règle du défilé, et c'est le même `lacher` qui redresse.
   *
   * **UNE TAPE SUR UNE CARTE LA ZOOME AU CENTRE, à la taille du défilé** ; une
   * tape n'importe où la repose. La carte touchée se note au `pointerdown`
   * (`candidat`, par `Carte3D.onPointerDown`) et c'est le `pointerup` de
   * l'écran qui décide — *le même geste que le défilé, lu par le même
   * écouteur.* Le bouton s'efface tant qu'une carte est zoomée : *R3F prévient
   * tous les objets que le rayon traverse*, et une carte posée devant lui ne
   * l'empêcherait pas de répondre.
   */
  const curseursBilan = useRef<CurseurDeCarte[]>(
    Array.from({ length: CARTES_PAR_PAQUET }, () => ({ dessus: false, x: 0, y: 0, tenu: false })),
  )
  const [zoomee, setZoomee] = useState<string | null>(null)
  const refZoomee = useRef<string | null>(null)
  refZoomee.current = zoomee
  const candidat = useRef<string | null>(null)
  const refBoite = useRef<{ cx: number; cy: number; l: number; h: number } | null>(null)
  const gyro = useRef<Inclinaison | null>(null)
  useEffect(() => {
    if (SANS_GYRO) return
    // LE ZÉRO EST LA TENUE DU MOMENT OÙ LE PAQUET APPARAÎT — c'est LE capteur
    // du paquet, prêté au sachet (voir `Sachet3D.gyro`) — PUIS IL SE REPREND À
    // CHAQUE CARTE QUI APPARAÎT, juste en dessous.
    gyro.current = suivreLInclinaison()
    return () => {
      gyro.current?.arreter()
      gyro.current = null
    }
  }, [])
  const [fini, setFini] = useState(false)
  const refFini = useRef(false)
  refFini.current = fini
  /**
   * LE DÉCOLLAGE : la carte qu'on détruit (son index dans le paquet) et où elle
   * est à l'écran ; `cachee` dit que la scène 2D la couvre. Les détruites ne
   * reviennent plus — ni au défilé, ni au bilan.
   */
  const [decollage, setDecollage] = useState<{ i: number; boite: BoiteALEcran } | null>(null)
  const [cachee, setCachee] = useState(false)
  const [detruites, setDetruites] = useState<ReadonlySet<number>>(new Set())
  const refDecollage = useRef(false)
  refDecollage.current = decollage !== null
  /** La clé du flash de l'arrachement — *une animation se remonte à neuf.* */
  const [flash, setFlash] = useState(0)
  const racine = useRef<HTMLDivElement>(null)
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
    // LE BANC DE LA FEUILLE HOLO, posé de la même façon : après le tirage, en
    // gardant l'animé que le tirage ou `&bonus` aurait donné.
    if (emojis && persoForce && cartes.length > 0) {
      const voulue = [...tas.values()].flat().find((c) => c.id === BANC_PERSO)
      if (voulue !== undefined) cartes[0] = voulue
    }
    if (emojis && holoForce) {
      for (const c of cartes) bonus[c.id] = { holo: true, anime: bonus[c.id]?.anime ?? false }
    }
    return { cartes, bonus }
  }, [tas, numero, echelle, emojis, bonusForce, holoForce, persoForce])
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
  const indexZoome = zoomee === null ? -1 : aPeindre.findIndex((c) => c.id === zoomee)


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
    const rangFinal = Math.max(0, rangDe(id))
    const depart = performance.now()
    const pas = (): void => {
      const p = Math.min(1, (performance.now() - depart) / MONTEE)
      // Une deceleration cubique : vive au depart, posee a l'arrivee.
      const avance = 1 - Math.pow(1 - p, 3)
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
    // LA GERBE DE LA RÉVÉLATION part de la boîte de la carte à cet instant :
    // une copie, pour que l'effet ne se relance pas à chaque rendu.
    const boite = refBoite.current === null ? null : { ...refBoite.current }
    const rang = rangDe(carte.id)
    setEclat((e) => ({
      cle: (e?.cle ?? 0) + 1,
      ton: lueurDans(rang, teintes),
      rang: Math.max(0, rang),
      boite,
      id: carte.id,
      holo: tirage.bonus[carte.id]?.holo === true,
    }))
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
      // LE FLIP SONNE COMME LE PASSAGE À LA SUIVANTE : Keko a d'abord fourni
      // un son de flip, puis a préféré « le même son que celui du slide des
      // cartes sur la droite ». *Un seul geste de l'écran, un seul son* — le
      // fichier `card flip.aac` reste au dépôt (SON_RETOURNER).
      // ET LE SON SUIT LA VITESSE DU FLIP : 0,5 s -> 0,38 s, donc 1,3 fois
      // plus vite (Keko : « accélérer un peu la vitesse du flip, et accélérer
      // le son avec »).
      jouerSon(SON_PRENDRE, 1, 0, 0.5 / DUREE_FLIP)
      setRetourne(true)
      setJetons((j) => ({ ...j, [premiere.id]: (j[premiere.id] ?? 0) + 1 }))
      decouvrir(0)
      return
    }
    // ON NE PASSE À LA SUIVANTE QUE SI LA PILE EST OUVERTE. Keko : « quand je
    // spam clic, lorsque la première carte est déplacée sur la droite, celle
    // de derrière apparaît plus petite et se fait zoomer ». *Les suivantes
    // attendent à taille nulle le temps du demi-tour*, et l'anti-rebond du
    // geste (400 ms) est plus court que le flip (DUREE_FLIP) : un second geste
    // pressé révélait une carte qui n'avait pas encore pris sa taille, et on
    // la voyait grandir. **La suivante n'est « déjà là » qu'une fois la pile
    // ouverte** — avant, le geste attend.
    if (!pileOuverte) return
    if (montree + 1 < paquet.length) {
      // LE PASSAGE À LA SUIVANTE SONNE COMME LE ZOOM (la pose) : Keko,
      // « utiliser le son du zoom du paquet pour les slides, sans toucher au
      // son du flip ». *Le flip garde la prise, la suivante prend la pose.*
      jouerSon(SON_POSER)
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
    // ELLE S'OUVRE À MI-FLIP, PLUS À LA FIN. Keko : « permettre de cliquer /
    // défiler plus tôt après le flip, l'attente est un poil longue ». *Une
    // carte qui tourne traverse ce qui est posé derrière elle* — c'était la
    // raison d'attendre — mais la carte qui tourne passe désormais AU PREMIER
    // PLAN le temps du demi-tour (voir `devant`), donc ce qu'elle traverse ne
    // se voit plus, et les suivantes, qui grandissent au ressort depuis zéro,
    // n'ont pris qu'une part de leur taille quand il finit.
    const t = setTimeout(() => setPileOuverte(true), DUREE_FLIP * PART_PILE_OUVERTE * 1000)
    return () => clearTimeout(t)
  }, [retourne])

  // LA SORTIE DES CARTES, PENDANT QUE LE PAQUET SUIVANT ARRIVE : voir `SORTIE`.
  const refCartes = useRef<ReactElement[]>([])
  const [partantes, setPartantes] = useState<ReactElement[]>([])
  const minuteSortie = useRef(0)
  useEffect(() => () => clearTimeout(minuteSortie.current), [])
  function partir(): void {
    setPartantes(refCartes.current.map((e) => cloneElement(e as ReactElement<{ sortie: boolean }>, { sortie: true })))
    clearTimeout(minuteSortie.current)
    minuteSortie.current = window.setTimeout(() => setPartantes([]), DUREE_SORTIE * 1000 + 100)
    ouvrirUnAutre()
  }

  const refBilanPret = useRef(false)
  useEffect(() => {
    refBilanPret.current = false
    if (!fini) return
    const pret = setTimeout(() => {
      refBilanPret.current = true
    }, DELAI_ZOOM_BILAN * 1000)
    const t = setTimeout(
      () => {
        setEclatsBilan((e) => ({ cle: (e?.cle ?? 0) + 1, gerbes: refGerbesBilan.current() }))
        // LE SON DE LA GERBE FINALE DU SACHET, sans le pop — Keko : « jouer le
        // son qu'on joue à l'ouverture finale du paquet au moment où on met
        // les 5 cartes ». *Le même éclat se dit avec le même son.*
        jouerSon(SON_EQUIPER)
      },
      DELAI_ECLATS_BILAN * 1000,
    )
    return () => {
      clearTimeout(t)
      clearTimeout(pret)
    }
  }, [fini])

  function ouvrirUnAutre(): void {
    cancelAnimationFrame(image.current)
    setOuvert(nu)
    setParti(nu)
    setBrule(false)
    // LE PAQUET SUIVANT ARRIVE DÉJÀ PRIS — Keko : « quand on clique sur nouveau
    // paquet on peut aller direct au paquet sans passer par touchez le
    // paquet ? » *Le clic sur le bouton a déjà rendu le son à la page* : la
    // prise n'a plus rien à débloquer, elle ne ferait que retarder.
    setPris(true)
    setRetourne(false)
    setPileOuverte(false)
    setMontree(0)
    setFini(false)
    setZoomee(null)
    setDecollage(null)
    setCachee(false)
    setDetruites(new Set())
    setSommet(-1)
    setEclat(null)
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
          // AU BILAN, LE DOIGT POSÉ PREND LA MAIN SUR LE GYROSCOPE pour les
          // cinq : celle qu'il touche suit le doigt (voir `Carte3D`, qui pose
          // `dessus` sur elle seule), **les autres s'éteignent**. Keko : « quand
          // je bouge une carte, l'effet de lumière est aussi appliqué à toutes
          // les autres ». *Le gyroscope les avait allumées toutes* (`dessus`),
          // et un doigt qui n'en tient qu'une ne doit laisser briller qu'elle.
          for (const k of curseursBilan.current) {
            k.tenu = true
            k.dessus = false
            k.eclat = 1
          }
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
      for (const k of curseursBilan.current) {
        k.dessus = false
        k.tenu = false
      }
    }
    addEventListener('pointercancel', lacher, { signal })
    addEventListener(
      'pointerup',
      (e) => {
        lacher(e)
        // LE DÉCOLLAGE ET SON BOUTON ONT LE DOIGT : la tape n'avance rien.
        if (refDecollage.current) return
        if (e.target instanceof Element && e.target.closest('.decoller') !== null) return
        const dx = e.clientX - depart.x
        const dy = e.clientY - depart.y
        const tape = Math.hypot(dx, dy) < 12
        const balaye = Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)
        // UNE TAPE PREND LE SACHET QUI ATTEND : voir `Prise`. *C'est un
        // relâchement* — le geste qui rend le son à la page.
        if (!refPris.current) {
          const surLeSachet = sachetTouche.current
          sachetTouche.current = false
          if (tape && surLeSachet) {
            setPris(true)
            jouerSon(SON_PRENDRE)
          }
          return
        }
        // AU BILAN, UNE TAPE ZOOME OU REPOSE : voir `curseursBilan`.
        const id = candidat.current
        candidat.current = null
        if (refFini.current) {
          if (!tape || !refBilanPret.current) return
          if (refZoomee.current !== null) setZoomee(null)
          else if (id !== null) {
            setZoomee(id)
            jouerSon(SON_POSER)
          }
          return
        }
        if (!tape && !balaye) return
        const t = performance.now()
        // L'ANTI-REBOND TOMBE À 120 ms. Keko : « permettre de cliquer plus
        // rapidement pour faire défiler plus vite ». Les 400 ms protégeaient la
        // carte qu'on vient de retourner ; *c'est la pile ouverte qui la
        // protège maintenant* (voir `avancer`), et deux cartes qui sortent
        // coup sur coup sortent chacune — il ne reste qu'à écarter un double
        // évènement.
        if (t - dernier < 120) return
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
  // LES DÉTRUITES LAISSENT LEUR PLACE : le bilan se range sur celles qui restent.
  const restantes = aPeindre.map((_, i) => i).filter((i) => !detruites.has(i))
  function placeAuBilan(i: number): [number, number, number] {
    const r = Math.max(0, restantes.indexOf(i))
    const n = restantes.length
    const lignesN = Math.max(1, Math.ceil(n / colonnes))
    const colonne = r % colonnes
    const ligne = Math.floor(r / colonnes)
    const surCetteLigne = Math.min(colonnes, n - ligne * colonnes)
    const hauteurTotale = lignesN * 1.4 + (lignesN - 1) * 0.17
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
    // LA PASSÉE SORT DEVANT LA PILE, d'une saillie qui se compte en largeurs
    // de carte. Keko : « quand la carte est déplacée pour révéler la
    // suivante, elle la traverse ». *Elle partait à la MÊME profondeur que
    // celle qu'elle découvre* : deux plans coplanaires qui glissent l'un sur
    // l'autre se disputent chaque pixel, et dès que la pile penche, l'un
    // coupe l'autre. Elle garde l'inclinaison de la pile (le même curseur,
    // donc des plans parallèles) et passe devant.
    if (i < montree) return [lVisible * 1.1, 0, zDefile + tailleDuDefile * SAILLIE_SORTIE]
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
  // LE SACHET ET SES CARTES TOMBENT DE LA MÊME HAUTEUR, au même instant ; le
  // premier paquet n'attend personne.
  const distanceArrivee = hVisible / 2 + hSachet * 0.7
  const retardArrivee = numero > 0 ? ARRIVEE.retard : 0
  const distancePrise = zCamera(fenetre.h) - Z_MAIN
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
  /**
   * LE RESSORT DE SORTIE SE NORMALISE SUR LA DISTANCE. Keko : « la petite
   * rotation et le ralentissement sont bien sur tel, mais j'ai pas ça sur
   * PC ». *Un ressort rend une FRACTION de la distance par seconde*, et la
   * distance de sortie est une largeur d'écran : 1,4 largeur de carte en
   * portrait, près de 5 en paysage sur un PC — donc la carte y filait quatre
   * fois plus vite en pixels et quittait l'écran en 0,16 s, sans laisser le
   * temps de lire sa rotation. Le ressort se divise par la distance comptée
   * en largeurs de carte, rapportée à celle du portrait : la carte parcourt
   * sa propre largeur dans le même temps partout, et `RESSORT_SORTIE` reste
   * le chiffre validé en portrait.
   */
  const ressortDeSortie =
    RESSORT_SORTIE * Math.min(1, (DISTANCE_SORTIE_REF * tailleDuDefile) / (lVisible * 1.1))
  // LA BOÎTE DE LA CARTE DU DÉFILÉ À L'ÉCRAN, en pixels, pour `curseurDefile` :
  // elle est au centre, à `Z_MAIN`, et `hVisible` dit ce que vaut une unité de
  // monde en pixels à cette profondeur. *Une ref, parce que l'écouteur est
  // posé une fois et doit lire la boîte du moment.*
  const pxParUnite = fenetre.h / hVisible
  refGerbesBilan.current = () =>
    paquet.flatMap((carte, i) => (detruites.has(i) ? [] : [{ carte, i }])).map(({ carte, i }) => {
      const [x, yb] = placeAuBilan(i)
      const rang = Math.max(0, rangDe(carte.id))
      return {
        ton: lueurDans(rang, teintes),
        rang,
        holo: tirage.bonus[carte.id]?.holo === true,
        boite: {
          cx: fenetre.l / 2 + x * pxParUnite,
          cy: fenetre.h / 2 - yb * pxParUnite,
          l: taille * pxParUnite,
          h: taille * 1.4 * pxParUnite,
        },
      }
    })
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

  const cartes = aPeindre.flatMap((carte, i) => {
          // DÉTRUITE : elle n'est plus là. *Couverte par son décollage, elle
          // reste MONTÉE*, seulement invisible : Keko, « quand j'annule, la carte
          // retombe du dessus et dévoile la carte derrière » — démontée, elle
          // rejouait son arrivée en revenant.
          if (detruites.has(i)) return []
          const couverte = cachee && decollage?.i === i
          const vue = retourne
          return [
            <Envol key={`${numero}:${carte.id}`} sortie={false} rang={i} distance={hVisible * 1.25}>
            <Arrivee distance={distanceArrivee} retard={retardArrivee}>
            <Prise pris={pris} distance={distancePrise}>
            <group visible={!couverte}>
            <Carte3D
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
              // ET AU BILAN, LA CARTE ZOOMÉE VIENT AU CENTRE, à la taille du
              // défilé, un peu devant les autres : voir `curseursBilan`.
              position={
                fini
                  ? zoomee === carte.id
                    ? [0, 0, zDefile + tailleDuDefile * SAILLIE_SORTIE]
                    : placeAuBilan(i)
                  : placeAuDefile(i)
              }
              // LES CINQ SONT À LA TAILLE DE LA POCHE TANT QUE LE SACHET EST
              // LÀ, superposées — *ce qui est exactement ce qu'elles sont : une
              // pile qu'on tire* — et c'est ce qui fait compiler leurs cinq
              // nuanceurs pendant qu'il se balance. **Le film parti, elles
              // passent à la taille du défilé** : c'est le rapprochement.
              // **Elles retombent à zéro le temps d'un demi-tour**, pour que la
              // première tourne sans les traverser, puis la pile se rouvre : la
              // suivante est alors DÉJÀ là, de face, derrière celle qu'on
              // regarde.
              taille={
                !ouvert
                  ? grande
                  : fini
                    ? zoomee === carte.id
                      ? tailleDuDefile
                      : taille
                    : tailleAuDefile(i)
              }
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
              ressort={
                !fini && i < montree
                  ? ressortDeSortie
                  : rebondit && !fini
                    ? RESSORT_REBOND
                    : fini
                      ? RESSORT_BILAN
                      : undefined
              }
              // ET ELLE PASSE AU PREMIER PLAN, quelle que soit l'inclinaison :
              // voir `Carte3D.devant`. La saillie reste pour le volume.
              devant={
                fini ? zoomee === carte.id : i < montree || (retourne && !pileOuverte && i === montree)
              }
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
              // LA PASSÉE, ELLE, SE REDRESSE EN SORTANT. Elle a partagé le
              // curseur de la pile le temps d'un commit — *des plans parallèles
              // ne se coupent pas* — et Keko l'a vue passer DESSOUS : deux
              // plans parallèles décalés en x se séparent de Δx·sin θ en
              // profondeur, donc dès que la pile penche vers elle, la saillie ne
              // suffit plus et elle passe derrière. Redressée, son étendue en
              // profondeur est nulle, et celle d'une pile penchée vaut au plus
              // une demi-largeur fois sin θ : une saillie plus grande que ça la
              // garde devant quel que soit l'angle — voir SAILLIE_SORTIE.
              curseurPartage={
                fini ? curseursBilan.current[i] : i >= montree ? curseurDefile.current : undefined
              }
              refletAuDoigt={fini || i >= montree}
              ombre
              // ET ELLE REBONDIT EN ÉLASTIQUE quand le film l'a découverte :
              // le jeton change une fois par ouverture, toute la pile le lit.
              rebond={!fini ? rebond : undefined}
              // ET ELLE POMPE QUAND SA GERBE PART : le même instant que les
              // particules de la révélation (`eclat`), voir Carte3D.pompe.
              // ET LES CINQ POMPENT ENSEMBLE AU BILAN, avec leurs gerbes —
              // Keko : « donner un effet de pump aux 5 cartes quand elles se
              // positionnent ». Voir `eclatsBilan`.
              amplitudePompe={fini ? POMPE_BILAN : undefined}
              pompe={
                fini
                  ? eclatsBilan?.cle
                  : eclat?.id === carte.id
                    ? eclat.cle
                    : undefined
              }
              // ELLE NE PORTE PLUS DE GESTE À ELLE. *Tout passe par le geste
              // de l'écran* — une tape sur la carte et une tape à côté font la
              // même chose, parce qu'il n'y a qu'une suite possible. Ça retire
              // au passage le cas que l'ancienne version devait écarter : les
              // cinq superposées dans le sachet, dont une tape en retournait
              // une au hasard.
              // ELLE REDEVIENT TOUCHABLE AU BILAN : voir `curseursBilan`.
              inerte={!fini}
              onPointerDown={
                fini
                  ? () => {
                      candidat.current = carte.id
                    }
                  : undefined
              }
            />
            </group>
            </Prise>
            </Arrivee>
            </Envol>
          ]
        })
  refCartes.current = cartes
  /**
   * QUELLE CARTE ON PEUT DÉCOLLER : celle qu'on regarde au défilé une fois le
   * paquet retourné, ou celle qu'on a zoomée au bilan. *Jamais pendant le
   * flip* : la pile n'est ouverte qu'à mi-demi-tour.
   */
  const aDecoller = !emojis || onDetruire === undefined || decollage !== null
    ? -1
    : fini
      ? indexZoome
      : retourne && pileOuverte
        ? montree
        : -1
  /** La boîte à l'écran d'une carte au centre, à la profondeur `z`, de largeur `t`. */
  function boiteAuCentre(z: number, t: number): BoiteALEcran {
    const px = fenetre.h / hauteurVisibleA(z, fenetre.h)
    return { cx: fenetre.l / 2, cy: fenetre.h / 2, l: t * px, h: t * 1.4 * px }
  }
  function decoller(): void {
    if (aDecoller < 0) return
    setDecollage({
      i: aDecoller,
      boite: fini
        ? boiteAuCentre(zDefile + tailleDuDefile * SAILLIE_SORTIE, tailleDuDefile)
        : boiteAuCentre(zDefile, tailleDuDefile),
    })
  }
  function decolle(): void {
    if (decollage === null) return
    const i = decollage.i
    const carte = paquet[i]
    setDecollage(null)
    setCachee(false)
    setDetruites((s) => new Set(s).add(i))
    if (carte === undefined) return
    onDetruire?.(carte.id, tirage.bonus[carte.id] ?? { holo: false, anime: false })
    // AU DÉFILÉ, LA SUIVANTE ÉTAIT DÉJÀ DERRIÈRE : c'est elle qu'on découvre.
    if (!fini) {
      if (montree + 1 < paquet.length) {
        setMontree(montree + 1)
        decouvrir(montree + 1)
      } else setFini(true)
    } else if (zoomee === carte.id) setZoomee(null)
  }
  // LE PAQUET OUVERT ENTRE DANS LA COLLECTION, une fois : voir `numeroCourant`.
  const signale = useRef(-1)
  useEffect(() => {
    if (!ouvert || paquet.length === 0 || signale.current === numero) return
    signale.current = numero
    numeroCourant = numero + 1
    onPaquetOuvert?.(
      paquet.map((c) => c.id),
      tirage.bonus,
    )
  }, [ouvert, paquet, numero, tirage, onPaquetOuvert])
  const calme = !brule || fini
  useEffect(() => onCalme?.(calme), [calme, onCalme])
  const sachetAttend = !brule && !ouvert && paquet.length > 0
  useEffect(() => onSachetEnAttente?.(sachetAttend), [sachetAttend, onSachetEnAttente])
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
      {/* DES LUMIÈRES ET DES EMOJI QUI FLOTTENT, derrière la scène : voir
          `FondAnime`. `?fond=sombre` rend le fond nu — *ce qui a servi à
          choisir doit rester ouvrable.* */}
      {!FOND_SOMBRE && <FondAnime />}
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
      {/* LES PARTICULES DE LA RÉVÉLATION, par-dessus la scène : voir
          `EclatDeRevelation`. Montées à neuf par la clé de l'éclat. */}
      {eclat !== null && eclat.boite !== null && !fini && (
        <EclatDeRevelation
          key={`et${eclat.cle}`}
          couleur={eclat.ton}
          rang={eclat.rang}
          boite={eclat.boite}
          holo={eclat.holo}
        />
      )}
      {/* ET UNE GERBE PAR CARTE AU BILAN, à sa place : voir `eclatsBilan`. */}
      {fini &&
        eclatsBilan !== null &&
        eclatsBilan.gerbes.map((g, i) => (
          <EclatDeRevelation
            key={`eb${eclatsBilan.cle}:${i}`}
            couleur={g.ton}
            rang={g.rang}
            boite={g.boite}
            holo={g.holo}
          />
        ))}
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ position: [0, 0, zCamera(fenetre.h)], fov: FOV }}
        gl={{ toneMapping: NoToneMapping }}
        style={{ position: 'fixed', inset: 0 }}
      >
        <Cadrage />
        <Horloge />
        {/* AU BILAN, LE TÉLÉPHONE NE PENCHE QUE LA CARTE ZOOMÉE. Keko : « je
            voudrais que les mouvements de téléphone ne déplacent pas les
            cartes, sauf si je zoome une d'entre elles ». *Cinq cartes qui
            penchent ensemble font une grille qui tangue* ; une seule, qu'on
            regarde, est un objet qu'on tient. */}
        <PencheAuGyro
          curseurs={
            fini
              ? indexZoome >= 0
                ? [curseursBilan.current[indexZoome]!]
                : []
              : [curseurDefile.current]
          }
          gyro={gyro}
        />
        {/* LES POINTS BRILLANTS RAYONNENT, comme chez lexicodex : voir `Bloom`. */}
        {!SANS_BLOOM && <Bloom />}
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
        {/* LE PAQUET ARRIVE D'EN HAUT, ses cartes avec lui : voir `ARRIVEE`. */}
        {!parti && paquet.length > 0 && (
          <Arrivee key={numero} distance={distanceArrivee} retard={retardArrivee}>
          <Prise pris={pris} distance={distancePrise}>
          <Sachet3D
            attend={!pris}
            onToucher={() => {
              sachetTouche.current = true
            }}
            key={numero}
            gyro={gyro}
            lineaire={!SANS_BLOOM}
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
          </Prise>
          </Arrivee>
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
        {/* UNE SEULE LISTE : React n'apparie les clés qu'à l'intérieur d'un
            même tableau, et c'est ce qui garde les partantes MONTÉES. */}
        {[...partantes, ...cartes]}

        {/*
          LE BOUTON N'EXISTE QU'AU BILAN. Pendant le défilé il n'y a rien à
          décider — *on continue, c'est tout* — et un bouton posé là
          disputerait le geste à la carte. « Tout révéler » est parti avec :
          il répondait à cinq dos posés côte à côte, et il n'y en a plus.
        */}
        {ouvert && fini && zoomee === null && paquet.length > 0 && peutContinuer && (
          <Bouton3D
            texte="Ouvrir un autre paquet"
            // EN STICKER, PAS EN LAITON : voir `TONS.emoji` dans Bouton3D.
            ton="emoji"
            cran="ecran"
            position={[0, -hVisible * 0.38, Z_MAIN]}
            onCliquer={partir}
          />
        )}
      </Canvas>

      {/* DÉCOLLER LE STICKER DE LA CARTE QU'ON REGARDE : voir `Decollage`. */}
      {aDecoller >= 0 && (
        <button type="button" className="decoller decoller-paquet" onClick={decoller}>
          <span aria-hidden>🏷️</span> Décoller le sticker
        </button>
      )}
      {decollage !== null && paquet[decollage.i] !== undefined && (
        <Decollage
          carte={paquet[decollage.i] as CarteEmoji}
          exemplaire={tirage.bonus[paquet[decollage.i]!.id] ?? { holo: false, anime: false }}
          boite={decollage.boite}
          onPret={() => setCachee(true)}
          onAnnuler={() => {
            setDecollage(null)
            setCachee(false)
          }}
          onFini={decolle}
        />
      )}
      {/* L'INVITE À PRENDRE LE SACHET : voir `Prise`. */}
      {!pris && paquet.length > 0 && <p className="paquet-invite">Touche le paquet</p>}
      {/* PLUS DE « DERNIÈRE CARTE » NI DE COMPTEUR EN HAUT. Keko : « enlève le
          commentaire en haut sur la rareté de la dernière carte ». La montée de
          l'écran vers la couleur du cran reste : voir `monterLeCompteur`, qui
          écrit le chiffre seulement si son paragraphe existe. */}

      {/* PLUS DE « OUVERTURE DU PAQUET… » PENDANT LE CHARGEMENT. Keko : « on
          peut ne pas afficher "ouverture d'un paquet" en bas tout au début ? »
          *Le fond animé est déjà là, et un sachet qui arrive se suffit* — une
          ligne de texte en bas disait un chargement que rien n'a besoin
          d'annoncer. L'erreur, elle, reste dite : *un refus muet se lit comme
          une panne.* */}
      {erreur !== null && <p className="paquet-mot">{erreur}</p>}
    </div>
  )
}

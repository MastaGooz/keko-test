/**
 * LA MAIN EN ÉVENTAIL, ET LE GESTE QUI JOUE UNE CARTE.
 *
 * C'est le deuxième risque de la réécriture, et le dernier gros : **tout le
 * jeu passe par ce geste** — on sort une carte de la main pour la jouer. En
 * 2D, le DOM le portait (des éléments qu'on survole, un `elementFromPoint`
 * sous le doigt). Ici il n'y a plus d'éléments : c'est du lancer de rayon sur
 * des objets, et ça se prouve au doigt avant de bâtir quoi que ce soit dessus.
 *
 * Les règles du geste sont celles du jeu 2D, et elles avaient coûté trois
 * allers-retours avec Keko — on ne les réapprend pas :
 *
 * - **au doigt, c'est le MAINTIEN qui prend la carte** (160 ms), pas la
 *   distance : une tape dérive toujours de quelques pixels, donc un seuil
 *   court fait passer les tapes pour des glissers et le zoom ne s'ouvre
 *   jamais. Le déplacement reste une seconde porte, mais à 16 px (8 à la
 *   souris, qui ne dérive pas) ;
 * - **ce qui décide de la tape, c'est le DÉPLACEMENT, jamais la durée.** Une
 *   carte prise au maintien puis relâchée sans avoir bougé se regarde ;
 * - **la carte tenue QUITTE la main** : les voisines se referment sur sa
 *   place. La laisser en place montrerait une position qui n'a plus de sens.
 *
 * **LA MAIN EST VUE À PLAT**, face à la caméra, comme en 2D : les cartes ne
 * sont pas couchées vers l'arrière et on ne les regarde pas de haut. Ce qui
 * reste du 2D : l'arc, le creux, et la plongée sous le bord bas. Ce que la 3D
 * ajoute : l'épaisseur, l'ombre portée d'une carte sur sa voisine, et le
 * laiton du cadre qui prend la lumière.
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { Carte3D, HAUT } from './Carte3D.tsx'
import { useGesteCarte } from './geste-carte.ts'
import { Fleche3D } from './Fleche3D.tsx'
import { CORPS } from './Ennemi3D.tsx'
import { Z_MAIN, hauteurVisibleA, surLePlan } from './Cadrage.tsx'
import type { CarteAPeindre } from './texture-carte.ts'

/**
 * L'arc de l'éventail.
 *
 * Le pas vaut 72 % d'une carte : à 62 %, les noms des cartes du milieu
 * passaient sous la voisine. En 2D la bande gauche suffisait — la gemme, le
 * nom calé à gauche — mais **ici le nom est centré**, donc c'est le milieu de
 * la carte qu'il faut dégager, pas son bord.
 *
 * **L'INCLINAISON a d'abord doublé, puis rendu un tiers.** À 5° par cran,
 * cinq cartes ne s'écartaient que de 10° du bord au bord : elles se lisaient
 * comme une rangée parallèle, pas comme une main tenue (Keko : « l'inclinaison
 * est beaucoup trop droite »). À 10°, les cartes des bords partaient trop de
 * travers — « trop inclinées ». Le réglage tenu est ~7°, soit 27° d'écart
 * entre les deux extrêmes.
 *
 * **Le creux suit toujours l'inclinaison**, dans le même rapport : sans ça,
 * l'arc penche sans se creuser et les cartes des bords partent de travers au
 * lieu de descendre.
 */
const PAS = 0.72

/**
 * CE QUE LA MAIN SE RÉSERVE DE CHAQUE CÔTÉ, en largeurs de carte.
 *
 * Les coins bas portent les tas, et le flanc gauche l'orbe et la barre de vie.
 * La main ne doit jamais aller les recouvrir : c'est la gouttière du jeu 2D,
 * qui vaut là-bas une carte plus 3,25rem.
 */
const GOUTTIERE = 1.45

/**
 * LE PAS VAUT 72 % D'UNE CARTE — SAUF S'IL FAUT SERRER POUR TENIR À L'ÉCRAN.
 *
 * C'est la règle du jeu 2D portée telle quelle, et là-bas les deux formules
 * ont existé seules avant qu'on prenne leur minimum. **Le pas fixe ne garantit
 * rien** : à partir d'une dizaine de cartes la main sortait de l'écran des
 * deux côtés et allait recouvrir les tas — vu en ouvrant `?main=20`. **Le
 * partage de la largeur seul est faux aussi** : à cinq cartes il les
 * étalerait sur toute la fenêtre, et la main deviendrait une rangée de cartes
 * espacées au lieu d'un éventail tenu.
 *
 * Le `min()` des deux garde l'allure à cinq cartes ET se tasse tout seul
 * au-delà.
 */
export function pasDeLEventail(nombre: number, hauteurPx: number, largeurPx: number): number {
  if (nombre <= 1) return PAS
  const visible = hauteurVisibleA(Z_MAIN, hauteurPx)
  const enCartes = (visible * largeurPx) / hauteurPx
  // L'envergure d'un éventail de `n` cartes au pas `p` vaut `(n - 1) p + 1`.
  const dispo = Math.max(1, enCartes - 2 * GOUTTIERE - 1)
  return Math.min(PAS, dispo / (nombre - 1))
}
const CREUX = 0.025
const INCLINAISON = 0.12

/**
 * Où la main se pose, et de combien elle se couche vers le joueur.
 *
 * LA CARTE PLONGE SOUS LE BORD BAS, comme en 2D : au repos on n'en voit que le
 * haut, et c'est ce qui permet de la faire grande sans lui donner tout
 * l'écran. La part enfouie est plus faible qu'en 2D (~9 % contre 24 %) : sans
 * couchage, la main prend moins de hauteur, donc elle a moins besoin de se
 * cacher.
 *
 * **LA MAIN EST VUE À PLAT, PAS EN PLONGÉE, et `COUCHE` vaut donc zéro.** Elle
 * a été couchée de 30° vers l'arrière, dans l'idée qu'une main tenue se
 * regarde de haut ; Keko : « la main devrait être vue à plat, pas depuis le
 * haut ». *Et il avait raison sur la cause du reste* : une carte couchée
 * avance en profondeur, c'est ce qui la faisait croiser celle qu'on tient.
 *
 * Ce qu'on perd en couchant à zéro, et qu'il faudra rendre autrement si le
 * volume manque : la lumière rasante ne glisse plus sur la face, elle
 * n'accroche que le cadre et la tranche.
 */
const COUCHE = 0

/**
 * Où la main se pose en y, pour cette fenêtre : collée au bord bas, la carte
 * **enfouie de 25,5 %**, et c'est le MAXIMUM. Elle l'a d'abord été de 9 %, et la main montait trop
 * haut : Keko : « la main de cartes est trop haute, il faudrait la descendre
 * un peu, même si on ne voit pas la partie inférieure des cartes ». *Ce qui
 * est enfoui est ce qu'on lit le moins* — le pied et la fin du cartouche — et
 * lever la carte le rend.
 *
 * **LA BORNE, C'EST LE NOM**, et elle se calcule : il est peint à 67 % de la
 * hauteur de la carte (`peindreTextes`), donc son bas tombe à 30 % du bord
 * inférieur. Au-delà, il passe sous la ligne de flottaison — et *une carte
 * sans nom n'est plus une carte, c'est une couleur.* Le creux de l'arc compte
 * dans le calcul, puisqu'il enfonce les cartes des bords d'un cran de plus :
 * il a été aplati d'autant.
 *
 * Descendre encore demande de remonter le nom DANS le dessin de la carte,
 * ce qui est une décision de gabarit, pas de mise en page. **Calculée, pas fixée** : la caméra recule sur grand écran
 * (`Cadrage`), donc le bord bas de l'écran descend en unités de scène — une
 * constante laissait la main flotter au milieu.
 */
export function yMain(hauteurFenetrePx: number): number {
  return -hauteurVisibleA(Z_MAIN, hauteurFenetrePx) / 2 + HAUT * 0.245
}

/**
 * À quelle profondeur voyage la carte qu'on tient.
 *
 * **UNE CARTE COUCHÉE N'OCCUPE PAS LE PLAN OÙ ON L'A POSÉE**, et c'est ce qui
 * avait causé la traversée : à 30° de couchage, le haut d'une carte avance en
 * z de `sin(COUCHE) × HAUT/2`, soit 0,35 — exactement l'écart que la carte
 * tenue avait alors. Depuis que la main est à plat, plus rien n'avance, et un
 * petit écart suffit à la faire passer devant.
 *
 * *La leçon reste* : en 3D, la profondeur d'un objet incliné n'est pas celle
 * de son origine. Si la main se recouche un jour, cet écart doit suivre.
 */
export const Z_TENUE = Z_MAIN + 0.35

/**
 * CE QUI ACTIVE LA CARTE, C'EST DE SORTIR DE LA MAIN.
 *
 * **Un NIVEAU, pas une distance parcourue**, et il a fallu quatre réglages
 * pour y revenir. La hauteur a d'abord été absolue mais posée au milieu de
 * l'écran (« trop haut »), puis mesurée depuis le point de prise — un tiers de
 * carte, un poil, un cran du milieu — et à chaque fois Keko la trouvait trop
 * basse, jusqu'à : « il faudrait que les cartes passent en mode ciblage plus
 * haut, au même niveau qu'on peut lâcher = jouer les cartes sans ciblage ».
 *
 * *Il décrivait un niveau depuis le début.* Une distance depuis la prise ne
 * peut pas dire « la carte est sortie de la main » — selon l'endroit où l'on
 * a saisi la carte, la même distance la laisse dedans ou l'emmène au-dessus
 * des corps. La ligne est donc le HAUT DE LA MAIN (`ligneDeLaMain`) : au-
 * dessus, lâcher joue ; dedans, lâcher range. La même pour toutes les cartes,
 * qu'elles visent ou non.
 *
 * *Ce que ça règle au passage* : ranger sa main est un long glisser latéral,
 * et sa dérive franchissait n'importe quel seuil court. Elle ne peut pas
 * franchir le haut de la main sans en sortir — le problème disparaît au lieu
 * d'être compensé.
 */

/**
 * La montée minimale, même au-dessus de la ligne.
 *
 * On saisit souvent une carte par le haut, qui affleure déjà la ligne : sans
 * ce plancher, la carte basculerait au premier pixel de glissement, avant même
 * qu'on ait voulu quoi que ce soit.
 */
const LEVEE_MIN = 0.25

/**
 * De combien la carte redescend sous la ligne avant de retomber dans la main.
 *
 * **Un seuil qui décide d'un basculement visible doit avoir deux bords** :
 * sans ça, un doigt posé pile sur la ligne fait clignoter la carte entre sa
 * place d'attente et la main.
 */
const RETOUR = 0.12

/**
 * La hauteur au-dessus de laquelle on n'est plus DANS la main.
 *
 * Sert là où il n'y a pas de geste à mesurer — l'écran de butin, qui demande
 * seulement si un trésor a été lâché au-dessus de la main ou dedans.
 */
export function ligneDeLaMain(hauteurFenetrePx: number): number {
  return yMain(hauteurFenetrePx) + HAUT * 0.5
}

/**
 * LES REPÈRES DE LA MAIN, PUBLIÉS EN CSS.
 *
 * L'interface est du HTML posé par-dessus le canvas, et elle doit se caler sur
 * des mesures qui ne vivent que dans la scène : le bord gauche de la main et la
 * hauteur de son bord haut. On les écrit sur `:root` — *c'est le choix de
 * `Projeter`, qui écrit directement dans le DOM* : une position qui ne dépend
 * que de la fenêtre n'a pas à passer par l'état React.
 *
 * **Le bord gauche se calcule pour une main PLEINE, pas pour la main
 * courante** : sinon l'orbe et la barre de vie se déplaceraient à chaque carte
 * jouée. *Ce qui sert de bord à autre chose doit être stable, même si l'objet
 * qui le donne bouge.*
 *
 * Ça vit ici et non dans `Cadrage` parce que le pas de l'éventail et la
 * hauteur de la main y sont : les importer depuis `Cadrage` ferait un cycle,
 * et les recopier les ferait diverger.
 */
const CARTES_PLEINES = 5

export function ReperesDeLaMain(): null {
  const { size } = useThree()
  useEffect(() => {
    const parUnite = size.height / hauteurVisibleA(Z_MAIN, size.height)
    // LA ROTATION COMPTE. Les cartes des bords sont inclinées, donc elles
    // débordent de leur demi-largeur : `sin(inclinaison) × demi-hauteur`. Sans
    // ce terme la barre de vie mordait sur la première carte — *l'envergure
    // d'un éventail n'est pas celle de ses centres.*
    const crans = (CARTES_PLEINES - 1) / 2
    const debord = Math.sin(INCLINAISON * crans) * (HAUT / 2)
    const demiEnvergure = ((CARTES_PLEINES - 1) * PAS + 1) / 2 + debord
    const gauche = size.width / 2 - demiEnvergure * parUnite
    const visible = hauteurVisibleA(Z_MAIN, size.height)
    const haut = ((ligneDeLaMain(size.height) + visible / 2) / visible) * size.height
    const style = document.documentElement.style
    style.setProperty('--main-gauche', `${Math.round(gauche)}px`)
    style.setProperty('--main-haut', `${Math.round(haut)}px`)
  }, [size.width, size.height])
  return null
}

/**
 * De combien les voisines s'écartent pour ouvrir la fente.
 *
 * **UNE VRAIE FENTE S'OUVRE LÀ OÙ LA CARTE VA TOMBER** : celles d'avant vont à
 * gauche, celles d'après à droite. Un simple repère posé sur une voisine ne
 * suffisait pas en 2D — dans un éventail qui se recouvre, une arête ne dit pas
 * de quel CÔTÉ de la carte on va tomber.
 */
const ECART_FENTE = 0.3

/**
 * Où la carte qui vise vient se poser : au centre, **juste au-dessus de la
 * main et devant elle**.
 *
 * **ELLE SE POSE PILE SUR LA LIGNE QUI L'A ACTIVÉE**, et c'est le réglage
 * demandé par Keko : « quand la carte est en cours de ciblage, il faudrait
 * qu'elle soit à la même hauteur que celle nécessaire pour la faire passer en
 * mode ciblage ». *Donc elle ne saute pas* : au moment où le doigt franchit la
 * ligne, la carte y est déjà — elle ne fait que se recentrer, et le
 * décrochage se lit comme un ancrage plutôt que comme un bond.
 *
 * C'est la même hauteur qu'on avait essayée avant, mais pour une raison qui ne
 * tenait pas : elle était alors calculée à part du seuil, donc la carte
 * bondissait. *Une valeur juste au mauvais endroit se lit comme une valeur
 * fausse.* Elle sort ici de la même fonction que la ligne, et ne peut plus en
 * diverger.
 */
export function ancreVisee(hauteurFenetrePx: number): number {
  return ligneDeLaMain(hauteurFenetrePx)
}


type Props = {
  cartes: readonly CarteAPeindre[]
  /** Les cartes qu'on peut jouer maintenant, dans le même ordre. */
  jouables?: readonly boolean[]
  /**
   * L'identifiant d'une carte qui N'EST PLUS DANS LA MAIN alors que l'état
   * l'y compte encore : celle qui s'abat sur sa cible, ou celle qui attend
   * qu'on lui en désigne une. L'état ne la retire
   * de la main qu'à l'impact, 220 ms après le lâcher — et le geste, lui, est
   * fini : sans ce filtre, la main la redessinait à sa place pendant que sa
   * copie tombait sur l'ennemi. Keko : « une autre image d'elle revient en
   * main ». Par identifiant et non par index : à l'impact, la carte quitte la
   * main et les index glissent — un index cacherait alors sa voisine.
   */
  /**
   * Les cartes qui NE SONT PLUS dans la main bien que l'état les y compte
   * encore : celle qui s'abat, celle qui attend sa cible, celle qu'on regarde,
   * et maintenant celles qui volent depuis le paquet. Trois raisons, un seul
   * mécanisme — et il en fallait plusieurs à la fois depuis que la pioche fait
   * voler cinq cartes l'une après l'autre.
   */
  envolee?: string | readonly string[] | null
  /**
   * La carte a été sortie de la main : on la joue. `depuis` est le point du
   * lâcher, `cible` le corps sous la pointe de la flèche — `null` quand il n'y
   * en a pas, ce qui **annule** pour une carte qui doit viser.
   */
  onJouer?: (index: number, depuis: [number, number, number], cible: number | null) => void
  /** Tapée : l'écran décide quoi en faire — ici, la regarder de près. */
  onRegarder?: (index: number) => void
  /** La carte a été reposée ailleurs dans la main. */
  onReordonner?: (de: number, vers: number) => void
  onPeinte?: () => void
  /** Une carte est tenue au doigt (ou vient d'être lâchée). */
  onSaisie?: (tenue: boolean) => void
  /**
   * CE QUE LÂCHER ICI FERAIT, dit au PARENT à chaque changement.
   *
   * L'écran de butin en a besoin : le slot de rebut doit rougir sous la carte,
   * or *la carte peut venir de la main comme de l'emplacement de loot*, et
   * chacun a son propre geste. Sans ce retour, le slot ne voyait que les
   * cartes qui partaient de lui.
   */
  onZone?: (nature: 'non' | 'depot' | 'peril') => void
  /**
   * Lâcher ICI déclenchera quelque chose.
   *
   * En combat, tout ce qui est au-dessus de la main joue la carte : la zone
   * n'a pas de bord et le halo dit la vérité partout. Sur l'écran de butin
   * seuls les deux emplacements reçoivent — *un halo allumé au-dessus du vide
   * promettrait un dépôt qui n'aura pas lieu.*
   */
  /**
   * CE QUE LÂCHER ICI FERAIT : rien, un dépôt ordinaire, ou une PERTE.
   *
   * La main ne connaît pas les écrans qui l'emploient ; elle leur demande
   * seulement de quelle nature est l'endroit sous le doigt, et en tire la
   * couleur du halo. *Un halo doré sur une carte qu'on s'apprête à perdre
   * dirait exactement le contraire de ce qui va se passer.*
   */
  zoneActive?: (point: [number, number, number]) => 'non' | 'depot' | 'peril'
  /**
   * LES CARTES QUI DEMANDENT UNE CIBLE. Passée en zone de jeu, une de
   * celles-là **cesse de suivre le doigt** : elle se pose au-dessus de la
   * main et c'est une flèche qui vise.
   */
  viseur?: readonly boolean[]
  /** Les corps visables, en coordonnées de scène. */
  cibles?: readonly [number, number, number][]
  /**
   * La visée a changé : une carte attend une cible, et voici celle qui est
   * sous la pointe.
   *
   * Prévenu par effet et non à chaque mouvement du doigt : le parent n'a
   * besoin de se redessiner que quand la RÉPONSE change, pas soixante fois
   * par seconde.
   */
  onVise?: (actif: boolean, cible: number | null) => void
  /**
   * LE JEU A DES TEMPS. Tant qu'une animation se déroule, la main ne répond
   * pas : le coup se joue en entier avant qu'on puisse en lancer un autre.
   */
  verrou?: boolean
}

/**
 * La place où la carte tombera dans la main : **le nombre de cartes dont le
 * milieu est à gauche du doigt, LA CARTE TENUE EXCLUE.**
 *
 * Les deux points comptent, et c'est la règle du jeu 2D, où elle avait coûté
 * un bug qui ne se voyait que dans un sens : le milieu plutôt que les bords,
 * parce que les cartes se recouvrent et que deux voisines revendiqueraient la
 * même bande ; et la carte tenue exclue, parce que c'est exactement l'index
 * d'insertion dans la main *une fois retirée*, ce que le réordonnancement
 * attend. La compter décalait d'un cran tous les déplacements vers la gauche.
 */
function placeSousLeDoigt(x: number, total: number, pas: number): number {
  const centre = (total - 1) / 2
  let place = 0
  for (let rang = 0; rang < total; rang += 1) {
    if ((rang - centre) * pas < x) place += 1
  }
  return place
}

/**
 * La place d'une carte dans l'éventail, la carte tenue exclue.
 *
 * **Exportée**, parce qu'une carte qui vole du paquet vers la main doit
 * atterrir à sa VRAIE place : viser le centre puis laisser l'amortissement
 * corriger se lirait comme un ressaut à l'arrivée.
 */
export function placeDansEventail(rang: number, total: number, y: number, pas: number): {
  position: [number, number, number]
  rotation: [number, number, number]
} {
  const centre = (total - 1) / 2
  const ecart = rang - centre
  // L'INCLINAISON SUIT LE PAS : resserrée, une main qui garderait ses 7° par
  // cran finirait à la verticale sur ses bords. *Ce qui se tasse en largeur
  // doit se tasser en angle.*
  const serre = pas / PAS
  return {
    position: [ecart * pas, y - Math.abs(ecart) * CREUX * serre, Z_MAIN + rang * 0.01],
    rotation: [COUCHE, 0, -ecart * INCLINAISON * serre],
  }
}

export function Main3D({
  cartes,
  jouables,
  envolee = null,
  onJouer,
  onRegarder,
  onReordonner,
  onPeinte,
  onSaisie,
  onZone,
  zoneActive,
  viseur,
  cibles,
  onVise,
  verrou = false,
}: Props): React.JSX.Element {
  const { size } = useThree()
  // Le cadrage de CETTE fenêtre : la main reste collée au bord bas quelle que
  // soit la profondeur où la caméra a reculé.
  const Y_MAIN = yMain(size.height)
  // LE PAS SE RECALCULE À CHAQUE RENDU : il dépend du nombre de cartes, donc
  // il change quand on en joue une. Une `ref` le porte aussi, parce que le
  // geste est capté au `pointerdown` et lit ce pas-là au lâcher.
  const pas = pasDeLEventail(cartes.length, size.height, size.width)
  const pasCourant = useRef(pas)
  pasCourant.current = pas
  // LE SURVOL SE MÉMORISE PAR IDENTIFIANT, JAMAIS PAR INDEX. En index, la
  // carte survolée puis jouée laissait son numéro derrière elle : la main se
  // refermait, sa voisine héritait de l'index — et se levait, indéfiniment,
  // puisqu'aucun `pointerout` ne viendrait pour une carte jamais survolée.
  // Keko : « une autre carte se lève comme si j'étais en train de la hover,
  // et elle reste levée tant que je ne hover pas une autre carte ». Même
  // famille que la clé React bâtie sur l'index.
  const [survolee, setSurvolee] = useState<string | null>(null)
  /**
   * LE GESTE EST PARTAGÉ (`geste-carte.ts`) : prendre, promener, lâcher sont
   * les mêmes ici et sur l'écran de butin. *Ce sont les mêmes cartes, ce doit
   * être le même geste* — et le réécrire à côté, c'était garantir qu'un jour
   * les deux divergent.
   *
   * La main n'en garde que ce qui lui appartient : ce qu'un lâcher VEUT DIRE.
   */
  /**
   * Quel corps se trouve sous ce point.
   *
   * **On ramène le point sur LE PLAN DES CORPS** : la carte tenue et la
   * flèche vivent devant eux, donc un doigt pile sur une créature donne deux
   * points éloignés en coordonnées de scène.
   */
  const corpsSous = (point: THREE.Vector3): number | null => {
    if (cibles === undefined) return null
    const [x, y] = surLePlan([point.x, point.y, point.z], 0, window.innerHeight)
    const i = cibles.findIndex(
      (c) => Math.abs(x - c[0]) < CORPS * 0.55 && Math.abs(y - c[1]) < CORPS * 0.6,
    )
    return i < 0 ? null : i
  }

  /** L'état affiché de la zone de jeu, relu au lâcher. */
  const zone = useRef(false)

  const { tenue, doigt, depart, prendre } = useGesteCarte({
    z: Z_TENUE,
    verrou,
    onTaper: (i) => onRegarder?.(i),
    onLacher: (i, p) => {
      // C'EST CE QU'ON A LEVÉ QUI TRANCHE : au-dessus de la main on joue,
      // dedans on RANGE. Même règle qu'en 2D, mesurée depuis la prise.
      //
      // **On relit l'état AFFICHÉ**, pas un seuil recalculé : c'est une `ref`,
      // donc elle traverse les rendus que cet écouteur — posé au
      // `pointerdown` — ne voit pas, et le lâcher fait exactement ce que le
      // joueur voyait.
      //
      // La cible, elle, se recalcule depuis le point de lâcher, pour la même
      // raison en sens inverse : celle qu'on affichait vit dans un rendu
      // invisible d'ici.
      if (zone.current) {
        // La carte part de sa place d'attente quand elle s'y est posée : c'est
        // de là qu'on l'a vue viser.
        const ancree = viseur?.[i] ?? false
        const depuis: [number, number, number] = ancree
          ? [0, ancreVisee(size.height), Z_TENUE]
          : [p.x, p.y, p.z]
        onJouer?.(i, depuis, corpsSous(p))
      } else onReordonner?.(i, placeSousLeDoigt(p.x, cartes.length - 1, pasCourant.current))
    },
    // Au doigt, rien ne viendra éteindre le survol : on le solde ici.
    onFin: (type) => {
      if (type !== 'mouse') setSurvolee(null)
    },
  })

  // Le parent veut savoir quand on tient une carte : c'est lui qui fait passer
  // la scène devant l'interface le temps du geste.
  useEffect(() => {
    onSaisie?.(tenue !== null)
  }, [tenue, onSaisie])

  // LES VOISINES SE REFERMENT sur la place de la carte tenue : on range celles
  // qui restent comme si elle n'avait jamais été là. La carte REGARDÉE sort de
  // la main pour la même raison — sa place d'origine n'a plus de sens tant
  // qu'on la tient sous les yeux.
  const envolees = useMemo(
    () => new Set(envolee === null ? [] : typeof envolee === 'string' ? [envolee] : envolee),
    [envolee],
  )
  // LA CARTE SORT DE LA MAIN QUAND ON LA DÉPLACE, pas quand on la tient. Tant
  // que le doigt n'a pas bougé elle garde sa place dans l'éventail, seulement
  // soulevée : sans ça, un simple maintien la faisait sauter au CENTRE de la
  // main — Keko : « elle devrait rester dans la main et pas aller au centre
  // même si on ne bouge pas ». *Une carte qu'on tient sans la bouger n'a pas
  // encore quitté sa place.*
  const deplacee = tenue !== null && doigt !== null ? tenue : null
  const restantes = cartes
    .map((_, i) => i)
    .filter((i) => i !== deplacee && !envolees.has(cartes[i]!.id))

  /**
   * LA CARTE SE POSE ET LA FLÈCHE PREND LE RELAIS.
   *
   * Passée en zone de jeu, une carte qui doit viser cesse de suivre le doigt :
   * elle se cale au CENTRE de la main, juste au-dessus d'elle — la hauteur
   * exacte à partir de laquelle lâcher joue. *Tant qu'elle suivait le pouce,
   * elle se posait sur le corps qu'on cherchait à désigner*, et sur un
   * téléphone la cible disparaissait sous la carte au moment précis où il
   * fallait la voir. Demandé par Keko, et c'est le geste de Hearthstone.
   *
   * Le même système qu'il y ait un corps debout ou cinq : rien n'est visé
   * automatiquement, on désigne toujours.
   */
  // SORTIE DE LA MAIN : lâcher ici fait quelque chose. La valeur vit dans une
  // `ref` parce que le lâcher doit la relire depuis un écouteur qui ne voit
  // pas les rendus.
  const ligne = ligneDeLaMain(size.height)
  if (doigt === null || depart === null) zone.current = false
  else if (!zone.current) zone.current = doigt.y > ligne && doigt.y > depart.y + LEVEE_MIN
  else zone.current = doigt.y > ligne - RETOUR
  const enZoneDeJeu = zone.current
  // UNE CARTE TROP CHÈRE NE VISE PAS. Elle reste saisissable et zoomable — on
  // veut pouvoir la ranger et la regarder — mais elle ne se pose pas, et
  // aucune flèche n'en part : *elle aurait montré une visée que le lâcher
  // refuse*, et les corps se seraient allumés pour rien. C'est le dépôt qui
  // refuse, pas la prise, mais il n'a aucune raison de le faire en silence
  // après avoir laissé croire le contraire.
  const ancree =
    tenue !== null && enZoneDeJeu && (viseur?.[tenue] ?? false) && (jouables?.[tenue] ?? true)
  const cible = ancree && doigt !== null ? corpsSous(doigt) : null
  const ancre = useMemo(
    () => new THREE.Vector3(0, ancreVisee(size.height), Z_TENUE),
    [size.height],
  )

  useEffect(() => {
    onVise?.(ancree, cible)
  }, [ancree, cible, onVise])

  // LA NATURE DE LA ZONE SOUS LE DOIGT, calculée une fois pour toutes : la
  // carte tenue s'en teinte, et le parent l'apprend.
  const nature: 'non' | 'depot' | 'peril' =
    tenue === null || doigt === null || !enZoneDeJeu
      ? 'non'
      : zoneActive === undefined
        ? 'depot'
        : zoneActive([doigt.x, doigt.y, Z_TENUE])

  useEffect(() => {
    onZone?.(nature)
  }, [nature, onZone])

  // LA FENTE NE S'OUVRE QUE DANS LA MAIN. Au-dessus de la ligne de jeu, la
  // carte part frapper : écarter ses voisines là-haut annoncerait un rangement
  // qui n'aura pas lieu.
  const fente =
    tenue !== null && doigt !== null && !enZoneDeJeu
      ? placeSousLeDoigt(doigt.x, restantes.length, pas)
      : null

  return (
    <group>
      {/* LA FLÈCHE part du haut de la carte posée et suit le doigt. */}
      {ancree && doigt !== null && (
        <Fleche3D
          depuis={new THREE.Vector3(ancre.x, ancre.y + HAUT * 0.5, ancre.z)}
          vers={doigt}
          valide={cible !== null}
        />
      )}

      {cartes.map((carte, i) => {
        // LA CARTE QUI S'ABAT n'est plus ici, ni celles qui volent depuis le
        // paquet : ce sont `CarteQuiSAbat` et `CarteQuiVole` qui les montrent.
        if (envolees.has(carte.id)) return null
        if (i === deplacee) {
          const suivi = doigt ?? ancre
          const p = ancree ? ancre : suivi
          return (
            <Carte3D
              key={carte.id}
              carte={carte}
              position={[p.x, p.y, Z_TENUE]}
              rotation={[0, 0, 0]}
              taille={1.05}
              ressort={22}
              // LÂCHER ICI FAIT QUELQUE CHOSE : la carte s'allume et frémit,
              // et elle le fait **pendant TOUT le ciblage**, pas seulement
              // quand la flèche tient un corps. Demandé par Keko, et c'est
              // plus juste : le halo dit « cette carte est engagée », ce qui
              // reste vrai tant qu'on cherche sa cible. *C'est à la FLÈCHE
              // seule de dire si le coup partira* — un seul signal pour un
              // seul fait, et il est déjà là où le doigt regarde.
              //
              // Une carte injouable, elle, ne s'allume jamais.
              engagee={enZoneDeJeu && (jouables?.[i] ?? true) && nature !== 'non'}
              // LA CARTE QU'ON VA PERDRE S'ENTOURE DE ROUGE, pas d'or — et
              // elle FRÉMIT quand même, parce qu'on est en plein geste.
              peril={enZoneDeJeu && nature === 'peril'}
              jouable={jouables?.[i] ?? true}
              onPeinte={onPeinte}
            />
          )
        }
        const rang = restantes.indexOf(i)
        const place = placeDansEventail(rang, restantes.length, Y_MAIN, pas)
        // Une carte survolée se lève ; une carte qu'on TIENT sans l'avoir
        // encore bougée aussi — c'est tout ce qui dit qu'on la tient.
        const leve = survolee === carte.id || i === tenue
        // Les voisines d'avant s'écartent à gauche, celles d'après à droite.
        const ecart = fente === null ? 0 : rang < fente ? -ECART_FENTE : ECART_FENTE
        return (
          <Carte3D
            key={carte.id}
            carte={carte}
            position={[
              place.position[0] + ecart,
              place.position[1] + (leve ? HAUT * 0.22 : 0),
              place.position[2] + (leve ? 0.12 : 0),
            ]}
            rotation={leve ? [0, 0, place.rotation[2] * 0.3] : place.rotation}
            taille={leve ? 1.08 : 1}
            // L'ORDRE SE REND AVANT LA PLACE : la profondeur rattrape quatre
            // fois plus vite que le mouvement, sinon la voisine met un instant
            // à repasser devant une carte qui a déjà fini de redescendre.
            ressortZ={36}
            jouable={jouables?.[i] ?? true}
            onPeinte={onPeinte}
            onPointerDown={prendre(i)}
            // LE SURVOL N'EXISTE QU'À LA SOURIS. Au doigt, le `pointerover`
            // part au toucher mais **le `pointerout` n'arrive jamais** : le
            // doigt quitte l'écran sans passer « à côté », donc la carte
            // restait levée comme si on la tenait encore. Keko : « elle reste
            // parfois sortie alors que je ne touche plus l'écran ». C'est le
            // pendant du `hover: hover` du jeu 2D, où la règle est déjà écrite.
            // ...ET PAS PENDANT QU'ON TIENT UNE CARTE. En la promenant, le
            // pointeur passe sur ses voisines, qui se levaient comme si on
            // les survolait — Keko : « les autres cartes de la main se
            // soulèvent comme quand je les hover sans avoir de drag en
            // cours ». Une carte tenue est le seul objet du geste.
            onPointerOver={(e) => {
              if (e.nativeEvent.pointerType === 'mouse' && tenue === null) setSurvolee(carte.id)
            }}
            onPointerOut={(e) => {
              if (e.nativeEvent.pointerType === 'mouse') setSurvolee((s) => (s === carte.id ? null : s))
            }}
          />
        )
      })}
    </group>
  )
}

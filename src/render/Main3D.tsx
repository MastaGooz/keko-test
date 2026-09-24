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
import { useEffect, useMemo, useState } from 'react'
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
 * **L'INCLINAISON A DOUBLÉ** (0,09 → 0,18 radian par cran, soit ~10° au lieu
 * de 5). À 5°, cinq cartes ne s'écartaient que de 10° du bord au bord : elles
 * se lisaient comme une rangée de cartes parallèles, pas comme une main tenue.
 * Keko : « l'inclinaison est beaucoup trop droite ». Le creux suit, sinon
 * l'arc penche sans se creuser et les cartes des bords partent de travers
 * au lieu de descendre.
 */
const PAS = 0.72
const CREUX = 0.1
const INCLINAISON = 0.18

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
 * enfouie de ~9 %. **Calculée, pas fixée** : la caméra recule sur grand écran
 * (`Cadrage`), donc le bord bas de l'écran descend en unités de scène — une
 * constante laissait la main flotter au milieu.
 */
function yMain(hauteurFenetrePx: number): number {
  return -hauteurVisibleA(Z_MAIN, hauteurFenetrePx) / 2 + HAUT * 0.41
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

/** Y de repos de la carte tenue avant que le doigt n'ait bougé, en fonction de la main. */
const LEVEE_INITIALE = 0.4

/**
 * La hauteur à partir de laquelle lâcher JOUE la carte.
 *
 * Au-dessus de la main, on joue ; dedans, on range. Même règle qu'en 2D, et
 * elle est la seule qui ne demande aucune cible à viser — donc la seule qui
 * marche avant que les ennemis existent.
 */
export const LIGNE_DE_JEU = -0.35

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
 * Posée sur la ligne de jeu elle-même, son haut montait jusqu'aux corps et les
 * recouvrait — précisément le défaut qu'on voulait corriger en la décrochant
 * du doigt. Elle se cale donc une demi-carte plus bas : elle chevauche le haut
 * de la main, qu'elle masque sans conséquence (on ne choisit plus dedans), et
 * elle laisse le rang entièrement libre.
 */
const ANCRE_VISEE = LIGNE_DE_JEU - 0.45


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
  envolee?: string | null
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
   * Lâcher ICI déclenchera quelque chose.
   *
   * En combat, tout ce qui est au-dessus de la main joue la carte : la zone
   * n'a pas de bord et le halo dit la vérité partout. Sur l'écran de butin
   * seuls les deux emplacements reçoivent — *un halo allumé au-dessus du vide
   * promettrait un dépôt qui n'aura pas lieu.*
   */
  zoneActive?: (point: [number, number, number]) => boolean
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
function placeSousLeDoigt(x: number, total: number): number {
  const centre = (total - 1) / 2
  let place = 0
  for (let rang = 0; rang < total; rang += 1) {
    if ((rang - centre) * PAS < x) place += 1
  }
  return place
}

/** La place d'une carte dans l'éventail, la carte tenue exclue. */
function placeDansEventail(rang: number, total: number, y: number): {
  position: [number, number, number]
  rotation: [number, number, number]
} {
  const centre = (total - 1) / 2
  const ecart = rang - centre
  return {
    position: [ecart * PAS, y - Math.abs(ecart) * CREUX, Z_MAIN + rang * 0.01],
    rotation: [COUCHE, 0, -ecart * INCLINAISON],
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

  const { tenue, doigt, prendre } = useGesteCarte({
    z: Z_TENUE,
    verrou,
    onTaper: (i) => onRegarder?.(i),
    onLacher: (i, p) => {
      // C'EST LA HAUTEUR DU DOIGT QUI TRANCHE : au-dessus de la main on joue,
      // dedans on RANGE. Même règle qu'en 2D.
      //
      // La cible se RECALCULE ici depuis le point de lâcher : celle qu'on
      // affichait pendant le geste vit dans un rendu que cet écouteur, posé au
      // `pointerdown`, ne voit pas.
      if (p.y > LIGNE_DE_JEU) onJouer?.(i, [p.x, p.y, p.z], corpsSous(p))
      else onReordonner?.(i, placeSousLeDoigt(p.x, cartes.length - 1))
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
  const enVol = envolee === null ? -1 : cartes.findIndex((c) => c.id === envolee)
  const sortie = tenue ?? enVol
  const restantes = cartes.map((_, i) => i).filter((i) => i !== sortie)

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
  const ancree = tenue !== null && doigt !== null && doigt.y > LIGNE_DE_JEU && (viseur?.[tenue] ?? false)
  const cible = ancree && doigt !== null ? corpsSous(doigt) : null
  const ancre = useMemo(() => new THREE.Vector3(0, ANCRE_VISEE, Z_TENUE), [])

  useEffect(() => {
    onVise?.(ancree, cible)
  }, [ancree, cible, onVise])

  // LA FENTE NE S'OUVRE QUE DANS LA MAIN. Au-dessus de la ligne de jeu, la
  // carte part frapper : écarter ses voisines là-haut annoncerait un rangement
  // qui n'aura pas lieu.
  const fente =
    tenue !== null && doigt !== null && doigt.y <= LIGNE_DE_JEU
      ? placeSousLeDoigt(doigt.x, restantes.length)
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
        // LA CARTE QUI S'ABAT n'est plus ici : c'est `CarteQuiSAbat` qui la montre.
        if (i === enVol) return null
        if (i === tenue) {
          const suivi = doigt ?? new THREE.Vector3(0, Y_MAIN + LEVEE_INITIALE, Z_TENUE)
          const p = ancree ? ancre : suivi
          return (
            <Carte3D
              key={carte.id}
              carte={carte}
              position={[p.x, p.y, Z_TENUE]}
              rotation={[0, 0, 0]}
              taille={1.05}
              ressort={22}
              // AU-DESSUS DE LA MAIN, LÂCHER JOUE : la carte s'allume et
              // frémit. C'est la seule zone qui déclenche quelque chose, et
              // elle n'a aucun bord à surligner — le repère voyage donc avec
              // le doigt, comme en 2D. Une carte injouable ne s'allume pas :
              // *le halo dit « lâche et ça part »*, il mentirait.
              // Une carte posée ne s'allume que si la flèche tient un corps :
              // *le halo dit « lâche et ça part »*, il mentirait sinon.
              engagee={
                suivi.y > LIGNE_DE_JEU &&
                (jouables?.[i] ?? true) &&
                (zoneActive === undefined || zoneActive([suivi.x, suivi.y, Z_TENUE])) &&
                (!ancree || cible !== null)
              }
              jouable={jouables?.[i] ?? true}
              onPeinte={onPeinte}
            />
          )
        }
        const rang = restantes.indexOf(i)
        const place = placeDansEventail(rang, restantes.length, Y_MAIN)
        const leve = survolee === carte.id
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

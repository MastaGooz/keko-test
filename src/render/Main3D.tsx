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
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useThree, type ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import { Carte3D, HAUT } from './Carte3D.tsx'
import type { CarteAPeindre } from './texture-carte.ts'

/** Sous ce déplacement, la souris n'a pas glissé : elle a cliqué. */
const SEUIL_SOURIS = 8
/** Au doigt il en faut le double : une tape dérive. */
const SEUIL_DOIGT = 16
/** Au doigt, rester appuyé prend la carte, même sans bouger d'un pixel. */
const DELAI_PRISE = 160

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
const Y_MAIN = -1.3
const Z_MAIN = 1.1
const COUCHE = 0

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
const Z_TENUE = Z_MAIN + 0.35

/**
 * La hauteur à partir de laquelle lâcher JOUE la carte.
 *
 * Au-dessus de la main, on joue ; dedans, on range. Même règle qu'en 2D, et
 * elle est la seule qui ne demande aucune cible à viser — donc la seule qui
 * marche avant que les ennemis existent.
 */
const LIGNE_DE_JEU = -0.35

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
 * Où la carte regardée vient se poser, et ce que le voile cache derrière elle.
 *
 * À cette profondeur elle occupe ~73 % de la hauteur d'écran : assez pour lire
 * le cartouche entier, pas assez pour déborder. Le voile est un plan large
 * posé juste derrière — **il intercepte les rayons**, donc il neutralise la
 * main d'un coup sans qu'on ait à désactiver quoi que ce soit.
 */
const Z_ZOOM = 3.5
const Z_VOILE = 3

type Props = {
  cartes: readonly CarteAPeindre[]
  /** Les cartes qu'on peut jouer maintenant, dans le même ordre. */
  jouables?: readonly boolean[]
  /** La carte qu'on regarde de près, s'il y en a une. */
  zoomee?: number | null
  onJouer?: (index: number) => void
  onRegarder?: (index: number) => void
  /** La carte a été reposée ailleurs dans la main. */
  onReordonner?: (de: number, vers: number) => void
  onFermerZoom?: () => void
  onPeinte?: () => void
  /** Une carte est tenue au doigt (ou vient d'être lâchée). */
  onSaisie?: (tenue: boolean) => void
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
function placeDansEventail(rang: number, total: number): {
  position: [number, number, number]
  rotation: [number, number, number]
} {
  const centre = (total - 1) / 2
  const ecart = rang - centre
  return {
    position: [ecart * PAS, Y_MAIN - Math.abs(ecart) * CREUX, Z_MAIN + rang * 0.01],
    rotation: [COUCHE, 0, -ecart * INCLINAISON],
  }
}

export function Main3D({
  cartes,
  jouables,
  zoomee = null,
  onJouer,
  onRegarder,
  onReordonner,
  onFermerZoom,
  onPeinte,
  onSaisie,
}: Props): React.JSX.Element {
  const { camera } = useThree()
  const [tenue, setTenue] = useState<number | null>(null)

  // Le parent veut savoir quand on tient une carte : c'est lui qui fait passer
  // la scène devant l'interface le temps du geste.
  useEffect(() => {
    onSaisie?.(tenue !== null)
  }, [tenue, onSaisie])
  const [survolee, setSurvolee] = useState<number | null>(null)
  const [doigt, setDoigt] = useState<THREE.Vector3 | null>(null)

  // L'état du geste en cours. Dans une ref et non dans l'état React : il change
  // à chaque `pointermove` et ne doit pas provoquer de rendu.
  const geste = useRef({
    index: -1,
    depart: { x: 0, y: 0 },
    seuil: SEUIL_SOURIS,
    prise: false,
    minuteur: 0,
    /** De quoi couper l'écoute du geste, quelles que soient les fonctions. */
    stop: null as AbortController | null,
  })

  /**
   * Le plan sur lequel le doigt promène la carte.
   *
   * Un plan parallèle à l'écran, à la profondeur de la main : sans lui, le
   * pointeur ne dit qu'une direction, et la carte irait à l'infini.
   */
  // Le plan est à la profondeur de la carte TENUE, pas à celle de la main :
  // sinon la carte se décale du doigt par parallaxe, d'autant plus qu'on
  // s'éloigne du centre de l'écran.
  const plan = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 0, 1), -Z_TENUE), [])
  const rayon = useMemo(() => new THREE.Raycaster(), [])

  const pointSousLeDoigt = useCallback(
    (e: PointerEvent): THREE.Vector3 | null => {
      const ndc = new THREE.Vector2(
        (e.clientX / window.innerWidth) * 2 - 1,
        -(e.clientY / window.innerHeight) * 2 + 1,
      )
      rayon.setFromCamera(ndc, camera)
      const point = new THREE.Vector3()
      return rayon.ray.intersectPlane(plan, point) === null ? null : point
    },
    [camera, plan, rayon],
  )

  /**
   * Coupe l'écoute du geste en cours. Appelé par le lâcher comme par
   * l'annulation : les deux finissent le geste, ils n'en tirent pas la même
   * conclusion.
   *
   * **PAR `AbortController`, ET SURTOUT PAS PAR `removeEventListener`**, et ça
   * a coûté un bug difficile à lire : les fonctions du geste dépendent de
   * `onJouer`, donc elles sont RECRÉÉES à chaque changement du combat. Un
   * `detacher` qui les retire par référence retirait celles d'avant — les
   * écouteurs posés restaient attachés, s'accumulaient, et c'est le plus
   * ancien qui traitait le geste, avec un état périmé. Il lisait donc la carte
   * au bon index dans la MAUVAISE main : une attaque partait sans cible et ne
   * touchait personne.
   *
   * Keko : « je peux faire une attaque une fois puis ensuite aucune autre,
   * même dans les tours suivants » — exactement le moment où `onJouer` change
   * pour la première fois.
   *
   * *Un signal ne dépend d'aucune identité de fonction* : il coupe ce que ce
   * geste-là a posé, et rien d'autre.
   */
  const detacher = useCallback(() => {
    window.clearTimeout(geste.current.minuteur)
    geste.current.stop?.abort()
    geste.current.stop = null
  }, [])

  /**
   * LE SYSTÈME A REPRIS LE GESTE : on repose la carte, on ne la joue pas.
   *
   * Un `pointercancel` n'est pas un lâcher — c'est le navigateur qui
   * s'approprie le mouvement (défilement, geste système, appel entrant). Le
   * traiter comme un lâcher faisait **jouer la carte dès qu'on la bougeait au
   * doigt**, donc disparaître sans qu'on ait relâché. Keko : « sur le tactile
   * dès que je drag une carte elle disparaît dès que je la bouge même si je ne
   * lâche pas ».
   *
   * La cause première est corrigée ailleurs (`touchAction: 'none'` sur le
   * canvas), mais **une annulation reste possible** — un appel, un geste à
   * deux doigts — et dans ce cas la seule issue juste est de reposer.
   */
  const annuler = useCallback(() => {
    detacher()
    geste.current.index = -1
    geste.current.prise = false
    setTenue(null)
    setDoigt(null)
    setSurvolee(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const relacher = useCallback(
    (e: PointerEvent) => {
      const g = geste.current
      detacher()

      const index = g.index
      const bouge = Math.hypot(e.clientX - g.depart.x, e.clientY - g.depart.y) >= g.seuil
      const point = pointSousLeDoigt(e)
      g.index = -1
      g.prise = false
      setTenue(null)
      setDoigt(null)
      // Au doigt, rien ne viendra éteindre le survol : on le solde ici.
      if (e.pointerType !== 'mouse') setSurvolee(null)
      if (index < 0) return

      // LE DÉPLACEMENT DÉCIDE, PAS LA DURÉE. Une carte prise au maintien puis
      // reposée sans avoir bougé se regarde — il n'existe aucune façon de
      // rater ce geste-là.
      if (!bouge) {
        onRegarder?.(index)
        return
      }
      if (point === null) return
      // C'EST LA HAUTEUR DU DOIGT QUI TRANCHE : au-dessus de la main on joue,
      // dedans on RANGE. Même règle qu'en 2D.
      if (point.y > LIGNE_DE_JEU) onJouer?.(index)
      else onReordonner?.(index, placeSousLeDoigt(point.x, cartes.length - 1))
    },
    // `bouger` et `detacher` sont stables : les fonctions se citent l'une
    // l'autre, et les lister ici les recréerait en boucle.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cartes.length, onJouer, onRegarder, onReordonner, pointSousLeDoigt],
  )

  const bouger = useCallback(
    (e: PointerEvent) => {
      const g = geste.current
      if (g.index < 0) return
      if (!g.prise) {
        const loin = Math.hypot(e.clientX - g.depart.x, e.clientY - g.depart.y) >= g.seuil
        if (!loin) return
        g.prise = true
        window.clearTimeout(g.minuteur)
        setTenue(g.index)
      }
      setDoigt(pointSousLeDoigt(e))
    },
    [pointSousLeDoigt],
  )

  const prendre = useCallback(
    (index: number) => (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation()
      const natif = e.nativeEvent
      const g = geste.current
      // UN GESTE EN COURS EST SOLDÉ AVANT D'EN OUVRIR UN AUTRE. Si un `pointerup`
      // s'est perdu — second doigt, geste système — la carte précédente resterait
      // sortie pour toujours. On ne laisse jamais deux gestes se superposer.
      if (g.index >= 0) annuler()
      detacher()
      g.index = index
      g.depart = { x: natif.clientX, y: natif.clientY }
      g.seuil = natif.pointerType === 'mouse' ? SEUIL_SOURIS : SEUIL_DOIGT
      g.prise = false
      // AU DOIGT, LE MAINTIEN PREND LA CARTE. On appuie, elle monte — sans ça,
      // la dérive d'une tape la ferait passer pour un glisser.
      window.clearTimeout(g.minuteur)
      g.minuteur = window.setTimeout(() => {
        if (geste.current.index !== index) return
        geste.current.prise = true
        setTenue(index)
      }, DELAI_PRISE)

      // LA CAPTURE GARDE LE FLUX D'ÉVÈNEMENTS quand le doigt sort du canvas —
      // et sortir EST le geste. Elle jette si le pointeur n'est plus actif :
      // sans garde, tout le glisser casserait pour un cas sans conséquence.
      try {
        ;(natif.target as Element | null)?.setPointerCapture?.(natif.pointerId)
      } catch {
        /* tant pis : les écouteurs de fenêtre suffisent dans presque tous les cas */
      }

      const stop = new AbortController()
      g.stop = stop
      window.addEventListener('pointermove', bouger, { signal: stop.signal })
      window.addEventListener('pointerup', relacher, { signal: stop.signal })
      window.addEventListener('pointercancel', annuler, { signal: stop.signal })
    },
    [annuler, bouger, relacher, detacher],
  )

  // LES VOISINES SE REFERMENT sur la place de la carte tenue : on range celles
  // qui restent comme si elle n'avait jamais été là. La carte REGARDÉE sort de
  // la main pour la même raison — sa place d'origine n'a plus de sens tant
  // qu'on la tient sous les yeux.
  const sortie = tenue ?? zoomee
  const restantes = cartes.map((_, i) => i).filter((i) => i !== sortie)

  // LA FENTE NE S'OUVRE QUE DANS LA MAIN. Au-dessus de la ligne de jeu, la
  // carte part frapper : écarter ses voisines là-haut annoncerait un rangement
  // qui n'aura pas lieu.
  const fente =
    tenue !== null && doigt !== null && doigt.y <= LIGNE_DE_JEU
      ? placeSousLeDoigt(doigt.x, restantes.length)
      : null

  return (
    <group>
      {/* LE VOILE DU ZOOM. Posé DANS la scène et non en HTML par-dessus :
          au-dessus du canvas, il faudrait le percer pour laisser voir la carte,
          alors qu'ici il suffit de mettre la carte devant. Et comme il
          intercepte les rayons, la main devient insensible sans qu'on touche à
          quoi que ce soit. */}
      {zoomee !== null && (
        <mesh position={[0, 0, Z_VOILE]} onPointerDown={() => onFermerZoom?.()}>
          <planeGeometry args={[40, 24]} />
          <meshBasicMaterial color="#05050a" transparent opacity={0.8} />
        </mesh>
      )}

      {cartes.map((carte, i) => {
        // LA CARTE REGARDÉE vient au centre, droite et grande. Une tape
        // dessus la repose : elle referme ce qu'elle a ouvert.
        if (i === zoomee) {
          return (
            <Carte3D
              key={carte.id}
              carte={carte}
              position={[0, 0, Z_ZOOM]}
              rotation={[0, 0, 0]}
              ressort={14}
              onPeinte={onPeinte}
              onPointerDown={(e) => {
                e.stopPropagation()
                onFermerZoom?.()
              }}
            />
          )
        }
        if (i === tenue) {
          const p = doigt ?? new THREE.Vector3(0, Y_MAIN + 0.4, Z_TENUE)
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
              engagee={p.y > LIGNE_DE_JEU && (jouables?.[i] ?? true)}
              jouable={jouables?.[i] ?? true}
              onPeinte={onPeinte}
            />
          )
        }
        const rang = restantes.indexOf(i)
        const place = placeDansEventail(rang, restantes.length)
        const leve = survolee === i
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
            onPointerOver={(e) => {
              if (e.nativeEvent.pointerType === 'mouse') setSurvolee(i)
            }}
            onPointerOut={(e) => {
              if (e.nativeEvent.pointerType === 'mouse') setSurvolee((s) => (s === i ? null : s))
            }}
          />
        )
      })}
    </group>
  )
}

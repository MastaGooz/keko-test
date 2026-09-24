/**
 * LE GESTE D'UNE CARTE : on la prend, on la promène, on la lâche.
 *
 * Il vivait dans `Main3D`, et il y était enfermé : les emplacements de
 * l'écran de butin ne pouvaient donc ni se zoomer ni se glisser, alors que ce
 * sont les mêmes cartes — Keko : « je ne peux pas cliquer sur le trésor dans
 * le slot de loot pour zoomer ni le drag vers la main ». Le réécrire à côté,
 * c'était garantir qu'un jour les deux divergent : c'est exactement la faute
 * des quatre fonctions qui dessinaient chacune leur carte avant `corpsCarte`.
 *
 * **Le hook ne décide de RIEN.** Il dit seulement « celle-ci est tenue »,
 * « le doigt est là », « elle a été tapée », « elle a été lâchée ici ». Ce
 * que ça veut dire — jouer, ranger, déposer dans un emplacement — appartient à
 * l'écran.
 *
 * Les règles du geste sont celles du jeu 2D, et elles ne se réapprennent pas :
 * elles avaient coûté trois allers-retours avec Keko.
 */
import { useCallback, useMemo, useRef, useState } from 'react'
import { useThree, type ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'

/**
 * CE QUI PREND LA CARTE N'EST PAS LE MÊME AU DOIGT ET À LA SOURIS.
 *
 * À la souris, 8 px suffisent : elle ne dérive pas. Au doigt, si — toujours de
 * quelques pixels — donc un seuil court fait passer les tapes pour des
 * glissers reposés sur place, et *le zoom ne s'ouvre jamais*. Au doigt c'est
 * donc **le maintien** qui prend la carte ; le déplacement reste une seconde
 * porte, mais plus large.
 *
 * *La leçon vaut au-delà de ce cas* : un seuil de distance ne distingue pas
 * une tape d'un glisser sur un écran tactile, il ne fait que déplacer
 * l'ambiguïté. C'est le temps qui les sépare.
 */
const SEUIL_SOURIS = 8
const SEUIL_DOIGT = 16
const DELAI_PRISE = 160

/**
 * LE MAINTIEN N'OUVRE PAS LE ZOOM — ni au doigt, ni à la souris.
 *
 * On appuyait, la carte se soulevait, on relâchait sans avoir bougé et elle
 * s'ouvrait en grand : un geste que personne n'a demandé. Keko : « le zoom
 * doit se déclencher uniquement en clic simple, pas en maintien », puis sur
 * téléphone : « quand je tape une carte longtemps mais que je ne bouge pas au
 * moment où je lâche, ça déclenche le zoom, alors que ça ne devrait pas ».
 *
 * **C'est un retour sur la règle du jeu 2D**, qui disait « le déplacement
 * décide, jamais la durée » de peur que le zoom devienne impossible à ouvrir
 * au doigt. La crainte ne tient plus : là-bas le zoom était le SEUL usage de
 * la tape, ici la carte se prend au maintien et se regarde à la tape — deux
 * gestes, deux réponses. Un appui bref ouvre, un appui long tient.
 */
const DUREE_CLIC = 320

type Options = {
  /**
   * La profondeur du plan sur lequel le doigt promène la carte.
   *
   * Un plan parallèle à l'écran : sans lui, le pointeur ne dit qu'une
   * direction, et la carte irait à l'infini. Il est à la profondeur de la
   * carte TENUE et non à celle d'où elle vient, sinon elle se décale du doigt
   * par parallaxe, d'autant plus qu'on s'éloigne du centre de l'écran.
   */
  z: number
  /** Rien ne se prend pendant qu'une animation se joue. */
  verrou?: boolean
  /** Reposée sans avoir bougé : on la regarde. */
  onTaper?: (index: number) => void
  /**
   * Lâchée après avoir bougé. À l'écran de dire ce que l'endroit veut dire.
   *
   * `depart` est le point où le doigt a PRIS la carte : ce qui décide d'un
   * geste, ce n'est pas une hauteur absolue mais **de combien on a levé**.
   */
  onLacher?: (index: number, point: THREE.Vector3, depart: THREE.Vector3) => void
  /** Le geste se termine, quelle qu'en soit l'issue. `null` = annulé. */
  onFin?: (pointerType: string | null) => void
}

export type Geste = {
  /** L'index de la carte tenue, s'il y en a une. */
  tenue: number | null
  /** Où le doigt la promène, sur le plan `z`. */
  doigt: THREE.Vector3 | null
  /** Où le doigt l'a prise. C'est de là que se mesure ce qu'on a levé. */
  depart: THREE.Vector3 | null
  /** À brancher sur le `pointerdown` de la carte d'index `index`. */
  prendre: (index: number) => (e: ThreeEvent<PointerEvent>) => void
}

export function useGesteCarte({ z, verrou = false, onTaper, onLacher, onFin }: Options): Geste {
  const { camera } = useThree()
  const [tenue, setTenue] = useState<number | null>(null)
  const [doigt, setDoigt] = useState<THREE.Vector3 | null>(null)
  const [depart, setDepart] = useState<THREE.Vector3 | null>(null)

  // L'état du geste en cours. Dans une ref et non dans l'état React : il
  // change à chaque `pointermove` et ne doit pas provoquer de rendu.
  const geste = useRef({
    index: -1,
    depart: { x: 0, y: 0 },
    seuil: SEUIL_SOURIS,
    prise: false,
    minuteur: 0,
    /** Quand le doigt s'est posé : sert à séparer le clic du maintien. */
    debut: 0,
    /** Le point de prise, en coordonnées de scène. */
    ancre: null as THREE.Vector3 | null,
    /** De quoi couper l'écoute du geste, quelles que soient les fonctions. */
    stop: null as AbortController | null,
  })

  const plan = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 0, 1), -z), [z])
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
   * Coupe l'écoute du geste en cours.
   *
   * **PAR `AbortController`, ET SURTOUT PAS PAR `removeEventListener`**, et ça
   * a coûté un bug difficile à lire : les fonctions du geste dépendent des
   * rappels du parent, donc elles sont RECRÉÉES à chaque changement d'état. Un
   * retrait par référence retirait celles d'avant — les écouteurs posés
   * restaient attachés, s'accumulaient, et c'est le plus ancien qui traitait le
   * geste, avec un état périmé. Il lisait donc la carte au bon index dans la
   * MAUVAISE main : une attaque partait sans cible et ne touchait personne.
   *
   * Keko : « je peux faire une attaque une fois puis ensuite aucune autre,
   * même dans les tours suivants » — exactement le moment où le rappel change
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
   * LE SYSTÈME A REPRIS LE GESTE : on repose la carte, on ne la lâche pas.
   *
   * Un `pointercancel` n'est pas un lâcher — c'est le navigateur qui
   * s'approprie le mouvement (défilement, geste système, appel entrant). Le
   * traiter comme un lâcher faisait **jouer la carte dès qu'on la bougeait au
   * doigt**. Keko : « sur le tactile dès que je drag une carte elle disparaît
   * dès que je la bouge même si je ne lâche pas ».
   *
   * La cause première est corrigée ailleurs (`touch-action: none` sur le
   * canvas), mais **une annulation reste possible**, et la seule issue juste
   * est alors de reposer.
   */
  const annuler = useCallback(() => {
    detacher()
    geste.current.index = -1
    geste.current.prise = false
    setTenue(null)
    setDoigt(null)
    setDepart(null)
    onFin?.(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const relacher = useCallback(
    (e: PointerEvent) => {
      const g = geste.current
      detacher()

      const index = g.index
      const bouge = Math.hypot(e.clientX - g.depart.x, e.clientY - g.depart.y) >= g.seuil
      const point = pointSousLeDoigt(e)
      const ancre = g.ancre
      g.index = -1
      g.prise = false
      g.ancre = null
      setTenue(null)
      setDoigt(null)
      setDepart(null)
      onFin?.(e.pointerType)
      if (index < 0) return

      // REPOSÉE SANS AVOIR BOUGÉ : on la regarde, mais seulement si l'appui
      // était bref. Un maintien n'est pas une tape — c'est la prise en main,
      // et la relâcher ne demande rien.
      if (!bouge) {
        if (performance.now() - g.debut <= DUREE_CLIC) onTaper?.(index)
        return
      }
      if (point === null || ancre === null) return
      onLacher?.(index, point, ancre)
    },
    // `detacher` est stable ; le citer entre fonctions les recréerait en boucle.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [onTaper, onLacher, onFin, pointSousLeDoigt],
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
      if (verrou) return
      e.stopPropagation()
      const natif = e.nativeEvent
      const g = geste.current
      // UN GESTE EN COURS EST SOLDÉ AVANT D'EN OUVRIR UN AUTRE. Si un
      // `pointerup` s'est perdu — second doigt, geste système — la carte
      // précédente resterait sortie pour toujours.
      if (g.index >= 0) annuler()
      detacher()
      g.index = index
      g.depart = { x: natif.clientX, y: natif.clientY }
      g.ancre = pointSousLeDoigt(natif)
      setDepart(g.ancre)
      g.seuil = natif.pointerType === 'mouse' ? SEUIL_SOURIS : SEUIL_DOIGT
      g.prise = false
      g.debut = performance.now()
      // AU DOIGT, LE MAINTIEN PREND LA CARTE. On appuie, elle se soulève. À la
      // souris, seul le déplacement la prend : elle ne dérive pas.
      window.clearTimeout(g.minuteur)
      if (natif.pointerType !== 'mouse') {
        g.minuteur = window.setTimeout(() => {
          if (geste.current.index !== index) return
          geste.current.prise = true
          setTenue(index)
        }, DELAI_PRISE)
      }

      // LA CAPTURE GARDE LE FLUX D'ÉVÈNEMENTS quand le doigt sort du canvas —
      // et sortir EST le geste. Elle jette si le pointeur n'est plus actif :
      // sans garde, tout le glisser casserait pour un cas sans conséquence.
      try {
        ;(natif.target as Element | null)?.setPointerCapture?.(natif.pointerId)
      } catch {
        /* tant pis : les écouteurs de fenêtre suffisent dans presque tous les cas */
      }

      // LE SUIVI EST POSÉ SUR LA FENÊTRE, pas sur la carte : le doigt en sort
      // forcément. La capture devrait y suffire, mais elle peut échouer.
      const stop = new AbortController()
      g.stop = stop
      window.addEventListener('pointermove', bouger, { signal: stop.signal })
      window.addEventListener('pointerup', relacher, { signal: stop.signal })
      window.addEventListener('pointercancel', annuler, { signal: stop.signal })
    },
    [annuler, bouger, relacher, detacher, pointSousLeDoigt, verrou],
  )

  return { tenue, doigt, depart, prendre }
}

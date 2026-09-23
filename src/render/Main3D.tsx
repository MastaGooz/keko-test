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
 * Ce qui change par rapport au 2D, et c'est un gain : **la main est inclinée
 * vers le joueur**. En CSS, l'éventail était plaqué et la carte plongeait sous
 * le bord de l'écran pour gagner en taille. Ici la perspective fait le travail
 * — les cartes du fond sont plus petites parce qu'elles sont plus loin.
 */
import { useCallback, useMemo, useRef, useState } from 'react'
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
 */
const PAS = 0.72
const CREUX = 0.1
const INCLINAISON = 0.09

/**
 * Où la main se pose, et de combien elle se couche vers le joueur.
 *
 * LA CARTE PLONGE SOUS LE BORD BAS, comme en 2D : au repos on n'en voit que le
 * haut, et c'est ce qui permet de la faire grande sans lui donner tout
 * l'écran. La part enfouie vaut ici ~20 %, contre 24 % sur un téléphone en 2D.
 */
const Y_MAIN = -1
const Z_MAIN = 1.1
const COUCHE = 0.52

/**
 * La hauteur à partir de laquelle lâcher JOUE la carte.
 *
 * Au-dessus de la main, on joue ; dedans, on range. Même règle qu'en 2D, et
 * elle est la seule qui ne demande aucune cible à viser — donc la seule qui
 * marche avant que les ennemis existent.
 */
const LIGNE_DE_JEU = -0.35

type Props = {
  cartes: readonly CarteAPeindre[]
  onJouer?: (index: number) => void
  onRegarder?: (index: number) => void
  onPeinte?: () => void
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

export function Main3D({ cartes, onJouer, onRegarder, onPeinte }: Props): React.JSX.Element {
  const { camera } = useThree()
  const [tenue, setTenue] = useState<number | null>(null)
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
  })

  /**
   * Le plan sur lequel le doigt promène la carte.
   *
   * Un plan parallèle à l'écran, à la profondeur de la main : sans lui, le
   * pointeur ne dit qu'une direction, et la carte irait à l'infini.
   */
  const plan = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 0, 1), -Z_MAIN), [])
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

  const relacher = useCallback(
    (e: PointerEvent) => {
      const g = geste.current
      window.clearTimeout(g.minuteur)
      window.removeEventListener('pointermove', bouger)
      window.removeEventListener('pointerup', relacher)
      window.removeEventListener('pointercancel', relacher)

      const index = g.index
      const bouge = Math.hypot(e.clientX - g.depart.x, e.clientY - g.depart.y) >= g.seuil
      const point = pointSousLeDoigt(e)
      g.index = -1
      g.prise = false
      setTenue(null)
      setDoigt(null)
      if (index < 0) return

      // LE DÉPLACEMENT DÉCIDE, PAS LA DURÉE. Une carte prise au maintien puis
      // reposée sans avoir bougé se regarde — il n'existe aucune façon de
      // rater ce geste-là.
      if (!bouge) {
        onRegarder?.(index)
        return
      }
      if (point !== null && point.y > LIGNE_DE_JEU) onJouer?.(index)
    },
    // `bouger` est défini plus bas et stable : les deux se citent l'un l'autre.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [onJouer, onRegarder, pointSousLeDoigt],
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

      window.addEventListener('pointermove', bouger)
      window.addEventListener('pointerup', relacher)
      window.addEventListener('pointercancel', relacher)
    },
    [bouger, relacher],
  )

  // LES VOISINES SE REFERMENT sur la place de la carte tenue : on range celles
  // qui restent comme si elle n'avait jamais été là.
  const restantes = cartes.map((_, i) => i).filter((i) => i !== tenue)

  return (
    <group>
      {cartes.map((carte, i) => {
        if (i === tenue) {
          const p = doigt ?? new THREE.Vector3(0, Y_MAIN + 0.4, Z_MAIN)
          return (
            <Carte3D
              key={carte.nom + i}
              carte={carte}
              position={[p.x, p.y, Z_MAIN + 0.35]}
              rotation={[0.08, 0, 0]}
              taille={1.05}
              ressort={22}
              onPeinte={onPeinte}
            />
          )
        }
        const rang = restantes.indexOf(i)
        const place = placeDansEventail(rang, restantes.length)
        const leve = survolee === i
        return (
          <Carte3D
            key={carte.nom + i}
            carte={carte}
            position={[
              place.position[0],
              place.position[1] + (leve ? HAUT * 0.22 : 0),
              place.position[2] + (leve ? 0.12 : 0),
            ]}
            rotation={leve ? [COUCHE * 0.45, 0, place.rotation[2] * 0.3] : place.rotation}
            taille={leve ? 1.08 : 1}
            onPeinte={onPeinte}
            onPointerDown={prendre(i)}
            onPointerOver={() => setSurvolee(i)}
            onPointerOut={() => setSurvolee((s) => (s === i ? null : s))}
          />
        )
      })}
    </group>
  )
}

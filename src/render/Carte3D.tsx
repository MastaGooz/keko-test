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
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import type { CarteAPeindre } from './texture-carte.ts'
import { textureDeCarte } from './texture-carte.ts'

/** La carte fait 1 de large ; le reste en découle, comme dans le gabarit. */
export const LARGE = 1
export const HAUT = 1.4
const EPAISSEUR = 0.012

type Props = {
  carte: CarteAPeindre
  position: [number, number, number]
  /** Inclinaison voulue, en radians. */
  rotation?: [number, number, number]
  taille?: number
  /** Vitesse de rattrapage. Plus haut = plus sec. */
  ressort?: number
  /**
   * La carte est au-dessus de la zone qui la joue : elle s'allume et frémit.
   *
   * **C'est le seul repère possible ici**, et c'est la règle du jeu 2D : la
   * zone qui déclenche n'a pas de bord à surligner — elle est tout l'écran
   * au-dessus de la main — donc le repère doit voyager avec le doigt.
   */
  engagee?: boolean
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
  engagee = false,
  onPeinte,
  onPointerDown,
  onPointerOver,
  onPointerOut,
}: Props): React.JSX.Element {
  const groupe = useRef<THREE.Group>(null)

  const { face, laiton, halo, lueur, nimbe, materiaux } = useMemo(() => {
    const laiton = new THREE.MeshStandardMaterial({
      color: '#b79a6a',
      metalness: 0.85,
      roughness: 0.38,
      emissive: '#ffcf7a',
      emissiveIntensity: 0,
    })
    // Tant que la texture n'est pas peinte, la face est sombre et mate : une
    // carte blanche qui vire à l'illustration se verrait comme un défaut.
    const face = new THREE.MeshStandardMaterial({
      color: '#1a1b20',
      roughness: 0.55,
      metalness: 0.15,
      emissive: '#ffcf7a',
      emissiveIntensity: 0,
    })
    // L'ordre des faces d'un pavé dans three : droite, gauche, haut, bas,
    // AVANT, arrière. Seule l'avant porte la carte.
    // LE CONTOUR : deux plans posés DERRIÈRE la carte, un peu plus grands
    // qu'elle. Ce qui dépasse fait le liseré. `toneMapped: false` pour qu'il
    // reste franc au lieu d'être ramené dans la plage du reste de la scène, et
    // `depthWrite: false` pour qu'il n'occulte pas ce qui passe derrière.
    const halo = new THREE.MeshBasicMaterial({
      // DORÉ, PAS BLEU. Le bleu est la couleur du joueur dans le jeu 2D, mais
      // sur une carte il jure avec le laiton du cadre : le contour se lisait
      // comme un liseré rapporté, pas comme la carte qui s'échauffe. L'or est
      // déjà sa matière. Keko : « je voyais un contour doré/lumineux plutôt que
      // bleu ».
      color: '#ffe9ae',
      transparent: true,
      opacity: 0,
      toneMapped: false,
      depthWrite: false,
    })
    // LES COUCHES DE DIFFUSION, additives et de plus en plus faibles. Deux
    // plutôt qu'une : à une seule, on lisait un SECOND RECTANGLE net posé
    // autour du premier, pas une lumière. Un dégradé échelonné, même grossier,
    // se lit comme un halo — l'oeil ne compte pas les paliers.
    const lueur = new THREE.MeshBasicMaterial({
      color: '#ffb958',
      transparent: true,
      opacity: 0,
      toneMapped: false,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
    const nimbe = new THREE.MeshBasicMaterial({
      color: '#c4761c',
      transparent: true,
      opacity: 0,
      toneMapped: false,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
    return { face, laiton, halo, lueur, nimbe, materiaux: [laiton, laiton, laiton, laiton, face, laiton] }
  }, [])

  useEffect(() => {
    let vivant = true
    // LA TEXTURE VIENT D'UN CACHE PARTAGÉ : deux cartes du même modèle se la
    // prêtent, et une carte remontée la retrouve déjà prête — donc elle ne
    // repasse jamais par son état sombre. Rien n'est libéré ici pour la même
    // raison : elle ne nous appartient pas.
    void textureDeCarte(carte).then((texture) => {
      if (!vivant) return
      face.map = texture
      face.color.set('#ffffff')
      face.needsUpdate = true
      onPeinte?.()
    })
    return () => {
      vivant = false
    }
    // `onPeinte` volontairement hors des dépendances : une fonction recréée à
    // chaque rendu du parent repeindrait la carte en boucle.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [carte, face])

  /**
   * La place LISSÉE, tenue à part de celle du groupe.
   *
   * Sans elle, le frémissement serait mangé par l'amortissement : on
   * l'ajouterait à la position, et l'image suivante la ramènerait vers la
   * cible en croyant corriger un écart. *Le tremblement se pose PAR-DESSUS le
   * mouvement, il n'en fait pas partie.*
   */
  const lisse = useRef({ p: new THREE.Vector3(...position), r: new THREE.Euler(...rotation), t: taille, feu: 0 })

  // ELLE REJOINT SA PLACE, elle n'y saute pas. L'amortissement exponentiel est
  // indépendant de la fréquence d'écran : à 120 Hz comme à 60, le mouvement
  // dure le même temps.
  useFrame((etat, delta) => {
    const g = groupe.current
    if (g === null) return
    const k = 1 - Math.exp(-ressort * delta)
    const l = lisse.current
    l.p.x += (position[0] - l.p.x) * k
    l.p.y += (position[1] - l.p.y) * k
    l.p.z += (position[2] - l.p.z) * k
    l.r.x += (rotation[0] - l.r.x) * k
    l.r.y += (rotation[1] - l.r.y) * k
    l.r.z += (rotation[2] - l.r.z) * k
    l.t += (taille - l.t) * k

    // LE FRÉMISSEMENT : court, rapide, et de deux fréquences qui ne retombent
    // jamais en phase — sinon il se lit comme un balancement régulier, donc
    // comme une animation, et non comme une carte qui vibre d'impatience.
    const feuVise = engagee ? 1 : 0
    l.feu += (feuVise - l.feu) * (1 - Math.exp(-12 * delta))
    const t = etat.clock.elapsedTime
    const amp = l.feu * 0.014

    g.position.set(l.p.x + Math.sin(t * 37) * amp, l.p.y + Math.cos(t * 29) * amp, l.p.z)
    g.rotation.set(l.r.x, l.r.y, l.r.z + Math.sin(t * 23) * l.feu * 0.018)
    g.scale.setScalar(l.t)

    // ET LE CONTOUR S'ALLUME. **Rien ne touche plus à la carte elle-même** :
    // une émission, même faible, lave l'illustration au moment précis où l'on
    // décide de la jouer. Keko : « plutôt qu'une lueur sur la carte on peut pas
    // un contour brillant ? ». La lumière est donc DERRIÈRE, et ce qui dépasse
    // fait le liseré.
    face.emissiveIntensity = 0
    laiton.emissiveIntensity = l.feu * 0.35
    halo.opacity = l.feu * 0.95
    // Les diffusions sont montées d'un tiers depuis le passage à l'or : en
    // mélange additif sur un fond noir, un or chaud rend nettement moins fort
    // qu'un bleu clair à opacité égale.
    lueur.opacity = l.feu * 0.34
    nimbe.opacity = l.feu * 0.18
  })

  return (
    <group ref={groupe} position={position}>
      {/* LE CONTOUR, derrière la carte : deux plans un peu plus grands qu'elle,
          dont seul le débord se voit. Ils ne captent pas le pointeur — sans
          `raycast` neutralisé, ils élargiraient la zone sensible de la carte
          d'un liseré invisible au repos. */}
      <mesh position={[0, 0, -EPAISSEUR]} material={halo} raycast={() => null}>
        <planeGeometry args={[LARGE + 0.038, HAUT + 0.038]} />
      </mesh>
      <mesh position={[0, 0, -EPAISSEUR * 1.5]} material={lueur} raycast={() => null}>
        <planeGeometry args={[LARGE + 0.13, HAUT + 0.13]} />
      </mesh>
      <mesh position={[0, 0, -EPAISSEUR * 2]} material={nimbe} raycast={() => null}>
        <planeGeometry args={[LARGE + 0.3, HAUT + 0.3]} />
      </mesh>

      {/* ELLE PROJETTE UNE OMBRE, ELLE N'EN REÇOIT PAS. Une carte qui reçoit
          des ombres reçoit aussi la SIENNE : à faible précision de carte
          d'ombre — ce qui est le cas sur un téléphone — ça se voit comme des
          taches sombres sur sa propre face, d'autant plus qu'elle est proche
          de la caméra. Le sol reçoit les ombres, c'est tout ce qu'il faut. */}
      <mesh
        castShadow
        material={materiaux}
        onPointerDown={onPointerDown}
        onPointerOver={onPointerOver}
        onPointerOut={onPointerOut}
      >
        <boxGeometry args={[LARGE, HAUT, EPAISSEUR]} />
      </mesh>
    </group>
  )
}

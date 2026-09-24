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
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import type { CarteAPeindre } from './texture-carte.ts'
import { DEBORD_CONTOUR, textureContour, textureDeCarte } from './texture-carte.ts'

/** La carte fait 1 de large ; le reste en découle, comme dans le gabarit. */
export const LARGE = 1
export const HAUT = 1.4
const EPAISSEUR = 0.012

/** Le rayon des coins : 3 % de la largeur, comme le `border-radius` du gabarit. */
export const RAYON_COIN = 0.03

/**
 * LA CARTE EST FAITE DE DEUX PIÈCES, et c'est ce qui donne les coins ronds.
 *
 * Un pavé aux arêtes arrondies porte le laiton — c'est le CORPS, avec sa
 * tranche — et un plan posé un cheveu devant porte la face peinte, dont les
 * coins sont transparents (la texture est peinte dans un rectangle arrondi,
 * et `alphaTest` coupe ce qui est hors du dessin). Aux coins, le plan laisse
 * donc voir le laiton arrondi du corps : le cadre déborde d'un cheveu, comme
 * la coque du gabarit 2D.
 *
 * Pourquoi pas un seul pavé arrondi texturé : `RoundedBoxGeometry` n'a pas de
 * groupes de matériaux, donc la face et la tranche partageraient la même
 * texture — et on perdrait la tranche de laiton, la seule chose qui rende le
 * volume lisible. Keko : « il faudrait arrondir un peu le bord des cartes ».
 *
 * Les géométries sont partagées par toutes les cartes : elles ne changent
 * jamais.
 */
const GEOMETRIE_CORPS = new RoundedBoxGeometry(LARGE, HAUT, EPAISSEUR, 2, RAYON_COIN)
const GEOMETRIE_FACE = new THREE.PlaneGeometry(LARGE, HAUT)

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
  /**
   * Elle peut être jouée maintenant. Une carte trop chère reste **saisissable
   * et zoomable** — on veut pouvoir la ranger et la regarder — mais elle
   * s'éteint, et lâcher ne déclenche rien.
   */
  jouable?: boolean
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
  jouable = true,
  onPeinte,
  onPointerDown,
  onPointerOver,
  onPointerOut,
}: Props): React.JSX.Element {
  const groupe = useRef<THREE.Group>(null)

  const { face, laiton, halo } = useMemo(() => {
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
      color: '#ffffff',
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
    face.onBeforeCompile = (nuanceur) => {
      nuanceur.uniforms.uGris = { value: 0 }
      face.userData.nuanceur = nuanceur
      nuanceur.fragmentShader = nuanceur.fragmentShader.replace(
        '#include <map_fragment>',
        `#include <map_fragment>
         float luminance = dot(diffuseColor.rgb, vec3(0.2126, 0.7152, 0.0722));
         diffuseColor.rgb = mix(diffuseColor.rgb, vec3(luminance), uGris);`,
      )
      nuanceur.fragmentShader = `uniform float uGris;
${nuanceur.fragmentShader}`
    }
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
    return { face, laiton, halo }
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
  const lisse = useRef({
    p: new THREE.Vector3(...position),
    r: new THREE.Euler(...rotation),
    t: taille,
    feu: 0,
    /** L'éclat de la carte : 1 quand elle est jouable, moins quand elle est éteinte. */
    vif: 1,
  })

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
    face.color.setScalar(l.vif)
    laiton.color.setRGB(0.718 * l.vif, 0.604 * l.vif, 0.416 * l.vif)

    // La désaturation suit le même amortissement : la carte s'éteint ET perd
    // ses couleurs d'un seul mouvement.
    const gris = (1 - l.vif) / (1 - 0.52)
    const nuanceur = face.userData.nuanceur as { uniforms: { uGris: { value: number } } } | undefined
    if (nuanceur !== undefined) nuanceur.uniforms.uGris.value = gris

    face.emissiveIntensity = 0
    laiton.emissiveIntensity = 0
    // LE LISERÉ RESPIRE, à peine : c'est ce qui le fait lire comme une lumière
    // et non comme un trait peint. Sur la même horloge que le frémissement,
    // mais bien plus lente — deux battements rapides se liraient comme un
    // clignotement d'alerte.
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

      {/* LE CORPS : le laiton, tranche et coins arrondis compris. C'est lui
          qui porte les évènements — il couvre toute la carte.

          ELLE PROJETTE UNE OMBRE, ELLE N'EN REÇOIT PAS. Une carte qui reçoit
          des ombres reçoit aussi la SIENNE : à faible précision de carte
          d'ombre — ce qui est le cas sur un téléphone — ça se voit comme des
          taches sombres sur sa propre face, d'autant plus qu'elle est proche
          de la caméra. Le sol reçoit les ombres, c'est tout ce qu'il faut. */}
      <mesh
        castShadow
        geometry={GEOMETRIE_CORPS}
        material={laiton}
        onPointerDown={onPointerDown}
        onPointerOver={onPointerOver}
        onPointerOut={onPointerOut}
      >
        {/* LA FACE : la carte peinte, un cheveu devant le corps. Ses coins
            transparents laissent voir le laiton arrondi derrière. */}
        <mesh geometry={GEOMETRIE_FACE} material={face} position={[0, 0, EPAISSEUR / 2 + 0.001]} raycast={() => null} />
      </mesh>
    </group>
  )
}

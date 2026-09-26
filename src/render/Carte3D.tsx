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
import {
  DEBORD_CONTOUR,
  signature,
  textureContour,
  textureDeCarte,
  textureDuDos,
} from './texture-carte.ts'

/** La carte fait 1 de large ; le reste en découle, comme dans le gabarit. */
/** Ce que dure l'éclat d'une carte qui vient d'arriver, en secondes. */
export const DUREE_APPARITION = 0.4

export const LARGE = 1
export const HAUT = 1.4
const EPAISSEUR = 0.012

/** Le rayon des coins : 3 % de la largeur, comme le `border-radius` du gabarit. */
export const RAYON_COIN = 0.03

/**
 * LA CARTE EST FAITE DE DEUX PIÈCES, et c'est ce qui donne les coins ronds.
 *
 * Une forme 2D aux coins arrondis, EXTRUDÉE de l'épaisseur, porte le laiton —
 * c'est le CORPS, avec sa tranche — et un plan posé un cheveu devant porte la
 * face peinte, dont les coins sont transparents (la texture est peinte dans
 * un rectangle arrondi, et `alphaTest` coupe ce qui est hors du dessin). Aux
 * coins, le plan laisse donc voir le laiton arrondi du corps : le cadre
 * déborde d'un cheveu, comme la coque du gabarit 2D.
 *
 * **Pas `RoundedBoxGeometry`, et ça a coûté un aller-retour** : elle arrondit
 * dans les TROIS dimensions et borne son rayon par la plus petite — ici
 * l'épaisseur, 0,012. Le rayon demandé (0,03) était écrasé à presque rien :
 * les coins du corps restaient droits pendant que la face, elle, était bien
 * arrondie. Keko : « on voit que la bordure a été arrondie, mais derrière une
 * autre forme dorée reste et est un angle droit ». *Une carte est une forme
 * plate avec une épaisseur, pas un volume aux arêtes molles* — l'extrusion
 * dit exactement ça.
 *
 * Pourquoi pas la face directement sur l'extrusion : ses UV sont en
 * coordonnées de scène, pas de 0 à 1, donc la texture s'y plaquerait de
 * travers. Le plan devant garde des UV propres.
 *
 * Les géométries sont partagées par toutes les cartes : elles ne changent
 * jamais.
 */
function formeDeCarte(): THREE.Shape {
  const l = LARGE / 2
  const h = HAUT / 2
  const r = RAYON_COIN
  const forme = new THREE.Shape()
  forme.moveTo(-l + r, -h)
  forme.lineTo(l - r, -h)
  forme.absarc(l - r, -h + r, r, -Math.PI / 2, 0, false)
  forme.lineTo(l, h - r)
  forme.absarc(l - r, h - r, r, 0, Math.PI / 2, false)
  forme.lineTo(-l + r, h)
  forme.absarc(-l + r, h - r, r, Math.PI / 2, Math.PI, false)
  forme.lineTo(-l, -h + r)
  forme.absarc(-l + r, -h + r, r, Math.PI, (3 * Math.PI) / 2, false)
  return forme
}

const GEOMETRIE_CORPS = new THREE.ExtrudeGeometry(formeDeCarte(), {
  depth: EPAISSEUR,
  bevelEnabled: false,
  curveSegments: 8,
})
// L'extrusion part de z = 0 vers l'avant : on la recentre sur l'épaisseur,
// pour que la face posée à +EPAISSEUR/2 affleure bien le corps.
GEOMETRIE_CORPS.translate(0, 0, -EPAISSEUR / 2)
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
   * La vitesse de rattrapage de la PROFONDEUR, quand elle doit être plus vive
   * que le reste.
   *
   * **La profondeur n'est pas une position, c'est un ordre** : une carte est
   * devant sa voisine ou elle ne l'est pas. Amortie au même rythme que le
   * mouvement, elle traîne — la carte survolée avait repris sa place dans
   * l'éventail que sa voisine ne repassait devant elle qu'un instant après.
   * Keko : « elle repasse un peu tard à sa position en depth ».
   *
   * Reste réglable plutôt que fixé, parce que les grands déplacements en z —
   * la carte qu'on regarde de près, celle qu'on tient — ont besoin, eux, de
   * voyager avec le reste.
   */
  ressortZ?: number
  /**
   * UN JETON QUI DIT « CETTE FOIS, NE GLISSE PAS ».
   *
   * L'amortissement est juste quand une carte VA quelque part — on la suit du
   * regard. Il ment quand c'est le CONTENU qui change sous elle : le coffre
   * qui défile d'une ligne garde ses cartes du milieu, qui glissaient donc
   * vers le haut, pendant que la ligne entrante naissait déjà en place. Keko :
   * « la ligne du bas change de cartes instantanément tandis que les deux
   * autres au-dessus se déplacent ».
   *
   * *Une grille qui défile par lignes tourne une page, elle ne fait pas un
   * travelling.* Dès que ce jeton change, la carte se pose d'un coup à sa
   * place — et tout le monde saute ensemble.
   */
  saut?: unknown
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
  /**
   * Elle porte son ombre. Vrai partout sauf pour une carte qui flotte SEULE
   * au-dessus du décor : son ombre tombe alors en plein champ, loin d'elle,
   * et ne se lit plus comme une ombre mais comme une tache noire. *Une carte
   * de la main s'en tire parce que ses voisines reçoivent la sienne.*
   */
  ombre?: boolean
  /**
   * Elle est en train de se faire jeter : **le contour passe au ROUGE, et la
   * carte reste ENTIÈRE.**
   *
   * Elle a été assombrie et désaturée dans le jeu 2D, et Keko l'a repris : « au
   * lieu de la foncer, on devrait mettre une lueur rouge autour ». Une carte
   * éteinte se lit comme déjà perdue, alors qu'elle ne l'est pas — et on doit
   * pouvoir la LIRE avant de valider.
   *
   * Elle ne frémit pas : le frémissement dit « lâche et ça part », c'est le
   * vocabulaire d'un geste en cours. Une carte posée dans le rebut attend, elle
   * ne s'impatiente pas.
   */
  peril?: boolean
  /**
   * Elle montre son DOS et non sa face. Le dos est peint par le même module,
   * depuis la même anatomie : *c'est la même carte vue de l'autre côté*, pas
   * un second objet.
   */
  dos?: boolean
  /**
   * L'instant où elle vient d'arriver dans la main, en secondes d'horloge de
   * la scène.
   *
   * **ELLE NAÎT LUMINEUSE ET PREND SON IMAGE ENSUITE** — Keko : « la carte
   * apparaît lumineuse et prend son image ensuite, un truc fluide ». La
   * traînée de particules meurt à l'endroit exact où elle se forme, donc la
   * lumière fait la couture entre les deux : *sans elle, la carte
   * apparaîtrait, ce qui est précisément ce qu'on voulait éviter.*
   *
   * Elle naît À SA PLACE, avec l'inclinaison de l'éventail — c'est tout
   * l'intérêt de ne plus faire voyager la carte elle-même : une carte qu'on
   * déplace arrive droite et bascule après coup.
   */
  apparue?: number | null
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
  ressortZ,
  engagee = false,
  jouable = true,
  ombre = true,
  peril = false,
  dos = false,
  saut = null,
  apparue = null,
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
      // SOMBRE TANT QUE LA TEXTURE N'EST PAS LÀ. En blanc, une carte dont la
      // peinture tarde ou échoue est une dalle éclatante au milieu de la main,
      // et on croit à un bug de rendu plutôt qu'à une image manquante — c'est
      // la règle déjà écrite pour les créatures. Le `useFrame` rend sa couleur
      // à la carte dès que sa texture arrive.
      color: '#1b1a22',
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
    /**
     * SANS CETTE CLÉ, DEUX MATÉRIAUX PEUVENT PARTAGER UN PROGRAMME QUI N'EST
     * PAS LE LEUR.
     *
     * three met les programmes compilés en cache, et **sa clé ignore ce que
     * `onBeforeCompile` a injecté** : deux `MeshStandardMaterial` de mêmes
     * réglages y sont indiscernables, même si l'un a reçu trois lignes de
     * nuanceur et l'autre non. Celui qui hérite du mauvais programme sort une
     * carte uniformément blanche ou noire — *et seulement parfois*, puisque ça
     * dépend de l'ordre dans lequel ils ont été compilés.
     *
     * C'est le correctif que three prescrit dès qu'on touche au nuanceur.
     */
    face.customProgramCacheKey = () => 'carte-face-desaturable'
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

  /**
   * UNE PETITE CARTE PREND UNE PETITE TEXTURE.
   *
   * À 0,44 de large — la case du coffre — une carte fait une centaine de
   * pixels à l'écran pour une texture de 768 : le GPU la minifie de deux
   * niveaux et demi et **mélange deux étages de mipmap**, dont un plus petit
   * qu'elle. Keko : « pourquoi les cartes réduites sont floues ? » *Ce n'était
   * pas la peinture, c'était la minification.*
   *
   * Le seuil est celui du chargement : au-dessus, la carte se lit en grand et
   * mérite sa pleine résolution. Une carte qui grandit en cours de geste
   * change de texture en chemin — elle y GAGNE en netteté, donc le relais se
   * lit dans le bon sens.
   */
  const petite = taille < 0.6

  useEffect(() => {
    let vivant = true
    // LA TEXTURE VIENT D'UN CACHE PARTAGÉ : deux cartes du même modèle se la
    // prêtent, et une carte remontée la retrouve déjà prête — donc elle ne
    // repasse jamais par son état sombre. Rien n'est libéré ici pour la même
    // raison : elle ne nous appartient pas.
    void (dos ? textureDuDos() : textureDeCarte(carte, petite))
      .then((texture) => {
        if (!vivant) return
        face.map = texture
        face.needsUpdate = true
        onPeinte?.()
      })
      // L'échec est déjà signalé par le cache, qui s'y vide pour permettre une
      // nouvelle tentative. Ici on absorbe seulement le rejet : sans ça il
      // remonterait en « unhandled rejection », du bruit qui masquerait la vraie
      // ligne.
      .catch(() => {})
    return () => {
      vivant = false
    }
    // ON DÉPEND DE LA SIGNATURE DU MODÈLE, PAS DE L'OBJET, et ça a coûté une
    // page figée. Un parent qui construit sa carte à la volée
    // (`aPeindre(phase.loot)`) en fabrique une NOUVELLE à chaque rendu : l'effet
    // se relançait, `onPeinte` incrémentait un compteur d'état, le rendu
    // repartait — boucle infinie, sans une seule erreur en console. *Une
    // dépendance d'effet ne doit jamais être un objet qu'on vient de
    // construire*, et ici la bonne clé est celle du cache de textures.
    //
    // `onPeinte` reste volontairement hors des dépendances, pour la même
    // famille de raison : une fonction recréée à chaque rendu du parent
    // repeindrait la carte en boucle.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature(carte), face, dos, petite])

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
  const jeton = useRef(saut)

  useFrame((etat, delta) => {
    const g = groupe.current
    if (g === null) return
    // LE SAUT D'ABORD : la place lissée rejoint sa cible sans transition, et
    // l'amortissement qui suit n'a plus rien à rattraper.
    if (jeton.current !== saut) {
      jeton.current = saut
      lisse.current.p.set(position[0], position[1], position[2])
      lisse.current.r.set(rotation[0], rotation[1], rotation[2])
      lisse.current.t = taille
    }
    const k = 1 - Math.exp(-ressort * delta)
    const kz = 1 - Math.exp(-(ressortZ ?? ressort) * delta)
    const l = lisse.current
    l.p.x += (position[0] - l.p.x) * k
    l.p.y += (position[1] - l.p.y) * k
    l.p.z += (position[2] - l.p.z) * kz
    l.r.x += (rotation[0] - l.r.x) * k
    l.r.y += (rotation[1] - l.r.y) * k
    l.r.z += (rotation[2] - l.r.z) * k
    l.t += (taille - l.t) * k

    // LE FRÉMISSEMENT : court, rapide, et de deux fréquences qui ne retombent
    // jamais en phase — sinon il se lit comme un balancement régulier, donc
    // comme une animation, et non comme une carte qui vibre d'impatience.
    const feuVise = engagee || peril ? 1 : 0
    l.feu += (feuVise - l.feu) * (1 - Math.exp(-12 * delta))
    const t = etat.clock.elapsedTime
    // **LE FRÉMISSEMENT SUIT `engagee`, LA COULEUR SUIT `peril`**, et les deux
    // se cumulent. Le péril coupait le tremblement, ce qui était juste pour
    // une carte POSÉE dans le rebut — elle n'est plus dans un geste — mais
    // faux pour une carte qu'on TIENT au-dessus de lui : là on est en plein
    // geste, et Keko veut qu'elle vibre en rouge. *Un état dit ce qui va
    // arriver, l'autre dit qu'on est en train de le faire.*
    const amp = engagee ? l.feu * 0.014 : 0

    g.position.set(l.p.x + Math.sin(t * 37) * amp, l.p.y + Math.cos(t * 29) * amp, l.p.z)
    g.rotation.set(l.r.x, l.r.y, l.r.z + (engagee ? Math.sin(t * 23) * l.feu * 0.018 : 0))
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
    // La couleur MULTIPLIE la texture : sans texture, la laisser monter à 1
    // donnerait une dalle blanche. On attend qu'il y ait quelque chose à
    // éclairer.
    if (face.map !== null) face.color.setScalar(l.vif)
    laiton.color.setRGB(0.718 * l.vif, 0.604 * l.vif, 0.416 * l.vif)

    // La désaturation suit le même amortissement : la carte s'éteint ET perd
    // ses couleurs d'un seul mouvement.
    const gris = (1 - l.vif) / (1 - 0.52)
    const nuanceur = face.userData.nuanceur as { uniforms: { uGris: { value: number } } } | undefined
    if (nuanceur !== undefined) nuanceur.uniforms.uGris.value = gris

    // L'APPARITION : la carte s'allume, puis la lumière tombe et l'image
    // prend le dessus. Elle grandit d'un cheveu en même temps — sans ça,
    // l'éclat se lirait comme un reflet plutôt que comme une naissance.
    let eclat = 0
    if (apparue !== null) {
      const dt = etat.clock.elapsedTime - apparue
      if (dt >= 0 && dt < DUREE_APPARITION) {
        const k = dt / DUREE_APPARITION
        eclat = (1 - k) * (1 - k)
        g.scale.setScalar(l.t * (1 + 0.1 * eclat))
      }
    }
    face.emissiveIntensity = eclat * 1.5
    laiton.emissiveIntensity = eclat * 1.1
    // LE LISERÉ RESPIRE, à peine : c'est ce qui le fait lire comme une lumière
    // et non comme un trait peint. Sur la même horloge que le frémissement,
    // mais bien plus lente — deux battements rapides se liraient comme un
    // clignotement d'alerte.
    halo.color.set(peril ? '#ff6a52' : '#ffe6ab')
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
        castShadow={ombre}
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

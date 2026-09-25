/**
 * UN ENNEMI SUR LA SCÈNE.
 *
 * La silhouette est celle du jeu 2D (`ui/illustrations.ts`), plaquée sur un
 * plan. **On ne redessine pas les créatures pour la 3D** : ce sont les mêmes
 * bêtes, et un second jeu de dessins finirait par diverger du premier — c'est
 * la leçon déjà payée sur les cartes.
 *
 * Un plan texturé plutôt qu'un volume, et c'est assumé : une silhouette est
 * une masse sombre avec un oeil qui brille, elle n'a rien à montrer de profil.
 * Ce que la 3D lui apporte, c'est l'ombre au sol et la lumière de la scène.
 *
 * Le jour où Keko dessine ses créatures, elles remplaceront ces SVG par le
 * même chemin que `Glaive.png` : une image, un nom, rien d'autre.
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { Ennemi } from '../logic/combat.ts'
import { urlDeLEnnemi } from '../ui/art.ts'
import { creature } from '../ui/illustrations.ts'

/** La hauteur d'un corps, en unités de carte (une carte fait 1 de large). */
export const CORPS = 1.5

/** Le rapport du dessin des créatures SVG : `viewBox="0 0 64 60"`. */
const RAPPORT_SVG = 64 / 60

/** La hauteur d'un corps. C'est elle qui est FIXE, jamais la largeur. */
export const HAUT_CORPS = CORPS / RAPPORT_SVG

/**
 * BANC D'ESSAI : TOUS LES CORPS PRENNENT CETTE IDENTITÉ.
 *
 * Keko juge une créature qu'il vient de dessiner, et il l'a demandée seule —
 * *un dessin ne se juge pas à côté des silhouettes qu'il doit remplacer*, on
 * comparerait deux vocabulaires au lieu de regarder le nouveau.
 *
 * **C'est un réglage de RENDU, pas de règles.** `logic/cartes.ts` garde ses
 * trois groupes calibrés par simulation : le nombre de corps, les PV, les
 * dégâts et les périodes ne bougent pas d'un chiffre. Seuls le nom affiché et
 * le dessin changent — donc on voit toujours un groupe d'un, de deux ou de
 * trois, et une seule constante à remettre à `null` pour rendre le bestiaire.
 */
export const ENNEMI_UNIQUE: string | null = 'Cultiste'

/** Sous quelle identité ce corps se montre. */
export function identiteEnnemi(nom: string): string {
  return ENNEMI_UNIQUE ?? nom
}

/**
 * Quelle silhouette et quelle teinte pour chaque nom. Repris du jeu 2D : trois
 * espèces suffisent — ce qu'on veut, c'est distinguer les corps d'un coup
 * d'oeil, pas peupler un bestiaire.
 */
const ESPECES: Record<string, { espece: string; teinte: string }> = {
  Garde: { espece: 'garde', teinte: '#8f9bb3' },
  Roquet: { espece: 'roquet', teinte: '#9a7f6a' },
  Traînard: { espece: 'trainard', teinte: '#7f8f76' },
  Rôdeur: { espece: 'rodeur', teinte: '#8a7b9c' },
}

/** Une image de Keko, chargée telle quelle. */
function textureImage(url: string): Promise<THREE.Texture | null> {
  return new Promise((resoudre) => {
    const image = new Image()
    image.onload = () => {
      const texture = new THREE.Texture(image)
      texture.colorSpace = THREE.SRGBColorSpace
      texture.needsUpdate = true
      resoudre(texture)
    }
    image.onerror = () => resoudre(null)
    image.src = url
  })
}

/**
 * Le SVG d'une créature, transformé en texture.
 *
 * **IL FAUT LE RENDRE AUTONOME**, et ça a coûté un rectangle blanc : le SVG du
 * jeu 2D s'appuie sur le CSS de la page — `currentColor` pour la chair, une
 * classe pour l'oeil — et **une image chargée depuis une URL de données ne
 * voit aucune feuille de style**. Il lui manquait aussi `xmlns`, sans lequel
 * le navigateur refuse de la charger du tout.
 *
 * On ne redessine pas la créature pour autant : on lui pose ce que le CSS lui
 * donnait d'ordinaire.
 */
function textureCreature(nom: string, cle: string): Promise<THREE.Texture | null> {
  const { espece, teinte } = ESPECES[nom] ?? { espece: 'roquet', teinte: '#9a7f6a' }
  const svg = creature(espece, cle)
    // LES DIMENSIONS SONT OBLIGATOIRES : un SVG qui n'a qu'un `viewBox` n'a
    // pas de taille intrinsèque, et chargé comme image il se rastérise à rien.
    // C'est le second piège de ce portage, après le `xmlns` manquant — et les
    // deux échouent en silence.
    .replace('<svg', `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="480" style="color:${teinte}"`)
    .replace('class="oeil"', 'fill="#ffd479"')
  // Le SVG passe par une URL de données : c'est ce qui permet de le charger
  // comme une image ordinaire, donc d'en faire une texture sans le réécrire.
  const url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
  return new Promise((resoudre) => {
    const image = new Image()
    image.onload = () => {
      const texture = new THREE.Texture(image)
      texture.colorSpace = THREE.SRGBColorSpace
      texture.needsUpdate = true
      resoudre(texture)
    }
    image.onerror = () => resoudre(null)
    image.src = url
  })
}

/** Durée de l'assaut, en secondes — celle de la règle CSS `.silhouette.assaut`. */
export const DUREE_ASSAUT = 0.58

/** Quand l'impact tombe dans l'assaut : 46 % du geste. */
export const INSTANT_IMPACT = DUREE_ASSAUT * 0.46

function lisser(t: number): number {
  return t * t * (3 - 2 * t)
}

/**
 * La courbe du bond, en fraction du corps : les mêmes paliers que les
 * `@keyframes assaut` du 2D (0 → 34 % recul, 46 % impact, 60 % rebond, 100 %
 * repos), chacun avec sa propre accélération.
 */
function bond(k: number): { dy: number; echelle: number } {
  const entre = (a: number, b: number, de: number, vers: number, courbe: (x: number) => number) => {
    const x = courbe((k - a) / (b - a))
    return de + (vers - de) * x
  }
  const sortie = (x: number) => 1 - (1 - x) * (1 - x)
  const entree = (x: number) => x * x
  if (k < 0.34) return { dy: entre(0, 0.34, 0, 0.13, sortie), echelle: entre(0, 0.34, 1, 0.9, sortie) }
  if (k < 0.46) return { dy: entre(0.34, 0.46, 0.13, -0.17, entree), echelle: entre(0.34, 0.46, 0.9, 1.16, entree) }
  if (k < 0.6) return { dy: entre(0.46, 0.6, -0.17, -0.08, sortie), echelle: entre(0.46, 0.6, 1.16, 1.05, sortie) }
  return { dy: entre(0.6, 1, -0.08, 0, lisser), echelle: entre(0.6, 1, 1.05, 1, lisser) }
}

/**
 * ELLES RESPIRENT. « C'est le détail qui sépare une bête d'une vignette : sans
 * lui, la scène est une illustration ; avec, quelque chose t'attend. »
 *
 * La règle vient du jeu 2D et **on ne la réapprend pas** : même ampleur
 * (`scale(1.028, 1.035)` et deux pixels de levée sur un corps de 119), même
 * tempo, mêmes décalages. Keko : « il y a zéro animation sur les images des
 * ennemis ». Elle n'avait simplement jamais été portée — les silhouettes SVG
 * la tenaient du CSS, une image plaquée sur un plan n'hérite de rien.
 *
 * **DÉCALÉES : une meute qui souffle à l'unisson fait machine, pas vivant.**
 * Les trois couples durée/avance sont ceux des règles `:nth-child` du 2D, et
 * ils tournent au-delà de trois corps. *Deux périodes voisines mais premières
 * entre elles ne retombent jamais en phase* — c'est ce qui empêche le rang de
 * se resynchroniser au bout d'un moment.
 *
 * **LES PIEDS RESTENT AU SOL.** En 2D, `transform-origin: 50% 100%` le disait ;
 * en 3D un plan grandit autour de son centre, donc il faut remonter le corps de
 * la moitié de ce qu'il gagne en hauteur. Sans ça la bête s'enfonce dans le sol
 * à chaque inspiration.
 */
const SOUFFLES: [number, number][] = [
  [3.4, 0],
  [3.9, -1.15],
  [3.1, -2.4],
]

function souffle(t: number, index: number): { sx: number; sy: number; dy: number } {
  const [duree, avance] = SOUFFLES[index % SOUFFLES.length]!
  // `ease-in-out` sur un aller-retour, c'est une cosinusoïde : la forme est la
  // même, sans table d'étapes à tenir à jour.
  const k = (1 - Math.cos((2 * Math.PI * (t - avance)) / duree)) / 2
  const sx = 1 + 0.028 * k
  const sy = 1 + 0.035 * k
  return { sx, sy, dy: HAUT_CORPS * (0.017 * k + (sy - 1) / 2) }
}

/**
 * L'OMBRE AU SOL EST UN DÉGRADÉ, JAMAIS UN RECTANGLE.
 *
 * C'est elle qui pose la bête dans un lieu — un cadre autour d'elle la
 * remettrait dans la vignette dont on l'a sortie. Mais un plan noir uni sous
 * un corps ne se lit pas comme une ombre : il se lit comme **une barre**, le
 * défaut exact que le jeu 2D avait rencontré sur le corps en agonie. Une
 * ombre n'a pas d'arête.
 *
 * Peinte une fois pour toutes : toutes les créatures partagent la texture.
 */
const OMBRE_SOL = ((): THREE.CanvasTexture | null => {
  const toile = document.createElement('canvas')
  toile.width = 64
  toile.height = 64
  const ctx = toile.getContext('2d')
  if (ctx === null) return null
  const degrade = ctx.createRadialGradient(32, 32, 0, 32, 32, 32)
  degrade.addColorStop(0, 'rgba(0, 0, 0, 0.8)')
  degrade.addColorStop(0.5, 'rgba(0, 0, 0, 0.38)')
  degrade.addColorStop(1, 'rgba(0, 0, 0, 0)')
  ctx.fillStyle = degrade
  ctx.fillRect(0, 0, 64, 64)
  return new THREE.CanvasTexture(toile)
})()

/**
 * LE HALO DU CORPS DÉSIGNÉ : UN CONTOUR QUI SUIT SA SILHOUETTE.
 *
 * Éclaircir la créature ne suffisait pas — une silhouette déjà claire encaisse
 * mal un gain de luminosité, et rien ne déborde d'elle. Keko : « ce serait
 * bien d'avoir un effet de glow doré autour d'un ennemi ciblé par la flèche ».
 * *Ce qui se lit d'un coup d'oeil, c'est ce qui dépasse du sujet*, pas ce qui
 * se passe dedans.
 *
 * **C'ÉTAIT UN DISQUE, ET ÇA SE VOYAIT.** Un dégradé radial derrière un corps
 * qui n'est pas rond laisse de la lumière là où il n'y a personne, et n'en met
 * pas assez au bout des bras. Keko : « le halo des ennemis est un halo rond,
 * on peut pas faire un contour lumineux autour de l'image qui suit sa
 * forme ? ». *Un halo désigne d'autant mieux qu'il épouse ce qu'il désigne.*
 *
 * **LE FLOU EST DANS LA MATIÈRE, PAS DANS LA GÉOMÉTRIE** — c'est exactement la
 * leçon du contour des cartes, et elle se transpose telle quelle : on peint
 * l'OMBRE de la créature au canvas avec `shadowBlur`, qui est le même moteur
 * de flou que le `box-shadow` du CSS. L'image elle-même est dessinée HORS du
 * cadre et c'est `shadowOffsetX` qui ramène son ombre dedans : on obtient la
 * lueur seule, sans la silhouette en couleur par-dessus.
 *
 * Deux passes, et les deux comptent : un coeur serré qui fait le liseré, une
 * diffusion large qui fait la lumière. Chacune redessinée plusieurs fois,
 * parce qu'une ombre floue est pâle et que l'alpha s'accumule.
 *
 * Trois choses à savoir avant d'y retoucher, toutes héritées des cartes :
 *
 * - **le débord de la texture est EXACTEMENT celui du plan** (`DEBORD_HALO`,
 *   partagé). Plus large dans la texture, le coeur du flou passe derrière le
 *   corps et il ne reste que la frange la plus pâle ;
 * - **`shadowBlur` porte à peu près la moitié de sa valeur**, d'où les rayons
 *   doublés — mais ils restent SOUS le débord, sinon la lueur se couperait
 *   net au bord du plan. *Une lueur qui se termine par une arête n'est pas une
 *   lueur* ;
 * - **ça se vérifie sur le profil d'alpha de la texture**, pas à l'oeil sur la
 *   scène.
 *
 * Additif, comme le contour des cartes : la lumière s'AJOUTE au fond au lieu
 * de le recouvrir — c'est toute la différence entre une lueur et une tache
 * claire. Et il porte l'or de la flèche : *c'est le même signal, il doit avoir
 * la même couleur.*
 */
const DEBORD_HALO = 0.2

/** L'or de la flèche de visée. */
const OR_VISEE = 'rgba(255, 208, 128, 1)'

function textureContour(image: CanvasImageSource, rapport: number): THREE.CanvasTexture | null {
  const HAUT = 256
  const LARGE = Math.round(HAUT * rapport)
  const toile = document.createElement('canvas')
  // La toile porte le PLAN ENTIER, débord compris : c'est ce qui garantit que
  // la texture et la géométrie parlent des mêmes bords.
  toile.width = Math.round(LARGE * (1 + 2 * DEBORD_HALO))
  toile.height = Math.round(HAUT * (1 + 2 * DEBORD_HALO))
  const ctx = toile.getContext('2d')
  if (ctx === null) return null

  const mx = (toile.width - LARGE) / 2
  const my = (toile.height - HAUT) / 2
  ctx.shadowColor = OR_VISEE
  // L'IMAGE EST PEINTE HORS CADRE, SON OMBRE TOMBE DEDANS : sans ce décalage
  // on aurait la silhouette en couleur par-dessus sa propre lueur.
  ctx.shadowOffsetX = toile.width

  // [flou visé en pixels, nombre de passes]. Le flou reste sous `my`, le
  // débord, pour que l'alpha soit retombé avant le bord du plan.
  for (const [portee, passes] of [
    [my * 0.18, 4],
    [my * 0.42, 3],
  ] as [number, number][]) {
    ctx.shadowBlur = portee * 2
    for (let i = 0; i < passes; i++) ctx.drawImage(image, mx - toile.width, my, LARGE, HAUT)
    // Mesuré sur le profil d'alpha du Cultiste : 0 au bord du plan, pour une
    // frange lumineuse de 39 px sur une toile de 360. À 0,22 / 0,60 il restait
    // 9 — assez pour qu'une arête se devine sous les pattes, là où le sujet
    // touche presque le bord de son image.
  }

  const texture = new THREE.CanvasTexture(toile)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

type Props = {
  ennemi: Ennemi
  index: number
  position: [number, number, number]
  /** Il est visable : une carte attend une cible et il est encore debout. */
  visable?: boolean
  /** La flèche le DÉSIGNE : lâcher maintenant le frappe. */
  designe?: boolean
  /** L'instant du dernier coup encaissé, en secondes d'horloge de scène. */
  touche?: number | null
  /** L'instant où il s'élance pour frapper le joueur, même horloge. */
  assaut?: number | null
  /** L'instant de sa mort, même horloge. Il s'efface ensuite. */
  mortDepuis?: number | null
}

export function Ennemi3D({
  ennemi,
  index,
  position,
  visable = false,
  designe = false,
  touche = null,
  assaut = null,
  mortDepuis = null,
}: Props): React.JSX.Element {
  const [texture, setTexture] = useState<THREE.Texture | null>(null)
  const mort = ennemi.pv <= 0
  const groupe = useRef<THREE.Group>(null)
  /**
   * LA RESPIRATION PORTE LE CORPS SEUL, PAS LE GROUPE.
   *
   * L'ombre au sol est dans le groupe : emportée par le souffle, elle monterait
   * avec la bête et se décollerait du sol à chaque inspiration — *une ombre qui
   * suit son objet n'est plus une ombre, c'est un décalque.* Le 2D avait la
   * même séparation, la silhouette animée et le socle immobile. Le halo, lui,
   * est le contour du corps : il respire avec lui.
   */
  const poitrine = useRef<THREE.Group>(null)

  const identite = identiteEnnemi(ennemi.nom)

  useEffect(() => {
    let vivant = true
    const pose = (t: THREE.Texture | null): void => {
      if (vivant) setTexture(t)
    }
    // L'IMAGE DE KEKO D'ABORD, LE DESSIN EN REPLI — et le repli est explicite,
    // parce qu'une texture manquante ne s'ignore pas : elle laisserait un
    // rectangle sombre à la place du corps. C'est la différence avec la carte
    // 2D, où le CSS écarte tout seul une couche de fond qui échoue.
    const url = urlDeLEnnemi(identite)
    const dessin = (): Promise<THREE.Texture | null> =>
      textureCreature(identite, `${identite}-${index}`)
    void (url === null ? dessin() : textureImage(url).then((t) => t ?? dessin())).then(pose)
    return () => {
      vivant = false
    }
  }, [identite, index])

  /**
   * LA HAUTEUR EST FIXE, LA LARGEUR SUIT L'IMAGE.
   *
   * Une texture est ÉTIRÉE pour remplir son plan : une image carrée sur un plan
   * en 64:60 serait élargie de 7 %. On lit donc le rapport de ce qu'on a
   * vraiment chargé — les corps gardent tous la même hauteur, ce qui est ce que
   * la scène attend (l'ombre au sol, les deux ancres d'étiquette et l'écart
   * entre les corps se calculent depuis elle), et c'est la largeur qui varie.
   */
  const large = useMemo(() => {
    const img = texture?.image as { width?: number; height?: number } | undefined
    const rapport =
      img?.width !== undefined && img.height !== undefined && img.height > 0
        ? img.width / img.height
        : RAPPORT_SVG
    return HAUT_CORPS * rapport
  }, [texture])

  /**
   * LE CONTOUR SE PEINT DEPUIS LA TEXTURE DU CORPS, donc il suit la silhouette
   * de ce qui est vraiment affiché — image de Keko comme dessin de repli.
   */
  const contour = useMemo(() => {
    const img = texture?.image as CanvasImageSource | undefined
    if (img === undefined) return null
    return textureContour(img, large / HAUT_CORPS)
  }, [texture, large])

  const halo = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        transparent: true,
        opacity: 0,
        depthWrite: false,
        // Sans ça il serait ramené dans la plage du reste de la scène et
        // perdrait son éclat — même réglage que le contour des cartes.
        toneMapped: false,
        blending: THREE.AdditiveBlending,
      }),
    [],
  )

  useEffect(() => {
    halo.map = contour
    halo.needsUpdate = true
    // On libère l'ancienne : une texture vit décompressée sur le GPU, et une
    // créature qui change de dessin en laisserait une derrière elle.
    return () => contour?.dispose()
  }, [halo, contour])

  const materiau = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        transparent: true,
        // `alphaTest` coupe le halo des bords : sans lui, le carré transparent
        // du plan se voit dès qu'un corps en recouvre un autre.
        alphaTest: 0.02,
        toneMapped: false,
      }),
    [],
  )

  useEffect(() => {
    materiau.map = texture
    materiau.needsUpdate = true
  }, [materiau, texture])

  // LE COUP SE VOIT : le corps touché tressaille. Court, décroissant, et il
  // travaille sur le groupe entier — l'ombre bouge avec le corps.
  //
  // LA MORT S'ACHÈVE SUR LA SCÈNE : le corps devenu noir garde sa PLACE dans
  // le rang le temps du fondu, sinon les voisins glissent sous le doigt au
  // moment où l'on choisit sa cible suivante. Il s'efface en 600 ms, après un
  // temps où on le regarde — c'est la seule image de toute la séquence qu'on
  // ait envie de regarder.
  /** L'allumage du halo, amorti : il monte et descend au lieu de sauter. */
  const lisse = useRef(0)

  useFrame((etat, delta) => {
    const g = groupe.current
    if (g === null) return
    const t = etat.clock.elapsedTime
    let dx = 0
    if (touche !== null) {
      const dt = t - touche
      if (dt >= 0 && dt < 0.26) dx = Math.sin(dt * 62) * 0.07 * (1 - dt / 0.26)
    }
    // L'ASSAUT : un franc haut-bas, sans aucune rotation, porté tel quel du
    // 2D. Il monte en se ramassant, marque le temps, puis tombe d'un coup sous
    // sa position de repos avant de remonter. TOUT LE POIDS VIENT DU CONTRASTE
    // DE VITESSE : la montée prend 34 % du geste, la chute 12 %. L'impact
    // tombe à 46 % — c'est là que le joueur encaisse.
    let dy = 0
    let echelle = 1
    if (assaut !== null) {
      const k = (t - assaut) / DUREE_ASSAUT
      if (k >= 0 && k < 1) {
        const b = bond(k)
        dy = b.dy * CORPS
        echelle = b.echelle
      }
    }
    g.position.set(position[0] + dx, position[1] + dy, position[2])
    // Le corps désigné se gonfle un rien : la couleur seule se lit mal sur
    // une silhouette déjà claire.
    g.scale.setScalar(echelle * (designe ? 1.06 : 1))

    // LE SOUFFLE, et il cède la place à l'assaut comme en 2D : deux mouvements
    // sur la même propriété se marchent dessus, et c'est le bond qu'on veut
    // voir. Il reprend tout seul à la fin.
    //
    // COUPÉ NET À LA MORT. Un corps qui continue de souffler une fraction de
    // seconde après avoir été abattu, c'est le défaut déjà corrigé en 2D — et
    // ici il se verrait d'autant plus que le tampon tombe sur un corps immobile.
    const pt = poitrine.current
    if (pt !== null) {
      if (mort || assaut !== null) {
        pt.scale.set(1, 1, 1)
        pt.position.y = 0
      } else {
        const r = souffle(t, index)
        pt.scale.set(r.sx, r.sy, 1)
        pt.position.y = r.dy
      }
    }

    // UN CORPS QU'ON PEUT VISER S'ALLUME, et il respire. C'est le seul repère
    // quand une carte attend sa cible : au doigt il n'y a pas de survol, donc
    // « visable » ne peut pas dépendre d'un pointeur. Sans lui, sortir une
    // carte à plusieurs ennemis ne changeait RIEN à l'écran — Keko : « quand
    // il y a plusieurs ennemis et que je joue une carte offensive, rien ne se
    // passe ». *Un état du jeu qui ne se voit pas n'existe pas.*
    // TROIS NIVEAUX, ET ILS DOIVENT RESTER DISTINCTS : mat, lueur qui respire
    // sur un corps qu'on PEUT viser, éclat franc sur celui que la flèche
    // désigne. Le deuxième ne peut pas dépendre d'un survol — *il n'y en a
    // pas au doigt* — c'est l'arbitrage central du multi-cibles.
    if (!mort && texture !== null) {
      if (designe) materiau.color.setScalar(1.45)
      else materiau.color.setScalar(visable ? 1.22 + Math.sin(t * 5) * 0.18 : 1)
    }
    // LE HALO S'ALLUME EN FONDU, il n'apparaît pas : un corps qui s'embrase
    // d'une image à l'autre pendant qu'on balaie le rang fait clignoter tout
    // l'écran. Il respire ensuite, comme le contour des cartes — c'est ce qui
    // le fait lire comme une lumière et non comme un calque posé.
    const vise = designe && !mort ? 1 : 0
    lisse.current += (vise - lisse.current) * (1 - Math.exp(-16 * delta))
    halo.opacity = lisse.current * (0.82 + Math.sin(t * 5) * 0.18)

    if (mortDepuis !== null) {
      const dt = t - mortDepuis
      // 0,7 s de corps noir et de tampon, puis 0,6 s de fondu.
      const k = Math.max(0, Math.min(1, (dt - 0.7) / 0.6))
      materiau.opacity = 0.35 * (1 - k)
    }
  })

  // UN MORT NE FRAPPE PLUS, et il doit se voir comme tel : il s'éteint en
  // silhouette noire, comme en 2D. Il garde sa place dans le rang — sinon les
  // voisins glissent sous le doigt au moment où l'on choisit sa cible.
  //
  // TANT QUE LA TEXTURE N'EST PAS LÀ, LA COULEUR EST SOMBRE : en blanc, une
  // texture qui échoue donne un rectangle éclatant au milieu de la scène, et
  // on croit à un bug de mise en page plutôt qu'à une image manquante.
  materiau.color.set(texture === null ? '#15151b' : mort ? '#000000' : '#ffffff')
  materiau.opacity = mort ? 0.35 : 1

  return (
    <group ref={groupe} position={position}>
      <group ref={poitrine}>
        <mesh>
          <planeGeometry args={[large, HAUT_CORPS]} />
          <primitive object={materiau} attach="material" />
        </mesh>

      {/* LE HALO DE VISÉE, derrière le corps : seul ce qui dépasse se voit. Il
          ne capte pas le pointeur — il élargirait la zone sensible de la bête
          d'un anneau invisible au repos. */}
        {contour !== null && (
          <mesh position={[0, 0, -0.03]} material={halo} raycast={() => null}>
            <planeGeometry
              args={[large * (1 + 2 * DEBORD_HALO), HAUT_CORPS * (1 + 2 * DEBORD_HALO)]}
            />
          </mesh>
        )}
      </group>

      {/* L'OMBRE AU SOL : c'est elle qui pose la bête dans un lieu. Un cadre
          autour la remettrait dans la vignette dont on l'a sortie. */}
      {!mort && (
        <mesh position={[0, -CORPS * 0.46, -0.02]}>
          <planeGeometry args={[large * 0.95, CORPS * 0.3]} />
          <meshBasicMaterial map={OMBRE_SOL} transparent depthWrite={false} toneMapped={false} />
        </mesh>
      )}

    </group>
  )
}

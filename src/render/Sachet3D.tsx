/**
 * LE SACHET QU'ON DÉCHIRE — ce qu'on ouvre avant de voir les cartes.
 *
 * *Un paquet qui montre ses cinq dos d'emblée n'est pas un paquet, c'est une
 * main face cachée* : rien n'est fermé, donc il n'y a rien à ouvrir. Le sachet
 * rend au geste ce que l'écran avait perdu — **on ouvre, puis on regarde.**
 *
 * **ON ARRACHE LA BANDE DU HAUT, ON NE CONSUME PAS LE SACHET**, et c'est toute
 * la correction. La première version faisait descendre un front incandescent
 * du haut vers le bas jusqu'à ce qu'il ne reste rien : *ça se lit comme un
 * objet qui brûle, pas comme un objet qu'on ouvre* — et surtout il ne restait
 * plus de sachet d'où les cartes auraient pu sortir.
 *
 * Trois pièces, et chacune fait un travail que les deux autres ne font pas :
 *
 * - **LE CORPS** reste. Son bord haut se carbonise au passage du front, et
 *   c'est lui qui rend les cartes ;
 * - **LA BANDE** se détache et s'envole en tournoyant. *Ce qu'on arrache doit
 *   aller quelque part* — sans elle, la déchirure serait une gomme ;
 * - **LA GERBE** d'étincelles monte de l'ouverture, bien au-dessus du sachet.
 *   Elle a son propre plan parce qu'*un effet ne peut pas déborder de la
 *   géométrie qui le porte.*
 *
 * **LE FRONT COURT À L'HORIZONTALE, LE LONG DE LA LIGNE POINTILLÉE** que la
 * texture a déjà dessinée. *Un sachet se déchire là où il est prévu pour* —
 * et c'est ce qui fait que le geste se comprend sans l'avoir appris.
 *
 * Les trois matériaux sont des `ShaderMaterial` écrits à la main, et le projet
 * connaît le prix : *un matériau écrit à la main ne bénéficie d'aucune des
 * règles du moteur qu'il ne demande pas* — pas de plans de découpe, pas
 * d'ombres. Aucun des deux ne sert ici : le sachet ne vit pas dans un meuble,
 * et il s'en va.
 */
import { useEffect, useMemo, useRef } from 'react'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import { LIGNE_DECHIRURE, RAPPORT_SACHET, textureDuSachet } from './texture-carte.ts'

/**
 * CE QUE DURE L'OUVERTURE, en secondes.
 *
 * *Le feu doit avoir le temps de prendre* — un front qui traverse en trois
 * dixièmes se lit comme un essuie-glace — et pas celui de lasser : on ouvre
 * un paquet après l'autre.
 */
export const DUREE_BRULURE = 1.5

/**
 * QUAND LE FRONT A FINI SA COURSE, en part de la durée.
 *
 * Avant : il court sur la ligne. Après : la bande part. *Les deux ne se
 * chevauchent pas* — on n'arrache pas ce qui tient encore par un bout.
 */
const PART_FRONT = 0.42

/**
 * LA COURBE DU FRONT : il part lentement et ACCÉLÈRE.
 *
 * C'est ce que fait une déchirure — elle amorce, puis elle file — et c'est
 * l'inverse de tout le reste du jeu, où le mouvement part vite et s'achève
 * lentement. *Un front qui ralentirait en arrivant se lirait comme un store
 * qu'on baisse.*
 */
const COURBE_FRONT = 1.45

/**
 * LES TROIS GRANDEURS DU BORD DÉCHIRÉ, en parts de la HAUTEUR DU SACHET.
 *
 * Elles s'appliquent aux deux morceaux, qui n'ont pas la même hauteur : le
 * nuanceur les convertit dans le repère de chacun. *Écrites en parts du
 * morceau, le charbon de la bande serait six fois plus fin que celui du
 * corps* — et personne ne le verrait en lisant le code.
 */
const AMPLI = 0.02
const CHARBON = 0.035
const BRAISE = 0.013
/** Raccourci de lecture : la part du sachet que prend la bande. */
const L = LIGNE_DECHIRURE

/** Le `smoothstep` du GLSL, cote JavaScript. */
function lissage(e0: number, e1: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)))
  return t * t * (3 - 2 * t)
}

/** Une texture d'un pixel transparent, le temps que le sachet soit peint. */
const VIDE = (() => {
  const t = new THREE.DataTexture(new Uint8Array([0, 0, 0, 0]), 1, 1)
  t.needsUpdate = true
  return t
})()

/**
 * CE QUI EST COMMUN AUX DEUX MORCEAUX : la déchirure elle-même.
 *
 * Le corps et la bande lisent la MÊME texture, chacun sa tranche (`uV0`,
 * `uV1`), et portent le MÊME bord déchiré — l'un par le haut, l'autre par le
 * bas. *Deux nuanceurs qui décriraient la même déchirure se désaccorderaient
 * au premier réglage*, et le raccord est précisément ce qui ne doit pas se
 * voir : les deux bords sont le même trait.
 */
const DECHIRURE = `
float ondule(float x) {
  // ELLE N'EST PAS DROITE, et c'est une somme de sinus plutôt qu'un hachage :
  // *un bruit par pixel donne une dentelure, une somme de sinus donne une
  // déchirure.* Trois fréquences qui ne retombent pas en phase.
  return sin(x * 13.0) * 0.1 + sin(x * 27.0 + 1.7) * 0.055 + sin(x * 47.0 + 3.1) * 0.03;
}

float des(vec2 m) {
  return fract(sin(dot(m, vec2(12.9898, 78.233))) * 43758.5453);
}
`

/**
 * LA MATIÈRE D'UN MORCEAU. **`estLeCorps` et non `haut`** : le morceau du
 * HAUT est la bande, et c'est le CORPS qui porte le bord déchiré en haut —
 * *un paramètre qui nomme la place dit l'inverse de ce dont on se sert*, et
 * il m'a fait écrire la déchirure à l'envers une fois.
 */
function matiereDuMorceau(estLeCorps: boolean): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    transparent: true,
    // IL NE S'ÉCRIT PAS DANS LA PROFONDEUR : la braise est additive et déborde
    // de la matière, donc elle masquerait ce qu'il y a derrière alors qu'elle
    // n'est que de la lumière.
    depthWrite: false,
    uniforms: {
      uSachet: { value: VIDE },
      uV0: { value: 0 },
      uV1: { value: 1 },
      // LE FRONT PART HORS DU SACHET, et il le faut : à zéro, la gaussienne
      // de la braise vaut déjà 1 contre le bord gauche — *un sachet fermé
      // n'a aucune raison d'être allumé.* Il n'y a pas besoin d'un uniforme
      // de plus pour le dire, la place suffit.
      uFront: { value: -1 },
      uTemps: { value: 0 },
      uFondu: { value: 1 },
    },
    vertexShader: `varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`,
    fragmentShader: `uniform sampler2D uSachet;
uniform float uV0;
uniform float uV1;
uniform float uFront;
uniform float uTemps;
uniform float uFondu;
varying vec2 vUv;
${DECHIRURE}

void main() {
  vec4 tex = texture2D(uSachet, vec2(vUv.x, mix(uV0, uV1, vUv.y)));

  // CE QUI SE MESURE LE LONG DU BORD SE COMPTE EN PARTS DU SACHET, PAS DU
  // MORCEAU. Les deux n'ont pas la même hauteur — la bande n'en fait que
  // 0,145 — donc une même amplitude en UV y dessinerait deux traits
  // différents, et *les deux bords cesseraient d'être le même trait.*
  float ech = ${(estLeCorps ? 1 / (1 - L) : 1 / L).toFixed(4)};

  // LE BORD DÉCHIRÉ, dans le repère de CE morceau : le corps l'a en HAUT
  // (\`vUv.y = 1\`), la bande en BAS (\`vUv.y = 0\`). **Les deux ondulent en
  // SENS OPPOSÉ dans leur propre repère** : c'est ce qu'il faut pour qu'ils
  // décrivent la même ligne du canvas une fois chacun dans sa tranche, et
  // *le raccord est précisément ce qui ne doit pas se voir.*
  float onde = ondule(vUv.x) * ${AMPLI} * ech;
  float bord = ${estLeCorps ? '1.0 - onde' : '-onde'};
  float dedans = ${estLeCorps ? '(bord - vUv.y)' : '(vUv.y - bord)'};

  // CE QUI A DÉJÀ ÉTÉ TOUCHÉ : à gauche du front. *Le front court, il ne
  // tombe pas d'un bloc* — sinon la bande se détacherait d'un seul coup et on
  // n'aurait rien vu courir.
  // **Les bornes d'un \`smoothstep\` ne s'inversent pas** : la spécification
  // GLSL laisse le résultat indéfini quand \`edge0 >= edge1\`. On prend donc
  // le complément plutôt que de compter sur un pilote clément.
  float passe = 1.0 - smoothstep(uFront - 0.03, uFront + 0.03, vUv.x);

  // LE CHARBON : juste au bord, la matière NOIRCIT. *Sans lui le sachet se
  // coupe net, et une coupe nette n'est pas une déchirure.*
  float charbon = (1.0 - smoothstep(0.0, ${CHARBON} * ech, dedans)) * passe;
  vec3 corps = mix(tex.rgb, tex.rgb * 0.12, charbon);

  // LA BRAISE : une bande étroite au front, qui CLIGNOTE. Elle est en or
  // chaud puis blanche en son coeur — *un feu n'a pas une couleur, il a un
  // dégradé de température.* Elle ne vit qu'AUTOUR du point qui court : une
  // braise qui resterait allumée derrière lui ferait une ligne de néon.
  float vif = exp(-pow((vUv.x - uFront) / 0.09, 2.0));
  float vacille = 0.75 + 0.25 * sin(vUv.x * 41.0 + uTemps * 11.0);
  float braise = exp(-pow(dedans / (${BRAISE} * ech), 2.0)) * vacille * max(vif, passe * 0.22);
  vec3 feu = mix(vec3(1.7, 0.55, 0.11), vec3(2.3, 1.8, 1.2), smoothstep(0.4, 1.0, braise));

  float a = max(tex.a, braise * 0.9) * uFondu;
  gl_FragColor = vec4(corps + feu * braise, a);
  if (gl_FragColor.a < 0.004) discard;
}`,
  })
}

/**
 * LA GERBE : les étincelles qui montent de l'ouverture.
 *
 * **Elle a son propre plan**, bien plus haut que le sachet, parce qu'*un effet
 * ne peut pas déborder de la géométrie qui le porte* : posées dans le corps,
 * les étincelles s'arrêteraient net au bord déchiré, c'est-à-dire exactement
 * là où elles doivent commencer.
 */
function matiereDeLaGerbe(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: { uFront: { value: 0 }, uTemps: { value: 0 }, uForce: { value: 0 } },
    vertexShader: `varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`,
    fragmentShader: `uniform float uFront;
uniform float uTemps;
uniform float uForce;
varying vec2 vUv;
${DECHIRURE}

void main() {
  // LE SEMIS MONTE : une grille de cellules qui défile vers le haut. *Un grain
  // tiré à chaque image n'est plus une matière, c'est du bruit.*
  vec2 cellule = vec2(vUv.x * 26.0, vUv.y * 22.0 - uTemps * 2.3);
  vec2 m = floor(cellule);
  float tiree = des(m);
  vec2 dans = fract(cellule) - 0.5;
  dans.x += (des(m + 7.3) - 0.5) * 0.5;
  float d = length(dans);
  float grain = smoothstep(0.34, 0.03, d) * step(0.58, tiree);

  // ELLES SORTENT DE LA FENTE, donc elles s'éteignent en montant — *une
  // étincelle a une durée* — et elles se resserrent vers le milieu, comme une
  // gerbe qui s'évase puis retombe.
  float monte = exp(-vUv.y * 2.6);
  float evase = exp(-pow((vUv.x - 0.5) / (0.16 + vUv.y * 0.3), 2.0));

  // PENDANT QUE LE FRONT COURT, elles ne jaillissent que de LÀ OÙ il passe :
  // *une gerbe pleine largeur avant que la fente soit ouverte annoncerait une
  // ouverture qui n'a pas eu lieu.*
  float ouvert = max(smoothstep(uFront + 0.06, uFront - 0.02, vUv.x) * 0.55,
                     exp(-pow((vUv.x - uFront) / 0.07, 2.0)));

  float a = grain * monte * evase * ouvert * uForce;
  gl_FragColor = vec4(vec3(2.4, 1.7, 0.95) * a, a);
  if (a < 0.004) discard;
}`,
  })
}

export function Sachet3D({
  taille,
  position,
  ouvre = false,
  onOuvert,
  onDechire,
  onCliquer,
}: {
  /** Sa largeur en unités de scène ; sa hauteur suit son rapport. */
  readonly taille: number
  readonly position: readonly [number, number, number]
  /** Vrai dès qu'il doit s'ouvrir. Il ne se referme pas. */
  readonly ouvre?: boolean
  /** La bande vient d'être arrachée — *c'est l'instant du flash.* */
  readonly onDechire?: () => void
  /** Tout est fini : *c'est l'écran qui décide de la suite.* */
  readonly onOuvert?: () => void
  readonly onCliquer?: () => void
}): React.ReactElement {
  const groupe = useRef<THREE.Group>(null)
  const bande = useRef<THREE.Group>(null)
  const corps = useMemo(() => matiereDuMorceau(true), [])
  const bandeMat = useMemo(() => matiereDuMorceau(false), [])
  const gerbe = useMemo(() => matiereDeLaGerbe(), [])
  /** Quand l'ouverture a commencé, en secondes d'horloge de scène. */
  const debut = useRef<number | null>(null)
  const dit = useRef(false)
  const ditDechire = useRef(false)

  const H = taille * RAPPORT_SACHET
  const hBande = H * LIGNE_DECHIRURE
  const hCorps = H - hBande

  useEffect(() => {
    let vivant = true
    void textureDuSachet().then((t) => {
      if (!vivant) return
      corps.uniforms.uSachet!.value = t
      bandeMat.uniforms.uSachet!.value = t
    })
    return () => {
      vivant = false
    }
  }, [corps, bandeMat])

  useEffect(() => {
    // LES TRANCHES DE TEXTURE. Une `CanvasTexture` est retournée (`flipY`),
    // donc `uv.y = 1` est le HAUT du canvas : la bande y vit de `1 - L` à 1.
    corps.uniforms.uV0!.value = 0
    corps.uniforms.uV1!.value = 1 - LIGNE_DECHIRURE
    bandeMat.uniforms.uV0!.value = 1 - LIGNE_DECHIRURE
    bandeMat.uniforms.uV1!.value = 1
  }, [corps, bandeMat])

  // LES MATIÈRES SE JETTENT AVEC LE COMPOSANT : un `ShaderMaterial` garde son
  // programme compilé, et l'écran en monte trois par paquet ouvert.
  useEffect(
    () => () => {
      corps.dispose()
      bandeMat.dispose()
      gerbe.dispose()
    },
    [corps, bandeMat, gerbe],
  )

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    corps.uniforms.uTemps!.value = t
    bandeMat.uniforms.uTemps!.value = t
    gerbe.uniforms.uTemps!.value = t

    if (ouvre && debut.current === null) debut.current = t
    if (debut.current === null) {
      // IL RESPIRE TANT QU'ON NE L'A PAS TOUCHÉ. *Un objet qui attend une tape
      // doit dire qu'il attend* — et c'est le vocabulaire du jeu, celui des
      // créatures et des slots qui accueillent.
      groupe.current?.scale.setScalar(1 + Math.sin(t * 1.7) * 0.013)
      return
    }
    groupe.current?.scale.setScalar(1)

    const p = Math.min(1, (t - debut.current) / DUREE_BRULURE)
    const pf = Math.min(1, p / PART_FRONT)
    // IL SORT DES DEUX BORDS : *une déchirure qui commence pile sur le bord se
    // lit comme un bord qui s'efface*, et une qui s'arrête pile à droite y
    // laisse un point de braise posé là pour toujours.
    const front = -0.06 + Math.pow(pf, COURBE_FRONT) * 1.12
    corps.uniforms.uFront!.value = front
    bandeMat.uniforms.uFront!.value = front
    gerbe.uniforms.uFront!.value = front

    // LA GERBE monte dès que la fente s'ouvre, culmine à l'arrachement, puis
    // retombe lentement : *une gerbe qui s'arrêterait net se lirait comme une
    // coupure de courant.*
    gerbe.uniforms.uForce!.value = pf * (p < PART_FRONT ? 1 : Math.max(0, 1 - (p - PART_FRONT) / 0.5))

    if (pf >= 1 && !ditDechire.current) {
      ditDechire.current = true
      onDechire?.()
    }

    // LA BANDE S'ENVOLE une fois le front arrivé au bout. Elle monte, part à
    // droite et RETOMBE — *ce qu'on arrache est emporté puis lâché* — en
    // tournoyant sur elle-même, parce qu'un morceau de film n'a aucune raison
    // de rester à plat.
    const pv = Math.max(0, (p - PART_FRONT) / (1 - PART_FRONT))
    if (bande.current !== null) {
      const b = bande.current
      b.position.x = taille * 1.15 * pv * pv
      b.position.y = hCorps / 2 + H * (0.52 * pv - 1.15 * pv * pv)
      b.rotation.z = -pv * 7.2
      b.scale.setScalar(Math.max(0.2, 1 - pv * 0.55))
    }
    bandeMat.uniforms.uFondu!.value = Math.max(0, 1 - Math.pow(pv, 2.2))

    // LE CORPS S'EFFACE PENDANT QUE LES CARTES MONTENT. Il restait entier
    // jusqu'au dernier instant, puis le composant se demontait : *un sachet
    // qui disparait d'un coup se lit comme un bug de rendu.* Il part sur le
    // dernier quart, donc apres l'arrachement et pendant la sortie -- ce
    // qu'on a vide n'a plus a rester.
    corps.uniforms.uFondu!.value = 1 - lissage(0.74, 1, p)

    if (p >= 1 && !dit.current) {
      dit.current = true
      onOuvert?.()
    }
  })

  const toucher = (e: ThreeEvent<PointerEvent>): void => {
    e.stopPropagation()
    onCliquer?.()
  }

  return (
    <group ref={groupe} position={position as unknown as THREE.Vector3Tuple}>
      {/* LA GERBE, DERRIÈRE le sachet et bien plus haute que lui : elle part
          de la fente et monte au-delà du bord. */}
      <mesh position={[0, hCorps / 2 - hBande / 2 + taille * 0.62, -0.02]} raycast={() => null}>
        <planeGeometry args={[taille * 1.5, taille * 1.3]} />
        <primitive object={gerbe} attach="material" />
      </mesh>

      {/* LE CORPS : il reste, et c'est de lui que les cartes sortiront. */}
      <mesh position={[0, -hBande / 2, 0]} onPointerDown={toucher}>
        <planeGeometry args={[taille, hCorps]} />
        <primitive object={corps} attach="material" />
      </mesh>

      {/* LA BANDE : son GROUPE porte le vol, son plan porte le dessin — et le
          plan est à l'origine du groupe, sinon la rotation la ferait tourner
          autour du centre du SACHET et l'enverrait décrire un cercle. *Un
          objet tournoie sur lui-même, donc son pivot est son centre.* */}
      <group ref={bande} position={[0, hCorps / 2, 0]}>
        <mesh onPointerDown={toucher}>
          <planeGeometry args={[taille, hBande]} />
          <primitive object={bandeMat} attach="material" />
        </mesh>
      </group>
    </group>
  )
}

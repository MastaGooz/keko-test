/**
 * LE SACHET QUI SE DÉCHIRE EN BRÛLANT — ce qu'on ouvre avant de voir les
 * cartes.
 *
 * *Un paquet qui montre ses cinq dos d'emblée n'est pas un paquet, c'est une
 * main face cachée* : rien n'est fermé, donc il n'y a rien à ouvrir. Le sachet
 * rend au geste ce que l'écran avait perdu — **on ouvre, puis on regarde.**
 *
 * **TOUT EST DANS UN SEUL NUANCEUR : la déchirure, la braise et les
 * étincelles.** Trois plans superposés auraient demandé trois alphas, trois
 * matériaux et trois réglages, alors que *les trois décrivent le même front* —
 * et deux valeurs qui décrivent la même chose se désaccordent au premier
 * réglage. Ici il n'y en a qu'une : `uBrulure`.
 *
 * C'est un `ShaderMaterial` écrit à la main, et le projet connaît le prix :
 * *un matériau écrit à la main ne bénéficie d'aucune des règles du moteur
 * qu'il ne demande pas* — pas de plans de découpe, pas d'ombres. Aucun des
 * deux ne sert ici : le sachet ne vit pas dans un meuble, et il s'en va.
 */
import { useEffect, useMemo, useRef } from 'react'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import { RAPPORT_SACHET, textureDuSachet } from './texture-carte.ts'

/**
 * CE QUE DURE LA DÉCHIRURE, en secondes.
 *
 * *Le feu doit avoir le temps de prendre* — un front qui traverse en trois
 * dixièmes se lit comme un essuie-glace — et pas celui de lasser : on ouvre
 * un paquet après l'autre.
 */
export const DUREE_BRULURE = 1.15

/**
 * LA COURBE DU FRONT : il part lentement et ACCÉLÈRE.
 *
 * C'est ce que fait un feu — il prend, puis il court — et c'est l'inverse de
 * tout le reste du jeu, où le mouvement part vite et s'achève lentement. *Un
 * front qui ralentirait en arrivant se lirait comme un store qu'on baisse.*
 */
const COURBE_FRONT = 1.5

/** Une texture d'un pixel transparent, le temps que le sachet soit peint. */
const VIDE = (() => {
  const t = new THREE.DataTexture(new Uint8Array([0, 0, 0, 0]), 1, 1)
  t.needsUpdate = true
  return t
})()

function matiereDuSachet(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    transparent: true,
    // IL NE S'ÉCRIT PAS DANS LA PROFONDEUR : les étincelles sont additives et
    // couvrent la part consommée, donc elles masqueraient ce qu'il y a
    // derrière alors qu'elles ne sont que de la lumière.
    depthWrite: false,
    uniforms: {
      uSachet: { value: VIDE },
      uBrulure: { value: 0 },
      uTemps: { value: 0 },
    },
    vertexShader: `varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`,
    fragmentShader: `uniform sampler2D uSachet;
uniform float uBrulure;
uniform float uTemps;
varying vec2 vUv;

float des(vec2 m) {
  return fract(sin(dot(m, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
  vec4 tex = texture2D(uSachet, vUv);

  // LE FRONT DESCEND DEPUIS AU-DESSUS DU BORD HAUT jusqu'en DESSOUS du bord
  // bas : *une déchirure qui commence pile sur le bord se lit comme un bord
  // qui s'efface*, et une qui s'arrête pile en bas laisse un liseré de braise
  // posé là pour toujours.
  float front = mix(1.1, -0.14, uBrulure);

  // ELLE N'EST PAS DROITE, et c'est une somme de sinus plutôt qu'un hachage :
  // *un bruit par pixel donne une dentelure, une somme de sinus donne une
  // déchirure.* Trois fréquences qui ne retombent pas en phase.
  float ondule =
    sin(vUv.x * 11.0) * 0.016 + sin(vUv.x * 23.0 + 1.7) * 0.009 + sin(vUv.x * 41.0 + 3.1) * 0.005;
  float bord = front + ondule;
  float dessous = bord - vUv.y;

  // CE QUI RESTE DU SACHET : tout ce qui est sous le front.
  float intact = step(0.0, dessous);

  // LE CHARBON : juste sous la braise, la matière NOIRCIT avant de partir.
  // *Sans lui le sachet se coupe net, et une coupe nette n'est pas une
  // brûlure.*
  float charbon = 1.0 - smoothstep(0.0, 0.07, dessous);
  vec3 corps = mix(tex.rgb, tex.rgb * 0.13, charbon * intact);

  // LA BRAISE : une bande étroite au front, qui CLIGNOTE. Elle est en or
  // chaud puis blanche en son cœur — *un feu n'a pas une couleur, il a un
  // dégradé de température.*
  float vacille = 0.78 + 0.22 * sin(vUv.x * 37.0 + uTemps * 9.0);
  float braise = exp(-pow(dessous / 0.028, 2.0)) * vacille;
  vec3 feu = mix(vec3(1.6, 0.52, 0.1), vec3(2.2, 1.7, 1.1), smoothstep(0.45, 1.0, braise));

  // LES ÉTINCELLES MONTENT, et elles n'existent QU'AU-DESSUS du front — dans
  // la part déjà consommée, là où il n'y a plus rien à masquer. Leur semis est
  // une grille de cellules qui défile : *un grain tiré à chaque image n'est
  // plus une matière, c'est du bruit.*
  vec2 cellule = vec2(vUv.x * 31.0, (vUv.y - bord) * 19.0 - uTemps * 1.9);
  vec2 m = floor(cellule);
  float tiree = des(m);
  float d = length(fract(cellule) - 0.5);
  float etincelle = smoothstep(0.36, 0.04, d) * step(0.66, tiree);
  // Elles s'éteignent en s'éloignant du front : une étincelle a une durée.
  etincelle *= (1.0 - intact) * exp(max(0.0, -dessous) * -5.5);

  // *UNE LUEUR QUI SE TERMINE PAR UNE ARÊTE N'EST PAS UNE LUEUR* : tout
  // s'éteint ensemble sur la fin, sinon le front sortirait de la toile en
  // laissant sa braise allumée.
  float finit = 1.0 - smoothstep(0.84, 1.0, uBrulure);

  float a = max(intact * tex.a, braise * 0.85) * finit;
  vec3 c = corps * intact + feu * braise + vec3(2.0, 1.25, 0.6) * etincelle;
  gl_FragColor = vec4(c, max(a, etincelle * 0.9 * finit));
  if (gl_FragColor.a < 0.004) discard;
}`,
  })
}

export function Sachet3D({
  taille,
  position,
  ouvre = false,
  onOuvert,
  onCliquer,
}: {
  /** Sa largeur en unités de scène ; sa hauteur suit son rapport. */
  readonly taille: number
  readonly position: readonly [number, number, number]
  /** Vrai dès qu'il doit brûler. Il ne se referme pas. */
  readonly ouvre?: boolean
  /** Il a fini de se consumer : *c'est l'écran qui décide de la suite.* */
  readonly onOuvert?: () => void
  readonly onCliquer?: () => void
}): React.ReactElement {
  const groupe = useRef<THREE.Group>(null)
  const matiere = useMemo(() => matiereDuSachet(), [])
  /** Quand la brûlure a commencé, en secondes d'horloge de scène. */
  const debut = useRef<number | null>(null)
  const dit = useRef(false)

  useEffect(() => {
    let vivant = true
    void textureDuSachet().then((t) => {
      if (vivant) matiere.uniforms.uSachet!.value = t
    })
    return () => {
      vivant = false
    }
  }, [matiere])

  // LA MATIÈRE SE JETTE AVEC LE COMPOSANT : un `ShaderMaterial` garde son
  // programme compilé, et l'écran en monte un par paquet ouvert.
  useEffect(() => () => matiere.dispose(), [matiere])

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    matiere.uniforms.uTemps!.value = t
    if (ouvre && debut.current === null) debut.current = t
    if (debut.current === null) {
      // IL RESPIRE TANT QU'ON NE L'A PAS TOUCHÉ. *Un objet qui attend une tape
      // doit dire qu'il attend* — et c'est le vocabulaire du jeu, celui des
      // créatures et des slots qui accueillent.
      groupe.current?.scale.setScalar(1 + Math.sin(t * 1.7) * 0.013)
      return
    }
    const p = Math.min(1, (t - debut.current) / DUREE_BRULURE)
    matiere.uniforms.uBrulure!.value = Math.pow(p, COURBE_FRONT)
    groupe.current?.scale.setScalar(1)
    if (p >= 1 && !dit.current) {
      dit.current = true
      onOuvert?.()
    }
  })

  return (
    <group ref={groupe} position={position as unknown as THREE.Vector3Tuple}>
      <mesh
        onPointerDown={(e: ThreeEvent<PointerEvent>) => {
          e.stopPropagation()
          onCliquer?.()
        }}
      >
        <planeGeometry args={[taille, taille * RAPPORT_SACHET]} />
        <primitive object={matiere} attach="material" />
      </mesh>
    </group>
  )
}

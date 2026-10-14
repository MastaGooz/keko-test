/**
 * LE BLOOM : les points brillants rayonnent, comme chez lexicodex.
 *
 * Keko : « on peut rajouter du halo / glow sur les points brillants comme sur
 * lexicodex ? » *Leur scène passe par un composeur avec une passe de flou*,
 * et c'est ce que la note du sachet disait déjà : « chez eux le grain est
 * minuscule, et c'est un bloom qui le grossit ». Jusqu'ici le projet peignait
 * ses halos DANS la matière — le foil, les étincelles, le contour des cartes —
 * parce qu'il n'avait pas de post-traitement. Il en a un maintenant, pour le
 * paquet seulement.
 *
 * **IL EST ÉCRIT À LA MAIN, et ce n'est pas par goût.** three embarque un
 * `UnrealBloomPass`, mais il rend un canvas OPAQUE : sa passe de composition
 * ajoute le flou en écrivant un alpha plein, donc le fond HTML — les
 * lumières et les emoji qui flottent — disparaîtrait sous du noir. *Le canvas
 * du paquet est transparent, et il doit le rester.* Quatre passes suffisent,
 * et chacune garde l'alpha :
 *
 * 1. la scène se rend dans une cible à sa taille, avec son alpha ;
 * 2. ce qui dépasse `seuil` de luminance passe dans une cible au quart ;
 * 3. deux flous séparables l'étalent (quatre passes au quart, donc rien) ;
 * 4. la scène se recopie à l'écran, le flou s'y AJOUTE, et l'alpha monte
 *    d'autant : *une lumière qui déborde sur le vide s'y voit* — c'est tout
 *    ce qu'un halo demande.
 *
 * La cible de scène est en LINÉAIRE : c'est le dernier pas qui encode en sRGB,
 * comme le ferait l'écran — la chaîne du paquet n'a pas de ton (voir
 * `NoToneMapping`), donc c'est sa seule conversion. **Et elle est en
 * DEMI-FLOTTANTS** quand l'appareil sait y rendre : *ce qui brille vraiment
 * dépasse 1* — le coeur d'une étincelle, le lustre sur une touche — alors
 * que le crème des soudures et la pastille plafonnent sous 1. En 8 bits tout
 * s'écrêtait à 1, et le seuil ne pouvait plus les séparer : les soudures
 * rayonnaient comme des lampes. Sans flottants, on retombe en 8 bits avec un
 * seuil plus bas — *un halo un peu large vaut mieux qu'un canvas noir.*
 *
 * `?bloom=0` le coupe : *ce qui a servi à choisir doit rester ouvrable*, et un
 * téléphone qui souffre doit pouvoir s'en passer.
 */
import { useEffect, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

const SOMMET = `varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}`

/** Ce qui dépasse le seuil, pondéré doucement : *un seuil franc clignote.* */
const SEUIL = `uniform sampler2D uScene;
uniform float uSeuil;
varying vec2 vUv;
void main() {
  vec4 c = texture2D(uScene, vUv);
  float l = dot(c.rgb, vec3(0.2126, 0.7152, 0.0722));
  float k = smoothstep(uSeuil, uSeuil + 0.5, l);
  gl_FragColor = vec4(c.rgb * k, 1.0);
}`

/** Un flou gaussien à neuf prises, dans une direction. */
const FLOU = `uniform sampler2D uTex;
uniform vec2 uDir;
varying vec2 vUv;
void main() {
  float w[5];
  w[0] = 0.2270270270; w[1] = 0.1945945946; w[2] = 0.1216216216; w[3] = 0.0540540541; w[4] = 0.0162162162;
  vec3 s = texture2D(uTex, vUv).rgb * w[0];
  for (int i = 1; i < 5; i++) {
    vec2 d = uDir * float(i);
    s += texture2D(uTex, vUv + d).rgb * w[i];
    s += texture2D(uTex, vUv - d).rgb * w[i];
  }
  gl_FragColor = vec4(s, 1.0);
}`

/** La scène, plus le flou, encodée en sRGB — et l'alpha qui monte avec la lumière. */
const FINAL = `uniform sampler2D uScene;
uniform sampler2D uBloom;
uniform float uForce;
varying vec2 vUv;
vec3 oetf(vec3 c) {
  return mix(c * 12.92, 1.055 * pow(max(c, vec3(0.0)), vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c));
}
void main() {
  vec4 s = texture2D(uScene, vUv);
  vec3 b = texture2D(uBloom, vUv).rgb * uForce;
  vec3 c = clamp(s.rgb + b, 0.0, 1.0);
  float a = clamp(s.a + dot(b, vec3(0.2126, 0.7152, 0.0722)), 0.0, 1.0);
  gl_FragColor = vec4(oetf(c), a);
}`

interface Props {
  /** La part du flou qui s'ajoute à la scène. */
  readonly force?: number
  /** La luminance à partir de laquelle ça rayonne, en linéaire. */
  readonly seuil?: number
  /** Combien d'allers-retours de flou : chacun double la portée. */
  readonly passes?: number
}

export function Bloom({ force = 0.8, seuil = 1.0, passes = 2 }: Props): null {
  const { gl, scene, camera, size } = useThree()
  // LES FLOTTANTS, SI L'APPAREIL SAIT Y RENDRE : voir en tête.
  const flottants = useMemo(
    () =>
      gl.capabilities.isWebGL2 &&
      (gl.extensions.has('EXT_color_buffer_float') ||
        gl.extensions.has('EXT_color_buffer_half_float')),
    [gl],
  )

  const outils = useMemo(() => {
    void flottants
    const scene2D = new THREE.Scene()
    const cam2D = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
    const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2))
    quad.frustumCulled = false
    scene2D.add(quad)
    const mat = (fragment: string, uniforms: Record<string, THREE.IUniform>): THREE.ShaderMaterial =>
      new THREE.ShaderMaterial({
        vertexShader: SOMMET,
        fragmentShader: fragment,
        uniforms,
        depthTest: false,
        depthWrite: false,
        blending: THREE.NoBlending,
      })
    const mSeuil = mat(SEUIL, { uScene: { value: null }, uSeuil: { value: seuil } })
    const mFlou = mat(FLOU, { uTex: { value: null }, uDir: { value: new THREE.Vector2() } })
    const mFinal = mat(FINAL, {
      uScene: { value: null },
      uBloom: { value: null },
      uForce: { value: force },
    })
    const cible = (l: number, h: number, profondeur: boolean): THREE.WebGLRenderTarget =>
      new THREE.WebGLRenderTarget(Math.max(1, l), Math.max(1, h), {
        depthBuffer: profondeur,
        stencilBuffer: false,
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        type: flottants ? THREE.HalfFloatType : THREE.UnsignedByteType,
      })
    return { scene2D, cam2D, quad, mSeuil, mFlou, mFinal, cible, scene: null as THREE.WebGLRenderTarget | null, a: null as THREE.WebGLRenderTarget | null, b: null as THREE.WebGLRenderTarget | null }
  }, [flottants])

  // LES CIBLES SUIVENT LA FENÊTRE ET LA DENSITÉ : la scène à sa taille, le
  // flou au quart — *un halo n'a pas de détail à perdre.*
  useEffect(() => {
    const dpr = gl.getPixelRatio()
    const l = Math.round(size.width * dpr)
    const h = Math.round(size.height * dpr)
    outils.scene?.dispose()
    outils.a?.dispose()
    outils.b?.dispose()
    outils.scene = outils.cible(l, h, true)
    outils.a = outils.cible(Math.round(l / 4), Math.round(h / 4), false)
    outils.b = outils.cible(Math.round(l / 4), Math.round(h / 4), false)
  }, [gl, size, outils])

  useEffect(() => {
    // EN 8 BITS, LE SEUIL DESCEND : rien ne dépasse 1 dans la cible.
    outils.mSeuil.uniforms.uSeuil!.value = flottants ? seuil : Math.min(seuil, 0.8)
    outils.mFinal.uniforms.uForce!.value = force
  }, [outils, seuil, force, flottants])

  useEffect(
    () => () => {
      outils.scene?.dispose()
      outils.a?.dispose()
      outils.b?.dispose()
      outils.mSeuil.dispose()
      outils.mFlou.dispose()
      outils.mFinal.dispose()
      outils.quad.geometry.dispose()
    },
    [outils],
  )

  // PRIORITÉ 1 : c'est nous qui rendons, R3F s'abstient.
  useFrame(() => {
    const { scene2D, cam2D, quad, mSeuil, mFlou, mFinal } = outils
    const rtScene = outils.scene
    const rtA = outils.a
    const rtB = outils.b
    if (rtScene === null || rtA === null || rtB === null) return

    // 1. LA SCÈNE, avec son alpha.
    gl.setRenderTarget(rtScene)
    gl.setClearColor(0x000000, 0)
    gl.clear()
    gl.render(scene, camera)

    // 2. CE QUI DÉPASSE LE SEUIL, au quart.
    quad.material = mSeuil
    mSeuil.uniforms.uScene!.value = rtScene.texture
    gl.setRenderTarget(rtA)
    gl.render(scene2D, cam2D)

    // 3. LE FLOU, en allers-retours de plus en plus larges.
    quad.material = mFlou
    for (let p = 0; p < passes; p++) {
      const portee = 1 + p * 1.5
      mFlou.uniforms.uTex!.value = rtA.texture
      mFlou.uniforms.uDir!.value.set(portee / rtA.width, 0)
      gl.setRenderTarget(rtB)
      gl.render(scene2D, cam2D)
      mFlou.uniforms.uTex!.value = rtB.texture
      mFlou.uniforms.uDir!.value.set(0, portee / rtA.height)
      gl.setRenderTarget(rtA)
      gl.render(scene2D, cam2D)
    }

    // 4. À L'ÉCRAN : la scène, plus le flou, l'alpha qui suit.
    quad.material = mFinal
    mFinal.uniforms.uScene!.value = rtScene.texture
    mFinal.uniforms.uBloom!.value = rtA.texture
    gl.setRenderTarget(null)
    gl.clear()
    gl.render(scene2D, cam2D)
  }, 1)

  return null
}

/**
 * LA FUSION FRAPPE LA CARTE. Keko : « il faudrait un effet beaucoup plus juicy
 * quand on level up une carte : bump, particules, étoile qui vient de
 * l'extérieur frapper la carte à sa position en libérant des étincelles ».
 *
 * Une grande étoile d'or entre par le haut droit de l'écran, tourne, sème une
 * traînée, rapetisse en accélérant et FRAPPE la carte à la place exacte où le
 * peintre pose l'étoile du nouveau niveau (`etoileDuNiveau`). À l'impact :
 * un éclair, une onde, une gerbe d'étincelles qui retombent — et `onImpact`,
 * qui fait rebondir la carte, la repeint au niveau, sonne et vibre. *L'étoile
 * peinte prend le relais de celle qui vole* : celle-ci s'efface sur place.
 *
 * Tout se compte en `taille` (la largeur de la carte à l'écran) : la scène
 * est celle de la carte ouverte, à la profondeur `z` de la carte.
 */
import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

/** Les temps de la frappe, en secondes. */
const FRAPPE = {
  vol: 0.55,
  /** L'étoile volante s'efface sur place après l'impact. */
  fondu: 0.18,
  onde: 0.45,
  eclair: 0.22,
}

/** Combien d'étincelles au plus (la traînée et la gerbe se partagent l'anneau). */
const ETINCELLES = 220
const GERBE = 90
/**
 * OÙ VA UNE ÉTINCELLE ÉTEINTE : loin derrière la caméra. Éteinte (noire) à sa
 * dernière place, elle restait dessinée — et le bloom en faisait un point
 * NOIR fixe à l'écran (Keko : « des restes de particules noires après
 * l'animation »). Une étincelle morte ne se dessine plus nulle part.
 */
const RANGEE = 1e6

export interface Frappe {
  /** Un numéro par fusion : une frappe neuve à chaque changement. */
  readonly id: number
  /** Le point frappé, et le rayon de l'étoile peinte là (unités de la scène). */
  readonly cible: readonly [number, number, number]
  readonly rayon: number
  /** D'où elle part, hors de l'écran. */
  readonly depart: readonly [number, number, number]
  /** Le haut de l'écran visible (à la profondeur de la carte) : l'arc reste dessous. */
  readonly plafond: number
  /** La largeur de la carte : l'échelle de tout le reste. */
  readonly taille: number
}

/** Une étoile à cinq branches, de rayon 1. */
function formeDEtoile(creux: number): THREE.Shape {
  const s = new THREE.Shape()
  for (let k = 0; k < 10; k++) {
    const a = Math.PI / 2 + (k * Math.PI) / 5
    const r = k % 2 === 0 ? 1 : creux
    if (k === 0) s.moveTo(Math.cos(a) * r, Math.sin(a) * r)
    else s.lineTo(Math.cos(a) * r, Math.sin(a) * r)
  }
  s.closePath()
  return s
}

/** L'éclat d'une étincelle : un cœur rond et quatre branches, en blanc (la couleur vient du sommet). */
function texteDEclat(): THREE.CanvasTexture {
  const n = 64
  const c = document.createElement('canvas')
  c.width = c.height = n
  const ctx = c.getContext('2d')!
  const g = ctx.createRadialGradient(n / 2, n / 2, 0, n / 2, n / 2, n / 2)
  g.addColorStop(0, 'rgba(255,255,255,1)')
  g.addColorStop(0.25, 'rgba(255,255,255,0.8)')
  g.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, n, n)
  ctx.fillStyle = 'rgba(255,255,255,0.9)'
  ctx.beginPath()
  ctx.moveTo(n / 2, 0)
  ctx.lineTo(n / 2 + 3, n / 2)
  ctx.lineTo(n / 2, n)
  ctx.lineTo(n / 2 - 3, n / 2)
  ctx.closePath()
  ctx.moveTo(0, n / 2)
  ctx.lineTo(n / 2, n / 2 - 3)
  ctx.lineTo(n, n / 2)
  ctx.lineTo(n / 2, n / 2 + 3)
  ctx.closePath()
  ctx.fill()
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

/** Les teintes des étincelles : or clair, or, crème — au-dessus de 1 pour que le bloom les prenne. */
const TEINTES: readonly (readonly [number, number, number])[] = [
  [2.2, 1.7, 0.6],
  [1.9, 1.2, 0.3],
  [2.4, 2.2, 1.6],
]

/** `&frappe=lent` : la frappe cinq fois plus lente, pour la regarder. */
const RALENTI = typeof location !== 'undefined' && new URLSearchParams(location.search).get('frappe') === 'lent' ? 5 : 1

export function FrappeDuNiveau({ frappe, onImpact }: { frappe: Frappe | null; onImpact: () => void }): React.ReactElement | null {
  const etoile = useRef<THREE.Group>(null)
  const onde = useRef<THREE.Mesh>(null)
  const eclair = useRef<THREE.Mesh>(null)
  const points = useRef<THREE.Points>(null)
  const refImpact = useRef(onImpact)
  refImpact.current = onImpact

  const geometries = useMemo(
    () => ({
      or: new THREE.ShapeGeometry(formeDEtoile(0.45)),
      cerne: new THREE.ShapeGeometry(formeDEtoile(0.5)),
      onde: new THREE.RingGeometry(0.82, 1, 64),
      eclair: new THREE.CircleGeometry(1, 48),
    }),
    [],
  )
  const eclat = useMemo(texteDEclat, [])
  const nuee = useMemo(() => {
    const g = new THREE.BufferGeometry()
    // Toutes rangées HORS DE LA VUE au départ (voir `RANGEE`).
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(ETINCELLES * 3).fill(RANGEE), 3))
    g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(ETINCELLES * 3), 3))
    return {
      g,
      vitesse: new Float32Array(ETINCELLES * 3),
      vie: new Float32Array(ETINCELLES),
      duree: new Float32Array(ETINCELLES).fill(1),
      teinte: new Float32Array(ETINCELLES * 3),
      pesanteur: new Float32Array(ETINCELLES),
      prochaine: 0,
    }
  }, [])
  useEffect(
    () => () => {
      for (const g of Object.values(geometries)) g.dispose()
      eclat.dispose()
      nuee.g.dispose()
    },
    [geometries, eclat, nuee],
  )

  // L'ÉTAT DE LA FRAPPE EN COURS : le temps depuis le départ, l'impact donné ou non.
  const etat = useRef({ id: -1, t: 0, frappe: null as Frappe | null, impact: false, traine: 0 })

  const emettre = (x: number, y: number, z: number, vx: number, vy: number, vz: number, duree: number, pesanteur: number): void => {
    const i = nuee.prochaine
    nuee.prochaine = (i + 1) % ETINCELLES
    const pos = nuee.g.attributes.position!.array as Float32Array
    pos[i * 3] = x
    pos[i * 3 + 1] = y
    pos[i * 3 + 2] = z
    nuee.vitesse[i * 3] = vx
    nuee.vitesse[i * 3 + 1] = vy
    nuee.vitesse[i * 3 + 2] = vz
    nuee.vie[i] = 0
    nuee.duree[i] = duree
    nuee.pesanteur[i] = pesanteur
    const t = TEINTES[Math.floor(Math.random() * TEINTES.length)]!
    nuee.teinte[i * 3] = t[0]
    nuee.teinte[i * 3 + 1] = t[1]
    nuee.teinte[i * 3 + 2] = t[2]
  }

  useFrame((_, dt) => {
    const pas = Math.min(dt, 1 / 30) / RALENTI
    const e = etat.current
    if (frappe !== null && frappe.id !== e.id) {
      // UNE FRAPPE NEUVE : la précédente, si elle volait encore, donne son impact tout de suite.
      if (e.frappe !== null && !e.impact) refImpact.current()
      etat.current = { id: frappe.id, t: 0, frappe, impact: false, traine: 0 }
    }
    const f = etat.current.frappe
    const s = etat.current
    // LES ÉTINCELLES vivent leur vie même quand la frappe est finie.
    const pos = nuee.g.attributes.position!.array as Float32Array
    const col = nuee.g.attributes.color!.array as Float32Array
    const echelle = f?.taille ?? 1
    for (let i = 0; i < ETINCELLES; i++) {
      if (nuee.vie[i]! >= nuee.duree[i]!) {
        col[i * 3] = col[i * 3 + 1] = col[i * 3 + 2] = 0
        pos[i * 3] = pos[i * 3 + 1] = pos[i * 3 + 2] = RANGEE
        continue
      }
      nuee.vie[i]! += pas
      const frein = Math.exp(-3.2 * pas)
      nuee.vitesse[i * 3]! *= frein
      nuee.vitesse[i * 3 + 1] = nuee.vitesse[i * 3 + 1]! * frein - nuee.pesanteur[i]! * echelle * pas
      nuee.vitesse[i * 3 + 2]! *= frein
      pos[i * 3]! += nuee.vitesse[i * 3]! * pas
      pos[i * 3 + 1]! += nuee.vitesse[i * 3 + 1]! * pas
      pos[i * 3 + 2]! += nuee.vitesse[i * 3 + 2]! * pas
      // Le fondu : pleine d'abord, puis s'éteint (le mélange additif fait du noir un vide).
      const u = nuee.vie[i]! / nuee.duree[i]!
      const k = u < 0.5 ? 1 : 1 - (u - 0.5) / 0.5
      col[i * 3] = nuee.teinte[i * 3]! * k
      col[i * 3 + 1] = nuee.teinte[i * 3 + 1]! * k
      col[i * 3 + 2] = nuee.teinte[i * 3 + 2]! * k
    }
    nuee.g.attributes.position!.needsUpdate = true
    nuee.g.attributes.color!.needsUpdate = true
    if (points.current !== null) (points.current.material as THREE.PointsMaterial).size = 0.07 * echelle

    const et = etoile.current
    const on = onde.current
    const ec = eclair.current
    if (f === null || et === null || on === null || ec === null) return
    s.t += pas
    const [cx, cy, cz] = f.cible
    const [dx, dy, dz] = f.depart
    if (!s.impact) {
      // LE VOL : entrée par le bord, un arc qui reste DANS l'écran, puis la
      // plongée, de plus en plus vite. Grande tant qu'elle vole, elle se
      // resserre sur les derniers 40 % jusqu'à la taille de l'étoile peinte.
      const u = Math.min(1, s.t / FRAPPE.vol)
      const v = 0.35 * u + 0.65 * u * u
      const mx = (dx + cx) / 2 + f.taille * 0.1
      const my = Math.min(f.plafond - f.taille * 0.12, Math.max(dy, cy) + f.taille * 0.3)
      const a = (1 - v) * (1 - v)
      const b = 2 * (1 - v) * v
      const c = v * v
      const x = a * dx + b * mx + c * cx
      const y = a * dy + b * my + c * cy
      const z = a * dz + b * (dz + cz) / 2 + c * cz
      et.visible = true
      et.position.set(x, y, z + 0.002)
      et.rotation.z = (1 - v) * Math.PI * 3
      const serre = Math.min(1, Math.max(0, (u - 0.6) / 0.4))
      et.scale.setScalar(f.rayon + (f.taille * 0.16 - f.rayon) * (1 - serre * serre * (3 - 2 * serre)))
      // LA TRAÎNÉE : quelques étincelles lâchées sur le chemin.
      s.traine += pas * 70
      while (s.traine >= 1) {
        s.traine -= 1
        const ang = Math.random() * Math.PI * 2
        const vit = f.taille * (0.05 + Math.random() * 0.15)
        emettre(x, y, z, Math.cos(ang) * vit, Math.sin(ang) * vit, 0, 0.35 + Math.random() * 0.3, 0.6)
      }
      if (u >= 1) {
        s.impact = true
        s.t = 0
        // LA GERBE : tout autour du point frappé, plus fort vers le haut.
        for (let k = 0; k < GERBE; k++) {
          const ang = Math.random() * Math.PI * 2
          const vit = f.taille * (0.5 + Math.random() * 1.6)
          emettre(cx, cy, cz + 0.003, Math.cos(ang) * vit, Math.sin(ang) * vit * 0.9 + f.taille * 0.35, 0, 0.55 + Math.random() * 0.5, 2.6)
        }
        refImpact.current()
      }
      on.visible = false
      ec.visible = false
      return
    }
    // APRÈS L'IMPACT : l'étoile volante s'efface sur l'étoile peinte, l'onde s'élargit, l'éclair s'éteint.
    const fondu = Math.max(0, 1 - s.t / FRAPPE.fondu)
    et.visible = fondu > 0
    et.position.set(cx, cy, cz + 0.002)
    et.rotation.z = 0
    et.scale.setScalar(f.rayon * (1 + 0.6 * (1 - fondu)))
    for (const m of et.children) ((m as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity = fondu
    const uo = Math.min(1, s.t / FRAPPE.onde)
    on.visible = uo < 1
    on.position.set(cx, cy, cz + 0.001)
    on.scale.setScalar(f.taille * (0.05 + 0.55 * (1 - (1 - uo) * (1 - uo))))
    ;(on.material as THREE.MeshBasicMaterial).opacity = (1 - uo) * 0.9
    const ue = Math.min(1, s.t / FRAPPE.eclair)
    ec.visible = ue < 1
    ec.position.set(cx, cy, cz + 0.001)
    ec.scale.setScalar(f.taille * (0.08 + 0.2 * ue))
    ;(ec.material as THREE.MeshBasicMaterial).opacity = (1 - ue) * 0.85
    if (fondu === 0 && uo >= 1 && ue >= 1) {
      for (const m of et.children) ((m as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity = 1
      s.frappe = null
    }
  })

  return (
    <>
      <group ref={etoile} visible={false}>
        {/* Le cerne blanc dessous, l'or dessus — comme l'étoile peinte. */}
        <mesh geometry={geometries.cerne} scale={1.28} renderOrder={20}>
          <meshBasicMaterial color={[1.3, 1.25, 1.15]} transparent depthTest={false} toneMapped={false} />
        </mesh>
        <mesh geometry={geometries.or} position={[0, 0, 0.0005]} renderOrder={21}>
          <meshBasicMaterial color={[1.5, 0.95, 0.12]} transparent depthTest={false} toneMapped={false} />
        </mesh>
        {/* Son halo : elle se lit sur n'importe quel fond. */}
        <mesh geometry={geometries.eclair} scale={2.2} renderOrder={18}>
          <meshBasicMaterial color={[0.9, 0.6, 0.15]} map={eclat} transparent depthTest={false} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
        </mesh>
      </group>
      <mesh ref={onde} geometry={geometries.onde} visible={false} renderOrder={19}>
        <meshBasicMaterial color={[2.2, 1.8, 0.9]} transparent depthTest={false} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
      </mesh>
      <mesh ref={eclair} geometry={geometries.eclair} visible={false} renderOrder={19}>
        <meshBasicMaterial color={[2.4, 2.2, 1.5]} map={eclat} transparent depthTest={false} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
      </mesh>
      <points ref={points} geometry={nuee.g} renderOrder={22} frustumCulled={false}>
        <pointsMaterial
          map={eclat}
          vertexColors
          size={0.05}
          sizeAttenuation
          transparent
          depthTest={false}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </points>
    </>
  )
}

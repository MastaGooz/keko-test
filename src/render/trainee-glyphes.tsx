/**
 * PISTE 3 — LE TRAJET S'ÉCRIT, IL NE SE PARCOURT PAS.
 *
 * Rien ne vole. Une suite de **sceaux** s'allume le long de l'arc, l'un après
 * l'autre, du départ vers l'arrivée : la carte n'est pas transportée, elle est
 * *invoquée* d'un bout à l'autre. C'est la lecture la plus éloignée des deux
 * autres, et c'est pour ça qu'elle vaut d'être vue.
 *
 * Ce qu'elle achète : **un registre.** Un ruban de lumière peut être dans
 * n'importe quel jeu ; une inscription qui s'écrit dit un monde où les cartes
 * sont des objets d'un ordre ancien — le laiton, les sceaux, le temple. Et
 * elle est la seule des trois à faire lire le trajet **comme une phrase**, avec
 * un début et une fin.
 *
 * Ce qu'elle coûte : **elle est plus lente à lire.** Un sillage se comprend en
 * périphérie, une inscription demande un regard — donc cinq cartes défaussées
 * d'un coup risquent de faire une soupe de signes. C'est le point à juger.
 *
 * **CHAQUE SCEAU A SA PLACE, IL NE SE DÉPLACE PAS.** Il naît, il brûle, il
 * s'éteint là où il est. *Un signe qui glisse redevient une particule* — et on
 * aurait refait la comète en moins bien.
 *
 * **Ils s'allument en séquence**, chacun quand le front de l'invocation passe
 * sur lui : c'est cette cascade, et elle seule, qui donne le sens de lecture.
 */
import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { PropsSillage } from './sillage.ts'
import { borne, courbeEntre, DUREE_TRAINEE, lisser } from './sillage.ts'

const SCEAUX = 6

/** La taille d'un sceau, en unités de scène : une carte de main fait 1. */
const TAILLE = 0.3

/**
 * SIX SIGNES TRACÉS À LA MAIN, dans la même grammaire que le reste : des
 * traits nets, de l'or, une lueur propre. Aucun ne veut dire quoi que ce soit
 * — *ce qui compte est qu'ils soient DISTINCTS*, sinon la cascade se lit comme
 * un seul motif répété, donc comme un clignotement.
 */
const SIGNES: readonly THREE.CanvasTexture[] = (() => {
  const tracer = (dessin: (ctx: CanvasRenderingContext2D) => void): THREE.CanvasTexture | null => {
    const C = 64
    const toile = document.createElement('canvas')
    toile.width = C
    toile.height = C
    const ctx = toile.getContext('2d')
    if (ctx === null) return null
    ctx.translate(C / 2, C / 2)
    ctx.strokeStyle = '#fff3d6'
    ctx.lineWidth = 4
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    // La lueur est dans la MATIÈRE, comme le halo des cartes : un trait net
    // doublé d'un flou qui émet, jamais un trait pâle.
    ctx.shadowColor = 'rgba(255, 198, 104, 1)'
    ctx.shadowBlur = 10
    dessin(ctx)
    return new THREE.CanvasTexture(toile)
  }

  const R = 20
  const dessins: ((ctx: CanvasRenderingContext2D) => void)[] = [
    // Un trident
    (c) => {
      c.beginPath()
      c.moveTo(0, -R)
      c.lineTo(0, R)
      c.moveTo(-R * 0.7, -R * 0.3)
      c.lineTo(0, -R * 0.75)
      c.lineTo(R * 0.7, -R * 0.3)
      c.stroke()
    },
    // Un cercle barré
    (c) => {
      c.beginPath()
      c.arc(0, 0, R * 0.8, 0, Math.PI * 2)
      c.moveTo(-R * 0.55, R * 0.55)
      c.lineTo(R * 0.55, -R * 0.55)
      c.stroke()
    },
    // Un chevron double
    (c) => {
      c.beginPath()
      c.moveTo(-R * 0.7, -R * 0.8)
      c.lineTo(R * 0.5, 0)
      c.lineTo(-R * 0.7, R * 0.8)
      c.moveTo(-R * 0.1, -R * 0.8)
      c.lineTo(R * 0.9, 0)
      c.lineTo(-R * 0.1, R * 0.8)
      c.stroke()
    },
    // Un losange percé
    (c) => {
      c.beginPath()
      c.moveTo(0, -R)
      c.lineTo(R * 0.7, 0)
      c.lineTo(0, R)
      c.lineTo(-R * 0.7, 0)
      c.closePath()
      c.moveTo(0, -R * 0.35)
      c.lineTo(0, R * 0.35)
      c.stroke()
    },
    // Une croix à traverse
    (c) => {
      c.beginPath()
      c.moveTo(0, -R)
      c.lineTo(0, R)
      c.moveTo(-R * 0.75, -R * 0.2)
      c.lineTo(R * 0.75, -R * 0.2)
      c.moveTo(-R * 0.45, R * 0.45)
      c.lineTo(R * 0.45, R * 0.45)
      c.stroke()
    },
    // Un arc et sa corde
    (c) => {
      c.beginPath()
      c.arc(0, R * 0.2, R * 0.85, Math.PI * 1.15, Math.PI * 1.85)
      c.moveTo(-R * 0.8, -R * 0.15)
      c.lineTo(R * 0.8, -R * 0.15)
      c.moveTo(0, -R * 0.15)
      c.lineTo(0, R * 0.8)
      c.stroke()
    },
  ]
  return dessins.map(tracer).filter((t): t is THREE.CanvasTexture => t !== null)
})()

export function TraineeGlyphes({ depuis, vers, debut }: PropsSillage): React.JSX.Element {
  const groupe = useRef<THREE.Group>(null)
  const courbe = useMemo(() => courbeEntre(depuis, vers), [depuis, vers])

  /** Où chaque sceau se pose, quel signe il porte, et de combien il penche. */
  const places = useMemo(() => {
    const debutSigne = Math.floor(Math.random() * SIGNES.length)
    return Array.from({ length: SCEAUX }, (_, i) => {
      const u = (i + 0.5) / SCEAUX
      const p = courbe.getPoint(u)
      return {
        u,
        position: [p.x, p.y, p.z] as [number, number, number],
        signe: SIGNES[(debutSigne + i) % SIGNES.length] ?? null,
        // Un peu de travers, et jamais du même angle : six signes parfaitement
        // droits se lisent comme une police, pas comme une inscription.
        roulis: (Math.random() - 0.5) * 0.9,
        taille: 0.82 + Math.random() * 0.4,
      }
    })
  }, [courbe])

  const matieres = useMemo(
    () =>
      places.map(
        (pl) =>
          new THREE.MeshBasicMaterial({
            map: pl.signe,
            transparent: true,
            depthWrite: false,
            toneMapped: false,
            blending: THREE.AdditiveBlending,
            opacity: 0,
          }),
      ),
    [places],
  )

  const forme = useMemo(() => new THREE.PlaneGeometry(TAILLE, TAILLE), [])

  useFrame((etat) => {
    const g = groupe.current
    if (g === null) return
    const t = etat.clock.elapsedTime - debut
    const vie = DUREE_TRAINEE * 1.45
    const actif = t >= 0 && t < vie
    g.visible = actif
    if (!actif) return

    // LE FRONT DE L'INVOCATION : il court d'un bout à l'autre, et chaque sceau
    // s'allume quand il lui passe dessus.
    const front = lisser(borne(t / DUREE_TRAINEE)) * 1.25
    // Tout s'éteint ensemble sur la fin : l'inscription se referme.
    const reste = 1 - lisser(borne((t - DUREE_TRAINEE) / (vie - DUREE_TRAINEE)))

    for (let i = 0; i < places.length; i += 1) {
      const pl = places[i]!
      const m = matieres[i]
      const enfant = g.children[i]
      if (m === undefined || enfant === undefined) continue
      // Une montée franche puis une longue traîne : le signe s'inscrit d'un
      // coup et s'attarde, comme une marque au fer.
      const ecart = front - pl.u
      const vif = ecart < 0 ? 0 : 1 - borne(ecart / 0.5)
      const k = Math.pow(vif, 1.6)
      m.opacity = k * reste
      enfant.scale.setScalar(pl.taille * (0.55 + 0.45 * lisser(borne(ecart / 0.12))))
    }
  })

  return (
    <group ref={groupe}>
      {places.map((pl, i) => (
        <mesh
          key={pl.u}
          position={pl.position}
          rotation={[0, 0, pl.roulis]}
          geometry={forme}
          material={matieres[i]}
          raycast={() => null}
        />
      ))}
    </group>
  )
}

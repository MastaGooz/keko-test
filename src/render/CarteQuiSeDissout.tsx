/**
 * LA CARTE DÉFAUSSÉE RÉTRÉCIT JUSQU'À DEVENIR LA TÊTE DE LA COMÈTE.
 *
 * Keko, en deux temps : « il faudrait que quand les cartes sont défaussées on
 * ait l'effet inverse — lumière puis transfert vers la défausse », puis « ce
 * serait super que la carte qui devient lumière rétrécisse vraiment et
 * devienne effectivement la tête de la comète, non ? »
 *
 * *C'est la naissance jouée à l'envers* : la pioche fait arriver une traînée
 * qui devient une carte, la défausse doit faire d'une carte une traînée qui
 * s'en va. Mais la première version s'embrasait puis DISPARAISSAIT, et une
 * traînée partait de là — **deux évènements au même endroit, pas une
 * transformation.**
 *
 * **POUR QUE CE SOIT UN SEUL OBJET, IL FAUT QUE LES DEUX SE REJOIGNENT SUR
 * TOUT** : la place, la taille, l'inclinaison et le dessin. D'où le contrat
 * partagé dans `sillage.ts` — la carte finit exactement à la taille de la tête
 * (`TETE_SILLAGE` × `ETIRE_TETE`), s'éteint exactement quand la traînée part
 * (`PART_ENVOL`), et la tête reprend son inclinaison pour se coucher sur sa
 * route en chemin. *Une valeur écrite des deux côtés se serait désaccordée au
 * premier réglage, et le raccord est précisément ce qui ne doit jamais se
 * voir.*
 *
 * **LE DESSIN BASCULE AVANT LA TAILLE D'ARRIVÉE.** Sur son dernier tiers, la
 * carte se fond dans le rectangle de crème qui SERA la tête — deux plans
 * superposés, même transformation, opacités croisées. Sans ce fondu, le liseré
 * d'ambre apparaissait d'un coup au moment du relais : *une transformation qui
 * se termine par une substitution n'en est pas une.*
 *
 * **Elle reste à sa place, avec l'inclinaison de l'éventail.** Une carte qui
 * s'en va n'a aucune raison de se redresser d'abord : c'est la même erreur que
 * la version où la carte voyageait entière et arrivait droite.
 *
 * **L'ÉCLAT PASSE PAR LA COULEUR, pas par un plan blanc posé dessus.** En
 * `toneMapped: false`, une couleur au-delà de 1 éclaircit la texture au lieu de
 * la recouvrir : l'image reste lisible pendant qu'elle blanchit, là où un voile
 * l'aurait effacée d'un coup.
 */
import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { CarteAPeindre } from './texture-carte.ts'
import { textureDeCarte } from './texture-carte.ts'
import { HAUT, LARGE } from './Carte3D.tsx'
import { borne, ETIRE_TETE, lisser, PART_ENVOL, TETE_SILLAGE, TEXTURE_TETE } from './sillage.ts'

/** Ce que dure l'embrasement avant que la traînée ne parte, en secondes. */
export const DUREE_DISSOLUTION = 0.22

/** Ce qui sépare deux cartes de la même main : elles brûlent l'une après l'autre. */
export const PAS_DISSOLUTION = 0.05

/**
 * CE QUI BRÛLE PASSE DEVANT SA PLACE.
 *
 * L'éventail d'avant et celui d'après ont exactement les mêmes places : la
 * carte piochée naissait donc AU MÊME POINT que celle qui partait, et le test
 * de profondeur tranchait en faveur de la nouvelle — *on ne voyait rien brûler
 * du tout.* Un cheveu d'avance suffit, et il se justifie tout seul : ce qui
 * s'en va quitte le plan de la main.
 */
const AVANCE = 0.06

/** La métamorphose s'achève quand la traînée prend le relais, pas après. */
const DUREE = DUREE_DISSOLUTION * PART_ENVOL

type Props = {
  carte: CarteAPeindre
  place: [number, number, number]
  rotation: [number, number, number]
  /** L'instant du départ, en secondes d'horloge de la scène. */
  debut: number
}

export function CarteQuiSeDissout({ carte, place, rotation, debut }: Props): React.JSX.Element {
  const groupe = useRef<THREE.Group>(null)

  const matiereCarte = useMemo(
    () => new THREE.MeshBasicMaterial({ transparent: true, toneMapped: false, depthWrite: false }),
    [],
  )
  const matiereTete = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        map: TEXTURE_TETE,
        transparent: true,
        toneMapped: false,
        depthWrite: false,
        opacity: 0,
      }),
    [],
  )

  useEffect(() => {
    let vivant = true
    void textureDeCarte(carte)
      .then((t) => {
        if (!vivant) return
        matiereCarte.map = t
        matiereCarte.needsUpdate = true
      })
      .catch(() => {})
    return () => {
      vivant = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [carte.nom, carte.cout, matiereCarte])

  useFrame((etat) => {
    const g = groupe.current
    if (g === null) return
    const k = borne((etat.clock.elapsedTime - debut) / DUREE)
    // ELLE S'EFFACE EXACTEMENT QUAND LA TRAÎNÉE PART : la laisser une image de
    // plus poserait un jumeau immobile à côté de la tête qui s'en va.
    g.visible = k < 1
    if (!g.visible) return

    matiereCarte.color.setScalar(1 + 2.6 * k * k)
    // LE DESSIN BASCULE AVANT LA TAILLE : le dernier tiers fond la carte dans
    // le rectangle qui sera la tête, pour que le relais ne montre aucune
    // substitution.
    const bascule = lisser(borne((k - 0.62) / 0.38))
    matiereCarte.opacity = 1 - bascule
    matiereTete.opacity = bascule

    // ELLE RÉTRÉCIT JUSQU'À LA TAILLE EXACTE DE LA TÊTE. Elle grandissait d'un
    // rien avant, ce qui disait « elle enfle et s'évapore » — l'inverse de ce
    // qu'on raconte maintenant.
    const e = lisser(k)
    g.scale.set(
      1 + (TETE_SILLAGE * ETIRE_TETE[0] - 1) * e,
      1 + (TETE_SILLAGE * ETIRE_TETE[1] - 1) * e,
      1,
    )
  })

  return (
    <group ref={groupe} position={[place[0], place[1], place[2] + AVANCE]} rotation={rotation}>
      <mesh material={matiereCarte} raycast={() => null}>
        <planeGeometry args={[LARGE, HAUT]} />
      </mesh>
      <mesh material={matiereTete} position={[0, 0, 0.001]} raycast={() => null}>
        <planeGeometry args={[LARGE, HAUT]} />
      </mesh>
    </group>
  )
}

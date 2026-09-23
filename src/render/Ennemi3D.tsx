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
import { useEffect, useMemo, useState } from 'react'
import * as THREE from 'three'
import type { Ennemi } from '../logic/combat.ts'
import { creature } from '../ui/illustrations.ts'

/** La hauteur d'un corps, en unités de carte (une carte fait 1 de large). */
export const CORPS = 1.5

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

type Props = {
  ennemi: Ennemi
  index: number
  position: [number, number, number]
  /** Il est visable : une carte est engagée et il est encore debout. */
  visable?: boolean
  onViser?: (index: number) => void
}

export function Ennemi3D({ ennemi, index, position, visable = false, onViser }: Props): React.JSX.Element {
  const [texture, setTexture] = useState<THREE.Texture | null>(null)
  const mort = ennemi.pv <= 0

  useEffect(() => {
    let vivant = true
    void textureCreature(ennemi.nom, `${ennemi.nom}-${index}`).then((t) => {
      if (vivant) setTexture(t)
    })
    return () => {
      vivant = false
    }
  }, [ennemi.nom, index])

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
    <group position={position}>
      <mesh
        onPointerDown={(e) => {
          if (mort || !visable) return
          e.stopPropagation()
          onViser?.(index)
        }}
      >
        <planeGeometry args={[CORPS, CORPS * (60 / 64)]} />
        <primitive object={materiau} attach="material" />
      </mesh>

      {/* L'OMBRE AU SOL : c'est elle qui pose la bête dans un lieu. Un cadre
          autour la remettrait dans la vignette dont on l'a sortie. */}
      {!mort && (
        <mesh position={[0, -CORPS * 0.48, -0.02]} rotation={[0, 0, 0]}>
          <planeGeometry args={[CORPS * 0.8, CORPS * 0.12]} />
          <meshBasicMaterial color="#000000" transparent opacity={0.45} toneMapped={false} />
        </mesh>
      )}
    </group>
  )
}

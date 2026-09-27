/**
 * L'ONDE D'UNE PIÈCE QUI SE FIXE DANS SON SLOT.
 *
 * Demandé par Keko, au bout de la culbute : « quand elle se fixe dedans on
 * fait un petit effet d'onde, comme si une énergie magique s'en échappait ».
 *
 * **Ce module ne monte rien : il prête sa matière et son mouvement à
 * `Carte3D`.** Elle a d'abord été un composant voisin, monté au moment du
 * dépôt puis monté en permanence, déclenché par une prop puis par une ref —
 * et **dans tous les cas sa boucle s'arrêtait à l'instant du lâcher**, mesuré
 * à la sonde. *Le plus sûr moyen qu'une mise en scène parte à l'heure est de
 * la confier à l'objet qui la joue.*
 *
 * **Trois anneaux décalés, pas un seul.** Un anneau unique se lit comme un
 * cercle qu'on agrandit ; trois qui se suivent se lisent comme quelque chose
 * qui *sort* — c'est le décalage qui fait l'onde, pas la forme. Même raison
 * que les cinq brassées du mélange, là où une traînée aurait dit « une
 * carte ».
 *
 * **Additif, et en or.** L'or est la couleur de tout ce qui a de la valeur
 * ici ; et une lumière qui s'AJOUTE au fond est une lueur, là où une couleur
 * qui le recouvre est une peinture claire — la leçon du contour des cartes.
 */
import * as THREE from 'three'

/** Ce que dure l'onde, en secondes. */
export const DUREE_ONDE = 0.72

/** Ce que chaque anneau attend derrière son prédécesseur. */
const DECALAGE = 0.085

/** Combien d'anneaux la composent. L'éclat central vient en plus. */
export const ANNEAUX_ONDE = 3

/** Ce que dure l'éclat du centre : le choc, pas la lueur. */
const DUREE_ECLAT = 0.22

/** Les matériaux d'une onde : un par anneau, plus un pour l'éclat. */
export function matieresDOnde(): THREE.MeshBasicMaterial[] {
  return Array.from(
    { length: ANNEAUX_ONDE + 1 },
    () =>
      new THREE.MeshBasicMaterial({
        color: '#ffd9a0',
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
        side: THREE.DoubleSide,
      }),
  )
}

/**
 * Pose l'onde à `dt` secondes de son départ. Rend `true` quand elle a fini.
 *
 * Les rayons sont en unités de CARTE : l'échelle du groupe qui la porte les
 * met d'elle-même à la taille du slot, il n'y a rien à convertir.
 */
export function poserLOnde(
  dt: number,
  anneaux: readonly (THREE.Mesh | null)[],
  eclat: THREE.Mesh | null,
  matieres: readonly THREE.MeshBasicMaterial[],
): boolean {
  let fini = true
  anneaux.forEach((maille, i) => {
    const matiere = matieres[i]
    if (maille === null || matiere === undefined) return
    const q = (dt - i * DECALAGE) / DUREE_ONDE
    if (q < 0 || q >= 1) {
      matiere.opacity = 0
      maille.scale.setScalar(0)
      if (q < 1) fini = false
      return
    }
    fini = false
    // IL PART VITE ET S'ÉTEINT LENTEMENT, le contraste de vitesse du bond des
    // créatures : une onde régulière se lit comme une animation, pas comme
    // quelque chose qui s'échappe.
    const e = 1 - (1 - q) * (1 - q) * (1 - q)
    maille.scale.setScalar(0.3 + 2.4 * e)
    matiere.opacity = (1 - q) * (1 - q) * 0.9
  })

  // L'ÉCLAT AU CENTRE est bref : c'est le coup, pas la lueur. Sans lui,
  // l'onde naît de rien et se lit comme un cercle posé là.
  const matiere = matieres[ANNEAUX_ONDE]
  if (eclat !== null && matiere !== undefined) {
    const q = dt / DUREE_ECLAT
    if (q < 0 || q >= 1) {
      matiere.opacity = 0
      eclat.scale.setScalar(0)
    } else {
      eclat.scale.setScalar(0.55 + 1.1 * q)
      matiere.opacity = (1 - q) * 0.6
    }
  }
  return fini
}

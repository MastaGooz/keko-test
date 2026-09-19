/**
 * Le retour visuel du coup : un chiffre qui saute, un corps qui encaisse.
 *
 * Rien ici ne touche à l'état du jeu — ce sont des marques posées sur le DOM
 * juste après un rendu, et retirées toutes seules. Le moteur ne sait pas
 * qu'elles existent, et le jeu reste jouable si on supprime ce fichier.
 *
 * Pourquoi ça compte : sans retour, jouer une carte ne fait que changer un
 * chiffre. Le joueur n'a pas frappé, il a édité un tableur. C'est exactement
 * ce qui empêchait de juger une sensation.
 */
import type { View } from './render.ts'

/** Durée des marques, en ms. Assez court pour ne jamais retarder la tape. */
const DUREE = 420

/**
 * Souligne le corps qui vient d'encaisser et fait sauter les dégâts au-dessus.
 * `corps` est l'index de l'ennemi, ou 'joueur'.
 */
export function encaisse(view: View, corps: number | 'joueur', montant: number): void {
  const cible = view.root.querySelector<HTMLElement>(`[data-corps="${corps}"]`)
  if (cible === null) return

  cible.classList.remove('encaisse')
  // Force un reflow : sans ça, deux coups d'affilée ne rejouent pas l'animation.
  void cible.offsetWidth
  cible.classList.add('encaisse')

  const chiffre = document.createElement('span')
  chiffre.className = 'degats-voles'
  chiffre.textContent = `−${montant}`
  cible.appendChild(chiffre)

  window.setTimeout(() => {
    chiffre.remove()
    cible.classList.remove('encaisse')
  }, DUREE)
}

/**
 * L'assaut : l'ennemi se ramasse, puis bondit. C'est ce qui manquait pour lire
 * un tour — on voyait sa barre de vie baisser sans voir QUI avait frappé.
 *
 * L'animation remplace le souffle le temps de se jouer, plutôt que de s'y
 * ajouter : deux animations sur la même propriété se marchent dessus. La
 * respiration reprend d'elle-même à la fin.
 */
export function assaut(view: View, noms: string[]): void {
  for (const nom of noms) {
    const creature = [...view.ennemis.querySelectorAll('.creature')].find(
      (c) => c.querySelector('.nom')?.textContent === nom,
    )
    const corps = creature?.querySelector('.silhouette')
    if (corps === null || corps === undefined) continue

    corps.classList.remove('assaut')
    // Force un reflow : sans ça, deux assauts d'affilée ne rejouent pas.
    void (corps as HTMLElement & { offsetWidth: number }).getBoundingClientRect()
    corps.classList.add('assaut')
    window.setTimeout(() => corps.classList.remove('assaut'), DUREE_ASSAUT)
  }
}

/** Durée de l'assaut, en ms. Doit suivre la règle CSS `.silhouette.assaut`. */
const DUREE_ASSAUT = 420

/** Le corps tombe : une marque sur toute la rangée, le temps de le voir partir. */
export function tombe(view: View): void {
  view.ennemis.classList.remove('un-de-moins')
  void view.ennemis.offsetWidth
  view.ennemis.classList.add('un-de-moins')
  window.setTimeout(() => view.ennemis.classList.remove('un-de-moins'), DUREE)
}

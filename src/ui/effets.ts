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
/** Les nettoyages en cours, pour qu'un ancien coup n'efface pas le suivant. */
const enCours = new WeakMap<Element, number>()

export function encaisse(view: View, corps: number | 'joueur', montant: number): void {
  const cible = view.root.querySelector<HTMLElement>(`[data-corps="${corps}"]`)
  if (cible === null) return

  // Deux coups rapprochés se marchaient dessus : le nettoyage du premier
  // arrivait pendant le second et lui coupait son animation, et les deux
  // chiffres se superposaient au même endroit, illisibles.
  window.clearTimeout(enCours.get(cible))
  cible.querySelectorAll('.degats-voles').forEach((v) => v.remove())

  cible.classList.remove('encaisse')
  // Force un reflow : sans ça, deux coups d'affilée ne rejouent pas l'animation.
  void cible.offsetWidth
  cible.classList.add('encaisse')

  const chiffre = document.createElement('span')
  chiffre.className = 'degats-voles'
  chiffre.textContent = `−${montant}`
  cible.appendChild(chiffre)

  enCours.set(
    cible,
    window.setTimeout(() => {
      chiffre.remove()
      cible.classList.remove('encaisse')
    }, DUREE),
  )
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
const DUREE_ASSAUT = 580

/**
 * Le temps entre deux ennemis d'une même salve.
 *
 * **Il doit dépasser la durée d'un assaut complet, secousse comprise.** Sinon
 * l'élan du suivant démarre pendant la secousse déclenchée par le précédent —
 * et comme la secousse est portée par un parent des créatures, sa montée lente
 * et posée se fait secouer. L'anticipation, qui est tout l'intérêt du geste,
 * est alors détruite : Keko l'a vu tout de suite sur le deuxième et le
 * troisième monstre, alors qu'un monstre seul était impeccable.
 */
export const PAS_ENTRE_FRAPPES = 620

/** Quand l'impact tombe dans l'assaut (46 % de l'animation). */
export const INSTANT_IMPACT = 265

/**
 * La secousse d'écran, sur l'impact. Refusée s'il y a un calque ouvert : elle
 * est portée par `.app`, qui contient des enfants en position fixe, et un
 * transform en ferait leur bloc conteneur.
 */
export function secouerEcran(view: View): void {
  if (view.root.querySelector('.voile') !== null) return
  const app = view.root.querySelector('.app')
  if (app === null) return
  window.clearTimeout(enCours.get(app))
  app.classList.remove('secoue')
  void app.getBoundingClientRect()
  app.classList.add('secoue')
  enCours.set(app, window.setTimeout(() => app.classList.remove('secoue'), 260))
}

/** Ce que dure l'encaissement du coup, avant que l'agonie ne commence. */
export const DUREE_COUP = DUREE

/** Ce que dure la chute, avant que le corps ne quitte l'écran. */
export const DUREE_CHUTE = 520

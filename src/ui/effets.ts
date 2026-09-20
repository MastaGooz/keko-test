/**
 * Le retour visuel du coup : un corps qui bondit, un chiffre qui saute, un
 * écran qui tremble.
 *
 * Rien ici ne touche à l'état du jeu — ce sont des marques posées sur le DOM
 * juste après un rendu, et retirées toutes seules. Le moteur ne sait pas
 * qu'elles existent, et le jeu reste jouable si on supprime ce fichier.
 *
 * Pourquoi ça compte : sans retour, jouer une carte ne fait que changer un
 * chiffre. Le joueur n'a pas frappé, il a édité un tableur. C'est exactement
 * ce qui empêchait de juger une sensation.
 *
 * **Ce module a été supprimé puis rétabli**, et il faut savoir pourquoi pour ne
 * pas refaire le trajet. Un gros plan d'attaque à la Darkest Dungeon l'avait
 * remplacé : un voile, les deux combattants en grand, une charge. C'était plus
 * spectaculaire, et Keko l'a abandonné pour une raison qui n'a rien à voir avec
 * le rendu — *il demandait des images de personnages à dessiner*, une par pose
 * et par camp. « Je vais me faire trop chier avec les images à crafter. » Le
 * bond, lui, ne coûte rien : il travaille sur les silhouettes qui existent
 * déjà.
 */
import type { View } from './render.ts'

/** Durée des marques, en ms. Assez court pour ne jamais retarder la tape. */
const DUREE = 420

/** Les nettoyages en cours, pour qu'un ancien coup n'efface pas le suivant. */
const enCours = new WeakMap<Element, number>()

/**
 * Souligne le corps qui vient d'encaisser et fait sauter les dégâts au-dessus.
 * `corps` est l'index de l'ennemi, ou 'joueur'.
 */
export function encaisse(view: View, corps: number | 'joueur', montant: number): void {
  const cible = view.root.querySelector<HTMLElement>(`[data-corps="${corps}"]`)
  if (cible === null) return

  // Deux coups rapprochés se marchaient dessus : le nettoyage du premier
  // arrivait pendant le second et lui coupait son animation, et les deux
  // chiffres se superposaient au même endroit, illisibles.
  window.clearTimeout(enCours.get(cible))
  view.root.querySelectorAll('.degats-voles').forEach((v) => v.remove())

  cible.classList.remove('encaisse')
  // Force un reflow : sans ça, deux coups d'affilée ne rejouent pas l'animation.
  void cible.offsetWidth
  cible.classList.add('encaisse')

  // Le chiffre est posé sur la PAGE, pas sur le corps : un nouveau rendu — et
  // la mort en déclenche un — effacerait un enfant du corps en plein vol.
  const boite = cible.getBoundingClientRect()
  const chiffre = document.createElement('span')
  chiffre.className = 'degats-voles'
  chiffre.textContent = `−${montant}`
  chiffre.style.left = `${boite.left + boite.width / 2}px`
  chiffre.style.top = `${boite.top + boite.height * 0.28}px`
  view.root.appendChild(chiffre)

  enCours.set(
    cible,
    window.setTimeout(() => {
      chiffre.remove()
      cible.classList.remove('encaisse')
    }, DUREE),
  )
}

/** Durée de l'assaut, en ms. Doit suivre la règle CSS `.silhouette.assaut`. */
const DUREE_ASSAUT = 580

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
    void corps.getBoundingClientRect()
    corps.classList.add('assaut')
    window.setTimeout(() => corps.classList.remove('assaut'), DUREE_ASSAUT)
  }
}

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
 * Le délai entre le coup et la mort du corps.
 *
 * Calé sur **la secousse**, pas sur la durée de vie du chiffre de dégâts :
 * l'impact se lit dès que le corps accuse le coup, et attendre que le chiffre
 * ait fini de monter mettait une latence molle avant l'extinction. Le chiffre,
 * lui, continue sa course par-dessus — il est posé sur la page et non sur le
 * corps, donc il survit au rendu qui déclenche l'extinction.
 */
export const DUREE_COUP = 230

/**
 * La secousse d'écran, sur l'impact. Refusée s'il y a un calque ouvert : elle
 * est portée par `.app`, qui contient des enfants en position fixe (le panneau,
 * le voile, les arches), et un transform en ferait leur bloc conteneur.
 *
 * Sa force suit la taille des corps (`--secousse`), sans quoi la même animation
 * raconte deux choses différentes selon l'appareil.
 */
export function secouerEcran(view: View, force: 'normale' | 'forte' = 'normale'): void {
  if (view.root.querySelector('.voile') !== null) return
  const app = view.root.querySelector('.app')
  if (app === null) return
  window.clearTimeout(enCours.get(app))
  app.classList.remove('secoue', 'secoue-fort')
  void app.getBoundingClientRect()
  app.classList.add(force === 'forte' ? 'secoue-fort' : 'secoue')
  enCours.set(
    app,
    window.setTimeout(() => app.classList.remove('secoue', 'secoue-fort'), 360),
  )
}

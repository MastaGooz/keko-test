/**
 * Ce qui reste du retour visuel du combat : la secousse d'écran, et le tempo
 * de l'agonie.
 *
 * Le chiffre des dégâts et l'assaut des corps vivaient ici. Le **gros plan
 * d'attaque** (`ui/duel.ts`) les a repris : il n'y a plus de coup porté sur la
 * scène, tous passent par le cadre. Ce qui n'est plus appelé a été supprimé
 * plutôt que gardé « au cas où » — `git log` sait le rendre, et un fichier qui
 * documente chaque chiffre ne peut pas se permettre d'en garder de faux.
 *
 * Rien ici ne touche à l'état du jeu — ce sont des marques posées sur le DOM
 * juste après un rendu, et retirées toutes seules. Le jeu reste jouable si on
 * supprime ce fichier.
 */
import type { View } from './render.ts'

/**
 * Le délai entre le coup et le début de l'agonie.
 *
 * Il est calé sur **la secousse**, pas sur la durée de vie du chiffre de
 * dégâts : l'impact se lit dès que le corps accuse le coup, et attendre que
 * le chiffre ait fini de monter mettait une latence molle avant la chute.
 */
export const DUREE_COUP = 230

/** Les nettoyages en cours, pour qu'un ancien coup n'efface pas le suivant. */
const enCours = new WeakMap<Element, number>()

/**
 * La secousse d'écran, sur l'impact. Refusée s'il y a un calque ouvert : elle
 * est portée par `.app`, qui contient des enfants en position fixe, et un
 * transform en ferait leur bloc conteneur.
 */
export function secouerEcran(view: View, force: 'normale' | 'forte' = 'normale'): void {
  if (view.root.querySelector('.voile') !== null) return
  const app = view.root.querySelector('.app')
  if (app === null) return
  window.clearTimeout(enCours.get(app))
  app.classList.remove('secoue', 'fort')
  void app.getBoundingClientRect()
  app.classList.add('secoue')
  if (force === 'forte') app.classList.add('fort')
  enCours.set(
    app,
    window.setTimeout(() => app.classList.remove('secoue', 'fort'), force === 'forte' ? 360 : 260),
  )
}

/** Ce que dure la chute, avant que le corps ne quitte l'écran. */
export const DUREE_CHUTE = 520

/**
 * Le gros plan d'attaque, à la Darkest Dungeon.
 *
 * À chaque coup porté, un voile tombe sur la scène et les deux combattants
 * apparaissent en grand, face à face. **Le voile passe par-dessus les corps,
 * jamais par-dessus la main ni les tas** : ce qu'on tient reste lisible pendant
 * qu'on regarde le coup partir — d'où l'empilement, `.duel` sous `#cartes`.
 *
 * **Le calque vit DANS `.app`, et c'est structurel.** Posé à côté, il était
 * bien sous la main tant que rien ne bougeait — puis la secousse posait un
 * `transform` sur `.app`, ce qui en fait un contexte d'empilement : tout son
 * contenu retombait alors au niveau de `.app` elle-même, c'est-à-dire SOUS le
 * voile. La main, les tas, l'orbe et le bouton disparaissaient le temps de la
 * secousse et revenaient après. Dans `.app`, le calque et les cartes sont
 * frères dans le même contexte : leur ordre ne dépend plus d'un transform.
 *
 * La séquence est **l'arrivée elle-même** : les deux corps surgissent, l'écran
 * est secoué au même instant, puis **plus rien ne bouge** le temps qu'on les
 * regarde. Il y a eu une version où l'attaquant bondissait dans le gros plan ;
 * elle rejouait dans le cadre un geste que le cadre racontait déjà, et elle
 * coûtait ses 580 ms. Ici l'impact n'est pas une animation, c'est une
 * apparition — et le temps qu'on gagne, on le rend en temps d'arrêt.
 *
 * Comme `effets.ts`, ce fichier est purement décoratif : il ne touche jamais à
 * l'état, et le jeu reste jouable si on le supprime. Il ne fait que poser des
 * marques sur le DOM après un rendu, et les retirer tout seul.
 *
 * Il n'y a **qu'une grammaire de frappe, et deux camps qui l'empruntent** : le
 * gros plan est le même que le coup vienne du joueur ou d'en face.
 */
import type { View } from './render.ts'
import { creature, teteDeMort } from './illustrations.ts'

/** Un combattant, tel que le gros plan a besoin de le connaître. */
export type Figure = { nom: string; espece: string; teinte: string }

/**
 * Quand l'écran encaisse : **à la fin de la charge de l'attaquant**, pas à son
 * arrivée.
 *
 * La secousse a d'abord été calée sur l'apparition elle-même (60 ms), quand
 * rien ne bougeait dans le cadre. Depuis que l'attaquant charge, elle doit
 * tomber sur le bout de son élan rapide — sinon le coup précède le geste qui
 * le porte, et on lit deux évènements sans rapport. Charge : 120 ms de retard
 * plus 83 ms d'élan vif, donc 200.
 */
export const IMPACT_DUEL = 200

/**
 * Quand le tampon de mort s'abat. Juste après l'impact : le coup d'abord, ce
 * qu'il a fait ensuite — l'ordre inverse ferait lire la mort comme la cause.
 */
export const TAMPON_DUEL = IMPACT_DUEL + 90

/** Quand le voile commence à se lever. Entre les deux : rien ne bouge. */
const SORTIE = 640

/**
 * Ce que dure un gros plan, de bout en bout.
 *
 * C'est le prix du procédé, et il est réel : une salve de trois ennemis coûte
 * trois gros plans. La moitié de ce temps est désormais du TEMPS D'ARRÊT, pas
 * de l'animation — c'est ce que Keko a demandé, « le temps de bien voir les
 * persos ». Si ça devient long, c'est ce palier-là qu'on raccourcit.
 */
export const DUREE_DUEL = 800

/** Le repos entre deux gros plans d'une même salve. */
export const PAS_ENTRE_DUELS = DUREE_DUEL + 60

/** Les minuteurs du gros plan en cours, pour qu'un nouveau annule l'ancien. */
let enCours: number[] = []

function planifier(quand: number, quoi: () => void): void {
  enCours.push(window.setTimeout(quoi, quand))
}

/**
 * Ouvre le gros plan et joue le coup.
 *
 * `joueur` et `ennemi` gardent toujours le même côté — le joueur à gauche,
 * l'ennemi à droite, comme sur la scène. Retourner le décor selon l'attaquant
 * casserait le sens de lecture ET les silhouettes, qui sont dessinées pour se
 * faire face dans cet ordre. **C'est la LUMIÈRE qui désigne l'attaquant** : il
 * porte un liseré vif, sa cible reste mate. Rien ne bouge, donc c'est le seul
 * signe disponible — il doit rester franc.
 */
export function duel(
  view: View,
  joueur: Figure,
  ennemi: Figure,
  attaquant: 'joueur' | 'ennemi',
  degats: number,
  mort = false,
): void {
  fermerDuel(view)

  // Dans `.app` et pas à côté : voir l'en-tête du fichier.
  const scene = view.root.querySelector('.app')
  if (scene === null) return

  const calque = document.createElement('div')
  calque.className = 'duel'
  calque.innerHTML =
    `<div class="duel-plateau">` +
    figureHtml(joueur, 'joueur', attaquant === 'joueur') +
    `<div class="duel-entre"></div>` +
    figureHtml(ennemi, 'ennemi', attaquant === 'ennemi') +
    `</div>`
  scene.appendChild(calque)

  // Un rendu d'écart avant d'ouvrir : poser la classe dans la même image que
  // l'insertion ne déclencherait aucune transition.
  requestAnimationFrame(() => calque.classList.add('ouvert'))

  // La secousse n'est plus posée ici : le calque étant dans `.app`, celle de
  // `.app` l'emporte avec elle. Une seule secousse, tout tremble ensemble.
  planifier(IMPACT_DUEL, () => {
    const touche = calque.querySelector<HTMLElement>('.duel-corps:not(.attaque)')
    if (touche !== null) chiffre(view, touche, degats)
  })

  // La mort se joue ICI, dans le cadre, et nulle part ailleurs : le corps
  // s'éteint en silhouette noire et la tête de mort s'y abat. Il n'y a plus
  // d'agonie sur la scène — le corps abattu ne revient simplement pas.
  if (mort) {
    planifier(TAMPON_DUEL, () => {
      const touche = calque.querySelector<HTMLElement>('.duel-corps:not(.attaque)')
      touche?.classList.add('abattu')
    })
  }

  planifier(SORTIE, () => calque.classList.remove('ouvert'))
  planifier(DUREE_DUEL, () => calque.remove())
}

/** Referme un gros plan encore ouvert et annule ce qu'il avait programmé. */
export function fermerDuel(view: View): void {
  enCours.forEach((t) => window.clearTimeout(t))
  enCours = []
  view.root.querySelectorAll('.duel').forEach((d) => d.remove())
}

function figureHtml(figure: Figure, cote: string, attaque: boolean): string {
  return (
    `<div class="duel-corps ${cote}${attaque ? ' attaque' : ''}" ` +
    `style="--teinte:${figure.teinte}">` +
    `<span class="duel-chair">${creature(figure.espece, `duel-${cote}`)}` +
    `<span class="socle"></span>${teteDeMort()}</span>` +
    `<span class="duel-nom">${figure.nom}</span>` +
    `</div>`
  )
}

/**
 * Le chiffre des dégâts, posé sur la PAGE et non dans le corps : le calque se
 * referme et emporterait son contenu, alors que le chiffre doit survivre à la
 * fermeture — c'est lui qui fait le lien avec la scène qui réapparaît.
 */
function chiffre(view: View, sur: HTMLElement, montant: number): void {
  view.root.querySelectorAll('.degats-voles').forEach((v) => v.remove())
  const boite = sur.getBoundingClientRect()
  const span = document.createElement('span')
  span.className = 'degats-voles grand'
  span.textContent = `−${montant}`
  span.style.left = `${boite.left + boite.width / 2}px`
  span.style.top = `${boite.top + boite.height * 0.3}px`
  view.root.appendChild(span)
  planifier(DUREE_DUEL, () => span.remove())
}

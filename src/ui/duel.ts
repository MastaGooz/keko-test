/**
 * Le gros plan d'attaque, à la Darkest Dungeon.
 *
 * À chaque coup porté, un voile tombe sur la scène et les deux combattants
 * apparaissent en grand, face à face. L'attaquant bondit, la cible encaisse,
 * le voile se lève. **Le voile passe par-dessus les corps, jamais par-dessus
 * la main ni les tas** : ce qu'on tient reste lisible pendant qu'on regarde le
 * coup partir — d'où l'empilement, `.duel` sous `#cartes`.
 *
 * Comme `effets.ts`, ce fichier est purement décoratif : il ne touche jamais à
 * l'état, et le jeu reste jouable si on le supprime. Il ne fait que poser des
 * marques sur le DOM après un rendu, et les retirer tout seul.
 *
 * Le joueur reçoit **le même assaut que les ennemis** : il n'y a pas deux
 * grammaires de frappe, il y a une frappe et deux camps qui l'empruntent.
 */
import type { View } from './render.ts'
import { creature } from './illustrations.ts'

/** Un combattant, tel que le gros plan a besoin de le connaître. */
export type Figure = { nom: string; espece: string; teinte: string }

/**
 * Quand l'assaut démarre. Le voile met 120 ms à tomber ; l'élan part avant
 * qu'il ait fini, sinon on attend devant un écran noir.
 */
const ENTREE = 60

/** Quand le coup porte. `INSTANT_IMPACT` d'`effets.ts` vaut 46 % de l'assaut. */
export const IMPACT_DUEL = ENTREE + 265

/** Quand le voile commence à se lever : l'assaut vient de se reposer. */
const SORTIE = 620

/**
 * Ce que dure un gros plan, de bout en bout.
 *
 * C'est le prix du procédé, et il est réel : une salve de trois ennemis coûte
 * trois gros plans. Réglé au plus court sans casser la lecture du geste —
 * l'assaut lui-même fait déjà 580 ms, et il n'est pas compressible sans perdre
 * le contraste de vitesse qui lui donne son poids.
 */
export const DUREE_DUEL = 780

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
 * faire face dans cet ordre. C'est l'ASSAUT qui désigne l'attaquant, pas la
 * place.
 */
export function duel(
  view: View,
  joueur: Figure,
  ennemi: Figure,
  attaquant: 'joueur' | 'ennemi',
  degats: number,
): void {
  fermerDuel(view)

  const calque = document.createElement('div')
  calque.className = 'duel'
  calque.innerHTML =
    `<div class="duel-plateau">` +
    figureHtml(joueur, 'joueur', attaquant === 'joueur') +
    `<div class="duel-entre"></div>` +
    figureHtml(ennemi, 'ennemi', attaquant === 'ennemi') +
    `</div>`
  view.root.appendChild(calque)

  // Un rendu d'écart avant d'ouvrir : poser la classe dans la même image que
  // l'insertion ne déclencherait aucune transition.
  requestAnimationFrame(() => calque.classList.add('ouvert'))

  const frappeur = calque.querySelector<HTMLElement>(`.duel-corps.attaque .silhouette`)
  planifier(ENTREE, () => frappeur?.classList.add('assaut'))

  planifier(IMPACT_DUEL, () => {
    const touche = calque.querySelector<HTMLElement>('.duel-corps:not(.attaque)')
    if (touche !== null) {
      touche.classList.add('encaisse')
      chiffre(view, touche, degats)
    }
    // La secousse est portée par le calque LUI-MÊME en plus de `.app` : il vit
    // hors de `.app`, donc le transform de la secousse ne l'atteindrait pas et
    // le gros plan resterait de marbre pendant que le reste tremble.
    calque.classList.remove('secoue')
    void calque.getBoundingClientRect()
    calque.classList.add('secoue')
  })

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
    `<span class="socle"></span></span>` +
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

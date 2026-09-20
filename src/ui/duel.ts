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
import { portraitTrouve, silhouetteJoueur } from './portrait.ts'

/** Un combattant, tel que le gros plan a besoin de le connaître. */
export type Figure = { nom: string; espece: string; teinte: string }

/**
 * Quand l'écran encaisse : **à la fin de la charge de l'attaquant**, pas à son
 * arrivée.
 *
 * La secousse a d'abord été calée sur l'apparition elle-même (60 ms), quand
 * rien ne bougeait dans le cadre. Depuis que l'attaquant charge, elle doit
 * tomber sur sa pleine extension — sinon le coup précède le geste qui le
 * porte, et on lit deux évènements sans rapport. Charge : 70 ms de retard, 35
 * d'appel, 45 de frappe, donc 150.
 */
export const IMPACT_DUEL = 150

/**
 * Quand le tampon de mort s'abat. Juste après l'impact : le coup d'abord, ce
 * qu'il a fait ensuite — l'ordre inverse ferait lire la mort comme la cause.
 */
export const TAMPON_DUEL = IMPACT_DUEL + 90

/**
 * Ce que dure le fondu de sortie, retranché de la durée totale.
 *
 * Exporté parce que `main.ts` en a besoin : c'est au DÉBUT du fondu que les
 * corps doivent revenir sur la scène, pas à sa fin. Les rendre après, c'est
 * laisser voir leur place vide pendant que le voile se lève.
 */
export const FONDU_DUEL = 160

/**
 * **Au DOIGT, un gros plan ennemi dure plus longtemps qu'à la souris.** C'est
 * la seule grandeur de temps du jeu qui dépend de l'appareil, et elle a mis
 * trois essais à trouver sa forme.
 *
 * À durée d'horloge égale — vérifiée à 800/150 ms sur l'appareil de Keko — un
 * gros plan ennemi lui paraissait systématiquement plus court sur téléphone que
 * sur PC. J'ai d'abord attribué l'écart à une asymétrie d'ATTENTION (le temps
 * qu'on attend paraît plus long que le temps qui vous tombe dessus) et allongé
 * les gros plans ennemis **partout**. Verdict de Keko : « le temps d'attaque
 * des ennemis sur PC est trop long ». *L'écart était donc bien lié à
 * l'appareil, pas au camp qui frappe* — et une correction globale ne pouvait
 * que casser le côté qui allait bien.
 *
 * Pourquoi l'appareil : c'est la même famille de raison que le plancher de
 * dérive. Sur un petit écran, la scène traverse moins de pixels et l'oeil a
 * moins à parcourir, donc il a fini de lire l'image avant que le temps ne soit
 * écoulé. **Le PC garde exactement le réglage qui lui convenait.**
 *
 * `(pointer: coarse)` et non une largeur de fenêtre : ce qu'on distingue, c'est
 * le doigt de la souris, pas un nombre de pixels — une petite fenêtre sur un PC
 * reste un PC. Et c'est relu à chaque gros plan : brancher une souris ne doit
 * pas demander de recharger la page.
 */
function auDoigt(): boolean {
  try {
    return window.matchMedia('(pointer: coarse)').matches
  } catch {
    // Sans `matchMedia`, on prend le réglage PC : c'est le plus court, donc le
    // pire qu'on risque est une salve un peu vive.
    return false
  }
}

const DUREE_ENNEMI_DOIGT = 950
const DUREE_ENNEMI_SOURIS = 800

export const DUREE_DUEL = 800

/** Idem, quand le coup tue : la tête de mort et le corps noir restent posés. */
export const DUREE_DUEL_MORT = 1500

/**
 * Ce que dure un gros plan, selon qui frappe et s'il tue. **Le seul endroit qui
 * en décide** : `main.ts` s'en sert pour le verrou d'entrée et pour rendre la
 * scène, et les trois doivent tomber ensemble.
 */
export function dureeDuDuel(attaquant: 'joueur' | 'ennemi', mort: boolean): number {
  if (mort) return DUREE_DUEL_MORT
  if (attaquant !== 'ennemi') return DUREE_DUEL
  return auDoigt() ? DUREE_ENNEMI_DOIGT : DUREE_ENNEMI_SOURIS
}

/**
 * Le temps qu'on laisse à l'oeil pour arriver avant la première frappe.
 *
 * La salve suivait la tape sur « Fin du tour » sans un battement : le premier
 * gros plan s'ouvrait alors qu'on regardait encore le bouton. *Un coup qu'on
 * n'a pas vu commencer paraît plus court que les autres.*
 */
export const OUVERTURE_SALVE = 250

/**
 * Le repos entre deux gros plans d'une même salve.
 *
 * Il valait 60 ms : la sortie de l'un et l'entrée du suivant se touchaient, et
 * une salve de deux ou trois frappeurs se lisait comme un bloc précipité plutôt
 * que comme des coups distincts. *Un coup n'a pas besoin de durer plus
 * longtemps pour peser, il a besoin de retomber avant le suivant.*
 *
 * **Il suit l'appareil comme la durée du gros plan**, et pour la même raison :
 * porté à 240 ms partout, il ajoutait presque une demi-seconde à une salve de
 * trois sur PC, où rien ne demandait d'allonger. 140 ms y suffisent à rendre la
 * scène visible entre deux coups — c'était tout l'objet de la correction.
 */
export function pasEntreDuels(): number {
  return dureeDuDuel('ennemi', false) + (auDoigt() ? 240 : 140)
}

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
  const duree = dureeDuDuel(attaquant, mort)
  const sortie = duree - FONDU_DUEL

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
    if (touche !== null) chiffre(view, touche, degats, duree)
  })

  // La mort s'ANNONCE ici : le corps s'éteint en silhouette noire et la tête de
  // mort s'y abat. Mais elle ne s'y achève plus — le corps revient sur la scène
  // avec le voile qui se lève, toujours noir et toujours marqué, et c'est là
  // qu'il s'efface. Voir `agonie` dans `main.ts`.
  if (mort) {
    planifier(TAMPON_DUEL, () => {
      const touche = calque.querySelector<HTMLElement>('.duel-corps:not(.attaque)')
      touche?.classList.add('abattu')
    })
  }

  planifier(sortie, () => calque.classList.remove('ouvert'))
  planifier(duree, () => calque.remove())
}

/**
 * Referme un gros plan encore ouvert et annule ce qu'il avait programmé.
 *
 * Le chiffre des dégâts part avec, et c'est ici sa place : il vit hors du
 * calque (voir `chiffre`), donc retirer le calque ne l'emporte pas, et le
 * minuteur qui devait l'effacer vient justement d'être annulé. Nettoyé au coup
 * suivant, il restait posé 200 ms sur le gros plan d'après.
 */
export function fermerDuel(view: View): void {
  enCours.forEach((t) => window.clearTimeout(t))
  enCours = []
  view.root.querySelectorAll('.duel, .degats-voles').forEach((d) => d.remove())
}

/**
 * **Pas de nom sous les figures.** Il y en a eu un ; Keko l'a fait retirer, et
 * il avait raison : dans un cadre qui ne montre que deux corps, le nom
 * n'apprend rien — on vient de choisir sa cible, et la silhouette la dit. Il ne
 * faisait que rallonger la figure vers le bas, ce qui poussait tout le cadre
 * vers le haut sur un écran court.
 *
 * `figure.nom` reste dans le type : c'est ce qui sert à retrouver l'espèce et
 * la teinte côté `main.ts`.
 */
function figureHtml(figure: Figure, cote: string, attaque: boolean): string {
  // Le joueur montre son portrait ici AUSSI : c'est le cadre qui le donne à
  // voir en grand, ne le mettre que sur la scène n'aurait testé qu'une
  // vignette. Et il a DEUX poses — lame tendue quand il frappe, épée basse
  // quand il encaisse : le cadre est le seul endroit du jeu où la différence
  // se voit.
  const portrait = cote === 'joueur' && portraitTrouve()
  const chair = portrait
    ? silhouetteJoueur(attaque ? 'attaque' : 'repos')
    : creature(figure.espece, `duel-${cote}`)

  // PAS DE SOCLE SOUS UN PORTRAIT. C'est l'ombre au sol, dessinée pour une
  // silhouette SVG qui touche le bas de sa boîte ; une image a ses propres
  // marges transparentes, donc l'ombre se détache d'elle et se lit comme un
  // trait noir posé dessous — d'autant qu'ici elle fait 409 px de large. Keko :
  // « je vois comme un trait noir sous le joueur durant l'anim ». Même défaut
  // que sur le corps en agonie, même cause.
  const socle = portrait ? '' : '<span class="socle"></span>'

  return (
    `<div class="duel-corps ${cote}${attaque ? ' attaque' : ''}" ` +
    `style="--teinte:${figure.teinte}">` +
    `<span class="duel-chair">${chair}${socle}${teteDeMort()}</span>` +
    `</div>`
  )
}

/**
 * Le chiffre des dégâts, posé sur la PAGE et non dans le corps : le calque se
 * referme et emporterait son contenu, alors que le chiffre doit survivre à la
 * fermeture — c'est lui qui fait le lien avec la scène qui réapparaît.
 */
function chiffre(view: View, sur: HTMLElement, montant: number, duree: number): void {
  const boite = sur.getBoundingClientRect()
  const span = document.createElement('span')
  span.className = 'degats-voles grand'
  span.textContent = `−${montant}`
  span.style.left = `${boite.left + boite.width / 2}px`
  span.style.top = `${boite.top + boite.height * 0.3}px`
  view.root.appendChild(span)
  planifier(duree, () => span.remove())
}

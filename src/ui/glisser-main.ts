/**
 * Les gestes de la main : on GLISSE une carte pour la jouer, on la TAPE pour
 * la regarder de près, on la glisse à côté de ses voisines pour ranger sa main.
 *
 * C'est la grammaire de Hearthstone, et elle remplace les deux tapes. Ce qu'on
 * y gagne : le geste de jouer devient physique — on sort la carte de la main —
 * et la tape, libérée, peut enfin servir à *lire* une carte, ce qui manquait
 * depuis que la main est en éventail et que le recouvrement mange les trois
 * quarts de chaque carte.
 *
 * **Ce qui déclenche la prise n'est pas le même au doigt et à la souris.** À la
 * souris, un déplacement suffit : elle ne dérive pas. Au doigt, si — toujours
 * de quelques pixels — donc un seuil court faisait passer les tapes pour des
 * glissers reposés sur place, et le zoom ne s'ouvrait jamais. Keko : « quand je
 * clique sur une carte sur le tel elle ne zoome pas, je dois laisser enfoncer
 * pour ça ». Au doigt, **c'est donc le MAINTIEN qui prend la carte** : on
 * appuie, elle monte. Le déplacement reste une seconde porte, mais avec un
 * seuil deux fois plus large.
 *
 * Une fois la carte prise, c'est la hauteur du doigt à la levée qui tranche :
 * au-dessus de la main, on joue ; dedans, on range.
 *
 * **Et ce qui décide de la tape, c'est le DÉPLACEMENT, jamais la durée.** Une
 * carte prise par le maintien puis relâchée sans avoir bougé se regarde, elle
 * ne se range pas — la reposer là d'où elle vient ne voulait rien dire de toute
 * façon. Conséquence : *il n'existe aucune façon de rater le zoom*. Un appui
 * bref l'ouvre, un appui long aussi, et entre les deux la carte se soulève pour
 * dire qu'on la tient. C'est ce qui manquait : tant que la durée entrait dans
 * la décision, un geste trop lent ou trop rapide tombait dans le mauvais cas.
 *
 * Évènements `pointer*` et non `touch*`/`mouse*` : un seul code pour le doigt,
 * la souris et le stylet.
 */
import type { View } from './render.ts'

/** Sous ce déplacement, la souris n'a pas glissé : elle a cliqué. */
const SEUIL_SOURIS = 8

/**
 * Au doigt il en faut le double : une tape dérive, et la prendre pour un
 * glisser coûte le zoom.
 */
const SEUIL_DOIGT = 16

/** Au doigt, rester appuyé prend la carte, même sans bouger d'un pixel. */
const DELAI_PRISE = 160

/** Le temps qu'on laisse au clic de compatibilité pour se manifester. */
const FENETRE_CLIC = 400

/**
 * À quelle distance du lâcher on reconnaît le clic de compatibilité.
 *
 * Il tombe au pixel près là où le doigt a quitté l'écran ; un vrai tap sur une
 * cible est forcément ailleurs. 24 px laissent passer le tremblement du doigt
 * sans mordre sur un geste voisin.
 */
const RAYON_CLIC = 24

/**
 * Avale le `click` que le navigateur émet APRÈS un geste tactile.
 *
 * C'est un vestige de compatibilité : après un `pointerup` tactile, le
 * navigateur synthétise un clic à la même position, pour les pages qui ne
 * connaissent que la souris. Ici le geste a déjà tout fait — et ce clic
 * retombe sur ce qui se trouve désormais sous le doigt, c'est-à-dire **le fond
 * du zoom qui vient de s'ouvrir**. Il le refermait dans la foulée : le zoom
 * s'ouvrait et disparaissait dans la même image.
 *
 * C'est ce qui expliquait les trois symptômes rapportés par Keko, y compris le
 * plus trompeur — « il faut laisser enfoncé pour que ça zoome ». Un appui long
 * ne produit pas toujours ce clic, donc c'était le seul cas qui survivait.
 *
 * **On le reconnaît à sa POSITION, pas à sa cible.** Il a d'abord été filtré par
 * élément — la main, le fond du zoom — et ça laissait passer tout le reste,
 * dont la scène : en sortant une carte pour la jouer, le clic retombait sur le
 * décor, qui répond en REPOSANT la carte. Keko : « le premier clic tactile sur
 * la cible ne marche pas, je dois le faire deux fois » — en réalité son premier
 * tap était bon, c'est le geste d'avant qui avait déjà annulé le ciblage.
 *
 * *Un clic de compatibilité tombe au pixel près là où le doigt a lâché* : c'est
 * le seul discriminant qui vaille, puisqu'un vrai tap est ailleurs.
 */
function avalerLeClicDeCompatibilite(x: number, y: number): void {
  let minuteur = 0
  const avaler = (e: Event): void => {
    const cible = e.target as HTMLElement | null
    if (cible === null) return
    // LE CLIC DE COMPATIBILITE TOMBE LA OU LE DOIGT A LACHE, au pixel près.
    // C'est le seul discriminant fiable : un vrai tap sur une cible est
    // ailleurs, et filtrer par ELEMENT laissait passer tout ce qui n'est ni la
    // main ni le zoom — dont la scène, qui répond en reposant la carte.
    const souris = e as MouseEvent
    const memeEndroit = Math.hypot(souris.clientX - x, souris.clientY - y) <= RAYON_CLIC
    const surLaMain = cible.closest('#cartes') !== null || cible.closest('.zoom-fond') !== null
    if (!memeEndroit && !surLaMain) return
    e.stopPropagation()
    e.preventDefault()
    arreter()
  }
  const arreter = (): void => {
    window.clearTimeout(minuteur)
    window.removeEventListener('click', avaler, true)
  }
  // En capture : il faut l'intercepter AVANT l'écoute déléguée de `input.ts`.
  window.addEventListener('click', avaler, true)
  minuteur = window.setTimeout(arreter, FENETRE_CLIC)
}

export type GestesMain = {
  /** La carte a été sortie de la main : on la joue. */
  jouer: (index: number) => void
  /** Elle a été reposée ailleurs dans la main. */
  reordonner: (de: number, vers: number) => void
  /** Simple tape : on la regarde de près. */
  regarder: (index: number) => void
  /** La carte sous le doigt, ou tenue : de quoi montrer ce qu'elle emporterait. */
  survol: (index: number | null) => void
  /** Le jeu accepte-t-il un geste en ce moment ? */
  disponible: () => boolean
}

export function brancherMain(view: View, gestes: GestesMain): void {
  let carte: HTMLElement | null = null
  let index = 0
  let depart = { x: 0, y: 0 }
  let glisse = false
  /** Le doigt a franchi le seuil : ce n'est plus une tape, quoi qu'il arrive. */
  let aBouge = false
  let fantome: HTMLElement | null = null
  let tactile = false
  let minuteur = 0

  /** Le haut de la main : au-dessus, on est sorti. */
  function plafond(): number {
    return view.cartes.getBoundingClientRect().top
  }

  /**
   * À quelle place le doigt repose la carte : le nombre de cartes dont le
   * MILIEU est à sa gauche, **la carte tenue exclue**.
   *
   * Les deux points comptent. Le milieu plutôt que les bords, parce qu'avec un
   * éventail qui se recouvre à 68 % les bords se chevauchent et deux voisines
   * revendiqueraient la même bande. Et la carte tenue exclue, parce que c'est
   * précisément l'index d'insertion dans la main UNE FOIS RETIRÉE — ce que
   * `reordonnerMain` attend. La compter décalait d'un cran tous les
   * déplacements vers la gauche.
   */
  function fenteSousLeDoigt(x: number): number {
    let fente = 0
    for (const [i, c] of cartes().entries()) {
      if (i === index) continue
      const boite = c.getBoundingClientRect()
      if (x > boite.left + boite.width / 2) fente += 1
    }
    return fente
  }

  function cartes(): HTMLElement[] {
    return [...view.cartes.querySelectorAll<HTMLElement>('.carte')]
  }

  /**
   * Ouvre la fente : les cartes d'avant s'écartent à gauche, celles d'après à
   * droite. C'est une VRAIE place qui s'ouvre, pas un repère posé sur une
   * voisine — dans un éventail qui se recouvre aux trois quarts, une arête ne
   * dit pas de quel côté de la carte on va tomber.
   */
  function ouvrirLaFente(fente: number | null): void {
    let rang = 0
    for (const [i, c] of cartes().entries()) {
      c.classList.remove('ecarte-gauche', 'ecarte-droite')
      if (i === index) continue
      if (fente !== null) c.classList.add(rang < fente ? 'ecarte-gauche' : 'ecarte-droite')
      rang += 1
    }
  }

  /** Prend la carte : elle quitte la main et un fantôme suit le doigt. */
  function prendre(x: number, y: number): void {
    if (carte === null || glisse) return
    glisse = true
    carte.classList.add('saisie')
    // Un fantôme plutôt que la carte elle-même : elle porte la rotation et le
    // décalage de l'éventail, et la déplacer voudrait dire les défaire.
    fantome = carte.cloneNode(true) as HTMLElement
    fantome.classList.remove('saisie', 'ecarte-gauche', 'ecarte-droite')
    fantome.classList.add('fantome-carte')
    fantome.style.width = `${carte.offsetWidth}px`
    fantome.style.height = `${carte.offsetHeight}px`
    fantome.style.left = `${x}px`
    fantome.style.top = `${y}px`
    document.body.appendChild(fantome)
    // Pendant le glisser AUSSI : au doigt il n'y a pas de survol, et c'est
    // justement le moment ou l'apercu sert -- on choisit sa cible en le
    // regardant.
    gestes.survol(index)
  }

  function nettoyer(): void {
    window.clearTimeout(minuteur)
    carte?.classList.remove('saisie')
    fantome?.remove()
    fantome = null
    ouvrirLaFente(null)
    view.root.classList.remove('main-sortie')
    carte = null
    glisse = false
  }

  view.cartes.addEventListener('pointerdown', (e) => {
    if (!gestes.disponible()) return
    const cible = (e.target as HTMLElement).closest<HTMLElement>('[data-main]')
    if (cible === null) return
    carte = cible
    index = Number(cible.dataset.main)
    depart = { x: e.clientX, y: e.clientY }
    glisse = false
    aBouge = false
    tactile = e.pointerType !== 'mouse'
    // Au doigt, le maintien prend la carte sans qu'on ait besoin de bouger.
    // À la souris, non : un clic qui s'attarde reste un clic.
    window.clearTimeout(minuteur)
    if (tactile) minuteur = window.setTimeout(() => prendre(depart.x, depart.y), DELAI_PRISE)
    // La capture garde les évènements même si le doigt sort de la carte — et
    // il en sort forcément, puisque sortir de la main EST le geste.
    try {
      cible.setPointerCapture(e.pointerId)
    } catch {
      /* tant pis : le glisser marchera quand même dans la plupart des cas */
    }
  })

  // Le suivi du geste est pose sur la FENETRE et non sur la main : le doigt en
  // sort forcement -- sortir EST le geste. La capture du pointeur devrait y
  // suffire, mais elle peut echouer (elle est dans un `try`), et alors les
  // evenements partent a l'element sous le doigt, qui n'est plus la main. Avec
  // la fenetre, le glisser ne depend plus de la capture.
  window.addEventListener('pointermove', (e) => {
    if (carte === null) return
    const seuil = tactile ? SEUIL_DOIGT : SEUIL_SOURIS
    if (Math.hypot(e.clientX - depart.x, e.clientY - depart.y) >= seuil) aBouge = true
    if (!glisse) {
      if (!aBouge) return
      window.clearTimeout(minuteur)
      prendre(e.clientX, e.clientY)
    }
    if (fantome !== null) {
      fantome.style.left = `${e.clientX}px`
      fantome.style.top = `${e.clientY}px`
    }
    const sortie = e.clientY < plafond()
    view.root.classList.toggle('main-sortie', sortie)
    // Hors de la main, le fantôme s'allume et vibre : c'est le seul endroit où
    // lâcher déclenche quelque chose, il doit le dire de lui-même.
    fantome?.classList.toggle('prete', sortie)
    ouvrirLaFente(sortie ? null : fenteSousLeDoigt(e.clientX))
  })

  function relacher(e: PointerEvent): void {
    if (carte === null) return
    const deplacee = aBouge
    const sortie = e.clientY < plafond()
    const place = fenteSousLeDoigt(e.clientX)
    nettoyer()
    gestes.survol(null)
    if (e.pointerType !== 'mouse') avalerLeClicDeCompatibilite(e.clientX, e.clientY)
    if (!gestes.disponible()) return
    // Le DÉPLACEMENT décide, jamais la durée. Une carte soulevée puis reposée
    // sans avoir bougé se regarde : c'est le geste le plus courant, il ne peut
    // pas dépendre de la vitesse du doigt.
    if (!deplacee) gestes.regarder(index)
    else if (sortie) gestes.jouer(index)
    else gestes.reordonner(index, place)
  }

  window.addEventListener('pointerup', relacher)
  window.addEventListener('pointercancel', () => {
    nettoyer()
    gestes.survol(null)
  })

  // Le survol a la souris. `pointerover`/`pointerout` et non `enter`/`leave` :
  // ils remontent, donc une seule paire d'ecouteurs sur la main suffit alors
  // que les cartes sont reconstruites a chaque rendu.
  view.cartes.addEventListener('pointerover', (e) => {
    if (carte !== null) return
    const sous = (e.target as HTMLElement).closest<HTMLElement>('[data-main]')
    gestes.survol(sous === null ? null : Number(sous.dataset.main))
  })

  view.cartes.addEventListener('pointerout', (e) => {
    if (carte !== null) return
    const vers = (e.relatedTarget as HTMLElement | null)?.closest<HTMLElement>('[data-main]')
    gestes.survol(vers === undefined || vers === null ? null : Number(vers.dataset.main))
  })
}

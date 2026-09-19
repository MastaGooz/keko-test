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
 * **Le seuil sépare les trois gestes, et il est le seul juge.** Sous 8 px, on
 * n'a pas glissé, on a tapé. Au-delà, c'est la hauteur du doigt à la levée qui
 * tranche : au-dessus de la main, on joue ; dedans, on range. Aucun mode, aucun
 * état à retenir — le geste se lit à son terme.
 *
 * Évènements `pointer*` et non `touch*`/`mouse*` : un seul code pour le doigt,
 * la souris et le stylet.
 */
import type { View } from './render.ts'

/** Sous ce déplacement, c'est une tape et pas un glisser. */
const SEUIL = 8

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
  let fantome: HTMLElement | null = null

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

  function nettoyer(): void {
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
    // La capture garde les évènements même si le doigt sort de la carte — et
    // il en sort forcément, puisque sortir de la main EST le geste.
    try {
      cible.setPointerCapture(e.pointerId)
    } catch {
      /* tant pis : le glisser marchera quand même dans la plupart des cas */
    }
  })

  view.cartes.addEventListener('pointermove', (e) => {
    if (carte === null) return
    if (!glisse) {
      if (Math.hypot(e.clientX - depart.x, e.clientY - depart.y) < SEUIL) return
      glisse = true
      carte.classList.add('saisie')
      // Un fantôme plutôt que la carte elle-même : elle porte la rotation et le
      // décalage de l'éventail, et la déplacer voudrait dire les défaire.
      fantome = carte.cloneNode(true) as HTMLElement
      fantome.classList.remove('saisie', 'ecarte-gauche', 'ecarte-droite')
      fantome.classList.add('fantome-carte')
      fantome.style.width = `${carte.offsetWidth}px`
      fantome.style.height = `${carte.offsetHeight}px`
      document.body.appendChild(fantome)
      // Pendant le glisser AUSSI : au doigt il n'y a pas de survol, et c'est
      // justement le moment ou l'apercu sert -- on choisit sa cible en le
      // regardant.
      gestes.survol(index)
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
    const aGlisse = glisse
    const sortie = e.clientY < plafond()
    const place = fenteSousLeDoigt(e.clientX)
    nettoyer()
    gestes.survol(null)
    if (!gestes.disponible()) return
    // Une tape n'est pas un glisser raté : c'est l'autre geste.
    if (!aGlisse) gestes.regarder(index)
    else if (sortie) gestes.jouer(index)
    else gestes.reordonner(index, place)
  }

  view.cartes.addEventListener('pointerup', relacher)
  view.cartes.addEventListener('pointercancel', () => {
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

/**
 * Le glisser-deposer du butin.
 *
 * Une couche de confort, rien de plus : **chaque destination est aussi un
 * bouton**. Sur un telephone, le glisser seul est fragile — doigt qui derape,
 * defilement parasite, zone trop petite — donc la tape doit toujours marcher,
 * et c'est elle qui porte la fonctionnalite.
 *
 * D'ou l'implementation : a la fin du glisser, on se contente de **cliquer**
 * la destination survolee. Aucune logique n'est dupliquee, tout repasse par le
 * meme chemin que la tape.
 *
 * Evenements `pointer*` et non `touch*`/`mouse*` : un seul code pour le doigt,
 * la souris et le stylet.
 */

const SEUIL = 6

export function brancherGlisser(racine: HTMLElement): void {
  let piece: HTMLElement | null = null
  let fantome: HTMLElement | null = null
  let survole: Element | null = null
  let depart = { x: 0, y: 0 }
  let bouge = false
  let origine: string | null = null

  function depots(x: number, y: number): Element | null {
    // Le fantome ne capte pas le pointeur, on peut interroger sous le doigt.
    return document.elementFromPoint(x, y)?.closest('[data-depot]') ?? null
  }

  function surligner(cible: Element | null): void {
    if (cible === survole) return
    survole?.classList.remove('survole')
    cible?.classList.add('survole')
    survole = cible
  }

  racine.addEventListener('pointerdown', (e) => {
    const cible = (e.target as HTMLElement).closest<HTMLElement>('[data-glissable]')
    if (cible === null) return
    piece = cible
    origine = cible.dataset.source === 'sac' ? (cible.dataset.emplacement ?? null) : 'main'
    depart = { x: e.clientX, y: e.clientY }
    bouge = false
    // La capture garde les evenements meme si le doigt sort de la piece.
    // Elle jette si le pointeur n'est plus actif : sans garde, tout le
    // glisser casserait pour un cas sans consequence.
    try {
      cible.setPointerCapture(e.pointerId)
    } catch {
      /* tant pis, le glisser marchera quand meme dans la plupart des cas */
    }
  })

  racine.addEventListener('pointermove', (e) => {
    if (piece === null) return
    if (!bouge) {
      // Sous le seuil, c'est encore une tape : on ne declenche rien.
      if (Math.hypot(e.clientX - depart.x, e.clientY - depart.y) < SEUIL) return
      bouge = true
      piece.classList.add('saisie')
      fantome = piece.cloneNode(true) as HTMLElement
      fantome.classList.remove('saisie')
      fantome.classList.add('fantome')
      fantome.style.width = `${piece.offsetWidth}px`
      document.body.appendChild(fantome)
    }
    if (fantome !== null) {
      fantome.style.left = `${e.clientX}px`
      fantome.style.top = `${e.clientY}px`
    }
    surligner(depots(e.clientX, e.clientY))
  })

  function relacher(e: PointerEvent): void {
    if (piece === null) return
    const cible = bouge ? depots(e.clientX, e.clientY) : null
    piece.classList.remove('saisie')
    fantome?.remove()
    surligner(null)
    fantome = null
    piece = null
    bouge = false
    if (!(cible instanceof HTMLElement)) return
    // On pose la provenance sur la cible avant de la cliquer : le glisser ne
    // fait ainsi que declencher la meme tape, avec une origine en plus. Aucune
    // logique n'est dupliquee. Le lecteur la retire en la lisant.
    if (origine !== null) cible.dataset.source = origine
    cible.click()
  }

  racine.addEventListener('pointerup', relacher)
  racine.addEventListener('pointercancel', relacher)
}

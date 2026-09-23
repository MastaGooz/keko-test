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

/**
 * Sous ce deplacement, la souris n'a pas glisse : elle a clique. Elle ne
 * derive pas, quelques pixels suffisent a la distinguer.
 */
const SEUIL_SOURIS = 8

/**
 * AU DOIGT IL EN FAUT LE DOUBLE, et c'est la meme lecon que sur la main de
 * combat : une tape derive toujours de quelques pixels. Sous un seuil court,
 * elle passait pour un glisser repose sur place -- donc `lieuSource` etait
 * pose, donc une simple tape sur une piece EQUIPEE la retirait au lieu de
 * l'ouvrir en grand. Keko : « quand je fais une touche simple sur les objets
 * equipes ils sont desequipes au lieu d'etre zoomes ».
 *
 * La regle qui distingue les deux gestes (la tape regarde, le glisser deplace)
 * etait juste ; c'est le seuil qui la rendait inatteignable au doigt.
 */
const SEUIL_DOIGT = 16

export function brancherGlisser(racine: HTMLElement): void {
  let piece: HTMLElement | null = null
  let fantome: HTMLElement | null = null
  let survole: Element | null = null
  let depart = { x: 0, y: 0 }
  let bouge = false
  /** Le seuil du pointeur en cours : la souris et le doigt ne derivent pas pareil. */
  let seuil = SEUIL_SOURIS
  let origine: string | null = null
  /** Ce qu'on tient, quand le lieu seul ne suffit pas à le retrouver. */
  let identite: string | null = null

  function depots(x: number, y: number): Element | null {
    // Le fantome ne capte pas le pointeur, on peut interroger sous le doigt.
    return document.elementFromPoint(x, y)?.closest('[data-depot]') ?? null
  }

  /**
   * Le rang ou l'on repose une carte DANS la main du butin : le nombre de
   * cartes dont le MILIEU est a gauche du doigt, la carte tenue exclue.
   *
   * Les deux points comptent, et c'est la meme regle que la main de combat :
   * le milieu plutot que les bords, parce qu'un eventail qui se recouvre fait
   * que deux voisines revendiqueraient la meme bande ; et la carte tenue
   * exclue, parce que c'est l'index d'insertion UNE FOIS RETIREE.
   */
  function fenteSousLeDoigt(x: number): number {
    if (piece === null) return 0
    let fente = 0
    for (const c of racine.querySelectorAll<HTMLElement>('.cartes.portes .carte')) {
      if (c === piece) continue
      const boite = c.getBoundingClientRect()
      if (x > boite.left + boite.width / 2) fente += 1
    }
    return fente
  }

  /**
   * DES QU'ON TIENT UNE PIECE, LES SLOTS QUI LA PRENNENT S'ALLUMENT -- tous,
   * pas seulement celui sous le doigt. C'est ce qui dit ou l'on peut aller
   * avant d'y aller. Dans l'armurerie seulement : sur l'ecran de butin, la
   * main entiere est un depot, et une main qui clignote ne dit rien. La case
   * d'ou vient la piece s'allume aussi : la reposer est une destination comme
   * une autre -- Keko : « le slot dans lequel il etait n'affiche pas le
   * contour bleu ».
   */
  function accueillir(tenue: HTMLElement): void {
    if (tenue.closest('.voile.armurerie') === null) return
    const genre = tenue.dataset.genre
    for (const d of racine.querySelectorAll<HTMLElement>('.voile.armurerie [data-depot]')) {
      const attend = d.dataset.attend
      if (attend === undefined || genre === undefined || attend === genre) d.classList.add('accueille')
    }
  }

  /**
   * La destination sous le doigt s'allume -- en bleu si elle prend ce qu'on
   * tient, EN ROUGE sinon. Le refus se lit avant de lacher, pas apres : un
   * slot qui s'allume en bleu puis ne fait rien a l'air casse. Ce que le slot
   * prend (`data-attend`) et ce que la piece est (`data-genre`) viennent du
   * rendu ; sans l'un des deux (le butin, le ratelier), c'est un accord.
   */
  function surligner(cible: Element | null): void {
    if (cible === survole) return
    survole?.classList.remove('survole', 'survole-refus')
    if (cible !== null) {
      const attend = (cible as HTMLElement).dataset.attend
      const genre = piece?.dataset.genre
      const refus = attend !== undefined && genre !== undefined && attend !== genre
      cible.classList.add(refus ? 'survole-refus' : 'survole')
    }
    survole = cible
  }

  racine.addEventListener('pointerdown', (e) => {
    const cible = (e.target as HTMLElement).closest<HTMLElement>('[data-glissable]')
    if (cible === null) return
    piece = cible
    origine = cible.dataset.lieu ?? null
    identite = cible.dataset.piece ?? null
    depart = { x: e.clientX, y: e.clientY }
    bouge = false
    seuil = e.pointerType === 'mouse' ? SEUIL_SOURIS : SEUIL_DOIGT
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
      if (Math.hypot(e.clientX - depart.x, e.clientY - depart.y) < seuil) return
      bouge = true
      piece.classList.add('saisie')
      accueillir(piece)
      fantome = piece.cloneNode(true) as HTMLElement
      fantome.classList.remove('saisie')
      fantome.classList.add('fantome')
      // DANS L'ARMURERIE, LE FANTOME EST TOUJOURS REDUIT -- qu'on prenne au
      // ratelier ou dans un slot du chargement, qui lui est a la taille de la
      // main. Une grosse carte sous le doigt cache les slots qu'on vise. La
      // mesure est celle d'une case du ratelier, lue sur l'ecran : `--piece`
      // vit sur le voile, et le fantome est pose sur `body`. Ailleurs (le
      // butin), il garde la taille de ce qu'on a pris.
      const caseReduite = piece.closest('.voile.armurerie')
        ? racine.querySelector<HTMLElement>('.etal.reserve .case-ratelier, .etal.reserve .piece-equip')
        : null
      fantome.style.width = `${(caseReduite ?? piece).offsetWidth}px`
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

    // LA FENTE SE CALCULE AVANT LE NETTOYAGE : elle a besoin de savoir quelle
    // carte est tenue, pour l'exclure du compte. Apres, `piece` est deja nulle
    // et le rang retombe a zero -- la carte repartait alors toujours en tete.
    const versLaMain = cible instanceof HTMLElement && cible.dataset.ou === 'deck'
    const duDeck = origine !== null && origine.includes('"deck"')
    const fente = versLaMain && duDeck ? fenteSousLeDoigt(e.clientX) : null

    piece.classList.remove('saisie')
    for (const d of racine.querySelectorAll('.accueille')) d.classList.remove('accueille')
    fantome?.remove()
    surligner(null)
    fantome = null
    piece = null
    bouge = false
    if (!(cible instanceof HTMLElement)) return
    // On pose la provenance sur la cible avant de la cliquer : le glisser ne
    // fait ainsi que declencher la meme tape, avec une origine en plus. Aucune
    // logique n'est dupliquee. Le lecteur la retire en la lisant.
    if (origine !== null) cible.dataset.lieuSource = origine
    // ET CE QU'ON TIENT, pas seulement d'où ça vient. Un lieu suffit à
    // retrouver un trésor — il en porte l'identifiant — mais pas une pièce
    // d'équipement : le râtelier en contient plusieurs, et la cible lisait
    // alors l'identifiant de CE QU'ELLE CONTENAIT DÉJÀ. Le glisser depuis le
    // râtelier ne faisait donc rien du tout.
    if (identite !== null) cible.dataset.pieceSource = identite
    // REPOSER UNE CARTE DU BUTIN DANS LA MAIN DU BUTIN, c'est la REORDONNER --
    // pas la deplacer. `input.ts` en fait une action distincte ; sans ca elle
    // repartait au bout de la main a chaque fois, ce qui est un rangement qu'on
    // subit plutot qu'un rangement qu'on fait.
    if (fente !== null) cible.dataset.fente = String(fente)
    cible.click()
  }

  racine.addEventListener('pointerup', relacher)
  racine.addEventListener('pointercancel', relacher)
}

/**
 * LA CARTE SURVOLÉE PENCHE VERS LA SOURIS. Keko : « zoomer plus au hover +
 * bouger la carte avec les mouvements de souris hover comme pour le zoom ».
 *
 * Un seul écouteur pour toute la page, posé une fois : il retrouve la vignette
 * (ou la case d'album) sous la souris et lui donne son penchant en variables
 * CSS (`--rx`, `--ry`), que `collection.css` lit dans son `:hover`. *La souris
 * seulement* : au doigt, rien ne bouge, la tape ouvre la carte.
 */
const CIBLES = '.vignette, .album-case'
/** Le penchant au bord de la carte, en degrés. */
const PENCHE = 14

let pose = false
let courante: HTMLElement | null = null

function lacher(): void {
  if (courante === null) return
  courante.style.removeProperty('--rx')
  courante.style.removeProperty('--ry')
  courante.style.removeProperty('--b')
  courante = null
}

export function penchantAuSurvol(): void {
  if (pose) return
  pose = true
  document.addEventListener(
    'pointermove',
    (e) => {
      if (e.pointerType !== 'mouse') return
      const el = (e.target as Element | null)?.closest<HTMLElement>(CIBLES) ?? null
      if (el !== courante) lacher()
      if (el === null || el.closest('.jouer-carte') !== null) return
      courante = el
      const b = el.getBoundingClientRect()
      // De -1 à 1 sur chaque axe, depuis le centre de la carte.
      const x = ((e.clientX - b.left) / b.width) * 2 - 1
      const y = ((e.clientY - b.top) / b.height) * 2 - 1
      el.style.setProperty('--rx', `${(-y * PENCHE).toFixed(2)}deg`)
      el.style.setProperty('--ry', `${(x * PENCHE).toFixed(2)}deg`)
      // LA BANDE DE LUMIÈRE PASSE SOUS LA SOURIS : sa ligne (u + v) / 2, u de
      // gauche à droite, v de bas en haut — comme `sousLeDoigt` dans Carte3D.
      el.style.setProperty('--b', `${(((x - y + 2) / 4) * 100).toFixed(1)}%`)
    },
    { passive: true },
  )
  document.addEventListener('mouseout', (e) => {
    if (e.relatedTarget === null) lacher()
  })
}

/**
 * Le montage de l'ouverture de paquet, derrière `?paquet`.
 *
 * Séparé comme `monter.tsx` l'est pour le jeu : l'entrée ne connaît qu'une
 * fonction, et React n'est tiré que par cette branche.
 */
import { createRoot } from 'react-dom/client'
import { StrictMode } from 'react'
import { Paquet3D } from './Paquet3D.tsx'
import { Jeu } from './Jeu.tsx'

export function monterPaquet(racine: HTMLElement): void {
  racine.innerHTML = ''
  // LA COLLECTION N'EXISTE QUE POUR L'EMOJI : les peintures (`&art`) et le banc
  // des peaux (`&peau`, un autre catalogue) gardent le paquet seul.
  const p = new URLSearchParams(location.search)
  const seul = p.has('art') || p.has('peau')
  createRoot(racine).render(<StrictMode>{seul ? <Paquet3D /> : <Jeu />}</StrictMode>)
}

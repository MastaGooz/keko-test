/**
 * Le montage de l'ouverture de paquet, derrière `?paquet`.
 *
 * Séparé comme `monter.tsx` l'est pour le jeu : l'entrée ne connaît qu'une
 * fonction, et React n'est tiré que par cette branche.
 */
import { createRoot } from 'react-dom/client'
import { StrictMode } from 'react'
import { Paquet3D } from './Paquet3D.tsx'

export function monterPaquet(racine: HTMLElement): void {
  racine.innerHTML = ''
  createRoot(racine).render(
    <StrictMode>
      <Paquet3D />
    </StrictMode>,
  )
}

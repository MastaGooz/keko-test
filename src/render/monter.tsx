/**
 * Le montage du moteur 3D, derrière `?r3f`.
 *
 * Séparé de la scène pour que l'entrée du jeu n'ait à connaître qu'une
 * fonction, et pour que React ne soit tiré que par cette branche : la page par
 * défaut garde son poids.
 */
import { createRoot } from 'react-dom/client'
import { StrictMode } from 'react'
import { Scene } from './Scene.tsx'

export function monter3d(racine: HTMLElement): void {
  racine.innerHTML = ''
  createRoot(racine).render(
    <StrictMode>
      <Scene />
    </StrictMode>,
  )
}

// LE HANGAR GARDÉ SUR L'APPAREIL : le trésor des expéditions achevées et les pièces (possédées, montées).
//
// La règle est dans `logic/vaisseau/hangar.ts`, qui relit sans confiance ; ce module ne fait qu'écrire et lire, comme
// `ui/collection.ts` pour la collection. Tout passe dans un try : *sans stockage (navigation privée, quota), on joue
// sans mémoire*, le hangar vit le temps de la page.
import { hangarNeuf, lireHangar, lireTresor, type Hangar } from '../../logic/vaisseau/hangar.ts'
import { cargaisonVide, type Cargaison } from '../../logic/vaisseau/jeu.ts'

const CLE = 'keko-vaisseau-hangar'

export function chargerHangar(): { hangar: Hangar; tresor: Cargaison } {
  try {
    const brut = localStorage.getItem(CLE)
    if (brut === null) return { hangar: hangarNeuf(), tresor: cargaisonVide() }
    const b = JSON.parse(brut) as { hangar?: unknown; tresor?: unknown } | null
    return { hangar: lireHangar(b?.hangar), tresor: lireTresor(b?.tresor) }
  } catch {
    return { hangar: hangarNeuf(), tresor: cargaisonVide() }
  }
}

export function sauverHangar(hangar: Hangar, tresor: Cargaison): void {
  try {
    localStorage.setItem(CLE, JSON.stringify({ hangar, tresor }))
  } catch {
    // Sans stockage, le hangar vit le temps de la page.
  }
}

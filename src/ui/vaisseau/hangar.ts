// LE HANGAR GARDÉ SUR L'APPAREIL : le trésor des expéditions achevées (par minerai), les CRÉDITS (la monnaie du jeu,
// ce que l'entrepôt paie le minerai) et les pièces (possédées, montées).
//
// La règle est dans `logic/vaisseau/hangar.ts`, qui relit sans confiance ; ce module ne fait qu'écrire et lire, comme
// `ui/collection.ts` pour la collection. Tout passe dans un try : *sans stockage (navigation privée, quota), on joue
// sans mémoire*, le hangar vit le temps de la page.
import { hangarNeuf, lireCredits, lireHangar, lireTresor, type Hangar } from '../../logic/vaisseau/hangar.ts'
import { cargaisonVide, type Cargaison } from '../../logic/vaisseau/jeu.ts'

const CLE = 'keko-vaisseau-hangar'

export type Progression = { hangar: Hangar; tresor: Cargaison; credits: number }

export function chargerHangar(): Progression {
  try {
    const brut = localStorage.getItem(CLE)
    if (brut === null) return { hangar: hangarNeuf(), tresor: cargaisonVide(), credits: 0 }
    const b = JSON.parse(brut) as { hangar?: unknown; tresor?: unknown; credits?: unknown } | null
    return { hangar: lireHangar(b?.hangar), tresor: lireTresor(b?.tresor), credits: lireCredits(b?.credits) }
  } catch {
    return { hangar: hangarNeuf(), tresor: cargaisonVide(), credits: 0 }
  }
}

export function sauverHangar(hangar: Hangar, tresor: Cargaison, credits: number): void {
  try {
    localStorage.setItem(CLE, JSON.stringify({ hangar, tresor, credits }))
  } catch {
    // Sans stockage, le hangar vit le temps de la page.
  }
}

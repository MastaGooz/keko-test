// LE HANGAR GARDÉ SUR L'APPAREIL : le trésor des expéditions achevées (par minerai), les CRÉDITS (la monnaie du jeu,
// ce que l'entrepôt paie le minerai), les pièces (possédées, montées) et LE LABO (les nœuds débloqués).
//
// LA CLÉ A CHANGÉ AVEC L'ARBRE DU LABO (Keko, 11/11 : « on reset la sauvegarde à l'implantation ») : la sauvegarde
// d'avant n'est plus lue, et on l'efface.
//
// La règle est dans `logic/vaisseau/hangar.ts`, qui relit sans confiance ; ce module ne fait qu'écrire et lire, comme
// `ui/collection.ts` pour la collection. Tout passe dans un try : *sans stockage (navigation privée, quota), on joue
// sans mémoire*, le hangar vit le temps de la page.
import { hangarNeuf, lireCredits, lireHangar, lireTresor, type Hangar } from '../../logic/vaisseau/hangar.ts'
import { laboNeuf, lireLabo, type Labo } from '../../logic/vaisseau/labo.ts'
import { lireMarche, marcheNeuf, type Marche } from '../../logic/vaisseau/marche.ts'
import { cargaisonVide, type Cargaison } from '../../logic/vaisseau/jeu.ts'

const CLE = 'keko-vaisseau-hangar-2'
const CLE_D_AVANT = 'keko-vaisseau-hangar'

export type Progression = { hangar: Hangar; tresor: Cargaison; credits: number; labo: Labo; marche: Marche }
const neuve = (instant: number): Progression => ({ hangar: hangarNeuf(), tresor: cargaisonVide(), credits: 0, labo: laboNeuf(), marche: marcheNeuf(instant) })

/** `instant` : l'heure du marché (la page la donne — elle peut l'accélérer pour un essai). */
export function chargerHangar(instant: number): Progression {
  try {
    localStorage.removeItem(CLE_D_AVANT)
    const brut = localStorage.getItem(CLE)
    if (brut === null) return neuve(instant)
    const b = JSON.parse(brut) as { hangar?: unknown; tresor?: unknown; credits?: unknown; labo?: unknown; marche?: unknown } | null
    return { hangar: lireHangar(b?.hangar), tresor: lireTresor(b?.tresor), credits: lireCredits(b?.credits), labo: lireLabo(b?.labo), marche: lireMarche(b?.marche, instant) }
  } catch {
    return neuve(instant)
  }
}

export function sauverHangar(hangar: Hangar, tresor: Cargaison, credits: number, labo: Labo, marche: Marche): void {
  try {
    localStorage.setItem(CLE, JSON.stringify({ hangar, tresor, credits, labo, marche }))
  } catch {
    // Sans stockage, le hangar vit le temps de la page.
  }
}

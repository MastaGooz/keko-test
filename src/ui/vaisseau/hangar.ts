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
import { aLaMecanique, laboNeuf, lireLabo, passifsDe, type Labo, type Mecanique } from '../../logic/vaisseau/labo.ts'
import { lireMarche, marcheNeuf, type Marche } from '../../logic/vaisseau/marche.ts'
import { lireQuetes, quetesNeuves, type EtatQuetes } from '../../logic/vaisseau/quetes.ts'
import { cargaisonVide, type Cargaison } from '../../logic/vaisseau/jeu.ts'

const CLE = 'keko-vaisseau-hangar-2'
const CLE_D_AVANT = 'keko-vaisseau-hangar'

export type Progression = { hangar: Hangar; tresor: Cargaison; credits: number; labo: Labo; marche: Marche; quetes: EtatQuetes }
const neuve = (instant: number): Progression => ({ hangar: hangarNeuf(), tresor: cargaisonVide(), credits: 0, labo: laboNeuf(), marche: marcheNeuf(instant), quetes: quetesNeuves() })

/** `instant` : l'heure du marché (la page la donne — elle peut l'accélérer pour un essai). */
export function chargerHangar(instant: number): Progression {
  try {
    localStorage.removeItem(CLE_D_AVANT)
    const brut = localStorage.getItem(CLE)
    if (brut === null) return neuve(instant)
    const b = JSON.parse(brut) as { hangar?: unknown; tresor?: unknown; credits?: unknown; labo?: unknown; marche?: unknown; quetes?: unknown } | null
    // (le labo d'abord : son plafond relevé dit quels ordres gardés sont encore valables)
    const labo = lireLabo(b?.labo)
    const pa = passifsDe(labo)
    const hangar = lireHangar(b?.hangar)
    const tresor = lireTresor(b?.tresor)
    const credits = lireCredits(b?.credits)
    // (une sauvegarde d'avant les quêtes, qui a déjà joué, ne refait pas le tutoriel — ses onglets ne se referment pas)
    const dejaJoue = credits > 0 || labo.debloques.length > 0 || hangar.possedees.length > 3 || tresor.fer + tresor.or + tresor.cristal > 0
    return { hangar, tresor, credits, labo, marche: lireMarche(b?.marche, instant, { prime: pa.vente, plafond: pa.plafond }), quetes: lireQuetes(b?.quetes, dejaJoue, (x) => aLaMecanique(labo, x as Mecanique)) }
  } catch {
    return neuve(instant)
  }
}

export function sauverHangar(hangar: Hangar, tresor: Cargaison, credits: number, labo: Labo, marche: Marche, quetes: EtatQuetes): void {
  try {
    localStorage.setItem(CLE, JSON.stringify({ hangar, tresor, credits, labo, marche, quetes }))
  } catch {
    // Sans stockage, le hangar vit le temps de la page.
  }
}

/** LA LIVRÉE du vaisseau (sa couleur), gardée à part : elle ne tient à aucune règle. */
const CLE_LIVREE = 'keko-vaisseau-livree'
export function chargerLivree(): string {
  try {
    return localStorage.getItem(CLE_LIVREE) ?? 'serie'
  } catch {
    return 'serie'
  }
}
export function sauverLivree(id: string): void {
  try {
    localStorage.setItem(CLE_LIVREE, id)
  } catch {
    // Sans stockage, la couleur vit le temps de la page.
  }
}

/** Gestion des entrées : traduit les événements navigateur en actions. */
import type { View } from './render.ts'
import type { Lieu } from '../logic/descente.ts'
import type { Slot as SlotHub } from '../logic/hub.ts'

export type Action =
  | { type: 'viser'; index: number }
  | { type: 'zoomer'; id: string }
  | { type: 'fermerZoom' }
  | { type: 'jouerDepuisLaMain'; index: number }
  | { type: 'reordonner'; de: number; vers: number }
  | { type: 'annuler' }
  | { type: 'cibler'; cible: number }
  | { type: 'finTour' }
  | { type: 'rejouer' }
  | { type: 'nouveau' }
  | { type: 'choisirCarte'; index: number }
  | { type: 'deplacer'; source: Lieu; cible: Lieu }
  | { type: 'reordonnerTresors'; id: string; vers: number }
  | { type: 'validerJet' }
  | { type: 'terminerButin' }
  | { type: 'equiper'; source: SlotHub | null; cible: SlotHub | null; id: string }
  | { type: 'partir' }
  | { type: 'armurerie' }
  | { type: 'descendre' }
  | { type: 'extraire' }
  | { type: 'panneau' }
  | { type: 'pleinEcran' }
  | { type: 'son' }

/**
 * D'où vient le trésor déplacé. Une tape n'a pas de source : elle déplace
 * toujours ce qui est dans l'emplacement de loot. Un glisser, lui, pose le
 * lieu de sa pièce sur la cible juste avant de la cliquer.
 */
function lireSource(noeud: HTMLElement): Lieu {
  const brut = noeud.dataset.lieuSource
  delete noeud.dataset.lieuSource
  if (brut === undefined) return { ou: 'loot' }
  try {
    return JSON.parse(brut) as Lieu
  } catch {
    return { ou: 'loot' }
  }
}

/**
 * Un slot d'armurerie, lu sur un attribut. `auto` veut dire « mets-la où elle
 * va » — c'est ce que fait une tape sur une pièce du râtelier, et ça évite de
 * demander au joueur de désigner un slot qu'il n'a pas le choix de désigner.
 */
function lireSlot(brut: string | undefined): SlotHub | null {
  if (brut === undefined || brut === 'auto') return null
  if (brut === 'reserve') return { ou: 'reserve' }
  try {
    return JSON.parse(brut) as SlotHub
  } catch {
    return null
  }
}

/** La destination, lue sur la zone de dépôt. */
function lireCible(noeud: HTMLElement): Lieu {
  const ou = noeud.dataset.ou
  if (ou === 'deck') return { ou: 'deck' }
  if (ou === 'loot') return { ou: 'loot' }
  return { ou: 'jeter' }
}

/**
 * Écoute déléguée à la racine : les boutons de main sont reconstruits à chaque
 * rendu, on ne peut pas s'abonner à chacun d'eux.
 */
export function bindInput(view: View, dispatch: (action: Action) => void): void {
  // 'click' couvre tactile et souris, sans double déclenchement.
  view.root.addEventListener('click', (evenement) => {
    const noeud = (evenement.target as HTMLElement).closest<HTMLElement>('[data-action]')
    // Taper à côté repose la carte visée. Sans ça, une carte levée par erreur
    // ne se reposait qu'en retapant précisément sur elle — or elle a changé de
    // place en se levant, donc on tapait à côté et il ne se passait rien.
    if (noeud === null) {
      dispatch({ type: 'annuler' })
      return
    }

    switch (noeud.dataset.action) {
      case 'viser':
        dispatch({ type: 'viser', index: Number(noeud.dataset.index) })
        break
      case 'zoomer':
        dispatch({ type: 'zoomer', id: noeud.dataset.carteId ?? '' })
        break
      case 'fermerZoom':
        dispatch({ type: 'fermerZoom' })
        break
      case 'annuler':
        dispatch({ type: 'annuler' })
        break
      case 'cibler':
        dispatch({ type: 'cibler', cible: Number(noeud.dataset.cible) })
        break
      case 'finTour':
        dispatch({ type: 'finTour' })
        break
      case 'rejouer':
        dispatch({ type: 'rejouer' })
        break
      case 'nouveau':
        dispatch({ type: 'nouveau' })
        break
      case 'choisirCarte':
        dispatch({ type: 'choisirCarte', index: Number(noeud.dataset.carte) })
        break
      case 'deplacer': {
        const source = lireSource(noeud)
        // Le glisser pose un rang quand on repose une carte du butin DANS la
        // main du butin : c'est un rangement, pas un deplacement.
        const fente = noeud.dataset.fente
        delete noeud.dataset.fente
        if (fente !== undefined && source.ou === 'deck' && source.id !== undefined) {
          dispatch({ type: 'reordonnerTresors', id: source.id, vers: Number(fente) })
          break
        }
        dispatch({ type: 'deplacer', source, cible: lireCible(noeud) })
        break
      }
      case 'validerJet':
        dispatch({ type: 'validerJet' })
        break
      case 'terminerButin':
        dispatch({ type: 'terminerButin' })
        break
      case 'armurerie':
        dispatch({ type: 'armurerie' })
        break
      case 'equiper': {
        // La provenance vient de la piece glissee, la destination du slot
        // survole -- exactement comme le rangement du butin. Une TAPE n'a pas
        // de provenance : c'est alors la piece elle-meme qui la porte.
        // `lieuSource` est pose par le glisser ; sur une tape il n'y en a pas,
        // et c'est le slot du noeud lui-meme qui fait la provenance.
        const source = lireSlot(noeud.dataset.lieuSource ?? noeud.dataset.lieu)
        const cible = lireSlot(noeud.dataset.slot)
        delete noeud.dataset.lieuSource
        dispatch({ type: 'equiper', source, cible, id: noeud.dataset.piece ?? '' })
        break
      }
      case 'partir':
        dispatch({ type: 'partir' })
        break
      case 'descendre':
        dispatch({ type: 'descendre' })
        break
      case 'extraire':
        dispatch({ type: 'extraire' })
        break
      case 'panneau':
        dispatch({ type: 'panneau' })
        break
      case 'pleinEcran':
        dispatch({ type: 'pleinEcran' })
        break
      case 'son':
        dispatch({ type: 'son' })
        break
    }
  })
}

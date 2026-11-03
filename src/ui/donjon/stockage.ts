/**
 * LE DONJON SUR CET APPAREIL : l'état partagé local, l'horloge et le planning
 * des bots, dans `localStorage`. *Le seul fichier du donjon qui y touche.*
 *
 * On relit sans confiance : une sauvegarde d'une autre forme est oubliée, et
 * la saison repart.
 */
import type { EtatDesBots } from '../../logic/donjon/bots.ts'
import type { Horloge } from '../../logic/donjon/horloge.ts'
import type { EtatDonjon } from '../../logic/donjon/types.ts'

const CLE = 'keko-donjon'

export type SauvegardeDonjon = { etat: EtatDonjon; horloge: Horloge; bots: EtatDesBots }

export function lireLeDonjon(): SauvegardeDonjon | null {
  try {
    const brut = localStorage.getItem(CLE)
    if (brut === null) return null
    const s = JSON.parse(brut) as Partial<SauvegardeDonjon>
    const e = s.etat
    const h = s.horloge
    if (
      e?.version !== 1 ||
      !Array.isArray(e.joueurs) ||
      !Array.isArray(e.journal) ||
      typeof e.t !== 'number' ||
      typeof h?.jeu !== 'number' ||
      typeof h.reel !== 'number' ||
      typeof h.vitesse !== 'number' ||
      typeof s.bots !== 'object' ||
      s.bots === null
    ) {
      return null
    }
    // Une sauvegarde d'avant la forme (fatigue et repos comptés en taps) :
    // chacun repart au milieu.
    for (const j of e.joueurs) {
      if (typeof j.forme !== 'number') {
        j.forme = 0
        j.formeA = e.t
        j.actifJusqua = e.t
      }
    }
    return s as SauvegardeDonjon
  } catch {
    return null
  }
}

export function ecrireLeDonjon(s: SauvegardeDonjon): void {
  try {
    localStorage.setItem(CLE, JSON.stringify(s))
  } catch {
    // Plein ou bloqué : le donjon continue en mémoire.
  }
}

export function oublierLeDonjon(): void {
  try {
    localStorage.removeItem(CLE)
  } catch {
    // rien à faire
  }
}

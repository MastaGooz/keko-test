/**
 * LE DONJON SUR CET APPAREIL : l'état partagé local, l'horloge et le planning
 * des bots, dans `localStorage`. *Le seul fichier du donjon qui y touche.*
 *
 * On relit sans confiance : une sauvegarde d'une autre forme est oubliée, et
 * la saison repart.
 */
import type { EtatDesBots } from '../../logic/donjon/bots.ts'
import type { Horloge } from '../../logic/donjon/horloge.ts'
import { DONJON } from '../../logic/donjon/config.ts'
import type { EtatDonjon, Joueur } from '../../logic/donjon/types.ts'

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
    // Les sauvegardes d'avant : la fatigue et le repos comptés en taps
    // (chacun repart en haut du palier), puis la forme de −1 à +1 comptée au
    // temps (`actifJusqua`), qu'on remet à l'échelle des minutes de spam.
    const f = DONJON.forme
    for (const j of e.joueurs as (Joueur & { actifJusqua?: number })[]) {
      if (typeof j.forme !== 'number' || typeof j.formeA !== 'number') {
        j.forme = f.palier
        j.formeA = e.t
      } else if ('actifJusqua' in j) {
        j.forme = j.forme < 0 ? j.forme * f.fatigue : f.palier + j.forme * f.repos
        delete j.actifJusqua
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

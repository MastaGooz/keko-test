/**
 * LE DONJON SUR CET APPAREIL : l'état partagé local, l'horloge et le planning
 * des bots, dans `localStorage`. *Le seul fichier du donjon qui y touche.*
 *
 * On relit sans confiance : une sauvegarde d'une autre forme est oubliée, et
 * la saison repart.
 */
import type { EtatDesBots } from '../../logic/donjon/bots.ts'
import type { Horloge } from '../../logic/donjon/horloge.ts'
import { AMELIORATIONS } from '../../logic/donjon/config.ts'
import type { EtatDonjon, Joueur } from '../../logic/donjon/types.ts'

const CLE = 'keko-donjon'

/** L'échelle de la forme des joueurs : change quand son sens change. */
const VERSION_DE_LA_FORME = 3

export type SauvegardeDonjon = { etat: EtatDonjon; horloge: Horloge; bots: EtatDesBots; forme?: number }

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
    // UNE FORME D'UNE AUTRE ÉCHELLE (les versions d'avant : fatigue et repos
    // en taps, puis au temps, puis en minutes de spam sans milieu) : chacun
    // repart pile au milieu.
    if (s.forme !== VERSION_DE_LA_FORME) {
      for (const j of e.joueurs as (Joueur & { actifJusqua?: number })[]) {
        j.forme = 0
        j.formeA = e.t
        delete j.actifJusqua
      }
      s.forme = VERSION_DE_LA_FORME
    }
    // Une sauvegarde d'avant la recharge du tap : il est prêt tout de suite ;
    // d'avant une amélioration : elle est au rang 0.
    for (const j of e.joueurs) {
      if (typeof j.prochainTap !== 'number') j.prochainTap = e.t
      for (const quoi of AMELIORATIONS) if (typeof j.ameliorations[quoi] !== 'number') j.ameliorations[quoi] = 0
      // D'avant l'offre de trois, ou une offre qui nomme une amélioration
      // partie (la Sagesse) : elle se retire au premier calcul des règles.
      if (!Array.isArray(j.offre) || j.offre.some((q) => !AMELIORATIONS.includes(q))) j.offre = []
    }
    return s as SauvegardeDonjon
  } catch {
    return null
  }
}

export function ecrireLeDonjon(s: SauvegardeDonjon): void {
  try {
    localStorage.setItem(CLE, JSON.stringify({ ...s, forme: VERSION_DE_LA_FORME }))
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

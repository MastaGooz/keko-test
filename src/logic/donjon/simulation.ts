/**
 * LA SIMULATION D'UNE SAISON, sans affichage : les quatre bots, une semaine,
 * par les mêmes fonctions que l'écran (`etatPartageLocal`, `jouerLesBots`).
 *
 * Lancée par `npm run donjon` (le rapport) et par les vérifications.
 */
import { botsInitiaux, jouerLesBots } from './bots.ts'
import type { ConfigDonjon } from './config.ts'
import { etatPartageLocal } from './partage.ts'
import { etatInitial } from './regles.ts'
import type { SaisonArchivee } from './types.ts'

export type LigneDuRapport = {
  id: string
  nom: string
  degats: number
  /** Part des dégâts de la saison, et part des taps dans ses propres dégâts. */
  part: number
  partTap: number
  niveau: number
  kills: number
}

export type RapportSaison = {
  seed: number
  etageParJour: number[]
  etageFinal: number
  degatsTotaux: number
  /** La part des taps dans les dégâts de tous. */
  partTap: number
  joueurs: LigneDuRapport[]
}

export function rapportDe(seed: number, archive: SaisonArchivee): RapportSaison {
  const total = archive.joueurs.reduce((s, j) => s + j.degatsTap + j.degatsAuto, 0)
  const taps = archive.joueurs.reduce((s, j) => s + j.degatsTap, 0)
  return {
    seed,
    etageParJour: archive.etageParJour,
    etageFinal: archive.etage,
    degatsTotaux: total,
    partTap: total > 0 ? taps / total : 0,
    joueurs: archive.joueurs.map((j) => {
      const degats = j.degatsTap + j.degatsAuto
      return {
        id: j.id,
        nom: j.nom,
        degats,
        part: total > 0 ? degats / total : 0,
        partTap: degats > 0 ? j.degatsTap / degats : 0,
        niveau: j.niveau,
        kills: j.kills,
      }
    }),
  }
}

export async function simulerSaison(config: ConfigDonjon, seed: number): Promise<RapportSaison> {
  const debut = 0
  const fin = debut + config.saison.duree
  let maintenant = debut
  const partage = etatPartageLocal(config, etatInitial(config, seed, debut), () => maintenant)
  for (const p of config.bots.profils) {
    await partage.agir({ joueur: p.id, t: debut, type: 'rejoindre', nom: p.nom, bot: p.id })
  }
  await jouerLesBots(config, partage, botsInitiaux(config, seed, debut), fin - 1)
  maintenant = fin
  const etat = await partage.lire()
  return rapportDe(seed, etat.archives[etat.archives.length - 1])
}

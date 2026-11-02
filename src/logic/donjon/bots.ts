/**
 * LES BOTS : des joueurs comme les autres, qui passent par `agir`.
 *
 * Chaque bot a son planning (le prochain passage) et son propre RNG seedé,
 * tenus HORS de l'état partagé : ce sont des clients, pas des règles. Pendant
 * un passage il dépense ses points, tape par salves, puis redépense ; entre
 * deux passages, seul son auto-tap tourne (et c'est l'état partagé qui le
 * résout).
 *
 * **La règle de dépense** : il achète la piste la plus en retard sur son poids
 * (`(rang + 1) / poids` le plus petit). S'il ne peut pas la payer, il
 * économise.
 */
import { createRng } from '../rng.ts'
import { AMELIORATIONS, JOUR, type CleAmelioration, type ConfigDonjon, type ProfilBot } from './config.ts'
import type { EtatPartage } from './partage.ts'
import { coutDe } from './regles.ts'
import type { EtatDonjon } from './types.ts'

export type EtatDesBots = Record<string, { prochain: number; rng: number }>

function tirage(rngEtat: number): { v: number; rng: number } {
  const r = createRng(rngEtat)
  const v = r.next()
  return { v, rng: r.getState() }
}

function ecartMoyen(profil: ProfilBot): number {
  return JOUR / profil.passagesParJour
}

/** Le premier passage de chacun tombe au hasard dans son premier intervalle. */
export function botsInitiaux(config: ConfigDonjon, seed: number, t: number): EtatDesBots {
  const bots: EtatDesBots = {}
  config.bots.profils.forEach((p, i) => {
    const { v, rng } = tirage((seed + Math.imul(i + 1, 0x9e3779b9)) >>> 0)
    bots[p.id] = { prochain: t + v * ecartMoyen(p), rng }
  })
  return bots
}

/** La piste à acheter, ou null s'il économise. */
export function choixDuBot(config: ConfigDonjon, etat: EtatDonjon, profil: ProfilBot): CleAmelioration | null {
  const j = etat.joueurs.find((x) => x.id === profil.id)
  if (j === undefined) return null
  let meilleure: CleAmelioration | null = null
  let score = Infinity
  for (const quoi of AMELIORATIONS) {
    const poids = profil.poids[quoi]
    if (poids <= 0) continue
    const s = (j.ameliorations[quoi] + 1) / poids
    if (s < score) {
      score = s
      meilleure = quoi
    }
  }
  return meilleure !== null && j.points >= coutDe(config, j, meilleure) ? meilleure : null
}

async function depenser(config: ConfigDonjon, partage: EtatPartage, profil: ProfilBot, etat: EtatDonjon, t: number): Promise<EtatDonjon> {
  for (let quoi = choixDuBot(config, etat, profil); quoi !== null; quoi = choixDuBot(config, etat, profil)) {
    etat = await partage.agir({ joueur: profil.id, t, type: 'acheter', quoi })
  }
  return etat
}

/** Un passage : dépenser, taper par salves, redépenser. Rend le RNG avancé. */
async function passage(config: ConfigDonjon, partage: EtatPartage, profil: ProfilBot, t: number, rng: number): Promise<number> {
  let etat = await partage.agir({ joueur: profil.id, t, type: 'rejoindre', nom: profil.nom, bot: profil.id })
  etat = await depenser(config, partage, profil, etat, t)

  const tire = tirage(rng)
  const [min, max] = profil.taps
  let reste = min + Math.floor(tire.v * (max - min + 1))
  let instant = t
  while (reste > 0) {
    const n = Math.min(reste, config.bots.tapsParSalve)
    etat = await partage.agir({ joueur: profil.id, t: instant, type: 'taper', n })
    reste -= n
    instant += config.bots.ecartSalve
  }
  await depenser(config, partage, profil, etat, instant)
  return tire.rng
}

/**
 * Joue, dans l'ordre du temps, tous les passages prévus jusqu'à `jusqua`.
 * Rend le planning suivant.
 */
export async function jouerLesBots(
  config: ConfigDonjon,
  partage: EtatPartage,
  bots: EtatDesBots,
  jusqua: number,
): Promise<EtatDesBots> {
  const suite: EtatDesBots = { ...bots }
  for (;;) {
    let profil: ProfilBot | null = null
    for (const p of config.bots.profils) {
      const b = suite[p.id]
      if (b !== undefined && b.prochain <= jusqua && (profil === null || b.prochain < suite[profil.id].prochain)) profil = p
    }
    if (profil === null) return suite
    const b = suite[profil.id]
    const rng = await passage(config, partage, profil, b.prochain, b.rng)
    const ecart = tirage(rng)
    const e = config.bots.ecartPassage
    suite[profil.id] = { prochain: b.prochain + ecartMoyen(profil) * (1 - e + 2 * e * ecart.v), rng: ecart.rng }
  }
}

/**
 * LES BOTS : des joueurs comme les autres, qui passent par `agir`.
 *
 * Chaque bot a son planning (son prochain geste) et son propre RNG seedé,
 * tenus HORS de l'état partagé : ce sont des clients, pas des règles. Un
 * passage : il dépense ses points, tape un coup à chaque fin de recharge
 * jusqu'à son compte, puis redépense ; entre deux passages, seul son
 * auto-tap tourne (et c'est l'état partagé qui le résout). *Chaque tap est
 * un geste à son heure* : un passage ne joue jamais en avance sur le temps
 * qu'on lui donne (sinon l'état partagé partirait dans le futur et le tap
 * d'un humain, ramené à l'heure de l'état, attendrait sa recharge).
 *
 * **La règle de choix** : dans son offre de trois, il prend la piste la plus
 * en retard sur son poids (`(rang + 1) / poids` le plus petit).
 */
import { createRng } from '../rng.ts'
import { JOUR, type CleAmelioration, type ConfigDonjon, type ProfilBot } from './config.ts'
import type { EtatPartage } from './partage.ts'
import type { EtatDonjon } from './types.ts'

/** `restants` : les taps qu'il lui reste dans le passage en cours (0 ou absent : le prochain geste est un passage). */
export type EtatDesBots = Record<string, { prochain: number; rng: number; restants?: number }>

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

/**
 * Le choix dans son offre, ou null sans offre : la piste la plus en retard
 * sur son poids ; une piste qu'il ne vise pas (poids absent) ne passe qu'en
 * dernier recours — il ne garde jamais un point.
 */
export function choixDuBot(_config: ConfigDonjon, etat: EtatDonjon, profil: ProfilBot): CleAmelioration | null {
  const j = etat.joueurs.find((x) => x.id === profil.id)
  if (j === undefined || j.points <= 0 || j.offre.length === 0) return null
  let meilleure: CleAmelioration | null = null
  let score = Infinity
  for (const quoi of j.offre) {
    const poids = profil.poids[quoi] ?? 0
    const s = poids > 0 ? (j.ameliorations[quoi] + 1) / poids : 1e9 + j.ameliorations[quoi]
    if (s < score) {
      score = s
      meilleure = quoi
    }
  }
  return meilleure
}

async function depenser(config: ConfigDonjon, partage: EtatPartage, profil: ProfilBot, etat: EtatDonjon, t: number): Promise<EtatDonjon> {
  for (let quoi = choixDuBot(config, etat, profil); quoi !== null; quoi = choixDuBot(config, etat, profil)) {
    etat = await partage.agir({ joueur: profil.id, t, type: 'acheter', quoi })
  }
  return etat
}

/**
 * Joue, dans l'ordre du temps, tous les gestes des bots prévus jusqu'à
 * `jusqua` : le début d'un passage (rejoindre, dépenser, tirer son nombre de
 * taps), chacun de ses taps, et à la fin la redépense. Rend le planning suivant.
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
    const t = b.prochain
    if ((b.restants ?? 0) <= 0) {
      // Le début d'un passage : il revient, dépense, tire son nombre de taps.
      let etat = await partage.agir({ joueur: profil.id, t, type: 'rejoindre', nom: profil.nom, bot: profil.id })
      etat = await depenser(config, partage, profil, etat, t)
      const tire = tirage(b.rng)
      const [min, max] = profil.taps
      suite[profil.id] = { prochain: t, rng: tire.rng, restants: min + Math.floor(tire.v * (max - min + 1)) }
      continue
    }
    // Un tap, puis le suivant à la fin de la recharge.
    let etat = await partage.agir({ joueur: profil.id, t, type: 'taper', n: 1 })
    const restants = (b.restants ?? 0) - 1
    if (restants > 0) {
      suite[profil.id] = { prochain: t + config.tap.recharge, rng: b.rng, restants }
      continue
    }
    // Le passage est fini : il redépense, et le suivant est tiré.
    etat = await depenser(config, partage, profil, etat, t)
    void etat
    const ecart = tirage(b.rng)
    const e = config.bots.ecartPassage
    suite[profil.id] = { prochain: t + ecartMoyen(profil) * (1 - e + 2 * e * ecart.v), rng: ecart.rng, restants: 0 }
  }
}

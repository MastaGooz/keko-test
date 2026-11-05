/**
 * LES BOTS : des joueurs comme les autres, qui passent par `agir`.
 *
 * Chaque bot a son planning (son prochain geste) et son propre RNG seedé,
 * tenus HORS de l'état partagé : ce sont des clients, pas des règles. Un
 * passage : il dépense ses points, tape un coup à chaque fin de recharge
 * jusqu'à son compte (et lance chaque capacité dès qu'elle est prête), puis redépense ; entre deux passages, seul son
 * auto-tap tourne (et c'est l'état partagé qui le résout). *Chaque tap est
 * un geste à son heure* : un passage ne joue jamais en avance sur le temps
 * qu'on lui donne (sinon l'état partagé partirait dans le futur et le tap
 * d'un humain, ramené à l'heure de l'état, attendrait sa recharge).
 *
 * **La règle de dépense** : chaque point va à la caractéristique la plus en
 * retard sur son poids (`(points + 1) / poids` le plus petit).
 */
import { createRng } from '../rng.ts'
import { AMELIORATIONS, JOUR, type CleAmelioration, type ConfigDonjon, type ProfilBot } from './config.ts'
import type { EtatPartage } from './partage.ts'
import { capacitePrete, capacitesDe, evenementA, passifDe, passifOuvert } from './regles.ts'
import type { EtatDonjon } from './types.ts'

/** `restants` : les taps qu'il lui reste dans le passage en cours (0 ou absent : le prochain geste est un passage). */
export type EtatDesBots = Record<string, { prochain: number; rng: number; restants?: number }>

function tirage(rngEtat: number): { v: number; rng: number } {
  const r = createRng(rngEtat)
  const v = r.next()
  return { v, rng: r.getState() }
}

/**
 * Le bot réussit-il l'événement k de son passif, au rang `rang` de sa série ?
 * Un tirage fixé par (bot, événement, rang) ; chaque rang de plus, son
 * adresse fond de 40 % (la série raccourcit : il ne l'enchaîne pas sans fin).
 */
function reussit(profil: ProfilBot, k: number, rang: number): boolean {
  let h = 2166136261
  for (let i = 0; i < profil.id.length; i++) h = Math.imul(h ^ profil.id.charCodeAt(i), 16777619)
  return tirage((h ^ Math.imul(k + 1, 0x9e3779b9) ^ Math.imul(rang, 0x85ebca6b)) >>> 0).v < profil.adresse * 0.6 ** rang
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

/** Où il met son point, ou null sans point : la caractéristique la plus en retard sur son poids. */
export function choixDuBot(_config: ConfigDonjon, etat: EtatDonjon, profil: ProfilBot): CleAmelioration | null {
  const j = etat.joueurs.find((x) => x.id === profil.id)
  if (j === undefined || j.points <= 0) return null
  let meilleure: CleAmelioration | null = null
  let score = Infinity
  for (const quoi of AMELIORATIONS) {
    const poids = profil.poids[quoi] ?? 0
    if (poids <= 0) continue
    const s = (j.ameliorations[quoi] + 1) / poids
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
      let etat = await partage.agir({ joueur: profil.id, t, type: 'rejoindre', nom: profil.nom, bot: profil.id, arme: profil.arme })
      etat = await depenser(config, partage, profil, etat, t)
      const tire = tirage(b.rng)
      const [min, max] = profil.taps
      suite[profil.id] = { prochain: t, rng: tire.rng, restants: min + Math.floor(tire.v * (max - min + 1)) }
      continue
    }
    // Un tap, puis le suivant à la fin de la recharge ; ses capacités
    // partent dès qu'elles sont prêtes, au même instant.
    let etat = await partage.agir({ joueur: profil.id, t, type: 'taper', n: 1 })
    const moi = etat.joueurs.find((x) => x.id === profil.id)
    if (moi !== undefined) {
      for (const capacite of capacitesDe(config, moi)) {
        if (capacitePrete(config, moi, capacite, t)) etat = await partage.agir({ joueur: profil.id, t, type: 'lancer', capacite })
      }
      // Son passif : un événement ouvert, il le réussit selon son adresse
      // (une fonction de l'événement : il ne retente pas un raté).
      const ev = evenementA(config, etat.saison.seed, moi, t)
      if (ev !== null && passifOuvert(config, moi, ev) && reussit(profil, ev.k, ev.rang)) {
        for (let cible = 0; cible < (passifDe(config, moi)?.cibles ?? 0); cible++) etat = await partage.agir({ joueur: profil.id, t, type: 'toucher', evenement: ev.k, cible })
      }
    }
    const restants = (b.restants ?? 0) - 1
    if (restants > 0) {
      // Le tap suivant à sa fin de recharge (la sienne : la Vitesse la raccourcit).
      const prochain = etat.joueurs.find((x) => x.id === profil.id)?.prochainTap ?? t + config.armes[profil.arme].recharge
      suite[profil.id] = { prochain: Math.max(prochain, t + 1), rng: b.rng, restants }
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

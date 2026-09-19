/**
 * Vérification des règles de la descente, sans navigateur :
 *   npm run verif
 *
 * Comme pour le combat, ce n'est pas une suite de tests à maintenir : c'est la
 * preuve que les règles tranchées avec Keko font bien ce qu'elles disent. Ici
 * ce sont celles qui portent l'extraction — les PV qui ne se rechargent pas,
 * le sac qui déborde dans le deck, la mort qui fait tout perdre.
 */
import { createRng } from './rng.ts'
import type { Descente, Reglage } from './descente.ts'
import {
  butinTransporte,
  commencerDescente,
  descendre,
  extraire,
  laisser,
  placeDuSac,
  prendre,
  resoudreCombat,
  tresorsAuDeck,
} from './descente.ts'
import { CAPACITE_SAC } from './cartes.ts'

const REGLAGE: Reglage = { pvMax: 100, soin: 20, menaceDepart: 0.45, profondeurMax: 4 }

let echecs = 0

console.log('Règles de la descente :')

function verifier(nom: string, condition: boolean): void {
  console.log(`  ${condition ? 'ok  ' : 'ECHEC'}  ${nom}`)
  if (!condition) echecs += 1
}

/** Force l'issue d'un combat sans le jouer : on teste la descente, pas lui. */
function conclure(descente: Descente, issue: 'victoire' | 'defaite', pv = 40): Descente {
  return { ...descente, combat: { ...descente.combat, issue, pv } }
}

/** Amène la descente au choix de récompense du palier courant. */
function jusquAuChoix(descente: Descente, rng = createRng(1), pv = 40): Descente {
  return resoudreCombat(conclure(descente, 'victoire', pv), rng)
}

// --- la structure de la run ------------------------------------------------

{
  const d = commencerDescente(createRng(7), REGLAGE)
  verifier('une descente commence au premier palier, en combat', d.profondeur === 1 && d.phase.type === 'combat')
  verifier('on part avec le deck de base et le sac vide', d.deck.length === 10 && d.sac.length === 0)
  verifier('on part à pleins PV', d.combat.pv === REGLAGE.pvMax)
}

{
  const d = jusquAuChoix(commencerDescente(createRng(7), REGLAGE))
  verifier('une victoire ouvre un choix', d.phase.type === 'recompense')
  verifier(
    'le choix oppose une carte et un trésor',
    d.phase.type === 'recompense' &&
      d.phase.offres.length === 2 &&
      d.phase.offres[0]!.genre === 'carte' &&
      d.phase.offres[1]!.genre === 'tresor',
  )
}

{
  const d = resoudreCombat(conclure(commencerDescente(createRng(7), REGLAGE), 'defaite', 0), createRng(1))
  verifier('une défaite termine la descente sur une mort', d.phase.type === 'fin' && d.phase.issue === 'mort')
}

// --- les PV ne se rechargent pas -------------------------------------------

{
  const rng = createRng(3)
  const apres = jusquAuChoix(commencerDescente(rng, REGLAGE), rng, 40)
  const descendue = descendre(prendre(apres, 0), rng)
  verifier(
    'on descend avec les PV qu\'il reste, pas avec la barre pleine',
    descendue.combat.pv === 40 + REGLAGE.soin && descendue.combat.pv < REGLAGE.pvMax,
  )
  verifier('le soin ne dépasse jamais le maximum', jusquAuChoix(commencerDescente(rng, REGLAGE), rng, REGLAGE.pvMax).combat.pv === REGLAGE.pvMax)
}

// --- le sac, et ce qui déborde ---------------------------------------------

{
  const rng = createRng(11)
  let d = commencerDescente(rng, REGLAGE)
  verifier('le sac est vide au départ', placeDuSac(d) === CAPACITE_SAC)

  // On remplit le sac, puis un trésor de plus.
  for (let i = 0; i < CAPACITE_SAC; i += 1) {
    d = prendre(jusquAuChoix(d, rng), 1)
    if (d.phase.type === 'sortie') d = descendre(d, rng)
  }
  verifier('le sac se remplit avant le deck', d.sac.length === CAPACITE_SAC && tresorsAuDeck(d) === 0)

  const sature = prendre(jusquAuChoix(d, rng), 1)
  verifier(
    'sac plein, le trésor suivant tombe dans le deck',
    sature.sac.length === CAPACITE_SAC && tresorsAuDeck(sature) === 1,
  )
  verifier('un trésor du deck est bien une carte du deck', sature.deck.length === 11)
}

{
  const rng = createRng(13)
  const choix = jusquAuChoix(commencerDescente(rng, REGLAGE), rng)
  const avecCarte = prendre(choix, 0)
  verifier('prendre la carte épaissit le deck sans toucher au sac', avecCarte.deck.length === 11 && avecCarte.sac.length === 0)
  verifier('une carte gagnée est jouable', avecCarte.deck[10]!.type === 'combat')

  const rien = laisser(choix)
  verifier('refuser ne prend rien du tout', rien.deck.length === 10 && rien.sac.length === 0)
  verifier('refuser mène quand même au point de sortie', rien.phase.type === 'sortie')
}

// --- le butin, et ce qu'on en fait -----------------------------------------

{
  const rng = createRng(17)
  const avecTresor = prendre(jusquAuChoix(commencerDescente(rng, REGLAGE), rng), 1)
  verifier('un trésor pris compte dans le butin transporté', butinTransporte(avecTresor) > 0)
  verifier('le butin de départ est nul', butinTransporte(commencerDescente(rng, REGLAGE)) === 0)

  const sortie = extraire(avecTresor)
  verifier('on peut extraire depuis un point de sortie', sortie.phase.type === 'fin' && sortie.phase.issue === 'extrait')
  verifier('extraire ne touche pas au butin', butinTransporte(sortie) === butinTransporte(avecTresor))
}

// --- le dernier palier ------------------------------------------------------

{
  const rng = createRng(19)
  let d = commencerDescente(rng, REGLAGE)
  for (let i = 1; i < REGLAGE.profondeurMax; i += 1) {
    d = descendre(prendre(jusquAuChoix(d, rng), 0), rng)
  }
  verifier('on atteint le dernier palier', d.profondeur === REGLAGE.profondeurMax)

  const fond = jusquAuChoix(d, rng)
  verifier('le dernier palier donne sa récompense comme les autres', fond.phase.type === 'recompense')

  const fini = prendre(fond, 1)
  verifier('après quoi la descente se termine sur une extraction', fini.phase.type === 'fin' && fini.phase.issue === 'extrait')
  verifier('et le trésor du fond est bien compté', butinTransporte(fini) > 0)
}

// --- les transitions refusent ce qui n'a pas de sens ------------------------

{
  const rng = createRng(23)
  const enCombat = commencerDescente(rng, REGLAGE)
  verifier('on ne prend pas de récompense pendant un combat', prendre(enCombat, 0) === enCombat)
  verifier('on ne descend pas pendant un combat', descendre(enCombat, rng) === enCombat)
  verifier('on n\'extrait pas pendant un combat', extraire(enCombat) === enCombat)
  verifier('un combat non terminé ne se résout pas', resoudreCombat(enCombat, rng) === enCombat)

  const choix = jusquAuChoix(enCombat, rng)
  verifier('une offre inexistante ne change rien', prendre(choix, 9) === choix)
}

if (echecs > 0) throw new Error(`${echecs} vérification(s) en échec`)
console.log('Tout passe.')

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
import type { Depot, Descente, Reglage } from './descente.ts'
import {
  butinTransporte,
  commencerDescente,
  descendre,
  choisirCarte,
  extraire,
  placerTresor,
  placeDuSac,
  resoudreCombat,
  tresorsAuDeck,
} from './descente.ts'
import { CHOIX_PAR_PALIER } from './descente.ts'
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

/** Amène la descente au choix d'amélioration du palier courant. */
function jusquAuChoix(descente: Descente, rng = createRng(1), pv = 40): Descente {
  return resoudreCombat(conclure(descente, 'victoire', pv), rng)
}

/** Choisit la première amélioration, et amène au rangement du trésor. */
function jusquAuButin(descente: Descente, rng = createRng(1), pv = 40): Descente {
  return choisirCarte(jusquAuChoix(descente, rng, pv), 0, rng)
}

/** Palier complet : amélioration prise, trésor rangé où on le demande. */
function palier(descente: Descente, depot: Depot, rng = createRng(1), pv = 40): Descente {
  return placerTresor(jusquAuButin(descente, rng, pv), depot)
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
  verifier("une victoire ouvre le choix d'amélioration", d.phase.type === 'recompense')
  verifier(
    'plusieurs améliorations sont proposées, toutes jouables',
    d.phase.type === 'recompense' &&
      d.phase.cartes.length === CHOIX_PAR_PALIER &&
      d.phase.cartes.every((c) => c.type === 'combat'),
  )
  const apresCarte = choisirCarte(d, 0, createRng(2))
  verifier('choisir une amélioration présente ensuite le trésor', apresCarte.phase.type === 'butin')
  verifier('et elle est entrée dans le deck', apresCarte.deck.length === 11)
}

{
  const d = resoudreCombat(conclure(commencerDescente(createRng(7), REGLAGE), 'defaite', 0), createRng(1))
  verifier('une défaite termine la descente sur une mort', d.phase.type === 'fin' && d.phase.issue === 'mort')
}

// --- les PV ne se rechargent pas -------------------------------------------

{
  const rng = createRng(3)
  const apres = jusquAuChoix(commencerDescente(rng, REGLAGE), rng, 40)
  const descendue = descendre(placerTresor(choisirCarte(apres, 0, rng), { ou: 'laisser' }), rng)
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
    d = palier(d, { ou: 'sac', emplacement: i }, rng)
    if (d.phase.type === 'sortie') d = descendre(d, rng)
  }
  verifier('le sac se remplit emplacement par emplacement', d.sac.length === CAPACITE_SAC && tresorsAuDeck(d) === 0)
  verifier('et chaque palier a aussi donné son amélioration', d.deck.length === 10 + CAPACITE_SAC)

  const avant = d.sac[1]!
  const echange = palier(d, { ou: 'sac', emplacement: 1 }, rng)
  verifier('déposer sur un emplacement occupé échange', echange.sac.length === CAPACITE_SAC && echange.sac[1] !== avant)
  verifier("et l'ancien reste au fond, il ne tombe pas dans le deck", tresorsAuDeck(echange) === 0)

  const porte = palier(d, { ou: 'deck' }, rng)
  verifier('le trésor peut être porté dans le deck', tresorsAuDeck(porte) === 1 && porte.sac.length === CAPACITE_SAC)
}

{
  const rng = createRng(13)
  const dedans = palier(commencerDescente(rng, REGLAGE), { ou: 'sac', emplacement: 0 }, rng)
  verifier('un palier donne une amélioration ET un trésor', dedans.deck.length === 11 && dedans.sac.length === 1)
  verifier('le trésor rangé compte dans le butin', butinTransporte(dedans) > 0)

  const laisse = palier(commencerDescente(rng, REGLAGE), { ou: 'laisser' }, rng)
  verifier("laisser le trésor garde quand même l'amélioration", laisse.deck.length === 11 && laisse.sac.length === 0)
  verifier('un trésor laissé est perdu, pas reporté', butinTransporte(laisse) === 0)
  verifier('et on va quand même au point de sortie', laisse.phase.type === 'sortie')
}

// --- le butin, et ce qu'on en fait -----------------------------------------

{
  const rng = createRng(17)
  const avecTresor = palier(commencerDescente(rng, REGLAGE), { ou: 'sac', emplacement: 0 }, rng)
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
    d = descendre(palier(d, { ou: 'laisser' }, rng), rng)
  }
  verifier('on atteint le dernier palier', d.profondeur === REGLAGE.profondeurMax)

  const fond = jusquAuChoix(d, rng)
  verifier('le dernier palier donne sa récompense comme les autres', fond.phase.type === 'recompense')

  const fini = palier(d, { ou: 'sac', emplacement: 0 }, rng)
  verifier('après quoi la descente se termine sur une extraction', fini.phase.type === 'fin' && fini.phase.issue === 'extrait')
  verifier('et le trésor du fond est bien compté', butinTransporte(fini) > 0)
}

// --- les transitions refusent ce qui n'a pas de sens ------------------------

{
  const rng = createRng(23)
  const enCombat = commencerDescente(rng, REGLAGE)
  verifier("on ne choisit pas d'amélioration pendant un combat", choisirCarte(enCombat, 0, rng) === enCombat)
  verifier('on ne range pas de trésor pendant un combat', placerTresor(enCombat, { ou: 'deck' }) === enCombat)
  verifier('on ne descend pas pendant un combat', descendre(enCombat, rng) === enCombat)
  verifier('on n\'extrait pas pendant un combat', extraire(enCombat) === enCombat)
  verifier('un combat non terminé ne se résout pas', resoudreCombat(enCombat, rng) === enCombat)

  const choix = jusquAuChoix(enCombat, rng)
  verifier('on ne descend pas depuis une récompense', descendre(choix, rng) === choix)
}

if (echecs > 0) throw new Error(`${echecs} vérification(s) en échec`)
console.log('Tout passe.')

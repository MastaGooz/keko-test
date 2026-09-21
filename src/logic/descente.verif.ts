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
import type { Descente, Lieu, Reglage } from './descente.ts'
import {
  butinTransporte,
  commencerDescente,
  descendre,
  choisirCarte,
  deplacerTresor,
  extraire,
  terminerButin,
  resoudreCombat,
  tresorsAuDeck,
} from './descente.ts'
import { CHOIX_PAR_PALIER } from './descente.ts'

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

/** Palier complet : amélioration prise, trésor rangé, palier refermé. */
function palier(descente: Descente, cible: Lieu, rng = createRng(1), pv = 40): Descente {
  const range = deplacerTresor(jusquAuButin(descente, rng, pv), { ou: 'loot' }, cible)
  return terminerButin(range)
}

// --- la structure de la run ------------------------------------------------

{
  const d = commencerDescente(createRng(7), REGLAGE)
  verifier('une descente commence au premier palier, en combat', d.profondeur === 1 && d.phase.type === 'combat')
  verifier('on part avec le deck de base et rien de porté', d.deck.length === 10 && tresorsAuDeck(d) === 0)
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
  const range = deplacerTresor(choisirCarte(apres, 0, rng), { ou: 'loot' }, { ou: 'fond' })
  const descendue = descendre(terminerButin(range), rng)
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
  verifier('on ne porte aucun trésor au départ', tresorsAuDeck(d) === 0)

  // TOUT TRESOR PRIS PESE TOUT DE SUITE : il n'y a plus de sac pour l'absorber.
  d = palier(d, { ou: 'deck' }, rng)
  if (d.phase.type === 'sortie') d = descendre(d, rng)
  verifier('un trésor emporté tombe directement dans le deck', tresorsAuDeck(d) === 1)
  verifier('et le palier a aussi donné son amélioration', d.deck.length === 12)

  // Le fond reste un contenant : ce qu'on y jette se repêche jusqu'à Terminer.
  const auButin = jusquAuButin(d, rng)
  const neuf = auButin.phase.type === 'butin' ? auButin.phase.loot! : null!
  const enCours = deplacerTresor(auButin, { ou: 'loot' }, { ou: 'fond' })
  verifier('jeter au fond vide la main', enCours.phase.type === 'butin' && enCours.phase.loot === null)
  verifier('on peut terminer une fois la main vide', terminerButin(enCours) !== enCours)

  const repeche = deplacerTresor(enCours, { ou: 'fond', id: neuf.id }, { ou: 'loot' })
  verifier("et on peut le repêcher tant qu'on n'a pas terminé",
    repeche.phase.type === 'butin' && repeche.phase.loot === neuf)

  // On peut aussi LACHER UN TRESOR DEJA PORTE pour faire de la place au neuf :
  // c'est ce qui remplace le sac, et c'est un choix plus large qu'avant
  // puisqu'il porte sur tout ce qu'on transporte.
  const ancien = auButin.deck.find((c) => c.type === 'tresor')!
  const avant = tresorsAuDeck(auButin)
  const allege = deplacerTresor(auButin, { ou: 'deck', id: ancien.id }, { ou: 'fond' })
  verifier('un trésor déjà porté peut être abandonné', tresorsAuDeck(allege) === avant - 1)

  const refermé = terminerButin(deplacerTresor(allege, { ou: 'loot' }, { ou: 'deck' }))
  verifier("le neuf entre, l'ancien reste au fond",
    refermé.phase.type !== 'butin' &&
      tresorsAuDeck(refermé) === avant &&
      !refermé.deck.includes(ancien))
}

// --- les trois contenants communiquent dans les deux sens ------------------

{
  const rng = createRng(29)
  let d = commencerDescente(rng, REGLAGE)
  d = jusquAuButin(d, rng)
  const loot = d.phase.type === 'butin' ? d.phase.loot : null

  const auDeck = deplacerTresor(d, { ou: 'loot' }, { ou: 'deck' })
  verifier('on peut poser le trésor sur la pile du deck',
    tresorsAuDeck(auDeck) === 1 && auDeck.phase.type === 'butin' && auDeck.phase.loot === null)

  const repris = deplacerTresor(auDeck, { ou: 'deck', id: loot!.id }, { ou: 'loot' })
  verifier("et le reprendre de la pile vers l'emplacement de loot",
    tresorsAuDeck(repris) === 0 && repris.phase.type === 'butin' && repris.phase.loot === loot)

  const versFond = deplacerTresor(auDeck, { ou: 'deck', id: loot!.id }, { ou: 'fond' })
  verifier('et le sortir de la pile directement vers le fond',
    tresorsAuDeck(versFond) === 0 && versFond.phase.type === 'butin' && versFond.phase.fond[0] === loot)

  // Le fond est un contenant : ce qu'on y jette se reprend jusqu'à Terminer.
  const jete = deplacerTresor(d, { ou: 'loot' }, { ou: 'fond' })
  verifier("jeter au fond vide l'emplacement de loot",
    jete.phase.type === 'butin' && jete.phase.loot === null && jete.phase.fond.length === 1)
  verifier('mais le trésor y reste visible, pas encore perdu',
    jete.phase.type === 'butin' && jete.phase.fond[0] === loot)

  const repeche = deplacerTresor(jete, { ou: 'fond', id: loot!.id }, { ou: 'deck' })
  verifier('on peut le repêcher du fond vers le deck',
    tresorsAuDeck(repeche) === 1 && repeche.phase.type === 'butin' && repeche.phase.fond.length === 0)

  const perdu = terminerButin(jete)
  verifier("c'est en terminant qu'il est perdu, et seulement là",
    perdu.phase.type !== 'butin' && butinTransporte(perdu) === 0)
  verifier('un lieu vide ne donne rien à déplacer',
    deplacerTresor(jete, { ou: 'loot' }, { ou: 'deck' }) === jete)
}

{
  const rng = createRng(13)
  const dedans = palier(commencerDescente(rng, REGLAGE), { ou: 'deck' }, rng)
  verifier('un palier donne une amélioration ET un trésor',
    dedans.deck.length === 12 && tresorsAuDeck(dedans) === 1)
  verifier('le trésor rangé compte dans le butin', butinTransporte(dedans) > 0)

  const laisse = palier(commencerDescente(rng, REGLAGE), { ou: 'fond' }, rng)
  verifier("laisser le trésor garde quand même l'amélioration",
    laisse.deck.length === 11 && tresorsAuDeck(laisse) === 0)
  verifier('un trésor laissé est perdu, pas reporté', butinTransporte(laisse) === 0)
  verifier('et on va quand même au point de sortie', laisse.phase.type === 'sortie')
}

// --- le butin, et ce qu'on en fait -----------------------------------------

{
  const rng = createRng(17)
  const avecTresor = palier(commencerDescente(rng, REGLAGE), { ou: 'deck' }, rng)
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
    d = descendre(palier(d, { ou: 'fond' }, rng), rng)
  }
  verifier('on atteint le dernier palier', d.profondeur === REGLAGE.profondeurMax)

  const fond = jusquAuChoix(d, rng)
  verifier('le dernier palier donne sa récompense comme les autres', fond.phase.type === 'recompense')

  const fini = palier(d, { ou: 'deck' }, rng)
  verifier('après quoi la descente se termine sur une extraction', fini.phase.type === 'fin' && fini.phase.issue === 'extrait')
  verifier('et le trésor du fond est bien compté', butinTransporte(fini) > 0)
}

// --- les transitions refusent ce qui n'a pas de sens ------------------------

{
  const rng = createRng(23)
  const enCombat = commencerDescente(rng, REGLAGE)
  verifier("on ne choisit pas d'amélioration pendant un combat", choisirCarte(enCombat, 0, rng) === enCombat)
  verifier('on ne range pas de trésor pendant un combat', deplacerTresor(enCombat, { ou: 'loot' }, { ou: 'deck' }) === enCombat)
  verifier('on ne descend pas pendant un combat', descendre(enCombat, rng) === enCombat)
  verifier('on n\'extrait pas pendant un combat', extraire(enCombat) === enCombat)
  verifier('un combat non terminé ne se résout pas', resoudreCombat(enCombat, rng) === enCombat)

  const choix = jusquAuChoix(enCombat, rng)
  verifier('on ne descend pas depuis une récompense', descendre(choix, rng) === choix)
}

if (echecs > 0) throw new Error(`${echecs} vérification(s) en échec`)
console.log('Tout passe.')

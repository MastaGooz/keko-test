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
  placeDuSac,
  resoudreCombat,
  tresorsAuDeck,
  tresorsAuSac,
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

/** Palier complet : amélioration prise, trésor rangé, palier refermé. */
function palier(descente: Descente, cible: Lieu, rng = createRng(1), pv = 40): Descente {
  const range = deplacerTresor(jusquAuButin(descente, rng, pv), { ou: 'loot' }, cible)
  return terminerButin(range)
}

// --- la structure de la run ------------------------------------------------

{
  const d = commencerDescente(createRng(7), REGLAGE)
  verifier('une descente commence au premier palier, en combat', d.profondeur === 1 && d.phase.type === 'combat')
  verifier('on part avec le deck de base et le sac vide', d.deck.length === 10 && tresorsAuSac(d) === 0)
  verifier('le sac a ses emplacements dès le départ, tous libres', d.sac.length === CAPACITE_SAC)
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
  const range = deplacerTresor(choisirCarte(apres, 0, rng), { ou: 'loot' }, { ou: 'laisser' })
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
  verifier('le sac est vide au départ', placeDuSac(d) === CAPACITE_SAC)

  // On remplit le sac, puis un trésor de plus.
  for (let i = 0; i < CAPACITE_SAC; i += 1) {
    d = palier(d, { ou: 'sac', emplacement: i }, rng)
    if (d.phase.type === 'sortie') d = descendre(d, rng)
  }
  verifier('le sac se remplit emplacement par emplacement', tresorsAuSac(d) === CAPACITE_SAC && tresorsAuDeck(d) === 0)
  verifier('et chaque palier a aussi donné son amélioration', d.deck.length === 10 + CAPACITE_SAC)

  const avant = d.sac[1]!
  const enCours = deplacerTresor(jusquAuButin(d, rng), { ou: 'loot' }, { ou: 'sac', emplacement: 1 })
  verifier('déposer sur un emplacement occupé échange', enCours.sac[1] !== avant)
  verifier("et l'ancien passe en main, il n'est pas perdu tout de suite",
    enCours.phase.type === 'butin' && enCours.phase.loot === avant)
  verifier('on ne peut pas terminer en tenant encore un trésor', terminerButin(enCours) === enCours)

  const refermé = terminerButin(deplacerTresor(enCours, { ou: 'loot' }, { ou: 'laisser' }))
  verifier('une fois la main vide, le palier se referme', refermé.phase.type !== 'butin')
  verifier("et l'échangé n'est pas tombé dans le deck", tresorsAuDeck(refermé) === 0)

  const range = deplacerTresor(jusquAuButin(d, rng), { ou: 'sac', emplacement: 0 }, { ou: 'sac', emplacement: 2 })
  verifier('deux emplacements du sac peuvent échanger leur place',
    range.sac[0] === d.sac[2] && range.sac[2] === d.sac[0])
  verifier('réarranger ne touche pas au trésor tenu en main',
    range.phase.type === 'butin' && range.phase.loot !== null)

  const porte = palier(d, { ou: 'deck' }, rng)
  verifier('le trésor peut être porté dans le deck', tresorsAuDeck(porte) === 1 && tresorsAuSac(porte) === CAPACITE_SAC)

  // Le sac positionnel : sortir un trésor laisse SA case ouverte.
  const sorti = deplacerTresor(jusquAuButin(d, rng), { ou: 'loot' }, { ou: 'sac', emplacement: 1 })
  const vide = deplacerTresor(sorti, { ou: 'loot' }, { ou: 'laisser' })
  const remis = deplacerTresor(
    deplacerTresor(vide, { ou: 'sac', emplacement: 0 }, { ou: 'sac', emplacement: 1 }),
    { ou: 'sac', emplacement: 1 },
    { ou: 'sac', emplacement: 0 },
  )
  verifier('déplacer vers une case vide laisse la case de départ ouverte',
    vide.sac.length === CAPACITE_SAC)
  verifier("et l'aller-retour remet exactement le sac comme il était",
    remis.sac[0] === vide.sac[0] && remis.sac[1] === vide.sac[1] && remis.sac[2] === vide.sac[2])
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

  const versSac = deplacerTresor(auDeck, { ou: 'deck', id: loot!.id }, { ou: 'sac', emplacement: 2 })
  verifier('et le sortir de la pile directement vers le sac',
    tresorsAuDeck(versSac) === 0 && versSac.sac[2] === loot)

  const rangeAilleurs = deplacerTresor(
    deplacerTresor(d, { ou: 'loot' }, { ou: 'sac', emplacement: 0 }),
    { ou: 'sac', emplacement: 0 },
    { ou: 'loot' },
  )
  verifier("un trésor du sac peut revenir dans l'emplacement de loot",
    tresorsAuSac(rangeAilleurs) === 0 &&
      rangeAilleurs.phase.type === 'butin' &&
      rangeAilleurs.phase.loot === loot)

  verifier("on ne déplace rien depuis le fond du donjon",
    deplacerTresor(d, { ou: 'laisser' }, { ou: 'loot' }) === d)
  verifier('une case vide ne donne rien à déplacer',
    deplacerTresor(d, { ou: 'sac', emplacement: 2 }, { ou: 'loot' }) === d)
}

{
  const rng = createRng(13)
  const dedans = palier(commencerDescente(rng, REGLAGE), { ou: 'sac', emplacement: 0 }, rng)
  verifier('un palier donne une amélioration ET un trésor', dedans.deck.length === 11 && tresorsAuSac(dedans) === 1)
  verifier('le trésor rangé compte dans le butin', butinTransporte(dedans) > 0)

  const laisse = palier(commencerDescente(rng, REGLAGE), { ou: 'laisser' }, rng)
  verifier("laisser le trésor garde quand même l'amélioration", laisse.deck.length === 11 && tresorsAuSac(laisse) === 0)
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
  verifier('on ne range pas de trésor pendant un combat', deplacerTresor(enCombat, { ou: 'loot' }, { ou: 'deck' }) === enCombat)
  verifier('on ne descend pas pendant un combat', descendre(enCombat, rng) === enCombat)
  verifier('on n\'extrait pas pendant un combat', extraire(enCombat) === enCombat)
  verifier('un combat non terminé ne se résout pas', resoudreCombat(enCombat, rng) === enCombat)

  const choix = jusquAuChoix(enCombat, rng)
  verifier('on ne descend pas depuis une récompense', descendre(choix, rng) === choix)
}

if (echecs > 0) throw new Error(`${echecs} vérification(s) en échec`)
console.log('Tout passe.')

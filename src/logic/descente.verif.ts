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
import { carteTresor } from './cartes.ts'
import { ARME_GRATUITE, ARMURE_GRATUITE, deckDeLEquipement, potion } from './armes.ts'
import type { Descente, Lieu, Reglage } from './descente.ts'
import {
  butinTransporte,
  commencerDescente,
  descendre,
  choisirCarte,
  deplacerTresor,
  extraire,
  reordonnerTresors,
  terminerButin,
  validerJet,
  resoudreCombat,
  tresorsAuDeck,
} from './descente.ts'
import { CHOIX_PAR_PALIER, consommablesSurvivants } from './descente.ts'

// La taille du deck de depart ne s'ecrit plus en dur : elle vient de
// l'equipement, et une piece ajoutee la ferait mentir sans rien casser.
const BASE = deckDeLEquipement([ARME_GRATUITE, ARMURE_GRATUITE]).length

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
  // Jeter demande deux gestes : sans la validation, l'ecran refuse de se
  // refermer sur une decision qui n'est pas prise.
  return terminerButin(cible.ou === 'jeter' ? validerJet(range) : range)
}

// --- la structure de la run ------------------------------------------------

{
  const d = commencerDescente(createRng(7), REGLAGE)
  verifier('une descente commence au premier palier, en combat', d.profondeur === 1 && d.phase.type === 'combat')
  verifier('on part avec le deck de base et rien de porté',
    d.deck.length === BASE && tresorsAuDeck(d) === 0)
  verifier("le deck de depart vient bien de DEUX pieces d'equipement",
    d.equipement.length === 2 && d.deck.some((c) => c.nom === 'Garde'))
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
  verifier('et elle est entrée dans le deck', apresCarte.deck.length === BASE + 1)
}

{
  const d = resoudreCombat(conclure(commencerDescente(createRng(7), REGLAGE), 'defaite', 0), createRng(1))
  verifier('une défaite termine la descente sur une mort', d.phase.type === 'fin' && d.phase.issue === 'mort')
}

// --- les PV ne se rechargent pas -------------------------------------------

{
  const rng = createRng(3)
  const apres = jusquAuChoix(commencerDescente(rng, REGLAGE), rng, 40)
  const range = validerJet(deplacerTresor(choisirCarte(apres, 0, rng), { ou: 'loot' }, { ou: 'jeter' }))
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
  verifier('et le palier a aussi donné son amélioration', d.deck.length === BASE + 2)

  // Le fond reste un contenant : ce qu'on y jette se repêche jusqu'à Terminer.
  const auButin = jusquAuButin(d, rng)
  const neuf = auButin.phase.type === 'butin' ? auButin.phase.loot! : null!
  const enCours = deplacerTresor(auButin, { ou: 'loot' }, { ou: 'jeter' })
  verifier('poser dans le slot de rebut vide la main',
    enCours.phase.type === 'butin' && enCours.phase.loot === null && enCours.phase.aJeter === neuf)

  // JETER DEMANDE DEUX GESTES : tant que ce n'est pas valide, rien n'est acquis
  // et on ne peut pas refermer l'ecran sur une decision qui n'est pas prise.
  verifier('on ne peut pas terminer avec une carte en attente', terminerButin(enCours) === enCours)

  const repeche = deplacerTresor(enCours, { ou: 'jeter' }, { ou: 'loot' })
  verifier("on peut la ressortir du slot tant qu'on n'a pas valide",
    repeche.phase.type === 'butin' && repeche.phase.loot === neuf && repeche.phase.aJeter === null)

  const valide = validerJet(enCours)
  verifier('valider libere le slot et range la carte au fond',
    valide.phase.type === 'butin' && valide.phase.aJeter === null && valide.phase.fond.length === 1)
  verifier('et on peut alors terminer', terminerButin(valide) !== terminerButin(enCours))
  verifier('valider a vide ne fait rien', validerJet(valide) === valide)

  // Le slot n'en tient qu'une, mais on en jette autant qu'on veut EN VALIDANT.
  const deuxieme = validerJet(deplacerTresor(valide, { ou: 'deck', id: valide.deck.find((c) => c.type === 'tresor')!.id }, { ou: 'jeter' }))
  verifier('on peut en jeter plusieurs a la suite',
    deuxieme.phase.type === 'butin' && deuxieme.phase.fond.length === 2)

  // Poser sur un slot occupe ECHANGE : la carte qui s'y trouvait ressort, elle
  // n'est pas ecrasee -- ce serait la fausse manip que ce slot existe pour
  // empecher.
  const aPorte = enCours.deck.find((c) => c.type === 'tresor')!
  const occupe = deplacerTresor(enCours, { ou: 'deck', id: aPorte.id }, { ou: 'jeter' })
  verifier("poser sur un slot occupe fait ressortir l'ancien, il n'est pas ecrase",
    occupe.phase.type === 'butin' &&
      occupe.phase.aJeter === aPorte &&
      occupe.deck.includes(neuf))

  // On peut aussi LACHER UN TRESOR DEJA PORTE pour faire de la place au neuf :
  // c'est ce qui remplace le sac, et c'est un choix plus large qu'avant
  // puisqu'il porte sur tout ce qu'on transporte.
  const ancien = auButin.deck.find((c) => c.type === 'tresor')!
  const avant = tresorsAuDeck(auButin)
  const allege = validerJet(deplacerTresor(auButin, { ou: 'deck', id: ancien.id }, { ou: 'jeter' }))
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

  const versFond = validerJet(deplacerTresor(auDeck, { ou: 'deck', id: loot!.id }, { ou: 'jeter' }))
  verifier('et le sortir de la pile directement vers le rebut',
    tresorsAuDeck(versFond) === 0 && versFond.phase.type === 'butin' && versFond.phase.fond[0] === loot)

  // Le fond est un contenant : ce qu'on y jette se reprend jusqu'à Terminer.
  const jete = validerJet(deplacerTresor(d, { ou: 'loot' }, { ou: 'jeter' }))
  verifier("jeter vide l'emplacement de loot",
    jete.phase.type === 'butin' && jete.phase.loot === null && jete.phase.fond.length === 1)
  verifier('mais le trésor reste au rebut, pas encore perdu',
    jete.phase.type === 'butin' && jete.phase.fond[0] === loot)

  // UN REBUT VALIDE NE REVIENT PLUS. C'est le prix du bouton : la confirmation
  // remplace la reversibilite, et c'est elle qui protege des fausses manips.
  const repeche = deplacerTresor(jete, { ou: 'jeter' }, { ou: 'deck' })
  verifier('un rebut valide ne se repeche pas : le slot est vide', repeche === jete)

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
    dedans.deck.length === BASE + 2 && tresorsAuDeck(dedans) === 1)
  verifier('le trésor rangé compte dans le butin', butinTransporte(dedans) > 0)

  const laisse = palier(commencerDescente(rng, REGLAGE), { ou: 'jeter' }, rng)
  verifier("laisser le trésor garde quand même l'amélioration",
    laisse.deck.length === BASE + 1 && tresorsAuDeck(laisse) === 0)
  verifier('un trésor laissé est perdu, pas reporté', butinTransporte(laisse) === 0)
  verifier('et on va quand même au point de sortie', laisse.phase.type === 'sortie')
}

// --- ranger ses tresors ----------------------------------------------------

// Aucun effet sur les regles -- le deck est melange au combat suivant -- mais
// l'ordre doit passer par l'ETAT, sinon le rendu le balaie au premier
// deplacement. Meme raison que la main de combat.
{
  const rng = createRng(23)
  const base = jusquAuButin(commencerDescente(rng, REGLAGE), rng)
  const a = carteTresor('t-a', 'Couronne', 240)
  const b = carteTresor('t-b', 'Calice', 120)
  const c = carteTresor('t-c', 'Camée', 45)
  const combat = base.deck.filter((x) => x.type === 'combat')
  const d = { ...base, deck: [...combat, a, b, c] }

  const enTete = reordonnerTresors(d, c.id, 0).deck.filter((x) => x.type === 'tresor')
  verifier('un trésor porté se range à une autre place', enTete[0] === c && enTete.length === 3)

  const enQueue = reordonnerTresors(d, a.id, 2).deck.filter((x) => x.type === 'tresor')
  verifier('et dans les deux sens', enQueue[2] === a && enQueue[0] === b)

  verifier('les cartes de combat ne bougent pas',
    reordonnerTresors(d, a.id, 2).deck.filter((x) => x.type === 'combat').length === combat.length)
  verifier('un identifiant inconnu ne range rien', reordonnerTresors(d, 'aucun', 0) === d)
  verifier('un rang hors bornes se ramene au bord',
    reordonnerTresors(d, a.id, 99).deck.filter((x) => x.type === 'tresor')[2] === a)
  verifier('on ne range pas de trésor hors de la phase de butin',
    reordonnerTresors({ ...d, phase: { type: 'combat' } }, a.id, 0).deck === d.deck)
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
    d = descendre(palier(d, { ou: 'jeter' }, rng), rng)
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

// --- les consommables emportés, et ce qu'il en reste ------------------------

{
  const rng = createRng(77)
  const pile = [potion(1), potion(2), potion(3)]
  const d = commencerDescente(rng, REGLAGE, [ARME_GRATUITE, ARMURE_GRATUITE], pile)

  // LEURS CARTES SONT DANS LE DECK, et elles portent l'identifiant de leur
  // exemplaire : c'est ce qui permet de savoir laquelle a été bue.
  verifier('la pile ajoute ses cartes au deck',
    d.deck.length === deckDeLEquipement([ARME_GRATUITE, ARMURE_GRATUITE]).length + 3)
  verifier('chaque carte porte l’identifiant de son exemplaire',
    pile.every((c) => d.deck.some((k) => k.id === c.id)))
  verifier('rien n’est bu au départ', consommablesSurvivants(d).length === 3)

  // UNE POTION BUE S'EXILE, donc elle quitte le deck -- et `consommablesSurvivants`
  // le lit directement, sans compteur à tenir. C'est ce qui fait qu'elle ne
  // rentre pas au râtelier.
  const bue = { ...d, deck: d.deck.filter((k) => k.id !== pile[1]!.id) }
  verifier('une potion bue ne survit pas', consommablesSurvivants(bue).length === 2)
  verifier('...et c’est bien celle-là', !consommablesSurvivants(bue).some((c) => c.id === pile[1]!.id))
}

if (echecs > 0) throw new Error(`${echecs} vérification(s) en échec`)
console.log('Tout passe.')

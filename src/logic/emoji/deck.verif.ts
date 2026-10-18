// LA VÉRIF DU DECK QUI JOUE : `node src/logic/emoji/deck.verif.ts` — sans navigateur.
import {
  DECK,
  basculerCarte,
  deckAJour,
  deckComplet,
  deckVide,
  demarrer,
  garderPossedees,
  likesDeLaMain,
  lireDeck,
  mainCourante,
  melange,
  prochaineMainDans,
} from './deck.ts'

let echecs = 0
function verifier(quoi: string, vrai: boolean): void {
  if (!vrai) echecs += 1
  console.log(`  ${vrai ? 'ok  ' : 'ECHEC'}  ${quoi}`)
}

console.log('deck')
const ids = Array.from({ length: DECK.taille }, (_, i) => (0x1f600 + i).toString(16))
const T0 = 1_000_000

// LA COMPOSITION
let d = deckVide()
for (const id of ids.slice(0, DECK.taille - 1)) d = basculerCarte(d, id, T0)
verifier('vingt-neuf cartes, le deck ne joue pas', d.cartes.length === DECK.taille - 1 && d.partie === null && !deckComplet(d))
verifier('pas de main sans partie', mainCourante(d).length === 0 && prochaineMainDans(d, T0) === null)
d = basculerCarte(d, ids[DECK.taille - 1]!, T0)
verifier('la trentième lance la partie', deckComplet(d) && d.partie !== null && d.partie.depuis === T0 && d.partie.jouees === 0)
verifier('une trente-et-unième est refusée', basculerCarte(d, 'abcd', T0) === d)
verifier('retirer une carte arrête la partie', basculerCarte(d, ids[3]!, T0 + 5).partie === null)
verifier('la main courante fait cinq cartes du deck', mainCourante(d).length === DECK.main && mainCourante(d).every((id) => ids.includes(id)))
verifier('le mélange est seedé', melange(ids, 42).join() === melange(ids, 42).join() && melange(ids, 42).join() !== melange(ids, 43).join())
verifier('le mélange garde toutes les cartes', [...melange(ids, 7)].sort().join() === [...ids].sort().join())

// LE TEMPS QUI JOUE
verifier('rien avant la cadence', deckAJour(d, T0 + DECK.cadence - 1).mains === 0)
const une = deckAJour(d, T0 + DECK.cadence)
verifier('une main à la cadence', une.mains === 1 && une.likes === DECK.main * DECK.likesParCarte && une.derniere?.length === DECK.main)
verifier('la main jouée était la main courante', une.derniere?.join() === mainCourante(d).join())
verifier('cinq cartes jouées, la cadence repart de la main', une.deck.partie?.jouees === DECK.main && une.deck.partie?.depuis === T0 + DECK.cadence)
verifier('la prochaine main est à une cadence de là', prochaineMainDans(une.deck, T0 + DECK.cadence + 3000) === DECK.cadence - 3000)
const parCycle = DECK.taille / DECK.main
const cycle = deckAJour(d, T0 + DECK.cadence * parCycle)
verifier('un cycle entier vide le deck et le remélange', cycle.mains === parCycle && cycle.deck.partie?.jouees === 0 && cycle.deck.partie?.graine !== d.partie?.graine)
verifier('le cycle rapporte trente Likes', cycle.likes === DECK.taille * DECK.likesParCarte)
const deuxEtDemi = deckAJour(d, T0 + DECK.cadence * (parCycle * 2 + 3) + 1234)
verifier('deux cycles et trois mains', deuxEtDemi.mains === parCycle * 2 + 3 && deuxEtDemi.deck.partie?.jouees === 3 * DECK.main)
verifier('le reste de la cadence est gardé', deuxEtDemi.deck.partie?.depuis === T0 + DECK.cadence * (parCycle * 2 + 3))
verifier('jouer en deux fois ou en une donne pareil', deckAJour(une.deck, T0 + DECK.cadence * parCycle).likes + une.likes === cycle.likes && deckAJour(une.deck, T0 + DECK.cadence * parCycle).deck.partie?.graine === cycle.deck.partie?.graine)
const horsLigne = deckAJour(d, T0 + DECK.horsLigneMax * 3)
verifier('hors ligne, au plus la limite', horsLigne.mains === DECK.horsLigneMax / DECK.cadence && horsLigne.deck.partie?.depuis === T0 + DECK.horsLigneMax * 3)
const recule = deckAJour(d, T0 - 5000)
verifier('une horloge qui recule ne joue rien et repart', recule.mains === 0 && recule.deck.partie?.depuis === T0 - 5000)
verifier('une main vaut un Like par carte', likesDeLaMain(['a', 'b', 'c']) === 3 * DECK.likesParCarte)

// LA POSSESSION
const sansDeux = garderPossedees(d, (id) => id !== ids[0] && id !== ids[1], T0)
verifier('une carte perdue quitte le deck, qui s’arrête', sansDeux.cartes.length === DECK.taille - 2 && sansDeux.partie === null)
verifier('rien perdu, le même deck', garderPossedees(d, () => true, T0) === d)
verifier('démarrer un deck qui joue ne change rien', demarrer(d, T0 + 99) === d)

// LA RELECTURE
const tous = (): boolean => true
const relu = lireDeck(JSON.parse(JSON.stringify(une.deck)), tous, T0 + 50_000)
verifier('un deck gardé se relit tel quel', relu.cartes.join() === une.deck.cartes.join() && relu.partie?.graine === une.deck.partie?.graine && relu.partie?.jouees === une.deck.partie?.jouees && relu.partie?.depuis === une.deck.partie?.depuis)
verifier('abîmé, il repart vide', lireDeck('n’importe quoi', tous, T0).cartes.length === 0 && lireDeck({ cartes: 'x' }, tous, T0).partie === null)
const sansPossession = lireDeck({ cartes: ids, partie: une.deck.partie }, (id) => id !== ids[5], T0)
verifier('une carte qu’on ne possède plus est écartée, la partie tombe', sansPossession.cartes.length === DECK.taille - 1 && sansPossession.partie === null)
verifier('un doublon est écarté', lireDeck({ cartes: [...ids.slice(0, 29), ids[0]] }, tous, T0).cartes.length === 29)
verifier('un deck complet sans partie en reçoit une', lireDeck({ cartes: ids }, tous, T0 + 7).partie?.depuis === T0 + 7)
verifier('une partie abîmée repart neuve', lireDeck({ cartes: ids, partie: { graine: 1, jouees: 7, depuis: T0 } }, tous, T0 + 9).partie?.depuis === T0 + 9)

console.log(echecs === 0 ? 'Tout passe.' : `${echecs} echec(s).`)
if (echecs > 0) throw new Error(`${echecs} verification(s) en echec`)

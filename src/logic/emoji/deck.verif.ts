// LA VÉRIF DU DECK QUI JOUE : `node src/logic/emoji/deck.verif.ts` — sans navigateur.
import {
  DECK,
  DECKS_LUS_MAX,
  DECKS_MAX,
  ajouterDeck,
  basculerCarte,
  basculerDansDeck,
  choisirDeck,
  deckActif,
  deckAJour,
  deckComplet,
  deckQuiTient,
  deckVide,
  decksAJour,
  decksVides,
  demarrer,
  disponibles,
  garderPossedees,
  garderPossedeesPartout,
  likesDeLaMain,
  lireDeck,
  lireDecks,
  mainCourante,
  mainPrecedente,
  melange,
  modifierDeck,
  prochaineMainDans,
  supprimerDeck,
  valeurParRarete,
  type EntreeDeck,
  type ValeurDeCarte,
} from './deck.ts'
import { RARETES_EMOJI } from './types.ts'

let echecs = 0
function verifier(quoi: string, vrai: boolean): void {
  if (!vrai) echecs += 1
  console.log(`  ${vrai ? 'ok  ' : 'ECHEC'}  ${quoi}`)
}

console.log('deck')
const ids = Array.from({ length: DECK.taille }, (_, i) => (0x1f600 + i).toString(16))
const S = (id: string): EntreeDeck => ({ id, v: 'simple' })
const H = (id: string): EntreeDeck => ({ id, v: 'holo' })
const simples = ids.map(S)
const T0 = 1_000_000
const cle = (m: readonly EntreeDeck[]): string => m.map((e) => `${e.id}#${e.v}`).join()
/** Un Like par carte, quel que soit le cran : la règle du départ, pour les comptes ronds. */
const UN: ValeurDeCarte = () => 1

// LA COMPOSITION
let d = deckVide()
for (const e of simples.slice(0, DECK.taille - 1)) d = basculerCarte(d, e, T0)
verifier('vingt-neuf cartes, le deck ne joue pas', d.cartes.length === DECK.taille - 1 && d.partie === null && !deckComplet(d))
verifier('pas de main sans partie', mainCourante(d).length === 0 && prochaineMainDans(d, T0) === null && mainPrecedente(d) === null)
d = basculerCarte(d, simples[DECK.taille - 1]!, T0)
verifier('la trentième lance la partie', deckComplet(d) && d.partie !== null && d.partie.depuis === T0 && d.partie.jouees === 0)
verifier('une trente-et-unième est refusée', basculerCarte(d, S('abcd'), T0) === d)
verifier('retirer une carte arrête la partie', basculerCarte(d, simples[3]!, T0 + 5).partie === null)
const remplace = basculerCarte(d, H(ids[3]!), T0 + 6)
verifier('une autre version du même emoji remplace la première : pas de double', remplace.cartes.length === DECK.taille && remplace.cartes.filter((e) => e.id === ids[3]).length === 1 && remplace.cartes.find((e) => e.id === ids[3])?.v === 'holo')
verifier('et relance la partie', remplace.partie?.depuis === T0 + 6)
verifier('la main courante fait cinq cartes du deck', mainCourante(d).length === DECK.main && mainCourante(d).every((e) => ids.includes(e.id)))
verifier('le mélange est seedé', cle(melange(simples, 42)) === cle(melange(simples, 42)) && cle(melange(simples, 42)) !== cle(melange(simples, 43)))
verifier('le mélange garde toutes les cartes', [...melange(ids, 7)].sort().join() === [...ids].sort().join())

// LE TEMPS QUI JOUE
verifier('rien avant la cadence', deckAJour(d, T0 + DECK.cadence - 1, UN).mains === 0)
const une = deckAJour(d, T0 + DECK.cadence, UN)
verifier('une main à la cadence', une.mains === 1 && une.likes === DECK.main && une.derniere?.length === DECK.main)
verifier('la main jouée était la main courante', cle(une.derniere!) === cle(mainCourante(d)))
verifier('la main précédente du deck à jour est celle-là', cle(mainPrecedente(une.deck)!) === cle(une.derniere!))
verifier('cinq cartes jouées, la cadence repart de la main', une.deck.partie?.jouees === DECK.main && une.deck.partie?.depuis === T0 + DECK.cadence)
verifier('la prochaine main est à une cadence de là', prochaineMainDans(une.deck, T0 + DECK.cadence + 3000) === DECK.cadence - 3000)
const parCycle = DECK.taille / DECK.main
const cycle = deckAJour(d, T0 + DECK.cadence * parCycle, UN)
verifier('un cycle entier vide le deck et le remélange', cycle.mains === parCycle && cycle.deck.partie?.jouees === 0 && cycle.deck.partie?.graine !== d.partie?.graine)
verifier('le cycle rapporte trente Likes', cycle.likes === DECK.taille)
const deuxEtDemi = deckAJour(d, T0 + DECK.cadence * (parCycle * 2 + 3) + 1234, UN)
verifier('deux cycles et trois mains', deuxEtDemi.mains === parCycle * 2 + 3 && deuxEtDemi.deck.partie?.jouees === 3 * DECK.main)
verifier('le reste de la cadence est gardé', deuxEtDemi.deck.partie?.depuis === T0 + DECK.cadence * (parCycle * 2 + 3))
verifier('jouer en deux fois ou en une donne pareil', deckAJour(une.deck, T0 + DECK.cadence * parCycle, UN).likes + une.likes === cycle.likes && deckAJour(une.deck, T0 + DECK.cadence * parCycle, UN).deck.partie?.graine === cycle.deck.partie?.graine)
const horsLigne = deckAJour(d, T0 + DECK.horsLigneMax * 3, UN)
verifier('hors ligne, au plus la limite', horsLigne.mains === DECK.horsLigneMax / DECK.cadence && horsLigne.deck.partie?.depuis === T0 + DECK.horsLigneMax * 3)
const recule = deckAJour(d, T0 - 5000, UN)
verifier('une horloge qui recule ne joue rien et repart', recule.mains === 0 && recule.deck.partie?.depuis === T0 - 5000)
verifier('à un Like par carte, une main de trois vaut trois', likesDeLaMain([S('a'), S('b'), H('c')], UN) === 3)

// LA VALEUR PAR CRAN (Keko : « +1 like par niveau de rareté »)
const parCran = valeurParRarete((id) => (id === 'c' ? 'commun' : id === 'l' ? 'legendaire' : id === 'r' ? 'rare' : undefined))
verifier('une commune vaut un Like, une légendaire cinq', parCran(S('c')) === DECK.likesCommun && parCran(S('l')) === DECK.likesCommun + (RARETES_EMOJI.length - 1) * DECK.likesParCran)
verifier('la version ne compte pas', parCran(H('r')) === parCran(S('r')) && parCran(S('r')) === DECK.likesCommun + 2 * DECK.likesParCran)
verifier('un cran inconnu vaut une commune', parCran(S('?')) === DECK.likesCommun)
const avecNiveau = valeurParRarete((id) => (id === 'r' ? 'rare' : undefined), (id) => (id === 'r' ? 4 : 1))
verifier('chaque niveau au-delà du premier ajoute un Like', avecNiveau(S('r')) === parCran(S('r')) + 3 * DECK.likesParNiveau && avecNiveau(S('c')) === parCran(S('c')))
verifier('la main somme ses cartes', likesDeLaMain([S('c'), S('r'), H('l')], parCran) === 1 + 3 + 5)
verifier('le temps joue avec la valeur injectée', deckAJour(d, T0 + DECK.cadence, () => 4).likes === DECK.main * 4)

// LA POSSESSION
const sansDeux = garderPossedees(d, (e) => e.id !== ids[0] && e.id !== ids[1], T0)
verifier('une carte perdue quitte le deck, qui s’arrête', sansDeux.cartes.length === DECK.taille - 2 && sansDeux.partie === null)
verifier('rien perdu, le même deck', garderPossedees(d, () => true, T0) === d)
verifier('démarrer un deck qui joue ne change rien', demarrer(d, T0 + 99) === d)

// LA RELECTURE
const tous = (): boolean => true
const relu = lireDeck(JSON.parse(JSON.stringify(une.deck)), tous, T0 + 50_000)
verifier('un deck gardé se relit tel quel', cle(relu.cartes) === cle(une.deck.cartes) && relu.partie?.graine === une.deck.partie?.graine && relu.partie?.jouees === une.deck.partie?.jouees && relu.partie?.depuis === une.deck.partie?.depuis)
verifier('abîmé, il repart vide', lireDeck('n’importe quoi', tous, T0).cartes.length === 0 && lireDeck({ cartes: 'x' }, tous, T0).partie === null)
const sansPossession = lireDeck({ cartes: simples, partie: une.deck.partie }, (e) => e.id !== ids[5], T0)
verifier('une carte qu’on ne possède plus est écartée, la partie tombe', sansPossession.cartes.length === DECK.taille - 1 && sansPossession.partie === null)
verifier('un doublon d’emoji est écarté, même d’une autre version', lireDeck({ cartes: [...simples.slice(0, 29), H(ids[0]!)] }, tous, T0).cartes.length === 29)
verifier('les identifiants seuls d’avant se relisent en version normale', lireDeck({ cartes: ids }, tous, T0 + 7).cartes.every((e) => e.v === 'simple'))
verifier('une version inconnue est écartée', lireDeck({ cartes: [{ id: ids[0], v: 'doré' }] }, tous, T0).cartes.length === 0)
verifier('un deck complet sans partie en reçoit une', lireDeck({ cartes: ids }, tous, T0 + 7).partie?.depuis === T0 + 7)
verifier('une partie abîmée repart neuve', lireDeck({ cartes: ids, partie: { graine: 1, jouees: 7, depuis: T0 } }, tous, T0 + 9).partie?.depuis === T0 + 9)

// PLUSIEURS DECKS, UN SEUL QUI JOUE
/** On possède un exemplaire normal de chaque emoji, et un holo du premier. */
const compte = (id: string, v: string): number => (ids.includes(id) ? (v === 'simple' ? 1 : v === 'holo' && id === ids[0] ? 1 : 0) : 0)
let ds = decksVides()
verifier('un deck vide au départ, actif', ds.liste.length === 1 && ds.actif === 0 && deckActif(ds).cartes.length === 0)
ds = ajouterDeck(ds)
verifier('un deck de plus, l’actif reste le premier', ds.liste.length === 2 && ds.actif === 0)
for (const e of simples) ds = basculerDansDeck(ds, 1, e, compte, T0)
verifier('le second est complet mais ne joue pas : il n’est pas l’actif', deckComplet(ds.liste[1]!) && ds.liste[1]!.partie === null)
verifier('rien ne tombe tant que l’actif est vide', decksAJour(ds, T0 + DECK.cadence * 3, UN).mains === 0)
verifier('un exemplaire pris par le deck 2 n’est plus disponible au deck 1', disponibles(ds, 0, ids[4]!, 'simple', compte) === 0 && deckQuiTient(ds, 0, ids[4]!, 'simple') === 1)
verifier('mais il reste disponible au deck qui le tient', disponibles(ds, 1, ids[4]!, 'simple', compte) === 1)
verifier('le holo du premier emoji, lui, est libre', disponibles(ds, 0, ids[0]!, 'holo', compte) === 1 && deckQuiTient(ds, 0, ids[0]!, 'holo') === null)
const vole = basculerDansDeck(ds, 0, simples[4]!, compte, T0)
verifier('le deck 1 prend l’exemplaire au deck 2, qui devient incomplet', vole.liste[0]!.cartes.length === 1 && vole.liste[1]!.cartes.length === DECK.taille - 1 && !deckComplet(vole.liste[1]!))
const avecHolo = basculerDansDeck(ds, 0, H(ids[0]!), compte, T0)
verifier('il peut prendre le holo libre', avecHolo.liste[0]!.cartes.length === 1 && avecHolo.liste[0]!.cartes[0]!.v === 'holo')
verifier('retirer est toujours possible', basculerDansDeck(avecHolo, 0, H(ids[0]!), compte, T0).liste[0]!.cartes.length === 0)
ds = choisirDeck(ds, 1, T0 + 100)
verifier('choisir le second le lance', ds.actif === 1 && ds.liste[1]!.partie?.depuis === T0 + 100)
verifier('le choisir encore ne change rien', choisirDeck(ds, 1, T0 + 999) === ds)
const tombe = decksAJour(ds, T0 + 100 + DECK.cadence, UN)
verifier('l’actif joue', tombe.mains === 1 && tombe.likes === DECK.main && tombe.decks.liste[1]!.partie?.jouees === DECK.main && tombe.decks.liste[0] === ds.liste[0])
/** Deux exemplaires normaux de chaque : les deux decks peuvent être pleins. */
const deuxChacun = (id: string, v: string): number => (ids.includes(id) && v === 'simple' ? 2 : 0)
for (const e of simples) ds = basculerDansDeck(ds, 0, e, deuxChacun, T0)
verifier('compléter un deck non actif ne le lance pas', deckComplet(ds.liste[0]!) && ds.liste[0]!.partie === null)
const bascule = choisirDeck(ds, 0, T0 + 500)
verifier('changer de deck arrête l’ancien et lance le nouveau', bascule.actif === 0 && bascule.liste[0]!.partie?.depuis === T0 + 500 && bascule.liste[1]!.partie === null)
const sansActif = supprimerDeck(bascule, 0, T0 + 600)
verifier('supprimer l’actif : le premier restant prend sa place et joue', sansActif.liste.length === 1 && sansActif.actif === 0 && sansActif.liste[0]!.partie?.depuis === T0 + 600)
verifier('on ne supprime pas le dernier deck', supprimerDeck(sansActif, 0, T0) === sansActif)
const trois = ajouterDeck(ajouterDeck(bascule))
verifier('supprimer avant l’actif décale l’index', supprimerDeck(choisirDeck(trois, 2, T0), 0, T0).actif === 1)
let plein = decksVides()
for (let i = 0; i < DECKS_MAX + 2; i++) plein = ajouterDeck(plein)
verifier('au plus DECKS_MAX decks', plein.liste.length === DECKS_MAX)
verifier('trois decks au plus (Keko)', DECKS_MAX === 3)
// UNE SAUVEGARDE QUI DÉPASSE LE PLAFOND (il a baissé) garde ses decks, sans pouvoir en ajouter.
const nLus = Math.max(DECKS_MAX, DECKS_LUS_MAX)
const auPlafond = lireDecks({ liste: Array.from({ length: nLus }, () => ({ cartes: [] })), actif: nLus - 1 }, deuxChacun, T0)
verifier('tous les decks relus restent', auPlafond.liste.length === nLus && auPlafond.actif === nLus - 1)
verifier('au plafond, plus d’ajout', ajouterDeck(auPlafond) === auPlafond)
const perdu = garderPossedeesPartout(bascule, (id, v) => (id === ids[2] ? 0 : deuxChacun(id, v)), T0)
verifier('une carte perdue quitte tous les decks', perdu.liste.every((d) => d.cartes.length === DECK.taille - 1 && d.partie === null))
const unSeul = garderPossedeesPartout(bascule, compte, T0)
verifier('un seul exemplaire possédé : le second deck le perd, le premier le garde', unSeul.liste[0]!.cartes.length === DECK.taille && unSeul.liste[1]!.cartes.length === 0)
verifier('modifierDeck hors de l’actif ne laisse pas de partie', modifierDeck(bascule, 1, (d) => ({ ...d, partie: { graine: 1, jouees: 0, depuis: 0 } })).liste[1]!.partie === null)
const relus = lireDecks(JSON.parse(JSON.stringify(bascule)), deuxChacun, T0)
verifier('les decks gardés se relisent', relus.actif === 0 && relus.liste.length === 2 && relus.liste[0]!.partie?.depuis === T0 + 500 && relus.liste[1]!.partie === null && relus.liste[1]!.cartes.length === DECK.taille)
verifier('à la relecture, jamais plus d’exemplaires en jeu que possédés', lireDecks(JSON.parse(JSON.stringify(bascule)), compte, T0).liste[1]!.cartes.length === 0)
const ancien = lireDecks({ cartes: ids, partie: { graine: 3, jouees: DECK.main, depuis: T0 } }, compte, T0)
verifier('un deck seul d’avant devient le premier et l’actif, en versions normales', ancien.liste.length === 1 && ancien.actif === 0 && ancien.liste[0]!.partie?.graine === 3 && ancien.liste[0]!.cartes.every((e) => e.v === 'simple'))
verifier('n’importe quoi : un deck vide', lireDecks(42, compte, T0).liste.length === 1)
const relusActifFaux = lireDecks({ liste: [{ cartes: ids, partie: { graine: 1, jouees: 0, depuis: T0 } }, { cartes: [] }], actif: 7 }, compte, T0)
verifier('un actif hors liste retombe sur le premier', relusActifFaux.actif === 0 && relusActifFaux.liste[0]!.partie !== null)

console.log(echecs === 0 ? 'Tout passe.' : `${echecs} echec(s).`)
if (echecs > 0) throw new Error(`${echecs} verification(s) en echec`)

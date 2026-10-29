// LA VÉRIF DES LIEUX : `node src/logic/emoji/lieux.verif.ts` — sans navigateur.
import { FENETRE, IDS_LIEUX, LIEUX, avecOr, estOuvert, lieuDe, lieuxNeufs, lireLieux, nombreCourt, orDuPalier, ouvrirLeLieu, palierDe, remiseDans, remplirLaJauge, valeurDansLeLieu } from './lieux.ts'
import { DECKS_MAX, type EntreeDeck } from './deck.ts'
import type { RoleCarte } from './types.ts'

let echecs = 0
function verifier(quoi: string, vrai: boolean): void {
  if (!vrai) echecs += 1
  console.log(`  ${vrai ? 'ok  ' : 'ECHEC'}  ${quoi}`)
}

console.log('lieux')
const taverne = lieuDe('taverne')!
const mine = lieuDe('mine')!
verifier('les nombres en court', [0, 999, 1000, 1250, 9999, 12345, 999999, 1000000, 2560000, 50000000].map(nombreCourt).join(' ') === '0 999 1k 1,2k 9,9k 12k 999k 1M 2,5M 50M')
verifier('trois lieux, un par deck (Keko)', LIEUX.length === 3 && LIEUX.length === DECKS_MAX && new Set(IDS_LIEUX).size === 3)
const neuf = lieuxNeufs()
verifier('au départ : la Taverne seule ouverte, pas d’or', neuf.or === 0 && neuf.ouverts.join() === 'taverne' && estOuvert(neuf, 'taverne') && !estOuvert(neuf, 'mine'))

// LA JAUGE — à dix minutes d'une heure pleine.
const T = 500_000 * FENETRE + 10 * 60 * 1000
const un = remplirLaJauge(neuf, 'taverne', 40, T)
verifier('de la puissance remplit la jauge, sans or tant qu’elle n’est pas pleine', un.etat.jauges.taverne === 40 && un.or === 0 && un.etat.or === 0)
const plein = remplirLaJauge(un.etat, 'taverne', taverne.jauge - 40 + 7, T)
verifier('pleine, elle rend son or et garde ce qui dépasse', plein.or === taverne.or && plein.pleines === 1 && plein.etat.or === taverne.or && plein.etat.jauges.taverne === 7)
const trois = remplirLaJauge(neuf, 'taverne', taverne.jauge * 3 + 1, T)
verifier('plusieurs jauges d’un coup : chacune à son palier', trois.pleines === 3 && trois.or === orDuPalier(taverne, 0) + orDuPalier(taverne, 1) + orDuPalier(taverne, 2) && trois.etat.jauges.taverne === 1)

// LES PALIERS DE L'HEURE
verifier('chaque palier rend plus que le précédent', orDuPalier(taverne, 1) > orDuPalier(taverne, 0) && orDuPalier(taverne, 0) === taverne.or)
verifier('trois jauges : palier 3 dans l’heure', palierDe(trois.etat, 'taverne', T) === 3)
const quatre = remplirLaJauge(trois.etat, 'taverne', taverne.jauge, T + 1000)
verifier('la suivante dans la même heure rend le palier 4', quatre.or === orDuPalier(taverne, 3) && palierDe(quatre.etat, 'taverne', T) === 4)
const apres = T + remiseDans(T)
verifier('l’heure pleine remet les paliers à zéro', remiseDans(T) === FENETRE - 10 * 60 * 1000 && palierDe(quatre.etat, 'taverne', apres) === 0)
const neuve = remplirLaJauge(quatre.etat, 'taverne', taverne.jauge, apres)
verifier('dans l’heure neuve, on repart du premier palier', neuve.or === taverne.or && palierDe(neuve.etat, 'taverne', apres) === 1)
verifier('un lieu à part a ses propres paliers', palierDe(quatre.etat, 'mine', T) === 0)
verifier('un lieu fermé ne prend rien', remplirLaJauge(neuf, 'mine', 500, T).etat === neuf)
verifier('un lieu inconnu, une puissance nulle : rien', remplirLaJauge(neuf, 'lune', 50, T).etat === neuf && remplirLaJauge(neuf, 'taverne', 0, T).etat === neuf)

// L'ACHAT
const pauvre = avecOr(neuf, mine.prix - 1)
verifier('trop pauvre : le lieu reste fermé', ouvrirLeLieu(pauvre, 'mine') === pauvre)
const riche = avecOr(neuf, mine.prix + 5)
const achete = ouvrirLeLieu(riche, 'mine')
verifier('acheté : ouvert, payé', estOuvert(achete, 'mine') && achete.or === 5)
verifier('déjà ouvert : rien ne change', ouvrirLeLieu(achete, 'mine') === achete)
verifier('les lieux ouverts restent dans l’ordre du jeu', ouvrirLeLieu(avecOr(achete, 999), 'arene').ouverts.join() === 'taverne,mine,arene')
verifier('l’or se pose entier, jamais négatif', avecOr(neuf, -4).or === 0 && avecOr(neuf, 12.7).or === 12)

// LE BONUS DU LIEU
const roles: Record<string, RoleCarte> = { a: 'soutien', b: 'melee' }
const base = (): number => 2
const S = (id: string): EntreeDeck => ({ id, v: 'simple' })
const aLaMine = valeurDansLeLieu(base, (id) => roles[id], mine)
verifier('la Mine ajoute son bonus aux soutiens seulement', aLaMine(S('a')) === 2 + mine.bonus!.plus && aLaMine(S('b')) === 2 && aLaMine(S('?')) === 2)
verifier('la Taverne n’ajoute rien', valeurDansLeLieu(base, (id) => roles[id], taverne) === base)

// LA RELECTURE
const relu = lireLieux(JSON.parse(JSON.stringify(plein.etat)))
verifier('l’état gardé se relit', relu.or === plein.etat.or && relu.ouverts.join() === 'taverne' && relu.jauges.taverne === 7)
verifier('abîmé, il repart neuf', lireLieux('x').ouverts.join() === 'taverne' && lireLieux(null).or === 0)
verifier('la Taverne est toujours ouverte, un lieu inconnu est écarté', lireLieux({ ouverts: ['arene', 'lune'] }).ouverts.join() === 'taverne,arene')
const reluP = lireLieux(JSON.parse(JSON.stringify(quatre.etat)))
verifier('les paliers se relisent', palierDe(reluP, 'taverne', T) === 4)
verifier('un palier abîmé est écarté', Object.keys(lireLieux({ paliers: { taverne: { fenetre: 'x', n: 2 }, mine: { fenetre: 3, n: -1 } } }).paliers).length === 0)
verifier('une jauge relue reste sous son plein', lireLieux({ jauges: { taverne: 9999 } }).jauges.taverne === taverne.jauge - 1)

console.log(echecs === 0 ? 'Tout passe.' : `${echecs} echec(s).`)
if (echecs > 0) throw new Error(`${echecs} verification(s) en echec`)

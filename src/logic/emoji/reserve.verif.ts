/**
 * Vérifications de la réserve de paquets, sans navigateur et sans attendre :
 * le temps est injecté.
 */
import { RESERVE, lireReserve, prendreUnPaquet, prochainDans, reserveAJour, reservePleine } from './reserve.ts'

let echecs = 0
function verifier(quoi: string, vrai: boolean): void {
  if (!vrai) echecs += 1
  console.log(`  ${vrai ? 'ok  ' : 'ECHEC'}  ${quoi}`)
}

console.log('réserve de paquets')
const I = RESERVE.intervalle
const t0 = 1_000_000
const pleine = reservePleine(t0)
verifier('on commence plein', pleine.paquets === RESERVE.max)
verifier('pleine, pas de prochain', prochainDans(pleine, t0) === null)

const un = prendreUnPaquet(pleine, t0)!
verifier('prendre en retire un', un.paquets === RESERVE.max - 1)
verifier('la recharge part de la prise', prochainDans(un, t0) === I)
verifier('à mi-chemin, rien de plus', reserveAJour(un, t0 + I / 2).paquets === RESERVE.max - 1)
verifier('à dix minutes, un de plus', reserveAJour(un, t0 + I).paquets === RESERVE.max)

let r = pleine
for (let i = 0; i < RESERVE.max; i++) r = prendreUnPaquet(r, t0 + i)!
verifier('vidée', r.paquets === 0)
verifier('vide, on ne prend rien', prendreUnPaquet(r, t0 + RESERVE.max) === null)
const apres25 = reserveAJour(r, t0 + 25 * 60 * 1000)
verifier('25 minutes rendent deux paquets', apres25.paquets === 2)
verifier('et la troisième est à 5 minutes', prochainDans(apres25, t0 + 25 * 60 * 1000) === 5 * 60 * 1000)
verifier('une longue absence remplit, sans déborder', reserveAJour(r, t0 + 1000 * I).paquets === RESERVE.max)
verifier("une horloge qui recule ne retire rien", reserveAJour(r, t0 - I).paquets === 0)
const relue = lireReserve(JSON.parse(JSON.stringify(apres25)), t0)
verifier('aller-retour JSON', relue.paquets === apres25.paquets && relue.depuis === apres25.depuis)
verifier("n'importe quoi repart plein", lireReserve('x', t0).paquets === RESERVE.max)
verifier('un nombre négatif repart plein', lireReserve({ paquets: -1, depuis: 0 }, t0).paquets === RESERVE.max)

console.log(echecs === 0 ? 'Tout passe.' : `${echecs} echec(s).`)
if (echecs > 0) throw new Error(`${echecs} verification(s) en echec`)

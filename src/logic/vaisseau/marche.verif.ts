/**
 * Vérifications du marché des minerais, sans navigateur.
 */
import { annulerLOrdre, coursA, coursAuPas, gainDe, historiqueDe, lireMarche, MARCHE, marcheNeuf, ordreDe, pasDe, poserUnOrdre, prixPlafond, reglerLeMarche, vendreAuCours } from './marche.ts'
import { FICHES_MINERAI } from './hangar.ts'
import { MINERAIS } from './jeu.ts'

let echecs = 0
function verifier(quoi: string, vrai: boolean): void {
  if (!vrai) echecs += 1
  console.log(`  ${vrai ? 'ok  ' : 'ECHEC'}  ${quoi}`)
}

console.log('marche')
const T0 = 1_800_000_000_000
const PAS = MARCHE.pas
const mille = Array.from({ length: 2000 }, (_, i) => i + pasDe(T0))
verifier('le cours est une fonction du temps : le même instant, le même prix ; il ne change qu’au pas', MINERAIS.every((k) => coursA(k, T0) === coursA(k, T0) && coursA(k, pasDe(T0) * PAS) === coursA(k, pasDe(T0) * PAS + PAS - 1)))
verifier('le cours bouge, reste au dixième, autour de son prix de base, et sous le plafond d’un ordre', MINERAIS.every((k) => {
  const prix = mille.map((p) => coursAuPas(k, p))
  const base = FICHES_MINERAI[k].credits
  const moyenne = prix.reduce((a, b) => a + b, 0) / prix.length
  return new Set(prix).size > 5 && prix.every((x) => Math.abs(x * 10 - Math.round(x * 10)) < 1e-9 && x >= 0.1 && x <= prixPlafond(k)) && Math.abs(moyenne / base - 1) < 0.1 && Math.max(...prix) > base * 1.15 && Math.min(...prix) < base * 0.85
}))
verifier('les trois minerais n’ont pas la même courbe', mille.some((p) => coursAuPas('fer', p) / 2 !== coursAuPas('or', p) / 8))
const h = historiqueDe('or', T0)
verifier('la courbe : tant de points, le dernier est le cours du moment, l’avant-dernier celui du pas d’avant', h.length === MARCHE.historique && h[h.length - 1] === coursA('or', T0) && h[h.length - 2] === coursA('or', T0 - PAS))
verifier('un gain est entier, arrondi vers le bas', gainDe(3, 2.5) === 7 && gainDe(10, 2.4) === 24 && gainDe(1, 0.9) === 0)

const tresor = { fer: 50, or: 10, cristal: 0 }
const v = vendreAuCours(tresor, 100, 'fer', 20, T0)!
verifier('vendre au cours : la quantité quitte le trésor, les crédits prennent le gain au prix du moment ; le trésor d’avant ne bouge pas', v !== null && v.tresor.fer === 30 && v.credits === 100 + gainDe(20, coursA('fer', T0)) && tresor.fer === 50)
verifier('on ne vend ni zéro, ni plus qu’on a, ni une fraction', vendreAuCours(tresor, 0, 'fer', 0, T0) === null && vendreAuCours(tresor, 0, 'fer', 51, T0) === null && vendreAuCours(tresor, 0, 'cristal', 1, T0) === null && vendreAuCours(tresor, 0, 'fer', 2.5, T0) === null)

// UN ORDRE : réservé, réglé au prix fixé quand le cours l'atteint
const m0 = marcheNeuf(T0)
const haut = Math.max(...mille.slice(0, 600).map((p) => coursAuPas('fer', p)))
const quand = mille.find((p) => coursAuPas('fer', p) >= haut)! // le premier pas où le cours touche ce prix
const pose = poserUnOrdre(m0, tresor, 'fer', 20, haut, T0)!
verifier('poser un ordre : le minerai quitte le trésor, l’ordre attend', pose !== null && pose.tresor.fer === 30 && ordreDe(pose.marche, 'fer')!.quantite === 20 && ordreDe(pose.marche, 'fer')!.prix === haut)
verifier('un seul ordre par minerai ; un prix au-dessus du plafond est refusé', poserUnOrdre(pose.marche, pose.tresor, 'fer', 5, haut, T0) === null && poserUnOrdre(m0, tresor, 'fer', 5, prixPlafond('fer') + 0.1, T0) === null && poserUnOrdre(m0, tresor, 'or', 11, 8, T0) === null)
const avant = reglerLeMarche(pose.marche, 0, (quand - 1) * PAS + 5)
verifier('tant que le cours n’a pas atteint le prix, l’ordre attend', quand > pasDe(T0) ? avant.vendus.length === 0 && avant.credits === 0 && ordreDe(avant.marche, 'fer') !== undefined : true)
const apres = reglerLeMarche(avant.marche, 0, quand * PAS + 5)
verifier('au pas où le cours l’atteint, l’ordre se règle AU PRIX FIXÉ et s’en va', apres.vendus.length === 1 && apres.credits === gainDe(20, haut) && ordreDe(apres.marche, 'fer') === undefined)
const dUnCoup = reglerLeMarche(pose.marche, 0, (quand + 500) * PAS)
verifier('appareil éteint : réglé pareil en un seul regard, bien plus tard', dUnCoup.vendus.length === 1 && dUnCoup.credits === gainDe(20, haut))
verifier('régler deux fois ne paie pas deux fois', reglerLeMarche(apres.marche, apres.credits, (quand + 900) * PAS).credits === apres.credits)
const bas = poserUnOrdre(m0, tresor, 'fer', 10, 0.1, T0)!
verifier('un ordre posé sous le cours se règle au regard suivant, à son prix', reglerLeMarche(bas.marche, 0, T0 + 1).vendus.length === 1 && reglerLeMarche(bas.marche, 0, T0 + 1).credits === gainDe(10, 0.1))
const annule = annulerLOrdre(pose.marche, pose.tresor, 'fer')
verifier('annuler : les pépites reviennent, l’ordre s’en va ; sans ordre, rien ne change', annule.tresor.fer === 50 && ordreDe(annule.marche, 'fer') === undefined && annulerLOrdre(m0, tresor, 'or').tresor === tresor)

const relu = lireMarche({ vuA: T0 - 5, ordres: [{ minerai: 'fer', quantite: 4, prix: 2.26, poseA: T0 - 9 }, { minerai: 'fer', quantite: 1, prix: 2 }, { minerai: 'bois', quantite: 1, prix: 2 }, { minerai: 'or', quantite: -1, prix: 8 }, { minerai: 'cristal', quantite: 2, prix: 999 }, null] }, T0)
verifier('un marché relu sans confiance : des ordres bien formés, un par minerai, le prix au dixième', relu.ordres.length === 1 && relu.ordres[0].prix === 2.3 && relu.vuA === T0 - 5 && lireMarche(null, T0).ordres.length === 0 && lireMarche({ vuA: T0 + 1e9 }, T0).vuA === T0)

if (echecs > 0) throw new Error(`${echecs} verification(s) en echec`)
console.log('Tout passe.')

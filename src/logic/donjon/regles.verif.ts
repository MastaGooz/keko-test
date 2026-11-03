/**
 * Vérifications du donjon coopératif, sans navigateur et sans attendre : le
 * temps est injecté.
 */
import { DONJON } from './config.ts'
import { nomDeLEnnemi, pvDeLEtage } from './ennemi.ts'
import { changerDeVitesse, nouvelleHorloge, tempsDeJeu } from './horloge.ts'
import { appliquer, autoCritique, avancer, chanceCritDe, degatsDuCoupAuto, degatsDuTap, dpsDe, bornesDeLaForme, dpsDeSpam, etatInitial, periodeEnRecharges, multCritDe as forceDe, facteurCritMoyen, formeA, multCritDe, multiplicateurDeForme, periodeDe, reposMaxDe, degatsDuCoupAutoA } from './regles.ts'
import { simulerSaison } from './simulation.ts'
import type { EtatDonjon } from './types.ts'

let echecs = 0
function verifier(quoi: string, vrai: boolean): void {
  if (!vrai) echecs += 1
  console.log(`  ${vrai ? 'ok  ' : 'ECHEC'}  ${quoi}`)
}

const C = DONJON
const H = 3_600_000

console.log('donjon coopératif')

verifier('même saison, même étage, même nom', nomDeLEnnemi(5, 12) === nomDeLEnnemi(5, 12))
verifier('deux étages, deux noms', nomDeLEnnemi(5, 12) !== nomDeLEnnemi(5, 13))
verifier('les PV montent avec l\'étage', pvDeLEtage(C, 2) > pvDeLEtage(C, 1))

let e: EtatDonjon = etatInitial(C, 1, 0)
e = appliquer(C, e, { joueur: 'a', t: 0, type: 'rejoindre', nom: 'A', bot: null })
e = appliquer(C, e, { joueur: 'a', t: 0, type: 'rejoindre', nom: 'A', bot: null })
verifier('rejoindre deux fois ne double pas', e.joueurs.length === 1)

const pv0 = e.ennemi.pv
const e1 = appliquer(C, e, { joueur: 'a', t: 1000, type: 'taper', n: 1 })
verifier('un tap blesse l\'ennemi', e1.ennemi.pv < pv0)
verifier('un tap donne de l\'XP', e1.joueurs[0].xp > 0 || e1.joueurs[0].niveau > 1)
verifier('le réducteur ne touche pas l\'état reçu', e.ennemi.pv === pv0)

/** `n` taps, un à chaque fin de recharge, à partir de t0. */
function taperSuite(x: EtatDonjon, n: number, t0: number): EtatDonjon {
  for (let k = 0; k < n; k++) x = appliquer(C, x, { joueur: 'a', t: t0 + k * C.tap.recharge, type: 'taper', n: 1 })
  return x
}
const R = C.tap.recharge
const deux = appliquer(C, e1, { joueur: 'a', t: 1000 + R / 2, type: 'taper', n: 1 })
verifier('pendant la recharge, un tap ne fait rien', deux.joueurs[0].degatsTap === e1.joueurs[0].degatsTap)
const recharge = appliquer(C, e1, { joueur: 'a', t: 1000 + R, type: 'taper', n: 1 })
verifier('rechargé, il frappe', recharge.joueurs[0].degatsTap > e1.joueurs[0].degatsTap)
const enRafale = appliquer(C, e, { joueur: 'a', t: 1000, type: 'taper', n: 50 })
verifier('une action de 50 taps n\'en frappe qu\'un', enRafale.joueurs[0].degatsTap === e1.joueurs[0].degatsTap)

const tue = taperSuite(e, 30, 1000)
verifier('assez de taps achèvent l\'ennemi', tue.ennemi.etage > 1 && tue.joueurs[0].kills >= 1)
verifier('le coup fatal donne un point', tue.joueurs[0].points >= 1)

const achete = appliquer(C, tue, { joueur: 'a', t: tue.t, type: 'acheter', quoi: 'auto' })
verifier('acheter l\'auto-tap le rend plus rapide', periodeDe(C, achete.joueurs[0]) < periodeDe(C, tue.joueurs[0]) && dpsDe(C, achete.joueurs[0]) > dpsDe(C, tue.joueurs[0]))
const sansPoints = { ...achete, joueurs: achete.joueurs.map((j) => ({ ...j, points: 0 })) }
verifier('sans points, rien ne s\'achète', appliquer(C, sansPoints, { joueur: 'a', t: sansPoints.t, type: 'acheter', quoi: 'tap' }).joueurs[0].ameliorations.tap === 0)

const P = periodeDe(C, e.joueurs[0])
verifier(`l'auto part à ${C.auto.depart} recharges du tap`, periodeDe(C, e.joueurs[0]) === C.tap.recharge * C.auto.depart)
const auRang = (r: number) => ({ ...e.joueurs[0], ameliorations: { ...e.joueurs[0].ameliorations, auto: r } })
const gains = [0, 1, 10, 20].map((r) => periodeEnRecharges(C, auRang(r)) - periodeEnRecharges(C, auRang(r + 1)))
verifier('chaque rang rapproche l\'auto du tap, de moins en moins', gains.every((g, i) => g > 0 && (i === 0 || g < gains[i - 1])))
verifier('l\'auto n\'est jamais plus rapide que le tap, même au rang 500', [50, 200, 500].every((r) => periodeDe(C, auRang(r)) > C.tap.recharge))
// TOUTES LES AMÉLIORATIONS RENDENT DE MOINS EN MOINS.
type Piste = 'tap' | 'chanceCrit' | 'multCrit'
const rang = (quoi: Piste, r: number) => ({ ...e.joueurs[0], ameliorations: { ...e.joueurs[0].ameliorations, [quoi]: r } })
const decroit = (f: (r: number) => number) => {
  const pas = [0, 1, 5, 20, 60].map((r) => f(r + 1) - f(r))
  return pas.every((g, i) => g > 0 && (i === 0 || g < pas[i - 1]))
}
verifier('le Coup rend de moins en moins', decroit((r) => degatsDuTap(C, rang('tap', r))))
verifier('la Critique rend de moins en moins', decroit((r) => chanceCritDe(C, rang('chanceCrit', r))))
verifier('la Force rend de moins en moins', decroit((r) => forceDe(C, rang('multCrit', r))))
verifier('la Critique n\'atteint jamais 100 %', [100, 1000].every((r) => chanceCritDe(C, rang('chanceCrit', r)) < 1))
verifier('le Coup et la Force n\'ont pas de plafond', degatsDuTap(C, rang('tap', 1000)) > 2 * degatsDuTap(C, rang('tap', 300)) && forceDe(C, rang('multCrit', 1000)) > 1.5 * forceDe(C, rang('multCrit', 300)))
verifier('l\'auto frappe dès le début, sans rien acheter', avancer(C, e, 10 * P).joueurs[0].degatsAuto > 0)
verifier('l\'auto frappe par coups : rien avant le premier', avancer(C, e, P - 1).joueurs[0].degatsAuto === 0 && avancer(C, e, P).joueurs[0].degatsAuto > 0)
const epuise = { ...e, joueurs: e.joueurs.map((j) => ({ ...j, forme: bornesDeLaForme(C).min })) }
verifier('l\'auto ignore la forme', avancer(C, epuise, 20 * P).joueurs[0].degatsAuto === avancer(C, e, 20 * P).joueurs[0].degatsAuto)
const ja = e.joueurs[0]
verifier('un coup d\'auto frappe exactement comme un tap', degatsDuCoupAuto(C, ja) === degatsDuTap(C, ja))
const critiques = Array.from({ length: 4000 }, (_, k) => autoCritique(C, e.saison.seed, (k + 1) * P, ja)).filter(Boolean).length
verifier('l\'auto peut être critique, à la bonne fréquence', Math.abs(critiques / 4000 - chanceCritDe(C, ja)) < 0.015)
verifier('un coup d\'auto critique est une fonction du coup', autoCritique(C, e.saison.seed, 77 * P, ja) === autoCritique(C, e.saison.seed, 77 * P, ja))
const k = Array.from({ length: 50 }, (_, i) => i + 1).find((i) => autoCritique(C, e.saison.seed, i * P, ja))!
const solide = { ...e, ennemi: { ...e.ennemi, pv: 1e9, pvMax: 1e9 } }
const avantCrit = avancer(C, solide, (k - 1) * P).joueurs[0].degatsAuto
const apresCrit = avancer(C, solide, k * P).joueurs[0].degatsAuto
const coupCritique = apresCrit - avantCrit
verifier('le coup critique de l\'auto porte le multiplicateur', Math.abs(coupCritique - degatsDuCoupAutoA(C, e.saison.seed, k * P, ja)) < 1e-9 && coupCritique >= degatsDuCoupAuto(C, ja) * (1 - C.tap.ecart) * multCritDe(C, ja) - 0.5)
// LA PLAGE DE DÉGÂTS : chaque coup varie autour de sa valeur, la moyenne reste.
const coupsAuto = Array.from({ length: 2000 }, (_, i) => degatsDuCoupAutoA(C, e.saison.seed, (i + 1) * P, ja))
const normaux = coupsAuto.filter((_, i) => !autoCritique(C, e.saison.seed, (i + 1) * P, ja))
const base = degatsDuCoupAuto(C, ja)
verifier('un coup d\'auto varie dans sa plage', normaux.every((d) => d >= base * (1 - C.tap.ecart) - 0.5 && d <= base * (1 + C.tap.ecart) + 0.5) && new Set(normaux).size >= 3)
verifier('chaque coup est un entier', coupsAuto.every((d) => Number.isInteger(d)))
verifier('la plage garde la moyenne', Math.abs(normaux.reduce((s, d) => s + d, 0) / normaux.length / base - 1) < 0.03)
const tapsVus = [1, 2, 3, 4, 5, 6, 7, 8].map((graine) => {
  let x = etatInitial(C, graine, 0)
  x = appliquer(C, x, { joueur: 'a', t: 0, type: 'rejoindre', nom: 'A', bot: null })
  return appliquer(C, x, { joueur: 'a', t: 1000, type: 'taper', n: 1 }).joueurs[0].degatsTap
})
verifier('un tap varie aussi, en entiers', new Set(tapsVus).size >= 2 && tapsVus.every((d) => Number.isInteger(d) && d >= base * (1 - C.tap.ecart) - 0.5))
const pvDeux = avancer(C, avancer(C, e, 7 * P + 300), 31 * P + 10)
verifier('l\'auto en deux fois = en une (coups)', pvDeux.ennemi.pv === avancer(C, e, 31 * P + 10).ennemi.pv)

const T0 = achete.t
const plusTard = avancer(C, achete, T0 + H)
verifier('l\'auto-tap frappe en l\'absence', plusTard.joueurs[0].degatsAuto > 0)
const enDeux = avancer(C, avancer(C, achete, T0 + H / 2), T0 + H)
verifier('avancer en deux fois = en une', Math.abs(enDeux.joueurs[0].degatsAuto - plusTard.joueurs[0].degatsAuto) < 1e-6 && enDeux.ennemi.etage === plusTard.ennemi.etage)
verifier('avancer ne recule pas', avancer(C, plusTard, 0) === plusTard)

// LA FORME : de 0 % à 200 %, un palier à 100 % autour du milieu, en minutes de spam.
const B =bornesDeLaForme(C)
const mf = (r: number) => multiplicateurDeForme(C, e.joueurs[0], r)
verifier('la forme va de 0 % à 200 %, avec un palier à 100 % autour du milieu', mf(B.min) === 0 && mf(B.palierBas) === 1 && mf(0) === 1 && mf(B.palierHaut) === 1 && mf(B.max) === 2)
verifier('le palier fait au moins le tiers du trait', (B.palierHaut - B.palierBas) / (B.max - B.min) >= 1 / 3 - 1e-9)
const neuf = e.joueurs[0]
verifier('un joueur neuf est pile au milieu', neuf.forme === 0)
verifier('sans rien faire, on ne passe pas tout de suite en repos', mf(formeA(C, neuf, H)) === 1 && formeA(C, neuf, H) > 0)
verifier('au repos, la forme monte jusqu\'à 200 %', mf(formeA(C, neuf, 8 * H)) === 2 && mf(formeA(C, neuf, 4 * H)) > 1 && mf(formeA(C, neuf, 4 * H)) < 2)
/** Un joueur qui tape à chaque fin de recharge pendant `duree` ms (le spam). */
const spammer = (duree: number) => taperSuite(e, Math.floor(duree / R) + 1, 1000)
const sage = spammer(45_000)
const fSage = formeA(C, sage.joueurs[0], 46_000)
verifier('45 s de spam : 100 %, le marqueur a glissé à gauche', mf(fSage) === 1 && fSage < 0)
const long = spammer(120_000)
const mLong = mf(formeA(C, long.joueurs[0], 121_000))
verifier('2 min de spam : la fatigue est là', mLong < 0.5 && mLong > 0.1)
verifier('un pas hors du blanc : 50 % côté fatigue, 150 % côté repos', Math.abs(mf(B.palierBas - 1e-6) - C.forme.entreeFatigue) < 1e-4 && Math.abs(mf(B.palierHaut + 1e-6) - C.forme.entreeRepos) < 1e-4)
const tapsParMinute = 60_000 / R
const minute = taperSuite(e, tapsParMinute, 1000)
const fm = formeA(C, minute.joueurs[0], 1000 + (tapsParMinute - 1) * R)
verifier('une minute de spam (un tap par recharge) use une minute de forme', fm < -0.6 && fm > -1.3)
const epuiseLa = { ...e, joueurs: e.joueurs.map((j) => ({ ...j, forme: B.min, formeA: 0 })) }
verifier('épuisé, on revient au milieu en une demi-heure', Math.abs(formeA(C, epuiseLa.joueurs[0], H / 2)) < 1e-9 && mf(formeA(C, epuiseLa.joueurs[0], H / 6)) < 1)
const repose = { ...e, joueurs: e.joueurs.map((j) => ({ ...j, forme: B.max, formeA: 0 })) }
const unTapRepose = appliquer(C, repose, { joueur: 'a', t: 0, type: 'taper', n: 1 })
verifier('le DPS du spammeur suit la recharge', Math.abs(dpsDeSpam(C, neuf) - (degatsDuTap(C, neuf) * facteurCritMoyen(C, neuf) * 1000) / R) < 1e-9)
const unTapNeuf = appliquer(C, e, { joueur: 'a', t: 0, type: 'taper', n: 1 })
const rapport = unTapRepose.joueurs[0].degatsTap / unTapNeuf.joueurs[0].degatsTap
verifier("reposé, un tap frappe double (à l'arrondi près)", Math.abs(rapport - 2) < 0.15)
// LES STATS DE LA FORME : l'intensité ou le temps hors jeu, jamais la durée d'une session.
const stat = (quoi: 'ardeur' | 'recuperation' | 'sommeil', r: number) => ({ ...neuf, ameliorations: { ...neuf.ameliorations, [quoi]: r } })
verifier('Ardeur : le haut du repos monte, de moins en moins', reposMaxDe(C, stat('ardeur', 0)) === 2 && decroit((r) => reposMaxDe(C, stat('ardeur', r))))
verifier('Ardeur : reposé, on frappe au nouveau haut', Math.abs(multiplicateurDeForme(C, stat('ardeur', 5), B.max) - reposMaxDe(C, stat('ardeur', 5))) < 1e-9)
verifier('Ardeur ne change pas la durée : le palier et la fatigue restent', multiplicateurDeForme(C, stat('ardeur', 5), B.palierHaut) === 1 && multiplicateurDeForme(C, stat('ardeur', 5), B.min) === 0)
const epuiseRang = (r: number) => ({ ...stat('recuperation', r), forme: B.min, formeA: 0 })
verifier('Récupération : la fatigue passe plus vite', formeA(C, epuiseRang(5), H / 6) > formeA(C, epuiseRang(0), H / 6))
verifier('Sommeil : le repos se gagne plus vite', formeA(C, stat('sommeil', 5), 3 * H) > formeA(C, stat('sommeil', 0), 3 * H))

const fini = avancer(C, achete, C.saison.duree + 1)
verifier('la saison finie est archivée', fini.archives.length === 1 && fini.archives[0].etageParJour.length === 7)
verifier('la saison suivante repart de l\'étage 1', fini.saison.numero === 2 && fini.ennemi.etage === 1)
verifier('les joueurs restent, remis à zéro', fini.joueurs.length === 1 && fini.joueurs[0].niveau === 1 && fini.joueurs[0].ameliorations.auto === 0)
verifier('trois semaines passent trois saisons', avancer(C, achete, 3 * C.saison.duree + 1).saison.numero === 4)

let h = nouvelleHorloge(1000, 0, 1)
verifier('x1 : une seconde réelle, une seconde de jeu', tempsDeJeu(h, 2000) === 1000)
h = changerDeVitesse(h, 2000, 1000)
verifier('changer de vitesse ne fait pas sauter le temps', tempsDeJeu(h, 2000) === 1000)
verifier('x1000 : une seconde réelle, 1000 secondes', tempsDeJeu(h, 3000) === 1000 + 1_000_000)

const r1 = await simulerSaison(C, 1)
const r2 = await simulerSaison(C, 1)
verifier('même graine, même saison', JSON.stringify(r1) === JSON.stringify(r2))
verifier('une saison simulée a sept jours', r1.etageParJour.length === 7)
verifier('l\'étage ne recule jamais', r1.etageParJour.every((x, i) => i === 0 || x >= r1.etageParJour[i - 1]))
verifier('l\'auto-tap porte l\'essentiel', r1.partTap < 0.5)
const assidu = r1.joueurs.find((j) => j.id === 'assidu')!
verifier('l\'assidu n\'écrase pas les autres (moins de la moitié)', assidu.part < 0.5)

console.log(echecs === 0 ? 'Tout passe.' : `${echecs} echec(s).`)
if (echecs > 0) throw new Error(`${echecs} verification(s) en echec`)

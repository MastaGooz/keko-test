/**
 * Vérifications du donjon coopératif, sans navigateur et sans attendre : le
 * temps est injecté.
 */
import { DONJON } from './config.ts'
import { nomDeLEnnemi, pvDeLEtage } from './ennemi.ts'
import { changerDeVitesse, nouvelleHorloge, tempsDeJeu } from './horloge.ts'
import { appliquer, autoCritique, avancer, chanceCritDe, degatsDuCoupAuto, degatsDuTap, dpsDe, bornesDeLaForme, dpsDeSpam, etatInitial, rechargeDe, multCritDe as forceDe, facteurCritMoyen, formeA, multCritDe, multiplicateurDeForme, periodeDe, reposMaxDe, degatsDuCoupAutoA, bonusDeForme, capacitesDe, capacitePrete, evenementA, evenementDuPassif } from './regles.ts'
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
  for (let k = 0; k < n; k++) x = appliquer(C, x, { joueur: 'a', t: t0 + k * C.armes.epee.recharge, type: 'taper', n: 1 })
  return x
}
const R = C.armes.epee.recharge
const deux = appliquer(C, e1, { joueur: 'a', t: 1000 + R / 2, type: 'taper', n: 1 })
verifier('pendant la recharge, un tap ne fait rien', deux.joueurs[0].degatsTap === e1.joueurs[0].degatsTap)
const recharge = appliquer(C, e1, { joueur: 'a', t: 1000 + R, type: 'taper', n: 1 })
verifier('rechargé, il frappe', recharge.joueurs[0].degatsTap > e1.joueurs[0].degatsTap)
const enRafale = appliquer(C, e, { joueur: 'a', t: 1000, type: 'taper', n: 50 })
verifier('une action de 50 taps n\'en frappe qu\'un', enRafale.joueurs[0].degatsTap === e1.joueurs[0].degatsTap)

const tue = taperSuite(e, 30, 1000)
verifier('assez de taps achèvent l\'ennemi', tue.ennemi.etage > 1 && tue.joueurs[0].kills >= 1)
verifier('les niveaux donnent des points', tue.joueurs[0].points >= 1 && tue.joueurs[0].niveau > 1)

// LES STATS : un point par niveau, à placer librement ; l'arme fait l'identité.
const ja0 = tue.joueurs[0]
const mis = appliquer(C, tue, { joueur: 'a', t: tue.t, type: 'acheter', quoi: 'vitesse' })
verifier('un point va où l\'on veut', mis.joueurs[0].ameliorations.vitesse === 1 && mis.joueurs[0].points === ja0.points - 1)
const achete = mis
verifier('la Vitesse accélère le tap et l\'auto', rechargeDe(C, achete.joueurs[0]) < rechargeDe(C, tue.joueurs[0]) && periodeDe(C, achete.joueurs[0]) < periodeDe(C, tue.joueurs[0]) && dpsDe(C, achete.joueurs[0]) > dpsDe(C, tue.joueurs[0]))
const sansPoints = { ...achete, joueurs: achete.joueurs.map((j) => ({ ...j, points: 0 })) }
verifier('sans points, rien ne s\'achète', appliquer(C, sansPoints, { joueur: 'a', t: sansPoints.t, type: 'acheter', quoi: 'tap' }).joueurs[0].ameliorations.tap === 0)
const avec = (arme: 'epee' | 'dague' | 'baton') => ({ ...ja0, arme, ameliorations: { tap: 0, vitesse: 0, chanceCrit: 0, multCrit: 0, recuperation: 0 } })
const dps = (arme: 'epee' | 'dague' | 'baton') => degatsDuTap(C, avec(arme)) / rechargeDe(C, avec(arme))
verifier('les trois armes ont le même DPS de base', Math.abs(dps('dague') / dps('epee') - 1) < 0.01 && Math.abs(dps('baton') / dps('epee') - 1) < 0.01)
verifier('la dague est rapide, le bâton lent', rechargeDe(C, avec('dague')) < rechargeDe(C, avec('epee')) && rechargeDe(C, avec('baton')) > rechargeDe(C, avec('epee')))
verifier('chaque arme a son bonus', chanceCritDe(C, avec('dague')) > chanceCritDe(C, avec('epee')) && multCritDe(C, avec('baton')) > multCritDe(C, avec('epee')) && bonusDeForme(C, avec('epee'), 'recuperation') > bonusDeForme(C, avec('dague'), 'recuperation'))
verifier('changer d\'arme se fait', appliquer(C, tue, { joueur: 'a', t: tue.t, type: 'equiper', arme: 'baton' }).joueurs[0].arme === 'baton')

const P = periodeDe(C, e.joueurs[0])
verifier(`l'auto part à ${C.auto.depart} recharges du tap`, periodeDe(C, e.joueurs[0]) === C.armes.epee.recharge * C.auto.depart)
const auRang = (r: number) => ({ ...e.joueurs[0], ameliorations: { ...e.joueurs[0].ameliorations, vitesse: r } })
const pasDeVitesse = [0, 1, 5, 20, 60].map((r) => 1 / rechargeDe(C, auRang(r + 1)) - 1 / rechargeDe(C, auRang(r)))
verifier('la Vitesse rend de moins en moins', pasDeVitesse.every((g, i) => g > 0 && (i === 0 || g < pasDeVitesse[i - 1])))
verifier('l\'auto suit le tap, à 10 recharges, et n\'est jamais plus rapide', [0, 50, 500].every((r) => periodeDe(C, auRang(r)) > rechargeDe(C, auRang(r)) && Math.abs(periodeDe(C, auRang(r)) / rechargeDe(C, auRang(r)) - C.auto.depart) < 0.1))
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
const epuiseLa = { ...e, joueurs: e.joueurs.map((j) => ({ ...j, arme: 'dague' as const, forme: B.min, formeA: 0 })) }
verifier('épuisé, on revient au milieu en une demi-heure', Math.abs(formeA(C, epuiseLa.joueurs[0], H / 2)) < 1e-9 && mf(formeA(C, epuiseLa.joueurs[0], H / 6)) < 1)
const repose = { ...e, joueurs: e.joueurs.map((j) => ({ ...j, forme: B.max, formeA: 0 })) }
const unTapRepose = appliquer(C, repose, { joueur: 'a', t: 0, type: 'taper', n: 1 })
verifier('le DPS du spammeur suit la recharge', Math.abs(dpsDeSpam(C, neuf) - (degatsDuTap(C, neuf) * facteurCritMoyen(C, neuf) * 1000) / R) < 1e-9)
const unTapNeuf = appliquer(C, e, { joueur: 'a', t: 0, type: 'taper', n: 1 })
const rapport = unTapRepose.joueurs[0].degatsTap / unTapNeuf.joueurs[0].degatsTap
verifier("reposé, un tap frappe double (à l'arrondi près)", Math.abs(rapport - 2) < 0.15)
// LES STATS DE LA FORME : l'intensité ou le temps hors jeu, jamais la durée d'une session.
const stat = (_quoi: 'recuperation', r: number) => ({ ...neuf, ameliorations: { ...neuf.ameliorations, recuperation: r } })
verifier('le haut du repos est fixe : 200 %', reposMaxDe(C, neuf) === 2 && multiplicateurDeForme(C, neuf, B.max) === 2)
const epuiseRang = (r: number) => ({ ...stat('recuperation', r), forme: B.min, formeA: 0 })
verifier('Récupération : la fatigue passe plus vite', formeA(C, epuiseRang(5), H / 6) > formeA(C, epuiseRang(0), H / 6))
verifier('Récupération : le repos se gagne aussi plus vite', formeA(C, stat('recuperation', 5), 3 * H) > formeA(C, stat('recuperation', 0), 3 * H))

// LES CAPACITÉS : deux par arme, plus fortes que le tap, sans user la forme.
/** Un ennemi qui ne meurt pas : les coups se comptent entiers. */
const increvable = (x: EtatDonjon): EtatDonjon => ({ ...x, ennemi: { ...x.ennemi, pv: 1e12, pvMax: 1e12 } })
const avecArme = (arme: 'epee' | 'dague' | 'baton', graine: number) => increvable(appliquer(C, etatInitial(C, graine, 0), { joueur: 'a', t: 0, type: 'rejoindre', nom: 'A', bot: null, arme }))
const c0 = avecArme('epee', 3)
const jc = c0.joueurs[0]
verifier("l'épée porte Frappe lourde et Brise-garde", capacitesDe(C, jc).join() === 'frappeLourde,briseGarde')
const f1 = appliquer(C, c0, { joueur: 'a', t: 100, type: 'lancer', capacite: 'frappeLourde' })
const coupF = f1.joueurs[0].degatsTap
verifier('Frappe lourde vaut quinze taps (plage et critique compris)', coupF >= degatsDuTap(C, jc) * 15 * (1 - C.tap.ecart) - 1 && coupF <= degatsDuTap(C, jc) * 15 * (1 + C.tap.ecart) * multCritDe(C, jc) + 1)
verifier("une capacité n'use pas la forme", formeA(C, f1.joueurs[0], 100) === formeA(C, jc, 100))
verifier('en recharge, elle ne part pas', appliquer(C, f1, { joueur: 'a', t: 5000, type: 'lancer', capacite: 'frappeLourde' }).joueurs[0].degatsTap === coupF)
verifier('rechargée, elle repart', appliquer(C, f1, { joueur: 'a', t: 100 + 20_000, type: 'lancer', capacite: 'frappeLourde' }).joueurs[0].degatsTap > coupF)
verifier("la capacité d'une autre arme ne part pas", appliquer(C, c0, { joueur: 'a', t: 100, type: 'lancer', capacite: 'bouleDeFeu' }).joueurs[0].degatsTap === 0)
const bg = appliquer(C, c0, { joueur: 'a', t: 100, type: 'lancer', capacite: 'briseGarde' })
const auto = (x: EtatDonjon, t: number) => avancer(C, x, t).joueurs[0].degatsAuto
verifier("Brise-garde : l'auto frappe 50 % plus fort pendant 10 s", Math.abs(auto(bg, 10_100) / auto(c0, 10_100) - 1.5) < 0.1)
verifier('Brise-garde fini, les coups redeviennent les mêmes', auto(bg, 60_000) - auto(bg, 10_100) === auto(c0, 60_000) - auto(c0, 10_100))
const Pc = periodeDe(C, jc)
const lus = Array.from({ length: Math.floor(10_100 / Pc) }, (_, i) => degatsDuCoupAutoA(C, bg.saison.seed, (i + 1) * Pc, bg.joueurs[0], (i + 1) * Pc)).reduce((x, y) => x + y, 0)
verifier("l'écran lit les mêmes coups d'auto sous Brise-garde", lus === auto(bg, 10_100))
let d = appliquer(C, avecArme('dague', 4), { joueur: 'a', t: 0, type: 'lancer', capacite: 'lamesOmbre' })
const jd = d.joueurs[0]
for (let k = 0; k < 20; k++) d = appliquer(C, d, { joueur: 'a', t: k * rechargeDe(C, jd), type: 'taper', n: 1 })
verifier("Lames de l'ombre : vingt taps, vingt critiques", d.joueurs[0].degatsTap >= 20 * (degatsDuTap(C, jd) * (1 - C.tap.ecart) * multCritDe(C, jd) - 1))
verifier('les critiques remplissent la Furie (dix au plus)', d.joueurs[0].critiques === 10 && capacitePrete(C, d.joueurs[0], 'furie', d.t))
const fu = appliquer(C, d, { joueur: 'a', t: d.t, type: 'lancer', capacite: 'furie' })
verifier('la Furie frappe et repart de zéro', fu.joueurs[0].degatsTap > d.joueurs[0].degatsTap && fu.joueurs[0].critiques <= 1 && !capacitePrete(C, fu.joueurs[0], 'furie', fu.t))
const change = appliquer(C, c0, { joueur: 'a', t: 1000, type: 'equiper', arme: 'baton' })
verifier("changer d'arme met ses capacités en recharge", !capacitePrete(C, change.joueurs[0], 'bouleDeFeu', 1000) && !capacitePrete(C, change.joueurs[0], 'meditation', 1000))
verifier('elles reviennent après leur recharge', capacitePrete(C, change.joueurs[0], 'bouleDeFeu', 1000 + 40_000) && capacitePrete(C, change.joueurs[0], 'meditation', 1000 + 60_000))
const versDague = appliquer(C, d, { joueur: 'a', t: d.t, type: 'equiper', arme: 'epee' })
verifier('passer à la dague repart de zéro critique', appliquer(C, versDague, { joueur: 'a', t: d.t, type: 'equiper', arme: 'dague' }).joueurs[0].critiques === 0)
verifier("remettre la même arme ne recharge rien", capacitePrete(C, appliquer(C, c0, { joueur: 'a', t: 1000, type: 'equiper', arme: 'epee' }).joueurs[0], 'frappeLourde', 1000))
// LES PASSIFS DE CLASSE : un événement à toucher dans sa fenêtre, dans l'ordre.
const ev0 = evenementDuPassif(C, c0.saison.seed, c0.saison.debut, jc, 1)!
const auMilieu = (ev0.debut + ev0.fin) / 2
verifier('un événement par tranche, dans sa tranche', ev0.debut >= C.passifs.epee.periode && ev0.fin <= 2 * C.passifs.epee.periode)
verifier("l'événement est le même lu deux fois", JSON.stringify(ev0) === JSON.stringify(evenementDuPassif(C, c0.saison.seed, c0.saison.debut, jc, 1)))
verifier('ouvert dans sa fenêtre, fermé après', evenementA(C, c0.saison.seed, 0, jc, auMilieu)?.k === 1 && evenementA(C, c0.saison.seed, 0, jc, ev0.fin + 1) === null)
const ri = appliquer(C, c0, { joueur: 'a', t: auMilieu, type: 'toucher', evenement: 1, cible: 0 })
const coupR = ri.joueurs[0].degatsTap
verifier('Riposte : vingt taps dans la fenêtre', coupR >= degatsDuTap(C, jc) * 20 * (1 - C.tap.ecart) - 1)
verifier('une riposte par événement', appliquer(C, ri, { joueur: 'a', t: auMilieu + 1, type: 'toucher', evenement: 1, cible: 0 }).joueurs[0].degatsTap === coupR)
verifier('hors de la fenêtre, rien', appliquer(C, c0, { joueur: 'a', t: ev0.fin + 1, type: 'toucher', evenement: 1, cible: 0 }).joueurs[0].degatsTap === 0)
verifier("un passif n'use pas la forme", formeA(C, ri.joueurs[0], auMilieu) === formeA(C, jc, auMilieu))
const dg = avecArme('dague', 6)
const evD = evenementDuPassif(C, dg.saison.seed, 0, dg.joueurs[0], 2)!
const pf = appliquer(C, dg, { joueur: 'a', t: evD.debut, type: 'toucher', evenement: 2, cible: 0 })
verifier('Point faible : un coup critique forcé, un cran de Furie', pf.joueurs[0].degatsTap >= degatsDuTap(C, dg.joueurs[0]) * 3 * (1 - C.tap.ecart) * multCritDe(C, dg.joueurs[0]) - 1 && pf.joueurs[0].critiques === 1)
const bt = avecArme('baton', 7)
const evB = evenementDuPassif(C, bt.saison.seed, 0, bt.joueurs[0], 1)!
const rune = (x: EtatDonjon, cible: number) => appliquer(C, x, { joueur: 'a', t: evB.debut + 100 * (cible + 1), type: 'toucher', evenement: 1, cible })
verifier('Runes : trois cibles en cercle', evB.cibles.length === 3)
const deuxRunes = rune(rune(bt, 0), 1)
verifier('deux runes sur trois ne frappent pas', deuxRunes.joueurs[0].degatsTap === 0 && deuxRunes.joueurs[0].passif.etape === 2)
verifier('la troisième frappe', rune(deuxRunes, 2).joueurs[0].degatsTap >= degatsDuTap(C, bt.joueurs[0]) * 20 * (1 - C.tap.ecart) - 1)
const erreur = rune(rune(bt, 0), 2)
verifier("une rune hors d'ordre efface l'événement", erreur.joueurs[0].passif.etape === -1 && rune(erreur, 1).joueurs[0].degatsTap === 0)
// À MAINS NUES : déséquiper ôte les capacités et le passif.
const nu = appliquer(C, c0, { joueur: 'a', t: 100, type: 'equiper', arme: 'mains' })
const jn = nu.joueurs[0]
verifier('déséquiper : mains nues', jn.arme === 'mains' && capacitesDe(C, jn).length === 0)
verifier('à mains nues, aucune capacité ne part', appliquer(C, nu, { joueur: 'a', t: 100, type: 'lancer', capacite: 'frappeLourde' }).joueurs[0].degatsTap === 0)
verifier('à mains nues, aucun événement de passif', evenementDuPassif(C, nu.saison.seed, 0, jn, 1) === null && evenementA(C, nu.saison.seed, 0, jn, auMilieu) === null)
verifier("à mains nues, la moitié des dégâts de l'épée", Math.abs(degatsDuTap(C, jn) / degatsDuTap(C, jc) - 0.5) < 1e-9)
verifier("on reprend son arme, ses capacités en recharge", !capacitePrete(C, appliquer(C, nu, { joueur: 'a', t: 200, type: 'equiper', arme: 'epee' }).joueurs[0], 'frappeLourde', 200))
// L'ARC, PROVISOIRE : ni capacité, ni passif, le même DPS de base que l'épée.
const jArc = appliquer(C, c0, { joueur: 'a', t: 100, type: 'equiper', arme: 'arc' }).joueurs[0]
verifier("l'arc s'équipe, sans capacité ni passif", jArc.arme === 'arc' && capacitesDe(C, jArc).length === 0 && evenementDuPassif(C, c0.saison.seed, 0, jArc, 1) === null)
verifier("l'arc a le DPS de base de l'épée", Math.abs(degatsDuTap(C, jArc) / periodeDe(C, jArc) / (degatsDuTap(C, jc) / periodeDe(C, jc)) - 1) < 1e-9)
// L'ÉPÉE À DEUX MAINS, PROVISOIRE elle aussi.
const jDeux = appliquer(C, c0, { joueur: 'a', t: 100, type: 'equiper', arme: 'deuxMains' }).joueurs[0]
verifier("l'épée à deux mains s'équipe, sans capacité ni passif", jDeux.arme === 'deuxMains' && capacitesDe(C, jDeux).length === 0 && evenementDuPassif(C, c0.saison.seed, 0, jDeux, 1) === null)
verifier("l'épée à deux mains a le DPS de base de l'épée", Math.abs(degatsDuTap(C, jDeux) / periodeDe(C, jDeux) / (degatsDuTap(C, jc) / periodeDe(C, jc)) - 1) < 1e-9)
// LES DEUX HACHES, LES DEUX MASSUES, LA LANCE, LES DEUX MARTEAUX, L'ARBALÈTE, LE PISTOLET ET LE MOUSQUET, PROVISOIRES elles aussi.
for (const arme of ['hache', 'hacheDeuxMains', 'massue', 'massueDeuxMains', 'lance', 'marteau', 'marteauDeuxMains', 'arbalete', 'pistolet', 'mousquet'] as const) {
  const jH = appliquer(C, c0, { joueur: 'a', t: 100, type: 'equiper', arme }).joueurs[0]
  verifier(`${C.armes[arme].nom} s'équipe, sans capacité ni passif`, jH.arme === arme && capacitesDe(C, jH).length === 0 && evenementDuPassif(C, c0.saison.seed, 0, jH, 1) === null)
  verifier(`${C.armes[arme].nom} a le DPS de base de l'épée`, Math.abs(degatsDuTap(C, jH) / periodeDe(C, jH) / (degatsDuTap(C, jc) / periodeDe(C, jc)) - 1) < 1e-9)
}
const me = appliquer(C, avecArme('baton', 5), { joueur: 'a', t: 0, type: 'lancer', capacite: 'meditation' })
verifier("Méditation rend une minute de forme", me.joueurs[0].forme === 1)

const fini = avancer(C, achete, C.saison.duree + 1)
verifier('la saison finie est archivée', fini.archives.length === 1 && fini.archives[0].etageParJour.length === 7)
verifier('la saison suivante repart de l\'étage 1', fini.saison.numero === 2 && fini.ennemi.etage === 1)
verifier('les joueurs restent, remis à zéro', fini.joueurs.length === 1 && fini.joueurs[0].niveau === 1 && fini.joueurs[0].ameliorations.vitesse === 0)
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

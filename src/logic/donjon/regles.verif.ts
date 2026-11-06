/**
 * Vérifications du donjon coopératif, sans navigateur et sans attendre : le
 * temps est injecté.
 */
import { DONJON, type ConfigDonjon } from './config.ts'
import { nomDeLEnnemi, pvDeLEtage } from './ennemi.ts'
import { changerDeVitesse, nouvelleHorloge, tempsDeJeu } from './horloge.ts'
import { appliquer, autoCritique, avancer, chanceCritDe, degatsDuCoupAuto, degatsDuTap, dpsDe, bornesDeLaForme, dpsDeSpam, etatInitial, rechargeDe, multCritDe as forceDe, facteurCritMoyen, formeA, multCritDe, multiplicateurDeForme, periodeDe, reposMaxDe, degatsDuCoupAutoA, bonusDeForme, capacitesDe, capacitePrete, evenementA, passifDe, toleranceDe, chargeDe, ciblesDe, type EvenementDuPassif } from './regles.ts'
import { RUNES } from './runes.ts'
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
// LES PASSIFS DE CLASSE : un tap a une chance d'ouvrir un événement, à toucher dans sa fenêtre, dans l'ordre.
/** Tape à chaque fin de recharge jusqu'à ouvrir un événement du passif. */
function jusquAuPassif(config: ConfigDonjon, x: EtatDonjon): { etat: EtatDonjon; ev: EvenementDuPassif; taps: number } {
  let t = x.t
  for (let taps = 1; taps <= 1000; taps++) {
    x = appliquer(config, x, { joueur: 'a', t, type: 'taper', n: 1 })
    const ev = evenementA(config, x.saison.seed, x.joueurs[0], t)
    if (ev !== null) return { etat: x, ev, taps }
    t = x.joueurs[0].prochainTap
  }
  throw new Error('aucun événement de passif')
}
const { etat: ouvert, ev: ev0 } = jusquAuPassif(C, c0)
const auMilieu = (ev0.debut + ev0.fin) / 2
verifier("un tap ouvre l'événement, pour sa durée", ev0.debut === ouvert.t && ev0.fin === ev0.debut + C.passifs.epee.duree)
verifier("l'événement est le même lu deux fois", JSON.stringify(ev0) === JSON.stringify(evenementA(C, ouvert.saison.seed, ouvert.joueurs[0], auMilieu)))
verifier('ouvert dans sa fenêtre, fermé après', evenementA(C, ouvert.saison.seed, ouvert.joueurs[0], auMilieu)?.k === ev0.k && evenementA(C, ouvert.saison.seed, ouvert.joueurs[0], ev0.fin + 1) === null)
verifier("l'auto n'ouvre rien", evenementA(C, c0.saison.seed, avancer(C, c0, H).joueurs[0], H) === null && avancer(C, c0, H).joueurs[0].passif.evenement === -1)
let bloque = ouvert
for (let t = ouvert.joueurs[0].prochainTap; t < ev0.fin; t = bloque.joueurs[0].prochainTap) bloque = appliquer(C, bloque, { joueur: 'a', t, type: 'taper', n: 1 })
verifier('un événement ouvert bloque le suivant', bloque.joueurs[0].passif.evenement === ev0.k && bloque.joueurs[0].passif.debut === ev0.debut)
const sansChance = { ...C, passifs: { ...C.passifs, epee: { ...C.passifs.epee, chance: 0 } } }
verifier(`la pitié : sans chance, le ${C.passifs.epee.pitie}e tap l'ouvre`, jusquAuPassif(sansChance, c0).taps === C.passifs.epee.pitie)
/** Tracer le trait de la Taille : ses deux bouts, dans l'ordre (ou à l'envers). */
const tracer = (x: EtatDonjon, t: number, envers = false) =>
  appliquer(C, appliquer(C, x, { joueur: 'a', t, type: 'toucher', evenement: ev0.k, cible: envers ? 1 : 0 }), { joueur: 'a', t, type: 'toucher', evenement: ev0.k, cible: envers ? 0 : 1 })
verifier('Taille : un trait de deux bouts, sur le dessin', ev0.cibles.length === 2 && ev0.cibles.every((c) => c.x > 0.1 && c.x < 0.9 && c.y > 0.1 && c.y < 0.8))
const ri = tracer(ouvert, auMilieu)
const coupR = ri.joueurs[0].degatsTap - ouvert.joueurs[0].degatsTap
verifier('Taille : vingt taps, le trait tracé dans la fenêtre', coupR >= degatsDuTap(C, jc) * 20 * (1 - C.tap.ecart) - 1)
verifier('un seul bout ne frappe pas', appliquer(C, ouvert, { joueur: 'a', t: auMilieu, type: 'toucher', evenement: ev0.k, cible: 0 }).joueurs[0].degatsTap === ouvert.joueurs[0].degatsTap)
verifier("tracé à l'envers, rien", tracer(tracer(ouvert, auMilieu, true), auMilieu + 1).joueurs[0].degatsTap === ouvert.joueurs[0].degatsTap)
verifier('une taille par trait', tracer(ri, auMilieu + 1).joueurs[0].degatsTap === ri.joueurs[0].degatsTap)
// LA SÉRIE : réussi, un trait de plus s'ouvre après le coup, plus court ; chacun frappe ×20.
const S = C.passifs.epee.serie!
const ev1 = evenementA(C, ri.saison.seed, ri.joueurs[0], auMilieu + S.entre + 1)
verifier('la série : un deuxième trait, ouvert après le coup, plus court', ev1 !== null && ev1.k === ev0.k && ev1.rang === 1 && ev1.debut === auMilieu + S.entre && Math.abs(ev1.fin - ev1.debut - C.passifs.epee.duree * S.raccourci) < 1e-6)
verifier('ailleurs que le premier', ev1 !== null && JSON.stringify(ev1.cibles) !== JSON.stringify(ev0.cibles))
const entreDeux = appliquer(C, ri, { joueur: 'a', t: Math.max(auMilieu + 300, ri.joueurs[0].prochainTap), type: 'taper', n: 1 })
verifier("entre deux traits, aucun tap n'ouvre d'événement", entreDeux.joueurs[0].passif.debut === ev1!.debut && entreDeux.joueurs[0].passif.sans === ri.joueurs[0].passif.sans)
const ri2 = tracer(ri, ev1!.debut + 10)
verifier('le deuxième trait frappe ×20 lui aussi', ri2.joueurs[0].degatsTap - ri.joueurs[0].degatsTap >= degatsDuTap(C, jc) * 20 * (1 - C.tap.ecart) - 1)
const ev2 = evenementA(C, ri2.saison.seed, ri2.joueurs[0], ev1!.debut + 10 + S.entre + 1)
verifier('le troisième, plus court encore', ev2 !== null && ev2.rang === 2 && Math.abs(ev2.fin - ev2.debut - C.passifs.epee.duree * S.raccourci ** 2) < 1e-6)
const G = C.passifs.epee.grace!
verifier('raté (le temps passé, la grâce aussi), la série finit', tracer(ri2, ev2!.fin + G + 1).joueurs[0].degatsTap === ri2.joueurs[0].degatsTap)
const tard = tracer(ri2, ev2!.fin + G - 1)
verifier('tracé dans la grâce, il compte et la suite s’ouvre', tard.joueurs[0].degatsTap > ri2.joueurs[0].degatsTap && tard.joueurs[0].passif.rang === 3)
verifier('hors de la fenêtre et de sa grâce, rien', tracer(ouvert, ev0.fin + C.passifs.epee.grace! + 1).joueurs[0].degatsTap === ouvert.joueurs[0].degatsTap)
verifier("un passif n'use pas la forme", formeA(C, ri.joueurs[0], auMilieu) === formeA(C, ouvert.joueurs[0], auMilieu))
// LES POINTS FAIBLES EN SÉRIE : touchés, ils attendent ; au premier manqué, chacun frappe ×3 critique.
const { etat: dg, ev: evD } = jusquAuPassif(C, avecArme('dague', 6))
const PF = C.passifs.dague
const pf1 = appliquer(C, dg, { joueur: 'a', t: evD.debut, type: 'toucher', evenement: evD.k, cible: 0 })
verifier('Points faibles : touché, un point ne frappe pas encore', pf1.joueurs[0].degatsTap === dg.joueurs[0].degatsTap && pf1.joueurs[0].passif.rang === 1)
const evD2 = evenementA(C, pf1.saison.seed, pf1.joueurs[0], evD.debut + PF.serie!.entre + 1)
verifier('le suivant s’allume, loin du premier, plus court', evD2 !== null && evD2.rang === 1 && Math.hypot(evD2.cibles[0].x - evD.cibles[0].x, evD2.cibles[0].y - evD.cibles[0].y) >= 0.2 && Math.abs(evD2.fin - evD2.debut - PF.duree * PF.serie!.raccourci) < 1e-6)
const pf2 = appliquer(C, pf1, { joueur: 'a', t: evD2!.debut + 5, type: 'toucher', evenement: evD.k, cible: 0 })
const apres = pf2.joueurs[0].passif.fin + PF.grace! + 2
verifier('pendant la série, toujours rien', avancer(C, pf2, apres - 3).joueurs[0].degatsTap === dg.joueurs[0].degatsTap)
const encaisse = avancer(C, pf2, apres)
const temoin = avancer(C, dg, apres)
const unPoint = degatsDuTap(C, dg.joueurs[0]) * PF.coup * (1 - C.tap.ecart) * multCritDe(C, dg.joueurs[0])
verifier('au premier manqué, chaque point touché frappe ×3 critique', encaisse.joueurs[0].degatsTap - dg.joueurs[0].degatsTap >= 2 * unPoint - 2 && encaisse.joueurs[0].passif.dernier?.coups === 2)
const dernier = encaisse.joueurs[0].passif.dernier
verifier('un chiffre par coup, leur somme pour total', dernier?.detail?.length === 2 && dernier.detail.reduce((x, y) => x + y, 0) === dernier.degats)
verifier('un cran de Furie par point', encaisse.joueurs[0].critiques - temoin.joueurs[0].critiques === 2)
verifier("manqué d'emblée, rien ne frappe", temoin.joueurs[0].degatsTap === dg.joueurs[0].degatsTap && temoin.joueurs[0].passif.dernier === undefined)
verifier("changer d'arme encaisse la série en cours", appliquer(C, pf2, { joueur: 'a', t: evD2!.debut + 10, type: 'equiper', arme: 'epee' }).joueurs[0].degatsTap - dg.joueurs[0].degatsTap >= 2 * unPoint - 2)
const { etat: bt, ev: evB } = jusquAuPassif(C, avecArme('baton', 7))
const avantRunes = bt.joueurs[0].degatsTap
const rune = (x: EtatDonjon, cible: number, debut = evB.debut) => appliquer(C, x, { joueur: 'a', t: debut + 100 * (cible + 1), type: 'toucher', evenement: evB.k, cible })
verifier('Runes : une rune de trois points, du catalogue', evB.cibles.length === 3 && RUNES.some((r) => r.points.every(([x, y], i) => y === evB.cibles[i].y && (x === evB.cibles[i].x || 1 - x === evB.cibles[i].x))))
const troisPoints = rune(rune(rune(bt, 0), 1), 2)
verifier('la rune reliée ne frappe pas encore, la suivante a un point de plus', troisPoints.joueurs[0].degatsTap === avantRunes && troisPoints.joueurs[0].passif.rang === 1 && ciblesDe(C.passifs.baton, 1) === 4)
const evB2 = evenementA(C, troisPoints.saison.seed, troisPoints.joueurs[0], troisPoints.joueurs[0].passif.debut)!
verifier('la deuxième rune : quatre points', evB2.cibles.length === 4)
const leve = appliquer(C, rune(troisPoints, 0, evB2.debut), { joueur: 'a', t: evB2.debut + 300, type: 'toucher', evenement: evB.k, cible: -1 })
verifier('le doigt levé : la série tombe en un coup, ×20 par rune', leve.joueurs[0].passif.dernier?.coups === 1 && leve.joueurs[0].passif.dernier?.detail?.length === 1 && leve.joueurs[0].degatsTap - avantRunes >= degatsDuTap(C, bt.joueurs[0]) * 20 * (1 - C.tap.ecart) - 1)
const erreur = rune(rune(bt, 0), 2)
verifier("un point hors d'ordre rate la rune", erreur.joueurs[0].passif.etape === -1 && rune(erreur, 1).joueurs[0].degatsTap === avantRunes)
verifier('la plus longue rune a six points', ciblesDe(C.passifs.baton, 10) === 6)
// LA RAFALE DES GRIFFES : chaque tap compte, pas trop vite, et tout frappe à la fin.
const { etat: gr, ev: evG } = jusquAuPassif(C, increvable(appliquer(C, etatInitial(C, 11, 0), { joueur: 'a', t: 0, type: 'rejoindre', nom: 'A', bot: null, arme: 'griffes' })))
let tapote = gr
for (let i = 0; i < 16; i++) tapote = appliquer(C, tapote, { joueur: 'a', t: evG.debut + 100 + i * 110, type: 'toucher', evenement: evG.k, cible: 0 })
const tropVite = appliquer(C, tapote, { joueur: 'a', t: evG.debut + 100 + 15 * 110 + 10, type: 'toucher', evenement: evG.k, cible: 0 })
verifier('Lacération : seize taps comptés, rien ne frappe encore', tapote.joueurs[0].passif.rang === 16 && tapote.joueurs[0].degatsTap === gr.joueurs[0].degatsTap)
verifier('un tap trop rapproché ne compte pas', tropVite.joueurs[0].passif.rang === 16)
const finDuTemps = tapote.joueurs[0].passif.fin
verifier('le fouet a la rafale des griffes', JSON.stringify(C.passifs.fouet.rafale) === JSON.stringify(C.passifs.griffes.rafale) && C.passifs.fouet.coup === C.passifs.griffes.coup)
verifier('le temps part du premier tap', finDuTemps === evG.debut + 100 + C.passifs.griffes.duree && evG.fin === evG.debut + C.passifs.griffes.rafale!.attente)
const finRafale = avancer(C, tapote, finDuTemps + 10)
verifier('la fenêtre passée, seize coups ×1, un chiffre chacun', finRafale.joueurs[0].passif.dernier?.detail?.length === 16 && finRafale.joueurs[0].degatsTap - gr.joueurs[0].degatsTap >= 16 * degatsDuTap(C, gr.joueurs[0]) * (1 - C.tap.ecart) - 16)
verifier('après la fenêtre, un tap ne compte plus', appliquer(C, tapote, { joueur: 'a', t: finDuTemps + 5, type: 'toucher', evenement: evG.k, cible: 0 }).joueurs[0].passif.rang === 16)
const sansTap = avancer(C, gr, evG.fin + 10)
verifier("sans tap dans l'attente, raté, rien ne frappe", sansTap.joueurs[0].passif.etape === -1 && sansTap.joueurs[0].degatsTap === gr.joueurs[0].degatsTap && appliquer(C, gr, { joueur: 'a', t: evG.fin + 5, type: 'toucher', evenement: evG.k, cible: 0 }).joueurs[0].passif.rang === 0)
// Aucun trait ne passe sur un point pas encore relié (Wunjo et Raidho avaient leur point 4 sur le trait du 1 au 2).
const distanceAuTrait = (q: [number, number], a: [number, number], b: [number, number]) => {
  const [dx, dy] = [b[0] - a[0], b[1] - a[1]]
  const u = Math.max(0, Math.min(1, ((q[0] - a[0]) * dx + (q[1] - a[1]) * dy) / (dx * dx + dy * dy)))
  return Math.hypot(q[0] - a[0] - u * dx, q[1] - a[1] - u * dy)
}
const runesTrompeuses = RUNES.filter((r) =>
  r.points.some((_, i) => i + 1 < r.points.length && r.points.some((q, j) => j > i + 1 && !r.points.slice(0, i + 1).some((d) => d[0] === q[0] && d[1] === q[1]) && distanceAuTrait(q, r.points[i], r.points[i + 1]) < 0.15)),
)
const runesFermees = RUNES.filter((r) => r.points.some((q, i) => r.points.some((d, j) => j < i && d[0] === q[0] && d[1] === q[1])))
verifier(`toutes les runes sont ouvertes${runesFermees.length > 0 ? ' : ' + runesFermees.map((r) => r.nom).join(', ') : ''}`, runesFermees.length === 0)
verifier(`aucun trait de rune ne passe sur un point à venir${runesTrompeuses.length > 0 ? ' : ' + runesTrompeuses.map((r) => r.nom).join(', ') : ''}`, runesTrompeuses.length === 0)
const apresErreur = appliquer(C, erreur, { joueur: 'a', t: Math.max(erreur.t, erreur.joueurs[0].prochainTap), type: 'taper', n: 1 })
verifier('raté, il ne bloque plus le suivant', apresErreur.joueurs[0].passif.sans === 1 || apresErreur.joueurs[0].passif.evenement === evB.k + 1)
// À MAINS NUES : déséquiper ôte les capacités et le passif.
/** Deux cents taps à mains nues n'ouvrent aucun événement. */
function jusquAuPassifNu(x: EtatDonjon): boolean {
  let t = x.t
  for (let i = 0; i < 200; i++) {
    x = appliquer(C, x, { joueur: 'a', t, type: 'taper', n: 1 })
    if (x.joueurs[0].passif.evenement !== -1) return false
    t = x.joueurs[0].prochainTap
  }
  return true
}
const nu = appliquer(C, c0, { joueur: 'a', t: 100, type: 'equiper', arme: 'mains' })
const jn = nu.joueurs[0]
verifier('déséquiper : mains nues', jn.arme === 'mains' && capacitesDe(C, jn).length === 0)
verifier('à mains nues, aucune capacité ne part', appliquer(C, nu, { joueur: 'a', t: 100, type: 'lancer', capacite: 'frappeLourde' }).joueurs[0].degatsTap === 0)
verifier('à mains nues, aucun événement de passif', passifDe(C, jn) === null && jusquAuPassifNu(nu))
verifier("à mains nues, la moitié des dégâts de l'épée", Math.abs(degatsDuTap(C, jn) / degatsDuTap(C, jc) - 0.5) < 1e-9)
verifier("on reprend son arme, ses capacités en recharge", !capacitePrete(C, appliquer(C, nu, { joueur: 'a', t: 200, type: 'equiper', arme: 'epee' }).joueurs[0], 'frappeLourde', 200))
// L'ARC, PROVISOIRE : ni capacité, ni passif, le même DPS de base que l'épée.
const jArc = appliquer(C, c0, { joueur: 'a', t: 100, type: 'equiper', arme: 'arc' }).joueurs[0]
verifier("l'arc s'équipe, sans capacité ni passif", jArc.arme === 'arc' && capacitesDe(C, jArc).length === 0 && passifDe(C, jArc) === null)
verifier("l'arc a le DPS de base de l'épée", Math.abs(degatsDuTap(C, jArc) / periodeDe(C, jArc) / (degatsDuTap(C, jc) / periodeDe(C, jc)) - 1) < 1e-9)
// L'ÉPÉE À DEUX MAINS, PROVISOIRE elle aussi.
const jDeux = appliquer(C, c0, { joueur: 'a', t: 100, type: 'equiper', arme: 'deuxMains' }).joueurs[0]
verifier("l'épée à deux mains s'équipe, sans capacité, avec la Taille des épées", jDeux.arme === 'deuxMains' && capacitesDe(C, jDeux).length === 0 && passifDe(C, jDeux)?.nom === 'Taille')
verifier("l'épée à deux mains a le DPS de base de l'épée", Math.abs(degatsDuTap(C, jDeux) / periodeDe(C, jDeux) / (degatsDuTap(C, jc) / periodeDe(C, jc)) - 1) < 1e-9)
// LES DEUX HACHES, LES DEUX MASSUES, LA LANCE, LES DEUX MARTEAUX, L'ARBALÈTE, LE PISTOLET, LE MOUSQUET, LA RAPIÈRE, LE FOUET, LE FLÉAU, LES GRIFFES, LA FRONDE, LE SHURIKEN, LE BOOMERANG, LE KUNAI, LE COUTEAU DE LANCER, LE LUTH ET LA BAGUETTE, PROVISOIRES elles aussi.
// LE FRACAS DES CONTONDANTES : au temps juste, l'anneau sur le rond.
const { etat: ms, ev: evM } = jusquAuPassif(C, increvable(appliquer(C, etatInitial(C, 8, 0), { joueur: 'a', t: 0, type: 'rejoindre', nom: 'A', bot: null, arme: 'massue' })))
const FR = C.passifs.massue
const tolM = toleranceDe(FR, evM)
const juste = evM.fin - tolM
const tot = appliquer(C, ms, { joueur: 'a', t: juste - tolM - 1, type: 'toucher', evenement: evM.k, cible: 0 })
verifier('Fracas : touché trop tôt, la série est ratée', tot.joueurs[0].passif.etape === -1 && tot.joueurs[0].degatsTap === ms.joueurs[0].degatsTap)
const bon = appliquer(C, ms, { joueur: 'a', t: juste + 50, type: 'toucher', evenement: evM.k, cible: 0 })
verifier('au temps juste (dans le cadre), il compte, sans frapper encore', bon.joueurs[0].passif.rang === 1 && bon.joueurs[0].degatsTap === ms.joueurs[0].degatsTap)
const evM2 = evenementA(C, bon.saison.seed, bon.joueurs[0], juste + 50 + FR.serie!.entre + 1)!
const rate = appliquer(C, bon, { joueur: 'a', t: evM2.debut + 10, type: 'toucher', evenement: evM.k, cible: 0 })
verifier('le suivant raté trop tôt, chaque coup juste frappe ×5', rate.joueurs[0].degatsTap - ms.joueurs[0].degatsTap >= degatsDuTap(C, ms.joueurs[0]) * FR.coup * (1 - C.tap.ecart) - 1 && rate.joueurs[0].passif.dernier?.coups === 1)
verifier("l'anneau du suivant va plus vite", Math.abs(evM2.fin - evM2.debut - FR.duree * FR.serie!.raccourci) < 1e-6)
verifier('au centre, et le suivant à la même place', evM.cibles[0].x === 0.5 && evM.cibles[0].y === 0.45 && JSON.stringify(evM2.cibles) === JSON.stringify(evM.cibles))
const bon2 = appliquer(C, bon, { joueur: 'a', t: evM2.fin - toleranceDe(FR, evM2), type: 'toucher', evenement: evM.k, cible: 0 })
const evM3 = evenementA(C, bon2.saison.seed, bon2.joueurs[0], evM2.fin - toleranceDe(FR, evM2) + FR.serie!.entre + 1)!
verifier('le cadre ne change pas : la tolérance suit la course', Math.abs(toleranceDe(FR, evM2) / (evM2.fin - toleranceDe(FR, evM2) - evM2.debut) - FR.zone!) < 1e-9 && toleranceDe(FR, evM2) < tolM)
const deuxJustes = appliquer(C, bon2, { joueur: 'a', t: evM3.debut + 10, type: 'toucher', evenement: evM.k, cible: 0 })
verifier('deux coups justes tombent en UN coup, ×10', deuxJustes.joueurs[0].passif.dernier?.detail?.length === 1 && deuxJustes.joueurs[0].degatsTap - ms.joueurs[0].degatsTap >= degatsDuTap(C, ms.joueurs[0]) * FR.coup * 2 * (1 - C.tap.ecart) - 1)
// L'ÉLAN DES HACHES : poser le doigt, lâcher dans la zone de la charge.
const { etat: hx, ev: evH } = jusquAuPassif(C, increvable(appliquer(C, etatInitial(C, 9, 0), { joueur: 'a', t: 0, type: 'rejoindre', nom: 'A', bot: null, arme: 'hache' })))
const EL = C.passifs.hache
const pose = appliquer(C, hx, { joueur: 'a', t: evH.debut + 300, type: 'toucher', evenement: evH.k, cible: 0 })
const lache = (x: EtatDonjon, part: number) => appliquer(C, x, { joueur: 'a', t: evH.debut + 300 + chargeDe(EL, 0) * part, type: 'toucher', evenement: evH.k, cible: 1 })
verifier('Élan : posé, rien ne frappe encore', pose.joueurs[0].degatsTap === hx.joueurs[0].degatsTap && pose.joueurs[0].passif.etape === 1)
verifier('lâché trop tôt, raté', lache(pose, EL.elan!.zone[0] - 0.05).joueurs[0].passif.etape === -1 && lache(pose, EL.elan!.zone[0] - 0.05).joueurs[0].degatsTap === hx.joueurs[0].degatsTap)
const bienLache = lache(pose, (EL.elan!.zone[0] + EL.elan!.zone[1]) / 2)
verifier('lâché dans la zone, rien ne frappe encore, et la série continue', bienLache.joueurs[0].degatsTap === hx.joueurs[0].degatsTap && bienLache.joueurs[0].passif.rang === 1)
verifier('trop tard (la zone passée), raté', lache(pose, EL.elan!.zone[1] + 0.02).joueurs[0].degatsTap === hx.joueurs[0].degatsTap)
// Le deuxième élan manqué : les deux réussis tombent en UN coup, ×20 chacun (Keko : « un gros coup à la fin »).
const evH2 = evenementA(C, bienLache.saison.seed, bienLache.joueurs[0], bienLache.joueurs[0].passif.debut)!
const pose2 = appliquer(C, bienLache, { joueur: 'a', t: evH2.debut + 10, type: 'toucher', evenement: evH.k, cible: 0 })
const deuxBons = appliquer(C, appliquer(C, pose2, { joueur: 'a', t: evH2.debut + 10 + chargeDe(EL, 1) * 0.82, type: 'toucher', evenement: evH.k, cible: 1 }), { joueur: 'a', t: evH2.debut + 10 + chargeDe(EL, 1) * 0.82 + 1, type: 'toucher', evenement: evH.k, cible: 0 })
const finElan = appliquer(C, deuxBons, { joueur: 'a', t: deuxBons.joueurs[0].passif.debut + 10, type: 'toucher', evenement: evH.k, cible: 0 })
const rateElan = appliquer(C, finElan, { joueur: 'a', t: deuxBons.joueurs[0].passif.debut + 20, type: 'toucher', evenement: evH.k, cible: 1 })
verifier('deux élans réussis, puis manqué : un seul coup ×40', rateElan.joueurs[0].passif.dernier?.detail?.length === 1 && rateElan.joueurs[0].passif.dernier?.coups === 2 && rateElan.joueurs[0].degatsTap - hx.joueurs[0].degatsTap >= degatsDuTap(C, hx.joueurs[0]) * EL.coup * 2 * (1 - C.tap.ecart) - 1)
verifier('la charge suivante, plus courte', Math.abs(chargeDe(EL, 1) - EL.elan!.charge * EL.serie!.raccourci) < 1e-9)
// La lance et la rapière ont les Points faibles de la dague.
for (const arme of ['lance', 'rapiere'] as const) {
  const jP = appliquer(C, c0, { joueur: 'a', t: 100, type: 'equiper', arme }).joueurs[0]
  verifier(`${C.armes[arme].nom} : les Points faibles de la dague`, passifDe(C, jP)?.nom === 'Points faibles' && passifDe(C, jP)?.cumul === true)
}
for (const arme of ['hache', 'hacheDeuxMains', 'massue', 'massueDeuxMains', 'lance', 'marteau', 'marteauDeuxMains', 'arbalete', 'pistolet', 'mousquet', 'rapiere', 'fouet', 'fleau', 'griffes', 'fronde', 'shuriken', 'boomerang', 'kunai', 'couteau', 'luth', 'baguette'] as const) {
  const jH = appliquer(C, c0, { joueur: 'a', t: 100, type: 'equiper', arme }).joueurs[0]
  const aSonPassif = (['hache', 'hacheDeuxMains', 'lance', 'rapiere', 'massue', 'massueDeuxMains', 'marteau', 'marteauDeuxMains', 'fleau', 'baguette', 'griffes', 'fouet'] as string[]).includes(arme)
  verifier(`${C.armes[arme].nom} s'équipe, sans capacité${aSonPassif ? '' : ' ni passif'}`, jH.arme === arme && capacitesDe(C, jH).length === 0 && (aSonPassif || passifDe(C, jH) === null))
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

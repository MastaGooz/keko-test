/**
 * Vérifications du donjon coopératif, sans navigateur et sans attendre : le
 * temps est injecté.
 */
import { DONJON } from './config.ts'
import { nomDeLEnnemi, pvDeLEtage } from './ennemi.ts'
import { changerDeVitesse, nouvelleHorloge, tempsDeJeu } from './horloge.ts'
import { appliquer, avancer, dpsDe, efficaciteDuTap, etatInitial } from './regles.ts'
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

const tue = appliquer(C, e, { joueur: 'a', t: 1000, type: 'taper', n: 50 })
verifier('assez de taps achèvent l\'ennemi', tue.ennemi.etage > 1 && tue.joueurs[0].kills >= 1)
verifier('le coup fatal donne un point', tue.joueurs[0].points >= 1)

const achete = appliquer(C, tue, { joueur: 'a', t: 2000, type: 'acheter', quoi: 'auto' })
verifier('acheter l\'auto-tap le renforce', dpsDe(C, achete.joueurs[0]) > dpsDe(C, tue.joueurs[0]))
const sansPoints = { ...achete, joueurs: achete.joueurs.map((j) => ({ ...j, points: 0 })) }
verifier('sans points, rien ne s\'achète', appliquer(C, sansPoints, { joueur: 'a', t: 3000, type: 'acheter', quoi: 'tap' }).joueurs[0].ameliorations.tap === 0)

const P = C.auto.periode
verifier('l\'auto frappe dès le début, sans rien acheter', avancer(C, e, 10 * P).joueurs[0].degatsAuto > 0)
verifier('l\'auto frappe par coups : rien avant le premier', avancer(C, e, P - 1).joueurs[0].degatsAuto === 0 && avancer(C, e, P).joueurs[0].degatsAuto > 0)
const epuise = { ...e, joueurs: e.joueurs.map((j) => ({ ...j, fatigue: 500, repos: 60 })) }
verifier('l\'auto ignore la fatigue et le repos', avancer(C, epuise, 20 * P).joueurs[0].degatsAuto === avancer(C, e, 20 * P).joueurs[0].degatsAuto)
const pvDeux = avancer(C, avancer(C, e, 7 * P + 300), 31 * P + 10)
verifier('l\'auto en deux fois = en une (coups)', pvDeux.ennemi.pv === avancer(C, e, 31 * P + 10).ennemi.pv)

const plusTard = avancer(C, achete, 2000 + H)
verifier('l\'auto-tap frappe en l\'absence', plusTard.joueurs[0].degatsAuto > 0)
const enDeux = avancer(C, avancer(C, achete, 2000 + H / 2), 2000 + H)
verifier('avancer en deux fois = en une', Math.abs(enDeux.joueurs[0].degatsAuto - plusTard.joueurs[0].degatsAuto) < 1e-6 && enDeux.ennemi.etage === plusTard.ennemi.etage)
verifier('avancer ne recule pas', avancer(C, plusTard, 0) === plusTard)

verifier('sous le seuil, le tap frappe à plein', efficaciteDuTap(C, 0) === 1)
verifier('au-delà, il rend moins', efficaciteDuTap(C, C.fatigue.seuil + 20) < 0.5)
const spam = appliquer(C, e, { joueur: 'a', t: 1000, type: 'taper', n: 200 })
const sage = appliquer(C, e, { joueur: 'a', t: 1000, type: 'taper', n: C.fatigue.seuil })
const parTapSpam = spam.joueurs[0].degatsTap / 200
const parTapSage = sage.joueurs[0].degatsTap / C.fatigue.seuil
verifier('le spam rend moins par tap', parTapSpam < parTapSage)

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

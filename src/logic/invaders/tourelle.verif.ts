/**
 * Vérifications de la tourelle, sans navigateur : le temps est injecté.
 */
import { AMELIORATIONS, avancerTourelle, cadenceDe, choisir, degatsDe, nombreDEnnemis, nouvelleTourelle, pvMaxDe, TOURELLE as C, type EtatTourelle, type EvenementTourelle } from './tourelle.ts'

let echecs = 0
function verifier(quoi: string, vrai: boolean): void {
  if (!vrai) echecs += 1
  console.log(`  ${vrai ? 'ok  ' : 'ECHEC'}  ${quoi}`)
}

console.log('tourelle')

const PAS = 1000 / 60
function jouer(e: EtatTourelle, ms: number): { etat: EtatTourelle; evenements: EvenementTourelle[] } {
  const tous: EvenementTourelle[] = []
  for (let t = 0; t < ms && e.phase === 'vague'; t += PAS) {
    const r = avancerTourelle(C, e, PAS)
    e = r.etat
    tous.push(...r.evenements)
  }
  return { etat: e, evenements: tous }
}

const e0 = nouvelleTourelle(C, 3)
verifier('une partie neuve : vague 1, PV pleins, rien à choisir', e0.vague === 1 && e0.pv === C.pv && e0.phase === 'vague' && e0.aFaireEntrer === nombreDEnnemis(C, 1))
verifier('même graine, même partie', JSON.stringify(jouer(nouvelleTourelle(C, 3), 20_000).etat) === JSON.stringify(jouer(nouvelleTourelle(C, 3), 20_000).etat))

const vague1 = jouer(e0, 120_000)
verifier('la tourelle tire seule et abat des ennemis', vague1.evenements.some((x) => x.type === 'tir') && vague1.evenements.some((x) => x.type === 'detruit') && vague1.etat.score > 0)
verifier('la première vague se gagne sans rien prendre', vague1.etat.phase === 'choix')
verifier("l'offre : trois améliorations différentes", vague1.etat.offre.length === 3 && new Set(vague1.etat.offre).size === 3)
verifier('pas de Réparation offerte aux PV pleins', vague1.etat.pv < C.pv || !vague1.etat.offre.includes('soin'))

const choix = choisir(C, vague1.etat, 0).etat
const k = vague1.etat.offre[0]
verifier("choisir : l'amélioration gagne un rang, la vague 2 part", (k === 'soin' || choix.rangs[k] === 1) && choix.vague === 2 && choix.phase === 'vague')
verifier('on ne choisit pas pendant une vague', choisir(C, choix, 0).etat === choix)

const avec = (cle: keyof typeof AMELIORATIONS, r: number): EtatTourelle => ({ ...e0, rangs: { ...e0.rangs, [cle]: r } })
verifier('Canons lourds : plus de dégâts', degatsDe(C, avec('degats', 1)) > degatsDe(C, e0))
verifier('Culasse rapide : on tire plus souvent', cadenceDe(C, avec('cadence', 1)) < cadenceDe(C, e0))
verifier('Blindage : plus de PV max', pvMaxDe(C, avec('pv', 1)) === C.pv + 4)
const plein = { ...vague1.etat, rangs: { ...vague1.etat.rangs, gerbe: 4 }, offre: ['gerbe' as const] }
verifier('une amélioration au maximum ne monte plus', AMELIORATIONS.gerbe.max === 4 && choisir(C, plein, 0).etat.rangs.gerbe === 4)

// Un ennemi au contact frappe ; le bouclier absorbe le premier choc.
const contact: EtatTourelle = { ...e0, aFaireEntrer: 0, ennemis: [{ id: 99, type: 'soldat', vague: 1, x: C.x, y: C.y - 4, pv: 3, pvMax: 3, ne: 0, phase: 0 }] }
verifier('un ennemi au contact frappe la tourelle', avancerTourelle(C, contact, PAS).etat.pv === C.pv - C.ennemis.soldat.degats)
verifier('le bouclier absorbe le choc', avancerTourelle(C, { ...contact, bouclier: 1 }, PAS).etat.pv === C.pv)
const fin = avancerTourelle(C, { ...contact, pv: 1 }, PAS)
verifier('sans PV, la partie est perdue', fin.etat.phase === 'perdu' && fin.evenements.some((x) => x.type === 'perdu'))

// Sans rien prendre, les vagues finissent par l'emporter.
let sansRien = nouvelleTourelle(C, 5)
for (let n = 0; n < 3e5 && sansRien.phase !== 'perdu'; n++) sansRien = sansRien.phase === 'choix' ? choisir(C, { ...sansRien, offre: ['soin'] }, 0).etat : avancerTourelle(C, sansRien, PAS).etat
verifier('sans amélioration, la tourelle tombe en quelques vagues', sansRien.phase === 'perdu' && sansRien.vague >= 2 && sansRien.vague <= 8)

console.log(echecs === 0 ? 'Tout passe.' : `${echecs} echec(s).`)
if (echecs > 0) throw new Error(`${echecs} verification(s) en echec`)

/**
 * Vérifications des quêtes, sans navigateur.
 */
import { ACTIVITES, CATALOGUE, estTerminee, lireQuetes, modeleDe, noter, ongletOuvert, quetesNeuves, quetesSansTutoriel, reclamer, tutorielFini, TUTORIEL, type EtatQuetes } from './quetes.ts'

let echecs = 0
function verifier(quoi: string, vrai: boolean): void {
  if (!vrai) echecs += 1
  console.log(`  ${vrai ? 'ok  ' : 'ECHEC'}  ${quoi}`)
}

console.log('quetes')
verifier('des identifiants uniques ; chaque quête a une cible et une récompense ; le catalogue a au moins deux quêtes par activité', new Set([...TUTORIEL, ...CATALOGUE].map((q) => q.id)).size === TUTORIEL.length + CATALOGUE.length && [...TUTORIEL, ...CATALOGUE].every((q) => q.cible > 0 && q.credits > 0) && ACTIVITES.every((a) => CATALOGUE.filter((q) => q.activite === a).length >= 2) && TUTORIEL.every((q) => q.activite === undefined))
const neuf = quetesNeuves()
verifier('au départ : la première quête du tutoriel, seule ; ni le commerce ni la tech ne sont ouverts', neuf.etape === 0 && neuf.actives.length === 1 && neuf.actives[0].modele === TUTORIEL[0].id && !ongletOuvert(neuf, 'entrepot') && !ongletOuvert(neuf, 'labo') && !tutorielFini(neuf))
verifier('ce qui ne concerne pas la quête ne la fait pas avancer (le même état est rendu)', noter(neuf, 'fer', 5) === neuf && noter(neuf, 'extractions', 0) === neuf)
const vole = noter(neuf, 'extractions', 1)
verifier('ce qu’elle compte la fait avancer, jamais au-delà de sa cible ; l’état d’avant ne bouge pas', estTerminee(vole.actives[0]) && noter(vole, 'extractions', 3).actives[0].progres === 1 && !estTerminee(neuf.actives[0]))
verifier('on ne réclame pas une quête qui n’est pas terminée', reclamer(neuf, 0, 0) === null && reclamer(vole, 5, 0) === null)
const r1 = reclamer(vole, 0, 100)!
verifier('réclamer : les crédits de la quête, et la suivante du tutoriel prend sa place', r1 !== null && r1.credits === 100 + TUTORIEL[0].credits && r1.etat.etape === 1 && r1.etat.actives.length === 1 && r1.etat.actives[0].modele === TUTORIEL[1].id && r1.etat.actives[0].progres === 0 && r1.ouvre === undefined)

// le tutoriel jusqu'au bout : il ouvre le commerce, puis la tech
let e: EtatQuetes = neuf
let credits = 0
const ouverts: string[] = []
for (const etape of TUTORIEL) {
  e = noter(e, etape.compteur, etape.cible)
  const r = reclamer(e, 0, credits)!
  e = r.etat
  credits = r.credits
  if (r.ouvre !== undefined) ouverts.push(r.ouvre)
}
verifier('le tutoriel ouvre le commerce puis la tech, dans cet ordre, et paie chaque étape', ouverts.join(',') === 'entrepot,labo' && credits === TUTORIEL.reduce((a, q) => a + q.credits, 0))
const apres2 = reclamer(noter(r1.etat, 'pepites', 1), 0, 0)!
verifier('le commerce s’ouvre en réclamant la première extraction, pas avant ; la tech reste fermée', !ongletOuvert(r1.etat, 'entrepot') && apres2.ouvre === 'entrepot' && ongletOuvert(apres2.etat, 'entrepot') && !ongletOuvert(apres2.etat, 'labo'))
verifier('le tutoriel fini : une quête active PAR ACTIVITÉ, tous les onglets ouverts', tutorielFini(e) && e.actives.length === ACTIVITES.length && ACTIVITES.every((a, i) => modeleDe(e.actives[i].modele)?.activite === a) && ongletOuvert(e, 'entrepot') && ongletOuvert(e, 'labo'))

// le catalogue : en parallèle, remplacée par une autre de la même activité
const libre = quetesSansTutoriel()
const iMinage = 0
const moMinage = modeleDe(libre.actives[iMinage].modele)!
const avance = noter(noter(libre, moMinage.compteur, moMinage.cible), 'rivaux', 1)
verifier('les quêtes avancent en parallèle : chacune compte ce qui la concerne', estTerminee(avance.actives[iMinage]) && avance.actives[1].progres === 1)
const rc = reclamer(avance, iMinage, 0)!
verifier('réclamée, elle est remplacée par UNE AUTRE de la même activité ; les autres gardent leur avancée', rc.credits === moMinage.credits && modeleDe(rc.etat.actives[iMinage].modele)?.activite === 'minage' && rc.etat.actives[iMinage].modele !== moMinage.id && rc.etat.actives[iMinage].progres === 0 && rc.etat.actives[1].progres === 1 && rc.etat.actives.length === ACTIVITES.length)
verifier('le tirage est seedé : le même état donne la même remplaçante', reclamer(avance, iMinage, 0)!.etat.actives[iMinage].modele === rc.etat.actives[iMinage].modele)
let boucle = libre
const vues = new Set<string>()
for (let i = 0; i < 40; i++) {
  const mo = modeleDe(boucle.actives[0].modele)!
  vues.add(mo.id)
  boucle = reclamer(noter(boucle, mo.compteur, mo.cible), 0, 0)!.etat
}
verifier('à force de réclamer, tout le catalogue d’une activité passe', vues.size === CATALOGUE.filter((q) => q.activite === 'minage').length)

// la distance : on garde la plus grande
const loin: EtatQuetes = { etape: TUTORIEL.length, actives: [{ modele: 'e-loin', progres: 0 }], tirage: 1 }
verifier('une distance garde la plus grande atteinte, elle ne s’additionne pas', noter(noter(loin, 'distance', 300), 'distance', 250).actives[0].progres === 300 && estTerminee(noter(loin, 'distance', 900).actives[0]))

// la relecture
verifier('rien de gardé : des quêtes neuves — ou le tutoriel passé pour qui a déjà joué', lireQuetes(undefined, false).etape === 0 && tutorielFini(lireQuetes(undefined, true)) && lireQuetes(undefined, true).actives.length === ACTIVITES.length)
const relu = lireQuetes({ etape: 1, actives: [{ modele: 'inconnue', progres: 9 }, { modele: TUTORIEL[1].id, progres: 99 }], tirage: 4 }, false)
verifier('relu sans confiance : la quête de l’étape, son avancée bornée à la cible ; les inconnues tombent', relu.etape === 1 && relu.actives.length === 1 && relu.actives[0].modele === TUTORIEL[1].id && relu.actives[0].progres === TUTORIEL[1].cible && relu.tirage === 4)
const troue = lireQuetes({ etape: 99, actives: [{ modele: 'c-rival', progres: 0.5 }], tirage: 2 }, false)
verifier('après le tutoriel, une quête par activité : celles qui manquent sont tirées, celle qu’on a est gardée', tutorielFini(troue) && troue.actives.length === ACTIVITES.length && troue.actives[1].modele === 'c-rival' && ACTIVITES.every((a, i) => modeleDe(troue.actives[i].modele)?.activite === a))

if (echecs > 0) throw new Error(`${echecs} verification(s) en echec`)
console.log('Tout passe.')

/**
 * Vérifications de la flotte (les vaisseaux, leurs pièces, leurs missions), sans navigateur.
 */
import { ajouterLeVaisseau, avecLeHangar, choisirLeVaisseau, coutEnMinerai, estDuModele, flotteNeuve, hangarActif, lireFlotte, missionDe, MODELES, modeleDeVaisseau, noterEnVol, pieceOuverteSur, reclamerLaMission, vaisseauxDe } from './flotte.ts'
import { acheter, capacite, configDuHangar, monterA, peutAcheter, pieceDe, placeLourde, poidsTotal } from './hangar.ts'
import { VAISSEAU as C } from './jeu.ts'

let echecs = 0
function verifier(quoi: string, vrai: boolean): void {
  if (!vrai) echecs += 1
  console.log(`  ${vrai ? 'ok  ' : 'ECHEC'}  ${quoi}`)
}

console.log('flotte')
verifier('chaque modèle : des pièces du catalogue, sa série parmi elles, une suite de missions qui ouvre ses pièces, chacune une fois', MODELES.every((mo) => mo.pieces.every((id) => pieceDe(id) !== undefined) && mo.serie.possedees.every((id) => mo.pieces.includes(id)) && mo.chaine.every((mi) => mo.pieces.includes(mi.ouvre) && !mo.serie.possedees.includes(mi.ouvre) && mi.cible > 0) && new Set(mo.chaine.map((mi) => mi.ouvre)).size === mo.chaine.length))
verifier('toute pièce d’un modèle hors de sa série est ouverte par une de ses missions', MODELES.every((mo) => mo.pieces.filter((id) => !mo.serie.possedees.includes(id)).every((id) => mo.chaine.some((mi) => mi.ouvre === id))))
verifier('toute pièce qui n’est pas de série coûte des crédits ET du minerai', MODELES.every((mo) => mo.chaine.every((mi) => (pieceDe(mi.ouvre)?.prix ?? 0) > 0 && Object.values(coutEnMinerai(mi.ouvre)).some((x) => x > 0))))
const neuve = flotteNeuve()
verifier('une flotte neuve : le chasseur seul, piloté, rien d’ouvert, sa première mission à zéro', vaisseauxDe(neuve).length === 1 && neuve.actif === 'chasseur' && !pieceOuverteSur(neuve, 'propulseur-2') && missionDe(neuve, 'chasseur')?.progres === 0 && missionDe(neuve, 'cuirasse') === null)
verifier('le chasseur ne porte pas les pièces du cuirassé', estDuModele(neuve, 'propulseur-2') && !estDuModele(neuve, 'propulseur-l1') && !estDuModele(neuve, 'arme-missiles') && !estDuModele(neuve, 'coque-4'))

// LA MISSION D'UN VAISSEAU : elle n'avance qu'en le pilotant, et ouvre une pièce À L'ACHAT, sur lui seul
const m1 = modeleDeVaisseau('chasseur').chaine[0]
const autre = noterEnVol(neuve, 'rivaux', 5)
verifier('ce que la mission ne compte pas ne l’avance pas', autre === neuve)
const moitie = noterEnVol(neuve, m1.compteur, 1)
const pleine = noterEnVol(moitie, m1.compteur, 99)
verifier('elle avance, sans dépasser sa cible ; pas finie, elle ne se réclame pas', missionDe(moitie, 'chasseur')?.progres === 1 && missionDe(pleine, 'chasseur')?.progres === m1.cible && missionDe(pleine, 'chasseur')?.finie === true && reclamerLaMission(moitie, 'chasseur') === null)
const r1 = reclamerLaMission(pleine, 'chasseur')!
verifier('réclamée : sa pièce est OUVERTE (pas possédée), la mission suivante commence à zéro', r1.ouvre === m1.ouvre && pieceOuverteSur(r1.flotte, m1.ouvre) && !hangarActif(r1.flotte).possedees.includes(m1.ouvre) && missionDe(r1.flotte, 'chasseur')?.mission === modeleDeVaisseau('chasseur').chaine[1] && missionDe(r1.flotte, 'chasseur')?.progres === 0)
const deux = ajouterLeVaisseau(r1.flotte, 'cuirasse')
verifier('un vaisseau débloqué rejoint la flotte, nu, sans changer de pilote ; deux fois ne change rien', vaisseauxDe(deux).length === 2 && deux.actif === 'chasseur' && ajouterLeVaisseau(deux, 'cuirasse') === deux && deux.vaisseaux.cuirasse.ouvertes.length === 0)
const sur = choisirLeVaisseau(deux, 'cuirasse')
verifier('une pièce ouverte sur un vaisseau ne l’est pas sur l’autre', !pieceOuverteSur(sur, m1.ouvre) && pieceOuverteSur(deux, m1.ouvre))
const enCuirasse = noterEnVol(sur, 'vols', 1)
verifier('piloter le cuirassé avance SA mission, pas celle du chasseur', missionDe(enCuirasse, 'cuirasse')?.progres === 1 && missionDe(enCuirasse, 'chasseur')?.progres === 0)

// L'ACHAT : crédits ET minerai
const h = hangarActif(r1.flotte)
const prix = pieceDe(m1.ouvre)!.prix
const cout = coutEnMinerai(m1.ouvre)
const pauvre = { fer: 0, or: 0, cristal: 0 }
const riche = { fer: 500, or: 500, cristal: 500 }
verifier('sans le minerai, on n’achète pas, même riche en crédits ; avec, si', !peutAcheter(h, 9999, m1.ouvre, pauvre) && acheter(h, 9999, m1.ouvre, pauvre) === null && peutAcheter(h, prix, m1.ouvre, riche) && !peutAcheter(h, prix - 1, m1.ouvre, riche))
const a = acheter(h, 1000, m1.ouvre, riche)!
verifier('acheter paie les crédits et le minerai ; le trésor d’avant ne bouge pas', a.credits === 1000 - prix && a.tresor.fer === 500 - cout.fer && a.tresor.or === 500 - cout.or && a.tresor.cristal === 500 - cout.cristal && riche.fer === 500 && a.hangar.possedees.includes(m1.ouvre))

// LE CUIRASSÉ : ses places lourdes, ses propulseurs à lui
const hc = hangarActif(sur)
const cc = configDuHangar(C, hc)
const sc = configDuHangar(C, hangarActif(neuve))
verifier('le cuirassé de série : à tourelles, bien plus lent, bien moins maniable et bien plus lourd que le chasseur', cc.tourelles && !sc.tourelles && cc.vitesseMax < sc.vitesseMax / 2 && cc.rotation < sc.rotation / 5 && poidsTotal(hc) > 3 * poidsTotal(hangarActif(neuve)) && cc.poussee < sc.poussee)
verifier('huit places d’arme, les deux dernières lourdes', capacite(hc, 'arme') === 8 && !placeLourde(hc, 5) && placeLourde(hc, 6) && placeLourde(hc, 7))
const arme = { ...hc, possedees: [...hc.possedees, 'arme-missiles'] }
verifier('une arme lourde ne va qu’à une place lourde, une légère qu’à une place légère', monterA(arme, 'arme-missiles', 0) === arme && monterA(arme, 'arme-missiles', 6).armes[6] === 'arme-missiles' && monterA(arme, 'arme-canon', 7) === arme && monterA(arme, 'arme-canon', 3).armes[3] === 'arme-canon')
verifier('la maniabilité vient du propulseur : le moteur de remorqueur vire mieux que celui de ligne', configDuHangar(C, { ...hc, possedees: [...hc.possedees, 'propulseur-l2'], montees: { ...hc.montees, propulseur: 'propulseur-l2' } }).rotation > cc.rotation)

// LA RELECTURE
const relue = lireFlotte(JSON.parse(JSON.stringify(avecLeHangar(enCuirasse, hangarActif(enCuirasse)))))
verifier('une flotte relue est la même', JSON.stringify(relue) === JSON.stringify(enCuirasse))
verifier('rien de gardé : une flotte neuve ; la recherche y ajoute ses vaisseaux', JSON.stringify(lireFlotte(null)) === JSON.stringify(neuve) && vaisseauxDe(lireFlotte(null, ['cuirasse'])).length === 2 && lireFlotte({ actif: 'cuirasse', vaisseaux: {} }).actif === 'chasseur')
const ancienne = lireFlotte(undefined, [], { possedees: ['propulseur-1', 'coque-1', 'foreuse-1', 'propulseur-2', 'arme-missiles', 'arme-canon'], montees: { coque: 'coque-1', propulseur: 'propulseur-2' }, outils: ['foreuse-1'], armes: ['arme-missiles'] }, ['m-foreuse-2', 'c-missiles', 'm-debit'])
verifier('une sauvegarde d’avant la flotte : son hangar devient celui du chasseur, sans ce qu’il ne porte pas ; les pièces de sa recherche restent ouvertes', hangarActif(ancienne).montees.propulseur === 'propulseur-2' && !hangarActif(ancienne).possedees.includes('arme-missiles') && hangarActif(ancienne).armes.join('') === '' && hangarActif(ancienne).possedees.includes('arme-canon') && pieceOuverteSur(ancienne, 'foreuse-2') && !pieceOuverteSur(ancienne, 'arme-missiles'))
verifier('… et sa suite de missions saute les pièces qu’elle a déjà', missionDe(ancienne, 'chasseur')?.mission.ouvre === 'coque-2')
verifier('une flotte abîmée se relit sans planter', lireFlotte({ actif: 3, vaisseaux: { chasseur: { hangar: 'x', ouvertes: [1, 'coque-4', 'coque-2', 'coque-2'], rang: -4, progres: 'a' } } }).vaisseaux.chasseur.ouvertes.join() === 'coque-2')

if (echecs > 0) throw new Error(`${echecs} verification(s) en echec`)
console.log('Tout passe.')

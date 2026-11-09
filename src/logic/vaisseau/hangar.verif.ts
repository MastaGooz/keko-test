/**
 * Vérifications du hangar, sans navigateur.
 */
import { acheter, configDuHangar, EMPLACEMENTS, hangarNeuf, lireHangar, lireTresor, monteeA, monter, peutAcheter, PIECES, piecesDe } from './hangar.ts'
import { avancerLeMonde, nouveauMonde, VAISSEAU as C } from './jeu.ts'

let echecs = 0
function verifier(quoi: string, vrai: boolean): void {
  if (!vrai) echecs += 1
  console.log(`  ${vrai ? 'ok  ' : 'ECHEC'}  ${quoi}`)
}

console.log('hangar')
verifier('chaque emplacement a trois crans, le premier gratuit', EMPLACEMENTS.every((e) => piecesDe(e).length === 3 && piecesDe(e)[0].cran === 1 && piecesDe(e)[0].prix.fer === 0) && PIECES.every((p) => p.id === `${p.emplacement}-${p.cran}`))
const neuf = hangarNeuf()
verifier('un hangar neuf possède les pièces de série, et les a montées', neuf.possedees.length === 2 && EMPLACEMENTS.every((e) => monteeA(neuf, e).cran === 1))
const pauvre = { fer: 5, or: 0, cristal: 0 }
verifier('sans assez de fer, on n’achète pas', !peutAcheter(neuf, pauvre, 'propulseur-2') && acheter(neuf, pauvre, 'propulseur-2') === null)
verifier('une pièce de série ne s’achète pas (on l’a)', !peutAcheter(neuf, { fer: 99, or: 0, cristal: 0 }, 'propulseur-1'))
const riche = { fer: 25, or: 3, cristal: 0 }
const a = acheter(neuf, riche, 'propulseur-2')!
verifier('l’achat paie le prix, possède et monte la pièce ; le hangar d’avant ne bouge pas', a !== null && a.tresor.fer === 13 && a.tresor.or === 3 && a.hangar.possedees.includes('propulseur-2') && monteeA(a.hangar, 'propulseur').id === 'propulseur-2' && !neuf.possedees.includes('propulseur-2'))
verifier('on ne rachète pas une pièce possédée', !peutAcheter(a.hangar, a.tresor, 'propulseur-2'))
const remis = monter(a.hangar, 'propulseur-1')
verifier('on remonte la pièce de série, la renforcée reste possédée', monteeA(remis, 'propulseur').cran === 1 && remis.possedees.includes('propulseur-2'))
verifier('monter une pièce qu’on n’a pas ne change rien', monter(remis, 'foreuse-3') === remis)

const cfg = configDuHangar(C, a.hangar)
verifier('la configuration suit les pièces montées (propulseur renforcé : poussée ×1,25, pointe ×1,15 ; foreuse de série)', Math.abs(cfg.poussee - C.poussee * 1.25) < 1e-9 && Math.abs(cfg.vitesseMax - C.vitesseMax * 1.15) < 1e-9 && cfg.foreuse.debit === 1 && cfg.rotation === C.rotation && cfg.ennemi.vitesseMax === C.ennemi.vitesseMax)
verifier('la configuration de série est inchangée par un hangar neuf', JSON.stringify(configDuHangar(C, neuf)) === JSON.stringify(C))
// le vaisseau de série et le renforcé, poussés deux secondes : le renforcé est plus loin
const serie = nouveauMonde(C)
const renforce = nouveauMonde(cfg)
for (let i = 0; i < 120; i++) {
  avancerLeMonde(C, serie, 1 / 60, { x: 1, y: 0 })
  avancerLeMonde(cfg, renforce, 1 / 60, { x: 1, y: 0 })
}
verifier('poussé deux secondes, le vaisseau renforcé est plus loin que celui de série', renforce.vaisseau.x > serie.vaisseau.x * 1.1)
// la foreuse à long faisceau : le foreur du joueur porte plus loin que celui du rival
const longue = configDuHangar(C, acheter(neuf, { fer: 99, or: 0, cristal: 0 }, 'foreuse-3')!.hangar)
verifier('la foreuse à long faisceau porte au-delà de la tenue du rival ; le forage partagé reste de série', C.forage.portee * longue.foreuse.portee >= C.ennemi.tient && longue.forage.portee === C.forage.portee && longue.foreuse.debit === 1.8)

const relu = lireHangar({ possedees: ['foreuse-2', 'inconnue', 42, 'propulseur-3'], montees: { propulseur: 'propulseur-3', foreuse: 'foreuse-3' } })
verifier('relu : les inconnues tombent, les séries restent, la foreuse 3 non possédée redevient de série', relu.possedees.length === 4 && !relu.possedees.includes('inconnue') && monteeA(relu, 'propulseur').cran === 3 && monteeA(relu, 'foreuse').cran === 1)
verifier('relu : n’importe quoi donne un hangar neuf', JSON.stringify(lireHangar(null)) === JSON.stringify(hangarNeuf()) && JSON.stringify(lireHangar('x')) === JSON.stringify(hangarNeuf()))
verifier('relu : une pièce montée au mauvais emplacement redevient de série', monteeA(lireHangar({ possedees: ['foreuse-2'], montees: { propulseur: 'foreuse-2' } }), 'propulseur').cran === 1)
const tr = lireTresor({ fer: 7.9, or: -3, cristal: 'x', autre: 1 })
verifier('le trésor relu : des entiers positifs, zéro sinon', tr.fer === 7 && tr.or === 0 && tr.cristal === 0 && lireTresor(undefined).fer === 0)

if (echecs > 0) throw new Error(`${echecs} verification(s) en echec`)
console.log('Tout passe.')

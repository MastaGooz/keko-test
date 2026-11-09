/**
 * Vérifications du hangar, sans navigateur.
 */
import { acheter, ARMES_MAX, armesMax, armesMontees, configDuHangar, demonter, EMPLACEMENTS, estMontee, hangarNeuf, jaugesDe, lireHangar, lireTresor, monteeA, monter, peutAcheter, PIECES, piecesDe } from './hangar.ts'
import { avancerLeMonde, nouveauMonde, VAISSEAU as C } from './jeu.ts'

let echecs = 0
function verifier(quoi: string, vrai: boolean): void {
  if (!vrai) echecs += 1
  console.log(`  ${vrai ? 'ok  ' : 'ECHEC'}  ${quoi}`)
}

console.log('hangar')
verifier('chaque emplacement a trois crans, le premier gratuit ; trois armes, aucune gratuite', EMPLACEMENTS.every((e) => piecesDe(e).length === 3 && piecesDe(e)[0].cran === 1 && piecesDe(e)[0].prix.fer === 0) && piecesDe('arme').length === 3 && piecesDe('arme').every((p) => p.arme !== undefined && p.prix.fer > 0) && PIECES.every((p) => p.sorte === 'arme' || p.id === `${p.sorte}-${p.cran}`))
const neuf = hangarNeuf()
verifier('un hangar neuf possède les pièces de série, les a montées, et n’a pas d’arme', neuf.possedees.length === 3 && EMPLACEMENTS.every((e) => monteeA(neuf, e).cran === 1) && neuf.armes.length === 0)
const pauvre = { fer: 5, or: 0, cristal: 0 }
verifier('sans assez de fer, on n’achète pas', !peutAcheter(neuf, pauvre, 'propulseur-2') && acheter(neuf, pauvre, 'propulseur-2') === null)
verifier('une pièce de série ne s’achète pas (on l’a)', !peutAcheter(neuf, { fer: 99, or: 0, cristal: 0 }, 'propulseur-1'))
const riche = { fer: 25, or: 3, cristal: 0 }
const a = acheter(neuf, riche, 'propulseur-2')!
verifier('l’achat paie le prix, possède et monte la pièce ; le hangar d’avant ne bouge pas', a !== null && a.tresor.fer === 13 && a.tresor.or === 3 && a.hangar.possedees.includes('propulseur-2') && monteeA(a.hangar, 'propulseur').id === 'propulseur-2' && estMontee(a.hangar, 'propulseur-2') && !neuf.possedees.includes('propulseur-2'))
verifier('on ne rachète pas une pièce possédée', !peutAcheter(a.hangar, a.tresor, 'propulseur-2'))
const remis = monter(a.hangar, 'propulseur-1')
verifier('on remonte la pièce de série, la renforcée reste possédée', monteeA(remis, 'propulseur').cran === 1 && remis.possedees.includes('propulseur-2'))
verifier('monter une pièce qu’on n’a pas ne change rien', monter(remis, 'foreuse-3') === remis)

// les armes : autant que la coque en porte (une de série, deux blindée), qu'on monte et démonte
const RICHE = { fer: 999, or: 0, cristal: 0 }
let h = acheter(neuf, RICHE, 'arme-canon')!.hangar
h = acheter(h, RICHE, 'arme-rafale')!.hangar
verifier('la coque de série porte une arme : la seconde achetée reste possédée, pas montée', armesMax(h) === 1 && h.armes.join(',') === 'arme-canon' && h.possedees.includes('arme-rafale'))
h = acheter(h, RICHE, 'coque-2')!.hangar
h = monter(h, 'arme-rafale')
h = acheter(h, RICHE, 'arme-missiles')!.hangar
verifier('la coque blindée en porte deux : la troisième reste possédée, pas montée', armesMax(h) === ARMES_MAX && h.armes.length === 2 && estMontee(h, 'arme-canon') && estMontee(h, 'arme-rafale') && !estMontee(h, 'arme-missiles') && h.possedees.includes('arme-missiles'))
verifier('remonter la coque de série démonte la seconde arme', monter(h, 'coque-1').armes.join(',') === 'arme-canon' && monter(monter(h, 'coque-1'), 'coque-2').armes.join(',') === 'arme-canon')
verifier('monter une arme de trop ne change rien', monter(h, 'arme-missiles') === h)
const h2 = monter(demonter(h, 'arme-canon'), 'arme-missiles')
verifier('démonter une arme libère la place ; l’ordre des armes est celui du montage', h2.armes.length === 2 && h2.armes[0] === 'arme-rafale' && h2.armes[1] === 'arme-missiles' && h2.possedees.includes('arme-canon'))
verifier('démonter une arme qui n’est pas montée ne change rien', demonter(h2, 'arme-canon') === h2)
verifier('la configuration porte les armes montées, dans l’ordre', configDuHangar(C, h2).armes.map((x) => x.id).join(',') === 'rafale,missiles' && armesMontees(h2).length === 2)

const cfg = configDuHangar(C, a.hangar)
verifier('la configuration suit les pièces montées (propulseur renforcé : poussée ×1,25, pointe ×1,15 ; le reste de série)', Math.abs(cfg.poussee - C.poussee * 1.25) < 1e-9 && Math.abs(cfg.vitesseMax - C.vitesseMax * 1.15) < 1e-9 && cfg.foreuse.debit === 1 && cfg.coque === C.coque && cfg.bouclier.points === 0 && cfg.armes.length === 0 && cfg.ennemi.vitesseMax === C.ennemi.vitesseMax)
verifier('la configuration de série est inchangée par un hangar neuf', JSON.stringify(configDuHangar(C, neuf)) === JSON.stringify(C))
const blindee = configDuHangar(C, acheter(neuf, RICHE, 'coque-2')!.hangar)
verifier('la coque blindée : 8 points, la poussée et le frein divisés par son poids', blindee.coque === 8 && Math.abs(blindee.poussee - C.poussee / 1.3) < 1e-9 && Math.abs(blindee.frein - C.frein / 1.3) < 1e-9 && blindee.vitesseMax === C.vitesseMax)
const bouclier = configDuHangar(C, acheter(neuf, RICHE, 'coque-3')!.hangar)
verifier('la coque à bouclier : 5 points et 2 de bouclier', bouclier.coque === 5 && bouclier.bouclier.points === 2 && bouclier.bouclier.delai === C.bouclier.delai)
// le vaisseau de série et le renforcé, poussés deux secondes : le renforcé est plus loin
const serie = nouveauMonde(C)
const renforce = nouveauMonde(cfg)
for (let i = 0; i < 120; i++) {
  avancerLeMonde(C, serie, 1 / 60, { x: 1, y: 0 })
  avancerLeMonde(cfg, renforce, 1 / 60, { x: 1, y: 0 })
}
verifier('poussé deux secondes, le vaisseau renforcé est plus loin que celui de série', renforce.vaisseau.x > serie.vaisseau.x * 1.1)
const longue = configDuHangar(C, acheter(neuf, RICHE, 'foreuse-3')!.hangar)
verifier('la foreuse à long faisceau : débit ×1,8, portée ×1,25, aimant ×1,6 ; le forage partagé reste de série', longue.foreuse.debit === 1.8 && longue.foreuse.portee === 1.25 && longue.foreuse.aimant === 1.6 && longue.forage.portee === C.forage.portee && longue.forage.aimant === C.forage.aimant)

const relu = lireHangar({ possedees: ['foreuse-2', 'inconnue', 42, 'propulseur-3', 'arme-canon', 'arme-rafale', 'arme-missiles'], montees: { propulseur: 'propulseur-3', foreuse: 'foreuse-3' }, armes: ['arme-canon', 'arme-canon', 'arme-rafale', 'arme-missiles', 'propulseur-3'] })
verifier('relu : les inconnues tombent, les séries restent, la foreuse 3 non possédée redevient de série, les armes bornées à ce que la coque (de série) porte, sans doublon', relu.possedees.length === 8 && !relu.possedees.includes('inconnue') && monteeA(relu, 'propulseur').cran === 3 && monteeA(relu, 'foreuse').cran === 1 && relu.armes.join(',') === 'arme-canon')
verifier('relu avec la coque blindée : deux armes', lireHangar({ possedees: ['coque-2', 'arme-canon', 'arme-rafale'], montees: { coque: 'coque-2' }, armes: ['arme-canon', 'arme-rafale'] }).armes.length === 2)
verifier('relu : n’importe quoi donne un hangar neuf', JSON.stringify(lireHangar(null)) === JSON.stringify(hangarNeuf()) && JSON.stringify(lireHangar('x')) === JSON.stringify(hangarNeuf()))
verifier('relu : une pièce montée au mauvais emplacement redevient de série ; une arme non possédée tombe', monteeA(lireHangar({ possedees: ['foreuse-2'], montees: { propulseur: 'foreuse-2' } }), 'propulseur').cran === 1 && lireHangar({ armes: ['arme-canon'] }).armes.length === 0)
verifier('relu : un hangar d’avant les armes (sans le champ) en a zéro', lireHangar({ possedees: ['propulseur-2'], montees: { propulseur: 'propulseur-2' } }).armes.length === 0)
const jc = jaugesDe(PIECES.find((p) => p.id === 'coque-3')!)
verifier('les jauges : la coque à bouclier dit blindage 5/8, bouclier 2/2, armes 2/2, poids 1,1/1,3 ; chaque sorte a ses jauges', jc.map((j) => `${j.nom} ${j.valeur}/${j.max}${j.cellules ? '#' : ''}`).join(';') === 'Blindage 5/8#;Bouclier 2/2#;Armes 2/2#;Poids 1.1/1.3' && PIECES.every((p) => jaugesDe(p).length >= 3 && jaugesDe(p).every((j) => j.valeur <= j.max && j.max > 0)))
const tr = lireTresor({ fer: 7.9, or: -3, cristal: 'x', autre: 1 })
verifier('le trésor relu : des entiers positifs, zéro sinon', tr.fer === 7 && tr.or === 0 && tr.cristal === 0 && lireTresor(undefined).fer === 0)

if (echecs > 0) throw new Error(`${echecs} verification(s) en echec`)
console.log('Tout passe.')

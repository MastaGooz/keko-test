/**
 * Vérifications du hangar, sans navigateur.
 */
import { acheter, armesMontees, capacite, POIDS_SERIE, poidsTotal, configDuHangar, demonter, EMPLACEMENTS, estMontee, FICHES_MINERAI, foreuseMontee, hangarNeuf, jaugesDe, lireCredits, lireHangar, lireTresor, monteeA, monter, peutAcheter, peutMonter, PIECES, piecesDe, radarMonte, vendre } from './hangar.ts'
import { avancerLeMonde, nouveauMonde, VAISSEAU as C } from './jeu.ts'

let echecs = 0
function verifier(quoi: string, vrai: boolean): void {
  if (!vrai) echecs += 1
  console.log(`  ${vrai ? 'ok  ' : 'ECHEC'}  ${quoi}`)
}

console.log('hangar')
verifier('chaque emplacement a trois crans, le premier gratuit ; trois foreuses et un radar en outils ; trois armes, aucune gratuite', EMPLACEMENTS.every((e) => piecesDe(e).length === 3 && piecesDe(e)[0].cran === 1 && piecesDe(e)[0].prix === 0) && piecesDe('outil').length === 4 && piecesDe('outil').filter((p) => p.famille === 'foreuse').length === 3 && piecesDe('arme').length === 3 && piecesDe('arme').every((p) => p.arme !== undefined && p.prix > 0) && PIECES.every((p) => p.sorte !== 'propulseur' && p.sorte !== 'coque' ? true : p.id === `${p.sorte}-${p.cran}`))
const neuf = hangarNeuf()
verifier('un hangar neuf : les pièces de série montées, la foreuse de série en outil, pas d’arme ; la coque de série porte un outil et une arme', neuf.possedees.length === 4 && EMPLACEMENTS.every((e) => monteeA(neuf, e).cran === 1) && neuf.outils.join(',') === 'foreuse-1' && neuf.armes.length === 0 && capacite(neuf, 'outil') === 1 && capacite(neuf, 'arme') === 1)
const pauvre = 5
verifier('sans assez de crédits, on n’achète pas', !peutAcheter(neuf, pauvre, 'propulseur-2') && acheter(neuf, pauvre, 'propulseur-2') === null)
verifier('une pièce de série ne s’achète pas (on l’a)', !peutAcheter(neuf, 999, 'propulseur-1'))
const riche = 50
const a = acheter(neuf, riche, 'propulseur-2')!
verifier('l’achat paie le prix en crédits, possède et monte la pièce ; le hangar d’avant ne bouge pas', a !== null && a.credits === 50 - 24 && a.hangar.possedees.includes('propulseur-2') && monteeA(a.hangar, 'propulseur').id === 'propulseur-2' && estMontee(a.hangar, 'propulseur-2') && !neuf.possedees.includes('propulseur-2'))
verifier('on ne rachète pas une pièce possédée', !peutAcheter(a.hangar, a.credits, 'propulseur-2'))
const remis = monter(a.hangar, 'propulseur-1')
verifier('on remonte la pièce de série, la renforcée reste possédée', monteeA(remis, 'propulseur').cran === 1 && remis.possedees.includes('propulseur-2'))
verifier('monter une pièce qu’on n’a pas ne change rien', monter(remis, 'foreuse-3') === remis)

// LES OUTILS : autant que la coque en porte ; une foreuse chasse la foreuse ; le radar prend une place
const RICHE = 99999
let h = acheter(neuf, RICHE, 'foreuse-2')!.hangar
verifier('acheter la foreuse lourde la monte À LA PLACE de celle de série (une seule place, même famille)', h.outils.join(',') === 'foreuse-2' && h.possedees.includes('foreuse-1') && foreuseMontee(h)?.id === 'foreuse-2')
h = acheter(h, RICHE, 'radar')!.hangar
verifier('le radar acheté sur une coque à un outil reste possédé, pas monté : la place est prise par une autre famille', h.outils.join(',') === 'foreuse-2' && !estMontee(h, 'radar') && !peutMonter(h, 'radar') && radarMonte(h) === 0)
const chasseur = monter(demonter(h, 'foreuse-2'), 'radar')
verifier('démonter la foreuse libère la place au radar : plus de foreuse, un radar à 600', chasseur.outils.join(',') === 'radar' && foreuseMontee(chasseur) === null && radarMonte(chasseur) === 600)
const cfgChasseur = configDuHangar(C, chasseur)
verifier('sans foreuse, la configuration ne creuse pas (débit et portée nuls, l’aimant de série) et le radar porte', cfgChasseur.foreuse.debit === 0 && cfgChasseur.foreuse.portee === 0 && cfgChasseur.foreuse.aimant === 1 && cfgChasseur.radar.portee === 600)
h = monter(acheter(h, RICHE, 'coque-3')!.hangar, 'radar')
verifier('la coque à bouclier porte deux outils : la foreuse ET le radar', capacite(h, 'outil') === 2 && h.outils.join(',') === 'foreuse-2,radar' && foreuseMontee(h)?.id === 'foreuse-2' && radarMonte(h) === 600)
verifier('remonter la coque de série démonte le second outil', monter(h, 'coque-1').outils.join(',') === 'foreuse-2')

// LES ARMES : autant que la coque en porte (une de série, deux blindée), qu'on monte et démonte
let g = acheter(neuf, RICHE, 'arme-canon')!.hangar
g = acheter(g, RICHE, 'arme-rafale')!.hangar
verifier('la coque de série porte une arme : la seconde achetée reste possédée, pas montée', capacite(g, 'arme') === 1 && g.armes.join(',') === 'arme-canon' && g.possedees.includes('arme-rafale') && !peutMonter(g, 'arme-rafale'))
g = acheter(g, RICHE, 'coque-2')!.hangar
g = monter(g, 'arme-rafale')
g = acheter(g, RICHE, 'arme-missiles')!.hangar
verifier('la coque blindée en porte deux : la troisième reste possédée, pas montée', capacite(g, 'arme') === 2 && g.armes.length === 2 && estMontee(g, 'arme-canon') && estMontee(g, 'arme-rafale') && !estMontee(g, 'arme-missiles') && g.possedees.includes('arme-missiles'))
verifier('remonter la coque de série démonte la seconde arme', monter(g, 'coque-1').armes.join(',') === 'arme-canon' && monter(monter(g, 'coque-1'), 'coque-2').armes.join(',') === 'arme-canon')
const g2 = monter(demonter(g, 'arme-canon'), 'arme-missiles')
verifier('démonter une arme libère la place ; l’ordre des armes est celui du montage', g2.armes.join(',') === 'arme-rafale,arme-missiles' && g2.possedees.includes('arme-canon'))
verifier('démonter une arme qui n’est pas montée ne change rien', demonter(g2, 'arme-canon') === g2)
verifier('la configuration porte les armes montées, dans l’ordre', configDuHangar(C, g2).armes.map((x) => x.id).join(',') === 'rafale,missiles' && armesMontees(g2).length === 2)

const cfg = configDuHangar(C, a.hangar)
const fA = poidsTotal(a.hangar) / POIDS_SERIE
verifier('la configuration suit les pièces montées (propulseur renforcé : poussée ×1,25 rapportée au poids, pointe ×1,15 ; le reste de série)', Math.abs(cfg.poussee - (C.poussee * 1.25) / fA) < 1e-9 && fA > 1 && Math.abs(cfg.vitesseMax - C.vitesseMax * 1.15) < 1e-9 && cfg.foreuse.debit === 1 && cfg.coque === C.coque && cfg.bouclier.points === 0 && cfg.armes.length === 0 && cfg.radar.portee === 0 && cfg.ennemi.vitesseMax === C.ennemi.vitesseMax)
verifier('la configuration de série est inchangée par un hangar neuf', JSON.stringify(configDuHangar(C, neuf)) === JSON.stringify(C))
const blindee = configDuHangar(C, acheter(neuf, RICHE, 'coque-2')!.hangar)
const hB = acheter(neuf, RICHE, 'coque-2')!.hangar
const fB = poidsTotal(hB) / POIDS_SERIE
verifier('la coque blindée : 8 points ; le poids total monte de 20 à 32 de coque, la poussée et le frein sont divisés par ce rapport, la conso du propulseur multipliée', blindee.coque === 8 && POIDS_SERIE === 38 && poidsTotal(hB) === 50 && Math.abs(blindee.poussee - C.poussee / fB) < 1e-9 && Math.abs(blindee.frein - C.frein / fB) < 1e-9 && Math.abs(blindee.conso.propulseur - 3 * fB) < 1e-9 && blindee.vitesseMax === C.vitesseMax)
verifier('chaque pièce a un poids, et le vaisseau de série pèse la somme des siens', PIECES.every((p) => p.poids > 0) && POIDS_SERIE === 6 + 20 + 8 + 4)
const bouclier = configDuHangar(C, acheter(neuf, RICHE, 'coque-3')!.hangar)
verifier('la coque à bouclier : 5 points et 2 de bouclier', bouclier.coque === 5 && bouclier.bouclier.points === 2 && bouclier.bouclier.delai === C.bouclier.delai)
const serie = nouveauMonde(C)
const renforce = nouveauMonde(cfg)
for (let i = 0; i < 120; i++) {
  avancerLeMonde(C, serie, 1 / 60, { x: 1, y: 0 })
  avancerLeMonde(cfg, renforce, 1 / 60, { x: 1, y: 0 })
}
verifier('poussé deux secondes, le vaisseau renforcé est plus loin que celui de série', renforce.vaisseau.x > serie.vaisseau.x * 1.1)
const longue = configDuHangar(C, acheter(neuf, RICHE, 'foreuse-3')!.hangar)
verifier('la foreuse longue, montée à la place de celle de série : débit ×1,8, portée ×1,25, aimant ×1,6 ; le forage partagé reste de série', longue.foreuse.debit === 1.8 && longue.foreuse.portee === 1.25 && longue.foreuse.aimant === 1.6 && longue.forage.portee === C.forage.portee && longue.forage.aimant === C.forage.aimant)

const relu = lireHangar({ possedees: ['foreuse-2', 'inconnue', 42, 'propulseur-3', 'arme-canon', 'arme-rafale', 'arme-missiles'], montees: { propulseur: 'propulseur-3', coque: 'coque-3' }, outils: ['foreuse-2', 'radar'], armes: ['arme-canon', 'arme-canon', 'arme-rafale', 'arme-missiles', 'propulseur-3'] })
verifier('relu : les inconnues tombent, les séries restent, la coque 3 non possédée redevient de série, les listes bornées à la coque de série, sans doublon ni pièce non possédée', relu.possedees.length === 9 && !relu.possedees.includes('inconnue') && monteeA(relu, 'propulseur').cran === 3 && monteeA(relu, 'coque').cran === 1 && relu.outils.join(',') === 'foreuse-2' && relu.armes.join(',') === 'arme-canon')
verifier('relu avec la coque à bouclier : deux outils, deux armes', (() => { const r = lireHangar({ possedees: ['coque-3', 'radar', 'arme-canon', 'arme-rafale'], montees: { coque: 'coque-3' }, outils: ['foreuse-1', 'radar'], armes: ['arme-canon', 'arme-rafale'] }); return r.outils.length === 2 && r.armes.length === 2 })())
verifier('relu : n’importe quoi donne un hangar neuf', JSON.stringify(lireHangar(null)) === JSON.stringify(hangarNeuf()) && JSON.stringify(lireHangar('x')) === JSON.stringify(hangarNeuf()))
verifier('relu : une pièce montée au mauvais emplacement redevient de série ; une arme non possédée tombe', monteeA(lireHangar({ possedees: ['foreuse-2'], montees: { propulseur: 'foreuse-2' } }), 'propulseur').cran === 1 && lireHangar({ armes: ['arme-canon'] }).armes.length === 0)
verifier('relu : un hangar d’avant les outils retrouve sa foreuse montée dans ses outils', lireHangar({ possedees: ['foreuse-3'], montees: { foreuse: 'foreuse-3' } }).outils.join(',') === 'foreuse-3' && lireHangar({ possedees: ['propulseur-2'], montees: { propulseur: 'propulseur-2' } }).outils.join(',') === 'foreuse-1')
verifier('relu : des outils vides restent vides (le chasseur sans foreuse)', lireHangar({ possedees: ['radar'], outils: [] }).outils.length === 0)
const jc = jaugesDe(PIECES.find((p) => p.id === 'coque-3')!)
verifier('les jauges : la coque à bouclier dit blindage 5/8, bouclier 2/8, poids 24/32, soute, outils 2/2, armes 2/2, conso ; chaque sorte a ses jauges', jc.map((j) => `${j.nom} ${j.valeur}/${j.max}${j.cellules ? '#' : j.nombre ? 'n' : ''}`).join(';') === 'Blindage 5/8#;Bouclier 2/8#;Poids 24/32;Soute 24/30n;Outils 2/2n;Armes 2/2n;Conso 2/2' && PIECES.every((p) => jaugesDe(p).length >= 1 && jaugesDe(p).every((j) => j.valeur <= j.max && j.max > 0)))
const v1 = vendre({ fer: 7, or: 2, cristal: 0 }, 5, 'or')
verifier('vendre l’or : le trésor n’en a plus, les crédits montent du prix de la fiche ; rien à vendre ne change rien', v1.tresor.or === 0 && v1.tresor.fer === 7 && v1.credits === 5 + 2 * FICHES_MINERAI.or.credits && vendre(v1.tresor, v1.credits, 'cristal').credits === v1.credits)
verifier('les crédits relus : un entier positif, zéro sinon', lireCredits(12.7) === 12 && lireCredits(-3) === 0 && lireCredits('x') === 0 && lireCredits(undefined) === 0)
// LE RÉACTEUR ET LA CONSOMMATION (Keko) : la configuration porte l'énergie du réacteur monté, la capacité de la coque, la conso de chaque système
const hF = acheter(neuf, RICHE, 'reacteur-3')!.hangar
const fusion = configDuHangar(C, hF)
verifier('le réacteur à fusion : 200 d’énergie, 13 par seconde, mais lourd (la conso du propulseur monte avec le poids) ; la coque de série : 20 en soute ; foreuse 3, pas de radar ni de bouclier', fusion.energie.max === 200 && fusion.energie.recharge === 13 && fusion.capacite === 20 && Math.abs(fusion.conso.propulseur - (3 * poidsTotal(hF)) / POIDS_SERIE) < 1e-9 && fusion.conso.propulseur > 3 && fusion.conso.foreuse === 3 && fusion.conso.radar === 0 && fusion.conso.bouclier === 0)
const equipe = configDuHangar(C, monter(acheter(acheter(neuf, RICHE, 'coque-3')!.hangar, RICHE, 'radar')!.hangar, 'radar'))
verifier('la coque à bouclier et le radar : 24 en soute, le bouclier consomme 2 et le radar 1 ; une arme porte sa conso par coup', equipe.capacite === 24 && equipe.conso.bouclier === 2 && equipe.conso.radar === 1 && configDuHangar(C, acheter(neuf, RICHE, 'arme-missiles')!.hangar).armes[0].conso === 8)
const tr = lireTresor({ fer: 7.9, or: -3, cristal: 'x', autre: 1 })
verifier('le trésor relu : des entiers positifs, zéro sinon', tr.fer === 7 && tr.or === 0 && tr.cristal === 0 && lireTresor(undefined).fer === 0)

if (echecs > 0) throw new Error(`${echecs} verification(s) en echec`)
console.log('Tout passe.')

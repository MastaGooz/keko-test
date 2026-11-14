/**
 * Vérifications du hangar, sans navigateur.
 */
import { acheter, pieceDe, armesMontees, capacite, remplacer, monterA, demonterA, POIDS_SERIE, poidsTotal, type Hangar, configDuHangar, demonter, EMPLACEMENTS, estMontee, FICHES_MINERAI, foreuseMontee, hangarNeuf, jaugesDe, lireCredits, lireHangar, lireTresor, montantCourt, monteeA, monter, peutAcheter, peutMonter, PIECES, piecesDe, radarMonte, vendre } from './hangar.ts'
import { avancerLeMonde, nouveauMonde, VAISSEAU as C } from './jeu.ts'

// (LES MISSILES SONT UNE ARME LOURDE depuis le 14/11, que seul le cuirassé porte : ces vérifications-ci, qui s'en servent
// comme d'une arme quelconque sur les petits châssis, les prennent pour légers — le calibre est vérifié dans `flotte.verif.ts`)
pieceDe('arme-missiles')!.lourde = false

let echecs = 0
function verifier(quoi: string, vrai: boolean): void {
  if (!vrai) echecs += 1
  console.log(`  ${vrai ? 'ok  ' : 'ECHEC'}  ${quoi}`)
}

console.log('hangar')
verifier('chaque emplacement a trois crans, le premier gratuit ; trois foreuses, deux aimants et un radar en outils ; trois armes, aucune gratuite', EMPLACEMENTS.every((e) => piecesDe(e).length === (e === 'coque' ? 4 : 6) /* (le cuirassé : une quatrième coque, trois propulseurs à lui) */ && piecesDe(e)[0].cran === 1 && piecesDe(e)[0].prix === 0) && piecesDe('outil').length === 6 && piecesDe('outil').filter((p) => p.famille === 'aimant').length === 2 && piecesDe('outil').filter((p) => p.famille === 'foreuse').length === 3 && piecesDe('arme').length === 3 && piecesDe('arme').every((p) => p.arme !== undefined && p.prix > 0) && PIECES.every((p) => p.sorte !== 'propulseur' && p.sorte !== 'coque' ? true : p.id === `${p.sorte}-${p.cran}` || p.id === `${p.sorte}-l${p.cran}`))
const neuf = hangarNeuf()
verifier('un hangar neuf : les pièces de série montées, la foreuse de série en outil, pas d’arme ; la coque de série porte un outil et une arme', neuf.possedees.length === 3 && EMPLACEMENTS.every((e) => monteeA(neuf, e).cran === 1) && neuf.outils.join(',') === 'foreuse-1' && neuf.armes.length === 0 && capacite(neuf, 'outil') === 1 && capacite(neuf, 'arme') === 1)
const pauvre = 5
verifier('sans assez de crédits, on n’achète pas', !peutAcheter(neuf, pauvre, 'propulseur-2') && acheter(neuf, pauvre, 'propulseur-2') === null)
verifier('une pièce de série ne s’achète pas (on l’a)', !peutAcheter(neuf, 999, 'propulseur-1'))
const riche = 50
const achat = acheter(neuf, riche, 'propulseur-2')!
verifier('l’achat paie le prix en crédits et possède la pièce SANS l’équiper (ça se fait au hangar) ; le hangar d’avant ne bouge pas', achat !== null && achat.credits === 50 - 24 && achat.hangar.possedees.includes('propulseur-2') && !estMontee(achat.hangar, 'propulseur-2') && monteeA(achat.hangar, 'propulseur').cran === 1 && !neuf.possedees.includes('propulseur-2'))
const a = { hangar: monter(achat.hangar, 'propulseur-2'), credits: achat.credits }
verifier('équipée ensuite, elle est montée', monteeA(a.hangar, 'propulseur').id === 'propulseur-2' && estMontee(a.hangar, 'propulseur-2'))
verifier('on ne rachète pas une pièce possédée', !peutAcheter(a.hangar, a.credits, 'propulseur-2'))
const remis = monter(a.hangar, 'propulseur-1')
verifier('on remonte la pièce de série, la renforcée reste possédée', monteeA(remis, 'propulseur').cran === 1 && remis.possedees.includes('propulseur-2'))
verifier('monter une pièce qu’on n’a pas ne change rien', monter(remis, 'foreuse-3') === remis)

// LES OUTILS : autant que la coque en porte ; une foreuse chasse la foreuse ; le radar prend une place
const RICHE = 99999
/** Acheter puis équiper, comme le joueur le fait au labo puis au hangar. */
const achete = (h: Hangar, id: string): Hangar => monter(acheter(h, RICHE, id)!.hangar, id)
let h = achete(neuf, 'foreuse-2')
verifier('acheter la foreuse lourde la monte À LA PLACE de celle de série (une seule place, même famille)', h.outils.join(',') === 'foreuse-2' && h.possedees.includes('foreuse-1') && foreuseMontee(h)?.id === 'foreuse-2')
h = achete(h, 'radar')
verifier('le radar acheté sur une coque à un outil reste possédé, pas monté : la place est prise par une autre famille', h.outils.join(',') === 'foreuse-2' && !estMontee(h, 'radar') && !peutMonter(h, 'radar') && radarMonte(h) === 0)
const chasseur = monter(demonter(h, 'foreuse-2'), 'radar')
verifier('démonter la foreuse libère la place au radar : plus de foreuse, un radar à 600', chasseur.outils.join(',') === 'radar' && foreuseMontee(chasseur) === null && radarMonte(chasseur) === 600)
const cfgChasseur = configDuHangar(C, chasseur)
verifier('sans foreuse, la configuration ne creuse pas (débit et portée nuls, l’aimant de série) et le radar porte', cfgChasseur.foreuse.debit === 0 && cfgChasseur.foreuse.portee === 0 && cfgChasseur.foreuse.aimant === 1 && cfgChasseur.radar.portee === 600)
h = monter(achete(h, 'coque-3'), 'radar')
verifier('la coque à bouclier porte deux outils : la foreuse ET le radar', capacite(h, 'outil') === 2 && h.outils.join(',') === 'foreuse-2,radar' && foreuseMontee(h)?.id === 'foreuse-2' && radarMonte(h) === 600)
verifier('remonter la coque de série démonte le second outil', monter(h, 'coque-1').outils.join(',') === 'foreuse-2')

// LES ARMES : autant que la coque en porte (une de série, deux blindée), qu'on monte et démonte
let g = achete(neuf, 'arme-canon')
g = achete(g, 'arme-rafale')
verifier('la coque de série porte une arme : la seconde achetée reste possédée, pas montée', capacite(g, 'arme') === 1 && g.armes.join(',') === 'arme-canon' && g.possedees.includes('arme-rafale') && !peutMonter(g, 'arme-rafale'))
g = achete(g, 'coque-2')
g = monter(g, 'arme-rafale')
g = achete(g, 'arme-missiles')
verifier('la coque blindée en porte deux : la troisième reste possédée, pas montée', capacite(g, 'arme') === 2 && g.armes.length === 2 && estMontee(g, 'arme-canon') && estMontee(g, 'arme-rafale') && !estMontee(g, 'arme-missiles') && g.possedees.includes('arme-missiles'))
verifier('remonter la coque de série démonte la seconde arme', monter(g, 'coque-1').armes.join(',') === 'arme-canon' && monter(monter(g, 'coque-1'), 'coque-2').armes.join(',') === 'arme-canon')
const g2 = monter(demonter(g, 'arme-canon'), 'arme-missiles')
verifier('démonter une arme libère SA place, les autres ne glissent pas : la suivante montée sans dire où prend la place libre', demonter(g, 'arme-canon').armes.join(',') === ',arme-rafale' && g2.armes.join(',') === 'arme-missiles,arme-rafale' && g2.possedees.includes('arme-canon'))
const g3 = remplacer(g2, 'arme-rafale', 'arme-canon')
verifier('remplacer une arme montée par une possédée la met à sa place ; remplacer par une pièce d’une autre liste ou déjà montée ne change rien', g3.armes.join(',') === 'arme-missiles,arme-canon' && remplacer(g2, 'arme-rafale', 'foreuse-1') === g2 && remplacer(g2, 'arme-rafale', 'arme-missiles') === g2)
verifier('monter à une place : la place prise est remplacée, la même place ne change rien, hors des places rien', monterA(g2, 'arme-canon', 1).armes.join(',') === 'arme-missiles,arme-canon' && monterA(g2, 'arme-missiles', 0) === g2 && monterA(g2, 'arme-canon', 2) === g2 && monterA(g2, 'foreuse-1', 5) === g2)
// LES PLACES SONT FIXES (Keko : « quand mon slot arme 1 est vide et que j'équipe une arme sur le slot 2, elle va dans le slot 1 »)
const sansArme = demonter(demonter(g2, 'arme-missiles'), 'arme-rafale')
const aDroite = monterA(sansArme, 'arme-canon', 1)
verifier('une arme montée à la place 2 d’un vaisseau sans arme RESTE à la place 2 : la place 1 est libre', sansArme.armes.length === 0 && aDroite.armes.join(',') === ',arme-canon' && estMontee(aDroite, 'arme-canon') && armesMontees(aDroite).length === 1 && configDuHangar(C, aDroite).armes.map((x) => x.id).join(',') === 'canon')
verifier('la place 1 se remplit ensuite sans toucher à la 2 ; vider la 1 laisse la 2 où elle est ; vider la dernière vide la liste', monterA(aDroite, 'arme-rafale', 0).armes.join(',') === 'arme-rafale,arme-canon' && demonterA(monterA(aDroite, 'arme-rafale', 0), 'arme', 0).armes.join(',') === ',arme-canon' && demonterA(aDroite, 'arme', 1).armes.length === 0 && demonterA(aDroite, 'arme', 0) === aDroite)
verifier('sans dire où, une arme prend la première place libre — ici la 1, devant celle de la place 2', monter(aDroite, 'arme-rafale').armes.join(',') === 'arme-rafale,arme-canon')
verifier('une coque qui porte moins démonte les dernières places : l’arme de la place 2 tombe, la liste est vide', monter(aDroite, 'coque-1').armes.length === 0)
// LA MÊME PIÈCE À PLUSIEURS PLACES (Keko : « la même arme sur les deux slots du moment qu'il l'a débloquée ; pareil pour les outils »)
const jumelles = monterA(g2, 'arme-rafale', 0)
verifier('la même arme se monte aux deux places : elle tire deux fois, pèse deux fois, et l’autre place n’a pas bougé', jumelles.armes.join(',') === 'arme-rafale,arme-rafale' && configDuHangar(C, jumelles).armes.map((x) => x.id).join(',') === 'rafale,rafale' && poidsTotal(jumelles) === poidsTotal(g2) - 8 + 5 && jumelles.possedees.filter((x) => x === 'arme-rafale').length === 1)
verifier('retirer l’une des deux laisse l’autre à sa place', demonterA(jumelles, 'arme', 0).armes.join(',') === ',arme-rafale' && demonterA(jumelles, 'arme', 1).armes.join(',') === 'arme-rafale' && demonter(jumelles, 'arme-rafale').armes.length === 0)
const deuxRadars = monterA(h, 'radar', 0)
verifier('deux radars sur la coque à deux outils : le joueur a le choix (un seul radar porte, plus de foreuse, les deux pèsent)', deuxRadars.outils.join(',') === 'radar,radar' && radarMonte(deuxRadars) === 600 && foreuseMontee(deuxRadars) === null && poidsTotal(deuxRadars) === poidsTotal(h) - PIECES.find((p) => p.id === 'foreuse-2')!.poids + PIECES.find((p) => p.id === 'radar')!.poids)
verifier('une pièce qu’on n’a pas ne se monte à aucune place', monterA(neuf, 'arme-canon', 0) === neuf)
verifier('démonter une arme qui n’est pas montée ne change rien', demonter(g2, 'arme-canon') === g2)
verifier('la configuration porte les armes montées, dans l’ordre', configDuHangar(C, g2).armes.map((x) => x.id).join(',') === 'missiles,rafale' && armesMontees(g2).length === 2)

const cfg = configDuHangar(C, a.hangar)
const fA = poidsTotal(a.hangar) / POIDS_SERIE
verifier('la configuration suit les pièces montées (propulseur renforcé : poussée ×1,25 rapportée au poids, pointe ×1,15 ; le reste de série)', Math.abs(cfg.poussee - (C.poussee * 1.25) / fA) < 1e-9 && fA > 1 && Math.abs(cfg.vitesseMax - C.vitesseMax * 1.15) < 1e-9 && cfg.foreuse.debit === 1 && cfg.coque === C.coque && cfg.bouclier.points === 0 && cfg.armes.length === 0 && cfg.radar.portee === 0 && cfg.ennemi.vitesseMax === C.ennemi.vitesseMax)
// (le propulseur de série est L'ÉTALON LE PLUS BAS depuis le 13/11 : trois dixièmes de la poussée et de la pointe de la
// configuration ; tout le reste d'un hangar neuf est celui de la configuration)
const SERIE = 1.15
const SERIE_POUSSEE = 0.84
verifier('un hangar neuf : la configuration, à la poussée et à la pointe de l’étalon le plus bas', JSON.stringify(configDuHangar(C, neuf)) === JSON.stringify({ ...C, poussee: C.poussee * SERIE_POUSSEE, vitesseMax: C.vitesseMax * SERIE, foreuses: [{ debit: 1, portee: 1, outil: 0, cran: 1 }] }))
const blindee = configDuHangar(C, achete(neuf, 'coque-2'))
const hB = achete(neuf, 'coque-2')
const fB = poidsTotal(hB) / POIDS_SERIE
verifier('la coque blindée : 8 points ; le poids total monte de 20 à 32 de coque (30 → 42), la poussée et le frein sont divisés par ce rapport accentué', blindee.coque === 8 && POIDS_SERIE === 30 && poidsTotal(hB) === 42 && Math.abs(blindee.poussee - (C.poussee * SERIE_POUSSEE) / fB) < 1e-9 && Math.abs(blindee.frein - C.frein / fB) < 1e-9 && Math.abs(blindee.vitesseMax - C.vitesseMax * SERIE) < 1e-9)
// PLUSIEURS PROPULSEURS (Keko, 13/11) : une coque qui en porte deux — la poussée double, le poids compte le propulseur
// deux fois, la pointe et la rotation ne changent pas ; deux fois plus lourd avec deux fois plus de propulseurs,
// c'est la même accélération
{
  const co = PIECES.find((x) => x.id === 'coque-1')!
  const avant = { c: configDuHangar(C, neuf), poids: poidsTotal(neuf) }
  co.propulseurs = 2
  const deux = { c: configDuHangar(C, neuf), poids: poidsTotal(neuf) }
  delete co.propulseurs
  verifier('deux propulseurs : le poids compte le propulseur deux fois, la pointe et la rotation ne changent pas', deux.poids === avant.poids + 6 && deux.c.vitesseMax === avant.c.vitesseMax && deux.c.rotation === avant.c.rotation)
  verifier('deux propulseurs : la poussée double, rapportée au nouveau poids', Math.abs(deux.c.poussee - (avant.c.poussee * 2 * avant.poids) / deux.poids) < 1e-9)
}
verifier('chaque pièce a un poids, et le vaisseau de série pèse la somme des siens', PIECES.every((p) => p.poids > 0) && POIDS_SERIE === 6 + 20 + 4)
const bouclier = configDuHangar(C, achete(neuf, 'coque-3'))
verifier('la coque à bouclier : 5 points et 2 de bouclier', bouclier.coque === 5 && bouclier.bouclier.points === 2 && bouclier.bouclier.delai === C.bouclier.delai)
const serie = nouveauMonde(C)
const renforce = nouveauMonde(cfg)
for (let i = 0; i < 120; i++) {
  avancerLeMonde(C, serie, 1 / 60, { x: 1, y: 0 })
  avancerLeMonde(cfg, renforce, 1 / 60, { x: 1, y: 0 })
}
verifier('poussé deux secondes, le vaisseau renforcé est plus loin que celui de série', renforce.vaisseau.x > serie.vaisseau.x * 1.1)
const longue = configDuHangar(C, achete(neuf, 'foreuse-3'))
const aimante = configDuHangar(C, monter(demonter(acheter(neuf, RICHE, 'aimant-1')!.hangar, 'foreuse-1'), 'aimant-1'))
verifier('l’aimant est un outil (Keko) : la foreuse ne touche plus à l’aimant ; l’aimant monté le porte ×1,6, sans foreuse on ne creuse pas mais on attire', longue.foreuse.aimant === 1 && aimante.foreuse.aimant === 1.6 && aimante.foreuse.debit === 0)
verifier('la foreuse longue, montée à la place de celle de série : débit ×1,8, portée ×1,25 ; le forage partagé reste de série', longue.foreuse.debit === 1.8 && longue.foreuse.portee === 1.25 && longue.forage.portee === C.forage.portee && longue.forage.aimant === C.forage.aimant)

const relu = lireHangar({ possedees: ['foreuse-2', 'inconnue', 42, 'propulseur-3', 'arme-canon', 'arme-rafale', 'arme-missiles'], montees: { propulseur: 'propulseur-3', coque: 'coque-3' }, outils: ['foreuse-2', 'radar'], armes: ['arme-canon', 'arme-canon', 'arme-rafale', 'arme-missiles', 'propulseur-3'] })
verifier('relu : les inconnues tombent, les séries restent, la coque 3 non possédée redevient de série, les listes bornées à la coque de série', relu.possedees.length === 8 && !relu.possedees.includes('inconnue') && monteeA(relu, 'propulseur').cran === 3 && monteeA(relu, 'coque').cran === 1 && relu.outils.join(',') === 'foreuse-2' && relu.armes.join(',') === 'arme-canon')
verifier('relu avec la coque à bouclier : deux outils, deux armes', (() => { const r = lireHangar({ possedees: ['coque-3', 'radar', 'arme-canon', 'arme-rafale'], montees: { coque: 'coque-3' }, outils: ['foreuse-1', 'radar'], armes: ['arme-canon', 'arme-rafale'] }); return r.outils.length === 2 && r.armes.length === 2 })())
verifier('relu : les places sont gardées — un vide ou une pièce qu’on n’a pas laisse sa place libre, la même arme deux fois reste deux fois', (() => {
  const base = { possedees: ['coque-2', 'arme-canon', 'arme-rafale'], montees: { coque: 'coque-2' } }
  return lireHangar({ ...base, armes: ['', 'arme-rafale'] }).armes.join(',') === ',arme-rafale' && lireHangar({ ...base, armes: ['arme-missiles', 'arme-canon'] }).armes.join(',') === ',arme-canon' && lireHangar({ ...base, armes: ['arme-canon', 'arme-canon', 'arme-rafale'] }).armes.join(',') === 'arme-canon,arme-canon' && lireHangar({ ...base, armes: ['arme-canon', null] }).armes.join(',') === 'arme-canon' && JSON.stringify(lireHangar(JSON.parse(JSON.stringify(aDroite)))) === JSON.stringify(aDroite)
})())
verifier('relu : n’importe quoi donne un hangar neuf', JSON.stringify(lireHangar(null)) === JSON.stringify(hangarNeuf()) && JSON.stringify(lireHangar('x')) === JSON.stringify(hangarNeuf()))
verifier('relu : une pièce montée au mauvais emplacement redevient de série ; une arme non possédée tombe', monteeA(lireHangar({ possedees: ['foreuse-2'], montees: { propulseur: 'foreuse-2' } }), 'propulseur').cran === 1 && lireHangar({ armes: ['arme-canon'] }).armes.length === 0)
verifier('relu : un hangar d’avant les outils retrouve sa foreuse montée dans ses outils', lireHangar({ possedees: ['foreuse-3'], montees: { foreuse: 'foreuse-3' } }).outils.join(',') === 'foreuse-3' && lireHangar({ possedees: ['propulseur-2'], montees: { propulseur: 'propulseur-2' } }).outils.join(',') === 'foreuse-1')
verifier('relu : des outils vides restent vides (le chasseur sans foreuse)', lireHangar({ possedees: ['radar'], outils: [] }).outils.length === 0)
const jc = jaugesDe(PIECES.find((p) => p.id === 'coque-3')!)
verifier('les jauges : la coque à bouclier dit blindage 5/8, bouclier 2/8, poids 24/32, soute, outils 2/2, armes 2/2 ; chaque sorte a ses jauges', jc.map((j) => `${j.nom} ${j.valeur}/${j.max}${j.cellules ? '#' : j.nombre ? 'n' : ''}`).join(';') === 'Blindage 5/8#;Bouclier 2/8#;Poids 24/97n;Soute 24/120n;Outils 2/4n;Armes 2/8n;Lourdes 0/2n' && PIECES.every((p) => jaugesDe(p).length >= 1 && jaugesDe(p).every((j) => j.valeur <= j.max && j.max > 0)))
const v1 = vendre({ fer: 7, or: 2, cristal: 0 }, 5, 'or')
verifier('vendre l’or : le trésor n’en a plus, les crédits montent du prix de la fiche ; rien à vendre ne change rien', v1.tresor.or === 0 && v1.tresor.fer === 7 && v1.credits === 5 + 2 * FICHES_MINERAI.or.credits && vendre(v1.tresor, v1.credits, 'cristal').credits === v1.credits)
verifier('les crédits relus : un entier positif, zéro sinon', lireCredits(12.7) === 12 && lireCredits(-3) === 0 && lireCredits('x') === 0 && lireCredits(undefined) === 0)
const tr = lireTresor({ fer: 7.9, or: -3, cristal: 'x', autre: 1 })
verifier('le trésor relu : des entiers positifs, zéro sinon', tr.fer === 7 && tr.or === 0 && tr.cristal === 0 && lireTresor(undefined).fer === 0)
verifier('les montants en court : exacts jusqu’à quatre chiffres, puis k, M, G, T, arrondis vers le bas', [0, 68, 9999, 10000, 12345, 99999, 123456, 999999, 1000000, 1234567, 9999999, 88888888, 999999999, 1000000000, 2560000000000, -5, 12.9].map(montantCourt).join(' ') === '0 68 9999 10k 12k 99k 123k 999k 1M 1,2M 9,9M 88M 999M 1G 2,5T 0 12')

if (echecs > 0) throw new Error(`${echecs} verification(s) en echec`)
console.log('Tout passe.')

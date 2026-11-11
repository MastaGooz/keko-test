/**
 * Vérifications du labo (l'arbre des recherches), sans navigateur.
 */
import { BRANCHES, configDuLabo, COUTS, debloquer, estDebloque, laboNeuf, lireLabo, NOEUDS, noeudsDe, passifsDe, peutDebloquer, pieceOuverte, rangOuvert, RANGS, type Labo } from './labo.ts'
import { configDuHangar, hangarNeuf, monter, pieceDe, PIECES } from './hangar.ts'
import { avancerLeMonde, nouveauMonde, partDeLaPostcombustion, postcombustion, rechargeDeLaPostcombustion, VAISSEAU as C, type ConfigVaisseau } from './jeu.ts'

let echecs = 0
function verifier(quoi: string, vrai: boolean): void {
  if (!vrai) echecs += 1
  console.log(`  ${vrai ? 'ok  ' : 'ECHEC'}  ${quoi}`)
}

console.log('labo')
verifier('trois branches, trois rangs chacune, aucun rang vide ; des identifiants uniques', BRANCHES.every((b) => RANGS.every((r) => noeudsDe(b, r).length > 0)) && new Set(NOEUDS.map((n) => n.id)).size === NOEUDS.length)
verifier('chaque nœud est d’une seule sorte, et porte ce qu’elle demande (une pièce du catalogue, un passif, une mécanique)', NOEUDS.every((n) => (n.sorte === 'piece' ? n.piece !== undefined && pieceDe(n.piece) !== undefined && n.passif === undefined && n.mecanique === undefined : n.sorte === 'passif' ? n.passif !== undefined && n.piece === undefined && n.icone !== undefined : n.mecanique !== undefined && n.piece === undefined && n.icone !== undefined)))
verifier('toute pièce payante du catalogue est portée par un nœud, et un seul', PIECES.filter((p) => p.prix > 0).every((p) => NOEUDS.filter((n) => n.piece === p.id).length === 1))
const neuf = laboNeuf()
const riche = { fer: 500, or: 500, cristal: 500 }
verifier('un labo neuf : rien de débloqué, le rang 1 ouvert partout, les autres fermés', neuf.debloques.length === 0 && BRANCHES.every((b) => rangOuvert(neuf, b, 1) && !rangOuvert(neuf, b, 2) && !rangOuvert(neuf, b, 3)))
verifier('sans le minerai, on ne débloque pas ; avec, si', !peutDebloquer(neuf, { fer: 19, or: 0, cristal: 0 }, 'm-debit') && debloquer(neuf, { fer: 19, or: 0, cristal: 0 }, 'm-debit') === null && peutDebloquer(neuf, { fer: 20, or: 0, cristal: 0 }, 'm-debit'))
verifier('un nœud d’un rang fermé ne se débloque pas, même riche', !peutDebloquer(neuf, riche, 'm-soute') && !peutDebloquer(neuf, riche, 'm-double'))
const d1 = debloquer(neuf, riche, 'm-debit')!
verifier('débloquer paie le coût du rang en minerai du trésor ; le labo et le trésor d’avant ne bougent pas', d1 !== null && d1.tresor.fer === 500 - COUTS[1].fer && d1.tresor.or === 500 && estDebloque(d1.labo, 'm-debit') && neuf.debloques.length === 0 && riche.fer === 500)
verifier('un nœud débloqué ne se redébloque pas', !peutDebloquer(d1.labo, d1.tresor, 'm-debit'))
verifier('un nœud du rang 1 ouvre le rang 2 DE SA BRANCHE, pas des autres, ni le rang 3', rangOuvert(d1.labo, 'minage', 2) && !rangOuvert(d1.labo, 'minage', 3) && !rangOuvert(d1.labo, 'combat', 2) && !rangOuvert(d1.labo, 'exploration', 2))
const d2 = debloquer(d1.labo, d1.tresor, 'm-soute')!
verifier('le rang 2 coûte du fer et de l’or, et ouvre le rang 3', d2.tresor.fer === 500 - 20 - 30 && d2.tresor.or === 490 && rangOuvert(d2.labo, 'minage', 3))
verifier('une pièce n’est ouverte à l’achat que par son nœud', !pieceOuverte(neuf, 'foreuse-2') && pieceOuverte(debloquer(neuf, riche, 'm-foreuse-2')!.labo, 'foreuse-2') && !pieceOuverte(d2.labo, 'foreuse-2'))

// LES PASSIFS : sur la configuration, quel que soit le vaisseau
const tout: Labo = { debloques: NOEUDS.map((n) => n.id) }
const serie = configDuHangar(C, hangarNeuf())
const passe = configDuLabo(serie, tout)
const P = passifsDe(tout)
verifier('un labo neuf ne change rien à la configuration', JSON.stringify(configDuLabo(serie, neuf)) === JSON.stringify(serie))
verifier('les passifs s’ajoutent : soute, blindage, bouclier en points ; vitesse, accélération, maniabilité, forage, aimant en parts', passe.capacite === serie.capacite + 5 && passe.coque === serie.coque + 1 && passe.bouclier.points === serie.bouclier.points + 1 && Math.abs(passe.vitesseMax / serie.vitesseMax - 1.08) < 1e-9 && Math.abs(passe.poussee / serie.poussee - 1.12) < 1e-9 && Math.abs(passe.rotation / serie.rotation - 1.12) < 1e-9 && Math.abs(passe.foreuse.debit / serie.foreuse.debit - 1.15) < 1e-9 && Math.abs(passe.foreuse.aimant / serie.foreuse.aimant - 1.25) < 1e-9 && P.critique === 0.1 && passe.passifs.critique === 0.1 && passe.passifs.pepiteDouble === 0.15)
const arme = configDuLabo(configDuHangar(C, monter({ ...hangarNeuf(), possedees: [...hangarNeuf().possedees, 'arme-canon'] }, 'arme-canon')), tout)
verifier('les armes tirent plus souvent (la cadence, un délai, est divisée)', arme.armes.length === 1 && Math.abs(arme.armes[0].cadence - 1.1 / 1.15) < 1e-9)
verifier('le rival ne profite de rien', JSON.stringify(passe.ennemi) === JSON.stringify(serie.ennemi) && JSON.stringify(passe.forage) === JSON.stringify(serie.forage))

// LE FILON DOUBLE : plus de pépites des roches creusées par le joueur
const pepitesApres = (c: ConfigVaisseau): number => {
  const m = nouveauMonde({ ...c, base: { ...c.base, calme: 1e9 } }, 5)
  m.vaisseau = { ...m.vaisseau, x: 300, y: 0 }
  for (let i = 0; i < 60 * 40; i++) avancerLeMonde({ ...c, capacite: 0, base: { ...c.base, calme: 1e9 }, forage: { ...c.forage, portee: 400, debit: 4000 } }, m, 1 / 60, { x: 0, y: 0 })
  return m.pepites.length
}
verifier('le filon double fait naître plus de pépites (à 100 %, deux fois plus)', pepitesApres({ ...serie, passifs: { ...serie.passifs, pepiteDouble: 1 } }) === 2 * pepitesApres(serie) && pepitesApres(serie) > 0)

// LA POSTCOMBUSTION
const mb = nouveauMonde(passe, 3)
verifier('éteinte de série : elle ne part pas', !postcombustion(serie, nouveauMonde(serie, 3)) && partDeLaPostcombustion(serie, nouveauMonde(serie, 3)) === 0)
verifier('débloquée : elle part, puis attend sa recharge', postcombustion(passe, mb) && !postcombustion(passe, mb) && partDeLaPostcombustion(passe, mb) === 1 && rechargeDeLaPostcombustion(passe, mb) === 0)
const sansCalme = { ...passe, base: { ...passe.base, calme: 1e9 } }
let pointe = 0
for (let i = 0; i < 60; i++) {
  avancerLeMonde(sansCalme, mb, 1 / 60, { x: 0, y: 0 })
  pointe = Math.max(pointe, Math.hypot(mb.vaisseau.vx, mb.vaisseau.vy))
}
verifier('sans manche, elle pousse droit devant et dépasse la pointe du vaisseau', pointe > passe.vitesseMax * 1.2 && mb.vaisseau.y < -20)
for (let i = 0; i < 60 * 7; i++) avancerLeMonde(sansCalme, mb, 1 / 60, { x: 0, y: 0 })
verifier('passée, la pointe est revenue sous le plafond, et elle est rechargée', Math.hypot(mb.vaisseau.vx, mb.vaisseau.vy) <= passe.vitesseMax + 1e-6 && rechargeDeLaPostcombustion(passe, mb) === 1 && postcombustion(passe, mb))

// LA RELECTURE
const relu = lireLabo({ debloques: ['m-debit', 'inconnu', 'm-debit', 7, 'c-canon'] })
verifier('un labo relu sans confiance : les inconnus tombent, chacun une fois', relu.debloques.join(',') === 'm-debit,c-canon' && lireLabo(null).debloques.length === 0 && lireLabo({ debloques: 'x' }).debloques.length === 0)

if (echecs > 0) throw new Error(`${echecs} verification(s) en echec`)
console.log('Tout passe.')

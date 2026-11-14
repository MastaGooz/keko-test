/**
 * Vérifications du labo (l'arbre des recherches), sans navigateur.
 */
import { BRANCHES, configDuLabo, coutDe, debloquer, estDebloque, laboNeuf, lireLabo, noeudDe, NOEUDS, noeudsDe, passifsDe, peutDebloquer, rangOuvert, RANGS, vaisseauxDebloques, type Labo } from './labo.ts'
import { configDuHangar, hangarNeuf, monter } from './hangar.ts'
import { MODELES } from './flotte.ts'
import { avancerLeMonde, nouveauMonde, partDeLaPostcombustion, postcombustion, rechargeDeLaPostcombustion, VAISSEAU as C, type ConfigVaisseau } from './jeu.ts'

let echecs = 0
function verifier(quoi: string, vrai: boolean): void {
  if (!vrai) echecs += 1
  console.log(`  ${vrai ? 'ok  ' : 'ECHEC'}  ${quoi}`)
}

console.log('labo')
verifier('quatre branches, trois rangs chacune, aucun rang vide ; des identifiants uniques', BRANCHES.every((b) => RANGS.every((r) => noeudsDe(b, r).length > 0)) && new Set(NOEUDS.map((n) => n.id)).size === NOEUDS.length)
verifier('chaque nœud est d’une seule sorte, et porte ce qu’elle demande (un vaisseau du catalogue, un passif, une mécanique)', NOEUDS.every((n) => (n.sorte === 'vaisseau' ? n.vaisseau !== undefined && MODELES.some((mo) => mo.id === n.vaisseau) && n.passif === undefined && n.mecanique === undefined : n.sorte === 'passif' ? n.passif !== undefined && n.vaisseau === undefined && n.icone !== undefined : n.mecanique !== undefined && n.vaisseau === undefined && n.icone !== undefined)))
verifier('tout vaisseau qui n’est pas celui du départ est porté par un nœud, et un seul', MODELES.slice(1).every((mo) => NOEUDS.filter((n) => n.vaisseau === mo.id).length === 1) && NOEUDS.every((n) => n.vaisseau !== MODELES[0].id))
const neuf = laboNeuf()
const riche = { fer: 500, or: 500, cristal: 500 }
verifier('un labo neuf : rien de débloqué, le rang 1 ouvert partout, les autres fermés', neuf.debloques.length === 0 && BRANCHES.every((b) => rangOuvert(neuf, b, 1) && !rangOuvert(neuf, b, 2) && !rangOuvert(neuf, b, 3)))
const prixDuDebit = coutDe(noeudDe('m-debit')!).fer
const prixDeLaSoute = coutDe(noeudDe('m-soute')!)
verifier('chaque nœud a son coût, jamais nul ; deux nœuds d’un même rang peuvent coûter différemment', NOEUDS.every((n) => n.cout.fer + n.cout.or + n.cout.cristal > 0 && Object.values(n.cout).every((x) => Number.isInteger(x) && x >= 0)) && coutDe(noeudDe('m-debit')!).fer !== coutDe(noeudDe('c-blindage')!).fer)
verifier('sans le minerai, on ne débloque pas ; avec, si', !peutDebloquer(neuf, { fer: prixDuDebit - 1, or: 0, cristal: 0 }, 'm-debit') && debloquer(neuf, { fer: prixDuDebit - 1, or: 0, cristal: 0 }, 'm-debit') === null && peutDebloquer(neuf, { fer: prixDuDebit, or: 0, cristal: 0 }, 'm-debit'))
verifier('un nœud d’un rang fermé ne se débloque pas, même riche', !peutDebloquer(neuf, riche, 'm-soute') && !peutDebloquer(neuf, riche, 'm-double'))
const d1 = debloquer(neuf, riche, 'm-debit')!
verifier('débloquer paie le coût DU NŒUD en minerai du trésor ; le labo et le trésor d’avant ne bougent pas', d1 !== null && d1.tresor.fer === 500 - prixDuDebit && d1.tresor.or === 500 && estDebloque(d1.labo, 'm-debit') && neuf.debloques.length === 0 && riche.fer === 500)
verifier('un nœud débloqué ne se redébloque pas', !peutDebloquer(d1.labo, d1.tresor, 'm-debit'))
verifier('un nœud du rang 1 ouvre le rang 2 DE SA BRANCHE, pas des autres, ni le rang 3', rangOuvert(d1.labo, 'minage', 2) && !rangOuvert(d1.labo, 'minage', 3) && !rangOuvert(d1.labo, 'combat', 2) && !rangOuvert(d1.labo, 'exploration', 2))
const d2 = debloquer(d1.labo, d1.tresor, 'm-soute')!
verifier('un nœud du rang 2 coûte du fer et de l’or, et ouvre le rang 3', d2.tresor.fer === 500 - prixDuDebit - prixDeLaSoute.fer && d2.tresor.or === 500 - prixDeLaSoute.or && prixDeLaSoute.or > 0 && rangOuvert(d2.labo, 'minage', 3))
verifier('un vaisseau n’est débloqué que par son nœud', vaisseauxDebloques(neuf).length === 0 && vaisseauxDebloques(d2.labo).length === 0 && vaisseauxDebloques({ debloques: ['c-cuirasse'] }).join() === 'cuirasse')

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
// (la poussée et la pointe de la CONFIGURATION, pas celles du propulseur de série : il sert d'étalon d'essai depuis le
// 13/11 — accélération au plus bas, pointe très haute —, et c'est la mécanique qu'on vérifie ici)
const sansCalme = { ...passe, poussee: C.poussee, vitesseMax: C.vitesseMax, base: { ...passe.base, calme: 1e9 } }
let pointe = 0
for (let i = 0; i < 60; i++) {
  avancerLeMonde(sansCalme, mb, 1 / 60, { x: 0, y: 0 })
  pointe = Math.max(pointe, Math.hypot(mb.vaisseau.vx, mb.vaisseau.vy))
}
verifier('sans manche, elle pousse droit devant et dépasse la pointe du vaisseau', pointe > C.vitesseMax * 1.2 && mb.vaisseau.y < -20)
for (let i = 0; i < 60 * 7; i++) avancerLeMonde(sansCalme, mb, 1 / 60, { x: 0, y: 0 })
verifier('passée, la pointe est revenue sous le plafond, et elle est rechargée', Math.hypot(mb.vaisseau.vx, mb.vaisseau.vy) <= passe.vitesseMax + 1e-6 && rechargeDeLaPostcombustion(passe, mb) === 1 && postcombustion(passe, mb))

// LE COMMERCE : ses passifs ne touchent pas le vaisseau, ils servent au marché
const marchand: Labo = { debloques: ['k-negoce', 'k-negoce-2', 'k-courtage', 'k-prevision'] }
const PM = passifsDe(marchand)
verifier('la branche commerce : la prime de vente se cumule, le plafond monte ; la configuration du vaisseau n’en change pas', Math.abs(PM.vente - 0.1) < 1e-9 && PM.plafond === 0.1 && JSON.stringify(configDuLabo(serie, marchand)) === JSON.stringify(serie))

// LA RELECTURE
const relu = lireLabo({ debloques: ['m-debit', 'inconnu', 'm-debit', 7, 'c-canon', 'c-blindage'] })
verifier('un labo relu sans confiance : les inconnus tombent, chacun une fois', relu.debloques.join(',') === 'm-debit,c-blindage' && lireLabo(null).debloques.length === 0 && lireLabo({ debloques: 'x' }).debloques.length === 0)

if (echecs > 0) throw new Error(`${echecs} verification(s) en echec`)
console.log('Tout passe.')

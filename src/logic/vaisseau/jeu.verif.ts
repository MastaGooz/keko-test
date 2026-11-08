/**
 * Vérifications du vaisseau, sans navigateur : le temps est injecté.
 */
import { asteroideDeLaCase, asteroidesAutour, avancer, avancerLeMonde, nouveauMonde, nouveauVaisseau, solidite, stationDeLaCase, stationLaPlusProche, VAISSEAU as C, type Evenement, type Vaisseau } from './jeu.ts'

let echecs = 0
function verifier(quoi: string, vrai: boolean): void {
  if (!vrai) echecs += 1
  console.log(`  ${vrai ? 'ok  ' : 'ECHEC'}  ${quoi}`)
}

console.log('vaisseau')
const immobile = avancer(C, nouveauVaisseau(), 1, { x: 0, y: 0 }).vaisseau
verifier('sans manche, il ne bouge pas', immobile.x === 0 && immobile.y === 0 && immobile.poussee === 0)

let v: Vaisseau = nouveauVaisseau()
for (let i = 0; i < 60; i++) v = avancer(C, v, 1 / 60, { x: 1, y: 0 }).vaisseau
verifier('poussé à droite une seconde, il va à droite et prend de la vitesse', v.x > 20 && v.vx > 30)
verifier('le nez se tourne vers la droite', Math.abs(v.cap) < 0.05)
for (let i = 0; i < 600; i++) v = avancer(C, v, 1 / 60, { x: 1, y: 0 }).vaisseau
verifier('la vitesse est plafonnée', Math.hypot(v.vx, v.vy) <= C.vitesseMax + 1e-6)
const glisse = avancer(C, v, 2, { x: 0, y: 0 }).vaisseau
verifier('manche lâché, il glisse en freinant à peine', glisse.vx > 0.2 * v.vx && glisse.vx < v.vx)

verifier('le champ est déterministe', JSON.stringify(asteroideDeLaCase(C, 3, -2)) === JSON.stringify(asteroideDeLaCase(C, 3, -2)))
const autour = asteroidesAutour(C, 0, 0, 400)
verifier('il y a des astéroïdes autour du départ, aucun dans le vide du départ', autour.length > 5 && autour.every((a) => Math.hypot(a.x, a.y) >= C.champ.vide))
verifier('tous ont un rayon dans les bornes', autour.every((a) => a.rayon >= C.champ.rayonMin && a.rayon <= C.champ.rayonMax))

// un choc : le vaisseau posé dans un astéroïde en sort, et le choc est rapporté
const a = autour[0]
const dedans: Vaisseau = { ...nouveauVaisseau(), x: a.x - a.rayon + 1, y: a.y, vx: 50, vy: 0 }
const choc = avancer(C, dedans, 1 / 60, { x: 0, y: 0 })
verifier('un choc repousse le vaisseau hors de l’astéroïde', Math.hypot(choc.vaisseau.x - a.x, choc.vaisseau.y - a.y) >= a.rayon + C.rayon - 1e-6)
verifier('et rend un rebond', choc.chocs.length === 1 && choc.vaisseau.vx < 0)
// s'appuyer doucement contre la roche n'est pas un choc, et un contact qui dure n'en refait pas
const appui: Vaisseau = { ...nouveauVaisseau(), x: a.x - a.rayon - C.rayon + 0.5, y: a.y, vx: 4, vy: 0 }
verifier('un contact doux ne fait pas de choc', avancer(C, appui, 1 / 60, { x: 1, y: 0 }).chocs.length === 0)
const deja: Vaisseau = { ...dedans, contact: a.id }
verifier('un contact qui dure ne refait pas de choc', avancer(C, deja, 1 / 60, { x: 0, y: 0 }).chocs.length === 0)

// le forage : posé près d'une roche, le laser la vise ; il la creuse à son débit ; elle éclate en pépites, qui montent à bord
const compter = (evs: Evenement[], type: Evenement['type']) => evs.filter((e) => e.type === type).length
const m = nouveauMonde()
m.prochainEnnemiA = 1e9 // pas d'ennemi pour ce test
m.vaisseau = { ...nouveauVaisseau(), x: a.x - a.rayon - 20, y: a.y }
avancerLeMonde(C, m, 1 / 60, { x: 0, y: 0 })
verifier('à portée, le laser vise la roche la plus proche, sur sa surface', m.forage !== null && m.forage.cible === a.id && Math.abs(Math.hypot(m.forage.x - a.x, m.forage.y - a.y) - a.rayon) < 0.01)
const loin = nouveauMonde()
loin.prochainEnnemiA = 1e9
loin.vaisseau = { ...nouveauVaisseau(), x: a.x - a.rayon - C.forage.portee - 30, y: a.y }
avancerLeMonde(C, loin, 1 / 60, { x: 0, y: 0 })
verifier('hors de portée, pas de forage', loin.forage === null)
let eclats = 0
let pas = 0
while (eclats === 0 && pas < 2000) {
  eclats += compter(avancerLeMonde(C, m, 1 / 60, { x: 0, y: 0 }).evenements, 'eclat')
  pas++
}
const attendu = solidite(C, a) / C.forage.debit
verifier('la roche éclate quand sa solidité est creusée', eclats === 1 && Math.abs(pas / 60 - attendu) < 0.1)
verifier('elle est partie et a laissé des pépites', m.detruits.has(a.id) && m.pepites.length >= 1 && m.forage === null)
let ramasses = 0
for (let i = 0; i < 600 && m.pepites.length > 0; i++) ramasses += compter(avancerLeMonde(C, m, 1 / 60, { x: 0, y: 0 }).evenements, 'ramasse')
verifier('les pépites viennent au vaisseau et montent à bord', m.pepites.length === 0 && ramasses >= 1 && m.minerai === ramasses)
// la roche partie ne repousse plus : on traverse son ancienne place
m.vaisseau = { ...m.vaisseau, x: a.x, y: a.y, vx: 0, vy: 0 }
const traverse = avancerLeMonde(C, m, 1 / 60, { x: 0, y: 0 })
verifier('une roche détruite ne repousse plus le vaisseau', traverse.chocs.length === 0 && Math.abs(m.vaisseau.x - a.x) < 0.01 && Math.abs(m.vaisseau.y - a.y) < 0.01)

// L'ENNEMI : il apparaît à l'heure dite au loin, mine quand le joueur est loin, chasse et tire quand il est près
const w = nouveauMonde()
let apparu: Evenement | undefined
for (let i = 0; i < Math.ceil(C.ennemi.apparait * 60) + 2 && apparu === undefined; i++) apparu = avancerLeMonde(C, w, 1 / 60, { x: 0, y: 0 }).evenements.find((e) => e.type === 'ennemiApparait')
verifier('l’ennemi apparaît à l’heure dite, au loin', apparu !== undefined && w.ennemis.length === 1 && Math.abs(Math.hypot(w.ennemis[0].corps.x, w.ennemis[0].corps.y) - C.ennemi.distance) < 1)
let aMine = false
let tirLoin = false
let tirs = 0
for (let i = 0; i < 60 * 25; i++) {
  const r = avancerLeMonde(C, w, 1 / 60, { x: 0, y: 0 })
  const e = w.ennemis[0]
  if (e === undefined) break
  if (e.fait === 'mine' && e.forage !== null) aMine = true
  if (compter(r.evenements, 'tir') > 0 && Math.hypot(e.corps.x - w.vaisseau.x, e.corps.y - w.vaisseau.y) > C.ennemi.voit + 1) tirLoin = true
  tirs += compter(r.evenements, 'tir')
}
verifier('il trouve une roche et la mine', aMine)
const sienne = w.ennemis[0]?.roche
const roches = asteroidesAutour(C, 0, 0, 600)
const laRoche = roches.find((r) => r.id === sienne)
verifier('et c’est une roche du territoire du joueur', laRoche !== undefined && Math.hypot(laRoche.x, laRoche.y) - laRoche.rayon <= C.ennemi.territoire)
verifier('il ne tire jamais sur un joueur qu’il ne voit pas', !tirLoin)
// le joueur se pose à côté de lui : il chasse, tire, et les traits percent la coque
const e0 = w.ennemis[0]
w.vaisseau = { ...nouveauVaisseau(), x: e0.corps.x + C.ennemi.tient, y: e0.corps.y }
w.detruits = new Set(asteroidesAutour(C, w.vaisseau.x, w.vaisseau.y, 300).map((r) => r.id)) // le champ dégagé : rien n'arrête les traits
let touches = 0
tirs = 0
w.coque = C.coque // (il a pu tirer sur le joueur immobile pendant la phase de mine : on repart d'une coque neuve)
for (let i = 0; i < 60 * 14 && w.coque > 1; i++) {
  const r = avancerLeMonde(C, w, 1 / 60, { x: 0, y: 0 })
  tirs += compter(r.evenements, 'tir')
  touches += compter(r.evenements, 'touche')
}
verifier('le joueur à portée, il chasse et tire', w.ennemis[0]?.fait === 'chasse' && tirs >= 3)
verifier('ses traits percent la coque', touches >= 1 && w.coque === C.coque - touches)
// SON LASER NE L'ATTAQUE PAS (Keko) : tenu à portée de forage du joueur, en vue, il tire mais ne pose pas de rayon sur lui
const brule = nouveauMonde()
brule.prochainEnnemiA = 0
avancerLeMonde(C, brule, 1 / 60, { x: 0, y: 0 })
brule.detruits = new Set(asteroidesAutour(C, 0, 0, 400).map((r) => r.id))
brule.coque = C.coque
let rayonSurLeJoueur = false
let coqueEntiere = true
for (let i = 0; i < 90; i++) {
  const en = brule.ennemis[0]
  en.corps = { ...en.corps, x: brule.vaisseau.x - (C.forage.portee - 10), y: brule.vaisseau.y, vx: 0, vy: 0 }
  en.pv = C.ennemi.pv // (le laser du joueur le creuse : on le garde en vie)
  avancerLeMonde(C, brule, 1 / 60, { x: 0, y: 0 })
  if (brule.ennemis[0]?.forage !== null) rayonSurLeJoueur = true
  if (brule.coque !== Math.round(brule.coque)) coqueEntiere = false // (seuls ses traits, entiers, l'entament)
  brule.tirs = []
}
verifier('à portée de forage, en chasse, le rival ne pose pas son laser sur le joueur', !rayonSurLeJoueur && coqueEntiere && brule.ennemis[0].fait === 'chasse')
// le laser du joueur creuse l'ennemi quand il est plus près qu'une roche, et l'abat
const z = nouveauMonde()
z.prochainEnnemiA = 0
avancerLeMonde(C, z, 1 / 60, { x: 0, y: 0 })
const en = z.ennemis[0]
z.vaisseau = { ...nouveauVaisseau(), x: en.corps.x + 30, y: en.corps.y }
z.detruits = new Set(asteroidesAutour(C, z.vaisseau.x, z.vaisseau.y, 300).map((r) => r.id))
let abattu = 0
let pasZ = 0
while (abattu === 0 && pasZ < 60 * 20) {
  const r = avancerLeMonde(C, z, 1 / 60, { x: 0, y: 0 })
  abattu += compter(r.evenements, 'ennemiDetruit')
  pasZ++
}
verifier('le laser creuse l’ennemi et l’abat', abattu === 1 && z.ennemis.length === 0 && z.pepites.length >= C.ennemi.butinRendu)
// LES CHOCS FONT MAL : lancé à pleine vitesse sur une petite roche, le joueur perd de la coque et la roche éclate
const petite = autour.filter((r) => r.rayon < 7).sort((r1, r2) => r1.rayon - r2.rayon)[0]
const k = nouveauMonde()
k.prochainEnnemiA = 1e9
k.vaisseau = { ...nouveauVaisseau(), x: petite.x - petite.rayon - C.rayon - 2, y: petite.y, vx: C.vitesseMax, vy: 0 }
// quelques pas : il lui faut le temps d'arriver sur la roche
let chocsK = 0
let touchesK = 0
let eclatsK = 0
for (let i = 0; i < 6 && chocsK === 0; i++) {
  const rk = avancerLeMonde(C, k, 1 / 60, { x: 0, y: 0 })
  chocsK += rk.chocs.length
  touchesK += compter(rk.evenements, 'touche')
  eclatsK += compter(rk.evenements, 'eclat')
}
verifier('un choc à pleine vitesse coûte de la coque, en proportion', chocsK === 1 && k.coque < C.coque && k.coque > C.coque - 3 && touchesK === 1)
verifier('et fait éclater une petite roche', k.detruits.has(petite.id) && eclatsK === 1)
const doux = nouveauMonde()
doux.prochainEnnemiA = 1e9
doux.vaisseau = { ...nouveauVaisseau(), x: petite.x - petite.rayon - C.rayon + 0.5, y: petite.y, vx: 6, vy: 0 }
const rd = avancerLeMonde(C, doux, 1 / 60, { x: 1, y: 0 })
// (le laser, lui, creuse la roche voisine : on regarde le choc et la coque, pas le creusement)
verifier('un contact doux ne coûte rien à personne', rd.chocs.length === 0 && doux.coque === C.coque && !doux.detruits.has(petite.id))
// l'ennemi aussi : jeté sur une grosse roche, il perd des points et l'abîme
const grosse = autour.filter((r) => r.rayon > 11)[0]
const q = nouveauMonde()
q.prochainEnnemiA = 0
avancerLeMonde(C, q, 1 / 60, { x: 0, y: 0 })
const enq = q.ennemis[0]
enq.corps = { ...enq.corps, x: grosse.x - grosse.rayon - C.ennemi.rayon - 1, y: grosse.y, vx: C.ennemi.vitesseMax, vy: 0 }
q.vaisseau = { ...nouveauVaisseau(), x: grosse.x + 500, y: grosse.y + 500 }
const rq = avancerLeMonde(C, q, 1 / 60, { x: 0, y: 0 })
verifier('le rival qui heurte une roche perd des points et l’abîme', enq.pv < C.ennemi.pv && (q.creuse.get(grosse.id) ?? 0) > 0 && rq.chocs.length === 1)

// LA STATION : à quai avec du minerai, on dépose à la cadence ; loin d'elle, rien
const st = nouveauMonde()
st.prochainEnnemiA = 1e9
st.minerai = 5
let deposes = 0
for (let i = 0; i < 60 * 2; i++) deposes += compter(avancerLeMonde(C, st, 1 / 60, { x: 0, y: 0 }).evenements, 'depose')
verifier('à quai, le minerai porté passe en banque', deposes === 5 && st.minerai === 0 && st.banque === 5)
const loinSt = nouveauMonde()
loinSt.prochainEnnemiA = 1e9
loinSt.minerai = 3
loinSt.vaisseau = { ...nouveauVaisseau(), x: C.station.portee + 40, y: 0 }
for (let i = 0; i < 60; i++) avancerLeMonde(C, loinSt, 1 / 60, { x: 0, y: 0 })
verifier('loin de la station, on garde tout à bord', loinSt.minerai === 3 && loinSt.banque === 0)
// LES STATIONS SONT PARTOUT (Keko) : une par case de 900, celle du départ en (0, 0), chacune dans sa case ; la plus
// proche n'est jamais à plus d'une case ; le vide du champ entoure chacune ; on dépose à n'importe laquelle
const origine = stationDeLaCase(C, 0, 0)
let dansSaCase = true
let plusLoinQue = 0
for (let j = -4; j <= 4; j++)
  for (let i = -4; i <= 4; i++) {
    const st = stationDeLaCase(C, i, j)
    if (Math.abs(st.x - i * C.station.case) > C.station.case / 2 || Math.abs(st.y - j * C.station.case) > C.station.case / 2) dansSaCase = false
  }
for (const [x, y] of [[2000, -1300], [-5000, 4200], [731, 12], [-120, -3300]]) {
  const st = stationLaPlusProche(C, x, y)
  plusLoinQue = Math.max(plusLoinQue, Math.hypot(st.x - x, st.y - y))
}
verifier('une station par case, celle du départ au départ, jamais à plus d’une case', origine.x === 0 && origine.y === 0 && dansSaCase && plusLoinQue <= C.station.case * Math.SQRT1_2 * 1.4 + 1)
const lointaine = stationDeLaCase(C, 3, -2)
const autourDElle = asteroidesAutour(C, lointaine.x, lointaine.y, C.champ.vide + C.champ.rayonMax)
verifier('le vide du champ entoure chaque station', (lointaine.x !== 0 || lointaine.y !== 0) && autourDElle.every((a) => Math.hypot(a.x - lointaine.x, a.y - lointaine.y) >= C.champ.vide + a.rayon))
const la = nouveauMonde()
la.prochainEnnemiA = 1e9
la.minerai = 2
la.vaisseau = { ...nouveauVaisseau(), x: lointaine.x + 10, y: lointaine.y }
let deposesLa = 0
let ouLa: { x: number; y: number } | null = null
for (let i = 0; i < 60; i++) for (const e of avancerLeMonde(C, la, 1 / 60, { x: 0, y: 0 }).evenements) if (e.type === 'depose') (deposesLa++, (ouLa = { x: e.x, y: e.y }))
// L'EXTRACTION (Keko) : né à quai, le compte ne court pas ; sorti puis revenu, il monte, retombe à zéro si on ressort,
// et au bout de la durée la partie est extraite
const ex = nouveauMonde()
ex.prochainEnnemiA = 1e9
for (let i = 0; i < 60 * 11; i++) avancerLeMonde(C, ex, 1 / 60, { x: 0, y: 0 })
verifier('né à quai, le compte de l’extraction ne court pas', ex.phase === 'vol' && ex.extraction === 0)
ex.vaisseau = { ...nouveauVaisseau(), x: C.station.portee + 40, y: 0 }
avancerLeMonde(C, ex, 1 / 60, { x: 0, y: 0 })
ex.vaisseau = nouveauVaisseau()
for (let i = 0; i < 60 * 5; i++) avancerLeMonde(C, ex, 1 / 60, { x: 0, y: 0 })
const aMiChemin = ex.extraction
ex.vaisseau = { ...nouveauVaisseau(), x: C.station.portee + 40, y: 0 }
avancerLeMonde(C, ex, 1 / 60, { x: 0, y: 0 })
verifier('revenu à quai le compte monte, ressorti il retombe à zéro', aMiChemin > 4.9 && aMiChemin < 5.1 && ex.extraction === 0 && ex.phase === 'vol')
ex.vaisseau = nouveauVaisseau()
let extraits = 0
let ouEx: { x: number; y: number } | null = null
let pasEx = 0
while (ex.phase === 'vol' && pasEx < 60 * 12) {
  for (const e of avancerLeMonde(C, ex, 1 / 60, { x: 0, y: 0 }).evenements) if (e.type === 'extrait') (extraits++, (ouEx = { x: e.x, y: e.y }))
  pasEx++
}
verifier('resté à quai jusqu’au bout, la partie est extraite', ex.phase === 'extrait' && extraits === 1 && ouEx !== null && ouEx!.x === 0 && ouEx!.y === 0 && Math.abs(pasEx / 60 - C.extraction.duree) < 0.1)
verifier('on dépose à n’importe quelle station, et le dépôt dit laquelle', deposesLa === 2 && la.banque === 2 && ouLa !== null && ouLa!.x === lointaine.x && ouLa!.y === lointaine.y)

const p = nouveauMonde()
p.coque = 1
p.tirs.push({ id: 1, x: 0, y: 0, vx: 0, vy: 0, vie: 1 })
p.prochainEnnemiA = 1e9
const rp = avancerLeMonde(C, p, 1 / 60, { x: 0, y: 0 })
verifier('la coque percée perd la partie', p.phase === 'perdu' && compter(rp.evenements, 'perdu') === 1)

console.log(echecs === 0 ? 'Tout passe.' : `${echecs} echec(s).`)
if (echecs > 0) throw new Error(`${echecs} verification(s) en echec`)

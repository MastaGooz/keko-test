/**
 * Vérifications du vaisseau, sans navigateur : le temps est injecté.
 */
import { asteroideDeLaCase, asteroidesAutour, avancer, avancerLeMonde, nouveauMonde, nouveauVaisseau, solidite, VAISSEAU as C, type Vaisseau } from './jeu.ts'

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
const m = nouveauMonde()
m.vaisseau = { ...nouveauVaisseau(), x: a.x - a.rayon - 20, y: a.y }
avancerLeMonde(C, m, 1 / 60, { x: 0, y: 0 })
verifier('à portée, le laser vise la roche la plus proche, sur sa surface', m.forage !== null && m.forage.cible === a.id && Math.abs(Math.hypot(m.forage.x - a.x, m.forage.y - a.y) - a.rayon) < 0.01)
const loin = nouveauMonde()
loin.vaisseau = { ...nouveauVaisseau(), x: a.x - a.rayon - C.forage.portee - 30, y: a.y }
avancerLeMonde(C, loin, 1 / 60, { x: 0, y: 0 })
verifier('hors de portée, pas de forage', loin.forage === null)
let eclats = 0
let pas = 0
while (eclats === 0 && pas < 2000) {
  eclats += avancerLeMonde(C, m, 1 / 60, { x: 0, y: 0 }).eclats.length
  pas++
}
const attendu = solidite(C, a) / C.forage.debit
verifier('la roche éclate quand sa solidité est creusée', eclats === 1 && Math.abs(pas / 60 - attendu) < 0.1)
verifier('elle est partie et a laissé des pépites', m.detruits.has(a.id) && m.pepites.length >= 1 && m.forage === null)
let ramasses = 0
for (let i = 0; i < 600 && m.pepites.length > 0; i++) ramasses += avancerLeMonde(C, m, 1 / 60, { x: 0, y: 0 }).ramasses.length
verifier('les pépites viennent au vaisseau et montent à bord', m.pepites.length === 0 && ramasses >= 1 && m.minerai === ramasses)
// la roche partie ne repousse plus : on traverse son ancienne place
m.vaisseau = { ...m.vaisseau, x: a.x, y: a.y, vx: 0, vy: 0 }
const traverse = avancerLeMonde(C, m, 1 / 60, { x: 0, y: 0 })
verifier('une roche détruite ne repousse plus le vaisseau', traverse.chocs.length === 0 && Math.abs(m.vaisseau.x - a.x) < 0.01 && Math.abs(m.vaisseau.y - a.y) < 0.01)

console.log(echecs === 0 ? 'Tout passe.' : `${echecs} echec(s).`)
if (echecs > 0) throw new Error(`${echecs} verification(s) en echec`)

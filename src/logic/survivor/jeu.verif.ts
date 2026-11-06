/**
 * Vérifications du survivor, sans navigateur : le temps est injecté.
 */
import { avancerHeros, centreQuiSuit, directionDuManche, nouveauHeros, SURVIVOR as C, type Heros, type Vecteur } from './jeu.ts'

let echecs = 0
function verifier(quoi: string, vrai: boolean): void {
  if (!vrai) echecs += 1
  console.log(`  ${vrai ? 'ok  ' : 'ECHEC'}  ${quoi}`)
}

console.log('survivor')

const PAS = 1000 / 60
function marcher(h: Heros, ms: number, d: Vecteur): Heros {
  for (let t = 0; t < ms; t += PAS) h = avancerHeros(C, h, PAS, d)
  return h
}
const proche = (a: number, b: number, tol = 1e-6) => Math.abs(a - b) <= tol

verifier('sans direction, le héros ne bouge pas', marcher(nouveauHeros(), 1000, { x: 0, y: 0 }).x === 0)
const droite = marcher(nouveauHeros(), 1000, { x: 1, y: 0 })
verifier('à fond une seconde, il fait presque sa vitesse', droite.x > C.vitesse * 0.9 && droite.x <= C.vitesse && droite.regard === 1)
const diag = marcher(nouveauHeros(), 1000, { x: 1, y: 1 })
verifier("une diagonale ne va pas plus vite qu'une ligne droite", proche(Math.hypot(diag.x, diag.y), droite.x, 1e-3))
const gauche = marcher(droite, 500, { x: -1, y: 0 })
verifier('il se retourne vers la gauche', gauche.regard === -1)
verifier("à l'arrêt, il garde son regard", marcher(gauche, 300, { x: 0, y: 0 }).regard === -1)
const arret = marcher(droite, 300, { x: 0, y: 0 })
verifier("lâché, il s'arrête vite (à peine trois unités de glisse)", Math.hypot(arret.vx, arret.vy) < 0.5 && arret.x - droite.x < 3)

verifier('le manche : rien dans la zone morte', directionDuManche(C, C.manche.rayon * 0.1, 0).x === 0)
const bord = directionDuManche(C, 0, -C.manche.rayon * 2)
verifier('le manche : pleine force au bord et au-delà, dans la bonne direction', proche(bord.y, -1) && proche(bord.x, 0))
const moitie = directionDuManche(C, C.manche.rayon * 0.5, 0)
verifier('le manche : une force partielle entre les deux', moitie.x > 0.3 && moitie.x < 0.6)
const centre = { x: 100, y: 100 }
verifier('le centre ne bouge pas tant que le doigt est dans le rayon', centreQuiSuit(C, centre, { x: 130, y: 100 }) === centre)
const suivi = centreQuiSuit(C, centre, { x: 100 + C.manche.rayon + 40, y: 100 })
verifier('le centre suit le doigt qui sort du rayon', proche(suivi.x, 140) && proche(suivi.y, 100))

console.log(echecs === 0 ? 'Tout passe.' : `${echecs} echec(s).`)
if (echecs > 0) throw new Error(`${echecs} verification(s) en echec`)

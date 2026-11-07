/**
 * Vérifications de la tour du magicien, sans navigateur : le temps est injecté.
 */
import { ajouter, avancer, effetsDuSort, formeDe, lancer, MAGIE as C, nomDuSort, nouvellePartie, type Element, type EtatMagie, type Evenement, type TypeEnnemi } from './jeu.ts'

let echecs = 0
function verifier(quoi: string, vrai: boolean): void {
  if (!vrai) echecs += 1
  console.log(`  ${vrai ? 'ok  ' : 'ECHEC'}  ${quoi}`)
}

console.log('magie : la tour du magicien')

const PAS = 1 / 60
const VUE = { gauche: 28, droite: 28, haut: 46, bas: 74 }
function jouer(e: EtatMagie, s: number): Evenement[] {
  const ev: Evenement[] = []
  for (let t = 0; t < s && e.phase === 'jeu'; t += PAS) ev.push(...avancer(C, e, PAS, VUE))
  return ev
}
/** Une partie calme (aucune vague), avec ces ennemis posés. */
function calme(...ennemis: [TypeEnnemi, number, number][]): EtatMagie {
  const e = nouvellePartie(C, 1)
  e.prochaineVague = null
  e.vague = 1
  for (const [type, x, y] of ennemis) {
    const pv = C.ennemis[type].pv
    e.ennemis.push({ id: e.prochainId++, type, x, y, pv, pvMax: pv, brule: null, ralenti: null, affaibli: null, geleA: 0, coupA: 0 })
  }
  return e
}
function composer(e: EtatMagie, ...file: Element[]): void {
  for (const k of file) ajouter(C, e, k)
}

// ---------------------------------------------------------------- la file

const f = nouvellePartie(C, 1)
composer(f, 'feu', 'feu', 'foudre')
verifier('trois éléments au plus dans la file', ajouter(C, f, 'feu')[0].type === 'pleine' && f.file.length === 3)
const a = ajouter(C, f, 'froid')
verifier('le froid annule un feu', a[0].type === 'annule' && f.file.join() === 'feu,foudre')
ajouter(C, f, 'terre')
verifier('la terre annule la foudre', f.file.join() === 'feu')
verifier('la forme : de la terre, un rocher ; de la foudre, un éclair ; du feu ou du froid, un souffle', formeDe(['terre', 'feu']) === 'rocher' && formeDe(['foudre', 'froid']) === 'eclair' && formeDe(['froid']) === 'souffle' && formeDe([]) === 'aucun')
verifier('… de la mort, un rayon ; de la vie seule, un halo ; la vie avec du feu, un souffle', formeDe(['mort', 'feu']) === 'rayon' && formeDe(['vie', 'vie']) === 'halo' && formeDe(['vie', 'feu']) === 'souffle' && formeDe(['mort', 'terre']) === 'rocher')
verifier('le nom du sort : feu + foudre = éclair de feu', nomDuSort(['feu', 'foudre']) === 'Éclair de feu ×2' && nomDuSort(['terre', 'feu']) === 'Rocher de feu ×2' && nomDuSort(['feu']) === 'Jet de flammes' && nomDuSort(['foudre', 'froid', 'froid']) === 'Éclair de givre ×3')
verifier('… rayon de mort, halo de vie, éclair de vie', nomDuSort(['mort']) === 'Rayon de mort' && nomDuSort(['mort', 'feu']) === 'Rayon de mort ardent ×2' && nomDuSort(['vie']) === 'Halo de vie' && nomDuSort(['foudre', 'vie']) === 'Éclair de vie ×2' && nomDuSort(['vie', 'froid']) === 'Givre de vie ×2')
verifier('ce que fera le sort', effetsDuSort(C, ['foudre', 'feu']).join() === 'saute sur 3 ennemis,brûle' && effetsDuSort(C, ['froid', 'froid', 'froid']).join() === 'cône devant la tour,gèle' && effetsDuSort(C, ['mort']).join() === 'transperce en ligne,affaiblit' &&effetsDuSort(C, ['terre', 'vie']).join() === 'éclate,repousse,draine')
const vm = nouvellePartie(C, 1)
composer(vm, 'vie', 'mort')
verifier('la mort annule la vie', vm.file.length === 0)

// ---------------------------------------------------------------- le souffle

const souffle = calme(['gobelin', 20, 0], ['gobelin', -20, 0])
composer(souffle, 'feu')
lancer(C, souffle, { x: 30, y: 0 })
verifier('le souffle frappe devant, pas derrière', souffle.ennemis[0].pv === C.ennemis.gobelin.pv - C.cone.degats && souffle.ennemis[1].pv === C.ennemis.gobelin.pv)
const pvAvant = souffle.ennemis[0].pv
souffle.ennemis[0].x = 200
jouer(souffle, 1)
verifier('le feu brûle encore après le coup', souffle.ennemis[0].pv < pvAvant)
verifier('la file se vide en lançant ; on reprend son souffle', souffle.file.length === 0 && (() => {
  const e = calme(['orc', 20, 0])
  composer(e, 'froid')
  lancer(C, e, { x: 1, y: 0 })
  composer(e, 'froid')
  return lancer(C, e, { x: 1, y: 0 }).length === 0
})())
const esprit = calme(['esprit', 20, 0])
composer(esprit, 'feu', 'feu')
lancer(C, esprit, { x: 1, y: 0 })
jouer(esprit, 1)
verifier("l'esprit de feu ne brûle pas", esprit.ennemis[0].pv === C.ennemis.esprit.pv)
const givre = calme(['esprit', 20, 0])
composer(givre, 'froid')
lancer(C, givre, { x: 1, y: 0 })
verifier('… mais craint le froid (double)', givre.ennemis[0].pv === C.ennemis.esprit.pv - 2 * C.cone.degats)
const glace = calme(['orc', 30, 0])
composer(glace, 'froid', 'froid', 'froid')
lancer(C, glace, { x: 1, y: 0 })
const x0 = glace.ennemis[0].x
jouer(glace, 1)
verifier('trois froids gèlent : il ne bouge plus', glace.ennemis[0].x === x0)
const lent = calme(['orc', 30, 0], ['orc', 0, 30])
composer(lent, 'froid')
lancer(C, lent, { x: 1, y: 0 })
jouer(lent, 1)
verifier('un froid ralentit', 30 - lent.ennemis[0].x < 30 - lent.ennemis[1].y)

// ---------------------------------------------------------------- l'éclair

const chaine = calme(['gobelin', 20, 0], ['gobelin', 30, 5], ['gobelin', 38, -5], ['gobelin', -25, 0])
composer(chaine, 'foudre')
const evChaine = lancer(C, chaine, { x: 1, y: 0 })
const eclair = evChaine.find((x) => x.type === 'eclair')
verifier('un éclair saute : un foudre, trois touchés, pas celui de derrière', eclair?.type === 'eclair' && eclair.points.length === 4 && chaine.ennemis[3].pv === C.ennemis.gobelin.pv)
const golem = calme(['golem', 20, 0])
composer(golem, 'foudre', 'foudre')
lancer(C, golem, { x: 1, y: 0 })
verifier('la foudre glisse sur le golem', C.ennemis.golem.pv - golem.ennemis[0].pv === Math.round(2 * C.eclair.degats * 0.25))
const vide = calme(['gobelin', -20, 0])
composer(vide, 'foudre')
const evVide = lancer(C, vide, { x: 1, y: 0 })
verifier("sans personne dans le cône, l'éclair part dans le vide", evVide.some((x) => x.type === 'eclair' && x.points.length === 2) && vide.ennemis[0].pv === C.ennemis.gobelin.pv)

// ---------------------------------------------------------------- le rocher

const roc = calme(['golem', 40, 0], ['gobelin', 42, 4], ['gobelin', -40, 0])
composer(roc, 'terre')
lancer(C, roc, { x: 40, y: 0 })
verifier('le rocher vole avant de frapper', roc.rochers.length === 1 && roc.ennemis[0].pv === C.ennemis.golem.pv)
jouer(roc, 1)
verifier('il éclate : la terre brise le golem (double), touche son voisin, pas celui d’en face', C.ennemis.golem.pv - roc.ennemis[0].pv === 2 * C.rocher.degats && roc.ennemis[1].pv < C.ennemis.gobelin.pv && roc.ennemis[2].pv === C.ennemis.gobelin.pv)
const recul = calme(['orc', 30, 0])
composer(recul, 'terre', 'terre')
lancer(C, recul, { x: 30, y: 0 })
jouer(recul, 0.5)
verifier('la terre repousse', recul.ennemis[0].x > 30)
const meteore = calme(['orc', 50, 0], ['orc', 50, 9])
composer(meteore, 'terre', 'feu')
lancer(C, meteore, { x: 50, y: 0 })
const evMeteore = jouer(meteore, 1)
verifier('le feu élargit l’impact du rocher', evMeteore.some((x) => x.type === 'impact' && x.rayon === C.rocher.rayon + C.rocher.rayonParFeu) && meteore.ennemis[1].pv < C.ennemis.orc.pv)

// ---------------------------------------------------------------- la mort, la vie

const ligne = calme(['orc', 15, 0], ['orc', 30, 1], ['orc', 30, 12], ['orc', -20, 0])
composer(ligne, 'mort')
const evLigne = lancer(C, ligne, { x: 1, y: 0 })
verifier('le rayon de mort transperce tout en ligne, pas à côté, pas derrière', evLigne.some((x) => x.type === 'rayon') && ligne.ennemis[0].pv === C.ennemis.orc.pv - C.rayon.degats && ligne.ennemis[1].pv === C.ennemis.orc.pv - C.rayon.degats && ligne.ennemis[2].pv === C.ennemis.orc.pv && ligne.ennemis[3].pv === C.ennemis.orc.pv)
const faible = calme(['orc', 20, 0])
composer(faible, 'mort', 'mort')
lancer(C, faible, { x: 1, y: 0 })
jouer(faible, 0.5)
const pvApresMort = faible.ennemis[0].pv
composer(faible, 'feu')
lancer(C, faible, { x: 1, y: 0 })
verifier('la mort affaiblit : le coup suivant fait plus mal', faible.ennemis[0].affaibli !== null && pvApresMort - faible.ennemis[0].pv === Math.round(C.cone.degats * (1 + 2 * C.affaiblissement.part)))
const os = calme(['squelette', 20, 0])
composer(os, 'mort', 'mort', 'mort')
lancer(C, os, { x: 1, y: 0 })
verifier('la mort ne fait rien au squelette', os.ennemis[0].pv === C.ennemis.squelette.pv)
const halo = calme(['squelette', 12, 0], ['gobelin', 0, -12], ['squelette', 40, 0])
halo.pv = 10
composer(halo, 'vie', 'vie')
const evHalo = lancer(C, halo, { x: 1, y: 0 })
verifier('le halo de vie soigne la tour (sans drainer en plus), tue le squelette proche (20 pour 18 PV), épargne le gobelin et le squelette loin', evHalo.some((x) => x.type === 'halo') && halo.pv === 10 + 2 * C.vie.soin && halo.ennemis[0].pv <= 0 && halo.ennemis[1].pv === C.ennemis.gobelin.pv && halo.ennemis[2].pv === C.ennemis.squelette.pv)
const plein = calme()
composer(plein, 'vie')
verifier('la tour pleine ne se soigne pas au-delà', lancer(C, plein, { x: 1, y: 0 }).every((x) => x.type !== 'soigne') && plein.pv === C.tour.pv)
const drain = calme(['gobelin', 20, 0], ['gobelin', 24, 3])
drain.pv = 10
composer(drain, 'foudre', 'vie')
lancer(C, drain, { x: 1, y: 0 })
verifier("l'éclair de vie blesse les vivants (la foudre seule) et draine : un PV par ennemi touché", drain.pv === 10 + 2 * C.vie.drain && drain.ennemis[0].pv === C.ennemis.gobelin.pv - C.eclair.degats)

// ---------------------------------------------------------------- les ennemis, les vagues

const assaut = calme(['orc', 0, 30])
const evAssaut = jouer(assaut, 10)
verifier('un ennemi marche sur la tour, puis la frappe', evAssaut.some((x) => x.type === 'tour') && assaut.pv < C.tour.pv)
const p = nouvellePartie(C, 7)
const evVague: Evenement[] = []
for (let i = 0; i < 60 * 10 && p.ennemis.length === 0; i++) evVague.push(...avancer(C, p, PAS, VUE))
verifier('la première vague commence après la pause ; les ennemis naissent hors de l’écran', evVague.some((x) => x.type === 'vague') && p.ennemis.length > 0 && p.ennemis.every((en) => en.x <= -VUE.gauche || en.x >= VUE.droite || en.y <= -VUE.haut || en.y >= VUE.bas))
const p1 = nouvellePartie(C, 7)
const p2 = nouvellePartie(C, 7)
jouer(p1, 20)
jouer(p2, 20)
verifier('même graine : même partie', JSON.stringify(p1) === JSON.stringify(p2))
const inerte = nouvellePartie(C, 3)
jouer(inerte, 600)
verifier('sans un sort, la tour tombe dans la première vague', inerte.phase === 'perdu' && inerte.vague === 1)

/** Un robot qui vise l'ennemi le plus proche avec le sort qui lui convient, un sort toutes les `cadence` secondes. */
function robot(graine: number, cadence: number): EtatMagie {
  const e = nouvellePartie(C, graine)
  let prochain = 0
  for (let i = 0; i < 60 * 900 && e.phase === 'jeu'; i++) {
    avancer(C, e, PAS, VUE)
    if (e.t < prochain || e.ennemis.length === 0) continue
    const cible = [...e.ennemis].sort((u, v) => Math.hypot(u.x, u.y) - Math.hypot(v.x, v.y))[0]
    const pres = Math.hypot(cible.x, cible.y) < 30
    const file: Element[] = cible.type === 'esprit' ? ['froid', 'froid', 'froid'] : cible.type === 'golem' ? ['terre', 'terre', 'terre'] : cible.type === 'squelette' ? (pres ? ['feu', 'vie', 'vie'] : ['foudre', 'vie', 'vie']) : pres ? ['feu', 'feu', 'feu'] : ['foudre', 'foudre', 'foudre']
    composer(e, ...file)
    lancer(C, e, { x: cible.x, y: cible.y })
    prochain = e.t + cadence
  }
  return e
}
const vagues = (cadence: number) => [1, 2, 3, 4, 5, 6].map((g) => robot(g, cadence).vague)
const rapide = vagues(1)
const lentes = vagues(2.5)
verifier('un robot qui lance un sort par seconde tient plusieurs vagues', rapide.every((n) => n >= 4))
console.log(`  (un sort par seconde : tombe aux vagues ${rapide.join(', ')} ; un toutes les 2,5 s : ${lentes.join(', ')})`)

console.log(echecs === 0 ? 'Tout passe.' : `${echecs} echec(s).`)
if (echecs > 0) throw new Error(`${echecs} verification(s) en echec`)

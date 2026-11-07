/**
 * Vérifications du combat à commandes action, sans navigateur : le temps est injecté.
 */
import { avancer, choisir, COMMANDE as C, lacher, nouveauCombat, peutAttaquer, toucher, type EtatCombat, type Evenement } from './combat.ts'

let echecs = 0
function verifier(quoi: string, vrai: boolean): void {
  if (!vrai) echecs += 1
  console.log(`  ${vrai ? 'ok  ' : 'ECHEC'}  ${quoi}`)
}

console.log('commande : le combat')

const PAS = 1 / 60
/** Avance de `s` secondes à pas fixes, depuis `e.t`. */
function jusque(e: EtatCombat & { t?: number }, fin: number, ev: Evenement[] = []): Evenement[] {
  let t = e.t ?? 0
  while (t < fin) {
    t = Math.min(fin, t + PAS)
    ev.push(...avancer(C, e, t))
  }
  e.t = t
  return ev
}

/** Un combat neuf, l'ennemi `rang` en scène, au moment de choisir. */
function enScene(rang = 0, graine = 1): EtatCombat & { t?: number } {
  const e: EtatCombat & { t?: number } = nouveauCombat(C, graine, 0)
  e.rang = rang
  e.pvEnnemi = C.ennemis[rang].pv
  jusque(e, C.arrivee + 0.01)
  return e
}

const neuf = enScene()
verifier("l'ennemi entre, puis on choisit", neuf.phase === 'choix' && neuf.pv === C.heros.pv)

// Le saut sans rien toucher : un seul coup, puis le tour de l'ennemi.
const sec = enScene()
choisir(C, sec, 'saut', sec.t!)
const evSec = jusque(sec, sec.t! + 2)
verifier('un saut sans geste : un seul atterrissage, un dégât, puis le tour ennemi', evSec.filter((x) => x.type === 'atterrit').length === 1 && sec.pvEnnemi === C.ennemis[0].pv - 1 && sec.phase === 'ennemi')

// Le saut, chaque atterrissage touché à temps : on rebondit jusqu'à abattre le Brigand.
const parfait = enScene()
choisir(C, parfait, 'saut', parfait.t!)
const evParfait: Evenement[] = []
for (let i = 0; i < 10 && parfait.phase === 'saut'; i++) {
  const a = parfait.atterrissages[parfait.atterrissages.length - 1]
  if (!a.resolu && a.tape === 'aucune') {
    jusque(parfait, a.t - 0.03, evParfait)
    evParfait.push(...toucher(C, parfait, parfait.t!))
  }
  jusque(parfait, a.t + 0.2, evParfait)
}
verifier('chaque atterrissage touché : le héros rebondit et abat le Brigand (5 PV)', evParfait.filter((x) => x.type === 'atterrit').length === 5 && parfait.pvEnnemi === 0)
jusque(parfait, parfait.t! + 3)
verifier("abattu, le Brigand tombe et le suivant entre", parfait.rang === 1 && parfait.phase === 'choix')

const tot = enScene()
choisir(C, tot, 'saut', tot.t!)
const premier = tot.atterrissages[0]
jusque(tot, premier.t - 0.3)
const evTot = toucher(C, tot, tot.t!)
toucher(C, tot, premier.t)
jusque(tot, tot.t! + 2)
verifier('touché trop tôt : raté, pas de seconde chance, un seul dégât', evTot[0]?.type === 'rate' && tot.pvEnnemi === C.ennemis[0].pv - 1)

const piques = enScene(1)
choisir(C, piques, 'saut', piques.t!)
const evPiques = jusque(piques, piques.t! + 2)
verifier('sauter sur les piques blesse le héros, pas le garde', evPiques.some((x) => x.type === 'piques') && piques.pv === C.heros.pv - C.saut.piques && piques.pvEnnemi === C.ennemis[1].pv)

/** Un coup de marteau : le doigt posé à `appui` après l'arrivée, levé après `tenu` (null : jamais posé). */
function marteau(appui: number | null, tenu: number): EtatCombat & { t?: number } {
  const e = enScene()
  choisir(C, e, 'marteau', e.t!)
  if (appui !== null) {
    const t0 = e.marteau.arrivee + appui
    jusque(e, t0)
    toucher(C, e, t0)
    jusque(e, t0 + tenu)
    lacher(C, e, t0 + tenu)
  }
  jusque(e, e.t! + 4)
  return e
}
verifier('le marteau lâché dans la zone frappe fort', C.ennemis[0].pv - marteau(0.1, C.marteau.charge + 0.1).pvEnnemi === C.marteau.fort)
verifier('lâché trop tôt, il frappe mou', C.ennemis[0].pv - marteau(0.1, C.marteau.charge - 0.2).pvEnnemi === C.marteau.faible)
verifier('tenu trop longtemps, il frappe mou de lui-même', C.ennemis[0].pv - marteau(0.1, 5).pvEnnemi === C.marteau.faible)
verifier('jamais posé, il finit par frapper mou', C.ennemis[0].pv - marteau(null, 0).pvEnnemi === C.marteau.faible)
const course = enScene()
choisir(C, course, 'marteau', course.t!)
toucher(C, course, course.t! + 0.1)
jusque(course, course.marteau.arrivee + C.marteau.charge + 0.1)
lacher(C, course, course.t!)
jusque(course, course.t! + 3)
verifier('le doigt posé pendant la course : la charge part de l’arrivée', C.ennemis[0].pv - course.pvEnnemi === C.marteau.fort)

const lutin = enScene(2)
verifier('le marteau ne vise pas le Lutin ailé', !peutAttaquer(C, lutin, 'marteau') && !choisir(C, lutin, 'marteau', lutin.t!) && peutAttaquer(C, lutin, 'saut'))

/** Le tour de l'ennemi, en touchant `decale` secondes après chaque impact (null : sans toucher). */
function tour(rang: number, decale: number | null, graine = 1): { e: EtatCombat & { t?: number }; ev: Evenement[] } {
  const e = enScene(rang, graine)
  choisir(C, e, 'saut', e.t!)
  jusque(e, e.atterrissages[0].t + C.retour + 0.2)
  const ev: Evenement[] = []
  for (let i = 0; i < 5 && e.phase === 'ennemi'; i++) {
    const k = e.coups.find((x) => !x.resolu)
    if (k === undefined) break
    if (decale !== null) {
      jusque(e, k.impact + decale, ev)
      ev.push(...toucher(C, e, k.impact + decale))
    }
    jusque(e, k.impact + 0.3, ev)
  }
  jusque(e, e.t! + 2, ev)
  return { e, ev }
}
verifier('sans garde, le coup porte en entier', C.heros.pv - tour(0, null).e.pv === C.ennemis[0].attaque)
verifier('paré juste avant : un dégât de moins', C.heros.pv - tour(0, -0.12).e.pv === C.ennemis[0].attaque - 1)
const p = tour(0, -0.02)
verifier('parade parfaite : aucun dégât, une riposte', p.e.pv === C.heros.pv && p.ev.some((x) => x.type === 'riposte') && p.e.pvEnnemi === C.ennemis[0].pv - 1 - C.garde.riposte)
verifier('touché trop tôt : le coup porte en entier', C.heros.pv - tour(0, -0.4).e.pv === C.ennemis[0].attaque)

// Tapoter ne pare pas : une tape trop tôt bloque la garde au moment du coup.
const spam = enScene()
choisir(C, spam, 'saut', spam.t!)
jusque(spam, spam.atterrissages[0].t + C.retour + 0.2)
const k = spam.coups[0]
toucher(C, spam, k.impact - 0.3)
toucher(C, spam, k.impact - 0.05)
jusque(spam, k.impact + 0.5)
verifier('une tape trop tôt bloque la garde : la seconde, pourtant à temps, ne compte pas', C.heros.pv - spam.pv === C.ennemis[0].attaque)

const deux = tour(2, null)
verifier('le Lutin ailé frappe deux fois par tour', deux.ev.filter((x) => x.type === 'coup').length === 2)

const a = tour(0, null, 7)
const b = tour(0, null, 7)
verifier('même graine : les mêmes élans', JSON.stringify(a.e.coups) === JSON.stringify(b.e.coups))
const elans = new Set([1, 2, 3, 4, 5, 6].map((g) => tour(0, null, g).e.coups[0].impact.toFixed(3)))
verifier('d’une graine à l’autre, l’élan change', elans.size > 3)

// Un joueur parfait gagne les trois combats ; un joueur qui ne touche rien perd.
function partie(adroit: boolean): EtatCombat & { t?: number } {
  const e: EtatCombat & { t?: number } = nouveauCombat(C, 42, 0)
  for (let i = 0; i < 2000 && e.phase !== 'gagne' && e.phase !== 'perdu'; i++) {
    if (e.phase === 'choix') {
      const en = C.ennemis[e.rang]
      choisir(C, e, adroit ? (en.piques ? 'marteau' : 'saut') : 'saut', e.t!)
    }
    if (adroit && e.phase === 'saut') {
      const a = e.atterrissages[e.atterrissages.length - 1]
      if (a.tape === 'aucune' && !a.porte && e.t! >= a.t - 0.05) toucher(C, e, e.t!)
    }
    if (adroit && e.phase === 'marteau' && e.marteau.appui === null && e.t! >= e.marteau.arrivee) toucher(C, e, e.t!)
    if (adroit && e.phase === 'marteau' && e.marteau.appui !== null && e.marteau.frappe === null && e.t! >= e.marteau.appui + C.marteau.charge + 0.1) lacher(C, e, e.t!)
    if (adroit && e.phase === 'ennemi') {
      const k = e.coups.find((x) => !x.resolu && x.garde === 'aucune')
      if (k !== undefined && e.t! >= k.impact - 0.02) toucher(C, e, e.t!)
    }
    jusque(e, e.t! + PAS)
  }
  return e
}
const adroit = partie(true)
verifier('un joueur adroit gagne les trois combats sans perdre un PV', adroit.phase === 'gagne' && adroit.pv === C.heros.pv)
verifier('un joueur qui ne touche rien perd', partie(false).phase === 'perdu')

console.log(echecs === 0 ? 'Tout passe.' : `${echecs} echec(s).`)
if (echecs > 0) throw new Error(`${echecs} verification(s) en echec`)

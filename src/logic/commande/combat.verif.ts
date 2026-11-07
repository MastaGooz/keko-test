/**
 * Vérifications du combat à commandes action, sans navigateur : le temps est injecté.
 */
import {
  avancer,
  choisir,
  COMMANDE as C,
  ennemiDuType,
  lacher,
  nouveauCombat,
  peutAttaquer,
  prendre,
  pvMaxDe,
  toucher,
  type Bonus,
  type EtatCombat,
  type Evenement,
  type TypeEnnemi,
} from './combat.ts'

let echecs = 0
function verifier(quoi: string, vrai: boolean): void {
  if (!vrai) echecs += 1
  console.log(`  ${vrai ? 'ok  ' : 'ECHEC'}  ${quoi}`)
}

console.log('commande : le combat')

type Etat = EtatCombat & { t?: number }
const PAS = 1 / 60
/** Avance à pas fixes jusqu'à `fin`, depuis `e.t`. */
function jusque(e: Etat, fin: number, ev: Evenement[] = []): Evenement[] {
  let t = e.t ?? 0
  while (t < fin) {
    t = Math.min(fin, t + PAS)
    ev.push(...avancer(C, e, t))
  }
  e.t = t
  return ev
}

/** Un combat neuf contre un ennemi de ce type (étage 1), au moment de choisir. */
function enScene(type: TypeEnnemi = 'brigand', graine = 1, bonus: Partial<Record<Bonus, number>> = {}): Etat {
  const e: Etat = nouveauCombat(C, graine, 0)
  e.ennemi = ennemiDuType(C, type, 1)
  e.pvEnnemi = e.ennemi.pv
  e.bonus = { ...bonus }
  jusque(e, C.arrivee + 0.01)
  return e
}
const PV = (type: TypeEnnemi) => C.modeles[type].pv

const neuf = enScene()
verifier("l'ennemi entre, puis on choisit", neuf.phase === 'choix' && neuf.pv === C.heros.pv)
verifier('les trois premiers étages : le brigand, le garde à piques, le lutin', [1, 2, 3].map((n) => nouveauCombat(C, 9, 0, n).ennemi.type).join() === 'brigand,piques,lutin')
const chef = nouveauCombat(C, 9, 0, 5).ennemi
verifier('le cinquième étage est un chef, plus solide', chef.estChef && chef.pv > ennemiDuType(C, chef.type, 5).pv && chef.coups === C.modeles[chef.type].coups + 1)
verifier("les ennemis grossissent avec l'étage", ennemiDuType(C, 'brigand', 10).pv > ennemiDuType(C, 'brigand', 1).pv && ennemiDuType(C, 'brigand', 10).attaque > ennemiDuType(C, 'brigand', 1).attaque)

// Le saut sans rien toucher : un seul coup, puis le tour de l'ennemi.
const sec = enScene()
choisir(C, sec, 'saut', sec.t!)
const evSec = jusque(sec, sec.t! + 2)
verifier('un saut sans geste : un seul atterrissage, un dégât, puis le tour ennemi', evSec.filter((x) => x.type === 'atterrit').length === 1 && sec.pvEnnemi === PV('brigand') - 1 && sec.phase === 'ennemi')

/** Un saut où chaque atterrissage est touché à temps. */
function sautParfait(e: Etat): Evenement[] {
  choisir(C, e, 'saut', e.t!)
  const ev: Evenement[] = []
  for (let i = 0; i < 12 && e.phase === 'saut'; i++) {
    const a = e.atterrissages[e.atterrissages.length - 1]
    if (!a.resolu && a.tape === 'aucune') {
      jusque(e, a.t - 0.03, ev)
      ev.push(...toucher(C, e, e.t!))
    }
    jusque(e, a.t + 0.2, ev)
  }
  return ev
}
const parfait = enScene()
verifier('chaque atterrissage touché : le héros rebondit et abat le Brigand (5 PV)', sautParfait(parfait).filter((x) => x.type === 'atterrit').length === 5 && parfait.pvEnnemi === 0)
const evButin = jusque(parfait, parfait.t! + 3)
verifier('abattu, le Brigand tombe et trois améliorations différentes sont offertes', parfait.phase === 'butin' && parfait.offre.length === 3 && new Set(parfait.offre).size === 3 && evButin.some((x) => x.type === 'butin'))
const avantEtage = parfait.etage
prendre(C, parfait, 0, parfait.t!)
verifier("une amélioration prise : l'étage suivant entre", parfait.etage === avantEtage + 1 && parfait.phase === 'arrivee' && parfait.offre.length === 0)

const blesse = enScene()
blesse.pv = 3
sautParfait(blesse)
jusque(blesse, blesse.t! + 3)
verifier('après la victoire, le héros souffle', blesse.pv === 3 + C.repos)

const tot = enScene()
choisir(C, tot, 'saut', tot.t!)
const premier = tot.atterrissages[0]
jusque(tot, premier.t - 0.3)
const evTot = toucher(C, tot, tot.t!)
toucher(C, tot, premier.t)
jusque(tot, tot.t! + 2)
verifier('touché trop tôt : raté, pas de seconde chance, un seul dégât', evTot[0]?.type === 'rate' && tot.pvEnnemi === PV('brigand') - 1)

const piques = enScene('piques')
choisir(C, piques, 'saut', piques.t!)
const evPiques = jusque(piques, piques.t! + 2)
verifier('sauter sur les piques blesse le héros, pas le garde', evPiques.some((x) => x.type === 'piques') && piques.pv === C.heros.pv - C.saut.piques && piques.pvEnnemi === PV('piques'))

/** Un coup de marteau : le doigt posé à `appui` après l'arrivée, levé après `tenu` (null : jamais posé). */
function marteau(appui: number | null, tenu: number, bonus: Partial<Record<Bonus, number>> = {}): Etat {
  const e = enScene('brute', 1, bonus)
  choisir(C, e, 'marteau', e.t!)
  if (appui !== null) {
    const t0 = e.marteau.arrivee + appui
    jusque(e, t0)
    toucher(C, e, t0)
    jusque(e, t0 + tenu)
    lacher(C, e, t0 + tenu)
  }
  jusque(e, e.t! + (appui === null ? C.marteau.attente + 0.9 : 0.9))
  return e
}
const fait = (e: Etat) => PV('brute') - e.pvEnnemi
verifier('le marteau lâché dans la zone frappe fort', fait(marteau(0.1, C.marteau.charge + 0.1)) === C.marteau.fort)
verifier('lâché trop tôt, il frappe mou', fait(marteau(0.1, C.marteau.charge - 0.2)) === C.marteau.faible)
verifier('tenu trop longtemps, il frappe mou de lui-même', fait(marteau(0.1, 5)) === C.marteau.faible)
verifier('jamais posé, il finit par frapper mou', fait(marteau(null, 0)) === C.marteau.faible)
const tard = C.marteau.charge + C.marteau.zone + 0.1
verifier('la Bonne poigne élargit la zone', fait(marteau(0.1, tard)) === C.marteau.faible && fait(marteau(0.1, tard, { poigne: 1 })) === C.marteau.fort)
verifier('le Gros marteau frappe plus fort', fait(marteau(0.1, C.marteau.charge + 0.1, { marteau: 1 })) === C.marteau.fort + C.bonus.marteau)
const course = enScene('brute')
choisir(C, course, 'marteau', course.t!)
toucher(C, course, course.t! + 0.1)
jusque(course, course.marteau.arrivee + C.marteau.charge + 0.1)
lacher(C, course, course.t!)
jusque(course, course.t! + 0.9)
verifier('le doigt posé pendant la course : la charge part de l’arrivée', fait(course) === C.marteau.fort)

const lutin = enScene('lutin')
verifier('le marteau ne vise pas le Lutin ailé', !peutAttaquer(C, lutin, 'marteau') && !choisir(C, lutin, 'marteau', lutin.t!) && peutAttaquer(C, lutin, 'saut'))

const bottes = enScene('brute', 1, { bottes: 1 })
choisir(C, bottes, 'saut', bottes.t!)
jusque(bottes, bottes.t! + 2)
verifier('les Bottes ferrées : deux dégâts par atterrissage', PV('brute') - bottes.pvEnnemi === 2)

/** Le tour d'un ennemi, en touchant `decale` secondes après chaque impact (null : sans toucher). */
function tour(type: TypeEnnemi, decale: number | null, graine = 1, bonus: Partial<Record<Bonus, number>> = {}): { e: Etat; ev: Evenement[] } {
  const e = enScene(type, graine, bonus)
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
const ATT = C.modeles.brigand.attaque
verifier('sans garde, le coup porte en entier', C.heros.pv - tour('brigand', null).e.pv === ATT)
verifier('paré juste avant : un dégât de moins', C.heros.pv - tour('brigand', -0.12).e.pv === ATT - 1)
const p = tour('brigand', -0.02)
verifier('parade parfaite : aucun dégât, une riposte', p.e.pv === C.heros.pv && p.ev.some((x) => x.type === 'riposte') && p.e.pvEnnemi === PV('brigand') - 1 - C.garde.riposte)
verifier('touché trop tôt : le coup porte en entier', C.heros.pv - tour('brigand', -0.4).e.pv === ATT)
verifier('les Réflexes élargissent la garde', C.heros.pv - tour('brigand', -0.19).e.pv === ATT && C.heros.pv - tour('brigand', -0.19, 1, { reflexes: 1 }).e.pv === ATT - 1)
verifier('le Bouclier ôte un dégât de plus', C.heros.pv - tour('brute', -0.12, 1, { bouclier: 1 }).e.pv === C.modeles.brute.attaque - 2)
const epines = tour('brute', -0.12, 1, { epines: 1 })
verifier('les Épines : une simple garde renvoie un dégât', PV('brute') - epines.e.pvEnnemi === 1 + C.bonus.epines)

// Tapoter ne pare pas : une tape trop tôt bloque la garde au moment du coup.
const spam = enScene()
choisir(C, spam, 'saut', spam.t!)
jusque(spam, spam.atterrissages[0].t + C.retour + 0.2)
const k = spam.coups[0]
toucher(C, spam, k.impact - 0.3)
toucher(C, spam, k.impact - 0.05)
jusque(spam, k.impact + 0.5)
verifier('une tape trop tôt bloque la garde : la seconde, pourtant à temps, ne compte pas', C.heros.pv - spam.pv === ATT)

verifier('le Lutin ailé frappe deux fois par tour, le Chapardeur trois', tour('lutin', null).ev.filter((x) => x.type === 'coup').length === 2 && tour('chapardeur', null).ev.filter((x) => x.type === 'coup').length === 3)
const a = tour('brigand', null, 7)
const b = tour('brigand', null, 7)
verifier('même graine : les mêmes élans', JSON.stringify(a.e.coups) === JSON.stringify(b.e.coups))
const elans = new Set([1, 2, 3, 4, 5, 6].map((g) => tour('brigand', null, g).e.coups[0].impact.toFixed(3)))
verifier('d’une graine à l’autre, l’élan change', elans.size > 3)

const coeur = enScene()
coeur.phase = 'butin'
coeur.offre = ['coeur']
prendre(C, coeur, 0, coeur.t!)
verifier('le Cœur : des PV max en plus, rendus aussitôt', pvMaxDe(C, coeur) === C.heros.pv + C.bonus.coeur && coeur.pv === C.heros.pv + C.bonus.coeur)

/** Une course jouée par un robot : `adresse` est la part de ses gestes réussis. */
function course_(adresse: number, graine: number, etageMax = 40): Etat {
  const e: Etat = nouveauCombat(C, graine, 0)
  let hasard = graine
  const reussit = () => ((hasard = (hasard * 1103515245 + 12345) >>> 0) / 2 ** 32) < adresse
  let decision: boolean | null = null
  for (let i = 0; i < 200_000 && e.phase !== 'perdu' && e.etage <= etageMax; i++) {
    if (e.phase === 'butin') prendre(C, e, 0, e.t!)
    if (e.phase === 'choix') choisir(C, e, e.ennemi.piques ? 'marteau' : 'saut', e.t!)
    if (e.phase === 'saut') {
      const a = e.atterrissages[e.atterrissages.length - 1]
      if (a.tape === 'aucune' && !a.porte && e.t! >= a.t - 0.03) {
        decision ??= reussit()
        if (decision) toucher(C, e, e.t!)
      }
      if (a.porte) decision = null
    }
    if (e.phase === 'marteau' && e.marteau.appui === null && e.t! >= e.marteau.arrivee) toucher(C, e, e.t!)
    if (e.phase === 'marteau' && e.marteau.appui !== null && e.marteau.frappe === null && e.t! >= e.marteau.appui + C.marteau.charge + 0.05) {
      decision ??= reussit()
      if (decision) lacher(C, e, e.t!)
    }
    if (e.phase === 'marteau' && e.marteau.frappe !== null) decision = null
    if (e.phase === 'ennemi') {
      const k = e.coups.find((x) => !x.resolu && x.garde === 'aucune')
      if (k !== undefined && e.t! >= k.impact - 0.02 && e.t! < k.impact) {
        decision ??= reussit()
        if (decision) toucher(C, e, e.t!)
        else decision = null
      }
    }
    jusque(e, e.t! + PAS)
  }
  return e
}
verifier('un joueur adroit passe le vingtième étage', course_(1, 42, 20).etage > 20)
const maladroit = [1, 2, 3, 4, 5].map((g) => course_(0, g).etage)
verifier('un joueur qui ne touche rien tombe avant le quatrième étage', maladroit.every((n) => n < 4))
const moyens = [1, 2, 3, 4, 5, 6, 7, 8].map((g) => course_(0.6, g).etage)
console.log(`  (un joueur qui réussit 60 % de ses gestes tombe aux étages ${moyens.join(', ')})`)

console.log(echecs === 0 ? 'Tout passe.' : `${echecs} echec(s).`)
if (echecs > 0) throw new Error(`${echecs} verification(s) en echec`)

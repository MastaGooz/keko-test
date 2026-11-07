/**
 * Vérifications du combat à commandes action, sans navigateur : le temps est injecté.
 */
import { createRng } from '../rng.ts'
import { accessibles, CARTE, nouvelleCarte } from './carte.ts'
import {
  acheter,
  allerA,
  avancer,
  choisirLePremierSort,
  COMMANDE as C,
  empecheDAcheter,
  ennemiDuType,
  lacher,
  lancer,
  nouveauCombat,
  nouvelleCourse,
  peutLancer,
  prendre,
  pvMaxDe,
  quitter,
  repondre,
  sallesAccessibles,
  seReposer,
  sEntrainer,
  toucher,
  utiliser,
  type Bonus,
  type EtatCombat,
  type Evenement,
  type Sort,
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

/** Un combat neuf contre un ennemi de ce type (étage 1), tous les sorts connus, au moment de choisir. */
function enScene(type: TypeEnnemi = 'brute', graine = 1, bonus: Partial<Record<Bonus, number>> = {}): Etat {
  const e: Etat = nouveauCombat(C, graine, 0)
  e.ennemi = ennemiDuType(C, type, 1)
  e.pvEnnemi = e.ennemi.pv
  e.bonus = { ...bonus }
  jusque(e, C.arrivee + 0.01)
  return e
}
const PV = (type: TypeEnnemi) => C.modeles[type].pv
const fait = (e: Etat, type: TypeEnnemi = 'brute') => PV(type) - e.pvEnnemi

// ---------------------------------------------------------------- le départ, les ennemis

const depart = nouvelleCourse(C, 3, 0)
verifier('une course commence par le choix du premier sort', depart.phase === 'depart' && depart.sorts.length === 0 && sallesAccessibles(depart).length === 0)
choisirLePremierSort(depart, 'missiles', 0)
verifier('le sort choisi, la carte s’ouvre ; on ne connaît que lui', depart.phase === 'carte' && depart.sorts.join() === 'missiles' && sallesAccessibles(depart).length > 0)

const neuf = enScene()
verifier("l'ennemi entre, puis on choisit", neuf.phase === 'choix' && neuf.pv === C.heros.pv)
verifier('les trois premiers étages : le brigand, le lutin, le squelette', [1, 2, 3].map((n) => nouveauCombat(C, 9, 0, n).ennemi.type).join() === 'brigand,lutin,squelette')
const chef = ennemiDuType(C, 'brute', 6, 'chef')
const elite = ennemiDuType(C, 'brute', 6, 'elite')
const simple = ennemiDuType(C, 'brute', 6)
verifier('le chef et l’élite sont plus solides et plus forts ; le chef frappe une fois de plus', chef.pv > elite.pv && elite.pv > simple.pv && elite.attaque > simple.attaque && chef.coups === simple.coups + 1 && elite.coups === simple.coups)
verifier("les ennemis grossissent avec l'étage", ennemiDuType(C, 'brigand', 10).pv > ennemiDuType(C, 'brigand', 1).pv && ennemiDuType(C, 'brigand', 10).attaque > ennemiDuType(C, 'brigand', 1).attaque)
const novice = nouvelleCourse(C, 3, 0)
choisirLePremierSort(novice, 'feu', 0)
novice.phase = 'choix'
verifier('on ne lance que les sorts connus', peutLancer(novice, 'feu') && !peutLancer(novice, 'eclair') && !lancer(C, novice, 'eclair', 0))

// ---------------------------------------------------------------- la boule de feu

/** Une boule de feu : le doigt posé à `appui` après que le bâton est prêt, levé après `tenu` (null : jamais posé). */
function feu(appui: number | null, tenu: number, bonus: Partial<Record<Bonus, number>> = {}): Etat {
  const e = enScene('brute', 1, bonus)
  lancer(C, e, 'feu', e.t!)
  if (appui !== null) {
    const t0 = e.feu.pret + appui
    jusque(e, t0)
    toucher(C, e, t0)
    jusque(e, t0 + tenu)
    lacher(C, e, t0 + tenu)
  }
  jusque(e, e.t! + (appui === null ? C.feu.attente + 0.9 : 0.9))
  return e
}
verifier('la boule de feu lâchée à l’étoile frappe fort', fait(feu(0.1, C.feu.charge + 0.1)) === C.feu.fort)
verifier('lâchée trop tôt, elle part molle', fait(feu(0.1, C.feu.charge - 0.2)) === C.feu.faible)
verifier('tenue trop longtemps, elle part molle d’elle-même', fait(feu(0.1, 5)) === C.feu.faible)
verifier('jamais tenue, elle finit par partir molle', fait(feu(null, 0)) === C.feu.faible)
const tard = C.feu.charge + C.feu.zone + 0.1
verifier('la Concentration élargit la zone', fait(feu(0.1, tard)) === C.feu.faible && fait(feu(0.1, tard, { concentration: 1 })) === C.feu.fort)
verifier('le Brasier frappe plus fort', fait(feu(0.1, C.feu.charge + 0.1, { brasier: 1 })) === C.feu.fort + C.bonus.brasier)
const avantPret = enScene()
lancer(C, avantPret, 'feu', avantPret.t!)
toucher(C, avantPret, avantPret.t! + 0.05)
jusque(avantPret, avantPret.feu.pret + C.feu.charge + 0.1)
lacher(C, avantPret, avantPret.t!)
jusque(avantPret, avantPret.t! + 0.9)
verifier('le doigt posé pendant que le bâton se lève : la charge part quand il est prêt', fait(avantPret) === C.feu.fort)

// ---------------------------------------------------------------- l'éclair

const sec = enScene()
lancer(C, sec, 'eclair', sec.t!)
const evSec = jusque(sec, sec.t! + 2)
verifier('un éclair sans geste : un seul anneau, un dégât, puis le tour ennemi', evSec.filter((x) => x.type === 'eclair').length === 1 && fait(sec) === 1 && sec.phase === 'ennemi')

/** Un éclair où chaque anneau est touché `decale` secondes avant de se refermer. */
function eclairJuste(e: Etat, decale = 0.03): Evenement[] {
  lancer(C, e, 'eclair', e.t!)
  const ev: Evenement[] = []
  for (let i = 0; i < 12 && e.phase === 'eclair'; i++) {
    const a = e.anneaux[e.anneaux.length - 1]
    if (!a.resolu && a.tape === 'aucune') {
      jusque(e, a.t - decale, ev)
      ev.push(...toucher(C, e, e.t!))
    }
    jusque(e, a.t + 0.2, ev)
  }
  return ev
}
const juste = enScene('brigand')
verifier('chaque anneau touché à temps : cinq éclairs en chaîne abattent le Brigand (5 PV)', eclairJuste(juste).filter((x) => x.type === 'eclair').length === 5 && juste.pvEnnemi === 0)
const evButin = jusque(juste, juste.t! + 3)
verifier('abattu, il tombe et trois améliorations différentes sont offertes', juste.phase === 'butin' && juste.offre.length === 3 && new Set(juste.offre).size === 3 && evButin.some((x) => x.type === 'butin'))
verifier('la victoire paie : l’or de la salle, plus un par geste réussi', juste.gestes > 0 && juste.or === C.salles.or.combat + juste.gestes)
prendre(C, juste, 0, juste.t!)
verifier('une amélioration prise : retour à la carte', juste.phase === 'carte' && juste.offre.length === 0)
const longue = enScene('brute', 1, { orage: 1, conducteur: 1 })
longue.pvEnnemi = 100
eclairJuste(longue)
verifier('l’Orage allonge la chaîne, le Conducteur frappe plus fort', longue.stats.eclairs === C.eclair.max + 1 && 100 - longue.pvEnnemi === (C.eclair.max + 1) * 2)
const tot = enScene()
lancer(C, tot, 'eclair', tot.t!)
const premier = tot.anneaux[0]
jusque(tot, premier.t - 0.3)
const evTot = toucher(C, tot, tot.t!)
toucher(C, tot, premier.t)
jusque(tot, tot.t! + 2)
verifier('touché trop tôt : raté, pas de seconde chance, un seul éclair', evTot[0]?.type === 'rate' && fait(tot) === 1)
const sansFocale = enScene()
eclairJuste(sansFocale, 0.15)
const avecFocale = enScene('brute', 1, { focale: 1 })
eclairJuste(avecFocale, 0.15)
verifier('la Focale élargit l’anneau', sansFocale.stats.eclairs === 1 && avecFocale.stats.eclairs > 1)

// ---------------------------------------------------------------- les missiles

/** Une salve : `n` tapes réparties sur la durée, en commençant `apres` secondes après « Prêt ». */
function salve(n: number, bonus: Partial<Record<Bonus, number>> = {}, apres = 0.05): Etat {
  const e = enScene('brute', 1, bonus)
  lancer(C, e, 'missiles', e.t!)
  const duree = e.missiles.fin - e.missiles.debut
  for (let i = 0; i < n; i++) {
    const ti = e.missiles.debut + apres + (i * (duree - apres - 0.05)) / Math.max(1, n)
    jusque(e, ti)
    toucher(C, e, ti)
  }
  jusque(e, e.missiles.fin + 1.2)
  return e
}
const vide = salve(0)
verifier('aucune tape : aucun missile ne porte, puis le tour ennemi', fait(vide) === 0 && vide.phase === 'ennemi')
verifier('douze tapes : trois missiles portent', fait(salve(12)) === 3)
verifier('vingt tapes : cinq missiles', fait(salve(20)) === 5)
verifier('la Salve : un missile toutes les trois tapes', fait(salve(12, { salve: 1 })) === 4)
const avantSalve = enScene()
lancer(C, avantSalve, 'missiles', avantSalve.t!)
for (let i = 0; i < 8; i++) toucher(C, avantSalve, avantSalve.t! + 0.01 * i)
verifier('les tapes avant « Prêt » ne comptent pas', avantSalve.missiles.taps === 0)
const endurance = enScene('brute', 1, { endurance: 1 })
lancer(C, endurance, 'missiles', 0)
verifier('l’Endurance allonge la salve', Math.abs(endurance.missiles.fin - endurance.missiles.debut - (C.missiles.duree + C.bonus.endurance)) < 1e-9)

// ---------------------------------------------------------------- la garde

/** Le tour d'un ennemi (après un éclair sans geste), en touchant `decale` secondes après chaque impact (null : sans toucher). */
function tour(type: TypeEnnemi, decale: number | null, graine = 1, bonus: Partial<Record<Bonus, number>> = {}): { e: Etat; ev: Evenement[] } {
  const e = enScene(type, graine, bonus)
  lancer(C, e, 'eclair', e.t!)
  jusque(e, e.anneaux[0].t + C.eclair.pause + 0.2)
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
verifier('parade parfaite : aucun dégât, une riposte', p.e.pv === C.heros.pv && p.ev.some((x) => x.type === 'riposte') && fait(p.e, 'brigand') === 1 + C.garde.riposte)
verifier('touché trop tôt : le coup porte en entier', C.heros.pv - tour('brigand', -0.4).e.pv === ATT)
verifier('les Réflexes élargissent la garde', C.heros.pv - tour('brigand', -0.19).e.pv === ATT && C.heros.pv - tour('brigand', -0.19, 1, { reflexes: 1 }).e.pv === ATT - 1)
verifier('le Bouclier ôte un dégât de plus', C.heros.pv - tour('brute', -0.12, 1, { bouclier: 1 }).e.pv === C.modeles.brute.attaque - 2)
verifier('les Épines : une simple garde renvoie un dégât', fait(tour('brute', -0.12, 1, { epines: 1 }).e) === 1 + C.bonus.epines)
const spam = enScene()
lancer(C, spam, 'eclair', spam.t!)
jusque(spam, spam.anneaux[0].t + C.eclair.pause + 0.2)
const k = spam.coups[0]
toucher(C, spam, k.impact - 0.3)
toucher(C, spam, k.impact - 0.05)
jusque(spam, k.impact + 0.5)
verifier('une tape trop tôt bloque la garde : la seconde, pourtant à temps, ne compte pas', C.heros.pv - spam.pv === C.modeles.brute.attaque)
verifier('le Lutin ailé frappe deux fois par tour, le Chapardeur trois', tour('lutin', null).ev.filter((x) => x.type === 'coup').length === 2 && tour('chapardeur', null).ev.filter((x) => x.type === 'coup').length === 3)
const a = tour('brigand', null, 7)
const b = tour('brigand', null, 7)
verifier('même graine : les mêmes élans', JSON.stringify(a.e.coups) === JSON.stringify(b.e.coups))
const elans = new Set([1, 2, 3, 4, 5, 6].map((g) => tour('brigand', null, g).e.coups[0].impact.toFixed(3)))
verifier('d’une graine à l’autre, l’élan change', elans.size > 3)

// ---------------------------------------------------------------- les améliorations, les grimoires

const coeur = enScene()
coeur.phase = 'butin'
coeur.offre = ['coeur']
prendre(C, coeur, 0, coeur.t!)
verifier('le Cœur : des PV max en plus, rendus aussitôt', pvMaxDe(C, coeur) === C.heros.pv + C.bonus.coeur && coeur.pv === C.heros.pv + C.bonus.coeur)
const grimoire = nouvelleCourse(C, 11, 0) as Etat
choisirLePremierSort(grimoire, 'feu', 0)
grimoire.phase = 'butin'
grimoire.offre = ['eclair']
prendre(C, grimoire, 0, 0)
verifier('un Grimoire apprend un sort', grimoire.sorts.join() === 'feu,eclair')
const offres = new Set<Bonus>()
for (let g = 1; g <= 40; g++) {
  const e = nouvelleCourse(C, g, 0)
  choisirLePremierSort(e, 'feu', 0)
  e.phase = 'repos'
  sEntrainer(C, e, 0)
  e.offre.forEach((x) => offres.add(x))
}
verifier('on n’offre ni le sort qu’on connaît, ni ce qui renforce un sort inconnu', !offres.has('feu') && !offres.has('conducteur') && !offres.has('salve') && offres.has('brasier') && offres.has('eclair'))

// ---------------------------------------------------------------- la carte et les salles

const cartes = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((g) => nouvelleCarte(createRng(g)))
verifier('la carte : six rangs, des combats au premier, un feu avant le chef, le chef seul au bout', cartes.every((k) => k.length === CARTE.rangs && k[0].every((n) => n.salle === 'combat') && k[CARTE.rangs - 2].some((n) => n.salle === 'repos') && k[CARTE.rangs - 1].length === 1 && k[CARTE.rangs - 1][0].salle === 'chef'))
verifier('chaque salle mène quelque part, et chacune a une entrée', cartes.every((k) => k.every((rang, r) => rang.every((n, i) => (r === k.length - 1 || n.suivants.length > 0) && (r === 0 || k[r - 1].some((m) => m.suivants.includes(i)))))))
verifier("pas d'élite aux deux premiers rangs", cartes.every((k) => k.slice(0, CARTE.eliteDepuis).every((rang) => rang.every((n) => n.salle !== 'elite'))))
verifier('des cartes qui changent : on y trouve des élites, des boutiques, des événements', ['elite', 'boutique', 'evenement'].every((x) => cartes.some((k) => k.some((rang) => rang.some((n) => n.salle === x)))))

const neuve = nouvelleCourse(C, 3, 0) as Etat
choisirLePremierSort(neuve, 'feu', 0)
neuve.t = 0
verifier('une potion dans le sac au départ', neuve.objets.join() === 'potion')
verifier('on ne saute pas un rang', allerA(C, neuve, { rang: 1, i: 0 }, 0).length === 0 && neuve.phase === 'carte')
allerA(C, neuve, { rang: 0, i: 0 }, 0)
verifier('une salle de combat : l’ennemi entre', neuve.phase === 'arrivee' && neuve.etage === 1 && neuve.place?.rang === 0)

/** Une salle d'une sorte donnée, posée sur le premier rang. */
function salle(sorte: 'repos' | 'boutique' | 'evenement' | 'elite' | 'chef', or = 0): Etat {
  const e = nouvelleCourse(C, 5, 0) as Etat
  choisirLePremierSort(e, 'eclair', 0)
  e.t = 0
  e.carte[0][0].salle = sorte
  e.or = or
  allerA(C, e, { rang: 0, i: 0 }, 0)
  return e
}
const feuDeCamp = salle('repos')
feuDeCamp.pv = 2
verifier('le feu de camp soigne une part des PV max', seReposer(C, feuDeCamp, 0) === Math.round(C.heros.pv * C.salles.feu) && feuDeCamp.phase === 'carte')
const entrainement = salle('repos')
sEntrainer(C, entrainement, 0)
verifier('… ou entraîne : une amélioration au choix', entrainement.phase === 'butin' && entrainement.offre.length === 3)

const pauvre = salle('boutique', 0)
verifier('la boutique : six articles, rien sans or', pauvre.phase === 'boutique' && pauvre.boutique.length === 6 && !acheter(C, pauvre, 0) && empecheDAcheter(C, pauvre, 0) === 'Pas assez d’or')
const riche = salle('boutique', 200)
const i0 = riche.boutique.findIndex((x) => x.sorte === 'bonus')
const b0 = riche.boutique[i0]
verifier('acheter une amélioration : l’or baisse, elle est prise, l’article est vendu', acheter(C, riche, i0) && riche.or === 200 - C.salles.prix.bonus && b0.sorte === 'bonus' && ((riche.bonus[b0.bonus] ?? 0) === 1 || riche.sorts.includes(b0.bonus as Sort)) && !acheter(C, riche, i0))
riche.objets = ['bombe', 'bombe', 'bombe']
const iObjet = riche.boutique.findIndex((x) => x.sorte === 'objet')
verifier('le sac plein refuse un objet', !acheter(C, riche, iObjet) && empecheDAcheter(C, riche, iObjet) === 'Sac plein')
quitter(riche, 0)
verifier('on quitte la boutique vers la carte', riche.phase === 'carte')

const refus = salle('evenement')
repondre(C, refus, false, 0)
verifier('un événement refusé : on passe son chemin', refus.evenement?.issue === 'Vous passez votre chemin.' && refus.pv === C.heros.pv)
const coffre = salle('evenement')
coffre.evenement = { cle: 'coffre', issue: null }
repondre(C, coffre, true, 0)
verifier('le coffre piégé : de l’or, quelques PV', coffre.or === 25 && coffre.pv === C.heros.pv - 2)
const autel = salle('evenement')
autel.evenement = { cle: 'autel', issue: null }
repondre(C, autel, true, 0)
verifier('l’autel : des PV contre une amélioration', autel.pv === C.heros.pv - 4 && autel.phase === 'butin')

/** Une salle de combat jouée jusqu'au moment de choisir. */
function auChoix(sorte: 'elite' | 'chef'): Etat {
  const e = salle(sorte)
  jusque(e, C.arrivee + 0.01)
  return e
}
const el = auChoix('elite')
el.objets = []
el.pvEnnemi = 1
lancer(C, el, 'eclair', el.t!)
jusque(el, el.t! + 3)
verifier('une élite abattue : plus d’or, et un objet', el.phase === 'butin' && el.or === C.salles.or.elite && el.objets.length === 1)
const boss = auChoix('chef')
boss.pvEnnemi = 1
lancer(C, boss, 'eclair', boss.t!)
jusque(boss, boss.t! + 3)
prendre(C, boss, 0, boss.t!)
verifier('le chef abattu : un acte neuf, sur une carte neuve', boss.acte === 2 && boss.phase === 'carte' && boss.place === null && sallesAccessibles(boss).length > 0)
allerA(C, boss, accessibles(boss.carte, null)[0], boss.t!)
verifier("l'acte deux commence à l'étage sept", boss.etage === CARTE.rangs + 1)

const potion = auChoix('elite')
potion.pv = 3
utiliser(C, potion, 0, potion.t!)
verifier('la potion rend des PV, sans prendre le tour', potion.pv === 3 + C.salles.potion && potion.objets.length === 0 && potion.phase === 'choix')
const bombe = auChoix('elite')
bombe.objets = ['bombe']
const pvAvant = bombe.pvEnnemi
utiliser(C, bombe, 0, bombe.t!)
verifier('la bombe frappe sans geste', bombe.pvEnnemi === pvAvant - C.salles.bombe)
const fumee = auChoix('elite')
fumee.objets = ['fumigene']
utiliser(C, fumee, 0, fumee.t!)
lancer(C, fumee, 'eclair', fumee.t!)
const evFumee = jusque(fumee, fumee.t! + 2.5)
verifier("le fumigène : l'ennemi passe son tour", evFumee.some((x) => x.type === 'fumee') && !evFumee.some((x) => x.type === 'tour') && fumee.phase === 'choix')
const piment = auChoix('elite')
piment.objets = ['piment']
utiliser(C, piment, 0, piment.t!)
const pvPiment = piment.pvEnnemi
lancer(C, piment, 'eclair', piment.t!)
jusque(piment, piment.anneaux[0].t + C.eclair.pause + 0.1)
verifier('le piment double le prochain sort, et pas le suivant', pvPiment - piment.pvEnnemi === 2 && !piment.piment)

// ---------------------------------------------------------------- des courses jouées par des robots

/** Une course jouée par un robot : `adresse` est la part de ses gestes réussis (et sa vitesse aux missiles, sur dix tapes par seconde). Il prend la première route, se soigne au feu sous 60 %, achète la première amélioration qu'il peut, refuse les paris, lance le dernier sort appris. */
function course(premier: Sort, adresse: number, graine: number, etageMax = 40): Etat {
  const e: Etat = nouvelleCourse(C, graine, 0)
  e.t = 0
  choisirLePremierSort(e, premier, 0)
  let hasard = graine
  const reussit = () => ((hasard = (hasard * 1103515245 + 12345) >>> 0) / 2 ** 32) < adresse
  let decision: boolean | null = null
  let prochaineTape = 0
  for (let i = 0; i < 400_000 && e.phase !== 'perdu' && e.etage <= etageMax; i++) {
    if (e.phase === 'carte') allerA(C, e, sallesAccessibles(e)[0], e.t!)
    if (e.phase === 'repos') {
      if (e.pv < pvMaxDe(C, e) * 0.6) seReposer(C, e, e.t!)
      else sEntrainer(C, e, e.t!)
    }
    if (e.phase === 'boutique') {
      const j = e.boutique.findIndex((x, n) => x.sorte === 'bonus' && empecheDAcheter(C, e, n) === null)
      if (j >= 0) acheter(C, e, j)
      quitter(e, e.t!)
    }
    if (e.phase === 'evenement') {
      repondre(C, e, false, e.t!)
      quitter(e, e.t!)
    }
    if (e.phase === 'butin') prendre(C, e, 0, e.t!)
    if (e.phase === 'choix' && e.pv <= 3 && e.objets.includes('potion')) utiliser(C, e, e.objets.indexOf('potion'), e.t!)
    if (e.phase === 'choix') {
      lancer(C, e, e.sorts[e.sorts.length - 1], e.t!)
      prochaineTape = e.t!
    }
    if (e.phase === 'eclair') {
      const an = e.anneaux[e.anneaux.length - 1]
      if (an.tape === 'aucune' && !an.porte && e.t! >= an.t - 0.03) {
        decision ??= reussit()
        if (decision) toucher(C, e, e.t!)
      }
      if (an.porte) decision = null
    }
    if (e.phase === 'feu' && e.feu.appui === null && e.t! >= e.feu.pret) toucher(C, e, e.t!)
    if (e.phase === 'feu' && e.feu.appui !== null && e.feu.frappe === null && e.t! >= e.feu.appui + C.feu.charge + 0.05) {
      decision ??= reussit()
      if (decision) lacher(C, e, e.t!)
    }
    if (e.phase === 'feu' && e.feu.frappe !== null) decision = null
    if (e.phase === 'missiles' && e.t! >= prochaineTape) {
      toucher(C, e, e.t!)
      prochaineTape = e.t! + 1 / (10 * adresse + 0.01)
    }
    if (e.phase === 'ennemi') {
      const kk = e.coups.find((x) => !x.resolu && x.garde === 'aucune')
      if (kk !== undefined && e.t! >= kk.impact - 0.02 && e.t! < kk.impact) {
        decision ??= reussit()
        if (decision) toucher(C, e, e.t!)
        else decision = null
      }
    }
    jusque(e, e.t! + PAS)
  }
  return e
}
verifier('un joueur adroit passe le vingtième étage, quel que soit son premier sort', (['feu', 'eclair', 'missiles'] as Sort[]).every((s) => course(s, 1, 42, 20).etage > 20))
const maladroit = [1, 2, 3, 4, 5].map((g) => course('eclair', 0, g).etage)
verifier('un joueur qui ne touche rien tombe dans le premier acte', maladroit.every((n) => n <= CARTE.rangs))
for (const s of ['feu', 'eclair', 'missiles'] as Sort[]) {
  const moyens = [1, 2, 3, 4, 5, 6, 7, 8].map((g) => course(s, 0.6, g).etage)
  console.log(`  (${s} d’abord, un joueur à 60 % tombe aux étages ${moyens.join(', ')})`)
}
console.log(`  (qui ne touche rien, aux étages ${maladroit.join(', ')})`)

console.log(echecs === 0 ? 'Tout passe.' : `${echecs} echec(s).`)
if (echecs > 0) throw new Error(`${echecs} verification(s) en echec`)

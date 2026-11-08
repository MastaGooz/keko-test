/**
 * Vérifications de Néon, sans navigateur : le temps est injecté.
 */
import { avancer, choisir, degatsDeParade, NEON as C, nouvellePartie, parable, parer, type Ennemi, type EtatNeon, type Evenement, type TypeEnnemi } from './jeu.ts'

let echecs = 0
function verifier(quoi: string, vrai: boolean): void {
  if (!vrai) echecs += 1
  console.log(`  ${vrai ? 'ok  ' : 'ECHEC'}  ${quoi}`)
}

console.log('néon : le cercle qui pare')

const PAS = 1 / 120
const VUE = { haut: 170, demiLargeur: 50 }
function jouer(e: EtatNeon, s: number): Evenement[] {
  const ev: Evenement[] = []
  for (let t = 0; t < s - 1e-9 && e.phase === 'jeu'; t += PAS) ev.push(...avancer(C, e, PAS, VUE))
  return ev
}
/** Une partie calme (aucune naissance, aucun tir automatique), avec ces ennemis posés. */
function calme(...ennemis: [TypeEnnemi, number, number][]): EtatNeon {
  const e = nouvellePartie(C, 1)
  e.prochaineNaissance = Infinity
  e.prochainTir = Infinity
  for (const [type, x, y] of ennemis) poser(e, type, x, y)
  return e
}
function poser(e: EtatNeon, type: TypeEnnemi, x: number, y: number): Ennemi {
  const pv = C.ennemis[type].pv
  const en: Ennemi = { id: e.prochainId++, type, x, y, pv, pvMax: pv, contactA: null, etourdiA: -Infinity, reculVx: 0, reculVy: 0, tirA: Infinity, sens: 1, angle: 0 }
  e.ennemis.push(en)
  return en
}
/** Un triangle qui touchera le cercle dans tant de secondes (il descend tout droit). */
function triangleA(e: EtatNeon, s: number): Ennemi {
  return poser(e, 'triangle', 0, -(C.cercle.rayon + C.ennemis.triangle.rayon + s * C.ennemis.triangle.vitesse))
}

// ---------------------------------------------------------------- la parade

const v = calme()
verifier('au départ, 5 PV, en jeu, rien à parer', v.pv === 5 && v.phase === 'jeu' && parable(C, v) === null)
const rate = parer(C, v)
verifier('une tape dans le vide est ratée, et bloque la parade', rate[0]?.type === 'rate' && v.verrouA === v.t + C.parade.verrou)
verifier('bloquée, la tape suivante ne fait rien', parer(C, v)[0]?.type === 'bloque')
jouer(v, C.parade.verrou + 0.01)
verifier('le verrou passé, une tape ratée se compte à nouveau', parer(C, v)[0]?.type === 'rate')

const loin = calme()
triangleA(loin, 0.5)
verifier('à 0,5 s du contact, rien à parer', parable(C, loin) === null && parer(C, loin)[0]?.type === 'rate')

const juste = calme()
const tj = triangleA(juste, 0.15)
const p1 = parable(C, juste)
verifier('à 0,15 s du contact, le triangle est parable, pas parfait', p1 !== null && p1.sorte === 'ennemi' && p1.id === tj.id && !p1.parfaite && Math.abs(p1.ecart - 0.15) < 0.01)
const evJuste = parer(C, juste)
verifier('paré, il encaisse 5 et meurt', evJuste[0]?.type === 'parade' && evJuste[0].qualite === 'parade' && evJuste[0].degats === 5 && evJuste.some((x) => x.type === 'mort') && juste.abattus === 1)
verifier("pas d'onde sans parfaite", !evJuste.some((x) => x.type === 'onde'))

const parfait = calme()
triangleA(parfait, 0.05)
const autre = poser(parfait, 'carre', 12, -8)
const p2 = parable(C, parfait)
verifier('à 0,05 s du contact, la parade est parfaite', p2 !== null && p2.parfaite)
const evParfait = parer(C, parfait)
verifier('parfaite : ×3, et une onde qui frappe le carré à côté', evParfait[0]?.type === 'parade' && evParfait[0].qualite === 'parfaite' && evParfait[0].degats === 15 && evParfait.some((x) => x.type === 'onde' && x.touches === 1) && autre.pv === C.ennemis.carre.pv - C.onde.degats && autre.etourdiA > parfait.t)

const retard = calme()
const trd = triangleA(retard, 0.2)
jouer(retard, 0.2 + 0.05)
verifier("le retard du doigt compte : collé depuis 0,05 s, la parade n'est plus parfaite ; le doigt posé il y a 0,03 s, si", trd.contactA !== null && parable(C, retard)?.parfaite === false && parable(C, retard, 0.03)?.parfaite === true)
const tot = calme()
triangleA(tot, 0.15)
verifier("et dans l'autre sens : parable maintenant, il ne l'était pas quand le doigt a touché il y a 0,1 s", parable(C, tot) !== null && parable(C, tot, 0.1) === null)

const riposte = calme()
riposte.ameliorations.riposte = 2
verifier('la Riposte renforce la parade (+4 par rang)', degatsDeParade(C, riposte, false) === 13 && degatsDeParade(C, riposte, true) === 39)

// ---------------------------------------------------------------- le contact

const contact = calme()
const tc = triangleA(contact, 0.2)
jouer(contact, 0.21)
verifier('arrivé au cercle, le triangle y reste collé un instant, et se pare encore', tc.contactA !== null && parable(C, contact) !== null && parable(C, contact)!.parfaite)
const evCoup = jouer(contact, C.parade.apres + 0.02)
verifier("pas paré, le coup tombe : 1 PV de moins, le triangle s'efface", evCoup.some((x) => x.type === 'coup' && x.degats === 1) && contact.pv === 4 && contact.ennemis.length === 0)

const recul = calme()
const tr = poser(recul, 'carre', 0, -(C.cercle.rayon + C.ennemis.carre.rayon + 0.15 * C.ennemis.carre.vitesse))
const yAvant = tr.y
parer(C, recul)
jouer(recul, 0.3)
verifier('le carré paré survit, recule, puis revient', tr.pv === C.ennemis.carre.pv - 5 && tr.y < yAvant - 3 && recul.ennemis.includes(tr))

// ---------------------------------------------------------------- les losanges

const losange = calme()
const hex = poser(losange, 'hexagone', 0, -C.hexagone.halte)
hex.tirA = 0
const evTir = jouer(losange, 0.05)
verifier("l'hexagone à sa halte tire un losange vers le cercle", evTir.some((x) => x.type === 'projectile') && losange.projectiles.length === 1 && losange.projectiles[0].vy > 0)
// On avance jusqu'à ce qu'il soit parable.
let n = 0
while (parable(C, losange) === null && n++ < 2000) avancer(C, losange, PAS, VUE)
const pl = parable(C, losange)
verifier('le losange qui arrive se pare', pl !== null && pl.sorte === 'projectile')
const evRenvoi = parer(C, losange)
verifier("paré, il repart vers l'hexagone", evRenvoi[0]?.type === 'parade' && evRenvoi[0].sorte === 'projectile' && losange.projectiles.length === 0 && losange.tirs.length === 1 && losange.tirs[0].renvoye && losange.tirs[0].vy < 0)
const evRetour = jouer(losange, 2.5)
verifier("et le frappe des dégâts de la parade, même s'il a dérivé", evRetour.some((x) => x.type === 'touche' && x.id === hex.id && x.degats === 5))

const parfaitLosange = calme()
const hexP = poser(parfaitLosange, 'hexagone', 0, -C.hexagone.halte)
hexP.tirA = 0
let m = 0
while (parable(C, parfaitLosange)?.parfaite !== true && m++ < 4000) avancer(C, parfaitLosange, PAS, VUE)
parer(C, parfaitLosange)
verifier("un losange paré parfaitement repart ×3, mais ne traverse plus rien", parfaitLosange.tirs.length === 1 && parfaitLosange.tirs[0].degats === 15 && parfaitLosange.tirs[0].percant === 0)

const pasPare = calme()
const hex2 = poser(pasPare, 'hexagone', 0, -C.hexagone.halte)
hex2.tirA = 0
const evPerce = jouer(pasPare, 4)
verifier('un losange non paré coûte 1 PV', evPerce.filter((x) => x.type === 'coup' && x.sorte === 'projectile' && x.degats === 1).length === 5 - pasPare.pv && pasPare.pv < 5)

// ---------------------------------------------------------------- le tir automatique et les niveaux

const auto = nouvellePartie(C, 3)
auto.prochaineNaissance = Infinity
poser(auto, 'triangle', 0, -60)
const evAuto = jouer(auto, 0.6)
verifier('le cercle tire tout seul sur ce qui approche', evAuto.some((x) => x.type === 'tir') && (auto.tirs.length > 0 || evAuto.some((x) => x.type === 'touche')))
const evTue = jouer(auto, 3)
verifier('et finit par le tuer', evTue.some((x) => x.type === 'mort') && auto.abattus === 1 && auto.xp === C.ennemis.triangle.xp)

const niveau = calme()
niveau.xp = C.niveau.base - 1
triangleA(niveau, 0.1)
const evNiveau = parer(C, niveau)
verifier('assez d’expérience : un niveau, trois choix différents, le jeu s’arrête', evNiveau.some((x) => x.type === 'niveau') && niveau.phase === 'choix' && niveau.choix.length === 3 && new Set(niveau.choix).size === 3 && niveau.niveau === 2)
verifier("arrêté, le temps n'avance plus", jouer(niveau, 1).length === 0 && niveau.t < 0.1)
const iCarapace = niveau.choix.indexOf('carapace')
const choisi = iCarapace >= 0 ? 'carapace' : niveau.choix[0]
const evChoix = choisir(C, niveau, iCarapace >= 0 ? iCarapace : 0)
verifier(`on prend ${choisi} : rang 1, le jeu reprend`, evChoix[0]?.type === 'amelioration' && evChoix[0].cle === choisi && niveau.ameliorations[choisi] === 1 && niveau.phase === 'jeu' && niveau.xpSuivant === Math.round(C.niveau.base * C.niveau.facteur))
if (choisi === 'carapace') verifier('la carapace : 6 PV au plus', niveau.pvMax === 6 && niveau.pv === 6)

const garde = calme()
garde.ameliorations.garde = 2
triangleA(garde, 0.3)
verifier('la Garde large élargit la fenêtre (×1,6 : 0,3 s passe)', parable(C, garde) !== null)

// ---------------------------------------------------------------- la partie entière

const a = nouvellePartie(C, 7)
const b = nouvellePartie(C, 7)
jouer(a, 20)
jouer(b, 20)
verifier('même seed, même partie', JSON.stringify(a) === JSON.stringify(b))

/** Un robot qui pare dès que la fenêtre s'ouvre (avec `reaction` s de retard), et prend toujours le premier choix. */
function robot(seed: number, reaction: number, pare: boolean): { t: number; niveau: number; abattus: number; parfaites: number } {
  const e = nouvellePartie(C, seed)
  let depuis = -1
  while (e.phase !== 'perdu' && e.t < 600) {
    if (e.phase === 'choix') {
      choisir(C, e, 0)
      continue
    }
    avancer(C, e, PAS, VUE)
    if (!pare) continue
    const p = parable(C, e)
    if (p === null) {
      depuis = -1
      continue
    }
    if (depuis < 0) depuis = e.t
    if (e.t - depuis >= reaction) {
      parer(C, e)
      depuis = -1
    }
  }
  return { t: Math.round(e.t), niveau: e.niveau, abattus: e.abattus, parfaites: e.parfaites }
}
const sans = robot(11, 0, false)
const lent = robot(11, 0.15, true)
const vif = robot(11, 0.05, true)
console.log(`  mesure  sans parer : ${sans.t} s, niveau ${sans.niveau}, ${sans.abattus} abattus`)
console.log(`  mesure  parade lente (0,15 s) : ${lent.t} s, niveau ${lent.niveau}, ${lent.abattus} abattus, ${lent.parfaites} parfaites`)
console.log(`  mesure  parade vive (0,05 s) : ${vif.t} s, niveau ${vif.niveau}, ${vif.abattus} abattus, ${vif.parfaites} parfaites`)
verifier('parer fait tenir plus longtemps que ne rien faire', lent.t > sans.t && vif.t >= lent.t)

console.log(echecs === 0 ? 'Tout passe.' : `${echecs} échec(s).`)
if (echecs > 0) throw new Error(`${echecs} vérification(s) en échec`)

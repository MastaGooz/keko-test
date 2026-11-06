/**
 * Vérifications de la partie du survivor, sans navigateur : le temps est injecté.
 */
import { armeDe, avancerPartie, choisir, nouvellePartie, PARTIE as C, pvMaxDe, rangArme, xpPourNiveau, type EtatPartie, type EvenementPartie } from './partie.ts'

let echecs = 0
function verifier(quoi: string, vrai: boolean): void {
  if (!vrai) echecs += 1
  console.log(`  ${vrai ? 'ok  ' : 'ECHEC'}  ${quoi}`)
}

console.log('survivor : la partie')

const PAS = 1000 / 60
const VUE = { demiL: 45, demiH: 97 }
const IMMOBILE = { x: 0, y: 0 }
function jouer(e: EtatPartie, ms: number, choix = true): EvenementPartie[] {
  const tous: EvenementPartie[] = []
  for (let t = 0; t < ms && e.phase !== 'perdu'; t += PAS) {
    if (e.phase === 'choix') {
      if (!choix) break
      choisir(C, e, 0)
    }
    tous.push(...avancerPartie(C, e, PAS, IMMOBILE, VUE))
  }
  return tous
}

const e0 = nouvellePartie(C, 3)
verifier('une partie neuve : le fouet, les PV pleins, niveau 1', e0.armes.length === 1 && e0.armes[0].cle === 'fouet' && e0.pv === C.heros.pv && e0.niveau === 1 && e0.phase === 'jeu')
const a = nouvellePartie(C, 3)
const b = nouvellePartie(C, 3)
jouer(a, 20_000)
jouer(b, 20_000)
verifier('même graine, mêmes gestes : même partie', JSON.stringify(a) === JSON.stringify(b))

const premiers = nouvellePartie(C, 5)
avancerPartie(C, premiers, PAS, IMMOBILE, VUE)
verifier("les ennemis naissent hors de l'écran", premiers.ennemis.length > 0 && premiers.ennemis.every((en) => Math.abs(en.x) > VUE.demiL || Math.abs(en.y) > VUE.demiH))

const ev = jouer(nouvellePartie(C, 7), 15_000, false)
verifier('le fouet frappe seul et abat des ennemis', ev.some((x) => x.type === 'fouet') && ev.some((x) => x.type === 'mort'))

// Une gemme posée sous le héros : ramassée, elle fait monter de niveau et ouvre trois choix.
const g = nouvellePartie(C, 9)
g.gemmes.push({ id: 999, x: 0, y: 0, valeur: xpPourNiveau(C, 1), coffre: false, attiree: false, vitesse: 0 })
const evG = avancerPartie(C, g, PAS, IMMOBILE, VUE)
verifier('une gemme ramassée : le niveau monte, trois choix différents', evG.some((x) => x.type === 'niveau') && g.niveau === 2 && g.phase === 'choix' && g.offre.length === 3 && new Set(g.offre).size === 3)
verifier('pendant le choix, rien ne bouge', avancerPartie(C, g, PAS, IMMOBILE, VUE).length === 0 && g.phase === 'choix')
g.offre = ['baguette', 'fouet', 'puissance']
choisir(C, g, 0)
verifier('choisir une arme nouvelle : elle entre au niveau 1', rangArme(g, 'baguette') === 1 && g.phase === 'jeu')
g.phase = 'choix'
g.offre = ['fouet']
choisir(C, g, 0)
verifier("choisir une arme qu'on a : elle monte d'un niveau", rangArme(g, 'fouet') === 2 && armeDe(g, 'fouet').nombre === 2)
for (let i = 0; i < 10; i++) {
  g.phase = 'choix'
  g.offre = ['fouet']
  choisir(C, g, 0)
}
verifier('une arme ne passe pas le niveau 5', rangArme(g, 'fouet') === C.niveauMax)

// Quatre armes au plus : une cinquième n'est plus offerte.
const pleine = nouvellePartie(C, 11)
for (const k of ['baguette', 'couteau', 'hache'] as const) pleine.armes.push({ cle: k, niveau: 1, recharge: 1 })
pleine.gemmes.push({ id: 999, x: 0, y: 0, valeur: 1000, coffre: false, attiree: false, vitesse: 0 })
const vues = new Set<string>()
for (let i = 0; i < 40; i++) {
  avancerPartie(C, pleine, PAS, IMMOBILE, VUE)
  if (pleine.phase === 'choix') {
    pleine.offre.forEach((k) => vues.add(k))
    pleine.offre = ['puissance']
    choisir(C, pleine, 0)
  }
}
verifier('quatre armes : aucune arme nouvelle offerte', !vues.has('ail') && !vues.has('orbes') && !vues.has('eclair'))

const coffre = nouvellePartie(C, 13)
coffre.gemmes.push({ id: 999, x: 0, y: 0, valeur: 0, coffre: true, attiree: false, vitesse: 0 })
verifier("le coffre de l'élite ouvre un choix", avancerPartie(C, coffre, PAS, IMMOBILE, VUE).some((x) => x.type === 'coffre') && coffre.phase === 'choix')

// Au contact, un ennemi frappe ; pas deux fois de suite pendant l'invincibilité.
const contact = nouvellePartie(C, 15)
contact.aFaire = -1e9
contact.armes = []
contact.ennemis.push({ id: 1, type: 'goule', x: 2, y: 0, pv: 99, pvMax: 99, kx: 0, ky: 0, attaqueA: 0, touche: -1, immunite: {} })
contact.ennemis.push({ id: 2, type: 'goule', x: -2, y: 0, pv: 99, pvMax: 99, kx: 0, ky: 0, attaqueA: 0, touche: -1, immunite: {} })
const evC = avancerPartie(C, contact, PAS, IMMOBILE, VUE)
verifier('au contact, un ennemi frappe ; le second attend la fin de l’invincibilité', evC.filter((x) => x.type === 'blesse').length === 1 && contact.pv === C.heros.pv - C.ennemis.goule.degats)
contact.passifs.push({ cle: 'armure', niveau: 2 })
contact.pv = 1
contact.invincibleA = 0
contact.ennemis.forEach((en) => (en.attaqueA = 0))
verifier('sans PV, la partie est perdue', avancerPartie(C, contact, PAS, IMMOBILE, VUE).some((x) => x.type === 'perdu') && contact.phase === 'perdu')

const soin = nouvellePartie(C, 17)
soin.pv = 10
soin.phase = 'choix'
soin.offre = ['soin']
choisir(C, soin, 0)
verifier('le repas rend des PV, sans passer le maximum', soin.pv === 10 + C.soin && soin.pv <= pvMaxDe(C, soin))

const immobile = nouvellePartie(C, 19)
jouer(immobile, 10 * 60_000)
verifier('immobile, le héros tombe en moins de deux minutes', immobile.phase === 'perdu' && immobile.t < 120)

console.log(echecs === 0 ? 'Tout passe.' : `${echecs} echec(s).`)
if (echecs > 0) throw new Error(`${echecs} verification(s) en echec`)

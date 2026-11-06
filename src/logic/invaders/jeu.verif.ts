/**
 * Vérifications des envahisseurs, sans navigateur : le temps est injecté.
 */
import { avancer, INVADERS as C, LARGEUR, nouvellePartie, positionDe, vitesseDeMarche, type EtatInvaders, type EvenementInvaders } from './jeu.ts'

let echecs = 0
function verifier(quoi: string, vrai: boolean): void {
  if (!vrai) echecs += 1
  console.log(`  ${vrai ? 'ok  ' : 'ECHEC'}  ${quoi}`)
}

console.log('envahisseurs')

const PAS = 1000 / 60
/** Joue `ms` de partie, le doigt en `x` (ou sans doigt), et rend l'état et tout ce qui s'est passé. */
function jouer(e: EtatInvaders, ms: number, x: number | null = null): { etat: EtatInvaders; evenements: EvenementInvaders[] } {
  const tous: EvenementInvaders[] = []
  for (let t = 0; t < ms; t += PAS) {
    const r = avancer(C, e, PAS, { cibleX: x })
    e = r.etat
    tous.push(...r.evenements)
  }
  return { etat: e, evenements: tous }
}

const e0 = nouvellePartie(C, 7)
verifier('une partie neuve : 30 envahisseurs, 3 vies, 4 abris', e0.ennemis.length === C.lignes * C.colonnes && e0.vies === 3 && e0.abris.length === C.abris)
verifier('même graine, même partie', JSON.stringify(jouer(nouvellePartie(C, 7), 5000, 30).etat) === JSON.stringify(jouer(nouvellePartie(C, 7), 5000, 30).etat))

const vers = jouer(e0, 1000, 0).etat
verifier('le vaisseau va vers le doigt, borné au monde', Math.abs(vers.joueur.x - C.joueurDemi) < 1e-9)
const unPas = avancer(C, e0, PAS, { cibleX: LARGEUR }).etat
verifier('sans dépasser sa vitesse', Math.abs(unPas.joueur.x - e0.joueur.x - (C.joueurVitesse * PAS) / 1000) < 1e-9)

const tirs = jouer(e0, 1000).evenements.filter((x) => x.type === 'tir').length
verifier('il tire tout seul, à sa cadence', tirs === Math.ceil(1000 / C.cadence))

// Sous une colonne, ses tirs finissent par détruire un envahisseur.
const sous = jouer(e0, 3000, positionDe(C, e0, e0.ennemis[2]).x)
verifier('un tir détruit un envahisseur et rapporte ses points', sous.evenements.some((x) => x.type === 'detruit') && sous.etat.score > 0)

const marche = jouer(e0, 2000).etat
verifier('la formation marche', marche.formation.x !== e0.formation.x)
const presqueVide = { ...e0, ennemis: e0.ennemis.map((n, i) => ({ ...n, vivant: i === 0 })) }
verifier('elle accélère quand elle se vide', vitesseDeMarche(C, presqueVide) > 3 * vitesseDeMarche(C, e0))
const bord = jouer(e0, 15_000).etat
verifier('au bord, elle descend et fait demi-tour', bord.formation.y > e0.formation.y)

// Plus d'abris ni de vies à perdre : la formation descend jusqu'à la ligne.
const tardif = jouer({ ...e0, abris: [], vies: 1e9, joueur: { ...e0.joueur, x: -100 } }, 600_000).etat
verifier('touchée la ligne, la partie est perdue', tardif.phase === 'perdu')

// Un tir ennemi sur le vaisseau : une vie, puis l'invincibilité.
const vise: EtatInvaders = { ...e0, ennemis: e0.ennemis.map((n) => ({ ...n, vivant: false })), tirs: [{ x: e0.joueur.x, y: C.joueurY - 2, ami: false }, { x: e0.joueur.x, y: C.joueurY - 1, ami: false }], abris: [] }
const touche = avancer(C, vise, PAS, { cibleX: null }).etat
verifier('touché, le vaisseau perd une vie, une seule', touche.vies === C.vies - 1)
const fin = avancer(C, { ...vise, vies: 1 }, PAS, { cibleX: null })
verifier('sans vie, la partie est perdue', fin.etat.phase === 'perdu' && fin.evenements.some((x) => x.type === 'perdu'))

// Vidée, la vague en appelle une autre, plus rapide, après la pause.
const derniere: EtatInvaders = { ...e0, ennemis: e0.ennemis.map((n, i) => ({ ...n, vivant: i === 0 })), tirs: [] }
const p = positionDe(C, derniere, derniere.ennemis[0])
const finVague = avancer(C, { ...derniere, tirs: [{ x: p.x, y: p.y, ami: true }] }, PAS, { cibleX: null }).etat
verifier('la vague vidée, une pause', finVague.phase === 'entreVagues' && finVague.vague === 2)
const suivante = jouer(finVague, C.entreVagues + 100)
verifier('puis la vague suivante, pleine et plus rapide', suivante.etat.phase === 'jeu' && suivante.etat.ennemis.every((n) => n.vivant) && vitesseDeMarche(C, suivante.etat) > vitesseDeMarche(C, e0) && suivante.evenements.some((x) => x.type === 'vague'))

const abri = avancer(C, { ...e0, tirs: [{ x: e0.abris[0].x, y: e0.abris[0].y, ami: true }] }, PAS, { cibleX: null }).etat
verifier('un abri arrête un tir et s\'use', abri.abris[0].pv === C.abriPv - 1)

console.log(echecs === 0 ? 'Tout passe.' : `${echecs} echec(s).`)
if (echecs > 0) throw new Error(`${echecs} verification(s) en echec`)

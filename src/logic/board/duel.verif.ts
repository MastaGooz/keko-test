/**
 * Vérifications du duel, sans navigateur.
 *
 * Ce qu'on vérifie n'est pas l'équilibrage — il se mesure par simulation — mais
 * les propriétés qui doivent tenir quels que soient les réglages : chacun pose
 * la moitié des cases, le score se lit sur la grille finale, un couple mixte
 * paie les deux camps, et aucun coup ne perd ni ne duplique une carte.
 */
import {
  baseDeLaCarte,
  campDuTour,
  coupDuBot,
  distribuer,
  duelVide,
  enJeuDuel,
  fini,
  gainsDuel,
  parJoueur,
  pointsParCase,
  poserDuel,
  REGLAGE_DUEL,
  scoresDuel,
  taillesDeGrappe,
  VALEUR_PIVOT,
  type Duel,
  type Gain,
  type Ordre,
  type ReglageDuel,
} from './duel.ts'
import { symetrique, type Graphe, type Jeton } from './plateau.ts'

let echecs = 0
function verifier(quoi: string, vrai: boolean): void {
  if (!vrai) echecs += 1
  console.log(`  ${vrai ? 'ok  ' : 'ECHEC'}  ${quoi}`)
}

function egal(obtenu: unknown, attendu: unknown, quoi: string): void {
  verifier(`${quoi} (${String(obtenu)} attendu ${String(attendu)})`, obtenu === attendu)
}

// **LES BLOCS QUI SUIVENT TESTENT LE BAREME DE DISTANCE**, donc ils le
// demandent explicitement : le defaut est passe au RESEAU, et *un bloc qui
// heriterait du defaut cesserait de tester ce qu'il nomme le jour ou le defaut
// change* -- ce qui vient d'arriver, vingt verifications d'un coup.
const REG: ReglageDuel = { ...REGLAGE_DUEL, ordre: 'alterne', systeme: 'distance' }
/** Le barème d'origine : un couple mixte PAIE ses deux cartes. */
const PLUS: ReglageDuel = { ...REG, mixte: 'plus' }
/** Le malus, borné à zéro par carte — la seule des trois qui déplace l'écart. */
const PLANCHER: ReglageDuel = { ...REG, mixte: 'plancher' }

/** A-B et B-C liés, D-E liés : A-C vaut 2 sauts, A-D est injoignable. */
const jeton = (id: string): Jeton => ({ id, nom: id, image: '', rarete: 'commun' })
const GRAPHE: Graphe = symetrique({ A: ['B'], B: ['C'], D: ['E'] })

/** Un duel dont les deux mains sont données par leurs lettres. */
function duel(m0: string, m1: string, reg: ReglageDuel = REG): Duel {
  const lettres = (s: string): Jeton[] =>
    s
      .split(/\s+/)
      .filter((x) => x !== '')
      .map(jeton)
  return duelVide(reg, lettres(m0), lettres(m1))
}

/** Pose la suite de coups donnée, en alternant les camps. */
function jouer(d: Duel, coups: readonly (readonly [string, number])[]): Duel {
  let x = d
  for (const [id, c] of coups) x = poserDuel(x, id, c)
  return x
}

console.log('LES TOURS')
{
  // LA MOITIE DES CASES CHACUN, et ce n'est pas un reglage : sinon la grille
  // ne se remplit pas exactement, et « le total quand elle est pleine » n'a
  // plus de sens.
  egal(parJoueur(REG), 8, 'une grille 4x4 donne 8 cartes par joueur')
  egal(parJoueur({ ...REG, cote: 6 }), 18, 'une grille 6x6 en donne 18')

  // L'ALTERNE : un coup chacun.
  const a = duel('A B C D E F G H', 'a b c d e f g h')
  const suite = (d: Duel, ordre: Ordre): string => {
    let x = duelVide({ ...REG, ordre }, d.mains[0], d.mains[1])
    const out: number[] = []
    for (let t = 0; t < 16; t++) {
      out.push(campDuTour(x))
      x = { ...x, poses: x.poses + 1 }
    }
    return out.join('')
  }
  egal(suite(a, 'alterne'), '0101010101010101', 'l’alterne donne un coup chacun')
  egal(suite(a, 'serpent'), '0110011001100110', 'le serpent donne 1 puis 2-2-2')

  // LES DEUX ORDRES DONNENT AUTANT DE COUPS A CHACUN — *un ordre qui en
  // donnerait neuf a l'un ne remplirait pas la grille a parts egales.*
  for (const ordre of ['alterne', 'serpent'] as const) {
    const s = suite(a, ordre)
    const zeros = [...s].filter((c) => c === '0').length
    egal(zeros, 8, `en ${ordre}, J1 pose 8 fois`)
  }
}

console.log('\nPOSER')
{
  let d = duel('A B', 'C D')
  egal(campDuTour(d), 0, 'J1 commence')
  d = poserDuel(d, 'A', 0)
  egal(d.grille[0]?.id, 'A', 'la carte est posee')
  egal(d.camps[0], 0, 'et elle appartient a J1')
  egal(d.mains[0].length, 1, 'elle quitte sa main')
  egal(d.mains[1].length, 2, 'et l’autre main ne bouge pas')
  egal(campDuTour(d), 1, 'c’est au tour de J2')

  // ON NE POSE QUE DEPUIS LA MAIN DU CAMP DONT C'EST LE TOUR.
  egal(poserDuel(d, 'B', 1).poses, 1, 'J2 ne peut pas poser une carte de J1')
  egal(poserDuel(d, 'C', 1).camps[1], 1, 'mais bien une des siennes')

  // UNE CASE OCCUPEE REFUSE : *il n'y a ni echange ni deplacement en duel*,
  // un coup qu'on peut defaire n'est pas un coup.
  egal(poserDuel(d, 'C', 0).poses, 1, 'poser sur une case occupee ne fait rien')
  egal(poserDuel(d, 'C', -1).poses, 1, 'hors de la grille non plus')
  egal(poserDuel(d, 'C', 99).poses, 1, 'ni au-dela')
  egal(poserDuel(d, 'Z', 1).poses, 1, 'une carte absente de la main non plus')

  // AUCUN COUP NE PERD NI NE DUPLIQUE UNE CARTE.
  egal(enJeuDuel(d).size, 4, 'les quatre cartes sont toujours en jeu')
}

console.log('\nLE SCORE SE LIT SUR LA GRILLE')
{
  // DEUX CARTES DU MEME CAMP, cote a cote et liees : le couple paie les DEUX,
  // donc il encaisse 2 x 4 en plus des deux bases.
  let mien = duel('A B', 'x y')
  mien = poserDuel(mien, 'A', 0)
  mien = poserDuel(mien, 'x', 15)
  mien = poserDuel(mien, 'B', 1)
  mien = poserDuel(mien, 'y', 14)
  egal(scoresDuel(mien, GRAPHE)[0], 10, 'A et B a moi, liees : 2 bases + 2 x 4 = 10')
  egal(scoresDuel(mien, GRAPHE)[1], 2, 'et l’adversaire n’a que ses deux bases')

  // UN COUPLE MIXTE RETIRE A SES DEUX CARTES — la regle de Keko, et le defaut.
  const coups = [
    ['A', 0],
    ['B', 1],
    ['x', 15],
    ['y', 14],
  ] as const
  const mixte = jouer(duel('A x', 'B y'), coups)
  egal(scoresDuel(mixte, GRAPHE)[0], -2, 'A a moi, B a lui : 2 bases - 4')
  egal(scoresDuel(mixte, GRAPHE)[1], -2, 'et lui aussi — le couple retire aux deux')

  // LE BAREME D'ORIGINE RESTE JOIGNABLE, et il paie les deux.
  const avecPlus = jouer(duel('A x', 'B y', PLUS), coups)
  egal(scoresDuel(avecPlus, GRAPHE).join('/'), '6/6', 'en `plus`, le couple paie les deux')

  // L'ECART EST LE MEME SOUS LES DEUX BAREMES, et c'est de l'arithmetique :
  // *un couple symetrique deplace les deux scores de la meme quantite.* Mesure
  // sur 300 grilles : identique au point pres, 300 fois sur 300.
  const ecart = (x: Duel): number => {
    const s = scoresDuel(x, GRAPHE)
    return (s[0] ?? 0) - (s[1] ?? 0)
  }
  egal(ecart(mixte), ecart(avecPlus), 'le malus ne deplace pas l’ecart')

  // LE PLANCHER, LUI, LE DEPLACE : une carte ne descend jamais sous zero, donc
  // la carte qui avait le moins a perdre perd moins. *C'est la seule des trois
  // regles qui cree une attaque.*
  const avecPlancher = jouer(duel('A x', 'B y', PLANCHER), coups)
  egal(scoresDuel(avecPlancher, GRAPHE).join('/'), '1/1', 'en `plancher`, rien ne passe sous zero')
  for (const v of pointsParCase(avecPlancher, GRAPHE))
    if (v < 0) verifier('aucune case ne descend sous zero', false)
  verifier('aucune case ne descend sous zero', true)

  // L'ORDRE DE POSE NE CHANGE PAS LE TOTAL : chaque couple compte une fois, ou
  // qu'il arrive. *C'est ce qui rend « le total a la fin » possible.*
  const envers = jouer(duel('A x', 'B y'), [
    ['A', 15],
    ['B', 14],
    ['x', 0],
    ['y', 1],
  ])
  egal(scoresDuel(envers, GRAPHE).join('/'), '-2/-2', 'pose a l’autre bout : meme total')

  // UNE CARTE ENTRE DEUX DES SIENNES ENCAISSE LES DEUX COUPLES.
  let trois = duel('A B C', 'x y z')
  trois = poserDuel(trois, 'A', 0)
  trois = poserDuel(trois, 'x', 15)
  trois = poserDuel(trois, 'B', 1)
  trois = poserDuel(trois, 'y', 14)
  trois = poserDuel(trois, 'C', 2)
  trois = poserDuel(trois, 'z', 13)
  egal(pointsParCase(trois, GRAPHE)[1], 9, 'B touche A et C : 1 + 4 + 4 = 9')
  egal(scoresDuel(trois, GRAPHE)[0], 19, 'et J1 totalise 19')

  // UNE GRILLE VIDE NE DONNE RIEN A PERSONNE.
  egal(scoresDuel(duel('A', 'B'), GRAPHE).join('/'), '0/0', 'grille vide : 0 / 0')
}

console.log('\nL’APERCU DES DEUX GAINS')
{
  let d = duel('A B C D', 'x y z w')
  d = poserDuel(d, 'A', 0) // J1 pose A en 0
  // C'est au tour de J2 : ce que SA carte B gagnerait a cote de A, et ce que
  // ca donnerait a J1.
  const g = gainsDuel(d, GRAPHE, jeton('B'), 1)
  egal(g[1]?.moi, -3, 'B a cote de A : 1 de base - 4')
  egal(g[1]?.lui, -4, 'et A, qui est a J1, perd 4 aussi')
  egal(g[0], null, 'la case occupee ne promet rien')
  egal(g[5]?.moi, 1, 'loin de tout : la base seule')
  egal(g[5]?.lui, 0, 'et rien pour l’adversaire')

  // LE MEME COUP SOUS LE BAREME D'ORIGINE : il paie les deux.
  const avant = gainsDuel(jouer(duel('A B C D', 'x y z w', PLUS), [['A', 0]]), GRAPHE, jeton('B'), 1)
  egal(avant[1]?.moi, 5, 'en `plus`, B a cote de A vaut 1 + 4')
  egal(avant[1]?.lui, 4, 'et A encaisse 4')

  // LE MEME COUP POUR LE CAMP QUI POSSEDE A : il encaisse DEUX FOIS.
  const sien = gainsDuel(d, GRAPHE, jeton('B'), 0)
  egal(sien[1]?.moi, 9, 'si A est a moi, B a cote vaut 1 + 4 + 4')
  egal(sien[1]?.lui, 0, 'et l’adversaire n’a rien')

  // UNE CARTE INJOIGNABLE NE PROMET QUE SA BASE.
  egal(gainsDuel(d, GRAPHE, jeton('D'), 1)[1]?.moi, 1, 'D, injoignable depuis A : 1')
}

console.log('\nLE BOT')
{
  // ATTENTION : apres le coup de J1, LE BOT JOUE POUR J2 — donc la carte liee
  // doit etre dans SA main. *Mon premier essai la mettait dans celle de J1, et
  // le bot posait sa premiere carte au hasard en ayant parfaitement raison.*
  // UN COUPLE MIXTE EST NEUTRE SUR L'ECART, et c'est LA propriete du mode.
  // Keko : « pourquoi +7 est considere meilleur que +3 et -4 ? » — il ne l'est
  // pas. Gagner 3 en amputant l'autre de 4 deplace l'ecart de 7, autant que
  // gagner 7 sans rien lui faire.
  //
  // *Donc poser contre une carte adverse vaut exactement une case isolee*, sous
  // les DEUX baremes symetriques. On le verifie sur l'ecart, pas sur le choix
  // du bot : a egalite, son choix ne dit rien.
  const ec = (g: Gain | null | undefined): number => (g == null ? NaN : g.moi - g.lui)
  for (const [nom, reg] of [
    ['moins', REG],
    ['plus', PLUS],
  ] as const) {
    const x = jouer(duel('A D', 'B z', reg), [['A', 0]])
    const g = gainsDuel(x, GRAPHE, jeton('B'), 1)
    egal(ec(g[1]), ec(g[5]), `en \`${nom}\`, le couple mixte vaut une case isolee`)
  }

  // SOUS LE PLANCHER, IL CESSE DE L'ETRE : la carte qu'on ampute a beaucoup a
  // perdre, la sienne n'a qu'un point. *C'est la borne qui cree l'attaque.*
  const vise = jouer(duel('A C w', 'B z v', PLANCHER), [
    ['A', 0],
    ['z', 15],
    ['C', 1],
  ])
  const gp = gainsDuel(vise, GRAPHE, jeton('B'), 1)
  verifier(
    `en \`plancher\`, amputer vaut mieux qu'une case isolee (${ec(gp[2])} contre ${ec(gp[6])})`,
    ec(gp[2]) > ec(gp[6]),
  )

  // ET SANS LE PLANCHER, LA MEME POSE EST NEUTRE.
  const plat = jouer(duel('A C w', 'B z v'), [
    ['A', 0],
    ['z', 15],
    ['C', 1],
  ])
  const gm = gainsDuel(plat, GRAPHE, jeton('B'), 1)
  egal(ec(gm[2]), ec(gm[6]), 'en `moins`, la meme pose ne deplace rien')

  // IL PREFERE SON PROPRE GROUPE : a cote de SA carte, le couple paie deux
  // fois. *C'est ce qui le fait battre un bot defensif.*
  let groupe = duel('z w', 'B C')
  groupe = poserDuel(groupe, 'z', 5) // J1 pose au milieu, rien de lie
  groupe = poserDuel(groupe, 'B', 0) // J2 pose B dans un coin
  groupe = poserDuel(groupe, 'w', 10) // J1 encore
  egal(coupDuBot(groupe, GRAPHE)?.case, 1, 'J2 colle C contre son propre B')
  // *Et c'est le seul coup qui deplace vraiment l'ecart* : un couple propre
  // monte MON score sans toucher au sien.

  // IL NE REND RIEN SUR UNE GRILLE PLEINE.
  const plein: Duel = { ...groupe, poses: 16 }
  egal(coupDuBot(plein, GRAPHE), null, 'grille pleine : aucun coup')
  verifier('et fini() le dit', fini(plein))

  // IL EST DETERMINISTE : *le meme duel rejoue rend le meme coup.*
  egal(
    JSON.stringify(coupDuBot(groupe, GRAPHE)),
    JSON.stringify(coupDuBot(groupe, GRAPHE)),
    'deux appels rendent le meme coup',
  )

  // UNE PARTIE ENTIERE DE BOT A BOT REMPLIT LA GRILLE, sans perdre de carte.
  let partie = duel('A B C D E F G H', 'a b c d e f g h')
  for (let t = 0; t < 16; t++) {
    const coup = coupDuBot(partie, GRAPHE)
    if (coup === null) break
    partie = poserDuel(partie, coup.id, coup.case)
  }
  verifier('la grille se remplit', fini(partie))
  egal(partie.grille.filter((x) => x !== null).length, 16, 'les seize cases sont prises')
  egal(partie.mains[0].length, 0, 'J1 a tout pose')
  egal(partie.mains[1].length, 0, 'J2 aussi')
  egal(new Set(partie.grille.map((j) => j?.id)).size, 16, 'et aucune carte n’est en double')
  egal(partie.camps.filter((c) => c === 0).length, 8, 'huit cases a J1')
  egal(partie.camps.filter((c) => c === 1).length, 8, 'huit a J2')
}

console.log()
console.log('LA VALEUR DE LA CARTE')
{
  // UN JETON QUI PORTE SA VALEUR, et un graphe ou A-B sont lies (bonus 4 a
  // portee 5). *Les trois modes se mesurent sur le MEME placement* : seul le
  // reglage change.
  const gros = (id: string, v: number): Jeton => ({ ...jeton(id), valeur: v })
  const pose = (reg: ReglageDuel, a: Jeton, b: Jeton, cases: readonly [number, number]): Duel =>
    jouer(duelVide(reg, [a], [b]), [
      [a.id, cases[0]],
      [b.id, cases[1]],
    ])

  const UN: ReglageDuel = { ...PLUS, valeur: 'un' }
  const TAILLE: ReglageDuel = { ...PLUS, valeur: 'taille' }
  const BONUS: ReglageDuel = { ...PLUS, valeur: 'bonus' }

  // UNE VALEUR ABSENTE VAUT LA BASE : c'est ce qui laisse le solo intact.
  egal(baseDeLaCarte(TAILLE, jeton('A')), 1, 'sans valeur, la base du reglage')
  egal(baseDeLaCarte(TAILLE, gros('A', 9)), 9, 'sous taille, la base EST la valeur')
  egal(baseDeLaCarte(BONUS, gros('A', 9)), 1, 'sous bonus, la base reste celle du reglage')
  egal(baseDeLaCarte(UN, gros('A', 9)), 1, 'sous un, la valeur est ignoree')

  // **LE MODE `un` NE DOIT RIEN CHANGER**, meme sur des cartes qui portent une
  // valeur : *un mode qui dit « rien » doit dire rien.*
  {
    const p = pointsParCase(pose(UN, gros('A', 9), gros('B', 9), [0, 1]), GRAPHE)
    egal(p[0], 5, 'un : 1 de base + 4 de couple')
    egal(p[1], 5, 'et son voisin pareil')
  }

  // SOUS `taille`, LA BASE MONTE ET LE BONUS NE BOUGE PAS.
  {
    const p = pointsParCase(pose(TAILLE, gros('A', 9), gros('B', 3), [0, 1]), GRAPHE)
    egal(p[0], 13, 'taille : 9 de base + 4 de couple')
    egal(p[1], 7, 'et 3 + 4 pour la petite')
  }

  // SOUS `bonus`, C'EST L'INVERSE : la base ne bouge pas, et le couple paie au
  // prorata des DEUX cartes, pivote sur la mediane du pool.
  {
    const moyen = pose(BONUS, gros('A', VALEUR_PIVOT), gros('B', VALEUR_PIVOT), [0, 1])
    const pp = pointsParCase(moyen, GRAPHE)
    egal(pp[0], 5, 'bonus : un couple moyen garde son bonus nominal (1 + 4)')
    const petit = pose(BONUS, gros('A', 1), gros('B', 1), [0, 1])
    egal(pointsParCase(petit, GRAPHE)[0], 2, 'deux petites cartes : 1 + 1')
    const riche = pointsParCase(pose(BONUS, gros('A', 10), gros('B', 10), [0, 1]), GRAPHE)
    verifier('deux grosses cartes paient plus que deux moyennes', (riche[0] ?? 0) > (pp[0] ?? 0))
  }

  // **ET LE COUPLE DOIT ETRE ADJACENT, quel que soit le mode** : la valeur ne
  // cree aucun lien a distance.
  {
    const p = pointsParCase(pose(TAILLE, gros('A', 9), gros('B', 3), [0, 2]), GRAPHE)
    egal(p[0], 9, 'non adjacentes : la base seule')
    egal(p[2], 3, 'et la base seule pour l autre')
  }

  // L APERCU DIT EXACTEMENT CE QUE LE SCORE FERA, valeur comprise. *C'est la
  // seule propriete qui compte : le joueur croit ce chiffre.*
  for (const reg of [UN, TAILLE, BONUS]) {
    // **DEUX COUPS POUR QUE CE SOIT DE NOUVEAU LE TOUR DE J1** : `poserDuel`
    // lit le camp du TOUR, donc un seul coup aurait fait poser C par J2 — et
    // l'ecart se serait mesure sur l'autre camp.
    const d = jouer(duelVide(reg, [gros('A', 9), gros('C', 2)], [gros('B', 6)]), [
      ['A', 0],
      ['B', 15],
    ])
    const avant = scoresDuel(d, GRAPHE)
    const vu = gainsDuel(d, GRAPHE, gros('C', 2), 0)
    const apres = scoresDuel(poserDuel(d, 'C', 1), GRAPHE)
    egal(vu[1]?.moi, (apres[0] ?? 0) - (avant[0] ?? 0), reg.valeur + ' : l apercu annonce ce que le score rend')
  }
}

// ---------------------------------------------------------------- la distribution
console.log('\nLES DEUX MAINS SONT APPARIEES')
{
  const gros = (id: string, v: number): Jeton => ({ ...jeton(id), valeur: v })
  // Un pool ou les scores vont de 1 a 16 : *les deux mains doivent se partager
  // les gros ET les petits*, pas se les laisser au hasard.
  const pool = Array.from({ length: 16 }, (_, i) => gros('P' + i, i + 1))
  // RNG DETERMINISTE : on verifie le PARTAGE, pas le tirage.
  let graine = 7
  const rng = (): number => {
    graine = (graine * 1103515245 + 12345) % 2147483648
    return graine / 2147483648
  }
  const somme = (m: readonly Jeton[]): number => m.reduce((a, j) => a + (j.valeur ?? 0), 0)
  const [m0, m1] = distribuer(REG, pool, rng)

  egal(m0.length, 8, 'huit cartes a J1')
  egal(m1.length, 8, 'huit cartes a J2')

  // AUCUNE CARTE EN DOUBLE, ni dans une main ni entre les deux : *un pool se
  // partage, il ne se duplique pas.*
  egal(new Set([...m0, ...m1].map((j) => j.id)).size, 16, 'seize cartes distinctes')

  // LE PARTAGE EST EQUITABLE, et c'est toute la raison de la fonction : a
  // scores 1..16, chaque main doit valoir 68 — la moitie de 136.
  egal(somme(m0), 68, 'J1 totalise la moitie des scores')
  egal(somme(m1), 68, 'et J2 l autre moitie')

  // **ET C'EST VRAI SUR UN POOL QUELCONQUE, a quelques points pres.** *Le
  // serpent par PAIRES borne l'ecart a la somme des differences internes*, la ou
  // deux tirages libres de huit cartes s'ecartent sans limite.
  let pire = 0
  let libre = 0
  for (let essai = 0; essai < 200; essai++) {
    const p = Array.from({ length: 16 }, (_, i) => gros('Q' + i, 1 + Math.floor(rng() * 10)))
    const [a, b] = distribuer(REG, p, rng)
    pire = Math.max(pire, Math.abs(somme(a) - somme(b)))
    libre = Math.max(libre, Math.abs(somme(p.slice(0, 8)) - somme(p.slice(8))))
  }
  verifier(`l ecart apparie reste petit (${pire})`, pire <= 10)
  verifier(`la ou un tirage libre monte bien plus haut (${libre})`, libre > pire)
}

// --------------------------------------------------------------- LE RESEAU
//
// **UNE CARTE VAUT SON SCORE x LA TAILLE DE SA GRAPPE**, une grappe etant ce qui
// se touche ET se relie dans le MEME camp.
{
  console.log('\n' + 'LE RESEAU : la grappe multiplie le score')
  const R: ReglageDuel = { ...REG, systeme: 'reseau' }
  const v = (id: string, n: number): Jeton => ({ ...jeton(id), valeur: n })

  // UNE CARTE SEULE VAUT SON SCORE, et rien de plus : *une grappe de un est une
  // grappe.*
  {
    let d = duelVide(R, [v('A', 5)], [v('Z', 3)])
    d = poserDuel(d, 'A', 0)
    const par = pointsParCase(d, GRAPHE)
    egal(par[0], 5, 'seule, A vaut son score')
  }

  // DEUX CARTES LIEES ET ADJACENTES : chacune double.
  {
    let d = duelVide(R, [v('A', 5), v('B', 3)], [v('Z', 1), v('Y', 1)])
    d = poserDuel(d, 'A', 0)
    d = poserDuel(d, 'Z', 15)
    d = poserDuel(d, 'B', 1)
    const par = pointsParCase(d, GRAPHE)
    egal(par[0], 10, 'A dans une grappe de 2 : 5 x 2')
    egal(par[1], 6, 'et B : 3 x 2')
    egal(taillesDeGrappe(d, GRAPHE)[0], 2, 'la grappe fait 2')
  }

  // **IL FAUT LES DEUX : L'ADJACENCE ET LE LIEN.** *Le lien seul se passerait de
  // grille, l'adjacence seule est le defaut qu'on vient de mesurer.*
  {
    let d = duelVide(R, [v('A', 5), v('B', 3)], [v('Z', 1), v('Y', 1)])
    d = poserDuel(d, 'A', 0)
    d = poserDuel(d, 'Z', 15)
    d = poserDuel(d, 'B', 2) // liees, mais pas adjacentes
    const par = pointsParCase(d, GRAPHE)
    egal(par[0], 5, 'liees mais eloignees : A reste seule')
    egal(par[2], 3, 'et B aussi')
  }
  {
    let d = duelVide(R, [v('A', 5), v('D', 3)], [v('Z', 1), v('Y', 1)])
    d = poserDuel(d, 'A', 0)
    d = poserDuel(d, 'Z', 15)
    d = poserDuel(d, 'D', 1) // adjacentes, mais pas liees
    const par = pointsParCase(d, GRAPHE)
    egal(par[0], 5, 'adjacentes mais sans lien : A reste seule')
    egal(par[1], 3, 'et D aussi')
  }

  // UNE GRAPPE EST D'UN SEUL CAMP : une carte adverse liee et collee ne compte
  // pas. *C'est ce qui fait qu'il n'y a plus de couple mixte sous ce systeme.*
  {
    let d = duelVide(R, [v('A', 5), v('C', 9)], [v('B', 3), v('Y', 1)])
    d = poserDuel(d, 'A', 0)
    d = poserDuel(d, 'B', 1)
    const par = pointsParCase(d, GRAPHE)
    egal(par[0], 5, 'A ne grappe pas avec la carte du bot')
    egal(par[1], 3, 'et B non plus')
  }

  // **LE PONT : RELIER DEUX GRAPPES MULTIPLIE TOUT.** A-B et B-C sont liees,
  // donc poser B entre les deux fait une grappe de trois d'un coup -- 3 x 3 = 9
  // de multiplicateur la ou deux solitaires n'en valaient que 2.
  {
    let d = duelVide(R, [v('A', 2), v('C', 2), v('B', 2)], [v('Z', 1), v('Y', 1), v('X', 1)])
    d = poserDuel(d, 'A', 0)
    d = poserDuel(d, 'Z', 15)
    d = poserDuel(d, 'C', 2)
    d = poserDuel(d, 'Y', 14)
    const avant = scoresDuel(d, GRAPHE)[0]
    egal(avant, 4, 'A et C separees : 2 + 2')
    d = poserDuel(d, 'B', 1)
    const apres = scoresDuel(d, GRAPHE)[0]
    egal(apres, 18, 'le pont fait 3 x (2 x 3)')
    verifier(`et il vaut plus que la somme des deux (${apres} contre ${avant})`, apres > 2 * avant)
  }

  // L'APERCU DIT EXACTEMENT CE QUE LE SCORE FERA, pont compris : *il se calcule
  // par difference de scores, il ne refait pas la regle.*
  {
    let d = duelVide(R, [v('A', 2), v('C', 2), v('B', 2)], [v('Z', 1), v('Y', 1), v('X', 1)])
    d = poserDuel(d, 'A', 0)
    d = poserDuel(d, 'Z', 15)
    d = poserDuel(d, 'C', 2)
    d = poserDuel(d, 'Y', 14)
    const g = gainsDuel(d, GRAPHE, v('B', 2), 0)
    egal((g[1] as Gain).moi, 14, 'l apercu annonce le pont (18 - 4)')
    egal((g[5] as Gain).moi, 2, 'et une case isolee ne vaut que le score')
  }

  // LA RARETE COMME JOKER : une carte d'or se relie a tout ce qu'elle touche.
  {
    const or = (id: string, n: number): Jeton => ({ ...v(id, n), rarete: 'legendaire' })
    const J: ReglageDuel = { ...R, joker: true }
    let d = duelVide(J, [or('A', 4), v('D', 4)], [v('Z', 1), v('Y', 1)])
    d = poserDuel(d, 'A', 0)
    d = poserDuel(d, 'Z', 15)
    d = poserDuel(d, 'D', 1)
    egal(pointsParCase(d, GRAPHE)[1], 8, 'le joker relie une carte non liee')
    // ET SANS LE DRAPEAU, RIEN : *le joker est hors mesure, donc il ne doit pas
    // s'appliquer tant qu'on ne le demande pas.*
    let e = duelVide(R, [or('A', 4), v('D', 4)], [v('Z', 1), v('Y', 1)])
    e = poserDuel(e, 'A', 0)
    e = poserDuel(e, 'Z', 15)
    e = poserDuel(e, 'D', 1)
    egal(pointsParCase(e, GRAPHE)[1], 4, 'sans le drapeau il ne relie rien')
  }

  // LES BORDS NE SE REJOIGNENT PAS, et aucune diagonale : *la case 3 finit sa
  // ligne, la 4 ouvre la suivante.*
  {
    let d = duelVide(R, [v('A', 5), v('B', 3)], [v('Z', 1), v('Y', 1)])
    d = poserDuel(d, 'A', 3)
    d = poserDuel(d, 'Z', 15)
    d = poserDuel(d, 'B', 4)
    egal(pointsParCase(d, GRAPHE)[3], 5, 'la case 3 ne touche pas la 4')
  }
  {
    let d = duelVide(R, [v('A', 5), v('B', 3)], [v('Z', 1), v('Y', 1)])
    d = poserDuel(d, 'A', 0)
    d = poserDuel(d, 'Z', 15)
    d = poserDuel(d, 'B', 5)
    egal(pointsParCase(d, GRAPHE)[0], 5, 'la diagonale ne touche pas')
  }
}

console.log(echecs === 0 ? '\nTout passe.' : `\n${echecs} ECHEC(S)`)
if (echecs > 0) throw new Error(`${echecs} vérification(s) en échec`)

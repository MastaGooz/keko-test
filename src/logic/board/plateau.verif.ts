/**
 * Vérifications du plateau, sans navigateur.
 *
 * Ce qu'on vérifie n'est pas l'équilibrage — il se juge en jouant — mais les
 * propriétés qui doivent tenir quels que soient les réglages : une carte seule
 * produit sa base, une paire liée ne compte qu'une fois, l'adjacence est à
 * quatre voisins sans diagonale, et les déplacements ne perdent ni ne dupliquent
 * jamais une carte.
 */
import {
  booster,
  couples,
  deplacer,
  enJeu,
  lies,
  plateauVide,
  poser,
  production,
  productionParCase,
  retirer,
  tic,
  tirer,
  type Graphe,
  type Jeton,
  type Reglage,
} from './plateau.ts'

let echecs = 0
function verifier(quoi: string, vrai: boolean): void {
  if (!vrai) echecs += 1
  console.log(`  ${vrai ? 'ok  ' : 'ECHEC'}  ${quoi}`)
}

function egal(obtenu: unknown, attendu: unknown, quoi: string): void {
  verifier(`${quoi} (${String(obtenu)} attendu ${String(attendu)})`, obtenu === attendu)
}

const REG: Reglage = {
  cote: 4,
  tick: 5000,
  base: 1,
  synergie: 1,
  main: 10,
  booster: 5,
  sousPool: 300,
}

/** Des jetons de test : A..F, et un graphe ou A-B, B-C et D-E sont lies. */
const jeton = (id: string): Jeton => ({ id, nom: id, image: '', rarete: 'commun' })
const GRAPHE: Graphe = { A: ['B'], B: ['C'], D: ['E'] }

/** Une grille de 4x4 depuis une liste de cases, `.` pour une case vide. */
function grille(cases: string): (Jeton | null)[] {
  const c = cases.split(/\s+/).filter((s) => s !== '')
  const out: (Jeton | null)[] = Array.from({ length: 16 }, () => null)
  for (const [i, s] of c.entries()) if (s !== '.' && i < 16) out[i] = jeton(s)
  return out
}

function avec(cases: string) {
  return { ...plateauVide(REG, []), grille: grille(cases) }
}

console.log('LA GRILLE ET SON ADJACENCE')
{
  // VINGT-QUATRE COUPLES, pas quarante-huit : chaque couple compte une fois.
  egal(couples(4).length, 24, 'une grille 4x4 a 24 couples adjacents')
  egal(couples(1).length, 0, 'une grille 1x1 n’a aucun couple')
  egal(couples(2).length, 4, 'une grille 2x2 a 4 couples')

  // PAS DE DIAGONALE : les cases 0 et 5 se touchent par le coin.
  const paires = couples(4).map(([a, b]) => `${a}-${b}`)
  verifier('0 et 1 sont voisins (meme ligne)', paires.includes('0-1'))
  verifier('0 et 4 sont voisins (meme colonne)', paires.includes('0-4'))
  verifier('0 et 5 ne sont PAS voisins (diagonale)', !paires.includes('0-5'))
  // ET LES BORDS NE SE REJOIGNENT PAS : la case 3 finit sa ligne, la 4 ouvre
  // la suivante. *Un index qui ne regarde que « i + 1 » les croirait voisines.*
  verifier('3 et 4 ne sont PAS voisins (bout de ligne)', !paires.includes('3-4'))
}

console.log('\nLA PRODUCTION')
{
  // 1. UNE CARTE SEULE : sa base, rien de plus.
  egal(production(avec('A'), GRAPHE), 1, 'une carte seule produit 1')

  // 2. DEUX CARTES LIEES ET ADJACENTES : +1 a CHACUNE.
  egal(production(avec('A B'), GRAPHE), 4, 'A et B liees et adjacentes produisent 4')
  egal(
    productionParCase(avec('A B'), GRAPHE).slice(0, 2).join(','),
    '2,2',
    'et chacune affiche 2',
  )

  // 3. DEUX CARTES LIEES MAIS NON ADJACENTES : aucune synergie.
  egal(production(avec('A . B'), GRAPHE), 2, 'A et B liees mais eloignees produisent 2')
  egal(
    production({ ...plateauVide(REG, []), grille: grille('A . . . . . . . . . . . . . . B') }, GRAPHE),
    2,
    'A en haut a gauche et B en bas a droite : aucune synergie',
  )

  // 4. TROIS CARTES EN LIGNE DONT DEUX PAIRES LIEES : A-B et B-C.
  //    B touche les deux, donc elle prend deux fois le bonus.
  egal(production(avec('A B C'), GRAPHE), 7, 'A B C en ligne : 3 bases + 2 paires x 2 = 7')
  egal(
    productionParCase(avec('A B C'), GRAPHE).slice(0, 3).join(','),
    '2,3,2',
    'et B, qui touche les deux, affiche 3',
  )

  // DEUX CARTES ADJACENTES NON LIEES ne produisent que leurs bases.
  egal(production(avec('A C'), GRAPHE), 2, 'A et C adjacentes mais non liees produisent 2')

  // LE LIEN EST NON ORIENTE : le graphe ne porte que A -> B.
  verifier('A-B est lu dans les deux sens', lies(GRAPHE, 'B', 'A'))
  verifier('une carte absente du graphe n’est liee a personne', !lies(GRAPHE, 'A', 'Z'))

  // UNE GRILLE VIDE NE PRODUIT RIEN : *un tick sur rien ne doit pas donner un
  // point parce qu'une case existe.*
  egal(production(plateauVide(REG, []), GRAPHE), 0, 'une grille vide produit 0')

  // LA SYNERGIE SUIT SON REGLAGE, elle n'est pas ecrite en dur.
  const fort = { ...avec('A B'), reglage: { ...REG, synergie: 5 } }
  egal(production(fort, GRAPHE), 12, 'a synergie 5, A et B produisent 12')
  const nul = { ...avec('A B'), reglage: { ...REG, synergie: 0 } }
  egal(production(nul, GRAPHE), 2, 'a synergie 0, l’arrangement ne change rien')
}

console.log('\nLE TICK')
{
  const p = tic(avec('A B'), GRAPHE)
  egal(p.ressource, 4, 'un tick ajoute la production')
  egal(p.ticks, 1, 'et compte le tick')
  egal(tic(tic(avec('A B'), GRAPHE), GRAPHE).ressource, 8, 'deux ticks doublent')
  // LE TICK EST PUR : le meme plateau rend toujours le meme resultat.
  const base = avec('A B C')
  egal(tic(base, GRAPHE).ressource, tic(base, GRAPHE).ressource, 'le tick est deterministe')
}

console.log('\nPOSER, DEPLACER, RETIRER')
{
  const depart = plateauVide(REG, [jeton('A'), jeton('B')])

  const pose = poser(depart, 'A', 0)
  egal(pose.grille[0]?.id, 'A', 'poser met la carte sur la case')
  egal(pose.main.length, 1, 'et la retire de la main')

  // UNE CASE OCCUPEE ECHANGE : rien ne disparait.
  const echange = poser(pose, 'B', 0)
  egal(echange.grille[0]?.id, 'B', 'poser sur une case occupee remplace')
  egal(echange.main[0]?.id, 'A', 'et ce qui est deloge repart en main')
  egal(echange.main.length, 1, 'la main garde sa taille')

  // RIEN NE SE PERD NI NE SE DUPLIQUE, quel que soit le chemin.
  egal(enJeu(echange).size, 2, 'les deux cartes sont toujours en jeu')

  const deplace = deplacer(pose, 0, 5)
  egal(deplace.grille[5]?.id, 'A', 'deplacer pose sur la cible')
  egal(deplace.grille[0], null, 'et vide la case de depart')
  egal(deplacer(pose, 0, 0).grille[0]?.id, 'A', 'deplacer sur soi-meme ne change rien')
  egal(deplacer(pose, 3, 7).grille[7], null, 'deplacer une case vide ne fait rien')

  const deuxSurGrille = poser(poser(depart, 'A', 0), 'B', 1)
  const croise = deplacer(deuxSurGrille, 0, 1)
  egal(croise.grille[1]?.id, 'A', 'deplacer sur une case occupee echange aussi')
  egal(croise.grille[0]?.id, 'B', 'et l’autre prend la place liberee')

  const reprise = retirer(pose, 0)
  egal(reprise.grille[0], null, 'retirer vide la case')
  egal(reprise.main.length, 2, 'et rend la carte a la main')
  egal(retirer(depart, 7).main.length, 2, 'retirer une case vide ne fait rien')

  // HORS GRILLE : on ne pose pas a cote du plateau.
  egal(poser(depart, 'A', 99).main.length, 2, 'poser hors de la grille ne fait rien')
  egal(poser(depart, 'A', -1).main.length, 2, 'poser sur une case negative ne fait rien')
  egal(poser(depart, 'Z', 0).main.length, 2, 'poser une carte absente de la main ne fait rien')
}

console.log('\nLE TIRAGE')
{
  const pool = 'ABCDEFGHIJ'.split('').map(jeton)
  let g = 1
  const rng = (): number => {
    g = (g * 1103515245 + 12345) & 0x7fffffff
    return g / 0x7fffffff
  }
  const main = tirer(pool, 5, rng)
  egal(main.length, 5, 'on tire le nombre demande')
  egal(new Set(main.map((j) => j.id)).size, 5, 'sans doublon')

  // ON NE RETIRE PAS CE QUI EST DEJA EN JEU.
  const encore = tirer(pool, 3, rng, new Set(main.map((j) => j.id)))
  verifier(
    'un tirage evite ce qui est deja en jeu',
    encore.every((j) => !main.some((m) => m.id === j.id)),
  )

  // UN POOL TROP PETIT NE BOUCLE PAS : il rend ce qu'il peut.
  egal(tirer(pool.slice(0, 3), 10, rng).length, 3, 'un pool de 3 ne rend que 3 cartes')

  const apres = booster({ ...plateauVide(REG, main), ...{} }, pool, rng)
  egal(apres.main.length, 10, 'un booster ajoute ses cartes a la main')
  egal(new Set(apres.main.map((j) => j.id)).size, 10, 'et n’en duplique aucune')
}

console.log(`\n${echecs === 0 ? 'Tout passe.' : `${echecs} echec(s).`}`)
if (echecs > 0) throw new Error(`${echecs} vérification(s) en échec`)

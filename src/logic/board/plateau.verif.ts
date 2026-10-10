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
  bonusDuCouple,
  couplesQuiPaient,
  distance,
  enJeu,
  lies,
  plateauVide,
  symetrique,
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
  portee: 5,
  main: 10,
  booster: 5,
  sousPool: 300,
}

/**
 * Des jetons de test : A..F, et un graphe ou A-B, B-C et D-E sont lies.
 *
 * Les distances qui en decoulent : A-B 1, B-C 1, **A-C 2** (par B), D-E 1, et
 * A-D injoignable. *Le graphe de test est ecrit a moitie oriente expres* — c'est
 * `symetrique()` qui le referme, et c'est justement ce qu'on veut verifier.
 */
const jeton = (id: string): Jeton => ({ id, nom: id, image: '', rarete: 'commun' })
const BRUT: Graphe = { A: ['B'], B: ['C'], D: ['E'] }
const GRAPHE: Graphe = symetrique(BRUT)

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

  // 2. DEUX CARTES LIEES ET ADJACENTES : le bonus MAXIMUM a CHACUNE.
  //    A portee 5, un lien direct vaut 5 - 1 = 4.
  egal(production(avec('A B'), GRAPHE), 10, 'A et B liees et adjacentes produisent 10')
  egal(
    productionParCase(avec('A B'), GRAPHE).slice(0, 2).join(','),
    '5,5',
    'et chacune affiche 5',
  )

  // 3. DEUX CARTES LIEES MAIS NON ADJACENTES : rien. *La grille et le graphe
  //    sont deux conditions, et il faut les deux.*
  egal(production(avec('A . B'), GRAPHE), 2, 'A et B liees mais eloignees produisent 2')
  egal(
    production({ ...plateauVide(REG, []), grille: grille('A . . . . . . . . . . . . . . B') }, GRAPHE),
    2,
    'A en haut a gauche et B en bas a droite : aucune synergie',
  )

  // 4. TROIS CARTES EN LIGNE DONT DEUX PAIRES LIEES : A-B et B-C a 1 saut.
  //    B touche les deux, donc elle prend deux fois le bonus. A et C ne sont
  //    PAS cote a cote sur la grille, donc leur distance de 2 ne paie pas.
  egal(production(avec('A B C'), GRAPHE), 19, 'A B C en ligne : 3 bases + 2 couples a 4 x 2 = 19')
  egal(
    productionParCase(avec('A B C'), GRAPHE).slice(0, 3).join(','),
    '5,9,5',
    'et B, qui touche les deux, affiche 9',
  )

  // DEUX CARTES A DEUX SAUTS, COTE A COTE : le bonus DIMINUE, il ne tombe pas.
  // *C'est toute la regle de Keko* — et avant elle, ce couple ne rapportait rien.
  egal(production(avec('A C'), GRAPHE), 8, 'A et C a 2 sauts, cote a cote : 2 + 3 x 2 = 8')
  egal(productionParCase(avec('A C'), GRAPHE).slice(0, 2).join(','), '4,4', 'et chacune affiche 4')

  // DEUX CARTES INJOIGNABLES ne produisent que leurs bases.
  egal(production(avec('A D'), GRAPHE), 2, 'A et D injoignables produisent 2')

  // LE LIEN EST NON ORIENTE : le graphe ne porte que A -> B.
  verifier('A-B est lu dans les deux sens', lies(GRAPHE, 'B', 'A'))
  verifier('une carte absente du graphe n’est liee a personne', !lies(GRAPHE, 'A', 'Z'))

  // UNE GRILLE VIDE NE PRODUIT RIEN : *un tick sur rien ne doit pas donner un
  // point parce qu'une case existe.*
  egal(production(plateauVide(REG, []), GRAPHE), 0, 'une grille vide produit 0')

  // LA PORTEE SUIT SON REGLAGE, elle n'est pas ecrite en dur.
  const court = { ...avec('A C'), reglage: { ...REG, portee: 2 } }
  egal(production(court, GRAPHE), 2, 'a portee 2, deux sauts ne paient plus')
  const direct = { ...avec('A B'), reglage: { ...REG, portee: 2 } }
  egal(production(direct, GRAPHE), 4, 'a portee 2, un lien direct vaut encore 1')
  const nul = { ...avec('A B'), reglage: { ...REG, portee: 1 } }
  egal(production(nul, GRAPHE), 2, 'a portee 1, l’arrangement ne change plus rien')
  const large = { ...avec('A C'), reglage: { ...REG, portee: 9 } }
  egal(production(large, GRAPHE), 16, 'a portee 9, deux sauts valent 7 chacune')
}

console.log('\nLA DISTANCE')
{
  // CE QUE LA FORMULE DE KEKO DEMANDE : le nombre de sauts, pas le fait d'etre lie.
  egal(distance(GRAPHE, 'A', 'A', 4), 0, 'une carte est a 0 saut d’elle-meme')
  egal(distance(GRAPHE, 'A', 'B', 4), 1, 'A et B sont a 1 saut')
  egal(distance(GRAPHE, 'A', 'C', 4), 2, 'A et C sont a 2 sauts, par B')
  egal(distance(GRAPHE, 'A', 'D', 4), Infinity, 'A et D ne se joignent pas')
  egal(distance(GRAPHE, 'A', 'Z', 4), Infinity, 'une carte hors du graphe ne se joint pas')

  // ELLE SE LIT DANS LES DEUX SENS, et c'est `symetrique()` qui le garantit :
  // le graphe brut ne porte que B -> C, donc un parcours parti de C sur lui
  // n'irait nulle part. *Un parcours ne peut pas lire un graphe a moitie oriente.*
  egal(distance(GRAPHE, 'C', 'A', 4), 2, 'C et A sont a 2 sauts, dans ce sens aussi')
  egal(distance(GRAPHE, 'C', 'B', 4), 1, 'C et B sont a 1 saut, dans ce sens aussi')
  egal(distance(BRUT, 'C', 'B', 4), Infinity, 'et le graphe BRUT, lui, ne le voit pas')

  // LA BORNE COUPE, et c'est elle qui rend la regle tenable a l'ecran.
  egal(distance(GRAPHE, 'A', 'C', 1), Infinity, 'bornee a 1 saut, A-C sort du champ')
  egal(distance(GRAPHE, 'A', 'B', 1), 1, 'bornee a 1 saut, A-B tient encore')
  egal(distance(GRAPHE, 'A', 'B', 0), Infinity, 'bornee a 0, plus rien ne se joint')

  // LE CACHE NE CHANGE PAS LE RESULTAT — il ne fait que l'eviter.
  const cache = new Map<string, number>()
  egal(distance(GRAPHE, 'A', 'C', 4, cache), 2, 'avec cache, A-C vaut 2')
  egal(distance(GRAPHE, 'A', 'C', 4, cache), 2, 'et la seconde fois aussi')
  egal(distance(GRAPHE, 'C', 'A', 4, cache), 2, 'la cle est la meme dans les deux sens')
  egal(cache.size, 1, 'donc le cache ne retient qu’une entree')

  // LE BONUS EST `portee - sauts`, ET IL NE DESCEND PAS SOUS ZERO.
  egal(bonusDuCouple(REG, GRAPHE, 'A', 'B'), 4, 'a portee 5, un lien direct vaut 4')
  egal(bonusDuCouple(REG, GRAPHE, 'A', 'C'), 3, 'a deux sauts, 3')
  egal(bonusDuCouple(REG, GRAPHE, 'A', 'D'), 0, 'injoignable, 0')
  egal(bonusDuCouple(REG, GRAPHE, 'A', 'A'), 0, 'une carte ne se paie pas elle-meme')

  // LES COUPLES QUI PAIENT PORTENT LEUR DISTANCE : *c'est elle que le joueur
  // doit lire pour comprendre pourquoi un couple rapporte 4 et son voisin 3.*
  const trois = couplesQuiPaient(avec('A B C'), GRAPHE)
  egal(trois.length, 2, 'A B C en ligne : deux couples paient')
  egal(trois.map((c) => `${c.cases.join('-')}@${c.sauts}:${c.gain}`).join(' '), '0-1@1:4 1-2@1:4', 'et chacun dit sa distance')
  const deux = couplesQuiPaient(avec('A C'), GRAPHE)
  egal(deux.map((c) => `${c.sauts}:${c.gain}`).join(''), '2:3', 'A et C cote a cote : 2 sauts pour 3')
  egal(couplesQuiPaient(avec('A D'), GRAPHE).length, 0, 'un couple injoignable ne figure pas')
}

console.log('\nLE TICK')
{
  const p = tic(avec('A B'), GRAPHE)
  egal(p.ressource, 10, 'un tick ajoute la production')
  egal(p.ticks, 1, 'et compte le tick')
  egal(tic(tic(avec('A B'), GRAPHE), GRAPHE).ressource, 20, 'deux ticks doublent')
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

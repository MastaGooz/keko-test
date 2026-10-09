/**
 * Vérifications des formules du mode personnages, sans navigateur.
 *
 * Ce qu'on vérifie ici, ce n'est pas l'équilibrage — il se juge sur
 * `stats-summary.txt` — ce sont les propriétés qui doivent tenir quels que
 * soient les réglages : l'échelle est monotone, elle est bornée, les quatre crans
 * de rareté sont atteignables, et le domaine se déduit d'un libellé de métier
 * tel que Wikidata l'écrit (« écrivain ou écrivaine », « homme politique »).
 */
import { domaineDe, siecle, statsDerivees, type Brut } from './formules.ts'
import { parsePersonnage, parsePersonnages, RARETES } from './types.ts'

let echecs = 0
function verifier(quoi: string, vrai: boolean): void {
  if (!vrai) echecs += 1
  console.log(`  ${vrai ? 'ok  ' : 'ECHEC'}  ${quoi}`)
}

function egal(obtenu: unknown, attendu: unknown, quoi: string): void {
  verifier(`${quoi} (${String(obtenu)})`, obtenu === attendu)
}

// LE GABARIT REPREND TOUT LE TYPE, champ neuf compris : *un fixture incomplet
// teste une AUTRE chose que celle qu'on croit, et il passe.* La leçon est déjà
// écrite dans ce projet, payée sur `cartes()` du combat.
const BASE: Brut = { langues: 50, vues: 5_000, taille: 20_000, metiers: [], fiction: false, description: '' }
const brut = (p: Partial<Brut>): Brut => ({ ...BASE, ...p })

console.log('\nL’ÉCHELLE')

// Les deux stats restent DANS leur échelle, quelles que soient les valeurs
// d'entrée. Un article de deux mégaoctets ne doit pas rendre une défense de 40.
{
  const petit = statsDerivees(brut({ langues: 0, vues: 0, taille: 0 }))
  const enorme = statsDerivees(brut({ langues: 100_000, vues: 90_000_000, taille: 9_000_000 }))
  egal(petit.attaque, 1, 'une valeur nulle plancher à 1 en attaque')
  egal(petit.defense, 1, 'une valeur nulle plancher à 1 en défense')
  egal(enorme.attaque, 10, 'une valeur énorme plafonne à 10 en attaque')
  egal(enorme.defense, 10, 'une valeur énorme plafonne à 10 en défense')
  verifier('la notoriété reste dans 0..1', petit.notoriete >= 0 && enorme.notoriete <= 1)
}

// L'ÉCHELLE EST MONOTONE. C'est la seule garantie qui rende les seuils de
// rareté interprétables : si plus de notoriété pouvait rendre une carte plus
// commune, le résumé ne dirait rien.
{
  let croissante = true
  let precedente = -1
  for (const vues of [0, 100, 1_000, 10_000, 100_000, 1_000_000]) {
    const a = statsDerivees(brut({ vues })).attaque
    if (a < precedente) croissante = false
    precedente = a
  }
  verifier('l’attaque croît avec les vues', croissante)

  // LA NOTORIÉTÉ SUIT LES VUES, et plus le nombre de langues : voir `POIDS`.
  // *La vérification a changé de variable, pas de forme* — c'est ce qu'on
  // demande à une mesure quand un critère est remplacé par un autre.
  let notoriete = -1
  let monotone = true
  for (const vues of [0, 1_000, 50_000, 500_000, 5_000_000, 50_000_000]) {
    const n = statsDerivees(brut({ vues })).notoriete
    if (n < notoriete) monotone = false
    notoriete = n
  }
  verifier('la notoriété croît avec les vues', monotone)

  // ET ELLE NE SUIT PLUS LES LANGUES : le champ reste dans le fichier, il ne
  // décide plus de rien. *Un critère retiré doit être retiré pour de bon*,
  // sinon il revient par un poids qu'on avait oublié de mettre à zéro.
  verifier(
    'le nombre de langues ne change plus la notoriété',
    statsDerivees(brut({ langues: 1 })).notoriete === statsDerivees(brut({ langues: 300 })).notoriete,
  )
}

// LES QUATRE CRANS SONT ATTEIGNABLES. Un cran que rien ne peut remplir est un
// cran mort, et le résumé le dirait — mais autant le savoir sans télécharger
// trois mille personnages.
{
  const atteints = new Set<string>()
  // LE BALAYAGE DES VUES EST MULTIPLICATIF, parce que l'echelle l'est. *Cinq
  // valeurs choisies a la main sautaient la bande de l'epique* -- et un cran
  // qu'on declare mort parce qu'on ne l'a pas vise n'est pas une mesure.
  for (let langues = 1; langues <= 320; langues += 40)
    for (let vues = 1; vues < 100_000_000; vues = Math.ceil(vues * 1.2))
      atteints.add(statsDerivees(brut({ langues, vues })).rarete)
  for (const r of RARETES) verifier(`le cran « ${r} » est atteignable`, atteints.has(r))
}

console.log('\nLE DOMAINE')

// LES LIBELLÉS SONT CEUX DE WIKIDATA, recopiés d'une réponse réelle : ils
// portent les accents, les doublets féminins et les composés. C'est exactement
// ce que `cle` doit absorber. Sans description, c'est le métier qui parle.
egal(domaineDe('', ['écrivain ou écrivaine', 'poète ou poétesse'], false), 'penseur', 'un écrivain est un penseur')
egal(domaineDe('', ['astronome', 'médecin'], false), 'scientifique', 'un astronome est un scientifique')
egal(domaineDe('', ['homme politique'], false), 'politique', 'un homme politique est politique')
egal(domaineDe('', ['peintre'], false), 'artiste', 'un peintre est un artiste')
egal(domaineDe('', ['prêtre catholique'], false), 'religieux', 'un prêtre est un religieux')
egal(domaineDe('', ['maréchal'], false), 'militaire', 'un maréchal est un militaire')
egal(domaineDe('', ['joueur de football'], false), 'sportif', 'un joueur de football est un sportif')
egal(domaineDe('', ['navigateur'], false), 'explorateur', 'un navigateur est un explorateur')
egal(domaineDe('', [], false), 'autre', 'sans rien, le domaine est « autre »')
egal(domaineDe('', ['philatéliste'], false), 'autre', 'un métier inconnu tombe dans « autre »')

// LA FICTION PASSE AVANT TOUT. Un personnage de fiction peut porter des métiers
// — Sherlock Holmes est « détective » — mais ce qui le définit est qu'il
// n'existe pas.
egal(domaineDe('détective consultant', ['écrivain'], true), 'fiction', 'un personnage de fiction reste « fiction »')

// LA DESCRIPTION PASSE AVANT LES MÉTIERS, et c'est LE PREMIER MOT qui gagne.
// Ce sont les cas réels qui ont motivé la règle, repris mot pour mot de
// Wikidata : *le role principal ouvre la phrase.*
egal(
  domaineDe('compositeur et pianiste franco-polonais', ['pédagogue', 'professeur de piano', 'compositeur'], false),
  'artiste',
  'Chopin est un artiste, bien que « pédagogue » vienne en tête de ses métiers',
)
egal(
  domaineDe('peintre, sculpteur, architecte et ingénieur italien', ['scientifique', 'diplomate'], false),
  'artiste',
  'Léonard est un artiste, bien que « diplomate » soit dans ses métiers',
)
egal(
  domaineDe('philosophe grec du IVe siècle avant notre ère', ['philosophe du droit'], false),
  'penseur',
  'Platon est un penseur : « droit » ne doit plus être lu comme « roi »',
)
egal(
  domaineDe('homme d\'État américain', [], false),
  'politique',
  '« homme d’État » est politique — 115 descriptions en dépendaient',
)

// UN MOT N'EST PAS UN BOUT DE MOT. C'est ce qui rangeait 123 traducteurs en
// « politique », parce que « traDUCteur » contient « duc ».
egal(domaineDe('', ['traducteur ou traductrice'], false), 'penseur', 'un traducteur n’est pas un duc')
egal(domaineDe('', ['producteur de cinéma'], false), 'artiste', 'un producteur n’est pas un duc')

// MAIS LES FORMES FLÉCHIES RESTENT DES MOTS : le suffixe couvre le pluriel et
// le féminin, sinon il faudrait écrire chaque variante dans la table.
egal(domaineDe('avocate et femme politique', [], false), 'politique', 'le féminin « avocate » compte')
egal(domaineDe('peintres de l’école flamande', [], false), 'artiste', 'le pluriel « peintres » compte')

// LE REPLI NE SE DÉCLENCHE QUE SI LA DESCRIPTION EST MUETTE.
egal(
  domaineDe('personnalité du XIXe siècle', ['maréchal'], false),
  'militaire',
  'une description muette laisse parler les métiers',
)

console.log('\nLE SIÈCLE')

// 1800 CLÔT LE XVIIIe SIÈCLE (1701-1800), il ne l'ouvre pas : c'est la
// convention, et c'est exactement le bord qu'une formule de siècle rate.
egal(siecle(1800), 18, '1800 clôt le XVIIIe siècle')
egal(siecle(1801), 19, '1801 est au XIXe siècle')
egal(siecle(1900), 19, '1900 est au XIXe siècle')
egal(siecle(1901), 20, '1901 est au XXe siècle')
egal(siecle(-44), -1, 'l’an −44 est au Ier siècle avant notre ère')
egal(siecle(-428), -5, 'l’an −428 est au Ve siècle avant notre ère')
egal(siecle(null), null, 'une année inconnue n’a pas de siècle')

console.log('\nLA LECTURE DU JSON')

// UNE CARTE FAUSSE NE DOIT PAS EMPORTER LES TROIS MILLE AUTRES : le fichier est
// engendré, donc une ligne peut être abîmée.
{
  const bonne = {
    id: 'Q1339', nom: 'Jean-Sébastien Bach', description: 'compositeur', article: 'Jean-Sébastien Bach',
    image: null, naissance: 1685, mort: 1750, fiction: false, origine: null, metiers: ['compositeur'],
    domaine: 'artiste', langues: 180, taille: 90_000, vues: 40_000, rarete: 'epique', attaque: 7, defense: 8,
  }
  verifier('une carte complète se lit', parsePersonnage(bonne) !== null)
  verifier('une carte sans id est rejetée', parsePersonnage({ ...bonne, id: '' }) === null)
  verifier('un domaine inconnu est rejeté', parsePersonnage({ ...bonne, domaine: 'pirate' }) === null)
  verifier('une rareté inconnue est rejetée', parsePersonnage({ ...bonne, rarete: 'mythique' }) === null)

  const lot = parsePersonnages(JSON.stringify({ genere: '2026-01-01', cartes: [bonne, { id: 'Q2' }, bonne] }))
  egal(lot.length, 2, 'une ligne abîmée est sautée, les autres passent')

  egal(parsePersonnages('ceci n’est pas du JSON').length, 0, 'un fichier illisible rend une liste vide')
  egal(parsePersonnages(JSON.stringify([bonne])).length, 1, 'un tableau nu se lit aussi')
}

console.log(`\n${echecs === 0 ? 'Tout passe.' : `${echecs} échec(s).`}`)
if (echecs > 0) throw new Error(`${echecs} vérification(s) en échec`)

/**
 * Vérifications du format des cartes-animaux, sans navigateur.
 *
 * Ce qu'on vérifie ici n'est pas la coupe — elle se juge sur `animals_review.md`
 * — ce sont les propriétés qui doivent tenir quel que soit le pipeline : une
 * ligne abîmée ne doit pas emporter les autres, un cran ou un statut inconnu
 * doit être refusé, et **une carte garde son rang RÉEL** à côté de ce qu'elle
 * absorbe dans la coupe.
 */
import { parseCarteAnimal, parseAnimaux, RARETES_ANIMAL, STATUTS_UICN } from './types.ts'

let echecs = 0
function verifier(quoi: string, vrai: boolean): void {
  if (!vrai) echecs += 1
  console.log(`  ${vrai ? 'ok  ' : 'ECHEC'}  ${quoi}`)
}

function egal(obtenu: unknown, attendu: unknown, quoi: string): void {
  verifier(`${quoi} (${String(obtenu)})`, obtenu === attendu)
}

// LE GABARIT REPREND TOUT LE TYPE, champ neuf compris : *un fixture incomplet
// teste une AUTRE chose que celle qu'on croit, et il passe.* Leçon déjà payée
// sur `cartes()` du combat.
const CHAUVE_SOURIS = {
  id: '785',
  groupe: 'mammifères',
  nom_fr: 'Chauve-souris',
  nom_scientifique: 'Chiroptera',
  rang: 'ORDER',
  parent_id: null,
  nb_especes_absorbees: 1798,
  score: 0.61,
  rarete: 'epique',
  statut_uicn: null,
  masse_kg: null,
  image: 'https://commons.wikimedia.org/wiki/Special:FilePath/Bat.jpg',
  article_fr: 'Chiroptera',
  vues: 1_200_000,
}

console.log('\nLA LECTURE D’UNE CARTE')

verifier('une carte complète se lit', parseCarteAnimal(CHAUVE_SOURIS) !== null)
verifier('une carte sans id est rejetée', parseCarteAnimal({ ...CHAUVE_SOURIS, id: '' }) === null)
verifier(
  'une carte sans nom français est rejetée',
  parseCarteAnimal({ ...CHAUVE_SOURIS, nom_fr: '' }) === null,
)
verifier(
  'une carte sans rang est rejetée',
  parseCarteAnimal({ ...CHAUVE_SOURIS, rang: null }) === null,
)
verifier(
  'une rareté inconnue est rejetée',
  parseCarteAnimal({ ...CHAUVE_SOURIS, rarete: 'mythique' }) === null,
)
verifier(
  'un statut UICN inconnu est rejeté',
  parseCarteAnimal({ ...CHAUVE_SOURIS, statut_uicn: 'XX' }) === null,
)
verifier(
  'un compte d’espèces manquant est rejeté',
  parseCarteAnimal({ ...CHAUVE_SOURIS, nb_especes_absorbees: null }) === null,
)

// LES CHAMPS FACULTATIFS LE SONT VRAIMENT. Un ordre n'a ni masse ni statut UICN
// — *on n'évalue pas la conservation d'un ordre de 1400 espèces* — et une carte
// sans image reste une carte au niveau du format : c'est au pipeline de décider
// s'il la garde.
{
  const nu = parseCarteAnimal({
    ...CHAUVE_SOURIS,
    statut_uicn: null,
    masse_kg: null,
    image: null,
    article_fr: null,
    parent_id: null,
  })
  verifier('une carte sans masse, statut, image ni article se lit', nu !== null)
  egal(nu?.masse_kg, null, 'la masse absente reste nulle')
}

// LES QUATRE CRANS ET LES HUIT STATUTS SE LISENT TOUS. Un cran que le format
// refuserait serait un cran mort, et le pipeline ne le dirait pas.
for (const r of RARETES_ANIMAL) {
  verifier(`le cran « ${r} » se lit`, parseCarteAnimal({ ...CHAUVE_SOURIS, rarete: r }) !== null)
}
for (const s of STATUTS_UICN) {
  verifier(`le statut « ${s} » se lit`, parseCarteAnimal({ ...CHAUVE_SOURIS, statut_uicn: s }) !== null)
}

console.log('\nLE RANG RÉEL ET LA COUPE SONT DEUX CHOSES')

// C'EST LA RÈGLE QUI PORTE LE MODE : une carte n'est pas un rang taxonomique.
// Le format doit pouvoir dire « cette carte est un ORDRE et elle couvre 1798
// espèces » aussi bien que « cette carte est une ESPÈCE et elle en couvre une ».
{
  const ordre = parseCarteAnimal(CHAUVE_SOURIS)
  const espece = parseCarteAnimal({
    ...CHAUVE_SOURIS,
    id: '5219404',
    nom_fr: 'Lion',
    nom_scientifique: 'Panthera leo',
    rang: 'SPECIES',
    parent_id: '2435099',
    nb_especes_absorbees: 1,
    statut_uicn: 'VU',
    masse_kg: 190,
  })
  egal(ordre?.rang, 'ORDER', 'un ordre garde son rang réel')
  egal(ordre?.nb_especes_absorbees, 1798, 'un ordre absorbe tout son sous-arbre')
  egal(espece?.rang, 'SPECIES', 'une espèce garde son rang réel')
  egal(espece?.nb_especes_absorbees, 1, 'une espèce n’absorbe qu’elle-même')
  egal(espece?.parent_id, '2435099', 'le parent est celui de LA COUPE, pas de la taxonomie')
}

console.log('\nLE CATALOGUE')

{
  const lot = parseAnimaux(
    JSON.stringify({
      genere: '2026-01-01',
      groupe: 'mammifères',
      seuil: 0.4,
      cartes: [CHAUVE_SOURIS, { id: 'X' }, CHAUVE_SOURIS],
    }),
  )
  egal(lot.length, 2, 'une ligne abîmée est sautée, les autres passent')
  egal(parseAnimaux('ceci n’est pas du JSON').length, 0, 'un fichier illisible rend une liste vide')
  egal(parseAnimaux(JSON.stringify([CHAUVE_SOURIS])).length, 1, 'un tableau nu se lit aussi')
}

// LE GROUPE EST UN CHAMP, PAS UN FICHIER. C'est ce qui permettra d'ajouter les
// oiseaux sans changer de format — et pourquoi le fichier s'appelle
// `animals.json` et non `mammals.json`.
{
  const oiseau = parseCarteAnimal({
    ...CHAUVE_SOURIS,
    id: '212',
    groupe: 'oiseaux',
    nom_fr: 'Manchot',
    nom_scientifique: 'Spheniscidae',
    rang: 'FAMILY',
  })
  egal(oiseau?.groupe, 'oiseaux', 'un autre groupe se lit dans le même format')
}

console.log(`\n${echecs === 0 ? 'Tout passe.' : `${echecs} échec(s).`}`)
if (echecs > 0) throw new Error(`${echecs} vérification(s) en échec`)

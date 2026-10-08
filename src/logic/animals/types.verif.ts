/**
 * Vérifications du format des cartes-animaux, sans navigateur.
 *
 * Ce qu'on vérifie ici n'est pas le contenu de la collection — il se juge sur
 * `animals_review.md` — ce sont les propriétés qui doivent tenir quel que soit
 * le pipeline : une ligne abîmée ne doit pas emporter les autres, un cran ou un
 * statut inconnu doit être refusé, et **une carte doit pouvoir se ranger**.
 */
import { parseCarteAnimal, parseAnimaux, parOrdre, RARETES_ANIMAL, STATUTS_UICN } from './types.ts'

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
const LION = {
  id: '5219404',
  groupe: 'mammifères',
  nom_fr: 'Lion',
  nom_scientifique: 'Panthera leo',
  ordre: 'Carnivora',
  ordre_fr: 'Carnivores',
  famille: 'Felidae',
  score: 0.94,
  rarete: 'legendaire',
  statut_uicn: 'VU',
  masse_kg: 190,
  image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/73/Lion.jpg/960px-Lion.jpg',
  article_fr: 'Lion',
  vues: 1_200_000,
}

console.log('\nLA LECTURE D’UNE CARTE')

verifier('une carte complète se lit', parseCarteAnimal(LION) !== null)
verifier('une carte sans id est rejetée', parseCarteAnimal({ ...LION, id: '' }) === null)
verifier(
  'une carte sans nom français est rejetée',
  parseCarteAnimal({ ...LION, nom_fr: '' }) === null,
)
verifier(
  'une carte sans nom scientifique est rejetée',
  parseCarteAnimal({ ...LION, nom_scientifique: null }) === null,
)
verifier(
  'une rareté inconnue est rejetée',
  parseCarteAnimal({ ...LION, rarete: 'mythique' }) === null,
)
verifier(
  'un statut UICN inconnu est rejeté',
  parseCarteAnimal({ ...LION, statut_uicn: 'XX' }) === null,
)
verifier('un score manquant est rejeté', parseCarteAnimal({ ...LION, score: null }) === null)

// UNE CARTE DOIT POUVOIR SE RANGER, et c'est ce qui remplace l'arbre : les
// groupes que le public nomme ne sont plus des cartes, ils sont les RAYONS de
// la collection. *Une carte sans rayon n'a pas sa place dans un catalogue qui
// se range*, donc les trois champs sont obligatoires.
verifier('une carte sans ordre est rejetée', parseCarteAnimal({ ...LION, ordre: '' }) === null)
verifier(
  'une carte sans nom d’ordre français est rejetée',
  parseCarteAnimal({ ...LION, ordre_fr: null }) === null,
)
verifier('une carte sans famille est rejetée', parseCarteAnimal({ ...LION, famille: '' }) === null)

// LES CHAMPS FACULTATIFS LE SONT VRAIMENT. Beaucoup de petits mammifères n'ont
// ni masse ni statut UICN — *une absence de statut n'est pas un statut
// rassurant*, et c'est au rendu de le dire autrement qu'en affichant « LC ».
{
  const nu = parseCarteAnimal({
    ...LION,
    statut_uicn: null,
    masse_kg: null,
    image: null,
    article_fr: null,
  })
  verifier('une carte sans masse, statut, image ni article se lit', nu !== null)
  egal(nu?.masse_kg, null, 'la masse absente reste nulle')
  egal(nu?.statut_uicn, null, 'le statut absent reste nul')
}

// LES QUATRE CRANS ET LES HUIT STATUTS SE LISENT TOUS. Un cran que le format
// refuserait serait un cran mort, et le pipeline ne le dirait pas.
for (const r of RARETES_ANIMAL) {
  verifier(`le cran « ${r} » se lit`, parseCarteAnimal({ ...LION, rarete: r }) !== null)
}
for (const s of STATUTS_UICN) {
  verifier(`le statut « ${s} » se lit`, parseCarteAnimal({ ...LION, statut_uicn: s }) !== null)
}

console.log('\nLE CATALOGUE')

{
  const lot = parseAnimaux(
    JSON.stringify({
      genere: '2026-01-01',
      groupe: 'mammifères',
      cartes: [LION, { id: 'X' }, LION],
    }),
  )
  egal(lot.length, 2, 'une ligne abîmée est sautée, les autres passent')
  egal(parseAnimaux('ceci n’est pas du JSON').length, 0, 'un fichier illisible rend une liste vide')
  egal(parseAnimaux(JSON.stringify([LION])).length, 1, 'un tableau nu se lit aussi')
}

console.log('\nLES RAYONS')

// LE PLUS GROS RAYON D'ABORD : *on cherche d'abord là où il y a le plus à
// trouver*, et ça met les rongeurs et les chauves-souris en tête — ce qui est
// la vérité du groupe, deux mammifères sur trois.
{
  const faire = (n: number, ordre_fr: string): unknown[] =>
    Array.from({ length: n }, (_, i) => ({ ...LION, id: `${ordre_fr}-${i}`, ordre_fr }))
  const cartes = parseAnimaux(
    JSON.stringify([...faire(2, 'Carnivores'), ...faire(5, 'Rongeurs'), ...faire(3, 'Primates')]),
  )
  const rayons = parOrdre(cartes)
  egal(rayons.size, 3, 'trois rayons')
  egal([...rayons.keys()].join(' > '), 'Rongeurs > Primates > Carnivores', 'le plus gros d’abord')
  egal(rayons.get('Rongeurs')?.length, 5, 'le rayon des rongeurs porte ses cinq cartes')
}

// LE GROUPE EST UN CHAMP, PAS UN FICHIER. C'est ce qui permettra d'ajouter les
// oiseaux sans changer de format — et pourquoi le fichier s'appelle
// `animals.json` et non `mammals.json`.
{
  const oiseau = parseCarteAnimal({
    ...LION,
    id: '212',
    groupe: 'oiseaux',
    nom_fr: 'Manchot empereur',
    nom_scientifique: 'Aptenodytes forsteri',
    ordre: 'Sphenisciformes',
    ordre_fr: 'Manchots',
    famille: 'Spheniscidae',
  })
  egal(oiseau?.groupe, 'oiseaux', 'un autre groupe se lit dans le même format')
}

console.log(`\n${echecs === 0 ? 'Tout passe.' : `${echecs} échec(s).`}`)
if (echecs > 0) throw new Error(`${echecs} vérification(s) en échec`)

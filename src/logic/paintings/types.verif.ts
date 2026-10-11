/**
 * Vérifications du format des cartes-peintures, sans navigateur.
 *
 * Ce qu'on vérifie ici n'est pas le contenu du catalogue — il se juge sur le
 * résumé que le pipeline imprime — ce sont les propriétés qui doivent tenir
 * quel que soit le pipeline : une ligne abîmée ne doit pas emporter les autres,
 * un cran inconnu doit être refusé, **le siècle doit être juste de part et
 * d'autre de l'an zéro**, et une carte doit pouvoir se ranger.
 */
import {
  parseCartePeinture,
  parsePeintures,
  parPeintre,
  parSiecle,
  parGenre,
  parMusee,
  siecleDe,
  siecleEnClair,
  RARETES_PEINTURE,
} from './types.ts'

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
const JOCONDE = {
  id: 'Q12418',
  nom: 'La Joconde',
  peintre: 'Léonard de Vinci',
  peintre_id: 'Q762',
  annee: 1503,
  siecle: 16,
  genre: 'portrait',
  musee: 'musée du Louvre',
  score: 1,
  rarete: 'legendaire',
  langues: 146,
  image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ec/Mona_Lisa.jpg/960px-Mona_Lisa.jpg',
  article_fr: 'La Joconde',
  vues: 47_789,
}

console.log('\nLA LECTURE D’UNE CARTE')

verifier('une carte complète se lit', parseCartePeinture(JOCONDE) !== null)
verifier('une carte sans id est rejetée', parseCartePeinture({ ...JOCONDE, id: '' }) === null)
verifier('une carte sans nom est rejetée', parseCartePeinture({ ...JOCONDE, nom: '' }) === null)
// PAS D'IMAGE, PAS DE CARTE : c'est la règle du mode, et le filtre du pipeline
// exige `P18`. *Une carte sans illustration sortirait avec le sceau de repli*,
// qui est là pour dire « il manque un fichier » — et ici il n'en manque pas,
// il n'y en a simplement aucun.
verifier('une carte sans image est rejetée', parseCartePeinture({ ...JOCONDE, image: '' }) === null)
verifier(
  'un cran de rareté inconnu est refusé',
  parseCartePeinture({ ...JOCONDE, rarete: 'mythique' }) === null,
)
verifier(
  'une année manquante est refusée',
  parseCartePeinture({ ...JOCONDE, annee: null }) === null,
)
verifier(
  'un nombre de langues manquant est refusé',
  parseCartePeinture({ ...JOCONDE, langues: 'beaucoup' }) === null,
)
verifier('les quatre crans sont acceptés', RARETES_PEINTURE.every((r) => parseCartePeinture({ ...JOCONDE, rarete: r }) !== null))

// LE PEINTRE, LE GENRE ET LE MUSÉE SONT FACULTATIFS, et il le faut : mesuré,
// 4 % des œuvres n'ont pas de créateur déclaré, 14 % pas de genre, 9 % pas de
// lieu. *Les refuser coûterait un cinquième du catalogue pour un champ qui
// n'est qu'un rayon.*
{
  const anonyme = parseCartePeinture({
    ...JOCONDE,
    peintre: null,
    peintre_id: null,
    genre: null,
    musee: null,
  })
  verifier('une œuvre sans peintre, genre ni musée se lit', anonyme !== null)
  egal(anonyme?.peintre, null, 'son peintre reste nul')
}

console.log('\nLE CATALOGUE')

verifier('un JSON cassé rend une liste vide', parsePeintures('{{{').length === 0)
verifier('une liste nue se lit', parsePeintures(JSON.stringify([JOCONDE])).length === 1)
verifier(
  'un objet à `cartes` se lit',
  parsePeintures(JSON.stringify({ genere: 'x', cartes: [JOCONDE] })).length === 1,
)
// UNE CARTE FAUSSE NE DOIT PAS EMPORTER LES AUTRES : le fichier est engendré,
// donc une ligne peut être tordue par un changement de pipeline.
egal(
  parsePeintures(JSON.stringify([JOCONDE, { nom: 'bancale' }, JOCONDE])).length,
  2,
  'une ligne abîmée est sautée, les autres passent',
)

console.log('\nLE SIÈCLE — et le passage de l’an zéro n’est pas évident')

egal(siecleDe(1503), 16, '1503 est au 16ᵉ')
egal(siecleDe(1500), 15, '1500 est au 15ᵉ, pas au 16ᵉ')
egal(siecleDe(1501), 16, '1501 ouvre le 16ᵉ')
egal(siecleDe(1), 1, 'l’an 1 est au 1ᵉʳ')
egal(siecleDe(100), 1, 'l’an 100 ferme le 1ᵉʳ')
// AVANT NOTRE ÈRE, LE SIÈCLE EST NÉGATIF : *c'est ce qui fait que l'ordre des
// siècles est celui du temps*, donc qu'un rayon trié par siècle se lit de
// l'antiquité à aujourd'hui sans cas particulier.
egal(siecleDe(-1), -1, '−1 est au 1ᵉʳ siècle avant notre ère')
egal(siecleDe(-50), -1, '−50 aussi')
// IL N'Y A PAS D'AN ZERO : le 1er siecle av. J.-C. va de −100 a −1, donc −100
// le FERME et −101 ouvre le 2e. *Ma premiere formule decalait tout d'un cran*,
// et c'est cette verification qui l'a attrapee.
egal(siecleDe(-100), -1, '−100 ferme le 1ᵉʳ siècle avant notre ère')
egal(siecleDe(-101), -2, '−101 ouvre le 2ᵉ')
verifier('les siècles négatifs précèdent les positifs', siecleDe(-50) < siecleDe(1))
egal(siecleEnClair(16), '16ᵉ siècle', 'le 16ᵉ se dit')
egal(siecleEnClair(1), '1ᵉʳ siècle', 'le premier prend son ordinal')
egal(siecleEnClair(-1), '1ᵉʳ siècle av. J.-C.', 'et l’antiquité le dit aussi')

console.log('\nLES RAYONS')

{
  const VAN_GOGH = {
    ...JOCONDE,
    id: 'Q45585',
    nom: 'La Nuit étoilée',
    peintre: 'Vincent van Gogh',
    peintre_id: 'Q5582',
    annee: 1889,
    siecle: 19,
    genre: 'paysage',
    musee: 'Museum of Modern Art',
    langues: 76,
  }
  const CHAMPS = {
    ...VAN_GOGH,
    id: 'Q1',
    nom: 'Champ de blé aux corbeaux',
    genre: 'paysage',
    langues: 12,
  }
  const SANS = { ...JOCONDE, id: 'Q2', nom: 'Anonyme', peintre: null, genre: null, musee: null }
  const cartes = parsePeintures(JSON.stringify([JOCONDE, VAN_GOGH, CHAMPS, SANS]))
  egal(cartes.length, 4, 'les quatre cartes se lisent')

  const peintres = parPeintre(cartes)
  egal(peintres.size, 2, 'deux peintres nommés font deux rayons')
  egal(peintres.get('Vincent van Gogh')?.length, 2, 'Van Gogh en porte deux')
  // UNE CARTE SANS CLÉ NE FAIT PAS UN RAYON « null » : *un rayon vide de sens
  // se lit comme un bug*, et le joueur n'a rien à y chercher.
  verifier('une œuvre sans peintre ne crée aucun rayon', !peintres.has('null'))
  // LE PLUS GROS RAYON D'ABORD : *on cherche d'abord là où il y a le plus à
  // trouver.*
  egal([...peintres.keys()][0], 'Vincent van Gogh', 'le plus gros rayon vient en tête')

  egal(parGenre(cartes).size, 2, 'deux genres nommés font deux rayons')
  egal(parMusee(cartes).size, 2, 'deux musées font deux rayons')

  // LES SIÈCLES SE RANGENT DANS L'ORDRE DU TEMPS, pas par taille de rayon.
  const siecles = [...parSiecle(cartes).keys()]
  egal(siecles.length, 2, 'deux siècles')
  egal(siecles[0], '16ᵉ siècle', 'le 16ᵉ précède le 19ᵉ')
  egal(siecles[1], '19ᵉ siècle', 'et le 19ᵉ suit')
}

console.log(`\n${echecs === 0 ? 'Tout passe.' : `${echecs} échec(s).`}`)
if (echecs > 0) throw new Error(`${echecs} vérification(s) en échec`)

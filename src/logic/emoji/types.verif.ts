/**
 * Vérifications du mode emoji, sans navigateur.
 *
 * Ce qu'on vérifie n'est pas l'équilibrage — il se juge sur `emoji-summary.txt`
 * — ce sont les propriétés qui doivent tenir quels que soient les réglages : la
 * lecture du JSON rejette ce qui est mal formé, les rayons se découpent chacun
 * pour soi, et les ex aequo partagent leur cran.
 */
import { parseEmoji, parseEmojis, GROUPES_EMOJI, RARETES_EMOJI, parGroupe, NOM_DU_GROUPE } from './types.ts'
import { cransParGroupe, PYRAMIDE_QUATRE } from '../quantiles.ts'

let echecs = 0
function verifier(quoi: string, vrai: boolean): void {
  if (!vrai) echecs += 1
  console.log(`  ${vrai ? 'ok  ' : 'ECHEC'}  ${quoi}`)
}

function egal(obtenu: unknown, attendu: unknown, quoi: string): void {
  verifier(`${quoi} (${String(obtenu)})`, obtenu === attendu)
}

console.log('')
console.log('LA LECTURE DU CATALOGUE')

// LE GABARIT REPREND TOUT LE TYPE, champ neuf compris : *un fixture incomplet
// teste une AUTRE chose que celle qu'on croit, et il passe.*
const bonne = {
  id: '1f600',
  emoji: '😀',
  nom: 'visage rieur',
  groupe: 'visages',
  mots: ['content', 'rire'],
  version: '1.0',
  annee: 2015,
  anime: true,
  frequence: 0,
  rang: 1,
  rarete: 'legendaire',
}

verifier('une carte complète se lit', parseEmoji(bonne) !== null)
verifier('un groupe inconnu est rejeté', parseEmoji({ ...bonne, groupe: 'vehicules' }) === null)
verifier('une rareté inconnue est rejetée', parseEmoji({ ...bonne, rarete: 'mythique' }) === null)
verifier('un emoji vide est rejeté', parseEmoji({ ...bonne, emoji: '' }) === null)
verifier('une année non numérique est rejetée', parseEmoji({ ...bonne, annee: '2015' }) === null)
verifier('un drapeau d’animation non booléen est rejeté', parseEmoji({ ...bonne, anime: 'oui' }) === null)
verifier('un rang absent est rejeté', parseEmoji({ ...bonne, rang: undefined }) === null)
// LA FREQUENCE EST FACULTATIVE : *24 % du catalogue n'est pas au classement
// d'Unicode* -- ce sont les emoji posterieurs a la version 12.0 -- et ils
// gardent leur carte. **Une absence de mesure n'est pas une carte en moins.**
egal(parseEmoji({ ...bonne, frequence: undefined })?.frequence, null, 'une fréquence absente vaut null')
egal(parseEmoji({ ...bonne, frequence: 7 })?.frequence, 7, 'une fréquence connue se lit')
// LES MOTS-CLES SONT FACULTATIFS : *un emoji sans nom francais n'en a pas*, et
// il garde quand meme sa carte avec son nom anglais.
verifier('des mots-clés absents ne rejettent pas la carte', parseEmoji({ ...bonne, mots: undefined })?.mots.length === 0)

verifier('un JSON cassé rend une liste vide', parseEmojis('{ pas du json').length === 0)
verifier('un JSON sans cartes rend une liste vide', parseEmojis('{"genere":"x"}').length === 0)
egal(
  parseEmojis(JSON.stringify({ cartes: [bonne, { ...bonne, groupe: 'faux' }] })).length,
  1,
  'une carte cassée est écartée, pas fatale',
)

console.log('')
console.log('LES RAYONS')

{
  const cartes = [
    { ...bonne, id: 'a', groupe: 'visages' as const },
    { ...bonne, id: 'b', groupe: 'drapeaux' as const },
    { ...bonne, id: 'c', groupe: 'visages' as const },
  ].map((c) => parseEmoji(c)!)
  const m = parGroupe(cartes)
  egal(m.get('visages')?.length, 2, 'deux visages dans leur rayon')
  egal(m.get('drapeaux')?.length, 1, 'un drapeau dans le sien')
  egal(m.get('animaux'), undefined, 'un rayon vide n’existe pas')
}

// LES NEUF GROUPES ONT UN NOM AFFICHABLE. *Une liste de cas est une liste qu'on
// oublie de completer*, et celle-ci se lit au pied de chaque carte.
for (const g of GROUPES_EMOJI) verifier(`« ${g} » a un nom affiché (${NOM_DU_GROUPE[g]})`, NOM_DU_GROUPE[g] !== undefined && NOM_DU_GROUPE[g] !== '')

console.log('')
console.log('LE DÉCOUPAGE PAR GROUPE')

// Un rayon de N éléments, du plus notoire au moins notoire.
const rayon = (groupe: string, n: number, depart = 1_000_000) =>
  Array.from({ length: n }, (_, i) => ({ groupe, valeur: depart - i }))

{
  const crans = new Set(cransParGroupe(rayon('visages', 200), PYRAMIDE_QUATRE))
  for (const r of RARETES_EMOJI) verifier(`le cran « ${r} » est atteignable`, crans.has(r))
}

// LA PYRAMIDE EST LA MEME DANS CHAQUE RAYON, et c'est la seule chose qu'un
// quantile par groupe garantit qu'un seuil global ne garantit pas. *Ici elle
// est indispensable* : les 270 drapeaux sont presque tous anciens, donc a
// seuil global ils rafleraient tout le haut de l'echelle.
{
  const elements = [...rayon('visages', 200, 9_000_000), ...rayon('drapeaux', 200, 900)]
  const crans = cransParGroupe(elements, PYRAMIDE_QUATRE)
  const part = (g: string, r: string) => {
    const idx = elements.map((e, i) => [e, i] as const).filter(([e]) => e.groupe === g)
    return idx.filter(([, i]) => crans[i] === r).length / idx.length
  }
  for (const r of RARETES_EMOJI)
    verifier(
      `« ${r} » pèse la même part chez les visages et les drapeaux (${(100 * part('visages', r)).toFixed(0)} %)`,
      Math.abs(part('visages', r) - part('drapeaux', r)) < 0.01,
    )
  egal(crans[elements.findIndex((e) => e.groupe === 'drapeaux')], 'legendaire', 'le premier du rayon faible est légendaire')
  egal(crans[elements.length - 1], 'commun', 'le dernier est commun')
}

// LES EX AEQUO PARTAGENT LEUR CRAN : *deux cartes de même notoriété ne peuvent
// pas valoir deux métaux différents.*
{
  const elements = Array.from({ length: 100 }, (_, i) => ({ groupe: 'objets', valeur: i < 50 ? 10 : 1 }))
  const crans = cransParGroupe(elements, PYRAMIDE_QUATRE)
  verifier('cinquante ex aequo ont tous le même cran', new Set(crans.slice(0, 50)).size === 1)
}

// UN RAYON N'INFLUENCE PAS UN AUTRE.
{
  const seul = cransParGroupe(rayon('objets', 100, 900), PYRAMIDE_QUATRE)
  const melange = cransParGroupe([...rayon('visages', 300, 9_000_000), ...rayon('objets', 100, 900)], PYRAMIDE_QUATRE)
  verifier(
    'les crans d’un rayon ne bougent pas quand un autre grandit',
    seul.every((r, i) => r === melange[300 + i]),
  )
}

// L'ORDRE DES CRANS RENDUS EST CELUI DES ENTREES. *Une fonction qui renverrait
// un autre ordre obligerait a reapparier, et c'est la qu'on se trompe.*
{
  const elements = [
    { groupe: 'a', valeur: 1 },
    { groupe: 'b', valeur: 100 },
    { groupe: 'a', valeur: 50 },
  ]
  const crans = cransParGroupe(elements, PYRAMIDE_QUATRE)
  egal(crans.length, 3, 'autant de crans que d’entrées')
  egal(crans[1], 'legendaire', 'le seul de son rayon est légendaire')
}

console.log('')
console.log(echecs === 0 ? 'Tout passe.' : `${echecs} echec(s).`)
if (echecs > 0) throw new Error(`${echecs} verification(s) en echec`)

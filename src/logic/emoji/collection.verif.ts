/**
 * Vérifications de la collection, sans navigateur : un paquet s'ajoute, un
 * doublon se compte, et ce qu'on relit du stockage ne peut rien casser.
 */
import {
  ajouterPaquet,
  collectionVide,
  lireCollection,
  nombreDeNouvelles,
  nombreDExemplaires,
  toutVu,
  carteVue,
} from './collection.ts'

let echecs = 0
function verifier(quoi: string, vrai: boolean): void {
  if (!vrai) echecs += 1
  console.log(`  ${vrai ? 'ok  ' : 'ECHEC'}  ${quoi}`)
}

console.log('collection')
const vide = collectionVide()
const sans = { holo: false, anime: false }
const un = ajouterPaquet(vide, ['1f600', '1f601', '1f600'], { '1f601': { holo: true, anime: false } }, 1000)
verifier('la collection de départ ne bouge pas', Object.keys(vide.cartes).length === 0)
verifier('deux emoji différents', Object.keys(un.cartes).length === 2)
verifier('le doublon se compte', un.cartes['1f600']?.n === 2)
verifier('le holo se compte', un.cartes['1f601']?.holo === 1)
verifier('trois exemplaires', nombreDExemplaires(un) === 3)
verifier('un paquet', un.paquets === 1)
verifier("l'ordre d'arrivée", un.cartes['1f600']?.ordre === 1 && un.cartes['1f601']?.ordre === 2)
verifier('deux nouvelles', nombreDeNouvelles(un) === 2)
const uneVue = carteVue(un, '1f600')
verifier('une carte ouverte en grand est vue', uneVue.cartes['1f600']?.nouvelle === false)
verifier('les autres restent nouvelles', uneVue.cartes['1f601']?.nouvelle === true)
verifier('une carte déjà vue ne change rien', carteVue(uneVue, '1f600') === uneVue)
const vu = toutVu(un)
verifier('tout vu', nombreDeNouvelles(vu) === 0)
const deux = ajouterPaquet(vu, ['1f600'], { '1f600': sans }, 2000)
verifier("un doublon simple n'est pas une nouvelle", nombreDeNouvelles(deux) === 0)
verifier('la date reste celle du premier', deux.cartes['1f600']?.premiere === 1000)
const trois = ajouterPaquet(deux, ['1f600'], { '1f600': { holo: true, anime: false } }, 3000)
verifier('un holo de plus est une nouvelle', nombreDeNouvelles(trois) === 1)

const relue = lireCollection(JSON.parse(JSON.stringify(trois)))
verifier('aller-retour JSON', JSON.stringify(relue) === JSON.stringify(trois))
verifier("n'importe quoi donne une collection vide", Object.keys(lireCollection('x').cartes).length === 0)
verifier('une autre version est ignorée', Object.keys(lireCollection({ version: 2, cartes: {} }).cartes).length === 0)
const abimee = lireCollection({
  version: 1,
  arrivees: 1,
  paquets: 1,
  cartes: {
    '1f600': { n: 1, holo: 0, anime: 0, premiere: 0, ordre: 1 },
    '1f601': { n: 0, holo: 0, anime: 0, premiere: 0, ordre: 2 },
    'pas un id': { n: 1, holo: 0, anime: 0, premiere: 0, ordre: 3 },
    '1f602': { n: 2, holo: 9, anime: 0, premiere: 0, ordre: 7 },
  },
})
verifier('une possession abîmée est écartée, pas les autres', Object.keys(abimee.cartes).join() === '1f600,1f602')
verifier('le holo ne dépasse pas le nombre', abimee.cartes['1f602']?.holo === 2)
verifier("le compteur d'arrivées rattrape le plus grand ordre", abimee.arrivees === 7)

console.log(echecs === 0 ? 'Tout passe.' : `${echecs} echec(s).`)
if (echecs > 0) throw new Error(`${echecs} verification(s) en echec`)

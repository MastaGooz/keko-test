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
  debloquer,
  detruire,
  exemplaireADetruire,
  nombreDeStickers,
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
const debloquee = debloquer(un, ['1f600', '1f603', '1f604'], 5000)
verifier('débloquer ajoute ce qui manque', Object.keys(debloquee.cartes).length === 4)
verifier('débloquer ne touche pas ce qu’on a', debloquee.cartes['1f600']?.n === 2)
verifier('débloquer ne fait pas de nouvelles', debloquee.cartes['1f603']?.nouvelle === false)
verifier('débloquer ne compte pas de paquet', debloquee.paquets === un.paquets)
const vu = toutVu(un)
verifier('tout vu', nombreDeNouvelles(vu) === 0)
const deux = ajouterPaquet(vu, ['1f600'], { '1f600': sans }, 2000)
verifier("un doublon simple n'est pas une nouvelle", nombreDeNouvelles(deux) === 0)
verifier('la date reste celle du premier', deux.cartes['1f600']?.premiere === 1000)
const trois = ajouterPaquet(deux, ['1f600'], { '1f600': { holo: true, anime: false } }, 3000)
verifier('un holo de plus est une nouvelle', nombreDeNouvelles(trois) === 1)

// LA DESTRUCTION : un exemplaire part, son sticker arrive.
const simple = exemplaireADetruire(trois.cartes['1f600']!)
verifier('on détruit le simple avant le holo', !simple.holo && !simple.anime)
const d1 = detruire(trois, '1f600', simple, 4000)
verifier('un exemplaire de moins', d1.cartes['1f600']?.n === trois.cartes['1f600']!.n - 1)
verifier('le holo reste', d1.cartes['1f600']?.holo === 1)
verifier('un sticker gagné', d1.stickers['1f600']?.n === 1 && d1.stickers['1f600']?.holo === 0)
const d2 = detruire(d1, '1f601', { holo: true, anime: false }, 5000)
verifier('la dernière carte quitte la collection', d2.cartes['1f601'] === undefined)
verifier('son sticker est holo', d2.stickers['1f601']?.holo === 1)
verifier('deux stickers', nombreDeStickers(d2) === 2)
verifier('détruire ce qu’on n’a pas ne change rien', detruire(d2, '1f601', simple, 6000) === d2)
const d3 = detruire(d2, '1f600', { holo: false, anime: true }, 6000)
verifier('un animé qu’on n’avait pas ne fait pas un sticker animé', d3.stickers['1f600']?.anime === 0)
verifier('un paquet après garde l’album', ajouterPaquet(d3, ['1f601'], {}, 7000).stickers['1f601']?.n === 1)
const relueAlbum = lireCollection(JSON.parse(JSON.stringify(d3)))
verifier('l’album fait l’aller-retour JSON', JSON.stringify(relueAlbum) === JSON.stringify(d3))
verifier('une collection d’avant l’album se relit', Object.keys(lireCollection({ version: 1, cartes: {} }).stickers).length === 0)

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

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
  debloquerStickers,
  retirer,
  detruire,
  exemplaireADetruire,
  nombreDeStickers,
  nombreDeStickersNouveaux,
  stickersVus,
  compteDe,
  avecLikes,
  ajouterLikes,
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
const albumPlein = debloquerStickers(debloquerStickers(un, ['1f600', '1f603'], 5000), ['1f600', '1f603'], 6000)
verifier('les stickers débloqués ne doublent pas', nombreDeStickers(albumPlein) === nombreDeStickers(un) + 2 - (un.stickers['1f600'] ? 1 : 0) - (un.stickers['1f603'] ? 1 : 0))
verifier('débloquer ajoute ce qui manque', Object.keys(debloquee.cartes).length === 4)
verifier('débloquer ne touche pas ce qu’on a', debloquee.cartes['1f600']?.n === 2)
verifier('débloquer ne fait pas de nouvelles', debloquee.cartes['1f603']?.nouvelle === false)
verifier('débloquer ne compte pas de paquet', debloquee.paquets === un.paquets)
const retiree = retirer(debloquee, ['1f603', '1f604', 'absent'])
verifier('retirer enlève les emoji nommés, et ignore un absent', Object.keys(retiree.cartes).length === 2 && retiree.cartes['1f603'] === undefined)
verifier('retirer ne touche pas le reste', retiree.cartes['1f600']?.n === 2 && retiree.paquets === debloquee.paquets && retiree.arrivees === debloquee.arrivees)
verifier('retirer ne touche pas les stickers', Object.keys(retiree.stickers).length === Object.keys(debloquee.stickers).length)
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
verifier('un sticker gagné est nouveau', d1.stickers['1f600']?.nouveau === true && nombreDeStickersNouveaux(d1) === 1)
const albumVu = stickersVus(d1)
verifier('l’album vu éteint la pastille', nombreDeStickersNouveaux(albumVu) === 0 && albumVu.stickers['1f600']?.n === 1)
verifier('l’album déjà vu ne change pas', stickersVus(albumVu) === albumVu)
verifier('un doublon de sticker redevient nouveau', detruire(albumVu, '1f600', simple, 4500).stickers['1f600']?.nouveau === true)
verifier('un sticker débloqué n’est pas nouveau', debloquerStickers(albumVu, ['1f603'], 5000).stickers['1f603']?.nouveau === false)
verifier('un album d’avant relit ses stickers sans nouveau', lireCollection({ version: 1, cartes: {}, stickers: { '1f600': { n: 1, holo: 0, anime: 0, dernier: 1 } } }).stickers['1f600']?.nouveau === false)
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

// LES QUATRE VERSIONS : un holo animé se compte à part.
const quatre = ajouterPaquet(collectionVide(), ['1f60a', '1f60a', '1f60a'], { '1f60a': { holo: true, anime: true } }, 1)
const p4 = quatre.cartes['1f60a']!
verifier('trois holo animés', compteDe(p4, 'holoAnime') === 3 && compteDe(p4, 'holo') === 0 && compteDe(p4, 'simple') === 0)
const melange = ajouterPaquet(ajouterPaquet(collectionVide(), ['1f60b'], { '1f60b': { holo: true, anime: false } }, 1), ['1f60b', '1f60b'], { '1f60b': sans }, 2)
const pm = melange.cartes['1f60b']!
verifier('un holo et deux simples', compteDe(pm, 'holo') === 1 && compteDe(pm, 'simple') === 2)
const moinsHA = detruire(quatre, '1f60a', { holo: true, anime: true }, 3)
verifier('détruire un holo animé', compteDe(moinsHA.cartes['1f60a']!, 'holoAnime') === 2)
// L'ALBUM AUSSI A SES QUATRE VERSIONS.
verifier('son sticker est holo animé', moinsHA.stickers['1f60a']?.ha === 1 && compteDe(moinsHA.stickers['1f60a']!, 'holoAnime') === 1 && compteDe(moinsHA.stickers['1f60a']!, 'holo') === 0)
const moinsHolo = detruire(detruire(melange, '1f60b', { holo: true, anime: false }, 4), '1f60b', sans, 5)
verifier('un sticker holo et un simple', compteDe(moinsHolo.stickers['1f60b']!, 'holo') === 1 && compteDe(moinsHolo.stickers['1f60b']!, 'simple') === 1 && moinsHolo.stickers['1f60b']?.ha === 0)
verifier('un album d’avant déduit le holo animé imposé', lireCollection({ version: 1, cartes: {}, stickers: { '1f600': { n: 1, holo: 1, anime: 1, dernier: 1 } } }).stickers['1f600']?.ha === 1)
verifier('un album d’avant sans contrainte lit zéro', lireCollection({ version: 1, cartes: {}, stickers: { '1f600': { n: 2, holo: 1, anime: 1, dernier: 1 } } }).stickers['1f600']?.ha === 0)
const ancienne = lireCollection({ version: 1, cartes: { '1f600': { n: 2, holo: 2, anime: 1, premiere: 0, ordre: 1 } } })
verifier('une collection d’avant déduit le holo animé imposé', ancienne.cartes['1f600']?.ha === 1)

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

console.log('likes')
verifier('une collection neuve a zéro Like', vide.likes === 0)
const riche = ajouterLikes(vide, 12)
verifier('ajouter des Likes', riche.likes === 12)
verifier('ajouter zéro rend la même collection', ajouterLikes(riche, 0) === riche)
verifier('retirer ne descend pas sous zéro', ajouterLikes(riche, -20).likes === 0)
verifier('poser un solde', avecLikes(riche, 3).likes === 3 && avecLikes(riche, -1).likes === 0 && avecLikes(riche, 2.7).likes === 2)
verifier('un paquet garde les Likes', ajouterPaquet(riche, ['1f600'], {}, 9000).likes === 12)
verifier('détruire garde les Likes', detruire(ajouterPaquet(riche, ['1f600'], {}, 9000), '1f600', exemplaireADetruire(ajouterPaquet(riche, ['1f600'], {}, 9000).cartes['1f600']!), 9100).likes === 12)
verifier('une collection d’avant relit zéro Like', lireCollection({ version: 1, cartes: {} }).likes === 0)
verifier('un solde gardé se relit', lireCollection({ version: 1, cartes: {}, likes: 40 }).likes === 40)
verifier('un solde abîmé retombe à zéro', lireCollection({ version: 1, cartes: {}, likes: -5 }).likes === 0 && lireCollection({ version: 1, cartes: {}, likes: 'x' }).likes === 0)
if (echecs > 0) throw new Error(`${echecs} verification(s) en echec`)

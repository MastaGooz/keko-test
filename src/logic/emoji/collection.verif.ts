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
  retirer,
  oublier,
  compteDe,
  avecLikes,
  ajouterLikes,
  fusionner,
  fusionnerTout,
  fusionnables,
  exemplaireAFusionner,
  aFusionnerPour,
  niveauDe,
  NIVEAUX,
  type Collection,
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
verifier('débloquer ne fait pas de nouvelles', debloquee.cartes['1f603']?.nouvelles.length === 0)
verifier('débloquer ne compte pas de paquet', debloquee.paquets === un.paquets)
const retiree = retirer(debloquee, ['1f603', '1f604', 'absent'])
verifier('retirer enlève les emoji nommés, et ignore un absent', Object.keys(retiree.cartes).length === 2 && retiree.cartes['1f603'] === undefined)
verifier('retirer ne touche pas le reste', retiree.cartes['1f600']?.n === 2 && retiree.paquets === debloquee.paquets && retiree.arrivees === debloquee.arrivees)
const oubliee = oublier(debloquee, '1f603')
verifier('oublier enlève les cartes et le niveau de l’emoji', oubliee.cartes['1f603'] === undefined && oublier({ ...debloquee, niveaux: { '1f603': 3 } }, '1f603').niveaux['1f603'] === undefined && Object.keys(oubliee.cartes).length === Object.keys(debloquee.cartes).length - 1)
verifier('oublier ne touche pas le reste', oubliee.cartes['1f600']?.n === 2 && oubliee.paquets === debloquee.paquets && oubliee.likes === debloquee.likes)
verifier('oublier un absent ne change rien', oublier(debloquee, 'absent') === debloquee)

const vu = toutVu(un)
verifier('tout vu', nombreDeNouvelles(vu) === 0)
const deux = ajouterPaquet(vu, ['1f600'], { '1f600': sans }, 2000)
verifier("un doublon simple n'est pas une nouvelle", nombreDeNouvelles(deux) === 0)
verifier('la date reste celle du premier', deux.cartes['1f600']?.premiere === 1000)
const trois = ajouterPaquet(deux, ['1f600'], { '1f600': { holo: true, anime: false } }, 3000)
verifier('un holo de plus est une nouvelle', nombreDeNouvelles(trois) === 1)
verifier('et seule la version holo est nouvelle', trois.cartes['1f600']?.nouvelles.length === 1 && trois.cartes['1f600']?.nouvelles[0] === 'holo')
const secondHolo = ajouterPaquet(trois, ['1f600'], { '1f600': { holo: true, anime: false } }, 3500)
verifier("un second holo n'est pas une nouvelle", nombreDeNouvelles(secondHolo) === 1)
verifier('une collection d’avant relit toutes ses versions nouvelles', nombreDeNouvelles(lireCollection({ version: 1, cartes: { '1f600': { n: 2, holo: 1, anime: 0, premiere: 1, ordre: 1, nouvelle: true } } })) === 2)
verifier('une version nouvelle qu’on n’a pas est écartée à la relecture', lireCollection({ version: 1, cartes: { '1f600': { n: 1, holo: 0, anime: 0, premiere: 1, ordre: 1, nouvelles: ['holo', 'simple'] } } }).cartes['1f600']?.nouvelles.join() === 'simple')
// LES QUATRE VERSIONS : un holo animé se compte à part.
const quatre = ajouterPaquet(collectionVide(), ['1f60a', '1f60a', '1f60a'], { '1f60a': { holo: true, anime: true } }, 1)
const p4 = quatre.cartes['1f60a']!
verifier('trois holo animés', compteDe(p4, 'holoAnime') === 3 && compteDe(p4, 'holo') === 0 && compteDe(p4, 'simple') === 0)
const melange = ajouterPaquet(ajouterPaquet(collectionVide(), ['1f60b'], { '1f60b': { holo: true, anime: false } }, 1), ['1f60b', '1f60b'], { '1f60b': sans }, 2)
const pm = melange.cartes['1f60b']!
verifier('un holo et deux simples', compteDe(pm, 'holo') === 1 && compteDe(pm, 'simple') === 2)
// LA FUSION (Keko : « pour passer niveau 2 il faut deux exemplaires, et niveau 5 il en faut 5 »)
verifier('il faut le niveau suivant en exemplaires, rien au dernier', aFusionnerPour(1) === 2 && aFusionnerPour(4) === 5 && aFusionnerPour(NIVEAUX.max) === null)
verifier('sans rien fusionné, niveau 1', niveauDe(melange, '1f60b') === 1)
verifier('le simple part avant le holo', !exemplaireAFusionner(pm).holo)
const f2 = fusionner(melange, '1f60b')
verifier('deux exemplaires fusionnent en un, au niveau 2', niveauDe(f2, '1f60b') === 2 && f2.cartes['1f60b']?.n === 2)
verifier('pas assez d’exemplaires, rien ne bouge', fusionner(f2, '1f60b') === f2 && fusionner(melange, 'absent') === melange)
const f3 = fusionner({ ...melange, niveaux: { '1f60b': 2 } }, '1f60b')
verifier('trois pour le niveau 3, la meilleure reste', niveauDe(f3, '1f60b') === 3 && f3.cartes['1f60b']?.n === 1 && compteDe(f3.cartes['1f60b']!, 'holo') === 1)
let auMax: Collection = { ...collectionVide(), cartes: { a: { n: 40, holo: 0, anime: 0, ha: 0, premiere: 0, ordre: 1, nouvelles: [] } } }
for (let i = 0; i < 10; i++) auMax = fusionner(auMax, 'a')
verifier('cinq niveaux au plus, dix doublons en tout', niveauDe(auMax, 'a') === NIVEAUX.max && auMax.cartes.a?.n === 40 - 10)
verifier('le holo animé reste le dernier', compteDe(fusionner(quatre, '1f60a').cartes['1f60a']!, 'holoAnime') === 2)
const tout = fusionnerTout({ ...collectionVide(), cartes: { a: { n: 6, holo: 0, anime: 0, ha: 0, premiere: 0, ordre: 1, nouvelles: [] }, b: { n: 1, holo: 0, anime: 0, ha: 0, premiere: 0, ordre: 2, nouvelles: [] } } })
verifier('tout fusionner : six exemplaires montent au niveau 3, le seul ne bouge pas', niveauDe(tout, 'a') === 3 && tout.cartes.a?.n === 3 && niveauDe(tout, 'b') === 1 && tout.cartes.b?.n === 1)
verifier('ce qui peut fusionner', fusionnables(melange).join() === '1f60b' && fusionnables(tout).length === 0 && fusionnerTout(tout) === tout)
verifier('le niveau se relit', niveauDe(lireCollection(JSON.parse(JSON.stringify(auMax))), 'a') === NIVEAUX.max)
verifier('un niveau abîmé est borné', niveauDe(lireCollection({ version: 1, cartes: {}, niveaux: { a: 99 } }), 'a') === NIVEAUX.max)
verifier('un niveau du temps de l’album se relit', niveauDe(lireCollection({ version: 1, cartes: {}, niveaux: { a: { niveau: 3, poses: 2 } } }), 'a') === 3)
verifier('une collection d’avant relit le niveau 1', niveauDe(lireCollection({ version: 1, cartes: {} }), 'a') === 1)
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
verifier('une collection d’avant relit zéro Like', lireCollection({ version: 1, cartes: {} }).likes === 0)
verifier('un solde gardé se relit', lireCollection({ version: 1, cartes: {}, likes: 40 }).likes === 40)
verifier('un solde abîmé retombe à zéro', lireCollection({ version: 1, cartes: {}, likes: -5 }).likes === 0 && lireCollection({ version: 1, cartes: {}, likes: 'x' }).likes === 0)

if (echecs > 0) throw new Error(`${echecs} verification(s) en echec`)

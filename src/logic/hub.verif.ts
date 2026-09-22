/**
 * Vérifications de l'armurerie, sans navigateur.
 *
 * Ce qu'on vérifie ici, ce sont les règles qui rendent le chargement lisible :
 * un slot n'accepte pas n'importe quoi, un échange ne fait rien disparaître, et
 * mourir ne peut pas bloquer le jeu.
 */
import type { Arme, Armure } from './armes.ts'
import { ARME_GRATUITE, ARMURE_GRATUITE, CONSOMMABLE_GRATUIT, ESPADON as ESPADON_REEL, deckDeLEquipement } from './armes.ts'
import {
  creerHub,
  deplacerPiece,
  deuxMains,
  equipement,
  peutDescendre,
  perdreLEquipement,
  rentrer,
} from './hub.ts'

let echecs = 0
function verifier(quoi: string, vrai: boolean): void {
  if (!vrai) echecs += 1
  console.log(`  ${vrai ? 'ok  ' : 'ECHEC'}  ${quoi}`)
}

const ESPADON: Arme = {
  id: 'espadon',
  nom: 'Espadon',
  rarete: 'rare',
  mains: 2,
  set: [{ modele: { nom: 'Fendre', type: 'combat', cout: 3, degats: 12 }, nombre: 6 }],
}

const DAGUE: Arme = {
  id: 'dague',
  nom: 'Dague',
  rarete: 'commune',
  mains: 1,
  set: [{ modele: { nom: 'Percer', type: 'combat', cout: 1, degats: 4 }, nombre: 6 }],
}

const COTTE: Armure = {
  id: 'cotte',
  nom: 'Cotte',
  rarete: 'commune',
  set: [{ modele: { nom: 'Parer', type: 'combat', cout: 1, degats: 0 }, nombre: 4 }],
}

// --- l'etat de depart -------------------------------------------------------

{
  const h = creerHub()
  verifier("on arrive avec l'equipement gratuit DEJA equipe",
    h.chargement.mains[0] === ARME_GRATUITE && h.chargement.armure === ARMURE_GRATUITE)
  verifier('on peut donc descendre sans rien toucher', peutDescendre(h.chargement))
  // Trois cartes d'arme, six d'armure : le format des douze (6 + 6), une
  // arme a une main en donnant trois.
  verifier('et le deck en decoule', deckDeLEquipement(equipement(h.chargement)).length === 12)
  verifier('les fioles sont dans le chargement de depart', h.chargement.consommable === CONSOMMABLE_GRATUIT)
  // En attendant un marché, l'Espadon attend au râtelier : sans lui il n'y
  // aurait rien à choisir.
  verifier('le ratelier tient l’Espadon au depart, et rien d’autre', h.reserve.length === 1 && h.reserve[0] === ESPADON_REEL)
}

// --- ce qu'un slot accepte --------------------------------------------------

{
  const h = { ...creerHub(), reserve: [COTTE, DAGUE] }

  verifier('une armure ne tient pas en main',
    deplacerPiece(h, { ou: 'reserve' }, { ou: 'main', rang: 1 }, COTTE.id) === h)
  verifier('une arme ne tient pas sur le torse',
    deplacerPiece(h, { ou: 'reserve' }, { ou: 'armure' }, DAGUE.id) === h)
  verifier("un identifiant inconnu ne deplace rien",
    deplacerPiece(h, { ou: 'reserve' }, { ou: 'main', rang: 1 }, 'aucune') === h)

  const seconde = deplacerPiece(h, { ou: 'reserve' }, { ou: 'main', rang: 1 }, DAGUE.id)
  verifier('une arme a une main va dans le second slot',
    seconde.chargement.mains[1] === DAGUE && seconde.reserve.length === 1)
  verifier('et elle donne ses cartes', deckDeLEquipement(equipement(seconde.chargement)).length === 12 + 6)
}

// --- l'echange ne fait rien disparaitre -------------------------------------

{
  const h = { ...creerHub(), reserve: [DAGUE] }
  const echange = deplacerPiece(h, { ou: 'reserve' }, { ou: 'main', rang: 0 }, DAGUE.id)
  verifier('poser sur un slot occupe echange',
    echange.chargement.mains[0] === DAGUE && echange.reserve.includes(ARME_GRATUITE))
  verifier('rien ne se perd dans l echange',
    echange.reserve.length + equipement(echange.chargement).length ===
      h.reserve.length + equipement(h.chargement).length)

  const retire = deplacerPiece(echange, { ou: 'main', rang: 0 }, { ou: 'reserve' })
  verifier('on peut vider un slot vers la reserve',
    retire.chargement.mains[0] === null && retire.reserve.length === 2)
  verifier('un slot vide ne donne rien a deplacer',
    deplacerPiece(retire, { ou: 'main', rang: 0 }, { ou: 'reserve' }) === retire)
}

// --- l'arme a deux mains ----------------------------------------------------

{
  const h = { ...creerHub(), reserve: [ESPADON, DAGUE] }
  const avecDague = deplacerPiece(h, { ou: 'reserve' }, { ou: 'main', rang: 1 }, DAGUE.id)
  // Deux armes, l'armure, les fioles : quatre pieces.
  verifier('on tient deux armes a une main', equipement(avecDague.chargement).length === 4)

  // UNE ARME A DEUX MAINS CHASSE CE QUI TENAIT L'AUTRE SLOT, et tout de suite :
  // un slot qui reste rempli mais inutilisable mentirait sur ce qu'on emporte.
  const lourd = deplacerPiece(avecDague, { ou: 'reserve' }, { ou: 'main', rang: 0 }, ESPADON.id)
  verifier("l'espadon prend le premier slot", lourd.chargement.mains[0] === ESPADON)
  verifier('et il vide le second', lourd.chargement.mains[1] === null)
  verifier('la dague chassee retourne a la reserve', lourd.reserve.includes(DAGUE))
  verifier('deux mains se lit sur le chargement', deuxMains(lourd.chargement))
  verifier("et rien ne s'est perdu",
    lourd.reserve.length + equipement(lourd.chargement).length ===
      avecDague.reserve.length + equipement(avecDague.chargement).length)

  // POSEE SUR LE SECOND SLOT, elle prend quand meme les deux : elle vit dans
  // le premier, et ce qui s'y trouvait est chasse.
  const parLaDroite = deplacerPiece(avecDague, { ou: 'reserve' }, { ou: 'main', rang: 1 }, ESPADON.id)
  verifier('posee sur le second slot, elle prend le premier', parLaDroite.chargement.mains[0] === ESPADON)
  verifier('et le second est vide', parLaDroite.chargement.mains[1] === null)
  verifier('ce qui tenait le premier est chasse au ratelier', parLaDroite.reserve.includes(ARME_GRATUITE))
  verifier('et la dague delogee y retourne aussi', parLaDroite.reserve.includes(DAGUE))
  verifier("rien ne s'est perdu par la droite",
    parLaDroite.reserve.length + equipement(parLaDroite.chargement).length ===
      avecDague.reserve.length + equipement(avecDague.chargement).length)
}

// --- rentrer, et mourir -----------------------------------------------------

{
  const h = creerHub()
  verifier("l'or rapporte s'ajoute", rentrer(rentrer(h, 240), 120).or === 360)

  // LE GARDE-FOU CONTRE LA SPIRALE : mourir avec son seul equipement ne peut
  // pas bloquer le jeu. Il y a toujours de quoi repartir au ratelier.
  const nu = { ...h, chargement: { mains: [null, null] as [null, null], armure: null, consommable: null } }
  verifier('un chargement vide ne descend pas', !peutDescendre(nu.chargement))
  const apresMort = perdreLEquipement(nu)
  verifier('apres la mort on retrouve de quoi repartir', peutDescendre(apresMort.chargement))
  verifier('une arme ET une armure, les deux gratuites',
    apresMort.chargement.mains[0] === ARME_GRATUITE &&
      apresMort.chargement.armure === ARMURE_GRATUITE)

  // Parti SANS le Plastron (laissé au râtelier), mort : il ne doit exister
  // qu'une fois, au chargement, pas une au râtelier et une au chargement.
  const sansPlastron = {
    ...h,
    reserve: [...h.reserve, ARMURE_GRATUITE],
    chargement: { mains: [ARME_GRATUITE, null] as [Arme, null], armure: null, consommable: null },
  }
  const revenu = perdreLEquipement(sansPlastron)
  const exemplaires =
    revenu.reserve.filter((p) => p.id === ARMURE_GRATUITE.id).length +
    (revenu.chargement.armure?.id === ARMURE_GRATUITE.id ? 1 : 0)
  verifier('mort sans le Plastron : il n’est pas dédoublé', exemplaires === 1)
  verifier('...et il est au chargement, pas au râtelier',
    revenu.chargement.armure === ARMURE_GRATUITE && !revenu.reserve.includes(ARMURE_GRATUITE))

  // Le slot du consommable ne prend qu'un consommable, et rien d'autre ne le prend.
  const auRatelier = deplacerPiece(h, { ou: 'consommable' }, { ou: 'reserve' })
  verifier('on peut poser les fioles au ratelier', auRatelier.chargement.consommable === null && auRatelier.reserve.includes(CONSOMMABLE_GRATUIT))
  const fiolesEnMain = deplacerPiece(auRatelier, { ou: 'reserve' }, { ou: 'main', rang: 1 }, CONSOMMABLE_GRATUIT.id)
  verifier('les fioles ne tiennent pas en main', fiolesEnMain === auRatelier)
  const fiolesAuTorse = deplacerPiece(auRatelier, { ou: 'reserve' }, { ou: 'armure' }, CONSOMMABLE_GRATUIT.id)
  verifier('ni au torse', fiolesAuTorse === auRatelier)
  const glaiveEnFiole = deplacerPiece(auRatelier, { ou: 'main', rang: 0 }, { ou: 'consommable' })
  verifier('et une arme ne se boit pas', glaiveEnFiole === auRatelier)
  const retour = deplacerPiece(auRatelier, { ou: 'reserve' }, { ou: 'consommable' }, CONSOMMABLE_GRATUIT.id)
  verifier('les fioles reviennent dans leur slot', retour.chargement.consommable === CONSOMMABLE_GRATUIT)
}

if (echecs > 0) throw new Error(`${echecs} vérification(s) en échec`)
console.log('Tout passe.')

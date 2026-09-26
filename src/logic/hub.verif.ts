/**
 * Vérifications de l'armurerie, sans navigateur.
 *
 * Ce qu'on vérifie ici, ce sont les règles qui rendent le chargement lisible :
 * un slot n'accepte pas n'importe quoi, un échange ne fait rien disparaître, et
 * mourir ne peut pas bloquer le jeu.
 */
import type { Arme, Armure } from './armes.ts'
import { ARME_GRATUITE, ARMURE_GRATUITE, ESPADON as ESPADON_REEL, POTIONS_DEPART, deckDeLEquipement } from './armes.ts'
import {
  CAPACITE_PILE,
  accepteDepuis,
  creerHub,
  deckEmporte,
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
  // Trois cartes d'arme, six d'armure : le format des douze moins l'arme qui
  // manque. La potion s'y ajoute par la pile, qui n'est pas une piece.
  verifier('et le deck en decoule', deckDeLEquipement(equipement(h.chargement)).length === 9)
  verifier('une potion est deja sur la pile', h.chargement.pile.length === 1)
  verifier('elle ajoute sa carte au deck emporte', deckEmporte(h.chargement).length === 10)
  // En attendant un marché, l'Espadon attend au râtelier avec les potions
  // qu'on n'a pas prises : sans lui il n'y aurait rien à choisir.
  verifier('le ratelier tient l’Espadon au depart', h.reserve.includes(ESPADON_REEL))
  verifier('et les quatre autres potions', h.reserve.length === 5)
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
  // Neuf cartes de pieces (Glaive 3 + Plastron 6), plus les six de la Dague.
  verifier('et elle donne ses cartes', deckDeLEquipement(equipement(seconde.chargement)).length === 9 + 6)
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
  // Deux armes et l'armure : la pile n'est pas une piece, elle ne compte pas ici.
  verifier('on tient deux armes a une main', equipement(avecDague.chargement).length === 3)

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
  verifier("l'or rapporte s'ajoute", rentrer(rentrer(h, 240, h.chargement.pile), 120, h.chargement.pile).or === 360)

  // LE GARDE-FOU CONTRE LA SPIRALE : mourir avec son seul equipement ne peut
  // pas bloquer le jeu. Il y a toujours de quoi repartir au ratelier.
  const nu = { ...h, chargement: { mains: [null, null] as [null, null], armure: null, pile: [] } }
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
    chargement: { mains: [ARME_GRATUITE, null] as [Arme, null], armure: null, pile: [] },
  }
  const revenu = perdreLEquipement(sansPlastron)
  const exemplaires =
    revenu.reserve.filter((p) => p.id === ARMURE_GRATUITE.id).length +
    (revenu.chargement.armure?.id === ARMURE_GRATUITE.id ? 1 : 0)
  verifier('mort sans le Plastron : il n’est pas dédoublé', exemplaires === 1)
  verifier('...et il est au chargement, pas au râtelier',
    revenu.chargement.armure === ARMURE_GRATUITE && !revenu.reserve.includes(ARMURE_GRATUITE))

  // LA PILE EST PERDUE A LA MORT, ET RIEN NE LA REMPLACE : le garde-fou ne
  // couvre que de quoi frapper et encaisser. Ce qui restait au ratelier, lui,
  // n'est pas touche -- on ne perd que ce qu'on emportait.
  const mortAvecPile = perdreLEquipement({ ...h, chargement: { ...h.chargement, pile: POTIONS_DEPART.slice(0, 2) } })
  verifier('mourir vide la pile', mortAvecPile.chargement.pile.length === 0)
  verifier('mais le ratelier garde ses potions', mortAvecPile.reserve.length === h.reserve.length)
}

// --- la pile des consommables -----------------------------------------------

{
  const h = creerHub()
  const [p1, p2, p3] = POTIONS_DEPART

  // ELLE EN PREND PLUSIEURS, et le meme modele plusieurs fois : c'est toute la
  // difference avec un slot. Mais PAS PLUS DE TROIS -- sans plafond, on y met
  // tout ce qu'on possede et la question ne se pose plus.
  const deux = deplacerPiece(h, { ou: 'reserve' }, { ou: 'pile' }, p2!.id)
  const trois = deplacerPiece(deux, { ou: 'reserve' }, { ou: 'pile' }, p3!.id)
  verifier('on empile plusieurs exemplaires du meme modele', trois.chargement.pile.length === 3)
  verifier('et le deck grossit d’autant', deckEmporte(trois.chargement).length === 12)
  verifier('rien ne s’est perdu en chemin', trois.reserve.length + trois.chargement.pile.length === h.reserve.length + 1)

  // ON EN REPREND UNE PRECISE : la pile se prend par identifiant, sinon on ne
  // saurait pas laquelle des trois on retire.
  const moins = deplacerPiece(trois, { ou: 'pile' }, { ou: 'reserve' }, p2!.id)
  verifier('on retire un exemplaire precis', moins.chargement.pile.length === 2)
  verifier('...et c’est bien celui-la', !moins.chargement.pile.some((c) => c.id === p2!.id))
  verifier('il repart au ratelier', moins.reserve.some((o) => o.id === p2!.id))

  // La pile ne prend QUE des consommables, et un consommable ne va nulle part
  // ailleurs.
  verifier('une arme ne se boit pas', deplacerPiece(h, { ou: 'main', rang: 0 }, { ou: 'pile' }) === h)
  verifier('une potion ne tient pas en main', deplacerPiece(h, { ou: 'reserve' }, { ou: 'main', rang: 1 }, p1!.id) === h)
  verifier('ni au torse', deplacerPiece(h, { ou: 'reserve' }, { ou: 'armure' }, p1!.id) === h)

  // LE PLAFOND : la quatrieme potion reste au ratelier.
  const pleine = deplacerPiece(deplacerPiece(trois, { ou: 'reserve' }, { ou: 'pile' }, POTIONS_DEPART[3]!.id), { ou: 'reserve' }, { ou: 'pile' }, POTIONS_DEPART[4]!.id)
  verifier('la pile plafonne a CAPACITE_PILE', pleine.chargement.pile.length === CAPACITE_PILE)
  verifier('la quatrieme reste au ratelier', pleine.reserve.some((o) => o.id === POTIONS_DEPART[3]!.id))
  verifier('et le depot de trop ne change rien d’autre',
    deplacerPiece(pleine, { ou: 'reserve' }, { ou: 'pile' }, POTIONS_DEPART[4]!.id) === pleine)

  // MAIS ON PEUT REPOSER SUR UNE PILE PLEINE CE QU'ON VIENT D'EN SORTIR : la
  // destination se juge apres la prise, sinon la carte se refusait elle-meme.
  const repose = deplacerPiece(pleine, { ou: 'pile' }, { ou: 'pile' }, pleine.chargement.pile[0]!.id)
  verifier('une potion se repose sur sa propre pile pleine', repose.chargement.pile.length === CAPACITE_PILE)

  // CE QUE LE RENDU DEMANDE AUX RÈGLES : ce depot aboutirait-il ? C'est ce
  // qui fait grandir la piece tenue au-dessus d'un slot qui la prend, donc il
  // doit dire exactement ce que `deplacerPiece` fera.
  verifier('une potion est acceptee par la pile',
    accepteDepuis(h, { ou: 'reserve' }, { ou: 'pile' }, p2!.id))
  verifier('...mais pas par une main',
    !accepteDepuis(h, { ou: 'reserve' }, { ou: 'main', rang: 1 }, p2!.id))
  verifier('une pile pleine refuse une potion de plus',
    !accepteDepuis(pleine, { ou: 'reserve' }, { ou: 'pile' }, POTIONS_DEPART[4]!.id))
  // LE CAS QUI JUSTIFIE LA FONCTION : juge apres la prise, pas avant.
  verifier('...mais accepte celle qui en sort',
    accepteDepuis(pleine, { ou: 'pile' }, { ou: 'pile' }, pleine.chargement.pile[0]!.id))
  // Une main vide ne tient rien, donc rien ne part de la : la piece tenue ne
  // peut pas grandir pour un deplacement qui n'existe pas.
  verifier('un slot vide n’offre rien',
    !accepteDepuis(h, { ou: 'main', rang: 1 }, { ou: 'reserve' }))

  // CE QU'ON A BU NE REVIENT PAS. `rentrer` recoit les survivantes, et la pile
  // devient exactement ca -- c'est la seule ressource du jeu qui s'epuise.
  const bue = rentrer(trois, 0, trois.chargement.pile.slice(0, 1))
  verifier('rentrer ne rend que les potions non bues', bue.chargement.pile.length === 1)
  verifier('le ratelier n’en repousse pas', bue.reserve.length === trois.reserve.length)
}

if (echecs > 0) throw new Error(`${echecs} vérification(s) en échec`)
console.log('Tout passe.')

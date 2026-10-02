/**
 * Vérifications de l'armurerie, sans navigateur.
 *
 * Ce qu'on vérifie ici, ce sont les règles qui rendent le chargement lisible :
 * un slot n'accepte pas n'importe quoi, un échange ne fait rien disparaître, et
 * mourir ne peut pas bloquer le jeu.
 */
import type { Arme, Armure } from './armes.ts'
import type { Hub } from './hub.ts'
import { carteTresor } from './cartes.ts'
import { createRng } from './rng.ts'
import { ARME_GRATUITE, ARMURE_GRATUITE, ESPADON as ESPADON_REEL, POTIONS_DEPART, RONDACHE, SUPER_POTIONS_DEPART, deckDeLEquipement } from './armes.ts'
import {
  CAPACITE_PILE,
  consommablesDeLaPile,
  echangerDansCoffre,
  estTresor,
  rangerEnFinDeCoffre,
  trierLeCoffre,
  accepteDepuis,
  cocherPret,
  creerHub,
  deckEmporte,
  decocherPret,
  pretActif,
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
  verifier('une potion est deja sur la pile', consommablesDeLaPile(h.chargement.pile).length === 1)
  verifier('elle ajoute sa carte au deck emporte', deckEmporte(h.chargement).length === 10)
  // En attendant un marché, l'Espadon attend au râtelier avec les potions
  // qu'on n'a pas prises : sans lui il n'y aurait rien à choisir.
  verifier('le ratelier tient l’Espadon au depart', h.reserve.includes(ESPADON_REEL))
  // LE COMPTE SE FAIT PAR MODÈLE, pas sur la longueur de la réserve : elle
  // accueille aussi le banc d'essai de la Super potion, et une liste qui
  // grandit ne doit pas faire tomber une vérification qui parle d'autre chose.
  verifier('et les quatre autres potions',
    h.reserve.filter((o) => POTIONS_DEPART.some((p) => p.id === o.id)).length === 4)
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
  const survivantes = consommablesDeLaPile(h.chargement.pile)
  verifier("l'or rapporte s'ajoute", rentrer(rentrer(h, 240, survivantes), 120, survivantes).or === 360)

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
  verifier('mourir vide la pile', consommablesDeLaPile(mortAvecPile.chargement.pile).length === 0)
  verifier('mais le ratelier garde ses potions', mortAvecPile.reserve.length === h.reserve.length)
}

// --- remplacer et ranger DANS la pile ---------------------------------------

{
  const h = creerHub()
  const [p1, p2, p3] = POTIONS_DEPART
  const sup = SUPER_POTIONS_DEPART[0]!
  // On remplit la pile : elle en tient CAPACITE_PILE.
  let pleine = h
  for (const p of [p2, p3]) pleine = deplacerPiece(pleine, { ou: 'reserve' }, { ou: 'pile' }, p!.id)
  verifier('la pile est pleine pour le test', consommablesDeLaPile(pleine.chargement.pile).length === CAPACITE_PILE)

  // SANS RANG, une pile pleine refuse : c'est la regle d'avant, inchangee.
  verifier('une pile pleine refuse qu on l allonge',
    deplacerPiece(pleine, { ou: 'reserve' }, { ou: 'pile' }, sup.id) === pleine)

  // AVEC UN RANG, elle remplace -- et la delogee repart d'ou vient la piece.
  const remplacee = deplacerPiece(pleine, { ou: 'reserve' }, { ou: 'pile', rang: 1 }, sup.id)
  verifier('viser une case remplace ce qu elle tient',
    remplacee.chargement.pile[1]!.id === sup.id)
  verifier('...sans allonger la pile', consommablesDeLaPile(remplacee.chargement.pile).length === CAPACITE_PILE)
  // La pile vaut [p1, p2, p3] : le rang 1, c'est p2.
  verifier('...et la delogee rentre au ratelier',
    remplacee.reserve.some((o) => o.id === p2!.id))

  // RANGER LA PILE : deux cases echangent, rien ne sort.
  const range = deplacerPiece(pleine, { ou: 'pile' }, { ou: 'pile', rang: 2 }, p1!.id)
  verifier('deux cases de la pile s echangent',
    range.chargement.pile[2]!.id === p1!.id && consommablesDeLaPile(range.chargement.pile).length === CAPACITE_PILE)
  verifier('...et rien n est parti au ratelier', range.reserve.length === pleine.reserve.length)

  // Le rendu demande la meme chose que la regle.
  verifier('le rendu sait qu une case occupee prend',
    accepteDepuis(pleine, { ou: 'reserve' }, { ou: 'pile', rang: 0 }, sup.id))
  verifier('...et qu une pile pleine refuse sans rang',
    !accepteDepuis(pleine, { ou: 'reserve' }, { ou: 'pile' }, sup.id))
}

// --- la pile est POSITIONNELLE ----------------------------------------------

{
  const h = creerHub()
  const [, p2, p3] = POTIONS_DEPART
  // On pose dans la DERNIERE case alors que la deuxieme est libre.
  const loin = deplacerPiece(h, { ou: 'reserve' }, { ou: 'pile', rang: 2 }, p2!.id)
  verifier('on pose dans la case qu on vise', loin.chargement.pile[2]!.id === p2!.id)
  verifier('...et la case du milieu reste libre', loin.chargement.pile[1] === null)

  // SORTIR LAISSE SA CASE OUVERTE : les voisines ne glissent pas.
  const sortie = deplacerPiece(loin, { ou: 'pile' }, { ou: 'reserve' }, p2!.id)
  verifier('sortir laisse la case ouverte', sortie.chargement.pile[2] === null)
  verifier('...et la premiere n a pas bouge', sortie.chargement.pile[0]!.id === h.chargement.pile[0]!.id)

  // SANS RANG, on prend la premiere libre : un depot large doit bien poser.
  const large = deplacerPiece(h, { ou: 'reserve' }, { ou: 'pile' }, p3!.id)
  verifier('sans rang, la premiere case libre', large.chargement.pile[1]!.id === p3!.id)
}

// --- ranger le coffre --------------------------------------------------------

{
  const h = creerHub()
  const [a, b] = h.reserve
  const range = echangerDansCoffre(h, [a!.id], [b!.id])
  verifier('l’echange remet les deux objets a la place l’un de l’autre',
    range.reserve[0]!.id === b!.id && range.reserve[1]!.id === a!.id)
  verifier('...et ne change rien d’autre', range.reserve.length === h.reserve.length)
  verifier('un objet avec lui-meme ne fait rien', echangerDansCoffre(h, [a!.id], [a!.id]) === h)
  verifier('un identifiant inconnu ne fait rien', echangerDansCoffre(h, [a!.id], ['fantome']) === h)

  // ON DEPLACE DES PILES, PAS DES ELEMENTS. Le coffre regroupe les exemplaires
  // identiques : echanger deux representants laisserait leurs doublures
  // derriere eux, donc la pile ne bougerait pas.
  const potions = h.reserve
    .filter((o) => POTIONS_DEPART.some((q) => q.id === o.id))
    .map((o) => o.id)
  const pile = echangerDansCoffre(h, [a!.id], potions)
  verifier('une pile entiere prend la place de l’objet vise',
    pile.reserve.slice(0, potions.length).every((o, i) => o.id === potions[i]))
  // ON CALCULE LA PLACE ATTENDUE, on ne la suppose pas : la verification
  // lisait l'index `potions.length`, ce qui tenait tant que la pile suivait
  // immediatement le premier objet du coffre. *Une verification qui suppose
  // une position se casse au premier contenu ajoute* -- la Rondache, glissee
  // entre les deux, l'a fait tomber alors que la regle, elle, n'avait pas
  // bouge.
  const debutPile = h.reserve.findIndex((o) => o.id === potions[0])
  verifier('...et l’objet vise se retrouve la ou la pile etait',
    pile.reserve[debutPile + potions.length - 1]!.id === a!.id)
  verifier('...sans rien perdre', pile.reserve.length === h.reserve.length)
  verifier('une pile incomplete ne fait rien',
    echangerDansCoffre(h, [a!.id], [potions[0]!, 'fantome']) === h)
  verifier('une liste vide ne fait rien', echangerDansCoffre(h, [a!.id], []) === h)

  // SUR UNE CASE VIDE, on va au bout : il n'y a personne avec qui echanger.
  const auBout = rangerEnFinDeCoffre(h, [a!.id])
  verifier('un objet range en fin de coffre y va',
    auBout.reserve[auBout.reserve.length - 1]!.id === a!.id)
  verifier('...sans rien perdre', auBout.reserve.length === h.reserve.length)
  const pileAuBout = rangerEnFinDeCoffre(h, potions)
  verifier('une pile entiere y va aussi, dans son ordre',
    pileAuBout.reserve.slice(-potions.length).every((o, i) => o.id === potions[i]))
  verifier('une pile incomplete ne fait rien',
    rangerEnFinDeCoffre(h, [potions[0]!, 'fantome']) === h)
  verifier('une liste vide ne fait rien non plus', rangerEnFinDeCoffre(h, []) === h)

  // RANGER TOUT : par categorie, puis par rarete. L'ordre des categories est
  // celui des onglets -- armes, armures, objets.
  const range2 = trierLeCoffre({
    ...h,
    reserve: [
      ...POTIONS_DEPART.slice(0, 2),
      carteTresor('t-2', 'Idole', 240),
      ARMURE_GRATUITE,
      ESPADON_REEL,
      carteTresor('t-1', 'Camee', 45),
      ARME_GRATUITE,
    ],
  })
  const categorie = range2.reserve.map((o) =>
    estTresor(o) ? 'tresor' : 'mains' in o ? 'arme' : 'modele' in o ? 'objet' : 'armure',
  )
  verifier('les armes viennent en premier', categorie[0] === 'arme' && categorie[1] === 'arme')
  verifier('...puis les armures', categorie[2] === 'armure')
  verifier('...puis les objets', categorie[3] === 'objet' && categorie[4] === 'objet')
  // LES TRESORS FERMENT LA MARCHE : ils ne s'equipent pas, donc ce qu'on
  // cherche pour partir se lit d'abord.
  verifier('...et les tresors en dernier', categorie[5] === 'tresor' && categorie[6] === 'tresor')
  // LE COMMUN D'ABORD, LE RARE AU BOUT : tranche par Keko. Une liste qui monte
  // se termine sur ce qu'on cherche.
  verifier('la rarete monte dans la categorie', range2.reserve[1]!.id === ESPADON_REEL.id)
  verifier('les tresors se rangent par valeur', range2.reserve[5]!.id === 't-1')
  // DEUX RANGEMENTS DU MEME COFFRE DONNENT LA MEME CHOSE : sans ordre stable,
  // deux objets de meme categorie et meme rarete s'echangeraient a chaque clic.
  verifier('ranger deux fois ne change plus rien',
    trierLeCoffre(range2).reserve.map((o) => o.id).join() === range2.reserve.map((o) => o.id).join())

  // TOUT S'ECHANGE AVEC TOUT, tresors compris. Keko : « on peut reorganiser
  // les armes / armures / objets ensemble ? la les tresors ne peuvent pas etre
  // changes de position avec une arme ». Une seule etagere, un seul ordre.
  const avecTresor = {
    ...h,
    reserve: [...h.reserve, carteTresor('t-1', 'Camee', 45), carteTresor('t-2', 'Idole', 90)],
  }
  const melange = echangerDansCoffre(avecTresor, [a!.id], ['t-1'])
  const ou = (hub: typeof avecTresor, id: string): number =>
    hub.reserve.findIndex((o) => o.id === id)
  verifier('une piece s’echange avec un tresor',
    ou(melange, 't-1') === ou(avecTresor, a!.id) && ou(melange, a!.id) === ou(avecTresor, 't-1'))
  verifier('...sans rien perdre', melange.reserve.length === avecTresor.reserve.length)
  const tresors = echangerDansCoffre(avecTresor, ['t-1'], ['t-2'])
  verifier('deux tresors s’echangent entre eux', ou(tresors, 't-2') === ou(avecTresor, 't-1'))
  // ET UN TRESOR SE RANGE EN FIN DE COFFRE, comme n'importe quoi d'autre.
  const tresorAuBout = rangerEnFinDeCoffre(avecTresor, ['t-1'])
  verifier('un tresor va au bout du coffre', tresorAuBout.reserve.at(-1)!.id === 't-1')

  // UN TRESOR NE S'EQUIPE JAMAIS : c'est le TYPE qui le tient hors des slots,
  // depuis qu'il vit dans la meme liste que les pieces.
  verifier('un tresor n’entre pas dans le torse',
    !accepteDepuis(avecTresor, { ou: 'reserve' }, { ou: 'armure' }, 't-1'))
  verifier('...ni en main', !accepteDepuis(avecTresor, { ou: 'reserve' }, { ou: 'main', rang: 0 }, 't-1'))
  verifier('...ni dans la pile', !accepteDepuis(avecTresor, { ou: 'reserve' }, { ou: 'pile' }, 't-1'))
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
  verifier('on empile plusieurs exemplaires du meme modele', consommablesDeLaPile(trois.chargement.pile).length === 3)
  verifier('et le deck grossit d’autant', deckEmporte(trois.chargement).length === 12)
  verifier('rien ne s’est perdu en chemin', trois.reserve.length + consommablesDeLaPile(trois.chargement.pile).length === h.reserve.length + 1)

  // ON EN REPREND UNE PRECISE : la pile se prend par identifiant, sinon on ne
  // saurait pas laquelle des trois on retire.
  const moins = deplacerPiece(trois, { ou: 'pile' }, { ou: 'reserve' }, p2!.id)
  verifier('on retire un exemplaire precis', consommablesDeLaPile(moins.chargement.pile).length === 2)
  verifier('...et c’est bien celui-la', !moins.chargement.pile.some((c) => c?.id === p2!.id))
  verifier('il repart au ratelier', moins.reserve.some((o) => o.id === p2!.id))

  // La pile ne prend QUE des consommables, et un consommable ne va nulle part
  // ailleurs.
  verifier('une arme ne se boit pas', deplacerPiece(h, { ou: 'main', rang: 0 }, { ou: 'pile' }) === h)
  verifier('une potion ne tient pas en main', deplacerPiece(h, { ou: 'reserve' }, { ou: 'main', rang: 1 }, p1!.id) === h)
  verifier('ni au torse', deplacerPiece(h, { ou: 'reserve' }, { ou: 'armure' }, p1!.id) === h)

  // LE PLAFOND : la quatrieme potion reste au ratelier.
  const pleine = deplacerPiece(deplacerPiece(trois, { ou: 'reserve' }, { ou: 'pile' }, POTIONS_DEPART[3]!.id), { ou: 'reserve' }, { ou: 'pile' }, POTIONS_DEPART[4]!.id)
  verifier('la pile plafonne a CAPACITE_PILE', consommablesDeLaPile(pleine.chargement.pile).length === CAPACITE_PILE)
  verifier('la quatrieme reste au ratelier', pleine.reserve.some((o) => o.id === POTIONS_DEPART[3]!.id))
  verifier('et le depot de trop ne change rien d’autre',
    deplacerPiece(pleine, { ou: 'reserve' }, { ou: 'pile' }, POTIONS_DEPART[4]!.id) === pleine)

  // MAIS ON PEUT REPOSER SUR UNE PILE PLEINE CE QU'ON VIENT D'EN SORTIR : la
  // destination se juge apres la prise, sinon la carte se refusait elle-meme.
  const repose = deplacerPiece(pleine, { ou: 'pile' }, { ou: 'pile' }, pleine.chargement.pile[0]!.id)
  verifier('une potion se repose sur sa propre pile pleine', consommablesDeLaPile(repose.chargement.pile).length === CAPACITE_PILE)

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
  const bue = rentrer(trois, 0, consommablesDeLaPile(trois.chargement.pile).slice(0, 1))
  verifier('rentrer ne rend que les potions non bues',
    consommablesDeLaPile(bue.chargement.pile).length === 1)
  verifier('le ratelier n’en repousse pas', bue.reserve.length === trois.reserve.length)
}

if (echecs > 0) throw new Error(`${echecs} vérification(s) en échec`)
console.log('Tout passe.')

{
  // LE PRET DE L'ARMURIER : une case a cocher, pas un depart a part.
  // Keko : « quand on le coche, tout l'equipement actuel va au coffre et on
  // verrouille un equipement aleatoire arme + armure ».
  const h = creerHub()
  const avant = h.chargement.mains[0]!.id
  const pile = consommablesDeLaPile(h.chargement.pile).length
  const p = cocherPret(h, createRng(7))

  verifier('cocher le pret equipe une arme pretee',
    p.chargement.mains[0]!.pret === true)
  verifier('...et une armure pretee',
    p.chargement.armure!.pret === true)
  verifier('...le pret est actif',
    pretActif(p.chargement))
  verifier('...ce qu’on portait rentre au coffre',
    p.reserve.some((o) => o.id === avant))
  // LES OBJETS NE SONT JAMAIS PRETES : la pile ne bouge pas.
  verifier('...et la pile ne bouge pas',
    consommablesDeLaPile(p.chargement.pile).length === pile)

  // DECOCHER : le pret s'evapore, et il ne laisse RIEN -- il n'a jamais
  // appartenu a personne, donc il ne rentre pas au coffre.
  const d = decocherPret(p)
  verifier('decocher vide les slots pretes',
    d.chargement.mains[0] === null && d.chargement.armure === null)
  verifier('...et ne laisse rien au coffre',
    d.reserve.length === p.reserve.length)
  verifier('...et garde les objets',
    consommablesDeLaPile(d.chargement.pile).length === pile)
}

{
  // LE PRET TOMBE EN BLOC des qu'on equipe une piece a soi. Keko : « si le
  // joueur equipe une arme ou armure du coffre a nouveau, l'equipement gratuit
  // disparait integralement ».
  const p = cocherPret(creerHub(), createRng(3))
  const espadon = p.reserve.find((o) => o.id === ESPADON_REEL.id)!
  const apres = deplacerPiece(p, { ou: 'reserve' }, { ou: 'main', rang: 0 }, espadon.id)

  verifier('equiper une arme a soi rompt le pret',
    !pretActif(apres.chargement))
  verifier('...l’arme pretee ne rentre pas au coffre',
    !apres.reserve.some((o) => (o as Arme).pret === true))
  verifier('...et l’ARMURE pretee tombe avec elle',
    apres.chargement.armure === null)

  // LES OBJETS, EUX, NE ROMPENT RIEN : « le joueur peut ajouter des objets a un
  // free loadout ».
  const potion = p.reserve.find((o) => o.id === POTIONS_DEPART[1]!.id)!
  const avecObjet = deplacerPiece(p, { ou: 'reserve' }, { ou: 'pile' }, potion.id)
  verifier('ajouter un objet laisse le pret en place',
    pretActif(avecObjet.chargement))
}

{
  // ET IL NE S'ACQUIERT QU'EN LE RAMENANT. Keko : « l'equipement gratuit ne
  // pourra etre obtenu definitivement qu'apres que le joueur l'ait emmene en
  // run et ramene ».
  const p = cocherPret(creerHub(), createRng(5))
  const rentre = rentrer(p, 40, consommablesDeLaPile(p.chargement.pile))
  verifier('ramener le pret en fait un bien',
    !pretActif(rentre.chargement) && rentre.chargement.mains[0] !== null)

  // MOURIR AVEC NE LAISSE RIEN : on ne perd que ce qu'on a emporte, et ca
  // n'appartenait a personne.
  const mort = perdreLEquipement(p)
  verifier('mourir avec un pret ne le laisse pas au coffre',
    !mort.reserve.some((o) => (o as Arme).pret === true))

  // COCHER DEUX FOIS NE CUMULE RIEN : un pret qu'on remplace par un autre ne
  // doit rien laisser derriere lui.
  const deux = cocherPret(p, createRng(9))
  verifier('recocher ne verse pas l’ancien pret au coffre',
    !deux.reserve.some((o) => (o as Arme).pret === true))
}

{
  // UNE PIECE PRETEE EST VERROUILLEE. Keko : « on ne peut pas prendre l'arme ou
  // l'armure de pret et la placer dans le coffre ». Le garde-fou vit dans la
  // PRISE et non a la destination, donc il vaut pour toutes les destinations.
  const p = cocherPret(creerHub(), createRng(13))
  const versCoffre = deplacerPiece(p, { ou: 'main', rang: 0 }, { ou: 'reserve' })
  verifier('l’arme pretee ne part pas au coffre',
    versCoffre.chargement.mains[0] !== null && versCoffre.reserve.length === p.reserve.length)
  const armureAuCoffre = deplacerPiece(p, { ou: 'armure' }, { ou: 'reserve' })
  verifier('...et l’armure pretee non plus',
    armureAuCoffre.chargement.armure !== null)
  // NI D'UN SLOT A L'AUTRE : verrouille veut dire verrouille.
  const autreMain = deplacerPiece(p, { ou: 'main', rang: 0 }, { ou: 'main', rang: 1 })
  verifier('...ni d’une main a l’autre',
    autreMain.chargement.mains[0] !== null && autreMain.chargement.mains[1] === null)
  // ET LE RENDU LE SAIT AVANT LE LACHER : un slot qui promet puis ne fait rien
  // a l'air casse.
  verifier('le rendu sait que la prise est refusee',
    !accepteDepuis(p, { ou: 'main', rang: 0 }, { ou: 'reserve' }))

  // MAIS EQUIPER UNE PIECE A SOI RESTE POSSIBLE : c'est la porte de sortie.
  const espadon = p.reserve.find((o) => o.id === ESPADON_REEL.id)!
  const rompu = deplacerPiece(p, { ou: 'reserve' }, { ou: 'main', rang: 0 }, espadon.id)
  verifier('equiper une piece a soi reste possible',
    rompu.chargement.mains[0]!.id === espadon.id)
}

// --- chaque main a la sienne -------------------------------------------------

{
  const h = creerHub()
  const rondache = h.reserve.find((o) => o.id === RONDACHE.id)!
  const dague = h.reserve.find((o) => o.id === 'dague')!
  const glaive = h.chargement.mains[0]!

  verifier('une arme de main gauche va dans le second slot',
    accepteDepuis(h, { ou: 'reserve' }, { ou: 'main', rang: 1 }, rondache.id))
  verifier('...et pas dans le premier',
    !accepteDepuis(h, { ou: 'reserve' }, { ou: 'main', rang: 0 }, rondache.id))

  // AUCUNE ARME DU CATALOGUE N'EST DE MAIN DROITE aujourd'hui -- Keko les a
  // toutes repassees en « une main ». *Une regle sans contenu reste une regle*,
  // donc on la verifie sur une piece fabriquee ici : le jour ou une arme de
  // droite arrive, elle ne trouvera pas le chemin casse.
  const brise: Arme = { ...(dague as Arme), id: 'droitiere', main: 'droite' }
  const avecDroitiere: Hub = { ...h, reserve: [...h.reserve, brise] }
  verifier('une arme de main droite va dans le premier',
    accepteDepuis(avecDroitiere, { ou: 'reserve' }, { ou: 'main', rang: 0 }, brise.id))
  verifier('...et pas dans le second',
    !accepteDepuis(avecDroitiere, { ou: 'reserve' }, { ou: 'main', rang: 1 }, brise.id))
  verifier('une arme a une main va dans les deux',
    accepteDepuis(h, { ou: 'reserve' }, { ou: 'main', rang: 0 }, dague.id) &&
      accepteDepuis(h, { ou: 'reserve' }, { ou: 'main', rang: 1 }, dague.id))

  // Le Glaive n'a pas de main declaree : il va partout. On le repose d'abord
  // au coffre, puisqu'il est equipe au depart.
  const pose = deplacerPiece(h, { ou: 'main', rang: 0 }, { ou: 'reserve' }, glaive.id)
  verifier('une arme sans main declaree va a droite',
    accepteDepuis(pose, { ou: 'reserve' }, { ou: 'main', rang: 0 }, glaive.id))
  verifier('...comme a gauche',
    accepteDepuis(pose, { ou: 'reserve' }, { ou: 'main', rang: 1 }, glaive.id))

  const espadon = h.reserve.find((o) => o.id === ESPADON_REEL.id)!
  verifier('une arme a deux mains se pose dans l’un ou l’autre',
    accepteDepuis(h, { ou: 'reserve' }, { ou: 'main', rang: 0 }, espadon.id) &&
      accepteDepuis(h, { ou: 'reserve' }, { ou: 'main', rang: 1 }, espadon.id))
}

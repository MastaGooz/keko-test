/**
 * Vérification des règles de combat, sans navigateur ni dépendance :
 *   npm run verif
 *
 * Ce n'est pas une suite de tests à maintenir, c'est la preuve que les règles
 * tranchées avec Keko font bien ce qu'elles disent — en particulier celles qui
 * portent la punition de la cupidité : la main entière défaussée chaque tour,
 * et l'énergie qui ne se reporte pas.
 */
import { createRng } from './rng.ts'
import type { Rng } from './rng.ts'
import type { Carte, ConfigCombat, Ennemi, EtatCombat } from './combat.ts'
import {
  consequence,
  coutDe,
  creerCombat,
  degatsDe,
  finDuTour,
  jouerCarte,
  mainMorte,
  menaceDuTour,
  reordonnerMain,
  portee,
  viseUneCible,
  vivants,
} from './combat.ts'
import { ESPADON, GLAIVE, PLASTRON, POTIONS_DEPART } from './armes.ts'

const CONFIG: ConfigCombat = { pvMax: 30, tailleMain: 5, energieMax: 5 }

const MOULINET = { nom: 'Moulinet', cout: 4, degats: 16 }
const DAGUE = { nom: 'Dague', cout: 1, degats: 3 }

let echecs = 0

console.log('Règles de combat :')

// --- ranger sa main ----------------------------------------------------------

cas('ranger sa main deplace la carte sans toucher au reste', () => {
  const etat = combat([...cartes(2, MOULINET), ...cartes(3, DAGUE)], ennemi({ pv: 100, degats: 5 }))
  const noms = etat.main.map((c) => c.id)
  const apres = reordonnerMain(etat, 0, 3)

  egal(apres.main.map((c) => c.id).join(), [noms[1], noms[2], noms[3], noms[0], noms[4]].join(),
    'la carte a pris sa nouvelle place, les autres ont glisse')
  egal(apres.main.length, etat.main.length, 'aucune carte perdue')
  egal(apres.energie, etat.energie, 'aucune energie depensee')
  egal(apres.ennemis[0].pv, etat.ennemis[0].pv, 'aucun degat')
  egal(apres.tour, etat.tour, 'toujours le meme tour')
})

cas('ranger sa main vers la gauche marche aussi', () => {
  const etat = combat([...cartes(2, MOULINET), ...cartes(3, DAGUE)], ennemi({ pv: 100, degats: 5 }))
  const noms = etat.main.map((c) => c.id)
  const apres = reordonnerMain(etat, 4, 1)

  egal(apres.main.map((c) => c.id).join(), [noms[0], noms[4], noms[1], noms[2], noms[3]].join(),
    'la carte est remontee a sa place')
})

cas('un rangement qui ne veut rien dire ne change rien', () => {
  const etat = combat(cartes(5, DAGUE), ennemi({ pv: 100, degats: 5 }))
  egal(reordonnerMain(etat, 2, 2), etat, 'meme place : etat inchange')
  egal(reordonnerMain(etat, -1, 2), etat, 'index negatif : etat inchange')
  egal(reordonnerMain(etat, 0, 99), etat, 'index hors main : etat inchange')
})

cas('on ne range plus sa main une fois le combat fini', () => {
  const etat = combat(cartes(5, MOULINET), ennemi({ pv: 10, degats: 5 }))
  const gagne = jouerCarte(etat, 0, 0, rng())
  egal(gagne.issue, 'victoire', 'le combat est bien fini')
  egal(reordonnerMain(gagne, 0, 2), gagne, 'etat inchange')
})

// --- le tour -----------------------------------------------------------------

cas('la carte résout tout de suite et consomme son énergie', () => {
  const etat = combat(cartes(6, MOULINET), ennemi({ pv: 100, degats: 5 }))
  const apres = jouerCarte(etat, 0, 0, rng())

  egal(apres.ennemis[0].pv, 84, 'dégâts appliqués')
  egal(apres.energie, 1, 'énergie restante')
  egal(apres.pv, 30, 'l\'ennemi n\'a pas encore riposté')
  egal(apres.tour, 1, 'toujours le même tour')
})

cas('une carte trop chère ne se joue pas', () => {
  const etat = combat(cartes(6, MOULINET), ennemi({ pv: 100, degats: 5 }))
  const apres = jouerCarte(etat, 0, 0, rng())
  const refus = jouerCarte(apres, 0, 0, rng())

  egal(apres.energie, 1, 'il reste 1 énergie')
  verifie(refus === apres, 'l\'état devrait être inchangé, à l\'identique')
})

cas('les ennemis frappent à la fin du tour, pas avant', () => {
  const etat = groupe(cartes(6, DAGUE), [
    ennemi({ pv: 100, degats: 5 }),
    ennemi({ pv: 100, degats: 3, nom: 'Second' }),
  ])
  egal(menaceDuTour(etat), 8, 'menace annoncée')

  const apres = finDuTour(etat, rng())
  egal(apres.pv, 22, 'les deux ont frappé')
  egal(apres.tour, 2, 'tour suivant')
  egal(apres.energie, 5, 'énergie rechargée')
})

cas('un ennemi à période 2 ne frappe qu\'un tour sur deux', () => {
  const etat = combat(cartes(6, DAGUE), ennemi({ pv: 100, degats: 9, periode: 2, compteur: 2 }))
  egal(menaceDuTour(etat), 0, 'il ne frappe pas ce tour-ci')

  const t2 = finDuTour(etat, rng())
  egal(t2.pv, 30, 'aucun dégât au premier tour')
  egal(menaceDuTour(t2), 9, 'il frappe au tour 2')

  const t3 = finDuTour(t2, rng())
  egal(t3.pv, 21, 'il a frappé')
  egal(menaceDuTour(t3), 0, 'compteur rechargé, rien au tour 3')
})

cas('abattre une cible avant la fin du tour annule sa frappe', () => {
  const etat = groupe(cartes(6, MOULINET), [
    ennemi({ pv: 16, degats: 5 }),
    ennemi({ pv: 100, degats: 3, nom: 'Second' }),
  ])
  egal(menaceDuTour(etat), 8, 'menace avant le coup')

  const apres = jouerCarte(etat, 0, 0, rng())
  egal(menaceDuTour(apres), 3, 'le mort ne frappe plus')
  egal(finDuTour(apres, rng()).pv, 27, 'seul le survivant a frappé')
})

cas('la victoire demande que tous soient à terre', () => {
  const etat = groupe(cartes(6, MOULINET), [
    ennemi({ pv: 16, degats: 1 }),
    ennemi({ pv: 16, degats: 1, nom: 'Second' }),
  ])
  const un = jouerCarte(etat, 0, 0, rng())
  egal(un.issue, null, 'un mort ne suffit pas')
  egal(un.energie, 1, 'énergie dépensée')

  // Le second moulinet coûte 4 : il faut passer un tour pour le payer.
  const t2 = finDuTour(un, rng())
  const deux = jouerCarte(t2, t2.main.findIndex((c) => c.type === 'combat'), 1, rng())
  egal(deux.issue, 'victoire', 'les deux à terre')
})

// --- la main -----------------------------------------------------------------

cas('la fin du tour renouvelle TOUTE la main', () => {
  const etat = combat(cartes(10, DAGUE), ennemi({ pv: 100, degats: 1 }))
  const avant = etat.main.map((carte) => carte.id)
  const apres = finDuTour(etat, rng())
  const communes = apres.main.filter((carte) => avant.includes(carte.id))

  egal(apres.main.length, 5, 'taille de la main')
  egal(communes.length, 0, 'cartes conservées de l\'ancienne main')
  egal(apres.defausse.length, 5, 'ancienne main envoyée à la défausse')
})

cas('l\'énergie non dépensée est perdue', () => {
  const etat = combat(cartes(10, DAGUE), ennemi({ pv: 100, degats: 1 }))
  const apres = finDuTour(jouerCarte(etat, 0, 0, rng()), rng())

  egal(apres.energie, 5, 'rechargée à plein, pas cumulée')
})

cas('un trésor ne se joue pas', () => {
  const etat = combat(tresors(10), ennemi({ pv: 100, degats: 1 }))
  const apres = jouerCarte(etat, 0, 0, rng())

  verifie(mainMorte(etat), 'la main devrait être morte')
  verifie(apres === etat, 'l\'état devrait être inchangé, à l\'identique')
})

cas('une main morte ne bloque jamais la partie', () => {
  const alea = rng()
  let etat = combat(tresors(10), ennemi({ pv: 100, degats: 4 }))
  for (let i = 0; i < 3; i += 1) etat = finDuTour(etat, alea)

  verifie(etat.pv < CONFIG.pvMax, 'le joueur devrait avoir encaissé')
  egal(etat.issue, null, 'issue')
  egal(etat.main.length, 5, 'main repiochée')
  egal(etat.tour, 4, 'trois tours passés')
})

cas('une main sans carte abordable est morte, même avec des cartes de combat', () => {
  const etat = combat(cartes(10, MOULINET), ennemi({ pv: 100, degats: 1 }))
  verifie(!mainMorte(etat), 'à 5 énergie le moulinet passe')

  const apres = jouerCarte(etat, 0, 0, rng())
  verifie(mainMorte(apres), 'à 1 énergie plus rien ne passe')
})

cas('la défausse est remélangée quand la pioche est vide', () => {
  const etat = combat(cartes(7, DAGUE), ennemi({ pv: 100, degats: 1 }))
  egal(etat.pioche.length, 2, 'pioche restante après la main de départ')

  const apres = finDuTour(etat, rng())
  egal(apres.main.length, 5, 'main complétée malgré la pioche trop courte')
  egal(apres.pioche.length, 2, 'reliquat après remélange de la défausse')
  egal(apres.defausse.length, 0, 'défausse vidée dans la pioche')
})

cas('la mort interrompt la fin du tour', () => {
  const etat = groupe(cartes(10, DAGUE), [
    ennemi({ pv: 100, degats: 30 }),
    ennemi({ pv: 100, degats: 5, nom: 'Second' }),
  ])
  const apres = finDuTour(etat, rng())

  egal(apres.issue, 'defaite', 'issue')
  egal(apres.pv, 0, 'PV du joueur')
  egal(apres.tour, 1, 'le tour ne s\'est pas terminé')
  egal(apres.main.length, 5, 'aucune pioche après la mort')
})

cas('les transitions ne modifient pas l\'état reçu', () => {
  const etat = combat(cartes(6, DAGUE), ennemi({ pv: 100, degats: 5 }))
  const temoin = JSON.stringify(etat)
  jouerCarte(etat, 0, 0, rng())
  finDuTour(etat, rng())

  egal(JSON.stringify(etat), temoin, 'état d\'origine')
})

// --- la conséquence ----------------------------------------------------------

cas('la conséquence annonce ce qu\'un coup évite', () => {
  const etat = groupe(cartes(6, MOULINET), [
    ennemi({ pv: 16, degats: 5 }),
    ennemi({ pv: 100, degats: 3, nom: 'Second' }),
  ])
  const c = consequence(etat, etat.main[0], 0)

  egal(c.tue, true, 'la cible est achevée')
  egal(c.gagne, false, 'il en reste un debout')
  egal(c.evite, 5, 'sa frappe est évitée')
  egal(c.menaceApres, 3, 'il reste la frappe du survivant')
})

cas('la conséquence n\'évite rien sur une cible qui ne frappait pas ce tour', () => {
  const etat = groupe(cartes(6, MOULINET), [
    ennemi({ pv: 16, degats: 5, periode: 3, compteur: 3 }),
    ennemi({ pv: 100, degats: 3, nom: 'Second' }),
  ])
  const c = consequence(etat, etat.main[0], 0)

  egal(c.tue, true, 'la cible est achevée')
  egal(c.evite, 0, 'elle ne frappait pas ce tour-ci')
  egal(c.menaceApres, 3, 'menace inchangée')
})

cas('la conséquence sait ce qu\'on ne peut pas payer', () => {
  const etat = combat(cartes(6, MOULINET), ennemi({ pv: 100, degats: 5 }))
  const apres = jouerCarte(etat, 0, 0, rng())

  egal(consequence(etat, etat.main[0], 0).abordable, true, 'à 5 énergie')
  egal(consequence(apres, apres.main[0], 0).abordable, false, 'à 1 énergie')
})

// --- plusieurs ennemis -------------------------------------------------------

cas('un coup ne touche que sa cible', () => {
  const etat = groupe(cartes(6, MOULINET), [
    ennemi({ pv: 40, degats: 5 }),
    ennemi({ pv: 40, degats: 5, nom: 'Second' }),
  ])
  const apres = jouerCarte(etat, 0, 1, rng())

  egal(apres.ennemis[0].pv, 40, 'le premier est intact')
  egal(apres.ennemis[1].pv, 24, 'seul le visé encaisse')
})

cas('un mort ne frappe plus et quitte la liste des vivants', () => {
  const etat = groupe(cartes(6, MOULINET), [
    ennemi({ pv: 16, degats: 5 }),
    ennemi({ pv: 100, degats: 5, nom: 'Second' }),
  ])
  const apres = jouerCarte(etat, 0, 0, rng())

  egal(vivants(apres).length, 1, 'un seul debout')
  egal(vivants(apres)[0].index, 1, 'les index de cible ne bougent pas')
  egal(menaceDuTour(apres), 5, 'seule la frappe du survivant reste')
})

// --- petite tuyauterie -------------------------------------------------------

function cas(nom: string, corps: () => void): void {
  try {
    corps()
    console.log(`  ok    ${nom}`)
  } catch (erreur) {
    echecs += 1
    console.log(`  ECHEC ${nom}`)
    console.log(`        ${(erreur as Error).message}`)
  }
}

function verifie(condition: boolean, message: string): void {
  if (!condition) throw new Error(message)
}

function egal(obtenu: unknown, attendu: unknown, quoi: string): void {
  if (obtenu !== attendu) {
    throw new Error(`${quoi} : attendu ${JSON.stringify(attendu)}, obtenu ${JSON.stringify(obtenu)}`)
  }
}

/** Seed fixe : les vérifications ne doivent jamais dépendre du tirage. */
function rng() {
  return createRng(1)
}

function combat(deck: Carte[], adversaire: Ennemi): EtatCombat {
  return creerCombat(deck, [adversaire], rng(), CONFIG)
}

function groupe(deck: Carte[], adversaires: Ennemi[]): EtatCombat {
  return creerCombat(deck, adversaires, rng(), CONFIG)
}

function ennemi(traits: {
  pv: number
  degats: number
  periode?: number
  compteur?: number
  nom?: string
}): Ennemi {
  const periode = traits.periode ?? 1
  return {
    nom: traits.nom ?? 'Mannequin',
    pv: traits.pv,
    pvMax: traits.pv,
    degats: traits.degats,
    periode,
    compteur: traits.compteur ?? periode,
  }
}

// --- le bloc, a la Slay the Spire -------------------------------------------

{
  const garde: Carte = {
    id: 'garde-1',
    nom: 'Garde',
    type: 'combat',
    cout: 1,
    degats: 0,
    effets: [{ type: 'bloc', montant: 5 }],
  }
  const rng = createRng(31)
  const brut = creerCombat(cartes(9, { nom: 'Estoc', cout: 1, degats: 3 }), [
    { nom: 'Cogneur', pv: 40, pvMax: 40, degats: 8, periode: 1, compteur: 1 },
  ], rng)
  // La Garde est POSEE en main, pas confiee au melange : un test qui depend de
  // la pioche s'accommode du cas ou la carte n'est pas la, donc il ne verifie
  // plus rien.
  const base = { ...brut, main: [garde, ...brut.main.slice(1)] }

  egal(jouerCarte(base, 0, 0, rng).bloc, 5, 'une carte de garde donne du bloc')
  egal(jouerCarte(base, 0, 0, rng).energie, base.energie - 1, 'et elle coute son energie')
  egal(jouerCarte(base, 0, 0, rng).ennemis[0]!.pv, 40, 'une garde ne frappe personne')

  // LA MENACE ANNONCEE TIENT COMPTE DU BLOC : c'est ce chiffre qui rend la
  // garde lisible -- la poser doit faire baisser ce qu'on va prendre, sous les
  // yeux du joueur.
  const avecBloc = { ...base, bloc: 5 }
  egal(menaceDuTour(base), 8, 'menace sans bloc')
  egal(menaceDuTour(avecBloc), 3, 'menace annoncee, bloc deduit')
  egal(menaceDuTour({ ...base, bloc: 99 }), 0, 'un bloc plus gros que la salve annonce zero')

  // LE BLOC ENCAISSE EN PREMIER, et il TOMBE une fois la salve passee.
  const apres = finDuTour(avecBloc, rng)
  egal(apres.pv, base.pvMax - 3, 'le bloc absorbe, seul le surplus passe aux PV')
  egal(apres.bloc, 0, 'et le bloc tombe une fois la salve passee')

  const encaisse = apres.evenements.filter((e) => e.type === 'frappe')
  egal(encaisse.length === 1 && encaisse[0]!.type === 'frappe' ? encaisse[0]!.degats : -1, 3,
    "l'evenement dit ce qu'on a VRAIMENT pris, pas ce qui etait destine")

  const gros = finDuTour({ ...base, bloc: 20 }, rng)
  egal(gros.pv, base.pvMax, 'un bloc suffisant annule la frappe')
}

function cartes(
  nombre: number,
  modele: { nom: string; cout: number; degats: number } & Partial<Carte>,
): Carte[] {
  // ON REPREND TOUT LE GABARIT, pas trois champs choisis : le jour où une carte
  // porte un effet ou une remise, un fixture qui ne copie que `cout` et
  // `degats` teste une AUTRE carte que celle qu'on croit — et il passe.
  return Array.from({ length: nombre }, (_, i) => ({
    ...modele,
    id: `${modele.nom}-${i + 1}`,
    type: 'combat' as const,
  }))
}

function tresors(nombre: number): Carte[] {
  return Array.from({ length: nombre }, (_, i) => ({
    id: `tresor-${i + 1}`,
    nom: 'Idole',
    type: 'tresor' as const,
    cout: 0,
    degats: 0,
  }))
}

// --- frapper tous les corps (l'Espadon) --------------------------------------

{
  const fauchage: Carte = {
    id: 'fauchage-1',
    nom: 'Fauchage',
    type: 'combat',
    cout: 2,
    degats: 0,
    effets: [{ type: 'degatsTous', montant: 5 }],
  }
  const brut = creerCombat(cartes(9, { nom: 'Estoc', cout: 1, degats: 3 }), [
    { nom: 'Fort', pv: 20, pvMax: 20, degats: 3, periode: 1, compteur: 1 },
    { nom: 'Faible', pv: 4, pvMax: 4, degats: 3, periode: 1, compteur: 1 },
    { nom: 'Mort', pv: 0, pvMax: 10, degats: 3, periode: 1, compteur: 1 },
  ], createRng(7))
  const base = { ...brut, main: [fauchage, ...brut.main.slice(1)] }
  const apres = jouerCarte(base, 0, -1, rng())

  egal(apres.ennemis[0]!.pv, 15, 'un fauchage frappe le premier corps')
  egal(apres.ennemis[1]!.pv, 0, 'et acheve le faible du meme coup')
  egal(apres.ennemis[2]!.pv, 0, 'un mort reste mort, pas de PV negatifs')
  egal(apres.energie, base.energie - 2, 'il coute son energie')
  verifie(apres !== base, 'il se joue sans cible (-1), comme un tresor brule')
  egal(vivants(apres).length, 1, 'il ne reste qu\u2019un corps debout')
}


cas('une carte à usages revient à la défausse avec un usage de moins, puis s’exile', () => {
  // C'est le consommable en une seule carte : trois gorgées, puis plus rien.
  const gorgee: Carte = { id: 'g', nom: 'Gorgée', type: 'combat', cout: 1, degats: 0, effets: [{ type: 'soin', montant: 10 }], usages: 2 }
  const etat: EtatCombat = { ...combat([gorgee], ennemi({ pv: 10, degats: 1 })), pv: 10, main: [gorgee], pioche: [], defausse: [] }
  const une = jouerCarte(etat, 0, 0, rng())
  egal(une.pv, 20, 'la gorgée soigne')
  egal(une.defausse.length, 1, 'elle revient à la défausse')
  egal(une.defausse[0]!.usages, 1, 'avec un usage de moins')
  const deux = jouerCarte({ ...une, main: [une.defausse[0]!], defausse: [], energie: 5 }, 0, 0, rng())
  egal(deux.pv, 30, 'la dernière gorgée soigne encore')
  egal(deux.defausse.length, 0, 'et la carte est exilée')
})

/**
 * LES TROIS PORTÉES, ET PAS UNE DE PLUS.
 *
 * Tranché par Keko : « soit une carte n'a pas de cible, soit elle a une cible,
 * soit elle cible tous les ennemis. Pas de carte où on cible soi-même X
 * ennemis. » La vérification vit ici parce que le TYPE ne peut pas l'exprimer
 * — rien n'empêcherait d'écrire une carte à `degats: 6` ET `degatsTous`, et
 * elle demanderait alors un geste qui n'existe pas.
 */
cas('une carte a exactement une portée sur trois', () => {
  const garde: Carte = { id: 'g', nom: 'Garde', type: 'combat', cout: 1, degats: 0, effets: [{ type: 'bloc', montant: 5 }] }
  const estoc: Carte = { id: 'e', nom: 'Estoc', type: 'combat', cout: 1, degats: 3 }
  const tornade: Carte = { id: 't', nom: 'Tornade', type: 'combat', cout: 5, degats: 0, effets: [{ type: 'degatsTous', montant: 10 }] }
  egal(portee(garde), 'aucune', 'ce qui bloque ne désigne personne')
  egal(portee(estoc), 'une', 'ce qui frappe désigne un corps')
  egal(portee(tornade), 'toutes', 'ce qui frappe le rang ne désigne personne non plus')
  verifie(!viseUneCible(garde) && !viseUneCible(tornade), 'et seul le coup simple demande une cible')
})

cas('aucune carte du jeu ne mélange une cible et le rang entier', () => {
  // Tout ce que le jeu peut mettre dans un deck : les sets des pièces, plus
  // les consommables, qui sont déjà des cartes.
  const modeles = [
    ...[GLAIVE, ESPADON, PLASTRON].flatMap((piece) => piece.set.map((entree) => entree.modele)),
    ...POTIONS_DEPART.map((c) => c.modele),
  ]
  const melangees = modeles.filter(
    (m) => m.degats > 0 && (m.effets?.some((e) => e.type === 'degatsTous') ?? false),
  )
  egal(melangees.length, 0, 'sinon il faudrait un geste de visée rien que pour elle')
})

// --- la remise par attaque ---------------------------------------------------

const ESTOC_REMISE = { nom: 'Estoc', cout: 3, degats: 6, remiseParAttaque: 1 }
const GARDE_TEST = { nom: 'Garde', cout: 1, degats: 0, effets: [{ type: 'bloc' as const, montant: 5 }] }

/** La main est MÉLANGÉE : on désigne par nom, jamais par index. */
function ou(etat: EtatCombat, nom: string): number {
  return etat.main.findIndex((c) => c.nom === nom)
}

function autreQue(etat: EtatCombat, nom: string): number {
  return etat.main.findIndex((c) => c.nom !== nom)
}

cas('une carte a remise coute son prix plein tant qu’on n’a rien frappe', () => {
  const etat = combat([...cartes(1, ESTOC_REMISE), ...cartes(4, DAGUE)], ennemi({ pv: 100, degats: 5 }))
  egal(coutDe(etat.main[ou(etat, 'Estoc')]!, etat), 3, 'rien n’a encore ete joue')
})

cas('chaque attaque portee lui retire un point d’action', () => {
  const etat = combat([...cartes(1, ESTOC_REMISE), ...cartes(4, DAGUE)], ennemi({ pv: 100, degats: 5 }))
  const apres = jouerCarte(etat, autreQue(etat, 'Estoc'), 0, rng())
  egal(apres.attaquesCeTour, 1, 'la dague compte comme une attaque')
  egal(coutDe(apres.main[ou(apres, 'Estoc')]!, apres), 2, 'donc l’estoc coute un de moins')
  const encore = jouerCarte(apres, autreQue(apres, 'Estoc'), 0, rng())
  egal(coutDe(encore.main[ou(encore, 'Estoc')]!, encore), 1, 'et deux de moins apres la seconde')
})

cas('le plancher est zero, jamais un gain', () => {
  let etat = combat([...cartes(1, ESTOC_REMISE), ...cartes(4, DAGUE)], ennemi({ pv: 100, degats: 5 }))
  for (let i = 0; i < 4; i += 1) etat = jouerCarte(etat, autreQue(etat, 'Estoc'), 0, rng())
  egal(coutDe(etat.main[ou(etat, 'Estoc')]!, etat), 0, 'quatre attaques pour une remise de trois')
})

cas('ce qui n’attaque pas n’escompte rien', () => {
  const etat = combat([...cartes(1, ESTOC_REMISE), ...cartes(4, GARDE_TEST)], ennemi({ pv: 100, degats: 5 }))
  const apres = jouerCarte(etat, autreQue(etat, 'Estoc'), 0, rng())
  egal(apres.attaquesCeTour, 0, 'une garde ne frappe personne')
  egal(coutDe(apres.main[ou(apres, 'Estoc')]!, apres), 3, 'donc le prix ne bouge pas')
})

cas('et elle paie vraiment le prix remis', () => {
  const etat = combat([...cartes(1, ESTOC_REMISE), ...cartes(4, DAGUE)], ennemi({ pv: 100, degats: 5 }))
  const apres = jouerCarte(etat, autreQue(etat, 'Estoc'), 0, rng())
  const joue = jouerCarte(apres, ou(apres, 'Estoc'), 0, rng())
  egal(joue.energie, apres.energie - 2, 'deux points d’action, pas trois')
})

cas('la remise retombe a la fin du tour', () => {
  const etat = combat([...cartes(1, ESTOC_REMISE), ...cartes(4, DAGUE)], ennemi({ pv: 100, degats: 5 }))
  const apres = jouerCarte(etat, autreQue(etat, 'Estoc'), 0, rng())
  const tourSuivant = finDuTour(apres, createRng(1))
  egal(tourSuivant.attaquesCeTour, 0, 'un enchainement ne traverse pas le tour')
})

cas('une main n’est morte que si rien n’est payable AU PRIX REMIS', () => {
  let etat = combat([...cartes(1, ESTOC_REMISE), ...cartes(4, DAGUE)], ennemi({ pv: 100, degats: 5 }))
  // Quatre dagues jouees : il reste 1 point d’action et l’estoc est a zero.
  for (let i = 0; i < 4; i += 1) etat = jouerCarte(etat, autreQue(etat, 'Estoc'), 0, rng())
  verifie(!mainMorte(etat), 'l’estoc gratuit se joue encore')
})

// --- frapper avec sa defense -------------------------------------------------

const BLOQUER_TEST = { nom: 'Bloquer', cout: 1, degats: 0, effets: [{ type: 'bloc' as const, montant: 5 }] }
const COUP_BOUCLIER = { nom: 'Coup de bouclier', cout: 2, degats: 0, degatsDuBloc: true }

cas('sans defense, le coup de bouclier ne fait rien', () => {
  const etat = combat([...cartes(1, COUP_BOUCLIER), ...cartes(4, DAGUE)], ennemi({ pv: 100, degats: 5 }))
  egal(degatsDe(etat.main[ou(etat, 'Coup de bouclier')]!, etat), 0, 'on frappe avec ce qu’on a')
})

cas('il inflige exactement la defense posee', () => {
  const etat = combat(
    [...cartes(1, COUP_BOUCLIER), ...cartes(4, BLOQUER_TEST)],
    ennemi({ pv: 100, degats: 5 }),
  )
  const garde = jouerCarte(etat, autreQue(etat, 'Coup de bouclier'), 0, rng())
  egal(garde.bloc, 5, 'une garde posee')
  const frappe = jouerCarte(garde, ou(garde, 'Coup de bouclier'), 0, rng())
  egal(frappe.ennemis[0]!.pv, 95, 'cinq de defense, cinq de degats')
})

cas('deux gardes valent deux fois plus', () => {
  const etat = combat(
    [...cartes(1, COUP_BOUCLIER), ...cartes(4, BLOQUER_TEST)],
    ennemi({ pv: 100, degats: 5 }),
  )
  let apres = jouerCarte(etat, autreQue(etat, 'Coup de bouclier'), 0, rng())
  apres = jouerCarte(apres, autreQue(apres, 'Coup de bouclier'), 0, rng())
  const frappe = jouerCarte(apres, ou(apres, 'Coup de bouclier'), 0, rng())
  egal(frappe.ennemis[0]!.pv, 90, 'dix de defense, dix de degats')
})

cas('il designe un corps meme quand il vaut zero', () => {
  const etat = combat([...cartes(1, COUP_BOUCLIER), ...cartes(4, DAGUE)], ennemi({ pv: 100, degats: 5 }))
  egal(portee(etat.main[ou(etat, 'Coup de bouclier')]!), 'une', 'la portee est une propriete du verbe')
})

cas('et il compte comme une attaque pour la remise', () => {
  const etat = combat(
    [...cartes(1, COUP_BOUCLIER), ...cartes(1, ESTOC_REMISE), ...cartes(3, DAGUE)],
    ennemi({ pv: 100, degats: 5 }),
  )
  const apres = jouerCarte(etat, ou(etat, 'Coup de bouclier'), 0, rng())
  egal(apres.attaquesCeTour, 1, 'frapper a zero reste frapper')
  egal(coutDe(apres.main[ou(apres, 'Estoc')]!, apres), 2, 'donc l’estoc escompte')
})

// --- riposter, et etourdir ---------------------------------------------------

const RIPOSTE_TEST = { nom: 'Riposte', cout: 2, degats: 0, effets: [{ type: 'riposte' as const, montant: 4 }] }
const PROJECTION_TEST = { nom: 'Projection', cout: 2, degats: 3, effets: [{ type: 'etourdit' as const }] }

cas('la riposte frappe celui qui vous attaque', () => {
  const etat = combat([...cartes(1, RIPOSTE_TEST), ...cartes(4, DAGUE)], ennemi({ pv: 100, degats: 5 }))
  const posee = jouerCarte(etat, ou(etat, 'Riposte'), 0, rng())
  const apres = finDuTour(posee, createRng(1))
  egal(apres.ennemis[0]!.pv, 96, 'quatre points, rendus a celui qui a frappe')
})

cas('elle frappe CHAQUE assaillant, pas un seul', () => {
  const etat = groupe([...cartes(1, RIPOSTE_TEST), ...cartes(4, DAGUE)], [
    ennemi({ pv: 100, degats: 5 }),
    ennemi({ pv: 100, degats: 5 }),
  ])
  const posee = jouerCarte(etat, ou(etat, 'Riposte'), 0, rng())
  const apres = finDuTour(posee, createRng(1))
  verifie(apres.ennemis[0]!.pv === 96 && apres.ennemis[1]!.pv === 96, 'les deux ont paye leur coup')
})

cas('elle ne traverse pas le tour', () => {
  const etat = combat([...cartes(1, RIPOSTE_TEST), ...cartes(4, DAGUE)], ennemi({ pv: 100, degats: 5 }))
  const posee = jouerCarte(etat, ou(etat, 'Riposte'), 0, rng())
  const unTour = finDuTour(posee, createRng(1))
  egal(unTour.riposte, 0, 'elle tombe avec le bloc')
  const deuxTours = finDuTour(unTour, createRng(2))
  egal(deuxTours.ennemis[0]!.pv, 96, 'le second coup ne coute plus rien')
})

cas('un ennemi tue par la riposte meurt pour de bon', () => {
  const etat = combat([...cartes(1, RIPOSTE_TEST), ...cartes(4, DAGUE)], ennemi({ pv: 3, degats: 5 }))
  const posee = jouerCarte(etat, ou(etat, 'Riposte'), 0, rng())
  const apres = finDuTour(posee, createRng(1))
  egal(apres.ennemis[0]!.pv, 0, 'quatre points sur trois PV')
  egal(apres.issue, 'victoire', 'et le dernier corps tombe gagne le combat')
})

cas('etourdir rend a l’ennemi sa periode entiere', () => {
  const etat = combat(
    [...cartes(1, PROJECTION_TEST), ...cartes(4, DAGUE)],
    ennemi({ pv: 100, degats: 5, periode: 3, compteur: 1 }),
  )
  const apres = jouerCarte(etat, ou(etat, 'Projection'), 0, rng())
  egal(apres.ennemis[0]!.compteur, 3, 'il recommence a attendre')
  egal(apres.ennemis[0]!.pv, 97, 'et il a quand meme pris ses degats')
})

cas('...donc il ne frappe pas ce tour-ci', () => {
  const etat = combat(
    [...cartes(1, PROJECTION_TEST), ...cartes(4, DAGUE)],
    ennemi({ pv: 100, degats: 5, periode: 3, compteur: 1 }),
  )
  const sans = finDuTour(etat, createRng(1))
  const avec = finDuTour(jouerCarte(etat, ou(etat, 'Projection'), 0, rng()), createRng(1))
  egal(sans.pv, 25, 'sans projection, le coup passe')
  egal(avec.pv, 30, 'avec, il est annule')
})

if (echecs > 0) throw new Error(`${echecs} vérification(s) en échec`)
console.log('Tout passe.')

// --- l'esquive : une chance sur deux d'eviter la prochaine attaque ----------

{
  // UN RNG TRUQUE : on ne verifie pas le hasard, on verifie la REGLE. Les deux
  // issues doivent etre atteignables, et chacune se teste separement.
  const toujours: Rng = { next: () => 0, getState: () => 0 }
  const jamais: Rng = { next: () => 0.99, getState: () => 0 }

  const deck = cartes(5, {
    nom: 'Esquive',
    cout: 1,
    degats: 0,
    effets: [{ type: 'esquive' }],
  })
  const frappeur = ennemi({ pv: 40, degats: 9 })

  const pose = jouerCarte(combat(deck, frappeur), 0, 0, rng())
  verifie(pose.esquive, "l'esquive s'arme en jouant la carte")

  const evite = finDuTour(pose, toujours)
  verifie(evite.pv === pose.pv, 'une esquive reussie annule la frappe')
  verifie(!evite.esquive, 'et elle est consommee')

  const ratee = finDuTour(pose, jamais)
  verifie(ratee.pv === pose.pv - 9, 'une esquive ratee laisse passer le coup')
  verifie(!ratee.esquive, '...et elle est consommee aussi')

  // SANS ESQUIVE ARMEE, le RNG ne change rien : la regle ne doit pas se
  // declencher toute seule.
  const nu = combat(deck, frappeur)
  verifie(finDuTour(nu, toujours).pv === nu.pv - 9, 'sans esquive, le coup passe')
}

/**
 * LA VIGILANCE : du bloc qui se compte sur ce qu'on N'A PAS ENCORE JOUÉ.
 *
 * Proposée par Keko — « bloque 1 pour chaque carte dans votre main, au moment
 * où est jouée la carte ». *C'est ce qui en fait autre chose qu'une
 * Protection* : son montant dépend de l'ordre des coups, donc elle récompense
 * de se couvrir d'abord — l'exact inverse de la remise de l'Estoc.
 */
{
  const deck = cartes(10, {
    nom: 'Vigilance',
    cout: 1,
    degats: 0,
    effets: [{ type: 'blocParCarte', montant: 1 }],
  })
  const etat = combat(deck, ennemi({ pv: 40, degats: 8 }))

  // ELLE NE SE COMPTE PAS ELLE-MÊME : `jouerCarte` la retire de la main avant
  // de résoudre, donc ce qu'elle compte est bien ce qui RESTE.
  const premiere = jouerCarte(etat, 0, 0, rng())
  egal(premiere.bloc, etat.main.length - 1, 'la Vigilance bloque une fois par carte restante')

  // L'ORDRE DÉCIDE, et c'est tout son intérêt : jouée en second, elle vaut un
  // point de moins. *Une Protection, elle, vaudrait la même chose.*
  const seconde = jouerCarte(premiere, 0, 0, rng())
  egal(seconde.bloc - premiere.bloc, premiere.main.length - 1, '...une de moins au coup suivant')
  verifie(seconde.bloc - premiere.bloc < premiere.bloc, 'donc se couvrir tot rapporte plus')

  // MAIN VIDE, BLOC NUL : le bout de l'échelle, pas une erreur à corriger.
  const seule = { ...etat, main: [etat.main[0]!] }
  egal(jouerCarte(seule, 0, 0, rng()).bloc, 0, 'derniere carte en main : elle ne bloque rien')

  // ELLE NE DÉSIGNE PERSONNE — c'est du bloc, donc sa portée est « aucune ».
  verifie(!viseUneCible(etat.main[0]!), 'la Vigilance ne vise aucun corps')
}

/**
 * **PIOCHER : le verbe de la Robe.**
 *
 * *C'est le premier effet qui touche au deck au milieu d'un tour*, donc il
 * consomme le RNG seedé — et c'est pour lui que `jouerCarte` le reçoit.
 */
{
  const deck = cartes(8, {
    nom: 'Concentration',
    cout: 1,
    degats: 0,
    effets: [{ type: 'pioche', montant: 2 }],
  })
  const etat = combat(deck, ennemi({ pv: 40, degats: 8 }))

  const apres = jouerCarte(etat, 0, 0, rng())
  egal(apres.main.length, etat.main.length - 1 + 2, 'piocher remplit la main')
  egal(apres.pioche.length, etat.pioche.length - 2, '...en prenant sur le tas')
  egal(apres.ennemis[0]!.pv, 40, 'et elle ne frappe personne')

  // LE TAS VIDE NE BLOQUE RIEN : on reverse la défausse, exactement comme la
  // fin de tour. *Deux façons de piocher se désaccorderaient au premier
  // réglage*, donc les deux passent par la même porte.
  const sec = { ...etat, pioche: [], defausse: [...deck.slice(5)] }
  const reverse = jouerCarte(sec, 0, 0, rng())
  egal(reverse.main.length, sec.main.length - 1 + 2, 'le tas vide se remelange pour piocher')

  // ELLE PEUT SE REPIOCHER ELLE-MÊME, et c'est juste : *la carte part à la
  // défausse AVANT que son effet ne joue*, donc le remélange la retrouve. C'est
  // ce que fait le genre, et ça ne demande aucune exception.
  const vide = { ...etat, pioche: [], defausse: [] }
  const seule = jouerCarte(vide, 0, 0, rng())
  egal(seule.main.length, vide.main.length, 'a sec, la carte jouee se repioche')

  // ET ON NE PIOCHE JAMAIS PLUS QUE CE QUI EXISTE : *c'est une carte, pas une
  // promesse.* Un trésor s'exile, donc il ne revient pas alimenter le tas.
  const exilee = { ...deck[0]!, exil: true }
  const sansRetour = jouerCarte(
    { ...etat, main: [exilee], pioche: [], defausse: [] },
    0,
    0,
    rng(),
  )
  egal(sansRetour.main.length, 0, 'rien a piocher, rien ne vient')
}

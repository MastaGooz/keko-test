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
import type { Carte, ConfigCombat, Ennemi, EtatCombat } from './combat.ts'
import {
  consequence,
  creerCombat,
  finDuTour,
  jouerCarte,
  mainMorte,
  menaceDuTour,
  reordonnerMain,
  vivants,
} from './combat.ts'

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
  const gagne = jouerCarte(etat, 0, 0)
  egal(gagne.issue, 'victoire', 'le combat est bien fini')
  egal(reordonnerMain(gagne, 0, 2), gagne, 'etat inchange')
})

// --- le tour -----------------------------------------------------------------

cas('la carte résout tout de suite et consomme son énergie', () => {
  const etat = combat(cartes(6, MOULINET), ennemi({ pv: 100, degats: 5 }))
  const apres = jouerCarte(etat, 0, 0)

  egal(apres.ennemis[0].pv, 84, 'dégâts appliqués')
  egal(apres.energie, 1, 'énergie restante')
  egal(apres.pv, 30, 'l\'ennemi n\'a pas encore riposté')
  egal(apres.tour, 1, 'toujours le même tour')
})

cas('une carte trop chère ne se joue pas', () => {
  const etat = combat(cartes(6, MOULINET), ennemi({ pv: 100, degats: 5 }))
  const apres = jouerCarte(etat, 0, 0)
  const refus = jouerCarte(apres, 0, 0)

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

  const apres = jouerCarte(etat, 0, 0)
  egal(menaceDuTour(apres), 3, 'le mort ne frappe plus')
  egal(finDuTour(apres, rng()).pv, 27, 'seul le survivant a frappé')
})

cas('la victoire demande que tous soient à terre', () => {
  const etat = groupe(cartes(6, MOULINET), [
    ennemi({ pv: 16, degats: 1 }),
    ennemi({ pv: 16, degats: 1, nom: 'Second' }),
  ])
  const un = jouerCarte(etat, 0, 0)
  egal(un.issue, null, 'un mort ne suffit pas')
  egal(un.energie, 1, 'énergie dépensée')

  // Le second moulinet coûte 4 : il faut passer un tour pour le payer.
  const t2 = finDuTour(un, rng())
  const deux = jouerCarte(t2, t2.main.findIndex((c) => c.type === 'combat'), 1)
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
  const apres = finDuTour(jouerCarte(etat, 0, 0), rng())

  egal(apres.energie, 5, 'rechargée à plein, pas cumulée')
})

cas('un trésor ne se joue pas', () => {
  const etat = combat(tresors(10), ennemi({ pv: 100, degats: 1 }))
  const apres = jouerCarte(etat, 0, 0)

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

  const apres = jouerCarte(etat, 0, 0)
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
  jouerCarte(etat, 0, 0)
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
  const apres = jouerCarte(etat, 0, 0)

  egal(consequence(etat, etat.main[0], 0).abordable, true, 'à 5 énergie')
  egal(consequence(apres, apres.main[0], 0).abordable, false, 'à 1 énergie')
})

// --- plusieurs ennemis -------------------------------------------------------

cas('un coup ne touche que sa cible', () => {
  const etat = groupe(cartes(6, MOULINET), [
    ennemi({ pv: 40, degats: 5 }),
    ennemi({ pv: 40, degats: 5, nom: 'Second' }),
  ])
  const apres = jouerCarte(etat, 0, 1)

  egal(apres.ennemis[0].pv, 40, 'le premier est intact')
  egal(apres.ennemis[1].pv, 24, 'seul le visé encaisse')
})

cas('un mort ne frappe plus et quitte la liste des vivants', () => {
  const etat = groupe(cartes(6, MOULINET), [
    ennemi({ pv: 16, degats: 5 }),
    ennemi({ pv: 100, degats: 5, nom: 'Second' }),
  ])
  const apres = jouerCarte(etat, 0, 0)

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

function cartes(nombre: number, modele: { nom: string; cout: number; degats: number }): Carte[] {
  return Array.from({ length: nombre }, (_, i) => ({
    id: `${modele.nom}-${i + 1}`,
    nom: modele.nom,
    type: 'combat' as const,
    cout: modele.cout,
    degats: modele.degats,
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

if (echecs > 0) throw new Error(`${echecs} vérification(s) en échec`)
console.log('Tout passe.')

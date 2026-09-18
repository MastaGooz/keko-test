/**
 * Vérification des règles de combat, sans navigateur ni dépendance :
 *   npm run verif
 *
 * Ce n'est pas une suite de tests à maintenir, c'est la preuve que les règles
 * tranchées avec Keko font bien ce qu'elles disent — en particulier celles qui
 * se discutent mal sur le papier : la résolution immédiate suivie du temps
 * acheté, et ce qu'un mort cesse de faire.
 */
import { createRng } from './rng.ts'
import type { Carte, ConfigCombat, Ennemi, EtatCombat } from './combat.ts'
import {
  consequence,
  coutDuVol,
  creerCombat,
  jouerCarte,
  mainMorte,
  passer,
  prevoir,
  vivants,
} from './combat.ts'

const CONFIG: ConfigCombat = { pvMax: 30, tailleMain: 5, periodePioche: 5 }

const MOULINET = { nom: 'Moulinet', vitesse: 4, degats: 16 }

let echecs = 0

console.log('Règles de combat :')

// --- le temps ----------------------------------------------------------------

cas('la carte résout AVANT que le temps ne s\'écoule', () => {
  // Moulinet (4 temps) contre un ennemi qui frappe tous les 2 : le coup porte
  // d'abord, puis on encaisse les deux frappes du temps acheté.
  const etat = combat(cartes(6, MOULINET), ennemi({ pv: 100, degats: 5, periode: 2 }))
  const apres = jouerCarte(etat, 0, 0, rng())

  egal(apres.ennemis[0].pv, 84, 'dégâts appliqués tout de suite')
  egal(apres.pv, 20, 'deux frappes encaissées pendant les 4 temps')
  egal(apres.temps, 4, 'temps dépensé')
})

cas('un ennemi qui survit frappe pendant le temps acheté', () => {
  const etat = combat(cartes(6, MOULINET), ennemi({ pv: 30, degats: 5, periode: 4 }))
  const apres = jouerCarte(etat, 0, 0, rng())

  egal(apres.issue, null, 'issue')
  egal(apres.ennemis[0].pv, 14, 'PV de l\'ennemi')
  egal(apres.pv, 25, 'PV du joueur')
  egal(apres.ennemis[0].compteur, 4, 'compteur ennemi rechargé')
})

cas('achever une cible annule TOUTES ses frappes du temps acheté', () => {
  // Le premier frappait aux tics 2 et 4 ; abattu d'entrée, il ne frappe pas du
  // tout. Le second, lui, frappe au tic 4.
  const etat = groupe(cartes(10, MOULINET), [
    ennemi({ pv: 16, degats: 5, periode: 2 }),
    ennemi({ pv: 99, degats: 3, periode: 4, nom: 'Second' }),
  ])
  const apres = jouerCarte(etat, 0, 0, rng())

  egal(apres.ennemis[0].pv, 0, 'cible abattue')
  egal(apres.pv, 27, 'seule la frappe du survivant est encaissée')
  egal(apres.issue, null, 'le combat continue')
})

cas('le coup qui gagne ne coûte aucun temps', () => {
  const etat = combat(cartes(6, MOULINET), ennemi({ pv: 16, degats: 5, periode: 2 }))
  const c = consequence(etat, etat.main[0], 0)
  const apres = jouerCarte(etat, 0, 0, rng())

  egal(c.gagne, true, 'le coup gagne')
  egal(c.cout, 0, 'aucun temps annoncé')
  egal(apres.issue, 'victoire', 'issue')
  egal(apres.temps, 0, 'le temps ne s\'est pas écoulé')
  egal(apres.pv, 30, 'aucune riposte')
})

cas('une carte à vitesse 0 résout sans faire avancer le temps', () => {
  const etat = combat(
    cartes(10, { nom: 'Pichenette', vitesse: 0, degats: 5 }),
    ennemi({ pv: 100, degats: 5, periode: 3 }),
  )
  const apres = jouerCarte(etat, 0, 0, rng())

  egal(apres.ennemis[0].pv, 95, 'dégâts appliqués')
  egal(apres.temps, 0, 'temps figé')
  egal(apres.ennemis[0].compteur, etat.ennemis[0].compteur, 'compteur ennemi intact')
  egal(apres.defausse.length, 1, 'carte défaussée')
})

// --- la main -----------------------------------------------------------------

cas('passer avance jusqu\'à la pioche et fait frapper l\'ennemi en chemin', () => {
  const etat = combat(cartes(10, MOULINET), ennemi({ pv: 100, degats: 5, periode: 2 }))
  const apres = passer(etat, rng())

  egal(apres.pv, 20, 'PV du joueur (frappes aux tics 2 et 4)')
  egal(apres.main.length, 5, 'main repiochée')
  egal(apres.compteurPioche, 5, 'compteur de pioche rechargé')
})

cas('la pioche renouvelle TOUTE la main', () => {
  const etat = combat(cartes(10, MOULINET), ennemi({ pv: 100, degats: 5, periode: 10 }))
  const avant = etat.main.map((carte) => carte.id)
  const apres = passer(etat, rng())
  const communes = apres.main.filter((carte) => avant.includes(carte.id))

  egal(apres.main.length, 5, 'taille de la main')
  egal(communes.length, 0, 'cartes conservées de l\'ancienne main')
  egal(apres.defausse.length, 5, 'ancienne main envoyée à la défausse')
})

cas('un trésor ne se joue pas', () => {
  const etat = combat(tresors(10), ennemi({ pv: 100, degats: 5, periode: 10 }))
  const apres = jouerCarte(etat, 0, 0, rng())

  verifie(mainMorte(etat), 'la main devrait être morte')
  verifie(apres === etat, 'l\'état devrait être inchangé, à l\'identique')
})

cas('une main morte ne bloque jamais la partie', () => {
  const alea = rng()
  let etat = combat(tresors(10), ennemi({ pv: 100, degats: 4, periode: 3 }))
  for (let i = 0; i < 3; i += 1) etat = passer(etat, alea)

  verifie(etat.pv < CONFIG.pvMax, 'le joueur devrait avoir encaissé')
  egal(etat.issue, null, 'issue')
  egal(etat.main.length, 5, 'main repiochée')
  egal(etat.compteurPioche, 5, 'compteur de pioche rechargé')
})

cas('la défausse est remélangée quand la pioche est vide', () => {
  const etat = combat(cartes(7, MOULINET), ennemi({ pv: 100, degats: 5, periode: 10 }))
  egal(etat.pioche.length, 2, 'pioche restante après la main de départ')

  const apres = passer(etat, rng())
  egal(apres.main.length, 5, 'main complétée malgré la pioche trop courte')
  egal(apres.pioche.length, 2, 'reliquat après remélange de la défausse')
  egal(apres.defausse.length, 0, 'défausse vidée dans la pioche')
})

cas('la mort interrompt l\'écoulement du temps', () => {
  const etat = combat(cartes(10, MOULINET), ennemi({ pv: 100, degats: 10, periode: 1 }))
  const apres = passer(etat, rng())

  egal(apres.issue, 'defaite', 'issue')
  egal(apres.pv, 0, 'PV du joueur')
  egal(apres.compteurPioche, 2, 'temps arrêté au 3e tic')
  egal(apres.defausse.length, 0, 'aucune pioche après la mort')
})

cas('les transitions ne modifient pas l\'état reçu', () => {
  const etat = combat(cartes(6, MOULINET), ennemi({ pv: 100, degats: 5, periode: 2 }))
  const temoin = JSON.stringify(etat)
  jouerCarte(etat, 0, 0, rng())
  passer(etat, rng())

  egal(JSON.stringify(etat), temoin, 'état d\'origine')
})

// --- la prévision et la conséquence ------------------------------------------

cas('la prévision décrit le coût du temps, pas la carte', () => {
  const etat = combat(cartes(10, MOULINET), ennemi({ pv: 100, degats: 5, periode: 3 }))
  const prevues = prevoir(etat, 10).map((p) => `${p.dans}:${p.type}`)

  egal(
    prevues.join(' '),
    '3:frappe 5:pioche 6:frappe 9:frappe 10:pioche',
    'déroulé prévu sur 10 tics',
  )
})

cas('la conséquence compte ce qu\'on encaisse pendant le temps acheté', () => {
  // Frappe dans 2 puis tous les 3 : sur les 4 temps du moulinet, une seule.
  const etat = combat(cartes(10, MOULINET), ennemi({ pv: 100, degats: 6, periode: 3, compteur: 2 }))
  const c = consequence(etat, etat.main[0], 0)

  egal(c.cout, 4, 'temps acheté')
  egal(c.frappes, 1, 'frappes encaissées')
  egal(c.degats, 6, 'dégâts encaissés')
  egal(c.tue, false, 'ennemi debout')
  egal(c.mortel, false, 'joueur debout')
})

cas('la conséquence sait qu\'un mort ne riposte plus', () => {
  const etat = groupe(cartes(10, MOULINET), [
    ennemi({ pv: 16, degats: 6, periode: 2 }),
    ennemi({ pv: 99, degats: 1, periode: 9, nom: 'Second' }),
  ])
  const c = consequence(etat, etat.main[0], 0)

  egal(c.tue, true, 'la cible est achevée')
  egal(c.gagne, false, 'il en reste un debout')
  egal(c.frappes, 0, 'la cible ne frappe plus, l\'autre pas encore')
})

cas('la conséquence prévient quand le joueur tombe pendant le temps', () => {
  const etat = combat(cartes(10, MOULINET), ennemi({ pv: 100, degats: 20, periode: 2, compteur: 2 }))
  const c = consequence(etat, etat.main[0], 0)

  egal(c.mortel, true, 'le joueur tombe')
  egal(c.tue, false, 'la cible survit')
})

cas('la conséquence signale la carte qui déborde de la main', () => {
  const etat = combat(cartes(10, MOULINET), ennemi({ pv: 100, degats: 1, periode: 9 }))
  const lente = { id: 'x', nom: 'Masse', type: 'combat' as const, vitesse: 6, degats: 3 }

  egal(consequence(etat, etat.main[0], 0).tientDansLaMain, true, 'le moulinet tient à 4')
  egal(consequence(etat, lente, 0).tientDansLaMain, false, 'la masse déborde des 5')
})

// --- plusieurs ennemis -------------------------------------------------------

cas('un coup ne touche que sa cible', () => {
  const etat = groupe(cartes(10, MOULINET), [
    ennemi({ pv: 40, degats: 5, periode: 9 }),
    ennemi({ pv: 40, degats: 5, periode: 9, nom: 'Second' }),
  ])
  const apres = jouerCarte(etat, 0, 1, rng())

  egal(apres.ennemis[0].pv, 40, 'le premier est intact')
  egal(apres.ennemis[1].pv, 24, 'seul le visé encaisse')
})

cas('tous les ennemis frappent pendant le temps acheté', () => {
  // Sur 4 temps : le premier aux tics 2 et 4, le second au tic 3.
  const etat = groupe(cartes(10, MOULINET), [
    ennemi({ pv: 99, degats: 5, periode: 2 }),
    ennemi({ pv: 99, degats: 3, periode: 3, nom: 'Second' }),
  ])
  const vol = coutDuVol(etat, 4)

  egal(vol.frappes, 3, 'frappes des deux corps')
  egal(vol.degats, 13, 'dégâts cumulés (5 + 3 + 5)')
  egal(jouerCarte(etat, 0, 0, rng()).pv, 17, 'PV réels après le coup')
})

cas('la victoire demande que tous soient à terre', () => {
  const etat = groupe(cartes(10, MOULINET), [
    ennemi({ pv: 16, degats: 1, periode: 9 }),
    ennemi({ pv: 16, degats: 1, periode: 9, nom: 'Second' }),
  ])
  const un = jouerCarte(etat, 0, 0, rng())
  egal(un.issue, null, 'un mort ne suffit pas')

  const deux = jouerCarte(un, 0, 1, rng())
  egal(deux.issue, 'victoire', 'les deux à terre')
})

cas('un mort ne frappe plus et quitte la prévision', () => {
  const etat = groupe(cartes(10, MOULINET), [
    ennemi({ pv: 16, degats: 5, periode: 3 }),
    ennemi({ pv: 99, degats: 5, periode: 3, nom: 'Second' }),
  ])
  const apres = jouerCarte(etat, 0, 0, rng())
  const frappes = prevoir(apres, 6).filter((p) => p.type === 'frappe')

  egal(vivants(apres).length, 1, 'un seul debout')
  verifie(frappes.every((f) => f.ennemi === 1), 'seul le survivant apparaît encore')
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
  periode: number
  compteur?: number
  nom?: string
}): Ennemi {
  return {
    nom: traits.nom ?? 'Mannequin',
    pv: traits.pv,
    pvMax: traits.pv,
    degats: traits.degats,
    periode: traits.periode,
    compteur: traits.compteur ?? traits.periode,
  }
}

function cartes(nombre: number, modele: { nom: string; vitesse: number; degats: number }): Carte[] {
  return Array.from({ length: nombre }, (_, i) => ({
    id: `${modele.nom}-${i + 1}`,
    nom: modele.nom,
    type: 'combat' as const,
    vitesse: modele.vitesse,
    degats: modele.degats,
  }))
}

function tresors(nombre: number): Carte[] {
  return Array.from({ length: nombre }, (_, i) => ({
    id: `tresor-${i + 1}`,
    nom: 'Idole',
    type: 'tresor' as const,
    vitesse: 0,
    degats: 0,
  }))
}

if (echecs > 0) throw new Error(`${echecs} vérification(s) en échec`)
console.log('Tout passe.')

/**
 * Vérification des règles de combat, sans navigateur ni dépendance :
 *   npm run verif
 *
 * Ce n'est pas une suite de tests à maintenir, c'est la preuve que les règles
 * tranchées avec Keko font bien ce qu'elles disent — en particulier les deux
 * qui se discutent mal sur le papier : la résolution en fin de temps et
 * l'égalité au profit du joueur.
 */
import { createRng } from './rng.ts'
import type { Carte, ConfigCombat, Ennemi, EtatCombat } from './combat.ts'
import { creerCombat, jouerCarte, mainMorte, passer } from './combat.ts'

const CONFIG: ConfigCombat = { pvMax: 30, tailleMain: 5, periodePioche: 5 }

const MOULINET = { nom: 'Moulinet', vitesse: 4, degats: 16 }

let echecs = 0

console.log('Règles de combat :')

// --- les cas -----------------------------------------------------------------

cas('la carte résout à la FIN de son temps, pas à l\'engagement', () => {
  // Moulinet (4) contre un ennemi qui frappe tous les 2 : il frappe d'abord,
  // le coup tombe après. Si la carte résolvait tout de suite, l'ennemi mourrait
  // avant d'avoir frappé et on serait encore à 30 PV.
  const etat = combat(cartes(6, MOULINET), ennemi({ pv: 16, degats: 5, periode: 2 }))
  const apres = jouerCarte(etat, 0, rng())

  egal(apres.issue, 'victoire', 'issue')
  egal(apres.pv, 25, 'PV du joueur (une frappe encaissée au tic 2)')
})

cas('à égalité, la carte du joueur passe avant la frappe ennemie', () => {
  // Moulinet (4) contre un compteur à 4 : tuer pile à temps doit marcher.
  const etat = combat(cartes(6, MOULINET), ennemi({ pv: 16, degats: 5, periode: 4 }))
  const apres = jouerCarte(etat, 0, rng())

  egal(apres.issue, 'victoire', 'issue')
  egal(apres.pv, 30, 'PV du joueur (aucune frappe : l\'ennemi meurt avant)')
})

cas('à égalité, si l\'ennemi survit il frappe quand même', () => {
  const etat = combat(cartes(6, MOULINET), ennemi({ pv: 30, degats: 5, periode: 4 }))
  const apres = jouerCarte(etat, 0, rng())

  egal(apres.issue, null, 'issue')
  egal(apres.ennemi.pv, 14, 'PV de l\'ennemi')
  egal(apres.pv, 25, 'PV du joueur')
  egal(apres.ennemi.compteur, 4, 'compteur ennemi rechargé')
})

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
  const apres = jouerCarte(etat, 0, rng())

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
  jouerCarte(etat, 0, rng())
  passer(etat, rng())

  egal(JSON.stringify(etat), temoin, 'état d\'origine')
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
  return creerCombat(deck, adversaire, rng(), CONFIG)
}

function ennemi(traits: { pv: number; degats: number; periode: number }): Ennemi {
  return {
    nom: 'Mannequin',
    pv: traits.pv,
    pvMax: traits.pv,
    degats: traits.degats,
    periode: traits.periode,
    compteur: traits.periode,
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

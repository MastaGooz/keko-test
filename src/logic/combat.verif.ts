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
import { consequence, coutDuVol, creerCombat, jouerCarte, mainMorte, passer, prevoir, vivants } from './combat.ts'

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
  const apres = jouerCarte(etat, 0, 0, rng())

  egal(apres.issue, 'victoire', 'issue')
  egal(apres.pv, 25, 'PV du joueur (une frappe encaissée au tic 2)')
})

cas('à égalité, la carte du joueur passe avant la frappe ennemie', () => {
  // Moulinet (4) contre un compteur à 4 : tuer pile à temps doit marcher.
  const etat = combat(cartes(6, MOULINET), ennemi({ pv: 16, degats: 5, periode: 4 }))
  const apres = jouerCarte(etat, 0, 0, rng())

  egal(apres.issue, 'victoire', 'issue')
  egal(apres.pv, 30, 'PV du joueur (aucune frappe : l\'ennemi meurt avant)')
})

cas('à égalité, si l\'ennemi survit il frappe quand même', () => {
  const etat = combat(cartes(6, MOULINET), ennemi({ pv: 30, degats: 5, periode: 4 }))
  const apres = jouerCarte(etat, 0, 0, rng())

  egal(apres.issue, null, 'issue')
  egal(apres.ennemis[0].pv, 14, 'PV de l\'ennemi')
  egal(apres.pv, 25, 'PV du joueur')
  egal(apres.ennemis[0].compteur, 4, 'compteur ennemi rechargé')
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

cas('une carte à vitesse 0 résout sans faire avancer le temps', () => {
  const etat = combat(cartes(10, { nom: 'Pichenette', vitesse: 0, degats: 5 }), ennemi({ pv: 100, degats: 5, periode: 3 }))
  const apres = jouerCarte(etat, 0, 0, rng())

  egal(apres.ennemis[0].pv, 95, 'dégâts appliqués')
  egal(apres.temps, 0, 'temps figé')
  egal(apres.ennemis[0].compteur, etat.ennemis[0].compteur, 'compteur ennemi intact')
  egal(apres.defausse.length, 1, 'carte défaussée')
})

cas('la prévision annonce le déroulé à venir', () => {
  const etat = combat(cartes(10, MOULINET), ennemi({ pv: 100, degats: 5, periode: 3 }))
  const prevues = prevoir(etat, 10, etat.main[0]).map((p) => `${p.dans}:${p.type}`)

  egal(
    prevues.join(' '),
    '3:frappe 4:carte 5:pioche 6:frappe 9:frappe 10:pioche',
    'déroulé prévu sur 10 tics',
  )
})

cas('la prévision place la carte avant la frappe à égalité', () => {
  const etat = combat(cartes(10, { nom: 'Taillade', vitesse: 3, degats: 7 }), ennemi({ pv: 100, degats: 5, periode: 3 }))
  const prevues = prevoir(etat, 3, etat.main[0]).map((p) => p.type)

  egal(prevues.join(' '), 'carte frappe', 'ordre à égalité')
})

cas('la conséquence compte ce qu\'on encaisse avant la résolution', () => {
  // Frappe dans 2 puis tous les 3 ; le moulinet tombe à 4 : une seule frappe.
  const etat = combat(cartes(10, MOULINET), ennemi({ pv: 100, degats: 6, periode: 3, compteur: 2 }))
  const c = consequence(etat, etat.main[0], 0)

  egal(c.frappes, 1, 'frappes encaissées')
  egal(c.degats, 6, 'dégâts encaissés')
  egal(c.tue, false, 'ennemi debout')
  egal(c.mortel, false, 'joueur debout')
})

cas('la conséquence annonce le coup qui achève sans riposte', () => {
  // L'ennemi frappe pile quand la carte tombe : la carte passe avant et le tue.
  const etat = combat(cartes(10, MOULINET), ennemi({ pv: 16, degats: 6, periode: 4, compteur: 4 }))
  const c = consequence(etat, etat.main[0], 0)

  egal(c.tue, true, 'achevé')
  egal(c.frappes, 0, 'aucune riposte')
})

cas('la conséquence prévient quand la carte tue le joueur avant de tomber', () => {
  const etat = combat(cartes(10, MOULINET), ennemi({ pv: 100, degats: 20, periode: 2, compteur: 2 }))
  const c = consequence(etat, etat.main[0], 0)

  egal(c.mortel, true, 'le joueur tombe')
  egal(c.tue, false, 'la carte ne résout jamais')
})

cas('la conséquence signale la carte qui déborde de la main', () => {
  const etat = combat(cartes(10, MOULINET), ennemi({ pv: 100, degats: 1, periode: 9 }))
  const rapide = consequence(etat, { id: 'x', nom: 'Dague', type: 'combat', vitesse: 1, degats: 3 }, 0)

  egal(rapide.tientDansLaMain, true, 'la dague tient dans les 5')
  egal(consequence(etat, etat.main[0], 0).tientDansLaMain, true, 'le moulinet tient à 4')
})

cas('un coup ne touche que sa cible', () => {
  const etat = groupe(cartes(10, MOULINET), [
    ennemi({ pv: 40, degats: 5, periode: 9 }),
    ennemi({ pv: 40, degats: 5, periode: 9, nom: 'Second' }),
  ])
  const apres = jouerCarte(etat, 0, 1, rng())

  egal(apres.ennemis[0].pv, 40, 'le premier est intact')
  egal(apres.ennemis[1].pv, 24, 'seul le visé encaisse')
})

cas('tous les ennemis avancent pendant qu\'une carte est en vol', () => {
  // Moulinet (4) : le premier frappe aux tics 2 et 4, le second au tic 3.
  const etat = groupe(cartes(10, MOULINET), [
    ennemi({ pv: 99, degats: 5, periode: 2 }),
    ennemi({ pv: 99, degats: 3, periode: 3, nom: 'Second' }),
  ])
  const vol = coutDuVol(etat, 4)

  egal(vol.frappes, 3, 'frappes des deux corps')
  egal(vol.degats, 13, 'dégâts cumulés (5 + 3 + 5)')
  egal(jouerCarte(etat, 0, 0, rng()).pv, 17, 'PV après le vol de la carte')
})

cas('achever une cible fait taire ses frappes, pas celles des autres', () => {
  // Les deux frappent au tic 4, quand le moulinet tombe. Il achève le premier :
  // celui-là ne frappe pas, l'autre si.
  const etat = groupe(cartes(10, MOULINET), [
    ennemi({ pv: 16, degats: 5, periode: 4 }),
    ennemi({ pv: 99, degats: 3, periode: 4, nom: 'Second' }),
  ])
  const c = consequence(etat, etat.main[0], 0)
  const apres = jouerCarte(etat, 0, 0, rng())

  egal(c.tue, true, 'la cible est achevée')
  egal(c.gagne, false, 'il en reste un debout')
  egal(c.degats, 3, 'seule la frappe du survivant est encaissée')
  egal(apres.pv, 27, 'PV réels après le coup')
  egal(apres.issue, null, 'le combat continue')
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
  const frappes = prevoir(apres, 6, null).filter((p) => p.type === 'frappe')

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

function ennemi(traits: { pv: number; degats: number; periode: number; compteur?: number; nom?: string }): Ennemi {
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

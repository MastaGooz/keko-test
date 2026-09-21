/**
 * Le butin, les récompenses de palier et les groupes d'ennemis. Données pures.
 *
 * Le deck, lui, ne vient plus d'ici : il vient de l'équipement (`armes.ts`).
 */
import type { Carte, Ennemi } from './combat.ts'
import type { Rng } from './rng.ts'
import { randomInt } from './rng.ts'

import type { Modele } from './armes.ts'
import { GLAIVE } from './armes.ts'

/**
 * Un trésor en tant que carte : du poids qu'on transporte, **et une issue de
 * secours qu'on paie très cher**.
 *
 * Le pari est celui-ci : le but du jeu est de faire RESSORTIR les trésors, donc
 * en brûler un, c'est renoncer à son or — la carte est détruite, elle ne compte
 * plus dans le butin. Un joueur ne le fait pas de gaieté de coeur, il le fait
 * quand la run est en train de basculer. Et comme mourir fait TOUT perdre,
 * brûler reste meilleur que mourir avec ses trésors en main.
 *
 * **La puissance suit le prix**, et c'est ce qui rend le choix gradué plutôt
 * que binaire : on brûle une Aiguière sans trop y penser, une Couronne jamais
 * sans savoir ce qu'on jette. Un gradient, pas un interrupteur.
 *
 * *Conséquence heureuse* : les petits trésors cessent d'être du rebut. Ils
 * valent peu d'or mais ils sont une assurance bon marché, donc le bas de la
 * table redevient intéressant — alors qu'avant il ne valait jamais la place
 * qu'il prenait.
 *
 * **ET IL FAUT L'AVOIR EN MAIN.** C'est ce qui empêche le trésor de devenir une
 * réserve dans laquelle on puise : ce n'est pas une ressource, c'est une
 * occasion. La pioche décide si elle se présente.
 *
 * Le coût reste BAS, à dessein. Un coût prohibitif rendrait l'issue de secours
 * injouable au moment précis où elle sert — la barrière doit rester
 * économique, jamais mécanique.
 */
export function carteTresor(id: string, nom: string, valeur: number): Carte {
  return {
    id,
    nom,
    type: 'tresor',
    cout: COUT_TRESOR,
    degats: 0,
    valeur,
    effets: [{ type: 'soin', montant: soinDuTresor(valeur) }],
    exil: true,
  }
}

/**
 * Ce que coûte de brûler un trésor, en énergie.
 *
 * Bas exprès : ce qui doit retenir le joueur, c'est l'or qu'il détruit, pas
 * l'énergie qu'il dépense. Une issue de secours qu'on ne peut pas se payer au
 * moment où elle sert n'est pas une issue de secours.
 */
const COUT_TRESOR = 1

/**
 * Le soin qu'un trésor rend quand on le brûle, proportionnel à son prix.
 *
 * PROVISOIRE, et c'est un chiffre de combat donc un rasoir : à revoir par
 * simulation, et avec Keko pour la nature même de l'effet — soigner n'est
 * qu'une façon d'« éviter le pire », il y en aura d'autres.
 */
function soinDuTresor(valeur: number): number {
  return Math.round(valeur / DIVISEUR_SOIN)
}

/**
 * Le rapport prix → PV rendus. **Calibré par simulation, pas au jugé**, et
 * c'est le chiffre qui décide si le mécanisme existe. Balayage sur 400
 * descentes, politique « tout prendre », en comparant celui qui brûle dès qu'il
 * passe sous 30 PV à celui qui ne brûle jamais :
 *
 * | diviseur | ne brûle jamais | brûle sous 30 PV |
 * |---|---|---|
 * | 6 | 71 %, 418 d'or | 100 %, **397** d'or |
 * | **12** | 71 %, 418 d'or | 100 %, **282** d'or |
 * | 20 | 71 %, 418 d'or | 99 %, **228** d'or |
 *
 * À 6, brûler ne coûtait presque rien (−21 d'or) pour +29 points de survie :
 * **la cupidité devenait gratuite ET optimale**, l'exact contraire de ce qu'on
 * veut. À 20, brûler coûte si cher que l'option se referme et le trésor
 * redevient une carte morte avec du code en plus.
 *
 * À 12, l'arbitrage est réel et il n'a pas de bonne réponse : ne jamais brûler
 * rapporte plus en espérance (418 contre 282) mais tue une run sur trois.
 * *C'est au joueur de décider ce qu'il vaut mieux, et c'est tout ce qu'on
 * demande à un push-your-luck.*
 *
 * Exporté pour pouvoir le rebalayer. À refaire après toute retouche.
 */
export const DIVISEUR_SOIN = 12

/**
 * Des noms plutôt que « Trésor 1 » : une main pleine de babioles doit se lire
 * comme du butin encombrant, pas comme du remplissage. C'est la sensation
 * qu'on teste, autant qu'elle ait une chance d'exister.
 */
/**
 * Valeurs très inégales, et volontairement : à poids identique, le joueur
 * doit préférer peu de gros trésors à beaucoup de petits. Un Camée occupe
 * exactement la même place qu'une Couronne pour cinq fois moins d'or.
 */
const BUTIN: [string, number][] = [
  ['Couronne', 240], ['Diadème', 210], ['Sceptre', 185], ['Reliquaire', 160],
  ['Ostensoir', 140], ['Calice', 120], ['Cassette', 105], ['Idole', 90],
  ['Médaillon', 75], ['Torque', 65], ['Aiguière', 55], ['Camée', 45],
]

/**
 * La capacité du sac. Petite et quasi figée : c'est la contrainte permanente
 * du jeu, pas un axe de progression — le hub vend du levier, jamais de la
 * sécurité. Au-delà, le butin tombe dans le deck et pèse.
 */
export const CAPACITE_SAC = 3

/** Ce que vaut le contenu du sac — perdu aussi si le joueur meurt. */
export function valeurSac(sac: (Carte | null)[]): number {
  return sac.reduce((total, carte) => total + (carte?.valeur ?? 0), 0)
}

/* ---------------------------------------------------------------------- *
 * Les récompenses de la descente.
 * ---------------------------------------------------------------------- */

/**
 * Les modèles piochables en récompense. Ils viennent du set de l'arme de base :
 * une récompense doit parler le même langage que le deck qu'on porte.
 */
const [, TAILLADE_M, MOULINET_M] = GLAIVE.set.map((e) => e.modele) as [Modele, Modele, Modele]

/**
 * La carte proposée après un combat.
 *
 * **Jamais de Dague** : le deck de départ en contient déjà cinq sur dix, donc
 * en proposer une n'épaissit pas le deck, elle le dilue. La simulation était
 * formelle — avec des Dagues en récompense, prendre la carte ne faisait gagner
 * que 3 points de survie sur le trésor, et le dilemme central du jeu n'existait
 * pas. Une récompense doit valoir mieux que la moyenne de ce qu'on a déjà,
 * sinon ce n'est pas une récompense.
 */
export function carteRecompense(profondeur: number, rng: Rng, cle: string): Carte {
  const table: Modele[] =
    profondeur <= 2
      ? [TAILLADE_M, TAILLADE_M, MOULINET_M]
      : profondeur <= 4
        ? [TAILLADE_M, MOULINET_M, MOULINET_M]
        : [MOULINET_M]
  const modele = table[randomInt(rng, 0, table.length - 1)]!
  return { ...modele, id: `gagnee-${cle}` }
}

/**
 * Le trésor proposé après un combat. Plus on descend, plus il est gros : c'est
 * toute la raison de continuer au lieu de rentrer. Le butin est trié par
 * valeur décroissante, on pioche dans une fenêtre qui glisse vers le haut.
 */
export function tresorRecompense(profondeur: number, rng: Rng, cle: string): Carte {
  const trie = [...BUTIN].sort((a, b) => a[1] - b[1])
  const part = Math.min(1, (profondeur - 1) / (PROFONDEUR_ETALON - 1))
  const centre = part * (trie.length - 1)
  const bas = Math.max(0, Math.round(centre - 2))
  const haut = Math.min(trie.length - 1, Math.round(centre + 2))
  const [nom, valeur] = trie[randomInt(rng, bas, haut)]!
  return carteTresor(`butin-${cle}`, nom, valeur)
}

/** La profondeur à laquelle le butin atteint le haut de la table. */
const PROFONDEUR_ETALON = 8

/**
 * Le groupe rencontré à cette profondeur.
 *
 * Deux corrections que la simulation a imposées, et qu'il ne faut pas défaire :
 *
 * 1. **Seuls les dégâts bougent, jamais les PV.** Faire monter les deux
 *    allonge les combats ET les rend plus violents : les dégâts subis montent
 *    au carré, et il apparaissait un mur infranchissable au palier 5 qu'aucune
 *    quantité de PV ne déplaçait. C'est aussi ce que dit la décision de design
 *    — « ne pas aligner de gros sacs de PV », sinon l'achèvement devient
 *    impossible et le multi-cibles ne décide plus rien.
 *
 * 2. **Le dernier palier vaut le combat d'origine, les autres sont adoucis.**
 *    Les groupes ont été calibrés comme des duels au couteau : un seul coûte
 *    presque toute une barre de PV, on ne peut pas en enchaîner six. Plutôt
 *    que de les affaiblir, on en fait le FOND de la descente : `MENACE_DEPART`
 *    est la fraction de leur morsure au premier palier, et elle remonte à 1
 *    au dernier. La difficulté validée par Keko devient la ligne d'arrivée.
 *
 * ATTENTION : chiffre de combat, donc rasoir. À revérifier par simulation.
 */
export const MENACE_DEPART = 0.45

export function ennemisPourProfondeur(
  profondeur: number,
  profondeurMax: number,
  rng: Rng,
  menaceDepart: number = MENACE_DEPART,
): Ennemi[] {
  const groupe = GROUPES[randomInt(rng, 0, GROUPES.length - 1)]!
  const part = profondeurMax > 1 ? (profondeur - 1) / (profondeurMax - 1) : 1
  const facteur = menaceDepart + (1 - menaceDepart) * part
  return groupe.ennemis.map((ennemi) => ({
    ...ennemi,
    degats: Math.round(ennemi.degats * facteur),
  }))
}

/**
 * Groupes calibrés par simulation. Deux règles tenues :
 *
 * 1. La pression totale reste comparable d'un groupe à l'autre — c'est le
 *    nombre de corps qu'on fait varier, pas la difficulté brute.
 * 2. Les PV d'un corps restent à portée des cartes. Un groupe de gros sacs
 *    de PV ramène au rendement pur : sans achèvement possible, le Moulinet
 *    redevient le seul choix et le multi-cibles ne décide plus rien.
 *
 * `periode` se compte en TOURS : 1 = frappe chaque tour, 2 = un tour sur deux
 * en frappant plus fort. `compteur` est l'ouverture.
 */
export type Groupe = { nom: string; ennemis: Ennemi[] }

function ennemi(nom: string, pv: number, degats: number, periode: number, compteur: number): Ennemi {
  return { nom, pv, pvMax: pv, degats, periode, compteur }
}

export const GROUPES: Groupe[] = [
  {
    nom: 'Le Garde',
    ennemis: [ennemi('Garde', 70, 9, 1, 1)],
  },
  {
    nom: 'Deux roquets',
    ennemis: [ennemi('Roquet', 36, 5, 1, 1), ennemi('Cabot', 34, 5, 1, 1)],
  },
  {
    nom: 'La meute',
    ennemis: [
      ennemi('Meneur', 25, 4, 1, 1),
      ennemi('Suiveur', 23, 4, 1, 1),
      ennemi('Traînard', 23, 7, 2, 2),
    ],
  },
]

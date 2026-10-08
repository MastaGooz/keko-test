// LES FORMULES DU MODE PERSONNAGES, ET IL N'Y EN A QU'UN SEUL ENDROIT.
//
// Rarete, attaque, defense et domaine sortent tous d'ici. Le script de
// generation les applique, il ne les recopie pas : *deux endroits qui
// decrivent le meme calcul se desaccordent au premier reglage.*
//
// Pur, donc mesurable sans navigateur -- et c'est ce qui permet de rejouer tout
// l'equilibrage sur le JSON deja telecharge, sans rien redemander a Wikidata.

import type { Domaine, Rarete } from './types.ts'

/** Ce que les sources donnent d'un personnage, avant tout calcul. */
export interface Brut {
  langues: number
  vues: number
  taille: number
  metiers: string[]
  fiction: boolean
  /**
   * LA DESCRIPTION WIKIDATA, et c'est elle qui decide du domaine.
   *
   * Keko : « on peut directement donner plus de poids a la mention qui apparait
   * en premier ? car souvent dans la description on a au debut son role
   * principal ». *Et c'est exact* -- voir `domaineDe`.
   */
  description: string
}

export interface StatsDerivees {
  rarete: Rarete
  attaque: number
  defense: number
  domaine: Domaine
  /** Le score de notoriete, 0 a 1. Garde pour pouvoir juger les seuils. */
  notoriete: number
}

// ---------------------------------------------------------------- les reglages

/**
 * LES BORNES SONT LOGARITHMIQUES, ET CE N'EST PAS UN DETAIL. La notoriete suit
 * une loi de puissance : en echelle lineaire, Napoleon ecrase tout le monde et
 * quatre-vingt-quinze pour cent des cartes valent 1.
 */
const BORNES = {
  /** Nombre de Wikipedia qui ont l'article. */
  langues: [10, 250] as const,
  /** Vues de l'article FR sur 30 jours. */
  vues: [200, 400_000] as const,
  /** Octets de l'article FR. */
  taille: [3_000, 250_000] as const,
}

/** Ce que pesent les deux signaux dans le score de notoriete. */
const POIDS = { langues: 0.6, vues: 0.4 }

/**
 * Les seuils de rarete, sur le score de notoriete. Quatre seuils, cinq crans.
 * A relire sur `stats-summary.txt` : c'est la distribution qui dit s'ils
 * tombent juste, pas l'intuition.
 */
const SEUILS_RARETE = [0.42, 0.56, 0.7, 0.84] as const

const CRANS: readonly Rarete[] = ['commun', 'peu-commun', 'rare', 'epique', 'legendaire']

/** L'echelle des deux stats de combat. */
const STAT = { min: 1, max: 10 } as const

// ------------------------------------------------------------------ l'echelle

function borner(v: number, min: number, max: number): number {
  return v < min ? min : v > max ? max : v
}

/** Ramene une valeur a 0..1 sur une echelle logarithmique. */
function echelleLog(valeur: number, [min, max]: readonly [number, number]): number {
  const l = Math.log10(1 + Math.max(valeur, 0))
  const a = Math.log10(1 + min)
  const b = Math.log10(1 + max)
  return borner((l - a) / (b - a), 0, 1)
}

/** Etale 0..1 sur l'echelle des stats. */
function stat(part: number): number {
  return Math.round(STAT.min + part * (STAT.max - STAT.min))
}

// ------------------------------------------------------------------ le domaine

/** Minuscules, sans accent, apostrophes et tirets rendus a l'espace. */
export function cle(libelle: string): string {
  return libelle
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[-_.'’]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * LE DOMAINE SE LIT SUR LE LIBELLE DU METIER, PAS SUR SON IDENTIFIANT. Wikidata
 * compte des centaines de metiers ; une table de Q-ids en oublierait la moitie
 * et demanderait une ligne par metier nouveau. Un mot suffit, et il couvre les
 * variantes feminines comme les composes -- les deux cotes passent par `cle`,
 * donc on ecrit le mot UNE fois, sans accent.
 *
 * L'ORDRE DECIDE. Un roi qui a mene des guerres est l'un et l'autre ; on tranche
 * par la liste, du plus specifique au plus large. A reordonner ici, nulle part
 * ailleurs.
 */
const MOTS_DU_DOMAINE: readonly (readonly [Domaine, readonly string[]])[] = [
  [
    'sportif',
    [
      'sportif', 'sportive', 'footballeur', 'cycliste', 'boxeur', 'athlete', 'joueur', 'joueuse',
      'nageur', 'escrimeur', 'rameur', 'lutteur', 'gymnaste', 'tennis', 'alpiniste', 'patineur',
      'coureur', 'cavalier', 'tireur', 'pilote de course',
    ],
  ],
  [
    'explorateur',
    ['explorateur', 'exploratrice', 'navigateur', 'aviateur', 'aviatrice', 'astronaute', 'cosmonaute', 'conquistador', 'voyageur'],
  ],
  [
    'religieux',
    [
      'pretre', 'eveque', 'archeveque', 'pape', 'cardinal', 'moine', 'nonne', 'theologien', 'rabbin',
      'imam', 'missionnaire', 'saint', 'sainte', 'abbe', 'mystique', 'religieux', 'religieuse',
      'pasteur', 'martyr', 'prophete', 'canoniste', 'prelat', 'ecclesiastique', 'reformateur',
      'jesuite', 'benedictin', 'dominicain', 'franciscain', 'patriarche', 'metropolite',
    ],
  ],
  [
    'militaire',
    [
      'militaire', 'general', 'officier', 'amiral', 'marechal', 'soldat', 'colonel', 'capitaine',
      'chevalier', 'condottiere', 'resistant', 'guerrier', 'samourai', 'pirate', 'corsaire',
      'strategiste', 'commandant',
    ],
  ],
  [
    'politique',
    [
      'politique', 'politicien', 'politicienne', 'roi', 'reine', 'empereur', 'imperatrice',
      'president', 'ministre', 'diplomate', 'souverain', 'monarque', 'prince', 'princesse',
      'duc', 'duchesse', 'comte', 'comtesse', 'pharaon', 'sultan', 'tsar', 'consul', 'senateur',
      'gouverneur', 'noble', 'revolutionnaire', 'syndicaliste', 'juriste', 'avocat', 'magistrat',
      'maire', 'ambassadeur', 'courtisane', 'espion', 'aristocrate',
      // LE PLUS GROS TROU DE LA TABLE, ET DE LOIN : « homme d'Etat » ouvre 115
      // des 300 descriptions qu'aucun mot ne touchait -- Lincoln, Kennedy,
      // Bismarck, Truman, Roosevelt, Nehru, Wilson. *Une table de mots se relit
      // sur ce qu'elle N'ATTRAPE PAS*, pas sur ce qu'elle attrape.
      'homme d etat', 'femme d etat', 'chef d etat', 'chah', 'calife', 'khan', 'vizir', 'regent',
      'archiduc', 'margrave', 'landgrave', 'doge', 'emir', 'shogun', 'daimyo',
    ],
  ],
  [
    'scientifique',
    [
      'physicien', 'chimiste', 'mathematicien', 'biologiste', 'astronome', 'medecin', 'chirurgien',
      'naturaliste', 'botaniste', 'zoologiste', 'geologue', 'ingenieur', 'inventeur', 'inventrice',
      'scientifique', 'informaticien', 'statisticien', 'geographe', 'archeologue', 'pharmacien',
      'anatomiste', 'entomologiste', 'paleontologue', 'psychiatre', 'psychanalyste', 'bacteriologiste',
      'cartographe', 'astrologue', 'alchimiste',
    ],
  ],
  [
    'penseur',
    [
      'philosophe', 'historien', 'ecrivain', 'poete', 'romancier', 'romanciere', 'essayiste',
      'dramaturge', 'journaliste', 'sociologue', 'economiste', 'anthropologue', 'linguiste',
      'traducteur', 'traductrice', 'critique', 'professeur', 'pedagogue', 'bibliothecaire',
      'editeur', 'biographe', 'memorialiste', 'theoricien', 'conteur', 'fabuliste', 'nouvelliste',
      'auteur', 'autrice', 'femme de lettres', 'homme de lettres', 'poetesse', 'erudit',
    ],
  ],
  [
    'artiste',
    [
      'peintre', 'sculpteur', 'sculptrice', 'compositeur', 'compositrice', 'musicien', 'musicienne',
      'chanteur', 'chanteuse', 'acteur', 'actrice', 'architecte', 'graveur', 'dessinateur',
      'illustrateur', 'photographe', 'cineaste', 'realisateur', 'danseur', 'danseuse',
      'chef d orchestre', 'pianiste', 'violoniste', 'organiste', 'artiste', 'orfevre', 'ceramiste',
      'couturier', 'designer', 'caricaturiste', 'scenariste', 'humoriste', 'parolier', 'librettiste',
      'luthier', 'calligraphe', 'comedien', 'mime', 'chorégraphe', 'choregraphe',
      'producteur', 'productrice', 'virtuose', 'violoncelliste', 'guitariste', 'organiste',
      'ebeniste', 'graveuse', 'miniaturiste', 'fresquiste', 'portraitiste', 'paysagiste',
    ],
  ],
]

/**
 * OU UN MOT APPARAIT DANS UN TEXTE, EN TANT QUE MOT — `-1` s'il n'y est pas.
 *
 * **La comparaison cherchait une sous-chaine, et ca classait 190 cartes de
 * travers** : « tra-DUC-teur » contient « duc », donc *123 traducteurs etaient
 * rangés en « politique » ; « d-ROI-t » contient « roi », donc Platon aussi.
 *
 * Les bornes sont des NON-LETTRES et non des espaces : une description ecrit
 * « philosophe, mathematicien », donc exiger un blanc apres le mot le ratait
 * une fois sur deux. *Un mot se termine ou les lettres s'arretent, pas ou
 * l'espace commence.*
 *
 * Le suffixe couvre le pluriel et le feminin — « peintres », « avocate » —
 * sans quoi il faudrait ecrire chaque forme dans la table.
 */
function ouLeMotTombe(texte: string, mot: string): number {
  const motif = new RegExp(`(?<![a-z])(${mot.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})(s|e|es|ne|nes|sse|sses)?(?![a-z])`)
  return motif.exec(texte)?.index ?? -1
}

/**
 * LE DOMAINE SE LIT DANS LA DESCRIPTION, ET C'EST LE PREMIER MOT QUI GAGNE.
 *
 * Tranché par Keko : « on peut directement donner plus de poids a la mention
 * qui apparait en premier ? car souvent dans la description on a au debut son
 * role principal ». **Et la mesure lui donne raison** : une description
 * Wikidata est une phrase ECRITE PAR UN HUMAIN, qui met le role principal en
 * tete — « compositeur et pianiste franco-polonais », « peintre, sculpteur,
 * architecte et ingenieur ». *L'ordre y porte du sens.*
 *
 * **La liste des metiers (P106), elle, n'en porte aucun** : c'est un ensemble,
 * et son ordre est celui que la requete rend. Leonard de Vinci y commence par
 * « scientifique » et Chopin par « compositeur » — on ne peut rien en tirer.
 *
 * Ce que l'ancienne regle faisait, et qui etait pire : elle parcourait les huit
 * domaines dans un ORDRE FIXE et prenait le premier qui touchait n'importe quel
 * metier. **Donc c'etait l'ordre de MA table qui decidait pour 63 % du
 * catalogue** — artiste etant dernier, il ne gagnait presque jamais : Chopin
 * sortait « penseur » parce que *professeur de piano* passait avant
 * *compositeur*.
 *
 * Mesure, sur les cartes non fictives :
 *
 * | | avant | apres |
 * |---|---|---|
 * | Leonard de Vinci | politique | **artiste** |
 * | Chopin, Wagner, Hogarth | penseur | **artiste** |
 * | Platon | politique | **penseur** |
 * | Elisabeth Bathory | autre | **politique** |
 * | cartes en « autre » | 10 | **1** |
 *
 * **LE REPLI RESTE LES METIERS**, pour les 10 % de descriptions qu'aucun mot ne
 * touche — et la, c'est le premier metier qui parle, pas l'ordre de la table :
 * *si l'on doit deviner, autant deviner sur la meme regle.*
 */
export function domaineDe(description: string, metiers: string[], fiction: boolean): Domaine {
  if (fiction) return 'fiction'

  // LA DESCRIPTION D'ABORD : le mot le plus TOT gagne, quel que soit son domaine.
  const texte = cle(description)
  let tot: { ou: number; domaine: Domaine } | null = null
  for (const [domaine, mots] of MOTS_DU_DOMAINE)
    for (const mot of mots) {
      const ou = ouLeMotTombe(texte, cle(mot))
      if (ou >= 0 && (tot === null || ou < tot.ou)) tot = { ou, domaine }
    }
  if (tot !== null) return tot.domaine

  // LE REPLI : le premier METIER qui touche quelque chose.
  for (const metier of metiers) {
    const c = cle(metier)
    for (const [domaine, mots] of MOTS_DU_DOMAINE)
      if (mots.some((mot) => ouLeMotTombe(c, cle(mot)) >= 0)) return domaine
  }
  return 'autre'
}

// ------------------------------------------------------------------- le calcul

/**
 * LA SEULE PORTE DES STATS DERIVEES. Tout ce qui se regle dans ce mode se regle
 * au-dessus : les bornes, les poids, les seuils, les mots du domaine.
 */
export function statsDerivees(brut: Brut): StatsDerivees {
  const partLangues = echelleLog(brut.langues, BORNES.langues)
  const partVues = echelleLog(brut.vues, BORNES.vues)
  const notoriete = POIDS.langues * partLangues + POIDS.vues * partVues

  let rang = 0
  while (rang < SEUILS_RARETE.length && notoriete >= SEUILS_RARETE[rang]) rang++

  return {
    rarete: CRANS[rang],
    // L'ATTAQUE SUIT LES VUES : ce qu'on regarde aujourd'hui frappe fort.
    attaque: stat(partVues),
    // LA DEFENSE SUIT LA TAILLE DE L'ARTICLE : ce qui est longuement ecrit encaisse.
    defense: stat(echelleLog(brut.taille, BORNES.taille)),
    domaine: domaineDe(brut.description, brut.metiers, brut.fiction),
    notoriete,
  }
}

/** Le siecle d'une annee. Negatif avant notre ere, `null` si l'annee manque. */
export function siecle(annee: number | null): number | null {
  if (annee === null) return null
  return annee > 0 ? Math.floor((annee - 1) / 100) + 1 : -(Math.floor(-annee / 100) + 1)
}

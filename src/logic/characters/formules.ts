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
      'pasteur', 'martyr', 'prophete', 'canoniste',
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
      'politique', 'roi', 'reine', 'empereur', 'imperatrice', 'president', 'ministre', 'diplomate',
      'souverain', 'monarque', 'prince', 'princesse', 'duc', 'duchesse', 'comte', 'comtesse',
      'pharaon', 'sultan', 'tsar', 'consul', 'senateur', 'gouverneur', 'noble', 'revolutionnaire',
      'syndicaliste', 'juriste', 'avocat', 'magistrat', 'chef d etat', 'maire', 'ambassadeur',
      'courtisane', 'espion',
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
      'traducteur', 'critique', 'professeur', 'pedagogue', 'bibliothecaire', 'editeur', 'biographe',
      'memorialiste', 'theoricien', 'conteur', 'fabuliste', 'nouvelliste', 'auteur',
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
    ],
  ],
]

export function domaineDesMetiers(metiers: string[], fiction: boolean): Domaine {
  if (fiction) return 'fiction'
  const cles = metiers.map(cle)
  for (const [domaine, mots] of MOTS_DU_DOMAINE)
    for (const mot of mots) {
      const m = cle(mot)
      if (cles.some((c) => c.includes(m))) return domaine
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
    domaine: domaineDesMetiers(brut.metiers, brut.fiction),
    notoriete,
  }
}

/** Le siecle d'une annee. Negatif avant notre ere, `null` si l'annee manque. */
export function siecle(annee: number | null): number | null {
  if (annee === null) return null
  return annee > 0 ? Math.floor((annee - 1) / 100) + 1 : -(Math.floor(-annee / 100) + 1)
}

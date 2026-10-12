// LES FORMULES DU MODE PERSONNAGES, ET IL N'Y EN A QU'UN SEUL ENDROIT.
//
// Rarete, attaque, defense et domaine sortent tous d'ici. Le script de
// generation les applique, il ne les recopie pas : *deux endroits qui
// decrivent le meme calcul se desaccordent au premier reglage.*
//
// **DEUX PORTES, ET PAS UNE, parce que deux grandeurs ne se mesurent pas de la
// meme facon** : `statsDerivees` voit UNE carte et en tire ce qui ne depend que
// d'elle ; `raretesParDomaine` voit TOUT LE CATALOGUE, parce qu'un quantile n'a
// aucun sens sur un element seul.
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

/**
 * LA RARETE N'EST PAS LA, ET C'EST STRUCTUREL.
 *
 * Tranche par Keko : « il faudrait que la rarete soit donnee en fonction de la
 * distribution de la rarete dans une categorie et pas globale ». **Un quantile
 * ne se calcule pas sur une carte seule** -- il faut tout le rayon sous les
 * yeux -- donc la rarete sort par `raretesParDomaine`, qui prend la liste.
 *
 * *C'est ce qui ferme definitivement la classe de defaut qui s'est payee deux
 * fois ici* : des bornes ecrites a la main ne peuvent pas decrire des donnees
 * qui changent, un quantile ne decrit jamais que celles qu'il voit.
 */
export interface StatsDerivees {
  attaque: number
  defense: number
  domaine: Domaine
  /** Le score de notoriete, 0 a 1. Garde pour pouvoir juger l'echelle. */
  notoriete: number
}

// ---------------------------------------------------------------- les reglages

/**
 * LES BORNES SONT LOGARITHMIQUES, ET CE N'EST PAS UN DETAIL. La notoriete suit
 * une loi de puissance : en echelle lineaire, Napoleon ecrase tout le monde et
 * quatre-vingt-quinze pour cent des cartes valent 1.
 *
 * **ELLES NE PORTENT PLUS QUE L'ATTAQUE ET LA DEFENSE.** La rarete les lisait a
 * travers le score, donc *les regler pour l'une desequilibrait l'autre* ; depuis
 * qu'elle se decoupe en quantiles (voir `raretesParDomaine`), elle ne depend
 * plus d'aucune borne et **c'est tout ce qui reste d'ecrit a la main dans ce
 * mode.**
 *
 * ***Donc c'est aussi le seul endroit qui puisse encore decrire la mauvaise
 * donnee*** -- et il l'a fait deux fois. A relire sur `stats-summary.txt` apres
 * chaque generation, et *le bon moment est juste apres* : les formules etant
 * pures, le catalogue se recalcule sur le JSON deja telecharge en quelques
 * minutes, sans rien redemander a Wikidata.
 */
const BORNES = {
  /** Nombre de Wikipedia qui ont l'article. */
  langues: [10, 250] as const,
  /**
   * Vues SOMMEES sur quinze langues et trente jours, la langue du wiki source
   * retiree pour ne pas la compter deux fois.
   *
   * **ELLES ONT DECRIT DEUX FOIS LA MAUVAISE DONNEE, et c'est le meme defaut
   * qui s'est joue aux deux bouts.** `[340_000, 54_000_000]` epousait les vues
   * sommees sur SEIZE langues et DOUZE mois, telles que la porte par
   * frequentation les rapportait ; la porte redevenue les metiers, la
   * distribution a perdu trois ordres de grandeur et **tout le catalogue est
   * tombe sous la borne basse** -- donc 100 % commun et 2 929 cartes sur 2 931
   * a une attaque de 1.
   *
   * ***Une borne qui decrit des donnees se relit le jour ou les donnees
   * changent, pas avant et pas apres*** -- la regle etait ecrite ici meme, et
   * c'est la deuxieme fois qu'elle se paie au meme endroit.
   *
   * **CELLES-CI SONT UNE ESTIMATION, ET IL FAUT LE SAVOIR.** La porte redevenue
   * les metiers, personne n'a encore vu la distribution des vues SOMMEES sur
   * trente jours : on la deduit des vues francaises du catalogue precedent
   * (37 a 704 380, mediane 4 370) et de la part du francais dans le total,
   * mesuree a 17 % en moyenne -- d'ou un facteur d'environ six.
   *
   * ***C'est tout ce qui reste d'ecrit a la main dans ce mode, donc tout ce qui
   * peut encore etre faux*** : a relire sur `stats-summary.txt` des que la
   * generation a tourne. *Le recalcul ne coute rien* -- les formules sont pures,
   * donc le catalogue se refait sur le JSON deja telecharge.
   */
  vues: [300, 5_000_000] as const,
  /** Octets de l'article FR. */
  taille: [3_000, 250_000] as const,
}

/**
 * LA NOTORIETE EST LA FREQUENTATION, ET RIEN D'AUTRE. Tranche par Keko : « je
 * trouve que le critere de popularite ne devrait pas etre les langues, plutot la
 * frequentation de la page (ex sur un an) ».
 *
 * *Les langues pesaient 0,6 contre 0,4 aux vues*, et c'etait defendable tant
 * qu'on ne pouvait mesurer les vues que de ce qu'on avait deja choisi : le
 * nombre de langues etait **le seul signal disponible avant Wikipedia**. Depuis
 * que la porte d'entree est le top des pages lues, les vues arrivent les
 * premieres -- donc le signal de secours n'a plus de raison d'etre le principal.
 *
 * **Et il mesurait autre chose.** Un article existe dans beaucoup de langues
 * quand un bot l'a cree partout -- un botaniste du XIXe siecle a cent cinquante
 * Wikipedia et personne ne les lit. *Le nombre de langues mesure la plomberie,
 * la frequentation mesure l'interet.*
 */
const POIDS = { langues: 0, vues: 1 }

/**
 * QUATRE CRANS, PARCE QUE LE DESSIN EN PORTE QUATRE. Tranche par Keko : « on va
 * diviser en 4 rarete (bronze, argent, or, diamant) plutot pour respecter les
 * metaux ».
 *
 * *Et ca n'a change aucun cadre* : la carte n'a jamais montre que quatre
 * metaux, et `commun` et `peu-commun` partageaient deja le bronze. **Le modele
 * disait cinq choses la ou l'ecran en disait quatre** -- c'est le modele qui
 * avait tort.
 *
 * LA PYRAMIDE EST EN PARTS CUMULEES, ET ELLE SE DECOUPE DANS CHAQUE DOMAINE.
 * Les parts reprennent celles des deux autres modes (69 / 20 / 8 / 2,5 %) :
 * *un changement a la fois* -- la forme du calcul change, la distribution non.
 */
const PYRAMIDE = [
  { rarete: 'commun', jusqu: 0.692 },
  { rarete: 'rare', jusqu: 0.892 },
  { rarete: 'epique', jusqu: 0.975 },
  { rarete: 'legendaire', jusqu: 1 },
] as const satisfies readonly { rarete: Rarete; jusqu: number }[]

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
      // **CE QUE LA TABLE N'ATTRAPAIT PAS**, releve sur les descriptions
      // restees sans domaine : « pilote automobile » n'y etait pas -- seul
      // « pilote de course » l'etait -- donc Ayrton Senna tombait sur le repli
      // par metiers, ou « entrepreneur » gagnait. *Une table de mots se relit
      // sur ce qu'elle N'ATTRAPE PAS.*
      'pilote automobile', 'pilote de formule 1', 'pilote de moto', 'pilote de rallye',
      'patineuse', 'patineur artistique', 'arts martiaux', 'basketteur', 'basketteuse',
      'handballeur', 'volleyeur', 'rugbyman', 'skieur', 'skieuse', 'snowboardeur',
      'judoka', 'karateka', 'catcheur', 'catcheuse', 'golfeur', 'golfeuse',
      'haltérophile', 'halterophile', 'archer', 'biathlete', 'triathlete', 'marathonien',
      'entraineur', 'entraineuse', 'footballeuse', 'surfeur', 'planchiste',
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
      // **« FONDATEUR DE L'EMPIRE » etait le second gros trou** : Gengis Khan,
      // Cyrus II, Tokugawa Ieyasu et Abdelaziz ibn Saoud n'avaient AUCUN
      // domaine. Et « chef du gouvernement » laissait Andropov dehors.
      'fondateur de l empire', 'fondatrice de l empire', 'chef du gouvernement',
      'chef de gouvernement', 'premiere dame', 'pere fondateur', 'mere fondatrice',
      'militant', 'militante', 'activiste', 'suffragette', 'abolitionniste',
      'dirigeant', 'dirigeante', 'leader', 'secretaire general', 'chancelier',
      'chanceliere', 'vice president', 'vice presidente', 'conseiller d etat',
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
      // LES COMPOSES DE LA CHANSON, et ils ne sont pas decoratifs : seuls, ils
      // battent « auteur » a la meme position grace a la regle du plus long.
      // *Sans eux, la regle n'aurait rien a quoi gagner.* `cle()` change les
      // traits d'union en espaces, donc une seule forme couvre
      // « auteur-compositeur » comme « auteur-compositeur-interprete ».
      'auteur compositeur', 'autrice compositrice', 'auteure compositrice',
      'auteur interprete', 'autrice interprete', 'auteure interprete',
      // L'OPERA ET LES MEDIAS, releves sur les descriptions sans domaine :
      // Bocelli (« tenor »), Callas (« cantatrice »), Kardashian
      // (« personnalite mediatique »), Elliot Page (« personnalite du cinema »).
      'tenor', 'cantatrice', 'cantateur', 'soprano', 'baryton', 'basse chantante',
      'personnalite mediatique', 'personnalite de la television', 'personnalite du cinema',
      'animateur', 'animatrice', 'presentateur', 'presentatrice', 'youtubeur',
      'youtubeuse', 'influenceur', 'influenceuse', 'videaste', 'streameur', 'streameuse',
      'mannequin', 'top modele', 'styliste', 'modeliste', 'rappeur', 'rappeuse',
      'disc jockey', 'batteur', 'bassiste', 'saxophoniste', 'trompettiste',
      'dessinatrice', 'mangaka', 'scenographe', 'costumier', 'costumiere',
    ],
  ],
  [
    'business',
    [
      // **LE COMPOSE EST OBLIGATOIRE, PAS DECORATIF** : « directeur general »
      // contient « general », qui est un mot MILITAIRE -- et c'est ainsi que
      // **Warren Buffett etait classe militaire.** Le compose commence un mot
      // plus tot, donc il gagne par la regle du plus precoce ; sans lui, le
      // sous-mot l'emporterait. *Un mot d'une table peut en cacher un autre.*
      'directeur general', 'directrice generale', 'president directeur general',
      'entrepreneur', 'entrepreneuse', 'homme d affaires', 'femme d affaires',
      'chef d entreprise', 'cheffe d entreprise', 'industriel', 'industrielle',
      'banquier', 'banquiere', 'investisseur', 'investisseuse', 'milliardaire',
      'magnat', 'financier', 'financiere', 'armateur', 'negociant', 'commercant',
      'marchand', 'marchande', 'affairiste', 'oligarque', 'patron', 'patronne',
      'fondateur d entreprise', 'cofondateur', 'hotelier', 'restaurateur',
      'imprimeur', 'libraire', 'cadre dirigeant',
      'personnalite du monde des affaires', 'monde des affaires',
    ],
  ],
  [
    'criminel',
    [
      // **LE CRIME PORTE DES CARTES PARMI LES PLUS LUES DU MONDE** -- Ed Gein
      // etait la 2e du catalogue, Epstein la 1re -- et elles tombaient en
      // « autre », ou en « scientifique » pour Ben Laden, qui est ingenieur.
      'tueur en serie', 'tueuse en serie', 'criminel', 'criminelle', 'gangster',
      'mafieux', 'mafieuse', 'trafiquant', 'trafiquante', 'terroriste', 'meurtrier',
      'meurtriere', 'escroc', 'braqueur', 'assassin', 'bandit', 'hors la loi',
      'voleur', 'voleuse', 'contrebandier', 'faussaire', 'empoisonneur', 'empoisonneuse',
      'parrain de la mafia', 'chef de gang', 'baron de la drogue', 'narcotrafiquant',
      'kidnappeur', 'ravisseur', 'delinquant', 'malfaiteur',
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
  //
  // **ET A POSITION EGALE, LE PLUS LONG GAGNE** -- ce qui a coute Michael
  // Jackson. Sa description est « auteur-compositeur-interprete et danseur
  // americain » : le mot « auteur » (penseur) tombe a zero, « compositeur »
  // (artiste) a sept, donc le plus tot gagnait et **les seize plus grands noms
  // de la musique sortaient en PENSEUR** -- Lennon, Dylan, Mercury, McCartney,
  // Madonna, Bowie, Cohen, Springsteen. Keko : « comment Michael Jackson ne
  // peut pas etre artiste mdr ? »
  //
  // *Un mot plus long a la meme position est un mot plus SPECIFIQUE* : « auteur
  // compositeur » dit la chanson la ou « auteur » dit le livre. La regle est
  // generale, elle ne nomme personne -- et c'est ce qui la rend sure.
  const texte = cle(description)
  let tot: { ou: number; taille: number; domaine: Domaine } | null = null
  for (const [domaine, mots] of MOTS_DU_DOMAINE)
    for (const mot of mots) {
      const m = cle(mot)
      const ou = ouLeMotTombe(texte, m)
      if (ou < 0) continue
      if (tot === null || ou < tot.ou || (ou === tot.ou && m.length > tot.taille))
        tot = { ou, taille: m.length, domaine }
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
 * CE QUI SE DEDUIT D'UNE CARTE SEULE. Tout ce qui se regle ici se regle
 * au-dessus : les bornes, les poids, les mots du domaine.
 *
 * *La rarete n'en fait pas partie* -- elle depend du rayon entier, voir
 * `raretesParDomaine`.
 */
export function statsDerivees(brut: Brut): StatsDerivees {
  const partLangues = echelleLog(brut.langues, BORNES.langues)
  const partVues = echelleLog(brut.vues, BORNES.vues)

  return {
    // L'ATTAQUE SUIT LES VUES : ce qu'on regarde aujourd'hui frappe fort.
    attaque: stat(partVues),
    // LA DEFENSE SUIT LA TAILLE DE L'ARTICLE : ce qui est longuement ecrit encaisse.
    defense: stat(echelleLog(brut.taille, BORNES.taille)),
    domaine: domaineDe(brut.description, brut.metiers, brut.fiction),
    notoriete: POIDS.langues * partLangues + POIDS.vues * partVues,
  }
}

/**
 * LA RARETE SE DECOUPE DANS LE DOMAINE, PAS SUR TOUT LE CATALOGUE.
 *
 * Tranche par Keko : « il faudrait que la rarete soit donnee en fonction de la
 * distribution de la rarete dans une categorie et pas globale ». **Et la mesure
 * lui donne raison de facon spectaculaire** : le quota donne trois cents cartes
 * a chaque rayon, mais *les niveaux de notoriete n'ont rien de comparable d'un
 * rayon a l'autre* -- la 300e artiste a 106 langues, la 300e criminelle en a 28.
 *
 * A seuil GLOBAL, le quota se defaisait donc par l'autre bout :
 *
 * | | commun | rare | epique | legendaire |
 * |---|---|---|---|---|
 * | artiste | **0 %** | 55 % | 37 % | 8 % |
 * | explorateur | **97 %** | 2 % | **0 %** | **0 %** |
 * | scientifique | 92 % | 7 % | 1 % | **0 %** |
 * | business | 93 % | 5 % | 2 % | 1 % |
 *
 * ***Cinq rayons sur dix ne pouvaient porter aucun legendaire, et les artistes
 * n'avaient pas un seul commun*** -- Marie Curie et Einstein sortaient communs
 * pendant qu'une actrice de second plan sortait epique. **C'est exactement le
 * defaut que le quota venait de corriger, revenu par la porte de la rarete.**
 *
 * Trois choses a ne pas defaire :
 *
 * - **ON TRIE SUR LES VUES BRUTES, jamais sur la notoriete.** Celle-ci passe
 *   par une echelle log BORNEE : avec des bornes mal calees, elle vaut 0 pour
 *   tout le monde et le tri devient degenere -- c'est litteralement le defaut
 *   qui a sorti un catalogue a 100 % commun. ***Un quantile n'a besoin que d'un
 *   ordre, et toute normalisation intermediaire ne peut que lui en perdre.***
 * - **les ex aequo partagent leur cran**, par leur rang moyen : *deux cartes de
 *   meme notoriete ne peuvent pas valoir deux metaux differents* ;
 * - **ca se calcule sur ce qui RESTE**, apres le quota -- pas sur tout ce qu'on
 *   a vu. Une carte ecartee n'a pas de cran a prendre.
 */
export function raretesParDomaine(cartes: readonly { domaine: Domaine; vues: number }[]): Rarete[] {
  const rayons = new Map<Domaine, number[]>()
  cartes.forEach((c, i) => {
    const l = rayons.get(c.domaine)
    if (l === undefined) rayons.set(c.domaine, [i])
    else l.push(i)
  })

  const sortie = new Array<Rarete>(cartes.length)
  for (const indices of rayons.values()) {
    // Du plus notoire au moins notoire ; l'identite n'entre pas dans l'ordre,
    // donc les ex aequo sont traites ensemble juste apres.
    const ordre = [...indices].sort((a, b) => cartes[b]!.vues - cartes[a]!.vues)
    const n = Math.max(1, ordre.length)
    let i = 0
    while (i < ordre.length) {
      let j = i
      while (j + 1 < ordre.length && cartes[ordre[j + 1]!]!.vues === cartes[ordre[i]!]!.vues) j++
      const part = 1 - (i + j) / 2 / n
      const cran = PYRAMIDE.find((p) => part <= p.jusqu) ?? PYRAMIDE[PYRAMIDE.length - 1]!
      for (let k = i; k <= j; k++) sortie[ordre[k]!] = cran.rarete
      i = j + 1
    }
  }
  return sortie
}

/** Le siecle d'une annee. Negatif avant notre ere, `null` si l'annee manque. */
export function siecle(annee: number | null): number | null {
  if (annee === null) return null
  return annee > 0 ? Math.floor((annee - 1) / 100) + 1 : -(Math.floor(-annee / 100) + 1)
}

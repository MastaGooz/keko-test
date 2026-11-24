/**
 * LA FLOTTE : LE VAISSEAU EST L'UNITÉ DU JEU (Keko, 14/11).
 *
 * Le cuirassé l'a montré : tant que le propulseur était une pièce libre, le même moteur donnait la même pointe à un
 * chasseur de 30 T et à un cuirassé de 170 T — « notre problème vient de la séparation châssis / propulsion ». Tranché :
 *
 * - UN VAISSEAU EST UN MODÈLE, avec SES pièces : ses châssis (« on peut débloquer différents châssis pour un même
 *   vaisseau »), ses propulseurs (deux ou trois, à lui : c'est eux qui portent la vitesse, l'accélération ET la
 *   maniabilité), ses armes — LÉGÈRES ou LOURDES, selon les emplacements de son châssis — et ses outils. Une même arme
 *   peut figurer sur plusieurs vaisseaux, mais ELLE SE DÉBLOQUE SUR CHACUN ;
 * - LA RECHERCHE DÉBLOQUE LES VAISSEAUX (nus, avec leurs pièces de série), plus aucune pièce ;
 * - CHAQUE VAISSEAU A SA SUITE DE MISSIONS, une active à la fois, qui n'avance QU'EN LE PILOTANT ; chaque mission
 *   validée OUVRE une pièce — « la mission donne le droit d'acheter la pièce (crédits + ressources, comme la
 *   recherche) ». La liste d'un vaisseau ne montre donc que ce que ses missions ont déjà ouvert (« afficher toute la
 *   liste dès le début surchargerait l'interface pour les débutants », et « un système d'XP est bizarre pour des
 *   vaisseaux »). Plus tard : une couleur spéciale, une capacité signature en récompense.
 *
 * *Les modèles, leurs missions, leurs cibles et les prix sont de moi, à rejuger.* La règle est pure : la flotte est
 * une valeur.
 */
import { MINERAIS, type Cargaison } from './jeu.ts'
import { hangarNeuf, lireHangar, pieceDe, type Hangar } from './hangar.ts'
import type { Compteur } from './quetes.ts'

/** LA CLASSE d'un vaisseau : la recherche pourra donner des bonus à une classe seulement. */
export type Classe = 'chasseur' | 'lourd'
export const NOMS_CLASSE: Record<Classe, string> = { chasseur: 'Classe légère', lourd: 'Classe lourde' }

/**
 * LES RACES (Keko, 17/11 : « je voudrais diviser les vaisseaux en catégories, et cette catégorie, ce sera la race qui les
 * utilise » ; trois vaisseaux par race) : LES HUMAINS, classiques et conventionnels ; L'ESSAIM, des entités biologiques
 * (« un peu zerg ») ; LES ÉTHÉRÉS, une race plus avancée technologiquement (le froid, les arcanes, l'électricité) ; LES
 * INNOMMÉS, une race « eldritch », très bizarre, dont les vaisseaux ne ressemblent presque pas à des vaisseaux. Les noms
 * des trois races d'aliens sont de moi, à rejuger.
 */
export type Race = 'humains' | 'essaim' | 'etheres' | 'innommes'
// (… DES NOMS DE RACES — Keko, 19/11 : « remplacer « essaim » par un nom de race, un peu plus évocateur, comme les
// Tyranides ; et renommer les humains par un nom de faction humaine, du style l'Empire » : L'EMPIRE, LES XÉNOÏDES ; les
// identifiants du code restent)
// (… ET CE QUI LES DÉFEND, EN UNE LIGNE — Keko, 20/11 : « dans l'écran de sélection des vaisseaux, une ligne sur le
// fonctionnement des différentes races » ; puis, le 21/11 : « un petit mot avec deux points et la définition » — ses
// mots : `defense`, le mot et ce qu'il fait)
export const RACES: { id: Race; nom: string; defense: { nom: string; dit: string } }[] = [
  { id: 'humains', nom: 'L’Empire', defense: { nom: 'Surblindage', dit: 'Vous pouvez ramasser du surblindage.' } }, // (Keko, 23/11 : elles tombent des insectes, voir `recuperation` ; « Vous trouvez parfois des plaques de protection. » tenait sur trois lignes)
  { id: 'essaim', nom: 'Les Xénoïdes', defense: { nom: 'Carapace', dit: 'Les points de vie se régénèrent lentement.' } },
  // (… PUIS LES VECTRANS ET LES XL'QOTH, PUIS YHG'THARR — Keko, 19/11 : « pour les Éthérés, un nom qui sonne vraiment technologie avancée ;
  // pour les Innommés, un nom eldritch qui sonne presque imprononçable » ; puis, la Convergence essayée : « je veux
  // vraiment un nom de race, un peu comme les Xénoïdes » — choisis par Keko parmi mes propositions)
  { id: 'etheres', nom: 'Les Vectrans', defense: { nom: 'Bouclier', dit: 'Un bouclier protecteur qui se recharge.' } },
  // (… PUIS LES YHG'THARR — Keko, 19/11 : « Xl'qoth commence par un X, comme les Xénoïdes, c'est dommage »)
  { id: 'innommes', nom: 'Les Yhg’tharr', defense: { nom: 'Déphasage', dit: 'Une chance d’annuler complètement les dégâts subis.' } },
]

/**
 * LA VIE SELON LA RACE (Keko, 17/11 : « ce n'est pas très logique que toutes les races de vaisseaux aient la même
 * architecture en termes de vie et de bouclier ») : LES ÉTHÉRÉS ont un bouclier beaucoup plus gros et un blindage très
 * fragile — le bouclier, lui, commence à se réparer très vite après un temps sans coup ; L'ESSAIM n'a AUCUN BOUCLIER, mais
 * sa coque se régénère lentement, en permanence ; les humains et les Innommés gardent la vie de toujours, en attendant
 * leur spécificité. `coque`, `bouclier` : ce que donnent les pièces (le bouclier de base du jeu compris). *Les chiffres
 * sont de moi, à rejuger en jouant.*
 */
export type Vie = { coque: number; bouclier: { points: number; delai: number; regain: number }; regeneration: number; plaques: number; corruption: { ronge: number; purge: number }; dephasage: { chance: number; duree: number } }
// LES HUMAINS : PAS DE BOUCLIER, DES PLAQUES DE BLINDAGE (Keko, 17/11 : chacune encaisse tout un coup avant que la barre
// soit entamée ; « on peut même varier le nombre de plaques selon les vaisseaux » — `plaques`, celles du modèle) ; et LE
// BLINDAGE LE PLUS ÉPAIS (plus 2) : rien ne se répare, ils doivent tenir sur une seule vie.
// LES INNOMMÉS : PAS DE BOUCLIER, LE DÉPHASAGE (Keko, 20/11 — d'abord la corruption, les blessures différées, retirée) :
// un coup sur tant est esquivé, et le vaisseau, déphasé, est invincible et traverse tout un court instant — `dephasage`,
// la chance du modèle (voir `ModeleDeVaisseau.dephasage`).
export function vieSelonLaRace(race: Race, v: Vie, plaques = 3, dephasage = 0.1): Vie {
  if (race === 'humains') return { ...v, coque: v.coque + 2, bouclier: { ...v.bouclier, points: 0 }, plaques }
  if (race === 'innommes') return { ...v, bouclier: { ...v.bouclier, points: 0 }, dephasage: { ...v.dephasage, chance: dephasage } }
  if (race === 'etheres') return { ...v, coque: Math.max(1, v.coque - 3), bouclier: { points: v.bouclier.points + 5, delai: 3, regain: 2.5 }, regeneration: v.regeneration }
  // (… 1 % TOUTES LES 15 S — Keko, 20/11 : « la régénération des xénoïdes est beaucoup trop rapide ; vise de l'ordre de 1 %
  // toutes les 15 secondes » : 2 % par seconde d'abord, trente fois plus)
  if (race === 'essaim') return { ...v, coque: v.coque + 2, bouclier: { ...v.bouclier, points: 0 }, regeneration: Math.max(v.regeneration, 0.01 / 15) }
  return v
}
/** Les talents qu'une race ne se voit jamais proposer (seuls les Éthérés ont un bouclier à étendre et à recharger). */
export const talentsHorsDeLaRace = (race: Race): string[] => (race === 'etheres' ? [] : ['bouclier', 'recharge'])

/** Une mission d'un vaisseau : ce qu'elle compte, jusqu'où, et LA PIÈCE qu'elle ouvre à l'achat sur ce vaisseau. */
export type MissionDeVaisseau = { titre: string; dit: string; compteur: Compteur; cible: number; ouvre: string }

export type ModeleDeVaisseau = {
  id: string
  nom: string
  classe: Classe
  /** La race qui le pilote (voir `RACES`). */
  race: Race
  /** Ses plaques de blindage, s'il est humain (voir `vieSelonLaRace`) : trois sans autre dit. */
  plaques?: number
  /** Sa chance de déphasage, s'il est Yhg'tharr (voir `vieSelonLaRace`) : de 0,04 à 0,08 (Keko, 20/11 — d'abord « entre 5 et 15 % »), 0,1 sans autre dit. */
  dephasage?: number
  dit: string
  /** TOUTES les pièces qu'il peut porter (celles de série comprises). */
  pieces: string[]
  /** Ce qu'il porte en sortant de la recherche. */
  serie: Hangar
  /** Sa suite de missions, dans l'ordre. */
  chaine: MissionDeVaisseau[]
  /** HORS DE LA RECHERCHE : aucun nœud ne le débloque — le jeu du vortex le donne d'office, pour l'essai (la Salamandre). */
  horsRecherche?: boolean
}

export const MODELES: ModeleDeVaisseau[] = [
  {
    id: 'chasseur',
    nom: 'Chasseur',
    classe: 'chasseur',
    race: 'humains',
    // (… SA DESCRIPTION SUR SON PRINCIPE — Keko, 18/11 : « ne dis pas qu'il tourne la tête vers l'ennemi, on s'en fout ;
    // mets plutôt l'accent sur la supériorité aérienne, l'agilité, la rapidité »)
    dit: 'Le maître du ciel : agile, rapide, il impose sa supériorité dans chaque combat.',
    pieces: ['coque-1', 'coque-2', 'coque-3', 'propulseur-1', 'propulseur-2', 'propulseur-3', 'foreuse-1', 'foreuse-2', 'foreuse-3', 'aimant-1', 'aimant-2', 'radar', 'arme-canon', 'arme-rafale'],
    // (LE CANON EST SON ARME DE BASE — Keko, 14/11 : « je ne veux pas me retrouver sans argent, à repartir avec le
    // vaisseau de base sans armes : comme la foreuse de série, un canon de base que le chasseur puisse embarquer en
    // toutes circonstances » : possédé sans être construit, il ne se perd pas ; monté d'emblée)
    serie: { ...hangarNeuf(), possedees: [...hangarNeuf().possedees, 'arme-canon'], armes: ['arme-canon'] },
    chaine: [
      { titre: 'Rodage', dit: 'Réussissez 2 extractions.', compteur: 'extractions', cible: 2, ouvre: 'propulseur-2' },
      { titre: 'Premier filon', dit: 'Extrayez 30 unités de fer.', compteur: 'fer', cible: 30, ouvre: 'foreuse-2' },
      { titre: 'Baptême du feu', dit: 'Abattez un rival.', compteur: 'rivaux', cible: 1, ouvre: 'coque-2' },
      { titre: 'Pleine soute', dit: 'Extrayez 60 unités.', compteur: 'pepites', cible: 60, ouvre: 'aimant-1' },
      { titre: 'Chasseur de primes', dit: 'Abattez 3 rivaux.', compteur: 'rivaux', cible: 3, ouvre: 'arme-rafale' },
      { titre: 'Aux confins', dit: 'Éloignez-vous à 1 200 de la base.', compteur: 'distance', cible: 1200, ouvre: 'radar' },
      { titre: 'Fièvre de l’or', dit: 'Extrayez 15 unités d’or.', compteur: 'or', cible: 15, ouvre: 'propulseur-3' },
      { titre: 'Éclats', dit: 'Extrayez 6 cristaux.', compteur: 'cristal', cible: 6, ouvre: 'foreuse-3' },
      { titre: 'As', dit: 'Abattez 5 rivaux.', compteur: 'rivaux', cible: 5, ouvre: 'coque-3' },
      { titre: 'Grande campagne', dit: 'Extrayez 150 unités.', compteur: 'pepites', cible: 150, ouvre: 'aimant-2' },
    ],
  },
  {
    // LA SALAMANDRE (Keko, 15/11) : un lance-flammes au nez — il faut aller au contact, là où les insectes mordent
    id: 'salamandre',
    nom: 'Salamandre',
    classe: 'chasseur',
    race: 'humains',
    plaques: 4,
    dit: 'Trapue et robuste, née du feu : elle consume tout ce qui ose l’approcher.',
    pieces: ['coque-5', 'propulseur-s1', 'arme-flammes', 'arme-rayon', 'arme-napalm'],
    // (ses trois armes possédées d'emblée : pour l'essai, pas de missions encore)
    serie: { possedees: ['coque-5', 'propulseur-s1', 'arme-flammes', 'arme-rayon', 'arme-napalm'], montees: { coque: 'coque-5', propulseur: 'propulseur-s1' }, outils: [], armes: ['arme-flammes'] },
    chaine: [],
    horsRecherche: true,
  },
  {
    // LA SENTINELLE (Keko, 15/11) : trois drones en orbite, qui tirent chacun de leur côté
    id: 'sentinelle',
    nom: 'Sentinelle',
    classe: 'chasseur',
    race: 'etheres',
    // (… REDITE — Keko, 19/11 : « inutile de dire qu'elle n'a pas d'avant ni d'arrière »)
    dit: 'Une soucoupe surchargée, qui libère la puissance de la foudre sur ses ennemis.',
    pieces: ['coque-6', 'propulseur-g1', 'arme-drones', 'arme-chaine', 'arme-aura'],
    serie: { possedees: ['coque-6', 'propulseur-g1', 'arme-drones', 'arme-chaine', 'arme-aura'], montees: { coque: 'coque-6', propulseur: 'propulseur-g1' }, outils: [], armes: ['arme-drones'] },
    chaine: [],
    horsRecherche: true,
  },
  {
    // L'INGÉNIEUR (Keko, 15/11) : carré, mécanique, il pose des tourelles sur son passage
    id: 'ingenieur',
    nom: 'Ingénieur',
    classe: 'chasseur',
    race: 'humains',
    // (… LA VERSION BLINDÉE DES HUMAINS — Keko, 18/11 : six plaques, au-dessus des quatre de la Salamandre et des trois
    // du Chasseur ; les trois quarts de leur barre)
    plaques: 6,
    dit: 'Lent et méthodique, un génie de la mécanique qui ne laisse rien au hasard.',
    pieces: ['coque-7', 'propulseur-i1', 'arme-tourelles', 'arme-scie', 'arme-fleau'],
    serie: { possedees: ['coque-7', 'propulseur-i1', 'arme-tourelles', 'arme-scie', 'arme-fleau'], montees: { coque: 'coque-7', propulseur: 'propulseur-i1' }, outils: [], armes: ['arme-tourelles'] },
    chaine: [],
    horsRecherche: true,
  },
  {
    // LE FRIMAS (Keko, 15/11) : le vaisseau du givre, d'une autre race — une carapace en croissant, des cristaux
    id: 'frimas',
    nom: 'Frimas',
    classe: 'chasseur',
    race: 'etheres',
    // (… REDITE — Keko, 19/11)
    dit: 'Un vaisseau redoutable, qui congèle ses ennemis.',
    pieces: ['coque-8', 'propulseur-c3', 'arme-nova', 'arme-eclats', 'arme-tornade'],
    serie: { possedees: ['coque-8', 'propulseur-c3', 'arme-nova', 'arme-eclats', 'arme-tornade'], montees: { coque: 'coque-8', propulseur: 'propulseur-c3' }, outils: [], armes: ['arme-nova'] },
    chaine: [],
    horsRecherche: true,
  },
  {
    // LE PULSAR (Keko, 16/11) : le vaisseau du plasma et de l'énergie, d'une autre race — une raie autour d'un cœur violet
    id: 'pulsar',
    nom: 'Pulsar',
    classe: 'chasseur',
    race: 'etheres',
    // (… REDITE — Keko, 19/11)
    dit: 'Une technologie avancée, qui contrôle l’énergie pure.',
    pieces: ['coque-9', 'propulseur-p3', 'arme-plasma', 'arme-essaim', 'arme-meteore'],
    serie: { possedees: ['coque-9', 'propulseur-p3', 'arme-plasma', 'arme-essaim', 'arme-meteore'], montees: { coque: 'coque-9', propulseur: 'propulseur-p3' }, outils: [], armes: ['arme-plasma'] },
    chaine: [],
    horsRecherche: true,
  },
  {
    // LE KRAKEN (Keko, 16/11) : le vaisseau organique — une bête de chitine et de chair, des tentacules à aiguille
    id: 'kraken',
    nom: 'Kraken',
    classe: 'chasseur',
    race: 'essaim',
    dit: 'Une bête vivante, massive et vorace, surgie des profondeurs de l’espace.',
    pieces: ['coque-10', 'propulseur-k3', 'arme-tentacules', 'arme-nuee', 'arme-rejetons'],
    serie: { possedees: ['coque-10', 'propulseur-k3', 'arme-tentacules', 'arme-nuee', 'arme-rejetons'], montees: { coque: 'coque-10', propulseur: 'propulseur-k3' }, outils: [], armes: ['arme-tentacules'] },
    chaine: [],
    horsRecherche: true,
  },
  {
    // LA VOUIVRE (Keko, 16/11) : le vaisseau organique de la corrosion et du toxique — un serpent qui crache l'acide
    id: 'vouivre',
    nom: 'Vouivre',
    classe: 'chasseur',
    race: 'essaim',
    dit: 'Une abomination venimeuse et sournoise, qui ronge ses proies à petit feu.',
    pieces: ['coque-11', 'propulseur-v3', 'arme-crachat', 'arme-mines', 'arme-poison'],
    serie: { possedees: ['coque-11', 'propulseur-v3', 'arme-crachat', 'arme-mines', 'arme-poison'], montees: { coque: 'coque-11', propulseur: 'propulseur-v3' }, outils: [], armes: ['arme-crachat'] },
    chaine: [],
    horsRecherche: true,
  },
  {
    // LE PRISME (Keko, 16/11) : le vaisseau de cristal — un cristal qui tourne à sa proue, un rayon d'énergie pure
    id: 'prisme',
    nom: 'Prisme',
    classe: 'chasseur',
    race: 'innommes',
    // (Keko, 20/11 : le Prisme 4 %, le moins fuyant ; le Néant 8 %, le plus ; le Tesseract 6 % — d'abord 5, 9, 7)
    dephasage: 0.04,
    dit: 'Un cristal de lumière pris dans sa cage d’arches, d’une pureté aveuglante.',
    pieces: ['coque-12', 'propulseur-q3', 'arme-faisceau', 'arme-cristaux', 'arme-rail'],
    serie: { possedees: ['coque-12', 'propulseur-q3', 'arme-faisceau', 'arme-cristaux', 'arme-rail'], montees: { coque: 'coque-12', propulseur: 'propulseur-q3' }, outils: [], armes: ['arme-faisceau'] },
    chaine: [],
    horsRecherche: true,
  },
  {
    // LA MANTE (Keko, 17/11 : l'Essaim « il faudra aussi leur trouver un vaisseau ») : la troisième bête, un insecte — une
    // mante religieuse, ses deux faux repliées devant elle, ses ailes qui bourdonnent quand elle pousse. SON ARME : la Nuée
    // du Kraken, en attendant les siennes (de moi, à rejuger)
    // (… PUIS LE VER — Keko, 17/11 : « je voudrais changer la Mante pour un autre concept : un vaisseau sous la forme d'un
    // ver de l'espace, qui se déplace par ondulation » ; son arme reste la Nuée. L'identifiant reste `mante` : les
    // sauvegardes et les armes choisies y sont rangées)
    id: 'mante',
    // (… PUIS LE DÉVOREUR — Keko, 19/11 : « le ver, c'est trop banal » ; l'identifiant reste `mante`)
    nom: 'Dévoreur',
    classe: 'chasseur',
    race: 'essaim',
    dit: 'Un ver épineux, tout en anneaux, qui nage dans le vide en ondulant comme un serpent.',
    pieces: ['coque-14', 'propulseur-m3', 'arme-parasites', 'arme-oeufs', 'arme-epines'],
    serie: { possedees: ['coque-14', 'propulseur-m3', 'arme-parasites', 'arme-oeufs', 'arme-epines'], montees: { coque: 'coque-14', propulseur: 'propulseur-m3' }, outils: [], armes: ['arme-parasites'] },
    chaine: [],
    horsRecherche: true,
  },
  {
    // LE NÉANT (Keko, 16/11) : le vaisseau du vide — un cœur qui bat entre deux anneaux qui l'orbitent ; l'espace-temps et
    // les dimensions. SA PREMIÈRE ARME, LE PUITS, gardé de côté « pour un futur vaisseau » ; puis LE DRAIN D'ÂME et LES
    // VRILLES D'OMBRE (Keko, 17/11 : les effets Soul Drain et Shadow Tendrils de pixelfx).
    id: 'neant',
    nom: 'Néant',
    classe: 'chasseur',
    race: 'innommes',
    // (Keko, 20/11 : le Prisme 4 %, le moins fuyant ; le Néant 8 %, le plus ; le Tesseract 6 % — d'abord 5, 9, 7)
    dephasage: 0.08,
    dit: 'Un cœur de néant qui bat entre deux anneaux : il plie l’espace et dévore la lumière.',
    pieces: ['coque-13', 'propulseur-n3', 'arme-puits', 'arme-drain', 'arme-vrilles'],
    serie: { possedees: ['coque-13', 'propulseur-n3', 'arme-puits', 'arme-drain', 'arme-vrilles'], montees: { coque: 'coque-13', propulseur: 'propulseur-n3' }, outils: [], armes: ['arme-puits'] },
    chaine: [],
    horsRecherche: true,
  },
  {
    // LE TESSERACT (Keko, 17/11 : les Innommés, « il leur manque également un autre vaisseau ») : un hypercube — un cube
    // dans un cube, qui tourne dans une quatrième dimension et se retourne sur lui-même — et, au milieu, un œil. SON ARME :
    // les balises gardées de côté, des glyphes posés que relient des rayons (de moi, à rejuger)
    // (… SA PREMIÈRE ARME, L'HYPERCUBE — Keko, 18/11 : « un cube en quatre dimensions, comme sa propre structure, lancé en
    // cloche, qui rebondit trois fois » ; les balises restent derrière lui, en attendant ses deux autres armes)
    // (… SA DEUXIÈME, LE DÉ DU DESTIN — Keko, 18/11 : un dé en 4D qui roule au-dessus d'un insecte et s'abat sur sa zone,
    // plus ou moins fort selon son chiffre ; les balises en attendant la troisième)
    // (… SA TROISIÈME, LA COUPE — Keko, 18/11 : « je voudrais bien voir ce que ça donne » : un cube qui traverse le plan
    // en biais, dont on ne voit que la tranche ; elle prend la place des balises)
    id: 'tesseract',
    nom: 'Tesseract',
    classe: 'chasseur',
    race: 'innommes',
    // (Keko, 20/11 : le Prisme 4 %, le moins fuyant ; le Néant 8 %, le plus ; le Tesseract 6 % — d'abord 5, 9, 7)
    dephasage: 0.06,
    dit: 'Un cube en quatre dimensions, qui joue avec la géométrie de l’espace-temps.',
    pieces: ['coque-15', 'propulseur-t3', 'arme-hypercube', 'arme-de', 'arme-coupe'],
    serie: { possedees: ['coque-15', 'propulseur-t3', 'arme-hypercube', 'arme-de', 'arme-coupe'], montees: { coque: 'coque-15', propulseur: 'propulseur-t3' }, outils: [], armes: ['arme-hypercube'] },
    chaine: [],
    horsRecherche: true,
  },
  {
    id: 'cuirasse',
    nom: 'Cuirassé',
    classe: 'lourd',
    race: 'humains',
    dit: 'Un mastodonte lent, à tourelles : il tire dans toutes les directions sans tourner.',
    pieces: ['coque-4', 'propulseur-l1', 'propulseur-l2', 'propulseur-l3', 'foreuse-1', 'foreuse-2', 'foreuse-3', 'aimant-1', 'aimant-2', 'radar', 'arme-canon', 'arme-rafale', 'arme-missiles'],
    serie: { possedees: ['coque-4', 'propulseur-l1', 'foreuse-1', 'arme-canon'], montees: { coque: 'coque-4', propulseur: 'propulseur-l1' }, outils: ['foreuse-1'], armes: ['arme-canon', 'arme-canon'] },
    chaine: [
      { titre: 'Mise à flot', dit: 'Décollez 2 fois.', compteur: 'vols', cible: 2, ouvre: 'arme-rafale' },
      { titre: 'Premier sang', dit: 'Abattez 2 rivaux.', compteur: 'rivaux', cible: 2, ouvre: 'propulseur-l2' },
      { titre: 'Cargo', dit: 'Extrayez 80 unités.', compteur: 'pepites', cible: 80, ouvre: 'foreuse-2' },
      { titre: 'Ligne de front', dit: 'Abattez 4 rivaux.', compteur: 'rivaux', cible: 4, ouvre: 'arme-missiles' },
      { titre: 'Long cours', dit: 'Parcourez 8 000 en vol.', compteur: 'parcouru', cible: 8000, ouvre: 'propulseur-l3' },
      { titre: 'Convoi d’or', dit: 'Extrayez 30 unités d’or.', compteur: 'or', cible: 30, ouvre: 'aimant-1' },
      { titre: 'Terreur', dit: 'Abattez 6 rivaux.', compteur: 'rivaux', cible: 6, ouvre: 'radar' },
      { titre: 'Veine bleue', dit: 'Extrayez 15 cristaux.', compteur: 'cristal', cible: 15, ouvre: 'foreuse-3' },
      { titre: 'Razzia', dit: 'Extrayez 300 unités.', compteur: 'pepites', cible: 300, ouvre: 'aimant-2' },
    ],
  },
]
export const modeleDeVaisseau = (id: string): ModeleDeVaisseau => MODELES.find((mo) => mo.id === id) ?? MODELES[0]

/** Les compteurs dont on garde LE PLUS GRAND au lieu d'additionner (comme les contrats). */
const AU_PLUS_GRAND: Compteur[] = ['distance']

/**
 * Un vaisseau qu'on a : ce qu'il porte (ses pièces achetées, montées), les pièces que ses missions ont OUVERTES à
 * l'achat, le rang de sa mission en cours (au-delà de la dernière : sa suite est finie) et où elle en est.
 */
export type EtatVaisseau = { hangar: Hangar; ouvertes: string[]; rang: number; progres: number }
/** La flotte : les vaisseaux qu'on a (par modèle), et celui qu'on pilote. */
export type Flotte = { actif: string; vaisseaux: Record<string, EtatVaisseau> }

const copie = (h: Hangar): Hangar => ({ possedees: [...h.possedees], montees: { ...h.montees }, outils: [...h.outils], armes: [...h.armes], ...(h.construites === undefined ? {} : { construites: { ...h.construites } }) })
const vaisseauNeuf = (mo: ModeleDeVaisseau): EtatVaisseau => ({ hangar: copie(mo.serie), ouvertes: [], rang: 0, progres: 0 })
export const flotteNeuve = (): Flotte => ({ actif: MODELES[0].id, vaisseaux: { [MODELES[0].id]: vaisseauNeuf(MODELES[0]) } })

export const aLeVaisseau = (f: Flotte, id: string): boolean => f.vaisseaux[id] !== undefined
/** Les modèles qu'on a, dans l'ordre du catalogue. */
export const vaisseauxDe = (f: Flotte): ModeleDeVaisseau[] => MODELES.filter((mo) => aLeVaisseau(f, mo.id))
/** La recherche a débloqué un vaisseau : il rejoint la flotte, nu (déjà là : rien ne change). */
export function ajouterLeVaisseau(f: Flotte, id: string): Flotte {
  const mo = MODELES.find((x) => x.id === id)
  if (mo === undefined || aLeVaisseau(f, id)) return f
  return { ...f, vaisseaux: { ...f.vaisseaux, [id]: vaisseauNeuf(mo) } }
}
/** Piloter un autre vaisseau de la flotte. */
export const choisirLeVaisseau = (f: Flotte, id: string): Flotte => (aLeVaisseau(f, id) && f.actif !== id ? { ...f, actif: id } : f)
/** Le hangar du vaisseau piloté. */
export const hangarActif = (f: Flotte): Hangar => f.vaisseaux[f.actif].hangar
/** Range le hangar du vaisseau piloté (la page le travaille à part). */
export const avecLeHangar = (f: Flotte, h: Hangar): Flotte => (f.vaisseaux[f.actif].hangar === h ? f : { ...f, vaisseaux: { ...f.vaisseaux, [f.actif]: { ...f.vaisseaux[f.actif], hangar: h } } })

/** Le vaisseau piloté peut porter cette pièce (elle est à son modèle). */
export const estDuModele = (f: Flotte, piece: string): boolean => modeleDeVaisseau(f.actif).pieces.includes(piece)
/** La pièce est OUVERTE À L'ACHAT sur le vaisseau piloté : une de ses missions l'a ouverte. */
export const pieceOuverteSur = (f: Flotte, piece: string): boolean => f.vaisseaux[f.actif].ouvertes.includes(piece)

/** La mission en cours d'un vaisseau qu'on a, ou null : sa suite est finie. */
export function missionDe(f: Flotte, id: string): { mission: MissionDeVaisseau; progres: number; finie: boolean } | null {
  const e = f.vaisseaux[id]
  const mission = e === undefined ? undefined : modeleDeVaisseau(id).chaine[e.rang]
  if (e === undefined || mission === undefined) return null
  return { mission, progres: e.progres, finie: e.progres >= mission.cible }
}

/** IL S'EST PASSÉ QUELQUE CHOSE EN PILOTANT : la mission du vaisseau piloté avance, si elle compte cela. */
export function noterEnVol(f: Flotte, compteur: Compteur, valeur: number): Flotte {
  const m = missionDe(f, f.actif)
  if (m === null || m.finie || m.mission.compteur !== compteur || !(valeur > 0)) return f
  const progres = Math.min(m.mission.cible, AU_PLUS_GRAND.includes(compteur) ? Math.max(m.progres, valeur) : m.progres + valeur)
  if (progres === m.progres) return f
  return { ...f, vaisseaux: { ...f.vaisseaux, [f.actif]: { ...f.vaisseaux[f.actif], progres } } }
}

/** Passe les missions dont la pièce est déjà ouverte ou possédée (une sauvegarde reprise), sans toucher une mission entamée. */
function sansLesDejaOuvertes(id: string, e: EtatVaisseau): EtatVaisseau {
  const chaine = modeleDeVaisseau(id).chaine
  let rang = e.rang
  while (e.progres === 0 && rang < chaine.length && (e.ouvertes.includes(chaine[rang].ouvre) || e.hangar.possedees.includes(chaine[rang].ouvre))) rang += 1
  return rang === e.rang ? e : { ...e, rang }
}

/** RÉCLAMER la mission terminée d'un vaisseau : sa pièce s'ouvre à l'achat SUR LUI, la suivante commence. Null si elle n'est pas terminée. */
export function reclamerLaMission(f: Flotte, id: string): { flotte: Flotte; ouvre: string } | null {
  const m = missionDe(f, id)
  if (m === null || !m.finie) return null
  const e = f.vaisseaux[id]
  const suivant = sansLesDejaOuvertes(id, { ...e, ouvertes: e.ouvertes.includes(m.mission.ouvre) ? e.ouvertes : [...e.ouvertes, m.mission.ouvre], rang: e.rang + 1, progres: 0 })
  return { flotte: { ...f, vaisseaux: { ...f.vaisseaux, [id]: suivant } }, ouvre: m.mission.ouvre }
}

/**
 * LES ANCIENS NŒUDS « PIÈCE » de la recherche (avant le 14/11, elle ouvrait les pièces pour tout le monde) : une
 * sauvegarde qui les avait débloqués garde ces pièces OUVERTES sur le chasseur — le minerai dépensé n'est pas perdu.
 */
const ANCIENS_NOEUDS: Record<string, string> = {
  'm-foreuse-2': 'foreuse-2', 'm-aimant-1': 'aimant-1', 'm-foreuse-3': 'foreuse-3', 'm-aimant-2': 'aimant-2',
  'c-canon': 'arme-canon', 'c-rafale': 'arme-rafale', 'c-coque-2': 'coque-2', 'c-coque-3': 'coque-3',
  'e-propulseur-2': 'propulseur-2', 'e-radar': 'radar', 'e-propulseur-3': 'propulseur-3',
}

/** Relit un vaisseau gardé, sans confiance : son hangar borné à son modèle, ses pièces ouvertes, sa mission. */
function lireVaisseau(mo: ModeleDeVaisseau, brut: unknown): EtatVaisseau {
  const b = (typeof brut === 'object' && brut !== null ? brut : {}) as { hangar?: unknown; ouvertes?: unknown; rang?: unknown; progres?: unknown }
  const duModele = (h: Hangar): Hangar => {
    const ok = (id: string): boolean => mo.pieces.includes(id)
    return {
      possedees: h.possedees.filter(ok),
      montees: { coque: ok(h.montees.coque) ? h.montees.coque : mo.serie.montees.coque, propulseur: ok(h.montees.propulseur) ? h.montees.propulseur : mo.serie.montees.propulseur },
      outils: h.outils.map((id) => (ok(id) ? id : '')),
      armes: h.armes.map((id) => (ok(id) ? id : '')),
      construites: Object.fromEntries(Object.entries(h.construites ?? {}).filter(([id]) => ok(id))),
    }
  }
  // (deux passes : la première borne aux pièces du modèle, la seconde reborne les listes au châssis resté monté)
  const hangar = lireHangar(duModele(lireHangar(b.hangar, copie(mo.serie))), copie(mo.serie))
  const ouvertes: string[] = []
  if (Array.isArray(b.ouvertes)) for (const id of b.ouvertes) if (typeof id === 'string' && mo.pieces.includes(id) && pieceDe(id) !== undefined && !ouvertes.includes(id)) ouvertes.push(id)
  // (une pièce qu'on a construite reste à construire : perdue jusqu'au dernier exemplaire, elle ne quitte pas la liste)
  for (const id of Object.keys(hangar.construites ?? {})) if (!ouvertes.includes(id)) ouvertes.push(id)
  const rang = typeof b.rang === 'number' && Number.isInteger(b.rang) && b.rang >= 0 ? Math.min(b.rang, mo.chaine.length) : 0
  const cible = mo.chaine[rang]?.cible ?? 0
  const progres = typeof b.progres === 'number' && Number.isFinite(b.progres) && b.progres > 0 ? Math.min(cible, b.progres) : 0
  return sansLesDejaOuvertes(mo.id, { hangar, ouvertes, rang, progres })
}

/**
 * Relit une flotte gardée, sans confiance. `ancienHangar` et `anciensNoeuds` : une sauvegarde d'avant la flotte — son
 * hangar devient celui du chasseur (ce qu'il ne peut pas porter tombe), les pièces que sa recherche avait ouvertes
 * le restent sur lui. `debloques` : les vaisseaux que la recherche a débloqués (ils sont dans la flotte, quoi que
 * dise la sauvegarde).
 */
export function lireFlotte(brut: unknown, debloques: string[] = [], ancienHangar?: unknown, anciensNoeuds: string[] = []): Flotte {
  let f = flotteNeuve()
  if (typeof brut === 'object' && brut !== null) {
    const b = brut as { actif?: unknown; vaisseaux?: unknown }
    const v = (typeof b.vaisseaux === 'object' && b.vaisseaux !== null ? b.vaisseaux : {}) as Record<string, unknown>
    const vaisseaux: Record<string, EtatVaisseau> = {}
    for (const mo of MODELES) if (mo.id === MODELES[0].id || v[mo.id] !== undefined) vaisseaux[mo.id] = lireVaisseau(mo, v[mo.id])
    f = { actif: typeof b.actif === 'string' && vaisseaux[b.actif] !== undefined ? b.actif : MODELES[0].id, vaisseaux }
  } else if (ancienHangar !== undefined) {
    const mo = MODELES[0]
    const ouvertes = anciensNoeuds.map((n) => ANCIENS_NOEUDS[n]).filter((id): id is string => id !== undefined && mo.pieces.includes(id))
    f = { actif: mo.id, vaisseaux: { [mo.id]: lireVaisseau(mo, { hangar: ancienHangar, ouvertes }) } }
  }
  for (const id of debloques) f = ajouterLeVaisseau(f, id)
  return f
}

/** Ce qu'une pièce coûte en minerai (rien, si elle ne le dit pas). */
export const coutEnMinerai = (piece: string): Cargaison => {
  const c = pieceDe(piece)?.cout
  const r = {} as Cargaison
  for (const k of MINERAIS) r[k] = c?.[k] ?? 0
  return r
}

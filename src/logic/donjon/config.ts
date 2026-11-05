/**
 * LE DONJON COOPÉRATIF — TOUT L'ÉQUILIBRAGE EST ICI.
 *
 * Plusieurs joueurs frappent un ennemi commun ; mort, il est remplacé par un
 * plus fort à l'étage suivant ; la saison dure une semaine, puis tout repart.
 *
 * *Aucun chiffre d'équilibrage ne vit ailleurs* : les règles (`regles.ts`) et
 * les bots (`bots.ts`) ne lisent que cet objet, qu'on leur passe — la
 * simulation peut donc en essayer un autre sans toucher au code. Tous les
 * chiffres sont de moi, à rejuger par Keko sur le rapport de
 * `npm run donjon`.
 *
 * Les durées sont en millisecondes de TEMPS DE JEU (voir `horloge.ts`).
 */

const SECONDE = 1000
const MINUTE = 60 * SECONDE
const HEURE = 60 * MINUTE
export const JOUR = 24 * HEURE

/**
 * LES CINQ STATS, UN POINT PAR NIVEAU, PLACÉ LIBREMENT (Keko : « 1 point par
 * niveau, c'est tout » ; « j'ai peur qu'on ferme trop le build des joueurs
 * avec le système de caracs » — retour aux stats libres, l'identité passe
 * par l'ARME). Coup (dégâts), Vitesse (le tap et l'auto), Critique (la
 * chance), Force (les dégâts critiques), Récupération (la forme).
 */
export type CleAmelioration = 'tap' | 'vitesse' | 'chanceCrit' | 'multCrit' | 'recuperation'
export const AMELIORATIONS: readonly CleAmelioration[] = ['tap', 'vitesse', 'chanceCrit', 'multCrit', 'recuperation']

/** Les armes : chacune ses dégâts, sa recharge, son petit bonus (voir `armes`). */
export type TypeArme = 'epee' | 'dague' | 'baton' | 'arc' | 'deuxMains' | 'hache' | 'hacheDeuxMains' | 'massue' | 'massueDeuxMains' | 'lance' | 'marteau' | 'marteauDeuxMains' | 'arbalete' | 'pistolet' | 'mousquet' | 'rapiere' | 'fouet' | 'fleau' | 'griffes' | 'fronde' | 'shuriken' | 'boomerang' | 'kunai' | 'couteau' | 'luth' | 'baguette'
export const ARMES: readonly TypeArme[] = ['epee', 'dague', 'baton', 'arc', 'deuxMains', 'hache', 'hacheDeuxMains', 'massue', 'massueDeuxMains', 'lance', 'marteau', 'marteauDeuxMains', 'arbalete', 'pistolet', 'mousquet', 'rapiere', 'fouet', 'fleau', 'griffes', 'fronde', 'shuriken', 'boomerang', 'kunai', 'couteau', 'luth', 'baguette']
/** Les armes qui ont un passif de classe (les provisoires n'ont pas encore le leur, sauf l'épée à deux mains, une épée, et la lance et la rapière, qui percent comme la dague). */
export type ArmeAPassif = 'epee' | 'deuxMains' | 'dague' | 'lance' | 'rapiere' | 'massue' | 'massueDeuxMains' | 'marteau' | 'marteauDeuxMains' | 'fleau' | 'baton'
/**
 * CE QU'ON A EN MAIN : une arme, ou rien (Keko : « déséquiper l'arme pour
 * être à mains nues, sans capacité ») — ni capacité, ni passif de classe.
 */
export type Equipement = TypeArme | 'mains'
export const EQUIPEMENTS: readonly Equipement[] = ['mains', ...ARMES]
/**
 * LES CAPACITÉS : deux boutons de chaque côté de l'attaque, pris dans un pool
 * selon l'arme (Keko : « plus puissantes, un temps de recharge plus long que
 * l'attaque — pas un truc qu'on spamme — ou un déclenchement conditionnel »).
 * Le pool validé compte aussi Poison, Coup de grâce et Second souffle, gardés
 * pour de futures armes : ils ne sont pas encore écrits (`docs/donjon.md`).
 */
export type CleCapacite = 'frappeLourde' | 'briseGarde' | 'lamesOmbre' | 'furie' | 'bouleDeFeu' | 'meditation'
export const CAPACITES: readonly CleCapacite[] = ['frappeLourde', 'briseGarde', 'lamesOmbre', 'furie', 'bouleDeFeu', 'meditation']

/**
 * Une capacité : prête après sa `recharge` (ms, comptée du lancer) ou après
 * `critiques` coups critiques ; puis son effet — un `coup` (× les dégâts du
 * tap), un `bonus` sur tous vos coups pendant `duree`, des taps tous
 * critiques pendant `duree` (`critique`), ou `forme` minutes de forme rendues.
 */
export type Capacite = {
  nom: string
  recharge?: number
  critiques?: number
  coup?: number
  bonus?: number
  critique?: boolean
  duree?: number
  forme?: number
}

/**
 * LE PASSIF DE CLASSE (Keko : « un passif qui dépendrait de la classe d'arme,
 * le même pour tous les bâtons, qui change profondément le gameplay — faire
 * apparaître des choses à toucher sur l'ennemi »). UN TAP SUR `chance`
 * OUVRE UN ÉVÉNEMENT (Keko, 05/11 : « un % de chance à chaque tap pour tous,
 * avec un % qui dépend de l'effet/classe ») — le tap à la main seul, pas
 * l'auto ; aucun ne s'ouvre tant que le précédent n'est ni touché ni
 * expiré ; au `pitie`-ième tap sans, il s'ouvre à coup sûr. Il dure `duree`
 * ms ; on touche ses `cibles` dans l'ordre, et la dernière déclenche le
 * `coup` (en taps, critique forcé si `critique`). Il n'use pas la forme.
 */
export type Passif = {
  nom: string
  /** La chance qu'un tap ouvre un événement (0 à 1). */
  chance: number
  /** Le tap qui l'ouvre à coup sûr, compté depuis le dernier événement. */
  pitie: number
  /** Ses deux cibles sont les bouts d'un TRAIT à tracer d'un geste (la Taille des épées). */
  trait?: boolean
  /**
   * LA SÉRIE : réussi, l'événement en rouvre un autre `entre` ms plus tard,
   * plus court de `raccourci` à chaque fois, sans fin — jusqu'au premier raté.
   */
  serie?: { entre: number; raccourci: number }
  /**
   * LA GRÂCE : un geste fini jusqu'à `grace` ms après la fin compte encore
   * (Keko : « si je valide une étape trop tard, elle est bonne mais la
   * suivante n'apparaît pas, alors qu'une étape réussie doit toujours
   * amener la suivante » — l'écran l'acceptait, les règles l'avaient fermée).
   * L'écran garde le trait traçable aussi longtemps : ils jugent pareil.
   */
  grace?: number
  /**
   * LE CUMUL (les Points faibles) : un point touché ne frappe pas tout de
   * suite ; la série s'encaisse au premier manqué, un `coup` par point.
   */
  cumul?: boolean
  /**
   * LE TEMPS JUSTE (le Fracas des contondantes) : on touche quand l'anneau
   * recouvre le rond, à `timing` ms près — à la fin de la fenêtre moins
   * `timing`. Trop tôt, c'est raté (la série s'encaisse) ; trop tard, la
   * fenêtre est passée.
   */
  timing?: number
  duree: number
  cibles: number
  coup: number
  critique?: boolean
}

/** Le cran d'une arme, les cinq des cartes (Keko : les armes porteront une rareté). */
export type RareteArme = 'commune' | 'peuCommune' | 'rare' | 'epique' | 'legendaire'

export type ProfilBot = {
  /** L'identifiant du joueur, stable d'une saison à l'autre. */
  id: string
  nom: string
  /** En moyenne ; l'écart entre deux passages est tiré autour (`ecartPassage`). */
  passagesParJour: number
  /** Le nombre de taps d'un passage, tiré dans [min, max]. */
  taps: [number, number]
  /** Son arme. */
  arme: TypeArme
  /** La règle de dépense : il met son point dans la caractéristique la plus en retard sur son poids (absente : jamais). */
  poids: Partial<Record<CleAmelioration, number>>
  /** La part des événements du passif qu'il réussit, quand il est là (0 à 1). */
  adresse: number
}

export const DONJON = {
  saison: {
    duree: 7 * JOUR,
    /** Le journal garde les N derniers événements. */
    journalMax: 80,
  },

  /** PV de l'étage n : `base · n^exposant`. Polynomial : le donjon se durcit sans mur. */
  ennemi: {
    pvBase: 120,
    exposant: 2.2,
  },

  /** L'XP pour passer du niveau n au suivant : `base · n^exposant`. */
  xp: {
    parDegat: 1,
    base: 40,
    exposant: 2.7,
    // La Sagesse (un bonus d'XP) est partie : l'XP suit les dégâts, que toutes
    // les améliorations de dégâts boostent déjà (Keko : « l'xp est déjà
    // boostée car elle dépend des dégâts »).
  },

  /**
   * LES POINTS ET L'OFFRE (Keko : « quand on level up, avoir le choix entre
   * 3 options plutôt que toute la liste, au hasard »). Chaque point (un par
   * niveau) ouvre une OFFRE de `tailleOffre` améliorations différentes,
   * tirées au hasard seedé ; on en prend une, elle gagne un rang, le point
   * part. *Plus de coût par rang* : le rendement décroissant des effets en
   * tient lieu. Sans coût, chaque point valait un rang (environ cinq fois
   * plus de rangs qu'avant) et l'assidu raflait tout (étage 217, 59 % des
   * dégâts, mesuré) : le coup fatal ne rapporte plus de point, et la courbe
   * d'XP est plus raide (2,7 au lieu de 2,4) — étage 101, assidu 37 %.
   */
  points: {
    parNiveau: 1,
    parKill: 0,
  },

  /**
   * TOUTES LES AMÉLIORATIONS RENDENT DE MOINS EN MOINS (Keko : « il faudrait
   * que toutes les upgrades aient un rendement décroissant » ; « pour les
   * chances de crit il ne faut jamais atteindre 100 %, mais pour le coup et
   * la force de critique, pas de limite infranchissable, quand même un
   * rendement décroissant, et on exprime en % »). Le Coup et la Force : un
   * bonus en % de la base, `gain · rang^exposant` (exposant < 1 : chaque rang
   * rapporte moins que le précédent, sans plafond). La Critique et l'Auto :
   * chaque rang retire une part de l'écart qui reste à leur borne, qu'ils
   * n'atteignent jamais.
   */
  /** Dégâts d'un COUP (un tap, ou un coup d'auto) : `base × (1 + gain · rang^exposant)`. */
  /**
   * LES ARMES DONNENT L'IDENTITÉ (Keko, option 1 : « revenir aux 5 stats
   * libres, et donner l'identité par l'arme elle-même ») : des dégâts, une
   * recharge (l'auto suit, à `auto.depart` recharges), un petit bonus. Le DPS
   * de base est le même (40 avant critiques) ; le bonus fait la différence.
   * Épée équilibrée (Récupération +20 %), dague rapide (+5 points de chance
   * de critique), bâton lent (+50 % de dégâts critiques). À MAINS NUES, la
   * moitié des dégâts de l'épée, sans bonus ni capacité (chiffres de moi).
   * L'ARC est PROVISOIRE (Keko, 04/11 : « essayons l'arc » — pour son coup à
   * l'écran, la flèche) : le DPS de base des autres (12 toutes les 0,3 s),
   * ni bonus, ni capacité, ni passif tant qu'ils ne sont pas définis.
   * L'ÉPÉE À DEUX MAINS aussi (Keko : « on fait l'épée à deux mains ? ») :
   * lente et lourde, 20 toutes les 0,5 s — le même DPS de base. La HACHE
   * et la HACHE À DEUX MAINS aussi (Keko : « on utilise le slash épée et le
   * slash épée à deux mains pour la hache et la hache à deux mains ») : 11
   * toutes les 0,275 s, 22 toutes les 0,55 s. La MASSUE et la MASSUE À DEUX
   * MAINS aussi (Keko : « l'animation actuelle du bâton pour les massues à une
   * main, une version plus longue pour les massues à deux mains, dont les
   * bâtons ») : 13 toutes les 0,325 s, 24 toutes les 0,6 s. La LANCE aussi
   * (Keko : « on essaie la lance maintenant ? ») : 12 toutes les 0,3 s. Le
   * MARTEAU aussi (Keko : « un marteau, avec écrasement ») : 15 toutes les
   * 0,375 s, et le MARTEAU À DEUX MAINS (« une version deux mains ? ») : 28
   * toutes les 0,7 s. L'ARBALÈTE aussi (Keko : « une arbalète, en mode grosse
   * flèche ») : 20 toutes les 0,5 s. Le PISTOLET aussi (Keko : « une arme à
   * feu, type médiéval fantasy, à une main ») : 14 toutes les 0,35 s, et le
   * MOUSQUET, sa version à deux mains : 26 toutes les 0,65 s. La RAPIÈRE aussi
   * (Keko : « l'effet lance, mais avec une aiguille ») : 11 toutes les 0,275 s.
   * Le FOUET et le FLÉAU D'ARMES aussi (Keko : « essayons la catégorie
   * fouet, chaîne, fléau ») : 10 toutes les 0,25 s, 15 toutes les 0,375 s.
   * Les GRIFFES aussi (Keko : « les griffes, gantelets à lames ») : 7 toutes
   * les 0,175 s. La FRONDE aussi (Keko : « les tirs en cloche, la fronde ») :
   * 12 toutes les 0,3 s. Le SHURIKEN, le BOOMERANG et le KUNAI aussi (Keko :
   * « on essaie les armes de jet ? », puis « oublie la hache de lancer, on
   * l'utilise pour faire un boomerang, et ajoute le kunai ») : 8 toutes les
   * 0,2 s, 14 toutes les 0,35 s, 9 toutes les 0,225 s. Le COUTEAU DE LANCER
   * aussi (Keko : « comme le kunai, mais avec une forme de couteau ») : 10
   * toutes les 0,25 s. Le LUTH aussi (Keko : « un instrument de musique, des
   * notes comme projectiles ») : 10 toutes les 0,25 s. La BAGUETTE aussi
   * (Keko : « on passe à la magie, essayons un projectile magique ») : 10
   * toutes les 0,25 s.
   */
  armes: {
    mains: { nom: 'Mains nues', rarete: 'commune', degats: 5, recharge: 0.25 * SECONDE, chanceCrit: 0, multCrit: 0, recuperation: 0, capacites: [] },
    epee: { nom: 'Épée', rarete: 'commune', degats: 10, recharge: 0.25 * SECONDE, chanceCrit: 0, multCrit: 0, recuperation: 0.2, capacites: ['frappeLourde', 'briseGarde'] },
    dague: { nom: 'Dague', rarete: 'commune', degats: 7, recharge: 0.175 * SECONDE, chanceCrit: 0.05, multCrit: 0, recuperation: 0, capacites: ['lamesOmbre', 'furie'] },
    baton: { nom: 'Bâton', rarete: 'commune', degats: 15, recharge: 0.375 * SECONDE, chanceCrit: 0, multCrit: 0.5, recuperation: 0, capacites: ['bouleDeFeu', 'meditation'] },
    arc: { nom: 'Arc', rarete: 'commune', degats: 12, recharge: 0.3 * SECONDE, chanceCrit: 0, multCrit: 0, recuperation: 0, capacites: [] },
    deuxMains: { nom: 'Épée à deux mains', rarete: 'commune', degats: 20, recharge: 0.5 * SECONDE, chanceCrit: 0, multCrit: 0, recuperation: 0, capacites: [] },
    hache: { nom: 'Hache', rarete: 'commune', degats: 11, recharge: 0.275 * SECONDE, chanceCrit: 0, multCrit: 0, recuperation: 0, capacites: [] },
    hacheDeuxMains: { nom: 'Hache à deux mains', rarete: 'commune', degats: 22, recharge: 0.55 * SECONDE, chanceCrit: 0, multCrit: 0, recuperation: 0, capacites: [] },
    massue: { nom: 'Massue', rarete: 'commune', degats: 13, recharge: 0.325 * SECONDE, chanceCrit: 0, multCrit: 0, recuperation: 0, capacites: [] },
    massueDeuxMains: { nom: 'Massue à deux mains', rarete: 'commune', degats: 24, recharge: 0.6 * SECONDE, chanceCrit: 0, multCrit: 0, recuperation: 0, capacites: [] },
    lance: { nom: 'Lance', rarete: 'commune', degats: 12, recharge: 0.3 * SECONDE, chanceCrit: 0, multCrit: 0, recuperation: 0, capacites: [] },
    marteau: { nom: 'Marteau', rarete: 'commune', degats: 15, recharge: 0.375 * SECONDE, chanceCrit: 0, multCrit: 0, recuperation: 0, capacites: [] },
    marteauDeuxMains: { nom: 'Marteau à deux mains', rarete: 'commune', degats: 28, recharge: 0.7 * SECONDE, chanceCrit: 0, multCrit: 0, recuperation: 0, capacites: [] },
    arbalete: { nom: 'Arbalète', rarete: 'commune', degats: 20, recharge: 0.5 * SECONDE, chanceCrit: 0, multCrit: 0, recuperation: 0, capacites: [] },
    pistolet: { nom: 'Pistolet', rarete: 'commune', degats: 14, recharge: 0.35 * SECONDE, chanceCrit: 0, multCrit: 0, recuperation: 0, capacites: [] },
    mousquet: { nom: 'Mousquet', rarete: 'commune', degats: 26, recharge: 0.65 * SECONDE, chanceCrit: 0, multCrit: 0, recuperation: 0, capacites: [] },
    rapiere: { nom: 'Rapière', rarete: 'commune', degats: 11, recharge: 0.275 * SECONDE, chanceCrit: 0, multCrit: 0, recuperation: 0, capacites: [] },
    fouet: { nom: 'Fouet', rarete: 'commune', degats: 10, recharge: 0.25 * SECONDE, chanceCrit: 0, multCrit: 0, recuperation: 0, capacites: [] },
    fleau: { nom: "Fléau d'armes", rarete: 'commune', degats: 15, recharge: 0.375 * SECONDE, chanceCrit: 0, multCrit: 0, recuperation: 0, capacites: [] },
    griffes: { nom: 'Griffes', rarete: 'commune', degats: 7, recharge: 0.175 * SECONDE, chanceCrit: 0, multCrit: 0, recuperation: 0, capacites: [] },
    fronde: { nom: 'Fronde', rarete: 'commune', degats: 12, recharge: 0.3 * SECONDE, chanceCrit: 0, multCrit: 0, recuperation: 0, capacites: [] },
    shuriken: { nom: 'Shuriken', rarete: 'commune', degats: 8, recharge: 0.2 * SECONDE, chanceCrit: 0, multCrit: 0, recuperation: 0, capacites: [] },
    boomerang: { nom: 'Boomerang', rarete: 'commune', degats: 14, recharge: 0.35 * SECONDE, chanceCrit: 0, multCrit: 0, recuperation: 0, capacites: [] },
    kunai: { nom: 'Kunai', rarete: 'commune', degats: 9, recharge: 0.225 * SECONDE, chanceCrit: 0, multCrit: 0, recuperation: 0, capacites: [] },
    couteau: { nom: 'Couteau de lancer', rarete: 'commune', degats: 10, recharge: 0.25 * SECONDE, chanceCrit: 0, multCrit: 0, recuperation: 0, capacites: [] },
    luth: { nom: 'Luth', rarete: 'commune', degats: 10, recharge: 0.25 * SECONDE, chanceCrit: 0, multCrit: 0, recuperation: 0, capacites: [] },
    baguette: { nom: 'Baguette', rarete: 'commune', degats: 10, recharge: 0.25 * SECONDE, chanceCrit: 0, multCrit: 0, recuperation: 0, capacites: [] },
  } as Record<
    Equipement,
    { nom: string; rarete: RareteArme; degats: number; recharge: number; chanceCrit: number; multCrit: number; recuperation: number; capacites: readonly CleCapacite[] }
  >,

  /**
   * LES PASSIFS DE CLASSE (Keko, 04/11 : « je valide tout »), chiffres de moi.
   * Un geste par classe : l'ÉPÉE riposte (réflexe — l'ennemi arme son coup,
   * on le touche dans la fenêtre), la DAGUE vise les points faibles
   * (précision — une cible sur l'ennemi, un coup critique forcé, un cran de
   * Furie), le BÂTON trace ses runes (séquence — trois, dans l'ordre ; une
   * erreur les efface). Tout réussi en spammant, chacun ajoute de 35 à 50 %
   * aux taps de son arme. LA CHANCE PAR TAP garde la cadence des anciennes
   * tranches au spam (recharge ÷ période : 0,25 s ÷ 12 s, 0,175 ÷ 3,
   * 0,375 ÷ 15), la pitié à trois fois l'attente moyenne. LES ÉPÉES TAILLENT
   * (Keko, 05/11 : « on trace une trajectoire de slash et le joueur doit la
   * tracer au doigt avant la fin du timer » ; l'épée à deux mains aussi ; un
   * trait droit ; « Taille », ×20 gardé) : à la place de la Riposte, un
   * trait en travers de l'ennemi, ses deux bouts dans l'ordre, 2 s pour le
   * voir et le tracer ; l'épée à deux mains, deux fois plus lente, a deux
   * fois plus de chance par tap. EN SÉRIE (Keko : « autant de traits que
   * réussis, chacun fait ×20, en sachant que réussir 5 devient quasi
   * impossible en rapidité, mais le joueur doit avoir l'impression que c'est
   * sans limite ») : chaque trait réussi en ouvre un autre 0,65 s plus tard
   * (le temps du coup), plus court d'un tiers — 2 s, 1,3, 0,85, 0,55, 0,36…
   * LES POINTS FAIBLES EN SÉRIE (Keko, 05/11 : « un système de combo comme la
   * Taille : des ronds avec la même animation, sans la traînée ; le joueur
   * doit les cliquer à temps, et une fois qu'il échoue, on plante une
   * animation d'attaque à l'endroit de chaque rond réussi — pas de dégâts
   * après chaque réussite individuelle ») : un rond à la fois ; au premier
   * manqué, chaque point touché frappe ×3, critique, un cran de Furie. AUSSI
   * DUR QUE LA TAILLE (Keko : « là, c'est trop facile, car tu as juste à
   * cliquer ») : 1 s, puis chacun presque moitié plus court (×0,55 : 1, 0,55,
   * 0,3, 0,17, 0,09 — grâce comprise, le cinquième tient 0,34 s), loin du
   * précédent, 0,12 s entre deux. LA LANCE ET LA RAPIÈRE AUSSI (Keko :
   * « on l'applique aussi à la lance et la rapière ? ») : la même série, la
   * chance par tap ramenée à leur cadence (la dague 6 % toutes les 0,175 s ;
   * la lance, 0,3 s, 10 % ; la rapière, 0,275 s, 9,5 %), la pitié aussi.
   * LES CONTONDANTES FRAPPENT EN FRACAS (Keko, 05/11 : « il faut taper au
   * timing exact, au moment où le cercle superpose le rond ») : la série
   * des Points faibles, mais au temps juste — l'anneau recouvre le rond
   * 1,2 s après son apparition, et il faut toucher à 0,1 s près ; trop tôt,
   * c'est raté. Chaque rond suivant, l'anneau va 30 % plus vite (1,2, 0,81,
   * 0,54, 0,35, 0,21 s) ; au premier raté, chaque coup juste frappe ×5. Un
   * événement toutes les 8 s environ au spam (la massue 4 %, les armes à deux
   * mains 7,5 % et 8,75 %, le marteau et le fléau 4,7 %), chiffres de moi.
   */
  passifs: {
    epee: { nom: 'Taille', chance: 0.02, pitie: 150, duree: 2 * SECONDE, cibles: 2, coup: 20, trait: true, serie: { entre: 0.65 * SECONDE, raccourci: 0.65 }, grace: 0.25 * SECONDE },
    deuxMains: { nom: 'Taille', chance: 0.04, pitie: 75, duree: 2 * SECONDE, cibles: 2, coup: 20, trait: true, serie: { entre: 0.65 * SECONDE, raccourci: 0.65 }, grace: 0.25 * SECONDE },
    dague: { nom: 'Points faibles', chance: 0.06, pitie: 50, duree: 1 * SECONDE, cibles: 1, coup: 3, critique: true, serie: { entre: 0.12 * SECONDE, raccourci: 0.55 }, grace: 0.25 * SECONDE, cumul: true },
    lance: { nom: 'Points faibles', chance: 0.1, pitie: 30, duree: 1 * SECONDE, cibles: 1, coup: 3, critique: true, serie: { entre: 0.12 * SECONDE, raccourci: 0.55 }, grace: 0.25 * SECONDE, cumul: true },
    massue: { nom: 'Fracas', chance: 0.04, pitie: 75, duree: 1.3 * SECONDE, cibles: 1, coup: 5, serie: { entre: 0.3 * SECONDE, raccourci: 0.7 }, cumul: true, timing: 0.1 * SECONDE },
    massueDeuxMains: { nom: 'Fracas', chance: 0.075, pitie: 40, duree: 1.3 * SECONDE, cibles: 1, coup: 5, serie: { entre: 0.3 * SECONDE, raccourci: 0.7 }, cumul: true, timing: 0.1 * SECONDE },
    marteau: { nom: 'Fracas', chance: 0.047, pitie: 64, duree: 1.3 * SECONDE, cibles: 1, coup: 5, serie: { entre: 0.3 * SECONDE, raccourci: 0.7 }, cumul: true, timing: 0.1 * SECONDE },
    marteauDeuxMains: { nom: 'Fracas', chance: 0.0875, pitie: 34, duree: 1.3 * SECONDE, cibles: 1, coup: 5, serie: { entre: 0.3 * SECONDE, raccourci: 0.7 }, cumul: true, timing: 0.1 * SECONDE },
    fleau: { nom: 'Fracas', chance: 0.047, pitie: 64, duree: 1.3 * SECONDE, cibles: 1, coup: 5, serie: { entre: 0.3 * SECONDE, raccourci: 0.7 }, cumul: true, timing: 0.1 * SECONDE },
    rapiere: { nom: 'Points faibles', chance: 0.095, pitie: 32, duree: 1 * SECONDE, cibles: 1, coup: 3, critique: true, serie: { entre: 0.12 * SECONDE, raccourci: 0.55 }, grace: 0.25 * SECONDE, cumul: true },
    baton: { nom: 'Runes', chance: 0.025, pitie: 120, duree: 5 * SECONDE, cibles: 3, coup: 20 },
  } as Record<ArmeAPassif, Passif>,

  /**
   * LE POOL DES CAPACITÉS (Keko, 04/11 : « je valide tout »), chiffres de moi.
   * Le tap spammé fait ~46 de DPS : « un coup ×15 toutes les 20 s » en
   * ajoute ~7,5, un sixième. Une capacité subit la forme comme le tap, mais
   * n'en use pas : elle ne se spamme pas. L'épée : Frappe lourde et
   * Brise-garde ; la dague : Lames de l'ombre et Furie (ses critiques la
   * remplissent, les Lames d'un coup) ; le bâton : Boule de feu et Méditation.
   */
  capacites: {
    frappeLourde: { nom: 'Frappe lourde', recharge: 20 * SECONDE, coup: 15 },
    briseGarde: { nom: 'Brise-garde', recharge: 45 * SECONDE, bonus: 0.5, duree: 10 * SECONDE },
    lamesOmbre: { nom: "Lames de l'ombre", recharge: 30 * SECONDE, critique: true, duree: 5 * SECONDE },
    furie: { nom: 'Furie', critiques: 10, coup: 25 },
    bouleDeFeu: { nom: 'Boule de feu', recharge: 40 * SECONDE, coup: 30 },
    meditation: { nom: 'Méditation', recharge: 60 * SECONDE, forme: 1 },
  } as Record<CleCapacite, Capacite>,

  tap: {
    /** +30 % au premier rang de « Coup », puis de moins en moins. */
    gain: 0.3,
    exposant: 0.8,
    /**
     * LA PLAGE DE DÉGÂTS (Keko : « une plage de dégâts plutôt qu'un nombre
     * fixe ? » — « ok essaie ça ») : chaque coup, tap ou auto, vaut de
     * `1 − ecart` à `1 + ecart` de sa valeur, tiré uniformément, avant le
     * critique. La moyenne ne bouge pas ; à ±15 %, un coup normal (115 % au
     * plus) ne rejoint jamais un critique (170 % au moins). CHAQUE COUP EST
     * ARRONDI À L'ENTIER LE PLUS PROCHE (Keko : « arrondir les chiffres
     * décimaux à l'entier le plus proche »), plage, critique et forme compris.
     */
    ecart: 0.15,
    // LA RECHARGE DU TAP, sa vitesse d'attaque (Keko : « un CD sur le bouton,
    // disons 1 s pour tester », puis 0,5 s, puis 0,25 s) : un tap au plus
    // par recharge. Elle est maintenant celle de l'ARME (`armes`).
  },

  /**
   * L'AUTO-TAP EST UN TAP QUI SE DONNE TOUT SEUL (Keko : « mettre les coups
   * auto exactement comme les autres et avec les mêmes dégâts »). Dès le
   * début, chaque joueur frappe un coup à chaque période : les dégâts du
   * Coup, critique compris, sans la forme (ni fatigue ni repos). Les coups de
   * chacun tombent sur les multiples de sa période depuis le début de la
   * saison. LA PÉRIODE SE COMPTE EN RECHARGES DU TAP, ET N'EST JAMAIS PLUS
   * COURTE (Keko : « l'auto-tap ne doit jamais être plus rapide que le
   * manuel », « 10 fois le CD manuel ») : `depart` recharges, toujours. Une
   * amélioration « Auto-tap » la rapprochait de la recharge ; elle est
   * devenue la Vitesse, qui accélère les deux ensemble (ci-dessous).
   */
  auto: {
    /** La période de l'auto, en recharges du tap : 10, toujours (la Vitesse accélère les deux ensemble). */
    depart: 10,
  },

  /**
   * LA VITESSE (Keko : « rajouter vitesse d'attaque, qui réduit le CD
   * d'attaque, ce qui impacte aussi indirectement la vitesse de l'auto ;
   * on fusionne les deux ? » — option A, une seule stat). Elle remplace
   * l'Auto-tap : la recharge du tap se divise par `1 + gain · rang^exposant`
   * (sans plafond, de moins en moins par rang), et l'auto, à `auto.depart`
   * recharges, suit du même pas — jamais plus vite que le tap. Le jour des
   * armes, elle s'appliquera à la recharge de l'arme.
   */
  vitesse: {
    gain: 0.1,
    exposant: 0.8,
  },

  crit: {
    /** La chance : `1 − (1 − base) · garde^rang`, vers 100 % sans jamais l'atteindre. */
    chanceBase: 0.05,
    chanceGarde: 0.98,
    /** La force (ce que multiplie un critique) : `base × (1 + gain · rang^exposant)`, sans plafond. */
    multBase: 2,
    multGain: 0.125,
    multExposant: 0.8,
  },

  /**
   * LA FORME : un curseur qui multiplie les taps de 0 % à 200 % (Keko : « un
   * continuum qui tend vers 0 % - 200 % entre fatigue max et repos max »).
   * ELLE SE COMPTE EN MINUTES DE SPAM (Keko : « calculer le DPS moyen et dire
   * que la fatigue commence à partir d'un nombre de dégâts infligés égal à
   * 1 min de spam ») : un tap la pousse vers la gauche de ce que ses dégâts
   * (critique compris, forme non comprise) représentent du DPS d'un
   * spammeur — un tap à chaque fin de recharge, critiques à la moyenne. Un
   * coup lent et fort use autant que plusieurs rapides et faibles pour les
   * mêmes dégâts. ON COMMENCE PILE AU MILIEU (0) d'un `palier` à 100 % qui
   * s'étend de −palier/2 à +palier/2 (Keko : « commencer pile au milieu »,
   * la zone centrale « au moins 1/3 de la barre ») ; au-delà, `fatigue`
   * minutes jusqu'à 0 % à gauche, `repos` minutes jusqu'à 200 % à droite.
   * Le temps la pousse vers la droite : vite sous le milieu
   * (`recuperationParHeure`), lentement au-dessus (`reposParHeure`) — « si
   * tu fais rien tu passes pas tout de suite en repos ». L'auto n'y est pas
   * soumis.
   */
  forme: {
    /** Une minute de spam de chaque côté du milieu avant la fatigue. */
    palier: 2,
    fatigue: 2,
    /** Deux minutes de spam pour consommer tout le repos (1 essayé, Keko : « passe le repos à 2 min »). */
    repos: 2,
    /** Sous le milieu : du fond au milieu (3 min de spam) en 30 min. */
    recuperationParHeure: 6,
    /** Au-dessus : du milieu à 200 % (3 min de spam) en 8 h ; le repos commence après 2 h 40. */
    reposParHeure: 0.375,
    /**
     * LES STATS DE LA FORME (Keko : « des stats qui jouent sur le système de
     * fatigue » ; « augmenter la durée des paliers n'est pas super, on ne
     * veut pas forcer les joueurs à spammer plus longtemps ») : elles jouent
     * sur l'intensité ou sur le temps hors du jeu, jamais sur la durée d'une
     * session. Toutes en `1 + gain · rang^exposant`, sans plafond, de moins en
     * moins par rang. ARDEUR : le haut du repos (200 % au rang 0) monte de
     * ce bonus. RÉCUPÉRATION : la forme se refait plus vite, des deux côtés —
     * la fatigue se résorbe et le repos se remplit (Keko : « fusionner la
     * récup de fatigue et la vitesse de repos en une seule stat » ; c'étaient
     * Récupération et Sommeil).
     */
    /**
     * UN SAUT À LA SORTIE DU BLANC (Keko : « un petit cap qui commence à
     * 150 % jusqu'à 200 % au max, et de 50 % à 0 % en fatigue ») : un pas
     * dans le repos frappe déjà à `entreeRepos`, un pas dans la fatigue
     * tombe déjà à `entreeFatigue`.
     */
    entreeRepos: 1.5,
    entreeFatigue: 0.5,
    /**
     * Le haut du repos : 200 %, fixe. L'Ardeur, qui le montait, n'est plus
     * une amélioration générale (Keko : « je pense pas qu'on devrait toucher
     * au maximum de repos en stat générale »).
     */
    reposMax: 2,
    recuperation: { gain: 0.15, exposant: 0.8 },
  },

  bots: {
    /** Écart entre deux passages : la moyenne × un facteur tiré dans [1 − e, 1 + e]. */
    ecartPassage: 0.5,
    profils: [
      {
        id: 'assidu',
        nom: 'Bot assidu',
        passagesParJour: 8,
        taps: [30, 50],
        arme: 'epee',
        poids: { tap: 3, vitesse: 3, chanceCrit: 1, multCrit: 1 },
        adresse: 0.8,
      },
      {
        id: 'occasionnel-a',
        nom: 'Bot occasionnel A',
        passagesParJour: 2,
        taps: [20, 40],
        arme: 'dague',
        poids: { tap: 1, vitesse: 3, chanceCrit: 1, multCrit: 1 },
        adresse: 0.6,
      },
      {
        id: 'occasionnel-b',
        nom: 'Bot occasionnel B',
        passagesParJour: 2,
        taps: [15, 35],
        arme: 'baton',
        poids: { tap: 2, vitesse: 2, chanceCrit: 1, multCrit: 1 },
        adresse: 0.6,
      },
      {
        id: 'fantome',
        nom: 'Bot fantôme',
        passagesParJour: 1 / 3,
        taps: [10, 30],
        arme: 'epee',
        poids: { tap: 1, vitesse: 1 },
        adresse: 0.3,
      },
    ] as ProfilBot[],
  },

  /** Les vitesses proposées à l'écran. */
  vitesses: [1, 60, 1000],
}

export type ConfigDonjon = typeof DONJON

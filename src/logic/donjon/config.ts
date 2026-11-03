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
 * LES CARACTÉRISTIQUES (Keko : « convertir notre tableau en système de
 * caracs : force, dex, intel, stamina ; chaque carac augmente une partie des
 * stats, en distinguant les armes de force / agilité / intel » ; « 1 point
 * de carac par niveau, c'est tout »). Le nom de type reste `CleAmelioration`
 * (et le champ `ameliorations`) : ce sont elles qu'on améliore.
 * - FORCE : les dégâts des armes de force, et les dégâts critiques ;
 * - DEXTÉRITÉ : les dégâts des armes d'agilité, et la vitesse (tap et auto) ;
 * - INTELLIGENCE : les dégâts des armes d'intel, et la chance de critique ;
 * - ENDURANCE : la récupération de la forme, rien d'autre (Keko : « le bonus
 *   de récup est déjà un bonus de dégâts, c'est assez fort »).
 */
export type CleAmelioration = 'force' | 'dexterite' | 'intelligence' | 'endurance'
export const AMELIORATIONS: readonly CleAmelioration[] = ['force', 'dexterite', 'intelligence', 'endurance']

/** Le type d'une arme : la caractéristique qui fait ses dégâts. */
export type TypeArme = 'force' | 'agilite' | 'intel'
export const ARMES: readonly TypeArme[] = ['force', 'agilite', 'intel']
export const CARAC_DE_L_ARME: Record<TypeArme, CleAmelioration> = { force: 'force', agilite: 'dexterite', intel: 'intelligence' }

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
  tap: {
    base: 10,
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
    /**
     * LA RECHARGE DU TAP, sa vitesse d'attaque (Keko : « un CD sur le bouton,
     * disons 1 s pour tester », puis 0,5 s, puis 0,25 s) : un
     * tap au plus par `recharge`.
     */
    recharge: 0.25 * SECONDE,
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
        arme: 'force',
        poids: { force: 3, dexterite: 2, intelligence: 1 },
      },
      {
        id: 'occasionnel-a',
        nom: 'Bot occasionnel A',
        passagesParJour: 2,
        taps: [20, 40],
        arme: 'agilite',
        poids: { dexterite: 3, intelligence: 1, force: 1 },
      },
      {
        id: 'occasionnel-b',
        nom: 'Bot occasionnel B',
        passagesParJour: 2,
        taps: [15, 35],
        arme: 'intel',
        poids: { intelligence: 3, dexterite: 1, force: 1 },
      },
      {
        id: 'fantome',
        nom: 'Bot fantôme',
        passagesParJour: 1 / 3,
        taps: [10, 30],
        arme: 'force',
        poids: { force: 2, dexterite: 1 },
      },
    ] as ProfilBot[],
  },

  /** Les vitesses proposées à l'écran. */
  vitesses: [1, 60, 1000],
}

export type ConfigDonjon = typeof DONJON

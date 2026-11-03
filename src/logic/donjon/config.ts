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

export type CleAmelioration = 'tap' | 'auto' | 'chanceCrit' | 'multCrit'
export const AMELIORATIONS: readonly CleAmelioration[] = ['tap', 'auto', 'chanceCrit', 'multCrit']

export type ProfilBot = {
  /** L'identifiant du joueur, stable d'une saison à l'autre. */
  id: string
  nom: string
  /** En moyenne ; l'écart entre deux passages est tiré autour (`ecartPassage`). */
  passagesParJour: number
  /** Le nombre de taps d'un passage, tiré dans [min, max]. */
  taps: [number, number]
  /** La règle de dépense : il achète la piste la plus en retard sur son poids. */
  poids: Record<CleAmelioration, number>
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
    exposant: 2.4,
  },

  /** Ce que rapporte une amélioration, et ce qu'elle coûte. */
  points: {
    parNiveau: 1,
    parKill: 1,
    /** Le rang r coûte `base + floor(r · pente)` points. */
    coutBase: 1,
    coutPente: 0.25,
  },

  /** Dégâts d'un COUP (un tap, ou un coup d'auto) au rang 0, puis par rang de « Coup ». */
  tap: {
    base: 10,
    parRang: 3,
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
   * manuel ; on commence à 5 fois le CD manuel et chaque upgrade ramène la
   * vitesse auto vers le CD manuel sans jamais l'atteindre ») :
   * `recharge × (1 + (depart − 1) · garde^rang)` — chaque rang d'« Auto-tap »
   * retire `1 − garde` de l'écart qui reste (rendement décroissant).
   */
  auto: {
    /** La période au rang 0, en recharges du tap : 500 %. */
    depart: 5,
    /** La part de l'écart à la recharge que garde chaque rang : 10 % de moins par rang. */
    garde: 0.9,
  },

  crit: {
    chanceBase: 0.05,
    chanceParRang: 0.02,
    chanceMax: 0.5,
    multBase: 2,
    multParRang: 0.25,
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
        poids: { tap: 3, auto: 3, chanceCrit: 1, multCrit: 1 },
      },
      {
        id: 'occasionnel-a',
        nom: 'Bot occasionnel A',
        passagesParJour: 2,
        taps: [20, 40],
        poids: { tap: 1, auto: 3, chanceCrit: 1, multCrit: 1 },
      },
      {
        id: 'occasionnel-b',
        nom: 'Bot occasionnel B',
        passagesParJour: 2,
        taps: [15, 35],
        poids: { tap: 2, auto: 2, chanceCrit: 1, multCrit: 1 },
      },
      {
        id: 'fantome',
        nom: 'Bot fantôme',
        passagesParJour: 1 / 3,
        taps: [10, 30],
        // Le Coup fait aussi les dégâts de l'auto : même le fantôme en achète.
        poids: { tap: 1, auto: 1, chanceCrit: 0, multCrit: 0 },
      },
    ] as ProfilBot[],
  },

  /** Les vitesses proposées à l'écran. */
  vitesses: [1, 60, 1000],
}

export type ConfigDonjon = typeof DONJON

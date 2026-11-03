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
  },

  /**
   * L'AUTO-TAP EST UN TAP QUI SE DONNE TOUT SEUL (Keko : « mettre les coups
   * auto exactement comme les autres et avec les mêmes dégâts »). Dès le
   * début, chaque joueur frappe un coup toutes les `periode` : les dégâts du
   * Coup, critique compris, sans la forme (ni fatigue ni repos). L'amélioration « Auto-tap »
   * en raccourcit l'intervalle : `periode / (1 + acceleration · rang)`, en
   * millisecondes entières, jamais sous `periodeMin`. Les coups de chacun
   * tombent sur les multiples de sa période depuis le début de la saison.
   */
  auto: {
    periode: 2 * SECONDE,
    acceleration: 0.08,
    periodeMin: 250,
  },

  crit: {
    chanceBase: 0.05,
    chanceParRang: 0.02,
    chanceMax: 0.5,
    multBase: 2,
    multParRang: 0.25,
  },

  /**
   * LA FORME : un seul curseur, de −1 (épuisé) à +1 (reposé), qui multiplie
   * les taps de 0 % à 200 % (`1 + forme`), 100 % au milieu (Keko : « un
   * continuum qui tend vers 0 % - 200 % entre fatigue max et repos max »).
   * ELLE SE GAGNE ET SE PERD AU TEMPS, PAS AUX COUPS (Keko : « que plus tard,
   * si on implante la vitesse d'attaque, elle ne déséquilibre pas le
   * système ») : un tap tient le joueur « en action » pendant `fenetre` ;
   * chaque minute en action coûte `usureParMinute`, quel que soit le nombre
   * de taps. Hors action, la forme remonte : vite jusqu'au milieu
   * (`recuperationParHeure`), lentement au-delà (`reposParHeure`).
   * L'auto n'y est pas soumis.
   */
  forme: {
    fenetre: 1.5 * SECONDE,
    /** En action : de reposé à normal en 5 min, de normal à épuisé en 5 de plus. */
    usureParMinute: 0.2,
    /** Hors action, sous le milieu : d'épuisé à normal en 30 min. */
    recuperationParHeure: 2,
    /** Hors action, au-dessus du milieu : de normal à reposé en 8 h. */
    reposParHeure: 0.125,
  },

  bots: {
    /** Écart entre deux passages : la moyenne × un facteur tiré dans [1 − e, 1 + e]. */
    ecartPassage: 0.5,
    /** Les taps d'un passage partent par paquets, à quelques secondes d'écart. */
    tapsParSalve: 10,
    ecartSalve: 4 * SECONDE,
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

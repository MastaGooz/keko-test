/**
 * Combat au tour par tour. Pur : aucun accès au DOM, aucun hasard non seedé.
 *
 * Tour du joueur : il dépense une réserve d'**énergie** pour jouer des cartes,
 * chacune sur une cible. Tout résout immédiatement. Puis il finit son tour :
 * les ennemis dont le compteur tombe à 0 frappent, la main entière est
 * défaussée, on repioche et l'énergie se recharge.
 *
 * Le compteur d'un ennemi se compte en **tours**, pas en unités de temps :
 * c'est ce qui reste du tempo après l'abandon de l'horloge partagée. Un
 * ennemi peut frapper chaque tour, ou un tour sur trois en frappant fort.
 *
 * Les transitions exportées ne modifient jamais l'état reçu : elles en font une
 * copie, mutent la copie, et la renvoient.
 */
import type { Rng } from './rng.ts'

/**
 * Ce qu'une carte fait, au-delà de frapper une cible.
 *
 * **Le moteur ne connaissait qu'un coût et des dégâts**, ce qui suffisait au
 * Glaive mais interdisait tout le reste : deux armes ne pouvaient différer que
 * par leur courbe coût/dégâts, et un trésor ne pouvait rien faire du tout. Les
 * effets sont ce qui ouvre le budget de contenu — le « verbe neuf » que la
 * deuxième arme réclamait, et le pouvoir que les trésors réclament.
 *
 * Ils s'ajoutent aux dégâts de la carte, ils ne les remplacent pas : une carte
 * d'arme reste un `degats` et rien d'autre, ce qui laisse intact tout ce qui
 * est calé dessus (l'aperçu sur les jauges, `consequence`, les simulations).
 */
export type Effet =
  /**
   * Frappe TOUS les corps debout — et une carte qui le fait **ne désigne
   * personne** : sa portée est le rang entier.
   */
  | { type: 'degatsTous'; montant: number }
  /**
   * Du **bloc**, à la Slay the Spire : il absorbe les dégâts de la salve de fin
   * de tour, puis **il tombe**. Ce n'est pas de la vie en réserve — c'est une
   * décision qui ne vaut que pour ce tour-ci, et qu'il faut reprendre au
   * suivant. *Sans la remise à zéro, bloquer deviendrait épargner.*
   */
  | { type: 'bloc'; montant: number }
  /**
   * LA RIPOSTE : ce que prend un ennemi CHAQUE FOIS qu'il frappe, ce tour-ci.
   *
   * Composée par Keko : « durant 1 tour, inflige 4 à chaque fois qu'un ennemi
   * vous attaque ». *C'est le premier effet qui fasse du tour ADVERSE un
   * moment où l'on agit* — jusqu'ici la salve était subie, et le seul choix
   * qu'on avait sur elle était de bloquer.
   *
   * Elle tombe à la fin du tour comme le bloc : *une riposte qui durerait
   * serait une arme passive, pas une décision.* Et elle paie d'autant mieux
   * qu'il y a de corps en face, ce qui en fait l'exact inverse d'une garde.
   */
  | { type: 'riposte'; montant: number }
  /**
   * **L'ESQUIVE : une chance sur deux d'éviter la PROCHAINE attaque subie.**
   * Composée par Keko avec le Plastron de cuir.
   *
   * *C'est le premier effet du jeu qui tire au sort*, et il faut le dire :
   * tout le reste est déterministe une fois la seed posée. Il passe donc par
   * le RNG seedé comme le mélange du deck — **une partie rejouée à la même
   * seed doit rendre les mêmes esquives.**
   *
   * Elle se consomme à la première attaque, réussie ou non — *c'est LA
   * prochaine attaque, pas une protection qui dure* — et elle tombe à la fin
   * du tour comme le bloc et la riposte.
   */
  | { type: 'esquive' }
  /**
   * L'ÉTOURDISSEMENT : la cible perd l'action qu'elle préparait.
   *
   * Composé par Keko : « étourdissement = annule l'action en cours de
   * l'ennemi ». Son compteur repart de sa période entière, donc *on ne lui
   * vole pas un tour, on lui vole sa mise* — ce qu'elle avait déjà attendu.
   * Il vaut d'autant plus que la bête est lente, et c'est ce qui en fait une
   * réponse aux gros frappeurs plutôt qu'aux petits.
   */
  | { type: 'etourdit' }
  /** Rend des PV au joueur, sans dépasser son maximum. */
  | { type: 'soin'; montant: number }
  /** Recharge de l'énergie tout de suite, dans la limite du maximum. */
  | { type: 'energie'; montant: number }

export type Carte = {
  /** Identifiant d'exemplaire, unique dans le deck. */
  id: string
  nom: string
  /**
   * LA RARETÉ DE CE QUI L'A PRODUITE — et c'est le CADRE qui la porte.
   *
   * Demandé par Keko : « on peut faire en sorte que les cartes d'un équipement
   * ou objet soient de la même rareté que la carte qui les génère ? »
   *
   * *Et ça dit une chose vraie du concept* : « une arme = un set de cartes, la
   * rareté fait la force du set ». Une carte d'arme rare EST plus forte qu'une
   * carte d'arme commune — son métal n'annonce donc pas une provenance, il
   * annonce une PUISSANCE, et c'est exactement ce qu'une échelle doit dire.
   *
   * **Aucune règle ne la lit** : c'est une étiquette, elle traverse `logic/`
   * sans rien y décider. D'où le type large, qui évite de faire dépendre le
   * combat du catalogue d'équipement.
   */
  rarete?: string
  /**
   * LA FAMILLE DE CE QUI L'A PRODUITE — et c'est le CIEL de la carte qui la
   * porte : rouge pour une arme, vert pour un objet, bleu pour une armure.
   *
   * Keko, en voyant les cartes d'une arme rester bleues : « quand je zoom la
   * couleur rouge disparaît ». *Une carte de deck hérite déjà du métal de sa
   * pièce ; elle hérite aussi de son décor* — sinon le set d'une arme se lit
   * comme un corps étranger à l'arme qui le produit.
   *
   * **Aucune règle ne la lit**, comme `rarete` : c'est une étiquette qui
   * traverse `logic/` sans rien y décider. Un trésor n'en a pas besoin — son
   * `type` le dit déjà.
   */
  famille?: 'arme' | 'armure' | 'objet'
  /**
   * LA MATIÈRE DE LA PIÈCE QUI L'A PRODUITE — et c'est son DESSIN qui la porte.
   *
   * Keko a dessiné quatre Protection, une par matière d'armure : tissu, cuir,
   * maille, plate. *Quatre armures donnent la même carte, et elle n'est pas
   * dessinée quatre fois pour rien* — c'est le même objet dans quatre
   * matériaux, comme les trois tiers de la potion le sont dans trois richesses.
   *
   * **La variante n'est donc plus la rareté, c'est la PIÈCE** : une Protection
   * de Robe sort en tissu et une Protection de Cotte de maille en maille, à
   * rareté et à chiffres identiques. La table vit dans `ui/art.ts`, et un
   * modèle qui n'y est pas garde son dessin unique.
   *
   * **Aucune règle ne la lit**, comme `rarete` et `famille` : c'est une
   * étiquette qui traverse `logic/` sans rien y décider.
   */
  matiere?: string
  /**
   * Un trésor ne se joue que s'il porte des `effets` — et le jouer le DÉTRUIT.
   * C'est tout le pari du butin : il vaut de l'or s'il ressort, et il peut
   * sauver la run s'il est brûlé, jamais les deux.
   */
  type: 'combat' | 'tresor'
  /** Énergie consommée. */
  cout: number
  /**
   * CE QUE CHAQUE ATTAQUE DÉJÀ JOUÉE CE TOUR RETIRE À SON COÛT.
   *
   * L'Estoc du Glaive coûte 3 PA et en rend 1 par attaque portée avant lui :
   * seul il est cher, après deux Tailles il est donné. *C'est le premier effet
   * du jeu qui fasse de l'ORDRE une décision* — jusqu'ici le tour était un
   * sac, on dépensait sa réserve sans que la suite compte.
   *
   * **Le coût ne se lit donc plus sur la carte seule** : tout ce qui le
   * demande passe par `coutDe`, jamais par `carte.cout`.
   */
  remiseParAttaque?: number
  degats: number
  /**
   * SES DÉGÂTS SONT CEUX DE TA DÉFENSE — le bloc courant, pas un chiffre écrit
   * sur la carte.
   *
   * Le Coup de bouclier de la Rondache, composé par Keko : « le coup de
   * bouclier inflige des dégâts égaux à la défense ». *C'est le premier verbe
   * qui fasse du BLOC une ressource offensive* — jusqu'ici bloquer était la
   * seule chose qu'on faisait de son armure, et une garde posée n'avait plus
   * rien à dire au tour suivant.
   *
   * Comme la remise, **ça n'est plus une propriété de la carte mais du
   * MOMENT** : tout ce qui demande ses dégâts passe par `degatsDe`.
   */
  degatsDuBloc?: boolean
  /** Ce que la carte fait en plus de ses dégâts. */
  effets?: Effet[]
  /**
   * La carte est DÉTRUITE à l'usage, au lieu de partir à la défausse : elle ne
   * reviendra pas dans la pioche, et elle ne compte plus dans le butin.
   */
  exil?: boolean
  /**
   * LES UTILISATIONS QUI RESTENT. Une carte à usages revient à la défausse
   * avec une utilisation de moins, et elle est exilée quand elle en est à sa
   * dernière : c'est le consommable -- UNE carte dans le deck, qui se vide
   * gorgée par gorgée, au lieu de trois cartes qui polluaient la main.
   */
  usages?: number
  /** Ce qu'elle en avait au départ : le rendu montre les pastilles vides. */
  usagesMax?: number
  /**
   * Prix qu'en donnerait le marché noir, une fois la run terminée. Un trésor
   * ne rapporte RIEN en combat ni en fin de combat : il ne devient de l'or
   * qu'au hub, s'il en ressort. Le moteur ne fait que le transporter.
   */
  valeur?: number
}

export type Ennemi = {
  nom: string
  pv: number
  pvMax: number
  degats: number
  /** Nombre de tours entre deux frappes. 1 = il frappe chaque tour. */
  periode: number
  /** Il frappe à la fin du tour où ce compteur atteint 0. */
  compteur: number
}

export type Issue = 'victoire' | 'defaite'

/** Ce qui s'est passé, dans l'ordre. Sert au récit. */
export type Evenement =
  | { tour: number; type: 'debut'; ennemis: string[] }
  | { tour: number; type: 'carte'; nom: string; cible: string; degats: number; pvCible: number }
  | { tour: number; type: 'mort'; nom: string }
  | { tour: number; type: 'frappe'; nom: string; degats: number; pvJoueur: number }
  | { tour: number; type: 'pioche'; cartes: number; tresors: number }
  | { tour: number; type: 'issue'; issue: Issue }

export type EtatCombat = {
  pv: number
  pvMax: number
  /** Les morts restent dans le tableau (pv à 0) : les index de cible ne bougent pas. */
  ennemis: Ennemi[]
  pioche: Carte[]
  main: Carte[]
  defausse: Carte[]
  energie: number
  energieMax: number
  /** Ce qui absorbera la prochaine salve. Retombe à zéro une fois qu'elle est passée. */
  bloc: number
  tailleMain: number
  tour: number
  /**
   * COMBIEN D'ATTAQUES ON A DÉJÀ PORTÉES CE TOUR — la réserve dans laquelle
   * puise `remiseParAttaque`. Elle retombe à zéro à la fin du tour, comme le
   * bloc : *une remise qui s'accumulerait d'un tour à l'autre serait une
   * épargne, pas un enchaînement.*
   */
  attaquesCeTour: number
  /**
   * CE QUE PREND UN ENNEMI QUI FRAPPE, ce tour-ci. Retombe à zéro avec le
   * bloc : *ce qui ne vaut que pour un tour se range au même endroit.*
   */
  riposte: number
  /** Une esquive est armée : la prochaine attaque a une chance sur deux de
   *  manquer. Elle se consomme à l'essai, et tombe en fin de tour. */
  esquive: boolean
  evenements: Evenement[]
  issue: Issue | null
}

export type ConfigCombat = {
  pvMax: number
  tailleMain: number
  energieMax: number
}

export const CONFIG_DEFAUT: ConfigCombat = {
  pvMax: 30,
  tailleMain: 5,
  energieMax: 5,
}

export function creerCombat(
  deck: Carte[],
  ennemis: Ennemi[],
  rng: Rng,
  config: ConfigCombat = CONFIG_DEFAUT,
): EtatCombat {
  const etat: EtatCombat = {
    pv: config.pvMax,
    pvMax: config.pvMax,
    ennemis: ennemis.map((ennemi) => ({ ...ennemi })),
    pioche: melanger(deck, rng),
    main: [],
    defausse: [],
    energie: config.energieMax,
    energieMax: config.energieMax,
    bloc: 0,
    tailleMain: config.tailleMain,
    tour: 1,
    attaquesCeTour: 0,
    riposte: 0,
    esquive: false,
    evenements: [{ tour: 1, type: 'debut', ennemis: ennemis.map((e) => e.nom) }],
    issue: null,
  }

  piocher(etat, rng)
  return etat
}

/**
 * Joue la carte de la main à `index` sur l'ennemi `cible`. Elle résout tout de
 * suite et consomme son coût en énergie.
 * Renvoie l'état inchangé si le coup est impossible (combat fini, trésor,
 * énergie insuffisante, cible déjà morte...).
 */
export function jouerCarte(etat: EtatCombat, index: number, cible: number): EtatCombat {
  if (etat.issue !== null) return etat

  const carte = etat.main[index]
  if (carte === undefined || !jouable(carte)) return etat
  const cout = coutDe(carte, etat)
  if (cout > etat.energie) return etat
  // Une carte qui ne vise personne se joue sans cible valide : un trésor qui
  // soigne reste jouable quand le dernier corps vient de tomber.
  if (viseUneCible(carte) && !estVivant(etat, cible)) return etat

  const suivant = copier(etat)
  suivant.main.splice(index, 1)
  suivant.energie -= cout
  // ET ELLE COMPTE POUR LA SUIVANTE : c'est ce qui fait de l'ordre des coups
  // une décision. On compte ce qui FRAPPE, cible unique ou rang entier — une
  // garde n'escompte rien, elle n'attaque pas.
  if (frappe(carte)) suivant.attaquesCeTour += 1
  resoudreCarte(suivant, carte, cible)
  return suivant
}

/**
 * Déplace une carte dans la main. Le joueur range sa main comme il veut.
 *
 * Ça n'a **aucun effet sur les règles** — la main est un ensemble, pas une
 * file — mais ça doit quand même passer par l'état : le rendu se reconstruit à
 * chaque action, donc un ordre vivant dans le DOM serait balayé au premier
 * coup joué.
 *
 * Renvoie l'état inchangé si les index ne veulent rien dire, comme toutes les
 * transitions d'ici.
 */
export function reordonnerMain(etat: EtatCombat, de: number, vers: number): EtatCombat {
  if (etat.issue !== null) return etat
  if (de === vers) return etat
  if (de < 0 || de >= etat.main.length) return etat
  if (vers < 0 || vers >= etat.main.length) return etat

  const suivant = copier(etat)
  const [carte] = suivant.main.splice(de, 1)
  if (carte === undefined) return etat
  suivant.main.splice(vers, 0, carte)
  return suivant
}

/**
 * Finit le tour : les ennemis à compteur échu frappent, la main entière part à
 * la défausse, on repioche et l'énergie se recharge.
 */
export function finDuTour(etat: EtatCombat, rng: Rng): EtatCombat {
  if (etat.issue !== null) return etat

  const suivant = copier(etat)

  for (const ennemi of suivant.ennemis) {
    if (ennemi.pv === 0) continue
    ennemi.compteur -= 1
    if (ennemi.compteur > 0) continue
    frapper(suivant, ennemi, rng)
    if (suivant.issue !== null) return suivant
  }

  // LE BLOC TOMBE une fois la salve passée : il ne protège que le tour où on
  // l'a posé. Sans ça, bloquer deviendrait épargner, et la décision du tour
  // deviendrait un investissement.
  suivant.bloc = 0
  // ET LA REMISE AVEC LUI : elle ne vaut que pour l'enchaînement d'un tour.
  suivant.attaquesCeTour = 0
  suivant.riposte = 0
  suivant.esquive = false
  suivant.tour += 1
  suivant.energie = suivant.energieMax
  piocher(suivant, rng)
  return suivant
}

/** Dégâts encaissés à la fin de ce tour si rien ne change. */
export function menaceDuTour(etat: EtatCombat): number {
  const brute = etat.ennemis
    .filter((ennemi) => ennemi.pv > 0 && ennemi.compteur <= 1)
    .reduce((total, ennemi) => total + ennemi.degats, 0)
  // CE QU'ON VA VRAIMENT PRENDRE, bloc déduit. C'est ce chiffre qui rend le
  // bloc lisible : poser une carte de garde doit faire baisser la menace sous
  // les yeux du joueur, sinon il ne sait pas ce qu'elle lui a acheté.
  return Math.max(0, brute - etat.bloc)
}

/**
 * Ce que ferait la carte sur `cible`, sans la jouer. Sans horloge partagée, la
 * question tient en trois faits : est-ce que ça l'achève, est-ce que ça gagne,
 * et combien j'encaisse encore à la fin du tour.
 */
export type Consequence = {
  /** Énergie consommée. */
  cout: number
  /** Le joueur a de quoi la jouer. */
  abordable: boolean
  /** La carte achève la cible. */
  tue: boolean
  /** La carte achève le dernier ennemi debout : le combat s'arrête. */
  gagne: boolean
  /** Dégâts encaissés en fin de tour APRÈS ce coup. */
  menaceApres: number
  /** Dégâts évités par rapport à maintenant, parce que la cible ne frappera plus. */
  evite: number
}

export function consequence(etat: EtatCombat, carte: Carte, cible: number): Consequence {
  const vise = etat.ennemis[cible]
  const tue = vise !== undefined && vise.pv > 0 && degatsDe(carte, etat) >= vise.pv
  const debout = etat.ennemis.filter((ennemi) => ennemi.pv > 0).length

  const menace = menaceDuTour(etat)
  const evite = tue && vise !== undefined && vise.compteur <= 1 ? vise.degats : 0

  return {
    cout: coutDe(carte, etat),
    abordable: coutDe(carte, etat) <= etat.energie,
    tue,
    gagne: tue && debout === 1,
    menaceApres: tue && debout === 1 ? 0 : menace - evite,
    evite,
  }
}

/** Les ennemis encore debout, avec leur index de cible. */
export function vivants(etat: EtatCombat): { ennemi: Ennemi; index: number }[] {
  return etat.ennemis
    .map((ennemi, index) => ({ ennemi, index }))
    .filter((x) => x.ennemi.pv > 0)
}

/**
 * Une carte se joue si elle fait quelque chose : frapper, ou porter un effet.
 * Un trésor sans effet reste ce qu'il a toujours été — du poids.
 */
export function jouable(carte: Carte): boolean {
  return carte.type === 'combat' || (carte.effets?.length ?? 0) > 0
}

/**
 * LA PORTÉE D'UNE CARTE, ET IL N'Y EN A QUE TROIS.
 *
 * Tranché par Keko : « soit une carte n'a pas de cible, soit elle a une cible,
 * soit elle cible tous les ennemis. Pas de carte où on cible soi-même X
 * ennemis. »
 *
 * - `aucune` — elle agit sur le joueur ou sur le tour : bloc, soin, énergie.
 *   **Demander une cible pour ça serait un geste vide** : un choix qui n'en
 *   est pas un.
 * - `une` — un corps à désigner, et c'est la flèche qui le fait.
 * - `toutes` — le rang entier, donc rien à désigner non plus.
 *
 * *Ce que ça ferme* : une carte qui frapperait une cible **et** tout le rang,
 * ou qui demanderait de choisir trois corps sur cinq. Le modèle le permettait,
 * et chaque cas de ce genre aurait demandé son propre geste. À trois portées,
 * **le geste se déduit de la carte** — il n'y a rien à décider au cas par cas.
 */
export type Portee = 'aucune' | 'une' | 'toutes'

export function portee(carte: Carte): Portee {
  if (carte.effets?.some((effet) => effet.type === 'degatsTous') ?? false) return 'toutes'
  // Un Coup de bouclier désigne un corps même quand il vaut zéro : *la portée
  // est une propriété du verbe, pas du chiffre du moment.* Sans ça, il
  // deviendrait une carte sans cible dès qu'on n'a plus d'armure.
  if (carte.degatsDuBloc === true) return 'une'
  return carte.degats > 0 ? 'une' : 'aucune'
}

/** La carte a-t-elle besoin qu'on lui désigne un corps ? */
export function viseUneCible(carte: Carte): boolean {
  return portee(carte) === 'une'
}

function estVivant(etat: EtatCombat, index: number): boolean {
  const ennemi = etat.ennemis[index]
  return ennemi !== undefined && ennemi.pv > 0
}

/** Ce que vaudrait tout le butin transporté, s'il ressortait du donjon. */
export function butin(etat: EtatCombat): number {
  return [...etat.pioche, ...etat.main, ...etat.defausse].reduce(
    (total, carte) => total + (carte.valeur ?? 0),
    0,
  )
}

/**
 * CE QUE COÛTE CETTE CARTE MAINTENANT — et c'est la seule réponse qui vaille.
 *
 * Une carte à remise coûte moins cher à mesure que le tour avance, donc *son
 * coût n'est plus une propriété de la carte, c'est une propriété du MOMENT.*
 * Tout ce qui le demande passe par ici : la règle qui le prélève, l'aperçu qui
 * l'annonce, la main qui grise ce qu'on ne peut pas payer, et l'orbe peinte
 * sur la carte.
 *
 * **Le plancher est zéro** : une attaque gratuite est le bout de l'échelle,
 * pas une erreur à corriger.
 */
export function coutDe(carte: Carte, etat: EtatCombat): number {
  const remise = (carte.remiseParAttaque ?? 0) * etat.attaquesCeTour
  return Math.max(0, carte.cout - remise)
}

/**
 * CE QUE CETTE CARTE INFLIGE MAINTENANT.
 *
 * Un Coup de bouclier vaut la défense qu'on a sous la main : *ses dégâts sont
 * une propriété du MOMENT*, comme le coût d'une carte à remise. Tout ce qui
 * les demande passe par ici — la règle qui frappe, l'aperçu qui l'annonce, le
 * chiffre qui saute au-dessus du corps touché.
 */
export function degatsDe(carte: Carte, etat: EtatCombat): number {
  return carte.degatsDuBloc === true ? etat.bloc : carte.degats
}

/** Vrai si la carte porte un coup, à une cible ou à tout le rang. */
export function frappe(carte: Carte): boolean {
  if (carte.degats > 0) return true
  // ELLE FRAPPE MÊME À ZÉRO DE DÉFENSE : ce qui fait d'une carte une attaque,
  // c'est son VERBE, pas ce qu'elle vaut à cet instant. Sans ça, un Coup de
  // bouclier joué sans armure cesserait d'escompter l'Estoc.
  if (carte.degatsDuBloc === true) return true
  return carte.effets?.some((effet) => effet.type === 'degatsTous') ?? false
}

/** Nombre de trésors qui encombrent la main. */
export function tresorsEnMain(etat: EtatCombat): number {
  return etat.main.filter((carte) => carte.type === 'tresor').length
}

/** Vrai si plus aucune carte de la main n'est jouable avec l'énergie restante. */
export function mainMorte(etat: EtatCombat): boolean {
  return etat.main.every((carte) => !jouable(carte) || coutDe(carte, etat) > etat.energie)
}

// --- interne : tout ce qui suit mute l'état reçu, déjà copié par l'appelant ---

function resoudreCarte(etat: EtatCombat, carte: Carte, cible: number): void {
  // EXILÉE PLUTÔT QUE DÉFAUSSÉE : elle ne reviendra pas dans la pioche, et
  // `butin()` ne la compte plus — brûler un trésor, c'est perdre son or.
  // Une carte à usages en perd un ; à zéro, elle est exilée comme un trésor.
  const restante = carte.usages === undefined ? carte : { ...carte, usages: carte.usages - 1 }
  if (carte.exil !== true && restante.usages !== 0) etat.defausse.push(restante)

  // CE QU'ELLE INFLIGE SE LIT AVANT SES EFFETS. Une carte qui frapperait du
  // bloc ET en donnerait s'amplifierait elle-même, et le joueur ne saurait
  // plus si le chiffre annoncé compte le bloc qu'elle vient d'ajouter : *on
  // frappe avec la défense qu'on AVAIT en jouant la carte.*
  const degats = degatsDe(carte, etat)

  for (const effet of carte.effets ?? []) appliquerEffet(etat, effet, cible)

  const ennemi = etat.ennemis[cible]
  if (ennemi === undefined || ennemi.pv === 0) return

  ennemi.pv = Math.max(0, ennemi.pv - degats)
  etat.evenements.push({
    tour: etat.tour,
    type: 'carte',
    nom: carte.nom,
    cible: ennemi.nom,
    degats,
    pvCible: ennemi.pv,
  })

  if (ennemi.pv === 0) {
    etat.evenements.push({ tour: etat.tour, type: 'mort', nom: ennemi.nom })
    if (etat.ennemis.every((autre) => autre.pv === 0)) terminer(etat, 'victoire')
  }
}

function appliquerEffet(etat: EtatCombat, effet: Effet, cible: number): void {
  switch (effet.type) {
    case 'soin':
      etat.pv = Math.min(etat.pvMax, etat.pv + effet.montant)
      break
    case 'energie':
      etat.energie = Math.min(etat.energieMax, etat.energie + effet.montant)
      break
    case 'bloc':
      etat.bloc += effet.montant
      break
    case 'esquive':
      etat.esquive = true
      break
    case 'riposte':
      etat.riposte += effet.montant
      break
    case 'etourdit': {
      // ON LUI REND SA PÉRIODE ENTIÈRE : *on ne lui vole pas un tour, on lui
      // vole sa mise.* Un corps déjà tombé ne prépare plus rien.
      const vise = etat.ennemis[cible]
      if (vise !== undefined && vise.pv > 0) vise.compteur = vise.periode
      break
    }
    case 'degatsTous':
      for (const ennemi of etat.ennemis) {
        if (ennemi.pv === 0) continue
        ennemi.pv = Math.max(0, ennemi.pv - effet.montant)
        etat.evenements.push({
          tour: etat.tour,
          type: 'carte',
          nom: 'onde',
          cible: ennemi.nom,
          degats: effet.montant,
          pvCible: ennemi.pv,
        })
        if (ennemi.pv === 0) etat.evenements.push({ tour: etat.tour, type: 'mort', nom: ennemi.nom })
      }
      if (etat.ennemis.every((autre) => autre.pv === 0)) terminer(etat, 'victoire')
      break
  }
}

function frapper(etat: EtatCombat, ennemi: Ennemi, rng: Rng): void {
  /**
   * **L'ESQUIVE SE JOUE AVANT LE BLOC, et elle se consomme dans tous les
   * cas.** *C'est LA prochaine attaque qu'on esquive*, pas une protection qui
   * attendrait de réussir : la garder après un échec en ferait une assurance
   * illimitée, et le joueur ne saurait plus ce qu'il a acheté.
   *
   * Le tirage passe par le RNG seedé, comme le mélange du deck — **une partie
   * rejouée à la même seed doit rendre les mêmes esquives.**
   */
  if (etat.esquive) {
    etat.esquive = false
    if (rng.next() < 0.5) {
      ennemi.compteur = ennemi.periode
      etat.evenements.push({
        tour: etat.tour,
        type: 'frappe',
        nom: ennemi.nom,
        degats: 0,
        pvJoueur: etat.pv,
      })
      return
    }
  }

  // LE BLOC ENCAISSE EN PREMIER, et ce qui dépasse seulement passe aux PV.
  const absorbe = Math.min(etat.bloc, ennemi.degats)
  etat.bloc -= absorbe
  etat.pv = Math.max(0, etat.pv - (ennemi.degats - absorbe))
  ennemi.compteur = ennemi.periode
  etat.evenements.push({
    tour: etat.tour,
    type: 'frappe',
    nom: ennemi.nom,
    // Ce que le joueur ENCAISSE VRAIMENT : le récit et les marques visuelles
    // doivent dire ce qui lui est arrivé, pas ce qui lui était destiné.
    degats: ennemi.degats - absorbe,
    pvJoueur: etat.pv,
  })

  if (etat.pv === 0) {
    terminer(etat, 'defaite')
    return
  }

  // LA RIPOSTE PART APRÈS LE COUP, jamais avant : *elle répond, elle ne
  // prévient pas.* Un joueur qui tombe ne riposte plus — il est déjà parti
  // quand le coup arrive.
  if (etat.riposte > 0) {
    ennemi.pv = Math.max(0, ennemi.pv - etat.riposte)
    etat.evenements.push({
      tour: etat.tour,
      type: 'carte',
      nom: 'riposte',
      cible: ennemi.nom,
      degats: etat.riposte,
      pvCible: ennemi.pv,
    })
    if (ennemi.pv === 0) {
      etat.evenements.push({ tour: etat.tour, type: 'mort', nom: ennemi.nom })
      if (etat.ennemis.every((autre) => autre.pv === 0)) terminer(etat, 'victoire')
    }
  }
}

function terminer(etat: EtatCombat, issue: Issue): void {
  etat.issue = issue
  etat.evenements.push({ tour: etat.tour, type: 'issue', issue })
}

/** Défausse toute la main puis complète à `tailleMain`, en remélangeant au besoin. */
function piocher(etat: EtatCombat, rng: Rng): void {
  etat.defausse.push(...etat.main)
  etat.main = []

  while (etat.main.length < etat.tailleMain) {
    if (etat.pioche.length === 0) {
      if (etat.defausse.length === 0) break
      etat.pioche = melanger(etat.defausse, rng)
      etat.defausse = []
    }
    etat.main.push(etat.pioche.pop()!)
  }

  etat.evenements.push({
    tour: etat.tour,
    type: 'pioche',
    cartes: etat.main.length,
    tresors: etat.main.filter((carte) => carte.type === 'tresor').length,
  })
}

/** Fisher-Yates seedé. Renvoie un nouveau tableau. */
function melanger(cartes: Carte[], rng: Rng): Carte[] {
  const melange = [...cartes]
  for (let i = melange.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng.next() * (i + 1))
    ;[melange[i], melange[j]] = [melange[j]!, melange[i]!]
  }
  return melange
}

/** Copie défensive : l'état reçu par les transitions n'est jamais modifié. */
function copier(etat: EtatCombat): EtatCombat {
  return {
    ...etat,
    ennemis: etat.ennemis.map((ennemi) => ({ ...ennemi })),
    pioche: [...etat.pioche],
    main: [...etat.main],
    defausse: [...etat.defausse],
    evenements: [...etat.evenements],
  }
}

/**
 * Les armes, et le deck qu'elles donnent.
 *
 * Règle centrale du jeu : **c'est l'équipement qui fait le deck**. Le
 * personnage est générique, une arme apporte son set de cartes, et la rareté
 * fait la force du set.
 *
 * Et une conséquence qu'il ne faut pas perdre de vue en ajoutant de
 * l'équipement : **équiper plus n'est pas mieux**. Chaque carte ajoutée fait
 * tirer les bonnes moins souvent. La taille du deck est une ressource.
 *
 * **Le moteur sait désormais faire autre chose que des dégâts** : une carte
 * peut porter des EFFETS. C'est ce qui permet à l'armure d'exister — elle ne
 * frappe pas, elle donne du bloc — et c'est là qu'est le budget de contenu.
 */
import type { Carte } from './combat.ts'

/**
 * L'ÉCHELLE DE RARETÉ, en QUATRE crans : bronze, argent, or, diamant.
 *
 * Elle a d'abord eu cinq barreaux, laiton compris ; Keko l'a raccourcie —
 * « ça ajoute une rareté pour rien et c'est pas très lisible en comparaison à
 * l'or ». *Deux jaunes rompus voisins ne font pas deux crans.* Le jeu n'en
 * emploie que deux pour l'instant (commune et rare) ; les autres existent pour
 * que le contenu à venir n'ait pas à rouvrir le modèle, et parce qu'une échelle
 * se dessine entière ou pas du tout.
 *
 * **Elle ne dit pas d'où vient une carte, elle dit ce qu'elle VAUT.** Les
 * trésors y sont entrés par leur valeur, et les cartes de deck héritent du
 * métal de la pièce qui les produit — *la rareté fait la force du set*, donc
 * une carte d'arme rare est vraiment plus forte.
 */
export type Rarete = 'commune' | 'rare' | 'epique' | 'legendaire'

/** Un modèle de carte : tout sauf l'identifiant d'exemplaire. */
export type Modele = Omit<Carte, 'id'>

/**
 * Une pièce d'équipement : elle a un nom, une rareté, et surtout **un set**.
 *
 * Armes et armures partagent la même forme, parce qu'elles jouent le même rôle
 * — apporter des cartes. Ce qui les sépare est ce qu'elles apportent, pas leur
 * structure : une arme frappe, une armure encaisse.
 */
export type Piece = {
  id: string
  nom: string
  rarete: Rarete
  /** Son set : le deck qu'elle apporte, modèle par modèle. */
  set: { modele: Modele; nombre: number }[]
  /**
   * EST-ELLE PRÊTÉE ? Le drapeau du « prêt de l'armurier ».
   *
   * Tranché par Keko : *l'équipement gratuit n'est plus un départ à part, c'est
   * une OPTION de l'armurerie* — une case qu'on coche, qui verrouille une arme
   * et une armure qu'on ne possède pas encore. **Elle ne s'acquiert qu'en la
   * RAMENANT d'une run** : le drapeau tombe à l'extraction, et la pièce entre
   * alors dans ce qu'on possède.
   *
   * *Le mot dit la règle*, comme « enchantement » plutôt que « maîtrise » : on
   * te la prête, tu la gagnes en la rapportant. Un drapeau sur la PIÈCE plutôt
   * qu'une liste à côté, parce qu'il voyage avec elle — en run, à la mort, au
   * retour — et qu'*une marque posée ailleurs se désaccorde de ce qu'elle
   * marque.*
   */
  pret?: boolean
  /**
   * CE QU'ELLE AJOUTE AUX POINTS DE VIE, pour toute la descente.
   *
   * Demandé par Keko sur le Plastron de cuir : « +15 PV, avec le symbole de
   * coeur à la place de PV ». *C'est le premier effet d'équipement qui ne
   * passe PAS par une carte* — l'exception que le bijou devait ouvrir, et
   * elle arrive par l'armure.
   *
   * **Elle monte le MAXIMUM, donc on part avec.** Un bonus qui ne donnerait
   * que des PV courants se perdrait au premier soin ; un maximum relevé est ce
   * qu'on emporte.
   */
  pv?: number
}

export type Arme = Piece & {
  /** Nombre de mains occupées. Une arme à deux mains prend les deux slots. */
  mains: 1 | 2
  /**
   * LA MAIN QU'ELLE OCCUPE — et c'est une CONTRAINTE, pas une étiquette.
   *
   * Tranché par Keko : « le premier slot ne peut contenir que des armes main
   * droite, le second que des armes main gauche ; on va aussi mettre des armes
   * "une main" qui peuvent aller dans les deux ».
   *
   * **L'absence est le troisième cas, et c'est celui qui porte le plus de
   * sens** : une arme sans main déclarée va PARTOUT. *Un champ à deux valeurs
   * plus l'absence dit trois choses sans inventer de vocabulaire* — et le
   * Glaive, l'arme de référence, est justement de ce troisième genre.
   *
   * Une arme à deux mains n'en a pas non plus : elle prend les deux slots, la
   * question ne se pose pas.
   */
  main?: 'droite' | 'gauche'
}

export type Armure = Piece

/**
 * UN CONSOMMABLE EST UNE CARTE DE DECK, PAS UNE PIÈCE.
 *
 * C'est la différence de nature que Keko a tranchée : « les armes et armures
 * sont des intermédiaires qui génèrent les cartes de deck », le consommable
 * non — il *est* la carte, et c'est le seul type de carte de deck qui
 * apparaisse au râtelier. D'où l'absence de `set` : il n'a rien à générer.
 *
 * Conséquence directe, et elle simplifie : **l'objet et la carte n'ont plus
 * deux noms.** On avait séparé « Potion de soin » (ce qu'on emporte) de
 * « Boire une gorgée » (ce qu'on fait) parce qu'un intermédiaire les
 * distinguait. Sans intermédiaire, il n'y a qu'une chose, et elle s'appelle
 * Potion.
 *
 * L'`id` est celui de L'EXEMPLAIRE, pas du modèle : on en possède plusieurs,
 * il faut pouvoir en déplacer un précis — et c'est aussi lui qui porte la
 * carte dans le deck, ce qui permet de savoir à l'extraction laquelle a été
 * bue.
 */
export type Consommable = {
  id: string
  rarete: Rarete
  /** La carte qu'il met dans le deck : la sienne, et une seule. */
  modele: Modele
}

/** Ce qui peut vivre au râtelier : une pièce, ou un consommable. */
export type Objet = Piece | Consommable

export function estConsommable(objet: Objet): objet is Consommable {
  return 'modele' in objet
}

/** Le nom d'un objet, quelle que soit sa nature. */
export function nomObjet(objet: Objet): string {
  return estConsommable(objet) ? objet.modele.nom : objet.nom
}

/** La carte qu'un consommable met dans le deck. Elle porte SON identifiant. */
export function carteDuConsommable(consommable: Consommable): Carte {
  // Un consommable EST sa carte : sa rareté est donc celle de la carte, sans
  // intermédiaire. Une Super potion est rare, sa carte l'est aussi.
  // ET SON CIEL EST CELUI D'UN OBJET : vert. Même porte que la rareté.
  return {
    ...consommable.modele,
    id: consommable.id,
    rarete: consommable.rarete,
    famille: 'objet' as const,
  }
}

/**
 * LA TAILLE : le coup de base du Glaive, et la monnaie de l'Estoc.
 *
 * 6 dégâts pour 1 PA — composé par Keko. *C'est la carte qu'on joue sans y
 * penser*, et c'est précisément ce qui donne son prix à celle qui compte les
 * attaques derrière elle.
 */
const TAILLE: Modele = { nom: 'Taille', type: 'combat', cout: 1, degats: 6 }

/**
 * L'ESTOC : cher seul, donné après deux Tailles.
 *
 * 10 dégâts pour 3 PA, **moins 1 PA par attaque déjà portée ce tour** — composé
 * par Keko. *C'est le premier effet du jeu qui fasse de l'ORDRE une décision* :
 * jusqu'ici un tour était un sac, on y dépensait sa réserve sans que la suite
 * compte. Ici, ouvrir par les petits coups change ce que le gros coûte.
 *
 * **Les chiffres sont de Keko et ne sont pas calibrés** : le set du Glaive est
 * la référence à laquelle toutes les armes se comparent, et *le réglage d'un
 * combat est un rasoir* — à repasser au balayage avant d'en faire un acquis.
 */
const ESTOC: Modele = {
  nom: 'Estoc',
  type: 'combat',
  cout: 3,
  degats: 10,
  remiseParAttaque: 1,
}

/**
 * LA RIPOSTE : un piège posé sur le tour adverse.
 *
 * Composée par Keko : « durant 1 tour, inflige 4 à chaque fois qu'un ennemi
 * vous attaque ». *Elle paie d'autant mieux qu'il y a de corps en face* — exact
 * inverse d'une garde, qui vaut d'autant moins qu'on est entouré.
 *
 * **Son coût est à trancher** : 2 PA est un placeholder, posé pour qu'elle soit
 * jouable à côté d'une Taille dans le même tour.
 */
const RIPOSTE: Modele = {
  nom: 'Riposte',
  type: 'combat',
  cout: 2,
  degats: 0,
  effets: [{ type: 'riposte', montant: 4 }],
}

const TAILLADE: Modele = { nom: 'Taillade', type: 'combat', cout: 2, degats: 6 }
const MOULINET: Modele = { nom: 'Moulinet', type: 'combat', cout: 4, degats: 14 }

/**
 * Le Glaive : l'arme commune, gratuite, toujours disponible. C'est le
 * garde-fou contre la spirale de la mort — on ne peut jamais se retrouver
 * sans rien à emporter.
 *
 * Elle est délibérément **compétente et sans relief** : c'est la référence à
 * laquelle toutes les autres se compareront. Une arme de départ excitante
 * rendrait les suivantes fades.
 *
 * Rendement croissant avec le coût (3,0 / 3,0 / 3,5 dégâts par énergie) : le
 * gros coup paie un peu mieux mais mange presque tout le tour.
 */
export const GLAIVE: Arme = {
  id: 'glaive',
  nom: 'Glaive',
  rarete: 'commune',
  mains: 1,
  // LE FORMAT : 12 cartes de base, 6 qui frappent et 6 qui encaissent. Une
  // arme à une main en donne TROIS, toutes différentes — une arme à trois
  // cartes dont deux sont pareilles n'en a qu'une et demie ; une arme à deux
  // mains en donne six ; l'armure six. Tranché par Keko. Conséquence voulue :
  // deux armes à une main font un BUILD, on compose deux verbes, là où dix
  // cartes par arme faisaient que la seconde noyait la première.
  // DEUX MODÈLES, PAS TROIS — tranché par Keko : « 2× Taille, 1× Estoc (oui,
  // deux cartes différentes seulement) ». *Le format des trois cartes
  // différentes tombe ici*, et c'est cohérent avec ce qu'il avait acheté : une
  // arme dont deux cartes sont pareilles n'en a qu'une et demie, sauf quand le
  // doublon est justement ce qui alimente la troisième.
  // CINQ CARTES, TROIS MODÈLES — tranché par Keko : « 3 Taille, 1 Estoc,
  // 1 Riposte ». Les Tailles alimentent l'Estoc ET sont ce qu'on joue en
  // attendant ; la Riposte, elle, se joue quand on sait qu'on va encaisser.
  set: [
    { modele: TAILLE, nombre: 3 },
    { modele: ESTOC, nombre: 1 },
    { modele: RIPOSTE, nombre: 1 },
  ],
}

/** L'arme qu'on ne peut pas perdre : il y en a toujours une au râtelier. */
export const ARME_GRATUITE = GLAIVE

const FAUCHAGE: Modele = {
  nom: 'Fauchage',
  type: 'combat',
  cout: 2,
  degats: 0,
  effets: [{ type: 'degatsTous', montant: 5 }],
}
const FENDRE: Modele = { nom: 'Fendre', type: 'combat', cout: 3, degats: 9 }
const TORNADE: Modele = {
  nom: 'Tornade',
  type: 'combat',
  cout: 5,
  degats: 0,
  effets: [{ type: 'degatsTous', montant: 10 }],
}

/**
 * L'Espadon : la deuxième arme, et **son verbe est neuf** — frapper TOUS les
 * corps. Le Glaive ne sait que frapper un corps ; deux armes qui ne diffèrent
 * que par leur courbe coût/dégâts n'en font qu'une.
 *
 * Ce que ça change, et c'est l'arbitrage du multi-cibles pris à l'envers : le
 * Glaive achève un corps pour qu'il ne frappe plus, l'Espadon use tout le rang
 * à la fois et achève la meute d'un coup. Il paie ça contre un corps seul, où
 * ses fauchages ne valent que 2,5 dégâts par énergie.
 *
 * **À deux mains** : il condamne le second slot. C'est la première pièce qui
 * fait exister cette règle de l'armurerie.
 *
 * Six cartes, comme deux armes à une main : c'est le format des deux mains.
 *
 * Calibré par simulation contre le Glaive, même bot, 300 descentes au fond,
 * avec le Plastron :
 *
 * | arme    | survie | tours contre 1 corps | 2 corps | 3 corps |
 * |---------|--------|----------------------|---------|---------|
 * | Glaive  | 99 %   | 5,6                  | 5,8     | 5,6     |
 * | Espadon | 100 %  | 6,7                  | 5,1     | 3,8     |
 *
 * Même survie, autre profil : c'est exactement ce qu'on voulait. Fauchage à 4
 * donnait 96 % et à 5 la parité ; Tornade à 8 traînait (1,6 par énergie et par
 * corps), à 10 elle vaut son prix.
 */
export const ESPADON: Arme = {
  id: 'espadon',
  // ELLE S'APPELLE « ÉPÉE À DEUX MAINS » depuis que Keko lui a dessiné la
  // sienne — « qui remplace l'espadon ». *L'identifiant ne bouge pas* : il ne
  // se lit nulle part à l'écran, et le renommer ne ferait que risquer une
  // sauvegarde.
  nom: 'Épée à deux mains',
  rarete: 'rare',
  mains: 2,
  set: [
    { modele: FAUCHAGE, nombre: 3 },
    { modele: FENDRE, nombre: 2 },
    { modele: TORNADE, nombre: 1 },
  ],
}

/* ---------------------------------------------------------------------- *
 * LA RONDACHE : une arme à une main, et son verbe est DÉFENSIF.
 *
 * Nommée et composée par Keko — « une nouvelle arme à une main, qui est
 * défensive en réalité », trois cartes : Bloquer ×2 et Coup de bouclier ×1.
 *
 * **LES CHIFFRES SONT PROVISOIRES** (Keko : « on verra les effets après »), et
 * ils ne sortent pas de nulle part : ils reprennent le barème du jeu — *5 à
 * 5,5 de bloc par énergie, 3 à 3,5 de dégâts* — sans y ajouter de verbe neuf.
 * **À calibrer par simulation avant d'en faire un objet du jeu** : le set du
 * Glaive est 10 % plus faible que l'ancien deck de base, et ça avait fait
 * tomber la survie au fond de 50 % à 4 %.
 * ---------------------------------------------------------------------- */

const BLOQUER: Modele = {
  nom: 'Bloquer',
  type: 'combat',
  cout: 1,
  degats: 0,
  // SEPT, PAS CINQ — tranché par Keko. *Ça ne touche pas qu'à la défense* :
  // le Coup de bouclier frappe avec ce qu'on a bloqué, donc deux Bloquer
  // valent désormais 14 de dégâts au lieu de 10. **Les deux cartes de la
  // Rondache se règlent ensemble**, et c'est tout l'intérêt du verbe.
  effets: [{ type: 'bloc', montant: 7 }],
}

/**
 * LA PROJECTION : elle frappe peu et vole une mise.
 *
 * Composée par Keko : « inflige 3 dégâts et étourdissement ; étourdissement =
 * annule l'action en cours de l'ennemi ». *Elle vaut d'autant plus que la bête
 * est lente* — contre un frappeur à `periode: 2` elle efface deux tours
 * d'attente, contre un `periode: 1` elle n'en efface qu'un.
 *
 * **Son coût est à trancher** : 2 PA est un placeholder.
 */
const PROJECTION: Modele = {
  nom: 'Projection',
  type: 'combat',
  cout: 2,
  degats: 3,
  effets: [{ type: 'etourdit' }],
}

/**
 * ELLE FRAPPE AVEC CE QU'ON A ENCAISSÉ : ses dégâts valent la défense du
 * moment. Composé par Keko.
 *
 * *C'est le premier verbe qui fasse du BLOC une ressource offensive* —
 * jusqu'ici bloquer était la seule chose qu'on faisait de son armure, et une
 * garde posée n'avait plus rien à dire ensuite. Avec la Rondache, deux Bloquer
 * valent dix de défense, et le Coup de bouclier les rend en dégâts.
 *
 * **Le prix est le TEMPO** : il faut deux cartes avant lui pour qu'il vaille
 * quelque chose, et le bloc tombe à la fin du tour — donc il se joue dans le
 * tour où l'on s'est protégé, pas dans celui d'après.
 */
const COUP_DE_BOUCLIER: Modele = {
  nom: 'Coup de bouclier',
  type: 'combat',
  cout: 2,
  degats: 0,
  // SES DÉGÂTS SONT TA DÉFENSE. Composé par Keko : « le coup de bouclier
  // inflige des dégâts égaux à la défense ». *Il ne donne plus de bloc à lui
  // seul* — ce serait se demander si le chiffre annoncé compte celui qu'il
  // vient d'ajouter, et la réponse n'a pas à être devinée.
  degatsDuBloc: true,
}

/**
 * La Rondache : trois cartes, dont deux qui n'attaquent pas.
 *
 * **Elle est de BRONZE**, le premier cran — tranché par Keko. *Et ça ne la met
 * pas dans le prêt de l'armurier* : celui-ci tire dans `ARMES_COMMUNES`, une
 * LISTE et non un filtre sur la rareté, précisément pour que le jour où une
 * pièce du premier cran ne doive pas s'y trouver, on la retire sans toucher au
 * reste. Elle attend donc au coffre, comme l'Espadon.
 */
export const RONDACHE: Arme = {
  id: 'rondache',
  nom: 'Rondache',
  rarete: 'commune',
  mains: 1,
  // LA SEULE DE MAIN GAUCHE : un bouclier se tient de l'autre main que ce
  // qui frappe. Tranché par Keko.
  main: 'gauche',
  set: [
    { modele: BLOQUER, nombre: 3 },
    { modele: COUP_DE_BOUCLIER, nombre: 1 },
    { modele: PROJECTION, nombre: 1 },
  ],
}

/* ---------------------------------------------------------------------- *
 * Les armures. Elles ne frappent pas : elles donnent du BLOC.
 * ---------------------------------------------------------------------- */

const GARDE: Modele = {
  nom: 'Garde',
  type: 'combat',
  cout: 1,
  degats: 0,
  effets: [{ type: 'bloc', montant: 5 }],
}

const REMPART: Modele = {
  nom: 'Rempart',
  type: 'combat',
  cout: 2,
  degats: 0,
  effets: [{ type: 'bloc', montant: 11 }],
}

/**
 * **PROTECTION ET ESQUIVE : le set du Plastron de cuir.** Composé par Keko.
 *
 * *Deux cartes, deux réponses à la salve* — l'une sûre et chiffrée, l'autre au
 * hasard. La Protection reprend le barème de la Garde (1 PA pour 5 de bloc) ;
 * l'Esquive, elle, n'a pas de chiffre : **elle ne se compare pas, elle se
 * parie.**
 *
 * *Les coûts sont des placeholders* : Keko a donné les effets, pas les prix.
 */
const PROTECTION: Modele = {
  nom: 'Protection',
  type: 'combat',
  cout: 1,
  degats: 0,
  effets: [{ type: 'bloc', montant: 5 }],
}

const ESQUIVE: Modele = {
  nom: 'Esquive',
  type: 'combat',
  cout: 1,
  degats: 0,
  effets: [{ type: 'esquive' }],
}

/**
 * L'Armure de plate : l'armure commune et gratuite, pendant du Glaive. Elle
 * s'est appelée le Plastron jusqu'à ce que Keko lui dessine sa plate.
 *
 * **Le bloc est à la Slay the Spire** : il absorbe la salve de fin de tour,
 * puis il tombe. Ce n'est pas de la vie en réserve, c'est une décision qui ne
 * vaut que pour ce tour-ci — et c'est ce qui en fait un vrai arbitrage contre
 * frapper, à chaque main.
 *
 * Rendement : 5 et 5,5 de bloc par énergie, contre 3 à 3,5 de dégâts pour le
 * Glaive. **Bloquer rapporte plus que frapper, à énergie égale**, et c'est
 * délibéré : un point de bloc ne vaut un point de vie que si la salve arrive,
 * il est perdu sinon. On paie le gâchis par l'avantage.
 *
 * *Et c'est la première pièce qui montre ce que « équiper plus dilue » veut
 * dire* : quatre cartes de garde, ce sont quatre cartes qui ne frappent pas.
 * Le deck passe de 10 à 14, donc le Moulinet sort moins souvent.
 */
export const PLASTRON: Armure = {
  id: 'plastron',
  // ELLE S'APPELLE « ARMURE DE PLATE » depuis que Keko lui a dessiné sa plate.
  // *L'identifiant, lui, ne bouge pas* : il ne se lit nulle part à l'écran, et
  // le renommer ne ferait que risquer une sauvegarde.
  nom: 'Armure de plate',
  rarete: 'commune',
  set: [{ modele: REMPART, nombre: 2 }],
}

/**
 * **LE PLASTRON DE CUIR : l'armure de départ, et la première pièce à PORTER
 * DES PV.** Composée par Keko : Protection, Esquive, et +15 points de vie.
 */
export const PLASTRON_DE_CUIR: Armure = {
  id: 'plastron-de-cuir',
  nom: 'Plastron de cuir',
  rarete: 'commune',
  pv: 15,
  set: [
    { modele: PROTECTION, nombre: 1 },
    { modele: ESQUIVE, nombre: 1 },
  ],
}

/** Entre le cuir et la plate — provisoire. */
export const COTTE_DE_MAILLE: Armure = {
  id: 'cotte-de-maille',
  nom: 'Cotte de maille',
  rarete: 'commune',
  set: [
    { modele: GARDE, nombre: 1 },
    { modele: REMPART, nombre: 1 },
  ],
}

/** Du tissu : peu de bloc, et son verbe reste à trouver — provisoire. */
export const ROBE: Armure = {
  id: 'robe',
  nom: 'Robe',
  rarete: 'commune',
  set: [{ modele: GARDE, nombre: 2 }],
}

/** L'armure qu'on ne peut pas perdre, comme le Glaive. */
/**
 * **L'ARMURE DE DÉPART EST LE PLASTRON DE CUIR**, plus l'Armure de plate.
 * Tranché par Keko avec le reste du chargement : « on va mettre l'équipement
 * de base : glaive / bouclier / plastron cuir ».
 */
export const ARMURE_GRATUITE = PLASTRON_DE_CUIR

/**
 * CE QU'UN ARMURIER A TOUJOURS EN RÉSERVE : le premier cran, et rien d'autre.
 *
 * C'est le catalogue dans lequel le bouton « Équipement gratuit » puise — *un équipement
 * de fortune ne peut être fait que de ce qui traîne*. Deux listes plutôt qu'un
 * filtre sur la rareté : le jour où une pièce commune ne devra pas s'y trouver,
 * on la retire d'ici sans toucher au reste.
 */
/* ---------------------------------------------------------------------- *
 * LE RESTE DU CATALOGUE, dessiné par Keko et pas encore réglé.
 *
 * **LEURS SETS SONT PROVISOIRES, et ils ne contiennent AUCUNE carte nouvelle** :
 * ce sont les modèles qui existent déjà, en compositions différentes. *Inventer
 * sept jeux de noms et de chiffres serait trancher du design en passant* — et
 * un chiffre de carte ne se pose pas au jugé, le set du Glaive a fait tomber la
 * survie au fond de 50 % à 4 % pour 10 % de puissance.
 *
 * Ce qui est vrai dès maintenant : les pièces existent, portent leur
 * illustration, leur compteur et leur rareté, et se jouent. **À régler avec
 * Keko, pièce par pièce**, puis à calibrer par simulation.
 * ---------------------------------------------------------------------- */

/** Rapide et bon marché — provisoire. */
export const DAGUE: Arme = {
  id: 'dague',
  nom: 'Dague',
  rarete: 'commune',
  mains: 1,
  set: [
    { modele: ESTOC, nombre: 2 },
    { modele: TAILLADE, nombre: 1 },
  ],
}

/** Plus lourde que la dague, moins que le glaive — provisoire. */
export const HACHETTE: Arme = {
  id: 'hachette',
  nom: 'Hachette',
  rarete: 'commune',
  mains: 1,
  set: [
    { modele: TAILLADE, nombre: 2 },
    { modele: ESTOC, nombre: 1 },
  ],
}

/** Le gros coup, à deux mains — provisoire. */
export const HACHE_DEUX_MAINS: Arme = {
  id: 'hache-deux-mains',
  nom: 'Hache à deux mains',
  rarete: 'commune',
  mains: 2,
  set: [
    { modele: TAILLADE, nombre: 3 },
    { modele: MOULINET, nombre: 2 },
    { modele: FENDRE, nombre: 1 },
  ],
}

export const ARMES_COMMUNES: readonly Arme[] = [GLAIVE]
export const ARMURES_COMMUNES: readonly Armure[] = [PLASTRON]

/* ---------------------------------------------------------------------- *
 * LES CONSOMMABLES : des cartes qu'on empile soi-même.
 *
 * UNE POTION EST UNE CARTE, UN SOIN, PUIS PLUS RIEN — elle s'exile. Elle a eu
 * trois gorgées quand elle était seule dans son slot ; on peut désormais en
 * empiler autant qu'on veut, donc c'est LE NOMBRE EMPORTÉ qui règle le soin,
 * et il se règle là où on le voit. Tranché par Keko.
 *
 * Trois fioles imposées avaient été jugées « ça pollue trop la main » : la
 * différence est qu'on les choisit maintenant, une par une, contre de la
 * dilution. *Le jeu n'impose plus ce que le joueur décide.*
 * ---------------------------------------------------------------------- */

/**
 * **14 PV pour 1⚡, calibré par simulation** (400 descentes au fond, Glaive +
 * Plastron, bot qui bloque avant de frapper) :
 *
 * | potions emportées | 0 | 1 | 2 | 3 | 5 |
 * |---|---|---|---|---|---|
 * | à 10 PV | 79 % | 78 % | 83 % | 82 % | 83 % |
 * | à 14 PV | 79 % | 83 % | 86 % | 93 % | 92 % |
 * | à 18 PV | 79 % | 86 % | 91 % | 95 % | 97 % |
 *
 * **À 18, en emporter plus est TOUJOURS mieux** — la courbe ne plafonne
 * jamais, donc le choix n'en est pas un. À 14 elle plafonne dès trois, et
 * c'est ce qu'on veut : la quatrième ne rachète plus sa place.
 *
 * *Et le vrai coût n'est pas dans la run* : on n'en possède que cinq, et
 * boire les détruit. Emporter toute la pile, c'est dépenser son stock — une
 * simulation d'une seule descente ne peut pas le voir.
 *
 * Repère à garder : **une potion rend exactement ce que rend un palier**
 * (`REGLAGE_DEFAUT.soin`).
 */
const POTION: Modele = {
  nom: 'Potion',
  type: 'combat',
  cout: 1,
  degats: 0,
  effets: [{ type: 'soin', montant: 14 }],
  exil: true,
}

/** Un exemplaire de potion. On en possède plusieurs, chacun a son identité. */
export function potion(numero: number): Consommable {
  return { id: `potion-${numero}`, rarete: 'commune', modele: POTION }
}

/**
 * LA SUPER POTION : deux fois le soin, pour le même coût. **C'est un banc
 * d'essai**, pas un objet calibré — Keko : « tu peux ajouter un nouvel objet,
 * super potion, pour tester un truc ? »
 *
 * *Le chiffre n'est pas réglé, il est DOUBLE* : 28 contre 14, sans autre
 * contrepartie que d'occuper la même case de pile. À mesurer par simulation
 * avant d'en faire un objet du jeu — la courbe du soin plafonne dès trois
 * potions à 14, et rien ne dit où elle plafonne à 28.
 */
const SUPER_POTION: Modele = {
  nom: 'Super potion',
  type: 'combat',
  cout: 1,
  degats: 0,
  effets: [{ type: 'soin', montant: 28 }],
  exil: true,
}

/** Un exemplaire de super potion. Son identifiant lui est propre, comme tout
 * consommable : c'est lui qui dit, à l'arrivée, laquelle a été bue. */
export function superPotion(numero: number): Consommable {
  return { id: `super-potion-${numero}`, rarete: 'rare', modele: SUPER_POTION }
}

/** Deux exemplaires au râtelier, de quoi éprouver la pile sans la remplir. */
export const SUPER_POTIONS_DEPART: Consommable[] = [1, 2].map(superPotion)

/**
 * Le stock de départ. **Cinq exemplaires, et ils s'épuisent pour de bon** :
 * une potion bue ne revient pas au râtelier, une potion emportée est perdue
 * avec le reste si l'on meurt. Tranché par Keko.
 *
 * *Dette connue, et elle est volontaire* : sans marché, les cinq bues, il n'y
 * a plus jamais de soin. Le garde-fou de la spirale ne couvre que de quoi
 * frapper et encaisser — il faudra que le hub en vende.
 */
export const POTIONS_DEPART: Consommable[] = [1, 2, 3, 4, 5].map(potion)

/**
 * Le deck emporté, somme des sets de tout ce qui est équipé. Les identifiants
 * portent l'arme d'origine : deux armes peuvent donner la même carte sans que
 * leurs exemplaires se confondent.
 */
export function deckDeLEquipement(equipement: Piece[]): Carte[] {
  return equipement.flatMap((piece) =>
    piece.set.flatMap(({ modele, nombre }) =>
      Array.from({ length: nombre }, (_, i) => ({
        ...modele,
        id: `${piece.id}-${modele.nom.toLowerCase().replace(/\s+/g, '-')}-${i + 1}`,
        // ELLE HÉRITE DU MÉTAL DE SA PIÈCE. *La rareté fait la force du set*,
        // donc une carte d'arme rare est vraiment plus forte : son cadre
        // annonce une puissance, pas une provenance.
        rarete: piece.rarete,
        // ET DU CIEL DE SA PIÈCE, par la même porte : une carte d'arme porte
        // le décor rouge de l'arme, une carte d'armure garde le bleu.
        // *Deux étiquettes, un seul héritage.*
        famille: 'mains' in piece ? ('arme' as const) : ('armure' as const),
      })),
    ),
  )
}

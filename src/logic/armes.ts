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
  /**
   * CE QU'ELLE AJOUTE AUX POINTS D'ACTION, pour toute la descente.
   *
   * Demandé par Keko sur le Plastron de cuir, en même temps que ses PV. *C'est
   * la deuxième chose qu'une pièce fait sans passer par une carte*, et elle est
   * d'une autre nature : les PV allongent la course, un point d'action change
   * ce qu'on peut faire d'un TOUR — donc le deck entier se joue autrement.
   *
   * **Elle monte le MAXIMUM, pas la réserve du tour** : l'énergie se recharge
   * à chaque tour, donc un bonus qui ne donnerait que du courant serait perdu
   * au premier passage de main.
   *
   * *Pas calibré* : Keko a donné le chiffre, pas la mesure — et un sixième
   * point d'action est un levier bien plus violent que quinze PV.
   */
  pa?: number
  /**
   * CE QU'ELLE AJOUTE À LA TAILLE DE LA MAIN, pour toute la descente.
   *
   * **Le verbe de la Robe**, défendu par Keko : « le +1 carte en main change
   * vraiment le gameplay — oui ça dilue l'encombrement des trésors, mais tu as
   * peu de PV et surtout très peu de blocage ! Ce n'est pas broken et ça colle
   * bien au côté magie. »
   *
   * *J'avais alerté en regardant la stat seule* — une carte de main en plus
   * compense très exactement un trésor porté, donc elle désamorce le dilemme
   * central. **Le coût n'est pas dans la stat, il est dans le COUPLE stat +
   * set** : l'armure qui la donne ne bloque presque rien et porte peu de PV.
   * C'est un échange, et il se mesurera.
   *
   * Elle monte le maximum comme les PV et les PA : *ce qui vient de
   * l'équipement ne change plus une fois descendu.*
   *
   * *Elle ne s'appelle pas `main`* : une ARME porte déjà ce champ pour dire
   * quelle main elle occupe, et `Arme` est une intersection avec `Piece` — les
   * deux types se seraient annulés en `never`, **sans qu'aucune ligne ne soit
   * fausse à la lecture.**
   */
  cartesEnMain?: number
  /**
   * SA MATIÈRE — elle ne décide de rien, elle choisit le DESSIN de ses cartes.
   *
   * Keko a dessiné quatre Protection : tissu, cuir, maille, plate. *Quatre
   * armures donnent la même carte, et elle n'est pas dessinée quatre fois pour
   * rien* — c'est le même geste dans quatre matériaux. La matière descend donc
   * de la pièce à son set, comme la rareté et la famille, et `ui/art.ts` en
   * tire le fichier.
   *
   * **Aucune règle ne la lit.** Une pièce sans matière garde le dessin unique
   * de ses modèles, ce qui est le cas de toutes les armes.
   */
  matiere?: string
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
 * hasard. L'Esquive n'a pas de chiffre : **elle ne se compare pas, elle se
 * parie.**
 *
 * **ET ELLE A ABSORBÉ LA GARDE, qui était la MÊME CARTE.** Toutes deux
 * coûtaient 1 PA pour 5 de bloc : *deux noms pour un seul objet*, et je ne
 * l'avais pas vu en composant celle-ci — j'avais écrit « la Protection reprend
 * le barème de la Garde » sans voir que c'était littéralement elle.
 *
 * Ça s'est découvert en câblant les quatre dessins de Keko, et c'est ce qui
 * les rend gratuits : **remplacer la Garde par la Protection ne bouge pas un
 * chiffre**, donc trois armures sur quatre reçoivent leur matière sans qu'on
 * touche au réglage. *Un doublon ne se voit que le jour où l'on cherche à
 * distinguer ce qu'il confond.*
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

/**
 * **LA CARTE S'APPELLE AGILITÉ, L'ÉTAT QU'ELLE DONNE S'APPELLE ESQUIVE.**
 * Renommée par Keko.
 *
 * *C'est le couple Projection / étourdissement, repris ici* : **la carte nomme
 * le GESTE, le mot-clé nomme ce qu'on gagne.** Une carte qui portait le nom de
 * son propre mot-clé le disait deux fois — « Esquive : gagne esquive » — et
 * surtout elle brouillait la seule chose que le jaune du cartouche promet :
 * *qu'il y a une définition à aller lire ailleurs.*
 *
 * Le type interne, lui, ne bouge pas (`esquive`) : il ne se lit nulle part à
 * l'écran, et *un renommage traversant `logic/` pour un mot ne vaut pas son
 * risque* — la règle déjà tenue par `energie` et `tresor`.
 */
const ESQUIVE: Modele = {
  nom: 'Agilité',
  type: 'combat',
  cout: 1,
  degats: 0,
  effets: [{ type: 'esquive' }],
}

/**
 * **CONCENTRATION : le verbe de la Robe, et la seule carte du jeu qui pioche.**
 *
 * Keko, en posant la triade : « +carte main pour robe (magie avantage main) >
 * carte pioche ». *C'est ce qui donne au tissu un axe et pas seulement une
 * stat* — il ne protège presque pas, il fait VOIR plus de cartes, par la stat
 * ET par le deck.
 *
 * **Elle se paie en dilution comme tout le reste** : c'est une carte de plus
 * dans le deck, donc les bonnes sortent moins souvent. *Un avantage de main
 * qui passe par le deck obéit à la règle du jeu*, là où la stat seule
 * l'esquive.
 *
 * **DEUX CARTES, ET GRATUITE.** Keko a tranché le nombre — « pour Concentration
 * on va plutôt piocher 2 cartes » — et *c'est le coût qui est devenu le levier*,
 * parce qu'à deux cartes pour un point d'action elle ne fait que rendre ce
 * qu'elle coûte : la Robe tombait à 43 % de survie contre 50 et 56.
 *
 * **Le plancher est zéro, et le projet l'avait déjà écrit** pour la remise de
 * l'Estoc : *une carte gratuite est le bout de l'échelle, pas une erreur à
 * corriger.*
 *
 * *Et elle garde un prix, le seul qui compte ici* : **sa place dans le deck.**
 * Sauf qu'une Concentration gratuite se REMPLACE par deux cartes au lieu de
 * diluer — c'est un cyclage, donc le tissu joue de fait un deck plus court que
 * les deux autres. **C'est son avantage de main, dit par le deck.**
 */
/**
 * LA VIGILANCE : le second verbe du tissu, et il se compte sur la main.
 *
 * **Elle s'est appelée « Trame » le temps d'un commit**, et Keko l'a reprise :
 * « trame ? ça signifie quoi ? je comprends pas le concept ». *Une trame est le
 * fil horizontal d'un tissage* — le mot disait la matière de l'armure et le
 * fait qu'elle est faite de plusieurs fils, mais **il fallait le savoir pour
 * l'entendre**, et un nom qui demande une note n'est pas un nom.
 *
 * *Celui-ci fait PAIRE avec la Concentration* : deux états de l'esprit, et
 * c'est l'identité de cette armure — elle ne pare pas avec de la matière, elle
 * pare avec ce qu'elle a en tête. Plus on tient de cartes, plus on est prêt.
 *
 * **Elle remplace l'Agilité, que Keko a rendue au cuir** : « ça me gêne un peu
 * d'avoir agilité sur la robe, ça devrait être propre au cuir ». *Deux armures
 * sur le même verbe ne font pas deux builds*, et l'esquive est le geste de
 * celui qui bouge, pas de celui qui tisse.
 */
const VIGILANCE: Modele = {
  nom: 'Vigilance',
  type: 'combat',
  cout: 1,
  degats: 0,
  effets: [{ type: 'blocParCarte', montant: 1 }],
}

const CONCENTRATION: Modele = {
  nom: 'Concentration',
  type: 'combat',
  cout: 0,
  degats: 0,
  effets: [{ type: 'pioche', montant: 2 }],
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
  matiere: 'plate',
  // **ELLE NE CHANGE AUCUNE RÈGLE, et c'est son identité.** Les deux autres
  // portent un verbe — voir plus, jouer plus ; la plate ne fait qu'encaisser,
  // et c'est le rôle que tient le Glaive chez les armes : *une gamme a besoin
  // d'un barreau plat pour que les autres se mesurent à lui.*
  //
  // J'avais proposé de lui faire PAYER quelque chose (−1 PA) pour qu'elle ait
  // un axe à elle ; Keko l'a écarté : « −1 PA c'est très dur, et même avec plus
  // de tankyness c'est pas vraiment fun ». **Un malus qui n'ouvre aucune
  // décision n'est qu'une punition** — et partir couvert est déjà payé par la
  // dilution, qui est le prix que le concept prévoit.
  // **+30, ET L'ÉCHELLE EST DE KEKO : 0 / 15 / 30.** Mon balayage avait posé
  // +22, le chiffre qui alignait les trois survies — mais *un pas constant se
  // lit comme une gamme*, là où 5 / 15 / 22 n'était qu'un réglage de bot.
  // **L'écart de survie que ça rouvre se paie ailleurs**, pas sur les PV : voir
  // la mesure dans CLAUDE.md.
  pv: 30,
  set: [
    { modele: PROTECTION, nombre: 1 },
    { modele: REMPART, nombre: 1 },
  ],
}

/**
 * **LE PLASTRON DE CUIR : l'armure de départ, et la première pièce à PORTER
 * DES PV.** Composée par Keko : Protection, Esquive, et +15 points de vie.
 */
export const PLASTRON_DE_CUIR: Armure = {
  id: 'plastron-de-cuir',
  nom: 'Plastron de cuir',
  rarete: 'commune',
  matiere: 'cuir',
  pv: 15,
  pa: 1,
  set: [
    { modele: PROTECTION, nombre: 1 },
    { modele: ESQUIVE, nombre: 1 },
  ],
}

/**
 * **LA ROBE : voir plus, ne presque rien encaisser.** Tranchée par Keko avec la
 * triade — « +carte main pour robe (magie avantage main) ».
 *
 * *Une carte de main de plus est le levier le plus violent des trois* : elle
 * change ce qu'on peut faire d'un tour ET elle absorbe une part de
 * l'encombrement. **Ce qui la paie, c'est son set** — une seule Protection, pas
 * de Rempart, et cinq points de vie.
 */
export const ROBE: Armure = {
  id: 'robe',
  nom: 'Robe',
  rarete: 'commune',
  matiere: 'tissu',
  // **ZÉRO, ET C'EST SON IDENTITÉ.** Tranché par Keko avec l'échelle des trois.
  // *Une armure qui ne donne aucun point de vie dit ce qu'elle est* — elle ne
  // protège pas, elle fait autre chose — là où cinq points disaient « un peu ».
  cartesEnMain: 1,
  // **ELLE NE BLOQUE RIEN DU TOUT, et c'est Keko qui l'a demandé** : « est-ce
  // qu'on ne mettrait pas autre chose qu'une carte Protection pour le tissu ?
  // ça protège que dal c'est bizarre ». *Cinq points de bloc contre des salves
  // de quatorze, c'est un geste à moitié* — mieux vaut assumer que le tissu ne
  // pare pas.
  //
  // **ELLE BLOQUE SUR SA MAIN, et c'est son propre verbe.** Elle a porté
  // l'Agilité le temps de quelques commits, puis Keko l'a rendue au cuir :
  // « ça me gêne un peu d'avoir agilité sur la robe, ça devrait être propre au
  // cuir ». *Et il a raison sur les deux tableaux* — l'esquive est le geste de
  // celui qui bouge, et **deux armures sur le même verbe ne font pas deux
  // builds, elles font une bonne et une moins bonne** : c'est ce qui avait
  // coûté la cotte de maille.
  //
  // La Vigilance n'est donc pas un retour au bloc : son montant dépend de ce qu'on
  // n'a pas encore joué, donc *elle fait de l'ordre des coups une décision* au
  // lieu d'un chiffre fixe — et elle dit la même chose que la stat du tissu.
  set: [
    { modele: CONCENTRATION, nombre: 1 },
    { modele: VIGILANCE, nombre: 1 },
  ],
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
        // ET DE SA MATIÈRE, par la même porte encore : quatre armures donnent
        // la même Protection, et c'est la matière qui dit laquelle des quatre
        // on dessine. *Trois étiquettes, un seul héritage.*
        matiere: piece.matiere,
      })),
    ),
  )
}

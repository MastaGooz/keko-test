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

export type Rarete = 'commune' | 'rare' | 'epique'

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
}

export type Arme = Piece & {
  /** Nombre de mains occupées. Une arme à deux mains prend les deux slots. */
  mains: 1 | 2
}

export type Armure = Piece

const ESTOC: Modele = { nom: 'Estoc', type: 'combat', cout: 1, degats: 3 }
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
  set: [
    { modele: ESTOC, nombre: 1 },
    { modele: TAILLADE, nombre: 1 },
    { modele: MOULINET, nombre: 1 },
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
  nom: 'Espadon',
  rarete: 'rare',
  mains: 2,
  set: [
    { modele: FAUCHAGE, nombre: 3 },
    { modele: FENDRE, nombre: 2 },
    { modele: TORNADE, nombre: 1 },
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
 * Le Plastron : l'armure commune et gratuite, pendant du Glaive.
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
  nom: 'Plastron',
  rarete: 'commune',
  set: [
    { modele: GARDE, nombre: 4 },
    { modele: REMPART, nombre: 2 },
  ],
}

/** L'armure qu'on ne peut pas perdre, comme le Glaive. */
export const ARMURE_GRATUITE = PLASTRON

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
        id: `${piece.id}-${modele.nom.toLowerCase()}-${i + 1}`,
      })),
    ),
  )
}

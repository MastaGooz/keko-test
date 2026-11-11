/**
 * LE LABO : L'ARBRE DES RECHERCHES (Keko, 11/11 : « on peut commencer l'arbre tech du labo ? »).
 *
 * L'arbre est découpé PAR ACTIVITÉ, pas par partie du vaisseau (« minage / combat / exploration / commerce — on va avoir
 * un jeu d'extraction qui demandera de partir en mission de minage, d'exploration, de combat, de commerce ») ; le
 * commerce est venu avec le marché (sa branche agit sur les ventes, pas sur le vaisseau). AUCUN LIEN ENTRE LES BRANCHES. Trois sortes de nœuds :
 *
 * - une PIÈCE : le nœud donne le droit de l'acheter — EN CRÉDITS, sous le nœud, comme avant (« une fois débloqué, le
 *   joueur peut l'acheter en dessous avec de l'argent ») ;
 * - un PASSIF : un bonus permanent, « qui s'applique globalement, indépendamment du vaisseau » — acquis dès le nœud ;
 * - une MÉCANIQUE : une action de jeu qui se débloque — acquise dès le nœud.
 *
 * UN NŒUD SE DÉBLOQUE TOUJOURS EN MINERAI (« et autres ressources », plus tard), pris au trésor de l'entrepôt : chaque
 * pépite rapportée se vend ou se garde. Chaque branche a trois RANGS ; un rang s'ouvre quand un nœud du rang d'avant
 * est débloqué. Un passif vaut UN PALIER par nœud (le même peut revenir plus loin).
 *
 * *Les nœuds, leurs effets et leurs coûts sont de moi, à rejuger ; les pièces sont celles d'avant, posées là en
 * attendant leur refonte (chaque branche aura ses châssis et ses propulseurs).* La règle est pure : le labo est une
 * valeur, débloquer rend un labo et un trésor neufs.
 */
import { MINERAIS, type Cargaison, type ConfigVaisseau } from './jeu.ts'

export const BRANCHES = ['minage', 'combat', 'exploration', 'commerce'] as const
export type Branche = (typeof BRANCHES)[number]
export const NOMS_BRANCHE: Record<Branche, string> = { minage: 'Minage', combat: 'Combat', exploration: 'Exploration', commerce: 'Commerce' }
export type SorteDeNoeud = 'piece' | 'passif' | 'mecanique'
export type Rang = 1 | 2 | 3
export const RANGS: Rang[] = [1, 2, 3]

/** Ce qu'un passif ajoute : des PARTS (0,15 = +15 %) ou des POINTS (la soute, le blindage, le bouclier), ou une chance. */
export type Passif = {
  debit?: number
  soute?: number
  pepiteDouble?: number
  blindage?: number
  cadence?: number
  critique?: number
  bouclier?: number
  vitesse?: number
  maniabilite?: number
  acceleration?: number
  aimant?: number
  /** Le commerce : une part ajoutée à chaque gain de vente ; une part ajoutée au plus haut prix d'un ordre. */
  vente?: number
  plafond?: number
}
export type Mecanique = 'postcombustion' | 'prevision'

export type Noeud = {
  id: string
  branche: Branche
  rang: Rang
  sorte: SorteDeNoeud
  nom: string
  /** Ce qu'il donne, dit au joueur. */
  dit: string
  /** Une pièce : son identifiant au catalogue du hangar. */
  piece?: string
  passif?: Passif
  mecanique?: Mecanique
  /** Le dessin d'un passif ou d'une mécanique (la page le connaît par ce nom). */
  icone?: string
}

/** Le coût d'un nœud, par rang, en minerai du trésor. */
export const COUTS: Record<Rang, Cargaison> = {
  1: { fer: 20, or: 0, cristal: 0 },
  2: { fer: 30, or: 10, cristal: 0 },
  3: { fer: 0, or: 20, cristal: 15 },
}

export const NOEUDS: Noeud[] = [
  // ---- MINAGE
  { id: 'm-foreuse-2', branche: 'minage', rang: 1, sorte: 'piece', piece: 'foreuse-2', nom: 'Foreuse lourde', dit: 'Ouvre l’achat de la foreuse lourde : elle creuse 40 % plus vite.' },
  { id: 'm-debit', branche: 'minage', rang: 1, sorte: 'passif', icone: 'forage', passif: { debit: 0.15 }, nom: 'Forage rapide', dit: 'Toutes les foreuses creusent 15 % plus vite.' },
  { id: 'm-aimant-1', branche: 'minage', rang: 2, sorte: 'piece', piece: 'aimant-1', nom: 'Aimant', dit: 'Ouvre l’achat de l’aimant : il attire les pépites de 60 % plus loin.' },
  { id: 'm-soute', branche: 'minage', rang: 2, sorte: 'passif', icone: 'soute', passif: { soute: 5 }, nom: 'Soute élargie', dit: 'Cinq pépites de plus en soute, quel que soit le châssis.' },
  { id: 'm-foreuse-3', branche: 'minage', rang: 3, sorte: 'piece', piece: 'foreuse-3', nom: 'Foreuse longue', dit: 'Ouvre l’achat de la foreuse longue : 80 % plus vite, 25 % plus loin.' },
  { id: 'm-aimant-2', branche: 'minage', rang: 3, sorte: 'piece', piece: 'aimant-2', nom: 'Grand aimant', dit: 'Ouvre l’achat du grand aimant : il attire deux fois plus loin.' },
  { id: 'm-double', branche: 'minage', rang: 3, sorte: 'passif', icone: 'pepite', passif: { pepiteDouble: 0.15 }, nom: 'Filon double', dit: 'Chaque pépite d’une roche que vous creusez a 15 % de chances d’être double.' },
  // ---- COMBAT
  { id: 'c-canon', branche: 'combat', rang: 1, sorte: 'piece', piece: 'arme-canon', nom: 'Canon', dit: 'Ouvre l’achat du canon : un obus toutes les 1,1 s, il tire seul sur le rival.' },
  { id: 'c-blindage', branche: 'combat', rang: 1, sorte: 'passif', icone: 'blindage', passif: { blindage: 1 }, nom: 'Blindage renforcé', dit: 'Un point de blindage de plus, quel que soit le châssis.' },
  { id: 'c-rafale', branche: 'combat', rang: 2, sorte: 'piece', piece: 'arme-rafale', nom: 'Mitrailleuse', dit: 'Ouvre l’achat de la mitrailleuse : quatre balles par seconde, dispersées.' },
  { id: 'c-coque-2', branche: 'combat', rang: 2, sorte: 'piece', piece: 'coque-2', nom: 'Châssis blindé', dit: 'Ouvre l’achat du châssis blindé : 8 de blindage, deux armes. Lourd.' },
  { id: 'c-cadence', branche: 'combat', rang: 2, sorte: 'passif', icone: 'cadence', passif: { cadence: 0.15 }, nom: 'Chargeurs rapides', dit: 'Toutes les armes tirent 15 % plus souvent.' },
  { id: 'c-missiles', branche: 'combat', rang: 3, sorte: 'piece', piece: 'arme-missiles', nom: 'Missiles', dit: 'Ouvre l’achat des missiles : guidés, 14 points, portent à 190.' },
  { id: 'c-coque-3', branche: 'combat', rang: 3, sorte: 'piece', piece: 'coque-3', nom: 'Châssis à bouclier', dit: 'Ouvre l’achat du châssis à bouclier : 2 points qui se rechargent, deux outils, deux armes.' },
  { id: 'c-critique', branche: 'combat', rang: 3, sorte: 'passif', icone: 'critique', passif: { critique: 0.1 }, nom: 'Coup critique', dit: 'Chaque tir a 10 % de chances de faire double dégât.' },
  { id: 'c-bouclier', branche: 'combat', rang: 3, sorte: 'passif', icone: 'bouclier', passif: { bouclier: 1 }, nom: 'Bouclier auxiliaire', dit: 'Un point de bouclier de plus, qui se recharge hors des coups, quel que soit le châssis.' },
  // ---- EXPLORATION
  { id: 'e-propulseur-2', branche: 'exploration', rang: 1, sorte: 'piece', piece: 'propulseur-2', nom: 'Propulseur renforcé', dit: 'Ouvre l’achat du propulseur renforcé : accélération +25 %, pointe +15 %.' },
  { id: 'e-vitesse', branche: 'exploration', rang: 1, sorte: 'passif', icone: 'vitesse', passif: { vitesse: 0.08 }, nom: 'Carénage', dit: 'La vitesse de pointe monte de 8 %.' },
  { id: 'e-radar', branche: 'exploration', rang: 2, sorte: 'piece', piece: 'radar', nom: 'Radar', dit: 'Ouvre l’achat du radar : il désigne le rival au bord de l’écran.' },
  { id: 'e-maniabilite', branche: 'exploration', rang: 2, sorte: 'passif', icone: 'maniabilite', passif: { maniabilite: 0.12 }, nom: 'Gyroscopes', dit: 'Le nez tourne 12 % plus vite.' },
  { id: 'e-acceleration', branche: 'exploration', rang: 2, sorte: 'passif', icone: 'acceleration', passif: { acceleration: 0.12 }, nom: 'Injecteurs', dit: 'L’accélération monte de 12 %.' },
  { id: 'e-postcombustion', branche: 'exploration', rang: 2, sorte: 'mecanique', icone: 'postcombustion', mecanique: 'postcombustion', nom: 'Postcombustion', dit: 'En vol, une double tape lance une pointe de vitesse ; elle se recharge en 6 s.' },
  { id: 'e-propulseur-3', branche: 'exploration', rang: 3, sorte: 'piece', piece: 'propulseur-3', nom: 'Propulseur ionique', dit: 'Ouvre l’achat du propulseur ionique : accélération +60 %, pointe +35 %.' },
  { id: 'e-aimant', branche: 'exploration', rang: 3, sorte: 'passif', icone: 'aimant', passif: { aimant: 0.25 }, nom: 'Champ étendu', dit: 'Le vaisseau attire les pépites de 25 % plus loin.' },
  // ---- COMMERCE (Keko, 11/11 : « tu peux rajouter commerce en arbre tech ? » — il agit sur le marché, `marche.ts`)
  { id: 'k-negoce', branche: 'commerce', rang: 1, sorte: 'passif', icone: 'vente', passif: { vente: 0.05 }, nom: 'Négoce', dit: 'Chaque vente rapporte 5 % de plus, au cours comme par ordre.' },
  { id: 'k-courtage', branche: 'commerce', rang: 2, sorte: 'passif', icone: 'plafond', passif: { plafond: 0.1 }, nom: 'Courtage', dit: 'Le prix le plus haut d’un ordre monte de 10 %.' },
  { id: 'k-negoce-2', branche: 'commerce', rang: 2, sorte: 'passif', icone: 'vente', passif: { vente: 0.05 }, nom: 'Grand négoce', dit: 'Chaque vente rapporte encore 5 % de plus.' },
  { id: 'k-prevision', branche: 'commerce', rang: 3, sorte: 'mecanique', icone: 'prevision', mecanique: 'prevision', nom: 'Prévision', dit: 'La courbe du cours montre aussi les dix minutes à venir.' },
]

/** Ce qu'on a recherché : les nœuds débloqués. */
export type Labo = { debloques: string[] }
export const laboNeuf = (): Labo => ({ debloques: [] })

export const noeudDe = (id: string): Noeud | undefined => NOEUDS.find((n) => n.id === id)
export const noeudsDe = (b: Branche, r?: Rang): Noeud[] => NOEUDS.filter((n) => n.branche === b && (r === undefined || n.rang === r))
export const estDebloque = (l: Labo, id: string): boolean => l.debloques.includes(id)
/** Un rang est OUVERT : le premier toujours, les suivants dès qu'un nœud du rang d'avant est débloqué. */
export const rangOuvert = (l: Labo, b: Branche, r: Rang): boolean => r === 1 || noeudsDe(b, (r - 1) as Rang).some((n) => estDebloque(l, n.id))
export const coutDe = (n: Noeud): Cargaison => COUTS[n.rang]
/** Le trésor paie le coût (chaque minerai). */
export const peutPayer = (tresor: Cargaison, cout: Cargaison): boolean => MINERAIS.every((k) => tresor[k] >= cout[k])
export function peutDebloquer(l: Labo, tresor: Cargaison, id: string): boolean {
  const n = noeudDe(id)
  return n !== undefined && !estDebloque(l, id) && rangOuvert(l, n.branche, n.rang) && peutPayer(tresor, coutDe(n))
}
/** Débloquer un nœud : le minerai quitte le trésor. Rend les deux valeurs neuves, ou null si on ne peut pas. */
export function debloquer(l: Labo, tresor: Cargaison, id: string): { labo: Labo; tresor: Cargaison } | null {
  if (!peutDebloquer(l, tresor, id)) return null
  const cout = coutDe(noeudDe(id)!)
  const reste = { ...tresor }
  for (const k of MINERAIS) reste[k] -= cout[k]
  return { labo: { debloques: [...l.debloques, id] }, tresor: reste }
}
/** Une pièce est OUVERTE À L'ACHAT : un nœud débloqué la porte (une pièce qu'aucun nœud ne porte ne s'achète pas). */
export const pieceOuverte = (l: Labo, piece: string): boolean => NOEUDS.some((n) => n.piece === piece && estDebloque(l, n.id))
export const aLaMecanique = (l: Labo, m: Mecanique): boolean => NOEUDS.some((n) => n.mecanique === m && estDebloque(l, n.id))

/** La somme des passifs débloqués. */
export function passifsDe(l: Labo): Required<Passif> {
  const s: Required<Passif> = { debit: 0, soute: 0, pepiteDouble: 0, blindage: 0, cadence: 0, critique: 0, bouclier: 0, vitesse: 0, maniabilite: 0, acceleration: 0, aimant: 0, vente: 0, plafond: 0 }
  for (const n of NOEUDS) {
    if (n.passif === undefined || !estDebloque(l, n.id)) continue
    for (const k of Object.keys(n.passif) as (keyof Passif)[]) s[k] += n.passif[k] ?? 0
  }
  return s
}

/**
 * La configuration du vaisseau APRÈS LE LABO : les passifs s'ajoutent à ce que le hangar a monté (quel que soit le
 * vaisseau), les mécaniques s'allument. Le rival n'en profite pas (sa section de la configuration n'est pas touchée).
 * Sans foreuse (débit nul), le forage affûté ne donne rien.
 */
export function configDuLabo(c: ConfigVaisseau, l: Labo): ConfigVaisseau {
  const p = passifsDe(l)
  return {
    ...c,
    capacite: c.capacite + p.soute,
    poussee: c.poussee * (1 + p.acceleration),
    vitesseMax: c.vitesseMax * (1 + p.vitesse),
    rotation: c.rotation * (1 + p.maniabilite),
    coque: c.coque + p.blindage,
    bouclier: { ...c.bouclier, points: c.bouclier.points + p.bouclier },
    foreuse: { ...c.foreuse, debit: c.foreuse.debit * (1 + p.debit), aimant: c.foreuse.aimant * (1 + p.aimant) },
    armes: c.armes.map((a) => ({ ...a, cadence: a.cadence / (1 + p.cadence) })),
    passifs: { ...c.passifs, pepiteDouble: p.pepiteDouble, critique: p.critique },
    postcombustion: { ...c.postcombustion, active: aLaMecanique(l, 'postcombustion') },
  }
}

/** Relit un labo gardé, sans confiance : les nœuds inconnus tombent, chacun une seule fois. */
export function lireLabo(brut: unknown): Labo {
  const l = laboNeuf()
  if (typeof brut !== 'object' || brut === null) return l
  const d = (brut as { debloques?: unknown }).debloques
  if (Array.isArray(d)) for (const id of d) if (typeof id === 'string' && noeudDe(id) !== undefined && !estDebloque(l, id)) l.debloques.push(id)
  return l
}

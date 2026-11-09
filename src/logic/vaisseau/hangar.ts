/**
 * LE HANGAR (Keko, 09/11 : « un menu avant de lancer la game où le joueur choisit son vaisseau en sélectionnant les
 * différentes pièces qu'il possède (propulseur, ailes, foreuse, arme...) » ; tranché : « pièces à l'achat », « un vrai
 * interface qui affiche toutes les pièces : propulseur, coque, foreuse, arme (plusieurs possibles) » ; puis : « et si on
 * changeait l'emplacement de la foreuse pour un emplacement utilitaire ? la foreuse comme actuellement, ou à la place
 * un radar qui détecte les ennemis si le joueur veut chasser, ou d'autres outils ; un nombre d'emplacements qui dépend
 * de la coque comme pour les armes »).
 *
 * Le minerai extrait (le TRÉSOR : celui des expéditions achevées) achète des pièces, qui restent acquises — seul le
 * minerai porté se perd avec la coque. Deux EMPLACEMENTS à une pièce (propulseur, coque : la pièce de série est
 * possédée d'office), puis LES OUTILS et LES ARMES, autant que LA COQUE EN PORTE (`capacite`) : une foreuse de série
 * est montée au départ, aucune arme. La règle est pure : le hangar est une valeur, l'achat, le montage et le démontage
 * rendent un hangar neuf, et `configDuHangar` traduit les pièces en configuration du vaisseau — CELLE DU JOUEUR SEUL :
 * le rival garde la configuration de série.
 */
import { cargaisonVide, MINERAIS, type Arme, type Cargaison, type ConfigVaisseau, type Minerai } from './jeu.ts'

/** Les emplacements à une pièce ; les outils et les armes sont des LISTES, bornées par la coque. */
export const EMPLACEMENTS = ['propulseur', 'coque'] as const
export type Emplacement = (typeof EMPLACEMENTS)[number]
export type Liste = 'outil' | 'arme'
export type Sorte = Emplacement | Liste
/** Le plus de places qu'une coque puisse porter, outils ou armes. */
export const PLACES_MAX = 3

export type Piece = {
  id: string
  sorte: Sorte
  /** 1 de série, 2, 3 — l'ordre du catalogue ; le dessin du vaisseau en change. */
  cran: 1 | 2 | 3
  nom: string
  /** Ce qu'elle change, dit au joueur. */
  dit: string
  /** Ce que les jauges ne disent pas (une flamme bleue, un missile guidé…), en petit sous les stats (Keko). */
  note?: string
  /** Le prix, EN CRÉDITS (Keko : « mets le coût en crédits ») — la monnaie que l'entrepôt rend contre le minerai. */
  prix: number
  /** Les outils d'une même famille se remplacent l'un l'autre quand les places manquent (une foreuse chasse la foreuse). */
  famille?: string
  /** Les facteurs sur la configuration de série (absent = 1). */
  poussee?: number
  vitesseMax?: number
  rotation?: number
  /** La coque : ses points (absolus), son poids (divise la poussée et le frein : lourde, elle accélère moins et glisse plus), son bouclier (des points qui se rechargent), les armes et les outils qu'elle porte. */
  pv?: number
  poids?: number
  bouclier?: number
  armes?: number
  outils?: number
  /** Une foreuse : le débit et la portée du forage, la portée de l'aimant — des facteurs. */
  debit?: number
  portee?: number
  aimant?: number
  /** Un radar : à tant d'unités, le rival est désigné au bord de l'écran. */
  radar?: number
  /** Une arme : ce qu'elle tire. */
  arme?: Arme
}

/**
 * Le catalogue. *Les prix et les chiffres sont de moi, à rejuger* : en crédits (le fer se vend 2 la pépite, une roche en
 * rend deux à sept ; en fer d'abord, Keko les a passés en crédits le 09/11).
 */
export const PIECES: Piece[] = [
  { id: 'propulseur-1', sorte: 'propulseur', cran: 1, nom: 'Propulseur de serie', dit: 'Acceleration, pointe et maniabilite de serie.', prix: 0 },
  { id: 'propulseur-2', sorte: 'propulseur', cran: 2, nom: 'Propulseur renforce', dit: 'Acceleration +25 %, pointe +15 %, nez +10 %.', prix: 24, poussee: 1.25, vitesseMax: 1.15, rotation: 1.1 },
  { id: 'propulseur-3', sorte: 'propulseur', cran: 3, nom: 'Propulseur ionique', dit: 'Acceleration +60 %, pointe +35 %, nez +25 %. Flamme bleue.', note: 'Flamme bleue.', prix: 60, poussee: 1.6, vitesseMax: 1.35, rotation: 1.25 },
  { id: 'coque-1', sorte: 'coque', cran: 1, nom: 'Coque de serie', dit: '5 points de coque, un outil, une arme, poids de serie.', prix: 0, pv: 5, poids: 1, armes: 1, outils: 1 },
  { id: 'coque-2', sorte: 'coque', cran: 2, nom: 'Coque blindee', dit: '8 points, un outil, deux armes. Lourde : accelere moins, glisse plus.', note: 'Acier rivete.', prix: 28, pv: 8, poids: 1.3, armes: 2, outils: 1 },
  { id: 'coque-3', sorte: 'coque', cran: 3, nom: 'Coque a bouclier', dit: '5 points et 2 de bouclier qui se rechargent hors des coups, deux outils, deux armes.', note: 'Le bouclier se recharge apres 4 s sans coup.', prix: 64, pv: 5, poids: 1.1, bouclier: 2, armes: 2, outils: 2 },
  { id: 'foreuse-1', sorte: 'outil', cran: 1, famille: 'foreuse', nom: 'Foreuse de serie', dit: 'Creuse les roches. Debit, portee et aimant de serie.', note: 'Creuse les roches, jamais le rival.', prix: 0, debit: 1, portee: 1, aimant: 1 },
  { id: 'foreuse-2', sorte: 'outil', cran: 2, famille: 'foreuse', nom: 'Foreuse lourde', dit: 'Creuse 40 % plus vite, aimant +25 %.', prix: 20, debit: 1.4, portee: 1, aimant: 1.25 },
  { id: 'foreuse-3', sorte: 'outil', cran: 3, famille: 'foreuse', nom: 'Foreuse longue', dit: 'Creuse 80 % plus vite, porte 25 % plus loin, aimant +60 %.', prix: 56, debit: 1.8, portee: 1.25, aimant: 1.6 },
  { id: 'radar', sorte: 'outil', cran: 2, famille: 'radar', nom: 'Radar', dit: 'Designe le rival au bord de l’ecran jusqu’a 600 unites. Pour le chasser, sans foreuse s’il le faut : abattu, il rend son butin.', note: 'Une fleche rouge au bord de l’ecran designe le rival.', prix: 32, radar: 600 },
  { id: 'arme-canon', sorte: 'arme', cran: 1, nom: 'Canon', dit: 'Un obus toutes les 1,1 s, 6 points, porte a 120. Tire seul sur le rival.', note: 'Tire seul sur le rival a portee.', prix: 24, arme: { id: 'canon', cadence: 1.1, degats: 6, portee: 120, vitesse: 170, vie: 1, dispersion: 0.05, guide: false } },
  { id: 'arme-rafale', sorte: 'arme', cran: 2, nom: 'Mitrailleuse', dit: 'Quatre balles par seconde, 1,6 point chacune, porte a 90, disperse.', note: 'Disperse ses balles.', prix: 44, arme: { id: 'rafale', cadence: 0.25, degats: 1.6, portee: 90, vitesse: 200, vie: 0.6, dispersion: 0.14, guide: false } },
  { id: 'arme-missiles', sorte: 'arme', cran: 3, nom: 'Missiles', dit: 'Un missile guide toutes les 2,8 s, 14 points, porte a 190.', note: 'Guide : le missile tourne vers le rival.', prix: 68, arme: { id: 'missiles', cadence: 2.8, degats: 14, portee: 190, vitesse: 95, vie: 3, dispersion: 0.3, guide: true } },
]

/**
 * DES PIÈCES D'ESSAI, pour voir le hangar quand il y en a beaucoup (Keko : « donne-moi plein de pièces de vaisseau pour
 * test ») : douze propulseurs, six coques, huit foreuses et quatre radars, dix armes, aux chiffres tirés de leur rang.
 * Ajoutées au catalogue par la page quand on le lui demande (`&pieces`), jamais d'office.
 */
export function ajouterLesPiecesDEssai(): void {
  if (PIECES.some((p) => p.id.startsWith('essai-'))) return
  const n = (i: number, a: number, b: number): number => a + ((i * 7919) % 100) * (b - a) / 100
  for (let i = 1; i <= 12; i++) PIECES.push({ id: `essai-propulseur-${i}`, sorte: 'propulseur', cran: 2, nom: `Propulseur d'essai ${i}`, dit: 'Une pièce d’essai, pour remplir la liste.', prix: 2 * (5 + i * 3), poussee: n(i, 0.9, 1.7), vitesseMax: n(i + 3, 0.9, 1.4), rotation: n(i + 5, 0.8, 1.3) })
  for (let i = 1; i <= 6; i++) PIECES.push({ id: `essai-coque-${i}`, sorte: 'coque', cran: 2, nom: `Coque d'essai ${i}`, dit: 'Une pièce d’essai, pour remplir la liste.', prix: 2 * (8 + i * 4), pv: 3 + i, poids: n(i, 0.8, 1.5), bouclier: i % 3 === 0 ? 1 : 0, armes: 1 + (i % 3), outils: 1 + (i % 2) })
  for (let i = 1; i <= 8; i++) PIECES.push({ id: `essai-foreuse-${i}`, sorte: 'outil', cran: 2, famille: 'foreuse', nom: `Foreuse d'essai ${i}`, dit: 'Une pièce d’essai, pour remplir la liste.', prix: 2 * (4 + i * 3), debit: n(i, 0.8, 2), portee: n(i + 2, 0.9, 1.4), aimant: n(i + 4, 0.8, 1.8) })
  for (let i = 1; i <= 4; i++) PIECES.push({ id: `essai-radar-${i}`, sorte: 'outil', cran: 2, famille: 'radar', nom: `Radar d'essai ${i}`, dit: 'Une pièce d’essai, pour remplir la liste.', prix: 2 * (6 + i * 4), radar: 200 + i * 150 })
  for (let i = 1; i <= 10; i++) PIECES.push({ id: `essai-arme-${i}`, sorte: 'arme', cran: 2, nom: `Canon d'essai ${i}`, dit: 'Une pièce d’essai, pour remplir la liste.', prix: 2 * (6 + i * 3), arme: { id: 'canon', cadence: n(i, 0.4, 2), degats: n(i + 1, 2, 12), portee: n(i + 2, 80, 200), vitesse: 170, vie: 1, dispersion: 0.05, guide: false } })
}

/** Ce qu'on a : les pièces possédées, celle montée à chaque emplacement, les outils et les armes montés (dans l'ordre : la première arme à gauche). */
export type Hangar = { possedees: string[]; montees: Record<Emplacement, string>; outils: string[]; armes: string[] }

export const pieceDe = (id: string): Piece | undefined => PIECES.find((p) => p.id === id)
export const piecesDe = (s: Sorte): Piece[] => PIECES.filter((p) => p.sorte === s)
const deSerie = (e: Emplacement): Piece => piecesDe(e)[0]
const listeDe = (h: Hangar, l: Liste): string[] => (l === 'arme' ? h.armes : h.outils)
const avecListe = (h: Hangar, l: Liste, ids: string[]): Hangar => (l === 'arme' ? { ...h, armes: ids } : { ...h, outils: ids })

export function hangarNeuf(): Hangar {
  const montees = {} as Record<Emplacement, string>
  for (const e of EMPLACEMENTS) montees[e] = deSerie(e).id
  return { possedees: [...EMPLACEMENTS.map((e) => deSerie(e).id), 'foreuse-1'], montees, outils: ['foreuse-1'], armes: [] }
}

export const possede = (h: Hangar, id: string): boolean => h.possedees.includes(id)
export const monteeA = (h: Hangar, e: Emplacement): Piece => pieceDe(h.montees[e]) ?? deSerie(e)
/** Combien de places la coque montée porte, pour les outils ou les armes. */
export const capacite = (h: Hangar, l: Liste): number => Math.min(PLACES_MAX, (l === 'arme' ? monteeA(h, 'coque').armes : monteeA(h, 'coque').outils) ?? 1)
/** Les pièces montées d'une liste, dans l'ordre. */
export const montes = (h: Hangar, l: Liste): Piece[] => listeDe(h, l).map((id) => pieceDe(id)).filter((p): p is Piece => p !== undefined)
export function peutAcheter(h: Hangar, credits: number, id: string): boolean {
  const p = pieceDe(id)
  return p !== undefined && !possede(h, id) && credits >= p.prix
}
/** Une pièce est montée : à son emplacement, ou dans sa liste. */
export const estMontee = (h: Hangar, id: string): boolean => {
  const p = pieceDe(id)
  if (p === undefined) return false
  return p.sorte === 'arme' || p.sorte === 'outil' ? listeDe(h, p.sorte).includes(id) : h.montees[p.sorte] === id
}

/** L'achat : la pièce passe aux possédées ET se monte si elle le peut ; les crédits paient. Rend les deux valeurs neuves, ou null si on ne peut pas. */
export function acheter(h: Hangar, credits: number, id: string): { hangar: Hangar; credits: number } | null {
  if (!peutAcheter(h, credits, id)) return null
  const p = pieceDe(id)!
  return { hangar: monter({ ...h, possedees: [...h.possedees, id] }, id), credits: credits - p.prix }
}

/** Les listes bornées à ce que la coque porte (une coque qui porte moins démonte les dernières pièces). */
const bornees = (h: Hangar): Hangar => ({ ...h, outils: h.outils.slice(0, capacite(h, 'outil')), armes: h.armes.slice(0, capacite(h, 'arme')) })

/**
 * Monter une pièce possédée : à son emplacement ; ou dans sa liste s'il reste une place — sinon, À LA PLACE d'une pièce
 * de la même famille (une foreuse chasse la foreuse). Une pièce qu'on n'a pas, ou une place qui manque sans
 * remplaçable, laisse le hangar tel quel.
 */
export function monter(h: Hangar, id: string): Hangar {
  const p = pieceDe(id)
  if (p === undefined || !possede(h, id)) return h
  if (p.sorte === 'arme' || p.sorte === 'outil') {
    const ids = listeDe(h, p.sorte)
    if (ids.includes(id)) return h
    if (ids.length < capacite(h, p.sorte)) return avecListe(h, p.sorte, [...ids, id])
    const i = p.famille === undefined ? -1 : ids.findIndex((x) => pieceDe(x)?.famille === p.famille)
    if (i < 0) return h
    return avecListe(h, p.sorte, ids.map((x, j) => (j === i ? id : x)))
  }
  return bornees({ ...h, montees: { ...h.montees, [p.sorte]: id } })
}
/** La pièce peut se monter (il y a une place, ou une pièce de sa famille à remplacer). */
export const peutMonter = (h: Hangar, id: string): boolean => monter(h, id) !== h

/** Démonter une pièce d'une liste (les emplacements à une pièce ne se vident pas : on y monte autre chose). */
export function demonter(h: Hangar, id: string): Hangar {
  const p = pieceDe(id)
  if (p === undefined || (p.sorte !== 'arme' && p.sorte !== 'outil')) return h
  const ids = listeDe(h, p.sorte)
  return ids.includes(id) ? avecListe(h, p.sorte, ids.filter((x) => x !== id)) : h
}

/** La meilleure foreuse montée (le plus fort débit), ou null : sans foreuse, on ne creuse pas — on chasse. */
export const foreuseMontee = (h: Hangar): Piece | null => montes(h, 'outil').filter((p) => p.famille === 'foreuse').sort((a, b) => (b.debit ?? 0) - (a.debit ?? 0))[0] ?? null
/** La portée du radar monté, ou 0. */
export const radarMonte = (h: Hangar): number => Math.max(0, ...montes(h, 'outil').map((p) => p.radar ?? 0))
export const armesMontees = (h: Hangar): Piece[] => montes(h, 'arme').filter((p) => p.arme !== undefined)

/**
 * La configuration du vaisseau d'après les pièces montées : des facteurs sur celle de série, la coque de la coque, la
 * meilleure foreuse (aucune : débit et portée nuls, l'aimant de série), le radar, les armes montées. Le rival n'en
 * profite pas (sa section et le `forage` partagé restent de série ; `foreuse` ne porte que sur le foreur du joueur).
 * Le POIDS divise la poussée et le frein du vide : lourd, on accélère moins et on glisse plus.
 */
export function configDuHangar(c: ConfigVaisseau, h: Hangar): ConfigVaisseau {
  const pr = monteeA(h, 'propulseur')
  const co = monteeA(h, 'coque')
  const fo = foreuseMontee(h)
  const poids = co.poids ?? 1
  return {
    ...c,
    poussee: (c.poussee * (pr.poussee ?? 1)) / poids,
    vitesseMax: c.vitesseMax * (pr.vitesseMax ?? 1),
    rotation: c.rotation * (pr.rotation ?? 1),
    frein: c.frein / poids,
    coque: co.pv ?? c.coque,
    bouclier: { ...c.bouclier, points: co.bouclier ?? 0 },
    foreuse: fo === null ? { debit: 0, portee: 0, aimant: c.foreuse.aimant } : { debit: c.foreuse.debit * (fo.debit ?? 1), portee: c.foreuse.portee * (fo.portee ?? 1), aimant: c.foreuse.aimant * (fo.aimant ?? 1) },
    radar: { portee: radarMonte(h) },
    armes: armesMontees(h).map((p) => p.arme!),
  }
}

/** Une jauge du panneau de description : son nom, la valeur de la pièce, le plus du catalogue (la barre pleine). */
export type Jauge = { nom: string; valeur: number; max: number; /** Une quantité entière (des points) : une CELLULE par unité plutôt qu'une barre (Keko). */ cellules?: boolean; /** Un simple nombre (des places d'outils, d'armes), ni barre ni cellules (Keko). */ nombre?: boolean }
/**
 * LES JAUGES d'une pièce (Keko : « un vrai panneau de description : des jauges vitesse / accélération / maniabilité
 * pour le propulseur, le nombre d'armes portables par la coque, une jauge de blindage, de bouclier et de poids ») —
 * chaque barre est pleine au maximum du catalogue, pour comparer d'un coup d'œil.
 */
export function jaugesDe(p: Piece): Jauge[] {
  const memes = piecesDe(p.sorte)
  const max = (f: (q: Piece) => number): number => Math.max(...memes.map(f))
  if (p.sorte === 'propulseur') {
    return [
      { nom: 'Acceleration', valeur: p.poussee ?? 1, max: max((q) => q.poussee ?? 1) },
      { nom: 'Vitesse', valeur: p.vitesseMax ?? 1, max: max((q) => q.vitesseMax ?? 1) },
      { nom: 'Maniabilite', valeur: p.rotation ?? 1, max: max((q) => q.rotation ?? 1) },
    ]
  }
  if (p.sorte === 'coque') {
    return [
      // blindage et bouclier sur HUIT cellules, un plafond fixe pour l'instant (Keko) ; le poids en troisième ligne (Keko)
      { nom: 'Blindage', valeur: p.pv ?? 0, max: 8, cellules: true },
      { nom: 'Bouclier', valeur: p.bouclier ?? 0, max: 8, cellules: true },
      { nom: 'Poids', valeur: p.poids ?? 1, max: max((q) => q.poids ?? 1) },
      { nom: 'Outils', valeur: p.outils ?? 1, max: max((q) => q.outils ?? 1), nombre: true },
      { nom: 'Armes', valeur: p.armes ?? 1, max: max((q) => q.armes ?? 1), nombre: true },
    ]
  }
  if (p.sorte === 'outil') {
    if (p.radar !== undefined) return [{ nom: 'Detection', valeur: p.radar, max: max((q) => q.radar ?? 0) }]
    const foreuses = memes.filter((q) => q.famille === 'foreuse')
    const maxF = (f: (q: Piece) => number): number => Math.max(...foreuses.map(f))
    return [
      { nom: 'Forage', valeur: p.debit ?? 1, max: maxF((q) => q.debit ?? 1) },
      { nom: 'Portee', valeur: p.portee ?? 1, max: maxF((q) => q.portee ?? 1) },
      { nom: 'Aimant', valeur: p.aimant ?? 1, max: maxF((q) => q.aimant ?? 1) },
    ]
  }
  // une arme : cadence (coups par seconde), dégâts du coup, portée (Keko)
  const a = p.arme!
  return [
    { nom: 'Degats', valeur: a.degats, max: max((q) => q.arme!.degats) },
    { nom: 'Cadence', valeur: 1 / a.cadence, max: max((q) => 1 / q.arme!.cadence) },
    { nom: 'Portee', valeur: a.portee, max: max((q) => q.arme!.portee) },
  ]
}

/**
 * LES FICHES DES MINERAIS, pour l'entrepôt (Keko : « une petite description du minerai sélectionné et son prix en
 * crédits — on ajoute la monnaie du jeu : les crédits ») : le nom, deux lignes, et ce que l'entrepôt PAIE la pépite,
 * en crédits. *Les prix sont de moi, à rejuger* : l'or vaut quatre fer, le cristal douze.
 */
export const FICHES_MINERAI: Record<Minerai, { nom: string; dit: string; credits: number }> = {
  fer: { nom: 'Fer', dit: 'Le metal des roches grises, partout autour des stations. Commun, mais tout commence par lui.', credits: 2 },
  or: { nom: 'Or', dit: 'Dans la roche ocre, loin des stations. Rare, lourd, recherche.', credits: 8 },
  cristal: { nom: 'Cristal', dit: 'Dans la roche bleutee, aux confins. Tres rare : il scintille sur ses veines.', credits: 25 },
}

/** Vendre tout un minerai du trésor à l'entrepôt : rend le trésor et les crédits neufs (rien à vendre : les mêmes valeurs). */
export function vendre(tresor: Cargaison, credits: number, k: Minerai): { tresor: Cargaison; credits: number } {
  const n = tresor[k]
  if (n <= 0) return { tresor, credits }
  return { tresor: { ...tresor, [k]: 0 }, credits: credits + n * FICHES_MINERAI[k].credits }
}

/** Relit les crédits gardés : un entier positif, zéro sinon. */
export const lireCredits = (brut: unknown): number => (typeof brut === 'number' && Number.isFinite(brut) && brut > 0 ? Math.floor(brut) : 0)

/**
 * Relit un hangar gardé, sans confiance : les pièces inconnues tombent, celles de série sont toujours possédées, une
 * pièce montée qu'on n'a pas (ou au mauvais emplacement) redevient celle de série, les listes se bornent à ce que la
 * coque porte, sans doublon. Un hangar d'avant les outils (sa foreuse dans `montees.foreuse`) la retrouve dans ses outils.
 */
export function lireHangar(brut: unknown): Hangar {
  const h = hangarNeuf()
  if (typeof brut !== 'object' || brut === null) return h
  const b = brut as { possedees?: unknown; montees?: unknown; outils?: unknown; armes?: unknown }
  if (Array.isArray(b.possedees)) for (const id of b.possedees) if (typeof id === 'string' && pieceDe(id) !== undefined && !possede(h, id)) h.possedees.push(id)
  const mo = typeof b.montees === 'object' && b.montees !== null ? (b.montees as Record<string, unknown>) : {}
  for (const e of EMPLACEMENTS) {
    const id = mo[e]
    if (typeof id === 'string' && possede(h, id) && pieceDe(id)?.sorte === e) h.montees[e] = id
  }
  const lire = (l: Liste, brute: unknown): void => {
    const ids: string[] = []
    if (Array.isArray(brute)) for (const id of brute) if (typeof id === 'string' && possede(h, id) && pieceDe(id)?.sorte === l && !ids.includes(id) && ids.length < capacite(h, l)) ids.push(id)
    if (l === 'arme') h.armes = ids
    else h.outils = ids
  }
  lire('arme', b.armes)
  if (Array.isArray(b.outils)) lire('outil', b.outils)
  else if (typeof mo.foreuse === 'string' && possede(h, mo.foreuse) && pieceDe(mo.foreuse)?.sorte === 'outil') h.outils = [mo.foreuse]
  return h
}

/** Relit un trésor gardé : des entiers positifs par minerai, zéro sinon. */
export function lireTresor(brut: unknown): Cargaison {
  const t = cargaisonVide()
  if (typeof brut !== 'object' || brut === null) return t
  const b = brut as Record<string, unknown>
  for (const k of MINERAIS) {
    const n = b[k]
    if (typeof n === 'number' && Number.isFinite(n) && n > 0) t[k] = Math.floor(n)
  }
  return t
}

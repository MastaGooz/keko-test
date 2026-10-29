/**
 * LES LIEUX — où les decks jouent. Keko (concept du 21/10) : « chaque deck est
 * assigné à un lieu et y joue en automatique ; chaque lieu a une jauge : le
 * deck doit générer X ressources pour déclencher une récompense ». Tranché le
 * 28/10 :
 *
 * - **la puissance ne remplit QUE la jauge** — elle n'est plus une monnaie ;
 * - **une jauge pleine rend de l'OR** : *le lieu convertit la puissance en or* ;
 * - **un lieu ouvert au départ, les autres s'achètent** (en or) ;
 * - **chaque lieu favorise un rôle** (un bonus de tag simple) : la Taverne
 *   n'en a pas, la Mine aime les soutiens, l'Arène la mêlée ;
 * - trois lieux, un par deck (`DECKS_MAX`).
 *
 * *Les chiffres sont de moi, à rejuger* (Keko : « oui, de toi ») : une jauge
 * de 100 rend 10 or, un lieu coûte 150 or.
 *
 * **LES PALIERS DE L'HEURE** (Keko, 28/10) : chaque jauge remplie dans l'heure
 * rend plus que la précédente (`hausse` par palier), et tout repart du premier
 * palier à l'heure pleine (`FENETRE`, calée sur l'horloge). *La récompense
 * dépend de la VITESSE du deck, pas du temps passé* : « certains loots ne
 * devraient être accessibles qu'aux joueurs puissants ; avec le système
 * actuel, n'importe quel joueur peut finir un lieu avec suffisamment de
 * temps ». **Hors ligne, chaque heure compte entière** (Keko : « oui, on
 * continue en l'absence du joueur ») : chaque main tombe dans SA fenêtre.
 *
 * **LE COFFRE DU LIEU** (Keko, 29/10 : « plutôt qu'un loot auto, … on
 * accumule tout dedans et quand le joueur clique dessus … chaque type de loot
 * est looté ») : une jauge pleine verse son or DANS LE COFFRE de son lieu
 * (`Butin`), et c'est l'ouvrir qui le donne (`ouvrirLeCoffre`). Le butin n'a
 * qu'un type pour l'instant, l'or.
 *
 * **Pur** : l'or, les lieux ouverts et les jauges sont un état qu'on lit sans
 * confiance (`lireLieux`) ; le temps ne passe pas ici, c'est le deck qui joue
 * (`decksAJour`) et sa puissance qui arrive (`remplirLaJauge`).
 */
import type { RoleCarte } from './types.ts'
import type { ValeurDeCarte } from './deck.ts'

export interface Lieu {
  readonly id: string
  readonly nom: string
  /** Le rôle que le lieu favorise, et ce qu'il ajoute à chaque carte de ce rôle jouée là. */
  readonly bonus: { readonly role: RoleCarte; readonly plus: number } | null
  /** Ce qu'il coûte à ouvrir, en or ; zéro : ouvert dès le départ. */
  readonly prix: number
  /** La puissance qu'il faut pour remplir sa jauge… */
  readonly jauge: number
  /** … et l'or qu'elle rend, pleine, au premier palier de l'heure… */
  readonly or: number
  /** … plus ceci par palier déjà franchi dans l'heure. */
  readonly hausse: number
}

/** LA FENÊTRE DES PALIERS : une heure, calée sur l'horloge (14 h, 15 h…). */
export const FENETRE = 60 * 60 * 1000

export const LIEUX: readonly Lieu[] = [
  { id: 'taverne', nom: 'La Taverne', bonus: null, prix: 0, jauge: 100, or: 10, hausse: 1 },
  { id: 'mine', nom: 'La Mine gobeline', bonus: { role: 'soutien', plus: 1 }, prix: 150, jauge: 100, or: 10, hausse: 1 },
  { id: 'arene', nom: "L'Arène", bonus: { role: 'melee', plus: 1 }, prix: 150, jauge: 100, or: 10, hausse: 1 },
]

export const IDS_LIEUX: readonly string[] = LIEUX.map((l) => l.id)

export function lieuDe(id: string | undefined): Lieu | undefined {
  return id === undefined ? undefined : LIEUX.find((l) => l.id === id)
}

/** Combien de jauges un lieu a remplies dans quelle fenêtre (son numéro : `floor(t / FENETRE)`). */
export interface Palier {
  readonly fenetre: number
  readonly n: number
}

/** CE QU'UN COFFRE ACCUMULE, type par type (l'or seul pour l'instant). */
export interface Butin {
  readonly or: number
}

/** Ce que le joueur a : son or, les lieux ouverts, la puissance déjà dans chaque jauge, les paliers de l'heure, les coffres. */
export interface EtatLieux {
  readonly or: number
  readonly ouverts: readonly string[]
  readonly jauges: Readonly<Record<string, number>>
  readonly paliers: Readonly<Record<string, Palier>>
  readonly coffres: Readonly<Record<string, Butin>>
}

export function lieuxNeufs(): EtatLieux {
  return { or: 0, ouverts: LIEUX.filter((l) => l.prix === 0).map((l) => l.id), jauges: {}, paliers: {}, coffres: {} }
}

/** Ce qui attend dans le coffre d'un lieu (vide : zéro partout). */
export function coffreDe(e: EtatLieux, id: string): Butin {
  return e.coffres[id] ?? { or: 0 }
}

/** OUVRIR LE COFFRE : son butin passe au joueur, le coffre est vidé. Vide ou inconnu : rien ne change. */
export function ouvrirLeCoffre(e: EtatLieux, id: string): { etat: EtatLieux; butin: Butin } {
  const butin = coffreDe(e, id)
  if (butin.or <= 0) return { etat: e, butin: { or: 0 } }
  const coffres = { ...e.coffres }
  delete coffres[id]
  return { etat: { ...e, or: e.or + butin.or, coffres }, butin }
}

export const fenetreDe = (t: number): number => Math.floor(t / FENETRE)

/** Les jauges déjà remplies par ce lieu dans la fenêtre de `t` (zéro : une heure neuve). */
export function palierDe(e: EtatLieux, id: string, t: number): number {
  const p = e.paliers[id]
  return p !== undefined && p.fenetre === fenetreDe(t) ? p.n : 0
}

/** L'or de la PROCHAINE jauge pleine, après `n` remplies dans l'heure. */
export function orDuPalier(lieu: Lieu, n: number): number {
  return lieu.or + lieu.hausse * n
}

/**
 * UN NOMBRE EN COURT, pour le texte sous la jauge (Keko : « abréger les grands
 * nombres ») : tel quel sous mille, puis en milliers (k) ou en millions (M),
 * une décimale sous dix (« 1,2k »), aucune au-dessus (« 12k »). *Arrondi vers
 * le bas* : une jauge presque pleine ne s'affiche jamais pleine.
 */
export function nombreCourt(n: number): string {
  if (n < 1000) return String(Math.floor(n))
  for (const [unite, lettre] of [[1e6, 'M'], [1e3, 'k']] as const) {
    if (n < unite) continue
    const v = n / unite
    return v < 10 ? `${(Math.floor(v * 10) / 10).toString().replace('.', ',')}${lettre}` : `${Math.floor(v)}${lettre}`
  }
  return String(n)
}

/** Dans combien de millisecondes les paliers repartent du premier. */
export function remiseDans(t: number): number {
  return (fenetreDe(t) + 1) * FENETRE - t
}

export function estOuvert(e: EtatLieux, id: string): boolean {
  return e.ouverts.includes(id)
}

/**
 * LA PUISSANCE JOUÉE DANS UN LIEU, À L'INSTANT `quand`, REMPLIT SA JAUGE ;
 * chaque fois qu'elle est pleine, elle rend l'or de son palier dans l'heure
 * de `quand` (`orDuPalier`) — DANS LE COFFRE du lieu —, monte d'un palier, et
 * repart de ce qui dépasse. Rend l'état neuf, l'or gagné et le nombre de jauges remplies. Un lieu fermé
 * ou inconnu ne prend rien. *Les mains se versent dans l'ordre du temps.*
 */
export function remplirLaJauge(e: EtatLieux, id: string, puissance: number, quand: number): { etat: EtatLieux; or: number; pleines: number } {
  const lieu = lieuDe(id)
  if (lieu === undefined || !estOuvert(e, id) || !(puissance > 0)) return { etat: e, or: 0, pleines: 0 }
  const total = (e.jauges[id] ?? 0) + Math.floor(puissance)
  const pleines = Math.floor(total / lieu.jauge)
  if (pleines === 0) return { etat: { ...e, jauges: { ...e.jauges, [id]: total } }, or: 0, pleines: 0 }
  const avant = palierDe(e, id, quand)
  // Les paliers avant…+pleines-1 : n·or + hausse·(avant + … + avant+pleines-1).
  const or = pleines * lieu.or + lieu.hausse * (pleines * avant + (pleines * (pleines - 1)) / 2)
  return {
    etat: {
      ...e,
      coffres: { ...e.coffres, [id]: { or: coffreDe(e, id).or + or } },
      jauges: { ...e.jauges, [id]: total - pleines * lieu.jauge },
      paliers: { ...e.paliers, [id]: { fenetre: fenetreDe(quand), n: avant + pleines } },
    },
    or,
    pleines,
  }
}

/** Ouvre un lieu contre son prix ; déjà ouvert, inconnu ou trop cher : rien ne change. */
export function ouvrirLeLieu(e: EtatLieux, id: string): EtatLieux {
  const lieu = lieuDe(id)
  if (lieu === undefined || estOuvert(e, id) || e.or < lieu.prix) return e
  return { ...e, or: e.or - lieu.prix, ouverts: IDS_LIEUX.filter((x) => x === id || e.ouverts.includes(x)) }
}

/** Pose le solde d'or (le banc `&or=N`) — borné à zéro, entier. */
export function avecOr(e: EtatLieux, or: number): EtatLieux {
  const n = Number.isFinite(or) ? Math.max(0, Math.floor(or)) : 0
  return n === e.or ? e : { ...e, or: n }
}

/**
 * CE QUE VAUT UNE CARTE JOUÉE DANS CE LIEU : sa puissance, plus le bonus du
 * lieu si elle a le rôle qu'il favorise. Le rôle vient du catalogue, injecté.
 */
export function valeurDansLeLieu(valeur: ValeurDeCarte, roleDe: (id: string) => RoleCarte | undefined, lieu: Lieu | undefined): ValeurDeCarte {
  const b = lieu?.bonus ?? null
  if (b === null) return valeur
  return (e) => valeur(e) + (roleDe(e.id) === b.role ? b.plus : 0)
}

/** Relit l'état gardé, sans confiance : abîmé, il repart neuf ; le lieu gratuit est toujours ouvert. */
export function lireLieux(brut: unknown): EtatLieux {
  const neuf = lieuxNeufs()
  if (typeof brut !== 'object' || brut === null) return neuf
  const o = brut as Record<string, unknown>
  const or = typeof o.or === 'number' && Number.isFinite(o.or) ? Math.max(0, Math.floor(o.or)) : 0
  const lus = Array.isArray(o.ouverts) ? (o.ouverts as unknown[]).filter((x): x is string => typeof x === 'string') : []
  const ouverts = IDS_LIEUX.filter((id) => neuf.ouverts.includes(id) || lus.includes(id))
  const jauges: Record<string, number> = {}
  const j = typeof o.jauges === 'object' && o.jauges !== null ? (o.jauges as Record<string, unknown>) : {}
  for (const l of LIEUX) {
    const v = j[l.id]
    if (typeof v === 'number' && Number.isFinite(v) && v > 0) jauges[l.id] = Math.min(Math.floor(v), l.jauge - 1)
  }
  const paliers: Record<string, Palier> = {}
  const p = typeof o.paliers === 'object' && o.paliers !== null ? (o.paliers as Record<string, unknown>) : {}
  for (const l of LIEUX) {
    const v = p[l.id] as Record<string, unknown> | null | undefined
    if (typeof v !== 'object' || v === null) continue
    const { fenetre, n } = v
    if (Number.isInteger(fenetre) && Number.isInteger(n) && (n as number) > 0) paliers[l.id] = { fenetre: fenetre as number, n: n as number }
  }
  const coffres: Record<string, Butin> = {}
  const c = typeof o.coffres === 'object' && o.coffres !== null ? (o.coffres as Record<string, unknown>) : {}
  for (const l of LIEUX) {
    const v = c[l.id] as Record<string, unknown> | null | undefined
    if (typeof v === 'object' && v !== null && typeof v.or === 'number' && Number.isFinite(v.or) && v.or >= 1) coffres[l.id] = { or: Math.floor(v.or) }
  }
  return { or, ouverts, jauges, paliers, coffres }
}

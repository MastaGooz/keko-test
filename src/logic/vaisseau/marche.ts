/**
 * LE MARCHÉ DES MINERAIS (Keko, 11/11 : « changer le bouton vendre pour qu'il ouvre un panneau plutôt que tout vendre
 * d'un coup : vendre une quantité, une courbe de prix (ordonnée = prix, abscisse = temps), vendre au prix de marché ou
 * poser un prix personnalisé, qui sera déclenché potentiellement »).
 *
 * LE COURS d'un minerai est UNE FONCTION DU TEMPS, rien n'est gardé : son prix de base (la fiche du minerai) porté par
 * une houle lente, une vague plus courte et un petit bruit, par PAS d'une minute. Le temps est INJECTÉ (la page donne
 * l'instant) : l'appareil éteint, le marché a quand même bougé, et la courbe d'hier se recalcule telle qu'elle était.
 *
 * VENDRE AU COURS : tout de suite, au prix du moment. POSER UN ORDRE : une quantité à un prix fixé — le minerai quitte
 * l'entrepôt (il est réservé), et l'ordre se règle AU PRIX FIXÉ dès qu'un pas du cours l'atteint, même pendant qu'on
 * ne joue pas ; on peut l'annuler, le minerai revient. Un ordre par minerai.
 *
 * *Tous les chiffres sont de moi, à rejuger* : le pas, les amplitudes, le plafond d'un ordre. Les prix sont au dixième
 * de crédit ; un gain s'arrondit vers le bas.
 */
import { MINERAIS, tire, type Cargaison, type Minerai } from './jeu.ts'
import { FICHES_MINERAI } from './hangar.ts'

export const MARCHE = {
  /** Un pas du cours, en millisecondes : le prix change à chaque pas. */
  pas: 60_000,
  /** Combien de pas la courbe montre (le dernier est le cours du moment). */
  historique: 40,
  /** La houle lente : sa période en pas, sa part du prix de base. */
  lente: { periode: 24, part: 0.25 },
  /** La vague courte. */
  courte: { periode: 6, part: 0.12 },
  /** Le bruit d'un pas à l'autre. */
  bruit: 0.04,
  /** Le plus haut prix qu'un ordre puisse fixer, en parts du prix de base (le cours ne monte jamais plus haut que 1 + les trois parts). */
  plafond: 1.45,
} as const

/** Le pas où tombe un instant. */
export const pasDe = (instant: number): number => Math.floor(instant / MARCHE.pas)
const dixieme = (x: number): number => Math.round(x * 10) / 10

/** Un bruit lisse dans [−1, 1] : des valeurs tirées aux nœuds entiers, raccordées en douceur. */
function houle(x: number, sel: number): number {
  const i = Math.floor(x)
  const f = x - i
  const u = f * f * (3 - 2 * f)
  const a = tire(i, sel, 71) * 2 - 1
  const b = tire(i + 1, sel, 71) * 2 - 1
  return a + (b - a) * u
}

/** LE COURS d'un minerai à un pas : au dixième de crédit, jamais sous un dixième. */
export function coursAuPas(k: Minerai, pas: number): number {
  const sel = MINERAIS.indexOf(k) + 1
  const base = FICHES_MINERAI[k].credits
  const part = MARCHE.lente.part * houle(pas / MARCHE.lente.periode, sel) + MARCHE.courte.part * houle(pas / MARCHE.courte.periode, sel + 10) + MARCHE.bruit * (tire(pas, sel, 72) * 2 - 1)
  return Math.max(0.1, dixieme(base * (1 + part)))
}
export const coursA = (k: Minerai, instant: number): number => coursAuPas(k, pasDe(instant))
/** La courbe : les derniers cours, du plus ancien au cours du moment. */
export function historiqueDe(k: Minerai, instant: number): number[] {
  const p = pasDe(instant)
  return Array.from({ length: MARCHE.historique }, (_, i) => coursAuPas(k, p - (MARCHE.historique - 1 - i)))
}
/** Le plus haut prix qu'un ordre puisse fixer. */
export const prixPlafond = (k: Minerai): number => dixieme(FICHES_MINERAI[k].credits * MARCHE.plafond)
/** Ce que rapportent `q` pépites à ce prix : des crédits entiers, arrondis vers le bas. */
export const gainDe = (q: number, prix: number): number => Math.floor(q * prix + 1e-6)

/** Un ordre de vente posé : tant de pépites (déjà sorties de l'entrepôt), à ce prix. */
export type Ordre = { minerai: Minerai; quantite: number; prix: number; poseA: number }
/** Les ordres en attente, et l'instant jusqu'où le marché a été réglé. */
export type Marche = { ordres: Ordre[]; vuA: number }
export const marcheNeuf = (instant: number): Marche => ({ ordres: [], vuA: instant })
export const ordreDe = (m: Marche, k: Minerai): Ordre | undefined => m.ordres.find((o) => o.minerai === k)

const quantiteValable = (tresor: Cargaison, k: Minerai, q: number): boolean => Number.isInteger(q) && q >= 1 && q <= tresor[k]

/** Vendre `q` pépites AU COURS du moment. Rend le trésor et les crédits neufs, ou null (rien à vendre, trop demandé). */
export function vendreAuCours(tresor: Cargaison, credits: number, k: Minerai, q: number, instant: number): { tresor: Cargaison; credits: number } | null {
  if (!quantiteValable(tresor, k, q)) return null
  return { tresor: { ...tresor, [k]: tresor[k] - q }, credits: credits + gainDe(q, coursA(k, instant)) }
}

/** Poser un ordre : `q` pépites à `prix` (au dixième, entre un dixième et le plafond). Le minerai quitte le trésor. Null si un ordre attend déjà pour ce minerai, ou si la demande ne tient pas. */
export function poserUnOrdre(m: Marche, tresor: Cargaison, k: Minerai, q: number, prix: number, instant: number): { marche: Marche; tresor: Cargaison } | null {
  const p = dixieme(prix)
  if (ordreDe(m, k) !== undefined || !quantiteValable(tresor, k, q) || !(p >= 0.1) || p > prixPlafond(k)) return null
  return { marche: { ...m, ordres: [...m.ordres, { minerai: k, quantite: q, prix: p, poseA: instant }] }, tresor: { ...tresor, [k]: tresor[k] - q } }
}

/** Annuler l'ordre d'un minerai : ses pépites reviennent au trésor (pas d'ordre : rien ne change). */
export function annulerLOrdre(m: Marche, tresor: Cargaison, k: Minerai): { marche: Marche; tresor: Cargaison } {
  const o = ordreDe(m, k)
  if (o === undefined) return { marche: m, tresor }
  return { marche: { ...m, ordres: m.ordres.filter((x) => x !== o) }, tresor: { ...tresor, [k]: tresor[k] + o.quantite } }
}

/**
 * RÉGLER LE MARCHÉ jusqu'à `instant` : chaque ordre dont le prix a été atteint par le cours à un pas écoulé depuis
 * qu'on a regardé (ou depuis sa pose) est vendu AU PRIX FIXÉ. Rend le marché, les crédits, et les ordres vendus.
 * (Au plus une semaine de pas est relue : au-delà, on ne regarde que la dernière.)
 */
export function reglerLeMarche(m: Marche, credits: number, instant: number): { marche: Marche; credits: number; vendus: Ordre[] } {
  const fin = pasDe(instant)
  const vendus: Ordre[] = []
  let c = credits
  for (const o of m.ordres) {
    // (un ordre posé depuis le dernier regard est jugé dès SON pas ; un plus ancien, à partir du pas qui suit ce regard)
    const debut = Math.max(o.poseA >= m.vuA ? pasDe(o.poseA) : pasDe(m.vuA) + 1, fin - 7 * 24 * 60)
    for (let p = debut; p <= fin; p++) {
      if (coursAuPas(o.minerai, p) < o.prix) continue
      c += gainDe(o.quantite, o.prix)
      vendus.push(o)
      break
    }
  }
  return { marche: { ordres: m.ordres.filter((o) => !vendus.includes(o)), vuA: Math.max(m.vuA, instant) }, credits: c, vendus }
}

/** Relit un marché gardé, sans confiance : des ordres bien formés, un par minerai ; un instant de lecture qui n'est pas dans le futur. */
export function lireMarche(brut: unknown, instant: number): Marche {
  const m = marcheNeuf(instant)
  if (typeof brut !== 'object' || brut === null) return m
  const b = brut as { ordres?: unknown; vuA?: unknown }
  if (typeof b.vuA === 'number' && Number.isFinite(b.vuA) && b.vuA >= 0 && b.vuA <= instant) m.vuA = b.vuA
  if (Array.isArray(b.ordres)) {
    for (const o of b.ordres as Record<string, unknown>[]) {
      if (typeof o !== 'object' || o === null) continue
      const k = MINERAIS.find((x) => x === o.minerai)
      const q = o.quantite
      const prix = o.prix
      const poseA = o.poseA
      if (k === undefined || ordreDe(m, k) !== undefined) continue
      if (typeof q !== 'number' || !Number.isInteger(q) || q < 1) continue
      if (typeof prix !== 'number' || !(prix >= 0.1) || prix > prixPlafond(k)) continue
      m.ordres.push({ minerai: k, quantite: q, prix: dixieme(prix), poseA: typeof poseA === 'number' && Number.isFinite(poseA) ? Math.min(poseA, instant) : instant })
    }
  }
  return m
}

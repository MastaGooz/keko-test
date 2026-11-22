/**
 * LE JEU À DISTANCE, CE QUI EN EST PUR (Keko, 22/11 : « je veux pouvoir jouer à distance avec mon ami, moi sur le
 * téléphone et lui sur le sien, ou moi sur mon PC et lui sur son téléphone ») : L'HÔTE fait tourner le monde et en
 * envoie l'état ; L'INVITÉ le reçoit, le voit depuis son vaisseau, et le fait avancer entre deux états. Ici : un monde
 * (ou une configuration) en texte et retour — ses nombres arrondis, ses `Map` et ses `Set`, ses infinis —, le monde vu
 * depuis le second pilote, l'équipage défait. Le transport (PeerJS) est dans `ui/vaisseau/reseau.ts`.
 */
import { prendreLaMain, type Monde } from './jeu.ts'

/** Les décimales gardées des nombres qui ne sont pas entiers (2 : le centième de pixel, de seconde). */
const DECIMALES = 100

/** En texte : les nombres arrondis au centième (les entiers intacts), les `Map`, les `Set` et les non-finis marqués. */
export function versTexte(x: unknown): string {
  return JSON.stringify(x, function (this: unknown, _k: string, v: unknown): unknown {
    if (typeof v === 'number') {
      if (!Number.isFinite(v)) return { '@n': String(v) }
      return Number.isInteger(v) ? v : Math.round(v * DECIMALES) / DECIMALES
    }
    if (v instanceof Map) return { '@m': [...v] }
    if (v instanceof Set) return { '@s': [...v] }
    return v
  })
}

/** Le texte de `versTexte`, relu. */
export function depuisTexte<T>(s: string): T {
  return JSON.parse(s, (_k: string, v: unknown): unknown => {
    if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
      const o = v as Record<string, unknown>
      if ('@n' in o) return Number(o['@n'])
      if ('@m' in o) return new Map(o['@m'] as [unknown, unknown][])
      if ('@s' in o) return new Set(o['@s'] as unknown[])
    }
    return v
  }) as T
}

/**
 * L'ORDRE DE L'ÉQUIPAGE VU DU PILOTE `k` : lui d'abord, puis les autres dans leur ordre (l'hôte, le 0, en tête) — la
 * place `j` de cette vue est celle du pilote `ordre[j]` chez l'hôte.
 */
export const ordreVuDu = (n: number, k: number): number[] => [k, ...Array.from({ length: n }, (_, i) => i).filter((i) => i !== k)]

/**
 * LE MONDE VU DEPUIS LE PILOTE `k` (un invité) : il prend le monde et devient le premier, les autres suivent dans leur
 * ordre (voir `ordreVuDu`) ; les pépites aimantées par l'un vont toujours au même vaisseau.
 */
export function vuDu(m: Monde, k: number): void {
  const eq = m.equipage
  if (eq === undefined || k <= 0 || k >= eq.pilotes.length) return
  prendreLaMain(m, k)
  const ordre = ordreVuDu(eq.pilotes.length, k)
  eq.pilotes = ordre.map((i) => eq.pilotes[i])
  eq.actif = 0
  for (const p of m.pepites) if (p.par !== undefined) p.par = ordre.indexOf(p.par)
}
/** Le monde vu du second pilote (voir `vuDu`). */
export const vuDuSecond = (m: Monde): void => vuDu(m, 1)

/** LE PILOTE `k` QUITTE L'ÉQUIPAGE (un invité parti) : ceux d'après remontent d'une place ; seul, le premier garde le monde. */
export function retirerUnPilote(m: Monde, k: number): void {
  const eq = m.equipage
  if (eq === undefined || k <= 0 || k >= eq.pilotes.length) return
  prendreLaMain(m, 0)
  eq.pilotes.splice(k, 1)
  for (const p of m.pepites) {
    if (p.par === k) delete p.par
    else if (p.par !== undefined && p.par > k) p.par -= 1
  }
  if (eq.pilotes.length <= 1) retirerLesPilotes(m)
}

/** L'ÉQUIPAGE DÉFAIT (l'invité est parti) : le premier pilote garde le monde, seul. */
export function retirerLesPilotes(m: Monde): void {
  if (m.equipage === undefined) return
  prendreLaMain(m, 0)
  delete m.equipage
  for (const p of m.pepites) delete p.par
}

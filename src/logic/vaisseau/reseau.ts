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
 * LE MONDE VU DEPUIS LE SECOND PILOTE (l'invité) : il prend le monde, et l'équipage est retourné — il devient le premier,
 * l'hôte le second ; les pépites aimantées par l'un vont toujours au même vaisseau.
 */
export function vuDuSecond(m: Monde): void {
  const eq = m.equipage
  if (eq === undefined || eq.pilotes.length < 2) return
  prendreLaMain(m, 1)
  eq.pilotes = [eq.pilotes[1], eq.pilotes[0], ...eq.pilotes.slice(2)]
  eq.actif = 0
  for (const p of m.pepites) if (p.par === 0 || p.par === 1) p.par = 1 - p.par
}

/** L'ÉQUIPAGE DÉFAIT (l'invité est parti) : le premier pilote garde le monde, seul. */
export function retirerLesPilotes(m: Monde): void {
  if (m.equipage === undefined) return
  prendreLaMain(m, 0)
  delete m.equipage
  for (const p of m.pepites) delete p.par
}

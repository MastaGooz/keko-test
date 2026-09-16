/**
 * Sauvegarde : (dé)sérialisation pure + port de persistance.
 * logic/ ne touche pas à localStorage ; l'implémentation du port
 * est fournie par ui/ (voir src/ui/storage.ts).
 */
import type { GameState } from './state.ts'
import { STATE_VERSION, createState } from './state.ts'

export const SAVE_KEY = 'keko-test:save'

/** Port de persistance minimal, implémenté côté ui/. */
export type StoragePort = {
  read: (key: string) => string | null
  write: (key: string, value: string) => void
}

export function serialize(state: GameState): string {
  return JSON.stringify(state)
}

/** Tolérant : renvoie null si la sauvegarde est absente, illisible ou périmée. */
export function deserialize(raw: string | null): GameState | null {
  if (raw === null) return null

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return null
  }

  if (typeof parsed !== 'object' || parsed === null) return null
  const candidate = parsed as Partial<GameState>
  if (candidate.version !== STATE_VERSION) return null
  if (typeof candidate.seed !== 'number' || typeof candidate.taps !== 'number') return null

  return { version: STATE_VERSION, seed: candidate.seed, taps: candidate.taps }
}

export function save(port: StoragePort, state: GameState): void {
  port.write(SAVE_KEY, serialize(state))
}

/** Charge la sauvegarde, ou crée un état neuf avec `fallbackSeed`. */
export function load(port: StoragePort, fallbackSeed: number): GameState {
  return deserialize(port.read(SAVE_KEY)) ?? createState(fallbackSeed)
}

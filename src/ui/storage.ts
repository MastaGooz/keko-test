/** Implémentation navigateur du StoragePort de logic/. */
import type { StoragePort } from '../logic/storage.ts'

/** localStorage peut lever (mode privé, cookies bloqués) : on dégrade en silence. */
export const localStoragePort: StoragePort = {
  read(key) {
    try {
      return localStorage.getItem(key)
    } catch {
      return null
    }
  },
  write(key, value) {
    try {
      localStorage.setItem(key, value)
    } catch {
      /* sauvegarde indisponible : on continue sans persistance */
    }
  },
}

/**
 * LE CERNE CALCULÉ HORS DU FIL PRINCIPAL : voir `cerne-calcul.ts`. Une
 * demande par message, le résultat rendu avec son numéro, ses pixels
 * transférés (pas copiés).
 */
import { calculerCerne, type DemandeDeCerne } from './cerne-calcul.ts'

self.onmessage = (e: MessageEvent<{ id: number; demande: DemandeDeCerne }>): void => {
  const { id, demande } = e.data
  const pixels = calculerCerne(demande)
  ;(self as unknown as Worker).postMessage({ id, pixels }, [pixels.buffer])
}

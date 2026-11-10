/**
 * LES SONS CALCULÉS HORS DU FIL PRINCIPAL : voir `synthe.ts`. Un message donne la fréquence d'échantillonnage du
 * contexte ; chaque son revient dès qu'il est prêt, ses deux canaux transférés (pas copiés) — ceux de la base
 * d'abord, puisque c'est là qu'on commence.
 */
import { NOMS_DES_SONS, synthetiser, variantesDe } from './synthe.ts'

self.onmessage = (e: MessageEvent<{ sr: number }>): void => {
  const base = NOMS_DES_SONS.indexOf('clic')
  for (const son of [...NOMS_DES_SONS.slice(base), ...NOMS_DES_SONS.slice(0, base)]) {
    for (let variante = 0; variante < variantesDe(son); variante++) {
      const { g, d } = synthetiser(son, e.data.sr, variante)
      ;(self as unknown as Worker).postMessage({ son, variante, g, d }, [g.buffer, d.buffer])
    }
  }
}

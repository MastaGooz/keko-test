/**
 * CE QUE PARTAGENT LES DEUX JEUX DES ENVAHISSEURS (`?invaders`, `?tourelle`) :
 * les sprites tirés du générateur d'icônes, rendus une fois en image, et le
 * record gardé sur l'appareil.
 */
import { genererDessin, type Famille, type Race } from '../../logic/procgen/index.ts'
import { svgTexte } from '../procgen/svg.ts'

/** Un dessin engendré, rendu une fois en image (`null` tant qu'il charge). */
const sprites = new Map<string, HTMLImageElement | null>()

export function sprite(famille: Famille, id: string, race: Race): HTMLImageElement | null {
  const cle = `${famille}:${race}:${id}`
  if (!sprites.has(cle)) {
    sprites.set(cle, null)
    const img = new Image()
    const url = URL.createObjectURL(new Blob([svgTexte(genererDessin(famille, id, race), 256, `iv${sprites.size}`)], { type: 'image/svg+xml' }))
    img.onload = () => {
      sprites.set(cle, img)
      URL.revokeObjectURL(url)
    }
    img.src = url
  }
  return sprites.get(cle) ?? null
}

export function lireRecord(cle: string): number {
  try {
    return Number(localStorage.getItem(cle)) || 0
  } catch {
    return 0
  }
}

export function ecrireRecord(cle: string, valeur: number): void {
  try {
    localStorage.setItem(cle, String(valeur))
  } catch {
    // Sans stockage, le record ne survit pas au rechargement.
  }
}

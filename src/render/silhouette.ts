/**
 * OÙ LE DESSIN SE TROUVE VRAIMENT DANS SON CADRE.
 *
 * Toutes les images de créatures font le même carré, mais **le sujet n'y occupe
 * pas la même place** : les cultistes touchent presque le haut et le bas, les
 * gobelins laissent 26 % de vide au-dessus de la tête et 6 % sous les pattes.
 * *C'est ainsi que Keko dit qu'un gobelin est plus petit* — même cadre, sujet
 * plus court — et c'est la bonne façon de le dire, parce qu'elle ne demande
 * aucun réglage de notre côté.
 *
 * Mais tout ce qui se pose AUTOUR du corps était calé sur le cadre : l'ombre au
 * sol serait tombée 6 % sous les pattes du gobelin, et son badge d'intention
 * aurait flotté un quart de cadre au-dessus de son crâne. **Un repère calé sur
 * la marge d'un dessin se déplace avec le dessin** — c'est exactement la leçon
 * déjà payée sur l'intention du Cultiste, et elle se repaie à chaque image dont
 * le cadrage diffère.
 *
 * On mesure donc la boîte du sujet, une fois par créature, en lisant l'alpha.
 * Un canvas de 96 suffit : on cherche des bords à 1 % près, pas des pixels.
 *
 * **Le cache est indispensable, et pas pour la vitesse.** Sans lui, chaque
 * mesure préviendrait la scène, qui se rendrait, qui remesurerait : c'est la
 * boucle infinie déjà rencontrée sur les textures de cartes, celle qui gèle la
 * page *sans une seule erreur en console*. Ici la mesure ne prévient que la
 * PREMIÈRE fois.
 */

/** Les bords du sujet, en fraction du cadre, comptés depuis chaque côté. */
export type Boite = {
  haut: number
  bas: number
  gauche: number
  droite: number
}

/** Le repli : le sujet remplit son cadre. C'est le cas des silhouettes SVG. */
export const CADRE_PLEIN: Boite = { haut: 0, bas: 0, gauche: 0, droite: 0 }

const BOITES = new Map<string, Boite>()

export function boiteDe(cle: string): Boite {
  return BOITES.get(cle) ?? CADRE_PLEIN
}

/**
 * Mesure la boîte du sujet, et dit si c'est la première fois.
 *
 * Le booléen est ce qui permet à l'appelant de ne prévenir la scène qu'une
 * fois : un rendu de plus par créature au chargement, aucun ensuite.
 */
export function mesurerBoite(cle: string, image: CanvasImageSource): boolean {
  if (BOITES.has(cle)) return false

  const T = 96
  const toile = document.createElement('canvas')
  toile.width = T
  toile.height = T
  const ctx = toile.getContext('2d', { willReadFrequently: true })
  if (ctx === null) return false
  ctx.drawImage(image, 0, 0, T, T)

  let donnees: Uint8ClampedArray
  try {
    donnees = ctx.getImageData(0, 0, T, T).data
  } catch {
    // Une image d'une autre origine souille le canvas. Ça n'arrive pas ici —
    // tout vient de `public/` — mais une lecture qui jette ne doit pas
    // emporter le rendu de la créature avec elle.
    return false
  }

  let x0 = T
  let y0 = T
  let x1 = -1
  let y1 = -1
  for (let y = 0; y < T; y++) {
    for (let x = 0; x < T; x++) {
      // Le même seuil que la mesure hors ligne : sous 12, c'est la frange
      // d'antialiasing du dessin, pas le dessin.
      if (donnees[(y * T + x) * 4 + 3]! > 12) {
        if (x < x0) x0 = x
        if (x > x1) x1 = x
        if (y < y0) y0 = y
        if (y > y1) y1 = y
      }
    }
  }
  // Une image entièrement transparente ne dit rien : on garde le cadre plein
  // plutôt que d'inventer une boîte vide, qui ferait disparaître l'ombre.
  if (x1 < 0) return false

  BOITES.set(cle, {
    haut: y0 / T,
    bas: (T - 1 - y1) / T,
    gauche: x0 / T,
    droite: (T - 1 - x1) / T,
  })
  return true
}

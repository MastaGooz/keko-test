/**
 * LE CALCUL D'UN CERNE DE STICKER, SANS DOM : des tableaux de pixels en
 * entrée, des tableaux de pixels en sortie. *C'est ce qui le laisse partir
 * dans un Worker* (`cerne.worker.ts`) — Keko : « à chaque fois que le paquet
 * apparaît, ça freeze avant toujours ». Mesuré : le cerne des cinq cartes
 * d'un paquet, calculé à la finesse de l'illustration (1024), était le plus
 * gros bloc du fil principal à l'arrivée du sachet. L'histoire de chaque
 * étape (le seuil d'encre, le comblement des trous, l'adoucissement, la
 * dilatation exacte) est dans `cerneDe`, qui appelle ce calcul.
 */

/** Voir `SEUIL_ENCRE` dans `texture-carte.ts`. */
export const SEUIL_ENCRE = 0.06

/** Ce qu'il faut pour calculer un cerne : l'alpha est celui de la toile déjà peinte, glyphe en retrait de sa marge. */
export interface DemandeDeCerne {
  /** Les pixels RGBA de la toile carrée de côté `n` (seul l'alpha est lu). */
  readonly pixels: Uint8ClampedArray
  readonly n: number
  /** Le rayon, déjà arrondi au demi-pixel. */
  readonly r: number
  readonly finesse: number
  readonly combler: boolean
  /** La couleur du cerne, `[r, g, b]`. */
  readonly creme: readonly [number, number, number]
}

/** Rend les pixels RGBA du cerne, de côté `n`. */
export function calculerCerne({ pixels: alpha, n, r, finesse, combler, creme }: DemandeDeCerne): Uint8ClampedArray {
  const masque = new Float32Array(n * n)
  for (let i = 0; i < n * n; i++) masque[i] = alpha[i * 4 + 3]! > SEUIL_ENCRE * 255 ? 1 : 0
  if (combler) {
    const dehors = new Uint8Array(n * n)
    const pile: number[] = []
    for (let i = 0; i < n; i++) pile.push(i, (n - 1) * n + i, i * n, i * n + n - 1)
    while (pile.length > 0) {
      const p = pile.pop()!
      if (dehors[p] === 1 || masque[p] === 1) continue
      dehors[p] = 1
      const x = p % n
      if (x > 0) pile.push(p - 1)
      if (x < n - 1) pile.push(p + 1)
      if (p >= n) pile.push(p - n)
      if (p < n * n - n) pile.push(p + n)
    }
    for (let i = 0; i < n * n; i++) if (dehors[i] === 0) masque[i] = 1
  }
  adoucirLeMasque(masque, n, Math.max(1, Math.round(finesse / 128)))
  adoucirLeMasque(masque, n, Math.max(1, Math.round(finesse / 128)))

  // LA DISTANCE AU GLYPHE, au carré, par deux passes séparables.
  const INF = 1e12
  const f = new Float64Array(n * n)
  for (let i = 0; i < n * n; i++) f[i] = masque[i]! > 0.5 ? 0 : INF
  const d = new Float64Array(n)
  const v = new Int32Array(n)
  const z = new Float64Array(n + 1)
  const ligne = new Float64Array(n)
  const dt1 = (): void => {
    let k = 0
    v[0] = 0
    z[0] = -INF
    z[1] = INF
    const croise = (q: number, p: number): number =>
      (ligne[q]! + q * q - (ligne[p]! + p * p)) / (2 * q - 2 * p)
    for (let q = 1; q < n; q++) {
      let sx = croise(q, v[k]!)
      while (sx <= z[k]!) {
        k--
        sx = croise(q, v[k]!)
      }
      k++
      v[k] = q
      z[k] = sx
      z[k + 1] = INF
    }
    k = 0
    for (let q = 0; q < n; q++) {
      while (z[k + 1]! < q) k++
      const vk = v[k]!
      d[q] = (q - vk) * (q - vk) + ligne[vk]!
    }
  }
  for (let x = 0; x < n; x++) {
    for (let y = 0; y < n; y++) ligne[y] = f[y * n + x]!
    dt1()
    for (let y = 0; y < n; y++) f[y * n + x] = d[y]!
  }
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) ligne[x] = f[y * n + x]!
    dt1()
    for (let x = 0; x < n; x++) f[y * n + x] = d[x]!
  }

  const px = new Uint8ClampedArray(n * n * 4)
  for (let i = 0; i < n * n; i++) {
    const dist = Math.sqrt(f[i]!)
    const a = Math.max(0, Math.min(1, r + 0.5 - dist))
    px[i * 4] = creme[0]
    px[i * 4 + 1] = creme[1]
    px[i * 4 + 2] = creme[2]
    px[i * 4 + 3] = Math.round(a * 255)
  }
  if (combler) {
    const dehors = new Uint8Array(n * n)
    const pile: number[] = []
    for (let i = 0; i < n; i++) pile.push(i, (n - 1) * n + i, i * n, i * n + n - 1)
    while (pile.length > 0) {
      const p = pile.pop()!
      if (dehors[p] === 1 || px[p * 4 + 3]! >= 128) continue
      dehors[p] = 1
      const x = p % n
      if (x > 0) pile.push(p - 1)
      if (x < n - 1) pile.push(p + 1)
      if (p >= n) pile.push(p - n)
      if (p < n * n - n) pile.push(p + n)
    }
    for (let i = 0; i < n * n; i++) if (dehors[i] === 0) px[i * 4 + 3] = 255
  }
  return px
}

/** Un flou en boîte, séparable, sur un masque carré de côté n — en place. */
function adoucirLeMasque(m: Float32Array, n: number, r: number): void {
  const tmp = new Float32Array(n * n)
  const fenetre = r * 2 + 1
  for (let y = 0; y < n; y++) {
    let somme = 0
    for (let k = -r; k <= r; k++) somme += k < 0 ? 0 : m[y * n + k]!
    for (let x = 0; x < n; x++) {
      tmp[y * n + x] = somme / fenetre
      const sortant = x - r
      const entrant = x + r + 1
      if (sortant >= 0) somme -= m[y * n + sortant]!
      if (entrant < n) somme += m[y * n + entrant]!
    }
  }
  for (let x = 0; x < n; x++) {
    let somme = 0
    for (let k = -r; k <= r; k++) somme += k < 0 ? 0 : tmp[k * n + x]!
    for (let y = 0; y < n; y++) {
      m[y * n + x] = somme / fenetre
      const sortant = y - r
      const entrant = y + r + 1
      if (sortant >= 0) somme -= tmp[sortant * n + x]!
      if (entrant < n) somme += tmp[entrant * n + x]!
    }
  }
}

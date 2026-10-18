/**
 * LA SEED EST DÉRIVÉE DE L'IDENTIFIANT : même id, même visuel, toujours.
 *
 * FNV-1a 32 bits, le hachage le plus court qui disperse correctement des
 * chaînes proches (`v-1`, `v-2`) — mulberry32 n'aime pas les seeds voisines
 * mal mélangées, et une collection numérotée en produit par milliers.
 */
export function seedDe(id: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  // Un dernier brassage : FNV seul laisse les bits hauts trop sages.
  h ^= h >>> 16
  h = Math.imul(h, 0x45d9f3b)
  h ^= h >>> 16
  return h >>> 0
}

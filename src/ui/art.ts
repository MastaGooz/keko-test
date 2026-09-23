/**
 * LES ILLUSTRATIONS DES CARTES : un SVG par modèle, dessiné à la main, dans
 * `art/`. Chaque carte en porte une en plein format, sous le cadre et le
 * texte.
 *
 * Elles passent par Vite (`import.meta.glob`), donc chaque fichier sort du
 * build avec une empreinte dans son nom : remplacer un dessin change son URL,
 * et le navigateur ne peut pas resservir l'ancien. C'est le piège des portraits
 * de `public/`, évité à la source.
 *
 * Le nom du fichier est le nom du modèle, en minuscules, sans accent, les
 * espaces en tirets (« Médaillon » → `medaillon.svg`, « Boire une gorgée » →
 * `boire-une-gorgee.svg`). Un modèle sans dessin reçoit `defaut.svg`
 * — un sceau, pas un trou : si on le voit en jeu, c'est qu'il manque un
 * fichier, et ça se voit.
 */
const FICHIERS = import.meta.glob<string>('./art/*.svg', {
  eager: true,
  query: '?url',
  import: 'default',
})

const ART: Record<string, string> = {}
for (const [chemin, url] of Object.entries(FICHIERS)) {
  const nom = chemin.replace(/^.*\//, '').replace(/\.svg$/, '')
  ART[nom] = url
}

/** Le nom d'un modèle tel qu'il nomme son fichier. */
function cle(nom: string): string {
  return nom
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, '-')
}

/** L'URL de l'illustration d'un modèle, ou celle du repli. */
export function art(nom: string): string {
  return ART[cle(nom)] ?? ART['defaut'] ?? ''
}

/** Le dos de carte, pour les tas. */
export function dosDeCarte(): string {
  return ART['dos'] ?? ''
}

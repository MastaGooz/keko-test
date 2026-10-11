// LE CHARGEMENT DE LA COLLECTION DE PEINTURES.
//
// Il vit dans `ui/` et non dans `logic/`, parce que `logic/` est PUR : un
// `fetch` est une entree-sortie, et la regle du projet est que ce dont `logic/`
// a besoin du monde exterieur lui est INJECTE -- le motif du `StoragePort`.
// Ici c'est plus simple encore : `logic/` porte le type et la validation
// (`parsePeintures`), et c'est ce module qui va chercher le texte.

import { parsePeintures, type CartePeinture } from '../logic/paintings/types.ts'

/**
 * `public/data/paintings.json` est servi tel quel, SANS empreinte de contenu
 * dans son nom -- comme tout ce qui vit dans `public/`. Son URL porte donc la
 * date du build, sinon reengendrer le fichier ne changerait rien a l'ecran.
 */
function urlDesPeintures(): string {
  return `${import.meta.env.BASE_URL}data/paintings.json?v=${encodeURIComponent(__BUILD_TIME__)}`
}

let enCours: Promise<CartePeinture[]> | null = null

/**
 * Charge la collection. Mise en cache pour toute la session : le fichier ne
 * change pas en cours de partie.
 *
 * Le cache ne retient QUE les succes -- une promesse rejetee gardee
 * condamnerait les cartes jusqu'au rechargement, la lecon des textures de
 * cartes.
 */
export function chargerPeintures(): Promise<CartePeinture[]> {
  if (enCours !== null) return enCours
  const p = (async () => {
    const reponse = await fetch(urlDesPeintures())
    if (!reponse.ok) throw new Error(`paintings.json : HTTP ${reponse.status}`)
    const cartes = parsePeintures(await reponse.text())
    if (cartes.length === 0) throw new Error('paintings.json : aucune carte valide')
    return cartes
  })()
  enCours = p
  p.catch(() => {
    if (enCours === p) enCours = null
  })
  return p
}

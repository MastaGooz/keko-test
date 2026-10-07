// LE CHARGEMENT DU JEU DE CARTES-PERSONNAGES.
//
// Il vit dans `ui/` et non dans `logic/`, parce que `logic/` est PUR : un
// `fetch` est une entree-sortie, et la regle du projet est que ce dont `logic/`
// a besoin du monde exterieur lui est INJECTE -- le motif du `StoragePort`.
// Ici c'est plus simple encore : `logic/` porte le type et la validation
// (`parsePersonnages`), et c'est ce module qui va chercher le texte.

import { parsePersonnages, type CharacterCard } from '../logic/characters/types.ts'

/**
 * `public/data/characters.json` est servi tel quel, SANS empreinte de contenu
 * dans son nom -- comme tout ce qui vit dans `public/`. Son URL porte donc la
 * date du build, sinon regenerer le fichier ne changerait rien a l'ecran.
 */
function urlDesCartes(): string {
  return `${import.meta.env.BASE_URL}data/characters.json?v=${encodeURIComponent(__BUILD_TIME__)}`
}

let enCours: Promise<CharacterCard[]> | null = null

/**
 * Charge les cartes-personnages. Mis en cache pour toute la session : le
 * fichier ne change pas en cours de partie.
 *
 * Le cache ne retient QUE les succes -- une promesse rejetee gardee
 * condamnerait les cartes jusqu'au rechargement, la lecon des textures de
 * cartes.
 */
export function loadCharacters(): Promise<CharacterCard[]> {
  if (enCours !== null) return enCours
  const p = (async () => {
    const reponse = await fetch(urlDesCartes())
    if (!reponse.ok) throw new Error(`characters.json : HTTP ${reponse.status}`)
    const cartes = parsePersonnages(await reponse.text())
    if (cartes.length === 0) throw new Error('characters.json : aucune carte valide')
    return cartes
  })()
  enCours = p
  p.catch(() => {
    if (enCours === p) enCours = null
  })
  return p
}

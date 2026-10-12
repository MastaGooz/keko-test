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
function urlDesCartes(fichier: string): string {
  return `${import.meta.env.BASE_URL}data/${fichier}.json?v=${encodeURIComponent(__BUILD_TIME__)}`
}

/**
 * LE CACHE EST PAR FICHIER, et il le faut : `?paquet&fiction` ouvre le banc du
 * pool entier a cote du catalogue du jeu. *Un cache a une seule place rendrait
 * le premier catalogue charge a tous les suivants* -- et ca ne se verrait qu'en
 * passant d'un banc a l'autre sans recharger.
 */
const enCoursPar = new Map<string, Promise<CharacterCard[]>>()

/**
 * Charge les cartes-personnages. Mis en cache pour toute la session : le
 * fichier ne change pas en cours de partie.
 *
 * Le cache ne retient QUE les succes -- une promesse rejetee gardee
 * condamnerait les cartes jusqu'au rechargement, la lecon des textures de
 * cartes.
 */
export function loadCharacters(fichier = 'characters'): Promise<CharacterCard[]> {
  const deja = enCoursPar.get(fichier)
  if (deja !== undefined) return deja
  const p = (async () => {
    const reponse = await fetch(urlDesCartes(fichier))
    if (!reponse.ok) throw new Error(`${fichier}.json : HTTP ${reponse.status}`)
    const cartes = parsePersonnages(await reponse.text())
    if (cartes.length === 0) throw new Error(`${fichier}.json : aucune carte valide`)
    return cartes
  })()
  enCoursPar.set(fichier, p)
  p.catch(() => {
    if (enCoursPar.get(fichier) === p) enCoursPar.delete(fichier)
  })
  return p
}

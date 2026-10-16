// LA COLLECTION GARDÉE DANS LE NAVIGATEUR.
//
// *C'est la porte prévue le jour où la persistance reviendrait* : `logic/` dit
// ce qu'est une collection et la relit sans confiance (`lireCollection`), ce
// module ne fait que l'écrire et la lire. **Elle vit sur l'appareil** : le
// téléphone et le PC de Keko ont chacun la leur, il n'y a pas de compte.
//
// Tout passe dans un try : *un stockage refusé (navigation privée, quota) ne
// doit jamais empêcher d'ouvrir un paquet* — on joue alors sans mémoire.

import { collectionVide, lireCollection, type Collection } from '../logic/emoji/collection.ts'

const CLE = 'keko-emoji-collection'

export function chargerCollection(): Collection {
  try {
    const brut = localStorage.getItem(CLE)
    return brut === null ? collectionVide() : lireCollection(JSON.parse(brut))
  } catch {
    return collectionVide()
  }
}

export function sauverCollection(col: Collection): void {
  try {
    localStorage.setItem(CLE, JSON.stringify(col))
  } catch {
    // Sans stockage, la collection vit le temps de la page.
  }
}

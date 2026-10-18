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
import { lireReserve, reservePleine, type Reserve } from '../logic/emoji/reserve.ts'
import { decksVides, lireDecks, type Decks } from '../logic/emoji/deck.ts'

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

// LA RÉSERVE DE PAQUETS, à côté : voir `logic/emoji/reserve.ts`. *Elle se
// garde à part* : une réserve abîmée repart pleine alors qu'une collection
// abîmée perd des cartes — deux reprises différentes, deux clés.
const CLE_RESERVE = 'keko-emoji-reserve'

export function chargerReserve(maintenant: number): Reserve {
  try {
    const brut = localStorage.getItem(CLE_RESERVE)
    return brut === null ? reservePleine(maintenant) : lireReserve(JSON.parse(brut), maintenant)
  } catch {
    return reservePleine(maintenant)
  }
}

export function sauverReserve(r: Reserve): void {
  try {
    localStorage.setItem(CLE_RESERVE, JSON.stringify(r))
  } catch {
    // Sans stockage, la réserve vit le temps de la page.
  }
}

// LES DECKS QUI JOUENT, à part eux aussi : voir `logic/emoji/deck.ts`. *Un deck
// abîmé repart vide*, la collection n'y perd rien ; et c'est la collection qui
// dit ce qu'on possède encore (`possede`) — une carte partie quitte le deck.
// La clé n'a pas changé quand il y a eu plusieurs decks : `lireDecks` relit
// aussi le deck seul d'avant.
const CLE_DECK = 'keko-emoji-deck'

export function chargerDecks(possede: (id: string) => boolean, maintenant: number): Decks {
  try {
    const brut = localStorage.getItem(CLE_DECK)
    return brut === null ? decksVides() : lireDecks(JSON.parse(brut), possede, maintenant)
  } catch {
    return decksVides()
  }
}

export function sauverDecks(ds: Decks): void {
  try {
    localStorage.setItem(CLE_DECK, JSON.stringify(ds))
  } catch {
    // Sans stockage, le deck vit le temps de la page.
  }
}

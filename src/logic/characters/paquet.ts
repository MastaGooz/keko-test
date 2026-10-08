/**
 * LE TIRAGE D'UN PAQUET — pur, seedé, sans navigateur.
 *
 * C'est de la RÈGLE et non du rendu : combien de cartes, et quelle garantie de
 * rareté. L'écran d'ouverture ne fait que montrer ce que cette fonction a
 * tiré, exactement comme la descente montre ce que `logic/descente.ts` décide.
 *
 * **Tout le hasard passe par le RNG seedé**, comme partout dans ce jeu : un
 * paquet rejoué à la même seed rend les mêmes cartes, donc Keko peut me
 * signaler un tirage précis.
 */
import type { Rng } from '../rng.ts'
import type { CharacterCard, Rarete } from './types.ts'
import { RARETES } from './types.ts'

/**
 * LA TAILLE D'UN PAQUET — cinq cartes.
 *
 * **C'est un PLACEHOLDER, et il attend Keko.** Cinq est le compte du genre
 * (un booster de Hearthstone en fait cinq, Magic en fait quinze), et c'est
 * aussi ce que la main du jeu porte — donc l'écran se règle sur une grandeur
 * que le projet connaît déjà.
 */
export const CARTES_PAR_PAQUET = 5

/**
 * LE CRAN GARANTI : tout paquet porte au moins une carte de ce rang ou mieux.
 *
 * *Un paquet sans garantie n'est pas un paquet, c'est cinq tirages* — et le
 * genre entier repose là-dessus : on ouvre parce qu'on sait qu'il y aura
 * quelque chose. **Placeholder lui aussi**, et c'est la première chose à
 * régler quand Keko voudra doser l'envie d'en ouvrir un autre.
 */
export const CRAN_GARANTI: Rarete = 'rare'

/**
 * CE QUE CHAQUE CRAN A DE CHANCES DE SORTIR, par carte tirée.
 *
 * **Ce n'est PAS la distribution du catalogue, et c'est tout l'intérêt.** Le
 * catalogue est ce que Wikidata contient — 30 % de communs, 44 % de
 * peu-communs — alors qu'un paquet est ce qu'on DONNE. *La table du catalogue
 * décrit le monde, celle-ci décrit un cadeau* : si l'on tirait uniformément,
 * un légendaire sortirait une fois sur cent vingt paquets et personne ne les
 * verrait jamais.
 *
 * Les cinq valeurs somment à 1. À régler avec Keko — voir `CRAN_GARANTI`.
 */
export const CHANCES: Readonly<Record<Rarete, number>> = {
  commun: 0.58,
  'peu-commun': 0.27,
  rare: 0.11,
  epique: 0.032,
  legendaire: 0.008,
}

/** Le rang d'un cran, du plus commun (0) au plus rare (4). */
export function rangDeRarete(r: Rarete): number {
  return RARETES.indexOf(r)
}

/** Tire un cran selon `CHANCES`. */
function tirerCran(rng: Rng): Rarete {
  let reste = rng.next()
  for (const r of RARETES) {
    reste -= CHANCES[r]
    if (reste <= 0) return r
  }
  // Le reliquat d'arrondi revient au cran le plus commun : *un tirage ne doit
  // jamais pouvoir ne rien rendre.*
  return 'commun'
}

/**
 * LE CATALOGUE RANGÉ PAR CRAN, pour tirer sans parcourir trois mille cartes à
 * chaque fois. Rendu séparément de `ouvrirPaquet` pour qu'un écran qui ouvre
 * dix paquets ne le refasse pas dix fois.
 */
export function parCran(cartes: readonly CharacterCard[]): Map<Rarete, CharacterCard[]> {
  const tas = new Map<Rarete, CharacterCard[]>()
  for (const r of RARETES) tas.set(r, [])
  for (const c of cartes) tas.get(c.rarete)?.push(c)
  return tas
}

/**
 * Tire une carte d'un cran donné, en descendant si le cran est vide.
 *
 * **Il DESCEND plutôt que de rendre `null`** : les crans du haut comptent
 * vingt-cinq cartes sur trois mille, et un catalogue plus petit — ou filtré —
 * pourrait n'en avoir aucune. *Un paquet doit toujours rendre cinq cartes*,
 * donc un cran introuvable retombe sur le cran d'en dessous plutôt que de
 * laisser un trou.
 */
function tirerDansLeCran(
  tas: Map<Rarete, CharacterCard[]>,
  cran: Rarete,
  rng: Rng,
  deja: ReadonlySet<string>,
): CharacterCard | null {
  for (let i = rangDeRarete(cran); i >= 0; i--) {
    const lot = (tas.get(RARETES[i]!) ?? []).filter((c) => !deja.has(c.id))
    if (lot.length === 0) continue
    return lot[Math.floor(rng.next() * lot.length)] ?? null
  }
  // Puis vers le haut, en dernier recours : mieux vaut une carte trop rare
  // qu'une case vide.
  for (let i = rangDeRarete(cran) + 1; i < RARETES.length; i++) {
    const lot = (tas.get(RARETES[i]!) ?? []).filter((c) => !deja.has(c.id))
    if (lot.length === 0) continue
    return lot[Math.floor(rng.next() * lot.length)] ?? null
  }
  return null
}

/**
 * OUVRE UN PAQUET : `CARTES_PAR_PAQUET` cartes, sans doublon, dont au moins
 * une au cran garanti.
 *
 * **Les cartes sont rendues DANS L'ORDRE DU TIRAGE, et la garantie est tirée
 * en DERNIER.** Ce n'est pas un détail de rendu : l'écran les révèle de gauche
 * à droite, donc *il y a toujours quelque chose au bout* — c'est ce qui fait
 * qu'on retourne les cinq plutôt que de s'arrêter à la première.
 *
 * *Ce n'est pas pour autant la MEILLEURE* : les quatre premières peuvent tirer
 * plus haut que la garantie, et c'est très bien — un paquet dont on saurait
 * que le bouquet final est à droite se lirait à l'envers.
 */
export function ouvrirPaquet(
  tas: Map<Rarete, CharacterCard[]>,
  rng: Rng,
): CharacterCard[] {
  const tirees: CharacterCard[] = []
  const vues = new Set<string>()

  for (let i = 0; i < CARTES_PAR_PAQUET - 1; i++) {
    const c = tirerDansLeCran(tas, tirerCran(rng), rng, vues)
    if (c === null) break
    tirees.push(c)
    vues.add(c.id)
  }

  // LA GARANTIE : le cran tiré, ou le cran garanti si le tirage est tombé plus
  // bas. *Une garantie qui se contente du minimum enlèverait tout le haut de
  // la table* — un paquet peut parfaitement finir sur un légendaire.
  const cran = tirerCran(rng)
  const retenu = rangDeRarete(cran) >= rangDeRarete(CRAN_GARANTI) ? cran : CRAN_GARANTI
  const vedette = tirerDansLeCran(tas, retenu, rng, vues)
  if (vedette !== null) tirees.push(vedette)

  return tirees
}

/**
 * LE DECK QUI JOUE TOUT SEUL — le générateur de Likes.
 *
 * Keko : « je pensais à un système idle où tu construis un deck : ce deck joue
 * son cycle (main de 5 cartes jouée, jusqu'à vider le deck, puis remélange),
 * le deck fait 30 cartes. Chaque main génère des likes en fonction des cartes
 * (commençons par 1 like par carte). Une main est jouée toutes les X secondes.
 * Chaque main ajoute immédiatement ses likes. »
 *
 * **LE TEMPS EST INJECTÉ**, comme pour la réserve : ce module ne lit pas
 * l'horloge et ne compte pas des secondes. Il garde l'instant où la dernière
 * main a été jouée (`depuis`) et combien de cartes du mélange en cours l'ont
 * été (`jouees`) ; ce qui s'est écoulé se rejoue à la lecture (`deckAJour`),
 * main par main — *un téléphone en veille ou un onglet fermé jouent pareil*,
 * dans la limite de `horsLigneMax`. **Le mélange est seedé** (`melange`,
 * mulberry32) : la même graine redonne le même ordre, donc la main en cours se
 * recalcule sans la stocker.
 *
 * *Un deck est une liste d'emoji possédés, un exemplaire chacun* : la version
 * (holo, animée) n'y compte pas encore, un Like par carte.
 */
import { createRng } from '../rng.ts'

/** Les chiffres de Keko (30, 5, 1 Like), et les miens à rejuger (la cadence, la limite hors ligne). */
export const DECK = {
  /** « le deck fait 30 cartes » : il ne joue qu'à ce compte. */
  taille: 30,
  /** « main de 5 cartes ». */
  main: 5,
  /** Une main toutes les dix secondes — « toutes les X secondes », X de moi. */
  cadence: 10 * 1000,
  /** « commençons par 1 like par carte ». */
  likesParCarte: 1,
  /**
   * CE QU'ON RATTRAPE AU PLUS en revenant : huit heures de mains. *Un idle qui
   * ne joue qu'à l'écran n'est pas un idle*, mais une semaine d'absence qui
   * rendrait trois cent mille Likes casserait tout prix de paquet. À rejuger.
   */
  horsLigneMax: 8 * 60 * 60 * 1000,
} as const

/** La partie en cours : le mélange, où on en est, quand la dernière main est tombée. */
export interface Partie {
  readonly graine: number
  /** Combien de cartes du mélange ont été jouées — un multiple de `DECK.main`. */
  readonly jouees: number
  /** Quand la dernière main a été jouée (ou la partie lancée). */
  readonly depuis: number
}

export interface Deck {
  /** Les emoji du deck, dans l'ordre où le joueur les a mis — un exemplaire chacun. */
  readonly cartes: readonly string[]
  /** `null` : le deck ne joue pas (incomplet). */
  readonly partie: Partie | null
}

export function deckVide(): Deck {
  return { cartes: [], partie: null }
}

export function deckComplet(d: Deck): boolean {
  return d.cartes.length === DECK.taille
}

/** Fisher-Yates seedé : *même graine, même ordre* — le mélange ne se stocke pas. */
export function melange(cartes: readonly string[], graine: number): string[] {
  const l = [...cartes]
  const rng = createRng(graine)
  for (let i = l.length - 1; i > 0; i--) {
    const j = Math.floor(rng.next() * (i + 1))
    ;[l[i], l[j]] = [l[j]!, l[i]!]
  }
  return l
}

/** La graine du mélange suivant : dérivée de la précédente, pour que le remélange soit un autre ordre. */
function graineSuivante(g: number): number {
  return (Math.imul(g, 1103515245) + 12345) >>> 0
}

/** La main qui va se jouer (ou qui vient de l'être, selon ce qu'on regarde) : les cinq cartes à `jouees`. */
export function mainCourante(d: Deck): readonly string[] {
  if (d.partie === null) return []
  return melange(d.cartes, d.partie.graine).slice(d.partie.jouees, d.partie.jouees + DECK.main)
}

/** La dernière main jouée du mélange en cours ; `null` au début d'un mélange (l'ordre d'avant n'est plus là). */
export function mainPrecedente(d: Deck): readonly string[] | null {
  if (d.partie === null || d.partie.jouees === 0) return null
  return melange(d.cartes, d.partie.graine).slice(d.partie.jouees - DECK.main, d.partie.jouees)
}

/** Ce que rapporte une main : un Like par carte, pour commencer. */
export function likesDeLaMain(main: readonly string[]): number {
  return main.length * DECK.likesParCarte
}

/**
 * MET OU RETIRE UNE CARTE. *Changer le deck relance sa partie* : le mélange en
 * cours ne vaut plus, et un deck qui n'a plus ses trente cartes s'arrête.
 */
export function basculerCarte(d: Deck, id: string, maintenant: number): Deck {
  const dedans = d.cartes.includes(id)
  if (!dedans && d.cartes.length >= DECK.taille) return d
  const cartes = dedans ? d.cartes.filter((x) => x !== id) : [...d.cartes, id]
  return demarrer({ cartes, partie: null }, maintenant)
}

/** Les cartes qu'on ne possède plus quittent le deck (détruites, retirées). */
export function garderPossedees(d: Deck, possede: (id: string) => boolean, maintenant: number): Deck {
  if (d.cartes.every(possede)) return d
  return demarrer({ cartes: d.cartes.filter(possede), partie: null }, maintenant)
}

/** Lance la partie si le deck est complet et ne joue pas encore ; sinon rend le deck tel quel. */
export function demarrer(d: Deck, maintenant: number): Deck {
  if (d.partie !== null || !deckComplet(d)) return d
  return { cartes: d.cartes, partie: { graine: maintenant >>> 0, jouees: 0, depuis: maintenant } }
}

export interface MainsJouees {
  readonly deck: Deck
  /** Combien de mains le temps écoulé a jouées. */
  readonly mains: number
  /** Les Likes qu'elles ont rapportés, à ajouter à la collection. */
  readonly likes: number
  /** La dernière main jouée, celle qu'on montre ; `null` si aucune. */
  readonly derniere: readonly string[] | null
}

/**
 * REJOUE CE QUE LE TEMPS A JOUÉ : une main par `cadence` écoulée, le mélange
 * suivant quand le deck est vide. Au plus `horsLigneMax` de mains ; au-delà,
 * le reste est perdu et la cadence repart de maintenant.
 */
export function deckAJour(d: Deck, maintenant: number): MainsJouees {
  const rien = { deck: d, mains: 0, likes: 0, derniere: null }
  if (d.partie === null) return rien
  // UNE HORLOGE QUI RECULE ne joue rien et ne doit rien casser : on repart de maintenant.
  if (maintenant < d.partie.depuis) return { ...rien, deck: { ...d, partie: { ...d.partie, depuis: maintenant } } }
  const ecoule = maintenant - d.partie.depuis
  const borne = ecoule > DECK.horsLigneMax
  const mains = Math.floor(Math.min(ecoule, DECK.horsLigneMax) / DECK.cadence)
  if (mains === 0) return rien
  let { graine, jouees } = d.partie
  let likes = 0
  let derniere: readonly string[] | null = null
  let ordre = melange(d.cartes, graine)
  for (let i = 0; i < mains; i++) {
    const main = ordre.slice(jouees, jouees + DECK.main)
    likes += likesDeLaMain(main)
    derniere = main
    jouees += DECK.main
    if (jouees >= ordre.length) {
      graine = graineSuivante(graine)
      jouees = 0
      ordre = melange(d.cartes, graine)
    }
  }
  const depuis = borne ? maintenant : d.partie.depuis + mains * DECK.cadence
  return { deck: { cartes: d.cartes, partie: { graine, jouees, depuis } }, mains, likes, derniere }
}

/** Dans combien de millisecondes tombe la prochaine main ; `null` si le deck ne joue pas. */
export function prochaineMainDans(d: Deck, maintenant: number): number | null {
  if (d.partie === null) return null
  const a = deckAJour(d, maintenant).deck
  return Math.max(0, a.partie!.depuis + DECK.cadence - maintenant)
}

/**
 * RELIT UN DECK GARDÉ, sans confiance : abîmé, il repart vide. `possede` dit
 * ce que la collection connaît encore ; une carte en double ou de trop est
 * écartée, et un deck incomplet ne joue pas.
 */
export function lireDeck(brut: unknown, possede: (id: string) => boolean, maintenant: number): Deck {
  if (typeof brut !== 'object' || brut === null) return deckVide()
  const o = brut as Record<string, unknown>
  if (!Array.isArray(o.cartes)) return deckVide()
  const cartes: string[] = []
  for (const id of o.cartes as unknown[]) {
    if (typeof id !== 'string' || !/^[0-9a-f]+(-[0-9a-f]+)*$/.test(id) || cartes.includes(id) || !possede(id)) continue
    if (cartes.length >= DECK.taille) break
    cartes.push(id)
  }
  const p = typeof o.partie === 'object' && o.partie !== null ? (o.partie as Record<string, unknown>) : null
  const entier = (v: unknown): number | null => (typeof v === 'number' && Number.isInteger(v) && v >= 0 ? v : null)
  if (p !== null && cartes.length === DECK.taille && cartes.length === (o.cartes as unknown[]).length) {
    const graine = entier(p.graine)
    const jouees = entier(p.jouees)
    const depuis = typeof p.depuis === 'number' && Number.isFinite(p.depuis) ? p.depuis : null
    if (graine !== null && jouees !== null && jouees % DECK.main === 0 && jouees < DECK.taille && depuis !== null) {
      return { cartes, partie: { graine, jouees, depuis } }
    }
  }
  // Un deck complet dont la partie est abîmée (ou absente) repart d'une partie neuve.
  return demarrer({ cartes, partie: null }, maintenant)
}

/* ------------------------------------------------------------------------ */
/* PLUSIEURS DECKS, UN SEUL QUI JOUE                                         */
/* ------------------------------------------------------------------------ */

/**
 * Keko : « il faudrait que le joueur puisse avoir plusieurs decks, et
 * sélectionner celui avec lequel il veut jouer ». *Un seul joue à la fois* :
 * la partie est celle du deck actif, les autres n'en ont pas. Choisir un autre
 * deck arrête le premier et lance le second (s'il est complet) — le mélange en
 * cours ne se garde pas, comme quand on change un deck.
 */
export const DECKS_MAX = 6

export interface Decks {
  readonly liste: readonly Deck[]
  /** L'index du deck qui joue (ou qui jouerait, s'il était complet). */
  readonly actif: number
}

export function decksVides(): Decks {
  return { liste: [deckVide()], actif: 0 }
}

export function deckActif(ds: Decks): Deck {
  return ds.liste[ds.actif] ?? deckVide()
}

/** Un deck vide de plus, qu'on composera ; au plus `DECKS_MAX`. L'actif ne change pas. */
export function ajouterDeck(ds: Decks): Decks {
  if (ds.liste.length >= DECKS_MAX) return ds
  return { liste: [...ds.liste, deckVide()], actif: ds.actif }
}

/** Retire un deck — jamais le dernier. Si c'était l'actif, le premier prend sa place et démarre s'il peut. */
export function supprimerDeck(ds: Decks, i: number, maintenant: number): Decks {
  if (ds.liste.length <= 1 || i < 0 || i >= ds.liste.length) return ds
  const liste = ds.liste.filter((_, k) => k !== i)
  if (i === ds.actif) return choisirDeck({ liste, actif: 0 }, 0, maintenant, true)
  return { liste, actif: ds.actif < i ? ds.actif : ds.actif - 1 }
}

/**
 * CHOISIT LE DECK QUI JOUE : l'ancien s'arrête, le nouveau démarre s'il est
 * complet. Choisir celui qui joue déjà ne change rien.
 */
export function choisirDeck(ds: Decks, i: number, maintenant: number, force = false): Decks {
  if (i < 0 || i >= ds.liste.length || (i === ds.actif && !force)) return ds
  const liste = ds.liste.map((d, k) =>
    k === i ? demarrer({ cartes: d.cartes, partie: null }, maintenant) : d.partie === null ? d : { cartes: d.cartes, partie: null },
  )
  return { liste, actif: i }
}

/** Applique un changement à un deck ; seul l'actif garde (ou prend) une partie. */
export function modifierDeck(ds: Decks, i: number, f: (d: Deck) => Deck): Decks {
  const d = ds.liste[i]
  if (d === undefined) return ds
  const n0 = f(d)
  if (n0 === d) return ds
  const n = i === ds.actif || n0.partie === null ? n0 : { cartes: n0.cartes, partie: null }
  return { liste: ds.liste.map((x, k) => (k === i ? n : x)), actif: ds.actif }
}

/** Les cartes qu'on ne possède plus quittent tous les decks. */
export function garderPossedeesPartout(ds: Decks, possede: (id: string) => boolean, maintenant: number): Decks {
  let r = ds
  for (let i = 0; i < ds.liste.length; i++) r = modifierDeck(r, i, (d) => garderPossedees(d, possede, maintenant))
  return r
}

export interface MainsJoueesDesDecks extends Omit<MainsJouees, 'deck'> {
  readonly decks: Decks
}

/** Ce que le temps a joué : le deck actif seul joue. */
export function decksAJour(ds: Decks, maintenant: number): MainsJoueesDesDecks {
  const r = deckAJour(deckActif(ds), maintenant)
  const decks = r.deck === deckActif(ds) ? ds : { liste: ds.liste.map((d, k) => (k === ds.actif ? r.deck : d)), actif: ds.actif }
  return { decks, mains: r.mains, likes: r.likes, derniere: r.derniere }
}

/**
 * RELIT LES DECKS GARDÉS, sans confiance — et relit aussi un deck seul d'avant
 * (`{ cartes, partie }`), qui devient le premier et l'actif. Abîmés, un deck
 * vide ; seul l'actif garde sa partie.
 */
export function lireDecks(brut: unknown, possede: (id: string) => boolean, maintenant: number): Decks {
  if (typeof brut !== 'object' || brut === null) return decksVides()
  const o = brut as Record<string, unknown>
  if (!Array.isArray(o.liste)) {
    // Le format d'avant : un seul deck.
    if (!Array.isArray(o.cartes)) return decksVides()
    return { liste: [lireDeck(brut, possede, maintenant)], actif: 0 }
  }
  const brutes = (o.liste as unknown[]).slice(0, DECKS_MAX)
  if (brutes.length === 0) return decksVides()
  const actif = typeof o.actif === 'number' && Number.isInteger(o.actif) && o.actif >= 0 && o.actif < brutes.length ? o.actif : 0
  const liste = brutes.map((b, k) => {
    const d = lireDeck(b, possede, maintenant)
    return k === actif ? d : d.partie === null ? d : { cartes: d.cartes, partie: null }
  })
  return { liste, actif }
}

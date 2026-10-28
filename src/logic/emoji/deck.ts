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
 * **UNE CARTE DU DECK EST UN EXEMPLAIRE PRÉCIS** (`EntreeDeck` : l'emoji et sa
 * version). Keko : « on doit afficher des slots différents quand une carte est
 * normale / holo / animée / animée holo afin que le joueur décide quel
 * exemplaire il veut mettre dans le deck » ; « empêcher les doubles (pas deux
 * fois la même carte) » ; « une carte ne peut pas être dans deux decks ». Donc
 * : *un emoji au plus une fois par deck* (choisir une autre version de
 * l'emoji remplace la première), et *un exemplaire au plus une fois dans
 * l'ensemble des decks* — on ne met pas en jeu plus de holo qu'on n'en a
 * (`disponibles`).
 *
 * **CE QUE RAPPORTE UNE CARTE DÉPEND DE SON CRAN** (Keko : « +1 like par
 * niveau de rareté quand les cartes sont jouées ») : un Like pour une
 * commune, un de plus par cran, cinq pour une légendaire. Le cran est dans le
 * catalogue, que ce module ne lit pas : *la valeur d'une carte est injectée*
 * (`ValeurDeCarte`, bâtie par `valeurParRarete`), comme le temps. La version
 * (holo, animée) ne compte pas encore.
 */
import { createRng } from '../rng.ts'
import { VARIANTES, type Variante } from './collection.ts'
import { RARETES_EMOJI, type RareteEmoji } from './types.ts'

/** Les chiffres de Keko (30, 5, 1 Like), et les miens à rejuger (la cadence, la limite hors ligne). */
export const DECK = {
  /** « le deck fait 30 cartes » : il ne joue qu'à ce compte. */
  taille: 30,
  /** « main de 5 cartes ». */
  main: 5,
  /** Une main toutes les dix secondes — « toutes les X secondes », X de moi. */
  cadence: 10 * 1000,
  /** « commençons par 1 like par carte » : ce que rapporte une commune. */
  likesCommun: 1,
  /** « +1 like par niveau de rareté » : ce que chaque cran ajoute. */
  likesParCran: 1,
  /** « +1 par niveau pour l'instant » : ce que chaque niveau au-delà du premier ajoute. */
  likesParNiveau: 1,
  /**
   * CE QU'ON RATTRAPE AU PLUS en revenant : huit heures de mains. *Un idle qui
   * ne joue qu'à l'écran n'est pas un idle*, mais une semaine d'absence qui
   * rendrait trois cent mille Likes casserait tout prix de paquet. À rejuger.
   */
  horsLigneMax: 8 * 60 * 60 * 1000,
} as const

/** Une carte du deck : un emoji dans une version précise. */
export interface EntreeDeck {
  readonly id: string
  readonly v: Variante
}

/** La partie en cours : le mélange, où on en est, quand la dernière main est tombée. */
export interface Partie {
  readonly graine: number
  /** Combien de cartes du mélange ont été jouées — un multiple de `DECK.main`. */
  readonly jouees: number
  /** Quand la dernière main a été jouée (ou la partie lancée). */
  readonly depuis: number
}

export interface Deck {
  /** Les cartes du deck, dans l'ordre où le joueur les a mises — un emoji au plus une fois. */
  readonly cartes: readonly EntreeDeck[]
  /** `null` : le deck ne joue pas (incomplet). */
  readonly partie: Partie | null
  /** LE NOM DONNÉ PAR LE JOUEUR (Keko : « pouvoir nommer les decks ») ; absent : « Deck N ». */
  readonly nom?: string
}

/** Au plus tant de caractères dans un nom de deck. */
export const NOM_DECK_MAX = 24

/** Le nom à montrer : celui du joueur, sinon « Deck N » (N compté depuis 1). */
export function nomDuDeck(d: Deck | undefined, i: number): string {
  return d?.nom ?? `Deck ${i + 1}`
}

/** Un nom propre : sans blancs autour, borné ; vide, plus de nom. */
function nomPropre(brut: unknown): string | undefined {
  if (typeof brut !== 'string') return undefined
  const n = brut.trim().replace(/\s+/g, ' ').slice(0, NOM_DECK_MAX)
  return n === '' ? undefined : n
}

/** Garde ou retire le nom d'un deck — le reste ne bouge pas. */
function avecNom(d: Deck, nom: string | undefined): Deck {
  if (nom === undefined) {
    const { nom: _, ...sans } = d
    return sans
  }
  return { ...d, nom }
}

export function deckVide(): Deck {
  return { cartes: [], partie: null }
}

export function deckComplet(d: Deck): boolean {
  return d.cartes.length === DECK.taille
}

export const memeEntree = (a: EntreeDeck, b: EntreeDeck): boolean => a.id === b.id && a.v === b.v

/** Fisher-Yates seedé : *même graine, même ordre* — le mélange ne se stocke pas. */
export function melange<T>(cartes: readonly T[], graine: number): T[] {
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

/** La main qui va se jouer : les cinq cartes à `jouees`. */
export function mainCourante(d: Deck): readonly EntreeDeck[] {
  if (d.partie === null) return []
  return melange(d.cartes, d.partie.graine).slice(d.partie.jouees, d.partie.jouees + DECK.main)
}

/** La dernière main jouée du mélange en cours ; `null` au début d'un mélange (l'ordre d'avant n'est plus là). */
export function mainPrecedente(d: Deck): readonly EntreeDeck[] | null {
  if (d.partie === null || d.partie.jouees === 0) return null
  return melange(d.cartes, d.partie.graine).slice(d.partie.jouees - DECK.main, d.partie.jouees)
}

/** Ce que rapporte un exemplaire joué — injecté, le deck ne connaît pas le catalogue. */
export type ValeurDeCarte = (e: EntreeDeck) => number

/**
 * UN LIKE, PLUS UN PAR CRAN : commune 1, peu commune 2, rare 3, épique 4,
 * légendaire 5. Une carte dont on ne retrouve pas le cran vaut une commune.
 */
export function valeurParRarete(
  rareteDe: (id: string) => RareteEmoji | undefined,
  /** LE NIVEAU DU PERSONNAGE (Keko : « +1 par niveau »), injecté : la collection n'est pas ici. */
  niveauDe: (id: string) => number = () => 1,
): ValeurDeCarte {
  return (e) => puissanceDe(rareteDe(e.id), niveauDe(e.id))
}

/**
 * LA PUISSANCE D'UN EXEMPLAIRE, celle que la carte porte en médaillon et celle
 * que le deck encaisse — *une seule fonction, sinon le chiffre peint et le
 * chiffre joué se désaccordent au premier réglage.*
 */
export function puissanceDe(r: RareteEmoji | undefined, niveau = 1): number {
  const cran = r === undefined ? 0 : Math.max(0, RARETES_EMOJI.indexOf(r))
  return DECK.likesCommun + cran * DECK.likesParCran + Math.max(0, niveau - 1) * DECK.likesParNiveau
}

/** Ce que rapporte une main : la somme de ses cartes. */
export function likesDeLaMain(main: readonly EntreeDeck[], valeur: ValeurDeCarte): number {
  return main.reduce((t, e) => t + valeur(e), 0)
}

/** Ce que rapporte un tour complet du deck : toutes ses cartes jouées une fois. */
export function likesDuDeck(d: Deck, valeur: ValeurDeCarte): number {
  return likesDeLaMain(d.cartes, valeur)
}

/**
 * MET OU RETIRE UN EXEMPLAIRE. Le même : retiré. Une autre version du même
 * emoji déjà dans le deck : remplacée (*un emoji au plus une fois par deck*).
 * *Changer le deck relance sa partie* : le mélange en cours ne vaut plus, et
 * un deck qui n'a plus ses trente cartes s'arrête.
 */
export function basculerCarte(d: Deck, e: EntreeDeck, maintenant: number): Deck {
  const i = d.cartes.findIndex((x) => x.id === e.id)
  let cartes: EntreeDeck[]
  if (i >= 0) {
    cartes = d.cartes[i]!.v === e.v ? d.cartes.filter((_, k) => k !== i) : d.cartes.map((x, k) => (k === i ? e : x))
  } else {
    if (d.cartes.length >= DECK.taille) return d
    cartes = [...d.cartes, e]
  }
  return demarrer({ ...d, cartes, partie: null }, maintenant)
}

/** Les exemplaires qu'on ne possède plus quittent le deck (détruits, retirés). */
export function garderPossedees(d: Deck, possede: (e: EntreeDeck) => boolean, maintenant: number): Deck {
  // UN SEUL PASSAGE : `possede` peut compter ce qu'il laisse passer (voir
  // `garderPossedeesPartout`), il ne doit pas être appelé deux fois par carte.
  const cartes = d.cartes.filter(possede)
  if (cartes.length === d.cartes.length) return d
  return demarrer({ ...d, cartes, partie: null }, maintenant)
}

/** Lance la partie si le deck est complet et ne joue pas encore ; sinon rend le deck tel quel. */
export function demarrer(d: Deck, maintenant: number): Deck {
  if (d.partie !== null || !deckComplet(d)) return d
  return { ...d, partie: { graine: maintenant >>> 0, jouees: 0, depuis: maintenant } }
}

export interface MainsJouees {
  readonly deck: Deck
  /** Combien de mains le temps écoulé a jouées. */
  readonly mains: number
  /** Les Likes qu'elles ont rapportés, à ajouter à la collection. */
  readonly likes: number
  /** La dernière main jouée, celle qu'on montre ; `null` si aucune. */
  readonly derniere: readonly EntreeDeck[] | null
}

/**
 * REJOUE CE QUE LE TEMPS A JOUÉ : une main par `cadence` écoulée, le mélange
 * suivant quand le deck est vide. Au plus `horsLigneMax` de mains ; au-delà,
 * le reste est perdu et la cadence repart de maintenant.
 */
export function deckAJour(d: Deck, maintenant: number, valeur: ValeurDeCarte): MainsJouees {
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
  let derniere: readonly EntreeDeck[] | null = null
  let ordre = melange(d.cartes, graine)
  for (let i = 0; i < mains; i++) {
    const main = ordre.slice(jouees, jouees + DECK.main)
    likes += likesDeLaMain(main, valeur)
    derniere = main
    jouees += DECK.main
    if (jouees >= ordre.length) {
      graine = graineSuivante(graine)
      jouees = 0
      ordre = melange(d.cartes, graine)
    }
  }
  const depuis = borne ? maintenant : d.partie.depuis + mains * DECK.cadence
  return { deck: { ...d, partie: { graine, jouees, depuis } }, mains, likes, derniere }
}

/** Dans combien de millisecondes tombe la prochaine main ; `null` si le deck ne joue pas. */
export function prochaineMainDans(d: Deck, maintenant: number): number | null {
  if (d.partie === null) return null
  const a = deckAJour(d, maintenant, () => 0).deck
  return Math.max(0, a.partie!.depuis + DECK.cadence - maintenant)
}

const ID_VALIDE = /^[0-9a-z]+(-[0-9a-z]+)*$/

/** Relit une entrée gardée : `{ id, v }`, ou l'identifiant seul d'avant (version normale). */
function lireEntree(b: unknown): EntreeDeck | null {
  if (typeof b === 'string') return ID_VALIDE.test(b) ? { id: b, v: 'simple' } : null
  if (typeof b !== 'object' || b === null) return null
  const o = b as Record<string, unknown>
  if (typeof o.id !== 'string' || !ID_VALIDE.test(o.id)) return null
  const v = (VARIANTES as readonly string[]).includes(o.v as string) ? (o.v as Variante) : null
  return v === null ? null : { id: o.id, v }
}

/**
 * RELIT UN DECK GARDÉ, sans confiance : abîmé, il repart vide. `possede` dit
 * ce que la collection connaît encore ; un emoji en double ou une carte de trop
 * est écartée, et un deck incomplet ne joue pas.
 */
export function lireDeck(brut: unknown, possede: (e: EntreeDeck) => boolean, maintenant: number): Deck {
  if (typeof brut !== 'object' || brut === null) return deckVide()
  const o = brut as Record<string, unknown>
  if (!Array.isArray(o.cartes)) return deckVide()
  const cartes: EntreeDeck[] = []
  for (const b of o.cartes as unknown[]) {
    const e = lireEntree(b)
    if (e === null || cartes.some((x) => x.id === e.id) || !possede(e)) continue
    if (cartes.length >= DECK.taille) break
    cartes.push(e)
  }
  const p = typeof o.partie === 'object' && o.partie !== null ? (o.partie as Record<string, unknown>) : null
  const entier = (v: unknown): number | null => (typeof v === 'number' && Number.isInteger(v) && v >= 0 ? v : null)
  if (p !== null && cartes.length === DECK.taille && cartes.length === (o.cartes as unknown[]).length) {
    const graine = entier(p.graine)
    const jouees = entier(p.jouees)
    const depuis = typeof p.depuis === 'number' && Number.isFinite(p.depuis) ? p.depuis : null
    if (graine !== null && jouees !== null && jouees % DECK.main === 0 && jouees < DECK.taille && depuis !== null) {
      return avecNom({ cartes, partie: { graine, jouees, depuis } }, nomPropre(o.nom))
    }
  }
  // Un deck complet dont la partie est abîmée (ou absente) repart d'une partie neuve.
  return demarrer(avecNom({ cartes, partie: null }, nomPropre(o.nom)), maintenant)
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
export const DECKS_MAX = 3
/**
 * CE QU'ON RELIT D'UNE SAUVEGARDE, PLUS LARGE QUE CE QU'ON CRÉE : le plafond
 * est passé de six à TROIS (Keko, 27/10 : « on va établir un nombre de decks
 * max, 3 pour l'instant »), et un joueur qui en avait composé davantage les
 * garde — il ne peut plus en ajouter tant qu'il en a trois ou plus. *Baisser
 * une limite ne détruit pas ce qu'elle permettait.*
 */
// Vingt : le plafond des tests (Keko, 27/10) — les decks composés alors se relisent.
export const DECKS_LUS_MAX = 20

export interface Decks {
  readonly liste: readonly Deck[]
  /** L'index du deck qui joue (ou qui jouerait, s'il était complet). */
  readonly actif: number
}

/** Combien d'exemplaires d'une version on possède — injecté par la collection. */
export type CompteDExemplaires = (id: string, v: Variante) => number

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
    k === i ? demarrer({ ...d, partie: null }, maintenant) : d.partie === null ? d : { ...d, partie: null },
  )
  return { liste, actif: i }
}

/** Applique un changement à un deck ; seul l'actif garde (ou prend) une partie. */
export function modifierDeck(ds: Decks, i: number, f: (d: Deck) => Deck): Decks {
  const d = ds.liste[i]
  if (d === undefined) return ds
  const n0 = f(d)
  if (n0 === d) return ds
  const n = i === ds.actif || n0.partie === null ? n0 : { ...n0, partie: null }
  return { liste: ds.liste.map((x, k) => (k === i ? n : x)), actif: ds.actif }
}

/** Renomme le deck `i` ; un nom vide rend « Deck N ». La partie continue. */
export function renommerDeck(ds: Decks, i: number, nom: string): Decks {
  return modifierDeck(ds, i, (d) => {
    const n = nomPropre(nom)
    return n === d.nom ? d : avecNom(d, n)
  })
}

/** Combien d'exemplaires de cette version les AUTRES decks que `i` ont déjà pris. */
export function prisAilleurs(ds: Decks, i: number, id: string, v: Variante): number {
  let n = 0
  ds.liste.forEach((d, k) => {
    if (k !== i && d.cartes.some((e) => e.id === id && e.v === v)) n += 1
  })
  return n
}

/** Le premier autre deck qui tient cet exemplaire, ou `null` : pour le dire au joueur (« Deck 2 »). */
export function deckQuiTient(ds: Decks, i: number, id: string, v: Variante): number | null {
  const k = ds.liste.findIndex((d, j) => j !== i && d.cartes.some((e) => e.id === id && e.v === v))
  return k < 0 ? null : k
}

/**
 * COMBIEN D'EXEMPLAIRES DE CETTE VERSION LE DECK `i` PEUT ENCORE PRENDRE : ce
 * qu'on possède, moins ce que les autres decks tiennent déjà. *Un exemplaire
 * n'est que dans un deck à la fois* (Keko) ; celui que le deck `i` tient déjà
 * ne compte pas contre lui.
 */
export function disponibles(ds: Decks, i: number, id: string, v: Variante, compte: CompteDExemplaires): number {
  return Math.max(0, compte(id, v) - prisAilleurs(ds, i, id, v))
}

/**
 * MET OU RETIRE UN EXEMPLAIRE DANS LE DECK `i` : retirer est toujours possible.
 * **Un exemplaire qu'un autre deck tient se PREND à cet autre deck** (Keko :
 * « permettre de prendre les cartes d'autres decks, quitte à les rendre
 * incomplets ») : il le quitte, et ce deck-là s'arrête s'il jouait.
 */
export function basculerDansDeck(ds: Decks, i: number, e: EntreeDeck, compte: CompteDExemplaires, maintenant: number): Decks {
  const d = ds.liste[i]
  if (d === undefined) return ds
  const deja = d.cartes.some((x) => memeEntree(x, e))
  const k = !deja && disponibles(ds, i, e.id, e.v, compte) <= 0 ? deckQuiTient(ds, i, e.id, e.v) : null
  if (!deja && compte(e.id, e.v) <= 0) return ds
  const r = modifierDeck(ds, i, (x) => basculerCarte(x, e, maintenant))
  // Le deck `i` n'a rien pris (plein) : l'autre garde son exemplaire.
  if (r === ds || k === null) return r
  return modifierDeck(r, k, (x) => basculerCarte(x, e, maintenant))
}

/**
 * LES EXEMPLAIRES QU'ON N'A PLUS QUITTENT LES DECKS — et *jamais plus
 * d'exemplaires en jeu qu'on n'en possède* : deck par deck, dans l'ordre, ce
 * qui dépasse le compte sort du deck suivant. `prioritaire` passe en premier
 * et garde donc les siens (Keko : une fusion faite depuis l'éditeur d'un deck
 * retire l'exemplaire aux AUTRES decks d'abord).
 */
export function garderPossedeesPartout(ds: Decks, compte: CompteDExemplaires, maintenant: number, prioritaire?: number): Decks {
  const pris = new Map<string, number>()
  let r = ds
  const ordre = ds.liste.map((_, i) => i)
  if (prioritaire !== undefined && prioritaire >= 0 && prioritaire < ordre.length) {
    ordre.splice(prioritaire, 1)
    ordre.unshift(prioritaire)
  }
  for (const i of ordre) {
    r = modifierDeck(r, i, (d) =>
      garderPossedees(
        d,
        (e) => {
          const cle = `${e.id}#${e.v}`
          const n = pris.get(cle) ?? 0
          if (n >= compte(e.id, e.v)) return false
          pris.set(cle, n + 1)
          return true
        },
        maintenant,
      ),
    )
  }
  return r
}

/**
 * LES DECKS QUI ONT PERDU DES CARTES entre deux états (les index) : la fusion
 * le demande avant d'emporter des exemplaires (Keko : « il faut un message de
 * confirmation si des exemplaires sont retirés à des decks »).
 */
export function decksQuiPerdent(avant: Decks, apres: Decks): number[] {
  return avant.liste.flatMap((d, i) => ((apres.liste[i]?.cartes.length ?? 0) < d.cartes.length ? [i] : []))
}

export interface MainsJoueesDesDecks extends Omit<MainsJouees, 'deck'> {
  readonly decks: Decks
}

/** Ce que le temps a joué : le deck actif seul joue. */
export function decksAJour(ds: Decks, maintenant: number, valeur: ValeurDeCarte): MainsJoueesDesDecks {
  const r = deckAJour(deckActif(ds), maintenant, valeur)
  const decks = r.deck === deckActif(ds) ? ds : { liste: ds.liste.map((d, k) => (k === ds.actif ? r.deck : d)), actif: ds.actif }
  return { decks, mains: r.mains, likes: r.likes, derniere: r.derniere }
}

/**
 * RELIT LES DECKS GARDÉS, sans confiance — et relit aussi un deck seul d'avant
 * (`{ cartes, partie }`), qui devient le premier et l'actif. Abîmés, un deck
 * vide ; seul l'actif garde sa partie ; jamais plus d'exemplaires en jeu que
 * possédés (`garderPossedeesPartout`).
 */
export function lireDecks(brut: unknown, compte: CompteDExemplaires, maintenant: number): Decks {
  const possede = (e: EntreeDeck): boolean => compte(e.id, e.v) > 0
  if (typeof brut !== 'object' || brut === null) return decksVides()
  const o = brut as Record<string, unknown>
  let ds: Decks
  if (!Array.isArray(o.liste)) {
    // Le format d'avant : un seul deck.
    if (!Array.isArray(o.cartes)) return decksVides()
    ds = { liste: [lireDeck(brut, possede, maintenant)], actif: 0 }
  } else {
    const brutes = (o.liste as unknown[]).slice(0, Math.max(DECKS_MAX, DECKS_LUS_MAX))
    if (brutes.length === 0) return decksVides()
    const actif = typeof o.actif === 'number' && Number.isInteger(o.actif) && o.actif >= 0 && o.actif < brutes.length ? o.actif : 0
    const liste = brutes.map((b, k) => {
      const d = lireDeck(b, possede, maintenant)
      return k === actif ? d : d.partie === null ? d : { ...d, partie: null }
    })
    ds = { liste, actif }
  }
  return garderPossedeesPartout(ds, compte, maintenant)
}

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
 *
 * **IL NE SAIT RIEN DE CE QU'IL TIRE**, et c'est ce qui l'a fait sortir du
 * dossier des personnages quand les animaux sont arrivés : *un tirage ne
 * demande à une carte que son identité et son cran.* Le recopier pour le
 * second mode aurait garanti que les deux divergent au premier réglage de
 * `CHANCES` — la leçon des quatre fonctions qui peignaient chacune leur carte
 * avant `corpsCarte`.
 */
import type { Rng } from './rng.ts'

/**
 * LES QUATRE CRANS, ET C'EST LE DESSIN QUI DONNE LE COMPTE.
 *
 * Bronze, argent, or, diamant : *l'échelle des alliages a été réglée et
 * mesurée dans le mode descente*, qui a même SUPPRIMÉ un cinquième cran (le
 * laiton) parce que deux jaunes rompus voisins ne font pas deux crans.
 * **Quatre est ce que la carte peut porter**, donc tout mode qui tire des
 * cartes compte jusqu'à quatre.
 */
export const CRANS = ['commun', 'rare', 'epique', 'legendaire'] as const
export type Cran = (typeof CRANS)[number]

/**
 * LES CINQ CRANS — le mode emoji, et lui seul.
 *
 * Tranché par Keko : « commun, peu commun, rare, épique, légendaire », puis
 * « le mode emoji seulement » quand je lui ai demandé la portée. *Les quatre
 * métaux restent l'échelle des autres modes*, et les deux cohabitent.
 *
 * **LE CRAN NEUF S'INSÈRE, il ne renomme rien** : « peu commun » se glisse
 * entre le commun et le rare, donc une carte rare le reste. C'est ce qui a
 * rendu le passage gratuit.
 */
export const CRANS_CINQ = ['commun', 'peu-commun', 'rare', 'epique', 'legendaire'] as const
export type CranCinq = (typeof CRANS_CINQ)[number]

/** Tout ce qu'un paquet demande à une carte : son identité et son cran. */
export type Tirable<R extends string = Cran> = {
  readonly id: string
  readonly rarete: R
}

/**
 * UNE ÉCHELLE DE RARETÉ — ses crans, leurs chances, et ce qu'elle garantit.
 *
 * ***C'EST CE QUI A EMPÊCHÉ UN DÉFAUT MUET.*** La liste des crans était une
 * constante du module, donc `parCran` rangeait les cartes dans quatre cases
 * nommées : **une carte « peu commune » ne tombait dans aucune et
 * disparaissait du tirage**, sans une erreur — `tas.get(cran)?.push` ne dit
 * rien quand la case n'existe pas. *Un cinquième du catalogue serait devenu
 * intirable le jour où le cran neuf est arrivé.*
 *
 * Les trois grandeurs voyagent ENSEMBLE parce qu'elles se répondent : *une
 * table de chances qui ne somme pas à un sur les crans qu'on tire ne dit plus
 * ce qu'elle promet*, et une garantie doit nommer un cran qui existe.
 */
export interface Echelle<R extends string> {
  readonly crans: readonly R[]
  readonly chances: Readonly<Record<R, number>>
  readonly garanti: R
  /**
   * LES CHANCES DE LA DERNIÈRE CARTE, quand elle a sa propre table (le
   * fantasy : « la dernière carte du paquet est au moins peu commune et porte
   * la pitié », Keko). Absente : la dernière tire dans `chances`.
   */
  readonly derniere?: Readonly<Record<R, number>>
}

/**
 * LA PITIÉ : après `apres − 1` paquets d'affilée sans ce cran (ou mieux), le
 * suivant le garantit sur sa dernière carte. `sans` est le compte en cours,
 * tenu par la collection (`sansEpique`, `sansLegendaire`).
 */
export interface Pitie<R extends string> {
  readonly cran: R
  readonly apres: number
  readonly sans: number
}

/** Ce que le joueur apporte au tirage : ses pitiés, et ce qu'il a déjà. */
export interface OptionsPaquet<R extends string> {
  readonly pities?: readonly Pitie<R>[]
  /**
   * PAS DE DOUBLON DANS CE CRAN tant qu'il en manque : « une légendaire tirée
   * est toujours une qu'on n'a pas tant qu'il en manque » (Keko).
   */
  readonly sansDoublon?: { readonly cran: R; readonly possede: (id: string) => boolean }
}

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
export const CRAN_GARANTI: Cran = 'rare'

/**
 * CE QUE CHAQUE CRAN A DE CHANCES DE SORTIR, par carte tirée.
 *
 * **Ce n'est PAS la distribution du catalogue, et c'est tout l'intérêt.** Le
 * catalogue est ce que le monde contient — sept cartes sur dix y sont communes,
 * par construction, puisque la rareté se décide en quantiles — alors qu'un
 * paquet est ce qu'on DONNE. *La table du catalogue décrit le monde, celle-ci
 * décrit un cadeau* : si l'on tirait uniformément, un légendaire sortirait une
 * fois sur dix paquets et les crans ne diraient plus rien.
 *
 * Les quatre valeurs somment à 1. À régler avec Keko — voir `CRAN_GARANTI`.
 */
export const CHANCES: Readonly<Record<Cran, number>> = {
  commun: 0.85,
  rare: 0.11,
  epique: 0.032,
  legendaire: 0.008,
}

/**
 * LES CHANCES À CINQ CRANS — **et le haut de la table ne bouge pas.**
 *
 * *Le cran neuf prend sur le commun, pas sur les rares* : l'épique et le
 * légendaire gardent exactement leurs chances d'avant, le rare les siennes à
 * un cheveu près, et « peu commun » se taille sa part dans les quinze points
 * que le commun rend. **Ce qu'on ouvre en haut d'un paquet est donc le même
 * cadeau** ; seul le bas se détaille.
 *
 * Placeholders comme les quatre autres, et pour la même raison : *une
 * fréquence d'apparition ne se juge qu'en ouvrant des paquets.*
 */
export const CHANCES_CINQ: Readonly<Record<CranCinq, number>> = {
  commun: 0.7,
  'peu-commun': 0.16,
  rare: 0.1,
  epique: 0.032,
  legendaire: 0.008,
}

/** Les quatre métaux : la descente, les animaux, les peintures, les personnages. */
export const ECHELLE_QUATRE: Echelle<Cran> = {
  crans: CRANS,
  chances: CHANCES,
  garanti: CRAN_GARANTI,
}

/**
 * LES TAUX DU FANTASY, réglés dans `docs/fantasy.md` sur les cibles de Keko
 * (« plusieurs rares, 1–2 épiques par jour, une légendaire tous les 4–7
 * jours » à 24 paquets par jour) : cartes 1–4 81 / 16 / 2,5 / 0,4 / 0,02 %,
 * la cinquième au moins peu commune — 82,15 / 15 / 2,5 / 0,35 %. *Les quatre
 * premières somment à 99,92 %* : le reliquat revient au commun, comme tout
 * reliquat d'arrondi (`tirerCran`).
 */
export const ECHELLE_FANTASY: Echelle<CranCinq> = {
  crans: CRANS_CINQ,
  chances: { commun: 0.81, 'peu-commun': 0.16, rare: 0.025, epique: 0.004, legendaire: 0.0002 },
  garanti: 'peu-commun',
  derniere: { commun: 0, 'peu-commun': 0.8215, rare: 0.15, epique: 0.025, legendaire: 0.0035 },
}

/** Les pitiés du fantasy : une épique au 24ᵉ paquet sans épique, une légendaire au 200ᵉ. */
export const PITIE_EPIQUE = 24
export const PITIE_LEGENDAIRE = 200

/** Les cinq couleurs : le mode emoji. */
export const ECHELLE_CINQ: Echelle<CranCinq> = {
  crans: CRANS_CINQ,
  chances: CHANCES_CINQ,
  // LA GARANTIE RESTE « RARE », donc elle vaut le troisième cran sur cinq là
  // qu'elle valait le deuxième sur quatre : *une garantie nomme un NIVEAU, pas
  // une place dans la liste* — et c'est bien le même niveau qu'avant.
  garanti: 'rare',
}

/** Le rang d'un cran dans son échelle, du plus commun (0) au plus rare. */
export function rangDeRarete<R extends string>(r: R, echelle: Echelle<R>): number {
  return echelle.crans.indexOf(r)
}

/** Tire un cran selon les chances de l'échelle. */
function tirerCran<R extends string>(rng: Rng, echelle: Echelle<R>, chances = echelle.chances): R {
  let reste = rng.next()
  for (const r of echelle.crans) {
    reste -= chances[r]
    if (reste <= 0) return r
  }
  // Le reliquat d'arrondi revient au cran le plus commun : *un tirage ne doit
  // jamais pouvoir ne rien rendre.*
  return echelle.crans[0]!
}

/**
 * LE CATALOGUE RANGÉ PAR CRAN, pour tirer sans parcourir quatre mille cartes à
 * chaque fois. Rendu séparément de `ouvrirPaquet` pour qu'un écran qui ouvre
 * dix paquets ne le refasse pas dix fois.
 */
export function parCran<R extends string, T extends Tirable<R>>(
  cartes: readonly T[],
  echelle: Echelle<R>,
): Map<R, T[]> {
  const tas = new Map<R, T[]>()
  for (const r of echelle.crans) tas.set(r, [])
  for (const c of cartes) tas.get(c.rarete)?.push(c)
  return tas
}

/**
 * Tire une carte d'un cran donné, en descendant si le cran est vide.
 *
 * **Il DESCEND plutôt que de rendre `null`** : les crans du haut comptent cent
 * cartes sur quatre mille, et un catalogue plus petit — ou filtré — pourrait
 * n'en avoir aucune. *Un paquet doit toujours rendre cinq cartes*, donc un cran
 * introuvable retombe sur le cran d'en dessous plutôt que de laisser un trou.
 */
function tirerDansLeCran<R extends string, T extends Tirable<R>>(
  tas: Map<R, T[]>,
  cran: R,
  rng: Rng,
  deja: ReadonlySet<string>,
  echelle: Echelle<R>,
  options: OptionsPaquet<R> = {},
): T | null {
  for (let i = rangDeRarete(cran, echelle); i >= 0; i--) {
    let lot = (tas.get(echelle.crans[i]!) ?? []).filter((c) => !deja.has(c.id))
    if (lot.length === 0) continue
    // LE CRAN SANS DOUBLON ne tire que ce qui manque, tant qu'il en manque.
    const sd = options.sansDoublon
    if (sd !== undefined && sd.cran === echelle.crans[i]) {
      const manquantes = lot.filter((c) => !sd.possede(c.id))
      if (manquantes.length > 0) lot = manquantes
    }
    return lot[Math.floor(rng.next() * lot.length)] ?? null
  }
  // Puis vers le haut, en dernier recours : mieux vaut une carte trop rare
  // qu'une case vide.
  for (let i = rangDeRarete(cran, echelle) + 1; i < echelle.crans.length; i++) {
    const lot = (tas.get(echelle.crans[i]!) ?? []).filter((c) => !deja.has(c.id))
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
export function ouvrirPaquet<R extends string, T extends Tirable<R>>(
  tas: Map<R, T[]>,
  rng: Rng,
  echelle: Echelle<R>,
  options: OptionsPaquet<R> = {},
): T[] {
  const tirees: T[] = []
  const vues = new Set<string>()

  for (let i = 0; i < CARTES_PAR_PAQUET - 1; i++) {
    const c = tirerDansLeCran(tas, tirerCran(rng, echelle), rng, vues, echelle, options)
    if (c === null) break
    tirees.push(c)
    vues.add(c.id)
  }

  // LA GARANTIE : le cran tiré, ou le cran garanti si le tirage est tombé plus
  // bas. *Une garantie qui se contente du minimum enlèverait tout le haut de
  // la table* — un paquet peut parfaitement finir sur un légendaire.
  const cran = tirerCran(rng, echelle, echelle.derniere)
  let retenu =
    rangDeRarete(cran, echelle) >= rangDeRarete(echelle.garanti, echelle) ? cran : echelle.garanti
  // LA PITIÉ relève la dernière carte au cran promis, jamais ne la descend.
  for (const p of options.pities ?? []) {
    if (p.sans >= p.apres - 1 && rangDeRarete(p.cran, echelle) > rangDeRarete(retenu, echelle)) retenu = p.cran
  }
  const vedette = tirerDansLeCran(tas, retenu, rng, vues, echelle, options)
  if (vedette !== null) tirees.push(vedette)

  return tirees
}

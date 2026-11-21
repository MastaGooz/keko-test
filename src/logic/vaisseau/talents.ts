/**
 * LES TALENTS du jeu du vortex (Keko, 14/11 : « à chaque fois que la barre est remplie à 100 %, on met le jeu en pause
 * pour tout le monde ; on choisit un talent parmi 3 propositions, c'est-à-dire une amélioration »).
 *
 * (DEPUIS LE 21/11, DES CARTES PAR ARME ET PAR FACTION — Keko : « chaque arme a son propre pool de cartes (cadence, zone,
 * portée, dégâts… en fonction de la pertinence) ; quand le vaisseau level up on tire une carte parmi ce pool ; on y
 * ajoute aussi les cartes de la faction (ex. Xénoïdes : up régén, up PV) ; les upgrades en % (pas absolu), de rareté
 * commune (blanc), uncommon (vert), rare (bleu), épique (violet) et légendaire (orange) ; on signale la catégorie par
 * l'icône de l'arme ou le symbole de la faction » — « +5 / 8 / 12 / 18 / 25 % », et le moteur et l'aimant dans le pool
 * de la faction, choisis parmi trois et deux.)
 *
 * Une carte = une CIBLE (l'arme montée, ou la faction du vaisseau), une STAT, une RARETÉ (son bonus, en part). LE POOL DE
 * L'ARME SE LIT DANS L'ARME : une stat y est si l'arme porte de quoi la changer (des dégâts, un délai, une portée, un
 * rayon, une durée) — les trente-six armes, sans table à tenir. Le pool de la faction est écrit (`STATS_DE_FACTION`).
 * Le même niveau de la même partie propose les mêmes cartes. *Les chances et les bonus des raretés sont de Keko ; le
 * reste est de moi.* PUR : pas de hasard non seedé.
 */
import { CHAMPS_DE_DEGATS, hache, type Arme, type ConfigVaisseau } from './jeu.ts'
import type { Race } from './flotte.ts'

/** LES RARETÉS : leur bonus (une part : 0,05 = +5 %) et leur chance d'être tirée. */
export type Rarete = 'commune' | 'peuCommune' | 'rare' | 'epique' | 'legendaire'
export const RARETES: { id: Rarete; nom: string; bonus: number; chance: number }[] = [
  { id: 'commune', nom: 'Commune', bonus: 0.05, chance: 0.55 },
  { id: 'peuCommune', nom: 'Peu commune', bonus: 0.08, chance: 0.25 },
  { id: 'rare', nom: 'Rare', bonus: 0.12, chance: 0.13 },
  { id: 'epique', nom: 'Épique', bonus: 0.18, chance: 0.06 },
  { id: 'legendaire', nom: 'Légendaire', bonus: 0.25, chance: 0.01 },
]
export const rareteDe = (id: Rarete): (typeof RARETES)[number] => RARETES.find((r) => r.id === id)!
/** La rareté d'un tirage `u` de [0, 1[ : les chances cumulées. */
export function rareteTiree(u: number): Rarete {
  let cumul = 0
  for (const r of RARETES) {
    cumul += r.chance
    if (u < cumul) return r.id
  }
  return 'commune'
}

/** Ce qu'une carte d'arme peut changer. */
export type StatDArme = 'degats' | 'cadence' | 'portee' | 'zone' | 'duree'
/** Ce qu'une carte de faction peut changer. */
export type StatDeFaction = 'blindage' | 'moteur' | 'aimant' | 'repit' | 'regeneration' | 'bouclier' | 'recharge' | 'dephasage' | 'phase'
/**
 * LE POOL DE CHAQUE FACTION : ses points de vie, ce qui fait SA défense (les plaques de l'Empire ne se comptent pas en
 * pour cent : il a le répit, l'invulnérabilité après un coup ; la régénération des Xénoïdes ; le bouclier des Vectrans ;
 * le déphasage des Yhg'tharr), et le moteur et l'aimant, que toutes ont.
 */
export const STATS_DE_FACTION: Record<Race, StatDeFaction[]> = {
  humains: ['blindage', 'repit', 'moteur', 'aimant'],
  essaim: ['blindage', 'regeneration', 'moteur', 'aimant'],
  etheres: ['blindage', 'bouclier', 'recharge', 'moteur', 'aimant'],
  innommes: ['blindage', 'dephasage', 'phase', 'moteur', 'aimant'],
}

export type Cible = { sorte: 'arme'; arme: string } | { sorte: 'faction'; race: Race }
export type Talent = {
  id: string
  cible: Cible
  stat: StatDArme | StatDeFaction
  rarete: Rarete
  /** Le bonus, en part (0,12 = +12 %). */
  bonus: number
  appliquer: (c: ConfigVaisseau) => ConfigVaisseau
}

// ---------------------------------------------------------------- les armes : ce qu'elles portent, ce qu'on y change
/** (les branches d'une arme qui ne sont pas des effets : où elle tourne, d'où elle tire, ses ancres) */
const HORS_DES_EFFETS = new Set(['orbite', 'bouche', 'ancres'])
/** Toutes les valeurs numériques d'une arme sous ces clés, branches d'effet comprises. */
function valeurs(o: unknown, cles: ReadonlySet<string>): number[] {
  if (o === null || typeof o !== 'object' || Array.isArray(o)) return []
  const r: number[] = []
  for (const [cle, v] of Object.entries(o)) {
    if (HORS_DES_EFFETS.has(cle)) continue
    if (typeof v === 'number' && cles.has(cle)) r.push(v)
    else r.push(...valeurs(v, cles))
  }
  return r
}
/** L'arme où chaque valeur positive sous ces clés est changée par `f` (les branches d'effet comprises, pas les autres). */
function changer<A>(a: A, cles: ReadonlySet<string>, f: (v: number) => number): A {
  const passe = (o: unknown): unknown => {
    if (o === null || typeof o !== 'object' || Array.isArray(o)) return o
    const r: Record<string, unknown> = {}
    for (const [cle, v] of Object.entries(o)) r[cle] = HORS_DES_EFFETS.has(cle) ? v : typeof v === 'number' && cles.has(cle) ? (v > 0 ? f(v) : v) : passe(v)
    return r
  }
  return passe(a) as A
}
const CLES_DE_ZONE: ReadonlySet<string> = new Set(['rayon', 'largeur'])
const CLES_DE_DUREE: ReadonlySet<string> = new Set(['duree'])
const CLES_DE_CADENCE: ReadonlySet<string> = new Set(['cadence', 'tous'])

/** LE POOL D'UNE ARME : les stats qu'elle porte. */
export function statsDeLArme(a: Arme): StatDArme[] {
  const s: StatDArme[] = []
  if (valeurs(a, CHAMPS_DE_DEGATS).some((v) => v > 0)) s.push('degats')
  if (a.cadence > 0 && Number.isFinite(a.cadence)) s.push('cadence')
  if (a.portee > 0) s.push('portee')
  if (valeurs(a, CLES_DE_ZONE).some((v) => v > 0)) s.push('zone')
  if (valeurs(a, CLES_DE_DUREE).some((v) => v > 0)) s.push('duree')
  return s
}
/** L'arme améliorée de `k` (une part) sur `stat`. Les dégâts restent des entiers, et montent d'un au moins. */
export function armeAmelioree(a: Arme, stat: StatDArme, k: number): Arme {
  switch (stat) {
    case 'degats':
      return changer(a, CHAMPS_DE_DEGATS, (v) => Math.max(v + 1, Math.round(v * (1 + k))))
    case 'cadence':
      // (un délai plus court : la cadence de l'arme et l'intervalle de ce qu'elle pose)
      return changer(a, CLES_DE_CADENCE, (v) => v / (1 + k))
    case 'portee':
      // (plus loin : sa portée, et la vie de ses projectiles pour qu'ils y arrivent)
      return { ...a, portee: a.portee * (1 + k), vie: a.vie * (1 + k) }
    case 'zone':
      return changer(a, CLES_DE_ZONE, (v) => v * (1 + k))
    case 'duree':
      return changer(a, CLES_DE_DUREE, (v) => v * (1 + k))
  }
}
/** La configuration où la faction gagne `k` (une part) sur `stat`. */
export function factionAmelioree(c: ConfigVaisseau, stat: StatDeFaction, k: number): ConfigVaisseau {
  const f = 1 + k
  switch (stat) {
    case 'blindage':
      return { ...c, coque: c.coque * f }
    case 'moteur':
      return { ...c, vitesseMax: c.vitesseMax * f, poussee: c.poussee * f }
    case 'aimant':
      return { ...c, foreuse: { ...c.foreuse, aimant: c.foreuse.aimant * f } }
    case 'repit':
      return { ...c, invulnerabilite: c.invulnerabilite * f }
    case 'regeneration':
      return { ...c, regeneration: c.regeneration * f }
    case 'bouclier':
      return { ...c, bouclier: { ...c.bouclier, points: c.bouclier.points * f } }
    case 'recharge':
      return { ...c, bouclier: { ...c.bouclier, delai: c.bouclier.delai / f, regain: c.bouclier.regain * f } }
    case 'dephasage':
      return { ...c, dephasage: { ...c.dephasage, chance: c.dephasage.chance * f } }
    case 'phase':
      return { ...c, dephasage: { ...c.dephasage, duree: c.dephasage.duree * f } }
  }
}

/** Une carte : sa cible, sa stat, sa rareté. */
export function carte(cible: Cible, stat: StatDArme | StatDeFaction, rarete: Rarete): Talent {
  const bonus = rareteDe(rarete).bonus
  const id = `${cible.sorte === 'arme' ? cible.arme : cible.race}:${stat}`
  const appliquer =
    cible.sorte === 'arme'
      ? (c: ConfigVaisseau): ConfigVaisseau => ({ ...c, armes: c.armes.map((a) => (a.id === cible.arme ? armeAmelioree(a, stat as StatDArme, bonus) : a)) })
      : (c: ConfigVaisseau): ConfigVaisseau => factionAmelioree(c, stat as StatDeFaction, bonus)
  return { id, cible, stat, rarete, bonus, appliquer }
}

/**
 * LES TROIS CARTES proposées : le pool de l'arme montée et celui de la faction, réunis, trois stats différentes tirées de
 * la graine de la partie, du niveau et du rang du choix (un joueur qui en a deux à faire voit deux tirages) ; chacune sa
 * rareté.
 */
export function proposer(graine: number, niveau: number, rang: number, arme: Arme | undefined, race: Race): Talent[] {
  const pool: { cible: Cible; stat: StatDArme | StatDeFaction }[] = [
    ...(arme === undefined ? [] : statsDeLArme(arme).map((stat) => ({ cible: { sorte: 'arme', arme: arme.id } as Cible, stat }))),
    ...STATS_DE_FACTION[race].map((stat) => ({ cible: { sorte: 'faction', race } as Cible, stat })),
  ]
  const choisies: Talent[] = []
  for (let k = 0; k < 3 && pool.length > 0; k++) {
    const i = hache(hache(graine, niveau), hache(rang, k)) % pool.length
    const { cible, stat } = pool.splice(i, 1)[0]
    const u = (hache(hache(graine, niveau, 17), hache(rang, k, 29)) % 1000000) / 1000000
    choisies.push(carte(cible, stat, rareteTiree(u)))
  }
  return choisies
}

/**
 * LE CHOIX D'UN JOUEUR, quand un niveau est gagné : il en a un à faire, plus ceux qu'il avait EN RÉSERVE (« si personne
 * n'a choisi au bout de 30 secondes, le choix est mis en réserve pour le joueur qui n'a pas choisi, et il aura 2 choix
 * la prochaine fois »). `DUREE_DU_CHOIX` : le temps laissé, pour tout le monde.
 */
export const DUREE_DU_CHOIX = 30
export type Choix = { aFaire: number; rang: number }
export const ouvrirLeChoix = (reserve: number): Choix => ({ aFaire: 1 + Math.max(0, reserve), rang: 0 })
/** Un talent choisi : il en reste un de moins à faire (rend null quand tout est choisi). */
export const apresUnChoix = (ch: Choix): Choix | null => (ch.aFaire <= 1 ? null : { aFaire: ch.aFaire - 1, rang: ch.rang + 1 })
/** Le temps écoulé : ce qui reste à choisir part en réserve. */
export const reserveApresLeDelai = (ch: Choix): number => ch.aFaire

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
 *
 * LES BONUS S'ADDITIONNENT (Keko, 21/11 : « passe à l'addition » — d'abord ils se multipliaient, carte après carte) :
 * chaque stat de chaque cible garde LA SOMME de ses bonus (`Bonus`), et la configuration se recalcule de celle du
 * décollage, `base × (1 + somme)` — deux « +12 % » font +24 %, dix font +120 % ; la cadence, `délai ÷ (1 + somme)`.
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

/**
 * LE POOL CLASSIQUE (Keko, 21/11 : « chance de critique, dégâts des coups critiques, dégâts : ce qui est commun à toutes
 * les armes ; ensuite, zone d'effet pour les armes de type zone, portée pour les armes qui utilisent une portée,
 * cadence pour les armes qui se déclenchent à intervalles réguliers, dégâts du feu pour les armes qui appliquent le feu
 * — uniquement les dégâts périodiques de l'effet —, l'effet corrosif — la vulnérabilité qu'il cause — et le
 * ralentissement du givre » ; et « la durée des armes posées », choisie parmi quatre oublis. Le nombre de projectiles ou
 * de créatures, « extrêmement puissant », est gardé de côté.)
 */
export type StatDArme = 'degats' | 'critique' | 'critiques' | 'cadence' | 'portee' | 'zone' | 'pose' | 'feu' | 'corrosion' | 'givre'
/**
 * LES CARTES DE FACTION (Keko, 21/11) : pour toutes, le blindage (les points de vie des Xénoïdes), la vitesse, la
 * maniabilité, l'aimant (la distance) et l'expérience (+X % par pépite) ; l'Empire, la RÉCUPÉRATION (22/11 : la chance
 * qu'une roche détruite fasse tomber une plaque — la réparation et « +1 plaque », du 21/11, sont parties) ; les
 * Xénoïdes, la régénération ; les Vectrans, LA CAPACITÉ du bouclier seule (« on ne touche pas au temps qu'il
 * met à se régénérer ») ; les Yhg'tharr, la chance de déphasage, EN POINTS à l'échelle (+1 à +5 points selon la rareté,
 * choisi parmi trois : en relatif, une carte valait à peine +0,2 point), pas sa durée.
 */
//
// (L'EMPIRE N'A PLUS QU'UNE CARTE À LUI, LA RÉCUPÉRATION — Keko, 22/11 : « il a deux cartes alors que les autres n'en ont
// qu'une, et une des deux ne peut arriver qu'en légendaire ; on vire la carte qui augmente le nombre de plaques ; les
// plaques ne se régénèrent plus avec le temps » ; la carte : « augmente les chances d'obtenir des plaques en détruisant
// les astéroïdes » — voir `recuperation` dans `jeu.ts`. La réparation et « +1 plaque » sont parties.)
export type StatDeFaction = 'blindage' | 'moteur' | 'maniabilite' | 'aimant' | 'experience' | 'recuperation' | 'regeneration' | 'bouclier' | 'dephasage'
export const STATS_DE_FACTION: Record<Race, StatDeFaction[]> = {
  humains: ['blindage', 'recuperation', 'moteur', 'maniabilite', 'aimant', 'experience'],
  essaim: ['blindage', 'regeneration', 'moteur', 'maniabilite', 'aimant', 'experience'],
  etheres: ['blindage', 'bouclier', 'moteur', 'maniabilite', 'aimant', 'experience'],
  innommes: ['blindage', 'dephasage', 'moteur', 'maniabilite', 'aimant', 'experience'],
}
/** Les cartes qui ne paraissent qu'à une rareté (aucune depuis le départ de « +1 plaque », 22/11). */
export const SEULEMENT_EN: Partial<Record<StatDArme | StatDeFaction, Rarete>> = {}
/**
 * LES CHANCES SE COMPTENT EN POINTS, À L'ÉCHELLE DE LA RARETÉ (le déphasage — Keko ; le critique, pareil : en relatif,
 * « +12 % » d'1 % de chance n'en faisait que 1,12) : la commune +1 point, la légendaire +5.
 */
export const POINTS_DE_CHANCE: Record<Rarete, number> = { commune: 0.01, peuCommune: 0.02, rare: 0.03, epique: 0.04, legendaire: 0.05 }
const EN_POINTS: ReadonlySet<string> = new Set(['critique', 'dephasage'])

export type Cible = { sorte: 'arme'; arme: string } | { sorte: 'faction'; race: Race }
export type Talent = {
  id: string
  cible: Cible
  stat: StatDArme | StatDeFaction
  rarete: Rarete
  /** Le bonus, en part (0,12 = +12 %). */
  bonus: number
}
/** LES BONUS DU VOL : par cible et par stat, la somme des bonus pris (en part). */
export type Bonus = { id: string; cible: Cible; stat: StatDArme | StatDeFaction; somme: number }[]
/** Les bonus, une carte de plus : sa somme grossit de son bonus. */
export function ajouterLeBonus(b: Bonus, ta: Talent): Bonus {
  const deja = b.find((x) => x.id === ta.id)
  return deja === undefined ? [...b, { id: ta.id, cible: ta.cible, stat: ta.stat, somme: ta.bonus }] : b.map((x) => (x === deja ? { ...x, somme: x.somme + ta.bonus } : x))
}
/** LA CONFIGURATION AVEC SES BONUS : celle du décollage, chaque stat à `base × (1 + somme)`. */
export function avecLesBonus(base: ConfigVaisseau, b: Bonus): ConfigVaisseau {
  let c = base
  for (const x of b) {
    // (le critique est au vaisseau : la chance en points, les dégâts critiques en points du facteur — 150 % +12 % : 162 %)
    if (x.stat === 'critique') c = { ...c, passifs: { ...c.passifs, critique: c.passifs.critique + x.somme } }
    else if (x.stat === 'critiques') c = { ...c, passifs: { ...c.passifs, critiqueFacteur: c.passifs.critiqueFacteur + x.somme } }
    else c = x.cible.sorte === 'arme' ? { ...c, armes: c.armes.map((a) => (a.id === (x.cible as { arme: string }).arme ? armeAmelioree(a, x.stat as StatDArme, x.somme) : a)) } : factionAmelioree(c, x.stat as StatDeFaction, x.somme)
  }
  return c
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
const CLES_DE_CADENCE: ReadonlySet<string> = new Set(['cadence', 'tous'])
/** (les branches de ce qu'une arme POSE — tourelles, balises, mines, flaques de napalm, œufs — et leur durée) */
const POSEES = ['pose', 'balise', 'mine', 'napalm', 'ponte'] as const
const CLES_DU_FEU: ReadonlySet<string> = new Set(['dpsBrulure'])
const CLES_DU_GIVRE: ReadonlySet<string> = new Set(['ralenti'])
/** Ce que l'arme pose, et sa durée. */
const poseesDe = (a: Arme): { cle: (typeof POSEES)[number]; duree: number }[] => POSEES.flatMap((cle) => {
  const b = (a as Record<string, unknown>)[cle] as { duree?: number } | undefined
  return b !== undefined && typeof b.duree === 'number' && b.duree > 0 ? [{ cle, duree: b.duree }] : []
})
/** L'arme corrode-t-elle (son acide, ses mines, sa traînée) — et de combien rend-elle vulnérable. */
export const corrodeDe = (a: Arme): number[] => [a.crachat?.acide.bonus, a.mine?.corrosion?.bonus, a.givre?.corrosion?.bonus, a.parasite?.acide?.bonus].filter((b): b is number => b !== undefined && b > 0)

/** LE POOL D'UNE ARME : le commun (dégâts, critique), puis ce qu'elle porte. */
export function statsDeLArme(a: Arme): StatDArme[] {
  const s: StatDArme[] = ['degats', 'critique', 'critiques']
  if (a.cadence > 0 && Number.isFinite(a.cadence)) s.push('cadence')
  if (a.portee > 0) s.push('portee')
  if (valeurs(a, CLES_DE_ZONE).some((v) => v > 0)) s.push('zone')
  if (poseesDe(a).length > 0) s.push('pose')
  if (valeurs(a, CLES_DU_FEU).some((v) => v > 0)) s.push('feu')
  if (corrodeDe(a).length > 0) s.push('corrosion')
  if (valeurs(a, CLES_DU_GIVRE).some((v) => v > 0 && v < 1)) s.push('givre')
  return s
}
/**
 * L'ARME AMÉLIORÉE de `k` (la somme des bonus) sur `stat` : `base × (1 + k)`. Les dégâts restent des entiers et montent
 * d'un au moins ; la cadence raccourcit aussi l'intervalle de ce qu'elle pose ; le ralentissement grandit la part de
 * vitesse ÔTÉE (un insecte au ralenti 0,5 perd la moitié de sa vitesse ; +20 % : 0,6, il en garde 0,4 — un dixième au
 * moins). Le critique est au vaisseau : voir `avecLesBonus`.
 */
export function armeAmelioree(a: Arme, stat: StatDArme, k: number): Arme {
  switch (stat) {
    case 'degats':
      return changer(a, CHAMPS_DE_DEGATS, (v) => Math.max(v + 1, Math.round(v * (1 + k))))
    case 'cadence':
      return changer(a, CLES_DE_CADENCE, (v) => v / (1 + k))
    case 'portee':
      return { ...a, portee: a.portee * (1 + k), vie: a.vie * (1 + k) }
    case 'zone':
      return changer(a, CLES_DE_ZONE, (v) => v * (1 + k))
    case 'pose': {
      const r: Record<string, unknown> = { ...a }
      for (const { cle } of poseesDe(a)) r[cle] = { ...(a as unknown as Record<string, object>)[cle], duree: (a as unknown as Record<string, { duree: number }>)[cle].duree * (1 + k) }
      return r as Arme
    }
    case 'feu':
      return changer(a, CLES_DU_FEU, (v) => Math.max(v + 1, Math.round(v * (1 + k))))
    case 'corrosion':
      return {
        ...a,
        ...(a.crachat !== undefined ? { crachat: { ...a.crachat, acide: { ...a.crachat.acide, bonus: a.crachat.acide.bonus * (1 + k) } } } : {}),
        ...(a.mine?.corrosion !== undefined ? { mine: { ...a.mine, corrosion: { ...a.mine.corrosion, bonus: a.mine.corrosion.bonus * (1 + k) } } } : {}),
        ...(a.givre?.corrosion !== undefined ? { givre: { ...a.givre, corrosion: { ...a.givre.corrosion, bonus: a.givre.corrosion.bonus * (1 + k) } } } : {}),
        ...(a.parasite?.acide !== undefined ? { parasite: { ...a.parasite, acide: { ...a.parasite.acide, bonus: a.parasite.acide.bonus * (1 + k) } } } : {}),
      }
    case 'givre':
      return changer(a, CLES_DU_GIVRE, (v) => (v < 1 ? Math.max(0.1, 1 - (1 - v) * (1 + k)) : v))
    case 'critique':
    case 'critiques':
      return a
  }
}
/** La configuration où la faction gagne `k` (la somme des bonus) sur `stat`. */
export function factionAmelioree(c: ConfigVaisseau, stat: StatDeFaction, k: number): ConfigVaisseau {
  const f = 1 + k
  switch (stat) {
    case 'blindage':
      return { ...c, coque: c.coque * f }
    case 'moteur':
      return { ...c, vitesseMax: c.vitesseMax * f, poussee: c.poussee * f }
    case 'maniabilite':
      return { ...c, rotation: c.rotation * f, virage: c.virage * f }
    case 'aimant':
      return { ...c, foreuse: { ...c.foreuse, aimant: c.foreuse.aimant * f } }
    case 'experience':
      return { ...c, invasion: { ...c.invasion, gainXp: (c.invasion.gainXp ?? 1) * f } }
    case 'recuperation':
      // (la chance qu'une roche fasse tomber une plaque — voir `chanceDePlaque`)
      return { ...c, recuperation: c.recuperation * f }
    case 'regeneration':
      return { ...c, regeneration: c.regeneration * f }
    case 'bouclier':
      return { ...c, bouclier: { ...c.bouclier, points: c.bouclier.points * f } }
    case 'dephasage':
      // (en points : `k` s'ajoute à la chance)
      return { ...c, dephasage: { ...c.dephasage, chance: c.dephasage.chance + k } }
  }
}

/** Une carte : sa cible, sa stat, sa rareté. */
export function carte(cible: Cible, stat: StatDArme | StatDeFaction, rarete: Rarete): Talent {
  // (une chance, des points à l'échelle ; le reste, le bonus de la rareté)
  const bonus = EN_POINTS.has(stat) ? POINTS_DE_CHANCE[rarete] : rareteDe(rarete).bonus
  return { id: `${cible.sorte === 'arme' ? `arme-${cible.arme}` : cible.race}:${stat}`, cible, stat, rarete, bonus }
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
    // (la rareté d'abord : une carte qui n'est que d'une rareté n'est tirée qu'à elle — voir `SEULEMENT_EN`)
    const u = (hache(hache(graine, niveau, 17), hache(rang, k, 29)) % 1000000) / 1000000
    const rarete = rareteTiree(u)
    const permis = pool.filter((x) => SEULEMENT_EN[x.stat] === undefined || SEULEMENT_EN[x.stat] === rarete)
    if (permis.length === 0) break
    const choisie = permis[hache(hache(graine, niveau), hache(rang, k)) % permis.length]
    pool.splice(pool.indexOf(choisie), 1)
    choisies.push(carte(choisie.cible, choisie.stat, rarete))
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

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
// (`speciale` : LES CARTES SPÉCIALES — voir `MUTATIONS` : jamais tirée au hasard, elle a ses niveaux)
export type Rarete = 'commune' | 'peuCommune' | 'rare' | 'epique' | 'legendaire' | 'speciale'
export const RARETES: { id: Rarete; nom: string; bonus: number; chance: number }[] = [
  { id: 'commune', nom: 'Commune', bonus: 0.05, chance: 0.55 },
  { id: 'peuCommune', nom: 'Peu commune', bonus: 0.08, chance: 0.25 },
  { id: 'rare', nom: 'Rare', bonus: 0.12, chance: 0.13 },
  { id: 'epique', nom: 'Épique', bonus: 0.18, chance: 0.06 },
  { id: 'legendaire', nom: 'Légendaire', bonus: 0.25, chance: 0.01 },
  { id: 'speciale', nom: 'Spéciale', bonus: 0, chance: 0 },
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
 * « +12 % » d'1 % de chance n'en faisait que 1,12) : la commune +2 points, la légendaire +10 (Keko, 22/11 : « plutôt
 * que 1, 2, 3, 4, 5, on fait 2, 4, 6, 8, 10 » pour le critique, puis « passe le déphasage en 2, 4, 6, 8, 10 »).
 */
export const POINTS_DE_CHANCE: Record<Rarete, number> = { commune: 0.02, peuCommune: 0.04, rare: 0.06, epique: 0.08, legendaire: 0.1, speciale: 0 }
/**
 * LES STATS DES CARTES « TOUTES LES ARMES » : celles d'une arme, critique compris (Keko, 22/11 : « une carte critique
 * globale deux fois moins forte qui concerne toutes les armes, comme pour le reste ») ; une
 * carte n'est proposée que si une arme portée au moins a cette stat, et son bonus est LA MOITIÉ de celui de la rareté.
 */
export const STATS_GLOBALES: StatDArme[] = ['degats', 'critique', 'critiques', 'cadence', 'portee', 'zone', 'pose', 'feu', 'corrosion', 'givre']
export const PART_GLOBALE = 0.5
const EN_POINTS: ReadonlySet<string> = new Set(['critique', 'dephasage'])

/**
 * LA CIBLE D'UNE CARTE : une arme, la faction — ou TOUTES LES ARMES (Keko, 22/11 : « des catégories globales à toutes
 * les armes, mais divisées par 2 — +X % aux dégâts, à la cadence, à la zone de toutes les armes ; avant, il faut
 * vérifier que le joueur possède au moins une arme qui a un rapport avec la zone » — voir `STATS_GLOBALES`).
 */
export type Cible = { sorte: 'arme'; arme: string } | { sorte: 'faction'; race: Race } | { sorte: 'armes' }
export type Talent = {
  id: string
  cible: Cible
  stat: StatDArme | StatDeFaction | 'mutation'
  rarete: Rarete
  /** Le bonus, en part (0,12 = +12 %). */
  bonus: number
  /** Une carte spéciale : laquelle (voir `MUTATIONS`). */
  mutation?: string
}
/** LES BONUS DU VOL : par cible et par stat, la somme des bonus pris (en part) ; les cartes spéciales prises, dans l'ordre. */
export type Bonus = { id: string; cible: Cible; stat: StatDArme | StatDeFaction | 'mutation'; somme: number }[]
/** Les bonus, une carte de plus : sa somme grossit de son bonus. */
export function ajouterLeBonus(b: Bonus, ta: Talent): Bonus {
  const deja = b.find((x) => x.id === ta.id)
  return deja === undefined ? [...b, { id: ta.id, cible: ta.cible, stat: ta.stat, somme: ta.bonus }] : b.map((x) => (x === deja ? { ...x, somme: x.somme + ta.bonus } : x))
}
/** LA CONFIGURATION AVEC SES BONUS : celle du décollage, chaque stat à `base × (1 + somme)`. */
export function avecLesBonus(base: ConfigVaisseau, b: Bonus): ConfigVaisseau {
  let c = base
  for (const x of b) {
    // (« toutes les armes » vient à la fin, ci-dessous : il vaut aussi pour une arme prise après lui)
    if (x.cible.sorte === 'armes') continue
    // (le critique d'une arme est à elle : la chance en points, les dégâts critiques en points du facteur — 150 % +12 % : 162 %)
    // (une carte spéciale change la configuration elle-même — voir `MUTATIONS`)
    if (x.stat === 'mutation') c = MUTATIONS.find((mu) => `mutation:${mu.id}` === x.id)?.appliquer(c) ?? c
    else c = x.cible.sorte === 'arme' ? { ...c, armes: c.armes.map((a) => (a.id === (x.cible as { arme: string }).arme ? armeAmelioree(a, x.stat as StatDArme, x.somme) : a)) } : factionAmelioree(c, x.stat as StatDeFaction, x.somme)
  }
  // TOUTES LES ARMES : chaque arme portée qui a cette stat — même prise après la carte
  for (const x of b) {
    if (x.cible.sorte !== 'armes') continue
    const stat = x.stat as StatDArme
    // (le critique de toutes les armes est celui du vaisseau, que chaque arme ajoute au sien)
    if (stat === 'critique') c = { ...c, passifs: { ...c.passifs, critique: c.passifs.critique + x.somme } }
    else if (stat === 'critiques') c = { ...c, passifs: { ...c.passifs, critiqueFacteur: c.passifs.critiqueFacteur + x.somme } }
    else c = { ...c, armes: c.armes.map((a) => (statsDeLArme(a).includes(stat) ? armeAmelioree(a, stat, x.somme) : a)) }
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
// (… ET `eclat`, le rayon de l'effondrement de la Singularité — 22/11 : il restait à sa taille sous les cartes « Zone »)
const CLES_DE_ZONE: ReadonlySet<string> = new Set(['rayon', 'largeur', 'eclat'])
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
 * moins). Le critique est à l'arme (`Arme.critique`), celui de toutes les armes au vaisseau.
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
    // (LE CRITIQUE EST À L'ARME — Keko, 22/11 : en points, ajoutés à ceux du vaisseau — voir `Arme.critique`)
    case 'critique':
      return { ...a, critique: (a.critique ?? 0) + k }
    case 'critiques':
      return { ...a, critiques: (a.critiques ?? 0) + k }
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
  // (toutes les armes : la moitié)
  const bonus = cible.sorte === 'armes' ? (stat === 'critique' ? POINTS_DE_CHANCE[rarete] : rareteDe(rarete).bonus) * PART_GLOBALE : EN_POINTS.has(stat) ? POINTS_DE_CHANCE[rarete] : rareteDe(rarete).bonus
  return { id: `${cible.sorte === 'arme' ? `arme-${cible.arme}` : cible.sorte === 'armes' ? 'armes' : cible.race}:${stat}`, cible, stat, rarete, bonus }
}

// ---------------------------------------------------------------- les cartes spéciales
/**
 * LES CARTES SPÉCIALES (Keko, 22/11 : « des cartes spéciales qui ajoutent une nouvelle arme, qui peut ensuite avoir son
 * propre pool d'amélioration, et d'autres qui modifient l'arme principale dans son gameplay ; au niveau 10, puis 20 et
 * 30, au moins une nouvelle arme et une amélioration de gameplay de l'arme principale — la troisième, un des deux types
 * au hasard ; ensuite, tous les 10 niveaux, des améliorations de gameplay des armes possédées ; le joueur peut avoir
 * jusqu'à 4 armes, ou miser sur une seule arme boostée à fond ; 6 nouvelles armes par faction — chaque vaisseau de la
 * faction peut les avoir — et 6 variations pour chaque arme » ; « 3 variations au choix » après le niveau 30 ; les cartes
 * du premier prototype deviennent des variations). Une carte spéciale est due tous les `NIVEAU_SPECIAL` niveaux ; au
 * premier choix d'un niveau, s'il en est dû une (manquée au délai, elle revient au choix suivant), trois spéciales :
 * pour les `NIVEAUX_MIXTES` premières, des NOUVELLES ARMES (la faction, jusqu'à `ARMES_MAX` armes) et des VARIATIONS DE
 * L'ARME PRINCIPALE, au moins une de chaque ; ensuite, des variations des armes possédées. Chacune se prend une fois.
 * Une nouvelle arme est À PART : son nom, ses dessins, SES CARTES ordinaires (voir `proposer`). Une variation change
 * toutes les armes de son nom (celles qu'elle ajoute comprises : une tourelle, des drones). *Les chiffres sont de moi.*
 */
export const NIVEAU_SPECIAL = 10
export const NIVEAUX_MIXTES = 3
export const ARMES_MAX = 4
export type Mutation = { id: string; arme: string; sorte: 'arme' | 'variation'; nom: string; dit: string; race?: Race; appliquer: (c: ConfigVaisseau) => ConfigVaisseau }
/** L'arme de départ de ce nom (pas une ajoutée par une variation). */
const principale = (c: ConfigVaisseau, id: string): Arme | undefined => c.armes.find((a) => a.id === id && a.ajoutee !== true) ?? c.armes.find((a) => a.id === id)
/** Toutes les armes de ce nom, changées. */
const changerLes = (c: ConfigVaisseau, id: string, f: (a: Arme) => Arme): ConfigVaisseau => ({ ...c, armes: c.armes.map((a) => (a.id === id ? f(a) : a)) })
/** Une arme ajoutée, tirée d'une autre : elle tire tout autour, du centre du vaisseau. */
const ajoutee = (a: Arme, place: number, f: Partial<Arme>): Arme => {
  const { bouche: _b, orbite: _o, ...reste } = a
  return { ...reste, ...f, ajoutee: true, tousSens: true, place }
}
const ajouter = (c: ConfigVaisseau, id: string, f: (a: Arme) => Arme[]): ConfigVaisseau => {
  const a = principale(c, id)
  return a === undefined ? c : { ...c, armes: [...c.armes, ...f(a)] }
}
/** (l'orbite des drones de la Sentinelle) */
const ORBITE_DES_DRONES = { rayon: 20, vitesse: 1.7, laisse: 120, vol: 170, braquage: 7, autour: 26, tour: 2 }
/** `n` drones de l'arme, en orbite, qui partent tirer ses obus sur l'ennemi proche (`decale` : leur place sur l'orbite). */
const drones = (a: Arme, f: Partial<Arme>, n = 2, decale = 0): Arme[] => Array.from({ length: n }, (_, k) => ajoutee(a, 10 + k, { ...f, infaillible: false, orbite: { ...ORBITE_DES_DRONES, phase: decale + (k * 2 * Math.PI) / n } }))
const fois = (a: Arme, k: number): number => Math.max(1, Math.round(a.degats * k))
// (les variations qu'on retrouve d'une arme à l'autre)
const V = {
  tourelle: (a: Arme): Arme[] => [ajoutee(a, 9, { cadence: a.cadence * 0.75, degats: fois(a, 0.6) })],
  incendiaire: (a: Arme): Arme => ({ ...a, incendiaire: { duree: 3, dps: fois(a, 0.6) } }),
  cryo: (a: Arme): Arme => ({ ...a, gel: { duree: 1.5, ralenti: 0.5 } }),
  fragments: (a: Arme): Arme => ({ ...a, fragments: { nombre: 6, degats: fois(a, 0.25), vitesse: 160, vie: 0.25 } }),
  perforant: (a: Arme): Arme => ({ ...a, perforant: true, vie: a.vie * 1.5 }),
  ricochet: (a: Arme): Arme => ({ ...a, ricochet: { rebonds: 2, portee: 80, part: 0.7 } }),
  explosif: (a: Arme): Arme => ({ ...a, zone: { rayon: 12 } }),
  gerbe: (n: number, ecart: number, part: number) => (a: Arme): Arme => ({ ...a, gerbe: { nombre: n, ecart }, degats: fois(a, part) }),
  lourd: (a: Arme): Arme => ({ ...a, zone: a.zone === undefined ? undefined : { rayon: a.zone.rayon * 1.6 }, degats: fois(a, 1.3), cadence: a.cadence * 1.4 }),
}
const variation = (id: string, arme: string, nom: string, dit: string, appliquer: (c: ConfigVaisseau) => ConfigVaisseau): Mutation => ({ id, arme, sorte: 'variation', nom, dit, appliquer })
const changerA = (arme: string, f: (a: Arme) => Arme) => (c: ConfigVaisseau): ConfigVaisseau => changerLes(c, arme, f)
const ajouterA = (arme: string, f: (a: Arme) => Arme[]) => (c: ConfigVaisseau): ConfigVaisseau => ajouter(c, arme, f)

/** LES NOUVELLES ARMES D'UNE FACTION (aux chiffres du vortex, ses dégâts fois dix) : la (ou les) arme(s) qu'elle ajoute. */
export type ArmeDeFaction = { id: string; nom: string; dit: string; race: Race; icone: string; armes: () => Arme[] }
const nouvelle = (a: Omit<Arme, 'dispersion' | 'guide' | 'vitesse' | 'vie'> & Partial<Arme>): Arme => ({ dispersion: 0, guide: false, vitesse: 0, vie: 0, ...a, ajoutee: true, tousSens: true, place: 20 })
export const ARMES_DE_FACTION: ArmeDeFaction[] = [
  // L'EMPIRE : de l'artillerie, de l'électricité, des escortes
  { id: 'railgun', nom: 'Railgun', dit: 'Un trait de métal qui transperce toute une ligne d’ennemis.', race: 'humains', icone: 'imp-railgun', armes: () => [nouvelle({ id: 'railgun', cadence: 2.6, degats: 110, portee: 190, rail: { largeur: 3 } })] },
  { id: 'obusier', nom: 'Obusier', dit: 'De lourds obus qui explosent sur une large zone.', race: 'humains', icone: 'imp-obusier', armes: () => [nouvelle({ id: 'obusier', cadence: 2.4, degats: 70, portee: 150, vitesse: 140, vie: 1.3, dispersion: 0.05, zone: { rayon: 26 } })] },
  { id: 'roquettes', nom: 'Roquettes', dit: 'Quatre roquettes qui fondent sur les ennemis proches.', race: 'humains', icone: 'imp-roquettes', armes: () => [nouvelle({ id: 'roquettes', cadence: 2.8, degats: 30, portee: 130, vitesse: 150, vie: 1.6, essaim: { nombre: 4, eventail: 2.4, acces: 120, pointe: 230, braquage: 8, chaos: 2.4, pas: 0.25, calme: 1.3, reprise: 45 } })] },
  // (LA BOBINE TESLA — Keko, 22/11 : « l'arc tesla, c'est une chaîne d'éclair bis » : une boule de foudre lente qui
  // traverse la mêlée en foudroyant les trois insectes les plus proches toutes les 0,4 s ; l'identifiant reste `tesla`)
  { id: 'tesla', nom: 'Bobine tesla', dit: 'Une boule de foudre lente qui foudroie les ennemis autour d’elle.', race: 'humains', icone: 'imp-tesla', armes: () => [nouvelle({ id: 'tesla', cadence: 2.6, degats: 22, portee: 120, sphere: { vitesse: 45, duree: 3, rayon: 42, periode: 0.4, vitesseTir: 0, foudre: { cibles: 3 } } })] },
  { id: 'grenades', nom: 'Lance-grenades', dit: 'Deux grenades à chaque tir, qui explosent à l’impact.', race: 'humains', icone: 'imp-grenades', armes: () => [nouvelle({ id: 'grenades', cadence: 1.5, degats: 32, portee: 110, vitesse: 150, vie: 0.9, dispersion: 0.08, zone: { rayon: 15 }, gerbe: { nombre: 2, ecart: 0.3 } })] },
  // (DES MINI-AVIONS, PAS DES DRONES — Keko, 22/11 : « on a déjà les drones de la Sentinelle » : l'orbite des drones, plus
  // large et plus vive ; la page les dessine en petits chasseurs)
  { id: 'escorte', nom: 'Escorte', dit: 'Deux mini-avions qui mitraillent les ennemis autour du vaisseau.', race: 'humains', icone: 'imp-escorte', armes: () => [0, 1].map((k) => ({ ...nouvelle({ id: 'escorte', cadence: 0.45, degats: 12, portee: 70, vitesse: 320, vie: 0.5, dispersion: 0.05 }), place: 20 + k, orbite: { ...ORBITE_DES_DRONES, rayon: 30, vitesse: 2.6, vol: 230, braquage: 9, autour: 34, phase: k * Math.PI } })) },
]
export const armeDeFaction = (id: string): ArmeDeFaction | undefined => ARMES_DE_FACTION.find((x) => x.id === id)

export const MUTATIONS: Mutation[] = [
  // LES NOUVELLES ARMES (une carte chacune)
  ...ARMES_DE_FACTION.map((af): Mutation => ({ id: `arme-${af.id}`, arme: af.id, sorte: 'arme', nom: af.nom, dit: af.dit, race: af.race, appliquer: (c) => (c.armes.some((a) => a.id === af.id) ? c : { ...c, armes: [...c.armes, ...af.armes()] }) })),
  // LE CANON LASER
  variation('laser-tourelle', 'laser', 'Tourelle', 'Une tourelle tire des lasers tout autour du vaisseau.', ajouterA('laser', V.tourelle)),
  variation('laser-drones', 'laser', 'Drones', 'Deux drones en orbite tirent des lasers sur les ennemis proches.', ajouterA('laser', (a) => drones(a, { cadence: 1.4, degats: fois(a, 0.45), portee: 70, vie: 0.5 }))),
  variation('laser-perforant', 'laser', 'Perforant', 'Les lasers traversent les ennemis et touchent toute leur ligne.', changerA('laser', V.perforant)),
  variation('laser-ricochet', 'laser', 'Ricochet', 'Chaque laser rebondit sur deux autres ennemis proches.', changerA('laser', V.ricochet)),
  variation('laser-rafale', 'laser', 'Rafale', 'Chaque tir part en trois lasers, en éventail.', changerA('laser', V.gerbe(3, 0.22, 0.5))),
  variation('laser-cryo', 'laser', 'Cryogénique', 'Les lasers gèlent ce qu’ils touchent et le ralentissent.', changerA('laser', V.cryo)),
  // LA MITRAILLEUSE
  variation('mitraille-jumelee', 'mitraille', 'Canons jumelés', 'Chaque tir part en double : deux balles côte à côte.', changerA('mitraille', V.gerbe(2, 0.12, 0.7))),
  variation('mitraille-tourelle', 'mitraille', 'Tourelle', 'Une mitrailleuse arrose tout autour du vaisseau.', ajouterA('mitraille', (a) => [ajoutee(a, 9, { cadence: a.cadence * 0.9, degats: fois(a, 0.6), portee: a.portee * 0.9 })])),
  variation('mitraille-incendiaire', 'mitraille', 'Incendiaires', 'Les balles enflamment les ennemis : ils brûlent trois secondes.', changerA('mitraille', V.incendiaire)),
  variation('mitraille-drones', 'mitraille', 'Drones', 'Deux drones en orbite mitraillent les ennemis proches.', ajouterA('mitraille', (a) => drones(a, { cadence: 0.3, degats: fois(a, 0.6), portee: 70 }))),
  variation('mitraille-perforante', 'mitraille', 'Perforantes', 'Les balles traversent les ennemis.', changerA('mitraille', V.perforant)),
  variation('mitraille-explosive', 'mitraille', 'Explosives', 'Chaque balle explose à l’impact.', changerA('mitraille', V.explosif)),
  // LES MISSILES
  variation('missile-salve', 'minimissile', 'Salve', 'Chaque tir lâche trois missiles en éventail.', changerA('minimissile', V.gerbe(3, 0.35, 0.6))),
  variation('missile-fragmentation', 'minimissile', 'Fragmentation', 'Chaque explosion projette six éclats brûlants tout autour.', changerA('minimissile', V.fragments)),
  variation('missile-lanceur', 'minimissile', 'Lance-missiles', 'Un lanceur tire des missiles tout autour du vaisseau.', ajouterA('minimissile', (a) => [ajoutee(a, 9, { cadence: a.cadence * 0.75, degats: fois(a, 0.7) })])),
  variation('missile-drones', 'minimissile', 'Drones', 'Deux drones en orbite tirent des missiles sur les ennemis proches.', ajouterA('minimissile', (a) => drones(a, { cadence: 2.5, degats: fois(a, 0.5), portee: 80, vie: 1.2 }))),
  variation('missile-incendiaire', 'minimissile', 'Incendiaires', 'Les missiles enflamment ce qu’ils touchent.', changerA('minimissile', V.incendiaire)),
  variation('missile-cryo', 'minimissile', 'Cryogéniques', 'Les missiles gèlent ce qu’ils touchent et le ralentissent.', changerA('minimissile', V.cryo)),
  // LE RAILGUN
  variation('railgun-incendiaire', 'railgun', 'Incendiaire', 'Tout ce que le trait traverse s’enflamme.', changerA('railgun', V.incendiaire)),
  variation('railgun-cryo', 'railgun', 'Cryogénique', 'Tout ce que le trait traverse gèle.', changerA('railgun', V.cryo)),
  variation('railgun-large', 'railgun', 'Rail large', 'Un trait deux fois et demie plus large.', changerA('railgun', (a) => ({ ...a, rail: { largeur: (a.rail?.largeur ?? 3) * 2.5 } }))),
  variation('railgun-jumeau', 'railgun', 'Rail jumeau', 'Un second rail, un peu moins fort, tire aussi.', ajouterA('railgun', (a) => [ajoutee(a, 21, { degats: fois(a, 0.6) })])),
  variation('railgun-eclats', 'railgun', 'Rail à éclats', 'Chaque ennemi traversé projette des éclats autour de lui.', changerA('railgun', (a) => ({ ...V.fragments(a), fragments: { nombre: 4, degats: fois(a, 0.2), vitesse: 160, vie: 0.2 } }))),
  variation('railgun-surcharge', 'railgun', 'Surcharge', 'Deux fois plus de traits, un peu moins forts.', changerA('railgun', (a) => ({ ...a, cadence: a.cadence * 0.5, degats: fois(a, 0.6) }))),
  // L'OBUSIER
  variation('obusier-fragmentation', 'obusier', 'Fragmentation', 'Chaque explosion projette six éclats brûlants tout autour.', changerA('obusier', V.fragments)),
  variation('obusier-incendiaire', 'obusier', 'Incendiaires', 'Les obus enflamment ce qu’ils touchent.', changerA('obusier', V.incendiaire)),
  variation('obusier-cryo', 'obusier', 'Cryogéniques', 'Les obus gèlent ce qu’ils touchent.', changerA('obusier', V.cryo)),
  variation('obusier-salve', 'obusier', 'Salve', 'Chaque tir lâche trois obus en éventail.', changerA('obusier', V.gerbe(3, 0.3, 0.55))),
  variation('obusier-drones', 'obusier', 'Drones', 'Deux drones en orbite tirent des obus sur les ennemis proches.', ajouterA('obusier', (a) => drones(a, { cadence: 2.2, degats: fois(a, 0.5), portee: 90, vie: 1 }))),
  variation('obusier-lourd', 'obusier', 'Gros calibre', 'Des obus plus lents à venir, plus forts, qui explosent plus large.', changerA('obusier', V.lourd)),
  // L'ESSAIM DE ROQUETTES
  variation('roquettes-nuee', 'roquettes', 'Nuée', 'Deux fois plus de roquettes, un peu moins fortes.', changerA('roquettes', (a) => ({ ...a, essaim: a.essaim === undefined ? undefined : { ...a.essaim, nombre: a.essaim.nombre * 2 }, degats: fois(a, 0.6) }))),
  variation('roquettes-explosives', 'roquettes', 'Explosives', 'Les roquettes explosent à l’impact.', changerA('roquettes', (a) => ({ ...a, zone: { rayon: 14 } }))),
  variation('roquettes-incendiaires', 'roquettes', 'Incendiaires', 'Les roquettes enflamment ce qu’elles touchent.', changerA('roquettes', V.incendiaire)),
  variation('roquettes-cryo', 'roquettes', 'Cryogéniques', 'Les roquettes gèlent ce qu’elles touchent.', changerA('roquettes', V.cryo)),
  variation('roquettes-perforantes', 'roquettes', 'Perforantes', 'Les roquettes traversent les ennemis.', changerA('roquettes', V.perforant)),
  variation('roquettes-ricochet', 'roquettes', 'Ricochet', 'Chaque roquette rebondit sur deux autres ennemis.', changerA('roquettes', V.ricochet)),
  // L'ARC TESLA
  variation('tesla-rebonds', 'tesla', 'Orage', 'La bobine foudroie trois ennemis de plus à chaque décharge.', changerA('tesla', (a) => ({ ...a, sphere: a.sphere === undefined ? undefined : { ...a.sphere, foudre: { cibles: (a.sphere.foudre?.cibles ?? 3) + 3 } } }))),
  variation('tesla-incendiaire', 'tesla', 'Incendiaire', 'Ce que la foudre touche s’enflamme.', changerA('tesla', V.incendiaire)),
  variation('tesla-cryo', 'tesla', 'Cryogénique', 'Ce que la foudre touche gèle.', changerA('tesla', V.cryo)),
  variation('tesla-surtension', 'tesla', 'Surtension', 'La bobine décharge deux fois plus souvent.', changerA('tesla', (a) => ({ ...a, sphere: a.sphere === undefined ? undefined : { ...a.sphere, periode: a.sphere.periode * 0.5 } }))),
  variation('tesla-champ', 'tesla', 'Champ tesla', 'Un champ électrique blesse les ennemis tout près du vaisseau.', changerA('tesla', (a) => ({ ...a, aura: { rayon: 34, dps: fois(a, 0.4) } }))),
  variation('tesla-jumeau', 'tesla', 'Grande bobine', 'Une boule plus grande, qui dure plus longtemps.', changerA('tesla', (a) => ({ ...a, sphere: a.sphere === undefined ? undefined : { ...a.sphere, rayon: a.sphere.rayon * 1.5, duree: a.sphere.duree * 1.4 } }))),
  // LE LANCE-GRENADES
  variation('grenades-fragmentation', 'grenades', 'Fragmentation', 'Chaque explosion projette six éclats brûlants tout autour.', changerA('grenades', V.fragments)),
  variation('grenades-incendiaires', 'grenades', 'Incendiaires', 'Les grenades enflamment ce qu’elles touchent.', changerA('grenades', V.incendiaire)),
  variation('grenades-cryo', 'grenades', 'Cryogéniques', 'Les grenades gèlent ce qu’elles touchent.', changerA('grenades', V.cryo)),
  variation('grenades-rafale', 'grenades', 'Rafale', 'Quatre grenades à chaque tir.', changerA('grenades', (a) => ({ ...a, gerbe: { nombre: 4, ecart: 0.25 }, degats: fois(a, 0.7) }))),
  variation('grenades-drones', 'grenades', 'Drones', 'Deux drones en orbite lancent des grenades sur les ennemis proches.', ajouterA('grenades', (a) => drones(a, { cadence: 1.8, degats: fois(a, 0.6), portee: 80, gerbe: undefined }))),
  variation('grenades-lourdes', 'grenades', 'Gros calibre', 'Des grenades plus lentes à venir, plus fortes, qui explosent plus large.', changerA('grenades', V.lourd)),
  // LES DRONES D'ESCORTE
  variation('escorte-plus', 'escorte', 'Escadrille', 'Deux mini-avions de plus.', ajouterA('escorte', (a) => drones(a, { cadence: a.cadence, degats: a.degats, portee: a.portee }, 2, Math.PI / 2).map((d, k) => ({ ...d, place: 22 + k })))),
  variation('escorte-perforantes', 'escorte', 'Perforantes', 'Les balles des mini-avions traversent les ennemis.', changerA('escorte', V.perforant)),
  variation('escorte-incendiaires', 'escorte', 'Incendiaires', 'Les balles des mini-avions enflamment les ennemis.', changerA('escorte', V.incendiaire)),
  variation('escorte-cryo', 'escorte', 'Cryogéniques', 'Les balles des mini-avions gèlent les ennemis.', changerA('escorte', V.cryo)),
  variation('escorte-ricochet', 'escorte', 'Ricochet', 'Chaque balle des mini-avions rebondit sur deux autres ennemis.', changerA('escorte', V.ricochet)),
  variation('escorte-roquettes', 'escorte', 'Roquettes', 'Les mini-avions tirent des roquettes qui explosent.', changerA('escorte', (a) => ({ ...V.explosif(a), cadence: a.cadence * 2.5, degats: fois(a, 2) }))),
]
/** La carte d'une spéciale. */
export const carteSpeciale = (mu: Mutation): Talent => ({ id: `mutation:${mu.id}`, cible: { sorte: 'arme', arme: mu.arme }, stat: 'mutation', rarete: 'speciale', bonus: 0, mutation: mu.id })
/** Les spéciales déjà prises, d'après les bonus du vol. */
export const mutationsPrises = (b: Bonus): string[] => b.filter((x) => x.stat === 'mutation').map((x) => x.id.slice('mutation:'.length))
/** Les noms des armes portées, une fois chacun, l'arme principale d'abord. */
export const armesPortees = (armes: Arme[]): Arme[] => armes.filter((a, i) => armes.findIndex((b) => b.id === a.id) === i)

/** LES TROIS SPÉCIALES d'un choix (voir `MUTATIONS`), ou rien : `k`, la combientième spéciale (1 au niveau 10). */
function proposerLesSpeciales(graine: number, niveau: number, k: number, principaleId: string, portees: string[], race: Race, prises: string[]): Talent[] {
  const variationsDe = (ids: string[]): Mutation[] => MUTATIONS.filter((mu) => mu.sorte === 'variation' && ids.includes(mu.arme) && !prises.includes(mu.id))
  const nouvelles = portees.length < ARMES_MAX ? MUTATIONS.filter((mu) => mu.sorte === 'arme' && mu.race === race && !portees.includes(mu.arme) && !prises.includes(mu.id)) : []
  let cle = 0
  const tirer = (liste: Mutation[]): Mutation | undefined => (liste.length === 0 ? undefined : liste.splice(hache(hache(graine, niveau, 41), cle++) % liste.length, 1)[0])
  const choisies: Mutation[] = []
  if (k <= NIVEAUX_MIXTES) {
    const v = variationsDe([principaleId])
    const a = [...nouvelles]
    const une = tirer(a)
    const deux = tirer(v)
    if (une !== undefined) choisies.push(une)
    if (deux !== undefined) choisies.push(deux)
    const reste = [...a, ...v]
    while (choisies.length < 3) {
      const t = tirer(reste)
      if (t === undefined) break
      choisies.push(t)
    }
  } else {
    const v = variationsDe(portees)
    for (let j = 0; j < 3; j++) {
      const t = tirer(v)
      if (t !== undefined) choisies.push(t)
    }
  }
  return choisies.map(carteSpeciale)
}

/**
 * LES TROIS CARTES proposées : le pool de l'arme montée et celui de la faction, réunis, trois stats différentes tirées de
 * la graine de la partie, du niveau et du rang du choix (un joueur qui en a deux à faire voit deux tirages) ; chacune sa
 * rareté. LES SPÉCIALES D'ABORD (voir `MUTATIONS`) : au premier choix, s'il en est dû une — une par `NIVEAU_SPECIAL`
 * niveaux — et qu'il en reste, trois spéciales.
 */
// (`armes` : toutes celles que porte le vaisseau — CHAQUE NOUVELLE ARME A SON POOL, réuni à celui de l'arme principale)
export function proposer(graine: number, niveau: number, rang: number, arme: Arme | undefined, race: Race, prises: string[] = [], armes: Arme[] = arme === undefined ? [] : [arme]): Talent[] {
  const portees = armesPortees(armes.length > 0 ? armes : arme === undefined ? [] : [arme])
  // (AU CHOIX OÙ ELLE EST DUE, quel que soit son rang : plusieurs dues à la fois — un banc au niveau 60 —, elles se suivent ;
  // prise, la suivante n'est plus due et le choix d'après est ordinaire)
  let speciales: Talent[] = []
  if (arme !== undefined && Math.floor(niveau / NIVEAU_SPECIAL) > prises.length) {
    speciales = proposerLesSpeciales(graine, niveau, prises.length + 1, arme.id, portees.map((a) => a.id), race, prises)
    if (speciales.length >= 3) return speciales
  }
  // (MOINS DE TROIS SPÉCIALES QUI RESTENT — toutes les variations d'une arme seule prises — : des cartes ordinaires complètent)
  const pool: { cible: Cible; stat: StatDArme | StatDeFaction }[] = [
    ...portees.flatMap((a) => statsDeLArme(a).map((stat) => ({ cible: { sorte: 'arme', arme: a.id } as Cible, stat }))),
    ...STATS_DE_FACTION[race].map((stat) => ({ cible: { sorte: 'faction', race } as Cible, stat })),
    // (toutes les armes : une stat qu'une arme portée au moins a)
    ...STATS_GLOBALES.filter((stat) => portees.some((a) => statsDeLArme(a).includes(stat))).map((stat) => ({ cible: { sorte: 'armes' } as Cible, stat })),
  ]
  const choisies: Talent[] = []
  for (let k = 0; k < 3 && pool.length > 0; k++) {
    // (la rareté d'abord : une carte qui n'est que d'une rareté n'est tirée qu'à elle — voir `SEULEMENT_EN`)
    const u = (hache(hache(graine, niveau, 17), hache(rang, k, 29)) % 1000000) / 1000000
    const rarete = rareteTiree(u)
    const permis = pool.filter((x) => SEULEMENT_EN[x.stat as StatDArme | StatDeFaction] === undefined || SEULEMENT_EN[x.stat as StatDArme | StatDeFaction] === rarete)
    if (permis.length === 0) break
    const choisie = permis[hache(hache(graine, niveau), hache(rang, k)) % permis.length]
    pool.splice(pool.indexOf(choisie), 1)
    choisies.push(carte(choisie.cible, choisie.stat, rarete))
  }
  return speciales.length > 0 ? [...speciales, ...choisies].slice(0, 3) : choisies
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

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
// (LA PORTÉE FAIT AUSSI LA ZONE — Keko, 22/11 : « on peut pas fusionner la portée et la zone, en considérant que la portée
// d'une zone est son rayon ? » puis « va pour Portée qui fait les deux » : une seule carte, qui allonge le tir ET agrandit
// tout ce qui est une zone — voir rmeAmelioree ; plus de carte « Zone »)
export type StatDArme = 'degats' | 'critique' | 'critiques' | 'cadence' | 'portee' | 'pose' | 'feu' | 'corrosion' | 'givre' | 'electrocution'
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
// les astéroïdes » — voir `recuperation` dans `jeu.ts`. La réparation et « +1 plaque » sont parties. Depuis le 23/11, les
// plaques tombent des insectes, plus des astéroïdes : la carte grandit leur chance.)
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
export const STATS_GLOBALES: StatDArme[] = ['degats', 'critique', 'critiques', 'cadence', 'portee', 'pose', 'feu', 'corrosion', 'givre', 'electrocution']
export const PART_GLOBALE = 0.5
/**
 * LES ÉTATS — LE FEU, LA CORROSION, LE GIVRE — NE SE PRENNENT QUE POUR TOUTES LES ARMES (Keko, 23/11 : « supprimer les
 * cartes de givre, corrosion et feu propres aux armes ; à partir du moment où on a une attaque qui applique la corrosion,
 * le feu ou la glace, on débloque la carte qui l'augmente pour toutes les armes ; une augmentation d'un état concerne
 * toujours toutes les armes ») : plus de carte d'état à une arme ; la carte « toutes les armes » paraît dès qu'une arme
 * portée applique l'état, et, seule à le faire, ELLE VAUT LE BONUS ENTIER de sa rareté (pas la moitié des autres).
 */
// (… ET L'ÉLECTROCUTION, la quatrième — Keko, 24/11 — voir `Arme.electrocution`)
export const ETATS: ReadonlySet<StatDArme> = new Set<StatDArme>(['feu', 'corrosion', 'givre', 'electrocution'])
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
    // (… SAUF UNE CARTE D'ÉLÉMENT : spéciale, elle change la configuration ici — sa cible « toutes les armes » la faisait
    // passer, et elle ne s'appliquait jamais — 24/11)
    if (x.cible.sorte === 'armes' && x.stat !== 'mutation') continue
    // (le critique d'une arme est à elle : la chance en points, les dégâts critiques en points du facteur — 150 % +12 % : 162 %)
    // (une carte spéciale change la configuration elle-même — voir `MUTATIONS`)
    if (x.stat === 'mutation') c = MUTATIONS.find((mu) => `mutation:${mu.id}` === x.id)?.appliquer(c) ?? c
    else c = x.cible.sorte === 'arme' ? { ...c, armes: c.armes.map((a) => (a.id === (x.cible as { arme: string }).arme ? armeAmelioree(a, x.stat as StatDArme, x.somme) : a)) } : factionAmelioree(c, x.stat as StatDeFaction, x.somme)
  }
  // TOUTES LES ARMES : chaque arme portée qui a cette stat — même prise après la carte
  for (const x of b) {
    if (x.cible.sorte !== 'armes' || x.stat === 'mutation') continue
    const stat = x.stat as StatDArme
    // (le critique de toutes les armes est celui du vaisseau, que chaque arme ajoute au sien)
    if (stat === 'critique') c = { ...c, passifs: { ...c.passifs, critique: c.passifs.critique + x.somme } }
    else if (stat === 'critiques') c = { ...c, passifs: { ...c.passifs, critiqueFacteur: c.passifs.critiqueFacteur + x.somme } }
    // (la brûlure unique du vortex grandit avec la carte « Brûlure » — voir `ConfigVaisseau.brulureDesEtats`)
    else if (stat === 'feu' && c.brulureDesEtats > 0) c = { ...c, brulureDesEtats: c.brulureDesEtats * (1 + x.somme), armes: c.armes.map((a) => (statsDeLArme(a).includes(stat) ? armeAmelioree(a, stat, x.somme) : a)) }
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
/** L'arme a-t-elle une zone (un rayon, une largeur, un éclat) — ce que la carte « Portée » agrandit aussi. */
export const aUneZone = (a: Arme): boolean => valeurs(a, CLES_DE_ZONE).some((v) => v > 0)
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
/**
 * LA CORROSION DU VORTEX MAJORE DE 20 % (Keko, 23/11 : 25 % au lieu de 35 % ; 24/11 : « passe l'augmentation des dégâts
 * subis par corrosion à 20 % au lieu de 25 % ») : toutes ses sources — la carte Corrosion du laser, l'acide, les mines, les
 * traînées des vaisseaux — à 20 % ; la carte « Corrosion » grandit ce bonus ; le Nova Drifter garde les 35 % de ses fiches.
 */
export const CORROSION_DU_VORTEX = 0.2
/** L'arme dont chaque corrosion vaut `bonus` (voir `CORROSION_DU_VORTEX`). */
export function corrosionPosee(a: Arme, bonus: number): Arme {
  return {
    ...a,
    ...(a.crachat !== undefined && a.crachat.acide.bonus > 0 ? { crachat: { ...a.crachat, acide: { ...a.crachat.acide, bonus } } } : {}),
    ...(a.mine?.corrosion !== undefined ? { mine: { ...a.mine, corrosion: { ...a.mine.corrosion, bonus } } } : {}),
    ...(a.givre?.corrosion !== undefined ? { givre: { ...a.givre, corrosion: { ...a.givre.corrosion, bonus } } } : {}),
    ...(a.parasite?.acide !== undefined ? { parasite: { ...a.parasite, acide: { ...a.parasite.acide, bonus } } } : {}),
    ...(a.corrosif !== undefined ? { corrosif: { ...a.corrosif, bonus } } : {}),
  }
}
/**
 * L'ÉLECTROCUTION DU VORTEX (Keko, 24/11 — voir `Arme.electrocution`) : posée sur les armes électriques de la Sentinelle —
 * les drones à arcs, la chaîne d'éclairs, la tempête. *Chiffres de moi, à rejuger* : 20 % de chance par coup direct, un
 * arc de 20 (les dégâts d'un arc de drone) à 45 au plus (le saut de la chaîne) ; la durée, celle des états (6 s).
 */
// (L'ARC À 60, LE MÊME PARTOUT — Keko, 24/11 : « 20 me paraît trop faible comparé aux dégâts de brûlure » — voir
// `ConfigVaisseau.arcDElectrocution`, qui le tient)
export const ELECTROCUTION_DU_VORTEX = { duree: 6, chance: 0.2, degats: 60, saut: 45 }
/** L'arme électrique de la Sentinelle électrocute (voir `ELECTROCUTION_DU_VORTEX`) ; les autres, telles quelles. */
export const electrocutionPosee = (a: Arme): Arme => (a.eclair === true || a.chaine !== undefined || a.aura !== undefined ? { ...a, electrocution: { ...ELECTROCUTION_DU_VORTEX } } : a)
export const corrodeDe = (a: Arme): number[] => [a.crachat?.acide.bonus, a.mine?.corrosion?.bonus, a.givre?.corrosion?.bonus, a.parasite?.acide?.bonus, a.corrosif?.bonus].filter((b): b is number => b !== undefined && b > 0)

/** LE POOL D'UNE ARME : le commun (dégâts, critique), puis ce qu'elle porte. */
export function statsDeLArme(a: Arme): StatDArme[] {
  const s: StatDArme[] = ['degats', 'critique', 'critiques']
  if (a.cadence > 0 && Number.isFinite(a.cadence)) s.push('cadence')
  // (la portée, ou une zone : son rayon est sa portée)
  if (a.portee > 0 || aUneZone(a)) s.push('portee')
  if (poseesDe(a).length > 0) s.push('pose')
  if (valeurs(a, CLES_DU_FEU).some((v) => v > 0)) s.push('feu')
  if (corrodeDe(a).length > 0) s.push('corrosion')
  if (valeurs(a, CLES_DU_GIVRE).some((v) => v > 0 && v < 1)) s.push('givre')
  if (a.electrocution !== undefined) s.push('electrocution')
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
    case 'portee': {
      // (le tir va plus loin — sa portée, la vie de ses projectiles —, et tout ce qui est une zone grandit d'autant)
      const z = changer(a, CLES_DE_ZONE, (v) => v * (1 + k))
      return a.portee > 0 ? { ...z, portee: a.portee * (1 + k), vie: a.vie * (1 + k) } : z
    }
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
        ...(a.corrosif !== undefined ? { corrosif: { ...a.corrosif, bonus: a.corrosif.bonus * (1 + k) } } : {}),
      }
    case 'givre':
      return changer(a, CLES_DU_GIVRE, (v) => (v < 1 ? Math.max(0.1, 1 - (1 - v) * (1 + k)) : v))
    // (la chance qu'un coup fasse sauter un arc, en relatif : 20 % +25 % → 25 % ; jamais plus que toujours)
    case 'electrocution':
      return a.electrocution === undefined ? a : { ...a, electrocution: { ...a.electrocution, chance: Math.min(1, a.electrocution.chance * (1 + k)) } }
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
      // (la chance qu'un insecte fasse tomber une plaque — voir `chanceDePlaque`)
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
  // (un état : le bonus entier — voir `ETATS`)
  const bonus = cible.sorte === 'armes' ? (stat === 'critique' ? POINTS_DE_CHANCE[rarete] : rareteDe(rarete).bonus) * (ETATS.has(stat as StatDArme) ? 1 : PART_GLOBALE) : EN_POINTS.has(stat) ? POINTS_DE_CHANCE[rarete] : rareteDe(rarete).bonus
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
// (`element` : une carte d'élément — Keko, 24/11 — voir `ELEMENTAIRES` ; `etat`, l'état qu'une arme portée doit appliquer pour qu'elle paraisse)
export type Mutation = { id: string; arme: string; sorte: 'arme' | 'variation' | 'element'; nom: string; dit: string; race?: Race; etat?: StatDArme; appliquer: (c: ConfigVaisseau) => ConfigVaisseau }
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
/** Une carte d'élément : elle paraît si une arme portée applique `etat`, et allume sa règle (voir `ConfigVaisseau.elementaires`). */
const element = (id: string, etat: StatDArme, nom: string, dit: string, regle: keyof ConfigVaisseau['elementaires']): Mutation => ({ id, arme: '', sorte: 'element', etat, nom, dit, appliquer: (c) => ({ ...c, elementaires: { ...c.elementaires, [regle]: true } }) })
const changerA = (arme: string, f: (a: Arme) => Arme) => (c: ConfigVaisseau): ConfigVaisseau => changerLes(c, arme, f)
const ajouterA = (arme: string, f: (a: Arme) => Arme[]) => (c: ConfigVaisseau): ConfigVaisseau => ajouter(c, arme, f)

/** LES NOUVELLES ARMES D'UNE FACTION (aux chiffres du vortex, ses dégâts fois dix) : la (ou les) arme(s) qu'elle ajoute. */
export type ArmeDeFaction = { id: string; nom: string; dit: string; race: Race; icone: string; armes: () => Arme[] }
const nouvelle = (a: Omit<Arme, 'dispersion' | 'guide' | 'vitesse' | 'vie'> & Partial<Arme>): Arme => ({ dispersion: 0, guide: false, vitesse: 0, vie: 0, ...a, ajoutee: true, tousSens: true, place: 20 })
export const ARMES_DE_FACTION: ArmeDeFaction[] = [
  // L'EMPIRE : de l'artillerie, de l'électricité, des escortes
  // (ÉQUILIBRÉES SUR LES ARMES DE DÉPART — Keko, 22/11 : « il faut vraiment que les armes qu'on gagne soient équivalentes
  // aux armes qu'on a au début, à un niveau d'amélioration égal » : mesurées par `npm run equilibrage` — `faction-<id>` —,
  // elles étaient de 0,56 à 0,83, le Chasseur de 0,97 à 1,15 ; réglées, de 0,96 à 1,04. ET PLUS DE PUNCH : la balle du
  // railgun abat un insecte d'un coup et le suivant derrière lui, plus rare ; l'obus explose sur 40 au lieu de 26 ; la
  // bobine foudroie moins souvent, plus fort)
  // (UNE BALLE, PLUS UN TRAIT — Keko, 22/11 : « un projectile très rapide qui laisse une traînée, juste visuelle, et qui perd
  // en dégâts à chaque cible traversée » ; un quart à chaque insecte — voir `Arme.balle`)
  { id: 'railgun', nom: 'Railgun', dit: 'Une balle très rapide qui transperce les ennemis, un peu moins forte à chacun.', race: 'humains', icone: 'imp-railgun', armes: () => [nouvelle({ id: 'railgun', cadence: 3, degats: 160, portee: 190, vitesse: 900, vie: 190 / 900, perforant: true, balle: { part: 0.75, calibre: 2 } })] },
  // (TIRÉ EN CLOCHE — Keko, 23/11 : « pour le distinguer un peu des missiles » : il passe au-dessus des insectes et
  // explose en retombant, là où sera sa cible — voir `Arme.cloche`)
  { id: 'obusier', nom: 'Obusier', dit: 'De lourds obus tirés en cloche, qui explosent en retombant sur une large zone.', race: 'humains', icone: 'imp-obusier', armes: () => [nouvelle({ id: 'obusier', cadence: 2.4, degats: 86, portee: 150, vitesse: 110, vie: 2.2, dispersion: 0.05, zone: { rayon: 40 }, cloche: { vol: 0.8 } })] },
  // (LA BOBINE TESLA — Keko, 22/11 : « l'arc tesla, c'est une chaîne d'éclair bis » : une boule de foudre lente qui
  // traverse la mêlée en foudroyant les trois insectes les plus proches toutes les 0,6 s ; l'identifiant reste `tesla`)
  { id: 'tesla', nom: 'Bobine tesla', dit: 'Une boule de foudre lente qui foudroie les ennemis autour d’elle.', race: 'humains', icone: 'imp-tesla', armes: () => [nouvelle({ id: 'tesla', cadence: 2.6, degats: 58, portee: 120, sphere: { vitesse: 45, duree: 3, rayon: 42, periode: 0.6, vitesseTir: 0, foudre: { cibles: 3 } } })] },
  // (À RETARDEMENT — Keko, 23/11 : « très proche des missiles : on envoie deux projectiles tout droit qui explosent » ;
  // « trois petites grenades qui clignotent en rouge pour indiquer le timer, et leur clignotement s'intensifie jusqu'à
  // exploser ; la taille de l'explosion entre le missile et l'obus » : trois en éventail, elles s'arrêtent là où sera
  // la cible et explosent au bout de 1,2 s, sur 28 — le missile 18, l'obus 40 ; voir `Arme.minuterie`)
  { id: 'grenades', nom: 'Lance-grenades', dit: 'Trois grenades à retardement, qui explosent au bout d’un instant.', race: 'humains', icone: 'imp-grenades', armes: () => [nouvelle({ id: 'grenades', cadence: 1.5, degats: 34, portee: 110, vitesse: 150, vie: 1.2, dispersion: 0.08, zone: { rayon: 28 }, gerbe: { nombre: 3, ecart: 0.3 }, minuterie: { duree: 1.2, frein: 3 } })] },
  // (DES MINI-AVIONS, PAS DES DRONES — Keko, 22/11 : « on a déjà les drones de la Sentinelle » : l'orbite des drones, plus
  // large et plus vive ; la page les dessine en petits chasseurs)
  { id: 'escorte', nom: 'Escorte', dit: 'Deux mini-avions en formation, qui mitraillent les ennemis de loin.', race: 'humains', icone: 'imp-escorte', armes: () => [0, 1].map((k) => ({ ...nouvelle({ id: 'escorte', cadence: 0.45, degats: 24, portee: 110, vitesse: 320, vie: 0.5, dispersion: 0.05 }), place: 20 + k, orbite: { ...ORBITE_DES_DRONES, rayon: 30, vitesse: 2.6, vol: 230, braquage: 9, autour: 34, phase: k * Math.PI, formation: { x: -5, y: k === 0 ? -16 : 16 }, ailier: true } })) },
  // (EN FORMATION, FACE À LEUR CIBLE — Keko, 23/11 : « qu'elle fasse face aux ennemis sur lesquels elle tire ; au lieu de
  // tourner autour du chasseur, qu'elle vole à ses côtés et suive son orientation quand il n'y a pas d'ennemis » : les
  // deux mini-avions à ses ailes, un peu en arrière — voir `orbite.formation`, `Drone.cap`)
  // (… DES AILIERS — Keko, 23/11 : pour la distinguer des drones de la Sentinelle, qui partent chasser au contact : ils
  // ne quittent plus leur place, pivotent vers leur cible et tirent de plus loin, 110 au lieu de 70 — `orbite.ailier`)
  // (LA BALISE LASER, LA SIXIÈME — Keko, 23/11, après les roquettes et le harpon mis de côté : « le vaisseau lance une
  // balise ; tant qu'elle est active, un rayon laser rouge entre elle et le vaisseau ; tous les ennemis traversés
  // subissent des dégâts » — voir `Arme.lien` ; `degats` est ce qu'il brûle par seconde)
  { id: 'lien', nom: 'Balise laser', dit: 'Une balise reliée par un rayon laser, qui brûle tout ce qu’il traverse.', race: 'humains', icone: 'imp-lien', armes: () => [nouvelle({ id: 'lien', cadence: 5, degats: 122, portee: 110, lien: { duree: 4, vol: 0.7, epaisseur: 2 } })] },
]
export const armeDeFaction = (id: string): ArmeDeFaction | undefined => ARMES_DE_FACTION.find((x) => x.id === id)

export const MUTATIONS: Mutation[] = [
  // LES NOUVELLES ARMES (une carte chacune)
  ...ARMES_DE_FACTION.map((af): Mutation => ({ id: `arme-${af.id}`, arme: af.id, sorte: 'arme', nom: af.nom, dit: af.dit, race: af.race, appliquer: (c) => (c.armes.some((a) => a.id === af.id) ? c : { ...c, armes: [...c.armes, ...af.armes()] }) })),
  // LE CANON LASER
  // (L'IMPULSION, À LA PLACE DE LA TOURELLE — Keko, 23/11 : « on va enlever la tourelle et rajouter une variation qui
  // s'appelle Impulsion : une petite zone de dégâts autour des cibles du laser, avec un petit effet d'onde verte, qui fait
  // que tous les ennemis à portée sont touchés ; l'effet de portée du laser se répercute sur la taille de la zone » ; « la
  // zone inflige un pourcentage des dégâts » : 16 de rayon — la carte « Portée » l'agrandit —, la moitié des dégâts du tir ;
  // avec Concentration, une zone continue tout le temps du rayon — voir `Arme.zone.part`, `Arme.concentre`)
  variation('laser-impulsion', 'laser', 'Impulsion', 'Chaque tir libère une onde de choc.', changerA('laser', (a) => ({ ...a, zone: { rayon: 16, part: 0.5 } }))),
  // (LA DÉTONATION, À LA PLACE DES DRONES — Keko, 23/11 : « pas fan du drone » ; « dans chaque variation d'armes, une qui se
  // déclenche en cas de coup critique : une explosion dans la zone, 200 % des dégâts du critique, qui peut elle aussi être
  // critique » : 24 de rayon, la carte « Portée » l'agrandit — voir `Arme.detonation`)
  variation('laser-detonation', 'laser', 'Détonation', 'Les coups critiques libèrent une puissante explosion.', changerA('laser', (a) => ({ ...a, detonation: { rayon: 24, part: 2 } }))),
  // (LE TIR DOUBLE, À LA PLACE DE PERFORANT — Keko, 23/11 : « pas fan de la perforation » ; « une variation où, à chaque
  // fois qu'on tire, les deux canons des deux ailes tirent en même temps » — voir `Arme.jumele` ; le Balayage, essayé
  // avant, ajoutait une attaque à côté : retiré)
  variation('laser-double', 'laser', 'Double laser', 'Les deux canons tirent en même temps.', changerA('laser', (a) => ({ ...a, jumele: true }))),
  variation('laser-ricochet', 'laser', 'Ricochet', 'Les tirs rebondissent sur les ennemis proches.', changerA('laser', V.ricochet)),
  // (LE LASER CONCENTRÉ, À LA PLACE DE LA RAFALE — Keko, 23/11 : la rafale « pas fou » — trois lasers en éventail, puis trois
  // à la suite sur une même cible, puis quatre d'une aile à l'autre, voir `Arme.rafale`, gardée — ; « à la place d'un tir
  // de laser unique, on concentre un rayon pendant un court instant sur la cible, et le temps total de concentration
  // inflige plus de dégâts qu'un seul tir » : chaque tir devient un rayon accroché 0,5 s, qui ronge 135 % d'un tir — voir
  // `Arme.concentre`)
  variation('laser-concentre', 'laser', 'Concentration', 'Transforme le tir en un rayon puissant.', changerA('laser', (a) => ({ ...a, concentre: { duree: 0.5 }, degats: fois(a, 1.35) }))),
  // (CORROSIF, À LA PLACE DE CRYOGÉNIQUE — Keko, 23/11 : « plutôt que cryogénie, on va donner un effet corrosif au laser » :
  // ce qu'il touche est rongé 3 s, il perd 35 % de plus de toutes les sources — la corrosion des mines de la Vouivre ; voir
  // `Arme.corrosif`)
  // (« LASER ACIDE » — Keko, 24/11 : elle s'appelait « Corrosion », comme la carte de l'état ; « il faudrait trouver un autre
  // nom pour la carte de corrosion du laser »)
  variation('laser-corrosif', 'laser', 'Laser acide', 'Les tirs appliquent corrosion.', changerA('laser', (a) => ({ ...a, corrosif: { duree: 3, bonus: CORROSION_DU_VORTEX } }))),
  // LA MITRAILLEUSE
  variation('mitraille-jumelee', 'mitraille', 'Canons jumelés', 'Chaque tir part en double : deux balles côte à côte.', changerA('mitraille', V.gerbe(2, 0.12, 0.7))),
  variation('mitraille-tourelle', 'mitraille', 'Tourelle', 'Une mitrailleuse arrose tout autour du vaisseau.', ajouterA('mitraille', (a) => [ajoutee(a, 9, { cadence: a.cadence * 0.9, degats: fois(a, 0.6), portee: a.portee * 0.9 })])),
  variation('mitraille-incendiaire', 'mitraille', 'Incendiaires', 'Les balles enflamment les ennemis.', changerA('mitraille', V.incendiaire)),
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
  // (L'EXÉCUTION, SA CARTE SUR COUP CRITIQUE, À LA PLACE D'INCENDIAIRE — Keko, 23/11 : « on ne fait pas incendiaire : un seul
  // élément par arme » ; « les coups critiques tuent instantanément les ennemis faibles » — voir `Arme.execute`)
  variation('railgun-execution', 'railgun', 'Exécution', 'Les coups critiques tuent instantanément les ennemis faibles.', changerA('railgun', (a) => ({ ...a, execute: true }))),
  // (CRYOGÉNIQUE, SON ÉLÉMENT — Keko, 23/11 : « le même texte que le laser corrosif, en remplaçant corrosion par gel »)
  // (puis « givre » : l'état s'appelle Givre partout — Keko, 24/11)
  // (PUIS ÉLECTRIQUE — Keko, 24/11 : « qu'à la place, elle applique l'état d'électricité » : son élément est l'électrocution,
  // à ses chiffres du vortex — voir `ELECTROCUTION_DU_VORTEX` ; son sillon électrocute aussi)
  variation('railgun-electrique', 'railgun', 'Électrique', 'Les tirs appliquent électrocution.', changerA('railgun', (a) => ({ ...a, electrocution: { ...ELECTROCUTION_DU_VORTEX } }))),
  variation('railgun-large', 'railgun', 'Gros calibre', 'Une balle deux fois et demie plus grosse, qui touche plus large.', changerA('railgun', (a) => ({ ...a, balle: a.balle === undefined ? undefined : { ...a.balle, calibre: a.balle.calibre * 2.5 } }))),
  // (LE SILLON, À LA PLACE DU RAIL JUMEAU — Keko, 23/11 : « la traînée du railgun laisse un sillon électrique, et de gel si
  // on a Cryogénie » ; le Rail jumeau ajoutait une arme à côté au lieu de changer le tir : 2 s, 30 % des dégâts par
  // seconde, 4 de large — de moi, à rejuger ; voir `Arme.sillon`)
  variation('railgun-sillon', 'railgun', 'Sillon', 'La balle laisse un sillon électrique qui blesse les ennemis.', changerA('railgun', (a) => ({ ...a, sillon: { duree: 2, part: 0.3, largeur: 4 } }))),
  variation('railgun-eclats', 'railgun', 'Balle à éclats', 'Chaque ennemi traversé projette des éclats autour de lui.', changerA('railgun', (a) => ({ ...V.fragments(a), fragments: { nombre: 4, degats: fois(a, 0.2), vitesse: 160, vie: 0.2 } }))),
  variation('railgun-surcharge', 'railgun', 'Surcharge', 'Deux fois plus de tirs, un peu moins forts.', changerA('railgun', (a) => ({ ...a, cadence: a.cadence * 0.5, degats: fois(a, 0.6) }))),
  // L'OBUSIER
  variation('obusier-fragmentation', 'obusier', 'Fragmentation', 'Chaque explosion projette six éclats brûlants tout autour.', changerA('obusier', V.fragments)),
  variation('obusier-incendiaire', 'obusier', 'Incendiaires', 'Les obus enflamment ce qu’ils touchent.', changerA('obusier', V.incendiaire)),
  variation('obusier-cryo', 'obusier', 'Cryogéniques', 'Les obus gèlent ce qu’ils touchent.', changerA('obusier', V.cryo)),
  variation('obusier-salve', 'obusier', 'Salve', 'Chaque tir lâche trois obus en éventail.', changerA('obusier', V.gerbe(3, 0.3, 0.55))),
  variation('obusier-drones', 'obusier', 'Drones', 'Deux drones en orbite tirent des obus sur les ennemis proches.', ajouterA('obusier', (a) => drones(a, { cadence: 2.2, degats: fois(a, 0.5), portee: 90, vie: 1 }))),
  variation('obusier-lourd', 'obusier', 'Gros calibre', 'Des obus plus lents à venir, plus forts, qui explosent plus large.', changerA('obusier', V.lourd)),
  // L'ARC TESLA
  variation('tesla-rebonds', 'tesla', 'Orage', 'La bobine foudroie trois ennemis de plus à chaque décharge.', changerA('tesla', (a) => ({ ...a, sphere: a.sphere === undefined ? undefined : { ...a.sphere, foudre: { cibles: (a.sphere.foudre?.cibles ?? 3) + 3 } } }))),
  variation('tesla-incendiaire', 'tesla', 'Incendiaire', 'Ce que la foudre touche s’enflamme.', changerA('tesla', V.incendiaire)),
  variation('tesla-cryo', 'tesla', 'Cryogénique', 'Ce que la foudre touche gèle.', changerA('tesla', V.cryo)),
  variation('tesla-surtension', 'tesla', 'Surtension', 'La bobine décharge deux fois plus souvent.', changerA('tesla', (a) => ({ ...a, sphere: a.sphere === undefined ? undefined : { ...a.sphere, periode: a.sphere.periode * 0.5 } }))),
  variation('tesla-champ', 'tesla', 'Champ tesla', 'Un champ électrique blesse les ennemis tout près.', changerA('tesla', (a) => ({ ...a, aura: { rayon: 34, dps: fois(a, 0.4) } }))),
  variation('tesla-jumeau', 'tesla', 'Grande bobine', 'Une boule plus grande, qui dure plus longtemps.', changerA('tesla', (a) => ({ ...a, sphere: a.sphere === undefined ? undefined : { ...a.sphere, rayon: a.sphere.rayon * 1.5, duree: a.sphere.duree * 1.4 } }))),
  // LE LANCE-GRENADES
  variation('grenades-fragmentation', 'grenades', 'Fragmentation', 'Chaque explosion projette six éclats brûlants tout autour.', changerA('grenades', V.fragments)),
  variation('grenades-incendiaires', 'grenades', 'Incendiaires', 'Les grenades enflamment ce qu’elles touchent.', changerA('grenades', V.incendiaire)),
  variation('grenades-cryo', 'grenades', 'Cryogéniques', 'Les grenades gèlent ce qu’elles touchent.', changerA('grenades', V.cryo)),
  variation('grenades-rafale', 'grenades', 'Rafale', 'Cinq grenades à chaque tir.', changerA('grenades', (a) => ({ ...a, gerbe: { nombre: 5, ecart: 0.22 }, degats: fois(a, 0.7) }))),
  variation('grenades-drones', 'grenades', 'Drones', 'Deux drones en orbite lancent des grenades sur les ennemis proches.', ajouterA('grenades', (a) => drones(a, { cadence: 1.8, degats: fois(a, 0.6), portee: 80, gerbe: undefined }))),
  variation('grenades-lourdes', 'grenades', 'Gros calibre', 'Des grenades plus lentes, plus fortes, qui explosent plus large.', changerA('grenades', V.lourd)),
  // LA BALISE LASER
  variation('lien-double', 'lien', 'Deux balises', 'Une seconde balise, son propre rayon.', ajouterA('lien', (a) => [ajoutee(a, (a.place ?? 20) + 1, { degats: fois(a, 0.7) })])),
  variation('lien-longue', 'lien', 'Longue vie', 'Les balises restent actives bien plus longtemps.', changerA('lien', (a) => ({ ...a, lien: a.lien === undefined ? undefined : { ...a.lien, duree: a.lien.duree * 1.6 } }))),
  variation('lien-large', 'lien', 'Faisceau large', 'Un rayon bien plus épais.', changerA('lien', (a) => ({ ...a, lien: a.lien === undefined ? undefined : { ...a.lien, epaisseur: a.lien.epaisseur * 2.5 } }))),
  variation('lien-surcharge', 'lien', 'Surcharge', 'À la fin de sa vie, la balise explose.', changerA('lien', (a) => ({ ...a, lien: a.lien === undefined ? undefined : { ...a.lien, explosion: { rayon: 30, part: 3 } } }))),
  variation('lien-cryo', 'lien', 'Cryogénique', 'Le rayon gèle et ralentit ce qu’il traverse.', changerA('lien', V.cryo)),
  variation('lien-incendiaire', 'lien', 'Incendiaire', 'Le rayon enflamme ce qu’il traverse.', changerA('lien', V.incendiaire)),
  // LES DRONES D'ESCORTE
  variation('escorte-plus', 'escorte', 'Escadrille', 'Deux mini-avions de plus.', ajouterA('escorte', (a) => drones(a, { cadence: a.cadence, degats: a.degats, portee: a.portee }, 2, Math.PI / 2).map((d, k) => ({ ...d, place: 22 + k, orbite: { ...a.orbite!, phase: Math.PI / 2 + k * Math.PI, formation: { x: -16, y: k === 0 ? -30 : 30 } } })))),
  variation('escorte-perforantes', 'escorte', 'Perforantes', 'Les balles des mini-avions traversent les ennemis.', changerA('escorte', V.perforant)),
  variation('escorte-incendiaires', 'escorte', 'Incendiaires', 'Les balles des mini-avions enflamment les ennemis.', changerA('escorte', V.incendiaire)),
  variation('escorte-cryo', 'escorte', 'Cryogéniques', 'Les balles des mini-avions gèlent les ennemis.', changerA('escorte', V.cryo)),
  variation('escorte-ricochet', 'escorte', 'Ricochet', 'Chaque balle des mini-avions rebondit sur deux autres ennemis.', changerA('escorte', V.ricochet)),
  variation('escorte-roquettes', 'escorte', 'Roquettes', 'Les mini-avions tirent des roquettes qui explosent.', changerA('escorte', (a) => ({ ...V.explosif(a), cadence: a.cadence * 2.5, degats: fois(a, 2) }))),
  // LES CARTES D'ÉLÉMENT (Keko, 24/11 : « des cartes spéciales de chaque élément » ; « des cartes multicolores spéciales qu'on
  // proposera dans le pool des cartes spéciales, si le joueur a au moins une attaque avec l'élément en question » — voir
  // `ELEMENTAIRES` pour leurs chiffres ; leurs noms et leurs textes sont de moi)
  // (« AURA GLACIALE », la seconde du givre — Keko, 24/11)
  element('element-aura', 'givre', 'Aura glaciale', 'Les ennemis proches sont sous givre.', 'auraGlaciale'),
  element('element-givre', 'givre', 'Gel profond', 'Le givre peut geler net les ennemis déjà sous givre.', 'gelure'),
  // (« COMBUSTION » et « SURTENSION », les secondes de la brûlure et de l'électrocution — Keko, 24/11)
  element('element-combustion', 'feu', 'Combustion', 'Les ennemis qui meurent en brûlant explosent.', 'combustion'),
  element('element-surtension', 'electrocution', 'Surtension', 'L’électrocution frappe tous les ennemis à portée.', 'surtension'),
  element('element-feu', 'feu', 'Propagation', 'La brûlure se propage aux ennemis tout proches.', 'incendie'),
  // (« DISSOLUTION », la seconde de la corrosion — Keko, 24/11 : « une carte de plus spéciale pour chaque état, à commencer par
  // la corrosion : un ennemi qui meurt sous l'effet de la corrosion laisse une flaque d'acide »)
  element('element-dissolution', 'corrosion', 'Dissolution', 'Les ennemis qui meurent sous corrosion laissent une flaque d’acide.', 'dissolution'),
  element('element-corrosion', 'corrosion', 'Point faible', 'Les coups critiques sont plus fréquents et plus forts sous corrosion.', 'vulnerabilite'),
  // (« FOUDRE », à la place de « Paralysie » — Keko, 24/11 : « ça fait doublon avec le gel »)
  element('element-electrocution', 'electrocution', 'Foudre', 'L’électrocution peut faire tomber la foudre sur l’ennemi.', 'foudre'),
]
/**
 * LES ARMES MISES DE CÔTÉ — LES ROQUETTES (Keko, 23/11 : « on va enlever les mini-roquettes, car ça, on va plutôt le mettre comme
 * amélioration des missiles, qui pourront éventuellement lancer des petites roquettes supplémentaires ; on va le virer,
 * le garder sous le coude ») : l'arme et ses six variations, hors des cartes — rien ne les propose. Leur règle (`essaim`),
 * leur dessin et leur son restent.
 */
export const ARMES_EN_RESERVE: ArmeDeFaction[] = [
  // (LE HARPON, MIS DE CÔTÉ POUR LES XÉNOÏDES — Keko, 23/11 : « l'idée est intéressante, mais je pense qu'elle collerait
  // mieux aux Xénoïdes, en mode tentacule harpon ; on va garder ça de côté quand on aura besoin de faire les armes de
  // faction des Xénoïdes » ; sa règle, `Arme.harpon`, son dessin, son icône et ses sons restent)
  // (LE HARPON, LA SIXIÈME — Keko, 23/11 : « on fait un test avec le harpon » ; l'arme anti-boss de l'Empire : il harponne
  // l'insecte le plus résistant à portée, et le câble le ronge de plus en plus fort — voir `Arme.harpon` ; `degats` est
  // ce qu'il ronge par seconde au départ)
  { id: 'harpon', nom: 'Harpon', dit: 'Harponne l’ennemi le plus résistant ; le câble le ronge de plus en plus fort.', race: 'humains', icone: 'imp-harpon', armes: () => [nouvelle({ id: 'harpon', cadence: 0.6, degats: 20, portee: 130, harpon: { vitesse: 320, max: 4, montee: 3, rupture: 1.5, impact: 4 } })] },
  { id: 'roquettes', nom: 'Roquettes', dit: 'Six petites roquettes à la fois, qui explosent chacune sur une petite zone.', race: 'humains', icone: 'imp-roquettes', armes: () => [nouvelle({ id: 'roquettes', cadence: 3, degats: 21, portee: 130, vitesse: 60, vie: 2, zone: { rayon: 11 }, essaim: { nombre: 6, eventail: 2.4, acces: 60, pointe: 90, braquage: 5, chaos: 1.6, pas: 0.32, calme: 1.4, reprise: 45 } })] },
  // (LES ROQUETTES, PLUS LENTES QUE LES MISSILES DU CHASSEUR — Keko, 22/11 : « une version plus lente que les missiles,
  // pour la distinguer » : elles partent à 60, plafonnent à 90 — les missiles volent à 110, guidés —, zigzaguent moins)
  // (… ET PLUS PETITES — Keko, 23/11 : « les multi-roquettes doivent être plus petites que les missiles, et l'obus plus
  // gros que le missile ; une cohérence et un équilibre entre les trois » : six à la fois, chacune explose sur 11 — les
  // missiles sur 18, l'obus sur 40 —, dessinées plus petites que le missile)
]
export const VARIATIONS_EN_RESERVE: Mutation[] = [
  // LE HARPON
  variation('harpon-barbele', 'harpon', 'Barbelé', 'Les dégâts du câble montent bien plus haut.', changerA('harpon', (a) => ({ ...a, harpon: a.harpon === undefined ? undefined : { ...a.harpon, max: a.harpon.max * 1.5 } }))),
  variation('harpon-treuil', 'harpon', 'Treuil', 'Les dégâts du câble montent deux fois plus vite.', changerA('harpon', (a) => ({ ...a, harpon: a.harpon === undefined ? undefined : { ...a.harpon, montee: a.harpon.montee / 2 } }))),
  variation('harpon-double', 'harpon', 'Double harpon', 'Un second harpon, sur un autre ennemi.', ajouterA('harpon', (a) => [ajoutee(a, (a.place ?? 20) + 1, { degats: fois(a, 0.7) })])),
  variation('harpon-cryo', 'harpon', 'Cryogénique', 'Le câble gèle et ralentit l’ennemi harponné.', changerA('harpon', V.cryo)),
  variation('harpon-incendiaire', 'harpon', 'Incendiaire', 'Le câble enflamme l’ennemi harponné.', changerA('harpon', V.incendiaire)),
  variation('harpon-fragmentation', 'harpon', 'Fragmentation', 'L’ennemi harponné qui meurt projette six éclats.', changerA('harpon', V.fragments)),
  // L'ESSAIM DE ROQUETTES
  variation('roquettes-nuee', 'roquettes', 'Nuée', 'Deux fois plus de roquettes, un peu moins fortes.', changerA('roquettes', (a) => ({ ...a, essaim: a.essaim === undefined ? undefined : { ...a.essaim, nombre: a.essaim.nombre * 2 }, degats: fois(a, 0.6) }))),
  // (elles explosent déjà toutes — Keko, 22/11 : « une version plus lente et plus grosse zone que les missiles » —, la
  // carte « Explosives » est devenue « Gros calibre », et « Perforantes », qui perdait l'explosion, « Fragmentation »)
  variation('roquettes-lourdes', 'roquettes', 'Gros calibre', 'Des roquettes plus lentes à venir, plus fortes, qui explosent plus large.', changerA('roquettes', V.lourd)),
  variation('roquettes-incendiaires', 'roquettes', 'Incendiaires', 'Les roquettes enflamment ce qu’elles touchent.', changerA('roquettes', V.incendiaire)),
  variation('roquettes-cryo', 'roquettes', 'Cryogéniques', 'Les roquettes gèlent ce qu’elles touchent.', changerA('roquettes', V.cryo)),
  variation('roquettes-fragmentation', 'roquettes', 'Fragmentation', 'Chaque explosion projette six éclats brûlants tout autour.', changerA('roquettes', V.fragments)),
  variation('roquettes-ricochet', 'roquettes', 'Ricochet', 'Chaque roquette rebondit sur deux autres ennemis.', changerA('roquettes', V.ricochet)),
]
/** La carte d'une spéciale. */
// (une carte d'élément vaut pour toutes les armes)
export const carteSpeciale = (mu: Mutation): Talent => ({ id: `mutation:${mu.id}`, cible: mu.sorte === 'element' ? { sorte: 'armes' } : { sorte: 'arme', arme: mu.arme }, stat: 'mutation', rarete: 'speciale', bonus: 0, mutation: mu.id })
/** Les spéciales déjà prises, d'après les bonus du vol. */
export const mutationsPrises = (b: Bonus): string[] => b.filter((x) => x.stat === 'mutation').map((x) => x.id.slice('mutation:'.length))
/** Les noms des armes portées, une fois chacun, l'arme principale d'abord. */
export const armesPortees = (armes: Arme[]): Arme[] => armes.filter((a, i) => armes.findIndex((b) => b.id === a.id) === i)

/** LES TROIS SPÉCIALES d'un choix (voir `MUTATIONS`), ou rien : `k`, la combientième spéciale (1 au niveau 10). */
function proposerLesSpeciales(graine: number, niveau: number, k: number, principaleId: string, armes: Arme[], race: Race, prises: string[]): Talent[] {
  const portees = armes.map((a) => a.id)
  // (LES CARTES D'ÉLÉMENT vont avec les variations : chacune si une arme portée applique son état — voir `ELEMENTAIRES`)
  const elements = MUTATIONS.filter((mu) => mu.sorte === 'element' && !prises.includes(mu.id) && armes.some((a) => statsDeLArme(a).includes(mu.etat!)))
  const variationsDe = (ids: string[]): Mutation[] => [...MUTATIONS.filter((mu) => mu.sorte === 'variation' && ids.includes(mu.arme) && !prises.includes(mu.id)), ...elements]
  const nouvelles = portees.length < ARMES_MAX ? MUTATIONS.filter((mu) => mu.sorte === 'arme' && mu.race === race && !portees.includes(mu.arme) && !prises.includes(mu.id)) : []
  let cle = 0
  const tirer = (liste: Mutation[]): Mutation | undefined => (liste.length === 0 ? undefined : liste.splice(hache(hache(graine, niveau, 41), cle++) % liste.length, 1)[0])
  const choisies: Mutation[] = []
  if (k <= NIVEAUX_MIXTES) {
    // (DEUX ARMEMENTS ET UNE VARIATION de l'arme principale — Keko, 22/11 : « plutôt qu'un armement, une variation et
    // l'autre au hasard » ; ce qui manque, le reste le complète)
    const v = variationsDe([principaleId])
    const a = [...nouvelles]
    for (const t of [tirer(a), tirer(a), tirer(v)]) if (t !== undefined) choisies.push(t)
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
    speciales = proposerLesSpeciales(graine, niveau, prises.length + 1, arme.id, portees, race, prises)
    if (speciales.length >= 3) return speciales
  }
  // (MOINS DE TROIS SPÉCIALES QUI RESTENT — toutes les variations d'une arme seule prises — : des cartes ordinaires complètent)
  const pool: { cible: Cible; stat: StatDArme | StatDeFaction }[] = [
    // (pas d'état à une arme : il est à toutes — voir `ETATS`)
    ...portees.flatMap((a) => statsDeLArme(a).filter((stat) => !ETATS.has(stat)).map((stat) => ({ cible: { sorte: 'arme', arme: a.id } as Cible, stat }))),
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

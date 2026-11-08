/**
 * NÉON — `?neon`, un side project (Keko, 08/11 : « un jeu arcade
 * incrémental/roguelike, à base de formes géométriques néon flashy sur un
 * fond sombre. On contrôle un cercle en bas de l'écran : il ne bouge pas, les
 * ennemis viennent du haut. Et on joue à base de commandes action : quand un
 * ennemi nous touche (ou un projectile), on peut taper pour parer »).
 *
 * **Le cercle ne bouge pas et tire tout seul** sur l'ennemi le plus proche :
 * c'est la part incrémentale, les chiffres montent avec les améliorations. **Le
 * joueur, lui, PARE** : une tape juste avant qu'une forme ou un projectile ne
 * touche le cercle (dans la fenêtre), et le coup est paré — l'ennemi encaisse
 * et recule, le projectile repart d'où il vient. Dans la fenêtre PARFAITE, la
 * parade frappe trois fois plus et lâche une ONDE DE CHOC autour du cercle.
 * Une tape dans le vide bloque la parade un instant : on ne pare pas en
 * tapotant. *(Un combo de parades a existé une heure, Keko l'a retiré :
 * « enlève le système de combo de parade pour l'instant ».)*
 *
 * **Roguelike** : chaque niveau (l'expérience des ennemis abattus) arrête le
 * jeu et offre trois améliorations, on en prend une — **mais pas au milieu
 * d'une parade** (Keko, 08/11 : « le choix instantané me tue parfois, il casse
 * le rythme et je foire ma parade en cours ») : le niveau attend un moment
 * calme, rien à moins de `calme` s du contact ; passé `attente` s sans
 * calme, il s'ouvre dès que rien n'est dans la fenêtre de parade. La partie s'arrête
 * quand le cercle s'éteint ; le record est le nombre d'abattus.
 *
 * Pur et seedé : le temps est injecté (en secondes), l'état modifié en place.
 * Le monde a le cercle à l'origine, y vers le bas (comme l'écran) : les
 * ennemis naissent en haut (y négatif) et descendent ; la page dit ce qu'elle
 * montre (`Vue`).
 */
import { createRng } from '../rng.ts'

export type TypeEnnemi = 'triangle' | 'carre' | 'hexagone'
export type CleAmelioration = 'cadence' | 'puissance' | 'double' | 'percant' | 'garde' | 'riposte' | 'onde' | 'carapace' | 'lenteur'
export type Point = { x: number; y: number }

export const NEON = {
  cercle: { rayon: 6, pv: 5 },
  /** Le tir automatique : sa cadence, ses dégâts, sa vitesse, son rayon ; l'écart des tirs d'une salve (radians). */
  tir: { cadence: 0.5, degats: 1, vitesse: 80, rayon: 1.2, ecart: 0.14 },
  parade: {
    /** Une tape tant de secondes AVANT le contact pare ; tant APRÈS, encore (le coup se résout alors seulement). */
    avant: 0.22,
    apres: 0.06,
    /** Dans ces bornes-là, la parade est PARFAITE. */
    parfaiteAvant: 0.08,
    parfaiteApres: 0.03,
    /** Une tape dans le vide bloque la parade ce temps-là. */
    verrou: 0.3,
    /** Les dégâts d'une parade, le multiplicateur de la parfaite, le recul donné (unités/s) et l'étourdissement de l'ennemi paré. */
    degats: 5,
    parfaite: 3,
    recul: 40,
    etourdi: 0.6,
    /** Le projectile paré repart d'où il vient, tant plus vite ; il frappe comme la parade. */
    renvoi: 1.4,
  },
  /** L'onde de la parade parfaite : son rayon, ses dégâts, le recul qu'elle donne. */
  onde: { rayon: 18, degats: 3, recul: 25 },
  ennemis: {
    triangle: { nom: 'Triangle', pv: 3, vitesse: 14, degats: 1, rayon: 3, depuis: 0, poids: 5, xp: 3 },
    carre: { nom: 'Carré', pv: 9, vitesse: 7, degats: 2, rayon: 4, depuis: 35, poids: 2, xp: 8 },
    hexagone: { nom: 'Hexagone', pv: 6, vitesse: 9, degats: 1, rayon: 3.6, depuis: 20, poids: 2, xp: 6 },
  },
  /** L'hexagone s'arrête à tant du cercle, dérive de côté, et tire des losanges : leur cadence, leur vitesse, leur rayon, leurs dégâts. */
  hexagone: { halte: 55, derive: 6, tir: { cadence: 1.8, vitesse: 34, rayon: 1.6, degats: 1 } },
  /** Les naissances : l'intervalle au départ, son plancher, en combien de secondes il le rejoint ; la largeur où l'on naît ; tant au-dessus du haut de l'écran. */
  naissance: { intervalle: 1.5, plancher: 0.4, en: 180, x: 40, dessus: 6 },
  /** Les ennemis forcissent : leurs PV ×(1 + tant par minute), leur vitesse ×(1 + tant par minute), plafonnée. */
  croissance: { pvParMinute: 1.2, vitesseParMinute: 0.12, vitesseMax: 1.8 },
  /** L'expérience du premier niveau, puis ×facteur à chaque niveau ; le choix attend un moment calme (rien à moins de tant de s du contact), au plus tant de s. */
  niveau: { base: 12, facteur: 1.35, choix: 3, calme: 0.8, attente: 6 },
  /** Ce que donne chaque rang d'une amélioration. */
  ameliorations: {
    cadence: { nom: 'Cadence', effet: 'Le cercle tire 25 % plus vite', max: 6, part: 0.25 },
    puissance: { nom: 'Puissance', effet: 'Chaque tir frappe 1 de plus', max: 8, plus: 1 },
    double: { nom: 'Salve', effet: 'Un tir de plus à chaque salve', max: 3 },
    percant: { nom: 'Perçant', effet: 'Le tir traverse un ennemi de plus', max: 3 },
    garde: { nom: 'Garde large', effet: 'La fenêtre de parade s’élargit de 30 %', max: 4, part: 0.3 },
    riposte: { nom: 'Riposte', effet: 'La parade frappe 4 de plus', max: 6, plus: 4 },
    onde: { nom: 'Onde de choc', effet: 'L’onde de la parade parfaite va 6 plus loin et frappe 3 de plus', max: 4, rayon: 6, plus: 3 },
    carapace: { nom: 'Carapace', effet: '1 PV de plus, et 1 PV rendu', max: 5 },
    lenteur: { nom: 'Lenteur', effet: 'Les ennemis avancent 10 % moins vite', max: 4, part: 0.1 },
  } satisfies Record<CleAmelioration, { nom: string; effet: string; max: number; part?: number; plus?: number; rayon?: number }>,
}
export type ConfigNeon = typeof NEON
export const CLES: CleAmelioration[] = ['cadence', 'puissance', 'double', 'percant', 'garde', 'riposte', 'onde', 'carapace', 'lenteur']

export type Ennemi = {
  id: number
  type: TypeEnnemi
  x: number
  y: number
  pv: number
  pvMax: number
  /** L'instant où il a touché le cercle (il y reste collé jusqu'à ce que le coup se résolve), ou `null`. */
  contactA: number | null
  /** Étourdi (paré ou soufflé) jusque-là : il recule au lieu d'avancer. */
  etourdiA: number
  reculVx: number
  reculVy: number
  /** L'hexagone : son prochain tir, et le sens de sa dérive. */
  tirA: number
  sens: 1 | -1
  /** Pour le dessin : l'angle de la forme. */
  angle: number
}
/** Un losange tiré par un hexagone, vers le cercle. */
export type Projectile = { id: number; x: number; y: number; vx: number; vy: number; contactA: number | null; /** L'hexagone qui l'a tiré. */ de: number }
/** Un tir du cercle — ou un projectile renvoyé par une parade. */
export type Tir = { x: number; y: number; vx: number; vy: number; degats: number; percant: number; touches: number[]; renvoye: boolean }

export type Phase = 'jeu' | 'choix' | 'perdu'
export type EtatNeon = {
  seed: number
  t: number
  phase: Phase
  pv: number
  pvMax: number
  niveau: number
  xp: number
  xpSuivant: number
  /** Les niveaux gagnés dont le choix attend un moment calme, et depuis quand. */
  niveauxDus: number
  niveauDepuis: number
  abattus: number
  parades: number
  parfaites: number
  /** La parade est bloquée jusque-là (une tape dans le vide). */
  verrouA: number
  /** La dernière parade (la page fait briller la garde). */
  paradeA: number
  prochainTir: number
  prochaineNaissance: number
  ennemis: Ennemi[]
  projectiles: Projectile[]
  tirs: Tir[]
  ameliorations: Record<CleAmelioration, number>
  /** Les trois améliorations offertes, pendant la phase `choix`. */
  choix: CleAmelioration[]
  prochainId: number
  rng: number
}

export type Evenement =
  | { type: 'tir'; n: number }
  | { type: 'touche'; id: number; x: number; y: number; degats: number; ennemi: TypeEnnemi }
  | { type: 'mort'; x: number; y: number; ennemi: TypeEnnemi }
  | { type: 'parade'; qualite: 'parade' | 'parfaite'; sorte: 'ennemi' | 'projectile'; x: number; y: number; degats: number }
  | { type: 'rate' }
  | { type: 'bloque' }
  | { type: 'onde'; rayon: number; touches: number }
  | { type: 'coup'; degats: number; x: number; y: number; sorte: 'ennemi' | 'projectile' }
  | { type: 'projectile'; x: number; y: number }
  | { type: 'naissance'; ennemi: TypeEnnemi }
  | { type: 'niveau'; niveau: number; choix: CleAmelioration[] }
  | { type: 'amelioration'; cle: CleAmelioration; rang: number }
  | { type: 'perdu' }

/** Ce que la page montre : tant d'unités au-dessus du cercle, tant de chaque côté. */
export type Vue = { haut: number; demiLargeur: number }

export function nouvellePartie(config: ConfigNeon, seed: number): EtatNeon {
  const ameliorations = Object.fromEntries(CLES.map((k) => [k, 0])) as Record<CleAmelioration, number>
  return {
    seed,
    t: 0,
    phase: 'jeu',
    pv: config.cercle.pv,
    pvMax: config.cercle.pv,
    niveau: 1,
    xp: 0,
    xpSuivant: config.niveau.base,
    niveauxDus: 0,
    niveauDepuis: 0,
    abattus: 0,
    parades: 0,
    parfaites: 0,
    verrouA: -Infinity,
    paradeA: -Infinity,
    prochainTir: config.tir.cadence,
    prochaineNaissance: 0.8,
    ennemis: [],
    projectiles: [],
    tirs: [],
    ameliorations,
    choix: [],
    prochainId: 1,
    rng: seed >>> 0,
  }
}

// ---------------------------------------------------------------- le hasard, à même l'état

function tirer(e: EtatNeon): number {
  const r = createRng(e.rng)
  const v = r.next()
  e.rng = r.getState()
  return v
}

// ---------------------------------------------------------------- ce que valent les améliorations

export function cadenceDuTir(config: ConfigNeon, e: EtatNeon): number {
  return config.tir.cadence / (1 + config.ameliorations.cadence.part * e.ameliorations.cadence)
}
export function degatsDuTir(config: ConfigNeon, e: EtatNeon): number {
  return config.tir.degats + config.ameliorations.puissance.plus * e.ameliorations.puissance
}
export function tirsParSalve(e: EtatNeon): number {
  return 1 + e.ameliorations.double
}
/** La fenêtre de parade, élargie par la Garde large. */
export function largeurDeGarde(config: ConfigNeon, e: EtatNeon): number {
  return 1 + config.ameliorations.garde.part * e.ameliorations.garde
}
/** Les dégâts d'une parade : la base, la riposte, et ×3 si parfaite. */
export function degatsDeParade(config: ConfigNeon, e: EtatNeon, parfaite: boolean): number {
  const base = config.parade.degats + config.ameliorations.riposte.plus * e.ameliorations.riposte
  return Math.round(base * (parfaite ? config.parade.parfaite : 1))
}
export function rayonDeLOnde(config: ConfigNeon, e: EtatNeon): number {
  return config.onde.rayon + config.ameliorations.onde.rayon * e.ameliorations.onde
}
export function degatsDeLOnde(config: ConfigNeon, e: EtatNeon): number {
  return config.onde.degats + config.ameliorations.onde.plus * e.ameliorations.onde
}
/** La vitesse d'un ennemi à cet instant : sa base, la croissance, la Lenteur. */
export function vitesseDe(config: ConfigNeon, e: EtatNeon, type: TypeEnnemi): number {
  const croissance = Math.min(config.croissance.vitesseMax, 1 + (config.croissance.vitesseParMinute * e.t) / 60)
  return config.ennemis[type].vitesse * croissance * (1 - config.ameliorations.lenteur.part * e.ameliorations.lenteur)
}
function pvDe(config: ConfigNeon, e: EtatNeon, type: TypeEnnemi): number {
  return Math.round(config.ennemis[type].pv * (1 + (config.croissance.pvParMinute * e.t) / 60))
}

// ---------------------------------------------------------------- la parade

/**
 * Dans combien de temps cette chose touche le cercle (en s) : 0 si elle le
 * touche déjà, `Infinity` si elle ne s'en approche pas.
 */
export function tempsAvantContact(config: ConfigNeon, c: { x: number; y: number; vx: number; vy: number; rayon: number; contactA: number | null }): number {
  if (c.contactA !== null) return 0
  const d = Math.hypot(c.x, c.y)
  if (d === 0) return 0
  // La vitesse d'approche : la part de la vitesse qui pointe vers le cercle.
  const v = -(c.x * c.vx + c.y * c.vy) / d
  if (v <= 1e-6) return Infinity
  return Math.max(0, d - config.cercle.rayon - c.rayon) / v
}

function cinematiqueDe(config: ConfigNeon, e: EtatNeon, en: Ennemi): { x: number; y: number; vx: number; vy: number; rayon: number; contactA: number | null } {
  const rayon = config.ennemis[en.type].rayon
  if (e.t < en.etourdiA) return { x: en.x, y: en.y, vx: 0, vy: 0, rayon, contactA: en.contactA }
  const d = Math.hypot(en.x, en.y) || 1
  if (en.type === 'hexagone' && d <= config.hexagone.halte + 0.5) return { x: en.x, y: en.y, vx: 0, vy: 0, rayon, contactA: en.contactA }
  const v = vitesseDe(config, e, en.type)
  return { x: en.x, y: en.y, vx: (-en.x / d) * v, vy: (-en.y / d) * v, rayon, contactA: en.contactA }
}

export type Parable = { sorte: 'ennemi' | 'projectile'; id: number; x: number; y: number; ecart: number; parfaite: boolean }

/**
 * Ce qu'une tape parerait À CET INSTANT (reculé de `retard` s : le doigt a
 * touché avant que la page ne s'en occupe) : la chose la plus pressante dans
 * la fenêtre, ou `null`. `ecart` : le temps avant son contact (négatif : elle
 * touche déjà depuis tant).
 */
export function parable(config: ConfigNeon, e: EtatNeon, retard = 0): Parable | null {
  const f = largeurDeGarde(config, e)
  const p = config.parade
  let meilleur: Parable | null = null
  const juger = (sorte: 'ennemi' | 'projectile', id: number, c: { x: number; y: number; vx: number; vy: number; rayon: number; contactA: number | null }) => {
    const ecart = (c.contactA !== null ? -(e.t - c.contactA) : tempsAvantContact(config, c)) + retard
    if (ecart > p.avant * f || ecart < -p.apres * f) return
    if (meilleur !== null && ecart >= meilleur.ecart) return
    meilleur = { sorte, id, x: c.x, y: c.y, ecart, parfaite: ecart <= p.parfaiteAvant * f && ecart >= -p.parfaiteApres * f }
  }
  for (const en of e.ennemis) juger('ennemi', en.id, cinematiqueDe(config, e, en))
  for (const pr of e.projectiles) juger('projectile', pr.id, { ...pr, rayon: config.hexagone.tir.rayon })
  return meilleur
}

/** La tape de parade. `retard` : depuis combien de secondes le doigt a touché. */
export function parer(config: ConfigNeon, e: EtatNeon, retard = 0): Evenement[] {
  if (e.phase !== 'jeu') return []
  if (e.t < e.verrouA) return [{ type: 'bloque' }]
  const cible = parable(config, e, retard)
  if (cible === null) {
    e.verrouA = e.t + config.parade.verrou
    return [{ type: 'rate' }]
  }
  const ev: Evenement[] = []
  const degats = degatsDeParade(config, e, cible.parfaite)
  e.parades += 1
  if (cible.parfaite) e.parfaites += 1
  e.paradeA = e.t
  if (cible.sorte === 'ennemi') {
    const en = e.ennemis.find((x) => x.id === cible.id)!
    const d = Math.hypot(en.x, en.y) || 1
    // Il encaisse, recule d'où il vient, étourdi.
    en.contactA = null
    en.etourdiA = e.t + config.parade.etourdi
    en.reculVx = (en.x / d) * config.parade.recul
    en.reculVy = (en.y / d) * config.parade.recul
    blesser(config, e, en, degats, ev)
  } else {
    const i = e.projectiles.findIndex((x) => x.id === cible.id)
    const pr = e.projectiles[i]
    e.projectiles.splice(i, 1)
    // Le losange repart sur son tireur (il a dérivé depuis) — ou sur l'ennemi le plus proche —, plus vite. Il s'arrête au premier touché,
    // parfait ou non (Keko, 08/11 : « on va enlever le renvoi de losange perçant de la parade parfaite »).
    const v = Math.hypot(pr.vx, pr.vy) * config.parade.renvoi || config.hexagone.tir.vitesse * config.parade.renvoi
    const vers = e.ennemis.find((x) => x.id === pr.de) ?? e.ennemis.reduce<Ennemi | null>((m, x) => (m === null || Math.hypot(x.x - pr.x, x.y - pr.y) < Math.hypot(m.x - pr.x, m.y - pr.y) ? x : m), null)
    const dx = vers !== null ? vers.x - pr.x : -pr.vx
    const dy = vers !== null ? vers.y - pr.y : -pr.vy
    const d = Math.hypot(dx, dy) || 1
    e.tirs.push({ x: pr.x, y: pr.y, vx: (dx / d) * v, vy: (dy / d) * v, degats, percant: 0, touches: [], renvoye: true })
  }
  ev.unshift({ type: 'parade', qualite: cible.parfaite ? 'parfaite' : 'parade', sorte: cible.sorte, x: cible.x, y: cible.y, degats })
  if (cible.parfaite) {
    // L'ONDE DE CHOC : tout ce qui est autour du cercle encaisse et recule (sauf l'ennemi paré, qui a déjà eu son compte).
    const rayon = rayonDeLOnde(config, e)
    const plus = degatsDeLOnde(config, e)
    let touches = 0
    for (const en of [...e.ennemis]) {
      if (cible.sorte === 'ennemi' && en.id === cible.id) continue
      if (Math.hypot(en.x, en.y) > rayon + config.ennemis[en.type].rayon) continue
      const d = Math.hypot(en.x, en.y) || 1
      en.contactA = null
      en.etourdiA = Math.max(en.etourdiA, e.t + config.parade.etourdi)
      en.reculVx = (en.x / d) * config.onde.recul
      en.reculVy = (en.y / d) * config.onde.recul
      touches += 1
      blesser(config, e, en, plus, ev)
    }
    // L'onde balaie aussi les losanges.
    e.projectiles = e.projectiles.filter((pr) => Math.hypot(pr.x, pr.y) > rayon)
    ev.push({ type: 'onde', rayon, touches })
  }
  return ev
}

/** L'ennemi encaisse ; mort, il donne son expérience (et peut-être un niveau). */
function blesser(config: ConfigNeon, e: EtatNeon, en: Ennemi, degats: number, ev: Evenement[]): void {
  if (en.pv <= 0) return
  en.pv -= degats
  ev.push({ type: 'touche', id: en.id, x: en.x, y: en.y, degats, ennemi: en.type })
  if (en.pv > 0) return
  e.ennemis = e.ennemis.filter((x) => x !== en)
  e.abattus += 1
  ev.push({ type: 'mort', x: en.x, y: en.y, ennemi: en.type })
  e.xp += config.ennemis[en.type].xp
  while (e.xp >= e.xpSuivant) {
    // Le niveau est gagné tout de suite ; son choix attendra un moment calme (`ouvrirLeChoix`).
    e.xp -= e.xpSuivant
    e.niveau += 1
    e.xpSuivant = Math.round(config.niveau.base * config.niveau.facteur ** (e.niveau - 1))
    if (e.niveauxDus === 0) e.niveauDepuis = e.t
    e.niveauxDus += 1
  }
}

// ---------------------------------------------------------------- les niveaux

/** Dans combien de temps la chose la plus pressante touche le cercle (0 si l'une est déjà collée). */
export function prochainContact(config: ConfigNeon, e: EtatNeon): number {
  let min = Infinity
  for (const en of e.ennemis) min = Math.min(min, tempsAvantContact(config, cinematiqueDe(config, e, en)))
  for (const pr of e.projectiles) min = Math.min(min, tempsAvantContact(config, { ...pr, rayon: config.hexagone.tir.rayon }))
  return min
}

/** Le moment est-il bon pour ouvrir le choix d'un niveau dû : calme, ou, l'attente passée, au moins rien dans la fenêtre ? */
export function choixPossible(config: ConfigNeon, e: EtatNeon): boolean {
  if (e.niveauxDus === 0 || e.phase !== 'jeu') return false
  const contact = prochainContact(config, e)
  if (contact >= config.niveau.calme) return true
  return e.t - e.niveauDepuis >= config.niveau.attente && parable(config, e) === null && contact > config.parade.avant * largeurDeGarde(config, e)
}

function ouvrirLeChoix(config: ConfigNeon, e: EtatNeon, ev: Evenement[]): void {
  e.niveauxDus -= 1
  if (e.niveauxDus > 0) e.niveauDepuis = e.t
  // Trois améliorations au hasard parmi celles qui ne sont pas au bout.
  const possibles = CLES.filter((k) => e.ameliorations[k] < config.ameliorations[k].max)
  const choix: CleAmelioration[] = []
  while (choix.length < config.niveau.choix && possibles.length > 0) {
    const i = Math.floor(tirer(e) * possibles.length)
    choix.push(possibles.splice(i, 1)[0])
  }
  if (choix.length === 0) return
  e.choix = choix
  e.phase = 'choix'
  ev.push({ type: 'niveau', niveau: e.niveau, choix })
}

/** On prend la i-ième amélioration offerte ; le jeu reprend. */
export function choisir(config: ConfigNeon, e: EtatNeon, i: number): Evenement[] {
  void config
  if (e.phase !== 'choix') return []
  const cle = e.choix[i]
  if (cle === undefined) return []
  e.ameliorations[cle] += 1
  if (cle === 'carapace') {
    e.pvMax += 1
    e.pv = Math.min(e.pvMax, e.pv + 1)
  }
  e.choix = []
  e.phase = 'jeu'
  const ev: Evenement[] = [{ type: 'amelioration', cle, rang: e.ameliorations[cle] }]
  // Un second niveau dû (une onde qui fauche tout) s'ouvrira au prochain pas, le moment est encore calme.
  return ev
}

// ---------------------------------------------------------------- le temps

export function avancer(config: ConfigNeon, e: EtatNeon, dt: number, vue: Vue): Evenement[] {
  if (e.phase !== 'jeu') return []
  const ev: Evenement[] = []
  // UN NIVEAU DÛ s'ouvre quand le moment est calme — jamais au milieu d'une parade.
  if (choixPossible(config, e)) {
    ouvrirLeChoix(config, e, ev)
    if (e.phase !== 'jeu') return ev
  }
  e.t += dt
  const t = e.t

  // LES NAISSANCES, de plus en plus serrées.
  if (t >= e.prochaineNaissance) {
    const types = (Object.keys(config.ennemis) as TypeEnnemi[]).filter((k) => config.ennemis[k].depuis <= t)
    const total = types.reduce((s, k) => s + config.ennemis[k].poids, 0)
    let u = tirer(e) * total
    let type: TypeEnnemi = types[0]
    for (const k of types) {
      u -= config.ennemis[k].poids
      if (u <= 0) {
        type = k
        break
      }
    }
    const pv = pvDe(config, e, type)
    e.ennemis.push({
      id: e.prochainId++,
      type,
      x: (tirer(e) * 2 - 1) * Math.min(config.naissance.x, vue.demiLargeur - config.ennemis[type].rayon),
      y: -(vue.haut + config.naissance.dessus),
      pv,
      pvMax: pv,
      contactA: null,
      etourdiA: -Infinity,
      reculVx: 0,
      reculVy: 0,
      tirA: t + config.hexagone.tir.cadence * (0.5 + tirer(e) * 0.5),
      sens: tirer(e) < 0.5 ? -1 : 1,
      angle: tirer(e) * Math.PI * 2,
    })
    ev.push({ type: 'naissance', ennemi: type })
    const n = config.naissance
    const intervalle = Math.max(n.plancher, n.intervalle - ((n.intervalle - n.plancher) * t) / n.en)
    e.prochaineNaissance = t + intervalle * (0.7 + tirer(e) * 0.6)
  }

  // LE TIR AUTOMATIQUE, sur l'ennemi le plus proche.
  if (t >= e.prochainTir) {
    e.prochainTir = t + cadenceDuTir(config, e)
    let cible: Ennemi | null = null
    let dmin = Infinity
    for (const en of e.ennemis) {
      const d = Math.hypot(en.x, en.y)
      if (d < dmin && en.y > -(vue.haut + 1)) {
        dmin = d
        cible = en
      }
    }
    if (cible !== null) {
      const n = tirsParSalve(e)
      const a0 = Math.atan2(cible.y, cible.x)
      for (let i = 0; i < n; i++) {
        const a = a0 + (i - (n - 1) / 2) * config.tir.ecart
        e.tirs.push({ x: Math.cos(a) * config.cercle.rayon, y: Math.sin(a) * config.cercle.rayon, vx: Math.cos(a) * config.tir.vitesse, vy: Math.sin(a) * config.tir.vitesse, degats: degatsDuTir(config, e), percant: e.ameliorations.percant, touches: [], renvoye: false })
      }
      ev.push({ type: 'tir', n })
    }
  }

  // LES ENNEMIS avancent (ou reculent, étourdis) ; l'hexagone s'arrête et tire.
  for (const en of [...e.ennemis]) {
    const c = config.ennemis[en.type]
    en.angle += dt * (en.type === 'triangle' ? 2.2 : en.type === 'carre' ? 0.9 : 0.5)
    if (t < en.etourdiA) {
      const reste = (en.etourdiA - t) / config.parade.etourdi
      en.x += en.reculVx * reste * dt
      en.y += en.reculVy * reste * dt
      continue
    }
    if (en.contactA !== null) {
      // Collé au cercle : le coup tombe après la fenêtre d'après.
      if (t - en.contactA >= config.parade.apres * largeurDeGarde(config, e)) {
        e.ennemis = e.ennemis.filter((x) => x !== en)
        encaisser(config, e, c.degats, en.x, en.y, 'ennemi', ev)
      }
      continue
    }
    const d = Math.hypot(en.x, en.y) || 1
    const v = vitesseDe(config, e, en.type)
    if (en.type === 'hexagone' && d <= config.hexagone.halte + 0.5) {
      // Il dérive de côté et tire vers le cercle. Arrivé à sa halte, il respire une demi-cadence avant son premier tir (son cœur s'allume : le joueur voit venir).
      if (en.tirA < t) en.tirA = t + config.hexagone.tir.cadence / 2
      en.x += en.sens * config.hexagone.derive * dt
      if (Math.abs(en.x) > vue.demiLargeur - c.rayon - 2) en.sens = en.sens === 1 ? -1 : 1
      if (t >= en.tirA) {
        en.tirA = t + config.hexagone.tir.cadence
        const dd = Math.hypot(en.x, en.y) || 1
        const vt = config.hexagone.tir.vitesse
        e.projectiles.push({ id: e.prochainId++, x: en.x, y: en.y, vx: (-en.x / dd) * vt, vy: (-en.y / dd) * vt, contactA: null, de: en.id })
        ev.push({ type: 'projectile', x: en.x, y: en.y })
      }
      continue
    }
    const pas = Math.min(v * dt, Math.max(0, d - config.cercle.rayon - c.rayon))
    en.x -= (en.x / d) * pas
    en.y -= (en.y / d) * pas
    if (Math.hypot(en.x, en.y) <= config.cercle.rayon + c.rayon + 1e-6) en.contactA = t
  }

  // LES LOSANGES filent vers le cercle.
  for (const pr of [...e.projectiles]) {
    if (pr.contactA !== null) {
      if (t - pr.contactA >= config.parade.apres * largeurDeGarde(config, e)) {
        e.projectiles = e.projectiles.filter((x) => x !== pr)
        encaisser(config, e, config.hexagone.tir.degats, pr.x, pr.y, 'projectile', ev)
      }
      continue
    }
    pr.x += pr.vx * dt
    pr.y += pr.vy * dt
    if (Math.hypot(pr.x, pr.y) <= config.cercle.rayon + config.hexagone.tir.rayon) {
      pr.contactA = t
      pr.vx = 0
      pr.vy = 0
    } else if (pr.y > config.cercle.rayon + 10 || Math.abs(pr.x) > vue.demiLargeur + 10) {
      e.projectiles = e.projectiles.filter((x) => x !== pr)
    }
  }

  // LES TIRS du cercle (et les losanges renvoyés) frappent ce qu'ils croisent.
  for (const tir of [...e.tirs]) {
    tir.x += tir.vx * dt
    tir.y += tir.vy * dt
    if (tir.y < -(vue.haut + 12) || Math.abs(tir.x) > vue.demiLargeur + 12 || tir.y > config.cercle.rayon + 12) {
      e.tirs = e.tirs.filter((x) => x !== tir)
      continue
    }
    const rayon = tir.renvoye ? config.hexagone.tir.rayon : config.tir.rayon
    for (const en of [...e.ennemis]) {
      if (tir.touches.includes(en.id)) continue
      if (Math.hypot(en.x - tir.x, en.y - tir.y) > rayon + config.ennemis[en.type].rayon) continue
      tir.touches.push(en.id)
      blesser(config, e, en, tir.degats, ev)
      if (tir.touches.length > tir.percant) {
        e.tirs = e.tirs.filter((x) => x !== tir)
        break
      }
    }
  }
  return ev
}

/** Le cercle encaisse ; à zéro, la partie est perdue. */
function encaisser(config: ConfigNeon, e: EtatNeon, degats: number, x: number, y: number, sorte: 'ennemi' | 'projectile', ev: Evenement[]): void {
  void config
  e.pv = Math.max(0, e.pv - degats)
  ev.push({ type: 'coup', degats, x, y, sorte })
  if (e.pv === 0) {
    e.phase = 'perdu'
    ev.push({ type: 'perdu' })
  }
}

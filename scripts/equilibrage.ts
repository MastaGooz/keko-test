// L'ÉQUILIBRAGE DES ARMES DU VORTEX, MESURÉ (Keko, 20/11 : « passe en revue toutes les armes du jeu et calcule leur
// équilibrage : les dégâts, la fréquence, le nombre de projectiles, ce qui peut frapper une cible unique en même temps,
// le nombre de cibles, la distance, et les spécificités — le hasard du dé, les tourelles, les vers des œufs ») : chaque
// arme est montée comme en vol (la configuration de `configDuVol` dans `page.ts`, recopiée ici) et jouée par LA RÈGLE
// (`avancerLeMonde`), sur trois bancs :
//   MONO   — un insecte increvable qui défile en ligne droite devant le vaisseau, à 40 de vitesse, à 15, 35, 60, 90 et
//            120 : les dégâts par seconde sur une cible seule, à chaque distance ; leur moyenne dit la portée ;
//   FOULE  — douze insectes increvables, serrés dans un disque de 22, qui défilent ensemble à 45 puis à 90 : les dégâts
//            par seconde sur tous ;
//   BOSS   — un seul insecte increvable qui poursuit le vaisseau (immobile ou en rond) : la cible unique en jeu ;
//   VAGUE  — de vrais insectes (12 points, 40 de vitesse) qui foncent sur le vaisseau depuis 150, dix à la fois,
//            remplacés à leur mort : combien il en abat par seconde, le vaisseau immobile ou tournant en rond (le meilleur
//            des deux : les traînées et les mines veulent qu'on bouge).
// `npm run equilibrage` ; `-- --arme=arme-nova` une seule ; `-- --json` les mesures brutes ; `-- --facteurs=f.json`
// multiplie les dégâts de chaque arme par son facteur avant de mesurer (pour chercher un réglage).
import { readFileSync } from 'node:fs'
import { VAISSEAU, CHAMPS_DE_DEGATS, degatsMultiplies, avancerLeMonde, nouveauMonde, cargaisonVide, type ConfigVaisseau, type Ennemi, type Monde } from '../src/logic/vaisseau/jeu.ts'
import { configDuHangar, pieceDe } from '../src/logic/vaisseau/hangar.ts'
import { MODELES } from '../src/logic/vaisseau/flotte.ts'
import { boucheMontee, RACINES_DU_KRAKEN, ANCRES_DU_KRAKEN } from '../src/ui/vaisseau/rendu-vaisseau.ts'

const ARMES_PAR_VAISSEAU: Record<string, string[]> = { chasseur: ['arme-laser', 'arme-mitrailleuse', 'arme-minimissiles'], salamandre: ['arme-flammes', 'arme-rayon', 'arme-napalm'], sentinelle: ['arme-drones', 'arme-chaine', 'arme-aura'], ingenieur: ['arme-tourelles', 'arme-scie', 'arme-fleau'], frimas: ['arme-nova', 'arme-eclats', 'arme-tornade'], pulsar: ['arme-plasma', 'arme-essaim', 'arme-meteore'], kraken: ['arme-tentacules', 'arme-nuee', 'arme-rejetons'], vouivre: ['arme-crachat', 'arme-mines', 'arme-poison'], prisme: ['arme-faisceau', 'arme-cristaux', 'arme-rail'], neant: ['arme-puits', 'arme-drain', 'arme-vrilles'], mante: ['arme-parasites', 'arme-oeufs', 'arme-epines'], tesseract: ['arme-hypercube', 'arme-de', 'arme-coupe'] }
const ECHELLE = 10 // (l'échelle du vortex : les dégâts et les points de vie fois dix — voir `ECHELLE_DU_VORTEX`)
const INSECTE = { pv: 12 * ECHELLE, poussee: 90, vitesseMax: 40, rotation: 6, rayon: 5, butinRendu: 1, armes: [] as never[] }
const ARC = (50 * Math.PI) / 180
const ECHELLE_EN_VOL = 1.25

function multiplier(o: unknown, k: number): unknown {
  if (Array.isArray(o)) return o
  if (o === null || typeof o !== 'object') return o
  const r: Record<string, unknown> = {}
  for (const [cle, v] of Object.entries(o)) r[cle] = typeof v === 'number' && CHAMPS_DE_DEGATS.has(cle) ? v * k : multiplier(v, k)
  return r
}

function configDe(vaisseau: string, idArme: string, facteur = 1): ConfigVaisseau {
  const mo = MODELES.find((m) => m.id === vaisseau)!
  const coque = pieceDe(mo.serie.montees.coque!)!.cran
  let conf = configDuHangar(VAISSEAU, mo.serie)
  const canon = degatsMultiplies(multiplier(pieceDe(idArme)!.arme!, facteur), ECHELLE) as NonNullable<ReturnType<typeof pieceDe>>['arme'] & object
  const b = (place: number) => boucheMontee(coque, canon.id, place)
  const c = canon as Record<string, unknown>
  const a = (k: string): boolean => c[k] !== undefined
  if (['napalm', 'crachat', 'plasma', 'essaim', 'sphere', 'puits', 'meteore', 'rail', 'balayage', 'canalise', 'chaine', 'aura'].some(a)) conf = { ...conf, marcheArriere: 1, alternance: false, armes: [{ ...canon, place: 0, bouche: b(0) }] }
  else if (a('tentacule')) conf = { ...conf, marcheArriere: 1, alternance: false, armes: [{ ...canon, place: 0, tentacule: { ...canon.tentacule!, ancres: canon.tentacule!.alterne === true ? RACINES_DU_KRAKEN : ANCRES_DU_KRAKEN } }] }
  else if (['nuee', 'rejeton', 'mine', 'fleau', 'parasite', 'drain', 'vrille', 'ponte', 'epines', 'hypercube', 'de', 'coupe'].some(a)) conf = { ...conf, marcheArriere: 1, alternance: false, armes: [{ ...canon, place: 0 }] }
  else if (a('pose') || a('scie')) conf = { ...conf, marcheArriere: 1, alternance: false, armes: [{ ...canon, place: 0, bouche: b(0) }] }
  else if (['balise', 'givre', 'nova', 'salve', 'condense', 'tornade'].some(a)) conf = { ...conf, marcheArriere: 1, alternance: false, armes: [{ ...canon, place: 0 }] }
  else if (a('orbite')) conf = { ...conf, marcheArriere: 1, alternance: false, armes: [0, 1, 2].map((k) => ({ ...canon, place: k, orbite: { ...canon.orbite!, phase: (k * 2 * Math.PI) / 3 } })) }
  else if (a('flamme')) conf = { ...conf, marcheArriere: 1, alternance: false, armes: [{ ...canon, place: 0, bouche: b(0) }] }
  else conf = { ...conf, marcheArriere: 1, alternance: true, arcDeTir: ARC, armes: [0, 1].map((place) => ({ ...canon, cadence: canon.cadence * 2, place, bouche: b(place) })) }
  conf = { ...conf, champ: { ...conf.champ, densite: 0 }, station: { ...conf.station, portee: -1 }, invasion: { ...conf.invasion, active: true, premiere: 1e9 }, ennemi: { ...conf.ennemi, ...INSECTE }, collision: { ...conf.collision, degatsEnnemi: 0 } }
  // (les chocs du vaisseau contre les insectes ne comptent pas : ce n'est pas l'arme — en rond, il les percutait)
  conf = { ...conf, armes: conf.armes.map((x) => ({ ...x, ...(x.bouche === undefined ? {} : { bouche: { x: x.bouche.x * ECHELLE_EN_VOL, y: x.bouche.y * ECHELLE_EN_VOL } }), ...(x.tentacule === undefined ? {} : { tentacule: { ...x.tentacule, ancres: x.tentacule.ancres.map(([p, q]): [number, number] => [p * ECHELLE_EN_VOL, q * ECHELLE_EN_VOL]) } }) })) }
  return conf
}

// (loin du portail, qui avale les insectes à 32 du centre)
const OX = -400
const OY = 0
const PAS = 1 / 60

function insecte(m: Monde, x: number, y: number, pv: number): Ennemi {
  return { id: m.prochainId++, corps: { ...m.vaisseau, x, y, vx: 0, vy: 0, cap: Math.PI, poussee: 0 }, pv, fait: 'marche', roche: null, forage: null, tirA: 0, butin: 0, cargaison: cargaisonVide() }
}

/** Un vaisseau qui tourne en rond, à 45 par seconde : autour de (cx, cy), à `r`. */
type Rond = { t: number; cx: number; cy: number; r: number }
/** Fait avancer d'un pas, le vaisseau intouchable, le nez vers l'insecte le plus proche (comme en vol, le regard suit la cible). */
function pas(c: ConfigVaisseau, m: Monde, bouge?: Rond): void {
  const v = m.vaisseau
  if (bouge !== undefined) {
    const an = (bouge.t * 45) / bouge.r
    m.vaisseau = { ...v, x: bouge.cx + Math.cos(an) * bouge.r, y: bouge.cy + Math.sin(an) * bouge.r, vx: -Math.sin(an) * 45, vy: Math.cos(an) * 45 }
    bouge.t += PAS
  }
  const va = m.vaisseau
  let proche: Ennemi | null = null
  for (const e of m.ennemis) if (proche === null || Math.hypot(e.corps.x - va.x, e.corps.y - va.y) < Math.hypot(proche.corps.x - va.x, proche.corps.y - va.y)) proche = e
  const regard = proche === null ? { x: 1, y: 0 } : { x: proche.corps.x - va.x, y: proche.corps.y - va.y }
  m.intouchableJusque = Infinity
  m.coque = c.coque
  avancerLeMonde(c, m, PAS, { x: 0, y: 0 }, regard)
}

const IMMOBILE = (c: ConfigVaisseau): ConfigVaisseau => ({ ...c, ennemi: { ...c.ennemi, vitesseMax: 0, poussee: 0 } })
const BEAUCOUP = 1e6

function monde(c: ConfigVaisseau): Monde {
  const m = nouveauMonde(c, 7)
  m.vaisseau = { ...m.vaisseau, x: OX, y: OY, cap: 0, vx: 0, vy: 0 }
  return m
}

/**
 * Les insectes de `cibles` DÉFILENT DEVANT LE VAISSEAU, EN LIGNE DROITE, à la vitesse d'un insecte (40) : à `d` devant lui,
 * de 40 à sa gauche à 40 à sa droite, puis de nouveau — comme un insecte qui passe vers le portail. Posés à chaque pas
 * (leur propre conduite est éteinte), leur vitesse dite à la règle : ce qui vise en avance les voit bouger. Tout bouge en
 * jeu : une zone posée sur une cible immobile la frappait sans fin.
 */
function defiler(m: Monde, cibles: { e: Ennemi; dx: number; dy: number }[], d: number, t: number): void {
  const y = ((t * 40) % 80) - 40
  for (const { e, dx, dy } of cibles) e.corps = { ...e.corps, x: OX + d + dx, y: OY + y + dy, vx: 0, vy: 40, cap: Math.PI / 2 }
}

/** Les dégâts par seconde sur un insecte seul, qui défile à `d` devant le vaisseau. */
function mono(c0: ConfigVaisseau, d: number, duree = 14): number {
  const c = IMMOBILE(c0)
  const m = monde(c)
  const e = insecte(m, OX + d, OY, BEAUCOUP)
  m.ennemis.push(e)
  for (let i = 0; i < duree / PAS; i++) {
    defiler(m, [{ e, dx: 0, dy: 0 }], d, i * PAS)
    pas(c, m)
  }
  return (BEAUCOUP - e.pv) / duree
}

/** Les dégâts par seconde sur douze insectes serrés dans un disque de 22, qui défilent ensemble à `d` devant le vaisseau. */
function foule(c0: ConfigVaisseau, d: number, duree = 14): number {
  const c = IMMOBILE(c0)
  const m = monde(c)
  const cibles = Array.from({ length: 12 }, (_, k) => {
    const r = 22 * Math.sqrt((k + 0.5) / 12)
    const a = k * 2.39996
    const e = insecte(m, OX + d, OY, BEAUCOUP)
    m.ennemis.push(e)
    return { e, dx: Math.cos(a) * r, dy: Math.sin(a) * r }
  })
  for (let i = 0; i < duree / PAS; i++) {
    defiler(m, cibles, d, i * PAS)
    pas(c, m)
  }
  return (12 * BEAUCOUP - cibles.reduce((s, x) => s + x.e.pv, 0)) / duree
}

/**
 * Combien de vrais insectes il abat par seconde : dix à la fois, depuis 150, remplacés à leur mort ; et LE FREIN — de
 * combien, en moyenne, ses insectes avancent moins vite que 40 (gel, ralenti, saisie) tant qu'ils ne sont pas sur lui.
 */
function vague(c: ConfigVaisseau, enRond: boolean, duree = 40): { abattus: number; frein: number } {
  const m = monde(c)
  let nes = 0
  let vitesses = 0
  let n = 0
  const bouge = enRond ? { t: 0, cx: OX, cy: OY, r: 60 } : undefined
  for (let i = 0; i < duree / PAS; i++) {
    m.ennemis = m.ennemis.filter((e) => e.pv > 0)
    while (m.ennemis.length < 10) {
      const a = nes++ * 2.39996
      const e = insecte(m, m.vaisseau.x + Math.cos(a) * 150, m.vaisseau.y + Math.sin(a) * 150, INSECTE.pv)
      e.fait = 'aggro'
      m.ennemis.push(e)
    }
    const avant = new Map(m.ennemis.map((e) => [e, { x: e.corps.x, y: e.corps.y }]))
    pas(c, m, bouge)
    for (const [e, p] of avant)
      if (e.pv > 0 && m.ennemis.includes(e) && Math.hypot(e.corps.x - m.vaisseau.x, e.corps.y - m.vaisseau.y) > 25) {
        vitesses += Math.min(INSECTE.vitesseMax, Math.hypot(e.corps.x - p.x, e.corps.y - p.y) / PAS)
        n++
      }
  }
  return { abattus: m.invasion.abattus / duree, frein: n === 0 ? 0 : 1 - vitesses / n / INSECTE.vitesseMax }
}

/** Les dégâts par seconde sur UN GROS INSECTE increvable qui poursuit le vaisseau (immobile, ou tournant en rond à 60) — le boss. */
function boss(c: ConfigVaisseau, enRond: boolean, duree = 20): number {
  const m = monde(c)
  const e = insecte(m, OX + 120, OY, BEAUCOUP)
  e.fait = 'aggro'
  m.ennemis.push(e)
  const bouge = enRond ? { t: 0, cx: OX, cy: OY, r: 60 } : undefined
  for (let i = 0; i < duree / PAS; i++) pas(c, m, bouge)
  return (BEAUCOUP - e.pv) / duree
}

/**
 * L'INDICE DE PUISSANCE d'une arme : chaque banc rapporté à LA MÉDIANE DE LA FLOTTE D'AVANT L'ÉQUILIBRAGE (mesurée le
 * 20/11 : on ramène chaque arme au milieu d'alors, pas à un milieu qui bouge avec elles), pesé — la cible unique la moitié
 * (portée 0,25, boss 0,25), la foule 0,15, la vague 0,35 —, puis majoré de ce qu'elle FREINE les insectes au-delà du
 * frein commun (5 %) : le gel, le ralenti, la saisie valent des dégâts. 1 : la puissance de la médiane. *Les poids et la
 * valeur du frein sont des choix, à rejuger.*
 */
const MEDIANES = { monoMoy: 46.3, bossMax: 64.7, fouleMoy: 109.9, vagueMax: 1.19 } // (les dégâts à l'échelle du vortex, fois dix)
const POIDS = { monoMoy: 0.25, bossMax: 0.25, fouleMoy: 0.15, vagueMax: 0.35 }
const indice = (d: Record<keyof typeof POIDS, number> & { frein: number }): number => (Object.keys(POIDS) as (keyof typeof POIDS)[]).reduce((s, k) => s + (POIDS[k] * d[k]) / MEDIANES[k], 0) * (1 + Math.max(0, d.frein - 0.05))

const args = new Map(process.argv.slice(2).map((a) => a.replace(/^--/, '').split('=') as [string, string]))
const facteurs: Record<string, number> = args.has('facteurs') ? JSON.parse(readFileSync(args.get('facteurs')!, 'utf8')) : {}
for (const [vaisseau, armes] of Object.entries(ARMES_PAR_VAISSEAU))
  for (const id of armes) {
    if (args.has('arme') && args.get('arme') !== id) continue
    const c = configDe(vaisseau, id, facteurs[id] ?? 1)
    const distances = [15, 35, 60, 90, 120].map((d) => mono(c, d))
    const f = [45, 90].map((d) => foule(c, d))
    const v = [vague(c, false), vague(c, true)]
    const meilleure = v[0].abattus >= v[1].abattus ? v[0] : v[1]
    const b = [boss(c, false), boss(c, true)]
    const d = { vaisseau, arme: id, mono: distances.map((x) => +x.toFixed(1)), monoMoy: +(distances.reduce((s, x) => s + x, 0) / 5).toFixed(2), foule: f.map((x) => +x.toFixed(1)), fouleMoy: +((f[0] + f[1]) / 2).toFixed(2), vague: v.map((x) => +x.abattus.toFixed(2)), vagueMax: +meilleure.abattus.toFixed(2), frein: +v[0].frein.toFixed(2), boss: b.map((x) => +x.toFixed(1)), bossMax: +Math.max(...b).toFixed(2) }
    console.log(args.has('json') ? JSON.stringify(d) : `${id.padEnd(18)} indice ${indice(d).toFixed(2)}   portée ${(d.monoMoy / MEDIANES.monoMoy).toFixed(2)}  boss ${(d.bossMax / MEDIANES.bossMax).toFixed(2)}  foule ${(d.fouleMoy / MEDIANES.fouleMoy).toFixed(2)}  vague ${(d.vagueMax / MEDIANES.vagueMax).toFixed(2)}  frein ${d.frein.toFixed(2)}`)
  }

/**
 * LE GRAPHE DE LIENS DU POOL, pour le prototype de plateau.
 *
 * Pour chaque personnage du catalogue, on demande à l'API de fr.wikipedia la
 * liste de ses liens sortants, on ne garde que ceux qui tombent sur un autre
 * personnage du pool, et on symétrise. Sortie : `public/data/links.json`.
 *
 * **LE JEU N'APPELLE JAMAIS L'API** : le fichier est engendré une fois et
 * commité. C'est la règle du catalogue, reprise ici.
 *
 * ```
 * npm run liens                  # tout le pool, en profitant du cache
 * npm run liens -- --frais       # ignorer le cache
 * npm run liens -- --cible=300   # ne collecter que les N plus notoires
 * ```
 *
 * **LES REDIRECTIONS DES CIBLES SONT RÉSOLUES**, et ce n'est pas optionnel :
 * `redirects=1` ne résout que les titres qu'on DEMANDE, pas les cibles des
 * liens. Un article qui pointe vers « Napoléon Bonaparte » — une redirection —
 * ne serait jamais relié à la carte « Napoléon Ier ». *Un graphe qui rate des
 * arêtes en silence est pire qu'un graphe vide*, et ça ne coûte que soixante
 * requêtes de plus.
 *
 * Mesuré avant de l'écrire : ~346 liens par article, donc **~3 700 requêtes et
 * neuf à quinze minutes** sur les trois mille.
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { dors, journal, option, paquets, json } from './outils.ts'

const WIKI = 'https://fr.wikipedia.org/w/api.php'
const POOL = new URL('../public/data/characters.json', import.meta.url)
const SORTIE = new URL('../public/data/links.json', import.meta.url)

/** `prop=links` et `prop=redirects` acceptent cinquante titres par appel. */
const PAR_LOT = 50

/**
 * Borne de sécurité : *une pagination qui dépend d'un jeton distant ne doit pas
 * pouvoir tourner sans fin.*
 *
 * **ELLE DOIT ÊTRE LARGE, ET MON PREMIER ESSAI L'A PROUVÉ** : `pllimit=max`
 * rend cinq cents liens par page, et cinquante articles en portent dix-sept
 * mille en moyenne — donc trente-cinq pages, et jusqu'à cinquante sur un lot
 * riche. À quarante, l'essai s'est arrêté PILE sur la borne (20 000 liens
 * exactement) : *un lot tronqué rend un graphe plus pauvre sans qu'une seule
 * ligne ne le dise.*
 *
 * On la laisse donc trois fois au-dessus du pire cas mesuré, et le journal
 * compte les pages atteintes pour qu'une troncature se voie.
 */
const PAGES_MAX = 150

interface Carte {
  id: string
  nom: string
  article: string
}

interface PageLiens {
  title?: string
  links?: { title?: string }[]
  redirects?: { title?: string }[]
}

interface Reponse {
  query?: {
    pages?: PageLiens[]
    normalized?: { from: string; to: string }[]
    redirects?: { from: string; to: string }[]
  }
  continue?: Record<string, string>
}

function requete(params: Record<string, string>): string {
  return `${WIKI}?${new URLSearchParams({ format: 'json', formatversion: '2', ...params })}`
}

/**
 * UNE REQUÊTE PAGINÉE, ACCUMULÉE PAR TITRE.
 *
 * `prop=links` rend cinq cents liens par appel, **tous titres confondus** :
 * c'est le volume qui décide du nombre d'appels, pas le nombre de titres. On
 * fusionne donc par titre plutôt que de remplacer — *chaque tour rend les mêmes
 * pages en n'en complétant qu'une partie*, la leçon déjà payée sur les vues.
 */
async function paginer(
  nom: string,
  params: Record<string, string>,
  champ: 'links' | 'redirects',
): Promise<Map<string, string[]>> {
  const par = new Map<string, string[]>()
  let suite: Record<string, string> = {}
  for (let page = 0; page < PAGES_MAX; page++) {
    const url = requete({ ...params, ...suite })
    const d = await json<Reponse>(`${nom}-${page}`, url)
    if (d === null) break
    // LES REDIRECTIONS DU TITRE DEMANDÉ : l'API répond sous le titre CIBLE,
    // donc sans cette chaîne on ne saurait pas à quelle carte rattacher la page.
    const versDemande = new Map<string, string>()
    for (const n of d.query?.normalized ?? []) versDemande.set(n.to, n.from)
    for (const r of d.query?.redirects ?? []) versDemande.set(r.to, r.from)
    for (const p of d.query?.pages ?? []) {
      if (p.title === undefined) continue
      const demande = versDemande.get(p.title) ?? p.title
      const liste = par.get(demande) ?? []
      for (const l of p[champ] ?? []) if (l.title !== undefined) liste.push(l.title)
      par.set(demande, liste)
    }
    if (d.continue === undefined) return par
    suite = d.continue
  }
  // LA BORNE ATTEINTE EST UNE TRONCATURE, et elle doit crier : le lot rend un
  // graphe plus pauvre, et rien d'autre ne le signalerait.
  journal(`  ${nom} : ${PAGES_MAX} pages atteintes — LOT TRONQUE, le graphe est incomplet`)
  return par
}

/**
 * TITRE -> CARTE, redirections comprises.
 *
 * *Sans les redirections, la table ne reconnaît que le titre canonique* — et
 * Wikipédia renvoie volontiers vers un synonyme.
 */
async function tableDesTitres(cartes: Carte[]): Promise<Map<string, string>> {
  const par = new Map<string, string>()
  for (const c of cartes) par.set(c.article, c.id)

  const lots = paquets(cartes, PAR_LOT)
  journal(`Redirections : ${cartes.length} articles en ${lots.length} paquets`)
  let trouvees = 0
  for (const [i, lot] of lots.entries()) {
    const titres = lot.map((c) => c.article)
    const parTitre = await paginer(
      `redir-${i}`,
      { action: 'query', prop: 'redirects', titles: titres.join('|'), rdnamespace: '0', rdlimit: 'max' },
      'redirects',
    )
    for (const c of lot)
      for (const alias of parTitre.get(c.article) ?? []) {
        // UNE REDIRECTION PARTAGÉE NE DÉSIGNE PERSONNE : si deux cartes la
        // revendiquent, on la laisse à la première et on n'invente pas d'arête.
        if (!par.has(alias)) {
          par.set(alias, c.id)
          trouvees++
        }
      }
    await dors(80)
  }
  journal(`  ${trouvees} alias retenus, ${par.size} titres au total`)
  return par
}

/** Les liens sortants qui tombent dans le pool, par identifiant de carte. */
async function collecter(cartes: Carte[], titres: Map<string, string>): Promise<Map<string, Set<string>>> {
  const sortants = new Map<string, Set<string>>()
  for (const c of cartes) sortants.set(c.id, new Set())

  const lots = paquets(cartes, PAR_LOT)
  journal(`Liens : ${cartes.length} articles en ${lots.length} paquets`)
  let vus = 0
  let retenus = 0
  for (const [i, lot] of lots.entries()) {
    const parTitre = await paginer(
      `liens-${i}`,
      { action: 'query', prop: 'links', titles: lot.map((c) => c.article).join('|'), plnamespace: '0', pllimit: 'max', redirects: '1' },
      'links',
    )
    for (const c of lot) {
      const vers = sortants.get(c.id)
      if (vers === undefined) continue
      for (const cible of parTitre.get(c.article) ?? []) {
        vus++
        const id = titres.get(cible)
        if (id !== undefined && id !== c.id) {
          vers.add(id)
          retenus++
        }
      }
    }
    if ((i + 1) % 10 === 0) journal(`  ${(i + 1) * PAR_LOT}/${cartes.length} — ${retenus} arcs retenus sur ${vus} liens vus`)
    await dors(80)
  }
  journal(`  ${vus} liens parcourus, ${retenus} arcs dans le pool`)
  return sortants
}

/** Le graphe NON ORIENTÉ : l'article de A pointe vers B, ou l'inverse. */
function symetriser(sortants: Map<string, Set<string>>): Map<string, Set<string>> {
  const voisins = new Map<string, Set<string>>()
  for (const id of sortants.keys()) voisins.set(id, new Set())
  for (const [a, vers] of sortants)
    for (const b of vers) {
      voisins.get(a)?.add(b)
      voisins.get(b)?.add(a)
    }
  return voisins
}

/**
 * LES COMPOSANTES, parce que « liées » et « reliées » ne sont pas la même
 * chose. Keko : « donc y'a aucun chemin possible entre la majorité des
 * cartes ? »
 *
 * *La densité dit si deux cartes se pointent DIRECTEMENT* — c'est elle qui
 * décide du jeu, puisque la synergie demande l'adjacence sur la grille. **La
 * connexité, elle, dit s'il existe un CHEMIN**, et un degré moyen de huit
 * suffit à relier presque tout le monde.
 */
function composantes(voisins: Map<string, Set<string>>): number[] {
  const vu = new Set<string>()
  const tailles: number[] = []
  for (const depart of voisins.keys()) {
    if (vu.has(depart)) continue
    let n = 0
    const pile = [depart]
    vu.add(depart)
    while (pile.length > 0) {
      const id = pile.pop() as string
      n++
      for (const v of voisins.get(id) ?? []) if (!vu.has(v)) { vu.add(v); pile.push(v) }
    }
    tailles.push(n)
  }
  return tailles.sort((a, b) => b - a)
}

/**
 * LA DISTANCE MOYENNE, sur un échantillon de départs.
 *
 * *Un calcul exact demanderait un parcours par carte* — trois mille parcours
 * sur trente mille arêtes. Cent départs suffisent à dire si c'est trois ou
 * dix, et c'est la seule chose qu'on veut savoir.
 */
function distanceMoyenne(voisins: Map<string, Set<string>>, departs: string[]): { moyenne: number; max: number } {
  let somme = 0
  let paires = 0
  let max = 0
  for (const depart of departs) {
    const d = new Map<string, number>([[depart, 0]])
    let bord = [depart]
    while (bord.length > 0) {
      const suivant: string[] = []
      for (const id of bord)
        for (const v of voisins.get(id) ?? [])
          if (!d.has(v)) {
            d.set(v, (d.get(id) as number) + 1)
            suivant.push(v)
          }
      bord = suivant
    }
    for (const [, k] of d)
      if (k > 0) {
        somme += k
        paires++
        if (k > max) max = k
      }
  }
  return { moyenne: paires === 0 ? 0 : somme / paires, max }
}

async function main(): Promise<void> {
  const debut = Date.now()
  const pool = JSON.parse(readFileSync(POOL, 'utf8')) as { cartes: Carte[] }
  const cible = Number(option('cible') ?? '0')
  const cartes = cible > 0 ? pool.cartes.slice(0, cible) : pool.cartes
  journal(`Pool : ${cartes.length} cartes${cible > 0 ? ` (les ${cible} plus notoires)` : ''}`)

  const titres = await tableDesTitres(cartes)
  const sortants = await collecter(cartes, titres)
  const voisins = symetriser(sortants)

  // ------------------------------------------------------------------ les stats
  const n = cartes.length
  const degres = [...voisins.values()].map((s) => s.size)
  const aretes = degres.reduce((a, b) => a + b, 0) / 2
  const isoles = degres.filter((k) => k === 0).length
  const p = aretes / ((n * (n - 1)) / 2)
  const parts = composantes(voisins)
  const depart = [...voisins.keys()].filter((id) => (voisins.get(id)?.size ?? 0) > 0).slice(0, 100)
  const d = distanceMoyenne(voisins, depart)
  const nomDe = new Map(cartes.map((c) => [c.id, c.nom]))

  journal('')
  journal(`arêtes                     : ${aretes}`)
  journal(`degré moyen                : ${(degres.reduce((a, b) => a + b, 0) / n).toFixed(2)}`)
  journal(`degré médian               : ${[...degres].sort((a, b) => a - b)[Math.floor(n / 2)]}`)
  journal(`sans aucun lien            : ${isoles} / ${n} (${((100 * isoles) / n).toFixed(1)} %)`)
  journal(`densité p                  : ${(100 * p).toFixed(3)} %`)
  journal(`composantes                : ${parts.length}, la plus grande ${parts[0]} (${((100 * (parts[0] ?? 0)) / n).toFixed(1)} %)`)
  journal(`distance moyenne           : ${d.moyenne.toFixed(2)}, la plus longue ${d.max}`)
  journal('')
  journal(`CE QUE ÇA DONNE AU JEU, main de 10 et grille 4x4 :`)
  journal(`  paires liées dans la main : ${(p * 45).toFixed(2)} sur 45 couples possibles`)
  journal(`  mains sans aucune paire   : ${(100 * (1 - p) ** 45).toFixed(0)} %`)
  journal('')
  journal('les 10 plus connectés :')
  for (const [id, s] of [...voisins].sort((a, b) => b[1].size - a[1].size).slice(0, 10))
    journal(`  ${String(s.size).padStart(4)}  ${nomDe.get(id) ?? id}`)

  // LE FICHIER NE PORTE QUE LES CARTES QUI ONT UN VOISIN : un identifiant à
  // liste vide pèse onze octets pour dire ce que l'absence dit déjà.
  const liens: Record<string, string[]> = {}
  for (const [id, s] of voisins) if (s.size > 0) liens[id] = [...s].sort()
  writeFileSync(
    SORTIE,
    JSON.stringify({
      genere: new Date().toISOString(),
      cartes: n,
      aretes,
      liens,
    }),
    'utf8',
  )
  journal('')
  journal(`Écrit ${SORTIE.pathname.split('/').pop()} — ${Object.keys(liens).length} cartes liées, ${((Date.now() - debut) / 60000).toFixed(1)} min`)
}

void main()

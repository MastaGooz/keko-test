/**
 * LE PIPELINE DES CARTES-ANIMAUX — de l'arbre du vivant à `animals.json`.
 *
 * **UNE CARTE EST UN NOEUD DE L'ARBRE, à n'importe quel rang.** Posé par Keko,
 * et tout le script en découle : on descend depuis Mammalia et on s'arrête dès
 * que le public ne saurait plus nommer la branche. « Chauve-souris » est un
 * ordre de 1400 espèces et fait UNE carte ; « lion » et « tigre » sont deux
 * espèces d'un même genre et font DEUX cartes.
 *
 * **L'INVARIANT QUI TIENT TOUT : une espèce réelle tombe dans exactement une
 * carte.** Il se vérifie en fin de course, et il se dit bruyamment — *une coupe
 * qui perd des espèces en silence ne se verrait jamais.*
 *
 * Lancé par `npm run gen:animals`, hors du build Vite.
 */

import { writeFileSync, mkdirSync } from 'node:fs'
import { cache, journal, option, paquets, json, UA } from './outils.ts'
import {
  RARETES_ANIMAL,
  type CarteAnimal,
  type RareteAnimal,
  type StatutUicn,
} from '../src/logic/animals/types.ts'

// ---------------------------------------------------------------- les bornes

/** La racine du groupe : Mammalia dans le référentiel GBIF. */
const RACINE = 359
const GROUPE = 'mammifères'

/** Le référentiel GBIF, pour ne compter que les espèces de l'arbre canonique. */
const BACKBONE = 'd7dddbf4-2cf0-4f39-9b2a-bb099caae36c'

/**
 * Les rangs qu'on accepte comme noeuds candidats.
 *
 * **Les sous-espèces sont exclues**, et c'est délibéré : elles sont le niveau
 * où la science distingue ce que le public confond — *« lion d'Afrique de
 * l'Ouest » n'est pas une carte* — et les compter romprait l'invariant, qui se
 * mesure en ESPÈCES.
 */
const RANGS = new Set([
  'SUBCLASS', 'INFRACLASS', 'SUPERORDER', 'ORDER', 'SUBORDER', 'INFRAORDER',
  'SUPERFAMILY', 'FAMILY', 'SUBFAMILY', 'TRIBE', 'GENUS', 'SUBGENUS', 'SPECIES',
])

/**
 * LES BORNES DU SCORE, en log10 des vues cumulées.
 *
 * **L'échelle est LOGARITHMIQUE, et ce n'est pas un détail** : la notoriété
 * suit une loi de puissance. En linéaire, le lion écrase tout le monde et
 * quatre-vingt-quinze pour cent des noeuds valent zéro. Leçon déjà payée sur le
 * mode personnages.
 */
const BORNES_SCORE: readonly [number, number] = [2.0, 7.0]

/**
 * LES PARTS DE CHAQUE CRAN DE RARETÉ — par QUANTILE, pas par seuil fixe.
 *
 * **Keko a tranché « notoriété pour la rareté »**, et le score qui décide de la
 * rareté est celui qui a décidé de la coupe. *Un seuil fixe ne peut donc pas
 * tenir* : il vivrait au-dessus du seuil de coupe, qui est un paramètre — à
 * coupe serrée, toutes les cartes seraient légendaires.
 *
 * Les quantiles garantissent la pyramide quelle que soit la coupe, et le script
 * IMPRIME les frontières de score obtenues : c'est ce qu'il faudra figer le
 * jour où le catalogue se stabilise.
 */
const PARTS_RARETE: readonly number[] = [0.70, 0.20, 0.075, 0.025]

/** Le seuil de coupe par défaut, à régler sur les trois sorties. */
const SEUIL_DEFAUT = 0.42

/**
 * LE PLAFOND DE NOEUDS EXAMINÉS — un garde-fou, pas un réglage.
 *
 * *Une descente qui ne sait pas quand s'arrêter n'a pas de pire cas* : la leçon
 * est écrite dans ce projet, payée sur la taxonomie SPARQL du mode personnages.
 * Un seuil très bas ouvre des centaines de familles, donc des milliers de
 * genres, et l'API des vues ne prend qu'un article par appel.
 */
const PLAFOND_NOEUDS = 4000

const SPARQL = 'https://query.wikidata.org/sparql'
const WIKI_FR = 'https://fr.wikipedia.org/w/api.php'
const REST = 'https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article'

// ---------------------------------------------------------------- l'arbre GBIF

type Noeud = {
  readonly key: number
  readonly nom: string
  readonly rang: string
}

type LigneGbif = {
  key?: number
  canonicalName?: string
  scientificName?: string
  rank?: string
  taxonomicStatus?: string
}

/**
 * LES ENFANTS D'UN NOEUD — paginés, et il faut tourner jusqu'au bout.
 *
 * GBIF rend `endOfRecords` : *un seul appel sur un grand genre ne rend que les
 * vingt premiers*, et rien ne le signale si on ne le lit pas.
 */
async function enfants(key: number): Promise<Noeud[]> {
  return cache(`gbif-enfants-${key}`, String(key), async () => {
    const tout: Noeud[] = []
    for (let offset = 0; offset < 20000; offset += 300) {
      const url = `https://api.gbif.org/v1/species/${key}/children?limit=300&offset=${offset}`
      const d = await json<{ results?: LigneGbif[]; endOfRecords?: boolean }>(
        `gbif-page-${key}-${offset}`,
        url,
      )
      if (d === null) break
      for (const r of d.results ?? []) {
        const nom = r.canonicalName ?? r.scientificName
        if (r.key === undefined || nom === undefined || r.rank === undefined) continue
        if (r.taxonomicStatus !== 'ACCEPTED') continue
        if (!RANGS.has(r.rank)) continue
        tout.push({ key: r.key, nom, rang: r.rank })
      }
      if (d.endOfRecords !== false) break
    }
    return tout
  })
}

/**
 * COMBIEN D'ESPÈCES SOUS UN NOEUD — demandé au compteur, pas parcouru.
 *
 * `limit=0` rend le `count` sans rapatrier une seule ligne : parcourir le
 * sous-arbre de Rodentia coûterait des milliers d'appels pour un nombre que
 * l'index connaît déjà.
 *
 * **Le référentiel contient des fossiles**, donc le compte n'est pas celui des
 * ~6400 espèces vivantes. *Ce n'est pas un défaut ici* : l'invariant demande que
 * la somme des parties égale le tout, et les deux se lisent dans le même
 * référentiel.
 */
async function especes(key: number, rang: string): Promise<number> {
  if (rang === 'SPECIES') return 1
  const url =
    `https://api.gbif.org/v1/species/search?datasetKey=${BACKBONE}` +
    `&higherTaxonKey=${key}&rank=SPECIES&status=ACCEPTED&limit=0`
  const d = await json<{ count?: number }>(`gbif-especes-${key}`, url)
  return d?.count ?? 0
}

// ------------------------------------------------------------------ Wikidata

type Info = {
  nomFr: string | null
  labelFr: string | null
  articleFr: string | null
  articleEn: string | null
  image: string | null
  iucn: StatutUicn | null
  masse: number | null
}

const UICN: Readonly<Record<string, StatutUicn>> = {
  'extinct': 'EX',
  'extinct in the wild': 'EW',
  'critically endangered': 'CR',
  'endangered': 'EN',
  'endangered species': 'EN',
  'vulnerable': 'VU',
  'vulnerable species': 'VU',
  'near threatened': 'NT',
  'least concern': 'LC',
  'data deficient': 'DD',
}

type LigneSparql = Record<string, { value?: string } | undefined>

/**
 * LA REQUÊTE EST GROUPÉE, et elle DOIT l'être.
 *
 * **P2067 (la masse) rend plusieurs lignes par taxon** — une par source, une
 * par sexe — donc sans `GROUP BY` un seul noeud en occupe douze et le lot de
 * soixante en rend sept cents. Mesuré. `SAMPLE` suffit : *on veut un ordre de
 * grandeur, pas la masse d'un individu précis.*
 *
 * **La masse passe par `psn:`**, la valeur NORMALISÉE : Wikidata écrit les
 * souris en grammes et les baleines en tonnes, et `psn:` les ramène toutes au
 * kilogramme. *Lire `wdt:P2067` directement rendrait « 20 » pour une souris de
 * vingt grammes.*
 */
function requeteParGbif(cles: readonly string[]): string {
  const valeurs = cles.map((c) => `"${c}"`).join(' ')
  return [
    'SELECT ?gbif',
    '  (SAMPLE(?lab) AS ?label) (SAMPLE(?vern) AS ?vernaculaire)',
    '  (SAMPLE(?artFr) AS ?articleFr) (SAMPLE(?artEn) AS ?articleEn)',
    '  (SAMPLE(?img) AS ?image) (SAMPLE(?iucnLab) AS ?iucn) (SAMPLE(?m) AS ?masse)',
    'WHERE {',
    `  VALUES ?gbif { ${valeurs} }`,
    '  ?item wdt:P846 ?gbif .',
    '  OPTIONAL { ?item rdfs:label ?lab . FILTER(lang(?lab) = "fr") }',
    '  OPTIONAL { ?item wdt:P1843 ?vern . FILTER(lang(?vern) = "fr") }',
    '  OPTIONAL { ?artFr schema:about ?item ; schema:isPartOf <https://fr.wikipedia.org/> }',
    '  OPTIONAL { ?artEn schema:about ?item ; schema:isPartOf <https://en.wikipedia.org/> }',
    '  OPTIONAL { ?item wdt:P18 ?img }',
    '  OPTIONAL { ?item wdt:P141 ?st . ?st rdfs:label ?iucnLab . FILTER(lang(?iucnLab) = "en") }',
    '  OPTIONAL { ?item p:P2067/psn:P2067/wikibase:quantityAmount ?m }',
    '}',
    'GROUP BY ?gbif',
  ].join('\n')
}

function titreDArticle(url: string | undefined): string | null {
  if (url === undefined) return null
  const m = /\/wiki\/(.+)$/.exec(url)
  if (m === null || m[1] === undefined) return null
  return decodeURIComponent(m[1]).replace(/_/g, ' ')
}

async function wikidata(noeuds: readonly Noeud[]): Promise<Map<number, Info>> {
  const par = new Map<number, Info>()
  for (const lot of paquets(noeuds, 60)) {
    const corps = requeteParGbif(lot.map((n) => String(n.key)))
    const url = `${SPARQL}?format=json&query=${encodeURIComponent(corps)}`
    const d = await json<{ results?: { bindings?: LigneSparql[] } }>(
      `wd-gbif-${lot[0]?.key ?? 0}-${lot.length}`,
      url,
      { pause: 350 },
    )
    for (const b of d?.results?.bindings ?? []) {
      const gbif = b.gbif?.value
      if (gbif === undefined) continue
      const masse = b.masse?.value === undefined ? null : Number(b.masse.value)
      par.set(Number(gbif), {
        nomFr: b.vernaculaire?.value ?? null,
        labelFr: b.label?.value ?? null,
        articleFr: titreDArticle(b.articleFr?.value),
        articleEn: titreDArticle(b.articleEn?.value),
        image: b.image?.value ?? null,
        iucn: UICN[(b.iucn?.value ?? '').toLowerCase()] ?? null,
        masse: masse !== null && Number.isFinite(masse) ? masse : null,
      })
    }
  }
  return par
}

// ------------------------------------------------- le nom français, en cascade

/**
 * LES REDIRECTIONS SONT LA SEULE SOURCE QUI DONNE « CHAUVE-SOURIS ».
 *
 * **Mesuré, et c'est ce qui a décidé de cette cascade** : pour Chiroptera, le
 * libellé français de Wikidata est littéralement « Chiroptera », P1843 est
 * vide, et `vernacularNames` de GBIF n'a aucun français — il est en plus BRUITÉ,
 * il rend « Hamster de Roborovski » pour le capybara. Les redirections de
 * l'article français, elles, rendent « Chauve-souris » en première position.
 *
 * *L'exemple fondateur de Keko aurait donc été éliminé par les trois autres
 * sources.*
 */
async function redirections(titres: readonly string[]): Promise<Map<string, string[]>> {
  const par = new Map<string, string[]>()
  for (const lot of paquets(titres, 50)) {
    const p = new URLSearchParams({
      action: 'query',
      format: 'json',
      formatversion: '2',
      prop: 'redirects',
      rdnamespace: '0',
      rdlimit: 'max',
      titles: lot.join('|'),
    })
    const d = await json<{
      query?: { pages?: { title?: string; redirects?: { title?: string }[] }[] }
    }>(`redir-${lot[0] ?? ''}-${lot.length}`, `${WIKI_FR}?${p.toString()}`)
    for (const page of d?.query?.pages ?? []) {
      if (page.title === undefined) continue
      par.set(
        page.title,
        (page.redirects ?? []).map((r) => r.title).filter((t): t is string => t !== undefined),
      )
    }
  }
  return par
}

/** Ce qui finit comme un nom de taxon n'est pas un nom commun. */
const SAVANT = /(idae|inae|iformes|morpha|oidea|aceae|ini|ia|ae|us|um|os|on)$/i

function sansAccent(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

/** Un libellé qui n'est que le nom scientifique ne dit rien de français. */
function utile(libelle: string | null, sci: string): boolean {
  return libelle !== null && sansAccent(libelle) !== sci && !SAVANT.test(libelle)
}

type SourceDuNom = 'P1843' | 'label' | 'redirection' | 'article'

/**
 * CE QUI FAIT UN NOM FRANÇAIS, et l'ordre compte.
 *
 * 1. P1843, le nom vernaculaire que Wikidata déclare ;
 * 2. le libellé français, **s'il n'est pas le nom scientifique** — le piège est
 *    celui d'un libellé qui n'est que son propre identifiant, déjà payé
 *    ailleurs dans ce projet ;
 * 3. une redirection de l'article français qui ne soit pas savante ;
 * 4. le titre de l'article français, **signalé** dans la revue.
 *
 * `null` quand rien ne tient : le noeud n'est alors pas une carte.
 */
function nomFrancais(
  n: Noeud,
  info: Info | undefined,
  redirs: readonly string[],
): { nom: string; source: SourceDuNom } | null {
  const sci = sansAccent(n.nom)

  if (info?.nomFr !== undefined && info.nomFr !== null) return { nom: info.nomFr, source: 'P1843' }
  if (utile(info?.labelFr ?? null, sci)) return { nom: info!.labelFr!, source: 'label' }

  // LA PREMIÈRE REDIRECTION NON SAVANTE. L'API les rend dans l'ordre des pages,
  // et mesuré sur les six ordres les plus connus c'est le nom commun qui ouvre :
  // Chiroptera → « Chauve-souris », Rodentia → « Rongeur », Cetacea → « Cétacés ».
  for (const r of redirs) {
    if (sansAccent(r) === sci || SAVANT.test(r) || r.includes('(')) continue
    if (/^[a-z]/.test(r)) continue // une redirection en bas de casse est une variante d'écriture
    return { nom: r, source: 'redirection' }
  }

  if (info?.articleFr !== undefined && info.articleFr !== null && sansAccent(info.articleFr) !== sci) {
    return { nom: info.articleFr, source: 'article' }
  }
  return null
}

// -------------------------------------------------------------------- les vues

function fenetre(mois: number): { debut: string; fin: string } {
  const h = new Date()
  const fin = new Date(Date.UTC(h.getUTCFullYear(), h.getUTCMonth(), 1))
  const debut = new Date(Date.UTC(fin.getUTCFullYear(), fin.getUTCMonth() - mois, 1))
  const f = (d: Date) =>
    `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, '0')}0100`
  return { debut: f(debut), fin: f(fin) }
}

const FENETRE = fenetre(12)

/**
 * LES VUES D'UN ARTICLE SUR DOUZE MOIS.
 *
 * **L'API REST prend UN article par appel**, là où `prop=pageviews` en prend
 * cinquante — mais celle-ci ne remonte qu'à soixante jours. *Douze mois valent
 * le coût d'un appel par article* : une saison de documentaires ne doit pas
 * décider qu'un animal est légendaire.
 */
async function vues(langue: string, titre: string): Promise<number> {
  const t = encodeURIComponent(titre.replace(/ /g, '_'))
  const url = `${REST}/${langue}.wikipedia/all-access/user/${t}/monthly/${FENETRE.debut}/${FENETRE.fin}`
  const d = await json<{ items?: { views?: number }[] }>(`vues-${langue}-${titre}`, url, {
    pause: 90,
  })
  let somme = 0
  for (const i of d?.items ?? []) somme += i.views ?? 0
  return somme
}

// ------------------------------------------------------------------- le score

function entre(v: number, [bas, haut]: readonly [number, number]): number {
  if (haut <= bas) return 0
  return Math.min(1, Math.max(0, (v - bas) / (haut - bas)))
}

/** `log10` des vues françaises, plus la moitié des anglaises. */
function scoreDe(vuesFr: number, vuesEn: number): number {
  return entre(Math.log10(1 + vuesFr) + 0.5 * Math.log10(1 + vuesEn), BORNES_SCORE)
}

// -------------------------------------------------------------------- la coupe

type Candidat = {
  readonly noeud: Noeud
  readonly info: Info | undefined
  readonly nom: string | null
  readonly source: SourceDuNom | null
  readonly score: number
  readonly vues: number
}

type Brouillon = {
  readonly noeud: Noeud
  readonly nom: string
  readonly source: SourceDuNom
  readonly info: Info | undefined
  readonly score: number
  readonly vues: number
  readonly parent: string | null
  readonly ordre: string
  especes: number
}

/** Enrichit une fournée d'enfants : Wikidata, redirections, vues. */
async function evaluer(ns: readonly Noeud[]): Promise<Candidat[]> {
  const infos = await wikidata(ns)

  // Les redirections ne se demandent que pour les noeuds dont le libellé ne
  // suffit pas : *c'est un appel par cinquante, autant ne pas le gâcher.*
  const aChercher: string[] = []
  for (const n of ns) {
    const i = infos.get(n.key)
    const deja = (i?.nomFr ?? null) !== null || utile(i?.labelFr ?? null, sansAccent(n.nom))
    if (!deja && i?.articleFr !== undefined && i.articleFr !== null) aChercher.push(i.articleFr)
  }
  const redirs =
    aChercher.length > 0 ? await redirections(aChercher) : new Map<string, string[]>()

  const out: Candidat[] = []
  for (const n of ns) {
    const i = infos.get(n.key)
    const redirsDuNoeud =
      i?.articleFr !== undefined && i.articleFr !== null ? (redirs.get(i.articleFr) ?? []) : []
    const nom = nomFrancais(n, i, redirsDuNoeud)

    // PAS D'ARTICLE, PAS DE VUES À DEMANDER : le score est nul, le noeud est
    // absorbé. *C'est le seul élagage qui rende le coût tenable* — un ordre
    // porte des milliers de genres obscurs, et l'API REST ne prend qu'un
    // article par appel.
    let vFr = 0
    let vEn = 0
    if (i?.articleFr !== undefined && i.articleFr !== null) vFr = await vues('fr', i.articleFr)
    if (i?.articleEn !== undefined && i.articleEn !== null) vEn = await vues('en', i.articleEn)

    out.push({
      noeud: n,
      info: i,
      nom: nom?.nom ?? null,
      source: nom?.source ?? null,
      score: scoreDe(vFr, vEn),
      vues: vFr + vEn,
    })
  }
  return out
}

type Options = {
  readonly seuil: number
  readonly restes: 'absorbe' | 'carte'
  readonly sortie: string
}

/**
 * LA DESCENTE À PROFONDEUR VARIABLE.
 *
 * On part de Mammalia et on examine ses enfants : **celui qui dépasse le seuil
 * ET porte un nom français devient une carte**, et on examine alors SES enfants.
 * Celui qui ne passe pas est absorbé par la carte au-dessus de lui.
 *
 * *C'est ce qui donne « chauve-souris » en une carte et « lion » et « tigre » en
 * deux* : les enfants de Chiroptera ne passent pas le seuil, ceux de Panthera le
 * passent.
 */
async function couper(o: Options): Promise<{ cartes: Brouillon[]; sansNom: Candidat[] }> {
  const cartes: Brouillon[] = []
  const sansNom: Candidat[] = []
  const vus = new Set<number>()

  // Une file plutôt qu'une récursion : on veut journaliser la progression, et le
  // nombre de noeuds n'est pas connu d'avance.
  type AFaire = { key: number; parent: string | null; ordre: string; nom: string }
  const file: AFaire[] = [{ key: RACINE, parent: null, ordre: '(racine)', nom: 'Mammalia' }]

  let examines = 0
  while (file.length > 0) {
    const t = file.shift()
    if (t === undefined) break
    if (vus.has(t.key)) continue
    vus.add(t.key)
    examines += 1
    if (examines > PLAFOND_NOEUDS) {
      journal(`PLAFOND ATTEINT (${PLAFOND_NOEUDS} noeuds) : ${file.length} branches laissees de cote`)
      break
    }

    const ns = await enfants(t.key)
    if (ns.length === 0) continue

    const evalues = await evaluer(ns)
    const retenus = evalues.filter((c) => c.nom !== null && c.score > o.seuil)
    journal(`  ${t.nom} : ${retenus.length}/${ns.length} enfants retenus (file ${file.length})`)

    for (const c of evalues) {
      if (c.nom === null && c.score > o.seuil) sansNom.push(c)
    }

    for (const c of retenus) {
      const nom = c.nom
      const source = c.source
      if (nom === null || source === null) continue
      // L'ORDRE EST CELUI DU PREMIER ÉTAGE : c'est le regroupement que Keko
      // relira, et il n'a de sens qu'au rang des ordres.
      const ordre = t.parent === null ? nom : t.ordre
      cartes.push({
        noeud: c.noeud,
        nom,
        source,
        info: c.info,
        score: c.score,
        vues: c.vues,
        parent: t.parent,
        ordre,
        especes: 0,
      })
      // Une espèce n'a pas d'enfants à examiner : c'est une feuille par nature.
      if (c.noeud.rang !== 'SPECIES') {
        file.push({ key: c.noeud.key, parent: String(c.noeud.key), ordre, nom })
      }
    }
  }

  return { cartes, sansNom }
}

/**
 * CE QUE CHAQUE CARTE ABSORBE — et c'est là que l'invariant se joue.
 *
 * Une carte couvre les espèces de son sous-arbre MOINS celles que ses cartes
 * filles couvrent. *Sans la soustraction, une espèce serait comptée à chaque
 * étage* et la somme vaudrait plusieurs fois le total.
 */
async function absorber(cartes: readonly Brouillon[]): Promise<void> {
  const total = new Map<number, number>()
  for (const c of cartes) total.set(c.noeud.key, await especes(c.noeud.key, c.noeud.rang))

  const filles = new Map<string, Brouillon[]>()
  for (const c of cartes) {
    if (c.parent === null) continue
    const lot = filles.get(c.parent) ?? []
    lot.push(c)
    filles.set(c.parent, lot)
  }

  for (const c of cartes) {
    let propre = total.get(c.noeud.key) ?? 0
    for (const f of filles.get(String(c.noeud.key)) ?? []) propre -= total.get(f.noeud.key) ?? 0
    c.especes = Math.max(0, propre)
  }
}

/** Les crans par quantile, et les frontières de score qu'ils produisent. */
function rarifier(cartes: readonly Brouillon[]): {
  crans: Map<number, RareteAnimal>
  frontieres: number[]
} {
  const tries = [...cartes].sort((a, b) => a.score - b.score)
  const crans = new Map<number, RareteAnimal>()
  const frontieres: number[] = []

  let debut = 0
  for (let i = 0; i < PARTS_RARETE.length; i++) {
    const part = PARTS_RARETE[i] ?? 0
    const fin =
      i === PARTS_RARETE.length - 1
        ? tries.length
        : Math.min(tries.length, debut + Math.round(part * tries.length))
    for (let j = debut; j < fin; j++) {
      const c = tries[j]
      if (c !== undefined) crans.set(c.noeud.key, RARETES_ANIMAL[i] ?? 'commun')
    }
    if (i < PARTS_RARETE.length - 1) frontieres.push(tries[fin]?.score ?? 1)
    debut = fin
  }
  return { crans, frontieres }
}

// ------------------------------------------------------------------- la sortie

function nombre(n: number): string {
  return n.toLocaleString('fr-FR')
}

function masseLisible(kg: number | null): string {
  if (kg === null) return '—'
  if (kg < 1) return `${Math.round(kg * 1000)} g`
  if (kg < 1000) return `${kg < 10 ? kg.toFixed(1) : String(Math.round(kg))} kg`
  return `${(kg / 1000).toFixed(1)} t`
}

function revue(
  cartes: readonly CarteAnimal[],
  brouillons: readonly Brouillon[],
  o: Options,
  totalEspeces: number,
  sansNom: readonly Candidat[],
  frontieres: readonly number[],
): string {
  const ordreDe = new Map<string, string>()
  const sourceDe = new Map<string, string>()
  for (const b of brouillons) {
    ordreDe.set(String(b.noeud.key), b.ordre)
    sourceDe.set(String(b.noeud.key), b.source)
  }

  const parOrdre = new Map<string, CarteAnimal[]>()
  for (const c of cartes) {
    const k = ordreDe.get(c.id) ?? '(autres)'
    const lot = parOrdre.get(k) ?? []
    lot.push(c)
    parOrdre.set(k, lot)
  }

  const somme = cartes.reduce((s, c) => s + c.nb_especes_absorbees, 0)
  const l: string[] = []
  l.push(`# Les cartes « ${GROUPE} » — à relire`)
  l.push('')
  l.push(
    `Engendré le ${new Date().toISOString().slice(0, 10)} · seuil **${o.seuil}** · restes : **${o.restes}**`,
  )
  l.push('')
  l.push(`**${cartes.length} cartes**, pour ${nombre(totalEspeces)} espèces du référentiel.`)
  l.push('')

  // L'INVARIANT EN TÊTE : c'est la première chose à vérifier, et la seule qui
  // dise si la coupe est juste.
  l.push(
    somme === totalEspeces
      ? `**Invariant tenu** : la somme des espèces absorbées fait exactement ${nombre(somme)}.`
      : `**INVARIANT ROMPU** : ${nombre(somme)} espèces absorbées pour ${nombre(totalEspeces)} attendues (écart ${nombre(somme - totalEspeces)}).`,
  )
  l.push('')

  const parCran = new Map<string, number>()
  for (const c of cartes) parCran.set(c.rarete, (parCran.get(c.rarete) ?? 0) + 1)
  l.push('## La rareté')
  l.push('')
  l.push('| cran | cartes | part | score à partir de |')
  l.push('|---|---|---|---|')
  RARETES_ANIMAL.forEach((r, i) => {
    const n = parCran.get(r) ?? 0
    const borne = i === 0 ? 0 : (frontieres[i - 1] ?? 0)
    l.push(
      `| ${r} | ${n} | ${((n / Math.max(1, cartes.length)) * 100).toFixed(1)} % | ${borne.toFixed(3)} |`,
    )
  })
  l.push('')

  // LES CAS SUSPECTS, demandés par Keko : ce sont eux qui demandent sa passe à
  // la main, pas la liste entière.
  l.push('## À regarder de près')
  l.push('')

  const doublons = new Map<string, CarteAnimal[]>()
  for (const c of cartes) {
    const k = sansAccent(c.nom_fr)
    const lot = doublons.get(k) ?? []
    lot.push(c)
    doublons.set(k, lot)
  }
  const collisions = [...doublons.values()].filter((v) => v.length > 1)
  for (const v of collisions) {
    l.push(
      `- **« ${v[0]?.nom_fr ?? ''} »** sur ${v.length} cartes : ${v.map((c) => `${c.nom_scientifique} (${c.rang})`).join(', ')}`,
    )
  }

  const gros = cartes
    .filter((c) => c.nb_especes_absorbees > 500)
    .sort((a, b) => b.nb_especes_absorbees - a.nb_especes_absorbees)
  for (const c of gros) {
    l.push(
      `- **${c.nom_fr}** absorbe ${nombre(c.nb_especes_absorbees)} espèces (${c.nom_scientifique}, ${c.rang}) — à découper ?`,
    )
  }

  for (const c of sansNom.slice(0, 40)) {
    l.push(
      `- **${c.noeud.nom}** (${c.noeud.rang}) est très lu (score ${c.score.toFixed(2)}, ${nombre(c.vues)} vues) mais n'a **aucun nom français**.`,
    )
  }

  const deRepli = cartes.filter((c) => sourceDe.get(c.id) === 'article')
  if (deRepli.length > 0) {
    l.push(
      `- ${deRepli.length} cartes nommées par le **titre de l'article** faute de nom vernaculaire : ${deRepli.slice(0, 25).map((c) => c.nom_fr).join(', ')}${deRepli.length > 25 ? '…' : ''}`,
    )
  }

  const sansImage = cartes.filter((c) => c.image === null)
  if (sansImage.length > 0) {
    l.push(
      `- ${sansImage.length} cartes **sans image** : ${sansImage.slice(0, 25).map((c) => c.nom_fr).join(', ')}${sansImage.length > 25 ? '…' : ''}`,
    )
  }

  if (collisions.length === 0 && gros.length === 0 && sansNom.length === 0 && sansImage.length === 0) {
    l.push('- rien à signaler.')
  }
  l.push('')

  l.push('## Les cartes, par ordre')
  l.push('')
  for (const [ordre, lot] of [...parOrdre.entries()].sort((a, b) => b[1].length - a[1].length)) {
    const esp = lot.reduce((s, c) => s + c.nb_especes_absorbees, 0)
    l.push(`### ${ordre} — ${lot.length} carte(s), ${nombre(esp)} espèces`)
    l.push('')
    l.push('| nom | scientifique | rang | espèces | score | rareté | masse | UICN | nom venu de |')
    l.push('|---|---|---|---|---|---|---|---|---|')
    for (const c of [...lot].sort((a, b) => b.score - a.score)) {
      l.push(
        `| ${c.nom_fr} | *${c.nom_scientifique}* | ${c.rang} | ${nombre(c.nb_especes_absorbees)} |` +
          ` ${c.score.toFixed(3)} | ${c.rarete} | ${masseLisible(c.masse_kg)} |` +
          ` ${c.statut_uicn ?? '—'} | ${sourceDe.get(c.id) ?? '—'} |`,
      )
    }
    l.push('')
  }
  return l.join('\n')
}

// -------------------------------------------------------------------- l'entrée

async function principal(): Promise<void> {
  const seuil = Number(option('seuil') ?? SEUIL_DEFAUT)
  const restes = (option('restes') ?? 'absorbe') === 'carte' ? 'carte' : 'absorbe'
  const suffixe = option('sortie') ?? ''
  const o: Options = { seuil, restes, sortie: suffixe }

  journal(`Coupe à ${seuil}, restes « ${restes} », fenêtre ${FENETRE.debut} → ${FENETRE.fin}`)
  journal(`User-Agent : ${UA}`)

  const totalEspeces = await especes(RACINE, 'CLASS')
  journal(`Mammalia : ${nombre(totalEspeces)} espèces acceptées dans le référentiel`)

  const { cartes: brouillons, sansNom } = await couper(o)
  journal(`${brouillons.length} cartes avant l'absorption`)

  await absorber(brouillons)

  // LES RESTES DE LA RACINE : les ordres qui ne passent pas le seuil n'ont aucun
  // parent pour les absorber. Sans eux, leurs espèces disparaissent — et c'est
  // l'invariant qui le dirait.
  const orphelines = totalEspeces - brouillons.reduce((s, c) => s + c.especes, 0)
  if (orphelines > 0) {
    const racines = brouillons.filter((c) => c.parent === null)
    if (restes === 'carte' || racines.length === 0) {
      brouillons.push({
        noeud: { key: -1, nom: 'Mammalia', rang: 'CLASS' },
        nom: 'Autres mammifères',
        source: 'label',
        info: undefined,
        score: 0,
        vues: 0,
        parent: null,
        ordre: 'Autres mammifères',
        especes: orphelines,
      })
      journal(`« Autres mammifères » absorbe ${nombre(orphelines)} espèces`)
    } else {
      // ABSORBE : on répartit sur les cartes du premier étage, au prorata, pour
      // que l'invariant tienne sans inventer de carte.
      const base = racines.reduce((s, c) => s + c.especes, 0) || racines.length
      let reste = orphelines
      racines.forEach((c, i) => {
        const part =
          i === racines.length - 1 ? reste : Math.round((c.especes / base) * orphelines)
        c.especes += part
        reste -= part
      })
      journal(`${nombre(orphelines)} espèces orphelines réparties sur ${racines.length} cartes`)
    }
  }

  const { crans, frontieres } = rarifier(brouillons)

  const cartes: CarteAnimal[] = brouillons.map((b) => ({
    id: String(b.noeud.key),
    groupe: GROUPE,
    nom_fr: b.nom,
    nom_scientifique: b.noeud.nom,
    rang: b.noeud.rang,
    parent_id: b.parent,
    nb_especes_absorbees: b.especes,
    score: Number(b.score.toFixed(4)),
    rarete: crans.get(b.noeud.key) ?? 'commun',
    statut_uicn: b.info?.iucn ?? null,
    masse_kg: b.info?.masse ?? null,
    image: b.info?.image ?? null,
    article_fr: b.info?.articleFr ?? null,
    vues: b.vues,
  }))

  const dossier = new URL('../public/data/', import.meta.url)
  mkdirSync(dossier, { recursive: true })
  const nomFichier = suffixe === '' ? 'animals' : `animals-${suffixe}`
  writeFileSync(
    new URL(`${nomFichier}.json`, dossier),
    JSON.stringify({ genere: new Date().toISOString(), groupe: GROUPE, seuil, cartes }, null, 1),
    'utf8',
  )
  writeFileSync(
    new URL(`${nomFichier}_review.md`, dossier),
    revue(cartes, brouillons, o, totalEspeces, sansNom, frontieres),
    'utf8',
  )

  const somme = cartes.reduce((s, c) => s + c.nb_especes_absorbees, 0)
  journal(`${cartes.length} cartes écrites dans public/data/${nomFichier}.json`)
  journal(
    somme === totalEspeces
      ? `Invariant tenu : ${nombre(somme)} espèces couvertes.`
      : `INVARIANT ROMPU : ${nombre(somme)} couvertes pour ${nombre(totalEspeces)} attendues.`,
  )
}

principal().catch((e: unknown) => {
  console.error(e)
  process.exitCode = 1
})

/**
 * LE PIPELINE DES CARTES-ANIMAUX — une carte par espèce.
 *
 * **UNE CARTE EST UNE ESPÈCE, et c'est toute la collection.** Tranché par
 * Keko : « je préfère la liste plate, on abandonne l'arbre » et « il faut la
 * collection de tous les mammifères ».
 *
 * *Ce que ça remplace est raconté dans `CLAUDE.md`* : une coupe à profondeur
 * variable dans l'arbre du vivant, où une carte pouvait être un ordre entier.
 * Elle a coûté six défauts, et **ils venaient tous des rangs AU-DESSUS de
 * l'espèce** — « Lynx dans la culture », « Castor (genre) », les genres latins
 * sans nom, les doublons groupe/animal. *Une espèce, elle, a presque toujours
 * un nom français net.*
 *
 * **IL N'Y A PLUS DE SEUIL DE NOTORIÉTÉ.** On prend tout ce qui est nommable et
 * illustrable ; le score ne sert plus qu'à la rareté. *Une collection se
 * collectionne entière, sinon ce n'est pas une collection.*
 *
 * Lancé par `npm run gen:animals`, hors du build Vite.
 */

import { writeFileSync, mkdirSync } from 'node:fs'
import { createHash } from 'node:crypto'
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

/** Le référentiel GBIF, pour ne lister que les espèces de l'arbre canonique. */
const BACKBONE = 'd7dddbf4-2cf0-4f39-9b2a-bb099caae36c'

/**
 * ON NE GARDE QUE LE VIVANT — tranché par Keko : « on va mettre de côté les
 * espèces éteintes ».
 *
 * *Il avait d'abord dit de les garder*, et ce qui l'a fait changer d'avis est
 * mesurable : le référentiel porte **12 917 espèces éteintes pour 6 323
 * vivantes**, donc les deux tiers de l'arbre sont des fossiles.
 *
 * Prix connu et assumé : **le mammouth et le smilodon sortent du catalogue.**
 * Les remettre un jour demandera une liste nommée, pas la réouverture du
 * filtre — *on ne rouvre pas douze mille fossiles pour en gagner trois.*
 */
const VIVANTES = '&isExtinct=false'

/**
 * LES PARTS DE CHAQUE CRAN DE RARETÉ — par QUANTILE, pas par seuil fixe.
 *
 * **Keko a tranché « notoriété pour la rareté »**, et les quantiles garantissent
 * la pyramide quelle que soit la taille du catalogue. Le script IMPRIME les
 * frontières de score obtenues : c'est ce qu'il faudra figer le jour où le
 * catalogue se stabilise.
 */
const PARTS_RARETE: readonly number[] = [0.7, 0.2, 0.075, 0.025]

/**
 * LES BORNES DU SCORE, en log10 des vues cumulées.
 *
 * **L'échelle est LOGARITHMIQUE, et ce n'est pas un détail** : la notoriété
 * suit une loi de puissance. En linéaire, le lion écrase tout le monde et
 * quatre-vingt-quinze pour cent des espèces valent zéro.
 */
const BORNES_SCORE: readonly [number, number] = [2.0, 7.0]

const SPARQL = 'https://query.wikidata.org/sparql'
const WIKI_FR = 'https://fr.wikipedia.org/w/api.php'
const WIKI_EN = 'https://en.wikipedia.org/w/api.php'
const INAT = 'https://api.inaturalist.org/v1/taxa'
const REST = 'https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article'

// ------------------------------------------------------- la liste des espèces

type Espece = {
  readonly key: number
  readonly nom: string
  readonly ordre: string
  readonly famille: string
}

type LigneGbif = {
  key?: number
  canonicalName?: string
  scientificName?: string
  order?: string
  family?: string
}

/**
 * TOUTES LES ESPÈCES VIVANTES DE MAMMIFÈRES, paginées.
 *
 * **L'ordre et la famille viennent dans la même réponse**, gratuitement — et ce
 * sont eux qui rangeront la collection. *C'est le seul héritage de l'arbre, et
 * c'est le bon* : un classeur ne se collectionne pas, il range.
 *
 * `limit=1000` est le plafond de GBIF ; sept pages suffisent.
 */
async function especes(): Promise<Espece[]> {
  return cache('gbif-liste-mammiferes', String(RACINE) + VIVANTES, async () => {
    const tout: Espece[] = []
    for (let offset = 0; offset < 20000; offset += 1000) {
      const url =
        `https://api.gbif.org/v1/species/search?datasetKey=${BACKBONE}` +
        `&higherTaxonKey=${RACINE}&rank=SPECIES&status=ACCEPTED${VIVANTES}` +
        `&limit=1000&offset=${offset}`
      const d = await json<{ results?: LigneGbif[]; endOfRecords?: boolean }>(
        `gbif-page-especes-${offset}`,
        url,
      )
      if (d === null) break
      for (const r of d.results ?? []) {
        const nom = r.canonicalName ?? r.scientificName
        // **Sans ordre ni famille, pas de rayon** : une carte qu'on ne peut pas
        // ranger n'a pas sa place dans une collection qui se range.
        if (r.key === undefined || nom === undefined) continue
        if (r.order === undefined || r.family === undefined) continue
        tout.push({ key: r.key, nom, ordre: r.order, famille: r.family })
      }
      journal(`  ${tout.length} espèces listées`)
      if (d.endOfRecords !== false) break
    }
    return tout
  })
}

// ------------------------------------------------------------------ Wikidata

type Info = {
  nomFr: string | null
  labelFr: string | null
  /**
   * LE LIBELLÉ ANGLAIS SERT DE TÉMOIN, pas de nom.
   *
   * **Mesuré : 70 cartes portaient un nom anglais** — « Lesser long-eared
   * bat », « Flute-nosed bat », « Brazilian brown bat ». *Quand personne n'a
   * traduit un taxon, le champ « français » de Wikidata contient l'anglais tel
   * quel*, et rien ne le signale : c'est un texte comme un autre.
   *
   * Le soupçon était d'abord tombé sur iNaturalist, et **la mesure l'a
   * disculpé** : interrogé en `locale=fr` sur une espèce sans nom français, il
   * rend franchement rien. *Une API qui dit « je ne sais pas » est plus sûre
   * qu'un champ qui a l'air rempli.*
   */
  labelEn: string | null
  articleFr: string | null
  articleEn: string | null
  image: string | null
  iucn: StatutUicn | null
  masse: number | null
  /** L'identifiant iNaturalist (P3151), par où arrive le nom vernaculaire. */
  inat: number | null
}

const UICN: Readonly<Record<string, StatutUicn>> = {
  extinct: 'EX',
  'extinct in the wild': 'EW',
  'critically endangered': 'CR',
  endangered: 'EN',
  'endangered species': 'EN',
  vulnerable: 'VU',
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
    '  (SAMPLE(?lab) AS ?label) (SAMPLE(?labEn) AS ?labelEn) (SAMPLE(?vern) AS ?vernaculaire)',
    '  (SAMPLE(?artFr) AS ?articleFr) (SAMPLE(?artEn) AS ?articleEn)',
    '  (SAMPLE(?img) AS ?image) (SAMPLE(?iucnLab) AS ?iucn) (SAMPLE(?m) AS ?masse)',
    '  (SAMPLE(?inat) AS ?inaturalist)',
    'WHERE {',
    `  VALUES ?gbif { ${valeurs} }`,
    '  ?item wdt:P846 ?gbif .',
    '  OPTIONAL { ?item rdfs:label ?lab . FILTER(lang(?lab) = "fr") }',
    '  OPTIONAL { ?item rdfs:label ?labEn . FILTER(lang(?labEn) = "en") }',
    '  OPTIONAL { ?item wdt:P1843 ?vern . FILTER(lang(?vern) = "fr") }',
    '  OPTIONAL { ?artFr schema:about ?item ; schema:isPartOf <https://fr.wikipedia.org/> }',
    '  OPTIONAL { ?artEn schema:about ?item ; schema:isPartOf <https://en.wikipedia.org/> }',
    '  OPTIONAL { ?item wdt:P18 ?img }',
    '  OPTIONAL { ?item wdt:P141 ?st . ?st rdfs:label ?iucnLab . FILTER(lang(?iucnLab) = "en") }',
    '  OPTIONAL { ?item p:P2067/psn:P2067/wikibase:quantityAmount ?m }',
    '  OPTIONAL { ?item wdt:P3151 ?inat }',
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

async function wikidata(cles: readonly number[]): Promise<Map<number, Info>> {
  const par = new Map<number, Info>()
  const lots = paquets(cles, 60)
  let fait = 0
  for (const lot of lots) {
    const corps = requeteParGbif(lot.map(String))
    const url = `${SPARQL}?format=json&query=${encodeURIComponent(corps)}`
    const d = await json<{ results?: { bindings?: LigneSparql[] } }>(
      `wd-gbif-${lot[0] ?? 0}-${lot.length}`,
      url,
      { pause: 300 },
    )
    for (const b of d?.results?.bindings ?? []) {
      const gbif = b.gbif?.value
      if (gbif === undefined) continue
      const masse = b.masse?.value === undefined ? null : Number(b.masse.value)
      par.set(Number(gbif), {
        nomFr: b.vernaculaire?.value ?? null,
        labelFr: b.label?.value ?? null,
        labelEn: b.labelEn?.value ?? null,
        articleFr: titreDArticle(b.articleFr?.value),
        articleEn: titreDArticle(b.articleEn?.value),
        image: b.image?.value ?? null,
        iucn: UICN[(b.iucn?.value ?? '').toLowerCase()] ?? null,
        masse: masse !== null && Number.isFinite(masse) ? masse : null,
        inat: b.inaturalist?.value === undefined ? null : Number(b.inaturalist.value),
      })
    }
    fait += 1
    if (fait % 10 === 0) journal(`  Wikidata : ${fait}/${lots.length} lots, ${par.size} trouvés`)
  }
  return par
}

// -------------------------------------------------------------- iNaturalist

/**
 * LES NOMS VERNACULAIRES FRANÇAIS D'iNATURALIST — et c'est Keko qui a demandé
 * d'aller les chercher ailleurs que chez Wikipédia.
 *
 * **Mesuré sur huit espèces choisies pour n'avoir AUCUNE page française : huit
 * noms sur huit.** *Myotis daubentonii* → « Murin de Daubenton »,
 * *Crocidura olivieri* → « Grande crocidure africaine », *Microtus arvalis* →
 * « Campagnol des champs ». Là où Wikipédia couvre 3 635 espèces, iNaturalist
 * en connaît **6 170**.
 *
 * **ET ÇA NE COÛTE QUE DEUX CENTS APPELS, pas six mille** : Wikidata porte déjà
 * l'identifiant iNaturalist (P3151), donc il arrive dans la requête qu'on fait
 * de toute façon — et `taxa/{id,id,id}` en prend trente d'un coup. *Chercher
 * par nom aurait demandé un appel par espèce.*
 *
 * **ON N'EN PREND QUE LE NOM, jamais la photo.** Tranché par Keko : « on reste
 * sur Commons pour l'instant ». *Un nom vernaculaire est un fait, pas une
 * oeuvre* — il ne s'emprunte à personne. Les photos d'iNaturalist, elles, sont
 * majoritairement en CC-BY-**NC**, donc inutilisables si le jeu devient payant
 * un jour, et certaines interdisent la modification alors qu'on rogne l'image
 * sur la carte.
 */
async function nomsINaturalist(ids: readonly number[]): Promise<Map<number, string>> {
  const par = new Map<number, string>()
  const lots = paquets(ids, 30)
  let fait = 0
  for (const lot of lots) {
    const d = await json<{
      results?: { id?: number; preferred_common_name?: string }[]
    }>(`inat-${lot[0] ?? 0}-${lot.length}`, `${INAT}/${lot.join(',')}?locale=fr`, { pause: 700 })
    for (const t of d?.results ?? []) {
      if (t.id === undefined || t.preferred_common_name === undefined) continue
      par.set(t.id, t.preferred_common_name)
    }
    fait += 1
    if (fait % 20 === 0) journal(`  iNaturalist : ${fait}/${lots.length} lots, ${par.size} noms`)
  }
  return par
}

// ------------------------------------------------- les noms vernaculaires GBIF

/**
 * LE NOM VERNACULAIRE FRANÇAIS SELON GBIF — la quatrième source, et la dernière
 * avant le nom latin.
 *
 * **Mesuré sur douze espèces que ni Wikipédia ni iNaturalist ne nomment : cinq
 * noms sur douze**, et de bons noms — `Canis lupaster` → « Loup africain »,
 * `Bandicota indica` → « Grand Rat-bandicot », `Pteropus neohibernicus` →
 * « Roussette papoue ». Sur les 1 269 cartes concernées, ça en rhabille de
 * l'ordre de cinq cents.
 *
 * **MAIS IL EST BRUITÉ, et c'était déjà mesuré du temps de l'arbre** : pour le
 * capybara, `vernacularNames` rendait « Hamster de Roborovski ». *Il agrège des
 * dizaines de listes, dont de mauvaises.*
 *
 * D'où le garde-fou : **on prend le nom le plus FRÉQUENT**, pas le premier. Un
 * nom qui revient dans plusieurs listes indépendantes a été vérifié par
 * plusieurs personnes ; un nom qui n'apparaît qu'une fois peut venir d'une
 * ligne mal recopiée.
 *
 * *C'est aussi pour ça qu'il vient APRÈS iNaturalist*, qui a donné huit sur
 * huit sans une erreur.
 */
async function nomsGbif(cles: readonly number[]): Promise<Map<number, string>> {
  const par = new Map<number, string>()
  let fait = 0
  for (const key of cles) {
    const d = await json<{ results?: { language?: string; vernacularName?: string }[] }>(
      `gbif-vern-${key}`,
      `https://api.gbif.org/v1/species/${key}/vernacularNames?limit=100`,
      { pause: 100 },
    )
    const compte = new Map<string, number>()
    for (const r of d?.results ?? []) {
      if (r.language !== 'fra' || r.vernacularName === undefined) continue
      const n = r.vernacularName.trim()
      if (n.length === 0) continue
      compte.set(n, (compte.get(n) ?? 0) + 1)
    }
    const meilleur = [...compte.entries()].sort((a, b) => b[1] - a[1])[0]
    if (meilleur !== undefined) par.set(key, meilleur[0])
    fait += 1
    if (fait % 250 === 0) journal(`  GBIF noms : ${fait}/${cles.length}, ${par.size} trouvés`)
  }
  return par
}

// --------------------------------------------------------------------- le nom

/** Ce qui finit comme un nom de taxon n'est pas un nom commun. */
const SAVANT = /(idae|inae|iformes|morpha|oidea|aceae|ini|ia|ae|us|um|os|on)$/i

/**
 * UNE PARENTHÈSE DE DÉSAMBIGUÏSATION N'EST PAS UN NOM.
 *
 * Wikipédia intitule « Castor (genre) » l'article du castor, parce que
 * « Castor » désigne aussi un personnage mythologique. *Ce qui précède la
 * parenthèse EST le nom.*
 */
function sansParenthese(s: string): string {
  return s.replace(/\s*\([^)]*\)\s*$/, '').trim()
}

function sansAccent(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

type SourceDuNom = 'P1843' | 'article' | 'iNaturalist' | 'GBIF' | 'label' | 'scientifique'

/**
 * CE QUI FAIT LE NOM FRANÇAIS D'UNE ESPÈCE, et l'ordre compte.
 *
 * 1. **P1843**, le nom vernaculaire que Wikidata déclare ;
 * 2. **le titre de l'article français**, parenthèse retirée — *pour une espèce,
 *    c'est presque toujours le nom commun* : `Canis lupus` s'intitule « Loup »,
 *    `Vulpes vulpes` « Renard roux ». **Il passe donc AVANT le libellé**, à
 *    l'inverse de ce que faisait l'arbre : le libellé Wikidata d'une espèce est
 *    souvent le binôme latin, le titre d'article presque jamais ;
 * 3. le libellé français, s'il n'est pas le nom scientifique.
 *
 * `null` quand rien ne tient : l'espèce n'est alors pas une carte.
 */
function nomFrancais(
  e: Espece,
  info: Info,
  inat: string | null,
  gbif: string | null,
): { nom: string; source: SourceDuNom } {
  const sci = sansAccent(e.nom)

  const utile = (v: string | null): string | null => {
    if (v === null) return null
    const net = sansParenthese(v)
    if (net.length === 0) return null
    const k = sansAccent(net)
    if (k === sci) return null
    // LE GENRE SEUL EST ACCEPTÉ, et c'est un garde-fou qui est TOMBÉ.
    //
    // Il refusait un titre d'article égal au nom de genre, par crainte que
    // `Felis margarita` sorte nommé « Felis ». **La mesure dit que ce cas
    // n'existe pas** : Wikipédia intitule cet article « Chat des sables », et
    // sur les 1 901 cartes au nom latin, le garde-fou n'en bloquait que CINQ —
    // dont `Puma concolor` → « Puma » et `Lama glama` → « Lama », *les deux
    // seuls vrais noms français du lot.*
    //
    // *Une précaution qui coûte deux bons noms pour en éviter trois mauvais
    // n'est pas une précaution* — et le filtre savant reste, lui, pour écarter
    // ce qui finit comme un taxon.
    if (SAVANT.test(net) && net.split(/\s+/).length === 1) return null
    return net
  }

  if (info.nomFr !== null) {
    const n = sansParenthese(info.nomFr)
    if (n.length > 0) return { nom: n, source: 'P1843' }
  }
  const art = utile(info.articleFr)
  if (art !== null) return { nom: art, source: 'article' }
  if (inat !== null && inat.length > 0) return { nom: inat, source: 'iNaturalist' }
  if (gbif !== null && gbif.length > 0) return { nom: gbif, source: 'GBIF' }

  // LE LIBELLÉ N'EST UN NOM FRANÇAIS QUE S'IL DIFFÈRE DE L'ANGLAIS.
  //
  // *Les cas légitimement identiques — Puma, Koala, Okapi — sont déjà pris plus
  // haut par le titre d'article*, donc ce refus ne coûte rien et retire les 70
  // noms anglais du catalogue.
  const lab = utile(info.labelFr)
  const memeQuEn =
    info.labelEn !== null && lab !== null && sansAccent(lab) === sansAccent(info.labelEn)
  if (lab !== null && !memeQuEn) return { nom: lab, source: 'label' }

  // LE NOM SCIENTIFIQUE EN DERNIER RECOURS — accordé par Keko.
  //
  // *C'est ce que font les guides naturalistes*, et c'est ce qui garantit que
  // la collection soit COMPLÈTE : beaucoup de petits mammifères n'ont
  // littéralement pas de nom français. « *Myotis siligorensis* » sur une carte
  // est moins joli que « Murin », mais ce n'est pas faux — là où une espèce
  // absente, elle, est un trou dans un catalogue qui se veut entier.
  //
  // **La revue compte combien de cartes arrivent par cette porte** : si elles
  // sont trop nombreuses, c'est le signe qu'il manque une source de noms, pas
  // que la règle est mauvaise.
  return { nom: e.nom, source: 'scientifique' }
}

// ------------------------------------------------------------------- l'image

/**
 * L'IMAGE D'EN-TÊTE DE L'ARTICLE, en repli de P18.
 *
 * **Et le repli est SÛR ici**, là où il ne l'était pas pour les personnages :
 * une photo d'en-tête d'article d'espèce animale EST une photo de l'animal.
 * *Le mode personnages avait dû le refuser parce que Wikipédia illustrait
 * Thanos par un cosplayeur* — un animal n'a pas ce problème.
 *
 * Mesuré : 3 635 espèces ont une page française, 2 620 une image déclarée dans
 * Wikidata. **Le repli est ce qui décide de mille cartes.**
 */
async function imagesDesArticles(
  titres: readonly string[],
  api: string,
  etiquette: string,
): Promise<Map<string, string>> {
  const par = new Map<string, string>()
  const lots = paquets(titres, 50)
  let fait = 0
  for (const lot of lots) {
    const p = new URLSearchParams({
      action: 'query',
      format: 'json',
      formatversion: '2',
      prop: 'pageimages',
      piprop: 'original',
      pilicense: 'free',
      titles: lot.join('|'),
    })
    const d = await json<{
      query?: { pages?: { title?: string; original?: { source?: string } }[] }
    }>(`img-${etiquette}-${lot[0] ?? ''}-${lot.length}`, `${api}?${p.toString()}`)
    for (const page of d?.query?.pages ?? []) {
      const src = page.original?.source
      if (page.title === undefined || src === undefined) continue
      par.set(page.title, src)
    }
    fait += 1
    if (fait % 20 === 0) journal(`  images ${etiquette} : ${fait}/${lots.length} lots`)
  }
  return par
}

/**
 * LE NOM DU FICHIER COMMONS, quelle que soit la forme de l'URL.
 *
 * **On ne garde que ce qui vient de Commons** : une image hébergée localement
 * par un Wikipédia l'est au titre de l'usage encyclopédique, et *ce jeu n'est
 * pas une encyclopédie.*
 */
function fichierCommons(url: string): string | null {
  const direct = /\/wikipedia\/commons\/(?:thumb\/)?[0-9a-f]\/[0-9a-f]{2}\/([^/?]+)/.exec(url)
  if (direct?.[1] !== undefined) return decodeURIComponent(direct[1])
  const chemin = /commons\.wikimedia\.org\/wiki\/Special:FilePath\/([^?]+)/.exec(url)
  if (chemin?.[1] !== undefined) return decodeURIComponent(chemin[1])
  return null
}

/**
 * L'ADRESSE D'UNE VIGNETTE SE CALCULE, elle ne se demande pas.
 *
 * MediaWiki range ses fichiers sous les deux premiers caractères du MD5 de leur
 * nom, espaces changés en soulignés. **C'est le PIPELINE qui l'écrit**, parce
 * qu'il a `crypto` et que *le catalogue sert le jeu, il ne lui laisse pas une
 * adresse à réparer.*
 *
 * `Special:FilePath` serait plus simple et **ne marche pas** : il répond par une
 * redirection 302 qui ne porte aucun en-tête CORS, donc une image chargée en
 * `crossOrigin="anonymous"` — ce qu'il faut pour qu'un canvas ne soit pas
 * taché — échoue à la première étape.
 *
 * **Les largeurs ne sont pas libres** : mesuré, seules passent 120, 250, 500,
 * 960 et 1280. On prend 960 — la toile d'une carte plafonne à 768 et
 * l'illustration y est peinte en `cover`, donc 500 serait interpolé sur la
 * carte qu'on regarde de près.
 */
const LARGEUR = 960

function extensionDeVignette(f: string): string {
  const bas = f.toLowerCase()
  if (bas.endsWith('.svg')) return '.png'
  if (bas.endsWith('.tif') || bas.endsWith('.tiff')) return '.jpg'
  if (bas.endsWith('.pdf') || bas.endsWith('.djvu')) return '.jpg'
  return ''
}

function urlVignette(nomFichier: string): string {
  const f = nomFichier.replace(/ /g, '_')
  const h = createHash('md5').update(f, 'utf8').digest('hex')
  const page = /\.(pdf|djvu)$/i.test(f) ? 'page1-' : ''
  const e = encodeURIComponent(f)
  return (
    `https://upload.wikimedia.org/wikipedia/commons/thumb/${h[0]}/${h[0]}${h[1]}/` +
    `${e}/${page}${LARGEUR}px-${e}${extensionDeVignette(f)}`
  )
}

// -------------------------------------------------------------------- les vues

function fenetre(mois: number): { debut: string; fin: string } {
  const h = new Date()
  const fin = new Date(Date.UTC(h.getUTCFullYear(), h.getUTCMonth(), 1))
  const debut = new Date(Date.UTC(fin.getUTCFullYear(), fin.getUTCMonth() - mois, 1))
  const f = (d: Date) => `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, '0')}0100`
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
 *
 * **C'est le poste de coût du pipeline** : deux appels par carte.
 */
async function vues(langue: string, titre: string): Promise<number> {
  const t = encodeURIComponent(titre.replace(/ /g, '_'))
  const url = `${REST}/${langue}.wikipedia/all-access/user/${t}/monthly/${FENETRE.debut}/${FENETRE.fin}`
  // **LA PAUSE EST À 130 ms, et c'est mesuré** : à 80, onze appels sur neuf
  // mille se sont fait refuser (HTTP 429) — et un refus coûte les vues d'une
  // langue entière, donc un score faussé. *Un lot perdu sur une statistique ne
  // se voit pas, et c'est précisément ce qui le rend dangereux.*
  const d = await json<{ items?: { views?: number }[] }>(`vues-${langue}-${titre}`, url, {
    pause: 130,
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

/**
 * LES FRONTIÈRES DE RARETÉ SE CALCULENT SUR LES VUES, PAS SUR LE SCORE.
 *
 * **Le score est PLAFONNÉ à 1, et des dizaines d'animaux connus saturent ce
 * plafond** — un quantile ne peut pas couper dans un plateau. Mesuré sur la
 * première passe : **6,8 % de légendaires pour 3,2 % d'épiques**, là où on
 * demandait 2,5 et 7,5.
 *
 * *La bonne réponse n'était pas de monter le plafond* : les VUES, elles, sont
 * presque toutes distinctes, donc le quantile tombe juste quelle que soit la
 * taille du catalogue. **Le score garde son rôle d'indicateur et cesse de
 * servir à trancher.**
 */
function frontieres(vues: readonly number[]): number[] {
  const tries = [...vues].sort((a, b) => a - b)
  const bornes: number[] = []
  let debut = 0
  for (let i = 0; i < PARTS_RARETE.length - 1; i++) {
    debut += Math.round((PARTS_RARETE[i] ?? 0) * tries.length)
    bornes.push(tries[Math.min(debut, Math.max(0, tries.length - 1))] ?? 0)
  }
  return bornes
}

function cranDe(vues: number, bornes: readonly number[]): RareteAnimal {
  for (let i = 0; i < bornes.length; i++) {
    if (vues < (bornes[i] ?? Infinity)) return RARETES_ANIMAL[i] ?? 'commun'
  }
  return RARETES_ANIMAL[RARETES_ANIMAL.length - 1] ?? 'commun'
}

// --------------------------------------------------- le nom français d'un ordre

/**
 * LES ORDRES ONT LEUR NOM FRANÇAIS, et c'est là que les REDIRECTIONS servent
 * encore.
 *
 * **C'est le seul héritage de l'arbre, et il vaut d'être gardé** : pour
 * Chiroptera, le libellé français de Wikidata est littéralement
 * « Chiroptera », P1843 est vide, et seules les redirections de l'article
 * rendent **« Chauve-souris »** — en première position. Mesuré aussi sur
 * Rodentia → « Rongeur », Cetacea → « Cétacés », Primates → « Primate ».
 *
 * *Les groupes ne sont plus des cartes, ils sont les RAYONS de la collection* —
 * donc leur nom compte toujours autant, et il ne coûte que vingt-sept nœuds.
 */
const SOUS_SUJET =
  /(^|[^\p{L}])(dans|selon|liste|histoire|culture|fiction|mythologie)([^\p{L}]|$)/iu

async function nomsDesOrdres(ordres: readonly string[]): Promise<Map<string, string>> {
  const par = new Map<string, string>()
  for (const lot of paquets(ordres, 40)) {
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
    }>(`redir-ordres-${lot.length}-${lot[0] ?? ''}`, `${WIKI_FR}?${p.toString()}`)
    for (const page of d?.query?.pages ?? []) {
      if (page.title === undefined) continue
      const sci = sansAccent(page.title)
      for (const r of (page.redirects ?? []).map((x) => x.title)) {
        if (r === undefined) continue
        if (sansAccent(r) === sci || SAVANT.test(r) || r.includes('(')) continue
        if (SOUS_SUJET.test(r) || /^[a-z]/.test(r)) continue
        par.set(page.title, r)
        break
      }
    }
  }
  return par
}

// ------------------------------------------------------------------- la revue

function nombre(n: number): string {
  return n.toLocaleString('fr-FR')
}

function masseLisible(kg: number | null): string {
  if (kg === null) return '—'
  if (kg < 1) return `${Math.round(kg * 1000)} g`
  if (kg < 1000) return `${kg < 10 ? kg.toFixed(1) : String(Math.round(kg))} kg`
  return `${(kg / 1000).toFixed(1)} t`
}

type Rejet = { readonly nom: string; readonly raison: string }

function revue(
  cartes: readonly CarteAnimal[],
  sources: ReadonlyMap<string, SourceDuNom>,
  totalEspeces: number,
  rejets: readonly Rejet[],
  bornes: readonly number[],
): string {
  const l: string[] = []
  l.push(`# La collection « ${GROUPE} » — à relire`)
  l.push('')
  l.push(`Engendré le ${new Date().toISOString().slice(0, 10)}`)
  l.push('')
  l.push(
    `**${nombre(cartes.length)} cartes**, sur ${nombre(totalEspeces)} espèces vivantes du référentiel.`,
  )
  l.push('')

  const parCran = new Map<string, number>()
  for (const c of cartes) parCran.set(c.rarete, (parCran.get(c.rarete) ?? 0) + 1)
  l.push('## La rareté')
  l.push('')
  l.push('| cran | cartes | part | à partir de |')
  l.push('|---|---|---|---|')
  RARETES_ANIMAL.forEach((r, i) => {
    const n = parCran.get(r) ?? 0
    const b = i === 0 ? 0 : (bornes[i - 1] ?? 0)
    l.push(
      `| ${r} | ${nombre(n)} | ${((n / Math.max(1, cartes.length)) * 100).toFixed(1)} % | ${nombre(b)} vues |`,
    )
  })
  l.push('')

  l.push('## Ce qui a été écarté')
  l.push('')
  const parRaison = new Map<string, Rejet[]>()
  for (const r of rejets) {
    const lot = parRaison.get(r.raison)
    if (lot === undefined) parRaison.set(r.raison, [r])
    else lot.push(r)
  }
  for (const [raison, lot] of [...parRaison.entries()].sort((a, b) => b[1].length - a[1].length)) {
    l.push(`- **${nombre(lot.length)}** ${raison} — ${lot.slice(0, 8).map((r) => r.nom).join(', ')}…`)
  }
  l.push('')

  l.push('## À regarder de près')
  l.push('')
  const doublons = new Map<string, CarteAnimal[]>()
  for (const c of cartes) {
    const k = sansAccent(c.nom_fr)
    const lot = doublons.get(k)
    if (lot === undefined) doublons.set(k, [c])
    else lot.push(c)
  }
  const collisions = [...doublons.values()].filter((v) => v.length > 1)
  l.push(
    collisions.length === 0
      ? '- aucun nom français porté par deux cartes.'
      : `- **${collisions.length} noms** portés par plusieurs cartes :`,
  )
  for (const v of collisions.slice(0, 40)) {
    l.push(`  - « ${v[0]?.nom_fr ?? ''} » : ${v.map((c) => c.nom_scientifique).join(', ')}`)
  }
  // D'OÙ VIENT CHAQUE NOM : c'est ce qui dit s'il manque une source.
  //
  // **Une part élevée de « scientifique » n'accuse pas la règle, elle accuse
  // les sources** — c'est le signal qu'il faut aller chercher les noms
  // ailleurs, comme Keko l'a fait en proposant iNaturalist.
  const parSource = new Map<string, CarteAnimal[]>()
  for (const c of cartes) {
    const k = sources.get(c.id) ?? '?'
    const lot = parSource.get(k)
    if (lot === undefined) parSource.set(k, [c])
    else lot.push(c)
  }
  l.push('')
  l.push("### D'où viennent les noms")
  l.push('')
  l.push('| source | cartes | part | exemples |')
  l.push('|---|---|---|---|')
  for (const [src, lot] of [...parSource.entries()].sort((a, b) => b[1].length - a[1].length)) {
    const part = ((lot.length / Math.max(1, cartes.length)) * 100).toFixed(1)
    l.push(`| ${src} | ${nombre(lot.length)} | ${part} % | ${lot.slice(0, 5).map((c) => c.nom_fr).join(', ')} |`)
  }
  l.push('')
  const sansUicn = cartes.filter((c) => c.statut_uicn === null).length
  const sansMasse = cartes.filter((c) => c.masse_kg === null).length
  l.push(`- **${nombre(sansUicn)}** cartes sans statut UICN et **${nombre(sansMasse)}** sans masse.`)
  l.push('')

  l.push('## Les rayons de la collection')
  l.push('')
  l.push('| ordre | cartes | les plus connues |')
  l.push('|---|---|---|')
  const rayons = new Map<string, CarteAnimal[]>()
  for (const c of cartes) {
    const lot = rayons.get(c.ordre_fr)
    if (lot === undefined) rayons.set(c.ordre_fr, [c])
    else lot.push(c)
  }
  for (const [o, lot] of [...rayons.entries()].sort((a, b) => b[1].length - a[1].length)) {
    const vedettes = [...lot].sort((a, b) => b.score - a.score).slice(0, 4)
    l.push(`| ${o} | ${nombre(lot.length)} | ${vedettes.map((c) => c.nom_fr).join(', ')} |`)
  }
  l.push('')

  l.push('## Les cent cartes les plus connues')
  l.push('')
  l.push('| nom | scientifique | ordre | rareté | masse | UICN | vues |')
  l.push('|---|---|---|---|---|---|---|')
  for (const c of cartes.slice(0, 100)) {
    l.push(
      `| ${c.nom_fr} | *${c.nom_scientifique}* | ${c.ordre_fr} | ${c.rarete} |` +
        ` ${masseLisible(c.masse_kg)} | ${c.statut_uicn ?? '—'} | ${nombre(c.vues)} |`,
    )
  }
  l.push('')
  return l.join('\n')
}

// -------------------------------------------------------------------- l'entrée

async function principal(): Promise<void> {
  journal(`Collection « ${GROUPE} » · fenêtre ${FENETRE.debut} → ${FENETRE.fin}`)
  journal(`User-Agent : ${UA}`)

  const liste = await especes()
  journal(`${nombre(liste.length)} espèces vivantes listées`)

  const infos = await wikidata(liste.map((e) => e.key))
  journal(`${nombre(infos.size)} espèces trouvées dans Wikidata`)

  const ordres = [...new Set(liste.map((e) => e.ordre))]
  const nomsOrdres = await nomsDesOrdres(ordres)
  journal(`${nomsOrdres.size}/${ordres.length} ordres ont un nom français`)

  // LES NOMS D'iNATURALIST ne se demandent que pour les espèces dont Wikipédia
  // ne dit rien : *un lot de trente, autant ne pas le gâcher.*
  const aNommer: number[] = []
  const parInat = new Map<number, number>()
  for (const e of liste) {
    const i = infos.get(e.key)
    if (i?.inat === undefined || i.inat === null) continue
    const deja = i.nomFr !== null || (i.articleFr !== null && sansAccent(sansParenthese(i.articleFr)) !== sansAccent(e.nom))
    if (deja) continue
    aNommer.push(i.inat)
    parInat.set(i.inat, e.key)
  }
  journal(`${nombre(aNommer.length)} espèces sans nom chez Wikipédia, iNaturalist à interroger`)
  const nomsInat = await nomsINaturalist(aNommer)
  journal(`${nombre(nomsInat.size)} noms français retrouvés chez iNaturalist`)

  // LES NOMS DE GBIF, pour le reliquat que même iNaturalist ne nomme pas.
  const aNommerGbif: number[] = []
  for (const e of liste) {
    const i = infos.get(e.key)
    if (i === undefined) continue
    const deja =
      i.nomFr !== null ||
      (i.articleFr !== null && sansAccent(sansParenthese(i.articleFr)) !== sansAccent(e.nom)) ||
      (i.inat !== null && nomsInat.has(i.inat))
    if (!deja) aNommerGbif.push(e.key)
  }
  journal(`${nombre(aNommerGbif.length)} espèces encore sans nom, GBIF à interroger`)
  const nomsG = await nomsGbif(aNommerGbif)
  journal(`${nombre(nomsG.size)} noms français retrouvés chez GBIF`)

  // L'IMAGE SE CHERCHE EN TROIS TEMPS, et toujours sur COMMONS.
  //
  // P18 d'abord — *elle est DÉCLARÉE, donc choisie par un humain* — puis
  // l'en-tête de l'article français, puis **celui de l'anglais, qui a deux fois
  // plus d'articles** (7 453 contre 3 635, mesuré).
  //
  // **La catégorie Commons du taxon a été essayée et écartée** : son contenu est
  // trié par ordre alphabétique et non par pertinence, donc pour `Panthera leo`
  // le premier fichier est « Lion graph.JPG » — un graphique. Et elle n'existe
  // pas pour les espèces obscures. *Une source qui ne hiérarchise pas ne peut
  // pas choisir une illustration.*
  const sansImageFr: string[] = []
  const sansImageEn: string[] = []
  for (const e of liste) {
    const i = infos.get(e.key)
    if (i === undefined || i.image !== null) continue
    if (i.articleFr !== null) sansImageFr.push(i.articleFr)
    if (i.articleEn !== null) sansImageEn.push(i.articleEn)
  }
  journal(`${nombre(sansImageFr.length)} articles FR et ${nombre(sansImageEn.length)} EN à sonder pour une image`)
  const replisFr = await imagesDesArticles(sansImageFr, WIKI_FR, 'fr')
  const replisEn = await imagesDesArticles(sansImageEn, WIKI_EN, 'en')
  journal(`${nombre(replisFr.size)} images sur les articles FR, ${nombre(replisEn.size)} sur les EN`)

  // ------- le tri : nom + image, avant de payer les vues
  const rejets: Rejet[] = []
  type Candidat = {
    readonly e: Espece
    readonly i: Info
    readonly nom: string
    readonly source: SourceDuNom
    readonly image: string
  }
  const candidats: Candidat[] = []

  for (const e of liste) {
    const i = infos.get(e.key)
    if (i === undefined) {
      rejets.push({ nom: e.nom, raison: 'absentes de Wikidata' })
      continue
    }
    const nom = nomFrancais(
      e,
      i,
      i.inat === null ? null : (nomsInat.get(i.inat) ?? null),
      nomsG.get(e.key) ?? null,
    )
    const brut =
      i.image ??
      (i.articleFr !== null ? replisFr.get(i.articleFr) : undefined) ??
      (i.articleEn !== null ? replisEn.get(i.articleEn) : undefined) ??
      null
    const fichier = brut === null ? null : fichierCommons(brut)
    if (fichier === null) {
      rejets.push({ nom: nom.nom, raison: 'sans image sur Commons' })
      continue
    }
    candidats.push({ e, i, nom: nom.nom, source: nom.source, image: urlVignette(fichier) })
  }
  journal(`${nombre(candidats.length)} candidats nommés et illustrés`)

  // ------- les vues, le poste de coût
  const brouillons: CarteAnimal[] = []
  const sources = new Map<string, SourceDuNom>()
  let fait = 0
  for (const c of candidats) {
    const vFr = c.i.articleFr === null ? 0 : await vues('fr', c.i.articleFr)
    const vEn = c.i.articleEn === null ? 0 : await vues('en', c.i.articleEn)
    sources.set(String(c.e.key), c.source)
    brouillons.push({
      id: String(c.e.key),
      groupe: GROUPE,
      nom_fr: c.nom,
      nom_scientifique: c.e.nom,
      ordre: c.e.ordre,
      ordre_fr: nomsOrdres.get(c.e.ordre) ?? c.e.ordre,
      famille: c.e.famille,
      score: Number(scoreDe(vFr, vEn).toFixed(4)),
      rarete: 'commun',
      statut_uicn: c.i.iucn,
      masse_kg: c.i.masse,
      image: c.image,
      article_fr: c.i.articleFr,
      vues: vFr + vEn,
    })
    fait += 1
    if (fait % 250 === 0) journal(`  vues : ${fait}/${candidats.length}`)
  }

  const bornes = frontieres(brouillons.map((c) => c.vues))
  const cartes = brouillons
    .map((c) => ({ ...c, rarete: cranDe(c.vues, bornes) }))
    .sort((a, b) => b.vues - a.vues)

  const dossier = new URL('../public/data/', import.meta.url)
  mkdirSync(dossier, { recursive: true })
  const suffixe = option('sortie')
  const nomFichier = suffixe === undefined ? 'animals' : `animals-${suffixe}`
  writeFileSync(
    new URL(`${nomFichier}.json`, dossier),
    JSON.stringify({ genere: new Date().toISOString(), groupe: GROUPE, cartes }, null, 1),
    'utf8',
  )
  writeFileSync(
    new URL(`${nomFichier}_review.md`, dossier),
    revue(cartes, sources, liste.length, rejets, bornes),
    'utf8',
  )
  journal(`${nombre(cartes.length)} cartes écrites dans public/data/${nomFichier}.json`)
  journal(`frontières de rareté, en vues : ${bornes.map(nombre).join(' / ')}`)
}

principal().catch((e: unknown) => {
  console.error(e)
  process.exitCode = 1
})

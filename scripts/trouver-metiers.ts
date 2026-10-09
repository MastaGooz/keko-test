/**
 * LA LISTE DES METIERS NE S'INVENTE PLUS, ELLE SE MESURE.
 *
 * Keko : « et si on élargit à 500 métiers ? » -- et la bonne reponse n'est pas
 * d'en choisir cinq cents, c'est de **demander la liste a Wikidata et de jeter
 * les tiroirs vides**.
 *
 * *Pourquoi ca comptait* : les 37 metiers d'origine, je les avais ECRITS a la
 * main pour couvrir les huit domaines du jeu. Resultat mesure : **Zidane
 * manquait** -- 146 langues, tres au-dessus de la coupe, mais son metier
 * (« footballeur ») n'etait pas dans ma liste. Et la requete demande
 * `wdt:P106 wd:<Q>` **sans descendre dans les sous-classes**, donc un
 * footballeur n'est pas un « sportif ».
 *
 * **CE QUI RESSORT DE LA MESURE, et qui decide de tout le script :**
 *
 * | | |
 * |---|---|
 * | sous-classes de « profession » (Q28640) | **6 851**, en 7 s |
 * | la meme requete AVEC les libelles | **timeout a 60 s** |
 * | compter les humains d'un tiroir (CirrusSearch) | **198 ms** |
 * | mediane du nombre d'humains par tiroir | **ZERO** |
 * | tiroirs a >= 100 personnes | **~685** |
 *
 * *Les deux tiers de la liste sont des concepts, des metiers historiques sans
 * personne ou des doublons* -- d'ou le seuil, et d'ou le fait que « 500 » n'est
 * pas un objectif mais a peu pres ce qui reste quand on jette le vide.
 *
 * **ET LE COMPTE SE DEMANDE A CIRRUSSEARCH, PAS AU QUERY SERVICE.**
 * `haswbstatement:P106=Q937857` est indexe et repond en 200 ms ; le meme
 * `COUNT` en SPARQL scanne le tiroir et rend 504 sur les gros. *Quand un compte
 * est impossible a calculer, il est peut-etre deja compte ailleurs.*
 *
 * **LA LISTE S'ECRIT DANS UN FICHIER, elle ne se recalcule pas a chaque
 * passe.** Trois raisons, et la premiere suffirait :
 *
 * - *un catalogue doit etre reproductible* -- une liste qui change entre deux
 *   generations ferait changer le jeu sans qu'on ait rien demande ;
 * - vingt-trois minutes a chaque passe pour une liste qui bouge d'un metier par
 *   an, c'est du temps jete ;
 * - **Keko doit pouvoir la relire** et en retirer un tiroir a la main.
 *
 * Usage : `npm run metiers` (puis `npm run personnages`).
 */

import { writeFileSync, existsSync, readFileSync } from 'node:fs'
// ON REPREND LES OUTILS DU PIPELINE : *deux endroits qui decrivent la meme
// pause ou le meme agent se desaccordent au premier reglage.*
import { journal, dors, frais, cache, UA } from './outils.ts'

const SORTIE = 'scripts/metiers.json'

/**
 * LE SEUIL EST EN PERSONNES, PAS EN NOTORIETE, et c'est voulu : un tiroir se
 * juge sur ce qu'il CONTIENT, pas sur ce qu'il rendra. *Un metier a cent
 * personnes dont aucune n'est notoire ne coute qu'une requete de decouverte ;
 * un metier qu'on n'ouvre pas coute toutes ses cartes.*
 */
const SEUIL_HUMAINS = 100

/** Au-dela, on n'ouvre plus : la decouverte coute ~12 min par 67 metiers. */
const PLAFOND = 900

/** Ce que Wikidata appelle une profession. */
const RACINE = 'Q28640'

type Metier = { readonly id: string; readonly nom: string; readonly humains: number }

async function texte(url: string, accept: string, to = 70000): Promise<string | null> {
  try {
    const r = await fetch(url, {
      headers: { 'User-Agent': UA, Accept: accept },
      signal: AbortSignal.timeout(to),
    })
    return r.ok ? await r.text() : null
  } catch {
    return null
  }
}

/** Les Q-id de tous les metiers. SANS libelles : avec, la requete expire. */
async function laListe(): Promise<string[]> {
  const q = `SELECT ?m WHERE { ?m wdt:P279* wd:${RACINE} }`
  const t = await cache('liste-metiers', q, () =>
    texte('https://query.wikidata.org/sparql?query=' + encodeURIComponent(q), 'text/csv'),
    (v) => v !== null,
  )
  if (t === null) return []
  const ids = new Set<string>()
  for (const l of t.split('\n').slice(1)) {
    const m = /Q\d+/.exec(l)
    if (m) ids.add(m[0])
  }
  return [...ids]
}

/**
 * Combien d'humains portent ce metier. **Indexe, donc instantane** -- et c'est
 * la seule raison pour laquelle mesurer six mille huit cent cinquante et un
 * tiroirs est envisageable.
 *
 * **ET CHAQUE MESURE PASSE PAR LE CACHE**, une entree par tiroir. *Le cache est
 * par requete, pas par etape* -- la regle etait ecrite dans le projet et je ne
 * l'avais pas suivie ici : une passe interrompue au bout de vingt minutes
 * perdait ses six mille mesures et devait tout refaire. **Un travail de vingt
 * minutes qui n'ecrit rien avant la fin est un travail qu'on recommence.**
 *
 * `garder` ne retient que les succes : un `-1` cacherait un echec reseau et
 * condamnerait le tiroir jusqu'au prochain `--frais`.
 */
async function combien(id: string): Promise<number> {
  return cache(
    `metier-${id}`,
    id,
    async () => {
      const u =
        'https://www.wikidata.org/w/api.php?action=query&list=search&srsearch=' +
        encodeURIComponent(`haswbstatement:P106=${id}`) +
        '&srlimit=1&srinfo=totalhits&srprop=&format=json&formatversion=2'
      const t = await texte(u, 'application/json', 30000)
      if (t === null) return -1
      try {
        return (
          (JSON.parse(t) as { query?: { searchinfo?: { totalhits?: number } } }).query?.searchinfo
            ?.totalhits ?? 0
        )
      } catch {
        return -1
      }
    },
    (n) => n >= 0,
  )
}

/**
 * Les libelles, par lots -- et seulement pour les RETENUS. *Ils ne servent qu'a
 * rendre le fichier relisible*, donc on ne les paie pas sur les six mille qu'on
 * jette.
 */
async function libelles(ids: string[]): Promise<Map<string, string>> {
  const noms = new Map<string, string>()
  for (let i = 0; i < ids.length; i += 200) {
    const lot = ids.slice(i, i + 200)
    const q = `SELECT ?m ?l WHERE { VALUES ?m { ${lot
      .map((x) => 'wd:' + x)
      .join(' ')} } ?m rdfs:label ?l FILTER(LANG(?l) = "fr") }`
    const t = await texte(
      'https://query.wikidata.org/sparql?query=' + encodeURIComponent(q),
      'text/csv',
    )
    if (t !== null)
      for (const l of t.split('\n').slice(1)) {
        const m = /(Q\d+),"?(.*?)"?\s*$/.exec(l)
        if (m) noms.set(m[1], m[2])
      }
    await dors(150)
  }
  return noms
}

/**
 * LA TAXONOMIE NE SE SUFFIT PAS, ET C'EST MESURE : **« pianiste » n'est PAS une
 * sous-classe de « profession »** -- il est sous « claviériste », qui remonte
 * ailleurs. Idem pour « dessinateur », « acteur de cinéma »,
 * « auteur-compositeur-interprète », que j'avais pourtant mesures comme rendant
 * 95, 111, 5 et 3 personnes notoires. Et les autres racines candidates
 * (`Q1914636`, `Q4897819`) expirent a 45 s.
 *
 * ***Une racine de taxonomie ne couvre pas sa propre notion.***
 *
 * D'ou une seconde source, et c'est la plus pertinente des deux : **les metiers
 * des personnages que les LECTEURS cherchent.** On prend les pages les plus
 * consultees de fr.wikipedia, on garde les humains, et on releve leurs metiers.
 * *Ce n'est plus une hierarchie qu'on parcourt, c'est un usage qu'on observe.*
 */
async function parLesLecteurs(): Promise<string[]> {
  const t = await cache('top-vues-fr', 'metiers', () =>
    texte(
      'https://wikimedia.org/api/rest_v1/metrics/pageviews/top/fr.wikipedia/all-access/2026/09/all-days',
      'application/json',
      40000,
    ),
    (v) => v !== null,
  )
  if (t === null) return []
  let titres: string[] = []
  try {
    const j = JSON.parse(t) as { items?: { articles?: { article: string }[] }[] }
    titres = (j.items?.[0]?.articles ?? [])
      .map((a) => a.article.replace(/_/g, ' '))
      .filter((x) => !/^(Spécial|Wikipédia|Portail|Catégorie|Fichier|Aide|Discussion|Modèle):/.test(x))
  } catch {
    return []
  }

  const trouves = new Set<string>()
  for (let i = 0; i < titres.length; i += 50) {
    const lot = titres.slice(i, i + 50)
    // On ne garde QUE les humains : un pays ou un film n'a pas de metier a dire.
    const q = `SELECT ?m WHERE { VALUES ?t { ${lot
      .map((x) => JSON.stringify(x) + '@fr')
      .join(' ')} } ?a schema:isPartOf <https://fr.wikipedia.org/> ; schema:name ?t ; schema:about ?i . ?i wdt:P31 wd:Q5 ; wdt:P106 ?m }`
    const r = await cache(`metiers-lus-${i}`, q, () =>
      texte('https://query.wikidata.org/sparql?query=' + encodeURIComponent(q), 'text/csv'),
      (v) => v !== null,
    )
    if (r !== null)
      for (const l of r.split(String.fromCharCode(10)).slice(1)) {
        const m = /Q\d+/.exec(l)
        if (m) trouves.add(m[0])
      }
    await dors(150)
  }
  journal(`${trouves.size} metiers releves sur les personnages les plus lus`)
  return [...trouves]
}

async function principal(): Promise<void> {
  // ON NE REFAIT PAS CE QUI EST DEJA LA. Keko relancera avec --frais le jour ou
  // la liste devra bouger -- *une liste qui se refait toute seule fait changer
  // le catalogue sans qu'on l'ait demande.*
  if (existsSync(SORTIE) && !frais) {
    const n = (JSON.parse(readFileSync(SORTIE, 'utf8')) as { metiers: Metier[] }).metiers.length
    journal(`${SORTIE} existe deja (${n} metiers). Relancer avec --frais pour le refaire.`)
    return
  }

  journal(`Liste des sous-classes de profession (${RACINE})...`)
  const ids = await laListe()
  if (ids.length === 0) {
    journal('ECHEC : la liste est vide, le endpoint n a rien rendu.')
    process.exitCode = 1
    return
  }
  // L'UNION DES DEUX SOURCES : la taxonomie est large mais trouee, l'usage est
  // etroit mais juste. *Aucune des deux ne suffit seule.*
  const lus = await parLesLecteurs()
  const vus = new Set(ids)
  const neufs = lus.filter((x) => !vus.has(x))
  if (neufs.length > 0) {
    journal(`dont ${neufs.length} que la taxonomie ne connaissait pas`)
    ids.push(...neufs)
  }
  journal(`${ids.length} metiers a mesurer -- environ ${Math.round((ids.length * 0.2) / 60)} min`)

  const retenus: { id: string; humains: number }[] = []
  let vides = 0
  let rates = 0
  for (const [i, id] of ids.entries()) {
    const n = await combien(id)
    if (n < 0) rates++
    else if (n < SEUIL_HUMAINS) vides++
    else retenus.push({ id, humains: n })
    if ((i + 1) % 500 === 0)
      journal(`  ${i + 1}/${ids.length} mesures, ${retenus.length} retenus`)
  }

  // LE PLAFOND SE PREND SUR LES PLUS PEUPLES : si la liste depasse ce qu'on peut
  // decouvrir, on garde les gros tiroirs. *Un tiroir peuple a plus de chances de
  // contenir quelqu'un de notoire qu'un tiroir de cent personnes.*
  retenus.sort((a, b) => b.humains - a.humains)
  const gardes = retenus.slice(0, PLAFOND)

  journal(`Libelles des ${gardes.length} retenus...`)
  const noms = await libelles(gardes.map((x) => x.id))

  const metiers: Metier[] = gardes.map((x) => ({
    id: x.id,
    nom: noms.get(x.id) ?? x.id,
    humains: x.humains,
  }))

  writeFileSync(
    SORTIE,
    JSON.stringify(
      {
        genere: new Date().toISOString(),
        racine: RACINE,
        mesures: ids.length,
        seuil: SEUIL_HUMAINS,
        metiers,
      },
      null,
      1,
    ) + '\n',
    'utf8',
  )

  journal(
    `${metiers.length} metiers ecrits dans ${SORTIE} ` +
      `(${vides} sous le seuil de ${SEUIL_HUMAINS}, ${rates} non mesures)`,
  )
  journal(`le plus peuple : ${metiers[0]?.nom} (${metiers[0]?.humains})`)
  journal(`le dernier     : ${metiers.at(-1)?.nom} (${metiers.at(-1)?.humains})`)
}

void principal()

// LE PIPELINE DE DONNEES DU MODE PERSONNAGES.
//
//   node scripts/generate-characters.ts            relance, en profitant du cache
//   node scripts/generate-characters.ts --frais    ignore le cache
//   node scripts/generate-characters.ts --cible=500
//
// Il tourne HORS du build Vite : Node 24 execute TypeScript tel quel, donc
// aucune dependance a installer, et `tsconfig.json` ne couvre que `src` --
// `npm run build` ne le type-verifie pas.
//
// Il ecrit `public/data/characters.json` et `public/data/stats-summary.txt`.
//
// LES FORMULES NE SONT PAS ICI. Elles vivent dans
// `src/logic/characters/formules.ts`, qui est pur : *deux endroits qui
// decrivent le meme calcul se desaccordent au premier reglage*, et c'est ce qui
// permet de rejouer tout l'equilibrage sur le JSON deja telecharge.
//
// ---------------------------------------------------------------------------
// TROIS TEMPS, ET LE DECOUPAGE EST IMPOSE PAR LE ENDPOINT, PAS CHOISI :
//
//   1. DECOUVRIR, par metier et le plus legerement possible -- juste le Q-id,
//      le titre de l'article et le nombre de langues ;
//   2. ENRICHIR les seuls candidats retenus, par paquets de cinquante dans un
//      `VALUES` -- une requete a qui on donne ses items repond en une seconde ;
//   3. MESURER les articles sur Wikipedia FR, cinquante titres par appel.
//
// Mesure faite sur le endpoint public : `wdt:P31 wd:Q5` porte onze millions
// d'items et **un FILTER sur `wikibase:sitelinks` n'est pas indexe**. Toute
// requete qui trie ou filtre par notoriete coupe a soixante secondes, meme sur
// une seule annee de deces (502) et meme reduite au seul filtre de notoriete
// (504). Un metier, lui, est un index selectif : peintres morts avec article
// FR, c'est trente-neuf secondes.
// ---------------------------------------------------------------------------

import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { statsDerivees, siecle } from '../src/logic/characters/formules.ts'
import type { CharacterCard } from '../src/logic/characters/types.ts'
import { DOMAINES, RARETES } from '../src/logic/characters/types.ts'

// ----------------------------------------------------------------- les reglages

/** Le User-Agent est EXIGE par Wikimedia : une requete anonyme se fait jeter. */
const UA = 'keko-test/0.1 (https://github.com/MastaGooz/keko-test; mastagooz@gmail.com)'

const SPARQL = 'https://query.wikidata.org/sparql'
const WIKI = 'https://fr.wikipedia.org/w/api.php'

const CACHE = new URL('./.cache/', import.meta.url)
const SORTIE = new URL('../public/data/', import.meta.url)

/** Pause entre deux requetes a un meme service, en millisecondes. */
const PAUSE = { sparql: 1500, wiki: 300 }

/** Le endpoint public coupe a 60 s ; on laisse de la marge et on reessaie. */
const SPARQL_TIMEOUT = 90_000
const ESSAIS = 3

/**
 * UNE TRONCATURE NE SE REESSAIE QU'UNE FOIS, et c'est un arbitrage mesure.
 * Reessayer ne change pas la taille de la reponse ; REDECOUPER la divise par
 * deux. *Le redecoupage attaque la cause, le reessai un symptome.*
 *
 * Et surtout : les essais et le redecoupage puisent dans le MEME budget. A
 * trois essais, le lot racine consommait les cent cinquante secondes a lui
 * seul, et ses deux moities etaient abandonnees « hors budget » **sans avoir
 * ete essayees** -- le redecoupage ne servait a rien.
 */
const ESSAIS_TRONQUEE = 1

/** Les morts de moins de cinquante ans sont ecartes -- regle de Keko. */
const ANNEE_LIMITE = new Date().getUTCFullYear() - 50

/**
 * Le plancher de notoriete de la decouverte. Il n'est pas la pour selectionner
 * -- le tri final le fait -- mais pour que chaque lot reste sous les soixante
 * secondes du endpoint. Le baisser rouvre les timeouts.
 */
const LANGUES_MINIMUM = { humain: 18, fiction: 5 }

/**
 * LE PLAFOND N'EST PAS UNE SELECTION, c'est ce qui FERME la recursion du
 * redecoupage -- sans lui elle doit porter un cas `null` partout. Aucun item de
 * Wikidata n'approche les mille Wikipedia (le record tourne autour de trois
 * cent trente), donc il ne retire personne.
 *
 * Il n'a RIEN A VOIR avec la performance, contrairement a ce que deux mesures
 * avaient fait croire : `[18, 1000)` echoue a l'instant ou `[18, oo)` vient de
 * reussir. *C'est la charge du service, pas la forme du filtre.*
 */
const PLAFOND_LANGUES = 1000

/**
 * ON PRE-DECOUPE LA DECOUVERTE, AU LIEU D'ATTENDRE QU'ELLE CASSE. Un gros
 * metier rend une reponse de trois megaoctets, et le endpoint la coupe ; en
 * trois tranches, chacune passe. C'est trois requetes par metier au lieu d'une
 * -- quelques minutes sur tout le catalogue -- contre une convergence par
 * redecoupage qui coute SOIXANTE SECONDES par essai perdu, puisque c'est le
 * serveur qui tranche.
 *
 * *Mieux vaut trois petites requetes sures qu'une grosse a rattraper.*
 *
 * Les tranches sont resserrees EN BAS, parce que la notoriete decroit vite : il
 * y a beaucoup plus de gens a vingt langues qu'a cent.
 */
const TRANCHES_LANGUES: readonly (readonly [number, number])[] = [
  [18, 35],
  [35, 80],
  [80, PLAFOND_LANGUES],
]

/**
 * Combien de fois un lot perdu se redecoupe avant qu'on l'abandonne. Un gros
 * metier -- « homme politique » en porte un million et demi -- coupe a soixante
 * secondes meme allege ; coupe en tranches de notoriete, chaque morceau passe.
 */
const DECOUPAGES = 4

/**
 * LE BUDGET D'UNE TRANCHE, EN MILLISECONDES. Une tranche qui tronque se
 * redecoupe, et chaque essai perdu coute une minute : sans borne, un seul
 * metier mangeait un quart d'heure.
 *
 * IL EST PAR TRANCHE ET NON PAR METIER -- pose plus haut, la premiere tranche
 * le consommait seule et les suivantes etaient abandonnees sans etre tentees.
 *
 * *Une tranche abandonnee coute le bas de l'echelle d'un metier, pas la
 * generation.*
 */
const BUDGET_TRANCHE = 120_000

/** Le budget GLOBAL de la descente dans les sous-classes d'un seul metier. */
const BUDGET_TAXONOMIE = 300_000

/** Un article trop court n'est pas un personnage, c'est une ebauche. */
const TAILLE_MINIMALE = 1200

/** Combien de personnages on garde, les plus notoires d'abord. */
let cible = 3000

/**
 * On mesure un peu plus de candidats que la cible : la mesure en recale
 * quelques-uns (ebauches, articles disparus), et il faut de quoi completer.
 */
const MARGE_CANDIDATS = 1.5

// -------------------------------------------------------------------- les outils

const args = process.argv.slice(2)
const frais = args.includes('--frais')
for (const a of args) {
  const m = /^--cible=(\d+)$/.exec(a)
  if (m) cible = Number(m[1])
}

mkdirSync(CACHE, { recursive: true })
mkdirSync(SORTIE, { recursive: true })

function dors(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

function journal(...parts: unknown[]): void {
  console.log(`[${new Date().toISOString().slice(11, 19)}]`, ...parts)
}

function empreinte(s: string): string {
  return createHash('sha1').update(s).digest('hex').slice(0, 12)
}

/**
 * LE CACHE EST PAR REQUETE, PAS PAR ETAPE. C'est ce qui permet de relancer
 * apres un lot perdu sans redemander les trente qui avaient abouti -- et le
 * endpoint public coupe assez souvent pour que ca compte.
 *
 * Il ne retient QUE les succes : une reponse vide gardee condamnerait le lot
 * jusqu'au prochain `--frais`. `garder` dit ce qu'est un succes -- et une
 * reponse peut etre parfaitement formee sans en etre un (voir `mediawiki`).
 */
async function cache<T>(
  nom: string,
  charge: string,
  produire: () => Promise<T>,
  garder?: (v: T) => boolean,
): Promise<T> {
  const sain = nom.replace(/[^a-zA-Z0-9_-]+/g, '_').slice(0, 60)
  const chemin = new URL(`${sain}.${empreinte(charge)}.json`, CACHE)
  if (!frais && existsSync(chemin)) {
    try {
      return JSON.parse(readFileSync(chemin, 'utf8')) as T
    } catch {
      // Un cache abime se refait : il ne doit jamais bloquer une relance.
    }
  }
  const valeur = await produire()
  if (!garder || garder(valeur)) writeFileSync(chemin, JSON.stringify(valeur), 'utf8')
  return valeur
}

// -------------------------------------------------------------------- les sources

type Ligne = Record<string, { value: string } | undefined>

/** Le endpoint a coupe le flux en cours de route : il etait charge. */
class TronqueeError extends Error {}

function lire(l: Ligne, champ: string): string | undefined {
  return l[champ]?.value
}

async function sparql(nom: string, requete: string): Promise<Ligne[]> {
  return cache(`sparql-${nom}`, requete, async () => {
    for (let essai = 1; essai <= ESSAIS; essai++) {
      const t = Date.now()
      try {
        const r = await fetch(SPARQL, {
          method: 'POST',
          headers: {
            'User-Agent': UA,
            Accept: 'application/sparql-results+json',
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({ query: requete, format: 'json' }),
          signal: AbortSignal.timeout(SPARQL_TIMEOUT),
        })
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        let d: { results: { bindings: Ligne[] } }
        try {
          d = (await r.json()) as { results: { bindings: Ligne[] } }
        } catch (e) {
          // LE ENDPOINT LACHE LE FLUX QU'IL AVAIT COMMENCE. Il ne renvoie pas
          // une erreur : il repond -- quatre-vingt-douze mille lignes -- puis
          // coupe au milieu d'une chaine quand son budget de temps est epuise.
          // Le JSON est illisible a une position qui tombe sur une frontiere de
          // tampon, et il n'y a pas de fin a lire.
          //
          // ET LA CAUSE EST LE POIDS DE LA REPONSE, pas la charge : les
          // coupures tombaient toutes vers 2,97 Mo. En CSV la meme donnee pese
          // neuf fois moins et la requete passe -- d'ou `sparqlCsv` pour la
          // decouverte. On reessaie quand meme, parce qu'une reponse juste au
          // bord du seuil passe parfois.
          throw new TronqueeError(e instanceof Error ? e.message : String(e))
        }
        journal(`  ${nom} : ${d.results.bindings.length} lignes en ${((Date.now() - t) / 1000).toFixed(1)} s`)
        await dors(PAUSE.sparql)
        return d.results.bindings
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e)
        const tronquee = e instanceof TronqueeError
        journal(
          `  ${nom} : ${tronquee ? 'tronquee' : 'echec'} ${essai}/${ESSAIS} apres ${((Date.now() - t) / 1000).toFixed(1)} s (${msg})`,
        )
        if (essai === ESSAIS) throw new Error(`lot ${nom} perdu`)
        // UNE TRONCATURE ATTEND PLUS LONGTEMPS : ce n'est pas une erreur de
        // requete, c'est un service charge. Rappuyer tout de suite ne fait
        // qu'ajouter a la charge qui l'a causee.
        await dors(PAUSE.sparql * essai * (tronquee ? 12 : 4))
      }
    }
    return []
  })
}

/**
 * LA DECOUVERTE PASSE EN CSV, et c'est ce qui la fait tenir sous la limite.
 * Le format JSON de SPARQL enveloppe chaque valeur dans un objet a deux champs
 * -- `{"type":"uri","value":"http://www.wikidata.org/entity/Q42"}` pour dire
 * `Q42`. Mesure sur « homme politique » : la meme reponse pesait trois
 * megaoctets en JSON et quelques centaines de kilooctets en CSV.
 *
 * On ne l'emploie QUE pour la decouverte, dont les colonnes sont un Q-id et un
 * entier : aucun guillemet, aucune virgule, aucun retour a la ligne a echapper.
 * L'enrichissement, lui, rapporte des libelles et reste en JSON.
 */
async function sparqlCsv(nom: string, requete: string): Promise<string[][]> {
  return cache(`csv-${nom}`, requete, async () => {
    for (let essai = 1; essai <= ESSAIS; essai++) {
      const t = Date.now()
      try {
        const r = await fetch(SPARQL, {
          method: 'POST',
          headers: {
            'User-Agent': UA,
            Accept: 'text/csv',
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({ query: requete }),
          signal: AbortSignal.timeout(SPARQL_TIMEOUT),
        })
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        let texte: string
        try {
          texte = await r.text()
        } catch (e) {
          // `terminated` : le corps a ete coupe PENDANT la lecture. C'est la
          // meme panne qu'un CSV incomplet, vue un cran plus tot -- donc le
          // meme traitement, un seul essai puis on redecoupe.
          throw new TronqueeError(e instanceof Error ? e.message : String(e))
        }
        // UNE REPONSE TRONQUEE SE RECONNAIT ICI AUSSI : le CSV n'a pas de
        // marqueur de fin, donc on verifie que chaque ligne a bien ses colonnes
        // et que l'en-tete est la. *Un CSV coupe se lit sans erreur*, et c'est
        // precisement ce qui le rend dangereux.
        const lignes = texte
          .split('\n')
          .map((l) => l.trim())
          .filter(Boolean)
        if (lignes.length === 0 || !lignes[0].startsWith('item')) throw new TronqueeError('en-tete absent')
        const colonnes = lignes[0].split(',').length
        const corps = lignes.slice(1).map((l) => l.split(','))
        if (corps.some((c) => c.length !== colonnes)) throw new TronqueeError('ligne incomplete')
        journal(`  ${nom} : ${corps.length} lignes en ${((Date.now() - t) / 1000).toFixed(1)} s (${(texte.length / 1048576).toFixed(2)} Mo)`)
        await dors(PAUSE.sparql)
        return corps
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e)
        const tronquee = e instanceof TronqueeError
        journal(
          `  ${nom} : ${tronquee ? 'tronquee' : 'echec'} ${essai}/${ESSAIS} apres ${((Date.now() - t) / 1000).toFixed(1)} s (${msg})`,
        )
        if (essai >= (tronquee ? ESSAIS_TRONQUEE : ESSAIS)) throw new Error(`lot ${nom} perdu`)
        await dors(PAUSE.sparql * essai * 4)
      }
    }
    return []
  })
}

/**
 * Un lot perdu ne fait pas tomber la generation : il coute sa part du
 * catalogue, et la relance le redemandera puisque rien n'est mis en cache.
 */
async function sparqlSouple(nom: string, requete: string): Promise<Ligne[]> {
  try {
    return await sparql(nom, requete)
  } catch {
    journal(`  ${nom} : ABANDONNE`)
    return []
  }
}

/** Une page telle que l'API MediaWiki la rend. */
interface PageWiki {
  title?: string
  length?: number
  missing?: boolean
  pageviews?: Record<string, number | null>
}

interface ReponseWiki {
  query?: { pages?: PageWiki[]; normalized?: { from: string; to: string }[] }
  continue?: Record<string, string>
  error?: { code?: string; info?: string }
}

/**
 * LE CHAMP PEUT ETRE LA ET NE RIEN DIRE : quand le service de vues echoue sur
 * un titre, l'API rend `pageviews: { "2026-09-08": null, ... }` -- trente
 * `null`. Le champ est donc PRESENT, et une sonde qui teste son absence
 * repond « tout va bien ».
 *
 * ***Ce qu'on verifie n'est pas qu'un champ existe, c'est qu'il porte un
 * nombre.*** Le premier garde-fou de cette etape cherchait le symptome qu'on
 * venait de voir -- le champ manquant -- plutot que le fait dont on a besoin.
 */
function vuesUtilisables(p: PageWiki): boolean {
  if (p.missing) return true // Un article disparu n'a rien a mesurer : ce n'est pas un trou.
  const v = p.pageviews
  return v !== undefined && Object.values(v).some((n) => typeof n === 'number')
}

/**
 * ON SUIT LE `continue` DE L'API, ET C'EST OBLIGATOIRE — pas une optimisation.
 *
 * `prop=pageviews` est une propriete COUTEUSE : l'API n'en traite qu'une partie
 * des titres par appel et renvoie `continue: { pvipcontinue: "…" }` pour dire ou
 * reprendre. **Rien d'autre ne le signale** : pas d'erreur, pas de `warnings`,
 * et les pages rendues sont parfaitement formees -- celles qui n'ont pas ete
 * traitees n'ont simplement pas de champ `pageviews`.
 *
 * Mesure du run qui l'a revele : la TAILLE (`prop=info`, bon marche) etait
 * complete sur 4 421 articles, les VUES ne l'etaient que pour 1 081 sur 5 271 —
 * et deux mille trois cents cartes se retrouvaient a zero vue, donc a une
 * attaque de 1. *Napoleon a 72 676 vues par mois ; le catalogue en annoncait
 * zero.*
 *
 * ***Une reponse d'API qui porte un `continue` n'est pas une reponse, c'est sa
 * premiere page.***
 *
 * ET UN LOT TROUE N'EST PAS MIS EN CACHE. Le service de vues bloque ses propres
 * reessais trente minutes apres un echec (`pvi-cached-error-title`), donc rien
 * ne sert de rappuyer dans la seconde ; mais garder le lot gelerait le trou
 * jusqu'au prochain `--frais`. *Un cache ne retient que les succes*, et un lot
 * dont il manque les vues n'en est pas un : la relance suivante le reprendra.
 */
async function mediawiki(nom: string, params: Record<string, string>): Promise<ReponseWiki | null> {
  const base = { ...params, format: 'json', formatversion: '2' }
  const complet = (d: ReponseWiki | null) => d !== null && (d.query?.pages ?? []).every(vuesUtilisables)
  return cache(`wiki3-${nom}`, `${WIKI}?${new URLSearchParams(base)}`, async () => {
    const pages = new Map<string, PageWiki>()
    const normalized: { from: string; to: string }[] = []
    let suite: Record<string, string> = {}

    // Borne de securite : l'API devrait converger en quelques tours, mais une
    // boucle qui depend d'un jeton distant ne doit pas pouvoir tourner sans fin.
    for (let tour = 0; tour < 12; tour++) {
      const url = `${WIKI}?${new URLSearchParams({ ...base, ...suite })}`
      let d: ReponseWiki | null = null
      for (let essai = 1; essai <= ESSAIS; essai++) {
        try {
          const r = await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(30_000) })
          if (!r.ok) throw new Error(`HTTP ${r.status}`)
          d = (await r.json()) as ReponseWiki
          await dors(PAUSE.wiki)
          break
        } catch (e) {
          if (essai === ESSAIS) {
            journal(`  wiki ${nom} : abandonne (${e instanceof Error ? e.message : e})`)
            return null
          }
          await dors(PAUSE.wiki * essai * 6)
        }
      }
      if (d === null) return null
      // Le service de vues refuse un titre : la reponse n'a plus de `query` du
      // tout, donc le lot s'arrete ici avec ce qu'il a. On le DIT, sinon la
      // seule trace serait des cartes a zero vue.
      if (d.error) journal(`  wiki ${nom} : ${d.error.code ?? 'erreur'} -- ${d.error.info ?? ''}`.trimEnd())

      // ON FUSIONNE PAR TITRE : chaque tour rend les MEMES pages, en completant
      // seulement celles qu'il a traitees. Remplacer effacerait ce que le tour
      // d'avant avait obtenu -- et on ne remplace des vues utilisables ni par
      // une absence ni par trente `null`.
      for (const p of d.query?.pages ?? []) {
        if (!p.title) continue
        const deja = pages.get(p.title)
        if (!deja) {
          pages.set(p.title, p)
          continue
        }
        const garde = vuesUtilisables(p) || !vuesUtilisables(deja)
        pages.set(p.title, { ...deja, ...p, pageviews: garde ? p.pageviews : deja.pageviews })
      }
      for (const n of d.query?.normalized ?? []) normalized.push(n)

      if (!d.continue) return { query: { pages: [...pages.values()], normalized } }
      suite = d.continue
    }
    journal(`  wiki ${nom} : continuation trop longue, lot incomplet`)
    return { query: { pages: [...pages.values()], normalized } }
  }, complet)
}

function paquets<T>(xs: T[], taille: number): T[][] {
  const p: T[][] = []
  for (let i = 0; i < xs.length; i += taille) p.push(xs.slice(i, i + taille))
  return p
}

// ---------------------------------------------------------------- la decouverte

/**
 * Ce qu'un lot de decouverte rapporte : le strict minimum pour pre-trier.
 *
 * LE TITRE DE L'ARTICLE N'EST PAS LA, et c'est volontaire. On filtre bien sur
 * son existence -- `?article schema:about ?item` reste dans le WHERE -- mais on
 * ne le SELECTionne pas : une URL complete pese plus que les deux autres
 * colonnes reunies, et il arrive gratuitement avec les details.
 */
interface Candidat {
  id: string
  langues: number
  fiction: boolean
}

function titreDeLArticle(url: string | undefined): string {
  if (!url) return ''
  const t = url.split('/wiki/')[1] ?? ''
  return decodeURIComponent(t).replace(/_/g, ' ')
}

/** Une ligne de CSV : `item,langues`. */
function versCandidat(cellules: string[], fiction: boolean): Candidat | null {
  const id = cellules[0]?.split('/').pop()
  const langues = Number(cellules[1])
  if (!id || !/^Q\d+$/.test(id) || !Number.isFinite(langues)) return null
  return { id, langues, fiction }
}

/**
 * ON NE REDECOUPE QUE CE QUI A ECHOUE, et c'est ce qui rend le cache utile :
 * les trente-sept metiers qui passent du premier coup gardent leur entree, et
 * seul le lot perdu se refend. Mesure : « homme politique » coupe a soixante
 * secondes la ou « peintre » repond en une seconde et demie.
 *
 * LA COUPE EST GEOMETRIQUE, PAS ARITHMETIQUE. La notoriete suit une loi de
 * puissance : la moitie des personnages d'une tranche est sous sa moyenne
 * GEOMETRIQUE, et couper au milieu arithmetique laisserait presque tout le
 * monde du meme cote -- donc une moitie qui recouperait encore.
 */
interface Lot {
  lignes: string[][]
  /** Combien de tranches ont ete abandonnees : zero veut dire lot complet. */
  perdus: number
}

/**
 * L'echeance du lot courant. Posee par l'appelant, lue par le redecoupage :
 * *une recursion qui ne sait pas quand s'arreter n'a pas de pire cas.*
 */
let echeance = Infinity

async function lotRedecoupable(
  nom: string,
  requete: (bas: number, haut: number | null) => string,
  bas: number,
  haut: number | null,
  profondeur = 0,
): Promise<Lot> {
  const etiquette = haut === null ? `${nom}-${bas}` : `${nom}-${bas}-${haut}`
  if (Date.now() > echeance) {
    journal(`  ${etiquette} : hors budget, ABANDONNE`)
    return { lignes: [], perdus: 1 }
  }
  try {
    return { lignes: await sparqlCsv(etiquette, requete(bas, haut)), perdus: 0 }
  } catch {
    if (profondeur >= DECOUPAGES || (haut !== null && haut - bas <= 1)) {
      journal(`  ${etiquette} : ABANDONNE`)
      return { lignes: [], perdus: 1 }
    }
    // Sans borne haute, la queue est peu peuplee : on la detache d'un coup.
    const milieu = haut === null ? bas * 3 : Math.max(bas + 1, Math.round(Math.sqrt(bas * haut)))
    journal(`  ${etiquette} : redecoupe en [${bas}, ${milieu}) et [${milieu}, ${haut ?? 'oo'})`)
    const basse = await lotRedecoupable(nom, requete, bas, milieu, profondeur + 1)
    const haute = await lotRedecoupable(nom, requete, milieu, haut, profondeur + 1)
    return { lignes: [...basse.lignes, ...haute.lignes], perdus: basse.perdus + haute.perdus }
  }
}

/**
 * LES PERIODES SONT LE SECOND AXE : un autre decoupage du meme metier, sur un
 * critere different de la notoriete. Si une tranche de notoriete n'est jamais
 * passee malgre ses essais, rien ne dit qu'une tranche de DATE ne passera pas --
 * ce n'est pas la meme requete, et elle ne tombera pas sur le meme moment.
 *
 * Les bornes sont resserrees la ou les gens sont nombreux : il y a plus
 * d'humains notables morts entre 1890 et 1920 qu'avant l'an mil.
 */
const PERIODES: readonly (readonly [number, number])[] = [
  [-4000, 1500],
  [1500, 1700],
  [1700, 1800],
  [1800, 1850],
  [1850, 1890],
  [1890, 1920],
  [1920, 1945],
  [1945, 1960],
  [1960, ANNEE_LIMITE],
]

/** Toujours DEUX bornes, pour la raison expliquee sur `PLAFOND_LANGUES`. */
function bornesDeDate(debut: number, fin: number): string {
  const iso = (a: number) =>
    a < 0 ? `-${String(-a).padStart(4, '0')}-01-01` : `${String(a).padStart(4, '0')}-01-01`
  return `FILTER(?mort >= "${iso(debut)}"^^xsd:dateTime && ?mort < "${iso(fin)}"^^xsd:dateTime)`
}

/**
 * LES HUMAINS SE DECOUVRENT PAR METIER, et c'est la contrainte du endpoint
 * expliquee en tete de fichier.
 *
 * Le prix a connaitre : *la selection suit cette liste.* Un metier absent n'a
 * aucune carte -- c'est pour ca qu'elle couvre les huit domaines, et c'est le
 * premier endroit a elargir si le catalogue parait troue.
 */
const METIERS: readonly (readonly [string, string])[] = [
  // politique et pouvoir
  ['politicien', 'Q82955'],
  ['monarque', 'Q116'],
  ['souverain', 'Q12097'],
  ['diplomate', 'Q193391'],
  ['aristocrate', 'Q2478141'],
  ['juriste', 'Q185351'],
  // militaire
  ['militaire', 'Q47064'],
  ['officier', 'Q189290'],
  // penseurs et lettres
  ['ecrivain', 'Q36180'],
  ['poete', 'Q49757'],
  ['philosophe', 'Q4964182'],
  ['historien', 'Q201788'],
  ['journaliste', 'Q1930187'],
  ['dramaturge', 'Q214917'],
  // sciences
  ['physicien', 'Q169470'],
  ['chimiste', 'Q593644'],
  ['mathematicien', 'Q170790'],
  ['medecin', 'Q39631'],
  ['astronome', 'Q11063'],
  ['biologiste', 'Q864503'],
  ['ingenieur', 'Q81096'],
  ['inventeur', 'Q205375'],
  // arts
  ['peintre', 'Q1028181'],
  ['sculpteur', 'Q1281618'],
  ['compositeur', 'Q36834'],
  ['musicien', 'Q639669'],
  ['chanteur', 'Q177220'],
  ['acteur', 'Q33999'],
  ['architecte', 'Q42973'],
  ['realisateur', 'Q2526255'],
  ['photographe', 'Q33231'],
  // religion
  ['pretre-catholique', 'Q250867'],
  ['theologien', 'Q1234713'],
  ['saint', 'Q43115'],
  // sport et exploration
  ['sportif', 'Q2066131'],
  ['explorateur', 'Q11900058'],
  ['aviateur', 'Q2095549'],
]

/**
 * LE TROISIEME AXE EST LA TAXONOMIE, et c'est le dernier filet. Une SOUS-CLASSE
 * est un ensemble plus petit que son parent -- « homme politique » en porte des
 * dizaines -- donc un metier massif s'y decompose en metiers ordinaires.
 *
 * *Ce n'est pas la solution d'un probleme de requete* : la cause des troncatures
 * est la charge du service (voir `TronqueeError`). C'est un filet pour le cas ou
 * les essais et les deux premiers axes n'ont pas suffi, et il ne coute rien tant
 * que rien n'echoue.
 *
 * La requete des sous-classes est triviale (un seul predicat, un seul item),
 * donc elle ne risque rien.
 */
async function sousClasses(qid: string): Promise<string[]> {
  // `?item` et non `?m` : `sparqlCsv` verifie l'en-tete pour reconnaitre une
  // reponse tronquee, et il attend cette premiere colonne.
  const requete = `SELECT ?item WHERE { ?item wdt:P279 wd:${qid} } LIMIT 200`
  try {
    return (await sparqlCsv(`sous-classes-${qid}`, requete))
      .map((c) => c[0]?.split('/').pop())
      .filter((q): q is string => q !== undefined && /^Q\d+$/.test(q))
  } catch {
    return []
  }
}

async function decouvrirHumains(): Promise<Candidat[]> {
  journal(`Decouverte des humains : ${METIERS.length} metiers, morts avant ${ANNEE_LIMITE}, >= ${LANGUES_MINIMUM.humain} langues`)
  const out: Candidat[] = []
  for (const [nom, qid] of METIERS) {
    let n = 0
    for (const l of await decouvrirMetier(nom, qid)) {
      const c = versCandidat(l, false)
      if (c) {
        out.push(c)
        n++
      }
    }
    // UN Q-ID FAUX NE LEVE PAS, IL REND ZERO. La requete est valide, le metier
    // n'existe simplement pas -- donc le seul signe est un lot vide, et sans
    // cette ligne il passerait pour un metier rare. *Une table de trente-sept
    // identifiants recopies a la main en porte forcement un de travers.*
    if (n === 0) journal(`  ${nom} (wd:${qid}) : AUCUN personnage -- identifiant a verifier ?`)
  }
  return out
}

/**
 * ON NE PASSE AU SECOND AXE QUE SI LE PREMIER A PERDU QUELQUE CHOSE, et on
 * redemande alors le metier ENTIER par periodes : les doublons ne coutent rien,
 * la fusion par Q-id les absorbe deja. *Completer tranche par tranche aurait
 * demande de savoir lesquelles manquent, pour un gain nul.*
 */
async function decouvrirMetier(nom: string, qid: string, profondeur = 0): Promise<string[][]> {
  const parNotoriete = (bas: number, haut: number | null) => `
SELECT ?item ?langues WHERE {
  ?item wdt:P106 wd:${qid} ; wikibase:sitelinks ?langues ; wdt:P570 ?mort .
  FILTER(?langues >= ${bas}${haut === null ? '' : ` && ?langues < ${haut}`})
  FILTER(YEAR(?mort) < ${ANNEE_LIMITE})
  ?article schema:about ?item ; schema:isPartOf <https://fr.wikipedia.org/> .
}`
  const lignesNotoriete: string[][] = []
  let perdusNotoriete = 0
  for (const [bas, haut] of TRANCHES_LANGUES) {
    // LE BUDGET EST PAR TRANCHE, PAS PAR METIER. Pose avant la boucle, la
    // premiere tranche le consommait a elle seule et les deux suivantes
    // etaient abandonnees sans avoir ete tentees -- alors que ce sont elles
    // qui passent. *C'est la meme faute que les essais qui affamaient le
    // redecoupage, un cran plus haut.*
    echeance = Date.now() + BUDGET_TRANCHE
    const lot = await lotRedecoupable(`humains-${nom}`, parNotoriete, bas, haut)
    lignesNotoriete.push(...lot.lignes)
    perdusNotoriete += lot.perdus
  }
  // ON NE PASSE AUX AXES DE SECOURS QUE SI LE METIER N'A RIEN RENDU DU TOUT.
  // Ce qui casse sur un metier massif, c'est la tranche BASSE -- celle des
  // dix-huit a trente-cinq langues, qui compte le plus de monde. Or le tri
  // final ne garde que les plus notoires : *ces personnages-la seraient jetes
  // de toute facon.* Relancer vingt-sept requetes pour les retrouver coute des
  // minutes et ne change pas une carte.
  if (perdusNotoriete === 0 || lignesNotoriete.length > 0) {
    if (perdusNotoriete > 0)
      journal(`  ${nom} : ${perdusNotoriete} tranche(s) perdue(s), mais ${lignesNotoriete.length} lignes -- on garde`)
    return lignesNotoriete
  }

  journal(`  ${nom} : ${perdusNotoriete} tranche(s) perdue(s), on change d'axe pour la periode`)
  const lignes: string[][] = [...lignesNotoriete]
  let perdus = 0
  for (const [debut, fin] of PERIODES) {
    const parPeriode = (bas: number, haut: number | null) => `
SELECT ?item ?langues WHERE {
  ?item wdt:P106 wd:${qid} ; wikibase:sitelinks ?langues ; wdt:P570 ?mort .
  ${bornesDeDate(debut, fin)}
  FILTER(?langues >= ${bas}${haut === null ? '' : ` && ?langues < ${haut}`})
  ?article schema:about ?item ; schema:isPartOf <https://fr.wikipedia.org/> .
}`
    for (const [bas, haut] of TRANCHES_LANGUES) {
      echeance = Date.now() + BUDGET_TRANCHE
      const lot = await lotRedecoupable(`humains-${nom}-av${fin}`, parPeriode, bas, haut)
      lignes.push(...lot.lignes)
      perdus += lot.perdus
    }
  }
  if (perdus === 0 || profondeur > 0) return lignes

  // ON DESCEND DANS LA TAXONOMIE, le dernier filet. Une seule fois : les
  // sous-classes sont deja petites, et descendre plus bas multiplierait les
  // requetes pour des metiers de plus en plus rares.
  const filles = await sousClasses(qid)
  if (filles.length === 0) {
    journal(`  ${nom} : aucune sous-classe, ${perdus} tranche(s) perdue(s) pour de bon`)
    return lignes
  }
  journal(`  ${nom} : ${perdus} tranche(s) perdue(s), on descend dans ses ${filles.length} sous-classes`)
  // LA TAXONOMIE A SON PROPRE BUDGET, GLOBAL. Chaque sous-classe arme sinon le
  // sien, et quarante sous-classes a cent cinquante secondes feraient deux
  // heures sur un seul metier : *un budget par appel n'est pas un budget.*
  const finTaxonomie = Date.now() + BUDGET_TAXONOMIE
  for (const fille of filles) {
    if (Date.now() > finTaxonomie) {
      journal(`  ${nom} : budget des sous-classes epuise`)
      break
    }
    lignes.push(...(await decouvrirMetier(`${nom}-${fille}`, fille, 1)))
  }
  return lignes
}

/**
 * LA FICTION TIENT EN QUELQUES REQUETES : `wdt:P31/wdt:P279* wd:Q95074` repond
 * en quelques secondes, parce que l'ensemble est petit a l'echelle de Wikidata
 * -- mesure : sept mille quatre cent soixante-treize personnages de fiction ont
 * un article FR, tous crans confondus. On decoupe par tranche de notoriete pour
 * rester a l'abri du timeout, pas pour selectionner.
 */
async function decouvrirFiction(): Promise<Candidat[]> {
  journal(`Decouverte de la fiction : >= ${LANGUES_MINIMUM.fiction} langues`)
  const out: Candidat[] = []
  const requete = (bas: number, haut: number | null) => `
SELECT ?item ?langues WHERE {
  ?item wdt:P31/wdt:P279* wd:Q95074 ; wikibase:sitelinks ?langues .
  FILTER(?langues >= ${bas}${haut === null ? '' : ` && ?langues < ${haut}`})
  ?article schema:about ?item ; schema:isPartOf <https://fr.wikipedia.org/> .
}`
  const tranches: readonly (readonly [number, number | null])[] = [
    [40, PLAFOND_LANGUES],
    [20, 40],
    [10, 20],
    [LANGUES_MINIMUM.fiction, 10],
  ]
  echeance = Infinity
  for (const [bas, haut] of tranches) {
    for (const l of (await lotRedecoupable('fiction', requete, bas, haut)).lignes) {
      const c = versCandidat(l, true)
      if (c) out.push(c)
    }
  }
  return out
}

// --------------------------------------------------------------- l'enrichissement

interface Details {
  nom: string
  /** Le titre de l'article FR. Il vient d'ici et non de la decouverte. */
  article: string
  description: string
  image: string | null
  naissance: number | null
  mort: number | null
  origine: string | null
  metiers: string[]
}

/**
 * LA LARGEUR DE VIGNETTE, ET ELLE N'EST PAS LIBRE.
 *
 * Wikimedia a fermé les largeurs arbitraires : une taille hors de sa liste
 * rend un **400** dont le corps dit « Use thumbnail sizes listed on… ».
 * Mesuré sur un vrai fichier, seules passent : **120, 250, 500, 960, 1280**.
 *
 * 960 parce que la toile d'une carte plafonne à 768 de large et que
 * l'illustration y est peinte en `cover` : à 500 elle serait interpolée sur la
 * carte qu'on regarde de près. Elle pèse ~250 Ko, contre 2,2 Mo pour
 * l'original. *Une grille de collection, elle, prendra 250.*
 */
const LARGEUR_VIGNETTE = 960

/** Ce que Wikimedia rend en PNG plutôt que dans son format d'origine. */
const RENDUS_EN_PNG = /\.(svg|tif|tiff|djvu|pdf)$/i

/**
 * L'URL DIRECTE D'UNE VIGNETTE COMMONS — et c'est le pipeline qui la calcule,
 * pas le navigateur.
 *
 * **Wikidata rend une URL `Special:FilePath`, et elle est INUTILISABLE dans un
 * canvas.** Elle répond par une redirection 302 qui ne porte AUCUN en-tête
 * CORS : une image chargée en `crossOrigin="anonymous"` — ce qu'il faut pour
 * qu'un canvas ne soit pas taché — échoue donc à la première étape. *Et ça ne
 * se voit pas en la mesurant* : `fetch` suit la redirection et rend les
 * en-têtes de la réponse FINALE, qui, elle, porte bien `ACAO: *`.
 *
 * ***Une mesure prise à l'arrivée ne dit rien des étapes du chemin.***
 *
 * L'URL finale se calcule : MediaWiki range ses fichiers sous les deux
 * premiers caractères du MD5 de leur nom, espaces changés en soulignés. On
 * l'écrit donc ici, en https — *le catalogue sert le jeu, il ne lui laisse pas
 * une adresse à réparer.*
 */
function vignetteCommons(url: string | undefined): string | null {
  if (!url) return null
  const apres = url.split('/Special:FilePath/')[1]
  if (apres === undefined) return null
  const fichier = decodeURIComponent(apres).replace(/ /g, '_')
  if (fichier === '') return null
  const h = createHash('md5').update(fichier).digest('hex')
  const e = encodeURIComponent(fichier)
  const sortie = RENDUS_EN_PNG.test(fichier) ? `${e}.png` : e
  // Un fichier à PAGES se vignette page par page.
  const page = /\.(djvu|pdf)$/i.test(fichier) ? 'page1-' : ''
  return `https://upload.wikimedia.org/wikipedia/commons/thumb/${h[0]!}/${h[0]!}${h[1]!}/${e}/${page}${LARGEUR_VIGNETTE}px-${sortie}`
}

function annee(iso: string | undefined): number | null {
  if (!iso) return null
  // Wikidata ecrit les dates d'avant notre ere avec un signe : « -0044-03-15T... ».
  const m = /^(-?\d{1,5})-/.exec(iso)
  if (!m) return null
  const a = Number(m[1])
  return Number.isFinite(a) && a !== 0 ? a : null
}

function listeDe(v: string | undefined): string[] {
  if (!v) return []
  return [...new Set(v.split('|').map((s) => s.trim()).filter(Boolean))]
}

/**
 * UNE REQUETE A QUI ON DONNE SES ITEMS EST INSTANTANEE. C'est tout l'interet du
 * decoupage : les six `OPTIONAL` et le `GROUP_CONCAT` qui feraient couper un lot
 * de decouverte ne coutent rien sur cinquante items nommes.
 *
 * `P27` est le pays de citoyennete d'un humain, `P1441` l'oeuvre ou parait un
 * personnage de fiction. On demande les deux et on garde ce qui vient : la
 * requete n'a pas a savoir lequel des deux on attend.
 */
async function enrichir(candidats: Candidat[]): Promise<Map<string, Details>> {
  const lots = paquets(candidats, 50)
  journal(`Enrichissement : ${candidats.length} personnages en ${lots.length} paquets`)
  const details = new Map<string, Details>()
  let fait = 0
  for (const lot of lots) {
    const requete = `
SELECT ?item
  (SAMPLE(?lab) AS ?nom) (SAMPLE(?desc) AS ?description) (SAMPLE(?img) AS ?image)
  (SAMPLE(?nais) AS ?naissance) (SAMPLE(?dec) AS ?mort)
  (SAMPLE(?pays) AS ?citoyennete) (SAMPLE(?oeuvre) AS ?oeuvre)
  (SAMPLE(?art) AS ?article)
  (GROUP_CONCAT(DISTINCT ?met ; separator="|") AS ?metiers)
WHERE {
  VALUES ?item { ${lot.map((c) => `wd:${c.id}`).join(' ')} }
  ?art schema:about ?item ; schema:isPartOf <https://fr.wikipedia.org/> .
  ?item rdfs:label ?lab . FILTER(LANG(?lab) = "fr")
  OPTIONAL { ?item schema:description ?desc . FILTER(LANG(?desc) = "fr") }
  OPTIONAL { ?item wdt:P18 ?img }
  OPTIONAL { ?item wdt:P569 ?nais }
  OPTIONAL { ?item wdt:P570 ?dec }
  OPTIONAL { ?item wdt:P27 ?paysId . ?paysId rdfs:label ?pays . FILTER(LANG(?pays) = "fr") }
  OPTIONAL { ?item wdt:P1441 ?oId . ?oId rdfs:label ?oeuvre . FILTER(LANG(?oeuvre) = "fr") }
  OPTIONAL { ?item wdt:P106 ?mId . ?mId rdfs:label ?met . FILTER(LANG(?met) = "fr") }
}
GROUP BY ?item`
    for (const l of await sparqlSouple(`details-${empreinte(lot.map((c) => c.id).join(','))}`, requete)) {
      const id = lire(l, 'item')?.split('/').pop()
      const nom = lire(l, 'nom')
      if (!id || !nom) continue
      const article = titreDeLArticle(lire(l, 'article'))
      if (!article) continue
      details.set(id, {
        nom,
        article,
        description: lire(l, 'description') ?? '',
        image: vignetteCommons(lire(l, 'image')),
        naissance: annee(lire(l, 'naissance')),
        mort: annee(lire(l, 'mort')),
        origine: lire(l, 'citoyennete') ?? lire(l, 'oeuvre') ?? null,
        metiers: listeDe(lire(l, 'metiers')),
      })
    }
    fait += lot.length
    if (lots.length > 10 && fait % 500 < 50) journal(`  ${fait}/${candidats.length}`)
  }
  return details
}

// ------------------------------------------------------------------ Wikipedia FR

interface Mesure {
  taille: number
  vues: number
}

/**
 * LA TAILLE ET LES VUES VIENNENT DE LA MEME REQUETE, et c'est ce qui rend
 * l'etape tenable. `prop=info|pageviews` accepte **cinquante titres par
 * appel** : quatre mille cinq cents articles coutent quatre-vingt-dix
 * requetes, la ou l'API REST des pageviews en demanderait quatre mille cinq
 * cents.
 *
 * `pageviews` rend jusqu'aux soixante derniers jours ; `pvipdays=30` n'en
 * demande que trente, comme voulu.
 */
async function mesurerArticles(titres: string[]): Promise<Map<string, Mesure>> {
  const lots = paquets(titres, 50)
  journal(`Mesure des articles FR : ${titres.length} titres en ${lots.length} paquets`)
  const mesures = new Map<string, Mesure>()
  let fait = 0
  let manquantes = 0
  for (const lot of lots) {
    const d = await mediawiki(`info-${empreinte(lot.join('|'))}`, {
      action: 'query',
      prop: 'info|pageviews',
      pvipdays: '30',
      titles: lot.join('|'),
    })
    // L'API NORMALISE LES TITRES QU'ON LUI DONNE, et elle rend les pages sous
    // leur titre normalise : sans cette table, un titre a souligne ou a
    // majuscule initiale differente ne se retrouverait pas.
    const versDemande = new Map<string, string>()
    for (const { from, to } of d?.query?.normalized ?? []) versDemande.set(to, from)
    for (const p of d?.query?.pages ?? []) {
      if (!p.title || p.missing) continue
      // UNE CARTE SANS VUES MESURABLES N'EST PAS UNE CARTE A ZERO VUE : on ne
      // l'enregistre pas, et elle sera ecartee comme un article non mesure. La
      // marge de candidats est la pour ca. *Un zero qu'on sait faux est pire
      // qu'une carte en moins*, parce qu'il traverse les formules sans bruit.
      if (!vuesUtilisables(p)) {
        manquantes++
        continue
      }
      const vues = Object.values(p.pageviews ?? {}).reduce<number>((s, v) => s + (v ?? 0), 0)
      const m = { taille: p.length ?? 0, vues }
      mesures.set(p.title, m)
      const demande = versDemande.get(p.title)
      if (demande) mesures.set(demande, m)
    }
    fait += lot.length
    if (fait % 1000 < 50) journal(`  ${fait}/${titres.length}`)
  }
  // UN CATALOGUE A ZERO VUE NE SE VOIT PAS DANS LE RESUME : l'attaque tombe a 1
  // et tout paraît simplement terne. On le dit donc ici, en clair.
  if (manquantes > 0) journal(`  ${manquantes} article(s) sans vues mesurables, ecarte(s) -- relancer les recuperera`)
  return mesures
}

// --------------------------------------------------------------------- le resume

function barre(part: number, large = 28): string {
  const n = Math.max(0, Math.min(large, Math.round(part * large)))
  return '#'.repeat(n) + '.'.repeat(large - n)
}

function comptes(valeurs: (string | number)[]): Map<string, number> {
  const m = new Map<string, number>()
  for (const v of valeurs) m.set(String(v), (m.get(String(v)) ?? 0) + 1)
  return m
}

function tableau(titre: string, ordre: readonly (string | number)[], c: Map<string, number>, total: number): string {
  const l = [titre, '-'.repeat(titre.length)]
  const ligne = (k: string, n: number) =>
    `  ${k.padEnd(14)} ${String(n).padStart(5)}  ${((100 * n) / (total || 1)).toFixed(1).padStart(5)} %  ${barre(n / (total || 1))}`
  const vus = new Set<string>()
  for (const k of ordre) {
    vus.add(String(k))
    l.push(ligne(String(k), c.get(String(k)) ?? 0))
  }
  for (const [k, n] of [...c].sort((a, b) => b[1] - a[1])) if (!vus.has(k)) l.push(ligne(k, n))
  return l.join('\n')
}

function mediane(xs: number[]): number {
  if (xs.length === 0) return 0
  const t = [...xs].sort((a, b) => a - b)
  return t[Math.floor(t.length / 2)]
}

function resume(cartes: CharacterCard[]): string {
  const n = cartes.length || 1
  const avecImage = cartes.filter((c) => c.image !== null).length
  const l: string[] = []
  l.push('RESUME DU JEU DE CARTES-PERSONNAGES')
  l.push(`engendre le ${new Date().toISOString().slice(0, 19).replace('T', ' ')} UTC`)
  l.push('')
  l.push(`${cartes.length} cartes : ${cartes.filter((c) => !c.fiction).length} historiques, ${cartes.filter((c) => c.fiction).length} de fiction`)
  l.push(`${avecImage} portent une image (${((100 * avecImage) / n).toFixed(0)} %)`)
  l.push('')
  l.push(tableau('PAR RARETE', RARETES, comptes(cartes.map((c) => c.rarete)), cartes.length))
  l.push('')
  l.push(tableau('PAR DOMAINE', DOMAINES, comptes(cartes.map((c) => c.domaine)), cartes.length))
  l.push('')

  const siecles = cartes.map((c) => siecle(c.mort ?? c.naissance)).filter((s): s is number => s !== null)
  const ordre = [...new Set(siecles)].sort((a, b) => a - b)
  l.push(tableau('PAR SIECLE (de la mort, sinon de la naissance)', ordre, comptes(siecles), siecles.length))
  l.push('')

  l.push('ATTAQUE ET DEFENSE')
  l.push('------------------')
  for (const champ of ['attaque', 'defense'] as const) {
    const c = comptes(cartes.map((x) => x[champ]))
    l.push(`  ${champ} :`)
    for (let v = 1; v <= 10; v++) {
      const k = c.get(String(v)) ?? 0
      l.push(`    ${String(v).padStart(2)}  ${String(k).padStart(5)}  ${barre(k / n, 20)}`)
    }
  }
  l.push('')

  l.push('LES SOURCES, EN MEDIANE ET PAR RARETE')
  l.push('-------------------------------------')
  l.push(`  ${'rarete'.padEnd(12)} ${'n'.padStart(5)} ${'langues'.padStart(8)} ${'vues/30j'.padStart(9)} ${'octets'.padStart(8)}`)
  for (const r of RARETES) {
    const g = cartes.filter((c) => c.rarete === r)
    if (g.length === 0) continue
    l.push(
      `  ${r.padEnd(12)} ${String(g.length).padStart(5)} ${String(mediane(g.map((c) => c.langues))).padStart(8)} ` +
        `${String(mediane(g.map((c) => c.vues))).padStart(9)} ${String(mediane(g.map((c) => c.taille))).padStart(8)}`,
    )
  }
  l.push('')

  l.push('LES DIX PLUS NOTOIRES')
  l.push('---------------------')
  for (const c of cartes.slice(0, 10))
    l.push(
      `  ${c.nom.slice(0, 26).padEnd(28)} ${c.rarete.padEnd(12)} ${String(c.langues).padStart(4)} langues  ` +
        `${String(c.vues).padStart(7)} vues  A${c.attaque}/D${c.defense}  ${c.domaine}`,
    )
  l.push('')

  l.push('UN EXEMPLE PAR RARETE, PRIS AU MILIEU DE SON CRAN')
  l.push('-------------------------------------------------')
  for (const r of RARETES) {
    const g = cartes.filter((c) => c.rarete === r)
    if (g.length === 0) {
      l.push(`  ${r.padEnd(12)} aucune carte -- SEUIL A REVOIR`)
      continue
    }
    const m = g[Math.floor(g.length / 2)]
    l.push(`  ${r.padEnd(12)} ${m.nom} (${m.langues} langues, ${m.vues} vues, A${m.attaque}/D${m.defense}, ${m.domaine})`)
  }
  return l.join('\n') + '\n'
}

// ---------------------------------------------------------------------- le corps

async function main(): Promise<void> {
  const debut = Date.now()
  journal(`Cible : ${cible} personnages${frais ? ' (cache ignore)' : ''}`)

  const bruts = [...(await decouvrirHumains()), ...(await decouvrirFiction())]
  journal(`${bruts.length} lignes decouvertes`)

  // Un personnage sort de plusieurs lots -- un peintre qui est aussi
  // sculpteur. On ne garde qu'une entree par Q-id.
  const parId = new Map<string, Candidat>()
  for (const c of bruts) if (!parId.has(c.id)) parId.set(c.id, c)
  journal(`${parId.size} personnages distincts`)

  // ON N'ENRICHIT ET ON NE MESURE QUE LES PLUS NOTOIRES. Chaque etape coute une
  // requete par cinquante personnages : les faire toutes sur l'ensemble decouvert
  // couterait des heures pour des cartes qu'on jettera. Le nombre de langues
  // suffit a pre-trier -- c'est le seul signal qu'on ait avant Wikipedia.
  // LE DEPARTAGE SE FAIT SUR LE Q-ID, et ce n'est pas cosmetique : des
  // centaines de personnages partagent le meme nombre de langues, donc sans
  // second critere l'ordre suivrait celui des lots -- qui depend de ce que le
  // cache contenait. *Deux generations devraient rendre le meme catalogue.*
  const candidats = [...parId.values()]
    .sort((a, b) => b.langues - a.langues || a.id.localeCompare(b.id))
    .slice(0, Math.ceil(cible * MARGE_CANDIDATS))
  journal(`${candidats.length} candidats retenus (>= ${candidats.at(-1)?.langues ?? 0} langues)`)

  const details = await enrichir(candidats)
  // LES TITRES VIENNENT DES DETAILS, donc on ne mesure que ce qui en a : un
  // candidat sans libelle FR n'aura pas de carte de toute facon.
  const mesures = await mesurerArticles([...details.values()].map((d) => d.article))

  let sansDetail = 0
  let sansArticle = 0
  let ebauche = 0
  const cartes: CharacterCard[] = []
  for (const c of candidats) {
    const d = details.get(c.id)
    if (!d) {
      sansDetail++
      continue
    }
    // UN LIBELLE QUI N'EST QUE SON Q-ID VEUT DIRE QU'IL N'Y A PAS DE LIBELLE FR.
    // Une carte qui s'appellerait « Q12345 » n'est pas une carte.
    if (d.nom === c.id) {
      sansDetail++
      continue
    }
    const m = mesures.get(d.article)
    if (!m) {
      sansArticle++
      continue
    }
    if (m.taille < TAILLE_MINIMALE) {
      ebauche++
      continue
    }
    const stats = statsDerivees({
      langues: c.langues,
      vues: m.vues,
      taille: m.taille,
      metiers: d.metiers,
      fiction: c.fiction,
      // LE DOMAINE SE LIT DANS LA DESCRIPTION : voir `domaineDe`.
      description: d.description,
    })
    cartes.push({
      id: c.id,
      nom: d.nom,
      description: d.description,
      article: d.article,
      image: d.image,
      naissance: d.naissance,
      mort: d.mort,
      fiction: c.fiction,
      origine: d.origine,
      metiers: d.metiers,
      domaine: stats.domaine,
      langues: c.langues,
      taille: m.taille,
      vues: m.vues,
      rarete: stats.rarete,
      attaque: stats.attaque,
      defense: stats.defense,
    })
  }
  journal(`Ecartes : ${sansDetail} sans libelle FR, ${sansArticle} sans article mesure, ${ebauche} ebauches`)

  // Triees par notoriete decroissante : le fichier se lit de haut en bas.
  cartes.sort((a, b) => b.langues - a.langues || b.vues - a.vues || a.id.localeCompare(b.id))
  const gardees = cartes.slice(0, cible)

  const json = JSON.stringify({ genere: new Date().toISOString(), cartes: gardees })
  writeFileSync(new URL('characters.json', SORTIE), json, 'utf8')
  writeFileSync(new URL('stats-summary.txt', SORTIE), resume(gardees), 'utf8')

  journal(`Ecrit ${gardees.length} cartes -- ${(json.length / 1024).toFixed(0)} Ko`)
  journal(`Fini en ${((Date.now() - debut) / 1000 / 60).toFixed(1)} min`)
}

await main()

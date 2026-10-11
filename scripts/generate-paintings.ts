/**
 * LE PIPELINE DES PEINTURES : Wikidata + Wikipedia -> public/data/paintings.json
 *
 * `npm run peintures`. Hors du build Vite : lance par `node`, qui execute
 * TypeScript tel quel.
 *
 * **AUCUNE CARTE N'EST ECRITE EN DUR**, et c'est la contrainte qui porte le
 * mode : enrichir le jeu ne demande pas d'ecrire du code, seulement de
 * relancer ce script.
 *
 * ------------------------------------------------------------------------
 * LA PORTE D'ENTREE : « est-ce une peinture ? », et c'est une HIERARCHIE
 * ------------------------------------------------------------------------
 *
 * `P31/P279* Q3305213` — la classe `peinture` ou n'importe laquelle de ses
 * sous-classes. **Mesure : 9 797 oeuvres distinctes, contre 9 395 avec la seule
 * classe `peinture`.** Les 402 recuperees sont les fresques, les triptyques,
 * les retables, les aquarelles — *et sans elles on perdrait La Creation
 * d'Adam, L'Ecole d'Athenes et Le Jugement dernier, qui sont rangees sous
 * `fresque`.* Verifie : les sculptures restent dehors.
 *
 * Trois filtres, et les trois sont de Keko : **une page en francais, une image
 * libre, une date de creation.** *L'approximation ne sert a rien* — mesure, les
 * quatre proprietes d'approximation (`P1319`, `P1326`, `P2031`, `P585`)
 * n'ajoutent que DEUX oeuvres : une peinture connue a presque toujours une date
 * rangee dans le champ normal, meme avec une precision au siecle.
 *
 * ------------------------------------------------------------------------
 * LA FORMULE DE NOTORIETE : langues x3 + taille d'article + declarations
 * ------------------------------------------------------------------------
 *
 * **Mesuree sur un echantillon de 644 oeuvres**, 585 avec tous les signaux.
 *
 * *La decouverte qui renverse l'intuition* : le NOMBRE DE LANGUES predit les
 * vues mondiales **mieux que les vues francaises** — 0,899 contre 0,729, le
 * francais ne pesant que 17 % du total. **C'est l'inverse du mode
 * personnages**, ou les langues avaient ete mises a poids zero parce qu'« un
 * botaniste du XIXe a cent cinquante Wikipedia creees par bot et personne ne
 * les lit ». *Il n'y a pas de bots qui ecrivent des articles de peintures.*
 *
 * **Mais les langues seules ne peuvent pas etre la formule** : 56 valeurs
 * distinctes sur 585, un paquet de CENT oeuvres indiscernables, un cran
 * d'echelle vide — et **46 % du pool tient sur trois valeurs** (1, 2 ou 3
 * langues). Dans la queue, elles ne distinguent rien.
 *
 * | formule | valeurs distinctes | plus gros paquet | crans vides |
 * |---|---|---|---|
 * | langues seules | 56 | **100** | **1** |
 * | langues + vues (couteuse) | 496 | 4 | 0 |
 * | **langues x3 + taille + declarations** | **569** | 3 | 0 |
 *
 * **Elle est STABLE, et c'est le critere qui compte** — *une formule qu'un
 * signal gouverne seul n'est pas une formule, c'est ce signal* : en retirant
 * les langues le classement change de 0,883, en retirant la taille de 0,983,
 * en retirant les declarations de 0,987. **Les langues font le haut, les deux
 * autres departagent la queue.**
 *
 * **Et elle vaut la formule couteuse** : accord de 0,956 avec « langues + vues
 * multilingues ». *Les vues n'apportent que 0,04 et coutent des heures* — une
 * collecte sur quinze langues a cale a six en vingt-cinq minutes,
 * rate-limitee.
 *
 * *Deux signaux ecartes, et la mesure dit pourquoi* :
 * - **la notoriete du PEINTRE** (correlation 0,52, donc un vrai demi-axe) :
 *   ajoutee, elle fait remonter « Sainte Anne, la Vierge et l'Enfant Jesus » —
 *   un carton de Vinci — en 8e position. *Un grand maitre ne rend pas celebre
 *   chacune de ses oeuvres.*
 * - **le MUSEE** : correle a 0,18 avec tout le reste, donc le plus independant
 *   de tous les signaux, et pourtant inutilisable — *il mesure le prestige de
 *   l'institution, pas la notoriete de l'oeuvre.* Une toile obscure peut etre
 *   au Louvre. Il fait un bon rayon de collection, pas un terme de formule.
 */

import { writeFileSync } from 'node:fs'
import { dors, journal, option, paquets, json as getJson } from './outils.ts'
import { parTranches, qid } from './sparql.ts'
import { annee, vignetteCommons } from './commons.ts'
// LE SIECLE SE DEMANDE AUX REGLES, il ne se recalcule pas ici. *Deux endroits
// qui decrivent le meme calcul se desaccordent au premier reglage* — et je
// viens de le prouver en corrigeant un seul des deux : le cas « avant notre
// ere » etait decale d'un cran. `logic/` est PUR, donc un script hors build
// peut l'importer sans rien emporter du navigateur.
import { siecleDe } from '../src/logic/paintings/types.ts'

// -------------------------------------------------------------------- Reglages

/**
 * LE SEUIL DE NOTORIETE, en nombre de langues.
 *
 * **Il est NECESSAIRE, et la mesure le dit** : le pool entier mesure
 * l'exhaustivite du catalogage, pas la notoriete. Le 3e peintre le plus
 * present y est **Francois-Alfred Delobbe** (207 oeuvres), un academique mineur
 * dont Wikipedia en francais a catalogue toute la production. Il disparait des
 * 5 langues.
 *
 * | seuil | oeuvres | les premiers peintres | les 25 premiers portent |
 * |---|---|---|---|
 * | tout | 9 797 | Goya, Matisse, **Delobbe**, Renoir | 34 % |
 * | **>= 7** | **2 929** | Raphael, Goya, Titien, Rembrandt, Van Gogh | 49 % |
 * | >= 20 | 344 | Raphael, Caravage, Van Gogh, Vermeer, Vinci | **75 %** |
 *
 * *Trop haut, le pool se concentre* — a 20 langues cent peintres se partagent
 * tout, et l'axe du peintre perd sa variete. **7 est le point d'equilibre**, et
 * il tombe sur la taille d'un catalogue de jeu.
 */
const SEUIL_LANGUES = Number(option('seuil') ?? 7)

/**
 * LES POIDS DE LA FORMULE — voir l'en-tete du fichier pour la mesure.
 *
 * Le poids 3 des langues est le bon compromis, mesure : a x1 l'accord avec les
 * langues seules tombe a 0,902 (la taille commence a peser sur le haut), a x6
 * on ne gagne plus rien (0,989 contre 0,971).
 */
const POIDS = { langues: 3, taille: 1, declarations: 1 } as const

/**
 * LA PYRAMIDE DES RARETES, en parts CUMULEES du catalogue.
 *
 * **Le decoupage est par QUANTILES, pas par tranches de valeur** : c'est la
 * regle du mode personnages — *dix groupes de meme taille donnent des crans
 * habites quelle que soit la forme de la mesure*, et un quantile preserve
 * l'ordre, donc toutes les correlations mesurees restent vraies.
 *
 * Les parts reprennent celles des deux autres modes (69 / 20 / 8 / 2,5 %) :
 * *un changement a la fois* — la porte d'entree change, la distribution de
 * rarete non.
 */
const PYRAMIDE = [
  { rarete: 'commun', jusqu: 0.692 },
  { rarete: 'rare', jusqu: 0.892 },
  { rarete: 'epique', jusqu: 0.975 },
  { rarete: 'legendaire', jusqu: 1 },
] as const

const SORTIE = new URL(`../public/data/${option('sortie') ?? 'paintings'}.json`, import.meta.url)

// ----------------------------------------------------------------- Decouverte

/** Le socle de toute requete : ce qui FAIT une peinture du pool. */
const SOCLE = `?a schema:about ?o ; schema:isPartOf <https://fr.wikipedia.org/> .
  ?o wdt:P31/wdt:P279* wd:Q3305213 ; wdt:P18 ?img ; wdt:P571 ?d .`

interface Brute {
  id: string
  langues: number
  declarations: number
  identifiants: number
  titre: string
  annee: number
  image: string
  peintre: string | null
  peintreId: string | null
  musee: string | null
  genre: string | null
  taille: number
  vues: number
}

/**
 * LES QUATRE ASPECTS SE DEMANDENT SEPAREMENT, et chacun par tranches.
 *
 * *Le poids des champs decide, pas le nombre de lignes* : une requete qui
 * ramenerait l'identite, le peintre, le musee et le genre d'un coup porterait
 * quatre `OPTIONAL` et tronquerait. Separees, chacune passe — et `parTranches`
 * redecoupe toute tranche qui coupe quand meme.
 */
async function decouvrir(): Promise<Map<string, Brute>> {
  journal('Identite (langues, declarations, identifiants, titre, date, image)')
  const identite = await parTranches(
    'peint_id',
    (f) => `SELECT ?o ?sl ?st ?ids ?t ?d ?img WHERE {
  ${SOCLE}
  ?a schema:name ?t .
  ?o wikibase:statements ?st ; wikibase:identifiers ?ids .
  ${f} }`,
    7,
    [1, 2, 3, 4, 5, 7, 10, 15, 25, Infinity],
  )

  const par = new Map<string, Brute>()
  for (const l of identite) {
    const a = annee(l[5])
    const img = vignetteCommons(l[6])
    if (a === null || img === null) continue
    const id = qid(l[0]!)
    // Une oeuvre a parfois DEUX dates ou DEUX images : on garde la premiere
    // vue, puisque le choix n'a pas de bonne reponse et qu'il faut en faire un.
    if (par.has(id)) continue
    par.set(id, {
      id,
      langues: Number(l[1]),
      declarations: Number(l[2]),
      identifiants: Number(l[3]),
      titre: l[4]!,
      annee: a,
      image: img,
      peintre: null,
      peintreId: null,
      musee: null,
      genre: null,
      taille: 0,
      vues: 0,
    })
  }
  journal(`  ${par.size} peintures distinctes`)

  journal('Peintre (P170)')
  for (const l of await parTranches(
    'peint_auteur',
    (f) => `SELECT ?o ?sl ?p ?pl WHERE {
  ${SOCLE}
  ?o wdt:P170 ?p . ?p rdfs:label ?pl . FILTER(LANG(?pl) = "fr")
  ${f} }`,
    4,
  )) {
    const b = par.get(qid(l[0]!))
    if (b !== undefined && b.peintre === null) {
      b.peintreId = qid(l[2]!)
      b.peintre = l[3]!
    }
  }

  journal('Musee (P276)')
  for (const l of await parTranches(
    'peint_musee',
    (f) => `SELECT ?o ?sl ?ml WHERE {
  ${SOCLE}
  ?o wdt:P276 ?m . ?m rdfs:label ?ml . FILTER(LANG(?ml) = "fr")
  ${f} }`,
    3,
  )) {
    const b = par.get(qid(l[0]!))
    if (b !== undefined && b.musee === null) b.musee = l[2]!
  }

  journal('Genre (P136)')
  for (const l of await parTranches(
    'peint_genre',
    (f) => `SELECT ?o ?sl ?gl WHERE {
  ${SOCLE}
  ?o wdt:P136 ?g . ?g rdfs:label ?gl . FILTER(LANG(?gl) = "fr")
  ${f} }`,
    3,
  )) {
    const b = par.get(qid(l[0]!))
    if (b !== undefined && b.genre === null) b.genre = l[2]!
  }

  return par
}

// ------------------------------------------------------------- Wikipedia FR

interface PageWp {
  title?: string
  length?: number
  missing?: string
  pageviews?: Record<string, number | null>
}

interface ReponseWp {
  query?: {
    pages?: Record<string, PageWp>
    normalized?: { from: string; to: string }[]
    redirects?: { from: string; to: string }[]
  }
  continue?: Record<string, string>
}

/**
 * LA TAILLE ET LES VUES DES ARTICLES, et il y a TROIS pieges.
 *
 * 1. **`prop=pageviews` EST PAGINE** : l'API ne traite qu'une partie des titres
 *    par appel et rend `continue: { pvipcontinue: ... }` pour dire ou
 *    reprendre. *Rien d'autre ne le signale* — les pages rendues sont bien
 *    formees, celles qui n'ont pas ete traitees n'ont simplement pas le champ.
 *    ***Une reponse qui porte un `continue` n'est pas une reponse, c'est sa
 *    premiere page.***
 * 2. **LE CHAMP PEUT ETRE LA ET NE RIEN DIRE** : quand le service echoue, il
 *    rend trente `null`. *On ne verifie pas qu'un champ existe, on verifie
 *    qu'il porte un NOMBRE.*
 * 3. **`redirects=1`, ET IL LE FAUT** : les vues comptent le titre DEMANDE, et
 *    Wikidata pointe parfois vers un titre devenu une redirection. Mesure :
 *    sans lui, « La Nuit etoilee » rendait 31 octets — le poids d'un
 *    `#REDIRECT`. On remonte `normalized` puis `redirects`.
 */
async function mesurerArticles(titres: readonly string[]): Promise<Map<string, PageWp>> {
  const out = new Map<string, PageWp>()
  const alias = new Map<string, string>()
  const lots = paquets(titres, 50)
  let fait = 0
  for (const lot of lots) {
    let suite: Record<string, string> = {}
    for (let tour = 0; tour < 12; tour++) {
      const p = new URLSearchParams({
        format: 'json',
        action: 'query',
        prop: 'info|pageviews',
        pvipdays: '60',
        redirects: '1',
        titles: lot.join('|'),
        ...suite,
      })
      const r = await getJson<ReponseWp>(
        `wp_art_${fait}_${tour}`,
        `https://fr.wikipedia.org/w/api.php?${p.toString()}`,
        { pause: 250 },
      )
      if (r === null) break
      for (const x of r.query?.normalized ?? []) alias.set(x.from, x.to)
      for (const x of r.query?.redirects ?? []) alias.set(x.from, x.to)
      for (const pg of Object.values(r.query?.pages ?? {})) {
        if (pg.title === undefined || pg.missing !== undefined) continue
        const e = out.get(pg.title) ?? {}
        if (pg.length !== undefined) e.length = pg.length
        const pv = pg.pageviews
        if (pv !== undefined && pv !== null) {
          const v = Object.values(pv).filter((x): x is number => typeof x === 'number')
          if (v.length > 0) {
            e.pageviews = { ...(e.pageviews ?? {}), ...pv }
            e.length = e.length ?? pg.length
          }
        }
        out.set(pg.title, e)
      }
      suite = r.continue ?? {}
      if (Object.keys(suite).length === 0) break
      await dors(200)
    }
    fait += lot.length
    if (fait % 1000 < 50) journal(`  ${fait}/${titres.length}`)
  }
  // Chaque titre demande recoit la mesure de son article FINAL.
  const resolu = new Map<string, PageWp>()
  for (const t of titres) {
    const f = alias.get(t) ?? t
    const m = out.get(f)
    if (m !== undefined) resolu.set(t, m)
  }
  return resolu
}

// ------------------------------------------------------------------- Formule

/**
 * LES RANGS, ex aequo partages.
 *
 * *Les signaux ne sont pas sur la meme echelle* — 146 langues contre 200 000
 * octets d'article — donc une moyenne brute donnerait tout le poids au plus
 * grand. Le rang les met d'accord sans supposer de forme a leur distribution.
 */
function rangsNormalises(valeurs: readonly number[]): number[] {
  const ordre = [...valeurs.keys()].sort((a, b) => valeurs[a]! - valeurs[b]!)
  const r = new Array<number>(valeurs.length).fill(0)
  let i = 0
  while (i < ordre.length) {
    let j = i
    while (j + 1 < ordre.length && valeurs[ordre[j + 1]!] === valeurs[ordre[i]!]) j++
    const m = (i + j) / 2
    for (let k = i; k <= j; k++) r[ordre[k]!] = m
    i = j + 1
  }
  const max = Math.max(1, valeurs.length - 1)
  return r.map((x) => x / max)
}

/** Le nom, desambiguisation retiree. */
function nomDeLOeuvre(titre: string): string {
  const sans = titre.replace(/\s*\([^()]*\)\s*$/, '').trim()
  // *Ce qui precede la parenthese EST le nom* — sauf si elle est tout le titre.
  return sans === '' ? titre : sans
}

// ---------------------------------------------------------------------- Main

async function principal(): Promise<void> {
  const debut = Date.now()
  const brutes = await decouvrir()

  journal(`Articles francais : taille et vues (${brutes.size} titres)`)
  const liste = [...brutes.values()]
  const mesures = await mesurerArticles(liste.map((b) => b.titre))
  let sansTaille = 0
  for (const b of liste) {
    const m = mesures.get(b.titre)
    if (m?.length === undefined) {
      sansTaille++
      continue
    }
    b.taille = m.length
    // UN CHAMP PRESENT PEUT ETRE PLEIN DE `null` : on ne somme que des NOMBRES.
    b.vues = Object.values(m.pageviews ?? {}).reduce<number>(
      (s, v) => s + (typeof v === 'number' ? v : 0),
      0,
    )
  }
  journal(`  ${sansTaille} sans taille d'article mesuree`)

  // LE SCORE : les trois signaux en rangs normalises, melanges aux poids
  // mesures. *On calcule sur TOUT le pool*, puis on coupe — sinon le rang
  // d'une oeuvre dependrait du seuil, et changer le seuil changerait les
  // raretes de tout le monde.
  const rl = rangsNormalises(liste.map((b) => b.langues))
  const rt = rangsNormalises(liste.map((b) => b.taille))
  const rd = rangsNormalises(liste.map((b) => b.declarations))
  const total = POIDS.langues + POIDS.taille + POIDS.declarations
  const melange = liste.map(
    (_, i) => (POIDS.langues * rl[i]! + POIDS.taille * rt[i]! + POIDS.declarations * rd[i]!) / total,
  )
  // Le score publie est le RANG du melange : *une valeur de 0 a 1 se relit et
  // se recoupe sans retelecharger quoi que ce soit*, et c'est la purete de
  // `logic/` qui rend ce qu'elle coute.
  const score = rangsNormalises(melange)

  const retenues = liste
    .map((b, i) => ({ b, score: score[i]! }))
    .filter((x) => x.b.langues >= SEUIL_LANGUES && x.b.taille > 0)
    .sort((a, b) => b.score - a.score)

  // LA RARETE SE DECOUPE SUR LES RETENUES, par quantiles.
  const cartes = retenues.map((x, i) => {
    const part = 1 - i / Math.max(1, retenues.length)
    const cran = PYRAMIDE.find((p) => part <= p.jusqu) ?? PYRAMIDE[PYRAMIDE.length - 1]!
    return {
      id: x.b.id,
      nom: nomDeLOeuvre(x.b.titre),
      peintre: x.b.peintre,
      peintre_id: x.b.peintreId,
      annee: x.b.annee,
      siecle: siecleDe(x.b.annee),
      genre: x.b.genre,
      musee: x.b.musee,
      score: Math.round(x.score * 10000) / 10000,
      rarete: cran.rarete,
      langues: x.b.langues,
      image: x.b.image,
      article_fr: x.b.titre,
      vues: x.b.vues,
    }
  })

  writeFileSync(
    SORTIE,
    JSON.stringify({ genere: new Date().toISOString(), cartes }, null, 0),
    'utf8',
  )
  journal(`${cartes.length} cartes ecrites dans ${SORTIE.pathname}`)

  // LE RESUME : c'est lui qui permet de juger un reglage sans ouvrir le jeu.
  const parRarete = new Map<string, number>()
  for (const c of cartes) parRarete.set(c.rarete, (parRarete.get(c.rarete) ?? 0) + 1)
  journal(
    'Raretes : ' +
      PYRAMIDE.map(
        (p) =>
          `${p.rarete} ${parRarete.get(p.rarete) ?? 0} (${Math.round((100 * (parRarete.get(p.rarete) ?? 0)) / Math.max(1, cartes.length))} %)`,
      ).join(' · '),
  )
  journal('Le haut du catalogue :')
  for (const c of cartes.slice(0, 15)) {
    journal(`  ${String(c.langues).padStart(3)} lg  ${c.nom}${c.peintre === null ? '' : ` — ${c.peintre}`}`)
  }
  const sansPeintre = cartes.filter((c) => c.peintre === null).length
  const sansGenre = cartes.filter((c) => c.genre === null).length
  const sansMusee = cartes.filter((c) => c.musee === null).length
  journal(
    `Couverture : peintre ${Math.round((100 * (cartes.length - sansPeintre)) / Math.max(1, cartes.length))} %` +
      ` · genre ${Math.round((100 * (cartes.length - sansGenre)) / Math.max(1, cartes.length))} %` +
      ` · musee ${Math.round((100 * (cartes.length - sansMusee)) / Math.max(1, cartes.length))} %`,
  )
  journal(`Fini en ${((Date.now() - debut) / 60000).toFixed(1)} min`)
}

await principal()

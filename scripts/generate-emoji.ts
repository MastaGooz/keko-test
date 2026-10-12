/**
 * LE CATALOGUE DES EMOJI — `npm run emoji`.
 *
 * Demande par Keko : « on utilise des emoji : noto color emoji et noto animated
 * emoji ». **Une carte est un emoji**, et tout vient de deux sources
 * canoniques :
 *
 * - **Unicode** (`emoji-test.txt`) : le caractere, son groupe et sa VERSION
 *   d'introduction -- un seul fichier de 621 Ko ;
 * - **CLDR** : son nom francais et ses mots-cles, en deux fichiers (les
 *   drapeaux vivent dans `annotationsDerived`, pas dans `annotations`).
 *
 * Plus un test par emoji sur le CDN de Google, pour savoir lesquels ont une
 * version ANIMEE.
 *
 * **L'USER-AGENT NE PORTE PAS D'ADRESSE ICI.** Celui de `outils.ts` en a une
 * parce que la politique de Wikimedia demande un contact ; *Unicode, GitHub et
 * gstatic ne le demandent pas*, et on n'envoie pas l'adresse de quelqu'un a un
 * service qui ne l'a pas reclamee.
 */
import { writeFileSync, mkdirSync } from 'node:fs'
import { cache, journal, option } from './outils.ts'
import { cransParGroupe, PYRAMIDE_QUATRE } from '../src/logic/quantiles.ts'
import {
  GROUPES_EMOJI,
  RARETES_EMOJI,
  type CarteEmoji,
  type GroupeEmoji,
  type RareteEmoji,
} from '../src/logic/emoji/types.ts'

const UA_NEUTRE = 'keko-test/0.1 (jeu de cartes, usage personnel)'
const UNICODE = 'https://unicode.org/Public/emoji/latest/emoji-test.txt'
const CLDR = 'https://raw.githubusercontent.com/unicode-org/cldr-json/main/cldr-json'
const ANIME = 'https://fonts.gstatic.com/s/e/notoemoji/latest'
const SORTIE = new URL('../public/data/', import.meta.url)

/** Les variantes de couleur de peau : c'est le MEME emoji, pas une carte de plus. */
const PEAU = /[\u{1F3FB}-\u{1F3FF}]/u

/**
 * LE GROUPE UNICODE VERS LE NOTRE. `Component` n'a pas d'entree : *ses membres
 * ne sont pas des emoji, ce sont des morceaux de sequence* (une couleur de
 * peau, un cheveu roux), et ils n'ont rien a faire sur une carte.
 */
const GROUPE: Readonly<Record<string, GroupeEmoji>> = {
  'Smileys & Emotion': 'visages',
  'People & Body': 'gens',
  'Animals & Nature': 'animaux',
  'Food & Drink': 'nourriture',
  'Travel & Places': 'lieux',
  Activities: 'activites',
  Objects: 'objets',
  Symbols: 'symboles',
  Flags: 'drapeaux',
}

/**
 * L'ANNEE DE CHAQUE VERSION D'EMOJI.
 *
 * *C'est elle qui porte la notoriete*, faute de mieux : voir `notoriete`. Les
 * numeros de version ne sont PAS une suite reguliere -- E0.6, E0.7, puis E1.0 a
 * E5.0, puis un saut a E11.0 -- donc une table vaut mieux qu'un calcul.
 */
const ANNEE_DE_VERSION: Readonly<Record<string, number>> = {
  '0.6': 2010,
  '0.7': 2010,
  '1.0': 2015,
  '2.0': 2015,
  '3.0': 2016,
  '4.0': 2016,
  '5.0': 2017,
  '11.0': 2018,
  '12.0': 2019,
  '12.1': 2019,
  '13.0': 2020,
  '13.1': 2021,
  '14.0': 2021,
  '15.0': 2022,
  '15.1': 2023,
  '16.0': 2024,
  '17.0': 2025,
  '18.0': 2026,
}

interface Brut {
  id: string
  emoji: string
  nomEn: string
  groupe: GroupeEmoji
  version: string
  /** Le rang dans le fichier Unicode : il sert de DEPARTAGE, voir `notoriete`. */
  rang: number
}

async function texte(cle: string, url: string): Promise<string> {
  return cache(`emoji-${cle}`, url, async () => {
    const r = await fetch(url, {
      headers: { 'User-Agent': UA_NEUTRE },
      signal: AbortSignal.timeout(60_000),
    })
    if (!r.ok) throw new Error(`${url} : HTTP ${r.status}`)
    const t = await r.text()
    journal(`  ${cle} : ${(t.length / 1024).toFixed(0)} Ko`)
    return t
  })
}

/** La liste canonique, variantes de peau et composants ecartes. */
function lireUnicode(txt: string): Brut[] {
  const out: Brut[] = []
  let groupe = ''
  for (const ligne of txt.split('\n')) {
    if (ligne.startsWith('# group:')) {
      groupe = ligne.slice(9).trim()
      continue
    }
    if (!ligne.includes('; fully-qualified')) continue
    const m = /^([0-9A-F ]+);\s*fully-qualified\s*#\s*(\S+)\s+E(\d+\.\d+)\s+(.+)$/.exec(ligne.trim())
    if (!m) continue
    const g = GROUPE[groupe]
    if (g === undefined) continue
    const emoji = m[2]!
    if (PEAU.test(emoji)) continue
    out.push({
      id: m[1]!.trim().toLowerCase().replace(/ +/g, '-'),
      emoji,
      nomEn: m[4]!.trim(),
      groupe: g,
      version: m[3]!,
      rang: out.length,
    })
  }
  return out
}

/**
 * LES NOMS FRANCAIS, et il faut les DEUX fichiers CLDR.
 *
 * *Les drapeaux et les sequences derivees vivent dans `annotationsDerived`* --
 * mesure : `annotations` en porte 1 966 et ignore le drapeau francais. **Et la
 * cle peut etre ecrite sans le selecteur de variante** : le coeur rouge y
 * figure sans lui, donc on essaie les deux formes.
 */
async function nomsFrancais(): Promise<Map<string, { nom: string; mots: string[] }>> {
  const out = new Map<string, { nom: string; mots: string[] }>()
  const fichiers = [
    ['cldr', 'cldr-annotations-full/annotations/fr/annotations.json'],
    ['cldr-derive', 'cldr-annotations-derived-full/annotationsDerived/fr/annotations.json'],
  ] as const
  for (const [cle, chemin] of fichiers) {
    const brut = JSON.parse(await texte(cle, `${CLDR}/${chemin}`)) as {
      annotations?: { annotations?: Record<string, { tts?: string[]; default?: string[] }> }
      annotationsDerived?: { annotations?: Record<string, { tts?: string[]; default?: string[] }> }
    }
    const a = brut.annotationsDerived?.annotations ?? brut.annotations?.annotations ?? {}
    for (const [k, v] of Object.entries(a)) {
      const nom = v.tts?.[0]
      if (nom === undefined) continue
      // *Le second fichier ne doit pas effacer le premier* : `annotations`
      // porte les noms de base, `annotationsDerived` ce qui en decoule.
      if (!out.has(k)) out.set(k, { nom, mots: v.default ?? [] })
    }
  }
  return out
}

/**
 * L'URL DU CDN SEPARE LES POINTS DE CODE PAR DES UNDERSCORES, pas par des
 * tirets.
 *
 * ***Le format d'un identifiant n'est pas celui d'une URL***, et ca a coute un
 * catalogue entier : l'id de la carte est en tirets -- c'est notre convention,
 * lisible -- donc **tout emoji a plusieurs points de code etait declare non
 * anime**. Le coeur rouge (`2764 fe0f`) sortait statique alors qu'il est le
 * deuxieme emoji le plus employe au monde, et *rien ne le signalait* : une URL
 * fausse rend 404, et un 404 se lit ici comme « pas de version animee ».
 */
function urlAnimee(id: string): string {
  return `${ANIME}/${id.replace(/-/g, '_')}/lottie.json`
}

/**
 * QUELS EMOJI GOOGLE A ANIMES — un test par emoji, dix de front.
 *
 * Mesure sur un echantillon : **34 % du catalogue**, soit bien plus que la
 * « centaine » annoncee partout -- *il fallait le compter plutot que le croire.*
 *
 * **On met en cache la REPONSE, pas la requete** : c'est un `HEAD`, donc il n'y
 * a rien a garder qu'une liste d'identifiants.
 */
async function animes(ids: readonly string[]): Promise<Set<string>> {
  // **LE CORPS DU CACHE PORTE LES URLS, pas les identifiants.** *Un cache doit
  // dependre de ce qu'on demande* : avec les seuls ids, corriger le format de
  // l'URL n'aurait rien reteste et l'ancien resultat serait resservi -- c'est
  // exactement le piege qui a failli masquer le defaut des underscores.
  const demande = ids.map(urlAnimee).join(' ')
  const brut = await cache(`emoji-animes-${ids.length}`, demande, async () => {
    journal(`Versions animees : ${ids.length} tests`)
    const oui: string[] = []
    const file = [...ids]
    let fait = 0
    const ouvrier = async () => {
      for (;;) {
        const id = file.shift()
        if (id === undefined) return
        try {
          const r = await fetch(urlAnimee(id), {
            method: 'HEAD',
            headers: { 'User-Agent': UA_NEUTRE },
            signal: AbortSignal.timeout(20_000),
          })
          if (r.ok) oui.push(id)
        } catch {
          // *Un test perdu rend l'emoji NON anime* : une absence de mesure
          // n'est pas une mesure, et le pire cas est une carte statique.
        }
        fait++
        if (fait % 400 === 0) journal(`  ${fait}/${ids.length}`)
      }
    }
    await Promise.all(Array.from({ length: 10 }, ouvrier))
    journal(`  ${oui.length} animes (${((100 * oui.length) / ids.length).toFixed(0)} %)`)
    return oui.join(',')
  })
  return new Set(brut.split(',').filter(Boolean))
}

/**
 * LA NOTORIETE D'UN EMOJI EST SON ANCIENNETE, ET C'EST UN PIS-ALLER ASSUME.
 *
 * **Aucun fichier de frequence complet n'existe** : Unicode publie un top 100
 * en page web et rien de telechargeable (`emoji-frequency.txt` rend 404).
 * *Ce qui reste est defendable* -- un emoji de 2010 est connu de tous, un de
 * 2025 de presque personne -- mais ***ce n'est pas une mesure d'usage, et il
 * faut le savoir avant de regler quoi que ce soit dessus.***
 *
 * Deux departages, parce que **719 emoji sont en E0.6** et qu'un quantile ne
 * peut pas couper dans un plateau de 37 % du catalogue :
 *
 * - **l'existence d'une version ANIMEE** : Google n'a pas anime au hasard, donc
 *   c'est un signal d'usage -- le seul qu'on ait ;
 * - **le rang dans le fichier Unicode**, qui va du plus central au plus
 *   specifique dans chaque sous-groupe. *C'est faible, mais c'est un ordre*, et
 *   un quantile n'a besoin de rien d'autre.
 */
function notoriete(e: Brut, anime: boolean, total: number): number {
  const annee = ANNEE_DE_VERSION[e.version] ?? 2026
  // Plus c'est vieux, plus c'est notoire : on compte les annees depuis 2030.
  return (2030 - annee) * 1_000_000 + (anime ? 500_000 : 0) + (total - e.rang)
}

/** LE RESUME : c'est lui qui permet de juger un reglage sans ouvrir le jeu. */
function resume(cartes: readonly CarteEmoji[]): string {
  const l: string[] = [
    'CATALOGUE DES EMOJI',
    `engendre le ${new Date().toISOString().slice(0, 19).replace('T', ' ')} UTC`,
    '',
  ]
  l.push(`${cartes.length} cartes, dont ${cartes.filter((c) => c.anime).length} animees`)
  l.push('')
  l.push('LA RARETE DANS CHAQUE GROUPE')
  l.push('----------------------------')
  l.push(
    `  ${'groupe'.padEnd(12)} ${'n'.padStart(5)}  ` +
      RARETES_EMOJI.map((r) => r.slice(0, 6).padStart(10)).join(''),
  )
  for (const g of GROUPES_EMOJI) {
    const gr = cartes.filter((c) => c.groupe === g)
    if (gr.length === 0) continue
    l.push(
      `  ${g.padEnd(12)} ${String(gr.length).padStart(5)}  ` +
        RARETES_EMOJI.map((r) => {
          const n = gr.filter((c) => c.rarete === r).length
          return `${n} (${((100 * n) / gr.length).toFixed(0)}%)`.padStart(10)
        }).join(''),
    )
  }
  l.push('')
  l.push('PAR ANNEE')
  l.push('---------')
  for (const a of [...new Set(cartes.map((c) => c.annee))].sort((x, y) => x - y)) {
    const n = cartes.filter((c) => c.annee === a).length
    l.push(`  ${a}  ${String(n).padStart(5)}  ${'#'.repeat(Math.round((40 * n) / cartes.length))}`)
  }
  l.push('')
  l.push('LE HAUT DE CHAQUE GROUPE')
  l.push('------------------------')
  for (const g of GROUPES_EMOJI) {
    const gr = cartes.filter((c) => c.groupe === g).slice(0, 8)
    if (gr.length === 0) continue
    l.push(`  ${g.padEnd(12)} ${gr.map((c) => `${c.emoji} ${c.nom}`).join(' · ')}`)
  }
  l.push('')
  l.push('UN EXEMPLE PAR RARETE')
  l.push('---------------------')
  for (const r of RARETES_EMOJI) {
    const gr = cartes.filter((c) => c.rarete === r)
    if (gr.length === 0) {
      l.push(`  ${r.padEnd(12)} aucune carte -- A REVOIR`)
      continue
    }
    const m = gr[Math.floor(gr.length / 2)]!
    l.push(`  ${r.padEnd(12)} ${m.emoji} ${m.nom} (${m.groupe}, ${m.annee}${m.anime ? ', anime' : ''})`)
  }
  return l.join('\n') + '\n'
}

async function main(): Promise<void> {
  const debut = Date.now()
  mkdirSync(SORTIE, { recursive: true })
  journal('Catalogue des emoji')

  const bruts = lireUnicode(await texte('unicode', UNICODE))
  journal(`${bruts.length} emoji (variantes de peau et composants ecartes)`)

  const noms = await nomsFrancais()
  const anime = await animes(bruts.map((b) => b.id))

  let sansNom = 0
  const sans = bruts.map((b) => {
    // LE SELECTEUR DE VARIANTE EST FACULTATIF DANS LA CLE CLDR : on essaie la
    // sequence complete, puis sans lui.
    const fr = noms.get(b.emoji) ?? noms.get(b.emoji.replace(/️/g, ''))
    if (fr === undefined) sansNom++
    const estAnime = anime.has(b.id)
    return {
      id: b.id,
      emoji: b.emoji,
      // *Un nom anglais vaut mieux qu'une carte en moins* : la regle du repli
      // anglais des personnages, reprise ici.
      nom: fr?.nom ?? b.nomEn,
      groupe: b.groupe,
      mots: fr?.mots ?? [],
      version: b.version,
      annee: ANNEE_DE_VERSION[b.version] ?? 2026,
      anime: estAnime,
      notoriete: notoriete(b, estAnime, bruts.length),
    }
  })
  journal(`${sansNom} sans nom francais (nom anglais garde)`)

  // Triees par notoriete decroissante : le fichier se lit de haut en bas.
  sans.sort((a, b) => b.notoriete - a.notoriete || a.id.localeCompare(b.id))

  // LA RARETE SE DECOUPE DANS CHAQUE GROUPE, et c'est la regle que Keko a
  // tranchee sur les personnages. *Ici elle est indispensable* : les 270
  // drapeaux sont presque tous anciens, donc a seuil global ils rafleraient
  // tout le haut de l'echelle.
  const crans = cransParGroupe(
    sans.map((c) => ({ groupe: c.groupe, valeur: c.notoriete })),
    PYRAMIDE_QUATRE,
  ) as RareteEmoji[]
  const cartes: CarteEmoji[] = sans.map(({ notoriete: _n, ...c }, i) => ({
    ...c,
    rarete: crans[i]!,
  }))

  const json = JSON.stringify({ genere: new Date().toISOString(), cartes })
  writeFileSync(new URL(`${option('sortie') ?? 'emoji'}.json`, SORTIE), json, 'utf8')
  writeFileSync(new URL('emoji-summary.txt', SORTIE), resume(cartes), 'utf8')
  journal(`Ecrit ${cartes.length} cartes -- ${(json.length / 1024).toFixed(0)} Ko`)
  journal(`Fini en ${((Date.now() - debut) / 1000).toFixed(0)} s`)
}

await main()

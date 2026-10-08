// LES BRIQUES PARTAGEES DES PIPELINES HORS BUILD.
//
// Elles sont reprises de `generate-characters.ts`, qui les garde en propre : ce
// pipeline-la vit ses derniers jours (Keko : « supprime le script personnages
// une fois le nouveau valide, pas avant »), et *toucher a un script qu'on va
// retirer pour factoriser avec celui qui le remplace ne gagne rien et risque
// quelque chose.* Le jour ou il part, ce module reste.
//
// Hors du build Vite : lance par `node`, pas couvert par `tsconfig.json`.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'

export const UA = 'keko-test/0.1 (https://github.com/MastaGooz/keko-test; mastagooz@gmail.com)'

/** Le cache des requetes : une entree par requete, jamais purge. */
const CACHE = new URL('../scripts/.cache/', import.meta.url)

export const frais = process.argv.includes('--frais')

export function journal(m: string): void {
  const t = new Date().toTimeString().slice(0, 8)
  console.log(`[${t}] ${m}`)
}

export function dors(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

export function empreinte(s: string): string {
  return createHash('sha1').update(s).digest('hex').slice(0, 12)
}

export function paquets<T>(xs: readonly T[], taille: number): T[][] {
  const p: T[][] = []
  for (let i = 0; i < xs.length; i += taille) p.push(xs.slice(i, i + taille))
  return p
}

/**
 * LE CACHE EST PAR REQUETE, PAS PAR ETAPE. C'est ce qui permet de relancer
 * apres un lot perdu sans redemander les trente qui avaient abouti.
 *
 * **IL NE RETIENT QUE LES SUCCES** (`garder`) : une reponse vide gardee
 * condamnerait le lot jusqu'au prochain `--frais`. Lecon payee deux fois, sur
 * les textures de cartes puis sur les vues de Wikipedia.
 */
export async function cache<T>(
  nom: string,
  charge: string,
  produire: () => Promise<T>,
  garder?: (v: T) => boolean,
): Promise<T> {
  if (!existsSync(CACHE)) mkdirSync(CACHE, { recursive: true })
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

/** Un GET JSON, avec reessais et pause. `null` si le lot est perdu. */
export async function json<T>(
  nom: string,
  url: string,
  { essais = 3, pause = 120 }: { essais?: number; pause?: number } = {},
): Promise<T | null> {
  return cache<T | null>(
    nom,
    url,
    async () => {
      for (let essai = 1; essai <= essais; essai++) {
        try {
          const r = await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(45_000) })
          // 404 EST UNE REPONSE, PAS UNE PANNE : l'API des vues le rend pour un
          // article qui n'a jamais ete consulte. *Le reessayer trois fois ne le
          // fera pas apparaitre.*
          if (r.status === 404) return null
          if (!r.ok) throw new Error(`HTTP ${r.status}`)
          const d = (await r.json()) as T
          await dors(pause)
          return d
        } catch (e) {
          if (essai === essais) {
            journal(`  ${nom} : abandonne (${e instanceof Error ? e.message : String(e)})`)
            return null
          }
          await dors(pause * essai * 8)
        }
      }
      return null
    },
    (v) => v !== null,
  )
}

/** La valeur d'une option `--nom=valeur`, si elle est passee. */
export function option(nom: string): string | undefined {
  const m = process.argv.find((a) => a.startsWith(`--${nom}=`))
  return m?.slice(nom.length + 3)
}

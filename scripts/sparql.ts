// INTERROGER LE QUERY SERVICE DE WIKIDATA, EN CSV ET PAR TRANCHES.
//
// Trois faits mesures portent tout ce module, et aucun ne se devine :
//
// 1. **LE FORMAT JSON DE SPARQL PESE NEUF FOIS LE CSV** sur la meme donnee --
//    il enveloppe chaque valeur dans un objet a deux champs pour dire `Q42`.
//    Mesure : 3 Mo en JSON (tronque) contre 0,32 Mo en CSV.
// 2. **LE ENDPOINT LACHE LE FLUX QU'IL A COMMENCE** : il repond, puis coupe au
//    milieu d'une ligne. En JSON ca leve un `SyntaxError` a une position
//    absurde ; **en CSV ca se lit SANS ERREUR**, puisqu'un CSV n'a pas de
//    marqueur de fin. On verifie donc l'en-tete, la FIN DU FLUX et le compte de
//    colonnes de chaque ligne.
// 3. **MIEUX VAUT TROIS PETITES REQUETES SURES QU'UNE GROSSE A RATTRAPER** :
//    un rattrapage qui coute une minute par tentative n'en est pas un. On
//    decoupe d'emblee par tranches de notoriete, et une tranche tronquee se
//    redecoupe au lieu de se reessayer -- *le redecoupage attaque la cause, le
//    reessai un symptome.*

import { cache, dors, journal } from './outils.ts'

const ENDPOINT = 'https://query.wikidata.org/sparql'

/**
 * AU-DELA DE CE NOMBRE DE LANGUES, IL N'Y A PLUS PERSONNE, et c'est ce qui
 * ferme la recursion de la tranche ouverte. Mesure : le record d'une peinture
 * est 146, celui d'un personnage 346.
 */
const PLAFOND = 600
const UA = 'keko-test/0.1 (https://github.com/MastaGooz/keko-test; mastagooz@gmail.com)'

/**
 * UN PARSEUR CSV COMPLET, et il le faut : les libellés portent des virgules
 * (« Portrait de l'artiste, dit… ») et parfois des retours à la ligne.
 */
export function lireCsv(texte: string): string[][] {
  const lignes: string[][] = []
  let champ = ''
  let ligne: string[] = []
  let cite = false
  for (let i = 0; i < texte.length; i++) {
    const c = texte[i]!
    if (cite) {
      if (c === '"') {
        if (texte[i + 1] === '"') {
          champ += '"'
          i++
        } else cite = false
      } else champ += c
    } else if (c === '"') cite = true
    else if (c === ',') {
      ligne.push(champ)
      champ = ''
    } else if (c === '\n') {
      ligne.push(champ)
      lignes.push(ligne)
      ligne = []
      champ = ''
    } else if (c !== '\r') champ += c
  }
  if (champ !== '' || ligne.length > 0) {
    ligne.push(champ)
    lignes.push(ligne)
  }
  return lignes
}

/** Le Q-id nu, depuis l'URI que SPARQL rend. */
export function qid(uri: string): string {
  const i = uri.lastIndexOf('/')
  return i < 0 ? uri : uri.slice(i + 1)
}

type Reponse = { lignes: string[][]; tronque: boolean } | null

async function brut(nom: string, requete: string, colonnes: number): Promise<Reponse> {
  return cache<Reponse>(
    nom,
    requete,
    async () => {
      const url = `${ENDPOINT}?query=${encodeURIComponent(requete)}`
      for (let essai = 1; essai <= 3; essai++) {
        try {
          const r = await fetch(url, {
            headers: { 'User-Agent': UA, Accept: 'text/csv' },
            signal: AbortSignal.timeout(300_000),
          })
          if (!r.ok) throw new Error(`HTTP ${r.status}`)
          const t = await r.text()
          if (!t.includes(',')) throw new Error(`reponse sans CSV : ${t.slice(0, 80)}`)
          // LA FIN DU FLUX EST LE SEUL INDICE D'UNE TRONCATURE.
          const tronque = !t.endsWith('\n')
          const r2 = lireCsv(t)
          const entete = r2[0]
          if (entete === undefined || entete.length !== colonnes) {
            throw new Error(`en-tete inattendu : ${JSON.stringify(entete)}`)
          }
          const corps = tronque ? r2.slice(1, -1) : r2.slice(1)
          await dors(300)
          return { lignes: corps.filter((x) => x.length === colonnes), tronque }
        } catch (e) {
          if (essai === 3) {
            journal(`  ${nom} : abandonne (${e instanceof Error ? e.message : String(e)})`)
            return null
          }
          await dors(3000 * essai)
        }
      }
      return null
    },
    // UN CACHE NE RETIENT QUE LES SUCCES : une reponse tronquee gardee
    // condamnerait la tranche jusqu'au prochain `--frais`.
    (v) => v !== null && !v.tronque,
  )
}

/**
 * Interroge en DECOUPANT par tranches de notoriété, et redécoupe ce qui
 * tronque. `gabarit` reçoit le filtre de tranche à insérer dans le `WHERE`.
 */
export async function parTranches(
  nom: string,
  gabarit: (filtre: string) => string,
  colonnes: number,
  bornes: readonly number[] = [1, 3, 6, 12, 30, Infinity],
): Promise<string[][]> {
  const tout: string[][] = []
  const aFaire: [number, number][] = []
  for (let i = 0; i + 1 < bornes.length; i++) aFaire.push([bornes[i]!, bornes[i + 1]!])

  while (aFaire.length > 0) {
    const [a, b] = aFaire.shift()!
    const filtre =
      b === Infinity
        ? `?o wikibase:sitelinks ?sl . FILTER(?sl >= ${a})`
        : `?o wikibase:sitelinks ?sl . FILTER(?sl >= ${a} && ?sl < ${b})`
    const etiquette = `${nom}_${a}_${b === Infinity ? 'plus' : b}`
    const r = await brut(etiquette, gabarit(filtre), colonnes)
    // **`terminated` EST UNE TRONCATURE, PAS UNE PANNE A PART** : c'est le
    // corps coupe pendant la lecture, la meme panne vue un cran plus tot. Un
    // lot perdu se redecoupe donc comme un lot tronque — *le redecoupage
    // attaque la cause, le reessai un symptome*, et `brut` a deja reessaye
    // trois fois pour rien.
    if (r === null || r.tronque) {
      // ON REDECOUPE AU LIEU DE REESSAYER : la reponse aurait la meme taille.
      // La tranche OUVERTE se coupe aussi, sinon la plus haute ne pourrait
      // jamais se reduire ; `PLAFOND` la ferme, parce qu'au-dela il n'y a plus
      // personne et qu'une recursion sans borne n'a pas de pire cas.
      const m = b === Infinity ? a * 3 : Math.floor((a + b) / 2)
      const divisible = b === Infinity ? a < PLAFOND : b - a > 1
      const cause = r === null ? 'perdu' : 'tronque'
      if (divisible) {
        journal(`  ${etiquette} : ${cause}, redecoupe en [${a},${m}) et [${m},${b})`)
        aFaire.unshift([a, m], [m, b])
      } else {
        const gardees = r?.lignes ?? []
        journal(`  ${etiquette} : ${cause} et indivisible (${gardees.length} lignes gardees)`)
        tout.push(...gardees)
      }
      continue
    }
    journal(`  ${etiquette} : ${r.lignes.length} lignes`)
    tout.push(...r.lignes)
  }
  return tout
}

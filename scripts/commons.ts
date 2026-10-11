// LA FABRIQUE D'URL DE VIGNETTE COMMONS.
//
// Reprise de `generate-characters.ts`, qui garde la sienne en propre : ce
// pipeline-la vit ses derniers jours, et *toucher a un script qu'on va retirer
// pour le factoriser avec celui qui le remplace ne gagne rien et risque
// quelque chose.* Le jour ou il part, ce module reste.

import { createHash } from 'node:crypto'

/**
 * LES LARGEURS NE SONT PAS LIBRES : une taille hors de la liste de Wikimedia
 * rend un **400** dont le corps dit « Use thumbnail sizes listed on… ».
 * Mesure : seules passent 120, 250, 500, 960, 1280.
 *
 * On prend 960 — *la toile d'une carte plafonne a 768 de large* et
 * l'illustration y est peinte en `contain`, donc 500 serait interpole sur la
 * carte qu'on regarde de pres. Elle pese ~250 Ko contre 2,2 Mo pour
 * l'original.
 */
const LARGEUR_VIGNETTE = 960

/** Ce que Wikimedia rend en PNG plutot que dans son format d'origine. */
const RENDUS_EN_PNG = /\.(svg|tif|tiff|djvu|pdf)$/i

/**
 * L'URL DIRECTE D'UNE VIGNETTE COMMONS — et c'est le pipeline qui la calcule,
 * pas le navigateur.
 *
 * **Wikidata rend une URL `Special:FilePath`, et elle est INUTILISABLE dans un
 * canvas.** Elle repond par une redirection 302 qui ne porte AUCUN en-tete
 * CORS : une image chargee en `crossOrigin="anonymous"` — ce qu'il faut pour
 * qu'un canvas ne soit pas tache — echoue donc a la premiere etape. *Et ca ne
 * se voit pas en la mesurant* : `fetch` suit la redirection et rend les
 * en-tetes de la reponse FINALE, qui, elle, porte bien `ACAO: *`.
 *
 * ***Une mesure prise a l'arrivee ne dit rien des etapes du chemin.***
 *
 * L'URL finale se calcule : MediaWiki range ses fichiers sous les deux
 * premiers caracteres du MD5 de leur nom, espaces changes en soulignes. On
 * l'ecrit donc ici, en https — *le catalogue sert le jeu, il ne lui laisse pas
 * une adresse a reparer*, et une page servie en https bloquerait du http.
 */
export function vignetteDuFichier(nom: string): string | null {
  const fichier = nom.replace(/ /g, '_')
  if (fichier === '') return null
  const h = createHash('md5').update(fichier).digest('hex')
  const e = encodeURIComponent(fichier)
  const sortie = RENDUS_EN_PNG.test(fichier) ? `${e}.png` : e
  // Un fichier a PAGES se vignette page par page.
  const page = /\.(djvu|pdf)$/i.test(fichier) ? 'page1-' : ''
  return `https://upload.wikimedia.org/wikipedia/commons/thumb/${h[0]!}/${h[0]!}${h[1]!}/${e}/${page}${LARGEUR_VIGNETTE}px-${sortie}`
}

/**
 * La vignette d'une URL `Special:FilePath`, celle que rend Wikidata.
 *
 * **UN NOM DE FICHIER QUI NE SE DECODE PAS NE DOIT PAS FAIRE TOMBER LE
 * PIPELINE**, et il y en a : un nom Commons peut porter un `%` LITTERAL, que
 * `decodeURIComponent` refuse (« URI malformed »). *Dans ce cas la bonne
 * lecture est le nom TEL QUEL* — s'il n'est pas une sequence d'echappement
 * valide, c'est qu'il n'en est pas une.
 */
export function vignetteCommons(url: string | undefined): string | null {
  if (!url) return null
  const apres = url.split('/Special:FilePath/')[1]
  if (apres === undefined) return null
  let nom: string
  try {
    nom = decodeURIComponent(apres)
  } catch {
    nom = apres
  }
  return vignetteDuFichier(nom)
}

/**
 * L'ANNEE D'UNE DATE WIKIDATA.
 *
 * Wikidata ecrit les dates d'avant notre ere avec un signe :
 * « -0044-03-15T00:00:00Z ». **Et le CSV du Query Service le PERD** pour les
 * dates ordinaires — « 1503-01-01T00:00:00Z » — donc le signe est optionnel.
 */
export function annee(iso: string | undefined): number | null {
  if (!iso) return null
  const m = /^(-?)(\d{1,5})-/.exec(iso)
  if (!m) return null
  const a = Number(m[2]) * (m[1] === '-' ? -1 : 1)
  return Number.isFinite(a) && a !== 0 ? a : null
}

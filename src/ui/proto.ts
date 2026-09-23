/**
 * LE PROTOTYPE DE CARTE, à la place du jeu.
 *
 * Keko reprend le dessin des cartes une couche à la fois, sur une page qui ne
 * montre que ça. Le jeu reste derrière `?jeu`.
 *
 * Trois pistes ont vécu ici — le cadre néon de Keko (`public/cadre.png`),
 * « Entaille du Néant » et « Serment de cendre », deux cartes CSS générées par
 * ChatGPT. **Keko a choisi « Serment de cendre » en full art**, et tout le
 * reste a été retiré (`git log` sait le rendre). Ce qui reste : la carte en
 * deux tailles, avec un effet court et l'effet long de référence.
 */
import './proto.css'
import './proto-cendre.css'
import { CENDRE } from './proto-cendre.ts'



/**
 * LA FIGURE PORTE LA TAILLE ET EST LE CONTENEUR DE REQUÊTE, pas la carte.
 * Piège rencontré : les `cqw` d'un élément se résolvent contre son ANCÊTRE
 * conteneur, jamais contre lui-même — posé sur la carte, `container-type`
 * laissait sa propre bordure et ses arrondis se mesurer sur le viewport
 * (1cqw = 25 px) : une pilule violette à bord de 36 px.
 */
function fig(contenu: string, etiquette: string, classes = ''): string {
  return `<figure class="proto-fig ${classes}">${contenu}<figcaption>${etiquette}</figcaption></figure>`
}

/**
 * PISTE C : « SERMENT DE CENDRE », la carte CSS générée par ChatGPT, reprise
 * telle quelle (markup et CSS générés, voir `proto-cendre.*`). Sa boîte est
 * au rapport de l'original (344/502), avec une illustration tout en CSS.
 */
function carteCendre(classes: string, etiquette: string, variante = '', markup = CENDRE_COURT): string {
  return fig(`<div class="cendre ${variante}">${markup}</div>`, etiquette, classes)
}

/**
 * PLUS DE TEXTE D'AMBIANCE, nulle part : Keko l'a fait sauter (« ça me rajoute
 * trop de taf et ça prend de la place »). Et LA TAILLE DU TEXTE S'ADAPTE À SA
 * LONGUEUR : trois crans d'après le nombre de caractères, comme les jeux du
 * genre — un effet court garde la taille d'origine, un effet complexe descend
 * d'un ou deux crans plutôt que de déborder sur le type.
 */
function cran(texte: string): 'court' | 'moyen' | 'long' {
  const n = texte.replace(/<[^>]+>/g, '').length
  return n <= 44 ? 'court' : n <= 100 ? 'moyen' : 'long'
}

/** La carte Cendre avec un effet donné (HTML), sans texte d'ambiance. */
function cendreAvec(effet: string): string {
  return CENDRE.replace(
    /<section class="cv-effect">.*?<\/section>/,
    `<section class="cv-effect ${cran(effet)}"><p>${effet}</p></section>`,
  )
}

const EFFET_COURT = 'Inflige <strong>14</strong> dégâts.<br>Applique <strong>2 Brûlures.</strong>'
const EFFET_LONG =
  'Regardez les <strong>5</strong> premières cartes de votre deck, défaussez-en ' +
  '<strong>2</strong> de votre choix, puis replacez les autres dans l’ordre de votre choix.'
const CENDRE_COURT = cendreAvec(EFFET_COURT)
const CENDRE_LONG = cendreAvec(EFFET_LONG)

export function montrerProto(racine: HTMLElement, build: string): void {
  // NE RESTE QUE LE FULL ART, la version que Keko a choisie : « on supprime
  // toutes les cartes sauf les versions full art ». Les deux tailles, avec
  // l'effet court et l'effet long de référence.
  racine.innerHTML =
    `<div class="proto">` +
    `<p class="proto-titre">Prototype de carte — full art</p>` +
    `<div class="proto-planche">` +
    carteCendre('reduite', 'réduite', 'fullart') +
    carteCendre('', 'normale', 'fullart') +
    `<span class="proto-sep"></span>` +
    carteCendre('reduite', 'texte long · réduite', 'fullart', CENDRE_LONG) +
    carteCendre('', 'texte long · normale', 'fullart', CENDRE_LONG) +
    `</div>` +
    `<p class="proto-note">« Serment de cendre » en full art — <a href="?jeu">aller au jeu</a> · build ${build}</p>` +
    `</div>`
}

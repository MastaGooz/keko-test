/**
 * LE PROTOTYPE DE CARTE, à la place du jeu.
 *
 * Keko veut reprendre le dessin des cartes en profondeur, une couche à la
 * fois, sur une page qui ne montre que ça : la carte en réduit (le râtelier)
 * et en taille normale (la main), côte à côte, sans rien autour qui distraie.
 * Le jeu reste derrière `?jeu`.
 *
 * Deux pistes côte à côte :
 * - **le cadre de Keko** (`public/cadre.png`), un double filet néon sur bande
 *   noire, recolorable par filtre ;
 * - **« Entaille du Néant »**, une carte que Keko a fait générer par ChatGPT
 *   (HTML/CSS récupéré d'une page sauvegardée) : cadre cuivre patiné, fenêtre
 *   d'art en arche, ruban de titre (le SVG de l'original, récupéré par Keko), panneau de règles en papier, bandeau de
 *   type violet. Le code original est en pixels pour une carte de 356 px ; il
 *   est réécrit ici en `cqw` pour que la même carte tienne en réduit et en
 *   normal, et au rapport 5/7 au lieu de 1/1,48. Trois fichiers manquaient à
 *   la page sauvegardée (l'illustration, le ruban, le grain) : ils sont
 *   remplacés par du CSS et du SVG écrits à la main, sauf l'illustration —
 *   celle-là attend Keko.
 */
import './proto.css'

/** Le ruban du titre, l'original de la carte ChatGPT, déposé par Keko. */
const RUBAN = `${import.meta.env.BASE_URL}title-ribbon.svg?v=${encodeURIComponent(__BUILD_TIME__)}`
/** Le grain du cuivre, écrit à la main (`public/copper-grain.svg`) : la tuile manquante. */
const GRAIN = `${import.meta.env.BASE_URL}copper-grain.svg?v=${encodeURIComponent(__BUILD_TIME__)}`

const TEINTES = [
  ['rouge', 'tel quel'],
  ['or', 'trésor'],
  ['bleu', 'rare'],
  ['violet', 'épique'],
  ['vert', 'consommable'],
  ['gris', 'commune'],
] as const

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

/** La carte au cadre de Keko : la boîte, et l'image qui déborde de sa marge. */
function carteCadre(cadre: string, classes: string, etiquette: string): string {
  return fig(
    `<div class="proto-carte" aria-label="${etiquette}">` +
      `<img class="cadre" src="${cadre}" alt="" draggable="false">` +
      `<span class="cout">3</span></div>`,
    etiquette,
    classes,
  )
}

/** La carte « Entaille du Néant », structure reprise telle quelle. */
function carteNeant(classes: string, etiquette: string): string {
  return fig(
    `<article class="neant" style="--ruban:url('${RUBAN}');--grain:url('${GRAIN}')" aria-label="Carte Entaille du Néant">` +
      `<div class="art" role="img" aria-label="Illustration à venir"></div>` +
      `<h1 class="title">Entaille du Néant</h1>` +
      `<section class="rules"><p class="description">Infligez <strong>12 dégâts</strong>.<br>` +
      `Si la cible est affaiblie, appliquez <strong>2 Corrosion</strong>.</p></section>` +
      `<p class="type">Attaque · Occulte</p>` +
      `</article>`,
    etiquette,
    classes,
  )
}

export function montrerProto(racine: HTMLElement, build: string): void {
  // LA DATE DU BUILD DANS L'URL : les fichiers de `public/` gardent leur nom,
  // donc sans ça le navigateur ressert l'ancien cadre quand Keko le change.
  const cadre = `${import.meta.env.BASE_URL}cadre.png?v=${encodeURIComponent(build)}`

  racine.innerHTML =
    `<div class="proto">` +
    `<p class="proto-titre">Prototype de carte — deux pistes</p>` +
    `<div class="proto-planche">` +
    carteCadre(cadre, 'reduite', 'cadre · réduite') +
    carteCadre(cadre, '', 'cadre · normale') +
    `<span class="proto-sep"></span>` +
    carteNeant('reduite', 'Néant · réduite') +
    carteNeant('', 'Néant · normale') +
    `</div>` +
    `<div class="proto-teintes">` +
    TEINTES.map(([teinte, quoi]) => carteCadre(cadre, `mini ${teinte}`, `${teinte} · ${quoi}`)).join('') +
    `</div>` +
    `<p class="proto-note">à gauche le cadre de Keko, à droite la carte ChatGPT réécrite en proportions` +
    ` — <a href="?jeu">aller au jeu</a> · build ${build}</p>` +
    `</div>`
}

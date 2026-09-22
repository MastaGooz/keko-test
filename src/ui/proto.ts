/**
 * LE PROTOTYPE DE CARTE, à la place du jeu.
 *
 * Keko veut reprendre le dessin des cartes en profondeur, une couche à la
 * fois, sur une page qui ne montre que ça : la carte en réduit (le râtelier)
 * et en taille normale (la main), côte à côte, sans rien autour qui distraie.
 * Le jeu reste derrière `?jeu`.
 *
 * Étape 2 : LE CADRE DE KEKO. Un PNG qu'il a dessiné (`public/cadre.png`) —
 * un double filet néon avec sa lueur, sur une bande noire, la face
 * transparente. L'image porte une marge transparente de 50 px autour d'un
 * cadre de 2000 × 2800 (5/7 pile) : on la pose en débordant de cette marge,
 * pour que la boîte de la carte soit le cadre visible et rien d'autre.
 *
 * La couleur se change par filtre (`hue-rotate`) : le noir reste noir, seul
 * le néon tourne. Une rangée de teintes le prouve sous les deux cartes.
 */
import './proto.css'

const TEINTES = [
  ['rouge', 'tel quel'],
  ['or', 'trésor'],
  ['bleu', 'rare'],
  ['violet', 'épique'],
  ['vert', 'consommable'],
  ['gris', 'commune'],
] as const

export function montrerProto(racine: HTMLElement, build: string): void {
  // LA DATE DU BUILD DANS L'URL : les fichiers de `public/` gardent leur nom,
  // donc sans ça le navigateur ressert l'ancien cadre quand Keko le change.
  const cadre = `${import.meta.env.BASE_URL}cadre.png?v=${encodeURIComponent(build)}`
  const carte = (classes: string, etiquette: string): string =>
    `<figure class="proto-fig"><div class="proto-carte ${classes}" aria-label="${etiquette}">` +
    `<img class="cadre" src="${cadre}" alt="" draggable="false"></div>` +
    `<figcaption>${etiquette}</figcaption></figure>`

  racine.innerHTML =
    `<div class="proto">` +
    `<p class="proto-titre">Prototype de carte — étape 2 : le cadre</p>` +
    `<div class="proto-planche">` +
    carte('reduite', 'réduite') +
    carte('', 'normale') +
    `</div>` +
    `<div class="proto-teintes">` +
    TEINTES.map(([teinte, quoi]) => carte(`mini ${teinte}`, `${teinte} · ${quoi}`)).join('') +
    `</div>` +
    `<p class="proto-note">le cadre de Keko, 5/7 — <a href="?jeu">aller au jeu</a> · build ${build}</p>` +
    `</div>`
}

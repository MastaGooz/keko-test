/**
 * LE PROTOTYPE DE CARTE, à la place du jeu.
 *
 * Keko veut reprendre le dessin des cartes en profondeur, une couche à la
 * fois, sur une page qui ne montre que ça : la carte en réduit (le râtelier)
 * et en taille normale (la main), côte à côte, sans rien autour qui distraie.
 * Le jeu reste derrière `?jeu`.
 *
 * Étape 1 : le contour. Un cadre classique, au rapport des cartes Magic
 * (63 × 88 mm, soit 5/7 à un cheveu près), et rien d'autre — pas de fenêtre,
 * pas de nom, pas de chiffre. On valide la forme avant d'y poser quoi que ce
 * soit.
 */
import './proto.css'

export function montrerProto(racine: HTMLElement, build: string): void {
  racine.innerHTML =
    `<div class="proto">` +
    `<p class="proto-titre">Prototype de carte — étape 1 : le contour</p>` +
    `<div class="proto-planche">` +
    `<div class="proto-carte reduite" aria-label="carte réduite"></div>` +
    `<div class="proto-carte" aria-label="carte normale"></div>` +
    `</div>` +
    `<p class="proto-note">réduite (râtelier) · normale (main) · rapport 63/88 comme Magic` +
    ` — <a href="?jeu">aller au jeu</a> · build ${build}</p>` +
    `</div>`
}

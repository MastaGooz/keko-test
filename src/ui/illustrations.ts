/**
 * Les dessins du jeu, en SVG écrit à la main : la tête de mort, le sceau des
 * trésors, les créatures. Les illustrations des CARTES ne vivent plus ici :
 * ce sont des fichiers SVG en plein format, dans `art/` (voir `art.ts`).
 */

/**
 * La tête de mort qui se plaque sur un corps abattu, dans le gros plan.
 *
 * Pleine et non filaire, comme les créatures : à la taille où elle se pose —
 * la moitié d'un corps de 490 px — un contour se lirait comme un pictogramme
 * d'interface, pas comme une marque frappée dans la chair.
 */
export function teteDeMort(): string {
  return (
    '<svg class="tete-de-mort" viewBox="0 0 48 48" aria-hidden="true">' +
    // Le crane : une calotte large qui se resserre sur les pommettes.
    '<path d="M24 3C13.5 3 6 10.8 6 21.2c0 6.2 2.6 10.6 6.6 13.2l1 5.4c.3 1.6 1.7 2.8 3.4 2.8h14c1.7 0 3.1-1.2 3.4-2.8l1-5.4c4-2.6 6.6-7 6.6-13.2C42 10.8 34.5 3 24 3z"/>' +
    // Les orbites, creusees dans le crane.
    '<ellipse cx="16.4" cy="21" rx="5.3" ry="6.1" fill="#120305"/>' +
    '<ellipse cx="31.6" cy="21" rx="5.3" ry="6.1" fill="#120305"/>' +
    // Le nez, puis les dents : deux fentes qui font la machoire.
    '<path d="M24 26.6l-3.1 6.2h6.2z" fill="#120305"/>' +
    '<path d="M15.6 37.4h16.8v2.2H15.6zM19.4 34.6h1.9v5h-1.9zM26.7 34.6h1.9v5h-1.9z" fill="#120305"/>' +
    '</svg>'
  )
}

export function sceau(): string {
  return (
    '<svg class="dessin-sceau" viewBox="0 0 24 24" aria-hidden="true" fill="none" ' +
    'stroke="currentColor" stroke-width="1.8">' +
    '<circle cx="12" cy="12" r="8.2"/><circle cx="12" cy="12" r="3.4"/></svg>'
  )
}

/* ------------------------------------------------------------------------ *
 * Les creatures.
 *
 * Des silhouettes pleines, pas du trait : une masse sombre avec un oeil qui
 * brille se lit comme un corps, un contour filaire se lit comme un schema.
 * Le meme principe que les cartes -- la lumiere vient du haut, d'ou le liseré
 * clair pose en filtre CSS sur le bord superieur.
 * ------------------------------------------------------------------------ */

/** Un quadrupede efflanque, tourne vers la gauche. La base des roquets. */
const CHIEN =
  '<path d="M50 30q9-2 10-11 0-3-3-2-1 8-8 10z"/>' +
  '<ellipse cx="37" cy="34" rx="16" ry="10"/>' +
  '<path d="M25 41h4l-1.5 14h-4z"/><path d="M33 43h3.6l-1.4 12h-3.6z"/>' +
  '<path d="M43 41h4l-1.5 14h-4z"/><path d="M49 42h3.4l-1.3 13h-3.4z"/>' +
  '<ellipse cx="19" cy="30" rx="9" ry="8"/>' +
  '<path d="M12 31q-8 0-9 4 0 3 3 3l9-1z"/>' +
  '<path d="M15 23l-3-12 10 7z"/><path d="M24 22l2-11 6 9z"/>'

/** Le meneur : le meme corps, plus une crete. Une meute a une tete. */
const MENEUR =
  '<path d="M27 25l2-11 5 8 3-10 5 9 4-8 4 10z"/>' + CHIEN

/** Le garde : un heaume, un bouclier, une lance. Trois signes, ca suffit. */
const GARDE =
  '<path d="M47 13h4l-2 43h-3z"/><path d="M46 3l6 2-2 9h-2z"/>' +
  '<path d="M24 34q10-4 20 0l4 22h-28z"/>' +
  '<path d="M34 11q-10 0-10 10v4q0 5 10 5t10-5v-4q0-10-10-10z"/>' +
  '<path d="M5 26l11-5 11 5v12q0 9-11 14Q5 47 5 38z"/>'

/**
 * Le joueur : une silhouette encapuchonnee, debout, tournee vers la droite --
 * face aux ennemis, qui regardent vers la gauche. Sur une scene, tout le monde
 * se fait face ; c'est ce qui raconte un affrontement plutot qu'une liste.
 */
const HEROS =
  '<path d="M27 20q-9 0-11 9l-2 27h26l-2-27q-2-9-11-9z"/>' +
  '<path d="M27 4q-9 0-9 10 0 7 4 10h10q4-3 4-10 0-10-9-10z"/>' +
  '<path d="M18 14q4 4 9 4t9-4"/>' +
  '<path d="M38 26l8 3-2 24h-6z"/>' +
  '<path d="M45 8h3l-1 46h-3z"/><path d="M44 3h5l-1 6h-3z"/>'

const CREATURES: Record<string, { trace: string; oeil: [number, number] }> = {
  joueur: { trace: HEROS, oeil: [31, 13] },
  garde: { trace: GARDE, oeil: [31, 22] },
  roquet: { trace: CHIEN, oeil: [17, 29] },
  meneur: { trace: MENEUR, oeil: [17, 29] },
}

/**
 * La silhouette d'un combattant. `oeil` est le seul point lumineux : c'est lui
 * qui fait la difference entre une masse et une bete qui te regarde.
 */
export function creature(espece: string, cle: string): string {
  const c = CREATURES[espece] ?? CREATURES.roquet!
  // Un degrade par instance, et un identifiant unique : deux silhouettes qui
  // partageraient un id verraient la seconde emprunter la couleur de la
  // premiere -- toute la meute finirait de la meme teinte.
  const id = `chair-${cle}`
  return (
    `<svg class="silhouette" viewBox="0 0 64 60" aria-hidden="true">` +
    `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">` +
    `<stop offset="0" stop-color="currentColor"/>` +
    `<stop offset="0.55" stop-color="currentColor" stop-opacity="0.82"/>` +
    `<stop offset="1" stop-color="currentColor" stop-opacity="0.5"/>` +
    `</linearGradient></defs>` +
    `<g fill="url(#${id})">${c.trace}</g>` +
    `<circle class="oeil" cx="${c.oeil[0]}" cy="${c.oeil[1]}" r="2.1"/></svg>`
  )
}

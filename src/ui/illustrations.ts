/**
 * Les dessins des cartes, en SVG écrit à la main.
 *
 * Contrainte assumée : pas d'assets, pas de fichiers image, pas de dépendance.
 * Des silhouettes au trait, lisibles à 40 px sur un téléphone — c'est ce qui
 * tient dans une carte de 78 px de large sans devenir une tache.
 *
 * Les trésors ont droit au même soin que les cartes de combat, et c'est
 * délibéré : ils passent la moitié de la partie dans la main du joueur. Une
 * babiole qui encombre doit avoir une tête, sinon c'est juste une case grise.
 */

/** viewBox commune : 32x32, trait à 1.6, tout en currentColor. */
const TRACES: Record<string, string> = {
  // --- les cartes de combat ---
  Dague:
    '<path d="M16 3l3.2 8.6v9.4h-6.4v-9.4z"/><path d="M9.5 21.2h13"/>' +
    '<path d="M14.5 23.2h3v4.2h-3z"/><circle cx="16" cy="28.8" r="1.6"/>',
  Taillade:
    '<path d="M3.5 26.5C9 12 20.5 5.5 28.5 4.5"/>' +
    '<path d="M7 28.5C12.5 17 21 11.5 27.5 10"/>' +
    '<path d="M28.5 4.5l-1.2 5.4 4-2.6z"/>',
  Moulinet:
    '<path d="M26.5 11.5a11 11 0 1 1-9.6-5.4"/>' +
    '<path d="M16.9 2.4l4.4 3.7-4.6 3.5z"/>' +
    '<path d="M12 20.5l8-9 3.5 3-8 9z"/>',

  // --- le butin ---
  Couronne:
    '<path d="M4.5 22.5l-1.5-12 6.5 5 6.5-9 6.5 9 6.5-5-1.5 12z"/>' +
    '<path d="M5 26.5h22"/><circle cx="16" cy="15.5" r="1.4"/>',
  'Diadème':
    '<path d="M3.5 24c4.5-10 21-10 25 0"/><path d="M16 6.5l2.6 5.5h-5.2z"/>' +
    '<circle cx="8" cy="16" r="1.6"/><circle cx="24" cy="16" r="1.6"/>',
  'Sceptre':
    '<path d="M16 11v18"/><circle cx="16" cy="7" r="4.2"/>' +
    '<path d="M10.5 14.5h11"/><path d="M12.5 29.5h7"/>',
  Reliquaire:
    '<path d="M6.5 13.5h19v15h-19z"/><path d="M6.5 13.5L16 7.5l9.5 6"/>' +
    '<path d="M16 17v8"/><path d="M12.8 20.2h6.4"/>',
  Ostensoir:
    '<circle cx="16" cy="12" r="5"/><path d="M16 3v2.5M16 18.5V21M7 12h2.5M22.5 12H25' +
    'M9.6 5.6l1.8 1.8M20.6 16.6l1.8 1.8M22.4 5.6l-1.8 1.8M11.4 16.6l-1.8 1.8"/>' +
    '<path d="M16 21v5"/><path d="M11 29h10"/>',
  Calice:
    '<path d="M9.5 7.5h13l-1.8 8.5a4.7 4.7 0 0 1-9.4 0z"/>' +
    '<path d="M16 20.5v6"/><path d="M10.5 29h11"/>',
  Cassette:
    '<path d="M5 14.5h22v13H5z"/><path d="M5 14.5a11 6.5 0 0 1 22 0"/>' +
    '<path d="M14.8 18h2.4v5h-2.4z"/>',
  Idole:
    '<circle cx="16" cy="9" r="4.2"/>' +
    '<path d="M10.5 26.5c0-7.5 2.2-11 5.5-11s5.5 3.5 5.5 11z"/>' +
    '<path d="M7.5 29.5h17"/>',
  'Médaillon':
    '<circle cx="16" cy="19.5" r="7.5"/><circle cx="16" cy="19.5" r="3"/>' +
    '<path d="M11.5 13.5L8 6.5M20.5 13.5L24 6.5"/>',
  Torque:
    '<path d="M8 24.5a9.5 9.5 0 1 1 16 0"/>' +
    '<circle cx="8" cy="25.5" r="2.2"/><circle cx="24" cy="25.5" r="2.2"/>',
  'Aiguière':
    '<path d="M10.5 14.5h10v11.5a3.2 3.2 0 0 1-3.2 3.2h-3.6a3.2 3.2 0 0 1-3.2-3.2z"/>' +
    '<path d="M12 14.5l1-6.5h6l1 6.5"/><path d="M20.5 17.5a4.2 4.2 0 0 1 0 8.4"/>',
  'Camée':
    '<ellipse cx="16" cy="18" rx="7.5" ry="9.5"/>' +
    '<path d="M16.5 12.5c-2.8 0-4.5 2.2-4.5 5 0 2.4 1.4 4 1.4 6"/>' +
    '<circle cx="15" cy="16.5" r="0.9"/>',
}

/** Le signe neutre, pour tout ce qui n'a pas encore de dessin. */
const DEFAUT = '<path d="M16 4.5l11 6.5v11l-11 6.5-11-6.5v-11z"/><path d="M16 12v8"/>'

/**
 * Le sceau des tresors, a la place de la gemme de cout. Un glyphe hachure
 * passait pour un caractere manquant des que la carte grandissait.
 */
export function sceau(): string {
  return (
    '<svg class="dessin-sceau" viewBox="0 0 24 24" aria-hidden="true" fill="none" ' +
    'stroke="currentColor" stroke-width="1.8">' +
    '<circle cx="12" cy="12" r="8.2"/><circle cx="12" cy="12" r="3.4"/></svg>'
  )
}

export function dessin(nom: string): string {
  return (
    `<svg class="dessin" viewBox="0 0 32 32" aria-hidden="true" fill="none" ` +
    `stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" ` +
    `stroke-linecap="round">${TRACES[nom] ?? DEFAUT}</svg>`
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

const CREATURES: Record<string, { trace: string; oeil: [number, number] }> = {
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

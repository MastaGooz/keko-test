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
  // Une lame longue et fine : l'estoc pique, il ne taille pas.
  Estoc:
    '<path d="M16 2l2.3 7.4v12.4h-4.6V9.4z"/><path d="M9.5 22h13"/>' +
    '<path d="M14.6 24h2.8v4.6h-2.8z"/><circle cx="16" cy="29.8" r="1.5"/>' +
    '<path d="M11.5 15.5l-2.5-3M20.5 15.5l2.5-3"/>',
  Dague:
    '<path d="M16 3l3.2 8.6v9.4h-6.4v-9.4z"/><path d="M9.5 21.2h13"/>' +
    '<path d="M14.5 23.2h3v4.2h-3z"/><circle cx="16" cy="28.8" r="1.6"/>',
  Taillade:
    '<path d="M3.5 26.5C9 12 20.5 5.5 28.5 4.5"/>' +
    '<path d="M7 28.5C12.5 17 21 11.5 27.5 10"/>' +
    '<path d="M28.5 4.5l-1.2 5.4 4-2.6z"/>',
  // L'Espadon et son set : une lame a deux mains, et trois gestes larges.
  Espadon:
    '<path d="M16 1.5l2.8 6.5v13.5h-5.6V8z"/><path d="M6.5 22h19"/>' +
    '<path d="M6.5 22q-2.5-1.5-1.5-4M25.5 22q2.5-1.5 1.5-4"/>' +
    '<path d="M14.3 24h3.4v5h-3.4z"/><circle cx="16" cy="30.3" r="1.4"/>',
  Fauchage:
    '<path d="M3 19c7-11 19-11 26 0"/><path d="M29 19l-2.6-4.4 4.6-.4z"/>' +
    '<path d="M9 23l-2 4.5M16 24v5M23 23l2 4.5"/>',
  Fendre:
    '<path d="M16 2.5v20"/><path d="M11 5.5l5-3 5 3"/>' +
    '<path d="M16 22.5l-5.5 7M16 22.5l5.5 7"/><path d="M12.5 27.5l7 0"/>',
  Tornade:
    '<path d="M6 6c7-2 14-2 20 0-5 2-11 2-16 0"/>' +
    '<path d="M9 12c5-1.5 10-1.5 14 0-3.5 1.5-8 1.5-11.5 0"/>' +
    '<path d="M12 18c3-1 6-1 8 0-2 1-4.5 1-6.5 0"/>' +
    '<path d="M14 24c1.5-.6 3-.6 4 0-1 .6-2.3 .6-3.3 0"/><path d="M16 27v3"/>',
  // La fiole : un col, une panse, le niveau du liquide.
  Fiole:
    '<path d="M12.5 3h7"/><path d="M14 3v6.5l-5.5 9a6.5 6.5 0 0 0 5.6 9.5h3.8a6.5 6.5 0 0 0 5.6-9.5L18 9.5V3"/>' +
    '<path d="M9.5 21.5h13"/><path d="M12 25.5c2 1.5 6 1.5 8 0"/>',
  // La piece « Fioles » porte le meme dessin que la carte « Fiole ».
  Fioles: '',
  Moulinet:
    '<path d="M26.5 11.5a11 11 0 1 1-9.6-5.4"/>' +
    '<path d="M16.9 2.4l4.4 3.7-4.6 3.5z"/>' +
    '<path d="M12 20.5l8-9 3.5 3-8 9z"/>',

  // --- l'armure : ce qui encaisse ---
  // Un ecu : la pointe en bas, la bosse au centre. C'est ce qu'on met entre
  // soi et le coup.
  Garde:
    '<path d="M16 3l10 3.5v9c0 6.5-4.3 11-10 13.5C10.3 26.5 6 22 6 15.5v-9z"/>' +
    '<circle cx="16" cy="14.5" r="2.4"/>',
  // Un pavois, plus large et plus lourd : il couvre, il ne pare pas.
  Rempart:
    '<path d="M6 4h20v12c0 7-4.5 11.5-10 13.5C10.5 27.5 6 23 6 16z"/>' +
    '<path d="M6 12h20M16 4v25.5"/>',

  // --- les pieces d'equipement : ce qu'on emporte, pas ce qu'on joue ---
  // Le Glaive : une lame droite, large, avec sa garde. Vue de face, plantee.
  Glaive:
    '<path d="M16 2.5l3 5.5v13h-6V8z"/><path d="M8 21h16"/>' +
    '<path d="M14 23h4v5h-4z"/><circle cx="16" cy="29.5" r="1.6"/>' +
    '<path d="M16 8v12"/>',
  // Le Plastron : un torse d'acier, epaules et col. Ce qu'on porte, pas ce
  // qu'on tient.
  Plastron:
    '<path d="M9 5.5l7-2.5 7 2.5 4 4.5-2.5 3v13.5H7.5V13L5 10z"/>' +
    '<path d="M12.5 5.5c1 2.5 6 2.5 7 0"/><path d="M16 9v17"/>' +
    '<path d="M10.5 14.5l5.5 2 5.5-2"/>',

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

TRACES['Fioles'] = TRACES['Fiole']!

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

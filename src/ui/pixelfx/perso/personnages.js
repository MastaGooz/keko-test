/**
 * LES AUTRES PERSONNAGES du squelette paramétré (`rig.js`), pour le proto du magicien (`?magicien`) : le magicien
 * lui-même, et les ennemis de la tour du magicien qui ont un corps — l'orc, le golem, le squelette. L'esprit de feu
 * n'a pas de corps : c'est une flamme (un effet du dépôt). Le gobelin est dans `gobelin.js`. Chacun : ses mesures,
 * sa palette (A..D les plaques, E..G les articulations, k l'encre, J la couture), ses traits.
 */

/** Le magicien : grand et mince, un chapeau pointu, une robe bleue ; son bâton est l'arme `staff`. */
export const MAGICIEN = {
  id: "magicien",
  echelle: 1.04,
  membres: 0.9,
  ventre: 1,
  tete: 1.02,
  jambes: 1.02,
  bras: 1,
  palette: { k: "#0c0a1e", A: "#a9bdff", B: "#6f84e6", C: "#4756b8", D: "#2d357e", E: "#5563b8", F: "#3a4488", G: "#262c5e", J: "#232a66" },
  traits: { chapeau: 1.1, yeux: "#ffffff" },
};

/** L'orc : plus grand et plus large que l'humain, les défenses longues, la peau gris-vert. */
export const ORC = {
  id: "orc",
  echelle: 1.12,
  membres: 1.25,
  ventre: 1.3,
  tete: 1.05,
  jambes: 0.95,
  bras: 1.08,
  palette: { k: "#0e120e", A: "#9fb48a", B: "#6f865c", C: "#4a5e3c", D: "#2f3d26", E: "#5a6e48", F: "#3f5032", G: "#2b3622", J: "#334028" },
  traits: { oreilles: 0.6, nez: 0.9, defenses: 1.6, yeux: "#ff4a3a", os: "#f1e8cf" },
};

/** Le golem : massif, de pierre, sans oreilles ni nez, deux yeux de braise. */
export const GOLEM = {
  id: "golem",
  echelle: 1.25,
  membres: 1.45,
  ventre: 1.35,
  tete: 0.85,
  jambes: 0.9,
  bras: 1.1,
  palette: { k: "#0e0e12", A: "#a4a4b2", B: "#7d7d8c", C: "#5c5c6b", D: "#42424f", E: "#6a6a78", F: "#4c4c58", G: "#34353f", J: "#3a3a46" },
  traits: { yeux: "#ff9a2a" },
};

/** Le squelette : maigre, en os, les yeux rouges. */
export const SQUELETTE = {
  id: "squelette",
  echelle: 1,
  membres: 0.68,
  ventre: 0.85,
  tete: 1,
  jambes: 1,
  bras: 1,
  palette: { k: "#1a1814", A: "#fffaf0", B: "#e4dcc8", C: "#b8ad96", D: "#8a806c", E: "#c8bda4", F: "#9a8f78", G: "#6e6553", J: "#7a715c" },
  traits: { yeux: "#ff3a3a" },
};

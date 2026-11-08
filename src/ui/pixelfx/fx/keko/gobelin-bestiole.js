// LE GOBELIN BESTIOLE (Keko : « tu essaies de créer un gobelin avec cette méthode ? ») : un gobelin dessiné pixel par
// pixel comme les bestioles du dépôt (la grille de critters/_lib.js, des volumes ombrés, un contour), SANS le squelette :
// un petit gobelin voûté qui trotte sur place, une massue sur l'épaule, les oreilles qui battent à chaque pas, l'œil
// jaune qui guette, la poussière sous les pieds. Les jambes et les bras sont calculés : deux segments par membre, le
// pied qui se lève en passant devant, le corps qui rebondit, la tête qui suit avec un temps de retard.
import { fit, wrap, cycle, TAU } from "pixelfx";
import { Grid, shift, shadow } from "pixelfx/fx/critters/_lib";

export const meta = {
  name: "Gobelin bestiole",
  desc: "Un petit gobelin voûté trotte sur place, pixel par pixel : la massue sur l'épaule, les oreilles qui battent à chaque pas, l'œil jaune qui guette, de la poussière sous les pieds.",
  tags: ["keko", "critter", "gobelin", "marche", "loop"],
  size: [72, 56],
  origin: [36, 48],
  duration: 0.72,
  loop: true,
  fps: 30,
  bg: "ground",
  options: { palette: ["#0f140c", "#2f4a1a", "#4a7a2c", "#6aa83a", "#8fc654", "#b9df7c", "#e4f5b8"], cuir: ["#2a1a0c", "#5a3a1c", "#8a5c32", "#b8894e"], oeil: ["#1a1206", "#ffd23a", "#fff6c0"], seed: 1 },
};

const D = meta.duration, GRID = new Grid(-20, -34, 44, 38);
/** La lumière vient d'en haut à gauche : le ton d'un volume d'après sa normale. */
const ton = (C, nx, ny) => (nx * -0.6 + ny * -0.8 > 0.4 ? C[4] : nx * 0.6 + ny * 0.8 > 0.5 ? C[2] : C[3]);

/** Une patte à deux segments : la hanche, le genou plié vers l'arrière, le pied. ph : la phase du pas de CETTE patte. */
function patte(ph) {
  const balance = Math.sin(ph);
  // le pied avance pendant qu'il est levé (le demi-cycle où sin monte), recule au sol
  const x = balance * 3.6;
  const leve = Math.max(0, Math.cos(ph)) * 3;
  const hanche = [0, -9], pied = [x, -leve];
  // le genou : entre les deux, poussé vers l'arrière, plus quand la patte est pliée
  const mx = (hanche[0] + pied[0]) / 2, my = (hanche[1] + pied[1]) / 2;
  const genou = [mx - 1.6 - leve * 0.4, my + 0.4];
  return { hanche, genou, pied };
}

function gobelin(g, C, K, E, t) {
  g.clear();
  const ph = (t / D) * TAU * 2; // deux pas par boucle
  const rebond = Math.round(-0.8 + 0.9 * Math.cos(ph * 1));
  const tete = Math.round(-0.8 + 0.9 * Math.cos(ph - 0.9)); // la tête suit avec du retard
  const Y = rebond;
  const loin = patte(ph + Math.PI), pres = patte(ph);
  const membre = (p, c, cFonce) => {
    // la cuisse en tube, le tibia plus fin, l'arrière du membre à l'ombre
    g.tube([[p.hanche[0], p.hanche[1] + Y], [p.genou[0], p.genou[1] + Y]], 1.4, (u, v) => (v > 0.6 ? cFonce : c));
    g.tube([[p.genou[0], p.genou[1] + Y], [p.pied[0], p.pied[1] - 0.5]], 1.05, (u, v) => (v > 0.6 ? cFonce : c));
    // le pied : une petite semelle qui pointe devant
    for (let i = -1; i <= 2; i++) g.set(p.pied[0] + i, p.pied[1], i === 2 ? cFonce : c);
    g.set(p.pied[0], p.pied[1] - 1, c);
    g.set(p.pied[0] + 1, p.pied[1] - 1, c);
  };
  // la patte lointaine et le bras lointain (qui porte la massue) : plus sombres, derrière le corps
  membre(loin, C[2], C[1]);
  const epauleF = [-1, -15 + Y];
  const mainF = [-3.5 + Math.sin(ph) * 1.2, -11 + Y];
  g.tube([epauleF, mainF], 1, C[2]);
  // la massue sur l'épaule : un manche de cuir et une tête noueuse, qui ballotte avec le pas
  const bal = Math.sin(ph - 0.6) * 0.8;
  g.line(mainF[0], mainF[1], -6 + bal, -24 + Y, K[1]);
  g.line(mainF[0] + 1, mainF[1], -5 + bal, -24 + Y, K[2]);
  g.ellipse(-6.5 + bal, -26 + Y, 2.6, 2.2, (nx, ny) => (nx * -0.6 + ny * -0.8 > 0.4 ? K[3] : nx * 0.6 + ny * 0.8 > 0.5 ? K[0] : K[1]));
  g.set(-7 + bal, -27 + Y, K[3]);
  // le pagne et le torse voûté : un ventre rond penché en avant
  g.ellipse(0.5, -12.5 + Y, 3.8, 4.6, (nx, ny) => ton(C, nx + 0.2, ny));
  g.ellipse(0.5, -9.2 + Y, 3.9, 1.7, (nx, ny) => (ny < -0.2 ? K[2] : K[1]));
  g.set(2, -9 + Y, K[3]);
  // la patte proche, puis le bras proche qui balance à l'inverse de la patte proche
  membre(pres, C[3], C[2]);
  const epaule = [2, -15 + Y];
  const main = [2 + Math.sin(ph + Math.PI) * 2.8, -10.5 + Y + Math.max(0, -Math.sin(ph)) * 0.8];
  const coude = [(epaule[0] + main[0]) / 2 + 1.2, (epaule[1] + main[1]) / 2];
  g.tube([epaule, coude, main], 1.1, (u, v) => (v > 0.6 ? C[2] : C[3]));
  g.ellipse(main[0], main[1] + 0.5, 1.4, 1.2, C[3]);
  // la tête : grosse, en avant du corps, le nez, l'œil, la bouche
  const hx = 3.5, hy = -19.5 + tete;
  // les oreilles : deux pointes vers l'arrière et le haut, qui battent au pas (la lointaine plus sombre)
  const flop = Math.sin(ph - 0.5) * 1.4;
  g.poly([[hx - 2, hy - 1], [hx - 9, hy - 5 + flop], [hx - 1.5, hy + 1.5]], C[2]);
  g.poly([[hx - 1, hy - 2], [hx - 8.5, hy - 7 + flop], [hx - 0.5, hy + 0.5]], C[3]);
  g.line(hx - 2, hy - 2.5, hx - 7, hy - 6 + flop, C[4]);
  g.ellipse(hx, hy, 4.3, 3.9, (nx, ny) => ton(C, nx, ny));
  g.ellipse(hx + 4.6, hy + 0.6, 1.7, 1.1, (nx, ny) => (nx * -0.6 + ny * -0.8 > 0.2 ? C[4] : C[3]));
  // l'œil : jaune, la pupille qui guette devant, un éclat ; il cligne une fois par boucle
  const cligne = wrap(t, D) > D * 0.82 && wrap(t, D) < D * 0.9;
  if (cligne) g.set(hx + 1, hy - 1, C[1]), g.set(hx + 2, hy - 1, C[1]);
  else {
    g.set(hx + 1, hy - 1.5, E[1]); g.set(hx + 2, hy - 1.5, E[1]); g.set(hx + 1, hy - 0.5, E[1]); g.set(hx + 2, hy - 0.5, E[1]);
    g.set(hx + 2, hy - 0.5, E[0]);
    g.set(hx + 1, hy - 1.5, E[2]);
  }
  // la bouche : un trait sombre, une dent
  g.set(hx + 1, hy + 2, C[1]); g.set(hx + 2, hy + 2, C[1]); g.set(hx + 3, hy + 2, C[1]);
  g.set(hx + 2, hy + 3, C[6]);
  // le contour : encre, un peu plus claire sur l'arête éclairée
  g.outline((x, y, nx, ny) => (ny > 0 && nx > 0 ? C[1] : C[0]));
}

export function draw(p, time, o) {
  const t = shift(time, D, o.seed), C = fit(o.palette, 7), K = fit(o.cuir, 4), E = fit(o.oeil, 3);
  gobelin(GRID, C, K, E, t);
  GRID.draw(p, 1, 0, 0);
  // la poussière : une bouffée à chaque pas, qui part vers l'arrière et se dissipe
  cycle(t, D, 6, o.seed * 7 + 3, 0.3, (age, L, r, i) => {
    const k = age / L, x = -2 + (i % 2 ? 3 : -3) - age * r.range(10, 22), y = -1 - age * r.range(4, 9) + 8 * age * age;
    p.dot(x, Math.min(-1, y), k < 0.5 ? K[3] : K[2], (1 - k) * 0.9);
  });
  // un éclat dans l'œil de temps en temps
  const g = wrap(t, D);
  if (g < 0.12) p.glow(4.5, -21, 4, E[1], 0.35 * (1 - g / 0.12));
}

export function drawBack(p, time, o) {
  const t = shift(time, D, o.seed), C = fit(o.palette, 7);
  const ph = (t / D) * TAU * 2;
  shadow(p, 1, 0, 7.5 + Math.abs(Math.sin(ph)) * 1.2, 1.6, C[0], 0.5);
}

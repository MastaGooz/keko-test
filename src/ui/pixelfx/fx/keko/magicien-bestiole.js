// LE MAGICIEN BESTIOLE (Keko, après le gobelin bestiole : « c'est beaucoup mieux, et si tu fais le magicien avec
// cette méthode ? ») : le magicien dessiné pixel par pixel, sans le squelette — une robe bleue en cloche dont l'ourlet
// ondule, une ceinture, une longue barbe blanche qui se balance, un chapeau pointu dont la pointe dodeline en
// retard sur le corps, un œil qui cligne, et le bâton tenu devant lui : un orbe d'or qui palpite, luit, et sème des
// étincelles qui montent. Il respire, debout, face à droite. Une boucle pure : tout est fonction de la phase.
import { fit, wrap, cycle, sparkle, TAU } from "pixelfx";
import { Grid, shift, shadow, lnoise } from "pixelfx/fx/critters/_lib";

export const meta = {
  name: "Magicien bestiole",
  desc: "Le magicien pixel par pixel : la robe dont l'ourlet ondule, la barbe qui se balance, le chapeau pointu qui dodeline, un clin d'œil, l'orbe du bâton qui palpite et sème des étincelles.",
  tags: ["keko", "critter", "magicien", "repos", "loop"],
  size: [80, 68],
  origin: [40, 60],
  duration: 2.4,
  loop: true,
  fps: 30,
  bg: "ground",
  options: {
    palette: ["#0c0a1e", "#2d357e", "#4756b8", "#6f84e6", "#a9bdff", "#d6e0ff", "#ffffff"],
    peau: ["#3a2418", "#b07a58", "#e8b48e", "#ffd9bc"],
    barbe: ["#6e738a", "#b9bdcc", "#e6e8f0", "#ffffff"],
    or: ["#8a5a14", "#d9a520", "#ffd84a", "#fff2b0"],
    bois: ["#3a2412", "#6b4423", "#9a6a3a"],
    seed: 1,
  },
};

const D = meta.duration, GRID = new Grid(-22, -50, 50, 54);
const ton = (C, nx, ny) => (nx * -0.6 + ny * -0.8 > 0.4 ? C[4] : nx * 0.6 + ny * 0.8 > 0.5 ? C[2] : C[3]);

function magicien(g, C, P, B, O, W, t) {
  g.clear();
  const ph = (t / D) * TAU;
  // la respiration : le corps monte d'un pixel, le chapeau et la barbe suivent en retard
  // (-0,4 et non -0,5 : arrondi, -0,5 donne 0 et -0,57 donne -1, et la boucle sautait d'un pixel à la couture)
  const souffle = Math.round(-0.4 + 0.8 * Math.sin(ph));
  const retard = Math.round(-0.4 + 0.8 * Math.sin(ph - 0.7));
  const Y = souffle;
  // LE BÂTON, derrière la main : un manche de bois, un orbe d'or au bout, qui palpite
  const bx = 9, haut = -36 + Y;
  g.line(bx, 1, bx, haut, W[1]);
  g.line(bx + 1, 1, bx + 1, haut, W[0]);
  g.set(bx, -8 + Y, W[2]);
  g.set(bx, -20 + Y, W[2]);
  const bat = 1 + 0.18 * Math.max(0, Math.sin(ph * 2)) ** 2;
  g.ellipse(bx + 0.5, haut - 2.6, 2.4 * bat, 2.4 * bat, (nx, ny) => (nx * -0.6 + ny * -0.8 > 0.3 ? O[3] : nx * 0.6 + ny * 0.8 > 0.55 ? O[0] : nx * 0.6 + ny * 0.8 > 0.1 ? O[1] : O[2]));
  // la griffe d'or qui tient l'orbe
  g.set(bx, haut, O[1]); g.set(bx + 1, haut, O[1]); g.set(bx - 1, haut - 1, O[0]); g.set(bx + 2, haut - 1, O[0]);
  // LA ROBE : une cloche des épaules à l'ourlet, trois plis à l'ombre, l'ourlet qui ondule
  const ourlet = (x) => 1 + 1.2 * lnoise(t, D, 2, x * 0.12, 3);
  g.shade(-8, -21 + Y, 8, 1, (x, y, o) => {
    const h = -(y - Y) ; // la hauteur au-dessus des pieds
    if (h < -0.5 || h > 21) return 0;
    const demi = h > 17 ? 3.6 : 3.6 + (17 - h) * 0.19;
    const bas = ourlet(x);
    if (h < bas - 1) return 0;
    if (Math.abs(x - 0.3) > demi) return 0;
    // les plis : des bandes plus sombres qui descendent, décalées vers l'arrière
    const u = (x - 0.3) / demi;
    let i = u < -0.55 ? 2 : u > 0.6 ? 2 : 3;
    if (u < -0.1 && u > -0.35 && h < 16) i = 2;
    if (u > 0.25 && u < 0.45 && h < 14) i = 2;
    if (u < -0.8 || (h < bas + 0.6 && u > -0.6)) i = 1;
    if (u > -0.5 && u < -0.1 && h > 14) i = 4; // le haut de la poitrine prend la lumière
    o.a = 1;
    return C[i];
  });
  // la ceinture, une boucle d'or
  g.ellipse(0.3, -11.5 + Y, 4.1, 1.2, (nx, ny) => (ny < -0.2 ? W[2] : W[1]));
  g.set(2, -12 + Y, O[2]); g.set(3, -12 + Y, O[1]);
  // la manche et la main qui tiennent le bâton
  g.poly([[2, -19 + Y], [4, -20 + Y], [8, -15 + Y], [7, -12 + Y], [3, -14 + Y]], C[3]);
  g.line(3, -14 + Y, 7, -12 + Y, C[1]);
  g.ellipse(8.5, -14 + Y, 1.6, 1.4, P[2]);
  g.set(9, -15 + Y, P[1]);
  // LA BARBE : une longue pointe qui pend du menton et se balance
  const barbe = 0.8 * Math.sin(ph - 1.2);
  g.poly([[-1.5, -22 + retard], [4.5, -22 + retard], [2.5 + barbe, -17 + retard], [0.8 + barbe * 1.6, -9 + retard]], B[2]);
  g.line(-1, -21 + retard, 0.3 + barbe * 1.6, -10 + retard, B[1]);
  g.line(3.5, -21 + retard, 1.5 + barbe, -16 + retard, B[3]);
  // LA TÊTE : la peau, le nez, l'œil
  const hx = 1.5, hy = -24.5 + retard;
  g.ellipse(hx, hy, 3.3, 3, (nx, ny) => (nx * -0.6 + ny * -0.8 > 0.35 ? P[3] : nx * 0.6 + ny * 0.8 > 0.55 ? P[1] : P[2]));
  g.ellipse(hx + 3.4, hy + 0.8, 1.3, 1, P[2]);
  g.set(hx + 4, hy + 1, P[1]);
  const cligne = wrap(t, D) > D * 0.56 && wrap(t, D) < D * 0.6;
  if (cligne) g.set(hx + 1.5, hy - 0.5, P[0]);
  else {
    g.set(hx + 1.5, hy - 0.5, P[0]);
    g.set(hx + 1.5, hy - 1.5, C[6]);
  }
  // le sourcil blanc, broussailleux
  g.set(hx + 0.5, hy - 2.5, B[3]); g.set(hx + 1.5, hy - 2.5, B[3]); g.set(hx + 2.5, hy - 2.5, B[2]);
  // LE CHAPEAU : un bord large, un cône qui penche en arrière, une bande d'or, la pointe qui dodeline
  const chap = retard;
  g.ellipse(hx - 0.5, hy - 3.2 + (chap - retard), 7.2, 1.5, (nx, ny) => (ny < -0.3 ? C[3] : C[1]));
  const dodeline = 1.2 * Math.sin(ph - 1.6);
  const pointe = [hx - 7 + dodeline, hy - 17 + (chap - retard)];
  const coude = [hx - 2.5 + dodeline * 0.4, hy - 12];
  g.poly([[hx - 3.8, hy - 3.6], [hx + 3.4, hy - 3.6], [coude[0] + 1.6, coude[1]], pointe, [coude[0] - 1.2, coude[1] + 0.5]], (x, y) => (x < hx - 1.5 ? C[3] : x > hx + 1.5 ? C[1] : C[2]));
  g.line(hx - 3.2, hy - 4.5, hx + 2.8, hy - 4.5, O[1]);
  g.set(hx + 0.5, hy - 4.5, O[2]);
  g.set(pointe[0], pointe[1], C[4]);
  // le contour : encre, plus claire sur l'arête éclairée
  g.outline((x, y, nx, ny) => (ny > 0 && nx > 0 ? C[1] : C[0]));
}

export function draw(p, time, o) {
  const t = shift(time, D, o.seed), C = fit(o.palette, 7), P = fit(o.peau, 4), B = fit(o.barbe, 4), O = fit(o.or, 4), W = fit(o.bois, 3);
  magicien(GRID, C, P, B, O, W, t);
  GRID.draw(p, 1, 0, 0);
  // l'orbe luit et palpite ; des étincelles en montent et s'éteignent
  const ph = (t / D) * TAU, bat = Math.max(0, Math.sin(ph * 2)) ** 2, Y = Math.round(-0.4 + 0.8 * Math.sin(ph));
  const ox = 9.5, oy = -38.6 + Y;
  p.glow(ox, oy, 14 + 6 * bat, O[2], 0.45 + 0.35 * bat);
  p.glow(ox, oy, 4, O[3], 0.3 + 0.3 * bat);
  cycle(t, D, 10, o.seed * 5 + 2, 0.9, (age, L, r, i) => {
    const k = age / L, a = r.range(0, TAU);
    const x = ox + Math.cos(a) * 2.5 + Math.sin(age * 4 + i) * 1.5, y = oy + Math.sin(a) * 2 - age * r.range(10, 18);
    p.dot(x, y, k < 0.4 ? O[3] : O[2], (1 - k) * 1.2);
    p.glow(x, y, 3, O[2], 0.3 * (1 - k));
  });
  const e = wrap(t, D);
  if (e < 0.2) sparkle(p, ox - 1, oy - 1, 1 + 3 * Math.sin((e / 0.2) * Math.PI), O[3], O[2], 0.5 * Math.sin((e / 0.2) * Math.PI));
  // un reflet de l'orbe sur le chapeau et l'épaule
  p.glow(3, -30 + Y, 10, O[1], 0.1 + 0.08 * bat);
}

export function drawBack(p, time, o) {
  const t = shift(time, D, o.seed), C = fit(o.palette, 7), O = fit(o.or, 4);
  shadow(p, 1, 0, 8.5, 1.8, C[0], 0.55);
  const ph = (t / D) * TAU, bat = Math.max(0, Math.sin(ph * 2)) ** 2;
  p.glow(9, -2, 16, O[1], 0.08 + 0.08 * bat);
}

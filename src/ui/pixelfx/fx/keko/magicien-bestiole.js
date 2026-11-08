// LE MAGICIEN BESTIOLE (Keko, après le gobelin bestiole : « c'est beaucoup mieux, et si tu fais le magicien avec
// cette méthode ? ») : le magicien dessiné pixel par pixel, sans le squelette — une robe bleue en cloche dont l'ourlet
// ondule, une ceinture, une longue barbe blanche qui se balance, un chapeau pointu dont la pointe dodeline en
// retard sur le corps, un œil qui cligne, et le bâton tenu devant lui : un orbe d'or qui palpite, luit, et sème des
// étincelles qui montent. Il respire, debout, face à droite. Une boucle pure : tout est fonction de la phase.
//
// IL SERT AUSSI AU JEU (`?magicien`) : `peindreMagicien(p, etat, pal)` le peint dans n'importe quel peintre, au repos,
// EN INCANTATION (le bâton se lève en arrière puis POINTE d'un coup devant lui, l'orbe flambe ; le sort part de
// l'orbe, `positionOrbe`) ou TOUCHÉ (il se cabre, les yeux fermés). L'effet `draw` du banc n'est que le repos en boucle.
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

export const D = meta.duration;
/** L'incantation dure tant ; le sort part à `INCANTE` (quand le bâton pointe). */
export const INCANTATION = 0.75, INCANTE = 0.2;
const GRID = new Grid(-24, -52, 76, 56);
export const palettesMagicien = (o = meta.options) => ({ C: fit(o.palette, 7), P: fit(o.peau, 4), B: fit(o.barbe, 4), O: fit(o.or, 4), W: fit(o.bois, 3) });

/** Le bâton : la main qui le tient, son angle (0 droit, positif penché devant), et l'orbe au bout. */
function baton(q) {
  const main = [8 + q.mainX, -14 + q.Y + q.mainY];
  const dx = Math.sin(q.angle), dy = -Math.cos(q.angle);
  return { main, dx, dy, bas: [main[0] - dx * 15, main[1] - dy * 15], haut: [main[0] + dx * 22, main[1] + dy * 22], orbe: [main[0] + dx * 24.6 + 0.5, main[1] + dy * 24.6] };
}

/** La pose du repos : la respiration, les retards, le bâton droit. */
function poseRepos(ph) {
  // (-0,4 et non -0,5 : l'arrondi de -0,5 donne 0 et celui de -0,57 donne -1 : la boucle sautait d'un pixel à la couture)
  return { Y: Math.round(-0.4 + 0.8 * Math.sin(ph)), retard: Math.round(-0.4 + 0.8 * Math.sin(ph - 0.7)), lean: 0, angle: 0, mainX: 0, mainY: 0, bat: Math.max(0, Math.sin(ph * 2)) ** 2, yeux: true, flambe: 0 };
}
/** La pose de l'incantation (u : secondes depuis le début) : le bâton se lève en arrière, puis pointe d'un coup ; il revient. */
function poseIncantation(u, ph) {
  const r = poseRepos(ph);
  const lisse = (x) => x * x * (3 - 2 * x);
  if (u < 0.14) {
    const k = lisse(u / 0.14);
    return { ...r, angle: -0.5 * k, lean: -1.5 * k, mainX: -2 * k, mainY: -4 * k, flambe: 0.5 * k };
  }
  if (u < 0.45) {
    const k = u < INCANTE ? 1 : 1 - 0.15 * lisse((u - INCANTE) / 0.25);
    return { ...r, angle: 1.15, lean: 2.5 * k, mainX: 5, mainY: -3, flambe: u < INCANTE + 0.12 ? 1 : 0.6, bat: 1 };
  }
  const k = 1 - lisse((u - 0.45) / (INCANTATION - 0.45));
  return { ...r, angle: 1.15 * k, lean: 2.1 * k, mainX: 5 * k, mainY: -3 * k, flambe: 0.4 * k };
}
/** Où est l'orbe (depuis les pieds) à l'instant u de l'incantation : d'où part le sort. */
export function positionOrbe(u = INCANTE) {
  const b = baton(poseIncantation(u, 0));
  return { x: b.orbe[0], y: b.orbe[1] };
}

function magicien(g, pal, t, q) {
  const { C, P, B, O, W } = pal;
  g.clear();
  const Y = q.Y, L = q.lean, retard = q.retard + (L > 0 ? 0 : 0);
  // LE BÂTON, derrière la main : un manche de bois, un orbe d'or au bout, qui palpite (et flambe à l'incantation)
  const b = baton(q);
  g.line(b.bas[0], b.bas[1], b.haut[0], b.haut[1], W[1]);
  g.line(b.bas[0] + 1, b.bas[1], b.haut[0] + 1, b.haut[1], W[0]);
  const bat = 1 + 0.18 * q.bat + 0.25 * q.flambe;
  g.ellipse(b.orbe[0], b.orbe[1], 2.4 * bat, 2.4 * bat, (nx, ny) => (q.flambe > 0.8 ? O[3] : nx * -0.6 + ny * -0.8 > 0.3 ? O[3] : nx * 0.6 + ny * 0.8 > 0.55 ? O[0] : nx * 0.6 + ny * 0.8 > 0.1 ? O[1] : O[2]));
  g.set(b.haut[0], b.haut[1], O[1]); g.set(b.haut[0] + 1, b.haut[1], O[1]);
  // LA ROBE : une cloche des épaules à l'ourlet, trois plis à l'ombre, l'ourlet qui ondule ; penchée avec le corps
  const ourlet = (x) => 1 + 1.2 * lnoise(t, D, 2, x * 0.12, 3);
  g.shade(-9, -21 + Y, 10, 1, (x, y, o) => {
    const h = -(y - Y);
    if (h < -0.5 || h > 21) return 0;
    const xx = x - L * (h / 21);
    const demi = h > 17 ? 3.6 : 3.6 + (17 - h) * 0.19;
    const bas = ourlet(x);
    if (h < bas - 1) return 0;
    if (Math.abs(xx - 0.3) > demi) return 0;
    const u = (xx - 0.3) / demi;
    let i = u < -0.55 ? 2 : u > 0.6 ? 2 : 3;
    if (u < -0.1 && u > -0.35 && h < 16) i = 2;
    if (u > 0.25 && u < 0.45 && h < 14) i = 2;
    if (u < -0.8 || (h < bas + 0.6 && u > -0.6)) i = 1;
    if (u > -0.5 && u < -0.1 && h > 14) i = 4;
    o.a = 1;
    return C[i];
  });
  // la ceinture, une boucle d'or
  g.ellipse(0.3 + L * 0.5, -11.5 + Y, 4.1, 1.2, (nx, ny) => (ny < -0.2 ? W[2] : W[1]));
  g.set(2 + L * 0.5, -12 + Y, O[2]); g.set(3 + L * 0.5, -12 + Y, O[1]);
  // la manche et la main qui tiennent le bâton
  const ep = [2 + L, -19 + Y], m = b.main;
  g.poly([[ep[0], ep[1]], [ep[0] + 2, ep[1] - 1], [m[0], m[1] - 1.5], [m[0] - 1, m[1] + 1.5], [ep[0] + 1, ep[1] + 5]], C[3]);
  g.line(ep[0] + 1, ep[1] + 5, m[0] - 1, m[1] + 1.5, C[1]);
  g.ellipse(m[0] + 0.5, m[1], 1.6, 1.4, P[2]);
  g.set(m[0] + 1, m[1] - 1, P[1]);
  // LA BARBE : une longue pointe qui pend du menton et se balance
  const barbe = 0.8 * Math.sin((t / D) * TAU - 1.2) + L * 0.3;
  g.poly([[-1.5 + L, -22 + retard], [4.5 + L, -22 + retard], [2.5 + L + barbe, -17 + retard], [0.8 + L * 0.5 + barbe * 1.6, -9 + retard]], B[2]);
  g.line(-1 + L, -21 + retard, 0.3 + L * 0.5 + barbe * 1.6, -10 + retard, B[1]);
  g.line(3.5 + L, -21 + retard, 1.5 + L + barbe, -16 + retard, B[3]);
  // LA TÊTE : la peau, le nez, l'œil
  const hx = 1.5 + L * 1.2, hy = -24.5 + retard;
  g.ellipse(hx, hy, 3.3, 3, (nx, ny) => (nx * -0.6 + ny * -0.8 > 0.35 ? P[3] : nx * 0.6 + ny * 0.8 > 0.55 ? P[1] : P[2]));
  g.ellipse(hx + 3.4, hy + 0.8, 1.3, 1, P[2]);
  g.set(hx + 4, hy + 1, P[1]);
  const cligne = !q.yeux || (wrap(t, D) > D * 0.56 && wrap(t, D) < D * 0.6);
  g.set(hx + 1.5, hy - 0.5, P[0]);
  if (!cligne) g.set(hx + 1.5, hy - 1.5, C[6]);
  g.set(hx + 0.5, hy - 2.5, B[3]); g.set(hx + 1.5, hy - 2.5, B[3]); g.set(hx + 2.5, hy - 2.5, B[2]);
  // LE CHAPEAU : un bord large, un cône qui penche en arrière, une bande d'or, la pointe qui dodeline
  g.ellipse(hx - 0.5, hy - 3.2, 7.2, 1.5, (nx, ny) => (ny < -0.3 ? C[3] : C[1]));
  const dodeline = 1.2 * Math.sin((t / D) * TAU - 1.6) - L * 0.8;
  const pointe = [hx - 7 + dodeline, hy - 17];
  const coude = [hx - 2.5 + dodeline * 0.4, hy - 12];
  g.poly([[hx - 3.8, hy - 3.6], [hx + 3.4, hy - 3.6], [coude[0] + 1.6, coude[1]], pointe, [coude[0] - 1.2, coude[1] + 0.5]], (x) => (x < hx - 1.5 ? C[3] : x > hx + 1.5 ? C[1] : C[2]));
  g.line(hx - 3.2, hy - 4.5, hx + 2.8, hy - 4.5, O[1]);
  g.set(hx + 0.5, hy - 4.5, O[2]);
  g.set(pointe[0], pointe[1], C[4]);
  g.outline((x, y, nx, ny) => (ny > 0 && nx > 0 ? C[1] : C[0]));
  return b;
}

/**
 * Peint le magicien dans le peintre `p` (placé par l'appelant : ses pieds à l'origine, `flip` pour qu'il regarde à
 * gauche). etat : { t, incante (secondes depuis le début de l'incantation, ou null), touche (vrai : il encaisse),
 * ombre }. Rend la position de l'orbe.
 */
export function peindreMagicien(p, etat, pal) {
  const t = etat.t ?? 0, ph = (t / D) * TAU;
  let q = etat.incante !== undefined && etat.incante !== null && etat.incante < INCANTATION ? poseIncantation(etat.incante, ph) : poseRepos(ph);
  if (etat.touche) q = { ...q, lean: -2.5, yeux: false, retard: q.retard - 1 };
  if (etat.ombre !== false) shadow(p, 1 + q.lean * 0.3, 0, 8.5, 1.8, pal.C[0], 0.55);
  const b = magicien(GRID, pal, t, q);
  GRID.draw(p, etat.alpha ?? 1, 0, 0);
  // l'orbe luit et palpite ; des étincelles en montent et s'éteignent ; à l'incantation, il flambe
  const { O } = pal, ox = b.orbe[0], oy = b.orbe[1], k = q.bat * 0.35 + q.flambe * 0.9;
  p.glow(ox, oy, 14 + 6 * q.bat + 8 * q.flambe, O[2], 0.45 + k * 0.8);
  p.glow(ox, oy, 4 + 4 * q.flambe, O[3], 0.3 + k * 0.6);
  cycle(t, D, 10, 7, 0.9, (age, L, r, i) => {
    const kk = age / L, a = r.range(0, TAU);
    const x = ox + Math.cos(a) * 2.5 + Math.sin(age * 4 + i) * 1.5, y = oy + Math.sin(a) * 2 - age * r.range(10, 18);
    p.dot(x, y, kk < 0.4 ? O[3] : O[2], (1 - kk) * 1.2);
    p.glow(x, y, 3, O[2], 0.3 * (1 - kk));
  });
  if (q.flambe > 0.8) sparkle(p, ox, oy, 5, O[3], O[2], 0.6);
  else {
    const e = wrap(t, D);
    if (e < 0.2) sparkle(p, ox - 1, oy - 1, 1 + 3 * Math.sin((e / 0.2) * Math.PI), O[3], O[2], 0.5 * Math.sin((e / 0.2) * Math.PI));
  }
  p.glow(3, -30 + q.Y, 10, O[1], 0.1 + 0.08 * q.bat);
  return { x: ox, y: oy };
}

export function draw(p, time, o) {
  const t = shift(time, D, o.seed);
  peindreMagicien(p, { t, ombre: false }, palettesMagicien(o));
}

export function drawBack(p, time, o) {
  const t = shift(time, D, o.seed), C = fit(o.palette, 7), O = fit(o.or, 4);
  shadow(p, 1, 0, 8.5, 1.8, C[0], 0.55);
  const ph = (t / D) * TAU, bat = Math.max(0, Math.sin(ph * 2)) ** 2;
  p.glow(9, -2, 16, O[1], 0.08 + 0.08 * bat);
}

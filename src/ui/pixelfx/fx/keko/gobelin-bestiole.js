// LE GOBELIN BESTIOLE (Keko : « tu essaies de créer un gobelin avec cette méthode ? ») : un gobelin dessiné pixel par
// pixel comme les bestioles du dépôt (la grille de critters/_lib.js, des volumes ombrés, un contour), SANS le squelette :
// un petit gobelin voûté qui trotte sur place, une massue sur l'épaule, les oreilles qui battent à chaque pas, l'œil
// jaune qui guette, la poussière sous les pieds. Les jambes et les bras sont calculés : deux segments par membre, le
// pied qui se lève en passant devant, le corps qui rebondit, la tête qui suit avec un temps de retard.
//
// IL SERT AUSSI AU JEU (`?magicien`) : `peindreGobelin(p, etat, pal)` le peint dans n'importe quel peintre, en marche
// (une phase de pas) ou À L'ATTAQUE (une phase de coup : la garde, l'élan de la massue en arrière, le coup qui tombe
// devant), teinté d'un état (gelé, brûlé, affaibli, touché). L'effet `draw` du banc n'est que la marche en boucle.
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

export const D = meta.duration;
const GRID = new Grid(-22, -36, 48, 40);
/** La lumière vient d'en haut à gauche : le ton d'un volume d'après sa normale. */
const ton = (C, nx, ny) => (nx * -0.6 + ny * -0.8 > 0.4 ? C[4] : nx * 0.6 + ny * 0.8 > 0.5 ? C[2] : C[3]);
/** Les palettes de l'effet, prêtes pour le peintre (à partir des options du banc ou des siennes). */
export const palettesGobelin = (o = meta.options) => ({ C: fit(o.palette, 7), K: fit(o.cuir, 4), E: fit(o.oeil, 3) });

/** Une patte à deux segments : la hanche, le genou plié vers l'arrière, le pied. ph : la phase du pas de CETTE patte. */
function patte(ph) {
  const balance = Math.sin(ph);
  const x = balance * 3.6;
  const leve = Math.max(0, Math.cos(ph)) * 3;
  const hanche = [0, -9], pied = [x, -leve];
  const mx = (hanche[0] + pied[0]) / 2, my = (hanche[1] + pied[1]) / 2;
  return { hanche, genou: [mx - 1.6 - leve * 0.4, my + 0.4], pied };
}
/** Une patte plantée : le pied à x, le genou un peu en arrière. */
const plantee = (x) => ({ hanche: [0, -9], genou: [x * 0.4 - 1.4, -4.6], pied: [x, 0] });

/**
 * La pose d'un pas (ph : la phase, deux pas par 2π) : le rebond du corps, le retard de la tête, les deux pattes, le
 * balancement du bras et de la massue, le battement des oreilles.
 */
function poseMarche(ph) {
  return {
    Y: Math.round(-0.8 + 0.9 * Math.cos(ph)),
    tete: Math.round(-0.8 + 0.9 * Math.cos(ph - 0.9)),
    lean: 0,
    loin: patte(ph + Math.PI),
    pres: patte(ph),
    bras: Math.sin(ph + Math.PI) * 2.8,
    brasY: Math.max(0, -Math.sin(ph)) * 0.8,
    massue: -0.25 + 0.06 * Math.sin(ph - 0.6),
    flop: Math.sin(ph - 0.5) * 1.4,
  };
}
/**
 * La pose d'un coup (a : 0 au début de la garde, 1 à la fin du coup) : les pieds plantés, la massue qui part en
 * arrière pendant l'élan (le corps se cabre), tombe devant d'un coup (le corps plonge), puis revient.
 */
function poseAttaque(a) {
  const lisse = (x) => x * x * (3 - 2 * x);
  let massue = -0.25, lean = 0, Y = 0, bras = 1.5, flop = 0;
  if (a < 0.62) (massue = -0.25 - 0.1 * Math.sin(a * 12)), (bras = 1.5);
  else if (a < 0.82) {
    const u = lisse((a - 0.62) / 0.2);
    massue = -0.25 - 1.1 * u;
    lean = -1.5 * u;
    Y = -Math.round(u);
    bras = 1.5 - 3 * u;
    flop = -1.5 * u;
  } else if (a < 0.9) {
    massue = 1.6;
    lean = 2.5;
    Y = 1;
    bras = 5;
    flop = 2;
  } else {
    const u = lisse((a - 0.9) / 0.1);
    massue = 1.6 - 1.85 * u;
    lean = 2.5 - 2.5 * u;
    Y = Math.round(1 - u);
    bras = 5 - 3.5 * u;
    flop = 2 - 2 * u;
  }
  return { Y, tete: Y, lean, loin: plantee(-3.5), pres: plantee(3.5), bras, brasY: 0, massue, flop };
}

/** Le gobelin dans la grille, d'après une pose. t sert au clin d'œil. */
function gobelin(g, C, K, E, t, q) {
  g.clear();
  const Y = q.Y, L = q.lean;
  const membre = (p, c, cFonce) => {
    g.tube([[p.hanche[0] + L * 0.3, p.hanche[1] + Y], [p.genou[0], p.genou[1] + Y]], 1.4, (u, v) => (v > 0.6 ? cFonce : c));
    g.tube([[p.genou[0], p.genou[1] + Y], [p.pied[0], p.pied[1] - 0.5]], 1.05, (u, v) => (v > 0.6 ? cFonce : c));
    for (let i = -1; i <= 2; i++) g.set(p.pied[0] + i, p.pied[1], i === 2 ? cFonce : c);
    g.set(p.pied[0], p.pied[1] - 1, c);
    g.set(p.pied[0] + 1, p.pied[1] - 1, c);
  };
  // la patte lointaine et le bras lointain (qui porte la massue) : plus sombres, derrière le corps
  membre(q.loin, C[2], C[1]);
  const epauleF = [-1 + L * 0.6, -15 + Y];
  const mainF = [-3.5 + L * 0.6 + Math.min(1.2, q.bras * 0.4), -11 + Y + Math.max(0, -q.bras) * 0.6];
  g.tube([epauleF, mainF], 1, C[2]);
  // la massue : un manche de cuir et une tête noueuse, tenue dans la main lointaine, à l'angle de la pose
  const dx = Math.sin(q.massue), dy = -Math.cos(q.massue);
  const bout = [mainF[0] + dx * 13, mainF[1] + dy * 13];
  g.line(mainF[0], mainF[1], bout[0], bout[1], K[1]);
  g.line(mainF[0] + 1, mainF[1], bout[0] + 1, bout[1], K[2]);
  g.ellipse(bout[0] + dx * 1.5, bout[1] + dy * 1.5, 2.6, 2.2, (nx, ny) => (nx * -0.6 + ny * -0.8 > 0.4 ? K[3] : nx * 0.6 + ny * 0.8 > 0.5 ? K[0] : K[1]));
  g.set(bout[0] + dx * 1.5 - 0.5, bout[1] + dy * 1.5 - 1, K[3]);
  // le pagne et le torse voûté : un ventre rond penché en avant
  g.ellipse(0.5 + L * 0.6, -12.5 + Y, 3.8, 4.6, (nx, ny) => ton(C, nx + 0.2, ny));
  g.ellipse(0.5 + L * 0.3, -9.2 + Y, 3.9, 1.7, (nx, ny) => (ny < -0.2 ? K[2] : K[1]));
  g.set(2 + L * 0.3, -9 + Y, K[3]);
  // la patte proche, puis le bras proche
  membre(q.pres, C[3], C[2]);
  const epaule = [2 + L * 0.6, -15 + Y];
  const main = [2 + L * 0.6 + q.bras, -10.5 + Y + q.brasY];
  const coude = [(epaule[0] + main[0]) / 2 + 1.2, (epaule[1] + main[1]) / 2];
  g.tube([epaule, coude, main], 1.1, (u, v) => (v > 0.6 ? C[2] : C[3]));
  g.ellipse(main[0], main[1] + 0.5, 1.4, 1.2, C[3]);
  // la tête : grosse, en avant du corps, le nez, l'œil, la bouche
  const hx = 3.5 + L * 1.4, hy = -19.5 + q.tete;
  const flop = q.flop;
  g.poly([[hx - 2, hy - 1], [hx - 9, hy - 5 + flop], [hx - 1.5, hy + 1.5]], C[2]);
  g.poly([[hx - 1, hy - 2], [hx - 8.5, hy - 7 + flop], [hx - 0.5, hy + 0.5]], C[3]);
  g.line(hx - 2, hy - 2.5, hx - 7, hy - 6 + flop, C[4]);
  g.ellipse(hx, hy, 4.3, 3.9, (nx, ny) => ton(C, nx, ny));
  g.ellipse(hx + 4.6, hy + 0.6, 1.7, 1.1, (nx, ny) => (nx * -0.6 + ny * -0.8 > 0.2 ? C[4] : C[3]));
  const cligne = wrap(t, D) > D * 0.82 && wrap(t, D) < D * 0.9;
  if (cligne) g.set(hx + 1, hy - 1, C[1]), g.set(hx + 2, hy - 1, C[1]);
  else {
    g.set(hx + 1, hy - 1.5, E[1]); g.set(hx + 2, hy - 1.5, E[1]); g.set(hx + 1, hy - 0.5, E[1]); g.set(hx + 2, hy - 0.5, E[1]);
    g.set(hx + 2, hy - 0.5, E[0]);
    g.set(hx + 1, hy - 1.5, E[2]);
  }
  g.set(hx + 1, hy + 2, C[1]); g.set(hx + 2, hy + 2, C[1]); g.set(hx + 3, hy + 2, C[1]);
  g.set(hx + 2, hy + 3, C[6]);
  g.outline((x, y, nx, ny) => (ny > 0 && nx > 0 ? C[1] : C[0]));
}

/** Un mélange de deux couleurs du peintre (ABGR), k vers b. */
function mele(a, b, k) {
  const ar = a & 255, ag = (a >>> 8) & 255, ab = (a >>> 16) & 255, br = b & 255, bg = (b >>> 8) & 255, bb = (b >>> 16) & 255;
  return (255 << 24) | (Math.round(ab + (bb - ab) * k) << 16) | (Math.round(ag + (bg - ag) * k) << 8) | Math.round(ar + (br - ar) * k);
}

/**
 * Peint le gobelin dans le peintre `p` (placé par l'appelant : ses pieds à l'origine, `flip` pour qu'il regarde à
 * gauche). etat : { t (le temps, pour le clin d'œil), marche (la phase du pas, 0..1, deux pas), attaque (la phase du
 * coup, 0..1), teinte, k (0..1 : les couleurs tirées vers la teinte, le contour épargné), alpha, ombre }.
 */
export function peindreGobelin(p, etat, pal) {
  const { C, K, E } = pal;
  const q = etat.attaque !== undefined && etat.attaque !== null ? poseAttaque(etat.attaque) : poseMarche((etat.marche ?? 0) * TAU * 2);
  if (etat.ombre !== false) shadow(p, 1, 0, 7.5 + (etat.marche !== undefined && etat.marche !== null ? Math.abs(Math.sin(etat.marche * TAU * 2)) * 1.2 : 1), 1.6, C[0], 0.5);
  gobelin(GRID, C, K, E, etat.t ?? 0, q);
  if (etat.k > 0) GRID.recolor((x, y, c, a, tag) => (tag === 255 ? c : mele(c, etat.teinte, etat.k)));
  GRID.draw(p, etat.alpha ?? 1, 0, 0);
  return q;
}

export function draw(p, time, o) {
  const t = shift(time, D, o.seed), pal = palettesGobelin(o);
  peindreGobelin(p, { t, marche: t / D, ombre: false }, pal);
  // la poussière : une bouffée à chaque pas, qui part vers l'arrière et se dissipe
  cycle(t, D, 6, o.seed * 7 + 3, 0.3, (age, L, r, i) => {
    const k = age / L, x = -2 + (i % 2 ? 3 : -3) - age * r.range(10, 22), y = -1 - age * r.range(4, 9) + 8 * age * age;
    p.dot(x, Math.min(-1, y), k < 0.5 ? pal.K[3] : pal.K[2], (1 - k) * 0.9);
  });
  const g = wrap(t, D);
  if (g < 0.12) p.glow(4.5, -21, 4, pal.E[1], 0.35 * (1 - g / 0.12));
}

export function drawBack(p, time, o) {
  const t = shift(time, D, o.seed), C = fit(o.palette, 7);
  shadow(p, 1, 0, 7.5 + Math.abs(Math.sin((t / D) * TAU * 2)) * 1.2, 1.6, C[0], 0.5);
}

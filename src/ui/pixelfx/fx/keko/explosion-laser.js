// L'EXPLOSION D'ÉNERGIE DU COUP CRITIQUE DU CANON LASER (Keko, 23/11 : « quand un laser fait un coup critique, on
// déclenche une explosion dans la zone ; cherche dans la bibliothèque de pixelfx un effet qui pourrait correspondre à une
// explosion d'énergie ou de laser, fais-moi quelque chose de joli »). C'est `explosions/plasma-explosion` — une explosion
// d'énergie sans fumée : un éclair blanc, une boule d'énergie qui gonfle en une coquille de plus en plus fine, des anneaux
// de choc, des arcs qui crépitent — À LA TAILLE DU JEU (`size` : 1 donne l'effet du dépôt, une boule de 35 et des anneaux
// de 92 ; le jeu la règle sur le rayon de l'explosion) et AUX COULEURS DU LASER VERT : le cœur blanc, la boule verte, la
// lisière d'un vert d'émeraude profond.
// La libération (éclair, anneaux, éclat, lumière) et les arcs sont adaptés de l'énergie libre de Sprite Fusion
// (https://www.spritefusion.com/pixel-art-vfx/energy), MIT License, Copyright (c) 2026 Hugo Duprez.
import { Particles, Lights, P, Rng, rng, fit, band, bolt, forks, flare, clamp, smooth, ease, noise, TAU, WHITE } from "pixelfx";
import { cull } from "pixelfx/fx/explosions/_lib";

export const meta = {
  name: "Explosion du laser",
  desc: "L'explosion de plasma du dépôt, en vert laser et à la taille du jeu : un éclair blanc, une boule d'énergie qui gonfle en coquille, des anneaux de choc, des arcs qui crépitent.",
  tags: ["keko", "explosion", "énergie", "laser", "critique", "one-shot"],
  size: [160, 160],
  origin: [80, 80],
  duration: 1.2,
  loop: false,
  fps: 30,
  bg: "dark",
  options: {
    palette: ["#04200a", "#0a5a1c", "#16a032", "#36d856", "#8dffa0", "#d8ffe0", "#ffffff"],
    accent: ["#021808", "#0a4a2a", "#14806a", "#5ae8b8", "#c8fff0"],
    size: 0.45,
    seed: 7,
  },
};

const BALL = 0.5;

export function create(o) {
  const C = fit(o.palette, 7), V = fit(o.accent, 5), R = new Rng(o.seed), S = o.size;
  const shell = (t) => S * (5 + 30 * ease.outCubic(clamp(t / BALL)));
  const ps = new Particles({ rng: R, sparks: [C[6], C[5], C[4], V[3]] }), lights = new Lights();
  lights.add(0, 0, 96 * S, C[4], 1, 0.5);
  lights.add(0, 0, 40 * S, WHITE, 0.9, 0.1);
  lights.add(0, 0, 70 * S, V[2], 0.5, 0.9);
  for (let i = 0; i < Math.round(46 * Math.min(1, S + 0.3)); i++) {
    const a = R.range(0, TAU), sp = R.range(140, 360) * S;
    ps.spawn(P.MOTE, Math.cos(a) * 4 * S, Math.sin(a) * 4 * S, Math.cos(a) * sp, Math.sin(a) * sp, R.range(0.2, 0.42), R.pick([C[6], C[5], C[4], V[3]]), R.range(0.7, 1.1));
  }
  for (let i = 0; i < Math.round(26 * Math.min(1, S + 0.3)); i++) {
    const a = R.range(0, TAU), sp = R.range(40, 140) * S;
    ps.spawn(P.FLAKE, Math.cos(a) * 10 * S, Math.sin(a) * 10 * S, Math.cos(a) * sp, Math.sin(a) * sp, R.range(0.5, 1.1), R.pick([C[5], V[3], V[4]]), R.range(0.6, 1.6));
  }
  let t = 0;
  return {
    update(dt) {
      t += dt;
      // (la coquille perd des étincelles en s'amincissant)
      if (t > 0.12 && t < 0.8 && R.chance(30 * dt)) {
        const a = R.range(0, TAU), r = shell(t);
        ps.spawn(P.STAR, Math.cos(a) * r, Math.sin(a) * r, Math.cos(a) * R.range(10, 40) * S, Math.sin(a) * R.range(10, 40) * S, R.range(0.3, 0.6), R.chance(0.5) ? C[5] : V[4], R.range(0.5, 1.8));
      }
      ps.update(dt);
      cull(ps, -meta.origin[0] + 3, -meta.origin[1] + 3, meta.size[0] - meta.origin[0] - 3, meta.size[1] - meta.origin[1] - 3);
      lights.update(dt);
    },
    drawBack(p) {
      tilted(p, t, C, V, S, true);
    },
    draw(p) {
      // (la boule : un cœur blanc, des bandes vertes qui tournent, une lisière d'émeraude qui bout ; elle gonfle, puis se creuse)
      if (t < BALL) {
        const u = t / BALL, r = shell(t), hollow = smooth(0.35, 1, u), boil = Math.floor(t * 20);
        p.shade(-r - 3, -r - 3, r + 3, r + 3, (x, y, out) => {
          const d = Math.hypot(x, y), a = Math.atan2(y, x), edge = r * (1 + 0.1 * noise(a * 3 + boil * 0.7, 3));
          if (d > edge) return;
          const v = d / edge;
          if (v < hollow * 0.92) return;
          const n = noise(a * 4 + (d / S) * 0.25 + boil * 0.5, 5), w = v + n * 0.14, fil = Math.abs(Math.sin(a * 5 + (d / S) * 0.32 - t * 14 + n * 2.5)) < 0.1;
          out.k = 0.25 * (1 - u);
          if (v > 0.9) return V[2];
          if (fil && v > 0.3) return u < 0.5 ? WHITE : C[5];
          return w < 0.32 - u * 0.25 ? WHITE : w < 0.52 ? C[5] : w < 0.72 ? C[4] : w < 0.86 ? (u < 0.5 ? C[3] : V[3]) : V[2];
        });
        p.glow(0, 0, r * 1.6 + 6 * S, C[4], 0.6 * (1 - u));
      }
      if (t < 0.07) p.circle(0, 0, (9 - t * 60) * Math.max(0.6, S), WHITE);
      if (t < 0.25) flare(p, 0, 0, 52 * S * Math.pow(1 - t / 0.25, 1.3), 1 - t / 0.25, C);
      // (les anneaux de choc : un rapide et clair, un plus lent, d'émeraude)
      const u1 = t / 0.42;
      if (u1 < 1) {
        p.ring(0, 0, S * (8 + 84 * ease.outCubic(u1)), Math.max(1, 3 * (1 - u1)), u1 < 0.25 ? WHITE : C[5], 1.15 - u1);
        p.glowRing(0, 0, S * (8 + 84 * ease.outCubic(u1)), 5 * S, C[4], 0.35 * (1 - u1));
      }
      const u2 = (t - 0.06) / 0.6;
      if (u2 > 0 && u2 < 1) p.ring(0, 0, S * (6 + 60 * ease.outCubic(u2)), Math.max(1, 2 * (1 - u2)), V[3], 1.1 - u2);
      // (les arcs qui crépitent hors du cœur, refrappés toutes les quelques images, plus courts à mesure que la charge s'épuise)
      const left = 1 - smooth(0.12, 0.7, t), strike = Math.floor(t * 18);
      if (left > 0) {
        const r = rng(o.seed, strike, 17), n = 2 + Math.round(4 * left);
        for (let i = 0; i < n; i++) {
          const a = r.range(0, TAU), L = r.range(26, 58) * S * (0.45 + 0.55 * left), path = bolt(r, 0, 0, Math.cos(a) * L, Math.sin(a) * L, { jag: 0.28, depth: 4 });
          arc(p, path, C, V, 0.8 * left);
          if (r.chance(0.5)) for (const f of forks(r, path, { count: 1, len: 14 * S, jag: 0.35 })) arc(p, f, C, V, 0.5 * left);
        }
        const rs = shell(t);
        for (let i = 0; i < 3; i++) {
          const a = r.range(0, TAU), b = a + r.range(0.3, 0.6);
          arc(p, bolt(r, Math.cos(a) * rs, Math.sin(a) * rs, Math.cos(b) * rs, Math.sin(b) * rs, { jag: 0.4, depth: 3 }), C, V, 0.6 * left);
        }
      }
      tilted(p, t, C, V, S, false);
      ps.draw(p);
      lights.draw(p);
    },
  };
}

// un anneau sur un plan penché qui file autour de l'explosion : la moitié lointaine derrière, la proche devant
function tilted(p, t, C, V, S, back) {
  const u = (t - 0.03) / 0.5;
  if (u <= 0 || u >= 1) return;
  band(p, 0, 4 * S, S * (12 + 86 * ease.outCubic(u)), 0.28, Math.max(1, 4 * (1 - u)), 1.15 - u, [V[1], V[2], C[4], C[5]], (g) => (Math.sin(g) < 0) === back, u < 0.15);
}

// un arc : une lueur le long, un halo vert, un cœur blanc
function arc(p, path, C, V, k) {
  if (k <= 0.05) return;
  for (let i = 1; i < path.length; i++) {
    const [ax, ay] = path[i - 1], [bx, by] = path[i];
    p.glowLine(ax, ay, bx, by, 5, V[2], 0.18 * k);
    p.line(ax + 1, ay, bx + 1, by, C[4], k * 0.8);
    p.line(ax, ay, bx, by, i < path.length * 0.6 ? WHITE : C[5], Math.min(1, k * 1.4));
  }
}

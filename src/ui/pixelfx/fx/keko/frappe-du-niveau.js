// LA FRAPPE DU NIVEAU, en pixel art : l'étoile d'or de la fusion entre par le bord en arc, frappe la carte
// (une image blanche, un éclair à quatre branches, une onde qui se brise en arcs, une gerbe d'étincelles d'or
// qui retombent et rebondissent), et l'étoile du nouveau niveau reste, cernée de blanc, puis s'éteint.
// Les recettes de l'éclair et de l'onde brisée viennent des impacts du dépôt (impacts/_lib.js).
import { Particles, Lights, P, Rng, PAL, fit, star as etoile, clamp, ease, TAU, WHITE } from "pixelfx";
import { star as eclair, brokenRing, spikes } from "pixelfx/fx/impacts/_lib";

/** La durée du vol (= l'instant de la frappe) et l'instant où l'étoile posée commence à s'éteindre. */
const VOL = 0.34, FRAPPE = VOL, REPOS = 1.25;

export const meta = {
  name: "Frappe du niveau",
  desc: "L'étoile d'or de la fusion arrive en arc par la gauche et frappe : flash blanc, éclair, onde brisée, gerbe d'or qui rebondit ; l'étoile du niveau reste puis s'éteint.",
  tags: ["keko", "fusion", "étoile", "or", "impact", "one-shot"],
  size: [200, 120],
  origin: [104, 104],
  duration: 1.7,
  loop: false,
  fps: 30,
  bg: "ground",
  options: { palette: PAL.gold, height: 44, seed: 5 },
};

export function create(o) {
  const C = fit(o.palette, 8), R = new Rng(o.seed), X = 0, Y = -o.height, sol = () => 0;
  const ps = new Particles({ rng: R, ground: sol, sparks: [WHITE, C[6], C[5], C[4]] });
  const lumieres = new Lights();
  // le vol : une courbe de Bézier du bord gauche, haut, qui plonge vers le point frappé
  const D = [-86, Y - 46], M = [-40, Y - 58];
  const pos = (u) => {
    const v = 1 - u;
    return [v * v * D[0] + 2 * v * u * M[0] + u * u * X, v * v * D[1] + 2 * v * u * M[1] + u * u * Y];
  };
  const avancee = (tt) => ease.inQuad(clamp(tt / VOL));
  const pointes = spikes(R, 8, -0.5, { len: [12, 16], w: [1.8, 2.4], fwd: 0.9, back: 0.3, jag: 0.45 });
  const segs = Array.from({ length: 7 }, (_, i) => ({ a: (i / 7) * TAU + R.range(-0.1, 0.1), gap: R.range(0.5, 0.8), dr: R.range(0.1, 0.4) }));
  let t = 0, frappe = false;

  function frapper() {
    frappe = true;
    lumieres.add(X, Y, 64, C[5], 0.7, 0.45);
    lumieres.add(X, Y, 24, WHITE, 0.9, 0.08);
    // la gerbe : des étincelles d'or jetées vers le haut et la droite (l'étoile venait de la gauche), qui retombent
    for (let i = 0; i < 30; i++) {
      const a = -Math.PI / 2 + R.range(-0.9, 1.2), v = R.range(120, 300);
      ps.spawn(P.SPARK, X + R.range(-2, 2), Y + R.range(-2, 2), Math.cos(a) * v, Math.sin(a) * v, R.range(0.5, 0.95), WHITE, 1, i > 20 ? R.range(0.02, 0.08) : 0);
    }
    for (let i = 0; i < 10; i++) {
      const a = R.range(0, TAU), v = R.range(40, 120);
      ps.spawn(P.MOTE, X, Y, Math.cos(a) * v, Math.sin(a) * v - 25, R.range(0.3, 0.6), R.pick([C[6], C[7]]), 0.6, R.range(0, 0.05));
    }
    for (let i = 0; i < 5; i++) {
      const a = R.range(0, TAU), d = R.range(10, 28);
      ps.spawn(P.STAR, X + Math.cos(a) * d, Y + Math.sin(a) * d, 0, -4, R.range(0.25, 0.45), WHITE, R.range(1.5, 2.6), R.range(0.08, 0.35));
    }
  }

  /** L'étoile à cinq branches du niveau : or, cernée de blanc, un éclat au cœur. */
  function etoileDuNiveau(p, x, y, r, k) {
    if (r < 1.5) return;
    p.poly(etoile(x, y, r + 1.4, r * 0.5 + 1.2, 5), WHITE, k);
    p.poly(etoile(x, y, r, r * 0.5, 5), C[4], k);
    p.poly(etoile(x - 0.6, y - 0.6, r * 0.62, r * 0.3, 5), C[5], k);
    p.dot(x - 1, y - 1, C[6], k);
    p.glow(x, y, r * 2.4, C[5], 0.35 * k);
  }

  return {
    update(dt) {
      t += dt;
      if (!frappe && t >= FRAPPE) frapper();
      if (!frappe) {
        // l'étoile en vol sème des paillettes
        const [x, y] = pos(avancee(t));
        if (R.chance(0.6)) ps.spawn(P.STAR, x + R.range(-1, 1), y + R.range(-1, 1), R.range(-10, 10), R.range(-6, 6), R.range(0.3, 0.6), R.pick([WHITE, C[6], C[5]]), R.range(0.5, 1.4));
      }
      ps.update(dt);
      lumieres.update(dt);
    },
    drawBack(p) {
      // le sol s'éclaire à la frappe
      const k = frappe ? clamp(1 - (t - FRAPPE) / 0.6) : 0;
      if (k > 0) p.glow(X, -1, 44, C[4], 0.18 * k);
      ps.draw(p, "back");
    },
    draw(p) {
      if (!frappe) {
        // le vol : une traînée effilée, blanche à la tête, qui s'éteint dans l'or
        const u = avancee(t), n = 18, TR = 0.16;
        for (let k = n; k >= 1; k--) {
          const ta = t - (k * TR) / n, tb = t - ((k - 1) * TR) / n;
          if (ta < 0) continue;
          const [ax, ay] = pos(avancee(ta)), [bx, by] = pos(avancee(tb)), q = k / n;
          p.line(ax, ay, bx, by, q < 0.15 ? WHITE : q < 0.45 ? C[6] : q < 0.75 ? C[5] : C[4], 1.3 - q);
          if (q < 0.5) p.line(ax, ay + 1, bx, by + 1, q < 0.2 ? C[6] : C[5], 1 - q * 1.6);
          if (k % 3 === 0) p.glow(ax, ay, 6 * (1 - q) + 2, C[5], 0.3 * (1 - q));
        }
        const [x, y] = pos(u), r = 4 + 1.5 * u;
        etoileDuNiveau(p, x, y, r, 1);
        p.glow(x, y, 16, C[5], 0.6);
        p.glow(x, y, 5, WHITE, 0.35);
        return;
      }
      const s = t - FRAPPE;
      // l'onde : part de l'éclair et se brise en arcs qui s'éloignent et refroidissent
      const u = (s - 0.03) / 0.38;
      if (u >= 0 && u < 1) {
        const r = 8 + 28 * ease.outCubic(u), brk = clamp((u - 0.15) / 0.45), i = u < 0.15 ? 7 : u < 0.35 ? 6 : u < 0.6 ? 5 : 4;
        brokenRing(p, X, Y, r, Math.max(1, 2.6 * Math.pow(1 - u, 1.2)), segs, brk, C[i], C[Math.max(3, i - 2)], u < 0.6 ? 1 : (1 - u) / 0.4, 1, 0);
        if (u < 0.5) p.glowRing(X, Y, r, 5, C[5], 0.3 * (1 - u / 0.5));
      }
      ps.draw(p, "front");
      // l'image blanche : un disque plein qui se contracte, l'instant de la frappe
      if (s < 0.05) p.circle(X, Y, 9 * (1 - s / 0.05) + 2, WHITE);
      // l'éclair : blanc une image, puis plus grand et or en s'amincissant, puis un reflet
      if (s < 0.03) eclair(p, X, Y, pointes, 1, 1, [C[5], WHITE, WHITE, WHITE], 1, 2.8);
      else if (s < 0.065) eclair(p, X, Y, pointes, 1.3, 0.65, [C[3], C[6], C[7], WHITE], 1, 2.8);
      else if (s < 0.1) eclair(p, X, Y, pointes, 1.45, 0.3, [C[3], C[5], C[6], C[7]], 1, 2.2);
      const pop = Math.exp(-s / 0.05);
      if (pop > 0.02) {
        p.glow(X, Y, 34, C[5], 0.5 * pop);
        p.glow(X, Y, 12, WHITE, 0.45 * pop);
      }
      // l'étoile du niveau reste : elle bondit en se posant, respire, puis s'éteint d'un éclat avant la fin
      if (s > 0.065) {
        const arrivee = ease.outBack(clamp((s - 0.065) / 0.22), 2.2), fin = clamp((t - REPOS) / (meta.duration - REPOS - 0.05));
        const r = (7.5 + 0.5 * Math.sin(s * 9)) * arrivee * (1 - ease.inQuad(fin));
        etoileDuNiveau(p, X, Y, r, 1 - fin * 0.4);
        if (fin > 0.6 && fin < 1) {
          const q = (fin - 0.6) / 0.4, L = 7 * Math.sin(q * Math.PI);
          for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) p.line(X, Y, X + dx * L, Y + dy * L, WHITE, 1 - q * 0.5);
          p.glow(X, Y, 14, WHITE, 0.4 * Math.sin(q * Math.PI));
        }
      }
      lumieres.draw(p);
    },
  };
}

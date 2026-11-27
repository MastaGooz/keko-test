// LA PERCÉE DE LA PIQÛRE DU KRAKEN (Keko, 27/11 : « est-ce que tu peux t'inspirer d'une version miniature de l'animation
// thrust qu'il y a dans PixelFX dans la catégorie mêlée ? »). C'est `melee/thrust` — un estoc : une gerbe de traits file de
// la main jusqu'à la pointe et s'y referme, une longue étoile à quatre branches éclate à la pointe, un anneau de percée s'en
// détache, des étincelles et des lignes de vitesse — SANS SON PERSONNAGE, EN MINIATURE (`size` : 1 donne l'effet du dépôt ;
// toutes ses longueurs, ses écarts et ses vitesses en sont multipliés) et TOURNÉ DANS L'AXE DE LA PIQÛRE (`angle`).
// L'ORIGINE EST LA POINTE : la main est à `reach` derrière elle, sur l'axe des x.
// Les lignes de vitesse sont adaptées du dash open source de Sprite Fusion et l'étoile de son sparkle
// (https://www.spritefusion.com/pixel-art-vfx), MIT License, Copyright (c) 2026 Hugo Duprez.
import { Particles, Lights, P, Rng, fit, sparkle, clamp, smooth, ease, TAU, WHITE } from "pixelfx";

export const meta = {
  name: "Percée",
  desc: "The Kraken's sting: pixelfx's Thrust without its fighter, in miniature and turned along the sting — streaks shoot in to the point and close on it, a long four-point star flares, a pierce ring sheds forward.",
  tags: ["keko", "melee", "thrust", "pierce", "tentacle", "one-shot"],
  size: [96, 48],
  origin: [64, 24],
  duration: 0.75,
  loop: false,
  fps: 30,
  bg: "space",
  options: {
    palette: ["#2a0a18", "#5a1430", "#8e2a48", "#c04a62", "#e8808a", "#ffc4c0", "#ffffff"],
    sparks: ["#ffffff", "#ffc4c0", "#e8808a", "#c04a62"],
    reach: 66,
    size: 1,
    seed: 4,
  },
};

const OUT = 0.07; // la pointe arrive
const HOLD = 0.06, PULL = 0.2;

// la longue étoile : les branches avant et arrière longues, le haut et le bas plus courts, épaisse au cœur
function longStar(p, x, y, L, k, C) {
  if (L < 1) return;
  const arms = [[1, 0, L], [-1, 0, L * 0.7], [0, -1, L * 0.42], [0, 1, L * 0.42]];
  for (const [dx, dy, len] of arms)
    for (let d = 1; d <= len; d += 0.5) {
      const u = d / len, c = u < 0.3 ? WHITE : u < 0.65 ? C[5] : C[4];
      p.dot(x + dx * d, y + dy * d, c, u < 0.7 ? 1 : 1 - (u - 0.7) / 0.35);
      if (u < 0.25 && len > 6) (p.dot(x + dx * d - dy, y + dy * d + dx, C[5]), p.dot(x + dx * d + dy, y + dy * d - dx, C[5]));
    }
  for (const [dx, dy] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) for (let d = 1; d <= Math.min(3, L * 0.14); d++) p.px(x + dx * d, y + dy * d, d < 2 ? C[5] : C[4]);
  p.px(x, y, WHITE);
  p.glow(x, y, 6 + L * 1.3, C[4], 0.35 * k);
  p.glow(x, y, 3 + L * 0.4, WHITE, 0.3 * k);
}

export function create(o) {
  const C = fit(o.palette, 7), Rg = new Rng(o.seed), k = o.size ?? 1, ps = new Particles({ rng: Rg, ground: () => 1e9, sparks: o.sparks }), lights = new Lights();
  const reach = o.reach * k, HX = -reach, HY = 0, TX = 0, TY = 0;
  // la gerbe : des traits en éventail à la main, qui se rejoignent à la pointe ; celui du milieu le plus chaud
  const streaks = [-7, -4, -2, 0, 2, 4, 7].map((off) => ({ off: off * k, x0: HX + (1 + Rg.range(0, 5) + Math.abs(off) * 0.6) * k, t0: Rg.range(0, 0.02) + Math.abs(off) * 0.003, w: off === 0 ? 2 : 1, hot: off === 0, len: Rg.range(0.75, 1) }));
  const lines = [];
  let t = 0, struck = false;
  return {
    update(dt) {
      t += dt;
      // des lignes de vitesse filent à côté de la gerbe, pendant qu'elle part et juste après
      if (t < OUT + 0.08 && Rg.chance(0.5)) {
        const s = Rg.sign();
        lines.push({ x: HX + Rg.range(0, reach * 0.6), y: HY + s * Rg.range(7, 17) * k, l: Rg.range(18, 42) * k, v: Rg.range(200, 340) * k, t });
      }
      for (let i = lines.length - 1; i >= 0; i--) if (t - lines[i].t > 0.24) lines.splice(i, 1);
      for (const l of lines) l.x += l.v * dt;
      if (!struck && t >= OUT) {
        struck = true;
        lights.add(TX, TY, 44 * k, C[4], 0.45, 0.3);
        lights.add(TX, TY, 14 * k, WHITE, 0.6, 0.06);
        for (let i = 0; i < 12; i++) {
          const a = Rg.range(-0.55, 0.45), sp = Rg.range(150, 330) * k;
          ps.spawn(P.SPARK, TX, TY, Math.cos(a) * sp, Math.sin(a) * sp, Rg.range(0.12, 0.35));
        }
        for (let i = 0; i < 10; i++) {
          const a = Rg.range(-0.9, 0.9) + (Rg.chance(0.3) ? Math.PI : 0), sp = Rg.range(40, 120) * k;
          ps.spawn(P.MOTE, TX + Rg.range(-6, 2) * k, TY + Rg.range(-2, 2) * k, Math.cos(a) * sp, Math.sin(a) * sp, Rg.range(0.25, 0.5), Rg.chance(0.5) ? C[5] : C[4], 0.6);
        }
        for (let i = 0; i < 4; i++) ps.spawn(P.STAR, TX + Rg.range(-10, 8) * k, TY + Rg.range(-9, 9) * k, 0, -3, Rg.range(0.2, 0.4), Rg.chance(0.5) ? C[5] : WHITE, Rg.range(1, 2) * Math.max(0.5, k), Rg.range(0.06, 0.2));
      }
      ps.update(dt);
      lights.update(dt);
    },
    draw(p) {
      // la pointe accroche la lumière avant de partir
      if (t < 0.05) sparkle(p, HX + 2 * k, HY, (5 * (1 - t / 0.05) + 1) * k, C[5], C[3], 0.4);
      // les lignes de vitesse : pointillées, blanches en tête, qui pâlissent vers l'arrière
      for (const l of lines) {
        const q = (t - l.t) / 0.24;
        for (let d = 0; d < l.l * (1 - q * 0.6); d++) p.dot(l.x - d, l.y, d < 3 ? WHITE : d < l.l * 0.4 ? C[5] : C[3], (1 - d / l.l) * (1 - q));
      }
      // la gerbe : chaque trait file de la main à la pointe, tient, puis est avalé par la pointe
      const pull = smooth(OUT + HOLD, OUT + HOLD + PULL, t);
      for (const s of streaks) {
        const u = clamp((t - s.t0) / OUT), head = ease.outExpo(u);
        if (u <= 0 || pull >= 1) continue;
        // les traits du bord s'arrêtent avant la pointe et traînent un peu derrière : chacun se lit seul
        const y0 = HY + s.off, end = s.x0 + (TX - s.x0) * s.len, x1 = s.x0 + (end - s.x0) * head, xa = s.x0 + (end - s.x0) * Math.max(pull, head * 0.35 * (1 - s.len) * 3);
        const yAt = (x) => y0 + (TY - y0) * clamp((x - s.x0) / (TX - s.x0)) * 0.85;
        for (let x = xa; x <= x1; x += 0.5) {
          const v = (x - xa) / Math.max(1, x1 - xa), c = v > 0.88 ? WHITE : s.hot ? (v > 0.35 ? C[6] : C[5]) : v > 0.55 ? C[5] : v > 0.25 ? C[4] : C[3];
          p.dot(x, yAt(x), c, v < 0.12 ? v / 0.12 : 1);
          if (s.w > 1 && v > 0.1) p.dot(x, yAt(x) + 1, v > 0.6 ? C[5] : C[3], v < 0.2 ? v / 0.2 : 1);
        }
      }
      if (t < OUT + HOLD + PULL) p.glowLine(HX + (TX - HX) * pull, HY, HX + (TX - HX) * ease.outExpo(clamp(t / OUT)), TY, 6 * k, C[4], 0.22 * (1 - pull));
      // la longue étoile à la pointe, et l'anneau de percée qui s'en détache
      const q = t - OUT;
      if (q >= 0 && q < 0.4) {
        const g = ease.outBack(clamp(q / 0.04), 2.4) * (1 - smooth(0.08, 0.4, q)) * (1 + 0.12 * Math.sin(q * 70));
        longStar(p, TX, TY, 24 * k * g, 1 - q / 0.4, C);
      }
      if (q >= 0 && q < 0.2) {
        const r = q / 0.2, rx = (2 + 7 * ease.outCubic(r)) * k, ry = (4 + 12 * ease.outCubic(r)) * k;
        for (let a = 0; a < TAU; a += 0.05) p.dot(TX + (4 + 10 * r) * k + Math.cos(a) * rx, TY + Math.sin(a) * ry, r < 0.3 ? WHITE : C[5], 1.15 - r);
      }
      ps.draw(p);
      lights.draw(p);
    },
  };
}

// L'ÉCLATEMENT D'UNE BÊTE, DANS L'ESPACE (Keko, 16/11 : « si c'est un vaisseau organique, comme la Vouivre ou le Kraken, on
// peut faire une explosion avec du sang vert ») : pas de feu — la bête CRÈVE. Une poche qui se déchire (un éclair pâle,
// un anneau de sang), de gros caillots qui partent en tournant et rapetissent, une gerbe de gouttes qui filent et
// freinent, un nuage de sang en suspension qui s'étale et pâlit, des lambeaux de chair qui flottent, et des taches qui
// restent un moment là où elle était. Sans pesanteur : c'est l'espace. `sang` : six tons du sombre au clair ; `chair` :
// la couleur des lambeaux ; `size` : 0,5 pour un vaisseau de 8 unités de rayon.
import { Bits, Lights, B, Rng, TAU, WHITE, hex, mix, scale } from "pixelfx";

export const meta = {
  name: "Éclatement organique",
  desc: "Une bête qui crève dans le vide : un anneau de sang, des caillots, une gerbe de gouttes, un nuage qui s'étale, des lambeaux de chair, des taches qui restent.",
  tags: ["keko", "organique", "sang", "mort", "espace", "one-shot"],
  size: [160, 160],
  origin: [80, 80],
  duration: 2.4,
  loop: false,
  fps: 30,
  bg: "dark",
  options: { sang: ["#1a2a06", "#3a5a0c", "#6a9a14", "#a8d42a", "#e0f870", "#ffffe0"], chair: "#56303a", size: 0.5, seed: 9 },
};

const OUTLINE = hex("#140a10");

export function create(o) {
  const S = o.sang.map(hex), CH = hex(o.chair), K = o.size, RAD = 18 * K;
  const chair = { light: mix(scale(CH, 1.4), WHITE, 0.06), body: CH, shade: scale(CH, 0.6) };
  const R = new Rng(o.seed), lights = new Lights(), lambeaux = new Bits({ ground: () => Infinity });
  const caillots = [], gouttes = [], brume = [], taches = [];
  let t = 0;
  // les caillots : gros, lents, qui tournent un peu et rapetissent
  for (let i = 0; i < Math.round(9 * Math.min(1.6, K + 0.5)); i++) {
    const a = R.range(0, TAU), sp = R.range(40, 120) * Math.sqrt(K);
    caillots.push({ x: Math.cos(a) * RAD * 0.2, y: Math.sin(a) * RAD * 0.2, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, r: R.range(1.8, 3.4) * Math.sqrt(K * 2), vie: R.range(1, 1.7), age: 0 });
  }
  // la gerbe : des gouttes qui filent, étirées sur leur vitesse, et freinent
  for (let i = 0; i < Math.round(85 * Math.min(1.6, K + 0.5)); i++) {
    const a = R.range(0, TAU), sp = R.range(80, 280) * Math.sqrt(K);
    gouttes.push({ x: 0, y: 0, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, vie: R.range(0.4, 1), age: 0, c: S[R.int(2, 5)] });
  }
  // le nuage : des ronds translucides qui s'étalent et pâlissent
  for (let i = 0; i < 9; i++) {
    const a = R.range(0, TAU), d = R.range(0, RAD * 0.5), sp = R.range(6, 26);
    brume.push({ x: Math.cos(a) * d, y: Math.sin(a) * d, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, r: R.range(RAD * 0.35, RAD * 0.6), vie: R.range(1.3, 2.1), age: 0 });
  }
  // les taches qui restent : de petites flaques de sang autour du point, qui sèchent
  for (let i = 0; i < 7; i++) {
    const a = R.range(0, TAU), d = R.range(RAD * 0.2, RAD * 1.1);
    taches.push({ x: Math.cos(a) * d, y: Math.sin(a) * d, r: R.range(1, 2.4) * Math.sqrt(K * 2), delai: 0.15 + d / (RAD * 6) });
  }
  // les lambeaux de chair : des morceaux qui flottent en tournant
  for (let i = 0; i < 7; i++) {
    const a = R.range(0, TAU), sp = R.range(20, 70) * Math.sqrt(K);
    lambeaux.add({ kind: B.CHUNK, x: 0, y: 0, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, g: 0, drag: 1.2, bounce: 0, life: R.range(1.3, 2.1), a: R.range(0, TAU), va: R.range(-9, 9), s: R.int(1, 2) });
  }
  lights.add(0, 0, RAD * 2.6, S[3], 0.55, 0.5);
  lights.add(0, 0, RAD * 1.2, S[5], 0.6, 0.08);

  return {
    update(dt) {
      t += dt;
      for (const l of [caillots, gouttes, brume])
        for (let i = l.length - 1; i >= 0; i--) {
          const g = l[i];
          if ((g.age += dt) > g.vie) {
            l.splice(i, 1);
            continue;
          }
          const f = Math.exp(-(l === gouttes ? 2.6 : l === brume ? 1.2 : 1.8) * dt);
          g.vx *= f;
          g.vy *= f;
          g.x += g.vx * dt;
          g.y += g.vy * dt;
        }
      lambeaux.update(dt);
      lights.update(dt);
    },
    drawBack(p) {
      // les taches, au fond : elles apparaissent quand le sang les atteint, puis sèchent
      for (const tc of taches) {
        const u = (t - tc.delai) / 2;
        if (u < 0 || u > 1) continue;
        p.circle(tc.x, tc.y, tc.r, S[1], 0.8 * (1 - u));
        p.circle(tc.x - 0.4, tc.y - 0.4, tc.r * 0.55, S[2], 0.7 * (1 - u));
      }
      for (const b of brume) {
        const u = b.age / b.vie;
        p.disc(b.x, b.y, b.r * (1 + 0.8 * u), S[2], 0.32 * (1 - u));
      }
    },
    draw(p) {
      // la poche qui se déchire : un éclair pâle, un anneau de sang qui s'ouvre
      if (t < 0.08) p.circle(0, 0, RAD * 0.7 * (1 - t / 0.08) + 1, S[5]);
      if (t < 0.35) {
        const u = t / 0.35;
        p.ring(0, 0, RAD * (0.4 + 2.4 * (1 - (1 - u) ** 3)), Math.max(1, 3 * (1 - u)), u < 0.3 ? S[5] : S[4], 1 - u);
      }
      for (const b of lambeaux.list) {
        const r = 0.6 + b.s * 0.75, fade = Math.min(1, b.life / 0.5), lx = Math.cos(b.a) * r * 0.4, ly = Math.sin(b.a) * r * 0.4;
        p.shade(b.x - r - 1, b.y - r - 1, b.x + r + 1, b.y + r + 1, (x, y, out) => {
          const dx = x - b.x, dy = y - b.y, d = Math.hypot(dx * 1.15, dy);
          if (d > r + 0.9) return;
          const lit = dx * lx + dy * ly;
          out.c = d > r ? OUTLINE : lit < -0.4 ? chair.light : lit > 0.6 ? chair.shade : chair.body;
          out.a = fade;
        });
      }
      for (const c of caillots) {
        const u = c.age / c.vie, r = c.r * (1 - 0.6 * u);
        p.circle(c.x, c.y, r + 0.6, S[0], 1 - u * 0.6);
        p.circle(c.x, c.y, r, S[2], 1 - u * 0.5);
        p.circle(c.x - r * 0.3, c.y - r * 0.3, r * 0.45, S[4], 1 - u * 0.5);
      }
      for (const g of gouttes) {
        const u = g.age / g.vie, sp = Math.hypot(g.vx, g.vy) || 1, L = Math.min(4, 0.5 + sp * 0.02);
        p.line(g.x - (g.vx / sp) * L, g.y - (g.vy / sp) * L, g.x, g.y, g.c, 1 - u * 0.7);
      }
      lights.draw(p);
    },
  };
}

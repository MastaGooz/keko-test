// LA DÉCHIRURE DU SACHET, en pixel art : un front blanc traverse le film de gauche à droite en le crénelant,
// des étincelles crème jaillissent du front en cloche et retombent, mêlées à la couleur du cran le plus rare,
// le bord déchiré rougeoie puis noircit ; au bout, l'arrachement : une rafale qui naît allumée et s'éteint.
// Les régimes sont ceux du jeu (découpe : en cloche au-dessus du front ; arrachement : un cône de ±60°).
import { Particles, Lights, P, PF, Rng, PAL, fit, clamp, ease, WHITE } from "pixelfx";

const COURSE = 0.95, L = 62, Y = -30;

export const meta = {
  name: "Déchirure",
  desc: "Un front blanc déchire le film de gauche à droite en le crénelant, des étincelles crème et violettes jaillissent en cloche, le bord rougeoie puis noircit ; au bout, l'arrachement.",
  tags: ["keko", "sachet", "déchirure", "étincelles", "one-shot"],
  size: [220, 96],
  origin: [98, 80],
  duration: 2.2,
  loop: false,
  fps: 30,
  bg: "dark",
  options: { palette: ["#2a1f14", "#5a4428", "#9a7a4a", "#d8b880", "#f4e2b8", "#fff6e0", "#ffffff"], rare: PAL.arcane, seed: 7 },
};

export function create(o) {
  const C = fit(o.palette, 7), V = fit(o.rare, 8), R = new Rng(o.seed), sol = () => 0;
  const ps = new Particles({ rng: R, ground: sol, sparks: [WHITE, C[5], C[4], C[3]] });
  const psRare = new Particles({ rng: R, ground: sol, sparks: [WHITE, V[6], V[5], V[4]] });
  const lumieres = new Lights();
  // les dents du film : une crénelure seedée, écrite une fois, découverte au passage du front
  const dents = Array.from({ length: 2 * L + 1 }, (_, i) => Math.round(R.range(-2.5, 2.5) + Math.sin(i * 0.9) * 1.2));
  // le bord se dissout à la fin, pixel par pixel, dans un ordre tiré une fois
  const ordre = Array.from({ length: 2 * L + 1 }, () => R.next());
  const front = (tt) => -L + 2 * L * clamp(tt / COURSE);
  let t = 0, arrache = false, acc = 0;

  function arracher() {
    arrache = true;
    lumieres.add(L, Y, 50, C[4], 0.8, 0.4);
    lumieres.add(L, Y, 20, WHITE, 0.9, 0.08);
    for (let i = 0; i < 56; i++) {
      const rare = i % 2 === 1, a = R.range(-Math.PI / 3, Math.PI / 3) - Math.PI / 2 + 0.2, v = R.range(50, 160);
      (rare ? psRare : ps).spawn(P.SPARK, L + R.range(-2, 2), Y + R.range(-3, 3), Math.cos(a) * v, Math.sin(a) * v, R.range(0.5, 1), WHITE, 1, R.range(0, 0.04));
    }
    for (let i = 0; i < 8; i++) ps.spawn(P.VAPOUR, L + R.range(-4, 4), Y + R.range(-4, 2), R.range(-10, 20), -R.range(8, 20), R.range(0.6, 1.1), C[2], R.range(3, 5), R.range(0, 0.1), PF.BACK);
  }

  return {
    update(dt) {
      t += dt;
      if (t < COURSE) {
        // la découpe : des étincelles émises à mesure que le front avance, en cloche au-dessus du front
        acc += dt * 90;
        const x = front(t);
        while (acc >= 1) {
          acc -= 1;
          const rare = R.chance(0.3), a = -Math.PI / 2 + R.range(-0.5, 0.5), v = R.range(40, 140);
          (rare ? psRare : ps).spawn(P.SPARK, x + R.range(-3, 3), Y + R.range(-1, 1), Math.cos(a) * v + 10, Math.sin(a) * v, R.range(0.3, 0.7), WHITE, 1);
        }
        if (R.chance(0.2)) ps.spawn(P.EMBER, x + R.range(-4, 1), Y + R.range(-2, 2), R.range(-6, 6), -R.range(10, 24), R.range(0.5, 1), C[4], R.range(0.6, 1.2));
      } else if (!arrache) arracher();
      ps.update(dt);
      psRare.update(dt);
      lumieres.update(dt);
    },
    drawBack(p) {
      ps.draw(p, "back");
      // le bord déchiré derrière le front : les dents, rougeoyantes près du front, noircies plus loin
      const x = front(t), fin = clamp((t - COURSE) / (meta.duration - COURSE - 0.1));
      for (let i = 0; i <= 2 * L; i++) {
        const dx = -L + i;
        if (dx > x) break;
        if (ordre[i] < fin) continue;
        const d = (x - dx) / 30, chaud = Math.exp(-d) * (1 - fin), y = Y + dents[i];
        // deux lèvres de film de part et d'autre d'une fente sombre : la lèvre du haut prend la lumière
        p.px(dx, y - 1, chaud > 0.5 ? C[5] : chaud > 0.2 ? C[4] : C[3]);
        p.px(dx, y, chaud > 0.6 ? C[4] : chaud > 0.3 ? C[2] : C[0]);
        p.px(dx, y + 1, chaud > 0.4 ? C[2] : C[0]);
        p.px(dx, y + 2, chaud > 0.2 ? C[2] : C[1]);
        if (chaud > 0.25) p.glow(dx, y, 5, C[4], 0.25 * chaud);
      }
    },
    draw(p) {
      ps.draw(p, "front");
      psRare.draw(p, "front");
      if (t < COURSE) {
        // le front : un point blanc chaud, un éclat qui vibre, une lueur qui l'accompagne
        const x = front(t), v = 2.5 + 1.2 * Math.sin(t * 60);
        p.circle(x, Y, 1.4, WHITE);
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) p.line(x, Y, x + dx * v, Y + dy * v * 1.6, C[5], 0.9);
        p.glow(x, Y, 18, C[4], 0.55);
        p.glow(x, Y, 7, WHITE, 0.4);
        p.glow(x, Y + 8, 12, V[5], 0.18);
      } else {
        const s = t - COURSE, pop = Math.exp(-s / 0.06);
        if (s < 0.035) p.circle(L, Y, 6 * (1 - s / 0.035) + 1, WHITE);
        if (pop > 0.02) {
          p.glow(L, Y, 30, C[4], 0.5 * pop);
          p.glow(L, Y, 10, WHITE, 0.4 * pop);
        }
        const u = s / 0.3;
        if (u < 1) {
          const r = 4 + 22 * ease.outExpo(u);
          p.ring(L, Y, r, 1, u < 0.3 ? WHITE : C[5], 1.2 - u);
          p.glowRing(L, Y, r, 4, V[5], 0.35 * (1 - u));
        }
      }
      lumieres.draw(p);
    },
  };
}

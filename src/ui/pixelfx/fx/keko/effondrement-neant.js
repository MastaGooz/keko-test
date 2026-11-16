// LA MORT DU NÉANT (Keko, 16/11 : « et si c'est le néant, il faudrait trouver quelque chose d'approprié ») : il n'explose
// pas, IL S'EFFONDRE SUR LUI-MÊME — le vaisseau d'une singularité finit en singularité. L'ASPIRATION : ses deux anneaux se
// brisent en arcs qui tombent en spirale vers le centre, l'horizon noir grossit, son anneau de photons brille ; L'EFFONDREMENT :
// tout se referme d'un coup sur un point blanc ; LE RELÂCHEMENT : une onde magenta s'ouvre (un trait sombre devant elle, des
// rides qui la suivent), des fêlures de l'espace jaillissent du point et s'éteignent, quelques éclats filent. Le noir n'a
// aucune lueur posée dessus : la lumière s'ajoute par-dessus tout. `size` : 0,5 pour un vaisseau de 8 unités de rayon.
import { Lights, Rng, TAU, WHITE, hex } from "pixelfx";

export const meta = {
  name: "Effondrement du Néant",
  desc: "Le vaisseau du vide s'effondre sur lui-même : ses anneaux tombent en spirale dans un trou noir qui grossit, se referme sur un point blanc, puis une onde magenta et des fêlures de l'espace.",
  tags: ["keko", "vide", "trou noir", "mort", "espace", "one-shot"],
  size: [160, 160],
  origin: [80, 80],
  duration: 1.8,
  loop: false,
  fps: 30,
  bg: "dark",
  options: { palette: ["#06010a", "#1a0516", "#3d0a33", "#701560", "#b0228f", "#f53cd1", "#ff86e6", "#ffd2f6"], size: 0.5, seed: 13 },
};

const ASPIRE = 0.38, FERME = 0.5;
const NOIR = hex("#020004");

export function create(o) {
  const C = o.palette.map(hex), K = o.size, RAD = 18 * K;
  const R = new Rng(o.seed), lights = new Lights();
  // les arcs des anneaux, qui tombent en spirale
  const arcs = Array.from({ length: 10 }, (_, i) => ({ a: (i / 10) * TAU + R.range(-0.2, 0.2), r: RAD * R.range(0.9, 1.25), long: R.range(0.4, 0.8), tourne: R.range(4, 7) * (i % 2 ? 1 : -1) }));
  // les fêlures : des traits brisés qui jaillissent du point
  const feles = Array.from({ length: 7 }, (_, i) => {
    const a0 = (i / 7) * TAU + R.range(-0.3, 0.3);
    const pts = [[0, 0]];
    let a = a0, x = 0, y = 0;
    for (let k = 0; k < 5; k++) {
      a += R.range(-0.5, 0.5);
      const l = RAD * R.range(0.35, 0.6);
      x += Math.cos(a) * l;
      y += Math.sin(a) * l;
      pts.push([x, y]);
    }
    return pts;
  });
  const eclats = Array.from({ length: 22 }, () => {
    const a = R.range(0, TAU), sp = R.range(70, 190) * Math.sqrt(K * 2);
    return { a, sp, vie: R.range(0.3, 0.7), c: R.pick([C[5], C[6], C[7], WHITE]) };
  });
  let t = 0, ferme = false;
  return {
    update(dt) {
      t += dt;
      if (!ferme && t >= FERME) {
        ferme = true;
        lights.add(0, 0, RAD * 3, C[5], 0.7, 0.5);
        lights.add(0, 0, RAD, WHITE, 0.9, 0.1);
      }
      lights.update(dt);
    },
    drawBack(p) {
      // pendant l'aspiration, l'espace s'assombrit autour de lui
      if (t < FERME) p.disc(0, 0, RAD * 1.8, C[0], (d) => 0.6 * Math.min(1, t / 0.15) * (1 - d) * (1 - d));
    },
    draw(p) {
      if (t < FERME) {
        const u = Math.min(1, t / ASPIRE);
        // l'horizon grossit, puis se referme ; les arcs tombent vers lui en tournant
        const h = t < ASPIRE ? RAD * (0.3 + 0.35 * u) : RAD * 0.65 * (1 - (t - ASPIRE) / (FERME - ASPIRE));
        for (const ar of arcs) {
          const r = ar.r * (1 - u * u) + h * u * u;
          const a0 = ar.a + ar.tourne * u * u;
          for (let s = 0; s <= 12; s++) {
            const a = a0 + (s / 12) * ar.long;
            p.dot(Math.cos(a) * r, Math.sin(a) * r, s > 8 ? C[7] : C[5], 1);
            p.dot(Math.cos(a) * (r + 1), Math.sin(a) * (r + 1), C[3], 0.7);
          }
        }
        for (let a = 0; a < TAU; a += 0.4 / Math.max(1, h + 1)) {
          const face = 0.5 + 0.5 * Math.cos(a - t * 9);
          p.dot(Math.cos(a) * (h + 1), Math.sin(a) * (h + 1), face > 0.6 ? WHITE : face > 0.3 ? C[6] : C[4], 1);
        }
        p.circle(0, 0, Math.max(0.5, h), NOIR);
        return;
      }
      const a = t - FERME;
      // le point blanc où tout s'est refermé
      if (a < 0.12) {
        p.circle(0, 0, 2.5 * (1 - a / 0.12) + 0.5, WHITE);
        p.glow(0, 0, RAD, C[6], 1 - a / 0.12);
      }
      // l'onde magenta, un trait sombre devant elle, deux rides qui la suivent
      const u = Math.min(1, a / 0.9);
      if (u < 1) {
        const r = RAD * 3 * (1 - (1 - u) ** 3);
        p.ring(0, 0, r + 2, 1, C[1], 0.7 * (1 - u));
        p.ring(0, 0, r, u < 0.4 ? 2 : 1, u < 0.2 ? C[7] : u < 0.5 ? C[6] : C[5], 1 - u);
        for (const k of [0.72, 0.5]) p.ring(0, 0, r * k, 1, C[4], 0.45 * (1 - u));
      }
      // les fêlures de l'espace : elles jaillissent, blanches en tête, puis s'éteignent
      if (a < 0.45) {
        const v = a / 0.45;
        for (const pts of feles) {
          const n = Math.max(1, Math.round(Math.min(1, v * 3) * (pts.length - 1)));
          for (let k = 0; k < n; k++) p.line(pts[k][0], pts[k][1], pts[k + 1][0], pts[k + 1][1], k === n - 1 && v < 0.35 ? WHITE : C[6], 1.2 - v);
        }
      }
      for (const e of eclats) {
        if (a > e.vie) continue;
        const v = a / e.vie, d = e.sp * a * (1 - 0.5 * v);
        p.line(Math.cos(e.a) * (d - 3), Math.sin(e.a) * (d - 3), Math.cos(e.a) * d, Math.sin(e.a) * d, e.c, 1 - v);
      }
      lights.draw(p);
    },
  };
}

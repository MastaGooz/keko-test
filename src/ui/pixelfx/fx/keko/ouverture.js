// L'OUVERTURE DU DONJON, en pixel art : la cible d'or qui se pose sur l'ennemi pendant 1,2 s. Deux anneaux
// claquent en se resserrant, une croix de visée tourne lentement, le cœur bat trois fois en envoyant une onde,
// des éclats courent sur l'anneau, puis tout se referme au centre en un dernier éclat. Un effet pur : une
// fonction du temps, rien n'est simulé.
import { PAL, fit, cycle, clamp, ease, TAU, WHITE } from "pixelfx";

const R0 = 22, R1 = 11, FIN = 1.02;

export const meta = {
  name: "Ouverture",
  desc: "La cible d'or du donjon : deux anneaux claquent en se resserrant, une croix de visée tourne, le cœur bat et lance des ondes, des éclats courent sur l'anneau, puis tout se referme.",
  tags: ["keko", "donjon", "cible", "or", "visée", "one-shot"],
  size: [116, 116],
  origin: [58, 58],
  duration: 1.2,
  loop: false,
  fps: 30,
  bg: "dark",
  options: { palette: PAL.gold, seed: 3 },
};

export function draw(p, t, o) {
  if (t >= meta.duration) return;
  const C = fit(o.palette, 8);
  // l'arrivée : les anneaux viennent de loin et claquent à leur place, avec un léger rebond
  const arrivee = ease.outBack(clamp(t / 0.16), 1.6), arrivee2 = ease.outBack(clamp((t - 0.05) / 0.16), 1.6);
  // la fermeture : tout se resserre au centre
  const ferme = ease.inCubic(clamp((t - FIN) / (meta.duration - FIN - 0.03)));
  const k = 1 - ferme;
  const r0 = (R0 + 26 * (1 - arrivee)) * k, r1 = (R1 + 14 * (1 - arrivee2)) * k;
  if (k <= 0.02) return;
  // le battement : trois pulsations, le cœur grossit et une onde court vers l'anneau
  const periode = 0.36, b = (t - 0.2) / periode, bat = b < 0 ? 0 : b % 1, nb = Math.floor(b);
  const coeur = 1 + 0.6 * (bat > 0 && bat < 0.25 ? Math.sin((bat / 0.25) * Math.PI) : 0);

  // l'anneau extérieur, or, un rebord sombre dessous et un rebord clair dessus (la lumière vient d'en haut à gauche)
  p.ring(0, 0, r0, 2, (x, y) => (y < -r0 * 0.3 || x < -r0 * 0.3 ? C[5] : y > r0 * 0.5 ? C[3] : C[4]), 1);
  p.glowRing(0, 0, r0, 4, C[5], 0.3 * k);
  // l'anneau intérieur, plus fin
  if (r1 > 1) p.ring(0, 0, r1, 1, (x, y) => (y < 0 ? C[5] : C[4]), 1);
  // la croix de visée : quatre traits hors de l'anneau, qui tournent lentement
  const rot = t * 0.9;
  for (let i = 0; i < 4; i++) {
    const a = rot + (i * TAU) / 4, ca = Math.cos(a), sa = Math.sin(a);
    p.line(ca * (r0 + 2), sa * (r0 + 2), ca * (r0 + 7), sa * (r0 + 7), C[5], 1);
    p.px(ca * (r0 + 8), sa * (r0 + 8), WHITE);
  }
  // le cœur : un point blanc dans un disque d'or, qui gonfle au battement
  p.circle(0, 0, 2.2 * coeur * k, C[4]);
  p.circle(0, 0, 1.1 * coeur * k, WHITE);
  p.glow(0, 0, 8 + 6 * (coeur - 1), WHITE, 0.3 + 0.4 * (coeur - 1));
  // l'onde du battement : un anneau fin qui court du cœur à l'anneau et s'éteint
  if (b >= 0 && nb < 3) {
    const u = ease.outCubic(bat), r = 3 + (r0 - 4) * u;
    if (r > 2) {
      p.ring(0, 0, r, 1, u < 0.3 ? WHITE : C[6], (1 - u) * 1.2);
      p.glowRing(0, 0, r, 3, C[5], 0.35 * (1 - u));
    }
    if (bat < 0.12) p.glow(0, 0, 14, C[5], 0.4 * (1 - bat / 0.12));
  }
  // les éclats : deux étincelles qui courent sur l'anneau, en sens inverse, et clignotent
  for (let i = 0; i < 2; i++) {
    const a = (i ? -1 : 1) * t * 5.2 + i * 2.2, x = Math.cos(a) * r0, y = Math.sin(a) * r0, cl = 0.5 + 0.5 * Math.sin(t * 30 + i);
    p.px(x, y, WHITE);
    p.dot(x + 1, y, C[6], cl);
    p.dot(x - 1, y, C[6], cl);
    p.dot(x, y + 1, C[6], cl);
    p.dot(x, y - 1, C[6], cl);
    p.glow(x, y, 6, C[6], 0.5 * cl);
  }
  // des paillettes qui tournent dans l'anneau et s'éteignent
  cycle(t, 0.8, 8, o.seed, 0.6, (age, life, r) => {
    const q = age / life, a = r.range(0, TAU) + t * 1.5, rad = r.range(r1 + 2, r0 - 3) * k;
    p.dot(Math.cos(a) * rad, Math.sin(a) * rad, q < 0.5 ? C[6] : C[5], (1 - q) * 1.2 * k);
  });
  // l'arrivée et la fermeture flashent
  if (t < 0.05) p.glow(0, 0, 30, C[5], 0.6 * (1 - t / 0.05));
  if (ferme > 0.5) {
    const q = (ferme - 0.5) / 0.5, L = 9 * Math.sin(q * Math.PI);
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) p.line(0, 0, dx * L, dy * L, WHITE, 1);
    p.glow(0, 0, 18, WHITE, 0.5 * Math.sin(q * Math.PI));
  }
}

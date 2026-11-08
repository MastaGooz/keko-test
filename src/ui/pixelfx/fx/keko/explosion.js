// L'EXPLOSION D'UN VAISSEAU, en pixel art (Keko : « une petite explosion et disparition à la mort du joueur ou du
// vaisseau ennemi ») : un flash blanc, une boule de feu qui grossit d'un coup, refroidit du blanc au rouge et se troue
// par le milieu, un anneau qui s'ouvre, des étincelles qui filent et s'éteignent, puis de la fumée qui s'écarte et
// s'éclaircit. Sans sol : c'est l'espace. Un effet pur ; `taille` l'agrandit (le joueur, un peu plus grand que le rival).
import { fit, burst, fly, at, ease, TAU, WHITE, hex } from "pixelfx";

export const meta = {
  name: "Explosion de vaisseau",
  desc: "Un flash blanc, une boule de feu qui grossit, refroidit et se troue, un anneau, des étincelles qui filent, puis de la fumée qui s'écarte : la fin d'un petit vaisseau.",
  tags: ["keko", "explosion", "vaisseau", "espace", "one-shot"],
  size: [96, 96],
  origin: [48, 48],
  duration: 1.1,
  loop: false,
  fps: 30,
  bg: "dark",
  options: { palette: ["#1f0b10", "#4a1118", "#8c1d1c", "#cc3a1a", "#f2701f", "#ffae35", "#ffe27a", "#fff8d6"], taille: 1, seed: 1 },
};

const FUMEE = hex("#5a5460");

export function draw(p, t, o) {
  const C = fit(o.palette, 8), k = o.taille;
  // le flash : un disque blanc qui se contracte en trois images
  if (t < 0.06) p.circle(0, 0, (11 - t * 120) * k, WHITE);
  // la boule de feu : elle grossit vite, refroidit de l'intérieur et se troue par le milieu
  const u = t / 0.5;
  if (u < 1) {
    // elle grossit vite, puis se consume en rapetissant (pas de fondu trame : un damier se lirait comme de la fumee)
    const r = (3 + 9 * ease.outCubic(u)) * k * (u < 0.6 ? 1 : 1 - (u - 0.6) / 0.4);
    p.circle(0, 0, r, (x, y) => {
      const d = Math.hypot(x, y) / r;
      const chaleur = 1 - d - u * 0.9 + (d < 0.35 ? -u * 0.8 : 0);
      return chaleur > 0.45 ? C[7] : chaleur > 0.2 ? C[6] : chaleur > -0.05 ? C[5] : chaleur > -0.3 ? C[4] : C[3];
    }, 1);
    p.glow(0, 0, r * 2.6, C[5], 0.8 * (1 - u));
    p.glow(0, 0, r, WHITE, 0.4 * (1 - u));
  }
  // l'anneau : il s'ouvre d'un coup et s'éteint
  const w = t / 0.35;
  if (w < 1) p.ring(0, 0, (4 + 22 * ease.outExpo(w)) * k, 1, w < 0.3 ? WHITE : C[6], 1 - w);
  // les étincelles : elles filent dans toutes les directions, freinent, refroidissent
  burst(20, o.seed, (r) => {
    const a = r.range(0, TAU), sp = r.range(40, 130) * k, life = r.range(0.3, 0.8);
    if (t > life) return;
    const [x, y] = fly(0, 0, Math.cos(a) * sp, Math.sin(a) * sp, t, 0, 2.2);
    p.px(x, y, at(C.slice(3), 1 - t / life));
    p.light(x, y, C[5], 0.5 * (1 - t / life));
  });
  // la fumée : des ronds translucides gris qui s'écartent, grossissent et s'éclaircissent
  burst(8, o.seed + 1, (r) => {
    const a = r.range(0, TAU), sp = r.range(8, 28) * k, d0 = r.range(0.08, 0.3), life = 0.75, tt = t - d0;
    if (tt < 0 || tt > life) return;
    const [x, y] = fly(0, 0, Math.cos(a) * sp, Math.sin(a) * sp, tt, 0, 1.5);
    p.disc(x, y, (2.5 + 6 * tt) * k, FUMEE, 0.5 * (1 - tt / life));
  });
}

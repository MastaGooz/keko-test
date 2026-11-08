// LA TÉLÉPORTATION D'UN VAISSEAU, VUE DE DESSUS (Keko : « un effet de téléporte qui fait disparaître le vaisseau » au
// bout de l'extraction). C'est la chorégraphie du `arcane/blink-out` du dépôt sans son personnage ni son sol : des
// filets de lumière accourent vers le vaisseau pendant qu'un crépitement gagne son pourtour, un éclair blanc, le
// vaisseau (un disque de son rayon) se serre en une ligne verticale qui s'effondre en un point, puis le point éclate en
// étincelles et en braises sans pesanteur (les grains de l'espace), un anneau s'ouvre, une lueur s'éteint. Le vaisseau
// lui-même est dessiné par le jeu jusqu'à l'éclair, blanchi ; l'effet prend le relais. `rayon` est celui du vaisseau.
// Le blink est adapté du blink libre de Sprite Fusion (https://www.spritefusion.com/pixel-art-vfx/movement),
// MIT License, Copyright (c) 2026 Hugo Duprez.
import { Lights, Rng, fit, TAU, WHITE, sparkle, flare } from "pixelfx";
import { Grains } from "./_espace.js";

/** Les temps : le rassemblement, l'éclair, le serrage en ligne, l'effondrement en point, puis l'éclatement. */
export const RASSEMBLE = 0.4, ECLAIR = 0.05, SERRE = 0.12, EFFONDRE = 0.08, POP = RASSEMBLE + ECLAIR + SERRE + EFFONDRE;

export const meta = {
  name: "Téléportation",
  desc: "Un vaisseau vu de dessus se téléporte : des filets de lumière accourent, il crépite, flashe blanc, se serre en une ligne, s'effondre en un point qui éclate en étincelles.",
  tags: ["keko", "teleport", "espace", "vaisseau", "one-shot"],
  size: [96, 96],
  origin: [48, 48],
  duration: 1.5,
  loop: false,
  fps: 30,
  bg: "dark",
  options: { palette: ["#3a2a06", "#8a6210", "#d8a020", "#ffd23a", "#ffe890", "#fff6c0", "#ffffff", "#ffffff"], rayon: 4, seed: 3 },
};

/** Un hachis déterministe par pixel et par image, pour le crépitement (aucun hasard non seedé). */
function hachis(x, y, f) {
  let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(f | 0, 2246822519)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

/** Le vaisseau serré : une ellipse de demi-axes (w, h), cœur blanc, bord clair. */
function ellipse(p, w, h, C) {
  p.shade(-w - 1, -h - 1, w + 1, h + 1, (x, y, o) => {
    const d = Math.hypot(x / w, y / h);
    if (d > 1.25) return;
    o.c = d < 0.8 ? WHITE : C[6];
    o.a = d <= 1 ? 1 : 0.7;
  });
}

export function create(o) {
  const C = fit(o.palette, 8), R = new Rng(o.seed), r0 = o.rayon;
  const grains = new Grains(R), lights = new Lights();
  /** Les filets de lumière qui accourent : leur angle, leur départ, leur naissance, leur durée, leur couleur. */
  const filets = [];
  let t = 0, eclaire = false, pop = false;

  return {
    update(dt) {
      t += dt;
      if (t < RASSEMBLE - 0.05 && R.chance(0.8)) filets.push({ a: R.range(0, TAU), d0: R.range(r0 * 4, r0 * 9), t0: t, T: R.range(0.12, 0.2), c: R.chance(0.5) ? C[6] : C[5] });
      if (!eclaire && t >= RASSEMBLE) {
        eclaire = true;
        lights.add(0, 0, r0 * 7, C[4], 0.7, 0.3);
        lights.add(0, 0, r0 * 4, WHITE, 0.7, 0.1);
      }
      if (!pop && t >= POP) {
        pop = true;
        lights.add(0, 0, r0 * 11, C[4], 0.9, 0.35);
        lights.add(0, 0, r0 * 5, WHITE, 0.9, 0.08);
        // le point éclate : étincelles et braises dans toutes les directions, sans pesanteur
        for (let i = 0; i < 40; i++) {
          const a = R.range(0, TAU), sp = R.range(40, 160);
          grains.ajouter("etincelle", 0, 0, Math.cos(a) * sp, Math.sin(a) * sp, R.range(0.25, 0.6), R.pick([WHITE, C[6], C[5], C[4]]), 1, 2.5);
        }
        for (let i = 0; i < 14; i++) {
          const a = R.range(0, TAU), sp = R.range(10, 50);
          grains.ajouter("braise", 0, 0, Math.cos(a) * sp, Math.sin(a) * sp, R.range(0.4, 0.8), C[4], 1, 1);
        }
      }
      for (let i = filets.length - 1; i >= 0; i--) if (t - filets[i].t0 > filets[i].T) filets.splice(i, 1);
      grains.update(dt);
      lights.update(dt);
    },
    drawBack(p) {
      grains.draw(p, "back");
      if (t < POP + 0.3) p.glow(0, 0, r0 * 6, C[4], 0.35 * (t < RASSEMBLE ? t / RASSEMBLE : 1 - Math.min(1, (t - POP) / 0.3)));
    },
    draw(p) {
      const f = Math.floor(t * 30);
      if (t < RASSEMBLE) {
        // les filets qui accourent vers le vaisseau, de plus en plus vite
        for (const fl of filets) {
          const q = (t - fl.t0) / fl.T, d1 = fl.d0 * (1 - q * q), d0 = Math.min(fl.d0, d1 + 3 + 4 * (1 - q));
          p.line(Math.cos(fl.a) * d0, Math.sin(fl.a) * d0, Math.cos(fl.a) * d1, Math.sin(fl.a) * d1, fl.c, 0.9);
        }
        // le crépitement : des pixels de lumière sur le pourtour du vaisseau, de plus en plus denses, blancs à la fin
        const k = t / RASSEMBLE, rc = r0 + 1.5;
        for (let y = -rc - 1; y <= rc + 1; y++)
          for (let x = -rc - 1; x <= rc + 1; x++) {
            const d = Math.hypot(x, y);
            if (d < r0 + 0.5 || d > rc + 1) continue;
            if (hachis(x, y, f) < 0.15 + 0.6 * k) p.px(x, y, k > 0.6 && hachis(x, y, 7) < 0.5 ? WHITE : C[6]);
          }
        p.glow(0, 0, r0 * 7, C[4], 0.5 * k);
      } else if (t < RASSEMBLE + ECLAIR) {
        // l'éclair : le vaisseau entier en blanc
        p.circle(0, 0, r0 + 1.5, WHITE);
        p.glow(0, 0, r0 * 7, C[4], 0.6);
      } else if (t < RASSEMBLE + ECLAIR + SERRE) {
        // serré en une ligne verticale
        const q = (t - RASSEMBLE - ECLAIR) / SERRE;
        ellipse(p, Math.max(0.6, (r0 + 1.5) * (1 - q * q * q)), r0 + 2, C);
        p.glow(0, 0, r0 * 8, C[4], 0.8);
      } else if (t < POP) {
        // la ligne s'effondre en un point
        const q = (t - RASSEMBLE - ECLAIR - SERRE) / EFFONDRE, hh = (r0 + 2) * (1 - q * q);
        for (let y = -hh - 3; y <= hh + 3; y++) p.dot(0, y, Math.abs(y) < hh ? WHITE : C[6], Math.abs(y) < hh ? 1 : 0.7);
        if (hh > 3) for (let y = -hh * 0.7; y <= hh * 0.7; y++) (p.dot(-1, y, C[5], 0.6), p.dot(1, y, C[5], 0.6));
        p.glow(0, 0, r0 * 7, C[4], 0.9);
        p.glow(0, 0, r0 * 2, WHITE, 0.5);
      }
      if (t >= POP && t < POP + 0.22) {
        const q = (t - POP) / 0.22;
        flare(p, 0, 0, r0 * 5 * Math.pow(1 - q, 1.5) + 2, 1 - q, C);
        if (q < 0.3) p.circle(0, 0, r0 * (1 - q / 0.3) + 1, WHITE);
      }
      const k = (t - POP) / 0.5;
      if (k >= 0 && k < 1) {
        const e = 1 - Math.pow(1 - k, 3);
        p.ring(0, 0, 2 + r0 * 6 * e, Math.max(1, 2.5 * (1 - k)), k < 0.25 ? WHITE : C[5], 1 - k);
      }
      if (t > POP && t < POP + 0.3) sparkle(p, 0, -1, 3, C[6], C[5], 0.3 * (1 - (t - POP) / 0.3));
      grains.draw(p, "front");
      lights.draw(p);
    },
  };
}

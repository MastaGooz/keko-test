// LA MATÉRIALISATION D'UN VAISSEAU, VUE DE DESSUS : la téléportation à l'envers (Keko : « une animation de
// téléportation aussi au début, comme si le vaisseau était téléporté sur l'extracteur »). Des étincelles spiralent vers
// le point d'arrivée pendant qu'une lueur s'y forme, un point de lumière blanche s'allume, s'ouvre en une ligne
// verticale, la ligne s'ouvre en un disque blanc de la taille du vaisseau — à `APPARAIT`, le jeu dessine le vaisseau
// blanchi, qui refroidit jusqu'à `REFROIDI` —, un anneau s'ouvre, quelques étincelles partent, la lueur s'éteint.
// Adaptée du blink libre de Sprite Fusion (https://www.spritefusion.com/pixel-art-vfx/movement), MIT License,
// Copyright (c) 2026 Hugo Duprez.
import { Lights, Rng, fit, TAU, WHITE, sparkle, flare } from "pixelfx";
import { Grains } from "./_espace.js";

/** Les temps : la spirale, le point, la ligne, l'ouverture ; le vaisseau apparaît à APPARAIT, refroidit jusqu'à REFROIDI. */
export const SPIRALE = 0.4, POINT = 0.08, LIGNE = 0.1, OUVRE = 0.1;
export const APPARAIT = SPIRALE + POINT + LIGNE + OUVRE, REFROIDI = APPARAIT + 0.3;

export const meta = {
  name: "Matérialisation",
  desc: "Un vaisseau vu de dessus arrive par téléportation : des étincelles spiralent vers le point, un point de lumière s'ouvre en ligne puis en disque, un anneau part.",
  tags: ["keko", "teleport", "espace", "vaisseau", "one-shot"],
  size: [96, 96],
  origin: [48, 48],
  duration: 1.3,
  loop: false,
  fps: 30,
  bg: "dark",
  options: { palette: ["#3a2a06", "#8a6210", "#d8a020", "#ffd23a", "#ffe890", "#fff6c0", "#ffffff", "#ffffff"], rayon: 4, seed: 4 },
};

/** Le disque qui s'ouvre : une ellipse de demi-axes (w, h), cœur blanc, bord clair. */
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
  /** Les étincelles qui spiralent : leur angle de départ, leur distance, leur naissance, leur durée, leur sens. */
  const spires = [];
  let t = 0, allume = false, apparu = false;

  return {
    update(dt) {
      t += dt;
      if (t < SPIRALE - 0.08 && R.chance(0.85)) spires.push({ a: R.range(0, TAU), d0: R.range(r0 * 5, r0 * 10), t0: t, T: R.range(0.18, 0.3), s: R.sign(), c: R.chance(0.5) ? C[6] : C[5] });
      if (!allume && t >= SPIRALE) {
        allume = true;
        lights.add(0, 0, r0 * 6, C[4], 0.7, 0.25);
        lights.add(0, 0, r0 * 3, WHITE, 0.7, 0.1);
      }
      if (!apparu && t >= APPARAIT) {
        apparu = true;
        lights.add(0, 0, r0 * 8, C[4], 0.6, 0.3);
        // le vaisseau est là : quelques étincelles s'écartent, le reste de la lumière se dissipe
        for (let i = 0; i < 18; i++) {
          const a = R.range(0, TAU), sp = R.range(30, 110);
          grains.ajouter("etincelle", Math.cos(a) * r0, Math.sin(a) * r0, Math.cos(a) * sp, Math.sin(a) * sp, R.range(0.2, 0.45), R.pick([WHITE, C[6], C[5]]), 1, 2.5);
        }
      }
      for (let i = spires.length - 1; i >= 0; i--) if (t - spires[i].t0 > spires[i].T) spires.splice(i, 1);
      grains.update(dt);
      lights.update(dt);
    },
    drawBack(p) {
      grains.draw(p, "back");
      if (t < APPARAIT + 0.4) p.glow(0, 0, r0 * 6, C[4], 0.35 * (t < SPIRALE ? t / SPIRALE : 1 - Math.min(1, (t - APPARAIT) / 0.4)));
    },
    draw(p) {
      if (t < SPIRALE + POINT) {
        // les étincelles qui spiralent vers le point, de plus en plus vite et de plus en plus serré
        for (const sp of spires) {
          const q = Math.min(1, (t - sp.t0) / sp.T), d = sp.d0 * (1 - q * q), a = sp.a + sp.s * q * 2.2;
          const d2 = Math.min(sp.d0, d + 2 + 3 * (1 - q)), a2 = sp.a + sp.s * Math.max(0, q - 0.08) * 2.2;
          p.line(Math.cos(a2) * d2, Math.sin(a2) * d2, Math.cos(a) * d, Math.sin(a) * d, sp.c, 0.9);
        }
        const k = Math.min(1, t / SPIRALE);
        p.glow(0, 0, r0 * 5, C[4], 0.45 * k);
        if (k > 0.5) sparkle(p, 0, 0, 1 + 2 * (k - 0.5) * 2, WHITE, C[5], 0.6);
      }
      if (t >= SPIRALE && t < SPIRALE + POINT) {
        // le point de lumière
        const q = (t - SPIRALE) / POINT;
        p.circle(0, 0, 1 + q, WHITE);
        flare(p, 0, 0, r0 * 3 * q + 2, 0.5 + 0.5 * q, C);
        p.glow(0, 0, r0 * 7, C[4], 0.45);
      } else if (t < SPIRALE + POINT + LIGNE) {
        // le point s'ouvre en une ligne verticale
        const q = (t - SPIRALE - POINT) / LIGNE, hh = (r0 + 2) * (1 - (1 - q) * (1 - q));
        for (let y = -hh - 3; y <= hh + 3; y++) p.dot(0, y, Math.abs(y) < hh ? WHITE : C[6], Math.abs(y) < hh ? 1 : 0.7);
        if (hh > 3) for (let y = -hh * 0.7; y <= hh * 0.7; y++) (p.dot(-1, y, C[5], 0.6), p.dot(1, y, C[5], 0.6));
        p.glow(0, 0, r0 * 7, C[4], 0.5);
        p.glow(0, 0, r0 * 2, WHITE, 0.3);
      } else if (t < APPARAIT) {
        // la ligne s'ouvre en un disque blanc de la taille du vaisseau
        const q = (t - SPIRALE - POINT - LIGNE) / OUVRE;
        ellipse(p, Math.max(0.6, (r0 + 1.5) * (1 - (1 - q) * (1 - q) * (1 - q))), r0 + 2, C);
        p.glow(0, 0, r0 * 8, C[4], 0.5);
      }
      const k = (t - APPARAIT) / 0.45;
      if (k >= 0 && k < 1) {
        const e = 1 - Math.pow(1 - k, 3);
        p.ring(0, 0, r0 + 1 + r0 * 5 * e, Math.max(1, 2.5 * (1 - k)), k < 0.25 ? WHITE : C[5], 1 - k);
      }
      if (t >= APPARAIT && t < APPARAIT + 0.25) sparkle(p, 0, -1, 3, C[6], C[5], 0.3 * (1 - (t - APPARAIT) / 0.25));
      grains.draw(p, "front");
      lights.draw(p);
    },
  };
}

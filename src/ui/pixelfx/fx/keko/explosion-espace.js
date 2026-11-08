// L'EXPLOSION DU DÉPÔT, SANS SOL ET À LA TAILLE D'UN VAISSEAU (Keko : « je voyais plutôt l'effet nommé "explosion" en
// version sans sol et à la taille qui match celle du vaisseau »). C'est `explosions/small-explosion` dont on a retiré
// tout ce qui tient au plancher — le roussi, la poussière qui roule, la colonne de terre, les braises qui atterrissent
// et continuent de brûler, les cailloux qui rebondissent — et dont on a enlevé la montée (il n'y a pas de haut dans
// l'espace) : il reste le flash, les anneaux de choc (debout, pleins), la boule de feu qui refroidit en fumée, les
// étincelles et les braises dans toutes les directions, et quelques morceaux qui flottent en tournant. `size` 0,35
// donne la taille d'un vaisseau de 4 unités de rayon.
// La recette des particules (feu qui refroidit en fumée, étincelles, braises) est adaptée de l'explosion libre de
// Sprite Fusion (https://www.spritefusion.com/pixel-art-vfx/explosion), MIT License, Copyright (c) 2026 Hugo Duprez.
import { Particles, Bits, Lights, P, PF, B, Rng, fit, TAU, WHITE, hex, mix, scale, rgb } from "pixelfx";

export const meta = {
  name: "Explosion dans l'espace",
  desc: "L'explosion du dépôt sans son sol, à la taille d'un vaisseau : un flash, deux anneaux, la boule de feu qui refroidit en fumée, étincelles et braises partout, des morceaux qui flottent.",
  tags: ["keko", "explosion", "espace", "vaisseau", "one-shot"],
  size: [160, 160],
  origin: [80, 80],
  duration: 3,
  loop: false,
  fps: 30,
  bg: "dark",
  options: { palette: ["#4a1712", "#c9281f", "#f2561d", "#ff8a2a", "#ffc23d", "#ffe26b", "#fff3a6", "#ffffff"], debris: "#4a3f69", size: 0.35, seed: 7 },
};

const OUTLINE = hex("#1a1422"), WARM = rgb(255, 176, 96);

function teinte(c) {
  c = hex(c);
  return { light: mix(scale(c, 1.35), WHITE, 0.08), body: c, shade: scale(c, 0.64) };
}

// un morceau : un côté éclairé, un côté à l'ombre, un contour, qui tourne
function morceau(p, b, st) {
  const r = 0.6 + b.s * 0.75, fade = Math.min(1, b.life / 0.5), lx = Math.cos(b.a) * r * 0.4, ly = Math.sin(b.a) * r * 0.4;
  p.shade(b.x - r - 1, b.y - r - 1, b.x + r + 1, b.y + r + 1, (x, y, out) => {
    const dx = x - b.x, dy = y - b.y, d = Math.hypot(dx * 1.15, dy);
    if (d > r + 0.9) return;
    const lit = dx * lx + dy * ly;
    out.c = d > r ? OUTLINE : lit < -0.4 ? st.light : lit > 0.6 ? st.shade : st.body;
    out.a = fade;
  });
}

export function create(o) {
  const F = fit(o.palette, 8), S = o.size, RAD = 18 * S, POWER = 0.9 * Math.pow(S, 0.8), st = teinte(o.debris);
  const R = new Rng(o.seed), nulle = () => Infinity;
  const ps = new Particles({ rng: R, ground: nulle, sparks: [F[6], F[5], F[3], F[2]] });
  const morceaux = new Bits({ ground: nulle }), lights = new Lights(), flashes = [], rings = [];
  let t = 0;

  // la boule de feu : le flash, deux anneaux, les puffs de feu qui refroidissent en fumée, dans toutes les directions
  flashes.push({ r: RAD * 1.05, life: 0.06, max: 0.06 });
  rings.push({ r0: RAD * 0.45, r1: RAD * 2.7, life: 0.34, max: 0.34, thick: 3 * Math.sqrt(S), c: F[5] }, { r0: RAD * 0.3, r1: RAD * 1.6, life: 0.22, max: 0.22, thick: 1.8 * Math.sqrt(S), c: F[3] });
  lights.add(0, 0, RAD * 3.4, WARM, 0.6 * POWER, 0.7);
  lights.add(0, 0, RAD * 1.6, WHITE, 0.6, 0.08);
  for (let i = 0; i < 5; i++) ps.spawn(P.FIRE, R.range(-2.5, 2.5) * S, R.range(-2.5, 2.5) * S, R.range(-20, 20), R.range(-20, 20), R.range(0.18, 0.3), 0, R.range(RAD * 0.4, RAD * 0.55));
  for (let i = 0; i < Math.round(28 * POWER); i++) {
    const a = R.range(0, TAU), d = R.range(0, RAD * 0.55), sp = R.range(40, 210) * POWER;
    ps.spawn(P.FIRE, Math.cos(a) * d, Math.sin(a) * d, Math.cos(a) * sp, Math.sin(a) * sp, R.range(0.55, 1.15), 0, R.range(RAD * 0.22, RAD * 0.46), 0, R.chance(0.45) ? PF.SMOKES | PF.BIG : 0);
  }
  for (let i = 0; i < 5; i++) {
    const a = R.range(0, TAU), d = R.range(RAD * 0.1, RAD * 0.5);
    ps.spawn(P.SMOKE, Math.cos(a) * d, Math.sin(a) * d, Math.cos(a) * 30, Math.sin(a) * 30, R.range(0.9, 1.5), rgb(34, 29, 38), R.range(RAD * 0.15, RAD * 0.26), R.range(0.06, 0.2), PF.BIG);
  }
  for (let i = 0; i < Math.round(10 * POWER); i++) {
    const a = R.range(0, TAU), d = R.range(0, RAD * 0.7), sp = R.range(15, 100);
    ps.spawn(P.SMOKE, Math.cos(a) * d, Math.sin(a) * d, Math.cos(a) * sp, Math.sin(a) * sp, R.range(1.4, 2.2), 0, R.range(RAD * 0.26, RAD * 0.44), R.range(0.12, 0.45), PF.BIG);
  }
  // les étincelles et les braises, partout
  for (let i = 0; i < Math.round(80 * POWER); i++) {
    const a = R.range(0, TAU), sp = R.range(140, 380) * POWER;
    ps.spawn(P.SPARK, 0, 0, Math.cos(a) * sp, Math.sin(a) * sp, R.range(0.18, 0.6));
  }
  for (let i = 0; i < Math.round(40 * POWER); i++) {
    const a = R.range(0, TAU), sp = R.range(30, 150);
    ps.spawn(P.EMBER, Math.cos(a) * RAD * 0.4, Math.sin(a) * RAD * 0.4, Math.cos(a) * sp, Math.sin(a) * sp, R.range(1.2, 2.2), F[3]);
  }
  // les morceaux : sans pesanteur, ils flottent en tournant et s'éteignent
  for (let i = 0; i < Math.round(14 * Math.min(1.5, S + 0.4)); i++) {
    const a = R.range(0, TAU), sp = R.range(2, 7) * RAD;
    morceaux.add({ kind: B.CHUNK, x: R.range(-0.4, 0.4) * RAD, y: R.range(-0.4, 0.4) * RAD, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, g: 0, drag: 1.1, bounce: 0, life: R.range(1.2, 2), a: R.range(0, TAU), va: R.range(-16, 16), s: R.int(1, 2) });
  }

  return {
    update(dt) {
      t += dt;
      for (const a of [flashes, rings]) for (let i = a.length - 1; i >= 0; i--) if ((a[i].life -= dt) <= 0) a.splice(i, 1);
      morceaux.update(dt);
      ps.update(dt);
      lights.update(dt);
    },
    drawBack(p) {
      ps.draw(p, "back");
    },
    draw(p) {
      for (const b of morceaux.list) morceau(p, b, st);
      ps.draw(p, "front");
      for (const f of flashes) {
        const k2 = f.life / f.max, r = f.r * (0.8 + 0.2 * k2);
        p.circle(0, 0, r + 1.2, F[2]);
        p.circle(0, 0, r, k2 > 0.45 ? F[6] : F[5]);
        p.circle(0, 0, r * 0.6, k2 > 0.45 ? WHITE : F[6]);
      }
      for (const r of rings) {
        const k2 = r.life / r.max, e = 1 - Math.pow(k2, 3);
        p.ring(0, 0, r.r0 + (r.r1 - r.r0) * e, Math.max(1, r.thick * k2 + 0.4), r.c, Math.min(1, k2 * 1.6));
      }
      lights.draw(p);
    },
  };
}

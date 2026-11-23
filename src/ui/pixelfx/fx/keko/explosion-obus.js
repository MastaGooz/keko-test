// L'EXPLOSION DE L'OBUS (Keko, 23/11 : « change l'effet d'explosion pour autre chose graphiquement : sur pixelfx on a
// d'autres types d'explosions, pour différencier des missiles » ; il a choisi la « Big explosion »). C'est
// `explosions/big-explosion` sans son sol, comme `explosion-espace` l'est de la petite : TROIS DÉTONATIONS À UN BATTEMENT
// D'ÉCART — la première au point d'impact, les deux suivantes à côté, chacune plus petite —, un DÔME BLANC qui refroidit
// dans le feu, une BOULE DE FEU QUI ROULE (des ronds de feu qui tournent en s'écartant, puis fument), une grande onde
// de choc, et de GROS ROCHERS dont les plus chauds traînent du feu. Ni colonne qui monte, ni champignon, ni poussière
// qui roule au sol, ni roussi : rien ne tombe ni ne s'élève dans le vide (les grains de `_espace.js`).
// `size` : le rayon de l'onde de choc vaut 54 × size (l'obus de 40 : 0,74).
// La chorégraphie est adaptée de l'explosion libre de Sprite Fusion (https://www.spritefusion.com/pixel-art-vfx/explosion),
// MIT License, Copyright (c) 2026 Hugo Duprez.
import { Bits, Lights, B, Rng, fit, TAU, WHITE, hex, mix, scale, rgb } from "pixelfx";
import { Grains } from "./_espace.js";

export const meta = {
  name: "Explosion de l'obus",
  desc: "La grosse explosion du dépôt sans son sol : trois détonations à un battement d'écart, un dôme blanc, une boule de feu qui roule, une grande onde de choc, de gros rochers qui traînent du feu.",
  tags: ["keko", "explosion", "espace", "obus", "one-shot"],
  size: [200, 200],
  origin: [100, 100],
  duration: 3.2,
  loop: false,
  fps: 30,
  bg: "dark",
  options: { palette: ["#4a1712", "#c9281f", "#f2561d", "#ff8a2a", "#ffc23d", "#ffe26b", "#fff3a6", "#ffffff"], debris: "#4a3f69", size: 0.74, seed: 11 },
};

const OUTLINE = hex("#1a1422"), WARM = rgb(255, 176, 96);

function teinte(c) {
  c = hex(c);
  return { light: mix(scale(c, 1.35), WHITE, 0.08), body: c, shade: scale(c, 0.64) };
}

// un rocher : un côté éclairé, un côté à l'ombre, un contour, qui tourne ; chaud, il rougeoie
function rocher(p, b, st, F) {
  const r = 0.6 + b.s * 0.75, fade = Math.min(1, b.life / 0.5), lx = Math.cos(b.a) * r * 0.4, ly = Math.sin(b.a) * r * 0.4;
  const chaud = b.heat > 0.5 ? F[4] : b.heat > 0.2 ? F[2] : null;
  p.shade(b.x - r - 1, b.y - r - 1, b.x + r + 1, b.y + r + 1, (x, y, out) => {
    const dx = x - b.x, dy = y - b.y, d = Math.hypot(dx * 1.15, dy);
    if (d > r + 0.9) return;
    const lit = dx * lx + dy * ly;
    out.c = d > r ? OUTLINE : lit < -0.4 ? (chaud ?? st.light) : lit > 0.6 ? st.shade : st.body;
    out.a = fade;
  });
}

export function create(o) {
  const F = fit(o.palette, 8), S = o.size, RAD = 18 * S, st = teinte(o.debris);
  const R = new Rng(o.seed), nulle = () => Infinity;
  const grains = new Grains(R);
  const rochers = new Bits({ ground: nulle }), lights = new Lights(), flashes = [], rings = [];
  // (les trois battements : le premier au point d'impact, les deux autres de part et d'autre, plus petits)
  const a0 = R.range(0, TAU);
  const BLASTS = [
    { t: 0, x: 0, y: 0, rad: RAD, power: 1.3 * Math.pow(S, 0.8), main: true },
    { t: 0.13, x: Math.cos(a0) * RAD * 0.95, y: Math.sin(a0) * RAD * 0.95, rad: RAD * 0.6, power: 0.8 * Math.pow(S, 0.8) },
    { t: 0.25, x: Math.cos(a0 + 2.4) * RAD * 1.1, y: Math.sin(a0 + 2.4) * RAD * 1.1, rad: RAD * 0.5, power: 0.7 * Math.pow(S, 0.8) },
  ];
  let t = 0, next = 0;

  const blast = ({ x, y, rad, power, main }) => {
    // les battements suivants : leur éclair rond ; le premier a son dôme blanc (dessiné d'après t)
    if (!main) flashes.push({ x, y, r: rad * 1.05, life: 0.06, max: 0.06 });
    rings.push({ x, y, r0: rad * 0.45, r1: rad * 2.7, life: 0.36, max: 0.36, thick: 3 * Math.sqrt(S), c: F[5] }, { x, y, r0: rad * 0.3, r1: rad * 1.6, life: 0.24, max: 0.24, thick: 1.8 * Math.sqrt(S), c: F[3] });
    lights.add(x, y, rad * 3.4, WARM, 0.6 * power, 0.8);
    lights.add(x, y, rad * 1.6, WHITE, 0.6, 0.1);
    for (let i = 0; i < 5; i++) grains.ajouter("feu", x + R.range(-2.5, 2.5) * S, y + R.range(-2.5, 2.5) * S, R.range(-20, 20), R.range(-20, 20), R.range(0.25, 0.4), 0, R.range(rad * 0.4, rad * 0.55), 2);
    for (let i = 0; i < Math.round(26 * power); i++) {
      const a = R.range(0, TAU), d = R.range(0, rad * 0.55), sp = R.range(30, 170) * power;
      grains.ajouter("feu", x + Math.cos(a) * d, y + Math.sin(a) * d, Math.cos(a) * sp, Math.sin(a) * sp, R.range(0.7, 1.4), 0, R.range(rad * 0.22, rad * 0.46), 2.2);
    }
    for (let i = 0; i < Math.round(10 * power); i++) {
      const a = R.range(0, TAU), d = R.range(0, rad * 0.7), sp = R.range(10, 60);
      grains.ajouter("fumee", x + Math.cos(a) * d, y + Math.sin(a) * d, Math.cos(a) * sp, Math.sin(a) * sp, R.range(1.6, 2.6), 0, R.range(rad * 0.26, rad * 0.44), 1.2, R.range(0.12, 0.45));
    }
    for (let i = 0; i < Math.round(80 * power); i++) {
      const a = R.range(0, TAU), sp = R.range(140, main ? 420 : 340) * power;
      grains.ajouter("etincelle", x, y, Math.cos(a) * sp, Math.sin(a) * sp, R.range(0.2, 0.65), R.pick([F[6], F[5], F[4]]), 1, 3);
    }
    for (let i = 0; i < Math.round(30 * power); i++) {
      const a = R.range(0, TAU), sp = R.range(20, 130);
      grains.ajouter("braise", x + Math.cos(a) * rad * 0.4, y + Math.sin(a) * rad * 0.4, Math.cos(a) * sp, Math.sin(a) * sp, R.range(1.2, 2.6), F[3], 1, 1.2);
    }
    if (!main) return;
    // LA BOULE DE FEU QUI ROULE : de gros ronds de feu qui tournent autour du centre en s'écartant, nés l'un après l'autre
    const sens = R.sign();
    for (let i = 0; i < Math.round(16 * power); i++) {
      const a = R.range(0, TAU), d = R.range(rad * 0.3, rad * 0.8), sp = R.range(25, 60) * power, tour = R.range(60, 120) * power * sens;
      grains.ajouter("feu", Math.cos(a) * d, Math.sin(a) * d, Math.cos(a) * sp - Math.sin(a) * tour, Math.sin(a) * sp + Math.cos(a) * tour, R.range(1.1, 1.8), 0, R.range(rad * 0.35, rad * 0.6), 1.6, R.range(0.04, 0.3));
    }
    // LES GROS ROCHERS : ils filent en tournant, freinent et s'éteignent ; les plus chauds traînent du feu
    for (let i = 0; i < Math.round(18 * Math.min(1.5, S + 0.4)); i++) {
      const big = i < 7, a = R.range(0, TAU), sp = R.range(big ? 3 : 4, big ? 6 : 9) * rad;
      rochers.add({ kind: B.CHUNK, x: R.range(-0.4, 0.4) * rad, y: R.range(-0.4, 0.4) * rad, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, g: 0, drag: 1, bounce: 0, life: R.range(1.4, 2.4), a: R.range(0, TAU), va: R.range(-14, 14), s: big ? R.range(2.2, 3.2) : R.range(1, 2), heat: R.chance(0.5) ? R.range(0.6, 1) : 0 });
    }
  };

  return {
    update(dt) {
      t += dt;
      while (next < BLASTS.length && t >= BLASTS[next].t) blast(BLASTS[next++]);
      for (const a of [flashes, rings]) for (let i = a.length - 1; i >= 0; i--) if ((a[i].life -= dt) <= 0) a.splice(i, 1);
      rochers.update(dt);
      for (const b of rochers.list) {
        if (b.heat <= 0) continue;
        b.heat = Math.max(0, b.heat - dt * 0.5);
        if (b.heat > 0.25 && R.chance(16 * dt)) grains.ajouter("feu", b.x, b.y, b.vx * 0.1, b.vy * 0.1, R.range(0.18, 0.32), 0, R.range(0.8, 1.6) * Math.sqrt(S), 2);
      }
      grains.update(dt);
      lights.update(dt);
    },
    drawBack(p) {
      grains.draw(p, "back");
    },
    draw(p) {
      for (const b of rochers.list) rocher(p, b, st, F);
      grains.draw(p, "front");
      // LE PREMIER BATTEMENT : un dôme d'air blanc qui refroidit dans le feu, une lueur
      if (t < 0.04) {
        p.circle(0, 0, RAD * 1.5 + 1.2, F[5]);
        p.circle(0, 0, RAD * 1.5, WHITE);
        p.glow(0, 0, RAD * 3.5, WHITE, 0.6);
      } else if (t < 0.12) {
        const u = (t - 0.04) / 0.08, r = RAD * (1.4 - 0.7 * u);
        p.circle(0, 0, r + 1.2, F[3], 1 - u);
        p.circle(0, 0, r, u < 0.5 ? F[6] : F[5], 1 - u);
      }
      // la grande onde de choc, qui s'ouvre jusqu'au bord de la zone
      if (t < 0.5) {
        const u = t / 0.5, r = RAD * (1 + 2 * (1 - Math.pow(1 - u, 3)));
        p.ring(0, 0, r, Math.max(1, 3 * Math.sqrt(S) * (1 - u) + 0.5), u < 0.3 ? F[6] : u < 0.6 ? F[5] : F[3], Math.min(1, (1 - u) * 1.6));
        p.glow(0, 0, r, F[4], 0.25 * (1 - u));
      }
      for (const f of flashes) {
        const k2 = f.life / f.max, r = f.r * (0.8 + 0.2 * k2);
        p.circle(f.x, f.y, r + 1.2, F[2]);
        p.circle(f.x, f.y, r, k2 > 0.45 ? F[6] : F[5]);
        p.circle(f.x, f.y, r * 0.6, k2 > 0.45 ? WHITE : F[6]);
      }
      for (const r of rings) {
        const k2 = r.life / r.max, e = 1 - Math.pow(k2, 3);
        p.ring(r.x, r.y, r.r0 + (r.r1 - r.r0) * e, Math.max(1, r.thick * k2 + 0.4), r.c, Math.min(1, k2 * 1.6));
      }
      lights.draw(p);
    },
  };
}

// CRYOGÉNIE, en pixel art (Keko : « une petite étincelle de givre qui brille, puis un gros flash de givre avec
// d'énormes cristaux de glace qui se forment dans toutes les directions à partir du point, comme le sort de
// Tales of Symphonia »). Trois temps : l'étincelle, qui clignote et grossit pendant que le froid afflue vers
// elle ; le flash, un disque blanc, un éclair à huit rayons, un anneau debout, une bourrasque de flocons ; les
// cristaux, douze grands et douze petits, qui jaillissent du point en étoile et se figent, un reflet courant
// sur leur arête ; puis le bloc éclate en éclats qui retombent, rebondissent et fondent.
// Les cristaux radiaux sont dessinés ici (celui du dépôt, `crystal`, ne pousse que vers le haut) avec son
// ombrage : une face claire, une face sombre, l'arête blanche, la pointe blanche, un liseré sombre.
import { Particles, Bits, Lights, P, B, Rng, fit, flare, sparkle, band, clamp, smooth, ease, TAU, WHITE } from "pixelfx";

const CHARGE = 0.6, Y = -58, POUSSE = 0.32, TENUE = 1.05, ECLAT = CHARGE + TENUE;

export const meta = {
  name: "Cryogénie",
  desc: "Une étincelle de givre clignote et grossit pendant que le froid afflue, puis un flash blanc : d'énormes cristaux de glace jaillissent du point en étoile, se figent, et éclatent.",
  tags: ["keko", "glace", "givre", "cristaux", "sort", "one-shot"],
  size: [280, 156],
  origin: [140, 134],
  duration: 3,
  loop: false,
  fps: 30,
  bg: "ground",
  options: { palette: ["#151a3d", "#212f6b", "#2c58aa", "#3a8bd8", "#62c8f4", "#a6ecff", "#dcfbff", "#ffffff"], seed: 9 },
};

export function create(o) {
  const C = fit(o.palette, 8), R = new Rng(o.seed), sol = () => 0;
  const ps = new Particles({ rng: R, ground: sol, sparks: [C[7], C[6], C[5], C[4]], haze: C[5] });
  const bits = new Bits({ ground: sol }), lumieres = new Lights();
  // les cristaux : douze grands à angles réguliers brouillés, douze petits entre eux, quelques pointes
  const cristaux = [];
  const poser = (n, dec, L, w, delai) => {
    for (let i = 0; i < n; i++) {
      const a = dec + (i / n) * TAU + R.range(-0.12, 0.12), sa = Math.sin(a);
      let longueur = R.range(L[0], L[1]);
      // vers le bas, la pointe s'arrête au sol
      if (sa > 0.05) longueur = Math.min(longueur, (-Y - 3) / sa);
      cristaux.push({ a, L: longueur, w: R.range(w[0], w[1]), t0: CHARGE + R.range(0, delai), ph: R.next(), fond: i % 2 === 1 });
    }
  };
  poser(12, -Math.PI / 2, [34, 54], [10, 14], 0.1);
  poser(12, -Math.PI / 2 + Math.PI / 12, [14, 26], [5, 8], 0.16);
  poser(8, R.range(0, TAU), [8, 14], [3, 4], 0.22);

  /** Un cristal qui pointe de (0, Y) dans la direction a : un pic effilé, ombré comme ceux du dépôt. */
  function cristal(p, c, g, blanc, reflet, fonce) {
    const L = c.L * g, hw0 = (c.w / 2) * Math.min(1, g * 1.4);
    if (L < 1.5) return;
    const ca = Math.cos(c.a), sa = Math.sin(c.a), r0 = 2;
    const X0 = ca * r0, Y0 = Y + sa * r0;
    const x0 = Math.floor(Math.min(X0, X0 + ca * L) - hw0 - 2), x1 = Math.ceil(Math.max(X0, X0 + ca * L) + hw0 + 2);
    const y0 = Math.floor(Math.min(Y0, Y0 + sa * L) - hw0 - 2), y1 = Math.ceil(Math.max(Y0, Y0 + sa * L) + hw0 + 2);
    const dedans = (px, py) => {
      const dx = px + 0.5 - X0, dy = py + 0.5 - Y0, u = (dx * ca + dy * sa) / L, v = -dx * sa + dy * ca;
      return u >= 0 && u <= 1 && Math.abs(v) <= hw0 * (1 - u) + 0.35 ? [u, v] : null;
    };
    const teinte = (i) => (fonce ? C[Math.max(0, i - 1)] : C[i]);
    for (let py = y0; py <= y1; py++)
      for (let px = x0; px <= x1; px++) {
        const d = dedans(px, py);
        if (!d) {
          if (dedans(px - 1, py) || dedans(px + 1, py) || dedans(px, py - 1) || dedans(px, py + 1)) p.px(px, py, C[0]);
          continue;
        }
        if (blanc) {
          p.px(px, py, WHITE);
          continue;
        }
        const [u, v] = d, hw = hw0 * (1 - u) + 0.35;
        let col;
        if (u > 0.92) col = WHITE;
        else if (Math.abs(v + hw * 0.3) < 0.6) col = teinte(7); // l'arête, décalée vers la face claire
        else if (v < -hw * 0.3) col = hw + v < 1.2 ? teinte(5) : teinte(6); // la face claire, un bord plus doux
        else col = hw - v < 1.2 ? teinte(2) : (v - (-hw * 0.3)) / Math.max(1, hw * 1.3) > 0.5 ? teinte(3) : teinte(4);
        if (reflet >= 0 && v < 0.6) {
          const e = Math.abs(u - reflet);
          if (e < 0.05) col = WHITE;
          else if (e < 0.1) col = teinte(6);
        }
        p.px(px, py, col);
      }
  }

  let t = 0, lance = false, eclate = false;

  function lancer() {
    lance = true;
    lumieres.add(0, Y, 90, C[4], 0.9, 0.6);
    lumieres.add(0, Y, 48, WHITE, 0.8, 0.12);
    // la bourrasque : des flocons et des éclats dans toutes les directions
    // les flocons ne traversent pas le sol : on les jette dans la moitié haute
    for (let i = 0; i < 26; i++) {
      const a = R.range(-Math.PI, 0.2), v = R.range(60, 190);
      ps.spawn(P.FLAKE, 0, Y, Math.cos(a) * v, Math.sin(a) * v, R.range(1, 1.7), R.chance(0.6) ? WHITE : C[6], R.range(0.5, 1.6));
    }
    for (let i = 0; i < 16; i++) {
      const a = R.range(0, TAU), v = R.range(90, 200);
      bits.add({ kind: B.SHARD, x: 0, y: Y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, g: 0.7, drag: 0.7, bounce: 0.3, life: R.range(0.7, 1.1), a: R.range(0, TAU), va: R.range(-20, 20), s: R.range(1.5, 3), c: R.pick([C[7], C[6], C[5]]) });
    }
    for (let i = 0; i < 6; i++) ps.spawn(P.VAPOUR, R.range(-6, 6), Y + R.range(-6, 6), R.range(-40, 40), R.range(-30, 20), R.range(0.5, 0.9), C[6], R.range(3, 5));
  }

  function eclater() {
    eclate = true;
    lumieres.add(0, Y, 80, C[5], 0.8, 0.4);
    lumieres.add(0, Y, 36, WHITE, 0.8, 0.08);
    // chaque cristal part en éclats le long de sa direction
    for (const c of cristaux) {
      const n = 1 + Math.round(c.L / 12);
      for (let i = 0; i < n; i++) {
        const d = R.range(0.2, 1) * c.L, a = c.a + R.range(-0.5, 0.5), v = R.range(60, 180);
        bits.add({ kind: B.SHARD, x: Math.cos(c.a) * d, y: Y + Math.sin(c.a) * d, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 30, g: 0.8, drag: 0.6, bounce: 0.3, life: R.range(0.6, 1), a: R.range(0, TAU), va: R.range(-24, 24), s: R.range(1.5, 3.5) * (c.w > 8 ? 1.2 : 0.8), c: R.pick([C[7], C[6], C[5], C[4]]) });
      }
      if (c.w > 8 && c.fond) ps.spawn(P.VAPOUR, Math.cos(c.a) * c.L * 0.4, Y + Math.sin(c.a) * c.L * 0.4, Math.cos(c.a) * 16, Math.sin(c.a) * 16 - 8, R.range(0.4, 0.7), C[6], R.range(2, 3.5));
    }
    for (let i = 0; i < 20; i++) {
      const a = R.range(-Math.PI, 0.2), v = R.range(30, 120);
      ps.spawn(P.FLAKE, 0, Y, Math.cos(a) * v, Math.sin(a) * v, R.range(0.7, 1.1), R.chance(0.5) ? WHITE : C[6], R.range(0.5, 1.4));
    }
  }

  return {
    update(dt) {
      t += dt;
      if (t < CHARGE - 0.05) {
        // le froid afflue : des traits convergent vers l'étincelle, de plus en plus vite
        const k = t / CHARGE;
        if (R.chance(0.5 + k)) {
          const a = R.range(0, TAU), D = R.range(24, 56), T = R.range(0.18, 0.3), v = (D * 3) / (Math.exp(3 * T) - 1);
          const x = Math.cos(a) * D, y = Y + Math.sin(a) * D, l = Math.hypot(x, y - Y) || 1;
          ps.spawn(P.STREAK, x, y, (-x / l) * v, ((Y - y) / l) * v, T, R.chance(0.5) ? C[6] : C[5]);
        }
        if (R.chance(0.3)) ps.spawn(P.STAR, R.range(-6, 6), Y + R.range(-6, 6), 0, -2, R.range(0.15, 0.3), R.chance(0.5) ? WHITE : C[6], R.range(0.5, 1.2));
      }
      if (!lance && t >= CHARGE) lancer();
      if (!eclate && t >= ECLAT) eclater();
      // tant que la glace tient : des reflets et des flocons qui tombent
      if (lance && !eclate && t > CHARGE + 0.25) {
        if (R.chance(0.5)) {
          const c = R.pick(cristaux), d = R.range(0.3, 0.95) * c.L;
          ps.spawn(P.STAR, Math.cos(c.a) * d, Y + Math.sin(c.a) * d, 0, -2, R.range(0.25, 0.5), R.chance(0.6) ? C[6] : WHITE, R.range(0.6, 2));
        }
        if (R.chance(0.2)) ps.spawn(P.FLAKE, R.range(-60, 60), Y - R.range(30, 60), R.range(-4, 4), R.range(4, 12), R.range(1, 1.5), R.chance(0.5) ? WHITE : C[6], R.range(0.5, 1.2));
      }
      ps.update(dt);
      bits.update(dt);
      lumieres.update(dt);
    },
    drawBack(p) {
      // le sol gèle sous le sort : une lueur froide, un givre qui s'étend puis fond
      if (lance) {
        const k = smooth(CHARGE, CHARGE + 0.4, t) * (1 - smooth(ECLAT + 0.3, ECLAT + 1, t));
        if (k > 0) {
          for (let i = -2; i <= 2; i++) p.glow(i * 22, -3, 26, C[4], 0.15 * k);
          const portee = 56 * k;
          for (let x = -Math.floor(portee); x <= portee; x++) {
            const q = Math.abs(x) / 56;
            if (((x * 7919) % 11) / 11 < 0.6 - q * 0.4) p.dot(x, 0, ((x * 31) % 7) / 7 < 0.3 ? WHITE : C[6], k * (1 - q * 0.5));
          }
        }
      }
      // les cristaux du fond (un sur deux), plus sombres
      if (lance && !eclate) for (const c of cristaux) if (c.fond) this.cristal(p, c, true);
      ps.draw(p, "back");
    },
    cristal(p, c, fond) {
      if (t < c.t0) return;
      const g = ease.outBack(clamp((t - c.t0) / 0.14), 2.2), blanc = t < c.t0 + 0.035;
      const balayage = (((t - c.t0) * 0.8 + c.ph * 2) % 1.8) / 0.5;
      cristal(p, c, g, blanc, balayage <= 1 ? balayage : -1, fond);
      if (blanc) p.glow(Math.cos(c.a) * c.L * 0.5, Y + Math.sin(c.a) * c.L * 0.5, 14, C[6], 0.5);
    },
    draw(p) {
      if (t < CHARGE) {
        // l'étincelle : une croix qui grandit en clignotant, deux battements, un cœur blanc
        const k = t / CHARGE, bat = 1 + 0.35 * Math.exp(-((t - CHARGE * 0.5) ** 2) / 0.0015) + 0.45 * Math.exp(-((t - CHARGE * 0.82) ** 2) / 0.0015);
        const cl = 0.7 + 0.3 * Math.sin(t * 46), bras = (1.5 + 7 * k * k) * bat * cl;
        sparkle(p, 0, Y, bras, C[6], C[5], 0.3 + 0.6 * k);
        if (bras > 3) for (const [dx, dy] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) p.dot(dx * bras * 0.45, Y + dy * bras * 0.45, C[6], 0.8);
        p.glow(0, Y, 10 + 20 * k, C[5], 0.3 + 0.5 * k * bat);
        p.glow(0, Y, 4 + 4 * k, WHITE, 0.4 * k);
      } else {
        const s = t - CHARGE;
        // les cristaux de devant
        if (!eclate) for (const c of cristaux) if (!c.fond) this.cristal(p, c, false);
        // le flash : un disque blanc qui se contracte, l'éclair, l'anneau debout qui s'ouvre
        if (s < 0.06) p.circle(0, Y, 14 * (1 - s / 0.06) + 3, WHITE);
        if (s < 0.3) {
          const a = s / 0.3;
          flare(p, 0, Y, 48 * Math.pow(1 - a, 1.4), 1 - a, C);
          p.glow(0, Y, 56, WHITE, 0.6 * (1 - a));
        }
        const u = s / 0.45;
        if (u < 1) {
          const r = 6 + 60 * ease.outCubic(u);
          band(p, 0, Y, r, 1, Math.max(1, 4 * (1 - u)), 1.1 - u, C, (g) => Y + Math.sin(g) * r < -1, u < 0.2);
          p.glowRing(0, Y, r, 6, C[5], 0.4 * (1 - u));
        }
        // la glace tient : elle luit, et juste avant d'éclater elle flashe
        if (!eclate && s > POUSSE) {
          const pre = clamp((t - (ECLAT - 0.12)) / 0.12);
          p.glow(0, Y, 60, C[4], 0.2 + 0.1 * Math.sin(t * 3) + 0.5 * pre);
          if (pre > 0.5) for (const c of cristaux) cristal(p, c, 1, true, -1, false);
        }
        if (eclate) {
          const e = t - ECLAT;
          if (e < 0.05) p.circle(0, Y, 12 * (1 - e / 0.05) + 2, WHITE);
          if (e < 0.25) flare(p, 0, Y, 30 * Math.pow(1 - e / 0.25, 1.4), 1 - e / 0.25, C);
        }
      }
      bits.draw(p);
      ps.draw(p, "front");
      lumieres.draw(p);
    },
  };
}

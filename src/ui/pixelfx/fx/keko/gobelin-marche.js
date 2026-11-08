// LE GOBELIN QUI MARCHE (Keko : « tente de me faire un gobelin et de le faire marcher »). Un cycle de marche en boucle,
// sur place : deux pas, le pied qui porte recule pendant que l'autre se lève et passe devant, les bras en opposition,
// le corps qui rebondit au passage, penché en avant comme un gobelin qui trotte. L'effet lui-même ne dessine que la
// poussière des pas : une bouffée au sol à chaque pose. Le personnage est choisi par le banc (`personnage`).
import { Particles, P, Rng, fit, PAL } from "pixelfx";

const PAS = 0.42, D = 2 * PAS;
const MARCHE = { lean: 3, hy: 0.3 };
// les clés d'un pas : appui (le pied proche devant), passage (le pied loin levé), appui (le pied loin devant), passage.
// `ffy`/`fby` sont la hauteur des CHEVILLES : -4 au sol (la pose de repos du dépôt), plus haut quand le pied est levé —
// à 0, les pieds s'enfonçaient dans le sol (Keko). Le corps est au plus BAS à l'appui (jambes écartées) et au plus
// HAUT au passage (la jambe d'appui tendue) : c'est ce qui fait le rebond d'une marche.
const APPUI_N = { ...MARCHE, crouch: 3, ffx: 9, ffy: -4, fbx: -8, fby: -4, fx: -8, fy: -12, bx: 11, by: -16 };
const PASSAGE_F = { ...MARCHE, crouch: 0, ffx: 1, ffy: -4, fbx: 0, fby: -9, fx: 1, fy: -14, bx: 3, by: -15 };
const APPUI_F = { ...MARCHE, crouch: 3, ffx: -8, ffy: -4, fbx: 9, fby: -4, fx: 11, fy: -16, bx: -7, by: -12 };
const PASSAGE_N = { ...MARCHE, crouch: 0, ffx: 0, ffy: -9, fbx: 1, fby: -4, fx: 3, fy: -15, bx: 1, by: -14 };

export const meta = {
  name: "Gobelin qui marche",
  desc: "Un cycle de marche, sur place : deux pas, les bras en opposition, le corps qui rebondit au passage, penché en avant ; une bouffée de poussière à chaque pose du pied.",
  tags: ["keko", "gobelin", "marche", "cycle", "personnage", "loop"],
  size: [72, 60],
  origin: [36, 52],
  duration: D,
  loop: true,
  fps: 30,
  bg: "ground",
  options: { palette: PAL.dust, seed: 2 },
};

export const act = {
  poses: [
    [0, APPUI_N],
    [PAS / 2, PASSAGE_F],
    [PAS, APPUI_F],
    [PAS * 1.5, PASSAGE_N],
    [D, APPUI_N],
  ],
};

export function create(o) {
  const C = fit(o.palette, 7), R = new Rng(o.seed), e = o.echelle ?? 0.78;
  const ps = new Particles({ rng: R, ground: () => 0 });
  let t = 0, pas = 0;
  return {
    update(dt) {
      t += dt;
      // une bouffée au pied qui se pose : à chaque appui, derrière le talon
      const n = Math.floor(t / PAS);
      while (pas < n) {
        pas++;
        const x = 9 * e;
        for (let i = 0; i < 3; i++) ps.spawn(P.DUST, x + R.range(-2, 1), -1, -R.range(6, 20), -R.range(3, 10), R.range(0.25, 0.45), C[5], R.range(1.2, 2));
      }
      ps.update(dt);
    },
    draw(p) {
      ps.draw(p, "back");
      ps.draw(p, "front");
    },
  };
}

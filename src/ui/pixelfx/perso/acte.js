// JOUER UN ACTE AVEC UN DE NOS PERSONNAGES. `createAct` du dépôt tient tout (l'effet, les poses, les cibles, le gel, la
// secousse) mais dessine SON mannequin ; on lui demande donc tout sauf le corps, et on peint le nôtre à sa place, posé
// par notre squelette (`posed(pose, perso)`), entre l'arrière et l'avant de l'effet — l'ordre du dépôt pour un acte
// ordinaire : arrière, cibles, ombre, corps, avant, paille. (Les images rémanentes et la poussière des pas du dépôt
// restent privées à son acte : un effet à nous qui en veut les dessine lui-même.)
import { createAct } from "pixelfx";
import { posed, HUMAIN } from "./rig.js";

export { HUMAIN };

/** L'acte du dépôt, plus le personnage qui le joue. */
export function creerActe(mod, o = {}, perso = HUMAIN) {
  const acte = createAct(mod, o);
  const X = o.x ?? 0, Y = o.y ?? 0, flip = !!o.flip;
  const dessiner = (frame) => dessinerLeCorps(acte, frame, perso, X, Y, flip);
  return {
    acte,
    perso,
    get t() { return acte.t; },
    get shake() { return acte.shake; },
    get frozen() { return acte.frozen; },
    get pose() { return acte.pose; },
    update: (dt) => acte.update(dt),
    draw: (frame) => dessiner(frame),
    done: () => acte.done(),
    stop: () => acte.stop(),
  };
}

/** Peint l'acte entier dans `frame`, le corps de `perso` à la place du mannequin. */
export function dessinerLeCorps(acte, frame, perso, X, Y, flip) {
  const W = frame.w, H = frame.h, q = acte.pose, actif = acte.t >= 0, fx = acte.fx;
  const FX = X - (frame.ox | 0), FY = Y - (frame.oy | 0);
  if (actif) fx.draw(frame, "back");
  for (const cible of acte.targets) cible.draw(frame.color, W, H, FX, FY, flip);
  const rx = Math.round(q.x ?? 0), ry = Math.round(q.y ?? 0), BX = FX + (flip ? -rx : rx), BY = FY + ry;
  // l'ombre au sol, celle du dépôt : plus large les pieds écartés, plus étroite en l'air
  const hw = Math.round((10 + (Math.abs((q.ffx ?? -2) - (q.fbx ?? 3)) >> 1)) * perso.echelle) - Math.min(8, Math.abs(ry) >> 1);
  if (FY >= 0 && FY < H)
    for (let dy = 0; dy < 2; dy++)
      for (let x = -hw + dy * 2; x <= hw - dy * 2; x++) {
        const px = BX + x, i = (FY + dy) * W + px;
        if (px < 0 || px >= W || FY + dy >= H) continue;
        frame.color[i] = (frame.color[i] & 0xffffff) | (Math.max(frame.color[i] >>> 24, 110) << 24);
      }
  const r = posed(q, perso);
  for (let i = 0; i < r.n; i++) {
    const px = flip ? BX - r.xs[i] - 1 : BX + r.xs[i], py = BY + r.ys[i];
    if (px < 0 || py < 0 || px >= W || py >= H) continue;
    frame.color[py * W + px] = r.color[i];
  }
  if (actif) fx.draw(frame, "front");
  for (const cible of acte.targets) cible.drawStraw(frame.color, W, H, FX, FY, flip);
}

// LES GRAINS DE L'ESPACE : des particules SANS PESANTEUR NI MONTÉE (Keko : « des débris d'explosion tombent vers le bas
// comme s'il y avait de la gravité, il ne faudrait pas »). Celles du dépôt sont faites pour un sol : l'étincelle tombe
// et rebondit, la braise monte, le feu et la fumée s'élèvent. Ici, tout file droit et freine dans le vide.
// Quatre sortes : l'ÉTINCELLE (un trait étiré sur sa vitesse, blanc en tête, qui refroidit), la BRAISE (un point qui
// refroidit du jaune au rouge sombre), le FEU (un rond plein qui refroidit par la rampe du feu puis devient fumée), la
// FUMÉE (un rond translucide qui grossit et s'éclaircit). Un fichier commençant par _ n'est pas un effet du banc.
import { FIRE_RAMP, SMOKE_RAMP, WHITE } from "pixelfx";

export class Grains {
  constructor(rng) {
    this.R = rng;
    this.liste = [];
  }
  /** sorte : 'etincelle' | 'braise' | 'feu' | 'fumee' ; c : la couleur d'une étincelle ; taille : le rayon d'un rond ; frein par seconde ; delai avant de naître. */
  ajouter(sorte, x, y, vx, vy, vie, c = WHITE, taille = 1, frein = 1.5, delai = 0) {
    this.liste.push({ sorte, x, y, vx, vy, vie, max: vie, c, taille, frein, delai });
  }
  get count() {
    return this.liste.length;
  }
  update(dt) {
    for (let i = this.liste.length - 1; i >= 0; i--) {
      const g = this.liste[i];
      if (g.delai > 0) {
        g.delai -= dt;
        continue;
      }
      if ((g.vie -= dt) <= 0) {
        this.liste.splice(i, 1);
        continue;
      }
      const f = Math.exp(-g.frein * dt);
      g.vx *= f;
      g.vy *= f;
      g.x += g.vx * dt;
      g.y += g.vy * dt;
    }
  }
  /** couche : 'back' (les ronds : feu et fumée), 'front' (les étincelles et les braises), rien pour tout. */
  draw(p, couche) {
    for (const g of this.liste) {
      if (g.delai > 0) continue;
      const u = 1 - g.vie / g.max;
      if (g.sorte === "fumee" || g.sorte === "feu") {
        if (couche === "front") continue;
        if (g.sorte === "fumee") {
          p.disc(g.x, g.y, g.taille * (1 + 1.2 * u), SMOKE_RAMP[Math.min(4, Math.floor(u * 5))], 0.45 * (1 - u));
          continue;
        }
        const r = g.taille * (0.8 + 0.6 * u);
        if (u < 0.55) {
          const c = FIRE_RAMP[Math.min(8, Math.floor((u / 0.55) * 8))];
          p.disc(g.x, g.y, r, c, 0.95);
          p.glow(g.x, g.y, r * 2.2, FIRE_RAMP[3], 0.4 * (1 - u / 0.55));
        } else p.disc(g.x, g.y, r * 1.25, SMOKE_RAMP[Math.min(4, Math.floor(((u - 0.55) / 0.45) * 5))], 0.5 * (1 - u));
        continue;
      }
      if (couche === "back") continue;
      if (g.sorte === "etincelle") {
        const sp = Math.hypot(g.vx, g.vy) || 1;
        const L = Math.min(5, 1 + sp * 0.025);
        p.line(g.x - (g.vx / sp) * L, g.y - (g.vy / sp) * L, g.x, g.y, g.c, 1 - u * 0.6);
        if (u < 0.5) p.px(g.x, g.y, WHITE);
        p.light(g.x, g.y, g.c, 0.6 * (1 - u));
      } else {
        // la braise : du jaune au rouge sombre, qui clignote en mourant
        const c = FIRE_RAMP[Math.min(8, 2 + Math.floor(u * 6))];
        if (u > 0.7 && Math.floor(g.vie * 30) % 2 === 0) continue;
        p.dot(g.x, g.y, c, 1 - u * 0.5);
        p.light(g.x, g.y, FIRE_RAMP[4], 0.35 * (1 - u));
      }
    }
  }
}

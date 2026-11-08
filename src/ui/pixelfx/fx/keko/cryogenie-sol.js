// CRYOGÉNIE AU SOL : la même que `cryogenie.js`, posée sur le plancher (Keko : « une version posée au sol, comme
// le sont certains effets déjà ») — l'étincelle au ras du sol, le flash, les cristaux en éventail vers le haut,
// l'anneau couché sur le sol et le givre qui s'étend avec lui, puis l'éclatement.
import { fabriquer } from "./cryogenie.js";

export const meta = {
  name: "Cryogénie au sol",
  desc: "La Cryogénie posée au sol : l'étincelle de givre au ras du plancher, le flash, un anneau de givre qui court sur le sol, d'énormes cristaux en éventail qui tiennent puis éclatent.",
  tags: ["keko", "glace", "givre", "cristaux", "sort", "sol", "one-shot"],
  size: [280, 156],
  origin: [140, 112],
  duration: 3,
  loop: false,
  fps: 30,
  bg: "ground",
  options: { palette: ["#151a3d", "#212f6b", "#2c58aa", "#3a8bd8", "#62c8f4", "#a6ecff", "#dcfbff", "#ffffff"], seed: 9 },
};

export const create = fabriquer(true);

// La déclaration du module JS voisin, pour TypeScript.
export class Grains {
  constructor(rng: { next(): number; range(a: number, b: number): number })
  ajouter(sorte: 'etincelle' | 'braise' | 'feu' | 'fumee', x: number, y: number, vx: number, vy: number, vie: number, c?: number, taille?: number, frein?: number, delai?: number): void
  update(dt: number): void
  draw(p: unknown, couche?: 'back' | 'front'): void
}

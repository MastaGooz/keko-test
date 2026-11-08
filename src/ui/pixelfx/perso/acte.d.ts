// Les déclarations des modules JS voisins (le squelette paramétré et l'acte), pour TypeScript.
export type Personnage = { id: string; echelle: number; palette: Record<string, string>; traits: Record<string, unknown> }
export const HUMAIN: Personnage
export function creerActe(mod: unknown, o: Record<string, unknown>, perso: Personnage): { t: number; update(dt: number): void; draw(frame: unknown): void; done(): boolean; stop(): void }

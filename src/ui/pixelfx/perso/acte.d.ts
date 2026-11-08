// Les déclarations des modules JS voisins (le squelette paramétré et l'acte), pour TypeScript.
export type Personnage = { id: string; echelle: number; palette: Record<string, string>; traits: Record<string, unknown> }
export const HUMAIN: Personnage
export function creerActe(mod: unknown, o: Record<string, unknown>, perso: Personnage): { t: number; update(dt: number): void; draw(frame: unknown): void; done(): boolean; stop(): void }
export type Pose = Record<string, number | string | boolean | undefined>
export function peindrePose(frame: unknown, pose: Pose, perso: Personnage, X: number, Y: number, flip: boolean, teinte?: number, k?: number, alpha?: number): { x0: number; y0: number; x1: number; y1: number }
export function peindreOmbre(frame: unknown, pose: Pose, perso: Personnage, X: number, Y: number): void

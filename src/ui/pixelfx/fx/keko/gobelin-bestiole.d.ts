// La déclaration de l'effet JS voisin, pour TypeScript : la page pose ses propres types.
export const meta: Record<string, unknown>
export const D: number
export type PalettesGobelin = { C: number[]; K: number[]; E: number[] }
export function palettesGobelin(o?: Record<string, unknown>): PalettesGobelin
export function peindreGobelin(p: unknown, etat: { t?: number; marche?: number | null; attaque?: number | null; teinte?: number; k?: number; alpha?: number; ombre?: boolean }, pal: PalettesGobelin): unknown
export function draw(p: unknown, t: number, o: Record<string, unknown>): void
export function drawBack(p: unknown, t: number, o: Record<string, unknown>): void

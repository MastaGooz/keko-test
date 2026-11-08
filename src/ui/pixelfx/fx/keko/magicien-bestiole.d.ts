// La déclaration de l'effet JS voisin, pour TypeScript : la page pose ses propres types.
export const meta: Record<string, unknown>
export const D: number
export const INCANTATION: number
export const INCANTE: number
export type PalettesMagicien = { C: number[]; P: number[]; B: number[]; O: number[]; W: number[] }
export function palettesMagicien(o?: Record<string, unknown>): PalettesMagicien
export function positionOrbe(u?: number): { x: number; y: number }
export function peindreMagicien(p: unknown, etat: { t?: number; incante?: number | null; touche?: boolean; alpha?: number; ombre?: boolean }, pal: PalettesMagicien): { x: number; y: number }
export function draw(p: unknown, t: number, o: Record<string, unknown>): void
export function drawBack(p: unknown, t: number, o: Record<string, unknown>): void

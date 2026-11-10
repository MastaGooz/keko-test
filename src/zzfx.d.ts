/**
 * `zzfx` est écrit en JavaScript sans types : on déclare ce que `ui/vaisseau/sons.ts` en utilise.
 */
declare module 'zzfx' {
  export const ZZFX: {
    volume: number
    sampleRate: number
    audioContext: AudioContext
    buildSamples(...parametres: (number | undefined)[]): number[]
    playSamples(canaux: number[][], volume?: number, vitesse?: number, pan?: number, boucle?: boolean): AudioBufferSourceNode
  }
  export function zzfx(...parametres: (number | undefined)[]): AudioBufferSourceNode
}

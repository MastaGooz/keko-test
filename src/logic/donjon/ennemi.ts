/**
 * L'ENNEMI DE L'ÉTAGE : ses PV et son nom, tirés de (seed de saison, étage).
 *
 * *Même saison, même étage, même ennemi* : deux joueurs qui le voient (et
 * plus tard deux clients d'un backend) lisent le même nom sans le
 * transmettre.
 */
import { createRng, type Rng } from '../rng.ts'
import type { ConfigDonjon } from './config.ts'
import type { Ennemi } from './types.ts'

const DEBUTS = ['Gr', 'Kr', 'Z', 'M', 'Sk', 'Br', 'Dr', 'Ug', 'Th', 'Vr', 'Gn', 'N']
const MILIEUX = ['a', 'o', 'u', 'ü', 'au', 'ar', 'or', 'ul', 'ak']
const FINS = ['k', 'g', 'zz', 'mak', 'gash', 'nok', 'thul', 'rg', 'dûm', 'sh']

const CREATURES = [
  'gobelin', 'orc', 'troll', 'ogre', 'chaman gobelin', 'chef orc', 'warg',
  'berserker orc', 'gobelin sapeur', 'troll des cavernes', 'garde orc', 'brute',
]
const TITRES = [
  'enragé', 'au crâne fendu', 'des profondeurs', 'mange-pierres', 'le Borgne',
  'aux dents de fer', 'le Puant', 'des tunnels', 'le Rongé', 'à la hache rouillée',
  'le Gras', 'qui ne dort pas', 'des fosses', 'le Balafré',
]

function choisir<T>(rng: Rng, liste: readonly T[]): T {
  return liste[Math.floor(rng.next() * liste.length)]
}

/** Une graine par (saison, étage), mélangée pour que deux étages voisins ne se ressemblent pas. */
function graine(seed: number, etage: number): number {
  return (Math.imul(seed ^ 0x9e3779b9, 0x85ebca6b) ^ Math.imul(etage, 0xc2b2ae35)) >>> 0
}

export function nomDeLEnnemi(seed: number, etage: number): string {
  const rng = createRng(graine(seed, etage))
  const nom = choisir(rng, DEBUTS) + choisir(rng, MILIEUX) + choisir(rng, FINS)
  return `${nom}, ${choisir(rng, CREATURES)} ${choisir(rng, TITRES)}`
}

export function pvDeLEtage(config: ConfigDonjon, etage: number): number {
  return Math.round(config.ennemi.pvBase * Math.pow(etage, config.ennemi.exposant))
}

export function ennemiDeLEtage(config: ConfigDonjon, seed: number, etage: number): Ennemi {
  const pv = pvDeLEtage(config, etage)
  return { etage, nom: nomDeLEnnemi(seed, etage), pv, pvMax: pv }
}

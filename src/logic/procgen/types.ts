/**
 * LE DESSIN D'UNE ICÔNE ENGENDRÉE — pur, sans DOM.
 *
 * Un générateur ne rend pas du SVG : il décrit des FORMES (un chemin, une
 * couleur, un contour, une découpe) dans une boîte carrée. C'est `ui/procgen/`
 * qui en fait un élément SVG ou une chaîne. *`logic/` ne sait rien du
 * navigateur*, et le dessin se vérifie donc sous `node` comme le reste.
 */

/** Le côté de la boîte de dessin (viewBox `0 0 BOITE BOITE`). */
export const BOITE = 128
/** L'axe de symétrie des vaisseaux, et le centre des planètes. */
export const AXE = BOITE / 2

/**
 * Les familles : trois RÔLES de vaisseau, qui se croisent avec la race, et
 * deux corps célestes qui n'en ont pas. `vaisseau` tire un rôle (combat ou
 * minage) depuis l'id ; `alien` reste accepté pour le combat alien.
 */
export type Famille = 'combat' | 'minage' | 'station' | 'planete' | 'asteroide' | 'vaisseau' | 'alien'
export const FAMILLES: readonly Famille[] = ['combat', 'minage', 'station', 'planete', 'asteroide']
/** Les familles qui ont une race. */
export const ROLES: readonly ('combat' | 'minage' | 'station')[] = ['combat', 'minage', 'station']

/** La race : la technologie qui dessine le vaisseau. Les planètes l'ignorent. */
export type Race = 'humain' | 'alien' | 'biologique'
export const RACES: readonly Race[] = ['humain', 'alien', 'biologique']

/** Une forme : un chemin SVG (`d`) et sa peinture. */
export type Forme = {
  d: string
  /** Une couleur CSS, ou `none`. */
  fill: string
  stroke?: string
  epaisseur?: number
  opacite?: number
  /** L'identifiant d'une découpe du dessin (`Dessin.clips`). */
  clip?: string
  regle?: 'evenodd'
}

/** Une découpe : l'union de ses chemins. */
export type Clip = { id: string; chemins: string[] }

export type Dessin = {
  famille: Famille
  race?: Race
  id: string
  seed: number
  boite: number
  clips: Clip[]
  formes: Forme[]
}

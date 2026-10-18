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
 * Les familles. `vaisseau` tire une classe (combat ou minage) depuis l'id ;
 * les autres sont celles qu'on montre et qu'on demande.
 */
export type Famille = 'combat' | 'minage' | 'station' | 'planete' | 'asteroide' | 'vaisseau'
export const FAMILLES: readonly Famille[] = ['combat', 'minage', 'station', 'planete', 'asteroide']

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
  id: string
  seed: number
  boite: number
  clips: Clip[]
  formes: Forme[]
}

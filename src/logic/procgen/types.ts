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
export type Famille =
  | 'combat' | 'minage' | 'station' | 'planete' | 'asteroide' | 'origami' | 'gribouillis'
  | 'perso-papier' | 'perso-pixel' | 'perso-encre' | 'heros' | 'masque' | 'creature' | 'gobelin'
  | 'vaisseau' | 'alien'
export const FAMILLES: readonly Famille[] = ['combat', 'minage', 'station', 'planete', 'asteroide', 'origami', 'gribouillis', 'perso-papier', 'perso-pixel', 'perso-encre', 'heros', 'masque', 'creature', 'gobelin']
/** Les familles qui ont une race. */
export const ROLES: readonly ('combat' | 'minage' | 'station')[] = ['combat', 'minage', 'station']

/** La race : la technologie qui dessine le vaisseau. Les planètes l'ignorent. */
export type Race = 'humain' | 'alien' | 'biologique'
export const RACES: readonly Race[] = ['humain', 'alien', 'biologique']

/** Un arrêt de dégradé : position, couleur, et l'opacité (1 si absente) — un voile qui se fond part d'un arrêt transparent. */
export type Arret = readonly [number, string, number?]
/** Un dégradé, en coordonnées de la boîte : radial (centre, rayon) ou linéaire (deux points). */
export type Degrade =
  | { type: 'radial'; cx: number; cy: number; r: number; arrets: readonly Arret[] }
  | { type: 'lineaire'; x1: number; y1: number; x2: number; y2: number; arrets: readonly Arret[] }

/** Une forme : un chemin SVG (`d`) et sa peinture. */
export type Forme = {
  d: string
  /** Une couleur CSS, ou `none` ; `degrade` la remplace s'il est donné (le fill reste le repli). */
  fill: string
  degrade?: Degrade
  stroke?: string
  epaisseur?: number
  opacite?: number
  /** L'identifiant d'une découpe du dessin (`Dessin.clips`). */
  clip?: string
  regle?: 'evenodd'
  /** Un flou gaussien (écart-type en unités de la boîte) : une ombre douce, un reflet qui se fond. */
  flou?: number
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
  /** Un nom lisible, quand le dessin en a un (l'expression d'un emoji). */
  nom?: string
}

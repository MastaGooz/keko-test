/**
 * LES PALETTES — jamais de couleur purement aléatoire : un dessin tire une
 * palette entière, cinq teintes accordées entre elles.
 *
 * `principale` est la masse, `secondaire` les pièces rapportées, `accent` ce
 * qui doit se voir de loin (cockpit, flamme, calotte), `ombre` les contours
 * et le côté dans l'ombre, `clair` les reflets.
 */
export type Palette = {
  nom: string
  principale: string
  secondaire: string
  accent: string
  ombre: string
  clair: string
}

export const PALETTES_VAISSEAU: readonly Palette[] = [
  { nom: 'blanc-orange', principale: '#e4ebf2', secondaire: '#93a6ba', accent: '#ff6b35', ombre: '#34435a', clair: '#ffffff' },
  { nom: 'nuit-cyan', principale: '#4f5f84', secondaire: '#2e3755', accent: '#5ee6ff', ombre: '#1a2036', clair: '#b9c8ff' },
  { nom: 'sable-sarcelle', principale: '#ebc87a', secondaire: '#bf8a33', accent: '#2f7f84', ombre: '#5a3d12', clair: '#fff2c9' },
  { nom: 'rouge-or', principale: '#d05252', secondaire: '#8f2f2f', accent: '#ffd166', ombre: '#4a1616', clair: '#ffdcdc' },
  { nom: 'vert-blanc', principale: '#7ec981', secondaire: '#3f9256', accent: '#ffffff', ombre: '#1f4d2a', clair: '#e0ffe2' },
  { nom: 'violet-rose', principale: '#9d7fd6', secondaire: '#6d50b8', accent: '#ffb3f5', ombre: '#3a2a66', clair: '#ebe0ff' },
  { nom: 'acier-jaune', principale: '#5e6b75', secondaire: '#3a444c', accent: '#ffcc00', ombre: '#1c2328', clair: '#cdd7de' },
  { nom: 'blanc-bleu', principale: '#f3f4f6', secondaire: '#c3c7cf', accent: '#2a9df4', ombre: '#4f5660', clair: '#ffffff' },
  { nom: 'orange-marine', principale: '#f4a261', secondaire: '#e76f51', accent: '#264653', ombre: '#7a3b1e', clair: '#ffe3c7' },
  { nom: 'sarcelle-jaune', principale: '#2fa396', secondaire: '#1f6f66', accent: '#e9c46a', ombre: '#123c37', clair: '#c8f0ea' },
  { nom: 'noir-rouge', principale: '#3a3f4a', secondaire: '#242830', accent: '#ff3b3b', ombre: '#121418', clair: '#9aa3b2' },
  { nom: 'creme-vert', principale: '#f1e7c8', secondaire: '#cdb98a', accent: '#52b788', ombre: '#6b5a33', clair: '#ffffff' },
]

export type TypePlanete = 'continents' | 'bandes' | 'crateres'

/** Une palette de planète sait pour quels types de surface elle est faite. */
export type PalettePlanete = Palette & { pour: readonly TypePlanete[] }

export const PALETTES_PLANETE: readonly PalettePlanete[] = [
  { nom: 'ocean', principale: '#3a7bd5', secondaire: '#5bbf6a', accent: '#f6f8ff', ombre: '#1c3f73', clair: '#a6d6ff', pour: ['continents'] },
  { nom: 'desert', principale: '#e0a458', secondaire: '#c4713a', accent: '#f3dba8', ombre: '#7a4320', clair: '#ffe9c4', pour: ['continents', 'crateres', 'bandes'] },
  { nom: 'lave', principale: '#4a2a2a', secondaire: '#d84727', accent: '#ffb347', ombre: '#1e0f0f', clair: '#ff8a6a', pour: ['continents', 'crateres'] },
  { nom: 'toxique', principale: '#7bbf3a', secondaire: '#4f8a1f', accent: '#dff58b', ombre: '#2c4f10', clair: '#ecffb0', pour: ['continents', 'bandes'] },
  { nom: 'glace', principale: '#cfe8f7', secondaire: '#9ac7e3', accent: '#ffffff', ombre: '#5a86a8', clair: '#ffffff', pour: ['continents', 'crateres'] },
  { nom: 'lune', principale: '#b9b9c2', secondaire: '#8f8f9a', accent: '#e4e4ea', ombre: '#5b5b66', clair: '#ffffff', pour: ['crateres'] },
  { nom: 'rouille', principale: '#c96a3b', secondaire: '#9a4a28', accent: '#f0c9a0', ombre: '#5a2a14', clair: '#ffd9b8', pour: ['crateres', 'bandes'] },
  { nom: 'geante-creme', principale: '#f1c27d', secondaire: '#d98c45', accent: '#8f4f2b', ombre: '#7a3f1f', clair: '#ffe6c2', pour: ['bandes'] },
  { nom: 'geante-violette', principale: '#8e6bc1', secondaire: '#6648a3', accent: '#d9b8ff', ombre: '#3b2a5c', clair: '#efe3ff', pour: ['bandes'] },
  { nom: 'geante-bleue', principale: '#5fa8d3', secondaire: '#3d7fb0', accent: '#bfe3ff', ombre: '#214a6b', clair: '#e2f4ff', pour: ['bandes', 'continents'] },
  { nom: 'geante-rose', principale: '#f4a7c3', secondaire: '#d86f98', accent: '#ffe1ec', ombre: '#8a3a5c', clair: '#fff0f6', pour: ['bandes'] },
  { nom: 'geante-verte', principale: '#9fd3a8', secondaire: '#5fa873', accent: '#e6ffd8', ombre: '#2f5e3c', clair: '#f2fff0', pour: ['bandes', 'crateres'] },
]

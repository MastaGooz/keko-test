/**
 * LES APPARENCES DES VAISSEAUX DU VORTEX (Keko, 17/11 : « on va enlever le petit marquage coloré des vaisseaux quand on
 * choisit une couleur ; ce n'est pas très visible pour les joueurs en jeu et ça n'ajoute pas grand-chose. On va le
 * remplacer par un vrai changement de carrosserie, de skin du vaisseau : pour chaque vaisseau, trois couleurs différentes
 * qui vont vraiment changer le vaisseau profondément — pas au niveau de sa structure générale, mais au niveau des petits
 * détails et des couleurs »).
 *
 * Une apparence, c'est :
 * - SES RAMPES : les matières du vaisseau repeintes (sa carapace, ses ailes, sa verrière, son plasma, son cœur…) — le
 *   peintre les prend à la place des siennes (`Options.rampes`), et ce qui en est fait les suit (la flamme de plasma du
 *   Pulsar, le cœur du Néant) ;
 * - SON HABIT : des détails posés sur les ailes et sur la coque (bandes, chevrons, flammes peintes, écailles, taches qui
 *   luisent), dans les matières `decor` et `decor2`, que ses rampes colorent ;
 * - SON ACCENT : la couleur de ses feux de position et des voyants de ce qu'il pose (tourelles, balises : la matière
 *   `marque`).
 *
 * La première de chaque vaisseau est SON ORIGINE : ses couleurs de toujours, sans la marque du joueur.
 */
import * as noyau from 'pixelfx'
import { barre, ovale, rampeDeTeinte as T, tonsDeLaMatiere, type Forme, type Habit, type Matiere } from './rendu-vaisseau.ts'

const hex = (noyau as unknown as { hex(h: string): number }).hex
const R = (...l: string[]): number[] => l.map(hex)

export type Peau = {
  id: string
  nom: string
  /** La matière qui la dit le mieux : sa pastille en prend trois tons. */
  principale: Matiere
  rampes: Partial<Record<Matiere, number[]>>
  /** Les feux de position et les voyants de ce que le vaisseau pose (six tons, la matière `marque`). */
  accent: number[]
  habit: (cran: number) => Habit
}

const NU = (): Habit => ({ ailes: [], coque: [] })
const COTES = [-1, 1]
const plat = (pts: [number, number][], mat: Matiere, penche?: number): Forme => ({ pts, mat, relief: 'plat', penche })
const goutte = (x: number, y: number, r: number, mat: Matiere): Forme => ({ pts: ovale(x, y, r, r, 10), mat, relief: 'dome', dome: { x, y, rx: r, ry: r } })

// les rampes qui reviennent
const AMBRE = R('#2a1404', '#6a3608', '#c87214', '#ffb840', '#ffe49a', '#ffffff')
const ROUGE = R('#26080f', '#561220', '#93202e', '#d0443a', '#ff8456', '#ffcf9a')
const PLASMA = R('#2a0c5a', '#4a1a8c', '#8a3ce0', '#4a7cf0', '#7cc0ff', '#f0f8ff')
const BILE = R('#1a2a06', '#3a5a0c', '#6a9a14', '#a8d42a', '#e0f870', '#ffffe0')
const VENIN = R('#1a3006', '#2e5a08', '#4e8e10', '#7cc81c', '#b8f040', '#f0ffb0')
const ENERGIE = R('#0a2a6a', '#1a5ad0', '#40a0ff', '#80d8ff', '#c8f4ff', '#ffffff')
const RAYONNEMENT = R('#14040f', '#2e0a28', '#521046', '#80186e', '#b0228f', '#e070c8')

const origine = (principale: Matiere, accent: number[]): Peau => ({ id: 'origine', nom: 'Origine', principale, rampes: {}, accent, habit: NU })

const PEAUX: Record<string, Peau[]> = {
  // LE CHASSEUR : l'acier bleuté de série
  chasseur: [
    origine('coque', ROUGE),
    {
      // un fuselage presque noir, des ailes cramoisies, une verrière d'ambre ; deux bandes rouges sur le dos, un chevron au nez
      id: 'corsaire',
      nom: 'Corsaire',
      principale: 'aile',
      rampes: { coque: T(232, 0.14, 0.62), blinde: T(232, 0.1, 0.6, 0.02), aile: T(352, 0.62, 0.92, 0.02), acier: T(36, 0.35, 1), verre: AMBRE, decor: T(356, 0.78, 1.1), decor2: T(240, 0.12, 0.45) },
      accent: T(356, 0.78, 1.1),
      habit: () => ({
        ailes: COTES.map((s) => plat([[-4, s * 2.6], [-5, s * 2.6], [-6.9, s * 7.6], [-6, s * 7.85]], 'decor2', s)),
        coque: [...COTES.map((s) => plat(barre(-6.4, s * 1.25, 0.4, s * 0.95, 0.55), 'decor')), plat([[8.4, 0], [7, -0.95], [6.3, -0.95], [7.5, 0], [6.3, 0.95], [7, 0.95]], 'decor')],
      }),
    },
    {
      // un fuselage ivoire, des ailes orange, une verrière bleu nuit ; une bande orange de la poupe à la verrière, le bout des ailes marine
      id: 'aube',
      nom: 'Aube',
      principale: 'aile',
      rampes: { coque: T(38, 0.14, 1.22), blinde: T(38, 0.1, 1.12, 0.02), aile: T(22, 0.85, 1.02, 0.02), acier: T(218, 0.3, 0.75), verre: T(222, 0.8, 0.85), decor: T(22, 0.9, 1.08), decor2: T(222, 0.55, 0.6) },
      accent: T(22, 0.9, 1.08),
      habit: () => ({
        ailes: COTES.map((s) => plat([[-6.6, s * 7.3], [-8, s * 7.5], [-8, s * 8.7], [-7.1, s * 8.5]], 'decor2', s)),
        coque: [plat(barre(-6.9, 0, 0.7, 0, 0.9), 'decor'), plat(barre(6.3, 0, 8.3, 0, 0.55), 'decor')],
      }),
    },
  ],
  // LA SALAMANDRE : la suie, le cuivre, des réservoirs de laiton
  salamandre: [
    origine('suie', T(26, 0.9, 1.05)),
    {
      // une coque de cendre, des réservoirs rouges où sont peintes des flammes, des pylônes noirs
      id: 'cendre',
      nom: 'Cendre',
      principale: 'or',
      rampes: { suie: T(30, 0.05, 0.95), or: T(358, 0.72, 0.95), cuivre: T(240, 0.08, 0.55), decor: T(36, 0.95, 1.12) },
      accent: T(36, 0.95, 1.12),
      habit: () => ({
        ailes: COTES.map((sg) => plat([[2.6, sg * 7.6], [1, sg * 6.6], [-0.4, sg * 7], [-2.6, sg * 6.5], [-1.2, sg * 7.6], [-2.6, sg * 8.7], [-0.4, sg * 8.2], [1, sg * 8.6]], 'decor')),
        coque: [],
      }),
    },
    {
      // une peau vert sombre, des réservoirs de bronze cerclés, un œil rouge, des écailles d'or sur l'échine
      id: 'dragon',
      nom: 'Dragon',
      principale: 'suie',
      rampes: { suie: T(150, 0.35, 0.72), or: T(44, 0.55, 0.85), cuivre: T(355, 0.6, 0.8), ambre: R('#2a0604', '#6a1006', '#c8280a', '#ff6a20', '#ffc080', '#ffffff'), acier: T(150, 0.2, 0.9), decor: T(44, 0.85, 1.1), decor2: T(150, 0.4, 0.5) },
      accent: T(10, 0.9, 1.05),
      habit: () => ({
        ailes: COTES.flatMap((sg) => [0.6, -1.4].map((x) => plat([[x + 0.3, sg * 5.9], [x - 0.3, sg * 5.9], [x - 0.3, sg * 9.3], [x + 0.3, sg * 9.3]], 'decor2'))),
        coque: [-1.2, -3, -4.8, -6.6].map((x) => plat([[x + 0.9, 0], [x - 0.4, -0.9], [x - 0.1, 0], [x - 0.4, 0.9]], 'decor')),
      }),
    },
  ],
  // LA SENTINELLE : un disque de perle dans un anneau de sarcelle
  sentinelle: [
    origine('sarcelle', T(170, 0.6, 1.05)),
    {
      // un disque de bronze, un anneau orange, un dôme d'ambre ; trois rayons orange entre les berceaux
      id: 'ambre',
      nom: 'Ambre',
      principale: 'sarcelle',
      rampes: { perle: T(30, 0.35, 0.75), sarcelle: T(28, 0.85, 1.05), acier: T(30, 0.15, 0.6), verre: AMBRE, decor: T(28, 0.9, 1.1) },
      accent: T(28, 0.9, 1.1),
      habit: () => ({
        ailes: [],
        coque: [-Math.PI / 6, Math.PI / 2, (7 * Math.PI) / 6].map((b) => plat(barre(Math.cos(b) * 2.6, Math.sin(b) * 2.6, Math.cos(b) * 5, Math.sin(b) * 5, 0.8), 'decor')),
      }),
    },
    {
      // un disque blanc, un anneau d'or, un dôme violet ; un liseré d'or au bord du disque, trois voyants d'or
      id: 'royale',
      nom: 'Royale',
      principale: 'perle',
      rampes: { perle: T(220, 0.06, 1.22), sarcelle: T(44, 0.8, 1.05), acier: T(44, 0.35, 0.75), verre: T(275, 0.7, 1), decor: T(44, 0.85, 1.12) },
      accent: T(44, 0.85, 1.12),
      habit: () => {
        const coque: Forme[] = []
        for (let k = 0; k < 32; k++) {
          const a0 = (k / 32) * Math.PI * 2
          const a1 = ((k + 1.15) / 32) * Math.PI * 2
          coque.push(plat(barre(Math.cos(a0) * 6.3, Math.sin(a0) * 6.3, Math.cos(a1) * 6.3, Math.sin(a1) * 6.3, 0.45), 'decor'))
        }
        for (const b of [-Math.PI / 6, Math.PI / 2, (7 * Math.PI) / 6]) coque.push(goutte(Math.cos(b) * 3.9, Math.sin(b) * 3.9, 0.6, 'decor'))
        return { ailes: [], coque }
      },
    },
  ],
  // L'INGÉNIEUR : un caisson kaki, des caissons de graphite
  ingenieur: [
    // (… SON PONT TÔLÉ — Keko, 18/11 : « dommage qu'il n'y ait pas de texture sur la grosse plaque grise qu'il a sur le dos »
    // : la soute à tourelles, partie avec l'arme, la couvrait ; deux joints en long et deux en travers la découpent en
    // panneaux, un rivet à chaque croisement et aux coins, une grille d'aération à la poupe)
    {
      ...origine('kaki', T(46, 0.85, 1.08)),
      habit: () => ({
        ailes: [],
        coque: [
          ...[-1.05, 1.05].map((y) => plat([[2.4, y - 0.14], [-5.8, y - 0.14], [-5.8, y + 0.14], [2.4, y + 0.14]], 'graphite')),
          ...[-0.3, -3.1].map((x) => plat([[x + 0.14, -2.8], [x - 0.14, -2.8], [x - 0.14, 2.8], [x + 0.14, 2.8]], 'graphite')),
          ...[2.1, -0.3, -3.1, -5.5].flatMap((x) => [-2.5, -1.05, 1.05, 2.5].map((y) => plat([[x + 0.22, y - 0.22], [x - 0.22, y - 0.22], [x - 0.22, y + 0.22], [x + 0.22, y + 0.22]], 'acier'))),
          ...[-4.0, -4.5, -5.0].map((x) => plat([[x + 0.16, -0.7], [x - 0.16, -0.7], [x - 0.16, 0.7], [x + 0.16, 0.7]], 'graphite')),
        ],
      }),
    },
    {
      // un caisson jaune d'engin de chantier, des bandes de danger noires à la poupe, des voyants orange
      id: 'chantier',
      nom: 'Chantier',
      principale: 'kaki',
      rampes: { kaki: T(46, 0.85, 1.08), graphite: T(46, 0.08, 0.45), acier: T(40, 0.12, 0.7), verre: T(200, 0.5, 0.7), decor: T(240, 0.1, 0.35), decor2: T(30, 0.95, 1.1) },
      accent: T(30, 0.95, 1.1),
      habit: () => ({
        ailes: [],
        coque: [
          ...[-3.2, -1.6, 0, 1.6].map((y0) => plat([[-6.1, y0], [-6.1, y0 + 0.8], [-7.3, y0 + 1.6], [-7.3, y0 + 0.8]], 'decor')),
          ...[0.5, -2.3, -5.1].map((x) => plat([[x + 0.6, -0.6], [x - 0.6, -0.6], [x - 0.6, 0.6], [x + 0.6, 0.6]], 'decor2')),
        ],
      }),
    },
    {
      // un caisson blanc de secours, des caissons bleu acier, une bande rouge en travers, une verrière orange
      id: 'arctique',
      nom: 'Arctique',
      principale: 'graphite',
      rampes: { kaki: T(210, 0.08, 1.2), graphite: T(210, 0.35, 0.85), acier: T(210, 0.12, 0.75), verre: T(24, 0.9, 1.05), decor: T(358, 0.75, 1) },
      accent: T(358, 0.75, 1),
      habit: () => ({
        // (… EN RETRAIT DU BORD — Keko, 19/11 : « il a l'aile gauche qui porte un trait rouge, mais pas l'aile droite » :
        // posé au ras du bord, à droite, le liseré clair de la silhouette le recouvrait)
        ailes: COTES.map((sg) => plat([[4.4, sg * 6.2], [-6, sg * 6.2], [-6, sg * 6.9], [4.4, sg * 6.9]], 'decor', sg)),
        coque: [plat([[3.7, -4.4], [2.9, -4.4], [2.9, 4.4], [3.7, 4.4]], 'decor'), ...[0.5, -2.3, -5.1].map((x) => plat([[x + 0.6, -0.6], [x - 0.6, -0.6], [x - 0.6, 0.6], [x + 0.6, 0.6]], 'decor'))],
      }),
    },
  ],
  // LE FRIMAS : une carapace blanche, des croissants d'ardoise, la glace — son origine est l'ancien Blizzard (Keko, 19/11 :
  // « passer le skin numéro 3 en skin de base et créer un nouveau skin pour remplacer le numéro 3 »)
  frimas: [
    {
      // (une carapace blanche, des croissants d'ardoise — ses couleurs de série, voir `RAMPES` —, une glace presque
      // blanche ; du givre semé sur le dos)
      id: 'origine',
      nom: 'Origine',
      principale: 'nacre',
      rampes: { glace: R('#0a2a40', '#14507a', '#2a90c8', '#6ad0f4', '#c8f4ff', '#ffffff'), decor: T(195, 0.6, 1.18) },
      accent: T(195, 0.6, 1.18),
      habit: () => ({
        ailes: COTES.map((sg) => goutte(6.93, sg * 3.47, 0.85, 'decor')),
        coque: ([[2.6, -2], [2.2, 2.1], [-1.4, -2.7], [-0.9, 2.7], [5, -1.2], [-3.2, 0.2]] as [number, number][]).map(([x, y]) => goutte(x, y, 0.32, 'decor')),
      }),
    },
    {
      // une carapace vert d'eau, des croissants magenta, une glace d'aurore verte ; deux traînées d'aurore sur le dos, le bout des cornes rose
      id: 'aurore',
      nom: 'Aurore',
      principale: 'indigo',
      rampes: { nacre: T(165, 0.3, 1.05), indigo: T(300, 0.55, 0.85), glace: R('#04261a', '#0a5a3a', '#18a868', '#40e898', '#b0ffd8', '#ffffff'), decor: T(320, 0.75, 1.1) },
      accent: T(320, 0.75, 1.1),
      habit: () => ({
        ailes: COTES.map((sg) => goutte(6.93, sg * 3.47, 0.85, 'decor')),
        coque: COTES.map((s) => plat(barre(4.4, s * 1.1, -1.6, s * 2.5, 0.35), 'decor')),
      }),
    },
    {
      // UN GLACIER (Keko, 19/11 : le nouveau troisième) : une carapace bleu d'iceberg, des croissants de neige, une glace
      // turquoise ; une arête de neige du nez au dos, des glaçons au bout des croissants
      id: 'glacier',
      nom: 'Glacier',
      principale: 'nacre',
      rampes: { nacre: T(198, 0.62, 1.0), indigo: T(205, 0.1, 1.28), glace: R('#062a3a', '#0a5a78', '#1aa0c8', '#5ad8f4', '#c0f8ff', '#ffffff'), decor: T(200, 0.08, 1.32) },
      accent: T(185, 0.7, 1.2),
      habit: () => ({
        ailes: COTES.map((sg) => goutte(6.93, sg * 3.47, 0.85, 'decor')),
        coque: [plat(barre(4.6, 0, -3.8, 0, 0.32), 'decor'), ...COTES.map((s) => goutte(-1.2, s * 2.5, 0.42, 'decor'))],
      }),
    },
  ],
  // LE PULSAR : l'obsidienne, des nageoires mauves, le plasma
  pulsar: [
    origine('mauve', PLASMA),
    {
      // une carapace bleu nuit, des nageoires d'or, un plasma de soleil ; un trait d'or du cœur aux cornes, le bout des nageoires en étoile
      id: 'nova',
      nom: 'Nova',
      principale: 'mauve',
      rampes: { obsidienne: T(228, 0.45, 0.62), mauve: T(32, 0.85, 1), plasma: R('#3a0a04', '#8a2a06', '#e06a10', '#ffb030', '#ffe890', '#ffffff'), decor: T(44, 0.9, 1.12) },
      accent: T(44, 0.9, 1.12),
      // (… SUR LE SCEAU — Keko, 19/11 : ses nageoires sont parties ; l'or au bout des quatre grandes pointes de son étoile)
      habit: () => ({
        ailes: [],
        coque: [plat(barre(1.4, 0, 4.4, 0, 0.4), 'decor'), ...[0, 1, 2, 3].map((k) => goutte(Math.cos((k * Math.PI) / 2) * 6.1, Math.sin((k * Math.PI) / 2) * 6.1, 0.45, 'decor'))],
      }),
    },
    {
      // une carapace sarcelle sombre, des nageoires cyan semées d'étoiles roses, un plasma magenta
      id: 'nebuleuse',
      nom: 'Nébuleuse',
      principale: 'mauve',
      rampes: { obsidienne: T(190, 0.4, 0.58), mauve: T(185, 0.7, 0.95), plasma: R('#2a0630', '#6a1060', '#c02a9a', '#ff5ac8', '#ffb0ec', '#ffffff'), decor: T(320, 0.6, 1.15) },
      accent: T(320, 0.6, 1.15),
      habit: () => ({
        // (… SUR LE SCEAU — Keko, 19/11 : des étoiles roses semées entre les branches)
        ailes: [],
        coque: [0, 1, 2, 3, 4, 5, 6, 7].map((k) => goutte(Math.cos(Math.PI / 8 + (k * Math.PI) / 4) * 4.6, Math.sin(Math.PI / 8 + (k * Math.PI) / 4) * 4.6, 0.28, 'decor')),
      }),
    },
  ],
  // LE KRAKEN : la chitine, la chair, la bile
  kraken: [
    origine('chitine', BILE),
    {
      // une bête des grands fonds : une chitine bleu nuit, une chair sarcelle, des yeux et des taches qui luisent cyan
      id: 'abysses',
      nom: 'Abysses',
      principale: 'chitine',
      rampes: { chitine: T(222, 0.4, 0.58), chair: T(178, 0.5, 0.85), os: T(200, 0.15, 1.15), bile: R('#04202a', '#0a4a5a', '#109aaa', '#3ae0e8', '#a0fff8', '#ffffff'), decor: R('#04202a', '#0a4a5a', '#109aaa', '#3ae0e8', '#a0fff8', '#ffffff') },
      accent: R('#04202a', '#0a4a5a', '#109aaa', '#3ae0e8', '#a0fff8', '#ffffff'),
      habit: () => ({
        // (plus de glandes sur les nageoires : elles sont devenues des tentacules — Keko, 19/11)
        ailes: [],
        coque: COTES.flatMap((s) => ([[4.2, 3.4], [0.8, 4.1], [-2.6, 4], [-6.4, 2.9]] as [number, number][]).map(([x, y]) => goutte(x, s * y, 0.32, 'decor'))),
      }),
    },
    {
      // une bête de récif : une chitine corail, une chair orangée, des yeux violets, des épines blanches sur le bord du manteau
      id: 'corail',
      nom: 'Corail',
      principale: 'chitine',
      rampes: { chitine: T(12, 0.6, 0.95), chair: T(38, 0.75, 1.05), os: T(40, 0.1, 1.2), bile: R('#1a0a30', '#3a1a6a', '#6a30b0', '#a060e8', '#d8b0ff', '#ffffff'), decor: T(275, 0.6, 1.05) },
      accent: T(275, 0.6, 1.05),
      habit: () => ({
        ailes: [],
        coque: COTES.flatMap((s) => ([[3.6, 4.4], [0.2, 4.7], [-3.2, 4.4]] as [number, number][]).map(([x, y]) => plat([[x + 0.5, s * (y - 0.3)], [x, s * (y + 1)], [x - 0.5, s * (y - 0.3)]], 'os'))),
      }),
    },
  ],
  // LA VOUIVRE : des écailles vert sombre, la lie, le venin
  vouivre: [
    origine('ecaille', VENIN),
    {
      // une charogne : des écailles rouille, une lie rouge sang, un venin orange ; deux cicatrices pâles
      id: 'charogne',
      nom: 'Charogne',
      principale: 'ecaille',
      rampes: { ecaille: T(22, 0.45, 0.8), lie: T(350, 0.55, 0.7), venin: R('#3a1004', '#7a2a06', '#c05a0a', '#f09a1a', '#ffd060', '#fff4c0'), os: T(48, 0.35, 0.95), decor: R('#3a1004', '#7a2a06', '#c05a0a', '#f09a1a', '#ffd060', '#fff4c0') },
      accent: R('#3a1004', '#7a2a06', '#c05a0a', '#f09a1a', '#ffd060', '#fff4c0'),
      habit: () => ({
        ailes: ([[-1, -6.9], [-1, 6.9]] as [number, number][]).map(([x, y]) => goutte(x, y, 0.6, 'decor')),
        coque: [plat(barre(1, -3.6, -1.6, -2.2, 0.35), 'os'), plat(barre(-4, 3, -6.2, 1.6, 0.35), 'os')],
      }),
    },
    {
      // un spectre : des écailles gris-violet pâle, une lie presque noire, un venin bleu électrique
      id: 'spectre',
      nom: 'Spectre',
      principale: 'ecaille',
      rampes: { ecaille: T(265, 0.15, 1), lie: T(280, 0.35, 0.55), venin: R('#041a3a', '#0a3a7a', '#1470c8', '#3ab0ff', '#a0e4ff', '#ffffff'), os: T(260, 0.08, 1.15), decor: R('#041a3a', '#0a3a7a', '#1470c8', '#3ab0ff', '#a0e4ff', '#ffffff') },
      accent: R('#041a3a', '#0a3a7a', '#1470c8', '#3ab0ff', '#a0e4ff', '#ffffff'),
      habit: () => ({ ailes: ([[-1, -6.9], [-1, 6.9]] as [number, number][]).map(([x, y]) => goutte(x, y, 0.6, 'decor')), coque: [] }),
    },
  ],
  // LE PRISME : le quartz, les facettes, l'énergie
  prisme: [
    // (sa marque : l'or blanc de sa lumière — Keko, 18/11)
    origine('quartz', R('#5a3a08', '#b08020', '#ffd050', '#ffeaa0', '#fffae0', '#ffffff')),
    {
      // un cristal de rubis : des facettes rouge sombre, un quartz rose, une énergie rouge ; des éclats sur les flancs
      id: 'rubis',
      nom: 'Rubis',
      principale: 'facette',
      rampes: { facette: T(350, 0.6, 0.72), quartz: T(345, 0.55, 1.15), energie: R('#3a0a10', '#a01a20', '#ff4a3a', '#ff9a70', '#ffd8c0', '#ffffff'), decor: R('#3a0a10', '#a01a20', '#ff4a3a', '#ff9a70', '#ffd8c0', '#ffffff') },
      accent: R('#3a0a10', '#a01a20', '#ff4a3a', '#ff9a70', '#ffd8c0', '#ffffff'),
      // (plus de pointes d'ailes ni d'éclats de flanc — Keko, 17/11 : le Prisme n'a plus ni ailes ni corps ; ce sont ses
      // éclats en orbite et leurs fils qui prennent la couleur)
      habit: NU,
    },
    {
      // un cristal d'émeraude : des facettes vert profond, un quartz vert pâle, une énergie verte
      id: 'emeraude',
      nom: 'Émeraude',
      principale: 'facette',
      rampes: { facette: T(150, 0.55, 0.68), quartz: T(140, 0.4, 1.15), energie: R('#06301a', '#0a6a3a', '#20c070', '#60f0a8', '#c0ffe0', '#ffffff'), decor: R('#06301a', '#0a6a3a', '#20c070', '#60f0a8', '#c0ffe0', '#ffffff') },
      accent: R('#06301a', '#0a6a3a', '#20c070', '#60f0a8', '#c0ffe0', '#ffffff'),
      habit: NU,
    },
  ],
  // LE VER (à la place de la Mante — Keko, 17/11) : une chair de sable, des anneaux bruns, une bouche qui luit de bile ;
  // ses apparences posent leur motif sur chacun de ses anneaux, qui ondule avec lui (`Habit.motif`)
  mante: [
    origine('ver', BILE),
    {
      // le ver des abysses : une chair indigo presque noire, des anneaux d'encre, des lueurs cyan qui battent sur ses flancs
      id: 'abysses',
      nom: 'Abysses',
      principale: 'ver',
      // (ses parasites et ses œufs à son image — Keko, 19/11 : un cerveau violet sous une membrane d'énergie, des œufs bleu pâle)
      rampes: { ver: T(250, 0.4, 0.55), anneau: T(250, 0.3, 0.32), chair: T(200, 0.4, 0.7), bile: ENERGIE, decor: ENERGIE, cerveau: T(285, 0.45, 0.95), voile: ENERGIE, oeuf: T(205, 0.35, 1.15) },
      accent: ENERGIE,
      habit: () => ({ ailes: [], coque: [], motif: 'lueurs' }),
    },
    {
      // le ver de braise : une chair rouge sang, des anneaux noirs, des taches d'ambre, une bouche de feu
      id: 'braise',
      nom: 'Braise',
      principale: 'ver',
      // (ses parasites et ses œufs à son image : un cerveau rouge feu sous une membrane d'ambre, des œufs ambrés)
      rampes: { ver: T(6, 0.62, 0.85), anneau: T(0, 0.2, 0.28), chair: T(14, 0.6, 0.9), bile: AMBRE, decor: AMBRE, cerveau: T(14, 0.65, 1), voile: AMBRE, oeuf: T(35, 0.45, 1.15) },
      accent: AMBRE,
      habit: () => ({ ailes: [], coque: [], motif: 'taches' }),
    },
  ],
  // LE TESSERACT : une lumière vert d'eau, un cœur de lumière (il a remplacé l'œil — Keko, 18/11 : « le vaisseau de lumière »)
  tesseract: [
    origine('spectre', R('#03140f', '#063028', '#0c5a48', '#18a080', '#50e8c0', '#c8fff0')),
    {
      // écarlate : des arêtes rouge sang, un cœur de braise, et deux petites lumières à côté de lui (c'étaient deux yeux)
      id: 'ecarlate',
      nom: 'Écarlate',
      principale: 'spectre',
      rampes: { spectre: R('#140304', '#300608', '#5a0c10', '#a01820', '#e85050', '#ffd0c8'), lumiere: R('#300608', '#7a1810', '#d04a2a', '#ff9a6a', '#ffe0c8', '#ffffff') },
      accent: R('#140304', '#300608', '#5a0c10', '#a01820', '#e85050', '#ffd0c8'),
      habit: () => ({
        ailes: [],
        coque: COTES.flatMap((s): Forme[] => [
          { pts: ovale(-1.4, s * 2.9, 0.75, 0.75, 10), mat: 'lumiere', relief: 'lueur', ton: 3 },
          { pts: ovale(-1.4, s * 2.9, 0.4, 0.4, 8), mat: 'lumiere', relief: 'lueur', ton: 5 },
        ]),
      }),
    },
    {
      // le vide : des arêtes violet pâle, un cœur de lumière blanche, bleutée, un anneau de lumière autour de lui
      id: 'vide',
      nom: 'Vide',
      principale: 'spectre',
      rampes: { spectre: R('#0c0618', '#1c0e36', '#36205e', '#6448a0', '#a890e0', '#f0e8ff'), lumiere: R('#2a3040', '#5a6478', '#9aa8bc', '#d8e2ee', '#f4f8ff', '#ffffff'), decor: R('#0c0618', '#1c0e36', '#36205e', '#6448a0', '#a890e0', '#f0e8ff') },
      accent: R('#0c0618', '#1c0e36', '#36205e', '#6448a0', '#a890e0', '#f0e8ff'),
      habit: () => {
        const coque: Forme[] = []
        for (let k = 0; k < 16; k++) {
          if (k % 2 === 1) continue
          const a0 = (k / 16) * Math.PI * 2
          const a1 = ((k + 1) / 16) * Math.PI * 2
          coque.push({ pts: barre(Math.cos(a0) * 3.8, Math.sin(a0) * 3.2, Math.cos(a1) * 3.8, Math.sin(a1) * 3.2, 0.5), mat: 'decor', relief: 'lueur', ton: 4 })
        }
        return { ailes: [], coque }
      },
    },
  ],
  // LE NÉANT : un cœur magenta, des anneaux de rayonnement
  neant: [
    origine('rayonnement', RAYONNEMENT),
    {
      // un trou noir qui avale une étoile : un disque d'accrétion orange, des anneaux de braise, deux bandes d'or sur l'éperon
      id: 'supernova',
      nom: 'Supernova',
      principale: 'rayonnement',
      rampes: { rayonnement: R('#1a0a04', '#3a1606', '#6a2a0a', '#a04a10', '#e0801c', '#ffc060'), neant: R('#1a0804', '#3d1406', '#70300a', '#b05a12', '#f09a2a', '#ffd070'), obsidienne: T(20, 0.3, 0.6), decor: T(40, 0.9, 1.1) },
      accent: T(40, 0.9, 1.1),
      habit: () => ({
        ailes: [],
        coque: [plat([[6.4, -1.65], [6.9, -1.48], [6.9, 1.48], [6.4, 1.65]], 'decor'), plat([[7.5, -1.27], [8, -1.1], [8, 1.1], [7.5, 1.27]], 'decor')],
      }),
    },
    {
      // un abîme froid : un disque bleu, des anneaux d'outremer, une arête cyan le long de l'éperon
      id: 'abime',
      nom: 'Abîme',
      principale: 'rayonnement',
      rampes: { rayonnement: R('#040a1a', '#0a1a3a', '#10306a', '#1a50a0', '#3a8ae0', '#90d0ff'), neant: R('#040a1a', '#0a1a3d', '#10306a', '#1a50b0', '#3a90f5', '#86d0ff'), obsidienne: T(225, 0.3, 0.55), decor: T(205, 0.8, 1.1) },
      accent: T(205, 0.8, 1.1),
      habit: () => ({ ailes: [], coque: [plat(barre(5.4, 0, 8.6, 0, 0.35), 'decor')] }),
    },
  ],
}

/** Les trois apparences d'un modèle de vaisseau (un modèle sans les siennes n'a que son origine). */
export function peauxDe(modele: string): Peau[] {
  return PEAUX[modele] ?? [origine('coque', ROUGE)]
}
/** Une apparence d'un modèle par son identifiant (l'origine si elle n'existe pas). */
export function peauDe(modele: string, id: string): Peau {
  const l = peauxDe(modele)
  return l.find((p) => p.id === id) ?? l[0]
}
/** Trois tons d'une apparence (sombre, moyen, clair), pour sa pastille. */
export function tonsDeLaPeau(p: Peau): [number, number, number] {
  const r = p.rampes[p.principale]
  return r === undefined ? tonsDeLaMatiere(p.principale) : [r[2], r[3], r[4]]
}
/** Les rampes à donner au peintre : celles de l'apparence, et l'accent pour la marque de ce que le vaisseau pose. */
export function rampesDeLaPeau(p: Peau): Partial<Record<Matiere, number[]>> {
  return { ...p.rampes, marque: p.accent }
}

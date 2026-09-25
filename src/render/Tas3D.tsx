/**
 * LA PIOCHE ET LA DÉFAUSSE, en symbole.
 *
 * Le jeu 2D en faisait de vraies piles de dos de carte, enfouies sous le bord
 * comme la main — « un tas doit être fait des mêmes cartes que la main, sinon
 * c'est l'icône d'un tas et pas un tas ». **Ici c'est l'inverse, et c'est
 * voulu** : Keko a demandé un symbole dessiné, un paquet vu en 3/4 avec un
 * coin tourné vers le bas. La scène 3D a déjà ses cartes en volume ; ces
 * deux-là ne se manipulent pas, elles se consultent — *ce qu'on ne touche
 * jamais n'a pas besoin d'être un objet.*
 *
 * **Le chiffre est AU-DESSUS, et il est discret.** Il a été un gros nombre
 * d'or serti sur le dos dans le jeu 2D : il avait le poids d'une valeur de jeu
 * alors qu'on ne décide pas dessus. Keko : « plus discret, c'est pas une info
 * capitale ». Au-dessus et non sur le paquet, donc rien ne recouvre le dessin.
 *
 * **IL A ÉTÉ REMPLACÉ PAR DES IMAGES, PUIS REPRIS.** `Deck.png`, puis
 * `Pioche.png` et `Défausse.png`, ont tenu ce rôle quelques commits ; Keko est
 * revenu à celui-ci. Les fichiers restent dans `public/` et `urlDuTas` les sert
 * toujours — rien ne les appelle, il suffira d'une ligne pour les reposer.
 *
 * *Ce que l'aller-retour a laissé*, et qui vaut mieux que le dessin lui-même :
 * un PNG porte ses bords transparents là où un viewBox colle au tracé, donc il
 * faut l'agrandir — et ce facteur, écrit à la main, **a été faux à chaque mise
 * à jour de l'image**, sans que rien ne le signale puisqu'elle s'affiche quand
 * même. `silhouette.ts` sait désormais le calculer. Ici la question ne se pose
 * plus : *un dessin en code n'a pas de marge à deviner.*
 */

/**
 * LE PAQUET EST FAIT DE CARTES RECTANGULAIRES, ET SON COIN POINTE DROIT EN BAS.
 *
 * Deux corrections successives de Keko, et la seconde vient de la première.
 *
 * 1. Le losange a d'abord été dessiné à la main, symétrique : c'était un CARRÉ
 *    vu de trois quarts — « les paquets dessinent des cartes carrées, il
 *    faudrait rectangulaire ». *Un losange symétrique ne peut pas être autre
 *    chose qu'un carré* ; le rapport de la carte ne se devine pas à l'oeil, il
 *    se projette.
 * 2. Le rectangle a ensuite été pivoté d'un quart de tour, et son coin bas
 *    tombait alors à DROITE du centre. Sur le tas de gauche ça ne se voyait
 *    pas ; collé au bord droit, le même penchant faisait paraître la défausse
 *    de travers — Keko : « je voudrais que l'image du paquet de défausse soit
 *    identique à celui de la pioche, il est bizarre là ». Les deux dessins
 *    étaient pourtant rigoureusement identiques, vérifié dans le DOM : *ce qui
 *    changeait, c'était le bord d'écran contre lequel la forme penchait.*
 *
 * D'où l'angle : le SEUL pour lequel la diagonale du rectangle tombe à la
 * verticale, donc le seul qui mette un coin **droit en bas**. C'est aussi ce
 * que Keko demandait au départ — « comme si un coin du paquet était orienté
 * vers le bas ».
 *
 * **Un rectangle ne peut pas être symétrique en plus de ça**, et c'est ce qui
 * le distingue d'un carré : ses deux coins de CÔTÉ restent à des hauteurs
 * différentes. Le carré les aurait alignés.
 */
const RAPPORT = 1.4
/** Ce qui reste de la profondeur une fois le paquet vu d'en haut. */
const ECRASEMENT = 0.62
const RAYON = 46
const CENTRE: [number, number] = [50, 44]
const EPAISSEUR = 16

const ANGLE = Math.atan2(-1, RAPPORT)
const COS = Math.cos(ANGLE)
const SIN = Math.sin(ANGLE)

/** Un coin du rectangle, pivoté puis écrasé par la vue de trois quarts. */
function coin(sx: number, sy: number): [number, number] {
  const x = (sx * 1) / 2
  const y = (sy * RAPPORT) / 2
  const rx = x * COS - y * SIN
  const ry = x * SIN + y * COS
  // Normalisé sur la demi-diagonale, pour que le dessin garde sa taille quel
  // que soit le rapport de la carte.
  const demiDiagonale = Math.hypot(1, RAPPORT) / 2
  return [
    CENTRE[0] + (RAYON * rx) / demiDiagonale,
    CENTRE[1] - (RAYON * ECRASEMENT * ry) / demiDiagonale,
  ]
}

const LOIN = coin(-1, 1)
const GAUCHE = coin(-1, -1)
const NEAR = coin(1, -1)
const DROITE = coin(1, 1)

function pt([x, y]: [number, number], e = 0): string {
  return `${x.toFixed(2)},${(y + e).toFixed(2)}`
}

const DESSUS = [LOIN, GAUCHE, NEAR, DROITE].map((c) => pt(c)).join(' ')
const FLANC_GAUCHE = `${pt(GAUCHE)} ${pt(NEAR)} ${pt(NEAR, EPAISSEUR)} ${pt(GAUCHE, EPAISSEUR)}`
const FLANC_DROIT = `${pt(NEAR)} ${pt(DROITE)} ${pt(DROITE, EPAISSEUR)} ${pt(NEAR, EPAISSEUR)}`

/** Le losange du dessus, rentré vers son centre : le jonc intérieur. */
function jonc(part: number): string {
  return [LOIN, GAUCHE, NEAR, DROITE]
    .map(([x, y]) =>
      pt([CENTRE[0] + (x - CENTRE[0]) * part, CENTRE[1] + (y - CENTRE[1]) * part]),
    )
    .join(' ')
}

/**
 * LE CADRE COLLE AU DESSIN, épaisseur comprise. Un viewBox carré laissait un
 * tiers de vide et le paquet paraissait deux fois trop petit pour sa place.
 */
const BORDS = [LOIN, GAUCHE, NEAR, DROITE]
const MARGE = 3
const X0 = Math.min(...BORDS.map((c) => c[0])) - MARGE
const Y0 = Math.min(...BORDS.map((c) => c[1])) - MARGE
const CADRE = [
  X0,
  Y0,
  Math.max(...BORDS.map((c) => c[0])) + MARGE - X0,
  Math.max(...BORDS.map((c) => c[1])) + EPAISSEUR + MARGE - Y0,
]
  .map((v) => v.toFixed(2))
  .join(' ')

type Props = {
  /** Sert aussi d'identifiant de dégradé : deux SVG qui partagent un `id` font
   *  que le second emprunte la couleur du premier. */
  nom: 'pioche' | 'defausse'
  compte: number
}

export function Tas3D({ nom, compte }: Props): React.JSX.Element {
  const id = `tas-${nom}`
  return (
    <div className={`tas-3d ${nom}`}>
      <span className="tas-compte">{compte}</span>
      <svg viewBox={CADRE} className="tas-dessin" aria-hidden="true">
        <defs>
          <linearGradient id={`${id}-dessus`} x1="0" y1="0" x2="0.6" y2="1">
            <stop offset="0" stopColor="#3b3f4c" />
            <stop offset="1" stopColor="#1b1e27" />
          </linearGradient>
        </defs>

        {/* LES DEUX FLANCS D'ABORD : le dessus se pose dessus et masque leur
            arête haute, ce qui évite un liseré en travers du paquet. La
            lumière vient du haut et de la droite, comme partout dans le jeu. */}
        <polygon points={FLANC_GAUCHE} fill="#15171e" />
        <polygon points={FLANC_DROIT} fill="#23262f" />

        {/* LES FEUILLETS : ce sont des cartes empilées, pas un bloc. */}
        {[0.3, 0.55, 0.8].map((f) => (
          <polyline
            key={f}
            points={`${pt(GAUCHE, EPAISSEUR * f)} ${pt(NEAR, EPAISSEUR * f)} ${pt(DROITE, EPAISSEUR * f)}`}
            fill="none"
            stroke="#0c0d12"
            strokeWidth="1.1"
          />
        ))}

        <polygon
          points={DESSUS}
          fill={`url(#${id}-dessus)`}
          stroke="#c9a95a"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <polygon points={jonc(0.62)} fill="none" stroke="#c9a95a" strokeWidth="1.2" opacity="0.5" />
        <polygon points={jonc(0.24)} fill="#c9a95a" opacity="0.22" />
      </svg>
    </div>
  )
}

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

/**
 * LA MÊME PROJECTION, EN MATRICE — pour y poser le dos de carte.
 *
 * `coin()` fait une rotation puis un écrasement vertical : deux opérations
 * LINÉAIRES, donc l'ensemble est affine, donc exprimable en `matrix()`. *C'est
 * ce qui permet de plaquer une image sur le dessus du paquet* — SVG ne sait pas
 * faire de projection perspective, et il n'en a pas besoin ici.
 *
 * Le repère source est celui d'une carte : 1 de large, `RAPPORT` de haut,
 * centrée sur zéro. Une image posée de (−0,5 ; −0,7) à (0,5 ; 0,7) tombe donc
 * exactement sur les quatre coins calculés ci-dessous.
 */
const DEMI_DIAGONALE = Math.hypot(1, RAPPORT) / 2
const K = RAYON / DEMI_DIAGONALE

/**
 * LE REPÈRE LOCAL DE L'IMAGE, ET IL NE PEUT PAS ÊTRE PETIT.
 *
 * Posée à sa taille naturelle dans ce repère — 1 sur 1,4 — l'image est
 * **rastérisée à un pixel** avant que la matrice ne l'agrandisse : le dessus du
 * paquet devenait une tache unie de la couleur moyenne du dos. *Un navigateur
 * rasterise une image à sa taille LOCALE, pas à celle qu'elle aura après
 * transformation.*
 *
 * On la pose donc à 100 de large et on divise la matrice d'autant : la
 * transformation finale est exactement la même, mais elle part d'une image
 * dessinée à sa vraie résolution.
 */
const ECHELLE = 100

const MATRICE = [
  (K * COS) / ECHELLE,
  (-K * ECRASEMENT * SIN) / ECHELLE,
  (-K * SIN) / ECHELLE,
  (-K * ECRASEMENT * COS) / ECHELLE,
  CENTRE[0],
  CENTRE[1],
]
  .map((v) => v.toFixed(6))
  .join(' ')

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

/**
 * COMBIEN DE CARTES ON VOIT DANS LA TRANCHE.
 *
 * Il y en avait TROIS, et Keko : « les séparations entre les cartes ne sont pas
 * assez nombreuses, on dirait que les cartes sont super épaisses ». C'est
 * exactement ça : *le nombre de traits ne décore pas l'épaisseur, il la DIVISE*
 * — trois traits sur une tranche donnent quatre cartes de 4 unités chacune, et
 * une carte de 4 unités d'épaisseur n'est pas une carte, c'est une planche.
 *
 * À douze, chaque feuillet fait un peu plus d'une unité : l'épaisseur totale ne
 * change pas, mais elle se lit enfin comme un paquet.
 */
const FEUILLETS = 12

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

import { useEffect, useState } from 'react'
import { urlDuDosPeint } from './texture-carte.ts'

type Props = {
  /** Sert aussi d'identifiant de dégradé : deux SVG qui partagent un `id` font
   *  que le second emprunte la couleur du premier. */
  nom: 'pioche' | 'defausse'
  compte: number
  /** Vrai le temps qu'on reverse la défausse dedans : le tas tremble. */
  brasse?: boolean
}

export function Tas3D({ nom, compte, brasse = false }: Props): React.JSX.Element {
  const id = `tas-${nom}`

  /**
   * LE DESSUS DU PAQUET EST LE DOS DE CARTE, demandé par Keko.
   *
   * *C'est la même carte* — la règle du dépôt, déjà payée sur les trésors
   * (« la carte change quand je la ramasse ») : même matière, même cadre, même
   * semis que ce que montrera une carte retournée.
   *
   * **Seul le coeur du médaillon diffère**, et il porte le symbole du tas :
   * Keko veut « un symbole qui permette au joueur d'identifier rapidement la
   * pile pioche / défausse ». C'est le seul endroit où le paquet cesse d'être
   * fidèle, et c'est assumé — *une information de jeu prime sur la cohérence
   * décorative.*
   *
   * Il arrive en différé, parce qu'il charge le fond commun des cartes. Le
   * losange peint reste dessous comme repli : *un dessus qui manquerait
   * laisserait voir le décor à travers le paquet.*
   */
  const [dos, setDos] = useState<string | null>(null)
  useEffect(() => {
    let vivant = true
    void urlDuDosPeint(nom === 'pioche' ? 'pioche' : 'defausse').then((url) => {
      if (vivant && url !== '') setDos(url)
    })
    return () => {
      vivant = false
    }
  }, [nom])

  return (
    <div className={`tas-3d ${nom}${brasse ? ' brasse' : ''}`}>
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
            lumière vient du haut et de la droite, comme partout dans le jeu —
            d'où le flanc droit plus clair que le gauche.

            LA TRANCHE EST EN LAITON PÂLE, PAS EN ARDOISE. Keko : « c'est
            dommage que les tranches des cartes soient foncées, un peu utiliser
            un doré très pâle plutôt, car là on voit pas bien ». Elles étaient
            presque noires, donc l'épaisseur — la seule chose qui distingue un
            paquet d'une carte posée à plat — se perdait dans l'ombre portée.
            *Ce qui dit le volume doit être ce qui se voit le mieux.* */}
        <polygon points={FLANC_GAUCHE} fill="#d8bd7f" />
        <polygon points={FLANC_DROIT} fill="#f2ddaa" />

        {/* LES FEUILLETS : ce sont des cartes empilées, pas un bloc. Sur une
            tranche noire ils ne disaient rien ; sur du laiton, chaque trait est
            une carte — *c'est la tranche claire qui les rend lisibles.* */}
        {Array.from({ length: FEUILLETS - 1 }, (_, i) => (i + 1) / FEUILLETS).map((f) => (
          <polyline
            key={f}
            points={`${pt(GAUCHE, EPAISSEUR * f)} ${pt(NEAR, EPAISSEUR * f)} ${pt(DROITE, EPAISSEUR * f)}`}
            fill="none"
            stroke="#8a6a2c"
            strokeOpacity="0.5"
            // Plus fin qu'avant : à trois traits on pouvait les appuyer, à
            // douze un trait épais mangerait la carte qu'il sépare.
            strokeWidth="0.55"
          />
        ))}

        {/* LE LISERÉ NE DÉBORDE PLUS DU PAQUET. Un `stroke` SVG est CENTRÉ sur
            le tracé, donc la moitié de sa largeur sort du polygone : le dessus
            débordait des flancs de 1 unité tout autour. Invisible tant que la
            tranche était noire, voyant dès qu'elle est devenue claire — Keko :
            « le rectangle doré qui entoure la carte du dessus est plus grand
            que le reste du paquet ».

            SVG ne sait pas aligner un trait à l'intérieur (`stroke-alignment`
            n'existe nulle part) : on le rogne donc avec un `clipPath` de la
            MÊME forme, ce qui ne laisse que la moitié intérieure. D'où la
            largeur doublée — on en perd la moitié. */}
        <clipPath id={`${id}-dessus-coupe`}>
          <polygon points={DESSUS} />
        </clipPath>
        <polygon
          points={DESSUS}
          fill={`url(#${id}-dessus)`}
          stroke="#c9a95a"
          strokeWidth="4"
          strokeLinejoin="round"
          clipPath={`url(#${id}-dessus-coupe)`}
        />

        {/* LE DOS, PLAQUÉ PAR LA MATRICE. Il porte déjà son cadre de laiton,
            donc il remplace les deux joncs que le losange peint avait — *deux
            cadres l'un sur l'autre ne font pas un cadre plus riche.* Rogné par
            la même forme, pour que ses coins arrondis ne laissent pas voir le
            décor au travers. */}
        {dos !== null ? (
          // LE ROGNAGE VIT SUR UN GROUPE, PAS SUR L'IMAGE. Un `clip-path` est
          // défini dans le repère de l'élément qui le porte : posé sur l'image,
          // il subissait la matrice avec elle et ne tombait plus sur le
          // losange. Sur un groupe sans transformation, il reste dans le repère
          // du viewBox, là où le polygone a été calculé.
          <g clipPath={`url(#${id}-dessus-coupe)`}>
            <image
              href={dos}
              x={-ECHELLE / 2}
              y={(-ECHELLE * RAPPORT) / 2}
              width={ECHELLE}
              height={ECHELLE * RAPPORT}
              preserveAspectRatio="none"
              transform={`matrix(${MATRICE})`}
            />
          </g>
        ) : (
          <>
            <polygon
              points={jonc(0.62)}
              fill="none"
              stroke="#c9a95a"
              strokeWidth="1.2"
              opacity="0.5"
            />
            <polygon points={jonc(0.24)} fill="#c9a95a" opacity="0.22" />
          </>
        )}
      </svg>
    </div>
  )
}

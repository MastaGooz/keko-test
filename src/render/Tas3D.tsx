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
 */

/**
 * LE PAQUET VU EN 3/4, UN COIN VERS LE BAS.
 *
 * La face du dessus est un losange — un carré vu de trois quarts depuis le
 * haut — et l'épaisseur pend sous ses deux arêtes basses. C'est ce qui fait le
 * relief : sans les deux flancs, le losange se lirait comme une carte à plat
 * et non comme une pile.
 *
 * La lumière vient du haut et de la droite, comme partout dans le jeu : le
 * dessus est le plus clair, le flanc droit le suit, le flanc gauche reste
 * sombre. Trois traits en travers de l'épaisseur disent que ce sont des
 * cartes empilées et non un bloc.
 */
const NEAR: [number, number] = [50, 66]
const GAUCHE: [number, number] = [10, 44]
const LOIN: [number, number] = [50, 22]
const DROITE: [number, number] = [90, 44]
const EPAISSEUR = 16

/** Un point descendu de l'épaisseur du paquet. */
function bas([x, y]: [number, number], e = EPAISSEUR): string {
  return `${x},${y + e}`
}

const DESSUS = `${NEAR[0]},${NEAR[1]} ${GAUCHE[0]},${GAUCHE[1]} ${LOIN[0]},${LOIN[1]} ${DROITE[0]},${DROITE[1]}`
const FLANC_GAUCHE = `${GAUCHE[0]},${GAUCHE[1]} ${NEAR[0]},${NEAR[1]} ${bas(NEAR)} ${bas(GAUCHE)}`
const FLANC_DROIT = `${NEAR[0]},${NEAR[1]} ${DROITE[0]},${DROITE[1]} ${bas(DROITE)} ${bas(NEAR)}`

/** Le losange du dessus, rentré vers son centre : le jonc intérieur. */
function jonc(part: number): string {
  const cx = 50
  const cy = (NEAR[1] + LOIN[1]) / 2
  const p = ([x, y]: [number, number]): string =>
    `${cx + (x - cx) * part},${cy + (y - cy) * part}`
  return `${p(NEAR)} ${p(GAUCHE)} ${p(LOIN)} ${p(DROITE)}`
}

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
      {/* LE CADRE COLLE AU DESSIN. Le losange va de 10 à 90 en x et de 22 à 82
          en y — épaisseur comprise ; un viewBox carré laissait donc un tiers
          de vide et le paquet paraissait deux fois trop petit pour sa place. */}
      <svg viewBox="7 19 86 66" className="tas-dessin" aria-hidden="true">
        <defs>
          <linearGradient id={`${id}-dessus`} x1="0" y1="0" x2="0.6" y2="1">
            <stop offset="0" stopColor="#3b3f4c" />
            <stop offset="1" stopColor="#1b1e27" />
          </linearGradient>
        </defs>

        {/* LES DEUX FLANCS D'ABORD : le dessus se pose dessus et masque leur
            arête haute, ce qui évite un liseré en travers du paquet. */}
        <polygon points={FLANC_GAUCHE} fill="#15171e" />
        <polygon points={FLANC_DROIT} fill="#23262f" />

        {/* LES FEUILLETS : ce sont des cartes, pas un bloc. */}
        {[0.3, 0.55, 0.8].map((f) => (
          <polyline
            key={f}
            points={`${bas(GAUCHE, EPAISSEUR * f)} ${bas(NEAR, EPAISSEUR * f)} ${bas(DROITE, EPAISSEUR * f)}`}
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

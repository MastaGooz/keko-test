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

/*
 * LA PROJECTION EN MATRICE A DISPARU AVEC LE DOS PLAQUÉ. Elle servait à poser
 * une IMAGE sur le dessus du paquet — `coin()` étant une rotation suivie d'un
 * écrasement, donc une affine, donc exprimable en `matrix()`. Son histoire, et
 * les deux pièges SVG qu'elle a coûtés (une image rastérisée à sa taille LOCALE
 * et non à sa taille projetée, un `clip-path` défini dans le repère de
 * l'élément qui le porte), vivent dans `git log`. *Du code mort ment sur ce que
 * le jeu fait.*
 */

const LOIN = coin(-1, 1)
const GAUCHE = coin(-1, -1)
const NEAR = coin(1, -1)
const DROITE = coin(1, 1)

/**
 * LES ANGLES SONT ADOUCIS. Demandé par Keko : « tu penses que c'est possible
 * d'arrondir un peu les angles du paquet (léger) ? »
 *
 * *Une carte a les coins ronds — le gabarit le dit depuis le début* (`RAYON_CARTE`,
 * 3 % de la largeur), et le paquet était le seul endroit du jeu où elle en avait
 * de francs. **L'arrondi se compte en unités du dessin et non en part de la
 * carte** : il doit rester le MÊME sur le dessus et sur les deux flancs, alors
 * que ceux-ci n'ont pas la même taille.
 *
 * Chaque coin se remplace par une quadratique dont le point de contrôle est le
 * coin lui-même : *la courbe reste donc tangente aux deux bords*, et le rayon
 * se borne à la moitié du plus court — sinon deux coins voisins se mangeraient
 * sur une arête courte.
 */
const ARRONDI = 4

function adouci(points: readonly [number, number][], r: number): string {
  const n = points.length
  const d: string[] = []
  for (let i = 0; i < n; i += 1) {
    const avant = points[(i - 1 + n) % n]!
    const coinci = points[i]!
    const apres = points[(i + 1) % n]!
    const vers = (p: [number, number]): [number, number] => {
      const dx = p[0] - coinci[0]
      const dy = p[1] - coinci[1]
      const l = Math.hypot(dx, dy) || 1
      const k = Math.min(r, l / 2) / l
      return [coinci[0] + dx * k, coinci[1] + dy * k]
    }
    const e = vers(avant)
    const f = vers(apres)
    d.push(`${i === 0 ? 'M' : 'L'}${e[0].toFixed(2)},${e[1].toFixed(2)}`)
    d.push(`Q${coinci[0].toFixed(2)},${coinci[1].toFixed(2)} ${f[0].toFixed(2)},${f[1].toFixed(2)}`)
  }
  d.push('Z')
  return d.join(' ')
}

/** Le même point, descendu de l'épaisseur du paquet. */
function bas([x, y]: [number, number]): [number, number] {
  return [x, y + EPAISSEUR]
}

const DESSUS = adouci([LOIN, GAUCHE, NEAR, DROITE], ARRONDI)

/**
 * **L'ARRONDI SE POSE SUR LA SILHOUETTE, pas sur chaque face.**
 *
 * Les deux flancs partagent l'arête du bas : arrondis chacun de son côté, ils
 * creusaient une ENCOCHE au point le plus bas du paquet — *aucun des deux n'y
 * possède les deux bords du vrai coin*, donc chacun coupait vers la couture.
 *
 * On dessine donc le contour du solide d'un seul trait, et le flanc clair se
 * pose dessus en étant ROGNÉ par lui : la couture reste franche — *c'est une
 * arête, elle n'a pas à s'arrondir* — et seul le dehors est adouci.
 */
const SILHOUETTE = adouci(
  [LOIN, DROITE, bas(DROITE), bas(NEAR), bas(GAUCHE), GAUCHE],
  ARRONDI,
)
const FLANC_DROIT = adouci([NEAR, DROITE, bas(DROITE), bas(NEAR)], 0)

/**
 * L'ÉTOILE DU DESSUS. Keko : « le logo est trop petit, il faudrait une étoile
 * simplifiée, un peu dans le ton de l'icône de la main ».
 *
 * **Elle est DROITE, et seulement écrasée.** Passée par `MATRICE` comme le dos
 * qu'elle remplace, elle héritait aussi de la ROTATION de la carte : un paquet
 * posé en losange tourne son dessin de 35°, et *une étoile penchée ne se lit
 * pas comme une étoile, elle se lit comme un défaut.* Elle garde donc l'axe de
 * l'écran et ne prend que l'écrasement de la vue de trois quarts — ce qui
 * suffit à la poser SUR la face plutôt qu'à côté.
 *
 * **Quatre branches, et c'est une forme déjà tranchée par le projet** : « six
 * branches égales font une étoile de David, quatre branches fines ne disent
 * que la lumière ». Ici elles sont ÉPAISSES (le creux vaut 44 % de la pointe) —
 * *une étoile mince se lit comme un éclat, une étoile pleine se lit comme un
 * emblème*, et c'est un emblème qu'on veut.
 *
 * **Son rayon se borne au cercle inscrit du losange**, pas à sa demi-diagonale :
 * un losange se rétrécit vers ses pointes, donc une étoile calée sur la largeur
 * sortirait par les côtés.
 *
 * **ET SES POINTES SUIVENT LES AXES DE LA CARTE, pas ceux de l'écran.** Keko :
 * « ses pointes vont sur la gauche / droite / haut / bas, pas les diagonales
 * comme là ».
 *
 * *Les deux repères sont à 45° l'un de l'autre, et c'est ce qui rendait la
 * remarque surprenante* : le paquet est posé en LOSANGE, donc ses coins
 * tombent sur les axes de l'écran et ses bords sur les diagonales. Une étoile
 * calée sur l'écran pointait donc, sur la carte, vers ses QUATRE COINS — et
 * c'est bien une étoile en diagonale qu'on lisait. **Un emblème imprimé sur une
 * carte suit les axes de la carte**, donc les siennes visent le milieu de
 * chaque bord.
 *
 * *Et ça reste symétrique*, ce que la matrice du paquet ne donnait pas : les
 * quatre pointes sont à 45° de l'écran, donc **l'écrasement les raccourcit
 * toutes de la même façon** — là où la rotation de 35° de la carte en
 * déformait deux et pas les deux autres. C'est ce qui faisait lire la première
 * version comme une girouette.
 */
const BRANCHES = 4
const POINTE = 26
const CREUX = POINTE * 0.44

const ETOILE_PATH = adouci(
  Array.from({ length: BRANCHES * 2 }, (_, i): [number, number] => {
    // Le quart de tour met les POINTES sur les diagonales de l'écran, donc sur
    // les axes de la carte — et les CREUX sur les axes de l'écran, donc dans
    // les coins du losange, là où il n'y a de toute façon pas de place.
    const a = (i * Math.PI) / BRANCHES - Math.PI / 2 + Math.PI / 4
    const r = i % 2 === 0 ? POINTE : CREUX
    return [Math.cos(a) * r, Math.sin(a) * r]
  }),
  0,
)

/**
 * **EN COMBAT, LES DEUX TAS PORTENT DES CARTES, pas l'étoile.** Keko, en deux
 * temps : « en combat il ne faut pas mettre l'étoile sur le paquet, on met les
 * symboles pioche et défausse », puis — en voyant les flèches qui avaient tenu
 * ce rôle — « je les trouve trop gros et pas terrible ; pour la pioche il
 * faudrait par exemple deux cartes en éventail, et pour la défausse une carte
 * barrée ».
 *
 * *L'étoile dit « des cartes »*, et c'est tout ce qu'on demande au bouton du
 * deck, qui est seul de son espèce. **En combat il y en a DEUX côte à côte, et
 * ce qu'on doit lire n'est plus ce qu'ils contiennent — c'est lequel est
 * lequel.**
 *
 * **Et ce qui les sépare doit être un OBJET, pas une direction.** Une paire de
 * flèches opposées disait le sens de circulation, ce qui est juste et ce qui ne
 * se lit pas : *deux triangles ne se distinguent qu'en les comparant*, donc il
 * fallait regarder les deux pour savoir lequel est lequel — exactement ce que
 * leur PLACE faisait déjà. Un éventail et une carte barrée, eux, se
 * reconnaissent chacun seul.
 *
 * *La carte barrée avait été écartée une fois* — « elle dirait la destruction,
 * et une carte défaussée revient au remélange ». **Keko a tranché l'inverse, et
 * il a raison sur le registre** : le barré ne dit pas ici « détruit », il dit
 * « joué », « hors de la main » — c'est le geste de rayer une ligne d'une
 * liste, pas celui de la brûler. Les cartes qui s'exilent pour de bon, elles,
 * ne rejoignent aucun tas.
 */

/**
 * LE GLYPHE EST UNE CARTE, au rapport du gabarit et aux coins ronds comme lui.
 *
 * **Sa demi-hauteur est plus petite dans l'éventail**, parce que *deux cartes
 * pèsent plus qu'une* : ce qui doit se ressembler d'un tas à l'autre n'est pas
 * la taille d'une carte, c'est l'ENCRE totale de l'emblème — la règle du coeur
 * et de l'éventail de la bande de mesures, où trois densités ont donné trois
 * chiffres.
 *
 * Mesuré dans le repère du dessin, écrasement compris : l'éventail fait 32 x 19
 * à l'écran, la carte barrée 28 x 19 — contre 36 x 32 pour les flèches qu'ils
 * remplacent. *C'est la hauteur qui tombe*, et c'est elle que Keko lisait comme
 * « trop gros ».
 */
const GLYPHE = 10.5
const GLYPHE_PAIRE = 10
const PENCHE = 20
const ECART_PAIRE = 4.5
const ARRONDI_GLYPHE = 0.18

/**
 * **IL SE DESSINE DANS LE REPÈRE DE L'ÉCRAN, puis se pré-étire.**
 *
 * L'emblème est posé à plat sur la face du paquet, donc écrasé de `ECRASEMENT`
 * — ce qui ne coûtait rien à l'étoile, qui n'a pas de forme à tenir. *Une
 * carte, si* : à 0,62 de hauteur, un rectangle au rapport du gabarit sort plus
 * LARGE que haut, et on ne lit plus une carte mais une tuile. On compose donc
 * la figure telle qu'on veut la voir, et on divise sa hauteur par l'écrasement
 * que la scène lui rendra.
 *
 * **La rotation se fait AVANT**, dans le repère de l'écran : pencher puis
 * étirer n'est pas étirer puis pencher — le second donnerait un parallélogramme
 * là où on veut un rectangle incliné.
 */
function redresse(points: readonly [number, number][]): [number, number][] {
  return points.map(([x, y]) => [x, y / ECRASEMENT])
}

/** Une carte, penchée puis décalée — en unités d'ÉCRAN. */
function carteGlyphe(h: number, penche: number, dx: number): string {
  const l = h / RAPPORT
  const a = (penche * Math.PI) / 180
  const cos = Math.cos(a)
  const sin = Math.sin(a)
  const points = ([
    [-l, -h],
    [l, -h],
    [l, h],
    [-l, h],
  ] as [number, number][]).map(
    ([x, y]) => [dx + x * cos - y * sin, x * sin + y * cos] as [number, number],
  )
  return adouci(redresse(points), h * ARRONDI_GLYPHE)
}

/**
 * LA BARRE SUIT LA DIAGONALE DE LA CARTE, et elle la DÉPASSE des deux bouts.
 *
 * *Une barre contenue dans la carte se lit comme un motif imprimé dessus* ; ce
 * qui la raye doit sortir de son cadre. Son angle n'est pas choisi : c'est
 * celui du coin au coin — un trait qui coupe un rectangle de biais sans suivre
 * sa diagonale se lit comme un trait de travers.
 *
 * **Elle est isolée par un JOUR, pas par une couleur.** Peinte en sombre sur la
 * carte, elle ne sortirait pas de son cadre — au-delà de la carte il n'y a que
 * la face sombre du paquet, où un trait sombre n'existe pas. On creuse donc la
 * carte d'une bande un peu plus large et on pose la barre dedans : les deux
 * restent du même laiton, et c'est le vide qui les sépare. *C'est le
 * raisonnement du jonc qui s'interrompt autour de l'orbe du coût.*
 */
const BARRE_ANGLE = Math.atan2(GLYPHE, GLYPHE / RAPPORT)
const BARRE_LONG = GLYPHE * 3.05
const BARRE_EPAIS = 2.7
const BARRE_JOUR = 1.7

function barreGlyphe(epaisseur: number): string {
  const cos = Math.cos(BARRE_ANGLE)
  const sin = Math.sin(BARRE_ANGLE)
  const dl = BARRE_LONG / 2
  const de = epaisseur / 2
  const points = ([
    [-dl, -de],
    [dl, -de],
    [dl, de],
    [-dl, de],
  ] as [number, number][]).map(
    ([x, y]) => [x * cos - y * sin, x * sin + y * cos] as [number, number],
  )
  // Tout l'emblème est en chemins : *deux façons de décrire la même sorte de
  // forme finiraient par diverger*, et `adouci` à zéro ne fait que fermer le
  // polygone.
  return adouci(redresse(points), 0)
}

const PAIRE_ARRIERE = carteGlyphe(GLYPHE_PAIRE, -PENCHE, -ECART_PAIRE)
const PAIRE_AVANT = carteGlyphe(GLYPHE_PAIRE, PENCHE, ECART_PAIRE)
const CARTE_SEULE = carteGlyphe(GLYPHE, 0, 0)
const BARRE = barreGlyphe(BARRE_EPAIS)
const BARRE_ENTAILLE = barreGlyphe(BARRE_EPAIS + BARRE_JOUR * 2)

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

import { useEffect, useRef } from 'react'

type Props = {
  /** Sert aussi d'identifiant de dégradé : deux SVG qui partagent un `id` font
   *  que le second emprunte la couleur du premier. */
  nom: 'pioche' | 'defausse'
  compte: number
  /**
   * Vrai le temps du mélange : le tas TREMBLE.
   *
   * Le gonflement, lui, n'est plus là-dedans — il suit les arrivées (`choc`),
   * une par brassée. *Un tas gonfle parce qu'on y verse quelque chose, pas
   * parce qu'un mélange est en cours.*
   */
  brasse?: boolean
  /**
   * Un compteur d'arrivées : le tas gonfle une fois à chaque incrément.
   *
   * *Un compteur plutôt qu'un instant* — on ne veut pas savoir QUAND une carte
   * est tombée, seulement qu'il en est tombé une de plus, et deux arrivées
   * rapprochées doivent relancer le geste sans l'attendre.
   */
  choc?: number
  /**
   * CE QUE PORTE LE DESSUS. Par défaut, le symbole du tas.
   *
   * *Le bouton « Deck » du hub, lui, demande l'ÉTOILE* : il est seul de son
   * espèce, donc il n'a personne à départager — ce qu'il dit est « des cartes »,
   * pas « celui-ci plutôt que l'autre ».
   */
  embleme?: 'etoile' | 'pioche' | 'defausse'
}

export function Tas3D({
  nom,
  compte,
  brasse = false,
  choc = 0,
  embleme,
}: Props): React.JSX.Element {
  const id = `tas-${nom}`
  const marque = embleme ?? nom
  const dessin = useRef<SVGSVGElement>(null)

  /**
   * LE TAS ENCAISSE CHAQUE CARTE QU'ON Y JETTE. Demandé par Keko. La traînée
   * arrivait et le tas ne bougeait pas : *on jetait quelque chose dans un
   * objet qui ne le sentait pas passer.*
   *
   * **Ça passe par l'API d'animation, pas par une classe CSS**, parce qu'il
   * faut pouvoir RELANCER le geste alors qu'il n'est pas fini — cinq cartes
   * partent à 50 ms d'intervalle. Une classe qu'on retire et qu'on repose ne
   * redémarre pas l'animation sans un reflow forcé ; une animation qu'on lance
   * à la main remplace simplement la précédente.
   *
   * `scale` et non `transform` : la même raison que le gonflement du mélange —
   * la pioche porte un `scaleX(-1)` qu'un `transform` écraserait. Le tas de
   * droite n'en a pas, mais une règle qui ne vaut que pour un tas sur deux est
   * une règle qu'on oubliera.
   */
  useEffect(() => {
    if (choc === 0) return
    const el = dessin.current
    if (el === null || typeof el.animate !== 'function') return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const jeu = el.animate([{ scale: '1' }, { scale: '1.16', offset: 0.3 }, { scale: '1' }], {
      duration: 190,
      easing: 'ease-out',
    })
    return () => jeu.cancel()
  }, [choc])

  /**
   * **LE DESSUS N'EST PLUS LE DOS DE CARTE, IL EST DESSINÉ.** Keko : « on peut
   * avoir un truc plus stylisé ? ça fait trop réaliste ; inutile d'avoir les
   * séparateurs qui montrent les tranches des cartes, et le logo est trop
   * petit — il faudrait une étoile simplifiée, un peu dans le ton de l'icône de
   * la main ».
   *
   * *C'était la règle inverse* — « le dessus du paquet est le dos de carte,
   * c'est la même carte » — et elle tombe pour la raison qui a fait ce tas :
   * **ce qu'on ne touche jamais n'a pas besoin d'être un objet.** Un dos de
   * carte est dessiné pour 250 px ; dans un bouton il en fait 24, et son
   * médaillon n'y est plus qu'une tache. *Un dessin fidèle réduit n'est pas un
   * symbole, c'est une vignette illisible.*
   *
   * Ce qui le remplace parle la langue de l'icône de la main : **des aplats de
   * laiton et un cerne sombre**, et rien d'autre.
   */
  return (
    <div className={`tas-3d ${nom}${brasse ? ' brasse' : ''}`}>
      <span className="tas-compte">{compte}</span>
      <svg ref={dessin} viewBox={CADRE} className="tas-dessin" aria-hidden="true">
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
        <clipPath id={`${id}-silhouette`}>
          <path d={SILHOUETTE} />
        </clipPath>
        <path d={SILHOUETTE} fill="#d8bd7f" />
        <path d={FLANC_DROIT} fill="#f2ddaa" clipPath={`url(#${id}-silhouette)`} />

        {/* LES FEUILLETS SONT PARTIS. Keko : « inutile d'avoir les séparateurs
            qui montrent les tranches des cartes ». *Ils disaient le nombre de
            cartes d'un vrai paquet* — c'est une information de matière, et ce
            dessin a cessé d'être une matière : il ne reste que le VOLUME, qui
            suffit à dire « un paquet ». La tranche claire le porte seule. */}

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
          <path d={DESSUS} />
        </clipPath>
        <path
          d={DESSUS}
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
        {/* L'EMBLÈME, POSÉ À PLAT SUR LE DESSUS : droit, et écrasé de la même
            fraction que le paquet. Deux aplats et rien d'autre, comme l'icône
            de la main — *un emblème de vingt pixels n'a droit ni à un dégradé
            ni à un filet.* */}
        <clipPath id={`${id}-moitie`} clipPathUnits="userSpaceOnUse">
          <rect x={-POINTE} y={-POINTE} width={POINTE} height={POINTE * 2} />
        </clipPath>
        <mask id={`${id}-entaille`} maskUnits="userSpaceOnUse" x={-50} y={-50} width={100} height={100}>
          <rect x={-50} y={-50} width={100} height={100} fill="#fff" />
          <path d={BARRE_ENTAILLE} fill="#000" />
        </mask>
        <g transform={`translate(${CENTRE[0]} ${CENTRE[1]}) scale(1 ${ECRASEMENT})`}>
          {marque === 'etoile' && (
            <>
              <path d={ETOILE_PATH} fill="#f0d9a2" />
              {/* LA MOITIÉ GAUCHE EST PLUS SOMBRE : la lumière vient du haut et
                  de la droite, comme sur les flancs du paquet et sur l'icône de
                  la main. *Un aplat unique se lirait comme une découpe, pas
                  comme un objet posé.*

                  LE PARTAGE NE VAUT QUE POUR L'ÉTOILE. Les deux emblèmes de
                  combat sont faits de CARTES, et *une carte est un plan* : une
                  coupure verticale en travers s'y lirait comme un pli. Leur
                  relief vient d'ailleurs — l'une est derrière l'autre dans
                  l'éventail, et la barre se détache par son jour. */}
              <path d={ETOILE_PATH} fill="#c8ab6d" clipPath={`url(#${id}-moitie)`} />
            </>
          )}
          {marque === 'pioche' && (
            <>
              {/* CELLE DE DERRIÈRE EST DANS L'OMBRE DE L'AUTRE, et c'est tout
                  ce qui fait l'éventail : à tons égaux, deux cartes qui se
                  recouvrent ne font qu'une silhouette trouée.

                  Son ton descend plus bas que la moitié sombre de l'étoile :
                  *celle-ci partage une MÊME surface, où l'oeil complète ce
                  qu'il voit ; ici il faut séparer DEUX objets*, et il n'y a que
                  vingt pixels pour le dire. */}
              <path d={PAIRE_ARRIERE} fill="#ab8c4e" />
              <path d={PAIRE_AVANT} fill="#f0d9a2" />
            </>
          )}
          {marque === 'defausse' && (
            <>
              <path d={CARTE_SEULE} fill="#f0d9a2" mask={`url(#${id}-entaille)`} />
              <path d={BARRE} fill="#f0d9a2" />
            </>
          )}
        </g>
      </svg>
    </div>
  )
}

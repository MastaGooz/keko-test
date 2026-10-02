/**
 * LA CARTE QU'ON REGARDE DE PRÈS.
 *
 * Taper une carte l'amène au centre, droite et grande ; taper n'importe où la
 * repose. C'est l'autre moitié du geste — sans elle, le recouvrement de
 * l'éventail rend une carte illisible tant qu'on ne la sort pas.
 *
 * **LE ZOOM PORTE LA CARTE, PAS UN INDEX DE MAIN**, et c'est la leçon du jeu
 * 2D reprise telle quelle : tant qu'il était un index dans la main, il était
 * impossible de zoomer ailleurs — Keko : « je ne peux pas cliquer sur le
 * trésor dans le slot de loot pour zoomer ». Il vit donc ici, au-dessus de
 * tout le monde, et n'importe quel écran peut lui passer une carte.
 *
 * **ELLE RÉPOND AU CURSEUR** (`reflet`) : elle s'incline sous lui, s'avance
 * d'un cheveu, et un lustre balaie sa face là où il se pose. Demandé par
 * Keko. *C'est le seul écran où l'on REGARDE une carte sans rien en faire* —
 * ailleurs le pointeur sert à la prendre, et une carte qui bascule au moment
 * où on la saisit serait du bruit. Les modèles du set y répondent aussi : ce
 * sont des cartes du même écran.
 *
 * **Le voile est un plan posé DANS la scène**, entre ce qu'on regardait et la
 * carte. En HTML par-dessus le canvas il faudrait le percer pour laisser voir
 * la carte ; ici il suffit de mettre la carte devant. Et comme un plan
 * **intercepte les rayons**, tout ce qu'il recouvre devient insensible au
 * doigt sans qu'on ait à désactiver quoi que ce soit.
 */
import { useEffect, useRef, useState } from 'react'
import { useThree } from '@react-three/fiber'
import { Carte3D, tailleDuCompte } from './Carte3D.tsx'
import { zCamera, hauteurVisibleA } from './Cadrage.tsx'
import type { CarteAPeindre } from './texture-carte.ts'
import { rapportGlossaire, textureGlossaire } from './texture-carte.ts'
import { GLOSSAIRE } from '../ui/texte-carte.ts'
import * as THREE from 'three'

/**
 * Distances CAMÉRA → carte regardée, et caméra → voile : elles suivent le
 * recul du cadrage. À cette profondeur la carte occupe ~73 % de la hauteur
 * d'écran — assez pour lire le cartouche entier, pas assez pour déborder.
 */
const RECUL_ZOOM = 2.5
const RECUL_VOILE = 3

/**
 * LE SET D'UNE PIÈCE, MONTRÉ EN CARTES.
 *
 * Une pièce zoomée montre les modèles qu'elle apporte, **dessinés comme les
 * vraies cartes qu'on retrouvera en main** — en ligne et non en éventail : ce
 * sont des modèles, pas une main, on les compare, on ne les tient pas.
 *
 * **PRÉVU POUR HUIT MODÈLES, PAS TROIS.** Tranché par Keko : « on vise entre 3
 * et 8 cartes différentes, le système d'affichage doit déjà être compatible ».
 * La rangée replie à QUATRE par ligne, deux lignes au plus, et la taille d'une
 * carte du set est bornée trois fois — par la hauteur pour que deux lignes
 * tiennent avec leurs pastilles, par la largeur pour que quatre tiennent à
 * côté de la pièce, et par un plafond pour qu'elle ne devienne pas la vedette.
 */
export type Entree = { carte: CarteAPeindre; nombre: number }

const COLONNES_SET = 4
/** Et sur combien de lignes au plus : c'est ce qui borne la taille d'une carte. */
const LIGNES_SET = 2
/**
 * LE DECK CHOISIT SES COLONNES — il n'en a pas un nombre écrit d'avance.
 *
 * Keko : « ça se passe comment si le deck a un nombre de cartes qui ne loge pas
 * à l'écran ? » *Il ne déborde jamais* — la taille d'une carte se déduit de la
 * place — **mais à colonnes fixes il rétrécissait pour rien** : à douze modèles
 * sur cinq colonnes, trois lignes serrées alors que deux lignes de six tenaient
 * largement en largeur.
 *
 * On essaie donc toutes les grilles et on garde celle qui fait les plus grandes
 * cartes. Mesuré, en largeur de carte sur un téléphone couché (844 x 390) :
 *
 * | modèles | colonnes fixes | colonnes choisies |
 * |---|---|---|
 * | 6 | 94 px | **118 px** (6 x 1) |
 * | 12 | 63 px | **94 px** (6 x 2) |
 * | 25 | 38 px | **63 px** (9 x 3) |
 *
 * *La règle de la grille de référence stable ne vaut pas ici* : elle existe
 * pour qu'une pièce riche se lise comme une pièce pauvre, or il n'y a qu'un
 * deck et on ne le compare à rien.
 *
 * **25 est le plafond du catalogue** — deux armes à huit modèles, une armure à
 * six, trois consommables distincts — et à 25 la carte fait encore 63 px, plus
 * qu'une case de coffre. Au-delà elle continuerait de rétrécir : c'est le jour
 * où il faudra faire défiler, pas avant.
 */
function grilleDuDeck(n: number, large: number, haut: number, plafond: number): {
  colonnes: number
  lignes: number
  taille: number
} {
  let meilleure = { colonnes: 1, lignes: n, taille: 0 }
  for (let colonnes = 1; colonnes <= n; colonnes += 1) {
    const lignes = Math.ceil(n / colonnes)
    const taille = Math.min(plafond, haut / (lignes * 1.82), large / (colonnes * 1.1))
    if (taille > meilleure.taille) meilleure = { colonnes, lignes, taille }
  }
  return meilleure
}

/**
 * Ce qu'il faut maintenir le doigt pour qu'une carte du set grossisse.
 *
 * Le même seuil que la prise en main d'une carte : *un appui long veut dire la
 * même chose partout dans ce jeu.* À la souris, le survol suffit — il n'y a
 * rien à distinguer.
 */
const DELAI_LOUPE = 160
/** La largeur à laquelle une carte du set se lit sans effort, en pixels. */
const CIBLE_LOUPE_PX = 190

/** De combien la carte regardée s'avance vers l'oeil. */
const AVANCEE_LOUPE = 0.35

type Props = {
  carte: CarteAPeindre | null
  set?: readonly Entree[]
  onFermer?: () => void
  onPeinte?: () => void
}

export function Zoom3D({ carte, set, onFermer, onPeinte }: Props): React.JSX.Element | null {
  const { size, viewport } = useThree()

  /**
   * LA CARTE DU SET QU'ON REGARDE DE PLUS PRÈS.
   *
   * Demandé par Keko : « on peut afficher systématiquement la taille qu'on voit
   * actuellement sur l'Espadon, mais quand le joueur maintient son doigt ou
   * survole, on grossit la carte ? »
   *
   * *Ça règle les deux problèmes d'un coup* : la grille garde une taille fixe,
   * donc la mise en page ne dépend plus du nombre de modèles — une pièce à
   * trois cartes et une pièce à huit se lisent au même format — et la
   * lisibilité, qui manquait à cette taille, revient à la demande.
   */
  const [loupe, setLoupe] = useState<string | null>(null)
  const appui = useRef<{ minuteur: number; ouverte: boolean; couper: AbortController } | null>(null)

  // Elle ne survit pas au changement de carte zoomée : on regarde autre chose.
  const idZoome = carte?.id ?? null
  useEffect(() => setLoupe(null), [idZoome])
  useEffect(
    () => () => {
      if (appui.current !== null) {
        window.clearTimeout(appui.current.minuteur)
        appui.current.couper.abort()
      }
    },
    [],
  )

  /**
   * AU DOIGT, C'EST LE MAINTIEN QUI GROSSIT — et la tape ferme, comme avant.
   *
   * Les écouteurs se retirent par SIGNAL et non par référence : c'est la règle
   * du projet, et elle vaut d'autant plus ici que ce gestionnaire est recréé à
   * chaque rendu.
   */
  const maintenir = (id: string): void => {
    const couper = new AbortController()
    const etat = { minuteur: 0, ouverte: false, couper }
    etat.minuteur = window.setTimeout(() => {
      etat.ouverte = true
      setLoupe(id)
    }, DELAI_LOUPE)
    appui.current = etat
    const fin = (): void => {
      window.clearTimeout(etat.minuteur)
      couper.abort()
      appui.current = null
      // Un appui long a servi à REGARDER : le relâcher repose la carte, il ne
      // referme pas le zoom. Une tape, elle, garde son sens d'avant.
      if (etat.ouverte) setLoupe(null)
      else onFermer?.()
    }
    window.addEventListener('pointerup', fin, { signal: couper.signal })
    window.addEventListener('pointercancel', fin, { signal: couper.signal })
  }

  const modeles = set ?? []
  if (carte === null && modeles.length === 0) return null
  const zCarte = zCamera(size.height) - RECUL_ZOOM
  const zVoile = zCamera(size.height) - RECUL_VOILE

  // Seule la carte, sans son set : elle occupe le centre, comme toujours.
  const seule = modeles.length === 0
  /**
   * **UN SET SANS PIÈCE : C'EST LE DECK.**
   *
   * Le zoom montrait les modèles d'une pièce ; consulter son deck, c'est la
   * même page sans la pièce à gauche. *Ce sont les mêmes cartes, ce doit être
   * le même écran* — la grille, les comptes, la loupe et la fermeture à la
   * tape viennent avec, et il n'y a rien à réécrire à côté.
   */
  const sansPiece = carte === null
  /**
   * **LE GLOSSAIRE COUVRE TOUT CE QUE LE ZOOM MONTRE, pas la seule carte du
   * milieu.** Keko, en zoomant la Rondache : « je ne vois pas l'encadré avec
   * la description d'étourdissement ».
   *
   * *Et c'est l'écran où le mot se découvre* : une carte de deck ne se regarde
   * seule qu'en combat, alors que le set d'une pièce et le bouton « Deck » la
   * montrent AVANT d'avoir joué. **Un glossaire qui n'existe que là où l'on
   * connaît déjà le mot n'explique rien.** On prend donc les mots-clés de la
   * carte ET de ses modèles, dédupliqués.
   */
  const motsZoom = [
    ...new Set([
      ...(carte?.motsCles ?? []),
      ...modeles.flatMap((entree) => entree.carte.motsCles ?? []),
    ]),
  ].filter((mot) => GLOSSAIRE[mot] !== undefined)

  const H = hauteurVisibleA(zCarte, size.height)
  const L = (H * size.width) / size.height
  const marge = L * 0.04
  /**
   * **LA BANDE DU GLOSSAIRE SE PREND AVANT LA GRILLE.**
   *
   * Calculée après, elle ne trouvait plus de place dès que le set tenait deux
   * lignes — l'encadré tombait alors à une barre de quelques pixels, ou
   * disparaissait. *Une bande réservée ne se partage pas* : c'est la règle que
   * le bouton du deck avait déjà payée au hub, et la grille cède d'autant,
   * exactement comme les meubles cèdent au rail.
   */
  const ecartGloss = marge * 0.5
  const bandeGloss =
    motsZoom.length === 0 || modeles.length === 0 ? 0 : H * 0.135 * motsZoom.length + ecartGloss
  const hautGrille = H * 0.88 - bandeGloss

  // La pièce cède de la place au set, mais reste la plus grande : c'est elle
  // qu'on regarde, le set n'est que ce qu'elle apporte.
  const piece = sansPiece ? 0 : seule ? H * 0.72 / 1.4 : Math.min((H * 0.8) / 1.4, L * 0.26)
  const largeurSet = sansPiece ? L - 2 * marge : L - 3 * marge - piece
  /**
   * **LE PLAFOND D'UNE CARTE DU DECK EST CE QU'ELLE VAUT À SIX MODÈLES.**
   * Demandé par Keko : « quand on affiche le deck, on va mettre une taille max
   * aux cartes (même quand y'en a 3) qui correspond à la taille actuelle quand
   * on a 6 cartes différentes affichées ».
   *
   * *Sans plafond, un deck court se lisait comme une autre page* : à trois
   * modèles la carte montait à la moitié de la hauteur d'écran, soit 60 % de
   * plus qu'à six. **Un deck n'est pas plus important parce qu'il est plus
   * court.**
   *
   * Le plafond se CALCULE — c'est la grille à six, au format du moment — et non
   * une fraction écrite à la main : *une taille de référence doit se dériver de
   * ce à quoi elle fait référence*, sinon elle se désaccorde au premier réglage
   * de la grille.
   */
  const plafondDeck = grilleDuDeck(6, largeurSet, hautGrille, H * 0.5).taille
  const deck = sansPiece
    ? grilleDuDeck(Math.max(1, modeles.length), largeurSet, hautGrille, plafondDeck)
    : null
  const colonnes = deck?.colonnes ?? Math.min(COLONNES_SET, seule ? 1 : modeles.length)
  const lignes = deck?.lignes ?? (seule ? 1 : Math.ceil(modeles.length / colonnes))
  /**
   * LA TAILLE D'UNE CARTE DU SET NE DÉPEND PAS DE LEUR NOMBRE.
   *
   * Elle se calcule pour la grille PLEINE — quatre colonnes, deux lignes —
   * même quand la pièce n'apporte que trois modèles. *Une page qui montre le
   * même objet ne le montre pas à deux échelles selon ce qu'il y a à côté*, et
   * c'est ce qui fait qu'une pièce riche et une pièce pauvre se lisent pareil.
   * La lisibilité, elle, vient de la loupe.
   */
  const uneCarte =
    deck?.taille ??
    Math.min(piece * 0.62, hautGrille / (LIGNES_SET * 1.82), largeurSet / (COLONNES_SET * 1.1))
  /**
   * CE QU'UNE CARTE DU SET DEVIENT SOUS LA LOUPE — et le champ dans lequel
   * elle doit tenir.
   *
   * **Elle s'avance vers l'oeil, donc son champ visible RÉTRÉCIT.** Bornée sur
   * celui des autres cartes, elle sortait par le haut quand on regardait la
   * rangée du dessus — Keko : « ce serait bien que le zoom ne se fasse pas en
   * dehors du champ de vision ». *Un objet qu'on rapproche de la caméra n'est
   * plus mesuré par la même règle* : c'est la leçon déjà écrite pour tout ce
   * qui se calcule depuis `Cadrage`, et elle vaut aussi à l'intérieur d'un
   * écran.
   */
  // LE DISQUE DU COMPTE SE MESURE EN REM, comme au coffre : il appartient à
  // l'interface, pas au dessin, donc il ne suit pas la taille de la carte. Un
  // peu plus généreux qu'au coffre — ici on ne cherche pas, on lit.
  const tailleCompte = tailleDuCompte((uneCarte * size.height) / H, 1.15, 0.13)
  const zLoupe = zCarte + AVANCEE_LOUPE
  const hLoupe = hauteurVisibleA(zLoupe, size.height)
  const lLoupe = (hLoupe * size.width) / size.height
  /**
   * **LA LOUPE GROSSIT MOINS QUAND LA CARTE EST DÉJÀ GRANDE.**
   *
   * Keko : « sur PC les cartes générées sont zoomées trop gros quand je
   * survole — c'est bien sur téléphone — je trouve le zoom trop agressif ».
   *
   * *Le rapport était le même partout* (×1,95) parce que les deux bornes sont
   * des fractions du même champ : rien dans le calcul ne savait qu'une carte du
   * set fait 94 px sur un téléphone et 307 sur un écran de PC. Or **le travail
   * de la loupe n'est pas le même aux deux bouts** : en petit elle rend
   * lisible, en grand la carte l'est déjà et il ne lui reste qu'à DÉSIGNER
   * celle qu'on regarde. Une désignation n'a pas besoin de doubler.
   *
   * Le grossissement vise donc une taille ABSOLUE — la taille à laquelle une
   * carte se lit — et se borne entre les deux : ×1,95 tant qu'on en a besoin,
   * ×1,28 quand on ne l'a plus. C'est la règle du disque du compte et du
   * plafond de la main, appliquée à un geste.
   */
  const uneCartePx = (uneCarte * size.height) / H
  /**
   * **LE DECK N'A PAS DE PLAFOND DE GROSSISSEMENT, et il ne peut pas en avoir.**
   *
   * Keko voulait savoir à partir de quand une grande grille pose problème, et
   * la réponse était « seize modèles » : au-delà, la carte au repos devenait si
   * petite que ×1,95 ne suffisait plus à la ramener à sa taille de lecture —
   * *la loupe elle-même rétrécissait.*
   *
   * Or le plafond ne protégeait rien : il avait été posé contre un zoom « trop
   * agressif » sur grand écran, où c'est le PLANCHER (×1,28) qui commande,
   * puisque la carte y est déjà grande. **Il ne mordait que sur les cartes
   * petites — exactement celles qu'il faut agrandir le plus.** Le résultat,
   * lui, reste borné par la taille de lecture juste en dessous : *on borne ce
   * qu'on obtient, pas le chemin pour y arriver.*
   *
   * La grille d'une pièce le garde : c'est un réglage validé, et il n'y mord
   * jamais (à huit modèles, ×1,95 tombe déjà sur le plafond de taille).
   */
  const grossissement = Math.max(
    1.28,
    sansPiece ? CIBLE_LOUPE_PX / uneCartePx : Math.min(1.95, CIBLE_LOUPE_PX / uneCartePx),
  )
  /**
   * **LA PIÈCE NE BORNE LA LOUPE QUE S'IL Y EN A UNE.** Sans elle `piece` vaut
   * zéro, donc `min` valait zéro : la carte maintenue RÉTRÉCISSAIT à rien au
   * lieu de grossir — Keko : « quand je maintiens le tap sur une des cartes du
   * deck affiché, elle se réduit au lieu de zoomer ».
   *
   * *Une borne qui n'a plus d'objet ne devient pas zéro, elle disparaît* — et
   * c'est la famille du plancher resté sur la colonne de l'armurier quand son
   * bouton l'a quittée : **une contrainte posée pour un contenu se relit quand
   * ce contenu s'en va.**
   */
  const plafondLoupe = sansPiece ? Infinity : piece * 0.95
  const tailleLoupe = Math.min(plafondLoupe, (hLoupe * 0.66) / 1.4, uneCarte * grossissement)
  /**
   * LE COUPLE SE CENTRE, PAS LA PIÈCE SEULE.
   *
   * Keko : « la carte zoomée est toute à droite quand elle génère des cartes
   * de deck, et la carte générée au milieu de l'espace restant ; je voudrais
   * que le couple soit mieux placé, pourquoi pas centré sur l'écran ? »
   *
   * *La pièce était collée au bord et le set flottait dans ce qui restait* :
   * deux objets centrés chacun de leur côté, donc un ensemble qui ne l'est
   * jamais. On mesure ce que la grille occupe VRAIMENT — le budget qui a servi
   * à la dimensionner est plus large qu'elle dès qu'il y a moins de quatre
   * modèles — et on centre la somme.
   */
  const pasXSet = uneCarte * 1.1
  const largeurOccupee = Math.min(colonnes, seule ? 1 : modeles.length) * pasXSet
  const ensemble = seule ? piece : piece + marge + largeurOccupee
  /**
   * L'ENCADRÉ DU GLOSSAIRE PREND LA DROITE, là où le set d'une pièce se pose.
   *
   * Keko : « quand le joueur zoome sur la carte on affiche un encadré à
   * côté ». *Les deux ne se croisent jamais* — une pièce n'emploie pas de
   * mot-clé, une carte de deck n'a pas de set — donc ils partagent la même
   * bande sans qu'il y ait de cas à arbitrer.
   *
   * Et **l'ensemble se recentre**, carte comprise : centrer la carte puis
   * poser l'encadré à côté d'elle donnerait un bloc qui penche, la faute déjà
   * payée sur le couple pièce + set.
   */
  const pasX = uneCarte * 1.1
  const pasY = uneCarte * 1.82

  /**
   * **SEULE, LA CARTE LE MET À CÔTÉ ; AVEC UN SET, IL PASSE DESSOUS.**
   *
   * *La bande de droite est prise par le set*, donc l'encadré ne peut pas s'y
   * loger ; sous la grille, il se lit comme la note de bas de page de ce qu'on
   * vient de voir — ce qu'il est.
   */
  const rapportGloss = rapportGlossaire(Math.max(1, motsZoom.length))
  const hautSet = lignes * pasY
  const glossaire =
    motsZoom.length === 0
      ? 0
      : seule
        ? piece * 1.05
        : Math.min(
            largeurOccupee,
            // ET IL SE MESURE SUR LES CARTES, pas sur la largeur de la grille.
            // *C'est une note de bas de page*, donc son texte n'a aucune raison
            // d'être plus gros que le cartouche qu'il annote : étiré sur toute
            // la rangée, il écrasait le set qu'il explique.
            uneCarte * 2.1,
            (bandeGloss - ecartGloss) / rapportGloss,
          )
  const avecGlossaire = glossaire > 0.01
  const sousLeSet = avecGlossaire && !seule
  const hGloss = glossaire * rapportGloss
  // Le bloc { grille, encadré } se centre ENSEMBLE : centrer la grille puis
  // poser l'encadré dessous donnerait un bloc qui pend, la faute déjà payée
  // sur le couple pièce + set.
  const decalSet = sousLeSet ? (hGloss + ecartGloss) / 2 : 0
  const yGloss = sousLeSet ? -(hautSet + ecartGloss) / 2 : 0
  const totalGloss = piece + marge + glossaire
  const aDroite = avecGlossaire && seule
  const xPiece = aDroite ? -totalGloss / 2 + piece / 2 : seule ? 0 : -ensemble / 2 + piece / 2
  const xSet = sansPiece ? 0 : xPiece + piece / 2 + marge + largeurOccupee / 2
  const xGloss = aDroite ? xPiece + piece / 2 + marge + glossaire / 2 : xSet
  /**
   * **CE QUI RESTE AUTOUR D'UNE CARTE GROSSIE, en haut comme en bas.**
   *
   * La borne horizontale gardait déjà sa marge, la verticale non : la carte
   * s'arrêtait donc au bord EXACT du champ, c'est-à-dire au bord exact de
   * l'écran — Keko : « le zoom fait dépasser les cartes en haut ou en bas selon
   * la ligne, donc un bout de la carte n'est pas visible ». *Une carte collée à
   * l'arête se lit comme une carte coupée*, même quand elle tient au pixel près.
   *
   * Elle se compte sur la HAUTEUR du champ et non sur sa largeur : la marge en
   * x vaut 4 % de la largeur, ce qui ferait 8,6 % de la hauteur sur un écran
   * large — *une marge n'est pas un nombre, c'est une part de ce qu'elle
   * borde.*
   */
  const margeY = H * 0.035
  // Et si la place manque, la carte se CENTRE au lieu de choisir un bord :
  // deux bornes croisées donneraient un résultat de travers.
  const borner = (v: number, limite: number): number =>
    limite <= 0 ? 0 : Math.min(Math.max(v, -limite), limite)

  return (
    <group>
      {/* LE VOILE ARRÊTE L'ÉVÈNEMENT. Un plan intercepte bien le rayon, mais
          R3F prévient TOUS les objets qu'il traverse : sans `stopPropagation`,
          une tape sur le voile fermait le zoom *et* atteignait la carte
          derrière, qui le rouvrait aussitôt sur elle. On ne pouvait donc pas
          refermer en tapant sur la main — l'endroit le plus naturel.
          *Intercepter le rayon n'est pas intercepter l'évènement.* */}
      <mesh
        position={[0, 0, zVoile]}
        onPointerDown={(e) => {
          e.stopPropagation()
          onFermer?.()
        }}
        // ET IL ARRÊTE AUSSI LE MOUVEMENT. Sans ça, les cartes de l'écran
        // recouvert continuaient de s'incliner et de briller sous le curseur,
        // derrière le voile — Keko. *Ce que le voile cache, il doit aussi le
        // rendre insensible*, et c'est exactement ce que le `pointerdown`
        // faisait déjà : R3F prévient TOUS les objets que le rayon traverse.
        onPointerMove={(e) => e.stopPropagation()}
      >
        <planeGeometry args={[40, 24]} />
        <meshBasicMaterial color="#05050a" transparent opacity={0.8} />
      </mesh>

      {!seule &&
        modeles.map((entree, i) => {
          const colonne = i % colonnes
          const ligne = Math.floor(i / colonnes)
          const parLigne = Math.min(colonnes, modeles.length - ligne * colonnes)
          const x = xSet + (colonne - (parLigne - 1) / 2) * pasX
          const y = ((lignes - 1) / 2 - ligne) * pasY + decalSet
          const grossie = loupe === entree.carte.id
          const t = grossie ? tailleLoupe : uneCarte
          // ELLE GROSSIT SUR PLACE, mais ne sort pas de l'écran : bornée comme
          // la carte qui attend sa cible en combat. *Une carte agrandie qu'on
          // ne voit qu'à moitié n'a pas été agrandie.*
          const demiL = t / 2
          const demiH = (t * 1.4) / 2
          const xCarte = grossie ? borner(x, lLoupe / 2 - demiL - marge) : x
          const yCarte = grossie ? borner(y, hLoupe / 2 - demiH - margeY) : y + uneCarte * 0.16
          return (
            <group key={entree.carte.id}>
              <Carte3D
                carte={entree.carte}
                position={[xCarte, yCarte, grossie ? zLoupe : zCarte]}
                rotation={[0, 0, 0]}
                taille={t}
                ombre={false}
                ressort={14}
                reflet
                refletAuDoigt={grossie}
                // LE NOMBRE D'EXEMPLAIRES EST SUR LA CARTE, en bas à droite,
                // dans sa case de laiton. Keko : « on fait pareil pour les
                // chiffres qui indiquent le nombre de cartes de chaque
                // exemplaire quand on zoome ». *Le même fait se dit du même
                // symbole partout* — et posé SUR la carte, il n'annote plus
                // une place qu'elle peut quitter : il la suit sous la loupe.
                pile={entree.nombre}
                pileTaille={tailleCompte}
                onPeinte={onPeinte}
                onPointerOver={(e) => {
                  /**
                   * **CELLE DE DEVANT PREND LE SURVOL, ET LE GARDE.**
                   *
                   * Keko : « quand la souris se déplace sur la carte zoomée
                   * mais que sa position survole aussi la carte à côté, c'est
                   * la carte à côté qui se met à zoomer ; je voudrais que le
                   * zoom s'arrête seulement quand la souris SORT de la carte
                   * zoomée ».
                   *
                   * *En 3D, la profondeur trie, elle ne bloque pas* — la règle
                   * déjà payée sur le voile du zoom : R3F prévient TOUS les
                   * objets que le rayon traverse. La carte grossie s'avance
                   * vers l'oeil et déborde sur sa voisine, donc le rayon
                   * touchait les deux, et la plus lointaine gagnait en
                   * arrivant la dernière. Un `stopPropagation` rend au premier
                   * touché ce que le DOM lui donnerait tout seul.
                   */
                  e.stopPropagation()
                  // LE SURVOL N'EXISTE QU'À LA SOURIS : au doigt le
                  // `pointerout` n'arrive jamais, la carte resterait grosse.
                  if (e.pointerType === 'mouse') setLoupe(entree.carte.id)
                }}
                onPointerOut={(e) => {
                  if (e.pointerType === 'mouse')
                    setLoupe((l) => (l === entree.carte.id ? null : l))
                }}
                onPointerDown={(e) => {
                  e.stopPropagation()
                  if (e.pointerType === 'mouse') {
                    onFermer?.()
                    return
                  }
                  maintenir(entree.carte.id)
                }}
              />
            </group>
          )
        })}

      {/* LA PIÈCE RÉPOND AU MAINTIEN, ELLE AUSSI. Keko : « et faire la même sur
          la carte d'équipement déjà zoomée à gauche si le joueur maintient le
          tap dessus ». Elle ne grossit pas — elle est déjà à sa taille de
          lecture — mais elle s'incline et son lustre la balaie : *le même geste
          doit donner la même réponse, quelle que soit la carte qu'il touche.* */}
      {avecGlossaire && (
        <mesh position={[xGloss, yGloss, zCarte]}>
          <planeGeometry args={[glossaire, hGloss]} />
          <meshBasicMaterial
            map={textureGlossaire(
              motsZoom.map((mot) => ({ mot, sens: GLOSSAIRE[mot]! })),
              (glossaire / hauteurVisibleA(zCarte, size.height)) * size.height * viewport.dpr,
            )}
            transparent
            depthWrite={false}
            toneMapped={false}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
      {carte !== null && (
      <Carte3D
        carte={carte}
        taille={piece}
        position={[xPiece, 0, zCarte]}
        rotation={[0, 0, 0]}
        ressort={14}
        ombre={false}
        reflet
        refletAuDoigt={loupe === carte.id}
        onPeinte={onPeinte}
        onPointerDown={(e) => {
          e.stopPropagation()
          if (e.pointerType === 'mouse') {
            onFermer?.()
            return
          }
          maintenir(carte.id)
        }}
      />
      )}
    </group>
  )
}

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
import { Carte3D } from './Carte3D.tsx'
import { zCamera, hauteurVisibleA } from './Cadrage.tsx'
import type { CarteAPeindre } from './texture-carte.ts'

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
 * Ce qu'il faut maintenir le doigt pour qu'une carte du set grossisse.
 *
 * Le même seuil que la prise en main d'une carte : *un appui long veut dire la
 * même chose partout dans ce jeu.* À la souris, le survol suffit — il n'y a
 * rien à distinguer.
 */
const DELAI_LOUPE = 160

/** De combien la carte regardée s'avance vers l'oeil. */
const AVANCEE_LOUPE = 0.35

type Props = {
  carte: CarteAPeindre | null
  set?: readonly Entree[]
  onFermer?: () => void
  onPeinte?: () => void
}

export function Zoom3D({ carte, set, onFermer, onPeinte }: Props): React.JSX.Element | null {
  const { size } = useThree()

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

  if (carte === null) return null
  const zCarte = zCamera(size.height) - RECUL_ZOOM
  const zVoile = zCamera(size.height) - RECUL_VOILE

  // Seule la carte, sans son set : elle occupe le centre, comme toujours.
  const seule = set === undefined || set.length === 0
  const H = hauteurVisibleA(zCarte, size.height)
  const L = (H * size.width) / size.height
  const marge = L * 0.04

  const colonnes = Math.min(COLONNES_SET, seule ? 1 : set.length)
  const lignes = seule ? 1 : Math.ceil(set.length / colonnes)
  // La pièce cède de la place au set, mais reste la plus grande : c'est elle
  // qu'on regarde, le set n'est que ce qu'elle apporte.
  const piece = seule ? H * 0.72 / 1.4 : Math.min((H * 0.8) / 1.4, L * 0.26)
  const largeurSet = L - 3 * marge - piece
  /**
   * LA TAILLE D'UNE CARTE DU SET NE DÉPEND PAS DE LEUR NOMBRE.
   *
   * Elle se calcule pour la grille PLEINE — quatre colonnes, deux lignes —
   * même quand la pièce n'apporte que trois modèles. *Une page qui montre le
   * même objet ne le montre pas à deux échelles selon ce qu'il y a à côté*, et
   * c'est ce qui fait qu'une pièce riche et une pièce pauvre se lisent pareil.
   * La lisibilité, elle, vient de la loupe.
   */
  const uneCarte = Math.min(
    piece * 0.62,
    (H * 0.88) / (LIGNES_SET * 1.82),
    largeurSet / (COLONNES_SET * 1.1),
  )
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
  const zLoupe = zCarte + AVANCEE_LOUPE
  const hLoupe = hauteurVisibleA(zLoupe, size.height)
  const lLoupe = (hLoupe * size.width) / size.height
  const tailleLoupe = Math.min(piece * 0.95, (hLoupe * 0.66) / 1.4)
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
  const largeurOccupee = Math.min(colonnes, seule ? 1 : set.length) * pasXSet
  const ensemble = seule ? piece : piece + marge + largeurOccupee
  const xPiece = seule ? 0 : -ensemble / 2 + piece / 2
  const xSet = xPiece + piece / 2 + marge + largeurOccupee / 2
  const pasX = uneCarte * 1.1
  const pasY = uneCarte * 1.82

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
        set.map((entree, i) => {
          const colonne = i % colonnes
          const ligne = Math.floor(i / colonnes)
          const parLigne = Math.min(colonnes, set.length - ligne * colonnes)
          const x = xSet + (colonne - (parLigne - 1) / 2) * pasX
          const y = ((lignes - 1) / 2 - ligne) * pasY
          const grossie = loupe === entree.carte.id
          const t = grossie ? tailleLoupe : uneCarte
          // ELLE GROSSIT SUR PLACE, mais ne sort pas de l'écran : bornée comme
          // la carte qui attend sa cible en combat. *Une carte agrandie qu'on
          // ne voit qu'à moitié n'a pas été agrandie.*
          const demiL = t / 2
          const demiH = (t * 1.4) / 2
          const xCarte = grossie
            ? Math.min(Math.max(x, -lLoupe / 2 + demiL + marge), lLoupe / 2 - demiL - marge)
            : x
          const yCarte = grossie
            ? Math.min(Math.max(y, -hLoupe / 2 + demiH), hLoupe / 2 - demiH)
            : y + uneCarte * 0.16
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
                // Plus petit qu'au coffre : ici la carte est quatre fois plus
                // grande, et un disque à la même fraction y crierait.
                pileTaille={0.16}
                onPeinte={onPeinte}
                onPointerOver={(e) => {
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
    </group>
  )
}

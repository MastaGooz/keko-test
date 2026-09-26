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
 * **Le voile est un plan posé DANS la scène**, entre ce qu'on regardait et la
 * carte. En HTML par-dessus le canvas il faudrait le percer pour laisser voir
 * la carte ; ici il suffit de mettre la carte devant. Et comme un plan
 * **intercepte les rayons**, tout ce qu'il recouvre devient insensible au
 * doigt sans qu'on ait à désactiver quoi que ce soit.
 */
import { useThree } from '@react-three/fiber'
import { Carte3D } from './Carte3D.tsx'
import { zCamera, hauteurVisibleA } from './Cadrage.tsx'
import { texturePastille } from './texture-carte.ts'
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

type Props = {
  carte: CarteAPeindre | null
  set?: readonly Entree[]
  onFermer?: () => void
  onPeinte?: () => void
}

export function Zoom3D({ carte, set, onFermer, onPeinte }: Props): React.JSX.Element | null {
  const { size } = useThree()
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
  // Trois bornes : le plafond, la hauteur (deux lignes + leurs pastilles),
  // la largeur (quatre côte à côte).
  const uneCarte = Math.min(
    piece * 0.62,
    (H * 0.88) / (lignes * 1.82),
    largeurSet / (colonnes * 1.1),
  )
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
          return (
            <group key={entree.carte.id}>
              <Carte3D
                carte={entree.carte}
                position={[x, y + uneCarte * 0.16, zCarte]}
                rotation={[0, 0, 0]}
                taille={uneCarte}
                ombre={false}
                ressort={14}
                onPeinte={onPeinte}
                onPointerDown={(e) => {
                  e.stopPropagation()
                  onFermer?.()
                }}
              />
              {/* LA PASTILLE SOUS LA CARTE, jamais sur son coin. */}
              <mesh position={[x, y - uneCarte * 0.58, zCarte + 0.02]}>
                <planeGeometry args={[uneCarte * 0.37, uneCarte * 0.185]} />
                <meshBasicMaterial
                  map={texturePastille(entree.nombre)}
                  transparent
                  toneMapped={false}
                />
              </mesh>
            </group>
          )
        })}

      <Carte3D
        carte={carte}
        taille={piece}
        position={[xPiece, 0, zCarte]}
        rotation={[0, 0, 0]}
        ressort={14}
        ombre={false}
        onPeinte={onPeinte}
        onPointerDown={(e) => {
          e.stopPropagation()
          onFermer?.()
        }}
      />
    </group>
  )
}

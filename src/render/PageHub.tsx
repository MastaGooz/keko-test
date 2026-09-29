/**
 * LA PLACE : l'écran où l'on entre dans le jeu, et où vivent les PNJ.
 *
 * Demandé par Keko : « on peut ouvrir le jeu sur un nouvel écran hub où on aura
 * tous les PNJ ? avec en affichage le PNJ de l'armurier, avec en dessous le
 * blason et le texte armurerie, qu'on utilise en placeholder pour voir ce que
 * ça donne si on avait 8 PNJ différents ? »
 *
 * **C'EST UN BANC D'ESSAI DE MISE EN PAGE, PAS DU CONTENU.** Les huit portent
 * le même portrait et la même enseigne : ce qu'on juge ici est la GRILLE — sa
 * densité, la taille d'un visage, la lisibilité d'un nom à huit. *Inventer sept
 * métiers pour en juger la place, ce serait trancher du design en passant.*
 *
 * **DEUX LIGNES DE QUATRE, et c'est une correction de Keko** — « on va mettre
 * ça sur deux lignes parce que là c'est moche ». Une seule rangée de huit était
 * bornée par la LARGEUR : le portrait n'y prenait que 38 % de la hauteur sur un
 * écran de PC, et tout le reste était du vide. *Ce qui est borné par une seule
 * dimension gaspille l'autre.* À deux lignes les deux contraintes se
 * rejoignent, et le visage gagne un tiers.
 *
 * **C'est de la PLACE qu'on descend maintenant**, pas de l'armurerie : celle-ci
 * n'équipe plus que le chargement. Tranché par Keko : « plutôt que mettre le
 * bouton place en haut à gauche de l'armurerie, on va utiliser le bouton
 * descendre qu'on remplace par place, et le bouton descendre va dans le hub ».
 * *Un écran a UN bouton, et il dit ce qu'on fait en le quittant.*
 *
 * **Tout le reste est du HTML.** Il n'y a pas une seule carte sur cet écran,
 * donc rien à faire passer par le canvas — *un nom reste net à toute taille et
 * n'a rien à gagner à devenir une texture.* Seul le bouton y vit, parce que
 * c'est le MÊME objet que celui de l'armurerie et des paliers : le refaire en
 * HTML garantirait qu'un jour les deux divergent.
 */
import { useEffect, useState } from 'react'
import { useThree } from '@react-three/fiber'
import { Bouton3D, tailleBouton } from './Bouton3D.tsx'
import { Z_PLAN, enPixels } from './armurerie-plan.ts'
import { hauteurVisibleA } from './Cadrage.tsx'
import { urlDeLArmurerie, urlDeLArmurier } from '../ui/art.ts'

/**
 * COMBIEN DE PNJ LA PLACE DOIT TENIR, ET SUR COMBIEN DE COLONNES.
 *
 * Ils vivent ici plutôt qu'en dur dans une boucle : *le jour où l'on en
 * ajoutera un neuvième, c'est cette ligne qu'on voudra bouger, et la mise en
 * page suit toute seule* — la largeur d'un portrait s'en déduit.
 */
const PNJ = 8
const COLONNES = 4

/** L'air qu'on laisse au bouton sous la grille, en parts de hauteur d'écran. */
const BANDE_BOUTON = 0.16

/**
 * LA PLACE DU BOUTON, au bas du champ visible et centrée.
 *
 * Elle se calcule depuis `Cadrage` comme tout ce qui vit dans la scène :
 * *toute position qui dépend du cadrage se calcule à partir de lui et n'est
 * jamais une constante.*
 */
function placeDuBouton(hauteurFenetrePx: number): [number, number, number] {
  const champ = hauteurVisibleA(Z_PLAN, hauteurFenetrePx)
  return [0, -champ / 2 + (champ * BANDE_BOUTON) / 2, Z_PLAN]
}

/**
 * LE BOUTON DE LA PLACE — il vit dans le canvas, comme tous les autres.
 *
 * Il s'éteint quand on ne peut pas partir : sans arme, il n'y a rien pour
 * frapper. *Un refus silencieux se lit comme une panne*, donc `BullePlace` en
 * dit la raison juste au-dessus.
 */
export function BoutonDeLaPlace({
  bloque,
  onDescendre,
}: {
  bloque: boolean
  onDescendre: () => void
}): React.JSX.Element {
  const { size } = useThree()
  return (
    <Bouton3D
      texte="Descendre"
      ton="or"
      position={placeDuBouton(size.height)}
      eteint={bloque}
      onCliquer={onDescendre}
    />
  )
}

/**
 * ET LE BOUTON ÉTEINT DIT POURQUOI IL L'EST.
 *
 * Il vit dans la SCÈNE, pas en HTML, donc son rectangle se CALCULE : sa place
 * et sa taille sortent des mêmes fonctions que le bouton lui-même, converties
 * en pixels. *Ce qui doit coïncider se calcule à un seul endroit.*
 *
 * **Le survol n'existe qu'à la souris** — au doigt le `pointerout` n'arrive
 * jamais, donc une tape l'ouvre et elle se referme toute seule.
 */
export function BullePlace({ bloque }: { bloque: boolean }): React.JSX.Element | null {
  const [ouverte, setOuverte] = useState<{ x: number; y: number } | null>(null)

  useEffect(() => {
    if (!bloque) {
      setOuverte(null)
      return
    }
    const viser = (x: number, y: number): { x: number; y: number } | null => {
      const h = window.innerHeight
      const l = window.innerWidth
      const b = tailleBouton('Descendre', 'or', false, Z_PLAN, h)
      const p = placeDuBouton(h)
      const r = enPixels({ x: p[0], y: p[1], l: b.largeur, h: b.hauteur }, h, l)
      const dedans = x >= r.left && x <= r.left + r.width && y >= r.top && y <= r.top + r.height
      return dedans ? { x: r.left + r.width / 2, y: r.top } : null
    }
    const survol = (e: PointerEvent): void => {
      if (e.pointerType !== 'mouse') return
      setOuverte(viser(e.clientX, e.clientY))
    }
    let minuteur = 0
    const tape = (e: PointerEvent): void => {
      if (e.pointerType === 'mouse') return
      const vise = viser(e.clientX, e.clientY)
      window.clearTimeout(minuteur)
      setOuverte((avant) => (vise !== null && avant !== null ? null : vise))
      if (vise !== null) minuteur = window.setTimeout(() => setOuverte(null), 2600)
    }
    window.addEventListener('pointermove', survol)
    window.addEventListener('pointerdown', tape)
    return () => {
      window.clearTimeout(minuteur)
      window.removeEventListener('pointermove', survol)
      window.removeEventListener('pointerdown', tape)
    }
  }, [bloque])

  if (ouverte === null) return null
  return (
    // « AUCUNE ARME ÉQUIPÉE », tranché par Keko. Un CONSTAT plutôt qu'une
    // phrase adressée : la bulle dit l'état du chargement, elle ne s'adresse
    // pas au joueur — c'est la même voix que « Arme » au-dessus d'un slot.
    <p className="arm-bulle dessus" style={{ left: `${ouverte.x}px`, top: `${ouverte.y}px` }}>
      Aucune arme équipée
    </p>
  )
}

export function PageHub({ onEntrer }: { onEntrer: () => void }): React.JSX.Element {
  return (
    <div
      className="hub-page"
      style={{ '--pnj-cols': COLONNES, '--pnj-bande': BANDE_BOUTON } as React.CSSProperties}
    >
      <div className="hub-rue">
        {Array.from({ length: PNJ }, (_, i) => (
          <button key={i} type="button" className="hub-pnj" onClick={onEntrer} aria-label="Armurerie">
            <img className="hub-portrait" src={urlDeLArmurier()} alt="" draggable={false} />
            {/* L'ENSEIGNE : le blason À CÔTÉ du mot, comme dans le bandeau de
                l'armurerie — *une enseigne se lit avec son mot.* Elle porte la
                ferronnerie des cadres, en petit : un filet de laiton et deux
                coins coupés. */}
            <span className="hub-enseigne">
              <img className="hub-blason" src={urlDeLArmurerie()} alt="" draggable={false} />
              <span className="hub-nom">Armurerie</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

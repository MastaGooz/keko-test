/**
 * LE HUB : la place où l'on entre dans le jeu, et où vivent les PNJ.
 *
 * Demandé par Keko : « on peut ouvrir le jeu sur un nouvel écran hub où on aura
 * tous les PNJ ? avec en affichage le PNJ de l'armurier, avec en dessous le
 * blason et le texte armurerie, qu'on utilise en placeholder pour voir ce que
 * ça donne si on avait 8 PNJ différents ? »
 *
 * **C'est un BANC D'ESSAI DE MISE EN PAGE, pas du contenu.** Les huit portent
 * le même portrait et la même enseigne : ce qu'on juge ici est la RANGÉE — sa
 * densité, la taille d'un visage, la lisibilité d'un nom à huit. *Inventer sept
 * métiers pour en juger la place, ce serait trancher du design en passant.*
 *
 * **Une RANGÉE, pas une grille.** Huit portraits en 4 × 2 demanderaient deux
 * fois la hauteur d'un visage, et c'est la hauteur qui manque en paysage — le
 * calcul le dit : sur un téléphone couché, deux rangées mettraient le portrait
 * à 90 px de haut. Une seule rangée en donne 138, et *une rue de boutiques se
 * lit de gauche à droite* : le métier se voit à l'enseigne, pas à la position
 * dans une grille.
 *
 * **Tout est du HTML.** Il n'y a pas une seule carte sur cet écran, donc rien
 * à faire passer par le canvas : *un chiffre et un nom restent nets à toute
 * taille et n'ont rien à gagner à devenir une texture.* C'est déjà la règle
 * des étiquettes de créatures et du chrome de l'armurerie.
 */
import { urlDeLArmurerie, urlDeLArmurier } from '../ui/art.ts'

/**
 * COMBIEN DE PNJ LA PLACE DOIT TENIR — huit, et c'est le chiffre de Keko.
 *
 * Il vit ici plutôt que dans une boucle en dur : *le jour où l'on en ajoutera
 * un neuvième, c'est cette ligne qu'on voudra bouger, et la mise en page suit
 * toute seule* — la largeur d'un portrait s'en déduit.
 */
const PNJ = 8

export function PageHub({ onEntrer }: { onEntrer: () => void }): React.ReactElement {
  return (
    <div className="hub-page" style={{ '--pnj-n': PNJ } as React.CSSProperties}>
      <div className="hub-rue">
        {Array.from({ length: PNJ }, (_, i) => (
          <button
            key={i}
            type="button"
            className="hub-pnj"
            onClick={onEntrer}
            aria-label="Armurerie"
          >
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

/**
 * LA VIE DU JOUEUR — la barre, et l'armure à côté d'elle.
 *
 * Trois pastilles vivaient côte à côte : `90/90`, `⛉ 5`, `−12`. Keko les a
 * réunies autour d'une barre, la même que celle des créatures — *le joueur lit
 * son état avec la même grammaire que celle d'en face.*
 *
 * **LA BARRE PORTE UN CONTOUR BLANC**, et ce n'est pas un ornement : sans lui,
 * une barre à moitié vide ne dit plus quelle est sa taille. Keko : « on ne
 * voit pas la taille max quand on a perdu des PV ». *Une jauge sans cadre ne
 * montre que ce qui reste, jamais ce qu'on a perdu.*
 *
 * **L'ARMURE A QUITTÉ LA BARRE** : elle est à sa droite, dans un bouclier, avec
 * son chiffre. Elle y était un segment bleu collé au rouge, ce qui la faisait
 * lire comme de la vie en réserve — or **c'est une décision qui ne vaut que
 * pour ce tour-ci**, et elle tombe à la fin. Un objet à part le dit ; une
 * portion de la même barre le niait. *Le symbole est un bouclier parce que
 * c'est exactement ce qu'il est* — la raison inverse de celle qui a fait
 * retirer l'écu du coût des cartes, qui lui ne protégeait rien.
 *
 * **La place du bouclier est RÉSERVÉE, qu'il y ait de l'armure ou non** : sinon
 * la barre changerait de longueur en gagnant une Garde, et son remplissage
 * sauterait à l'instant même où l'on veut lire ce qu'on vient de gagner.
 *
 * **CE QU'ON VA PRENDRE EST EN JAUNE, SANS CHIFFRE.** La bande occupe la droite
 * du rouge — c'est par là que la jauge se vide, donc c'est là qu'on cherche ce
 * qu'on va perdre ; posée à gauche elle se lirait comme ce qui reste. Elle a
 * porté son chiffre, Keko l'a retiré : la longueur suffit, et un troisième
 * nombre sur une barre de 130 px en faisait une ligne de comptes. La menace
 * **déduit déjà l'armure**, donc le jaune dit des PV perdus pour de bon :
 * poser une Garde le fait reculer sous les yeux du joueur.
 */

type Props = {
  pv: number
  pvMax: number
  armure: number
  /** Ce que le joueur encaissera vraiment à la fin du tour, armure déduite. */
  menace: number
  /** Le joueur vient d'encaisser : la barre tressaille. */
  encaisse: boolean
}

export function BarreVie3D({ pv, pvMax, armure, menace, encaisse }: Props): React.JSX.Element {
  const echelle = Math.max(pvMax, 1)
  const part = (v: number): string => `${Math.max(0, Math.min(100, (v / echelle) * 100))}%`
  // Le jaune est PLAFONNÉ aux PV restants : au-delà il sortirait du rouge, et
  // l'excès n'apprendrait rien de plus que « c'est mort ».
  const perdus = Math.min(menace, pv)
  // Il se mesure DANS le rouge, pas sur la barre : il en occupe la droite.
  const partDuRouge = pv > 0 ? `${Math.min(100, (perdus / pv) * 100)}%` : '0%'

  return (
    <div className="vie-rangee">
      <div className={`vie-barre${encaisse ? ' encaisse' : ''}`}>
        {/* LES COULEURS SONT DANS UN CONTENANT QUI LES ROGNE, et c'est ce qui
            rend la séparation DROITE : l'arrondi vit sur le contenant seul.
            *Un arrondi sur un segment arrondit ses DEUX bouts, or un seul des
            deux est un bord de la barre.* */}
        <span className="vie-couleurs">
          <span className="vie-rouge" style={{ width: part(pv) }}>
            {perdus > 0 && <span className="vie-jaune" style={{ width: partDuRouge }} />}
          </span>
        </span>

        {/* LE CHIFFRE EST AU-DESSUS, hors du rognage : il DÉBORDE la barre et
            n'a pas à être contenu par elle. La hauteur d'une jauge dit quelque
            chose — une barre épaisse pèse autant qu'une silhouette. */}
        <span className="vie-chiffre">
          {pv}
          <small>/{pvMax}</small>
        </span>
      </div>

      <div className="vie-armure">
        {armure > 0 && (
          <>
            <svg viewBox="0 0 100 104" aria-hidden="true">
              <defs>
                <linearGradient id="armure-acier" x1="0" y1="0" x2="0.4" y2="1">
                  <stop offset="0" stopColor="#6fa3e2" />
                  <stop offset="1" stopColor="#264d80" />
                </linearGradient>
              </defs>
              <path
                d="M50 3 91 16v36c0 25-18 41-41 49C27 93 9 77 9 52V16Z"
                fill="url(#armure-acier)"
                stroke="#cfe2fb"
                strokeWidth="6"
                strokeLinejoin="round"
              />
            </svg>
            <span className="vie-chiffre">{armure}</span>
          </>
        )}
      </div>
    </div>
  )
}

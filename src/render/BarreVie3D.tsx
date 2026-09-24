/**
 * LA BARRE DE VIE DU JOUEUR — les PV, l'armure et ce qui arrive, en un objet.
 *
 * Trois pastilles vivaient côte à côte : `90/90`, `⛉ 5`, `−12`. Keko les a
 * réunies en une barre, la même que celle des créatures — *le joueur lit son
 * état avec la même grammaire que celle d'en face.*
 *
 * **L'ARMURE S'AJOUTE AUX PV SANS ALLONGER LA BARRE.** C'est la demande, et
 * elle décide de l'échelle : la barre vaut `max(pvMax, pv + armure)`, donc
 * gagner de l'armure ne fait pas grandir la jauge — c'est le rouge qui cède la
 * place au bleu. Une barre qui s'allongerait dirait que le joueur a plus de
 * vie qu'il n'en aura jamais, alors que l'armure **tombe à la fin du tour**.
 *
 * **CE QU'ON VA PRENDRE EST EN JAUNE, À DROITE DU ROUGE.** C'est par là que la
 * jauge se vide, donc c'est là qu'on cherche ce qu'on va perdre ; posée à
 * gauche, la bande se lirait comme ce qui reste. Même règle que l'aperçu sur
 * les créatures. Et la menace annoncée **déduit déjà l'armure**
 * (`menaceDuTour`) : le jaune dit donc des PV perdus pour de bon, pas des
 * dégâts bruts — poser une Garde le fait reculer sous les yeux du joueur, ce
 * qui est tout l'intérêt du chiffre.
 *
 * Chaque chiffre est au MILIEU de sa portion, comme sur les créatures : les PV
 * au centre du rouge, l'armure au centre du bleu.
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
  const echelle = Math.max(pvMax, pv + armure, 1)
  const part = (v: number): string => `${Math.max(0, Math.min(100, (v / echelle) * 100))}%`
  /**
   * OÙ POSER UN CHIFFRE : au milieu de sa portion, mais JAMAIS hors de la
   * barre. Sur un téléphone la barre ne fait que 130 px, et le milieu d'une
   * bande jaune collée au bout y tombe si près du bord que le chiffre passait
   * dans le noir. *Un repère qui sort de ce qu'il repère ne repère plus rien.*
   */
  const milieu = (v: number): string => `clamp(1.1rem, ${part(v)}, calc(100% - 1.1rem))`
  // Le jaune est PLAFONNÉ aux PV restants : au-delà il sortirait du rouge, et
  // l'excès n'apprendrait rien de plus que « c'est mort ».
  const perdus = Math.min(menace, pv)
  // Il se mesure DANS le rouge, pas sur la barre : il en occupe la droite.
  const partDuRouge = pv > 0 ? `${Math.min(100, (perdus / pv) * 100)}%` : '0%'

  return (
    <div className={`vie-barre${encaisse ? ' encaisse' : ''}`}>
      {/* LES COULEURS SONT DANS UN CONTENANT QUI LES ROGNE, et c'est ce qui
          rend les séparations DROITES : l'arrondi vit sur le contenant seul,
          les segments n'en ont aucun. Chacun portait le sien, donc chaque
          frontière interne était une double courbe — Keko : « je voudrais que
          les séparations entre barre rouge, jauge et bleu soient droites ».
          *Un arrondi sur un segment arrondit ses DEUX bouts, or un seul des
          deux est un bord de la barre.* */}
      <span className="vie-couleurs">
        <span className="vie-rouge" style={{ width: part(pv) }}>
          {perdus > 0 && <span className="vie-jaune" style={{ width: partDuRouge }} />}
        </span>
        {armure > 0 && (
          <span className="vie-bleu" style={{ left: part(pv), width: part(armure) }} />
        )}
      </span>

      {/* LES CHIFFRES SONT AU-DESSUS, hors du rognage : ils DÉBORDENT la barre
          et n'ont pas à être contenus par elle. La hauteur d'une jauge dit
          quelque chose — une barre épaisse pèse autant qu'une silhouette. */}
      <span className="vie-chiffre" style={{ left: milieu(pv / 2) }}>
        {pv}
        <small>/{pvMax}</small>
      </span>
      {armure > 0 && (
        <span className="vie-chiffre" style={{ left: milieu(pv + armure / 2) }}>
          {armure}
        </span>
      )}

      {/* CE QU'ON VA PRENDRE EST ÉCRIT SUR LA BANDE JAUNE, pas sous la barre.
          Keko : « les dégâts entrants ne devraient pas être affichés sous la
          barre mais plutôt sur la partie jaune ». *Un chiffre posé à côté de
          ce qu'il mesure demande un aller-retour ; posé dessus, la longueur et
          le chiffre disent la même chose au même endroit* — c'est déjà la
          règle des jauges de créature. */}
      {perdus > 0 && (
        <span className="vie-chiffre menace" style={{ left: milieu(pv - perdus / 2) }}>
          −{perdus}
        </span>
      )}
    </div>
  )
}

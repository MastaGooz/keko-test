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
  // Le jaune est PLAFONNÉ aux PV restants : au-delà il sortirait du rouge, et
  // l'excès n'apprendrait rien de plus que « c'est mort ».
  const perdus = Math.min(menace, pv)
  // Il se mesure DANS le rouge, pas sur la barre : il en occupe la droite.
  const partDuRouge = pv > 0 ? `${Math.min(100, (perdus / pv) * 100)}%` : '0%'

  return (
    <div className={`vie-barre${encaisse ? ' encaisse' : ''}`}>
      <span className="vie-rouge" style={{ width: part(pv) }}>
        {perdus > 0 && <span className="vie-jaune" style={{ width: partDuRouge }} />}
        <span className="vie-chiffre">
          {pv}
          <small>/{pvMax}</small>
        </span>
      </span>
      {armure > 0 && (
        <span className="vie-bleu" style={{ left: part(pv), width: part(armure) }}>
          <span className="vie-chiffre">{armure}</span>
        </span>
      )}
    </div>
  )
}

/**
 * LA VIE DU JOUEUR — la barre, et l'armure à côté d'elle.
 *
 * Trois pastilles vivaient côte à côte : `90/90`, `⛉ 5`, `−12`. Keko les a
 * réunies autour d'une barre, la même que celle des créatures — *le joueur lit
 * son état avec la même grammaire que celle d'en face.*
 *
 * **CE N'EST PLUS UN RECTANGLE, ET C'ÉTAIT LE VRAI DÉFAUT.** Keko l'a trouvée
 * « vraiment classique et pas stylisée » deux fois de suite, malgré un
 * sertissage de laiton et un lustre : *une barre horizontale à coins droits EST
 * le vocabulaire par défaut des jeux vidéo*, et aucun habillage ne le défait.
 * C'est la silhouette qu'il fallait changer.
 *
 * Elle est donc taillée dans une **plaque de laiton** : coins coupés en biseau,
 * une **ferrure** à chaque extrémité avec son rivet, et un **creux de pierre**
 * au milieu où coule le rouge. Trois pièces, comme une ferronnerie — là où un
 * rectangle bordé n'en est qu'une.
 *
 * **La plaque vit dans un élément à elle**, parce qu'elle porte le rognage de
 * la silhouette : sur `.vie-barre`, ce rognage emporterait le chiffre, qui doit
 * déborder.
 *
 * **LE CADRE CLAIR RESTE, et c'est sa fonction** : sans lui, une barre à moitié
 * vide ne dit plus quelle est sa taille. Keko : « on ne voit pas la taille max
 * quand on a perdu des PV ». *Une jauge sans cadre ne montre que ce qui reste,
 * jamais ce qu'on a perdu.* C'est désormais la plaque qui le porte.
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
 * **CE QU'ON VA PRENDRE EST EN JAUNE**, à droite du rouge — c'est par là que la
 * jauge se vide, donc c'est là qu'on cherche ce qu'on va perdre ; posée à
 * gauche elle se lirait comme ce qui reste. La menace **déduit déjà
 * l'armure**, donc le jaune dit des PV perdus pour de bon : poser une Garde le
 * fait reculer sous les yeux du joueur.
 *
 * **SON CHIFFRE EST ANCRÉ AU BORD DROIT DE LA BARRE**, pas centré sur la
 * bande. Centré, il suivait une bande qui rétrécit : sur un téléphone il
 * finissait à cheval sur le bord et tombait dans le noir, et il fallait le
 * borner. *Un repère qui doit rester lisible se pose à un endroit FIXE ; c'est
 * la couleur derrière lui qui bouge, pas lui.*
 */
import { useEffect, useRef } from 'react'

type Props = {
  pv: number
  pvMax: number
  armure: number
  /** Ce que le joueur encaissera vraiment à la fin du tour, armure déduite. */
  menace: number
  /** Le joueur vient d'encaisser : la barre tressaille. */
  encaisse: boolean
  /**
   * Un compteur de gardes posées : le bouclier gonfle à chaque incrément.
   *
   * *Un compteur plutôt qu'un instant*, comme les tas : on ne veut pas savoir
   * quand une carte s'y est repliée, seulement qu'il y en a une de plus — et
   * deux gardes de suite doivent relancer le geste sans l'attendre.
   */
  choc?: number
  /**
   * Un compteur de soins reçus : la barre s'illumine de vert à chaque
   * incrément. Même mécanique que `choc`, et pour la même raison — on peut
   * boire deux potions coup sur coup.
   */
  soin?: number
}

export function BarreVie3D({
  pv,
  pvMax,
  armure,
  menace,
  encaisse,
  choc = 0,
  soin = 0,
}: Props): React.JSX.Element {
  const bouclier = useRef<HTMLDivElement>(null)
  const barre = useRef<HTMLDivElement>(null)
  const seve = useRef<HTMLSpanElement>(null)

  /**
   * LE BOUCLIER ENCAISSE LA CARTE QUI S'Y REPLIE.
   *
   * Même mécanique que les tas : **l'API d'animation et non une classe CSS**,
   * parce qu'il faut pouvoir relancer le geste avant qu'il ne soit fini — on
   * peut poser deux gardes coup sur coup.
   */
  useEffect(() => {
    if (choc === 0) return
    const el = bouclier.current
    if (el === null || typeof el.animate !== 'function') return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const jeu = el.animate([{ scale: '1' }, { scale: '1.35', offset: 0.28 }, { scale: '1' }], {
      duration: 260,
      easing: 'ease-out',
    })
    return () => jeu.cancel()
  }, [choc])

  /**
   * LE SOIN SE VOIT SUR LA BARRE, PAS À CÔTÉ D'ELLE.
   *
   * Un voile vert passe SUR le remplissage — donc rogné comme lui — et la
   * plaque s'auréole en même temps. *Le vert seul serait un calque posé sur la
   * barre ; le halo seul serait une lueur sans cause.* Les deux ensemble
   * disent que c'est la barre qui reçoit.
   *
   * Par l'API d'animation, comme les tas et le bouclier : il faut pouvoir
   * relancer le geste avant qu'il soit fini.
   */
  useEffect(() => {
    if (soin === 0) return
    if (typeof document.createElement('div').animate !== 'function') return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const jeux: Animation[] = []
    const v = seve.current
    if (v !== null) {
      jeux.push(
        v.animate([{ opacity: 0 }, { opacity: 0.85, offset: 0.2 }, { opacity: 0 }], {
          duration: 620,
          easing: 'ease-out',
        }),
      )
    }
    const b = barre.current
    if (b !== null) {
      jeux.push(
        b.animate(
          [
            { filter: 'drop-shadow(0 0 0 #7ae6a400)' },
            { filter: 'drop-shadow(0 0 0.5rem #7ae6a4cc)', offset: 0.22 },
            { filter: 'drop-shadow(0 0 0 #7ae6a400)' },
          ],
          { duration: 620, easing: 'ease-out' },
        ),
      )
    }
    return () => {
      for (const j of jeux) j.cancel()
    }
  }, [soin])

  const echelle = Math.max(pvMax, 1)
  const part = (v: number): string => `${Math.max(0, Math.min(100, (v / echelle) * 100))}%`
  // Le jaune est PLAFONNÉ aux PV restants : au-delà il sortirait du rouge, et
  // l'excès n'apprendrait rien de plus que « c'est mort ».
  const perdus = Math.min(menace, pv)
  // Il se mesure DANS le rouge, pas sur la barre : il en occupe la droite.
  const partDuRouge = pv > 0 ? `${Math.min(100, (perdus / pv) * 100)}%` : '0%'

  return (
    <div className="vie-rangee">
      <div className={`vie-barre${encaisse ? ' encaisse' : ''}`} ref={barre}>
        {/* LA PLAQUE DE LAITON, dans un élément à elle.
            Elle porte la SILHOUETTE — des coins coupés, des ferrures aux deux
            bouts — et elle ne peut donc pas être portée par `.vie-barre` : son
            rognage emporterait le chiffre, qui doit déborder. */}
        <span className="vie-plaque" />

        {/* LES COULEURS SONT DANS UN CONTENANT QUI LES ROGNE, et c'est ce qui
            rend la séparation DROITE : l'arrondi vit sur le contenant seul.
            *Un arrondi sur un segment arrondit ses DEUX bouts, or un seul des
            deux est un bord de la barre.* */}
        <span className="vie-couleurs">
          {/* PAS DE CRÊTE AU BOUT DU ROUGE. Elle a existé le temps de deux
              essais, pour marquer le niveau du liquide : d'abord toujours — et
              elle traînait un liseré au bout d'une barre pleine — puis
              seulement à moitié vide, où elle restait « un trait jaune à la
              fin, c'est moche » (Keko). *Le niveau se voit déjà : c'est là où
              la couleur s'arrête.* */}
          <span className="vie-rouge" style={{ width: part(pv) }}>
            {perdus > 0 && <span className="vie-jaune" style={{ width: partDuRouge }} />}
          </span>
          {/* LE VOILE DE SOIN vit DANS le contenant qui rogne : il épouse la
              barre au lieu de la déborder. */}
          <span className="vie-seve" ref={seve} />
        </span>

        {/* LE CHIFFRE EST AU-DESSUS, hors du rognage : il DÉBORDE la barre et
            n'a pas à être contenu par elle. La hauteur d'une jauge dit quelque
            chose — une barre épaisse pèse autant qu'une silhouette. */}
        <span className="vie-chiffre">
          {pv}
          <small>/{pvMax}</small>
        </span>

        {perdus > 0 && <span className="vie-chiffre menace">−{perdus}</span>}
      </div>

      <div className="vie-armure" ref={bouclier}>
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

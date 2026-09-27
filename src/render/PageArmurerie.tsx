/**
 * LE CHROME DE L'ARMURERIE : le titre, les deux cadres, les onglets, la barre
 * de défilement et l'état du chargement.
 *
 * **Les cartes vivent dans le canvas, tout ce qui est écrit vit ici.** Un
 * chiffre reste net à toute taille et n'a rien à gagner à passer par une
 * texture — c'est déjà la règle des étiquettes de créatures.
 *
 * **Tout se place depuis `armurerie-plan.ts`**, le même calcul que la scène :
 * s'ils se plaçaient chacun de leur côté, le cadre ne tomberait plus autour de
 * sa grille au premier réglage.
 *
 * **La page est un BANDEAU, DEUX PANNEAUX, UN PIED.** Elle avait deux colonnes
 * collées aux bords et un vide au milieu — Keko : « c'est moche ». Et le
 * bandeau du haut ne dit plus que le lieu : le chargement, le deck et l'or en
 * sont partis, *ce qu'on lit sans décider dessus n'a rien à faire en tête de
 * page.*
 *
 * **CE QUI TOUCHE LE POINTEUR EST NOMMÉ, LE RESTE EST TRANSPARENT.** Les cadres
 * couvrent la moitié de l'écran : en `pointer-events: auto`, ils empêcheraient
 * de prendre une carte. Seuls les onglets et le pouce de la barre répondent.
 */
import { useEffect, useRef, useState } from 'react'
import type { Onglet } from './armurerie-plan.ts'
import {
  NOM_ONGLET,
  ONGLETS,
  contenuDuCoffre,
  enPixels,
  pixelsParUnite,
  planArmurerie,
} from './armurerie-plan.ts'
import { compteDuDeck } from './Armurerie3D.tsx'
import { Tas3D } from './Tas3D.tsx'
import { Orbe3D } from './Orbe3D.tsx'
import type { Hub } from '../logic/hub.ts'
import { deuxMains, peutDescendre } from '../logic/hub.ts'
import { Z_PLAN } from './armurerie-plan.ts'
import { tailleBouton } from './Bouton3D.tsx'

/**
 * Ce qu'une infobulle a besoin de savoir : son texte, son point d'ancrage, et
 * de quel côté elle s'ouvre. `cle` sert à la refermer d'une seconde tape.
 */
type Bulle = {
  cle: string
  texte: string
  x: number
  y: number
  place: 'gauche' | 'dessus'
}

/** La taille de la fenêtre, suivie pour replacer les cadres au redimensionnement. */
function useFenetre(): { l: number; h: number } {
  const [f, setF] = useState(() => ({ l: window.innerWidth, h: window.innerHeight }))
  useEffect(() => {
    const suivre = (): void => setF({ l: window.innerWidth, h: window.innerHeight })
    window.addEventListener('resize', suivre)
    window.addEventListener('orientationchange', suivre)
    return () => {
      window.removeEventListener('resize', suivre)
      window.removeEventListener('orientationchange', suivre)
    }
  }, [])
  return f
}

type Props = {
  hub: Hub
  onglet: Onglet
  onOnglet: (o: Onglet) => void
  defilement: number
  onDefilement: (n: number) => void
  pvMax: number
  energieMax: number
  tailleMain: number
  /**
   * Une carte est ouverte en grand : les commandes s'effacent.
   *
   * *Le zoom doit être au-dessus de TOUT* — son voile vit dans le canvas, et
   * les onglets comme la barre sont un calque par-dessus lui. Les laisser
   * visibles, c'est laisser des boutons flotter sur une carte qu'on regarde,
   * et pire : cliquables. Keko : « certains éléments de l'UI passent devant ».
   */
  zoomee?: boolean
}

export function PageArmurerie({
  hub,
  onglet,
  onOnglet,
  defilement,
  onDefilement,
  pvMax,
  energieMax,
  tailleMain,
  zoomee = false,
}: Props): React.JSX.Element {
  const fenetre = useFenetre()
  const plan = planArmurerie(fenetre.h, fenetre.l, deuxMains(hub.chargement))
  const boite = (r: Parameters<typeof enPixels>[0]): React.CSSProperties => {
    const p = enPixels(r, fenetre.h, fenetre.l)
    return { left: `${p.left}px`, top: `${p.top}px`, width: `${p.width}px`, height: `${p.height}px` }
  }
  /**
   * LA PLAQUE DU MEUBLE EST UN FRÈRE DU CADRE, PAS SON ENFANT.
   *
   * Le cadre a les coins coupés (`clip-path`), et *un rognage emporte tout ce
   * qu'il contient* : la plaque, posée à cheval sur le bord haut, s'y coupait
   * en deux. Même famille que le chiffre de la barre de vie, qui doit vivre
   * hors du contenant qui rogne les couleurs.
   */
  const plaque = (r: Parameters<typeof enPixels>[0]): React.CSSProperties => {
    const p = enPixels(r, fenetre.h, fenetre.l)
    return { left: `${p.left + p.width / 2}px`, top: `${p.top}px` }
  }

  const contenu = contenuDuCoffre(hub, onglet)
  const total = contenu.pieces.length + contenu.tresors.length
  const lignesTotal = Math.max(plan.lignes, Math.ceil(total / plan.colonnes))
  const maxDefilement = Math.max(0, lignesTotal - plan.lignes)

  // ON NE RESTE JAMAIS SOUS LE FOND DU COFFRE : changer d'onglet ou rétrécir la
  // fenêtre réduit le nombre de lignes, et un défilement gardé tel quel
  // montrerait une grille vide sans qu'on comprenne pourquoi.
  useEffect(() => {
    if (defilement > maxDefilement) onDefilement(maxDefilement)
  }, [defilement, maxDefilement, onDefilement, plan.pasY, fenetre.h])

  /**
   * LA MOLETTE SE POSE SUR LA FENÊTRE, PAS SUR LE CADRE.
   *
   * Le cadre est en `pointer-events: none` — sinon il volerait le doigt aux
   * cartes qu'il encadre — donc il ne reçoit aucun évènement. On écoute donc
   * partout, et on n'agit que si le pointeur est DANS le coffre.
   */
  const cadreCoffre = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const rouler = (e: WheelEvent): void => {
      const r = cadreCoffre.current?.getBoundingClientRect()
      if (r === undefined) return
      if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) {
        return
      }
      // EN CONTINU, PAS PAR LIGNES : on convertit les pixels de la molette en
      // lignes. Un cran ordinaire (~100 px) avance d'un peu plus d'une
      // demi-rangée, donc le coffre glisse au lieu de sauter.
      const lignePx = plan.pasY * pixelsParUnite(fenetre.h)
      const pas = lignePx > 0 ? e.deltaY / lignePx : 0
      onDefilement(Math.max(0, Math.min(maxDefilement, defilement + pas)))
    }
    window.addEventListener('wheel', rouler, { passive: true })
    return () => window.removeEventListener('wheel', rouler)
  }, [defilement, maxDefilement, onDefilement])

  /**
   * CE QUE DIT CHAQUE STAT, en une infobulle. Demandé par Keko : « quand la
   * souris survole une stat — ou qu'on tape dessus sur téléphone — une petite
   * bulle explique la stat ».
   *
   * *Un chiffre à côté d'un symbole se devine, il ne se lit pas* : un coeur
   * pour la vie, soit, mais un paquet vaut aussi bien « cartes du deck » que
   * « cartes en pioche ». La bulle le dit en trois mots, sans encombrer un
   * rail qui doit rester quatre lignes.
   *
   * **LE RAIL NE CAPTE PAS LE POINTEUR, et il ne doit pas** : il vit sous le
   * canvas, dans le calque du fond, pour qu'une carte promenée passe DEVANT
   * lui. On écoute donc la fenêtre et on compare la position aux rectangles
   * des lignes — exactement ce que fait déjà la molette du coffre, et pour la
   * même raison.
   */
  const LIBELLES = ['Points de vie', 'Cartes dans le deck', 'Taille de la main', "Points d'action"]
  const mesures = useRef<(HTMLSpanElement | null)[]>([])
  const [bulle, setBulle] = useState<Bulle | null>(null)

  /**
   * ET LE BOUTON GRISÉ DIT POURQUOI IL L'EST.
   *
   * Sans arme, on ne peut pas descendre : le bouton s'éteint, et *un refus
   * muet se lit comme une panne* — c'est la règle qui l'avait fait griser, et
   * elle demande son deuxième temps. Keko : « pour que le joueur sache
   * pourquoi il peut pas cliquer ».
   *
   * Il vit dans la SCÈNE, pas en HTML, donc son rectangle se calcule : sa
   * place vient du plan, sa taille de `tailleBouton` — les deux en unités de
   * scène, converties en pixels comme tout le chrome. *Ce qui doit coïncider
   * se calcule à un seul endroit*, et ici c'est le plan.
   */
  const bloque = !peutDescendre(hub.chargement)
  const rectBouton = (): { left: number; right: number; top: number; bottom: number } => {
    const b = tailleBouton('Descendre', 'or', false, Z_PLAN, fenetre.h)
    const p = enPixels(
      { x: plan.bouton[0], y: plan.bouton[1], l: b.largeur, h: b.hauteur },
      fenetre.h,
      fenetre.l,
    )
    return { left: p.left, right: p.left + p.width, top: p.top, bottom: p.top + p.height }
  }

  useEffect(() => {
    const viser = (x: number, y: number): Bulle | null => {
      for (const [i, el] of mesures.current.entries()) {
        if (el === null) continue
        const r = el.getBoundingClientRect()
        if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) {
          // LA BULLE SE POSE SUR LE CONTENU, PAS SUR LA LIGNE. La ligne prend
          // toute la largeur de la colonne alors que son couple chiffre +
          // symbole s'y CENTRE : accrochée à son bord gauche, la bulle
          // s'ouvrait très loin de ce qu'elle explique — Keko l'a vu sur
          // téléphone, où la colonne est proportionnellement plus large.
          // *Une bulle désigne ce qu'on regarde, pas la boîte qui le contient.*
          const bords = [...el.children].map((c) => c.getBoundingClientRect().left)
          return {
            cle: `stat-${i}`,
            texte: LIBELLES[i] ?? '',
            x: bords.length > 0 ? Math.min(...bords) : r.left,
            y: r.top + r.height / 2,
            place: 'gauche',
          }
        }
      }
      // LE BOUTON N'A SA BULLE QUE QUAND IL REFUSE : *une explication qui
      // s'affiche aussi quand tout va bien n'explique plus rien.*
      if (bloque) {
        const b = rectBouton()
        if (x >= b.left && x <= b.right && y >= b.top && y <= b.bottom) {
          return {
            cle: 'bouton',
            texte: "Tu n'as pas d'arme équipée",
            x: (b.left + b.right) / 2,
            y: b.top,
            place: 'dessus',
          }
        }
      }
      return null
    }
    // LE SURVOL N'EXISTE QU'À LA SOURIS. Au doigt, le `pointerover` part au
    // toucher et le `pointerout` n'arrive jamais : la bulle resterait ouverte.
    // C'est la règle déjà écrite pour les cartes de la main.
    const survol = (e: PointerEvent): void => {
      if (e.pointerType !== 'mouse') return
      setBulle(viser(e.clientX, e.clientY))
    }
    let minuteur = 0
    const tape = (e: PointerEvent): void => {
      if (e.pointerType === 'mouse') return
      const vise = viser(e.clientX, e.clientY)
      window.clearTimeout(minuteur)
      setBulle((avant) => (vise !== null && avant?.cle === vise.cle ? null : vise))
      // Au doigt il n'y a pas de « sortie » : la bulle se referme toute seule,
      // sinon elle reste posée sur l'écran jusqu'au prochain geste.
      if (vise !== null) minuteur = window.setTimeout(() => setBulle(null), 2600)
    }
    window.addEventListener('pointermove', survol)
    window.addEventListener('pointerdown', tape)
    return () => {
      window.clearTimeout(minuteur)
      window.removeEventListener('pointermove', survol)
      window.removeEventListener('pointerdown', tape)
    }
    // Le rectangle du bouton se relit à chaque geste, donc il suit la fenêtre
    // tout seul ; seul l'état « bloqué » doit relancer l'écoute.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bloque])

  /** Le pouce se traîne : sa place dans la piste dit la ligne du haut. */
  const piste = useRef<HTMLDivElement>(null)
  const glisserPouce = (e: React.PointerEvent): void => {
    e.preventDefault()
    const suivre = (ev: PointerEvent): void => {
      const r = piste.current?.getBoundingClientRect()
      if (r === undefined || r.height === 0) return
      // Le pouce suit le doigt SANS s'arrêter aux lignes : c'est la même
      // grandeur continue que la molette.
      const part = (ev.clientY - r.top) / r.height
      onDefilement(Math.max(0, Math.min(maxDefilement, part * lignesTotal)))
    }
    const finir = (): void => {
      window.removeEventListener('pointermove', suivre)
      window.removeEventListener('pointerup', finir)
    }
    window.addEventListener('pointermove', suivre)
    window.addEventListener('pointerup', finir)
    suivre(e.nativeEvent)
  }

  const deck = compteDuDeck(hub)

  /**
   * DEUX CALQUES, ET C'EST LE CANVAS QUI PASSE ENTRE EUX.
   *
   * Les cadres sont OPAQUES — l'armurerie est un lieu, son fond l'est aussi —
   * donc ils doivent passer **sous** le canvas, sinon ils masquent les cartes
   * qu'ils sont censés encadrer. Les onglets et la barre, eux, doivent
   * répondre au doigt, donc **au-dessus**.
   *
   * *Un `z-index` sur un parent enferme ses enfants* : les deux calques sont
   * donc des frères, pas un parent et son enfant — le même piège que le bouton
   * de fin de tour enfermé dans `.jeu-3d`.
   */
  return (
    <>
      <div className="arm-fond">
      <p className="arm-titre" style={boite(plan.titre)}>
        Armurerie
      </p>

      <div className="arm-cadre" style={boite(plan.coffre)} ref={cadreCoffre} />
      <span className="arm-nom" style={plaque(plan.coffre)}>
        Coffre
      </span>

      <div className="arm-cadre" style={boite(plan.equipement)} />
      <span className="arm-nom" style={plaque(plan.equipement)}>
        Équipement
      </span>

      {/* LES NOMS DE GROUPE, AU-DESSUS DES SLOTS QU'ILS NOMMENT. Keko : « il
          faudrait que le nom soit au-dessus des slots, "Armes" au-dessus des
          deux slots, armure et consommable au-dessus du bloc des
          consommables ».

          Le mot vivait DANS la case vide, un par slot. *Rien ne nommait la
          pile* — une case vide muette ne dit pas ce qu'elle attend — et deux
          cases voisines ne l'écrivaient pas à la même taille. **Un nom posé
          sur un GROUPE le dit une fois pour deux slots, et il le dit encore
          quand les cases sont pleines.** */}
      <p className="arm-groupe" style={boite(plan.nomArmes)}>
        {deuxMains(hub.chargement) ? 'Arme' : 'Armes'}
      </p>
      <p className="arm-groupe" style={boite(plan.nomArmure)}>
        Armure
      </p>
      {/* « OBJETS », le nom de la catégorie du coffre — et celui que porte
          désormais le pied des cartes. *Une même famille ne peut pas s'appeler
          de trois façons selon l'endroit où on la regarde* : l'onglet disait
          Objets, le groupe Consommables, la carte Consommable. Demandé par
          Keko. Le mot est aussi le plus court, ce qui ne gâte rien sur un
          téléphone. */}
      <p className="arm-groupe" style={boite(plan.nomObjets)}>
        Objets
      </p>

      {/* L'ÉTAT DE CE QU'ON EMPORTE, en bas à droite : le deck, la vie,
          l'énergie et la main. Demandé par Keko — *avant de descendre, le
          joueur doit voir avec quoi il descend*, et ces quatre chiffres le
          disent sans qu'il ait à ouvrir quoi que ce soit.

          Ce sont les MÊMES objets qu'en combat — le paquet de pioche, l'orbe —
          parce que c'est là qu'il les retrouvera. */}
      {/* CHAQUE COUPLE EST UN CARTOUCHE, et le chiffre y vient AVANT son
          symbole. Keko : « le chiffre d'abord, puis l'icône — et un moyen de
          bien voir que tel chiffre correspond à tel icône ».

          *Quatre chiffres et quatre symboles alignés ne disent pas lesquels
          vont ensemble* : l'oeil les apparie par la proximité, et une rangée
          régulière n'en a aucune. Un fond commun le dit sans un mot — et ce
          n'est pas une décoration : c'est la seule chose qui les relie.

          L'énergie n'en a pas besoin de la même façon : son chiffre est DANS
          son symbole. Elle garde le cartouche pour rester de la famille. */}
      {/* L'ORDRE EST CELUI DE KEKO : vie, deck, main, énergie. Il va du plus
          durable au plus volatil — les PV traversent la descente, le deck la
          run, la main le tour, l'énergie ne survit pas au tour. */}
      <div className="arm-etat" style={boite(plan.stats)}>
        <span className="arm-mesure" ref={(el) => void (mesures.current[0] = el)}>
          <span className="arm-chiffre">{pvMax}</span>
          <CoeurIcone />
        </span>
        {/* LE COMPTE DU DECK EST À GAUCHE DU PAQUET, demandé par Keko. Au-dessus
            — sa place en combat — il se lisait comme une étiquette du tas ;
            ici c'est une MESURE de ce qu'on emporte, elle s'aligne avec les
            trois autres. */}
        <span className="arm-mesure" ref={(el) => void (mesures.current[1] = el)}>
          <span className="arm-chiffre">{deck.total}</span>
          <span className="arm-tas">
            <Tas3D nom="pioche" compte={deck.total} />
          </span>
        </span>
        <span className="arm-mesure" ref={(el) => void (mesures.current[2] = el)}>
          <span className="arm-chiffre">{tailleMain}</span>
          <MainIcone />
        </span>
        <span className="arm-mesure arm-orbe" ref={(el) => void (mesures.current[3] = el)}>
          <Orbe3D courant={energieMax} max={energieMax} seul />
        </span>
      </div>

      </div>

      <div className="arm-commandes" style={zoomee ? { display: 'none' } : undefined}>
      {/* LA BULLE VIT AU-DESSUS DU CANVAS, et il le faut : posée dans le calque
          du fond, elle passait DERRIÈRE les cartes de l'équipement — on n'en
          lisait que la moitié qui dépassait. Elle ne capte pas le pointeur,
          donc elle ne prend rien à personne.

          Elle s'ouvre À GAUCHE de sa ligne : le rail tient le bord droit de
          l'écran, et une bulle qui partirait vers la droite en sortirait. Et
          elle est posée au pixel où vit la ligne, jamais dans son flux — la
          ligne est un `flex` serré, y ajouter un enfant la déformerait. */}
      {bulle !== null && (
        <span
          className={`arm-bulle${bulle.place === 'dessus' ? ' dessus' : ''}`}
          style={{ left: `${bulle.x}px`, top: `${bulle.y}px` }}
        >
          {bulle.texte}
        </span>
      )}
      {/* LES ONGLETS : ce qu'on possède se range par nature, et les TRÉSORS y
          ont leur case bien qu'aucun slot ne les prenne. *Le coffre est ce
          qu'on possède, pas ce qu'on peut porter.* */}
      <div className="arm-onglets" style={boite(plan.onglets)}>
        {ONGLETS.map((o) => (
          <button
            key={o}
            type="button"
            className={`arm-onglet${o === onglet ? ' actif' : ''}`}
            onClick={() => onOnglet(o)}
          >
            {NOM_ONGLET[o]}
          </button>
        ))}
      </div>

      {/* LA BARRE DE DÉFILEMENT reste visible même quand tout tient : c'est un
          bord du coffre autant qu'une commande, et *un rail qui apparaît et
          disparaît fait sauter la grille d'une colonne.* */}
      <div className="arm-piste" style={boite(plan.barre)} ref={piste}>
        <span
          className={`arm-pouce${maxDefilement === 0 ? ' plein' : ''}`}
          style={{
            top: `${(defilement / lignesTotal) * 100}%`,
            height: `${(plan.lignes / lignesTotal) * 100}%`,
          }}
          onPointerDown={glisserPouce}
        />
      </div>

      </div>
    </>
  )
}

/**
 * LE COEUR : la vie, en symbole plutôt qu'en jauge.
 *
 * Keko : « on peut mettre un coeur à la place de la barre ? » *Et il a raison
 * pour une raison de fond* : une jauge dit un ÉTAT — ce qu'il reste sur ce
 * qu'on avait — et à l'armurerie il n'y a pas d'état, rien n'a été perdu. Une
 * barre toujours pleine ne mesure rien ; **le coeur dit une réserve**, comme
 * le paquet dit un nombre de cartes et l'orbe une quantité d'énergie.
 *
 * *Les quatre mesures deviennent donc quatre symboles et quatre chiffres*, ce
 * qui est exactement la rangée qu'on cherchait.
 */
function CoeurIcone(): React.JSX.Element {
  return (
    <svg className="arm-icone" viewBox="0 0 40 37" aria-hidden="true">
      <defs>
        <linearGradient id="arm-coeur" x1="0" y1="0" x2="0.3" y2="1">
          <stop offset="0" stopColor="#e2565e" />
          <stop offset="0.6" stopColor="#9d2330" />
          <stop offset="1" stopColor="#5d121b" />
        </linearGradient>
      </defs>
      <path
        d="M20 34.5C20 34.5 2.8 22.6 2.8 12.6 2.8 6.6 7.4 2 13.2 2 16.6 2 19 4.1 20 6.3 21 4.1 23.4 2 26.8 2 32.6 2 37.2 6.6 37.2 12.6 37.2 22.6 20 34.5 20 34.5Z"
        fill="url(#arm-coeur)"
        stroke="#2a1013"
        strokeWidth={2}
        strokeLinejoin="round"
      />
      {/* La lumiere vient du haut, comme partout : un reflet sur le lobe
          gauche, et rien d'autre. */}
      <path
        d="M9.5 9.5C10.6 7.4 12.6 6.2 14.6 6.4"
        fill="none"
        stroke="#ffffffaa"
        strokeWidth={2}
        strokeLinecap="round"
      />
    </svg>
  )
}

/**
 * L'ÉVENTAIL : trois cartes tenues, pour dire la taille de la main.
 *
 * Le paquet de pioche dit déjà « des cartes » ; il fallait donc une figure qui
 * dise « en main » et pas « en tas ». *Trois cartes qui s'ouvrent, c'est le
 * seul geste que le joueur fait avec les siennes.*
 */
function MainIcone(): React.JSX.Element {
  return (
    <svg className="arm-icone" viewBox="0 0 40 34" aria-hidden="true">
      {[-22, 0, 22].map((angle, i) => (
        <rect
          key={angle}
          x={13.5}
          y={5}
          width={13}
          height={20}
          rx={2}
          transform={`rotate(${angle} 20 30)`}
          fill={i === 1 ? '#f0d9a2' : '#c8ab6d'}
          stroke="#2a2118"
          strokeWidth={1.5}
        />
      ))}
    </svg>
  )
}

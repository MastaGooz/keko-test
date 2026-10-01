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
import { SON_POSER, jouerSon } from './sons.ts'
import { tailleBouton } from './Bouton3D.tsx'
import { Z_PLAN } from './armurerie-plan.ts'
import { urlDeLArmurier, urlDuSymbole } from '../ui/art.ts'
import type { LieuHub } from './destinations.ts'
import { DESTINATIONS } from './destinations.ts'

/**
 * Ce qu'une infobulle a besoin de savoir : son texte, son point d'ancrage, et
 * de quel côté elle s'ouvre. `cle` sert à la refermer d'une seconde tape.
 */
type Bulle = {
  cle: string
  texte: string
  x: number
  y: number
  /**
   * D'où elle s'ouvre. `coin` est `dessus` par le BORD GAUCHE au lieu du
   * milieu : *une bulle se centre quand elle a de la place des deux côtés*, et
   * le bouton de rangement tient le coin haut-gauche du meuble — centrée, elle
   * sortirait de l'écran par la gauche sur un téléphone (mesuré : 32 px
   * dehors).
   */
  place: 'gauche' | 'dessus' | 'coin'
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
  /** Ranger le coffre : par catégorie, puis par rareté. */
  onTrier?: () => void
  onOnglet: (o: Onglet) => void
  defilement: number
  onDefilement: (n: number) => void
  pvMax: number
  energieMax: number
  tailleMain: number
  /**
   * COMBIEN DE FOIS ON A ÉQUIPÉ depuis l'ouverture de l'écran.
   *
   * Ce n'est pas une mesure, c'est un JETON : quand il change, les stats qui
   * ont bougé se signalent. *Un déséquipement ne l'incrémente pas* — Keko veut
   * l'effet quand on met, pas quand on retire.
   */
  equipements: number
  /**
   * Et combien s'y sont POSÉES. C'est lui qui joue l'effet : `equipements`
   * marque le lâcher — donc l'instant où l'on fige ce que les stats valaient —
   * et celui-ci l'arrivée.
   */
  fixations: number
  /**
   * Une carte est ouverte en grand : les commandes s'effacent.
   *
   * *Le zoom doit être au-dessus de TOUT* — son voile vit dans le canvas, et
   * les onglets comme la barre sont un calque par-dessus lui. Les laisser
   * visibles, c'est laisser des boutons flotter sur une carte qu'on regarde,
   * et pire : cliquables. Keko : « certains éléments de l'UI passent devant ».
   */
  zoomee?: boolean
  /** Consulter le deck que le chargement produit. */
  onVoirDeck?: () => void
  /** Le lieu ouvert, et de quoi en changer : le rail EST le hub. */
  lieu: LieuHub
  onLieu: (lieu: LieuHub) => void
}

export function PageArmurerie({
  hub,
  onglet,
  onTrier,
  onOnglet,
  defilement,
  onDefilement,
  pvMax,
  energieMax,
  tailleMain,
  equipements,
  fixations,
  zoomee = false,
  onVoirDeck,
  lieu,
  onLieu,
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
  const total = contenu.length
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
  // HTMLElement et non HTMLSpanElement : le deck est un BOUTON depuis qu'il
  // porte son symbole.
  const mesures = useRef<(HTMLElement | null)[]>([])
  /**
   * LE BOUTON DE RANGEMENT A NOTRE BULLE, PLUS CELLE DU NAVIGATEUR.
   *
   * Il portait un `title` : le navigateur l'affichait DESSOUS, à sa façon, avec
   * ses coins arrondis et sa police système. Keko : « l'infobulle de ranger le
   * coffre devrait être au-dessus, pas en dessous, et exactement dans le même
   * style que les infobulles des stats ».
   *
   * *Un `title` n'est pas une infobulle, c'est une infobulle du navigateur* —
   * on n'en règle ni la place, ni le délai, ni le dessin. Le seul moyen d'avoir
   * la nôtre est de ne pas lui laisser la sienne.
   *
   * `aria-label` RESTE : c'est lui qui nomme le bouton pour un lecteur
   * d'écran, et il ne dessine rien.
   */
  const tri = useRef<HTMLButtonElement | null>(null)
  /** Le couple chiffre + symbole de chaque mesure : c'est LUI qui s'anime. */
  const vifs = useRef<(HTMLSpanElement | null)[]>([])

  /**
   * UNE STAT QUI CHANGE EN ÉQUIPANT SE SIGNALE.
   *
   * Elle enfle et s'illumine d'un coup, puis retombe — le contraste de vitesse
   * du gonflement des tas : *un effet symétrique se lit comme une respiration,
   * pas comme un choc.*
   *
   * **C'est le COUPLE qui s'anime, pas la ligne.** Le filet qui sépare deux
   * mesures appartient à la seconde : scaler la ligne l'aurait fait grandir
   * avec elle, et *un séparateur qui bouge n'est plus une frontière.*
   *
   * **Par l'API d'animation, pas par une classe** : deux pièces équipées coup
   * sur coup doivent relancer le geste avant qu'il soit fini — la règle déjà
   * tenue par les tas.
   */
  const deck = compteDuDeck(hub)
  // LE DECK VIDE LE DIT LUI-MÊME. Demandé par Keko : la bulle d'un bouton qui
  // refuse doit dire POURQUOI il refuse — *un refus muet se lit comme une
  // panne*, la règle de « Descendre » sans arme.
  const deckVide = (deck.total ?? 0) === 0
  const LIBELLES = [
    'Points de vie',
    deckVide ? 'Deck vide' : 'Voir le deck',
    'Taille de la main',
    "Points d'action",
  ]
  /**
   * **LES LIBELLÉS PASSENT PAR UNE RÉF, sinon l'écouteur en garde une version
   * périmée.** Keko : « quand le deck est vide et que je tape, ça met "voir le
   * deck" au lieu de "deck vide" ».
   *
   * L'écoute est posée une fois pour toutes sur la FENÊTRE — elle ne dépend que
   * de l'état « bloqué » — donc sa fermeture capture le tableau du rendu où
   * elle a été installée. *C'est la famille du geste dont les écouteurs se
   * retirent par référence* : **un écouteur qui survit aux rendus ne doit lire
   * l'état que par une réf.**
   */
  const libelles = useRef(LIBELLES)
  libelles.current = LIBELLES
  const valeurs = [pvMax, deck.total, tailleMain, energieMax]
  const avant = useRef(valeurs)
  /**
   * CE QU'ON MONTRE TANT QUE LA CARTE N'EST PAS POSÉE.
   *
   * **Le chiffre attend l'arrivée, lui aussi.** Keko : « le chiffre doit lui
   * aussi changer au moment où la carte se fixe ». L'état du jeu bouge dès le
   * lâcher, donc la stat sautait à sa nouvelle valeur pendant que la carte
   * tournait encore — *on voyait la conséquence avant la cause*, exactement ce
   * que le combat évite déjà en faisant monter l'armure à l'impact et non à la
   * tape.
   *
   * **ÇA SE DÉCIDE PENDANT LE RENDU, JAMAIS DANS UN EFFET**, et ça a coûté un
   * aller-retour : figé par un état posé dans un effet, l'ancien chiffre ne
   * revenait qu'APRÈS un premier rendu montrant le nouveau — Keko : « on voit
   * le chiffre changer au moment où on lâche, puis revenir comme avant, pour
   * enfin changer quand la carte se fixe ». *Un effet arrive toujours trop
   * tard pour cacher ce que le rendu vient de montrer.*
   *
   * Deux compteurs suffisent : tant qu'il en est parti plus qu'il n'en est
   * arrivé, une carte est en vol, et la bande garde ce qu'elle avait.
   */
  const enVol = equipements > fixations
  const changees = useRef<boolean[]>([])
  if (!enVol) {
    // Ce qui a bougé depuis la dernière fois que rien ne volait : c'est ce que
    // l'effet animera à l'arrivée.
    changees.current = valeurs.map((v, i) => v !== avant.current[i])
    avant.current = valeurs
  }
  const montrees = enVol ? avant.current : valeurs

  useEffect(() => {
    if (fixations === 0) return
    changees.current.forEach((aBouge, i) => {
      if (!aBouge) return
      vifs.current[i]?.animate(
        [
          { scale: '1', filter: 'brightness(1) drop-shadow(0 0 0 #e8ac5400)' },
          {
            scale: '1.26',
            filter: 'brightness(1.9) drop-shadow(0 0 0.7rem #e8ac54cc)',
            offset: 0.28,
          },
          { scale: '1', filter: 'brightness(1) drop-shadow(0 0 0 #e8ac5400)' },
        ],
        { duration: 560, easing: 'ease-out' },
      )
    })
  }, [fixations])

  const pvVu = montrees[0] ?? pvMax
  const deckVu = montrees[1] ?? deck.total
  const mainVu = montrees[2] ?? tailleMain
  const paVu = montrees[3] ?? energieMax

  const [bulle, setBulle] = useState<Bulle | null>(null)

  /**
   * ET LE BOUTON ÉTEINT DIT POURQUOI IL L'EST.
   *
   * Sans arme, on ne peut pas descendre : *un refus muet se lit comme une
   * panne*. Le bouton vit dans la SCÈNE, donc son rectangle se calcule — sa
   * place vient du plan, sa taille de `tailleBouton`. *Ce qui doit coïncider
   * se calcule à un seul endroit*, et ici c'est le plan.
   */
  const bloque = !peutDescendre(hub.chargement)
  const rectBouton = (): { left: number; right: number; top: number; bottom: number } => {
    const b = tailleBouton('Descendre', 'or', 'rail', Z_PLAN, fenetre.h)
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
          // LA BULLE SE POSE SUR LE CONTENU, PAS SUR LA LIGNE, et AU-DESSUS.
          // Elle s'ouvrait à gauche du temps où les mesures étaient une
          // colonne ; en bande, la gauche d'une mesure est la mesure d'à côté
          // — Keko : « on devrait mettre les infobulles des stats au-dessus
          // d'elles plutôt qu'à gauche ». *Une bulle s'ouvre du côté où il y a
          // de la place, et ce côté change avec la disposition.*
          //
          // Elle se centre sur le COUPLE chiffre + symbole, pas sur la ligne :
          // celle-ci s'étire à part égale dans la bande, le couple s'y centre.
          const boites = [...el.children].map((c) => c.getBoundingClientRect())
          const gauche = boites.length > 0 ? Math.min(...boites.map((b) => b.left)) : r.left
          const droite = boites.length > 0 ? Math.max(...boites.map((b) => b.right)) : r.right
          return {
            cle: `stat-${i}`,
            texte: libelles.current[i] ?? '',
            x: (gauche + droite) / 2,
            y: r.top,
            place: 'dessus',
          }
        }
      }
      // LE BOUTON N'A SA BULLE QUE QUAND IL REFUSE : *une explication qui
      // s'affiche aussi quand tout va bien n'explique plus rien.*
      if (bloque) {
        const b = rectBouton()
        if (x >= b.left && x <= b.right && y >= b.top && y <= b.bottom) {
          // « AUCUNE ARME ÉQUIPÉE », tranché par Keko. Un CONSTAT plutôt
          // qu'une phrase adressée : la bulle dit l'état du chargement.
          return {
            cle: 'bouton',
            texte: 'Aucune arme équipée',
            x: (b.left + b.right) / 2,
            y: b.top,
            place: 'dessus',
          }
        }
      }
      const t = tri.current
      if (t !== null) {
        const r = t.getBoundingClientRect()
        if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) {
          // AU-DESSUS, comme celles des stats : le bouton tient le coin
          // haut-gauche du meuble, donc il a de la place au-dessus de lui et
          // presque rien à sa gauche.
          return { cle: 'tri', texte: 'Ranger le coffre', x: r.left, y: r.top, place: 'coin' }
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
      {/* LA LARGEUR DE LA BANDE DES ONGLETS VIT SUR LE LIEU, pas sur elle seule :
          les noms de groupe de l'équipement partagent leur règle de taille, et
          ils habitent l'autre calque. *Une grandeur que deux endroits lisent se
          pose là où les deux la voient.* */}
      <div
        className="arm-fond"
        style={
          { '--onglets-l': `${enPixels(plan.onglets, fenetre.h, fenetre.l).width}px` } as React.CSSProperties
        }
      >
      {/* CHAQUE LIEU A SON PANNEAU. Le rail ne change pas d'écran, il change
          de LIEU : ce qui appartient à l'armurerie disparaît quand on ouvre
          l'expédition, et réciproquement. */}
      {lieu === 'expedition' && (
        <>
          <div className="arm-cadre" style={boite(plan.expedition)} />
          <span className="arm-nom" style={plaque(plan.expedition)}>
            Expédition
          </span>
          {/* CE QU'ON EMPORTE SE DIT ICI, parce qu'on n'a plus le chargement
              sous les yeux : *avant de descendre, le joueur doit voir avec quoi
              il descend* — et c'est le seul chiffre sur lequel les deux départs
              se comparent. */}
          <p
            className="arm-expe-note"
            style={boite({
              x: plan.expedition.x,
              // ELLE SE POSE AU-DESSUS DU PREMIER BOUTON, pas dans le haut du
              // panneau : *une phrase qui explique un bouton se lit avec lui.*
              // L'écart entre les deux départs vaut deux boutons, donc les
              // trois quarts de cet écart placent la ligne à un bouton et demi
              // au-dessus — sans écrire une seule hauteur à la main.
              //
              // **MAIS ELLE NE MONTE JAMAIS JUSQU'AU TITRE.** Les boutons ont
              // un plancher en pixels, donc ils occupent d'autant plus de
              // panneau que l'écran est court : sur un téléphone la ligne
              // rejoignait la plaque du lieu, qui est à cheval sur le bord
              // haut du cadre. *Une hauteur dérivée d'un objet à plancher doit
              // être bornée par le contenant*, sinon elle en sort là où il est
              // le plus petit.
              y: Math.min(
                plan.bouton[1] + (plan.bouton[1] - plan.boutonFortune[1]) * 0.75,
                plan.expedition.y +
                  plan.expedition.h / 2 -
                  plan.demiHaut * 0.09 -
                  plan.expedition.h * 0.06,
              ),
              l: plan.expedition.l,
              h: plan.expedition.h * 0.12,
            })}
          >
            {deck.total === 0
              ? 'Aucun équipement : pars avec ce que l’armurier te donne.'
              : `Tu descends avec ${deck.total} cartes, dont ${deck.frappent} qui frappent.`}
          </p>
        </>
      )}

      {lieu === 'armurerie' && (
        <>
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
      {/* L'ARMURIER PREND TOUTE SA COLONNE. Il a d'abord coiffé le rail des
          mesures, et *elles se lisaient alors comme LES SIENNES* — Keko : « on
          dirait que c'est les stats du PNJ maintenant ». Elles sont parties en
          bande au-dessus de l'équipement ; lui n'a plus rien à partager. */}
      <img className="arm-pnj" style={boite(plan.pnj)} src={urlDeLArmurier()} alt="" />

      {/* LES QUATRE MESURES EN BANDE, au-dessus de ce qu'on équipe : *ce qu'on
          emporte se mesure au-dessus de ce qu'on porte.* */}
      {/* LA BANDE SE MESURE SUR SA LARGEUR AUTANT QUE SUR SA HAUTEUR : quatre
          mesures dans un panneau étroit ne tiennent pas, et *la contrainte la
          plus dure gagne.* */}
      <div
        className="arm-etat"
        style={
          {
            ...boite(plan.stats),
            // ON REPREND LA VALEUR AU PLAN, pas à `boite` : celle-ci rend déjà
            // des chaînes en `px`, et la recoller donnait un « 182pxpx » que le
            // navigateur jette EN SILENCE — la hauteur des symboles dépendait
            // de ce `calc`, donc elle tombait avec lui et ils disparaissaient.
            '--etat-l': `${enPixels(plan.stats, fenetre.h, fenetre.l).width}px`,
          } as React.CSSProperties
        }
      >
        <span className="arm-mesure" ref={(el) => void (mesures.current[0] = el)}>
          <span className="arm-vif" ref={(el) => void (vifs.current[0] = el)}>
            <span className="arm-chiffre">{pvVu}</span>
            <CoeurIcone />
          </span>
        </span>
        <span className="arm-mesure" ref={(el) => void (mesures.current[2] = el)}>
          <span className="arm-vif" ref={(el) => void (vifs.current[2] = el)}>
            <span className="arm-chiffre">{mainVu}</span>
            <MainIcone />
          </span>
        </span>
        <span className="arm-mesure arm-orbe" ref={(el) => void (mesures.current[3] = el)}>
          <span className="arm-vif" ref={(el) => void (vifs.current[3] = el)}>
            <Orbe3D courant={paVu ?? 0} max={paVu ?? 0} seul />
          </span>
        </span>
      </div>
        </>
      )}

      </div>

      <div className="arm-commandes" style={zoomee ? { display: 'none' } : undefined}>
      {lieu === 'armurerie' && (
        <>
      {/**
        * LE BOUTON « DECK » PORTE LE PAQUET ET SON COMPTE. Demandé par Keko :
        * « on va passer le symbole deck et son nombre de cartes dans le bouton
        * deck et garder au-dessus juste pv / main / pa ».
        *
        * *Le couple était une MESURE parmi quatre ; il devient ce qu'on ouvre* —
        * et c'est plus juste, parce que c'est la seule des quatre sur laquelle
        * on peut agir. La bande garde les trois qu'on ne fait que lire.
        *
        * **Il est en HTML et non peint au canvas comme les autres boutons** :
        * le symbole du paquet est un SVG du jeu, et le repeindre l'aurait
        * dédoublé — *deux dessins qui décrivent la même chose divergent au
        * premier réglage.* Il hérite au passage de la police du lieu, donc il
        * ne peut plus en sortir.
        */}
      <button
        type="button"
        className="arm-deck"
        style={
          {
            ...boite(plan.deck),
            // SA PROPRE HAUTEUR en garde-fou, ET LA LARGEUR DE LA BANDE :
            // il partage la règle de taille des mesures, donc il lui faut la
            // même grandeur de référence. *Deux formules voisines divergent ;
            // une seule ne peut pas.*
            '--deck-h': `${enPixels(plan.deck, fenetre.h, fenetre.l).height}px`,
            '--etat-l': `${enPixels(plan.stats, fenetre.h, fenetre.l).width}px`,
          } as React.CSSProperties
        }
        onClick={onVoirDeck}
        // ET IL S'ÉTEINT QUAND IL N'Y A RIEN À MONTRER : *un bouton qui ouvre
        // une page blanche se lit comme une panne.*
        disabled={deckVide}
        ref={(el) => void (mesures.current[1] = el)}
      >
        <span className="arm-vif" ref={(el) => void (vifs.current[1] = el)}>
          <span className="arm-chiffre">{deckVu}</span>
          <span className="arm-tas">
            <Tas3D nom="pioche" compte={deckVu ?? 0} />
          </span>
        </span>
      </button>
        </>
      )}

      {/* LE RAIL DES DESTINATIONS, sur le bord gauche. C'est lui le hub : on
          n'arrive plus sur une page qui ne sert qu'à choisir, on arrive DANS
          un lieu et le rail dit où l'on peut aller.

          Il vit dans les COMMANDES et non dans le fond : celui-ci est en
          `pointer-events: none` pour laisser prendre les cartes, donc un
          bouton posé dedans ne répondrait pas. */}
      <nav
        className="arm-rail"
        style={{
          ...boite(plan.railListe),
          // LA TAILLE DU TEXTE SUIT LA LARGEUR DU RAIL, pas la fenetre : il est
          // borne par la hauteur, donc sa largeur ne suit pas celle de l'ecran.
          '--rail-l': `${enPixels(plan.railListe, fenetre.h, fenetre.l).width}px`,
          // LA HAUTEUR D'UNE LIGNE, et c'est ELLE qui la donne — pas un flex
          // qui étire. Les entrées se partagent la colonne, mais **plafonnées**
          // : sur un écran de PC elles faisaient 146 px pour un texte de 23
          // (Keko : « ils sont trop épais »). *Une ligne de liste vaut quelques
          // fois son texte, pas six.*
          //
          // Le plafond vit ICI et pas dans la feuille, parce que l'emblème s'y
          // borne aussi : *deux endroits qui décrivent la même hauteur se
          // désaccordent au premier réglage.*
          '--rail-ligne': `${Math.min(
            enPixels(plan.railListe, fenetre.h, fenetre.l).height / DESTINATIONS.length,
            3.4 * parseFloat(getComputedStyle(document.documentElement).fontSize),
          )}px`,
        } as React.CSSProperties}
      >
        {DESTINATIONS.map((d, i) => (
          <button
            key={i}
            type="button"
            className={`arm-lieu${d.lieu === lieu ? ' actif' : ''}${d.majeur === true ? ' majeur' : ''}`}
            disabled={!d.ouvert}
            /* UNE PLACE TENUE OUVRE L'ARMURERIE, faute d'avoir son lieu : c'est
               le placeholder qui permet de juger un rail entier. Elle ne
               s'allume pas pour autant — `actif` lit `d.lieu`, qui reste
               vide. */
            onClick={() => onLieu(d.lieu ?? 'armurerie')}
          >
            {/* L'EMBLÈME RESTE, ET IL EST BORNÉ PAR SA LIGNE. Keko : « il faut
                garder le symbole car plus tard on aura des symboles
                différents ». Les huit portent aujourd'hui le même écu, faute
                d'en avoir d'autres ; ce qui se corrigeait n'était pas sa
                présence mais sa TAILLE — mesuré par son texte, il ignorait ce
                que sa ligne mesure et mordait le filet dès que le rail se
                serrait. */}
            {/* UN PLACEHOLDER SUR LES PLACES TENUES, LE TEMPS DE JUGER.
                Demandé par Keko : « tu peux mettre l'armurerie dans tous les
                onglets du hub en mode placeholder pour test ? »

                *Elles n'en portaient aucun*, pour ne pas donner un visage à des
                lieux qui n'existent pas — mais on ne juge pas un rail de huit
                entrées sur deux symboles. **Le repli est une seule ligne** : il
                tombe dès que chaque destination nomme le sien. */}
            <img
              className="arm-lieu-blason"
              src={urlDuSymbole(d.embleme ?? 'Armurerie')}
              alt=""
              draggable={false}
            />
            <span className="arm-lieu-nom">{d.nom}</span>
          </button>
        ))}
      </nav>
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
          className={`arm-bulle${bulle.place === 'gauche' ? '' : ' dessus'}${bulle.place === 'coin' ? ' coin' : ''}`}
          style={{ left: `${bulle.x}px`, top: `${bulle.y}px` }}
        >
          {bulle.texte}
        </span>
      )}
      {lieu === 'armurerie' && (
        <>
      {/* LES ONGLETS : ce qu'on possède se range par nature, et les TRÉSORS y
          ont leur case bien qu'aucun slot ne les prenne. *Le coffre est ce
          qu'on possède, pas ce qu'on peut porter.* */}
      {/* RANGER LE COFFRE : un symbole, pas un mot. Demandé par Keko. Il vit
          dans l'en-tête, AU-DESSUS des onglets — *un onglet dit ce qu'on
          regarde, ce bouton dit ce qu'on fait au meuble entier*, et les deux
          ne se mélangent pas.

          Le dessin est trois barres décroissantes surmontées d'une flèche : le
          signe de tri universel, qui n'a besoin d'aucune légende. Il est
          écrit à la main, comme tout le SVG du projet. */}
      <button
        type="button"
        ref={tri}
        className="arm-tri"
        style={boite(plan.tri)}
        onClick={(e) => {
          /**
           * **LE FOCUS N'EST PAS UN ÉTAT DU JEU.**
           *
           * Après un clic à la souris, le bouton gardait l'air allumé jusqu'au
           * clic suivant — Keko : « ça fait croire qu'on aurait un
           * fonctionnement on/off à tort ». *Un bouton qui agit n'a pas
           * d'état* : il fait, et il retombe. C'est la règle déjà tenue par
           * les boutons du butin — « il agit, il n'attend pas ».
           *
           * On ne le rend QU'AU POINTEUR (`detail > 0`) : au clavier, le
           * focus est le seul repère de l'endroit où l'on est, et le lui
           * retirer laisserait l'utilisateur sans place.
           */
          if (e.detail > 0) e.currentTarget.blur()
          /**
           * **IL S'ENFONCE.** Keko : « le feel n'est pas bon, on devrait faire
           * un petit effet au clic en baissant le bouton comme s'il
           * s'enfonçait ». *Au doigt, le survol n'existe pas et l'appui dure
           * trop peu pour se voir* — il faut donc un geste qui se rejoue.
           *
           * Il descend VITE et remonte lentement, le contraste de vitesse du
           * bond des créatures et du gonflement des tas : *un aller-retour
           * symétrique se lirait comme un rebond, pas comme une touche.*
           *
           * Par l'API d'animation et non par une classe : on peut ranger deux
           * fois de suite, et *une classe qu'on retire et qu'on repose ne
           * redémarre pas sans un reflow forcé.*
           */
          e.currentTarget.animate(
            [
              { translate: '0 0' },
              {
                translate: '0 2px',
                // ET IL S'ALLUME EN MÊME TEMPS. Keko : « le bouton ne s'éclaire
                // pas quand je le tape sur tél ». *Le fond de l'appui dépend du
                // navigateur sur un écran tactile* — `:active` n'y est pas
                // garanti — alors que l'animation, elle, part du clic. C'est
                // donc elle qui porte la lumière, et le survol n'a plus à être
                // le seul à savoir le faire.
                borderColor: '#d8bb79',
                backgroundColor: '#342c1c',
                color: '#ffeec2',
                offset: 0.28,
              },
              { translate: '0 0' },
            ],
            // LA COULEUR N'EST DONNÉE QU'AU MILIEU : les deux bouts la
            // prennent de l'état courant, donc le bouton déjà allumé sous la
            // souris ne s'éteint pas d'abord pour se rallumer.
            { duration: 190, easing: 'ease-out' },
          )
          // LE SON DE LA POSE, demandé par Keko. *Ranger le coffre, c'est
          // reposer des cartes* — donc c'est ce bruit-là, celui d'un dépôt qui
          // aboutit, et pas celui de la prise. Il ne part QUE si le bouton
          // range vraiment, comme partout ailleurs : un slot qui refuse ne
          // sonne pas comme un slot qui prend.
          if (onTrier !== undefined) {
            jouerSon(SON_POSER)
            onTrier()
          }
        }}
        aria-label="Ranger le coffre"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M4 6.5h11M4 12h7.5M4 17.5h4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.1"
            strokeLinecap="round"
          />
          <path
            d="M18.5 5.5v13m0 0 3-3.4m-3 3.4-3-3.4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.1"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {/* LES ONGLETS SE MESURENT SUR LEUR BANDE : cinq mots dans un coffre
          rétréci ne tiennent pas, et *un contenu qui ne suit qu'une dimension
          déborde dès que l'autre se serre.* */}
      <div
        className="arm-onglets"
        style={
          {
            ...boite(plan.onglets),
            '--onglets-l': `${enPixels(plan.onglets, fenetre.h, fenetre.l).width}px`,
          } as React.CSSProperties
        }
      >
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
        </>
      )}

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
    <svg className="arm-icone coeur" viewBox="0 0 40 37" aria-hidden="true">
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

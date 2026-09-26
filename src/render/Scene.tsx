/**
 * LA SCÈNE : la DESCENTE entière, branchée sur les vraies règles.
 *
 * Elle a d'abord tenu un combat isolé, le temps de prouver qu'une carte tient
 * en 3D, que le geste répond au doigt et que le coup se voit. Elle tient
 * désormais une `Descente` : combat → récompense → butin → point de sortie →
 * palier suivant, jusqu'à l'extraction ou la mort. **Aucune règle n'a été
 * réécrite** — tout vient de `logic/descente.ts`, qui n'a pas bougé d'une
 * ligne depuis le jeu 2D.
 *
 * *Le combat n'est donc plus qu'une phase parmi d'autres* : `descente.combat`
 * est ce qu'on dessine tant que `phase.type === 'combat'`, et les écrans de
 * palier sont des voiles posés dessus.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import {
  Main3D,
  pasDeLEventail,
  placeDansEventail,
  ReperesDeLaMain,
  yMain,
} from './Main3D.tsx'
import { DUREE_TRAINEE, Trainee } from './Trainee.tsx'
import { PART_ENVOL } from './sillage.ts'
import { CarteQuiSeDissout, DUREE_DISSOLUTION, PAS_DISSOLUTION } from './CarteQuiSeDissout.tsx'
import { depuisEcran, Z_MAIN } from './Cadrage.tsx'
import { CORPS, decorDuRang, Ennemi3D, HAUT_CORPS, identiteEnnemi } from './Ennemi3D.tsx'
import { boiteDe } from './silhouette.ts'
import { Projeter, ReperesDuRang } from './Projeter.tsx'
import { CarteQuiSAbat, TEMPS_FIN, TEMPS_IMPACT } from './CarteQuiSAbat.tsx'
import { Horloge, lireHorloge } from './horloge.tsx'
import { Cadrage, FOV, zCamera } from './Cadrage.tsx'
import { Secousse, secouer } from './Secousse.tsx'
import { DUREE_ASSAUT, INSTANT_IMPACT } from './Ennemi3D.tsx'
import { Etal3D } from './Palier3D.tsx'
import { Butin3D, slotSous } from './Butin3D.tsx'
import { Armurerie3D } from './Armurerie3D.tsx'
import type { Onglet } from './armurerie-plan.ts'
import { PageArmurerie } from './PageArmurerie.tsx'
import { urlDuDecor } from '../ui/art.ts'
import { Zoom3D } from './Zoom3D.tsx'
import { Tas3D } from './Tas3D.tsx'
import { Orbe3D } from './Orbe3D.tsx'
import { BarreVie3D } from './BarreVie3D.tsx'
import { CarteVersArmure, FIN_ARMURE, TEMPS_ARMURE } from './CarteVersArmure.tsx'
import { CarteVersSoin, FIN_SOIN, TEMPS_SOIN } from './CarteVersSoin.tsx'
import type { Entree } from './Zoom3D.tsx'
import {
  TAILLE_MAIN_URL,
  aPeindre,
  descenteDeDepart,
  equipementPourTenir,
  pieceAPeindre,
  setAPeindre,
} from './combat-3d.ts'
import type { EtatCombat } from '../logic/combat.ts'
import { consequence, finDuTour, jouable, jouerCarte, menaceDuTour, portee, viseUneCible, vivants } from '../logic/combat.ts'
import type { Descente } from '../logic/descente.ts'
import type { Hub, Slot } from '../logic/hub.ts'
import { creerHub, deplacerPiece, equipement, perdreLEquipement, peutDescendre, rentrer } from '../logic/hub.ts'
import {
  REGLAGE_DEFAUT,
  commencerDescente,
  consommablesSurvivants,
  tresorsTransportes,
} from '../logic/descente.ts'
import {
  butinTransporte,
  choisirCarte,
  deplacerTresor,
  descendre,
  extraire,
  reordonnerTresors,
  resoudreCombat,
  terminerButin,
  tresorsAuDeck,
  validerJet,
} from '../logic/descente.ts'
import type { CarteAPeindre } from './texture-carte.ts'
import { teteDeMort } from '../ui/illustrations.ts'

/** Un coup encaissé par un corps : de quoi afficher le chiffre qui saute. */
type Coup = { cle: number; cible: number; degats: number; tue: boolean }

/** La carte en train de s'abattre. */
type EnVol = {
  cle: number
  carte: CarteAPeindre
  depuis: [number, number, number]
  vers: [number, number, number]
  debut: number
}

/** Une traînée de lumière entre un paquet et une place de la main. */
type Trajet = {
  cle: string
  depuis: [number, number, number]
  vers: [number, number, number]
  debut: number
  /** L'inclinaison de la carte qui vient de s'éteindre là, s'il y en avait une. */
  rotationDepart?: number
}

/** Le temps entre deux cartes piochées : elles arrivent l'une après l'autre. */
const DECALAGE_PIOCHE = 0.1

/**
 * LE MÉLANGE : la défausse remonte dans la pioche, en plusieurs brassées.
 *
 * Une seule traînée dirait « une carte » ; c'est tout un tas qui se retourne,
 * donc il en faut plusieurs, décalées. La pioche tremble pendant ce temps —
 * *c'est elle qu'on remplit, c'est elle qui doit réagir.*
 */
const BRASSEES = 5
const PAS_BRASSEE = 0.06
const DUREE_MELANGE = (BRASSEES - 1) * PAS_BRASSEE + DUREE_TRAINEE

/** Une carte qui s'embrase avant de partir en lumière vers la défausse. */
type Dissolution = {
  cle: string
  carte: CarteAPeindre
  place: [number, number, number]
  rotation: [number, number, number]
  debut: number
}

/**
 * Le temps entre deux ennemis d'une même salve. **Il doit dépasser un assaut
 * complet, secousse comprise** (580 + 260 ms) : sinon l'élan du suivant
 * démarre pendant la secousse du précédent, et l'anticipation — tout
 * l'intérêt du geste — se fait secouer. Règle du 2D, mesurée sur le deuxième
 * monstre.
 */
const PAS_ENTRE_FRAPPES = 0.62

/**
 * LA HAUTEUR DU RANG.
 *
 * **Sur un téléphone, la caméra ne recule pas** — elle ne le fait que pour
 * plafonner la taille des cartes sur grand écran — donc tout y est
 * proportionnellement plus grand : une carte occupe 40 % de la hauteur d'écran
 * contre 31 % sur un moniteur. La carte qui attend sa cible venait alors
 * recouvrir la jauge et le nom des créatures. Keko : « sur téléphone, la carte
 * d'attaque en cours de ciblage masque l'ennemi ».
 *
 * Le rang est donc monté, et la place est venue du haut de l'écran — d'où la
 * note de tour passée dans un coin. *Ce qui est proportionnel à l'écran ne se
 * règle pas sur un seul format.*
 *
 * **Il est redescendu d'un cran depuis**, parce que la main a baissé deux fois
 * entre-temps : la ligne de jeu et la place de la carte qui vise en sont
 * calculées, donc la marge s'était rouverte toute seule. Keko : « sur
 * téléphone, on devrait descendre un poil l'ennemi ». *Un réglage posé pour
 * dégager un conflit doit se relire quand le conflit se déplace.*
 */
const HAUTEUR_RANG = 1.1

/** Ce que le joueur encaisse, pour le chiffre qui saute à côté de ses PV. */
type CoupRecu = { cle: number; degats: number }

/** Les réserves du joueur telles qu'on les MONTRE pendant la salve. */
type Salve = { pv: number; bloc: number }

/**
 * La seed de départ. Remonter au hub l'incrémente : la descente suivante a
 * son propre tirage.
 *
 * `?r3f&seed=42` rejoue une partie précise — c'est ce qui permet de retomber
 * sur un groupe de trois créatures sans relancer vingt descentes.
 */
const SEED = Number(new URLSearchParams(window.location.search).get('seed')) || 1789

/**
 * LE TEMPS QU'ON REDONNE AU JOUEUR avant de lui poser un calque dessus.
 *
 * Assez pour que l'oeil enregistre le rang vide, trop court pour qu'on
 * attende. Sans lui, le dernier coup se refermait et le palier s'ouvrait dans
 * la même image : on ne voyait jamais le champ de bataille qu'on venait de
 * vider, ni son propre corps une fois le coup encaissé.
 */
const RESPIRATION = 600

export function Scene(): React.JSX.Element {
  const [graine, setGraine] = useState(SEED)
  const depart = useMemo(() => descenteDeDepart(graine), [graine])
  /**
   * L'ARMURERIE EST LE PREMIER ÉCRAN, et la descente vient d'elle.
   *
   * Tant que le chargement était figé, la question qui porte le concept —
   * partir léger ou partir couvert — n'existait pas : le deck était donné.
   * `descente` n'est donc plus l'état racine, c'est ce que le hub produit
   * quand on descend, et ce qui lui revient quand on remonte.
   */
  const [hub, setHub] = useState<Hub>(() => creerHub())
  const [descente, setDescente] = useState<Descente | null>(null)
  /**
   * LA DESCENTE EN COURS, ou celle de départ tant qu'on est au hub.
   *
   * Un repli plutôt qu'une garde dans chaque rappel : la moitié de ce fichier
   * ne s'exécute qu'en descente, et vingt `if (descente === null) return`
   * n'auraient rien dit de plus que `auHub`. Ce qui compte est écrit une fois,
   * ici : *au hub, on ne joue pas.*
   */
  const enCours = descente ?? depart.descente
  const combat = enCours.combat
  const phase = enCours.phase
  const auHub = descente === null
  const enCombat = !auHub && phase.type === 'combat'

  /**
   * Le combat est une PHASE de la descente, donc on ne le remplace jamais
   * seul : on repose la descente autour de lui. Tout ce qui suit continue de
   * raisonner sur `combat`, c'est le seul endroit qui sache les recoller.
   */
  const majCombat = useCallback(
    (f: (c: EtatCombat) => EtatCombat) =>
      setDescente((d) => (d === null ? d : { ...d, combat: f(d.combat) })),
    [],
  )
  /**
   * LE ZOOM PORTE LA CARTE, PAS UN INDEX DE MAIN. Index, il était enfermé dans
   * `combat.main` : impossible de regarder de près le trésor posé dans un
   * emplacement du butin. C'est la leçon du jeu 2D, reprise telle quelle.
   */
  /** La main tient un trésor au-dessus du rebut : le slot doit le savoir. */
  const [mainSurLeRebut, setMainSurLeRebut] = useState(false)
  const [zoomee, setZoomee] = useState<CarteAPeindre | null>(null)
  /** Le set de la pièce regardée, s'il s'agit d'une pièce d'équipement. */
  const [zoomSet, setZoomSet] = useState<Entree[]>([])
  /**
   * LA VISÉE EN COURS : une carte attend une cible, et voici le corps sous la
   * pointe de la flèche. Prévenu par `Main3D` quand la RÉPONSE change, pas à
   * chaque mouvement du doigt.
   */
  const [visee, setVisee] = useState<{ actif: boolean; cible: number | null }>({
    actif: false,
    cible: null,
  })
  const marquerVisee = useCallback(
    (actif: boolean, cible: number | null) =>
      setVisee((v) => (v.actif === actif && v.cible === cible ? v : { actif, cible })),
    [],
  )
  /** Une carte est tenue au doigt. */
  const [saisie, setSaisie] = useState(false)

  // LE JEU A DES TEMPS. Tant qu'un coup se joue, la main est verrouillée et le
  // combat ne se résout pas : l'état ne change qu'à l'IMPACT, pas à la tape.
  const [verrou, setVerrou] = useState(false)
  const [enVol, setEnVol] = useState<EnVol | null>(null)

  /**
   * LES TRAÎNÉES, ET LES CARTES QUI VIENNENT DE NAÎTRE.
   *
   * Keko voulait voir d'où viennent les cartes, et il a écarté la première
   * version — une carte entière qui voyage — pour deux raisons qui tenaient
   * ensemble : elle partait presque à sa taille finale, et elle arrivait
   * DROITE, la main se formant à plat avant de basculer en éventail.
   *
   * *Une traînée n'a ni taille de carte ni inclinaison* : elle ne peut pas
   * être en désaccord avec la main qu'elle rejoint. La carte, elle, naît
   * directement à sa place.
   */
  const [trajets, setTrajets] = useState<Trajet[]>([])
  const [apparues, setApparues] = useState<Record<string, number>>({})
  /** Les cartes que l'état compte déjà mais dont la traînée n'est pas arrivée. */
  const [attendues, setAttendues] = useState<readonly string[]>([])
  const [dissolutions, setDissolutions] = useState<Dissolution[]>([])
  /** La pioche tremble pendant qu'on y reverse la défausse. */
  const [brasse, setBrasse] = useState(false)
  /** Ce que le coffre montre, et depuis quelle ligne. */
  const [onglet, setOnglet] = useState<Onglet>('tout')
  const [defilement, setDefilement] = useState(0)

  /** La carte de garde en route vers le bouclier. */
  const [versArmure, setVersArmure] = useState<{
    cle: string
    carte: CarteAPeindre
    depuis: [number, number, number]
    vers: [number, number, number]
    debut: number
  } | null>(null)
  /** Le bouclier encaisse : il gonfle quand la carte s'y replie. */
  const [chocArmure, setChocArmure] = useState(0)
  /** La carte de soin en route vers la barre de vie. */
  const [versSoin, setVersSoin] = useState<{
    cle: string
    carte: CarteAPeindre
    depuis: [number, number, number]
    vers: [number, number, number]
    debut: number
  } | null>(null)
  /** La barre s'illumine : elle vient de recevoir un soin. */
  const [chocSoin, setChocSoin] = useState(0)

  /**
   * Un compteur d'arrivées par tas : il gonfle à chaque chose qu'on y verse.
   *
   * *Le même système des deux côtés* — Keko : « comme pour la défausse, la
   * pioche devrait avoir le gonflement pour chaque carte mise dedans ». La
   * pioche le doit à ses brassées, la défausse aux cartes qu'on y jette.
   */
  const [chocDefausse, setChocDefausse] = useState(0)
  const [chocPioche, setChocPioche] = useState(0)

  /**
   * Ce qu'il faut pour peindre une carte qui vient de QUITTER la main : une
   * fois partie, l'état ne la porte plus, et on ne peut plus la dessiner.
   */
  const mainCartes = useRef(new Map<string, CarteAPeindre>())
  for (const c of combat.main) mainCartes.current.set(c.id, aPeindre(c))
  const [coups, setCoups] = useState<Coup[]>([])
  const [touches, setTouches] = useState<Record<number, number>>({})
  const [morts, setMorts] = useState<Record<number, number>>({})
  /** L'instant où chaque ennemi s'élance, pendant la salve. */
  const [assauts, setAssauts] = useState<Record<number, number>>({})
  /** Les coups encaissés par le joueur, le temps que le chiffre saute. */
  const [recus, setRecus] = useState<CoupRecu[]>([])
  /** La salve en cours : PV et bloc affichés s'égrènent frappe par frappe. */
  const [salve, setSalve] = useState<Salve | null>(null)
  const cleSuivante = useRef(0)

  // LE CHARGEMENT DOIT SE VOIR. Rien ne s'affiche tant que les polices et les
  // illustrations ne sont pas là — et sur un téléphone ça fait plusieurs
  // secondes d'écran noir. *Un écran noir sans signe de vie se lit comme une
  // page cassée.*
  const [peintes, setPeintes] = useState(0)
  const compter = useCallback(() => setPeintes((n) => n + 1), [])
  const pret = peintes > 0

  const main = useMemo(() => combat.main.map(aPeindre), [combat.main])

  /**
   * LES VOLS DE PIOCHE ET DE DÉFAUSSE.
   *
   * On compare la main d'avant à celle d'après : ce qui est apparu vient du
   * paquet de pioche, ce qui a disparu s'en va à la défausse. *On ne demande
   * rien aux règles* — `logic/` ne sait pas qu'il existe une animation, et
   * l'écart entre deux états suffit à la déduire.
   *
   * LA CARTE JOUÉE EST LA SEULE EXCEPTION : elle a déjà son trajet, celui qui
   * s'abat sur la cible. La faire voler aussi vers la défausse la montrerait
   * deux fois.
   *
   * Les cartes partent l'une après l'autre : cinq d'un coup se liraient comme
   * un seul mouvement, et c'est chacune qu'on doit voir arriver.
   */
  const mainAvant = useRef<string[] | null>(null)
  /**
   * LA FIN DE TOUR NE SE DÉDUIT PAS, ELLE SE DÉCLARE.
   *
   * Comparer deux mains suffit tant que les cartes changent ; à la fin d'un
   * tour, non — **une carte défaussée puis REPIOCHÉE porte le même
   * identifiant dans les deux mains**, donc l'écart ne la voyait ni partir ni
   * revenir, et elle restait plantée là pendant que ses voisines faisaient le
   * tour. Keko : « quand je pioche une carte qui était déjà dans ma main
   * précédente, elle y reste au lieu de faire défausse > mélange > pioche ».
   *
   * `finDuTour` est pur et se calcule AVANT d'être appliqué : on sait donc
   * tout du cycle à l'avance — ce qui part, ce qui arrive, et s'il a fallu
   * remélanger en cours de route.
   */
  const finDeTour = useRef<{
    sortantes: readonly string[]
    /** Ce qu'on pioche avant que la pioche ne se vide. */
    avantMelange: number
    melange: boolean
  } | null>(null)

  /**
   * LA DERNIÈRE CARTE JOUÉE, ET QUAND SON ANIMATION S'ACHÈVE.
   *
   * **UNE CARTE UTILISÉE N'A PAS DE COMÈTE.** Tranché par Keko : « une carte
   * utilisée n'est jamais affectée par cette animation ; on fait juste
   * trembler / gonfler le paquet de défausse pour signifier qu'il augmente,
   * mais la disparition de la carte sera son animation d'utilisation ».
   *
   * *Et c'est juste* : la comète raconte un TRANSIT — une carte quitte la main
   * sans qu'on l'ait décidé, et il faut dire où elle va. Une carte jouée, elle,
   * a déjà toute une scène à son nom : on l'a sortie de la main, elle s'est
   * abattue sur un corps. Lui ajouter un vol vers le tas raconterait deux fois
   * le même départ.
   *
   * Il ne reste donc à savoir qu'une chose : **quand le tas doit encaisser** —
   * à la fin de l'animation d'utilisation, pas à l'instant où les règles
   * changent.
   */
  const dejaJouee = useRef<{ id: string; finAnimation: number } | null>(null)

  useEffect(() => {
    if (!enCombat) {
      mainAvant.current = null
      return
    }
    const ids = combat.main.map((c) => c.id)
    const avant = mainAvant.current ?? []
    mainAvant.current = ids

    // LE POINT DE DÉPART VIENT DU DOM : les tas sont du HTML posé dans les
    // coins, la main vit dans le canvas. `depuisEcran` est l'inverse de
    // `Projeter`, et il passe par le champ visible à la profondeur de la main,
    // donc il suit le recul de la caméra sans qu'on s'en occupe.
    const coinDe = (nom: 'pioche' | 'defausse'): [number, number, number] | null => {
      const el = document.querySelector(`.tas-3d.${nom} .tas-dessin`)
      if (el === null) return null
      const r = el.getBoundingClientRect()
      return depuisEcran(
        r.left + r.width / 2,
        r.top + r.height / 2,
        Z_MAIN,
        window.innerWidth,
        window.innerHeight,
      )
    }

    const pas = pasDeLEventail(ids.length, window.innerHeight, window.innerWidth)
    const y = yMain(window.innerHeight)
    const placeDe = (rang: number): [number, number, number] =>
      placeDansEventail(rang, ids.length, y, pas).position

    const trajetsNeufs: Trajet[] = []
    const t = lireHorloge()

    // LES PARTANTES SE COMPTENT AVANT LA PIOCHE, parce que c'est leur nombre
    // qui dit combien de temps dure l'embrasement — et la pioche attend qu'il
    // soit fini.
    const jouee = dejaJouee.current
    dejaJouee.current = null
    const tour = finDeTour.current
    finDeTour.current = null
    // À LA FIN D'UN TOUR, TOUTE LA MAIN PART ET TOUTE LA MAIN ARRIVE — même
    // les cartes qui portent le même identifiant des deux côtés. L'écart entre
    // deux mains ne peut pas le dire, et c'est bien pour ça que la fin de tour
    // se déclare au lieu de se déduire.
    const partantes =
      tour !== null ? tour.sortantes : avant.filter((id) => !ids.includes(id) && id !== jouee?.id)
    const embrasement = partantes.length > 0 ? DUREE_DISSOLUTION + (partantes.length - 1) * PAS_DISSOLUTION : 0

    // LA PIOCHE : une traînée par carte, puis la carte naît à sa place quand
    // la traînée y meurt. Elles partent l'une après l'autre — cinq d'un coup se
    // liraient comme un seul mouvement, et c'est chacune qu'on doit voir venir.
    const retardPioche = embrasement * 0.8
    const piochees = tour !== null ? combat.main : combat.main.filter((c) => !avant.includes(c.id))

    /**
     * LE CYCLE A UN ORDRE, ET LE MÉLANGE EST DEDANS : défausse de la main,
     * pioche, et quand la pioche se vide, **on reverse la défausse avant de
     * continuer**. Demandé par Keko, et c'est aussi ce que font les règles —
     * `piocher` remélange au milieu de sa boucle, pas avant.
     *
     * Le mélange attend que la main soit ARRIVÉE à la défausse : elle en fait
     * partie, donc la reverser pendant qu'elle vole dirait l'inverse de ce qui
     * se passe. Et il attend la première vague, sinon deux flux se croisent au
     * même instant.
     */
    const avantMelange = tour?.melange === true ? tour.avantMelange : piochees.length
    const finDefausse = partantes.length > 0 ? embrasement + DUREE_TRAINEE : 0
    const finVague =
      avantMelange > 0 ? retardPioche + (avantMelange - 1) * DECALAGE_PIOCHE + DUREE_TRAINEE : 0
    const debutMelange = Math.max(finDefausse, finVague)
    const retardReste = debutMelange + DUREE_MELANGE

    const pioche = piochees.length > 0 ? coinDe('pioche') : null
    if (pioche !== null) {
      piochees.forEach((carte, n) => {
        // ON NE PIOCHE PAS PENDANT QUE LA MAIN BRÛLE. Les deux se jouaient en
        // même temps et au MÊME endroit — l'éventail d'avant et celui d'après
        // ont les mêmes places — donc la carte qui naissait recouvrait celle
        // qui partait. *Un remplacement se raconte dans l'ordre.*
        const depart =
          n < avantMelange
            ? retardPioche + n * DECALAGE_PIOCHE
            : retardReste + (n - avantMelange) * DECALAGE_PIOCHE
        trajetsNeufs.push({
          cle: `p-${carte.id}-${t}`,
          depuis: pioche,
          vers: placeDe(combat.main.indexOf(carte)),
          debut: t + depart,
        })
        window.setTimeout(
          () => {
            setApparues((a) => ({ ...a, [carte.id]: lireHorloge() }))
            setAttendues((x) => x.filter((id) => id !== carte.id))
          },
          (depart + DUREE_TRAINEE) * 1000,
        )
      })
      setAttendues((x) => [...x, ...piochees.map((c) => c.id)])
    }

    // LE MÉLANGE SE VOIT : la défausse remonte dans la pioche en brassées, et
    // la pioche tremble le temps qu'on la remplit. Sans ça, le tas se
    // reconstituait tout seul et le joueur voyait juste deux chiffres changer.
    if (tour?.melange === true) {
      const vide = coinDe('defausse')
      if (vide !== null && pioche !== null) {
        for (let i = 0; i < BRASSEES; i += 1) {
          const debut = debutMelange + i * PAS_BRASSEE
          trajetsNeufs.push({ cle: `m-${i}-${t}`, depuis: vide, vers: pioche, debut: t + debut })
          // ELLE ENCAISSE CHAQUE BRASSÉE, comme la défausse encaisse chaque
          // carte : c'est le même geste, du même côté du trajet.
          window.setTimeout(
            () => setChocPioche((n) => n + 1),
            (debut + DUREE_TRAINEE * 0.85) * 1000,
          )
        }
        window.setTimeout(() => setBrasse(true), debutMelange * 1000)
        window.setTimeout(() => setBrasse(false), (debutMelange + DUREE_MELANGE) * 1000)
      }
    }

    const defausse = coinDe('defausse')
    const neuves: Dissolution[] = []

    /**
     * TOUT CE QUI PART À LA DÉFAUSSE PASSE PAR ICI, et le tas l'ENCAISSE.
     *
     * Demandé par Keko : la traînée arrivait et le tas ne bougeait pas — *on
     * jetait quelque chose dans un objet qui ne le sentait pas passer.* Le
     * choc est posé au même endroit que le trajet, sans quoi il faudrait
     * penser à l'ajouter à chaque nouvelle façon de défausser une carte.
     *
     * Il part un cheveu avant la fin du vol : les grains convergent sur la fin,
     * donc le tas doit déjà répondre quand les premiers le touchent.
     */
    const jeterVers = (
      cle: string,
      depuis: [number, number, number],
      debut: number,
      rotationDepart?: number,
    ): void => {
      if (defausse === null) return
      trajetsNeufs.push({ cle, depuis, vers: defausse, debut, rotationDepart })
      window.setTimeout(
        () => setChocDefausse((n) => n + 1),
        (debut - t + DUREE_TRAINEE * 0.85) * 1000,
      )
    }

    // LA DÉFAUSSE : la carte s'embrase à sa place dans l'éventail, puis c'est
    // la traînée qui s'en va. *Pas d'apparition au bout* — on ne fait pas
    // naître une carte dans un tas.
    if (partantes.length > 0 && defausse !== null) {
      const pasAvant = pasDeLEventail(avant.length, window.innerHeight, window.innerWidth)
      partantes.forEach((id, n) => {
        const carte = mainCartes.current.get(id)
        if (carte === undefined) return
        const ou = placeDansEventail(avant.indexOf(id), avant.length, y, pasAvant)
        const depart = t + n * PAS_DISSOLUTION
        neuves.push({
          cle: `x-${id}-${t}`,
          carte,
          place: ou.position,
          rotation: ou.rotation,
          debut: depart,
        })
        // LE RELAIS TOMBE À L'INSTANT OÙ LA CARTE A FINI DE RÉTRÉCIR, et la
        // traînée reprend son inclinaison : c'est ce raccord exact qui fait
        // lire la carte DEVENUE tête de comète, plutôt que deux choses sans
        // rapport au même endroit.
        jeterVers(
          `d-${id}-${t}`,
          ou.position,
          depart + DUREE_DISSOLUTION * PART_ENVOL,
          ou.rotation[2],
        )
      })
    }

    // UNE CARTE JOUÉE NE VOLE PAS, ELLE TOMBE DANS LE TAS. Elle a déjà son
    // animation — le geste qui la sort de la main, la chute sur le corps visé
    // — et la faire partir en comète par-dessus raconterait deux fois le même
    // départ. Seul le TAS réagit, et au bon moment : quand ce qu'on voyait
    // d'elle s'achève, pas quand les règles changent.
    //
    // Une potion ou un trésor brûlé s'EXILE : il ne rejoint aucun tas, donc
    // rien n'y tombe.
    if (
      jouee !== null &&
      !ids.includes(jouee.id) &&
      defausse !== null &&
      combat.defausse.some((c) => c.id === jouee.id)
    ) {
      window.setTimeout(() => setChocDefausse((n) => n + 1), jouee.finAnimation * 1000)
    }

    if (neuves.length > 0) {
      setDissolutions((v) => [...v, ...neuves])
      const cles = new Set(neuves.map((x) => x.cle))
      window.setTimeout(
        () => setDissolutions((v) => v.filter((x) => !cles.has(x.cle))),
        (Math.max(embrasement, DUREE_DISSOLUTION) + 0.06) * 1000,
      )
    }

    if (trajetsNeufs.length === 0) return
    setTrajets((v) => [...v, ...trajetsNeufs])
    // LE MÉNAGE SE CALE SUR LA DERNIÈRE TRAÎNÉE, pas sur leur nombre : depuis
    // que la pioche attend la fin de l'embrasement, un départ n'est plus un
    // multiple du décalage, et une traînée balayée avant d'arriver ne se voit
    // tout simplement pas.
    const dernier = Math.max(...trajetsNeufs.map((x) => x.debut - t))
    const fin = dernier + DUREE_TRAINEE * 1.4
    const cles = new Set(trajetsNeufs.map((x) => x.cle))
    window.setTimeout(() => setTrajets((v) => v.filter((x) => !cles.has(x.cle))), fin * 1000 + 60)
    // On ne dépend QUE de la main : `enCombat` la suit, et les autres valeurs
    // sont lues au moment du déclenchement.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [combat.main])

  const debout = vivants(combat)
  // `menaceDuTour` DÉDUIT DÉJÀ LE BLOC : le retrancher encore affichait zéro
  // dès qu'on posait une Garde, donc une menace qui disparaît au lieu de
  // baisser. C'est précisément ce chiffre qui doit rendre la garde lisible.
  const menace = menaceDuTour(combat)
  const fini = combat.issue !== null

  // LE RANG DES ENNEMIS, centré au-dessus de la main. Ils se tiennent côte à
  // côte et le joueur leur fait face depuis le bas de l'écran : c'est la main
  // qui tient sa place.
  const rang = combat.ennemis.map((_, i) => {
    const centre = (combat.ennemis.length - 1) / 2
    return [(i - centre) * (CORPS * 1.25), HAUTEUR_RANG, 0] as [number, number, number]
  })
  // CE QU'ON PEUT JOUER MAINTENANT : assez d'énergie, et le combat n'est pas
  // fini. Un trésor n'est jouable par personne — il ne fait qu'occuper une
  // place de main.
  const jouables = useMemo(
    () => combat.main.map((c) => !fini && jouable(c) && c.cout <= combat.energie),
    [combat.main, combat.energie, fini],
  )

  /**
   * OÙ SE TROUVE UN REPÈRE DE L'INTERFACE, EN COORDONNÉES DE SCÈNE.
   *
   * Le bouclier et la barre sont du HTML, les cartes vivent dans le canvas :
   * `depuisEcran` est l'inverse de `Projeter`, et il passe par le champ
   * visible à la profondeur de la main — il suit donc le recul de la caméra
   * sans qu'on s'en occupe. Même chemin que les tas.
   */
  const repereDe = useCallback((selecteur: string): [number, number, number] | null => {
    const r = document.querySelector(selecteur)?.getBoundingClientRect() ?? null
    if (r === null) return null
    return depuisEcran(
      r.left + r.width / 2,
      r.top + r.height / 2,
      Z_MAIN,
      window.innerWidth,
      window.innerHeight,
    )
  }, [])

  /**
   * LA CARTE QUI SOIGNE SE VERSE DANS LA BARRE DE VIE.
   *
   * Keko : « la potion il faudrait une animation aussi — et d'ailleurs toutes
   * les cartes qui soignent — où la carte va sur la barre d'HP avec une anim
   * de soin ». *La règle est posée sur l'EFFET et pas sur la potion* : toute
   * carte qui rend des PV y a droit, y compris un trésor brûlé.
   *
   * Même contrat que la garde : **l'état attend l'arrivée**, donc verrou
   * pendant le vol, et faute de barre à l'écran on joue la carte sans rien
   * montrer.
   */
  const soigner = useCallback(
    (index: number, depuis: [number, number, number]) => {
      const carte = combat.main[index]
      if (carte === undefined) return
      const poser = (): void => {
        dejaJouee.current = { id: carte.id, finAnimation: 0 }
        majCombat((c) => jouerCarte(c, index, -1))
      }
      const vers = repereDe('.vie-barre')
      if (vers === null) {
        poser()
        return
      }

      const cle = `s-${cleSuivante.current++}`
      setVerrou(true)
      setVersSoin({ cle, carte: aPeindre(carte), depuis, vers, debut: lireHorloge() })

      window.setTimeout(() => {
        poser()
        setChocSoin((n) => n + 1)
      }, TEMPS_SOIN * 1000)

      window.setTimeout(() => {
        setVersSoin(null)
        setVerrou(false)
      }, FIN_SOIN * 1000)
    },
    [combat, majCombat, repereDe],
  )

  /**
   * LA CARTE DE GARDE SE REPLIE SUR LE BOUCLIER.
   *
   * Keko : « quand on joue une carte d'armure, il faudrait une animation où la
   * carte va vers l'emplacement où est affiché l'armure ». *C'était le dernier
   * trou de la séquence* : une carte qui vise a sa chute sur le corps, une
   * carte défaussée a sa comète, et une garde ne faisait rien — elle
   * disparaissait au lâcher et un chiffre bleu changeait dans un coin.
   *
   * **L'ÉTAT ATTEND L'ARRIVÉE.** Si l'armure montait au lâcher, le bouclier
   * afficherait déjà son chiffre pendant que la carte vole vers lui : *on
   * verrait la conséquence avant la cause.* Même règle que la frappe, dont
   * l'état change à l'impact et pas à la tape — et donc même verrou d'entrée
   * pendant le vol.
   *
   * **Le bouclier est du HTML**, la carte vit dans le canvas : sa place se lit
   * dans le DOM et se reprojette avec `depuisEcran`, exactement comme les tas.
   * Faute de bouclier à l'écran, on joue la carte sans rien montrer — *une
   * animation ne doit jamais pouvoir empêcher un coup.*
   */
  const proteger = useCallback(
    (index: number, depuis: [number, number, number]) => {
      const carte = combat.main[index]
      if (carte === undefined) return
      const vers = repereDe('.vie-armure')
      const poser = (): void => {
        dejaJouee.current = { id: carte.id, finAnimation: 0 }
        majCombat((c) => jouerCarte(c, index, -1))
      }
      if (vers === null) {
        poser()
        return
      }

      const cle = `a-${cleSuivante.current++}`
      setVerrou(true)
      setVersArmure({ cle, carte: aPeindre(carte), depuis, vers, debut: lireHorloge() })

      window.setTimeout(() => {
        poser()
        setChocArmure((n) => n + 1)
      }, TEMPS_ARMURE * 1000)

      window.setTimeout(() => {
        setVersArmure(null)
        setVerrou(false)
      }, FIN_ARMURE * 1000)
    },
    [combat, majCombat, repereDe],
  )

  /**
   * LES CARTES QUI DEMANDENT UNE CIBLE, et les corps qu'on peut désigner.
   *
   * **Les morts gardent leur index mais sortent du champ** : les index de
   * cible sont ceux du moteur, et les décaler ici ferait viser le voisin.
   * Les envoyer au loin les rend simplement inatteignables.
   */
  const viseurs = useMemo(() => combat.main.map(viseUneCible), [combat.main])
  const cibles = useMemo(
    () =>
      combat.ennemis.map((e, i) =>
        e.pv > 0 ? (rang[i] ?? [9999, 9999, 0]) : ([9999, 9999, 0] as [number, number, number]),
      ),
    // `rang` se recalcule à chaque rendu : il suit le nombre d'ennemis.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [combat.ennemis],
  )

  /**
   * LE COUP, EN TROIS TEMPS : la carte s'abat, l'état change à l'impact, puis
   * la main est rendue. `frapper` est le seul endroit qui applique
   * `jouerCarte` sur une cible — la tape directe et le ciblage y passent tous
   * les deux.
   *
   * Le verrou passe de 220 à 450 ms par coup, et un coup qui tue le garde
   * plus longtemps : on ne rend pas la main tant que le corps n'est pas tombé.
   */
  const frapper = useCallback(
    (index: number, cible: number, depuis: [number, number, number]) => {
      const carte = combat.main[index]
      const vers = rang[cible]
      if (carte === undefined || vers === undefined) return
      const cons = consequence(combat, carte, cible)
      const cle = cleSuivante.current++
      setVerrou(true)
      setEnVol({ cle, carte: aPeindre(carte), depuis, vers, debut: lireHorloge() })

      window.setTimeout(() => {
        // LE TAS ENCAISSE QUAND LA CHUTE S'ACHÈVE, pas à l'impact : la carte
        // est encore à l'écran pendant tout ce temps-là.
        dejaJouee.current = { id: carte.id, finAnimation: TEMPS_FIN - TEMPS_IMPACT }
        majCombat((c) => jouerCarte(c, index, cible))
        setTouches((t) => ({ ...t, [cible]: lireHorloge() }))
        secouer('normale')
        setCoups((cs) => [...cs, { cle, cible, degats: carte.degats, tue: cons.tue }])
        // LE TAMPON TOMBE 90 ms APRÈS L'IMPACT : le coup d'abord, ce qu'il a
        // fait ensuite. L'ordre inverse ferait lire la mort comme la cause.
        if (cons.tue) window.setTimeout(() => setMorts((m) => ({ ...m, [cible]: lireHorloge() })), 90)
        window.setTimeout(() => setCoups((cs) => cs.filter((k) => k.cle !== cle)), 800)
      }, TEMPS_IMPACT * 1000)

      window.setTimeout(() => {
        setEnVol(null)
        setVerrou(false)
      }, TEMPS_FIN * 1000 + (cons.tue ? 900 : 0))
    },
    [combat, majCombat, rang],
  )

  /**
   * UNE FRAPPE SUR TOUT LE RANG, et c'est la séquence d'une frappe simple
   * RÉPÉTÉE PAR CORPS.
   *
   * La carte s'abat **au milieu du rang** plutôt que sur un corps : elle n'en
   * vise aucun, donc tomber sur l'un d'eux mentirait sur ce qu'elle fait.
   * Chaque corps encaisse ensuite sa part — son chiffre, sa secousse, son
   * tampon s'il tombe — parce que la règle du multi-cibles vaut ici aussi :
   * *on doit savoir qui a pris quoi.*
   *
   * Un seul `jouerCarte`, à l'impact : les règles frappent tout le monde d'un
   * coup, c'est le rendu qui s'égrène.
   */
  const frapperTous = useCallback(
    (index: number, depuis: [number, number, number]) => {
      const carte = combat.main[index]
      if (carte === undefined) return
      const montant =
        carte.effets?.reduce((t, e) => (e.type === 'degatsTous' ? t + e.montant : t), 0) ?? 0
      const vises = combat.ennemis
        .map((ennemi, i) => ({ ennemi, i }))
        .filter(({ ennemi }) => ennemi.pv > 0)
      // LE MILIEU DU RANG : la moyenne des corps debout, pas le centre de
      // l'écran — un rang d'un seul corps doit la voir tomber sur lui.
      const places = vises.map(({ i }) => rang[i]).filter((p) => p !== undefined)
      const milieu: [number, number, number] =
        places.length === 0
          ? [0, 0, 0]
          : [
              places.reduce((t, p) => t + p[0], 0) / places.length,
              places.reduce((t, p) => t + p[1], 0) / places.length,
              places.reduce((t, p) => t + p[2], 0) / places.length,
            ]
      const tue = vises.some(({ ennemi }) => montant >= ennemi.pv)
      const cle = cleSuivante.current++
      setVerrou(true)
      setEnVol({ cle, carte: aPeindre(carte), depuis, vers: milieu, debut: lireHorloge() })

      window.setTimeout(() => {
        dejaJouee.current = { id: carte.id, finAnimation: TEMPS_FIN - TEMPS_IMPACT }
        majCombat((c) => jouerCarte(c, index, -1))
        secouer('forte')
        const maintenant = lireHorloge()
        setTouches((t) => {
          const suite = { ...t }
          for (const { i } of vises) suite[i] = maintenant
          return suite
        })
        // CHAQUE CORPS A SA PROPRE CLÉ, tirée du même compteur que les coups
        // simples. Une clé dérivée de celle du vol (`cle * 100 + n`) finirait
        // par recouvrir celle d'un coup ordinaire, et le nettoyage de l'une
        // emporterait l'autre — *une clé ne se fabrique pas, elle se tire.*
        const cles = vises.map(() => cleSuivante.current++)
        setCoups((cs) => [
          ...cs,
          ...vises.map(({ ennemi, i }, n) => ({
            cle: cles[n]!,
            cible: i,
            degats: montant,
            tue: montant >= ennemi.pv,
          })),
        ])
        const tombes = vises.filter(({ ennemi }) => montant >= ennemi.pv)
        if (tombes.length > 0) {
          window.setTimeout(() => {
            const t = lireHorloge()
            setMorts((m) => {
              const suite = { ...m }
              for (const { i } of tombes) suite[i] = t
              return suite
            })
          }, 90)
        }
        window.setTimeout(() => setCoups((cs) => cs.filter((k) => !cles.includes(k.cle))), 800)
      }, TEMPS_IMPACT * 1000)

      window.setTimeout(() => {
        setEnVol(null)
        setVerrou(false)
      }, TEMPS_FIN * 1000 + (tue ? 900 : 0))
    },
    [combat, majCombat, rang],
  )

  /**
   * Jouer une carte.
   *
   * **Une carte qui ne vise personne part dès qu'on la lâche en zone de jeu**
   * — une garde, une potion, un coup qui frappe tout le rang n'ont rien à
   * désigner. Une carte qui vise, elle, part sur le corps que la flèche
   * tenait ; lâchée dans le vide, elle **revient dans la main** et rien n'est
   * joué.
   *
   * *C'est le même système qu'il y ait un corps debout ou cinq* : plus rien
   * n'est visé automatiquement. Keko : « il faudrait le même système qu'il y
   * ait une cible ou plusieurs ».
   */
  const jouer = useCallback(
    (index: number, depuis: [number, number, number], cible: number | null) => {
      setZoomee(null)
      const carte = combat.main[index]
      if (carte === undefined || fini || verrou) return
      if (carte.cout > combat.energie) return

      if (!viseUneCible(carte)) {
        // Une carte qui frappe TOUT LE RANG s'abat quand même : elle ne vise
        // personne, mais elle fait quelque chose, et ça doit se voir.
        if (portee(carte) === 'toutes') frapperTous(index, depuis)
        // LE SOIN PASSE AVANT LA GARDE : une carte qui ferait les deux n'a
        // qu'une scène à jouer, et rendre des PV est le geste le plus parlant.
        else if (carte.effets?.some((e) => e.type === 'soin') === true) soigner(index, depuis)
        else if (carte.effets?.some((e) => e.type === 'bloc') === true) proteger(index, depuis)
        else {
          // Celle-ci n'a pas de scène à jouer : elle disparaît au lâcher, donc
          // le tas encaisse tout de suite.
          dejaJouee.current = { id: carte.id, finAnimation: 0 }
          majCombat((c) => jouerCarte(c, index, -1))
        }
        return
      }
      if (cible === null) return
      // Elle part d'où on l'a VUE : sa place d'attente au-dessus de la main.
      frapper(index, cible, depuis)
    },
    [combat, fini, frapper, frapperTous, majCombat, proteger, soigner, verrou],
  )

  const reordonner = useCallback((de: number, vers: number) => {
    setZoomee(null)
    majCombat((c) => {
      const carte = c.main[de]
      if (carte === undefined) return c
      const restantes = c.main.filter((_, i) => i !== de)
      restantes.splice(Math.max(0, Math.min(restantes.length, vers)), 0, carte)
      return { ...c, main: restantes }
    })
  }, [majCombat])

  /**
   * LA FIN DU TOUR : les ennemis frappent CHACUN SON TOUR, avec sa propre
   * part de dégâts. Une salve simultanée ne se lit pas — on voit tout bouger
   * sans savoir qui a pris quoi. D'où la séquence, et un total qui s'égrène.
   *
   * Les règles se jouent d'un coup (`finDuTour`), mais **l'état ne s'applique
   * qu'une fois la salve passée** : entre-temps, ce sont les réserves
   * affichées (`salve`) qui descendent frappe par frappe, à l'impact de
   * chacune. Sinon les PV sautaient à leur valeur finale à la tape, avant que
   * le premier ennemi n'ait bougé — et la main se redistribuait sous les yeux
   * pendant que les bêtes bondissaient.
   */
  const terminer = useCallback(() => {
    if (fini || verrou) return
    setZoomee(null)
    const apres = finDuTour(combat, depart.rng)
    const frappes = apres.evenements
      .slice(combat.evenements.length)
      .filter((e): e is Extract<typeof e, { type: 'frappe' }> => e.type === 'frappe')

    // CE QUE LE CYCLE VA RACONTER, calculé sur l'état d'AVANT : combien de
    // cartes la pioche peut encore donner, et s'il faudra reverser la défausse
    // pour finir. `finDuTour` fait exactement ce calcul dans sa boucle.
    const cycle = {
      sortantes: combat.main.map((c) => c.id),
      avantMelange: Math.min(combat.pioche.length, apres.main.length),
      melange: apres.main.length > combat.pioche.length,
    }

    if (frappes.length === 0) {
      finDeTour.current = cycle
      majCombat(() => apres)
      return
    }

    // QUI FRAPPE : les évènements ne portent qu'un nom, et deux bêtes peuvent
    // le partager. On les apparie dans l'ordre des frappeurs — le même ordre
    // que `finDuTour` parcourt.
    const frappeurs = combat.ennemis
      .map((e, i) => ({ e, i }))
      .filter(({ e }) => e.pv > 0 && e.compteur <= 1)
      .map(({ i }) => i)

    setVerrou(true)
    setSalve({ pv: combat.pv, bloc: combat.bloc })
    let bloc = combat.bloc
    frappes.forEach((frappe, rang) => {
      const index = frappeurs[rang] ?? -1
      const debut = rang * PAS_ENTRE_FRAPPES
      window.setTimeout(() => {
        if (index >= 0) setAssauts((a) => ({ ...a, [index]: lireHorloge() }))
      }, debut * 1000)

      // L'IMPACT : le joueur encaisse ce qu'il encaisse VRAIMENT (bloc
      // déduit), et le bloc rend ce qu'il a absorbé.
      const absorbe = (combat.ennemis[index]?.degats ?? frappe.degats) - frappe.degats
      bloc = Math.max(0, bloc - absorbe)
      const blocApres = bloc
      window.setTimeout(() => {
        const cle = cleSuivante.current++
        setSalve({ pv: frappe.pvJoueur, bloc: blocApres })
        setRecus((r) => [...r, { cle, degats: frappe.degats }])
        secouer('forte')
        window.setTimeout(() => setRecus((r) => r.filter((k) => k.cle !== cle)), 800)
      }, (debut + INSTANT_IMPACT) * 1000)
    })

    // LA MAIN REVIENT AU JOUEUR quand le dernier bond a fini de retomber.
    const fin = (frappes.length - 1) * PAS_ENTRE_FRAPPES + DUREE_ASSAUT + 0.1
    window.setTimeout(() => {
      finDeTour.current = cycle
      majCombat(() => apres)
      setSalve(null)
      setAssauts({})
      setVerrou(false)
    }, fin * 1000)
  }, [combat, depart.rng, fini, majCombat, verrou])


  /**
   * LE COMBAT SE REFERME QUAND LA SCÈNE A FINI DE PARLER. Le verrou couvre le
   * dernier coup, tampon de mort compris ; on redonne ensuite la scène au
   * joueur une demi-seconde, puis le palier s'ouvre. `resoudreCombat` est
   * appelé HORS d'un `setState` : il consomme le RNG, et React double les
   * fonctions de mise à jour en mode strict.
   */
  useEffect(() => {
    if (!enCombat || combat.issue === null || verrou) return
    const t = window.setTimeout(() => setDescente(resoudreCombat(enCours, depart.rng)), RESPIRATION)
    return () => window.clearTimeout(t)
  }, [enCombat, combat.issue, verrou, enCours, depart.rng])

  // UN NOUVEAU COMBAT EFFACE LES MARQUES DE L'ANCIEN. Elles sont indexées par
  // rang d'ennemi : sans ça, le mort du palier précédent poserait sa tête de
  // mort sur le vivant qui prend sa place.
  useEffect(() => {
    setTouches({})
    setMorts({})
    setAssauts({})
    setCoups([])
    setRecus([])
    setSalve(null)
  }, [enCours.profondeur, graine])

  /**
   * LA DESCENTE PART DU CHARGEMENT, et elle y revient.
   *
   * `commencerDescente` construit le deck depuis les pièces équipées : c'est
   * la règle du jeu — *le deck est la somme de ce qu'on porte* — et c'est
   * exactement ce que l'armurerie sert à décider.
   */
  const descendreAuDonjon = useCallback(() => {
    if (!peutDescendre(hub.chargement)) return
    // LA MAIN DEMANDÉE PAR L'URL VAUT AUSSI POUR LES DESCENTES SUIVANTES :
    // sinon `?main=20` ne tiendrait que jusqu'au premier retour au hub.
    setDescente(
      commencerDescente(
        depart.rng,
        { ...REGLAGE_DEFAUT, tailleMain: TAILLE_MAIN_URL() },
        equipementPourTenir(equipement(hub.chargement), TAILLE_MAIN_URL()),
        hub.chargement.pile,
      ),
    )
  }, [depart.rng, hub])

  const bougerPiece = useCallback(
    (source: Slot, cible: Slot, id: string) => setHub((h) => deplacerPiece(h, source, cible, id)),
    [],
  )

  /**
   * REMONTER AU HUB. **Ce qui rentre n'est pas ce qu'on avait emporté** : les
   * potions bues se sont exilées du deck, donc `consommablesSurvivants` les
   * compte à l'état, sans rien tenir à part. Et la mort prend l'équipement —
   * le garde-fou qui rend de quoi repartir vit dans `perdreLEquipement`, là et
   * nulle part ailleurs.
   */
  const remonter = useCallback(
    (mort: boolean) => {
      setHub((h) =>
        mort
          ? perdreLEquipement(h)
          : rentrer(h, butinTransporte(enCours), consommablesSurvivants(enCours), tresorsTransportes(enCours)),
      )
      setDescente(null)
    },
    [enCours],
  )

  const choisirRecompense = useCallback(
    (index: number) => setDescente(choisirCarte(enCours, index, depart.rng)),
    [enCours, depart.rng],
  )

  /**
   * PRENDRE LE TRÉSOR : il tombe dans le deck, où il pèsera dès la main
   * suivante. **L'écran ne se referme pas pour autant** — c'est là qu'on
   * décide aussi de ce qu'on lâche, et refermer sur le premier geste punirait
   * l'exploration.
   */
  const prendreLoot = useCallback(
    () => setDescente(deplacerTresor(enCours, { ou: 'loot' }, { ou: 'deck' })),
    [enCours],
  )

  /**
   * LES TRÉSORS PORTÉS SONT LA MAIN. Pas une rangée de vignettes dans une
   * feuille : *c'est la main qu'on alourdit, donc c'est la main qu'on
   * montre*, avec son éventail, sa taille de carte et ses gestes.
   */
  /** Ce qui arrive et ce qu'on s'apprête à jeter, prêts à peindre. */
  const loot = useMemo(
    () => (phase.type === 'butin' && phase.loot !== null ? aPeindre(phase.loot) : null),
    [phase],
  )
  const aJeter = useMemo(
    () => (phase.type === 'butin' && phase.aJeter !== null ? aPeindre(phase.aJeter) : null),
    [phase],
  )
  const offres = useMemo(
    () => (phase.type === 'recompense' ? phase.cartes.map(aPeindre) : []),
    [phase],
  )

  const tresors = useMemo(
    () => enCours.deck.filter((c) => c.type === 'tresor').map(aPeindre),
    [enCours.deck],
  )

  /** Lâcher un trésor porté sur un emplacement l'y range. */
  const deposer = useCallback(
    (index: number, depuis: [number, number, number]) => {
      if (phase.type !== 'butin') return
      const carte = tresors[index]
      const ou = slotSous(depuis, window.innerHeight, phase.loot !== null)
      if (carte === undefined || ou === null) return
      setDescente(deplacerTresor(enCours, { ou: 'deck', id: carte.id }, { ou }))
    },
    [enCours, phase, tresors],
  )

  const rangerTresor = useCallback(
    (de: number, vers: number) => {
      const carte = tresors[de]
      if (carte === undefined) return
      setDescente(reordonnerTresors(enCours, carte.id, vers))
    },
    [enCours, tresors],
  )

  /**
   * Un trésor glissé DEPUIS un emplacement : vers l'autre, ou vers la main.
   * Le modèle est un `Lieu` des deux côtés, donc il n'y a pas de cas
   * particulier — *ce que la destination déloge repart d'où vient la carte.*
   */
  const deplacerDepuisSlot = useCallback(
    (source: 'loot' | 'jeter', cible: 'loot' | 'jeter' | 'deck') =>
      setDescente(deplacerTresor(enCours, { ou: source }, { ou: cible })),
    [enCours],
  )

  const reprendre = useCallback(
    () => setDescente(deplacerTresor(enCours, { ou: 'jeter' }, { ou: 'deck' })),
    [enCours],
  )
  const confirmerJet = useCallback(() => setDescente(validerJet(enCours)), [enCours])
  const terminerLeButin = useCallback(() => setDescente(terminerButin(enCours)), [enCours])

  const plusBas = useCallback(() => setDescente(descendre(enCours, depart.rng)), [enCours, depart.rng])
  const sortir = useCallback(() => setDescente(extraire(enCours)), [enCours])
  const recommencer = useCallback(() => {
    remonter(enCours.phase.type === 'fin' && enCours.phase.issue === 'mort')
    setGraine((g) => g + 1)
  }, [enCours, remonter])

  // Les étiquettes sont du HTML ancré sur les corps : `Projeter` les fait
  // suivre. On garde les éléments dans une ref, jamais dans l'état — leur
  // position change à chaque image.
  //
  // **DEUX POINTS PAR CRÉATURE, pas un seul avec des décalages en rem** : un
  // écart fixe ne suit pas la perspective, et la jauge se retrouvait posée au
  // milieu du corps. En projetant le haut de la tête et le bas des pattes, les
  // étiquettes tiennent leur place à toute distance et à toute taille d'écran.
  const hautes = useRef<(HTMLDivElement | null)[]>([])
  const centres = useRef<(HTMLDivElement | null)[]>([])
  const basses = useRef<(HTMLDivElement | null)[]>([])
  /**
   * UNE SILHOUETTE MESURÉE DOIT REPLACER LES ANCRES.
   *
   * La boîte du sujet n'est connue qu'une fois l'image chargée, donc APRÈS le
   * premier rendu : sans ce signal, les étiquettes resteraient calées sur le
   * cadre jusqu'au rendu suivant — qui arrive tout le temps en combat, et
   * JAMAIS sur un écran qui ne bouge pas. Même piège que les cibles de
   * `Projeter`.
   *
   * Il ne part qu'à la PREMIÈRE mesure, `silhouette.ts` s'en porte garant :
   * un signal qui reviendrait à chaque rendu serait la boucle infinie déjà
   * rencontrée sur les textures de cartes.
   */
  const [, remesure] = useState(0)
  const mesure = useCallback(() => remesure((n) => n + 1), [])

  /** Tout ce que la main ne doit PAS dessiner : ce qui s'abat, ce qu'on
   *  regarde, et ce qui vole encore depuis le paquet. */
  const enVolOuVolant = useMemo(() => {
    const ids = [...attendues]
    if (enVol !== null) ids.push(enVol.carte.id)
    if (versArmure !== null) ids.push(versArmure.carte.id)
    if (versSoin !== null) ids.push(versSoin.carte.id)
    if (zoomee !== null) ids.push(zoomee.id)
    return ids
  }, [attendues, enVol, versArmure, versSoin, zoomee])

  // LE DÉCOR SUIT CEUX QU'ON AFFRONTE, et il se relit à chaque combat. La part
  // de profondeur décide de quelle vue du camp : on s'y enfonce.
  const profondeurMax = Math.max(1, enCours.reglage.profondeurMax)
  const part = profondeurMax > 1 ? (enCours.profondeur - 1) / (profondeurMax - 1) : 0
  const decor = decorDuRang(
    combat.ennemis.map((e) => e.nom),
    part,
  )

  const ancres = rang.flatMap(
    (p, i) => {
      // LES ÉTIQUETTES SE POSENT SUR LE SUJET, PAS SUR SON CADRE. Toutes les
      // images font le même carré, mais un gobelin y laisse un quart de vide
      // au-dessus de la tête : son badge d'intention aurait flotté loin de lui.
      const boite = boiteDe(identiteEnnemi(combat.ennemis[i]?.nom ?? ''))
      return [
        // Les étiquettes SERRENT le corps d'un cran de plus depuis que le rang
        // est monté : c'est la place qu'on rend en haut et en bas de l'écran,
        // et elles flottaient un peu loin de la bête de toute façon.
        //
        // MAIS L'INTENTION SE POSE AU SOMMET DU CADRE, PAS DEDANS. Elle était
        // à 11,6 % SOUS le bord haut, calée à l'oeil sur les silhouettes SVG
        // qui laissent du ciel au-dessus d'elles ; la première image de Keko
        // monte à 1,3 % du bord, et le badge tombait pile sur le masque du
        // Cultiste. *Un repère calé sur la marge d'un dessin se déplace avec
        // le dessin* — au sommet du plan, il est au-dessus de la tête quelle
        // que soit l'image.
        [p[0], p[1] + HAUT_CORPS * (0.5 - boite.haut), p[2]],
        [p[0], p[1], p[2]],
        // Le petit écart sous les pattes est celui d'avant : la jauge ne colle
        // pas au corps, elle se pose en dessous.
        [p[0], p[1] - HAUT_CORPS * (0.5 - boite.bas) - CORPS * 0.012, p[2]],
      ] as [number, number, number][]
    },
  )

  return (
    <>
      {/* LE FOND, derrière tout : il était porté par le canvas, mais un canvas
          opaque ne laisse rien passer dessous — or c'est exactement ce qu'il
          faut pour glisser l'interface SOUS les cartes. */}
      {/* LE DONJON. Il vit sur le calque du fond, sous tout le reste : la scène
          est un canvas TRANSPARENT depuis que la carte qu'on tient doit passer
          devant les jauges. L'armurerie le couvre de son voile opaque — *c'est
          un lieu, pas un calque* — alors que les écrans de palier le laissent
          voir, puisqu'on est encore dans le donjon. */}
      <div className="fond-3d" style={{ backgroundImage: `url(${urlDuDecor(decor)})` }} />

      <Canvas
        shadows
        dpr={[1, 2]}
        // La position initiale suit le cadrage ; `Cadrage` la tient ensuite
        // à jour quand la fenêtre change.
        camera={{ position: [0, 0, zCamera(window.innerHeight)], fov: FOV }}
        // LE CANVAS EST TRANSPARENT, et le fond vit derrière lui : c'est ce
        // qui permet de glisser l'interface DESSOUS. Avec un fond sur le
        // canvas, tout ce qu'on met derrière disparaît.
        //
        // ET LA SCÈNE PASSE DEVANT TOUT LE TEMPS D'UN GESTE. Au repos, le
        // bouton de fin de tour et les lignes d'état restent au-dessus — il
        // faut pouvoir cliquer le bouton. Mais une carte qu'on tient ou qu'on
        // regarde ne doit passer sous rien : pendant ce temps on n'a besoin
        // d'aucune commande, donc la scène monte au-dessus et redescend au
        // lâcher. Keko : « la carte est toujours sous le bouton fin de tour
        // et les deux textes gris en haut ».
        //
        // ET UNE CARTE EN VOL COMPTE COMME UNE CARTE TENUE. Depuis que les
        // étiquettes des créatures passent devant le canvas, une carte qui
        // s'abat passerait DERRIÈRE la jauge du corps qu'elle frappe. Le
        // geste est fini, mais *ce qui est à l'écran est toujours une carte
        // de la main* — et l'entrée est verrouillée pendant tout le vol, donc
        // couvrir le bouton ne piège personne.
        //
        // MAIS SEULEMENT EN COMBAT. Sur l'écran de butin, la scène porte un
        // VOILE : la faire monter pendant un glisser le passait par-dessus les
        // boutons, qui s'assombrissaient d'un coup — Keko : « quand je drague
        // un trésor, le bouton terminer est grisé trop sombre ». Et il n'y a
        // rien à découvrir là-bas : aucun bouton ne surplombe la zone où l'on
        // promène la carte. *Une règle posée pour un écran ne se généralise
        // pas à ceux qui n'ont pas le même problème.*
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: ((saisie || enVol !== null) && enCombat) || zoomee !== null ? 4 : 2,
        }}
      >
        <ambientLight intensity={0.55} />
        {/* Le biais d'ombre éloigne la profondeur comparée d'un cheveu : sans
            lui, une surface s'ombre elle-même dès que la précision de la carte
            d'ombre est courte — ce qui arrive vite sur un téléphone. */}
        <directionalLight
          position={[2.5, 3.5, 4]}
          intensity={2.2}
          castShadow
          shadow-mapSize={[1024, 1024]}
          shadow-bias={-0.0008}
          shadow-normalBias={0.02}
        />
        <directionalLight position={[-4, 1, 2]} intensity={0.9} color="#8fb4ff" />

        {!auHub && combat.ennemis.map((ennemi, i) => (
          <Ennemi3D
            key={`${ennemi.nom}-${i}`}
            ennemi={ennemi}
            index={i}
            position={rang[i]!}
            visable={enCombat && visee.actif && !verrou}
            designe={visee.cible === i}
            touche={touches[i] ?? null}
            assaut={assauts[i] ?? null}
            mortDepuis={morts[i] ?? null}
            onMesure={mesure}
          />
        ))}

        {/* La carte qui s'abat vit sur la scène et non dans la main : un rendu
            de la main la balaierait en plein vol, et le coup en déclenche un. */}
        {versSoin !== null && (
          <CarteVersSoin
            key={versSoin.cle}
            carte={versSoin.carte}
            depuis={versSoin.depuis}
            vers={versSoin.vers}
            debut={versSoin.debut}
          />
        )}
        {versArmure !== null && (
          <CarteVersArmure
            key={versArmure.cle}
            carte={versArmure.carte}
            depuis={versArmure.depuis}
            vers={versArmure.vers}
            debut={versArmure.debut}
          />
        )}
        {enVol !== null && (
          <CarteQuiSAbat key={enVol.cle} carte={enVol.carte} depuis={enVol.depuis} vers={enVol.vers} debut={enVol.debut} />
        )}

        {/* LA CARTE QU'ON REGARDE DE PRÈS, au-dessus de tout le monde : la
            main de combat, celle du butin et les emplacements lui envoient la
            même carte. */}
        <Zoom3D
          carte={zoomee}
          set={zoomSet}
          onFermer={() => {
            setZoomee(null)
            setZoomSet([])
          }}
          onPeinte={compter}
        />

        <Horloge />
        <Cadrage />
        <ReperesDeLaMain />
        <Secousse />

        {/* LES ÉCRANS DE PALIER SONT DES VOILES sur la scène : on est encore
            dans le donjon, et le rang qu'on vient de vider reste derrière. */}
        {!auHub && phase.type === 'recompense' && (
          <Etal3D cartes={offres} onChoisir={choisirRecompense} onPeinte={compter} />
        )}
        {/* L'ARMURERIE : le premier écran, et celui où l'on revient. C'est un
            LIEU — son fond est opaque — alors que les paliers sont des voiles
            sur le donjon. */}
        {auHub && (
          <Armurerie3D
            hub={hub}
            onglet={onglet}
            defilement={defilement}
            onDeplacer={bougerPiece}
            onRegarder={(objet) => {
              setZoomee(pieceAPeindre(objet))
              setZoomSet(setAPeindre(objet))
            }}
            onRegarderTresor={(tresor) => {
              setZoomee(aPeindre(tresor))
              setZoomSet([])
            }}
            onDescendre={descendreAuDonjon}
            onSaisie={setSaisie}
            onPeinte={compter}
          />
        )}

        {!auHub && phase.type === 'butin' && (
          <>
            {/* LE VOILE D'ABORD : on est encore dans le donjon, le rang vidé
                reste derrière. `Etal3D` sans carte ne dessine que lui. */}
            <Etal3D cartes={[]} onPeinte={compter} />
            <Butin3D
              loot={loot}
              aJeter={aJeter}
              onDeplacer={deplacerDepuisSlot}
              onPrendreLoot={prendreLoot}
              onTerminer={terminerLeButin}
              onJeter={confirmerJet}
              onReprendre={reprendre}
              gestEnCours={saisie}
              onRegarder={setZoomee}
              onSaisie={setSaisie}
              onPeinte={compter}
              mainSurLeRebut={mainSurLeRebut}
            />
            {/* CE QU'ON EMPORTE EST LITTÉRALEMENT LA MAIN : même éventail,
                même taille, mêmes gestes. Rien ne s'y joue, donc rien n'y est
                grisé — la carte y est celle de l'emplacement d'à côté. */}
            <Main3D
              cartes={tresors}
              envolee={zoomee?.id ?? null}
              onJouer={deposer}
              onRegarder={(i) => setZoomee(tresors[i] ?? null)}
              onReordonner={rangerTresor}
              onPeinte={compter}
              onSaisie={setSaisie}
              // LE REBUT EST UNE PERTE, PAS UN DÉPÔT : la main en tire un
              // halo rouge au lieu du doré. *Un halo doré sur une carte qu'on
              // s'apprête à perdre dirait le contraire de ce qui va se passer.*
              zoneActive={(p) => {
                const ou = slotSous(p, window.innerHeight, phase.loot !== null)
                return ou === null ? 'non' : ou === 'jeter' ? 'peril' : 'depot'
              }}
              onZone={(n) => setMainSurLeRebut(n === 'peril')}
            />
          </>
        )}
        {!auHub && (phase.type === 'sortie' || phase.type === 'fin') && (
          <Etal3D cartes={[]} onPeinte={compter} />
        )}

        {/* CE QUI VOLE N'EST PAS LA CARTE, mais une traînée de lumière : elle
            n'a ni taille de carte ni inclinaison, donc elle ne peut pas être en
            désaccord avec la main qu'elle rejoint. */}
        {trajets.map((v) => (
          <Trainee
            key={v.cle}
            depuis={v.depuis}
            vers={v.vers}
            debut={v.debut}
            rotationDepart={v.rotationDepart}
          />
        ))}

        {/* LA DÉFAUSSE EST LA NAISSANCE À L'ENVERS : la carte s'embrase à sa
            place, puis c'est la traînée qui s'en va. */}
        {dissolutions.map((v) => (
          <CarteQuiSeDissout
            key={v.cle}
            carte={v.carte}
            place={v.place}
            rotation={v.rotation}
            debut={v.debut}
          />
        ))}

        {enCombat && (
        <Main3D
          cartes={main}
          jouables={jouables}
          envolee={enVolOuVolant}
          apparues={apparues}
          viseur={viseurs}
          cibles={cibles}
          onVise={marquerVisee}
          onJouer={jouer}
          onRegarder={(i) => setZoomee(main[i] ?? null)}
          onReordonner={reordonner}
          onPeinte={compter}
          onSaisie={setSaisie}
          verrou={verrou}
        />
        )}

        {/* LE SOL QUI RECOIT LES OMBRES SE TIENT JUSTE DERRIÈRE LA MAIN.

            Il était loin en arrière (z = −1,2), et la lumière vient d'en haut à
            droite : l'ombre d'une carte partait donc à plus d'une carte en bas
            à gauche d'elle, si loin qu'on ne la voyait qu'en levant la carte
            très haut. Keko : « l'ombre des cartes est trop loin de la carte ».
            *La distance entre l'objet et ce qui reçoit son ombre EST la
            longueur du jet* — rapprocher le sol est le seul réglage qui la
            raccourcisse sans toucher à la lumière.

            Au repos l'ombre affleure donc la carte ; elle s'en détache quand on
            la lève, ce qui dit la hauteur. `depthWrite` coupé : le plan passe
            devant les créatures, et il ne doit rien masquer d'autre que ce
            qu'il assombrit.

            Il N'EXISTE QUE PENDANT LE COMBAT : les cartes d'un écran de palier
            sont posées devant le voile, mais leur ombre tomberait derrière lui
            — on voyait trois rectangles noirs alignés sous les trois offres. */}
        {enCombat && (
          <mesh position={[0, 0, 0.9]} receiveShadow>
            <planeGeometry args={[16, 10]} />
            <shadowMaterial opacity={0.42} depthWrite={false} />
          </mesh>
        )}

        {/* L'ÉCART ENTRE LES CORPS, publié pour que les jauges s'y adaptent :
            à trois corps sur un téléphone, une largeur fixe les faisait se
            toucher. */}
        {!auHub && <ReperesDuRang rang={rang} />}

        <Projeter
          points={ancres}
          cibles={() =>
            combat.ennemis.flatMap((_, i) => [
              hautes.current[i] ?? null,
              centres.current[i] ?? null,
              basses.current[i] ?? null,
            ])
          }
        />

      </Canvas>

      {/* CE QUE CHAQUE CRÉATURE DIT D'ELLE-MÊME, ancré sur son corps :
          l'intention au-dessus de la tête, la jauge et le nom sous les pattes.
          En HTML plutôt qu'en volume — un chiffre reste net à toute distance,
          et il n'a rien à gagner à s'incliner avec la scène. */}
      <div className="ancres-3d" style={{ display: auHub ? 'none' : undefined }}>
        {combat.ennemis.map((e, i) => (
          <div key={`h-${e.nom}-${i}`} className="ancre-3d haute" ref={(el) => { hautes.current[i] = el }}>
            {/* L'INTENTION : ce qu'il frappe et dans combien de tours, allumée
                si c'est pour la fin de CE tour-ci. C'est le seul chiffre qui
                compte avant de choisir sa cible — la couleur porte le tempo,
                aucun mot n'est requis. */}
            {e.pv > 0 && (
              <span className={`intention-3d${e.compteur <= 1 ? ' imminent' : ''}`}>
                ✖ {e.degats}
                {e.compteur > 1 && <small> dans {e.compteur}</small>}
              </span>
            )}
          </div>
        ))}

        {combat.ennemis.map((e, i) => (
          <div key={`c-${e.nom}-${i}`} className="ancre-3d centre" ref={(el) => { centres.current[i] = el }}>
            {/* LE CHIFFRE DES DÉGÂTS saute au-dessus du corps touché. Une clé
                par coup : deux coups sur le même corps ne se superposent pas,
                et le nettoyage du premier ne coupe pas le second. */}
            {coups.filter((k) => k.cible === i).map((k) => (
              <span key={k.cle} className={`degats-3d${k.tue ? ' fatal' : ''}`}>−{k.degats}</span>
            ))}
            {/* LA TÊTE DE MORT S'ABAT COMME UN TAMPON : énorme et translucide,
                elle fond sur le corps, DÉPASSE sa taille de repos et y
                revient. C'est le dépassement qui fait le coup de tampon ; sans
                lui, un zoom inversé se lit comme un fondu qui rétrécit. */}
            {morts[i] !== undefined && (
              <span className="tampon-3d" dangerouslySetInnerHTML={{ __html: teteDeMort() }} />
            )}
          </div>
        ))}

        {combat.ennemis.map((e, i) => (
          <div key={`b-${e.nom}-${i}`} className="ancre-3d basse" ref={(el) => { basses.current[i] = el }}>
            {/* LA JAUGE ET LE NOM. Le chiffre est DANS la barre, au format
                `courant/max` : sans le maximum on ne sait pas si 23 est
                beaucoup, et à côté d'une barre il faut faire l'aller-retour
                entre les deux pour lire un seul fait. */}
            {e.pv > 0 && (
              <span className="vie-3d">
                <span className="jauge-3d">
                  <span className="remplissage-3d" style={{ width: `${(e.pv / e.pvMax) * 100}%` }} />
                  <span className="chiffre-3d">
                    {e.pv}/{e.pvMax}
                  </span>
                </span>
                <span className="nom-3d">{identiteEnnemi(e.nom)}</span>
              </span>
            )}
          </div>
        ))}
      </div>

      {/* L'INTERFACE RESTE EN HTML, au-dessus du canvas : des chiffres et un
          bouton n'ont rien à gagner à être en volume, et ils restent nets à
          toute taille d'écran. C'est la 3D qui sert la scène, pas l'inverse. */}
      <p className="build-3d">{__BUILD_TIME__}</p>
      {!pret && <p className="chargement-3d">Chargement…</p>}

      {pret && enCombat && (
        <div className="jeu-3d">
          {/* LES DEUX TAS TIENNENT LES COINS BAS, pioche à gauche et défausse
              à droite. Ils vivent DANS la ligne de jeu, qui est déjà en
              `pointer-events: none` : on ne les touche jamais, on les lit. */}
          {/* L'ORBE EST AU-DESSUS DE LA PIOCHE, dans la bande gauche avec tout
              ce qui est au joueur : sa pioche, son énergie, ses PV.

              LES DEUX COINS SONT DES COLONNES, et c'est ce qui évite de caler
              l'orbe sur une hauteur de tas écrite à la main : il s'empile, et
              si le tas change de taille il suit. */}
          {/* TOUT CE QUI EST AU JOUEUR TIENT L'ÉCART entre la pioche et la
              main : son énergie au-dessus, sa vie en dessous. */}
          {/* L'ORBE SE CENTRE DANS L'ÉCART entre la pioche et la main, la
              BARRE part du bord de l'écran. Ils ont d'abord partagé une
              colonne, et à 667 px de large l'écart ne fait que 83 px : la
              barre y mordait sur la première carte. *Un objet qui porte un
              chiffre a besoin d'une longueur, un objet qui marque une place a
              besoin d'un milieu* — les deux ne se calent pas pareil. */}
          <Orbe3D courant={combat.energie} max={combat.energieMax} />
          <div className="vie-bloc">
            {/* PENDANT LA SALVE, ce sont les réserves de `salve` qu'on montre :
                elles descendent frappe par frappe, à l'impact. */}
            <BarreVie3D
              pv={(salve ?? combat).pv}
              pvMax={combat.pvMax}
              armure={(salve ?? combat).bloc}
              menace={fini || salve !== null ? 0 : menace}
              encaisse={recus.length > 0}
              choc={chocArmure}
              soin={chocSoin}
            />
            {recus.map((k) => (
              <span key={k.cle} className="degats-3d recu">
                −{k.degats}
              </span>
            ))}
          </div>
          {/* LES DEUX TAS RÉAGISSENT AU MÉLANGE, et au même instant : c'est le
              seul moment où l'un se vide DANS l'autre. Keko : « on peut faire
              un effet de gonflement en même temps que le tremblement quand la
              pioche se remplit, et appliquer le même effet à la défausse quand
              elle se vide ? » */}
          <div className="coin-3d gauche">
            <Tas3D
              nom="pioche"
              compte={combat.pioche.length}
              brasse={brasse}
              choc={chocPioche}
            />
          </div>
          <div className="coin-3d droite">
            <Tas3D
              nom="defausse"
              compte={combat.defausse.length}
              brasse={brasse}
              choc={chocDefausse}
            />
          </div>

          <p className="note-3d">
            {fini
              ? combat.issue === 'victoire'
                ? 'Victoire'
                : 'Mort'
              : visee.actif
                ? 'Vise un corps'
                : `Tour ${combat.tour} · ${debout.length} debout`}
          </p>

          {/* LE BOUTON PORTE LE TOUR DE QUI C'EST : sans « Les ennemis
              frappent… », une seconde et demie sans réponse ressemble à un jeu
              qui a planté. */}
          <button className="fin-3d" type="button" onClick={terminer} disabled={fini || verrou}>
            {salve !== null ? 'Les ennemis frappent…' : 'Fin du tour'}
          </button>
        </div>
      )}

      {/* LE PANNEAU DU PALIER : le titre en haut, les boutons en bas, et la
          rangée de cartes entre les deux — dans le canvas, donc sous ce
          panneau en HTML. Il ne recouvre jamais les cartes : il les encadre. */}
      {pret && auHub && (
        <PageArmurerie
          hub={hub}
          onglet={onglet}
          onOnglet={(o) => {
            setOnglet(o)
            setDefilement(0)
          }}
          defilement={defilement}
          onDefilement={setDefilement}
          pvMax={combat.pvMax}
          energieMax={combat.energieMax}
          tailleMain={combat.tailleMain}
          zoomee={zoomee !== null}
        />
      )}

      {pret && !auHub && !enCombat && (
        <div className="palier-3d">
          {phase.type === 'recompense' && (
            <>
              <div className="haut-3d">
                <p className="titre-3d">Palier {enCours.profondeur} · une amélioration</p>
                <p className="sous-3d">Pour cette descente seulement. Tape la carte que tu emportes.</p>
              </div>
            </>
          )}

          {phase.type === 'butin' && (
            <>
              {/* LE POIDS SE DIT AVANT LE GESTE : un trésor pris est une carte
                  de plus dans le deck, et elle pèse dès la main suivante. Mais
                  il va DANS LE COIN, pas au milieu : le centre de l'écran
                  appartient au trésor qu'on décide, et centré, ce texte
                  s'asseyait sur son bord haut. */}
              <p className="note-3d">
                Tu portes {tresorsAuDeck(enCours)} trésor{tresorsAuDeck(enCours) > 1 ? 's' : ''} ·{' '}
                {butinTransporte(enCours)} d'or
              </p>
            </>
          )}

          {phase.type === 'sortie' && (
            <>
              <div className="haut-3d">
                <p className="titre-3d">Point de sortie · palier {enCours.profondeur}</p>
                <p className="sous-3d">
                  {combat.pv}/{combat.pvMax} PV · {butinTransporte(enCours)} d'or dans le deck. Mourir prend tout.
                </p>
              </div>
              <div className="choix-3d">
                <button type="button" className="bouton-3d refuser" onClick={sortir}>
                  Ressortir
                </button>
                <button type="button" className="bouton-3d prendre" onClick={plusBas}>
                  Descendre
                </button>
              </div>
            </>
          )}

          {phase.type === 'fin' && (
            <>
              <div className="haut-3d">
                <p className="titre-3d">{phase.issue === 'extrait' ? 'Extrait' : 'Mort'}</p>
                <p className="sous-3d">
                  {phase.issue === 'extrait'
                    ? `Tu rapportes ${butinTransporte(enCours)} d'or.`
                    : 'Le butin et l\'équipement sont perdus.'}
                </p>
              </div>
              <div className="choix-3d">
                <button type="button" className="bouton-3d prendre" onClick={recommencer}>
                  {/* IL RAMÈNE À L'ARMURERIE, et il le dit. « Nouvelle
                      descente » annonçait un combat alors qu'on arrive sur un
                      écran de chargement — *un bouton nomme ce qu'il ouvre,
                      pas ce qui viendra après.* */}
                  Retour à l'armurerie
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </>
  )
}

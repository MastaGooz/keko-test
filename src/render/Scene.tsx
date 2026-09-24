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
import { LIGNE_DE_JEU, Main3D, Z_TENUE } from './Main3D.tsx'
import { CORPS, Ennemi3D } from './Ennemi3D.tsx'
import { Projeter } from './Projeter.tsx'
import { CarteQuiSAbat, TEMPS_FIN, TEMPS_IMPACT } from './CarteQuiSAbat.tsx'
import { Horloge, lireHorloge } from './horloge.tsx'
import { Cadrage, FOV, zCamera } from './Cadrage.tsx'
import { Secousse, secouer } from './Secousse.tsx'
import { DUREE_ASSAUT, INSTANT_IMPACT } from './Ennemi3D.tsx'
import { Etal3D } from './Palier3D.tsx'
import { Butin3D, slotSous } from './Butin3D.tsx'
import { Zoom3D } from './Zoom3D.tsx'
import { aPeindre, descenteDeDepart } from './combat-3d.ts'
import type { EtatCombat } from '../logic/combat.ts'
import { consequence, finDuTour, jouable, jouerCarte, menaceDuTour, viseUneCible, vivants } from '../logic/combat.ts'
import type { Descente } from '../logic/descente.ts'
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

/**
 * Le temps entre deux ennemis d'une même salve. **Il doit dépasser un assaut
 * complet, secousse comprise** (580 + 260 ms) : sinon l'élan du suivant
 * démarre pendant la secousse du précédent, et l'anticipation — tout
 * l'intérêt du geste — se fait secouer. Règle du 2D, mesurée sur le deuxième
 * monstre.
 */
const PAS_ENTRE_FRAPPES = 0.62

/** Ce que le joueur encaisse, pour le chiffre qui saute à côté de ses PV. */
type CoupRecu = { cle: number; degats: number }

/** Les réserves du joueur telles qu'on les MONTRE pendant la salve. */
type Salve = { pv: number; bloc: number }

/**
 * La seed de départ. « Nouvelle descente » l'incrémente.
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
  const [descente, setDescente] = useState<Descente>(depart.descente)
  const combat = descente.combat
  const phase = descente.phase
  const enCombat = phase.type === 'combat'

  /**
   * Le combat est une PHASE de la descente, donc on ne le remplace jamais
   * seul : on repose la descente autour de lui. Tout ce qui suit continue de
   * raisonner sur `combat`, c'est le seul endroit qui sache les recoller.
   */
  const majCombat = useCallback(
    (f: (c: EtatCombat) => EtatCombat) => setDescente((d) => ({ ...d, combat: f(d.combat) })),
    [],
  )
  /**
   * LE ZOOM PORTE LA CARTE, PAS UN INDEX DE MAIN. Index, il était enfermé dans
   * `combat.main` : impossible de regarder de près le trésor posé dans un
   * emplacement du butin. C'est la leçon du jeu 2D, reprise telle quelle.
   */
  const [zoomee, setZoomee] = useState<CarteAPeindre | null>(null)
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
    return [(i - centre) * (CORPS * 1.25), 0.75, 0] as [number, number, number]
  })
  // CE QU'ON PEUT JOUER MAINTENANT : assez d'énergie, et le combat n'est pas
  // fini. Un trésor n'est jouable par personne — il ne fait qu'occuper une
  // place de main.
  const jouables = useMemo(
    () => combat.main.map((c) => !fini && jouable(c) && c.cout <= combat.energie),
    [combat.main, combat.energie, fini],
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
    (index: number, _depuis: [number, number, number], cible: number | null) => {
      setZoomee(null)
      const carte = combat.main[index]
      if (carte === undefined || fini || verrou) return
      if (carte.cout > combat.energie) return

      if (!viseUneCible(carte)) {
        majCombat((c) => jouerCarte(c, index, -1))
        return
      }
      if (cible === null) return
      // La carte part de sa place d'attente : au centre, juste au-dessus de
      // la main. C'est de là qu'on l'a vue se poser.
      frapper(index, cible, [0, LIGNE_DE_JEU, Z_TENUE])
    },
    [combat, fini, frapper, majCombat, verrou],
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

    if (frappes.length === 0) {
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
    const t = window.setTimeout(() => setDescente(resoudreCombat(descente, depart.rng)), RESPIRATION)
    return () => window.clearTimeout(t)
  }, [enCombat, combat.issue, verrou, descente, depart.rng])

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
  }, [descente.profondeur, graine])

  // Une descente neuve repart de son propre tirage.
  useEffect(() => setDescente(depart.descente), [depart])

  const choisirRecompense = useCallback(
    (index: number) => setDescente(choisirCarte(descente, index, depart.rng)),
    [descente, depart.rng],
  )

  /**
   * PRENDRE LE TRÉSOR : il tombe dans le deck, où il pèsera dès la main
   * suivante. **L'écran ne se referme pas pour autant** — c'est là qu'on
   * décide aussi de ce qu'on lâche, et refermer sur le premier geste punirait
   * l'exploration.
   */
  const prendreLoot = useCallback(
    () => setDescente(deplacerTresor(descente, { ou: 'loot' }, { ou: 'deck' })),
    [descente],
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
    () => descente.deck.filter((c) => c.type === 'tresor').map(aPeindre),
    [descente.deck],
  )

  /** Lâcher un trésor porté sur un emplacement l'y range. */
  const deposer = useCallback(
    (index: number, depuis: [number, number, number]) => {
      if (phase.type !== 'butin') return
      const carte = tresors[index]
      const ou = slotSous(depuis, window.innerHeight, phase.loot !== null)
      if (carte === undefined || ou === null) return
      setDescente(deplacerTresor(descente, { ou: 'deck', id: carte.id }, { ou }))
    },
    [descente, phase, tresors],
  )

  const rangerTresor = useCallback(
    (de: number, vers: number) => {
      const carte = tresors[de]
      if (carte === undefined) return
      setDescente(reordonnerTresors(descente, carte.id, vers))
    },
    [descente, tresors],
  )

  /**
   * Un trésor glissé DEPUIS un emplacement : vers l'autre, ou vers la main.
   * Le modèle est un `Lieu` des deux côtés, donc il n'y a pas de cas
   * particulier — *ce que la destination déloge repart d'où vient la carte.*
   */
  const deplacerDepuisSlot = useCallback(
    (source: 'loot' | 'jeter', cible: 'loot' | 'jeter' | 'deck') =>
      setDescente(deplacerTresor(descente, { ou: source }, { ou: cible })),
    [descente],
  )

  /** Taper « Jeter » vide y envoie le trésor qui arrive : c'est le refus. */
  const refuserLeLoot = useCallback(
    () => setDescente(deplacerTresor(descente, { ou: 'loot' }, { ou: 'jeter' })),
    [descente],
  )
  const reprendre = useCallback(
    () => setDescente(deplacerTresor(descente, { ou: 'jeter' }, { ou: 'deck' })),
    [descente],
  )
  const confirmerJet = useCallback(() => setDescente(validerJet(descente)), [descente])
  const terminerLeButin = useCallback(() => setDescente(terminerButin(descente)), [descente])

  const plusBas = useCallback(() => setDescente(descendre(descente, depart.rng)), [descente, depart.rng])
  const sortir = useCallback(() => setDescente(extraire(descente)), [descente])
  const recommencer = useCallback(() => setGraine((g) => g + 1), [])

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
  const ancres = rang.flatMap(
    (p) =>
      [
        [p[0], p[1] + CORPS * 0.62, p[2]],
        [p[0], p[1], p[2]],
        [p[0], p[1] - CORPS * 0.62, p[2]],
      ] as [number, number, number][],
  )

  return (
    <>
      {/* LE FOND, derrière tout : il était porté par le canvas, mais un canvas
          opaque ne laisse rien passer dessous — or c'est exactement ce qu'il
          faut pour glisser l'interface SOUS les cartes. */}
      <div className="fond-3d" />

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
        style={{ position: 'fixed', inset: 0, zIndex: saisie || zoomee !== null ? 4 : 2 }}
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

        {combat.ennemis.map((ennemi, i) => (
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
          />
        ))}

        {/* La carte qui s'abat vit sur la scène et non dans la main : un rendu
            de la main la balaierait en plein vol, et le coup en déclenche un. */}
        {enVol !== null && (
          <CarteQuiSAbat key={enVol.cle} carte={enVol.carte} depuis={enVol.depuis} vers={enVol.vers} debut={enVol.debut} />
        )}

        {/* LA CARTE QU'ON REGARDE DE PRÈS, au-dessus de tout le monde : la
            main de combat, celle du butin et les emplacements lui envoient la
            même carte. */}
        <Zoom3D carte={zoomee} onFermer={() => setZoomee(null)} onPeinte={compter} />

        <Horloge />
        <Cadrage />
        <Secousse />

        {/* LES ÉCRANS DE PALIER SONT DES VOILES sur la scène : on est encore
            dans le donjon, et le rang qu'on vient de vider reste derrière. */}
        {phase.type === 'recompense' && (
          <Etal3D cartes={offres} onChoisir={choisirRecompense} onPeinte={compter} />
        )}
        {phase.type === 'butin' && (
          <>
            {/* LE VOILE D'ABORD : on est encore dans le donjon, le rang vidé
                reste derrière. `Etal3D` sans carte ne dessine que lui. */}
            <Etal3D cartes={[]} onPeinte={compter} />
            <Butin3D
              loot={loot}
              aJeter={aJeter}
              onJeterLeLoot={refuserLeLoot}
              onDeplacer={deplacerDepuisSlot}
              onRegarder={setZoomee}
              onSaisie={setSaisie}
              onPeinte={compter}
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
              zoneActive={(p) => slotSous(p, window.innerHeight, phase.loot !== null) !== null}
            />
          </>
        )}
        {(phase.type === 'sortie' || phase.type === 'fin') && <Etal3D cartes={[]} onPeinte={compter} />}

        {enCombat && (
        <Main3D
          cartes={main}
          jouables={jouables}
          envolee={enVol?.carte.id ?? zoomee?.id ?? null}
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

        {/* LE SOL QUI RECOIT LES OMBRES N'EXISTE QUE PENDANT LE COMBAT. Les
            cartes d'un ecran de palier sont posees DEVANT le voile, mais leur
            ombre, elle, tombe derriere lui : on voyait trois rectangles noirs
            alignes sous les trois offres, qui ne se lisaient ni comme des
            ombres ni comme rien d'autre. *Une ombre portee sur un decor qu'on
            vient de masquer ne raconte plus le meme objet.* */}
        {enCombat && (
          <mesh position={[0, 0, -1.2]} receiveShadow>
            <planeGeometry args={[16, 10]} />
            <shadowMaterial opacity={0.5} />
          </mesh>
        )}

        <Projeter
          points={ancres}
          cibles={combat.ennemis.flatMap((_, i) => [
            hautes.current[i] ?? null,
            centres.current[i] ?? null,
            basses.current[i] ?? null,
          ])}
        />
      </Canvas>

      {/* CE QUE CHAQUE CRÉATURE DIT D'ELLE-MÊME, ancré sur son corps :
          l'intention au-dessus de la tête, la jauge et le nom sous les pattes.
          En HTML plutôt qu'en volume — un chiffre reste net à toute distance,
          et il n'a rien à gagner à s'incliner avec la scène. */}
      <div className="ancres-3d">
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
                <span className="nom-3d">{e.nom}</span>
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
        <div className="etat-3d">
            <span className="orbe-3d">
              {combat.energie}
              <small>/{combat.energieMax}</small>
            </span>
            {/* LE JOUEUR N'A PAS DE CORPS : c'est son compteur de PV qui
                tressaille, et le chiffre saute à côté. Pendant la salve, ce
                sont les réserves de `salve` qu'on montre — elles descendent
                frappe par frappe, à l'impact. */}
            <span className={`pv-3d${recus.length > 0 ? ' encaisse' : ''}`}>
              {(salve ?? combat).pv}
              <small>/{combat.pvMax}</small>
              {recus.map((k) => (
                <span key={k.cle} className="degats-3d recu">
                  −{k.degats}
                </span>
              ))}
            </span>
            {(salve ?? combat).bloc > 0 && <span className="bloc-3d">⛉ {(salve ?? combat).bloc}</span>}
          {menace > 0 && !fini && salve === null && <span className="menace-3d">−{menace}</span>}
        </div>
      )}

      {pret && enCombat && (
        <div className="jeu-3d">
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
      {pret && !enCombat && (
        <div className="palier-3d">
          {phase.type === 'recompense' && (
            <>
              <div className="haut-3d">
                <p className="titre-3d">Palier {descente.profondeur} · une amélioration</p>
                <p className="sous-3d">Pour cette descente seulement. Tape la carte que tu emportes.</p>
              </div>
            </>
          )}

          {phase.type === 'butin' && (
            <>
              <div className="haut-3d">
                <p className="titre-3d">
                  {phase.aJeter !== null
                    ? `Tu vas perdre ${phase.aJeter.nom}`
                    : phase.loot === null
                      ? 'Ton chargement'
                      : `${phase.loot.nom} · ${phase.loot.valeur ?? 0} d'or`}
                </p>
              {/* LE POIDS SE DIT AVANT LE GESTE : un trésor pris est une carte
                  de plus dans le deck, et elle pèse dès la main suivante. */}
                {/* LE POIDS SE DIT AVANT LE GESTE : un trésor pris est une
                    carte de plus dans le deck, et elle pèse dès la main
                    suivante. */}
                <p className="sous-3d">
                  Tu portes {tresorsAuDeck(descente)} trésor{tresorsAuDeck(descente) > 1 ? 's' : ''} ·{' '}
                  {butinTransporte(descente)} d'or · glisse un trésor sur « Jeter » pour l'abandonner
                </p>
              </div>
              {/* LES BOUTONS PASSENT AU BORD DROIT : le bas de l'écran est
                  à la main, comme en combat, et c'est là que le pouce trouve
                  déjà « Fin du tour ».

                  ILS AGISSENT, ILS N'ATTENDENT PAS. « Prendre » tant qu'il y a
                  un trésor à décider, « Terminer » ensuite — un bouton qui
                  reste désactivé en énonçant ce qui manque ne fait rien. */}
              <div className="actions-3d">
                {phase.aJeter !== null && (
                  <>
                    {/* JETER DEMANDE DEUX GESTES : on voit ce qu'on s'apprête
                        à perdre, puis on valide. Et l'autre issue est posée
                        juste à côté — un glisser qu'il faut deviner ne vaut
                        pas un bouton qui dit le choix inverse. */}
                    <button type="button" className="bouton-3d perdre" onClick={confirmerJet}>
                      Jeter — {phase.aJeter.valeur ?? 0} d'or
                    </button>
                    <button type="button" className="bouton-3d garder" onClick={reprendre}>
                      Reprendre
                    </button>
                  </>
                )}
                {phase.aJeter === null && phase.loot !== null && (
                  <button type="button" className="bouton-3d prendre" onClick={prendreLoot}>
                    Prendre
                  </button>
                )}
                {phase.aJeter === null && phase.loot === null && (
                  <button type="button" className="bouton-3d prendre" onClick={terminerLeButin}>
                    Terminer
                  </button>
                )}
              </div>
            </>
          )}

          {phase.type === 'sortie' && (
            <>
              <div className="haut-3d">
                <p className="titre-3d">Point de sortie · palier {descente.profondeur}</p>
                <p className="sous-3d">
                  {combat.pv}/{combat.pvMax} PV · {butinTransporte(descente)} d'or dans le deck. Mourir prend tout.
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
                    ? `Tu rapportes ${butinTransporte(descente)} d'or.`
                    : 'Le butin et l\'équipement sont perdus.'}
                </p>
              </div>
              <div className="choix-3d">
                <button type="button" className="bouton-3d prendre" onClick={recommencer}>
                  Nouvelle descente
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </>
  )
}

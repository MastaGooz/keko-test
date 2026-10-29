/**
 * LE JEU : DEUX PAGES ET LA BARRE QUI LES RELIE.
 *
 * Keko : « une interface de navigation qui va nous permettre de passer de
 * l'ouverture de booster à la collection des cartes acquises. Inspire-toi de
 * lexicodex. »
 *
 * **LA BARRE EST CELLE DE LEXICODEX** : une pilule en haut, « Collection » à
 * gauche, un bouton rond au milieu qui est le booster, et à droite ce qu'on a
 * déjà réuni. *Le booster est au centre parce que c'est le geste du jeu* ; la
 * collection est ce qu'on va voir entre deux.
 *
 * ***ELLE NE SE MONTRE QUE QUAND RIEN NE SE JOUE*** : le sachet qui attend, le
 * bilan. Pendant la déchirure et le défilé elle disputerait l'écran à la carte
 * — c'est la même raison qui a fait partir le bandeau « Dernière carte ».
 *
 * **CHANGER DE PAGE DÉMONTE LE PAQUET**, et il le faut : *une scène WebGL qui
 * tourne derrière une grille paie son image pour rien*, sur un téléphone. Le
 * numéro du paquet survit, lui (`numeroCourant`) : on ne retombe pas sur le
 * même tirage, et un sachet qu'on n'a pas ouvert reste le même.
 */
import '../ui/collection.css'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { CarteEmoji, RoleCarte } from '../logic/emoji/types.ts'
import type { Bonus } from '../logic/emoji/tirage.ts'
import {
  ajouterPaquet,
  compteDe,
  ajouterExemplaires,
  debloquer,
  retirer,
  oublier,
  fusionner,
  fusionnerTout,
  fusionnables,
  niveauDe,
  nombreDeNouvelles,
  toutVu,
  type Collection,
  type Variante,
} from '../logic/emoji/collection.ts'
import { declarerLesNiveaux } from './carte-emoji.ts'
import { createRng } from '../logic/rng.ts'
import { chargerCollection, chargerDecks, chargerLieux, chargerReserve, sauverCollection, sauverDecks, sauverLieux, sauverReserve } from '../ui/collection.ts'
import { avecOr, lieuDe, ouvrirLeCoffre, ouvrirLeLieu, remplirLaJauge, valeurDansLeLieu, type EtatLieux } from '../logic/emoji/lieux.ts'
import { RESERVE, prendreUnPaquet, prochainDans, reserveAJour, type Reserve } from '../logic/emoji/reserve.ts'
import {
  DECK,
  DECKS_MAX,
  ajouterDeck,
  basculerDansDeck,
  deckComplet,
  deckQuiTient,
  decksAJour,
  disponibles,
  garderPossedeesPartout,
  likesDeLaMain,
  valeurParRarete,
  supprimerDeck,
  renommerDeck,
  nomDuDeck,
  decksQuiPerdent,
  garderLesLieuxOuverts,
  poserSurLieu,
  avecDecksDeTest,
  exemplairesManquants,
  type Deck,
  type CompteDExemplaires,
  type Decks,
  type EntreeDeck,
} from '../logic/emoji/deck.ts'
import { chargerEmojis } from '../ui/emoji.ts'
import { Paquet3D } from './Paquet3D.tsx'
import { PageCollection } from './Collection.tsx'
import { PageJouer, type MainTombee } from './Deck.tsx'
import { PageDecks } from './Decks.tsx'
import { SON_CLIC_POP, amorcerLeSon, jouerSon, precharger, reveillerLeSon } from './sons.ts'
import { FondAnime } from './FondAnime.tsx'
import { demanderLInclinaison } from './inclinaison.ts'
import { toileDuTitre } from './texture-carte.ts'
import { penchantAuSurvol } from './survol.ts'

/**
 * LES PAGES. `collection` et `catalogue` sont les deux entrées du menu
 * « Cartes » (Keko : « renommer "collection" par "cartes" en haut, et quand un
 * clic sur carte on développe un menu déroulant avec : collection (ce qu'on a
 * actuellement) / toutes les cartes (liste de toutes les cartes) »). Le
 * catalogue est la même page que la collection, avec les cartes qu'on n'a pas
 * encore en grisé. `deck` (composer le deck, la même grille en mode deck) et
 * `jouer` (le regarder jouer) sont les deux entrées du menu « Deck », à droite
 * — la place des stickers, partis avec la fusion (Keko).
 */
type Page = 'booster' | 'collection' | 'catalogue' | 'decks' | 'deck' | 'jouer'

/** `&illimite` : la réserve ne se vide jamais — pour tester sans attendre. */
const ILLIMITE = new URLSearchParams(location.search).has('illimite')
/** `&page=` : la page ouverte d'emblée (voir `accueil`) ; autre chose, ignoré. */
const PAGE_DEMANDEE = ((): Page | null => {
  const p = new URLSearchParams(location.search).get('page')
  return p === 'booster' || p === 'collection' || p === 'catalogue' || p === 'decks' || p === 'deck' || p === 'jouer' ? p : null
})()

/** 9:58 — les minutes sans zéro devant, les secondes avec. */
function minuteur(ms: number): string {
  const s = Math.max(0, Math.ceil(ms / 1000))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

/**
 * LA RÉSERVE SOUS LA BARRE, comme chez lexicodex (« 3/3 aujourd'hui ») : une
 * case par paquet, les pleines en or, et le temps avant le suivant.
 */
function JaugeDeReserve({ paquets, dans }: { paquets: number; dans: number | null }): React.ReactElement {
  return (
    <div className="reserve">
      <span className="reserve-jauge">
      <div className="reserve-cases" aria-hidden>
        {Array.from({ length: RESERVE.max }, (_, i) => (
          <i key={i} className={i < paquets ? 'pleine' : ''} />
        ))}
      </div>
      <p className="reserve-texte">
        <b>{paquets}</b>/{RESERVE.max} paquet{paquets > 1 ? 's' : ''}
        {dans !== null && <span className="reserve-dans"> · +1 dans {minuteur(dans)}</span>}
      </p>
      </span>
    </div>
  )
}

/**
 * PLUS DE PAQUET : l'écran d'attente. *Le fond du paquet reste*, et ce qu'il
 * dit tient en une ligne — quand vient le suivant. **Il s'efface tout seul** :
 * à la seconde où le paquet arrive, le sachet descend.
 */
function Attente({ dans, onCollection }: { dans: number | null; onCollection: () => void }): React.ReactElement {
  return (
    <div className="attente">
      <div className="paquet-fond" />
      <FondAnime />
      <div className="attente-corps">
        <p className="attente-titre">Plus de paquet</p>
        <p className="attente-minuteur">{dans === null ? '…' : minuteur(dans)}</p>
        <p className="attente-texte">avant le prochain</p>
        <button type="button" className="collection-bouton" onClick={onCollection}>
          Voir ma collection
        </button>
      </div>
    </div>
  )
}

/**
 * L'ÉCRAN D'ACCUEIL : le titre, et « Touchez pour jouer ». Keko : « mettre
 * plutôt une étape globale tout au début de l'app : touchez pour jouer, un
 * genre d'écran d'accueil ».
 *
 * ***C'EST LUI QUI REND LE SON À LA PAGE*** — le rôle qu'avait la prise du
 * sachet : sur tactile, un contexte audio ne démarre que depuis un geste, et
 * c'est un RELÂCHEMENT qui compte (`pointerup`). On l'amorce là, une fois.
 * **Le paquet n'est monté qu'après** : son sachet arrive alors d'en haut, au
 * lieu d'être déjà là quand l'accueil s'efface.
 */
function Accueil({ onJouer }: { onJouer: () => void }): React.ReactElement {
  const toile = useRef<HTMLCanvasElement>(null)
  const [masque, setMasque] = useState<string | null>(null)
  useEffect(() => {
    let vivant = true
    // PEINT AU DOUBLE DE SA PLACE, puis rogné au dessin : la toile du titre est
    // bien plus large que le mot (Keko : « le titre trop petit »).
    const l = Math.min(Math.min(window.innerWidth * 0.9, 640) * Math.min(window.devicePixelRatio || 1, 2) * 2, 2600)
    void toileDuTitre(l).then((source) => {
      const t = toile.current
      const ctx = t?.getContext('2d')
      if (!vivant || t == null || ctx == null) return
      const [x, y, w, h] = cadreDuDessin(source)
      t.width = w
      t.height = h
      ctx.drawImage(source, x, y, w, h, 0, 0, w, h)
      setMasque(t.toDataURL())
    })
    return () => {
      vivant = false
    }
  }, [])
  const pret = masque !== null
  return (
    <button
      type="button"
      className={`accueil${pret ? ' accueil-secoue' : ''}`}
      onPointerUp={() => {
        amorcerLeSon()
        reveillerLeSon()
        // ET LE GYROSCOPE, du même geste : voir `demanderLInclinaison`.
        demanderLInclinaison()
        onJouer()
      }}
    >
      <div className="paquet-fond" />
      <FondAnime />
      {/* LE TITRE TOMBE ET FRAPPE (Keko : « pas assez juicy ») : il chute de
          haut, s'écrase, rebondit ; à l'impact l'écran tremble, un éclair et
          une gerbe d'étincelles d'or partent ; puis il respire, et un reflet le
          balaie, découpé au dessin (le titre lui sert de masque). */}
      <div className={`accueil-logo${pret ? ' accueil-pret' : ''}`}>
        <span className="accueil-halo" />
        <canvas ref={toile} className="accueil-titre" />
        {pret && (
          <>
            <span className="accueil-reflet" style={{ maskImage: `url(${masque})`, WebkitMaskImage: `url(${masque})` }} />
            <span className="accueil-eclair" />
            {ETINCELLES_ACCUEIL.map((e, i) => (
              <span key={i} className="accueil-etincelle" style={e} />
            ))}
          </>
        )}
      </div>
      <span className="paquet-invite accueil-invite">Touchez pour jouer</span>
    </button>
  )
}

/** Le rectangle [x, y, l, h] de ce qui est peint (alpha visible), avec un peu d'air. */
function cadreDuDessin(t: HTMLCanvasElement): [number, number, number, number] {
  const ctx = t.getContext('2d')
  if (ctx === null) return [0, 0, t.width, t.height]
  const { data, width, height } = ctx.getImageData(0, 0, t.width, t.height)
  let x0 = width
  let y0 = height
  let x1 = -1
  let y1 = -1
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++)
      if (data[(y * width + x) * 4 + 3]! > 8) {
        if (x < x0) x0 = x
        if (x > x1) x1 = x
        if (y < y0) y0 = y
        if (y > y1) y1 = y
      }
  if (x1 < 0) return [0, 0, t.width, t.height]
  const air = Math.round((x1 - x0) * 0.03)
  x0 = Math.max(0, x0 - air)
  y0 = Math.max(0, y0 - air)
  x1 = Math.min(width - 1, x1 + air)
  y1 = Math.min(height - 1, y1 + air)
  return [x0, y0, x1 - x0 + 1, y1 - y0 + 1]
}

/** La gerbe de l'impact : des directions régulières, des portées et des tailles qui varient. */
const ETINCELLES_ACCUEIL: React.CSSProperties[] = Array.from({ length: 26 }, (_, i) => {
  const a = (i / 26) * Math.PI * 2 + ((i * 7) % 5) * 0.09
  const d = 0.55 + ((i * 11) % 7) / 10
  return {
    '--dx': `${(Math.cos(a) * d * 55).toFixed(1)}vmin`,
    '--dy': `${(Math.sin(a) * d * 38).toFixed(1)}vmin`,
    '--t': `${(1 + ((i * 5) % 6) * 0.18).toFixed(2)}rem`,
    '--duree': `${(0.55 + ((i * 3) % 5) * 0.08).toFixed(2)}s`,
  } as React.CSSProperties
})

/** Combien d'exemplaires d'une version la collection tient : ce que les decks peuvent prendre. */
function compteDesExemplaires(c: Collection): CompteDExemplaires {
  return (id, v) => {
    const p = c.cartes[id]
    return p === undefined ? 0 : compteDe(p, v)
  }
}

export function Jeu(): React.ReactElement {
  useEffect(penchantAuSurvol, [])
  // `&page=collection|catalogue|deck|jouer` : OUVRIR UNE PAGE D'UN LIEN, sans
  // l'accueil — *ce qui se teste doit pouvoir s'ouvrir d'un lien.* Le son n'est
  // pas amorcé : ces pages n'en ont pas besoin pour se juger.
  const [accueil, setAccueil] = useState(PAGE_DEMANDEE === null)
  const [page, setPage] = useState<Page>(PAGE_DEMANDEE ?? 'booster')
  const [collection, setCollection] = useState<Collection>(chargerCollection)
  const [calme, setCalme] = useState(true)
  const [sachetAttend, setSachetAttend] = useState(false)
  const [catalogue, setCatalogue] = useState<CarteEmoji[] | null>(null)
  /**
   * LA RÉSERVE ET L'HEURE. *On ne compte pas des secondes* : on garde la
   * réserve telle qu'écrite, et l'heure qui avance la met à jour à la lecture
   * (`reserveAJour`). L'heure ne bat que pour le minuteur affiché.
   */
  const [reserve, setReserve] = useState<Reserve>(() => chargerReserve(Date.now()))
  const [maintenant, setMaintenant] = useState(Date.now)
  useEffect(() => {
    const t = window.setInterval(() => setMaintenant(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])
  const aJour = reserveAJour(reserve, maintenant)
  const dispo = ILLIMITE ? RESERVE.max : aJour.paquets
  const dans = ILLIMITE ? null : prochainDans(reserve, maintenant)
  /**
   * EN ATTENTE : on est venu au booster sans paquet. *Décidé en arrivant, pas à
   * chaque seconde* — un paquet qu'on vient d'ouvrir et qui vide la réserve
   * laisse son bilan à l'écran, il ne le remplace pas par l'attente.
   */
  const [attente, setAttente] = useState(false)
  useEffect(() => {
    if (attente && dispo > 0) setAttente(false)
  }, [attente, dispo])
  useEffect(() => {
    // LE MÊME FETCH QUE LE PAQUET : `chargerEmojis` partage sa promesse.
    void chargerEmojis().then(setCatalogue, () => setCatalogue([]))
    void precharger(SON_CLIC_POP)
  }, [])
  /**
   * TOUS LES BOUTONS FONT LE CLIC DE « OUVRIR UN AUTRE PAQUET ». Keko : « on
   * peut utiliser le même son de bouton que celui de "ouvrir un nouveau
   * booster" pour tous les boutons ? » ***Au `pointerdown`, comme lui*** : un
   * son qui attend le relâchement arrive après le geste. *Un seul écouteur pour
   * toute la page* plutôt qu'un par bouton — celui qu'on ajoutera demain
   * clique sans qu'on y pense. **Sauf les vignettes** : une carte n'est pas un
   * bouton, et elle a déjà son son, la pose de carte en s'ouvrant (Keko : « il
   * y a le son de clic + le son de carte, il faudrait supprimer le son de
   * clic »). **Ni les options du panneau filtres** (`filtres-panneau-corps` : tri,
   * rareté, type, bonus) — Keko : « tu peux enlever les sons de clic dans les
   * options du menu filtres » ; « Tout effacer » et le bouton qui ferme
   * gardent le leur.
   */
  useEffect(() => {
    const cliquer = (e: PointerEvent): void => {
      const bouton = e.target instanceof Element ? e.target.closest('button') : null
      if (
        bouton !== null &&
        !bouton.classList.contains('vignette') &&
        bouton.closest('.filtres-panneau-corps') === null
      )
        jouerSon(SON_CLIC_POP)
    }
    document.addEventListener('pointerdown', cliquer)
    return () => document.removeEventListener('pointerdown', cliquer)
  }, [])

  const changer = useCallback((f: (c: Collection) => Collection) => {
    setCollection((c) => {
      const n = f(c)
      if (n !== c) sauverCollection(n)
      return n
    })
  }, [])
  /**
   * LES LIEUX (`logic/emoji/lieux.ts`, Keko 28/10) : l'or, les lieux ouverts,
   * leurs jauges. Chaque deck joue sur son lieu, et sa puissance remplit la
   * jauge du lieu, qui rend de l'or — *la puissance n'est plus une monnaie.*
   */
  const [lieux, setLieux] = useState<EtatLieux>(chargerLieux)
  const poserLieux = useCallback((f: (e: EtatLieux) => EtatLieux) => {
    setLieux((e) => {
      const n = f(e)
      if (n !== e) sauverLieux(n)
      return n
    })
  }, [])
  /**
   * LES DECKS QUI JOUENT (`logic/emoji/deck.ts`). Keko : « un système idle où
   * tu construis un deck ». *Ils jouent sur toutes les pages* : à chaque
   * seconde, ce que le temps a joué tombe (`decksAJour`), deck par deck, dans
   * la jauge de son lieu ; la page « Jouer » montre la dernière main de chaque
   * lieu. Un deck ne garde que des cartes possédées : relu avec la
   * collection, et une carte partie le quitte.
   */
  const [decks, setDecks] = useState<Decks>(() => {
    const c = chargerCollection()
    return garderLesLieuxOuverts(chargerDecks(compteDesExemplaires(c), Date.now()), chargerLieux().ouverts)
  })
  /** Le deck qu'on compose dans « Deck » (ouvert depuis son étui). */
  const [deckEdite, setDeckEdite] = useState(0)
  /** La dernière main tombée dans la session, LIEU PAR LIEU, et le dernier or gagné. */
  const [mainsDesLieux, setMainsDesLieux] = useState<Readonly<Record<string, MainTombee>>>({})
  const [orDesLieux, setOrDesLieux] = useState<Readonly<Record<string, { numero: number; or: number }>>>({})
  const poserDecks = useCallback((f: (ds: Decks) => Decks) => {
    setDecks((ds) => {
      const n = f(ds)
      if (n !== ds) sauverDecks(n)
      return n
    })
  }, [])
  // CE QUE VAUT UNE CARTE JOUÉE : un Like, plus un par cran (Keko : « +1 like
  // par niveau de rareté »). Le cran vient du catalogue, injecté au deck.
  // ET UN PAR NIVEAU DU PERSONNAGE. La collection est lue par une référence :
  // la valeur n'a pas à se refaire à chaque Like qui tombe.
  const refCollection = useRef(collection)
  refCollection.current = collection
  // LE NIVEAU DE CHAQUE PERSONNAGE, lu par toute carte qu'on peint (voir `declarerLesNiveaux`).
  declarerLesNiveaux((id) => niveauDe(refCollection.current, id))
  const valeur = useMemo(() => {
    if (catalogue === null) return null
    const crans = new Map(catalogue.map((c) => [c.id, c.rarete]))
    return valeurParRarete(
      (id) => crans.get(id),
      (id) => niveauDe(refCollection.current, id),
    )
  }, [catalogue])
  // LE RÔLE DE CHAQUE CARTE : le bonus du lieu le lit (la Mine aime les soutiens).
  const roleDe = useMemo(() => {
    const roles = new Map<string, RoleCarte>((catalogue ?? []).map((c) => [c.id, c.role]))
    return (id: string) => roles.get(id)
  }, [catalogue])
  /** Ce que vaut une carte jouée par CE deck : sa puissance, plus le bonus de son lieu. */
  const valeurDe = useMemo(() => {
    if (valeur === null) return null
    const parLieu = new Map<string | undefined, ReturnType<typeof valeurDansLeLieu>>()
    return (d: Deck) => {
      let v = parLieu.get(d.lieu)
      if (v === undefined) {
        v = valeurDansLeLieu(valeur, roleDe, lieuDe(d.lieu))
        parLieu.set(d.lieu, v)
      }
      return v
    }
  }, [valeur, roleDe])
  useEffect(() => {
    // Sans catalogue on ne sait pas ce que vaut une carte : le temps attend,
    // rien n'est perdu, il se rejouera à la lecture suivante.
    if (valeurDe === null) return
    const r = decksAJour(decks, maintenant, valeurDe)
    if (r.decks !== decks) poserDecks(() => r.decks)
    if (r.joues.length === 0) return
    // LA PUISSANCE ENTRE DANS LA JAUGE DE SON LIEU ; une jauge pleine rend son or.
    let e = lieux
    const gagne: Record<string, number> = {}
    // CHAQUE MAIN À SON HEURE : hors ligne, chaque heure a ses paliers. Les
    // mains de tous les decks se versent dans l'ordre du temps.
    const versements = r.joues
      .flatMap((j) => j.parMain.map((likes, k) => ({ lieu: j.lieu, likes, quand: j.premiere + k * DECK.cadence })))
      .sort((a, b) => a.quand - b.quand)
    for (const v of versements) {
      const g = remplirLaJauge(e, v.lieu, v.likes, v.quand)
      e = g.etat
      if (g.or > 0) gagne[v.lieu] = (gagne[v.lieu] ?? 0) + g.or
    }
    poserLieux(() => e)
    if (Object.keys(gagne).length > 0)
      setOrDesLieux((m) => {
        const n = { ...m }
        for (const [l, or] of Object.entries(gagne)) n[l] = { numero: (m[l]?.numero ?? 0) + 1, or }
        return n
      })
    setMainsDesLieux((m) => {
      const n = { ...m }
      for (const j of r.joues) {
        const d = r.decks.liste[j.i]
        if (j.derniere === null || d === undefined) continue
        n[j.lieu] = { main: j.derniere, likes: likesDeLaMain(j.derniere, valeurDe(d)), numero: (m[j.lieu]?.numero ?? 0) + 1 }
      }
      return n
    })
  }, [decks, lieux, maintenant, valeurDe, poserDecks, poserLieux])
  // CE QU'ON POSSÈDE, VERSION PAR VERSION : les decks ne prennent pas plus
  // d'exemplaires qu'il n'y en a (Keko : « une carte ne peut pas être dans
  // deux decks »), et une carte fusionnée les quitte.
  const compte = useMemo(() => compteDesExemplaires(collection), [collection])
  useEffect(() => {
    poserDecks((ds) => garderPossedeesPartout(ds, compte, Date.now()))
  }, [compte, poserDecks])
  const edite = decks.liste[deckEdite] ?? decks.liste[0]!
  const basculerDansLeDeck = useCallback(
    (e: EntreeDeck) => poserDecks((ds) => basculerDansDeck(ds, deckEdite, e, compte, Date.now())),
    [poserDecks, deckEdite, compte],
  )
  /** Pose un deck sur un lieu (`null` : l'en retire) ; le deck qui y était s'arrête. */
  const poserLeDeck = useCallback((i: number, lieu: string | null) => poserDecks((ds) => poserSurLieu(ds, i, lieu, Date.now())), [poserDecks])
  /** Ouvre un lieu contre son or. */
  const ouvrirUnLieu = useCallback((id: string) => poserLieux((e) => ouvrirLeLieu(e, id)), [poserLieux])
  /** Ce que la grille doit dire de chaque exemplaire possédé, pour le deck qu'on compose. */
  const choixDuDeck = useCallback(
    (id: string, v: Variante): { etat: 'dedans' | 'dehors' | 'plein' | 'pris'; prisPar?: string } => {
      if (edite.cartes.some((e) => e.id === id && e.v === v)) return { etat: 'dedans' }
      // Le deck est plein — sauf pour une autre version d'un emoji qu'il tient : elle le remplacerait.
      const plein = edite.cartes.length >= DECK.taille && !edite.cartes.some((e) => e.id === id)
      if (disponibles(decks, deckEdite, id, v, compte) <= 0) {
        // PRIS PAR UN AUTRE DECK : il se prend tant qu'il y a de la place ici,
        // et ne s'estompe que si le deck est plein (Keko) ; le symbole reste.
        const k = deckQuiTient(decks, deckEdite, id, v)
        return { etat: plein ? 'plein' : 'pris', prisPar: k === null ? 'Pris' : nomDuDeck(decks.liste[k], k) }
      }
      if (plein) return { etat: 'plein' }
      return { etat: 'dehors' }
    },
    [edite, decks, deckEdite, compte],
  )
  /**
   * `&decks=N` : DES DECKS DE TEST JUSQU'À N, d'un lien (`avecDecksDeTest`).
   * *Déclaré AVANT `&debloquer`* : quand les deux sont dans l'adresse, il
   * attend que le déblocage soit passé, puis remplit avec la collection neuve.
   */
  useEffect(() => {
    if (catalogue === null || catalogue.length === 0) return
    const p = new URLSearchParams(location.search)
    const v = p.get('decks')
    if (v === null || p.has('debloquer')) return
    p.delete('decks')
    history.replaceState(null, '', `${location.pathname}${p.toString() !== '' ? `?${p}` : ''}${location.hash}`)
    const n = Number(v)
    if (!Number.isFinite(n)) return
    // DES DECKS PLEINS (Keko) : la collection reçoit d'abord les exemplaires qui manquent.
    const ids = catalogue.map((c) => c.id)
    const manque = exemplairesManquants(decks, n, ids, compte)
    const plus = (id: string, x: Variante): number => compte(id, x) + (x === 'simple' ? (manque[id] ?? 0) : 0)
    changer((c) => ajouterExemplaires(c, manque, Date.now()))
    poserDecks((ds) => avecDecksDeTest(ds, n, ids, plus))
  }, [catalogue, compte, decks, changer, poserDecks])
  /**
   * `&debloquer` : LA MOITIÉ DU CATALOGUE, D'UN LIEN. Keko : « tu peux me
   * débloquer la moitié de la collection ? » *La collection vit sur l'appareil*,
   * donc c'est l'appareil qui l'écrit en ouvrant le lien. **Il complète jusqu'à
   * la moitié**, tirée au hasard parmi ce qui manque : rouvrir le lien ne
   * double rien. Le paramètre est retiré de l'adresse ensuite.
   */
  useEffect(() => {
    if (catalogue === null || catalogue.length === 0) return
    const p = new URLSearchParams(location.search)
    if (!p.has('debloquer')) return
    // `&debloquer=tout` : TOUTE LA COLLECTION. Keko : « ok maintenant toute la
    // collection ».
    const tout = p.get('debloquer') === 'tout'
    p.delete('debloquer')
    history.replaceState(null, '', `${location.pathname}${p.toString() !== '' ? `?${p}` : ''}${location.hash}`)
    changer((c) => {
      const cible = tout ? catalogue.length : Math.ceil(catalogue.length / 2)
      const manquent = catalogue.filter((x) => c.cartes[x.id] === undefined).map((x) => x.id)
      const deja = catalogue.length - manquent.length
      if (deja >= cible) return c
      const rng = createRng(Date.now() >>> 0)
      for (let i = manquent.length - 1; i > 0; i--) {
        const j = Math.floor(rng.next() * (i + 1))
        ;[manquent[i], manquent[j]] = [manquent[j]!, manquent[i]!]
      }
      return debloquer(c, manquent.slice(0, cible - deja), Date.now())
    })
  }, [catalogue, changer])
  /**
   * `&retirer` : LA MOITIÉ DE LA COLLECTION S'EN VA, D'UN LIEN — le miroir de
   * `&debloquer`. Keko : « tu peux supprimer la moitié de ma collection ? »
   * *Sa collection vit sur son appareil* : on ne peut rien y faire d'ici, c'est
   * le lien qui le fait sur place. La moitié des emoji possédés, au hasard,
   * avec tous leurs exemplaires ; les niveaux ne bougent pas. Le paramètre est
   * retiré de l'adresse ensuite : recharger ne retire pas encore la moitié.
   */
  useEffect(() => {
    const p = new URLSearchParams(location.search)
    if (!p.has('retirer')) return
    p.delete('retirer')
    history.replaceState(null, '', `${location.pathname}${p.toString() !== '' ? `?${p}` : ''}${location.hash}`)
    changer((c) => {
      const ids = Object.keys(c.cartes)
      const rng = createRng(Date.now() >>> 0)
      for (let i = ids.length - 1; i > 0; i--) {
        const j = Math.floor(rng.next() * (i + 1))
        ;[ids[i], ids[j]] = [ids[j]!, ids[i]!]
      }
      return retirer(c, ids.slice(0, Math.floor(ids.length / 2)))
    })
  }, [changer])
  /**
   * `&oublier=<id>[,<id>]` : CES EMOJI QUITTENT LA COLLECTION DE CET APPAREIL,
   * cartes et niveau, d'un lien. Keko, le test du gobelin fini : « tu peux
   * supprimer le goblin également des collections cartes / stickers ? » *Sa
   * collection vit sur son appareil* : c'est le lien qui le fait sur place,
   * une fois par appareil. Les decks lâchent les exemplaires partis
   * d'eux-mêmes (`garderPossedeesPartout`). Le paramètre est retiré ensuite.
   */
  useEffect(() => {
    const p = new URLSearchParams(location.search)
    const v = p.get('oublier')
    if (v === null) return
    p.delete('oublier')
    history.replaceState(null, '', `${location.pathname}${p.toString() !== '' ? `?${p}` : ''}${location.hash}`)
    const ids = v.split(',').map((x) => x.trim().toLowerCase()).filter((x) => x !== '')
    changer((c) => ids.reduce((col, id) => oublier(col, id), c))
  }, [changer])
  /**
   * `&or=N` : POSE LE SOLDE D'OR DE CET APPAREIL, d'un lien — pour acheter un
   * lieu sans attendre. *Il remplace, il n'ajoute pas* : rouvrir le lien ne
   * double rien. Le paramètre est retiré ensuite.
   */
  useEffect(() => {
    const p = new URLSearchParams(location.search)
    const v = p.get('or')
    if (v === null) return
    p.delete('or')
    history.replaceState(null, '', `${location.pathname}${p.toString() !== '' ? `?${p}` : ''}${location.hash}`)
    const n = Number(v)
    if (!Number.isFinite(n)) return
    poserLieux((e) => avecOr(e, n))
  }, [poserLieux])
  // LE CRAN DE CHAQUE CARTE, pour les comptes de la pitié (`ajouterPaquet`).
  const rareteDe = useMemo(() => {
    const crans = new Map((catalogue ?? []).map((c) => [c.id, c.rarete]))
    return (id: string) => crans.get(id)
  }, [catalogue])
  const ajouter = useCallback(
    (ids: readonly string[], bonus: Readonly<Record<string, Bonus>>) => {
      changer((c) => ajouterPaquet(c, ids, bonus, Date.now(), rareteDe))
      // LE PAQUET SE DÉCOMPTE QUAND IL EST OUVERT, comme il entre dans la collection.
      if (!ILLIMITE)
        setReserve((r) => {
          const n = prendreUnPaquet(r, Date.now()) ?? r
          sauverReserve(n)
          return n
        })
    },
    [changer, rareteDe],
  )

  /**
   * LE DECK QUI GARDE SES EXEMPLAIRES À LA FUSION : celui qu'on édite (Keko :
   * « supprimer l'exemplaire en priorité d'un autre deck quand la fusion est
   * faite depuis l'écran d'édition d'un deck ») ; ailleurs, l'ordre des decks.
   */
  const gardeALaFusion = page === 'deck' ? deckEdite : undefined
  /** FUSIONNER LES EXEMPLAIRES D'UN PERSONNAGE vers son niveau suivant : voir `fusionner`. */
  const fusionnerPersonnage = useCallback(
    (id: string) => {
      const apres = fusionner(collection, id)
      if (apres === collection) return
      changer((c) => fusionner(c, id))
      // Les decks d'abord, dans l'ordre voulu : quand l'effet sur `compte`
      // passera, ils tiendront déjà dans les comptes et il ne touchera à rien.
      poserDecks((ds) => garderPossedeesPartout(ds, compteDesExemplaires(apres), Date.now(), gardeALaFusion))
    },
    [changer, poserDecks, collection, gardeALaFusion],
  )
  /** TOUT FUSIONNER (Keko) : chaque personnage monte autant qu'il peut ; les decks suivent. */
  const toutFusionner = useMemo(() => {
    const n = fusionnables(collection).length
    return {
      n,
      pertes: (): string[] => {
        const ds = garderPossedeesPartout(decks, compteDesExemplaires(fusionnerTout(collection)), Date.now())
        return decksQuiPerdent(decks, ds).map((i) => nomDuDeck(decks.liste[i], i))
      },
      fusionner: () => changer(fusionnerTout),
    }
  }, [collection, decks, changer])
  /** Les noms des decks auxquels cette fusion retirerait des exemplaires (voir `decksQuiPerdent`). */
  const pertesALaFusion = useCallback(
    (id: string): string[] => {
      const apres = fusionner(collection, id)
      if (apres === collection) return []
      const ds = garderPossedeesPartout(decks, compteDesExemplaires(apres), Date.now(), gardeALaFusion)
      return decksQuiPerdent(decks, ds).map((i) => nomDuDeck(decks.liste[i], i))
    },
    [collection, decks, gardeALaFusion],
  )

  /**
   * LE MENU « CARTES » : déroulé sous la pilule par une tape sur le bouton,
   * replié par un choix ou par une tape n'importe où ailleurs. *Le bouton
   * ouvre le menu même quand on est déjà sur une de ses pages* : c'est le menu
   * qui dit où l'on va, pas le bouton.
   */
  const [menuCartes, setMenuCartes] = useState(false)
  useEffect(() => {
    if (!menuCartes) return
    const fermer = (e: PointerEvent): void => {
      if (e.target instanceof Element && e.target.closest('.nav-cartes') !== null) return
      setMenuCartes(false)
    }
    document.addEventListener('pointerdown', fermer)
    return () => document.removeEventListener('pointerdown', fermer)
  }, [menuCartes])
  // LE MENU « DECK », LE MÊME À DROITE : composer ses decks, regarder jouer l'actif.
  const [menuDeck, setMenuDeck] = useState(false)
  useEffect(() => {
    if (!menuDeck) return
    const fermer = (e: PointerEvent): void => {
      if (e.target instanceof Element && e.target.closest('.nav-menu-deck') !== null) return
      setMenuDeck(false)
    }
    document.addEventListener('pointerdown', fermer)
    return () => document.removeEventListener('pointerdown', fermer)
  }, [menuDeck])

  function aller(vers: Page): void {
    setMenuCartes(false)
    setMenuDeck(false)
    if (vers === page) return
    // EN QUITTANT LES CARTES, TOUT A ÉTÉ VU : la pastille s'éteint, et les
    // « Nouveau » de la grille avec elle. *Pas en y entrant* : on doit pouvoir
    // les y voir. Le catalogue montre les mêmes vignettes, il compte pareil.
    if (page === 'collection' || page === 'catalogue') changer(toutVu)
    if (vers === 'booster') setAttente(dispo === 0)
    setPage(vers)
    setCalme(true)
  }

  const nouvelles = nombreDeNouvelles(collection)
  const visible = !accueil && (page !== 'booster' || calme)
  const surLesCartes = page === 'collection' || page === 'catalogue'
  const surLeDeck = page === 'decks' || page === 'deck' || page === 'jouer'

  return (
    <>
      {accueil ? (
        <Accueil
          onJouer={() => {
            setAttente(dispo === 0)
            setAccueil(false)
          }}
        />
      ) : page === 'booster' && attente ? (
        <Attente dans={dans} onCollection={() => aller('collection')} />
      ) : page === 'booster' ? (
        <>
          <Paquet3D
            onPaquetOuvert={ajouter}
            joueur={refCollection}
            onCalme={setCalme}
            onSachetEnAttente={setSachetAttend}
            sansPrise
            peutContinuer={dispo > 0}
            onTermine={() => {
              setAttente(true)
              setCalme(true)
            }}
          />
          {/* COMBIEN IL EN RESTE, SOUS LE SACHET. Keko : « on peut afficher "X
              disponibles" sous le paquet pour dire combien sont dispo à
              l'ouverture ». *Celui qu'on voit compte* : il n'est décompté qu'à
              l'ouverture. Parti dès que le sachet se déchire. */}
          {sachetAttend && (
            <p className="paquet-disponibles">
              <b>{dispo}</b> disponible{dispo > 1 ? 's' : ''}
            </p>
          )}
          {/* LE PAQUET EST VIDE, LA RÉSERVE AUSSI : à la place du bouton, quand
              vient le suivant. */}
          {dispo === 0 && calme && (
            <p className="reserve-bilan">Prochain paquet dans {dans === null ? '…' : minuteur(dans)}</p>
          )}
        </>
      ) : page === 'decks' ? (
        <PageDecks
          catalogue={catalogue}
          decks={decks}
          valeur={valeur}
          peutAjouter={decks.liste.length < DECKS_MAX}
          onOuvrir={(i) => {
            setDeckEdite(i)
            aller('deck')
          }}
          onAjouter={() => {
            poserDecks(ajouterDeck)
            setDeckEdite(Math.min(decks.liste.length, DECKS_MAX - 1))
            aller('deck')
          }}
        />
      ) : page === 'jouer' ? (
        <PageJouer
          catalogue={catalogue}
          collection={collection}
          decks={decks}
          valeurDe={valeurDe}
          lieux={lieux}
          mains={mainsDesLieux}
          ors={orDesLieux}
          onPoser={poserLeDeck}
          onOuvrirLieu={ouvrirUnLieu}
          onOuvrirCoffre={(id) => poserLieux((e) => ouvrirLeCoffre(e, id).etat)}
          onComposer={(i) => {
            setDeckEdite(i)
            aller('deck')
          }}
        />
      ) : (
        <PageCollection
          key={page}
          catalogue={catalogue}
          collection={collection}
          toutes={page === 'catalogue'}
          onOuvrirUnPaquet={() => aller('booster')}
          onFusionner={fusionnerPersonnage}
          pertesALaFusion={pertesALaFusion}
          toutFusionner={page === 'collection' ? toutFusionner : undefined}
          deck={
            page === 'deck'
              ? {
                  nombre: edite.cartes.length,
                  cartes: edite.cartes,
                  choix: choixDuDeck,
                  taille: DECK.taille,
                  onBasculer: basculerDansLeDeck,
                  onJouer: () => aller('jouer'),
                  decks: decks.liste.map((d, i) => ({ n: d.cartes.length, complet: deckComplet(d), nom: nomDuDeck(d, i), nomDonne: d.nom ?? '' })),
                  onRenommer: (nom: string) => poserDecks((ds) => renommerDeck(ds, deckEdite, nom)),
                  edite: deckEdite,
                  onRetour: () => aller('decks'),
                  // SUPPRIMÉ, ON REVIENT AUX ÉTUIS : il n'y a plus rien à modifier ici.
                  onSupprimer: () => {
                    poserDecks((ds) => supprimerDeck(ds, deckEdite))
                    setDeckEdite((i) => Math.max(0, Math.min(i, decks.liste.length - 2)))
                    aller('decks')
                  },
                }
              : undefined
          }
        />
      )}
      {!accueil && page === 'booster' && !attente && (
        <div className={`reserve-place${visible ? '' : ' reserve-cachee'}`}>
          <JaugeDeReserve paquets={dispo} dans={dans} />
        </div>
      )}
      {/* LES MONNAIES, TOUJOURS LÀ. Keko : « j'aurais voulu que les likes soient
          toujours visibles quel que soit l'écran actif (booster, collection,
          stickers) » — les stickers sont partis depuis —, puis « je voudrais rajouter une autre monnaie : les
          abonnés ». Une pilule à part, en haut à droite, qui se cache avec la
          barre : pendant la déchirure et le défilé, rien ne dispute l'écran. */}
      {/* SEULEMENT SUR LE BOOSTER ET « JOUER » (Keko, 28/10 : « il prend de la
          place … on peut le supprimer et ne l'afficher que dans Jouer et dans
          l'écran d'ouverture de boosters ») : ailleurs, la page monte d'autant. */}
      {(page === 'booster' || page === 'jouer') && (
        <div className={`likes-place${visible ? '' : ' likes-cachee'}`}>
          {/* L'OR, la monnaie des lieux (Keko, 28/10) : la puissance n'en est plus une. */}
          <span className="monnaie monnaie-or" aria-label={`${lieux.or} or`}>
            <IconeOr />
            {/* LE COMPTE SAUTE QUAND IL CHANGE : l'or d'un coffre y arrive. */}
            <b key={lieux.or} className="monnaie-saute">
              {lieux.or}
            </b>
          </span>
        </div>
      )}
      <nav className={`nav${visible ? '' : ' nav-cachee'}`} aria-label="Navigation">
        <div className="nav-pilule">
          <button
            type="button"
            className={`nav-moitie nav-gauche nav-cartes${surLesCartes ? ' nav-active' : ''}`}
            aria-haspopup="menu"
            aria-expanded={menuCartes}
            onClick={() => {
              setMenuDeck(false)
              setMenuCartes((m) => !m)
            }}
          >
            <span className="nav-icone" aria-hidden>
              <IconeCollection />
            </span>
            Cartes
            <span className={`nav-chevron${menuCartes ? ' nav-chevron-ouvert' : ''}`} aria-hidden />
            {nouvelles > 0 && <span className="nav-pastille">{nouvelles}</span>}
          </button>
          <span className="nav-place" aria-hidden />
          {/* LE DECK À DROITE, à la place des stickers (Keko : partis avec la
              fusion, « Deck » y déroule ses deux entrées). */}
          <button
            type="button"
            className={`nav-moitie nav-droite nav-deck nav-menu-deck${surLeDeck ? ' nav-active' : ''}`}
            aria-haspopup="menu"
            aria-expanded={menuDeck}
            onClick={() => {
              setMenuCartes(false)
              setMenuDeck((m) => !m)
            }}
          >
            <span className={`nav-chevron${menuDeck ? ' nav-chevron-ouvert' : ''}`} aria-hidden />
            Deck
            <span className="nav-icone" aria-hidden>
              <IconeDeck />
            </span>
          </button>
        </div>
        <button
          type="button"
          className={`nav-booster${page === 'booster' ? ' nav-active' : ''}`}
          aria-label="Ouvrir un booster"
          onClick={() => aller('booster')}
        >
          <span className="nav-sachet">
            <img src={`${import.meta.env.BASE_URL}symbole.webp?v=${encodeURIComponent(__BUILD_TIME__)}`} alt="" />
          </span>
          {/* LE NOMBRE DE PAQUETS SUR LE BOOSTER, comme le « 10 » de lexicodex. */}
          {/* À ZÉRO, PAS DE PASTILLE (Keko) : elle ne se montre qu'à 1 et plus. */}
          {dispo > 0 && <span className="nav-pastille nav-pastille-booster">{dispo}</span>}
        </button>
        {/* LE MENU DÉROULÉ SOUS LE BOUTON « CARTES » : deux entrées, la page
            courante cochée. `nav-cartes` : une tape dedans ne le referme pas
            par le fond (voir `menuCartes`). */}
        {menuCartes && (
          <div className="nav-menu nav-cartes" role="menu" aria-label="Cartes">
            <button
              type="button"
              role="menuitemradio"
              aria-checked={page === 'collection'}
              className={`nav-menu-entree${page === 'collection' ? ' nav-menu-active' : ''}`}
              onClick={() => aller('collection')}
            >
              Collection
              {nouvelles > 0 && <span className="nav-menu-pastille">{nouvelles}</span>}
            </button>
            <button
              type="button"
              role="menuitemradio"
              aria-checked={page === 'catalogue'}
              className={`nav-menu-entree${page === 'catalogue' ? ' nav-menu-active' : ''}`}
              onClick={() => aller('catalogue')}
            >
              Toutes les cartes
            </button>
          </div>
        )}
        {/* LE MENU DÉROULÉ SOUS LE BOUTON « DECK » : le composer, le regarder jouer (Keko). */}
        {menuDeck && (
          <div className="nav-menu nav-menu-droite nav-menu-deck" role="menu" aria-label="Deck">
            <button
              type="button"
              role="menuitemradio"
              aria-checked={page === 'decks' || page === 'deck'}
              className={`nav-menu-entree${page === 'decks' || page === 'deck' ? ' nav-menu-active' : ''}`}
              onClick={() => aller('decks')}
            >
              Mes decks
              <span className="nav-menu-compte">
                {decks.liste.length} deck{decks.liste.length > 1 ? 's' : ''}
              </span>
            </button>
            <button
              type="button"
              role="menuitemradio"
              aria-checked={page === 'jouer'}
              className={`nav-menu-entree${page === 'jouer' ? ' nav-menu-active' : ''}`}
              onClick={() => aller('jouer')}
            >
              Jouer
              {decks.liste.some((d) => d.partie !== null) && (
                <span className="nav-menu-compte">{decks.liste.filter((d) => d.partie !== null).length} en jeu</span>
              )}
            </button>
          </div>
        )}
      </nav>
    </>
  )
}

/**
 * LES ICÔNES DE LA BARRE, dessinées. Keko : « je trouve que ça matche pas :
 * pour collection je verrais bien 3 cartes en éventail ». *Les emoji 🗂️ et 🏷️
 * parlaient bureau* ; ici trois cartes aux couleurs des crans (sans l'étoile de
 * la première version, retirée par Keko), et pour le deck une pile de cartes
 * de dos. Le trait est `currentColor` : sombre sur la pilule crème, crème sur
 * le bouton actif.
 */
function IconeCollection(): React.ReactElement {
  const carte = (angle: number, fond: string, fenetre: string): React.ReactElement => (
    <g transform={`rotate(${angle} 12 23)`}>
      <rect x="7.3" y="4" width="9.4" height="13.4" rx="1.7" fill={fond} stroke="currentColor" strokeWidth="1.3" />
      <rect x="9" y="5.8" width="6" height="5.6" rx="0.8" fill={fenetre} />
    </g>
  )
  return (
    <svg viewBox="0 0 24 24" strokeLinejoin="round">
      {carte(-28, '#4cc46a', '#c9f5d3')}
      {carte(28, '#a35cff', '#e7d6ff')}
      {carte(0, '#ffb020', '#fff1c7')}
    </svg>
  )
}

/**
 * LE LIKE : un pouce levé dans un CŒUR rose. Keko : « symbole de like avec un
 * pouce dans une bulle », puis « tons rose pour les likes (le pouce est bien,
 * mais dans un cœur c'est mieux à la place de la bulle) ». Le cœur rose, le
 * pouce crème, trait en `currentColor`.
 */
// LES LIKES PORTENT LE SYMBOLE DU JEU (Keko : « plutôt que les likes en rose
// affiche le logo du jeu »), et leur compte passe en or.
export function IconeLike(): React.ReactElement {
  return <img className="icone-like" src={`${import.meta.env.BASE_URL}symbole.webp?v=${encodeURIComponent(__BUILD_TIME__)}`} alt="" />
}

/** L'OR : une pièce frappée, bord sombre, reflet clair. */
export function IconeOr(): React.ReactElement {
  return (
    <svg className="icone-or" viewBox="0 0 24 24" aria-hidden>
      <circle cx="12" cy="12" r="10" fill="#b8860b" />
      <circle cx="12" cy="11.2" r="9.2" fill="#ffc61f" />
      <circle cx="12" cy="11.2" r="6.4" fill="none" stroke="#d99a12" strokeWidth="1.6" />
      <path d="M8.2 6.6a6.6 6.6 0 0 1 5.4-1.4" fill="none" stroke="#fff6c8" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

/** LE DECK : trois cartes de dos empilées, le cuir violet du dos et son liseré d'or. */
function IconeDeck(): React.ReactElement {
  const PILE = [
    [2.4, -2.4],
    [1.2, -1.2],
    [0, 0],
  ] as const
  // UN SEUL TRAIT, AUTOUR DE LA PILE (Keko : « un seul outline autour de la
  // pile plutôt qu'un outline sur chaque carte ») : les trois cartes tracées
  // d'abord en trait épais, puis leurs fonds par-dessus — seul le bord
  // extérieur du tas reste visible.
  const forme = (dx: number, dy: number, props: React.SVGProps<SVGRectElement>): React.ReactElement => (
    <rect key={`${dx},${dy}`} x={6 + dx} y={5 + dy} width="11" height="15" rx="1.8" {...props} />
  )
  return (
    <svg viewBox="0 0 24 24" strokeLinejoin="round">
      {PILE.map(([dx, dy]) => forme(dx, dy, { fill: 'currentColor', stroke: 'currentColor', strokeWidth: 2.6 }))}
      {PILE.map(([dx, dy]) => (
        <g key={`${dx},${dy}`} transform={`translate(${dx} ${dy})`}>
          <rect x="6" y="5" width="11" height="15" rx="1.8" fill="#5b2a6e" />
          <rect x="8" y="7" width="7" height="11" rx="0.9" fill="none" stroke="#ffc61f" strokeWidth="1" />
        </g>
      ))}
    </svg>
  )
}

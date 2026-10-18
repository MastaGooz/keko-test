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
import type { CarteEmoji } from '../logic/emoji/types.ts'
import type { Bonus } from '../logic/emoji/tirage.ts'
import {
  ajouterLikes,
  ajouterPaquet,
  avecAbonnes,
  avecLikes,
  debloquer,
  debloquerStickers,
  retirer,
  detruire,
  nombreDeNouvelles,
  nombreDeStickersNouveaux,
  stickersVus,
  toutVu,
  type Collection,
  type Exemplaire,
} from '../logic/emoji/collection.ts'
import { createRng } from '../logic/rng.ts'
import { chargerCollection, chargerDecks, chargerReserve, sauverCollection, sauverDecks, sauverReserve } from '../ui/collection.ts'
import { RESERVE, prendreUnPaquet, prochainDans, reserveAJour, type Reserve } from '../logic/emoji/reserve.ts'
import {
  DECK,
  DECKS_MAX,
  ajouterDeck,
  basculerCarte,
  choisirDeck,
  deckActif,
  deckComplet,
  decksAJour,
  garderPossedeesPartout,
  likesDeLaMain,
  modifierDeck,
  supprimerDeck,
  type Decks,
} from '../logic/emoji/deck.ts'
import { chargerEmojis } from '../ui/emoji.ts'
import { Paquet3D } from './Paquet3D.tsx'
import { PageCollection } from './Collection.tsx'
import { PageStickers } from './Stickers.tsx'
import { PageJouer, type MainTombee } from './Deck.tsx'
import { SON_CLIC_POP, amorcerLeSon, jouerSon, precharger, reveillerLeSon } from './sons.ts'
import { FondAnime } from './FondAnime.tsx'
import { demanderLInclinaison } from './inclinaison.ts'
import { toileDuTitre } from './texture-carte.ts'

/**
 * LES PAGES. `collection` et `catalogue` sont les deux entrées du menu
 * « Cartes » (Keko : « renommer "collection" par "cartes" en haut, et quand un
 * clic sur carte on développe un menu déroulant avec : collection (ce qu'on a
 * actuellement) / toutes les cartes (liste de toutes les cartes) »). Le
 * catalogue est la même page que la collection, avec les cartes qu'on n'a pas
 * encore en grisé. `deck` (composer le deck, la même grille en mode deck) et
 * `jouer` (le regarder jouer) sont les deux entrées du deck qui joue (Keko).
 */
type Page = 'booster' | 'collection' | 'catalogue' | 'stickers' | 'deck' | 'jouer'

/** `&illimite` : la réserve ne se vide jamais — pour tester sans attendre. */
const ILLIMITE = new URLSearchParams(location.search).has('illimite')
/** `&page=` : la page ouverte d'emblée (voir `accueil`) ; autre chose, ignoré. */
const PAGE_DEMANDEE = ((): Page | null => {
  const p = new URLSearchParams(location.search).get('page')
  return p === 'collection' || p === 'catalogue' || p === 'stickers' || p === 'deck' || p === 'jouer' ? p : null
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
  const [pret, setPret] = useState(false)
  useEffect(() => {
    let vivant = true
    const l = Math.min(window.innerWidth * 0.86, 520) * Math.min(window.devicePixelRatio || 1, 2)
    void toileDuTitre(l).then((source) => {
      const t = toile.current
      const ctx = t?.getContext('2d')
      if (!vivant || t == null || ctx == null) return
      t.width = source.width
      t.height = source.height
      ctx.drawImage(source, 0, 0)
      setPret(true)
    })
    return () => {
      vivant = false
    }
  }, [])
  return (
    <button
      type="button"
      className="accueil"
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
      <canvas ref={toile} className={`accueil-titre${pret ? ' accueil-pret' : ''}`} />
      <span className="paquet-invite accueil-invite">Touchez pour jouer</span>
    </button>
  )
}

export function Jeu(): React.ReactElement {
  // `&page=collection|catalogue|stickers` : OUVRIR UNE PAGE D'UN LIEN, sans
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
   * bouton, et elle a déjà son son, la pose de carte en s'ouvrant. **Ni les
   * stickers de l'album** (`album-case`), pour la même raison — Keko : « il y a
   * le son de clic + le son de carte, il faudrait supprimer le son de clic ».
   * **Ni les options du panneau filtres** (`filtres-panneau-corps` : tri,
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
        !bouton.classList.contains('album-case') &&
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
   * LE DECK QUI JOUE (`logic/emoji/deck.ts`). Keko : « un système idle où tu
   * construis un deck… chaque main ajoute immédiatement ses likes ». *Il joue
   * sur toutes les pages* : à chaque seconde, ce que le temps a joué tombe
   * (`deckAJour`), les Likes entrent dans la collection, et la page « Jouer »
   * montre la dernière main (`derniereMain`). Le deck ne garde que des cartes
   * possédées : relu avec la collection, et une carte partie le quitte.
   */
  const [decks, setDecks] = useState<Decks>(() => {
    const c = chargerCollection()
    return chargerDecks((id) => c.cartes[id] !== undefined, Date.now())
  })
  /**
   * PLUSIEURS DECKS, UN SEUL QUI JOUE (Keko : « que le joueur puisse avoir
   * plusieurs decks, et sélectionner celui avec lequel il veut jouer »). On
   * compose `deckEdite` dans « Deck » (l'actif au départ) ; l'actif joue.
   */
  const [deckEdite, setDeckEdite] = useState(decks.actif)
  const [derniereMain, setDerniereMain] = useState<MainTombee | null>(null)
  const poserDecks = useCallback((f: (ds: Decks) => Decks) => {
    setDecks((ds) => {
      const n = f(ds)
      if (n !== ds) sauverDecks(n)
      return n
    })
  }, [])
  useEffect(() => {
    const r = decksAJour(decks, maintenant)
    if (r.decks !== decks) poserDecks(() => r.decks)
    if (r.mains === 0 || r.derniere === null) return
    const main = r.derniere
    changer((c) => ajouterLikes(c, r.likes))
    setDerniereMain((m) => ({ main, likes: likesDeLaMain(main), numero: (m?.numero ?? 0) + 1 }))
  }, [decks, maintenant, changer, poserDecks])
  useEffect(() => {
    poserDecks((ds) => garderPossedeesPartout(ds, (id) => collection.cartes[id] !== undefined, Date.now()))
  }, [collection, poserDecks])
  const deck = deckActif(decks)
  const edite = decks.liste[deckEdite] ?? deck
  const basculerDansLeDeck = useCallback(
    (id: string) => poserDecks((ds) => modifierDeck(ds, deckEdite, (d) => basculerCarte(d, id, Date.now()))),
    [poserDecks, deckEdite],
  )
  const choisirLeDeck = useCallback((i: number) => poserDecks((ds) => choisirDeck(ds, i, Date.now())), [poserDecks])
  const deckIds = useMemo(() => new Set(edite.cartes), [edite.cartes])
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
    changer((c0) => {
      // `=tout` REMPLIT AUSSI L'ALBUM : un sticker de chaque emoji.
      const c = tout ? debloquerStickers(c0, catalogue.map((x) => x.id), Date.now()) : c0
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
   * avec tous leurs exemplaires ; l'album ne bouge pas. Le paramètre est
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
   * `&likes=N` : POSE LE SOLDE DE LIKES DE CET APPAREIL, d'un lien — le banc
   * du compteur tant qu'aucun geste n'en donne. *Il remplace, il n'ajoute
   * pas* : rouvrir le lien ne double rien. Le paramètre est retiré ensuite.
   */
  useEffect(() => {
    const p = new URLSearchParams(location.search)
    const v = p.get('likes')
    if (v === null) return
    p.delete('likes')
    history.replaceState(null, '', `${location.pathname}${p.toString() !== '' ? `?${p}` : ''}${location.hash}`)
    const n = Number(v)
    if (!Number.isFinite(n)) return
    changer((c) => avecLikes(c, n))
  }, [changer])
  /** `&abonnes=N` : le même banc pour la seconde monnaie. */
  useEffect(() => {
    const p = new URLSearchParams(location.search)
    const v = p.get('abonnes')
    if (v === null) return
    p.delete('abonnes')
    history.replaceState(null, '', `${location.pathname}${p.toString() !== '' ? `?${p}` : ''}${location.hash}`)
    const n = Number(v)
    if (!Number.isFinite(n)) return
    changer((c) => avecAbonnes(c, n))
  }, [changer])
  const ajouter = useCallback(
    (ids: readonly string[], bonus: Readonly<Record<string, Bonus>>) => {
      changer((c) => ajouterPaquet(c, ids, bonus, Date.now()))
      // LE PAQUET SE DÉCOMPTE QUAND IL EST OUVERT, comme il entre dans la collection.
      if (!ILLIMITE)
        setReserve((r) => {
          const n = prendreUnPaquet(r, Date.now()) ?? r
          sauverReserve(n)
          return n
        })
    },
    [changer],
  )

  /** UNE CARTE DÉTRUITE POUR SON STICKER : voir `Decollage`. */
  const detruireCarte = useCallback(
    (id: string, ex: Exemplaire) => changer((c) => detruire(c, id, ex, Date.now())),
    [changer],
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

  function aller(vers: Page): void {
    setMenuCartes(false)
    if (vers === page) return
    // EN QUITTANT LES CARTES, TOUT A ÉTÉ VU : la pastille s'éteint, et les
    // « Nouveau » de la grille avec elle. *Pas en y entrant* : on doit pouvoir
    // les y voir. Le catalogue montre les mêmes vignettes, il compte pareil.
    if (page === 'collection' || page === 'catalogue') changer(toutVu)
    // ET L'ALBUM PAREIL : les stickers sont vus en le quittant.
    if (page === 'stickers') changer(stickersVus)
    if (vers === 'booster') setAttente(dispo === 0)
    setPage(vers)
    setCalme(true)
  }

  const nouvelles = nombreDeNouvelles(collection)
  const nouveauxStickers = nombreDeStickersNouveaux(collection)
  const visible = !accueil && (page !== 'booster' || calme)
  const surLesCartes = page === 'collection' || page === 'catalogue' || page === 'deck' || page === 'jouer'

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
            onCalme={setCalme}
            onSachetEnAttente={setSachetAttend}
            onDetruire={detruireCarte}
            sansPrise
            peutContinuer={dispo > 0}
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
      ) : page === 'stickers' ? (
        <PageStickers catalogue={catalogue} collection={collection} onCollection={() => aller('collection')} />
      ) : page === 'jouer' ? (
        <PageJouer
          catalogue={catalogue}
          collection={collection}
          decks={decks}
          derniere={derniereMain}
          onChoisir={choisirLeDeck}
          onComposer={() => {
            setDeckEdite(decks.actif)
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
          onDetruire={detruireCarte}
          deck={
            page === 'deck'
              ? {
                  ids: deckIds,
                  taille: DECK.taille,
                  onBasculer: basculerDansLeDeck,
                  onJouer: () => aller('jouer'),
                  decks: decks.liste.map((d) => ({ n: d.cartes.length, complet: deckComplet(d) })),
                  edite: deckEdite,
                  actif: decks.actif,
                  peutAjouter: decks.liste.length < DECKS_MAX,
                  onEditer: setDeckEdite,
                  onAjouter: () => {
                    poserDecks(ajouterDeck)
                    setDeckEdite(Math.min(decks.liste.length, DECKS_MAX - 1))
                  },
                  onSupprimer: () => {
                    poserDecks((ds) => supprimerDeck(ds, deckEdite, Date.now()))
                    setDeckEdite((i) => Math.max(0, Math.min(i, decks.liste.length - 2)))
                  },
                  onJouerAvec: () => choisirLeDeck(deckEdite),
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
          stickers) », puis « je voudrais rajouter une autre monnaie : les
          abonnés ». Une pilule à part, en haut à droite, qui se cache avec la
          barre : pendant la déchirure et le défilé, rien ne dispute l'écran. */}
      <div className={`likes-place${visible ? '' : ' likes-cachee'}`}>
        <span className="monnaie" aria-label={`${collection.likes} Like${collection.likes > 1 ? 's' : ''}`}>
          <IconeLike />
          <b>{collection.likes}</b>
        </span>
        <span className="monnaie" aria-label={`${collection.abonnes} abonné${collection.abonnes > 1 ? 's' : ''}`}>
          <IconeAbonne />
          <b>{collection.abonnes}</b>
        </span>
      </div>
      <nav className={`nav${visible ? '' : ' nav-cachee'}`} aria-label="Navigation">
        <div className="nav-pilule">
          <button
            type="button"
            className={`nav-moitie nav-gauche nav-cartes${surLesCartes ? ' nav-active' : ''}`}
            aria-haspopup="menu"
            aria-expanded={menuCartes}
            onClick={() => setMenuCartes((m) => !m)}
          >
            <span className="nav-icone" aria-hidden>
              <IconeCollection />
            </span>
            Cartes
            <span className={`nav-chevron${menuCartes ? ' nav-chevron-ouvert' : ''}`} aria-hidden />
            {nouvelles > 0 && <span className="nav-pastille">{nouvelles}</span>}
          </button>
          <span className="nav-place" aria-hidden />
          {/* LES STICKERS À DROITE, à la place du compte « réunis / 1 915 » —
              qui reste en tête de la collection. *Le sticker qu'on décolle
              s'envole vers ce bouton* (voir `Decollage`). */}
          <button
            type="button"
            className={`nav-moitie nav-droite nav-stickers${page === 'stickers' ? ' nav-active' : ''}`}
            onClick={() => aller('stickers')}
          >
            Stickers
            <span className="nav-icone" aria-hidden>
              <IconeStickers />
            </span>
            {nouveauxStickers > 0 && <span className="nav-pastille nav-pastille-stickers">{nouveauxStickers}</span>}
          </button>
        </div>
        <button
          type="button"
          className={`nav-booster${page === 'booster' ? ' nav-active' : ''}`}
          aria-label="Ouvrir un booster"
          onClick={() => aller('booster')}
        >
          <span className="nav-sachet">
            <span>😄</span>
          </span>
          {/* LE NOMBRE DE PAQUETS SUR LE BOOSTER, comme le « 10 » de lexicodex. */}
          <span className={`nav-pastille nav-pastille-booster${dispo === 0 ? ' vide' : ''}`}>{dispo}</span>
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
            {/* LE DECK QUI JOUE : le composer, le regarder jouer (Keko). */}
            <button
              type="button"
              role="menuitemradio"
              aria-checked={page === 'deck'}
              className={`nav-menu-entree${page === 'deck' ? ' nav-menu-active' : ''}`}
              onClick={() => aller('deck')}
            >
              Deck
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
              {deck.partie !== null && <span className="nav-menu-compte">en cours</span>}
            </button>
          </div>
        )}
      </nav>
    </>
  )
}

/**
 * LES ICÔNES DE LA BARRE, dessinées. Keko : « je trouve que ça matche pas :
 * pour collection je verrais bien 3 cartes en éventail, et pour stickers autre
 * chose qu'une étiquette ». *Les emoji 🗂️ et 🏷️ parlaient bureau* ; ici trois
 * cartes aux couleurs des crans (sans l'étoile de la première version, retirée par Keko), et un sticker souriant dont le coin se décolle
 * — le geste de l'album. Le trait est `currentColor` : sombre sur la
 * pilule crème, crème sur le bouton actif.
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
function IconeLike(): React.ReactElement {
  return (
    <svg viewBox="0 0 24 24" strokeLinejoin="round" strokeLinecap="round">
      {/* LE CŒUR. */}
      <path d="M12 21.3S4.3 16.6 2.5 11.7C1.1 8.1 3.3 4.4 7.1 4.4c2 0 3.6 1.1 4.9 2.8 1.3-1.7 2.9-2.8 4.9-2.8 3.8 0 6 3.7 4.6 7.3-1.8 4.9-9.5 9.6-9.5 9.6z" fill="#ff6fa5" stroke="currentColor" strokeWidth="1.4" />
      {/* LE POUCE, au centre du cœur (0,75 : Keko le trouvait « un peu petit »
          à 0,6) : la manchette, puis la main. */}
      <g transform="translate(12 11.4) scale(0.75) translate(-12.8 -10)" stroke="currentColor" strokeWidth="1.5">
        <path d="M6.3 9.3h2.2v6.2H6.3z" fill="#fffaf0" />
        <path d="M8.5 9.6l2.6-4.3a1.3 1.3 0 0 1 2.4.8l-.6 2.9h3.6a1.6 1.6 0 0 1 1.6 1.9l-.8 3.6a1.6 1.6 0 0 1-1.6 1.3H8.5z" fill="#fffaf0" />
      </g>
    </svg>
  )
}

/**
 * LES ABONNÉS : DEUX SILHOUETTES BLEUES, l'une devant l'autre — un public, pas
 * une personne. Keko : « bleu pour les abonnés (et enlève le +, c'est pas très
 * beau, propose un autre concept basé sur la silhouette) ». Celle de derrière
 * en bleu clair, celle de devant en bleu franc, trait en `currentColor`.
 */
function IconeAbonne(): React.ReactElement {
  return (
    <svg viewBox="0 0 24 24" strokeLinejoin="round" strokeLinecap="round">
      {/* DERRIÈRE, à droite, plus petite. */}
      <circle cx="15.8" cy="7.4" r="3.1" fill="#8ec5ff" stroke="currentColor" strokeWidth="1.3" />
      <path d="M10.2 18.6a5.6 5.6 0 0 1 11.2 0z" fill="#8ec5ff" stroke="currentColor" strokeWidth="1.3" />
      {/* DEVANT, à gauche. */}
      <circle cx="9" cy="9" r="3.7" fill="#3b82f6" stroke="currentColor" strokeWidth="1.4" />
      <path d="M2 21.2a7 7 0 0 1 14 0z" fill="#3b82f6" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  )
}

function IconeStickers(): React.ReactElement {
  return (
    <svg viewBox="0 0 24 24" strokeLinejoin="round" strokeLinecap="round">
      {/* LE STICKER, coin bas droit replié. */}
      <path d="M6 3.5h12a2.5 2.5 0 0 1 2.5 2.5v7.5l-7 7H6a2.5 2.5 0 0 1-2.5-2.5V6A2.5 2.5 0 0 1 6 3.5z" fill="#ffd23f" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="8.9" cy="9" r="1.15" fill="#5a3a00" />
      <circle cx="14.1" cy="9" r="1.15" fill="#5a3a00" />
      <path d="M7.8 12.2q3.3 3 6.6 0" fill="none" stroke="#5a3a00" strokeWidth="1.3" />
      {/* LE COIN QUI SE DÉCOLLE : son dos crème. */}
      <path d="M20.5 13.5l-7 7v-4.5a2.5 2.5 0 0 1 2.5-2.5z" fill="#fffaf0" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  )
}

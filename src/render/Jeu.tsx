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
import { useCallback, useEffect, useRef, useState } from 'react'
import type { CarteEmoji } from '../logic/emoji/types.ts'
import type { Bonus } from '../logic/emoji/tirage.ts'
import {
  ajouterPaquet,
  debloquer,
  detruire,
  nombreDeNouvelles,
  toutVu,
  type Collection,
  type Exemplaire,
} from '../logic/emoji/collection.ts'
import { createRng } from '../logic/rng.ts'
import { chargerCollection, chargerReserve, sauverCollection, sauverReserve } from '../ui/collection.ts'
import { RESERVE, prendreUnPaquet, prochainDans, reserveAJour, type Reserve } from '../logic/emoji/reserve.ts'
import { chargerEmojis } from '../ui/emoji.ts'
import { Paquet3D } from './Paquet3D.tsx'
import { PageCollection } from './Collection.tsx'
import { PageStickers } from './Stickers.tsx'
import { SON_CLIC_POP, amorcerLeSon, jouerSon, precharger, reveillerLeSon } from './sons.ts'
import { FondAnime } from './FondAnime.tsx'
import { demanderLInclinaison } from './inclinaison.ts'
import { toileDuTitre } from './texture-carte.ts'

type Page = 'booster' | 'collection' | 'stickers'

/** `&illimite` : la réserve ne se vide jamais — pour tester sans attendre. */
const ILLIMITE = new URLSearchParams(location.search).has('illimite')

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
      <div className="reserve-cases" aria-hidden>
        {Array.from({ length: RESERVE.max }, (_, i) => (
          <i key={i} className={i < paquets ? 'pleine' : ''} />
        ))}
      </div>
      <p className="reserve-texte">
        <b>{paquets}</b>/{RESERVE.max} paquet{paquets > 1 ? 's' : ''}
        {dans !== null && <span className="reserve-dans"> · +1 dans {minuteur(dans)}</span>}
      </p>
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
  const [accueil, setAccueil] = useState(true)
  const [page, setPage] = useState<Page>('booster')
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
   */
  useEffect(() => {
    const cliquer = (e: PointerEvent): void => {
      const bouton = e.target instanceof Element ? e.target.closest('button') : null
      if (bouton !== null && !bouton.classList.contains('vignette') && !bouton.classList.contains('album-case'))
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

  function aller(vers: Page): void {
    if (vers === page) return
    // EN QUITTANT LA COLLECTION, TOUT A ÉTÉ VU : la pastille s'éteint, et les
    // « Nouveau » de la grille avec elle. *Pas en y entrant* : on doit pouvoir
    // les y voir.
    if (page === 'collection') changer(toutVu)
    if (vers === 'booster') setAttente(dispo === 0)
    setPage(vers)
    setCalme(true)
  }

  const nouvelles = nombreDeNouvelles(collection)
  const visible = !accueil && (page !== 'booster' || calme)

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
      ) : (
        <PageCollection
          catalogue={catalogue}
          collection={collection}
          onOuvrirUnPaquet={() => aller('booster')}
          onDetruire={detruireCarte}
        />
      )}
      {!accueil && page === 'booster' && !attente && (
        <div className={`reserve-place${visible ? '' : ' reserve-cachee'}`}>
          <JaugeDeReserve paquets={dispo} dans={dans} />
        </div>
      )}
      <nav className={`nav${visible ? '' : ' nav-cachee'}`} aria-label="Navigation">
        <div className="nav-pilule">
          <button
            type="button"
            className={`nav-moitie nav-gauche${page === 'collection' ? ' nav-active' : ''}`}
            onClick={() => aller('collection')}
          >
            <span className="nav-icone" aria-hidden>
              <IconeCollection />
            </span>
            Collection
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
      </nav>
    </>
  )
}

/**
 * LES ICÔNES DE LA BARRE, dessinées. Keko : « je trouve que ça matche pas :
 * pour collection je verrais bien 3 cartes en éventail, et pour stickers autre
 * chose qu'une étiquette ». *Les emoji 🗂️ et 🏷️ parlaient bureau* ; ici trois
 * cartes aux couleurs des crans, et un sticker souriant dont le coin se décolle
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
      <path d="M12 6.6l0.8 1.6 1.7 0.25-1.25 1.2 0.3 1.7-1.55-0.8-1.55 0.8 0.3-1.7-1.25-1.2 1.7-0.25z" fill="#ff7a00" />
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

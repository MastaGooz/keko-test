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
import { ajouterPaquet, nombreDeNouvelles, toutVu, type Collection } from '../logic/emoji/collection.ts'
import { chargerCollection, sauverCollection } from '../ui/collection.ts'
import { chargerEmojis } from '../ui/emoji.ts'
import { Paquet3D } from './Paquet3D.tsx'
import { PageCollection } from './Collection.tsx'
import { SON_CLIC_POP, amorcerLeSon, jouerSon, precharger, reveillerLeSon } from './sons.ts'
import { FondAnime } from './FondAnime.tsx'
import { toileDuTitre } from './texture-carte.ts'

type Page = 'booster' | 'collection'

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
  const [catalogue, setCatalogue] = useState<CarteEmoji[] | null>(null)
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
   * bouton, et elle a déjà son son, la pose de carte en s'ouvrant.
   */
  useEffect(() => {
    const cliquer = (e: PointerEvent): void => {
      const bouton = e.target instanceof Element ? e.target.closest('button') : null
      if (bouton !== null && !bouton.classList.contains('vignette')) jouerSon(SON_CLIC_POP)
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
  const ajouter = useCallback(
    (ids: readonly string[], bonus: Readonly<Record<string, Bonus>>) =>
      changer((c) => ajouterPaquet(c, ids, bonus, Date.now())),
    [changer],
  )

  function aller(vers: Page): void {
    if (vers === page) return
    // EN QUITTANT LA COLLECTION, TOUT A ÉTÉ VU : la pastille s'éteint, et les
    // « Nouveau » de la grille avec elle. *Pas en y entrant* : on doit pouvoir
    // les y voir.
    if (page === 'collection') changer(toutVu)
    setPage(vers)
    setCalme(true)
  }

  const nouvelles = nombreDeNouvelles(collection)
  const reunies = catalogue === null ? 0 : catalogue.filter((c) => collection.cartes[c.id] !== undefined).length
  const visible = !accueil && (page === 'collection' || calme)

  return (
    <>
      {accueil ? (
        <Accueil onJouer={() => setAccueil(false)} />
      ) : page === 'booster' ? (
        <Paquet3D onPaquetOuvert={ajouter} onCalme={setCalme} sansPrise />
      ) : (
        <PageCollection
          catalogue={catalogue}
          collection={collection}
          onOuvrirUnPaquet={() => aller('booster')}
        />
      )}
      <nav className={`nav${visible ? '' : ' nav-cachee'}`} aria-label="Navigation">
        <div className="nav-pilule">
          <button
            type="button"
            className={`nav-moitie nav-gauche${page === 'collection' ? ' nav-active' : ''}`}
            onClick={() => aller('collection')}
          >
            <span className="nav-icone" aria-hidden>
              🗂️
            </span>
            Collection
            {nouvelles > 0 && <span className="nav-pastille">{nouvelles}</span>}
          </button>
          <span className="nav-place" aria-hidden />
          <button type="button" className="nav-moitie nav-droite" onClick={() => aller('collection')}>
            <b>{reunies}</b>
            <span className="nav-sur">/ {catalogue?.length ?? '…'}</span>
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
        </button>
      </nav>
    </>
  )
}

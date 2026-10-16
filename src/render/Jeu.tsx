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
import { useCallback, useEffect, useState } from 'react'
import type { CarteEmoji } from '../logic/emoji/types.ts'
import type { Bonus } from '../logic/emoji/tirage.ts'
import { ajouterPaquet, nombreDeNouvelles, toutVu, type Collection } from '../logic/emoji/collection.ts'
import { chargerCollection, sauverCollection } from '../ui/collection.ts'
import { chargerEmojis } from '../ui/emoji.ts'
import { Paquet3D } from './Paquet3D.tsx'
import { PageCollection } from './Collection.tsx'
import { SON_CLIC_POP, jouerSon, precharger } from './sons.ts'

type Page = 'booster' | 'collection'

export function Jeu(): React.ReactElement {
  const [page, setPage] = useState<Page>('booster')
  const [collection, setCollection] = useState<Collection>(chargerCollection)
  const [calme, setCalme] = useState(true)
  const [catalogue, setCatalogue] = useState<CarteEmoji[] | null>(null)
  useEffect(() => {
    // LE MÊME FETCH QUE LE PAQUET : `chargerEmojis` partage sa promesse.
    void chargerEmojis().then(setCatalogue, () => setCatalogue([]))
    void precharger(SON_CLIC_POP)
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
    jouerSon(SON_CLIC_POP)
    // EN QUITTANT LA COLLECTION, TOUT A ÉTÉ VU : la pastille s'éteint, et les
    // « Nouveau » de la grille avec elle. *Pas en y entrant* : on doit pouvoir
    // les y voir.
    if (page === 'collection') changer(toutVu)
    setPage(vers)
    setCalme(true)
  }

  const nouvelles = nombreDeNouvelles(collection)
  const reunies = catalogue === null ? 0 : catalogue.filter((c) => collection.cartes[c.id] !== undefined).length
  const visible = page === 'collection' || calme

  return (
    <>
      {page === 'booster' ? (
        <Paquet3D onPaquetOuvert={ajouter} onCalme={setCalme} />
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

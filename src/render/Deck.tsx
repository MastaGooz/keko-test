/**
 * LE DECK QUI JOUE — la page « Jouer » du menu « Cartes ».
 *
 * Keko : « un autre onglet dans le menu carte pour deck (crée le deck) et pour
 * jouer (animation du deck, des mains tirées, de la génération de like) ».
 * *Composer le deck, c'est la grille de la collection en mode deck*
 * (`PageCollection`, prop `deck`) ; ici, c'est le deck qu'on regarde jouer :
 * la pile (le dos de carte), la dernière main tombée, les Likes qui s'envolent
 * vers le compteur, et la barre jusqu'à la main suivante.
 *
 * **Rien ne se décide ici.** Les mains tombent dans `Jeu.tsx` (`deckAJour`, à
 * chaque seconde, sur toutes les pages — « chaque main ajoute immédiatement
 * ses likes ») ; cette page montre la dernière (`derniere`) et, faute d'en
 * avoir vu tomber une dans la session, celle que le mélange dit précédente.
 * La barre, elle, lit l'horloge à chaque image : c'est de l'affichage.
 */
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { CarteEmoji } from '../logic/emoji/types.ts'
import { VARIANTES, compteDe, type Collection, type Variante } from '../logic/emoji/collection.ts'
import { DECK, deckComplet, mainPrecedente, type Deck } from '../logic/emoji/deck.ts'
import { Vignette } from './Collection.tsx'
import { RAYON_SIMPLE, peindreDosEmoji } from './texture-carte.ts'

/** La dernière main tombée dans la session : ce qu'on montre, et ce qui s'envole. */
export interface MainTombee {
  readonly main: readonly string[]
  readonly likes: number
  /** Compte les mains de la session : change à chaque main, pour rejouer l'entrée. */
  readonly numero: number
}

/** La plus belle version possédée d'une carte : celle qu'on montre dans la main. */
function meilleureVariante(col: Collection, id: string): Variante {
  const p = col.cartes[id]
  if (p === undefined) return 'simple'
  return VARIANTES.filter((v) => compteDe(p, v) > 0).at(-1) ?? 'simple'
}

export function PageJouer({
  catalogue,
  collection,
  deck,
  derniere,
  onComposer,
}: {
  catalogue: readonly CarteEmoji[] | null
  collection: Collection
  deck: Deck
  derniere: MainTombee | null
  onComposer: () => void
}): React.ReactElement {
  const parId = useMemo(() => new Map((catalogue ?? []).map((c) => [c.id, c])), [catalogue])
  const complet = deckComplet(deck)
  const main = derniere?.main ?? mainPrecedente(deck)
  const numero = derniere?.numero ?? 0
  const jouees = deck.partie?.jouees ?? 0
  const parCycle = DECK.taille / DECK.main
  const manquent = DECK.taille - deck.cartes.length

  // LA PILE : le dos de carte de l'emoji, peint une fois.
  const pile = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    if (!complet) return
    let vivant = true
    void peindreDosEmoji(RAYON_SIMPLE).then((source) => {
      const c = pile.current
      const ctx = c?.getContext('2d')
      if (!vivant || c == null || ctx == null) return
      c.width = source.width
      c.height = source.height
      ctx.drawImage(source, 0, 0)
    })
    return () => {
      vivant = false
    }
  }, [complet])

  // LA BARRE JUSQU'À LA PROCHAINE MAIN : la largeur à chaque image, sans
  // rendu React ; les secondes affichées, seulement quand elles changent.
  const barre = useRef<HTMLSpanElement>(null)
  const [secondes, setSecondes] = useState(0)
  useEffect(() => {
    const partie = deck.partie
    if (partie === null) return
    let image = 0
    const pas = (): void => {
      const ecoule = Math.max(0, Date.now() - partie.depuis)
      const part = Math.min(1, ecoule / DECK.cadence)
      if (barre.current !== null) barre.current.style.width = `${(part * 100).toFixed(2)}%`
      setSecondes(Math.max(0, Math.ceil((DECK.cadence - ecoule) / 1000)))
      image = requestAnimationFrame(pas)
    }
    image = requestAnimationFrame(pas)
    return () => cancelAnimationFrame(image)
  }, [deck.partie])

  // LES LIKES QUI S'ENVOLENT vers le compteur, en haut à droite. *Hors du
  // défilé*, qui rognerait tout ce qui en sort : un portail sur le corps de la
  // page, en position fixe, posé au-dessus de la main ; la cible se mesure
  // avant la première image (`useLayoutEffect`), l'animation CSS fait le
  // reste. Un élément neuf par main (`key`), donc elle rejoue à chaque fois.
  const zone = useRef<HTMLDivElement>(null)
  const vol = useRef<HTMLSpanElement>(null)
  useLayoutEffect(() => {
    const el = vol.current
    const z = zone.current?.getBoundingClientRect()
    if (el === null || z === undefined) return
    const x0 = z.left + z.width / 2
    const y0 = z.top - 8
    el.style.left = `${x0.toFixed(1)}px`
    el.style.top = `${y0.toFixed(1)}px`
    const cible = document.querySelector('.likes-place .monnaie')?.getBoundingClientRect()
    if (cible === undefined) return
    el.style.setProperty('--dx', `${(cible.left + cible.width / 2 - x0).toFixed(1)}px`)
    el.style.setProperty('--dy', `${(cible.top + cible.height / 2 - y0).toFixed(1)}px`)
  }, [numero])

  return (
    <div className="collection">
      <div className="collection-defile">
        <header className="collection-tete">
          <h1 className="collection-titre">{complet ? 'Le deck joue' : 'Le deck attend'}</h1>
          <p className="collection-compte">
            {complet ? (
              <>
                <b>{DECK.main * DECK.likesParCarte}</b> Likes toutes les {Math.round(DECK.cadence / 1000)} s · main{' '}
                {jouees / DECK.main + 1} / {parCycle} · {DECK.taille - jouees} carte{DECK.taille - jouees > 1 ? 's' : ''} dans la pile
              </>
            ) : (
              <>
                <b>{deck.cartes.length}</b> / {DECK.taille} cartes · il joue dès qu'il est complet
              </>
            )}
          </p>
        </header>

        {!complet ? (
          <div className="collection-vide">
            <p>
              Il manque {manquent} carte{manquent > 1 ? 's' : ''} au deck.
            </p>
            <p className="collection-discret">Trente cartes, et il joue tout seul : cinq cartes, cinq Likes, toutes les dix secondes.</p>
            <button type="button" className="collection-bouton" onClick={onComposer}>
              Composer le deck
            </button>
          </div>
        ) : (
          <div className="jouer">
            {/* LA PILE : trois dos décalés, le compte de ce qui reste à jouer. */}
            <div className="jouer-pile" aria-label={`${DECK.taille - jouees} cartes dans la pile`}>
              <span className="jouer-pile-dos jouer-pile-dos-3" />
              <span className="jouer-pile-dos jouer-pile-dos-2" />
              <canvas ref={pile} className="jouer-pile-dos" />
              <span className="vignette-nombre jouer-pile-compte">{DECK.taille - jouees}</span>
            </div>

            {/* LA BARRE JUSQU'À LA MAIN SUIVANTE. */}
            <div className="jouer-barre" aria-hidden>
              <span ref={barre} />
            </div>
            <p className="jouer-texte">
              Prochaine main dans <b>{secondes} s</b>
            </p>

            {/* LA DERNIÈRE MAIN TOMBÉE, cinq vignettes qui entrent l'une après
                l'autre (`--i`), et ses Likes qui s'envolent. */}
            <div className="jouer-main" key={numero} ref={zone}>
              {main === null ? (
                <p className="jouer-texte collection-discret jouer-premiere">La première main arrive…</p>
              ) : (
                main.map((id, i) => {
                  const carte = parId.get(id)
                  const p = collection.cartes[id] ?? null
                  if (carte === undefined) return null
                  return (
                    <span key={`${id}:${i}`} className="jouer-carte" style={{ '--i': i } as React.CSSProperties}>
                      <Vignette carte={carte} possession={p} variante={meilleureVariante(collection, id)} onOuvrir={() => {}} />
                    </span>
                  )
                })
              )}
            </div>
            {derniere !== null &&
              createPortal(
                <span key={numero} ref={vol} className="jouer-vol" aria-hidden>
                  +{derniere.likes}
                </span>,
                document.body,
              )}
            {main !== null && (
              <p className="jouer-texte collection-discret">
                {derniere !== null ? `+${derniere.likes} Likes` : 'La dernière main jouée'}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

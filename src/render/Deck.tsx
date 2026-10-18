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
import type { Collection } from '../logic/emoji/collection.ts'
import { DECK, deckActif, deckComplet, likesDeLaMain, likesDuDeck, mainPrecedente, type Decks, type EntreeDeck, type ValeurDeCarte } from '../logic/emoji/deck.ts'
import { Vignette } from './Collection.tsx'
import { RAYON_SIMPLE, peindreDosEmoji } from './texture-carte.ts'

/** La dernière main tombée dans la session : ce qu'on montre, et ce qui s'envole. */
export interface MainTombee {
  readonly main: readonly EntreeDeck[]
  readonly likes: number
  /** Compte les mains de la session : change à chaque main, pour rejouer l'entrée. */
  readonly numero: number
}

/**
 * LE TEMPO DE LA MAIN, en millisecondes : les cinq entrent (`entree`, le temps
 * de l'animation CSS `main-entre` et de ses décalages), puis chacune se résout
 * à son tour (`parCarte`), et le total s'envole (`envol` après la dernière).
 * Chiffres de moi, à rejuger : la séquence dure ~4 s sur les 10 de la cadence.
 */
const TEMPO = { entree: 900, parCarte: 380 } as const

export function PageJouer({
  catalogue,
  collection,
  decks,
  valeur,
  derniere,
  onChoisir,
  onComposer,
}: {
  catalogue: readonly CarteEmoji[] | null
  collection: Collection
  decks: Decks
  /** Ce que vaut une carte jouée (un Like plus un par cran) ; `null` tant que le catalogue n'est pas là. */
  valeur: ValeurDeCarte | null
  derniere: MainTombee | null
  /** Choisir le deck qui joue (Keko : « sélectionner celui avec lequel il veut jouer »). */
  onChoisir: (i: number) => void
  onComposer: () => void
}): React.ReactElement {
  const deck = deckActif(decks)
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

  // LA MAIN SE RÉSOUT CARTE PAR CARTE. Keko : « que le total de la main ne
  // s'affiche pas dès le début mais que chaque carte produise son effet avec
  // une petite animation shake/pump chacun son tour ». Les cinq entrent, puis
  // chacune gonfle à son tour et pose son « +n », le total monte avec elles,
  // et c'est lui qui s'envole à la fin. `resolues` compte les cartes passées
  // pour la main `numero` (l'état porte le numéro : une main neuve repart de
  // zéro dès son premier rendu, sans montrer un instant les badges de
  // l'ancienne). Sans main tombée dans la session (on arrive en cours de
  // route), tout est déjà posé, sans séquence.
  const [avancee, setAvancee] = useState({ numero: 0, resolues: 0 })
  useEffect(() => {
    if (derniere === null) return
    const minuteurs = derniere.main.map((_, i) =>
      window.setTimeout(() => setAvancee({ numero: derniere.numero, resolues: i + 1 }), TEMPO.entree + i * TEMPO.parCarte),
    )
    return () => minuteurs.forEach(clearTimeout)
  }, [derniere])
  const resolues = derniere === null ? (main?.length ?? 0) : avancee.numero === numero ? avancee.resolues : 0
  const fini = main !== null && resolues >= main.length
  const total = main === null || valeur === null ? 0 : likesDeLaMain(main.slice(0, resolues), valeur)

  // LES LIKES QUI S'ENVOLENT vers le compteur, en haut à droite. *Hors du
  // défilé*, qui rognerait tout ce qui en sort : un portail sur le corps de la
  // page, en position fixe, posé au-dessus de la main ; la cible se mesure
  // avant la première image (`useLayoutEffect`), l'animation CSS fait le
  // reste. Un élément neuf par main (`key`), monté quand la dernière carte
  // s'est résolue (`fini`), donc elle rejoue à chaque fois.
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
  }, [numero, fini])

  return (
    <div className="collection">
      <div className="collection-defile">
        <header className="collection-tete">
          <h1 className="collection-titre">
            Le deck {decks.actif + 1} {complet ? 'joue' : 'attend'}
          </h1>
          {/* QUEL DECK JOUE : un onglet par deck, les incomplets grisés. */}
          {decks.liste.length > 1 && (
            <div className="decks-onglets" role="tablist" aria-label="Le deck qui joue">
              {decks.liste.map((d, i) => (
                <button
                  key={i}
                  type="button"
                  role="tab"
                  aria-selected={i === decks.actif}
                  className={`deck-onglet${i === decks.actif ? ' deck-onglet-edite' : ''}`}
                  disabled={!deckComplet(d)}
                  onClick={() => onChoisir(i)}
                >
                  Deck {i + 1}
                  <span className="deck-onglet-compte">
                    {d.cartes.length}/{DECK.taille}
                  </span>
                </button>
              ))}
            </div>
          )}
          <p className="collection-compte">
            {complet ? (
              <>
                {/* CE QUE RAPPORTE UN TOUR DU DECK : la somme de ses trente cartes, un
                    Like plus un par cran — c'est là qu'on voit qu'un deck de rares vaut plus. */}
                <b>{valeur === null ? '…' : likesDuDeck(deck, valeur)}</b> Likes par tour · main {jouees / DECK.main + 1} / {parCycle} ·{' '}
                {DECK.taille - jouees} carte{DECK.taille - jouees > 1 ? 's' : ''} dans la pile
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
            <p className="collection-discret">Trente cartes, et il joue tout seul : cinq cartes toutes les dix secondes, un Like par carte et un de plus par cran de rareté.</p>
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
                main.map((e, i) => {
                  const carte = parId.get(e.id)
                  const p = collection.cartes[e.id] ?? null
                  if (carte === undefined) return null
                  // L'EXEMPLAIRE DU DECK, tel quel — sans « ×2 » ni « Nouveau » : une
                  // carte jouée n'est pas une case de la collection (Keko).
                  // La carte qui se résout gonfle (`jouer-carte-pump`) et pose son
                  // « +n » ; les suivantes attendent leur tour, badge compris.
                  const resolue = i < resolues
                  const enCours = derniere !== null && i === resolues - 1
                  return (
                    <span key={`${e.id}:${i}`} className={`jouer-carte${enCours ? ' jouer-carte-pump' : ''}`} style={{ '--i': i } as React.CSSProperties}>
                      <Vignette carte={carte} possession={p} variante={e.v} nue onOuvrir={() => {}} />
                      {/* CE QUE LA CARTE A RAPPORTÉ, sous elle : la main ne fait plus
                          cinq d'office, on dit d'où vient le compte. */}
                      <span className={`jouer-carte-likes${resolue ? ' jouer-carte-likes-posee' : ''}`}>{valeur !== null && resolue ? `+${valeur(e)}` : '\u00a0'}</span>
                    </span>
                  )
                })
              )}
            </div>
            {derniere !== null &&
              fini &&
              createPortal(
                <span key={numero} ref={vol} className="jouer-vol" aria-hidden>
                  +{derniere.likes}
                </span>,
                document.body,
              )}
            {main !== null && (
              <p className="jouer-texte collection-discret">
                {/* LE TOTAL MONTE AVEC LES CARTES : rien tant qu'aucune n'est passée. */}
                {derniere === null ? 'La dernière main jouée' : resolues === 0 ? '\u00a0' : `+${total} Like${total > 1 ? 's' : ''}`}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

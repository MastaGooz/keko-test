/**
 * « MES DECKS » : CHAQUE DECK EST UN ÉTUI. Keko : « quand on ouvre mes decks,
 * ce serait bien de matérialiser les decks par des paquets, sans la
 * collection ou la liste des decks, puis quand on clique sur un deck on ouvre
 * un écran de création/modif du deck (ce qu'on a déjà) » — et pour la forme,
 * « étui de deck » : une boîte de cuir comme le dos des cartes, le nom frappé
 * en or, la carte la plus forte du deck dans une fenêtre sur son camp.
 *
 * *Rien ne se décide ici* : une tape ouvre l'éditeur (`PageCollection` en mode
 * deck), l'étui vide en crée un nouveau. Le deck qui joue porte « Joue ».
 */
import { useEffect, useMemo, useState } from 'react'
import { RARETES_EMOJI, type CarteEmoji } from '../logic/emoji/types.ts'
import { DECK, nomDuDeck, deckComplet, type Deck, type Decks, type EntreeDeck, type ValeurDeCarte } from '../logic/emoji/deck.ts'
import { teinteDuCran } from './Collection.tsx'
import { RAYON_SIMPLE, peindreDosEmoji } from './texture-carte.ts'

const VERSION = encodeURIComponent(__BUILD_TIME__)
const url = (chemin: string): string => `${import.meta.env.BASE_URL}${chemin}?v=${VERSION}`

/**
 * LA CARTE VEDETTE D'UN DECK : celle qui rapporte le plus (`valeur`), à
 * égalité la plus rare puis la première du catalogue. Sans valeur (le
 * catalogue arrive), la plus rare.
 */
function vedetteDe(d: Deck, parId: ReadonlyMap<string, CarteEmoji>, valeur: ValeurDeCarte | null): CarteEmoji | null {
  let meilleure: { carte: CarteEmoji; v: number; cran: number } | null = null
  for (const e of d.cartes as readonly EntreeDeck[]) {
    const carte = parId.get(e.id)
    if (carte === undefined) continue
    const v = valeur === null ? 0 : valeur(e)
    const cran = RARETES_EMOJI.indexOf(carte.rarete)
    if (
      meilleure === null ||
      v > meilleure.v ||
      (v === meilleure.v && (cran > meilleure.cran || (cran === meilleure.cran && carte.rang < meilleure.carte.rang)))
    )
      meilleure = { carte, v, cran }
  }
  return meilleure?.carte ?? null
}

/**
 * LE CUIR DE L'ÉTUI EST LE DOS DES CARTES, peint par le même peintre
 * (`peindreDosEmoji` : le cuir capitonné, le liseré d'or, les clous) — Keko :
 * « tu peux mettre vraiment la même texture et bordure de dos de carte sur
 * les decks ? ». Peint une fois par session, servi en image de fond.
 */
let DOS: Promise<string | null> | null = null
function imageDuDos(): Promise<string | null> {
  DOS ??= peindreDosEmoji(RAYON_SIMPLE, false).then(
    (toile) => new Promise<string | null>((resoudre) => toile.toBlob((b) => resoudre(b === null ? null : URL.createObjectURL(b)), 'image/webp', 0.9)),
    () => null,
  )
  return DOS
}

export function PageDecks({
  catalogue,
  decks,
  valeur,
  peutAjouter,
  onOuvrir,
  onAjouter,
}: {
  catalogue: readonly CarteEmoji[] | null
  decks: Decks
  valeur: ValeurDeCarte | null
  peutAjouter: boolean
  /** Ouvre l'éditeur de ce deck. */
  onOuvrir: (i: number) => void
  /** Un deck de plus, ouvert aussitôt dans l'éditeur. */
  onAjouter: () => void
}): React.ReactElement {
  const parId = useMemo(() => new Map((catalogue ?? []).map((c) => [c.id, c])), [catalogue])
  const actif = decks.liste[decks.actif]
  const [dos, setDos] = useState<string | null>(null)
  useEffect(() => {
    let vivant = true
    void imageDuDos().then((u) => {
      if (vivant) setDos(u)
    })
    return () => {
      vivant = false
    }
  }, [])
  return (
    <div className="collection">
      <div className="collection-defile">
        <header className="collection-tete">
          <h1 className="collection-titre">Mes decks</h1>
          <p className="collection-compte">
            <b>{decks.liste.length}</b> deck{decks.liste.length > 1 ? 's' : ''}
            {actif !== undefined && deckComplet(actif) && <> · {nomDuDeck(actif, decks.actif)} joue</>}
          </p>
        </header>
        <div className="etuis">
          {decks.liste.map((d, i) => {
            const vedette = vedetteDe(d, parId, valeur)
            const joue = i === decks.actif && deckComplet(d)
            return (
              <button
                key={i}
                type="button"
                className={`etui${joue ? ' etui-joue' : ''}`}
                style={dos === null ? undefined : { backgroundImage: `url(${dos})` }}
                aria-label={`${nomDuDeck(d, i)}, ${d.cartes.length} cartes sur ${DECK.taille}${joue ? ', joue' : ''}`}
                onClick={() => onOuvrir(i)}
              >
                {joue && <span className="etui-ruban">Joue</span>}
                {/* LA FENÊTRE : la carte vedette sur son camp ; vide, le symbole du jeu. */}
                <span
                  className="etui-fenetre"
                  style={
                    vedette === null
                      ? undefined
                      : ({ backgroundImage: `url(${url(`fonds/${vedette.race}.webp`)})`, '--cran': teinteDuCran(vedette.rarete) } as React.CSSProperties)
                  }
                >
                  {vedette === null ? (
                    <img className="etui-symbole" src={url('symbole.webp')} alt="" draggable={false} />
                  ) : (
                    <img className="etui-vedette" src={url(vedette.image)} alt="" draggable={false} />
                  )}
                </span>
                <span className="etui-nom">{nomDuDeck(d, i)}</span>
                <span className={`etui-compte${d.cartes.length < DECK.taille ? ' etui-incomplet' : ''}`}>
                  {d.cartes.length < DECK.taille ? `${d.cartes.length}/${DECK.taille} · incomplet` : `${DECK.taille} cartes`}
                </span>
              </button>
            )
          })}
          {peutAjouter && (
            <button type="button" className="etui etui-nouveau" onClick={onAjouter}>
              <span className="etui-plus" aria-hidden>
                +
              </span>
              <span className="etui-nom">Nouveau deck</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

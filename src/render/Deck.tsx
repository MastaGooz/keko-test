/**
 * LA PAGE « JOUER » : LES LIEUX. Keko (28/10) : « « Jouer » devient la carte
 * des lieux » — chaque lieu, sa jauge qui monte, l'or qu'elle rend, le deck
 * posé dessus (une tape pour le choisir) ; les lieux fermés, leur prix. Une
 * tape sur un lieu montre son deck qui joue : la pile, la dernière main
 * tombée et son total qui monte carte après carte, la barre jusqu'à la main
 * suivante.
 *
 * **Rien ne se décide ici.** Les mains tombent dans `Jeu.tsx` (`decksAJour`,
 * à chaque seconde, sur toutes les pages), leur puissance entre dans la jauge
 * du lieu (`remplirLaJauge`) ; cette page montre la dernière main de chaque
 * lieu (`mains`) et, faute d'en avoir vu tomber une dans la session, celle
 * que le mélange dit précédente. La barre lit l'horloge à chaque image : c'est
 * de l'affichage.
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { CarteEmoji } from '../logic/emoji/types.ts'
import { NOM_DU_ROLE } from '../logic/emoji/types.ts'
import type { Collection } from '../logic/emoji/collection.ts'
import {
  DECK,
  deckComplet,
  deckDuLieu,
  likesDeLaMain,
  likesDuDeck,
  mainPrecedente,
  nomDuDeck,
  type Deck,
  type Decks,
  type Partie,
  type EntreeDeck,
  type ValeurDeCarte,
} from '../logic/emoji/deck.ts'
import { LIEUX, estOuvert, type EtatLieux, type Lieu } from '../logic/emoji/lieux.ts'
import { Vignette } from './Collection.tsx'
import { EtuiMiniature } from './Decks.tsx'
import { IconeLike, IconeOr } from './Jeu.tsx'
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
 * à son tour (`parCarte`), le total montant avec elles.
 * Chiffres de moi, à rejuger : la séquence dure ~3 s sur les 10 de la cadence.
 */
const TEMPO = { entree: 900, parCarte: 380 } as const

const VERSION = encodeURIComponent(__BUILD_TIME__)
/**
 * L'IMAGE D'UN LIEU (Keko : « mettre des images pour les lieux, on avait trié
 * une catégorie lieux ; là c'est trop textuel ») : les découpes du tri de
 * Keko (`Desktop\Style\tri\lieux`), rognées au dessin, 512 carré, dans
 * `public/lieux/<id>.webp`.
 */
const imageDuLieu = (l: Lieu): string => `${import.meta.env.BASE_URL}lieux/${l.id}.webp?v=${VERSION}`

/**
 * OÙ CHAQUE LIEU EST POSÉ SUR LA CARTE, en % de la carte (le centre de son
 * image), et de quel côté son deck se range — vers le bord, le chemin passe
 * au milieu. De moi, à rejuger.
 */
const PLACE_SUR_LA_CARTE: Readonly<Record<string, { x: number; y: number; deck: 'gauche' | 'droite' }>> = {
  taverne: { x: 28, y: 80, deck: 'gauche' },
  mine: { x: 72, y: 49, deck: 'droite' },
  arene: { x: 28, y: 18, deck: 'gauche' },
}
/**
 * OÙ COMMENCE LE DESSIN dans son image carrée, en part de sa hauteur (alpha
 * > 40, mesuré sur `public/lieux/*.webp`) : tous touchent le bas, pas le haut.
 * Le nom se pose sur le dessin, pas sur la case — sinon il flotte au-dessus
 * d'un vide. À remesurer si une image change.
 */
const HAUT_DU_DESSIN: Readonly<Record<string, number>> = { taverne: 0.16, mine: 0.2, arene: 0.33 }

/** Où le chemin quitte l'image, en % de la carte : un peu en deçà de son bord, caché derrière elle. */
const BORD_DE_L_IMAGE = 9

/** « à la Taverne », « à l'Arène », « à la Mine gobeline ». */
export function aLieu(l: Lieu): string {
  return `à ${l.nom.replace(/^(La |Le |L')/, (m) => m.toLowerCase())}`
}

/** Ce que le lieu ajoute : « +1 par carte Soutien », ou rien. */
function texteDuBonus(l: Lieu): string {
  return l.bonus === null ? 'Sans bonus' : `+${l.bonus.plus} aux cartes ${NOM_DU_ROLE[l.bonus.role]}`
}

export function PageJouer({
  catalogue,
  collection,
  decks,
  valeurDe,
  lieux,
  mains,
  ors,
  onPoser,
  onOuvrirLieu,
  onComposer,
}: {
  catalogue: readonly CarteEmoji[] | null
  collection: Collection
  decks: Decks
  /** Ce que vaut une carte jouée par ce deck, bonus de son lieu compris ; `null` tant que le catalogue n'est pas là. */
  valeurDe: ((d: Deck) => ValeurDeCarte) | null
  lieux: EtatLieux
  /** La dernière main tombée dans la session, par lieu. */
  mains: Readonly<Record<string, MainTombee>>
  /** Le dernier or rendu par chaque lieu (`numero` change à chaque jauge pleine). */
  ors: Readonly<Record<string, { numero: number; or: number }>>
  /** Pose le deck `i` sur un lieu (`null` : l'en retire). */
  onPoser: (i: number, lieu: string | null) => void
  onOuvrirLieu: (id: string) => void
  /** Ouvre l'éditeur du deck `i`. */
  onComposer: (i: number) => void
}): React.ReactElement {
  const parId = useMemo(() => new Map((catalogue ?? []).map((c) => [c.id, c])), [catalogue])
  /** Le lieu qu'on regarde jouer ; `null` : la liste des lieux. */
  const [vu, setVu] = useState<string | null>(null)
  /** Le lieu dont on choisit le deck (la fenêtre est ouverte). */
  const [aPoser, setAPoser] = useState<string | null>(null)
  // LES GAINS DÉJÀ LÀ EN ARRIVANT NE SE REJOUENT PAS : seul l'or rendu sous nos yeux saute.
  const orsAuDepart = useRef(ors)
  const lieuVu = vu === null ? undefined : LIEUX.find((l) => l.id === vu && estOuvert(lieux, l.id))

  const dialogue =
    aPoser !== null &&
    createPortal(
      <ChoixDuDeck
        lieu={LIEUX.find((l) => l.id === aPoser)!}
        decks={decks}
        onPoser={(i) => {
          onPoser(i, aPoser)
          setAPoser(null)
        }}
        onRetirer={(i) => {
          onPoser(i, null)
          setAPoser(null)
        }}
        onComposer={(i) => {
          setAPoser(null)
          onComposer(i)
        }}
        onFermer={() => setAPoser(null)}
      />,
      document.body,
    )

  if (lieuVu !== undefined) {
    const k = deckDuLieu(decks, lieuVu.id)
    const deck = k === null ? undefined : decks.liste[k]
    return (
      <div className="collection collection-avec-likes">
        <div className="collection-defile">
          <header className="collection-tete">
            <button type="button" className="deck-retour" onClick={() => setVu(null)}>
              ‹ Les lieux
            </button>
            <h1 className="collection-titre">{lieuVu.nom}</h1>
            <p className="collection-compte">{texteDuBonus(lieuVu)}</p>
            <div className="lieu-scene lieu-scene-vue">
              <PlaceDuDeck deck={deck} i={k} parId={parId} valeur={deck === undefined || valeurDe === null ? null : valeurDe(deck)} onChoisir={() => setAPoser(lieuVu.id)} />
              <div className="lieu-droite">
                <img className="lieu-image" src={imageDuLieu(lieuVu)} alt="" draggable={false} />
                <JaugeDuLieu lieu={lieuVu} lieux={lieux} gain={ors[lieuVu.id]} gainAuDepart={orsAuDepart.current[lieuVu.id]} />
              </div>
            </div>
          </header>
          {deck === undefined || k === null ? (
            <div className="collection-vide">
              <p>Aucun deck ne joue ici.</p>
              <button type="button" className="collection-bouton" onClick={() => setAPoser(lieuVu.id)}>
                Poser un deck
              </button>
            </div>
          ) : !deckComplet(deck) ? (
            <div className="collection-vide">
              <p>
                Il manque {DECK.taille - deck.cartes.length} carte{DECK.taille - deck.cartes.length > 1 ? 's' : ''} à {nomDuDeck(deck, k)}.
              </p>
              <p className="collection-discret">Trente cartes, et il joue tout seul : cinq cartes toutes les dix secondes.</p>
              <button type="button" className="collection-bouton" onClick={() => onComposer(k)}>
                Composer le deck
              </button>
            </div>
          ) : (
            <DeckEnJeu
              deck={deck}
              collection={collection}
              parId={parId}
              valeur={valeurDe === null ? null : valeurDe(deck)}
              derniere={mains[lieuVu.id] ?? null}
            />
          )}
        </div>
        {dialogue}
      </div>
    )
  }

  return (
    <div className="collection collection-avec-likes">
      <div className="collection-defile">
        <header className="collection-tete">
          <h1 className="collection-titre">Les lieux</h1>
          <p className="collection-compte">
            <b>{lieux.ouverts.length}</b> / {LIEUX.length} ouverts
          </p>
        </header>
        {/* LA CARTE DES LIEUX (Keko : « sous la forme d'une map, avec des chemins
            qui relient les lieux ; des lieux et des jauges plus petits, le deck
            mis à côté »). Le chemin part de la Taverne, en bas, et monte. */}
        <div className="carte-lieux">
          <svg className="carte-chemins" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
            {LIEUX.slice(1).map((l, n) => {
              const a = PLACE_SUR_LA_CARTE[LIEUX[n]!.id]!
              const b = PLACE_SUR_LA_CARTE[l.id]!
              // DE CÔTÉ À CÔTÉ, à plat : le chemin sort de l'image (derrière elle) du
              // côté opposé au deck, et ne coupe ni les noms ni les jauges.
              const ax = a.deck === 'gauche' ? a.x + BORD_DE_L_IMAGE : a.x - BORD_DE_L_IMAGE
              const bx = b.deck === 'gauche' ? b.x + BORD_DE_L_IMAGE : b.x - BORD_DE_L_IMAGE
              const m = (ax + bx) / 2
              return (
                <path
                  key={l.id}
                  className={estOuvert(lieux, l.id) ? 'carte-chemin' : 'carte-chemin carte-chemin-ferme'}
                  d={`M ${ax} ${a.y} C ${m} ${a.y}, ${m} ${b.y}, ${bx} ${b.y}`}
                  vectorEffect="non-scaling-stroke"
                />
              )
            })}
          </svg>
          {LIEUX.map((l) => {
            const place = PLACE_SUR_LA_CARTE[l.id]!
            const style = { left: `${place.x}%`, top: `${place.y}%`, '--haut-dessin': HAUT_DU_DESSIN[l.id] ?? 0 } as React.CSSProperties
            if (!estOuvert(lieux, l.id)) {
              return (
                <div key={l.id} className="carte-lieu carte-lieu-ferme" style={style}>
                  <h2 className="carte-lieu-nom">{l.nom}</h2>
                  <img className="carte-lieu-image" src={imageDuLieu(l)} alt="" draggable={false} />
                  <button
                    type="button"
                    className="carte-lieu-ouvrir"
                    disabled={l.prix > lieux.or}
                    aria-label={`Ouvrir ${l.nom} pour ${l.prix} or`}
                    onClick={() => onOuvrirLieu(l.id)}
                  >
                    Ouvrir · <IconeOr /> {l.prix}
                  </button>
                </div>
              )
            }
            const k = deckDuLieu(decks, l.id)
            const deck = k === null ? undefined : decks.liste[k]
            return (
              <div key={l.id} className="carte-lieu" style={style}>
                <h2 className="carte-lieu-nom">{l.nom}</h2>
                <button type="button" className="carte-lieu-voir" aria-label={`Voir ${l.nom}`} onClick={() => setVu(l.id)}>
                  <img className="carte-lieu-image" src={imageDuLieu(l)} alt="" draggable={false} />
                </button>
                <div className="carte-lieu-jauge">
                  <JaugeDuLieu lieu={l} lieux={lieux} gain={ors[l.id]} gainAuDepart={orsAuDepart.current[l.id]} />
                </div>
                <div className={`carte-lieu-deck carte-lieu-deck-${place.deck}`}>
                  <PlaceDuDeck deck={deck} i={k} parId={parId} valeur={deck === undefined || valeurDe === null ? null : valeurDe(deck)} onChoisir={() => setAPoser(l.id)} minuteur />
                </div>
              </div>
            )
          })}
        </div>
      </div>
      {dialogue}
    </div>
  )
}

/**
 * LA JAUGE D'UN LIEU : la puissance déjà là sur ce qu'il faut, et l'or qu'elle
 * rendra. Quand elle se remplit sous nos yeux, « +10 » et sa pièce s'envolent.
 */
function JaugeDuLieu({
  lieu,
  lieux,
  gain,
  gainAuDepart,
}: {
  lieu: Lieu
  lieux: EtatLieux
  gain: { numero: number; or: number } | undefined
  gainAuDepart: { numero: number; or: number } | undefined
}): React.ReactElement {
  const dedans = lieux.jauges[lieu.id] ?? 0
  const neuf = gain !== undefined && gain.numero > (gainAuDepart?.numero ?? 0)
  return (
    <div className="lieu-jauge-place">
      <div className="lieu-jauge" role="progressbar" aria-valuemin={0} aria-valuemax={lieu.jauge} aria-valuenow={dedans}>
        <span style={{ width: `${((dedans / lieu.jauge) * 100).toFixed(1)}%` }} />
      </div>
      <p className="lieu-jauge-texte">
        <IconeLike /> <b>{dedans}</b> / {lieu.jauge} → <IconeOr /> {lieu.or}
      </p>
      {neuf && (
        <span key={gain.numero} className="lieu-gain" aria-live="polite">
          +{gain.or} <IconeOr />
        </span>
      )}
    </div>
  )
}

/**
 * LA PLACE DU DECK, à gauche du lieu : L'ÉTUI SEUL, et c'est lui qu'on touche
 * pour changer de deck (Keko : « uniquement l'image du deck, cliquable, pas
 * besoin de “joue” ou de bouton ») — ou la place vide en pointillé. Un deck
 * posé qui a perdu une carte le dit d'une pastille rouge : il ne joue plus.
 */
function PlaceDuDeck({
  deck,
  i,
  parId,
  valeur,
  onChoisir,
  minuteur = false,
}: {
  deck: Deck | undefined
  i: number | null
  parId: ReadonlyMap<string, CarteEmoji>
  valeur: ValeurDeCarte | null
  onChoisir: () => void
  /** Montre sur l'étui le temps jusqu'à la main suivante (la carte des lieux). */
  minuteur?: boolean
}): React.ReactElement {
  const vide = deck === undefined || i === null
  return (
    <button
      type="button"
      className="lieu-gauche lieu-deck"
      aria-label={vide ? 'Poser un deck' : `${nomDuDeck(deck, i)} — changer de deck`}
      onClick={onChoisir}
    >
      {vide ? (
        <span className="lieu-deck-place" aria-hidden>
          +
        </span>
      ) : (
        <>
          <EtuiMiniature deck={deck} parId={parId} valeur={valeur} />
          {minuteur && deck.partie !== null && <MinuteurDeMain partie={deck.partie} />}
          {!deckComplet(deck) && (
            <span className="lieu-deck-incomplet">
              {deck.cartes.length}/{DECK.taille}
            </span>
          )}
        </>
      )}
    </button>
  )
}

/**
 * LE MINUTEUR DE LA MAIN, sur l'étui de la carte des lieux (Keko : « une
 * indication de timer sur les mains des decks ») : un anneau d'or qui se
 * remplit jusqu'à la main suivante, les secondes au milieu. L'anneau suit
 * l'horloge à chaque image sans rendu React ; les secondes, quand elles changent.
 */
function MinuteurDeMain({ partie }: { partie: Partie }): React.ReactElement {
  const anneau = useRef<SVGCircleElement>(null)
  const [secondes, setSecondes] = useState(() => Math.ceil(DECK.cadence / 1000))
  useEffect(() => {
    let image = 0
    const pas = (): void => {
      const ecoule = Math.max(0, Date.now() - partie.depuis)
      const part = Math.min(1, ecoule / DECK.cadence)
      if (anneau.current !== null) anneau.current.style.strokeDashoffset = `${(100 * (1 - part)).toFixed(2)}`
      setSecondes(Math.max(0, Math.ceil((DECK.cadence - ecoule) / 1000)))
      image = requestAnimationFrame(pas)
    }
    image = requestAnimationFrame(pas)
    return () => cancelAnimationFrame(image)
  }, [partie])
  return (
    <span className="minuteur-main" aria-label={`Prochaine main dans ${secondes} s`}>
      <svg viewBox="0 0 36 36" aria-hidden>
        <circle className="minuteur-main-fond" cx="18" cy="18" r="15.9155" />
        <circle ref={anneau} className="minuteur-main-anneau" cx="18" cy="18" r="15.9155" pathLength={100} />
      </svg>
      <b>{secondes}</b>
    </span>
  )
}

/**
 * QUEL DECK SUR CE LIEU : les decks complets se posent (celui qui joue
 * ailleurs le quitte pour ici) ; un incomplet se compose d'abord.
 */
function ChoixDuDeck({
  lieu,
  decks,
  onPoser,
  onRetirer,
  onComposer,
  onFermer,
}: {
  lieu: Lieu
  decks: Decks
  onPoser: (i: number) => void
  onRetirer: (i: number) => void
  onComposer: (i: number) => void
  onFermer: () => void
}): React.ReactElement {
  const ici = deckDuLieu(decks, lieu.id)
  return (
    <div className="prendre-voile" onClick={onFermer}>
      <div className="prendre lieu-choix" role="dialog" aria-modal="true" aria-labelledby="lieu-choix-titre" onClick={(e) => e.stopPropagation()}>
        <p id="lieu-choix-titre" className="prendre-question">
          Quel deck {aLieu(lieu)} ?
        </p>
        <div className="lieu-choix-liste">
          {decks.liste.map((d, i) => {
            const complet = deckComplet(d)
            const ailleurs = d.lieu !== undefined && d.lieu !== lieu.id ? LIEUX.find((l) => l.id === d.lieu) : undefined
            return (
              <button
                key={i}
                type="button"
                className={`lieu-choix-deck${i === ici ? ' lieu-choix-ici' : ''}`}
                onClick={() => (i === ici ? onFermer() : complet ? onPoser(i) : onComposer(i))}
              >
                <span className="lieu-choix-nom">{nomDuDeck(d, i)}</span>
                <span className="lieu-choix-detail">
                  {i === ici
                    ? 'joue ici'
                    : !complet
                      ? `${d.cartes.length}/${DECK.taille} · à compléter`
                      : ailleurs !== undefined
                        ? `joue ${aLieu(ailleurs)} · le déplacer`
                        : 'prêt'}
                </span>
              </button>
            )
          })}
        </div>
        <div className="prendre-boutons">
          <button type="button" className="prendre-annuler" onClick={onFermer}>
            Annuler
          </button>
          {ici !== null && (
            <button type="button" className="prendre-annuler" onClick={() => onRetirer(ici)}>
              Retirer le deck
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

/** LE DECK QUI JOUE SUR UN LIEU : la pile, la barre jusqu'à la main suivante, la dernière main. */
function DeckEnJeu({
  deck,
  collection,
  parId,
  valeur,
  derniere,
}: {
  deck: Deck
  collection: Collection
  parId: ReadonlyMap<string, CarteEmoji>
  valeur: ValeurDeCarte | null
  derniere: MainTombee | null
}): React.ReactElement {
  const main = derniere?.main ?? mainPrecedente(deck)
  const numero = derniere?.numero ?? 0
  const jouees = deck.partie?.jouees ?? 0
  const parCycle = DECK.taille / DECK.main

  // AU RETOUR SUR LA PAGE (onglet réduit puis rouvert), LA ZONE DE JEU SE
  // RECONSTRUIT : les mains rattrapées pendant l'absence laissaient des couches
  // peintes que le navigateur ne retirait plus.
  const [retour, setRetour] = useState(0)
  useEffect(() => {
    const voir = (): void => {
      if (document.visibilityState === 'visible') setRetour((r) => r + 1)
    }
    document.addEventListener('visibilitychange', voir)
    return () => document.removeEventListener('visibilitychange', voir)
  }, [])

  // LA PILE : le dos de carte, peint une fois.
  const pile = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
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
  }, [retour])

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
  // sous elle. `resolues` compte les cartes passées pour la main `numero`
  // (l'état porte le numéro : une main neuve repart de zéro dès son premier
  // rendu, sans montrer un instant les badges de l'ancienne). Sans main tombée
  // dans la session (on arrive en cours de route), tout est déjà posé, sans
  // séquence.
  const [avancee, setAvancee] = useState({ numero: 0, resolues: 0 })
  useEffect(() => {
    if (derniere === null) return
    const minuteurs = derniere.main.map((_, i) =>
      window.setTimeout(() => setAvancee({ numero: derniere.numero, resolues: i + 1 }), TEMPO.entree + i * TEMPO.parCarte),
    )
    return () => minuteurs.forEach(clearTimeout)
  }, [derniere])
  const resolues = derniere === null ? (main?.length ?? 0) : avancee.numero === numero ? avancee.resolues : 0
  const total = main === null || valeur === null ? 0 : likesDeLaMain(main.slice(0, resolues), valeur)

  return (
    <div className="jouer" key={retour}>
      <p className="jouer-texte">
        {/* CE QUE RAPPORTE UN TOUR DU DECK ICI : ses trente cartes, bonus du lieu compris. */}
        <b>{valeur === null ? '…' : likesDuDeck(deck, valeur)}</b> de puissance par tour · main {jouees / DECK.main + 1} / {parCycle}
      </p>
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
          l'autre (`--i`), puis se résolvent une à une. */}
      <div className="jouer-main" key={numero}>
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
                {/* CE QUE LA CARTE A RAPPORTÉ, sous elle, bonus du lieu compris. */}
                <span className={`jouer-carte-likes${resolue ? ' jouer-carte-likes-posee' : ''}`}>{valeur !== null && resolue ? `+${valeur(e)}` : ' '}</span>
              </span>
            )
          })
        )}
      </div>
      {/* LE TOTAL DE LA MAIN, UNE SEULE FOIS, SOUS ELLE (Keko) : rien tant
          qu'aucune carte n'est passée, puis l'icône et le compte, remontés à
          chaque hausse (`key`) pour rejouer le saut. Il entre dans la jauge. */}
      {main !== null &&
        (derniere === null ? (
          <p className="jouer-texte collection-discret">La dernière main jouée</p>
        ) : (
          <p className="jouer-texte jouer-total" key={resolues} aria-live="polite">
            {resolues === 0 ? (
              ' '
            ) : (
              <>
                <IconeLike />
                <span className="jouer-total-saut">+{total}</span>
              </>
            )}
          </p>
        ))}
    </div>
  )
}

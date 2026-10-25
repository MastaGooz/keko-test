/**
 * LA COLLECTION — la grille des cartes obtenues, et la carte qu'on y regarde.
 *
 * Keko : « une interface de navigation qui va nous permettre de passer de
 * l'ouverture de booster à la collection des cartes acquises. Inspire-toi de
 * lexicodex. »
 *
 * **CE QUI VIENT DE LEXICODEX**, relevé en ouvrant sa collection : un titre
 * et le compte, une recherche, un tri (récentes, A → Z, plus rares), un filtre
 * par rareté, puis une grille de petites cartes ; une tape en ouvre une en
 * grand, qu'on fait pencher, avec la date où on l'a obtenue.
 *
 * ***LES VIGNETTES SONT PEINTES, PAS RENDUES EN 3D*** : une grille de cent
 * cartes en WebGL, c'est cent nuanceurs pour une image fixe. Chaque vignette
 * est la même peinture que la carte (`peindreCarte`), à sa taille d'écran,
 * **seulement quand elle entre dans la vue** et une à la fois. *La 3D est
 * gardée pour la carte qu'on ouvre* : là, le holo et l'animé ont de quoi jouer.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Canvas } from '@react-three/fiber'
import { NoToneMapping } from 'three'
import type { CarteEmoji, RaceCarte, RareteEmoji, RoleCarte } from '../logic/emoji/types.ts'
import { NOM_DE_LA_RACE, NOM_DU_ROLE, RACES, RARETES_EMOJI, ROLES } from '../logic/emoji/types.ts'
import type { Collection, Exemplaire, Possession, StickerColle, Variante } from '../logic/emoji/collection.ts'
import { VARIANTES, compteDe, exemplaireDe, nombreDeColles, nombreDExemplaires } from '../logic/emoji/collection.ts'
import { Decollage } from './Decollage.tsx'
import { AMBIANCE, TAILLE_COLLE, collesSeChevauchent, placeDuColle, placeNonCoupee, type SujetPeint, tailleQuIlFaut } from './texture-carte.ts'
import { animationHolo, cleDesColles, coucheDesRayons, paillettesHolo, peinte, stickerPeint, stickersColles, sujetDeLaVignette, type StickerPeint } from './peinture-vignette.ts'
import { COTE_PETIT, animationDeLEmoji, urlAnimationEmoji } from './emoji-anime.ts'
import { AVEC_TOURNE, RAYONS_TOURNANTS } from './Carte3D.tsx'
import { RAYONS_DANS_LA_CARTE } from './texture-carte.ts'

/**
 * LES RAYONS DES CARTES ANIMÉES TOURNENT AUSSI DANS LA GRILLE. Keko : « l'effet
 * de rotation uniquement pour les cartes animées, à l'ouverture, au zoom, mais
 * aussi dans la collection ». Une vignette est une image ; elle se monte donc
 * en trois couches : la carte sans emoji ni rayons, les rayons seuls qui
 * tournent (CSS, à la vitesse de la 3D, `RAYONS_TOURNANTS`), et le sticker
 * par-dessus. Les rayons sont pris sur la carte elle-même, brillant compris
 * (`coucheDesRayons`) : Keko trouvait le fond des animées plus sombre.
 *
 * **ET L'EMOJI S'Y ANIME.** Keko : « les emoji des cartes animées ne s'animent
 * pas dans la page de collection (uniquement au zoom) ». Le sticker était l'image
 * fixe ; la vignette à l'écran joue maintenant les images décodées (`COTE_PETIT`,
 * celles de l'album), posées à la place du sticker fixe (`sujetDe`), au cerne
 * arc-en-ciel pour une holo (`animationHolo`). Hors de la vue, rien ne tourne.
 */
const DUREE_TOUR = (Math.PI * 2) / RAYONS_TOURNANTS.vitesse
const R_FEN = RAYONS_DANS_LA_CARTE
const STYLE_FENETRE: React.CSSProperties = {
  left: `${R_FEN.x * 100}%`,
  top: `${R_FEN.y * 100}%`,
  width: `${R_FEN.l * 100}%`,
  height: `${R_FEN.h * 100}%`,
}
const STYLE_RAYONS: React.CSSProperties = {
  width: `${((2 * R_FEN.rayon * 1.05) / R_FEN.l) * 100}%`,
  height: `${((2 * R_FEN.rayon * 1.05) / (R_FEN.h * 1.4)) * 100}%`,
  animationDuration: `${DUREE_TOUR.toFixed(1)}s`,
  filter: `saturate(${1 + SATURATION_APLAT})`,
}

/** Trois tirages de paillettes vives, qui s'allument à tour de rôle (voir `.vignette-scintille`). */
const SCINTILLES = [0, 1, 2] as const
import { COULEUR, carteDeLEmoji, enTitre } from './carte-emoji.ts'
import { Carte3D, HAUT, LARGE, SATURATION_APLAT, type CurseurDeCarte } from './Carte3D.tsx'
import { Cadrage, FOV, Z_MAIN, hauteurVisibleA, zCamera } from './Cadrage.tsx'
import { Horloge } from './horloge.tsx'
import { Bloom } from './Bloom.tsx'
import { PencheAuGyro } from './Paquet3D.tsx'
import { suivreLInclinaison, type Inclinaison } from './inclinaison.ts'
import { SON_POSER, jouerSon } from './sons.ts'

export const NOM_DE_LA_VARIANTE: Readonly<Record<Variante, string>> = {
  simple: 'normal',
  holo: 'holo',
  anime: 'animé',
  holoAnime: 'holo animé',
}

const NOM_DE_LA_RARETE: Readonly<Record<RareteEmoji, string>> = {
  commun: 'Commune',
  'peu-commun': 'Peu commune',
  rare: 'Rare',
  epique: 'Épique',
  legendaire: 'Légendaire',
}

/** La couleur d'un cran, celle de son halo : *un pigment ne survit pas à la diffusion.* */
export function teinteDuCran(r: RareteEmoji): string {
  return AMBIANCE[COULEUR[r]] ?? '#ffffff'
}

type Tri = 'recentes' | 'az' | 'rares'

const TRIS: readonly { id: Tri; nom: string }[] = [
  { id: 'recentes', nom: 'Récentes' },
  { id: 'az', nom: 'A → Z' },
  { id: 'rares', nom: 'Plus rares' },
]

/** Ajoute ou retire une valeur d'un filtre : rien de coché, tout passe. */
function basculer<T>(s: ReadonlySet<T>, v: T): ReadonlySet<T> {
  const n = new Set(s)
  if (n.has(v)) n.delete(v)
  else n.add(v)
  return n
}

/**
 * LE FILTRE PAR BONUS. Keko : « ajouter un filtre holo et animé dans la
 * collection et les stickers ». Comme les raretés, plusieurs à la fois et rien
 * de coché laisse tout passer ; cochés ensemble, une carte passe si elle a
 * l'un OU l'autre.
 */
/** Obtenues / manquantes — « Toutes les cartes » seulement (voir `PageCollection`). */
type PossessionFiltre = 'obtenues' | 'manquantes'
const POSSESSION_FILTRES: readonly { id: PossessionFiltre; nom: string }[] = [
  { id: 'obtenues', nom: 'Obtenues' },
  { id: 'manquantes', nom: 'Manquantes' },
]

export type BonusFiltre = 'normal' | 'holo' | 'anime'
const BONUS_FILTRES: readonly { id: BonusFiltre; nom: string }[] = [
  // « NORMAL » D'ABORD (Keko : « afin de pouvoir sélectionner uniquement les
  // cartes non holos ») : la version sans aucun bonus.
  { id: 'normal', nom: 'Normal' },
  { id: 'holo', nom: 'Holo' },
  // PLUS DE PUCE « ANIMÉ » : aucune illustration du fantasy n'est animée (Keko :
  // « enlève le filtre animé car y'a plus de cartes animées »). Le type la garde
  // pour le jour où il y en aurait.
]
export function passeLeBonus(filtre: ReadonlySet<BonusFiltre>, x: { holo: number; anime: number }): boolean {
  return (
    filtre.size === 0 ||
    (filtre.has('normal') && x.holo === 0 && x.anime === 0) ||
    (filtre.has('holo') && x.holo > 0) ||
    (filtre.has('anime') && x.anime > 0)
  )
}
export function PucesBonus({
  valeur,
  onChange,
}: {
  valeur: ReadonlySet<BonusFiltre>
  onChange: (v: ReadonlySet<BonusFiltre>) => void
}): React.ReactElement {
  return (
    <div className="filtres-panneau-puces">
      {BONUS_FILTRES.map((b) => (
        <button
          key={b.id}
          type="button"
          className={`puce puce-${b.id}${valeur.has(b.id) ? ' actif' : ''}`}
          onClick={() => onChange(basculer(valeur, b.id))}
        >
          <i />
          {b.nom}
        </button>
      ))}
    </div>
  )
}

/**
 * LE BOUTON « FILTRES » ET SON PANNEAU. Keko : « on peut compacter le système
 * de filtres de la collection / stickers ? Peut-être avec un bouton filtre qui
 * ouvre un panneau avec les options, comme dans lexicodex ». *La grille
 * commence tout de suite* : une ligne (la recherche et le bouton, qui compte
 * les filtres actifs), et les options dans un panneau qui monte du bas, avec
 * « Tout effacer » et le nombre de cartes qu'on va voir.
 */
export function BoutonFiltres({ actifs, onOuvrir }: { actifs: number; onOuvrir: () => void }): React.ReactElement {
  // SANS LE MOT, LE SYMBOLE : Keko, « juste un bouton sans le mot filtre »,
  // « les 3 barres mais avec des ronds dessus » : trois réglettes et leurs curseurs.
  return (
    <button
      type="button"
      className={`bouton-filtres${actifs > 0 ? ' actif' : ''}`}
      aria-label="Filtres"
      // OUVERT AU RELÂCHEMENT, pas seulement au clic. Keko : « quand je ferme le
      // panneau et que je reclique juste après, y'a le son mais rien ne s'ouvre ».
      // Deux tapes rapprochées au même endroit (le fond qui ferme, puis le
      // bouton dessous) : le téléphone garde la seconde pour un double-tap et
      // ne rend pas son clic. Le relâchement, lui, arrive toujours ; le clic
      // qui suit éventuellement rouvre ce qui est déjà ouvert, sans effet.
      onPointerUp={(e) => {
        if (e.isPrimary && e.button === 0) onOuvrir()
      }}
      onClick={onOuvrir}
    >
      <svg viewBox="0 0 24 24" aria-hidden fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
        <path d="M3 6h18M3 12h18M3 18h18" />
        <circle cx="8" cy="6" r="2.8" fill="currentColor" stroke="none" />
        <circle cx="16" cy="12" r="2.8" fill="currentColor" stroke="none" />
        <circle cx="10" cy="18" r="2.8" fill="currentColor" stroke="none" />
      </svg>
      {actifs > 0 && <span className="bouton-filtres-compte">{actifs}</span>}
    </button>
  )
}

/** La part de la hauteur du panneau qu'il faut tirer vers le bas pour le fermer. */
const TIRER_POUR_FERMER = 0.25
/** Ou la vitesse (px/ms) d'un coup de doigt qui le ferme, même court. */
const VITESSE_POUR_FERMER = 0.5

export function PanneauFiltres({
  titre,
  voir,
  onEffacer,
  onFermer,
  children,
}: {
  titre: string
  /** Le libellé du bouton du bas : « Voir 12 cartes ». */
  voir: string
  onEffacer: () => void
  onFermer: () => void
  children: React.ReactNode
}): React.ReactElement {
  /**
   * LA POIGNÉE SE TIRE VERS LE BAS. Keko : « une petite barre en haut qui laisse
   * penser qu'on peut fermer le panneau en slidant vers le bas, mais si je le
   * fais ça refresh la page ». *Le geste allait au navigateur* (tirer pour
   * recharger) : la tête du panneau le garde (`touch-action: none`) et le
   * panneau suit le doigt ; lâché assez bas ou assez vite, il descend et se ferme.
   */
  const panneau = useRef<HTMLDivElement>(null)
  const appuiSurLeFond = useRef(false)
  // ET TANT QU'IL EST OUVERT, la page entière refuse « tirer pour recharger ».
  useEffect(() => {
    const html = document.documentElement
    const avant = html.style.overscrollBehaviorY
    html.style.overscrollBehaviorY = 'none'
    return () => {
      html.style.overscrollBehaviorY = avant
    }
  }, [])
  const tire = useRef<{ id: number; y0: number; dy: number; t: number; v: number } | null>(null)
  const descendre = (dy: number, transition: boolean): void => {
    const el = panneau.current
    if (el === null) return
    el.style.transition = transition ? 'transform 0.22s ease-out' : 'none'
    el.style.transform = dy > 0 ? `translateY(${dy}px)` : ''
  }
  /**
   * SANS CAPTURE DU POINTEUR. Keko : « quand je ferme le panneau en slidant vers
   * le bas, mon prochain clic produit un son mais ne fait rien ». La première
   * version capturait le doigt sur la tête du panneau (`setPointerCapture`),
   * puis retirait ce nœud de la page : sur téléphone, la tape suivante perdait
   * son clic. Le glisser se suit maintenant sur la fenêtre, écouteurs posés au
   * contact et retirés au lâcher.
   */
  const poser = (e: React.PointerEvent<HTMLDivElement>): void => {
    if ((e.target as HTMLElement).closest('button') !== null || tire.current !== null) return
    const g = { id: e.pointerId, y0: e.clientY, dy: 0, t: e.timeStamp, v: 0 }
    tire.current = g
    const glisser = (ev: PointerEvent): void => {
      if (ev.pointerId !== g.id) return
      const dy = Math.max(0, ev.clientY - g.y0)
      const dt = ev.timeStamp - g.t
      if (dt > 0) g.v = (dy - g.dy) / dt
      g.dy = dy
      g.t = ev.timeStamp
      descendre(dy, false)
    }
    const lacher = (ev: PointerEvent): void => {
      if (ev.pointerId !== g.id) return
      window.removeEventListener('pointermove', glisser)
      window.removeEventListener('pointerup', lacher)
      window.removeEventListener('pointercancel', lacher)
      tire.current = null
      const haut = panneau.current?.offsetHeight ?? 1
      // À LA SOURIS, UN CLIC SUFFIT. Keko : « sur PC on n'a pas besoin de slider
      // la petite barre, on peut juste cliquer dessus (on garde le slide sur tel) ».
      const clic = e.pointerType === 'mouse' && g.dy < 4
      if (
        ev.type === 'pointerup' &&
        (clic || g.dy > haut * TIRER_POUR_FERMER || (g.dy > 10 && g.v > VITESSE_POUR_FERMER))
      ) {
        descendre(haut, true)
        window.setTimeout(onFermer, 220)
      } else descendre(0, true)
    }
    window.addEventListener('pointermove', glisser)
    window.addEventListener('pointerup', lacher)
    window.addEventListener('pointercancel', lacher)
  }
  return createPortal(
    <div
      className="filtres-panneau-fond"
      // LE FOND NE FERME QUE CE QUI A COMMENCÉ SUR LUI. Le bouton ouvre au
      // relâchement ; sur téléphone, le clic de cette même tape arrive ensuite
      // sur ce qui est sous le doigt — le fond, tout juste monté — et refermait
      // aussitôt : « le panneau s'ouvre et se ferme dans le même instant ».
      onPointerDown={(e) => {
        appuiSurLeFond.current = e.target === e.currentTarget
      }}
      onClick={(e) => {
        if (appuiSurLeFond.current && e.target === e.currentTarget) onFermer()
        appuiSurLeFond.current = false
      }}
    >
      <div
        ref={panneau}
        className="filtres-panneau"
        role="dialog"
        aria-label={titre}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="filtres-panneau-prise"
          onPointerDown={poser}
        >
          <div className="filtres-panneau-poignee" aria-hidden />
          <div className="filtres-panneau-tete">
          <h2>{titre}</h2>
          <button type="button" className="filtres-panneau-effacer" onClick={onEffacer}>
              Tout effacer
            </button>
          </div>
        </div>
        <div className="filtres-panneau-corps">{children}</div>
        <button type="button" className="collection-bouton filtres-panneau-voir" onClick={onFermer}>
          {voir}
        </button>
      </div>
    </div>,
    document.body,
  )
}

/** Une section du panneau : son titre, ses options. */
export function SectionFiltre({ titre, children }: { titre: string; children: React.ReactNode }): React.ReactElement {
  return (
    <section className="filtres-panneau-section">
      <h3>{titre}</h3>
      {children}
    </section>
  )
}

/** Sans accents ni casse : « eclair » trouve « Éclair ». */
export function plier(texte: string): string {
  return texte.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

/* ------------------------------------------------------------------------ */
/* LES VIGNETTES                                                            */
/* ------------------------------------------------------------------------ */


/**
 * LA VIGNETTE PREND LA SATURATION DE LA CARTE 3D. Keko : « j'ai l'impression que
 * les cartes sont plus ternes quand je regarde la vue d'ensemble ». *Elles
 * l'étaient* : la carte en 3D sature sa peinture en sortie de nuanceur
 * (`SATURATION_APLAT`, +40 %), la vignette montrait la peinture telle quelle.
 * **Le chiffre est lu, pas recopié** : un seul endroit dit combien.
 */
/** La part des paillettes de la carte 3D que garde une vignette holo (Keko : « trop de paillettes »). Chiffre de moi. */
const DENSITE_PAILLETTES = 0.4
/** La période d'une couche de paillettes vives, en secondes (voir `.vignette-scintille`). */
const DUREE_SCINTILLE = 2.4

const FILTRE_VIGNETTE: React.CSSProperties = {
  filter: `saturate(${1 + SATURATION_APLAT}) drop-shadow(0 0.25rem 0.4rem rgba(10, 4, 30, 0.55))`,
}

export function Vignette({
  carte,
  possession,
  variante,
  onOuvrir,
  choix,
  prisPar,
  nue = false,
  onSaisir,
}: {
  carte: CarteEmoji
  /** `null` : une carte du catalogue qu'on n'a pas encore — grisée. */
  possession: Possession | null
  /** La version montrée : chacune a sa vignette (voir `Variante`). */
  variante: Variante
  onOuvrir: () => void
  /**
   * LE MODE DECK (voir `ChoixDuDeck`) : dans le deck (cochée), dehors, dehors
   * d'un deck plein (estompée), ou prise par un autre deck (estompée, avec le
   * nom du deck, `prisPar`). `undefined` hors du mode deck, où la vignette
   * garde sa bulle « Nouveau ».
   */
  choix?: 'dedans' | 'dehors' | 'plein' | 'pris'
  prisPar?: string
  /** LA MAIN QUI JOUE : sans le compte d'exemplaires ni « Nouveau » (Keko). */
  nue?: boolean
  /** Le mode deck : le doigt posé peut saisir la carte pour la glisser (voir `saisir`). */
  onSaisir?: (e: React.PointerEvent) => void
}): React.ReactElement {
  const boite = useRef<HTMLButtonElement>(null)
  const toile = useRef<HTMLCanvasElement>(null)
  const scintilles = useRef<(HTMLCanvasElement | null)[]>([])
  const rayons = useRef<HTMLCanvasElement>(null)
  const sticker = useRef<HTMLCanvasElement>(null)
  /** Où la peinture a posé le sticker : les images de l'animation s'y posent aussi. */
  const placeDuSujet = useRef<SujetPeint | null>(null)
  const [prete, setPrete] = useState(false)
  const [visible, setVisible] = useState(false)
  const { holo, anime } = exemplaireDe(variante)
  const compte = possession === null ? 0 : compteDe(possession, variante)
  const tourne = AVEC_TOURNE && anime && carte.animable
  // LES STICKERS COLLÉS sur cette version : la vignette les peint, et se
  // repeint quand ils changent (la clé dit s'ils ont changé).
  const colles = possession?.colles?.[variante]
  const cleColles = cleDesColles(colles)
  /** Les stickers collés peints, dont les animés que la vignette fait jouer sur une couche à part. */
  const collesPeints = useRef<readonly StickerPeint[]>([])
  const [collesAnimes, setCollesAnimes] = useState(false)
  const coucheColles = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const el = boite.current
    if (el === null) return
    let fini = false
    const obs = new IntersectionObserver(
      (entrees) => {
        if (!entrees.some((e) => e.isIntersecting) || fini) return
        fini = true
        obs.disconnect()
        const px = el.getBoundingClientRect().width * Math.min(window.devicePixelRatio || 1, 3)
        const largeur = tailleQuIlFaut(px)
        void stickersColles(colles)
          .then((peints) => {
            collesPeints.current = peints
            setCollesAnimes(peints.some((c) => c.anime !== undefined))
            return peinte(carte, largeur, holo, tourne, false, false, tourne, peints)
          })
          .then(async (source) => {
          const t = toile.current
          const ctx = t?.getContext('2d')
          if (t == null || ctx == null) return
          t.width = source.width
          t.height = source.height
          ctx.drawImage(source, 0, 0)
          // LA CARTE ANIMÉE : ses rayons à part, qui tournent, et son sticker
          // par-dessus (pris sur la carte entière, à sa place).
          if (tourne) {
            const rc = rayons.current
            const rayonPx = R_FEN.rayon * source.width
            const cote = Math.ceil(rayonPx * 2 * 1.05)
            // LA CARTE SANS SUJET, AVEC ET SANS SES RAYONS : leur différence est la
            // couche. Sans holo : les rayons n'en dépendent pas, et le fond sans
            // holo est déjà peint quand la carte ne l'est pas.
            const [avec, sans] = await Promise.all([
              peinte(carte, largeur, false, true, false, false, false),
              peinte(carte, largeur, false, true, false, false, true),
            ])
            const couche = coucheDesRayons(avec, sans, cote)
            if (rc != null && couche !== null) {
              rc.width = cote
              rc.height = cote
              rc.getContext('2d')?.drawImage(couche, 0, 0)
            }
            const entiere = await peinte(carte, largeur, holo, false, false, false)
            // Le sticker d'une holo est celui au cerne arc-en-ciel : voir `sujetDeLaVignette`.
            const sujet = sujetDeLaVignette(entiere)
            const sc = sticker.current
            const sctx = sc?.getContext('2d')
            if (sujet !== undefined && sc != null && sctx != null) {
              sc.width = source.width
              sc.height = source.height
              sctx.drawImage(sujet.image, sujet.x, sujet.y, sujet.l, sujet.h)
              placeDuSujet.current = sujet
            }
          }
          // LA HOLO SCINTILLE : la neige pâle sur la vignette, et les vives sur
          // trois couches, un tirage chacune — *les places restent, l'éclat
          // change*, comme quand la carte 3D bouge.
          if (holo) {
            paillettesHolo(source, carte.id, { cible: t, seules: 'pales', densite: DENSITE_PAILLETTES })
            for (const v of SCINTILLES) {
              const c = scintilles.current[v]
              if (c == null) continue
              c.width = source.width
              c.height = source.height
              paillettesHolo(source, carte.id, { cible: c, seules: 'vives', variante: v + 1, densite: DENSITE_PAILLETTES })
            }
          }
          setPrete(true)
        })
      },
      { rootMargin: '300px 0px' },
    )
    obs.observe(el)
    return () => {
      fini = true
      obs.disconnect()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `colles` est lu par sa clé
  }, [carte, holo, tourne, cleColles])
  // LA VIGNETTE ANIMÉE SUIT SA VISIBILITÉ : l'animation ne joue qu'à l'écran
  // (l'observateur du dessus se coupe après la première peinture).
  useEffect(() => {
    const el = boite.current
    if ((!tourne && !collesAnimes) || el === null) return
    const obs = new IntersectionObserver((e) => setVisible(e.some((x) => x.isIntersecting)), {
      rootMargin: '200px 0px',
    })
    obs.observe(el)
    return () => obs.disconnect()
  }, [tourne, collesAnimes])
  // LES STICKERS COLLÉS ANIMÉS JOUENT sur leur couche, à leur place (Keko :
  // « qu'il garde son animation s'il en a ») : leurs images chargées par leur
  // `charger`, à la finesse de l'album, posées comme `peindreColles` les pose.
  useEffect(() => {
    if (!collesAnimes || !visible || !prete) return
    let vivant = true
    let image = 0
    const peints = collesPeints.current
    void Promise.all(peints.map((c) => (c.anime === undefined ? Promise.resolve(null) : c.anime.charger(COTE_PETIT, c.holo)))).then((anims) => {
      if (!vivant || !anims.some((a) => a !== null)) return
      const depart = performance.now()
      const pas = (t: number): void => {
        const c = coucheColles.current
        const base = toile.current
        const ctx = c?.getContext('2d')
        if (c == null || ctx == null || base == null) return
        if (c.width !== base.width || c.height !== base.height) {
          c.width = base.width
          c.height = base.height
        }
        const R = RAYONS_DANS_LA_CARTE
        const taille = TAILLE_COLLE * R.l * c.width
        ctx.clearRect(0, 0, c.width, c.height)
        peints.forEach((col, k) => {
          const a = anims[k]
          if (a == null) return
          const i = Math.min(a.images.length - 1, Math.floor(((Math.max(0, t - depart) % a.duree) / a.duree) * a.images.length))
          const { x, y, a: angle } = placeDuColle(col, k)
          ctx.save()
          ctx.translate((R.x + x * R.l) * c.width, (R.y + y * R.h) * c.height)
          ctx.rotate(angle)
          ctx.drawImage(a.images[i]!, -taille / 2, -taille / 2, taille, taille)
          ctx.restore()
        })
        image = requestAnimationFrame(pas)
      }
      image = requestAnimationFrame(pas)
    })
    return () => {
      vivant = false
      cancelAnimationFrame(image)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- les stickers sont lus par leur clé
  }, [collesAnimes, visible, prete, cleColles])
  // L'EMOJI ANIMÉ JOUE SUR LA COUCHE DU STICKER, à la place du sticker fixe,
  // une fois la vignette peinte : ses images sont déjà des stickers, au cerne
  // arc-en-ciel pour une holo — comme dans l'album.
  useEffect(() => {
    if (!tourne || !visible || !prete) return
    let vivant = true
    let image = 0
    const chargement = holo
      ? animationHolo(carte.id, COTE_PETIT, false)
      : animationDeLEmoji(urlAnimationEmoji(carte.id), COTE_PETIT)
    void chargement.then((a) => {
      if (!vivant || a === null) return
      const depart = performance.now()
      const pas = (t: number): void => {
        const c = sticker.current
        const ctx = c?.getContext('2d')
        const place = placeDuSujet.current
        if (c == null || ctx == null || place === null) return
        // Jamais négatif, jamais au-delà de la dernière image : voir l'album.
        const i = Math.min(a.images.length - 1, Math.floor(((Math.max(0, t - depart) % a.duree) / a.duree) * a.images.length))
        ctx.clearRect(0, 0, c.width, c.height)
        ctx.drawImage(a.images[i]!, place.x, place.y, place.l, place.h)
        image = requestAnimationFrame(pas)
      }
      image = requestAnimationFrame(pas)
    })
    return () => {
      vivant = false
      cancelAnimationFrame(image)
    }
  }, [tourne, visible, prete, holo, carte.id])
  return (
    <button
      ref={boite}
      type="button"
      className={`vignette${prete ? ' vignette-prete' : ''}${holo ? ' vignette-holo' : ''}${possession === null ? ' vignette-manquante' : ''}${choix === 'dedans' ? ' vignette-choisie' : ''}${choix === 'plein' || choix === 'pris' ? ' vignette-estompee' : ''}`}
      style={{ '--cran': teinteDuCran(carte.rarete) } as React.CSSProperties}
      onClick={onOuvrir}
      onPointerDown={onSaisir}
      aria-label={`${enTitre(carte.nom)}, ${NOM_DE_LA_RARETE[carte.rarete]}${possession === null ? ', pas encore obtenue' : ''}`}
    >
      {!prete && <span className="vignette-attente">{carte.emoji}</span>}
      <canvas ref={toile} className="vignette-toile" style={FILTRE_VIGNETTE} />
      {tourne && (
        <>
          <span className="vignette-fenetre" style={STYLE_FENETRE}>
            <canvas ref={rayons} className="vignette-rayons" style={STYLE_RAYONS} />
          </span>
          <canvas ref={sticker} className="vignette-toile vignette-sticker" style={{ filter: `saturate(${1 + SATURATION_APLAT})` }} />
        </>
      )}
      {collesAnimes && <canvas ref={coucheColles} className="vignette-toile vignette-sticker" style={{ filter: `saturate(${1 + SATURATION_APLAT})` }} />}
      {holo &&
        SCINTILLES.map((v) => (
          <canvas
            key={v}
            ref={(c) => {
              scintilles.current[v] = c
            }}
            className="vignette-scintille"
            style={{ animationDelay: `${(-v * DUREE_SCINTILLE) / SCINTILLES.length}s` }}
          />
        ))}
      {choix === 'dedans' && (
        <span className="vignette-coche" aria-hidden>
          ✓
        </span>
      )}
      {choix === 'pris' && <span className="vignette-prise">{prisPar ?? 'Pris'}</span>}
      {choix === undefined && !nue && possession?.nouvelles.includes(variante) && <span className="vignette-nouvelle">Nouveau</span>}
      {compte > 1 && !nue && <span className="vignette-nombre">×{compte}</span>}
      {(holo || anime) && (
        <span className="vignette-bonus">
          {holo && <span className="pastille-holo">Holo</span>}
          {anime && <span className="pastille-anime">Animé</span>}
        </span>
      )}
    </button>
  )
}

/* ------------------------------------------------------------------------ */
/* LA CARTE OUVERTE                                                         */
/* ------------------------------------------------------------------------ */

const DATE = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })

/**
 * LA CARTE EN GRAND — la même `Carte3D` que le paquet, donc la même matière :
 * le reflet au doigt, le penchant au téléphone, **et la feuille holo ou
 * l'animation si on possède l'exemplaire qui les porte.** *On montre le plus
 * bel exemplaire qu'on a* : un holo et un animé valent mieux que la carte nue.
 */
function CarteOuverte({
  carte,
  possession,
  variante,
  total,
  album,
  onFermer,
  onDetruire,
  onColler,
}: {
  carte: CarteEmoji
  /** `null` : ouverte depuis le catalogue sans la posséder — rien à décoller. */
  possession: Possession | null
  variante: Variante
  total: number
  /** L'ALBUM, ce qu'on peut coller : une entrée par version de sticker possédée, avec son compte. */
  album: readonly { carte: CarteEmoji; v: Variante; n: number }[]
  onFermer: () => void
  /** Le sticker est décollé : cet exemplaire est détruit. */
  onDetruire: (ex: Exemplaire) => void
  /** Un sticker de l'album se colle sur la version qu'on regarde (Keko : « coller des stickers sur les cartes »). */
  onColler: (sticker: StickerColle) => void
}): React.ReactElement {
  /**
   * LE DÉCOLLAGE EN COURS, et l'exemplaire qu'il détruit — **le simple
   * d'abord** (voir `exemplaireADetruire`). `cachee` : la scène 2D couvre la
   * carte, la 3D peut partir.
   */
  const [decolle, setDecolle] = useState<Exemplaire | null>(null)
  const [cachee, setCachee] = useState(false)
  const [cassee, setCassee] = useState(false)
  const refDecolle = useRef(false)
  refDecolle.current = decolle !== null
  const [fenetre, setFenetre] = useState({ l: window.innerWidth, h: window.innerHeight })
  useEffect(() => {
    const suivre = (): void => setFenetre({ l: window.innerWidth, h: window.innerHeight })
    window.addEventListener('resize', suivre)
    return () => window.removeEventListener('resize', suivre)
  }, [])
  const gyro = useRef<Inclinaison | null>(null)
  useEffect(() => {
    gyro.current = suivreLInclinaison()
    jouerSon(SON_POSER, 0.6)
    return () => {
      gyro.current?.arreter()
      gyro.current = null
    }
  }, [])
  const curseur = useRef<CurseurDeCarte>({ dessus: false, x: 0, y: 0 })
  const refFermer = useRef(onFermer)
  refFermer.current = onFermer
  // LES STICKERS COLLÉS SUR CETTE VERSION, peints avant d'entrer dans la carte :
  // la 3D repeint sa face dès que la liste change (nouvelle carte à peindre).
  const colles = possession?.colles?.[variante]
  const cleColles = cleDesColles(colles)
  const [collesPeints, setCollesPeints] = useState<readonly StickerPeint[]>([])
  useEffect(() => {
    let vivant = true
    void stickersColles(colles).then((p) => {
      if (vivant) setCollesPeints(p)
    })
    return () => {
      vivant = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `colles` est lu par sa clé
  }, [cleColles])
  const aPeindre = useMemo(
    () => {
      const ex = exemplaireDe(variante)
      return { ...carteDeLEmoji(carte, { holo: ex.holo, anime: ex.anime && carte.animable }), colles: collesPeints }
    },
    [carte, variante, collesPeints],
  )
  /** LE CHOIX DU STICKER À COLLER : ouvert par le bouton, fermé par la croix — et de lui-même quand l'album est vide (Keko). */
  const [choixOuvert, setChoixOuvert] = useState(false)
  useEffect(() => {
    if (album.length === 0) setChoixOuvert(false)
  }, [album.length])
  /**
   * LE STICKER QU'ON TIENT, pendant qu'on le glisse du ruban vers la carte
   * (Keko : « j'aurais bien aimé placer manuellement le sticker »). Il suit le
   * doigt ; lâché sur la fenêtre d'art, il s'y colle à cet endroit, avec le
   * penchant qu'il montrait ; lâché ailleurs, rien. Pendant ce temps la carte
   * ne penche pas (`refPlacement`), pour que l'endroit visé soit l'endroit posé.
   */
  const [tenu, setTenu] = useState<{ sticker: StickerColle; image: HTMLCanvasElement; contour: HTMLCanvasElement; contourRouge: HTMLCanvasElement; a: number } | null>(null)
  const refPlacement = useRef(false)
  refPlacement.current = tenu !== null
  const flottant = useRef<HTMLCanvasElement>(null)
  /**
   * LE CONTOUR FANTÔME SUIT LE DOIGT sur la carte, jaune là où le sticker peut
   * se coller, ROUGE là où il serait coupé par la bordure (Keko : « au lieu de
   * déplacer la prévisualisation, on passe les pointillés en rouge tant qu'on
   * est sur une zone de la carte interdite »). Deux toiles, l'une ou l'autre.
   */
  const fantome = useRef<HTMLCanvasElement>(null)
  const fantomeRouge = useRef<HTMLCanvasElement>(null)
  const suivre = useCallback((x: number, y: number) => {
    const el = flottant.current
    if (el === null) return
    el.style.left = `${x.toFixed(1)}px`
    el.style.top = `${y.toFixed(1)}px`
  }, [])
  const poserLeFantome = useCallback((place: { x: number; y: number; interdit: boolean } | null) => {
    for (const [el, montre] of [
      [fantome.current, place !== null && !place.interdit],
      [fantomeRouge.current, place !== null && place.interdit],
    ] as const) {
      if (el === null) continue
      el.style.visibility = montre ? 'visible' : 'hidden'
      if (montre && place !== null) {
        el.style.left = `${place.x.toFixed(1)}px`
        el.style.top = `${place.y.toFixed(1)}px`
      }
    }
  }, [])
  /**
   * Où un point de l'écran tombe dans la fenêtre d'art, en parts (0 à 1) — ou
   * `null` hors de la carte (avec un peu de jeu au bord). **`interdit`** quand le
   * sticker, penché de `a`, y serait coupé par la bordure (`placeNonCoupee` le
   * déplacerait) — ou recouvrirait un sticker déjà collé sur cette version
   * (`collesSeChevauchent`, Keko : « les stickers peuvent se superposer, c'est
   * moche ») : le contour passe au rouge, et le lâcher ne colle pas.
   */
  const dansLaFenetre = useCallback((x: number, y: number, a: number): { x: number; y: number; interdit: boolean } | null => {
    const b = refBoite.current
    const u = (x - (b.cx - b.l / 2)) / b.l
    const v = (y - (b.cy - b.h / 2)) / b.h
    const R = RAYONS_DANS_LA_CARTE
    const fx = (u - R.x) / R.l
    const fy = (v - R.y) / R.h
    if (fx < -0.15 || fx > 1.15 || fy < -0.15 || fy > 1.15) return null
    const ok = placeNonCoupee(fx, fy, a)
    const coupe = Math.abs(ok.x - fx) > 1e-6 || Math.abs(ok.y - fy) > 1e-6
    const recouvre = (colles ?? []).some((c, i) => collesSeChevauchent({ x: fx, y: fy }, placeDuColle(c, i)))
    return { x: fx, y: fy, interdit: coupe || recouvre }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `colles` est lu par sa clé
  }, [cleColles])
  /**
   * LE STICKER TENU SUIT LE DOIGT, toujours — et, sur la carte, SON CONTOUR le
   * suit aussi, jaune ou rouge selon que la place est permise ou non. Hors de
   * la carte, pas de contour.
   */
  const suivreLeDoigt = useCallback(
    (x: number, y: number, a: number) => {
      suivre(x, y)
      const place = dansLaFenetre(x, y, a)
      poserLeFantome(place === null ? null : { x, y, interdit: place.interdit })
    },
    [dansLaFenetre, suivre, poserLeFantome],
  )
  /**
   * LA CARTE PENDANT LE DÉCOLLAGE : l'exemplaire qu'on détruit (le simple
   * d'abord, pas forcément le plus beau qu'on montrait), sans son emoji.
   */
  const carteNue = useMemo(
    () =>
      decolle === null ? aPeindre : { ...carteDeLEmoji(carte, decolle), sansSujet: true, animation: undefined, colles: collesPeints },
    [carte, decolle, aPeindre, collesPeints],
  )
  // LA CARTE TIENT DANS L'ÉCRAN, avec la place des lignes du dessous : la règle
  // de la rangée du paquet, *la taille se calcule sur la place.*
  const hVisible = hauteurVisibleA(Z_MAIN, fenetre.h)
  const lVisible = (hVisible * fenetre.l) / fenetre.h
  const taille = Math.min((lVisible * 0.82) / LARGE, (hVisible * 0.6) / HAUT)
  const px = (taille * LARGE * fenetre.l * Math.min(window.devicePixelRatio || 1, 2)) / lVisible
  /**
   * LE DOIGT PENCHE LA CARTE, COMME AU PAQUET. Keko : « il faut pouvoir bouger
   * la carte de la collection qu'on zoome comme quand on ouvre les boosters ».
   * *C'est le geste de l'écran du paquet, recopié* : au doigt, le maintien
   * penche et suit le doigt même sorti de la carte ; à la souris, le survol.
   * **Une tape à côté la repose** — une tape, pas un glisser qui finit dehors.
   */
  const boite = {
    cx: fenetre.l / 2,
    cy: fenetre.h * (0.5 - 0.06),
    l: ((taille * LARGE) / lVisible) * fenetre.l,
    h: ((taille * HAUT) / hVisible) * fenetre.h,
  }
  const refBoite = useRef(boite)
  refBoite.current = boite
  useEffect(() => {
    const c = curseur.current
    const arret = new AbortController()
    const signal = arret.signal
    const depart = { x: 0, y: 0 }
    let doigtPose = false
    const viser = (e: PointerEvent): boolean => {
      const b = refBoite.current
      c.x = Math.max(-0.5, Math.min(0.5, (e.clientX - b.cx) / b.l))
      c.y = Math.max(-0.5, Math.min(0.5, -(e.clientY - b.cy) / b.h))
      return Math.abs(e.clientX - b.cx) <= b.l / 2 && Math.abs(e.clientY - b.cy) <= b.h / 2
    }
    addEventListener(
      'pointerdown',
      (e) => {
        // PENDANT LE DÉCOLLAGE OU LE PLACEMENT D'UN STICKER, LE DOIGT EST À LUI.
        if (refDecolle.current || refPlacement.current) return
        depart.x = e.clientX
        depart.y = e.clientY
        if (e.pointerType === 'mouse') return
        doigtPose = true
        viser(e)
        c.dessus = true
        c.tenu = true
        c.eclat = 1
      },
      { signal },
    )
    addEventListener(
      'pointermove',
      (e) => {
        if (refPlacement.current) return
        if (e.pointerType === 'mouse') {
          c.dessus = viser(e)
          c.tenu = c.dessus
          c.eclat = 1
        } else if (doigtPose) viser(e)
      },
      { signal },
    )
    const lacher = (e: PointerEvent): void => {
      if (e.pointerType === 'mouse') return
      doigtPose = false
      c.dessus = false
      c.tenu = false
    }
    addEventListener('pointercancel', lacher, { signal })
    /**
     * ON REPOSE AU CLIC, PAS AU RELÂCHEMENT. Keko : « quand je clique ailleurs
     * pour dézoomer mais que cet ailleurs tombe sur une autre carte, ça la
     * zoome direct ». *Le navigateur envoie le clic APRÈS le relâchement, à ce
     * qui est sous le doigt à ce moment-là* : fermée au relâchement, la carte
     * ouverte n'était plus là, et le clic tombait sur la vignette d'en dessous.
     * Fermée au clic, c'est elle qui le reçoit, et il s'arrête là. Le
     * relâchement ne fait que dire si c'était une tape, et où.
     */
    let reposer = false
    addEventListener(
      'pointerup',
      (e) => {
        lacher(e)
        if (refDecolle.current || refPlacement.current) return
        const tape = Math.hypot(e.clientX - depart.x, e.clientY - depart.y) < 12
        const b = refBoite.current
        const dedans = Math.abs(e.clientX - b.cx) <= b.l / 2 && Math.abs(e.clientY - b.cy) <= b.h / 2
        // La croix ferme d'elle-même : on ne repose pas deux fois.
        const surUnBouton = e.target instanceof Element && e.target.closest('button, .coller-choix') !== null
        reposer = tape && !dedans && !surUnBouton
      },
      { signal },
    )
    addEventListener(
      'click',
      (e) => {
        if (!reposer) return
        reposer = false
        e.stopPropagation()
        e.preventDefault()
        refFermer.current()
      },
      { signal, capture: true },
    )
    return () => arret.abort()
  }, [])
  const exemplaires =
    possession === null
      ? ['Pas encore obtenue']
      : [
          `${compteDe(possession, variante)} exemplaire${compteDe(possession, variante) > 1 ? 's' : ''} ${NOM_DE_LA_VARIANTE[variante]}`,
          possession.n > compteDe(possession, variante) ? `${possession.n} en tout` : null,
        ].filter((m): m is string => m !== null)
  return (
    <div className="carte-ouverte">
      <Canvas
        dpr={[1, 2]}
        camera={{ position: [0, 0, zCamera(fenetre.h)], fov: FOV }}
        gl={{ toneMapping: NoToneMapping }}
        style={{ position: 'fixed', inset: 0 }}
      >
        <Cadrage />
        <Horloge />
        <PencheAuGyro curseurs={decolle !== null ? [] : [curseur.current]} gyro={gyro} />
        <Bloom />
        <ambientLight intensity={0.55} />
        <directionalLight position={[2.5, 3.5, 4]} intensity={2.2} />
        <directionalLight position={[-4, 1, 2]} intensity={0.9} color="#8fb4ff" />
        {/* INVISIBLE, PAS DÉMONTÉE : annuler la rend telle qu'elle était. */}
        <group visible={!cassee}>
        <Carte3D
          carte={cachee ? carteNue : aPeindre}
          position={[0, hVisible * 0.06, Z_MAIN]}
          taille={taille}
          tailleTexture={px}
          reflet
          refletAuDoigt={decolle === null}
          curseurPartage={decolle === null ? curseur.current : undefined}
          ombre={false}
        />
        </group>
      </Canvas>
      {decolle !== null && (
        <Decollage
          carte={carte}
          exemplaire={decolle}
          colles={collesPeints}
          boite={refBoite.current}
          onPret={() => setCachee(true)}
          onCasse={() => setCassee(true)}
          onAnnuler={() => {
            setDecolle(null)
            setCachee(false)
          }}
          onFini={() => {
            onDetruire(decolle)
            onFermer()
          }}
        />
      )}
      <div className={`carte-ouverte-infos${decolle !== null ? ' carte-ouverte-cachee' : ''}`}>
        <span className="carte-ouverte-cran" style={{ '--cran': teinteDuCran(carte.rarete) } as React.CSSProperties}>
          {NOM_DE_LA_RARETE[carte.rarete]}
        </span>
        <p className="carte-ouverte-ligne">{exemplaires.join(' · ')}</p>
        <p className="carte-ouverte-ligne carte-ouverte-discret">
          {possession !== null && <>Obtenue le {DATE.format(new Date(possession.premiere))} · </>}
          n° {carte.rang} sur {total}
        </p>
        {/* DÉTRUIRE POUR LE STICKER : le bouton ouvre le geste, c'est le geste
            qui décide. Keko : « l'option, quand on la zoome dans la collection,
            de la détruire pour gagner son sticker ». Pas sur une carte qu'on
            n'a pas. */}
        {possession !== null && (
          <div className="carte-ouverte-boutons">
            <button
              type="button"
              className="decoller"
              // C'EST LA VERSION QU'ON REGARDE QUI PART : voir `Variante`.
              onClick={() => setDecolle(exemplaireDe(variante))}
            >
              Décoller le sticker
            </button>
            {/* COLLER UN STICKER DE L'ALBUM SUR CETTE VERSION. Keko : « coller des
                stickers sur les cartes… +1 par sticker, sans limite par carte ».
                Le bouton n'est là que si l'album a de quoi coller. */}
            {album.length > 0 && (
              <button type="button" className="decoller decoller-second" onClick={() => setChoixOuvert((o) => !o)}>
                Coller un sticker
                {nombreDeColles(possession, variante) > 0 && <span className="coller-compte">{nombreDeColles(possession, variante)}</span>}
              </button>
            )}
          </div>
        )}
      </div>
      {choixOuvert && decolle === null && (
        <ChoixDuSticker
          album={album}
          onPrendre={(st, image, e) => {
            // La carte se remet à plat : le doigt est au sticker.
            curseur.current.dessus = false
            curseur.current.tenu = false
            const a = (Math.random() - 0.5) * 0.5
            setTenu({ sticker: st, image, contour: contourPointille(image), contourRouge: contourPointille(image, ROUGE_FANTOME), a })
            suivreLeDoigt(e.clientX, e.clientY, a)
          }}
          onSuivre={(e) => {
            if (tenu !== null) suivreLeDoigt(e.clientX, e.clientY, tenu.a)
          }}
          onLacher={(e) => {
            const t = tenu
            setTenu(null)
            if (t === null) return
            const place = dansLaFenetre(e.clientX, e.clientY, t.a)
            // Lâché hors de la carte ou en zone interdite (contour rouge) : rien.
            if (place === null || place.interdit) return
            onColler({ ...t.sticker, x: place.x, y: place.y, a: t.a })
            jouerSon(SON_POSER, 0.5)
          }}
          onFermer={() => setChoixOuvert(false)}
        />
      )}
      {/* LES CONTOURS FANTÔMES, jaune (permis) et rouge (interdit), sous le doigt ; posés par `poserLeFantome`. */}
      {tenu !== null &&
        (
          [
            [fantome, tenu.contour, ''],
            [fantomeRouge, tenu.contourRouge, ' sticker-fantome-rouge'],
          ] as const
        ).map(([ref, toileContour, classe]) => (
          <canvas
            key={classe}
            ref={(el) => {
              ref.current = el
              if (el === null) return
              el.width = toileContour.width
              el.height = toileContour.height
              el.getContext('2d')?.drawImage(toileContour, 0, 0)
            }}
            className={`sticker-fantome${classe}`}
            style={{ width: `${(refBoite.current.l * RAYONS_DANS_LA_CARTE.l * TAILLE_COLLE).toFixed(1)}px`, '--a': `${tenu.a}rad`, visibility: 'hidden' } as React.CSSProperties}
            aria-hidden
          />
        ))}
      {/* LE STICKER QUI SUIT LE DOIGT, à la taille qu'il aura sur la carte. */}
      {tenu !== null && (
        <canvas
          ref={(el) => {
            flottant.current = el
            if (el === null) return
            el.width = tenu.image.width
            el.height = tenu.image.height
            el.getContext('2d')?.drawImage(tenu.image, 0, 0)
          }}
          className="sticker-flottant"
          style={{ width: `${(refBoite.current.l * RAYONS_DANS_LA_CARTE.l * TAILLE_COLLE).toFixed(1)}px`, '--a': `${tenu.a}rad` } as React.CSSProperties}
          aria-hidden
        />
      )}
      {decolle === null && (
        <button type="button" className="carte-ouverte-fermer" aria-label="Fermer" onClick={onFermer}>
          ×
        </button>
      )}
    </div>
  )
}

/**
 * LE CHOIX DU STICKER À COLLER : l'album en ruban, une case par version de
 * sticker possédée avec son compte, peinte par le peintre de l'album
 * (`stickerPeint`). Une tape colle et laisse le ruban ouvert : on peut en
 * coller plusieurs d'affilée (sans limite, Keko). Une case qui se vide
 * disparaît avec le dernier sticker.
 */
function ChoixDuSticker({
  album,
  onPrendre,
  onSuivre,
  onLacher,
  onFermer,
}: {
  album: readonly { carte: CarteEmoji; v: Variante; n: number }[]
  /** Le doigt se pose sur une case : on prend ce sticker (son image peinte), et on le suit jusqu'au lâcher. */
  onPrendre: (s: StickerColle, image: HTMLCanvasElement, e: React.PointerEvent) => void
  onSuivre: (e: React.PointerEvent) => void
  onLacher: (e: React.PointerEvent) => void
  onFermer: () => void
}): React.ReactElement {
  return (
    <div className="coller-choix" role="dialog" aria-label="Coller un sticker">
      <p className="coller-titre">
        <span>
          Coller un sticker <span className="coller-aide">· glisse-le sur la carte</span>
        </span>
        <button type="button" className="coller-fermer" aria-label="Fermer" onClick={onFermer}>
          ×
        </button>
      </p>
      <div className="coller-ruban">
        {album.map((e) => (
          <CaseDuSticker
            key={`${e.carte.id}#${e.v}`}
            entree={e}
            onPrendre={(image, ev) => onPrendre({ id: e.carte.id, v: e.v }, image, ev)}
            onSuivre={onSuivre}
            onLacher={onLacher}
          />
        ))}
      </div>
    </div>
  )
}

/**
 * LE CONTOUR FANTÔME D'UN STICKER : UN TRAIT POINTILLÉ JAUNE QUI SUIT SON BORD.
 * Keko : « la prévisualisation du sticker soit jaune en pointillé » — puis,
 * devant une trame de points posée sur le cerne, « les pointillés sont très
 * moches ». *Un pointillé est un trait qui suit un chemin*, pas une texture :
 * on retrouve donc le chemin. La silhouette du sticker (son alpha, cerne
 * compris) est suivie pixel à pixel le long de son bord (suivi de contour de
 * Moore, sur une grille de 256), composant par composant — les trous ne sont
 * pas suivis (le composant est rempli après son tour) —, puis le chemin est
 * tracé en tirets ronds, jaunes, avec `setLineDash`.
 */
const JAUNE_FANTOME = '#ffd45e'
/** Le rouge du contour en zone interdite : celui des pastilles « Nouveau ». */
const ROUGE_FANTOME = '#ff4d6d'
function contourPointille(image: HTMLCanvasElement, couleur = JAUNE_FANTOME): HTMLCanvasElement {
  const n = 256
  const lu = document.createElement('canvas')
  lu.width = n
  lu.height = n
  const lctx = lu.getContext('2d', { willReadFrequently: true })
  const contour = document.createElement('canvas')
  contour.width = n
  contour.height = n
  const ctx = contour.getContext('2d')
  if (lctx === null || ctx === null) return contour
  lctx.drawImage(image, 0, 0, n, n)
  const a = lctx.getImageData(0, 0, n, n).data
  // LE MASQUE : dedans si l'alpha dépasse un quart, avec un bord vide tout autour.
  const dedans = new Uint8Array(n * n)
  for (let i = 0; i < n * n; i++) dedans[i] = a[i * 4 + 3]! > 64 ? 1 : 0
  for (let i = 0; i < n; i++) dedans[i] = dedans[(n - 1) * n + i] = dedans[i * n] = dedans[i * n + n - 1] = 0
  const vu = new Uint8Array(n * n)
  const est = (x: number, y: number): boolean => x >= 0 && y >= 0 && x < n && y < n && dedans[y * n + x] === 1
  // Les huit voisins, dans l'ordre horaire, en partant de la gauche.
  const DX = [-1, -1, 0, 1, 1, 1, 0, -1]
  const DY = [0, -1, -1, -1, 0, 1, 1, 1]
  const chemins: number[][] = []
  for (let y0 = 1; y0 < n - 1; y0++) {
    for (let x0 = 1; x0 < n - 1; x0++) {
      // Un pixel dedans, dont le voisin de gauche est dehors, pas encore vu : un
      // départ sur le bord extérieur d'un composant (on balaie de gauche à droite).
      if (!est(x0, y0) || vu[y0 * n + x0] === 1 || est(x0 - 1, y0)) continue
      // LE SUIVI DE MOORE : depuis le voisin par lequel on est arrivé, on tourne
      // dans le sens horaire jusqu'au prochain pixel dedans.
      const chemin: number[] = []
      let x = x0
      let y = y0
      let depuis = 0
      let tours = 0
      do {
        chemin.push(x, y)
        let k = (depuis + 1) % 8
        let trouve = false
        for (let essai = 0; essai < 8; essai++) {
          const nx = x + DX[k]!
          const ny = y + DY[k]!
          if (est(nx, ny)) {
            // On repart en regardant d'où l'on vient : le voisin opposé, moins un cran.
            depuis = (k + 6) % 8
            x = nx
            y = ny
            trouve = true
            break
          }
          k = (k + 1) % 8
        }
        if (!trouve) break
        tours++
      } while ((x !== x0 || y !== y0) && tours < n * n)
      if (chemin.length >= 8) chemins.push(chemin)
      // LE COMPOSANT EST REMPLI, pour ne pas repartir de ses trous ni de son bord.
      const pile = [x0, y0]
      vu[y0 * n + x0] = 1
      while (pile.length > 0) {
        const py = pile.pop()!
        const px = pile.pop()!
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
          const qx = px + dx
          const qy = py + dy
          if (est(qx, qy) && vu[qy * n + qx] === 0) {
            vu[qy * n + qx] = 1
            pile.push(qx, qy)
          }
        }
      }
    }
  }
  // LE TRAIT : tirets ronds, jaunes, un point sur trois pour un bord lisse.
  const epaisseur = n * 0.03
  ctx.strokeStyle = couleur
  ctx.lineWidth = epaisseur
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.setLineDash([epaisseur * 1.4, epaisseur * 1.6])
  for (const chemin of chemins) {
    ctx.beginPath()
    for (let i = 0; i < chemin.length; i += 6) {
      const x = chemin[i]! + 0.5
      const y = chemin[i + 1]! + 0.5
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.closePath()
    ctx.stroke()
  }
  return contour
}

/**
 * UNE CASE DU RUBAN. *C'est un glisser, pas une tape* : le doigt se pose sur
 * la case (`setPointerCapture` : la case garde le doigt même sorti d'elle),
 * le sticker le suit, et c'est le lâcher qui colle — sur la carte — ou
 * annule — ailleurs, y compris sur la case elle-même pour une simple tape.
 */
function CaseDuSticker({
  entree,
  onPrendre,
  onSuivre,
  onLacher,
}: {
  entree: { carte: CarteEmoji; v: Variante; n: number }
  onPrendre: (image: HTMLCanvasElement, e: React.PointerEvent) => void
  onSuivre: (e: React.PointerEvent) => void
  onLacher: (e: React.PointerEvent) => void
}): React.ReactElement {
  const toile = useRef<HTMLCanvasElement>(null)
  const bouton = useRef<HTMLButtonElement>(null)
  const image = useRef<HTMLCanvasElement | null>(null)
  /** Le doigt est à nous, de la prise au lâcher — tenu ici plutôt que par `hasPointerCapture`, qu'un navigateur peut refuser. */
  const pris = useRef(false)
  const holo = exemplaireDe(entree.v).holo
  // PEINTE QUAND ELLE APPROCHE DE L'ÉCRAN, comme une case de l'album : un
  // ruban de deux mille stickers peints d'un coup figeait la page.
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = bouton.current
    if (el === null) return
    const obs = new IntersectionObserver(
      (entrees) => {
        if (entrees.some((e) => e.isIntersecting)) {
          setVisible(true)
          obs.disconnect()
        }
      },
      { rootMargin: '0px 200px' },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  useEffect(() => {
    if (!visible) return
    let vivant = true
    void stickerPeint(entree.carte, holo).then((source) => {
      const t = toile.current
      const ctx = t?.getContext('2d')
      if (!vivant || source === null || t == null || ctx == null) return
      image.current = source
      t.width = source.width
      t.height = source.height
      ctx.drawImage(source, 0, 0)
    })
    return () => {
      vivant = false
    }
  }, [entree.carte, holo, visible])
  return (
    <button
      ref={bouton}
      type="button"
      className="coller-case"
      aria-label={`${enTitre(entree.carte.nom)}, ${NOM_DE_LA_VARIANTE[entree.v]}, ${entree.n} — glisser sur la carte`}
      onPointerDown={(e) => {
        if (image.current === null) return
        try {
          e.currentTarget.setPointerCapture(e.pointerId)
        } catch {
          // Un pointeur que le navigateur ne veut pas capturer : on suit quand même.
        }
        pris.current = true
        onPrendre(image.current, e)
      }}
      onPointerMove={(e) => {
        if (pris.current) onSuivre(e)
      }}
      onPointerUp={(e) => {
        if (!pris.current) return
        pris.current = false
        try {
          e.currentTarget.releasePointerCapture(e.pointerId)
        } catch {
          // Rien à relâcher.
        }
        onLacher(e)
      }}
      onPointerCancel={(e) => {
        if (!pris.current) return
        pris.current = false
        onLacher(e)
      }}
    >
      <canvas ref={toile} />
      {entree.n > 1 && <span className="vignette-nombre">×{entree.n}</span>}
    </button>
  )
}

/* ------------------------------------------------------------------------ */
/* LA PAGE                                                                  */
/* ------------------------------------------------------------------------ */

/**
 * LE MODE DECK : la même grille, pour composer le deck qui joue (Keko : « un
 * autre onglet dans le menu carte pour deck (crée le deck) »). Une place par
 * emoji possédé, sa plus belle version ; une tape met la carte dans le deck
 * ou l'en retire, au lieu de l'ouvrir. Voir `logic/emoji/deck.ts`.
 */
export interface ChoixDuDeck {
  /** Combien de cartes le deck qu'on compose (`edite`) tient. */
  readonly nombre: number
  /** LES EXEMPLAIRES DU DECK qu'on compose, pour le bandeau qui le montre entier. */
  readonly cartes: readonly { id: string; v: Variante }[]
  /**
   * CE QUE LA GRILLE DIT DE CHAQUE EXEMPLAIRE : dans le deck, libre, deck plein,
   * ou pris par un autre deck (`prisPar` : « Deck 2 »). *Une place par version
   * possédée*, comme la collection — Keko : « afficher des slots différents
   * quand une carte est normale / holo / animée / animée holo afin que le
   * joueur décide quel exemplaire il veut mettre dans le deck ».
   */
  readonly choix: (id: string, v: Variante) => { etat: 'dedans' | 'dehors' | 'plein' | 'pris'; prisPar?: string }
  readonly taille: number
  readonly onBasculer: (e: { id: string; v: Variante }) => void
  /** Voir jouer le deck actif. */
  readonly onJouer: () => void
  /**
   * PLUSIEURS DECKS (Keko : « que le joueur puisse avoir plusieurs decks, et
   * sélectionner celui avec lequel il veut jouer ») : un onglet chacun, celui
   * qu'on compose (`edite`) et celui qui joue (`actif`).
   */
  readonly decks: readonly { n: number; complet: boolean }[]
  readonly edite: number
  readonly actif: number
  readonly peutAjouter: boolean
  readonly onEditer: (i: number) => void
  readonly onAjouter: () => void
  readonly onSupprimer: () => void
  /** Faire jouer le deck qu'on compose. */
  readonly onJouerAvec: () => void
}

export function PageCollection({
  catalogue,
  collection,
  toutes = false,
  onOuvrirUnPaquet,
  onDetruire,
  onColler,
  deck,
}: {
  catalogue: readonly CarteEmoji[] | null
  collection: Collection
  /**
   * « TOUTES LES CARTES » : le catalogue entier, une place par emoji, celles
   * qu'on n'a pas en grisé (Keko : « toutes les cartes (liste de toutes les
   * cartes) »). Une carte possédée montre sa plus belle version. Sans
   * « Récentes » : une carte qu'on n'a pas n'a pas de date.
   */
  toutes?: boolean
  onOuvrirUnPaquet: () => void
  onDetruire: (id: string, ex: Exemplaire) => void
  /** Coller un sticker de l'album sur une version d'une carte : voir `coller`. */
  onColler: (cible: { id: string; v: Variante }, sticker: StickerColle) => void
  /** Le mode deck : voir `ChoixDuDeck`. */
  deck?: ChoixDuDeck
}): React.ReactElement {
  const modeDeck = deck !== undefined
  // L'ALBUM, CE QU'ON PEUT COLLER : une entrée par version de sticker possédée.
  const album = useMemo(() => {
    if (catalogue === null) return []
    const parId = new Map(catalogue.map((c) => [c.id, c]))
    const liste: { carte: CarteEmoji; v: Variante; n: number }[] = []
    for (const [id, s] of Object.entries(collection.stickers)) {
      const carte = parId.get(id)
      if (carte === undefined) continue
      for (const v of VARIANTES) {
        const n = compteDe(s, v)
        if (n > 0) liste.push({ carte, v, n })
      }
    }
    return liste.sort((a, b) => b.n - a.n || a.carte.rang - b.carte.rang)
  }, [catalogue, collection.stickers])
  const triParDefaut: Tri = toutes || modeDeck ? 'rares' : 'recentes'
  // SUPPRIMER UN DECK SE CONFIRME D'UNE SECONDE TAPE, dans les trois secondes.
  const [sur, setSur] = useState(false)
  useEffect(() => {
    if (!sur) return
    const t = window.setTimeout(() => setSur(false), 3000)
    return () => clearTimeout(t)
  }, [sur])
  const tris = toutes ? TRIS.filter((t) => t.id !== 'recentes') : TRIS
  const [recherche, setRecherche] = useState('')
  const [tri, setTri] = useState<Tri>(triParDefaut)
  const [raretes, setRaretes] = useState<ReadonlySet<RareteEmoji>>(new Set())
  // PLUSIEURS RACES ET RÔLES À LA FOIS, comme les raretés. Keko : « ce serait
  // bien de pouvoir sélectionner plusieurs catégories à la fois ».
  const [races, setRaces] = useState<ReadonlySet<RaceCarte>>(new Set())
  const [roles, setRoles] = useState<ReadonlySet<RoleCarte>>(new Set())
  const [bonus, setBonus] = useState<ReadonlySet<BonusFiltre>>(new Set())
  /**
   * OBTENUES / MANQUANTES, dans « Toutes les cartes » seulement (Keko : « dans
   * toutes les cartes, un filtre obtenues / manquantes »). Un ensemble comme
   * les autres : rien de coché, ou les deux, tout passe.
   */
  const [possession, setPossession] = useState<ReadonlySet<PossessionFiltre>>(new Set())
  // LES NOUVELLES SEULES. Keko : « un filtre nouveau dans la collection et les
  // stickers ». Une seule puce : coché, rien que ce qu'on n'a pas encore vu.
  const [nouvelles, setNouvelles] = useState(false)
  const [panneau, setPanneau] = useState(false)
  const actifs = raretes.size + races.size + roles.size + bonus.size + possession.size + (nouvelles ? 1 : 0)
  const [ouverte, setOuverte] = useState<{ id: string; v: Variante } | null>(null)
  /**
   * LE GLISSER-DÉPOSER DU DECK (Keko : « un drag and drop pour ajouter /
   * retirer, on garde le clic pour zoomer ») : une carte de la collection
   * lâchée sur la colonne entre au deck, une ligne de la colonne lâchée
   * ailleurs en sort. *Au doigt, seul un geste de côté saisit* : le vertical
   * fait défiler la grille ou la colonne (`touch-action: pan-y`).
   */
  const colonne = useRef<HTMLElement>(null)
  const [glisse, setGlisse] = useState<{
    carte: CarteEmoji
    depuis: 'collection' | 'deck'
    x: number
    y: number
    surColonne: boolean
  } | null>(null)
  /** Le clic qui suit un lâcher n'ouvre pas la carte. */
  const vientDeGlisser = useRef(false)
  const saisir = (e: React.PointerEvent, carte: CarteEmoji, v: Variante, depuis: 'collection' | 'deck'): void => {
    if (deck === undefined || e.button !== 0) return
    // Dans la collection, seule une carte qui peut entrer se saisit.
    if (depuis === 'collection' && deck.choix(carte.id, v).etat !== 'dehors') return
    const x0 = e.clientX
    const y0 = e.clientY
    const id = e.pointerId
    let parti = false
    const dans = (x: number, y: number): boolean => {
      const r = colonne.current?.getBoundingClientRect()
      return r !== undefined && x >= r.left && x <= r.right && y >= r.top && y <= r.bottom
    }
    const fin = (): void => {
      window.removeEventListener('pointermove', bouge)
      window.removeEventListener('pointerup', lache)
      window.removeEventListener('pointercancel', annule)
    }
    const bouge = (m: PointerEvent): void => {
      if (m.pointerId !== id) return
      const dx = m.clientX - x0
      const dy = m.clientY - y0
      if (!parti) {
        if (Math.hypot(dx, dy) < 8) return
        if (m.pointerType !== 'mouse' && Math.abs(dx) < Math.abs(dy)) return fin()
        parti = true
      }
      m.preventDefault()
      setGlisse({ carte, depuis, x: m.clientX, y: m.clientY, surColonne: dans(m.clientX, m.clientY) })
    }
    const lache = (m: PointerEvent): void => {
      if (m.pointerId !== id) return
      fin()
      if (!parti) return
      vientDeGlisser.current = true
      window.setTimeout(() => (vientDeGlisser.current = false), 0)
      const sur = dans(m.clientX, m.clientY)
      if (depuis === 'collection' ? sur : !sur) deck.onBasculer({ id: carte.id, v })
      setGlisse(null)
    }
    const annule = (m: PointerEvent): void => {
      if (m.pointerId !== id) return
      fin()
      setGlisse(null)
    }
    window.addEventListener('pointermove', bouge, { passive: false })
    window.addEventListener('pointerup', lache)
    window.addEventListener('pointercancel', annule)
  }
  const ouvrir = (e: { id: string; v: Variante }): void => {
    if (!vientDeGlisser.current) setOuverte(e)
  }

  const parId = useMemo(() => new Map((catalogue ?? []).map((c) => [c.id, c])), [catalogue])
  /** Ce qu'on possède ET que le catalogue connaît encore (un doublon retiré sort d'ici). */
  const possedees = useMemo(
    () =>
      Object.entries(collection.cartes)
        .map(([id, p]) => ({ carte: parId.get(id), p }))
        .filter((x): x is { carte: CarteEmoji; p: Possession } => x.carte !== undefined),
    [collection, parId],
  )
  /**
   * UNE PLACE PAR VERSION POSSÉDÉE. Keko : « on fait des emplacements
   * différents dans la collection pour holo / normal / animé / holo animé ».
   * Elles se suivent, dans l'ordre normal, holo, animé, holo animé.
   */
  const places = useMemo((): { carte: CarteEmoji; p: Possession | null; v: Variante }[] => {
    // LE MODE DECK : les mêmes places que la collection, une par version
    // possédée — c'est l'exemplaire qu'on met dans le deck (Keko).
    // LE CATALOGUE ENTIER : une place par emoji, la plus belle version qu'on a
    // (la dernière de `VARIANTES` possédée), ou la simple en grisé.
    if (toutes)
      return (catalogue ?? []).map((carte) => {
        const p = collection.cartes[carte.id] ?? null
        const v = p === null ? 'simple' : (VARIANTES.filter((v) => compteDe(p, v) > 0).at(-1) ?? 'simple')
        return { carte, p, v }
      })
    return possedees.flatMap(({ carte, p }) =>
      VARIANTES.filter((v) => compteDe(p, v) > 0).map((v) => ({ carte, p, v })),
    )
  }, [toutes, catalogue, collection, possedees])
  const visibles = useMemo(() => {
    const q = plier(recherche.trim())
    const l = places.filter(
      ({ carte, p, v }) =>
        (possession.size === 0 || possession.has(p === null ? 'manquantes' : 'obtenues')) &&
        (!nouvelles || (p !== null && p.nouvelles.includes(v))) &&
        passeLeBonus(bonus, {
          holo: p !== null && exemplaireDe(v).holo ? 1 : 0,
          anime: p !== null && exemplaireDe(v).anime ? 1 : 0,
        }) &&
        (raretes.size === 0 || raretes.has(carte.rarete)) &&
        (races.size === 0 || races.has(carte.race)) &&
        (roles.size === 0 || roles.has(carte.role)) &&
        (q === '' || plier(carte.nom).includes(q) || carte.mots.some((m) => plier(m).includes(q))),
    )
    const az = new Intl.Collator('fr')
    if (tri === 'recentes') l.sort((a, b) => (b.p?.ordre ?? -1) - (a.p?.ordre ?? -1))
    else if (tri === 'az') l.sort((a, b) => az.compare(a.carte.nom, b.carte.nom))
    else l.sort((a, b) => a.carte.rang - b.carte.rang)
    return l
  }, [places, recherche, tri, raretes, races, roles, bonus, possession, nouvelles])

  const total = catalogue?.length ?? 0
  const part = deck !== undefined ? deck.nombre / deck.taille : total === 0 ? 0 : possedees.length / total
  const exemplaires = nombreDExemplaires(collection)
  /**
   * LE DECK D'UN COUP D'ŒIL (Keko : « on ne peut pas visualiser son deck d'un
   * coup d'oeil ») : ses cartes du plus rare au plus commun, puis ses places
   * vides jusqu'à trente.
   */
  const duDeck = useMemo(
    () =>
      (deck?.cartes ?? [])
        .flatMap((e): { carte: CarteEmoji; p: Possession | null; v: Variante }[] => {
          const carte = parId.get(e.id)
          return carte === undefined ? [] : [{ carte, p: collection.cartes[e.id] ?? null, v: e.v }]
        })
        .sort((a, b) => a.carte.rang - b.carte.rang),
    [deck?.cartes, parId, collection.cartes],
  )
  const laOuverte =
    ouverte === null
      ? undefined
      : places.find((x) => x.carte.id === ouverte.id && x.v === ouverte.v)

  return (
    <div className={`collection${modeDeck ? ' collection-avec-deck' : ''}`}>
      <div className="collection-defile">
        <header className="collection-tete">
          <h1 className="collection-titre">{modeDeck ? 'Mes decks' : toutes ? 'Toutes les cartes' : 'Ma collection'}</h1>
          {/* UN ONGLET PAR DECK : celui qu'on compose en crème, celui qui joue
              marqué « joue », et « + » pour en ouvrir un autre. */}
          {deck !== undefined && (
            <div className="decks-onglets" role="tablist" aria-label="Mes decks">
              {deck.decks.map((d, i) => (
                <button
                  key={i}
                  type="button"
                  role="tab"
                  aria-selected={i === deck.edite}
                  className={`deck-onglet${i === deck.edite ? ' deck-onglet-edite' : ''}`}
                  onClick={() => deck.onEditer(i)}
                >
                  Deck {i + 1}
                  <span className="deck-onglet-compte">
                    {d.n}/{deck.taille}
                  </span>
                  {/* LE DECK ACTIF NE JOUE QUE COMPLET : sinon il le dit (Keko). */}
                  {i === deck.actif &&
                    (d.n < deck.taille ? (
                      <span className="deck-onglet-joue deck-onglet-incomplet">incomplet</span>
                    ) : (
                      <span className="deck-onglet-joue">joue</span>
                    ))}
                </button>
              ))}
              {deck.peutAjouter && (
                <button type="button" className="deck-onglet deck-ajouter" aria-label="Nouveau deck" onClick={deck.onAjouter}>
                  +
                </button>
              )}
            </div>
          )}
          <p className="collection-compte">
            {deck !== undefined ? (
              <>
                Deck {deck.edite + 1} · <b>{deck.nombre}</b> / {deck.taille} cartes ·{' '}
                {deck.nombre >= deck.taille
                  ? deck.edite === deck.actif
                    ? 'complet, il joue'
                    : 'complet, prêt à jouer'
                  : `encore ${deck.taille - deck.nombre} à choisir`}
              </>
            ) : toutes ? (
              <>
                <b>{possedees.length}</b> / {total} obtenues · {total - possedees.length} manquante
                {total - possedees.length > 1 ? 's' : ''}
              </>
            ) : (
              <>
                <b>{possedees.length}</b> / {total} personnages · {exemplaires} carte{exemplaires > 1 ? 's' : ''} ·{' '}
                {collection.paquets} paquet{collection.paquets > 1 ? 's' : ''}
              </>
            )}
          </p>
          <div className="collection-barre" aria-hidden>
            <span style={{ width: `${(part * 100).toFixed(2)}%` }} />
          </div>
          {/* LES ACTIONS DU DECK QU'ON COMPOSE : le voir jouer s'il joue, le faire
              jouer sinon (complet), et le supprimer (deux tapes) s'il n'est pas seul. */}
          {deck !== undefined && (
            <div className="deck-actions">
              {deck.edite === deck.actif
                ? deck.nombre >= deck.taille && (
                    <button type="button" className="collection-bouton deck-jouer" onClick={deck.onJouer}>
                      Voir le deck jouer
                    </button>
                  )
                : (
                    <button
                      type="button"
                      className="collection-bouton deck-jouer"
                      disabled={deck.nombre < deck.taille}
                      onClick={deck.onJouerAvec}
                    >
                      Jouer avec ce deck
                    </button>
                  )}
              {deck.decks.length > 1 && (
                <button
                  type="button"
                  className={`deck-supprimer${sur ? ' deck-supprimer-sur' : ''}`}
                  onClick={() => {
                    if (!sur) setSur(true)
                    else {
                      setSur(false)
                      deck.onSupprimer()
                    }
                  }}
                >
                  {sur ? 'Sûr ? Supprimer' : 'Supprimer ce deck'}
                </button>
              )}
            </div>
          )}
        </header>

        {(toutes || possedees.length > 0) && (
          <div className="collection-outils">
            <div className="collection-ligne">
              <input
                className="collection-recherche"
                type="search"
                placeholder="Chercher une carte"
                value={recherche}
                onChange={(e) => setRecherche(e.target.value)}
              />
              <BoutonFiltres actifs={actifs} onOuvrir={() => setPanneau(true)} />
            </div>
          </div>
        )}
        {panneau && (
          <PanneauFiltres
            titre="Filtres"
            voir={`Voir ${visibles.length} carte${visibles.length > 1 ? 's' : ''}`}
            onEffacer={() => {
              setRaretes(new Set())
              setRaces(new Set())
              setRoles(new Set())
              setBonus(new Set())
              setPossession(new Set())
              setNouvelles(false)
              setTri(triParDefaut)
            }}
            onFermer={() => setPanneau(false)}
          >
            <SectionFiltre titre="Trier">
            <div className="collection-segments" role="radiogroup" aria-label="Trier">
              {tris.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  role="radio"
                  aria-checked={tri === t.id}
                  className={tri === t.id ? 'actif' : ''}
                  onClick={() => setTri(t.id)}
                >
                  {t.nom}
                </button>
              ))}
            </div>
            </SectionFiltre>
            <SectionFiltre titre="Rareté">
            <div className="filtres-panneau-puces">
              {RARETES_EMOJI.map((r) => (
                <button
                  key={r}
                  type="button"
                  className={`puce${raretes.has(r) ? ' actif' : ''}`}
                  style={{ '--cran': teinteDuCran(r) } as React.CSSProperties}
                  onClick={() => setRaretes((s) => basculer(s, r))}
                >
                  <i />
                  {NOM_DE_LA_RARETE[r]}
                </button>
              ))}
            </div>
            </SectionFiltre>
            <SectionFiltre titre="Race">
            <div className="filtres-panneau-puces">
              {RACES.map((g) => (
                <button
                  key={g}
                  type="button"
                  className={`puce${races.has(g) ? ' actif' : ''}`}
                  onClick={() => setRaces((s) => basculer(s, g))}
                >
                  {NOM_DE_LA_RACE[g]}
                </button>
              ))}
            </div>
            </SectionFiltre>
            <SectionFiltre titre="Rôle">
            <div className="filtres-panneau-puces">
              {ROLES.map((g) => (
                <button
                  key={g}
                  type="button"
                  className={`puce${roles.has(g) ? ' actif' : ''}`}
                  onClick={() => setRoles((s) => basculer(s, g))}
                >
                  {NOM_DU_ROLE[g]}
                </button>
              ))}
            </div>
            </SectionFiltre>
            <SectionFiltre titre="Bonus">
              <PucesBonus valeur={bonus} onChange={setBonus} />
            </SectionFiltre>
            {/* « NOUVEAU » VIT DANS « POSSESSION » (Keko : « basculer le filtre
                nouveauté dans la section Possession ») : dans « Toutes les cartes »
                derrière Obtenues / Manquantes, seul dans la collection. Il reste
                un ET avec les deux autres : une nouvelle est forcément obtenue. */}
            <SectionFiltre titre="Possession">
              <div className="filtres-panneau-puces">
                {toutes &&
                  POSSESSION_FILTRES.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      className={`puce${possession.has(f.id) ? ' actif' : ''}`}
                      onClick={() => setPossession((s) => basculer(s, f.id))}
                    >
                      {f.nom}
                    </button>
                  ))}
                <button
                  type="button"
                  className={`puce puce-nouveau${nouvelles ? ' actif' : ''}`}
                  aria-pressed={nouvelles}
                  onClick={() => setNouvelles((n) => !n)}
                >
                  Nouveau
                </button>
              </div>
            </SectionFiltre>
          </PanneauFiltres>
        )}

        {catalogue === null ? null : !toutes && possedees.length === 0 ? (
          <div className="collection-vide">
            <p>Ta collection est vide.</p>
            <p className="collection-discret">Chaque paquet ouvert y range ses cinq cartes.</p>
            <button type="button" className="collection-bouton" onClick={onOuvrirUnPaquet}>
              Ouvrir un paquet
            </button>
          </div>
        ) : visibles.length === 0 ? (
          <div className="collection-vide">
            <p className="collection-discret">Aucune carte ne correspond.</p>
          </div>
        ) : (
          <div className="collection-grille">
            {visibles.map(({ carte, p, v }) => (
              <Vignette
                key={`${carte.id}:${v}`}
                carte={carte}
                possession={p}
                variante={v}
                choix={deck === undefined ? undefined : deck.choix(carte.id, v).etat}
                prisPar={deck === undefined ? undefined : deck.choix(carte.id, v).prisPar}
                onOuvrir={() => ouvrir({ id: carte.id, v })}
                onSaisir={deck === undefined ? undefined : (e) => saisir(e, carte, v, 'collection')}
              />
            ))}
          </div>
        )}
      </div>
      {/* LA COLONNE DU DECK, à droite de la collection (Keko : « la collection
          et sur la droite une colonne de deck, une ligne par carte, avec une
          mini de l'illustration, le nom, une indication de rareté ») : elle
          défile seule ; une tape sur une ligne retire la carte. */}
      {deck !== undefined && catalogue !== null && (
        <aside
          ref={colonne}
          className={`deck-colonne${glisse?.depuis === 'collection' ? ' deck-colonne-attend' : ''}${glisse?.depuis === 'collection' && glisse.surColonne ? ' deck-colonne-cible' : ''}`}
          aria-label={`Deck ${deck.edite + 1}`}
        >
          <div className="deck-colonne-tete">
            Deck {deck.edite + 1} <b>{deck.nombre}/{deck.taille}</b>
          </div>
          <div className="deck-colonne-liste">
            {duDeck.length === 0 && <p className="deck-colonne-vide">Glisse une carte ici pour l'ajouter au deck.</p>}
            {duDeck.map(({ carte, v }) => {
              const { holo, anime } = exemplaireDe(v)
              return (
                <button
                  key={`${carte.id}:${v}`}
                  type="button"
                  className="deck-ligne"
                  style={{ '--cran': teinteDuCran(carte.rarete) } as React.CSSProperties}
                  title={`${enTitre(carte.nom)} : glisse-la hors du deck pour la retirer`}
                  onClick={() => ouvrir({ id: carte.id, v })}
                  onPointerDown={(e) => saisir(e, carte, v, 'deck')}
                >
                  <img draggable={false} className="deck-ligne-image" src={`${import.meta.env.BASE_URL}${carte.image}?v=${encodeURIComponent(__BUILD_TIME__)}`} alt="" loading="lazy" />
                  <span className="deck-ligne-texte">
                    <span className="deck-ligne-nom">{enTitre(carte.nom)}</span>
                    <span className="deck-ligne-rarete">
                      {NOM_DE_LA_RARETE[carte.rarete]}
                      {holo ? ' · holo' : ''}
                      {anime ? ' · animée' : ''}
                    </span>
                  </span>
                </button>
              )
            })}
          </div>
        </aside>
      )}
      {/* LA CARTE QU'ON GLISSE suit le doigt ; rouge quand la lâcher la retire. */}
      {glisse !== null &&
        createPortal(
          <div
            className={`deck-fantome${glisse.depuis === 'deck' && !glisse.surColonne ? ' deck-fantome-retire' : ''}`}
            style={{ left: glisse.x, top: glisse.y, '--cran': teinteDuCran(glisse.carte.rarete) } as React.CSSProperties}
            aria-hidden
          >
            <img draggable={false} src={`${import.meta.env.BASE_URL}${glisse.carte.image}?v=${encodeURIComponent(__BUILD_TIME__)}`} alt="" />
          </div>,
          document.body,
        )}
      {/* PAR-DESSUS LA BARRE : la page est fixe, donc elle fait son propre
          empilement, et la carte ouverte doit en sortir pour couvrir la
          navigation. *Une carte qu'on regarde n'a rien à côté d'elle.* */}
      {laOuverte !== undefined &&
        createPortal(
          <CarteOuverte
            carte={laOuverte.carte}
            possession={laOuverte.p}
            variante={laOuverte.v}
            total={total}
            album={album}
            onFermer={() => setOuverte(null)}
            onDetruire={(ex) => onDetruire(laOuverte.carte.id, ex)}
            onColler={(st) => onColler({ id: laOuverte.carte.id, v: laOuverte.v }, st)}
          />,
          document.body,
        )}
    </div>
  )
}

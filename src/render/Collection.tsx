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
import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Canvas, useFrame } from '@react-three/fiber'
import { NoToneMapping, type Group } from 'three'
import type { CarteEmoji, RaceCarte, RareteEmoji, RoleCarte } from '../logic/emoji/types.ts'
import { NOM_DE_LA_RACE, NOM_DU_ROLE, RACES, RARETES_EMOJI, ROLES } from '../logic/emoji/types.ts'
import type { Collection, Possession, Variante } from '../logic/emoji/collection.ts'
import { VARIANTES, aFusionnerPour, compteDe, exemplaireDe, fusionner, nombreDExemplaires } from '../logic/emoji/collection.ts'
import { NOM_DECK_MAX } from '../logic/emoji/deck.ts'
import { AMBIANCE, type SujetPeint, tailleQuIlFaut } from './texture-carte.ts'
import { animationHolo, coucheDesRayons, paillettesHolo, peinte, sujetDeLaVignette } from './peinture-vignette.ts'
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
import { COULEUR, carteDeLEmoji, enTitre, niveauDuPersonnageDe } from './carte-emoji.ts'
import { Carte3D, HAUT, LARGE, SATURATION_APLAT, type CurseurDeCarte } from './Carte3D.tsx'
import { Cadrage, FOV, Z_MAIN, hauteurVisibleA, zCamera } from './Cadrage.tsx'
import { Horloge } from './horloge.tsx'
import { Bloom } from './Bloom.tsx'
import { PencheAuGyro } from './Paquet3D.tsx'
import { suivreLInclinaison, type Inclinaison } from './inclinaison.ts'
import { SON_EQUIPER, SON_POSER, jouerSon } from './sons.ts'

export const NOM_DE_LA_VARIANTE: Readonly<Record<Variante, string>> = {
  simple: 'normal',
  holo: 'holo',
  anime: 'animé',
  holoAnime: 'holo animé',
}

export const NOM_DE_LA_RARETE: Readonly<Record<RareteEmoji, string>> = {
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

type Tri = 'recentes' | 'az' | 'rares' | 'niveau'

const TRIS: readonly { id: Tri; nom: string }[] = [
  { id: 'recentes', nom: 'Récentes' },
  { id: 'az', nom: 'A → Z' },
  { id: 'rares', nom: 'Rareté' },
  // LE NIVEAU EST UN CLASSEMENT, PAS UN FILTRE (Keko : « pourquoi on ne rajoute
  // pas un type de classement niveau plutôt ? comme pour A→Z ») : le plus haut
  // d'abord, à égalité l'ordre du catalogue.
  { id: 'niveau', nom: 'Niveau' },
]

/**
 * Vrai quand le deck se montre en BANDEAU : au doigt, en portrait (la même
 * requête que sa CSS) ; en paysage, il reprend la colonne de droite (Keko).
 */
function useAuDoigt(): boolean {
  const requete = '(pointer: coarse) and (orientation: portrait)'
  const [oui, setOui] = useState(() => typeof matchMedia !== 'undefined' && matchMedia(requete).matches)
  useEffect(() => {
    const m = matchMedia(requete)
    const suivre = (): void => setOui(m.matches)
    m.addEventListener('change', suivre)
    return () => m.removeEventListener('change', suivre)
  }, [])
  return oui
}

/** Au doigt, l'appui qui zoome une carte dans l'éditeur de deck. */
const APPUI_LONG_MS = 450

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
  onBouger,
  onLacher,
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
  /** L'appui long (zoom au doigt) s'annule si le doigt bouge ou se lève. */
  onBouger?: (e: React.PointerEvent) => void
  onLacher?: () => void
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
  // LE NIVEAU DU PERSONNAGE : la vignette se repeint quand il monte (ses étoiles, sa puissance).
  const niveau = niveauDuPersonnageDe(carte.id)
  const compte = possession === null ? 0 : compteDe(possession, variante)
  const tourne = AVEC_TOURNE && anime && carte.animable
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
        void peinte(carte, largeur, holo, tourne, false, false, tourne, [], !holo && !tourne).then(async (source) => {
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
  }, [carte, holo, tourne, niveau])
  // LA VIGNETTE ANIMÉE SUIT SA VISIBILITÉ : l'animation ne joue qu'à l'écran
  // (l'observateur du dessus se coupe après la première peinture).
  useEffect(() => {
    const el = boite.current
    if (!tourne || el === null) return
    const obs = new IntersectionObserver((e) => setVisible(e.some((x) => x.isIntersecting)), {
      rootMargin: '200px 0px',
    })
    obs.observe(el)
    return () => obs.disconnect()
  }, [tourne])
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
      className={`vignette${prete ? ' vignette-prete' : ''}${holo ? ' vignette-holo' : ''}${possession === null ? ' vignette-manquante' : ''}${choix === 'dedans' ? ' vignette-choisie' : ''}${choix === 'plein' ? ' vignette-estompee' : ''}`}
      style={{ '--cran': teinteDuCran(carte.rarete) } as React.CSSProperties}
      onClick={onOuvrir}
      onPointerDown={onSaisir}
      onPointerMove={onBouger}
      onPointerUp={onLacher}
      onPointerCancel={onLacher}
      onContextMenu={onSaisir === undefined ? undefined : (e) => e.preventDefault()}
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
      {prisPar !== undefined && (
        <span className="vignette-prise" title={prisPar ?? 'Pris'} aria-label={`Dans ${prisPar ?? 'un autre deck'}`}>
          ✓
        </span>
      )}
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

/**
 * LA CARTE EN GRAND — la même `Carte3D` que le paquet, donc la même matière :
 * le reflet au doigt, le penchant au téléphone, **et la feuille holo ou
 * l'animation si on possède l'exemplaire qui les porte.** *On montre le plus
 * bel exemplaire qu'on a* : un holo et un animé valent mieux que la carte nue.
 */
/**
 * LE BUMP DE LA CARTE ZOOMÉE. Keko : « une petite anime bump à l'apparition
 * d'une carte lors d'un zoom ». Dès qu'elle est peinte, la carte grandit de
 * 85 % à sa taille en la dépassant un peu (un « retour arrière » amorti), en
 * 0,35 s — autour de SON centre, pas de l'origine de la scène.
 */
const BUMP = { depart: 0.85, duree: 0.35, depasse: 2.6 }
function Bump({ pret, centre, children }: { pret: boolean; centre: readonly [number, number, number]; children: React.ReactNode }): React.ReactElement {
  const g = useRef<Group>(null)
  const t = useRef(0)
  useFrame((_, delta) => {
    const el = g.current
    if (el === null || !pret || t.current >= 1) return
    t.current = Math.min(1, t.current + delta / BUMP.duree)
    const u = t.current - 1
    const sortie = 1 + (BUMP.depasse + 1) * u * u * u + BUMP.depasse * u * u
    el.scale.setScalar(BUMP.depart + (1 - BUMP.depart) * sortie)
  })
  return (
    <group ref={g} position={[...centre]} scale={BUMP.depart}>
      <group position={[-centre[0], -centre[1], -centre[2]]}>{children}</group>
    </group>
  )
}

function CarteOuverte({
  carte,
  possession,
  variante,
  onFermer,
  onFusionner,
}: {
  carte: CarteEmoji
  /** `null` : ouverte depuis le catalogue sans la posséder — rien à fusionner. */
  possession: Possession | null
  variante: Variante
  onFermer: () => void
  /** Fusionne les exemplaires du personnage vers son niveau suivant : voir `fusionner`. */
  onFusionner: () => void
}): React.ReactElement {
  /**
   * LA CARTE N'APPARAÎT QU'UNE FOIS PEINTE. Keko : « quand je zoome une carte,
   * un carré gris apparaît avant la carte ». *Sans sa texture, la face n'a pas
   * d'alpha pour couper ses coins* : c'était la dalle sombre et brillante,
   * carrée, le temps que l'illustration en grand arrive.
   */
  const [peinte, setPeinte] = useState(false)
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
  const niveau = niveauDuPersonnageDe(carte.id)
  const aPeindre = useMemo(
    () => {
      const ex = exemplaireDe(variante)
      return carteDeLEmoji(carte, { holo: ex.holo, anime: ex.anime && carte.animable }, niveau)
    },
    [carte, variante, niveau],
  )
  /**
   * LA FUSION SE VOIT : la carte rebondit encore (le `Bump` repart, sa clé est
   * le compte des fusions), le titre du niveau éclate et le son de l'équipement
   * sonne. Les étoiles arrivent d'elles-mêmes : la carte se repeint au niveau.
   */
  const [fusions, setFusions] = useState(0)
  // LA CARTE TIENT DANS L'ÉCRAN, avec la place des lignes du dessous : la règle
  // de la rangée du paquet, *la taille se calcule sur la place.*
  const hVisible = hauteurVisibleA(Z_MAIN, fenetre.h)
  const lVisible = (hVisible * fenetre.l) / fenetre.h
  // LE TÉLÉPHONE EN PAYSAGE (Keko) : sous la carte, les lignes n'ont plus la
  // place. La carte passe à gauche, sur presque toute la hauteur, ses lignes
  // à droite (`carte-ouverte-a-cote`).
  const aCote = fenetre.l > fenetre.h && fenetre.h < 520
  const xCarte = aCote ? -lVisible * 0.2 : 0
  const yCarte = aCote ? 0 : hVisible * 0.09
  const taille = aCote
    ? Math.min((lVisible * 0.42) / LARGE, (hVisible * 0.86) / HAUT)
    : Math.min((lVisible * 0.82) / LARGE, (hVisible * 0.54) / HAUT)
  const px = (taille * LARGE * fenetre.l * Math.min(window.devicePixelRatio || 1, 2)) / lVisible
  /**
   * LE DOIGT PENCHE LA CARTE, COMME AU PAQUET. Keko : « il faut pouvoir bouger
   * la carte de la collection qu'on zoome comme quand on ouvre les boosters ».
   * *C'est le geste de l'écran du paquet, recopié* : au doigt, le maintien
   * penche et suit le doigt même sorti de la carte ; à la souris, le survol.
   * **Une tape à côté la repose** — une tape, pas un glisser qui finit dehors.
   */
  const boite = {
    cx: fenetre.l * (0.5 + xCarte / lVisible),
    cy: fenetre.h * (0.5 - yCarte / hVisible),
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
        const tape = Math.hypot(e.clientX - depart.x, e.clientY - depart.y) < 12
        const b = refBoite.current
        const dedans = Math.abs(e.clientX - b.cx) <= b.l / 2 && Math.abs(e.clientY - b.cy) <= b.h / 2
        // La croix et « Fusionner » font leur travail : on ne repose pas.
        const surUnBouton = e.target instanceof Element && e.target.closest('button') !== null
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
  return (
    <div className={`carte-ouverte${aCote ? ' carte-ouverte-a-cote' : ''}`}>
      <Canvas
        dpr={[1, 2]}
        camera={{ position: [0, 0, zCamera(fenetre.h)], fov: FOV }}
        gl={{ toneMapping: NoToneMapping }}
        style={{ position: 'fixed', inset: 0 }}
      >
        <Cadrage />
        <Horloge />
        <PencheAuGyro curseurs={[curseur.current]} gyro={gyro} />
        <Bloom />
        <ambientLight intensity={0.55} />
        <directionalLight position={[2.5, 3.5, 4]} intensity={2.2} />
        <directionalLight position={[-4, 1, 2]} intensity={0.9} color="#8fb4ff" />
        <group visible={peinte}>
        <Bump key={fusions} pret={peinte} centre={[xCarte, yCarte, Z_MAIN]}>
        <Carte3D
          onPeinte={() => setPeinte(true)}
          carte={aPeindre}
          position={[xCarte, yCarte, Z_MAIN]}
          taille={taille}
          tailleTexture={px}
          reflet
          refletAuDoigt
          curseurPartage={curseur.current}
          ombre={false}
        />
        </Bump>
        </group>
      </Canvas>
      <div className="carte-ouverte-infos">
        <span className="carte-ouverte-cran" style={{ '--cran': teinteDuCran(carte.rarete) } as React.CSSProperties}>
          {NOM_DE_LA_RARETE[carte.rarete]}
        </span>
        {/* NI LE COMPTE D'EXEMPLAIRES NI LA LIGNE DE LA DATE (Keko : « enlève le
            "X exemplaire normal" et la ligne de la date d'obtention »). */}
        {possession !== null && (
          <NiveauDeLaCarte
            niveau={niveau}
            exemplaires={possession.n}
            fusions={fusions}
            onFusionner={() => {
              onFusionner()
              setFusions((f) => f + 1)
              jouerSon(SON_EQUIPER)
              navigator.vibrate?.(30)
            }}
          />
        )}
      </div>
      <button type="button" className="carte-ouverte-fermer" aria-label="Fermer" onClick={onFermer}>
        ×
      </button>
    </div>
  )
}

/**
 * LE NIVEAU DU PERSONNAGE, SOUS SA CARTE OUVERTE. Keko : « le niveau indique
 * le nombre de cartes à fusionner : pour passer niveau 2 il faut deux
 * exemplaires, et niveau 5 il en faut 5 ». Ses étoiles, la jauge de ses
 * exemplaires — *toutes versions ensemble, la carte qu'on garde comprise* — et
 * le bouton, éteint tant qu'il en manque. `fusions` rejoue l'éclat du titre.
 */
function NiveauDeLaCarte({
  niveau,
  exemplaires,
  fusions,
  onFusionner,
}: {
  niveau: number
  exemplaires: number
  fusions: number
  onFusionner: () => void
}): React.ReactElement {
  const besoin = aFusionnerPour(niveau)
  return (
    <div className="niveau">
      <p key={fusions} className={`niveau-titre${fusions > 0 ? ' niveau-monte' : ''}`}>
        Niveau {niveau}
      </p>
      {/* LES ÉTOILES SOUS LE NIVEAU (Keko), plus à côté. */}
      {niveau > 1 && <p className="niveau-etoiles" aria-hidden="true">{'★'.repeat(niveau - 1)}</p>}
      {besoin === null ? (
        <p className="carte-ouverte-ligne carte-ouverte-discret">Niveau maximum</p>
      ) : (
        <>
          <div className="niveau-jauge" role="progressbar" aria-valuemin={0} aria-valuemax={besoin} aria-valuenow={Math.min(exemplaires, besoin)}>
            {Array.from({ length: besoin }, (_, i) => (
              <span key={i} className={i < exemplaires ? 'plein' : ''} />
            ))}
          </div>
          <p className="carte-ouverte-ligne carte-ouverte-discret">
            {Math.min(exemplaires, besoin)} / {besoin} exemplaires pour le niveau {niveau + 1}
          </p>
          <button type="button" className="decoller" disabled={exemplaires < besoin} onClick={onFusionner}>
            Fusionner {besoin} cartes
          </button>
        </>
      )}
    </div>
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
  readonly decks: readonly { n: number; complet: boolean; nom: string; nomDonne: string }[]
  /** Nommer le deck qu'on compose (Keko : « pouvoir nommer les decks ») ; vide : « Deck N ». */
  readonly onRenommer: (nom: string) => void
  readonly edite: number
  readonly actif: number
  /** Revenir à « Mes decks », les étuis (voir `PageDecks`). */
  readonly onRetour: () => void
  readonly onSupprimer: () => void
  /** Faire jouer le deck qu'on compose. */
  readonly onJouerAvec: () => void
}

export function PageCollection({
  catalogue,
  collection,
  toutes = false,
  onOuvrirUnPaquet,
  onFusionner,
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
  /** Fusionne les exemplaires d'un personnage vers son niveau suivant : voir `fusionner`. */
  onFusionner: (id: string) => void
  /** Le mode deck : voir `ChoixDuDeck`. */
  deck?: ChoixDuDeck
}): React.ReactElement {
  const modeDeck = deck !== undefined
  const triParDefaut: Tri = toutes || modeDeck ? 'rares' : 'recentes'
  // SUPPRIMER UN DECK SE CONFIRME D'UNE SECONDE TAPE, dans les trois secondes.
  const [sur, setSur] = useState(false)
  /** LE NOM SE CHANGE AU CRAYON, en tête de la colonne (Keko) : le champ n'est là que pendant. */
  const [renomme, setRenomme] = useState(false)
  useEffect(() => setRenomme(false), [deck?.edite])
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
  // MASQUER LES CARTES ATTRIBUÉES, en mode deck (Keko) : un emoji que le deck
  // qu'on compose tient s'efface, toutes versions ; une version qu'un autre
  // deck a prise aussi. Un bouton à lui, hors du panneau des filtres (Keko).
  const [sansAttribuees, setSansAttribuees] = useState(false)
  const [panneau, setPanneau] = useState(false)
  const actifs = raretes.size + races.size + roles.size + bonus.size + possession.size + (nouvelles ? 1 : 0)
  const [ouverte, setOuverte] = useState<{ id: string; v: Variante } | null>(null)
  /**
   * LE GLISSER-DÉPOSER DU DECK (Keko : « un drag and drop pour ajouter /
   * retirer, on garde le clic pour zoomer ») : une carte de la collection
   * lâchée sur la colonne entre au deck, une ligne de la colonne lâchée
   * ailleurs en sort. *À la souris seulement* : au doigt, voir `toucher`.
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
  /**
   * AU DOIGT, PAS DE GLISSER : UNE TAPE AJOUTE OU RETIRE (Keko : « le drag and
   * drop entre en conflit avec le défilement vertical de la collection » ;
   * choisi : « tape = ajouter / retirer »). Une tape sur une carte de la grille
   * la met au deck (ou l'en sort si elle y est), une tape sur une miniature du
   * bandeau la retire ; le zoom passe à l'APPUI LONG. La souris garde le
   * glisser-déposer et le clic qui zoome.
   */
  const enBandeau = useAuDoigt()
  /**
   * PRENDRE UNE CARTE À UN AUTRE DECK SE CONFIRME (Keko : « un petit message
   * de confirmation pour demander si on est sûr de prendre une carte d'un
   * autre deck ») : la tape ou le lâcher ouvrent la question, « Prendre » fait
   * l'échange, « Annuler » ne touche à rien.
   */
  const [aPrendre, setAPrendre] = useState<{ carte: CarteEmoji; v: Variante; prisPar: string } | null>(null)
  const entrer = (carte: CarteEmoji, v: Variante): void => {
    if (deck === undefined) return
    const { etat, prisPar } = deck.choix(carte.id, v)
    if (etat === 'pris') setAPrendre({ carte, v, prisPar: prisPar ?? 'un autre deck' })
    else deck.onBasculer({ id: carte.id, v })
  }
  const auDoigt = useRef(false)
  const appuiLong = useRef<{ minuteur: number; x: number; y: number } | null>(null)
  const zoomeParAppui = useRef(false)
  const lacherAppui = (): void => {
    if (appuiLong.current !== null) clearTimeout(appuiLong.current.minuteur)
    appuiLong.current = null
  }
  const toucher = (e: React.PointerEvent, carte: CarteEmoji, v: Variante, depuis: 'collection' | 'deck'): void => {
    auDoigt.current = e.pointerType !== 'mouse'
    if (!auDoigt.current) return saisir(e, carte, v, depuis)
    lacherAppui()
    zoomeParAppui.current = false
    appuiLong.current = {
      x: e.clientX,
      y: e.clientY,
      minuteur: window.setTimeout(() => {
        appuiLong.current = null
        zoomeParAppui.current = true
        navigator.vibrate?.(15)
        setOuverte({ id: carte.id, v })
      }, APPUI_LONG_MS),
    }
  }
  const bougerAppui = (e: React.PointerEvent): void => {
    const a = appuiLong.current
    if (a !== null && Math.hypot(e.clientX - a.x, e.clientY - a.y) > 10) lacherAppui()
  }
  /** Une tape : au doigt, elle bascule l'exemplaire dans le deck ; à la souris, elle zoome. */
  const taper = (carte: CarteEmoji, v: Variante): void => {
    if (zoomeParAppui.current) {
      zoomeParAppui.current = false
      return
    }
    if (deck === undefined || !auDoigt.current) return ouvrir({ id: carte.id, v })
    if (deck.choix(carte.id, v).etat === 'plein') return
    entrer(carte, v)
  }
  const saisir = (e: React.PointerEvent, carte: CarteEmoji, v: Variante, depuis: 'collection' | 'deck'): void => {
    if (deck === undefined || e.button !== 0) return
    // Dans la collection, seule une carte qui peut entrer se saisit — celle
    // d'un autre deck aussi : posée ici, elle quitte l'autre (Keko).
    const etat = deck.choix(carte.id, v).etat
    if (depuis === 'collection' && etat !== 'dehors' && etat !== 'pris') return
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
      if (depuis === 'collection' ? sur : !sur) entrer(carte, v)
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
        (deck === undefined ||
          !sansAttribuees ||
          (!deck.cartes.some((e) => e.id === carte.id) && deck.choix(carte.id, v).prisPar === undefined)) &&
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
    else if (tri === 'niveau')
      l.sort((a, b) => niveauDuPersonnageDe(b.carte.id) - niveauDuPersonnageDe(a.carte.id) || a.carte.rang - b.carte.rang)
    else l.sort((a, b) => a.carte.rang - b.carte.rang)
    return l
  }, [places, recherche, tri, raretes, races, roles, bonus, possession, nouvelles, deck, sansAttribuees])

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

  /* LA COLONNE DU DECK, à droite de la collection (Keko : « la collection
     et sur la droite une colonne de deck, une ligne par carte, avec une
     mini de l'illustration, le nom, une indication de rareté ») : elle
     défile seule ; une tape sur une ligne retire la carte. */
  // AU DOIGT EN PORTRAIT C'EST UN BANDEAU, rangé dans le défilé SOUS LA JAUGE
  // ET AU-DESSUS DE LA RECHERCHE (Keko : « mettre le bandeau deck au-dessus de
  // la barre de recherche mais sous la jauge » ; il était d'abord dessous) ;
  // il défile avec la page ; ailleurs, la colonne de droite.
  const colonneDuDeck =
    deck !== undefined && catalogue !== null ? (
    <aside
      ref={colonne}
      className={`deck-colonne${glisse?.depuis === 'collection' ? ' deck-colonne-attend' : ''}${glisse?.depuis === 'collection' && glisse.surColonne ? ' deck-colonne-cible' : ''}`}
      aria-label={deck.decks[deck.edite]?.nom ?? `Deck ${deck.edite + 1}`}
    >
      {/* LA TÊTE DE LA COLONNE NE DIT QUE LE COMPTE : le nom, le crayon et
          « Supprimer » sont montés au-dessus de la collection (Keko). */}
      <div className="deck-colonne-tete">
        <span className="deck-colonne-nom">Cartes</span>
        <b>{deck.nombre}/{deck.taille}</b>
      </div>
      <div className="deck-colonne-liste">
        {duDeck.length === 0 && <p className="deck-colonne-vide">{matchMedia('(pointer: coarse)').matches ? "Touchez une carte pour l'ajouter au deck." : "Glissez une carte ici pour l'ajouter au deck."}</p>}
        {duDeck.map(({ carte, v }) => {
          const { holo, anime } = exemplaireDe(v)
          return (
            <button
              key={`${carte.id}:${v}`}
              type="button"
              className="deck-ligne"
              style={{ '--cran': teinteDuCran(carte.rarete) } as React.CSSProperties}
              title={`${enTitre(carte.nom)} : glissez-la hors du deck pour la retirer`}
              onClick={() => taper(carte, v)}
              onPointerDown={(e) => toucher(e, carte, v, 'deck')}
              onPointerMove={bougerAppui}
              onPointerUp={lacherAppui}
              onPointerCancel={lacherAppui}
              onContextMenu={(e) => e.preventDefault()}
            >
              <img draggable={false} className="deck-ligne-image" src={`${import.meta.env.BASE_URL}${carte.image}?v=${encodeURIComponent(__BUILD_TIME__)}`} alt="" loading="lazy" />
              <span className="deck-ligne-texte">
                <span className="deck-ligne-nom">{enTitre(carte.nom)}</span>
                {/* LA RARETÉ NE S'ÉCRIT PAS (Keko) : la couleur du liseré la dit. Restent
                    les bonus, en PASTILLES comme sur les vignettes (Keko : « holo dans
                    le même style que la collection, pastille multicolore »). */}
                {(holo || anime) && (
                  <span className="deck-ligne-bonus">
                    {holo && <span className="pastille-holo">Holo</span>}
                    {anime && <span className="pastille-anime">Animé</span>}
                  </span>
                )}
              </span>
            </button>
          )
        })}
      </div>
    </aside>
    ) : null

  return (
    <div className={`collection${modeDeck ? ' collection-avec-deck' : ''}`}>
      <div className="collection-defile">
        <header className="collection-tete">
          {/* L'ÉDITEUR D'UN DECK, SANS ONGLETS (Keko : on y entre par son étui) :
              le retour aux étuis et, en face, le crayon puis la corbeille ; le
              nom du deck en titre, qu'on renomme ici — Keko : « on n'a plus les
              autres decks dans cet écran », la tête de la colonne n'a plus à le porter. */}
          {deck !== undefined && (
            <div className="deck-entete">
              <button type="button" className="deck-retour" onClick={deck.onRetour}>
                ‹ Mes decks
              </button>
              <div className="deck-entete-actions">
                {/* LE CRAYON À GAUCHE DE LA CORBEILLE (Keko) : le titre devient un champ. */}
                <button type="button" className="deck-icone" aria-label="Renommer le deck" data-bulle="Renommer" onClick={() => setRenomme(true)}>
                  <svg viewBox="0 0 24 24" aria-hidden fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 20h4L19 9l-4-4L4 16v4z" />
                    <path d="M13.5 6.5l4 4" />
                  </svg>
                </button>
                {/* SUPPRIMER LE DECK, UNE CORBEILLE (Keko), d'une seconde tape : la
                    première la passe au rouge ; jamais le dernier. */}
                {deck.decks.length > 1 && (
                  <button
                    type="button"
                    className={`deck-icone deck-icone-supprimer${sur ? ' deck-supprimer-sur' : ''}`}
                    aria-label={sur ? 'Confirmer la suppression du deck' : 'Supprimer le deck'}
                    data-bulle={sur ? 'Sûr ? Supprimer' : 'Supprimer'}
                    onClick={() => {
                      if (!sur) setSur(true)
                      else {
                        setSur(false)
                        deck.onSupprimer()
                      }
                    }}
                  >
                    <svg viewBox="0 0 24 24" aria-hidden fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 7h16" />
                      <path d="M9 7V4.5h6V7" />
                      <path d="M6 7l1 13h10l1-13" />
                      <path d="M10 11v5.5M14 11v5.5" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          )}
          {deck === undefined ? (
            <h1 className="collection-titre">{toutes ? 'Toutes les cartes' : 'Ma collection'}</h1>
          ) : (
            <div className="deck-titre">
              {/* LE NOM DEVIENT UN CHAMP sous le crayon ; Entrée ou une tape
                  ailleurs le garde, Échap l'abandonne, vide il redevient « Deck N ». */}
              {renomme ? (
                <input
                  className="collection-titre deck-titre-champ"
                  type="text"
                  autoFocus
                  defaultValue={deck.decks[deck.edite]?.nomDonne ?? ''}
                  placeholder={`Deck ${deck.edite + 1}`}
                  maxLength={NOM_DECK_MAX}
                  aria-label="Nom du deck"
                  enterKeyHint="done"
                  onFocus={(e) => e.currentTarget.select()}
                  onBlur={(e) => {
                    if (renomme) deck.onRenommer(e.currentTarget.value)
                    setRenomme(false)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') e.currentTarget.blur()
                    if (e.key === 'Escape') {
                      e.currentTarget.value = deck.decks[deck.edite]?.nomDonne ?? ''
                      e.currentTarget.blur()
                    }
                  }}
                />
              ) : (
                <h1 className="collection-titre">{deck.decks[deck.edite]?.nom ?? `Deck ${deck.edite + 1}`}</h1>
              )}
            </div>
          )}
          <p className="collection-compte">
            {deck !== undefined ? (
              <>
                <b>{deck.nombre}</b> / {deck.taille} cartes ·{' '}
                {deck.nombre >= deck.taille
                  ? deck.edite === deck.actif
                    ? 'complet'
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
          {/* PLUS D'ACTIONS ICI (Keko) : « Jouer avec ce deck » vit dans la page
              « Jouer », « Supprimer » en tête de la colonne du deck. */}
        </header>

        {/* AU DOIGT EN PORTRAIT, LE BANDEAU DU DECK : sous la jauge, au-dessus de
            la recherche (Keko). */}
        {enBandeau && colonneDuDeck}
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
              {modeDeck && (
                <button
                  type="button"
                  className={`bouton-filtres${sansAttribuees ? ' actif' : ''}`}
                  aria-pressed={sansAttribuees}
                  aria-label="Masquer les cartes attribuées"
                  data-bulle="Masquer les cartes attribuées"
                  onClick={() => setSansAttribuees((n) => !n)}
                >
                  {/* UN ŒIL, BARRÉ QUAND C'EST COCHÉ (Keko) : les cartes attribuées sont masquées. */}
                  <svg viewBox="0 0 24 24" aria-hidden fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2.5 12s3.5-6.5 9.5-6.5 9.5 6.5 9.5 6.5-3.5 6.5-9.5 6.5S2.5 12 2.5 12z" />
                    <circle cx="12" cy="12" r="2.8" />
                    {sansAttribuees && <path d="M4 20 20 4" />}
                  </svg>
                </button>
              )}
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
            <p>Votre collection est vide.</p>
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
                onOuvrir={() => (deck === undefined ? ouvrir({ id: carte.id, v }) : taper(carte, v))}
                onSaisir={deck === undefined ? undefined : (e) => toucher(e, carte, v, 'collection')}
                onBouger={deck === undefined ? undefined : bougerAppui}
                onLacher={deck === undefined ? undefined : lacherAppui}
              />
            ))}
          </div>
        )}
      </div>
      {!enBandeau && colonneDuDeck}
      {aPrendre !== null &&
        deck !== undefined &&
        createPortal(
          <div className="prendre-voile" onClick={() => setAPrendre(null)}>
            <div className="prendre" role="alertdialog" aria-modal="true" aria-labelledby="prendre-question" onClick={(e) => e.stopPropagation()}>
              <img
                draggable={false}
                className="prendre-image"
                style={{ '--cran': teinteDuCran(aPrendre.carte.rarete) } as React.CSSProperties}
                src={`${import.meta.env.BASE_URL}${aPrendre.carte.image}?v=${encodeURIComponent(__BUILD_TIME__)}`}
                alt=""
              />
              <p id="prendre-question" className="prendre-question">
                Prendre <b>{enTitre(aPrendre.carte.nom)}</b> à <b>{aPrendre.prisPar}</b> ?
              </p>
              <p className="prendre-detail">Elle quittera {aPrendre.prisPar}.</p>
              <div className="prendre-boutons">
                <button type="button" className="prendre-annuler" onClick={() => setAPrendre(null)}>
                  Annuler
                </button>
                <button
                  type="button"
                  className="collection-bouton prendre-oui"
                  autoFocus
                  onClick={() => {
                    deck.onBasculer({ id: aPrendre.carte.id, v: aPrendre.v })
                    setAPrendre(null)
                  }}
                >
                  Prendre
                </button>
              </div>
            </div>
          </div>,
          document.body,
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
            onFermer={() => setOuverte(null)}
            onFusionner={() => {
              const id = laOuverte.carte.id
              // LA VERSION QU'ON REGARDAIT A PU PARTIR À LA FUSION : on montre
              // alors celle qui reste, la plus belle (voir `exemplaireAFusionner`).
              const reste = fusionner(collection, id).cartes[id]
              if (reste !== undefined && compteDe(reste, laOuverte.v) === 0) {
                const v = [...VARIANTES].reverse().find((x) => compteDe(reste, x) > 0)
                if (v !== undefined) setOuverte({ id, v })
              }
              onFusionner(id)
            }}
          />,
          document.body,
        )}
    </div>
  )
}

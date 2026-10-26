/**
 * L'ALBUM — LÀ OÙ L'ON COLLE SES STICKERS, ET OÙ L'ON VOIT OÙ L'ON EN EST.
 *
 * Keko : « dans l'onglet sticker de la barre, on ait collection (ce qu'on a
 * actuellement) et album (où on les colle). Et que l'album permette d'avoir
 * une représentation visuelle de "où j'en suis dans ma progression" sur chaque
 * perso, tout en ayant un côté juicy de placement des stickers. »
 *
 * Tranché avec lui :
 * - **un livre à pages**, qu'on feuillette d'un balayage : une suite de pages
 *   par race et par cran, six personnages par page (`pagesDe`) ;
 * - **des emplacements à remplir** : chaque case montre le personnage — en
 *   silhouette tant qu'aucun sticker n'y est collé — et ses quatorze
 *   emplacements, une rangée par niveau à gagner (2, 3, 4, 5), terminée par
 *   l'étoile qu'elle allume. *Chaque sticker collé y reste*, un peu de travers ;
 * - **on glisse le sticker depuis le ruban** du bas (le geste qui colle déjà
 *   sur les cartes, `CaseDuSticker`) jusqu'à son personnage : il y vole, se
 *   plaque en s'écrasant, et le passage de niveau fait pulser la case,
 *   s'allumer l'étoile et jaillir une gerbe.
 *
 * La règle est celle de `ameliorer` : un sticker de la version qu'on tient
 * quitte la collection des stickers et remplit la jauge du personnage.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { SON_EQUIPER, SON_POSER, SON_PRENDRE, SON_RETOURNER, jouerSon } from './sons.ts'
import { CaseDuSticker, teinteDuCran } from './Collection.tsx'
import { NOM_DE_LA_RACE, RACES, RARETES_EMOJI, type CarteEmoji, type RaceCarte, type RareteEmoji } from '../logic/emoji/types.ts'
import type { Collection, Niveau, Variante } from '../logic/emoji/collection.ts'
import { NIVEAUX, VARIANTES, compteDe, coutDuNiveau, niveauDe, stickersPoses } from '../logic/emoji/collection.ts'
import { stickerPeint } from './peinture-vignette.ts'
import { enTitre } from './carte-emoji.ts'

/** Six personnages par page : deux colonnes, trois rangées — un téléphone en portrait. */
const PAR_PAGE = 6

const CRANS_AU_PLURIEL: Readonly<Record<RareteEmoji, string>> = {
  commun: 'Communs',
  'peu-commun': 'Peu communs',
  rare: 'Rares',
  epique: 'Épiques',
  legendaire: 'Légendaires',
}

interface PageDAlbum {
  readonly race: RaceCarte
  readonly rarete: RareteEmoji
  readonly cartes: readonly CarteEmoji[]
  /** La page dans sa suite (race et cran), et combien la suite en compte. */
  readonly rang: number
  readonly sur: number
}

/** LES PAGES DU LIVRE : race par race, cran par cran, dans l'ordre du catalogue. */
function pagesDe(catalogue: readonly CarteEmoji[]): PageDAlbum[] {
  const pages: PageDAlbum[] = []
  for (const race of RACES) {
    for (const rarete of RARETES_EMOJI) {
      const l = catalogue.filter((c) => c.race === race && c.rarete === rarete).sort((a, b) => a.rang - b.rang)
      const sur = Math.ceil(l.length / PAR_PAGE)
      for (let i = 0; i < sur; i++) pages.push({ race, rarete, cartes: l.slice(i * PAR_PAGE, (i + 1) * PAR_PAGE), rang: i + 1, sur })
    }
  }
  return pages
}

/** Ce qu'on peut encore coller sur ce personnage : ses stickers, s'il n'est pas au dernier niveau. */
function aColler(col: Collection, id: string): number {
  return coutDuNiveau(niveauDe(col, id).niveau) === null ? 0 : (col.stickers[id]?.n ?? 0)
}

/**
 * L'IMAGE DU STICKER POUR LES EMPLACEMENTS ET LE PORTRAIT : le sticker peint
 * de l'album (`stickerPeint`), gardé en une URL — une case en montre jusqu'à
 * quinze à la fois, une toile chacune serait quinze copies.
 */
const IMAGES = new Map<string, Promise<string | null>>()
function imageDuSticker(c: CarteEmoji): Promise<string | null> {
  let p = IMAGES.get(c.id)
  if (p === undefined) {
    p = stickerPeint(c, false).then((t) => (t === null ? null : t.toDataURL('image/webp', 0.92)))
    IMAGES.set(c.id, p)
  }
  return p
}
function useImageDuSticker(c: CarteEmoji): string | null {
  const [url, setUrl] = useState<string | null>(null)
  useEffect(() => {
    let vivant = true
    void imageDuSticker(c).then((u) => {
      if (vivant) setUrl(u)
    })
    return () => {
      vivant = false
    }
  }, [c])
  return url
}

/** Le penchant d'un sticker collé, tiré de son personnage et de sa place : le même à chaque visite. */
function penchant(id: string, i: number): number {
  let h = 2166136261
  for (const ch of `${id}#${i}`) h = Math.imul(h ^ ch.charCodeAt(0), 16777619)
  return ((h >>> 0) % 2401) / 100 - 12
}

/**
 * DEUX LIGNES D'EMPLACEMENTS : les niveaux 2 et 3, puis 4 et 5, chacun fini par
 * son étoile. *Une ligne par niveau prenait la moitié de la case*, et le
 * personnage n'y tenait plus qu'en vignette.
 */
const RANGEES: readonly (readonly number[])[] = [
  [0, 1],
  [2, 3],
]

/** Où commence chaque palier (un niveau) dans la suite des emplacements. */
const DEBUTS = NIVEAUX.couts.map((_, r) => NIVEAUX.couts.slice(0, r).reduce((t, c) => t + c, 0))

/** Ce que fait le sticker tenu au-dessus d'une case : rien, l'appeler, s'y poser, ou être refusé. */
type Cible = 'aucune' | 'attend' | 'dessus' | 'refus'

/** LE DERNIER COLLAGE, pour rejouer ses animations : quel emplacement, et si le niveau a monté. */
interface Effet {
  readonly id: string
  readonly emplacement: number
  readonly monte: boolean
  readonly n: number
}

/** LA GERBE DU PASSAGE DE NIVEAU : des éclats d'or lancés en couronne. */
function Gerbe(): React.ReactElement {
  return (
    <span className="album-gerbe" aria-hidden>
      {Array.from({ length: 14 }, (_, i) => {
        const a = (i / 14) * Math.PI * 2 + (i % 2) * 0.2
        const d = 3.2 + (i % 3) * 0.9
        return (
          <i
            key={i}
            style={{ '--dx': `${(Math.cos(a) * d).toFixed(2)}rem`, '--dy': `${(Math.sin(a) * d).toFixed(2)}rem`, animationDelay: `${(i % 4) * 25}ms` } as React.CSSProperties}
          />
        )
      })}
    </span>
  )
}

/**
 * UNE CASE DE L'ALBUM : le personnage, son nom, et ses rangées d'emplacements.
 * `data-album-id` : c'est par lui que le lâcher retrouve la case sous le doigt.
 */
function CaseDuPersonnage({ carte, niveau, cible, effet }: { carte: CarteEmoji; niveau: Niveau; cible: Cible; effet: Effet | null }): React.ReactElement {
  const image = useImageDuSticker(carte)
  const poses = stickersPoses(niveau)
  const max = coutDuNiveau(niveau.niveau) === null
  const classes = [
    'album-perso',
    poses > 0 ? 'album-perso-commence' : '',
    max ? 'album-perso-max' : '',
    cible !== 'aucune' ? `album-perso-${cible}` : '',
  ].filter((c) => c !== '')
  return (
    <div className={classes.join(' ')} data-album-id={carte.id} style={{ '--cran': teinteDuCran(carte.rarete) } as React.CSSProperties}>
      {/* LE PORTRAIT REBONDIT À CHAQUE STICKER POSÉ : la clé le remonte. */}
      <div key={effet === null ? 'repos' : `e${effet.n}`} className={`album-portrait${effet === null ? '' : effet.monte ? ' album-portrait-monte' : ' album-portrait-tape'}`}>
        {image !== null && <img src={image} alt="" draggable={false} />}
        {max && <span className="album-max">Max</span>}
      </div>
      <p className="album-nom">{enTitre(carte.nom)}</p>
      <div className="album-niveaux" aria-label={`Niveau ${niveau.niveau}, ${poses} sticker${poses > 1 ? 's' : ''} collé${poses > 1 ? 's' : ''}`}>
        {RANGEES.map((niveaux, ligne) => (
          <div key={ligne} className="album-rangee">
            {niveaux.map((r) => {
              const gagne = niveau.niveau >= r + 2
              const pop = effet !== null && effet.monte && niveau.niveau === r + 2
              return (
                <span key={r} className={`album-palier${gagne ? ' album-palier-fait' : ''}`}>
                  {Array.from({ length: NIVEAUX.couts[r]! }, (_, k) => {
                    const i = DEBUTS[r]! + k
                    const plein = i < poses
                    const colle = effet !== null && effet.emplacement === i
                    return (
                      <span
                        key={colle ? `c${effet.n}` : k}
                        className={`album-emplacement${plein ? ' plein' : ''}${colle ? ' colle' : ''}`}
                        style={{ '--a': `${penchant(carte.id, i).toFixed(1)}deg` } as React.CSSProperties}
                      >
                        {plein && image !== null && <img src={image} alt="" draggable={false} />}
                      </span>
                    )
                  })}
                  <span key={pop ? `p${effet.n}` : 'e'} className={`album-etoile${gagne ? ' allumee' : ''}${pop ? ' pop' : ''}`} aria-hidden>
                    ★
                  </span>
                </span>
              )
            })}
          </div>
        ))}
      </div>
      {effet !== null && effet.monte && (
        <>
          <Gerbe key={`g${effet.n}`} />
          <span key={`m${effet.n}`} className="album-monte">
            Niveau {niveau.niveau}
          </span>
        </>
      )}
    </div>
  )
}

/** La page où l'on était, gardée le temps de la session : revenir à l'album rouvre la même. */
let pageGardee: number | null = null

export function PageAlbum({
  catalogue,
  collection,
  ouvrirSur,
  onAmeliorer,
  onStickers,
}: {
  catalogue: readonly CarteEmoji[] | null
  collection: Collection
  /** Le personnage dont on veut la page (depuis un sticker ouvert), ou rien. */
  ouvrirSur: string | null
  /** Colle un sticker de cette version sur son personnage (voir `ameliorer`). */
  onAmeliorer: (id: string, v: Variante) => void
  /** Aller voir sa collection de stickers. */
  onStickers: () => void
}): React.ReactElement {
  const pages = useMemo(() => pagesDe(catalogue ?? []), [catalogue])
  const refCollection = useRef(collection)
  refCollection.current = collection
  /** LA PAGE OUVERTE, et le sens où l'on vient de tourner (pour l'animation). */
  const [vue, setVue] = useState<{ i: number; sens: 'avant' | 'arriere' | null }>({ i: 0, sens: null })
  // À L'ARRIVÉE : la page du personnage demandé, sinon celle où l'on était,
  // sinon la première qui a un sticker à coller.
  const posee = useRef(false)
  useEffect(() => {
    if (posee.current || pages.length === 0) return
    posee.current = true
    const voulue = ouvrirSur === null ? -1 : pages.findIndex((p) => p.cartes.some((c) => c.id === ouvrirSur))
    const aFaire = pages.findIndex((p) => p.cartes.some((c) => aColler(refCollection.current, c.id) > 0))
    const i = voulue >= 0 ? voulue : pageGardee !== null && pageGardee < pages.length ? pageGardee : Math.max(0, aFaire)
    setVue({ i, sens: null })
  }, [pages, ouvrirSur])
  useEffect(() => {
    pageGardee = vue.i
  }, [vue.i])
  const tourner = useCallback(
    (vers: number) => {
      setVue((v) => {
        const i = Math.max(0, Math.min(pages.length - 1, vers))
        if (i === v.i) return v
        jouerSon(SON_RETOURNER, 0.45)
        return { i, sens: i > v.i ? 'avant' : 'arriere' }
      })
    },
    [pages.length],
  )
  const page = pages[vue.i]

  // LES FLÈCHES DU CLAVIER tournent les pages, sur PC.
  useEffect(() => {
    const touche = (e: KeyboardEvent): void => {
      if (e.key === 'ArrowRight') tourner(vue.i + 1)
      else if (e.key === 'ArrowLeft') tourner(vue.i - 1)
    }
    addEventListener('keydown', touche)
    return () => removeEventListener('keydown', touche)
  }, [tourner, vue.i])

  /** UN BALAYAGE SUR LA PAGE LA TOURNE : horizontal, et assez long pour ne pas être une tape. */
  const balayage = useRef<{ x: number; y: number; id: number } | null>(null)

  // Y A-T-IL ENCORE À COLLER DANS CE SENS ? Un point sur la flèche le dit.
  const aCollerSur = (p: PageDAlbum): boolean => p.cartes.some((c) => aColler(collection, c.id) > 0)
  const avant = pages.slice(vue.i + 1).some(aCollerSur)
  const arriere = pages.slice(0, vue.i).some(aCollerSur)

  /** LE RUBAN : les stickers des personnages de la page qu'on peut encore coller, une case par version. */
  const ruban = useMemo(
    () =>
      (page?.cartes ?? []).flatMap((carte) => {
        const s = collection.stickers[carte.id]
        if (s === undefined || aColler(collection, carte.id) === 0) return []
        return VARIANTES.filter((v) => compteDe(s, v) > 0).map((v) => ({ carte, v, n: compteDe(s, v) }))
      }),
    [page, collection],
  )

  /**
   * LE STICKER TENU, du ruban jusqu'au lâcher, puis pendant son vol vers son
   * emplacement (ou son retour au ruban). Il suit le doigt dans le DOM, pas
   * dans l'état : une valeur par image ne doit pas rendre la page.
   */
  const [tenu, setTenu] = useState<{ id: string; v: Variante; image: HTMLCanvasElement; depart: DOMRect } | null>(null)
  const refTenu = useRef(tenu)
  refTenu.current = tenu
  const enVol = useRef(false)
  const flottant = useRef<HTMLCanvasElement>(null)
  const [survol, setSurvol] = useState<string | null>(null)
  const refSurvol = useRef<string | null>(null)
  const [effet, setEffet] = useState<Effet | null>(null)
  const compteur = useRef(0)
  // LE STICKER PRIS SE PEINT DANS LA TOILE QUI SUIT LE DOIGT.
  useEffect(() => {
    const el = flottant.current
    const ctx = el?.getContext('2d')
    if (tenu === null || el == null || ctx == null) return
    el.width = tenu.image.width
    el.height = tenu.image.height
    ctx.drawImage(tenu.image, 0, 0)
  }, [tenu])
  const suivre = (x: number, y: number): void => {
    const el = flottant.current
    if (el === null) return
    el.style.left = `${x.toFixed(1)}px`
    el.style.top = `${y.toFixed(1)}px`
  }
  const sousLeDoigt = (x: number, y: number): string | null => {
    const el = document.elementFromPoint(x, y)
    const c = el instanceof Element ? el.closest('[data-album-id]') : null
    return c?.getAttribute('data-album-id') ?? null
  }
  const prendre = (id: string, v: Variante, image: HTMLCanvasElement, e: React.PointerEvent): void => {
    if (enVol.current) return
    jouerSon(SON_PRENDRE, 0.5)
    setTenu({ id, v, image, depart: e.currentTarget.getBoundingClientRect() })
    // Peint au prochain rendu ; placé tout de suite.
    requestAnimationFrame(() => suivre(e.clientX, e.clientY))
    suivre(e.clientX, e.clientY)
  }
  const deplacer = (e: React.PointerEvent): void => {
    if (enVol.current || refTenu.current === null) return
    suivre(e.clientX, e.clientY)
    const id = sousLeDoigt(e.clientX, e.clientY)
    if (id !== refSurvol.current) {
      refSurvol.current = id
      setSurvol(id)
    }
  }
  /** LE STICKER VOLE de là où il est vers un rectangle, en prenant sa taille, puis `fin`. */
  const voler = (vers: DOMRect, opacite: number, duree: number, fin: () => void): void => {
    const el = flottant.current
    if (el === null) return fin()
    enVol.current = true
    const b = el.getBoundingClientRect()
    const anim = el.animate(
      [
        { left: el.style.left, top: el.style.top, width: `${b.width}px`, opacity: 1 },
        { left: `${vers.left + vers.width / 2}px`, top: `${vers.top + vers.height / 2}px`, width: `${vers.width}px`, opacity: opacite },
      ],
      { duration: duree, easing: 'cubic-bezier(0.5, 0, 0.75, 0.35)', fill: 'forwards' },
    )
    anim.onfinish = () => {
      enVol.current = false
      fin()
    }
  }
  const lacher = (e: React.PointerEvent): void => {
    const t = refTenu.current
    if (t === null || enVol.current) return
    refSurvol.current = null
    setSurvol(null)
    const id = sousLeDoigt(e.clientX, e.clientY)
    const col = refCollection.current
    const avantN = niveauDe(col, t.id)
    const cout = coutDuNiveau(avantN.niveau)
    const vide = id === t.id && cout !== null ? document.querySelector(`[data-album-id="${t.id}"] .album-emplacement:not(.plein)`) : null
    if (vide === null) {
      // REFUSÉ, OU LÂCHÉ AILLEURS : il retourne au ruban en s'effaçant.
      voler(t.depart, 0, 220, () => setTenu(null))
      return
    }
    // IL VOLE VERS SON EMPLACEMENT, et s'y plaque.
    voler(vide.getBoundingClientRect(), 1, 200, () => {
      const monte = avantN.poses + 1 >= cout!
      compteur.current += 1
      setEffet({ id: t.id, emplacement: stickersPoses(avantN), monte, n: compteur.current })
      onAmeliorer(t.id, t.v)
      setTenu(null)
      jouerSon(SON_POSER, 0.8)
      if (monte) jouerSon(SON_EQUIPER, 0.8, 0.12)
      navigator.vibrate?.(monte ? [18, 40, 30] : 12)
    })
  }

  if (catalogue === null || page === undefined) return <div className="collection album-livre" />
  const totalPoses = catalogue.reduce((t, c) => t + stickersPoses(niveauDe(collection, c.id)), 0)
  const totalMax = catalogue.length * NIVEAUX.couts.reduce((t, c) => t + c, 0)
  const premiereDeLaRace = (r: RaceCarte): number => pages.findIndex((p) => p.race === r)
  return (
    <div className="collection album-livre">
      <div className="album-colonne">
        <header className="album-tete">
          <div className="album-races" role="tablist" aria-label="Races">
            {RACES.map((r) => (
              <button
                key={r}
                type="button"
                role="tab"
                aria-selected={page.race === r}
                className={`album-race${page.race === r ? ' actif' : ''}`}
                onClick={() => tourner(premiereDeLaRace(r))}
              >
                {NOM_DE_LA_RACE[r]}s
              </button>
            ))}
            <span className="album-total">
              <b>{totalPoses}</b> / {totalMax} collés
            </span>
          </div>
          <div className="album-pagination">
            <button type="button" className="album-fleche" aria-label="Page précédente" disabled={vue.i === 0} onClick={() => tourner(vue.i - 1)}>
              ‹{arriere && <i className="album-fleche-point" />}
            </button>
            <p className="album-page-titre" style={{ '--cran': teinteDuCran(page.rarete) } as React.CSSProperties}>
              <i />
              {CRANS_AU_PLURIEL[page.rarete]}
              {page.sur > 1 && (
                <span className="album-page-rang">
                  {' '}
                  {page.rang}/{page.sur}
                </span>
              )}
            </p>
            <button type="button" className="album-fleche" aria-label="Page suivante" disabled={vue.i === pages.length - 1} onClick={() => tourner(vue.i + 1)}>
              ›{avant && <i className="album-fleche-point" />}
            </button>
          </div>
        </header>
        <div
          className="album-feuille-place"
          onPointerDown={(e) => {
            if (tenu !== null) return
            balayage.current = { x: e.clientX, y: e.clientY, id: e.pointerId }
          }}
          onPointerUp={(e) => {
            const b = balayage.current
            balayage.current = null
            if (b === null || b.id !== e.pointerId) return
            const dx = e.clientX - b.x
            const dy = e.clientY - b.y
            if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.3) tourner(vue.i + (dx < 0 ? 1 : -1))
          }}
          onPointerCancel={() => {
            balayage.current = null
          }}
        >
          <div key={vue.i} className={`album-feuille${vue.sens === null ? '' : ` album-entre-${vue.sens}`}`}>
            {page.cartes.map((carte) => (
              <CaseDuPersonnage
                key={carte.id}
                carte={carte}
                niveau={niveauDe(collection, carte.id)}
                cible={tenu === null ? 'aucune' : tenu.id === carte.id ? (survol === carte.id ? 'dessus' : 'attend') : survol === carte.id ? 'refus' : 'aucune'}
                effet={effet !== null && effet.id === carte.id ? effet : null}
              />
            ))}
          </div>
          <p className="album-folio" aria-hidden>
            {vue.i + 1}
          </p>
        </div>
        <div className="album-ruban-place">
          {ruban.length > 0 ? (
            <>
              <p className="album-ruban-titre">Glisse un sticker sur son personnage</p>
              <div className="coller-ruban">
                {ruban.map((e) => (
                  <CaseDuSticker
                    key={`${e.carte.id}#${e.v}`}
                    entree={e}
                    onPrendre={(image, ev) => prendre(e.carte.id, e.v, image, ev)}
                    onSuivre={deplacer}
                    onLacher={lacher}
                  />
                ))}
              </div>
            </>
          ) : (
            <p className="album-ruban-vide">
              Aucun sticker à coller sur cette page.{' '}
              {avant || arriere ? (
                <span>Le point sur une flèche montre où il y en a.</span>
              ) : (
                <button type="button" className="album-lien" onClick={onStickers}>
                  Voir mes stickers
                </button>
              )}
            </p>
          )}
        </div>
      </div>
      {tenu !== null && <canvas ref={flottant} className="sticker-flottant album-flottant" />}
    </div>
  )
}

/**
 * L'ALBUM DES STICKERS — ce qu'on a gagné en décollant ses cartes.
 *
 * Keko : « l'option de la détruire pour gagner son sticker ». Tranché avec lui :
 * **une page à part**, la troisième entrée de la barre. *Un sticker n'est pas
 * une carte* : pas de cadre, pas de cran, pas de plaque — l'emoji et son cerne,
 * celui qu'on a tiré de la carte (`stickerDe`, le même peintre).
 *
 * **Il garde le bonus de la carte d'où il vient** : le cerne arc-en-ciel pour
 * une holo, l'animation pour une animée — et l'animation ne joue que quand le
 * sticker est à l'écran.
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { SON_POSER, jouerSon } from './sons.ts'
import { teinteDuCran } from './Collection.tsx'
import type { CarteEmoji } from '../logic/emoji/types.ts'
import type { Collection, Stickers } from '../logic/emoji/collection.ts'
import { nombreDeStickers } from '../logic/emoji/collection.ts'
import { stickerDe } from './texture-carte.ts'
import { cerneArcEnCiel } from './peinture-vignette.ts'
import { animationDeLEmoji, urlAnimationEmoji } from './emoji-anime.ts'
import { enTitre } from './carte-emoji.ts'
import { urlEmojiDeKeko } from '../ui/art.ts'
import { SATURATION_APLAT } from './Carte3D.tsx'

type Tri = 'recents' | 'az' | 'rares'

const TRIS: readonly { id: Tri; nom: string }[] = [
  { id: 'recents', nom: 'Récents' },
  { id: 'az', nom: 'A → Z' },
  { id: 'rares', nom: 'Plus rares' },
]

/** La toile d'un sticker, à 256 : *une case d'album n'en montre pas plus.* */
const COTE = 256
const PEINTS = new Map<string, Promise<HTMLCanvasElement | null>>()

function stickerPeint(c: CarteEmoji, holo: boolean): Promise<HTMLCanvasElement | null> {
  const cle = `${c.id}${holo ? '#holo' : ''}`
  const deja = PEINTS.get(cle)
  if (deja !== undefined) return deja
  const p = stickerDe(c.emoji, urlEmojiDeKeko(c.id) ?? undefined).then((image) => {
    if (image === null) return null
    const toile = document.createElement('canvas')
    toile.width = COTE
    toile.height = COTE
    const ctx = toile.getContext('2d', { willReadFrequently: holo })
    if (ctx === null) return null
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(image, 0, 0, COTE, COTE)
    if (holo) cerneArcEnCiel(toile, { x: 0, y: 0, l: 1, h: 1 })
    return toile
  })
  PEINTS.set(cle, p)
  p.then(
    (t) => t === null && PEINTS.delete(cle),
    () => PEINTS.delete(cle),
  )
  return p
}

const FILTRE: React.CSSProperties = {
  filter: `saturate(${1 + SATURATION_APLAT}) drop-shadow(0 0.3rem 0.35rem rgba(10, 4, 30, 0.5))`,
}

function CaseSticker({
  carte,
  stickers,
  onOuvrir,
}: {
  carte: CarteEmoji
  stickers: Stickers
  onOuvrir: () => void
}): React.ReactElement {
  const boite = useRef<HTMLButtonElement>(null)
  const toile = useRef<HTMLCanvasElement>(null)
  const [visible, setVisible] = useState(false)
  const [pret, setPret] = useState(false)
  const holo = stickers.holo > 0
  const anime = stickers.anime > 0 && carte.animable
  useEffect(() => {
    const el = boite.current
    if (el === null) return
    const obs = new IntersectionObserver((e) => setVisible(e.some((x) => x.isIntersecting)), {
      rootMargin: '200px 0px',
    })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  // L'IMAGE FIXE, peinte une fois quand la case approche.
  useEffect(() => {
    if (!visible || pret) return
    let vivant = true
    void stickerPeint(carte, holo).then((source) => {
      const t = toile.current
      const ctx = t?.getContext('2d')
      if (!vivant || source === null || t == null || ctx == null) return
      t.width = COTE
      t.height = COTE
      ctx.drawImage(source, 0, 0)
      setPret(true)
    })
    return () => {
      vivant = false
    }
  }, [visible, pret, carte, holo])
  // L'ANIMATION, SEULEMENT À L'ÉCRAN : ses images sont déjà des stickers.
  useEffect(() => {
    if (!visible || !anime) return
    let vivant = true
    let image = 0
    void animationDeLEmoji(urlAnimationEmoji(carte.id)).then((a) => {
      if (!vivant || a === null) return
      const depart = performance.now()
      let montre = false
      const pas = (t: number): void => {
        const c = toile.current
        const ctx = c?.getContext('2d')
        if (c == null || ctx == null) return
        const i = Math.floor((((t - depart) % a.duree) / a.duree) * a.images.length)
        ctx.clearRect(0, 0, c.width, c.height)
        ctx.drawImage(a.images[i]!, 0, 0, c.width, c.height)
        if (!montre) {
          montre = true
          setPret(true)
        }
        image = requestAnimationFrame(pas)
      }
      image = requestAnimationFrame(pas)
    })
    return () => {
      vivant = false
      cancelAnimationFrame(image)
    }
  }, [visible, anime, carte.id])
  return (
    <button
      ref={boite}
      type="button"
      className={`album-case${pret ? ' album-pret' : ''}`}
      aria-label={`${enTitre(carte.nom)}, ${stickers.n} sticker${stickers.n > 1 ? 's' : ''}`}
      onClick={onOuvrir}
    >
      <span className="album-sticker">
        {!pret && <span className="album-attente">{carte.emoji}</span>}
        <canvas ref={toile} className="album-toile" style={FILTRE} />
      </span>
      {stickers.n > 1 && <span className="vignette-nombre">×{stickers.n}</span>}
      {(holo || stickers.anime > 0) && (
        <span className="vignette-bonus">
          {holo && <span className="pastille-holo">Holo</span>}
          {stickers.anime > 0 && <span className="pastille-anime">Animé</span>}
        </span>
      )}
    </button>
  )
}

const DATE = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })

/**
 * LE STICKER EN GRAND. Keko : « pourquoi on peut pas zoomer sur les stickers
 * dans la collection ? » *Un sticker n'est pas une carte* : pas de pavé 3D,
 * mais la même toile en grand, qui penche sous le doigt (une perspective CSS,
 * la carte ouverte en fait autant en 3D), flotte doucement quand on la laisse,
 * et dont la holo fait passer un reflet. **Le même habillage que la carte
 * ouverte** — le fond, la croix, les lignes du dessous — et une tape à côté
 * le repose.
 */
function StickerOuvert({
  carte,
  stickers,
  onFermer,
}: {
  carte: CarteEmoji
  stickers: Stickers
  onFermer: () => void
}): React.ReactElement {
  const toile = useRef<HTMLCanvasElement>(null)
  const penche = useRef<HTMLDivElement>(null)
  const zone = useRef<HTMLDivElement>(null)
  const [pret, setPret] = useState(false)
  const holo = stickers.holo > 0
  const anime = stickers.anime > 0 && carte.animable
  const refFermer = useRef(onFermer)
  refFermer.current = onFermer
  useEffect(() => {
    jouerSon(SON_POSER, 0.6)
  }, [])
  // L'IMAGE FIXE, À LA TAILLE D'AFFICHAGE : elle reste là si l'animation manque.
  useEffect(() => {
    let vivant = true
    void stickerDe(carte.emoji, urlEmojiDeKeko(carte.id) ?? undefined).then((image) => {
      const t = toile.current
      const ctx = t?.getContext('2d', { willReadFrequently: holo })
      if (!vivant || image === null || t == null || ctx == null) return
      const cote = Math.round(t.getBoundingClientRect().width * Math.min(window.devicePixelRatio || 1, 2))
      t.width = cote
      t.height = cote
      ctx.imageSmoothingQuality = 'high'
      ctx.drawImage(image, 0, 0, cote, cote)
      if (holo) cerneArcEnCiel(t, { x: 0, y: 0, l: 1, h: 1 })
      setPret(true)
    })
    return () => {
      vivant = false
    }
  }, [carte, holo])
  useEffect(() => {
    if (!anime) return
    let vivant = true
    let image = 0
    void animationDeLEmoji(urlAnimationEmoji(carte.id)).then((a) => {
      if (!vivant || a === null) return
      const depart = performance.now()
      const pas = (t: number): void => {
        const c = toile.current
        const ctx = c?.getContext('2d')
        if (c == null || ctx == null) return
        const i = Math.floor((((t - depart) % a.duree) / a.duree) * a.images.length)
        ctx.clearRect(0, 0, c.width, c.height)
        ctx.drawImage(a.images[i]!, 0, 0, c.width, c.height)
        image = requestAnimationFrame(pas)
      }
      image = requestAnimationFrame(pas)
    })
    return () => {
      vivant = false
      cancelAnimationFrame(image)
    }
  }, [anime, carte.id])
  /**
   * IL PENCHE SOUS LE DOIGT, et se redresse quand on le lâche. Écrit dans le
   * DOM, pas dans l'état : une valeur par image ne doit pas rendre la page.
   * Une tape hors du sticker le repose — *au clic*, la règle de la carte
   * ouverte, pour que la tape ne retombe pas sur la case d'en dessous.
   */
  useEffect(() => {
    const arret = new AbortController()
    const { signal } = arret
    const depart = { x: 0, y: 0 }
    let reposer = false
    const viser = (x: number, y: number): void => {
      const el = penche.current
      const b = zone.current?.getBoundingClientRect()
      if (el == null || b === undefined) return
      const nx = Math.max(-1, Math.min(1, (x - (b.left + b.width / 2)) / (b.width / 2)))
      const ny = Math.max(-1, Math.min(1, (y - (b.top + b.height / 2)) / (b.height / 2)))
      el.style.transform = `rotateY(${nx * 18}deg) rotateX(${-ny * 18}deg) scale(1.03)`
    }
    const redresser = (): void => {
      const el = penche.current
      if (el == null) return
      el.style.transform = ''
    }
    addEventListener(
      'pointerdown',
      (e) => {
        depart.x = e.clientX
        depart.y = e.clientY
        if (e.pointerType !== 'mouse') viser(e.clientX, e.clientY)
      },
      { signal },
    )
    addEventListener(
      'pointermove',
      (e) => {
        if (e.pointerType === 'mouse' || e.buttons > 0 || e.pressure > 0) viser(e.clientX, e.clientY)
      },
      { signal },
    )
    addEventListener('pointercancel', redresser, { signal })
    addEventListener(
      'pointerup',
      (e) => {
        if (e.pointerType !== 'mouse') redresser()
        const tape = Math.hypot(e.clientX - depart.x, e.clientY - depart.y) < 12
        const b = zone.current?.getBoundingClientRect()
        const dedans =
          b !== undefined && e.clientX >= b.left && e.clientX <= b.right && e.clientY >= b.top && e.clientY <= b.bottom
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
  const lignes = [
    stickers.n > 1 ? `${stickers.n} stickers` : '1 sticker',
    holo ? `${stickers.holo} holo` : null,
    stickers.anime > 0 ? `${stickers.anime} animé${stickers.anime > 1 ? 's' : ''}` : null,
  ].filter((m): m is string => m !== null)
  return (
    <div className="carte-ouverte sticker-ouvert">
      <div ref={zone} className="sticker-grand">
        <div className="sticker-flotte">
          <div ref={penche} className="sticker-penche">
            {!pret && <span className="album-attente sticker-attente">{carte.emoji}</span>}
            <canvas ref={toile} className="sticker-toile" style={FILTRE} />
          </div>
        </div>
      </div>
      <div className="carte-ouverte-infos">
        <p className="sticker-nom">{enTitre(carte.nom)}</p>
        <span className="carte-ouverte-cran" style={{ '--cran': teinteDuCran(carte.rarete) } as React.CSSProperties}>
          Sticker
        </span>
        <p className="carte-ouverte-ligne">{lignes.join(' · ')}</p>
        <p className="carte-ouverte-ligne carte-ouverte-discret">Dernier gagné le {DATE.format(new Date(stickers.dernier))}</p>
      </div>
      <button type="button" className="carte-ouverte-fermer" aria-label="Fermer" onClick={onFermer}>
        ×
      </button>
    </div>
  )
}

export function PageStickers({
  catalogue,
  collection,
  onCollection,
}: {
  catalogue: readonly CarteEmoji[] | null
  collection: Collection
  onCollection: () => void
}): React.ReactElement {
  const [tri, setTri] = useState<Tri>('recents')
  const [ouvert, setOuvert] = useState<string | null>(null)
  const parId = useMemo(() => new Map((catalogue ?? []).map((c) => [c.id, c])), [catalogue])
  const liste = useMemo(() => {
    const l = Object.entries(collection.stickers)
      .map(([id, s]) => ({ carte: parId.get(id), s }))
      .filter((x): x is { carte: CarteEmoji; s: Stickers } => x.carte !== undefined)
    const az = new Intl.Collator('fr')
    if (tri === 'recents') l.sort((a, b) => b.s.dernier - a.s.dernier)
    else if (tri === 'az') l.sort((a, b) => az.compare(a.carte.nom, b.carte.nom))
    else l.sort((a, b) => a.carte.rang - b.carte.rang)
    return l
  }, [collection.stickers, parId, tri])
  const total = nombreDeStickers(collection)
  const leOuvert = ouvert === null ? undefined : liste.find((x) => x.carte.id === ouvert)
  return (
    <div className="collection album">
      <div className="collection-defile">
        <header className="collection-tete">
          <h1 className="collection-titre">Mes stickers</h1>
          <p className="collection-compte">
            <b>{total}</b> sticker{total > 1 ? 's' : ''} · {liste.length} emoji
          </p>
        </header>
        {catalogue === null ? null : liste.length === 0 ? (
          <div className="collection-vide">
            <p>Ton album est vide.</p>
            <p className="collection-discret">
              Ouvre une carte en grand et tire son sticker pour le décoller : la carte est détruite, le sticker
              arrive ici.
            </p>
            <button type="button" className="collection-bouton" onClick={onCollection}>
              Voir ma collection
            </button>
          </div>
        ) : (
          <>
            <div className="collection-outils">
              <div className="collection-segments" role="radiogroup" aria-label="Trier">
                {TRIS.map((t) => (
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
            </div>
            <div className="album-grille">
              {liste.map(({ carte, s }) => (
                <CaseSticker key={carte.id} carte={carte} stickers={s} onOuvrir={() => setOuvert(carte.id)} />
              ))}
            </div>
          </>
        )}
      </div>
      {leOuvert !== undefined &&
        createPortal(
          <StickerOuvert carte={leOuvert.carte} stickers={leOuvert.s} onFermer={() => setOuvert(null)} />,
          document.body,
        )}
    </div>
  )
}

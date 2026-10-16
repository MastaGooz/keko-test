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

function CaseSticker({ carte, stickers }: { carte: CarteEmoji; stickers: Stickers }): React.ReactElement {
  const boite = useRef<HTMLButtonElement>(null)
  const toile = useRef<HTMLCanvasElement>(null)
  const [visible, setVisible] = useState(false)
  const [pret, setPret] = useState(false)
  const [saut, setSaut] = useState(0)
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
      onClick={() => setSaut((s) => s + 1)}
    >
      <span key={saut} className={`album-sticker${saut > 0 ? ' album-saute' : ''}`}>
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
                <CaseSticker key={carte.id} carte={carte} stickers={s} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

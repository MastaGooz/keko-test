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
import { suivreLInclinaison } from './inclinaison.ts'
import type { CarteEmoji } from '../logic/emoji/types.ts'
import type { Collection, Stickers } from '../logic/emoji/collection.ts'
import { nombreDeStickers } from '../logic/emoji/collection.ts'
import { stickerDe, stickerHautDe } from './texture-carte.ts'
import { cerneArcEnCiel } from './peinture-vignette.ts'
import { animationDeLEmoji, urlAnimationEmoji } from './emoji-anime.ts'
import { enTitre } from './carte-emoji.ts'
import { urlEmojiDeKeko } from '../ui/art.ts'
import { BRILLANT, COSMOS, INCLINAISON_REFLET, SATURATION_APLAT } from './Carte3D.tsx'

/** Une paillette du sticker holo en grand : sa place, sa taille, sa teinte, et l'orientation où elle renvoie la lampe. */
interface Paillette {
  x: number
  y: number
  /** L'étoile peinte une fois, à sa couleur, par la formule du nuanceur. */
  dessin: HTMLCanvasElement
  mx: number
  my: number
  phase: number
  vitesse: number
}

/**
 * LA TOILE DU STICKER EN PART DE LA LARGEUR DE CARTE : sur la carte, le sticker
 * (marges comprises) tient dans la fenêtre d'art et en fait environ 0,8. C'est
 * ce qui donne au sticker en grand des cellules de paillettes de la même
 * finesse que sur la carte.
 */
const STICKER_DANS_LA_CARTE = 0.8

/**
 * UNE ÉTOILE DE L'EMOJI, PEINTE PAR LA FORMULE DU NUANCEUR. Keko : « les étoiles
 * de l'emoji sur les cartes ne sont pas les mêmes sur les stickers, je veux les
 * mêmes ». *Le dessin d'avant était le mien* — des branches épaisses, presque
 * blanches. Ici, pixel par pixel, c'est celui des paillettes COSMOS : deux
 * branches d'un pixel d'épaisseur (`COSMOS.etoile`) qui s'éteignent en
 * exponentielle (`COSMOS.bras`), un petit cœur rond (`rayonGros`, à 0,6), le
 * tout coupé à sa cellule, à la couleur du spectre de la feuille ramenée vers
 * le blanc (mix 0,8).
 */
function peindreEtoile(cellule: number, teinte: number): HTMLCanvasElement {
  const n = Math.max(3, Math.ceil(cellule))
  const c = document.createElement('canvas')
  c.width = n
  c.height = n
  const ctx = c.getContext('2d')
  if (ctx === null) return c
  const image = ctx.createImageData(n, n)
  const d = image.data
  const aa = 1 / cellule
  const ep = Math.max(aa, 0.002) * COSMOS.etoile
  const rP = COSMOS.rayonGros
  const spectre = [0, 0.33, 0.67].map((o) => 0.5 + 0.5 * Math.cos(Math.PI * 2 * (teinte + o)))
  const ton = spectre.map((v) => 1 + (v - 1) * 0.8)
  for (let j = 0; j < n; j++) {
    for (let i = 0; i < n; i++) {
      const dx = (i + 0.5) / n - 0.5
      const dy = (j + 0.5) / n - 0.5
      const lg = Math.hypot(dx, dy)
      const t = Math.min(1, Math.max(0, (lg - (rP - aa)) / (2 * aa)))
      const point = 1 - t * t * (3 - 2 * t)
      const etoile =
        Math.exp(-Math.abs(dx) / ep) * Math.exp(-Math.abs(dy) * COSMOS.bras) +
        Math.exp(-Math.abs(dy) / ep) * Math.exp(-Math.abs(dx) * COSMOS.bras)
      const forme = Math.min(1, Math.max(point * 0.6, etoile))
      const k = (j * n + i) * 4
      d[k] = Math.round(ton[0]! * 255)
      d[k + 1] = Math.round(ton[1]! * 255)
      d[k + 2] = Math.round(ton[2]! * 255)
      d[k + 3] = Math.round(forme * 255)
    }
  }
  ctx.putImageData(image, 0, 0)
  return c
}

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
  /** LE CERNE ARC-EN-CIEL D'UNE HOLO, seul, par-dessus : c'est lui qui tourne au regard. */
  const arc = useRef<HTMLCanvasElement>(null)
  /** LES PAILLETTES DE LA FEUILLE, sur le sticker holo : repeintes à chaque image. */
  const paillettes = useRef<HTMLCanvasElement>(null)
  const semis = useRef<Paillette[]>([])
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
    // LA TAILLE DE MISE EN PAGE, PAS CELLE DE L'ÉCRAN : mesurée pendant son
    // arrivée (une mise à l'échelle de 0,4), la toile était peinte en 163 px
    // pour 349 affichés — un sticker flou. ET À LA DENSITÉ DE L'ÉCRAN, jusqu'à
    // 3 : peint à sa taille réelle (`stickerHautDe`), il ne crénelle plus.
    const t0 = toile.current
    if (t0 == null) return
    const cote = Math.round(t0.clientWidth * Math.min(window.devicePixelRatio || 1, 3))
    void stickerHautDe(carte.emoji, cote, urlEmojiDeKeko(carte.id) ?? undefined).then((image) => {
      const t = toile.current
      const ctx = t?.getContext('2d', { willReadFrequently: holo })
      if (!vivant || image === null || t == null || ctx == null) return
      t.width = cote
      t.height = cote
      ctx.imageSmoothingQuality = 'high'
      ctx.drawImage(image, 0, 0, cote, cote)
      // LA HOLO : le sticker garde son cerne crème dessous, et le spectre est
      // une couche à part — *repeindre les pixels à chaque mouvement du
      // téléphone coûterait une boucle sur toute la toile ; tourner la teinte
      // d'une couche ne coûte rien.*
      // LES PAILLETTES : les deux grilles de la feuille (`COSMOS`), à la finesse
      // de la carte — le sticker en grand en fait environ les trois cinquièmes
      // de largeur — gardées sur le sticker opaque.
      const pc = paillettes.current
      if (holo && pc != null) {
        pc.width = cote
        pc.height = cote
        const px = ctx.getImageData(0, 0, cote, cote).data
        const liste: Paillette[] = []
        // RIEN QUE LES ÉTOILES DE L'EMOJI : la grille des grosses (voir `COSMOS.etoile`).
        for (const g of [{ n: COSMOS.gros, part: COSMOS.partGros }]) {
          const pas = cote / (g.n * STICKER_DANS_LA_CARTE)
          for (let y = pas / 2; y < cote; y += pas) {
            for (let x = pas / 2; x < cote; x += pas) {
              if (Math.random() > g.part) continue
              // SA PLACE DANS SA CELLULE : ± un quart, comme au nuanceur.
              const gx = Math.min(cote - 1, Math.round(x + (Math.random() - 0.5) * pas * 0.5))
              const gy = Math.min(cote - 1, Math.round(y + (Math.random() - 0.5) * pas * 0.5))
              if (px[(gy * cote + gx) * 4 + 3]! < 230) continue
              liste.push({
                x: gx,
                y: gy,
                dessin: peindreEtoile(pas, (Math.random() * 3) % 1),
                // LE PENCHANT DE SON PETIT MIROIR, comme au nuanceur (h3 − 0,5, h4 − 0,5).
                mx: Math.random() - 0.5,
                my: Math.random() - 0.5,
                phase: Math.random() * Math.PI * 2,
                vitesse: 2 + Math.random() * 3,
              })
            }
          }
        }
        semis.current = liste
        // DÉCOUPÉES À LA SILHOUETTE, comme sur la carte où le masque de l'emoji
        // les arrête : une étoile au bord ne déborde pas du sticker.
        const sil = document.createElement('canvas')
        sil.width = cote
        sil.height = cote
        const sctx = sil.getContext('2d')
        if (sctx !== null) {
          sctx.drawImage(t, 0, 0)
          sctx.globalCompositeOperation = 'source-in'
          sctx.fillStyle = '#fff'
          sctx.fillRect(0, 0, cote, cote)
          const url = `url(${sil.toDataURL()})`
          pc.style.maskImage = url
          pc.style.setProperty('-webkit-mask-image', url)
          pc.style.maskSize = '100% 100%'
          pc.style.setProperty('-webkit-mask-size', '100% 100%')
        }
      }
      const a = arc.current
      const actx = a?.getContext('2d', { willReadFrequently: true })
      if (holo && !anime && a != null && actx != null) {
        a.width = cote
        a.height = cote
        actx.drawImage(image, 0, 0, cote, cote)
        cerneArcEnCiel(a, { x: 0, y: 0, l: 1, h: 1 }, true)
      } else if (holo) cerneArcEnCiel(t, { x: 0, y: 0, l: 1, h: 1 })
      setPret(true)
    })
    return () => {
      vivant = false
    }
  }, [carte, holo, anime])
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
    /**
     * L'ORIENTATION : le doigt quand il tient le sticker, sinon le téléphone
     * (son zéro est la tenue à l'ouverture). *La même règle que la carte.*
     */
    let doigt: { x: number; y: number } | null = null
    const gyro = suivreLInclinaison()
    const borne = (v: number): number => Math.max(-1, Math.min(1, v))
    let image = 0
    const appliquer = (): void => {
      const el = penche.current
      const g = gyro.lire()
      // 0,35 rad (20°) de téléphone penchent le sticker autant qu'un doigt au bord.
      const o = doigt ?? (g === null ? { x: 0, y: 0 } : { x: borne(g.y / 0.35), y: borne(-g.x / 0.35) })
      if (el != null) {
        el.style.transform =
          doigt === null && g === null ? '' : `rotateY(${o.x * 18}deg) rotateX(${-o.y * 18}deg) scale(1.03)`
      }
      // LE SPECTRE TOURNE AVEC L'ORIENTATION, comme le cerne de la carte holo :
      // au nuanceur, sa phase avance du reflet (`Rf.x + Rf.y`, ×1,2) ; ici
      // d'un demi-tour de chaque côté : un tour entier reviendrait à la même
      // couleur d'un coin à l'autre.
      const a = arc.current
      if (a != null) a.style.filter = `saturate(${1 + SATURATION_APLAT}) hue-rotate(${((o.x - o.y) * 90).toFixed(1)}deg)`
      // LES PAILLETTES S'ALLUMENT AU REGARD : chacune quand l'orientation passe
      // par celle où son petit miroir renvoie la lampe, et elles scintillent.
      const pc = paillettes.current
      const pctx = pc?.getContext('2d')
      if (pc != null && pctx != null && semis.current.length > 0) {
        pctx.clearRect(0, 0, pc.width, pc.height)
        pctx.globalCompositeOperation = 'lighter'
        pctx.globalAlpha = 1
        const tps = performance.now() / 1000
        // LA LAMPE CLÉ, en haut à droite : en coordonnées d'écran, y descend.
        const L = BRILLANT.lampe
        const LL = Math.hypot(L[0], L[1], L[2])
        const Lx = L[0] / LL
        const Ly = -L[1] / LL
        const Lz = L[2] / LL
        const cx = pc.width / 2
        const cy = pc.height / 2
        const distanceOeil = pc.width * 2.5
        for (const p of semis.current) {
          // LE CALCUL DE LA CARTE, À L'IDENTIQUE (voir les paillettes COSMOS du
          // nuanceur) : la normale du sticker penché, celle du petit miroir
          // dispersée autour, le regard renvoyé, et la lampe clé — il ne brille
          // que si le reflet tombe sur elle. Keko : « le même effet sur les
          // stickers quand on les zoome » ; la version d'avant allumait large,
          // trop d'étoiles à la fois.
          // EN COORDONNÉES D'ÉCRAN (x à droite, y vers le bas, z vers l'œil).
          // La normale du sticker penché par rotateY / rotateX (18° au plus),
          // celle du petit miroir dispersée autour.
          const k = COSMOS.dispersion * 2
          // L'INCLINAISON DE LA CARTE pour les miroirs (INCLINAISON_REFLET × ½),
          // pas celle, plus forte, du sticker à l'écran : les mêmes étoiles
          // s'allument pour le même geste.
          let nx = Math.sin(o.x * INCLINAISON_REFLET * 0.5) + p.mx * k
          let ny = Math.sin(o.y * INCLINAISON_REFLET * 0.5) + p.my * k
          let nz = 1
          const ln = Math.hypot(nx, ny, nz)
          nx /= ln
          ny /= ln
          nz /= ln
          // LE REGARD DE SA PLACE : l'œil au-dessus du centre, à 2,5 stickers —
          // c'est la perspective qui fait courir les reflets sur la carte.
          let vx = cx - p.x
          let vy = cy - p.y
          let vz = distanceOeil
          const lv = Math.hypot(vx, vy, vz)
          vx /= lv
          vy /= lv
          vz /= lv
          // reflect(−V, n) = 2 (V·n) n − V.
          const vn = vx * nx + vy * ny + vz * nz
          const rx = 2 * vn * nx - vx
          const ry = 2 * vn * ny - vy
          const rz = 2 * vn * nz - vz
          const sf = Math.max(0, rx * Lx + ry * Ly + rz * Lz)
          const allume = Math.pow(sf, COSMOS.serreGros)
          // LA FORCE DU NUANCEUR (COSMOS.force × la holo, 0,28), DOUBLÉE : sur la
          // carte, ce qui sature passe le seuil du bloom et rayonne — une toile
          // plafonne à 1, il lui faut ce surcroît pour se lire autant.
          const a2 = Math.min(1, allume * (0.65 + 0.35 * Math.sin(tps * p.vitesse + p.phase)) * COSMOS.force * 0.28 * 2)
          if (a2 < 0.02) continue
          pctx.globalAlpha = a2
          pctx.drawImage(p.dessin, p.x - p.dessin.width / 2, p.y - p.dessin.height / 2)
        }
      }
      image = requestAnimationFrame(appliquer)
    }
    image = requestAnimationFrame(appliquer)
    signal.addEventListener('abort', () => {
      cancelAnimationFrame(image)
      gyro.arreter()
    })
    const viser = (x: number, y: number): void => {
      const b = zone.current?.getBoundingClientRect()
      if (b === undefined) return
      doigt = {
        x: borne((x - (b.left + b.width / 2)) / (b.width / 2)),
        y: borne((y - (b.top + b.height / 2)) / (b.height / 2)),
      }
    }
    const redresser = (): void => {
      doigt = null
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
        if (e.pointerType === 'mouse' || doigt !== null) viser(e.clientX, e.clientY)
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
            <canvas ref={arc} className="sticker-toile sticker-arc" />
            {holo && <canvas ref={paillettes} className="sticker-toile sticker-paillettes" />}
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

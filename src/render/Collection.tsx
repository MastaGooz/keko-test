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
import { Canvas } from '@react-three/fiber'
import { NoToneMapping } from 'three'
import type { CarteEmoji, GroupeEmoji, RareteEmoji } from '../logic/emoji/types.ts'
import { GROUPES_EMOJI, NOM_DU_GROUPE, RARETES_EMOJI } from '../logic/emoji/types.ts'
import type { Collection, Possession } from '../logic/emoji/collection.ts'
import { nombreDExemplaires } from '../logic/emoji/collection.ts'
import { AMBIANCE, RAYONS_DANS_LA_CARTE, peindreCarte, tailleQuIlFaut } from './texture-carte.ts'
import { COULEUR, carteDeLEmoji, enTitre } from './carte-emoji.ts'
import { COSMOS, Carte3D, HAUT, LARGE, SATURATION_APLAT, type CurseurDeCarte } from './Carte3D.tsx'
import { Cadrage, FOV, Z_MAIN, hauteurVisibleA, zCamera } from './Cadrage.tsx'
import { Horloge } from './horloge.tsx'
import { Bloom } from './Bloom.tsx'
import { PencheAuGyro } from './Paquet3D.tsx'
import { suivreLInclinaison, type Inclinaison } from './inclinaison.ts'
import { SON_POSER, jouerSon } from './sons.ts'

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

/** Sans accents ni casse : « eclair » trouve « Éclair ». */
function plier(texte: string): string {
  return texte.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

/* ------------------------------------------------------------------------ */
/* LES VIGNETTES                                                            */
/* ------------------------------------------------------------------------ */

/**
 * LA FILE DES PEINTURES : une à la fois. *Cent vignettes qui entrent dans la
 * vue d'un coup de pouce feraient cent peintures dans la même image* — la file
 * les étale, et la première arrive aussitôt.
 */
let fileDePeinture: Promise<unknown> = Promise.resolve()
const PEINTES = new Map<string, Promise<HTMLCanvasElement>>()

const lineaire = (v: number): number => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)
const srgb = (v: number): number => (v <= 0.0031308 ? v * 12.92 : 1.055 * v ** (1 / 2.4) - 0.055)
const fondu = (a: number, b: number, x: number): number => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

/**
 * LE CERNE ARC-EN-CIEL D'UNE HOLO, PEINT SUR LA VIGNETTE. Keko : « on peut pas
 * avoir l'outline arc-en-ciel au lieu de blanc sur les cartes de la
 * collection ? » *En 3D c'est le nuanceur qui le fait* (`COSMOS.cerne`) ; une
 * vignette est une peinture, donc on refait son calcul sur ses pixels, une
 * fois : **le même repérage du crème** (il manque environ 0,13 de bleu au
 * #fffaf0, là où les blancs d'un emoji sont neutres), **le même spectre** qui
 * fait le tour de l'emoji, saturé par la même puissance. *Ce qui ne passe pas,
 * c'est l'angle du regard* : une vignette ne penche pas, son spectre est figé.
 * Seulement dans la fenêtre d'art : la plaque, crème aussi, n'en reçoit pas.
 */
function cerneArcEnCiel(toile: HTMLCanvasElement): void {
  const ctx = toile.getContext('2d')
  if (ctx === null) return
  const { width: l, height: h } = toile
  const R = RAYONS_DANS_LA_CARTE
  const x0 = Math.floor(R.x * l)
  const y0 = Math.floor(R.y * h)
  const lf = Math.ceil(R.l * l)
  const hf = Math.ceil(R.h * h)
  const image = ctx.getImageData(x0, y0, lf, hf)
  const d = image.data
  const cx = (R.x + R.l / 2) * l
  const cy = (R.y + R.h / 2) * h
  const { tour, sature, couleur } = COSMOS.cerne
  for (let j = 0; j < hf; j++) {
    for (let i = 0; i < lf; i++) {
      const k = (j * lf + i) * 4
      if (d[k + 3]! === 0) continue
      const r = lineaire(d[k]! / 255)
      const g = lineaire(d[k + 1]! / 255)
      const b = lineaire(d[k + 2]! / 255)
      const ecart = r - b
      const creme =
        fondu(0.88, 0.95, r) * fondu(0.8, 0.84, b) * fondu(0.07, 0.1, ecart) * (1 - fondu(0.17, 0.22, ecart))
      if (creme <= 0) continue
      // L'ANGLE AUTOUR DU CENTRE DE LA FENÊTRE, la hauteur à l'échelle de la
      // carte (1,4) : le spectre tourne rond autour de l'emoji.
      const dx = (x0 + i - cx) / l
      const dy = ((y0 + j - cy) / h) * 1.4
      const t = (((Math.atan2(dy, dx) / (Math.PI * 2)) * tour) % 1 + 1.3) % 1
      const arc = [0, 0.33, 0.67].map((o) => Math.min(1, (0.5 + 0.5 * Math.cos(Math.PI * 2 * (t + o))) ** sature * 1.5))
      const teinte = arc.map((a) => 1 + (a - 1) * couleur)
      const lin = [r, g, b].map((v, n) => v + (v * teinte[n]! - v) * creme)
      d[k] = Math.round(srgb(lin[0]!) * 255)
      d[k + 1] = Math.round(srgb(lin[1]!) * 255)
      d[k + 2] = Math.round(srgb(lin[2]!) * 255)
    }
  }
  ctx.putImageData(image, x0, y0)
}

function peinte(c: CarteEmoji, largeur: number, holo: boolean): Promise<HTMLCanvasElement> {
  const cle = `${c.id}#${largeur}${holo ? '#holo' : ''}`
  const deja = PEINTES.get(cle)
  if (deja !== undefined) return deja
  const p = fileDePeinture.then(async () => {
    const toile = await peindreCarte(carteDeLEmoji(c), largeur)
    if (holo) cerneArcEnCiel(toile)
    return toile
  })
  fileDePeinture = p.catch(() => null)
  PEINTES.set(cle, p)
  // *Un cache retient les succès, pas les échecs.*
  p.catch(() => PEINTES.delete(cle))
  return p
}

/**
 * LA VIGNETTE PREND LA SATURATION DE LA CARTE 3D. Keko : « j'ai l'impression que
 * les cartes sont plus ternes quand je regarde la vue d'ensemble ». *Elles
 * l'étaient* : la carte en 3D sature sa peinture en sortie de nuanceur
 * (`SATURATION_APLAT`, +40 %), la vignette montrait la peinture telle quelle.
 * **Le chiffre est lu, pas recopié** : un seul endroit dit combien.
 */
const FILTRE_VIGNETTE: React.CSSProperties = {
  filter: `saturate(${1 + SATURATION_APLAT}) drop-shadow(0 0.25rem 0.4rem rgba(10, 4, 30, 0.55))`,
}

function Vignette({
  carte,
  possession,
  onOuvrir,
}: {
  carte: CarteEmoji
  possession: Possession
  onOuvrir: () => void
}): React.ReactElement {
  const boite = useRef<HTMLButtonElement>(null)
  const toile = useRef<HTMLCanvasElement>(null)
  const [prete, setPrete] = useState(false)
  const holo = possession.holo > 0
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
        void peinte(carte, tailleQuIlFaut(px), holo).then((source) => {
          const t = toile.current
          const ctx = t?.getContext('2d')
          if (t == null || ctx == null) return
          t.width = source.width
          t.height = source.height
          ctx.drawImage(source, 0, 0)
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
  }, [carte, holo])
  return (
    <button
      ref={boite}
      type="button"
      className={`vignette${prete ? ' vignette-prete' : ''}${possession.holo > 0 ? ' vignette-holo' : ''}`}
      style={{ '--cran': teinteDuCran(carte.rarete) } as React.CSSProperties}
      onClick={onOuvrir}
      aria-label={`${enTitre(carte.nom)}, ${NOM_DE_LA_RARETE[carte.rarete]}`}
    >
      {!prete && <span className="vignette-attente">{carte.emoji}</span>}
      <canvas ref={toile} className="vignette-toile" style={FILTRE_VIGNETTE} />
      {possession.nouvelle && <span className="vignette-nouvelle">Nouveau</span>}
      {possession.n > 1 && <span className="vignette-nombre">×{possession.n}</span>}
      {(possession.holo > 0 || possession.anime > 0) && (
        <span className="vignette-bonus">
          {possession.holo > 0 && <span className="pastille-holo">Holo</span>}
          {possession.anime > 0 && <span className="pastille-anime">Animé</span>}
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
  total,
  onFermer,
}: {
  carte: CarteEmoji
  possession: Possession
  total: number
  onFermer: () => void
}): React.ReactElement {
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
  const aPeindre = useMemo(
    () => carteDeLEmoji(carte, { holo: possession.holo > 0, anime: possession.anime > 0 && carte.animable }),
    [carte, possession.holo, possession.anime],
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
        // La croix ferme d'elle-même : on ne repose pas deux fois.
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
  const exemplaires = [
    possession.n > 1 ? `${possession.n} exemplaires` : '1 exemplaire',
    possession.holo > 0 ? `${possession.holo} holo` : null,
    possession.anime > 0 ? `${possession.anime} animé${possession.anime > 1 ? 's' : ''}` : null,
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
        <PencheAuGyro curseurs={[curseur.current]} gyro={gyro} />
        <Bloom />
        <ambientLight intensity={0.55} />
        <directionalLight position={[2.5, 3.5, 4]} intensity={2.2} />
        <directionalLight position={[-4, 1, 2]} intensity={0.9} color="#8fb4ff" />
        <Carte3D
          carte={aPeindre}
          position={[0, hVisible * 0.06, Z_MAIN]}
          taille={taille}
          tailleTexture={px}
          reflet
          refletAuDoigt
          curseurPartage={curseur.current}
          ombre={false}
        />
      </Canvas>
      <div className="carte-ouverte-infos">
        <span className="carte-ouverte-cran" style={{ '--cran': teinteDuCran(carte.rarete) } as React.CSSProperties}>
          {NOM_DE_LA_RARETE[carte.rarete]}
        </span>
        <p className="carte-ouverte-ligne">{exemplaires.join(' · ')}</p>
        <p className="carte-ouverte-ligne carte-ouverte-discret">
          Obtenue le {DATE.format(new Date(possession.premiere))} · n° {carte.rang} sur {total}
        </p>
      </div>
      <button type="button" className="carte-ouverte-fermer" aria-label="Fermer" onClick={onFermer}>
        ×
      </button>
    </div>
  )
}

/* ------------------------------------------------------------------------ */
/* LA PAGE                                                                  */
/* ------------------------------------------------------------------------ */

export function PageCollection({
  catalogue,
  collection,
  onOuvrirUnPaquet,
}: {
  catalogue: readonly CarteEmoji[] | null
  collection: Collection
  onOuvrirUnPaquet: () => void
}): React.ReactElement {
  const [recherche, setRecherche] = useState('')
  const [tri, setTri] = useState<Tri>('recentes')
  const [raretes, setRaretes] = useState<ReadonlySet<RareteEmoji>>(new Set())
  // PLUSIEURS TYPES À LA FOIS, comme les raretés. Keko : « ce serait bien de
  // pouvoir sélectionner plusieurs catégories à la fois comme les raretés ».
  const [groupes, setGroupes] = useState<ReadonlySet<GroupeEmoji>>(new Set())
  const [ouverte, setOuverte] = useState<string | null>(null)

  const parId = useMemo(() => new Map((catalogue ?? []).map((c) => [c.id, c])), [catalogue])
  /** Ce qu'on possède ET que le catalogue connaît encore (un doublon retiré sort d'ici). */
  const possedees = useMemo(
    () =>
      Object.entries(collection.cartes)
        .map(([id, p]) => ({ carte: parId.get(id), p }))
        .filter((x): x is { carte: CarteEmoji; p: Possession } => x.carte !== undefined),
    [collection, parId],
  )
  const visibles = useMemo(() => {
    const q = plier(recherche.trim())
    const l = possedees.filter(
      ({ carte }) =>
        (raretes.size === 0 || raretes.has(carte.rarete)) &&
        (groupes.size === 0 || groupes.has(carte.groupe)) &&
        (q === '' || plier(carte.nom).includes(q) || carte.mots.some((m) => plier(m).includes(q))),
    )
    const az = new Intl.Collator('fr')
    if (tri === 'recentes') l.sort((a, b) => b.p.ordre - a.p.ordre)
    else if (tri === 'az') l.sort((a, b) => az.compare(a.carte.nom, b.carte.nom))
    else l.sort((a, b) => a.carte.rang - b.carte.rang)
    return l
  }, [possedees, recherche, tri, raretes, groupes])

  const total = catalogue?.length ?? 0
  const part = total === 0 ? 0 : possedees.length / total
  const exemplaires = nombreDExemplaires(collection)
  const laOuverte = ouverte === null ? undefined : possedees.find((x) => x.carte.id === ouverte)

  return (
    <div className="collection">
      <div className="collection-defile">
        <header className="collection-tete">
          <h1 className="collection-titre">Ma collection</h1>
          <p className="collection-compte">
            <b>{possedees.length}</b> / {total} emoji · {exemplaires} carte{exemplaires > 1 ? 's' : ''} ·{' '}
            {collection.paquets} paquet{collection.paquets > 1 ? 's' : ''}
          </p>
          <div className="collection-barre" aria-hidden>
            <span style={{ width: `${(part * 100).toFixed(2)}%` }} />
          </div>
        </header>

        {possedees.length > 0 && (
          <div className="collection-outils">
            <input
              className="collection-recherche"
              type="search"
              placeholder="Chercher un emoji"
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
            />
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
            <div className="collection-puces">
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
            <div className="collection-puces">
              {GROUPES_EMOJI.map((g) => (
                <button
                  key={g}
                  type="button"
                  className={`puce${groupes.has(g) ? ' actif' : ''}`}
                  onClick={() => setGroupes((s) => basculer(s, g))}
                >
                  {NOM_DU_GROUPE[g]}
                </button>
              ))}
            </div>
          </div>
        )}

        {catalogue === null ? null : possedees.length === 0 ? (
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
            {visibles.map(({ carte, p }) => (
              <Vignette key={carte.id} carte={carte} possession={p} onOuvrir={() => setOuverte(carte.id)} />
            ))}
          </div>
        )}
      </div>
      {/* PAR-DESSUS LA BARRE : la page est fixe, donc elle fait son propre
          empilement, et la carte ouverte doit en sortir pour couvrir la
          navigation. *Une carte qu'on regarde n'a rien à côté d'elle.* */}
      {laOuverte !== undefined &&
        createPortal(
          <CarteOuverte
            carte={laOuverte.carte}
            possession={laOuverte.p}
            total={total}
            onFermer={() => setOuverte(null)}
          />,
          document.body,
        )}
    </div>
  )
}

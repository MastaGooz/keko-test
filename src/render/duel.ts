/**
 * L'ÉCRAN DU DUEL — `?duel`, et `?duel&ordre=serpent` pour l'autre tour de jeu.
 *
 * **MOCHE EXPRÈS**, comme le plateau : du DOM, une grille CSS, aucun Three.js.
 * Il **réutilise le dessin du plateau** (`CSS`, `vignette`) plutôt que de le
 * refaire — *deux écrans qui dessinent la même carte divergeraient au premier
 * réglage*, la leçon des quatre fonctions qui peignaient chacune leur carte.
 *
 * **LA LOGIQUE N'EST PAS ICI** : elle vit dans `logic/board/duel.ts`, pure et
 * vérifiée sans navigateur. Ce module ne fait que dessiner et écouter.
 *
 * ### L'ADVERSAIRE EST UN BOT, et c'est un choix
 *
 * Keko teste seul, depuis son téléphone : *un hot-seat ne se juge pas quand on
 * joue les deux camps.* Le bot maximise son propre gain — **mesuré, c'est la
 * meilleure stratégie**, voir `duel.ts`.
 *
 * ### L'APERÇU PORTE LES DEUX CHIFFRES, et c'est tout le mode
 *
 * Une case dit **ce qu'elle te rapporte** en vert et **ce qu'elle donne au bot**
 * en rouge. *N'afficher que son propre gain cacherait précisément ce qu'il y a à
 * décider* — un couple paie ses deux cartes, donc la meilleure case pour toi
 * peut être un cadeau.
 */

import { loadCharacters } from '../ui/personnages.ts'
import { CSS, sousPoolDemande, tailleDeCase, vignette } from './board.ts'
import {
  campDuTour,
  coupDuBot,
  duelVide,
  fini,
  gainsDuel,
  parJoueur,
  pointsParCase,
  poserDuel,
  REGLAGE_DUEL,
  scoresDuel,
  type Camp,
  type Duel,
  type Ordre,
} from '../logic/board/duel.ts'
import { symetrique, tirer, type Distances, type Graphe, type Jeton } from '../logic/board/plateau.ts'
import { createRng } from '../logic/rng.ts'

/** Ce que le duel ajoute au dessin du plateau. */
const CSS_DUEL = `
  /* LE CAMP SE LIT AU LISERE : *c'est la seule chose qu'on cherche d'un coup
     d'oeil sur une grille pleine*, et un chiffre par case ne le dirait pas. */
  /* LES DEUX CLASSES SONT PREFIXEES, et il le fallait : styles.css -- tout le
     chrome du moteur -- definit deja un .moi pour le compteur de PV du joueur,
     en position: absolute avec ses propres left et bottom. Mes cases s'en
     trouvaient ARRACHEES de la grille et empilees en bas a gauche, pendant que
     la regle, elle, les comptait a la bonne place. *Les cases du bot n'avaient
     rien, puisque .lui n'existe nulle part ailleurs.*

     Keko : « les cartes ennemis sont bien placees, mais mes cartes semblent
     avoir un offset x et y qui decale leur position visuellement (mais leur
     place est consideree comme valable et fonctionne au niveau points) ». */
  .bd-case.bd-camp-moi { border-color: #6fa8ff; box-shadow: 0 0 0 2px #6fa8ff inset; }
  .bd-case.bd-camp-lui { border-color: #ff8a6f; box-shadow: 0 0 0 2px #ff8a6f inset; }
  /* CE QUE LA CASE DONNE A L'ADVERSAIRE, sous ce qu'elle te rapporte.
     *Deux chiffres parce que le couple paie ses deux cartes* — c'est le
     dilemme, et un seul des deux le cacherait. */
  .bd-cadeau { position: absolute; left: 0; right: 0; bottom: 2px; text-align: center;
               font-weight: 700; font-size: 13px; color: #ff8a6f;
               text-shadow: 0 0 4px #000, 0 0 4px #000; pointer-events: none; }
  .bd-score { font-size: 15px; }
  .bd-score b { font-size: 24px; }
  .bd-moi { color: #6fa8ff; }
  .bd-lui { color: #ff8a6f; }
  .bd-verdict { font-size: 20px; font-weight: 700; color: #ffc65c; }
  .bd-aqui { font-size: 13px; }
`

/** Le camp du joueur. L'autre est le bot. */
const MOI: Camp = 0

export async function montrerDuel(racine: HTMLElement, buildTime: string): Promise<void> {
  const style = document.createElement('style')
  style.textContent = CSS + CSS_DUEL
  document.head.append(style)
  racine.className = 'bd'
  racine.textContent = 'Chargement du catalogue et du graphe…'

  // LE CATALOGUE EST CELUI DES PERSONNAGES, et il n'y a pas le choix :
  // `links.json` est le graphe de LEURS articles. *Un duel d'animaux n'aurait
  // aucun lien*, donc aucun bonus, donc aucune decision.
  const [cartes, reponse] = await Promise.all([
    loadCharacters(),
    fetch(`${import.meta.env.BASE_URL}data/links.json?v=${encodeURIComponent(buildTime)}`),
  ])
  if (cartes.length === 0) {
    racine.textContent = 'Catalogue introuvable.'
    return
  }
  if (!reponse.ok) {
    racine.textContent = 'data/links.json introuvable — lance `npm run liens` d’abord.'
    return
  }
  // LE GRAPHE SE REFERME DANS LES DEUX SENS, UNE FOIS : *un parcours ne peut
  // pas lire un graphe a moitie oriente.*
  const graphe: Graphe = symetrique(((await reponse.json()) as { liens?: Graphe }).liens ?? {})
  const cache: Distances = new Map()

  const demande = new URLSearchParams(location.search).get('ordre')
  const ordre: Ordre = demande === 'serpent' ? 'serpent' : 'alterne'
  const reglage = { ...REGLAGE_DUEL, ordre, sousPool: sousPoolDemande(REGLAGE_DUEL.sousPool) }

  // LE CATALOGUE EST TRIE PAR NOTORIETE : les N premiers sont le sous-pool.
  const pool: readonly Jeton[] = cartes.slice(0, reglage.sousPool).map((c) => ({
    id: c.id,
    nom: c.nom,
    // `image` est `string | null` AU TYPE — *un type qui autorise le vide
    // finira par le rencontrer.*
    image: c.image ?? '',
    rarete: c.rarete,
  }))

  // LA GRAINE SE TIRE AU CHARGEMENT : *un hasard seede dont la graine est une
  // constante n'est pas un hasard, c'est une liste.* `?duel&seed=7` la rejoue.
  const demandee = Number(new URLSearchParams(location.search).get('seed') ?? '')
  const graine =
    Number.isFinite(demandee) && demandee !== 0
      ? demandee
      : (Date.now() ^ (Math.random() * 2 ** 32)) >>> 0
  const alea = createRng(graine >>> 0)
  const rng = (): number => alea.next()

  function neuf(): Duel {
    const n = parJoueur(reglage)
    const a = tirer(pool, n, rng)
    const b = tirer(pool, n, rng, new Set(a.map((j) => j.id)))
    return duelVide(reglage, a, b)
  }

  let d = neuf()
  /** La carte qu'on tient, par identifiant. */
  let choix: string | null = null
  /** Vrai pendant que le bot réfléchit : *on ne joue pas sur son tour.* */
  let attente = false

  /** Le coup du bot, après un temps mort pour qu'on le VOIE poser. */
  function tourDuBot(): void {
    if (fini(d) || campDuTour(d) === MOI) return
    attente = true
    dessiner()
    setTimeout(() => {
      const coup = coupDuBot(d, graphe, cache)
      if (coup !== null) d = poserDuel(d, coup.id, coup.case)
      attente = false
      dessiner()
      // IL PEUT AVOIR DEUX COUPS D'AFFILEE en serpent, donc on redemande.
      tourDuBot()
    }, 420)
  }

  function dessiner(): void {
    const par = pointsParCase(d, graphe, cache)
    const [sMoi, sLui] = scoresDuel(d, graphe, cache)
    const aMoi = campDuTour(d) === MOI && !attente && !fini(d)
    // CE QUE LA CARTE CHOISIE RAPPORTERAIT, CASE PAR CASE — aux DEUX camps.
    const vu = choix === null || !aMoi ? null : gainsDuel(d, graphe, choix, MOI, cache)
    // LE SOMMET NE COMPTE QUE CE QUI DEPASSE LA BASE. *Toute case libre
    // rapporte au moins la base*, donc sans ce garde les seize cases etaient a
    // egalite sur une grille vide et s'entouraient TOUTES de vert.
    let sommet = 0
    if (vu !== null)
      for (const g of vu) if (g !== null && g.moi > reglage.base && g.moi > sommet) sommet = g.moi

    const cote = reglage.cote
    // LA MEME TAILLE QUE LE PLATEAU, par la meme fonction : *deux ecrans qui
    // dessinent la meme grille ne peuvent pas la dimensionner chacun de leur
    // cote.*
    const taille = tailleDeCase(cote)
    racine.replaceChildren()

    // ------------------------------------------------------------------ l'en-tete
    const haut = document.createElement('div')
    haut.className = 'bd-haut'
    const score = document.createElement('div')
    score.className = 'bd-score'
    score.innerHTML =
      `<span class="bd-moi">TOI <b>${sMoi}</b></span>` +
      ` &nbsp;—&nbsp; <span class="bd-lui">BOT <b>${sLui}</b></span>`
    const etat = document.createElement('div')
    if (fini(d)) {
      etat.className = 'bd-verdict'
      etat.textContent =
        sMoi > sLui ? `Tu gagnes ${sMoi} à ${sLui}` : sMoi < sLui ? `Le bot gagne ${sLui} à ${sMoi}` : `Égalité, ${sMoi} partout`
    } else {
      etat.className = 'bd-aqui'
      etat.innerHTML =
        `coup ${d.poses + 1} / ${d.grille.length} — ` +
        (aMoi
          ? `<span class="bd-moi"><b>à toi</b></span>`
          : `<span class="bd-lui"><b>le bot joue…</b></span>`)
    }
    const note = document.createElement('div')
    note.className = 'bd-note'
    note.textContent =
      `pool de ${pool.length} · ordre ${ordre} · graine ${graine}`
    haut.append(score, etat, note)

    // -------------------------------------------------------------------- la grille
    const grille = document.createElement('div')
    grille.className = 'bd-grille'
    grille.style.gridTemplateColumns = `repeat(${cote}, ${taille}px)`
    grille.style.gridAutoRows = `${taille}px`
    for (let i = 0; i < cote * cote; i++) {
      const j = d.grille[i] ?? null
      const b = document.createElement('button')
      b.className = 'bd-case'
      if (j === null) b.classList.add('vide')
      else b.classList.add(d.camps[i] === MOI ? 'bd-camp-moi' : 'bd-camp-lui')
      const g = vu === null ? null : (vu[i] ?? null)
      if (g !== null && sommet > 0 && g.moi === sommet) b.classList.add('vise')
      if (j !== null) {
        const img = document.createElement('img')
        img.src = vignette(j.image)
        img.alt = ''
        img.loading = 'lazy'
        const nom = document.createElement('div')
        nom.className = 'bd-nom'
        nom.textContent = j.nom
        const base = document.createElement('div')
        base.className = 'bd-base'
        base.textContent = String(reglage.base)
        b.append(img, nom, base)
        const gain = (par[i] ?? 0) - reglage.base
        if (gain > 0) {
          const bonus = document.createElement('div')
          bonus.className = 'bd-bonus'
          bonus.textContent = `+${gain}`
          b.append(bonus)
        }
        b.title = `${j.nom} — ${par[i] ?? 0} point${(par[i] ?? 0) > 1 ? 's' : ''} pour ${
          d.camps[i] === MOI ? 'toi' : 'le bot'
        }`
      }
      // L'APERCU : ce que ça TE rapporte, et ce que ça LUI donne. **Rien sur une
      // case qui ne rapporte que la base** : *un chiffre sur les seize cases ne
      // designe aucune case*, et c'est la regle du solo, ou l'apercu se taît a
      // zero.
      if (g !== null && (g.moi > reglage.base || g.lui > 0)) {
        const promesse = document.createElement('div')
        promesse.className = 'bd-apercu'
        promesse.textContent = `+${g.moi}`
        b.append(promesse)
        if (g.lui > 0) {
          const cadeau = document.createElement('div')
          cadeau.className = 'bd-cadeau'
          cadeau.textContent = `+${g.lui}`
          b.append(cadeau)
        }
        b.title =
          `Ici tu gagnerais +${g.moi}` +
          (g.lui > 0 ? `, et le bot +${g.lui}` : ', et le bot rien') +
          (g.moi === sommet ? ' (ton meilleur coup)' : '')
      }
      b.addEventListener('click', () => {
        if (!aMoi || choix === null || d.grille[i] !== null) return
        d = poserDuel(d, choix, i)
        choix = null
        dessiner()
        tourDuBot()
      })
      grille.append(b)
    }

    // ---------------------------------------------------------------------- la main
    const main = document.createElement('div')
    main.className = 'bd-main'
    for (const j of d.mains[MOI]) {
      const b = document.createElement('button')
      b.className = 'bd-carte'
      if (choix === j.id) b.classList.add('choisie')
      const img = document.createElement('img')
      img.src = vignette(j.image)
      img.alt = ''
      img.loading = 'lazy'
      const nom = document.createElement('span')
      nom.textContent = j.nom
      b.append(img, nom)
      // LE MEME CALCUL QUE L'APERCU, donc le meme chiffre : *deux affichages
      // qui pretendent dire la meme chose doivent passer par le meme calcul.*
      let max = 0
      for (const g of gainsDuel(d, graphe, j.id, MOI, cache)) if (g !== null && g.moi > max) max = g.moi
      if (max > reglage.base) {
        const amis = document.createElement('div')
        amis.className = 'bd-amis'
        amis.textContent = `+${max}`
        amis.title = `Au mieux, « ${j.nom} » te rapporterait ${max}. Clique-la pour voir OÙ.`
        b.append(amis)
      }
      b.addEventListener('click', () => {
        if (!aMoi) return
        choix = choix === j.id ? null : j.id
        dessiner()
      })
      main.append(b)
    }

    const corps = document.createElement('div')
    corps.className = 'bd-corps'
    corps.append(grille, main)

    // ------------------------------------------------------------------ les boutons
    const boutons = document.createElement('div')
    boutons.className = 'bd-boutons'
    const bNeuf = document.createElement('button')
    bNeuf.textContent = 'Nouvelle partie'
    bNeuf.addEventListener('click', () => {
      d = neuf()
      choix = null
      attente = false
      dessiner()
    })
    boutons.append(bNeuf)

    const aide = document.createElement('div')
    aide.className = 'bd-note'
    aide.innerHTML =
      `<b>Chacun pose une carte à son tour</b> jusqu’à remplir la grille ; <b>le plus gros total gagne</b>. ` +
      `Le liseré dit à qui est la carte : <span class="bd-moi">toi</span>, ` +
      `<span class="bd-lui">le bot</span>.<br>` +
      `Deux cartes côte à côte se paient <b>${reglage.portee} moins le nombre de sauts</b> entre leurs articles ` +
      `Wikipédia — et <b>le couple paie SES DEUX CARTES</b>. Contre une carte du bot, il marque donc autant que toi : ` +
      `c’est tout le dilemme.<br>` +
      `<b>Clique une carte</b> et chaque case libre dit en <span style="color:#6ddf8f">vert</span> ce que tu y ` +
      `gagnerais, en <span class="bd-lui">rouge</span> ce que le bot y gagnerait.`
    racine.append(haut, corps, boutons, aide)
  }

  dessiner()
  // Si le serpent donne le premier coup au bot un jour, il faut qu'il joue.
  tourDuBot()

  console.info(
    `duel : ${pool.length} cartes, ordre ${ordre}, graine ${graine} — ?duel&seed=${graine} rejoue cette partie`,
  )
}

/**
 * L'ÉCRAN DU PLATEAU — `?board`, et `?board&pool=1000` pour changer de pool.
 *
 * **MOCHE EXPRÈS** : du DOM, une grille CSS, aucun Three.js. Ce proto n'existe
 * que pour répondre à une question — *poser des cartes pour maximiser un score,
 * est-ce amusant ?* — et tout ce qui ne sert pas à y répondre serait du temps
 * perdu sur un écran qu'on va jeter.
 *
 * **LA LOGIQUE N'EST PAS ICI** : elle vit dans `logic/board/plateau.ts`, pure et
 * vérifiée sans navigateur. Ce module ne fait que dessiner et écouter.
 *
 * LE GESTE EST SÉLECTION PUIS DÉPÔT, pas un glisser. *Le glisser du jeu a coûté
 * trois allers-retours à régler au doigt* ; ici on clique la carte, on clique la
 * case. La zone de la main est une destination comme une autre : une carte de la
 * grille qu'on y envoie revient en main.
 */

import { loadCharacters } from '../ui/personnages.ts'
import {
  booster,
  couples,
  couplesQuiPaient,
  enJeu,
  deplacer,
  distance,
  plateauVide,
  poser,
  production,
  productionParCase,
  retirer,
  REGLAGE,
  symetrique,
  tic,
  tirer,
  type Distances,
  type Graphe,
  type Jeton,
  type Plateau,
} from '../logic/board/plateau.ts'
import { createRng } from '../logic/rng.ts'

const CSS = `
  .bd { font: 14px/1.4 system-ui, sans-serif; color: #e8e2d4; background: #16161a;
        min-height: 100vh; padding: 10px; box-sizing: border-box; }
  .bd * { box-sizing: border-box; }
  .bd-haut { display: flex; gap: 18px; flex-wrap: wrap; align-items: baseline;
             margin-bottom: 10px; }
  .bd-gros { font-size: 24px; font-weight: 700; color: #ffc65c; }
  .bd-note { color: #8d8676; font-size: 12px; }
  .bd-corps { display: flex; gap: 16px; align-items: flex-start; flex-wrap: wrap; }
  .bd-grille { display: grid; gap: 4px; }
  .bd-case { position: relative; background: #202028; border: 1px solid #3a3a46;
             border-radius: 3px; overflow: hidden; cursor: pointer; padding: 0; }
  .bd-case.vide:hover { background: #2b2b36; }
  .bd-case.synergie { border-color: #6ddf8f; box-shadow: 0 0 0 1px #6ddf8f inset; }
  /* LE LISERE EST PLUS VIF QUAND LE COUPLE EST UN LIEN DIRECT : *une gamme de
     bonus doit se lire sur la grille*, pas seulement dans une infobulle. */
  .bd-case.direct { border-color: #ffd98a; box-shadow: 0 0 0 2px #ffd98a inset; }
  .bd-case.choisie { border-color: #ffc65c; box-shadow: 0 0 0 2px #ffc65c inset; }
  .bd-case img { width: 100%; height: 100%; object-fit: cover; display: block;
                 filter: brightness(0.72); }
  .bd-nom { position: absolute; left: 0; right: 0; bottom: 0; padding: 2px 3px;
            font-size: 10px; line-height: 1.15; background: rgba(0,0,0,.72);
            overflow: hidden; }
  .bd-prod { position: absolute; top: 2px; right: 3px; font-weight: 700;
             font-size: 13px; color: #ffc65c; text-shadow: 0 0 3px #000, 0 0 3px #000; }
  .bd-main { display: flex; gap: 4px; flex-wrap: wrap; align-content: flex-start;
             padding: 6px; border: 1px dashed #4a4a58; border-radius: 4px;
             min-height: 80px; flex: 1 1 320px; }
  .bd-main.cible { border-color: #ffc65c; background: #1d1d24; }
  .bd-carte { width: 86px; background: #202028; border: 1px solid #3a3a46;
              border-radius: 3px; padding: 0; cursor: pointer; text-align: left;
              color: inherit; font: inherit; position: relative; }
  .bd-carte.choisie { border-color: #ffc65c; box-shadow: 0 0 0 2px #ffc65c inset; }
  .bd-carte img { width: 100%; height: 64px; object-fit: cover; display: block;
                  filter: brightness(0.78); }
  .bd-carte span { display: block; padding: 2px 3px; font-size: 10px;
                   line-height: 1.15; height: 26px; overflow: hidden; }
  /* EN BAS A GAUCHE, ET AVEC SON MOT. Il etait au meme coin que le chiffre de
     production de la grille — *deux chiffres differents a la meme place ne se
     lisent pas, ils se confondent*, et Keko : « je comprends pas comment
     fonctionne le systeme de chiffre des cartes quand je les pose ». */
  .bd-amis { position: absolute; bottom: 28px; left: 3px; font-size: 10px;
             font-weight: 700; color: #16161a; background: #6ddf8f;
             border-radius: 2px; padding: 0 3px; }
  .bd-boutons { display: flex; gap: 8px; margin: 10px 0 4px; flex-wrap: wrap; }
  .bd-boutons button { font: inherit; padding: 7px 12px; cursor: pointer;
                       background: #2b2b36; color: #e8e2d4; border: 1px solid #4a4a58;
                       border-radius: 3px; min-height: 36px; }
  .bd-boutons button:hover { background: #3a3a46; }
`

/** `?board&pool=N` — voir `Reglage.sousPool`. */
function sousPoolDemande(defaut: number): number {
  const v = Number(new URLSearchParams(location.search).get('pool') ?? '')
  return Number.isFinite(v) && v > 1 ? Math.floor(v) : defaut
}

/**
 * UNE VIGNETTE PLUS PETITE QUE LE PORTRAIT.
 *
 * Le catalogue porte des images de 960 px — *seize cases en feraient quatre
 * mégaoctets.* Wikimedia n'accepte que certaines largeurs, et 250 en est une
 * (mesuré : hors de la liste, elle rend un 400). **Si le motif n'est pas là, on
 * garde l'URL telle quelle** : une image lourde vaut mieux qu'une case vide.
 */
function vignette(url: string): string {
  return url.replace('/960px-', '/250px-')
}

interface Stats {
  readonly aretes: number
  readonly degre: number
  readonly isoles: number
  readonly p: number
}

/** La densité DU SOUS-POOL, pas du catalogue : c'est elle qui décide du jeu. */
function stats(pool: readonly Jeton[], graphe: Graphe): Stats {
  const dans = new Set(pool.map((j) => j.id))
  let aretes = 0
  let isoles = 0
  for (const j of pool) {
    const k = (graphe[j.id] ?? []).filter((v) => dans.has(v)).length
    aretes += k
    if (k === 0) isoles++
  }
  aretes /= 2
  const n = pool.length
  return { aretes, degre: (2 * aretes) / n, isoles, p: aretes / ((n * (n - 1)) / 2) }
}

export async function montrerPlateau(racine: HTMLElement, buildTime: string): Promise<void> {
  const style = document.createElement('style')
  style.textContent = CSS
  document.head.append(style)
  racine.className = 'bd'
  racine.textContent = 'Chargement du catalogue et du graphe…'

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
  // LE GRAPHE SE REFERME DANS LES DEUX SENS, UNE FOIS. Le fichier est deja
  // symetrise, mais *un parcours ne peut pas lire un graphe a moitie oriente* —
  // et une passe sur vingt-sept mille aretes ne coute rien.
  const graphe: Graphe = symetrique(((await reponse.json()) as { liens?: Graphe }).liens ?? {})
  // LE CACHE DES DISTANCES VIT AVEC LE GRAPHE : la grille ne bouge pas entre
  // deux gestes, donc sans lui la meme paire se redemanderait a chaque image.
  const cache: Distances = new Map()

  const reglage = { ...REGLAGE, sousPool: sousPoolDemande(REGLAGE.sousPool) }
  // LE CATALOGUE EST TRIE PAR NOTORIETE : les N premiers sont le sous-pool.
  const pool: readonly Jeton[] = cartes
    .slice(0, reglage.sousPool)
    // `image` est `string | null` AU TYPE — les trois mille en ont une, mais
    // *un type qui autorise le vide finira par le rencontrer.*
    .map((c) => ({ id: c.id, nom: c.nom, image: c.image ?? '', rarete: c.rarete }))
  const mesure = stats(pool, graphe)

  // LA GRAINE SE TIRE AU CHARGEMENT, comme celle des paquets : `?board&seed=7`
  // rejoue une partie. *Un hasard seede dont la graine est une constante n'est
  // pas un hasard.*
  const demandee = Number(new URLSearchParams(location.search).get('seed') ?? '')
  const graine = Number.isFinite(demandee) && demandee !== 0 ? demandee : (Date.now() ^ (Math.random() * 2 ** 32)) >>> 0
  // `createRng` rend un OBJET (`next`, `getState`) ; le plateau ne veut qu'une
  // source de flottants — *il n'a pas a connaitre la forme du generateur.*
  const alea = createRng(graine >>> 0)
  const rng = (): number => alea.next()

  let p: Plateau = plateauVide(reglage, tirer(pool, reglage.main, rng))
  /** Ce qu'on tient : une carte de la main, ou une case de la grille. */
  let choix: { ou: 'main'; id: string } | { ou: 'grille'; case: number } | null = null
  let prochain = Date.now() + reglage.tick

  function nouvelle(): void {
    p = plateauVide(reglage, tirer(pool, reglage.main, rng))
    choix = null
    prochain = Date.now() + reglage.tick
    dessiner()
  }

  /**
   * LE MEILLEUR BONUS QU'UNE CARTE DE LA MAIN POURRAIT PRENDRE, et à côté de qui.
   *
   * **C'est le MAXIMUM et plus un compte.** Tant que seul un lien direct payait,
   * compter les cartes liées déjà posées disait quelque chose ; *depuis que tout
   * ce qui est joignable rapporte, presque chaque carte en main est liée à
   * presque toute la grille* — un compte dirait « 10 » partout, donc rien.
   *
   * Ce que le joueur doit savoir, c'est **combien vaut son meilleur placement**.
   */
  function meilleur(id: string): { gain: number; qui: string; sauts: number } | null {
    let out: { gain: number; qui: string; sauts: number } | null = null
    for (const j of p.grille) {
      if (j === null) continue
      const sauts = distance(graphe, id, j.id, reglage.portee - 1, cache)
      if (sauts === Infinity || sauts < 1) continue
      const gain = Math.max(0, reglage.portee - sauts)
      if (gain > 0 && (out === null || gain > out.gain)) out = { gain, qui: j.nom, sauts }
    }
    return out
  }

  /** Le mot de la distance. *Un nombre de sauts ne se lit pas, un mot si.* */
  function mot(sauts: number): string {
    if (sauts === 1) return 'lien direct'
    return `${sauts - 1} intermédiaire${sauts > 2 ? 's' : ''}`
  }

  function dessiner(): void {
    const par = productionParCase(p, graphe, cache)
    const cote = reglage.cote
    const taille = Math.max(64, Math.min(120, Math.floor((Math.min(window.innerHeight - 260, 520)) / cote)))
    racine.replaceChildren()

    // ------------------------------------------------------------------ l'en-tete
    const haut = document.createElement('div')
    haut.className = 'bd-haut'
    const total = document.createElement('div')
    total.innerHTML = `<span class="bd-gros">${p.ressource}</span> ressource`
    // LE TOTAL SE DECOMPOSE : « 7 cartes (+7) · 3 paires (+6) ». *Sans ca, le
    // joueur voit un chiffre monter sans savoir ce que son arrangement lui a
    // rapporte* — et c'est precisement la question que ce proto pose.
    const posees = p.grille.filter((j) => j !== null).length
    const payants = couplesQuiPaient(p, graphe, cache)
    const duBonus = payants.reduce((t, c) => t + 2 * c.gain, 0)
    const prod = document.createElement('div')
    prod.innerHTML =
      `<span class="bd-gros">+${production(p, graphe, cache)}</span> / tick` +
      ` <span class="bd-note">= ${posees} carte${posees > 1 ? 's' : ''} (+${posees * reglage.base})` +
      ` + ${payants.length} couple${payants.length > 1 ? 's' : ''} (+${duBonus})</span>`

    // DE QUOI LES COUPLES SONT FAITS : *le total ne dit pas si l'arrangement
    // tient a deux liens directs ou a dix voisinages lointains*, et c'est
    // precisement ce que le joueur cherche a ameliorer.
    const parSaut = new Map<number, number>()
    for (const c of payants) parSaut.set(c.sauts, (parSaut.get(c.sauts) ?? 0) + 1)
    const detail = document.createElement('div')
    detail.className = 'bd-note'
    detail.textContent =
      payants.length === 0
        ? 'aucun couple ne rapporte encore'
        : [...parSaut.entries()]
            .sort((a, b) => a[0] - b[0])
            .map(([sauts, n]) => `${n} × ${mot(sauts)} (+${reglage.portee - sauts} chacune)`)
            .join(' · ')
    const compte = document.createElement('div')
    compte.className = 'bd-note'
    compte.textContent = `prochain tick dans ${Math.max(0, Math.ceil((prochain - Date.now()) / 1000))} s · ${p.ticks} ticks`
    const g = document.createElement('div')
    g.className = 'bd-note'
    g.textContent =
      `pool de ${pool.length} · ${mesure.aretes} arêtes · degré moyen ${mesure.degre.toFixed(1)} · ` +
      `${mesure.isoles} sans lien · densité ${(100 * mesure.p).toFixed(2)} % · graine ${graine}`
    haut.append(total, prod, detail, compte, g)

    // -------------------------------------------------------------------- la grille
    const grille = document.createElement('div')
    grille.className = 'bd-grille'
    grille.style.gridTemplateColumns = `repeat(${cote}, ${taille}px)`
    grille.style.gridAutoRows = `${taille}px`
    for (let i = 0; i < cote * cote; i++) {
      const j = p.grille[i] ?? null
      const b = document.createElement('button')
      b.className = 'bd-case'
      if (j === null) b.classList.add('vide')
      if (choix?.ou === 'grille' && choix.case === i) b.classList.add('choisie')
      // LE LISERE VERT DIT LA SYNERGIE : *un chiffre seul ne dit pas d'ou il
      // vient*, et c'est l'arrangement qu'on veut rendre lisible.
      if (j !== null && (par[i] ?? 0) > reglage.base) b.classList.add('synergie')
      if (j !== null) {
        const img = document.createElement('img')
        img.src = vignette(j.image)
        img.alt = ''
        img.loading = 'lazy'
        const nom = document.createElement('div')
        nom.className = 'bd-nom'
        nom.textContent = j.nom
        const chiffre = document.createElement('div')
        chiffre.className = 'bd-prod'
        chiffre.textContent = String(par[i] ?? 0)
        b.append(img, nom, chiffre)
        // LE SURVOL DECOMPOSE LE CALCUL, VOISIN PAR VOISIN ET AVEC SA DISTANCE :
        // *un chiffre seul ne dit pas d'ou il vient*, et maintenant qu'un couple
        // peut valoir 4, 3, 2 ou 1, le dire globalement ne suffit plus.
        const parts: string[] = []
        let direct = false
        for (const [x, y] of couples(cote)) {
          const autre = x === i ? y : y === i ? x : -1
          if (autre < 0) continue
          const v = p.grille[autre] ?? null
          if (v === null) continue
          const sauts = distance(graphe, j.id, v.id, reglage.portee - 1, cache)
          if (sauts === Infinity || sauts < 1) continue
          const gain = Math.max(0, reglage.portee - sauts)
          if (gain === 0) continue
          if (sauts === 1) direct = true
          parts.push(`+${gain} avec ${v.nom} (${mot(sauts)})`)
        }
        if (direct) b.classList.add('direct')
        b.title =
          `${j.nom} — ${par[i] ?? 0} par tick = ${reglage.base} de base` +
          (parts.length > 0 ? ` ${parts.join(' ')}` : ' (aucune carte joignable à côté)')
      }
      b.addEventListener('click', () => {
        if (choix === null) {
          if (j !== null) choix = { ou: 'grille', case: i }
        } else if (choix.ou === 'main') {
          p = poser(p, choix.id, i)
          choix = null
        } else if (choix.case === i) {
          choix = null
        } else {
          p = deplacer(p, choix.case, i)
          choix = null
        }
        dessiner()
      })
      grille.append(b)
    }

    // ---------------------------------------------------------------------- la main
    const main = document.createElement('div')
    main.className = 'bd-main'
    if (choix?.ou === 'grille') main.classList.add('cible')
    for (const j of p.main) {
      const b = document.createElement('button')
      b.className = 'bd-carte'
      if (choix?.ou === 'main' && choix.id === j.id) b.classList.add('choisie')
      const img = document.createElement('img')
      img.src = vignette(j.image)
      img.alt = ''
      img.loading = 'lazy'
      const nom = document.createElement('span')
      nom.textContent = j.nom
      b.append(img, nom)
      // COMBIEN DE SES VOISINS SONT DEJA SUR LA GRILLE. **C'est de l'affichage,
      // pas une regle** — mais sans lui le joueur ne connait pas le graphe de
      // Wikipedia et poserait au hasard : *il n'y aurait aucune decision a
      // eprouver.* A retirer si Keko veut juger le jeu a l'aveugle.
      const m = meilleur(j.id)
      if (m !== null) {
        const amis = document.createElement('div')
        amis.className = 'bd-amis'
        amis.textContent = `+${m.gain}`
        amis.title =
          `Le mieux que « ${j.nom} » puisse prendre : +${m.gain}, à côté de ` +
          `« ${m.qui} » (${mot(m.sauts)}). C’est un MAXIMUM, pas un total.`
        b.append(amis)
      }
      b.addEventListener('click', () => {
        choix = choix?.ou === 'main' && choix.id === j.id ? null : { ou: 'main', id: j.id }
        dessiner()
      })
      main.append(b)
    }
    // LA MAIN EST UNE DESTINATION : y envoyer une carte de la grille la retire.
    main.addEventListener('click', (e) => {
      if (e.target !== main || choix?.ou !== 'grille') return
      p = retirer(p, choix.case)
      choix = null
      dessiner()
    })

    const corps = document.createElement('div')
    corps.className = 'bd-corps'
    corps.append(grille, main)

    // ------------------------------------------------------------------ les boutons
    const boutons = document.createElement('div')
    boutons.className = 'bd-boutons'
    const bBooster = document.createElement('button')
    bBooster.textContent = `Nouveau booster (+${reglage.booster})`
    bBooster.addEventListener('click', () => {
      p = booster(p, pool, rng)
      dessiner()
    })
    const bNeuf = document.createElement('button')
    bNeuf.textContent = 'Nouvelle partie'
    bNeuf.addEventListener('click', nouvelle)
    const aide = document.createElement('div')
    aide.className = 'bd-note'
    aide.innerHTML =
      `<b>Deux cartes CÔTE À CÔTE sur la grille</b> (haut, bas, gauche, droite — jamais en diagonale) ` +
      `<b>se paient ${reglage.portee} moins le nombre de sauts</b> qui séparent leurs articles sur Wikipédia : ` +
      [...Array(reglage.portee - 1).keys()]
        .map((k) => `<b>${k + 1} saut = +${reglage.portee - k - 1}</b>`)
        .join(', ') +
      `, rien au-delà ni si elles ne se joignent pas. <b>Les deux cartes du couple le gagnent.</b><br>` +
      `<b>Chiffre JAUNE en haut d’une case</b> = ce que cette carte produit (${reglage.base} de base + ses couples). ` +
      `Survole-la pour voir le détail. Liseré <span style="color:#ffd98a">clair</span> = un lien direct, ` +
      `<span style="color:#6ddf8f">vert</span> = un voisinage plus lointain.<br>` +
      `<b>Badge VERT sur une carte en main</b> = le MIEUX qu’elle puisse prendre vu ce qui est déjà posé. ` +
      `Il ne dit pas OÙ : survole-le.<br>` +
      `Clique une carte puis une case pour la poser. Clique une case posée puis une autre pour déplacer, ` +
      `ou le cadre de la main pour la reprendre.`
    boutons.append(bBooster, bNeuf)

    racine.append(haut, corps, boutons, aide)
  }

  dessiner()
  // L'HORLOGE : le tick avance la ressource, et le compte a rebours se redessine
  // chaque seconde. *La production se calcule sur l'etat AU MOMENT du tick.*
  setInterval(() => {
    if (Date.now() >= prochain) {
      p = tic(p, graphe, cache)
      prochain = Date.now() + reglage.tick
    }
    dessiner()
  }, 1000)

  console.info(
    `plateau : pool ${pool.length}, densité ${(100 * mesure.p).toFixed(2)} %, graine ${graine} — ` +
      `?board&pool=N&seed=${graine} rejoue cette partie`,
  )
  void enJeu
}

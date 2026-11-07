/**
 * LA COMMANDE ACTION À L'ÉCRAN — `?commande`, un side project (Keko, 07/11 :
 * « un jeu à commande action, style Paper Mario »). Une scène de théâtre vue
 * de côté : le héros à gauche, l'ennemi à droite ; le menu des attaques, la
 * consigne, les jauges et les écrans sont du DOM, le reste est un canvas.
 *
 * La course passe par une CARTE (Keko : « un peu pauvre en strat long
 * terme ») : un panneau par-dessus la scène, les salles en boutons reliés
 * par des chemins, du premier rang en bas au chef en haut ; le feu de camp,
 * la boutique, l'événement et le choix d'amélioration sont des panneaux ; le
 * sac s'ouvre au-dessus du menu, pendant son tour.
 *
 * Le héros est un PETIT MAGICIEN (Keko : « plutôt un petit magicien ? ») : le
 * personnage du générateur coiffé d'un chapeau pointu, un bâton à la main ;
 * il lance ses sorts de sa place — la boule de feu part du bâton, l'anneau de
 * l'éclair se referme sur l'ennemi et la foudre tombe du ciel, chaque tape
 * des missiles en lance un petit.
 *
 * Les gestes portent l'horodatage de leur événement (`timeStamp`, la même
 * horloge que `performance.now()`) : la règle juge l'instant où le doigt
 * s'est posé, pas celui où la page l'a traité. Au clavier : espace (ou
 * Entrée) pour le geste, 1, 2 et 3 pour les sorts.
 */
import './commande.css'
import { CARTE, type Salle } from '../../logic/commande/carte.ts'
import {
  acheter,
  allerA,
  avancer,
  BONUS,
  choisirLePremierSort,
  COMMANDE as C,
  empecheDAcheter,
  ennemiDe,
  EVENEMENTS,
  lacher,
  lancer as lancerLeSort,
  LES_SORTS,
  nouveauCombat,
  nouvelleCourse,
  OBJETS,
  peutAccepter,
  peutLancer,
  prendre,
  pvMaxDe,
  quitter,
  rangDuBonus,
  repondre,
  sallesAccessibles,
  seReposer,
  sEntrainer,
  SORTS,
  tapesParMissile,
  toucher,
  utiliser,
  type Article,
  type Bonus,
  type EtatCombat,
  type Evenement,
  type Sort,
  type TypeEnnemi,
} from '../../logic/commande/combat.ts'
import { ecrireRecord, lireRecord, sprite } from '../invaders/commun.ts'
import {
  ouvrirLeSon,
  sonArrivee,
  sonBien,
  sonBlesse,
  sonBoule,
  sonButin,
  sonChef,
  sonEclair,
  sonMissile,
  sonObjet,
  sonOr,
  sonPas,
  sonGarde,
  sonKo,
  sonPerdu,
  sonPleine,
  sonRate,
  sonRuee,
  sonTape,
} from './sons.ts'

/** La scène : le héros et l'ennemi, en unités ; le sol est à y = 0, y monte. */
const X_HEROS = -21
const X_ENNEMI = 19
const TAILLE = 17
/** La hauteur où vole le Lutin ailé. */
const VOL = 10
/** Le bout du bâton du magicien, d'où partent les sorts. */
const BATON = { x: X_HEROS + 5, y: TAILLE * 1.02 }
/** La couleur de chaque sort (la pierre du bâton, ses effets). */
const TEINTE: Record<Sort, string> = { feu: '#ff8a3a', eclair: '#8fe0ff', missiles: '#c79bff' }

/** Les personnages du générateur, comme ceux du survivor. */
const ID_HEROS = 'survivant'
const ID_ENNEMI: Record<TypeEnnemi, string> = { brigand: 'heros-12', squelette: 'heros-17', lutin: 'heros-14', brute: 'heros-16', chapardeur: 'monstre-0' }
/** Un chef est plus grand, une élite un peu. */
const TAILLE_CHEF = 1.3
const TAILLE_ELITE = 1.15
/** Les salles de la carte : leur nom, et leur icône (tracée en SVG, 24 × 24). */
const SALLES: Record<Salle, { nom: string; icone: string }> = {
  combat: { nom: 'Combat', icone: 'M5 19L19 5M14 5h5v5M19 19L5 5M5 10V5h5M3 21l3-3M21 21l-3-3' },
  elite: { nom: 'Élite', icone: 'M12 3a7 7 0 0 0-7 7c0 3 2 4 2 6h10c0-2 2-3 2-6a7 7 0 0 0-7-7zM9 19v2M12 19v2M15 19v2M9 10.5h1M14 10.5h1' },
  repos: { nom: 'Feu', icone: 'M12 3c1 4 5 5 5 10a5 5 0 0 1-10 0c0-3 2-4 2-6 2 1 3 3 3 3s-1-4 0-7zM5 21l14-3M5 18l14 3' },
  boutique: { nom: 'Boutique', icone: 'M7 8h10l2 12H5zM9 8a3 3 0 0 1 6 0' },
  evenement: { nom: 'Mystère', icone: 'M9 9a3 3 0 1 1 4 2.8c-.7.3-1 1-1 1.7V15M12 19v.5' },
  chef: { nom: 'Chef', icone: 'M3 8l4 4 5-7 5 7 4-4-2 11H5z' },
}
const SVG = 'http://www.w3.org/2000/svg'
const CLE_RECORD = 'keko-commande-record'

const clamp = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u)
const lisse = (u: number) => {
  const v = clamp(u)
  return v * v * (3 - 2 * v)
}
const melange = (a: number, b: number, u: number) => a + (b - a) * u
/** Une cloche de hauteur `haut` sur u de 0 à 1. */
const cloche = (haut: number, u: number) => 4 * haut * u * (1 - u)

type Eclat = { x: number; y: number; vx: number; vy: number; vie: number; duree: number; couleur: string; taille: number }
type Bulle = { x: number; y: number; texte: string; couleur: string; taille: number; vie: number; duree: number }

/** L'instant d'un geste, en secondes : son horodatage s'il est sur la bonne horloge. */
function instant(ev: Event): number {
  const n = performance.now()
  const t = ev.timeStamp
  return (t > 0 && t <= n + 1 ? t : n) / 1000
}

export function monterCommande(racine: HTMLElement, build: string): void {
  document.documentElement.classList.add('commande-page')
  racine.classList.add('commande')
  const canvas = document.createElement('canvas')
  canvas.className = 'commande-canvas'
  const g = canvas.getContext('2d')!

  function el<K extends keyof HTMLElementTagNameMap>(tag: K, classe: string, texte = ''): HTMLElementTagNameMap[K] {
    const n = document.createElement(tag)
    n.className = classe
    n.textContent = texte
    return n
  }

  // En haut : le héros et l'ennemi, chacun sa jauge.
  const haut = el('div', 'commande-haut')
  function camp(classe: string): { nom: HTMLDivElement; detail: HTMLDivElement; remplie: HTMLDivElement; bloc: HTMLDivElement } {
    const bloc = el('div', `commande-camp ${classe}`)
    const nom = el('div', 'commande-nom')
    const jauge = el('div', 'commande-jauge')
    const remplie = el('div', 'commande-jauge-remplie')
    jauge.append(remplie)
    const detail = el('div', '')
    bloc.append(nom, jauge, detail)
    return { nom, detail, remplie, bloc }
  }
  const campHeros = camp('commande-camp-heros')
  const campEnnemi = camp('commande-camp-ennemi')
  campHeros.nom.textContent = 'Héros'
  haut.append(campHeros.bloc, campEnnemi.bloc)

  const consigne = el('div', 'commande-consigne')
  const menu = el('div', 'commande-menu')
  /** Les sorts du menu, refaits quand on en apprend un. */
  let menuMontre = ''
  function majMenu(): void {
    const cle = e.sorts.join()
    if (cle === menuMontre) return
    menuMontre = cle
    menu.replaceChildren(
      ...e.sorts.map((s) => {
        const b = el('button', `commande-attaque commande-attaque-${s}`)
        b.type = 'button'
        b.append(el('span', 'commande-attaque-nom', SORTS[s].nom), el('span', 'commande-attaque-geste', SORTS[s].geste))
        b.addEventListener('click', () => {
          if (!tropTot()) lancerUnSort(s)
        })
        return b
      }),
    )
  }

  const sac = el('div', 'commande-sac')
  sac.hidden = true
  const ecran = el('div', 'commande-ecran')
  const carteEl = el('div', 'commande-carte')
  carteEl.hidden = true
  const pied = el('div', 'commande-build', `build ${build}`)
  racine.append(canvas, haut, consigne, sac, menu, ecran, carteEl, pied)

  const horloge = () => performance.now() / 1000
  let e: EtatCombat = nouveauCombat(C, 1, horloge())
  let enJeu = false
  /** L'instant où l'écran de fin accepte une tape (pas celle qui tombait déjà). */
  let rejouableA = 0
  const eclats: Eclat[] = []
  const bulles: Bulle[] = []
  let flashHeros = 0
  let flashEnnemi = 0
  let ecrase = 0
  let flashRouge = 0
  let flashOr = 0
  let secousse = 0
  /** Les ruées déjà sifflées dans ce tour. */
  let rueesSifflees = 0

  const imageHeros = () => sprite('perso-pixel', ID_HEROS, 'humain')
  const imageEnnemi = (type: TypeEnnemi) => sprite('perso-pixel', ID_ENNEMI[type], 'humain')
  imageHeros()
  for (const k of Object.keys(ID_ENNEMI) as TypeEnnemi[]) imageEnnemi(k)
  let record = lireRecord(CLE_RECORD)

  // ---------------------------------------------------------------- le cadre

  let dpr = 1
  let echelle = 1
  let sol = 0
  function cadrer(): void {
    dpr = Math.min(2, window.devicePixelRatio || 1)
    const w = window.innerWidth
    const h = window.innerHeight
    canvas.width = Math.round(w * dpr)
    canvas.height = Math.round(h * dpr)
    canvas.style.width = `${w}px`
    canvas.style.height = `${h}px`
    echelle = Math.min(w / 70, h / 100) * dpr
    sol = canvas.height * 0.58
  }
  cadrer()
  window.addEventListener('resize', cadrer)
  let ox = 0
  let oy = 0
  const sx = (x: number) => canvas.width / 2 + (x + ox) * echelle
  const sy = (y: number) => sol - (y + oy) * echelle

  // ---------------------------------------------------------------- les écrans

  function montrerEcran(titre: string, texte: string, go: string): void {
    ecran.classList.remove('commande-ecran-panneau')
    ecran.replaceChildren(el('div', 'commande-titre', titre), el('div', 'commande-texte', texte), el('div', 'commande-go', go))
    ecran.hidden = false
  }

  /**
   * LE CLIC FANTÔME : la tape qui ouvre un écran est suivie, au lâcher, d'un
   * clic que le navigateur envoie au même endroit — sur l'écran qui vient de
   * s'ouvrir (« Touchez pour jouer » choisissait ainsi le premier sort tout
   * seul). Un bouton qui vient d'apparaître ignore donc les clics un instant.
   */
  let ouvertA = 0
  const ouvrir = () => (ouvertA = performance.now())
  const tropTot = () => performance.now() - ouvertA < 400

  /** Un panneau qui prend la tape : le choix, le feu, la boutique, l'événement. */
  function montrerPanneau(...enfants: HTMLElement[]): void {
    ouvrir()
    ecran.classList.add('commande-ecran-panneau')
    ecran.replaceChildren(...enfants)
    ecran.hidden = false
  }
  function fermerLePanneau(): void {
    if (!ecran.classList.contains('commande-ecran-panneau')) return
    ecran.classList.remove('commande-ecran-panneau')
    ecran.hidden = true
  }

  /** Une carte de choix : un nom, un effet, une ligne en petit. */
  function carteDeChoix(nom: string, effet: string, petit: string, action: () => void, empeche: string | null = null): HTMLButtonElement {
    const carte = el('button', 'commande-choix')
    carte.type = 'button'
    carte.append(el('span', 'commande-choix-nom', nom), el('span', 'commande-choix-effet', effet), el('span', 'commande-choix-rang', empeche ?? petit))
    carte.disabled = empeche !== null
    carte.addEventListener('click', () => {
      if (tropTot()) return
      ouvrirLeSon()
      action()
    })
    return carte
  }
  function boutonSimple(texte: string, action: () => void, desactive = false): HTMLButtonElement {
    const b = el('button', 'commande-bouton', texte)
    b.type = 'button'
    b.disabled = desactive
    b.addEventListener('click', () => {
      if (tropTot()) return
      ouvrirLeSon()
      action()
    })
    return b
  }
  const liste = (...cartes: HTMLElement[]) => {
    const l = el('div', 'commande-offre')
    l.append(...cartes)
    return l
  }
  const etatDuHeros = () => `PV ${e.pv} / ${pvMaxDe(C, e)} · ${e.or} or`

  function bilan(): string {
    const s = e.stats
    return `Éclairs : ${s.eclairs} · Boules chargées : ${s.charges} · Missiles : ${s.missiles} · Gardes : ${s.gardes} · Parades parfaites : ${s.parfaites}`
  }

  function lancer(): void {
    ouvrirLeSon()
    // `&acte=N` commence la course à l'acte N (pour tester sans jouer les premiers).
    const acte = Math.max(1, Math.floor(Number(new URLSearchParams(location.search).get('acte'))) || 1)
    e = nouvelleCourse(C, (Math.random() * 2 ** 32) >>> 0, horloge(), acte)
    phaseMontree = ''
    enJeu = true
    rueesSifflees = 0
    eclats.length = 0
    bulles.length = 0
    ecran.hidden = true
  }

  montrerEcran(
    'Commande action',
    `Un petit magicien, des sorts au tour par tour : le bon geste au bon moment frappe plus fort, et pare les coups. Choisissez votre route jusqu’au chef, et montez le plus haut possible.${record > 0 ? ` Record : étage ${record}.` : ''}`,
    'Touchez pour jouer',
  )

  const rangTexte = (b: Bonus) => (b === 'repas' ? '' : rangDuBonus(e, b) === 0 ? 'Nouveau' : `Niveau ${rangDuBonus(e, b) + 1}`)

  /** Ce que la dernière victoire a rapporté (pour le dire au choix). */
  let dernierButin: Extract<Evenement, { type: 'butin' }> | null = null

  /** Le choix de l'amélioration : après une victoire, au feu de camp, à l'autel. */
  function montrerLeButin(apresCombat: boolean): void {
    const offre = e.offre.map((b: Bonus, i: number) =>
      carteDeChoix(BONUS[b].nom, BONUS[b].effet, rangTexte(b), () => {
        if (e.phase !== 'butin') return
        for (const x of prendre(C, e, i, horloge())) vivre(x)
      }),
    )
    const gains: string[] = []
    // L'autel : ce qu'il en a coûté.
    if (!apresCombat && e.evenement?.issue) gains.push(e.evenement.issue.replace(/[.…]$/, ''))
    if (apresCombat && dernierButin !== null) {
      if (dernierButin.soin > 0) gains.push(`+${dernierButin.soin} PV`)
      gains.push(`+${dernierButin.or} or`)
      if (dernierButin.objet !== null) gains.push(`${OBJETS[dernierButin.objet].nom.toLowerCase()} dans le sac`)
    }
    montrerPanneau(
      el('div', 'commande-sous-titre', apresCombat ? `Étage ${e.etage} franchi` : 'Une amélioration'),
      el('div', 'commande-texte', `${gains.length > 0 ? `${gains.join(' · ')}. ` : ''}Choisissez une amélioration.`),
      liste(...offre),
    )
  }

  /** Le premier sort, au départ : un seul, les autres s'apprennent en route. */
  function montrerLeGrimoire(): void {
    montrerPanneau(
      el('div', 'commande-sous-titre', 'Votre premier sort'),
      el('div', 'commande-texte', 'Le magicien n’en connaît qu’un au départ ; les autres s’apprennent en route.'),
      liste(
        ...LES_SORTS.map((s) =>
          carteDeChoix(SORTS[s].nom, SORTS[s].effet, SORTS[s].geste, () => {
            choisirLePremierSort(e, s, horloge())
          }),
        ),
      ),
    )
  }

  /** La carte de l'acte : les salles du premier rang en bas, le chef en haut, les chemins entre elles. */
  function montrerLaCarte(): void {
    const ouvertes = sallesAccessibles(e)
    const passee = (r: number, i: number) => e.chemin.some((p) => p.rang === r && p.i === i)
    const ouverte = (r: number, i: number) => ouvertes.some((p) => p.rang === r && p.i === i)
    const ici = (r: number, i: number) => e.place !== null && e.place.rang === r && e.place.i === i
    const ou = (r: number, x: number) => ({ x: 12 + x * 76, y: 94 - (r / (CARTE.rangs - 1)) * 86 })
    const plateau = el('div', 'commande-plateau')
    const traits = document.createElementNS(SVG, 'svg')
    traits.setAttribute('class', 'commande-chemins')
    traits.setAttribute('viewBox', '0 0 100 100')
    traits.setAttribute('preserveAspectRatio', 'none')
    e.carte.forEach((rang, r) =>
      rang.forEach((n, i) => {
        for (const j of n.suivants) {
          const a = ou(r, n.x)
          const b = ou(r + 1, e.carte[r + 1][j].x)
          const trait = document.createElementNS(SVG, 'line')
          trait.setAttribute('x1', String(a.x))
          trait.setAttribute('y1', String(a.y))
          trait.setAttribute('x2', String(b.x))
          trait.setAttribute('y2', String(b.y))
          const pris = passee(r, i) && passee(r + 1, j)
          trait.setAttribute('class', pris ? 'commande-chemin-pris' : ici(r, i) ? 'commande-chemin-ouvert' : 'commande-chemin')
          traits.append(trait)
        }
      }),
    )
    plateau.append(traits)
    e.carte.forEach((rang, r) =>
      rang.forEach((n, i) => {
        const p = ou(r, n.x)
        const b = el('button', `commande-salle commande-salle-${n.salle}`)
        b.type = 'button'
        b.style.left = `${p.x}%`
        b.style.top = `${p.y}%`
        if (ouverte(r, i)) b.classList.add('commande-salle-ouverte')
        else if (passee(r, i)) b.classList.add('commande-salle-passee')
        else b.disabled = true
        if (ici(r, i)) b.classList.add('commande-salle-ici')
        const icone = document.createElementNS(SVG, 'svg')
        icone.setAttribute('viewBox', '0 0 24 24')
        icone.setAttribute('class', 'commande-salle-icone')
        const trace = document.createElementNS(SVG, 'path')
        trace.setAttribute('d', SALLES[n.salle].icone)
        icone.append(trace)
        b.append(icone, el('span', 'commande-salle-nom', SALLES[n.salle].nom))
        b.addEventListener('click', () => {
          if (!ouverte(r, i) || tropTot()) return
          ouvrirLeSon()
          sonPas()
          for (const x of allerA(C, e, { rang: r, i }, horloge())) vivre(x)
        })
        plateau.append(b)
      }),
    )
    const sacTexte = e.objets.length > 0 ? e.objets.map((o) => OBJETS[o].nom).join(', ') : 'vide'
    const tete = el('div', 'commande-carte-tete')
    tete.append(el('div', 'commande-carte-titre', `Acte ${e.acte}`), el('div', 'commande-texte', `${etatDuHeros()} · Sac : ${sacTexte}`), el('div', 'commande-carte-consigne', 'Choisissez votre route'))
    carteEl.replaceChildren(tete, plateau)
    ouvrir()
  }

  function montrerLeFeu(): void {
    const soin = Math.min(Math.round(pvMaxDe(C, e) * C.salles.feu), pvMaxDe(C, e) - e.pv)
    montrerPanneau(
      el('div', 'commande-sous-titre', 'Feu de camp'),
      el('div', 'commande-texte', etatDuHeros()),
      liste(
        carteDeChoix('Se reposer', soin > 0 ? `+${soin} PV` : 'Déjà en pleine forme', '', () => {
          if (seReposer(C, e, horloge()) > 0) bulle(X_HEROS, TAILLE + 6, `+${soin} PV`, '#a6f07a', 3.6, 900)
        }),
        carteDeChoix('S’entraîner', 'Une amélioration au choix', '', () => sEntrainer(C, e, horloge())),
      ),
    )
  }

  function nomDeLArticle(a: Article): [string, string, string] {
    if (a.sorte === 'bonus') return [BONUS[a.bonus].nom, BONUS[a.bonus].effet, rangTexte(a.bonus)]
    if (a.sorte === 'objet') return [OBJETS[a.objet].nom, OBJETS[a.objet].effet, 'Objet']
    return ['Soin', `+${C.salles.soin} PV`, '']
  }

  function montrerLaBoutique(): void {
    const articles = e.boutique.map((a, i) => {
      const [nom, effet, petit] = nomDeLArticle(a)
      const empeche = empecheDAcheter(C, e, i)
      const carte = carteDeChoix(nom, effet, petit, () => {
        if (acheter(C, e, i)) {
          sonOr()
          montrerLaBoutique()
        }
      }, empeche)
      carte.append(el('span', 'commande-prix', a.vendu ? '' : `${a.prix} or`))
      return carte
    })
    montrerPanneau(
      el('div', 'commande-sous-titre', 'Boutique'),
      el('div', 'commande-texte', etatDuHeros()),
      liste(...articles),
      boutonSimple('Partir', () => {
        for (const x of quitter(e, horloge())) vivre(x)
      }),
    )
  }

  function montrerLEvenement(): void {
    const ev = e.evenement
    if (ev === null) return
    const fiche = EVENEMENTS[ev.cle]
    if (ev.issue !== null) {
      montrerPanneau(
        el('div', 'commande-sous-titre', fiche.titre),
        el('div', 'commande-texte', ev.issue),
        el('div', 'commande-texte', etatDuHeros()),
        boutonSimple('Continuer', () => {
          for (const x of quitter(e, horloge())) vivre(x)
        }),
      )
      return
    }
    const choix = el('div', 'commande-boutons')
    choix.append(
      boutonSimple(fiche.accepter, () => {
        repondre(C, e, true, horloge())
        if (e.phase === 'evenement') montrerLEvenement()
      }, !peutAccepter(C, e)),
      boutonSimple('Partir', () => {
        repondre(C, e, false, horloge())
        montrerLEvenement()
      }),
    )
    montrerPanneau(el('div', 'commande-sous-titre', fiche.titre), el('div', 'commande-texte', fiche.texte), el('div', 'commande-texte', etatDuHeros()), choix)
  }

  /** La phase a changé : la carte, le panneau qu'il faut. */
  let phaseMontree = ''
  function suivreLaPhase(): void {
    if (!enJeu || e.phase === phaseMontree) return
    const precedente = phaseMontree
    phaseMontree = e.phase
    carteEl.hidden = e.phase !== 'carte'
    if (e.phase === 'carte') {
      fermerLePanneau()
      montrerLaCarte()
    } else if (e.phase === 'depart') montrerLeGrimoire()
    else if (e.phase === 'repos') montrerLeFeu()
    else if (e.phase === 'boutique') montrerLaBoutique()
    else if (e.phase === 'evenement') montrerLEvenement()
    else if (e.phase === 'butin') {
      // Après un combat, on laisse l'ennemi tomber avant d'ouvrir le choix.
      if (precedente === 'ko')
        setTimeout(() => {
          if (e.phase === 'butin') montrerLeButin(true)
        }, 500)
      else montrerLeButin(false)
    } else fermerLePanneau()
  }

  /** Le sac, au-dessus du menu : un bouton par objet. */
  let sacMontre = ''
  function majSac(visible: boolean): void {
    const cle = visible ? e.objets.join() : ''
    if (cle === sacMontre) return
    sacMontre = cle
    sac.replaceChildren(
      ...(visible ? e.objets : []).map((o, i) => {
        const b = el('button', 'commande-objet')
        b.type = 'button'
        b.append(el('span', 'commande-objet-nom', OBJETS[o].nom), el('span', 'commande-objet-effet', OBJETS[o].effet))
        b.addEventListener('click', () => {
          if (tropTot()) return
          ouvrirLeSon()
          for (const x of utiliser(C, e, i, horloge())) vivre(x)
        })
        return b
      }),
    )
    sac.hidden = !visible || e.objets.length === 0
  }

  function lancerUnSort(s: Sort): void {
    if (!enJeu || !peutLancer(e, s)) return
    ouvrirLeSon()
    lancerLeSort(C, e, s, horloge())
  }

  // ---------------------------------------------------------------- les gestes

  function geste(ev: Event): void {
    if (!enJeu) {
      if (horloge() >= rejouableA) lancer()
      return
    }
    ouvrirLeSon()
    for (const x of toucher(C, e, instant(ev))) vivre(x)
  }
  function lever(ev: Event): void {
    if (enJeu) for (const x of lacher(C, e, instant(ev))) vivre(x)
  }
  canvas.addEventListener('pointerdown', (ev) => {
    canvas.setPointerCapture(ev.pointerId)
    geste(ev)
  })
  canvas.addEventListener('pointerup', lever)
  canvas.addEventListener('pointercancel', lever)
  ecran.addEventListener('pointerdown', geste)
  window.addEventListener('keydown', (ev) => {
    if (ev.repeat) return
    if (ev.key === ' ' || ev.key === 'Enter') {
      ev.preventDefault()
      geste(ev)
    } else if (ev.key >= '1' && ev.key <= '3') {
      const s = e.sorts[Number(ev.key) - 1]
      if (s !== undefined) lancerUnSort(s)
    }
  })
  window.addEventListener('keyup', (ev) => {
    if (ev.key === ' ' || ev.key === 'Enter') lever(ev)
  })

  // ---------------------------------------------------------------- les effets

  function eclater(x: number, y: number, couleur: string, n: number, force: number): void {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2
      const v = force * (0.4 + Math.random() * 0.6)
      eclats.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v + force * 0.4, vie: 0, duree: 350 + Math.random() * 300, couleur, taille: 0.4 + Math.random() * 0.6 })
    }
  }
  function bulle(x: number, y: number, texte: string, couleur = '#ffffff', taille = 3.4, duree = 700): void {
    bulles.push({ x, y, texte, couleur, taille, vie: 0, duree })
  }
  function vibrer(ms: number): void {
    try {
      navigator.vibrate?.(ms)
    } catch {
      // Sans vibreur, rien.
    }
  }
  const tailleEnnemi = () => TAILLE * (e.ennemi.estChef ? TAILLE_CHEF : e.salle === 'elite' ? TAILLE_ELITE : 1)
  const teteEnnemi = () => (ennemiDe(C, e).volant ? VOL : 0) + tailleEnnemi() * 0.8

  /** La foudre tombée, les missiles en vol : dessinés le temps de leur vie (en secondes, à l'horloge de la page). */
  const foudres: { t: number; points: [number, number][] }[] = []
  const projectiles: { t: number; gros: boolean; dy: number }[] = []
  function foudre(t: number): void {
    const points: [number, number][] = []
    const haut = 70
    const bas = teteEnnemi() - 2
    for (let i = 0; i <= 7; i++) points.push([X_ENNEMI + (i === 0 || i === 7 ? 0 : (Math.random() - 0.5) * 7), haut + ((bas - haut) * i) / 7])
    foudres.push({ t, points })
  }

  function vivre(ev: Evenement): void {
    const yTete = teteEnnemi()
    const t = horloge()
    switch (ev.type) {
      case 'bien':
        sonBien(ev.serie)
        vibrer(10)
        bulle(X_ENNEMI, yTete + 9, ev.serie >= 4 ? 'Superbe !' : ev.serie >= 2 ? 'Encore !' : 'Bien !', '#8fe0ff', 3.2 + ev.serie * 0.3)
        break
      case 'rate':
        sonRate()
        bulle(X_ENNEMI - 6, yTete + 9, 'Trop tôt', '#b9b3c9', 3)
        break
      case 'eclair':
        sonEclair()
        foudre(t)
        ecrase = 1
        flashEnnemi = 1
        flashOr = Math.max(flashOr, 0.35)
        secousse = Math.max(secousse, 0.4)
        bulle(X_ENNEMI + 6, yTete - 2, String(ev.degats), '#8fe0ff', 4.2)
        eclater(X_ENNEMI, yTete, '#d8f4ff', 9, 16)
        break
      case 'pleine':
        sonPleine()
        eclater(BATON.x, BATON.y, '#ffd27a', 10, 10)
        break
      case 'boule': {
        sonBoule(ev.fort)
        flashEnnemi = 1
        ecrase = 1
        bulle(X_ENNEMI + 6, yTete - 2, String(ev.degats), ev.fort ? '#ffd27a' : '#ff6a5a', ev.fort ? 6 : 4)
        eclater(X_ENNEMI - 2, TAILLE * 0.5, ev.fort ? '#ffb030' : '#ff8a3a', ev.fort ? 26 : 10, ev.fort ? 28 : 16)
        if (ev.fort) {
          vibrer(35)
          secousse = 1
          flashOr = 1
          bulle(X_ENNEMI - 4, yTete + 9, 'Excellent !', '#ffd27a', 4.6, 900)
        } else {
          const f = e.feu
          const mot = f.appui === null ? 'Trop lent' : (f.frappe ?? 0) - f.appui < C.feu.charge ? 'Trop tôt' : 'Trop tard'
          bulle(X_ENNEMI - 6, yTete + 9, mot, '#b9b3c9', 3)
          secousse = Math.max(secousse, 0.3)
        }
        break
      }
      case 'tape':
        sonTape(ev.taps, ev.missile)
        projectiles.push({ t, gros: ev.missile, dy: (Math.random() - 0.5) * 8 })
        break
      case 'missile':
        sonMissile()
        flashEnnemi = 1
        ecrase = Math.max(ecrase, 0.5)
        bulle(X_ENNEMI + 4 + Math.random() * 4, yTete - 2 + Math.random() * 3, String(ev.degats), '#c79bff', 3.6, 500)
        eclater(X_ENNEMI - 2, TAILLE * 0.55, '#e2ccff', 5, 12)
        break
      case 'garde':
        if (ev.qualite === 'trop-tot') bulle(X_HEROS, TAILLE + 6, 'Trop tôt', '#b9b3c9', 3)
        break
      case 'coup':
        if (ev.garde === 'parfaite') {
          sonGarde(true)
          vibrer(15)
          flashOr = 1
          bulle(X_HEROS + 2, TAILLE + 7, 'Parfait !', '#ffd27a', 4.6, 900)
          eclater(X_HEROS + 6, TAILLE * 0.5, '#ffd27a', 18, 22)
        } else if (ev.garde === 'garde') {
          sonGarde(false)
          vibrer(20)
          bulle(X_HEROS + 2, TAILLE + 7, 'Garde !', '#d8ecff', 4, 800)
          eclater(X_HEROS + 6, TAILLE * 0.5, '#d8ecff', 12, 18)
        } else {
          sonBlesse()
          vibrer(60)
          flashRouge = 1
          secousse = 0.8
        }
        if (ev.degats > 0) {
          flashHeros = 1
          bulle(X_HEROS - 5, TAILLE + 1, `-${ev.degats}`, '#ff6a5a', 4.2)
        }
        break
      case 'riposte':
        flashEnnemi = 1
        bulle(X_ENNEMI + 6, yTete - 2, String(ev.degats), '#ffd27a', 4.2)
        break
      case 'ko':
        sonKo()
        eclater(X_ENNEMI, TAILLE * 0.5, '#ffffff', 16, 20)
        break
      case 'tour':
        rueesSifflees = 0
        break
      case 'arrivee':
        if (ev.chef) {
          sonChef()
          bulle(X_ENNEMI - 6, TAILLE * TAILLE_CHEF + 6, 'Un chef !', '#ffd27a', 4.4, 1100)
        } else if (ev.elite) {
          sonChef()
          bulle(X_ENNEMI - 6, TAILLE * TAILLE_ELITE + 6, 'Une élite !', '#ff8a7a', 4.2, 1100)
        } else sonArrivee()
        break
      case 'butin':
        sonButin()
        sonOr()
        dernierButin = ev
        if (ev.soin > 0) bulle(X_HEROS, TAILLE + 6, `+${ev.soin} PV`, '#a6f07a', 3.6, 900)
        bulle(X_HEROS, TAILLE + 11, `+${ev.or} or`, '#ffd27a', 3.6, 900)
        break
      case 'objet':
        sonObjet(ev.objet)
        if (ev.objet === 'potion') bulle(X_HEROS, TAILLE + 6, `+${C.salles.potion} PV`, '#a6f07a', 3.8, 900)
        else if (ev.objet === 'bombe') {
          flashEnnemi = 1
          secousse = 1
          flashOr = 0.6
          eclater(X_ENNEMI, TAILLE * 0.5, '#ffb030', 26, 30)
          bulle(X_ENNEMI + 6, yTete - 2, String(ev.degats), '#ffd27a', 5)
        } else if (ev.objet === 'fumigene') {
          eclater(X_ENNEMI, TAILLE * 0.5, '#b9b3c9', 30, 12)
          bulle(X_ENNEMI - 6, yTete + 8, 'Fumée !', '#d8d2e6', 4, 900)
        } else bulle(X_HEROS, TAILLE + 6, 'Piment !', '#ff6a5a', 4, 900)
        break
      case 'fumee':
        bulle(X_ENNEMI - 6, yTete + 8, 'Il tousse…', '#d8d2e6', 3.6, 900)
        break
      case 'perdu': {
        sonPerdu()
        enJeu = false
        rejouableA = horloge() + 1.2
        const nouveau = e.etage > record
        if (nouveau) {
          record = e.etage
          ecrireRecord(CLE_RECORD, record)
        }
        setTimeout(
          () =>
            montrerEcran(
              'Le magicien est tombé',
              `Acte ${e.acte}, étage ${e.etage}, contre : ${ennemiDe(C, e).nom}. ${nouveau ? 'Nouveau record !' : `Record : étage ${record}.`} ${bilan()}.`,
              'Touchez pour rejouer',
            ),
          800,
        )
        break
      }
    }
  }

  // ---------------------------------------------------------------- les positions

  function poseDeLEnnemi(t: number): { x: number; y: number; penche: number; alpha: number } {
    const en = ennemiDe(C, e)
    const haut = en.volant ? VOL + Math.sin(t * 4) * 1.2 : 0
    if (e.pvEnnemi <= 0) {
      const u = clamp((t - e.koA) / 0.6)
      return { x: X_ENNEMI + 6 * u, y: haut * (1 - u), penche: 1.4 * lisse(u), alpha: 1 - u }
    }
    if (e.phase === 'arrivee') return { x: X_ENNEMI + 50 * (1 - lisse((t - e.debut) / C.arrivee)), y: haut, penche: 0, alpha: 1 }
    if (e.phase === 'ennemi') {
      for (const k of e.coups) {
        const ruee = k.impact - C.ennemi.ruee
        if (t >= k.elan && t < ruee) {
          // L'élan : il recule et se ramasse ; il tremble juste avant de partir.
          const u = (t - k.elan) / (ruee - k.elan)
          const tremble = u > 0.75 ? Math.sin(t * 90) * 0.35 : 0
          return { x: X_ENNEMI + 3 * lisse(u) + tremble, y: haut, penche: 0.18 * lisse(u), alpha: 1 }
        }
        if (t >= ruee && t < k.impact) {
          const u = (t - ruee) / C.ennemi.ruee
          return { x: melange(X_ENNEMI + 3, X_HEROS + 8, u * u), y: en.volant ? melange(haut, 3, u) : 0, penche: -0.3, alpha: 1 }
        }
        if (t >= k.impact && t < k.impact + C.ennemi.recul) {
          const u = (t - k.impact) / C.ennemi.recul
          const repousse = k.garde === 'parfaite' ? 1.6 : 1
          return { x: melange(X_HEROS + 8, X_ENNEMI, lisse(u * repousse)), y: melange(en.volant ? 3 : 0, haut, u) + cloche(k.garde === 'parfaite' ? 8 : 3, u), penche: k.garde === 'parfaite' ? -2 * u : 0, alpha: 1 }
        }
      }
    }
    return { x: X_ENNEMI, y: haut, penche: 0, alpha: 1 }
  }

  /** Le centre du corps de l'ennemi, là où visent les sorts. */
  const coeurDeLEnnemi = () => ({ x: X_ENNEMI, y: (ennemiDe(C, e).volant ? VOL : 0) + tailleEnnemi() * 0.45 })

  // ---------------------------------------------------------------- le dessin

  function dessinerLaScene(w: number, h: number): void {
    const ciel = g.createLinearGradient(0, 0, 0, sol)
    ciel.addColorStop(0, '#1b1430')
    ciel.addColorStop(1, '#4a2f5a')
    g.fillStyle = ciel
    g.fillRect(0, 0, w, h)
    // Le projecteur sur les planches.
    const lampe = g.createRadialGradient(w / 2, sol, 0, w / 2, sol, w * 0.7)
    lampe.addColorStop(0, 'rgba(255, 230, 170, 0.28)')
    lampe.addColorStop(1, 'rgba(255, 230, 170, 0)')
    g.fillStyle = lampe
    g.fillRect(0, 0, w, h)
    // Les planches.
    const bois = g.createLinearGradient(0, sol, 0, h)
    bois.addColorStop(0, '#8a5a32')
    bois.addColorStop(1, '#3a2414')
    g.fillStyle = bois
    g.fillRect(0, sol, w, h - sol)
    g.strokeStyle = 'rgba(0, 0, 0, 0.25)'
    g.lineWidth = Math.max(1, 0.2 * echelle)
    const planche = 3.2 * echelle
    for (let i = 1, y = sol + planche; y < h; i++, y += planche * (1 + i * 0.25)) {
      g.beginPath()
      g.moveTo(0, y)
      g.lineTo(w, y)
      g.stroke()
    }
    g.fillStyle = 'rgba(255, 220, 160, 0.35)'
    g.fillRect(0, sol, w, Math.max(1, 0.35 * echelle))
    // Les rideaux, de part et d'autre, et le lambrequin en haut.
    const large = w * 0.06
    for (const cote of [0, 1]) {
      const x0 = cote === 0 ? 0 : w - large
      const r = g.createLinearGradient(x0, 0, x0 + large, 0)
      const plis = 4
      for (let i = 0; i <= plis * 2; i++) r.addColorStop(i / (plis * 2), i % 2 === 0 ? '#5e0f1c' : '#a3243a')
      g.fillStyle = r
      g.fillRect(x0, 0, large, sol + 0.6 * echelle)
    }
    const bande = Math.max(h * 0.05, 3 * echelle)
    g.fillStyle = '#8a1c2a'
    g.fillRect(0, 0, w, bande)
    const festons = Math.ceil(w / (bande * 1.6))
    for (let i = 0; i < festons; i++) {
      const cx = (i + 0.5) * (w / festons)
      g.beginPath()
      g.ellipse(cx, bande, w / festons / 2, bande * 0.45, 0, 0, Math.PI)
      g.fill()
    }
    g.strokeStyle = '#d9a646'
    g.lineWidth = Math.max(2, 0.4 * echelle)
    for (let i = 0; i < festons; i++) {
      const cx = (i + 0.5) * (w / festons)
      g.beginPath()
      g.ellipse(cx, bande, w / festons / 2, bande * 0.45, 0, 0, Math.PI)
      g.stroke()
    }
  }

  function ombre(x: number, y: number): void {
    const r = TAILLE * 0.32 * (1 - Math.min(0.6, y / 40))
    g.fillStyle = 'rgba(0, 0, 0, 0.35)'
    g.beginPath()
    g.ellipse(sx(x), sy(0), r * echelle, r * 0.3 * echelle, 0, 0, Math.PI * 2)
    g.fill()
  }

  /** Un personnage, les pieds à (x, y). */
  function personnage(img: HTMLImageElement | null, x: number, y: number, regard: number, penche: number, blanc: number, etire = 1, taille = TAILLE): void {
    if (img === null) return
    const t = taille * echelle
    g.save()
    g.translate(sx(x), sy(y))
    g.rotate(penche * regard)
    g.scale(regard / Math.sqrt(etire), etire)
    g.drawImage(img, -t / 2, -t * 0.92, t, t)
    if (blanc > 0) {
      g.globalCompositeOperation = 'lighter'
      g.globalAlpha = blanc
      g.drawImage(img, -t / 2, -t * 0.92, t, t)
    }
    g.restore()
  }

  function dessinerLEnnemi(t: number): void {
    const en = ennemiDe(C, e)
    const p = poseDeLEnnemi(t)
    if (p.alpha <= 0) return
    const tE = tailleEnnemi()
    ombre(p.x, p.y)
    g.globalAlpha = p.alpha
    if (en.volant) {
      // Les ailes, qui battent.
      const bat = Math.sin(t * 22) * 0.5
      g.fillStyle = 'rgba(210, 235, 255, 0.75)'
      for (const s of [-1, 1]) {
        g.save()
        g.translate(sx(p.x + s * 1.5), sy(p.y + tE * 0.55))
        g.rotate(s * (0.6 + bat))
        g.beginPath()
        g.ellipse(s * 3 * echelle, 0, 3.4 * echelle, 1.6 * echelle, 0, 0, Math.PI * 2)
        g.fill()
        g.restore()
      }
    }
    personnage(imageEnnemi(en.type), p.x, p.y, -1, p.penche, flashEnnemi, 1 - ecrase * 0.25, tE)
    g.globalAlpha = 1
  }

  /** Le sort en cours (la pierre du bâton en prend la couleur). */
  const sortEnCours = (): Sort | null => (e.phase === 'feu' || e.phase === 'eclair' || e.phase === 'missiles' ? e.phase : null)

  function rond(x: number, y: number, r: number, couleur: string, lueur = 0): void {
    g.fillStyle = couleur
    if (lueur > 0) {
      g.shadowColor = couleur
      g.shadowBlur = lueur * echelle
    }
    g.beginPath()
    g.arc(sx(x), sy(y), r * echelle, 0, Math.PI * 2)
    g.fill()
    g.shadowBlur = 0
  }

  /** Le petit magicien : le personnage, son chapeau pointu, son bâton. */
  function dessinerLeHeros(t: number): void {
    const x = X_HEROS
    const lance = sortEnCours() !== null
    const respire = Math.sin(t * 3) * 0.02
    ombre(x, 0)
    personnage(imageHeros(), x, 0, 1, lance ? -0.06 : 0, flashHeros, 1 + respire)
    const yt = TAILLE * (0.8 + respire)
    // Le chapeau : un bord, un cône qui penche, une étoile.
    g.fillStyle = '#4b2a8a'
    g.strokeStyle = '#1e1038'
    g.lineWidth = Math.max(1, 0.3 * echelle)
    g.beginPath()
    g.ellipse(sx(x), sy(yt), 5.2 * echelle, 1.3 * echelle, 0, 0, Math.PI * 2)
    g.fill()
    g.stroke()
    const plie = Math.sin(t * 2.2) * 0.6 - 1.5
    g.beginPath()
    g.moveTo(sx(x - 3.4), sy(yt + 0.3))
    g.quadraticCurveTo(sx(x - 0.5), sy(yt + 7), sx(x + plie), sy(yt + 9.5))
    g.quadraticCurveTo(sx(x + 1.2), sy(yt + 6), sx(x + 3.4), sy(yt + 0.3))
    g.closePath()
    g.fill()
    g.stroke()
    g.fillStyle = '#ffd27a'
    g.font = `800 ${2.2 * echelle}px sans-serif`
    g.textAlign = 'center'
    g.fillText('★', sx(x - 0.3), sy(yt + 2.6))
    // Le bâton, et sa pierre.
    g.strokeStyle = '#6b4424'
    g.lineWidth = 0.9 * echelle
    g.lineCap = 'round'
    g.beginPath()
    g.moveTo(sx(x + 3.6), sy(0.6))
    g.lineTo(sx(BATON.x), sy(BATON.y - 1))
    g.stroke()
    const s = sortEnCours()
    const pierre = s !== null ? TEINTE[s] : '#b8a8ff'
    rond(BATON.x, BATON.y, 1.2 + (s !== null ? Math.sin(t * 12) * 0.2 : 0), pierre, s !== null ? 3 : 1.5)
    // Le bouclier magique, levé un instant à chaque tape de garde.
    if (e.phase === 'ennemi' && t - e.gardeA < 0.25) {
      const u = (t - e.gardeA) / 0.25
      g.globalAlpha = 1 - u * u
      g.strokeStyle = '#bfe6ff'
      g.fillStyle = 'rgba(150, 210, 255, 0.25)'
      g.lineWidth = Math.max(1, 0.5 * echelle)
      g.beginPath()
      g.arc(sx(x + 1), sy(TAILLE * 0.5), (TAILLE * 0.62 + u * 2) * echelle, -Math.PI / 2.4, Math.PI / 2.4)
      g.fill()
      g.stroke()
      g.globalAlpha = 1
    }
  }

  function etoile(cx: number, cy: number, r: number): void {
    g.beginPath()
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + (i * Math.PI) / 5
      const rr = i % 2 === 0 ? r : r * 0.45
      g.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr)
    }
    g.closePath()
    g.fill()
  }

  /** Les sorts à l'écran : la boule de feu qui se charge et part, l'anneau de l'éclair et la foudre, la salve. */
  function dessinerLesSorts(t: number): void {
    const cible = coeurDeLEnnemi()
    if (e.phase === 'feu') {
      const f = e.feu
      if (f.frappe === null && f.appui !== null && t >= f.appui) {
        // La boule grossit au bout du bâton ; la jauge au-dessus, l'étoile quand il faut lâcher.
        const u = clamp((t - f.appui) / C.feu.charge)
        rond(BATON.x, BATON.y + 1.5, 1 + u * 2.4 + (f.pleine ? Math.sin(t * 30) * 0.3 : 0), f.pleine ? '#ffd27a' : '#ff8a3a', 4)
        const x0 = sx(X_HEROS - 7)
        const y0 = sy(TAILLE + 13)
        const L = 12 * echelle
        const H = 1.6 * echelle
        g.fillStyle = 'rgba(0, 0, 0, 0.6)'
        g.beginPath()
        g.roundRect(x0, y0, L, H, H / 2)
        g.fill()
        g.fillStyle = f.pleine ? '#ffd27a' : '#ffb07a'
        g.beginPath()
        g.roundRect(x0, y0, Math.max(H, L * u), H, H / 2)
        g.fill()
        g.fillStyle = f.pleine ? '#ffd27a' : 'rgba(255, 255, 255, 0.3)'
        if (f.pleine) {
          g.shadowColor = '#ffb030'
          g.shadowBlur = 2 * echelle
        }
        etoile(x0 + L + 2.6 * echelle, y0 + H / 2, (f.pleine ? 2.2 + Math.sin(t * 20) * 0.3 : 1.6) * echelle)
        g.shadowBlur = 0
      } else if (f.frappe !== null && !f.porte) {
        // La boule part en cloche vers l'ennemi.
        const u = clamp((t - f.frappe) / C.feu.vol)
        const x = melange(BATON.x, cible.x, u)
        const y = melange(BATON.y + 1.5, cible.y, u) + cloche(6, u)
        const r = f.fort ? 3.4 : 1.8
        for (let i = 1; i <= 4; i++) {
          const v = clamp(u - i * 0.06)
          g.globalAlpha = 0.5 - i * 0.1
          rond(melange(BATON.x, cible.x, v), melange(BATON.y + 1.5, cible.y, v) + cloche(6, v), r * (1 - i * 0.15), '#ff6a2a')
        }
        g.globalAlpha = 1
        rond(x, y, r, f.fort ? '#ffd27a' : '#ff8a3a', 5)
      }
    }
    if (e.phase === 'eclair') {
      const a = e.anneaux[e.anneaux.length - 1]
      if (!a.porte) {
        // L'anneau part de loin et se referme sur le cercle : on touche quand ils se recouvrent.
        const depart = e.anneaux.length > 1 ? e.anneaux[e.anneaux.length - 2].t : e.debut + C.eclair.prepare
        const u = clamp((t - depart) / (a.t - depart))
        const rCible = 4.5
        const r = melange(rCible + 16, rCible, u)
        g.strokeStyle = 'rgba(255, 210, 122, 0.85)'
        g.lineWidth = 0.5 * echelle
        g.setLineDash([1.2 * echelle, 1 * echelle])
        g.beginPath()
        g.arc(sx(cible.x), sy(cible.y), rCible * echelle, 0, Math.PI * 2)
        g.stroke()
        g.setLineDash([])
        g.strokeStyle = TEINTE.eclair
        g.globalAlpha = 0.35 + 0.65 * u
        g.lineWidth = (0.6 + u * 0.6) * echelle
        g.shadowColor = TEINTE.eclair
        g.shadowBlur = 2 * echelle
        g.beginPath()
        g.arc(sx(cible.x), sy(cible.y), r * echelle, 0, Math.PI * 2)
        g.stroke()
        g.shadowBlur = 0
        g.globalAlpha = 1
      }
    }
    if (e.phase === 'missiles') {
      const m = e.missiles
      const x0 = sx(X_HEROS - 7)
      const y0 = sy(TAILLE + 13)
      const L = 14 * echelle
      const H = 1.4 * echelle
      if (t <= m.fin) {
        // Le temps qui reste, et le compte des tapes.
        const reste = t < m.debut ? 1 : 1 - clamp((t - m.debut) / (m.fin - m.debut))
        g.fillStyle = 'rgba(0, 0, 0, 0.6)'
        g.beginPath()
        g.roundRect(x0, y0, L, H, H / 2)
        g.fill()
        g.fillStyle = TEINTE.missiles
        g.beginPath()
        g.roundRect(x0, y0, Math.max(H, L * reste), H, H / 2)
        g.fill()
      }
      if (m.taps > 0) {
        g.font = `800 ${3.4 * echelle}px 'Baloo 2', sans-serif`
        g.textAlign = 'center'
        g.lineWidth = 0.6 * echelle
        g.strokeStyle = 'rgba(0, 0, 0, 0.75)'
        g.fillStyle = '#e2ccff'
        const texte = `×${m.taps}`
        g.strokeText(texte, sx(X_HEROS), y0 - 1.2 * echelle)
        g.fillText(texte, sx(X_HEROS), y0 - 1.2 * echelle)
        // Les tapes qui manquent au prochain missile, en points sous la jauge.
        const n = tapesParMissile(C, e)
        for (let i = 0; i < n; i++) {
          g.fillStyle = i < m.taps % n ? TEINTE.missiles : 'rgba(255, 255, 255, 0.25)'
          g.beginPath()
          g.arc(x0 + (i + 0.5) * (L / n), y0 + H + 1.4 * echelle, 0.5 * echelle, 0, Math.PI * 2)
          g.fill()
        }
      }
    }
    // Les missiles en vol (une tape, un petit ; celle qui porte, un gros).
    for (let i = projectiles.length - 1; i >= 0; i--) {
      const p = projectiles[i]
      const u = (t - p.t) / C.missiles.vol
      if (u >= 1) {
        projectiles.splice(i, 1)
        continue
      }
      const x = melange(BATON.x, cible.x, u)
      const y = melange(BATON.y, cible.y, u) + Math.sin(u * Math.PI) * p.dy
      rond(x, y, p.gros ? 1.4 : 0.6, p.gros ? '#f2e6ff' : TEINTE.missiles, p.gros ? 3 : 1.5)
    }
    // La foudre, du ciel à l'ennemi.
    for (let i = foudres.length - 1; i >= 0; i--) {
      const f = foudres[i]
      const u = (t - f.t) / 0.22
      if (u >= 1) {
        foudres.splice(i, 1)
        continue
      }
      g.globalAlpha = 1 - u
      g.strokeStyle = '#ffffff'
      g.shadowColor = TEINTE.eclair
      g.shadowBlur = 3 * echelle
      g.lineWidth = 0.8 * echelle
      g.lineJoin = 'round'
      g.beginPath()
      f.points.forEach(([x, y], k) => (k === 0 ? g.moveTo(sx(x), sy(y)) : g.lineTo(sx(x), sy(y))))
      g.stroke()
      g.shadowBlur = 0
      g.globalAlpha = 1
    }
  }

  // ---------------------------------------------------------------- le chrome

  let consigneMontree = ''
  function majChrome(t: number): void {
    const en = ennemiDe(C, e)
    campHeros.nom.textContent = 'Magicien'
    campHeros.remplie.style.width = `${(100 * e.pv) / pvMaxDe(C, e)}%`
    campHeros.detail.textContent = etatDuHeros()
    campEnnemi.nom.textContent = en.nom
    campEnnemi.remplie.style.width = `${(100 * e.pvEnnemi) / en.pv}%`
    campEnnemi.detail.textContent = `Étage ${e.etage}`
    const choix = enJeu && e.phase === 'choix'
    // Le menu qui réapparaît : la tape de garde qui finissait le tour ne doit pas y lancer un sort.
    if (choix && menu.hidden) ouvrir()
    menu.hidden = !choix
    if (choix) majMenu()
    majSac(choix)
    let texte = ''
    if (enJeu) {
      if (e.phase === 'choix') texte = en.conseil
      else if (e.phase === 'feu') texte = e.feu.frappe !== null ? '' : e.feu.appui === null || t < e.feu.appui ? 'Posez le doigt et tenez' : 'Lâchez quand l’étoile s’allume'
      else if (e.phase === 'eclair') texte = e.finAction !== null ? '' : 'Touchez quand l’anneau touche le cercle'
      else if (e.phase === 'missiles') texte = t < e.missiles.debut ? 'Prêt…' : t <= e.missiles.fin ? 'Tapotez !' : ''
      else if (e.phase === 'ennemi') texte = 'Touchez juste avant le coup pour parer'
    }
    if (texte !== consigneMontree) {
      consigne.textContent = texte
      consigneMontree = texte
    }
  }

  // ---------------------------------------------------------------- la boucle

  /** Un ennemi est en scène : dans une salle de combat, pas sur la carte ni dans un panneau qui ne le suit pas. */
  function combatEnScene(): boolean {
    if (!enJeu && e.phase !== 'perdu') return !ecran.hidden
    if (e.salle !== 'combat' && e.salle !== 'elite' && e.salle !== 'chef') return false
    if (e.phase === 'carte' || e.phase === 'repos' || e.phase === 'boutique' || e.phase === 'evenement') return false
    return !(e.phase === 'butin' && e.pvEnnemi > 0)
  }

  let avant = performance.now()
  function image(ms: number): void {
    const dt = Math.min(ms - avant, 100)
    avant = ms
    const t = horloge()
    if (enJeu) {
      for (const x of avancer(C, e, t)) vivre(x)
      // La ruée siffle : on l'entend partir.
      if (e.phase === 'ennemi') {
        const k = e.coups[rueesSifflees]
        if (k !== undefined && t >= k.impact - C.ennemi.ruee) {
          sonRuee()
          rueesSifflees += 1
        }
      }
    }
    for (let i = eclats.length - 1; i >= 0; i--) {
      const p = eclats[i]
      p.vie += dt
      p.x += (p.vx * dt) / 1000
      p.y += (p.vy * dt) / 1000
      p.vy -= (40 * dt) / 1000
      p.vx *= 0.96
      if (p.vie >= p.duree) eclats.splice(i, 1)
    }
    for (let i = bulles.length - 1; i >= 0; i--) {
      bulles[i].vie += dt
      if (bulles[i].vie >= bulles[i].duree) bulles.splice(i, 1)
    }
    flashHeros = Math.max(0, flashHeros - dt / 200)
    flashEnnemi = Math.max(0, flashEnnemi - dt / 200)
    ecrase = Math.max(0, ecrase - dt / 180)
    flashRouge = Math.max(0, flashRouge - dt / 300)
    flashOr = Math.max(0, flashOr - dt / 450)
    secousse = Math.max(0, secousse - dt / 300)

    const w = canvas.width
    const h = canvas.height
    ox = (Math.random() - 0.5) * secousse * 1.6
    oy = (Math.random() - 0.5) * secousse * 1.6
    dessinerLaScene(w, h)
    if (combatEnScene()) dessinerLEnnemi(t)
    dessinerLeHeros(t)
    dessinerLesSorts(t)
    for (const p of eclats) {
      g.globalAlpha = 1 - p.vie / p.duree
      g.fillStyle = p.couleur
      g.beginPath()
      g.arc(sx(p.x), sy(p.y), p.taille * echelle, 0, Math.PI * 2)
      g.fill()
    }
    g.globalAlpha = 1
    g.textAlign = 'center'
    g.strokeStyle = 'rgba(0, 0, 0, 0.75)'
    for (const b of bulles) {
      const u = b.vie / b.duree
      const gonfle = u < 0.15 ? 0.6 + (u / 0.15) * 0.5 : 1.1 - Math.min(0.1, (u - 0.15) * 0.4)
      g.globalAlpha = u > 0.7 ? 1 - (u - 0.7) / 0.3 : 1
      g.font = `800 ${b.taille * gonfle * echelle}px 'Baloo 2', sans-serif`
      g.lineWidth = 0.6 * echelle
      g.fillStyle = b.couleur
      const y = sy(b.y) - u * 4 * echelle
      g.strokeText(b.texte, sx(b.x), y)
      g.fillText(b.texte, sx(b.x), y)
    }
    g.globalAlpha = 1
    if (flashRouge > 0) {
      const grad = g.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.3, w / 2, h / 2, Math.max(w, h) * 0.75)
      grad.addColorStop(0, 'rgba(255, 40, 40, 0)')
      grad.addColorStop(1, `rgba(255, 40, 40, ${0.45 * flashRouge})`)
      g.fillStyle = grad
      g.fillRect(0, 0, w, h)
    }
    if (flashOr > 0) {
      g.fillStyle = `rgba(255, 220, 140, ${0.22 * flashOr})`
      g.fillRect(0, 0, w, h)
    }
    haut.hidden = !combatEnScene()
    majChrome(t)
    suivreLaPhase()
    requestAnimationFrame(image)
  }
  requestAnimationFrame(image)
}

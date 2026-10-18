/**
 * LA PAGE DE PREVIEW — `preview.html`, hors du jeu.
 *
 * Une grille de trente dessins par famille, l'identifiant (et sa seed) sous
 * chacun, « Regénérer » qui tire trente nouveaux identifiants, et la taille
 * en 32 / 64 / 128 px. *Ce qui se teste doit pouvoir s'ouvrir d'un lien* :
 * la série d'identifiants dérive de `?serie=N`, qui s'écrit dans l'adresse à
 * chaque regénération. Un champ permet aussi de voir UN identifiant précis.
 */
import './preview.css'
import { FAMILLES, RACES, ROLES, seedDe, type Famille, type Race } from '../../logic/procgen/index.ts'
import { createRng } from '../../logic/rng.ts'
import { renderDessin, renderIcon } from './svg.ts'
import { dessinerOrigami, dureeTotale, genererOrigami } from '../../logic/procgen/index.ts'
import { vignette3D, visionneuse, type Sorte3D } from './toon.ts'

const PAR_FAMILLE = 30
/** Les familles 3D : pas des dessins SVG, des objets rendus en toon par three.js. */
const SORTES_3D: readonly { sorte: Sorte3D; titre: string; prefixe: string }[] = [
  { sorte: 'vaisseau3d', titre: 'Vaisseaux 3D toon (toucher pour faire tourner)', prefixe: 'w' },
  { sorte: 'figurine', titre: 'Figurines 3D toon (toucher pour faire tourner)', prefixe: 'f' },
]
const est3D = (f: string): f is Sorte3D => SORTES_3D.some((s) => s.sorte === f)
const TAILLES = [32, 64, 128] as const
const PREFIXE: Record<Famille, string> = { combat: 'c', minage: 'm', station: 's', planete: 'p', asteroide: 'a', origami: 'o', gribouillis: 'g', 'perso-papier': 'h', 'perso-pixel': 'h', 'perso-encre': 'h', heros: 'k', masque: 'q', creature: 'b', vaisseau: 'v', alien: 'x' }
/** Les familles d'un même groupe tirent les MÊMES identifiants : on compare le même personnage d'un style à l'autre. */
const GROUPE: Partial<Record<Famille, string>> = { 'perso-papier': 'perso', 'perso-pixel': 'perso', 'perso-encre': 'perso' }
const TITRE: Record<Famille, string> = { combat: 'Vaisseaux de combat', minage: 'Vaisseaux de minage', station: 'Stations', planete: 'Planètes', asteroide: 'Astéroïdes', origami: 'Origami (toucher pour déplier)', gribouillis: 'Gribouillis du cahier', 'perso-papier': 'Personnages — papier découpé', 'perso-pixel': 'Personnages — pixel art', 'perso-encre': 'Personnages — encre', heros: 'Héros en buste', masque: 'Masques', creature: 'Créatures de type', vaisseau: 'Vaisseaux', alien: 'Vaisseaux aliens' }
const NOM_RACE: Record<Race, string> = { humain: 'Humain', alien: 'Alien', biologique: 'Biologique' }

const adresse = new URL(location.href)
let serie = Number(adresse.searchParams.get('serie')) || 1
const raceLue = adresse.searchParams.get('race')
let race: Race = (RACES as readonly string[]).includes(raceLue ?? '') ? (raceLue as Race) : 'humain'

/** Les identifiants d'une série : tirés d'un RNG seedé par son numéro. */
function identifiants(famille: Famille | Sorte3D, serie: number): string[] {
  const rng = createRng(seedDe(`${(est3D(famille) ? famille : GROUPE[famille]) ?? famille}/${serie}`))
  const ids: string[] = []
  while (ids.length < PAR_FAMILLE) {
    const id = `${est3D(famille) ? SORTES_3D.find((s) => s.sorte === famille)!.prefixe : PREFIXE[famille]}-${Math.floor(rng.next() * 46656).toString(36).padStart(3, '0')}`
    if (!ids.includes(id)) ids.push(id)
  }
  return ids
}

function ecrireSerie(): void {
  adresse.searchParams.set('serie', String(serie))
  adresse.searchParams.set('race', race)
  history.replaceState(null, '', adresse)
}

// La taille se lit aussi dans l'adresse : ce qui se teste doit pouvoir s'ouvrir d'un lien.
let taille: number = TAILLES.find((t) => t === Number(adresse.searchParams.get('taille'))) ?? 64
const racine = document.getElementById('preview')!
racine.innerHTML = `
  <header class="pv-tete">
    <h1>Procgen</h1>
    <div class="pv-outils">
      <span class="pv-races" role="group" aria-label="Race">
        ${RACES.map((r) => `<button type="button" data-race="${r}" class="${r === race ? 'actif' : ''}">${NOM_RACE[r]}</button>`).join('')}
      </span>
      <span class="pv-tailles" role="group" aria-label="Taille">
        ${TAILLES.map((t) => `<button type="button" data-taille="${t}" class="${t === taille ? 'actif' : ''}">${t} px</button>`).join('')}
      </span>
      <button type="button" id="pv-regenerer">Regénérer</button>
      <span class="pv-serie">série <b id="pv-numero">${serie}</b></span>
      <label class="pv-cherche">id <input id="pv-id" type="text" placeholder="c-abc, m-…, s-…, p-…, a-…" spellcheck="false" /></label>
    </div>
  </header>
  <section class="pv-un" id="pv-un" hidden></section>
  ${SORTES_3D.map((s) => `
  <section class="pv-famille pv-3d" data-famille="${s.sorte}">
    <h2>${s.titre}</h2>
    <div class="pv-grille"></div>
  </section>`).join('')}
  <div class="pv-visionneuse" id="pv-visionneuse" hidden><canvas></canvas><p></p></div>
  ${FAMILLES.map(
    (f) => `
    <section class="pv-famille" data-famille="${f}">
      <h2>${TITRE[f]}</h2>
      <div class="pv-grille"></div>
    </section>`,
  ).join('')}
`


function cellule(famille: Famille, id: string, t: number): HTMLElement {
  const cell = document.createElement('figure')
  cell.className = 'pv-cell'
  cell.dataset.famille = famille
  cell.style.setProperty('--t', `${t}px`)
  const icone = renderIcon(famille, id, t, race)
  cell.appendChild(icone)
  const legende = document.createElement('figcaption')
  legende.innerHTML = `<b>${id}</b><small>${icone.dataset.seed}</small>`
  cell.appendChild(legende)
  cell.title = famille === 'origami' ? 'Toucher pour déplier' : 'Cliquer pour copier l’identifiant'
  cell.addEventListener('click', () => {
    if (famille === 'origami') {
      deplier(cell, id, t)
      return
    }
    void navigator.clipboard?.writeText(id)
    const champ = document.getElementById('pv-id') as HTMLInputElement
    champ.value = id
    montrerUn(id)
  })
  return cell
}

/**
 * L'ANIMATION DU DÉPLIAGE : on déplie (t de 1 à 0), on laisse voir la feuille
 * et ses plis, on replie. Chaque image est un dessin recalculé et rendu, la
 * géométrie est assez petite pour ça.
 */
const enCours = new WeakSet<HTMLElement>()
function deplier(cell: HTMLElement, id: string, t: number): void {
  if (enCours.has(cell)) return
  enCours.add(cell)
  const modele = genererOrigami(id)
  const parEtape = 520 // ms par unité d'étape
  const duree = dureeTotale(modele) * parEtape
  const pause = 700
  const debut = performance.now()
  const montrer = (avancement: number) => {
    const svg = renderDessin(dessinerOrigami(modele, avancement), t)
    cell.querySelector('svg')!.replaceWith(svg)
  }
  const image = (maintenant: number) => {
    const e = maintenant - debut
    let avancement: number
    if (e < duree) avancement = 1 - e / duree
    else if (e < duree + pause) avancement = 0
    else if (e < 2 * duree + pause) avancement = (e - duree - pause) / duree
    else {
      montrer(1)
      enCours.delete(cell)
      return
    }
    montrer(avancement)
    requestAnimationFrame(image)
  }
  requestAnimationFrame(image)
}

/**
 * LES FIGURINES 3D : chaque vignette est un rendu three.js converti en image,
 * fait une par image d'animation pour ne pas figer la page. Toucher une
 * vignette ouvre la visionneuse, où la figurine tourne.
 */
let fileDeRendu: (() => void)[] = []
let enFile = false
function pousserRendu(tache: () => void): void {
  fileDeRendu.push(tache)
  if (enFile) return
  enFile = true
  const suivant = () => {
    const t = fileDeRendu.shift()
    if (!t) {
      enFile = false
      return
    }
    try {
      t()
    } catch (e) {
      console.error('figurine', e)
    }
    requestAnimationFrame(suivant)
  }
  requestAnimationFrame(suivant)
}

let visionneuseEnCours: { arreter: () => void } | null = null
function ouvrirVisionneuse(sorte: Sorte3D, id: string): void {
  const bloc = document.getElementById('pv-visionneuse')!
  const canvas = bloc.querySelector('canvas')!
  visionneuseEnCours?.arreter()
  bloc.hidden = false
  bloc.querySelector('p')!.textContent = `${id} — toucher pour fermer`
  visionneuseEnCours = visionneuse(canvas, sorte, id, Math.min(360, window.innerWidth - 48))
}
document.getElementById('pv-visionneuse')!.addEventListener('click', () => {
  visionneuseEnCours?.arreter()
  visionneuseEnCours = null
  document.getElementById('pv-visionneuse')!.hidden = true
})

function cellule3D(sorte: Sorte3D, id: string, t: number): HTMLElement {
  const cell = document.createElement('figure')
  cell.className = 'pv-cell'
  cell.dataset.famille = sorte
  cell.style.setProperty('--t', `${t}px`)
  const img = document.createElement('img')
  img.width = t
  img.height = t
  img.alt = id
  cell.appendChild(img)
  const legende = document.createElement('figcaption')
  legende.innerHTML = `<b>${id}</b><small>${seedDe(id)}</small>`
  cell.appendChild(legende)
  cell.title = 'Toucher pour faire tourner'
  cell.addEventListener('click', () => ouvrirVisionneuse(sorte, id))
  pousserRendu(() => {
    img.src = vignette3D(sorte, id, t)
  })
  return cell
}

function peindre(): void {
  fileDeRendu = []
  for (const section of racine.querySelectorAll<HTMLElement>('.pv-3d')) {
    const sorte = section.dataset.famille as Sorte3D
    section.querySelector('.pv-grille')!.replaceChildren(...identifiants(sorte, serie).map((id) => cellule3D(sorte, id, taille)))
  }
  for (const section of racine.querySelectorAll<HTMLElement>('.pv-famille:not(.pv-3d)')) {
    const famille = section.dataset.famille as Famille
    const grille = section.querySelector('.pv-grille')!
    const titre = section.querySelector('h2')!
    titre.textContent = (ROLES as readonly string[]).includes(famille) ? `${TITRE[famille]} — ${NOM_RACE[race]}` : TITRE[famille]
    grille.replaceChildren(...identifiants(famille, serie).map((id) => cellule(famille, id, taille)))
  }
  document.getElementById('pv-numero')!.textContent = String(serie)
}

/** Un identifiant précis, aux trois tailles — pour comparer en 32 et 128. */
function montrerUn(id: string): void {
  const bloc = document.getElementById('pv-un')!
  const propre = id.trim()
  if (!propre) {
    bloc.hidden = true
    bloc.replaceChildren()
    return
  }
  const famille = [...FAMILLES, 'vaisseau' as const].find((f) => propre.startsWith(PREFIXE[f])) ?? 'vaisseau'
  bloc.hidden = false
  // Un personnage se montre dans ses trois styles, à la taille courante.
  const familles = GROUPE[famille] ? FAMILLES.filter((f) => GROUPE[f] === GROUPE[famille]) : [famille]
  bloc.replaceChildren(...(familles.length > 1 ? familles.map((f) => cellule(f, propre, taille)) : TAILLES.map((t) => cellule(famille, propre, t))))
}

racine.querySelector('.pv-races')!.addEventListener('click', (e) => {
  const bouton = (e.target as HTMLElement).closest<HTMLButtonElement>('button[data-race]')
  if (!bouton) return
  race = bouton.dataset.race as Race
  for (const b of racine.querySelectorAll('.pv-races button')) b.classList.toggle('actif', b === bouton)
  ecrireSerie()
  peindre()
  montrerUn((document.getElementById('pv-id') as HTMLInputElement).value)
})

racine.querySelector('.pv-tailles')!.addEventListener('click', (e) => {
  const bouton = (e.target as HTMLElement).closest<HTMLButtonElement>('button[data-taille]')
  if (!bouton) return
  taille = Number(bouton.dataset.taille)
  for (const b of racine.querySelectorAll('.pv-tailles button')) b.classList.toggle('actif', b === bouton)
  peindre()
})

document.getElementById('pv-regenerer')!.addEventListener('click', () => {
  serie += 1
  ecrireSerie()
  peindre()
})

document.getElementById('pv-id')!.addEventListener('input', (e) => {
  montrerUn((e.target as HTMLInputElement).value)
})

peindre()

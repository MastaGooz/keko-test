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
import { FAMILLES, seedDe, type Famille } from '../../logic/procgen/index.ts'
import { createRng } from '../../logic/rng.ts'
import { renderIcon } from './svg.ts'

const PAR_FAMILLE = 30
const TAILLES = [32, 64, 128] as const
const PREFIXE: Record<Famille, string> = { combat: 'c', minage: 'm', station: 's', planete: 'p', asteroide: 'a', vaisseau: 'v' }
const TITRE: Record<Famille, string> = { combat: 'Vaisseaux de combat', minage: 'Vaisseaux de minage', station: 'Stations', planete: 'Planètes', asteroide: 'Astéroïdes', vaisseau: 'Vaisseaux' }

const adresse = new URL(location.href)
let serie = Number(adresse.searchParams.get('serie')) || 1

/** Les identifiants d'une série : tirés d'un RNG seedé par son numéro. */
function identifiants(famille: Famille, serie: number): string[] {
  const rng = createRng(seedDe(`${famille}/${serie}`))
  const ids: string[] = []
  while (ids.length < PAR_FAMILLE) {
    const id = `${PREFIXE[famille]}-${Math.floor(rng.next() * 46656).toString(36).padStart(3, '0')}`
    if (!ids.includes(id)) ids.push(id)
  }
  return ids
}

function ecrireSerie(): void {
  adresse.searchParams.set('serie', String(serie))
  history.replaceState(null, '', adresse)
}

const racine = document.getElementById('preview')!
racine.innerHTML = `
  <header class="pv-tete">
    <h1>Procgen</h1>
    <div class="pv-outils">
      <span class="pv-tailles" role="group" aria-label="Taille">
        ${TAILLES.map((t) => `<button type="button" data-taille="${t}" class="${t === 64 ? 'actif' : ''}">${t} px</button>`).join('')}
      </span>
      <button type="button" id="pv-regenerer">Regénérer</button>
      <span class="pv-serie">série <b id="pv-numero">${serie}</b></span>
      <label class="pv-cherche">id <input id="pv-id" type="text" placeholder="c-abc, m-…, s-…, p-…, a-…" spellcheck="false" /></label>
    </div>
  </header>
  <section class="pv-un" id="pv-un" hidden></section>
  ${FAMILLES.map(
    (f) => `
    <section class="pv-famille" data-famille="${f}">
      <h2>${TITRE[f]}</h2>
      <div class="pv-grille"></div>
    </section>`,
  ).join('')}
`

let taille: number = 64

function cellule(famille: Famille, id: string, t: number): HTMLElement {
  const cell = document.createElement('figure')
  cell.className = 'pv-cell'
  cell.style.setProperty('--t', `${t}px`)
  const icone = renderIcon(famille, id, t)
  cell.appendChild(icone)
  const legende = document.createElement('figcaption')
  legende.innerHTML = `<b>${id}</b><small>${icone.dataset.seed}</small>`
  cell.appendChild(legende)
  cell.title = 'Cliquer pour copier l’identifiant'
  cell.addEventListener('click', () => {
    void navigator.clipboard?.writeText(id)
    const champ = document.getElementById('pv-id') as HTMLInputElement
    champ.value = id
    montrerUn(id)
  })
  return cell
}

function peindre(): void {
  for (const section of racine.querySelectorAll<HTMLElement>('.pv-famille')) {
    const famille = section.dataset.famille as Famille
    const grille = section.querySelector('.pv-grille')!
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
  bloc.replaceChildren(...TAILLES.map((t) => cellule(famille, propre, t)))
}

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

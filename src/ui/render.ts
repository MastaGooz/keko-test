/**
 * Rendu du prototype de combat. Volontairement brut : on teste des règles,
 * pas une direction artistique. Seul endroit qui connaît la structure de la page.
 */
import type { EtatCombat } from '../logic/combat.ts'

export type View = {
  root: HTMLElement
  seed: HTMLElement
  joueur: HTMLElement
  ennemi: HTMLElement
  pioche: HTMLElement
  cartes: HTMLElement
  passer: HTMLButtonElement
  issue: HTMLElement
  journal: HTMLElement
}

/** Construit le squelette une seule fois et renvoie les noeuds à mettre à jour. */
export function mount(root: HTMLElement, buildTime: string): View {
  root.innerHTML = `
    <main class="app">
      <p class="build">Build : <time>${buildTime}</time> — seed <span id="seed"></span></p>

      <p id="joueur" class="ligne"></p>
      <p id="ennemi" class="ligne"></p>
      <p id="pioche" class="discret"></p>

      <div id="cartes" class="cartes"></div>
      <button id="passer" class="bouton" type="button" data-action="passer"></button>

      <p id="issue" class="ligne"></p>
      <div class="reprise">
        <button class="bouton secondaire" type="button" data-action="rejouer">Rejouer cette seed</button>
        <button class="bouton secondaire" type="button" data-action="nouveau">Nouveau combat</button>
      </div>

      <div id="journal" class="journal"></div>
    </main>
  `

  return {
    root,
    seed: root.querySelector<HTMLElement>('#seed')!,
    joueur: root.querySelector<HTMLElement>('#joueur')!,
    ennemi: root.querySelector<HTMLElement>('#ennemi')!,
    pioche: root.querySelector<HTMLElement>('#pioche')!,
    cartes: root.querySelector<HTMLElement>('#cartes')!,
    passer: root.querySelector<HTMLButtonElement>('#passer')!,
    issue: root.querySelector<HTMLElement>('#issue')!,
    journal: root.querySelector<HTMLElement>('#journal')!,
  }
}

/** Reflète l'état dans le DOM. Appelé après chaque action. */
export function render(view: View, etat: EtatCombat, seed: number): void {
  const fini = etat.issue !== null

  view.seed.textContent = String(seed)
  view.joueur.textContent = `TOI — ${etat.pv}/${etat.pvMax} PV — pioche dans ${etat.compteurPioche}`
  view.ennemi.textContent =
    `${etat.ennemi.nom.toUpperCase()} — ${etat.ennemi.pv}/${etat.ennemi.pvMax} PV — ` +
    `frappe dans ${etat.ennemi.compteur} (${etat.ennemi.degats} dégâts, tous les ${etat.ennemi.periode})`
  view.pioche.textContent = `Pioche ${etat.pioche.length} — défausse ${etat.defausse.length}`

  // Les boutons de main sont reconstruits : l'écoute est déléguée à la racine.
  view.cartes.innerHTML = etat.main
    .map((carte, index) =>
      carte.type === 'combat'
        ? `<button class="bouton carte" type="button" data-action="jouer" data-index="${index}" ${fini ? 'disabled' : ''}>` +
          `${carte.nom} — vitesse ${carte.vitesse} — ${carte.degats} dégâts</button>`
        : `<button class="bouton carte tresor" type="button" disabled>${carte.nom} — injouable</button>`,
    )
    .join('')

  view.passer.textContent = `Passer (${etat.compteurPioche} de temps)`
  view.passer.disabled = fini

  view.issue.textContent =
    etat.issue === 'victoire' ? 'VICTOIRE.' : etat.issue === 'defaite' ? 'MORT. Tout est perdu.' : ''

  // Les derniers évènements suffisent : le journal complet noierait l'écran.
  view.journal.innerHTML = etat.journal
    .slice(-10)
    .map((ligne) => `<p>${ligne}</p>`)
    .join('')
}

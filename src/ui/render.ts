/**
 * Rendu du prototype de combat. Volontairement brut, à une exception près :
 * la frise chronologique. Le système est temporel, il doit se voir dans le
 * temps — des compteurs en chiffres ne montrent pas le déroulé.
 *
 * Seul endroit qui connaît la structure de la page.
 */
import type { Carte, EtatCombat, Evenement } from '../logic/combat.ts'
import { prevoir } from '../logic/combat.ts'

/** Fenêtre affichée : quelques tics de mémoire, dix de prévision. */
const PASSE = 3
const FUTUR = 10

const GLYPHE = { carte: '⚔', frappe: '✖', pioche: '↺' }

export type View = {
  root: HTMLElement
  seed: HTMLElement
  joueur: HTMLElement
  ennemi: HTMLElement
  frise: HTMLElement
  apercu: HTMLElement
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
      <p id="ennemi" class="ligne ennemi"></p>

      <div id="frise" class="frise"></div>
      <p id="apercu" class="discret"></p>

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
    frise: root.querySelector<HTMLElement>('#frise')!,
    apercu: root.querySelector<HTMLElement>('#apercu')!,
    cartes: root.querySelector<HTMLElement>('#cartes')!,
    passer: root.querySelector<HTMLButtonElement>('#passer')!,
    issue: root.querySelector<HTMLElement>('#issue')!,
    journal: root.querySelector<HTMLElement>('#journal')!,
  }
}

/** Reflète l'état dans le DOM. Appelé après chaque action. */
export function render(view: View, etat: EtatCombat, seed: number, selection: number | null): void {
  const fini = etat.issue !== null
  const choisie = selection === null ? null : (etat.main[selection] ?? null)

  view.seed.textContent = String(seed)
  view.joueur.textContent = `TOI — ${etat.pv}/${etat.pvMax} PV — pioche dans ${etat.compteurPioche}`
  view.ennemi.textContent =
    `${etat.ennemi.nom.toUpperCase()} — ${etat.ennemi.pv}/${etat.ennemi.pvMax} PV — ` +
    `frappe dans ${etat.ennemi.compteur}, puis tous les ${etat.ennemi.periode} (${etat.ennemi.degats} dégâts)`

  view.frise.innerHTML = fini ? '' : frise(etat, choisie)
  view.apercu.textContent = fini ? '' : apercu(etat, choisie)

  // Les boutons de main sont reconstruits : l'écoute est déléguée à la racine.
  view.cartes.innerHTML = etat.main.map((carte, index) => bouton(carte, index, selection, fini)).join('')

  view.passer.textContent = `Passer (${etat.compteurPioche} de temps, aucun dégât)`
  view.passer.disabled = fini

  view.issue.textContent =
    etat.issue === 'victoire' ? 'VICTOIRE.' : etat.issue === 'defaite' ? 'MORT. Tout est perdu.' : ''

  // Les derniers évènements suffisent : le journal complet noierait l'écran.
  view.journal.innerHTML = etat.evenements
    .slice(-6)
    .map((evenement) => `<p>${phrase(evenement)}</p>`)
    .join('')
}

/**
 * La frise : une colonne par unité de temps, le passé à gauche, le futur à
 * droite. Voie du haut pour le joueur, voie du bas pour l'ennemi.
 */
function frise(etat: EtatCombat, choisie: Carte | null): string {
  const previsions = prevoir(etat, FUTUR, choisie)
  const colonnes: string[] = []

  for (let decalage = -PASSE; decalage <= FUTUR; decalage += 1) {
    const instant = etat.temps + decalage
    const passe = decalage <= 0
    const haut: string[] = []
    const bas: string[] = []

    if (instant >= 0 && passe) {
      for (const evenement of etat.evenements) {
        if (evenement.t !== instant) continue
        if (evenement.type === 'carte') haut.push(bulle(GLYPHE.carte, 'joue'))
        if (evenement.type === 'pioche') haut.push(bulle(GLYPHE.pioche, 'joue'))
        if (evenement.type === 'frappe') bas.push(bulle(GLYPHE.frappe, 'adverse'))
      }
    }

    if (!passe) {
      for (const prevision of previsions) {
        if (prevision.dans !== decalage) continue
        if (prevision.type === 'carte') haut.push(bulle(GLYPHE.carte, 'projet'))
        if (prevision.type === 'pioche') haut.push(bulle(GLYPHE.pioche, 'attendu'))
        if (prevision.type === 'frappe') bas.push(bulle(GLYPHE.frappe, 'attendu adverse'))
      }
    }

    const classes = ['unite']
    if (instant < 0) classes.push('hors')
    if (decalage === 0) classes.push('maintenant')
    colonnes.push(
      `<div class="${classes.join(' ')}">` +
        `<div class="voie">${haut.join('')}</div>` +
        `<div class="axe">${decalage === 0 ? '▲' : decalage > 0 ? decalage : ''}</div>` +
        `<div class="voie">${bas.join('')}</div>` +
        `</div>`,
    )
  }

  return colonnes.join('')
}

/** La question que le joueur se pose avant d'engager : qu'est-ce que j'encaisse d'ici là ? */
function apercu(etat: EtatCombat, choisie: Carte | null): string {
  if (choisie === null) return 'Touche une carte pour la viser, retouche-la pour la jouer.'

  const frappes = prevoir(etat, choisie.vitesse, choisie).filter(
    (prevision) => prevision.type === 'frappe',
  )

  // À égalité la carte résout avant : la frappe du dernier tic n'a lieu
  // que si l'ennemi survit au coup. C'est exactement ce que le comptage paie.
  const tue = choisie.degats >= etat.ennemi.pv
  const subies = frappes.filter(
    (frappe) => frappe.dans < choisie.vitesse || !tue,
  ).length

  const degats = subies * etat.ennemi.degats
  if (tue) {
    return subies === 0
      ? `${choisie.nom} résout dans ${choisie.vitesse} et l'achève — rien d'encaissé.`
      : `${choisie.nom} résout dans ${choisie.vitesse} et l'achève — ${degats} dégâts encaissés avant.`
  }

  return subies === 0
    ? `${choisie.nom} résout dans ${choisie.vitesse} — tu n'encaisses rien d'ici là.`
    : `${choisie.nom} résout dans ${choisie.vitesse} — ${subies} frappe(s), ${degats} dégâts encaissés.`
}

function bouton(carte: Carte, index: number, selection: number | null, fini: boolean): string {
  if (carte.type === 'tresor') {
    return `<button class="bouton carte tresor" type="button" disabled>${carte.nom} — injouable</button>`
  }

  const vise = index === selection
  return (
    `<button class="bouton carte${vise ? ' visee' : ''}" type="button" ` +
    `data-action="${vise ? 'jouer' : 'viser'}" data-index="${index}"${fini ? ' disabled' : ''}>` +
    `${vise ? '▶ ' : ''}${carte.nom} — vitesse ${carte.vitesse} — ${carte.degats} dégâts</button>`
  )
}

function bulle(glyphe: string, classes: string): string {
  return `<span class="bulle ${classes}">${glyphe}</span>`
}

function phrase(evenement: Evenement): string {
  switch (evenement.type) {
    case 'debut':
      return `${evenement.ennemi} apparaît.`
    case 'carte':
      return `t${evenement.t} — ${evenement.nom} inflige ${evenement.degats} (ennemi : ${evenement.pvEnnemi} PV).`
    case 'frappe':
      return `t${evenement.t} — ${evenement.nom} frappe pour ${evenement.degats} (toi : ${evenement.pvJoueur} PV).`
    case 'pioche':
      return `t${evenement.t} — main renouvelée : ${evenement.cartes} cartes, ${evenement.tresors} trésor(s).`
    case 'issue':
      return evenement.issue === 'victoire' ? 'L\'ennemi s\'effondre.' : 'Tu tombes.'
  }
}

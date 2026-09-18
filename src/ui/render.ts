/**
 * Rendu du prototype de combat, en tour par tour.
 *
 * Deux principes, dans cet ordre :
 *
 * 1. Le joueur ne calcule jamais ce que le moteur sait déjà.
 * 2. Mais il ne doit pas non plus avoir à LIRE beaucoup pour le savoir. Une
 *    ligne par carte, une ligne par ennemi, un seul chiffre pour la menace.
 *    Le détail n'apparaît que sur ce qui est visé.
 *
 * Seul endroit qui connaît la structure de la page.
 */
import type { Carte, EtatCombat, Evenement } from '../logic/combat.ts'
import { butin, consequence, menaceDuTour, tresorsEnMain, vivants } from '../logic/combat.ts'

const GLYPHE = { frappe: '✖', tresor: '▨', energie: '⚡' }
const ORDINAL = ['①', '②', '③', '④', '⑤']

export type View = {
  root: HTMLElement
  seed: HTMLElement
  ennemis: HTMLElement
  joueur: HTMLElement
  energie: HTMLElement
  cartes: HTMLElement
  encombrement: HTMLElement
  finTour: HTMLButtonElement
  issue: HTMLElement
  cupidite: HTMLElement
  journal: HTMLElement
}

/** Construit le squelette une seule fois et renvoie les noeuds à mettre à jour. */
export function mount(root: HTMLElement, buildTime: string): View {
  root.innerHTML = `
    <main class="app">
      <p class="build">Build : <time>${buildTime}</time> — seed <span id="seed"></span></p>

      <div id="ennemis" class="rangs"></div>
      <div id="joueur" class="rangs"></div>
      <p id="energie" class="energie"></p>

      <div id="cartes" class="cartes"></div>
      <button id="finTour" class="rang bouton finTour" type="button" data-action="finTour"></button>
      <p id="encombrement" class="encombrement"></p>

      <p id="issue" class="issue"></p>
      <div id="cupidite" class="cupidite"></div>
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
    ennemis: root.querySelector<HTMLElement>('#ennemis')!,
    joueur: root.querySelector<HTMLElement>('#joueur')!,
    energie: root.querySelector<HTMLElement>('#energie')!,
    cartes: root.querySelector<HTMLElement>('#cartes')!,
    encombrement: root.querySelector<HTMLElement>('#encombrement')!,
    finTour: root.querySelector<HTMLButtonElement>('#finTour')!,
    issue: root.querySelector<HTMLElement>('#issue')!,
    cupidite: root.querySelector<HTMLElement>('#cupidite')!,
    journal: root.querySelector<HTMLElement>('#journal')!,
  }
}

/** Reflète l'état dans le DOM. Appelé après chaque action. */
export function render(
  view: View,
  etat: EtatCombat,
  seed: number,
  selection: number | null,
  tresors: number,
): void {
  const fini = etat.issue !== null
  const carte = selection === null ? null : (etat.main[selection] ?? null)
  const visee = carte !== null && carte.type === 'combat' ? carte : null

  view.seed.textContent = String(seed)
  view.ennemis.innerHTML = vivants(etat)
    .map(({ ennemi, index }, rang) => ligneEnnemi(etat, ennemi, index, rang, visee, fini))
    .join('')
  view.joueur.innerHTML = ligneJoueur(etat, visee, fini)
  view.energie.innerHTML = fini ? '' : energie(etat, visee)

  // Les boutons de main sont reconstruits : l'écoute est déléguée à la racine.
  view.cartes.innerHTML = etat.main
    .map((c, index) => ligneCarte(etat, c, index, selection, fini))
    .join('')
  view.encombrement.innerHTML = fini ? '' : encombrement(etat)

  view.finTour.innerHTML = etiquetteFinTour(etat)
  view.finTour.disabled = fini

  view.issue.innerHTML = issue(etat)

  view.cupidite.innerHTML = reglageCupidite(tresors)

  view.journal.innerHTML = etat.evenements
    .slice(-3)
    .map((evenement) => `<p>${phrase(evenement)}</p>`)
    .join('')
}

/**
 * Un ennemi sur une ligne : ordinal, nom, jauge, PV, et ✖N — ce qu'il frappe.
 * Vif s'il frappe à la fin de CE tour, éteint sinon : la couleur porte le
 * tempo, aucun mot n'est nécessaire.
 */
function ligneEnnemi(
  etat: EtatCombat,
  ennemi: { nom: string; pv: number; pvMax: number; degats: number; compteur: number },
  index: number,
  rang: number,
  visee: Carte | null,
  fini: boolean,
): string {
  const imminent = ennemi.compteur <= 1
  const corps =
    `<span class="ordinal">${ORDINAL[rang] ?? '•'}</span>` +
    `<span class="nom">${ennemi.nom}</span>` +
    jauge(ennemi.pv, ennemi.pvMax) +
    `<span class="pv">${ennemi.pv}</span>` +
    `<span class="coup${imminent ? ' imminent' : ''}">${GLYPHE.frappe}${ennemi.degats}</span>`

  if (visee === null || fini) return `<div class="rang adverse">${corps}</div>`

  const c = consequence(etat, visee, index)
  const effet = c.gagne
    ? `<span class="effet gagne">★ gagne</span>`
    : c.tue
      ? `<span class="effet gagne">★ achève${c.evite > 0 ? ` −${c.evite}` : ''}</span>`
      : `<span class="effet">→ ${Math.max(0, ennemi.pv - visee.degats)}</span>`

  return (
    `<button class="rang adverse cible${c.tue ? ' achevable' : ''}" type="button" ` +
    `data-action="cibler" data-cible="${index}">${corps}${effet}</button>`
  )
}

/** Le joueur, avec ce qu'il encaissera à la fin du tour s'il en reste là. */
function ligneJoueur(etat: EtatCombat, visee: Carte | null, fini: boolean): string {
  const menace = menaceDuTour(etat)
  const marque = fini || menace === 0 ? '' : `−${menace}`

  return (
    `<div class="rang">` +
    `<span class="ordinal">▲</span>` +
    `<span class="nom">TOI</span>` +
    jauge(etat.pv, etat.pvMax) +
    `<span class="pv">${etat.pv}</span>` +
    `<span class="coup imminent">${marque}</span>` +
    (visee === null || fini ? '' : `<span class="effet">fin de tour</span>`) +
    `</div>`
  )
}

function jauge(pv: number, pvMax: number): string {
  const part = Math.max(0, Math.round((pv / pvMax) * 100))
  return `<span class="jauge"><span class="remplissage" style="width:${part}%"></span></span>`
}

/** L'énergie en pastilles : ce qui reste, et ce que la carte visée prendrait. */
function energie(etat: EtatCombat, visee: Carte | null): string {
  const reserve = visee === null ? 0 : Math.min(visee.cout, etat.energie)
  const pastilles = Array.from({ length: etat.energieMax }, (_, i) => {
    if (i >= etat.energie) return `<span class="pile vide"></span>`
    if (i >= etat.energie - reserve) return `<span class="pile reservee"></span>`
    return `<span class="pile"></span>`
  }).join('')

  return `${pastilles} <span class="chiffre">${etat.energie}/${etat.energieMax}</span>`
}

/** Une carte sur une ligne : nom, dégâts, coût. Rien d'autre. */
function ligneCarte(
  etat: EtatCombat,
  carte: Carte,
  index: number,
  selection: number | null,
  fini: boolean,
): string {
  if (carte.type === 'tresor') {
    return (
      `<div class="rang carte tresor">` +
      `<span class="nom">${carte.nom}</span>` +
      `<span class="remplir"></span>` +
      `<span class="or">${carte.valeur ?? 0} or</span>` +
      `</div>`
    )
  }

  const debout = vivants(etat)
  const abordable = carte.cout <= etat.energie
  const acheve = abordable && debout.some(({ ennemi }) => carte.degats >= ennemi.pv)
  const vise = index === selection

  const classes = ['rang', 'carte']
  if (!abordable) classes.push('hors-prix')
  else if (acheve) classes.push('acheve')
  else classes.push('jouable')
  if (vise) classes.push('visee')

  // Visée avec une seule cible debout : la retape engage directement.
  const action = !abordable ? '' : vise && debout.length === 1 ? 'cibler' : vise ? 'annuler' : 'viser'
  const donnee = action === 'cibler' ? `data-cible="${debout[0]!.index}"` : `data-index="${index}"`

  return (
    `<button class="${classes.join(' ')}" type="button" ` +
    `data-action="${action}" ${donnee}${fini || !abordable ? ' disabled' : ''}>` +
    `<span class="nom">${acheve ? '★ ' : ''}${carte.nom}</span>` +
    `<span class="stats">${carte.degats}</span>` +
    `<span class="remplir"></span>` +
    `<span class="cout">${carte.cout}${GLYPHE.energie}</span>` +
    `</button>`
  )
}

/**
 * La fin de combat est le seul endroit où la cupidité se paie ou se récolte.
 * Sans ce chiffre, porter du poids n'a aucune contrepartie visible et le
 * joueur ne teste qu'une punition.
 */
function issue(etat: EtatCombat): string {
  const or = butin(etat)
  if (etat.issue === 'victoire') {
    return or === 0
      ? 'VICTOIRE.'
      : `VICTOIRE — tu ressors avec <span class="or">${or} or</span>.`
  }
  if (etat.issue === 'defaite') {
    return or === 0
      ? 'MORT.'
      : `MORT — <span class="perdu">${or} or</span> restent dans le donjon.`
  }
  return ''
}

/** Décision de design : le taux d'encombrement est toujours visible. */
function encombrement(etat: EtatCombat): string {
  const total = etat.pioche.length + etat.main.length + etat.defausse.length
  const tresors =
    [...etat.pioche, ...etat.main, ...etat.defausse].filter((c) => c.type === 'tresor').length

  return (
    `${GLYPHE.tresor} <strong>${tresorsEnMain(etat)}/${etat.main.length}</strong> en main · ` +
    `${tresors}/${total} au deck · ` +
    `<strong class="or">${butin(etat)} or</strong> en jeu`
  )
}

function etiquetteFinTour(etat: EtatCombat): string {
  const menace = menaceDuTour(etat)
  return (
    `<span class="nom">Fin du tour ${etat.tour}</span>` +
    `<span class="remplir"></span>` +
    `<span class="cout">${menace === 0 ? '—' : `−${menace}`}</span>`
  )
}

/**
 * Le curseur de l'expérience. Ce n'est pas une mécanique de jeu : c'est le
 * réglage qui permet de répondre à la seule question que ce prototype existe
 * pour poser — une main polluée de trésors, tendue ou pénible ?
 */
function reglageCupidite(tresors: number): string {
  const choix = [0, 2, 4, 6, 8]
    .map(
      (n) =>
        `<button class="pastille${n === tresors ? ' active' : ''}" type="button" ` +
        `data-action="cupidite" data-tresors="${n}">${n}</button>`,
    )
    .join('')

  const part = Math.round((tresors / (10 + tresors)) * 100)
  return (
    `<span class="etiquette">Trésors</span>${choix}` +
    `<span class="etiquette">${part} % du deck</span>`
  )
}


function phrase(evenement: Evenement): string {
  switch (evenement.type) {
    case 'debut':
      return evenement.ennemis.join(', ')
    case 'carte':
      return `T${evenement.tour} — ${evenement.nom} → ${evenement.cible} (${evenement.pvCible} PV)`
    case 'mort':
      return `T${evenement.tour} — ${evenement.nom} tombe`
    case 'frappe':
      return `T${evenement.tour} — ${evenement.nom} frappe (toi : ${evenement.pvJoueur} PV)`
    case 'pioche':
      return `T${evenement.tour} — main : ${evenement.cartes} cartes, ${evenement.tresors} trésor(s)`
    case 'issue':
      return evenement.issue === 'victoire' ? 'Plus rien ne bouge.' : 'Tu tombes.'
  }
}

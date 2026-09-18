/**
 * Rendu du prototype de combat.
 *
 * Deux principes, dans cet ordre :
 *
 * 1. Le joueur ne calcule jamais ce que le moteur sait déjà.
 * 2. Mais il ne doit pas non plus avoir à LIRE beaucoup pour le savoir. Une
 *    ligne par carte, une ligne par ennemi ; le détail n'apparaît que sur ce
 *    qui est visé. Le rythme des combattants n'est écrit nulle part : il est
 *    dans la frise, c'est son travail.
 *
 * Seul endroit qui connaît la structure de la page.
 */
import type { Carte, EtatCombat, Evenement } from '../logic/combat.ts'
import { consequence, coutDuPassage, coutDuVol, prevoir, tresorsEnMain, vivants } from '../logic/combat.ts'

/** Fenêtre affichée. Courte volontairement : 12 colonnes tiennent au doigt. */
const PASSE = 2
const FUTUR = 9
const COLONNES = PASSE + FUTUR + 1

const GLYPHE = { carte: '⚔', frappe: '✖', pioche: '↺', tresor: '▨' }
const ORDINAL = ['①', '②', '③', '④', '⑤']

export type View = {
  root: HTMLElement
  seed: HTMLElement
  ennemis: HTMLElement
  joueur: HTMLElement
  frise: HTMLElement
  legende: HTMLElement
  cartes: HTMLElement
  encombrement: HTMLElement
  passer: HTMLButtonElement
  issue: HTMLElement
  journal: HTMLElement
}

/** Construit le squelette une seule fois et renvoie les noeuds à mettre à jour. */
export function mount(root: HTMLElement, buildTime: string): View {
  root.innerHTML = `
    <main class="app">
      <p class="build">Build : <time>${buildTime}</time> — seed <span id="seed"></span></p>

      <div id="ennemis" class="rangs"></div>
      <div id="joueur" class="rangs"></div>

      <div id="frise" class="frise"></div>
      <p id="legende" class="legende"></p>

      <div id="cartes" class="cartes"></div>
      <button id="passer" class="rang bouton passer" type="button" data-action="passer"></button>
      <p id="encombrement" class="encombrement"></p>

      <p id="issue" class="issue"></p>
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
    frise: root.querySelector<HTMLElement>('#frise')!,
    legende: root.querySelector<HTMLElement>('#legende')!,
    cartes: root.querySelector<HTMLElement>('#cartes')!,
    encombrement: root.querySelector<HTMLElement>('#encombrement')!,
    passer: root.querySelector<HTMLButtonElement>('#passer')!,
    issue: root.querySelector<HTMLElement>('#issue')!,
    journal: root.querySelector<HTMLElement>('#journal')!,
  }
}

/** Reflète l'état dans le DOM. Appelé après chaque action. */
export function render(view: View, etat: EtatCombat, seed: number, selection: number | null): void {
  const fini = etat.issue !== null
  const carte = selection === null ? null : (etat.main[selection] ?? null)
  const visee = carte !== null && carte.type === 'combat' ? carte : null

  view.seed.textContent = String(seed)
  view.ennemis.innerHTML = vivants(etat)
    .map(({ ennemi, index }, rang) => ligneEnnemi(etat, ennemi, index, rang, visee, fini))
    .join('')
  view.joueur.innerHTML = ligneJoueur(etat)

  view.frise.innerHTML = fini ? '' : frise(etat, visee)
  view.legende.innerHTML = fini ? '' : legende(etat, visee)

  // Les boutons de main sont reconstruits : l'écoute est déléguée à la racine.
  view.cartes.innerHTML = etat.main
    .map((c, index) => ligneCarte(etat, c, index, selection, fini))
    .join('')
  view.encombrement.innerHTML = fini ? '' : encombrement(etat)

  view.passer.innerHTML = etiquettePasser(etat)
  view.passer.disabled = fini

  view.issue.textContent =
    etat.issue === 'victoire' ? 'VICTOIRE.' : etat.issue === 'defaite' ? 'MORT. Tout est perdu.' : ''

  view.journal.innerHTML = etat.evenements
    .slice(-3)
    .map((evenement) => `<p>${phrase(evenement)}</p>`)
    .join('')
}

/**
 * Un ennemi sur une ligne : ordinal, nom, jauge, PV, et ✖N — la force de sa
 * frappe, avec le glyphe de sa voie de frise. Le « −N » reste réservé à ce que
 * le joueur perd, sur les cartes : deux signes, deux sens, jamais mélangés.
 *
 * Son rythme n'est écrit nulle part : la frise le montre. Quand une carte est
 * visée, la ligne devient touchable et porte ce que le coup lui ferait.
 */
function ligneEnnemi(
  etat: EtatCombat,
  ennemi: { nom: string; pv: number; pvMax: number; degats: number },
  index: number,
  rang: number,
  visee: Carte | null,
  fini: boolean,
): string {
  const corps =
    `<span class="ordinal">${ORDINAL[rang] ?? '•'}</span>` +
    `<span class="nom">${ennemi.nom}</span>` +
    jauge(ennemi.pv, ennemi.pvMax) +
    `<span class="pv">${ennemi.pv}</span>` +
    `<span class="coup">${GLYPHE.frappe}${ennemi.degats}</span>`

  if (visee === null || fini) return `<div class="rang adverse">${corps}</div>`

  const c = consequence(etat, visee, index)
  const effet = c.gagne
    ? `<span class="effet gagne">★ gagne</span>`
    : c.tue
      ? `<span class="effet gagne">★ achève</span>`
      : `<span class="effet">→ ${Math.max(0, ennemi.pv - visee.degats)}</span>`

  return (
    `<button class="rang adverse cible${c.tue ? ' achevable' : ''}" type="button" ` +
    `data-action="cibler" data-cible="${index}">${corps}${effet}</button>`
  )
}

function ligneJoueur(etat: EtatCombat): string {
  return (
    `<div class="rang">` +
    `<span class="ordinal">▲</span>` +
    `<span class="nom">TOI</span>` +
    jauge(etat.pv, etat.pvMax) +
    `<span class="pv">${etat.pv}</span>` +
    `<span class="coup vide"></span>` +
    `</div>`
  )
}

function jauge(pv: number, pvMax: number): string {
  const part = Math.max(0, Math.round((pv / pvMax) * 100))
  return `<span class="jauge"><span class="remplissage" style="width:${part}%"></span></span>`
}

/**
 * La frise porte tout le rythme : une voie par combattant, le passé à gauche,
 * le futur à droite. Bande sombre = la main en cours. Bande marquée = le temps
 * que la carte visée va coûter ; tout ce qui s'y trouve, tu vas le prendre.
 */
function frise(etat: EtatCombat, visee: Carte | null): string {
  const previsions = prevoir(etat, FUTUR)
  const instants = Array.from({ length: COLONNES }, (_, i) => i - PASSE)
  const depense = visee === null ? 0 : visee.vitesse

  const cellule = (decalage: number, contenu: string): string => {
    const classes = ['case']
    if (etat.temps + decalage < 0) classes.push('hors')
    if (decalage === 0) classes.push('maintenant')
    if (decalage >= 1 && decalage <= etat.compteurPioche) classes.push('fenetre')
    if (decalage >= 1 && decalage <= depense) classes.push('depense')
    return `<div class="${classes.join(' ')}">${contenu}</div>`
  }

  const voieJoueur = instants
    .map((decalage) => {
      const bulles: string[] = []
      if (decalage <= 0) {
        for (const e of etat.evenements) {
          if (e.t !== etat.temps + decalage) continue
          if (e.type === 'carte') bulles.push(bulle(GLYPHE.carte, 'joue'))
          if (e.type === 'pioche') bulles.push(bulle(GLYPHE.pioche, 'joue'))
        }
      } else {
        for (const p of previsions) {
          if (p.dans === decalage && p.type === 'pioche') bulles.push(bulle(GLYPHE.pioche, 'attendu'))
        }
      }
      return cellule(decalage, bulles.join(''))
    })
    .join('')

  const axe = instants
    .map((decalage) =>
      cellule(decalage, decalage === 0 ? '▲' : decalage > 0 ? String(decalage) : ''),
    )
    .join('')

  const voiesEnnemis = vivants(etat)
    .map(({ ennemi, index }, rang) => {
      const cases = instants
        .map((decalage) => {
          const bulles: string[] = []
          if (decalage <= 0) {
            for (const e of etat.evenements) {
              if (e.t !== etat.temps + decalage) continue
              if (e.type === 'frappe' && e.nom === ennemi.nom) bulles.push(bulle(GLYPHE.frappe, 'adverse'))
            }
          } else {
            for (const p of previsions) {
              if (p.dans !== decalage || p.type !== 'frappe' || p.ennemi !== index) continue
              const imminent = decalage <= depense ? ' imminent' : ''
              bulles.push(bulle(ORDINAL[rang] ?? GLYPHE.frappe, 'attendu adverse' + imminent))
            }
          }
          return cellule(decalage, bulles.join(''))
        })
        .join('')
      return `<div class="voie">${cases}</div>`
    })
    .join('')

  return `<div class="voie">${voieJoueur}</div><div class="voie axe">${axe}</div>${voiesEnnemis}`
}

/** La seule phrase de l'écran. Elle n'apparaît que quand une carte est visée. */
function legende(etat: EtatCombat, visee: Carte | null): string {
  if (visee === null) return `<span class="bande"></span> main : ${etat.compteurPioche} temps`

  const seule = vivants(etat).length === 1
  return (
    `<strong>${visee.nom}</strong> frappe, puis tu paies ` +
    `<strong>${visee.vitesse} temps</strong> — ${seule ? 'retouche' : 'touche une cible'}`
  )
}

/**
 * Une carte sur une ligne : nom, dégâts, temps, et ce que ça coûte en PV.
 * Rien d'autre — le « coûte N temps » d'avant répétait la stat déjà affichée.
 */
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
      `<span class="cout">${GLYPHE.tresor}</span>` +
      `</div>`
    )
  }

  const vol = coutDuVol(etat, carte.vitesse)
  const debout = vivants(etat)
  const acheve = debout.some(({ ennemi }) => carte.degats >= ennemi.pv)
  const vise = index === selection

  const classes = ['rang', 'carte']
  if (acheve) classes.push('acheve')
  else if (vol.mortel) classes.push('letal')
  else classes.push(vol.degats === 0 ? 'propre' : 'couteux')
  if (vise) classes.push('visee')
  if (carte.vitesse > etat.compteurPioche) classes.push('deborde')

  // Visée avec une seule cible debout : la retape engage directement.
  const action = vise && debout.length === 1 ? 'cibler' : vise ? 'annuler' : 'viser'
  const donnee = action === 'cibler' ? `data-cible="${debout[0]!.index}"` : `data-index="${index}"`

  const cout = vol.mortel ? '☠' : vol.degats === 0 ? '—' : `−${vol.degats}`

  return (
    `<button class="${classes.join(' ')}" type="button" ` +
    `data-action="${action}" ${donnee}${fini ? ' disabled' : ''}>` +
    `<span class="nom">${acheve ? '★ ' : ''}${carte.nom}</span>` +
    `<span class="stats">${carte.degats} · ${carte.vitesse}t</span>` +
    `<span class="remplir"></span>` +
    `<span class="cout">${cout}</span>` +
    `</button>`
  )
}

/** Décision de design : le taux d'encombrement est toujours visible. */
function encombrement(etat: EtatCombat): string {
  const total = etat.pioche.length + etat.main.length + etat.defausse.length
  const tresors =
    [...etat.pioche, ...etat.main, ...etat.defausse].filter((c) => c.type === 'tresor').length

  return (
    `${GLYPHE.tresor} <strong>${tresorsEnMain(etat)}/${etat.main.length}</strong> en main · ` +
    `${tresors}/${total} au deck`
  )
}

function etiquettePasser(etat: EtatCombat): string {
  const { degats } = coutDuPassage(etat)
  return (
    `<span class="nom">Passer</span>` +
    `<span class="stats">0 · ${etat.compteurPioche}t</span>` +
    `<span class="remplir"></span>` +
    `<span class="cout">${degats === 0 ? '—' : `−${degats}`}</span>`
  )
}

function bulle(glyphe: string, classes: string): string {
  return `<span class="bulle ${classes}">${glyphe}</span>`
}

function phrase(evenement: Evenement): string {
  switch (evenement.type) {
    case 'debut':
      return evenement.ennemis.join(', ')
    case 'carte':
      return `t${evenement.t} — ${evenement.nom} → ${evenement.cible} (${evenement.pvCible} PV)`
    case 'mort':
      return `t${evenement.t} — ${evenement.nom} tombe`
    case 'frappe':
      return `t${evenement.t} — ${evenement.nom} frappe (toi : ${evenement.pvJoueur} PV)`
    case 'pioche':
      return `t${evenement.t} — main : ${evenement.cartes} cartes, ${evenement.tresors} trésor(s)`
    case 'issue':
      return evenement.issue === 'victoire' ? 'Plus rien ne bouge.' : 'Tu tombes.'
  }
}

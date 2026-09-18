/**
 * Rendu du prototype de combat.
 *
 * Principe : le joueur ne doit jamais avoir à calculer ce que le moteur sait
 * déjà. Chaque carte annonce ce qu'elle coûte si on la joue maintenant, et la
 * frise montre le déroulé. Ce qui reste à décider, c'est l'arbitrage — pas
 * l'arithmétique.
 *
 * Seul endroit qui connaît la structure de la page.
 */
import type { Carte, Consequence, EtatCombat, Evenement } from '../logic/combat.ts'
import { consequence, coutDuPassage, prevoir, tresorsEnMain } from '../logic/combat.ts'

/** Fenêtre affichée. Court volontairement : 12 colonnes tiennent au doigt. */
const PASSE = 2
const FUTUR = 9

const GLYPHE = { carte: '⚔', frappe: '✖', pioche: '↺' }

export type View = {
  root: HTMLElement
  seed: HTMLElement
  joueur: HTMLElement
  ennemi: HTMLElement
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

      <div id="ennemi" class="combattant adverse"></div>
      <div id="joueur" class="combattant"></div>

      <div id="frise" class="frise"></div>
      <p id="legende" class="legende"></p>

      <div id="cartes" class="cartes"></div>
      <p id="encombrement" class="encombrement"></p>
      <button id="passer" class="bouton passer" type="button" data-action="passer"></button>

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
    joueur: root.querySelector<HTMLElement>('#joueur')!,
    ennemi: root.querySelector<HTMLElement>('#ennemi')!,
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
  const choisie = selection === null ? null : (etat.main[selection] ?? null)

  view.seed.textContent = String(seed)

  view.ennemi.innerHTML = combattant(
    etat.ennemi.nom.toUpperCase(),
    etat.ennemi.pv,
    etat.ennemi.pvMax,
    fini ? '' : `frappe dans ${etat.ennemi.compteur} — ${etat.ennemi.degats} dégâts toutes les ${etat.ennemi.periode}`,
  )
  view.joueur.innerHTML = combattant(
    'TOI',
    etat.pv,
    etat.pvMax,
    fini ? '' : `main renouvelée dans ${etat.compteurPioche}`,
  )

  view.frise.innerHTML = fini ? '' : frise(etat, choisie)
  view.legende.innerHTML = fini ? '' : legende(etat)

  // Les boutons de main sont reconstruits : l'écoute est déléguée à la racine.
  view.cartes.innerHTML = etat.main
    .map((carte, index) => bouton(etat, carte, index, selection, fini))
    .join('')
  view.encombrement.innerHTML = fini ? '' : encombrement(etat)

  view.passer.innerHTML = etiquettePasser(etat)
  view.passer.disabled = fini

  view.issue.textContent =
    etat.issue === 'victoire' ? 'VICTOIRE.' : etat.issue === 'defaite' ? 'MORT. Tout est perdu.' : ''

  // Les derniers évènements suffisent : le journal complet noierait l'écran.
  view.journal.innerHTML = etat.evenements
    .slice(-4)
    .map((evenement) => `<p>${phrase(evenement)}</p>`)
    .join('')
}

/** Nom, jauge de PV et ligne de rythme. La jauge se lit sans lire les chiffres. */
function combattant(nom: string, pv: number, pvMax: number, detail: string): string {
  const part = Math.max(0, Math.round((pv / pvMax) * 100))
  return (
    `<div class="tete"><span class="nom">${nom}</span><span class="pv">${pv}/${pvMax}</span></div>` +
    `<div class="jauge"><div class="remplissage" style="width:${part}%"></div></div>` +
    (detail === '' ? '' : `<div class="rythme">${detail}</div>`)
  )
}

/**
 * La frise : une colonne par unité de temps, le passé à gauche, le futur à
 * droite. Voie du haut pour le joueur, voie du bas pour l'ennemi. La bande
 * plus claire est la main en cours — au-delà, les cartes non jouées sont
 * défaussées.
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
    if (decalage >= 1 && decalage <= etat.compteurPioche) classes.push('fenetre')

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

/** Rappelle ce que vaut la bande claire : le temps qu'il reste à dépenser. */
function legende(etat: EtatCombat): string {
  const jouables = etat.main.filter(
    (carte) => carte.type === 'combat' && carte.vitesse <= etat.compteurPioche,
  ).length

  return (
    `<span class="bande"></span> cette main : <strong>${etat.compteurPioche} de temps</strong>, ` +
    `${jouables} carte${jouables > 1 ? 's' : ''} qui y tiennent`
  )
}

/**
 * Une carte de la main. Le titre donne les chiffres, la seconde ligne donne
 * la conséquence — c'est elle qui porte la décision.
 */
function bouton(
  etat: EtatCombat,
  carte: Carte,
  index: number,
  selection: number | null,
  fini: boolean,
): string {
  if (carte.type === 'tresor') {
    return (
      `<div class="carte tresor">` +
      `<span class="titre">${carte.nom}</span>` +
      `<span class="verdict muet">occupe une place — injouable</span>` +
      `</div>`
    )
  }

  const c = consequence(etat, carte)
  const vise = index === selection
  const classes = ['carte', ton(c)]
  if (vise) classes.push('visee')

  return (
    `<button class="${classes.join(' ')}" type="button" ` +
    `data-action="${vise ? 'jouer' : 'viser'}" data-index="${index}"${fini ? ' disabled' : ''}>` +
    `<span class="titre">${vise ? '▶ ' : ''}${carte.nom}` +
    `<span class="stats">${carte.vitesse} temps · ${carte.degats} dégâts</span></span>` +
    `<span class="verdict">${verdict(c)}</span>` +
    `</button>`
  )
}

/** La couleur dit l'essentiel avant même qu'on lise la ligne. */
function ton(c: Consequence): string {
  if (c.mortel) return 'letal'
  if (c.tue) return 'acheve'
  return c.frappes === 0 ? 'propre' : 'couteux'
}

function verdict(c: Consequence): string {
  const deborde = c.tientDansLaMain ? '' : ' · défausse le reste de ta main'

  if (c.mortel) return `☠ tu tombes avant qu'elle ne résolve${deborde}`
  if (c.tue) {
    return c.degats === 0
      ? `★ l'achève, sans riposte${deborde}`
      : `★ l'achève — ${c.degats} PV encaissés avant${deborde}`
  }
  if (c.frappes === 0) return `✓ résout dans ${c.dans}, rien d'encaissé${deborde}`
  return `− ${c.degats} PV d'ici là (${c.frappes} frappe${c.frappes > 1 ? 's' : ''})${deborde}`
}

/** Décision de design : le taux d'encombrement est toujours visible. */
function encombrement(etat: EtatCombat): string {
  const enMain = tresorsEnMain(etat)
  const total = etat.pioche.length + etat.main.length + etat.defausse.length
  const tresors =
    [...etat.pioche, ...etat.main, ...etat.defausse].filter((c) => c.type === 'tresor').length
  const taux = total === 0 ? 0 : Math.round((tresors / total) * 100)

  return (
    `Encombrement — <strong>${enMain}/${etat.main.length}</strong> en main · ` +
    `deck ${tresors}/${total} (${taux} %)`
  )
}

function etiquettePasser(etat: EtatCombat): string {
  const { frappes, degats } = coutDuPassage(etat)
  const cout =
    frappes === 0
      ? 'aucune frappe en chemin'
      : `${frappes} frappe${frappes > 1 ? 's' : ''} encaissée${frappes > 1 ? 's' : ''}, ${degats} PV`

  return (
    `<span class="titre">Passer<span class="stats">${etat.compteurPioche} temps</span></span>` +
    `<span class="verdict">− ${cout}</span>`
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

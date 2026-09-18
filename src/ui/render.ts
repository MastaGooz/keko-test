/**
 * Rendu du prototype de combat.
 *
 * Principe : le joueur ne doit jamais avoir à calculer ce que le moteur sait
 * déjà. L'information se pose sur l'objet qu'on touche — ce qu'une carte coûte
 * en temps est sur la carte, ce qu'elle fait à une cible est sur la cible.
 *
 * Seul endroit qui connaît la structure de la page.
 */
import type { Carte, EtatCombat, Evenement } from '../logic/combat.ts'
import { consequence, coutDuPassage, coutDuVol, prevoir, tresorsEnMain, vivants } from '../logic/combat.ts'

/** Fenêtre affichée. Courte volontairement : 12 colonnes tiennent au doigt. */
const PASSE = 2
const FUTUR = 9
const COLONNES = PASSE + FUTUR + 1

const GLYPHE = { carte: '⚔', frappe: '✖', pioche: '↺' }
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

      <div id="ennemis" class="ennemis"></div>
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
    .map(({ ennemi, index }, rang) => blocEnnemi(etat, ennemi, index, rang, visee, fini))
    .join('')
  view.joueur.innerHTML = combattant(
    'TOI',
    etat.pv,
    etat.pvMax,
    fini ? '' : `main renouvelée dans ${etat.compteurPioche}`,
  )

  view.frise.innerHTML = fini ? '' : frise(etat, visee)
  view.legende.innerHTML = fini ? '' : legende(etat, visee)

  // Les boutons de main sont reconstruits : l'écoute est déléguée à la racine.
  view.cartes.innerHTML = etat.main
    .map((c, index) => boutonCarte(etat, c, index, selection, fini))
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

/**
 * Un ennemi. Devient une cible touchable dès qu'une carte est visée : c'est la
 * seconde tape, celle qui remplace l'ancienne confirmation.
 */
function blocEnnemi(
  etat: EtatCombat,
  ennemi: { nom: string; pv: number; pvMax: number; degats: number; periode: number; compteur: number },
  index: number,
  rang: number,
  visee: Carte | null,
  fini: boolean,
): string {
  const corps =
    `<div class="tete">` +
    `<span class="nom"><span class="ordinal">${ORDINAL[rang] ?? '•'}</span> ${ennemi.nom.toUpperCase()}</span>` +
    `<span class="pv">${ennemi.pv}/${ennemi.pvMax}</span>` +
    `</div>` +
    `<div class="jauge"><div class="remplissage" style="width:${Math.max(0, Math.round((ennemi.pv / ennemi.pvMax) * 100))}%"></div></div>` +
    `<div class="rythme">frappe dans ${ennemi.compteur} — ${ennemi.degats} dégâts toutes les ${ennemi.periode}</div>`

  if (visee === null || fini) {
    return `<div class="combattant adverse">${corps}</div>`
  }

  const c = consequence(etat, visee, index)
  const reste = Math.max(0, ennemi.pv - visee.degats)
  const effet = c.gagne
    ? `★ ce coup gagne le combat`
    : c.tue
      ? `★ ce coup l'achève — il ne frappera plus`
      : `le laisse à ${reste} PV`

  return (
    `<button class="combattant adverse cible${c.tue ? ' achevable' : ''}" type="button" ` +
    `data-action="cibler" data-cible="${index}">${corps}` +
    `<div class="effet">${effet}</div></button>`
  )
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
 * droite. Une voie par combattant — la tienne en haut, puis un ennemi par
 * ligne, dans l'ordre des blocs ci-dessus. La bande plus claire est la main en
 * cours : au-delà, les cartes non jouées sont défaussées.
 */
function frise(etat: EtatCombat, visee: Carte | null): string {
  const previsions = prevoir(etat, FUTUR, visee)
  const instants = Array.from({ length: COLONNES }, (_, i) => i - PASSE)

  const cellule = (decalage: number, contenu: string): string => {
    const classes = ['case']
    if (etat.temps + decalage < 0) classes.push('hors')
    if (decalage === 0) classes.push('maintenant')
    if (decalage >= 1 && decalage <= etat.compteurPioche) classes.push('fenetre')
    return `<div class="${classes.join(' ')}">${contenu}</div>`
  }

  // Voie du joueur : ce qu'il a joué, ses renouvellements de main, sa visée.
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
          if (p.dans !== decalage) continue
          if (p.type === 'carte') bulles.push(bulle(GLYPHE.carte, 'projet'))
          if (p.type === 'pioche') bulles.push(bulle(GLYPHE.pioche, 'attendu'))
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

  // Une voie par ennemi debout, dans l'ordre d'affichage.
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
              bulles.push(bulle(ORDINAL[rang] ?? GLYPHE.frappe, 'attendu adverse'))
            }
          }
          return cellule(decalage, bulles.join(''))
        })
        .join('')
      return `<div class="voie">${cases}</div>`
    })
    .join('')

  return (
    `<div class="voie">${voieJoueur}</div>` +
    `<div class="voie axe">${axe}</div>` +
    voiesEnnemis
  )
}

/** Rappelle ce que vaut la bande claire : le temps qu'il reste à dépenser. */
function legende(etat: EtatCombat, visee: Carte | null): string {
  if (visee !== null) {
    const seule = vivants(etat).length === 1
    return seule
      ? `<strong>${visee.nom} visée</strong> — retouche la carte ou touche la cible pour l'engager.`
      : `<strong>${visee.nom} visée</strong> — touche une cible pour l'engager.`
  }

  const jouables = etat.main.filter(
    (carte) => carte.type === 'combat' && carte.vitesse <= etat.compteurPioche,
  ).length

  return (
    `<span class="bande"></span> cette main : <strong>${etat.compteurPioche} de temps</strong>, ` +
    `${jouables} carte${jouables > 1 ? 's' : ''} qui y tiennent`
  )
}

/**
 * Une carte de la main. Son coût en PV ne dépend pas de la cible — pendant
 * qu'elle est en vol, tous les ennemis avancent. C'est donc ici qu'il
 * s'affiche ; ce qu'elle fait à un ennemi s'affiche sur l'ennemi.
 */
function boutonCarte(
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

  const vol = coutDuVol(etat, carte.vitesse)
  const debout = vivants(etat)
  const acheve = debout.some(({ ennemi }) => carte.degats >= ennemi.pv)
  const vise = index === selection

  const classes = ['carte']
  if (vol.mortel) classes.push('letal')
  else if (acheve) classes.push('acheve')
  else classes.push(vol.degats === 0 ? 'propre' : 'couteux')
  if (vise) classes.push('visee')

  // Visée avec une seule cible debout : la retape engage directement.
  const action = vise && debout.length === 1 ? 'cibler' : vise ? 'annuler' : 'viser'
  const donnee = action === 'cibler' ? `data-cible="${debout[0]!.index}"` : `data-index="${index}"`

  const deborde = vol.mortel || carte.vitesse <= etat.compteurPioche ? '' : ' · défausse le reste de ta main'
  const texte = vol.mortel
    ? `☠ tu tombes avant qu'elle ne résolve`
    : vol.degats === 0
      ? `✓ résout dans ${carte.vitesse}, rien d'encaissé${deborde}`
      : `− ${vol.degats} PV d'ici là (${vol.frappes} frappe${vol.frappes > 1 ? 's' : ''})${deborde}`

  const note = acheve && !vol.mortel ? `<span class="marque">achève une cible</span>` : ''

  return (
    `<button class="${classes.join(' ')}" type="button" ` +
    `data-action="${action}" ${donnee}${fini ? ' disabled' : ''}>` +
    `<span class="titre">${vise ? '▶ ' : ''}${carte.nom}` +
    `<span class="stats">${carte.vitesse} temps · ${carte.degats} dégâts</span></span>` +
    `<span class="verdict">${texte}${note}</span>` +
    `</button>`
  )
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
      return `${evenement.ennemis.join(', ')} — ${evenement.ennemis.length > 1 ? 'ils bloquent' : 'il bloque'} le passage.`
    case 'carte':
      return `t${evenement.t} — ${evenement.nom} inflige ${evenement.degats} à ${evenement.cible} (${evenement.pvCible} PV).`
    case 'mort':
      return `t${evenement.t} — ${evenement.nom} s'effondre.`
    case 'frappe':
      return `t${evenement.t} — ${evenement.nom} frappe pour ${evenement.degats} (toi : ${evenement.pvJoueur} PV).`
    case 'pioche':
      return `t${evenement.t} — main renouvelée : ${evenement.cartes} cartes, ${evenement.tresors} trésor(s).`
    case 'issue':
      return evenement.issue === 'victoire' ? 'Plus rien ne bouge.' : 'Tu tombes.'
  }
}

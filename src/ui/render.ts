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
import { CAPACITE_SAC, valeurSac } from '../logic/cartes.ts'
import { dessin } from './illustrations.ts'

/** Le butin transporté : ce que le sac a pris, et combien a été ramassé. */
export type Poche = { ramasse: number; sac: Carte[] }

const GLYPHE = { frappe: '✖', tresor: '▨', energie: '⚡' }

/**
 * Des sigils géométriques, pas de la figuration. Sans illustrateur, un dessin
 * raté coûte plus cher en crédibilité qu'un signe assumé — et un signe suffit
 * à distinguer trois corps à l'écran, ce qu'un chiffre cerclé ne faisait pas.
 */
const SIGILS: Record<string, string> = {
  bouclier: 'M12 3.5 5 6.2v5.3c0 4 2.9 7 7 8.9 4.1-1.9 7-4.9 7-8.9V6.2z',
  croc: 'M6 5h12l-2.6 9.2L12 20l-3.4-5.8z',
  couronne: 'M4 8.5l3.6 3L12 5l4.4 6.5 3.6-3V18H4z',
  chevron: 'M5 8.5l7 5 7-5M5 14l7 5 7-5',
  joueur: 'M12 3.5l8 4v5c0 4.2-3.3 7.8-8 9.5-4.7-1.7-8-5.3-8-9.5v-5z',
}

/** Qui porte quel sigil. Inconnu -> chevron, le signe neutre. */
const CORPS: Record<string, string> = {
  Garde: 'bouclier',
  Roquet: 'croc',
  Cabot: 'croc',
  Meneur: 'couronne',
  Suiveur: 'chevron',
  Traînard: 'chevron',
  joueur: 'joueur',
}

function sigil(nom: string): string {
  const trace = SIGILS[CORPS[nom] ?? 'chevron'] ?? SIGILS.chevron
  return (
    `<svg class="sigil" viewBox="0 0 24 24" aria-hidden="true">` +
    `<path d="${trace}" fill="none" stroke="currentColor" stroke-width="1.6" ` +
    `stroke-linejoin="round" stroke-linecap="round"/></svg>`
  )
}

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
  poche: Poche,
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
    .map((c, index) => ligneCarte(etat, c, index, selection, fini, etat.main.length))
    .join('')
  view.encombrement.innerHTML = fini ? '' : encombrement(etat, poche)

  view.finTour.innerHTML = etiquetteFinTour(etat)
  view.finTour.disabled = fini

  view.issue.innerHTML = issue(etat, poche)

  view.cupidite.innerHTML = reglageCupidite(poche)

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
  // L'intention se lit en un coup d'oeil : ce qu'il frappe, et dans combien de
  // tours. Vif s'il frappe à la fin de CE tour, en attente sinon.
  const attente = imminent ? '' : `<span class="delai">${ennemi.compteur}t</span>`
  const corps =
    `<span class="ordinal">${sigil(ennemi.nom)}</span>` +
    `<span class="nom">${ennemi.nom}</span>` +
    jauge(ennemi.pv, ennemi.pvMax) +
    `<span class="pv">${ennemi.pv}</span>` +
    `<span class="coup${imminent ? ' imminent' : ''}">` +
    `${GLYPHE.frappe}${ennemi.degats}${attente}</span>`

  if (visee === null || fini) {
    return `<div class="rang adverse" data-corps="${index}" data-rang="${rang}">${corps}</div>`
  }

  const c = consequence(etat, visee, index)
  const effet = c.gagne
    ? `<span class="effet gagne">★ gagne</span>`
    : c.tue
      ? `<span class="effet gagne">★ achève${c.evite > 0 ? ` −${c.evite}` : ''}</span>`
      : `<span class="effet">→ ${Math.max(0, ennemi.pv - visee.degats)}</span>`

  return (
    `<button class="rang adverse cible${c.tue ? ' achevable' : ''}" type="button" ` +
    `data-action="cibler" data-cible="${index}" data-corps="${index}" ` +
    `data-rang="${rang}">${corps}${effet}</button>`
  )
}

/** Le joueur, avec ce qu'il encaissera à la fin du tour s'il en reste là. */
function ligneJoueur(etat: EtatCombat, visee: Carte | null, fini: boolean): string {
  const menace = menaceDuTour(etat)
  const marque = fini || menace === 0 ? '' : `−${menace}`

  return (
    `<div class="rang" data-corps="joueur">` +
    `<span class="ordinal">${sigil('joueur')}</span>` +
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

/**
 * Une vraie carte, pas une ligne. La main est le seul endroit du prototype qui
 * mérite de la place : c'est là que se joue l'hypothèse. Un trésor doit
 * occuper VISIBLEMENT une des cinq cases — une ligne de texte de plus ne se
 * ressent pas, une carte en travers de la main, si.
 */
function ligneCarte(
  etat: EtatCombat,
  carte: Carte,
  index: number,
  selection: number | null,
  fini: boolean,
  total: number,
): string {
  const place = eventail(index, total)
  if (carte.type === 'tresor') return carteTresor(carte, place)

  const debout = vivants(etat)
  const abordable = carte.cout <= etat.energie
  const acheve = abordable && debout.some(({ ennemi }) => carte.degats >= ennemi.pv)
  const vise = index === selection

  const classes = ['carte', 'combat']
  if (!abordable) classes.push('hors-prix')
  else if (acheve) classes.push('acheve')
  else classes.push('jouable')
  if (vise) classes.push('visee')

  // Visée avec une seule cible debout : la retape engage directement.
  const action = !abordable ? '' : vise && debout.length === 1 ? 'cibler' : vise ? 'annuler' : 'viser'
  const donnee = action === 'cibler' ? `data-cible="${debout[0]!.index}"` : `data-index="${index}"`

  // Le coût porte la couleur : le petit coup est froid, le gros est chaud. On
  // lit le poids d'une carte avant d'avoir lu son chiffre.
  return (
    `<button class="${classes.join(' ')}" type="button" data-cout="${carte.cout}" ` +
    `${place} data-action="${action}" ${donnee}` +
    `${fini || !abordable ? ' disabled' : ''}>` +
    `<span class="vitre">${dessin(carte.nom)}</span>` +
    `<span class="plaque"><span class="nom">${carte.nom}</span></span>` +
    // Gemme et badge vivent sur la BANDE GAUCHE : c'est la seule partie d'une
    // carte qui reste visible quand l'éventail se recouvre. Tout ce qui sert
    // à décider doit tenir là.
    `<span class="gemme">${carte.cout}</span>` +
    `<span class="badge degats">${carte.degats}</span>` +
    `<span class="marque">${acheve ? '★' : ''}</span>` +
    `</button>`
  )
}

/**
 * La place d'une carte dans l'éventail. Calculé ici plutôt qu'en CSS : élever
 * un écart au carré pour obtenir l'arc ne se fait pas proprement en feuille de
 * style, et le rendu reste la seule chose qui connaît le nombre de cartes.
 */
function eventail(index: number, total: number): string {
  const ecart = index - (total - 1) / 2
  const rotation = (ecart * 2.4).toFixed(2)
  // L'arc : les cartes des bords descendent, celle du milieu culmine.
  const descente = (ecart * ecart * 2.6).toFixed(2)
  // `--n` sert au calcul du recouvrement : les cartes sont grandes et se
  // partagent la colonne en se chevauchant, quelle que soit la taille de
  // l'écran. Une largeur fixe sortait de l'écran sur un petit téléphone.
  return `style="--rot:${rotation}deg;--dy:${descente}px;--i:${index};--n:${total}"`
}

/**
 * Le trésor est plein, doré et lisible — pas grisé. C'est délibéré : l'appât
 * et le poids sont le même objet. Une carte fantôme se laisserait oublier,
 * or c'est exactement ce qu'on ne veut pas faire oublier.
 */
function carteTresor(carte: Carte, place: string): string {
  const valeur = carte.valeur ?? 0
  return (
    `<div class="carte tresor ${richesse(valeur)}" ${place}>` +
    `<span class="vitre">${dessin(carte.nom)}</span>` +
    `<span class="plaque"><span class="nom">${carte.nom}</span></span>` +
    `<span class="bandeau">MORTE</span>` +
    `<span class="gemme sceau">${GLYPHE.tresor}</span>` +
    `<span class="badge valeur">${valeur}</span>` +
    `</div>`
  )
}

/**
 * Trois rangs de richesse, lisibles à la couleur du cadre. Ce n'est pas que
 * de la parure : la décision de design dit que le joueur doit préférer peu de
 * gros trésors à beaucoup de petits. Encore faut-il qu'il voie, sans lire un
 * chiffre, que la carte morte qu'il traîne est une babiole et pas une couronne.
 */
function richesse(valeur: number): string {
  if (valeur >= 160) return 'fastueux'
  if (valeur >= 90) return 'cossu'
  return 'modeste'
}

/**
 * Un trésor ne devient de l'or qu'au marché noir, après la run : on n'annonce
 * donc jamais un gain ici, seulement ce que le butin VAUDRA s'il ressort.
 * Sans ce chiffre, porter du poids n'a aucune contrepartie visible et le
 * joueur ne teste qu'une punition.
 */
function issue(etat: EtatCombat, poche: Poche): string {
  // Le sac tombe avec le joueur : il met le butin à l'abri du DECK, pas de la mort.
  const valeur = butin(etat) + valeurSac(poche.sac)
  if (etat.issue === 'victoire') {
    return valeur === 0
      ? 'VICTOIRE.'
      : `VICTOIRE — butin intact, <span class="or">${valeur}</span> à revendre au hub.`
  }
  if (etat.issue === 'defaite') {
    return valeur === 0
      ? 'MORT. Tout est perdu.'
      : `MORT — butin perdu, <span class="perdu">${valeur}</span> envolés.`
  }
  return ''
}

/**
 * Décision de design : le taux d'encombrement est toujours visible. On montre
 * d'abord le sac, parce que c'est lui qui explique le reste — ce qui est
 * dedans ne coûte rien, ce qui déborde coûte une place de main à chaque tour.
 */
function encombrement(etat: EtatCombat, poche: Poche): string {
  const enTrop =
    [...etat.pioche, ...etat.main, ...etat.defausse].filter((c) => c.type === 'tresor').length
  const valeur = butin(etat) + valeurSac(poche.sac)

  return (
    `Sac ${GLYPHE.tresor} <strong>${poche.sac.length}/${CAPACITE_SAC}</strong> · ` +
    `<strong>${enTrop}</strong> en trop dans le deck · ` +
    `${GLYPHE.tresor} <strong>${tresorsEnMain(etat)}/${etat.main.length}</strong> en main · ` +
    `butin : <strong class="or">${valeur}</strong> à revendre`
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
 * pour poser — déborder du sac, pari tendu ou corvée ?
 *
 * Il compte le butin RAMASSÉ, sac compris. Le premier cran remplit le sac
 * pile : c'est la run propre, zéro carte morte. Les suivants débordent de
 * 2, 4, 6, 8 — les mêmes valeurs que les mesures déjà faites, pour que la
 * courbe reste comparable.
 */
function reglageCupidite(poche: Poche): string {
  const choix = [3, 5, 7, 9, 11]
    .map(
      (n) =>
        `<button class="pastille${n === poche.ramasse ? ' active' : ''}" type="button" ` +
        `data-action="cupidite" data-ramasse="${n}">${n}</button>`,
    )
    .join('')

  const enTrop = Math.max(0, poche.ramasse - CAPACITE_SAC)
  const consequence =
    enTrop === 0
      ? 'le sac absorbe tout'
      : `${enTrop} carte${enTrop > 1 ? 's' : ''} morte${enTrop > 1 ? 's' : ''}`

  return (
    `<span class="etiquette">Butin ramassé</span>${choix}` +
    `<span class="etiquette">${consequence}</span>`
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

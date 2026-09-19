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
import { consequence, menaceDuTour, tresorsEnMain, vivants } from '../logic/combat.ts'
import { CAPACITE_SAC } from '../logic/cartes.ts'
import type { Descente, Recompense } from '../logic/descente.ts'
import { butinTransporte, placeDuSac, tresorsAuDeck } from '../logic/descente.ts'
import { creature, dessin, sceau } from './illustrations.ts'

const GLYPHE = { frappe: '✖', tresor: '▨', energie: '⚡' }

/** Le joueur garde un sigil : il n'est pas sur la scène, il est la barre. */
function sigilJoueur(): string {
  return (
    `<svg class="sigil" viewBox="0 0 24 24" aria-hidden="true">` +
    `<path d="M12 3.5l8 4v5c0 4.2-3.3 7.8-8 9.5-4.7-1.7-8-5.3-8-9.5v-5z" ` +
    `fill="none" stroke="currentColor" stroke-width="1.6" ` +
    `stroke-linejoin="round" stroke-linecap="round"/></svg>`
  )
}

/**
 * Quelle silhouette, et quelle teinte, pour chaque nom d'ennemi. Trois espèces
 * suffisent : ce qu'on veut, c'est distinguer les corps d'un coup d'oeil, pas
 * peupler un bestiaire.
 */
const ESPECES: Record<string, { espece: string; teinte: string }> = {
  Garde: { espece: 'garde', teinte: '#8f9bb3' },
  Roquet: { espece: 'roquet', teinte: '#b5765a' },
  Cabot: { espece: 'roquet', teinte: '#a08055' },
  Meneur: { espece: 'meneur', teinte: '#c2705f' },
  Suiveur: { espece: 'roquet', teinte: '#9a7a62' },
  'Traînard': { espece: 'roquet', teinte: '#7f8a6e' },
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
  palier: HTMLElement
  journal: HTMLElement
  pleinEcran: HTMLButtonElement
  son: HTMLButtonElement
  visees: SVGSVGElement
}

/** Construit le squelette une seule fois et renvoie les noeuds à mettre à jour. */
export function mount(root: HTMLElement, buildTime: string): View {
  root.innerHTML = `
    <main class="app">
      <header class="entete">
        <p class="build">Build : <time>${buildTime}</time> — seed <span id="seed"></span></p>
        <button class="reglages" type="button" data-action="panneau">Réglages</button>
      </header>

      <svg id="visees" class="visees" aria-hidden="true"></svg>

      <div id="ennemis" class="rangs"></div>
      <div id="joueur" class="rangs"></div>
      <p id="energie" class="energie"></p>

      <div id="cartes" class="cartes"></div>
      <button id="finTour" class="rang bouton finTour" type="button" data-action="finTour"></button>
      <p id="encombrement" class="encombrement"></p>

      <!-- Récompense, point de sortie, fin de descente : tout ce qui n'est pas
           le combat se pose par-dessus lui, sans refaire la mise en page. -->
      <div id="palier" class="palier"></div>

      <!-- Les commandes de test sortent du flux : elles poussaient le combat
           sous le bord de l'ecran en portrait. Elles remontent a la demande,
           et toutes seules quand le combat est fini. -->
      <div class="panneau">
        <button class="fermer" type="button" data-action="panneau" aria-label="Fermer">×</button>
        <div class="reprise">
          <button id="pleinEcran" class="bouton secondaire" type="button" data-action="pleinEcran">
            Plein écran
          </button>
          <button id="son" class="bouton secondaire" type="button" data-action="son">Son</button>
        </div>
        <div class="reprise">
          <button class="bouton secondaire" type="button" data-action="rejouer">Rejouer cette seed</button>
          <button class="bouton secondaire" type="button" data-action="nouveau">Nouvelle descente</button>
        </div>
        <div id="journal" class="journal"></div>
      </div>
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
    palier: root.querySelector<HTMLElement>('#palier')!,
    journal: root.querySelector<HTMLElement>('#journal')!,
    pleinEcran: root.querySelector<HTMLButtonElement>('#pleinEcran')!,
    son: root.querySelector<HTMLButtonElement>('#son')!,
    visees: root.querySelector<SVGSVGElement>('#visees')!,
  }
}

/** Reflète l'état dans le DOM. Appelé après chaque action. */
export function render(
  view: View,
  descente: Descente,
  seed: number,
  selection: number | null,
): void {
  const etat = descente.combat
  const fini = etat.issue !== null
  const carte = selection === null ? null : (etat.main[selection] ?? null)
  const visee = carte !== null && carte.type === 'combat' ? carte : null

  view.seed.textContent = String(seed)
  view.ennemis.innerHTML = vivants(etat)
    .map(({ ennemi, index }) => corpsEnnemi(etat, ennemi, index, visee, fini))
    .join('')
  view.joueur.innerHTML = ligneJoueur(etat, visee, fini)
  view.energie.innerHTML = fini ? '' : energie(etat, visee)

  // Les boutons de main sont reconstruits : l'écoute est déléguée à la racine.
  view.cartes.innerHTML = etat.main
    .map((c, index) => ligneCarte(etat, c, index, selection, fini, etat.main.length))
    .join('')
  view.encombrement.innerHTML = encombrement(descente)

  view.finTour.innerHTML = etiquetteFinTour(etat)
  view.finTour.disabled = fini

  view.palier.innerHTML = palier(descente)

  view.journal.innerHTML = etat.evenements
    .slice(-3)
    .map((evenement) => `<p>${phrase(evenement)}</p>`)
    .join('')
}

/**
 * Un ennemi sur la scène : son corps, son intention au-dessus de la tête, sa
 * jauge et son nom en dessous. Toute la créature est la cible tactile.
 *
 * L'intention est le seul chiffre qui compte avant de choisir : ce qu'il
 * frappe, et dans combien de tours. Elle est vive s'il frappe à la fin de CE
 * tour, en attente sinon — la couleur porte le tempo, aucun mot n'est requis.
 */
function corpsEnnemi(
  etat: EtatCombat,
  ennemi: { nom: string; pv: number; pvMax: number; degats: number; compteur: number },
  index: number,
  visee: Carte | null,
  fini: boolean,
): string {
  const imminent = ennemi.compteur <= 1
  const espece = ESPECES[ennemi.nom] ?? { espece: 'roquet', teinte: '#9a7a62' }
  const attente = imminent ? '' : `<span class="delai">${ennemi.compteur}t</span>`

  const c = visee === null || fini ? null : consequence(etat, visee, index)
  const sort =
    c === null
      ? ''
      : c.gagne
        ? `<span class="effet gagne">★ gagne</span>`
        : c.tue
          ? `<span class="effet gagne">★ achève${c.evite > 0 ? ` −${c.evite}` : ''}</span>`
          : `<span class="effet">→ ${Math.max(0, ennemi.pv - visee!.degats)}</span>`

  const corps =
    `<span class="intention${imminent ? ' imminent' : ''}">` +
    `${GLYPHE.frappe}${ennemi.degats}${attente}</span>` +
    `<span class="chair" style="--teinte:${espece.teinte}">` +
    `${creature(espece.espece, String(index))}<span class="socle"></span></span>` +
    jauge(ennemi.pv, ennemi.pvMax) +
    `<span class="plaquette"><span class="nom">${ennemi.nom}</span>` +
    `<span class="pv">${ennemi.pv}</span></span>` +
    sort

  if (c === null) {
    return `<div class="creature" data-corps="${index}">${corps}</div>`
  }

  return (
    `<button class="creature cible${c.tue ? ' achevable' : ''}" type="button" ` +
    `data-action="cibler" data-cible="${index}" data-corps="${index}">${corps}</button>`
  )
}

/** Le joueur, avec ce qu'il encaissera à la fin du tour s'il en reste là. */
function ligneJoueur(etat: EtatCombat, visee: Carte | null, fini: boolean): string {
  const menace = menaceDuTour(etat)
  const marque = fini || menace === 0 ? '' : `−${menace}`

  return (
    `<div class="rang" data-corps="joueur">` +
    `<span class="ordinal">${sigilJoueur()}</span>` +
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
function carteTresor(carte: Carte, place: string, morte = true): string {
  const valeur = carte.valeur ?? 0
  return (
    `<div class="carte tresor ${richesse(valeur)}" ${place}>` +
    `<span class="vitre">${dessin(carte.nom)}</span>` +
    `<span class="plaque${morte ? '' : ' seule'}"><span class="nom">${carte.nom}</span></span>` +
    (morte ? `<span class="bandeau">MORTE</span>` : '') +
    `<span class="gemme sceau">${sceau()}</span>` +
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
 * Décision de design : le taux d'encombrement est toujours visible. On montre
 * d'abord le sac, parce que c'est lui qui explique le reste — ce qui est
 * dedans ne coûte rien, ce qui déborde coûte une place de main à chaque tour.
 */
function encombrement(descente: Descente): string {
  const etat = descente.combat
  return (
    `Palier <strong>${descente.profondeur}/${descente.reglage.profondeurMax}</strong> · ` +
    `Sac ${GLYPHE.tresor} <strong>${descente.sac.length}/${CAPACITE_SAC}</strong> · ` +
    `<strong>${tresorsAuDeck(descente)}</strong> en trop dans le deck · ` +
    `${GLYPHE.tresor} <strong>${tresorsEnMain(etat)}/${etat.main.length}</strong> en main · ` +
    `butin : <strong class="or">${butinTransporte(descente)}</strong> en jeu`
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

/* ------------------------------------------------------------------------ *
 * Les paliers : tout ce qui n'est pas le combat.
 * ------------------------------------------------------------------------ */

/**
 * Le calque de palier. Il se pose PAR-DESSUS le combat plutôt que de le
 * remplacer : le joueur garde sous les yeux le deck et les PV avec lesquels il
 * décide. C'est exactement l'information dont il a besoin pour choisir.
 */
function palier(descente: Descente): string {
  switch (descente.phase.type) {
    case 'combat':
      return ''
    case 'recompense':
      return recompense(descente, descente.phase.gain)
    case 'sortie':
      return sortie(descente)
    case 'fin':
      return fin(descente, descente.phase.issue)
  }
}

/**
 * La récompense du palier : **les deux**, pas l'une ou l'autre. Le choix entre
 * carte et trésor était un faux choix — la simulation n'a jamais réussi à lui
 * faire coûter de la survie. La cupidité se décide désormais au point de
 * sortie.
 *
 * Reste une décision, et une seule : quand le sac est plein, le trésor ira
 * peser dans le deck. Là seulement on propose de le laisser. Refuser une
 * place de sac libre n'aurait aucun sens, donc le bouton n'existe pas.
 */
function recompense(descente: Descente, gain: Recompense): string {
  const place = placeDuSac(descente)
  const pese = place === 0

  const sort = pese
    ? `<span class="sort mauvais">→ carte morte dans le deck</span>`
    : `<span class="sort bon">→ sac (${place} place${place > 1 ? 's' : ''})</span>`

  const boutons = pese
    ? `<div class="offres">` +
      `<button class="issue-choix continuer" type="button" data-action="encaisser">` +
      `<span class="quoi">Tout prendre</span>` +
      `<span class="pourquoi">Le trésor pèsera</span></button>` +
      `<button class="issue-choix rentrer" type="button" data-action="encaisser" data-tresor="non">` +
      `<span class="quoi">Laisser le trésor</span>` +
      `<span class="pourquoi">Perdu pour de bon</span></button>` +
      `</div>`
    : `<button class="bouton secondaire" type="button" data-action="encaisser">Empocher</button>`

  return (
    `<div class="voile">` +
    `<div class="feuille">` +
    `<p class="titre">Palier ${descente.profondeur} — ta prise</p>` +
    `<div class="offres">` +
    `<div class="offre montre">${vitrine(gain.carte)}` +
    `<span class="sort bon">→ ton deck</span></div>` +
    `<div class="offre montre">${vitrine(gain.tresor, pese)}${sort}</div>` +
    `</div>` +
    boutons +
    `</div></div>`
  )
}

/** Le point de sortie. La seule question du jeu, posée en deux boutons. */
function sortie(descente: Descente): string {
  const suivant = descente.profondeur + 1
  const pv = descente.combat.pv
  const part = Math.round((pv / descente.combat.pvMax) * 100)

  return (
    `<div class="voile">` +
    `<div class="feuille">` +
    `<p class="titre">Point de sortie</p>` +
    `<p class="bilan">Tu portes <strong class="or">${butinTransporte(descente)}</strong> ` +
    `et il te reste <strong class="${part < 40 ? 'perdu' : ''}">${pv}</strong> PV.</p>` +
    `<div class="offres">` +
    `<button class="issue-choix rentrer" type="button" data-action="extraire">` +
    `<span class="quoi">Rentrer</span>` +
    `<span class="pourquoi">Tu gardes tout</span></button>` +
    `<button class="issue-choix continuer" type="button" data-action="descendre">` +
    `<span class="quoi">Palier ${suivant}</span>` +
    `<span class="pourquoi">Plus dur, plus riche</span></button>` +
    `</div>` +
    `<p class="note">Tes PV ne remontent pas. Mourir fait tout perdre.</p>` +
    `</div></div>`
  )
}

/** La fin de la descente : ce qu'on ramène, ou ce qu'on vient de laisser. */
function fin(descente: Descente, issue: 'extrait' | 'mort'): string {
  const valeur = butinTransporte(descente)
  const extrait = issue === 'extrait'

  return (
    `<div class="voile">` +
    `<div class="feuille ${extrait ? 'extrait' : 'mort'}">` +
    `<p class="titre">${extrait ? 'EXTRAIT' : 'MORT'}</p>` +
    `<p class="bilan">` +
    (extrait
      ? `Tu ressors du palier ${descente.profondeur} avec ` +
        `<strong class="or">${valeur}</strong> de butin.`
      : `Palier ${descente.profondeur}. <strong class="perdu">${valeur}</strong> ` +
        `de butin restent au fond, avec toi.`) +
    `</p>` +
    `<button class="bouton secondaire" type="button" data-action="nouveau">` +
    `Nouvelle descente</button>` +
    `</div></div>`
  )
}

/** Une carte montrée, sans état de jeu : ni coût payable, ni cible. */
function vitrine(carte: Carte, morte = true): string {
  if (carte.type === 'tresor') return carteTresor(carte, 'style="--n:1"', morte)
  return (
    `<div class="carte combat" data-cout="${carte.cout}" style="--n:1">` +
    `<span class="vitre">${dessin(carte.nom)}</span>` +
    `<span class="plaque"><span class="nom">${carte.nom}</span></span>` +
    `<span class="gemme">${carte.cout}</span>` +
    `<span class="badge degats">${carte.degats}</span>` +
    `</div>`
  )
}

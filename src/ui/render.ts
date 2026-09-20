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
import type { Descente } from '../logic/descente.ts'
import { butinTransporte, tresorsAuDeck, tresorsAuSac } from '../logic/descente.ts'
import { CAPACITE_SAC as SLOTS } from '../logic/cartes.ts'
import { creature, dessin, sceau } from './illustrations.ts'

const GLYPHE = { frappe: '✖', tresor: '▨', energie: '⚡' }

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

/**
 * Le joueur et les ennemis, tels que le gros plan d'attaque a besoin de les
 * connaître. C'est ici que vit la table des espèces, donc c'est ici qu'on la
 * lit — `duel.ts` n'a pas à savoir quel monstre porte quelle silhouette.
 */
export const FIGURE_JOUEUR = { nom: 'TOI', espece: 'joueur', teinte: '#7fb6d9' }

export function figure(nom: string): { nom: string; espece: string; teinte: string } {
  const e = ESPECES[nom] ?? { espece: 'roquet', teinte: '#9a7a62' }
  return { nom, espece: e.espece, teinte: e.teinte }
}

export type View = {
  root: HTMLElement
  seed: HTMLElement
  ennemis: HTMLElement
  energie: HTMLElement
  cartes: HTMLElement
  encombrement: HTMLElement
  finTour: HTMLButtonElement
  pioche: HTMLElement
  defausse: HTMLElement
  palier: HTMLElement
  zoom: HTMLElement
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

      <!-- L'info de run reste en haut : elle se consulte, elle ne se joue pas. -->
      <p id="encombrement" class="encombrement"></p>

      <!-- La scène : le joueur et les ennemis, face à face, sur le même sol.
           Elle prend toute la place qui reste entre l'info et la main. -->
      <div id="ennemis" class="rangs scene"></div>

      <!-- La main touche le bas de l'écran. Rien dessous : c'est la règle de
           lecture du genre, ce qu'on joue est le plus près du pouce. -->
      <div id="cartes" class="cartes"></div>

      <!-- Ancrés aux bords, hors du flux : ils encadrent la main sans lui
           prendre un pixel de large ni un étage de haut. -->
      <div id="energie" class="orbe energie"></div>
      <div id="pioche" class="tas-jeu coin-gauche"></div>
      <div id="defausse" class="tas-jeu coin-droit"></div>
      <button id="finTour" class="bouton finTour" type="button" data-action="finTour"></button>

      <!-- Récompense, point de sortie, fin de descente : tout ce qui n'est pas
           le combat se pose par-dessus lui, sans refaire la mise en page. -->
      <div id="palier" class="palier"></div>

      <!-- La carte qu'on regarde de près. Vide la plupart du temps. -->
      <div id="zoom" class="zoom"></div>

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
    energie: root.querySelector<HTMLElement>('#energie')!,
    cartes: root.querySelector<HTMLElement>('#cartes')!,
    encombrement: root.querySelector<HTMLElement>('#encombrement')!,
    finTour: root.querySelector<HTMLButtonElement>('#finTour')!,
    pioche: root.querySelector<HTMLElement>('#pioche')!,
    defausse: root.querySelector<HTMLElement>('#defausse')!,
    palier: root.querySelector<HTMLElement>('#palier')!,
    zoom: root.querySelector<HTMLElement>('#zoom')!,
    journal: root.querySelector<HTMLElement>('#journal')!,
    pleinEcran: root.querySelector<HTMLButtonElement>('#pleinEcran')!,
    son: root.querySelector<HTMLButtonElement>('#son')!,
    visees: root.querySelector<SVGSVGElement>('#visees')!,
  }
}

/** Reflète l'état dans le DOM. Appelé après chaque action. */
/**
 * Ce qui occupe l'écran. `libre` = c'est au joueur de jouer ; sinon une
 * animation se déroule et l'entrée est verrouillée.
 */
export type Occupation = 'libre' | 'coup' | 'ennemis'

export function render(
  view: View,
  descente: Descente,
  seed: number,
  selection: number | null,
  occupation: Occupation = 'libre',
  auFront: number | null = null,
  zoom: number | null = null,
): void {
  view.root.classList.toggle('occupe', occupation !== 'libre')
  const etat = descente.combat
  const fini = etat.issue !== null
  const carte = selection === null ? null : (etat.main[selection] ?? null)
  const visee = carte !== null && carte.type === 'combat' ? carte : null

  view.seed.textContent = String(seed)
  // Un corps abattu ne revient pas : sa mort s'est jouée dans le gros plan,
  // il n'y a plus rien à montrer de lui sur la scène.
  view.ennemis.innerHTML =
    corpsJoueur(etat, visee, fini, auFront !== null) +
    etat.ennemis
      .map((ennemi, index) => ({ ennemi, index }))
      .filter(({ ennemi }) => ennemi.pv > 0)
      .map(({ ennemi, index }) => corpsEnnemi(etat, ennemi, index, visee, fini, index === auFront))
      .join('')
  view.energie.innerHTML = fini ? '' : energie(etat, visee)

  // Les boutons de main sont reconstruits : l'écoute est déléguée à la racine.
  view.cartes.innerHTML = etat.main
    .map((c, index) => ligneCarte(etat, c, index, selection, fini, etat.main.length))
    .join('')
  view.encombrement.innerHTML = encombrement(descente)

  view.pioche.innerHTML = tasDeJeu('Pioche', etat.pioche.length)
  view.defausse.innerHTML = tasDeJeu('Défausse', etat.defausse.length)

  // La carte regardee de pres. Elle vient de l'ETAT et non d'une classe posee
  // a la main : le premier rendu venu la balaierait.
  const regardee = zoom === null ? null : (etat.main[zoom] ?? null)
  // Le bouton « Jouer » du zoom est un FILET, pas le chemin normal : on joue en
  // sortant la carte de la main. Mais le glisser peut échouer sur un téléphone,
  // et ce dépôt a pour règle qu'une tape doit toujours pouvoir tout faire — il
  // garantit qu'on n'est jamais bloqué faute de pouvoir glisser.
  const jouable = regardee !== null && regardee.type === 'combat' && !fini && regardee.cout <= etat.energie
  view.zoom.innerHTML =
    regardee === null
      ? ''
      : `<button class="zoom-fond" type="button" data-action="fermerZoom" aria-label="Fermer">` +
        `</button><div class="zoom-carte">${vitrine(regardee, regardee.type === 'tresor')}</div>` +
        // Le bouton est frère de la carte, pas son enfant : `.zoom-carte` porte
        // une animation d'entrée, donc un `transform` — il deviendrait le bloc
        // conteneur de ce qu'il contient, et le bouton ne pourrait plus
        // s'ancrer à l'écran.
        (jouable
          ? `<button class="bouton zoom-jouer" type="button" data-action="jouerDepuisLeZoom" ` +
            `data-index="${zoom}">Jouer</button>`
          : '')
  view.root.classList.toggle('zoom-ouvert', regardee !== null)

  view.finTour.innerHTML = etiquetteFinTour(etat, occupation)
  view.finTour.disabled = fini || occupation !== 'libre'

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
  auFront = false,
): string {
  const imminent = ennemi.compteur <= 1
  const espece = ESPECES[ennemi.nom] ?? { espece: 'roquet', teinte: '#9a7a62' }
  const attente = imminent ? '' : `<span class="delai">${ennemi.compteur}t</span>`

  const c = visee === null || fini ? null : consequence(etat, visee, index)
  // Aucun aperçu de PV restants sous le corps : il ajoutait une ligne, donc
  // faisait sauter la hauteur du rang au moment même où l'on vise. Et il
  // n'apprenait rien — la carte affiche ses dégâts, et le corps qu'elle peut
  // achever se signale déjà par son cadre blanc.

  const corps =
    `<span class="intention${imminent ? ' imminent' : ''}">` +
    `${GLYPHE.frappe}${ennemi.degats}${attente}</span>` +
    `<span class="chair" style="--teinte:${espece.teinte}">` +
    `${creature(espece.espece, String(index))}<span class="socle"></span></span>` +
    jauge(ennemi.pv, ennemi.pvMax) +
    `<span class="plaquette"><span class="nom">${ennemi.nom}</span></span>`

  // `au-front` : ce corps est en ce moment dans le gros plan, il a quitté
  // l'arrière-plan. La classe vient de l'ÉTAT et pas d'une pose à la main,
  // sinon le premier rendu venu la balaierait en plein gros plan.
  const front = auFront ? ' au-front' : ''

  if (c === null) {
    return `<div class="creature${front}" data-corps="${index}">${corps}</div>`
  }

  return (
    `<button class="creature cible${c.tue ? ' achevable' : ''}${front}" type="button" ` +
    `data-action="cibler" data-cible="${index}" data-corps="${index}">${corps}</button>`
  )
}

/**
 * Le joueur sur la scène, comme un combattant parmi les autres : son corps,
 * sa jauge, et au-dessus de sa tête ce qu'il encaissera à la fin du tour —
 * exactement où les ennemis affichent leur intention.
 *
 * C'était une barre posée au-dessus de la main. Une barre ne raconte pas un
 * affrontement ; un corps qui fait face, si.
 */
function corpsJoueur(
  etat: EtatCombat,
  visee: Carte | null,
  fini: boolean,
  auFront = false,
): string {
  const menace = menaceDuTour(etat)
  const marque =
    fini || menace === 0
      ? '<span class="intention calme">—</span>'
      : `<span class="intention encaisse-a-venir">−${menace}</span>`

  return (
    `<div class="creature moi${auFront ? ' au-front' : ''}" data-corps="joueur">` +
    marque +
    `<span class="chair" style="--teinte:#7fb6d9">` +
    `${creature('joueur', 'moi')}<span class="socle"></span></span>` +
    jauge(etat.pv, etat.pvMax) +
    `<span class="plaquette"><span class="nom">TOI</span></span>` +
    (visee === null || fini ? '' : '') +
    `</div>`
  )
}

/**
 * La jauge PORTE son chiffre, au format `courant/max`.
 *
 * Il vivait à côté du nom, et il y disait deux fois moins : sans le maximum on
 * ne sait pas si 23 est beaucoup, et à côté d'une barre il faut faire l'aller-
 * retour entre les deux pour lire un seul fait. Dans la barre, la longueur et
 * le chiffre disent la même chose au même endroit.
 */
function jauge(pv: number, pvMax: number): string {
  const part = Math.max(0, Math.round((pv / pvMax) * 100))
  // Les PV sont poses sur la jauge : l'apercu des degats les relit de la pour
  // se calculer, plutot que de recevoir l'etat. Ce qu'il annote, c'est ce qui
  // est a l'ecran -- meme source, donc jamais un demi-rendu de decalage.
  return (
    `<span class="jauge" data-pv="${pv}" data-pvmax="${pvMax}">` +
    `<span class="remplissage" style="width:${part}%"></span>` +
    `<span class="apercu"></span>` +
    `<span class="chiffre-pv">${pv}<span class="sur-pv">/${pvMax}</span></span></span>`
  )
}

/**
 * L'énergie : le chiffre, et rien d'autre.
 *
 * Il y avait un liseré de pastilles autour, qui doublait le chiffre et
 * marquait en creux ce que la carte visée allait coûter. Keko : « on voit le
 * chiffre c'est suffisant ». Ce qui disparaît avec elles, et qu'il faudra
 * rendre autrement si ça manque : l'aperçu de ce qu'il RESTERAIT après avoir
 * joué la carte levée. Le coût, lui, est sur la gemme de la carte.
 */
function energie(etat: EtatCombat, _visee: Carte | null): string {
  return `<span class="chiffre">${etat.energie}<span class="sur">/${etat.energieMax}</span></span>`
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
  // Chaque carte de la main est saisissable et zoomable, tresor compris : on
  // range sa main comme on veut, et on regarde ce qu'on traine.
  const prise = `data-action="zoomer" data-index="${index}" data-main="${index}"`
  const place = eventail(index, total) + ' ' + prise
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

  // `disabled` UNIQUEMENT quand le combat est fini. Une carte trop chere reste
  // saisissable et zoomable : on veut pouvoir la ranger et la regarder, et
  // c'est le depot qui refusera de la jouer. `disabled` couperait aussi le
  // `pointerdown`, donc le glisser.
  return (
    `<button class="${classes.join(' ')}" type="button" data-cout="${carte.cout}" ` +
    `${place}${fini ? ' disabled' : ''}>` +
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
  const rotation = (ecart * 2.2).toFixed(2)
  // L'arc : les cartes des bords descendent, celle du milieu culmine.
  //
  // Coefficients abaissés (2,6 -> 1,6 et 2,4 -> 2,2) quand les cartes ont
  // grandi. L'arc est en PIXELS FIXES, donc il ne suit pas la carte — et la
  // rotation, elle, fait d'autant plus plonger le coin bas-gauche que la carte
  // est haute. Or c'est là que vit le chiffre de dégâts, et la carte plonge
  // déjà sous le bord de l'écran : il ne lui restait plus que 4 px de garde.
  // L'arc reste lisible, il est juste moins creusé.
  const descente = (ecart * ecart * 1.6).toFixed(2)
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
    `Sac ${GLYPHE.tresor} <strong>${tresorsAuSac(descente)}/${CAPACITE_SAC}</strong> · ` +
    `<strong>${tresorsAuDeck(descente)}</strong> en trop dans le deck · ` +
    `${GLYPHE.tresor} <strong>${tresorsEnMain(etat)}/${etat.main.length}</strong> en main · ` +
    `butin : <strong class="or">${butinTransporte(descente)}</strong> en jeu`
  )
}

/**
 * Un tas, en pile de DOS DE CARTE à la taille de la main — et enfoui comme
 * elle, donc on n'en voit que le haut. Un tas doit être fait des mêmes cartes
 * que la main, sinon c'est l'icône d'un tas et pas un tas.
 *
 * L'épaisseur suit le nombre de cartes — jusqu'à trois feuillets — pour qu'on
 * lise d'un coup d'oeil s'il reste de quoi piocher, sans lire le compte. Nom et
 * compte vivent dans la bande émergée : sous la ligne de flottaison ils
 * seraient hors de l'écran.
 */
function tasDeJeu(nom: string, combien: number): string {
  const feuillets = Math.min(3, combien)
  const pile = Array.from(
    { length: feuillets },
    (_, i) => `<span class="feuillet" style="--f:${feuillets - 1 - i}"></span>`,
  ).join('')

  return (
    `<span class="pile-cartes${combien === 0 ? ' vide' : ''}">${pile}` +
    `<span class="etiquette-tas">` +
    `<span class="nom-tas">${nom}</span>` +
    `<span class="compte">${combien}</span>` +
    `</span></span>`
  )
}

/**
 * Le bouton porte aussi le tour de qui c'est. Sans ça, une salve ennemie d'une
 * seconde et demie ressemble à un jeu qui ne répond plus.
 */
function etiquetteFinTour(etat: EtatCombat, occupation: Occupation): string {
  if (occupation === 'ennemis') {
    return `<span class="nom">Ils frappent…</span>`
  }
  // Plus de rappel des dégâts à venir : le joueur les porte désormais
  // au-dessus de la tête, comme les ennemis portent leur intention.
  return `<span class="nom">Fin du tour</span><span class="tour">${etat.tour}</span>`
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
      return recompense(descente, descente.phase.cartes)
    case 'butin':
      return butin(descente, descente.phase.loot, descente.phase.fond)
    case 'sortie':
      return sortie(descente)
    case 'fin':
      return fin(descente, descente.phase.issue)
  }
}

/**
 * Le premier écran du palier : l'amélioration, à choisir parmi plusieurs. Elle
 * ne vaut que pour cette descente — c'est la couche roguelike, et c'est là que
 * le joueur oriente son build en cours de route.
 */
function recompense(descente: Descente, cartes: Carte[]): string {
  const choix = cartes
    .map(
      (carte, index) =>
        `<button class="offre" type="button" data-action="choisirCarte" data-carte="${index}">` +
        `${vitrine(carte)}</button>`,
    )
    .join('')

  return (
    `<div class="voile">` +
    `<div class="feuille">` +
    `<p class="titre">Palier ${descente.profondeur} — ton amélioration</p>` +
    `<div class="offres">${choix}</div>` +
    `<p class="note">Valable pour cette descente seulement.</p>` +
    `</div></div>`
  )
}

/**
 * Le second écran : ranger le butin. Le sac est un vrai inventaire — ses
 * trésors sont des cartes, et on peut les réarranger.
 *
 * Deux principes tenus :
 *
 * 1. **Rien n'est validé avant « Terminer ».** On peut échanger, reprendre,
 *    changer d'avis. Un rangement qui s'engage au premier geste punit
 *    l'exploration, alors que c'est justement là qu'on veut réfléchir.
 * 2. **Chaque destination est aussi un bouton.** Le glisser est du confort ;
 *    sur un téléphone c'est la tape qui porte la fonctionnalité.
 */
function butin(descente: Descente, loot: Carte | null, fond: Carte[]): string {
  const emplacements = Array.from({ length: SLOTS }, (_, i) =>
    caseTresor(descente.sac[i] ?? null, { ou: 'sac', emplacement: i }, 'libre'),
  ).join('')

  const portes = descente.deck.filter((c) => c.type === 'tresor')
  const pile = portes
    .map((c) => piece(c, { ou: 'deck', id: c.id }))
    .join('')

  return (
    `<div class="voile">` +
    `<div class="feuille large">` +
    `<p class="titre">Palier ${descente.profondeur} — ton butin</p>` +

    `<div class="rangee-loot">` +
    caseTresor(loot, { ou: 'loot' }, 'vide', 'loot') +
    `</div>` +

    `<p class="note">` +
    (loot === null
      ? "Range comme tu veux : rien n'est perdu tant que tu n'as pas terminé."
      : 'Glisse-le où tu veux. Sur une case occupée, les deux échangent.') +
    `</p>` +

    `<div class="destinations">${emplacements}</div>` +

    `<div class="pile-deck ${portes.length === 0 ? 'creuse' : ''}" data-depot data-ou="deck" ` +
    `data-action="deplacer">` +
    `<span class="etiquette-slot">Deck` +
    `<span class="poids">${portes.length === 0 ? 'rien porté' : `${portes.length} porté${portes.length > 1 ? 's' : ''} — ils pèsent`}</span>` +
    `</span>` +
    `<span class="tas">${pile}</span>` +
    `</div>` +

    // Le fond est un contenant, pas un bouton qui détruit : on y jette, on
    // peut en reprendre, et ce n'est perdu qu'au moment de terminer. Sinon ce
    // serait la seule action irréversible d'un écran qui promet l'inverse.
    `<div class="pile-fond ${fond.length === 0 ? 'creuse' : ''}" data-depot data-ou="fond" ` +
    `data-action="deplacer">` +
    `<span class="etiquette-slot">Le fond` +
    `<span class="poids">${
      fond.length === 0
        ? 'ce que tu abandonnes'
        : `${fond.length} abandonné${fond.length > 1 ? 's' : ''} — perdu${fond.length > 1 ? 's' : ''} en terminant`
    }</span></span>` +
    `<span class="tas">${fond.map((c) => piece(c, { ou: 'fond', id: c.id })).join('')}</span>` +
    `</div>` +
    `<button class="bouton secondaire terminer" type="button" data-action="terminerButin"` +
    `${loot === null ? '' : ' disabled'}>` +
    (loot === null ? 'Terminer' : 'Range ton trésor') +
    `</button>` +
    `</div></div>`
  )
}

/** Une case : zone de dépôt, bouton de tape, et source de glisser si occupée. */
function caseTresor(
  carte: Carte | null,
  lieu: { ou: string; emplacement?: number; id?: string },
  motVide: string,
  classe = '',
): string {
  const attrs =
    `data-ou="${lieu.ou}"` +
    (lieu.emplacement === undefined ? '' : ` data-emplacement="${lieu.emplacement}"`)
  const contenu =
    carte === null ? `<span class="vide">${motVide}</span>` : piece(carte, lieu)
  return (
    `<button class="emplacement ${classe}${carte === null ? '' : ' occupe'}" type="button" ` +
    `data-action="deplacer" ${attrs} data-depot>${contenu}</button>`
  )
}

/**
 * Un trésor déplaçable. Son lieu voyage avec lui en JSON : le glisser le pose
 * sur la destination avant de la cliquer, donc un seul chemin sert la tape et
 * le glisser, quel que soit le contenant.
 */
function piece(carte: Carte, lieu: object): string {
  const ou = JSON.stringify(lieu).replace(/"/g, '&quot;')
  return (
    `<span class="piece" data-glissable data-lieu="${ou}">${vitrine(carte, false)}</span>`
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

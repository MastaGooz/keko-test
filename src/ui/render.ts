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
import type { Descente } from '../logic/descente.ts'
import { butinTransporte, tresorsAuDeck } from '../logic/descente.ts'
import { creature, dessin, sceau, teteDeMort } from './illustrations.ts'

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

export type View = {
  root: HTMLElement
  seed: HTMLElement
  ennemis: HTMLElement
  moi: HTMLElement
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

      <!-- La scène : les ennemis seuls, sur leur sol. Elle prend toute la
           place qui reste entre l'info et le joueur. -->
      <div id="ennemis" class="rangs scene"></div>

      <!-- LE JOUEUR N'EST PAS UN CORPS SUR LA SCENE : il est ici, juste
           au-dessus de sa main, face aux ennemis. Il n'a donc que ce qu'on a
           besoin de lire de lui — ses PV et ce qu'il va encaisser — et c'est de
           là que part la carte qu'il engage. -->
      <div id="moi" class="moi" data-corps="joueur"></div>

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
    moi: root.querySelector<HTMLElement>('#moi')!,
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
  zoom: number | null = null,
  agonie: readonly number[] = [],
): void {
  view.root.classList.toggle('occupe', occupation !== 'libre')
  const etat = descente.combat
  const fini = etat.issue !== null
  const carte = selection === null ? null : (etat.main[selection] ?? null)
  const visee = carte !== null && carte.type === 'combat' ? carte : null

  view.seed.textContent = String(seed)
  // UN CORPS ABATTU REVIENT À SA PLACE POUR S'Y ÉTEINDRE. Sa mort se déclare
  // dans le gros plan — silhouette noire, tête de mort — et s'achève ici, en
  // fondu, quand le voile se lève. Il disparaissait auparavant pendant le
  // cadre : on ne voyait jamais le rang se vider, le corps était simplement
  // absent au retour.
  //
  // `agonie` porte les index de ceux qui s'effacent. Comme `auFront`, ça vient
  // de l'ÉTAT et pas d'une classe posée à la main : le joueur peut très bien
  // jouer une autre carte pendant ce temps, et le rendu qui s'ensuit balaierait
  // la classe en plein fondu.
  view.ennemis.innerHTML =
    etat.ennemis
      .map((ennemi, index) => ({ ennemi, index }))
      .filter(({ ennemi, index }) => ennemi.pv > 0 || agonie.includes(index))
      .map(({ ennemi, index }) =>
        corpsEnnemi(etat, ennemi, index, visee, fini, agonie.includes(index)),
      )
      .join('')
  view.moi.innerHTML = bandeauJoueur(etat, visee, fini)
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
  view.zoom.innerHTML =
    regardee === null
      ? ''
      : `<button class="zoom-fond" type="button" data-action="fermerZoom" aria-label="Fermer">` +
        `</button><div class="zoom-carte">${vitrine(regardee, regardee.type === 'tresor')}</div>`
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
  agonise = false,
): string {
  const imminent = ennemi.compteur <= 1
  const espece = ESPECES[ennemi.nom] ?? { espece: 'roquet', teinte: '#9a7a62' }
  const attente = imminent ? '' : `<span class="delai">${ennemi.compteur}t</span>`

  const c = visee === null || fini ? null : consequence(etat, visee, index)
  // Aucun aperçu de PV restants sous le corps : il ajoutait une ligne, donc
  // faisait sauter la hauteur du rang au moment même où l'on vise. Et il
  // n'apprenait rien — la carte affiche ses dégâts, et le corps qu'elle peut
  // achever se signale déjà par son cadre blanc.

  // Un corps qui s'éteint ne porte plus ni intention ni jauge : il n'annonce
  // plus rien et il n'a plus de PV à montrer. Il garde la tête de mort du gros
  // plan, DÉJÀ POSÉE — le tampon s'y est joué, le rejouer ici en ferait un
  // second coup.
  // PAS DE SOCLE NON PLUS. C'est l'ombre au sol, et sur un corps devenu noir
  // elle est la seule forme qui reste nette : aplatie sur 237 x 12 px, elle se
  // lit comme une barre posée sous la silhouette -- Keko : « on voit la
  // silhouette de la barre sur le fade ». Elle ne se remarquait pas sous un
  // corps vivant, qui a du volume et la recouvre.
  //
  // Et ça se tient : un corps qui s'en va ne pose plus d'ombre.
  const corps = agonise
    ? `<span class="chair" style="--teinte:${espece.teinte}">` +
      `${creature(espece.espece, String(index))}` +
      `${teteDeMort()}</span>`
    : `<span class="intention${imminent ? ' imminent' : ''}">` +
      `${GLYPHE.frappe}${ennemi.degats}${attente}</span>` +
      `<span class="chair" style="--teinte:${espece.teinte}">` +
      `${creature(espece.espece, String(index))}<span class="socle"></span></span>` +
      jauge(ennemi.pv, ennemi.pvMax) +
      `<span class="plaquette"><span class="nom">${ennemi.nom}</span></span>`

  // Il garde sa PLACE dans le rang pendant qu'il s'efface — sans quoi les
  // voisins glisseraient sous le doigt au moment où l'on choisit sa cible
  // suivante — mais il n'est plus visable : jamais de bouton ici.
  if (agonise) {
    return `<div class="creature agonie" data-corps="${index}">${corps}</div>`
  }

  if (c === null) {
    return `<div class="creature" data-corps="${index}">${corps}</div>`
  }

  return (
    `<button class="creature cible${c.tue ? ' achevable' : ''}" type="button" ` +
    `data-action="cibler" data-cible="${index}" data-corps="${index}">${corps}</button>`
  )
}

/**
 * Le joueur, juste au-dessus de sa main : **une barre, pas un corps**.
 *
 * Il a été une barre, puis un corps sur la scène — « une barre ne raconte pas
 * un affrontement, un corps qui fait face, si » — et il redevient une barre.
 * *Ce n'est pas un retour en arrière, c'est un changement de point de vue* :
 * l'affrontement se raconte maintenant depuis sa place à lui. Il ne se voit pas
 * lui-même, il voit ce qu'il a en face, et il est du côté de ses cartes.
 *
 * Ce qui l'a décidé : un corps de joueur demandait un dessin, et un dessin par
 * pose. Keko : « je vais me faire trop chier avec les images à crafter ». *Une
 * mise en scène qui réclame des assets qu'on n'a pas est une mise en scène qui
 * ne se finira pas.*
 *
 * On n'y met donc que ce qui sert à décider : ses PV, et ce qu'il encaissera à
 * la fin du tour — au même endroit que les intentions d'en face, mais jamais la
 * croix de frappe, sinon on lit l'inverse.
 */
function bandeauJoueur(etat: EtatCombat, visee: Carte | null, fini: boolean): string {
  const menace = menaceDuTour(etat)
  const marque =
    fini || menace === 0
      ? '<span class="intention calme">—</span>'
      : `<span class="intention encaisse-a-venir">−${menace}</span>`

  // La carte engagée se tient SUR LE JOUEUR, pas dans la main. Une fois qu'on
  // l'a sortie, elle n'y est plus : la remettre en bas pendant qu'on choisit sa
  // cible défaisait le geste, et les arches partaient d'un endroit d'où plus
  // rien ne part. Ici, elles partent de celui qui frappe.
  //
  // Elle est posée EN ABSOLU au-dessus de la barre : dans le flux, elle
  // pousserait la scène vers le haut à l'instant même où l'on vise.
  const engagee =
    visee === null || fini ? '' : `<span class="carte-engagee">${vitrine(visee)}</span>`

  return `${engagee}${marque}${jauge(etat.pv, etat.pvMax)}`
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
  if (carte.type === 'tresor') {
    return carteTresor(carte, place, true, !fini && carte.cout <= etat.energie)
  }

  const debout = vivants(etat)
  const abordable = carte.cout <= etat.energie
  const acheve = abordable && debout.some(({ ennemi }) => carte.degats >= ennemi.pv)
  const vise = index === selection

  const classes = ['carte', 'combat']
  if (!abordable) classes.push('hors-prix')
  else if (acheve) classes.push('acheve')
  else classes.push('jouable')
  // Elle est sur le joueur : elle quitte la main, comme celle qu'on tient.
  if (vise) classes.push('engagee')

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
function carteTresor(carte: Carte, place: string, enMain = true, abordable = true): string {
  const valeur = carte.valeur ?? 0
  const soin = carte.effets?.find((e) => e.type === 'soin')?.montant ?? 0

  // DANS LA MAIN, UN TRESOR SE JOUE — et le jouer le DETRUIT. Le bandeau ne dit
  // donc plus « MORTE » mais ce qu'on gagne et ce qu'on perd : c'est tout le
  // pari du butin, et il doit se lire sans quitter la carte des yeux.
  //
  // Il reste sur la bande haut-gauche : ce qui passe à droite est recouvert par
  // l'éventail, et un trésor ne se lève pas comme une carte de combat.
  const bandeau = enMain ? `<span class="bandeau brule">+${soin} PV · PERDU</span>` : ''

  const classes = ['carte', 'tresor', richesse(valeur)]
  if (enMain) classes.push(abordable ? 'jouable' : 'hors-prix')

  return (
    `<div class="${classes.join(' ')}" ${place}>` +
    `<span class="vitre">${dessin(carte.nom)}</span>` +
    `<span class="plaque${enMain ? '' : ' seule'}"><span class="nom">${carte.nom}</span></span>` +
    bandeau +
    `<span class="gemme${enMain ? '' : ' sceau'}">${enMain ? carte.cout : sceau()}</span>` +
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
 * Décision de design : le taux d'encombrement est toujours visible.
 *
 * Il n'y a plus de sac à montrer — **tout ce qu'on porte pèse**, donc la ligne
 * dit simplement combien de trésors sont dans le deck, combien encombrent la
 * main en ce moment, et ce que le tout vaudra s'il ressort.
 */
function encombrement(descente: Descente): string {
  const etat = descente.combat
  return (
    `Palier <strong>${descente.profondeur}/${descente.reglage.profondeurMax}</strong> · ` +
    `${GLYPHE.tresor} <strong>${tresorsAuDeck(descente)}</strong> portés · ` +
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
 * Le second écran : ranger le butin.
 *
 * **Il n'y a plus de sac**, donc plus rien qui absorbe le butin : ce qu'on
 * emporte va dans le DECK et pèse dans chaque main, dès le premier trésor. Le
 * choix n'est plus « est-ce que ça déborde ? » mais « est-ce que je prends ce
 * poids, et lequel je lâche pour lui ».
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
  const portes = descente.deck.filter((c) => c.type === 'tresor')

  // LE SLOT DE LOOT DISPARAIT UNE FOIS VIDE. Tant qu'il est là, il dit qu'il
  // reste quelque chose à décider ; vide, il ne dirait plus qu'une chose — que
  // c'est fini — et une case vide au milieu d'un écran se lit comme un endroit
  // où poser, donc comme une tâche en attente.
  const arrivage = loot === null ? '' : caseTresor(loot, { ou: 'loot' }, 'vide', 'loot')

  // JETER est un SLOT DE LA TAILLE D'UNE CARTE, pas une boîte pleine largeur :
  // il reçoit une carte, il en a donc la forme. Et il reste un CONTENANT — ce
  // qu'on y met y reste visible et se repêche jusqu'à Terminer, sinon ce serait
  // la seule action irréversible d'un écran qui promet l'inverse.
  const jete =
    `<button class="emplacement jeter${fond.length === 0 ? '' : ' occupe'}" type="button" ` +
    `data-action="deplacer" data-ou="fond" data-depot>` +
    (fond.length === 0
      ? `<span class="vide">jeter</span>`
      : piece(fond[fond.length - 1]!, { ou: 'fond', id: fond[fond.length - 1]!.id }) +
        (fond.length > 1 ? `<span class="compte-jete">${fond.length}</span>` : '')) +
    `</button>`

  return (
    `<div class="voile butin">` +
    `<p class="titre">Palier ${descente.profondeur} — ton butin</p>` +

    `<div class="slots-butin">${arrivage}${jete}</div>` +

    `<p class="note">` +
    (loot === null
      ? `Tout ce que tu portes pèse dans chaque main${
          portes.length === 0 ? '' : ` — ${portes.length} trésor${portes.length > 1 ? 's' : ''}`
        }.`
      : 'Emporte-le dans ta main, ou jette-le.') +
    `</p>` +

    // UN BOUTON QUI AGIT, pas un bouton qui attend. Il disait « Range ton
    // trésor » et restait désactivé tant qu'on n'avait pas glissé : il ne
    // faisait qu'énoncer ce qui manquait. « Prendre » fait le geste.
    //
    // Aucune action nouvelle n'est nécessaire : c'est un déplacement vers le
    // deck, et faute de provenance `input.ts` prend celle du loot — exactement
    // ce que fait déjà une tape sur un contenant.
    (loot === null
      ? `<button class="bouton secondaire terminer" type="button" ` +
        `data-action="terminerButin">Terminer</button>`
      : `<button class="bouton secondaire terminer" type="button" ` +
        `data-action="deplacer" data-ou="deck">Prendre</button>`) +

    // CE QU'ON PORTE EST LA MAIN, littéralement : même éventail, même taille,
    // même enfouissement qu'en combat. Ce sont exactement les cartes qu'on y
    // retrouvera, et les voir telles quelles est ce qui rend le poids lisible.
    `<div class="cartes portes" data-depot data-ou="deck" data-action="deplacer">` +
    portes
      .map((c, i) => carteTresor(c, `${eventail(i, portes.length)} ${lieu({ ou: 'deck', id: c.id })}`))
      .join('') +
    `</div>` +
    `</div>`
  )
}

/** Les attributs qui font d'une carte une pièce qu'on peut glisser. */
function lieu(ou: object): string {
  return `data-glissable data-lieu="${JSON.stringify(ou).replace(/"/g, '&quot;')}"`
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

/**
 * Une carte montrée, sans état de jeu : ni coût payable, ni cible.
 *
 * Exportée parce que `effets.ts` en a besoin : la carte qui s'abat sur sa cible
 * est la MÊME carte que celle qu'on vient de lâcher, et elle doit se dessiner
 * pareil. La refaire à la main ailleurs, c'est garantir qu'un jour les deux
 * divergent.
 */
export function vitrine(carte: Carte, enMain = false): string {
  if (carte.type === 'tresor') return carteTresor(carte, 'style="--n:1"', enMain)
  return (
    `<div class="carte combat" data-cout="${carte.cout}" style="--n:1">` +
    `<span class="vitre">${dessin(carte.nom)}</span>` +
    `<span class="plaque"><span class="nom">${carte.nom}</span></span>` +
    `<span class="gemme">${carte.cout}</span>` +
    `<span class="badge degats">${carte.degats}</span>` +
    `</div>`
  )
}

/**
 * Point d'entrée : câble logic/ et ui/.
 *
 * Étape 7 : la descente. Le combat n'est plus une fin en soi, c'est un palier
 * dans une run — on enchaîne, on choisit entre une carte et un trésor, on
 * décide de rentrer ou de continuer, et mourir fait tout perdre.
 *
 * Pas de sauvegarde ici : une descente se relance d'un bouton.
 */
import './ui/styles.css'
import type { Rng } from './logic/rng.ts'
import type { Descente } from './logic/descente.ts'
import { createRng } from './logic/rng.ts'
import { finDuTour, jouerCarte } from './logic/combat.ts'
import {
  choisirCarte,
  commencerDescente,
  descendre,
  extraire,
  deplacerTresor,
  resoudreCombat,
  terminerButin,
} from './logic/descente.ts'
import type { Agonie, Occupation } from './ui/render.ts'
import { figure, FIGURE_JOUEUR, mount, render } from './ui/render.ts'
import { DUREE_DUEL, duel, fermerDuel, IMPACT_DUEL, PAS_ENTRE_DUELS } from './ui/duel.ts'
import { bindInput } from './ui/input.ts'
import { brancherGlisser } from './ui/glisser.ts'
import { DUREE_CHUTE, DUREE_COUP, secouerEcran } from './ui/effets.ts'
import { basculerPleinEcran, pleinEcranPossible } from './ui/plein-ecran.ts'
import { tracerVisees } from './ui/visees.ts'
import {
  basculerSon,
  sonAcheve,
  sonActif,
  sonEncaisse,
  sonFrappe,
  sonIssue,
  sonPioche,
  sonViser,
} from './ui/sons.ts'
import { verifierVersion } from './ui/version.ts'

const root = document.querySelector<HTMLDivElement>('#app')!
const view = mount(root, __BUILD_TIME__)

let seed: number
let rng: Rng
let descente: Descente
/** Carte visée mais pas encore engagée : il lui manque une cible. */
let selection: number | null = null
/** Pour ne sonner la fin qu'au moment où elle tombe, pas à chaque rendu. */
let finSonnee = false
/**
 * Le corps actuellement dans le gros plan, s'il y en a un. Il quitte
 * l'arrière-plan le temps du duel — le joueur avec lui, puisqu'il est de tous
 * les duels. C'est de l'ÉTAT et pas une classe posée à la main : un rendu au
 * milieu du gros plan effacerait la classe et ferait réapparaître le corps.
 */
let auFront: number | null = null

/**
 * Ouvre un gros plan et retire de la scène les deux corps qu'il montre. Tout
 * ce qui suit — son, secousse, chute éventuelle — se règle sur sa durée.
 */
function grosPlan(cible: number, nomCible: string, attaquant: 'joueur' | 'ennemi', degats: number): void {
  auFront = cible
  dessiner()
  duel(view, FIGURE_JOUEUR, figure(nomCible), attaquant, degats)
  window.setTimeout(() => {
    auFront = null
    dessiner()
  }, DUREE_DUEL)
}
/** Les corps qui achèvent de mourir. Ils restent au rang le temps de tomber. */
let agonie: Agonie[] = []
/**
 * Ce qui occupe l'écran. Le jeu a des **temps** : tant qu'une animation se
 * déroule, l'entrée est verrouillée et le combat ne se résout pas. Sans ça
 * tout se chevauchait — on pouvait jouer pendant la salve ennemie, et l'écran
 * de récompense s'ouvrait par-dessus un corps en train de tomber.
 */
let occupation: Occupation = 'libre'

/** Tout le hasard de la descente découle de la seed : la rejouer la rejoue. */
function demarrer(nouvelleSeed: number): void {
  seed = nouvelleSeed
  rng = createRng(seed)
  descente = commencerDescente(rng)
  // Une nouvelle descente ne doit pas hériter d'un voile resté ouvert.
  fermerDuel(view)
  auFront = null
  selection = null
  finSonnee = false
  agonie = []
  view.root.classList.remove('panneau-ouvert')
  dessiner()
}

function dessiner(): void {
  render(view, descente, seed, selection, agonie, occupation, auFront)
  tracerVisees(view)
}

/**
 * Occupe l'écran le temps d'une animation, puis rend la main. `apres` referme
 * le temps écoulé : c'est là, et pas avant, que le combat se résout.
 */
function occuper(duree: number, pendant: Occupation, apres: () => void): void {
  if (duree <= 0) {
    apres()
    dessiner()
    return
  }
  occupation = pendant
  dessiner()
  window.setTimeout(() => {
    occupation = 'libre'
    apres()
    dessiner()
  }, duree)
}

/**
 * Referme le temps de jeu : si le combat s'est terminé pendant l'animation,
 * la descente reprend la main — récompense, point de sortie, ou fin de run.
 */
function conclure(): void {
  if (descente.phase.type === 'combat' && descente.combat.issue !== null) {
    descente = resoudreCombat(descente, rng)
  }
  if (descente.phase.type === 'fin' && !finSonnee) {
    sonIssue(descente.phase.issue === 'extrait')
    finSonnee = true
  }
}

/**
 * L'agonie d'un corps, en deux temps : il encaisse d'abord le coup comme
 * n'importe quel autre — sinon il disparaîtrait avant que ses dégâts ne
 * s'affichent — puis il s'effondre et quitte le rang.
 */
function faireMourir(index: number, debutChute = DUREE_COUP): void {
  // Le corps entre en agonie TOUT DE SUITE, même si sa chute est retardée :
  // c'est ce qui le garde au rang. Sans ça il disparaîtrait du rendu à
  // l'instant où ses PV tombent à zéro — derrière le voile du gros plan — et
  // il n'y aurait plus personne à faire tomber quand le voile se lève.
  agonie = [...agonie, { index, phase: 'coup' }]
  window.setTimeout(() => {
    agonie = agonie.map((a) => (a.index === index ? { index, phase: 'chute' as const } : a))
    sonAcheve()
    dessiner()
  }, debutChute)
  window.setTimeout(() => {
    agonie = agonie.filter((a) => a.index !== index)
    dessiner()
  }, debutChute + DUREE_CHUTE)
}

/** Ce qui doit attendre son tour. Les réglages, eux, répondent toujours. */
const ACTIONS_DE_JEU = new Set([
  'viser',
  'annuler',
  'cibler',
  'finTour',
  'choisirCarte',
  'deplacer',
  'terminerButin',
  'descendre',
  'extraire',
])

bindInput(view, (action) => {
  // Une animation en cours verrouille le jeu. Sans ça on pouvait jouer pendant
  // la salve ennemie, et l'écran de récompense s'ouvrait par-dessus un corps
  // en train de tomber.
  if (occupation !== 'libre' && ACTIONS_DE_JEU.has(action.type)) return

  // Les marques visuelles se posent APRÈS le rendu : le DOM qu'elles visent
  // n'existe pas avant. Elles ne changent jamais l'état, juste l'affichage.
  const marques: (() => void)[] = []
  /** Combien de temps l'écran reste occupé après cette action. */
  let attente = 0
  let pendant: Occupation = 'coup'

  switch (action.type) {
    case 'viser':
      selection = action.index
      sonViser()
      break
    case 'annuler':
      selection = null
      break
    case 'cibler': {
      if (selection !== null) {
        const combat = descente.combat
        const debout = combat.ennemis[action.cible]?.pv ?? 0
        const carte = combat.main[selection]
        const apres = jouerCarte(combat, selection, action.cible)
        descente = { ...descente, combat: apres }
        const reste = apres.ennemis[action.cible]?.pv ?? 0
        const inflige = debout - reste
        const cible = combat.ennemis[action.cible]
        if (inflige > 0 && cible !== undefined) {
          marques.push(() => {
            grosPlan(action.cible, cible.nom, 'joueur', inflige)
            // Le son et la secousse tombent SUR L'IMPACT du gros plan, pas au
            // moment de la tape : le coup est désormais un geste qui se
            // déroule, plus un chiffre qui change.
            window.setTimeout(() => {
              // La force du son suit le coût de la carte : on entend son poids.
              if (carte !== undefined) sonFrappe((carte.cout - 1) / 3)
              secouerEcran(view, 'forte')
            }, IMPACT_DUEL)
          })
          attente = DUREE_DUEL
        }
        // Le corps tombe quand le voile se lève : le gros plan a déjà montré
        // le coup, la scène montre ce qu'il en reste.
        if (debout > 0 && reste <= 0) {
          faireMourir(action.cible, DUREE_DUEL)
          attente = DUREE_DUEL + DUREE_CHUTE
        }
      }
      selection = null
      break
    }
    case 'finTour': {
      const dejaVus = descente.combat.evenements.length
      descente = { ...descente, combat: finDuTour(descente.combat, rng) }

      // Les ennemis frappent CHACUN SON TOUR, avec sa propre part de dégâts.
      // Une salve simultanée ne se lit pas : on voit tout bouger sans savoir
      // qui a pris quoi. D'où la séquence, et un total qui s'égrène.
      const frappes = descente.combat.evenements
        .slice(dejaVus)
        .filter((e) => e.type === 'frappe')

      marques.push(() => {
        frappes.forEach((frappe, rang) => {
          const depart = rang * PAS_ENTRE_DUELS
          const index = descente.combat.ennemis.findIndex((e) => e.nom === frappe.nom)
          window.setTimeout(
            () => grosPlan(index, frappe.nom, 'ennemi', frappe.degats),
            depart,
          )
          window.setTimeout(() => {
            secouerEcran(view, 'forte')
            sonEncaisse()
          }, depart + IMPACT_DUEL)
        })
        // La repioche se fait entendre une fois la salve passée.
        window.setTimeout(
          () => sonPioche(),
          Math.max(0, (frappes.length - 1) * PAS_ENTRE_DUELS + DUREE_DUEL),
        )
      })

      // La main revient au joueur quand le dernier gros plan s'est refermé.
      pendant = 'ennemis'
      attente =
        frappes.length === 0 ? 0 : (frappes.length - 1) * PAS_ENTRE_DUELS + DUREE_DUEL

      selection = null
      break
    }
    case 'choisirCarte':
      descente = choisirCarte(descente, action.index, rng)
      break
    case 'deplacer':
      descente = deplacerTresor(descente, action.source, action.cible)
      break
    case 'terminerButin':
      descente = terminerButin(descente)
      break
    case 'descendre':
      descente = descendre(descente, rng)
      break
    case 'extraire':
      descente = extraire(descente)
      break
    case 'rejouer':
      return demarrer(seed)
    case 'nouveau':
      // Seed courte : lisible à l'écran, suffisante pour rejouer une descente.
      return demarrer(Date.now() % 100000)
    case 'panneau':
      // Simple bascule d'affichage : rien à recalculer.
      view.root.classList.toggle('panneau-ouvert')
      return
    case 'pleinEcran':
      void basculerPleinEcran().then(etiquetterPleinEcran)
      return
    case 'son':
      etiquetterSon(basculerSon())
      return
  }

  dessiner()
  for (const marque of marques) marque()

  // Le combat ne se résout qu'une fois les animations finies : l'écran de
  // récompense attend que le dernier corps soit tombé.
  occuper(attente, pendant, conclure)
})

/** Le bouton ne s'affiche que là où l'API existe : l'iPhone ne l'a pas. */
function etiquetterPleinEcran(actif = document.fullscreenElement !== null): void {
  view.pleinEcran.hidden = !pleinEcranPossible()
  view.pleinEcran.textContent = actif ? 'Quitter le plein écran' : 'Plein écran'
}

function etiquetterSon(ouvert = sonActif()): void {
  view.son.textContent = ouvert ? 'Son : oui' : 'Son : coupé'
}

brancherGlisser(view.root)
etiquetterPleinEcran()
etiquetterSon()
document.addEventListener('fullscreenchange', () => etiquetterPleinEcran())
// Les arches sont posées en coordonnées d'écran : tout ce qui déplace la mise
// en page les périme.
window.addEventListener('resize', () => tracerVisees(view))
window.addEventListener('orientationchange', () => tracerVisees(view))

demarrer(Date.now() % 100000)

// Le cache de GitHub Pages peut servir un vieux HTML : on vérifie la date du
// build à la source et on se recharge au besoin, une fois la partie affichée.
void verifierVersion(__BUILD_TIME__)

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
import { finDuTour, jouerCarte, reordonnerMain, vivants } from './logic/combat.ts'
import {
  choisirCarte,
  commencerDescente,
  descendre,
  extraire,
  deplacerTresor,
  resoudreCombat,
  terminerButin,
} from './logic/descente.ts'
import type { Occupation } from './ui/render.ts'
import { figure, FIGURE_JOUEUR, mount, render } from './ui/render.ts'
import {
  DUREE_DUEL,
  DUREE_DUEL_MORT,
  duel,
  fermerDuel,
  IMPACT_DUEL,
  PAS_ENTRE_DUELS,
  TAMPON_DUEL,
} from './ui/duel.ts'
import type { Action } from './ui/input.ts'
import { bindInput } from './ui/input.ts'
import { brancherGlisser } from './ui/glisser.ts'
import { brancherMain } from './ui/glisser-main.ts'
import { apercuDegats } from './ui/apercu.ts'
import { secouerEcran } from './ui/effets.ts'
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
/** La carte qu'on regarde de près, s'il y en a une. */
let zoom: number | null = null
/** La carte survolée ou tenue : elle montre ce qu'elle emporterait. */
let survolee: number | null = null

/**
 * Ce que le dernier gros plan a réellement duré, à l'horloge.
 *
 * Une impression de vitesse ne se discute pas, elle se mesure — et je ne peux
 * pas mesurer sur l'appareil de Keko. Le panneau affiche donc le chiffre, avec
 * l'état de `prefers-reduced-motion` qui est la seule chose au monde capable
 * de raccourcir ces animations sans qu'on l'ait demandé.
 */
let dureeMesuree: number | null = null

function ecrireDiagnostic(): void {
  const reduit = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  view.diagnostic.textContent =
    `Animations réduites : ${reduit ? 'OUI' : 'non'} · ` +
    `dernier gros plan : ${dureeMesuree === null ? '—' : `${Math.round(dureeMesuree)} ms`} ` +
    `(attendu 800, ou 1500 s'il tue)`
}

/**
 * Peint sur chaque jauge la part de PV que la carte du moment emporterait.
 *
 * La carte du moment, c'est **celle sous le doigt s'il y en a une, sinon celle
 * qu'on tient**. Les deux ne peuvent pas se contredire — on ne survole pas en
 * glissant — et faire tomber l'aperçu quand la souris quitte une carte engagée
 * effacerait l'information au moment précis où on va choisir sa cible.
 */
function rafraichirApercu(): void {
  const index = survolee ?? selection
  const carte = index === null ? null : descente.combat.main[index]
  apercuDegats(view, carte !== undefined && carte !== null && carte.type === 'combat' ? carte.degats : null)
}

/**
 * Ouvre un gros plan et retire de la scène les deux corps qu'il montre. Tout
 * ce qui suit — son, secousse, chute éventuelle — se règle sur sa durée.
 */
function grosPlan(
  cible: number,
  nomCible: string,
  attaquant: 'joueur' | 'ennemi',
  degats: number,
  mort = false,
): void {
  auFront = cible
  dessiner()
  const ouvert = performance.now()
  duel(view, FIGURE_JOUEUR, figure(nomCible), attaquant, degats, mort)
  if (mort) window.setTimeout(() => sonAcheve(), TAMPON_DUEL)
  window.setTimeout(() => {
    auFront = null
    dureeMesuree = performance.now() - ouvert
    ecrireDiagnostic()
    dessiner()
  }, mort ? DUREE_DUEL_MORT : DUREE_DUEL)
}

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
  zoom = null
  survolee = null
  selection = null
  finSonnee = false
  view.root.classList.remove('panneau-ouvert')
  dessiner()
}

function dessiner(): void {
  render(view, descente, seed, selection, occupation, auFront, zoom)
  // Après le rendu : les jauges viennent d'être reconstruites, leur aperçu
  // avec. Une marque posée avant serait balayée.
  rafraichirApercu()
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
 * Le temps qu'on laisse au joueur de REVOIR la scène quand le combat vient de
 * se terminer, avant que le palier ne se pose par-dessus. Une demi-seconde :
 * assez pour que l'oeil enregistre le rang vide, trop court pour qu'on attende.
 */
const RESPIRATION_APRES_COMBAT = 520

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

/**
 * Le seul point d'entrée des actions. Nommé, et non anonyme dans `bindInput` :
 * les gestes de la main y entrent aussi, et une action peut en enchaîner une
 * autre — sortir une carte de la main avec un seul ennemi debout engage ET
 * frappe.
 */
function dispatch(action: Action): void {
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
    case 'zoomer':
      // Regarder une carte n'engage rien : ça ne repose pas celle qu'on tient.
      zoom = action.index
      break
    case 'fermerZoom':
      zoom = null
      break
    case 'reordonner':
      descente = { ...descente, combat: reordonnerMain(descente.combat, action.de, action.vers) }
      // La carte tenue a peut-être changé d'index sous nos pieds : on repose.
      selection = null
      break
    case 'jouerDepuisLaMain': {
      const debout = vivants(descente.combat)
      const carte = descente.combat.main[action.index]
      if (carte === undefined || carte.type !== 'combat') break
      if (carte.cout > descente.combat.energie) break
      // Une seule cible possible : sortir la carte de la main SUFFIT à
      // engager. C'est le contraire de la tape, où retaper repose toujours —
      // mais le geste n'est pas le même : le glisser est déjà un engagement,
      // il n'y a plus rien à confirmer.
      if (debout.length === 1) {
        selection = action.index
        sonViser()
        return dispatch({ type: 'cibler', cible: debout[0]!.index })
      }
      selection = action.index
      sonViser()
      break
    }
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
            grosPlan(action.cible, cible.nom, 'joueur', inflige, reste <= 0)
            // Le son et la secousse tombent SUR L'IMPACT du gros plan, pas au
            // moment de la tape : le coup est désormais un geste qui se
            // déroule, plus un chiffre qui change.
            window.setTimeout(() => {
              // La force du son suit le coût de la carte : on entend son poids.
              if (carte !== undefined) sonFrappe((carte.cout - 1) / 3)
              secouerEcran(view, 'forte')
            }, IMPACT_DUEL)
          })
          // Le gros plan s'attarde quand il tue : le verrou doit suivre, sinon
          // l'écran de récompense s'ouvrirait sur la tête de mort encore posée.
          attente = reste <= 0 ? DUREE_DUEL_MORT : DUREE_DUEL
        }
        // Plus rien après : la mort se joue DANS le gros plan, et le corps ne
        // revient simplement pas sur la scène.
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
          // `pvJoueur` est ce qu'il RESTE après la frappe : à zéro, c'est
          // celle-ci qui a tué, et c'est elle qui porte la tête de mort.
          const fatale = frappe.pvJoueur === 0
          window.setTimeout(
            () => grosPlan(index, frappe.nom, 'ennemi', frappe.degats, fatale),
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
      // Seule la DERNIÈRE frappe peut être fatale : le moteur arrête la salve
      // dès que le joueur tombe. C'est donc elle, et elle seule, qui peut
      // allonger l'attente.
      const derniere = frappes[frappes.length - 1]
      const fatale = derniere !== undefined && derniere.pvJoueur === 0
      pendant = 'ennemis'
      attente =
        frappes.length === 0
          ? 0
          : (frappes.length - 1) * PAS_ENTRE_DUELS + (fatale ? DUREE_DUEL_MORT : DUREE_DUEL)

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

  // Quand le combat vient de se terminer, on rend la SCÈNE au joueur avant de
  // lui poser un calque dessus. Sans cette respiration, le gros plan de la
  // frappe fatale se refermait et l'écran de récompense — ou la fin de run —
  // s'ouvrait dans la même image : on ne voyait jamais le champ de bataille
  // qu'on venait de vider, ni son propre corps une fois le coup encaissé.
  // C'est le seul endroit qui le sache : `conclure` fait passer la descente à
  // la phase suivante, donc c'est juste avant lui que la pause a sa place.
  if (descente.phase.type === 'combat' && descente.combat.issue !== null) {
    attente += RESPIRATION_APRES_COMBAT
  }

  // Le combat ne se résout qu'une fois les animations finies : l'écran de
  // récompense attend que le dernier corps soit tombé.
  occuper(attente, pendant, conclure)
}

bindInput(view, dispatch)
ecrireDiagnostic()

/**
 * Les gestes de la main. `disponible` est le même verrou que celui du dispatch :
 * il faut le poser ici AUSSI, sinon le glisser démarrerait pendant une
 * animation et la carte suivrait le doigt pour rien.
 */
brancherMain(view, {
  jouer: (index) => dispatch({ type: 'jouerDepuisLaMain', index }),
  reordonner: (de, vers) => dispatch({ type: 'reordonner', de, vers }),
  regarder: (index) => dispatch({ type: 'zoomer', index }),
  survol: (index) => {
    survolee = index
    rafraichirApercu()
  },
  disponible: () =>
    occupation === 'libre' && descente.phase.type === 'combat' && descente.combat.issue === null,
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

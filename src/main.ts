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
import type { Carte } from './logic/combat.ts'
import {
  finDuTour,
  jouable,
  jouerCarte,
  reordonnerMain,
  viseUneCible,
  vivants,
} from './logic/combat.ts'
import {
  choisirCarte,
  commencerDescente,
  descendre,
  extraire,
  deplacerTresor,
  resoudreCombat,
  reordonnerTresors,
  terminerButin,
  validerJet,
} from './logic/descente.ts'
import type { Occupation } from './ui/render.ts'
import { mount, render, vitrine } from './ui/render.ts'
import type { Action } from './ui/input.ts'
import { bindInput } from './ui/input.ts'
import { brancherGlisser } from './ui/glisser.ts'
import { brancherMain } from './ui/glisser-main.ts'
import { apercuDegats } from './ui/apercu.ts'
import {
  abattreCarte,
  assaut,
  DUREE_COUP,
  encaisse,
  INSTANT_ABATTUE,
  soigne,
  INSTANT_IMPACT,
  PAS_ENTRE_FRAPPES,
  secouerEcran,
} from './ui/effets.ts'
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
/** La carte qu'on regarde de près, s'il y en a une. */
/**
 * La carte qu'on regarde de près — LA CARTE, pas son index.
 *
 * Elle était un index dans la main de combat, ce qui interdisait de zoomer
 * ailleurs : l'écran de butin montre lui aussi des cartes, et on doit pouvoir
 * les consulter avant de décider laquelle on jette.
 */
let zoom: Carte | null = null
/** La carte survolée ou tenue : elle montre ce qu'elle emporterait. */
let survolee: number | null = null


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
 * Ce qui occupe l'écran. Le jeu a des **temps** : tant qu'une animation se
 * déroule, l'entrée est verrouillée et le combat ne se résout pas. Sans ça
 * tout se chevauchait — on pouvait jouer pendant la salve ennemie, et l'écran
 * de récompense s'ouvrait par-dessus un corps en train de tomber.
 */
let occupation: Occupation = 'libre'

/**
 * Les corps qui s'éteignent sur la scène, par index.
 *
 * La mort se **déclare** dans le gros plan — silhouette noire, tête de mort —
 * et s'**achève** ici : le corps revient à sa place avec le voile qui se lève,
 * toujours noir et toujours marqué, et s'efface. Avant, il ne revenait
 * simplement pas, donc on ne voyait jamais le rang se vider.
 *
 * C'est un état et pas une classe posée sur le DOM, pour la même raison que
 * `auFront` : le joueur peut jouer une autre carte pendant le fondu, et le
 * rendu qui s'ensuit effacerait la classe en plein vol.
 */
let agonie: number[] = []

/**
 * Ce que dure l'extinction d'un corps sur la scène.
 *
 * Il faut qu'on ait le temps de voir QUI s'efface — c'est tout l'intérêt de le
 * faire revenir — sans que le rang reste encombré de cadavres pendant qu'on
 * choisit sa cible suivante.
 */
const DUREE_AGONIE = 850

/** Tout le hasard de la descente découle de la seed : la rejouer la rejoue. */
function demarrer(nouvelleSeed: number): void {
  seed = nouvelleSeed
  rng = createRng(seed)
  descente = commencerDescente(rng)
  agonie = []
  zoom = null
  survolee = null
  selection = null
  finSonnee = false
  view.root.classList.remove('panneau-ouvert')
  dessiner()
}

function dessiner(): void {
  render(view, descente, seed, selection, occupation, zoom, agonie)
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
 * se terminer, avant que le palier ne se pose par-dessus.
 *
 * **Elle est calée sur l'agonie, plus une pause.** Le dernier corps s'éteint
 * pendant cette respiration : ouvrir le palier avant la fin du fondu, ce serait
 * poser un calque sur une image en train de se terminer — et le seul corps
 * qu'on voulait montrer serait justement celui qu'on couperait. La pause qui
 * suit est ce qui laisse enregistrer le rang VIDE, qui était tout l'objet de
 * cette respiration au départ.
 */
const RESPIRATION_APRES_COMBAT = DUREE_AGONIE + 300

/** Ce qui doit attendre son tour. Les réglages, eux, répondent toujours. */
const ACTIONS_DE_JEU = new Set([
  'viser',
  'annuler',
  'cibler',
  'finTour',
  'choisirCarte',
  'deplacer',
  'reordonnerTresors',
  'validerJet',
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
    case 'zoomer': {
      // Regarder une carte n'engage rien : ça ne repose pas celle qu'on tient.
      // On la cherche dans la main ET dans ce qu'on porte : c'est le même geste
      // en combat et sur l'écran de butin.
      const vue =
        descente.combat.main.find((c) => c.id === action.id) ??
        descente.deck.find((c) => c.id === action.id) ??
        null
      zoom = vue
      break
    }
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
      if (carte === undefined || !jouable(carte)) break
      if (carte.cout > descente.combat.energie) break
      // Ce qui ne vise personne se joue TOUT DE SUITE : brûler un trésor pour
      // se soigner n'a pas de cible, et demander d'en désigner une serait un
      // geste vide — deux tapes pour un choix qui n'en est pas un.
      if (!viseUneCible(carte)) {
        selection = action.index
        return dispatch({ type: 'cibler', cible: -1 })
      }
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

        // BRÛLER UN TRÉSOR : le soin se voit sur le joueur, et la carte est
        // détruite — c'est son or qui part avec, donc le geste doit se lire.
        const rendu = apres.pv - combat.pv
        if (rendu > 0 && carte !== undefined) {
          marques.push(() => {
            soigne(view, rendu)
            sonViser()
          })
          attente = Math.max(attente, DUREE_COUP)
        }

        const reste = apres.ennemis[action.cible]?.pv ?? 0
        const inflige = debout - reste
        const cible = combat.ennemis[action.cible]
        if (inflige > 0 && cible !== undefined) {
          // LA CARTE S'ABAT SUR SA CIBLE. Elle a quitté la main au lâcher, elle
          // se remontre là où elle agit — le coup avait un départ et une
          // conséquence, il lui manquait un trajet. Tout ce qui marque l'impact
          // tombe AU CONTACT, pas au moment de la tape.
          marques.push(() => {
            abattreCarte(view, action.cible, carte === undefined ? '' : vitrine(carte), () => {
              encaisse(view, action.cible, inflige)
              // La force du son suit le coût de la carte : on entend son poids.
              if (carte !== undefined) sonFrappe((carte.cout - 1) / 3)
              secouerEcran(view)
            })
          })
          attente = INSTANT_ABATTUE + DUREE_COUP
        }
        // Le corps abattu reste au rang le temps d'encaisser, puis s'éteint —
        // sans quoi on ne verrait jamais les dégâts qui l'ont achevé.
        if (reste <= 0 && inflige > 0) {
          marques.push(() => {
            window.setTimeout(() => {
              agonie = [...agonie, action.cible]
              sonAcheve()
              dessiner()
              window.setTimeout(() => {
                agonie = agonie.filter((i) => i !== action.cible)
                dessiner()
              }, DUREE_AGONIE)
            }, INSTANT_ABATTUE + DUREE_COUP)
          })
          attente = INSTANT_ABATTUE + DUREE_COUP + DUREE_AGONIE
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
          const depart = rang * PAS_ENTRE_FRAPPES
          window.setTimeout(() => assaut(view, [frappe.nom]), depart)
          window.setTimeout(() => {
            encaisse(view, 'joueur', frappe.degats)
            secouerEcran(view, 'forte')
            sonEncaisse()
          }, depart + INSTANT_IMPACT)
        })
        // La repioche se fait entendre une fois la salve passée.
        window.setTimeout(
          () => sonPioche(),
          Math.max(0, (frappes.length - 1) * PAS_ENTRE_FRAPPES + INSTANT_IMPACT + 120),
        )
      })

      // La main revient au joueur quand la dernière frappe a fini de résonner.
      pendant = 'ennemis'
      attente =
        frappes.length === 0
          ? 0
          : (frappes.length - 1) * PAS_ENTRE_FRAPPES + INSTANT_IMPACT + DUREE_COUP

      selection = null
      break
    }
    case 'choisirCarte':
      descente = choisirCarte(descente, action.index, rng)
      break
    case 'deplacer':
      descente = deplacerTresor(descente, action.source, action.cible)
      break
    case 'validerJet':
      descente = validerJet(descente)
      break
    case 'reordonnerTresors':
      descente = reordonnerTresors(descente, action.id, action.vers)
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

  // LES MARQUES SE POSENT APRES LE DERNIER RENDU, donc après `occuper` et pas
  // avant : `occuper` redessine pour afficher « Les ennemis frappent… » sur le
  // bouton, et ce rendu balayait la classe que la marque venait de poser sur le
  // corps touché. Le chiffre de dégâts, lui, survivait — il est posé sur la
  // racine — ce qui rendait le défaut trompeur : on voyait bien le coup, mais
  // le corps ne tressaillait jamais.
  for (const marque of marques) marque()
}

bindInput(view, dispatch)

/**
 * Les gestes de la main. `disponible` est le même verrou que celui du dispatch :
 * il faut le poser ici AUSSI, sinon le glisser démarrerait pendant une
 * animation et la carte suivrait le doigt pour rien.
 */
brancherMain(view, {
  jouer: (index) => dispatch({ type: 'jouerDepuisLaMain', index }),
  reordonner: (de, vers) => dispatch({ type: 'reordonner', de, vers }),
  regarder: (index) => {
    const c = descente.combat.main[index]
    if (c !== undefined) dispatch({ type: 'zoomer', id: c.id })
  },
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

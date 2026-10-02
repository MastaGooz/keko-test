/**
 * LE PONT ENTRE LES RÈGLES ET LA SCÈNE 3D.
 *
 * `logic/` ne connaît ni le DOM ni three, et c'est ce qui a permis de changer
 * de moteur sans toucher aux règles. Ce module est le seul endroit qui traduit
 * l'un vers l'autre — l'équivalent de `main.ts` pour le jeu 2D.
 */
import type { Carte } from '../logic/combat.ts'
import { createRng } from '../logic/rng.ts'
import type { Descente } from '../logic/descente.ts'
import { REGLAGE_DEFAUT, commencerDescente } from '../logic/descente.ts'
import type { Hub } from '../logic/hub.ts'
import { creerHub, equipement, consommablesDeLaPile, estTresor, pileVide } from '../logic/hub.ts'
import type { Arme, Armure, Consommable, Piece, Rarete } from '../logic/armes.ts'
import {
  ESPADON,
  GLAIVE,
  PLASTRON,
  POTIONS_DEPART,
  SUPER_POTIONS_DEPART,
  deckDeLEquipement,
} from '../logic/armes.ts'
import type { Objet } from '../logic/armes.ts'
import { estConsommable, nomObjet } from '../logic/armes.ts'
import { tresorRecompense } from '../logic/cartes.ts'
import { lignes, nature, rangDuTresor, sansBalises } from '../ui/texte-carte.ts'
import type { CarteAPeindre } from './texture-carte.ts'
import { signature } from './texture-carte.ts'

/**
 * Une carte du modèle, telle qu'on la peint.
 *
 * Le texte vient du module partagé (`ui/texte-carte.ts`) : c'est le même que
 * celui de la carte 2D, aux balises près — un canvas ne sait pas les lire.
 */
export function aPeindre(carte: Carte): CarteAPeindre {
  return {
    id: carte.id,
    nom: carte.nom,
    cout: carte.cout,
    effet: lignes(carte, true).map(sansBalises),
    type: nature(carte),
    valeur: carte.type === 'tresor' ? (carte.valeur ?? 0) : undefined,
    // ET SON RANG VIENT DE SA VALEUR : la couleur du cadre redit en un coup
    // d'oeil ce que le chiffre dit en clair. *Le joueur doit préférer peu de
    // gros trésors à beaucoup de petits*, encore faut-il voir lesquels sont
    // gros sans lire.
    // UN TRÉSOR TIRE SON RANG DE SA VALEUR, une carte de deck du MÉTAL DE SA
    // PIÈCE. Deux sources pour un même axe, parce que ce sont deux façons de
    // valoir : l'or qu'on rapporte, et la force qu'on emporte.
    rarete: carte.type === 'tresor' ? rangDuTresor(carte.valeur ?? 0) : carte.rarete,
    // LA FAMILLE PASSE PAR UN DRAPEAU, pas par le mot du pied. Celui-ci est
    // du TEXTE AFFICHÉ — « Consommable » est déjà devenu « Objet » une fois —
    // et *un dessin ne se décide pas sur une étiquette qui peut changer.*
    tresor: carte.type === 'tresor',
    // ET LE CIEL SUIT LA PIÈCE qui l'a produite : rouge pour une arme, vert
    // pour un objet, bleu pour une armure. Même porte que la rareté — *la même
    // carte partout*, du zoom de l'arme à la main de combat. Un trésor, lui,
    // dit sa famille par son type.
    ciel: carte.type === 'tresor' ? 'tresor' : carte.famille,
  }
}

/**
 * UNE PIÈCE D'ÉQUIPEMENT, telle qu'on la peint.
 *
 * **Une pièce est une CARTE**, comme tout ce qu'on manipule dans ce jeu — une
 * ligne de texte se lirait comme une entrée d'inventaire, une carte se prend
 * en main. Elle porte son COMPTE DE CARTES là où une carte porte son coût, et
 * sa composition en un texte qui coule : « 3× Estoc · 2× Taillade ». Le détail
 * de chaque modèle vit dans le zoom, en vraies cartes.
 *
 * Un consommable liste sa carte comme les autres : *l'objet n'est pas la
 * carte* — « Potion » est ce qu'on emporte, « rend 14 PV » est ce que fait la
 * carte.
 */
export function setAPeindre(objet: Objet): { carte: CarteAPeindre; nombre: number }[] {
  const set = estConsommable(objet) ? [{ modele: objet.modele, nombre: 1 }] : objet.set
  // Un modèle n'a pas d'identifiant d'exemplaire — on lui en donne un stable,
  // parce que React a besoin d'une clé et que l'INDEX N'EN EST PAS UNE.
  // La vitrine montre les VRAIES cartes qu'on retrouvera en main, donc elles
  // portent déjà le métal de leur pièce : *une carte qui change d'habit entre
  // le zoom et la main n'est plus la même carte.*
  return set.map((e, i) => ({
    carte: aPeindre({
      ...e.modele,
      id: `${objet.id}-${i}`,
      rarete: objet.rarete,
      famille: 'mains' in objet ? ('arme' as const) : undefined,
    }),
    nombre: e.nombre,
  }))
}

export function pieceAPeindre(objet: Objet): CarteAPeindre {
  const set = estConsommable(objet) ? [{ modele: objet.modele, nombre: 1 }] : objet.set
  const pied = estConsommable(objet)
    ? 'Objet'
    : 'mains' in objet
      ? `Arme · ${objet.mains === 2 ? 'deux mains' : 'une main'}`
      : 'Armure'
  // UN CONSOMMABLE N'A PAS DE NOM À LUI : il EST sa carte, et elle s'appelle
  // Potion. L'objet et la carte ont eu deux noms le temps qu'un intermédiaire
  // les sépare ; sans intermédiaire, il n'y a qu'une chose.
  return {
    id: objet.id,
    nom: estConsommable(objet) ? objet.modele.nom : objet.nom,
    cout: 0,
    compteur: set.reduce((total, e) => total + e.nombre, 0),
    // LE CARTOUCHE D'UNE PIÈCE EST VIDE, et la place est gardée.
    //
    // Keko : « on va supprimer les cartes générées de la description des
    // cartes d'équipement, car le joueur peut l'avoir en cliquant dessus — en
    // plus on va garder cet emplacement pour des effets spéciaux des armes ».
    //
    // *Le zoom montre déjà le set en vraies cartes*, donc le cartouche le
    // répétait en moins lisible — et une bande qui redit ce qu'un geste montre
    // mieux est une bande de libre pour ce qui n'a nulle part où aller.
    effet: [],
    type: pied,
    // ET SON CIEL DIT SA FAMILLE : rouge pour une arme, vert pour un objet,
    // bleu pour une armure — par une ÉTIQUETTE et non par le mot du pied,
    // celui-ci étant du texte affiché : *un dessin ne se décide pas sur une
    // étiquette qui peut changer*, la règle du trésor.
    ciel: estConsommable(objet) ? 'objet' : 'mains' in objet ? 'arme' : undefined,
    // SA RARETÉ VA AU CADRE. Une carte de deck n'en a pas et n'en aura pas :
    // elle garde le laiton, qui est le commun.
    rarete: objet.rarete,
  }
}

/**
 * UNE DESCENTE PRÊTE À JOUER, avec le chargement gratuit.
 *
 * On part du hub plutôt que d'un deck écrit à la main : c'est la règle du jeu
 * — *le deck est la somme de ce qu'on porte* — et ça garantit que la scène 3D
 * montre ce que le joueur emporterait vraiment.
 *
 * C'est `commencerDescente` qui monte le combat, pas nous : il sait quels PV
 * donner (ceux de la run, 90, et non les 30 du duel isolé de `CONFIG_DEFAUT`)
 * et comment adoucir le premier palier. *Un chiffre de règle ne se lit pas
 * hors de son barème*, et la meilleure façon de ne pas s'y tromper est de ne
 * pas le recopier.
 */
export function descenteDeDepart(
  seed: number,
  tailleMain = TAILLE_MAIN_DEMANDEE,
): { descente: Descente; rng: ReturnType<typeof createRng> } {
  const rng = createRng(seed)
  const hub = creerHub()
  const descente = commencerDescente(
    rng,
    { ...REGLAGE_DEFAUT, tailleMain },
    equipementPourTenir(equipement(hub.chargement), tailleMain),
    consommablesDeLaPile(hub.chargement.pile),
  )
  return { descente, rng }
}

/**
 * COMBIEN DE CARTES ON TIENT, demandé par l'URL : `?r3f&main=20`.
 *
 * Un banc d'essai, pas une option de jeu — Keko : « on peut faire un test avec
 * 20 cartes en main pour voir ? ». Il vit dans une URL et non dans un réglage
 * caché parce qu'il n'y a pas encore de panneau en 3D, et que Keko juge depuis
 * son téléphone : *ce qui se teste doit pouvoir s'ouvrir d'un lien.*
 */
export function TAILLE_MAIN_URL(): number {
  const demande = Number(new URLSearchParams(location.search).get('main'))
  return Number.isFinite(demande) && demande >= 1 ? Math.min(30, Math.round(demande)) : REGLAGE_DEFAUT.tailleMain
}

const TAILLE_MAIN_DEMANDEE = TAILLE_MAIN_URL()

/**
 * DE QUOI ÉPROUVER LE DÉFILEMENT DU COFFRE : `?r3f&coffre=40`.
 *
 * Un banc d'essai, comme `?main=20`, et pour la même raison : *ce qui se teste
 * doit pouvoir s'ouvrir d'un lien*, puisque Keko juge depuis son téléphone. Le
 * coffre de départ ne contient que cinq objets — on ne peut rien dire d'une
 * barre de défilement avec une seule page.
 *
 * **On RÉPÈTE ce qui existe, on n'invente pas de pièces** : la réserve garde
 * ses proportions (des armes et des consommables), donc les onglets restent
 * peuplés. Les trésors viennent de la vraie table de butin, à des profondeurs
 * croissantes — ils ont donc les valeurs qu'ils auraient en jeu.
 */
export function COFFRE_URL(): number {
  const demande = Number(new URLSearchParams(location.search).get('coffre'))
  return Number.isFinite(demande) && demande > 0 ? Math.min(200, Math.round(demande)) : 0
}

export function coffreDeTest(hub: Hub, combien = COFFRE_URL()): Hub {
  if (combien <= 0) return hub
  // LES QUATRE PIÈCES QUI EXISTENT, pas cinq copies de deux. La réserve de
  // départ ne contient qu'un Espadon et des potions : à cinq colonnes, chaque
  // ligne se ressemblait au pixel près et *on ne voyait pas le coffre
  // défiler*. En répétant les vrais modèles, le motif se décale d'une ligne à
  // l'autre — et chaque carte garde SON dessin.
  //
  // *Numéroter les copies dans leur nom avait l'air plus lisible* : l'art se
  // cherche par nom de modèle, donc « Potion 3 » sortait avec le sceau de
  // repli. **Un banc d'essai qui montre des cartes cassées ne se juge pas.**
  // QUATRE modèles pour CINQ colonnes : le motif se décale d'une case à chaque
  // ligne. À cinq modèles il retombait en phase et les colonnes devenaient
  // uniformes — on ne voyait toujours pas défiler.
  const modeles: Objet[] = [ESPADON, GLAIVE, PLASTRON, POTIONS_DEPART[0]!]
  // LE COFFRE EMPILE LES DOUBLONS, donc quarante copies du même modèle ne font
  // que quatre CASES — et le banc, qui existe pour éprouver le défilement, ne
  // faisait plus défiler quoi que ce soit. *Un banc qui ne produit plus ce
  // qu'on vient l'y chercher n'est plus un banc.*
  //
  // On fait donc varier la RARETÉ, qui entre dans `signature()` : chaque
  // couple modèle + rareté est une pile à lui, donc une case de plus. Ça sert
  // deux fins d'un coup — la grille se remplit, et l'échelle des métaux se
  // voit sur un objet qu'on connaît.
  const raretes: Rarete[] = ['commune', 'rare', 'epique', 'legendaire']
  const reserve = [...hub.reserve]
  for (let i = 0; reserve.length < combien; i += 1) {
    const modele = modeles[i % modeles.length]!
    const rarete = raretes[Math.floor(i / modeles.length) % raretes.length]!
    // Un identifiant PROPRE à la copie : tout se désigne par id dans le hub,
    // et deux pièces qui partagent le leur se déplaceraient ensemble.
    reserve.push({ ...modele, id: `${modele.id}-essai-${i}`, rarete })
  }
  const rng = createRng(4242)
  const tresors = Array.from({ length: Math.max(6, Math.round(combien / 3)) }, (_, n) =>
    tresorRecompense(1 + (n % 8), rng, `essai-${n}`),
  )
  // LE COFFRE EST UNE SEULE LISTE : les trésors s'y rangent avec le reste.
  return { ...hub, reserve: [...reserve, ...tresors] }
}

/**
 * DE QUOI JUGER UNE PIÈCE RICHE : `?r3f&set=8`.
 *
 * Keko : « si une carte d'équipement génère plus de 3 cartes, on fait comment ?
 * car ça ne loge pas à l'écran » — et il parlait du ZOOM, où le set se montre
 * en vraies cartes. *La vitrine ne peut pas déborder* : la taille d'une carte
 * du set y est bornée par la hauteur (deux lignes plus leurs pastilles) et par
 * la largeur (quatre à côté de la pièce), donc elle RAPETISSE au lieu de
 * sortir. Ce qui se juge n'est donc pas le débordement, c'est la LISIBILITÉ —
 * et ça ne se juge pas sur une capture, ça se juge sur son téléphone.
 *
 * **On donne ses modèles à l'ESPADON plutôt que d'inventer une pièce.** L'art
 * se cherche par nom de modèle : une « Lame d'essai » sortirait avec le sceau
 * de repli, et *un banc d'essai qui montre des cartes cassées ne se juge pas.*
 * Les modèles viennent des trois pièces qui existent — huit au total, chacun
 * avec son vrai dessin.
 */
export function SET_URL(): number {
  const demande = Number(new URLSearchParams(location.search).get('set'))
  return Number.isFinite(demande) && demande > 0 ? Math.min(8, Math.round(demande)) : 0
}

export function setDeTest(hub: Hub, combien = SET_URL()): Hub {
  if (combien <= 0) return hub
  const modeles = [...ESPADON.set, ...GLAIVE.set, ...PLASTRON.set].slice(0, combien)
  const espadon = { ...ESPADON, set: modeles }
  return { ...hub, reserve: hub.reserve.map((o) => (o.id === ESPADON.id ? espadon : o)) }
}

/**
 * DE QUOI JUGER L'ÉCHELLE DE RARETÉ : `?r3f&raretes`.
 *
 * Le jeu n'emploie que deux crans sur cinq — commune et rare — donc *on ne peut
 * pas juger une échelle sur deux barreaux.* Le coffre reçoit une copie de
 * chaque pièce à chaque rareté, dans l'ordre de l'échelle, pour que les cinq
 * métaux se comparent côte à côte.
 *
 * On REPREND les pièces qui existent plutôt que d'en inventer : l'art se
 * cherche par nom de modèle, et *un banc d'essai qui montre des cartes cassées
 * ne se juge pas.*
 */
export function RARETES_URL(): boolean {
  return new URLSearchParams(location.search).has('raretes')
}

export function raretesDeTest(hub: Hub, actif = RARETES_URL()): Hub {
  if (!actif) return hub
  const echelle: Rarete[] = ['commune', 'rare', 'epique', 'legendaire']
  // TOUT CE QU'ON POSSÈDE, ÉQUIPÉ COMPRIS. Keko : « tu peux peupler le coffre
  // de chaque élément en chaque version de rareté ? » — le banc n'en montrait
  // que trois (un Glaive, un Plastron, une Potion), ce qui suffisait à juger
  // les métaux et plus du tout à juger les CIELS, qui se lisent par famille.
  // On collecte donc le coffre ET le chargement, et on déduplique par nom :
  // *le banc montre le catalogue, pas l'état de la partie.*
  const portees = [
    ...hub.chargement.mains,
    hub.chargement.armure,
    ...consommablesDeLaPile(hub.chargement.pile),
  ].filter((o): o is Objet => o !== null && o !== undefined)
  const vus = new Set<string>()
  const modeles: Objet[] = []
  for (const objet of [...hub.reserve, ...portees]) {
    if (estTresor(objet)) continue
    const nom = nomObjet(objet)
    if (vus.has(nom)) continue
    vus.add(nom)
    modeles.push(objet)
  }
  const pieces = echelle.flatMap((rarete) =>
    modeles.map((modele) => ({ ...modele, id: `${modele.id}-${rarete}`, rarete })),
  )
  // ET LES TRÉSORS AVEC, puisqu'ils ont leur ciel à eux. *Leur rang vient de
  // leur VALEUR et non d'une rareté*, donc on les tire à toutes les
  // profondeurs plutôt qu'à tous les crans : la table monte avec la descente,
  // et huit paliers couvrent l'échelle entière.
  const rng = createRng(7)
  const tresors = Array.from({ length: 16 }, (_, i) =>
    tresorRecompense(1 + (i % 8), rng, `banc-${i}`),
  )
  return { ...hub, reserve: [...pieces, ...tresors] }
}

/**
 * DE QUOI JUGER DE GROSSES PILES : `?r3f&piles=13,6`.
 *
 * Keko : « on peut tester d'avoir 6 super potions et 13 potions normales ? » —
 * le coffre de départ n'en a que quatre et deux, donc *le compte d'une pile ne
 * passe jamais à deux chiffres*, et c'est justement ce qu'il faut voir pour
 * juger le badge du coin.
 *
 * On REMPLACE les consommables de la réserve plutôt que d'en ajouter à la
 * suite : on veut deux piles nettes, pas la somme des deux. Chaque copie
 * garde le modèle qui existe — *un banc d'essai qui montre des cartes cassées
 * ne se juge pas* — et prend son propre identifiant, puisque tout se désigne
 * par id dans le hub.
 */
export function PILES_URL(): [number, number] | null {
  const demande = new URLSearchParams(location.search).get('piles')
  if (demande === null) return null
  const [a, b] = demande.split(',').map((n) => Number(n))
  const borne = (n: number | undefined, defaut: number): number =>
    n !== undefined && Number.isFinite(n) && n > 0 ? Math.min(99, Math.round(n)) : defaut
  return [borne(a, 13), borne(b, 6)]
}

export function pilesDeTest(hub: Hub, combien = PILES_URL()): Hub {
  if (combien === null) return hub
  const [potions, supers] = combien
  const modelePotion = POTIONS_DEPART[0]!
  const modeleSuper = SUPER_POTIONS_DEPART[0]!
  const copies = (modele: Objet, n: number, marque: string): Objet[] =>
    Array.from({ length: n }, (_, i) => ({ ...modele, id: `${modele.id}-${marque}-${i}` }))
  const reste = hub.reserve.filter((o) => estTresor(o) || !estConsommable(o))
  return {
    ...hub,
    reserve: [
      ...reste,
      ...copies(modelePotion, potions, 'essai'),
      ...copies(modeleSuper, supers, 'essai'),
    ],
  }
}

/**
 * DE QUOI REMPLIR LA MAIN. Le chargement gratuit donne 10 cartes ; en demander
 * 20 n'en tirerait que 10, et on ne verrait pas ce qu'on voulait voir. On
 * répète donc les pièces jusqu'à ce que le deck dépasse la main.
 *
 * *Répéter l'équipement plutôt que dupliquer les cartes* : le deck reste la
 * somme de ce qu'on porte, donc il garde ses proportions — six gardes pour
 * trois frappes, comme dans une vraie main.
 */
export function equipementPourTenir(pieces: Piece[], tailleMain: number): Piece[] {
  const parTour = deckDeLEquipement(pieces).length
  if (parTour === 0 || parTour > tailleMain) return pieces
  const fois = Math.ceil((tailleMain + 1) / parTour)
  return Array.from({ length: fois }, () => pieces).flat()
}

/**
 * LE DECK EMPORTÉ, GROUPÉ PAR MODÈLE.
 *
 * *On ne montre pas dix cartes quand il n'y a que six choses à lire* : quatre
 * Gardes côte à côte ne se lisent pas quatre fois mieux, c'est la leçon déjà
 * payée sur les doublons du coffre. Le compte porte le nombre, et il est posé
 * SUR la carte, jamais peint dedans — une Garde du deck et une Garde en main
 * doivent partager leur dessin, donc leur texture.
 *
 * **Deux cartes sont « les mêmes » quand elles MONTRENT la même chose** — la
 * `signature()` de la carte peinte, qui est déjà la clé du cache de textures.
 * Pas leur identifiant, qui est unique par exemplaire.
 */
export function deckAPeindre(cartes: Carte[]): { carte: CarteAPeindre; nombre: number }[] {
  const piles: { carte: CarteAPeindre; nombre: number }[] = []
  const parCle = new Map<string, { carte: CarteAPeindre; nombre: number }>()
  for (const carte of cartes) {
    const peinte = aPeindre(carte)
    const cle = signature(peinte)
    const deja = parCle.get(cle)
    if (deja === undefined) {
      const pile = { carte: peinte, nombre: 1 }
      parCle.set(cle, pile)
      piles.push(pile)
    } else deja.nombre += 1
  }
  return piles
}

/**
 * DE QUOI JUGER UN GROS DECK : `?r3f&deck` (avec `&set=8` pour le maximum).
 *
 * Keko : « ça se passe comment si le deck a un nombre de cartes qui ne loge pas
 * à l'écran ? » Le chargement de départ n'en donne que six modèles — *on ne
 * peut rien dire d'une grille avec six cases*, la leçon du coffre à cinq
 * objets. Le banc équipe donc la pièce la plus riche du coffre, l'armure, et
 * remplit la pile de consommables TOUS DIFFÉRENTS : avec `&set=8`, ça fait
 * douze modèles distincts, le plafond de ce que le catalogue sait produire
 * aujourd'hui.
 *
 * On REPREND ce que le coffre contient plutôt que d'inventer des pièces : *un
 * banc d'essai qui montre des cartes cassées ne se juge pas.*
 */
export function DECK_URL(): boolean {
  return new URLSearchParams(location.search).has('deck')
}

export function chargementDeTest(hub: Hub, actif = DECK_URL()): Hub {
  if (!actif) return hub
  const portables = hub.reserve.filter((o): o is Objet => !estTresor(o))
  const armes = portables.filter((o): o is Arme => 'mains' in o)
  const armures = portables.filter((o): o is Armure => !('mains' in o) && !estConsommable(o))
  // La plus fournie d'abord : c'est elle qui fait le deck le plus long.
  const combien = (o: Arme | Armure): number => o.set.reduce((n, e) => n + e.nombre, 0)
  // On retombe sur ce qui est DÉJÀ équipé quand le coffre n'en a pas : le
  // Plastron part au torse à la création, donc il n'est pas dans la réserve.
  const arme = [...armes].sort((a, b) => combien(b) - combien(a))[0] ?? hub.chargement.mains[0]
  const armure = armures[0] ?? hub.chargement.armure
  // Des consommables TOUS DIFFÉRENTS : trois fois le même ne ferait qu'un
  // modèle, et c'est le nombre de MODÈLES qui remplit la grille.
  const vus = new Set<string>()
  const pile: (Consommable | null)[] = pileVide()
  let i = 0
  for (const objet of portables) {
    if (!estConsommable(objet) || vus.has(objet.modele.nom) || i >= pile.length) continue
    vus.add(objet.modele.nom)
    pile[i] = objet
    i += 1
  }
  return { ...hub, chargement: { mains: [arme, null], armure, pile } }
}

/**
 * COMBIEN DE CASES LE BANC DOIT MONTRER : `?r3f&deck=25`.
 *
 * Le catalogue ne sait produire que douze modèles distincts aujourd'hui, et
 * *on ne peut rien dire d'une grille qu'on ne sait pas remplir.* Le banc répète
 * donc les modèles du deck jusqu'au compte demandé : **les cases sont vraies,
 * seul leur contenu se répète** — c'est la mise en page qu'on juge, pas le
 * contenu, et les dessins restent ceux de vrais modèles.
 */
export function CASES_URL(): number {
  const demande = Number(new URLSearchParams(location.search).get('deck'))
  return Number.isFinite(demande) && demande > 0 ? Math.min(60, Math.round(demande)) : 0
}

export function deckDeTest(
  entrees: { carte: CarteAPeindre; nombre: number }[],
  combien = CASES_URL(),
): { carte: CarteAPeindre; nombre: number }[] {
  if (combien <= entrees.length || entrees.length === 0) return entrees
  // Un identifiant par case : React a besoin d'une clé, et *l'index n'en est
  // pas une* — c'est la leçon de la carte qui clignotait en noir.
  return Array.from({ length: combien }, (_, i) => {
    const source = entrees[i % entrees.length]!
    return i < entrees.length
      ? source
      : { carte: { ...source.carte, id: `${source.carte.id}-banc${i}` }, nombre: source.nombre }
  })
}

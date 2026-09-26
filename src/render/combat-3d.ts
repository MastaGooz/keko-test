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
import { creerHub, equipement } from '../logic/hub.ts'
import type { Piece } from '../logic/armes.ts'
import { ESPADON, GLAIVE, PLASTRON, POTIONS_DEPART, deckDeLEquipement } from '../logic/armes.ts'
import type { Objet } from '../logic/armes.ts'
import { estConsommable } from '../logic/armes.ts'
import { tresorRecompense } from '../logic/cartes.ts'
import { lignes, nature, sansBalises } from '../ui/texte-carte.ts'
import type { CarteAPeindre } from './texture-carte.ts'

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
    effet: lignes(carte).map(sansBalises),
    type: nature(carte),
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
  return set.map((e, i) => ({
    carte: aPeindre({ ...e.modele, id: `${objet.id}-${i}` }),
    nombre: e.nombre,
  }))
}

export function pieceAPeindre(objet: Objet): CarteAPeindre {
  const set = estConsommable(objet) ? [{ modele: objet.modele, nombre: 1 }] : objet.set
  const pied = estConsommable(objet)
    ? 'Consommable'
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
    effet: [set.map((e) => `${e.nombre}× ${e.modele.nom}`).join(' · ')],
    type: pied,
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
    hub.chargement.pile,
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
  const reserve = [...hub.reserve]
  for (let i = 0; reserve.length < combien; i += 1) {
    const modele = modeles[i % modeles.length]!
    // Un identifiant PROPRE à la copie : tout se désigne par id dans le hub,
    // et deux pièces qui partagent le leur se déplaceraient ensemble.
    reserve.push({ ...modele, id: `${modele.id}-essai-${i}` })
  }
  const rng = createRng(4242)
  const tresors = Array.from({ length: Math.max(6, Math.round(combien / 3)) }, (_, n) =>
    tresorRecompense(1 + (n % 8), rng, `essai-${n}`),
  )
  return { ...hub, reserve, tresors }
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

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
import { commencerDescente } from '../logic/descente.ts'
import { creerHub, equipement } from '../logic/hub.ts'
import type { Objet } from '../logic/armes.ts'
import { estConsommable } from '../logic/armes.ts'
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
export function descenteDeDepart(seed: number): { descente: Descente; rng: ReturnType<typeof createRng> } {
  const rng = createRng(seed)
  const hub = creerHub()
  const descente = commencerDescente(rng, undefined, equipement(hub.chargement), hub.chargement.pile)
  return { descente, rng }
}

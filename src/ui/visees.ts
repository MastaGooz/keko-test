/**
 * Les arches de visée : un trait pointillé en cloche entre la carte levée et
 * chaque corps qu'elle peut frapper.
 *
 * Pourquoi vers TOUS les corps, et pas vers un seul : on joue en deux tapes —
 * une pour lever la carte, une pour choisir la cible. Entre les deux il n'y a
 * pas encore de cible, et pas de doigt à suivre non plus. L'arche ne sert donc
 * pas à confirmer un choix, elle sert à montrer **qu'il y en a un à faire**,
 * et vers quoi.
 *
 * Purement décoratif : ce fichier ne lit aucun état de jeu, seulement des
 * positions à l'écran. Le supprimer ne change rien au jeu.
 */
import type { View } from './render.ts'

type Point = { x: number; y: number }

/** Le centre d'un élément, en coordonnées d'écran. */
function centre(element: Element, part = 0.5): Point {
  const r = element.getBoundingClientRect()
  return { x: r.left + r.width / 2, y: r.top + r.height * part }
}

/**
 * L'arche. Le point de contrôle est posé au-dessus des deux extrémités, d'une
 * hauteur qui suit la distance : court trajet, cloche discrète ; long trajet,
 * grande courbe. Sans ça, une arche entre deux points proches part au plafond.
 */
function arche(depart: Point, arrivee: Point, acheve: boolean): string {
  const distance = Math.hypot(arrivee.x - depart.x, arrivee.y - depart.y)
  // La courbe reste toujours entre ses trois points de contrôle : borner
  // celui du haut suffit à garantir qu'elle ne sort pas par le plafond. En
  // paysage, sans ça, les grands trajets envoyaient le sommet à -125.
  const sommet = Math.max(6, Math.min(depart.y, arrivee.y) - Math.max(26, distance * 0.3))
  const milieu = { x: (depart.x + arrivee.x) / 2, y: sommet }

  // La tangente en fin de courbe donne l'orientation de la pointe.
  const angle = Math.atan2(arrivee.y - milieu.y, arrivee.x - milieu.x)
  const aile = (decalage: number): Point => ({
    x: arrivee.x - Math.cos(angle - decalage) * 13,
    y: arrivee.y - Math.sin(angle - decalage) * 13,
  })
  const g = aile(0.42)
  const d = aile(-0.42)
  const classe = acheve ? 'arche achevable' : 'arche'

  return (
    `<path class="${classe}" d="M${depart.x.toFixed(1)} ${depart.y.toFixed(1)} ` +
    `Q${milieu.x.toFixed(1)} ${milieu.y.toFixed(1)} ` +
    `${arrivee.x.toFixed(1)} ${arrivee.y.toFixed(1)}"/>` +
    `<circle class="${classe} depart" cx="${depart.x.toFixed(1)}" cy="${depart.y.toFixed(1)}" r="3"/>` +
    `<path class="${classe} pointe" d="M${arrivee.x.toFixed(1)} ${arrivee.y.toFixed(1)} ` +
    `L${g.x.toFixed(1)} ${g.y.toFixed(1)} L${d.x.toFixed(1)} ${d.y.toFixed(1)}Z"/>`
  )
}

/**
 * Redessine les arches. À rappeler après chaque rendu, et à chaque fois que
 * les positions bougent — redimensionnement, bascule d'orientation.
 */
export function tracerVisees(view: View): void {
  // La carte engagée vit SUR LE JOUEUR et non dans la main : on la cherche dans
  // toute la page, pas dans `view.cartes`.
  const carte = view.root.querySelector('.carte-engagee .carte')
  const cibles = [...view.ennemis.querySelectorAll('.creature.cible')]

  if (carte === null || cibles.length === 0) {
    view.visees.innerHTML = ''
    return
  }

  // Le haut de la carte tenue par le joueur : le trait part de la carte, pas
  // de son ombre.
  const depart = centre(carte, 0.06)
  view.visees.innerHTML = cibles
    .map((cible) => {
      const corps = cible.querySelector('.chair') ?? cible
      return arche(depart, centre(corps, 0.55), cible.classList.contains('achevable'))
    })
    .join('')
}

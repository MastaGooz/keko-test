/**
 * CE QU'UNE CARTE DIT, en un seul endroit.
 *
 * Le texte d'effet, le type gravé au pied et la famille qui la colore sont les
 * mêmes que la carte soit dessinée en CSS (le jeu 2D) ou peinte dans une
 * texture (le moteur 3D). **Les écrire deux fois, c'est garantir qu'un jour les
 * deux divergeront** — c'est exactement ce qui était arrivé aux quatre
 * fonctions qui dessinaient chacune leur carte avant `corpsCarte`.
 *
 * Aucun accès au DOM ici : le module est lisible par un canvas comme par une
 * chaîne de HTML. Le balisage qu'il produit (`<b>`, `<small>`) est du contenu,
 * pas du rendu — le canvas le retire, le DOM l'affiche.
 */
import type { Carte } from '../logic/combat.ts'

/**
 * Ce que fait la carte, en toutes lettres : une ligne par effet. Le chiffre
 * est dedans, en gras et en accent — c'est le seul endroit où il vit.
 */
export function lignes(carte: Carte): string[] {
  const l: string[] = []
  // L'or d'abord : c'est ce qu'un trésor EST, le reste est ce qu'il peut faire.
  if (carte.type === 'tresor') l.push(`Vaut <b>${carte.valeur ?? 0}</b> or s'il ressort`)
  if (carte.degats > 0) l.push(`Inflige <b>${carte.degats}</b> dégâts`)
  for (const e of carte.effets ?? []) {
    // La condition sur une seconde ligne, en retrait : « ce tour » et « l'or
    // est perdu » coupaient au milieu quand ils suivaient sur la même ligne.
    if (e.type === 'bloc') l.push(`Bloque <b>${e.montant}</b> dégâts`, `<small>ce tour seulement</small>`)
    if (e.type === 'soin') {
      // Un trésor ne soigne qu'en se détruisant : la carte doit dire les deux,
      // le gain et le prix, sinon elle ment sur ce qu'on joue.
      if (carte.type === 'tresor') l.push(`Brûler : rend <b>${e.montant}</b> PV`, `<small>et son or est perdu</small>`)
      else {
        l.push(`Rend <b>${e.montant}</b> PV`)
        // Une carte à usages ne l'écrit pas : ses charges sont des pastilles.
        // Une carte qui s'exile dit qu'elle se détruit.
        if (carte.usages === undefined && carte.exil === true) l.push(`<small>se boit : détruite</small>`)
      }
    }
    if (e.type === 'energie') l.push(`Donne <b>+${e.montant}</b> énergie`)
    if (e.type === 'degatsTous') l.push(`Inflige <b>${e.montant}</b> à chaque ennemi`)
  }
  return l
}

/** La famille d'une carte, pour la teinte de son écusson et de son chiffre. */
export function famille(carte: Carte): 'tresor' | 'consommable' | 'attaque' | 'defense' | 'action' {
  if (carte.type === 'tresor') return 'tresor'
  if (carte.usages !== undefined || carte.exil === true) return 'consommable'
  if (carte.degats > 0 || carte.effets?.some((e) => e.type === 'degatsTous')) return 'attaque'
  if (carte.effets?.some((e) => e.type === 'bloc')) return 'defense'
  return 'action'
}

/** Ce qu'est la carte, pour le type gravé en bas. */
export function nature(carte: Carte): string {
  // Le rang de richesse ne s'écrit pas : il se lit au cadre, comme la rareté
  // d'une pièce. Keko : « inutile de spécifier la qualité modeste en bas ».
  if (carte.type === 'tresor') return 'Trésor'
  // OBJET, ET PAS « CONSOMMABLE » : c'est le nom que porte l'onglet du coffre,
  // et *une même chose ne peut pas s'appeler autrement selon l'écran où on la
  // regarde.* Demandé par Keko. Le mot est aussi plus court, ce qui compte sur
  // un pied de carte enfoui aux trois quarts.
  if (carte.usages !== undefined || carte.exil === true) return 'Objet'
  if (carte.degats > 0 || carte.effets?.some((e) => e.type === 'degatsTous')) return 'Attaque'
  if (carte.effets?.some((e) => e.type === 'bloc')) return 'Défense'
  return 'Action'
}

/** Le texte nu d'une ligne : ce qu'un canvas peut peindre. */
export function sansBalises(ligne: string): string {
  return ligne.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ')
}

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
import type { Rarete } from '../logic/armes.ts'

/**
 * LE RANG D'UN TRÉSOR, tiré de sa valeur — et il prend l'échelle d'alliages.
 *
 * Keko : « on peut appliquer les couleurs de rareté aux trésors maintenant ? »
 * *Ce qui l'interdisait a été levé par la forme* : depuis que le trésor porte
 * un cadre franc à coins coupés là où tout le reste porte la coque déchirée,
 * la couleur n'a plus à dire la famille. **La forme dit la famille, la couleur
 * dit l'échelle** — un trésor d'or ne se confond pas avec une arme épique,
 * leurs silhouettes diffèrent.
 *
 * Les seuils coupent la table de butin en quatre parts ÉGALES, trois trésors
 * par cran : *un rang qui ne tomberait pas juste sur la table donnerait des
 * crans vides et des crans bondés.* Camée / Aiguière / Torque en bronze,
 * Médaillon / Idole / Cassette en argent, Calice / Ostensoir / Reliquaire en
 * or, Sceptre / Diadème / Couronne en diamant.
 *
 * Ça remplace les trois rangs de richesse du jeu 2D, qui n'avaient de nom que
 * dans le code : `cossu` et `modeste` ne se voyaient nulle part.
 */
export function rangDuTresor(valeur: number): Rarete {
  if (valeur >= 180) return 'legendaire'
  if (valeur >= 115) return 'epique'
  if (valeur >= 70) return 'rare'
  return 'commune'
}

/**
 * Ce que fait la carte, en toutes lettres : une ligne par effet. Le chiffre
 * est dedans, en gras et en accent — c'est le seul endroit où il vit.
 */
export function lignes(carte: Carte, valeurAPart = false): string[] {
  const l: string[] = []
  // LA VALEUR D'UN TRÉSOR PEUT SE DIRE AILLEURS QUE DANS LE CARTOUCHE.
  //
  // Keko : « pour le gain en or des trésors on ne va pas l'afficher directement
  // dans la description ; on va afficher une valeur de qualité avec un petit
  // symbole, hors du champ de description ». Le moteur 3D la peint en badge et
  // passe `valeurAPart` ; le jeu 2D, qui n'a pas ce badge, garde la phrase —
  // *un moteur qui ne sait pas montrer une chose ne doit pas cesser de la
  // dire.*
  if (carte.type === 'tresor' && !valeurAPart) {
    l.push(`Vaut <b>${carte.valeur ?? 0}</b> or s'il ressort`)
  }
  if (carte.degats > 0) l.push(`Inflige <b>${carte.degats}</b> dégâts`)
  for (const e of carte.effets ?? []) {
    // La condition sur une seconde ligne, en retrait : « ce tour » et « l'or
    // est perdu » coupaient au milieu quand ils suivaient sur la même ligne.
    if (e.type === 'bloc') l.push(`Bloque <b>${e.montant}</b> dégâts`, `<small>ce tour seulement</small>`)
    if (e.type === 'soin') {
      // Un trésor ne soigne qu'en se détruisant : la carte doit dire les deux,
      // le gain et le prix, sinon elle ment sur ce qu'on joue.
      if (carte.type === 'tresor') {
        // Le mot suit l'affichage : là où la carte ne parle plus d'or, elle
        // dit sa VALEUR. *Une carte ne peut pas perdre un or qu'elle n'a
        // jamais annoncé.*
        const perte = valeurAPart ? 'et sa valeur est perdue' : 'et son or est perdu'
        l.push(`Brûler : rend <b>${e.montant}</b> PV`, `<small>${perte}</small>`)
      }
      else {
        l.push(`Rend <b>${e.montant}</b> PV`)
        // Une carte à usages ne l'écrit pas : ses charges sont des pastilles.
        // Une carte qui s'exile dit qu'elle se détruit.
        if (carte.usages === undefined && carte.exil === true) l.push(`<small>se boit : détruite</small>`)
      }
    }
    // POINTS D'ACTION, ET PAS « ÉNERGIE » : le mot renvoie au TEMPS, et c'est
    // ce que Keko veut dire — *plus une carte coûte, plus l'action est longue
    // et puissante.* Le code garde `energie` partout, c'est un nom interne.
    if (e.type === 'energie') l.push(`Donne <b>+${e.montant}</b> points d'action`)
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
  // LE MOT EST « BUTIN », PAS « TRÉSOR ». Tranché par Keko. *Un trésor est un
  // objet qu'on possède, un butin est ce qu'on RAPPORTE* — et c'est bien ce
  // que fait la carte : elle ne vaut que si elle ressort du donjon. Le
  // vocabulaire dit la règle, comme « enchantement » plutôt que « maîtrise ».
  //
  // Le code, lui, garde `tresor` : c'est un nom interne qui ne se lit nulle
  // part à l'écran, et *un renommage traversant `logic/` pour un mot ne vaut
  // pas son risque* — la règle déjà tenue par `energie`.
  if (carte.type === 'tresor') return 'Butin'
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

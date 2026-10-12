/**
 * LES DEUX BONUS D'UN EXEMPLAIRE : holographique et animé.
 *
 * Tranché par Keko : « chaque carte peut également être holographique et/ou
 * animé (qui sont deux bonus de rareté applicables à toutes les raretés, animé
 * étant encore plus rare qu'holographique) », et **ils se tirent À
 * L'OUVERTURE** — c'est ce qu'il a choisi contre « propriété de la carte ».
 *
 * ***Ça change ce qu'est une carte*** : jusqu'ici deux exemplaires du même
 * emoji étaient le même objet, et le jeu s'en servait — *le coffre les empile
 * par ce qu'ils MONTRENT*, et la texture est partagée par signature. **Un
 * exemplaire holographique est désormais un objet à lui**, et c'est exactement
 * ce qui fait l'intérêt d'ouvrir un paquet de plus.
 *
 * Les deux sont INDÉPENDANTS : « et/ou », donc deux tirages séparés, et une
 * carte peut être les deux.
 *
 * Pur, donc vérifiable sans navigateur — et seedé, donc `?paquet=42` rend
 * exactement les mêmes bonus.
 */

/** Ce qu'un exemplaire a reçu en plus de sa rareté. */
export interface Bonus {
  holo: boolean
  anime: boolean
}

/**
 * LES CHANCES, ET CE SONT DES PLACEHOLDERS.
 *
 * *Keko a donné l'ordre, pas les chiffres* — « animé étant encore plus rare
 * qu'holographique ». **À régler quand il aura ouvert des paquets**, c'est la
 * seule façon de juger une fréquence d'apparition.
 *
 * **L'animé est DEUX FOIS plus rare qu'il n'en a l'air** : il ne peut sortir
 * que sur les emoji qui ont une version animée, soit un tiers du catalogue.
 * *Trois pour cent d'un tiers font un pour cent*, donc l'écart avec
 * l'holographique est de dix contre un et non de trois.
 */
export const CHANCES_BONUS = { holo: 0.1, anime: 0.03 } as const

/**
 * Tire les bonus d'un exemplaire.
 *
 * **L'ANIMÉ DEMANDE QUE L'EMOJI SOIT ANIMABLE**, et c'est une vraie contrainte,
 * pas un garde-fou : *on ne peut pas animer ce que Google n'a pas animé* —
 * seuls 614 emoji sur 1 923 ont un fichier. **Le tirage a quand même lieu**, et
 * c'est délibéré : sans ça, le nombre d'appels au hasard dépendrait de la carte,
 * et *deux parties de même graine ne rendraient plus la même suite.*
 */
export function tirerBonus(animable: boolean, hasard: () => number): Bonus {
  const holo = hasard() < CHANCES_BONUS.holo
  const anime = hasard() < CHANCES_BONUS.anime
  return { holo, anime: anime && animable }
}

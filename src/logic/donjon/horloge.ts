/**
 * L'HORLOGE DE JEU : le temps réel, injecté, multiplié par une vitesse.
 *
 * *Rien ne lit l'heure ici* : le rendu passe `Date.now()`, la simulation son
 * propre compteur. Changer de vitesse repose l'origine à l'instant du
 * changement, donc le temps de jeu ne saute jamais.
 */
export type Horloge = {
  /** L'instant réel de la dernière origine, et le temps de jeu qui lui correspond. */
  reel: number
  jeu: number
  vitesse: number
}

export function nouvelleHorloge(reel: number, jeu: number, vitesse = 1): Horloge {
  return { reel, jeu, vitesse }
}

export function tempsDeJeu(h: Horloge, reel: number): number {
  return h.jeu + Math.max(0, reel - h.reel) * h.vitesse
}

export function changerDeVitesse(h: Horloge, reel: number, vitesse: number): Horloge {
  return { reel, jeu: tempsDeJeu(h, reel), vitesse }
}

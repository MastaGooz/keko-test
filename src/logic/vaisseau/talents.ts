/**
 * LES TALENTS du jeu du vortex (Keko, 14/11 : « à chaque fois que la barre est remplie à 100 %, on met le jeu en pause
 * pour tout le monde ; on choisit un talent parmi 3 propositions, c'est-à-dire une amélioration »).
 *
 * Un talent transforme la configuration du vaisseau (il se cumule : le même, repris, s'ajoute encore). Les trois
 * propositions d'un niveau sont tirées de la graine de la partie — le même niveau de la même partie propose les mêmes.
 * *La liste et les chiffres sont de moi, à rejuger.* PUR : pas de hasard non seedé.
 */
import { hache, type ConfigVaisseau } from './jeu.ts'

/**
 * LA FAMILLE D'UN TALENT (Keko, 21/11 : des cartes « de rareté », le cadre teinté selon le type de talent) : ce sur quoi
 * il joue — les armes, la défense, le vol, le butin.
 */
export type FamilleDeTalent = 'arme' | 'defense' | 'vol' | 'butin'
export type Talent = {
  id: string
  famille: FamilleDeTalent
  nom: string
  /** Ce qu'il change, dit au joueur. */
  dit: string
  /** Le dessin de sa carte (la page le connaît par ce nom). */
  icone: string
  appliquer: (c: ConfigVaisseau) => ConfigVaisseau
}

export const TALENTS: Talent[] = [
  { id: 'cadence', famille: 'arme', nom: 'Chargeurs rapides', dit: 'Les armes tirent 20 % plus souvent.', icone: 'cadence', appliquer: (c) => ({ ...c, armes: c.armes.map((a) => ({ ...a, cadence: a.cadence / 1.2 })) }) },
  { id: 'degats', famille: 'arme', nom: 'Obus perforants', dit: 'Les armes font 25 % de dégâts en plus.', icone: 'critique', appliquer: (c) => ({ ...c, armes: c.armes.map((a) => ({ ...a, degats: Math.round(a.degats * 1.25) })) }) }, // (un entier — Keko, 20/11 : « pas de chiffres à virgule »)
  { id: 'portee', famille: 'arme', nom: 'Longue vue', dit: 'Les armes portent 20 % plus loin.', icone: 'exploration', appliquer: (c) => ({ ...c, armes: c.armes.map((a) => ({ ...a, portee: a.portee * 1.2, vie: a.vie * 1.2 })) }) },
  { id: 'moteur', famille: 'vol', nom: 'Moteur poussé', dit: 'Le vaisseau va 10 % plus vite et accélère 15 % plus fort.', icone: 'vitesse', appliquer: (c) => ({ ...c, vitesseMax: c.vitesseMax * 1.1, poussee: c.poussee * 1.15 }) },
  { id: 'blindage', famille: 'defense', nom: 'Blindage renforcé', dit: 'Un point de blindage de plus.', icone: 'blindage', appliquer: (c) => ({ ...c, coque: c.coque + c.uniteDeVie }) },
  { id: 'bouclier', famille: 'defense', nom: 'Bouclier étendu', dit: 'Un point de bouclier de plus.', icone: 'bouclier', appliquer: (c) => ({ ...c, bouclier: { ...c.bouclier, points: c.bouclier.points + c.uniteDeVie } }) },
  { id: 'recharge', famille: 'defense', nom: 'Bouclier vif', dit: 'Le bouclier se recharge plus tôt et plus vite.', icone: 'acceleration', appliquer: (c) => ({ ...c, bouclier: { ...c.bouclier, delai: c.bouclier.delai * 0.75, regain: c.bouclier.regain * 1.3 } }) },
  { id: 'aimant', famille: 'butin', nom: 'Champ étendu', dit: 'Les pépites sont attirées de 40 % plus loin.', icone: 'aimant', appliquer: (c) => ({ ...c, foreuse: { ...c.foreuse, aimant: c.foreuse.aimant * 1.4 } }) },
]

export const talentDe = (id: string): Talent | undefined => TALENTS.find((x) => x.id === id)

/** Les TROIS talents proposés : tirés de la graine de la partie, du niveau et du rang du choix (un joueur qui en a deux à faire voit deux tirages), tous différents. */
export function proposer(graine: number, niveau: number, rang = 0, exclus: string[] = []): Talent[] {
  // (`exclus` : ceux qu'on ne propose pas — l'Essaim, sans bouclier, n'a que faire de « Bouclier étendu »)
  const reste = TALENTS.filter((x) => !exclus.includes(x.id))
  const choisis: Talent[] = []
  for (let k = 0; k < 3 && reste.length > 0; k++) {
    const i = hache(hache(graine, niveau), hache(rang, k)) % reste.length
    choisis.push(reste.splice(i, 1)[0])
  }
  return choisis
}

/**
 * LE CHOIX D'UN JOUEUR, quand un niveau est gagné : il en a un à faire, plus ceux qu'il avait EN RÉSERVE (« si personne
 * n'a choisi au bout de 30 secondes, le choix est mis en réserve pour le joueur qui n'a pas choisi, et il aura 2 choix
 * la prochaine fois »). `DUREE_DU_CHOIX` : le temps laissé, pour tout le monde.
 */
export const DUREE_DU_CHOIX = 30
export type Choix = { aFaire: number; rang: number }
export const ouvrirLeChoix = (reserve: number): Choix => ({ aFaire: 1 + Math.max(0, reserve), rang: 0 })
/** Un talent choisi : il en reste un de moins à faire (rend null quand tout est choisi). */
export const apresUnChoix = (ch: Choix): Choix | null => (ch.aFaire <= 1 ? null : { aFaire: ch.aFaire - 1, rang: ch.rang + 1 })
/** Le temps écoulé : ce qui reste à choisir part en réserve. */
export const reserveApresLeDelai = (ch: Choix): number => ch.aFaire

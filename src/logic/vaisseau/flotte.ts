/**
 * LA FLOTTE : LE VAISSEAU EST L'UNITÉ DU JEU (Keko, 14/11).
 *
 * Le cuirassé l'a montré : tant que le propulseur était une pièce libre, le même moteur donnait la même pointe à un
 * chasseur de 30 T et à un cuirassé de 170 T — « notre problème vient de la séparation châssis / propulsion ». Tranché :
 *
 * - UN VAISSEAU EST UN MODÈLE, avec SES pièces : ses châssis (« on peut débloquer différents châssis pour un même
 *   vaisseau »), ses propulseurs (deux ou trois, à lui : c'est eux qui portent la vitesse, l'accélération ET la
 *   maniabilité), ses armes — LÉGÈRES ou LOURDES, selon les emplacements de son châssis — et ses outils. Une même arme
 *   peut figurer sur plusieurs vaisseaux, mais ELLE SE DÉBLOQUE SUR CHACUN ;
 * - LA RECHERCHE DÉBLOQUE LES VAISSEAUX (nus, avec leurs pièces de série), plus aucune pièce ;
 * - CHAQUE VAISSEAU A SA SUITE DE MISSIONS, une active à la fois, qui n'avance QU'EN LE PILOTANT ; chaque mission
 *   validée OUVRE une pièce — « la mission donne le droit d'acheter la pièce (crédits + ressources, comme la
 *   recherche) ». La liste d'un vaisseau ne montre donc que ce que ses missions ont déjà ouvert (« afficher toute la
 *   liste dès le début surchargerait l'interface pour les débutants », et « un système d'XP est bizarre pour des
 *   vaisseaux »). Plus tard : une couleur spéciale, une capacité signature en récompense.
 *
 * *Les modèles, leurs missions, leurs cibles et les prix sont de moi, à rejuger.* La règle est pure : la flotte est
 * une valeur.
 */
import { MINERAIS, type Cargaison } from './jeu.ts'
import { hangarNeuf, lireHangar, pieceDe, type Hangar } from './hangar.ts'
import type { Compteur } from './quetes.ts'

/** LA CLASSE d'un vaisseau : la recherche pourra donner des bonus à une classe seulement. */
export type Classe = 'chasseur' | 'lourd'
export const NOMS_CLASSE: Record<Classe, string> = { chasseur: 'Chasseur', lourd: 'Lourd' }

/** Une mission d'un vaisseau : ce qu'elle compte, jusqu'où, et LA PIÈCE qu'elle ouvre à l'achat sur ce vaisseau. */
export type MissionDeVaisseau = { titre: string; dit: string; compteur: Compteur; cible: number; ouvre: string }

export type ModeleDeVaisseau = {
  id: string
  nom: string
  classe: Classe
  dit: string
  /** TOUTES les pièces qu'il peut porter (celles de série comprises). */
  pieces: string[]
  /** Ce qu'il porte en sortant de la recherche. */
  serie: Hangar
  /** Sa suite de missions, dans l'ordre. */
  chaine: MissionDeVaisseau[]
}

export const MODELES: ModeleDeVaisseau[] = [
  {
    id: 'chasseur',
    nom: 'Chasseur',
    classe: 'chasseur',
    dit: 'Léger et vif : son nez suit le regard. Deux armes légères au plus.',
    pieces: ['coque-1', 'coque-2', 'coque-3', 'propulseur-1', 'propulseur-2', 'propulseur-3', 'foreuse-1', 'foreuse-2', 'foreuse-3', 'aimant-1', 'aimant-2', 'radar', 'arme-canon', 'arme-rafale'],
    serie: hangarNeuf(),
    chaine: [
      { titre: 'Rodage', dit: 'Réussissez 2 extractions.', compteur: 'extractions', cible: 2, ouvre: 'propulseur-2' },
      { titre: 'Premier filon', dit: 'Extrayez 30 unités de fer.', compteur: 'fer', cible: 30, ouvre: 'foreuse-2' },
      { titre: 'Éclaireur', dit: 'Éloignez-vous à 700 de la base.', compteur: 'distance', cible: 700, ouvre: 'arme-canon' },
      { titre: 'Baptême du feu', dit: 'Abattez un rival.', compteur: 'rivaux', cible: 1, ouvre: 'coque-2' },
      { titre: 'Pleine soute', dit: 'Extrayez 60 unités.', compteur: 'pepites', cible: 60, ouvre: 'aimant-1' },
      { titre: 'Chasseur de primes', dit: 'Abattez 3 rivaux.', compteur: 'rivaux', cible: 3, ouvre: 'arme-rafale' },
      { titre: 'Aux confins', dit: 'Éloignez-vous à 1 200 de la base.', compteur: 'distance', cible: 1200, ouvre: 'radar' },
      { titre: 'Fièvre de l’or', dit: 'Extrayez 15 unités d’or.', compteur: 'or', cible: 15, ouvre: 'propulseur-3' },
      { titre: 'Éclats', dit: 'Extrayez 6 cristaux.', compteur: 'cristal', cible: 6, ouvre: 'foreuse-3' },
      { titre: 'As', dit: 'Abattez 5 rivaux.', compteur: 'rivaux', cible: 5, ouvre: 'coque-3' },
      { titre: 'Grande campagne', dit: 'Extrayez 150 unités.', compteur: 'pepites', cible: 150, ouvre: 'aimant-2' },
    ],
  },
  {
    id: 'cuirasse',
    nom: 'Cuirassé',
    classe: 'lourd',
    dit: 'Un mastodonte lent, à tourelles : il tire dans toutes les directions sans tourner. Six armes légères, deux lourdes, quatre outils.',
    pieces: ['coque-4', 'propulseur-l1', 'propulseur-l2', 'propulseur-l3', 'foreuse-1', 'foreuse-2', 'foreuse-3', 'aimant-1', 'aimant-2', 'radar', 'arme-canon', 'arme-rafale', 'arme-missiles'],
    serie: { possedees: ['coque-4', 'propulseur-l1', 'foreuse-1', 'arme-canon'], montees: { coque: 'coque-4', propulseur: 'propulseur-l1' }, outils: ['foreuse-1'], armes: ['arme-canon', 'arme-canon'] },
    chaine: [
      { titre: 'Mise à flot', dit: 'Décollez 2 fois.', compteur: 'vols', cible: 2, ouvre: 'arme-rafale' },
      { titre: 'Premier sang', dit: 'Abattez 2 rivaux.', compteur: 'rivaux', cible: 2, ouvre: 'propulseur-l2' },
      { titre: 'Cargo', dit: 'Extrayez 80 unités.', compteur: 'pepites', cible: 80, ouvre: 'foreuse-2' },
      { titre: 'Ligne de front', dit: 'Abattez 4 rivaux.', compteur: 'rivaux', cible: 4, ouvre: 'arme-missiles' },
      { titre: 'Long cours', dit: 'Parcourez 8 000 en vol.', compteur: 'parcouru', cible: 8000, ouvre: 'propulseur-l3' },
      { titre: 'Convoi d’or', dit: 'Extrayez 30 unités d’or.', compteur: 'or', cible: 30, ouvre: 'aimant-1' },
      { titre: 'Terreur', dit: 'Abattez 6 rivaux.', compteur: 'rivaux', cible: 6, ouvre: 'radar' },
      { titre: 'Veine bleue', dit: 'Extrayez 15 cristaux.', compteur: 'cristal', cible: 15, ouvre: 'foreuse-3' },
      { titre: 'Razzia', dit: 'Extrayez 300 unités.', compteur: 'pepites', cible: 300, ouvre: 'aimant-2' },
    ],
  },
]
export const modeleDeVaisseau = (id: string): ModeleDeVaisseau => MODELES.find((mo) => mo.id === id) ?? MODELES[0]

/** Les compteurs dont on garde LE PLUS GRAND au lieu d'additionner (comme les contrats). */
const AU_PLUS_GRAND: Compteur[] = ['distance']

/**
 * Un vaisseau qu'on a : ce qu'il porte (ses pièces achetées, montées), les pièces que ses missions ont OUVERTES à
 * l'achat, le rang de sa mission en cours (au-delà de la dernière : sa suite est finie) et où elle en est.
 */
export type EtatVaisseau = { hangar: Hangar; ouvertes: string[]; rang: number; progres: number }
/** La flotte : les vaisseaux qu'on a (par modèle), et celui qu'on pilote. */
export type Flotte = { actif: string; vaisseaux: Record<string, EtatVaisseau> }

const copie = (h: Hangar): Hangar => ({ possedees: [...h.possedees], montees: { ...h.montees }, outils: [...h.outils], armes: [...h.armes], ...(h.construites === undefined ? {} : { construites: { ...h.construites } }) })
const vaisseauNeuf = (mo: ModeleDeVaisseau): EtatVaisseau => ({ hangar: copie(mo.serie), ouvertes: [], rang: 0, progres: 0 })
export const flotteNeuve = (): Flotte => ({ actif: MODELES[0].id, vaisseaux: { [MODELES[0].id]: vaisseauNeuf(MODELES[0]) } })

export const aLeVaisseau = (f: Flotte, id: string): boolean => f.vaisseaux[id] !== undefined
/** Les modèles qu'on a, dans l'ordre du catalogue. */
export const vaisseauxDe = (f: Flotte): ModeleDeVaisseau[] => MODELES.filter((mo) => aLeVaisseau(f, mo.id))
/** La recherche a débloqué un vaisseau : il rejoint la flotte, nu (déjà là : rien ne change). */
export function ajouterLeVaisseau(f: Flotte, id: string): Flotte {
  const mo = MODELES.find((x) => x.id === id)
  if (mo === undefined || aLeVaisseau(f, id)) return f
  return { ...f, vaisseaux: { ...f.vaisseaux, [id]: vaisseauNeuf(mo) } }
}
/** Piloter un autre vaisseau de la flotte. */
export const choisirLeVaisseau = (f: Flotte, id: string): Flotte => (aLeVaisseau(f, id) && f.actif !== id ? { ...f, actif: id } : f)
/** Le hangar du vaisseau piloté. */
export const hangarActif = (f: Flotte): Hangar => f.vaisseaux[f.actif].hangar
/** Range le hangar du vaisseau piloté (la page le travaille à part). */
export const avecLeHangar = (f: Flotte, h: Hangar): Flotte => (f.vaisseaux[f.actif].hangar === h ? f : { ...f, vaisseaux: { ...f.vaisseaux, [f.actif]: { ...f.vaisseaux[f.actif], hangar: h } } })

/** Le vaisseau piloté peut porter cette pièce (elle est à son modèle). */
export const estDuModele = (f: Flotte, piece: string): boolean => modeleDeVaisseau(f.actif).pieces.includes(piece)
/** La pièce est OUVERTE À L'ACHAT sur le vaisseau piloté : une de ses missions l'a ouverte. */
export const pieceOuverteSur = (f: Flotte, piece: string): boolean => f.vaisseaux[f.actif].ouvertes.includes(piece)

/** La mission en cours d'un vaisseau qu'on a, ou null : sa suite est finie. */
export function missionDe(f: Flotte, id: string): { mission: MissionDeVaisseau; progres: number; finie: boolean } | null {
  const e = f.vaisseaux[id]
  const mission = e === undefined ? undefined : modeleDeVaisseau(id).chaine[e.rang]
  if (e === undefined || mission === undefined) return null
  return { mission, progres: e.progres, finie: e.progres >= mission.cible }
}

/** IL S'EST PASSÉ QUELQUE CHOSE EN PILOTANT : la mission du vaisseau piloté avance, si elle compte cela. */
export function noterEnVol(f: Flotte, compteur: Compteur, valeur: number): Flotte {
  const m = missionDe(f, f.actif)
  if (m === null || m.finie || m.mission.compteur !== compteur || !(valeur > 0)) return f
  const progres = Math.min(m.mission.cible, AU_PLUS_GRAND.includes(compteur) ? Math.max(m.progres, valeur) : m.progres + valeur)
  if (progres === m.progres) return f
  return { ...f, vaisseaux: { ...f.vaisseaux, [f.actif]: { ...f.vaisseaux[f.actif], progres } } }
}

/** Passe les missions dont la pièce est déjà ouverte ou possédée (une sauvegarde reprise), sans toucher une mission entamée. */
function sansLesDejaOuvertes(id: string, e: EtatVaisseau): EtatVaisseau {
  const chaine = modeleDeVaisseau(id).chaine
  let rang = e.rang
  while (e.progres === 0 && rang < chaine.length && (e.ouvertes.includes(chaine[rang].ouvre) || e.hangar.possedees.includes(chaine[rang].ouvre))) rang += 1
  return rang === e.rang ? e : { ...e, rang }
}

/** RÉCLAMER la mission terminée d'un vaisseau : sa pièce s'ouvre à l'achat SUR LUI, la suivante commence. Null si elle n'est pas terminée. */
export function reclamerLaMission(f: Flotte, id: string): { flotte: Flotte; ouvre: string } | null {
  const m = missionDe(f, id)
  if (m === null || !m.finie) return null
  const e = f.vaisseaux[id]
  const suivant = sansLesDejaOuvertes(id, { ...e, ouvertes: e.ouvertes.includes(m.mission.ouvre) ? e.ouvertes : [...e.ouvertes, m.mission.ouvre], rang: e.rang + 1, progres: 0 })
  return { flotte: { ...f, vaisseaux: { ...f.vaisseaux, [id]: suivant } }, ouvre: m.mission.ouvre }
}

/**
 * LES ANCIENS NŒUDS « PIÈCE » de la recherche (avant le 14/11, elle ouvrait les pièces pour tout le monde) : une
 * sauvegarde qui les avait débloqués garde ces pièces OUVERTES sur le chasseur — le minerai dépensé n'est pas perdu.
 */
const ANCIENS_NOEUDS: Record<string, string> = {
  'm-foreuse-2': 'foreuse-2', 'm-aimant-1': 'aimant-1', 'm-foreuse-3': 'foreuse-3', 'm-aimant-2': 'aimant-2',
  'c-canon': 'arme-canon', 'c-rafale': 'arme-rafale', 'c-coque-2': 'coque-2', 'c-coque-3': 'coque-3',
  'e-propulseur-2': 'propulseur-2', 'e-radar': 'radar', 'e-propulseur-3': 'propulseur-3',
}

/** Relit un vaisseau gardé, sans confiance : son hangar borné à son modèle, ses pièces ouvertes, sa mission. */
function lireVaisseau(mo: ModeleDeVaisseau, brut: unknown): EtatVaisseau {
  const b = (typeof brut === 'object' && brut !== null ? brut : {}) as { hangar?: unknown; ouvertes?: unknown; rang?: unknown; progres?: unknown }
  const duModele = (h: Hangar): Hangar => {
    const ok = (id: string): boolean => mo.pieces.includes(id)
    return {
      possedees: h.possedees.filter(ok),
      montees: { coque: ok(h.montees.coque) ? h.montees.coque : mo.serie.montees.coque, propulseur: ok(h.montees.propulseur) ? h.montees.propulseur : mo.serie.montees.propulseur },
      outils: h.outils.map((id) => (ok(id) ? id : '')),
      armes: h.armes.map((id) => (ok(id) ? id : '')),
      construites: Object.fromEntries(Object.entries(h.construites ?? {}).filter(([id]) => ok(id))),
    }
  }
  // (deux passes : la première borne aux pièces du modèle, la seconde reborne les listes au châssis resté monté)
  const hangar = lireHangar(duModele(lireHangar(b.hangar, copie(mo.serie))), copie(mo.serie))
  const ouvertes: string[] = []
  if (Array.isArray(b.ouvertes)) for (const id of b.ouvertes) if (typeof id === 'string' && mo.pieces.includes(id) && pieceDe(id) !== undefined && !ouvertes.includes(id)) ouvertes.push(id)
  // (une pièce qu'on a construite reste à construire : perdue jusqu'au dernier exemplaire, elle ne quitte pas la liste)
  for (const id of Object.keys(hangar.construites ?? {})) if (!ouvertes.includes(id)) ouvertes.push(id)
  const rang = typeof b.rang === 'number' && Number.isInteger(b.rang) && b.rang >= 0 ? Math.min(b.rang, mo.chaine.length) : 0
  const cible = mo.chaine[rang]?.cible ?? 0
  const progres = typeof b.progres === 'number' && Number.isFinite(b.progres) && b.progres > 0 ? Math.min(cible, b.progres) : 0
  return sansLesDejaOuvertes(mo.id, { hangar, ouvertes, rang, progres })
}

/**
 * Relit une flotte gardée, sans confiance. `ancienHangar` et `anciensNoeuds` : une sauvegarde d'avant la flotte — son
 * hangar devient celui du chasseur (ce qu'il ne peut pas porter tombe), les pièces que sa recherche avait ouvertes
 * le restent sur lui. `debloques` : les vaisseaux que la recherche a débloqués (ils sont dans la flotte, quoi que
 * dise la sauvegarde).
 */
export function lireFlotte(brut: unknown, debloques: string[] = [], ancienHangar?: unknown, anciensNoeuds: string[] = []): Flotte {
  let f = flotteNeuve()
  if (typeof brut === 'object' && brut !== null) {
    const b = brut as { actif?: unknown; vaisseaux?: unknown }
    const v = (typeof b.vaisseaux === 'object' && b.vaisseaux !== null ? b.vaisseaux : {}) as Record<string, unknown>
    const vaisseaux: Record<string, EtatVaisseau> = {}
    for (const mo of MODELES) if (mo.id === MODELES[0].id || v[mo.id] !== undefined) vaisseaux[mo.id] = lireVaisseau(mo, v[mo.id])
    f = { actif: typeof b.actif === 'string' && vaisseaux[b.actif] !== undefined ? b.actif : MODELES[0].id, vaisseaux }
  } else if (ancienHangar !== undefined) {
    const mo = MODELES[0]
    const ouvertes = anciensNoeuds.map((n) => ANCIENS_NOEUDS[n]).filter((id): id is string => id !== undefined && mo.pieces.includes(id))
    f = { actif: mo.id, vaisseaux: { [mo.id]: lireVaisseau(mo, { hangar: ancienHangar, ouvertes }) } }
  }
  for (const id of debloques) f = ajouterLeVaisseau(f, id)
  return f
}

/** Ce qu'une pièce coûte en minerai (rien, si elle ne le dit pas). */
export const coutEnMinerai = (piece: string): Cargaison => {
  const c = pieceDe(piece)?.cout
  const r = {} as Cargaison
  for (const k of MINERAIS) r[k] = c?.[k] ?? 0
  return r
}

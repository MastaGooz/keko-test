/**
 * LES QUÊTES (Keko, 11/11 : « j'ai envie d'implanter un nouvel onglet quêtes en plus de hangar / tech / commerce »).
 *
 * Tranché par Keko :
 * - AU DÉBUT, LES QUÊTES SERVENT DE TUTORIEL (« premier vol, unlock de l'onglet commerce, puis tech, etc. ») : une
 *   suite fixe, une quête à la fois ; certaines OUVRENT UN ONGLET quand on réclame leur récompense ;
 * - LE TUTORIEL FINI, elles sont tirées au hasard dans un catalogue, « mais avec toujours une quête de chaque type
 *   (minage, exploration, combat, commerce) active » : quatre à la fois, celle qu'on réclame est remplacée par une
 *   autre de la même activité ;
 * - elles avancent TOUTES EN PARALLÈLE, sans rien choisir avant de décoller ;
 * - la récompense est en CRÉDITS, principalement ; la difficulté est FIXE pour l'instant.
 *
 * Une quête compte quelque chose (un COMPTEUR : des vols, du fer extrait, des rivaux abattus…) jusqu'à une cible. La
 * page dit ce qui se passe (`noter`), la règle fait avancer les quêtes qui comptent cela ; les unes s'ajoutent, les
 * autres gardent le plus grand (une distance atteinte). Le hasard est un tirage seedé : l'état porte son numéro.
 *
 * *Les intitulés, les cibles et les récompenses sont de moi, à rejuger.* La règle est pure : l'état est une valeur.
 */
import { hache } from './jeu.ts'

export const ACTIVITES = ['minage', 'combat', 'exploration', 'commerce'] as const
export type Activite = (typeof ACTIVITES)[number]

/** Ce qu'une quête peut compter. */
export type Compteur =
  /** Les décollages. */
  | 'vols'
  /** Les extractions réussies (revenu à quai jusqu'au bout du compte). */
  | 'extractions'
  /** Les pépites ramassées en vol (pas encore extraites). */
  | 'ramassees'
  /** Les pépites extraites, toutes ensemble ou par minerai. */
  | 'pepites'
  | 'fer'
  | 'or'
  | 'cristal'
  /** Les rivaux abattus. */
  | 'rivaux'
  /** La distance à la base (on garde la plus grande atteinte). */
  | 'distance'
  /** Le chemin parcouru. */
  | 'parcouru'
  /** Les crédits gagnés à vendre. */
  | 'ventes'
  /** Les ordres posés, les ordres réglés. */
  | 'ordresPoses'
  | 'ordresRegles'
  /** Les nœuds débloqués à la tech. */
  | 'noeuds'
/** Les compteurs dont on garde LE PLUS GRAND au lieu d'additionner. */
const AU_PLUS_GRAND: Compteur[] = ['distance']

/** Un onglet qu'une quête du tutoriel ouvre (les identifiants des vues de la page). */
export type OngletOuvert = 'entrepot' | 'labo'

/** UNE ÉTAPE d'une mission à étapes : ce qu'elle demande, ce qu'elle compte, combien. */
export type Etape = { dit: string; compteur: Compteur; cible: number }

export type Modele = {
  id: string
  /** Son activité (une quête du catalogue) ; le tutoriel n'en a pas. */
  activite?: Activite
  titre: string
  dit: string
  compteur: Compteur
  cible: number
  /** La récompense, en crédits. */
  credits: number
  /** L'onglet que sa récompense ouvre (le tutoriel). */
  ouvre?: OngletOuvert
  /**
   * SES ÉTAPES, s'il y en a (Keko, 12/11 : « diviser la première quête en 3 étapes avec validation animée à chaque
   * étape faite ») : chacune compte de son côté ; la mission est terminée quand toutes le sont. `compteur` ne sert
   * alors pas, `cible` vaut leur nombre et l'avancée de la mission est le nombre d'étapes faites.
   */
  etapes?: Etape[]
  /** La mécanique de la recherche sans laquelle elle est infaisable : elle n'est pas tirée tant qu'on ne l'a pas. */
  exige?: string
}

/** LE TUTORIEL : une quête à la fois, dans cet ordre. */
export const TUTORIEL: Modele[] = [
  // (LA PREMIÈRE : SORTIR ET S'EXTRAIRE AVEC DU MINERAI, au moins une pépite — Keko, 12/11 ; d'abord un décollage, puis
  // un aller-retour à vide suivi d'une seconde mission pour le minerai : les deux n'en font plus qu'une, qui ouvre le commerce)
  {
    id: 't-vol', titre: 'Première expédition', dit: 'Votre première sortie, en trois temps.', compteur: 'pepites', cible: 3, credits: 20, ouvre: 'entrepot',
    etapes: [
      { dit: 'Partez en expédition', compteur: 'vols', cible: 1 },
      { dit: 'Minez du minerai', compteur: 'ramassees', cible: 1 },
      { dit: 'Extrayez-le à la base', compteur: 'pepites', cible: 1 },
    ],
  },
  { id: 't-vente', titre: 'Première vente', dit: 'Vendez du minerai au Commerce.', compteur: 'ventes', cible: 1, credits: 30, ouvre: 'labo' },
  { id: 't-recherche', titre: 'Recherche', dit: 'Débloquez un noeud à la Recherche.', compteur: 'noeuds', cible: 1, credits: 40 },
  // (« Premier ordre » est sorti du tutoriel le 12/11 : les ordres à prix fixé se débloquent à la recherche)
]

/** LE CATALOGUE d'après le tutoriel : une de chaque activité est toujours active. */
export const CATALOGUE: Modele[] = [
  { id: 'm-fer', activite: 'minage', titre: 'Cargaison de fer', dit: 'Extrayez 30 pépites de fer.', compteur: 'fer', cible: 30, credits: 40 },
  { id: 'm-or', activite: 'minage', titre: 'Filon d’or', dit: 'Extrayez 10 pépites d’or.', compteur: 'or', cible: 10, credits: 80 },
  { id: 'm-cristal', activite: 'minage', titre: 'Éclats de cristal', dit: 'Extrayez 4 cristaux.', compteur: 'cristal', cible: 4, credits: 100 },
  { id: 'm-gros', activite: 'minage', titre: 'Grosse campagne', dit: 'Extrayez 60 pépites, tous minerais confondus.', compteur: 'pepites', cible: 60, credits: 90 },
  { id: 'c-rival', activite: 'combat', titre: 'Chasse au rival', dit: 'Abattez un rival.', compteur: 'rivaux', cible: 1, credits: 60 },
  { id: 'c-rivaux', activite: 'combat', titre: 'Nettoyage', dit: 'Abattez 3 rivaux.', compteur: 'rivaux', cible: 3, credits: 150 },
  { id: 'e-loin', activite: 'exploration', titre: 'Reconnaissance', dit: 'Éloignez-vous à 700 de la base.', compteur: 'distance', cible: 700, credits: 50 },
  { id: 'e-confins', activite: 'exploration', titre: 'Aux confins', dit: 'Éloignez-vous à 1 200 de la base.', compteur: 'distance', cible: 1200, credits: 90 },
  { id: 'e-route', activite: 'exploration', titre: 'Long courrier', dit: 'Parcourez 6 000 en vol.', compteur: 'parcouru', cible: 6000, credits: 60 },
  { id: 'e-retours', activite: 'exploration', titre: 'Allers-retours', dit: 'Réussissez 3 extractions.', compteur: 'extractions', cible: 3, credits: 70 },
  { id: 'k-ventes', activite: 'commerce', titre: 'Petit négoce', dit: 'Vendez pour 150 crédits.', compteur: 'ventes', cible: 150, credits: 40 },
  { id: 'k-grosses', activite: 'commerce', titre: 'Gros négoce', dit: 'Vendez pour 400 crédits.', compteur: 'ventes', cible: 400, credits: 100 },
  { id: 'k-ordre', activite: 'commerce', titre: 'Ordre honoré', dit: 'Faites aboutir un ordre à prix fixé.', compteur: 'ordresRegles', cible: 1, credits: 60, exige: 'ordres' },
]

export const modeleDe = (id: string): Modele | undefined => TUTORIEL.find((q) => q.id === id) ?? CATALOGUE.find((q) => q.id === id)

/** Une quête en cours : son modèle, et où elle en est (jamais plus que sa cible). */
export type Quete = { modele: string; progres: number; /** L'avancée de chaque étape, pour une mission à étapes. */ pas?: number[] }
/**
 * L'état : l'ÉTAPE du tutoriel (son rang ; au-delà de la dernière, il est fini), les quêtes actives (une pendant le
 * tutoriel, une par activité ensuite), et le numéro du prochain tirage.
 */
export type EtatQuetes = { etape: number; actives: Quete[]; tirage: number }

export const tutorielFini = (e: EtatQuetes): boolean => e.etape >= TUTORIEL.length

/** Dit si une mécanique de la recherche est acquise (injecté par la page ; par défaut, tout l'est). */
export type Acquis = (mecanique: string) => boolean
const TOUT_ACQUIS: Acquis = () => true

/** Tire une quête du catalogue pour une activité, autre que `sauf` s'il y a le choix — jamais une quête qui EXIGE une mécanique qu'on n'a pas. */
function tirer(a: Activite, tirage: number, sauf?: string, acquis: Acquis = TOUT_ACQUIS): Quete {
  const toutes = CATALOGUE.filter((q) => q.activite === a && (q.exige === undefined || acquis(q.exige)))
  const choix = toutes.filter((q) => q.id !== sauf)
  const liste = choix.length > 0 ? choix : toutes
  return { modele: liste[hache(tirage, ACTIVITES.indexOf(a), 31) % liste.length].id, progres: 0 }
}

/** Des quêtes neuves : la première du tutoriel. */
export const quetesNeuves = (): EtatQuetes => ({ etape: 0, actives: [{ modele: TUTORIEL[0].id, progres: 0 }], tirage: 1 })
/** Le tutoriel passé (une sauvegarde d'avant les quêtes, qui a déjà joué) : une quête par activité. */
export function quetesSansTutoriel(tirage = 1, acquis: Acquis = TOUT_ACQUIS): EtatQuetes {
  return { etape: TUTORIEL.length, actives: ACTIVITES.map((a, i) => tirer(a, tirage + i, undefined, acquis)), tirage: tirage + ACTIVITES.length }
}

/** Les étapes d'une mission à étapes : faite ou non, dans l'ordre (vide pour une mission ordinaire). */
export function etapesFaites(q: Quete): boolean[] {
  const mo = modeleDe(q.modele)
  return mo?.etapes === undefined ? [] : mo.etapes.map((et, j) => (q.pas?.[j] ?? 0) >= et.cible)
}
export const estTerminee = (q: Quete): boolean => q.progres >= (modeleDe(q.modele)?.cible ?? Infinity)
/** Les onglets que le tutoriel a déjà ouverts (tous, une fois fini). */
export function ongletOuvert(e: EtatQuetes, o: OngletOuvert): boolean {
  const rang = TUTORIEL.findIndex((q) => q.ouvre === o)
  return rang < 0 || e.etape > rang
}

/**
 * IL S'EST PASSÉ QUELQUE CHOSE : `valeur` de ce compteur. Les quêtes actives qui le comptent avancent (ou gardent le
 * plus grand), sans dépasser leur cible. Rend le même état si rien ne bouge.
 */
export function noter(e: EtatQuetes, compteur: Compteur, valeur: number): EtatQuetes {
  if (!(valeur > 0)) return e
  let change = false
  const actives = e.actives.map((q) => {
    const mo = modeleDe(q.modele)
    if (mo !== undefined && mo.etapes !== undefined) {
      // (une mission à étapes : chaque étape compte de son côté ; l'avancée de la mission est le nombre d'étapes faites)
      const pas = mo.etapes.map((_, j) => q.pas?.[j] ?? 0)
      let bouge = false
      mo.etapes.forEach((et, j) => {
        if (et.compteur !== compteur || pas[j] >= et.cible) return
        const v = Math.min(et.cible, AU_PLUS_GRAND.includes(compteur) ? Math.max(pas[j], valeur) : pas[j] + valeur)
        if (v !== pas[j]) {
          pas[j] = v
          bouge = true
        }
      })
      if (!bouge) return q
      change = true
      return { ...q, pas, progres: mo.etapes.filter((et, j) => pas[j] >= et.cible).length }
    }
    if (mo === undefined || mo.compteur !== compteur || q.progres >= mo.cible) return q
    const progres = Math.min(mo.cible, AU_PLUS_GRAND.includes(compteur) ? Math.max(q.progres, valeur) : q.progres + valeur)
    if (progres === q.progres) return q
    change = true
    return { ...q, progres }
  })
  return change ? { ...e, actives } : e
}

/**
 * RÉCLAMER la récompense de la quête active n° `i`, si elle est terminée : les crédits, et l'onglet qu'elle ouvre.
 * Pendant le tutoriel, la quête suivante prend sa place — la dernière réclamée, une quête par activité arrive ;
 * ensuite, une autre quête de la même activité la remplace. Null si elle n'est pas terminée.
 */
export function reclamer(e: EtatQuetes, i: number, credits: number, acquis: Acquis = TOUT_ACQUIS): { etat: EtatQuetes; credits: number; ouvre?: OngletOuvert } | null {
  const q = e.actives[i]
  const mo = q === undefined ? undefined : modeleDe(q.modele)
  if (q === undefined || mo === undefined || !estTerminee(q)) return null
  const gain = credits + mo.credits
  if (!tutorielFini(e)) {
    const etape = e.etape + 1
    if (etape >= TUTORIEL.length) return { etat: quetesSansTutoriel(e.tirage, acquis), credits: gain, ouvre: mo.ouvre }
    return { etat: { ...e, etape, actives: [{ modele: TUTORIEL[etape].id, progres: 0 }] }, credits: gain, ouvre: mo.ouvre }
  }
  const actives = e.actives.map((x, k) => (k === i && mo.activite !== undefined ? tirer(mo.activite, e.tirage, mo.id, acquis) : x))
  return { etat: { ...e, actives, tirage: e.tirage + 1 }, credits: gain }
}

/**
 * Relit des quêtes gardées, sans confiance. Rien de gardé : des quêtes neuves — ou, si `dejaJoue` (une sauvegarde
 * d'avant les quêtes qui a déjà de la progression), le tutoriel passé. Pendant le tutoriel, la quête active est celle
 * de l'étape ; ensuite, il en faut une par activité (celles qui manquent sont tirées).
 */
export function lireQuetes(brut: unknown, dejaJoue: boolean, acquis: Acquis = TOUT_ACQUIS): EtatQuetes {
  if (typeof brut !== 'object' || brut === null) return dejaJoue ? quetesSansTutoriel(1, acquis) : quetesNeuves()
  const b = brut as { etape?: unknown; actives?: unknown; tirage?: unknown }
  const etape = typeof b.etape === 'number' && Number.isInteger(b.etape) && b.etape >= 0 ? Math.min(b.etape, TUTORIEL.length) : 0
  const tirage = typeof b.tirage === 'number' && Number.isInteger(b.tirage) && b.tirage >= 1 ? b.tirage : 1
  const lues: Quete[] = []
  if (Array.isArray(b.actives)) {
    for (const x of b.actives as Record<string, unknown>[]) {
      if (typeof x !== 'object' || x === null || typeof x.modele !== 'string') continue
      const mo = modeleDe(x.modele)
      if (mo === undefined) continue
      if (mo.etapes !== undefined) {
        const brutes = Array.isArray(x.pas) ? (x.pas as unknown[]) : []
        const pas = mo.etapes.map((et, j) => {
          const v = brutes[j]
          return typeof v === 'number' && Number.isFinite(v) && v > 0 ? Math.min(et.cible, v) : 0
        })
        lues.push({ modele: mo.id, pas, progres: mo.etapes.filter((et, j) => pas[j] >= et.cible).length })
        continue
      }
      const pr = typeof x.progres === 'number' && Number.isFinite(x.progres) && x.progres > 0 ? Math.min(mo.cible, x.progres) : 0
      lues.push({ modele: mo.id, progres: pr })
    }
  }
  if (etape < TUTORIEL.length) {
    const q = lues.find((x) => x.modele === TUTORIEL[etape].id)
    return { etape, actives: [q ?? { modele: TUTORIEL[etape].id, progres: 0 }], tirage }
  }
  let t = tirage
  const actives = ACTIVITES.map((a) => lues.find((x) => modeleDe(x.modele)?.activite === a) ?? tirer(a, t++, undefined, acquis))
  return { etape, actives, tirage: t }
}

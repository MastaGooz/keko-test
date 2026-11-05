/**
 * LE DONJON COOPÉRATIF À L'ÉCRAN — `?donjon`.
 *
 * Du DOM simple, sans React ni three. L'ennemi est une carte du pool
 * orc/gobelin debout sur le camp de sa race, dans une scène de hauteur bornée
 * (Keko : « l'ennemi prend trop de place »). Sous lui, son nom et ses PV,
 * puis le bouton carré « Attaquer » (Keko : « un bouton d'attaque plutôt que
 * tap sur le monstre »), le niveau et, tout en bas, la dernière nouvelle.
 * Les améliorations (une tape sur le niveau), le classement, le journal entier
 * et les réglages (vitesse, recommencer) s'ouvrent en feuille.
 *
 * Retour au doigt (Keko : « plus juicy et visibles ») : le bouton s'enfonce,
 * l'ennemi blanchit et recule sous une onde de choc et ses particules, le
 * chiffre jaillit de lui, cerné d'encre, d'autant plus gros qu'il est grand. L'AUTO
 * frappe dès le début, par coups : le contour du bouton s'éclaire jusqu'au
 * prochain, et quand il est complet le coup part, son chiffre (bleu) jaillit
 * de l'ennemi. Pas de son.
 *
 * *Toutes les règles sont dans `logic/donjon/`* ; ici on lit l'horloge, on
 * joue les bots à leur heure et on dessine. Le joueur passe par `agir`, comme
 * eux. `&neuf` oublie la saison de cet appareil.
 */
import './donjon.css'
import { botsInitiaux, jouerLesBots, type EtatDesBots } from '../../logic/donjon/bots.ts'
import { AMELIORATIONS, ARMES, DONJON, JOUR, type ArmeAPassif, type CleAmelioration, type CleCapacite, type Equipement, type RareteArme, type TypeArme } from '../../logic/donjon/config.ts'
import { changerDeVitesse, nouvelleHorloge, tempsDeJeu, type Horloge } from '../../logic/donjon/horloge.ts'
import { portraitDeLEtage } from '../../logic/donjon/ennemi.ts'
import { etatPartageLocal } from '../../logic/donjon/partage.ts'
import {
  autoCritique,
  avanceeDeCapacite,
  bonusDEffetsA,
  bonusDeForme,
  bonusDeVitesse,
  bonusDuCoup,
  bornesDeLaForme,
  capacitePrete,
  capacitesDe,
  chanceCritDe,
  coupsAutoA,
  degatsDuCoupAuto,
  degatsDuCoupAutoA,
  dpsEffectifDe,
  degatsDuTap,
  effetEnCours,
  etapeDuPassif,
  evenementA,
  facteurCritMoyen,
  etatInitial,
  formeA,
  jourDeLaSaison,
  multCritDe,
  multiplicateurDeForme,
  passifDe,
  passifOuvert,
  periodeDe,
  rechargeDe,
  tapPret,
  xpPourNiveau,
} from '../../logic/donjon/regles.ts'
import type { EtatDonjon, Evenement, Joueur } from '../../logic/donjon/types.ts'
import type { EvenementDuPassif } from '../../logic/donjon/regles.ts'
import { NOM_DE_LA_RACE, NOM_DU_ROLE, type CarteEmoji } from '../../logic/emoji/types.ts'
import { chargerEmojis } from '../emoji.ts'
import { ecrireLeDonjon, lireLeDonjon, oublierLeDonjon } from './stockage.ts'

const C = DONJON
const MOI = 'vous'
const NOM_DU_JOUEUR = 'Vous'
const VERSION = encodeURIComponent(__BUILD_TIME__)
const url = (chemin: string) => `${import.meta.env.BASE_URL}${chemin}?v=${VERSION}`

// ---------------------------------------------------------------- les mots

function nombre(n: number): string {
  const virgule = (x: number, d: number) => x.toFixed(d).replace('.', ',')
  if (n >= 1e12) return `${virgule(n / 1e12, 2)} T`
  if (n >= 1e9) return `${virgule(n / 1e9, 2)} G`
  if (n >= 1e6) return `${virgule(n / 1e6, 2)} M`
  if (n >= 1e4) return `${virgule(n / 1e3, 1)} k`
  if (n >= 100) return String(Math.floor(n))
  return virgule(n, n < 10 && n % 1 !== 0 ? 1 : 0)
}

const pourcent = (x: number) => `${Math.round(x * 100)} %`
/** Un pourcentage à un chiffre après la virgule : « 6,9 % ». */
const pourcentFin = (x: number) => `${(x * 100).toFixed(1).replace('.', ',')} %`
/** Une borne de la plage de dégâts, en entier comme les coups (abrégée au-delà de 10 000). */
const borne = (n: number) => (n < 1e4 ? String(Math.round(n)) : nombre(n))
/** Un bonus : « +30 % », « +0 % ». */
const bonus = (x: number) => `+${Math.round(x * 100)} %`

/** Une durée courte en secondes, à trois décimales au plus : « 2,5 s », « 0,175 s », « 2,0 s ». */
const secondes = (ms: number) => {
  const texte = (ms / 1000).toFixed(3).replace(/0+$/, '')
  return `${(texte.endsWith('.') ? `${texte}0` : texte).replace('.', ',')} s`
}

function duree(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000))
  const j = Math.floor(s / 86400)
  const h = Math.floor((s % 86400) / 3600)
  const m = Math.floor((s % 3600) / 60)
  if (j > 0) return `${j} j ${h} h`
  if (h > 0) return `${h} h ${String(m).padStart(2, '0')} min`
  return `${m} min ${String(s % 60).padStart(2, '0')} s`
}

function heureDeJeu(etat: EtatDonjon, t: number): string {
  const dans = Math.max(0, t - etat.saison.debut)
  const jour = Math.floor(dans / JOUR) + 1
  const minutes = Math.floor((dans % JOUR) / 60000)
  return `J${jour} ${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`
}

function phrase(etat: EtatDonjon, ev: Evenement): string {
  const moi = ev.joueur === MOI
  const nom = etat.joueurs.find((j) => j.id === ev.joueur)?.nom ?? '?'
  switch (ev.type) {
    case 'debut':
      return `La saison ${ev.saison} commence.`
    case 'fin':
      return `La saison ${ev.saison} s'achève à l'étage ${ev.etage}.`
    case 'entree':
      return moi ? 'Vous entrez dans le donjon' : `${nom} entre dans le donjon`
    case 'niveau':
      return moi ? `Vous passez niveau ${ev.niveau}` : `${nom} passe niveau ${ev.niveau}`
    case 'kill':
      return moi ? `Vous avez achevé l'ennemi de l'étage ${ev.etage}` : `${nom} a achevé l'ennemi de l'étage ${ev.etage}`
  }
}

/**
 * LES CINQ STATS à l'écran : un nom, ce qu'elles font, leur valeur EN %
 * (Keko : « on exprime en % plutôt qu'en chiffre absolu »), bonus d'arme
 * compris pour la Critique, la Force et la Récupération.
 */
const CHOIX: Record<CleAmelioration, { nom: string; role: string; valeur: (j: Joueur) => string }> = {
  tap: { nom: 'Dégâts', role: 'Les dégâts de chaque coup, tap ou auto', valeur: (j) => bonus(bonusDuCoup(C, j)) },
  vitesse: { nom: 'Vitesse', role: "Le tap et l'auto frappent plus vite", valeur: (j) => bonus(bonusDeVitesse(C, j)) },
  chanceCrit: { nom: 'Critique', role: 'La chance de frapper un coup critique', valeur: (j) => pourcentFin(chanceCritDe(C, j)) },
  multCrit: { nom: 'Dégâts critiques', role: "Ce que multiplie un coup critique", valeur: (j) => pourcent(multCritDe(C, j)) },
  recuperation: { nom: 'Récupération', role: 'La fatigue passe et le repos vient plus vite', valeur: (j) => bonus(bonusDeForme(C, j, 'recuperation')) },
}

/**
 * LES ARMES À L'ÉCRAN (Keko : « une interface intégrée pour changer d'arme
 * plutôt que dans le menu debug, avec une image d'arme ») : leur image, leur
 * caractère, leur bonus. Les images viennent du tri de Keko (`Desktop\\Style
 * \\tri`) : l'épée est l'objet n° 010 ; la dague la capacité n° 119 ; le
 * bâton, faute d'image de bâton, la capacité n° 116 (la magie) — à remplacer ;
 * les mains nues, la capacité n° 118 (le coup de pied), en attendant leur icône ;
 * l'arc, la capacité n° 117 (l'arc et la cible), l'épée à deux mains, la
 * n° 109 (l'épée dans sa traînée de feu), et les deux haches, la n° 123 (la
 * hache dans son anneau de feu ; la seule hache du tri), et les deux
 * massues, la n° 115 (le poing de pierre qui écrase ; pas de massue dans le
 * tri), la lance, la n° 124 (le trident à la corde), et les deux marteaux, la
 * n° 127 (la roche qui éclate ; le seul marteau du tri est celui d'un
 * personnage), et l'arbalète, la n° 110 (la silhouette qui décoche un trait ;
 * pas d'arbalète dans le tri), et le pistolet, la n° 144 (le trait qui finit en
 * éclat ; pas d'arme à feu dans le tri) — le mousquet aussi —, et la rapière,
 * la n° 107 (l'épée fine à l'étoile), et le fouet et le fléau, la n° 135 (la
 * silhouette enchaînée ; ni fouet ni fléau dans le tri), provisoires elles aussi.
 */
const IMAGE_DE_L_ARME: Record<Equipement, string> = {
  mains: 'armes/mains.webp',
  epee: 'armes/epee.webp',
  dague: 'armes/dague.webp',
  baton: 'armes/baton.webp',
  arc: 'armes/arc.webp',
  deuxMains: 'armes/deux-mains.webp',
  hache: 'armes/hache.webp',
  hacheDeuxMains: 'armes/hache.webp',
  massue: 'armes/massue.webp',
  massueDeuxMains: 'armes/massue.webp',
  lance: 'armes/lance.webp',
  marteau: 'armes/marteau.webp',
  marteauDeuxMains: 'armes/marteau.webp',
  arbalete: 'armes/arbalete.webp',
  pistolet: 'armes/pistolet.webp',
  mousquet: 'armes/pistolet.webp',
  rapiere: 'armes/rapiere.webp',
  fouet: 'armes/chaine.webp',
  fleau: 'armes/chaine.webp',
}
const DIT_L_ARME: Record<TypeArme, { caractere: string; bonus: string }> = {
  epee: { caractere: 'Équilibrée', bonus: 'Récupération +20 %' },
  dague: { caractere: 'Rapide', bonus: 'Critique +5 points' },
  baton: { caractere: 'Lent', bonus: 'Dégâts critiques +50 %' },
  arc: { caractere: 'À distance', bonus: "Aucun pour l'instant" },
  deuxMains: { caractere: 'Lourde', bonus: "Aucun pour l'instant" },
  hache: { caractere: 'Brutale', bonus: "Aucun pour l'instant" },
  hacheDeuxMains: { caractere: 'Massive', bonus: "Aucun pour l'instant" },
  massue: { caractere: 'Écrasante', bonus: "Aucun pour l'instant" },
  massueDeuxMains: { caractere: 'Colossale', bonus: "Aucun pour l'instant" },
  lance: { caractere: 'Perçante', bonus: "Aucun pour l'instant" },
  marteau: { caractere: 'Accablant', bonus: "Aucun pour l'instant" },
  marteauDeuxMains: { caractere: 'Titanesque', bonus: "Aucun pour l'instant" },
  arbalete: { caractere: 'Puissante', bonus: "Aucun pour l'instant" },
  pistolet: { caractere: 'Détonante', bonus: "Aucun pour l'instant" },
  mousquet: { caractere: 'Fracassante', bonus: "Aucun pour l'instant" },
  rapiere: { caractere: 'Précise', bonus: "Aucun pour l'instant" },
  fouet: { caractere: 'Cinglant', bonus: "Aucun pour l'instant" },
  fleau: { caractere: 'Implacable', bonus: "Aucun pour l'instant" },
}

/**
 * LES CAPACITÉS À L'ÉCRAN : leur image, du tri de Keko (`Desktop\Style\tri
 * \capacites`, prises détourées dans `images-alpha`, rognées, 256 carré) —
 * Frappe lourde n° 112, Brise-garde n° 122, Lames de l'ombre n° 105, Furie
 * n° 132, Boule de feu n° 101, Méditation n° 131.
 */
const IMAGE_DE_LA_CAPACITE: Record<CleCapacite, string> = {
  frappeLourde: 'capacites/frappe-lourde.webp',
  briseGarde: 'capacites/brise-garde.webp',
  lamesOmbre: 'capacites/lames-ombre.webp',
  furie: 'capacites/furie.webp',
  bouleDeFeu: 'capacites/boule-de-feu.webp',
  meditation: 'capacites/meditation.webp',
}

/** Des secondes rondes : « 20 s », l'unité jamais seule à la ligne. */
const secondesRondes = (ms: number) => `${Math.round(ms / 1000)}\u00a0s`

/** Ce que fait une capacité, en une phrase lue dans sa config. */
function effetDeLaCapacite(cle: CleCapacite): string {
  const c = C.capacites[cle]
  if (c.coup !== undefined) return `Un coup à ×${c.coup} les dégâts du tap`
  if (c.bonus !== undefined) return `+${Math.round(c.bonus * 100)} % à tous vos coups pendant ${secondesRondes(c.duree ?? 0)}`
  if (c.critique === true) return `Chaque tap est critique pendant ${secondesRondes(c.duree ?? 0)}`
  if (c.forme !== undefined) return `La forme remonte de ${c.forme} min de spam vers le repos`
  return ''
}

/** Quand elle est prête : sa recharge, ou sa condition. */
function quandLaCapacite(cle: CleCapacite): string {
  const c = C.capacites[cle]
  return c.critiques !== undefined ? `après ${c.critiques} critiques` : `toutes les ${secondesRondes(c.recharge ?? 0)}`
}

/**
 * L'ICÔNE DU PASSIF (Keko : « une icône, comme les capacités, pour que les
 * joueurs l'identifient rapidement »), du tri de Keko, détourée, 256 carré :
 * Riposte n° 111 (le bouclier qui pare), Points faibles n° 138 (l'œil),
 * Runes n° 141 (les cristaux).
 */
const IMAGE_DU_PASSIF: Record<ArmeAPassif, string> = { epee: 'passifs/riposte.webp', dague: 'passifs/points-faibles.webp', baton: 'passifs/runes.webp' }

/** Ce que fait le passif d'une classe d'arme, en une phrase. */
function effetDuPassif(arme: ArmeAPassif): string {
  const p = C.passifs[arme]
  if (arme === 'epee') return `L'ennemi arme parfois un coup : touchez-le dans la seconde pour riposter (×${p.coup})`
  if (arme === 'dague') return `Des points faibles s'allument sur l'ennemi : touchés, un coup critique (×${p.coup}) et un cran de Furie`
  return `${p.cibles} runes apparaissent : touchées dans l'ordre, elles explosent (×${p.coup}) ; une erreur les efface`
}

/** Une ligne de bulle : un nom, une valeur. */
const ligneDeBulle = (nom: string, valeur: string) => `<div class="donjon-bulle-ligne"><span>${nom}</span><b>${valeur}</b></div>`

/** Les crans des armes, nommés et colorés comme les cartes. */
const RARETE: Record<RareteArme, { nom: string; couleur: string }> = {
  commune: { nom: 'Commune', couleur: '#d9d2c3' },
  peuCommune: { nom: 'Peu commune', couleur: '#6cc04a' },
  rare: { nom: 'Rare', couleur: '#4b92e6' },
  epique: { nom: 'Épique', couleur: '#a861e6' },
  legendaire: { nom: 'Légendaire', couleur: '#f39a2b' },
}

/** La grille de l'armurerie : des rangées de quatre, deux au moins (des places vides). */
const GRILLE = { colonnes: 4, casesMin: 8 }

/** Une place de l'inventaire : une arme, et son cran. */
type Possedee = { arme: TypeArme; rarete: RareteArme }

/**
 * L'INVENTAIRE D'ARMES. Pour l'instant, les trois armes du jeu. `&armes=N`
 * (Keko : « fais un test avec 15 armes dans l'inventaire ») en montre N, les
 * trois en boucle, le cran montant tous les trois (15 = les trois armes dans
 * les cinq crans) — pour juger la grille, le cran n'y change pas les chiffres.
 */
function inventaireDArmes(parametres: URLSearchParams): Possedee[] {
  const n = Number(parametres.get('armes'))
  if (!parametres.has('armes') || !Number.isInteger(n) || n < 1) return ARMES.map((arme) => ({ arme, rarete: C.armes[arme].rarete }))
  const crans = Object.keys(RARETE) as RareteArme[]
  return Array.from({ length: Math.min(n, 60) }, (_, k) => ({ arme: ARMES[k % ARMES.length], rarete: crans[Math.floor(k / ARMES.length) % crans.length] }))
}

function auRangSuivant(j: Joueur, quoi: CleAmelioration): Joueur {
  return { ...j, ameliorations: { ...j.ameliorations, [quoi]: j.ameliorations[quoi] + 1 } }
}

// ---------------------------------------------------------------- le DOM

function el<K extends keyof HTMLElementTagNameMap>(tag: K, classe?: string, texte?: string): HTMLElementTagNameMap[K] {
  const n = document.createElement(tag)
  if (classe !== undefined) n.className = classe
  if (texte !== undefined) n.textContent = texte
  return n
}

function bouton(classe: string, texte?: string): HTMLButtonElement {
  const b = el('button', classe, texte)
  b.type = 'button'
  return b
}

const ICONE_TROPHEE =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 4h8v5a4 4 0 0 1-8 0z"/><path d="M8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4"/><path d="M12 13v4M8 20h8M9.5 17h5"/></svg>'
const ICONE_REGLAGES =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7h10M18 7h2M4 17h2M10 17h10"/><circle cx="16" cy="7" r="2"/><circle cx="8" cy="17" r="2"/></svg>'

const ICONE_EPEE =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 3.5H20v5.5L9 20l-5.5-5.5z"/><path d="M5.5 12.5l6 6M3 21l3.5-3.5"/></svg>'

/** Les couleurs des chiffres de dégâts, en RVB : la seule place où elles sont écrites. */
const TEINTES = {
  normal: [255, 255, 255],
  repos: [255, 222, 70],
  critique: [255, 140, 40],
  fatigue: [150, 150, 150],
}

/** La part de teinte dès qu'on est en fatigue ou en repos, si peu que ce soit. */
const TEINTE_MIN = 0.4

/** La taille des chiffres de dégâts, en rem : `min` jusqu'à 1, + `parDecade` par facteur 10. */
const TAILLE = { min: 1.3, parDecade: 0.45, max: 4 }

/** Le contour du bouton d'attaque, du milieu du haut, dans le sens des aiguilles. */
const CONTOUR = 'M50,3 H82 A15,15 0 0 1 97,18 V82 A15,15 0 0 1 82,97 H18 A15,15 0 0 1 3,82 V18 A15,15 0 0 1 18,3 Z'

/**
 * L'ICÔNE DU BOUTON D'ATTAQUE : une capacité du tri de Keko (Keko : « les
 * images qu'on avait triées », `Desktop\Style\tri\capacites`), la n° 109,
 * l'épée qui tranche dans les flammes — rognée au dessin depuis sa version
 * détourée (`images-alpha`), 512 carré. `&icone=epee` rend l'épée dessinée.
 */
const ICONE_ATTAQUE = 'capacites/attaque.webp'

type Feuille = 'ameliorations' | 'armes' | 'classement' | 'journal' | 'reglages'

export async function monterDonjon(racine: HTMLElement, build: string): Promise<void> {
  const parametres = new URLSearchParams(location.search)
  if (parametres.has('neuf')) {
    oublierLeDonjon()
    parametres.delete('neuf')
    history.replaceState(null, '', `${location.pathname}?${parametres.toString().replace(/=(&|$)/g, '$1')}`)
  }

  // ------------------------------------------------ l'état
  let sauvegarde = lireLeDonjon()
  if (sauvegarde === null) {
    const seed = Date.now() >>> 0
    sauvegarde = {
      etat: etatInitial(C, seed, 0),
      horloge: nouvelleHorloge(Date.now(), 0, 1),
      bots: botsInitiaux(C, seed, 0),
    }
  }
  let horloge: Horloge = sauvegarde.horloge
  let bots: EtatDesBots = sauvegarde.bots
  let etat: EtatDonjon = sauvegarde.etat
  const maintenant = () => tempsDeJeu(horloge, Date.now())
  const partage = etatPartageLocal(C, etat, maintenant)
  partage.abonner((e) => {
    etat = e
  })
  const debut = etat.t
  for (const p of C.bots.profils) {
    if (!etat.joueurs.some((j) => j.id === p.id)) {
      await partage.agir({ joueur: p.id, t: debut, type: 'rejoindre', nom: p.nom, bot: p.id })
    }
  }
  if (!etat.joueurs.some((j) => j.id === MOI)) {
    await partage.agir({ joueur: MOI, t: debut, type: 'rejoindre', nom: NOM_DU_JOUEUR, bot: null })
  }
  const sauver = () => ecrireLeDonjon({ etat, horloge, bots })
  const moi = (): Joueur => etat.joueurs.find((j) => j.id === MOI)!

  // Le pool des portraits arrive après : d'ici là, le nom engendré.
  let cartes: CarteEmoji[] | null = null
  const carteDe = (etage: number, portrait: number | undefined): CarteEmoji | null =>
    cartes === null ? null : cartes[(portrait ?? etage) % cartes.length]

  // ------------------------------------------------ la page
  racine.replaceChildren()
  const page = el('div', 'donjon')
  racine.append(page)

  // La tête : l'étage (Keko : « en haut avec les infos de saison plutôt que
  // sur le monstre »), la saison, le temps qui reste, deux icônes.
  const tete = el('header', 'donjon-tete')
  const pastilleEtage = el('div', 'donjon-pastille-etage')
  const saison = el('div', 'donjon-saison')
  const reste = el('div', 'donjon-reste')
  const infos = el('div', 'donjon-tete-infos')
  infos.append(saison, reste)
  const boutonClassement = bouton('donjon-icone')
  boutonClassement.innerHTML = ICONE_TROPHEE
  boutonClassement.setAttribute('aria-label', 'Classement')
  const boutonReglages = bouton('donjon-icone')
  boutonReglages.innerHTML = ICONE_REGLAGES
  boutonReglages.setAttribute('aria-label', 'Réglages')
  tete.append(pastilleEtage, infos, boutonClassement, boutonReglages)

  // La scène : le camp, l'ennemi debout dessus. On ne la tape plus : c'est
  // le bouton « Attaquer » qui frappe.
  const scene = el('div', 'donjon-scene')
  const nouveauPortrait = () => {
    const img = el('img', 'donjon-portrait')
    img.alt = ''
    img.draggable = false
    return img
  }
  let portrait = nouveauPortrait()
  scene.append(portrait)

  // Sous la scène : le nom, ce qu'il est, ses PV.
  const fiche = el('section', 'donjon-fiche')
  const nom = el('div', 'donjon-nom')
  const sous = el('div', 'donjon-sous')
  const barre = el('div', 'donjon-barre')
  const pv = el('div', 'donjon-barre-pv')
  const pvTexte = el('span', 'donjon-barre-texte')
  barre.append(pv, pvTexte)
  fiche.append(nom, sous, barre)

  // La dernière nouvelle : une tape ouvre le journal.
  const fil = bouton('donjon-fil')

  // LE NIVEAU EST LE BOUTON DES AMÉLIORATIONS (Keko : « en cas de levelup,
  // on met le bouton du niveau cliquable »). Tant qu'il reste des points, la
  // pastille s'allume et rebondit, et une tape ouvre les quatre choix ; rien
  // n'interrompt les taps. Sans point, la même tape montre les choix éteints.
  const bande = bouton('donjon-bande')
  bande.setAttribute('aria-label', 'Améliorations')
  const niveau = el('span', 'donjon-niveau')
  const xp = el('span', 'donjon-xp')
  const xpPlein = el('span', 'donjon-xp-plein')
  xp.append(xpPlein)
  const points = el('span', 'donjon-points')
  bande.append(niveau, xp, points)

  // LE BOUTON D'ATTAQUE, carré, au milieu de la place qui reste (Keko : « le
  // bouton attaque devrait être carré et le timing auto indiqué par le
  // contour du carré qui s'éclaire et se lance quand il est complet »). Le
  // contour est un tracé qui part du haut et fait le tour, au rythme de l'auto.
  const arene = el('div', 'donjon-arene')
  const cadre = el('div', 'donjon-attaque-cadre')
  const attaque = bouton('donjon-attaque')
  attaque.setAttribute('aria-label', 'Attaquer')
  if (parametres.get('icone') === 'epee') {
    attaque.innerHTML = ICONE_EPEE
  } else {
    const dessin = el('img', 'donjon-attaque-dessin')
    dessin.src = url(ICONE_ATTAQUE)
    dessin.alt = ''
    dessin.draggable = false
    // Sans mot (Keko : « enlève les mots sur les boutons ») : l'image dit tout.
    attaque.append(dessin)
  }
  // LA RECHARGE DU TAP (Keko : « quand on appuie le bouton se colore et la
  // coloration se vide de haut en bas pour indiquer le CD ») : un voile sur
  // le bouton, à la hauteur de ce qui reste à recharger.
  const voileRecharge = el('span', 'donjon-recharge')
  attaque.prepend(voileRecharge)
  // Les infos de l'attaque, montrées tant que le bouton reste enfoncé (Keko :
  // « affiche les infos de l'attaque quand on laisse le tap enfoncé »).
  const bulle = el('div', 'donjon-bulle')
  bulle.hidden = true
  cadre.innerHTML = `<svg class="donjon-contour" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path class="donjon-contour-fond" d="${CONTOUR}"/><path class="donjon-contour-plein" pathLength="1" d="${CONTOUR}"/></svg>`
  cadre.prepend(attaque)
  cadre.append(bulle)
  // LES DEUX CAPACITÉS DE L'ARME, de part et d'autre de l'attaque (Keko :
  // « deux boutons d'action à chaque arme, à gauche et à droite de
  // l'attaque »). Le même or, plus petites ; le même voile, qui dit la
  // recharge ou la condition (les critiques de la Furie).
  const boutonsCapacite = (['gauche', 'droite'] as const).map((cote) => {
    const b = bouton(`donjon-capacite ${cote}`)
    const voile = el('span', 'donjon-recharge')
    const image = el('img', 'donjon-capacite-dessin')
    image.alt = ''
    image.draggable = false
    b.append(voile, image)
    cadre.append(b)
    return { b, voile, image }
  })
  // L'EMPLACEMENT D'ARME, sur la ligne du niveau (Keko : « pas sur la ligne
  // du bouton d'attaque, je veux garder l'emplacement pour d'autres boutons
  // d'attaque plus tard ») : l'arme portée ; une tape ouvre l'armurerie.
  const emplacement = bouton('donjon-emplacement')
  emplacement.setAttribute('aria-label', 'Armes')
  const imageArme = el('img', 'donjon-emplacement-image')
  imageArme.alt = ''
  imageArme.draggable = false
  emplacement.append(imageArme)
  let armeVue = ''
  const contour = cadre.querySelector<SVGSVGElement>('.donjon-contour')!
  const contourPlein = cadre.querySelector<SVGPathElement>('.donjon-contour-plein')!
  // LA FORME, sous le bouton (Keko : « un marqueur sur un trait, la zone du
  // milieu = normal, les côtés = fatigue / repos ») : de 0 % à 200 %.
  const jaugeForme = el('div', 'donjon-forme')
  const traitForme = el('div', 'donjon-forme-trait')
  const marqueurForme = el('div', 'donjon-forme-marqueur')
  const valeurForme = el('span', 'donjon-forme-valeur')
  marqueurForme.append(valeurForme)
  traitForme.append(marqueurForme)
  jaugeForme.append(el('span', 'donjon-forme-bout', 'Fatigue'), traitForme, el('span', 'donjon-forme-bout', 'Repos'))
  // Le trait est à l'échelle de la forme : la zone blanche, c'est le palier
  // à 100 % (Keko : « augmenter la taille de la zone centrale »).
  const BORNES = bornesDeLaForme(C)
  const surLeTrait = (forme: number) => (100 * (forme - BORNES.min)) / (BORNES.max - BORNES.min)
  const debutPalier = surLeTrait(BORNES.palierBas)
  const finPalier = surLeTrait(BORNES.palierHaut)
  traitForme.style.background = `linear-gradient(to right, #3f3f3f 0%, #a8a8a8 ${debutPalier}%, #fff ${debutPalier}% ${finPalier}%, #ffe58a ${finPalier}%, #ffcf2e 100%)`
  arene.append(cadre, jaugeForme)

  // De haut en bas : le nom et la vie de l'ennemi, l'ennemi, le bouton, le
  // niveau, et tout en bas le journal. LA BARRE DE VIE EST AU-DESSUS DE LA
  // SCÈNE (Keko : « diminuer l'espace entre les boutons et le monstre pour
  // faciliter les actions ») : le monstre, qu'on touche pour les passifs,
  // descend juste au-dessus de l'attaque, plus près du pouce.
  // La ligne du personnage : son arme, puis son niveau (qui ouvre ses stats).
  const perso = el('div', 'donjon-perso')
  perso.append(emplacement, bande)
  page.append(tete, fiche, scene, arene, perso, fil)

  // Les cinq stats, faites une fois (redessinées à chaque tic, les boutons
  // perdraient le clic entre l'appui et le relâchement). Un point par niveau,
  // à mettre où l'on veut ; sans point, elles restent là, éteintes, à lire.
  const choix = el('div', 'donjon-choix')
  const lesChoix = AMELIORATIONS.map((quoi) => {
    const b = bouton('donjon-choix-ligne')
    const texte = el('span', 'donjon-choix-texte')
    texte.append(el('span', 'donjon-choix-nom', CHOIX[quoi].nom), el('span', 'donjon-choix-role', CHOIX[quoi].role))
    const valeur = el('span', 'donjon-choix-valeur')
    const cout = el('span', 'donjon-choix-cout')
    b.append(texte, valeur, cout)
    b.addEventListener('click', () => {
      void partage.agir({ joueur: MOI, t: maintenant(), type: 'acheter', quoi }).then(() => {
        b.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.04)' }, { transform: 'scale(1)' }], { duration: 220, easing: 'ease-out' })
        sauver()
        // Plus de point : on retourne au combat, la feuille FIGÉE le temps de
        // se fermer (redessinée, elle s'éteignait sous le doigt).
        const dernier = moi().points <= 0
        if (dernier) feuilleFigee = true
        dessiner()
        if (dernier) setTimeout(fermerLaFeuille, 350)
      })
    })
    choix.append(b)
    return { quoi, b, valeur, cout }
  })

  // ------------------------------------------------ la feuille
  const voile = el('div', 'donjon-voile')
  const feuille = el('section', 'donjon-feuille')
  const feuilleTete = el('div', 'donjon-feuille-tete')
  const feuilleTitre = el('h2', 'donjon-feuille-titre')
  const fermer = bouton('donjon-icone donjon-fermer', '×')
  fermer.setAttribute('aria-label', 'Fermer')
  feuilleTete.append(feuilleTitre, fermer)
  const feuilleCorps = el('div', 'donjon-feuille-corps')
  feuille.append(feuilleTete, feuilleCorps)
  voile.append(feuille)
  page.append(voile)
  let ouverte: Feuille | null = null
  /** La feuille ne se redessine plus : elle se ferme sur ce qu'elle montrait. */
  let feuilleFigee = false
  let cleDeLaFeuille = ''

  const TITRES: Record<Feuille, string> = { ameliorations: 'Améliorations', armes: 'Armes', classement: 'Classement', journal: 'Journal', reglages: 'Réglages' }
  function ouvrir(f: Feuille): void {
    ouverte = f
    cleDeLaFeuille = ''
    feuilleTitre.textContent = TITRES[f]
    voile.classList.add('ouvert')
    dessiner()
  }
  function fermerLaFeuille(): void {
    ouverte = null
    feuilleFigee = false
    voile.classList.remove('ouvert')
  }
  boutonClassement.addEventListener('click', () => ouvrir('classement'))
  boutonReglages.addEventListener('click', () => ouvrir('reglages'))
  fil.addEventListener('click', () => ouvrir('journal'))
  bande.addEventListener('click', () => ouvrir('ameliorations'))
  emplacement.addEventListener('click', () => ouvrir('armes'))
  fermer.addEventListener('click', fermerLaFeuille)
  voile.addEventListener('click', (ev) => {
    if (ev.target === voile) fermerLaFeuille()
  })

  // Les réglages, faits une fois : la vitesse du temps et « Recommencer ».
  const reglages = el('div', 'donjon-reglages')
  const vitesses = el('div', 'donjon-vitesses')
  const boutonsVitesse = C.vitesses.map((v) => {
    const b = bouton('donjon-vitesse', `×${v}`)
    b.addEventListener('click', () => {
      horloge = changerDeVitesse(horloge, Date.now(), v)
      sauver()
      dessiner()
    })
    vitesses.append(b)
    return b
  })
  // RECOMMENCER se confirme par une seconde tape (pas de fenêtre du
  // navigateur). On repart par `&neuf` plutôt qu'en vidant le stockage ici :
  // la sauvegarde de `pagehide` réécrirait l'ancienne saison en partant.
  const recommencer = bouton('donjon-recommencer', 'Recommencer la saison')
  let confirmation = 0
  recommencer.addEventListener('click', () => {
    if (recommencer.classList.contains('a-confirmer')) {
      const adresse = new URL(location.href)
      adresse.searchParams.set('neuf', '')
      location.replace(adresse.toString())
      return
    }
    recommencer.classList.add('a-confirmer')
    recommencer.textContent = 'Tout effacer ?'
    clearTimeout(confirmation)
    confirmation = window.setTimeout(() => {
      recommencer.classList.remove('a-confirmer')
      recommencer.textContent = 'Recommencer la saison'
    }, 3000)
  })
  // L'ARMURERIE (Keko : « y'a pas mieux qu'une liste ? », les armes vont se
  // multiplier et porter plus d'infos) : en haut la FICHE de l'arme choisie,
  // ses chiffres avec vos stats, comparés à l'arme portée (▲ ▼) ; en bas la
  // GRILLE des armes, cadre à la couleur du cran. Une tape choisit,
  // « Équiper » confirme, et la feuille se referme.
  const armurerie = el('div', 'donjon-armes')
  const ficheArme = el('div', 'donjon-fiche-arme')
  const ficheImage = el('img', 'donjon-fiche-image')
  ficheImage.alt = ''
  ficheImage.draggable = false
  const ficheNom = el('div', 'donjon-fiche-nom')
  const ficheSous = el('div', 'donjon-fiche-sous')
  const ficheEntete = el('div', 'donjon-fiche-entete')
  const ficheTitres = el('div', 'donjon-fiche-titres')
  ficheTitres.append(ficheNom, ficheSous)
  ficheEntete.append(ficheImage, ficheTitres)
  const ficheLignes = el('div', 'donjon-fiche-lignes')
  const equiper = bouton('donjon-equiper')
  ficheArme.append(ficheEntete, ficheLignes, equiper)
  const grille = el('div', 'donjon-grille-armes')
  armurerie.append(ficheArme, grille)
  const inventaire = inventaireDArmes(parametres)
  /** La place choisie, et celle de l'arme portée (une arme peut être en plusieurs exemplaires). */
  let choisie = 0
  let portee = 0
  const casesArme = inventaire.map(({ arme, rarete }, k) => {
    const b = bouton('donjon-case-arme')
    b.style.setProperty('--rarete', RARETE[rarete].couleur)
    b.setAttribute('aria-label', C.armes[arme].nom)
    const image = el('img')
    image.src = url(IMAGE_DE_L_ARME[arme])
    image.alt = ''
    image.draggable = false
    b.append(image)
    b.addEventListener('click', () => {
      choisie = k
      cleDeLaFiche = ''
      dessiner()
    })
    grille.append(b)
    return b
  })
  const cases = Math.max(GRILLE.casesMin, Math.ceil(inventaire.length / GRILLE.colonnes) * GRILLE.colonnes)
  for (let k = inventaire.length; k < cases; k++) grille.append(el('div', 'donjon-case-vide'))
  /** La place portée suit l'arme du joueur, si elle a changé ailleurs (une sauvegarde, un réglage) ; -1 à mains nues. */
  function placePortee(): number {
    const arme = moi().arme
    if (arme === 'mains') return -1
    if (inventaire[portee]?.arme !== arme) portee = Math.max(0, inventaire.findIndex((p) => p.arme === arme))
    return portee
  }
  // « Équiper » l'arme choisie ; sur l'arme portée, « Déséquiper » (Keko :
  // « déséquiper l'arme pour être à mains nues, sans capacité »).
  equiper.addEventListener('click', () => {
    const quitter = choisie === placePortee()
    const arme = quitter ? 'mains' : inventaire[choisie].arme
    if (!quitter) portee = choisie
    void partage.agir({ joueur: MOI, t: maintenant(), type: 'equiper', arme }).then(() => {
      sauver()
      dessiner()
      emplacement.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.25) rotate(-8deg)' }, { transform: 'scale(1)' }], { duration: 360, easing: 'ease-out' })
      setTimeout(fermerLaFeuille, 250)
    })
  })
  let cleDeLaFiche = ''
  /**
   * Une ligne de la fiche : son nom, sa valeur, et l'écart à l'arme portée
   * (▲ mieux, ▼ moins bien, = en bleu si c'est pareil — Keko), absent pour
   * l'arme portée elle-même.
   */
  function ligneDeFiche(nom: string, valeur: string, ecart?: { texte: string; mieux: boolean } | 'egal'): HTMLElement {
    const l = el('div', 'donjon-fiche-ligne')
    l.append(el('span', undefined, nom), el('b', undefined, valeur))
    if (ecart === 'egal') l.append(el('span', 'donjon-egal', '='))
    else if (ecart !== undefined) l.append(el('span', ecart.mieux ? 'donjon-mieux' : 'donjon-moins', `${ecart.mieux ? '▲' : '▼'} ${ecart.texte}`))
    return l
  }
  function dessinerLaFiche(): void {
    const j = moi()
    const ici = placePortee()
    const { arme, rarete } = inventaire[choisie]
    const cle = `${choisie}:${ici}:${AMELIORATIONS.map((q) => j.ameliorations[q]).join(',')}`
    if (cle === cleDeLaFiche) return
    cleDeLaFiche = cle
    const a = C.armes[arme]
    const estPortee = choisie === ici
    const avec = { ...j, arme }
    ficheArme.style.setProperty('--rarete', RARETE[rarete].couleur)
    ficheImage.src = url(IMAGE_DE_L_ARME[arme])
    ficheNom.textContent = a.nom
    ficheSous.textContent = `${RARETE[rarete].nom} · ${DIT_L_ARME[arme].caractere}`
    // L'écart se dit seulement s'il existe : `signe` dit quel sens est le mieux.
    const ecart = (x: number, y: number, signe: 1 | -1, texte: (d: number) => string) => {
      if (estPortee) return undefined
      if (Math.abs(x - y) < 1e-9) return 'egal' as const
      return { texte: texte(x - y), mieux: signe * (x - y) > 0 }
    }
    const signe = (d: number, f: (x: number) => string) => `${d > 0 ? '+' : '−'}${f(Math.abs(d))}`
    // TROIS CHIFFRES (Keko : « une seule stat vitesse, la vitesse auto — la
    // manuelle en dérive » ; « le DPS moyen, écrit juste DPS ») : les dégâts,
    // l'intervalle de l'auto, et le DPS qu'ils font — dégâts moyens,
    // critiques à la moyenne, au rythme de l'auto. Le tap, dix fois plus
    // rapide, le multiplie d'autant pour toutes les armes.
    const moyen = degatsDuTap(C, avec)
    const dps = dpsEffectifDe(C, avec)
    const lignes = [
      ligneDeFiche('Dégâts', `${borne(moyen * (1 - C.tap.ecart) + 1e-9)} – ${borne(moyen * (1 + C.tap.ecart) - 1e-9)}`, ecart(moyen, degatsDuTap(C, j), 1, (d) => signe(d, nombre))),
      ligneDeFiche('Vitesse', secondes(periodeDe(C, avec)), ecart(periodeDe(C, avec), periodeDe(C, j), -1, (d) => signe(d, secondes))),
      ligneDeFiche('DPS', nombre(dps), ecart(dps, dpsEffectifDe(C, j), 1, (d) => signe(d, nombre))),
      el('div', 'donjon-fiche-section', 'Bonus'),
      el('div', 'donjon-fiche-texte', DIT_L_ARME[arme].bonus),
    ]
    // SON PASSIF, celui de toute sa classe (Keko) ; l'arc et l'épée à deux
    // mains n'ont pas encore le leur.
    if (arme in C.passifs) {
      const passif = el('div', 'donjon-fiche-capacite')
      const iconePassif = el('img')
      iconePassif.src = url(IMAGE_DU_PASSIF[arme as ArmeAPassif])
      iconePassif.alt = ''
      iconePassif.draggable = false
      const textePassif = el('div')
      textePassif.append(el('b', undefined, C.passifs[arme as ArmeAPassif].nom), el('span', undefined, effetDuPassif(arme as ArmeAPassif)))
      passif.append(iconePassif, textePassif)
      lignes.push(el('div', 'donjon-fiche-section', 'Passif'), passif)
    }
    // SES DEUX CAPACITÉS, à la place de la section « Effet » prévue (Keko).
    if (a.capacites.length > 0) lignes.push(el('div', 'donjon-fiche-section', 'Capacités'))
    for (const cle of a.capacites) {
      const ligne = el('div', 'donjon-fiche-capacite')
      const image = el('img')
      image.src = url(IMAGE_DE_LA_CAPACITE[cle])
      image.alt = ''
      image.draggable = false
      const texte = el('div')
      texte.append(el('b', undefined, C.capacites[cle].nom), el('span', undefined, `${effetDeLaCapacite(cle)}, ${quandLaCapacite(cle)}`))
      ligne.append(image, texte)
      lignes.push(ligne)
    }
    ficheLignes.replaceChildren(...lignes)
    equiper.textContent = estPortee ? 'Déséquiper' : 'Équiper'
    equiper.classList.toggle('quitter', estPortee)
    for (const [k, b] of casesArme.entries()) {
      b.classList.toggle('portee', k === ici)
      b.classList.toggle('choisie', k === choisie)
    }
  }
  reglages.append(
    el('div', 'donjon-reglage-titre', 'Vitesse du temps'),
    vitesses,
    recommencer,
    el('div', 'donjon-build', `build ${build}`),
  )

  // ------------------------------------------------ le geste
  // La dague ouvre une plaie ; la flèche droite, son premier essai, est celle
  // de l'ARC — `&fleche` la rend aussi à la dague.
  const FLECHE = parametres.has('fleche')
  // La plaie : ouverte du milieu vers les bouts en 140 ms (le contact à 40),
  // tenue 150, effacée telle quelle comme la lance.
  const CONTACT_PLAIE = 40
  const OUVERTURE_PLAIE = 140
  const TENUE_PLAIE = 150
  // Le coup de lance : il perce à 100 ms (son élan), reste fiché 260 ms (plus que le
  // poignard ; Keko : « un peu plus longtemps »), s'efface sur place en 160
  // (« un peu plus long, le fade » ; 90 avant).
  const CONTACT_LANCE = 100
  const TENUE_LANCE = 260
  const FONDU_LANCE = 160
  const FONDU_PLAIE = FONDU_LANCE
  // Le coup de massue du bâton : il balaie son arc en 170 ms, cogne au
  // milieu (85 ms), s'efface en 140. `&rune` lui rend le cercle de rune,
  // rangé pour ailleurs.
  const CONTACT_BATON = 85
  const VIDANGE_MASSUE = 140
  const BALAYAGE_MASSUE = 100
  // Sa version longue (les massues à deux mains et les bâtons) : 110° balayés
  // en 220 ms, le choc à 110 ms, effacée en 170.
  const CONTACT_LONG = 110
  const VIDANGE_LONG = 170
  const BALAYAGE_LONG = 110
  // Le coup de marteau : il tombe sur 110° en 120 ms en accélérant, frappe
  // (le contact) et s'arrête, reste posé 90 ms, s'efface tel quel en 160.
  const CONTACT_MARTEAU = 120
  const TENUE_MARTEAU = 90
  const FONDU_MARTEAU = 160
  const BALAYAGE_MARTEAU = 110
  // Sa version lourde (le marteau à deux mains) : 125° en 160 ms, posé 120.
  const CONTACT_MARTEAU_LOURD = 160
  const TENUE_MARTEAU_LOURD = 120
  const BALAYAGE_MARTEAU_LOURD = 125
  // La balle du pistolet arrive en 40 ms.
  const CONTACT_BALLE = 40
  // Le fouet claque à 130 ms ; la boule du fléau frappe à 140, posée 90.
  const CONTACT_FOUET = 130
  const CONTACT_FLEAU = 140
  const TENUE_FLEAU = 90
  const RUNE = parametres.has('rune')
  type Genre = 'tap' | 'critique' | 'auto' | 'autoCritique' | 'capacite' | 'capaciteCritique'

  /**
   * Ce qui change d'un genre de coup à l'autre : la taille du chiffre (×),
   * son gonflement, son penché, sa durée, l'onde, les particules, le recul et
   * l'éclair de l'ennemi, la secousse de la scène.
   */
  const STYLES: Record<Genre, { taille: number; pop: number; penche: number; duree: number; onde: number; particules: number; recul: number; blanc: number; secousse: boolean; critique: boolean }> = {
    tap: { taille: 1, pop: 1.45, penche: 12, duree: 950, onde: 1, particules: 8, recul: 8, blanc: 2.6, secousse: false, critique: false },
    critique: { taille: 1.2, pop: 1.7, penche: 24, duree: 1200, onde: 1.6, particules: 12, recul: 14, blanc: 2.6, secousse: true, critique: true },
    // Un coup d'auto est un tap (Keko : « exactement comme les autres ») ;
    // seul le critique de l'auto ne secoue pas la scène.
    auto: { taille: 1, pop: 1.45, penche: 12, duree: 950, onde: 1, particules: 8, recul: 8, blanc: 2.6, secousse: false, critique: false },
    autoCritique: { taille: 1.2, pop: 1.7, penche: 24, duree: 1200, onde: 1.6, particules: 12, recul: 14, blanc: 2.6, secousse: false, critique: true },
    // Une capacité frappe plus fort que tout : plus gros, plus long, secoué.
    capacite: { taille: 1.3, pop: 1.9, penche: 16, duree: 1400, onde: 2.2, particules: 18, recul: 20, blanc: 3, secousse: true, critique: false },
    capaciteCritique: { taille: 1.45, pop: 2.1, penche: 24, duree: 1500, onde: 2.6, particules: 22, recul: 24, blanc: 3, secousse: true, critique: true },
  }

  /**
   * Le chiffre qui jaillit de l'ennemi : il gonfle d'un coup, puis monte et
   * s'efface. `mot` au-dessus (le nom d'une capacité), sinon « Critique ! ».
   */
  function envoler(x: number, y: number, valeur: number, genre: Genre, couleur: string, mot?: string): void {
    const n = el('div', `donjon-degat ${genre}`)
    n.style.color = couleur
    n.style.fontSize = `${tailleDuChiffre(valeur, genre)}rem`
    if (mot !== undefined) n.append(el('span', 'donjon-degat-mot', STYLES[genre].critique ? `${mot} critique !` : mot))
    else if (STYLES[genre].critique) n.append(el('span', 'donjon-degat-mot', 'Critique !'))
    n.append(el('span', undefined, nombre(valeur)))
    n.style.left = `${x}px`
    n.style.top = `${y}px`
    scene.append(n)
    const derive = (Math.random() - 0.5) * 60
    const penche = (Math.random() - 0.5) * STYLES[genre].penche
    const gros = STYLES[genre].pop
    // Le temps reste linéaire, chaque segment a sa courbe : une courbe sur
    // l'ensemble avalait le moment plein et effaçait le chiffre presque aussitôt.
    n.animate(
      [
        { transform: `translate(-50%, -50%) scale(0.3) rotate(${penche}deg)`, opacity: 1, easing: 'ease-out' },
        { transform: `translate(-50%, -60%) scale(${gros}) rotate(${penche}deg)`, opacity: 1, offset: 0.1, easing: 'ease-in-out' },
        { transform: `translate(calc(-50% + ${derive * 0.3}px), -80%) scale(1) rotate(${penche * 0.5}deg)`, opacity: 1, offset: 0.25, easing: 'ease-out' },
        { transform: `translate(calc(-50% + ${derive * 0.8}px), -170%) scale(0.95) rotate(0deg)`, opacity: 1, offset: 0.7, easing: 'ease-in' },
        { transform: `translate(calc(-50% + ${derive}px), -230%) scale(0.85) rotate(0deg)`, opacity: 0 },
      ],
      { duration: STYLES[genre].duree },
    ).onfinish = () => n.remove()
  }

  /**
   * LA COULEUR DIT CE QUI A PORTÉ LE COUP (Keko : « fatigue = gris / repos =
   * jaune / critique = orange / normal = blanc », et l'auto blanc comme les
   * autres). Elle suit la forme en continu (`ecart` = multiplicateur − 1) :
   * le blanc tire vers le jaune au-dessus de 100 %, vers le gris en dessous,
   * plein aux quatre cinquièmes du chemin. DÈS QU'ON SORT DU PALIER, LA
   * TEINTE EST DÉJÀ À `TEINTE_MIN` (Keko : « on devrait le voir dès qu'on y
   * est, mais ça reste blanc au début »). Le critique reste orange ; la
   * fatigue ne le grise qu'à moitié, pour qu'on le reconnaisse. L'auto n'a
   * pas de forme.
   */
  function teinteDuChiffre(genre: Genre, ecart: number): string {
    const critique = STYLES[genre].critique
    const base = critique ? TEINTES.critique : TEINTES.normal
    const vers = ecart < 0 ? TEINTES.fatigue : critique ? TEINTES.critique : TEINTES.repos
    const pente = ecart === 0 ? 0 : TEINTE_MIN + (1 - TEINTE_MIN) * Math.min(1, Math.abs(ecart) / 0.8)
    const part = pente * (critique && ecart < 0 ? 0.5 : 1)
    const [r, g, b] = base.map((c, i) => Math.round(c + (vers[i] - c) * part))
    return `rgb(${r}, ${g}, ${b})`
  }

  /**
   * LA TAILLE DU CHIFFRE SUIT SA VALEUR (Keko : « une taille minimale pour 1
   * ou moins et qui grossit en fonction ») : `TAILLE.min` jusqu'à 1, puis
   * `TAILLE.parDecade` de plus à chaque facteur 10, plafonnée à `TAILLE.max`.
   * Le critique est un peu plus gros, l'auto un peu plus petit.
   */
  function tailleDuChiffre(valeur: number, genre: Genre): number {
    const brute = Math.min(TAILLE.max, TAILLE.min + TAILLE.parDecade * Math.log10(Math.max(1, valeur)))
    return brute * STYLES[genre].taille
  }

  /**
   * L'IMPACT : une petite onde de choc et des particules qui s'éparpillent
   * (Keko : l'étoile « correspond à un coup de poing »), à la couleur du
   * chiffre ; l'ennemi blanchit et recule.
   */
  /**
   * L'ENTAILLE DE L'ÉPÉE (Keko : « un effet de slash pour l'épée, l'animation
   * actuelle correspond aux mains nues ») : un croissant blanc, fin, pointu
   * aux deux bouts, cerné de la couleur du coup, qui se trace d'un bout à
   * l'autre puis s'efface dans le même sens — par un MASQUE À BORDS FONDUS
   * qui glisse : une découpe droite (`clip-path`) laissait un bout plat
   * (Keko) et rognait la lueur. Penché au hasard, un coup sur deux dans l'autre sens. Le
   * critique en trace une seule, PLUS GROSSE (×1,4 ; Keko : « éviter le
   * double slash, plutôt une version un peu plus grosse »). DU PUNCH AUTOUR (Keko : « ça
   * manque un peu d'impact » — puis « je ne voulais pas toucher aux slashs,
   * plutôt au feel autour ») : l'entaille garde sa forme, tracée un peu plus
   * vite ; les étincelles sont des traits qui filent, l'ennemi se fige un instant dans
   * sa pose touchée (l'arrêt sur coup) et la scène bouge d'un cran dans le
   * sens de la lame.
   */
  let sensDeLaLame = 1
  /**
   * L'ENTAILLE LOURDE (`lourde`, les armes à deux mains) : la même entaille,
   * 1,45 fois plus grande et un tiers plus épaisse, tracée plus lentement
   * (340 ms) ; elle FEND de haut en bas, presque à la verticale, le croissant
   * bombant d'un côté puis de l'autre (`bombe`). L'ENTAILLE DROITE (`droite`,
   * les épées ; Keko : « des slashs épée droits pour l'épée et l'épée à deux
   * mains » — le croissant est passé aux haches) : un trait droit, fin,
   * pointu aux deux bouts, de la même épaisseur au milieu, tracé pareil.
   */
  function entaille(x: number, y: number, fort: number, couleur: string, angle: number, sens: number, retard: number, lourde = false, bombe = 1, droite = false): void {
    const n = el('div', 'donjon-entaille')
    const forme = droite ? 'M0 15 Q50 9.5 100 15 Q50 20.5 0 15Z' : 'M0 26 Q50 -10 100 26 Q50 1 0 26Z'
    n.innerHTML = `<svg viewBox="-10 -20 120 70" aria-hidden="true"><path d="${forme}"/></svg>`
    n.style.left = `${x}px`
    n.style.top = `${y}px`
    n.style.color = couleur
    const k = (1 + 0.65 * (fort - 1)) * (lourde ? 1.45 : 1)
    n.style.transform = `translate(-50%, -50%) rotate(${angle}deg) scale(${sens * k}, ${bombe * k * (lourde ? 1.35 : 1)})`
    scene.append(n)
    n.animate(
      [
        { maskPosition: '100% 0', easing: 'cubic-bezier(0.2, 0.9, 0.3, 1)' },
        { maskPosition: '50% 0', offset: 0.35, easing: 'ease-in' },
        { maskPosition: '0% 0' },
      ],
      { duration: lourde ? 340 : 260, delay: retard, fill: 'backwards' },
    ).onfinish = () => n.remove()
  }

  /**
   * LA FLÈCHE DE L'ARC (le premier estoc de la dague ; Keko : « ça fait très
   * flèche, on le garde pour les arcs », puis « essayons l'arc, reprends
   * ça ») : une lame fine et pointue qui file droit vers le point touché et
   * s'y FICHE — elle arrive en accélérant, s'arrête net, s'enfonce d'un cran,
   * vibre, reste plantée un court instant puis s'efface sur place ; pleine,
   * la queue à peine fondue (Keko : « un peu trop transparentes »). Elle monte du bas, de celui qui
   * tire. Une HAMPE DROITE
   * et un EMPENNAGE en losange à la queue (Keko : « une forme droite plutôt
   * que pointue vers la queue, et une forme qui rappelle un peu les plumes,
   * un losange à la fin » ; elle s'effilait du fer jusqu'à la queue), SANS
   * FER ÉLARGI (Keko : « un rectangle plus épais à l'avant, c'est pas beau » :
   * aplati, le fer devenait un bloc plus large que la hampe), et finalement
   * UNE POINTE au bout (Keko : « finalement, ajoute une pointe au bout » :
   * elle s'aplatissait en se plantant), un fer en triangle qui reste pointu.
   * Plus courte (Keko : « raccourcis un peu les flèches » ; 6 rem).
   * `&fleche` la rend aussi à la dague. LE CARREAU DE L'ARBALÈTE (`gros` ;
   * Keko : « une arbalète, en mode grosse flèche ») : la même flèche, un quart
   * plus longue et 1,8 fois plus épaisse, qui s'enfonce plus loin.
   */
  function fleche(x: number, y: number, k: number, couleur: string, angle: number, gros = false): void {
    const n = el('div', 'donjon-estoc')
    n.innerHTML = '<svg viewBox="0 -6 100 12" preserveAspectRatio="none" aria-hidden="true"><path/></svg>'
    // L'empennage (un losange, de 0 à 22), la hampe droite (demi-largeur 1,6),
    // le fer en triangle (de 82 à 100, 3,4 de demi-largeur à sa base).
    n.querySelector('path')!.setAttribute('d', 'M0 0 L11 -3.4 L22 -1.6 L82 -1.6 L82 -3.4 L100 0 L82 3.4 L82 1.6 L22 1.6 L11 3.4Z')
    // La pointe sur le point touché : la boîte finit au point, on tourne autour.
    n.style.left = `${x}px`
    n.style.top = `${y}px`
    n.style.color = couleur
    const [long, epais] = gros ? [1.25, 1.8] : [1, 1]
    const pose = (avance: string, etire: number, vibre = 0) => `translate(-100%, -50%) rotate(${angle + vibre}deg) translateX(${avance}) scale(${k * etire * long}, ${k * epais})`
    const fiche = gros ? '0.55rem' : '0.35rem'
    scene.append(n)
    // Elle touche à 50 ms, s'enfonce, VIBRE en se plantant, reste fichée
    // ~280 ms (Keko : « qu'elle reste plantée un court instant »), puis
    // s'efface sur place.
    const duree = 475
    const a = (ms: number) => ms / duree
    n.animate(
      [
        { transform: pose('-3.5rem', 1.35), easing: 'cubic-bezier(0.5, 0, 1, 1)' },
        { transform: pose('0rem', 1.1), offset: a(50), easing: 'ease-out' },
        { transform: pose(fiche, 1, 3), offset: a(75) },
        { transform: pose(fiche, 1, -2.2), offset: a(105) },
        { transform: pose(fiche, 1, 1.2), offset: a(135) },
        { transform: pose(fiche, 1, -0.5), offset: a(165) },
        { transform: pose(fiche, 1), offset: a(195) },
        { transform: pose(fiche, 1), opacity: 1, offset: a(355), easing: 'ease-in' },
        { transform: pose(fiche, 1), opacity: 0 },
      ],
      { duration: duree },
    ).onfinish = () => n.remove()
  }

  /**
   * UN TRAIT DE LUMIÈRE DROIT, de `longueur` et de demi-épaisseur `largeur`,
   * qui finit sur le point touché, dans la direction `angle` : `profil` dit
   * sa largeur le long du trait (0 = la queue, 1 = la tête). `dessiner` le
   * trace entre `queue` et `tete` (0 = son départ, 1 = le point), gonflé de
   * `gonfle`. La lance s'en sert. `elan` : jusqu'où, en
   * longueurs, il peut venir de derrière son départ (la boîte s'agrandit).
   */
  function traitDroit(x: number, y: number, couleur: string, angle: number, longueur: number, largeur: number, profil: (v: number) => number, elan = 0) {
    // La direction du coup, et sa normale (le trait s'épaissit de part et d'autre).
    const a = (angle * Math.PI) / 180
    const [dx, dy] = [Math.cos(a), Math.sin(a)]
    const trace = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    trace.setAttribute('class', 'donjon-course')
    trace.setAttribute('aria-hidden', 'true')
    // Une vraie boîte autour du trait, centrée sur le point : sur une boîte
    // nulle, la lueur serait rognée.
    const demi = longueur * (1 + elan) + 3 * largeur
    trace.setAttribute('viewBox', `${-demi} ${-demi} ${2 * demi} ${2 * demi}`)
    trace.style.width = trace.style.height = `${2 * demi}px`
    trace.style.left = `${x - demi}px`
    trace.style.top = `${y - demi}px`
    trace.style.color = couleur
    const forme = document.createElementNS('http://www.w3.org/2000/svg', 'path')
    trace.append(forme)
    scene.append(trace)
    const dessiner = (queue: number, tete: number, gonfle: number) => {
      if (tete - queue < 0.01) return forme.setAttribute('d', '')
      const dehors: string[] = []
      const dedans: string[] = []
      for (let i = 0; i <= 24; i++) {
        const v = i / 24
        const h = largeur * gonfle * profil(v)
        const recul = (1 - (queue + (tete - queue) * v)) * longueur
        const [cx, cy] = [-dx * recul, -dy * recul]
        dehors.push(`${(cx - dy * h).toFixed(1)} ${(cy + dx * h).toFixed(1)}`)
        dedans.push(`${(cx + dy * h).toFixed(1)} ${(cy - dx * h).toFixed(1)}`)
      }
      forme.setAttribute('d', `M${dehors.join(' L')} L${dedans.reverse().join(' L')}Z`)
    }
    return { dessiner, trace }
  }

  /**
   * LE COUP DE LANCE (Keko : « on essaie la lance maintenant ? ») : un ESTOC
   * — un trait de lumière long et fin, une hampe qui s'élargit en une tête
   * en feuille, pointue, qui jaillit du bas (de celui qui tient la lance),
   * perce le point, s'y enfonce d'un cran, RESTE PLANTÉE comme la dague,
   * puis s'efface telle quelle, vite (Keko : « la laisser plantée comme la
   * dague, ça marche bien avec les armes thrust » ; elle se retirait
   * aussitôt). Les étincelles traversent l'ennemi, dans le sens du coup. Un coup sur deux penché de l'autre côté. Le critique l'épaissit
   * comme celui de la dague. L'AIGUILLE DE LA RAPIÈRE (`aiguille` ; Keko :
   * « l'effet lance, mais avec une aiguille ») : le même estoc, son élan, sa
   * tenue et son fondu, mais un trait fin et droit, d'une seule largeur, qui
   * s'effile en une longue pointe sur son dernier quart.
   */
  let coteDeLaLance = 1
  function lance(x: number, y: number, k: number, couleur: string, angle: number, aiguille = false): void {
    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize)
    // La hampe (une pointe courte à la queue), la tête qui s'élargit, puis la
    // pointe ; l'aiguille : droite, puis effilée sur son dernier quart.
    const profil = aiguille
      ? (v: number) => (v < 0.04 ? v / 0.04 : v < 0.75 ? 1 : (1 - v) / 0.25)
      : (v: number) => (v < 0.06 ? v / 0.06 : v < 0.66 ? 0.5 : v < 0.84 ? 0.5 + (0.5 * (v - 0.66)) / 0.18 : (1 - v) / 0.16)
    // Un peu plus grande (Keko : « augmente un peu la taille » ; 6,5 et 0,42) ;
    // l'aiguille un peu plus courte, et fine (0,24 rem).
    const longueur = (aiguille ? 6.5 : 7.5) * rem
    const { dessiner, trace } = traitDroit(x, y, couleur, angle, longueur, (aiguille ? 0.12 : 0.48) * rem * (1 + (k - 1) * 2), profil, 1.4)
    // L'ÉLAN (Keko : « on dirait qu'elle apparaît directement sur place ») :
    // elle arrive ENTIÈRE de 4 rem en retrait, étirée par la vitesse, et se
    // resserre en touchant.
    const depart = performance.now()
    const image = (maintenant: number) => {
      const t = maintenant - depart
      if (t < CONTACT_LANCE) {
        const p = (t / CONTACT_LANCE) ** 2
        const tete = 1 - ((1 - p) * 4 * rem) / longueur
        dessiner(tete - 0.95 - 0.35 * (1 - p), tete, 1)
        trace.style.opacity = `${Math.min(1, t / 25)}`
      } else if (t < CONTACT_LANCE + TENUE_LANCE) {
        // Elle perce : la pointe s'enfonce d'un cran, le trait gonfle et se
        // rassied, puis elle reste plantée.
        const ms = t - CONTACT_LANCE
        dessiner(0.05, 1 + 0.08 * Math.min(1, ms / 25), 1 + 0.25 * Math.max(0, 1 - ms / 60))
      } else if (t < CONTACT_LANCE + TENUE_LANCE + FONDU_LANCE) {
        // Elle s'efface TELLE QUELLE, vite (Keko : « plutôt que la réduire en
        // taille pour disparaître, la fade telle quelle rapidement »).
        const q = (t - CONTACT_LANCE - TENUE_LANCE) / FONDU_LANCE
        dessiner(0.05, 1.08, 1)
        trace.style.opacity = `${1 - q}`
      } else {
        trace.remove()
        return
      }
      requestAnimationFrame(image)
    }
    image(depart)
  }

  /**
   * LA PLAIE DE LA DAGUE (Keko : « la dague, on va la rework : un slash qui
   * s'ouvre façon plaie » ; elle plantait un trait de lumière, le coup de
   * poignard, rendu à `git log`) : une amande de lumière qui S'OUVRE SUR SA
   * LONGUEUR, du point touché vers ses deux bouts (Keko : « fais-les s'ouvrir
   * sur la longueur », du milieu vers les bouts ; une coupe fine traçait la
   * diagonale, puis s'élargissait), toute en lumière comme les autres coups
   * (Keko : « pas de noir » ; une chair sombre l'emplissait), reste ouverte
   * un instant et s'efface telle quelle. Centrée sur le point touché, un coup
   * sur deux de l'autre côté. Le critique ne l'allonge pas, il l'ouvre plus
   * grand (l'écart de `k` doublé, comme le poignard l'épaississait).
   */
  let coteDuPoignard = 1
  let pointDuPoignard: [number, number] = [0.5, 0.45]
  function plaie(x: number, y: number, k: number, couleur: string, angle: number): void {
    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize)
    const longueur = 4.2 * rem
    // Moins épaisse (Keko ; 0,42).
    const largeur = 0.28 * rem * (1 + (k - 1) * 2)
    const a = (angle * Math.PI) / 180
    const [dx, dy] = [Math.cos(a), Math.sin(a)]
    const trace = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    trace.setAttribute('class', 'donjon-course')
    trace.setAttribute('aria-hidden', 'true')
    const demi = longueur / 2 + 3 * largeur
    trace.setAttribute('viewBox', `${-demi} ${-demi} ${2 * demi} ${2 * demi}`)
    trace.style.width = trace.style.height = `${2 * demi}px`
    trace.style.left = `${x - demi}px`
    trace.style.top = `${y - demi}px`
    trace.style.color = couleur
    const levres = document.createElementNS('http://www.w3.org/2000/svg', 'path')
    trace.append(levres)
    scene.append(trace)
    // Une amande pointue aux deux bouts, de `debut` à `fin` le long de la
    // coupe (0 et 1 : ses deux bouts), de demi-ouverture `h` au milieu.
    const amande = (forme: SVGPathElement, debut: number, fin: number, h: number) => {
      if (fin - debut < 0.01 || h <= 0) return forme.setAttribute('d', '')
      const dehors: string[] = []
      const dedans: string[] = []
      for (let i = 0; i <= 24; i++) {
        const v = i / 24
        const e = h * Math.sin(Math.PI * v) ** 0.8
        const le = (debut + (fin - debut) * v - 0.5) * longueur
        const [cx, cy] = [dx * le, dy * le]
        dehors.push(`${(cx - dy * e).toFixed(1)} ${(cy + dx * e).toFixed(1)}`)
        dedans.push(`${(cx + dy * e).toFixed(1)} ${(cy - dx * e).toFixed(1)}`)
      }
      forme.setAttribute('d', `M${dehors.join(' L')} L${dedans.reverse().join(' L')}Z`)
    }
    const depart = performance.now()
    const image = (maintenant: number) => {
      const t = maintenant - depart
      if (t < OUVERTURE_PLAIE) {
        // Elle s'allonge du point vers ses deux bouts, vite puis en
        // ralentissant, et s'élargit un peu avec sa longueur (courte et
        // pleine, elle serait ronde).
        const p = 1 - (1 - t / OUVERTURE_PLAIE) ** 3
        amande(levres, 0.5 - p / 2, 0.5 + p / 2, largeur * (0.35 + 0.65 * p))
      } else if (t < OUVERTURE_PLAIE + TENUE_PLAIE + FONDU_PLAIE) {
        // Ouverte, puis effacée telle quelle.
        amande(levres, 0, 1, largeur)
        const q = Math.max(0, (t - OUVERTURE_PLAIE - TENUE_PLAIE) / FONDU_PLAIE)
        trace.style.opacity = `${1 - q}`
      } else {
        trace.remove()
        return
      }
      requestAnimationFrame(image)
    }
    image(depart)
  }

  /**
   * LE COUP DE BÂTON, EN MASSUE (Keko : « un effet de slash avec la partie
   * avant arrondie, en mode coup de club » — puis « c'est toujours
   * l'extrémité du slash qui tape, comme s'il se plantait ; un slash club,
   * c'est l'arc qui tape ») : un TRAIT DE LUMIÈRE qui BALAIE un arc large À
   * TRAVERS l'ennemi, comme l'entaille de l'épée — le milieu de l'arc passe
   * sur le point touché —, effilé à la queue, qui s'ÉPAISSIT vers l'avant et
   * finit en TÊTE RONDE. Le trait gonfle quand la tête passe au point (le
   * choc), continue sa course de l'autre côté, puis s'efface, la queue
   * rattrapant la tête. L'arc bombe vers le haut, penché au hasard (`penche`),
   * un coup sur deux dans l'autre sens. Redessiné à chaque image, comme le
   * poignard. Le critique est 1,4 fois plus gros.
   */
  let coteDeLaMassue = 1
  let pencheDeLaMassue = 0
  function massue(x: number, y: number, k: number, couleur: string, penche: number, cote: number, longue = false): void {
    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize)
    // LA VERSION LONGUE (`longue`, les massues à deux mains et les bâtons) :
    // un arc plus grand et plus ample, un trait plus épais, une course plus lente.
    const rayon = (longue ? 7.6 : 6.5) * rem * k
    const largeur = (longue ? 0.65 : 0.55) * rem * k
    const balayage = longue ? BALAYAGE_LONG : BALAYAGE_MASSUE
    const contact = longue ? CONTACT_LONG : CONTACT_BATON
    const vidange = longue ? VIDANGE_LONG : VIDANGE_MASSUE
    // Le milieu de l'arc sur le point, son centre en dessous : l'arc bombe vers le haut.
    const milieu = -90 + penche
    const debut = milieu - (cote * balayage) / 2
    const fin = milieu + (cote * balayage) / 2
    const a = (milieu * Math.PI) / 180
    const trace = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    trace.setAttribute('class', 'donjon-course')
    trace.setAttribute('aria-hidden', 'true')
    const demi = rayon + 3 * largeur
    trace.setAttribute('viewBox', `${-demi} ${-demi} ${2 * demi} ${2 * demi}`)
    trace.style.width = trace.style.height = `${2 * demi}px`
    trace.style.left = `${x - Math.cos(a) * rayon - demi}px`
    trace.style.top = `${y - Math.sin(a) * rayon - demi}px`
    trace.style.color = couleur
    const forme = document.createElementNS('http://www.w3.org/2000/svg', 'path')
    trace.append(forme)
    scene.append(trace)
    const point = (t: number, r: number) => `${(Math.cos(t) * r).toFixed(1)} ${(Math.sin(t) * r).toFixed(1)}`
    // Le trait entre `queue` et `tete` (0 = départ de l'arc, ½ = le point
    // touché, 1 = sa fin) : effilé à la queue, plein dès les deux cinquièmes (un manche), fermé
    // devant par un demi-cercle qui bombe dans le sens de la course.
    const dessiner = (queue: number, tete: number, gonfle: number) => {
      if (tete - queue < 0.01) return forme.setAttribute('d', '')
      const dehors: string[] = []
      const dedans: string[] = []
      let h = 0
      for (let i = 0; i <= 20; i++) {
        const v = i / 20
        h = largeur * gonfle * Math.min(1, v / 0.4) ** 1.3
        const t = ((debut + (fin - debut) * (queue + (tete - queue) * v)) * Math.PI) / 180
        dehors.push(point(t, rayon + h))
        dedans.push(point(t, rayon - h))
      }
      const bout = dedans.pop()!
      forme.setAttribute('d', `M${dehors.join(' L')} A${h.toFixed(1)} ${h.toFixed(1)} 0 0 ${cote > 0 ? 1 : 0} ${bout} L${dedans.reverse().join(' L')}Z`)
    }
    const depart = performance.now()
    const course = 2 * contact
    const image = (maintenant: number) => {
      const t = maintenant - depart
      if (t < course) {
        // La tête balaie l'arc ; le trait gonfle quand elle passe au point.
        const p = t / course
        const choc = Math.exp(-(((t - contact) / 28) ** 2))
        dessiner(Math.max(0, p - 0.95), p, 0.85 + 0.15 * p + 0.35 * choc)
      } else if (t < course + vidange) {
        // La queue rattrape la tête, et le trait s'efface.
        const q = (t - course) / vidange
        dessiner(0.05 + 0.95 * q, 1, 1 - 0.3 * q)
        trace.style.opacity = `${1 - q * q}`
      } else {
        trace.remove()
        return
      }
      requestAnimationFrame(image)
    }
    image(depart)
  }

  /**
   * LE COUP DE MARTEAU (Keko : « un arc comme la massue, mais à bout plat, qui
   * vient taper et finit avec le plat horizontal ») : le trait de la massue,
   * effilé à la queue et plein devant, mais COUPÉ À PLAT au bout, qui TOMBE
   * sur un arc dont le centre est à côté du point, à sa hauteur : la tête
   * arrive d'en haut, en accélérant, et S'ARRÊTE sur le point en descendant
   * à la verticale, son plat à l'horizontale. Elle gonfle au choc, reste
   * posée un instant, puis s'efface telle quelle. Un coup sur deux de l'autre
   * côté, et le tout PENCHÉ au hasard autour du point (Keko : « tape à
   * différents angles aussi »). Plus court, la TÊTE ÉLARGIE au bout (Keko :
   * « moins long et extrémité plus large » ; 6 rem, la traînée sur 85 % de
   * l'arc, de la même largeur jusqu'au plat). Le critique est 1,4 fois plus gros.
   * LA VERSION LOURDE (`lourd`, le marteau à deux mains ; Keko : « une
   * version deux mains ? ») : un arc plus grand et plus ample, un trait plus
   * épais, une chute plus lente, posé plus longtemps.
   */
  let coteDuMarteau = 1
  let pencheDuMarteau = 0
  function marteau(x: number, y: number, k: number, couleur: string, lourd = false): void {
    coteDuMarteau = -coteDuMarteau
    const cote = coteDuMarteau
    // Penché de ±35°, et d'au moins 20° de plus ou de moins que le précédent.
    let penche = 0
    for (let essai = 0; essai < 8; essai++) {
      penche = (Math.random() - 0.5) * 70
      if (Math.abs(penche - pencheDuMarteau) >= 20) break
    }
    pencheDuMarteau = penche
    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize)
    const rayon = (lourd ? 6.5 : 5) * rem * k
    const largeur = (lourd ? 0.8 : 0.6) * rem * k
    const contact = lourd ? CONTACT_MARTEAU_LOURD : CONTACT_MARTEAU
    const tenue = lourd ? TENUE_MARTEAU_LOURD : TENUE_MARTEAU
    // Le point à l'horizontale du centre (à sa droite, ou à sa gauche), penché.
    const fin = (cote > 0 ? 0 : 180) + penche
    const debut = fin - cote * (lourd ? BALAYAGE_MARTEAU_LOURD : BALAYAGE_MARTEAU)
    const a = (fin * Math.PI) / 180
    const trace = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    trace.setAttribute('class', 'donjon-course')
    trace.setAttribute('aria-hidden', 'true')
    const demi = rayon + 3 * largeur
    trace.setAttribute('viewBox', `${-demi} ${-demi} ${2 * demi} ${2 * demi}`)
    trace.style.width = trace.style.height = `${2 * demi}px`
    trace.style.left = `${x - Math.cos(a) * rayon - demi}px`
    trace.style.top = `${y - Math.sin(a) * rayon - demi}px`
    trace.style.color = couleur
    const forme = document.createElementNS('http://www.w3.org/2000/svg', 'path')
    trace.append(forme)
    scene.append(trace)
    const point = (t: number, r: number) => `${(Math.cos(t) * r).toFixed(1)} ${(Math.sin(t) * r).toFixed(1)}`
    // Le trait entre `queue` et `tete` (0 = départ de l'arc, 1 = le point) :
    // pointu à la queue, il S'ÉLARGIT D'UN SEUL TENANT jusqu'à la tête (×1,7)
    // et finit coupé à plat (Keko : « pas en arc lisse, il y a comme un angle
    // bizarre » : plein dès les deux cinquièmes, il se renflait en tête sur
    // son dernier quart, et le bord faisait un coude), sur 40 pas ; PLEIN
    // (Keko : « un peu plus plein, moins transparent » : en `v^1,5`, sa moitié
    // arrière n'était qu'un fil où la lueur dominait).
    const dessiner = (queue: number, tete: number, gonfle: number) => {
      if (tete - queue < 0.01) return forme.setAttribute('d', '')
      const dehors: string[] = []
      const dedans: string[] = []
      for (let i = 0; i <= 40; i++) {
        const v = i / 40
        const h = largeur * gonfle * 1.7 * v ** 0.8
        const t = ((debut + (fin - debut) * (queue + (tete - queue) * v)) * Math.PI) / 180
        dehors.push(point(t, rayon + h))
        dedans.push(point(t, rayon - h))
      }
      forme.setAttribute('d', `M${dehors.join(' L')} L${dedans.reverse().join(' L')}Z`)
    }
    const depart = performance.now()
    const image = (maintenant: number) => {
      const t = maintenant - depart
      if (t < contact) {
        // Il tombe en accélérant ; la traînée s'allonge avec la vitesse.
        const p = (t / contact) ** 2
        dessiner(Math.max(0, p - 0.6), p, 0.85 + 0.15 * p)
      } else if (t < contact + tenue + FONDU_MARTEAU) {
        // Posé : il gonfle au choc et se rassied, puis s'efface tel quel, opaque
        // plus longtemps (le fondu accélère ; régulier, il passait la plupart
        // de son temps posé à demi transparent).
        const ms = t - contact
        dessiner(0.4, 1, 1 + 0.35 * Math.max(0, 1 - ms / 60))
        trace.style.opacity = `${1 - Math.max(0, (ms - tenue) / FONDU_MARTEAU) ** 2}`
      } else {
        trace.remove()
        return
      }
      requestAnimationFrame(image)
    }
    image(depart)
  }

  /**
   * LE CERCLE DE RUNE (le premier coup de bâton ; Keko : « on laisse les
   * runes de côté, on utilisera ça ailleurs ») : deux cercles, l'intérieur
   * en pointillé, et huit losanges, qui s'ouvrent en tournant au point
   * touché puis s'effacent. Rangé ; `&rune` le rend au bâton.
   */
  let sensDeLaRune = 1
  function cercleDeRune(x: number, y: number, k: number, couleur: string, retard: number): void {
    sensDeLaRune = -sensDeLaRune
    const c = el('div', 'donjon-rune-cercle')
    const losanges = Array.from({ length: 8 }, (_, i) => `<path transform="rotate(${i * 45}) translate(0 -39)" d="M0 -4.2 L2.4 0 L0 4.2 L-2.4 0Z"/>`).join('')
    c.innerHTML = `<svg viewBox="-50 -50 100 100" aria-hidden="true"><circle r="45" stroke-width="2.4"/><circle r="33" stroke-width="1.3" stroke-dasharray="5 4"/>${losanges}</svg>`
    c.style.left = `${x}px`
    c.style.top = `${y}px`
    c.style.color = couleur
    c.style.opacity = '0'
    scene.append(c)
    const tour = (r: number, s: number) => `translate(-50%, -50%) rotate(${r * sensDeLaRune}deg) scale(${s * k})`
    c.animate(
      [
        { transform: tour(-25, 0.45), opacity: 0, easing: 'cubic-bezier(0.1, 0.8, 0.3, 1)' },
        { transform: tour(5, 0.95), opacity: 1, offset: 0.3, easing: 'ease-out' },
        { transform: tour(30, 1.08), opacity: 0 },
      ],
      { duration: 480, delay: retard },
    ).onfinish = () => c.remove()
  }

  /** L'anneau qui se referme sur le point, quand la pointe entre (celui du poing s'ouvre). */
  function anneauQuiSeReferme(x: number, y: number, k: number, couleur: string, retard: number): void {
    const o = el('div', 'donjon-onde')
    o.style.left = `${x}px`
    o.style.top = `${y}px`
    o.style.color = couleur
    scene.append(o)
    o.animate(
      [
        { transform: `translate(-50%, -50%) scale(${0.55 * k})`, opacity: 0, borderWidth: '0.08rem', easing: 'ease-in' },
        { transform: `translate(-50%, -50%) scale(${0.45 * k})`, opacity: 0.9, borderWidth: '0.12rem', offset: 0.2, easing: 'cubic-bezier(0.4, 0, 1, 1)' },
        { transform: 'translate(-50%, -50%) scale(0.05)', opacity: 0.2, borderWidth: '0.5rem' },
      ],
      { duration: 170, delay: retard, fill: 'backwards' },
    ).onfinish = () => o.remove()
  }

  function impact(x: number, y: number, genre: Genre, couleur: string): void {
    const fort = STYLES[genre].onde
    // L'attaque et l'auto de l'épée tranchent, celles de la dague piquent,
    // celles du bâton écrasent ; le reste (mains nues, capacités) frappe
    // d'une onde ronde.
    const arme = genre.startsWith('capacite') ? null : moi().arme
    // Les épées et les haches tranchent, les armes à deux mains en lourd (elles
    // fendent de haut en bas) ; le trait des épées est DROIT, celui des haches
    // en croissant.
    const lourde = arme === 'deuxMains' || arme === 'hacheDeuxMains'
    const lame = arme === 'epee' || arme === 'hache' || lourde
    const droite = arme === 'epee' || arme === 'deuxMains'
    let angleLourd = 90
    let aPlat = false
    // L'arc tire la flèche, l'arbalète son gros carreau ; la dague ouvre une
    // plaie (ou tire la flèche, `&fleche`).
    const enArbalete = arme === 'arbalete'
    const enFleche = arme === 'arc' || enArbalete || (arme === 'dague' && FLECHE)
    // La lance aussi pique, mais d'un estoc qui se retire ; la rapière aussi,
    // d'une aiguille.
    const enRapiere = arme === 'rapiere'
    const enLance = arme === 'lance' || enRapiere
    const pique = arme === 'dague' || arme === 'arc' || enArbalete || enLance
    // Les massues et le bâton cognent ; les armes à deux mains (le bâton en
    // est une) en version longue.
    // Le marteau aussi, mais il tombe et ÉCRASE (Keko : « avec écrasement,
    // comme le faisait le bâton avant »).
    const enMarteau = arme === 'marteau' || arme === 'marteauDeuxMains'
    const marteauLourd = arme === 'marteauDeuxMains'
    // Le pistolet explose au point touché.
    const enFeu = arme === 'pistolet' || arme === 'mousquet'
    const feuLourd = arme === 'mousquet'
    // Le fouet claque ; le fléau tombe et écrase, comme le marteau.
    const enFouet = arme === 'fouet'
    const enFleau = arme === 'fleau'
    const masse = arme === 'baton' || arme === 'massue' || arme === 'massueDeuxMains' || enMarteau || enFleau
    const longue = arme === 'baton' || arme === 'massueDeuxMains'
    // La massue frappe l'ennemi EN SON CENTRE, pas au point du coup comme les
    // lames (Keko : « pas comme la dague ») ; le chiffre reste où il est.
    if (masse && !enMarteau && !enFleau) {
      const { x0, y0, l, h } = cadreDuDessin()
      x = x0 + l * 0.5
      y = y0 + h * 0.45
    }
    // La dague se plante PARTOUT SUR LE DESSIN (Keko : « les dagues se plantent
    // toujours en haut à gauche de la cible, on peut pas varier ? ») : au
    // hasard sur la moitié du milieu en largeur et de 25 à 65 % de la hauteur,
    // et loin du coup d'avant (un cinquième du dessin au moins) ; le chiffre
    // reste où il est. Le marteau aussi (Keko : « il ne tape que le haut du
    // corps, il faudrait diversifier » ; il frappait au centre, comme la massue).
    if ((arme === 'dague' && !FLECHE) || enMarteau || enFeu || enFouet || enFleau) {
      const { x0, y0, l, h } = cadreDuDessin()
      let fx = 0.5
      let fy = 0.45
      for (let essai = 0; essai < 8; essai++) {
        fx = 0.5 + (Math.random() - 0.5) * 0.5
        fy = 0.45 + (Math.random() - 0.5) * 0.4
        if (Math.hypot(fx - pointDuPoignard[0], fy - pointDuPoignard[1]) >= 0.2) break
      }
      pointDuPoignard = [fx, fy]
      x = x0 + l * fx
      y = y0 + h * fy
    }
    // Le hasard de l'écran, pas celui des règles.
    const angleLame = -30 + (Math.random() - 0.5) * 40
    // La direction du coup : la flèche monte du bas ; la plaie de la dague
    // est coupée en diagonale vers le bas (35° sous l'horizontale, ±15°), un
    // coup sur deux de l'autre côté.
    if (pique && !enFleche && !enLance) coteDuPoignard = -coteDuPoignard
    // La lance monte du bas, penchée d'un côté puis de l'autre.
    if (enLance) coteDeLaLance = -coteDeLaLance
    const anglePique = enLance
      ? -90 + coteDeLaLance * 18 + (Math.random() - 0.5) * 24
      : enFleche
        ? -90 + (Math.random() - 0.5) * 70
        : (coteDuPoignard > 0 ? 35 : 145) + (Math.random() - 0.5) * 30
    // L'entaille lourde passe au point vers 90 ms : le choc l'attend.
    const contact = enFeu ? CONTACT_BALLE : enFouet ? CONTACT_FOUET : enFleau ? CONTACT_FLEAU : pique ? (enLance ? CONTACT_LANCE : enFleche ? 50 : CONTACT_PLAIE) : masse ? (enMarteau ? (marteauLourd ? CONTACT_MARTEAU_LOURD : CONTACT_MARTEAU) : longue ? CONTACT_LONG : CONTACT_BATON) : lourde ? 90 : 0
    if (enFeu) {
      explosion(x, y, 1 + 0.65 * (fort - 1), couleur, feuLourd)
      // La scène tressaute, sèche, d'un côté puis de l'autre (le critique a sa
      // secousse) ; sous le mousquet, plus fort et plus long.
      if (!STYLES[genre].secousse) {
        const a = Math.random() * 2 * Math.PI
        const d = feuLourd ? 11 : 8
        const pas = (u: number) => `translate(${Math.cos(a) * d * u}px, ${Math.sin(a) * d * u}px)`
        scene.animate([{ transform: 'none' }, { transform: pas(1), offset: 0.2 }, { transform: pas(-0.8), offset: 0.45 }, { transform: pas(0.4), offset: 0.7 }, { transform: 'none' }], { duration: feuLourd ? 280 : 230, delay: contact, easing: 'ease-out' })
      }
    } else if (enMarteau) {
      const k = 1 + 0.65 * (fort - 1)
      marteau(x, y, k, couleur, marteauLourd)
      // La scène est tassée vers le bas, d'un vrai coup (le critique a sa
      // secousse) ; sous les deux mains, plus fort et plus long.
      if (!STYLES[genre].secousse) {
        const d = marteauLourd ? 11 : 7
        scene.animate([{ transform: 'none' }, { transform: `translateY(${d}px)`, offset: 0.25 }, { transform: `translateY(${-d * 0.3}px)`, offset: 0.55 }, { transform: 'none' }], { duration: marteauLourd ? 260 : 200, delay: contact, easing: 'ease-out' })
      }
    } else if (enFouet) {
      const k = 1 + 0.65 * (fort - 1)
      fouet(x, y, k, couleur)
      claquement(x, y, k, couleur, contact)
      // La scène sursaute, sèche (le critique a sa secousse).
      if (!STYLES[genre].secousse) {
        const a = Math.random() * 2 * Math.PI
        scene.animate([{ transform: 'none' }, { transform: `translate(${Math.cos(a) * 4}px, ${Math.sin(a) * 4}px)`, offset: 0.25 }, { transform: 'none' }], { duration: 110, delay: contact, easing: 'ease-out' })
      }
    } else if (enFleau) {
      fleau(x, y, 1 + 0.65 * (fort - 1), couleur)
      // La scène est tassée vers le bas, comme sous le marteau (le critique a sa secousse).
      if (!STYLES[genre].secousse) {
        scene.animate([{ transform: 'none' }, { transform: 'translateY(7px)', offset: 0.25 }, { transform: 'translateY(-2px)', offset: 0.55 }, { transform: 'none' }], { duration: 200, delay: contact, easing: 'ease-out' })
      }
    } else if (masse) {
      // La massue balaie à travers l'ennemi, penchée au hasard, un coup sur
      // deux dans l'autre sens.
      const k = 1 + 0.65 * (fort - 1)
      coteDeLaMassue = -coteDeLaMassue
      // Penchée de ±50°, et d'au moins 25° de plus ou de moins que la
      // précédente (Keko : « l'angle de frappe est quasi toujours le même »).
      let penche = 0
      for (let essai = 0; essai < 8; essai++) {
        penche = (Math.random() - 0.5) * 100
        if (Math.abs(penche - pencheDeLaMassue) >= 25) break
      }
      pencheDeLaMassue = penche
      massue(x, y, k, couleur, penche, coteDeLaMassue, longue)
      if (RUNE) cercleDeRune(x, y, k, couleur, contact)
      // La scène est tassée d'un cran vers le bas (le critique a sa secousse).
      if (!STYLES[genre].secousse) {
        scene.animate([{ transform: 'none' }, { transform: 'translateY(4px)', offset: 0.3 }, { transform: 'none' }], { duration: 140, delay: contact, easing: 'ease-out' })
      }
    } else if (pique) {
      const k = 1 + 0.65 * (fort - 1)
      if (enLance) lance(x, y, k, couleur, anglePique, enRapiere)
      else if (enFleche) fleche(x, y, k, couleur, anglePique, enArbalete)
      else plaie(x, y, k, couleur, anglePique)
      anneauQuiSeReferme(x, y, k, couleur, contact - 5)
      // La scène est poussée d'un cran dans l'axe du coup (le critique a sa
      // secousse) ; sous la lance, d'un vrai coup, qui rebondit (Keko : « ça
      // manque encore un peu d'impact, on peut augmenter le shake ? »).
      if (!STYLES[genre].secousse) {
        const a = (anglePique * Math.PI) / 180
        const pas = (d: number) => `translate(${Math.cos(a) * d}px, ${Math.sin(a) * d}px)`
        if (enLance || enArbalete) {
          const d = enRapiere ? 5 : enLance ? 9 : 7
          scene.animate([{ transform: 'none' }, { transform: pas(d), offset: 0.2 }, { transform: pas(-d / 3), offset: 0.5 }, { transform: pas(d / 6), offset: 0.75 }, { transform: 'none' }], { duration: 240, delay: contact, easing: 'ease-out' })
        }
        else scene.animate([{ transform: 'none' }, { transform: pas(3), offset: 0.3 }, { transform: 'none' }], { duration: 130, delay: contact, easing: 'ease-out' })
      }
    } else if (lourde) {
      // UN ANGLE CONTINU, de la fauche à plat à la fente de haut en bas, tiré
      // au hasard (Keko : « elles tapent uniquement verticalement », puis
      // « ça fait trop vertical ou horizontal, il faudrait un angle
      // continu ») : un coup sur deux elle vient de la gauche (0° à 90°), un
      // coup sur deux de la droite (180° à 90°). Le croissant bombe du côté
      // d'où vient la lame. Près de la verticale (à 25° près), l'ennemi est
      // tassé ; sinon, poussé dans le sens de la lame.
      sensDeLaLame = -sensDeLaLame
      const ouverture = Math.random() * 90
      const angle = sensDeLaLame > 0 ? ouverture : 180 - ouverture
      aPlat = ouverture < 65
      entaille(x, y, fort, couleur, angle, 1, 0, true, sensDeLaLame, droite)
      angleLourd = angle
      // La scène est enfoncée dans le sens du coup, plus fort que sous l'épée
      // (le critique a sa secousse).
      if (!STYLES[genre].secousse) {
        const a = (angle * Math.PI) / 180
        const pas = (d: number) => `translate(${Math.cos(a) * d}px, ${Math.sin(a) * d}px)`
        scene.animate([{ transform: 'none' }, { transform: pas(7), offset: 0.25 }, { transform: pas(-2), offset: 0.6 }, { transform: 'none' }], { duration: 200, delay: contact, easing: 'ease-out' })
      }
    } else if (lame) {
      sensDeLaLame = -sensDeLaLame
      entaille(x, y, fort, couleur, angleLame * sensDeLaLame, sensDeLaLame, 0, false, 1, droite)
      // La scène bouge d'un cran dans le sens de la lame (le critique a sa secousse).
      if (!STYLES[genre].secousse) {
        const a = (angleLame * sensDeLaLame * Math.PI) / 180
        const d = 4 * sensDeLaLame
        scene.animate([{ transform: 'none' }, { transform: `translate(${Math.cos(a) * d}px, ${Math.sin(a) * d}px)`, offset: 0.25 }, { transform: 'none' }], { duration: 120, easing: 'ease-out' })
      }
    } else {
      impactRond(x, y, fort, couleur)
    }

    const combien = STYLES[genre].particules + (lourde ? 8 : lame ? 4 : feuLourd ? 18 : enFeu ? 12 : enFouet ? 4 : 0)
    const trait = lame || pique || enFeu || enFouet
    for (let i = 0; i < combien; i++) {
      const p = el('div', trait ? 'donjon-particule trait' : masse ? 'donjon-particule lueur' : 'donjon-particule')
      p.style.left = `${x}px`
      p.style.top = `${y}px`
      p.style.background = couleur
      scene.append(p)
      // Le hasard de l'écran, pas celui des règles. Sous la lame, les
      // étincelles filent le long de l'entaille, des deux côtés ; sous l'estoc,
      // elles jaillissent de la plaie, en gerbe serrée vers celui qui frappe.
      const angle = lourde
        ? ((angleLourd + (i % 2) * 180 + (Math.random() - 0.5) * 70) * Math.PI) / 180
        : lame
        ? ((angleLame * sensDeLaLame + (i % 2) * 180 + (Math.random() - 0.5) * 50) * Math.PI) / 180
        : pique
          ? ((anglePique + (enLance ? 0 : 180) + (Math.random() - 0.5) * 80) * Math.PI) / 180
          : ((i + Math.random() * 0.8) / combien) * 2 * Math.PI
      const loin = (28 + Math.random() * 34) * fort * (feuLourd ? 2.5 : lourde || enFeu ? 2 : lame ? 1.7 : pique ? 1.2 : 1)
      const dx = Math.cos(angle) * loin
      const dy = Math.sin(angle) * loin
      // Sous le bâton, des points de lumière s'écartent à peine et MONTENT,
      // lentement, comme des braises de magie.
      if (masse) {
        const d = loin * 0.45
        p.style.opacity = '0'
        p.animate(
          [
            { transform: 'translate(-50%, -50%) scale(1.3)', opacity: 1 },
            { transform: `translate(calc(-50% + ${Math.cos(angle) * d}px), calc(-50% + ${Math.sin(angle) * d * 0.5}px)) scale(1)`, opacity: 1, offset: 0.3 },
            { transform: `translate(calc(-50% + ${Math.cos(angle) * d * 1.2}px), calc(-50% + ${Math.sin(angle) * d * 0.5 - 30 - Math.random() * 25}px)) scale(0.3)`, opacity: 0 },
          ],
          { duration: 600 + Math.random() * 250, delay: contact, easing: 'cubic-bezier(0.2, 0.7, 0.4, 1)' },
        ).onfinish = () => p.remove()
        continue
      }
      // Les traits filent droit, couchés sur leur course, et vite ; ceux de
      // l'estoc partent quand la pointe entre.
      if (trait) {
        const r = `rotate(${angle}rad)`
        if (contact > 0) p.style.opacity = '0'
        p.animate(
          [
            { transform: `translate(-50%, -50%) ${r} scaleX(1.6)`, opacity: 1 },
            { transform: `translate(calc(-50% + ${dx * 0.85}px), calc(-50% + ${dy * 0.85}px)) ${r} scaleX(1)`, opacity: 1, offset: 0.5 },
            { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy + 6}px)) ${r} scaleX(0.2)`, opacity: 0 },
          ],
          { duration: 260 + Math.random() * 140, delay: contact, easing: 'cubic-bezier(0.05, 0.9, 0.2, 1)' },
        ).onfinish = () => p.remove()
        continue
      }
      p.animate(
        [
          { transform: 'translate(-50%, -50%) scale(1)', opacity: 1 },
          { transform: `translate(calc(-50% + ${dx * 0.8}px), calc(-50% + ${dy * 0.8}px)) scale(0.8)`, opacity: 1, offset: 0.55 },
          { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy + 14}px)) scale(0.2)`, opacity: 0 },
        ],
        { duration: 380 + Math.random() * 200, easing: 'cubic-bezier(0.1, 0.8, 0.3, 1)' },
      ).onfinish = () => p.remove()
    }
    // Fendu, l'ennemi est tassé ; fauché à plat, poussé dans le sens de la lame.
    const axe = pique ? (anglePique * Math.PI) / 180 : aPlat ? (angleLourd * Math.PI) / 180 : undefined
    // Sous la massue, plus d'écrasement : il recule comme sous l'épée (Keko) ;
    // le marteau, lui, écrase.
    reculer(x, genre, lourde || marteauLourd || feuLourd ? 150 : longue || enMarteau || enFleau || enArbalete ? 120 : enFeu ? 90 : lame || pique || masse || enFouet ? 70 : 0, axe, contact, (lourde && !aPlat) || enMarteau || enFleau)
  }

  /**
   * LE COUP DE FOUET (Keko : « essayons la catégorie fouet, chaîne, fléau ») :
   * un trait de lumière, épais au manche et fin au bout, qui SE DÉROULE d'en
   * bas (d'un côté puis de l'autre) sur une courbe, parcouru d'une onde qui
   * file vers le bout ; le bout accélère, la courbe SE TEND en arrivant sur le
   * point — le contact, où il CLAQUE (`claquement`) —, une dernière onde le
   * secoue, puis il s'efface. Le critique l'épaissit. Sa courbe est un S
   * (Keko : « il ressemble à un projectile courbé, il faudrait rajouter une
   * deuxième courbe au bout » ; il bombait d'un seul côté) : elle bombe d'un
   * côté près du manche, et repart de l'autre, plus fort, vers le bout. Ce
   * n'est pas sa pointe qui frappe, c'est le VENTRE DE SA DEUXIÈME COURBE
   * (Keko : « l'impact devrait se faire à l'arc de la deuxième courbe plutôt
   * qu'à la pointe ») : tendu, il le pose sur le point, la pointe au-delà.
   * (Un balancier autour du manche a été essayé et retiré : « non, ça va
   * pas ».)
   */
  let coteDuFouet = 1
  function fouet(x: number, y: number, k: number, couleur: string): void {
    coteDuFouet = -coteDuFouet
    const cote = coteDuFouet
    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize)
    const longueur = 8 * rem
    const largeur = 0.2 * rem * (1 + (k - 1) * 2)
    // D'où il part : d'en bas, d'un côté puis de l'autre, penché au hasard ;
    // la courbe en S, celle d'un fouet lancé (le point est en 0, 0) : deux
    // points de contrôle, au tiers et aux deux tiers, de part et d'autre.
    const depuis = ((90 + cote * 45 + (Math.random() - 0.5) * 30) * Math.PI) / 180
    const [ox, oy] = [Math.cos(depuis) * longueur, Math.sin(depuis) * longueur]
    const [nx, ny] = [-Math.sin(depuis) * cote, Math.cos(depuis) * cote]
    const [c1x, c1y] = [(ox * 2) / 3 + nx * 0.4 * longueur, (oy * 2) / 3 + ny * 0.4 * longueur]
    const [c2x, c2y] = [ox / 3 - nx * 0.55 * longueur, oy / 3 - ny * 0.55 * longueur]
    const courbe = (s: number): [number, number] => {
      const u = 1 - s
      return [u * u * u * ox + 3 * u * u * s * c1x + 3 * u * s * s * c2x, u * u * u * oy + 3 * u * u * s * c1y + 3 * u * s * s * c2y]
    }
    // Le ventre de la deuxième courbe : sur la seconde moitié, le point le plus
    // écarté de la corde, du côté de la seconde bosse. Tout le fouet est
    // décalé pour qu'il tombe sur le point touché (0, 0).
    let ventre = 0.75
    let ecart = -Infinity
    for (let s = 0.5; s <= 1; s += 0.01) {
      const [bx, by] = courbe(s)
      const e = -(bx * nx + by * ny)
      if (e > ecart) [ecart, ventre] = [e, s]
    }
    const [dx, dy] = courbe(ventre).map((v) => -v)
    const trace = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    trace.setAttribute('class', 'donjon-course')
    trace.setAttribute('aria-hidden', 'true')
    const demi = longueur * 1.25 + Math.hypot(dx, dy)
    trace.setAttribute('viewBox', `${-demi} ${-demi} ${2 * demi} ${2 * demi}`)
    trace.style.width = trace.style.height = `${2 * demi}px`
    trace.style.left = `${x - demi}px`
    trace.style.top = `${y - demi}px`
    trace.style.color = couleur
    const forme = document.createElementNS('http://www.w3.org/2000/svg', 'path')
    trace.append(forme)
    scene.append(trace)
    // Le fouet du manche (0) jusqu'à `fin` (1 = la pointe), écarté de sa courbe
    // par une onde d'`ampleur`, décalée de `phase`.
    const dessiner = (fin: number, ampleur: number, phase: number) => {
      if (fin < 0.01) return forme.setAttribute('d', '')
      const dehors: string[] = []
      const dedans: string[] = []
      for (let i = 0; i <= 40; i++) {
        const s = (fin * i) / 40
        const u = 1 - s
        const [bx, by] = courbe(s).map((v, n) => v + (n === 0 ? dx : dy))
        let tx = 3 * u * u * (c1x - ox) + 6 * u * s * (c2x - c1x) - 3 * s * s * c2x
        let ty = 3 * u * u * (c1y - oy) + 6 * u * s * (c2y - c1y) - 3 * s * s * c2y
        const n = Math.hypot(tx, ty) || 1
        tx /= n
        ty /= n
        const onde = ampleur * Math.sin(3 * Math.PI * s - phase) * Math.sin(Math.PI * s)
        const [px, py] = [bx - ty * onde, by + tx * onde]
        const h = largeur * (1 - 0.8 * s) * Math.min(1, s / 0.08)
        dehors.push(`${(px - ty * h).toFixed(1)} ${(py + tx * h).toFixed(1)}`)
        dedans.push(`${(px + ty * h).toFixed(1)} ${(py - tx * h).toFixed(1)}`)
      }
      forme.setAttribute('d', `M${dehors.join(' L')} L${dedans.reverse().join(' L')}Z`)
    }
    const depart = performance.now()
    const image = (maintenant: number) => {
      const t = maintenant - depart
      if (t < CONTACT_FOUET) {
        // Il se déroule en accélérant ; l'onde s'aplatit à mesure qu'il se tend.
        const p = (t / CONTACT_FOUET) ** 2
        dessiner(p, 0.9 * rem * (1 - p), (9 * t) / CONTACT_FOUET)
      } else if (t < CONTACT_FOUET + 70) {
        // Le claquement le secoue d'une dernière onde.
        const q = (t - CONTACT_FOUET) / 70
        dessiner(1, 0.45 * rem * Math.sin(Math.PI * q), 9 + 6 * q)
      } else if (t < CONTACT_FOUET + 70 + 140) {
        const q = (t - CONTACT_FOUET - 70) / 140
        dessiner(1, 0, 15)
        trace.style.opacity = `${1 - q * q}`
      } else {
        trace.remove()
        return
      }
      requestAnimationFrame(image)
    }
    image(depart)
  }

  /** Le claquement du fouet : huit rayons fins qui jaillissent du point et s'éteignent, très vite. */
  function claquement(x: number, y: number, k: number, couleur: string, retard: number): void {
    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize)
    const rayon = 1.1 * rem * k
    const trace = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    trace.setAttribute('class', 'donjon-course')
    trace.setAttribute('aria-hidden', 'true')
    const demi = rayon * 1.5
    trace.setAttribute('viewBox', `${-demi} ${-demi} ${2 * demi} ${2 * demi}`)
    trace.style.width = trace.style.height = `${2 * demi}px`
    trace.style.left = `${x - demi}px`
    trace.style.top = `${y - demi}px`
    trace.style.color = couleur
    const rayons: string[] = []
    const depart = Math.random() * Math.PI
    const e = 0.09 * rem * k
    for (let i = 0; i < 8; i++) {
      const a = depart + (i * Math.PI) / 4
      const r = rayon * (i % 2 === 0 ? 1 : 0.65)
      const [dx, dy] = [Math.cos(a), Math.sin(a)]
      const r0 = 0.3 * rayon
      rayons.push(
        `M${(dx * r0 - dy * e).toFixed(1)} ${(dy * r0 + dx * e).toFixed(1)} L${(dx * r).toFixed(1)} ${(dy * r).toFixed(1)} L${(dx * r0 + dy * e).toFixed(1)} ${(dy * r0 - dx * e).toFixed(1)}Z`,
      )
    }
    const forme = document.createElementNS('http://www.w3.org/2000/svg', 'path')
    forme.setAttribute('d', rayons.join(' '))
    trace.append(forme)
    scene.append(trace)
    trace.animate(
      [
        { transform: 'scale(0.3)', opacity: 1, easing: 'cubic-bezier(0.2, 0.9, 0.3, 1)' },
        { transform: 'scale(1)', opacity: 1, offset: 0.4, easing: 'ease-in' },
        { transform: 'scale(1.15)', opacity: 0 },
      ],
      { duration: 150, delay: retard, fill: 'backwards' },
    ).onfinish = () => trace.remove()
  }

  /**
   * LE COUP DE FLÉAU (Keko : « essayons la catégorie fouet, chaîne, fléau ») :
   * une BOULE de lumière au bout d'une CHAÎNE de maillons (des points), qui
   * tombe d'en haut sur un arc dont le centre est à côté du point, comme le
   * marteau ; la chaîne traîne derrière la boule, ployée par la vitesse, une
   * traînée suit la boule ; elle frappe le point en descendant (le contact),
   * l'écrase, reste posée un instant puis s'efface. Un coup sur deux de
   * l'autre côté, penché au hasard. Le critique est 1,4 fois plus gros. La
   * boule est HÉRISSÉE de huit pointes (Keko : « rajouter des pics sur la
   * boule »), et tourne en tombant.
   */
  let coteDuFleau = 1
  function fleau(x: number, y: number, k: number, couleur: string): void {
    coteDuFleau = -coteDuFleau
    const cote = coteDuFleau
    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize)
    const rayon = 5.5 * rem * k
    const boule = 0.55 * rem * k
    const penche = (Math.random() - 0.5) * 50
    const fin = (cote > 0 ? 0 : 180) + penche
    const debut = fin - cote * 130
    const a0 = (fin * Math.PI) / 180
    const trace = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    trace.setAttribute('class', 'donjon-course')
    trace.setAttribute('aria-hidden', 'true')
    const demi = rayon + 3 * boule
    trace.setAttribute('viewBox', `${-demi} ${-demi} ${2 * demi} ${2 * demi}`)
    trace.style.width = trace.style.height = `${2 * demi}px`
    trace.style.left = `${x - Math.cos(a0) * rayon - demi}px`
    trace.style.top = `${y - Math.sin(a0) * rayon - demi}px`
    trace.style.color = couleur
    const sillage = document.createElementNS('http://www.w3.org/2000/svg', 'path')
    const maillons = Array.from({ length: 11 }, () => {
      const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
      c.setAttribute('r', (0.09 * rem * k).toFixed(1))
      return c
    })
    // La boule et ses huit pointes, dessinées autour de 0, 0, posées par `transform`.
    const tete = document.createElementNS('http://www.w3.org/2000/svg', 'path')
    const pointes: string[] = []
    for (let i = 0; i < 16; i++) {
      const a = (i * Math.PI) / 8
      const r = i % 2 === 0 ? boule * 1.6 : boule
      pointes.push(`${(Math.cos(a) * r).toFixed(1)} ${(Math.sin(a) * r).toFixed(1)}`)
    }
    tete.setAttribute('d', `M${pointes.join(' L')}Z`)
    trace.append(sillage, ...maillons, tete)
    scene.append(trace)
    const rad = (d: number) => (d * Math.PI) / 180
    // La boule à `p` de sa course (0 = départ, 1 = le point), sa chaîne ployée
    // de `ploie` degrés en arrière, sa traînée sur `sillon` de la course.
    const dessiner = (p: number, ploie: number, sillon: number) => {
      const a = rad(debut + (fin - debut) * p)
      const [bx, by] = [Math.cos(a) * rayon, Math.sin(a) * rayon]
      tete.setAttribute('transform', `translate(${bx.toFixed(1)} ${by.toFixed(1)}) rotate(${(cote * 220 * p).toFixed(1)})`)
      // La chaîne, du tiers du rayon jusqu'à la boule, courbée en arrière.
      const ar = a - rad(cote * ploie)
      const [ax, ay] = [Math.cos(ar) * rayon * 0.3, Math.sin(ar) * rayon * 0.3]
      const [qx, qy] = [Math.cos(a - rad(cote * ploie * 0.6)) * rayon * 0.7, Math.sin(a - rad(cote * ploie * 0.6)) * rayon * 0.7]
      maillons.forEach((c, i) => {
        const s = i / maillons.length
        const u = 1 - s
        c.setAttribute('cx', (u * u * ax + 2 * u * s * qx + s * s * bx).toFixed(1))
        c.setAttribute('cy', (u * u * ay + 2 * u * s * qy + s * s * by).toFixed(1))
      })
      // La traînée : un arc derrière la boule, effilé, aussi large qu'elle au bout.
      if (sillon <= 0.005) return sillage.setAttribute('d', '')
      const dehors: string[] = []
      const dedans: string[] = []
      for (let i = 0; i <= 16; i++) {
        const v = i / 16
        const t = rad(debut + (fin - debut) * Math.max(0, p - sillon * (1 - v)))
        const h = boule * 0.8 * v ** 1.2
        dehors.push(`${(Math.cos(t) * (rayon + h)).toFixed(1)} ${(Math.sin(t) * (rayon + h)).toFixed(1)}`)
        dedans.push(`${(Math.cos(t) * (rayon - h)).toFixed(1)} ${(Math.sin(t) * (rayon - h)).toFixed(1)}`)
      }
      sillage.setAttribute('d', `M${dehors.join(' L')} L${dedans.reverse().join(' L')}Z`)
    }
    const depart = performance.now()
    const image = (maintenant: number) => {
      const t = maintenant - depart
      if (t < CONTACT_FLEAU) {
        // Elle tombe en accélérant ; la chaîne ploie et la traînée s'allonge avec la vitesse.
        const p = (t / CONTACT_FLEAU) ** 2
        dessiner(p, 18 * p, 0.35 * p)
      } else if (t < CONTACT_FLEAU + TENUE_FLEAU + FONDU_MARTEAU) {
        // Posée : la chaîne se redresse, la traînée se résorbe, puis tout s'efface.
        const ms = t - CONTACT_FLEAU
        const r = Math.max(0, 1 - ms / 80)
        dessiner(1, 18 * r, 0.35 * r)
        trace.style.opacity = `${1 - Math.max(0, (ms - TENUE_FLEAU) / FONDU_MARTEAU) ** 2}`
      } else {
        trace.remove()
        return
      }
      requestAnimationFrame(image)
    }
    image(depart)
  }

  /**
   * L'EXPLOSION DU PISTOLET (Keko : « une arme à feu, type médiéval fantasy, à
   * une main ; on peut tenter une petite explosion, un impact ? ») : un
   * TRAÇANT, la balle, fin et très rapide, monte de celui qui tire jusqu'au
   * point (40 ms, le contact) ; là, un FLASH, un disque de lumière qui éclate
   * et s'éteint vite, et un ÉCLAT en étoile, aux pointes inégales tirées à
   * chaque coup, qui jaillit en 60 ms, tourne un peu et s'éteint en
   * grandissant ; les étincelles en traits partent dans tous les sens (dans
   * `impact`). Plus d'onde ronde (Keko : « ça ressemble trop aux mains
   * nues » : c'est leur coup). LA VERSION LOURDE (`lourd`, le mousquet) : un
   * traçant plus long et plus épais, un éclat et un flash plus grands, qui
   * s'éteignent plus lentement. Le pistolet a pris celle qui était au mousquet,
   * le mousquet une plus grosse (Keko : « l'animation deux mains pour le une
   * main, et une plus grosse pour la deux mains » ; le pistolet traçait 7 rem
   * sur 0,2 et éclatait sur 1,7 rem, en 200 ms, le flash en 120).
   */
  function explosion(x: number, y: number, k: number, couleur: string, lourd = false): void {
    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize)
    // Le traçant (longueur, demi-épaisseur), l'éclat (rayon, durée), le flash (part de l'éclat, durée).
    const [longueurBalle, epaisseurBalle, rayonEclat, dureeEclat, partFlash, dureeFlash] = lourd ? [10, 0.26, 3.4, 340, 0.75, 220] : [8.5, 0.18, 2.5, 280, 0.7, 170]
    // Le traçant : il monte du bas, penché au hasard, et s'éteint au contact.
    const angle = -90 + (Math.random() - 0.5) * 50
    const balle = traitDroit(x, y, couleur, angle, longueurBalle * rem, epaisseurBalle * rem * k, (v) => v)
    const tir = performance.now()
    const image = (maintenant: number) => {
      const t = maintenant - tir
      if (t < CONTACT_BALLE) {
        const p = t / CONTACT_BALLE
        balle.dessiner(Math.max(0, p - 0.7), p, 1)
      } else if (t < CONTACT_BALLE + 50) {
        const q = (t - CONTACT_BALLE) / 50
        balle.dessiner(0.3 + 0.7 * q, 1, 1 - 0.5 * q)
        balle.trace.style.opacity = `${1 - q}`
      } else {
        balle.trace.remove()
        return
      }
      requestAnimationFrame(image)
    }
    image(tir)
    const rayon = rayonEclat * rem * k
    const trace = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    trace.setAttribute('class', 'donjon-course')
    trace.setAttribute('aria-hidden', 'true')
    const demi = rayon * 1.6
    trace.setAttribute('viewBox', `${-demi} ${-demi} ${2 * demi} ${2 * demi}`)
    trace.style.width = trace.style.height = `${2 * demi}px`
    trace.style.left = `${x - demi}px`
    trace.style.top = `${y - demi}px`
    trace.style.color = couleur
    // Dix pointes, longues ou courtes au hasard, entre des creux au tiers.
    const sommets: string[] = []
    const depart = Math.random() * Math.PI
    for (let i = 0; i < 20; i++) {
      const a = depart + (i * Math.PI) / 10
      const r = i % 2 === 0 ? rayon * (0.65 + Math.random() * 0.35) : rayon * 0.34
      sommets.push(`${(Math.cos(a) * r).toFixed(1)} ${(Math.sin(a) * r).toFixed(1)}`)
    }
    // Le flash, derrière l'éclat.
    const flash = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
    flash.setAttribute('r', (rayon * partFlash).toFixed(1))
    const forme = document.createElementNS('http://www.w3.org/2000/svg', 'path')
    forme.setAttribute('d', `M${sommets.join(' L')}Z`)
    trace.append(flash, forme)
    trace.style.opacity = '0'
    scene.append(trace)
    const sens = Math.random() < 0.5 ? -1 : 1
    trace.animate(
      [
        { transform: 'scale(0.2) rotate(0deg)', opacity: 1, easing: 'cubic-bezier(0.2, 0.9, 0.3, 1)' },
        { transform: `scale(1) rotate(${sens * 8}deg)`, opacity: 1, offset: 0.3, easing: 'ease-in' },
        { transform: `scale(1.25) rotate(${sens * 14}deg)`, opacity: 0 },
      ],
      { duration: dureeEclat, delay: CONTACT_BALLE },
    ).onfinish = () => trace.remove()
    flash.animate(
      [
        { transform: 'scale(0.4)', opacity: 1, easing: 'ease-out' },
        { transform: 'scale(1.6)', opacity: 0 },
      ],
      { duration: dureeFlash, delay: CONTACT_BALLE, fill: 'backwards' },
    )
  }

  /** L'onde ronde : un anneau qui s'ouvre et s'efface (le coup de poing). */
  function impactRond(x: number, y: number, fort: number, couleur: string): void {
    const onde = el('div', 'donjon-onde')
    onde.style.left = `${x}px`
    onde.style.top = `${y}px`
    onde.style.color = couleur
    scene.append(onde)
    onde.animate(
      [
        { transform: 'translate(-50%, -50%) scale(0.15)', opacity: 1, borderWidth: '0.4rem', easing: 'ease-out' },
        { transform: `translate(-50%, -50%) scale(${fort * 0.75})`, opacity: 0.9, borderWidth: '0.2rem', offset: 0.45, easing: 'ease-in' },
        { transform: `translate(-50%, -50%) scale(${fort})`, opacity: 0, borderWidth: '0.05rem' },
      ],
      { duration: 380 },
    ).onfinish = () => onde.remove()
  }

  function reculer(x: number, genre: Genre, arret = 0, axe?: number, retard = 0, ecrase = false): void {
    // L'ennemi recule du côté opposé au coup, blanchit, s'écrase. Sous la
    // lame, il se FIGE un instant dans sa pose touchée (l'arrêt sur coup).
    // Sous l'estoc (`axe`, la direction du coup), il est POUSSÉ dans l'axe de
    // la pointe et rapetisse, enfoncé, quand elle entre. Sous les armes à deux
    // mains qui frappent de haut (`ecrase`), il est TASSÉ vers le bas, puis se relève.
    const recul = (x < scene.clientWidth / 2 ? 1 : -1) * STYLES[genre].recul
    const blanc = STYLES[genre].blanc
    const pousse = axe === undefined ? null : [Math.cos(axe) * STYLES[genre].recul * 0.7, Math.sin(axe) * STYLES[genre].recul * 0.7]
    const tasse = STYLES[genre].recul * 0.5
    const touche = {
      transform: ecrase
        ? `translateY(${tasse}px) scale(1.08, 0.86)`
        : pousse
          ? `translate(${pousse[0]}px, ${pousse[1]}px) scale(0.95)`
          : `translateX(${recul}px) scale(1.06, 0.9) rotate(${recul * 0.3}deg)`,
      filter: `brightness(${blanc}) saturate(0.4)`,
    }
    const rebond = ecrase
      ? `translateY(${-tasse * 0.3}px) scale(0.97, 1.05)`
      : pousse
        ? `translate(${-pousse[0] * 0.25}px, ${-pousse[1] * 0.25}px) scale(1.01)`
        : `translateX(${-recul * 0.3}px) scale(0.98, 1.03)`
    portrait.animate(
      [
        { transform: 'none', filter: 'brightness(1)' },
        { ...touche, offset: arret ? 0.08 : 0.2 },
        ...(arret ? [{ ...touche, offset: 0.35 }] : []),
        { transform: rebond, filter: 'brightness(1.1)', offset: arret ? 0.65 : 0.55 },
        { transform: 'none', filter: 'brightness(1)' },
      ],
      { duration: (STYLES[genre].critique ? 320 : 220) + arret, delay: retard, easing: 'ease-out' },
    )
    if (STYLES[genre].secousse) {
      scene.animate(
        [{ transform: 'none' }, { transform: 'translate(-5px, 3px)' }, { transform: 'translate(5px, -3px)' }, { transform: 'translate(-3px, 2px)' }, { transform: 'none' }],
        { duration: 260 },
      )
    }
  }

  /**
   * UN POINT SUR LE DESSIN DE L'ENNEMI, un peu au hasard pour que les coups ne
   * s'empilent pas. Calé sur l'image réellement peinte (le portrait est en
   * `object-fit: contain`, sa boîte est plus large que le dessin) : rapporté
   * à la scène, un coup d'auto tombait parfois à côté du personnage (Keko).
   * `dx`, `dy` décalent du centre du dessin, en fraction de sa taille.
   */
  function surLEnnemi(dx: number, dy: number): [number, number] {
    const { x0, y0, l, h } = cadreDuDessin()
    // Le hasard de l'écran, pas celui des règles.
    return [x0 + l * (0.5 + dx + (Math.random() - 0.5) * 0.24), y0 + h * (0.42 + dy + (Math.random() - 0.5) * 0.2)]
  }

  /** Le dessin de l'ennemi dans la scène : son coin, sa largeur, sa hauteur. */
  function cadreDuDessin(): { x0: number; y0: number; l: number; h: number } {
    // La boîte de MISE EN PAGE (offset*), pas `getBoundingClientRect` : le
    // portrait recule, s'écrase et surgit en `transform`, qui la déformait.
    const nl = portrait.naturalWidth
    const nh = portrait.naturalHeight
    let x0 = 0
    let y0 = 0
    let l = scene.clientWidth
    let h = scene.clientHeight
    if (nl > 0 && nh > 0 && portrait.offsetWidth > 0) {
      const echelle = Math.min(portrait.offsetWidth / nl, portrait.offsetHeight / nh)
      l = nl * echelle
      h = nh * echelle
      x0 = portrait.offsetLeft + (portrait.offsetWidth - l) / 2
      y0 = portrait.offsetTop + (portrait.offsetHeight - h) / 2
    }
    return { x0, y0, l, h }
  }

  // ------------------------------------------------ le passif de classe
  // LES CIBLES DU PASSIF (Keko : « faire apparaître des choses interactibles
  // sur l'ennemi ») : la Riposte allume tout l'ennemi (on le touche, où que
  // ce soit), un point faible est une cible, les runes trois cibles
  // numérotées. Elles sont dessinées d'après l'événement que lisent les
  // règles ; une cible qui n'a plus lieu d'être s'efface en fondu.
  const couchePassif = el('div', 'donjon-passif')
  scene.append(couchePassif)
  const ciblesVues = new Map<string, HTMLElement>()

  function effacerLaCible(cle: string): void {
    const n = ciblesVues.get(cle)
    if (n === undefined) return
    ciblesVues.delete(cle)
    n.style.pointerEvents = 'none'
    n.animate([{ opacity: 1 }, { opacity: 0, transform: 'scale(1.4)' }], { duration: 220, easing: 'ease-out' }).onfinish = () => n.remove()
  }

  /** À chaque image : les cibles de l'événement ouvert, à leur place, avec leur temps qui reste. */
  function dessinerLePassif(ev: EvenementDuPassif | null, j: Joueur, t: number): void {
    const ouvert = ev !== null && passifOuvert(C, j, ev)
    scene.classList.toggle('riposte', ouvert && j.arme === 'epee')
    const voulues = new Set<string>()
    if (ouvert && ev !== null) {
      const { x0, y0, l, h } = cadreDuDessin()
      const reste = Math.max(0, Math.min(1, (ev.fin - t) / (passifDe(C, j)?.duree ?? 1)))
      const etape = etapeDuPassif(j, ev.k)
      ev.cibles.forEach((c, i) => {
        // La Riposte n'a qu'un signal au-dessus de la tête ; les runes déjà touchées restent allumées.
        const genre = j.arme === 'epee' ? 'riposte' : j.arme === 'dague' ? 'point' : 'rune'
        const cle = `${j.arme}:${ev.k}:${i}`
        voulues.add(cle)
        let n = ciblesVues.get(cle)
        if (n === undefined) {
          n = genre === 'riposte' ? el('div', 'donjon-cible riposte', '!') : bouton(`donjon-cible ${genre}`, genre === 'rune' ? String(i + 1) : undefined)
          if (genre !== 'riposte') {
            n.setAttribute('aria-label', genre === 'rune' ? `Rune ${i + 1}` : 'Point faible')
            n.addEventListener('pointerdown', (e) => {
              e.stopPropagation()
              toucherLePassif(ev.k, i, n!)
            })
          }
          couchePassif.append(n)
          ciblesVues.set(cle, n)
          n.animate([{ transform: 'scale(0)', opacity: 0 }, { transform: 'scale(1.15)', opacity: 1, offset: 0.6 }, { transform: 'scale(1)', opacity: 1 }], { duration: 220, easing: 'ease-out' })
        }
        const ici = genre === 'riposte' ? { x: 0.5, y: 0.08 } : c
        n.style.left = `${x0 + l * ici.x}px`
        n.style.top = `${y0 + h * ici.y}px`
        n.style.setProperty('--reste', reste.toFixed(3))
        n.classList.toggle('allumee', genre === 'rune' && i < etape)
        n.classList.toggle('suivante', genre === 'rune' && i === etape)
      })
    }
    for (const cle of [...ciblesVues.keys()]) if (!voulues.has(cle)) effacerLaCible(cle)
  }

  /**
   * TOUCHER UNE CIBLE : l'action part, et si le coup est tombé il jaillit
   * sous le nom du passif. Une rune hors d'ordre tremble en rouge.
   */
  function toucherLePassif(k: number, cible: number, n: HTMLElement | null): void {
    const t = maintenant()
    const avant = moi()
    const p = passifDe(C, avant)
    if (p === null) return
    const etape = etapeDuPassif(avant, k)
    const mult = multiplicateurDeForme(C, avant, formeA(C, avant, t))
    const attendu = degatsDuTap(C, avant) * p.coup * mult * (1 + bonusDEffetsA(C, avant, t))
    const dejaInfliges = avant.degatsTap
    if (n !== null && cible !== etape) n.classList.add('ratee')
    void partage.agir({ joueur: MOI, t, type: 'toucher', evenement: k, cible }).then(() => {
      const inflige = moi().degatsTap - dejaInfliges
      if (inflige > 0) {
        const e = C.tap.ecart
        const seuil = (attendu * (1 + e + (1 - e) * multCritDe(C, avant))) / 2
        const genre: Genre = p.critique === true || inflige > seuil ? 'capaciteCritique' : 'capacite'
        const [x, y] = surLEnnemi(0, -0.05)
        const couleur = teinteDuChiffre(genre, mult - 1)
        impact(x, y, genre, couleur)
        envoler(x, y, inflige, genre, couleur, p.nom === 'Points faibles' ? 'Point faible' : p.nom)
      }
      dessiner()
    })
  }

  // La Riposte : on touche l'ennemi, n'importe où dans la scène.
  scene.addEventListener('pointerdown', () => {
    const j = moi()
    if (j.arme !== 'epee') return
    const ev = evenementA(C, etat.saison.seed, etat.saison.debut, j, maintenant())
    if (ev !== null && passifOuvert(C, j, ev)) toucherLePassif(ev.k, 0, null)
  })

  function frapper(): void {
    const t = maintenant()
    const avant = moi()
    // En recharge, le tap ne part pas (la règle le refuserait).
    if (!tapPret(avant, t)) return
    const mult = multiplicateurDeForme(C, avant, formeA(C, avant, t))
    const attendu = degatsDuTap(C, avant) * mult
    const dejaInfliges = avant.degatsTap
    const [x, y] = surLEnnemi(-0.1, 0)
    attaque.animate([{ transform: 'scale(1)' }, { transform: 'scale(0.93)', offset: 0.3 }, { transform: 'scale(1)' }], { duration: 140, easing: 'ease-out' })
    void partage.agir({ joueur: MOI, t, type: 'taper', n: 1 }).then(() => {
      const inflige = moi().degatsTap - dejaInfliges
      // Critique si au-dessus du milieu entre le plus fort coup normal et le
      // plus faible critique (la plage les sépare).
      const e = C.tap.ecart
      const seuil = (attendu * (1 + e + (1 - e) * multCritDe(C, avant))) / 2
      const genre: Genre = inflige > seuil ? 'critique' : 'tap'
      const couleur = teinteDuChiffre(genre, mult - 1)
      impact(x, y, genre, couleur)
      envoler(x, y, inflige, genre, couleur)
      dessiner()
    })
  }

  // Au pointeur dès l'appui (un clic attendrait le relâchement) ; au clavier
  // par le clic, qui n'a pas d'appui (`detail` 0).
  attaque.addEventListener('pointerdown', (ev) => {
    if (ev.button !== 0) return
    frapper()
    remplir = remplirLaBulle
    clearTimeout(appui)
    appui = window.setTimeout(montrerLaBulle, APPUI_LONG)
  })
  attaque.addEventListener('click', (ev) => {
    if (ev.detail === 0) frapper()
  })
  // L'APPUI LONG montre les infos ; le doigt levé (ou parti) les cache. Le
  // premier tap a frappé quand même. Pas de menu du navigateur sur l'appui.
  const APPUI_LONG = 450
  let appui = 0
  /** Ce que dit la bulle : l'attaque, ou la capacité tenue. */
  let remplir: () => void = () => remplirLaBulle()
  function montrerLaBulle(): void {
    remplir()
    bulle.hidden = false
    bulle.animate([{ opacity: 0, transform: 'translate(-50%, 0.4rem)' }, { opacity: 1, transform: 'translate(-50%, 0)' }], { duration: 160, easing: 'ease-out' })
  }
  function cacherLaBulle(): void {
    clearTimeout(appui)
    bulle.hidden = true
  }
  for (const fin of ['pointerup', 'pointercancel', 'pointerleave'] as const) attaque.addEventListener(fin, cacherLaBulle)
  attaque.addEventListener('contextmenu', (ev) => ev.preventDefault())
  function remplirLaBulle(): void {
    const j = moi()
    // LES TROIS CHIFFRES DE LA FICHE D'ARME (Keko : « la même chose sur les
    // stats du bouton attaque ») : dégâts, vitesse de l'auto, DPS moyen.
    const ligne = ligneDeBulle
    const moyen = degatsDuTap(C, j)
    const html =
      ligne('Arme', C.armes[j.arme].nom) +
      ligne('Dégâts', `${borne(moyen * (1 - C.tap.ecart) + 1e-9)} – ${borne(moyen * (1 + C.tap.ecart) - 1e-9)}`) +
      ligne('Vitesse', secondes(periodeDe(C, j))) +
      ligne('DPS', nombre(dpsEffectifDe(C, j)))
    if (bulle.innerHTML !== html) bulle.innerHTML = html
  }

  /** La bulle d'une capacité : son nom, ce qu'elle fait, quand elle revient. */
  function remplirLaBulleDe(i: number): void {
    const j = moi()
    const t = maintenant()
    const cle = capacitesDe(C, j)[i]
    const c = C.capacites[cle]
    let etat = 'prête'
    if (!capacitePrete(C, j, cle, t)) {
      etat = c.critiques !== undefined ? `${j.critiques} / ${c.critiques} critiques` : `dans ${secondesRondes(Math.max(0, (j.capacitesPretes[cle] ?? t) - t))}`
    }
    const html = `<div class="donjon-bulle-titre">${c.nom}</div><div class="donjon-bulle-texte">${effetDeLaCapacite(cle)}, ${quandLaCapacite(cle)}.</div>${ligneDeBulle('État', etat)}`
    if (bulle.innerHTML !== html) bulle.innerHTML = html
  }

  /** Un mot qui s'annonce au milieu de la scène : la capacité sans coup (un effet). */
  function annoncer(texte: string): void {
    const n = el('div', 'donjon-annonce', texte)
    scene.append(n)
    n.animate(
      [
        { transform: 'translate(-50%, -50%) scale(0.4)', opacity: 0, easing: 'ease-out' },
        { transform: 'translate(-50%, -50%) scale(1.15)', opacity: 1, offset: 0.15, easing: 'ease-in-out' },
        { transform: 'translate(-50%, -60%) scale(1)', opacity: 1, offset: 0.7, easing: 'ease-in' },
        { transform: 'translate(-50%, -90%) scale(0.95)', opacity: 0 },
      ],
      { duration: 1400 },
    ).onfinish = () => n.remove()
  }

  /**
   * UNE CAPACITÉ PART : pas prête, le bouton tremble et rien ne part. Un coup
   * jaillit comme un tap, en plus gros, sous son nom ; un effet s'annonce.
   */
  function lancerCapacite(i: number): void {
    const t = maintenant()
    const avant = moi()
    const cle = capacitesDe(C, avant)[i]
    const b = boutonsCapacite[i].b
    if (!capacitePrete(C, avant, cle, t)) {
      b.animate([{ translate: '0' }, { translate: '-4px 0' }, { translate: '4px 0' }, { translate: '0' }], { duration: 200 })
      return
    }
    const c = C.capacites[cle]
    const mult = multiplicateurDeForme(C, avant, formeA(C, avant, t))
    const attendu = degatsDuTap(C, avant) * (c.coup ?? 0) * mult * (1 + bonusDEffetsA(C, avant, t))
    const dejaInfliges = avant.degatsTap
    b.animate([{ scale: '1' }, { scale: '0.88', offset: 0.3 }, { scale: '1.08', offset: 0.65 }, { scale: '1' }], { duration: 260, easing: 'ease-out' })
    void partage.agir({ joueur: MOI, t, type: 'lancer', capacite: cle }).then(() => {
      if (c.coup !== undefined) {
        const inflige = moi().degatsTap - dejaInfliges
        const e = C.tap.ecart
        const seuil = (attendu * (1 + e + (1 - e) * multCritDe(C, avant))) / 2
        const genre: Genre = inflige > seuil ? 'capaciteCritique' : 'capacite'
        const [x, y] = surLEnnemi(0, -0.05)
        const couleur = teinteDuChiffre(genre, mult - 1)
        impact(x, y, genre, couleur)
        envoler(x, y, inflige, genre, couleur, c.nom)
      } else {
        annoncer(c.nom)
      }
      dessiner()
    })
  }

  for (const [i, { b }] of boutonsCapacite.entries()) {
    b.addEventListener('pointerdown', (ev) => {
      if (ev.button !== 0) return
      lancerCapacite(i)
      remplir = () => remplirLaBulleDe(i)
      clearTimeout(appui)
      appui = window.setTimeout(montrerLaBulle, APPUI_LONG)
    })
    b.addEventListener('click', (ev) => {
      if (ev.detail === 0) lancerCapacite(i)
    })
    for (const fin of ['pointerup', 'pointercancel', 'pointerleave'] as const) b.addEventListener(fin, cacherLaBulle)
    b.addEventListener('contextmenu', (ev) => ev.preventDefault())
  }

  // ------------------------------------------------ le dessin
  let etageVu = -1
  let niveauVu = -1
  let portraitVu = ''
  let tirageDuPortrait = 0
  let filVu = ''

  function poserLePortrait(animer: boolean): void {
    const carte = carteDe(etat.ennemi.etage, etat.ennemi.portrait)
    nom.textContent = carte?.nom ?? etat.ennemi.nom
    sous.textContent = carte === null ? '' : `${NOM_DE_LA_RACE[carte.race]} · ${NOM_DU_ROLE[carte.role]}`
    const image = carte === null ? '' : url(carte.image)
    if (image === portraitVu) return
    portraitVu = image
    const ceTirage = ++tirageDuPortrait
    if (carte === null) return
    const fond = `url(${url(`fonds/${carte.race}.webp`)})`

    // L'ANCIEN NE RESTE PAS À L'ÉCRAN EN ATTENDANT LE NOUVEAU (Keko : « le
    // prochain conserve l'image de l'ennemi précédent brièvement ») : il
    // disparaît à l'image même de sa mort — un fondu de sortie le montrait
    // encore entier une ou deux images, sous le nom du suivant (mesuré) —,
    // et le nouveau est décodé dans une image à part, puis posé d'un coup à
    // sa place. Jamais un `src` changé sur l'image affichée : elle garde
    // l'ancienne jusqu'au décodage.
    if (animer) portrait.style.visibility = 'hidden'
    const suivant = nouveauPortrait()
    suivant.src = image
    void suivant
      .decode()
      .catch(() => {})
      .then(() => {
        // Un ennemi plus récent est déjà passé (plusieurs étages par tic en ×1000).
        if (ceTirage !== tirageDuPortrait) return
        scene.style.backgroundImage = fond
        portrait.replaceWith(suivant)
        portrait = suivant
        if (animer) {
          portrait.animate(
            [
              { transform: 'translateY(18%) scale(0.7)', opacity: 0 },
              { transform: 'translateY(-3%) scale(1.05)', opacity: 1, offset: 0.7 },
              { transform: 'none', opacity: 1 },
            ],
            { duration: 420, easing: 'ease-out' },
          )
        }
      })

    // Le suivant se charge et se décode d'avance : c'est SON portrait tiré
    // (le seedé de l'étage + 1), pas la carte de rang étage + 1.
    const apres = carteDe(etat.ennemi.etage + 1, portraitDeLEtage(etat.saison.seed, etat.ennemi.etage + 1))
    if (apres !== null) {
      const avance = new Image()
      avance.src = url(apres.image)
      void avance.decode().catch(() => {})
    }
  }

  function dessiner(): void {
    const t = Math.max(maintenant(), etat.t)
    const j = moi()

    saison.textContent = `Saison ${etat.saison.numero} · Jour ${jourDeLaSaison(etat, t)}`
    reste.textContent = `Fin dans ${duree(etat.saison.fin - t)}${horloge.vitesse === 1 ? '' : ` · ×${horloge.vitesse}`}`

    // L'ennemi : un nouveau surgit, la barre tremble.
    const nouveau = etat.ennemi.etage !== etageVu
    poserLePortrait(nouveau && etageVu !== -1)
    if (nouveau) {
      if (etageVu !== -1) {
        barre.animate(
          [{ transform: 'translateX(0)' }, { transform: 'translateX(-6px)' }, { transform: 'translateX(5px)' }, { transform: 'translateX(-3px)' }, { transform: 'translateX(0)' }],
          { duration: 300 },
        )
        pastilleEtage.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.3)' }, { transform: 'scale(1)' }], { duration: 400, easing: 'ease-out' })
      }
      etageVu = etat.ennemi.etage
      pastilleEtage.textContent = `Étage ${etageVu}`
    }
    const part = Math.max(0, etat.ennemi.pv) / etat.ennemi.pvMax
    pv.style.width = `${100 * part}%`
    pvTexte.textContent = `${nombre(Math.max(0, etat.ennemi.pv))} / ${nombre(etat.ennemi.pvMax)}`

    // La dernière nouvelle.
    const dernier = etat.journal[etat.journal.length - 1]
    const texteDuFil = dernier === undefined ? '' : phrase(etat, dernier)
    if (texteDuFil !== filVu) {
      filVu = texteDuFil
      fil.textContent = texteDuFil
      fil.classList.toggle('donjon-fil-moi', dernier?.joueur === MOI)
      fil.animate([{ opacity: 0.2 }, { opacity: 1 }], { duration: 300 })
    }

    // Le joueur.
    niveau.textContent = String(j.niveau)
    if (j.niveau !== niveauVu) {
      if (niveauVu !== -1) niveau.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.45)' }, { transform: 'scale(1)' }], { duration: 450, easing: 'ease-out' })
      niveauVu = j.niveau
    }
    xpPlein.style.width = `${(100 * j.xp) / xpPourNiveau(C, j.niveau)}%`
    points.textContent = j.points > 0 ? `${j.points} point${j.points > 1 ? 's' : ''} ›` : ''
    bande.classList.toggle('pret', j.points > 0)

    for (const [i, b] of boutonsVitesse.entries()) b.classList.toggle('actif', C.vitesses[i] === horloge.vitesse)
    // L'arme portée, et le RAPPEL DE SON CRAN (Keko) : le cadre de
    // l'emplacement prend la couleur du cran, comme sa case dans la grille.
    const place = placePortee()
    if (armeVue !== `${j.arme}:${place}`) {
      armeVue = `${j.arme}:${place}`
      const capacites = capacitesDe(C, j)
      for (const [i, { b, image }] of boutonsCapacite.entries()) {
        const cle = capacites[i]
        // À mains nues, pas de capacité : leurs boutons s'en vont.
        b.hidden = cle === undefined
        if (cle === undefined) continue
        image.src = url(IMAGE_DE_LA_CAPACITE[cle])
        b.setAttribute('aria-label', C.capacites[cle].nom)
      }
      // À mains nues, leur icône, sans cadre de cran.
      imageArme.src = url(IMAGE_DE_L_ARME[j.arme])
      if (j.arme === 'mains') {
        emplacement.style.removeProperty('--rarete')
        emplacement.setAttribute('aria-label', 'Arme : mains nues')
      } else {
        emplacement.style.setProperty('--rarete', RARETE[inventaire[place].rarete].couleur)
        emplacement.setAttribute('aria-label', `Arme : ${C.armes[j.arme].nom}, ${RARETE[inventaire[place].rarete].nom.toLowerCase()}`)
      }
    }
    if (ouverte !== null) dessinerLaFeuille(ouverte)
  }

  function dessinerLaFeuille(f: Feuille): void {
    if (f === 'ameliorations') {
      if (feuilleFigee) return
      const j = moi()
      const aDonner = j.points > 0
      feuilleTitre.textContent = aDonner ? `Niveau ${j.niveau} · ${j.points} point${j.points > 1 ? 's' : ''}` : `Vos stats · ${C.armes[j.arme].nom}`
      for (const c of lesChoix) {
        const v = CHOIX[c.quoi].valeur
        const texte = aDonner ? `${v(j)} → ${v(auRangSuivant(j, c.quoi))}` : v(j)
        if (c.valeur.textContent !== texte) c.valeur.textContent = texte
        c.cout.textContent = String(j.ameliorations[c.quoi])
        c.b.disabled = !aDonner
      }
      if (cleDeLaFeuille !== 'ameliorations') {
        cleDeLaFeuille = 'ameliorations'
        feuilleCorps.replaceChildren(choix)
      }
      return
    }
    if (f === 'armes') {
      if (cleDeLaFeuille !== 'armes') {
        // À l'ouverture, la fiche montre l'arme portée (à mains nues, la dernière portée).
        cleDeLaFeuille = 'armes'
        const ici = placePortee()
        choisie = ici >= 0 ? ici : portee
        cleDeLaFiche = ''
        feuilleCorps.replaceChildren(armurerie)
      }
      dessinerLaFiche()
      return
    }
    if (f === 'reglages') {
      if (cleDeLaFeuille !== 'reglages') {
        cleDeLaFeuille = 'reglages'
        feuilleCorps.replaceChildren(reglages)
      }
      return
    }
    if (f === 'journal') {
      const dernier = etat.journal[etat.journal.length - 1]
      const cle = `journal:${etat.saison.numero}:${etat.journal.length}:${dernier?.t}:${dernier?.type}`
      if (cle === cleDeLaFeuille) return
      cleDeLaFeuille = cle
      const liste = el('ol', 'donjon-journal')
      for (const ev of [...etat.journal].reverse()) {
        const li = el('li', ev.joueur === MOI ? 'donjon-c-moi' : ev.joueur === null ? 'donjon-c-saison' : undefined)
        li.append(el('span', 'donjon-journal-heure', heureDeJeu(etat, ev.t)), el('span', undefined, phrase(etat, ev)))
        liste.append(li)
      }
      feuilleCorps.replaceChildren(liste)
      return
    }
    // Le classement change à chaque tic : on le refait, il n'a pas de bouton.
    cleDeLaFeuille = 'classement'
    const total = etat.joueurs.reduce((s, x) => s + x.degatsTap + x.degatsAuto, 0)
    const tries = [...etat.joueurs].sort((a, b) => b.degatsTap + b.degatsAuto - (a.degatsTap + a.degatsAuto))
    const liste = el('ol', 'donjon-classement')
    tries.forEach((x, i) => {
      const degats = x.degatsTap + x.degatsAuto
      const li = el('li', x.id === MOI ? 'donjon-c-moi' : undefined)
      const ligne = el('div', 'donjon-classement-ligne')
      ligne.append(
        el('span', 'donjon-c-rang', String(i + 1)),
        el('span', 'donjon-c-nom', x.nom),
        el('span', 'donjon-c-nombre', nombre(degats)),
      )
      const part = el('div', 'donjon-classement-part')
      const plein = el('div', 'donjon-classement-plein')
      plein.style.width = `${total > 0 ? (100 * degats) / total : 0}%`
      part.append(plein)
      const note = el('div', 'donjon-classement-note', `Niveau ${x.niveau} · ${total > 0 ? pourcent(degats / total) : '0 %'} des dégâts · ${x.kills} achevé${x.kills > 1 ? 's' : ''}`)
      li.append(ligne, part, note)
      liste.append(li)
    })
    const passees = el('div', 'donjon-archives')
    if (etat.archives.length > 0) {
      passees.textContent =
        'Saisons passées : ' +
        [...etat.archives]
          .reverse()
          .map((a) => `saison ${a.numero}, étage ${a.etage}`)
          .join(' · ')
    }
    feuilleCorps.replaceChildren(liste, passees)
  }

  // ------------------------------------------------ l'auto, à chaque image
  // Les coups de l'auto tombent à heure fixe (tous les multiples de la
  // période du joueur depuis le début de la saison) : la jauge se remplit vers le prochain, et chaque
  // coup franchi fait jaillir son chiffre — orange et « Critique ! » quand
  // ce coup-là l'a été (`autoCritique`, la même fonction que les règles).
  // Aux vitesses où plusieurs coups tombent par image, on les cumule et on
  // n'en montre qu'un par `CADENCE_AUTO` ; un lot ne se dit critique que
  // s'il tient en un seul coup.
  const CADENCE_AUTO = 300
  const FLAMBEE = 220
  /** Au-delà, un rattrapage (page en veille) : on cumule à la moyenne. */
  const LOT_MAX = 1000
  let coupVu = -1
  let saisonVue = -1
  let periodeVue = -1
  let cumulAuto = 0
  let coupsDuLot = 0
  let critiquesDuLot = 0
  let dernierAuto = 0
  function image(): void {
    const t = maintenant()
    const j = moi()
    const debutSaison = etat.saison.debut
    const periode = periodeDe(C, j)
    const coup = coupsAutoA(C, debutSaison, t, j)
    // Une saison neuve, ou une période changée (un achat) : on repart du coup présent.
    if (saisonVue !== etat.saison.numero || periode !== periodeVue || coup < coupVu) {
      saisonVue = etat.saison.numero
      periodeVue = periode
      coupVu = coup
    }
    if (coup > coupVu) {
      const n = coup - coupVu
      if (n > LOT_MAX) {
        cumulAuto += degatsDuCoupAuto(C, j) * facteurCritMoyen(C, j) * n
      } else {
        for (let k = coupVu + 1; k <= coup; k++) {
          const critique = autoCritique(C, etat.saison.seed, k * periode, j)
          cumulAuto += degatsDuCoupAutoA(C, etat.saison.seed, k * periode, j, debutSaison + k * periode)
          if (critique) critiquesDuLot += 1
        }
      }
      coupsDuLot += n
      coupVu = coup
      void tic()
    }
    const reel = performance.now()
    if (cumulAuto > 0 && reel - dernierAuto >= CADENCE_AUTO) {
      dernierAuto = reel
      const [x, y] = surLEnnemi(0.12, -0.06)
      const genre: Genre = coupsDuLot === 1 && critiquesDuLot === 1 ? 'autoCritique' : 'auto'
      const couleur = teinteDuChiffre(genre, 0)
      impact(x, y, genre, couleur)
      envoler(x, y, cumulAuto, genre, couleur)
      // Le contour complet se lance : il flambe et le bouton bondit.
      contour.animate(
        [{ filter: 'drop-shadow(0 0 0.9rem #e8f6ff) brightness(1.8)' }, { filter: 'drop-shadow(0 0 0.3rem #a9dcff) brightness(1)' }],
        { duration: 320, easing: 'ease-out' },
      )
      // Le bouton et son contour bondissent, pas l'emplacement d'arme voisin.
      const bond = [{ transform: 'scale(1)' }, { transform: 'scale(1.06)', offset: 0.3 }, { transform: 'scale(1)' }]
      attaque.animate(bond, { duration: 240, easing: 'ease-out' })
      contour.animate(bond, { duration: 240, easing: 'ease-out', composite: 'add' })
      cumulAuto = 0
      coupsDuLot = 0
      critiquesDuLot = 0
    }
    // Trop rapide pour se lire : le contour reste plein.
    // Au lancement, il reste plein le temps de flamber, puis repart de zéro.
    const rapide = periode / horloge.vitesse < CADENCE_AUTO
    const part = rapide || reel - dernierAuto < FLAMBEE ? 1 : ((t - debutSaison) % periode) / periode
    contourPlein.style.strokeDasharray = `${part} 1`
    contourPlein.style.opacity = String(0.55 + 0.45 * part)
    dessinerLePassif(evenementA(C, etat.saison.seed, debutSaison, j, t), j, t)
    // La forme glisse en continu : le marqueur la suit à chaque image.
    const forme = formeA(C, j, t)
    const mult = multiplicateurDeForme(C, j, forme)
    marqueurForme.style.left = `${surLeTrait(forme)}%`
    // Le marqueur prend la couleur qu'aurait un tap : blanc sur le palier.
    marqueurForme.style.background = teinteDuChiffre('tap', mult - 1)
    const pourCent = `${Math.round(100 * mult)} %`
    if (valeurForme.textContent !== pourCent) valeurForme.textContent = pourCent
    if (!bulle.hidden) remplir()
    // Le voile de recharge : plein au tap, il se vide de haut en bas.
    const resteRecharge = Math.max(0, Math.min(1, (j.prochainTap - t) / rechargeDe(C, j)))
    voileRecharge.style.clipPath = `inset(${100 * (1 - resteRecharge)}% 0 0 0)`
    // Les capacités : le même voile ; prêtes, elles brillent ; leur effet
    // en cours, elles battent.
    for (const [i, cle] of capacitesDe(C, j).entries()) {
      const { b, voile } = boutonsCapacite[i]
      const avancee = avanceeDeCapacite(C, j, cle, t)
      voile.style.clipPath = `inset(${100 * avancee}% 0 0 0)`
      b.classList.toggle('prete', avancee >= 1)
      // EN RECHARGE, L'ILLUSTRATION SE GRISE (Keko : « parfois pas très
      // lisible que la capacité est en CD, surtout la conditionnelle ») — pas
      // celle de l'attaque : au spam, elle clignotait (Keko : « ça rend mal »).
      b.classList.toggle('en-recharge', avancee < 1)
      b.classList.toggle('active', effetEnCours(j, cle, t))
    }
    requestAnimationFrame(image)
  }

  // ------------------------------------------------ le temps
  let occupe = false
  async function tic(): Promise<void> {
    if (occupe) return
    occupe = true
    try {
      bots = await jouerLesBots(C, partage, bots, maintenant())
      await partage.lire()
      dessiner()
    } finally {
      occupe = false
    }
  }
  await tic()
  void chargerEmojis('fantasy')
    .then((c) => {
      cartes = c
      portraitVu = '-'
      poserLePortrait(true)
    })
    .catch(() => {
      // Sans catalogue, l'ennemi garde son nom engendré.
    })
  setInterval(() => void tic(), 200)
  requestAnimationFrame(image)
  setInterval(sauver, 2000)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') sauver()
  })
  addEventListener('pagehide', sauver)
}

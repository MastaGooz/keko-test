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
import { AMELIORATIONS, ARMES, DONJON, JOUR, type CleAmelioration, type CleCapacite, type RareteArme, type TypeArme } from '../../logic/donjon/config.ts'
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
  facteurCritMoyen,
  etatInitial,
  formeA,
  jourDeLaSaison,
  multCritDe,
  multiplicateurDeForme,
  periodeDe,
  rechargeDe,
  tapPret,
  xpPourNiveau,
} from '../../logic/donjon/regles.ts'
import type { EtatDonjon, Evenement, Joueur } from '../../logic/donjon/types.ts'
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
 * bâton, faute d'image de bâton, la capacité n° 116 (la magie) — à remplacer.
 */
const IMAGE_DE_L_ARME: Record<TypeArme, string> = { epee: 'armes/epee.webp', dague: 'armes/dague.webp', baton: 'armes/baton.webp' }
const DIT_L_ARME: Record<TypeArme, { caractere: string; bonus: string }> = {
  epee: { caractere: 'Équilibrée', bonus: 'Récupération +20 %' },
  dague: { caractere: 'Rapide', bonus: 'Critique +5 points' },
  baton: { caractere: 'Lent', bonus: 'Dégâts critiques +50 %' },
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

  // De haut en bas : l'ennemi, le bouton, le niveau, et tout en bas le journal.
  // La ligne du personnage : son arme, puis son niveau (qui ouvre ses stats).
  const perso = el('div', 'donjon-perso')
  perso.append(emplacement, bande)
  page.append(tete, scene, fiche, arene, perso, fil)

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
  /** La place portée suit l'arme du joueur, si elle a changé ailleurs (une sauvegarde, un réglage). */
  function placePortee(): number {
    const arme = moi().arme
    if (inventaire[portee]?.arme !== arme) portee = Math.max(0, inventaire.findIndex((p) => p.arme === arme))
    return portee
  }
  equiper.addEventListener('click', () => {
    if (choisie === placePortee()) return
    const { arme } = inventaire[choisie]
    portee = choisie
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
    // SES DEUX CAPACITÉS, à la place de la section « Effet » prévue (Keko).
    lignes.push(el('div', 'donjon-fiche-section', 'Capacités'))
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
    equiper.textContent = estPortee ? 'Équipée' : 'Équiper'
    equiper.disabled = estPortee
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
  function impact(x: number, y: number, genre: Genre, couleur: string): void {
    const fort = STYLES[genre].onde
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

    const combien = STYLES[genre].particules
    for (let i = 0; i < combien; i++) {
      const p = el('div', 'donjon-particule')
      p.style.left = `${x}px`
      p.style.top = `${y}px`
      p.style.background = couleur
      scene.append(p)
      // Le hasard de l'écran, pas celui des règles.
      const angle = ((i + Math.random() * 0.8) / combien) * 2 * Math.PI
      const loin = (28 + Math.random() * 34) * fort
      const dx = Math.cos(angle) * loin
      const dy = Math.sin(angle) * loin
      p.animate(
        [
          { transform: 'translate(-50%, -50%) scale(1)', opacity: 1 },
          { transform: `translate(calc(-50% + ${dx * 0.8}px), calc(-50% + ${dy * 0.8}px)) scale(0.8)`, opacity: 1, offset: 0.55 },
          { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy + 14}px)) scale(0.2)`, opacity: 0 },
        ],
        { duration: 380 + Math.random() * 200, easing: 'cubic-bezier(0.1, 0.8, 0.3, 1)' },
      ).onfinish = () => p.remove()
    }

    // L'ennemi recule du côté opposé au coup, blanchit, s'écrase.
    const recul = (x < scene.clientWidth / 2 ? 1 : -1) * STYLES[genre].recul
    const blanc = STYLES[genre].blanc
    portrait.animate(
      [
        { transform: 'none', filter: 'brightness(1)' },
        { transform: `translateX(${recul}px) scale(1.06, 0.9) rotate(${recul * 0.3}deg)`, filter: `brightness(${blanc}) saturate(0.4)`, offset: 0.2 },
        { transform: `translateX(${-recul * 0.3}px) scale(0.98, 1.03)`, filter: 'brightness(1.1)', offset: 0.55 },
        { transform: 'none', filter: 'brightness(1)' },
      ],
      { duration: STYLES[genre].critique ? 320 : 220, easing: 'ease-out' },
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
    // Le hasard de l'écran, pas celui des règles.
    return [x0 + l * (0.5 + dx + (Math.random() - 0.5) * 0.24), y0 + h * (0.42 + dy + (Math.random() - 0.5) * 0.2)]
  }

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
      imageArme.src = url(IMAGE_DE_L_ARME[j.arme])
      for (const [i, cle] of capacitesDe(C, j).entries()) {
        boutonsCapacite[i].image.src = url(IMAGE_DE_LA_CAPACITE[cle])
        boutonsCapacite[i].b.setAttribute('aria-label', C.capacites[cle].nom)
      }
      emplacement.style.setProperty('--rarete', RARETE[inventaire[place].rarete].couleur)
      emplacement.setAttribute('aria-label', `Arme : ${C.armes[j.arme].nom}, ${RARETE[inventaire[place].rarete].nom.toLowerCase()}`)
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
        // À l'ouverture, la fiche montre l'arme portée.
        cleDeLaFeuille = 'armes'
        choisie = placePortee()
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
    // EN RECHARGE, L'ILLUSTRATION SE GRISE (Keko : « parfois pas très lisible
    // que la capacité est en CD, surtout la conditionnelle qui ne bouge pas
    // régulièrement ») : l'attaque comme les capacités.
    attaque.classList.toggle('en-recharge', resteRecharge > 0)
    // Les capacités : le même voile ; prêtes, elles brillent ; leur effet
    // en cours, elles battent.
    for (const [i, cle] of capacitesDe(C, j).entries()) {
      const { b, voile } = boutonsCapacite[i]
      const avancee = avanceeDeCapacite(C, j, cle, t)
      voile.style.clipPath = `inset(${100 * avancee}% 0 0 0)`
      b.classList.toggle('prete', avancee >= 1)
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

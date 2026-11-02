/**
 * LE DONJON COOPÉRATIF À L'ÉCRAN — `?donjon`.
 *
 * Du DOM simple, sans React ni three. **L'ennemi EST le bouton** : une carte
 * du pool orc/gobelin debout sur le camp de sa race, qu'on tape (Keko : « l'ui
 * surchargé et pas très beau » — le gros bouton, les onglets et la vitesse
 * sont partis). Sous lui, son nom et ses PV, la dernière nouvelle du journal,
 * le niveau et les quatre améliorations. Le classement, le journal entier et
 * les réglages (vitesse, recommencer) s'ouvrent en feuille.
 *
 * Retour au doigt LÉGER (choisi par Keko) : l'ennemi s'écrase, le chiffre
 * s'envole (doré pour un critique), le suivant surgit à la mort. Pas de son.
 *
 * *Toutes les règles sont dans `logic/donjon/`* ; ici on lit l'horloge, on
 * joue les bots à leur heure et on dessine. Le joueur passe par `agir`, comme
 * eux. `&neuf` oublie la saison de cet appareil.
 */
import './donjon.css'
import { botsInitiaux, jouerLesBots, type EtatDesBots } from '../../logic/donjon/bots.ts'
import { AMELIORATIONS, DONJON, JOUR, type CleAmelioration } from '../../logic/donjon/config.ts'
import { changerDeVitesse, nouvelleHorloge, tempsDeJeu, type Horloge } from '../../logic/donjon/horloge.ts'
import { portraitDeLEtage } from '../../logic/donjon/ennemi.ts'
import { etatPartageLocal } from '../../logic/donjon/partage.ts'
import {
  chanceCritDe,
  coutDe,
  degatsDuTap,
  dpsEffectifDe,
  efficaciteDuTap,
  etatInitial,
  fatigueA,
  jourDeLaSaison,
  multCritDe,
  reposA,
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

/** Les quatre tuiles : un mot, et la valeur qu'elle fait monter. */
const TUILES: Record<CleAmelioration, { nom: string; valeur: (j: Joueur) => string }> = {
  tap: { nom: 'Coup', valeur: (j) => nombre(degatsDuTap(C, j)) },
  auto: { nom: 'Auto', valeur: (j) => `${nombre(dpsEffectifDe(C, j))}/s` },
  chanceCrit: { nom: 'Critique', valeur: (j) => pourcent(chanceCritDe(C, j)) },
  multCrit: { nom: 'Force', valeur: (j) => `×${multCritDe(C, j).toFixed(2).replace('.', ',')}` },
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

type Feuille = 'classement' | 'journal' | 'reglages'

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

  // La tête : la saison, le temps qui reste, deux icônes.
  const tete = el('header', 'donjon-tete')
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
  tete.append(infos, boutonClassement, boutonReglages)

  // La scène : le camp, l'ennemi debout dessus. C'est elle qu'on tape.
  const scene = el('div', 'donjon-scene')
  scene.setAttribute('role', 'button')
  scene.setAttribute('aria-label', 'Frapper l\'ennemi')
  const nouveauPortrait = () => {
    const img = el('img', 'donjon-portrait')
    img.alt = ''
    img.draggable = false
    return img
  }
  let portrait = nouveauPortrait()
  const pastilleEtage = el('div', 'donjon-pastille-etage')
  const etats = el('div', 'donjon-etats')
  const indice = el('div', 'donjon-indice', 'Touchez l\'ennemi pour frapper')
  scene.append(portrait, pastilleEtage, etats, indice)

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

  // Le joueur : son niveau, l'XP, ses points.
  const bande = el('section', 'donjon-bande')
  const niveau = el('div', 'donjon-niveau')
  const xp = el('div', 'donjon-xp')
  const xpPlein = el('div', 'donjon-xp-plein')
  xp.append(xpPlein)
  const points = el('div', 'donjon-points')
  bande.append(niveau, xp, points)

  // Les quatre améliorations, faites une fois (redessinées à chaque tic, les
  // boutons perdraient le clic entre l'appui et le relâchement).
  const tuiles = el('section', 'donjon-tuiles')
  const lesTuiles = AMELIORATIONS.map((quoi) => {
    const b = bouton('donjon-tuile')
    const titre = el('span', 'donjon-tuile-nom', TUILES[quoi].nom)
    const valeur = el('span', 'donjon-tuile-valeur')
    const cout = el('span', 'donjon-tuile-cout')
    b.append(titre, valeur, cout)
    b.addEventListener('click', () => {
      void partage.agir({ joueur: MOI, t: maintenant(), type: 'acheter', quoi }).then(() => {
        b.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.08)' }, { transform: 'scale(1)' }], { duration: 220, easing: 'ease-out' })
        sauver()
        dessiner()
      })
    })
    tuiles.append(b)
    return { quoi, b, valeur, cout }
  })

  page.append(tete, scene, fiche, fil, bande, tuiles)

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
  let cleDeLaFeuille = ''

  const TITRES: Record<Feuille, string> = { classement: 'Classement', journal: 'Journal', reglages: 'Réglages' }
  function ouvrir(f: Feuille): void {
    ouverte = f
    cleDeLaFeuille = ''
    feuilleTitre.textContent = TITRES[f]
    voile.classList.add('ouvert')
    dessiner()
  }
  function fermerLaFeuille(): void {
    ouverte = null
    voile.classList.remove('ouvert')
  }
  boutonClassement.addEventListener('click', () => ouvrir('classement'))
  boutonReglages.addEventListener('click', () => ouvrir('reglages'))
  fil.addEventListener('click', () => ouvrir('journal'))
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
  reglages.append(
    el('div', 'donjon-reglage-titre', 'Vitesse du temps'),
    vitesses,
    recommencer,
    el('div', 'donjon-build', `build ${build}`),
  )

  // ------------------------------------------------ le geste
  /** Le chiffre qui s'envole du doigt. */
  function envoler(x: number, y: number, texte: string, critique: boolean): void {
    const n = el('div', critique ? 'donjon-degat critique' : 'donjon-degat', texte)
    n.style.left = `${x}px`
    n.style.top = `${y}px`
    scene.append(n)
    const derive = (Math.random() - 0.5) * 40
    n.animate(
      [
        { transform: 'translate(-50%, -50%) scale(0.6)', opacity: 1 },
        { transform: `translate(calc(-50% + ${derive * 0.4}px), -120%) scale(${critique ? 1.35 : 1.1})`, opacity: 1, offset: 0.25 },
        { transform: `translate(calc(-50% + ${derive}px), -260%) scale(1)`, opacity: 0 },
      ],
      { duration: critique ? 900 : 700, easing: 'ease-out' },
    ).onfinish = () => n.remove()
  }

  scene.addEventListener('pointerdown', (ev) => {
    if (ev.button !== 0) return
    const t = maintenant()
    const avant = moi()
    const attendu = degatsDuTap(C, avant) * efficaciteDuTap(C, fatigueA(C, avant, t)) * (reposA(C, avant, t) >= 1 ? C.repos.mult : 1)
    const dejaInfliges = avant.degatsTap
    const boite = scene.getBoundingClientRect()
    const x = ev.clientX - boite.left
    const y = ev.clientY - boite.top
    portrait.animate(
      [
        { transform: 'scale(1)', filter: 'brightness(1)' },
        { transform: 'scale(1.04, 0.92)', filter: 'brightness(1.5)', offset: 0.3 },
        { transform: 'scale(1)', filter: 'brightness(1)' },
      ],
      { duration: 160, easing: 'ease-out' },
    )
    void partage.agir({ joueur: MOI, t, type: 'taper', n: 1 }).then(() => {
      const inflige = moi().degatsTap - dejaInfliges
      const critique = inflige > attendu * 1.05
      envoler(x, y, nombre(inflige), critique)
      dessiner()
    })
  })

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

    // Le repos et la fatigue ne se montrent que quand ils jouent.
    const efficacite = efficaciteDuTap(C, fatigueA(C, j, t))
    const repos = Math.floor(reposA(C, j, t))
    const pastilles: string[] = []
    if (repos >= 1) pastilles.push(`<span class="donjon-etat repos">Repos ×${C.repos.mult} · ${repos}</span>`)
    if (efficacite < 1) pastilles.push(`<span class="donjon-etat fatigue">Fatigue · ${pourcent(efficacite)}</span>`)
    const html = pastilles.join('')
    if (etats.innerHTML !== html) etats.innerHTML = html
    indice.hidden = j.degatsTap > 0

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
    points.textContent = j.points > 0 ? `${j.points} pt${j.points > 1 ? 's' : ''}` : ''
    points.classList.toggle('vide', j.points === 0)

    for (const tuile of lesTuiles) {
      const cout = coutDe(C, j, tuile.quoi)
      tuile.valeur.textContent = TUILES[tuile.quoi].valeur(j)
      tuile.cout.textContent = `${cout} pt${cout > 1 ? 's' : ''}`
      tuile.b.disabled = j.points < cout
    }

    for (const [i, b] of boutonsVitesse.entries()) b.classList.toggle('actif', C.vitesses[i] === horloge.vitesse)
    if (ouverte !== null) dessinerLaFeuille(ouverte)
  }

  function dessinerLaFeuille(f: Feuille): void {
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
  setInterval(sauver, 2000)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') sauver()
  })
  addEventListener('pagehide', sauver)
}

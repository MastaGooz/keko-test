/**
 * LE DONJON COOPÉRATIF À L'ÉCRAN — `?donjon`.
 *
 * Du HTML simple, sans React ni three : l'ennemi commun, le bouton d'attaque,
 * les améliorations, le journal, le classement, la vitesse du temps. *Toutes
 * les règles sont dans `logic/donjon/`* ; ici on lit l'horloge, on joue les
 * bots à leur heure et on dessine. Le joueur passe par `agir`, comme eux.
 *
 * `&neuf` oublie la saison de cet appareil et en commence une ; le bouton
 * « Recommencer » du pied y mène.
 */
import './donjon.css'
import { botsInitiaux, jouerLesBots, type EtatDesBots } from '../../logic/donjon/bots.ts'
import { AMELIORATIONS, DONJON, JOUR, type CleAmelioration } from '../../logic/donjon/config.ts'
import { changerDeVitesse, nouvelleHorloge, tempsDeJeu, type Horloge } from '../../logic/donjon/horloge.ts'
import { etatPartageLocal } from '../../logic/donjon/partage.ts'
import {
  chanceCritDe,
  coutDe,
  degatsDeBaseDuTap,
  degatsDuTap,
  dpsEffectifDe,
  efficaciteDuTap,
  etatInitial,
  fatigueA,
  jourDeLaSaison,
  multCritDe,
  reposA,
  dpsDe,
  xpPourNiveau,
} from '../../logic/donjon/regles.ts'
import type { EtatDonjon, Evenement, Joueur } from '../../logic/donjon/types.ts'
import { ecrireLeDonjon, lireLeDonjon, oublierLeDonjon } from './stockage.ts'

const C = DONJON
const MOI = 'vous'
const NOM_DU_JOUEUR = 'Vous'

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
  const sec = s % 60
  if (j > 0) return `${j} j ${h} h ${String(m).padStart(2, '0')} min`
  if (h > 0) return `${h} h ${String(m).padStart(2, '0')} min ${String(sec).padStart(2, '0')} s`
  return `${m} min ${String(sec).padStart(2, '0')} s`
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

const FICHES: Record<CleAmelioration, { nom: string; effet: (j: Joueur) => string }> = {
  tap: {
    nom: 'Coup',
    effet: (j) => `${nombre(degatsDeBaseDuTap(C, j))} dégâts + ${C.tap.secondesDeDps} s d'auto-tap`,
  },
  auto: { nom: 'Auto-tap', effet: (j) => `${nombre(dpsDe(C, j))} dégâts / s` },
  chanceCrit: { nom: 'Chance de critique', effet: (j) => pourcent(chanceCritDe(C, j)) },
  multCrit: { nom: 'Force des critiques', effet: (j) => `×${multCritDe(C, j).toFixed(2).replace('.', ',')}` },
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

type Onglet = 'ameliorations' | 'journal' | 'classement'

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

  // ------------------------------------------------ la page
  racine.replaceChildren()
  const page = el('div', 'donjon')
  racine.append(page)

  const tete = el('header', 'donjon-tete')
  const saison = el('div', 'donjon-saison')
  const reste = el('div', 'donjon-reste')
  const vitesses = el('div', 'donjon-vitesses')
  const boutonsVitesse = C.vitesses.map((v) => {
    const b = el('button', 'donjon-vitesse', `×${v}`)
    b.type = 'button'
    b.addEventListener('click', () => {
      horloge = changerDeVitesse(horloge, Date.now(), v)
      sauver()
      dessiner()
    })
    vitesses.append(b)
    return b
  })
  const infos = el('div', 'donjon-tete-infos')
  infos.append(saison, reste)
  tete.append(infos, vitesses)

  const ennemi = el('section', 'donjon-ennemi')
  const etage = el('div', 'donjon-etage')
  const nom = el('div', 'donjon-nom')
  const barre = el('div', 'donjon-barre')
  const pv = el('div', 'donjon-barre-pv')
  const pvTexte = el('span', 'donjon-barre-texte')
  barre.append(pv, pvTexte)
  ennemi.append(etage, nom, barre)

  const attaque = el('button', 'donjon-attaque')
  attaque.type = 'button'
  const attaqueTitre = el('span', 'donjon-attaque-titre', 'Attaquer')
  const attaqueNote = el('span', 'donjon-attaque-note')
  attaque.append(attaqueTitre, attaqueNote)
  attaque.addEventListener('click', () => {
    void partage.agir({ joueur: MOI, t: maintenant(), type: 'taper', n: 1 }).then(() => dessiner())
  })

  const moiBloc = el('section', 'donjon-moi')
  const moiLigne = el('div', 'donjon-moi-ligne')
  const xpBarre = el('div', 'donjon-xp')
  const xpPlein = el('div', 'donjon-xp-plein')
  xpBarre.append(xpPlein)
  const moiNote = el('div', 'donjon-moi-note')
  moiBloc.append(moiLigne, xpBarre, moiNote)

  const onglets = el('nav', 'donjon-onglets')
  let onglet: Onglet = 'ameliorations'
  const panneaux: Record<Onglet, HTMLElement> = {
    ameliorations: el('div', 'donjon-panneau'),
    journal: el('div', 'donjon-panneau'),
    classement: el('div', 'donjon-panneau'),
  }
  const titres: Record<Onglet, string> = { ameliorations: 'Améliorations', journal: 'Journal', classement: 'Classement' }
  const boutonsOnglet = (Object.keys(panneaux) as Onglet[]).map((o) => {
    const b = el('button', 'donjon-onglet', titres[o])
    b.type = 'button'
    b.addEventListener('click', () => {
      onglet = o
      dessiner()
    })
    onglets.append(b)
    return [o, b] as const
  })
  const corps = el('div', 'donjon-corps')
  corps.append(...Object.values(panneaux))

  // RECOMMENCER se confirme par une seconde tape (pas de fenêtre du
  // navigateur). On repart par `&neuf` plutôt qu'en vidant le stockage ici :
  // la sauvegarde de `pagehide` réécrirait l'ancienne saison en partant.
  const pied = el('footer', 'donjon-pied')
  const recommencer = el('button', 'donjon-recommencer', 'Recommencer')
  recommencer.type = 'button'
  let confirmation = 0
  recommencer.addEventListener('click', () => {
    if (recommencer.classList.contains('a-confirmer')) {
      const url = new URL(location.href)
      url.searchParams.set('neuf', '')
      location.replace(url.toString())
      return
    }
    recommencer.classList.add('a-confirmer')
    recommencer.textContent = 'Tout effacer ?'
    clearTimeout(confirmation)
    confirmation = window.setTimeout(() => {
      recommencer.classList.remove('a-confirmer')
      recommencer.textContent = 'Recommencer'
    }, 3000)
  })
  pied.append(el('span', undefined, `build ${build}`), recommencer)
  page.append(tete, ennemi, attaque, moiBloc, onglets, corps, pied)

  // Les lignes d'amélioration sont faites une fois : redessinées à chaque
  // tic, leurs boutons perdraient le clic entre l'appui et le relâchement.
  const lignes = AMELIORATIONS.map((quoi) => {
    const ligne = el('div', 'donjon-amelioration')
    const texte = el('div', 'donjon-amelioration-texte')
    const titre = el('div', 'donjon-amelioration-nom', FICHES[quoi].nom)
    const effet = el('div', 'donjon-amelioration-effet')
    texte.append(titre, effet)
    const bouton = el('button', 'donjon-acheter')
    bouton.type = 'button'
    bouton.addEventListener('click', () => {
      void partage.agir({ joueur: MOI, t: maintenant(), type: 'acheter', quoi }).then(() => {
        sauver()
        dessiner()
      })
    })
    ligne.append(texte, bouton)
    panneaux.ameliorations.append(ligne)
    return { quoi, titre, effet, bouton }
  })
  const pointsLigne = el('div', 'donjon-points')
  panneaux.ameliorations.prepend(pointsLigne)

  let cleDuJournal = ''

  // ------------------------------------------------ le dessin
  function dessiner(): void {
    const t = Math.max(maintenant(), etat.t)
    const moi = etat.joueurs.find((j) => j.id === MOI)
    if (moi === undefined) return

    saison.textContent = `Saison ${etat.saison.numero} · Jour ${jourDeLaSaison(etat, t)}`
    reste.textContent = `Fin dans ${duree(etat.saison.fin - t)}`
    boutonsVitesse.forEach((b, i) => b.classList.toggle('actif', C.vitesses[i] === horloge.vitesse))

    etage.textContent = `Étage ${etat.ennemi.etage}`
    nom.textContent = etat.ennemi.nom
    pv.style.width = `${(100 * Math.max(0, etat.ennemi.pv)) / etat.ennemi.pvMax}%`
    pvTexte.textContent = `${nombre(Math.max(0, etat.ennemi.pv))} / ${nombre(etat.ennemi.pvMax)} PV`

    const efficacite = efficaciteDuTap(C, fatigueA(C, moi, t))
    const repos = Math.floor(reposA(C, moi, t))
    const prochain = degatsDuTap(C, moi) * efficacite * (repos >= 1 ? C.repos.mult : 1)
    const etats = [`≈ ${nombre(prochain)} dégâts`]
    if (repos >= 1) etats.push(`repos ×${C.repos.mult} : ${repos} coups`)
    if (efficacite < 1) etats.push(`fatigue : frappe à ${pourcent(efficacite)}`)
    attaqueNote.textContent = etats.join(' · ')
    attaque.classList.toggle('fatigue', efficacite < 1)

    const besoin = xpPourNiveau(C, moi.niveau)
    moiLigne.textContent = `Niveau ${moi.niveau} · ${nombre(dpsEffectifDe(C, moi))} dégâts / s · ${moi.kills} achevé${moi.kills > 1 ? 's' : ''}`
    xpPlein.style.width = `${(100 * moi.xp) / besoin}%`
    moiNote.textContent = `XP ${nombre(moi.xp)} / ${nombre(besoin)} · ${nombre(moi.degatsTap + moi.degatsAuto)} dégâts cette saison`

    for (const [o, b] of boutonsOnglet) {
      b.classList.toggle('actif', o === onglet)
      b.classList.toggle('a-depenser', o === 'ameliorations' && moi.points > 0)
      panneaux[o].hidden = o !== onglet
    }
    if (onglet === 'ameliorations') dessinerLesAmeliorations(moi)
    if (onglet === 'journal') dessinerLeJournal()
    if (onglet === 'classement') dessinerLeClassement()
  }

  function dessinerLesAmeliorations(moi: Joueur): void {
    pointsLigne.textContent =
      moi.points === 0
        ? 'Aucun point à dépenser : les niveaux et les coups fatals en rapportent.'
        : `${moi.points} point${moi.points > 1 ? 's' : ''} à dépenser`
    pointsLigne.classList.toggle('a-depenser', moi.points > 0)
    for (const l of lignes) {
      const fiche = FICHES[l.quoi]
      const rang = moi.ameliorations[l.quoi]
      const cout = coutDe(C, moi, l.quoi)
      l.titre.textContent = `${fiche.nom} · rang ${rang}`
      l.effet.textContent = `${fiche.effet(moi)} → ${fiche.effet(auRangSuivant(moi, l.quoi))}`
      l.bouton.textContent = `Améliorer · ${cout} pt${cout > 1 ? 's' : ''}`
      l.bouton.disabled = moi.points < cout
    }
  }

  function dessinerLeJournal(): void {
    const dernier = etat.journal[etat.journal.length - 1]
    const cle = `${etat.saison.numero}:${etat.journal.length}:${dernier?.t}:${dernier?.type}`
    if (cle === cleDuJournal) return
    cleDuJournal = cle
    const liste = el('ol', 'donjon-journal')
    for (const ev of [...etat.journal].reverse()) {
      const li = el('li', ev.joueur === MOI ? 'donjon-c-moi' : ev.joueur === null ? 'donjon-c-saison' : undefined)
      li.append(el('span', 'donjon-journal-heure', heureDeJeu(etat, ev.t)), el('span', undefined, phrase(etat, ev)))
      liste.append(li)
    }
    panneaux.journal.replaceChildren(liste)
  }

  function dessinerLeClassement(): void {
    const total = etat.joueurs.reduce((s, j) => s + j.degatsTap + j.degatsAuto, 0)
    const tries = [...etat.joueurs].sort((a, b) => b.degatsTap + b.degatsAuto - (a.degatsTap + a.degatsAuto))
    const table = el('table', 'donjon-classement')
    const entete = el('tr')
    for (const h of ['', 'Joueur', 'Dégâts', 'Part', 'Niv.']) entete.append(el('th', undefined, h))
    table.append(entete)
    tries.forEach((j, i) => {
      const degats = j.degatsTap + j.degatsAuto
      const tr = el('tr', j.id === MOI ? 'donjon-c-moi' : undefined)
      tr.append(
        el('td', 'donjon-c-rang', String(i + 1)),
        el('td', undefined, j.nom),
        el('td', 'donjon-c-nombre', nombre(degats)),
        el('td', 'donjon-c-nombre', total > 0 ? pourcent(degats / total) : '—'),
        el('td', 'donjon-c-nombre', String(j.niveau)),
      )
      table.append(tr)
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
    panneaux.classement.replaceChildren(table, passees)
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
  setInterval(() => void tic(), 200)
  setInterval(sauver, 2000)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') sauver()
  })
  addEventListener('pagehide', sauver)
}

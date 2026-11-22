/**
 * Vérifications du vaisseau, sans navigateur : le temps est injecté.
 */
import { type Arme, recompenseDeFin, tableauVide, chanceDePlaque, ajouterUnPilote, avancerLEquipage, etatDuPilote, partDe, gabaritDInsecte, rayonDe, rocheDeLaTempete, vieMultipliee, cadenceDeLaVague, asteroideDeLaCase, coupeDUnCube, asteroidesAutour, avancer, avancerLeMonde, encaisser, purger, impactDuRayon, lancerLaBombe, larguer, porteeDeLaBombe, MINERAIS, nouveauMonde, nouveauVaisseau, solidite, voler, totalDe, stationDeLaCase, stationLaPlusProche, VAISSEAU, verrouiller, ennemiLePlusProche, type ConfigVaisseau, type Ennemi, type Evenement, type Vaisseau, xpDuNiveau, gemmesDuButin, tire, type Pepite } from './jeu.ts'
import { acheter, configDuHangar, hangarNeuf, monter, pieceDe } from './hangar.ts'
import { depuisTexte, retirerLesPilotes, retirerUnPilote, versTexte, vuDu, vuDuSecond } from './reseau.ts'

/** Les règles sont vérifiées SANS la zone calme de la base (le rival naît où que soit le joueur) et AVEC les extracteurs par case (éteints en jeu pour l'instant) ; la base et la station seule ont leurs propres vérifications, plus bas. */
const C: ConfigVaisseau = { ...VAISSEAU, base: { ...VAISSEAU.base, calme: 0 }, station: { ...VAISSEAU.station, seule: false } }

let echecs = 0
function verifier(quoi: string, vrai: boolean): void {
  if (!vrai) echecs += 1
  console.log(`  ${vrai ? 'ok  ' : 'ECHEC'}  ${quoi}`)
}

console.log('vaisseau')
const immobile = avancer(C, nouveauVaisseau(), 1, { x: 0, y: 0 }).vaisseau
/** La valeur d'un tas de pépites (au vortex, une gemme vaut 1, 3 ou 10 — voir `invasion.gemmes`). */
const valeurDes = (ps: Pepite[]): number => ps.reduce((n, p) => n + (p.valeur ?? 1), 0)
verifier('sans manche, il ne bouge pas', immobile.x === 0 && immobile.y === 0 && immobile.poussee === 0)

let v: Vaisseau = nouveauVaisseau()
for (let i = 0; i < 60; i++) v = avancer(C, v, 1 / 60, { x: 1, y: 0 }).vaisseau
verifier('poussé à droite une seconde, il va à droite et prend de la vitesse', v.x > 20 && v.vx > 30)
verifier('le nez se tourne vers la droite', Math.abs(v.cap) < 0.05)
for (let i = 0; i < 600; i++) v = avancer(C, v, 1 / 60, { x: 1, y: 0 }).vaisseau
verifier('la vitesse est plafonnée', Math.hypot(v.vx, v.vy) <= C.vitesseMax + 1e-6)
const glisse = avancer(C, v, 2, { x: 0, y: 0 }).vaisseau
verifier('manche lâché, il glisse en freinant à peine', glisse.vx > 0.2 * v.vx && glisse.vx < v.vx)

verifier('le champ est déterministe', JSON.stringify(asteroideDeLaCase(C, 3, -2)) === JSON.stringify(asteroideDeLaCase(C, 3, -2)))
const autour = asteroidesAutour(C, 0, 0, 400)
verifier('il y a des astéroïdes autour du départ, aucun dans le vide du départ', autour.length > 5 && autour.every((a) => Math.hypot(a.x, a.y) >= C.base.rayon))
verifier('tous ont un rayon dans les bornes', autour.every((a) => a.rayon >= C.champ.rayonMin && a.rayon <= C.champ.rayonMax))

// un choc : le vaisseau posé dans un astéroïde en sort, et le choc est rapporté
const a = autour[0]
const dedans: Vaisseau = { ...nouveauVaisseau(), x: a.x - a.rayon + 1, y: a.y, vx: 50, vy: 0 }
const choc = avancer(C, dedans, 1 / 60, { x: 0, y: 0 })
verifier('un choc repousse le vaisseau hors de l’astéroïde', Math.hypot(choc.vaisseau.x - a.x, choc.vaisseau.y - a.y) >= a.rayon + C.rayon - 1e-6)
verifier('et rend un rebond', choc.chocs.length === 1 && choc.vaisseau.vx < 0)
// s'appuyer doucement contre la roche n'est pas un choc, et un contact qui dure n'en refait pas
const appui: Vaisseau = { ...nouveauVaisseau(), x: a.x - a.rayon - C.rayon + 0.5, y: a.y, vx: 4, vy: 0 }
verifier('un contact doux ne fait pas de choc', avancer(C, appui, 1 / 60, { x: 1, y: 0 }).chocs.length === 0)
const deja: Vaisseau = { ...dedans, contact: a.id }
verifier('un contact qui dure ne refait pas de choc', avancer(C, deja, 1 / 60, { x: 0, y: 0 }).chocs.length === 0)

// le forage : posé près d'une roche, le laser la vise ; il la creuse à son débit ; elle éclate en pépites, qui montent à bord
const compter = (evs: Evenement[], type: Evenement['type']) => evs.filter((e) => e.type === type).length
const m = nouveauMonde()
m.prochainEnnemiA = 1e9 // pas d'ennemi pour ce test
m.vaisseau = { ...nouveauVaisseau(), x: a.x - a.rayon - 20, y: a.y }
avancerLeMonde(C, m, 1 / 60, { x: 0, y: 0 })
verifier('à portée, le laser vise la roche la plus proche, sur sa surface', m.forage !== null && m.forage.cible === a.id && Math.abs(Math.hypot(m.forage.x - a.x, m.forage.y - a.y) - a.rayon) < 0.01)
const loin = nouveauMonde()
loin.prochainEnnemiA = 1e9
loin.vaisseau = { ...nouveauVaisseau(), x: a.x - a.rayon - C.forage.portee - 30, y: a.y }
avancerLeMonde(C, loin, 1 / 60, { x: 0, y: 0 })
verifier('hors de portée, pas de forage', loin.forage === null)
let eclats = 0
let pas = 0
while (eclats === 0 && pas < 2000) {
  eclats += compter(avancerLeMonde(C, m, 1 / 60, { x: 0, y: 0 }).evenements, 'eclat')
  pas++
}
const attendu = solidite(C, a) / C.forage.debit
verifier('la roche éclate quand sa solidité est creusée', eclats === 1 && Math.abs(pas / 60 - attendu) < 0.1)
verifier('elle est partie et a laissé des pépites', m.detruits.has(a.id) && m.pepites.length >= 1 && m.forage === null)
let ramasses = 0
for (let i = 0; i < 600 && m.pepites.length > 0; i++) ramasses += compter(avancerLeMonde(C, m, 1 / 60, { x: 0, y: 0 }).evenements, 'ramasse')
verifier('les pépites viennent au vaisseau et montent à bord', m.pepites.length === 0 && ramasses >= 1 && m.minerai === ramasses)
verifier('la cargaison dit le minerai de chaque pépite', totalDe(m.cargaison) === m.minerai && m.cargaison[a.minerai] >= 1)
// LES FILONS (Keko) : chaque roche a un minerai et une richesse ; l'or et le cristal sont plus fréquents loin du départ
const pres = asteroidesAutour(C, 0, 0, 1500)
const loinDuDepart = asteroidesAutour(C, 9000, 9000, 1500)
const saine = (r: { minerai: string; richesse: number }) => (MINERAIS as readonly string[]).includes(r.minerai) && r.richesse >= 0.25 && r.richesse <= 1
const partRare = (l: { minerai: string }[]) => l.filter((r) => r.minerai !== 'fer').length / l.length
verifier('chaque roche porte un minerai et une richesse', pres.length > 50 && pres.every(saine) && loinDuDepart.every(saine))
verifier('l’or et le cristal sont plus fréquents loin du départ', partRare(loinDuDepart) > partRare(pres) + 0.1 && pres.some((r) => r.minerai === 'cristal'))
// la roche partie ne repousse plus : on traverse son ancienne place
m.vaisseau = { ...m.vaisseau, x: a.x, y: a.y, vx: 0, vy: 0 }
const traverse = avancerLeMonde(C, m, 1 / 60, { x: 0, y: 0 })
verifier('une roche détruite ne repousse plus le vaisseau', traverse.chocs.length === 0 && Math.abs(m.vaisseau.x - a.x) < 0.01 && Math.abs(m.vaisseau.y - a.y) < 0.01)

// L'ENNEMI : il apparaît à l'heure dite au loin, mine quand le joueur est loin, chasse et tire quand il est près
const w = nouveauMonde()
let apparu: Evenement | undefined
for (let i = 0; i < Math.ceil(C.ennemi.apparait * 60) + 2 && apparu === undefined; i++) apparu = avancerLeMonde(C, w, 1 / 60, { x: 0, y: 0 }).evenements.find((e) => e.type === 'ennemiApparait')
verifier('l’ennemi apparaît à l’heure dite, au loin', apparu !== undefined && w.ennemis.length === 1 && Math.abs(Math.hypot(w.ennemis[0].corps.x, w.ennemis[0].corps.y) - C.ennemi.distance) < 1)
let aMine = false
/** Sa première roche, et où il était en la creusant (plus tard, chargé, il en choisit d'autres ou fuit). */
let premiere: { roche: number | null; x: number; y: number } | null = null
let tirLoin = false
let tirs = 0
for (let i = 0; i < 60 * 25; i++) {
  const r = avancerLeMonde(C, w, 1 / 60, { x: 0, y: 0 })
  const e = w.ennemis[0]
  if (e === undefined) break
  if (e.fait === 'mine' && e.forage !== null) {
    aMine = true
    if (premiere === null) premiere = { roche: e.roche, x: e.corps.x, y: e.corps.y }
  }
  if (compter(r.evenements, 'tir') > 0 && Math.hypot(e.corps.x - w.vaisseau.x, e.corps.y - w.vaisseau.y) > C.ennemi.voit + 1) tirLoin = true
  tirs += compter(r.evenements, 'tir')
}
verifier('il trouve une roche et la mine', aMine)
const roches = asteroidesAutour(C, 0, 0, 900)
const laRoche = roches.find((r) => r.id === premiere?.roche)
verifier('et c’est une roche près de LUI, là où il rôde', laRoche !== undefined && premiere !== null && Math.hypot(laRoche.x - premiere.x, laRoche.y - premiere.y) - laRoche.rayon <= C.ennemi.cherche && Math.hypot(laRoche.x, laRoche.y) - laRoche.rayon <= C.ennemi.rode)
verifier('il rôde sans se perdre (de roche en roche il reste dans sa laisse)', w.ennemis.length === 1 && Math.hypot(w.ennemis[0].corps.x, w.ennemis[0].corps.y) < C.ennemi.rode + C.ennemi.cherche)
verifier('il ne tire jamais sur un joueur qu’il ne voit pas', !tirLoin)
// le joueur se pose à côté de lui : il chasse, tire, et les traits percent la coque
const e0 = w.ennemis[0]
e0.butin = 0 // (en 25 s de mine il s'est chargé, et chargé il fuirait)
w.vaisseau = { ...nouveauVaisseau(), x: e0.corps.x + C.ennemi.tient, y: e0.corps.y }
w.detruits = new Set(asteroidesAutour(C, w.vaisseau.x, w.vaisseau.y, 300).map((r) => r.id)) // le champ dégagé : rien n'arrête les traits
let touches = 0
tirs = 0
w.coque = C.coque // (il a pu tirer sur le joueur immobile pendant la phase de mine : on repart d'une coque neuve)
for (let i = 0; i < 60 * 14 && w.coque > 1; i++) {
  const r = avancerLeMonde(C, w, 1 / 60, { x: 0, y: 0 })
  tirs += compter(r.evenements, 'tir')
  touches += compter(r.evenements, 'touche')
}
verifier('le joueur à portée, il chasse et tire', w.ennemis[0]?.fait === 'chasse' && tirs >= 3)
verifier('ses traits percent la coque', touches >= 1 && w.coque === C.coque - touches)
// SON LASER NE L'ATTAQUE PAS (Keko) : tenu à portée de forage du joueur, en vue, il tire mais ne pose pas de rayon sur lui
const brule = nouveauMonde()
brule.prochainEnnemiA = 0
avancerLeMonde(C, brule, 1 / 60, { x: 0, y: 0 })
brule.detruits = new Set(asteroidesAutour(C, 0, 0, 400).map((r) => r.id))
brule.coque = C.coque
let rayonSurLeJoueur = false
let coqueEntiere = true
for (let i = 0; i < 90; i++) {
  const en = brule.ennemis[0]
  en.corps = { ...en.corps, x: brule.vaisseau.x - (C.forage.portee - 10), y: brule.vaisseau.y, vx: 0, vy: 0 }
  en.pv = C.ennemi.pv // (le laser du joueur le creuse : on le garde en vie)
  avancerLeMonde(C, brule, 1 / 60, { x: 0, y: 0 })
  if (brule.ennemis[0]?.forage !== null) rayonSurLeJoueur = true
  if (brule.coque !== Math.round(brule.coque)) coqueEntiere = false // (seuls ses traits, entiers, l'entament)
  brule.tirs = []
}
verifier('à portée de forage, en chasse, le rival ne pose pas son laser sur le joueur', !rayonSurLeJoueur && coqueEntiere && brule.ennemis[0].fait === 'chasse')
// LA FOREUSE NE SERT QU'AUX ROCHES (Keko) : collé au rival sans arme, le laser ne l'entame pas ; AVEC UN CANON, il l'abat
const RICHE = 99999
// (LES MISSILES SONT UNE ARME LOURDE depuis le 14/11, que seul le cuirassé porte : ces vérifications-ci, qui s'en servent
// comme d'une arme quelconque sur les petits châssis, les prennent pour légers — le calibre est vérifié dans `flotte.verif.ts`)
pieceDe('arme-missiles')!.lourde = false
const armer = (...ids: string[]): ConfigVaisseau => configDuHangar(C, ids.reduce((h, id) => monter(acheter(h, RICHE, id)!.hangar, id), hangarNeuf()))
const poserPres = (cfg: ConfigVaisseau) => {
  const z = nouveauMonde(cfg)
  z.prochainEnnemiA = 0
  avancerLeMonde(cfg, z, 1 / 60, { x: 0, y: 0 })
  const en = z.ennemis[0]
  z.vaisseau = { ...nouveauVaisseau(), x: en.corps.x + 30, y: en.corps.y }
  z.detruits = new Set(asteroidesAutour(cfg, z.vaisseau.x, z.vaisseau.y, 300).map((r) => r.id))
  z.coque = 1000 // (le rival tire : on regarde le rival, pas la coque)
  return z
}
const sansArme = poserPres(C)
let rayonSurLeRival = false
for (let i = 0; i < 60 * 3; i++) {
  avancerLeMonde(C, sansArme, 1 / 60, { x: 0, y: 0 })
  if (sansArme.forage !== null && sansArme.forage.sorte !== 'roche') rayonSurLeRival = true
}
verifier('sans arme, collé au rival trois secondes, le laser ne l’entame pas', !rayonSurLeRival && sansArme.ennemis.length === 1 && sansArme.ennemis[0].pv === C.ennemi.pv && sansArme.obus.length === 0)
const canon = armer('arme-canon')
const z = poserPres(canon)
let abattu = 0
let obus = 0
let touchesRival = 0
let pasZ = 0
while (abattu === 0 && pasZ < 60 * 20) {
  const r = avancerLeMonde(canon, z, 1 / 60, { x: 0, y: 0 })
  abattu += compter(r.evenements, 'ennemiDetruit')
  obus += compter(r.evenements, 'obus')
  touchesRival += compter(r.evenements, 'ennemiTouche')
  pasZ++
}
verifier('avec un canon, les obus partent seuls, touchent le rival et l’abattent (il rend ses pépites)', abattu === 1 && obus >= Math.ceil(C.ennemi.pv / 6) && touchesRival >= Math.ceil(C.ennemi.pv / 6) && z.ennemis.length === 0 && z.pepites.length >= C.ennemi.butinRendu)
verifier('la coque de série porte une arme, la blindée deux', armer('arme-canon', 'arme-rafale').armes.length === 1 && armer('coque-2', 'arme-canon', 'arme-rafale', 'arme-missiles').armes.length === 2)
const missiles = armer('arme-missiles')
const zm = poserPres(missiles)
zm.vaisseau = { ...zm.vaisseau, x: zm.ennemis[0].corps.x + 150, y: zm.ennemis[0].corps.y + 40 } // (plus loin que le canon, de biais)
zm.detruits = new Set(asteroidesAutour(missiles, zm.vaisseau.x, zm.vaisseau.y, 400).map((r) => r.id))
let toucheMissile = 0
for (let i = 0; i < 60 * 6 && toucheMissile === 0; i++) toucheMissile += compter(avancerLeMonde(missiles, zm, 1 / 60, { x: 0, y: 0 }).evenements, 'ennemiTouche')
verifier('un missile guidé rattrape le rival de loin', toucheMissile >= 1)
// LE BOUCLIER (la coque à bouclier) prend les traits avant la coque, puis se recharge — des traits posés à la main : le
// rival en chasse recule à 80 et sa dispersion fait manquer un trait sur deux, rien de mesurable
const bouclier = armer('coque-3')
const zb = nouveauMonde(bouclier)
zb.prochainEnnemiA = 1e9
zb.detruits = new Set(asteroidesAutour(bouclier, 0, 0, 300).map((r) => r.id))
let absorbes = 0
let touchesCoque = 0
for (let n = 0; n < 3; n++) {
  zb.intouchableJusque = -1 // (on éprouve le bouclier, pas l'invulnérabilité qui suit un coup)
  zb.tirs.push({ id: 900 + n, x: -12, y: 0, vx: 120, vy: 0, vie: 1 })
  for (let i = 0; i < 30 && zb.tirs.length > 0; i++) {
    const r = avancerLeMonde(bouclier, zb, 1 / 60, { x: 0, y: 0 })
    absorbes += compter(r.evenements, 'bouclier')
    touchesCoque += compter(r.evenements, 'touche')
  }
}
verifier('le bouclier prend les deux premiers traits, la coque le troisième', absorbes === 2 && touchesCoque === 1 && zb.coque === bouclier.coque - 1 && zb.bouclier < 1)
for (let i = 0; i < 60 * (bouclier.bouclier.delai + 2 / bouclier.bouclier.regain + 1); i++) avancerLeMonde(bouclier, zb, 1 / 60, { x: 0, y: 0 })
verifier('sans coup, le bouclier se recharge en entier', zb.bouclier === bouclier.bouclier.points)
// … ET UNE FRACTION DE BOUCLIER COMPTE (Keko, 13/11) : 0,3 de bouclier et un trait d'un point — la coque perd 0,7
zb.bouclier = 0.3
zb.toucheA = zb.t // (un coup tout juste reçu : il ne se recharge pas pendant le vol du trait)
const coqueAvantLaFraction = zb.coque
zb.tirs.push({ id: 950, x: -12, y: 0, vx: 120, vy: 0, vie: 1 })
for (let i = 0; i < 30 && zb.tirs.length > 0; i++) avancerLeMonde(bouclier, zb, 1 / 60, { x: 0, y: 0 })
verifier('une fraction de bouclier prend sa part du coup, la coque le reste', zb.bouclier === 0 && Math.abs(zb.coque - (coqueAvantLaFraction - 0.7)) < 1e-9)
// LA MARCHE ARRIÈRE (Keko, 13/11) : pousser droit derrière le nez ne donne qu'une part de la poussée d'une marche avant
// (`marcheArriere`) ; de côté, toute la poussée ; avec ou sans regard — sans lui, le temps que le nez tourne
{
  const haut = { x: 0, y: -1 }
  const pas = (dir: { x: number; y: number }, regard?: { x: number; y: number }): number => {
    const r = voler(C, C, nouveauVaisseau(), 1 / 60, dir, new Set(), regard).vaisseau
    return Math.hypot(r.vx, r.vy)
  }
  const avant = pas({ x: 0, y: -1 }, haut)
  verifier('nez tenu, la marche arrière pousse à la part voulue', Math.abs(pas({ x: 0, y: 1 }, haut) / avant - C.marcheArriere) < 1e-6)
  verifier('nez tenu, glisser de côté pousse à fond', Math.abs(pas({ x: 1, y: 0 }, haut) / avant - 1) < 1e-6)
  verifier('sans regard aussi, pousser derrière le nez pousse à la part voulue', Math.abs(pas({ x: 0, y: 1 }) / avant - C.marcheArriere) < 1e-6)
  // (… et LA MANIABILITÉ SE SENT : un demi-tour d'un seul manche est plus vif avec un nez qui tourne vite)
  const demiTour = (rotation: number): number => {
    let w = nouveauVaisseau()
    for (let i = 0; i < 30; i++) w = voler({ ...C, rotation }, { ...C, rotation }, w, 1 / 60, { x: 0, y: 1 }, new Set()).vaisseau
    return w.vy
  }
  verifier('d’un seul manche, un demi-tour va plus vite avec un nez plus maniable', demiTour(C.rotation * 2) > demiTour(C.rotation) * 1.02 && demiTour(C.rotation) > demiTour(C.rotation / 2) * 1.02)
}
// DEUX FOREUSES (Keko, 13/11) : chacune creuse la roche la plus proche DE SA PLACE — posées de part et d'autre du
// vaisseau, entre deux roches, elles en creusent deux à la fois
{
  const cfg = { ...VAISSEAU, foreuses: [{ debit: 1, portee: 1, outil: 0, cran: 1, place: { x: 0, y: -30 } }, { debit: 1, portee: 1, outil: 1, cran: 1, place: { x: 0, y: 30 } }] }
  const w = nouveauMonde(cfg)
  w.prochainEnnemiA = 1e9
  const roches = asteroidesAutour(cfg, 0, 0, 900).filter((r) => Math.hypot(r.x, r.y) > 150)
  const [r1] = roches
  // (le vaisseau est posé à côté d'une roche, le nez vers +x : sa foreuse de gauche est à −y… on vérifie surtout que
  // chaque laser part de sa place et prend la roche la plus proche d'elle)
  w.vaisseau = { ...nouveauVaisseau(), x: r1.x - r1.rayon - 20, y: r1.y, cap: 0 }
  avancerLeMonde(cfg, w, 1 / 60, { x: 0, y: 0 })
  const cibles = w.forages.map((f) => f?.cible ?? -1)
  verifier('deux foreuses : deux lasers, un par foreuse, chacun sur une roche à sa portée (ou aucun)', w.forages.length === 2 && cibles.some((id) => id === r1.id) && w.forage !== null)
  const seule = { ...VAISSEAU, foreuses: [{ debit: 1, portee: 1, outil: 0, cran: 1 }] }
  const w2 = nouveauMonde(seule)
  w2.prochainEnnemiA = 1e9
  w2.vaisseau = { ...nouveauVaisseau(), x: r1.x - r1.rayon - 20, y: r1.y, cap: 0 }
  avancerLeMonde(seule, w2, 1 / 60, { x: 0, y: 0 })
  const w3 = nouveauMonde(VAISSEAU)
  w3.prochainEnnemiA = 1e9
  w3.vaisseau = { ...nouveauVaisseau(), x: r1.x - r1.rayon - 20, y: r1.y, cap: 0 }
  avancerLeMonde(VAISSEAU, w3, 1 / 60, { x: 0, y: 0 })
  verifier('une seule foreuse au centre creuse comme le foreur unique d’avant', JSON.stringify(w2.forage) === JSON.stringify(w3.forage) && w2.forage !== null)
}
// L'INVASION (le jeu du vortex) : des vagues d'insectes marchent vers le portail, au centre, et le traversent ;
// approchés, ils chassent le joueur, le mordent, et le lâchent s'ils sont entraînés trop loin
{
  const cfg = { ...VAISSEAU, champ: { ...VAISSEAU.champ, densite: 0 }, station: { ...VAISSEAU.station, portee: -1 }, invasion: { ...VAISSEAU.invasion, active: true }, ennemi: { ...VAISSEAU.ennemi, pv: 6, poussee: 90, vitesseMax: 40, rotation: 6, rayon: 5 } }
  const loin = (w: ReturnType<typeof nouveauMonde>): void => {
    w.vaisseau = { ...nouveauVaisseau(), x: 5000, y: 5000 }
  }
  const w = nouveauMonde(cfg, 7)
  loin(w)
  let vagues = 0
  let traverses = 0
  let nes = 0
  for (let i = 0; i < 60 * 40; i++) {
    const r = avancerLeMonde(cfg, w, 1 / 60, { x: 0, y: 0 })
    loin(w)
    vagues += compter(r.evenements, 'vague')
    traverses += compter(r.evenements, 'traverse')
    nes += compter(r.evenements, 'ennemiApparait')
  }
  verifier('l’invasion : une vague naît sur le cercle, ses insectes marchent au portail et le traversent ; la suivante vient après, plus nombreuse', vagues >= 2 && nes >= cfg.invasion.vague + 1 && traverses >= cfg.invasion.vague && w.invasion.passes === traverses && w.invasion.vague === vagues)
  // l'aggro : le joueur posé près d'un insecte en marche
  const z = nouveauMonde(cfg, 7)
  loin(z)
  for (let i = 0; i < 60 * 6 && z.ennemis.length === 0; i++) {
    avancerLeMonde(cfg, z, 1 / 60, { x: 0, y: 0 })
    loin(z)
  }
  const ins = z.ennemis[0]
  z.coque = 1000
  z.vaisseau = { ...nouveauVaisseau(), x: ins.corps.x + 30, y: ins.corps.y }
  avancerLeMonde(cfg, z, 1 / 60, { x: 0, y: 0 })
  const pris = ins.fait === 'aggro'
  for (let i = 0; i < 60 * 3; i++) avancerLeMonde(cfg, z, 1 / 60, { x: 0, y: 0 })
  verifier('approché, l’insecte prend le joueur en chasse, le rejoint et le mord', pris && Math.hypot(ins.corps.x - z.vaisseau.x, ins.corps.y - z.vaisseau.y) < 20 && z.coque < 1000)
  // (IL POURSUIT TRÈS LOIN — Keko, 16/11 : plus de laisse autour du portail ; il ne lâche que quand le joueur s'éloigne trop
  // de LUI) : le joueur file à 1 500 du portail, l'insecte à 150 derrière lui — il chasse toujours ; puis le joueur saute à
  // `lache` + 40 de l'insecte — il lâche
  ins.corps = { ...ins.corps, x: 1350, y: 0, vx: 0, vy: 0 }
  z.vaisseau = { ...z.vaisseau, x: 1500, y: 0, vx: 0, vy: 0 }
  avancerLeMonde(cfg, z, 1 / 60, { x: 0, y: 0 })
  const tient = ins.fait === 'aggro'
  z.vaisseau = { ...z.vaisseau, x: ins.corps.x + cfg.invasion.lache + 40, y: 0, vx: 0, vy: 0 }
  avancerLeMonde(cfg, z, 1 / 60, { x: 0, y: 0 })
  verifier('une grande zone d’aggro ; loin du portail (à 1 500), il poursuit toujours le joueur qui reste à portée de lui ; il ne lâche que quand le joueur s’éloigne trop de lui', cfg.invasion.aggro >= 150 && tient && ins.fait === 'marche')
  // (CE QUE LE VAISSEAU POSE L'ATTIRE SUR LUI — Keko, 20/11) : le joueur loin de l'insecte, hors de toute aggro ; une
  // tourelle posée à 30 de l'insecte (sa portée, 75) le fait chasser le vaisseau — même au-delà de `lache` ; sans elle, il marche
  {
    const tourelle = { id: 'tourelle', cadence: 0.8, degats: 0, portee: 75, vitesse: 220, vie: 0.5, dispersion: 0, guide: false, pose: { tous: 1e9, ecart: 28, max: 5, duree: 18, pivot: 8, jet: 34, vol: 0.4 } }
    const cfgT = { ...cfg, armes: [tourelle] }
    const essai = (pose: 'tourelle' | 'flaque' | null): Ennemi['fait'] => {
      const w = nouveauMonde(cfgT, 7)
      loin(w)
      for (let i = 0; i < 60 * 6 && w.ennemis.length === 0; i++) avancerLeMonde(cfgT, w, 1 / 60, { x: 0, y: 0 }), loin(w)
      const e = w.ennemis[0]
      w.vaisseau = { ...nouveauVaisseau(), x: e.corps.x + cfg.invasion.lache + 100, y: e.corps.y }
      if (pose === 'flaque') w.flaques.push({ id: 998, x: e.corps.x + 5, y: e.corps.y, nee: w.t, rayon: 14, duree: 4, dps: 0, brulure: 0, dpsBrulure: 0 })
      if (pose === 'tourelle') w.tourelles.push({ id: 999, x: e.corps.x + 30, y: e.corps.y, nee: w.t, cap: 0, tirA: 1e9, arme: 0, x0: e.corps.x + 30, y0: e.corps.y, lancee: w.t, deployee: true })
      avancerLeMonde(cfgT, w, 1 / 60, { x: 0, y: 0 })
      avancerLeMonde(cfgT, w, 1 / 60, { x: 0, y: 0 })
      return e.fait
    }
    verifier('un insecte à portée d’une tourelle posée — ou dans une flaque de feu — prend le vaisseau en chasse, même loin de lui ; sans elles, il marche au portail', essai('tourelle') === 'aggro' && essai('flaque') === 'aggro' && essai(null) === 'marche')
  }
  // le contour du portail téléporte, même un insecte en chasse
  const c2 = nouveauMonde(cfg, 7)
  loin(c2)
  for (let i = 0; i < 60 * 6 && c2.ennemis.length === 0; i++) {
    avancerLeMonde(cfg, c2, 1 / 60, { x: 0, y: 0 })
    loin(c2)
  }
  const chasseur = c2.ennemis[0]
  c2.coque = 1000
  chasseur.corps = { ...chasseur.corps, x: cfg.invasion.portail + 20, y: 0, vx: 0, vy: 0 }
  c2.vaisseau = { ...nouveauVaisseau(), x: -40, y: 0 } // (de l'autre côté du portail : il le traverse pour venir)
  let pasChasse = 0
  let franchis = 0
  for (let i = 0; i < 60 * 4 && franchis === 0; i++) {
    franchis += compter(avancerLeMonde(cfg, c2, 1 / 60, { x: 0, y: 0 }).evenements, 'traverse')
    if (i === 0) pasChasse = chasseur.fait === 'aggro' ? 1 : 0
  }
  verifier('un insecte EN CHASSE qui touche le contour du portail est téléporté : il compte comme passé', pasChasse === 1 && franchis === 1 && c2.invasion.passes === 1 && c2.ennemis.length === 0)
  // LA MORT N'EST PAS LA FIN : abattu, le joueur revient au portail après la pénalité ; le monde a continué
  const mort = nouveauMonde(cfg, 7)
  mort.coque = 0.5
  loin(mort)
  for (let i = 0; i < 60 * 6 && mort.ennemis.length === 0; i++) {
    avancerLeMonde(cfg, mort, 1 / 60, { x: 0, y: 0 })
    loin(mort)
  }
  const tueur = mort.ennemis[0]
  mort.vaisseau = { ...nouveauVaisseau(), x: tueur.corps.x + 8, y: tueur.corps.y }
  let perdus = 0
  for (let i = 0; i < 60 * 3 && mort.phase === 'vol'; i++) perdus += compter(avancerLeMonde(cfg, mort, 1 / 60, { x: 0, y: 0 }).evenements, 'perdu')
  const tMort = mort.t
  let retours = 0
  for (let i = 0; i < 60 * (cfg.invasion.penalite + 1); i++) retours += compter(avancerLeMonde(cfg, mort, 1 / 60, { x: 0, y: 0 }).evenements, 'retour')
  verifier('abattu, le joueur revient au portail après la pénalité, blindage et bouclier pleins ; le temps a continué', perdus === 1 && retours === 1 && mort.phase === 'vol' && mort.coque === cfg.coque && Math.hypot(mort.vaisseau.x, mort.vaisseau.y) < 60 && mort.t > tMort + cfg.invasion.penalite - 0.1)
  // L'EXPÉRIENCE : une pépite ramassée, un point ; la barre pleine, un niveau — et rien ne va en soute
  const xp = nouveauMonde(cfg, 7)
  xp.vaisseau = { ...nouveauVaisseau(), x: 2000, y: 0 }
  for (let k = 0; k < xpDuNiveau(cfg, 1) + 1; k++) xp.pepites.push({ id: 900 + k, x: 2000 + k, y: 1, vx: 0, vy: 0, graine: k, minerai: 'fer' })
  let niveaux = 0
  for (let i = 0; i < 60; i++) niveaux += compter(avancerLeMonde(cfg, xp, 1 / 60, { x: 0, y: 0 }).evenements, 'niveau')
  verifier('l’expérience : la barre pleine fait un niveau, le surplus reste ; la soute ne reçoit rien', niveaux === 1 && xp.invasion.niveau === 2 && xp.invasion.xp === 1 && xp.minerai === 0 && xpDuNiveau(cfg, 2) > xpDuNiveau(cfg, 1))
  // LA VIE DU PORTAIL : chaque insecte passé lui enlève un pour cent ; à zéro, la partie est finie et plus rien n'avance
  const fragile = { ...cfg, invasion: { ...cfg.invasion, viePortail: 2 } }
  const f = nouveauMonde(fragile, 7)
  loin(f)
  let fins = 0
  let vieApresUn = -1
  for (let i = 0; i < 60 * 60 && fins === 0; i++) {
    const r = avancerLeMonde(fragile, f, 1 / 60, { x: 0, y: 0 })
    loin(f)
    if (f.invasion.passes === 1 && vieApresUn < 0) vieApresUn = f.invasion.vie
    fins += compter(r.evenements, 'fin')
  }
  const tFin = f.t
  avancerLeMonde(fragile, f, 1, { x: 0, y: 0 })
  verifier('le portail commence à 100 %, perd un pour cent par insecte passé ; à zéro, la partie est finie et le monde s’arrête', nouveauMonde(cfg, 7).invasion.vie === 100 && vieApresUn === 1 && fins === 1 && f.invasion.vie === 0 && f.invasion.finie && f.t === tFin)
  // UNE VAGUE VIENT D'UN SEUL CADRAN (un par joueur) : tous ses insectes naissent dans le même quart du monde
  const cadranDe = (x: number, y: number): number => Math.floor((((Math.atan2(y, x) + Math.PI * 2) % (Math.PI * 2)) / (Math.PI / 2)))
  const parVague = (joueurs: number): Set<number>[] => {
    const cf = { ...cfg, invasion: { ...cfg.invasion, joueurs } }
    const q = nouveauMonde(cf, 7)
    loin(q)
    const vus: Set<number>[] = []
    for (let i = 0; i < 60 * 70; i++) {
      const r = avancerLeMonde(cf, q, 1 / 60, { x: 0, y: 0 })
      loin(q)
      for (const e of r.evenements) {
        if (e.type === 'vague') vus.push(new Set())
        if (e.type === 'ennemiApparait') vus[vus.length - 1].add(cadranDe(e.x, e.y))
      }
    }
    return vus
  }
  const seul = parVague(1)
  const aDeux = parVague(2)
  verifier('seul, chaque vague vient d’un seul cadran, pas le même deux fois de suite ; à deux joueurs, de deux cadrans', seul.length >= 3 && seul.every((v) => v.size === 1) && seul.slice(1).every((v, i) => [...v][0] !== [...seul[i]][0]) && aDeux.length >= 2 && aDeux.every((v) => v.size === 2))
  const paisible = nouveauMonde(VAISSEAU, 7)
  verifier('le Nova Drifter n’a pas d’invasion', !VAISSEAU.invasion.active && paisible.invasion.vague === 0)
}
// LA VISÉE PART DE LA BOUCHE (Keko, 14/11) : un canon monté sur l'aile touche une petite cible immobile, de près comme de loin
{
  const canon = { id: 'canon', cadence: 0.4, degats: 1, portee: 120, vitesse: 170, vie: 1, dispersion: 0, guide: false, bouche: { x: 2, y: 7 } }
  const cfg = { ...VAISSEAU, champ: { ...VAISSEAU.champ, densite: 0 }, station: { ...VAISSEAU.station, portee: -1 }, armes: [canon], ennemi: { ...VAISSEAU.ennemi, apparait: 1e9, rayon: 3, pv: 1000 } }
  const touchesA = (distance: number): number => {
    const w = nouveauMonde(cfg, 3)
    w.ennemis.push({ id: 77, corps: { ...nouveauVaisseau(), x: 0, y: -distance }, pv: 1000, fait: 'marche', roche: null, forage: null, tirA: 1e9, butin: 0, cargaison: { fer: 0, or: 0, cristal: 0 }, calmeA: 1e9 })
    let n = 0
    for (let i = 0; i < 60 * 3; i++) {
      w.ennemis[0].corps = { ...w.ennemis[0].corps, x: 0, y: -distance, vx: 0, vy: 0 }
      n += compter(avancerLeMonde({ ...cfg, invasion: { ...cfg.invasion, active: false } }, w, 1 / 60, { x: 0, y: 0 }).evenements, 'ennemiTouche')
    }
    return n
  }
  verifier('un canon sur l’aile touche une petite cible de face, à 20 comme à 100 (la visée part de sa bouche)', touchesA(20) >= 5 && touchesA(100) >= 5)
}
// L'ALTERNANCE (Keko, 14/11) : deux canons rechargés depuis longtemps ne partent pas ensemble — gauche, puis droite, à intervalles égaux
{
  const canon = { id: 'canon', cadence: 2, degats: 1, portee: 120, vitesse: 170, vie: 1, dispersion: 0, guide: false }
  const cfg = { ...VAISSEAU, champ: { ...VAISSEAU.champ, densite: 0 }, station: { ...VAISSEAU.station, portee: -1 }, alternance: true, armes: [{ ...canon, place: 0, bouche: { x: 2, y: -7 } }, { ...canon, place: 1, bouche: { x: 2, y: 7 } }], ennemi: { ...VAISSEAU.ennemi, apparait: 1e9, pv: 1000 } }
  const w = nouveauMonde(cfg, 3)
  w.t = 50 // (les deux canons sont prêts depuis longtemps)
  w.ennemis.push({ id: 77, corps: { ...nouveauVaisseau(), x: 0, y: -60 }, pv: 1000, fait: 'marche', roche: null, forage: null, tirA: 1e9, butin: 0, cargaison: { fer: 0, or: 0, cristal: 0 }, calmeA: 1e9 })
  const tirs: { t: number; y: number }[] = []
  for (let i = 0; i < 60 * 5; i++) {
    w.ennemis[0].corps = { ...w.ennemis[0].corps, x: 0, y: -60, vx: 0, vy: 0 }
    for (const e of avancerLeMonde(cfg, w, 1 / 60, { x: 0, y: 0 }).evenements) if (e.type === 'obus') tirs.push({ t: w.t, y: e.x })
  }
  const ecarts = tirs.slice(1).map((x, i) => x.t - tirs[i].t)
  verifier('deux canons tirent un par un, un côté puis l’autre, à intervalles égaux (la moitié de la cadence)', tirs.length >= 4 && ecarts.every((d) => Math.abs(d - 1) < 0.05) && tirs.slice(1).every((x, i) => Math.sign(x.y) !== Math.sign(tirs[i].y)))
}
// L'ARC DE TIR (Keko, 15/11) : le canon tire sur ce qui est devant le nez, pas sur le côté ni derrière
{
  const canon = { id: 'canon', cadence: 0.5, degats: 1, portee: 120, vitesse: 170, vie: 1, dispersion: 0, guide: false }
  const cfg = { ...VAISSEAU, champ: { ...VAISSEAU.champ, densite: 0 }, station: { ...VAISSEAU.station, portee: -1 }, arcDeTir: (50 * Math.PI) / 180, armes: [canon], ennemi: { ...VAISSEAU.ennemi, apparait: 1e9, pv: 1000 } }
  const tirsVers = (x: number, y: number): number => {
    const w = nouveauMonde(cfg, 3) // (le nez vers le haut : −y)
    w.ennemis.push({ id: 77, corps: { ...nouveauVaisseau(), x, y }, pv: 1000, fait: 'marche', roche: null, forage: null, tirA: 1e9, butin: 0, cargaison: { fer: 0, or: 0, cristal: 0 }, calmeA: 1e9 })
    let n = 0
    for (let i = 0; i < 120; i++) {
      w.ennemis[0].corps = { ...w.ennemis[0].corps, x, y, vx: 0, vy: 0 }
      n += compter(avancerLeMonde(cfg, w, 1 / 60, { x: 0, y: 0 }).evenements, 'obus')
    }
    return n
  }
  verifier('dans l’arc de tir : devant et de biais, il tire ; sur le côté et derrière, non', tirsVers(0, -60) > 0 && tirsVers(35, -50) > 0 && tirsVers(60, 0) === 0 && tirsVers(0, 60) === 0)
}
// LE RIVAL ARMÉ (Keko, 14/11) : de vraies armes, chacune à sa cadence ; un missile tourne vers le joueur
{
  const canon = { id: 'canon', cadence: 1.1, degats: 6, portee: 120, vitesse: 170, vie: 1, dispersion: 0, guide: false }
  const missile = { id: 'missiles', cadence: 2.8, degats: 14, portee: 190, vitesse: 95, vie: 3, dispersion: 0, guide: true }
  const socle = armer('arme-canon')
  const cfg = { ...socle, ennemi: { ...socle.ennemi, armes: [canon, missile], voit: 200 } }
  const w = poserPres(cfg)
  w.coque = 1000
  let traits = 0
  let guides = 0
  for (let i = 0; i < 60 * 4; i++) {
    avancerLeMonde(cfg, w, 1 / 60, { x: 0, y: 0 })
    traits = Math.max(traits, w.tirs.length)
    if (w.tirs.some((x) => x.guide === true)) guides += 1
  }
  verifier('le rival armé tire ses armes, un missile guidé parmi elles, et blesse selon l’arme (un obus de canon : un point)', traits >= 1 && guides > 0 && w.coque < 1000 && Math.abs(canon.degats * cfg.ennemi.partDesDegats - 1) < 1e-9)
  const sans = poserPres(socle)
  let vus = 0
  for (let i = 0; i < 60 * 4; i++) {
    avancerLeMonde(socle, sans, 1 / 60, { x: 0, y: 0 })
    vus += sans.tirs.length
  }
  verifier('sans armes, le rival garde son trait unique, un point', vus > 0 && sans.tirs.every((x) => x.degats === undefined))
}
// LE PILOTAGE À TOURELLES (Keko, 13/11) : le regard ne tourne pas la coque — seul le manche du vol la fait virer
{
  const cfg = { ...VAISSEAU, tourelles: true }
  const w = nouveauMonde(cfg)
  w.prochainEnnemiA = 1e9
  for (let i = 0; i < 90; i++) avancerLeMonde(cfg, w, 1 / 60, { x: 0, y: -1 }, { x: 1, y: 0 }, true)
  verifier('à tourelles, le regard ne tourne pas le nez (il reste dans l’axe du manche)', Math.abs(Math.sin(w.vaisseau.cap) + 1) < 1e-6)
  const ch = nouveauMonde(VAISSEAU)
  ch.prochainEnnemiA = 1e9
  for (let i = 0; i < 90; i++) avancerLeMonde(VAISSEAU, ch, 1 / 60, { x: 0, y: -1 }, { x: 1, y: 0 }, true)
  verifier('en chasseur, le regard tourne le nez', Math.cos(ch.vaisseau.cap) > 0.9)
}
// LE POIDS : la coque blindée accélère moins et glisse plus que celle de série
const lourde = armer('coque-2')
let vs = nouveauVaisseau()
let vl = nouveauVaisseau()
for (let i = 0; i < 60; i++) {
  vs = avancer(C, vs, 1 / 60, { x: 1, y: 0 }).vaisseau
  vl = avancer(lourde, vl, 1 / 60, { x: 1, y: 0 }).vaisseau
}
const gs = avancer(C, { ...vs, vx: 60, vy: 0 }, 2, { x: 0, y: 0 }).vaisseau
const gl = avancer(lourde, { ...vl, vx: 60, vy: 0 }, 2, { x: 0, y: 0 }).vaisseau
verifier('la coque blindée a plus de points, accélère moins et glisse plus', lourde.coque === 8 && vl.vx < vs.vx * 0.9 && gl.vx > gs.vx)
// L'AIMANT est un outil (Keko) : une pépite hors de portée de série vient avec le grand aimant (sur la coque à deux outils)
const longue = armer('coque-3', 'aimant-2')
const aimante = (cfg: ConfigVaisseau) => {
  const w = nouveauMonde(cfg)
  w.pepites.push({ id: 99, x: 60, y: 0, vx: 0, vy: 0, graine: 1, minerai: 'fer' })
  for (let i = 0; i < 60; i++) avancerLeMonde(cfg, w, 1 / 60, { x: 0, y: 0 })
  return w.pepites.length === 0 ? -1 : w.pepites[0].x
}
verifier('à 60 unités, la pépite ne bouge pas de série et vient avec le grand aimant', aimante(C) > 59 && aimante(longue) < 40)
// LES CHOCS FONT MAL : lancé à pleine vitesse sur une petite roche, le joueur perd de la coque et la roche éclate
const petite = autour.filter((r) => r.rayon < 7).sort((r1, r2) => r1.rayon - r2.rayon)[0]
const k = nouveauMonde()
k.prochainEnnemiA = 1e9
k.vaisseau = { ...nouveauVaisseau(), x: petite.x - petite.rayon - C.rayon - 2, y: petite.y, vx: C.vitesseMax, vy: 0 }
// quelques pas : il lui faut le temps d'arriver sur la roche
let chocsK = 0
let touchesK = 0
let eclatsK = 0
for (let i = 0; i < 6 && chocsK === 0; i++) {
  const rk = avancerLeMonde(C, k, 1 / 60, { x: 0, y: 0 })
  chocsK += rk.chocs.length
  touchesK += compter(rk.evenements, 'touche')
  eclatsK += compter(rk.evenements, 'eclat')
}
verifier('un choc à pleine vitesse coûte de la coque, en proportion', chocsK === 1 && k.coque < C.coque && k.coque > C.coque - 3 && touchesK === 1)
verifier('et fait éclater une petite roche', k.detruits.has(petite.id) && eclatsK === 1)
// SOUS BOUCLIER, PAS DE BÉLIER (Keko) : le même choc avec la coque à bouclier — le bouclier encaisse, la roche n'a rien
const kb = nouveauMonde(armer('coque-3'))
kb.prochainEnnemiA = 1e9
kb.vaisseau = { ...nouveauVaisseau(), x: petite.x - petite.rayon - C.rayon - 2, y: petite.y, vx: C.vitesseMax, vy: 0 }
let boucliersKb = 0
let chocsKb = 0
for (let i = 0; i < 6 && chocsKb === 0; i++) {
  const rk = avancerLeMonde(armer('coque-3'), kb, 1 / 60, { x: 0, y: 0 })
  chocsKb += rk.chocs.length
  boucliersKb += compter(rk.evenements, 'bouclier')
}
verifier('sous bouclier, le choc lancé n’abîme pas la roche (le bouclier encaisse)', chocsKb === 1 && boucliersKb === 1 && !kb.detruits.has(petite.id) && (kb.creuse.get(petite.id) ?? 0) < 5) // (le foreur, lui, la creuse un peu : on regarde le choc, qui seul l'aurait fait éclater)
// LES VAISSEAUX SE HEURTENT (Keko) : lancé sur le rival, le joueur rebondit, et les deux prennent des dégâts ; sous
// bouclier, le rival n'a rien
const heurt = (cfg: ConfigVaisseau) => {
  const w = nouveauMonde(cfg)
  w.prochainEnnemiA = 0
  avancerLeMonde(cfg, w, 1 / 60, { x: 0, y: 0 })
  w.detruits = new Set(asteroidesAutour(cfg, 0, 0, 400).map((r) => r.id))
  w.ennemis[0].corps = { ...w.ennemis[0].corps, x: 30, y: 0, vx: 0, vy: 0 }
  w.vaisseau = { ...nouveauVaisseau(), x: 0, y: 0, vx: C.vitesseMax, vy: 0 }
  let touchesRival = 0
  for (let i = 0; i < 30; i++) touchesRival += compter(avancerLeMonde(cfg, w, 1 / 60, { x: 0, y: 0 }).evenements, 'ennemiTouche')
  return { w, touchesRival }
}
const h1 = heurt(C)
verifier('le joueur lancé sur le rival rebondit (sa vitesse vers lui s’inverse) et les deux prennent des dégâts', h1.w.vaisseau.vx < C.vitesseMax * 0.5 && h1.w.coque < C.coque && h1.touchesRival >= 1 && h1.w.ennemis[0].pv < C.ennemi.pv && Math.hypot(h1.w.ennemis[0].corps.x - h1.w.vaisseau.x, h1.w.ennemis[0].corps.y - h1.w.vaisseau.y) >= C.rayon + C.ennemi.rayon - 0.5)
// (la pointe de la configuration de base : le propulseur de série, l'étalon le plus bas depuis le 13/11, plafonnait
// l'élan sous le seuil d'un choc)
const h2 = heurt({ ...armer('coque-3'), vitesseMax: C.vitesseMax })
verifier('sous bouclier, le rival heurté n’a rien (pas de bélier)', h2.touchesRival === 0 && h2.w.ennemis[0].pv === C.ennemi.pv && h2.w.bouclier < 2)
const doux = nouveauMonde()
doux.prochainEnnemiA = 1e9
doux.vaisseau = { ...nouveauVaisseau(), x: petite.x - petite.rayon - C.rayon + 0.5, y: petite.y, vx: 6, vy: 0 }
const rd = avancerLeMonde(C, doux, 1 / 60, { x: 1, y: 0 })
// (le laser, lui, creuse la roche voisine : on regarde le choc et la coque, pas le creusement)
verifier('un contact doux ne coûte rien à personne', rd.chocs.length === 0 && doux.coque === C.coque && !doux.detruits.has(petite.id))
// l'ennemi aussi : jeté sur une grosse roche, il perd des points et l'abîme
const grosse = autour.filter((r) => r.rayon > 11)[0]
const q = nouveauMonde()
q.prochainEnnemiA = 0
avancerLeMonde(C, q, 1 / 60, { x: 0, y: 0 })
const enq = q.ennemis[0]
enq.corps = { ...enq.corps, x: grosse.x - grosse.rayon - C.ennemi.rayon - 1, y: grosse.y, vx: C.ennemi.vitesseMax, vy: 0 }
q.vaisseau = { ...nouveauVaisseau(), x: grosse.x + 500, y: grosse.y + 500 }
const rq = avancerLeMonde(C, q, 1 / 60, { x: 0, y: 0 })
verifier('le rival qui heurte une roche perd des points et l’abîme', enq.pv < C.ennemi.pv && (q.creuse.get(grosse.id) ?? 0) > 0 && rq.chocs.length === 1)

// LA STATION : à quai avec du minerai, on dépose à la cadence ; loin d'elle, rien
// RIEN NE SE DÉPOSE AU PASSAGE (Keko : l'extraction est le seul moyen de sécuriser) : à quai, le minerai reste à bord
const st = nouveauMonde()
st.prochainEnnemiA = 1e9
st.minerai = 5
st.sorti = true
for (let i = 0; i < 60 * 2; i++) avancerLeMonde(C, st, 1 / 60, { x: 0, y: 0 })
verifier('à quai, le minerai porté reste à bord tant que l’extraction n’est pas finie', st.minerai === 5 && st.banque === 0 && st.extraction > 1.9)
// LES STATIONS SONT PARTOUT (Keko) : une par case de 900, celle du départ en (0, 0), chacune dans sa case ; la plus
// proche n'est jamais à plus d'une case ; le vide du champ entoure chacune ; on dépose à n'importe laquelle
const origine = stationDeLaCase(C, 0, 0)
let dansSaCase = true
let plusLoinQue = 0
for (let j = -4; j <= 4; j++)
  for (let i = -4; i <= 4; i++) {
    const st = stationDeLaCase(C, i, j)
    if (Math.abs(st.x - i * C.station.case) > C.station.case / 2 || Math.abs(st.y - j * C.station.case) > C.station.case / 2) dansSaCase = false
  }
for (const [x, y] of [[2000, -1300], [-5000, 4200], [731, 12], [-120, -3300]]) {
  const st = stationLaPlusProche(C, x, y)
  plusLoinQue = Math.max(plusLoinQue, Math.hypot(st.x - x, st.y - y))
}
verifier('une station par case, celle du départ au départ, jamais à plus d’une case', origine.x === 0 && origine.y === 0 && dansSaCase && plusLoinQue <= C.station.case * Math.SQRT1_2 * 1.4 + 1)
const lointaine = stationDeLaCase(C, 3, -2)
const autourDElle = asteroidesAutour(C, lointaine.x, lointaine.y, C.champ.vide + C.champ.rayonMax)
verifier('le vide du champ entoure chaque station', (lointaine.x !== 0 || lointaine.y !== 0) && autourDElle.every((a) => Math.hypot(a.x - lointaine.x, a.y - lointaine.y) >= C.champ.vide + a.rayon))
const la = nouveauMonde()
la.prochainEnnemiA = 1e9
la.minerai = 2
la.sorti = true
la.vaisseau = { ...nouveauVaisseau(), x: lointaine.x + 10, y: lointaine.y }
let ouLa: { x: number; y: number } | null = null
for (let i = 0; i < 60 * 11 && la.phase === 'vol'; i++) for (const e of avancerLeMonde(C, la, 1 / 60, { x: 0, y: 0 }).evenements) if (e.type === 'extrait') ouLa = { x: e.x, y: e.y }
// L'EXTRACTION (Keko) : né à quai, le compte ne court pas ; sorti puis revenu, il monte, retombe à zéro si on ressort,
// et au bout de la durée la partie est extraite
const ex = nouveauMonde()
ex.prochainEnnemiA = 1e9
for (let i = 0; i < 60 * 11; i++) avancerLeMonde(C, ex, 1 / 60, { x: 0, y: 0 })
verifier('né à quai, le compte de l’extraction ne court pas', ex.phase === 'vol' && ex.extraction === 0)
ex.vaisseau = { ...nouveauVaisseau(), x: C.station.portee + 40, y: 0 }
avancerLeMonde(C, ex, 1 / 60, { x: 0, y: 0 })
ex.vaisseau = nouveauVaisseau()
for (let i = 0; i < 60 * 5; i++) avancerLeMonde(C, ex, 1 / 60, { x: 0, y: 0 })
const aMiChemin = ex.extraction
ex.vaisseau = { ...nouveauVaisseau(), x: C.station.portee + 40, y: 0 }
for (let i = 0; i < 60; i++) avancerLeMonde(C, ex, 1 / 60, { x: 0, y: 0 })
verifier('revenu à quai le compte monte, ressorti il redescend (il ne retombe pas à zéro)', aMiChemin > 4.9 && aMiChemin < 5.1 && ex.extraction > 3.9 && ex.extraction < 4.1 && ex.phase === 'vol')
ex.vaisseau = nouveauVaisseau()
ex.minerai = 7
ex.cargaison = { fer: 4, or: 2, cristal: 1 }
const resteEx = C.extraction.duree - ex.extraction
let extraits = 0
let ouEx: { x: number; y: number; pepites: number } | null = null
let pasEx = 0
while (ex.phase === 'vol' && pasEx < 60 * 12) {
  for (const e of avancerLeMonde(C, ex, 1 / 60, { x: 0, y: 0 }).evenements) if (e.type === 'extrait') (extraits++, (ouEx = { x: e.x, y: e.y, pepites: e.pepites }))
  pasEx++
}
verifier('resté à quai jusqu’au bout, la partie est extraite et le porté passe en banque', ex.phase === 'extrait' && extraits === 1 && ouEx !== null && ouEx!.x === 0 && ouEx!.y === 0 && ouEx!.pepites === 7 && ex.banque === 7 && ex.minerai === 0 && ex.tresor.or === 2 && ex.tresor.cristal === 1 && totalDe(ex.cargaison) === 0 && Math.abs(pasEx / 60 - resteEx) < 0.1)
// LE RIVAL ACCOURT vers une extraction en cours (Keko : les dix secondes doivent être une menace) : hors de vue mais à
// portée d'« accourt », il chasse dès que le compte court, et mine sinon
const acc = nouveauMonde()
acc.prochainEnnemiA = 0
avancerLeMonde(C, acc, 1 / 60, { x: 0, y: 0 })
acc.detruits = new Set(asteroidesAutour(C, 0, 0, 600).map((r) => r.id))
acc.sorti = true
const poserLeRival = (d: number) => (acc.ennemis[0].corps = { ...acc.ennemis[0].corps, x: d, y: 0, vx: 0, vy: 0 })
poserLeRival(C.ennemi.voit + 100)
acc.extraction = 0
acc.vaisseau = { ...nouveauVaisseau(), x: C.station.portee + 40, y: 0 } // hors du parvis : le compte ne court pas
for (let i = 0; i < 30; i++) avancerLeMonde(C, acc, 1 / 60, { x: 0, y: 0 })
const sansCompte = acc.ennemis[0].fait
poserLeRival(C.ennemi.voit + 100)
acc.vaisseau = nouveauVaisseau() // à quai : le compte court
let tireDeLoin = 0
for (let i = 0; i < 30; i++) tireDeLoin += compter(avancerLeMonde(C, acc, 1 / 60, { x: 0, y: 0 }).evenements, 'tir')
verifier('le rival accourt vers une extraction en cours, sans tirer avant de voir', sansCompte === 'mine' && acc.extraction > 0.4 && acc.ennemis[0].fait === 'chasse' && acc.ennemis[0].corps.x < C.ennemi.voit + 100 - 5 && tireDeLoin === 0)
// CHARGÉ, IL FUIT (Keko : « avec beaucoup de ressources ils fuient le joueur, avec peu le poursuivent ») : le même rival
// à portée de vue, avec peu de butin il chasse ; avec `fuit` pépites il s'éloigne plein gaz sans tirer, et remine hors de vue
const fu = nouveauMonde()
fu.prochainEnnemiA = 0
avancerLeMonde(C, fu, 1 / 60, { x: 0, y: 0 })
fu.detruits = new Set(asteroidesAutour(C, 0, 0, 700).map((r) => r.id))
fu.ennemis[0].corps = { ...fu.ennemis[0].corps, x: C.ennemi.voit - 30, y: 0, vx: 0, vy: 0 }
fu.ennemis[0].butin = C.ennemi.fuit - 1
for (let i = 0; i < 30; i++) avancerLeMonde(C, fu, 1 / 60, { x: 0, y: 0 })
const peuCharge = fu.ennemis[0].fait
fu.ennemis[0].corps = { ...fu.ennemis[0].corps, x: C.ennemi.voit - 30, y: 0, vx: 0, vy: 0 }
fu.ennemis[0].butin = C.ennemi.fuit
let tireEnFuyant = 0
let fuitVu = false
for (let i = 0; i < 60 * 6; i++) {
  tireEnFuyant += compter(avancerLeMonde(C, fu, 1 / 60, { x: 0, y: 0 }).evenements, 'tir')
  if (fu.ennemis[0].fait === 'fuit') fuitVu = true
}
verifier('peu chargé il chasse ; chargé il fuit plein gaz sans tirer, jusqu’au large, puis remine', peuCharge === 'chasse' && fuitVu && tireEnFuyant === 0 && fu.ennemis[0].corps.x > C.ennemi.lache - 2 && fu.ennemis[0].fait === 'mine' && fu.coque === C.coque)
// LA SOUTE (la capacité de la coque — Keko) : pleine, la pépite reste là, ni aimantée ni ramassée
const soute = nouveauMonde({ ...C, capacite: 2 })
soute.prochainEnnemiA = 1e9
soute.minerai = 2
soute.cargaison.fer = 2
soute.pepites.push({ id: 99, x: 20, y: 0, vx: 0, vy: 0, graine: 1, minerai: 'fer' })
for (let i = 0; i < 60; i++) avancerLeMonde({ ...C, capacite: 2 }, soute, 1 / 60, { x: 0, y: 0 })
verifier('la soute pleine : la pépite à portée d’aimant ne bouge pas et n’est pas ramassée', soute.pepites.length === 1 && soute.pepites[0].x > 19 && soute.minerai === 2)
verifier('on s’extrait à n’importe quelle station, et l’événement dit laquelle', la.phase === 'extrait' && la.banque === 2 && ouLa !== null && ouLa!.x === lointaine.x && ouLa!.y === lointaine.y)

const p = nouveauMonde()
p.coque = 1
p.tirs.push({ id: 1, x: 0, y: 0, vx: 0, vy: 0, vie: 1 })
p.prochainEnnemiA = 1e9
const rp = avancerLeMonde(C, p, 1 / 60, { x: 0, y: 0 })
verifier('la coque percée perd la partie', p.phase === 'perdu' && compter(rp.evenements, 'perdu') === 1)

// LA BASE : le champ est vide sur son envergure, et aucun rival ne naît tant que le joueur est dans sa zone calme
const calme = nouveauMonde()
let neALaBase = false
for (let i = 0; i < (VAISSEAU.ennemi.apparait + 5) * 60; i++) neALaBase ||= avancerLeMonde(VAISSEAU, calme, 1 / 60, { x: 0, y: 0 }).evenements.some((e) => e.type === 'ennemiApparait')
verifier('à la base, aucun rival ne naît, même passé l’heure', !neALaBase && calme.ennemis.length === 0)
calme.vaisseau = { ...calme.vaisseau, x: VAISSEAU.base.calme + 20, y: 0 }
calme.sorti = true
const neAuLarge = avancerLeMonde(VAISSEAU, calme, 1 / 60, { x: 0, y: 0 }).evenements.some((e) => e.type === 'ennemiApparait')
verifier('sorti de la zone calme, il naît — au large, plus loin de la base que le joueur', neAuLarge && calme.ennemis.length === 1 && Math.hypot(calme.ennemis[0].corps.x, calme.ennemis[0].corps.y) > VAISSEAU.base.calme + 20)
verifier('le champ est vide sur l’envergure de la base', asteroidesAutour(VAISSEAU, 0, 0, 400).every((a) => Math.hypot(a.x, a.y) >= VAISSEAU.base.rayon + a.rayon))

// UNE SEULE STATION (Keko : « un seul point d'entrée et de sortie ») : la plus proche est toujours la base, et on ne s'extrait plus au loin
verifier('une seule station : la plus proche est la base, où qu’on soit', [[2000, -1300], [-9000, 4200], [13500, -9000]].every(([x, y]) => { const st = stationLaPlusProche(VAISSEAU, x, y); return st.x === 0 && st.y === 0 }))
const ancienne = stationDeLaCase(VAISSEAU, 3, -2)
const loinDeTout = nouveauMonde()
loinDeTout.prochainEnnemiA = 1e9
loinDeTout.sorti = true
loinDeTout.vaisseau = { ...nouveauVaisseau(), x: ancienne.x, y: ancienne.y }
loinDeTout.detruits = new Set(asteroidesAutour(VAISSEAU, ancienne.x, ancienne.y, 60).map((a) => a.id))
for (let i = 0; i < 60 * 2; i++) avancerLeMonde(VAISSEAU, loinDeTout, 1 / 60, { x: 0, y: 0 })
verifier('là où était un extracteur, on ne s’extrait plus', loinDeTout.extraction === 0 && loinDeTout.phase === 'vol')

// LARGUER : le minerai quitte la soute et n'existe plus ; jamais plus qu'on n'en porte
const lg = nouveauMonde()
lg.cargaison.fer = 7
lg.cargaison.cristal = 2
lg.minerai = 9
const partis = larguer(lg, 'fer', 5)
const trop = larguer(lg, 'cristal', 10)
verifier('larguer : le minerai quitte la soute, sans pépite libre ni trésor ; pas plus qu’on n’en porte', partis === 5 && trop === 2 && lg.cargaison.fer === 2 && lg.cargaison.cristal === 0 && lg.minerai === 2 && lg.pepites.length === 0 && totalDe(lg.tresor) === 0)

// LE MINERAI REFUSÉ : sa pépite n'est ni aimantée ni ramassée ; une autre, à côté, l'est
const rf = nouveauMonde()
rf.prochainEnnemiA = 1e9
rf.refuses.fer = true
rf.pepites.push({ id: 98, x: 20, y: 0, vx: 0, vy: 0, graine: 1, minerai: 'fer' }, { id: 99, x: -20, y: 0, vx: 0, vy: 0, graine: 2, minerai: 'cristal' })
for (let i = 0; i < 120; i++) avancerLeMonde(C, rf, 1 / 60, { x: 0, y: 0 })
verifier('le minerai refusé : sa pépite ne bouge pas et reste dehors, celle d’un autre minerai monte à bord', rf.pepites.length === 1 && rf.pepites[0].minerai === 'fer' && rf.pepites[0].x > 19 && rf.cargaison.fer === 0 && rf.cargaison.cristal === 1)

// LA GRAINE DU CHAMP : une autre graine, un autre champ ; la même, le même ; la base garde son vide
const champDe = (graine: number) => JSON.stringify(asteroidesAutour({ ...VAISSEAU, champ: { ...VAISSEAU.champ, graine } }, 0, 0, 600).map((a) => [Math.round(a.x), Math.round(a.y), a.minerai]))
verifier('la graine du champ : zéro est le champ de toujours, une autre en fait un autre, la même refait le même', champDe(0) === JSON.stringify(asteroidesAutour(VAISSEAU, 0, 0, 600).map((a) => [Math.round(a.x), Math.round(a.y), a.minerai])) && champDe(7) !== champDe(0) && champDe(7) !== champDe(8) && champDe(7) === champDe(7))
verifier('quelle que soit la graine, le champ est vide sur l’envergure de la base', [3, 99, 4242].every((graine) => asteroidesAutour({ ...VAISSEAU, champ: { ...VAISSEAU.champ, graine } }, 0, 0, 400).every((a) => Math.hypot(a.x, a.y) >= VAISSEAU.base.rayon + a.rayon)))

console.log(echecs === 0 ? 'Tout passe.' : `${echecs} echec(s).`)
// le regard : le nez va où l'on regarde, la poussée où l'on pousse
{
  const m = nouveauMonde()
  for (let i = 0; i < 90; i++) avancerLeMonde(VAISSEAU, m, 1 / 60, { x: 1, y: 0 }, { x: -1, y: 0 })
  const sansRegard = nouveauMonde()
  for (let i = 0; i < 90; i++) avancerLeMonde(VAISSEAU, sansRegard, 1 / 60, { x: 1, y: 0 })
  verifier('avec un regard, le vaisseau avance vers le manche et son nez pointe vers le regard ; sans, le nez suit le manche', m.vaisseau.vx > 20 && Math.cos(m.vaisseau.cap) < -0.9 && Math.cos(sansRegard.vaisseau.cap) > 0.9 && m.vaisseau.vx <= sansRegard.vaisseau.vx + 1e-9 && m.vaisseau.vx > 0.4 * sansRegard.vaisseau.vx) // (regarder à gauche en poussant à droite, c'est reculer : moins de poussée depuis le 13/11)
}

// la bombe : des charges comptées, une explosion qui éclate les roches autour
{
  const m = nouveauMonde()
  const roche = asteroidesAutour(VAISSEAU, 0, 0, 600).sort((a, b) => Math.hypot(a.x, a.y) - Math.hypot(b.x, b.y))[0]
  // (posé à côté d'elle, face à elle)
  // (hors de portée du laser, qui la creuserait : la bombe seule)
  m.vaisseau = { ...m.vaisseau, x: roche.x - roche.rayon - 80, y: roche.y, vx: 0, vy: 0, cap: 0 }
  const partie = lancerLaBombe(VAISSEAU, m, { x: 1, y: 0 })
  let explosions = 0
  for (let i = 0; i < 120; i++) explosions += avancerLeMonde(VAISSEAU, m, 1 / 60, { x: 0, y: 0 }).evenements.filter((e) => e.type === 'explosion').length
  verifier('une bombe part droit devant, coûte une charge, éclate une fois au contact de la roche, qui éclate sans rien rendre (aucun laser ne l’a creusée)', partie && m.charges === VAISSEAU.bombe.charges - 1 && explosions === 1 && m.bombes.length === 0 && m.detruits.has(roche.id) && m.pepites.length + m.minerai === 0)
  verifier('la bombe va plus ou moins loin selon la force du geste : au plus près, à mi-chemin sur une tape, à pleine portée', porteeDeLaBombe(VAISSEAU, { x: 0.1, y: 0 }) < porteeDeLaBombe(VAISSEAU) && porteeDeLaBombe(VAISSEAU) < porteeDeLaBombe(VAISSEAU, { x: 0, y: -1 }) && Math.abs(porteeDeLaBombe(VAISSEAU, { x: 3, y: 0 }) - VAISSEAU.bombe.vitesse * VAISSEAU.bombe.vie) < 1e-9)
  for (let i = 0; i < 5; i++) lancerLaBombe(VAISSEAU, m, { x: 0, y: -1 })
  verifier('pas plus de bombes que de charges : la quatrième ne part pas', m.charges === 0 && !lancerLaBombe(VAISSEAU, m) && m.bombes.length === VAISSEAU.bombe.charges - 1 && m.bombes.every((b) => b.vy < 0 && Math.abs(b.vx) < 1e-9))
}

// la bouche d'une arme : ses obus en partent, tournée du cap du vaisseau
{
  const avecBouche = { ...canon, armes: canon.armes.map((a) => ({ ...a, bouche: { x: 2, y: 6 } })) }
  const zb = poserPres(avecBouche)
  zb.vaisseau = { ...zb.vaisseau, cap: Math.PI / 2 } // (le nez vers le bas de l'écran : « devant » est +y, « à droite » est −x)
  let depart: { x: number; y: number } | null = null
  for (let i = 0; i < 60 * 3 && depart === null; i++) {
    const avant = { x: zb.vaisseau.x, y: zb.vaisseau.y, cap: zb.vaisseau.cap }
    const r = avancerLeMonde(avecBouche, zb, 1 / 60, { x: 0, y: 0 })
    for (const e of r.evenements) if (e.type === 'obus') depart = { x: e.x - zb.vaisseau.x, y: e.y - zb.vaisseau.y }
    void avant
  }
  const cap = zb.vaisseau.cap
  verifier('avec une bouche, l’obus part d’elle — à sa place sous l’aile, tournée du cap —, plus du bord du vaisseau', canon.armes[0].place === 0 && depart !== null && Math.abs(depart.x - (Math.cos(cap) * 2 - Math.sin(cap) * 6)) < 0.01 && Math.abs(depart.y - (Math.sin(cap) * 2 + Math.cos(cap) * 6)) < 0.01)
}

// le tir à la main : le regard franc fait tirer les armes non guidées dans sa direction, sans rival
{
  const deux = armer('arme-canon')
  const seul = nouveauMonde(deux)
  seul.detruits = new Set(asteroidesAutour(deux, 0, 0, 400).map((r) => r.id))
  let tirs = 0
  for (let i = 0; i < 60 * 3; i++) tirs += compter(avancerLeMonde(deux, seul, 1 / 60, { x: 0, y: 0 }, { x: 0, y: -1 }, true).evenements, 'obus')
  const vers = seul.obus.every((o) => o.vy < 0 && Math.abs(Math.atan2(o.vy, o.vx) + Math.PI / 2) <= deux.armes[0].dispersion + 1e-9)
  const auto = nouveauMonde(deux)
  let tirsAuto = 0
  for (let i = 0; i < 60 * 3; i++) tirsAuto += compter(avancerLeMonde(deux, auto, 1 / 60, { x: 0, y: 0 }, { x: 0, y: -1 }).evenements, 'obus')
  const missiles = armer('arme-missiles')
  const mm = nouveauMonde(missiles)
  let tirsGuides = 0
  for (let i = 0; i < 60 * 3; i++) tirsGuides += compter(avancerLeMonde(missiles, mm, 1 / 60, { x: 0, y: 0 }, { x: 0, y: -1 }, true).evenements, 'obus')
  verifier('le tir à la main : sans rival, le canon tire à sa cadence dans la direction du regard ; sans « manuel » il se tait ; les missiles partent à la main aussi', tirs >= 2 && seul.obus.length > 0 && vers && tirsAuto === 0 && tirsGuides >= 1)
}

// les pépites d'une roche : la part que la foreuse a creusée
{
  const cfg = armer('arme-canon')
  const w2 = nouveauMonde(cfg)
  const roche = asteroidesAutour(cfg, 0, 0, 900).sort((a, b) => b.rayon - a.rayon)[0]
  // (posé hors de portée du laser, le nez vers elle : on tire à la main dessus)
  w2.vaisseau = { ...w2.vaisseau, x: roche.x - roche.rayon - 100, y: roche.y, vx: 0, vy: 0, cap: 0 }
  w2.detruits = new Set(asteroidesAutour(cfg, w2.vaisseau.x, w2.vaisseau.y, 400).filter((r) => r.id !== roche.id).map((r) => r.id))
  let i = 0
  while (!w2.detruits.has(roche.id) && i++ < 60 * 60) avancerLeMonde(cfg, w2, 1 / 60, { x: 0, y: 0 }, { x: 1, y: 0 }, true)
  verifier('les obus entament la roche et la brisent ; brisée sans foreuse, elle ne rend aucune pépite', w2.detruits.has(roche.id) && w2.pepites.length === 0 && w2.minerai === 0)
  // la même, à moitié forée puis achevée au canon : la moitié des pépites d'une roche toute forée
  const entiere = nouveauMonde(C)
  entiere.vaisseau = { ...entiere.vaisseau, x: roche.x - roche.rayon - 20, y: roche.y, vx: 0, vy: 0 }
  entiere.detruits = new Set(asteroidesAutour(C, entiere.vaisseau.x, entiere.vaisseau.y, 400).filter((r) => r.id !== roche.id).map((r) => r.id))
  let nEntiere = 0
  for (let k = 0; k < 60 * 60 && !entiere.detruits.has(roche.id); k++) nEntiere += compter(avancerLeMonde(C, entiere, 1 / 60, { x: 0, y: 0 }).evenements, 'eclat') * 0
  nEntiere = entiere.pepites.length + entiere.minerai
  const moitie = nouveauMonde(cfg)
  moitie.vaisseau = { ...moitie.vaisseau, x: roche.x - roche.rayon - 100, y: roche.y, vx: 0, vy: 0, cap: 0 }
  moitie.detruits = new Set(entiere.detruits)
  moitie.detruits.delete(roche.id)
  moitie.creuse.set(roche.id, solidite(cfg, roche) / 2)
  moitie.fore.set(roche.id, solidite(cfg, roche) / 2)
  let j = 0
  while (!moitie.detruits.has(roche.id) && j++ < 60 * 60) avancerLeMonde(cfg, moitie, 1 / 60, { x: 0, y: 0 }, { x: 1, y: 0 }, true)
  const nMoitie = moitie.pepites.length + moitie.minerai
  verifier('une roche à moitié forée puis brisée au canon rend la moitié de ses pépites', nEntiere >= 2 && moitie.detruits.has(roche.id) && nMoitie === Math.round(nEntiere / 2))
}

// le poids dans un choc : un vaisseau lourd traverse une petite roche, un léger rebondit
{
  const petite = asteroidesAutour(C, 0, 0, 900).sort((a, b) => a.rayon - b.rayon)[0]
  const lancer = (cfg: ConfigVaisseau) => {
    const w3 = nouveauMonde(cfg)
    w3.vaisseau = { ...w3.vaisseau, x: petite.x - petite.rayon - cfg.rayon - 6, y: petite.y, vx: 100, vy: 0, cap: 0 }
    w3.detruits = new Set(asteroidesAutour(cfg, w3.vaisseau.x, w3.vaisseau.y, 400).filter((r) => r.id !== petite.id).map((r) => r.id))
    w3.coque = 1000
    let perce = 0
    for (let k = 0; k < 30; k++) perce += avancerLeMonde(cfg, w3, 1 / 60, { x: 0, y: 0 }).chocs.filter((ch) => ch.perce !== undefined).length
    return { w3, perce }
  }
  const lourd = lancer({ ...C, masse: 400, forage: { ...C.forage, portee: 0 } })
  const leger = lancer({ ...C, forage: { ...C.forage, portee: 0 } })
  verifier('un vaisseau lourd traverse une petite roche : elle éclate sans rien rendre, il garde son cap, à peine ralenti et à peine abîmé', lourd.perce === 1 && lourd.w3.detruits.has(petite.id) && lourd.w3.pepites.length === 0 && lourd.w3.vaisseau.vx > 60 && lourd.w3.vaisseau.x > petite.x && lourd.w3.coque > 999.8)
  verifier('le vaisseau de série, lui, rebondit dessus comme avant', leger.perce === 0 && leger.w3.vaisseau.vx < 0 && C.masse === 30)
}
// LE VERROU (Keko, 15/11) : l'ennemi verrouillé passe devant le plus proche, s'il est à portée ; une seconde tape le rend
{
  const canon = { id: 'canon', cadence: 0.5, degats: 1, portee: 120, vitesse: 170, vie: 1, dispersion: 0, guide: false }
  const cfg = { ...VAISSEAU, champ: { ...VAISSEAU.champ, densite: 0 }, station: { ...VAISSEAU.station, portee: -1 }, armes: [canon], ennemi: { ...VAISSEAU.ennemi, apparait: 1e9, pv: 1000 } }
  const insecte = (id: number, x: number, y: number) => ({ id, corps: { ...nouveauVaisseau(), x, y }, pv: 1000, fait: 'marche' as const, roche: null, forage: null, tirA: 1e9, butin: 0, cargaison: { fer: 0, or: 0, cristal: 0 }, calmeA: 1e9 })
  // (le premier obus tiré : vers quel x part-il ?)
  const premierTir = (verrou: number | null, loinX: number): number => {
    const w = nouveauMonde(cfg, 3)
    w.ennemis.push(insecte(1, -30, -40), insecte(2, loinX, -60))
    if (verrou !== null) verrouiller(w, verrou)
    for (let i = 0; i < 60; i++) {
      w.ennemis[0].corps = { ...w.ennemis[0].corps, x: -30, y: -40, vx: 0, vy: 0 }
      w.ennemis[1].corps = { ...w.ennemis[1].corps, x: loinX, y: -60, vx: 0, vy: 0 }
      avancerLeMonde(cfg, w, 1 / 60, { x: 0, y: 0 })
      if (w.obus.length > 0) return Math.sign(w.obus[0].vx)
    }
    return 0
  }
  verifier('sans verrou, le canon tire sur le plus proche ; verrouillé, sur l’autre, à portée', premierTir(null, 40) === -1 && premierTir(2, 40) === 1)
  verifier('verrouillé mais hors de portée : le plus proche reprend', premierTir(2, 400) === -1)
  const w = nouveauMonde(cfg, 3)
  w.ennemis.push(insecte(1, -30, -40), insecte(2, 40, -60))
  verrouiller(w, 2)
  const verrouille = w.verrou === 2 && ennemiLePlusProche(w, 200)?.x === 40
  verrouiller(w, 2)
  verifier('une seconde tape déverrouille : le nez revient au plus proche ; un id inconnu ne verrouille rien', verrouille && w.verrou === null && ennemiLePlusProche(w, 200)?.x === -30 && (verrouiller(w, 99), w.verrou === null))
  verrouiller(w, 2)
  w.ennemis = w.ennemis.filter((e) => e.id !== 2)
  avancerLeMonde(cfg, w, 1 / 60, { x: 0, y: 0 })
  verifier('le verrou tombe avec l’ennemi', w.verrou === null)
}
// LE LANCE-FLAMMES (Keko, 15/11) : un cône continu devant le nez, à courte portée ; ce qu'il touche brûle encore après
{
  const flammes = { id: 'flammes', cadence: 0.1, degats: 10, portee: 45, vitesse: 0, vie: 0, dispersion: 0, guide: false, flamme: { cone: 0.42, brulure: 2, dpsBrulure: 3 } }
  const cfg = { ...VAISSEAU, champ: { ...VAISSEAU.champ, densite: 0 }, station: { ...VAISSEAU.station, portee: -1 }, armes: [flammes], ennemi: { ...VAISSEAU.ennemi, apparait: 1e9, pv: 1000 } }
  const insecte = (id: number, x: number, y: number) => ({ id, corps: { ...nouveauVaisseau(), x, y }, pv: 1000, fait: 'marche' as const, roche: null, forage: null, tirA: 1e9, butin: 0, cargaison: { fer: 0, or: 0, cristal: 0 }, calmeA: 1e9 })
  // (le nez vers le haut : −y ; une seconde de flamme, l'insecte tenu en place)
  const perdu = (x: number, y: number, secondes = 1): { pv: number; crache: boolean } => {
    const w = nouveauMonde(cfg, 3)
    w.ennemis.push(insecte(1, x, y))
    let crache = false
    for (let i = 0; i < 60 * secondes; i++) {
      w.ennemis[0].corps = { ...w.ennemis[0].corps, x, y, vx: 0, vy: 0 }
      avancerLeMonde(cfg, w, 1 / 60, { x: 0, y: 0 })
      crache ||= w.crache
    }
    return { pv: 1000 - w.ennemis[0].pv, crache }
  }
  const devant = perdu(0, -30)
  verifier('devant, à portée : une seconde de flamme coûte ses dégâts par seconde, et il crache', Math.abs(devant.pv - 10) < 0.6 && devant.crache)
  verifier('de côté, ou trop loin devant : rien, et il ne crache pas', perdu(30, 0).pv === 0 && !perdu(30, 0).crache && perdu(0, -80).pv === 0)
  // (sorti de la flamme, il brûle encore deux secondes, puis plus)
  const w = nouveauMonde(cfg, 3)
  w.ennemis.push(insecte(1, 0, -30))
  for (let i = 0; i < 30; i++) {
    w.ennemis[0].corps = { ...w.ennemis[0].corps, x: 0, y: -30, vx: 0, vy: 0 }
    avancerLeMonde(cfg, w, 1 / 60, { x: 0, y: 0 })
  }
  const apresFlamme = w.ennemis[0].pv
  for (let i = 0; i < 60 * 3; i++) {
    w.ennemis[0].corps = { ...w.ennemis[0].corps, x: 0, y: 200, vx: 0, vy: 0 }
    avancerLeMonde(cfg, w, 1 / 60, { x: 0, y: 0 })
  }
  verifier('sorti de la flamme, il brûle encore deux secondes (trois points par seconde), puis plus', Math.abs(apresFlamme - w.ennemis[0].pv - 6) < 0.3)
  // (le cône prend tout ce qui s'y trouve, pas un seul)
  const w2 = nouveauMonde({ ...cfg, ennemi: { ...cfg.ennemi, pv: 12 } }, 3)
  w2.ennemis.push({ ...insecte(1, -5, -25), pv: 12 }, { ...insecte(2, 5, -30), pv: 12 }, { ...insecte(3, 0, -38), pv: 12 })
  for (let i = 0; i < 90; i++) {
    for (const e of w2.ennemis) e.corps = { ...e.corps, vx: 0, vy: 0 }
    avancerLeMonde({ ...cfg, ennemi: { ...cfg.ennemi, pv: 12 } }, w2, 1 / 60, { x: 0, y: 0 })
  }
  verifier('un groupe serré dans le cône fond d’un coup : trois insectes de 12 points abattus en moins d’une seconde et demie', w2.ennemis.length === 0)
  // (mort par le feu, il le dit : la page le fait se consumer au lieu d'éclater ; abattu par un obus, non)
  const w3 = nouveauMonde({ ...cfg, ennemi: { ...cfg.ennemi, pv: 12 } }, 3)
  w3.ennemis.push({ ...insecte(1, 0, -30), pv: 12 })
  let brule: boolean | undefined
  for (let i = 0; i < 120 && brule === undefined; i++) {
    for (const e of w3.ennemis) e.corps = { ...e.corps, vx: 0, vy: 0 }
    for (const e of avancerLeMonde({ ...cfg, ennemi: { ...cfg.ennemi, pv: 12 } }, w3, 1 / 60, { x: 0, y: 0 }).evenements) if (e.type === 'ennemiDetruit') brule = e.brule
  }
  const canon = { id: 'canon', cadence: 0.2, degats: 20, portee: 120, vitesse: 400, vie: 1, dispersion: 0, guide: false }
  const cfg4 = { ...cfg, armes: [canon], ennemi: { ...cfg.ennemi, pv: 12 } }
  const w4 = nouveauMonde(cfg4, 3)
  w4.ennemis.push({ ...insecte(1, 0, -30), pv: 12 })
  let brule4: boolean | undefined
  for (let i = 0; i < 120 && brule4 === undefined; i++) {
    for (const e of w4.ennemis) e.corps = { ...e.corps, vx: 0, vy: 0 }
    for (const e of avancerLeMonde(cfg4, w4, 1 / 60, { x: 0, y: 0 }).evenements) if (e.type === 'ennemiDetruit') brule4 = e.brule
  }
  verifier('mort par le feu, l’insecte le dit (il se consumera) ; abattu par un obus, non', brule === true && brule4 === false)
  // (abattu en crachant : le lance-flammes se tait au pas suivant, le temps du retour)
  const w5 = nouveauMonde(cfg, 3)
  w5.ennemis.push(insecte(1, 0, -30))
  avancerLeMonde(cfg, w5, 1 / 60, { x: 0, y: 0 })
  const crachait = w5.crache
  w5.phase = 'perdu'
  avancerLeMonde(cfg, w5, 1 / 60, { x: 0, y: 0 })
  verifier('abattu, le lance-flammes ne crache plus', crachait && !w5.crache)
}
// LES DRONES DE LA SENTINELLE (Keko, 15/11) : au repos, à leur place sur l'orbite ; un ennemi à la laisse, ils partent
// l'attaquer — ils volent jusqu'à lui, lui tournent autour et tirent de là ; mort, ils reviennent sur le vaisseau
{
  const drone = { id: 'drone', cadence: 0.5, degats: 2, portee: 40, vitesse: 200, vie: 0.5, dispersion: 0, guide: false }
  const armes = [0, 1, 2].map((k) => ({ ...drone, place: k, orbite: { rayon: 20, vitesse: 1.7, phase: (k * 2 * Math.PI) / 3, laisse: 120 } }))
  const cfg = { ...VAISSEAU, champ: { ...VAISSEAU.champ, densite: 0 }, station: { ...VAISSEAU.station, portee: -1 }, armes, ennemi: { ...VAISSEAU.ennemi, apparait: 1e9, pv: 1000 } }
  const insecte = (id: number, x: number, y: number, pv = 1000) => ({ id, corps: { ...nouveauVaisseau(), x, y }, pv, fait: 'marche' as const, roche: null, forage: null, tirA: 1e9, butin: 0, cargaison: { fer: 0, or: 0, cristal: 0 }, calmeA: 1e9 })
  const pas = (w: ReturnType<typeof nouveauMonde>, n: number, tenir?: { x: number; y: number }): number => {
    let tirs = 0
    for (let i = 0; i < n; i++) {
      if (tenir !== undefined) for (const e of w.ennemis) e.corps = { ...e.corps, x: tenir.x, y: tenir.y, vx: 0, vy: 0 }
      tirs += compter(avancerLeMonde(cfg, w, 1 / 60, { x: 0, y: 0 }).evenements, 'obus')
    }
    return tirs
  }
  const aLeurPlace = (w: ReturnType<typeof nouveauMonde>): boolean => w.drones.length === 3 && w.drones.every((d) => Math.abs(Math.hypot(d.x - w.vaisseau.x, d.y - w.vaisseau.y) - 20) < 3)
  const w = nouveauMonde(cfg, 3)
  pas(w, 120)
  verifier('sans ennemi, les trois drones tiennent leur place sur l’orbite, autour du vaisseau', aLeurPlace(w))
  // (un insecte derrière le vaisseau, à 70 : ils partent, lui tournent autour et tirent de près)
  w.ennemis.push(insecte(1, 0, 70))
  const tirs = pas(w, 120, { x: 0, y: 70 })
  verifier('un ennemi à la laisse : ils volent jusqu’à lui, lui tournent autour et tirent', tirs >= 4 && w.drones.every((d) => Math.hypot(d.x, d.y - 70) < 20) && w.ennemis[0].pv < 1000)
  // (il meurt : ils reviennent à leur place)
  w.ennemis[0].pv = 0.5
  pas(w, 30, { x: 0, y: 70 })
  const mort = w.ennemis.length === 0
  pas(w, 150)
  verifier('l’ennemi mort, ils reviennent sur le vaisseau, à leur place', mort && aLeurPlace(w))
  // (trop loin du vaisseau : ils ne partent pas)
  const w2 = nouveauMonde(cfg, 3)
  w2.ennemis.push(insecte(1, 0, 300))
  const tirs2 = pas(w2, 120, { x: 0, y: 300 })
  verifier('un ennemi au-delà de la laisse : ils restent à leur place, sans tirer', tirs2 === 0 && aLeurPlace(w2))
  // (deux ennemis : ils se partagent les cibles)
  const w3 = nouveauMonde(cfg, 3)
  w3.ennemis.push(insecte(1, -50, 0), insecte(2, 50, 0))
  for (let i = 0; i < 30; i++) {
    w3.ennemis[0].corps = { ...w3.ennemis[0].corps, x: -50, y: 0, vx: 0, vy: 0 }
    w3.ennemis[1].corps = { ...w3.ennemis[1].corps, x: 50, y: 0, vx: 0, vy: 0 }
    avancerLeMonde(cfg, w3, 1 / 60, { x: 0, y: 0 })
  }
  verifier('deux ennemis : les drones se les partagent', new Set(w3.drones.map((d) => d.cible)).size === 2)
}
// L'OMNIDIRECTIONNEL (la Sentinelle, Keko, 15/11) : il file où va le manche sans jamais tourner
{
  const cfg = { ...VAISSEAU, omni: true }
  let w = nouveauVaisseau()
  for (let i = 0; i < 120; i++) w = voler(cfg, cfg, w, 1 / 60, { x: 1, y: 0 }).vaisseau
  let w2 = nouveauVaisseau()
  for (let i = 0; i < 120; i++) w2 = voler(VAISSEAU, VAISSEAU, w2, 1 / 60, { x: 1, y: 0 }).vaisseau
  verifier('omnidirectionnel : il va à droite sans tourner son nez (qui reste en haut) ; un vaisseau ordinaire, lui, tourne', w.vx > 20 && w.cap === nouveauVaisseau().cap && Math.abs(w2.cap) < 0.2)
}
// LES TOURELLES DE L'INGÉNIEUR (Keko, 15/11) : posées sur son passage, espacées, cinq au plus, elles tirent seules et
// s'éteignent au bout de leur durée
{
  const tourelle = { id: 'tourelle', cadence: 0.8, degats: 3, portee: 75, vitesse: 220, vie: 0.5, dispersion: 0, guide: false, pose: { tous: 2.5, ecart: 28, max: 5, duree: 18, pivot: 8, jet: 34, vol: 0.4 } }
  const cfg = { ...VAISSEAU, champ: { ...VAISSEAU.champ, densite: 0 }, station: { ...VAISSEAU.station, portee: -1 }, armes: [tourelle], ennemi: { ...VAISSEAU.ennemi, apparait: 1e9, pv: 1000 } }
  const insecte = (id: number, x: number, y: number) => ({ id, corps: { ...nouveauVaisseau(), x, y }, pv: 1000, fait: 'marche' as const, roche: null, forage: null, tirA: 1e9, butin: 0, cargaison: { fer: 0, or: 0, cristal: 0 }, calmeA: 1e9 })
  // (immobile : il en LANCE autour de lui, à courte portée, chacune sur une place libre)
  const w = nouveauMonde(cfg, 3)
  for (let i = 0; i < 60 * 8; i++) avancerLeMonde(cfg, w, 1 / 60, { x: 0, y: 0 })
  const espaceesW = w.tourelles.every((a, i) => w.tourelles.every((b, j) => i === j || Math.hypot(a.x - b.x, a.y - b.y) >= 28))
  verifier('immobile, il lance ses tourelles autour de lui, à courte portée, chacune sur une place libre', w.tourelles.length >= 3 && espaceesW && w.tourelles.every((tu) => Math.abs(Math.hypot(tu.x, tu.y) - 34) < 0.5))
  // (lancée, elle vole avant de se déployer : elle ne tire qu'une fois posée)
  const wv = nouveauMonde(cfg, 3)
  const evv = avancerLeMonde(cfg, wv, 1 / 60, { x: 0, y: 0 }).evenements
  verifier('lancée, elle vole d’abord, puis se déploie', evv.some((e) => e.type === 'tourelleLancee') && !wv.tourelles[0].deployee && (() => { for (let i = 0; i < 30; i++) avancerLeMonde(cfg, wv, 1 / 60, { x: 0, y: 0 }); return wv.tourelles[0].deployee })())
  // (en volant : plusieurs, espacées, jamais plus de cinq)
  const w2 = nouveauMonde(cfg, 3)
  let auPlus = 0
  for (let i = 0; i < 60 * 16; i++) {
    avancerLeMonde(cfg, w2, 1 / 60, { x: 1, y: 0 })
    auPlus = Math.max(auPlus, w2.tourelles.length)
  }
  const espacees = w2.tourelles.every((a, i) => w2.tourelles.every((b, j) => i === j || Math.hypot(a.x - b.x, a.y - b.y) >= 28))
  verifier('en volant, il en pose sur son passage, espacées, cinq au plus (la plus vieille saute)', auPlus === 5 && w2.tourelles.length === 5 && espacees)
  // (une tourelle tire sur un insecte à sa portée, pas au-delà)
  const w3 = nouveauMonde(cfg, 3)
  w3.ennemis.push(insecte(1, 50, 0))
  let tirs = 0
  for (let i = 0; i < 60 * 3; i++) {
    w3.ennemis[0].corps = { ...w3.ennemis[0].corps, x: 50, y: 0, vx: 0, vy: 0 }
    for (const e of avancerLeMonde(cfg, w3, 1 / 60, { x: 0, y: 0 }).evenements) if (e.type === 'obus') tirs++
  }
  verifier('une tourelle pivote vers l’insecte à sa portée et le touche', tirs >= 2 && w3.ennemis[0].pv < 1000)
  const w4 = nouveauMonde(cfg, 3)
  w4.ennemis.push(insecte(1, 200, 0))
  let tirs4 = 0
  for (let i = 0; i < 60 * 3; i++) {
    w4.ennemis[0].corps = { ...w4.ennemis[0].corps, x: 200, y: 0, vx: 0, vy: 0 }
    for (const e of avancerLeMonde(cfg, w4, 1 / 60, { x: 0, y: 0 }).evenements) if (e.type === 'obus') tirs4++
  }
  verifier('au-delà de sa portée, elle ne tire pas', tirs4 === 0)
  // (au bout de sa durée, elle s'éteint)
  const w5 = nouveauMonde(cfg, 3)
  avancerLeMonde(cfg, w5, 1 / 60, { x: 0, y: 0 })
  const posee = w5.tourelles.length === 1
  w5.armesA[0] = 1e9
  let finie = false
  for (let i = 0; i < 60 * 19; i++) for (const e of avancerLeMonde(cfg, w5, 1 / 60, { x: 0, y: 0 }).evenements) if (e.type === 'tourelleFinie') finie = true
  verifier('au bout de sa durée, la tourelle s’éteint', posee && finie && w5.tourelles.length === 0)
}
// LES MINI-MISSILES (Keko, 15/11) : à l'impact, ils explosent et touchent aussi les ennemis aux alentours
{
  const mini = { id: 'minimissile', cadence: 1.6, degats: 5, portee: 120, vitesse: 110, vie: 1.8, dispersion: 0, guide: true, zone: { rayon: 18 } }
  const cfg = { ...VAISSEAU, champ: { ...VAISSEAU.champ, densite: 0 }, station: { ...VAISSEAU.station, portee: -1 }, armes: [mini], ennemi: { ...VAISSEAU.ennemi, apparait: 1e9, pv: 1000 } }
  const insecte = (id: number, x: number, y: number) => ({ id, corps: { ...nouveauVaisseau(), x, y }, pv: 1000, fait: 'marche' as const, roche: null, forage: null, tirA: 1e9, butin: 0, cargaison: { fer: 0, or: 0, cristal: 0 }, calmeA: 1e9 })
  const w = nouveauMonde(cfg, 3)
  // (la cible devant, une voisine à côté d'elle, une troisième loin d'elles)
  const places: [number, number][] = [[0, -60], [10, -66], [70, -60]]
  places.forEach(([x, y], k) => w.ennemis.push(insecte(k + 1, x, y)))
  let explose = false
  for (let i = 0; i < 60 * 2 && !explose; i++) {
    w.ennemis.forEach((e, k) => (e.corps = { ...e.corps, x: places[k][0], y: places[k][1], vx: 0, vy: 0 }))
    for (const e of avancerLeMonde(cfg, w, 1 / 60, { x: 0, y: 0 }).evenements) if (e.type === 'explosionDeZone') explose = true
  }
  const pv = w.ennemis.map((e) => 1000 - e.pv)
  verifier('un mini-missile explose à l’impact : la cible et sa voisine perdent 5, la lointaine rien', explose && pv[0] === 5 && pv[1] === 5 && pv[2] === 0)
}
// LE CHALUMEAU ET LE NAPALM DE LA SALAMANDRE (Keko, 15/11)
{
  const insecte = (id: number, x: number, y: number) => ({ id, corps: { ...nouveauVaisseau(), x, y }, pv: 1000, fait: 'marche' as const, roche: null, forage: null, tirA: 1e9, butin: 0, cargaison: { fer: 0, or: 0, cristal: 0 }, calmeA: 1e9 })
  const chalumeau = { id: 'chalumeau', cadence: 0.1, degats: 22, portee: 80, vitesse: 0, vie: 0, dispersion: 0, guide: false, flamme: { cone: 0.12, brulure: 1, dpsBrulure: 2, seul: true } }
  const cfg = { ...VAISSEAU, champ: { ...VAISSEAU.champ, densite: 0 }, station: { ...VAISSEAU.station, portee: -1 }, armes: [chalumeau], ennemi: { ...VAISSEAU.ennemi, apparait: 1e9, pv: 1000 } }
  const w = nouveauMonde(cfg, 3)
  const places: [number, number][] = [[0, -30], [0, -55]]
  places.forEach(([x, y], k) => w.ennemis.push(insecte(k + 1, x, y)))
  for (let i = 0; i < 60; i++) {
    w.ennemis.forEach((e, k) => (e.corps = { ...e.corps, x: places[k][0], y: places[k][1], vx: 0, vy: 0 }))
    avancerLeMonde(cfg, w, 1 / 60, { x: 0, y: 0 })
  }
  verifier('le chalumeau ne brûle que la plus proche dans son faisceau, fort', Math.abs(1000 - w.ennemis[0].pv - 22) < 1 && w.ennemis[1].pv === 1000)
  const napalm = { id: 'napalm', cadence: 1.5, degats: 0, portee: 75, vitesse: 120, vie: 1.2, dispersion: 0, guide: false, napalm: { rayon: 14, duree: 4, dps: 6, brulure: 1.5, dpsBrulure: 3 } }
  const cfg2 = { ...cfg, armes: [napalm] }
  const w2 = nouveauMonde(cfg2, 3)
  // (la cible derrière une autre, sur le chemin : la boule passe au-dessus)
  const pl2: [number, number][] = [[0, -60], [0, -30]]
  w2.ennemis.push(insecte(1, 0, -60))
  let flaque = false
  for (let i = 0; i < 60 * 3; i++) {
    w2.ennemis[0].corps = { ...w2.ennemis[0].corps, x: 0, y: -60, vx: 0, vy: 0 }
    for (const e of avancerLeMonde(cfg2, w2, 1 / 60, { x: 0, y: 0 }).evenements) if (e.type === 'flaque') flaque = true
  }
  verifier('le napalm retombe sur la cible en flaque de feu, qui la brûle', flaque && w2.flaques.some((f) => Math.hypot(f.x, f.y + 60) < 4) && 1000 - w2.ennemis[0].pv > 6)
  const w3 = nouveauMonde(cfg2, 3)
  pl2.forEach(([x, y], k) => w3.ennemis.push(insecte(k + 1, x, y)))
  w3.ennemis[1].pv = 1000
  // (on vise la plus lointaine : verrouillée)
  verrouiller(w3, 1)
  let touchee = false
  for (let i = 0; i < 50; i++) {
    w3.ennemis.forEach((e, k) => (e.corps = { ...e.corps, x: pl2[k][0], y: pl2[k][1], vx: 0, vy: 0 }))
    for (const e of avancerLeMonde(cfg2, w3, 1 / 60, { x: 0, y: 0 }).evenements) if (e.type === 'ennemiTouche' && e.id === 2) touchee = true
  }
  verifier('une boule de napalm passe au-dessus d’un insecte sur son chemin sans le toucher', !touchee && w3.ennemis[1].pv === 1000)
  // (la flaque s'éteint)
  for (let i = 0; i < 60 * 6; i++) avancerLeMonde(cfg2, w2, 1 / 60, { x: 0, y: 0 })
  w2.armesA[0] = 1e9
  for (let i = 0; i < 60 * 5; i++) avancerLeMonde(cfg2, w2, 1 / 60, { x: 0, y: 0 })
  verifier('la flaque s’éteint au bout de sa durée', w2.flaques.length === 0)
}
// LE RAYON THERMIQUE DE LA SALAMANDRE (Keko, 15/11) : il fait le tour du vaisseau, et ce qu'il balaie prend un gros coup
// et brûle — une fois par tour ; hors de portée, il ne part pas
{
  const insecte = (id: number, x: number, y: number) => ({ id, corps: { ...nouveauVaisseau(), x, y }, pv: 1000, fait: 'marche' as const, roche: null, forage: null, tirA: 1e9, butin: 0, cargaison: { fer: 0, or: 0, cristal: 0 }, calmeA: 1e9 })
  const rayon = { id: 'rayon', cadence: 3, degats: 0, portee: 70, vitesse: 0, vie: 0, dispersion: 0, guide: false, balayage: { tous: 3, duree: 0.9, longueur: 70, degats: 10, brulure: 2, dpsBrulure: 4, depart: -Math.PI / 2 } }
  const cfg = { ...VAISSEAU, champ: { ...VAISSEAU.champ, densite: 0 }, station: { ...VAISSEAU.station, portee: -1 }, armes: [rayon], ennemi: { ...VAISSEAU.ennemi, apparait: 1e9, pv: 1000 } }
  // (quatre insectes tout autour, à portée ; un cinquième trop loin)
  const places: [number, number][] = [[0, -40], [40, 0], [0, 40], [-40, 0], [0, -150]]
  const w = nouveauMonde(cfg, 3)
  places.forEach(([x, y], k) => w.ennemis.push(insecte(k + 1, x, y)))
  let tours = 0
  for (let i = 0; i < 60; i++) {
    w.ennemis.forEach((e, k) => (e.corps = { ...e.corps, x: places[k][0], y: places[k][1], vx: 0, vy: 0 }))
    for (const e of avancerLeMonde(cfg, w, 1 / 60, { x: 0, y: 0 }).evenements) if (e.type === 'balayage') tours++
  }
  const coups = w.ennemis.map((e) => 1000 - e.pv)
  verifier('le rayon fait un tour : les quatre insectes autour prennent chacun un coup et brûlent, une seule fois ; le lointain, rien', tours === 1 && coups.slice(0, 4).every((d) => d >= 10 && d < 10 + 4 * 1.2) && coups[4] === 0 && w.ennemis[0].bruleA !== undefined)
  const w2 = nouveauMonde(cfg, 3)
  w2.ennemis.push(insecte(1, 0, -150))
  let tours2 = 0
  for (let i = 0; i < 60 * 4; i++) {
    w2.ennemis[0].corps = { ...w2.ennemis[0].corps, x: 0, y: -150, vx: 0, vy: 0 }
    for (const e of avancerLeMonde(cfg, w2, 1 / 60, { x: 0, y: 0 }).evenements) if (e.type === 'balayage') tours2++
  }
  verifier('personne à portée : le rayon ne part pas', tours2 === 0)
}
// LE RAYON CANALISÉ (Keko, 15/11) : il reste sur une cible et chauffe ; le verrouillé d'abord ; hors de portée, rien
{
  const insecte = (id: number, x: number, y: number) => ({ id, corps: { ...nouveauVaisseau(), x, y }, pv: 1000, fait: 'marche' as const, roche: null, forage: null, tirA: 1e9, butin: 0, cargaison: { fer: 0, or: 0, cristal: 0 }, calmeA: 1e9 })
  const rayon = { id: 'rayon', cadence: 0.1, degats: 0, portee: 80, vitesse: 0, vie: 0, dispersion: 0, guide: false, canalise: { dps: 10, brulure: 1.5, dpsBrulure: 3 } }
  const cfg = { ...VAISSEAU, champ: { ...VAISSEAU.champ, densite: 0 }, station: { ...VAISSEAU.station, portee: -1 }, armes: [rayon], ennemi: { ...VAISSEAU.ennemi, apparait: 1e9, pv: 1000 } }
  const places: [number, number][] = [[0, -40], [50, 30], [0, -200]]
  const w = nouveauMonde(cfg, 3)
  places.forEach(([x, y], k) => w.ennemis.push(insecte(k + 1, x, y)))
  const pas = (n: number): void => {
    for (let i = 0; i < n; i++) {
      w.ennemis.forEach((e, k) => (e.corps = { ...e.corps, x: places[k][0], y: places[k][1], vx: 0, vy: 0 }))
      avancerLeMonde(cfg, w, 1 / 60, { x: 0, y: 0 })
    }
  }
  pas(60)
  const s1 = 1000 - w.ennemis[0].pv
  pas(60)
  const s2 = 1000 - w.ennemis[0].pv - s1
  // (DES DÉGÂTS FIXES — Keko, 20/11 : plus de montée en puissance)
  verifier(`le rayon reste sur le plus proche, à dégâts fixes : la deuxième seconde coûte autant que la première (${s1.toFixed(1)}, ${s2.toFixed(1)}) ; les autres, rien`, Math.abs(s1 - s2) < 0.5 && s1 > 9.5 && w.ennemis[1].pv === 1000 && w.ennemis[2].pv === 1000 && w.canal?.cible === 1)
  verrouiller(w, 2)
  pas(30)
  verifier('verrouillé à portée, il passe sur lui, à pleins dégâts tout de suite (5 en 0,5 s)', w.canal?.cible === 2 && Math.abs(1000 - w.ennemis[1].pv - 5) < 0.3)
  const w2 = nouveauMonde(cfg, 3)
  w2.ennemis.push(insecte(1, 0, -200))
  for (let i = 0; i < 60; i++) avancerLeMonde(cfg, w2, 1 / 60, { x: 0, y: 0 })
  verifier('personne à portée : pas de rayon', w2.canal === null && w2.ennemis[0].pv === 1000)
}
// L'ÉLECTRICITÉ DE LA SENTINELLE (Keko, 15/11) : les drones frappent d'arcs, la chaîne rebondit, l'aura brûle autour
{
  const insecte = (id: number, x: number, y: number) => ({ id, corps: { ...nouveauVaisseau(), x, y }, pv: 1000, fait: 'marche' as const, roche: null, forage: null, tirA: 1e9, butin: 0, cargaison: { fer: 0, or: 0, cristal: 0 }, calmeA: 1e9 })
  const base = { ...VAISSEAU, champ: { ...VAISSEAU.champ, densite: 0 }, station: { ...VAISSEAU.station, portee: -1 }, ennemi: { ...VAISSEAU.ennemi, apparait: 1e9, pv: 1000 } }
  const tenir = (w: ReturnType<typeof nouveauMonde>, cfg: ConfigVaisseau, places: [number, number][], n: number): Evenement[] => {
    const evs: Evenement[] = []
    for (let i = 0; i < n; i++) {
      w.ennemis.forEach((e, k) => (e.corps = { ...e.corps, x: places[k][0], y: places[k][1], vx: 0, vy: 0 }))
      evs.push(...avancerLeMonde(cfg, w, 1 / 60, { x: 0, y: 0 }).evenements)
    }
    return evs
  }
  // (les drones : des arcs, pas d'obus)
  const drone = { id: 'drone', cadence: 0.5, degats: 2, portee: 40, vitesse: 200, vie: 0.5, dispersion: 0, guide: false, eclair: true }
  const cfgD = { ...base, armes: [0, 1, 2].map((k) => ({ ...drone, place: k, orbite: { rayon: 20, vitesse: 1.7, phase: (k * 2 * Math.PI) / 3, laisse: 120 } })) }
  const wD = nouveauMonde(cfgD, 3)
  wD.ennemis.push(insecte(1, 0, 60))
  const evD = tenir(wD, cfgD, [[0, 60]], 120)
  verifier('les drones électriques frappent d’arcs, sans obus', evD.some((e) => e.type === 'arc') && !evD.some((e) => e.type === 'obus') && wD.obus.length === 0 && wD.ennemis[0].pv < 1000)
  // (la chaîne : quatre insectes en ligne, espacés de 30 ; un cinquième trop loin du dernier)
  const chaine = { id: 'chaine', cadence: 1.5, degats: 10, portee: 90, vitesse: 0, vie: 0, dispersion: 0, guide: false, chaine: { rebonds: 4, saut: 45, attenuation: 0.8 } }
  const cfgC = { ...base, armes: [chaine] }
  const pl: [number, number][] = [[0, -40], [30, -40], [60, -40], [90, -40], [200, -40]]
  const wC = nouveauMonde(cfgC, 3)
  pl.forEach(([x, y], k) => wC.ennemis.push(insecte(k + 1, x, y)))
  const evC = tenir(wC, cfgC, pl, 1)
  const ch = evC.find((e) => e.type === 'chaine')
  const pertes = wC.ennemis.map((e) => 1000 - e.pv)
  verifier('la chaîne part sur le plus proche et rebondit de proche en proche, en s’affaiblissant ; trop loin, elle s’arrête', ch !== undefined && ch.type === 'chaine' && ch.points.length === 5 && Math.abs(pertes[0] - 10) < 1e-9 && Math.abs(pertes[1] - 8) < 1e-9 && Math.abs(pertes[3] - 5.12) < 1e-9 && pertes[4] === 0)
  // (l'aura : ce qui est dans son rayon perd ses points par seconde ; au-delà, rien)
  const aura = { id: 'aura', cadence: 0.1, degats: 0, portee: 32, vitesse: 0, vie: 0, dispersion: 0, guide: false, aura: { rayon: 32, dps: 4 } }
  const cfgA = { ...base, armes: [aura] }
  const wA = nouveauMonde(cfgA, 3)
  wA.ennemis.push(insecte(1, 20, 0), insecte(2, 80, 0))
  tenir(wA, cfgA, [[20, 0], [80, 0]], 60)
  verifier('l’aura brûle ce qui est autour du vaisseau, sans cesse ; au-delà, rien', Math.abs(1000 - wA.ennemis[0].pv - 4) < 0.1 && wA.ennemis[1].pv === 1000)
}
// LA SCIE DE L'INGÉNIEUR (Keko, 15/11) : lancée vers l'ennemi, elle s'arrête à sa portée, revient au vaisseau là où il
// est, coupe à l'aller et au retour
{
  const insecte = (id: number, x: number, y: number) => ({ id, corps: { ...nouveauVaisseau(), x, y }, pv: 1000, fait: 'marche' as const, roche: null, forage: null, tirA: 1e9, butin: 0, cargaison: { fer: 0, or: 0, cristal: 0 }, calmeA: 1e9 })
  const scie = { id: 'scie', cadence: 0.3, degats: 7, portee: 80, vitesse: 0, vie: 0, dispersion: 0, guide: false, scie: { aller: 0.7, retour: 200, virage: 6, rayon: 5 } }
  const cfg = { ...VAISSEAU, champ: { ...VAISSEAU.champ, densite: 0 }, station: { ...VAISSEAU.station, portee: -1 }, armes: [scie], ennemi: { ...VAISSEAU.ennemi, apparait: 1e9, pv: 1000 } }
  const tenir = (w: ReturnType<typeof nouveauMonde>, places: [number, number][], n: number, dir: { x: number; y: number }): Evenement[] => {
    const evs: Evenement[] = []
    for (let i = 0; i < n; i++) {
      w.ennemis.forEach((e, k) => (e.corps = { ...e.corps, x: places[k][0], y: places[k][1], vx: 0, vy: 0 }))
      evs.push(...avancerLeMonde(cfg, w, 1 / 60, dir).evenements)
    }
    return evs
  }
  // (immobile : un insecte à 50 sur son chemin — coupé à l'aller, puis au retour ; la scie va jusqu'à ~80 et revient)
  const w = nouveauMonde(cfg, 3)
  w.ennemis.push(insecte(1, 50, 0))
  let loin = 0
  const evs: Evenement[] = []
  for (let i = 0; i < 90; i++) {
    evs.push(...tenir(w, [[50, 0]], 1, { x: 0, y: 0 }))
    for (const s of w.scies) loin = Math.max(loin, Math.hypot(s.x, s.y))
    if (evs.some((e) => e.type === 'scieRattrapee')) break
  }
  verifier('la scie part vers l’insecte, s’arrête au bout de sa portée et revient au vaisseau', evs.some((e) => e.type === 'scieLancee') && evs.some((e) => e.type === 'scieRattrapee') && Math.abs(loin - 80) < 6 && w.scies.length === 0)
  verifier('elle coupe à l’aller ET au retour, une fois dans chaque sens', Math.abs(1000 - w.ennemis[0].pv - 14) < 1e-9)
  // (personne à portée : il la garde)
  const w2 = nouveauMonde(cfg, 3)
  w2.ennemis.push(insecte(1, 200, 0))
  const ev2 = tenir(w2, [[200, 0]], 60, { x: 0, y: 0 })
  verifier('personne à portée : il garde sa scie', !ev2.some((e) => e.type === 'scieLancee') && w2.scies.length === 0)
  // (il se déplace pendant le vol : elle le rejoint là où il est — ce n'est plus le point du lancer)
  const w3 = nouveauMonde(cfg, 3)
  w3.ennemis.push(insecte(1, 0, -60))
  const ev3: Evenement[] = []
  for (let i = 0; i < 240 && !ev3.some((e) => e.type === 'scieRattrapee'); i++) ev3.push(...tenir(w3, [[0, -60]], 1, { x: 1, y: 0 }))
  const re = ev3.find((e) => e.type === 'scieRattrapee')
  verifier('il se déplace : elle revient vers lui, là où il est, en arc', re !== undefined && re.type === 'scieRattrapee' && Math.hypot(re.x - w3.vaisseau.x, re.y - w3.vaisseau.y) < 12 && w3.vaisseau.x > 30)
}
// LES BALISES DE L'INGÉNIEUR (Keko, 15/11) : posées sur son passage, reliées deux à deux ; un insecte entre deux balises
// reliées prend un rivet de chaque côté
{
  const insecte = (id: number, x: number, y: number) => ({ id, corps: { ...nouveauVaisseau(), x, y }, pv: 1000, fait: 'marche' as const, roche: null, forage: null, tirA: 1e9, butin: 0, cargaison: { fer: 0, or: 0, cristal: 0 }, calmeA: 1e9 })
  const balise = { id: 'balise', cadence: 0.7, degats: 8, portee: 90, vitesse: 0, vie: 0, dispersion: 0, guide: false, balise: { tous: 1.5, ecart: 40, max: 6, duree: 35, garde: 3, periode: 0.5 } }
  const cfg = { ...VAISSEAU, champ: { ...VAISSEAU.champ, densite: 0 }, station: { ...VAISSEAU.station, portee: -1 }, armes: [balise], ennemi: { ...VAISSEAU.ennemi, apparait: 1e9, pv: 1000 } }
  // (immobile : une seule balise)
  const w = nouveauMonde(cfg, 3)
  for (let i = 0; i < 180; i++) avancerLeMonde(cfg, w, 1 / 60, { x: 0, y: 0 })
  verifier('immobile, il ne pose qu’une balise', w.balises.length === 1)
  // (en volant : des balises espacées sur son passage, reliées à la précédente, quatre au plus)
  const w2 = nouveauMonde(cfg, 3)
  let auPlus = 0
  let premieres: typeof w2.balises = []
  for (let i = 0; i < 60 * 12; i++) {
    avancerLeMonde(cfg, w2, 1 / 60, { x: i < 200 ? 1 : 0, y: i < 200 ? 0 : 1 })
    auPlus = Math.max(auPlus, w2.balises.length)
    if (premieres.length === 0 && w2.balises.length === 3) premieres = w2.balises.map((b) => ({ ...b, liens: [...b.liens] }))
  }
  const espacees = w2.balises.every((b, k) => k === 0 || Math.hypot(b.x - w2.balises[k - 1].x, b.y - w2.balises[k - 1].y) >= 40)
  verifier('en volant, il pose des balises espacées sur son passage, six au plus, par trios : chacune reliée à la précédente de son trio, la première d’un trio à rien', auPlus === 6 && w2.balises.length <= 6 && espacees && w2.balises.every((b, k) => (b.rang === 0 ? b.liens.length === 0 : k === 0 /* (la plus vieille a sauté : la liste peut commencer au milieu d'un trio) */ || b.liens.some((li) => li.vers === w2.balises[k - 1].id))))
  verifier('toutes les trois, la troisième est reliée aussi à la première : un triangle', premieres.length === 3 && premieres[2].liens.map((li) => li.vers).sort().join() === [premieres[0].id, premieres[1].id].sort().join() && premieres[1].liens.length === 1)
  // (après un triangle, la balise suivante commence un autre triangle : elle n'est pas reliée au premier)
  const w5 = nouveauMonde(cfg, 3)
  for (let i = 0; i < 60 * 4; i++) avancerLeMonde(cfg, w5, 1 / 60, { x: i < 100 ? 1 : 0, y: i < 100 ? 0 : 1 })
  const trois = w5.balises.length
  w5.vaisseau = { ...w5.vaisseau, x: w5.vaisseau.x + 500, y: w5.vaisseau.y + 300 }
  for (let i = 0; i < 60 * 2 && w5.balises.length === trois; i++) avancerLeMonde(cfg, w5, 1 / 60, { x: 0, y: 0 })
  const quatrieme = w5.balises[3]
  verifier('après un triangle, la balise suivante commence un autre triangle, sans lien avec le premier', trois === 3 && quatrieme !== undefined && quatrieme.rang === 0 && quatrieme.liens.length === 0 && !w5.balises.slice(0, 3).some((b) => b.liens.some((li) => li.vers === quatrieme.id)))
  // (UN TRIANGLE S'ÉTEINT D'UN BLOC, à la fin de vie de sa dernière balise ; le septième pose fait sauter le plus vieux triangle entier)
  const w6 = nouveauMonde(cfg, 3)
  let n6 = 0
  const tenirJusqua = (t: number, dir: { x: number; y: number }): void => {
    while (w6.t < t) {
      avancerLeMonde(cfg, w6, 1 / 60, dir)
      n6 = Math.max(n6, w6.balises.length)
    }
  }
  tenirJusqua(1.6, { x: 1, y: 0 })
  tenirJusqua(3.3, { x: 0, y: 1 })
  tenirJusqua(3.6, { x: 0, y: 0 })
  const trio = w6.balises.map((b) => b.id)
  w6.armesA[0] = 1e9 // (il dérive encore : plus de pose, on regarde ce triangle seul)
  const derniereNee = Math.max(...w6.balises.map((b) => b.nee))
  tenirJusqua(36, { x: 0, y: 0 })
  const encore = w6.balises.length
  tenirJusqua(derniereNee + 35.1, { x: 0, y: 0 })
  verifier('un triangle s’éteint d’un bloc, à la fin de vie de sa dernière balise (la première, plus vieille, l’attend)', trio.length === 3 && encore === 3 && w6.balises.length === 0)
  // (LES CRISTAUX, SANS NOMBRE MAXIMUM — Keko, 20/11 : leur durée seule borne combien il en reste, comptée du triangle fermé)
  {
    const cristal = { ...balise, id: 'cristal', balise: { tous: 1.5, ecart: 40, duree: 35, garde: 3, periode: 0.5, irradie: { dps: 8 } } }
    const cfgC = { ...cfg, armes: [cristal] }
    const wc = nouveauMonde(cfgC, 3)
    let auPlusC = 0
    for (let i = 0; i < 60 * 12; i++) {
      avancerLeMonde(cfgC, wc, 1 / 60, { x: Math.cos(i / 90), y: Math.sin(i / 90) })
      auPlusC = Math.max(auPlusC, wc.balises.length)
    }
    // (puis il ne pose plus : les triangles fermés s'éteignent 35 s après leur troisième cristal ; un trio resté ouvert demeure)
    wc.armesA[0] = 1e9
    const ouverts = wc.balises.filter((b) => !wc.balises.some((o) => o.trio === b.trio && o.rang === 2)).length
    const fermeA = Math.max(...wc.balises.filter((b) => b.rang === 2).map((b) => b.nee))
    while (wc.t < fermeA + 35.1) avancerLeMonde(cfgC, wc, 1 / 60, { x: 0, y: 0 })
    verifier(`les cristaux, sans nombre maximum : ${auPlusC} posés à la fois en 12 s ; 35 s après sa fermeture, chaque triangle s’est éteint, et le trio resté ouvert (${ouverts}) demeure`, auPlusC > 6 && wc.balises.length === ouverts)
  }
  const w7 = nouveauMonde(cfg, 3)
  const poses: number[] = []
  let apres7 = -1
  for (let i = 0; i < 60 * 12 && apres7 < 0; i++) {
    const r = avancerLeMonde(cfg, w7, 1 / 60, { x: Math.cos(i / 90), y: Math.sin(i / 90) })
    if (r.evenements.some((e) => e.type === 'balisePosee')) poses.push(w7.balises.length)
    if (poses.length === 7) apres7 = w7.balises.length
  }
  verifier('la septième balise fait sauter le plus vieux triangle, entier', apres7 === 4 && new Set(w7.balises.map((b) => b.trio)).size === 2)
  // (deux balises à 60 l'une de l'autre, un insecte qui reste sur la ligne : elle s'éclaire une fois, il prend un coup)
  const w3 = nouveauMonde(cfg, 3)
  w3.vaisseau = { ...w3.vaisseau, x: 0, y: 200 }
  w3.balises.push({ id: 900, x: -30, y: 0, nee: 0, arme: 0, rang: 0, trio: 900, liens: [] }, { id: 901, x: 30, y: 0, nee: 0, arme: 0, rang: 1, trio: 900, liens: [{ vers: 900, sur: [], dechargeA: 0 }] })
  w3.armesA[0] = 1e9
  w3.ennemis.push(insecte(1, 0, 1), insecte(2, 0, 40))
  const ev3: Evenement[] = []
  for (let i = 0; i < 12; i++) {
    w3.ennemis.forEach((e, k) => (e.corps = { ...e.corps, x: 0, y: [1, 40][k], vx: 0, vy: 0 }))
    ev3.push(...avancerLeMonde(cfg, w3, 1 / 60, { x: 0, y: 0 }).evenements)
  }
  verifier('un insecte franchit la ligne entre deux balises : elle s’éclaire, il prend un coup tout de suite ; à l’écart, rien', ev3.filter((e) => e.type === 'ligne').length === 1 && Math.abs(1000 - w3.ennemis[0].pv - 8) < 1e-9 && w3.ennemis[1].pv === 1000 && !ev3.some((e) => e.type === 'obus'))
  // (deux insectes : l'un entre, l'autre entre deux pas après, le premier encore dessus — sans recharge : deux éclairs,
  // le premier prend deux coups, le second un ; puis l'un sort et rentre : un coup de plus à chacun)
  const w8 = nouveauMonde(cfg, 3)
  w8.vaisseau = { ...w8.vaisseau, x: 0, y: 200 }
  w8.balises.push({ id: 900, x: -30, y: 0, nee: 0, arme: 0, rang: 0, trio: 900, liens: [] }, { id: 901, x: 30, y: 0, nee: 0, arme: 0, rang: 1, trio: 900, liens: [{ vers: 900, sur: [], dechargeA: 0 }] })
  w8.armesA[0] = 1e9
  w8.ennemis.push(insecte(1, -10, 0), insecte(2, 10, 30))
  const ev8: Evenement[] = []
  const pas8 = (y2: number): void => {
    w8.ennemis[0].corps = { ...w8.ennemis[0].corps, x: -10, y: 0, vx: 0, vy: 0 }
    w8.ennemis[1].corps = { ...w8.ennemis[1].corps, x: 10, y: y2, vx: 0, vy: 0 }
    ev8.push(...avancerLeMonde(cfg, w8, 1 / 60, { x: 0, y: 0 }).evenements)
  }
  pas8(30)
  pas8(30)
  pas8(1)
  pas8(1)
  const a8 = [1000 - w8.ennemis[0].pv, 1000 - w8.ennemis[1].pv]
  pas8(30)
  pas8(1)
  verifier('sans recharge : deux insectes qui franchissent l’un après l’autre — deux éclairs, celui encore dessus prend deux coups ; il ressort et rentre, un coup de plus à chacun', ev8.filter((e) => e.type === 'ligne').length === 3 && a8[0] === 16 && a8[1] === 8 && 1000 - w8.ennemis[0].pv === 24 && 1000 - w8.ennemis[1].pv === 16)
  // (LA CLÔTURE ÉLECTRIQUE : il reste dessus 1,1 s — à l'entrée, puis toutes les 0,5 s : trois coups ; sorti, plus rien)
  const w9 = nouveauMonde(cfg, 3)
  w9.vaisseau = { ...w9.vaisseau, x: 0, y: 200 }
  w9.balises.push({ id: 900, x: -30, y: 0, nee: 0, arme: 0, rang: 0, trio: 900, liens: [] }, { id: 901, x: 30, y: 0, nee: 0, arme: 0, rang: 1, trio: 900, liens: [{ vers: 900, sur: [], dechargeA: 0 }] })
  w9.armesA[0] = 1e9
  w9.ennemis.push(insecte(1, 0, 1))
  const ev9: Evenement[] = []
  for (let i = 0; i < 60 * 2; i++) {
    w9.ennemis[0].corps = { ...w9.ennemis[0].corps, x: 0, y: i < 66 ? 1 : 40, vx: 0, vy: 0 }
    ev9.push(...avancerLeMonde(cfg, w9, 1 / 60, { x: 0, y: 0 }).evenements)
  }
  verifier('tant qu’il reste sur la ligne, elle continue de décharger (à l’entrée, puis toutes les 0,5 s) ; sorti, plus rien', ev9.filter((e) => e.type === 'ligne').length === 3 && 1000 - w9.ennemis[0].pv === 24)
  // (personne entre elles : elles ne tirent pas)
  const w4 = nouveauMonde(cfg, 3)
  w4.vaisseau = { ...w4.vaisseau, x: 0, y: 200 }
  w4.balises.push({ id: 900, x: -30, y: 0, nee: 0, arme: 0, rang: 0, trio: 900, liens: [] }, { id: 901, x: 30, y: 0, nee: 0, arme: 0, rang: 1, trio: 900, liens: [{ vers: 900, sur: [], dechargeA: 0 }] })
  w4.armesA[0] = 1e9
  w4.ennemis.push(insecte(1, 60, 0))
  const ev4: Evenement[] = []
  for (let i = 0; i < 30; i++) {
    w4.ennemis[0].corps = { ...w4.ennemis[0].corps, x: 60, y: 0, vx: 0, vy: 0 }
    ev4.push(...avancerLeMonde(cfg, w4, 1 / 60, { x: 0, y: 0 }).evenements)
  }
  verifier('personne entre elles (un insecte dans l’axe, mais au-delà) : la ligne ne s’éclaire pas', !ev4.some((e) => e.type === 'ligne') && w4.ennemis[0].pv === 1000)
}
// LE GIVRE DU FRIMAS (Keko, 15/11) : une traînée derrière le vaisseau, qui ralentit et ronge les insectes dedans
{
  const insecte = (id: number, x: number, y: number) => ({ id, corps: { ...nouveauVaisseau(), x, y }, pv: 1000, fait: 'marche' as const, roche: null, forage: null, tirA: 1e9, butin: 0, cargaison: { fer: 0, or: 0, cristal: 0 }, calmeA: 1e9 })
  const givre = { id: 'givre', cadence: 0.1, degats: 0, portee: 0, vitesse: 0, vie: 0, dispersion: 0, guide: false, givre: { ecart: 5, rayon: 7, duree: 3, dps: 6, ralenti: 0.35 } }
  const cfg = { ...VAISSEAU, champ: { ...VAISSEAU.champ, densite: 0 }, station: { ...VAISSEAU.station, portee: -1 }, armes: [givre], ennemi: { ...VAISSEAU.ennemi, apparait: 1e9, pv: 1000 } }
  // (en volant vers la droite : des plaques espacées, toutes DERRIÈRE lui ; elles s'éteignent au bout de leur durée)
  const w = nouveauMonde(cfg, 3)
  for (let i = 0; i < 90; i++) avancerLeMonde(cfg, w, 1 / 60, { x: 1, y: 0 })
  const derriere = w.givres.every((g) => g.x < w.vaisseau.x)
  const espacees = w.givres.every((g, k) => k === 0 || Math.hypot(g.x - w.givres[k - 1].x, g.y - w.givres[k - 1].y) >= 5)
  verifier('en vol, il sème une traînée de givre derrière lui, des plaques espacées', w.givres.length > 5 && derriere && espacees)
  w.vaisseau = { ...w.vaisseau, vx: 0, vy: 0 } // (le vide freine à peine : on l'arrête net)
  for (let i = 0; i < 60 * 4; i++) avancerLeMonde(cfg, w, 1 / 60, { x: 0, y: 0 })
  verifier('arrêté, il ne sème plus ; les plaques s’éteignent au bout de leur durée', w.givres.length <= 1)
  // (un insecte tenu dans une plaque : il perd ses points par seconde et il est gelé ; un autre, à côté, rien)
  const w2 = nouveauMonde(cfg, 3)
  w2.armesA[0] = 0
  w2.givres.push({ id: 900, arme: 0, x: 100, y: 0, nee: 0, rayon: 7, duree: 1e9, dps: 6, ralenti: 0.35 })
  w2.ennemis.push(insecte(1, 100, 0), insecte(2, 100, 40))
  const ev2: Evenement[] = []
  for (let i = 0; i < 60; i++) {
    w2.ennemis.forEach((e, k) => (e.corps = { ...e.corps, x: 100, y: [0, 40][k], vx: 0, vy: 0 }))
    ev2.push(...avancerLeMonde(cfg, w2, 1 / 60, { x: 0, y: 0 }).evenements)
  }
  verifier('un insecte dans le givre perd ses points par seconde et il est gelé (une fois annoncé) ; à côté, rien', Math.abs(1000 - w2.ennemis[0].pv - 6) < 0.2 && (w2.ennemis[0].geleA ?? 0) > w2.t && ev2.filter((e) => e.type === 'gele').length === 1 && w2.ennemis[1].pv === 1000 && (w2.ennemis[1].geleA ?? 0) < w2.t)
  // (L'INVASION : deux insectes marchent vers le portail, l'un dans le givre — il avance bien moins vite)
  const cfgI = { ...cfg, invasion: { ...VAISSEAU.invasion, active: true } }
  const w3 = nouveauMonde(cfgI, 3)
  w3.invasion.prochainA = 1e9
  w3.vaisseau = { ...w3.vaisseau, x: -2000, y: 0 }
  w3.givres.push({ id: 900, arme: 0, x: 300, y: 0, nee: 0, rayon: 40, duree: 1e9, dps: 0, ralenti: 0.35 })
  w3.ennemis.push(insecte(1, 300, 0), insecte(2, 0, 300))
  for (let i = 0; i < 90; i++) avancerLeMonde(cfgI, w3, 1 / 60, { x: 0, y: 0 })
  const fait = [300 - Math.hypot(w3.ennemis[0].corps.x, w3.ennemis[0].corps.y), 300 - Math.hypot(w3.ennemis[1].corps.x, w3.ennemis[1].corps.y)]
  verifier('gelé, un insecte avance bien moins vite vers le portail', fait[1] > 10 && fait[0] < fait[1] * 0.5)
}
// LES ÉCLATS DE GLACE DU FRIMAS (Keko, 15/11) : huit éclats à angles égaux tout autour, à sa cadence, s'il y a un insecte
// à portée ; ce qu'ils touchent est gelé
{
  const insecte = (id: number, x: number, y: number) => ({ id, corps: { ...nouveauVaisseau(), x, y }, pv: 1000, fait: 'marche' as const, roche: null, forage: null, tirA: 1e9, butin: 0, cargaison: { fer: 0, or: 0, cristal: 0 }, calmeA: 1e9 })
  const eclats = { id: 'eclats', cadence: 1.6, degats: 4, portee: 70, vitesse: 160, vie: 0.45, dispersion: 0, guide: false, salve: { nombre: 8, perce: true }, gel: { duree: 1.5, ralenti: 0.5 } }
  const cfg = { ...VAISSEAU, champ: { ...VAISSEAU.champ, densite: 0 }, station: { ...VAISSEAU.station, portee: -1 }, armes: [eclats], ennemi: { ...VAISSEAU.ennemi, apparait: 1e9, pv: 1000 } }
  const w = nouveauMonde(cfg, 3)
  w.ennemis.push(insecte(1, 0, -40))
  const ev: Evenement[] = []
  let angles: number[] = []
  for (let i = 0; i < 30; i++) {
    w.ennemis[0].corps = { ...w.ennemis[0].corps, x: 0, y: -40, vx: 0, vy: 0 }
    const r = avancerLeMonde(cfg, w, 1 / 60, { x: 0, y: 0 }).evenements
    if (r.some((e) => e.type === 'salve')) angles = w.obus.map((o) => Math.atan2(o.vy, o.vx)).sort((a, b) => a - b)
    ev.push(...r)
  }
  const egaux = angles.length === 8 && angles.every((a, k) => k === 0 || Math.abs(a - angles[k - 1] - Math.PI / 4) < 1e-6)
  verifier('une salve : huit éclats à angles égaux tout autour, une seule à la fois (sa cadence)', ev.filter((e) => e.type === 'salve').length === 1 && egaux)
  verifier('l’éclat qui touche gèle l’insecte (à la moitié de sa vitesse) et lui coûte ses points', 1000 - w.ennemis[0].pv === 4 && (w.ennemis[0].geleA ?? 0) > w.t && w.ennemis[0].ralenti === 0.5 && ev.some((e) => e.type === 'gele'))
  const w2 = nouveauMonde(cfg, 3)
  w2.ennemis.push(insecte(1, 0, -200))
  const ev2: Evenement[] = []
  for (let i = 0; i < 60; i++) {
    w2.ennemis[0].corps = { ...w2.ennemis[0].corps, x: 0, y: -200, vx: 0, vy: 0 }
    ev2.push(...avancerLeMonde(cfg, w2, 1 / 60, { x: 0, y: 0 }).evenements)
  }
  verifier('personne à portée : pas de salve', !ev2.some((e) => e.type === 'salve') && w2.obus.length === 0)
  // (LA COURONNE S'ORIENTE, LES ÉCLATS TRAVERSENT : deux insectes en ligne, hors des huit directions du nez — le premier
  // éclat part vers le plus proche, les touche tous les deux)
  const w3 = nouveauMonde(cfg, 3)
  const pl: [number, number][] = [[22, -14], [44, -28]]
  pl.forEach(([x, y], k) => w3.ennemis.push(insecte(k + 1, x, y)))
  for (let i = 0; i < 40; i++) {
    w3.ennemis.forEach((e, k) => (e.corps = { ...e.corps, x: pl[k][0], y: pl[k][1], vx: 0, vy: 0 }))
    avancerLeMonde(cfg, w3, 1 / 60, { x: 0, y: 0 })
  }
  verifier('la couronne s’oriente sur le plus proche, et l’éclat traverse : les deux insectes en ligne sont touchés et gelés, une fois chacun', w3.ennemis.every((e) => 1000 - e.pv === 4 && (e.geleA ?? 0) > w3.t))
  // (LES GROS ÉCLATS SE BRISENT — Keko, 16/11 : l'éclat s'arrête sur le premier insecte et ses fragments filent en cône
  // derrière lui : celui de derrière en prend UN coup (2), celui de côté, hors du cône, rien ; la cible n'est pas retouchée)
  const cfg4 = { ...cfg, armes: [{ ...eclats, salve: { nombre: 8, eclatement: { nombre: 6, cone: 0.9, vitesse: 150, vie: 0.22, degats: 2 } } }] }
  const w4 = nouveauMonde(cfg4, 3)
  const pl4: [number, number][] = [[30, 0], [50, 0], [45, 18]]
  pl4.forEach(([x, y], k) => w4.ennemis.push(insecte(k + 1, x, y)))
  const ev4: Evenement[] = []
  for (let i = 0; i < 50; i++) {
    w4.ennemis.forEach((e, k) => (e.corps = { ...e.corps, x: pl4[k][0], y: pl4[k][1], vx: 0, vy: 0 }))
    ev4.push(...avancerLeMonde(cfg4, w4, 1 / 60, { x: 0, y: 0 }).evenements)
  }
  const pv4 = w4.ennemis.map((e) => 1000 - e.pv)
  verifier(`le gros éclat se brise sur la cible et ses fragments partent en cône derrière : ${pv4.join(' / ')} (4 à la cible, 2 à celui de derrière, gelé, 0 à celui de côté)`, ev4.filter((e) => e.type === 'eclatement').length === 1 && pv4[0] === 4 && pv4[1] === 2 && pv4[2] === 0 && (w4.ennemis[1].geleA ?? 0) > w4.t)
}

// LA TORNADE DE GIVRE DU FRIMAS (Keko, 15/11) : elle part du vaisseau, suit les insectes, gèle et ronge ce qui est dedans,
// et s'éteint au bout de sa durée
{
  const insecte = (id: number, x: number, y: number) => ({ id, corps: { ...nouveauVaisseau(), x, y }, pv: 1000, fait: 'marche' as const, roche: null, forage: null, tirA: 1e9, butin: 0, cargaison: { fer: 0, or: 0, cristal: 0 }, calmeA: 1e9 })
  const tornade = { id: 'tornade', cadence: 6, degats: 0, portee: 120, vitesse: 0, vie: 0, dispersion: 0, guide: false, tornade: { vitesse: 18, virage: 3, duree: 4.5, rayon: 14, dps: 8, ralenti: 0.4 } }
  const cfg = { ...VAISSEAU, champ: { ...VAISSEAU.champ, densite: 0 }, station: { ...VAISSEAU.station, portee: -1 }, armes: [tornade], ennemi: { ...VAISSEAU.ennemi, apparait: 1e9, pv: 1000 } }
  const w = nouveauMonde(cfg, 3)
  w.ennemis.push(insecte(1, 24, 20))
  const ev: Evenement[] = []
  let surLui = false
  for (let i = 0; i < 60 * 5; i++) {
    w.ennemis[0].corps = { ...w.ennemis[0].corps, x: 24, y: 20, vx: 0, vy: 0 }
    ev.push(...avancerLeMonde(cfg, w, 1 / 60, { x: 0, y: 0 }).evenements)
    if (w.tornades.length > 0 && Math.hypot(w.tornades[0].x - 24, w.tornades[0].y - 20) < 8) surLui = true
  }
  verifier('une tornade part du vaisseau, rejoint l’insecte, le gèle et le ronge, puis s’éteint au bout de sa durée', ev.filter((e) => e.type === 'tornade').length === 1 && surLui && w.ennemis[0].pv < 1000 - 8 * 2 && ev.some((e) => e.type === 'gele') && ev.some((e) => e.type === 'tornadeFinie') && w.tornades.length === 0)
  // (elle SUIT : l'insecte bouge, elle le rattrape là où il est)
  const w2 = nouveauMonde(cfg, 3)
  w2.ennemis.push(insecte(1, 20, 0))
  let pres = Infinity
  for (let i = 0; i < 60 * 4; i++) {
    const ey = (i / 60) * 8
    w2.ennemis[0].corps = { ...w2.ennemis[0].corps, x: 20, y: ey, vx: 0, vy: 8 }
    avancerLeMonde(cfg, w2, 1 / 60, { x: 0, y: 0 })
    if (i > 150 && w2.tornades.length > 0) pres = Math.min(pres, Math.hypot(w2.tornades[0].x - 20, w2.tornades[0].y - ey))
  }
  verifier('elle suit l’insecte qui bouge', pres < 10)
  const w3 = nouveauMonde(cfg, 3)
  w3.ennemis.push(insecte(1, 0, -300))
  const cap3 = w3.vaisseau.cap
  avancerLeMonde(cfg, w3, 1 / 60, { x: 0, y: 0 })
  const depart = w3.tornades[0]
  // (… PUIS ELLE PART QUAND MÊME — Keko, 19/11 : « même quand il n'y a pas d'ennemis » : droit devant le nez)
  verifier('personne à portée : elle part quand même, droit devant le nez', w3.tornades.length === 1 && depart !== undefined && Math.abs(Math.atan2(depart.vy, depart.vx) - cap3) < 0.05)
}

// L'ORBE DE PLASMA DU PULSAR (Keko, 16/11) : elle file vers là où sera la cible, traverse ce qu'elle croise, et y éclate
{
  const insecte = (id: number, x: number, y: number) => ({ id, corps: { ...nouveauVaisseau(), x, y }, pv: 1000, fait: 'marche' as const, roche: null, forage: null, tirA: 1e9, butin: 0, cargaison: { fer: 0, or: 0, cristal: 0 }, calmeA: 1e9 })
  const plasma = { id: 'plasma', cadence: 1.4, degats: 5, portee: 110, vitesse: 70, vie: 2.2, dispersion: 0, guide: false, plasma: { rayon: 22, degats: 12 } }
  const cfg = { ...VAISSEAU, champ: { ...VAISSEAU.champ, densite: 0 }, station: { ...VAISSEAU.station, portee: -1 }, arcDeTir: 0, armes: [plasma], ennemi: { ...VAISSEAU.ennemi, apparait: 1e9, pv: 1000 } }
  const w = nouveauMonde(cfg, 3)
  // (la cible à 60, une voisine à 15 d'elle, plus loin du vaisseau, et une troisième à 60 de là, hors de l'éclat)
  w.ennemis.push(insecte(1, 60, 0), insecte(2, 68, 13), insecte(3, 60, 70))
  const ev: Evenement[] = []
  for (let i = 0; i < 72; i++) {
    for (const [k, [x, y]] of [[60, 0], [68, 13], [60, 70]].entries()) w.ennemis[k].corps = { ...w.ennemis[k].corps, x, y, vx: 0, vy: 0 }
    w.vaisseau = { ...w.vaisseau, x: 0, y: 0, vx: 0, vy: 0 }
    ev.push(...avancerLeMonde(cfg, w, 1 / 60, { x: 0, y: 0 }).evenements)
  }
  const pv = w.ennemis.map((e) => 1000 - e.pv)
  verifier('une orbe part, traverse la cible (5) et éclate au bout de sa course (12) : la voisine prend l’éclat, la lointaine rien', ev.filter((e) => e.type === 'explosionDeZone' && e.arme === 'plasma').length === 1 && pv[0] === 17 && pv[1] === 12 && pv[2] === 0 && w.obus.length === 0)
}

// LA SPHÈRE DE PLASMA DU PULSAR (Keko, 16/11) : elle part tout droit, tire de petits traits sur les insectes proches
// de sa trajectoire, ne touche rien elle-même, et s'éteint
{
  const insecte = (id: number, x: number, y: number) => ({ id, corps: { ...nouveauVaisseau(), x, y }, pv: 1000, fait: 'marche' as const, roche: null, forage: null, tirA: 1e9, butin: 0, cargaison: { fer: 0, or: 0, cristal: 0 }, calmeA: 1e9 })
  const sphere = { id: 'plasma', cadence: 9, degats: 3, portee: 110, vitesse: 0, vie: 0, dispersion: 0, guide: false, sphere: { vitesse: 40, duree: 3.2, rayon: 42, periode: 0.45, vitesseTir: 120 } }
  const cfg = { ...VAISSEAU, champ: { ...VAISSEAU.champ, densite: 0 }, station: { ...VAISSEAU.station, portee: -1 }, armes: [sphere], ennemi: { ...VAISSEAU.ennemi, apparait: 1e9, pv: 1000 } }
  const w = nouveauMonde(cfg, 3)
  // (la cible, la plus proche, sur l'axe ; une voisine de la trajectoire, plus loin, à 25 de côté ; une loin d'elle, à 75)
  const places: [number, number][] = [[60, 0], [100, 25], [60, -75]]
  places.forEach(([x, y], k) => w.ennemis.push(insecte(k + 1, x, y)))
  const ev: Evenement[] = []
  let chemin: [number, number][] = []
  for (let i = 0; i < 60 * 3.5; i++) {
    places.forEach(([x, y], k) => (w.ennemis[k].corps = { ...w.ennemis[k].corps, x, y, vx: 0, vy: 0 }))
    w.vaisseau = { ...w.vaisseau, x: 0, y: 0, vx: 0, vy: 0 }
    ev.push(...avancerLeMonde(cfg, w, 1 / 60, { x: 0, y: 0 }).evenements)
    if (w.spheres.length > 0) chemin.push([w.spheres[0].x, w.spheres[0].y])
  }
  const pv = w.ennemis.map((e) => 1000 - e.pv)
  const droit = chemin.length > 10 && chemin.every(([, y]) => Math.abs(y - chemin[0][1]) < 1e-6)
  verifier('une sphère part tout droit vers l’insecte, tire sur la cible et sur la voisine de sa trajectoire (par 3), jamais sur la lointaine, puis s’éteint', ev.filter((e) => e.type === 'sphere').length === 1 && droit && pv[0] > 0 && pv[0] % 3 === 0 && pv[1] > 0 && pv[1] % 3 === 0 && pv[2] === 0 && ev.some((e) => e.type === 'sphereFinie') && w.spheres.length === 0)
}

// LE RAILGUN DU PULSAR (Keko, 16/11) : un trait instantané, très long, qui traverse tout — sur la ligne qui en traverse le plus
{
  const insecte = (id: number, x: number, y: number) => ({ id, corps: { ...nouveauVaisseau(), x, y }, pv: 1000, fait: 'marche' as const, roche: null, forage: null, tirA: 1e9, butin: 0, cargaison: { fer: 0, or: 0, cristal: 0 }, calmeA: 1e9 })
  const rail = { id: 'rail', cadence: 2.6, degats: 16, portee: 220, vitesse: 0, vie: 0, dispersion: 0, guide: false, rail: { largeur: 3 } }
  const cfg = { ...VAISSEAU, champ: { ...VAISSEAU.champ, densite: 0 }, station: { ...VAISSEAU.station, portee: -1 }, armes: [rail], ennemi: { ...VAISSEAU.ennemi, apparait: 1e9, pv: 1000 } }
  const tirer = (verrou: number | null) => {
    const w = nouveauMonde(cfg, 3)
    // (un seul insecte tout près, à gauche ; trois alignés vers le haut, le plus loin à 200 ; un hors de portée, à 260)
    for (const [k, [x, y]] of ([[-30, 0], [0, -60], [0, -130], [0, -200], [0, -260]] as [number, number][]).entries()) w.ennemis.push(insecte(k + 1, x, y))
    w.vaisseau = { ...w.vaisseau, x: 0, y: 0, vx: 0, vy: 0 }
    w.verrou = verrou
    const ev = avancerLeMonde(cfg, w, 1 / 60, { x: 0, y: 0 }).evenements
    return { ev, pv: w.ennemis.map((e) => 1000 - e.pv) }
  }
  const libre = tirer(null)
  verifier('le railgun tire à l’instant sur la ligne qui en traverse le plus : les trois alignés, jusqu’à 200, perdent 16 ; le proche à côté et celui au-delà de la portée, rien', libre.ev.filter((e) => e.type === 'rail').length === 1 && libre.pv[0] === 0 && libre.pv[1] === 16 && libre.pv[2] === 16 && libre.pv[3] === 16 && libre.pv[4] === 0)
  const verrouille = tirer(1)
  verifier('un insecte verrouillé : le trait va sur lui', verrouille.pv[0] === 16 && verrouille.pv[1] === 0)
}

// LES TENTACULES DU KRAKEN (Keko, 16/11) : chacune s'étend en courbe vers un insecte, le pique au bout de son élan,
// reste plantée, se rétracte, se repose, recommence
{
  const insecte = (id: number, x: number, y: number) => ({ id, corps: { ...nouveauVaisseau(), x, y }, pv: 1000, fait: 'marche' as const, roche: null, forage: null, tirA: 1e9, butin: 0, cargaison: { fer: 0, or: 0, cristal: 0 }, calmeA: 1e9 })
  // (UNE SEULE, À LA PROUE, BEAUCOUP PLUS RAPIDE — Keko, 16/11)
  const tentacule = { id: 'tentacule', cadence: 0.05, degats: 6, portee: 55, vitesse: 0, vie: 0, dispersion: 0, guide: false, tentacule: { ancres: [[7.2, 0]] as [number, number][], aller: 0.12, tenue: 0.06, retour: 0.12, virage: 0.35 } }
  const cfg = { ...VAISSEAU, champ: { ...VAISSEAU.champ, densite: 0 }, station: { ...VAISSEAU.station, portee: -1 }, armes: [tentacule], ennemi: { ...VAISSEAU.ennemi, apparait: 1e9, pv: 1000 } }
  const fouetter = (places: [number, number][], verrou: number | null, duree: number) => {
    const w = nouveauMonde(cfg, 3)
    places.forEach(([x, y], k) => w.ennemis.push(insecte(k + 1, x, y)))
    w.verrou = verrou
    const ev: Evenement[] = []
    let premiere = -1
    let virages = new Set<number>()
    for (let i = 0; i < 60 * duree; i++) {
      places.forEach(([x, y], k) => (w.ennemis[k].corps = { ...w.ennemis[k].corps, x, y, vx: 0, vy: 0 }))
      w.vaisseau = { ...w.vaisseau, x: 0, y: 0, vx: 0, vy: 0 }
      const r = avancerLeMonde(cfg, w, 1 / 60, { x: 0, y: 0 }).evenements
      ev.push(...r)
      if (premiere < 0 && r.some((e) => e.type === 'piqure')) premiere = w.t
      for (const tn of w.tentacules) if (tn.fait === 'aller') virages.add(Math.sign(tn.virage))
    }
    return { w, ev, premiere, virages, pv: w.ennemis.map((e) => 1000 - e.pv) }
  }
  const un = fouetter([[30, 0], [0, 200]], null, 2)
  const piqures = un.ev.filter((e) => e.type === 'piqure').length
  verifier(`la tentacule s’étend vers l’insecte proche et le pique au bout de son élan (pas avant ${0.12} s) ; ${piqures} piqûres en 2 s — deux et demie par seconde —, 6 chacune ; le lointain, rien`, un.premiere >= 0.12 - 1e-9 && piqures >= 5 && un.pv[0] === piqures * 6 && un.pv[1] === 0)
  verifier('elles ne vont pas droit : chaque élan a son virage, d’un côté ou de l’autre', !un.virages.has(0) && un.virages.size >= 1)
  const proche = fouetter([[40, 0], [25, 10], [-10, 45]], null, 0.2)
  verifier('trois insectes à portée : elle pique le plus proche de sa racine', proche.pv[1] === 6 && proche.pv[0] === 0 && proche.pv[2] === 0)
  const verrou = fouetter([[40, 0], [25, 10], [-10, 45]], 3, 0.2)
  verifier('un insecte verrouillé : elle va sur lui', verrou.pv[2] === 6 && verrou.pv[0] === 0 && verrou.pv[1] === 0)
  // (… TOUR À TOUR, SES SIX TENTACULES DU CORPS — Keko, 19/11 : une seule part à la fois, de la racine du côté de la cible)
  const RACINES: [number, number][] = [[-0.2, -4.8], [-0.2, 4.8], [-3.2, -4.5], [-3.2, 4.5], [-5.4, -2.2], [-5.4, 2.2]]
  const corps = { ...tentacule, cadence: 0.42, tentacule: { ancres: RACINES, aller: 0.2, tenue: 0.08, retour: 0.24, virage: 0.35, alterne: true } }
  const cfgCorps = { ...cfg, armes: [corps] }
  const tourATour = (places: [number, number][], duree: number) => {
    const w = nouveauMonde(cfgCorps, 3)
    places.forEach(([x, y], k) => w.ennemis.push(insecte(k + 1, x, y)))
    const ev: Evenement[] = []
    let auPlus = 0
    const parties = new Set<number>()
    for (let i = 0; i < 60 * duree; i++) {
      places.forEach(([x, y], k) => (w.ennemis[k].corps = { ...w.ennemis[k].corps, x, y, vx: 0, vy: 0 }))
      w.vaisseau = { ...w.vaisseau, x: 0, y: 0, vx: 0, vy: 0, cap: 0 }
      ev.push(...avancerLeMonde(cfgCorps, w, 1 / 60, { x: 0, y: 0 }).evenements)
      const sorties = w.tentacules.filter((tn) => tn.fait !== 'repos')
      auPlus = Math.max(auPlus, sorties.length)
      for (const tn of sorties) parties.add(tn.ancre)
    }
    return { w, ev, auPlus, parties, pv: w.ennemis.map((e) => 1000 - e.pv) }
  }
  const gauche = tourATour([[30, -20]], 4)
  const nGauche = gauche.ev.filter((e) => e.type === 'piqure').length
  verifier(`ses six tentacules : un insecte à gauche devant, seules celles de gauche partent (${[...gauche.parties].join(', ')}), jamais plus de deux dehors (${gauche.auPlus}) ; ${nGauche} piqûres en 4 s — 14 points par seconde`, [...gauche.parties].every((k) => RACINES[k][1] < 0) && gauche.auPlus <= 2 && nGauche >= 8 && nGauche <= 10 && gauche.pv[0] === 6 * nGauche)
  const loin = tourATour([[80, 0]], 1)
  verifier('un insecte à plus de 55 du vaisseau : aucune ne part', loin.ev.every((e) => e.type !== 'tentacule') && loin.pv[0] === 0)
}

// LE NUAGE D'INSECTES DU KRAKEN (Keko, 16/11) : il reste autour du vaisseau ; vers les insectes à portée, il étend des
// bras, qui mordent une fois tendus
{
  const insecte = (id: number, x: number, y: number) => ({ id, corps: { ...nouveauVaisseau(), x, y }, pv: 1000, fait: 'marche' as const, roche: null, forage: null, tirA: 1e9, butin: 0, cargaison: { fer: 0, or: 0, cristal: 0 }, calmeA: 1e9 })
  const nuee = { id: 'nuee', cadence: 1, degats: 0, portee: 55, vitesse: 0, vie: 0, dispersion: 0, guide: false, nuee: { rayon: 14, budget: 14, deploiement: 0.3, periode: 0.4 } }
  const cfg = { ...VAISSEAU, champ: { ...VAISSEAU.champ, densite: 0 }, station: { ...VAISSEAU.station, portee: -1 }, armes: [nuee], ennemi: { ...VAISSEAU.ennemi, apparait: 1e9, pv: 1000 } }
  const planer = (places: [number, number][], vitesse: number, duree: number) => {
    const w = nouveauMonde(cfg, 3)
    places.forEach(([x, y], k) => w.ennemis.push(insecte(k + 1, x, y)))
    const ev: Evenement[] = []
    let bras05 = -1
    for (let i = 0; i < 60 * duree; i++) {
      places.forEach(([x, y], k) => (w.ennemis[k].corps = { ...w.ennemis[k].corps, x, y, vx: 0, vy: 0 }))
      w.vaisseau = { ...w.vaisseau, x: (vitesse * i) / 60, y: 0, vx: vitesse, vy: 0 }
      ev.push(...avancerLeMonde(cfg, w, 1 / 60, { x: 0, y: 0 }).evenements)
      if (i === 9) bras05 = w.nuees[0]?.bras[0]?.u ?? -1
    }
    return { w, ev, bras05, pv: w.ennemis.map((e) => 1000 - e.pv) }
  }
  const seul = planer([[0, 500]], 40, 1)
  verifier('personne à portée : le nuage reste sur le vaisseau, même quand il file, sans bras', seul.w.nuees[0].x === seul.w.vaisseau.x && seul.w.nuees[0].y === seul.w.vaisseau.y && seul.w.nuees[0].bras.length === 0)
  const un = planer([[40, 0], [0, 90]], 0, 2)
  // (UNE SEULE PORTÉE — Keko, 20/11 : à portée, il est mordu tout de suite ; le jet ne fait que s'étendre à l'image)
  verifier(`un insecte à 40 (à portée) : il est mordu tout de suite (${un.pv[0].toFixed(1)} en 2 s, 14 par seconde), un jet s’étend vers lui (à mi-course au bout de 0,15 s) ; le lointain, rien`, un.bras05 > 0.4 && un.bras05 < 0.7 && Math.abs(un.pv[0] - 28) < 0.5 && un.pv[1] === 0 && un.ev.some((e) => e.type === 'morsure'))
  const cinq = planer([[30, 0], [-30, 0], [0, 35], [0, -40], [45, 30]], 0, 1)
  // (SANS LIMITE — Keko, 20/11 : « la nuée attaque autant d'ennemis à portée, en divisant ses dégâts entre ceux-ci »)
  verifier(`cinq insectes à portée : elle s’étend vers les cinq, et ils se partagent ses 14 points par seconde (${cinq.pv.map((x) => x.toFixed(1)).join(' / ')} en 1 s)`, cinq.w.nuees[0].bras.length === 5 && cinq.pv.every((x) => x > 0) && Math.abs(cinq.pv.reduce((s, x) => s + x, 0) - 14) < 0.5)
  const verrou = (() => {
    const w = nouveauMonde(cfg, 3)
    ;([[30, 0], [-30, 0], [0, 35], [45, 30]] as [number, number][]).forEach(([x, y], k) => w.ennemis.push(insecte(k + 1, x, y)))
    w.verrou = 4
    for (let i = 0; i < 60; i++) {
      w.vaisseau = { ...w.vaisseau, x: 0, y: 0, vx: 0, vy: 0 }
      for (const e of w.ennemis) e.corps = { ...e.corps, vx: 0, vy: 0 }
      avancerLeMonde(cfg, w, 1 / 60, { x: 0, y: 0 })
    }
    return w
  })()
  verifier('un insecte verrouillé, même le plus loin : il a son bras', verrou.nuees[0].bras.some((b) => b.cible === 4))
  // (LE BUDGET DE LA NUÉE — Keko, 17/11 : les insectes mordus en même temps se partagent ses 14 points par seconde)
  const deux = planer([[8, 0], [-8, 0]], 0, 1)
  const trois = planer([[8, 0], [-8, 0], [0, 8]], 0, 1)
  verifier(`la nuée partage son budget : seul, un insecte dans le nuage perd 14 par seconde ; à deux, 7 chacun (${deux.pv.map((x) => x.toFixed(1)).join(' / ')}) ; à trois, 4,7 (${trois.pv.map((x) => x.toFixed(1)).join(' / ')})`, deux.pv.every((x) => Math.abs(x - 7) < 0.2) && trois.pv.every((x) => Math.abs(x - 14 / 3) < 0.2))
  // (ELLE SE NOURRIT — Keko, 20/11 : +1 % de dégâts par insecte mordu, à chaque morsure, jusqu'au double ; à vide, elle maigrit)
  {
    const cfgF = { ...cfg, armes: [{ ...nuee, nuee: { ...nuee.nuee, festin: { pas: 0.01, max: 1, fonte: 10 } } }] }
    const w = nouveauMonde(cfgF, 3)
    const tenir = (places: [number, number][], secondes: number): number => {
      w.ennemis = places.map(([x, y], k) => insecte(k + 1, x, y))
      const pv0 = w.ennemis.reduce((s, e) => s + e.pv, 0)
      for (let i = 0; i < 60 * secondes; i++) {
        places.forEach(([x, y], k) => (w.ennemis[k].corps = { ...w.ennemis[k].corps, x, y, vx: 0, vy: 0 }))
        w.vaisseau = { ...w.vaisseau, x: 0, y: 0, vx: 0, vy: 0 }
        avancerLeMonde(cfgF, w, 1 / 60, { x: 0, y: 0 })
      }
      return pv0 - w.ennemis.reduce((s, e) => s + e.pv, 0)
    }
    const debut = tenir([[30, 0]], 1)
    const apres10 = (tenir([[30, 0]], 10), w.nuees[0].croissance)
    const fin = tenir([[30, 0]], 1)
    tenir([], 0.5)
    const maigrie = w.nuees[0].croissance
    tenir([], 9.6)
    const fondue = w.nuees[0].croissance
    tenir([[30, 0], [-30, 0], [0, 30], [0, -30], [20, 20]], 40)
    verifier(`la nuée se nourrit : un insecte mordu 10 s la fait croître de ${Math.round(apres10 * 100)} % (une morsure toutes les 0,4 s), ses dégâts suivent (${debut.toFixed(1)} puis ${fin.toFixed(1)} par seconde) ; à vide, elle fond vite — ${Math.round(maigrie * 100)} % après 0,5 s, ${Math.round(fondue * 100)} % après 10 s (elle perd son maximum en 10 s) ; cinq insectes 40 s, elle plafonne au double`, Math.abs(apres10 - 0.25) < 0.02 && fin > debut * 1.25 && maigrie < apres10 && fondue === 0 && w.nuees[0].croissance === 1)
  }
}
// LES REJETONS DU KRAKEN (Keko, 16/11) : pondus quand un insecte est à portée, ils nagent jusqu'à lui et le fouettent ;
// trois au plus ; ils meurent au bout de leur durée
{
  const insecte = (id: number, x: number, y: number) => ({ id, corps: { ...nouveauVaisseau(), x, y }, pv: 100000, fait: 'marche' as const, roche: null, forage: null, tirA: 1e9, butin: 0, cargaison: { fer: 0, or: 0, cristal: 0 }, calmeA: 1e9 })
  const rejeton = { id: 'rejeton', cadence: 3.5, degats: 4, portee: 110, vitesse: 0, vie: 0, dispersion: 0, guide: false, rejeton: { max: 3, duree: 14, vitesse: 70, acces: 5, vue: 90, allonge: 32, periode: 0.5 } }
  const cfg = { ...VAISSEAU, champ: { ...VAISSEAU.champ, densite: 0 }, station: { ...VAISSEAU.station, portee: -1 }, armes: [rejeton], ennemi: { ...VAISSEAU.ennemi, apparait: 1e9, pv: 100000 } }
  const elever = (places: [number, number][], duree: number) => {
    const w = nouveauMonde(cfg, 3)
    places.forEach(([x, y], k) => w.ennemis.push(insecte(k + 1, x, y)))
    const ev: Evenement[] = []
    let plus = 0
    for (let i = 0; i < 60 * duree; i++) {
      places.forEach(([x, y], k) => (w.ennemis[k].corps = { ...w.ennemis[k].corps, x, y, vx: 0, vy: 0 }))
      w.vaisseau = { ...w.vaisseau, x: 0, y: 0, vx: 0, vy: 0 }
      ev.push(...avancerLeMonde(cfg, w, 1 / 60, { x: 0, y: 0 }).evenements)
      plus = Math.max(plus, w.rejetons.length)
    }
    return { w, ev, plus, pv: w.ennemis.map((e) => 100000 - e.pv) }
  }
  const rien = elever([[0, 300]], 2)
  // (… MÊME SANS INSECTE, il en naît — Keko, 19/11 —, qui se tiennent derrière le vaisseau)
  const derriere = rien.w.rejetons.length > 0 && rien.w.rejetons.every((r) => r.x < 0)
  verifier(`personne à portée : des rejetons naissent quand même (${rien.w.rejetons.length}), et se tiennent derrière le vaisseau`, rien.ev.some((e) => e.type === 'rejeton') && derriere)
  const un = elever([[60, 0]], 2)
  verifier(`un insecte à 60 : un rejeton naît, nage jusqu’à lui et le fouette (${un.pv[0]} en 2 s, par 4)`, un.ev.filter((e) => e.type === 'rejeton').length === 1 && un.pv[0] >= 8 && un.pv[0] % 4 === 0 && un.ev.some((e) => e.type === 'coupDeRejeton'))
  const long = elever([[60, 0]], 16)
  verifier(`trois au plus (${long.plus}) ; le premier meurt au bout de 14 s`, long.plus === 3 && long.ev.some((e) => e.type === 'rejetonFini'))
  // (UN INSECTE QUI NE S'ARRÊTE PAS — Keko, 16/11 : « ils poursuivent toujours sans attaquer » : il tourne en rond à la
  // vitesse d'un insecte, 40 ; le rejeton doit le fouetter de loin, sans avoir à le rattraper)
  {
    const w = nouveauMonde(cfg, 3)
    w.ennemis.push(insecte(1, 60, 0))
    const ev: Evenement[] = []
    let plusPres = Infinity
    for (let i = 0; i < 60 * 4; i++) {
      const a = (i / 60) * (40 / 60)
      w.ennemis[0].corps = { ...w.ennemis[0].corps, x: Math.cos(a) * 60, y: Math.sin(a) * 60, vx: -Math.sin(a) * 40, vy: Math.cos(a) * 40 }
      w.vaisseau = { ...w.vaisseau, x: 0, y: 0, vx: 0, vy: 0 }
      ev.push(...avancerLeMonde(cfg, w, 1 / 60, { x: 0, y: 0 }).evenements)
      for (const r of w.rejetons) plusPres = Math.min(plusPres, Math.hypot(r.x - w.ennemis[0].corps.x, r.y - w.ennemis[0].corps.y))
    }
    const coups = ev.filter((e) => e.type === 'coupDeRejeton').length
    verifier(`un insecte qui tourne sans s’arrêter, à 40 : le rejeton le fouette de loin (${coups} coups en 4 s ; il ne l’approche pas à moins de ${plusPres.toFixed(0)})`, coups >= 4 && plusPres > 10)
  }
}

// LE CRACHAT D'ACIDE DE LA VOUIVRE (Keko, 16/11) : un cône craché, une flaque de même forme, l'acide qui ronge et qui
// majore tout ce que l'insecte perd d'autre
{
  const insecte = (id: number, x: number, y: number) => ({ id, corps: { ...nouveauVaisseau(), x, y }, pv: 1000, fait: 'marche' as const, roche: null, forage: null, tirA: 1e9, butin: 0, cargaison: { fer: 0, or: 0, cristal: 0 }, calmeA: 1e9 })
  const crachat = { id: 'crachat', cadence: 1.4, degats: 3, portee: 45, vitesse: 0, vie: 0, dispersion: 0, guide: false, crachat: { cone: 0.45, duree: 3, acide: { duree: 3, dps: 2, bonus: 0.35 } } }
  const cfg = { ...VAISSEAU, champ: { ...VAISSEAU.champ, densite: 0 }, station: { ...VAISSEAU.station, portee: -1 }, armes: [crachat], ennemi: { ...VAISSEAU.ennemi, apparait: 1e9, pv: 1000 } }
  const w = nouveauMonde(cfg, 3)
  // (deux dans le cône, devant ; un sur le côté, hors du cône ; un au-delà de la portée, dans l'axe)
  for (const [k, [x, y]] of ([[30, 0], [30, 9], [0, 34], [70, 0]] as [number, number][]).entries()) w.ennemis.push(insecte(k + 1, x, y))
  const fixer = (places: [number, number][]) => places.forEach(([x, y], k) => (w.ennemis[k].corps = { ...w.ennemis[k].corps, x, y, vx: 0, vy: 0 }))
  w.vaisseau = { ...w.vaisseau, x: 0, y: 0, vx: 0, vy: 0 }
  const ev = avancerLeMonde(cfg, w, 1 / 60, { x: 0, y: 0 }).evenements
  const p1 = w.ennemis.map((e) => 1000 - e.pv)
  verifier('le crachat : les deux insectes dans le cône perdent 3 et sont rongés ; celui de côté et celui au-delà, rien', ev.filter((e) => e.type === 'crachat').length === 1 && p1[0] >= 3 && p1[0] < 3.2 && p1[1] >= 3 && p1[1] < 3.2 && p1[2] === 0 && p1[3] === 0 && (w.ennemis[0].acide?.jusque ?? 0) > w.t && w.ennemis[2].acide === undefined)
  // (le troisième entre dans la flaque une demi-seconde après : il est rongé à son tour)
  for (let i = 0; i < 30; i++) {
    fixer([[30, 0], [30, 9], [0, 34], [70, 0]])
    w.vaisseau = { ...w.vaisseau, x: 0, y: 0, vx: 0, vy: 0 }
    avancerLeMonde(cfg, w, 1 / 60, { x: 0, y: 0 })
  }
  for (let i = 0; i < 10; i++) {
    fixer([[30, 0], [30, 9], [20, -3], [70, 0]])
    w.vaisseau = { ...w.vaisseau, x: 0, y: 0, vx: 0, vy: 0 }
    avancerLeMonde(cfg, w, 1 / 60, { x: 0, y: 0 })
  }
  verifier('la flaque : l’insecte qui y entre après le crachat est rongé à son tour', (w.ennemis[2].acide?.jusque ?? 0) > w.t)
  // (L'ACIDE MAJORE TOUTES LES SOURCES : un canon, sur un insecte rongé et sur un autre)
  const canon = { id: 'canon', cadence: 5, degats: 6, portee: 120, vitesse: 170, vie: 1, dispersion: 0, guide: false }
  const cfgC = { ...cfg, armes: [canon] }
  const tirer = (ronge: boolean) => {
    const wc = nouveauMonde(cfgC, 3)
    wc.ennemis.push(insecte(1, 40, 0))
    if (ronge) wc.ennemis[0].acide = { jusque: 100, dps: 0, bonus: 0.35 }
    for (let i = 0; i < 40; i++) {
      wc.ennemis[0].corps = { ...wc.ennemis[0].corps, x: 40, y: 0, vx: 0, vy: 0 }
      wc.vaisseau = { ...wc.vaisseau, x: 0, y: 0, vx: 0, vy: 0 }
      avancerLeMonde(cfgC, wc, 1 / 60, { x: 0, y: 0 })
    }
    return 1000 - wc.ennemis[0].pv
  }
  const sain = tirer(false)
  const ronge = tirer(true)
  verifier(`l’acide majore les autres sources : un obus de canon fait ${sain} à un insecte sain, ${ronge.toFixed(2)} à un insecte rongé (35 % de plus)`, sain === 6 && Math.abs(ronge - 6 * 1.35) < 1e-6)
}

// LES MINES D'ACIDE DE LA VOUIVRE (Keko, 16/11) : lancées en cloche vers un insecte, posées, elles éclatent en gaz quand
// un insecte passe près d'elles — dégâts et acide dans le nuage
{
  const insecte = (id: number, x: number, y: number) => ({ id, corps: { ...nouveauVaisseau(), x, y }, pv: 1000, fait: 'marche' as const, roche: null, forage: null, tirA: 1e9, butin: 0, cargaison: { fer: 0, or: 0, cristal: 0 }, calmeA: 1e9 })
  const mine = { id: 'mine', cadence: 1.8, degats: 6, portee: 40, vitesse: 0, vie: 0, dispersion: 0, guide: false, mine: { max: 6, duree: 10, vol: 0.6, rayon: 20, poison: { duree: 4, dps: 3 } } }
  const cfg = { ...VAISSEAU, champ: { ...VAISSEAU.champ, densite: 0 }, station: { ...VAISSEAU.station, portee: -1 }, armes: [mine], ennemi: { ...VAISSEAU.ennemi, apparait: 1e9, pv: 1000 } }
  // (PERSONNE : elle en sème quand même, autour d'elle, et elles attendent)
  const w = nouveauMonde(cfg, 3)
  const ev: Evenement[] = []
  for (let i = 0; i < 60 * 4; i++) {
    w.vaisseau = { ...w.vaisseau, x: 0, y: 0, vx: 0, vy: 0 }
    ev.push(...avancerLeMonde(cfg, w, 1 / 60, { x: 0, y: 0 }).evenements)
  }
  const posees = w.mines.filter((mn) => w.t - mn.lancee >= 0.6)
  verifier(`sans un insecte, elle sème des mines en permanence (${ev.filter((e) => e.type === 'mineLancee').length} en 4 s), au sol autour d’elle, entre 18 et 40 ; posées, elles attendent`, ev.filter((e) => e.type === 'mineLancee').length >= 2 && posees.length >= 2 && posees.every((mn) => Math.hypot(mn.x, mn.y) >= 18 - 1e-6 && Math.hypot(mn.x, mn.y) <= 40 + 1e-6) && ev.every((e) => e.type !== 'gaz'))
  // (un insecte entre dans la zone d'une mine posée, à 17 — loin de la toucher : elle éclate ; un voisin à 15 de l'autre
  // côté est pris dans le gaz, un autre à 40 non)
  const cible = posees[0]
  const loin = (cible.x > 0 ? -1 : 1) * 40
  w.ennemis.push(insecte(1, cible.x, cible.y - 17), insecte(2, cible.x, cible.y + 15), insecte(3, cible.x + loin, cible.y))
  const ev2: Evenement[] = []
  for (let i = 0; i < 3; i++) {
    for (const e of w.ennemis) e.corps = { ...e.corps, vx: 0, vy: 0 }
    w.vaisseau = { ...w.vaisseau, x: 0, y: 0, vx: 0, vy: 0 }
    ev2.push(...avancerLeMonde(cfg, w, 1 / 60, { x: 0, y: 0 }).evenements)
  }
  const pv = [1, 2, 3].map((id) => 1000 - (w.ennemis.find((e) => e.id === id)?.pv ?? 1000))
  // (… ET EMPOISONNÉS — Keko, 19/11 : plus rongés)
  const e1 = w.ennemis.find((e) => e.id === 1)
  verifier('un insecte entre dans la zone d’une mine posée (à 17) : elle éclate aussitôt en gaz — lui et le voisin perdent 6 et sont empoisonnés ; le lointain, rien', ev2.some((e) => e.type === 'gaz') && pv[0] >= 6 && pv[1] >= 6 && pv[2] === 0 && (e1?.poison?.jusque ?? 0) > w.t && (e1?.poisonA ?? 0) > w.t && e1?.acide === undefined && !w.mines.includes(cible))
  // (le poison ronge ensuite : 3 par seconde, 4 s)
  const pvApres = 1000 - (e1?.pv ?? 1000)
  for (let i = 0; i < 60; i++) {
    for (const e of w.ennemis) e.corps = { ...e.corps, vx: 0, vy: 0 }
    avancerLeMonde(cfg, w, 1 / 60, { x: 0, y: 0 })
  }
  const perdu = 1000 - (w.ennemis.find((e) => e.id === 1)?.pv ?? 1000) - pvApres
  verifier(`empoisonné, il perd ensuite 3 points par seconde (${perdu.toFixed(2)} en 1 s)`, Math.abs(perdu - 3) < 0.2)
}
// LE FLÉAU DE L'INGÉNIEUR (Keko, 16/11) : une masse au bout d'une chaîne, qui tourne autour du vaisseau, frappe ce
// qu'elle croise, et traîne derrière lui quand il file
{
  const insecte = (id: number, x: number, y: number) => ({ id, corps: { ...nouveauVaisseau(), x, y }, pv: 1000, fait: 'marche' as const, roche: null, forage: null, tirA: 1e9, butin: 0, cargaison: { fer: 0, or: 0, cristal: 0 }, calmeA: 1e9 })
  const fleau = { id: 'fleau', cadence: 1, degats: 8, portee: 30, vitesse: 0, vie: 0, dispersion: 0, guide: false, fleau: { longueur: 22, vitesse: 4.5, rayon: 4.5, prise: 7.5, rebond: 0.5, chaine: { degats: 3, epaisseur: 2.5 } } }
  const cfg = { ...VAISSEAU, champ: { ...VAISSEAU.champ, densite: 0 }, station: { ...VAISSEAU.station, portee: -1 }, armes: [fleau], ennemi: { ...VAISSEAU.ennemi, apparait: 1e9, pv: 1000 } }
  const w = nouveauMonde(cfg, 3)
  // (un insecte sur le cercle du fléau, un autre à 50, hors de sa portée)
  w.ennemis.push(insecte(1, 0, -22), insecte(2, 50, 0))
  let tours = 0
  let angle0 = 0
  let ecartMax = 0
  for (let i = 0; i < 60 * 3; i++) {
    w.ennemis[0].corps = { ...w.ennemis[0].corps, x: 0, y: -22, vx: 0, vy: 0 }
    w.ennemis[1].corps = { ...w.ennemis[1].corps, x: 50, y: 0, vx: 0, vy: 0 }
    w.vaisseau = { ...w.vaisseau, x: 0, y: 0, vx: 0, vy: 0 }
    avancerLeMonde(cfg, w, 1 / 60, { x: 0, y: 0 })
    const f = w.fleaux[0]
    const a = Math.atan2(f.y, f.x)
    if (i > 0) tours += Math.atan2(Math.sin(a - angle0), Math.cos(a - angle0))
    angle0 = a
    ecartMax = Math.max(ecartMax, Math.abs(Math.hypot(f.x, f.y) - 22))
  }
  const pv = w.ennemis.map((e) => 1000 - e.pv)
  verifier(`la masse tourne autour du vaisseau, tenue à 22 par la chaîne (${(tours / (2 * Math.PI)).toFixed(1)} tours en 3 s) ; elle frappe l’insecte sur sa route (${pv[0]}, par 8) ; celui à 50, rien`, tours / (2 * Math.PI) > 1.5 && ecartMax < 1e-6 && pv[0] >= 16 && pv[0] % 8 === 0 && pv[1] === 0)
  // (LA PRISE PLUS LARGE, LA CHAÎNE QUI FRAPPE : un insecte juste au-delà du cercle — à 6 de la masse quand elle passe, hors
  // de sa taille dessinée, dans sa prise — prend ses coups de masse ; un autre près du vaisseau, à 8 — hors de la prise de la masse — ne prend que ceux de la chaîne, 3)
  {
    const rE = cfg.ennemi.rayon
    const w3 = nouveauMonde(cfg, 3)
    w3.ennemis.push(insecte(1, 0, -(22 + 6 + rE)), insecte(2, 8, 0))
    for (let i = 0; i < 60 * 3; i++) {
      w3.ennemis[0].corps = { ...w3.ennemis[0].corps, x: 0, y: -(22 + 6 + rE), vx: 0, vy: 0 }
      w3.ennemis[1].corps = { ...w3.ennemis[1].corps, x: 8, y: 0, vx: 0, vy: 0 }
      w3.vaisseau = { ...w3.vaisseau, x: 0, y: 0, vx: 0, vy: 0 }
      avancerLeMonde(cfg, w3, 1 / 60, { x: 0, y: 0 })
    }
    const p3 = w3.ennemis.map((e) => 1000 - e.pv)
    verifier(`la masse frappe à sa prise, plus large qu’elle (${p3[0]}, par 8) ; la chaîne frappe aussi, moins fort (${p3[1]}, par 3)`, p3[0] >= 16 && p3[0] % 8 === 0 && p3[1] >= 6 && p3[1] % 3 === 0 && p3[1] <= 18)
  }
  // (le vaisseau file à 60 : la masse continue de faire le tour autour de lui, tenue à 22 — à vitesse constante, une
  // masse au bout d'une chaîne tourne comme à l'arrêt ; elle ne traîne que quand il accélère ou vire)
  const w2 = nouveauMonde(cfg, 3)
  let tours2 = 0
  let a0 = 0
  for (let i = 0; i < 60 * 2; i++) {
    w2.vaisseau = { ...w2.vaisseau, x: (60 * i) / 60, y: 0, vx: 60, vy: 0 }
    avancerLeMonde(cfg, w2, 1 / 60, { x: 0, y: 0 })
    const f = w2.fleaux[0]
    const a = Math.atan2(f.y - w2.vaisseau.y, f.x - w2.vaisseau.x)
    if (i > 0) tours2 += Math.atan2(Math.sin(a - a0), Math.cos(a - a0))
    a0 = a
  }
  verifier(`le vaisseau file à 60 : la masse continue de tourner autour de lui (${(tours2 / (2 * Math.PI)).toFixed(1)} tours en 2 s)`, tours2 / (2 * Math.PI) > 1)
}
// LES PARASITES DE LA VOUIVRE (Keko, 16/11) : une larve s'accroche à un insecte et le ronge ; à sa mort, elle saute sur
// UN seul autre — le plus proche, à portée de saut — ; sans voisin, elle meurt
{
  const insecte = (id: number, x: number, y: number, pv: number) => ({ id, corps: { ...nouveauVaisseau(), x, y }, pv, fait: 'marche' as const, roche: null, forage: null, tirA: 1e9, butin: 0, cargaison: { fer: 0, or: 0, cristal: 0 }, calmeA: 1e9 })
  const parasite = { id: 'parasite', cadence: 99, degats: 0, portee: 90, vitesse: 90, vie: 0, dispersion: 0, guide: false, parasite: { max: 3, dps: 6, saut: 70, vie: 2.5, acide: { duree: 1.5, dps: 2, bonus: 0.35 } } }
  const cfg = { ...VAISSEAU, champ: { ...VAISSEAU.champ, densite: 0 }, station: { ...VAISSEAU.station, portee: -1 }, armes: [parasite], ennemi: { ...VAISSEAU.ennemi, apparait: 1e9, pv: 1000 } }
  const elever = (places: [number, number, number][], duree: number) => {
    const w = nouveauMonde(cfg, 3)
    places.forEach(([x, y, pv], k) => w.ennemis.push(insecte(k + 1, x, y, pv)))
    const ev: Evenement[] = []
    for (let i = 0; i < 60 * duree; i++) {
      for (const e of w.ennemis) {
        const [x, y] = places[e.id - 1]
        e.corps = { ...e.corps, x, y, vx: 0, vy: 0 }
      }
      w.vaisseau = { ...w.vaisseau, x: 0, y: 0, vx: 0, vy: 0 }
      ev.push(...avancerLeMonde(cfg, w, 1 / 60, { x: 0, y: 0 }).evenements)
    }
    return { w, ev, pv: [1, 2, 3].map((id) => w.ennemis.find((e) => e.id === id)?.pv) }
  }
  // (A, faible, à 40 ; B à 40 de A, C à 60 de A : la larve tue A, saute sur B — le plus proche —, jamais sur C)
  const saut = elever([[40, 0, 20], [80, 0, 1000], [40, 60, 1000]], 6)
  const surB = saut.w.parasites.some((p) => p.hote === 2 || p.cible === 2)
  verifier(`la larve s’accroche à l’insecte, le ronge et le tue ; elle saute alors sur UN seul autre, le plus proche (B : ${(1000 - (saut.pv[1] ?? 1000)).toFixed(0)} perdus) ; C n’a rien`, saut.pv[0] === undefined && saut.ev.filter((e) => e.type === 'parasiteSaute').length === 1 && surB && (saut.pv[1] ?? 1000) < 1000 && saut.pv[2] === 1000)
  // (seul : à sa mort, elle n'a nulle part où sauter — elle meurt)
  const seul = elever([[40, 0, 20], [300, 0, 1000]], 5)
  // (LE SAUT EST UN BOND — Keko, 17/11 : de 0,4 à 0,7 s, puis elle s'accroche)
  const bonds = saut.w.parasites.filter((p) => p.bond !== undefined).length
  verifier(`le saut est un bond, qui finit accroché (${bonds} encore en l'air à la fin)`, bonds === 0 && saut.w.parasites.some((p) => p.hote === 2))
  verifier('seul à portée de saut : à la mort de son hôte, la larve meurt', seul.pv[0] === undefined && seul.ev.some((e) => e.type === 'parasiteMort') && seul.w.parasites.length === 0 && seul.pv[1] === 1000)
}

// LE RAYON BALAYANT DE LA SALAMANDRE (Keko, 16/11 : « un rayon qui balaie et laisse une traînée de feu ») : un arc centré
// sur l'insecte le plus proche ; ce qu'il balaie prend un coup et brûle ; derrière lui, des flaques de feu
{
  const insecte = (id: number, x: number, y: number) => ({ id, corps: { ...nouveauVaisseau(), x, y }, pv: 1000, fait: 'marche' as const, roche: null, forage: null, tirA: 1e9, butin: 0, cargaison: { fer: 0, or: 0, cristal: 0 }, calmeA: 1e9 })
  const rayon = { id: 'rayon', cadence: 0.1, degats: 0, portee: 70, vitesse: 0, vie: 0, dispersion: 0, guide: false, balayage: { tous: 9, duree: 0.8, longueur: 70, degats: 9, brulure: 2, dpsBrulure: 3, depart: 0, arc: 2.4, vise: true, trainee: { pas: 0.3, distances: [0.45, 0.8], rayon: 8, duree: 2.5, dps: 5, brulure: 1.5, dpsBrulure: 3 } } }
  const cfg = { ...VAISSEAU, champ: { ...VAISSEAU.champ, densite: 0 }, station: { ...VAISSEAU.station, portee: -1 }, armes: [rayon], ennemi: { ...VAISSEAU.ennemi, apparait: 1e9, pv: 1000 } }
  const w = nouveauMonde(cfg, 3)
  const places: [number, number][] = [[30, 0], [40, 25], [-40, 0]]
  places.forEach(([x, y], k) => w.ennemis.push(insecte(k + 1, x, y)))
  const ev: Evenement[] = []
  for (let i = 0; i < 60; i++) {
    places.forEach(([x, y], k) => (w.ennemis[k].corps = { ...w.ennemis[k].corps, x, y, vx: 0, vy: 0 }))
    w.vaisseau = { ...w.vaisseau, x: 0, y: 0, vx: 0, vy: 0 }
    ev.push(...avancerLeMonde(cfg, w, 1 / 60, { x: 0, y: 0 }).evenements)
  }
  const pv = w.ennemis.map((e) => 1000 - e.pv)
  const attendues = (Math.floor(2.4 / 0.3) + 1) * 2
  verifier(`le rayon balaie un arc centré sur le plus proche : les deux insectes de devant prennent leur coup et brûlent ; celui de derrière, hors de l’arc, rien ; ${w.flaques.length} flaques de feu semées le long (${attendues} attendues)`, ev.filter((e) => e.type === 'balayage').length === 1 && pv[0] >= 9 && pv[1] >= 9 && pv[2] === 0 && w.flaques.length === attendues)
}

// … PUIS UN TRAIT AU SOL (Keko, 16/11 : « il vise un ennemi en traçant un trait qui le touche, de devant vers le fond ») :
// seul le point d'impact frappe — l'insecte visé et celui qui est sur le trait au-delà, pas celui d'à côté — ; le trait
// part en deçà de la cible et finit au-delà ; les flaques sont semées dessus
{
  const insecte = (id: number, x: number, y: number) => ({ id, corps: { ...nouveauVaisseau(), x, y }, pv: 1000, fait: 'marche' as const, roche: null, forage: null, tirA: 1e9, butin: 0, cargaison: { fer: 0, or: 0, cristal: 0 }, calmeA: 1e9 })
  const rayon = { id: 'rayon', cadence: 0.1, degats: 0, portee: 70, vitesse: 0, vie: 0, dispersion: 0, guide: false, balayage: { tous: 9, duree: 0.7, longueur: 70, degats: 12, brulure: 2, dpsBrulure: 3, depart: 0, trace: { avant: 24, apres: 24, rayon: 6 }, trainee: { pas: 5, rayon: 6, duree: 2.5, dps: 5, brulure: 1.5, dpsBrulure: 3 } } }
  const cfg = { ...VAISSEAU, champ: { ...VAISSEAU.champ, densite: 0 }, station: { ...VAISSEAU.station, portee: -1 }, armes: [rayon], ennemi: { ...VAISSEAU.ennemi, apparait: 1e9, pv: 1000 } }
  const w = nouveauMonde(cfg, 3)
  const places: [number, number][] = [[0, 30], [0, 50], [15, 30]]
  places.forEach(([x, y], k) => w.ennemis.push(insecte(k + 1, x, y)))
  const ev: Evenement[] = []
  let premier: { x: number; y: number } | null = null
  for (let i = 0; i < 50; i++) {
    places.forEach(([x, y], k) => (w.ennemis[k].corps = { ...w.ennemis[k].corps, x, y, vx: 0, vy: 0 }))
    w.vaisseau = { ...w.vaisseau, x: 0, y: 0, vx: 0, vy: 0 }
    ev.push(...avancerLeMonde(cfg, w, 1 / 60, { x: 0, y: 0 }).evenements)
    premier ??= impactDuRayon(cfg, w)
  }
  const pv = w.ennemis.map((e) => 1000 - e.pv)
  const attendues = Math.floor(48 / 5) + 1
  const surLeTrait = w.flaques.every((f) => Math.abs(f.x) < 1e-6 && f.y >= 5.9 && f.y <= 54.1)
  // (… EN TRAVERS, de gauche à droite vu du vaisseau : le même trait, tourné d'un quart de tour autour de la cible)
  {
    const rt = { ...rayon, balayage: { ...rayon.balayage, trace: { ...rayon.balayage.trace, travers: true } } }
    const cf = { ...cfg, armes: [rt] }
    const w2 = nouveauMonde(cf, 3)
    const pl: [number, number][] = [[0, 30], [-18, 30], [0, 50]]
    pl.forEach(([x, y], k) => w2.ennemis.push(insecte(k + 1, x, y)))
    const ev2: Evenement[] = []
    let debut: { x: number; y: number } | null = null
    for (let i = 0; i < 50; i++) {
      pl.forEach(([x, y], k) => (w2.ennemis[k].corps = { ...w2.ennemis[k].corps, x, y, vx: 0, vy: 0 }))
      w2.vaisseau = { ...w2.vaisseau, x: 0, y: 0, vx: 0, vy: 0 }
      ev2.push(...avancerLeMonde(cf, w2, 1 / 60, { x: 0, y: 0 }).evenements)
      debut ??= impactDuRayon(cf, w2)
    }
    const pv2 = w2.ennemis.map((e) => 1000 - e.pv)
    const travers = w2.flaques.every((f) => Math.abs(f.y - 30) < 0.5 && f.x >= -24.5 && f.x <= 24.5)
    // (une cible qui marche vers le vaisseau, en travers du trait : le trait la suit, elle prend son coup)
    const w3 = nouveauMonde(cf, 3)
    w3.ennemis.push(insecte(1, 0, 50))
    for (let i = 0; i < 50; i++) {
      w3.ennemis[0].corps = { ...w3.ennemis[0].corps, x: 0, y: 50 - (40 * i) / 60, vx: 0, vy: -40 }
      w3.vaisseau = { ...w3.vaisseau, x: 0, y: 0, vx: 0, vy: 0 }
      avancerLeMonde(cf, w3, 1 / 60, { x: 0, y: 0 })
    }
    verifier(`en travers, une cible qui marche à 40 vers le vaisseau prend quand même son coup : le trait la suit (${1000 - w3.ennemis[0].pv})`, 1000 - w3.ennemis[0].pv >= 12)
    verifier(`en travers, le trait passe sur la cible de sa gauche (x ${debut === null ? '—' : debut.x.toFixed(1)}) à sa droite : la cible et l'insecte sur le trait prennent leur coup (${pv2[0]}, ${pv2[1]}), celui de derrière rien (${pv2[2]}) ; ${w2.flaques.length} flaques en travers`, debut !== null && Math.abs(debut.x - 24) < 1.5 && Math.abs(debut.y - 30) < 0.5 && pv2[0] >= 12 && pv2[1] >= 12 && pv2[2] === 0 && w2.flaques.length === attendues && travers)
  }
  verifier(`le rayon trace un trait au sol de 6 à 54 (départ ${premier === null ? '—' : premier.y.toFixed(1)}) : la cible et l'insecte au-delà prennent leur coup (${pv[0]}, ${pv[1]}), celui d'à côté rien (${pv[2]}) ; ${w.flaques.length} flaques sur le trait (${attendues} attendues)`, ev.filter((e) => e.type === 'balayage').length === 1 && premier !== null && Math.abs(premier.y - 6) < 1.5 && pv[0] >= 12 && pv[1] >= 12 && pv[2] === 0 && w.flaques.length === attendues && surLeTrait)
}

// L'ESSAIM DE MISSILES DU PULSAR (Keko, 16/11) : six missiles à tête chercheuse partent ensemble en éventail, se
// partagent les insectes à portée et les rattrapent, même derrière le vaisseau
{
  const insecte = (id: number, x: number, y: number) => ({ id, corps: { ...nouveauVaisseau(), x, y }, pv: 1000, fait: 'marche' as const, roche: null, forage: null, tirA: 1e9, butin: 0, cargaison: { fer: 0, or: 0, cristal: 0 }, calmeA: 1e9 })
  const essaim = { id: 'essaim', cadence: 2.4, degats: 4, portee: 80, vitesse: 110, vie: 2.2, dispersion: 0, guide: false, essaim: { nombre: 6, eventail: 2.4, acces: 120, pointe: 230, braquage: 8, chaos: 2.4, pas: 0.25, calme: 1.3, reprise: 45 } }
  const cfg = { ...VAISSEAU, champ: { ...VAISSEAU.champ, densite: 0 }, station: { ...VAISSEAU.station, portee: -1 }, armes: [essaim], ennemi: { ...VAISSEAU.ennemi, apparait: 1e9, pv: 1000 } }
  const places: [number, number][] = [[50, 0], [-40, 30], [0, -70], [0, -300]]
  const voler = (verrou: number | null) => {
    const w = nouveauMonde(cfg, 3)
    places.forEach(([x, y], k) => w.ennemis.push(insecte(k + 1, x, y)))
    w.verrou = verrou
    const ev: Evenement[] = []
    let cibles: number[] = []
    // (le chemin de chaque missile, et d'où il est parti : un vol en zigzag est bien plus long que la ligne droite)
    const chemins = new Map<number, { l: number; x0: number; y0: number; x: number; y: number }>()
    for (let i = 0; i < 140; i++) {
      places.forEach(([x, y], k) => (w.ennemis[k].corps = { ...w.ennemis[k].corps, x, y, vx: 0, vy: 0 }))
      w.vaisseau = { ...w.vaisseau, x: 0, y: 0, vx: 0, vy: 0 }
      ev.push(...avancerLeMonde(cfg, w, 1 / 60, { x: 0, y: 0 }).evenements)
      if (i === 0) cibles = w.obus.map((o) => o.traque?.cible ?? -1)
      for (const o of w.obus) {
        const c = chemins.get(o.id)
        if (c === undefined) chemins.set(o.id, { l: 0, x0: o.x, y0: o.y, x: o.x, y: o.y })
        else (c.l += Math.hypot(o.x - c.x, o.y - c.y)), (c.x = o.x), (c.y = o.y)
      }
    }
    const tordu = [...chemins.values()].reduce((s, c) => s + c.l / Math.max(1, Math.hypot(c.x - c.x0, c.y - c.y0)), 0) / Math.max(1, chemins.size)
    return { w, ev, cibles, tordu, pv: w.ennemis.map((e) => 1000 - e.pv) }
  }
  const libre = voler(null)
  verifier('six missiles partent ensemble, une seule fois, distribués au hasard entre les trois insectes à portée — deux chacun — ; tous finissent par toucher (24 en tout), le lointain rien', libre.ev.filter((e) => e.type === 'essaim').length === 1 && libre.cibles.length === 6 && [1, 2, 3].every((id) => libre.cibles.filter((c) => c === id).length === 2) && libre.pv[0] + libre.pv[1] + libre.pv[2] === 24 && libre.pv[3] === 0 && libre.w.obus.length === 0)
  verifier(`leur vol est chaotique : en moyenne ${libre.tordu.toFixed(2)} fois plus long que la ligne droite (plus de 1,5)`, libre.tordu > 1.5)
  const verrouille = voler(2)
  verifier('un insecte verrouillé : les six missiles vont tous sur lui', verrouille.cibles.length === 6 && verrouille.cibles.every((id) => id === 2) && verrouille.pv[1] >= 16)
  // (sa cible morte, un missile ne reprend qu'un insecte proche de LUI — à moins de 45 —, sinon il s'éteint)
  const w = nouveauMonde(cfg, 3)
  const pres: [number, number][] = [[50, 0], [62, 30], [50, -95]]
  pres.forEach(([x, y], k) => w.ennemis.push({ ...insecte(k + 1, x, y), pv: k === 0 ? 4 : 1000 }))
  w.verrou = 1
  for (let i = 0; i < 140; i++) {
    for (const e of w.ennemis) {
      const [x, y] = pres[e.id - 1]
      e.corps = { ...e.corps, x, y, vx: 0, vy: 0 }
    }
    w.vaisseau = { ...w.vaisseau, x: 0, y: 0, vx: 0, vy: 0 }
    avancerLeMonde(cfg, w, 1 / 60, { x: 0, y: 0 })
  }
  const voisin = w.ennemis.find((e) => e.id === 2)
  const lointain = w.ennemis.find((e) => e.id === 3)
  verifier('la cible verrouillée meurt au premier coup : les autres missiles reprennent la voisine (à 32 d’elle), jamais la lointaine (à 95)', w.ennemis.every((e) => e.id !== 1) && voisin !== undefined && voisin.pv < 1000 && lointain !== undefined && lointain.pv === 1000 && w.obus.length === 0)
}


// LES CRISTAUX DU PRISME (Keko, 16/11) : les balises, qui IRRADIENT au lieu de frapper — l'insecte qui traverse le
// faisceau perd 20 par seconde tant qu'il y est, et rien une fois sorti (Keko, 16/11 : pas de dégâts sur la durée)
{
  const insecte = (id: number, x: number, y: number) => ({ id, corps: { ...nouveauVaisseau(), x, y }, pv: 1000, fait: 'marche' as const, roche: null, forage: null, tirA: 1e9, butin: 0, cargaison: { fer: 0, or: 0, cristal: 0 }, calmeA: 1e9 })
  const cristal = { id: 'cristal', cadence: 0.7, degats: 0, portee: 90, vitesse: 0, vie: 0, dispersion: 0, guide: false, balise: { tous: 1e9, ecart: 40, max: 6, duree: 35, garde: 3, periode: 0.5, irradie: { dps: 20 } } }
  const cfg = { ...VAISSEAU, champ: { ...VAISSEAU.champ, densite: 0 }, station: { ...VAISSEAU.station, portee: -1 }, armes: [cristal], ennemi: { ...VAISSEAU.ennemi, apparait: 1e9, pv: 1000 } }
  const w = nouveauMonde(cfg, 3)
  w.armesA[0] = 1e9
  w.balises.push({ id: 900, x: -30, y: 100, nee: 0, arme: 0, rang: 0, trio: 900, liens: [] }, { id: 901, x: 30, y: 100, nee: 0, arme: 0, rang: 1, trio: 900, liens: [{ vers: 900, sur: [], dechargeA: 0 }] })
  w.ennemis.push(insecte(1, 0, 100))
  const ev: Evenement[] = []
  const tenir = (x: number, y: number) => {
    w.ennemis[0].corps = { ...w.ennemis[0].corps, x, y, vx: 0, vy: 0 }
    w.vaisseau = { ...w.vaisseau, x: 0, y: 0, vx: 0, vy: 0 }
    ev.push(...avancerLeMonde(cfg, w, 1 / 60, { x: 0, y: 0 }).evenements)
  }
  for (let i = 0; i < 60; i++) tenir(0, 100)
  const dessus = 1000 - w.ennemis[0].pv
  for (let i = 0; i < 60 * 2; i++) tenir(0, 140)
  const apres = 1000 - w.ennemis[0].pv
  verifier(`un insecte sur le faisceau de deux cristaux : il s'allume, 20 par seconde tant qu'il y est (${dessus.toFixed(1)} en 1 s) ; sorti, plus rien (${(apres - dessus).toFixed(2)} en 2 s)`, ev.some((e) => e.type === 'ligne' && e.arme === 'cristal') && Math.abs(dessus - 20) < 0.5 && apres - dessus < 1e-9)
}

// (le cristal est déposé DEVANT, depuis le cristal de la proue : à `devant` du vaisseau, dans l'axe de son nez)
{
  const cristal = { id: 'cristal', cadence: 0.7, degats: 0, portee: 90, vitesse: 0, vie: 0, dispersion: 0, guide: false, balise: { tous: 1.5, ecart: 40, max: 6, duree: 35, garde: 3, periode: 0.5, irradie: { dps: 20 }, devant: 10 } }
  const cfg = { ...VAISSEAU, champ: { ...VAISSEAU.champ, densite: 0 }, station: { ...VAISSEAU.station, portee: -1 }, armes: [cristal], ennemi: { ...VAISSEAU.ennemi, apparait: 1e9 } }
  const w = nouveauMonde(cfg, 3)
  w.vaisseau = { ...w.vaisseau, x: 0, y: 0, vx: 0, vy: 0, cap: Math.PI / 2 }
  avancerLeMonde(cfg, w, 1 / 60, { x: 0, y: 0 })
  const b = w.balises[0]
  const v = w.vaisseau
  verifier(`le cristal est déposé devant le vaisseau, à 10 dans l'axe de son nez (${b === undefined ? '—' : Math.hypot(b.x - v.x, b.y - v.y).toFixed(1)})`, b !== undefined && Math.abs(b.x - (v.x + Math.cos(v.cap) * 10)) < 1 && Math.abs(b.y - (v.y + Math.sin(v.cap) * 10)) < 1)
}

// LE PUITS DU PULSAR (Keko, 16/11) : lancé au cœur de la nuée, il s'ouvre, aspire vers son centre ce qui est dans son
// rayon, puis éclate sur ce qui est près du centre — l'insecte du bord, aspiré, est pris dans l'éclat ; le lointain, rien
{
  const insecte = (id: number, x: number, y: number) => ({ id, corps: { ...nouveauVaisseau(), x, y }, pv: 1000, fait: 'marche' as const, roche: null, forage: null, tirA: 1e9, butin: 0, cargaison: { fer: 0, or: 0, cristal: 0 }, calmeA: 1e9 })
  const puits = { id: 'puits', cadence: 99, degats: 22, portee: 130, vitesse: 0, vie: 0, dispersion: 0, guide: false, puits: { vitesse: 150, rayon: 45, force: 70, duree: 2, eclat: 28 } }
  const cfg = { ...VAISSEAU, champ: { ...VAISSEAU.champ, densite: 0 }, station: { ...VAISSEAU.station, portee: -1 }, armes: [puits], ennemi: { ...VAISSEAU.ennemi, apparait: 1e9, pv: 1000, vitesseMax: 0, poussee: 0 } }
  const w = nouveauMonde(cfg, 3)
  const places: [number, number][] = [[80, 0], [80, 12], [92, -8], [0, -70], [80, 40], [80, 100]]
  places.forEach(([x, y], k) => w.ennemis.push(insecte(k + 1, x, y)))
  const ev: Evenement[] = []
  let ouvertEn: { x: number; y: number } | null = null
  for (let i = 0; i < 60 * 3.5; i++) {
    w.vaisseau = { ...w.vaisseau, x: 0, y: 0, vx: 0, vy: 0, cap: 0 }
    for (const e of avancerLeMonde(cfg, w, 1 / 60, { x: 0, y: 0 }).evenements) {
      ev.push(e)
      if (e.type === 'puitsOuvert') ouvertEn = { x: e.x, y: e.y }
    }
  }
  const pv = w.ennemis.map((e) => 1000 - e.pv)
  verifier(`le puits s'ouvre au cœur de la nuée (${ouvertEn === null ? '—' : `${ouvertEn.x.toFixed(0)}, ${ouvertEn.y.toFixed(0)}`}), aspire l'insecte du bord dans son éclat et éclate une fois : ${pv.join(' / ')} (22 aux quatre de la nuée, 0 au lointain et à celui hors du rayon)`, ev.filter((e) => e.type === 'puitsEclate').length === 1 && ouvertEn !== null && ouvertEn.x > 70 && pv[0] === 22 && pv[1] === 22 && pv[2] === 22 && pv[3] === 0 && pv[4] === 22 && pv[5] === 0)
}

// LE DRAIN D'ÂME DU NÉANT (Keko, 17/11) : il ACCROCHE TOUT CE QUI PASSE À PORTÉE, sans limite — le lointain, rien — ; puis
// LE LIEN TIENT À TOUTE DISTANCE (le vaisseau part à 300, elles se vident encore) ; un insecte qui entre ensuite dans la
// zone est accroché à son tour. La vie prise purge la corruption, en continu (trois âmes une seconde : 12 points pris, 2,4
// de corruption purgée — un insecte abattu n'en purge que 0,5)
{
  const insecte = (id: number, x: number, y: number) => ({ id, corps: { ...nouveauVaisseau(), x, y }, pv: 1000, fait: 'marche' as const, roche: null, forage: null, tirA: 1e9, butin: 0, cargaison: { fer: 0, or: 0, cristal: 0 }, calmeA: 1e9 })
  const drain = { id: 'drain', cadence: 0.1, degats: 0, portee: 42, vitesse: 0, vie: 0, dispersion: 0, guide: false, drain: { rayon: 42, dps: 4 } }
  const cfg = { ...VAISSEAU, champ: { ...VAISSEAU.champ, densite: 0 }, station: { ...VAISSEAU.station, portee: -1 }, armes: [drain], coque: 10, corruption: { ronge: 0.5, purge: 0.5 }, ennemi: { ...VAISSEAU.ennemi, apparait: 1e9, pv: 1000, vitesseMax: 0, poussee: 0 } }
  const w = nouveauMonde(cfg, 3)
  w.ennemis.push(insecte(1, 30, 0), insecte(2, 0, -35), insecte(3, -38, 0), insecte(4, 120, 0))
  w.corruption = 5
  const pas = (x: number, n: number): void => {
    for (let i = 0; i < n; i++) {
      w.vaisseau = { ...w.vaisseau, x, y: 0, vx: 0, vy: 0, cap: 0 }
      avancerLeMonde(cfg, w, 1 / 60, { x: 0, y: 0 })
    }
  }
  pas(0, 60)
  const pv1 = w.ennemis.map((e) => 1000 - e.pv)
  const purgee = 5 - w.corruption - 0.5
  // (… LA VIE PRISE NE PURGE PLUS — Keko, 19/11 : seule la corruption qui ronge, 0,5 en une seconde, s'en va)
  verifier(`l'intrication accroche tout ce qui est à portée (${pv1.map((x) => x.toFixed(1)).join(' / ')} : 4, 4, 4, 0 au lointain) et ne purge plus la corruption (${purgee.toFixed(2)} purgé)`, Math.abs(pv1[0] - 4) < 0.1 && Math.abs(pv1[1] - 4) < 0.1 && Math.abs(pv1[2] - 4) < 0.1 && pv1[3] === 0 && Math.abs(purgee) < 0.05)
  // (le vaisseau part loin, à 300 : les liens tiennent)
  pas(300, 60)
  const pv2 = w.ennemis.map((e) => 1000 - e.pv)
  verifier(`à 300 du vaisseau, les âmes accrochées se vident encore (${pv2.map((x) => x.toFixed(1)).join(' / ')} : 8, 8, 8, 0)`, Math.abs(pv2[0] - 8) < 0.1 && Math.abs(pv2[1] - 8) < 0.1 && Math.abs(pv2[2] - 8) < 0.1 && pv2[3] === 0)
  // (il passe près du lointain : accroché à son tour)
  pas(110, 30)
  verifier(`le lointain, une fois passé à portée, est accroché à son tour (${(1000 - w.ennemis[3].pv).toFixed(1)} pris, ${w.liens.length} liens)`, w.ennemis[3].pv < 1000 && w.liens.length === 4)
}

// LES VRILLES D'OMBRE DU NÉANT (Keko, 17/11) : elles sortent en des points tirés autour du vaisseau, entre 18 et 40, trois
// à la fois au plus ; ELLES SAISISSENT : un petit insecte tenu ne bouge plus et perd 8 par seconde ; UN GRAND avance encore,
// et quand il sort de l'allonge de sa vrille, il s'arrache — 12 d'un coup — et elle le lâche
{
  const insecte = (id: number, x: number, y: number) => ({ id, corps: { ...nouveauVaisseau(), x, y }, pv: 1000, fait: 'marche' as const, roche: null, forage: null, tirA: 1e9, butin: 0, cargaison: { fer: 0, or: 0, cristal: 0 }, calmeA: 1e9 })
  const vrilles = { id: 'vrille', cadence: 1.2, degats: 0, portee: 70, vitesse: 0, vie: 0, dispersion: 0, guide: false, vrille: { max: 3, duree: 6, pres: 18, loin: 40, allonge: 30, sortie: 0.35, dps: 8, periode: 0.5, arrache: 12 } }
  const cfg = { ...VAISSEAU, champ: { ...VAISSEAU.champ, densite: 0 }, station: { ...VAISSEAU.station, portee: -1 }, armes: [vrilles], ennemi: { ...VAISSEAU.ennemi, apparait: 1e9, pv: 1000, vitesseMax: 0, poussee: 0 } }
  const w = nouveauMonde(cfg, 3)
  for (let k = 0; k < 8; k++) w.ennemis.push(insecte(k + 1, Math.cos((k * Math.PI) / 4) * 30, Math.sin((k * Math.PI) / 4) * 30))
  const ev: Evenement[] = []
  let auPlus = 0
  let distancesOk = true
  for (let i = 0; i < 60 * 8; i++) {
    w.vaisseau = { ...w.vaisseau, x: 0, y: 0, vx: 0, vy: 0, cap: 0 }
    for (const e of avancerLeMonde(cfg, w, 1 / 60, { x: 0, y: 0 }).evenements) {
      ev.push(e)
      if (e.type === 'vrille' && (Math.hypot(e.x, e.y) < 18 - 1e-6 || Math.hypot(e.x, e.y) > 40 + 1e-6)) distancesOk = false
    }
    auPlus = Math.max(auPlus, w.vrilles.length)
  }
  const sorties = ev.filter((e) => e.type === 'vrille')
  const angles = new Set(sorties.map((e) => (e.type === 'vrille' ? Math.round(Math.atan2(e.y, e.x) * 2) : 0)))
  verifier(`les vrilles sortent autour du vaisseau, entre 18 et 40, en des points variés (${angles.size} directions sur ${sorties.length} sorties), trois à la fois au plus (${auPlus}), et saisissent`, distancesOk && sorties.length >= 5 && angles.size >= 3 && auPlus === 3 && ev.some((e) => e.type === 'saisie') && ev.some((e) => e.type === 'vrilleFinie'))
  // (un petit qui marche vers le portail, saisi : il ne bouge plus ; un grand, saisi, avance et s'arrache)
  const tenir = (grand: boolean) => {
    const c2 = { ...cfg, armes: [{ ...vrilles, cadence: 99 }], ennemi: { ...VAISSEAU.ennemi, apparait: 1e9, pv: 1000 } }
    const m2 = nouveauMonde(c2, 3)
    m2.vaisseau = { ...m2.vaisseau, x: 300, y: 0 }
    const e = { ...insecte(1, 310, 0), ...(grand ? { grand: true } : {}) }
    m2.ennemis.push(e)
    m2.vrilles.push({ id: 99, arme: 0, x: 310, y: 0, nee: 0, libreA: 0, cible: null, saisieA: -1, signaleA: -1 })
    m2.armesA[0] = 1e9
    const evs: Evenement[] = []
    let x1 = 0
    for (let i = 0; i < 60 * 3; i++) {
      m2.vaisseau = { ...m2.vaisseau, x: 300, y: 0, vx: 0, vy: 0 }
      evs.push(...avancerLeMonde(c2, m2, 1 / 60, { x: 0, y: 0 }).evenements)
      if (i === 60) x1 = m2.ennemis[0]?.corps.x ?? 0
    }
    return { evs, x1, x3: m2.ennemis[0]?.corps.x ?? 0, pv: 1000 - (m2.ennemis[0]?.pv ?? 0) }
  }
  const petit = tenir(false)
  const grand = tenir(true)
  verifier(`un petit saisi ne bouge plus (${petit.x1.toFixed(1)} puis ${petit.x3.toFixed(1)}) et perd 8 par seconde (${petit.pv.toFixed(1)} en 3 s)`, Math.abs(petit.x3 - petit.x1) < 0.5 && Math.abs(petit.pv - 24) < 0.6 && !petit.evs.some((e) => e.type === 'arrache'))
  verifier(`un grand saisi avance encore (${grand.x1.toFixed(1)} puis ${grand.x3.toFixed(1)}) ; sorti de l'allonge, il s'arrache une fois, 12 d'un coup (${grand.evs.filter((e) => e.type === 'arrache').length} arrachement)`, Math.abs(grand.x3 - grand.x1) > 20 && grand.evs.filter((e) => e.type === 'arrache').length === 1)
}

// LA NOVA DE GIVRE DU FRIMAS (Keko, 17/11) : un insecte à portée, l'onde part — 8 points et gelé à tout ce qui est à moins
// de 38, rien au lointain — et laisse UNE plaque de verglas, grande (22), sous le vaisseau ; pas de traînée derrière lui
{
  const insecte = (id: number, x: number, y: number) => ({ id, corps: { ...nouveauVaisseau(), x, y }, pv: 1000, fait: 'marche' as const, roche: null, forage: null, tirA: 1e9, butin: 0, cargaison: { fer: 0, or: 0, cristal: 0 }, calmeA: 1e9 })
  const nova = { id: 'nova', cadence: 3, degats: 8, portee: 38, vitesse: 0, vie: 0, dispersion: 0, guide: false, nova: { rayon: 38, gel: { duree: 2, ralenti: 0.3 }, plaque: { rayon: 22, duree: 4, dps: 4, ralenti: 0.45 } } }
  const cfg = { ...VAISSEAU, champ: { ...VAISSEAU.champ, densite: 0 }, station: { ...VAISSEAU.station, portee: -1 }, armes: [nova], ennemi: { ...VAISSEAU.ennemi, apparait: 1e9, pv: 1000, vitesseMax: 0, poussee: 0 } }
  const w = nouveauMonde(cfg, 3)
  w.ennemis.push(insecte(1, 30, 0), insecte(2, 0, -60), insecte(3, 200, 0))
  const ev: Evenement[] = []
  for (let i = 0; i < 30; i++) {
    w.vaisseau = { ...w.vaisseau, x: (i * 2), y: 0, vx: 120, vy: 0, cap: 0 }
    ev.push(...avancerLeMonde(cfg, w, 1 / 60, { x: 0, y: 0 }).evenements)
  }
  const pv = w.ennemis.map((e) => 1000 - e.pv)
  verifier(`la nova frappe et gèle ce qui est autour (${pv[0].toFixed(1)} au proche, gelé : ${(w.ennemis[0].geleA ?? 0) > w.t}), rien au lointain, une seule plaque de verglas de 22 (${w.givres.map((g) => g.rayon).join(', ')})`, ev.filter((e) => e.type === 'nova').length === 1 && pv[0] >= 8 && (w.ennemis[0].geleA ?? 0) > w.t && pv[1] === 0 && pv[2] === 0 && w.givres.length === 1 && w.givres[0].rayon === 22 && w.givres[0].verglas === true)
}

// LA TRAÎNÉE DE POISON DU VER (Keko, 17/11) : semée derrière lui comme le givre, elle empoisonne — 7 par seconde — SANS
// geler ni ralentir
{
  const insecte = (id: number, x: number, y: number) => ({ id, corps: { ...nouveauVaisseau(), x, y }, pv: 1000, fait: 'marche' as const, roche: null, forage: null, tirA: 1e9, butin: 0, cargaison: { fer: 0, or: 0, cristal: 0 }, calmeA: 1e9 })
  const poison = { id: 'poison', cadence: 0.1, degats: 0, portee: 0, vitesse: 0, vie: 0, dispersion: 0, guide: false, givre: { ecart: 5, rayon: 8, duree: 4, dps: 7, ralenti: 1, poison: true } }
  const cfg = { ...VAISSEAU, champ: { ...VAISSEAU.champ, densite: 0 }, station: { ...VAISSEAU.station, portee: -1 }, armes: [poison], ennemi: { ...VAISSEAU.ennemi, apparait: 1e9, pv: 1000, vitesseMax: 0, poussee: 0 } }
  const w = nouveauMonde(cfg, 3)
  w.ennemis.push(insecte(1, -10, 0))
  const ev: Evenement[] = []
  for (let i = 0; i < 60; i++) {
    w.vaisseau = { ...w.vaisseau, x: 0, y: 0, vx: 0, vy: 0, cap: 0 }
    ev.push(...avancerLeMonde(cfg, w, 1 / 60, { x: 0, y: 0 }).evenements)
  }
  // (immobile, il sème sa plaque sous lui : l'insecte à 10 y est, son rayon compris)
  const pris = 1000 - w.ennemis[0].pv
  verifier(`la traînée de poison empoisonne (${pris.toFixed(1)} en 1 s) sans geler (${ev.some((e) => e.type === 'gele') ? 'gelé' : 'pas de gel'})`, Math.abs(pris - 7) < 0.3 && !ev.some((e) => e.type === 'gele') && (w.ennemis[0].geleA ?? -1) < w.t && w.givres.every((g) => g.poison === true))
}

// LES ŒUFS DU VER (Keko, 18/11 : « il s'ouvre automatiquement après un délai ; il libère trois mini-vers qui poursuivent
// les ennemis et les mordent ») : immobile, il ne pond pas ; en mouvement il pond, deux à la fois au plus ; SANS INSECTE,
// L'ŒUF ÉCLOT QUAND MÊME à son heure, trois mini-vers en sortent ; ils poursuivent l'insecte, le rattrapent et le mordent
{
  const insecte = (id: number, x: number, y: number) => ({ id, corps: { ...nouveauVaisseau(), x, y }, pv: 1000, fait: 'marche' as const, roche: null, forage: null, tirA: 1e9, butin: 0, cargaison: { fer: 0, or: 0, cristal: 0 }, calmeA: 1e9 })
  const oeufs = { id: 'oeufs', cadence: 3, degats: 0, portee: 0, vitesse: 0, vie: 0, dispersion: 0, guide: false, ponte: { tous: 3, max: 2, eclosion: 2, nombre: 3, duree: 5, vitesse: 70, virage: 6, vue: 90, morsure: 2, cadence: 0.6 } }
  const cfg = { ...VAISSEAU, champ: { ...VAISSEAU.champ, densite: 0 }, station: { ...VAISSEAU.station, portee: -1 }, armes: [oeufs], ennemi: { ...VAISSEAU.ennemi, apparait: 1e9, pv: 1000, vitesseMax: 0, poussee: 0 } }
  const w = nouveauMonde(cfg, 3)
  for (let i = 0; i < 60; i++) {
    w.vaisseau = { ...w.vaisseau, x: 0, y: 0, vx: 0, vy: 0, cap: 0 }
    avancerLeMonde(cfg, w, 1 / 60, { x: 0, y: 0 })
  }
  const immobile = w.oeufs.length
  // (il file vers la droite, aucun insecte : 1,5 s — un œuf pondu, pas encore éclos)
  const ev: Evenement[] = []
  let x = 0
  const filer = (n: number): void => {
    for (let i = 0; i < n; i++) {
      x += 30 / 60
      w.vaisseau = { ...w.vaisseau, x, y: 0, vx: 30, vy: 0, cap: 0 }
      ev.push(...avancerLeMonde(cfg, w, 1 / 60, { x: 0, y: 0 }).evenements)
    }
  }
  filer(90)
  const avant = { oeufs: w.oeufs.length, vers: w.miniVers.length }
  filer(45)
  verifier(`immobile, il ne pond pas (${immobile}) ; il pond, et sans insecte l'œuf éclot à son heure : ${avant.oeufs} œuf et ${avant.vers} mini-ver à 1,5 s, puis ${w.miniVers.length} mini-vers`, immobile === 0 && avant.oeufs === 1 && avant.vers === 0 && w.miniVers.length === 3 && ev.some((e) => e.type === 'eclosion'))
  // (un insecte à 40 de l'œuf qui éclot : les trois mini-vers le rattrapent et le mordent ; au bout de leur vie, ils se dissolvent)
  const w2 = nouveauMonde(cfg, 3)
  w2.armesA[0] = 1e9
  w2.oeufs.push({ id: 77, arme: 0, x: 0, y: 0, cap: 0, pondu: -2 })
  w2.ennemis.push(insecte(1, 40, 0))
  const ev2: Evenement[] = []
  const pas = (n: number): void => {
    for (let i = 0; i < n; i++) {
      w2.vaisseau = { ...w2.vaisseau, x: 2000, y: 0, vx: 0, vy: 0, cap: 0 }
      ev2.push(...avancerLeMonde(cfg, w2, 1 / 60, { x: 0, y: 0 }).evenements)
    }
  }
  pas(60 * 3)
  const mordu = 1000 - (w2.ennemis.find((e) => e.id === 1)?.pv ?? 1000)
  pas(60 * 2 + 5)
  verifier(`les trois mini-vers le poursuivent et le mordent (${mordu} pris en 3 s), puis se dissolvent (${w2.miniVers.length} restent)`, mordu >= 12 && ev2.some((e) => e.type === 'morsureMiniVer') && w2.miniVers.length === 0 && ev2.filter((e) => e.type === 'miniVerFini').length === 3)
}

// L'ÉPINE D'OS DU VER (Keko, 18/11 : « un projectile assez important qui traverse tout » ; « qu'il traverse les ennemis
// sans les repousser ») : elle part sur l'insecte, TRAVERSE toute la file — chacun prend le coup, une fois —, un faible
// meurt au passage, et personne ne bouge ; au bout de sa course, elle disparaît
{
  const insecte = (id: number, x: number, y: number, pv = 1000) => ({ id, corps: { ...nouveauVaisseau(), x, y }, pv, fait: 'marche' as const, roche: null, forage: null, tirA: 1e9, butin: 0, cargaison: { fer: 0, or: 0, cristal: 0 }, calmeA: 1e9 })
  const epine = { id: 'epine', cadence: 2.2, degats: 16, portee: 90, vitesse: 150, vie: 0.7, dispersion: 0, guide: false, epines: { largeur: 3 } }
  const cfg = { ...VAISSEAU, champ: { ...VAISSEAU.champ, densite: 0 }, station: { ...VAISSEAU.station, portee: -1 }, armes: [epine], ennemi: { ...VAISSEAU.ennemi, apparait: 1e9, pv: 1000, vitesseMax: 0, poussee: 0 } }
  const w = nouveauMonde(cfg, 3)
  w.vaisseau = { ...w.vaisseau, x: 0, y: 0, vx: 0, vy: 0, cap: 0 }
  w.ennemis.push(insecte(1, 30, 0), insecte(2, 40, 0), insecte(3, 50, 0, 5), { ...insecte(4, 60, 0), grand: true }, insecte(5, 40, 30))
  const ev: Evenement[] = []
  for (let i = 0; i < 30; i++) ev.push(...avancerLeMonde(cfg, w, 1 / 60, { x: 0, y: 0 }).evenements)
  const de = (id: number) => w.ennemis.find((e) => e.id === id)
  verifier(`l'épine part sur le plus proche : ${w.brochettes.length} en vol`, w.brochettes.length === 1 && ev.some((e) => e.type === 'epines'))
  verifier(`elle traverse la file : ${[1, 2, 4].map((id) => 1000 - (de(id)?.pv ?? 0)).join(', ')} points, le faible mort (${de(3) === undefined}), le voisin hors ligne intact`, [1, 2, 4].every((id) => de(id)?.pv === 984) && de(3) === undefined && de(5)?.pv === 1000 && ev.filter((e) => e.type === 'transperce').length === 4)
  verifier(`personne n'est repoussé (${[1, 2, 4].map((id) => de(id)!.corps.x).join(', ')})`, de(1)!.corps.x === 30 && de(2)!.corps.x === 40 && de(4)!.corps.x === 60)
  for (let i = 0; i < 20; i++) ev.push(...avancerLeMonde(cfg, w, 1 / 60, { x: 0, y: 0 }).evenements)
  verifier(`au bout de sa course, elle disparaît`, w.brochettes.length === 0 && ev.some((e) => e.type === 'epineFinie'))
}

// L'HYPERCUBE DU TESSERACT (Keko, 18/11 : « lancé en cloche, il rebondit trois fois ; à chaque rebond, une petite zone
// de dégâts » ; « plus il rebondit, plus il grossit » ; « chaque lancer et chaque rebond font la même taille ; il tire dès
// qu'un ennemi est à portée du troisième rebond ») : le lancer et les rebonds font 50 chacun — contacts à 50, 100, 150 —,
// chaque contact frappe sa zone, de plus en plus large (12, 15,6, 20,3) ; au troisième, il s'éteint
{
  const insecte = (id: number, x: number, y: number) => ({ id, corps: { ...nouveauVaisseau(), x, y }, pv: 1000, fait: 'marche' as const, roche: null, forage: null, tirA: 1e9, butin: 0, cargaison: { fer: 0, or: 0, cristal: 0 }, calmeA: 1e9 })
  const hypercube = { id: 'hypercube', cadence: 1.6, degats: 8, portee: 150, vitesse: 0, vie: 0, dispersion: 0, guide: false, hypercube: { rebonds: 3, rayon: 12, vol: 0.5, bond: 50, croissance: 1.3 } }
  const cfg = { ...VAISSEAU, champ: { ...VAISSEAU.champ, densite: 0 }, station: { ...VAISSEAU.station, portee: -1 }, armes: [hypercube], ennemi: { ...VAISSEAU.ennemi, apparait: 1e9, pv: 1000, vitesseMax: 0, poussee: 0 } }
  const lancer = (insectes: ReturnType<typeof insecte>[]) => {
    const w = nouveauMonde(cfg, 3)
    w.ennemis.push(...insectes)
    const ev: Evenement[] = []
    for (let i = 0; i < 92; i++) {
      w.vaisseau = { ...w.vaisseau, x: 0, y: 0, vx: 0, vy: 0, cap: 0 }
      ev.push(...avancerLeMonde(cfg, w, 1 / 60, { x: 0, y: 0 }).evenements)
    }
    const pv = insectes.map((e) => 1000 - (w.ennemis.find((o) => o.id === e.id)?.pv ?? 1000))
    const contacts = ev.flatMap((e) => (e.type === 'rebondHypercube' ? [`${e.x.toFixed(0)}`] : []))
    const rayons = ev.flatMap((e) => (e.type === 'rebondHypercube' ? [e.rayon.toFixed(1)] : []))
    return { w, ev, pv, contacts, rayons }
  }
  // (un insecte sur chaque contact : à 50, 100, 150 ; un à côté du premier contact, hors de sa zone)
  const a = lancer([insecte(2, 50, 0), insecte(3, 100, 0), insecte(4, 150, 0), insecte(5, 50, -30)])
  verifier(`l'hypercube part une fois, touche le sol trois fois à intervalles égaux (à ${a.contacts.join(', ')}), de plus en plus large (${a.rayons.join(', ')}), et s'éteint`, a.ev.filter((e) => e.type === 'hypercube').length === 1 && a.contacts.join() === '50,100,150' && a.rayons.join() === '12.0,15.6,20.3' && a.ev.some((e) => e.type === 'hypercubeFini') && a.w.hypercubes.length === 0)
  verifier(`chaque contact frappe sa zone : ${a.pv.join(' / ')} (8 sur chaque contact ; rien à côté du premier)`, a.pv.join() === '8,8,8,0')
  // (… PLUS PRÈS QU'UN LANCER, IL LUI TOMBE DESSUS — Keko, 18/11 : un insecte collé à 20 ; les rebonds gardent leurs 50)
  const p2 = lancer([insecte(1, 20, 0), insecte(2, 70, 0), insecte(3, 120, 0)])
  verifier(`un insecte à 20, plus près qu'un lancer : le cube lui tombe dessus, puis rebondit de 50 (${p2.contacts.join(', ')}) — ${p2.pv.join(' / ')}`, p2.contacts.join() === '20,70,120' && p2.pv.join() === '8,8,8')
  const b = lancer([insecte(1, 145, 0)])
  verifier(`un insecte seul à 145, à portée du troisième contact : le lancer raccourcit pour que le troisième tombe sur lui (${b.contacts.join(', ')}) — ${b.pv[0]}`, b.contacts.join() === '45,95,145' && b.pv[0] === 8)
  // (… ET PLUS DE TROU ENTRE DEUX CONTACTS — Keko, 18/11 : « parfois je manque la cible » : à 70, il tombait entre la zone
  // du premier contact, à 50, et celle du deuxième, à 100)
  const t2 = lancer([insecte(1, 70, 0)])
  verifier(`un insecte seul à 70, entre deux contacts : le deuxième tombe sur lui (${t2.contacts.join(', ')}) — ${t2.pv[0]}`, t2.contacts.join() === '20,70,120' && t2.pv[0] === 8)
  // (DES INSECTES QUI CHARGENT, à leur vraie conduite — les insectes du vortex, le vaisseau loin du portail, une seconde
  // d'élan avant le lancer. EN LIGNE DROITE, Keko, 18/11 : le lancer vise là où chacun sera au contact qui peut
  // l'atteindre — un insecte qui chasse le vaisseau fonce vers lui, `ouSeraLInsecte` ; un par contact, et à chaque fois
  // le contact visé le frappe)
  for (const loin of [75, 125, 175]) {
    const cfg2 = { ...cfg, invasion: { ...VAISSEAU.invasion, active: true, premiere: 1e9 }, ennemi: { ...VAISSEAU.ennemi, apparait: 1e9, pv: 1000, poussee: 90, vitesseMax: 40, rotation: 6, rayon: 5 } }
    const w = nouveauMonde(cfg2, 3)
    w.ennemis.push({ ...insecte(1, 300 + loin * Math.cos(1), loin * Math.sin(1)), calmeA: undefined })
    w.armesA = [1]
    const ev: Evenement[] = []
    let vise = 0
    let frappe = false
    const caps: number[] = []
    for (let i = 0; i < 160; i++) {
      w.vaisseau = { ...w.vaisseau, x: 300, y: 0, vx: 0, vy: 0, cap: 0 }
      const avant = w.ennemis[0]?.pv ?? 0
      for (const e of avancerLeMonde(cfg2, w, 1 / 60, { x: 0, y: 0 }).evenements) {
        ev.push(e)
        if (e.type === 'hypercube' && vise === 0) vise = w.hypercubes[0].vise
        if (e.type === 'rebondHypercube' && caps.length < 3) caps.push(Math.atan2(e.y, e.x - 300))
        if (e.type === 'rebondHypercube' && e.contact === vise && (w.ennemis[0]?.pv ?? 0) < avant) frappe = true
      }
    }
    verifier(`un insecte qui charge depuis ${loin} : le contact ${vise} le frappe (${frappe}), en ligne droite (caps ${caps.map((a) => a.toFixed(3)).join(', ')})`, vise > 0 && frappe && caps.length === 3 && Math.abs(caps[0] - caps[2]) < 1e-6 && Math.abs(caps[1] - caps[2]) < 1e-6)
  }
  const c2 = lancer([insecte(1, 160, 0)])
  verifier(`à 160, au-delà de son troisième rebond (150) : rien ne part`, c2.ev.every((e) => e.type !== 'hypercube'))
}

// LE DÉ DU DESTIN DU TESSERACT (Keko, 18/11 : « un dé de 1 à 6 qui tourne, puis s'abat sur un ennemi, dans une zone
// d'effet ; des dégâts plus ou moins importants en fonction du chiffre ») : il paraît au-dessus de l'insecte le plus
// proche, le suit, roule 0,9 s, tombe en 0,3 s ; tout insecte dans sa zone perd 4 × le chiffre, rien au-delà ; (… ET LA
// ZONE SUIT LE CHIFFRE — Keko, 18/11 : 22 sur un 4, 4 de plus ou de moins par point, de 10 à 30)
{
  const insecte = (id: number, x: number, y: number) => ({ id, corps: { ...nouveauVaisseau(), x, y }, pv: 1000, fait: 'marche' as const, roche: null, forage: null, tirA: 1e9, butin: 0, cargaison: { fer: 0, or: 0, cristal: 0 }, calmeA: 1e9 })
  const de = { id: 'de', cadence: 99, degats: 4, portee: 120, vitesse: 0, vie: 0, dispersion: 0, guide: false, de: { roule: 0.9, chute: 0.3, rayon: 22, pas: 4 } }
  const cfg = { ...VAISSEAU, champ: { ...VAISSEAU.champ, densite: 0 }, station: { ...VAISSEAU.station, portee: -1 }, armes: [de], ennemi: { ...VAISSEAU.ennemi, apparait: 1e9, pv: 1000, vitesseMax: 0, poussee: 0 } }
  const lancer = (graine: number, insectes: ReturnType<typeof insecte>[], file = 0) => {
    const w = nouveauMonde(cfg, graine)
    w.ennemis.push(...insectes)
    const ev: Evenement[] = []
    let ouEtait = 0
    for (let i = 0; i < 80; i++) {
      w.vaisseau = { ...w.vaisseau, x: 0, y: 0, vx: 0, vy: 0, cap: 0 }
      for (const e of w.ennemis) if (e.id !== 3) e.corps = { ...e.corps, y: e.corps.y + file / 60 }
      for (const e of avancerLeMonde(cfg, w, 1 / 60, { x: 0, y: 0 }).evenements) {
        ev.push(e)
        if (e.type === 'deImpact') ouEtait = w.ennemis.find((o) => o.id === 1)?.corps.y ?? 0
      }
    }
    const pv = insectes.map((e) => 1000 - (w.ennemis.find((o) => o.id === e.id)?.pv ?? 1000))
    const impact = ev.find((e) => e.type === 'deImpact') as Extract<Evenement, { type: 'deImpact' }> | undefined
    const paru = ev.find((e) => e.type === 'de') as Extract<Evenement, { type: 'de' }> | undefined
    return { ev, pv, impact, paru, ouEtait }
  }
  // (l'insecte visé à 60, qui file vers le bas à 30 par seconde avec son voisin à 15 de lui ; un troisième à 40 de lui, hors de la zone)
  const a = lancer(3, [insecte(1, 60, 0), insecte(2, 75, 0), insecte(3, 60, -40)], 30)
  const f = a.impact?.face ?? 0
  verifier(`le dé paraît une fois, sur l'insecte le plus proche, et s'abat 1,2 s après, là où il est (impact à y ${a.impact?.y.toFixed(1)}, lui à ${a.ouEtait.toFixed(1)}) : un ${f}, ${a.pv.join(' / ')} (${4 * f} à lui et à son voisin, rien au troisième)`, a.ev.filter((e) => e.type === 'de').length === 1 && a.paru?.x === 60 && a.impact !== undefined && a.impact.face === a.paru?.face && a.impact.y > 30 && Math.abs(a.impact.y - a.ouEtait) < 1 && f >= 1 && f <= 6 && a.impact.rayon === 22 + 4 * (f - 4) && a.pv[0] === 4 * f && a.pv[1] === 4 * f && a.pv[2] === 0)
  // (le chiffre : de 1 à 6, chacun à peu près une fois sur six, sur 600 lancers ; un second insecte à 25 du point de
  // chute — 20 de zone plus son rayon de 5 : il n'est pris que par une zone de 20 au moins, un 4, un 5 ou un 6)
  const faces = [0, 0, 0, 0, 0, 0]
  const zones = new Set<string>()
  let ecarts = 0
  for (let g = 1; g <= 600; g++) {
    const b = lancer(g, [insecte(1, 60, 0), insecte(2, 60, 25)])
    if (b.impact === undefined) continue
    faces[b.impact.face - 1]++
    zones.add(`${b.impact.face}:${b.impact.rayon}`)
    if (b.pv[0] !== 4 * b.impact.face || b.pv[1] !== (b.impact.face >= 4 ? 4 * b.impact.face : 0)) ecarts++
  }
  const zonesLues = [...zones].sort().map((z) => z.split(':')[1]).join(', ')
  verifier(`sur 600 lancers, chaque chiffre sort à peu près une fois sur six (${faces.join(' / ')}), frappe 4 fois son chiffre, sur une zone qui grandit avec lui (${zonesLues}) : l'insecte à 25 n'est pris qu'à partir d'un 4 (${ecarts} écart)`, faces.every((n) => n >= 70 && n <= 130) && faces.reduce((x, y) => x + y, 0) === 600 && zonesLues === '10, 14, 18, 22, 26, 30' && ecarts === 0)
  const c2 = lancer(3, [insecte(1, 130, 0)])
  verifier(`à 130, au-delà de sa portée (120) : rien ne paraît`, c2.ev.every((e) => e.type !== 'de'))
}

// LA COUPE DU TESSERACT (Keko, 18/11 : « je voudrais bien voir ce que ça donne ») : la tranche d'un cube qui traverse le
// plan en biais — un point, un triangle, un hexagone, le triangle retourné, un point ; elle frappe ce qu'elle couvre
// toutes les 0,25 s pendant ses 2 s
{
  const tranches = [0.3, 1, 1.5, 2, 2.7].map((h) => coupeDUnCube(h).length).join()
  const plus = Math.max(...[1, 2].flatMap((h) => coupeDUnCube(h).map((p) => Math.hypot(p.x, p.y))))
  verifier(`la tranche d'un cube par le plan perpendiculaire à sa diagonale : ${tranches} sommets à 0,3, 1, 1,5, 2 et 2,7 ; rien à 0 et à 3 ; au plus loin √(2/3) (${plus.toFixed(3)})`, tranches === '3,3,6,3,3' && coupeDUnCube(0).length === 0 && coupeDUnCube(3).length === 0 && Math.abs(plus - Math.sqrt(2 / 3)) < 1e-9)
  const insecte = (id: number, x: number, y: number) => ({ id, corps: { ...nouveauVaisseau(), x, y }, pv: 1000, fait: 'marche' as const, roche: null, forage: null, tirA: 1e9, butin: 0, cargaison: { fer: 0, or: 0, cristal: 0 }, calmeA: 1e9 })
  const coupe = { id: 'coupe', cadence: 99, degats: 3, portee: 100, vitesse: 0, vie: 0, dispersion: 0, guide: false, coupe: { duree: 2, rayon: 30, periode: 0.25, tour: 0.8, fin: 30 } }
  const cfg = { ...VAISSEAU, champ: { ...VAISSEAU.champ, densite: 0 }, station: { ...VAISSEAU.station, portee: -1 }, armes: [coupe], ennemi: { ...VAISSEAU.ennemi, apparait: 1e9, pv: 1000, vitesseMax: 0, poussee: 0 } }
  const lancer = (insectes: ReturnType<typeof insecte>[]) => {
    const w = nouveauMonde(cfg, 3)
    w.ennemis.push(...insectes)
    const ev: Evenement[] = []
    for (let i = 0; i < 140; i++) {
      w.vaisseau = { ...w.vaisseau, x: 0, y: 0, vx: 0, vy: 0, cap: 0 }
      ev.push(...avancerLeMonde(cfg, w, 1 / 60, { x: 0, y: 0 }).evenements)
    }
    return { w, ev, pv: insectes.map((e) => 1000 - (w.ennemis.find((o) => o.id === e.id)?.pv ?? 1000)) }
  }
  // (au cœur de la nuée : l'insecte qui a deux voisins tout près, sous le point final ; un quatrième à 15, dans la
  // tranche mais pas sous le point ; un cinquième à 55, au-delà de la tranche)
  const a = lancer([insecte(1, 60, 0), insecte(2, 62, 3), insecte(3, 58, -3), insecte(4, 75, 0), insecte(5, 115, 0)])
  const fin = a.ev.find((e) => e.type === 'coupeFinie') as Extract<Evenement, { type: 'coupeFinie' }> | undefined
  verifier(`une coupe paraît une fois, sur la nuée, frappe sept fois ce qu'elle couvre, puis son point final frappe ce qui est dessous (${a.pv.join(' / ')} : 21 + 30 aux trois sous le point, moins à celui à 15, rien à 55)`, a.ev.filter((e) => e.type === 'coupe').length === 1 && a.pv[0] === 51 && a.pv[1] === 51 && a.pv[2] === 51 && a.pv[3] > 0 && a.pv[3] < 30 && a.pv[4] === 0 && fin?.touches === 3 && a.w.coupes.length === 0)
  const b = lancer([insecte(1, 110, 0)])
  verifier(`à 110, au-delà de sa portée (100) : rien ne paraît`, b.ev.every((e) => e.type !== 'coupe'))
}

// LE CANON LASER DU CHASSEUR (Keko, 18/11 : « un tir qui touche systématiquement une cible : il ne faut pas qu'on loupe la
// cible ») : des insectes qui filent de côté et changent de sens — chaque trait tiré touche ; le même tir, non accroché, en
// manque
{
  const insecte = (id: number, x: number, y: number) => ({ id, corps: { ...nouveauVaisseau(), x, y }, pv: 1e6, fait: 'marche' as const, roche: null, forage: null, tirA: 1e9, butin: 0, cargaison: { fer: 0, or: 0, cristal: 0 }, calmeA: 1e9 })
  const laser = { id: 'laser', cadence: 0.25, degats: 6, portee: 120, vitesse: 420, vie: 0.7, dispersion: 0, guide: false, infaillible: true }
  const essai = (arme: typeof laser | Omit<typeof laser, 'infaillible'>) => {
    const cfg = { ...VAISSEAU, champ: { ...VAISSEAU.champ, densite: 0 }, station: { ...VAISSEAU.station, portee: -1 }, armes: [arme], ennemi: { ...VAISSEAU.ennemi, apparait: 1e9, pv: 1e6, vitesseMax: 0, poussee: 0 } }
    let tirs = 0
    let touches = 0
    for (const loin of [40, 80, 115]) {
      const w = nouveauMonde(cfg, 5)
      w.ennemis.push(insecte(1, loin, 0))
      for (let i = 0; i < 240; i++) {
        w.vaisseau = { ...w.vaisseau, x: 0, y: 0, vx: 0, vy: 0, cap: 0 }
        // (il file de côté à 90 par seconde, et fait demi-tour toutes les 0,4 s)
        const vy = (Math.floor(i / 24) % 2 === 0 ? 1 : -1) * 90
        w.ennemis[0].corps = { ...w.ennemis[0].corps, vy, y: w.ennemis[0].corps.y + vy / 60 }
        for (const e of avancerLeMonde(cfg, w, 1 / 60, { x: 0, y: 0 }).evenements) {
          if (e.type === 'obus') tirs++
          if (e.type === 'ennemiTouche') touches++
        }
      }
      tirs -= w.obus.length
    }
    return { tirs, touches }
  }
  const a = essai(laser)
  const { infaillible: _, ...nonAccroche } = laser
  const b = essai(nonAccroche)
  verifier(`le canon laser ne manque pas un insecte qui file de côté et change de sens : ${a.touches} touches sur ${a.tirs} traits arrivés (non accroché : ${b.touches} sur ${b.tirs})`, a.tirs > 20 && a.touches === a.tirs && b.touches < b.tirs)
  // (… ET LA MITRAILLEUSE DU CHASSEUR, plus lente que lui, accrochée pareil — Keko, 18/11)
  const c = essai({ ...laser, id: 'mitraille', cadence: 0.18, degats: 1.2, portee: 100, vitesse: 300, vie: 0.7 })
  verifier(`la mitrailleuse du Chasseur non plus : ${c.touches} touches sur ${c.tirs} balles arrivées`, c.tirs > 20 && c.touches === c.tirs)
}

// LE VIRAGE (Keko, 18/11 : la maniabilité devient l'agilité — « un vaisseau lourd sera peu maniable, un léger tournera
// sec ») : lancé vers la droite, le manche vers le haut, un vaisseau agile a viré bien plus loin qu'un lourd en 0,3 s, sans
// perdre son élan ; sans virage, rien ne change
{
  const lance = (virage: number) => {
    const cfg = { ...VAISSEAU, champ: { ...VAISSEAU.champ, densite: 0 }, station: { ...VAISSEAU.station, portee: -1 }, virage }
    const w = nouveauMonde(cfg, 3)
    w.vaisseau = { ...w.vaisseau, x: 300, y: 0, vx: 100, vy: 0, cap: 0 }
    for (let i = 0; i < 18; i++) avancerLeMonde(cfg, w, 1 / 60, { x: 0, y: -1 })
    return { angle: (Math.atan2(-w.vaisseau.vy, w.vaisseau.vx) * 180) / Math.PI, vitesse: Math.hypot(w.vaisseau.vx, w.vaisseau.vy) }
  }
  const sans = lance(0)
  const lourd = lance(1.6)
  const agile = lance(3.6)
  verifier(`le virage : lancé à droite, le manche vers le haut, en 0,3 s il a tourné de ${sans.angle.toFixed(0)}° sans virage, ${lourd.angle.toFixed(0)}° lourd, ${agile.angle.toFixed(0)}° agile — vitesse gardée (${agile.vitesse.toFixed(0)})`, agile.angle > lourd.angle + 10 && lourd.angle > sans.angle + 5 && agile.vitesse >= sans.vitesse - 1)
}

// UN RAYON ANNONCÉ VA AU BOUT (Keko, 18/11 : « le bruit du rayon se lance, mais pas le rayon ») : un insecte à portée qui
// meurt juste avant la fin de la recharge — le son est déjà parti —, le rayon part quand même, vers là où il était
{
  const arme = { ...pieceDe('arme-rayon')!.arme!, place: 0 }
  const cfg = { ...VAISSEAU, champ: { ...VAISSEAU.champ, densite: 0 }, station: { ...VAISSEAU.station, portee: -1 }, armes: [arme], ennemi: { ...VAISSEAU.ennemi, apparait: 1e9, vitesseMax: 0, poussee: 0 } }
  const w = nouveauMonde(cfg, 3)
  w.ennemis.push({ id: 1, corps: { ...nouveauVaisseau(), x: 340, y: 0 }, pv: 1000, fait: 'marche', roche: null, forage: null, tirA: 1e9, butin: 0, cargaison: { fer: 0, or: 0, cristal: 0 } })
  w.armesA = [0.3]
  let part = false
  for (let i = 0; i < 60; i++) {
    w.vaisseau = { ...w.vaisseau, x: 300, y: 0, vx: 0, vy: 0 }
    if (i === 15) w.ennemis = []
    for (const e of avancerLeMonde(cfg, w, 1 / 60, { x: 0, y: 0 }).evenements) if (e.type === 'balayage') part = true
  }
  verifier(`un insecte à portée meurt 0,05 s avant la fin de la recharge du rayon : il part quand même (${part})`, part)
}

// LA MÉTÉORE D'ARCANE DU PULSAR : elle tombe sur l'insecte le plus proche, son point de chute LE SUIT pendant la chute
// (il file de côté, elle ne le manque pas) ; à l'impact, ELLE NE FRAPPE QUE LUI : son voisin tout près, rien
{
  const insecte = (id: number, x: number, y: number) => ({ id, corps: { ...nouveauVaisseau(), x, y }, pv: 1000, fait: 'marche' as const, roche: null, forage: null, tirA: 1e9, butin: 0, cargaison: { fer: 0, or: 0, cristal: 0 }, calmeA: 1e9 })
  const meteore = { id: 'meteore', cadence: 99, degats: 18, portee: 120, vitesse: 0, vie: 0, dispersion: 0, guide: false, meteore: { chute: 0.6 } }
  const cfg = { ...VAISSEAU, champ: { ...VAISSEAU.champ, densite: 0 }, station: { ...VAISSEAU.station, portee: -1 }, armes: [meteore], ennemi: { ...VAISSEAU.ennemi, apparait: 1e9, pv: 1000, vitesseMax: 0, poussee: 0 } }
  const w = nouveauMonde(cfg, 3)
  w.ennemis.push(insecte(1, 60, 0), insecte(2, 68, 0), insecte(3, 60, -60))
  const ev: Evenement[] = []
  let impact: { x: number; y: number } | null = null
  let ouEtait = 0
  for (let i = 0; i < 60; i++) {
    w.vaisseau = { ...w.vaisseau, x: 0, y: 0, vx: 0, vy: 0, cap: 0 }
    // (les deux premiers filent vers le bas, à 50 par seconde)
    for (const e of w.ennemis) if (e.id !== 3) e.corps = { ...e.corps, y: e.corps.y + 50 / 60 }
    for (const e of avancerLeMonde(cfg, w, 1 / 60, { x: 0, y: 0 }).evenements) {
      ev.push(e)
      if (e.type === 'meteoreImpact') (impact = { x: e.x, y: e.y }), (ouEtait = w.ennemis.find((o) => o.id === 1)?.corps.y ?? 0)
    }
  }
  const pv = w.ennemis.map((e) => 1000 - e.pv)
  verifier(`la météore tombe une fois, sur l'insecte qui file (impact à ${impact === null ? '—' : `${impact.x.toFixed(0)}, ${impact.y.toFixed(1)}`}, lui à y ${ouEtait.toFixed(1)}) : ${pv.join(' / ')} (18 à lui seul, 0 à son voisin et au lointain)`, ev.filter((e) => e.type === 'meteoreImpact').length === 1 && impact !== null && impact.y > 25 && Math.abs(impact.y - ouEtait) < 1.5 && pv[0] === 18 && pv[1] === 0 && pv[2] === 0)
}

// LA COQUE QUI SE RÉGÉNÈRE (l'Essaim, Keko, 17/11) : en permanence, sans attendre, jusqu'au plein et pas au-delà
{
  const c: ConfigVaisseau = { ...VAISSEAU, champ: { ...VAISSEAU.champ, densite: 0 }, regeneration: 0.1 } // (10 % d'une coque de 5 : un demi-point par seconde)
  const mr = nouveauMonde()
  mr.coque = 2
  mr.toucheA = mr.t
  for (let i = 0; i < 60; i++) avancerLeMonde(c, mr, 1 / 60, { x: 0, y: 0 })
  const apresUneSeconde = mr.coque
  for (let i = 0; i < 60 * 20; i++) avancerLeMonde(c, mr, 1 / 60, { x: 0, y: 0 })
  verifier('la coque se régénère tout de suite, de son régime, et s’arrête au plein', Math.abs(apresUneSeconde - 2.5) < 0.02 && mr.coque === c.coque)
  const sans = nouveauMonde()
  sans.coque = 2
  for (let i = 0; i < 120; i++) avancerLeMonde({ ...c, regeneration: 0 }, sans, 1 / 60, { x: 0, y: 0 })
  verifier('sans régénération, elle ne bouge pas', sans.coque === 2)
}

// LES PLAQUES DE BLINDAGE (les humains, Keko, 17/11) : trois plaques, les trois premiers coups, quels qu'ils soient
{
  const c: ConfigVaisseau = { ...VAISSEAU, champ: { ...VAISSEAU.champ, densite: 0 }, coque: 6, plaques: 3 }
  const mp = nouveauMonde(c)
  // (chaque coup un peu après le précédent : passé l'invulnérabilité qui suit un coup)
  const coup = (d: number): Evenement[] => {
    mp.t += c.invulnerabilite + 0.01
    const ev: Evenement[] = []
    encaisser(c, mp, 0, 0, d, ev)
    return ev
  }
  const e1 = coup(4)
  verifier('la première plaque prend tout le premier coup, même gros : la coque est intacte', mp.coque === 6 && !mp.plaques[0] && mp.plaques[1] && e1.some((e) => e.type === 'plaque'))
  coup(1)
  coup(5)
  verifier('les deux suivantes prennent les deux coups suivants, petits ou gros', mp.coque === 6 && mp.plaques.every((x) => !x))
  coup(1)
  verifier('les plaques cassées, la coque est touchée', mp.coque === 5)
  const morte = coup(9)
  verifier('et percée', mp.coque === 0 && morte.some((e) => e.type === 'perdu'))
}

// L'INVULNÉRABILITÉ APRÈS UN COUP (Keko, 17/11) : un insecte qui touche donnait deux coups dans la même image
{
  const c: ConfigVaisseau = { ...VAISSEAU, champ: { ...VAISSEAU.champ, densite: 0 }, coque: 6, plaques: 3 }
  const mi = nouveauMonde(c)
  const ev: Evenement[] = []
  encaisser(c, mi, 0, 0, 1, ev)
  encaisser(c, mi, 0, 0, 1, ev)
  verifier('deux coups dans le même instant : la plaque prend le premier, le second ne compte pas — la barre est intacte', mi.coque === 6 && !mi.plaques[0] && mi.plaques[1] && ev.filter((e) => e.type === 'plaque').length === 1 && !ev.some((e) => e.type === 'touche'))
  mi.t += c.invulnerabilite * 0.5
  encaisser(c, mi, 0, 0, 1, ev)
  verifier('pendant l’invulnérabilité, rien ne passe', mi.coque === 6)
  mi.t += c.invulnerabilite
  encaisser(c, mi, 0, 0, 1, ev)
  verifier('passée, le coup suivant compte (la plaque suivante le prend)', mi.coque === 6 && !mi.plaques[1] && mi.plaques[2])
}

// LE BOUCLIER N'A PAS DE RÉPIT (Keko, 19/11 : « touché plusieurs fois d'affilée, il encaisse tous les dégâts ; l'invincibilité
// ne concerne que le blindage »)
{
  const c: ConfigVaisseau = { ...VAISSEAU, champ: { ...VAISSEAU.champ, densite: 0 }, coque: 6, bouclier: { points: 5, delai: 3, regain: 2.5 } }
  const mb = nouveauMonde(c)
  const ev: Evenement[] = []
  encaisser(c, mb, 0, 0, 1, ev)
  encaisser(c, mb, 0, 0, 1, ev)
  encaisser(c, mb, 0, 0, 1, ev)
  verifier('trois coups dans le même instant sur le bouclier : il les prend tous (5 → 2), sans invincibilité ni clignotement', Math.abs(mb.bouclier - 2) < 1e-9 && mb.coque === 6 && mb.intouchableJusque < mb.t)
  encaisser(c, mb, 0, 0, 3, ev)
  verifier('le coup qui le perce passe à la coque (2 de bouclier, 1 de coque) — et ouvre l’invincibilité', mb.bouclier === 0 && mb.coque === 5 && mb.intouchableJusque > mb.t)
  encaisser(c, mb, 0, 0, 1, ev)
  verifier('pendant elle, la coque ne prend rien', mb.coque === 5)
}

// LA CORRUPTION (les Innommés, Keko, 17/11) : le coup corrompt, la corruption ronge, l'insecte abattu la purge
{
  const c: ConfigVaisseau = { ...VAISSEAU, champ: { ...VAISSEAU.champ, densite: 0 }, coque: 5, corruption: { ronge: 0.5, purge: 0.5 } }
  const mc = nouveauMonde(c)
  const ev: Evenement[] = []
  encaisser(c, mc, 0, 0, 2, ev)
  verifier('un coup ne vide pas la coque : il la corrompt', mc.coque === 5 && mc.corruption === 2 && ev.some((e) => e.type === 'corrompu'))
  for (let i = 0; i < 60; i++) avancerLeMonde(c, mc, 1 / 60, { x: 0, y: 0 })
  verifier('la corruption ronge la coque d’un demi-point par seconde', Math.abs(mc.coque - 4.5) < 0.02 && Math.abs(mc.corruption - 1.5) < 0.02)
  const avant = mc.corruption
  const pe: Evenement[] = []
  purger(c, mc, 0, 0, pe)
  verifier('un insecte abattu purge un demi-point, rendu sain', Math.abs(mc.corruption - (avant - 0.5)) < 1e-9 && Math.abs(mc.coque - 4.5) < 0.02 && pe.some((e) => e.type === 'purge'))
  const md = nouveauMonde(c)
  md.t += 5
  encaisser(c, md, 0, 0, 7, [])
  verifier('la coque toute corrompue, ce qui dépasse passe tout droit', md.corruption === md.coque && md.coque === 3)
  for (let i = 0; i < 60 * 8 && md.phase === 'vol'; i++) avancerLeMonde(c, md, 1 / 60, { x: 0, y: 0 })
  verifier('toute rongée, la partie est perdue', md.phase === 'perdu' && md.coque === 0)
}

// LE FRIMAS SANS PERSONNE AUTOUR (Keko, 19/11 : « lancer les tempêtes de givre, la nova de givre, même quand il n'y a pas
// d'ennemis ; et doubler le nombre d'éclats de glace ») : la nova et le blizzard partent à leur cadence dans le vide (le
// blizzard droit devant le nez) ; ses éclats sont seize
{
  const nova = { ...pieceDe('arme-nova')!.arme!, place: 0 }
  const tornade = { ...pieceDe('arme-tornade')!.arme!, place: 1 }
  const cfg = { ...VAISSEAU, champ: { ...VAISSEAU.champ, densite: 0 }, station: { ...VAISSEAU.station, portee: -1 }, armes: [nova, tornade], ennemi: { ...VAISSEAU.ennemi, apparait: 1e9 } }
  const w = nouveauMonde(cfg, 5)
  w.vaisseau.cap = Math.PI / 2
  const ev: Evenement[] = []
  for (let i = 0; i < 60 * 7; i++) ev.push(...avancerLeMonde(cfg, w, 1 / 60, { x: 0, y: 0 }).evenements)
  const novas = ev.filter((e) => e.type === 'nova').length
  const tornades = ev.filter((e) => e.type === 'tornade').length
  verifier(`sans insecte, la nova part à sa cadence (${novas} en 7 s) et le blizzard aussi (${tornades}), droit devant le nez`, w.ennemis.length === 0 && novas >= 2 && tornades >= 1 && w.tornades.every((tn) => Math.abs(Math.atan2(tn.vy, tn.vx) - Math.PI / 2) < 1e-6))
}
// LA NOVA, UNE ONDE QUI S'OUVRE (Keko, 19/11 : « le cercle touche visuellement les ennemis, mais ils ne subissent pas de
// dégâts ; agrandis la nova pour qu'elle matche sa pleine distance visuelle ») : sa portée est 48 (56 d'abord, réduite le 20/11) ; son front s'ouvre en
// 0,35 s et frappe chaque insecte une fois quand il l'atteint — celui qui y entre en chemin aussi —, rien au-delà
{
  const insecte = (id: number, x: number, y: number) => ({ id, corps: { ...nouveauVaisseau(), x, y }, pv: 1000, fait: 'marche' as const, roche: null, forage: null, tirA: 1e9, butin: 0, cargaison: { fer: 0, or: 0, cristal: 0 }, calmeA: 1e9 })
  const nova = { ...pieceDe('arme-nova')!.arme!, place: 0 }
  const cfg = { ...VAISSEAU, champ: { ...VAISSEAU.champ, densite: 0 }, station: { ...VAISSEAU.station, portee: -1 }, armes: [nova], ennemi: { ...VAISSEAU.ennemi, apparait: 1e9, pv: 1000, vitesseMax: 0, poussee: 0 } }
  const w = nouveauMonde(cfg, 3)
  // (l'un au bord de la portée ; l'autre au-delà ; le troisième, loin au départ, est porté dans l'onde après 0,1 s)
  w.ennemis.push(insecte(1, 47, 0), insecte(2, 0, 56), insecte(3, -90, 0))
  const touches = new Map<number, number>()
  for (let i = 0; i < 40; i++) {
    w.vaisseau = { ...w.vaisseau, x: 0, y: 0, vx: 0, vy: 0 }
    if (i === 6) w.ennemis[2].corps = { ...w.ennemis[2].corps, x: -34, y: 0 }
    for (const e of avancerLeMonde(cfg, w, 1 / 60, { x: 0, y: 0 }).evenements) if (e.type === 'ennemiTouche') touches.set(e.id, (touches.get(e.id) ?? 0) + 1)
  }
  verifier(`l'onde frappe au bord de sa portée (48) une fois, celui qui y entre en chemin aussi, rien au-delà (${[1, 2, 3].map((id) => touches.get(id) ?? 0).join(', ')})`, nova.nova?.rayon === 48 && touches.get(1) === 1 && !touches.has(2) && touches.get(3) === 1 && w.novas.length === 0)
}
// LA PLAQUE DE LA NOVA A SA TAILLE (Keko, 19/11 : « que la zone qu'on laisse après la nova ait la même taille que la nova
// prend au moment de l'explosion »)
verifier('la plaque de verglas de la nova est aussi grande que la nova', pieceDe('arme-nova')!.arme!.nova!.plaque.rayon === pieceDe('arme-nova')!.arme!.nova!.rayon)
// LES ÉCHARDES DE GIVRE DU FRIMAS (Keko, 19/11 : « elles se matérialisent autour du vaisseau, jusqu'à 5 ; dès qu'il passe
// à portée d'un ennemi, elles foncent, chacune à son tour, très rapidement, vers les ennemis aux alentours ; elles gèlent ;
// une portée comme le canon du chasseur ») : sans insecte, elles se forment, cinq au plus ; un insecte à 110, toutes
// partent en un tiers de seconde, chacune le touche et le gèle ; un insecte à 160, aucune ne part
{
  const insecte = (id: number, x: number, y: number) => ({ id, corps: { ...nouveauVaisseau(), x, y }, pv: 1000, fait: 'marche' as const, roche: null, forage: null, tirA: 1e9, butin: 0, cargaison: { fer: 0, or: 0, cristal: 0 }, calmeA: 1e9 })
  const eclats = { ...pieceDe('arme-eclats')!.arme!, place: 0 }
  const cfg = { ...VAISSEAU, champ: { ...VAISSEAU.champ, densite: 0 }, station: { ...VAISSEAU.station, portee: -1 }, armes: [eclats], ennemi: { ...VAISSEAU.ennemi, apparait: 1e9, pv: 1000, vitesseMax: 0, poussee: 0 } }
  const w = nouveauMonde(cfg, 4)
  const pas = (n: number): Evenement[] => {
    const ev: Evenement[] = []
    for (let i = 0; i < n; i++) {
      w.vaisseau = { ...w.vaisseau, x: 0, y: 0, vx: 0, vy: 0 }
      ev.push(...avancerLeMonde(cfg, w, 1 / 60, { x: 0, y: 0 }).evenements)
    }
    return ev
  }
  pas(60 * 5)
  verifier(`sans insecte, elles se forment autour du vaisseau, cinq au plus (${w.echardes.length})`, w.echardes.length === 5 && w.obus.length === 0)
  w.ennemis.push(insecte(1, 160, 0))
  const loin = pas(30)
  verifier('un insecte à 160 (au-delà de 120) : aucune ne part', !loin.some((e) => e.type === 'echarde') && w.echardes.length === 5)
  w.ennemis[0].corps = { ...w.ennemis[0].corps, x: 110, y: 0 }
  // (la dernière part à 0,28 s, et file 110 à 320 : 0,8 s suffit)
  const ev = pas(48)
  const parties = ev.filter((e) => e.type === 'echarde').length
  const touches = ev.filter((e) => e.type === 'ennemiTouche').length
  verifier(`un insecte à 110 : les cinq partent l'une après l'autre en 0,3 s (${parties}), le touchent (${touches}) et le gèlent`, parties === 5 && touches === 5 && (w.ennemis[0].geleA ?? 0) > w.t && w.ennemis[0].pv === 1000 - 5 * eclats.degats)
}

// LE DÉPHASAGE (les Yhg'tharr, Keko, 20/11) : le coup esquivé, invincible et traversant un court instant ; sans chance, rien
{
  const c: ConfigVaisseau = { ...VAISSEAU, champ: { ...VAISSEAU.champ, densite: 0 }, coque: 5, dephasage: { chance: 1, duree: 1.5 } }
  const md = nouveauMonde(c)
  const ev: Evenement[] = []
  encaisser(c, md, 0, 0, 2, ev)
  verifier('un coup esquivé : la coque ne baisse pas, le vaisseau est déphasé', md.coque === 5 && md.dephaseJusque === md.t + 1.5 && ev.some((e) => e.type === 'dephase') && !ev.some((e) => e.type === 'touche'))
  md.t += 1
  const ev2: Evenement[] = []
  encaisser({ ...c, dephasage: { chance: 0, duree: 1.5 } }, md, 0, 0, 2, ev2)
  verifier('déphasé, il ne prend aucun coup', md.coque === 5 && ev2.length === 0)
  md.t += 1
  encaisser({ ...c, dephasage: { chance: 0, duree: 1.5 } }, md, 0, 0, 2, [])
  verifier('le déphasage fini, le coup suivant porte', md.coque === 3)
  // (il traverse une roche : sans déphasage, elle l'arrête)
  const champ = { ...VAISSEAU.champ, densite: 1 }
  const roche = asteroidesAutour({ ...c, champ }, 200, 0, 400).find((a) => a.rayon >= 6 && Math.hypot(a.x, a.y) > 60)
  if (roche !== undefined) {
    const traverse = (dephase: boolean): number => {
      const cc: ConfigVaisseau = { ...c, champ }
      const w = nouveauMonde(cc)
      const an = Math.atan2(roche.y, roche.x)
      w.vaisseau = { ...w.vaisseau, x: roche.x - Math.cos(an) * (roche.rayon + 14), y: roche.y - Math.sin(an) * (roche.rayon + 14), vx: Math.cos(an) * 60, vy: Math.sin(an) * 60, cap: an }
      if (dephase) w.dephaseJusque = 1e9
      let plusPres = Infinity
      for (let i = 0; i < 40; i++) {
        avancerLeMonde(cc, w, 1 / 60, { x: Math.cos(an), y: Math.sin(an) })
        plusPres = Math.min(plusPres, Math.hypot(w.vaisseau.x - roche.x, w.vaisseau.y - roche.y))
      }
      return plusPres
    }
    const sans = traverse(false)
    const avec = traverse(true)
    verifier(`déphasé, il traverse la roche (au plus près : ${avec.toFixed(1)} du centre, ${sans.toFixed(1)} sans déphasage, la roche fait ${roche.rayon.toFixed(1)})`, avec < roche.rayon * 0.5 && sans >= roche.rayon)
  } else verifier('une roche pour le test du déphasage', false)
  // (sans chance, jamais)
  const c0: ConfigVaisseau = { ...c, dephasage: { chance: 0, duree: 1.5 } }
  const m0 = nouveauMonde(c0)
  const e0: Evenement[] = []
  encaisser(c0, m0, 0, 0, 2, e0)
  verifier('sans chance de déphasage, le coup porte', m0.coque === 3 && !e0.some((e) => e.type === 'dephase'))
  // (une chance de 15 % : à peu près un coup sur sept esquivé, sur 2 000 coups)
  const c15: ConfigVaisseau = { ...c, coque: 1e9, dephasage: { chance: 0.15, duree: 0 }, invulnerabilite: 0 }
  const m15 = nouveauMonde(c15)
  let esquives = 0
  for (let i = 0; i < 2000; i++) {
    const e: Evenement[] = []
    m15.t += 0.01
    encaisser(c15, m15, 0, 0, 1, e)
    if (e.some((x) => x.type === 'dephase')) esquives++
  }
  verifier(`une chance de 15 % : ${esquives} esquives sur 2 000 coups`, esquives > 250 && esquives < 350)
}

// LES VAGUES SE SERRENT (Keko, 20/11 : « augmente progressivement le nombre d'ennemis qui spawnent par vague ») : chaque
// vague naît dans le temps de la première, ses insectes d'autant plus serrés qu'elle est grosse
{
  const cv = (n: number): number => cadenceDeLaVague(VAISSEAU, n)
  verifier(`le pas des naissances : ${[1, 2, 5, 20, 40].map((n) => cv(n).toFixed(2)).join(' / ')} s aux vagues 1, 2, 5, 20, 40`, Math.abs(cv(1) - 2.2) < 1e-9 && Math.abs(cv(2) - 1.32) < 1e-9 && Math.abs(cv(5) - 6.6 / 11) < 1e-9 && cv(40) === VAISSEAU.invasion.cadenceMin)
  // (dans le monde : la troisième vague, huit insectes, naît en 6,6 s)
  const c: ConfigVaisseau = { ...VAISSEAU, champ: { ...VAISSEAU.champ, densite: 0 }, invasion: { ...VAISSEAU.invasion, active: true, premiere: 0 }, ennemi: { ...VAISSEAU.ennemi, vitesseMax: 0, poussee: 0 } }
  const w = nouveauMonde(c, 5)
  w.vaisseau = { ...w.vaisseau, x: 5000, y: 0 }
  const nes: number[] = []
  for (let i = 0; i < 60 * 60 && nes.length === 0; i++) {
    for (const e of avancerLeMonde(c, w, 1 / 60, { x: 0, y: 0 }).evenements) if (e.type === 'vague' && e.numero === 3) nes.push(w.t)
    // (les vagues d'avant : abattues aussitôt nées, pour que la suivante vienne)
    for (const e of w.ennemis) e.pv = 0
  }
  const debut = nes[0]
  let derniere = debut
  let compte = 1
  for (let i = 0; i < 60 * 12; i++) {
    const n0 = w.ennemis.length
    avancerLeMonde(c, w, 1 / 60, { x: 0, y: 0 })
    if (w.ennemis.length > n0) {
      compte += w.ennemis.length - n0
      derniere = w.t
    }
  }
  verifier(`la troisième vague : ${compte} insectes nés en ${(derniere - debut).toFixed(2)} s (8 en 6,6 s)`, compte === 8 && Math.abs(derniere - debut - 6.6) < 0.05)
}

// UNE PÉPITE AIMANTÉE FINIT TOUJOURS À BORD (Keko, 20/11 : « j'aimante une pépite et si je m'éloigne trop vite, je la
// perds ») : prise par l'aimant, puis le vaisseau qui fuit à 200 — elle le rattrape
{
  const c: ConfigVaisseau = { ...VAISSEAU, champ: { ...VAISSEAU.champ, densite: 0 }, station: { ...VAISSEAU.station, portee: -1 }, invasion: { ...VAISSEAU.invasion, active: true, premiere: 1e9 } }
  const w = nouveauMonde(c, 4)
  w.vaisseau = { ...w.vaisseau, x: 1000, y: 0, vx: 0, vy: 0 }
  w.pepites.push({ id: 1, x: 1000 + c.forage.aimant - 2, y: 0, vx: 0, vy: 0, graine: 1, minerai: 'fer' })
  avancerLeMonde(c, w, 1 / 60, { x: 0, y: 0 })
  const prise = w.pepites[0]?.aimanteeA !== undefined
  let aBord = -1
  for (let i = 0; i < 60 * 6 && aBord < 0; i++) {
    // (il fuit tout droit à 200, plus vite qu'aucun vaisseau)
    w.vaisseau = { ...w.vaisseau, x: w.vaisseau.x - 200 / 60, vx: -200, vy: 0 }
    avancerLeMonde(c, w, 1 / 60, { x: 0, y: 0 })
    if (w.pepites.length === 0) aBord = w.t
  }
  verifier(`une pépite aimantée rattrape un vaisseau qui fuit à 200 (à bord en ${aBord.toFixed(2)} s)`, prise && aBord > 0 && aBord < 3 && w.invasion.xp === 1)
}

// LES INSECTES NE S'EMPILENT PAS (Keko, 20/11) : douze insectes qui poursuivent un vaisseau tournant en rond, dix
// secondes — jamais deux plus proches que leurs deux rayons (à un demi-pixel près)
{
  const c: ConfigVaisseau = { ...VAISSEAU, champ: { ...VAISSEAU.champ, densite: 0 }, invasion: { ...VAISSEAU.invasion, active: true, premiere: 1e9 }, ennemi: { ...VAISSEAU.ennemi, pv: 1e6, poussee: 90, vitesseMax: 40, rayon: 5, armes: [] } }
  const w = nouveauMonde(c, 6)
  for (let k = 0; k < 12; k++) w.ennemis.push({ id: 100 + k, corps: { ...nouveauVaisseau(), x: 400 + (k % 4) * 3, y: Math.floor(k / 4) * 3 }, pv: 1e6, fait: 'aggro', roche: null, forage: null, tirA: 1e9, butin: 0, cargaison: { fer: 0, or: 0, cristal: 0 } })
  let pire = Infinity
  for (let i = 0; i < 600; i++) {
    const an = (i / 60) * 0.75
    w.vaisseau = { ...w.vaisseau, x: 400 + Math.cos(an) * 60, y: Math.sin(an) * 60, vx: -Math.sin(an) * 45, vy: Math.cos(an) * 45 }
    w.intouchableJusque = Infinity
    avancerLeMonde(c, w, 1 / 60, { x: 0, y: 0 })
    if (i > 30)
      for (const a of w.ennemis) for (const b of w.ennemis) if (a.id < b.id) pire = Math.min(pire, Math.hypot(a.corps.x - b.corps.x, a.corps.y - b.corps.y))
  }
  verifier(`douze insectes qui poursuivent un vaisseau en rond ne s'empilent pas (au plus près : ${pire.toFixed(1)}, leurs rayons font 10)`, pire >= 9.5)
}

// LA VIE DU VAISSEAU FOIS CINQUANTE (Keko, 20/11 : « 9 points de vie, c'est beaucoup trop faible ») : le blindage, le
// bouclier et tout ce qui frappe le vaisseau suivent — une morsure prend autant de la barre qu'avant
{
  const c = vieMultipliee({ ...VAISSEAU, coque: 9, bouclier: { points: 3, delai: 4, regain: 0.5 } }, 50)
  verifier(`la vie fois 50 : blindage ${c.coque}, bouclier ${c.bouclier.points} (recharge ${c.bouclier.regain} par seconde), morsure ${c.invasion.morsure}, unité ${c.uniteDeVie}`, c.coque === 450 && c.bouclier.points === 150 && c.bouclier.regain === 25 && c.invasion.morsure === 50 && c.uniteDeVie === 50)
  const w = nouveauMonde({ ...c, bouclier: { ...c.bouclier, points: 0 } })
  encaisser({ ...c, bouclier: { ...c.bouclier, points: 0 } }, w, 0, 0, c.invasion.morsure, [])
  verifier(`une morsure prend la même part de la barre : ${w.coque} sur 450 (8 sur 9 avant)`, w.coque === 400)
}

// LES ROCHES QUI DÉRIVENT (Keko, 20/11) : elles traversent le champ, les armes visent les insectes d'abord, elles
// rendent beaucoup de pépites, et elles heurtent le vaisseau
{
  const roche = (id: number, x: number, y: number, vx: number, vy: number, pv: number): Ennemi => ({ id, corps: { ...nouveauVaisseau(), x, y, vx, vy }, pv, fait: 'marche', roche: null, forage: null, tirA: 0, butin: 0, cargaison: { fer: 0, or: 0, cristal: 0 }, grand: true, asteroide: { rayon: 10, graine: 1, angle0: 0, vitesseAngulaire: 0, pvMax: 500 } })
  const insecte = (id: number, x: number, y: number): Ennemi => ({ id, corps: { ...nouveauVaisseau(), x, y }, pv: 1e6, fait: 'marche', roche: null, forage: null, tirA: 1e9, butin: 0, cargaison: { fer: 0, or: 0, cristal: 0 }, calmeA: 1e9 })
  const base = { ...VAISSEAU, coque: 1e6, champ: { ...VAISSEAU.champ, densite: 0 }, station: { ...VAISSEAU.station, portee: -1 }, invasion: { ...VAISSEAU.invasion, active: true, premiere: 1e9 }, ennemi: { ...VAISSEAU.ennemi, pv: 120, butinRendu: 1, apparait: 1e9 } }
  // (elles naissent à leur heure, traversent tout droit, trois au plus, et s'en vont)
  {
    const cfg = { ...base, derive: { ...VAISSEAU.derive, active: true, premier: 0.5, tousMin: 1, tousMax: 1, max: 3 } }
    const w = nouveauMonde(cfg, 5)
    w.vaisseau = { ...w.vaisseau, x: 3000, y: 3000 }
    let auPlus = 0
    let droites = true
    const vus = new Set<number>()
    for (let i = 0; i < 60 * 40; i++) {
      const avant = new Map(w.ennemis.map((e) => [e.id, { vx: e.corps.vx, vy: e.corps.vy }]))
      avancerLeMonde(cfg, w, 1 / 60, { x: 0, y: 0 })
      w.vaisseau = { ...w.vaisseau, x: 3000, y: 3000, vx: 0, vy: 0 }
      for (const e of w.ennemis) {
        vus.add(e.id)
        const a = avant.get(e.id)
        if (a !== undefined && (a.vx !== e.corps.vx || a.vy !== e.corps.vy)) droites = false
      }
      auPlus = Math.max(auPlus, w.ennemis.length)
    }
    verifier(`les roches dérivent : ${vus.size} passées en 40 s, trois au plus à la fois, chacune tout droit, et elles s’en vont`, auPlus === 3 && vus.size > 3 && droites && w.ennemis.every((e) => e.asteroide !== undefined))
  }
  // (les armes visent l'insecte à portée, pas la roche ; verrouillée, la roche ; seule, la roche)
  {
    const canon = { id: 'canon', cadence: 0.3, degats: 10, portee: 120, vitesse: 400, vie: 1, dispersion: 0, guide: false, infaillible: true }
    const cfg = { ...base, armes: [canon] }
    const w = nouveauMonde(cfg, 5)
    const r = roche(1, 40, 200, 0, 0, 500)
    const ins = insecte(2, -40, 200)
    w.ennemis.push(r, ins)
    const tenir = (secondes: number): void => {
      for (let i = 0; i < 60 * secondes; i++) {
        w.vaisseau = { ...w.vaisseau, x: 0, y: 200, vx: 0, vy: 0 }
        for (const e of w.ennemis) e.corps = { ...e.corps, x: e.id === 1 ? 40 : -40, y: 200, vx: 0, vy: 0 }
        avancerLeMonde(cfg, w, 1 / 60, { x: 0, y: 0 })
      }
    }
    tenir(2)
    const avecInsecte = 500 - r.pv
    const insecteTouche = 1e6 - ins.pv
    verrouiller(w, 1)
    tenir(1)
    const verrouillee = 500 - r.pv - avecInsecte
    w.verrou = null
    w.ennemis = w.ennemis.filter((e) => e.id !== 2)
    const pv0 = r.pv
    tenir(1)
    const seule = pv0 - r.pv
    verifier(`l’insecte d’abord : un insecte à portée, la roche n’est pas visée (${avecInsecte} contre ${insecteTouche}) ; verrouillée, elle l’est (${verrouillee}) ; seule, aussi (${seule})`, avecInsecte === 0 && insecteTouche > 0 && verrouillee > 0 && seule > 0)
  }
  // (… MAIS LE TIR NE LA TRAVERSE PAS — Keko, 20/11 : visant l'insecte qui est derrière elle, il s'écrase sur elle)
  {
    const canon = { id: 'canon', cadence: 0.3, degats: 10, portee: 120, vitesse: 400, vie: 1, dispersion: 0, guide: false, infaillible: true }
    const cfg = { ...base, armes: [canon] }
    const w = nouveauMonde(cfg, 5)
    const r = roche(1, 40, 200, 0, 0, 500)
    const ins = insecte(2, 90, 200)
    w.ennemis.push(r, ins)
    for (let i = 0; i < 60 * 2; i++) {
      w.vaisseau = { ...w.vaisseau, x: 0, y: 200, vx: 0, vy: 0 }
      for (const e of w.ennemis) e.corps = { ...e.corps, x: e.id === 1 ? 40 : 90, y: 200, vx: 0, vy: 0 }
      avancerLeMonde(cfg, w, 1 / 60, { x: 0, y: 0 })
    }
    verifier(`le tir ne traverse pas la roche : visant l’insecte derrière elle, il la frappe (${500 - r.pv}) et l’épargne (${1e6 - ins.pv}) ; elle reste dans le champ`, r.pv < 500 && ins.pv === 1e6 && w.ennemis.includes(r))
  }
  // (abattue, elle éclate et rend une pépite par 60 points — un insecte, une par 120)
  {
    const canon = { id: 'canon', cadence: 0.3, degats: 10, portee: 120, vitesse: 400, vie: 1, dispersion: 0, guide: false, infaillible: true }
    const cfg = { ...base, armes: [canon], forage: { ...VAISSEAU.forage, aimant: 0 } }
    const w = nouveauMonde(cfg, 5)
    w.ennemis.push(roche(1, 80, 200, 0, 0, 5))
    let eclat = false
    let pepites = 0
    for (let i = 0; i < 60 * 2 && !eclat; i++) {
      w.vaisseau = { ...w.vaisseau, x: 0, y: 200, vx: 0, vy: 0 }
      const ev = avancerLeMonde(cfg, w, 1 / 60, { x: 0, y: 0 }).evenements
      if (ev.some((e) => e.type === 'eclat')) (eclat = true), (pepites = valeurDes(w.pepites))
    }
    verifier(`abattue, la roche éclate et rend ${pepites} points de pépites (500 points : un par 60) — un insecte de 120 points en rend une`, eclat && pepites === Math.round(500 / 60))
  }
  // (elle heurte le vaisseau : il rebondit et perd `choc` unités de vie, une fois ; elle ne dévie pas)
  {
    const cfg = { ...base, coque: 5 }
    const w = nouveauMonde(cfg, 5)
    w.vaisseau = { ...w.vaisseau, x: 0, y: 200 }
    const r = roche(1, 60, 200, -40, 0, 500)
    w.ennemis.push(r)
    for (let i = 0; i < 60 * 2; i++) avancerLeMonde(cfg, w, 1 / 60, { x: 0, y: 0 })
    verifier(`une roche qui dérive heurte le vaisseau : ${5 - w.coque} points de coque perdus (deux), il est repoussé, elle garde sa course`, w.coque === 5 - VAISSEAU.derive.choc && r.corps.vx === -40 && w.vaisseau.x < -10)
  }
}

// SANS PORTAIL (Keko, 20/11 : « on est vraiment sur un Vampire Survivors-like ») : les insectes naissent hors de vue
// AUTOUR DU VAISSEAU et foncent sur lui ; ils évitent les roches qui dérivent, et s'ils en heurtent une, tous deux en
// souffrent ; les roches traversent le champ autour de lui
{
  const roche = (id: number, x: number, y: number): Ennemi => ({ id, corps: { ...nouveauVaisseau(), x, y }, pv: 500, fait: 'marche', roche: null, forage: null, tirA: 0, butin: 0, cargaison: { fer: 0, or: 0, cristal: 0 }, grand: true, asteroide: { rayon: 10, graine: 1, angle0: 0, vitesseAngulaire: 0, pvMax: 500 } })
  const base = { ...VAISSEAU, coque: 1e6, champ: { ...VAISSEAU.champ, densite: 0 }, station: { ...VAISSEAU.station, portee: -1 }, invasion: { ...VAISSEAU.invasion, active: true, sansPortail: true, premiere: 0.1 }, ennemi: { ...VAISSEAU.ennemi, pv: 120, butinRendu: 1, apparait: 1e9, poussee: 90, vitesseMax: 40, rotation: 6, rayon: 5 } }
  // (ils naissent sur le cercle de naissance autour du vaisseau, loin du centre du monde, et le chassent aussitôt)
  {
    const w = nouveauMonde(base, 5)
    w.vaisseau = { ...w.vaisseau, x: 2000, y: -1500 }
    const nes: { d: number; fait: string }[] = []
    for (let i = 0; i < 60 * 3; i++) {
      for (const e of avancerLeMonde(base, w, 1 / 60, { x: 0, y: 0 }).evenements) if (e.type === 'ennemiApparait') {
        const en = w.ennemis.find((x) => x.id === e.id)!
        nes.push({ d: Math.hypot(e.x - w.vaisseau.x, e.y - w.vaisseau.y), fait: en.fait })
      }
      w.vaisseau = { ...w.vaisseau, x: 2000, y: -1500, vx: 0, vy: 0 }
    }
    const d0 = w.ennemis.length > 0 ? Math.min(...w.ennemis.map((e) => Math.hypot(e.corps.x - 2000, e.corps.y + 1500))) : 0
    for (let i = 0; i < 60 * 4; i++) {
      avancerLeMonde(base, w, 1 / 60, { x: 0, y: 0 })
      w.vaisseau = { ...w.vaisseau, x: 2000, y: -1500, vx: 0, vy: 0 }
    }
    const d1 = Math.min(...w.ennemis.map((e) => Math.hypot(e.corps.x - 2000, e.corps.y + 1500)))
    verifier(`sans portail, ${nes.length} insectes naissent à ${Math.round(nes[0]?.d ?? 0)} du vaisseau (hors de vue), en chasse, et foncent sur lui (le plus proche de ${Math.round(d0)} à ${Math.round(d1)})`, nes.length > 0 && nes.every((n) => Math.abs(n.d - VAISSEAU.invasion.naissance) < 1 && n.fait === 'aggro') && d1 < d0 - 100)
  }
  // (une roche entre l'insecte et le vaisseau : il la contourne, sans la toucher)
  {
    const cfg = { ...base, invasion: { ...base.invasion, premiere: 1e9 } }
    const w = nouveauMonde(cfg, 5)
    w.vaisseau = { ...w.vaisseau, x: 200, y: 0 }
    const r = roche(1, 100, 0)
    const ins: Ennemi = { id: 2, corps: { ...nouveauVaisseau(), x: 0, y: 0.5 }, pv: 120, fait: 'aggro', roche: null, forage: null, tirA: 0, butin: 0, cargaison: { fer: 0, or: 0, cristal: 0 } }
    w.ennemis.push(r, ins)
    let auPlusPres = Infinity
    for (let i = 0; i < 60 * 8; i++) {
      w.vaisseau = { ...w.vaisseau, x: 200, y: 0, vx: 0, vy: 0 }
      r.corps = { ...r.corps, x: 100, y: 0, vx: 0, vy: 0 }
      avancerLeMonde(cfg, w, 1 / 60, { x: 0, y: 0 })
      auPlusPres = Math.min(auPlusPres, Math.hypot(ins.corps.x - 100, ins.corps.y))
    }
    verifier(`une roche entre lui et le vaisseau : l’insecte la contourne (au plus près ${auPlusPres.toFixed(1)} de son centre, elle fait 10, lui 5), sans la heurter, et arrive au vaisseau`, auPlusPres > 15 && ins.heurteA === undefined && r.pv === 500 && Math.hypot(ins.corps.x - 200, ins.corps.y) < 20)
  }
  // (poussé dans une roche, il la heurte : tous deux perdent 60, une fois)
  {
    const cfg = { ...base, invasion: { ...base.invasion, premiere: 1e9 } }
    const w = nouveauMonde(cfg, 5)
    w.vaisseau = { ...w.vaisseau, x: 600, y: 600 }
    const r = roche(1, 100, 0)
    const ins: Ennemi = { id: 2, corps: { ...nouveauVaisseau(), x: 92, y: 0 }, pv: 120, fait: 'aggro', roche: null, forage: null, tirA: 0, butin: 0, cargaison: { fer: 0, or: 0, cristal: 0 } }
    w.ennemis.push(r, ins)
    for (let i = 0; i < 20; i++) {
      w.vaisseau = { ...w.vaisseau, x: 600, y: 600, vx: 0, vy: 0 }
      r.corps = { ...r.corps, x: 100, y: 0, vx: 0, vy: 0 }
      avancerLeMonde(cfg, w, 1 / 60, { x: 0, y: 0 })
    }
    verifier(`un insecte entré dans une roche la heurte : il en est sorti, et il perd ${VAISSEAU.derive.chocInsecte}, elle rien (Keko, 21/11) (lui ${120 - ins.pv}, elle ${500 - r.pv}), une fois`, ins.pv === 120 - VAISSEAU.derive.chocInsecte && r.pv === 500 && Math.hypot(ins.corps.x - 100, ins.corps.y) >= 15 - 1e-6)
  }
  // (les roches traversent le champ autour du vaisseau)
  {
    const cfg = { ...base, invasion: { ...base.invasion, premiere: 1e9 }, derive: { ...VAISSEAU.derive, active: true, premier: 0.1, tousMin: 0.5, tousMax: 0.5, max: 3 } }
    const w = nouveauMonde(cfg, 5)
    w.vaisseau = { ...w.vaisseau, x: -3000, y: 2500 }
    for (let i = 0; i < 60 * 2; i++) {
      avancerLeMonde(cfg, w, 1 / 60, { x: 0, y: 0 })
      w.vaisseau = { ...w.vaisseau, x: -3000, y: 2500, vx: 0, vy: 0 }
    }
    verifier('sans portail, les roches naissent autour du vaisseau, où qu’il soit', w.ennemis.length === 3 && w.ennemis.every((e) => Math.hypot(e.corps.x + 3000, e.corps.y - 2500) < VAISSEAU.invasion.naissance + VAISSEAU.derive.marge + 1))
  }
}

// LE FLOT CONTINU (Keko, 20/11 : « pas de vagues : un spawn continu, de plus en plus soutenu ») : tout autour du vaisseau,
// un rythme qui monte avec le temps, un plafond d'insectes vivants
{
  const cfg = { ...VAISSEAU, coque: 1e9, champ: { ...VAISSEAU.champ, densite: 0 }, station: { ...VAISSEAU.station, portee: -1 }, invasion: { ...VAISSEAU.invasion, active: true, sansPortail: true, premiere: 0, continu: { ...VAISSEAU.invasion.continu, actif: true } }, ennemi: { ...VAISSEAU.ennemi, pv: 1e9, apparait: 1e9 } }
  const w = nouveauMonde(cfg, 5)
  const nes: number[] = []
  const angles: number[] = []
  for (let i = 0; i < 60 * 300; i++) {
    for (const e of avancerLeMonde(cfg, w, 1 / 60, { x: 0, y: 0 }).evenements) if (e.type === 'ennemiApparait') nes.push(w.t), angles.push(Math.atan2(e.y - w.vaisseau.y, e.x - w.vaisseau.x))
    // (le vaisseau ne bouge pas, et rien ne le blesse : on ne garde que les naissances ; les insectes sont retirés)
    w.ennemis = w.ennemis.filter((e) => e.id < 0)
    w.vaisseau = { ...w.vaisseau, x: 0, y: 0, vx: 0, vy: 0 }
  }
  const entre = (a: number, b: number): number => nes.filter((x) => x >= a && x < b).length
  const cadrans = new Set(angles.map((a) => Math.floor(((a + Math.PI) / (Math.PI / 2)) % 4)))
  const vivants = (() => {
    const w2 = nouveauMonde(cfg, 5)
    for (let i = 0; i < 60 * 200; i++) {
      avancerLeMonde(cfg, w2, 1 / 60, { x: 0, y: 0 })
      w2.vaisseau = { ...w2.vaisseau, x: 5000, y: 5000, vx: 0, vy: 0 }
    }
    return w2.ennemis.length
  })()
  verifier(`le flot continu : ${entre(0, 60)} insectes la première minute, ${entre(120, 180)} la troisième, ${entre(240, 300)} la cinquième ; tout autour (${cadrans.size} cadrans) ; jamais plus de 120 en vie (${vivants})`, entre(0, 60) >= 25 && entre(0, 60) <= 50 && entre(120, 180) > entre(0, 60) * 2 && entre(240, 300) > entre(120, 180) && cadrans.size === 4 && vivants === 120)
}

// FUIR NE SERT À RIEN (Keko, 20/11) : un vaisseau qui file tout droit à pleine vitesse garde la meute autour de lui —
// les naissances devant lui, les traînards qui reviennent devant ; sans ces deux règles, il la sème
{
  const avec = { ...VAISSEAU, coque: 1e9, champ: { ...VAISSEAU.champ, densite: 0 }, station: { ...VAISSEAU.station, portee: -1 }, invasion: { ...VAISSEAU.invasion, active: true, sansPortail: true, premiere: 0, morsure: 0, continu: { ...VAISSEAU.invasion.continu, actif: true } }, ennemi: { ...VAISSEAU.ennemi, pv: 1e9, apparait: 1e9, poussee: 90, vitesseMax: 40, rotation: 6, rayon: 5 } }
  const sans = { ...avec, invasion: { ...avec.invasion, continu: { ...avec.invasion.continu, devant: 0, recycle: Infinity } } }
  const autour = (cfg: ConfigVaisseau): number => {
    const w = nouveauMonde(cfg, 5)
    let somme = 0
    let n = 0
    for (let i = 0; i < 60 * 90; i++) {
      w.vaisseau = { ...w.vaisseau, x: (i / 60) * 100, y: 0, vx: 100, vy: 0 }
      avancerLeMonde(cfg, w, 1 / 60, { x: 0, y: 0 })
      w.vaisseau = { ...w.vaisseau, x: (i / 60) * 100, y: 0, vx: 100, vy: 0 }
      if (i >= 60 * 30 && i % 30 === 0) (somme += w.ennemis.filter((e) => Math.hypot(e.corps.x - w.vaisseau.x, e.corps.y) <= 300).length), n++
    }
    return somme / n
  }
  const a = autour(avec)
  const s0 = autour(sans)
  verifier(`fuir ne sert à rien : filant tout droit à 100, il a en moyenne ${a.toFixed(1)} insectes à moins de 300 (${s0.toFixed(1)} sans les deux règles)`, a > 3 * s0 && a > 5)
}

// L'ARÈNE ET SA TEMPÊTE (Keko, 20/11) : l'énergie ronge, les roches de la tempête frappent, le bord retient, et rien ne
// naît dans la tempête
{
  const base = { ...VAISSEAU, coque: 5, champ: { ...VAISSEAU.champ, densite: 0 }, station: { ...VAISSEAU.station, portee: -1 }, invasion: { ...VAISSEAU.invasion, active: true, sansPortail: true, premiere: 1e9 }, ennemi: { ...VAISSEAU.ennemi, apparait: 1e9, rayon: 5 }, arene: { ...VAISSEAU.arene, active: true } }
  const A = VAISSEAU.arene
  // (l'énergie : dans la tempête, sans roche, il perd `dps` par seconde ; dans l'arène, rien)
  const ronge = (x: number): number => {
    const cfg = { ...base, arene: { ...base.arene, roches: 0 } }
    const w = nouveauMonde(cfg, 3)
    for (let i = 0; i < 120; i++) {
      w.vaisseau = { ...w.vaisseau, x, y: 0, vx: 0, vy: 0 }
      avancerLeMonde(cfg, w, 1 / 60, { x: 0, y: 0 })
    }
    return 5 - w.coque
  }
  const dedans = ronge(A.rayon - 50)
  const tempete = ronge(A.rayon + 50)
  // (le bord : poussé au-delà, il est retenu au bord extérieur)
  const cfgB = { ...base, arene: { ...base.arene, roches: 0, dps: 0 } }
  const wb = nouveauMonde(cfgB, 3)
  wb.vaisseau = { ...wb.vaisseau, x: A.rayon + A.largeur + 80, y: 0, vx: 50, vy: 0 }
  avancerLeMonde(cfgB, wb, 1 / 60, { x: 1, y: 0 })
  // (les roches : posé au milieu de la tempête, une roche finit par le heurter)
  const cfgR = { ...base, coque: 1000, arene: { ...base.arene, dps: 0 } }
  const wr = nouveauMonde(cfgR, 3)
  let heurte = false
  for (let i = 0; i < 60 * 20 && !heurte; i++) {
    wr.vaisseau = { ...wr.vaisseau, x: 0, y: A.rayon + A.largeur * 0.5, vx: 0, vy: 0 }
    if (avancerLeMonde(cfgR, wr, 1 / 60, { x: 0, y: 0 }).chocs.length > 0) heurte = true
  }
  // (les naissances : le vaisseau au bord de l'arène, aucun insecte ne naît dans la tempête)
  const cfgN = { ...base, coque: 1e9, invasion: { ...base.invasion, premiere: 0, continu: { ...VAISSEAU.invasion.continu, actif: true } }, ennemi: { ...base.ennemi, pv: 1e9 }, arene: { ...base.arene, roches: 0, dps: 0 } }
  const wn = nouveauMonde(cfgN, 3)
  let horsArene = 0
  let nes = 0
  for (let i = 0; i < 60 * 30; i++) {
    wn.vaisseau = { ...wn.vaisseau, x: A.rayon - 40, y: 0, vx: 0, vy: 0 }
    for (const e of avancerLeMonde(cfgN, wn, 1 / 60, { x: 0, y: 0 }).evenements) if (e.type === 'ennemiApparait') (nes += 1), (horsArene += Math.hypot(e.x, e.y) > A.rayon - A.marge + 0.01 ? 1 : 0)
  }
  verifier(`l’arène : dans la tempête, l’énergie ronge ${tempete.toFixed(2)} en 2 s (${A.dps} par seconde), rien dans l’arène (${dedans}) ; poussé au-delà, il est retenu au bord (${Math.round(Math.hypot(wb.vaisseau.x, wb.vaisseau.y))}) ; une roche de la tempête le heurte ; ${nes} insectes nés au bord de l’arène, aucun dans la tempête (${horsArene})`, Math.abs(tempete - 2 * A.dps) < 0.05 && dedans === 0 && Math.abs(Math.hypot(wb.vaisseau.x, wb.vaisseau.y) - (A.rayon + A.largeur)) < 0.5 && heurte && wr.coque < 1000 && nes > 10 && horsArene === 0)
}

// LE TRAÎNARD NE REVIENT PAS EN CERCLE (Keko, 20/11 : « quand je respawn, tout un cercle d'ennemis apparaît autour de
// moi ») : une meute restée loin d'un vaisseau à l'arrêt revient DE SON CÔTÉ, à des distances étalées
{
  const cfg = { ...VAISSEAU, coque: 1e9, champ: { ...VAISSEAU.champ, densite: 0 }, station: { ...VAISSEAU.station, portee: -1 }, invasion: { ...VAISSEAU.invasion, active: true, sansPortail: true, premiere: 1e9, morsure: 0, continu: { ...VAISSEAU.invasion.continu, actif: true } }, ennemi: { ...VAISSEAU.ennemi, pv: 1e9, apparait: 1e9, rayon: 5 } }
  const w = nouveauMonde(cfg, 5)
  w.invasion.prochainA = 1e9
  for (let k = 0; k < 40; k++) w.ennemis.push({ id: 100 + k, corps: { ...nouveauVaisseau(), x: 700 + (k % 8) * 6, y: 200 + Math.floor(k / 8) * 6 }, pv: 1e9, fait: 'aggro', roche: null, forage: null, tirA: 1e9, butin: 0, cargaison: { fer: 0, or: 0, cristal: 0 } })
  avancerLeMonde(cfg, w, 1 / 60, { x: 0, y: 0 })
  const secteurs = new Set(w.ennemis.map((e) => Math.floor(((Math.atan2(e.corps.y, e.corps.x) + Math.PI) / (2 * Math.PI)) * 8) % 8))
  const d = w.ennemis.map((e) => Math.hypot(e.corps.x, e.corps.y))
  const etale = Math.max(...d) - Math.min(...d)
  verifier(`la meute revient de son côté : ${secteurs.size} secteurs sur 8, des distances étalées sur ${etale.toFixed(0)} (toutes sous ${VAISSEAU.invasion.continu.recycle})`, secteurs.size <= 3 && etale > 30 && Math.max(...d) < VAISSEAU.invasion.continu.recycle)
}

// LA TEMPÊTE RETIENT CE QUI S'Y ENFONCE (Keko, 21/11 : « de plus en plus ralentis du moment qu'ils vont vers
// l'extérieur, pour empêcher de sortir de l'autre côté ») : poussé tout droit vers le dehors, le vaisseau ralentit à
// mesure qu'il entre et n'atteint jamais le bord ; il revient vers l'arène à pleine vitesse
{
  const cfg = { ...VAISSEAU, coque: 1e9, champ: { ...VAISSEAU.champ, densite: 0 }, station: { ...VAISSEAU.station, portee: -1 }, arene: { ...VAISSEAU.arene, active: true, dps: 0, roches: 0 } }
  const w = nouveauMonde(cfg, 5)
  w.vaisseau = { ...w.vaisseau, x: cfg.arene.rayon - 60, y: 0, cap: 0 }
  let rMax = 0
  let vMilieu = -1
  for (let i = 0; i < 60 * 30; i++) {
    avancerLeMonde(cfg, w, 1 / 60, { x: 1, y: 0 })
    const r = Math.hypot(w.vaisseau.x, w.vaisseau.y)
    rMax = Math.max(rMax, r)
    if (vMilieu < 0 && r >= cfg.arene.rayon + (cfg.arene.largeur * cfg.arene.retenue) / 2) vMilieu = w.vaisseau.vx
  }
  const avant = w.vaisseau.x
  let vRetour = 0
  for (let i = 0; i < 60 * 3; i++) {
    avancerLeMonde(cfg, w, 1 / 60, { x: -1, y: 0 })
    vRetour = Math.min(vRetour, w.vaisseau.vx)
  }
  const bord = cfg.arene.rayon + cfg.arene.largeur
  verifier(`la tempête retient : poussé dehors 30 s, il s'arrête à ${Math.round(rMax)} (la tempête de ${cfg.arene.rayon} à ${bord}), à ${Math.round(vMilieu)} à mi-chemin (pointe ${cfg.vitesseMax}) ; il en revient à ${Math.round(-vRetour)}`, rMax <= cfg.arene.rayon + cfg.arene.largeur * cfg.arene.retenue + 1 && vMilieu > 0 && vMilieu < cfg.vitesseMax * 0.6 && w.vaisseau.x < avant - 50 && -vRetour > cfg.vitesseMax * 0.8)
}

// ABATTU, LES ROCHES SE COMPTENT DEPUIS LE POINT DE RETOUR (Keko, 21/11 : « un astéroïde passait au même endroit que le
// compteur et disparaissait ») — depuis le même jour, l'épave elle-même, là où l'on revient et où est la caméra : une
// roche qui passe près d'elle reste ; celle qui s'en éloigne au-delà finit par partir
{
  const cfg = { ...VAISSEAU, champ: { ...VAISSEAU.champ, densite: 0 }, station: { ...VAISSEAU.station, portee: -1 }, invasion: { ...VAISSEAU.invasion, active: true, sansPortail: true, premiere: 1e9, penalite: 1e9 }, derive: { ...VAISSEAU.derive, active: true, premier: 1e9 } }
  const roche = (id: number, x: number, vx: number): Ennemi => ({ id, corps: { ...nouveauVaisseau(), x, y: 0, vx, vy: 0 }, pv: 500, fait: 'marche', roche: null, forage: null, tirA: 0, butin: 0, cargaison: { fer: 0, or: 0, cristal: 0 }, grand: true, asteroide: { rayon: 10, graine: 1, angle0: 0, vitesseAngulaire: 0, pvMax: 500 } })
  const w = nouveauMonde(cfg, 5)
  w.prochaineDeriveA = 1e9
  w.vaisseau = { ...w.vaisseau, x: 800, y: 0 }
  w.phase = 'perdu'
  w.invasion.retourA = 1e9
  const auCentre = roche(1, 800, -30)
  const auLoin = roche(2, 1100, 40)
  w.ennemis.push(auCentre, auLoin)
  for (let i = 0; i < 60 * 5; i++) avancerLeMonde(cfg, w, 1 / 60, { x: 0, y: 0 })
  verifier(`abattu, les roches se comptent depuis le point de retour : celle qui passe au centre reste (${w.ennemis.includes(auCentre)}), celle qui s'en va au-delà part (${!w.ennemis.includes(auLoin)})`, w.ennemis.includes(auCentre) && !w.ennemis.includes(auLoin))
}

// LE RETOUR LÀ OÙ L'ON EST TOMBÉ (Keko, 21/11 : « respawn là où il est mort ; mort dans le vortex, au coin de la zone le
// plus proche ; les ennemis de la zone détruits, à part les boss ; deux secondes d'invincibilité où il traverse tout ; à la
// fin, pas bloqué dans un ennemi ») : abattu dans la tempête, il revient en deçà d'elle ; l'explosion abat les insectes
// proches (leur expérience tombe), épargne les plus loin et les roches ; invincible, il passe au travers ; à la fin, rien
// ne le recouvre
{
  const cfg = { ...VAISSEAU, coque: 5, champ: { ...VAISSEAU.champ, densite: 0 }, station: { ...VAISSEAU.station, portee: -1 }, invasion: { ...VAISSEAU.invasion, active: true, sansPortail: true, premiere: 1e9 }, arene: { ...VAISSEAU.arene, active: true, dps: 0, roches: 0 }, ennemi: { ...VAISSEAU.ennemi, pv: 120, butinRendu: 1, apparait: 1e9, rayon: 5 }, forage: { ...VAISSEAU.forage, aimant: 0 } }
  const insecte = (id: number, x: number, y: number): Ennemi => ({ id, corps: { ...nouveauVaisseau(), x, y }, pv: 120, fait: 'aggro', roche: null, forage: null, tirA: 1e9, butin: 0, cargaison: { fer: 0, or: 0, cristal: 0 } })
  const w = nouveauMonde(cfg, 5)
  w.invasion.prochainA = 1e9
  w.vaisseau = { ...w.vaisseau, x: 1100, y: 0 }
  w.phase = 'perdu'
  w.coque = 0
  w.invasion.retourA = w.t + 0.5
  const ici = cfg.arene.rayon - cfg.invasion.retour.marge
  const pres = [insecte(100, ici - 40, 30), insecte(101, ici + 20, -40), insecte(102, ici - 80, 0)]
  const loin = insecte(103, ici - 240, 0)
  const roche: Ennemi = { id: 200, corps: { ...nouveauVaisseau(), x: ici + 5, y: 0 }, pv: 500, fait: 'marche', roche: null, forage: null, tirA: 0, butin: 0, cargaison: { fer: 0, or: 0, cristal: 0 }, grand: true, asteroide: { rayon: 10, graine: 1, angle0: 0, vitesseAngulaire: 0, pvMax: 500 } }
  w.ennemis.push(...pres, loin, roche)
  let deflagration = false
  for (let i = 0; i < 36; i++) for (const e of avancerLeMonde(cfg, w, 1 / 60, { x: 0, y: 0 }).evenements) if (e.type === 'deflagration') deflagration = true
  const ou = { x: w.vaisseau.x, y: w.vaisseau.y }
  const abattus = pres.every((e) => !w.ennemis.includes(e))
  const epargnes = w.ennemis.includes(loin) && w.ennemis.includes(roche)
  const pepites = w.pepites.length
  // (un insecte posé sur lui : il ne mord pas, et le vaisseau passe au travers de la roche)
  const colle = insecte(104, ou.x, ou.y)
  w.ennemis.push(colle)
  const coque0 = w.coque
  let mordu = false
  for (let i = 0; i < 60 * 1.9; i++) {
    avancerLeMonde(cfg, w, 1 / 60, { x: 0, y: 0 })
    colle.corps = { ...colle.corps, x: w.vaisseau.x, y: w.vaisseau.y }
    if (w.coque < coque0) mordu = true
  }
  for (let i = 0; i < 12; i++) avancerLeMonde(cfg, w, 1 / 60, { x: 0, y: 0 })
  const libre = Math.hypot(colle.corps.x - w.vaisseau.x, colle.corps.y - w.vaisseau.y) >= cfg.rayon + cfg.ennemi.rayon && Math.hypot(roche.corps.x - w.vaisseau.x, roche.corps.y - w.vaisseau.y) >= cfg.rayon + 10
  verifier(`le retour : tombé à 1 100, il revient à ${Math.round(ou.x)} (en deçà de la tempête, ${ici}) ; l'explosion (${deflagration}) abat les trois proches (${abattus}), épargne le lointain et la roche (${epargnes}), ${pepites} pépites tombent ; invincible deux secondes, rien ne le mord (${!mordu}) ; à la fin, rien ne le recouvre (${libre})`, Math.abs(ou.x - ici) < 1 && Math.abs(ou.y) < 1 && deflagration && abattus && epargnes && pepites >= 3 && !mordu && libre && (w.phase as string) === 'vol')
}

// ABATTU, LES INSECTES ERRENT (Keko, 21/11 : « pour éviter qu'ils se regroupent tous comme des idiots à l'endroit où on va
// respawn ») : trente insectes autour de l'épave ne s'y entassent pas en huit secondes
{
  const cfg = { ...VAISSEAU, champ: { ...VAISSEAU.champ, densite: 0 }, station: { ...VAISSEAU.station, portee: -1 }, invasion: { ...VAISSEAU.invasion, active: true, sansPortail: true, premiere: 1e9 }, ennemi: { ...VAISSEAU.ennemi, pv: 120, apparait: 1e9, poussee: 90, vitesseMax: 40, rotation: 6, rayon: 5 } }
  const compter = (errance: number): number => {
    const c2 = { ...cfg, invasion: { ...cfg.invasion, errance } }
    const w = nouveauMonde(c2, 5)
    w.invasion.prochainA = 1e9
    w.phase = 'perdu'
    w.invasion.retourA = 1e9
    for (let k = 0; k < 30; k++) {
      const a = (k / 30) * Math.PI * 2
      const d = 120 + 150 * ((k * 0.618) % 1)
      w.ennemis.push({ id: 100 + k, corps: { ...nouveauVaisseau(), x: Math.cos(a) * d, y: Math.sin(a) * d }, pv: 120, fait: 'aggro', roche: null, forage: null, tirA: 1e9, butin: 0, cargaison: { fer: 0, or: 0, cristal: 0 } })
    }
    for (let i = 0; i < 60 * 8; i++) avancerLeMonde(c2, w, 1 / 60, { x: 0, y: 0 })
    return w.ennemis.filter((e) => Math.hypot(e.corps.x - w.vaisseau.x, e.corps.y - w.vaisseau.y) < 50).length
  }
  const errent = compter(cfg.invasion.errance)
  verifier(`abattu, les insectes errent : au bout de 8 s, ${errent} sur 30 à moins de 50 de l'épave`, errent <= 3)
}

// LA ROCHE PRISE PAR LA TEMPÊTE (Keko, 21/11 : « pris dans la tempête, il se déplace comme les autres astéroïdes ; son
// verrouillage supprimé ; invincible, ni ciblable ni destructible, inerte ; on le fait disparaître hors de vue ») : entrée
// dans la tempête, elle quitte les ennemis, son verrou tombe ; elle tourne, vers le milieu de l'anneau ; aucun tir ne
// l'entame ; hors de vue, elle quitte le monde
{
  const canon = { id: 'canon', cadence: 0.2, degats: 10, portee: 400, vitesse: 400, vie: 2, dispersion: 0, guide: false, infaillible: true }
  const cfg = { ...VAISSEAU, coque: 1e9, armes: [canon], champ: { ...VAISSEAU.champ, densite: 0 }, station: { ...VAISSEAU.station, portee: -1 }, invasion: { ...VAISSEAU.invasion, active: true, sansPortail: true, premiere: 1e9 }, arene: { ...VAISSEAU.arene, active: true, dps: 0, roches: 0 }, derive: { ...VAISSEAU.derive, active: true, premier: 1e9 } }
  const w = nouveauMonde(cfg, 5)
  w.invasion.prochainA = 1e9
  w.prochaineDeriveA = 1e9
  w.vaisseau = { ...w.vaisseau, x: 900, y: 0 }
  const roche: Ennemi = { id: 300, corps: { ...nouveauVaisseau(), x: 990, y: 0, vx: 40, vy: 0 }, pv: 500, fait: 'marche', roche: null, forage: null, tirA: 0, butin: 0, cargaison: { fer: 0, or: 0, cristal: 0 }, grand: true, asteroide: { rayon: 10, graine: 1, angle0: 0, vitesseAngulaire: 0, pvMax: 500 } }
  w.ennemis.push(roche)
  verrouiller(w, 300)
  const verrouillee = w.verrou === 300
  let rMin = Infinity
  let rMax = 0
  let tourne = false
  let partieA = -1
  let tirs = 0
  let vue = false
  let quitte = false
  let verrouTombe = false
  for (let i = 0; i < 60 * 12; i++) {
    const evs = avancerLeMonde(cfg, w, 1 / 60, { x: 0, y: 0 }).evenements
    if (vue) tirs += evs.filter((e) => e.type === 'ennemiTouche').length
    w.vaisseau = { ...w.vaisseau, x: 900, y: 0, vx: 0, vy: 0 }
    const r = w.rochesPrises.find((x) => x.id === 300)
    if (r === undefined) {
      if (vue) {
        partieA = w.t
        break
      }
      continue
    }
    if (!vue) (vue = true), (quitte = !w.ennemis.includes(roche)), (verrouTombe = w.verrou === null)
    const rr = Math.hypot(r.x, r.y)
    if (w.t > 1) (rMin = Math.min(rMin, rr)), (rMax = Math.max(rMax, rr))
    if (r.y > 50) tourne = true
  }
  const milieu = cfg.arene.rayon + cfg.arene.largeur / 2
  verifier(`la roche prise par la tempête : verrouillée (${verrouillee}), elle quitte les ennemis (${quitte}) et son verrou tombe (${verrouTombe}) ; aucun tir ne la touche (${tirs}) ; elle tourne (${tourne}) dans la tempête, vers le milieu de l'anneau (${Math.round(rMin)}–${Math.round(rMax)}, milieu ${milieu}) ; hors de vue, elle part (à ${partieA.toFixed(1)} s)`, verrouillee && quitte && verrouTombe && tirs === 0 && tourne && rMin > cfg.arene.rayon && rMax <= milieu + 1 && partieA > 0 && partieA < 12)
}

// ABATTU, LE MANCHE DÉPLACE LA ZONE DE RETOUR (Keko, 21/11 : « que le joueur puisse déplacer la zone comme il déplace son
// vaisseau, plus lentement ») : poussée deux secondes vers la droite, elle avance de deux fois `retour.vitesse` ; on revient
// là où elle est
{
  const cfg = { ...VAISSEAU, champ: { ...VAISSEAU.champ, densite: 0 }, station: { ...VAISSEAU.station, portee: -1 }, invasion: { ...VAISSEAU.invasion, active: true, sansPortail: true, premiere: 1e9 }, arene: { ...VAISSEAU.arene, active: true, dps: 0, roches: 0 } }
  const w = nouveauMonde(cfg, 5)
  w.invasion.prochainA = 1e9
  w.vaisseau = { ...w.vaisseau, x: 100, y: 0 }
  w.phase = 'perdu'
  w.coque = 0
  w.invasion.retourA = w.t + 2.5
  for (let i = 0; i < 60 * 2; i++) avancerLeMonde(cfg, w, 1 / 60, { x: 1, y: 0 })
  const fait = w.vaisseau.x - 100
  for (let i = 0; i < 60; i++) avancerLeMonde(cfg, w, 1 / 60, { x: 0, y: 0 })
  verifier(`abattu, le manche déplace la zone : ${Math.round(fait)} en deux secondes (${2 * cfg.invasion.retour.vitesse} attendus) ; il revient là (${Math.round(w.vaisseau.x)})`, Math.abs(fait - 2 * cfg.invasion.retour.vitesse) < 2 && (w.phase as string) === 'vol' && Math.abs(w.vaisseau.x - (100 + fait)) < 1)
}

// RIEN NE SE SUPERPOSE (Keko, 21/11 : « quand un astéroïde entre dans le vortex, des astéroïdes se superposent alors
// qu'ils ne devraient pas ») : les roches de la tempête ne se recouvrent jamais ; une roche prise ne recouvre aucune
// d'elles ; deux roches qui dérivent l'une vers l'autre rebondissent sans se traverser
{
  const cfg = { ...VAISSEAU, coque: 1e9, champ: { ...VAISSEAU.champ, densite: 0 }, station: { ...VAISSEAU.station, portee: -1 }, invasion: { ...VAISSEAU.invasion, active: true, sansPortail: true, premiere: 1e9 }, arene: { ...VAISSEAU.arene, active: true, dps: 0 }, derive: { ...VAISSEAU.derive, active: true, premier: 1e9 } }
  // (la tempête : toutes ses paires, à trois instants)
  let recouvrements = 0
  for (const t of [0, 13.7, 61.2]) {
    const l = Array.from({ length: cfg.arene.roches }, (_, k) => rocheDeLaTempete(cfg, k, t))
    for (let i = 0; i < l.length; i++) for (let j = i + 1; j < l.length; j++) if (Math.hypot(l[i].x - l[j].x, l[i].y - l[j].y) < l[i].rayon + l[j].rayon) recouvrements++
  }
  // (une roche prise : sa plus forte pénétration dans une roche de la tempête, sur six secondes)
  const roche = (id: number, x: number, y: number, vx: number, vy: number, rayon: number): Ennemi => ({ id, corps: { ...nouveauVaisseau(), x, y, vx, vy }, pv: 500, fait: 'marche', roche: null, forage: null, tirA: 0, butin: 0, cargaison: { fer: 0, or: 0, cristal: 0 }, grand: true, asteroide: { rayon, graine: 1, angle0: 0, vitesseAngulaire: 0, pvMax: 500 } })
  const w = nouveauMonde(cfg, 5)
  w.invasion.prochainA = 1e9
  w.prochaineDeriveA = 1e9
  w.vaisseau = { ...w.vaisseau, x: 600, y: 600 }
  w.ennemis.push(roche(300, 990 * Math.cos(0.7), 990 * Math.sin(0.7), 40 * Math.cos(0.7), 40 * Math.sin(0.7), 20))
  let penetration = 0
  let prise = false
  for (let i = 0; i < 60 * 6; i++) {
    avancerLeMonde(cfg, w, 1 / 60, { x: 0, y: 0 })
    w.vaisseau = { ...w.vaisseau, x: 600, y: 600, vx: 0, vy: 0 }
    const r = w.rochesPrises.find((x) => x.id === 300)
    if (r === undefined) continue
    prise = true
    for (let k = 0; k < cfg.arene.roches; k++) {
      const q = rocheDeLaTempete(cfg, k, w.t)
      penetration = Math.max(penetration, r.rayon + q.rayon - Math.hypot(r.x - q.x, r.y - q.y))
    }
  }
  // (deux roches qui dérivent l'une vers l'autre)
  const w2 = nouveauMonde(cfg, 5)
  w2.invasion.prochainA = 1e9
  w2.prochaineDeriveA = 1e9
  const a = roche(400, -60, 0, 40, 0, 15)
  const b = roche(401, 60, 0, -40, 0, 15)
  w2.ennemis.push(a, b)
  let dMin = Infinity
  for (let i = 0; i < 60 * 3; i++) {
    avancerLeMonde(cfg, w2, 1 / 60, { x: 0, y: 0 })
    if (w2.ennemis.includes(a) && w2.ennemis.includes(b)) dMin = Math.min(dMin, Math.hypot(a.corps.x - b.corps.x, a.corps.y - b.corps.y))
  }
  verifier(`rien ne se superpose : la tempête, ${recouvrements} recouvrement(s) entre ses roches ; une roche prise (${prise}) s'enfonce au plus de ${penetration.toFixed(1)} dans les siennes ; deux roches face à face, au plus près à ${dMin.toFixed(1)} (contact à 30), et elles repartent (${a.corps.vx.toFixed(0)}, ${b.corps.vx.toFixed(0)})`, recouvrements === 0 && prise && penetration <= 0.01 && dMin >= 29.5 && a.corps.vx < 0 && b.corps.vx > 0)
}

// LE CORNU, L'INSECTE DE MILIEU DE GAMME (Keko, 21/11) : aucun la première minute, puis une part qui monte jusqu'au
// cinquième ; trois fois la vie, une fois et demie la taille, plus lent ; il rend trois pépites
{
  const cfg = { ...VAISSEAU, coque: 1e9, champ: { ...VAISSEAU.champ, densite: 0 }, station: { ...VAISSEAU.station, portee: -1 }, invasion: { ...VAISSEAU.invasion, active: true, sansPortail: true, premiere: 0, continu: { ...VAISSEAU.invasion.continu, actif: true }, cuirassier: { ...VAISSEAU.invasion.cuirassier, part: 0 }, moucheron: { ...VAISSEAU.invasion.moucheron, part: 0 } }, ennemi: { ...VAISSEAU.ennemi, pv: 120, butinRendu: 1, apparait: 1e9, poussee: 90, vitesseMax: 40, rotation: 6, rayon: 5 }, forage: { ...VAISSEAU.forage, aimant: 0 } }
  const w = nouveauMonde(cfg, 5)
  const parMinute = [0, 0, 0, 0, 0, 0, 0]
  const nesParMinute = [0, 0, 0, 0, 0, 0, 0]
  let cornu: Ennemi | null = null
  for (let i = 0; i < 60 * 60 * 7; i++) {
    for (const e of avancerLeMonde(cfg, w, 1 / 60, { x: 0, y: 0 }).evenements)
      if (e.type === 'ennemiApparait') {
        const en = w.ennemis.find((x) => x.id === e.id)!
        const mn = Math.min(6, Math.floor(w.t / 60))
        nesParMinute[mn]++
        if (en.sorte === 'cornu') (parMinute[mn]++), (cornu ??= { ...en, corps: { ...en.corps } })
      }
    w.ennemis = w.ennemis.filter((e) => e.id < 0)
    w.vaisseau = { ...w.vaisseau, x: 0, y: 0, vx: 0, vy: 0 }
  }
  const part = (k: number): number => parMinute[k] / Math.max(1, nesParMinute[k])
  // (sa vitesse : un cornu et un petit lâchés côte à côte vers le vaisseau, deux secondes)
  const w2 = nouveauMonde(cfg, 5)
  w2.invasion.prochainA = 1e9
  const petit: Ennemi = { id: 500, corps: { ...nouveauVaisseau(), x: 200, y: 0 }, pv: 120, fait: 'aggro', roche: null, forage: null, tirA: 1e9, butin: 0, cargaison: { fer: 0, or: 0, cristal: 0 } }
  const gros: Ennemi = { ...petit, id: 501, corps: { ...nouveauVaisseau(), x: 200, y: 40 }, pv: 360, sorte: 'cornu' }
  w2.ennemis.push(petit, gros)
  for (let i = 0; i < 60 * 4; i++) avancerLeMonde(cfg, w2, 1 / 60, { x: 0, y: 0 })
  const vPetit = Math.hypot(petit.corps.vx, petit.corps.vy)
  const vGros = Math.hypot(gros.corps.vx, gros.corps.vy)
  // (son butin)
  const w3 = nouveauMonde(cfg, 5)
  w3.invasion.prochainA = 1e9
  w3.ennemis.push({ ...gros, id: 600, corps: { ...nouveauVaisseau(), x: 300, y: 300 }, pv: 1 })
  w3.ennemis[0].pv = -1
  for (let i = 0; i < 2; i++) avancerLeMonde({ ...cfg, armes: [{ id: 'canon', cadence: 0.01, degats: 10, portee: 1000, vitesse: 4000, vie: 1, dispersion: 0, guide: false, infaillible: true }] }, w3, 1 / 60, { x: 0, y: 0 })
  verifier(`le cornu : ${part(0) * 100}% la première minute, ${Math.round(part(2) * 100)}% la troisième, ${Math.round(part(5) * 100)}% la sixième ; ${cornu?.pv} points de vie (le petit 120), rayon ${rayonDe(cfg, cornu!)} (5), ${Math.round(vGros)} contre ${Math.round(vPetit)} de vitesse ; ${valeurDes(w3.pepites)} points de pépites (5,33 : 5 ou 6)`, part(0) === 0 && part(2) > 0.03 && part(2) < 0.12 && part(5) > 0.14 && part(5) < 0.27 && cornu?.pv === 480 && rayonDe(cfg, cornu!) === 7.5 && vGros < vPetit * 0.92 && valeurDes(w3.pepites) >= 5 && valeurDes(w3.pepites) <= 6)
}

// LE CUIRASSIER, L'INSECTE BLINDÉ (Keko, 21/11) : aucun avant trois minutes, puis une part qui monte jusqu'au vingt-
// cinquième vers la huitième ; dix fois la vie, 2,2 fois la taille, plus lent encore ; il rend dix pépites
{
  const cfg = { ...VAISSEAU, coque: 1e9, champ: { ...VAISSEAU.champ, densite: 0 }, station: { ...VAISSEAU.station, portee: -1 }, invasion: { ...VAISSEAU.invasion, active: true, sansPortail: true, premiere: 0 }, ennemi: { ...VAISSEAU.ennemi, pv: 120, butinRendu: 1, apparait: 1e9, poussee: 90, vitesseMax: 40, rotation: 6, rayon: 5 } }
  const p = (t: number): number => partDe(cfg, 'cuirassier', t)
  const petit: Ennemi = { id: 500, corps: { ...nouveauVaisseau(), x: 200, y: 0 }, pv: 120, fait: 'aggro', roche: null, forage: null, tirA: 1e9, butin: 0, cargaison: { fer: 0, or: 0, cristal: 0 } }
  const blinde: Ennemi = { ...petit, id: 501, corps: { ...nouveauVaisseau(), x: 200, y: 60 }, sorte: 'cuirassier' }
  const g = gabaritDInsecte(cfg, blinde)
  const w2 = nouveauMonde(cfg, 5)
  w2.invasion.prochainA = 1e9
  w2.ennemis.push(petit, blinde)
  for (let i = 0; i < 60 * 4; i++) avancerLeMonde(cfg, w2, 1 / 60, { x: 0, y: 0 })
  const vPetit = Math.hypot(petit.corps.vx, petit.corps.vy)
  const vBlinde = Math.hypot(blinde.corps.vx, blinde.corps.vy)
  verifier(`le cuirassier : ${p(150) * 100} % à 2 min 30, ${(p(330) * 100).toFixed(1)} % à 5 min 30, ${(p(600) * 100).toFixed(1)} % à 10 min ; ${120 * g.vie} points de vie, rayon ${rayonDe(cfg, blinde)}, ${Math.round(vBlinde)} contre ${Math.round(vPetit)} de vitesse, ${g.butin} pépites`, p(150) === 0 && Math.abs(p(330) - 0.02) < 1e-9 && p(600) === 0.04 && g.vie === 15 && Math.abs(rayonDe(cfg, blinde) - 11) < 1e-9 && vBlinde < vPetit * 0.75 && g.butin === 21)
}

// LE MOUCHERON, LE MENU FRETIN (Keko, 21/11) : un insecte sur trois dès le départ ; un quart de la vie, 0,6 fois la
// taille, plus rapide ; une pépite une fois sur deux
{
  const cfg = { ...VAISSEAU, coque: 1e9, champ: { ...VAISSEAU.champ, densite: 0 }, station: { ...VAISSEAU.station, portee: -1 }, invasion: { ...VAISSEAU.invasion, active: true, sansPortail: true, premiere: 0, continu: { ...VAISSEAU.invasion.continu, actif: true } }, ennemi: { ...VAISSEAU.ennemi, pv: 120, butinRendu: 1, apparait: 1e9, poussee: 90, vitesseMax: 40, rotation: 6, rayon: 5 } }
  const w = nouveauMonde(cfg, 5)
  let nes = 0
  let mouch = 0
  for (let i = 0; i < 60 * 50; i++) {
    for (const e of avancerLeMonde(cfg, w, 1 / 60, { x: 0, y: 0 }).evenements)
      if (e.type === 'ennemiApparait') {
        nes++
        if (w.ennemis.find((x) => x.id === e.id)?.sorte === 'moucheron') mouch++
      }
    w.ennemis = w.ennemis.filter((e) => e.id < 0)
    w.vaisseau = { ...w.vaisseau, x: 0, y: 0, vx: 0, vy: 0 }
  }
  const petit: Ennemi = { id: 500, corps: { ...nouveauVaisseau(), x: 200, y: 0 }, pv: 120, fait: 'aggro', roche: null, forage: null, tirA: 1e9, butin: 0, cargaison: { fer: 0, or: 0, cristal: 0 } }
  const mini: Ennemi = { ...petit, id: 501, corps: { ...nouveauVaisseau(), x: 200, y: 60 }, sorte: 'moucheron' }
  const g = gabaritDInsecte(cfg, mini)
  const w2 = nouveauMonde(cfg, 5)
  w2.invasion.prochainA = 1e9
  w2.ennemis.push(petit, mini)
  for (let i = 0; i < 60 * 4; i++) avancerLeMonde(cfg, w2, 1 / 60, { x: 0, y: 0 })
  const vPetit = Math.hypot(petit.corps.vx, petit.corps.vy)
  const vMini = Math.hypot(mini.corps.vx, mini.corps.vy)
  // (son butin : cent moucherons abattus)
  const cfg3 = { ...cfg, forage: { ...VAISSEAU.forage, aimant: 0 }, armes: [{ id: 'canon', cadence: 0.001, degats: 1e6, portee: 2000, vitesse: 1e5, vie: 1, dispersion: 0, guide: false, infaillible: true }] }
  const w3 = nouveauMonde(cfg3, 5)
  w3.invasion.prochainA = 1e9
  for (let k = 0; k < 100; k++) w3.ennemis.push({ ...mini, id: 1000 + k, corps: { ...nouveauVaisseau(), x: 300 + (k % 10) * 20, y: 300 + Math.floor(k / 10) * 20 } })
  for (let i = 0; i < 60 * 2; i++) avancerLeMonde(cfg3, w3, 1 / 60, { x: 0, y: 0 })
  verifier(`le moucheron : ${Math.round((100 * mouch) / nes)} % du flot, ${120 * g.vie} points de vie, rayon ${rayonDe(cfg, mini)}, ${Math.round(vMini)} contre ${Math.round(vPetit)} de vitesse ; cent abattus, ${w3.pepites.length} pépites (${w3.ennemis.length} restés)`, Math.abs(mouch / nes - 1 / 3) < 0.06 && g.vie * 120 === 30 && Math.abs(rayonDe(cfg, mini) - 3) < 1e-9 && vMini > vPetit * 1.15 && w3.ennemis.length === 0 && w3.pepites.length > 14 && w3.pepites.length < 37)
}

// LA TEMPÊTE FRAPPE LE BLINDAGE, DIRECTEMENT (Keko, 21/11 : « on ignore les boucliers bleus, les plaques ; on ne peut pas
// déclencher de déphasage ») : un vaisseau à bouclier, à plaques et sûr de se déphaser y perd son blindage, garde son
// bouclier et ses plaques, ne se déphase pas ; abattu, ses projectiles partent avec lui
{
  const cfg = { ...VAISSEAU, coque: 1000, uniteDeVie: 50, plaques: 3, bouclier: { ...VAISSEAU.bouclier, points: 100 }, dephasage: { chance: 1, duree: 0.5 }, champ: { ...VAISSEAU.champ, densite: 0 }, station: { ...VAISSEAU.station, portee: -1 }, invasion: { ...VAISSEAU.invasion, active: true, sansPortail: true, premiere: 1e9 }, arene: { ...VAISSEAU.arene, active: true, roches: 0 } }
  const w = nouveauMonde(cfg, 5)
  w.invasion.prochainA = 1e9
  w.vaisseau = { ...w.vaisseau, x: cfg.arene.rayon + 60, y: 0 }
  for (let i = 0; i < 60; i++) {
    avancerLeMonde(cfg, w, 1 / 60, { x: 0, y: 0 })
    w.vaisseau = { ...w.vaisseau, x: cfg.arene.rayon + 60, y: 0, vx: 0, vy: 0 }
  }
  const perte = 1000 - w.coque
  const attendu = cfg.arene.dps * cfg.uniteDeVie
  const intact = w.bouclier === 100 && w.plaques.every((x) => x) && w.dephaseJusque < w.t
  // (abattu : ses obus partent)
  const w2 = nouveauMonde(cfg, 5)
  w2.obus.push({ id: 900, x: 0, y: 0, vx: 100, vy: 0, vie: 5, degats: 1, guide: false, arme: 'canon' })
  w2.phase = 'perdu'
  w2.invasion.retourA = 1e9
  avancerLeMonde(cfg, w2, 1 / 60, { x: 0, y: 0 })
  verifier(`la tempête frappe le blindage : ${perte.toFixed(1)} perdus en une seconde (${attendu} attendus), bouclier, plaques et déphasage intacts (${intact}) ; abattu, ses obus partent (${w2.obus.length})`, Math.abs(perte - attendu) < 0.5 && intact && w2.obus.length === 0)
}

// AU RETOUR, LES PÉPITES ATTENDENT (Keko, 21/11 : « qu'on attende la fin de l'animation de respawn pour déclencher le
// magnétisme ») : celles que l'explosion sème restent où elles sont tant qu'il est invincible, puis viennent à lui
{
  const cfg = { ...VAISSEAU, champ: { ...VAISSEAU.champ, densite: 0 }, station: { ...VAISSEAU.station, portee: -1 }, invasion: { ...VAISSEAU.invasion, active: true, sansPortail: true, premiere: 1e9 }, ennemi: { ...VAISSEAU.ennemi, pv: 120, butinRendu: 1, apparait: 1e9, rayon: 5 } }
  const w = nouveauMonde(cfg, 5)
  w.invasion.prochainA = 1e9
  w.phase = 'perdu'
  w.coque = 0
  w.invasion.retourA = w.t + 0.1
  for (let k = 0; k < 8; k++) w.ennemis.push({ id: 100 + k, corps: { ...nouveauVaisseau(), x: Math.cos(k) * 30, y: Math.sin(k) * 30 }, pv: 120, fait: 'marche', roche: null, forage: null, tirA: 1e9, butin: 0, cargaison: { fer: 0, or: 0, cristal: 0 } })
  let semees = 0
  let pendant = -1
  for (let i = 0; i < 60 * 4; i++) {
    avancerLeMonde(cfg, w, 1 / 60, { x: 0, y: 0 })
    if (semees === 0 && w.pepites.length > 0) semees = w.pepites.length
    if (pendant < 0 && w.renaitJusque > -100 && w.t > w.renaitJusque - 0.1) pendant = w.invasion.xp
  }
  verifier(`au retour, les pépites attendent : ${semees} semées, ${pendant} ramassées pendant l'invincibilité, ${w.pepites.length} restées après, hors de l'aimant (niveau ${w.invasion.niveau}) — semées en gerbe, elles ont dérivé le temps d'attendre`, semees >= 8 && pendant === 0 && w.pepites.length <= 3 && w.invasion.niveau >= 2)
}

// LES TROIS PÉPITES ET L'AIMANT (Keko, 21/11 : « une petite, une moyenne, une grosse » — 1 / 3 / 10 ; « chaque ennemi a son
// butin propre » ; « un symbole d'aimant ; quand on le prend, ça attire toutes les pépites de la map » — 1 sur 300)
{
  const g = (n: number): string => gemmesDuButin(VAISSEAU, n).join('+')
  verifier(`le butin en gemmes, les plus grosses d'abord : 1 → ${g(1)}, 3 → ${g(3)}, 10 → ${g(10)}, 17 → ${g(17)}`, g(1) === '1' && g(3) === '3' && g(10) === '10' && g(17) === '10+3+3+1')
  const cfg = { ...VAISSEAU, champ: { ...VAISSEAU.champ, densite: 0 }, station: { ...VAISSEAU.station, portee: -1 }, invasion: { ...VAISSEAU.invasion, active: true, sansPortail: true, premiere: 1e9 }, ennemi: { ...VAISSEAU.ennemi, apparait: 1e9 }, derive: { ...VAISSEAU.derive, active: false } }
  const w = nouveauMonde(cfg, 5)
  w.invasion.prochainA = 1e9
  w.pepites.push({ id: 900, x: 0, y: 0, vx: 0, vy: 0, graine: 1, minerai: 'fer', valeur: 10 })
  avancerLeMonde(cfg, w, 1 / 60, { x: 0, y: 0 })
  verifier(`une grosse vaut 10 : ${w.invasion.xp} points au niveau ${w.invasion.niveau} (5 pour le niveau 2)`, w.invasion.niveau === 2 && w.invasion.xp === 5)
  const loin = [[600, 0], [-500, 300], [0, -700], [350, 450]]
  for (const [i, [x, y]] of loin.entries()) w.pepites.push({ id: 910 + i, x, y, vx: 0, vy: 0, graine: i, minerai: 'fer', valeur: 1 })
  w.pepites.push({ id: 920, x: 0, y: 0, vx: 0, vy: 0, graine: 9, minerai: 'fer', valeur: 0, aimant: true })
  let pris = false
  for (let i = 0; i < 60 * 8; i++) {
    const r = avancerLeMonde(cfg, w, 1 / 60, { x: 0, y: 0 })
    if (r.evenements.some((e) => e.type === 'aimant')) pris = true
  }
  verifier(`l'aimant pris, les pépites lointaines (jusqu'à 700) arrivent : ${w.pepites.length} restent, ${w.invasion.xp} points au niveau ${w.invasion.niveau} (9 depuis le niveau 2 à 5 : le 3 coûte 8)`, pris && w.pepites.length === 0 && w.invasion.niveau === 3 && w.invasion.xp === 1)
  // (la chance de l'aimant : sur mille insectes abattus, mesurée par le tirage de la règle)
  let aimants = 0
  for (let id = 1; id <= 3000; id++) if (tire(id, 35) < cfg.invasion.aimant) aimants++
  verifier(`l'aimant tombe une fois sur 300 environ : ${aimants} sur 3000`, aimants >= 4 && aimants <= 20)
}

// LES INSECTES ET LA TEMPÊTE (Keko, 21/11 : « il faut toujours que les ennemis évitent le vortex ; s'ils y vont, ils
// subissent les mêmes dégâts que le joueur ; un ennemi qui meurt dans le vortex ne lâche aucune pépite »)
{
  const cfg = { ...VAISSEAU, champ: { ...VAISSEAU.champ, densite: 0 }, station: { ...VAISSEAU.station, portee: -1 }, invasion: { ...VAISSEAU.invasion, active: true, sansPortail: true, premiere: 1e9 }, arene: { ...VAISSEAU.arene, active: true, roches: 0 }, ennemi: { ...VAISSEAU.ennemi, pv: 120, butinRendu: 1, apparait: 1e9, poussee: 90, vitesseMax: 40, rotation: 6, rayon: 5 }, derive: { ...VAISSEAU.derive, active: false } }
  // (le joueur abattu, vingt insectes errent une minute près du bord : aucun n'entre dans la tempête)
  const w = nouveauMonde(cfg, 3)
  w.invasion.prochainA = 1e9
  w.phase = 'perdu'
  w.coque = 0
  w.invasion.retourA = 1e9
  for (let k = 0; k < 20; k++) {
    const a = (k / 20) * Math.PI * 2
    w.ennemis.push({ id: 100 + k, corps: { ...nouveauVaisseau(), x: Math.cos(a) * (cfg.arene.rayon - 60), y: Math.sin(a) * (cfg.arene.rayon - 60) }, pv: 120, fait: 'aggro', roche: null, forage: null, tirA: 1e9, butin: 0, cargaison: { fer: 0, or: 0, cristal: 0 } })
  }
  let plusLoin = 0
  for (let i = 0; i < 60 * 60; i++) {
    avancerLeMonde(cfg, w, 1 / 60, { x: 0, y: 0 })
    for (const e of w.ennemis) plusLoin = Math.max(plusLoin, Math.hypot(e.corps.x, e.corps.y))
  }
  verifier(`le joueur abattu, vingt insectes errent une minute au bord de l'arène (${cfg.arene.rayon}) : le plus loin à ${Math.round(plusLoin)}, ${w.ennemis.length} restent`, plusLoin < cfg.arene.rayon && w.ennemis.length === 20)
  // (un insecte posé dans la tempête y perd ce que perd le joueur, et y meurt sans rien lâcher)
  const z = nouveauMonde(cfg, 3)
  z.invasion.prochainA = 1e9
  z.vaisseau = { ...z.vaisseau, x: 0, y: 0 }
  z.ennemis.push({ id: 200, corps: { ...nouveauVaisseau(), x: cfg.arene.rayon + 100, y: 0 }, pv: 120, fait: 'aggro', roche: null, forage: null, tirA: 1e9, butin: 0, cargaison: { fer: 0, or: 0, cristal: 0 } })
  avancerLeMonde(cfg, z, 1, { x: 0, y: 0 })
  const perdu = 120 - (z.ennemis[0]?.pv ?? 0)
  // (il ressort de lui-même : on ne lui laisse qu'un point, au fond de la tempête, pour le voir y mourir avant)
  if (z.ennemis[0] !== undefined) (z.ennemis[0].pv = 1), (z.ennemis[0].corps = { ...z.ennemis[0].corps, x: cfg.arene.rayon + 180, y: 0, vx: 0, vy: 0 })
  let mort = false
  for (let i = 0; i < 60 * 5 && !mort; i++) {
    avancerLeMonde(cfg, z, 1 / 60, { x: 0, y: 0 })
    mort = z.ennemis.length === 0
  }
  verifier(`dans la tempête, l'insecte perd ${perdu.toFixed(2)} par seconde (le joueur ${cfg.arene.dps * cfg.uniteDeVie}), y meurt (${mort}) et ne lâche rien (${z.pepites.length} pépites)`, Math.abs(perdu - cfg.arene.dps * cfg.uniteDeVie) < 0.05 && mort && z.pepites.length === 0 && z.invasion.abattus === 0)
}

// LES TAILLES DES ROCHES (Keko, 21/11 : « de toutes les tailles ; les gros plus rares, un peu plus fréquents avec la partie,
// mais pas tout le temps ; le plus gros, encore plus gros, très dur, beaucoup de pépites »)
{
  const D = VAISSEAU.derive
  const Tl = D.tailles
  const part = (t: number): number => {
    const pg = t < Tl.apres ? 0 : Tl.partDebut + (Tl.partFin - Tl.partDebut) * Math.min(1, (t - Tl.apres) / Tl.montee)
    let geantes = 0
    for (let id = 1; id <= 4000; id++) if (tire(77, id, 49) < pg) geantes++
    return geantes / 4000
  }
  const pvMax = Math.round(D.pvA10 * (D.rayonMax / 10) ** D.exposant)
  verifier(`les géantes (36 à ${D.rayonMax}) : aucune avant ${Tl.apres / 60} minutes (${Math.round(part(Tl.apres - 1) * 100)} %), ${Math.round(part(Tl.apres + 1) * 100)} % à leur arrivée, ${Math.round(part(Tl.apres + Tl.montee) * 100)} % ${Tl.montee / 60} minutes plus tard ; la plus grosse a ${pvMax} points et rend ${gemmesDuButin(VAISSEAU, Math.round(pvMax * D.pepitesParPv)).reduce((a, b) => a + b, 0)} d'expérience`, part(0) === 0 && part(Tl.apres - 1) === 0 && part(Tl.apres + 1) > 0.01 && part(Tl.apres + Tl.montee) > 0.08 && part(Tl.apres + Tl.montee) < 0.13 && pvMax > 10000)
}

// LES ROCHES N'ONT RIEN AUX CHOCS (Keko, 21/11 : « les ennemis et le joueur subissent des dégâts en collision, mais pas les
// astéroïdes ») ; ET LES PETITES DOMINENT AU DÉPART (« trop de gros astéroïdes dès le départ »)
{
  const cfg = { ...VAISSEAU, champ: { ...VAISSEAU.champ, densite: 0 }, station: { ...VAISSEAU.station, portee: -1 }, invasion: { ...VAISSEAU.invasion, active: true, sansPortail: true, premiere: 1e9 }, ennemi: { ...VAISSEAU.ennemi, pv: 120, butinRendu: 1, apparait: 1e9, poussee: 90, vitesseMax: 40, rotation: 6, rayon: 5 }, derive: { ...VAISSEAU.derive, active: false } }
  const w = nouveauMonde(cfg, 3)
  w.invasion.prochainA = 1e9
  w.ennemis.push({ id: 300, corps: { ...nouveauVaisseau(), x: 200, y: 0 }, pv: 500, fait: 'marche', roche: null, forage: null, tirA: 0, butin: 0, cargaison: { fer: 0, or: 0, cristal: 0 }, grand: true, asteroide: { rayon: 12, graine: 5, angle0: 0, vitesseAngulaire: 0, pvMax: 500 } })
  for (let k = 0; k < 6; k++) w.ennemis.push({ id: 310 + k, corps: { ...nouveauVaisseau(), x: 200 + Math.cos(k) * 14, y: Math.sin(k) * 14 }, pv: 120, fait: 'aggro', roche: null, forage: null, tirA: 1e9, butin: 0, cargaison: { fer: 0, or: 0, cristal: 0 } })
  for (let i = 0; i < 60 * 3; i++) avancerLeMonde(cfg, w, 1 / 60, { x: 0, y: 0 })
  const roche = w.ennemis.find((e) => e.id === 300)
  const blesses = w.ennemis.filter((e) => e.id >= 310 && e.pv < 120).length
  const Tl = VAISSEAU.derive.tailles
  const grosses = (t: number): number => {
    const k = Tl.kDebut + (Tl.k - Tl.kDebut) * Math.min(1, t / Tl.montee)
    let n = 0
    for (let id = 1; id <= 4000; id++) if (VAISSEAU.derive.rayonMin + (Tl.courante - VAISSEAU.derive.rayonMin) * tire(77, id, 46) ** k > 24) n++
    return n / 4000
  }
  verifier(`six insectes heurtent une roche : ${blesses} blessés, la roche à ${roche?.pv} sur 500 ; une courante de plus de 24 : ${Math.round(grosses(0) * 100)} % au départ, ${Math.round(grosses(Tl.montee) * 100)} % après ${Tl.montee / 60} minutes`, roche?.pv === 500 && blesses >= 1 && grosses(0) < 0.18 && grosses(Tl.montee) > 0.22)
}

// LES PLAQUES SE RÉPARENT, L'EXPÉRIENCE SE GAGNE EN PART, LE BOUCLIER SE RECHARGE EN PART DE LUI-MÊME (Keko, 21/11)
{
  const cfg = { ...VAISSEAU, champ: { ...VAISSEAU.champ, densite: 0 }, station: { ...VAISSEAU.station, portee: -1 }, invasion: { ...VAISSEAU.invasion, active: true, sansPortail: true, premiere: 1e9, gainXp: 1.5 }, ennemi: { ...VAISSEAU.ennemi, apparait: 1e9 }, derive: { ...VAISSEAU.derive, active: false }, plaques: 3, reparation: 20, bouclier: { points: 10, delai: 5, regain: 0, plein: 10 } }
  const w = nouveauMonde(cfg, 3)
  w.invasion.prochainA = 1e9
  w.plaques = [false, false, true]
  w.plaqueCasseeA = 0
  w.bouclier = 0
  w.toucheA = 0
  const etat: string[] = []
  let plein = -1
  for (let i = 0; i < 60 * 45; i++) {
    avancerLeMonde(cfg, w, 1 / 60, { x: 0, y: 0 })
    if (i === 60 * 19) etat.push(w.plaques.filter(Boolean).length + '')
    if (i === 60 * 21) etat.push(w.plaques.filter(Boolean).length + '')
    if (i === 60 * 41) etat.push(w.plaques.filter(Boolean).length + '')
    if (plein < 0 && w.bouclier >= 10 - 1e-9) plein = w.t
  }
  verifier(`deux plaques cassées : à 19 s, ${etat[0]} debout ; à 21 s, ${etat[1]} ; à 41 s, ${etat[2]} (une à la fois, toutes les 20 s)`, etat.join() === '1,2,3')
  verifier(`le bouclier à zéro, touché à 0 : plein à ${plein.toFixed(1)} s (5 s sans coup, puis 10 s)`, Math.abs(plein - 15) < 0.1)
  w.pepites.push({ id: 900, x: w.vaisseau.x, y: w.vaisseau.y, vx: 0, vy: 0, graine: 1, minerai: 'fer', valeur: 3 })
  avancerLeMonde(cfg, w, 1 / 60, { x: 0, y: 0 })
  verifier(`une moyenne (3) avec +50 % d'expérience : ${w.invasion.xp} points`, w.invasion.xp === 4.5)
}

// LE GAZ DES MINES RONGE (Keko, 21/11 : la vulnérabilité de l'effet corrosif, plus de dégâts du poison)
{
  const mine = { id: 'mine', cadence: 1e9, degats: 11, portee: 40, vitesse: 0, vie: 0, dispersion: 0, guide: false, mine: { max: 6, duree: 10, vol: 0.6, rayon: 20, corrosion: { duree: 4, bonus: 0.35 } } }
  const cfg = { ...VAISSEAU, champ: { ...VAISSEAU.champ, densite: 0 }, station: { ...VAISSEAU.station, portee: -1 }, invasion: { ...VAISSEAU.invasion, active: true, sansPortail: true, premiere: 1e9 }, ennemi: { ...VAISSEAU.ennemi, pv: 500, apparait: 1e9 }, derive: { ...VAISSEAU.derive, active: false }, armes: [mine] }
  const w = nouveauMonde(cfg, 3)
  w.invasion.prochainA = 1e9
  w.mines.push({ id: 1, arme: 0, x: 400, y: 0, x0: 400, y0: 0, nee: -10, posee: true } as never)
  w.ennemis.push({ id: 200, corps: { ...nouveauVaisseau(), x: 400, y: 0 }, pv: 500, fait: 'marche', roche: null, forage: null, tirA: 1e9, butin: 0, cargaison: { fer: 0, or: 0, cristal: 0 } })
  for (let i = 0; i < 6; i++) avancerLeMonde(cfg, w, 1 / 60, { x: 0, y: 0 })
  const e = w.ennemis.find((x) => x.id === 200)
  const apres = e?.pv ?? 0
  for (let i = 0; i < 60; i++) avancerLeMonde(cfg, w, 1 / 60, { x: 0, y: 0 })
  verifier(`une mine éclate sur un insecte : ${500 - apres} points, il est rongé (+${Math.round((e?.acide?.bonus ?? 0) * 100)} % de dégâts subis), et ne perd plus rien ensuite (${apres - (e?.pv ?? 0)} en une seconde)`, apres < 500 && (e?.acide?.bonus ?? 0) === 0.35 && (e?.pv ?? 0) === apres)
}

// L'ÉQUIPAGE (Keko, 22/11 : « Tente l'étape 1 » — deux vaisseaux dans le même monde) : le monde avance une fois par pas,
// l'insecte chasse et mord le plus proche, abattu l'un, l'autre est chassé, la pépite va au plus proche et l'expérience
// est commune, la laisse les garde ensemble
{
  const cfg: ConfigVaisseau = { ...VAISSEAU, champ: { ...VAISSEAU.champ, densite: 0 }, station: { ...VAISSEAU.station, portee: -1 }, invasion: { ...VAISSEAU.invasion, active: true, sansPortail: true, premiere: 1e9 }, ennemi: { ...VAISSEAU.ennemi, apparait: 1e9 }, derive: { ...VAISSEAU.derive, active: false }, armes: [] }
  const insecte = (id: number, x: number, y: number): Ennemi => ({ id, corps: { ...nouveauVaisseau(), x, y }, pv: 1e6, fait: 'aggro', roche: null, forage: null, tirA: 1e9, butin: 0, cargaison: { fer: 0, or: 0, cristal: 0 } })
  const deux = (): ReturnType<typeof nouveauMonde> => {
    const w = nouveauMonde(cfg, 5)
    w.invasion.prochainA = 1e9
    ajouterUnPilote(cfg, w, 100, 0)
    return w
  }
  const pas = (w: ReturnType<typeof nouveauMonde>, n: number, d0 = { x: 0, y: 0 }, d1 = { x: 0, y: 0 }): void => {
    for (let i = 0; i < n; i++) avancerLEquipage([cfg, cfg], w, 1 / 60, [d0, d1])
  }
  // (le temps : une fois par pas, pas une fois par pilote)
  const w1 = deux()
  pas(w1, 60)
  verifier(`à deux, le temps du monde avance une fois par pas : ${w1.t.toFixed(3)} s après 60 pas de 1/60`, Math.abs(w1.t - 1) < 1e-9)
  // (la chasse : l'insecte à 150 va au second, à 100, et le mord ; le premier n'a rien)
  const w2 = deux()
  w2.ennemis.push(insecte(300, 150, 0))
  pas(w2, 60)
  const e2 = w2.ennemis[0].corps
  const p2 = etatDuPilote(w2, 1)
  verifier(`l’insecte chasse le vaisseau le plus proche : à ${Math.round(Math.hypot(e2.x - p2.vaisseau.x, e2.y - p2.vaisseau.y))} du second ; le second mordu (${Math.round(p2.coque)} / ${cfg.coque}), le premier intact (${Math.round(w2.coque)})`, Math.hypot(e2.x - p2.vaisseau.x, e2.y - p2.vaisseau.y) < 30 && p2.coque < cfg.coque && w2.coque === cfg.coque)
  // (abattu le premier : l'insecte chasse le second, il n'erre pas)
  const w3 = deux()
  w3.phase = 'perdu'
  w3.invasion.retourA = 1e9
  w3.ennemis.push(insecte(301, -200, 0))
  pas(w3, 60)
  verifier(`le premier abattu, l’insecte chasse le second : parti de −200, il est à ${Math.round(w3.ennemis[0].corps.x)} (le second à ${Math.round(etatDuPilote(w3, 1).vaisseau.x)}) ; le temps a avancé (${w3.t.toFixed(2)} s)`, w3.ennemis[0].corps.x > -150 && Math.abs(w3.t - 1) < 1e-9)
  // (la pépite : au second, qui est sur elle ; l'expérience est celle de tous)
  const w4 = deux()
  const s4 = etatDuPilote(w4, 1).vaisseau
  w4.pepites.push({ id: 901, x: s4.x, y: s4.y, vx: 0, vy: 0, graine: 1, minerai: 'fer', valeur: 3 })
  pas(w4, 1)
  verifier(`une pépite sous le second est ramassée, l’expérience est commune : ${w4.invasion.xp} points, ${w4.pepites.length} pépite restante`, w4.invasion.xp === 3 && w4.pepites.length === 0)
  // (la laisse : l'un tire à gauche, l'autre à droite, cinq secondes)
  const w5 = deux()
  pas(w5, 60 * 5, { x: -1, y: 0 }, { x: 1, y: 0 })
  const d5 = Math.hypot(etatDuPilote(w5, 1).vaisseau.x - w5.vaisseau.x, etatDuPilote(w5, 1).vaisseau.y - w5.vaisseau.y)
  // (le second abattu : il revient après sa pénalité, là où il est tombé, le premier dans son cercle — voir `invasion.vies`)
  const w6 = deux()
  w6.equipage!.pilotes[1].morsures.push({ x: 100, y: 0, degats: 1e6 })
  const evs6: string[] = []
  for (let i = 0; i < 60 * (cfg.invasion.penalite + 1); i++) for (const e of avancerLEquipage([cfg, cfg], w6, 1 / 60, [{ x: 0, y: 0 }, { x: 0, y: 0 }]).evenements[1]) if (e.type === 'perdu' || e.type === 'retour') evs6.push(e.type)
  verifier(`le second abattu revient après ${cfg.invasion.penalite} s, le premier dans son cercle (${evs6.join(', ')}) ; une vie prise (${w6.invasion.vies} / ${cfg.invasion.vies})`, evs6.join() === 'perdu,retour' && etatDuPilote(w6, 1).phase === 'vol' && w6.phase === 'vol' && w6.invasion.vies === cfg.invasion.vies - 1)
  verifier(`la laisse : tirés à l’opposé cinq secondes, ils restent à ${Math.round(d5)} l’un de l’autre (laisse ${cfg.equipage.laisse})`, d5 <= cfg.equipage.laisse + 6 && d5 > cfg.equipage.laisse - 20)
}

// LE JEU À DISTANCE (Keko, 22/11) : le monde en texte et retour, vu depuis le second, l'équipage défait
{
  const cfg: ConfigVaisseau = { ...VAISSEAU, champ: { ...VAISSEAU.champ, densite: 0 }, station: { ...VAISSEAU.station, portee: -1 }, invasion: { ...VAISSEAU.invasion, active: true, sansPortail: true, premiere: 0, continu: { ...VAISSEAU.invasion.continu, actif: true, debut: 4, max: 4 } }, derive: { ...VAISSEAU.derive, active: false }, coque: 1e9 }
  const w = nouveauMonde(cfg, 9)
  ajouterUnPilote(cfg, w, 60, 0)
  w.intouchableJusque = Infinity
  w.creuse.set(4, 2.5)
  w.detruits.add(7)
  for (let i = 0; i < 60 * 8; i++) avancerLEquipage([cfg, cfg], w, 1 / 60, [{ x: 1, y: 0 }, { x: 0, y: 1 }])
  const texte = versTexte(w)
  const lu = depuisTexte<typeof w>(texte)
  verifier(`le monde en texte (${texte.length} caractères, ${w.ennemis.length} insectes) et retour : l’infini, la Map, le Set et les insectes reviennent`, lu.intouchableJusque === Infinity && lu.creuse.get(4) === 2.5 && lu.detruits.has(7) && lu.ennemis.length === w.ennemis.length && Math.abs(lu.ennemis[0].corps.x - w.ennemis[0].corps.x) < 0.01)
  // (relu, il avance comme l'original, au centième près)
  const a = depuisTexte<typeof w>(texte)
  const b = depuisTexte<typeof w>(texte)
  for (let i = 0; i < 30; i++) {
    avancerLEquipage([cfg, cfg], a, 1 / 60, [{ x: 1, y: 0 }, { x: 0, y: 1 }])
    avancerLEquipage([cfg, cfg], b, 1 / 60, [{ x: 1, y: 0 }, { x: 0, y: 1 }])
  }
  verifier('deux copies relues avancent pareil', versTexte(a) === versTexte(b))
  // (vu du second : il prend la place du premier, et l'hôte la sienne)
  const hote = { x: w.vaisseau.x, y: w.vaisseau.y }
  const invite = { ...etatDuPilote(w, 1).vaisseau }
  const v2 = depuisTexte<typeof w>(texte)
  vuDuSecond(v2)
  verifier(`vu du second, il est le premier (${Math.round(v2.vaisseau.x)}, ${Math.round(v2.vaisseau.y)}) et l’hôte le second (${Math.round(etatDuPilote(v2, 1).vaisseau.x)})`, Math.abs(v2.vaisseau.x - invite.x) < 0.01 && Math.abs(v2.vaisseau.y - invite.y) < 0.01 && Math.abs(etatDuPilote(v2, 1).vaisseau.x - hote.x) < 0.01 && v2.equipage?.actif === 0)
  retirerLesPilotes(v2)
  verifier('l’équipage défait, il reste un monde seul', v2.equipage === undefined && Math.abs(v2.vaisseau.x - invite.x) < 0.01)
  // (À QUATRE : vu du troisième, il est le premier, l'hôte le second, puis les autres ; le deuxième parti, le troisième remonte)
  const q = nouveauMonde(cfg, 9)
  ajouterUnPilote(cfg, q, 50, 0)
  ajouterUnPilote(cfg, q, 0, 50)
  ajouterUnPilote(cfg, q, -50, 0)
  const vu3 = depuisTexte<typeof q>(versTexte(q))
  vuDu(vu3, 2)
  verifier(`à quatre, vu du troisième : lui (${Math.round(vu3.vaisseau.x)}, ${Math.round(vu3.vaisseau.y)}), l’hôte, le deuxième, le quatrième`, Math.abs(vu3.vaisseau.y - 50) < 0.01 && Math.abs(etatDuPilote(vu3, 1).vaisseau.x) < 0.01 && Math.abs(etatDuPilote(vu3, 2).vaisseau.x - 50) < 0.01 && Math.abs(etatDuPilote(vu3, 3).vaisseau.x + 50) < 0.01)
  retirerUnPilote(q, 1)
  verifier(`le deuxième parti, ils sont ${q.equipage?.pilotes.length} : le troisième est remonté (${Math.round(etatDuPilote(q, 1).vaisseau.y)})`, q.equipage?.pilotes.length === 3 && Math.abs(etatDuPilote(q, 1).vaisseau.y - 50) < 0.01)
  for (let i = 0; i < 30; i++) avancerLEquipage([cfg, cfg, cfg], q, 1 / 60, [{ x: 1, y: 0 }, { x: 0, y: 1 }, { x: -1, y: 0 }])
  verifier('à trois, ils avancent', q.vaisseau.x > 0 && etatDuPilote(q, 1).vaisseau.y > 50 && etatDuPilote(q, 2).vaisseau.x < -50)
}

// À DISTANCE, SANS LAISSE (Keko, 22/11 : « qu'ils puissent partir dans des directions complètement différentes ») : ils
// s'éloignent, et les insectes naissent autour de chacun
{
  const cfg: ConfigVaisseau = { ...VAISSEAU, champ: { ...VAISSEAU.champ, densite: 0 }, station: { ...VAISSEAU.station, portee: -1 }, invasion: { ...VAISSEAU.invasion, active: true, sansPortail: true, premiere: 0, continu: { ...VAISSEAU.invasion.continu, actif: true, debut: 6, max: 6 } }, derive: { ...VAISSEAU.derive, active: false }, coque: 1e9, armes: [] }
  const w = nouveauMonde(cfg, 4)
  ajouterUnPilote(cfg, w, 50, 0)
  for (let i = 0; i < 60 * 8; i++) {
    avancerLEquipage([cfg, cfg], w, 1 / 60, [{ x: -1, y: 0 }, { x: 1, y: 0 }], undefined, false)
    w.coque = 1e9
    w.equipage!.pilotes[1].coque = 1e9
  }
  const b = etatDuPilote(w, 1).vaisseau
  const d = Math.hypot(b.x - w.vaisseau.x, b.y - w.vaisseau.y)
  const pres = (v: { x: number; y: number }): number => w.ennemis.filter((e) => Math.hypot(e.corps.x - v.x, e.corps.y - v.y) < 500).length
  verifier(`sans laisse, tirés à l’opposé huit secondes, ils sont à ${Math.round(d)} l’un de l’autre ; des insectes autour de chacun (${pres(w.vaisseau)} et ${pres(b)})`, d > 600 && pres(w.vaisseau) > 3 && pres(b) > 3)
}

// LES VIES (Keko, 22/11 : « 5 vies au départ ; à chaque résurrection, on en consomme une ; épuisées, c'est game over » ;
// à plusieurs, « il faut qu'un allié passe 10 secondes dans le cercle pour ressusciter son allié »)
{
  const cfg: ConfigVaisseau = { ...VAISSEAU, champ: { ...VAISSEAU.champ, densite: 0 }, station: { ...VAISSEAU.station, portee: -1 }, invasion: { ...VAISSEAU.invasion, active: true, sansPortail: true, premiere: 1e9 }, ennemi: { ...VAISSEAU.ennemi, apparait: 1e9 }, derive: { ...VAISSEAU.derive, active: false }, armes: [] }
  const abattre = (w: ReturnType<typeof nouveauMonde>): void => {
    w.coque = 0
    w.phase = 'perdu'
    w.invasion.retourA = w.t + cfg.invasion.penalite
  }
  // (seul : le retour prend une vie ; sans vie, abattu, c'est la fin)
  const w = nouveauMonde(cfg, 3)
  w.invasion.prochainA = 1e9
  abattre(w)
  for (let i = 0; i < 60 * (cfg.invasion.penalite + 0.5); i++) avancerLeMonde(cfg, w, 1 / 60, { x: 0, y: 0 })
  const apres1 = w.invasion.vies
  w.invasion.vies = 0
  abattre(w)
  const evs: string[] = []
  for (let i = 0; i < 60; i++) for (const e of avancerLeMonde(cfg, w, 1 / 60, { x: 0, y: 0 }).evenements) evs.push(e.type)
  verifier(`seul : ${cfg.invasion.vies} vies au départ, un retour en prend une (${apres1}) ; abattu sans vie, la partie est finie (${evs.join(', ')})`, cfg.invasion.vies === 5 && apres1 === 4 && w.phase === 'perdu' && w.invasion.finie && evs.join() === 'fin')
  // (à deux : le second abattu à 300 du premier ne revient pas ; le premier dans son cercle cinq secondes, puis dehors
  // cinq secondes, puis dedans : le compte s'est arrêté dehors et reprend où il était)
  const q = nouveauMonde(cfg, 4)
  q.invasion.prochainA = 1e9
  ajouterUnPilote(cfg, q, 300, 0)
  q.equipage!.pilotes[1].morsures.push({ x: 300, y: 0, degats: 1e6 })
  const pas = (n: number, d0: { x: number; y: number }): void => {
    for (let i = 0; i < n; i++) avancerLEquipage([cfg, cfg], q, 1 / 60, [d0, { x: 0, y: 0 }], undefined, false)
  }
  pas(60 * 12, { x: 0, y: 0 })
  const seul12 = etatDuPilote(q, 1).phase
  const reste = (): number => etatDuPilote(q, 1).retourA - q.t
  const avant = reste()
  // (le premier posé dans le cercle — sans élan, au point de retour)
  const o = etatDuPilote(q, 1).vaisseau
  q.vaisseau = { ...q.vaisseau, x: o.x - 40, y: o.y, vx: 0, vy: 0 }
  pas(60 * 5, { x: 0, y: 0 })
  const dedans5 = reste()
  q.vaisseau = { ...q.vaisseau, x: o.x - 600, y: o.y, vx: 0, vy: 0 }
  pas(60 * 5, { x: 0, y: 0 })
  const dehors5 = reste()
  q.vaisseau = { ...q.vaisseau, x: o.x - 40, y: o.y, vx: 0, vy: 0 }
  pas(60 * 5.5, { x: 0, y: 0 })
  verifier(`à deux, seul dans son cercle rien ne court (${seul12}, ${avant.toFixed(1)} s) ; un allié dedans 5 s : ${dedans5.toFixed(1)} s ; dehors 5 s, le compte tient : ${dehors5.toFixed(1)} s ; dedans encore, il revient (${etatDuPilote(q, 1).phase}, ${q.invasion.vies} vies)`, seul12 === 'perdu' && Math.abs(avant - cfg.invasion.penalite) < 0.05 && Math.abs(dedans5 - 5) < 0.1 && Math.abs(dehors5 - 5) < 0.1 && etatDuPilote(q, 1).phase === 'vol' && q.invasion.vies === cfg.invasion.vies - 1)
  // (sans vie, l'allié a beau être dedans : il ne revient pas ; puis le premier abattu aussi : la partie est finie)
  q.invasion.vies = 0
  q.equipage!.pilotes[1].intouchableJusque = -1
  q.equipage!.pilotes[1].renaitJusque = -100
  q.equipage!.pilotes[1].morsures.push({ x: o.x, y: o.y, degats: 1e6 })
  pas(60 * 12, { x: 0, y: 0 })
  const sansVie = etatDuPilote(q, 1).phase
  abattre(q)
  const fins: string[] = []
  for (let i = 0; i < 30; i++) for (const e of avancerLEquipage([cfg, cfg], q, 1 / 60, [{ x: 0, y: 0 }, { x: 0, y: 0 }], undefined, false).evenements.flat()) if (e.type === 'fin') fins.push(e.type)
  verifier(`à deux sans vie, l’allié dans le cercle ne relève personne (${sansVie}) ; tous abattus, la partie est finie (${fins.length} fin)`, sansVie === 'perdu' && q.invasion.finie && fins.length === 1)
  // (tous abattus avec des vies : la fin aussi — Keko)
  const r = nouveauMonde(cfg, 6)
  r.invasion.prochainA = 1e9
  ajouterUnPilote(cfg, r, 50, 0)
  r.equipage!.pilotes[1].morsures.push({ x: 50, y: 0, degats: 1e6 })
  abattre(r)
  for (let i = 0; i < 30; i++) avancerLEquipage([cfg, cfg], r, 1 / 60, [{ x: 0, y: 0 }, { x: 0, y: 0 }], undefined, false)
  verifier(`à deux, tous abattus avec ${r.invasion.vies} vies : la partie est finie`, r.invasion.finie && r.invasion.vies === cfg.invasion.vies)
}

// LES PLAQUES TOMBENT DES ROCHES (Keko, 22/11 : « en détruisant des astéroïdes, on a une chance de faire tomber un petit
// objet qui restaure une plaque ; plus l'astéroïde est gros, plus la chance est importante »)
{
  const cfg: ConfigVaisseau = { ...VAISSEAU, champ: { ...VAISSEAU.champ, densite: 0 }, station: { ...VAISSEAU.station, portee: -1 }, invasion: { ...VAISSEAU.invasion, active: true, sansPortail: true, premiere: 1e9 }, ennemi: { ...VAISSEAU.ennemi, apparait: 1e9 }, derive: { ...VAISSEAU.derive, active: false }, armes: [], plaques: 3 }
  const petite = chanceDePlaque(cfg, cfg.derive.rayonMin)
  const grosse = chanceDePlaque(cfg, cfg.derive.rayonMax)
  const milieu = chanceDePlaque(cfg, 27)
  const deux = chanceDePlaque({ ...cfg, recuperation: 1.25 }, 27)
  verifier(`la chance d'une plaque grandit avec la roche : ${Math.round(petite * 100)} % à ${cfg.derive.rayonMin}, ${Math.round(milieu * 100)} % à 27, ${Math.round(grosse * 100)} % à ${cfg.derive.rayonMax} ; la Récupération la multiplie (+25 % : ${Math.round(deux * 100)} %)`, petite < milieu && milieu < grosse && Math.abs(deux - milieu * 1.25) < 1e-9)
  // (cent roches de 27 abattues : autant de plaques que la chance le dit ; sans plaques au vaisseau, aucune)
  const roche = (id: number): Ennemi => ({ id, corps: { ...nouveauVaisseau(), x: 300, y: 0 }, pv: 0, fait: 'aggro', roche: null, forage: null, tirA: 1e9, butin: 0, cargaison: { fer: 0, or: 0, cristal: 0 }, asteroide: { rayon: 27, pvMax: 1000, graine: id, angle0: 0, vitesseAngulaire: 0 } } as Ennemi)
  let tombees = 0
  let sansPlaques = 0
  for (let id = 1000; id < 3000; id++) {
    const w = nouveauMonde(cfg, 3)
    w.ennemis.push(roche(id))
    avancerLeMonde(cfg, w, 1 / 60, { x: 0, y: 0 })
    tombees += w.pepites.filter((p) => p.plaque === true).length
    const w2 = nouveauMonde({ ...cfg, plaques: 0 }, 3)
    w2.ennemis.push(roche(id))
    avancerLeMonde({ ...cfg, plaques: 0 }, w2, 1 / 60, { x: 0, y: 0 })
    sansPlaques += w2.pepites.filter((p) => p.plaque === true).length
  }
  verifier(`2 000 roches de 27 : ${tombees} plaques tombées (${Math.round(milieu * 2000)} attendues) ; sans plaques au vaisseau, ${sansPlaques}`, Math.abs(tombees - milieu * 2000) < Math.max(8, milieu * 2000 * 0.4) && sansPlaques === 0)
  // (ramassée : la dernière plaque cassée revient ; rien ne manque, elle reste là)
  const w = nouveauMonde(cfg, 4)
  w.plaques = [false, false, true]
  w.pepites.push({ id: 900, x: 0, y: 0, vx: 0, vy: 0, graine: 1, minerai: 'fer', valeur: 0, plaque: true })
  avancerLeMonde(cfg, w, 1 / 60, { x: 0, y: 0 })
  const prise = w.plaques.join()
  const xp = w.invasion.xp
  w.pepites.push({ id: 901, x: 0, y: 0, vx: 0, vy: 0, graine: 1, minerai: 'fer', valeur: 0, plaque: true })
  w.plaques = [true, true, true]
  for (let i = 0; i < 60; i++) avancerLeMonde(cfg, w, 1 / 60, { x: 0, y: 0 })
  verifier(`une plaque ramassée restaure la dernière cassée (${prise}), sans expérience (${xp}) ; plaques pleines, elle reste là (${w.pepites.filter((p) => p.plaque === true).length})`, prise === 'false,true,true' && xp === 0 && w.pepites.some((p) => p.plaque === true))
  // (sans plus de réparation : dix minutes, les plaques cassées le restent)
  const r = nouveauMonde(cfg, 5)
  r.plaques = [false, false, false]
  for (let i = 0; i < 60 * 30; i++) avancerLeMonde(cfg, r, 1 / 60, { x: 0, y: 0 })
  verifier(`sans roche, les plaques ne reviennent pas avec le temps (${r.plaques.join()})`, r.plaques.every((x) => !x))
}

// LE SOIN (Keko, 22/11 : « une petite chance, un peu comme l'aimant, de looter un truc qui soigne du blindage, comme une
// potion de soin »)
{
  const cfg: ConfigVaisseau = { ...VAISSEAU, champ: { ...VAISSEAU.champ, densite: 0 }, station: { ...VAISSEAU.station, portee: -1 }, invasion: { ...VAISSEAU.invasion, active: true, sansPortail: true, premiere: 1e9 }, ennemi: { ...VAISSEAU.ennemi, apparait: 1e9 }, derive: { ...VAISSEAU.derive, active: false }, armes: [] }
  const insecte = (id: number): Ennemi => ({ id, corps: { ...nouveauVaisseau(), x: 400, y: 0 }, pv: 0, fait: 'aggro', roche: null, forage: null, tirA: 1e9, butin: 0, cargaison: { fer: 0, or: 0, cristal: 0 } })
  let soins = 0
  const N = 10000
  for (let id = 5000; id < 5000 + N; id++) {
    const w = nouveauMonde(cfg, 3)
    w.ennemis.push(insecte(id))
    avancerLeMonde(cfg, w, 1 / 60, { x: 0, y: 0 })
    soins += w.pepites.filter((p) => p.soin === true).length
  }
  verifier(`${N} insectes abattus : ${soins} soins (${Math.round(N * cfg.invasion.soin.chance)} attendus, ${Math.round(cfg.invasion.soin.chance * 1000) / 10} %)`, Math.abs(soins - N * cfg.invasion.soin.chance) < Math.max(6, N * cfg.invasion.soin.chance * 0.4) && cfg.invasion.soin.chance < cfg.invasion.aimant)
  // (ramassé blessé : un quart du blindage revient, pas plus que le plein ; sans blessure, il reste ; l'aimant ne l'attire pas)
  const w = nouveauMonde(cfg, 4)
  w.coque = cfg.coque * 0.5
  w.pepites.push({ id: 900, x: 0, y: 0, vx: 0, vy: 0, graine: 1, minerai: 'fer', valeur: 0, soin: true })
  avancerLeMonde(cfg, w, 1 / 60, { x: 0, y: 0 })
  const apres = w.coque / cfg.coque
  w.coque = cfg.coque * 0.95
  w.pepites.push({ id: 901, x: 0, y: 0, vx: 0, vy: 0, graine: 1, minerai: 'fer', valeur: 0, soin: true })
  avancerLeMonde(cfg, w, 1 / 60, { x: 0, y: 0 })
  const plafond = w.coque / cfg.coque
  w.pepites.push({ id: 902, x: 0, y: 0, vx: 0, vy: 0, graine: 1, minerai: 'fer', valeur: 0, soin: true })
  for (let i = 0; i < 60; i++) avancerLeMonde(cfg, w, 1 / 60, { x: 0, y: 0 })
  const reste = w.pepites.filter((p) => p.soin === true).length
  verifier(`un soin ramassé à 50 % : ${Math.round(apres * 100)} % ; à 95 % : ${Math.round(plafond * 100)} % (le plein) ; plein, il reste là (${reste})`, Math.abs(apres - 0.75) < 1e-9 && plafond === 1 && reste === 1)
  // (à deux : le second blessé, le premier plein et posé dessus — le soin va au second)
  const q = nouveauMonde(cfg, 6)
  ajouterUnPilote(cfg, q, 40, 0)
  q.equipage!.pilotes[1].coque = cfg.coque * 0.5
  q.pepites.push({ id: 903, x: 0, y: 0, vx: 0, vy: 0, graine: 1, minerai: 'fer', valeur: 0, soin: true })
  for (let i = 0; i < 60 * 4; i++) avancerLEquipage([cfg, cfg], q, 1 / 60, [{ x: 0, y: 0 }, { x: 0, y: 0 }], undefined, false)
  verifier(`à deux, le soin sous le premier (plein) va au second, blessé : ${Math.round((etatDuPilote(q, 1).coque / cfg.coque) * 100)} %, le premier ${Math.round((q.coque / cfg.coque) * 100)} %`, etatDuPilote(q, 1).coque > cfg.coque * 0.5 && q.coque === cfg.coque && !q.pepites.some((p) => p.soin === true))
}

// LA RÉCOMPENSE DE FIN (Keko, 22/11 : « à un niveau 100 où on a fait pas mal de choses, plusieurs milliers » ; le coup
// fatal au pilote qui le porte ; les mini-boss et les boss à l'équipe ; plus de prime : une partie vide ne vaut que son
// niveau 1 — « on n'a pas envie que les joueurs créent des parties et les arrêtent à l'infini pour gagner la prime »)
{
  const cfg: ConfigVaisseau = { ...VAISSEAU, champ: { ...VAISSEAU.champ, densite: 0 }, station: { ...VAISSEAU.station, portee: -1 }, invasion: { ...VAISSEAU.invasion, active: true, sansPortail: true, premiere: 1e9 }, ennemi: { ...VAISSEAU.ennemi, apparait: 1e9 }, derive: { ...VAISSEAU.derive, active: false }, armes: [] }
  const rien = recompenseDeFin(cfg, 1, tableauVide(), { miniBoss: 0, boss: 0 })
  // (une partie de niveau 100 bien remplie : 6 000 insectes, un sur six cornu, un sur trente cuirassier, 150 roches, 4 mini-boss, 1 boss)
  const pts = 6000 * (0.5 * 2 + 0.3 * 1) + 1000 * 5 + 200 * 15
  const gros = recompenseDeFin(cfg, 100, { insectes: 7200, points: pts, roches: 150, pointsDeRoches: 150 * 6 }, { miniBoss: 4, boss: 1 })
  const dix = recompenseDeFin(cfg, 10, { insectes: 250, points: 450, roches: 6, pointsDeRoches: 30 }, { miniBoss: 0, boss: 0 })
  verifier(`la récompense : niveau 1 sans rien, ${rien.total} ; niveau 10 ordinaire, ${dix.total} ; niveau 100 bien rempli, ${gros.total} (${gros.lignes.map((l) => `${l.quoi} ${l.credits}`).join(', ')})`, rien.total === 10 && rien.lignes.every((l) => l.quoi !== ('base' as string)) && dix.total > 150 && dix.total < 600 && gros.total > 3000 && gros.total < 12000)
  // (le coup fatal : à deux, une roche et un insecte abattus au tour du second sont à lui ; un grand, à l'équipe)
  const w = nouveauMonde(cfg, 3)
  ajouterUnPilote(cfg, w, 60, 0)
  const insecte = (id: number, x: number, extra: Partial<Ennemi> = {}): Ennemi => ({ id, corps: { ...nouveauVaisseau(), x, y: 0 }, pv: 0, fait: 'aggro', roche: null, forage: null, tirA: 1e9, butin: 0, cargaison: { fer: 0, or: 0, cristal: 0 }, ...extra })
  w.ennemis.push(insecte(700, 400, { sorte: 'cornu' }), insecte(701, 420, { asteroide: { rayon: 20, pvMax: 100, graine: 1, angle0: 0, vitesseAngulaire: 0 } }), insecte(702, 440, { grand: true }))
  avancerLEquipage([cfg, cfg], w, 1 / 60, [{ x: 0, y: 0 }, { x: 0, y: 0 }], undefined, false)
  const t0 = w.tableau
  verifier(`le tableau compte au tour de celui qui abat (le premier : ${t0.insectes} insecte, ${t0.points} points, ${t0.roches} roche, ${t0.pointsDeRoches} points) ; le grand à l'équipe (${w.invasion.miniBoss} mini-boss) ; le second, rien (${etatDuPilote(w, 1).tableau.insectes})`, t0.insectes === 1 && t0.points === 5 && t0.roches === 1 && t0.pointsDeRoches === 5 && w.invasion.miniBoss === 1 && etatDuPilote(w, 1).tableau.insectes === 0)
}

// LES CARTES SPÉCIALES DANS LA RÈGLE (Keko, 22/11) : tout autour, en gerbe, perforant, ricochet, incendiaire, éclats
{
  const cfgDe = (a: Partial<Arme>): ConfigVaisseau => ({ ...VAISSEAU, champ: { ...VAISSEAU.champ, densite: 0 }, station: { ...VAISSEAU.station, portee: -1 }, invasion: { ...VAISSEAU.invasion, active: true, sansPortail: true, premiere: 1e9 }, ennemi: { ...VAISSEAU.ennemi, apparait: 1e9 }, derive: { ...VAISSEAU.derive, active: false }, coque: 1e9, arcDeTir: 0.87, armes: [{ id: 'laser', cadence: 1, degats: 10, portee: 200, vitesse: 300, vie: 1, dispersion: 0, guide: false, ...a } as Arme] })
  const insecte = (id: number, x: number, y: number): Ennemi => ({ id, corps: { ...nouveauVaisseau(), x, y }, pv: 100, fait: 'aggro', roche: null, forage: null, tirA: 1e9, butin: 0, cargaison: { fer: 0, or: 0, cristal: 0 } })
  const jouer = (cf: ConfigVaisseau, ennemis: Ennemi[], s: number): ReturnType<typeof nouveauMonde> => {
    const w = nouveauMonde(cf, 2)
    w.invasion.prochainA = 1e9
    w.vaisseau = { ...w.vaisseau, cap: 0 }
    w.ennemis.push(...ennemis)
    for (let i = 0; i < 60 * s; i++) avancerLeMonde(cf, w, 1 / 60, { x: 0, y: 0 })
    return w
  }
  // (derrière le nez : l'arme ordinaire ne tire pas ; tout autour, si)
  const derriere = jouer(cfgDe({}), [insecte(1, -80, 0)], 0.5).ennemis[0].pv
  const autour = jouer(cfgDe({ tousSens: true }), [insecte(1, -80, 0)], 0.5).ennemis[0].pv
  // (en gerbe : deux obus à chaque tir)
  const wg = nouveauMonde(cfgDe({ gerbe: { nombre: 2, ecart: 0.1 } }), 2)
  wg.vaisseau = { ...wg.vaisseau, cap: 0 }
  wg.ennemis.push(insecte(1, 150, 0))
  avancerLeMonde(cfgDe({ gerbe: { nombre: 2, ecart: 0.1 } }), wg, 1 / 60, { x: 0, y: 0 })
  // (perforant : deux insectes en ligne, touchés tous deux d'un seul tir)
  const wp = jouer(cfgDe({ perforant: true, infaillible: true, cadence: 99 }), [insecte(1, 60, 0), insecte(2, 110, 0)], 0.6)
  // (ricochet : trois insectes, un tir les touche tous)
  const wr = jouer(cfgDe({ ricochet: { rebonds: 2, portee: 80, part: 0.7 }, infaillible: true, cadence: 99 }), [insecte(1, 60, 0), insecte(2, 60, 40), insecte(3, 60, 80)], 0.8)
  // (incendiaire : touché, il brûle et perd encore après)
  const wi = jouer(cfgDe({ incendiaire: { duree: 3, dps: 10 }, infaillible: true, cadence: 99 }), [insecte(1, 150, 0)], 2)
  verifier(`les spéciales dans la règle : derrière le nez, rien (${derriere}) / tout autour, touché (${autour}) ; en gerbe, ${wg.obus.length} obus d'un tir ; perforant, ${wp.ennemis.map((e) => e.pv).join(' et ')} ; ricochet, ${wr.ennemis.map((e) => Math.round(e.pv)).join(', ')} ; incendiaire, ${Math.round(wi.ennemis[0].pv)} (90 sans le feu)`, derriere === 100 && autour < 100 && wg.obus.length === 2 && wp.ennemis.every((e) => e.pv === 90) && wr.ennemis.every((e) => e.pv < 100) && wi.ennemis[0].pv < 80)
  // (éclats : un missile qui explose en projette six)
  const cf = cfgDe({ id: 'minimissile', zone: { rayon: 18 }, fragments: { nombre: 6, degats: 3, vitesse: 160, vie: 0.25 }, cadence: 99, vitesse: 200 })
  const wf = nouveauMonde(cf, 2)
  wf.vaisseau = { ...wf.vaisseau, cap: 0 }
  wf.ennemis.push(insecte(1, 50, 0))
  let eclats = 0
  for (let i = 0; i < 30; i++) {
    avancerLeMonde(cf, wf, 1 / 60, { x: 0, y: 0 })
    eclats = Math.max(eclats, wf.obus.filter((o) => o.arme === 'mitraille').length)
  }
  verifier(`fragmentation : l'explosion projette ${eclats} éclats`, eclats === 6)
}

// (TOUJOURS EN DERNIER : des blocs ajoutés après cette ligne échouaient sans faire échouer `npm run verif` — 17/11)
if (echecs > 0) throw new Error(`${echecs} verification(s) en echec`)

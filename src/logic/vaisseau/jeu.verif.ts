/**
 * Vérifications du vaisseau, sans navigateur : le temps est injecté.
 */
import { asteroideDeLaCase, asteroidesAutour, avancer, avancerLeMonde, lancerLaBombe, larguer, porteeDeLaBombe, MINERAIS, nouveauMonde, nouveauVaisseau, solidite, voler, totalDe, stationDeLaCase, stationLaPlusProche, VAISSEAU, verrouiller, ennemiLePlusProche, type ConfigVaisseau, type Evenement, type Vaisseau, xpDuNiveau } from './jeu.ts'
import { acheter, configDuHangar, hangarNeuf, monter, pieceDe } from './hangar.ts'

/** Les règles sont vérifiées SANS la zone calme de la base (le rival naît où que soit le joueur) et AVEC les extracteurs par case (éteints en jeu pour l'instant) ; la base et la station seule ont leurs propres vérifications, plus bas. */
const C: ConfigVaisseau = { ...VAISSEAU, base: { ...VAISSEAU.base, calme: 0 }, station: { ...VAISSEAU.station, seule: false } }

let echecs = 0
function verifier(quoi: string, vrai: boolean): void {
  if (!vrai) echecs += 1
  console.log(`  ${vrai ? 'ok  ' : 'ECHEC'}  ${quoi}`)
}

console.log('vaisseau')
const immobile = avancer(C, nouveauVaisseau(), 1, { x: 0, y: 0 }).vaisseau
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
  // il ne lâche que si LE JOUEUR part vraiment loin du portail
  z.vaisseau = { ...z.vaisseau, x: ins.corps.x * 0.8, y: ins.corps.y * 0.8 } // (plus près du portail que lui)
  avancerLeMonde(cfg, z, 1 / 60, { x: 0, y: 0 })
  const tient = ins.fait === 'aggro'
  const k = (cfg.invasion.lache + 30) / Math.hypot(ins.corps.x, ins.corps.y)
  z.vaisseau = { ...z.vaisseau, x: ins.corps.x * k, y: ins.corps.y * k, vx: 0, vy: 0 }
  avancerLeMonde(cfg, z, 1 / 60, { x: 0, y: 0 })
  verifier('une grande zone d’aggro ; il tient tant que le joueur reste près du portail, et ne lâche que s’il part vraiment loin', cfg.invasion.aggro >= 150 && tient && ins.fait === 'marche')
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
  const mini = { id: 'minimissile', cadence: 1.6, degats: 5, portee: 120, vitesse: 110, vie: 1.8, dispersion: 0, guide: true, zone: { rayon: 18, degats: 5 } }
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
  const rayon = { id: 'rayon', cadence: 0.1, degats: 0, portee: 80, vitesse: 0, vie: 0, dispersion: 0, guide: false, canalise: { dpsMin: 5, dpsMax: 16, montee: 2, brulure: 1.5, dpsBrulure: 3 } }
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
  verifier('le rayon reste sur le plus proche et CHAUFFE : la deuxième seconde coûte plus que la première ; les autres, rien', s1 > 5 && s2 > s1 + 4 && w.ennemis[1].pv === 1000 && w.ennemis[2].pv === 1000 && w.canal?.cible === 1)
  verrouiller(w, 2)
  pas(30)
  verifier('verrouillé à portée, il passe sur lui, et sa chauffe repart de zéro', w.canal?.cible === 2 && (w.canal?.chauffe ?? 1) < 0.3 && w.ennemis[1].pv < 1000)
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

if (echecs > 0) throw new Error(`${echecs} verification(s) en echec`)

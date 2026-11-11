/**
 * Vérifications du vaisseau, sans navigateur : le temps est injecté.
 */
import { asteroideDeLaCase, asteroidesAutour, avancer, avancerLeMonde, larguer, MINERAIS, nouveauMonde, nouveauVaisseau, solidite, totalDe, stationDeLaCase, stationLaPlusProche, VAISSEAU, type ConfigVaisseau, type Evenement, type Vaisseau } from './jeu.ts'
import { acheter, configDuHangar, hangarNeuf, monter } from './hangar.ts'

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
const h2 = heurt(armer('coque-3'))
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

console.log(echecs === 0 ? 'Tout passe.' : `${echecs} echec(s).`)
if (echecs > 0) throw new Error(`${echecs} verification(s) en echec`)

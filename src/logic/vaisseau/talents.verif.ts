/**
 * Vérifications des talents du jeu du vortex, sans navigateur.
 */
import { aUneZone, corrosionPosee, CORROSION_DU_VORTEX, electrocutionPosee, ETATS, armeDeFaction, ARMES_DE_FACTION, type Mutation, NIVEAU_SPECIAL, carteSpeciale, MUTATIONS, mutationsPrises, ajouterLeBonus, apresUnChoix, armeAmelioree, avecLesBonus, carte, factionAmelioree, type Bonus, ouvrirLeChoix, proposer, RARETES, rareteTiree, reserveApresLeDelai, STATS_DE_FACTION, statsDeLArme, ARMES_EN_RESERVE, VARIATIONS_EN_RESERVE } from './talents.ts'
import { VAISSEAU as C, type Arme, type ConfigVaisseau } from './jeu.ts'

let echecs = 0
function verifier(quoi: string, vrai: boolean): void {
  if (!vrai) echecs += 1
  console.log(`  ${vrai ? 'ok  ' : 'ECHEC'}  ${quoi}`)
}

console.log('talents')
const canon: Arme = { id: 'canon', cadence: 1.1, degats: 60, portee: 120, vitesse: 170, vie: 1, dispersion: 0.05, guide: false }
const napalm = { ...canon, id: 'napalm', napalm: { rayon: 14, duree: 3, dps: 20, brulure: 2, dpsBrulure: 10 } } as Arme
const drones = { ...canon, id: 'drones', orbite: { rayon: 30, vitesse: 2, phase: 0 } } as Arme
const base: ConfigVaisseau = { ...C, armes: [canon], bouclier: { ...C.bouclier, points: 3 }, regeneration: 0.01, dephasage: { chance: 0.05, duree: 1.5 } }

// LES RARETÉS : la somme des chances, le tirage
// (les raretés TIRÉES : la spéciale a ses niveaux, jamais le hasard — voir `MUTATIONS`)
const TIREES = RARETES.filter((r) => r.id !== 'speciale')
verifier(`les chances des raretés font 100 % (${Math.round(RARETES.reduce((n, r) => n + r.chance, 0) * 100)}), leurs bonus montent : ${TIREES.map((r) => `+${Math.round(r.bonus * 100)} %`).join(' ')}`, Math.abs(RARETES.reduce((n, r) => n + r.chance, 0) - 1) < 1e-9 && TIREES.every((r, i) => i === 0 || r.bonus > TIREES[i - 1].bonus))
const tirees = Array.from({ length: 10000 }, (_, i) => rareteTiree((i + 0.5) / 10000))
verifier(`le tirage suit les chances : ${RARETES.map((r) => `${r.nom} ${Math.round((tirees.filter((x) => x === r.id).length / 100) * 10) / 10} %`).join(', ')}`, Math.abs(tirees.filter((x) => x === 'commune').length - 5500) <= 1 && tirees.filter((x) => x === 'legendaire').length === 100)

// LE POOL D'UNE ARME : le commun (dégâts, critique, coups critiques), puis ce qu'elle porte
const crachat = { ...canon, id: 'crachat', crachat: { cone: 0.4, duree: 3, acide: { duree: 3, dps: 0, bonus: 0.35 } } } as Arme
const givre = { ...canon, id: 'givre', cadence: 0.1, portee: 0, givre: { ecart: 5, rayon: 8, duree: 4, dps: 12, ralenti: 0.5 } } as Arme
const tourelle = { ...canon, id: 'tourelle', pose: { tous: 3, ecart: 10, max: 3, duree: 8, pivot: 1 } } as unknown as Arme
verifier(`le canon : ${statsDeLArme(canon).join(', ')} ; le napalm : ${statsDeLArme(napalm).join(', ')} ; le crachat : ${statsDeLArme(crachat).join(', ')} ; le givre : ${statsDeLArme(givre).join(', ')} ; les tourelles : ${statsDeLArme(tourelle).join(', ')} ; les drones (leur orbite n'est pas une zone) : ${statsDeLArme(drones).join(', ')}`, statsDeLArme(canon).join() === 'degats,critique,critiques,cadence,portee' && statsDeLArme(napalm).join() === 'degats,critique,critiques,cadence,portee,feu' && statsDeLArme(crachat).includes('corrosion') && statsDeLArme(givre).includes('givre') && statsDeLArme(givre).includes('portee') && statsDeLArme(tourelle).includes('pose') && !aUneZone(drones))
const n2 = armeAmelioree(napalm, 'portee', 0.12)
const f2 = armeAmelioree(napalm, 'feu', 0.2)
const g2 = armeAmelioree(givre, 'givre', 0.2)
verifier(`portée +12 % → rayon ${n2.napalm!.rayon.toFixed(2)} (14), portée ${n2.portee.toFixed(1)} (${napalm.portee}) ; la traînée de givre, sans portée, agrandie quand même (${armeAmelioree(givre, 'portee', 0.12).givre!.rayon.toFixed(2)}) ; feu +20 % → la brûlure ${f2.napalm!.dpsBrulure} (10), le reste non (${f2.napalm!.dps}, ${f2.degats}) ; givre +20 % → ralenti ${g2.givre!.ralenti.toFixed(2)} (0,5 : on ôte 60 % de la vitesse au lieu de 50) ; corrosion +20 % → vulnérabilité ${armeAmelioree(crachat, 'corrosion', 0.2).crachat!.acide.bonus.toFixed(2)} (0,35) ; durée des posées +25 % → tourelles ${(armeAmelioree(tourelle, 'pose', 0.25) as unknown as { pose: { duree: number } }).pose.duree} (8)`, Math.abs(n2.napalm!.rayon - 15.68) < 1e-9 && Math.abs(n2.portee - napalm.portee * 1.12) < 1e-9 && Math.abs(armeAmelioree(givre, 'portee', 0.12).givre!.rayon - 8.96) < 1e-9 && armeAmelioree(givre, 'portee', 0.12).portee === 0 && f2.napalm!.dpsBrulure === 12 && f2.napalm!.dps === 20 && f2.degats === 60 && Math.abs(g2.givre!.ralenti - 0.4) < 1e-9 && Math.abs(armeAmelioree(crachat, 'corrosion', 0.2).crachat!.acide.bonus - 0.42) < 1e-9 && (armeAmelioree(tourelle, 'pose', 0.25) as unknown as { pose: { duree: number } }).pose.duree === 10)
// TOUTES LES ARMES : la moitié du bonus, sur chaque arme qui a la stat — même prise après la carte ; proposée seulement si
// une arme portée a la stat
{
  const g = carte({ sorte: 'armes' }, 'degats', 'legendaire')
  const zoneG = carte({ sorte: 'armes' }, 'portee', 'rare')
  const ca = { ...base, armes: [canon, napalm] }
  const avec = avecLesBonus(ca, ajouterLeBonus(ajouterLeBonus([], g), zoneG))
  verifier(`toutes les armes : la moitié (+${(g.bonus * 100).toFixed(1)} % de dégâts, la légendaire en donne 25) ; le canon ${avec.armes[0].degats} (${canon.degats}), le napalm ${avec.armes[1].degats} (${napalm.degats}) ; la portée de toutes les armes : le canon tire à ${avec.armes[0].portee.toFixed(1)} (${canon.portee}), le rayon du napalm ${avec.armes[1].napalm!.rayon.toFixed(2)} (${napalm.napalm!.rayon})`, Math.abs(g.bonus - 0.125) < 1e-9 && avec.armes[0].degats > canon.degats && avec.armes[1].degats > napalm.degats && Math.abs(avec.armes[0].portee - canon.portee * 1.06) < 1e-9 && Math.abs(avec.armes[1].napalm!.rayon - napalm.napalm!.rayon * 1.06) < 1e-9)
  // (une arme ajoutée après la carte la reçoit aussi)
  const apres = avecLesBonus({ ...base, armes: [canon] }, ajouterLeBonus([], g))
  const plusTard = avecLesBonus({ ...base, armes: [canon, napalm] }, ajouterLeBonus([], g))
  verifier(`toutes les armes vaut pour une arme venue après (napalm ${plusTard.armes[1].degats} au lieu de ${napalm.degats})`, plusTard.armes[1].degats > napalm.degats && apres.armes[0].degats > canon.degats)
  // (le feu n'est proposé qu'avec une arme qui en a ; la portée, toujours)
  const statsGlobalesVues = (armes: Arme[]): Set<string> => {
    const vues = new Set<string>()
    for (let n = 1; n < 400; n++) for (const ta of proposer(n, n, 1, armes[0], 'humains', Array.from({ length: 999 }, (_, k) => `deja-${k}`), armes)) if (ta.cible.sorte === 'armes') vues.add(ta.stat)
    return vues
  }
  const seul = statsGlobalesVues([canon])
  const avecZone = statsGlobalesVues([canon, napalm])
  verifier(`toutes les armes, proposées selon ce qu'on porte : le canon seul ${[...seul].join(', ')} ; avec le napalm ${[...avecZone].join(', ')}`, seul.has('degats') && seul.has('portee') && !seul.has('feu') && seul.has('critique') && avecZone.has('portee') && avecZone.has('feu'))
}
{
  // (LE CRITIQUE EST À L'ARME — Keko, 22/11 : celui du canon ne touche que le canon ; « toutes les armes », la moitié, au vaisseau)
  const deux = avecLesBonus({ ...base, armes: [canon, napalm] }, ajouterLeBonus(ajouterLeBonus([], carte({ sorte: 'arme', arme: 'canon' }, 'critique', 'commune')), carte({ sorte: 'arme', arme: 'canon' }, 'critiques', 'rare')))
  const cg = carte({ sorte: 'armes' }, 'critique', 'legendaire')
  const glob = avecLesBonus({ ...base, armes: [canon, napalm] }, ajouterLeBonus([], cg))
  verifier(`le critique est à l'arme : une commune +2 points au canon (${((deux.armes[0].critique ?? 0) * 100).toFixed(0)}), une rare +12 points de dégâts critiques (${((deux.armes[0].critiques ?? 0) * 100).toFixed(0)}) ; le napalm rien (${deux.armes[1].critique ?? 0}), le vaisseau rien (${deux.passifs.critique}) ; « toutes les armes » légendaire : +${(cg.bonus * 100).toFixed(0)} points au vaisseau`, Math.abs((deux.armes[0].critique ?? 0) - 0.02) < 1e-9 && Math.abs((deux.armes[0].critiques ?? 0) - 0.12) < 1e-9 && deux.armes[1].critique === undefined && deux.passifs.critique === base.passifs.critique && Math.abs(cg.bonus - 0.05) < 1e-9 && Math.abs(glob.passifs.critique - base.passifs.critique - 0.05) < 1e-9)
}

// LE POOL D'UNE FACTION
verifier(`les factions : ${Object.entries(STATS_DE_FACTION).map(([r, s]) => `${r} ${s.join('/')}`).join(' ; ')}`, (Object.values(STATS_DE_FACTION) as string[][]).every((s) => ['blindage', 'moteur', 'maniabilite', 'aimant', 'experience'].every((x) => s.includes(x))) && STATS_DE_FACTION.essaim.includes('regeneration') && STATS_DE_FACTION.etheres.includes('bouclier') && STATS_DE_FACTION.innommes.includes('dephasage') && STATS_DE_FACTION.humains.includes('recuperation') && (Object.values(STATS_DE_FACTION) as string[][]).every((s) => s.length === 6))
const f = (s: Parameters<typeof factionAmelioree>[1], k = 0.25): ConfigVaisseau => factionAmelioree({ ...base, plaques: 3 }, s, k)
verifier(`PV, régénération, bouclier, expérience (${f('experience').invasion.gainXp}), récupération (×${f('recuperation').recuperation}), maniabilité ; le déphasage EN POINTS (+3 : ${(f('dephasage', 0.03).dephasage.chance * 100).toFixed(0)} %) ; les plaques ne bougent pas (${f('recuperation').plaques})`, f('blindage').coque === base.coque * 1.25 && f('regeneration').regeneration === 0.0125 && f('bouclier').bouclier.points === 3.75 && f('experience').invasion.gainXp === 1.25 && f('recuperation').recuperation === 1.25 && f('maniabilite').rotation === base.rotation * 1.25 && Math.abs(f('dephasage', 0.03).dephasage.chance - 0.08) < 1e-12 && f('recuperation').plaques === 3)

// UNE CARTE : elle ne touche que son arme ; elle se cumule
const deux: ConfigVaisseau = { ...base, armes: [canon, { ...canon, id: 'autre' }] }
const c1 = carte({ sorte: 'arme', arme: 'canon' }, 'degats', 'rare')
const un: Bonus = ajouterLeBonus([], c1)
const dix = Array.from({ length: 10 }).reduce<Bonus>((b) => ajouterLeBonus(b, c1), [])
const cad = Array.from({ length: 10 }).reduce<Bonus>((b) => ajouterLeBonus(b, carte({ sorte: 'arme', arme: 'canon' }, 'cadence', 'rare')), [])
const pv = ajouterLeBonus(ajouterLeBonus([], carte({ sorte: 'faction', race: 'essaim' }, 'blindage', 'rare')), carte({ sorte: 'faction', race: 'essaim' }, 'blindage', 'commune'))
verifier(`une carte d'arme ne change que son arme (${avecLesBonus(deux, un).armes.map((a) => a.degats).join(', ')}) ; LES BONUS S'ADDITIONNENT : dix « +12 % » de dégâts font +120 % (${avecLesBonus(base, dix).armes[0].degats} sur 60), de cadence un délai ÷ 2,2 (${avecLesBonus(base, cad).armes[0].cadence.toFixed(3)} sur 1,1), +12 % puis +5 % de PV font +17 % (${avecLesBonus(base, pv).coque} sur ${base.coque})`, avecLesBonus(deux, un).armes[0].degats === 67 && avecLesBonus(deux, un).armes[1].degats === 60 && avecLesBonus(base, dix).armes[0].degats === 132 && Math.abs(avecLesBonus(base, cad).armes[0].cadence - 0.5) < 1e-9 && Math.abs(avecLesBonus(base, pv).coque - base.coque * 1.17) < 1e-9 && dix.length === 1 && Math.abs(dix[0].somme - 1.2) < 1e-9)

// LE TIRAGE DES TROIS CARTES
const p1 = proposer(7, 2, 0, canon, 'essaim')
verifier(`trois cartes différentes, du pool de l'arme et de la faction : ${p1.map((x) => `${x.id} (${x.rarete})`).join(', ')} ; les mêmes pour la même partie et le même niveau`, p1.length === 3 && new Set(p1.map((x) => x.id)).size === 3 && proposer(7, 2, 0, canon, 'essaim').map((x) => x.id + x.rarete).join() === p1.map((x) => x.id + x.rarete).join() && p1.every((x) => (x.cible.sorte === 'arme' ? x.cible.arme === 'canon' : x.cible.sorte === 'armes' || x.cible.race === 'essaim')))
let rien = true
for (let n = 1; n < 200; n++) for (const x of proposer(3, n, 0, canon, 'humains')) if (x.stat === 'bouclier' || x.stat === 'regeneration' || x.stat === 'dephasage' || x.stat === 'feu') rien = false
verifier('une carte hors du pool n’est jamais proposée (le canon n’a pas de feu, l’Empire ni bouclier, ni régénération, ni déphasage)', rien)
const rar = new Map<string, number>()
for (let n = 1; n <= 3000; n++) for (const x of proposer(11, n, 0, canon, 'etheres')) rar.set(x.rarete, (rar.get(x.rarete) ?? 0) + 1)
verifier(`sur 9 000 cartes tirées : ${RARETES.map((r) => `${r.nom} ${Math.round(((rar.get(r.id) ?? 0) / 9000) * 1000) / 10} %`).join(', ')}`, Math.abs((rar.get('commune') ?? 0) / 9000 - 0.55) < 0.03 && (rar.get('legendaire') ?? 0) > 30 && (rar.get('legendaire') ?? 0) < 160)

verifier('un choix à faire, plus la réserve ; le dernier choisi, c’est fini', ouvrirLeChoix(0).aFaire === 1 && ouvrirLeChoix(1).aFaire === 2 && apresUnChoix(ouvrirLeChoix(0)) === null && apresUnChoix(ouvrirLeChoix(1))?.aFaire === 1 && apresUnChoix(ouvrirLeChoix(1))?.rang === 1)
const recup = new Map<string, number>()
for (let n = 1; n <= 4000; n++) for (const x of proposer(5, n, 1, canon, 'humains', Array.from({ length: 999 }, (_, k) => `deja-${k}`))) if (x.stat === 'recuperation') recup.set(x.rarete, (recup.get(x.rarete) ?? 0) + 1)
verifier(`la Récupération de l'Empire paraît à toutes les raretés (${TIREES.map((r) => `${r.nom} ${recup.get(r.id) ?? 0}`).join(', ')}), son bonus celui de la rareté`, TIREES.every((r) => (recup.get(r.id) ?? 0) > 0) && carte({ sorte: 'faction', race: 'humains' }, 'recuperation', 'rare').bonus === 0.12)
verifier('le délai passé, ce qui restait à choisir part en réserve', reserveApresLeDelai(ouvrirLeChoix(0)) === 1 && reserveApresLeDelai(ouvrirLeChoix(1)) === 2 && reserveApresLeDelai(apresUnChoix(ouvrirLeChoix(1))!) === 1)

{
  // (LA ZONE GRANDIT TOUT CE QUI EST UNE ZONE — 22/11 : le rayon de la Singularité, et celui de son effondrement)
  const puits = { id: 'puits', cadence: 5, degats: 11.5, portee: 130, vitesse: 0, vie: 0, dispersion: 0, guide: false, puits: { vitesse: 150, rayon: 45, force: 70, duree: 2, eclat: 28 } } as Arme
  const z = armeAmelioree(puits, 'portee', 0.25)
  verifier(`une carte « Portée » de +25 % : la Singularité, lancée à ${z.portee} (130), attire à ${z.puits!.rayon} (45), s'effondre à ${z.puits!.eclat} (28) ; sa force ne bouge pas (${z.puits!.force})`, z.puits!.rayon === 56.25 && z.portee === 162.5 && z.puits!.eclat === 35 && z.puits!.force === 70)
}
{
  // (« ZONE ET PORTÉE » GRANDIT L'IMPULSION, LA DÉTONATION ET LE RICOCHET DU LASER, prise avant ou après la variation —
  // Keko, 26/11 : prise avant, la variation posait sa zone par-dessus, à sa taille de départ)
  const laser = { id: 'laser', cadence: 1.1, degats: 9, portee: 120, vitesse: 420, vie: 0.7, dispersion: 0, guide: false, infaillible: true } as Arme
  const cfg: ConfigVaisseau = { ...C, armes: [{ ...laser, place: 0 }] }
  const zp = carte({ sorte: 'arme', arme: 'laser' }, 'portee', 'legendaire')
  const spe = (id: string) => carteSpeciale(MUTATIONS.find((x) => x.id === id)!)
  const vu = (ids: string[], avant: boolean): Arme => {
    let b: Bonus = avant ? ajouterLeBonus([], zp) : []
    for (const id of ids) b = ajouterLeBonus(b, spe(id))
    return avecLesBonus(cfg, avant ? b : ajouterLeBonus(b, zp)).armes[0]
  }
  const ids = ['laser-impulsion', 'laser-detonation', 'laser-ricochet']
  const av = vu(ids, true)
  const ap = vu(ids, false)
  const tg = carte({ sorte: 'armes' }, 'portee', 'legendaire')
  const gl = avecLesBonus(cfg, ajouterLeBonus(ids.reduce<Bonus>((b, id) => ajouterLeBonus(b, spe(id)), []), tg)).armes[0]
  // (LA DURÉE FAIT DURER LA BOULE DE LA BOBINE — Keko, 26/11)
  const tesla = armeDeFaction('tesla')!.armes()[0]
  const td = armeAmelioree(tesla, 'pose', 0.25)
  verifier(`la bobine tesla a la carte Durée (${statsDeLArme(tesla).join(', ')}) : +25 %, sa boule dure ${td.sphere?.duree} s (3)`, statsDeLArme(tesla).includes('pose') && td.sphere?.duree === 3.75)
  // (« ZONE ET PORTÉE » SUR LES VARIATIONS DE LA BOBINE — Keko, 26/11 : le saut de la Conduction, l'anneau du Magnétisme,
  // l'explosion du Court-circuit, qui vaut `taille` fois la boule)
  const cfgT: ConfigVaisseau = { ...C, armes: [{ ...tesla, place: 0 }] }
  const bT = ['tesla-conduction', 'tesla-magnetisme', 'tesla-court-circuit'].reduce<Bonus>((b, id) => ajouterLeBonus(b, spe(id)), ajouterLeBonus([], carte({ sorte: 'arme', arme: 'tesla' }, 'portee', 'legendaire')))
  const tz = avecLesBonus(cfgT, bT).armes[0].sphere!
  verifier(`« Zone et portée » légendaire sur la bobine : la boule ${tz.rayon} (42), le saut de la Conduction ${tz.foudre?.rebonds?.saut} (45), l'anneau du Magnétisme ${tz.magnetisme?.rayon} (60), l'explosion du Court-circuit ${tz.rayon * tz.court!.taille} (63)`, tz.rayon === 52.5 && tz.foudre?.rebonds?.saut === 56.25 && tz.magnetisme?.rayon === 75 && tz.rayon * tz.court!.taille === 78.75)
  // (LES ÉCLATS DE LA FRAGMENTATION VONT PLUS LOIN — Keko, 26/11)
  const gr = armeDeFaction('grenades')!.armes()[0]
  const gf = avecLesBonus({ ...C, armes: [{ ...gr, place: 0 }] }, ajouterLeBonus(ajouterLeBonus([], carte({ sorte: 'arme', arme: 'grenades' }, 'portee', 'legendaire')), spe('grenades-fragmentation'))).armes[0]
  verifier(`« Zone et portée » légendaire sur les grenades : l'explosion ${gf.zone?.rayon} (28), les éclats de la Fragmentation vont à ${gf.fragments!.vitesse * gf.fragments!.vie} (40)`, gf.zone?.rayon === 35 && gf.fragments!.vitesse * gf.fragments!.vie === 50)
  // (LA DURÉE, CE QUI A UNE VIE À SOI — Keko, 26/11 : la balise laser oui, la flaque de napalm non)
  const li = armeDeFaction('lien')!.armes()[0]
  verifier(`la balise laser a la carte Durée (${statsDeLArme(li).join(', ')}) : +25 %, elle dure ${armeAmelioree(li, 'pose', 0.25).lien?.duree} s (4) ; la flaque de napalm ne l'a plus`, statsDeLArme(li).includes('pose') && armeAmelioree(li, 'pose', 0.25).lien?.duree === 5)
  // (LE DÉLUGE ET LA BORDÉE DES MISSILES — Keko, 26/11 : une pluie de quatre mini-missiles à intervalles réguliers, qui garde
  // l'élément du missile ; les deux ailes ensemble)
  const mm = { id: 'minimissile', cadence: 3.2, degats: 80, portee: 120, vitesse: 110, vie: 1.8, dispersion: 0.25, guide: true, zone: { rayon: 18 } } as Arme
  const cm: ConfigVaisseau = { ...C, armes: [{ ...mm, place: 0 }, { ...mm, place: 1 }] }
  const dl = avecLesBonus(cm, ajouterLeBonus(ajouterLeBonus(ajouterLeBonus([], spe('missile-deluge')), spe('missile-incendiaire')), spe('missile-bordee'))).armes
  const pluie = dl.find((a) => a.essaim !== undefined)
  verifier(`le Déluge : ${dl.length} armes (3), la pluie de ${pluie?.essaim?.nombre} (4) toutes les ${pluie?.cadence} s (5), ${pluie?.degats} chacun (40), elle brûle avec Thermite (${pluie?.incendiaire !== undefined}) ; la Bordée, les deux ailes jumelées (${dl.filter((a) => a.jumele === true && a.essaim === undefined).length}, 2)`, dl.length === 3 && pluie?.essaim?.nombre === 4 && pluie.cadence === 5 && pluie.degats === 40 && pluie.incendiaire !== undefined && dl.filter((a) => a.jumele === true && a.essaim === undefined).length === 2)
  // (LA CHASSE DE L'ESCORTE CHOISIT SA PROIE PLUS LOIN — 26/11)
  const es = armeDeFaction('escorte')!.armes()[0]
  const ec = avecLesBonus({ ...C, armes: [{ ...es, place: 0 }] }, ajouterLeBonus(ajouterLeBonus([], carte({ sorte: 'arme', arme: 'escorte' }, 'portee', 'legendaire')), spe('escorte-chasse'))).armes[0]
  verifier(`« Zone et portée » légendaire sur l'escorte en Chasse : sa proie se choisit à ${ec.orbite?.laisse} du vaisseau (160)`, ec.orbite?.laisse === 200 && ec.orbite.chasse === true)
  verifier(`« Zone et portée » légendaire (+25 %), prise AVANT les variations : l'onde de l'Impulsion ${av.zone?.rayon} (16), la Détonation ${av.detonation?.rayon} (24), le Ricochet ${av.ricochet?.portee} (80) ; prise après : ${ap.zone?.rayon}, ${ap.detonation?.rayon}, ${ap.ricochet?.portee} ; « toutes les armes » (+12,5 %) : ${gl.zone?.rayon}, ${gl.detonation?.rayon}, ${gl.ricochet?.portee}`, [av, ap].every((a) => a.zone?.rayon === 20 && a.detonation?.rayon === 30 && a.ricochet?.portee === 100 && a.portee === 150) && gl.zone?.rayon === 18 && gl.detonation?.rayon === 27 && gl.ricochet?.portee === 90)
}
{
  // LES CARTES SPÉCIALES (Keko, 22/11 : aux niveaux 10, 20, 30, une nouvelle arme et une variation de l'arme principale au
  // moins ; ensuite, des variations des armes portées ; 4 armes au plus ; 6 armes par faction, 6 variations par arme)
  const laser = { id: 'laser', cadence: 2.2, degats: 90, portee: 120, vitesse: 420, vie: 0.7, dispersion: 0, guide: false, infaillible: true } as Arme
  const base: ConfigVaisseau = { ...C, armes: [{ ...laser, place: 0 }, { ...laser, place: 1 }] }
  const mu = (id: string): Mutation => MUTATIONS.find((x) => x.id === id)!
  const sortes = (cs: { mutation?: string }[]): string[] => cs.map((x) => mu(x.mutation!).sorte)
  const n9 = proposer(9, 9, 0, laser, 'humains')
  const n10 = proposer(9, 10, 0, laser, 'humains')
  const n10b = proposer(9, 10, 1, laser, 'humains', ['laser-corrosif'])
  const n15 = proposer(9, 15, 0, laser, 'humains', ['arme-railgun'])
  const n15manque = proposer(9, 15, 0, laser, 'humains')
  verifier(`au niveau ${NIVEAU_SPECIAL}, trois spéciales, deux nouvelles armes et une variation du laser (${n10.map((x) => x.mutation).join(', ')}) ; pas au 9, ni au second choix une fois prise, ni au 15 si on l'a prise ; manquée, elle revient`, n9.every((x) => x.rarete !== 'speciale') && n10.length === 3 && sortes(n10).filter((x) => x === 'arme').length === 2 && n10.some((x) => mu(x.mutation!).sorte === 'variation' && mu(x.mutation!).arme === 'laser') && n10b.every((x) => x.rarete !== 'speciale') && n15.every((x) => x.rarete !== 'speciale') && n15manque.every((x) => x.rarete === 'speciale'))
  // (quatre armes : plus de nouvelle arme ; après le niveau 30, des variations des armes portées)
  const armesDe = (ids: string[]): Arme[] => [laser, ...ids.flatMap((id) => armeDeFaction(id)!.armes())]
  const quatre = proposer(9, 30, 0, laser, 'humains', ['arme-railgun', 'arme-tesla'], armesDe(['railgun', 'tesla', 'obusier']))
  const n40 = proposer(9, 40, 0, laser, 'humains', ['arme-railgun', 'laser-corrosif', 'laser-ricochet'], armesDe(['railgun']))
  // (une arme seule, cinq de ses six variations prises : la dernière, et deux cartes ordinaires pour faire trois)
  const presque = proposer(9, 60, 0, laser, 'humains', ['laser-impulsion', 'laser-detonation', 'laser-double', 'laser-ricochet', 'laser-concentre'])
  verifier(`moins de trois spéciales qui restent : des ordinaires complètent (${presque.map((x) => x.mutation ?? x.stat).join(', ')})`, presque.length === 3 && presque[0].mutation === 'laser-corrosif' && presque.slice(1).every((x) => x.rarete !== 'speciale'))
  verifier(`quatre armes portées : plus que des variations (${sortes(quatre).join(', ')}) ; au 40, trois variations des armes portées (${n40.map((x) => x.mutation).join(', ')})`, quatre.length > 0 && sortes(quatre).every((x) => x === 'variation') && n40.length === 3 && n40.every((x) => mu(x.mutation!).sorte === 'variation' && ['laser', 'railgun'].includes(mu(x.mutation!).arme) && !['laser-corrosif', 'laser-ricochet'].includes(x.mutation!)))
  // (une nouvelle arme a SON pool : ses cartes ordinaires reviennent avec celles du laser)
  let cartesDuRail = 0
  for (let n = 41; n < 300; n++) for (const x of proposer(5, n, 1, laser, 'humains', Array.from({ length: 999 }, (_, k) => `deja-${k}`), armesDe(['railgun']))) if (x.cible.sorte === 'arme' && x.cible.arme === 'railgun') cartesDuRail++
  // (prendre une nouvelle arme l'ajoute ; ses variations la changent)
  let b = ajouterLeBonus([], carteSpeciale(mu('arme-railgun')))
  b = ajouterLeBonus(b, carteSpeciale(mu('railgun-large')))
  b = ajouterLeBonus(b, carteSpeciale(mu('laser-detonation')))
  const c1 = avecLesBonus(base, b)
  verifier(`une nouvelle arme a ses cartes (${cartesDuRail} pour le railgun) ; prise, elle s'ajoute (${c1.armes.map((a) => a.id).join(', ')}), sa variation la change (calibre ${c1.armes.find((a) => a.id === 'railgun')?.balle?.calibre}) ; prises : ${mutationsPrises(b).join(', ')}`, cartesDuRail > 20 && c1.armes.filter((a) => a.id === 'railgun').length === 1 && c1.armes.find((a) => a.id === 'railgun')!.balle!.calibre === 5 && c1.armes.filter((a) => a.id === 'laser').length === 2 && c1.armes.every((a) => a.id !== 'laser' || a.detonation !== undefined) && mutationsPrises(b).join() === 'arme-railgun,railgun-large,laser-detonation')
  // (… les roquettes, puis le harpon, mis de côté — Keko, 23/11 — ; la balise laser est la sixième)
  // (le compte : six armes pour l'Empire, six variations pour chacune des neuf armes en jeu ; chaque variation change bien sa config)
  const ids = ['laser', 'mitraille', 'minimissile', ...ARMES_DE_FACTION.filter((x) => x.race === 'humains').map((x) => x.id)]
  let sansEffet = ''
  for (const id of ids)
    for (const v of MUTATIONS.filter((x) => x.sorte === 'variation' && x.arme === id)) {
      const depart = id === 'laser' ? base : id === 'mitraille' || id === 'minimissile' ? { ...C, armes: [{ ...laser, id, place: 0 }] } : avecLesBonus(base, ajouterLeBonus([], carteSpeciale(mu(`arme-${id}`))))
      if (JSON.stringify(v.appliquer(depart)) === JSON.stringify(depart)) sansEffet += ` ${v.id}`
    }
  // (les armes EN REVUE, leurs variations pas encore toutes tranchées — aucune depuis le Silo des missiles, 26/11)
  const EN_REVUE: Record<string, number> = {}
  verifier(`l'Empire a ${ARMES_DE_FACTION.filter((x) => x.race === 'humains').length} nouvelles armes ; six variations par arme (${ids.map((id) => `${id} ${MUTATIONS.filter((x) => x.sorte === 'variation' && x.arme === id).length}`).join(', ')}) ; aucune sans effet (${sansEffet || 'aucune'})`, ARMES_DE_FACTION.filter((x) => x.race === 'humains').length === 6 && ids.every((id) => MUTATIONS.filter((x) => x.sorte === 'variation' && x.arme === id).length === (EN_REVUE[id] ?? 6)) && sansEffet === '')
}
{
  // LA TENTACULE DU KRAKEN (Keko, 27/11) : ses variations — cinq tranchées, la sixième à venir — changent toutes sa config ;
  // le Fouet AJOUTE une attaque, sans tentacule à lui ; la Bouture a une durée que la carte « Durée » allonge ; l'aiguille de
  // l'Empalement s'allonge avec « Zone et portée » ; la Méduse ouvre les cartes d'électrocution
  const tentacule: Arme = { id: 'tentacule', cadence: 0.42, degats: 50, portee: 55, vitesse: 0, vie: 0, dispersion: 0, guide: false, place: 0, tentacule: { ancres: [[-0.2, -4.8], [-0.2, 4.8]], aller: 0.2, tenue: 0.08, retour: 0.24, virage: 0.35, alterne: true } }
  const depart: ConfigVaisseau = { ...C, armes: [tentacule] }
  const variations = MUTATIONS.filter((x) => x.sorte === 'variation' && x.arme === 'tentacule')
  const sansEffet = variations.filter((v) => JSON.stringify(v.appliquer(depart)) === JSON.stringify(depart)).map((v) => v.id)
  const mu = (id: string): Mutation => MUTATIONS.find((x) => x.id === id)!
  const avecFouet = mu('tentacule-fouet').appliquer(depart)
  const fouet = avecFouet.armes[1]
  const bouture = mu('tentacule-bouture').appliquer(depart).armes[0]
  const empale = mu('tentacule-empalement').appliquer(depart).armes[0]
  const meduse = mu('tentacule-meduse').appliquer(depart).armes[0]
  verifier(`la Tentacule a ${variations.length} variations (${variations.map((v) => v.nom).join(', ')}), aucune sans effet (${sansEffet.join(', ') || 'aucune'})`, variations.length === 5 && sansEffet.length === 0)
  verifier(`Fouet : une seconde arme « tentacule », sans tentacule, qui fouette (${fouet?.degats} toutes les ${fouet?.cadence} s)`, avecFouet.armes.length === 2 && fouet.tentacule === undefined && fouet.fouet !== undefined && fouet.degats === 30)
  verifier(`Bouture : la carte « Durée » +50 % la fait vivre ${armeAmelioree(bouture, 'pose', 0.5).bouture?.duree} s au lieu de 4 ; sans elle, pas de carte « Durée »`, statsDeLArme(bouture).includes('pose') && !statsDeLArme(tentacule).includes('pose') && armeAmelioree(bouture, 'pose', 0.5).bouture?.duree === 6)
  verifier(`Empalement : « Zone et portée » +50 % pousse l'aiguille à ${armeAmelioree(empale, 'portee', 0.5).tentacule?.empale?.allonge} derrière la cible au lieu de 40`, armeAmelioree(empale, 'portee', 0.5).tentacule?.empale?.allonge === 60)
  verifier('Méduse : la tentacule électrocute, la carte « Électrocution » paraît', statsDeLArme(meduse).includes('electrocution') && !statsDeLArme(tentacule).includes('electrocution'))
}
{
  // LES ÉTATS NE SE PRENNENT QUE POUR TOUTES LES ARMES (Keko, 23/11 : « une augmentation d'un état concerne toujours toutes
  // les armes ») : un laser corrosif — jamais de carte d'état à une arme ; la corrosion de toutes les armes paraît, au
  // bonus entier ; ni feu ni givre, que rien n'applique ; un laser nu, aucune carte d'état
  const nu = { id: 'laser', cadence: 2.2, degats: 90, portee: 120, vitesse: 420, vie: 0.7, dispersion: 0, guide: false, infaillible: true } as Arme
  const corrosif = { ...nu, corrosif: { duree: 3, bonus: 0.35 } } as Arme
  const deja = Array.from({ length: 999 }, (_, k) => `deja-${k}`)
  const tirees = (a: Arme) => Array.from({ length: 400 }, (_, n) => proposer(7, n + 1, 0, a, 'humains', deja, [a])).flat()
  const avec = tirees(corrosif)
  const aUneArme = avec.filter((x) => x.cible.sorte === 'arme' && ['feu', 'corrosion', 'givre'].includes(x.stat)).length
  const aToutes = avec.filter((x) => x.cible.sorte === 'armes' && x.stat === 'corrosion').length
  const autres = avec.filter((x) => x.cible.sorte === 'armes' && (x.stat === 'feu' || x.stat === 'givre')).length
  const sans = tirees(nu).filter((x) => ['feu', 'corrosion', 'givre'].includes(x.stat)).length
  const entier = carte({ sorte: 'armes' }, 'corrosion', 'rare').bonus === carte({ sorte: 'arme', arme: 'laser' }, 'degats', 'rare').bonus
  verifier(`les états à toutes les armes : à une arme ${aUneArme} (0), corrosion de toutes ${aToutes} (plus de 0, au bonus entier : ${entier}), feu ou givre ${autres} (0) ; un laser nu, ${sans} (0)`, aUneArme === 0 && aToutes > 0 && entier && autres === 0 && sans === 0)
}
{
  // LA CORROSION DU VORTEX À 20 % (Keko, 24/11) : la carte Corrosion du laser la pose ; `corrosionPosee` met chaque source
  // d'une arme (acide, mines, traînée, parasites, laser) à ce bonus
  const laser = { id: 'laser', cadence: 2.2, degats: 90, portee: 120, vitesse: 420, vie: 0.7, dispersion: 0, guide: false } as Arme
  const corrode = MUTATIONS.find((x) => x.id === 'laser-corrosif')!.appliquer({ ...C, armes: [laser] }).armes[0].corrosif?.bonus
  const vouivre = { ...laser, crachat: { cone: 1, duree: 3, acide: { duree: 3, dps: 0, bonus: 0.35 } }, mine: { corrosion: { duree: 4, bonus: 0.35 } } } as unknown as Arme
  const posee = corrosionPosee(vouivre, CORROSION_DU_VORTEX)
  verifier(`la corrosion du vortex : la carte du laser ${corrode} (0,2) ; posée, l'acide ${posee.crachat?.acide.bonus}, les mines ${posee.mine?.corrosion?.bonus} (0,2)`, corrode === 0.2 && posee.crachat?.acide.bonus === 0.2 && posee.mine?.corrosion?.bonus === 0.2)
}
{
  // L'ÉLECTROCUTION (Keko, 24/11) : posée sur les drones à arcs, la chaîne et la tempête, pas sur le canon ; sa carte n'est
  // qu'à toutes les armes, au bonus entier ; légendaire, sa chance passe de 20 % à 25 %
  const chaine = { id: 'chaine', cadence: 1.5, degats: 80, portee: 90, vitesse: 0, vie: 0, dispersion: 0, guide: false, chaine: { rebonds: 4, saut: 45, attenuation: 0.8 } } as Arme
  const posee = electrocutionPosee(chaine)
  const nue = electrocutionPosee({ id: 'canon', cadence: 1, degats: 10, portee: 100, vitesse: 300, vie: 1, dispersion: 0, guide: false } as Arme)
  const plus = armeAmelioree(posee, 'electrocution', 0.25)
  verifier(`l'électrocution : la chaîne électrocute (${posee.electrocution?.chance}), le canon non (${nue.electrocution === undefined}) ; une carte de +25 % : ${plus.electrocution?.chance} (0,25) ; à toutes les armes seulement (${ETATS.has('electrocution') && statsDeLArme(posee).includes('electrocution')})`, posee.electrocution?.chance === 0.2 && nue.electrocution === undefined && Math.abs((plus.electrocution?.chance ?? 0) - 0.25) < 1e-9 && ETATS.has('electrocution'))
}
{
  // LA BRÛLURE UNIQUE DU VORTEX GRANDIT AVEC LA CARTE « BRÛLURE » (Keko, 24/11) : 20 par seconde, +25 % → 25
  const flammes = { id: 'flammes', cadence: 0.1, degats: 60, portee: 40, vitesse: 0, vie: 0, dispersion: 0, guide: false, flamme: { cone: 0.5, brulure: 2, dpsBrulure: 20 } } as Arme
  const cv = avecLesBonus({ ...C, brulureDesEtats: 20, armes: [flammes] }, [{ id: 'armes:feu', cible: { sorte: 'armes' }, stat: 'feu', somme: 0.25 }])
  verifier(`la brûlure du vortex : 20, une carte de +25 %, ${cv.brulureDesEtats} (25)`, cv.brulureDesEtats === 25)
}
{
  // LES CARTES D'ÉLÉMENT AU POOL DES SPÉCIALES (Keko, 24/11) : seulement si une arme portée applique l'élément — un laser
  // corrosif, au niveau 40, sur vingt tirages : la carte de la corrosion paraît, jamais celle du givre ni du feu ; prise,
  // elle allume sa règle
  const corrosif = { id: 'laser', cadence: 2.2, degats: 90, portee: 120, vitesse: 420, vie: 0.7, dispersion: 0, guide: false, corrosif: { duree: 3, bonus: 0.2 } } as Arme
  const vues = new Set<string>()
  for (let g = 1; g <= 20; g++) for (const t of proposer(g, 40, 0, corrosif, 'humains', ['arme-railgun', 'arme-obusier', 'arme-tesla'], [corrosif])) if (t.mutation !== undefined) vues.add(t.mutation)
  const mu = MUTATIONS.find((x) => x.id === 'element-affaiblissement')!
  // (PRISE COMME EN JEU, par les bonus du vol — `avecLesBonus` : elle ne s'appliquait pas, sa cible « toutes les armes » la sautait)
  const prise = avecLesBonus({ ...C, armes: [corrosif] }, ajouterLeBonus([], carteSpeciale(mu)))
  verifier(`les cartes d'élément : un laser corrosif voit ${[...vues].filter((x) => x.startsWith('element')).join(', ') || 'aucune'} (element-affaiblissement) ; prise, la règle ${prise.elementaires.affaiblissement}`, vues.has('element-affaiblissement') && !vues.has('element-givre') && !vues.has('element-feu') && !vues.has('element-electrocution') && prise.elementaires.affaiblissement)
}
{
  // UNE CARTE D'ÉTAT GRANDIT TOUS LES EFFETS DE SON ÉLÉMENT (Keko, 24/11 — voir `ConfigVaisseau.renforts`) : une carte
  // « Corrosion » de +25 % et une « Électrocution » de +10 % font leurs renforts ; le givre et le feu restent à zéro
  const corrosif = { id: 'laser', cadence: 2.2, degats: 90, portee: 120, vitesse: 420, vie: 0.7, dispersion: 0, guide: false, corrosif: { duree: 3, bonus: 0.2 } } as Arme
  const cr = avecLesBonus({ ...C, armes: [corrosif] }, [{ id: 'armes:corrosion', cible: { sorte: 'armes' }, stat: 'corrosion', somme: 0.25 }, { id: 'armes:electrocution', cible: { sorte: 'armes' }, stat: 'electrocution', somme: 0.1 }])
  verifier(`les renforts des cartes d'état : corrosion ${cr.renforts.corrosion} (0,25), électrocution ${cr.renforts.electrocution} (0,1), givre ${cr.renforts.givre}, feu ${cr.renforts.feu} (0)`, cr.renforts.corrosion === 0.25 && cr.renforts.electrocution === 0.1 && cr.renforts.givre === 0 && cr.renforts.feu === 0)
}
{
  // LA BOBINE TESLA ÉLECTROCUTE (Keko, 24/11) : son arme porte l'électrocution du vortex, et la carte « Électrocution » est
  // à son pool
  const bobine = armeDeFaction('tesla')!.armes()[0]
  verifier(`la bobine électrocute : chance ${bobine.electrocution?.chance} (0,2), sa carte d'état ${statsDeLArme(bobine).includes('electrocution')}`, bobine.electrocution?.chance === 0.2 && statsDeLArme(bobine).includes('electrocution'))
}
// LES BALLES ACIDES DE L'ESCORTE (Keko, 24/11) : prise, la carte pose la corrosion du vortex sur tous les mini-avions,
// ceux de l'Escadrille compris, dans les deux ordres
{
  const mu = (id: string): Mutation => MUTATIONS.find((x) => x.id === id)!
  const prendre = (ids: string[]): ConfigVaisseau => avecLesBonus(base, ids.reduce((b, id) => ajouterLeBonus(b, carteSpeciale(mu(id))), [] as ReturnType<typeof ajouterLeBonus>))
  const ronge = (c: ConfigVaisseau): string => c.armes.filter((a) => a.id === 'escorte').map((a) => (a.corrosif?.bonus === CORROSION_DU_VORTEX ? 'R' : '-')).join('')
  const [avant, apres] = [prendre(['arme-escorte', 'escorte-acide', 'escorte-plus']), prendre(['arme-escorte', 'escorte-plus', 'escorte-acide'])]
  verifier(`les balles acides : les mini-avions rongent (${ronge(avant)} et ${ronge(apres)}, RRRR) ; plus de feu ni de gel (${MUTATIONS.some((x) => x.id === 'escorte-incendiaires' || x.id === 'escorte-cryo')})`, ronge(avant) === 'RRRR' && ronge(apres) === 'RRRR' && !MUTATIONS.some((x) => x.id === 'escorte-incendiaires' || x.id === 'escorte-cryo'))
  // (LES MISSILES, à la place des Roquettes — Keko, 25/11 : les quatre avions de l'Escadrille en tirent, à la même cadence
  // et aux mêmes dégâts, dans les deux ordres)
  const lance = (c: ConfigVaisseau): string => c.armes.filter((a) => a.id === 'escorte').map((a) => (a.missiles?.rayon === 11 && Math.abs(a.cadence - 0.45 * 2.5) < 1e-9 && a.degats === 60 ? 'M' : '-')).join('')
  const [m1, m2] = [prendre(['arme-escorte', 'escorte-missiles', 'escorte-plus']), prendre(['arme-escorte', 'escorte-plus', 'escorte-missiles'])]
  verifier(`les missiles de l'escorte : ${lance(m1)} et ${lance(m2)} (MMMM) ; plus de Roquettes (${MUTATIONS.some((x) => x.id === 'escorte-roquettes')})`, lance(m1) === 'MMMM' && lance(m2) === 'MMMM' && !MUTATIONS.some((x) => x.id === 'escorte-roquettes'))
  // (LA CHASSE, à la place du Ricochet — Keko, 25/11 : les quatre avions de l'Escadrille chassent, dans les deux ordres)
  const chassent = (c: ConfigVaisseau): string => c.armes.filter((a) => a.id === 'escorte').map((a) => (a.orbite?.chasse === true && a.orbite.ailier === false && a.orbite.laisse === 160 ? 'C' : '-')).join('')
  const [c1, c2] = [prendre(['arme-escorte', 'escorte-chasse', 'escorte-plus']), prendre(['arme-escorte', 'escorte-plus', 'escorte-chasse'])]
  verifier(`la chasse de l'escorte : ${chassent(c1)} et ${chassent(c2)} (CCCC) ; plus de Ricochet (${MUTATIONS.some((x) => x.id === 'escorte-ricochet')})`, chassent(c1) === 'CCCC' && chassent(c2) === 'CCCC' && !MUTATIONS.some((x) => x.id === 'escorte-ricochet'))
  // (LA CADENCE MONTANTE, à la place du Kamikaze — Keko, 25/11 : les quatre avions de l'Escadrille l'ont, dans les deux ordres)
  const montent = (c: ConfigVaisseau): string => c.armes.filter((a) => a.id === 'escorte').map((a) => (a.montee?.max === 3 && a.montee.duree === 3 ? 'C' : '-')).join('')
  const [k1, k2] = [prendre(['arme-escorte', 'escorte-montee', 'escorte-plus']), prendre(['arme-escorte', 'escorte-plus', 'escorte-montee'])]
  verifier(`la cadence montante de l'escorte : ${montent(k1)} et ${montent(k2)} (CCCC) ; plus de Kamikaze ni de Perforantes (${MUTATIONS.some((x) => x.id === 'escorte-kamikaze' || x.id === 'escorte-perforantes')})`, montent(k1) === 'CCCC' && montent(k2) === 'CCCC' && !MUTATIONS.some((x) => x.id === 'escorte-kamikaze' || x.id === 'escorte-perforantes'))
}
// DES NOMS DE CARTES SPÉCIALES TOUS DIFFÉRENTS (Keko, 25/11 : « attention avec les titres cryogénie, cryogénique ; on veut
// vraiment que les noms des cartes spéciales soient différents ; passe tout en vérification ») : les armes, les variations
// et les cartes d'élément — celles en réserve comprises, pour le jour où elles reviennent. Deux noms se ressemblent trop
// s'ils sont pareils aux accents, à la casse et au pluriel près, ou s'ils partagent la racine d'un mot (ses six premières
// lettres, ou toutes s'il en a moins) — sauf les noms des projectiles, « double » et « lance », qui disent seulement sur
// quoi porte la carte (« Grenades givrées », « Lance-grenades », « Lance-missiles »)
{
  const GENERIQUES = ['laser', 'missile', 'balle', 'grenade', 'roquette', 'cable', 'balise', 'harpon', 'double', 'lance']
  const mots = (nom: string): string[] =>
    nom
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .split(/[^a-z]+/)
      .map((m) => m.replace(/[sx]$/, ''))
      .filter((m) => m.length > 0)
  const racines = (nom: string): string[] => mots(nom).filter((m) => m.length >= 5 && !GENERIQUES.includes(m))
  const proches = (a: string, b: string): boolean => {
    if (mots(a).join(' ') === mots(b).join(' ')) return true
    return racines(a).some((x) => racines(b).some((y) => x.slice(0, Math.min(6, x.length, y.length)) === y.slice(0, Math.min(6, x.length, y.length))))
  }
  const cartes = [...MUTATIONS, ...VARIATIONS_EN_RESERVE, ...ARMES_EN_RESERVE.map((af) => ({ id: `arme-${af.id}`, nom: af.nom }))]
  const doublons: string[] = []
  cartes.forEach((x, i) => cartes.slice(i + 1).forEach((y) => proches(x.nom, y.nom) && doublons.push(`${x.nom} (${x.id}) / ${y.nom} (${y.id})`)))
  verifier(`${cartes.length} cartes spéciales, aucun nom trop proche d'un autre (${doublons.join(' ; ') || 'aucun'})`, doublons.length === 0)
}
if (echecs > 0) throw new Error(`${echecs} verification(s) en echec`)
console.log('Tout passe.')

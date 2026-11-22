/**
 * Vérifications des talents du jeu du vortex, sans navigateur.
 */
import { armeDeFaction, ARMES_DE_FACTION, type Mutation, NIVEAU_SPECIAL, carteSpeciale, MUTATIONS, mutationsPrises, ajouterLeBonus, apresUnChoix, armeAmelioree, avecLesBonus, carte, factionAmelioree, type Bonus, ouvrirLeChoix, proposer, RARETES, rareteTiree, reserveApresLeDelai, STATS_DE_FACTION, statsDeLArme } from './talents.ts'
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
verifier(`le canon : ${statsDeLArme(canon).join(', ')} ; le napalm : ${statsDeLArme(napalm).join(', ')} ; le crachat : ${statsDeLArme(crachat).join(', ')} ; le givre : ${statsDeLArme(givre).join(', ')} ; les tourelles : ${statsDeLArme(tourelle).join(', ')} ; les drones (leur orbite n'est pas une zone) : ${statsDeLArme(drones).join(', ')}`, statsDeLArme(canon).join() === 'degats,critique,critiques,cadence,portee' && statsDeLArme(napalm).join() === 'degats,critique,critiques,cadence,portee,zone,pose,feu' && statsDeLArme(crachat).includes('corrosion') && statsDeLArme(givre).includes('givre') && !statsDeLArme(givre).includes('portee') && statsDeLArme(tourelle).includes('pose') && !statsDeLArme(drones).includes('zone'))
const n2 = armeAmelioree(napalm, 'zone', 0.12)
const f2 = armeAmelioree(napalm, 'feu', 0.2)
const g2 = armeAmelioree(givre, 'givre', 0.2)
verifier(`zone +12 % → rayon ${n2.napalm!.rayon.toFixed(2)} (14) ; feu +20 % → la brûlure ${f2.napalm!.dpsBrulure} (10), le reste non (${f2.napalm!.dps}, ${f2.degats}) ; givre +20 % → ralenti ${g2.givre!.ralenti.toFixed(2)} (0,5 : on ôte 60 % de la vitesse au lieu de 50) ; corrosion +20 % → vulnérabilité ${armeAmelioree(crachat, 'corrosion', 0.2).crachat!.acide.bonus.toFixed(2)} (0,35) ; durée des posées +25 % → napalm ${armeAmelioree(napalm, 'pose', 0.25).napalm!.duree} (3), tourelles ${(armeAmelioree(tourelle, 'pose', 0.25) as unknown as { pose: { duree: number } }).pose.duree} (8)`, Math.abs(n2.napalm!.rayon - 15.68) < 1e-9 && f2.napalm!.dpsBrulure === 12 && f2.napalm!.dps === 20 && f2.degats === 60 && Math.abs(g2.givre!.ralenti - 0.4) < 1e-9 && Math.abs(armeAmelioree(crachat, 'corrosion', 0.2).crachat!.acide.bonus - 0.42) < 1e-9 && armeAmelioree(napalm, 'pose', 0.25).napalm!.duree === 3.75 && (armeAmelioree(tourelle, 'pose', 0.25) as unknown as { pose: { duree: number } }).pose.duree === 10)
// TOUTES LES ARMES : la moitié du bonus, sur chaque arme qui a la stat — même prise après la carte ; proposée seulement si
// une arme portée a la stat
{
  const g = carte({ sorte: 'armes' }, 'degats', 'legendaire')
  const zoneG = carte({ sorte: 'armes' }, 'zone', 'rare')
  const ca = { ...base, armes: [canon, napalm] }
  const avec = avecLesBonus(ca, ajouterLeBonus(ajouterLeBonus([], g), zoneG))
  verifier(`toutes les armes : la moitié (+${(g.bonus * 100).toFixed(1)} % de dégâts, la légendaire en donne 25) ; le canon ${avec.armes[0].degats} (${canon.degats}), le napalm ${avec.armes[1].degats} (${napalm.degats}) ; la zone ne touche que le napalm (rayon ${avec.armes[1].napalm!.rayon.toFixed(2)})`, Math.abs(g.bonus - 0.125) < 1e-9 && avec.armes[0].degats > canon.degats && avec.armes[1].degats > napalm.degats && avec.armes[0].portee === canon.portee && avec.armes[1].napalm!.rayon > napalm.napalm!.rayon)
  // (une arme ajoutée après la carte la reçoit aussi)
  const apres = avecLesBonus({ ...base, armes: [canon] }, ajouterLeBonus([], g))
  const plusTard = avecLesBonus({ ...base, armes: [canon, napalm] }, ajouterLeBonus([], g))
  verifier(`toutes les armes vaut pour une arme venue après (napalm ${plusTard.armes[1].degats} au lieu de ${napalm.degats})`, plusTard.armes[1].degats > napalm.degats && apres.armes[0].degats > canon.degats)
  // (la zone n'est proposée qu'avec une arme qui en a une)
  const statsGlobalesVues = (armes: Arme[]): Set<string> => {
    const vues = new Set<string>()
    for (let n = 1; n < 400; n++) for (const ta of proposer(n, n, 1, armes[0], 'humains', Array.from({ length: 999 }, (_, k) => `deja-${k}`), armes)) if (ta.cible.sorte === 'armes') vues.add(ta.stat)
    return vues
  }
  const seul = statsGlobalesVues([canon])
  const avecZone = statsGlobalesVues([canon, napalm])
  verifier(`toutes les armes, proposées selon ce qu'on porte : le canon seul ${[...seul].join(', ')} ; avec le napalm ${[...avecZone].join(', ')}`, seul.has('degats') && !seul.has('zone') && seul.has('critique') && avecZone.has('zone') && avecZone.has('feu'))
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
for (let n = 1; n < 200; n++) for (const x of proposer(3, n, 0, canon, 'humains')) if (x.stat === 'bouclier' || x.stat === 'regeneration' || x.stat === 'zone' || x.stat === 'dephasage' || x.stat === 'feu') rien = false
verifier('une carte hors du pool n’est jamais proposée (le canon n’a pas de zone, l’Empire ni bouclier, ni régénération, ni déphasage)', rien)
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
  const z = armeAmelioree(puits, 'zone', 0.25)
  verifier(`une carte « Zone » de +25 % : la Singularité attire à ${z.puits!.rayon} (45), s'effondre à ${z.puits!.eclat} (28) ; sa force ne bouge pas (${z.puits!.force})`, z.puits!.rayon === 56.25 && z.puits!.eclat === 35 && z.puits!.force === 70)
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
  const n10b = proposer(9, 10, 1, laser, 'humains', ['laser-cryo'])
  const n15 = proposer(9, 15, 0, laser, 'humains', ['arme-railgun'])
  const n15manque = proposer(9, 15, 0, laser, 'humains')
  verifier(`au niveau ${NIVEAU_SPECIAL}, trois spéciales, au moins une nouvelle arme et une variation du laser (${n10.map((x) => x.mutation).join(', ')}) ; pas au 9, ni au second choix une fois prise, ni au 15 si on l'a prise ; manquée, elle revient`, n9.every((x) => x.rarete !== 'speciale') && n10.length === 3 && sortes(n10).includes('arme') && n10.some((x) => mu(x.mutation!).sorte === 'variation' && mu(x.mutation!).arme === 'laser') && n10b.every((x) => x.rarete !== 'speciale') && n15.every((x) => x.rarete !== 'speciale') && n15manque.every((x) => x.rarete === 'speciale'))
  // (quatre armes : plus de nouvelle arme ; après le niveau 30, des variations des armes portées)
  const armesDe = (ids: string[]): Arme[] => [laser, ...ids.flatMap((id) => armeDeFaction(id)!.armes())]
  const quatre = proposer(9, 30, 0, laser, 'humains', ['arme-railgun', 'arme-tesla'], armesDe(['railgun', 'tesla', 'obusier']))
  const n40 = proposer(9, 40, 0, laser, 'humains', ['arme-railgun', 'laser-cryo', 'laser-ricochet'], armesDe(['railgun']))
  // (une arme seule, cinq de ses six variations prises : la dernière, et deux cartes ordinaires pour faire trois)
  const presque = proposer(9, 60, 0, laser, 'humains', ['laser-tourelle', 'laser-drones', 'laser-perforant', 'laser-ricochet', 'laser-rafale'])
  verifier(`moins de trois spéciales qui restent : des ordinaires complètent (${presque.map((x) => x.mutation ?? x.stat).join(', ')})`, presque.length === 3 && presque[0].mutation === 'laser-cryo' && presque.slice(1).every((x) => x.rarete !== 'speciale'))
  verifier(`quatre armes portées : plus que des variations (${sortes(quatre).join(', ')}) ; au 40, trois variations des armes portées (${n40.map((x) => x.mutation).join(', ')})`, quatre.length > 0 && sortes(quatre).every((x) => x === 'variation') && n40.length === 3 && n40.every((x) => mu(x.mutation!).sorte === 'variation' && ['laser', 'railgun'].includes(mu(x.mutation!).arme) && !['laser-cryo', 'laser-ricochet'].includes(x.mutation!)))
  // (une nouvelle arme a SON pool : ses cartes ordinaires reviennent avec celles du laser)
  let cartesDuRail = 0
  for (let n = 41; n < 300; n++) for (const x of proposer(5, n, 1, laser, 'humains', Array.from({ length: 999 }, (_, k) => `deja-${k}`), armesDe(['railgun']))) if (x.cible.sorte === 'arme' && x.cible.arme === 'railgun') cartesDuRail++
  // (prendre une nouvelle arme l'ajoute ; ses variations la changent)
  let b = ajouterLeBonus([], carteSpeciale(mu('arme-railgun')))
  b = ajouterLeBonus(b, carteSpeciale(mu('railgun-large')))
  b = ajouterLeBonus(b, carteSpeciale(mu('laser-tourelle')))
  const c1 = avecLesBonus(base, b)
  verifier(`une nouvelle arme a ses cartes (${cartesDuRail} pour le railgun) ; prise, elle s'ajoute (${c1.armes.map((a) => a.id).join(', ')}), sa variation la change (largeur ${c1.armes.find((a) => a.id === 'railgun')?.rail?.largeur}) ; prises : ${mutationsPrises(b).join(', ')}`, cartesDuRail > 20 && c1.armes.filter((a) => a.id === 'railgun').length === 1 && c1.armes.find((a) => a.id === 'railgun')!.rail!.largeur === 7.5 && c1.armes.filter((a) => a.id === 'laser').length === 3 && mutationsPrises(b).join() === 'arme-railgun,railgun-large,laser-tourelle')
  // (le compte : six armes pour l'Empire, six variations pour chacune des neuf armes en jeu ; chaque variation change bien sa config)
  const ids = ['laser', 'mitraille', 'minimissile', ...ARMES_DE_FACTION.filter((x) => x.race === 'humains').map((x) => x.id)]
  let sansEffet = ''
  for (const id of ids)
    for (const v of MUTATIONS.filter((x) => x.sorte === 'variation' && x.arme === id)) {
      const depart = id === 'laser' ? base : id === 'mitraille' || id === 'minimissile' ? { ...C, armes: [{ ...laser, id, place: 0 }] } : avecLesBonus(base, ajouterLeBonus([], carteSpeciale(mu(`arme-${id}`))))
      if (JSON.stringify(v.appliquer(depart)) === JSON.stringify(depart)) sansEffet += ` ${v.id}`
    }
  verifier(`l'Empire a ${ARMES_DE_FACTION.filter((x) => x.race === 'humains').length} nouvelles armes ; six variations par arme (${ids.map((id) => `${id} ${MUTATIONS.filter((x) => x.sorte === 'variation' && x.arme === id).length}`).join(', ')}) ; aucune sans effet (${sansEffet || 'aucune'})`, ARMES_DE_FACTION.filter((x) => x.race === 'humains').length === 6 && ids.every((id) => MUTATIONS.filter((x) => x.sorte === 'variation' && x.arme === id).length === 6) && sansEffet === '')
}
if (echecs > 0) throw new Error(`${echecs} verification(s) en echec`)
console.log('Tout passe.')

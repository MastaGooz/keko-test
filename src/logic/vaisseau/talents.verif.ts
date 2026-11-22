/**
 * Vérifications des talents du jeu du vortex, sans navigateur.
 */
import { ajouterLeBonus, apresUnChoix, armeAmelioree, avecLesBonus, carte, factionAmelioree, type Bonus, ouvrirLeChoix, proposer, RARETES, rareteTiree, reserveApresLeDelai, STATS_DE_FACTION, statsDeLArme } from './talents.ts'
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
verifier(`les chances des raretés font 100 % (${Math.round(RARETES.reduce((n, r) => n + r.chance, 0) * 100)}), leurs bonus montent : ${RARETES.map((r) => `+${Math.round(r.bonus * 100)} %`).join(' ')}`, Math.abs(RARETES.reduce((n, r) => n + r.chance, 0) - 1) < 1e-9 && RARETES.every((r, i) => i === 0 || r.bonus > RARETES[i - 1].bonus))
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
const crit = avecLesBonus(base, ajouterLeBonus(ajouterLeBonus([], carte({ sorte: 'arme', arme: 'canon' }, 'critique', 'commune')), carte({ sorte: 'arme', arme: 'canon' }, 'critiques', 'rare')))
verifier(`le critique : une commune +1 point de chance (${(crit.passifs.critique * 100).toFixed(0)} %), une rare +12 points de dégâts critiques (${(crit.passifs.critiqueFacteur * 100).toFixed(0)} %, ${(base.passifs.critiqueFacteur * 100).toFixed(0)} avant)`, Math.abs(crit.passifs.critique - base.passifs.critique - 0.01) < 1e-9 && Math.abs(crit.passifs.critiqueFacteur - base.passifs.critiqueFacteur - 0.12) < 1e-9)

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
verifier(`trois cartes différentes, du pool de l'arme et de la faction : ${p1.map((x) => `${x.id} (${x.rarete})`).join(', ')} ; les mêmes pour la même partie et le même niveau`, p1.length === 3 && new Set(p1.map((x) => x.id)).size === 3 && proposer(7, 2, 0, canon, 'essaim').map((x) => x.id + x.rarete).join() === p1.map((x) => x.id + x.rarete).join() && p1.every((x) => (x.cible.sorte === 'arme' ? x.cible.arme === 'canon' : x.cible.race === 'essaim')))
let rien = true
for (let n = 1; n < 200; n++) for (const x of proposer(3, n, 0, canon, 'humains')) if (x.stat === 'bouclier' || x.stat === 'regeneration' || x.stat === 'zone' || x.stat === 'dephasage' || x.stat === 'feu') rien = false
verifier('une carte hors du pool n’est jamais proposée (le canon n’a pas de zone, l’Empire ni bouclier, ni régénération, ni déphasage)', rien)
const rar = new Map<string, number>()
for (let n = 1; n <= 3000; n++) for (const x of proposer(11, n, 0, canon, 'etheres')) rar.set(x.rarete, (rar.get(x.rarete) ?? 0) + 1)
verifier(`sur 9 000 cartes tirées : ${RARETES.map((r) => `${r.nom} ${Math.round(((rar.get(r.id) ?? 0) / 9000) * 1000) / 10} %`).join(', ')}`, Math.abs((rar.get('commune') ?? 0) / 9000 - 0.55) < 0.03 && (rar.get('legendaire') ?? 0) > 30 && (rar.get('legendaire') ?? 0) < 160)

verifier('un choix à faire, plus la réserve ; le dernier choisi, c’est fini', ouvrirLeChoix(0).aFaire === 1 && ouvrirLeChoix(1).aFaire === 2 && apresUnChoix(ouvrirLeChoix(0)) === null && apresUnChoix(ouvrirLeChoix(1))?.aFaire === 1 && apresUnChoix(ouvrirLeChoix(1))?.rang === 1)
const recup = new Map<string, number>()
for (let n = 1; n <= 4000; n++) for (const x of proposer(5, n, 0, canon, 'humains')) if (x.stat === 'recuperation') recup.set(x.rarete, (recup.get(x.rarete) ?? 0) + 1)
verifier(`la Récupération de l'Empire paraît à toutes les raretés (${RARETES.map((r) => `${r.nom} ${recup.get(r.id) ?? 0}`).join(', ')}), son bonus celui de la rareté`, RARETES.every((r) => (recup.get(r.id) ?? 0) > 0) && carte({ sorte: 'faction', race: 'humains' }, 'recuperation', 'rare').bonus === 0.12)
verifier('le délai passé, ce qui restait à choisir part en réserve', reserveApresLeDelai(ouvrirLeChoix(0)) === 1 && reserveApresLeDelai(ouvrirLeChoix(1)) === 2 && reserveApresLeDelai(apresUnChoix(ouvrirLeChoix(1))!) === 1)

{
  // (LA ZONE GRANDIT TOUT CE QUI EST UNE ZONE — 22/11 : le rayon de la Singularité, et celui de son effondrement)
  const puits = { id: 'puits', cadence: 5, degats: 11.5, portee: 130, vitesse: 0, vie: 0, dispersion: 0, guide: false, puits: { vitesse: 150, rayon: 45, force: 70, duree: 2, eclat: 28 } } as Arme
  const z = armeAmelioree(puits, 'zone', 0.25)
  verifier(`une carte « Zone » de +25 % : la Singularité attire à ${z.puits!.rayon} (45), s'effondre à ${z.puits!.eclat} (28) ; sa force ne bouge pas (${z.puits!.force})`, z.puits!.rayon === 56.25 && z.puits!.eclat === 35 && z.puits!.force === 70)
}
if (echecs > 0) throw new Error(`${echecs} verification(s) en echec`)
console.log('Tout passe.')

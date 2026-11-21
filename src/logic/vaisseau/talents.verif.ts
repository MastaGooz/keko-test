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

// LE POOL D'UNE ARME : ce qu'elle porte
verifier(`le canon : ${statsDeLArme(canon).join(', ')} ; le napalm : ${statsDeLArme(napalm).join(', ')} ; les drones (le rayon de leur orbite n'est pas une zone) : ${statsDeLArme(drones).join(', ')}`, statsDeLArme(canon).join() === 'degats,cadence,portee' && statsDeLArme(napalm).join() === 'degats,cadence,portee,zone,duree' && !statsDeLArme(drones).includes('zone'))
const n2 = armeAmelioree(napalm, 'zone', 0.12)
const d2 = armeAmelioree(napalm, 'degats', 0.05)
verifier(`en pour cent : zone +12 % → rayon ${n2.napalm!.rayon.toFixed(2)} (14) ; dégâts +5 % → ${d2.degats}, ${d2.napalm!.dps}, ${d2.napalm!.dpsBrulure} (60, 20, 10 : un de plus au moins) ; cadence +8 % → ${armeAmelioree(canon, 'cadence', 0.08).cadence.toFixed(3)} ; l'orbite des drones ne bouge pas`, Math.abs(n2.napalm!.rayon - 15.68) < 1e-9 && d2.degats === 63 && d2.napalm!.dps === 21 && d2.napalm!.dpsBrulure === 11 && Math.abs(armeAmelioree(canon, 'cadence', 0.08).cadence - 1.1 / 1.08) < 1e-9 && armeAmelioree(drones, 'zone', 0.5).orbite!.rayon === 30)

// LE POOL D'UNE FACTION
verifier(`les factions : ${Object.entries(STATS_DE_FACTION).map(([r, s]) => `${r} ${s.join('/')}`).join(' ; ')}`, (Object.values(STATS_DE_FACTION) as string[][]).every((s) => s.includes('blindage') && s.includes('moteur') && s.includes('aimant')) && STATS_DE_FACTION.essaim.includes('regeneration') && STATS_DE_FACTION.etheres.includes('bouclier') && STATS_DE_FACTION.innommes.includes('dephasage'))
const f = (s: Parameters<typeof factionAmelioree>[1]): ConfigVaisseau => factionAmelioree(base, s, 0.25)
verifier('en pour cent : PV, régénération, bouclier, recharge, déphasage, moteur — rien d’autre ne bouge', f('blindage').coque === base.coque * 1.25 && f('regeneration').regeneration === 0.0125 && f('bouclier').bouclier.points === 3.75 && f('recharge').bouclier.delai < base.bouclier.delai && Math.abs(f('dephasage').dephasage.chance - 0.0625) < 1e-12 && f('moteur').vitesseMax === base.vitesseMax * 1.25 && f('blindage').armes === base.armes)

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
for (let n = 1; n < 200; n++) for (const x of proposer(3, n, 0, canon, 'humains')) if (x.stat === 'bouclier' || x.stat === 'regeneration' || x.stat === 'zone' || x.stat === 'dephasage') rien = false
verifier('une carte hors du pool n’est jamais proposée (le canon n’a pas de zone, l’Empire ni bouclier, ni régénération, ni déphasage)', rien)
const rar = new Map<string, number>()
for (let n = 1; n <= 3000; n++) for (const x of proposer(11, n, 0, canon, 'etheres')) rar.set(x.rarete, (rar.get(x.rarete) ?? 0) + 1)
verifier(`sur 9 000 cartes tirées : ${RARETES.map((r) => `${r.nom} ${Math.round(((rar.get(r.id) ?? 0) / 9000) * 1000) / 10} %`).join(', ')}`, Math.abs((rar.get('commune') ?? 0) / 9000 - 0.55) < 0.03 && (rar.get('legendaire') ?? 0) > 30 && (rar.get('legendaire') ?? 0) < 160)

verifier('un choix à faire, plus la réserve ; le dernier choisi, c’est fini', ouvrirLeChoix(0).aFaire === 1 && ouvrirLeChoix(1).aFaire === 2 && apresUnChoix(ouvrirLeChoix(0)) === null && apresUnChoix(ouvrirLeChoix(1))?.aFaire === 1 && apresUnChoix(ouvrirLeChoix(1))?.rang === 1)
verifier('le délai passé, ce qui restait à choisir part en réserve', reserveApresLeDelai(ouvrirLeChoix(0)) === 1 && reserveApresLeDelai(ouvrirLeChoix(1)) === 2 && reserveApresLeDelai(apresUnChoix(ouvrirLeChoix(1))!) === 1)

if (echecs > 0) throw new Error(`${echecs} verification(s) en echec`)
console.log('Tout passe.')

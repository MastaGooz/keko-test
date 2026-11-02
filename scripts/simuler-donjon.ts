/**
 * `npm run donjon` : joue une saison du donjon coopératif avec les quatre
 * bots, sans affichage, et en sort le rapport.
 *
 *   npm run donjon                 la graine 1
 *   npm run donjon -- --seed=7     une autre graine
 *   npm run donjon -- --graines=10 dix saisons, le résumé de chacune
 *
 * L'équilibrage se règle dans `src/logic/donjon/config.ts`.
 */
import { DONJON } from '../src/logic/donjon/config.ts'
import { simulerSaison, type RapportSaison } from '../src/logic/donjon/simulation.ts'

function option(nom: string, defaut: number): number {
  const arg = process.argv.find((a) => a.startsWith(`--${nom}=`))
  return arg === undefined ? defaut : Number(arg.slice(nom.length + 3))
}

function court(n: number): string {
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)} G`
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)} M`
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)} k`
  return n.toFixed(0)
}

const pc = (x: number) => `${(x * 100).toFixed(1)} %`

function afficher(r: RapportSaison): void {
  console.log(`\nSAISON — graine ${r.seed}`)
  console.log(`  étage atteint par jour : ${r.etageParJour.map((e, i) => `J${i + 1} ${e}`).join(' · ')}`)
  console.log(`  étage final : ${r.etageFinal}`)
  console.log(`  dégâts totaux : ${court(r.degatsTotaux)} (taps ${pc(r.partTap)}, auto ${pc(1 - r.partTap)})`)
  console.log('')
  console.log('  joueur               part      dont taps   niveau   kills   dégâts')
  for (const j of r.joueurs) {
    console.log(
      `  ${j.nom.padEnd(20)} ${pc(j.part).padStart(7)}   ${pc(j.partTap).padStart(9)}   ${String(j.niveau).padStart(6)}   ${String(j.kills).padStart(5)}   ${court(j.degats)}`,
    )
  }
}

const graines = option('graines', 1)
const seed = option('seed', 1)
const debut = performance.now()

if (graines <= 1) {
  afficher(await simulerSaison(DONJON, seed))
} else {
  console.log(`\n${graines} SAISONS`)
  console.log(`  graine   étage final   ${DONJON.bots.profils.map((p) => p.nom.replace('Bot ', '').padStart(14)).join(' ')}`)
  for (let s = seed; s < seed + graines; s++) {
    const r = await simulerSaison(DONJON, s)
    const parts = DONJON.bots.profils.map((p) => pc(r.joueurs.find((j) => j.id === p.id)?.part ?? 0).padStart(14))
    console.log(`  ${String(s).padStart(6)}   ${String(r.etageFinal).padStart(11)}   ${parts.join(' ')}`)
  }
}
console.log(`\n(${((performance.now() - debut) / 1000).toFixed(2)} s)`)

/**
 * Vérifications du générateur d'icônes, sans navigateur : déterminisme,
 * variété, chemins sains, tout dans la boîte.
 */
import { BOITE, FAMILLES, RACES, ROLES, genererDessin, seedDe, type Famille, type Race } from './index.ts'
import { figurineSaine, genererFigurine } from './figurine.ts'
import { genererVaisseau3D } from './vaisseau3d.ts'

let echecs = 0
function verifier(quoi: string, vrai: boolean): void {
  if (!vrai) echecs += 1
  console.log(`  ${vrai ? 'ok  ' : 'ECHEC'}  ${quoi}`)
}

/** Les nombres d'un chemin, hors drapeaux d'arc (on ne lit que les coordonnées). */
function nombres(d: string): number[] {
  return (d.match(/-?\d+(?:\.\d+)?/g) ?? []).map(Number)
}

console.log('seed')
verifier('déterministe', seedDe('v-abc') === seedDe('v-abc'))
verifier('deux ids voisins diffèrent', seedDe('v-1') !== seedDe('v-2'))
verifier('entier 32 bits', Number.isInteger(seedDe('x')) && seedDe('x') >= 0 && seedDe('x') < 2 ** 32)

const cas: [Famille, Race][] = []
for (const famille of FAMILLES) {
  if ((ROLES as readonly string[]).includes(famille)) for (const race of RACES) cas.push([famille, race])
  else cas.push([famille, 'humain'])
}
for (const [famille, race] of cas) {
  console.log(`${famille} ${race}`)
  const a = genererDessin(famille, 'test-1', race)
  const b = genererDessin(famille, 'test-1', race)
  verifier('même id = même dessin', JSON.stringify(a) === JSON.stringify(b))
  verifier('autre id = autre dessin', JSON.stringify(genererDessin(famille, 'test-2', race)) !== JSON.stringify(a))
  verifier('quelques formes', a.formes.length >= 4)

  let sains = true
  let dedans = true
  let clipsConnus = true
  const empreintes = new Set<string>()
  for (let i = 0; i < 300; i++) {
    const d = genererDessin(famille, `${famille}-${i}`, race)
    // L'empreinte est le dessin entier : les aliens n'ont que quelques choix
    // discrets (plan, palette), leur variété est dans les courbes.
    empreintes.add(JSON.stringify(d.formes))
    const ids = new Set(d.clips.map((c) => c.id))
    for (const f of d.formes) {
      if (!f.d || /NaN|Infinity/.test(f.d)) sains = false
      if (f.clip && !ids.has(f.clip)) clipsConnus = false
      // Ce qui est découpé peut déborder ; le reste doit tenir dans la boîte.
      if (!f.clip) {
        for (const v of nombres(f.d)) if (v < -1 || v > BOITE + 1) dedans = false
      }
    }
  }
  verifier('300 dessins sans NaN', sains)
  verifier('les découpes nommées existent', clipsConnus)
  verifier('les formes non découpées tiennent dans la boîte', dedans)
  // L'origami est fait de choix discrets (le plan, ses options, le papier) : moins de variété, c'est attendu.
  const attendu = famille === 'origami' ? 200 : 290
  verifier(`300 ids donnent plus de ${attendu} dessins différents`, empreintes.size > attendu)
}

console.log('figurine 3D')
verifier('même id = même figurine', JSON.stringify(genererFigurine('f-1')) === JSON.stringify(genererFigurine('f-1')))
verifier('autre id = autre figurine', JSON.stringify(genererFigurine('f-2')) !== JSON.stringify(genererFigurine('f-1')))
let saines = true
for (let i = 0; i < 300; i++) if (!figurineSaine(genererFigurine(`figurine-${i}`))) saines = false
verifier('300 figurines saines, dans le cube unité', saines)
console.log('vaisseau 3D')
verifier('même id = même vaisseau', JSON.stringify(genererVaisseau3D('w-1')) === JSON.stringify(genererVaisseau3D('w-1')))
let sains3d = true
for (let i = 0; i < 300; i++) {
  const v = genererVaisseau3D(`v3d-${i}`)
  for (const s of v.solides) {
    const ok = (n: number) => Number.isFinite(n) && Math.abs(n) <= 1.2
    if (!ok(s.x) || !ok(s.y) || !ok(s.z) || !s.s.every(ok)) sains3d = false
    if (s.pts && !s.pts.every(([a, b]) => ok(a) && ok(b))) sains3d = false
  }
}
verifier('300 vaisseaux 3D sains, dans le cube', sains3d)

console.log(echecs === 0 ? 'Tout passe.' : `${echecs} echec(s).`)
if (echecs > 0) throw new Error(`${echecs} verification(s) en echec`)

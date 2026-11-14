/**
 * Vérifications des talents du jeu du vortex, sans navigateur.
 */
import { apresUnChoix, ouvrirLeChoix, proposer, reserveApresLeDelai, TALENTS } from './talents.ts'
import { VAISSEAU as C, type ConfigVaisseau } from './jeu.ts'

let echecs = 0
function verifier(quoi: string, vrai: boolean): void {
  if (!vrai) echecs += 1
  console.log(`  ${vrai ? 'ok  ' : 'ECHEC'}  ${quoi}`)
}

console.log('talents')
const arme = { id: 'canon', cadence: 1.1, degats: 6, portee: 120, vitesse: 170, vie: 1, dispersion: 0.05, guide: false }
const base: ConfigVaisseau = { ...C, armes: [arme], bouclier: { ...C.bouclier, points: 3 } }
verifier('des identifiants uniques ; chaque talent change la configuration sans toucher celle d’avant', new Set(TALENTS.map((x) => x.id)).size === TALENTS.length && TALENTS.every((x) => JSON.stringify(x.appliquer(base)) !== JSON.stringify(base)) && base.armes[0].cadence === 1.1 && base.coque === C.coque)
const t = (id: string): ConfigVaisseau => TALENTS.find((x) => x.id === id)!.appliquer(base)
verifier('les armes : plus souvent (le délai baisse), plus fort, plus loin', t('cadence').armes[0].cadence < 1.1 && Math.abs(t('degats').armes[0].degats - 7.5) < 1e-9 && t('portee').armes[0].portee === 144)
verifier('le vaisseau : plus vite, un point de blindage, un point de bouclier, un bouclier qui revient plus tôt', t('moteur').vitesseMax > base.vitesseMax && t('blindage').coque === base.coque + 1 && t('bouclier').bouclier.points === 4 && t('recharge').bouclier.delai < base.bouclier.delai)
verifier('un talent repris se cumule', TALENTS.find((x) => x.id === 'blindage')!.appliquer(t('blindage')).coque === base.coque + 2)
const p1 = proposer(7, 2)
verifier('trois propositions différentes, les mêmes pour la même partie et le même niveau ; un second choix en tire d’autres', p1.length === 3 && new Set(p1.map((x) => x.id)).size === 3 && proposer(7, 2).map((x) => x.id).join() === p1.map((x) => x.id).join() && [3, 4, 5, 6, 7, 8].some((n) => proposer(7, n).map((x) => x.id).join() !== p1.map((x) => x.id).join()))
verifier('un choix à faire, plus la réserve ; le dernier choisi, c’est fini', ouvrirLeChoix(0).aFaire === 1 && ouvrirLeChoix(1).aFaire === 2 && apresUnChoix(ouvrirLeChoix(0)) === null && apresUnChoix(ouvrirLeChoix(1))?.aFaire === 1 && apresUnChoix(ouvrirLeChoix(1))?.rang === 1)
verifier('le délai passé, ce qui restait à choisir part en réserve', reserveApresLeDelai(ouvrirLeChoix(0)) === 1 && reserveApresLeDelai(ouvrirLeChoix(1)) === 2 && reserveApresLeDelai(apresUnChoix(ouvrirLeChoix(1))!) === 1)

if (echecs > 0) throw new Error(`${echecs} verification(s) en echec`)
console.log('Tout passe.')

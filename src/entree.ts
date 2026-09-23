/**
 * L'entrée : le jeu par défaut, le prototype de carte derrière `?proto`, et
 * **le moteur 3D derrière `?r3f`**.
 *
 * Le gabarit « Serment de cendre » est porté dans le jeu ; la planche du
 * prototype reste accessible pour juger une retouche de carte à part, sans
 * gagner un combat pour la voir.
 *
 * LE MOTEUR 3D SE CONSTRUIT À CÔTÉ, PAS À LA PLACE. Tant qu'il n'a pas
 * rattrapé ce qui se joue aujourd'hui, la page par défaut reste le jeu
 * jouable : Keko teste depuis son téléphone, et une réécriture qui commence
 * par casser la page le laisse sans rien pendant des semaines.
 *
 * Les trois branches sont des imports DYNAMIQUES : React et three ne sont
 * téléchargés que si on demande `?r3f`. La page par défaut garde son poids.
 */
import './ui/styles.css'
import { verifierVersion } from './ui/version.ts'

// LE GARDE-FOU ANTI-CACHE VIT ICI, PAS DANS UNE BRANCHE. Il n'était appelé que
// par le jeu 2D : la page `?r3f` gardait donc un vieux HTML, donc un vieux
// bundle, indéfiniment — Keko testait une version périmée sans que rien ne le
// dise. *Tout ce qui vaut pour une entrée du jeu vaut pour les trois.*
void verifierVersion(__BUILD_TIME__)

if (new URLSearchParams(location.search).has('r3f')) {
  void import('./render/monter.tsx').then(({ monter3d }) => {
    const racine = document.getElementById('app')
    if (racine !== null) monter3d(racine)
  })
} else if (new URLSearchParams(location.search).has('proto')) {
  void import('./ui/proto.ts').then(({ montrerProto }) => {
    const racine = document.getElementById('app')
    if (racine !== null) montrerProto(racine, __BUILD_TIME__)
  })
} else {
  void import('./main.ts')
}

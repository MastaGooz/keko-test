/**
 * L'entrée : le jeu par défaut, le prototype de carte derrière `?proto`.
 *
 * Le gabarit « Serment de cendre » est porté dans le jeu ; la planche du
 * prototype reste accessible pour juger une retouche de carte à part, sans
 * gagner un combat pour la voir.
 */
import './ui/styles.css'

if (new URLSearchParams(location.search).has('proto')) {
  void import('./ui/proto.ts').then(({ montrerProto }) => {
    const racine = document.getElementById('app')
    if (racine !== null) montrerProto(racine, __BUILD_TIME__)
  })
} else {
  void import('./main.ts')
}

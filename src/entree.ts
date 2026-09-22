/**
 * L'entrée : le prototype de carte par défaut, le jeu derrière `?jeu`.
 *
 * Le temps de reprendre le dessin des cartes, la page montre le prototype et
 * rien d'autre — Keko juge une carte, pas un combat. Le jeu n'a pas bougé, il
 * attend derrière un paramètre.
 */
import './ui/styles.css'

if (new URLSearchParams(location.search).has('jeu')) {
  void import('./main.ts')
} else {
  void import('./ui/proto.ts').then(({ montrerProto }) => {
    const racine = document.getElementById('app')
    if (racine !== null) montrerProto(racine, __BUILD_TIME__)
  })
}

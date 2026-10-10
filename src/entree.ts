/**
 * L'ENTRÉE DU JEU.
 *
 * **LE MOTEUR 3D EST LA PAGE PAR DÉFAUT, et le jeu 2D n'existe plus.** Tranché
 * par Keko : « supprime complètement tout ce qui se rapporte au jeu 2D, on
 * garde l'extraction ».
 *
 * *C'était la condition écrite depuis le début de la réécriture* — « le moteur
 * 3D se construit derrière `?r3f`, PAS à la place du jeu : tant qu'il n'a pas
 * rattrapé ce qui se joue, la page par défaut reste la version jouable ». Il
 * l'a rattrapée : armurerie, descente entière, butin, mort et retour au hub.
 * **Le garde-fou tombe quand ce qu'il protégeait est arrivé.**
 *
 * `?r3f` reste accepté et ne fait plus rien : *tous les liens déjà donnés à
 * Keko le portent*, et une adresse qu'on a distribuée ne doit pas cesser de
 * marcher le jour où elle devient inutile.
 *
 * Les imports sont DYNAMIQUES : React et three pèsent 311 Ko gzip, et la
 * branche `?paquet` n'a aucune raison de charger la descente — ni l'inverse.
 */
import './ui/styles.css'
import { verifierVersion } from './ui/version.ts'

// LE GARDE-FOU ANTI-CACHE VIT ICI, PAS DANS UNE BRANCHE. Il n'était appelé que
// par le jeu 2D : la page `?r3f` gardait donc un vieux HTML, donc un vieux
// bundle, indéfiniment — Keko testait une version périmée sans que rien ne le
// dise. *Tout ce qui vaut pour une entrée du jeu vaut pour les trois.*
void verifierVersion(__BUILD_TIME__)

const parametres = new URLSearchParams(location.search)

if (parametres.has('paquet')) {
  // LE TROISIÈME MODE — les paquets d'animaux, et `&perso` rejoue l'ancien
  // catalogue de personnages. Il reste à côté du jeu plutôt que dedans : tant
  // qu'il n'est pas un jeu, il ne prend pas la page.
  void import('./render/monter-paquet.tsx').then(({ monterPaquet }) => {
    const racine = document.getElementById('app')
    if (racine !== null) monterPaquet(racine)
  })
} else if (parametres.has('board')) {
  // LE PROTOTYPE DE PLATEAU — il ne prend pas la page, comme les paquets : tant
  // qu'il n'est pas un jeu, il vit à côté. `?board&pool=N` change le sous-pool,
  // `?board&seed=7` rejoue une partie.
  void import('./render/board.ts').then(({ montrerPlateau }) => {
    const racine = document.getElementById('app')
    if (racine !== null) void montrerPlateau(racine, __BUILD_TIME__)
  })
} else if (parametres.has('duel')) {
  // LE DUEL — deux joueurs posent a tour de role, le total sur la grille pleine
  // designe le vainqueur. `?duel&ordre=serpent` change le tour de jeu,
  // `?duel&seed=7` rejoue une partie, `?duel&pool=N` change le sous-pool.
  void import('./render/duel.ts').then(({ montrerDuel }) => {
    const racine = document.getElementById('app')
    if (racine !== null) void montrerDuel(racine, __BUILD_TIME__)
  })
} else if (parametres.has('ecusson')) {
  // La planche des symboles de coût : *ce qui a servi à choisir doit rester
  // ouvrable, même une fois le choix fait.*
  void import('./render/planche-ecusson.ts').then(({ montrerPlancheEcusson }) => {
    const racine = document.getElementById('app')
    if (racine !== null) void montrerPlancheEcusson(racine, __BUILD_TIME__)
  })
} else {
  void import('./render/monter.tsx').then(({ monter3d }) => {
    const racine = document.getElementById('app')
    if (racine !== null) monter3d(racine)
  })
}

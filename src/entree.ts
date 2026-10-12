/**
 * L'ENTRÉE.
 *
 * **LA COLLECTION D'EMOJI EST LA PAGE PAR DÉFAUT ; L'EXTRACTION EST UNE
 * ARCHIVE.** Tranché par Keko : « on laisse définitivement tomber les animaux
 * et les personnages, on garde le projet emoji qui devient le principal ; le
 * projet extraction on le garde en archive mais on ne travaille plus dessus ».
 *
 * *Un projet principal s'ouvre sans paramètre, une archive s'ouvre par son
 * nom.* C'est exactement le mouvement qui avait déjà donné la racine au moteur
 * 3D quand il a rattrapé le jeu : **la page par défaut appartient à ce sur
 * quoi on travaille.**
 *
 * **Trois adresses ouvrent encore l'extraction** — `?extraction`, son nom
 * honnête, plus `?r3f` et `?jeu` qui la portaient déjà : *tous les liens déjà
 * donnés à Keko passent par là*, et une adresse qu'on a distribuée ne doit pas
 * cesser de marcher le jour où elle change de rang.
 *
 * `?paquet` reste accepté pour la même raison, et ouvre la même chose que la
 * racine.
 *
 * Les imports sont DYNAMIQUES : React et three pèsent 311 Ko gzip, et la
 * collection n'a aucune raison de charger la descente — ni l'inverse.
 */
import './ui/styles.css'
import { verifierVersion } from './ui/version.ts'

// LE GARDE-FOU ANTI-CACHE VIT ICI, PAS DANS UNE BRANCHE. Il n'était appelé que
// par le jeu 2D : la page `?r3f` gardait donc un vieux HTML, donc un vieux
// bundle, indéfiniment — Keko testait une version périmée sans que rien ne le
// dise. *Tout ce qui vaut pour une entrée du jeu vaut pour les trois.*
void verifierVersion(__BUILD_TIME__)

const parametres = new URLSearchParams(location.search)

/** L'EXTRACTION, l'archive : trois noms pour une seule porte. */
const archive = ['extraction', 'r3f', 'jeu'].some((n) => parametres.has(n))

if (archive) {
  // LE JEU D'EXTRACTION — gardé en archive, on ne travaille plus dessus. Il
  // garde toutes ses adresses : *une adresse qu'on a distribuée ne doit pas
  // cesser de marcher le jour où elle change de rang.*
  //
  // ET IL GARDE SON EXIGENCE DE PAYSAGE, que la collection vient d'abandonner.
  // *Son réglage est un rasoir et personne ne le rejoue* : une archive qu'on
  // bascule en portrait sans la rejouer est une archive qu'on casse. Le
  // drapeau vit sur la racine du document, donc le CSS le lit sans qu'aucun
  // module n'ait à savoir dans quel mode il tourne.
  document.documentElement.classList.add('paysage-requis')
  void import('./render/monter.tsx').then(({ monter3d }) => {
    const racine = document.getElementById('app')
    if (racine !== null) monter3d(racine)
  })
} else if (parametres.has('ecusson')) {
  // La planche des symboles de coût : *ce qui a servi à choisir doit rester
  // ouvrable, même une fois le choix fait.*
  void import('./render/planche-ecusson.ts').then(({ montrerPlancheEcusson }) => {
    const racine = document.getElementById('app')
    if (racine !== null) void montrerPlancheEcusson(racine, __BUILD_TIME__)
  })
} else {
  // LA COLLECTION D'EMOJI — le projet principal, donc la page par défaut.
  // `&art` ouvre les peintures, `&peau` les variantes de couleur de peau.
  void import('./render/monter-paquet.tsx').then(({ monterPaquet }) => {
    const racine = document.getElementById('app')
    if (racine !== null) monterPaquet(racine)
  })
}

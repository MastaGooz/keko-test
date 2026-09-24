/**
 * LA PLANCHE DES SYMBOLES DE COÛT, derrière `?ecusson`.
 *
 * Keko : « on dirait un bouclier, ça ne renvoie pas trop à l'énergie, et la
 * couleur rouge est un peu bizarre ». Les deux gênes ont la même racine : le
 * symbole est un BLASON — pointe en bas, comme un écu — et il est ROUGE, alors
 * que l'énergie du joueur est un orbe d'OR dans l'interface. *Deux objets qui
 * doivent être le même n'ont jamais eu ni la même forme ni la même couleur.*
 *
 * **Une famille de symboles ne se juge pas sur une description**, et c'est la
 * règle du dépôt : le mécanisme des trésors a reçu deux « chiant » sur une
 * interface en lignes de texte, puis « ça va » une fois dessiné. La planche
 * montre donc les candidats sur de VRAIES cartes, à la taille qu'ils auront
 * dans la main, et en grand à côté pour le détail.
 *
 * Elle vit derrière un paramètre comme `?proto` : Keko juge depuis son
 * téléphone, il lui faut une page déployée, pas un fichier de scratchpad.
 */
import { choisirStyleCout, peindreCarte, type StyleCout } from './texture-carte.ts'
import type { CarteAPeindre } from './texture-carte.ts'

const CANDIDATS: { style: StyleCout; nom: string; note: string }[] = [
  { style: 'blason', nom: 'Blason', note: 'celui d’aujourd’hui, pointe en bas et rouge' },
  { style: 'losange', nom: 'Losange', note: 'l’inverse exact de l’écu : la pointe monte' },
  { style: 'hexagone', nom: 'Hexagone', note: 'une pièce mécanique, aucune parenté héraldique' },
  { style: 'orbe', nom: 'Orbe', note: 'exactement l’objet que porte déjà le joueur' },
  { style: 'eclat', nom: 'Éclat', note: 'un scintillement à quatre branches autour d’un disque' },
]

/** Deux cartes : un coût à un chiffre et le plus cher du jeu. */
const CARTES: CarteAPeindre[] = [
  { id: 'a', nom: 'Taillade', cout: 2, effet: ['Inflige 6 dégâts'], type: 'Attaque' },
  { id: 'b', nom: 'Tornade', cout: 5, effet: ['Inflige 10 dégâts à tous'], type: 'Attaque' },
]

export async function montrerPlancheEcusson(racine: HTMLElement, build: string): Promise<void> {
  racine.innerHTML = `
    <div class="ec-page">
      <h1 class="ec-titre">Le symbole du coût</h1>
      <p class="ec-note">
        Cinq pistes, sur de vraies cartes. Le symbole choisi servira AUSSI d’orbe
        d’énergie au joueur, en plus grand : c’est la règle — le même symbole
        partout, pour qu’on le comprenne d’un coup.
      </p>
      <div class="ec-rangs"></div>
      <p class="ec-build">${build}</p>
    </div>`

  const rangs = racine.querySelector('.ec-rangs')
  if (rangs === null) return

  for (const candidat of CANDIDATS) {
    choisirStyleCout(candidat.style)
    const rang = document.createElement('section')
    rang.className = 'ec-rang'
    rang.innerHTML = `<h2>${candidat.nom}</h2><p>${candidat.note}</p><div class="ec-cartes"></div>`
    const boite = rang.querySelector('.ec-cartes')
    rangs.appendChild(rang)
    if (boite === null) continue

    for (const carte of CARTES) {
      // LA MÊME FONCTION QUE LE JEU. La redessiner ici, c'est garantir que la
      // planche et la carte divergent — la faute des quatre fonctions qui
      // dessinaient chacune leur carte avant `corpsCarte`.
      const canvas = await peindreCarte(carte)
      canvas.className = 'ec-carte'
      boite.appendChild(canvas)

      // LA LOUPE : le même dessin, agrandi et rogné sur le coin. C'est là que
      // se joue le détail du sertissage, et il est illisible à la taille de la
      // main — or c'est à cette taille-là qu'on jouera.
      const loupe = document.createElement('div')
      loupe.className = 'ec-loupe'
      const gros = await peindreCarte(carte)
      loupe.appendChild(gros)
      boite.appendChild(loupe)
    }
  }
  // ON REPOSE CE QUE LE JEU UTILISE, pas ce qui vient d'être dessiné.
  choisirStyleCout('orbe')
}

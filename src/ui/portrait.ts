/**
 * Le portrait du joueur : une VRAIE IMAGE, si elle est là.
 *
 * C'est la première entorse à la borne « pas d'assets, pas de fichiers image »
 * du projet, et c'est Keko qui l'a levée — comme il l'avait fait pour les
 * dessins de la main : *ce qu'il doit juger doit être présentable*. Elle reste
 * une entorse, donc elle est contenue à un seul fichier et à un seul corps.
 *
 * **Le portrait est OPTIONNEL, et c'est ce qui rend l'essai sans risque.** Tant
 * que `public/joueur.png` n'existe pas, le jeu rend la silhouette SVG comme
 * avant — on ne peut pas casser le rendu en oubliant de déposer le fichier, ni
 * en le retirant. Le repli n'est pas une précaution de style : sans lui, un
 * essai abandonné laisserait une image cassée sur la scène ET dans le gros
 * plan.
 *
 * Le chemin passe par `BASE_URL` : en build, le jeu est servi sous
 * `/keko-test/`, et un `/joueur.png` absolu pointerait à la racine du domaine.
 */

/** Là où le fichier est attendu. Un seul endroit le sait. */
const CHEMIN = `${import.meta.env.BASE_URL}joueur.png`

let disponible = false

/**
 * Cherche l'image, une fois. Résout toujours — un échec veut simplement dire
 * « pas de portrait », ce qui est un état normal et pas une erreur.
 *
 * `main.ts` redessine quand ça résout : la détection est asynchrone, donc le
 * premier rendu part forcément sans elle.
 */
export function chercherPortrait(): Promise<boolean> {
  return new Promise((resoudre) => {
    const image = new Image()
    image.onload = () => {
      disponible = true
      resoudre(true)
    }
    image.onerror = () => resoudre(false)
    image.src = CHEMIN
  })
}

export function portraitTrouve(): boolean {
  return disponible
}

/**
 * Le corps du joueur : son portrait s'il existe, sinon la silhouette d'origine.
 *
 * L'image porte la MÊME classe `silhouette` que le SVG, et ce n'est pas un
 * raccourci : toute la mise en scène est accrochée à cette classe — la
 * respiration, le liseré de lumière, l'extinction en noir à la mort, la taille
 * calée sur `--corps`. Lui donner une classe à elle aurait voulu dire porter
 * chacune de ces règles en double, et en oublier une au premier changement.
 */
export function silhouetteJoueur(): string {
  if (!disponible) return ''
  return `<img class="silhouette portrait" src="${CHEMIN}" alt="" aria-hidden="true">`
}

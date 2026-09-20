/**
 * Le portrait du joueur : de VRAIES IMAGES, si elles sont là.
 *
 * C'est la première entorse à la borne « pas d'assets, pas de fichiers image »
 * du projet, et c'est Keko qui l'a levée — comme il l'avait fait pour les
 * dessins de la main : *ce qu'il doit juger doit être présentable*. Elle reste
 * une entorse, donc elle est contenue à un seul fichier et à un seul corps.
 *
 * **Deux poses**, parce que le joueur est montré dans deux situations qui n'ont
 * rien à voir : au repos sur la scène et quand il encaisse, l'épée basse ; et
 * lame tendue quand c'est lui qui frappe, dans le gros plan.
 *
 * **Chaque pose est OPTIONNELLE, séparément**, et c'est ce qui rend l'essai
 * sans risque : sans `joueur.png` le jeu rend la silhouette SVG comme avant,
 * et sans `attaque.png` il frappe avec la pose de repos. *Le repli n'est pas
 * une précaution de style* — sans lui, un essai abandonné laisserait une image
 * cassée sur la scène ET dans le gros plan.
 *
 * Les chemins passent par `BASE_URL` : en build, le jeu est servi sous
 * `/keko-test/`, et un `/joueur.png` absolu pointerait à la racine du domaine.
 */

/** Ce que le joueur est en train de faire, du point de vue du dessin. */
export type Pose = 'repos' | 'attaque'

/**
 * **La date du build sert de numéro de version aux images**, et ce n'est pas
 * une précaution : sans elle, remplacer un PNG ne change rien à l'écran.
 *
 * Les fichiers de `public/` sont copiés tels quels, sans empreinte de contenu
 * dans leur nom — contrairement à tout le reste du build, qui sort en
 * `index-A1b2C3.js`. Leur URL ne bouge donc jamais, et le navigateur ressert
 * celle qu'il a en cache. Keko : « j'ai changé l'image d'attaque mais elle n'a
 * pas changé quand je lance » — alors que le serveur envoyait bien la nouvelle,
 * vérifié à l'octet près.
 *
 * *C'est un piège qui se retend à chaque image modifiée*, et qui ne se voit pas
 * depuis la machine de dev, où le serveur de développement invalide tout seul.
 */
const VERSION = encodeURIComponent(__BUILD_TIME__)

/** Là où les fichiers sont attendus. Un seul endroit les connaît. */
const FICHIERS: Record<Pose, string> = {
  repos: `${import.meta.env.BASE_URL}joueur.png?v=${VERSION}`,
  attaque: `${import.meta.env.BASE_URL}attaque.png?v=${VERSION}`,
}

const trouvees: Record<Pose, boolean> = { repos: false, attaque: false }

/**
 * Cherche les images, une fois, et les garde en cache du navigateur au passage.
 *
 * **Le préchargement compte ici**, il n'est pas décoratif : la pose d'attaque ne
 * s'affiche qu'au premier coup porté, et elle pèse près d'un mégaoctet. Chargée
 * à ce moment-là, elle arriverait *après* le gros plan qu'elle devait remplir.
 *
 * Résout toujours — une image absente est un état normal, pas une erreur.
 */
export function chercherPortraits(): Promise<boolean> {
  const une = (pose: Pose) =>
    new Promise<void>((resoudre) => {
      const image = new Image()
      image.onload = () => {
        trouvees[pose] = true
        resoudre()
      }
      image.onerror = () => resoudre()
      image.src = FICHIERS[pose]
    })

  return Promise.all([une('repos'), une('attaque')]).then(() => trouvees.repos)
}

/** Vrai si le joueur a un portrait, donc si on abandonne la silhouette SVG. */
export function portraitTrouve(): boolean {
  return trouvees.repos
}

/**
 * Le corps du joueur dans la pose demandée.
 *
 * **La pose d'attaque retombe sur celle de repos si elle manque**, plutôt que
 * de ne rien rendre : un joueur qui disparaît au moment où il frappe serait un
 * défaut bien pire que de frapper l'épée basse.
 *
 * L'image porte la MÊME classe `silhouette` que le SVG, et ce n'est pas un
 * raccourci : toute la mise en scène est accrochée à cette classe — la
 * respiration, le liseré de lumière, l'extinction en noir à la mort, la taille
 * calée sur `--corps`. Lui donner une classe à elle aurait voulu dire porter
 * chacune de ces règles en double, et en oublier une au premier changement.
 */
export function silhouetteJoueur(pose: Pose = 'repos'): string {
  if (!trouvees.repos) return ''
  const choisie: Pose = pose === 'attaque' && trouvees.attaque ? 'attaque' : 'repos'
  return `<img class="silhouette portrait" src="${FICHIERS[choisie]}" alt="" aria-hidden="true">`
}

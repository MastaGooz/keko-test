/**
 * LES ILLUSTRATIONS DES CARTES : un SVG par modèle, dessiné à la main, dans
 * `art/`. Chaque carte en porte une en plein format, sous le cadre et le
 * texte.
 *
 * Elles passent par Vite (`import.meta.glob`), donc chaque fichier sort du
 * build avec une empreinte dans son nom : remplacer un dessin change son URL,
 * et le navigateur ne peut pas resservir l'ancien. C'est le piège des portraits
 * de `public/`, évité à la source.
 *
 * Le nom du fichier est le nom du modèle, en minuscules, sans accent, les
 * espaces en tirets (« Médaillon » → `medaillon.svg`, « Boire une gorgée » →
 * `boire-une-gorgee.svg`). Un modèle sans dessin reçoit `defaut.svg`
 * — un sceau, pas un trou : si on le voit en jeu, c'est qu'il manque un
 * fichier, et ça se voit.
 */
const FICHIERS = import.meta.glob<string>('./art/*.svg', {
  eager: true,
  query: '?url',
  import: 'default',
})

const ART: Record<string, string> = {}
for (const [chemin, url] of Object.entries(FICHIERS)) {
  const nom = chemin.replace(/^.*\//, '').replace(/\.svg$/, '')
  ART[nom] = url
}

/** Le nom d'un modèle tel qu'il nomme son fichier. */
function cle(nom: string): string {
  return nom
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, '-')
}

/** L'URL de l'illustration d'un modèle, ou celle du repli. */
export function art(nom: string): string {
  return ART[cle(nom)] ?? ART['defaut'] ?? ''
}

/**
 * LES IMAGES DE KEKO, qui remplacent un dessin.
 *
 * Elles vivent dans `public/` et non dans `art/`, parce qu'il les y dépose
 * lui-même sans passer par le code. Le nom est celui du FICHIER, à la casse
 * près : `public/` est copié tel quel, et GitHub Pages sert depuis Linux — un
 * `glaive.png` demandé pour un `Glaive.png` posé serait un 404 ici et un
 * succès sur la machine de dev.
 *
 * **L'URL PORTE LA DATE DU BUILD**, et ce n'est pas une précaution : les
 * fichiers de `public/` sortent du build **sans empreinte dans leur nom**,
 * contrairement à tout le reste. Leur URL ne bouge donc jamais, et le
 * navigateur ressert celle qu'il a en cache — remplacer l'image ne changerait
 * rien à l'écran. Le piège se retend à chaque image modifiée, et il est
 * invisible depuis la machine de dev, où le serveur invalide tout seul.
 */
const IMAGES: Record<string, string> = {
  glaive: 'Glaive.png',
}

/**
 * L'image de Keko pour ce modèle, s'il y en a une — sinon `none`.
 *
 * `none` et non la chaîne vide : la valeur part dans un raccourci
 * `background`, où une couche vide rendrait toute la règle invalide et
 * effacerait le dessin qu'elle devait doubler.
 *
 * **C'est le CSS qui porte le repli**, pas une vérification : la carte empile
 * l'image AU-DESSUS du SVG, et une couche de fond qui échoue est simplement
 * ignorée. Le dessin reste dessous. *Un essai abandonné ne laisse donc pas
 * d'image cassée* — il redonne le dessin d'origine, sans une ligne de
 * JavaScript.
 */
export function imageDeKeko(nom: string): string {
  const url = urlImageDeKeko(nom)
  return url === null ? 'none' : `url(${url})`
}

/**
 * LE FOND COMMUN À TOUTES LES CARTES, fourni par Keko.
 *
 * Il se peint sous l'illustration : *le décor appartient à la carte, le sujet
 * appartient au modèle.* Une image de modèle n'a donc plus à porter son propre
 * ciel — mais tant qu'elle en porte un, elle le recouvre, et le fond ne se
 * voit pas.
 *
 * **Même piège de cache que les autres images de `public/`** : le fichier est
 * copié tel quel, sans empreinte de contenu dans son nom, donc son URL doit
 * porter la date du build — sans quoi le remplacer ne changerait rien à
 * l'écran. Et le chemin passe par `BASE_URL`, sinon il pointerait à la racine
 * du domaine au lieu de `/keko-test/`.
 */
export function urlDuFond(): string {
  return `${import.meta.env.BASE_URL}Background.png?v=${encodeURIComponent(__BUILD_TIME__)}`
}

/**
 * LE SYMBOLE DU COÛT, fourni par Keko — il remplace le cercle dessiné.
 *
 * Il sert aux DEUX endroits, et c'est la règle : le même symbole sur la carte
 * et dans le coin du joueur, « pour que le joueur comprenne bien ». Même piège
 * de cache que les autres fichiers de `public/` : l'URL porte la date du
 * build, sinon le remplacer ne changerait rien à l'écran.
 */
export function urlDuCout(): string {
  return `${import.meta.env.BASE_URL}Cost.png?v=${encodeURIComponent(__BUILD_TIME__)}`
}

/**
 * LES DÉCORS DE COMBAT — fournis par Keko, en 16:9.
 *
 * Il est posé en `cover`, donc **la largeur est toujours entière et c'est la
 * hauteur qui se rogne** : rien sur un écran 16:9, jusqu'à 23 % sur le
 * téléphone le plus large. Ce qui doit rester visible tient donc entre 12 % et
 * 88 % de la hauteur de l'image.
 *
 * Même piège de cache que les autres fichiers de `public/`.
 */
export type Decor = 'temple' | 'camp'

const DECORS: Record<Decor, string> = {
  temple: 'Temple.webp',
  camp: 'Camp.webp',
}

export function urlDuDecor(decor: Decor): string {
  return `${import.meta.env.BASE_URL}${DECORS[decor]}?v=${encodeURIComponent(__BUILD_TIME__)}`
}

/**
 * La même URL, brute — ce qu'il faut pour charger l'image autrement que par le
 * CSS : le moteur 3D la peint dans un canvas pour en faire une texture.
 */
export function urlImageDeKeko(nom: string): string | null {
  const fichier = IMAGES[cle(nom)]
  if (fichier === undefined) return null
  return `${import.meta.env.BASE_URL}${fichier}?v=${encodeURIComponent(__BUILD_TIME__)}`
}

/**
 * LES CRÉATURES DE KEKO, par nom d'ennemi.
 *
 * Même règle que les images de cartes — un fichier dans `public/`, une ligne
 * ici, la casse exacte — mais une table à part, parce qu'une créature n'est pas
 * un modèle de carte : les deux peuvent porter le même nom sans être la même
 * chose.
 *
 * **Le repli reste le SVG dessiné** (`ui/illustrations.ts`), et il est
 * explicite ici : en 3D l'image devient une texture, et *un plan sans texture
 * n'est pas ignoré comme une couche de fond CSS* — il resterait un rectangle
 * sombre au milieu de la scène.
 */
const IMAGES_ENNEMIS: Record<string, string> = {
  cultiste: 'Cultiste_dague.png',
  officiant: 'Cultiste_encens.png',
  gobelin: 'Gobelin_dague.png',
  frondeur: 'Gobelin_fronde.png',
  poudrier: 'Gobelin_kamikaz.png',
}

/** L'image de Keko pour cette créature, s'il y en a une. */
export function urlDeLEnnemi(nom: string): string | null {
  const fichier = IMAGES_ENNEMIS[cle(nom)]
  if (fichier === undefined) return null
  return `${import.meta.env.BASE_URL}${fichier}?v=${encodeURIComponent(__BUILD_TIME__)}`
}

/** Le dos de carte, pour les tas. */
export function dosDeCarte(): string {
  return ART['dos'] ?? ''
}

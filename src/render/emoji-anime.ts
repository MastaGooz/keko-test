/**
 * LES EMOJI ANIMÉS DE GOOGLE, DÉCODÉS IMAGE PAR IMAGE.
 *
 * Keko : « pourquoi les emoji animés ne sont pas animés sur les cartes ? »
 * *Parce qu'une carte est une TEXTURE PEINTE AU CANVAS*, et qu'un canvas ne
 * joue rien : `drawImage` d'un WebP animé n'en prend qu'une seule image.
 *
 * **Les trois formats du CDN, mesurés** :
 *
 * | | poids moyen | ce que ça demande |
 * |---|---|---|
 * | `lottie.json` | **11 Ko** | un lecteur Lottie, donc **une dépendance** |
 * | `512.webp` | 411 Ko | `ImageDecoder` — aucune dépendance |
 * | `512.gif` | 642 Ko | pire sur les deux tableaux |
 *
 * *Le Lottie est trente-sept fois plus léger et c'est le WebP qui gagne*, parce
 * que le projet refuse les dépendances et qu'écrire un lecteur Lottie serait un
 * moteur de rendu entier. **Le prix est le poids, et il est connu.**
 *
 * Mesuré sur 😂 : 609 Ko, **59 images**, 512 x 512, 30 ms par image — et
 * **1,9 ms pour en décoder une.**
 */

/** Ce qu'il faut pour jouer une animation : ses images et leur durée. */
export interface Animation {
  images: readonly ImageBitmap[]
  /** La durée totale, en millisecondes. */
  duree: number
}

const EN_COURS = new Map<string, Promise<Animation | null>>()

/**
 * LA TAILLE DE DÉCODAGE — bien plus petite que la source.
 *
 * *Une carte de paquet fait 180 px de large à l'écran et sa fenêtre d'art moins
 * encore* ; décoder en 512 coûterait quatre fois la mémoire pour une finesse
 * que personne ne voit. **Chaque image devient un `ImageBitmap`**, donc elle
 * vit sur le GPU : 59 images de 192 pèsent 8,7 Mo, contre 62 Mo en 512.
 */
const COTE = 192

/**
 * UNE IMAGE SUR DEUX, ET C'EST UN ARBITRAGE DE MÉMOIRE.
 *
 * Les animations Noto tournent à trente images par seconde ; *à quinze, un
 * emoji reste parfaitement fluide* — il n'a ni mouvement rapide ni détail fin —
 * et le catalogue en mémoire tombe de moitié. **La durée totale ne change pas**,
 * donc l'animation garde son rythme.
 */
const PAS = 2

/**
 * Charge et décode une animation. `null` si le navigateur n'a pas
 * `ImageDecoder`, ou si le fichier n'existe pas.
 *
 * **Le cache ne retient que les succès** — une promesse rejetée gardée
 * condamnerait l'emoji pour toute la session, la leçon des textures de cartes.
 */
export function animationDeLEmoji(url: string): Promise<Animation | null> {
  const deja = EN_COURS.get(url)
  if (deja !== undefined) return deja
  const p = decoder(url)
  EN_COURS.set(url, p)
  void p.then((a) => {
    if (a === null) EN_COURS.delete(url)
  })
  p.catch(() => EN_COURS.delete(url))
  return p
}

async function decoder(url: string): Promise<Animation | null> {
  // `ImageDecoder` est dans Chrome, Edge et Safari 17 ; **ailleurs la carte
  // reste statique**, et c'est le bon repli : *une animation ne doit jamais
  // pouvoir empêcher une carte de s'afficher.*
  const Decodeur = (globalThis as { ImageDecoder?: typeof ImageDecoder }).ImageDecoder
  if (Decodeur === undefined) return null
  try {
    const reponse = await fetch(url)
    if (!reponse.ok) return null
    const d = new Decodeur({ data: await reponse.arrayBuffer(), type: 'image/webp' })
    await d.tracks.ready
    const piste = d.tracks.selectedTrack
    if (piste === undefined || piste === null || !piste.animated || piste.frameCount < 2) {
      d.close()
      return null
    }
    const images: ImageBitmap[] = []
    let duree = 0
    for (let i = 0; i < piste.frameCount; i++) {
      const { image } = await d.decode({ frameIndex: i })
      // LA DURÉE SE COMPTE SUR TOUTES LES IMAGES, même celles qu'on saute :
      // *l'animation garde son rythme*, on la montre seulement moins finement.
      duree += (image.duration ?? 30_000) / 1000
      if (i % PAS === 0) images.push(await createImageBitmap(image, { resizeWidth: COTE, resizeHeight: COTE }))
      // **ON FERME CHAQUE IMAGE**, sinon le décodeur garde tout en mémoire :
      // une `VideoFrame` n'est pas ramassée par le ramasse-miettes.
      image.close()
    }
    d.close()
    return images.length < 2 ? null : { images, duree }
  } catch {
    return null
  }
}

/**
 * L'URL de l'animation d'un emoji sur le CDN de Google.
 *
 * ***Le format d'un identifiant n'est pas celui d'une URL*** : nos
 * identifiants séparent les points de code par des tirets, le CDN par des
 * underscores. C'est la leçon déjà payée dans le pipeline, où tout emoji à
 * plusieurs points de code était déclaré non animé.
 */
export function urlAnimationEmoji(id: string): string {
  return `https://fonts.gstatic.com/s/e/notoemoji/latest/${id.replace(/-/g, '_')}/512.webp`
}

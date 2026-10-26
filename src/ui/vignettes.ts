/**
 * LES VIGNETTES GARDÉES SUR L'APPAREIL. Keko : « oui garde les vignettes en
 * cache sur l'appareil » — une vignette coûte une peinture entière (le cerne,
 * le brillant), et la grille les refaisait toutes à chaque visite. On garde
 * l'image finie dans IndexedDB, **par build** : *une peinture gardée ne reste
 * pas vraie quand ce qui la peint a bougé*, donc la clé porte la date du build
 * et les paramètres de l'adresse (les bancs repeignent), et ce qui vient d'un
 * autre build est effacé à l'ouverture.
 *
 * Tout échec (navigation privée, quota, Safari capricieux) rend `null` : on
 * repeint, comme avant. *Aucun cache ne peut casser le jeu.*
 */
const BASE = 'keko-vignettes'
const MAGASIN = 'vignettes'

/** La part de l'adresse qui peut changer la peinture : tout, sauf `v` (le hash) et `page`. */
function signature(): string {
  const p = new URLSearchParams(location.search)
  p.delete('v')
  p.delete('page')
  p.sort()
  return `${__BUILD_TIME__}?${p.toString()}`
}

let ouverte: Promise<IDBDatabase | null> | null = null
function base(): Promise<IDBDatabase | null> {
  ouverte ??= new Promise<IDBDatabase | null>((resoudre) => {
    try {
      const req = indexedDB.open(BASE, 1)
      req.onupgradeneeded = () => req.result.createObjectStore(MAGASIN)
      req.onerror = () => resoudre(null)
      req.onblocked = () => resoudre(null)
      req.onsuccess = () => {
        const db = req.result
        resoudre(db)
        purger(db)
      }
    } catch {
      resoudre(null)
    }
  })
  return ouverte
}

/** Efface ce qu'ont peint les autres builds (ou les autres bancs). */
function purger(db: IDBDatabase): void {
  try {
    const prefixe = `${signature()}#`
    const req = db.transaction(MAGASIN, 'readwrite').objectStore(MAGASIN).openCursor()
    req.onsuccess = () => {
      const c = req.result
      if (c === null) return
      if (!String(c.key).startsWith(prefixe)) c.delete()
      c.continue()
    }
  } catch {
    // rien : on repeindra
  }
}

export async function vignetteGardee(cle: string): Promise<HTMLCanvasElement | null> {
  const db = await base()
  if (db === null) return null
  try {
    const blob = await new Promise<Blob | undefined>((resoudre, rejeter) => {
      const req = db.transaction(MAGASIN, 'readonly').objectStore(MAGASIN).get(`${signature()}#${cle}`)
      req.onsuccess = () => resoudre(req.result instanceof Blob ? req.result : undefined)
      req.onerror = () => rejeter(req.error)
    })
    if (blob === undefined) return null
    const image = await createImageBitmap(blob)
    const toile = document.createElement('canvas')
    toile.width = image.width
    toile.height = image.height
    toile.getContext('2d')?.drawImage(image, 0, 0)
    image.close()
    return toile
  } catch {
    return null
  }
}

export function garderLaVignette(cle: string, toile: HTMLCanvasElement): void {
  // En WebP presque sans perte : un PNG de vignette pèse six fois plus. Safari
  // n'encode pas le WebP et rend un PNG, ça marche aussi.
  toile.toBlob(
    (blob) => {
      if (blob === null) return
      void base().then((db) => {
        if (db === null) return
        try {
          db.transaction(MAGASIN, 'readwrite').objectStore(MAGASIN).put(blob, `${signature()}#${cle}`)
        } catch {
          // quota, navigation privée : on repeindra
        }
      })
    },
    'image/webp',
    0.95,
  )
}

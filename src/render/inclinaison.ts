/**
 * L'INCLINAISON DU TÉLÉPHONE, lue au capteur et rapportée à celle du départ.
 *
 * Keko : **« tu crois que le paquet et les cartes pourraient bouger quand on
 * bouge le téléphone ? »**, puis : « sachet d'abord, prends les décisions et
 * fais au mieux, l'idée c'est que l'orientation de base doit correspondre à
 * l'orientation de base du tel au moment où le paquet apparaît ».
 *
 * **LA RÉFÉRENCE EST LA PREMIÈRE LECTURE**, pas l'horizontale : personne ne
 * tient un téléphone à plat, et *un objet qui se pencherait dès qu'on l'ouvre
 * dirait que le téléphone est mal tenu.* On écoute dès que l'objet qui nous
 * lit se monte, et la première valeur qui arrive devient le zéro — donc un
 * sachet neuf se recalibre, puisqu'il se remonte à chaque paquet.
 *
 * **SUR IPHONE, LE CAPTEUR SE DEMANDE, ET DEPUIS UN GESTE** : depuis iOS 13,
 * `DeviceOrientationEvent.requestPermission()` n'existe que là et ne répond
 * que depuis une activation. On attend donc le premier relâchement de doigt —
 * *c'est le relâchement qui active une page sur tactile*, la règle déjà payée
 * par le son — et la référence se prend à la première lecture qui suit. Sur
 * Android et sur un PC sans capteur, il n'y a rien à demander : ça écoute,
 * ou ça ne lit jamais rien.
 *
 * Ce qui sort est en RADIANS, lissé, avec une zone morte : *un téléphone tenu
 * immobile tremble d'un degré*, et un sachet qui tremblerait avec dirait un
 * défaut, pas une matière.
 */

/** Ce que lit l'appelant : l'écart à la tenue de départ, en radians, ou rien. */
export interface Inclinaison {
  /** `x` : le haut du téléphone qui s'éloigne (négatif) ou se rapproche ; `y` : le côté droit qui descend (positif). */
  lire(): { x: number; y: number } | null
  /**
   * REPREND LE ZÉRO SUR LA TENUE DU MOMENT. Keko : « l'inclinaison d'une carte
   * doit prendre pour position de base l'orientation du téléphone au moment
   * où elle apparaît, pas au moment où le booster ou les cartes précédentes
   * sont apparues ». *Chaque objet qui apparaît se cale sur la main qui le
   * tient à cet instant.* Sans lecture encore reçue, il n'y a rien à
   * reprendre : la première lecture fera le zéro.
   */
  recaler(): void
  arreter(): void
}

/** Sous un degré d'écart, on ne bouge pas : c'est le tremblement de la main. */
const ZONE_MORTE = (1 * Math.PI) / 180
/** Le lissage, par lecture : à 60 Hz, 0,18 fait suivre un geste en un dixième de seconde sans trembler. */
const LISSAGE = 0.18

type AvecPermission = typeof DeviceOrientationEvent & {
  requestPermission?: () => Promise<'granted' | 'denied'>
}

export function suivreLInclinaison(): Inclinaison {
  if (typeof window === 'undefined' || !('DeviceOrientationEvent' in window)) {
    return { lire: () => null, recaler: () => undefined, arreter: () => undefined }
  }
  let ref: { beta: number; gamma: number } | null = null
  let lisse: { x: number; y: number } | null = null
  /** La dernière lecture BRUTE, pour pouvoir y reprendre le zéro. */
  let brut: { beta: number; gamma: number } | null = null
  const ctrl = new AbortController()

  const surLecture = (e: DeviceOrientationEvent): void => {
    if (e.beta === null || e.gamma === null) return
    brut = { beta: e.beta, gamma: e.gamma }
    if (ref === null) {
      ref = { beta: e.beta, gamma: e.gamma }
      lisse = { x: 0, y: 0 }
      return
    }
    // L'ÉCART À LA TENUE DE DÉPART, en radians. `beta` tourne autour de l'axe
    // horizontal du téléphone (le haut qui s'éloigne ou se rapproche), `gamma`
    // autour de son axe vertical (un côté qui descend). On borne `gamma` loin
    // de ses ±90°, où le capteur bascule d'un coup quand le téléphone est
    // presque debout.
    const dx = ((e.beta - ref.beta) * Math.PI) / 180
    const dy = ((Math.max(-80, Math.min(80, e.gamma)) - ref.gamma) * Math.PI) / 180
    const mort = (v: number): number =>
      Math.abs(v) < ZONE_MORTE ? 0 : v - Math.sign(v) * ZONE_MORTE
    const cible = { x: mort(dx), y: mort(dy) }
    const l = lisse ?? { x: 0, y: 0 }
    lisse = { x: l.x + (cible.x - l.x) * LISSAGE, y: l.y + (cible.y - l.y) * LISSAGE }
  }

  const ecouter = (): void =>
    window.addEventListener('deviceorientation', surLecture, { signal: ctrl.signal })

  const demander = (DeviceOrientationEvent as AvecPermission).requestPermission
  if (typeof demander === 'function') {
    // IPHONE : on demande au premier relâchement, et on écoute si c'est oui.
    // *Un refus est silencieux* — le sachet garde son balancement, et c'est
    // tout ce qu'il perd.
    const auGeste = (): void => {
      demander
        .call(DeviceOrientationEvent)
        .then((r) => {
          if (r === 'granted' && !ctrl.signal.aborted) ecouter()
        })
        .catch(() => undefined)
    }
    window.addEventListener('pointerup', auGeste, { once: true, signal: ctrl.signal })
  } else {
    ecouter()
  }

  return {
    lire: () => lisse,
    recaler: () => {
      if (brut === null) return
      ref = { beta: brut.beta, gamma: brut.gamma }
      lisse = { x: 0, y: 0 }
    },
    arreter: () => ctrl.abort(),
  }
}

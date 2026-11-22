/**
 * LE TRANSPORT DU JEU À DISTANCE (Keko, 22/11 — voir `logic/vaisseau/reseau.ts`) : PeerJS (MIT, 1.5.4, la seconde
 * dépendance de code — Keko l'a choisie, avec le serveur public de PeerJS pour se trouver ; sans la bibliothèque, ce
 * serveur ne relayait pas nos messages, mesuré). L'HÔTE ouvre un salon : un code de quatre lettres, l'identifiant
 * `novadrifter-<code>` sur le serveur ; LES INVITÉS le rejoignent par ce code — TROIS AU PLUS (Keko, 22/11 : « de 1 à 3
 * joueurs supplémentaires »). Deux canaux par invité, ouverts par lui : `ctrl`, fiable et ordonné (en JSON : le salon,
 * les pseudos, prêt, les configurations, les talents) ; `etat`, sans ordre (des octets : les états du monde
 * compressés, et le manche de l'invité). L'hôte reconnaît chaque invité à son identifiant PeerJS.
 */
import Peer, { type DataConnection } from 'peerjs'

const PREFIXE = 'novadrifter-'
/** Les lettres d'un code : sans I, L, O, 0, 1, qui se confondent. */
const LETTRES = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
export const codeAuHasard = (): string => Array.from({ length: 4 }, () => LETTRES[Math.floor(Math.random() * LETTRES.length)]).join('')
/** Les invités d'un salon, au plus. */
export const INVITES_MAX = 3
/**
 * LE SIGNE DE VIE (mesuré : un onglet fermé net laisse sa connexion ouverte de longues secondes, et son vaisseau restait
 * figé dans la partie) : chacun en envoie un toutes les `BATTEMENT` millisecondes sur le canal fiable ; sans nouvelles
 * de l'autre depuis `SILENCE`, il est parti.
 */
const BATTEMENT = 2000
const SILENCE = 8000
const SIGNE = { '@vie': 1 }
const estUnSigne = (d: unknown): boolean => typeof d === 'object' && d !== null && '@vie' in d

export type EtatDeLaLiaison = 'ouverture' | 'attente' | 'connecte' | 'perdu' | 'introuvable' | 'erreur'
export type Rappels = {
  /** Un message du canal fiable (déjà relu du JSON), et de qui (chez l'invité : 'hote'). */
  message: (m: unknown, de: string) => void
  /** Un message du canal rapide (un texte ou des octets), et de qui. */
  vite: (d: string | ArrayBuffer, de: string) => void
  etat: (e: EtatDeLaLiaison) => void
  /** (l'hôte) Un invité est là, ses deux canaux ouverts ; un invité est parti. */
  arrivee?: (de: string) => void
  depart?: (de: string) => void
}
export type Liaison = {
  /** Le code du salon (l'hôte peut en changer s'il était pris). */
  code: () => string
  etat: () => EtatDeLaLiaison
  /** Au canal fiable : à cet invité, ou à tous (l'invité : à l'hôte). */
  envoyer: (m: unknown, a?: string) => void
  envoyerVite: (d: string | ArrayBuffer | Uint8Array, a?: string) => void
  fermer: () => void
  /** OÙ EN EST LA CONNEXION, en clair (Keko, 22/11 : « ça bloque ici ») : le serveur, la connexion directe, les chemins trouvés. */
  detail: () => string
}

/**
 * LE SUIVI D'UNE CONNEXION DIRECTE : l'état de sa négociation (ICE) et les sortes de chemins que cet appareil a trouvés
 * — `host` le réseau local, `srflx` son adresse publique (par le STUN), `relay` un relais (TURN).
 */
type Suivi = { ice: string; chemins: Set<string> }
const suiviNeuf = (): Suivi => ({ ice: '-', chemins: new Set() })
function suivre(c: DataConnection, s: Suivi): void {
  const pc = c.peerConnection as RTCPeerConnection | undefined
  if (pc === undefined || pc === null) return
  s.ice = pc.iceConnectionState
  pc.addEventListener('iceconnectionstatechange', () => (s.ice = pc.iceConnectionState))
  pc.addEventListener('icecandidate', (e) => {
    if (e.candidate !== null) s.chemins.add(e.candidate.type ?? '?')
  })
}
const ICE: Record<string, string> = { '-': 'pas commencée', new: 'prête', checking: 'en recherche', connected: 'établie', completed: 'établie', disconnected: 'coupée', failed: 'impossible', closed: 'fermée' }
/** (deux lignes : le serveur, puis la connexion directe et ses chemins) */
const dire = (serveur: string, s: Suivi): string => `Serveur ${serveur}\nLiaison ${ICE[s.ice] ?? s.ice} (${[...s.chemins].join(', ') || 'aucun chemin'})`

/** L'HÔTE : le salon s'ouvre sous ce code, ou un tiré au hasard (un autre s'il est pris), et attend ses invités. */
export function ouvrirLeSalon(r: Rappels, voulu = ''): Liaison {
  let code = /^[A-Z0-9]{3,12}$/.test(voulu) ? voulu : codeAuHasard()
  let etat: EtatDeLaLiaison = 'ouverture'
  let peer: Peer | null = null
  /** Chaque invité : ses deux canaux, le suivi de sa connexion, s'il a été annoncé. */
  const invites = new Map<string, { ctrl: DataConnection | null; vite: DataConnection | null; suivi: Suivi; annonce: boolean; vu: number }>()
  let dernier = suiviNeuf()
  const poser = (e: EtatDeLaLiaison): void => {
    if (etat === e) return
    etat = e
    r.etat(e)
  }
  const annonces = (): number => [...invites.values()].filter((i) => i.annonce).length
  const verifier = (id: string): void => {
    const i = invites.get(id)
    if (i === undefined || i.annonce || i.ctrl?.open !== true || i.vite?.open !== true) return
    i.annonce = true
    poser('connecte')
    r.arrivee?.(id)
  }
  const perdre = (id: string): void => {
    const i = invites.get(id)
    if (i === undefined) return
    invites.delete(id)
    i.ctrl?.close()
    i.vite?.close()
    if (i.annonce) r.depart?.(id)
    if (annonces() === 0 && etat === 'connecte') poser('attente')
  }
  // (LE TÉLÉPHONE REVENU AU PREMIER PLAN — on est allé envoyer le lien dans une autre appli : la page dormait, le serveur
  // l'a peut-être oubliée ; elle s'y reconnecte, sous le même code)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible' || peer === null) return
    if (peer.destroyed) lancer()
    else if (peer.disconnected) peer.reconnect()
  })
  // (le signe de vie : à chacun ; et qui se tait depuis trop longtemps est parti)
  setInterval(() => {
    const maintenant = performance.now()
    for (const [id, i] of invites) {
      if (!i.annonce) continue
      if (maintenant - i.vu > SILENCE) perdre(id)
      else if (i.ctrl?.open === true) void i.ctrl.send(SIGNE)
    }
  }, BATTEMENT)
  const lancer = (): void => {
    peer = new Peer(PREFIXE + code)
    peer.on('open', () => poser(annonces() > 0 ? 'connecte' : 'attente'))
    peer.on('error', (e) => {
      // (le code était pris : un autre)
      if (e.type === 'unavailable-id') {
        peer?.destroy()
        code = codeAuHasard()
        lancer()
        return
      }
      if (e.type === 'network' || e.type === 'server-error' || e.type === 'socket-error' || e.type === 'socket-closed') poser('erreur')
    })
    peer.on('disconnected', () => {
      // (le serveur de mise en relation perdu : on s'y reconnecte — une partie en cours n'en a pas besoin)
      if (peer !== null && !peer.destroyed) peer.reconnect()
    })
    peer.on('connection', (c) => {
      const id = c.peer
      // (TROIS INVITÉS AU PLUS : le quatrième est refusé)
      if (!invites.has(id) && invites.size >= INVITES_MAX) {
        c.on('open', () => c.close())
        return
      }
      const i = invites.get(id) ?? { ctrl: null, vite: null, suivi: suiviNeuf(), annonce: false, vu: performance.now() }
      invites.set(id, i)
      if (c.label === 'ctrl') i.ctrl = c
      else i.vite = c
      dernier = i.suivi
      suivre(c, i.suivi)
      c.on('open', () => verifier(id))
      c.on('data', (d) => {
        i.vu = performance.now()
        if (estUnSigne(d)) return
        if (c.label === 'ctrl') r.message(d, id)
        else r.vite(d as string | ArrayBuffer, id)
      })
      c.on('close', () => perdre(id))
      c.on('error', () => perdre(id))
    })
  }
  lancer()
  const a = (dest: string | undefined): { ctrl: DataConnection | null; vite: DataConnection | null }[] => (dest === undefined ? [...invites.values()].filter((i) => i.annonce) : invites.has(dest) ? [invites.get(dest)!] : [])
  return {
    code: () => code,
    etat: () => etat,
    envoyer: (m, dest) => {
      for (const i of a(dest)) if (i.ctrl?.open === true) void i.ctrl.send(m)
    },
    envoyerVite: (d, dest) => {
      for (const i of a(dest)) if (i.vite?.open === true) void i.vite.send(d)
    },
    fermer: () => {
      peer?.destroy()
      peer = null
    },
    detail: () => dire(peer === null ? 'fermé' : peer.open ? 'joint' : peer.disconnected ? 'perdu' : 'en cours', dernier),
  }
}

/** L'INVITÉ : il rejoint le salon de ce code et en ouvre les deux canaux. */
export function rejoindreLeSalon(code: string, r: Rappels): Liaison {
  let etat: EtatDeLaLiaison = 'ouverture'
  const poser = (e: EtatDeLaLiaison): void => {
    if (etat === e) return
    etat = e
    r.etat(e)
  }
  const peer = new Peer()
  let ctrl: DataConnection | null = null
  let vite: DataConnection | null = null
  let suivi = suiviNeuf()
  let essais = 0
  let vu = performance.now()
  // (le signe de vie, à l'hôte ; et l'hôte qui se tait depuis trop longtemps est parti)
  setInterval(() => {
    if (etat !== 'connecte') return
    if (performance.now() - vu > SILENCE) {
      poser('perdu')
      ctrl?.close()
      vite?.close()
    } else if (ctrl?.open === true) void ctrl.send(SIGNE)
  }, BATTEMENT)
  // (UN NOUVEL ESSAI au bout de quinze secondes sans connexion, trois en tout — l'hôte revenait peut-être au premier plan)
  const essayer = (): void => {
    essais += 1
    ctrl?.close()
    vite?.close()
    suivi = suiviNeuf()
    const c1 = peer.connect(PREFIXE + code, { label: 'ctrl', reliable: true, serialization: 'json' })
    const c2 = peer.connect(PREFIXE + code, { label: 'etat', reliable: false, serialization: 'raw' })
    ctrl = c1
    vite = c2
    const verifier = (): void => {
      if (ctrl !== c1 || !c1.open || !c2.open) return
      vu = performance.now()
      poser('connecte')
    }
    for (const c of [c1, c2]) {
      suivre(c, suivi)
      c.on('open', verifier)
      c.on('close', () => ctrl === c1 && etat === 'connecte' && poser('perdu'))
      c.on('error', () => ctrl === c1 && etat === 'connecte' && poser('perdu'))
    }
    c1.on('data', (d) => {
      vu = performance.now()
      if (!estUnSigne(d)) r.message(d, 'hote')
    })
    c2.on('data', (d) => {
      vu = performance.now()
      r.vite(d as string | ArrayBuffer, 'hote')
    })
    setTimeout(() => {
      if (ctrl !== c1 || etat === 'connecte' || etat === 'introuvable') return
      if (essais < 3) essayer()
      else poser('erreur')
    }, 15000)
  }
  peer.on('open', essayer)
  peer.on('error', (e) => poser(e.type === 'peer-unavailable' ? 'introuvable' : 'erreur'))
  return {
    code: () => code,
    etat: () => etat,
    envoyer: (m) => {
      if (ctrl?.open === true) void ctrl.send(m)
    },
    envoyerVite: (d) => {
      if (vite?.open === true) void vite.send(d)
    },
    fermer: () => peer.destroy(),
    detail: () => `Essai ${Math.max(1, essais)}/3, ` + dire(peer.open ? 'joint' : peer.disconnected ? 'perdu' : 'en cours', suivi),
  }
}

/** Compressé (gzip), si le navigateur sait le faire ; sinon le texte tel quel. */
export async function compresser(texte: string): Promise<ArrayBuffer | string> {
  if (typeof CompressionStream === 'undefined') return texte
  const flux = new Blob([texte]).stream().pipeThrough(new CompressionStream('gzip'))
  return await new Response(flux).arrayBuffer()
}

/** Le contraire de `compresser`. */
export async function decompresser(d: string | ArrayBuffer | Uint8Array): Promise<string> {
  if (typeof d === 'string') return d
  const flux = new Blob([d as BlobPart]).stream().pipeThrough(new DecompressionStream('gzip'))
  return await new Response(flux).text()
}

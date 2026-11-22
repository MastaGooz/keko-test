/**
 * LE TRANSPORT DU JEU À DISTANCE (Keko, 22/11 — voir `logic/vaisseau/reseau.ts`) : PeerJS (MIT, 1.5.4, la seconde
 * dépendance de code — Keko l'a choisie, avec le serveur public de PeerJS pour se trouver ; sans la bibliothèque, ce
 * serveur ne relayait pas nos messages, mesuré). L'HÔTE ouvre un salon : un code de quatre lettres, l'identifiant
 * `novadrifter-<code>` sur le serveur ; L'INVITÉ le rejoint par ce code. Deux canaux entre eux, ouverts par l'invité :
 * `ctrl`, fiable et ordonné (en JSON : le bonjour, les configurations, les talents) ; `etat`, sans ordre (des octets :
 * les états du monde compressés, et le manche de l'invité). Un seul invité à la fois. Les relais de PeerJS prennent le
 * relais quand la connexion directe échoue (la 4G, parfois).
 */
import Peer, { type DataConnection } from 'peerjs'

const PREFIXE = 'novadrifter-'
/** Les lettres d'un code : sans I, L, O, 0, 1, qui se confondent. */
const LETTRES = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
export const codeAuHasard = (): string => Array.from({ length: 4 }, () => LETTRES[Math.floor(Math.random() * LETTRES.length)]).join('')

export type EtatDeLaLiaison = 'ouverture' | 'attente' | 'connecte' | 'perdu' | 'introuvable' | 'erreur'
export type Rappels = {
  /** Un message du canal fiable (déjà relu du JSON). */
  message: (m: unknown) => void
  /** Un message du canal rapide (un texte ou des octets). */
  vite: (d: string | ArrayBuffer) => void
  etat: (e: EtatDeLaLiaison) => void
}
export type Liaison = {
  /** Le code du salon (l'hôte peut en changer s'il était pris). */
  code: () => string
  etat: () => EtatDeLaLiaison
  envoyer: (m: unknown) => void
  envoyerVite: (d: string | ArrayBuffer | Uint8Array) => void
  fermer: () => void
}

/** L'HÔTE : le salon s'ouvre sous ce code, ou un tiré au hasard (un autre s'il est pris), et attend un invité. */
export function ouvrirLeSalon(r: Rappels, voulu = ''): Liaison {
  let code = /^[A-Z0-9]{3,12}$/.test(voulu) ? voulu : codeAuHasard()
  let etat: EtatDeLaLiaison = 'ouverture'
  let peer: Peer | null = null
  let ctrl: DataConnection | null = null
  let vite: DataConnection | null = null
  const poser = (e: EtatDeLaLiaison): void => {
    if (etat === e) return
    etat = e
    r.etat(e)
  }
  const verifier = (): void => {
    if (ctrl?.open === true && vite?.open === true) poser('connecte')
  }
  const perdre = (): void => {
    ctrl = null
    vite = null
    if (etat === 'connecte') poser('attente')
  }
  const lancer = (): void => {
    peer = new Peer(PREFIXE + code)
    peer.on('open', () => poser(ctrl === null ? 'attente' : etat))
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
      const deja = c.label === 'ctrl' ? ctrl : vite
      // (un seul invité : un second est refusé tant que le premier est là)
      if (deja !== null && deja.open && deja.peer !== c.peer) {
        c.on('open', () => c.close())
        return
      }
      if (c.label === 'ctrl') ctrl = c
      else vite = c
      c.on('open', verifier)
      c.on('data', (d) => (c.label === 'ctrl' ? r.message(d) : r.vite(d as string | ArrayBuffer)))
      c.on('close', perdre)
      c.on('error', perdre)
    })
  }
  lancer()
  return {
    code: () => code,
    etat: () => etat,
    envoyer: (m) => {
      if (ctrl?.open === true) void ctrl.send(m)
    },
    envoyerVite: (d) => {
      if (vite?.open === true) void vite.send(d)
    },
    fermer: () => {
      peer?.destroy()
      peer = null
    },
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
  peer.on('open', () => {
    ctrl = peer.connect(PREFIXE + code, { label: 'ctrl', reliable: true, serialization: 'json' })
    vite = peer.connect(PREFIXE + code, { label: 'etat', reliable: false, serialization: 'raw' })
    const verifier = (): void => {
      if (ctrl?.open === true && vite?.open === true) poser('connecte')
    }
    for (const c of [ctrl, vite]) {
      c.on('open', verifier)
      c.on('close', () => poser('perdu'))
      c.on('error', () => poser('perdu'))
    }
    ctrl.on('data', (d) => r.message(d))
    vite.on('data', (d) => r.vite(d as string | ArrayBuffer))
  })
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

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

/** L'HÔTE : le salon s'ouvre sous ce code, ou un tiré au hasard (un autre s'il est pris), et attend un invité. */
export function ouvrirLeSalon(r: Rappels, voulu = ''): Liaison {
  let code = /^[A-Z0-9]{3,12}$/.test(voulu) ? voulu : codeAuHasard()
  let etat: EtatDeLaLiaison = 'ouverture'
  let peer: Peer | null = null
  let ctrl: DataConnection | null = null
  let vite: DataConnection | null = null
  let suivi = suiviNeuf()
  const poser = (e: EtatDeLaLiaison): void => {
    if (etat === e) return
    etat = e
    r.etat(e)
  }
  const verifier = (): void => {
    if (ctrl?.open === true && vite?.open === true) poser('connecte')
  }
  // (LE TÉLÉPHONE REVENU AU PREMIER PLAN — on est allé envoyer le lien dans une autre appli : la page dormait, le serveur
  // l'a peut-être oubliée ; elle s'y reconnecte, sous le même code)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible' || peer === null) return
    if (peer.destroyed) lancer()
    else if (peer.disconnected) peer.reconnect()
  })
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
      if (c.label === 'ctrl') suivi = suiviNeuf()
      suivre(c, suivi)
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
    detail: () => dire(peer === null ? 'fermé' : peer.open ? 'joint' : peer.disconnected ? 'perdu' : 'en cours', suivi),
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
      if (ctrl === c1 && c1.open && c2.open) poser('connecte')
    }
    for (const c of [c1, c2]) {
      suivre(c, suivi)
      c.on('open', verifier)
      c.on('close', () => ctrl === c1 && etat === 'connecte' && poser('perdu'))
      c.on('error', () => ctrl === c1 && etat === 'connecte' && poser('perdu'))
    }
    c1.on('data', (d) => r.message(d))
    c2.on('data', (d) => r.vite(d as string | ArrayBuffer))
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

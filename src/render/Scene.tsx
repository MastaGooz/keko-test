/**
 * LA SCÈNE : le deuxième jalon du moteur 3D.
 *
 * Le premier prouvait qu'une carte tient en 3D sans perdre son texte. Celui-ci
 * prouve **le geste** : sortir une carte de la main pour la jouer, la taper
 * pour la regarder. C'est le dernier gros risque de la réécriture — en 2D, le
 * DOM portait le geste ; ici c'est du lancer de rayon, et ça se juge au doigt.
 *
 * Les règles du jeu ne sont pas encore branchées : une carte jouée quitte la
 * main, et c'est tout. `logic/` est prêt et n'a pas bougé d'une ligne, mais
 * *brancher le combat avant d'avoir validé le geste reviendrait à construire
 * sur un doute.*
 */
import { useCallback, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { Main3D } from './Main3D.tsx'
import type { CarteAPeindre } from './texture-carte.ts'

/** Cinq cartes du deck de départ, prises telles quelles. */
const DEPART: CarteAPeindre[] = [
  { nom: 'Estoc', cout: 1, effet: ['Inflige 3 dégâts'], type: 'Attaque' },
  { nom: 'Garde', cout: 1, effet: ['Bloque 5 dégâts', 'ce tour seulement'], type: 'Défense' },
  { nom: 'Moulinet', cout: 4, effet: ['Inflige 14 dégâts'], type: 'Attaque' },
  { nom: 'Rempart', cout: 2, effet: ['Bloque 11 dégâts', 'ce tour seulement'], type: 'Défense' },
  { nom: 'Potion', cout: 1, effet: ['Rend 14 PV', 'se boit : détruite'], type: 'Consommable' },
]

export function Scene(): React.JSX.Element {
  const [main, setMain] = useState<CarteAPeindre[]>(DEPART)
  const [message, setMessage] = useState<string | null>(null)

  // LE CHARGEMENT DOIT SE VOIR. Rien ne s'affiche tant que les polices et les
  // illustrations ne sont pas là — et sur un téléphone ça fait plusieurs
  // secondes d'écran noir. *Un écran noir sans signe de vie se lit comme une
  // page cassée* : je m'y suis trompé moi-même en testant la version déployée.
  const [peintes, setPeintes] = useState(0)
  const compter = useCallback(() => setPeintes((n) => n + 1), [])
  const pret = peintes >= DEPART.length

  const jouer = useCallback((index: number) => {
    setMain((m) => {
      setMessage(`${m[index]?.nom ?? ''} jouée`)
      return m.filter((_, i) => i !== index)
    })
  }, [])

  const regarder = useCallback((index: number) => {
    setMain((m) => {
      setMessage(`${m[index]?.nom ?? ''} — regardée`)
      return m
    })
  }, [])

  return (
    <>
      {/* LE RECUL DE LA CAMÉRA DONNE SA TAILLE À LA CARTE : à cette distance
          et ce champ, une carte fait ~37 % de la hauteur d'écran, l'ordre de
          grandeur du jeu 2D. C'est le seul réglage qui compte pour la
          lisibilité — la carte, elle, mesure toujours 1 de large.

          ET LA CAMÉRA REGARDE DROIT : à `y = 0,55` elle plongeait sur la main,
          qui se lisait alors comme vue de haut. Keko : « la main devrait être
          vue à plat ». */}
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ position: [0, 0, 6], fov: 42 }}
        style={{ position: 'fixed', inset: 0, background: '#0d0c11' }}
      >
        {/* L'éclairage est PROCÉDURAL, sans fichier d'environnement : les
            presets de drei téléchargent des HDR depuis un CDN, et ce projet ne
            dépend d'aucune ressource extérieure hors les deux polices. */}
        <ambientLight intensity={0.55} />
        <directionalLight
          position={[2.5, 3.5, 4]}
          intensity={2.2}
          castShadow
          shadow-mapSize={[1024, 1024]}
        />
        {/* Une lumière rasante froide côté gauche : c'est elle qui fait briller
            la tranche quand la carte s'incline, donc qui la rend solide. */}
        <directionalLight position={[-4, 1, 2]} intensity={0.9} color="#8fb4ff" />

        <Main3D cartes={main} onJouer={jouer} onRegarder={regarder} onPeinte={compter} />

        {/* Le sol : il ne se voit pas, il reçoit les ombres. Sans lui, les
            cartes flottent dans le noir et le volume ne se lit plus. */}
        <mesh position={[0, 0, -1.2]} receiveShadow>
          <planeGeometry args={[16, 10]} />
          <shadowMaterial opacity={0.5} />
        </mesh>
      </Canvas>

      {!pret && <p className="chargement-3d">Chargement…</p>}
      {pret && (
        <p className="note-3d">
          {message ?? 'Sors une carte de la main pour la jouer · tape-la pour la regarder'}
        </p>
      )}
    </>
  )
}

/**
 * LA SCÈNE : le premier jalon du moteur 3D.
 *
 * Ce qu'il sert à prouver, et rien de plus : **qu'une carte de ce jeu tient en
 * 3D sans perdre son texte.** C'est le seul risque qui pouvait condamner la
 * réécriture, et il ne se juge pas sur un plan de démonstration — il se juge
 * sur une vraie carte, avec un vrai cartouche et une illustration de Keko.
 *
 * Trois cartes côte à côte plutôt qu'une : la lumière ne se lit que
 * comparativement. Une carte seule paraît toujours correcte.
 */
import { Canvas } from '@react-three/fiber'
import { Carte3D } from './Carte3D.tsx'
import type { CarteAPeindre } from './texture-carte.ts'

/** Trois cartes du jeu, prises telles quelles : arme, défense, consommable. */
const CARTES: CarteAPeindre[] = [
  { nom: 'Glaive', cout: 3, effet: ['1× Estoc · 1× Taillade · 1× Moulinet'], type: 'Arme · une main' },
  { nom: 'Moulinet', cout: 4, effet: ['Inflige 14 dégâts'], type: 'Attaque' },
  { nom: 'Rempart', cout: 2, effet: ['Bloque 11 dégâts', 'ce tour seulement'], type: 'Défense' },
]

export function Scene(): React.JSX.Element {
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ position: [0, 0, 3.4], fov: 42 }}
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

      {CARTES.map((carte, i) => (
        <Carte3D key={carte.nom} carte={carte} position={[(i - 1) * 1.25, 0, 0]} />
      ))}

      {/* Le sol : il ne se voit pas, il reçoit les ombres. Sans lui, les
          cartes flottent dans le noir et le volume ne se lit plus. */}
      <mesh position={[0, 0, -1.2]} receiveShadow>
        <planeGeometry args={[14, 9]} />
        <shadowMaterial opacity={0.5} />
      </mesh>
    </Canvas>
  )
}

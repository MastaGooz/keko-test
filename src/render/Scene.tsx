/**
 * LA SCÈNE : le combat, branché sur les vraies règles.
 *
 * Les deux premiers jalons ont prouvé qu'une carte tient en 3D sans perdre son
 * texte, puis que le geste répond au doigt. Celui-ci branche `logic/` : le
 * deck vient du chargement gratuit, les ennemis du même tirage que le jeu 2D,
 * et jouer une carte passe par `jouerCarte`. **Aucune règle n'a été réécrite.**
 *
 * Ce qui manque encore, et qui viendra : les animations de coup, le point de
 * sortie, le butin. Ici on veut juste pouvoir jouer un combat entier.
 */
import { useCallback, useMemo, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { Main3D } from './Main3D.tsx'
import { CORPS, Ennemi3D } from './Ennemi3D.tsx'
import { aPeindre, combatDeDepart } from './combat-3d.ts'
import type { EtatCombat } from '../logic/combat.ts'
import { finDuTour, jouerCarte, menaceDuTour, viseUneCible, vivants } from '../logic/combat.ts'

/** La seed de départ. Une seule partie pour l'instant : on juge le combat. */
const SEED = 1789

export function Scene(): React.JSX.Element {
  const depart = useMemo(() => combatDeDepart(SEED), [])
  const [combat, setCombat] = useState<EtatCombat>(depart.combat)
  const [zoomee, setZoomee] = useState<number | null>(null)
  /** La carte sortie de la main, en attente de sa cible. */
  const [engagee, setEngagee] = useState<number | null>(null)

  // LE CHARGEMENT DOIT SE VOIR. Rien ne s'affiche tant que les polices et les
  // illustrations ne sont pas là — et sur un téléphone ça fait plusieurs
  // secondes d'écran noir. *Un écran noir sans signe de vie se lit comme une
  // page cassée.*
  const [peintes, setPeintes] = useState(0)
  const compter = useCallback(() => setPeintes((n) => n + 1), [])
  const pret = peintes > 0

  const main = useMemo(() => combat.main.map(aPeindre), [combat.main])
  const debout = vivants(combat)
  const menace = Math.max(0, menaceDuTour(combat) - combat.bloc)
  const fini = combat.issue !== null

  /**
   * Jouer une carte. **Une carte qui ne vise personne part tout de suite** ;
   * une carte qui vise attend sa cible — et s'il n'y a qu'un corps debout,
   * elle y va directement.
   *
   * *Un geste qui engage n'a plus rien à confirmer* : c'est la règle du 2D, et
   * elle vaut d'autant plus ici que sortir la carte est déjà un engagement.
   */
  const jouer = useCallback(
    (index: number) => {
      setZoomee(null)
      const carte = combat.main[index]
      if (carte === undefined || fini) return
      if (carte.cout > combat.energie) return

      if (!viseUneCible(carte)) {
        setCombat((c) => jouerCarte(c, index, -1))
        return
      }
      const cibles = vivants(combat)
      if (cibles.length === 1) {
        setCombat((c) => jouerCarte(c, index, cibles[0]!.index))
        return
      }
      setEngagee(index)
    },
    [combat, fini],
  )

  const cibler = useCallback(
    (cible: number) => {
      if (engagee === null) return
      setCombat((c) => jouerCarte(c, engagee, cible))
      setEngagee(null)
    },
    [engagee],
  )

  const reordonner = useCallback((de: number, vers: number) => {
    setZoomee(null)
    setCombat((c) => {
      const carte = c.main[de]
      if (carte === undefined) return c
      const restantes = c.main.filter((_, i) => i !== de)
      restantes.splice(Math.max(0, Math.min(restantes.length, vers)), 0, carte)
      return { ...c, main: restantes }
    })
  }, [])

  const terminer = useCallback(() => {
    setEngagee(null)
    setZoomee(null)
    setCombat((c) => finDuTour(c, depart.rng))
  }, [depart.rng])

  // LE RANG DES ENNEMIS, centré au-dessus de la main. Ils se tiennent côte à
  // côte et le joueur leur fait face depuis le bas de l'écran : c'est la main
  // qui tient sa place.
  const rang = combat.ennemis.map((_, i) => {
    const centre = (combat.ennemis.length - 1) / 2
    return [(i - centre) * (CORPS * 1.25), 0.75, 0] as [number, number, number]
  })

  return (
    <>
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ position: [0, 0, 6], fov: 42 }}
        style={{ position: 'fixed', inset: 0, background: '#0d0c11' }}
      >
        <ambientLight intensity={0.55} />
        {/* Le biais d'ombre éloigne la profondeur comparée d'un cheveu : sans
            lui, une surface s'ombre elle-même dès que la précision de la carte
            d'ombre est courte — ce qui arrive vite sur un téléphone. */}
        <directionalLight
          position={[2.5, 3.5, 4]}
          intensity={2.2}
          castShadow
          shadow-mapSize={[1024, 1024]}
          shadow-bias={-0.0008}
          shadow-normalBias={0.02}
        />
        <directionalLight position={[-4, 1, 2]} intensity={0.9} color="#8fb4ff" />

        {combat.ennemis.map((ennemi, i) => (
          <Ennemi3D
            key={`${ennemi.nom}-${i}`}
            ennemi={ennemi}
            index={i}
            position={rang[i]!}
            visable={engagee !== null}
            onViser={cibler}
          />
        ))}

        <Main3D
          cartes={main}
          zoomee={zoomee}
          onJouer={jouer}
          onRegarder={setZoomee}
          onReordonner={reordonner}
          onFermerZoom={() => setZoomee(null)}
          onPeinte={compter}
        />

        <mesh position={[0, 0, -1.2]} receiveShadow>
          <planeGeometry args={[16, 10]} />
          <shadowMaterial opacity={0.5} />
        </mesh>
      </Canvas>

      {/* L'INTERFACE RESTE EN HTML, au-dessus du canvas : des chiffres et un
          bouton n'ont rien à gagner à être en volume, et ils restent nets à
          toute taille d'écran. C'est la 3D qui sert la scène, pas l'inverse. */}
      <p className="build-3d">{__BUILD_TIME__}</p>
      {!pret && <p className="chargement-3d">Chargement…</p>}

      {pret && (
        <div className="jeu-3d">
          <div className="etat-3d">
            <span className="orbe-3d">
              {combat.energie}
              <small>/{combat.energieMax}</small>
            </span>
            <span className="pv-3d">
              {combat.pv}
              <small>/{combat.pvMax}</small>
            </span>
            {combat.bloc > 0 && <span className="bloc-3d">⛉ {combat.bloc}</span>}
            {menace > 0 && !fini && <span className="menace-3d">−{menace}</span>}
          </div>

          <div className="corps-3d">
            {combat.ennemis.map((e, i) =>
              e.pv > 0 ? (
                <span key={i} className="vie-3d">
                  {e.nom} {e.pv}/{e.pvMax} · frappe {e.degats} dans {e.compteur}
                </span>
              ) : null,
            )}
          </div>

          <p className="note-3d">
            {fini
              ? combat.issue === 'victoire'
                ? 'Victoire'
                : 'Mort'
              : engagee !== null
                ? 'Choisis une cible'
                : `Tour ${combat.tour} · ${debout.length} debout`}
          </p>

          <button className="fin-3d" type="button" onClick={terminer} disabled={fini}>
            Fin du tour
          </button>
        </div>
      )}
    </>
  )
}

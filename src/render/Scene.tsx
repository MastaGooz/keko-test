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
import { useCallback, useMemo, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { Main3D } from './Main3D.tsx'
import { CORPS, Ennemi3D } from './Ennemi3D.tsx'
import { Projeter } from './Projeter.tsx'
import { aPeindre, combatDeDepart } from './combat-3d.ts'
import type { EtatCombat } from '../logic/combat.ts'
import { finDuTour, jouable, jouerCarte, menaceDuTour, viseUneCible, vivants } from '../logic/combat.ts'

/** La seed de départ. Une seule partie pour l'instant : on juge le combat. */
const SEED = 1789

export function Scene(): React.JSX.Element {
  const depart = useMemo(() => combatDeDepart(SEED), [])
  const [combat, setCombat] = useState<EtatCombat>(depart.combat)
  const [zoomee, setZoomee] = useState<number | null>(null)
  /** La carte sortie de la main, en attente de sa cible. */
  const [engagee, setEngagee] = useState<number | null>(null)
  /** Une carte est tenue au doigt. */
  const [saisie, setSaisie] = useState(false)

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
  // CE QU'ON PEUT JOUER MAINTENANT : assez d'énergie, et le combat n'est pas
  // fini. Un trésor n'est jouable par personne — il ne fait qu'occuper une
  // place de main.
  const jouables = useMemo(
    () => combat.main.map((c) => !fini && jouable(c) && c.cout <= combat.energie),
    [combat.main, combat.energie, fini],
  )

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

  // Les étiquettes sont du HTML ancré sur les corps : `Projeter` les fait
  // suivre. On garde les éléments dans une ref, jamais dans l'état — leur
  // position change à chaque image.
  //
  // **DEUX POINTS PAR CRÉATURE, pas un seul avec des décalages en rem** : un
  // écart fixe ne suit pas la perspective, et la jauge se retrouvait posée au
  // milieu du corps. En projetant le haut de la tête et le bas des pattes, les
  // étiquettes tiennent leur place à toute distance et à toute taille d'écran.
  const hautes = useRef<(HTMLDivElement | null)[]>([])
  const basses = useRef<(HTMLDivElement | null)[]>([])
  const ancres = rang.flatMap(
    (p) =>
      [
        [p[0], p[1] + CORPS * 0.62, p[2]],
        [p[0], p[1] - CORPS * 0.62, p[2]],
      ] as [number, number, number][],
  )

  return (
    <>
      {/* LE FOND, derrière tout : il était porté par le canvas, mais un canvas
          opaque ne laisse rien passer dessous — or c'est exactement ce qu'il
          faut pour glisser l'interface SOUS les cartes. */}
      <div className="fond-3d" />

      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ position: [0, 0, 6], fov: 42 }}
        // LE CANVAS EST TRANSPARENT, et le fond vit derrière lui : c'est ce
        // qui permet de glisser l'interface DESSOUS. Avec un fond sur le
        // canvas, tout ce qu'on met derrière disparaît.
        //
        // ET LA SCÈNE PASSE DEVANT TOUT LE TEMPS D'UN GESTE. Au repos, le
        // bouton de fin de tour et les lignes d'état restent au-dessus — il
        // faut pouvoir cliquer le bouton. Mais une carte qu'on tient ou qu'on
        // regarde ne doit passer sous rien : pendant ce temps on n'a besoin
        // d'aucune commande, donc la scène monte au-dessus et redescend au
        // lâcher. Keko : « la carte est toujours sous le bouton fin de tour
        // et les deux textes gris en haut ».
        style={{ position: 'fixed', inset: 0, zIndex: saisie || zoomee !== null ? 4 : 2 }}
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
          jouables={jouables}
          zoomee={zoomee}
          onJouer={jouer}
          onRegarder={setZoomee}
          onReordonner={reordonner}
          onFermerZoom={() => setZoomee(null)}
          onPeinte={compter}
          onSaisie={setSaisie}
        />

        <mesh position={[0, 0, -1.2]} receiveShadow>
          <planeGeometry args={[16, 10]} />
          <shadowMaterial opacity={0.5} />
        </mesh>

        <Projeter
          points={ancres}
          cibles={combat.ennemis.flatMap((_, i) => [hautes.current[i] ?? null, basses.current[i] ?? null])}
        />
      </Canvas>

      {/* CE QUE CHAQUE CRÉATURE DIT D'ELLE-MÊME, ancré sur son corps :
          l'intention au-dessus de la tête, la jauge et le nom sous les pattes.
          En HTML plutôt qu'en volume — un chiffre reste net à toute distance,
          et il n'a rien à gagner à s'incliner avec la scène. */}
      <div className="ancres-3d">
        {combat.ennemis.map((e, i) => (
          <div key={`h-${e.nom}-${i}`} className="ancre-3d haute" ref={(el) => { hautes.current[i] = el }}>
            {/* L'INTENTION : ce qu'il frappe et dans combien de tours, allumée
                si c'est pour la fin de CE tour-ci. C'est le seul chiffre qui
                compte avant de choisir sa cible — la couleur porte le tempo,
                aucun mot n'est requis. */}
            {e.pv > 0 && (
              <span className={`intention-3d${e.compteur <= 1 ? ' imminent' : ''}`}>
                ✖ {e.degats}
                {e.compteur > 1 && <small> dans {e.compteur}</small>}
              </span>
            )}
          </div>
        ))}

        {combat.ennemis.map((e, i) => (
          <div key={`b-${e.nom}-${i}`} className="ancre-3d basse" ref={(el) => { basses.current[i] = el }}>
            {/* LA JAUGE ET LE NOM. Le chiffre est DANS la barre, au format
                `courant/max` : sans le maximum on ne sait pas si 23 est
                beaucoup, et à côté d'une barre il faut faire l'aller-retour
                entre les deux pour lire un seul fait. */}
            {e.pv > 0 && (
              <span className="vie-3d">
                <span className="jauge-3d">
                  <span className="remplissage-3d" style={{ width: `${(e.pv / e.pvMax) * 100}%` }} />
                  <span className="chiffre-3d">
                    {e.pv}/{e.pvMax}
                  </span>
                </span>
                <span className="nom-3d">{e.nom}</span>
              </span>
            )}
          </div>
        ))}
      </div>

      {/* L'INTERFACE RESTE EN HTML, au-dessus du canvas : des chiffres et un
          bouton n'ont rien à gagner à être en volume, et ils restent nets à
          toute taille d'écran. C'est la 3D qui sert la scène, pas l'inverse. */}
      <p className="build-3d">{__BUILD_TIME__}</p>
      {!pret && <p className="chargement-3d">Chargement…</p>}

      {pret && (
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
      )}

      {pret && (
        <div className="jeu-3d">
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

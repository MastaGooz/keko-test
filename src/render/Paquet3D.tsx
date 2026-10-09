/**
 * L'OUVERTURE D'UN PAQUET — le premier écran du troisième mode.
 *
 * Cinq cartes face cachée ; on en tape une, elle culbute et se révèle. Choisi
 * par Keko parmi trois écrans, et c'est celui qui exerce le plus de ce qui
 * existe déjà : **le dos de carte, les quatre métaux, l'auréole chromatique du
 * diamant, la culbute face/dos et son onde.** Rien de tout ça n'est réécrit
 * ici — `Carte3D` sait déjà le faire, et cet écran ne fait que le lui demander.
 *
 * *C'est la règle du projet depuis le début* : un écran décide de ce que les
 * choses VEULENT DIRE, les objets savent comment elles se dessinent.
 */
import { useEffect, useMemo, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { Carte3D } from './Carte3D.tsx'
import { Bouton3D } from './Bouton3D.tsx'
import { Cadrage, FOV, Z_MAIN, hauteurVisibleA, zCamera } from './Cadrage.tsx'
import { Horloge } from './horloge.tsx'
import { carteDeLAnimal } from './carte-animal.ts'
import { carteDuPersonnage } from './carte-personnage.ts'
import { chargerAnimaux } from '../ui/animaux.ts'
import { loadCharacters } from '../ui/personnages.ts'
import { createRng } from '../logic/rng.ts'
import { CARTES_PAR_PAQUET, ouvrirPaquet, parCran } from '../logic/paquet.ts'
import type { CarteAnimal } from '../logic/animals/types.ts'
import type { CharacterCard } from '../logic/characters/types.ts'

/**
 * LES DEUX CATALOGUES COHABITENT, LE TEMPS QUE KEKO TRANCHE.
 *
 * Les animaux REMPLACENT les personnages — c'est sa décision — mais *le
 * pipeline des personnages ne se supprime pas avant validation*, et le reste
 * est intact : le catalogue, le type, les formules et le convertisseur de
 * carte. **Il ne manquait donc qu'une porte pour les revoir**, et elle coûte
 * quatre lignes.
 *
 * `?paquet&perso` rouvre l'ancien mode. Même motif que `?sillage=`, `?cadre=`
 * et `?fond=image` : *ce qui a servi à choisir doit rester ouvrable, même une
 * fois le choix fait.* Le jour où les personnages partent pour de bon, c'est
 * ce drapeau qui tombe en premier.
 *
 * **Les deux passent par le MÊME tirage** (`logic/paquet.ts`), qui ne demande
 * à une carte que son identité et son cran : c'est précisément pour ça qu'il a
 * quitté le dossier des personnages.
 */
type CarteDuMode = CarteAnimal | CharacterCard

/**
 * LA RANGÉE SE DIMENSIONNE SUR LA PLACE, jamais à une taille écrite à la main.
 *
 * C'est la règle que la grille du zoom et le chargement de l'armurerie ont
 * déjà payée : *le champ visible est plus PETIT en unités de scène sur un
 * téléphone*, donc une carte de taille fixe y déborde. Deux contraintes — la
 * largeur pour que cinq cartes tiennent, la hauteur pour qu'une carte tienne —
 * et la plus dure gagne.
 */
function tailleDeLaRangee(largeurVisible: number, hauteurVisible: number): number {
  const parLargeur = (largeurVisible * 0.9) / (CARTES_PAR_PAQUET + (CARTES_PAR_PAQUET - 1) * 0.12)
  const parHauteur = (hauteurVisible * 0.62) / 1.4
  return Math.min(parLargeur, parHauteur)
}

/**
 * LA GRAINE DE LA SESSION, TIREE AU CHARGEMENT. Keko : « on peut randomiser les
 * personnages ? j'ai toujours la meme seed je crois ».
 *
 * *Le tirage etait bien seede, et c'est la BASE qui ne bougeait pas* : elle
 * valait 1 sans parametre, donc le premier paquet de chaque rechargement etait
 * toujours le meme. Le numero, lui, avancait bien a chaque ouverture — **le
 * defaut ne se voyait donc qu'en relancant la page**, et jamais en enchainant
 * les paquets.
 *
 * **`?paquet=43` rejoue toujours un tirage precis**, exactement comme
 * `?seed=42` rejoue une descente : *ce qui a servi a signaler un cas doit
 * rester ouvrable.* Sans parametre, on tire.
 *
 * Deux sources melees, parce qu'elles ne ratent pas les memes cas : l'horloge
 * seule donne des graines voisines quand on recharge vite, le hasard du
 * navigateur seul n'est pas garanti distinct d'un onglet a l'autre.
 *
 * Elle vit au niveau du MODULE et non dans un etat : *une graine qui se
 * retirerait a un rendu changerait le paquet sous les yeux*, et React double
 * les initialiseurs en mode strict.
 */
const GRAINE = (() => {
  const demandee = new URLSearchParams(location.search).get('paquet')
  if (demandee !== null && demandee !== '' && !Number.isNaN(Number(demandee))) return Number(demandee)
  const tiree = (Date.now() ^ (Math.random() * 2 ** 32)) >>> 0
  // ON LA DIT, sinon un tirage interessant est perdu : il n'y a pas de place a
  // l'ecran pour l'afficher, et `?paquet=<n>` le rejoue a l'identique.
  console.info(`paquet : graine ${tiree} — ?paquet=${tiree} rejoue cette serie`)
  return tiree
})()

export function Paquet3D(): React.ReactElement {
  /** `?paquet&perso` rejoue l'ancien catalogue — voir `CarteDuMode`. */
  const personnages = new URLSearchParams(location.search).has('perso')
  const [catalogue, setCatalogue] = useState<CarteDuMode[] | null>(null)
  const [erreur, setErreur] = useState<string | null>(null)
  /** Le numéro du paquet : il change à chaque ouverture, et il seede le tirage. */
  const [numero, setNumero] = useState(0)
  /** Les identifiants déjà retournés. */
  const [revelees, setRevelees] = useState<ReadonlySet<string>>(new Set())
  /**
   * LE JETON DE CULBUTE, PAR CARTE. `Carte3D` le compare à ce qu'il avait :
   * *c'est un jeton, pas un instant* — l'horloge qui compte est celle de la
   * scène, et seule la scène la connaît.
   */
  const [jetons, setJetons] = useState<Readonly<Record<string, number>>>({})
  const [fenetre, setFenetre] = useState({ l: window.innerWidth, h: window.innerHeight })

  useEffect(() => {
    let vivant = true
    void (personnages ? loadCharacters() : chargerAnimaux()).then((cartes: CarteDuMode[]) => {
      if (!vivant) return
      if (cartes.length === 0) setErreur('Catalogue vide ou introuvable.')
      else setCatalogue(cartes)
    })
    return () => {
      vivant = false
    }
  }, [personnages])

  useEffect(() => {
    const suivre = () => setFenetre({ l: window.innerWidth, h: window.innerHeight })
    window.addEventListener('resize', suivre)
    window.addEventListener('orientationchange', suivre)
    return () => {
      window.removeEventListener('resize', suivre)
      window.removeEventListener('orientationchange', suivre)
    }
  }, [])

  // Le catalogue rangé par cran, une fois pour toutes : un écran qui ouvre dix
  // paquets ne doit pas reparcourir trois mille cartes dix fois.
  const tas = useMemo(() => (catalogue === null ? null : parCran(catalogue)), [catalogue])

  /**
   * LE PAQUET COURANT. Seedé sur son numéro, donc **rejouable** : Keko peut
   * signaler un tirage précis, exactement comme `?seed=42` rejoue une descente.
   */
  const paquet = useMemo(() => {
    if (tas === null) return []
    return ouvrirPaquet(tas, createRng((GRAINE + numero * 7919) >>> 0))
  }, [tas, numero])

  /**
   * LES CARTES À PEINDRE, MÉMORISÉES — et ce n'est pas une optimisation.
   *
   * **`Carte3D` charge sa texture dans un effet qui dépend de la carte.** Un
   * parent qui la construit à la volée en fabrique une NOUVELLE à chaque
   * rendu : l'effet se relance, `onPeinte` pousse un rendu, et la page GÈLE —
   * sans une seule erreur en console. *C'est le défaut le plus coûteux de tout
   * ce moteur, et il ne dit rien du tout.*
   */
  const aPeindre = useMemo(
    () => paquet.map((c) => ('groupe' in c ? carteDeLAnimal(c) : carteDuPersonnage(c))),
    [paquet],
  )

  const toutRevele = paquet.length > 0 && paquet.every((c) => revelees.has(c.id))

  function reveler(id: string): void {
    if (revelees.has(id)) return
    setRevelees((d) => new Set(d).add(id))
    setJetons((j) => ({ ...j, [id]: (j[id] ?? 0) + 1 }))
  }

  function toutReveler(): void {
    setRevelees(new Set(paquet.map((c) => c.id)))
    setJetons((j) => {
      const suite = { ...j }
      for (const c of paquet) if (!revelees.has(c.id)) suite[c.id] = (suite[c.id] ?? 0) + 1
      return suite
    })
  }

  function ouvrirUnAutre(): void {
    setRevelees(new Set())
    setNumero((n) => n + 1)
  }

  const hVisible = hauteurVisibleA(Z_MAIN, fenetre.h)
  const lVisible = hVisible * (fenetre.l / fenetre.h)
  const taille = tailleDeLaRangee(lVisible, hVisible)
  const pas = taille * 1.12
  const y = hVisible * 0.06

  return (
    <div className="paquet-3d">
      <div className="paquet-fond" />
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ position: [0, 0, zCamera(fenetre.h)], fov: FOV }}
        style={{ position: 'fixed', inset: 0 }}
      >
        <Cadrage />
        <Horloge />
        <ambientLight intensity={0.55} />
        <directionalLight
          position={[2.5, 3.5, 4]}
          intensity={2.2}
          castShadow
          shadow-mapSize={[1024, 1024]}
          shadow-bias={-0.0008}
          shadow-normalBias={0.02}
        />
        <directionalLight position={[-4, 1, 2]} intensity={0.9} color="#8fb4ff" />

        {aPeindre.map((carte, i) => {
          const vue = revelees.has(carte.id)
          return (
            <Carte3D
              key={carte.id}
              carte={carte}
              // LE DOS TANT QU'ELLE N'EST PAS RETOURNÉE : c'est la même carte
              // vue de l'autre côté, pas un second objet.
              dos={!vue}
              culbute={jetons[carte.id] ?? 0}
              position={[(i - (aPeindre.length - 1) / 2) * pas, y, Z_MAIN]}
              taille={taille}
              // ELLE RÉPOND AU CURSEUR une fois révélée, et pas avant : *un dos
              // n'a rien à montrer*, donc rien à faire briller.
              reflet={vue}
              ombre
              onPointerDown={(e) => {
                e.stopPropagation()
                reveler(carte.id)
              }}
            />
          )
        })}

        {paquet.length > 0 && (
          <Bouton3D
            texte={toutRevele ? 'Ouvrir un autre paquet' : 'Tout révéler'}
            ton={toutRevele ? 'or' : 'pierre'}
            cran="ecran"
            position={[0, -hVisible * 0.36, Z_MAIN]}
            onCliquer={toutRevele ? ouvrirUnAutre : toutReveler}
          />
        )}
      </Canvas>

      {catalogue === null && erreur === null && <p className="paquet-mot">Ouverture du paquet…</p>}
      {erreur !== null && <p className="paquet-mot">{erreur}</p>}
    </div>
  )
}

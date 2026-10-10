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
import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { Carte3D } from './Carte3D.tsx'
import { Bouton3D } from './Bouton3D.tsx'
import { Sachet3D } from './Sachet3D.tsx'
import { Cadrage, FOV, Z_MAIN, hauteurVisibleA, zCamera } from './Cadrage.tsx'
import { Horloge } from './horloge.tsx'
import { AMBIANCE, ECHELLE_METAL, RAPPORT_SACHET } from './texture-carte.ts'
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
 * LE SACHET EST PLUS GRAND QU'UNE CARTE, et il doit l'être : *il en contient
 * cinq.* Un sachet à la taille d'une carte se lirait comme une sixième carte
 * posée au milieu, et on ne comprendrait pas qu'il y a quelque chose dedans.
 *
 * Il se dimensionne sur la place, comme tout ici — la hauteur borne sur un
 * téléphone, la largeur sur un écran de PC.
 */
function tailleDuSachet(largeurVisible: number, hauteurVisible: number): number {
  return Math.min(largeurVisible * 0.42, (hauteurVisible * 0.68) / RAPPORT_SACHET)
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

/**
 * CE QUE DURE LA MONTEE DU COMPTEUR DE LA DERNIERE CARTE.
 *
 * Il DECELERE en arrivant : *un compteur qui s'arrete net se lit comme une
 * coupure, un compteur qui ralentit se lit comme une arrivee.* C'est le
 * contraste de vitesse du bond des creatures, pris par l'autre bout.
 */
const MONTEE = 1300

/** Le rang d'un metal dans l'echelle. `-1` pour ce qui n'en porte pas. */
function rangMetal(rarete: string | undefined): number {
  return (ECHELLE_METAL as readonly string[]).indexOf(rarete ?? 'commune')
}

/** La lueur d'un metal, avec le bronze pour repli. */
function lueurDe(rang: number): string {
  return AMBIANCE[ECHELLE_METAL[Math.max(0, rang)] ?? 'commune'] ?? AMBIANCE.commune!
}

export function Paquet3D(): React.ReactElement {
  /** `?paquet&perso` rejoue l'ancien catalogue — voir `CarteDuMode`. */
  const personnages = new URLSearchParams(location.search).has('perso')
  /**
   * `?paquet&culbute` REND LA CULBUTE, et le développement est le défaut.
   *
   * *Une carte qui se révèle en tournant ne dit rien de ce qu'elle est* : on
   * voit un dos, puis une face, et entre les deux il n'y a que du mouvement.
   * Le développement annonce **le nom avant l'image** — et c'est précisément
   * ce qu'on cherche à l'ouverture d'un paquet, où la question est « qui
   * est-ce ? » et non « est-ce que ça tourne bien ? »
   *
   * La culbute reste ouvrable : *ce qui a servi à choisir doit rester
   * ouvrable, même une fois le choix fait.* Elle garde tout son emploi à
   * l'armurerie, où l'on POSE une pièce — là, il n'y a rien à lire, il y a un
   * geste à voir.
   */
  const culbuter = new URLSearchParams(location.search).has('culbute')
  /**
   * `?paquet&nu` SAUTE LE SACHET et ouvre directement sur les cinq dos.
   *
   * *Ce qui a servi à choisir doit rester ouvrable* — et surtout, juger une
   * carte ne doit pas coûter une déchirure à chaque fois : quand c'est le
   * DESSIN qu'on regarde, le sachet est un péage.
   */
  const nu = new URLSearchParams(location.search).has('nu')
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
  /**
   * LE RANG DE LA PLUS RARE REVELEE — c'est lui qui teinte la scene.
   *
   * *L'ambiance d'un paquet MONTE a mesure qu'on trouve mieux*, donc elle
   * raconte l'ouverture entiere et pas seulement la derniere carte. `-1` tant
   * qu'on n'a rien retourne : la pierre reste nue.
   */
  const [sommet, setSommet] = useState(-1)
  /**
   * L'ECLAT DU REVEAL COURANT. Il porte une CLE, parce que c'est elle qui le
   * remonte a neuf : *une classe qu'on retire et qu'on repose ne redemarre pas
   * une animation sans un reflow force* — la regle du gonflement des tas.
   */
  const [eclat, setEclat] = useState<{ readonly cle: number; readonly ton: string } | null>(null)
  /** Vrai pendant que le compteur de la derniere carte defile. */
  const [monte, setMonte] = useState(false)
  /** Le sachet est consumé : c'est ce qui laisse voir les cartes. */
  const [ouvert, setOuvert] = useState(nu)
  /** Il brûle : la tape est passée, et il n'y a plus à y revenir. */
  const [brule, setBrule] = useState(false)
  const racine = useRef<HTMLDivElement>(null)
  const refChiffre = useRef<HTMLParagraphElement>(null)
  const image = useRef(0)

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

  // UNE BOUCLE D'ANIMATION SE COUPE AU DEMONTAGE, sinon elle ecrit dans un
  // noeud qui n'existe plus — et React ne dit rien, il laisse faire.
  useEffect(() => () => cancelAnimationFrame(image.current), [])

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

  /** Les vues de la carte brute : c'est le chiffre dont la rarete DERIVE. */
  function vuesDe(id: string): number {
    const brute = paquet.find((c) => c.id === id)
    return brute === undefined ? 0 : brute.vues
  }

  function rangDe(id: string): number {
    return rangMetal(aPeindre.find((c) => c.id === id)?.rarete)
  }

  /**
   * LE COMPTEUR DE LA DERNIERE CARTE : il monte vers les vues, et **la couleur
   * REMONTE L'ECHELLE avec lui** pour s'arreter sur le bon barreau.
   *
   * *C'est la seule facon honnete de faire monter la couleur* : notre rarete
   * derive des vues, donc un chiffre qui grimpe et une teinte qui grimpe avec
   * lui disent la meme chose. Une interpolation vers la couleur finale, elle,
   * l'aurait annoncee des la premiere image.
   *
   * **Tout s'ecrit dans le DOM, jamais dans l'etat** : une valeur qui change a
   * chaque image declencherait un rendu par image — et ce rendu reconstruirait
   * cinq cartes a nuanceur. C'est le chemin de `Projeter`, pour la meme raison.
   */
  function monterLeCompteur(id: string): void {
    const cible = vuesDe(id)
    const rangFinal = Math.max(0, rangDe(id))
    const depart = performance.now()
    setMonte(true)
    const pas = (): void => {
      const p = Math.min(1, (performance.now() - depart) / MONTEE)
      // Une deceleration cubique : vive au depart, posee a l'arrivee.
      const avance = 1 - Math.pow(1 - p, 3)
      if (refChiffre.current !== null)
        refChiffre.current.textContent = Math.round(cible * avance).toLocaleString('fr-FR')
      // L'ECHELLE SE REMONTE EN PROPORTION, et elle s'arrete au bon cran :
      // *les couleurs PASSENT dans l'ordre*, elles ne sautent pas a la bonne.
      const rang = Math.min(rangFinal, Math.floor(avance * (rangFinal + 1)))
      racine.current?.style.setProperty('--lueur', lueurDe(rang))
      racine.current?.style.setProperty('--lueur-force', String(0.1 + avance * 0.5))
      if (p < 1) image.current = requestAnimationFrame(pas)
      else setSommet((h) => Math.max(h, rangFinal))
    }
    image.current = requestAnimationFrame(pas)
  }

  function reveler(id: string): void {
    if (revelees.has(id)) return
    const restantes = paquet.filter((c) => !revelees.has(c.id))
    setRevelees((d) => new Set(d).add(id))
    setJetons((j) => ({ ...j, [id]: (j[id] ?? 0) + 1 }))
    setEclat((e) => ({ cle: (e?.cle ?? 0) + 1, ton: lueurDe(rangDe(id)) }))
    // LA DERNIERE SE REVELE AU COMPTEUR, les autres d'un coup : *ce qui
    // distingue un moment est qu'il ne se produit qu'une fois.*
    if (restantes.length === 1) monterLeCompteur(id)
    else setSommet((h) => Math.max(h, rangDe(id)))
  }

  function toutReveler(): void {
    // ON SAUTE LA MONTEE : *un joueur qui demande tout ne demande pas de
    // suspense*, et le compteur en est un.
    cancelAnimationFrame(image.current)
    setMonte(false)
    const nonVues = paquet.filter((c) => !revelees.has(c.id))
    if (nonVues.length > 0) {
      const haut = Math.max(...nonVues.map((c) => rangDe(c.id)))
      setEclat((e) => ({ cle: (e?.cle ?? 0) + 1, ton: lueurDe(haut) }))
      setSommet((h) => Math.max(h, haut))
    }
    setRevelees(new Set(paquet.map((c) => c.id)))
    setJetons((j) => {
      const suite = { ...j }
      for (const c of paquet) if (!revelees.has(c.id)) suite[c.id] = (suite[c.id] ?? 0) + 1
      return suite
    })
  }

  function ouvrirUnAutre(): void {
    cancelAnimationFrame(image.current)
    setOuvert(nu)
    setBrule(false)
    setRevelees(new Set())
    setSommet(-1)
    setEclat(null)
    setMonte(false)
    racine.current?.style.removeProperty('--lueur')
    racine.current?.style.removeProperty('--lueur-force')
    setNumero((n) => n + 1)
  }

  const hVisible = hauteurVisibleA(Z_MAIN, fenetre.h)
  const lVisible = hVisible * (fenetre.l / fenetre.h)
  const taille = tailleDeLaRangee(lVisible, hVisible)
  const pas = taille * 1.12
  const y = hVisible * 0.06

  /**
   * LA DERNIERE CARTE, tant qu'elle n'est pas retournee. *Elle ne s'annonce
   * que s'il y en a eu d'autres avant* : sur un paquet d'une seule carte, « la
   * derniere » ne dirait rien.
   */
  const restantes = paquet.filter((c) => !revelees.has(c.id))
  const derniere = restantes.length === 1 && paquet.length > 1 ? restantes[0]! : null

  return (
    <div
      className="paquet-3d"
      ref={racine}
      style={
        {
          '--lueur': lueurDe(sommet),
          '--lueur-force': sommet < 0 ? 0 : 0.18 + sommet * 0.1,
        } as React.CSSProperties
      }
    >
      <div className="paquet-fond" />
      <div className="paquet-lueur" />
      {eclat !== null && (
        <div
          key={eclat.cle}
          className="paquet-eclat"
          style={{ '--lueur': eclat.ton } as React.CSSProperties}
        />
      )}
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

        {/*
          LE SACHET TIENT LA SCÈNE SEUL, et il n'y a rien d'autre à l'écran :
          *un paquet fermé ne montre pas ce qu'il contient.* Il est MONTÉ À
          NEUF à chaque ouverture (clé), parce que son horloge et son « c'est
          fini » vivent dans des refs — et une ref ne se remet pas à zéro parce
          qu'une prop a changé.
        */}
        {!ouvert && paquet.length > 0 && (
          <Sachet3D
            key={numero}
            taille={tailleDuSachet(lVisible, hVisible)}
            position={[0, 0, Z_MAIN]}
            ouvre={brule}
            onCliquer={() => setBrule(true)}
            onOuvert={() => setOuvert(true)}
          />
        )}

        {ouvert &&
          aPeindre.map((carte, i) => {
          const vue = revelees.has(carte.id)
          return (
            <Carte3D
              key={carte.id}
              carte={carte}
              // LE DOS TANT QU'ELLE N'EST PAS RETOURNÉE : c'est la même carte
              // vue de l'autre côté, pas un second objet.
              dos={!vue}
              // LES DEUX RÉVÉLATIONS PASSENT PAR LE MÊME JETON : *c'est le
              // même évènement*, seule la mise en scène change. Passer
              // `undefined` rend la prop absente, donc `Carte3D` ne charge pas
              // le pavé du nom quand il ne servirait pas.
              culbute={culbuter ? (jetons[carte.id] ?? 0) : undefined}
              developpe={culbuter ? undefined : (jetons[carte.id] ?? 0)}
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

        {ouvert && paquet.length > 0 && (
          <Bouton3D
            texte={toutRevele ? 'Ouvrir un autre paquet' : 'Tout révéler'}
            ton={toutRevele ? 'or' : 'pierre'}
            cran="ecran"
            position={[0, -hVisible * 0.36, Z_MAIN]}
            onCliquer={toutRevele ? ouvrirUnAutre : toutReveler}
          />
        )}
      </Canvas>

      {ouvert && (derniere !== null || monte) && (
        <div className="paquet-dernier">
          <p className="paquet-dernier__mot">Dernière carte</p>
          {monte && (
            <>
              <p className="paquet-compteur" ref={refChiffre}>
                0
              </p>
              <p className="paquet-compteur__unite">vues par mois</p>
            </>
          )}
        </div>
      )}

      {catalogue === null && erreur === null && <p className="paquet-mot">Ouverture du paquet…</p>}
      {erreur !== null && <p className="paquet-mot">{erreur}</p>}
    </div>
  )
}

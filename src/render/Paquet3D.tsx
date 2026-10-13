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
import {
  AMBIANCE,
  ECHELLE_COULEUR,
  ECHELLE_METAL,
  RAPPORT_SACHET,
  type CarteAPeindre,
} from './texture-carte.ts'
import { carteDeLEmoji } from './carte-emoji.ts'
import { carteDeLaPeinture } from './carte-peinture.ts'
import { chargerEmojis } from '../ui/emoji.ts'
import { chargerPeintures } from '../ui/peintures.ts'
import { createRng } from '../logic/rng.ts'
import {
  CARTES_PAR_PAQUET,
  ECHELLE_CINQ,
  ECHELLE_QUATRE,
  ouvrirPaquet,
  parCran,
  type Echelle,
} from '../logic/paquet.ts'
import { tirerBonus, type Bonus } from '../logic/emoji/tirage.ts'
import type { CarteEmoji } from '../logic/emoji/types.ts'
import type { CartePeinture } from '../logic/paintings/types.ts'

/**
 * L'EMOJI EST LE MODE PRINCIPAL ; LES PEINTURES RESTENT À CÔTÉ.
 *
 * Tranché par Keko : « on laisse définitivement tomber les animaux et les
 * personnages, on garde le projet emoji qui devient le principal ». Les deux
 * catalogues abandonnés sont partis — *du code mort ment sur ce que le jeu
 * fait* — et avec eux le plateau, qui lisait le graphe de leurs articles.
 *
 * **Les peintures ne sont nommées dans aucun des deux camps**, donc elles
 * restent ouvrables par `?paquet&art` : *ce qui a servi à choisir doit rester
 * ouvrable, même une fois le choix fait*, et elles ne coûtent rien à qui
 * n'ouvre pas le lien.
 *
 * **Les deux passent par le MÊME tirage** (`logic/paquet.ts`), qui ne demande
 * à une carte que son identité et son cran : c'est précisément pour ça qu'il
 * ne vit dans le dossier d'aucun mode.
 */
type CarteDuMode = CartePeinture | CarteEmoji

/**
 * LES DEUX CATALOGUES PASSENT PAR LE MEME PEINTRE, et le discriminant est
 * STRUCTUREL — `emoji` n'existe que sur une carte d'emoji : *un drapeau de
 * mode pose a cote se desaccorderait de la carte qu'il decrit.*
 */
function carteAPeindreDuMode(c: CarteDuMode, bonus?: Bonus): CarteAPeindre {
  if ('emoji' in c) return carteDeLEmoji(c, bonus)
  return carteDeLaPeinture(c)
}

/**
 * LE CHIFFRE QUE LA DERNIERE CARTE FAIT DEFILER, et son unite.
 *
 * **Il doit etre celui dont la rarete DERIVE** : *un chiffre qui grimpe et une
 * teinte qui grimpe avec lui ne disent la meme chose que s'ils mesurent la
 * meme chose.* **Pour une peinture c'est le nombre de VERSIONS
 * LINGUISTIQUES**, qui pese trois cinquiemes de sa formule et s'accorde a
 * 0,971 avec elle.
 */
function compteurDuMode(c: CarteDuMode, total = 0): { valeur: number; unite: string } {
  // POUR UN EMOJI C'EST LE NOMBRE D'EMOJI QU'IL DEPASSE au classement d'usage
  // d'Unicode. **Il fallait un chiffre qui MONTE avec la rarete** : le rang,
  // lui, descend -- un compteur qui s'arreterait a « 3 » pour la carte la plus
  // rare monterait vers le commun, et *la teinte monte avec le compteur.*
  if ('emoji' in c) return { valeur: Math.max(0, total - c.rang), unite: 'emoji dépassés' }
  return { valeur: c.langues, unite: 'langues sur Wikipédia' }
}

/**
 * LA RANGÉE SE DIMENSIONNE SUR LA PLACE, jamais à une taille écrite à la main.
 *
 * C'est la règle que la grille du zoom et le chargement de l'armurerie ont
 * déjà payée : *le champ visible est plus PETIT en unités de scène sur un
 * téléphone*, donc une carte de taille fixe y déborde. Deux contraintes — la
 * largeur pour que cinq cartes tiennent, la hauteur pour qu'une carte tienne —
 * et la plus dure gagne.
 */
function tailleDeLaRangee(
  largeurVisible: number,
  hauteurVisible: number,
  colonnes: number,
  lignes: number,
): number {
  const parLargeur = (largeurVisible * 0.9) / (colonnes + (colonnes - 1) * 0.12)
  const parHauteur = (hauteurVisible * 0.64) / (lignes * 1.4 + (lignes - 1) * 0.17)
  return Math.min(parLargeur, parHauteur)
}

/**
 * COMBIEN DE COLONNES AU BILAN — **cinq en paysage, trois en portrait.**
 *
 * *Cinq cartes alignées sur la largeur d'un téléphone debout font 55 px de
 * large chacune* : on y voit cinq couleurs et plus un seul nom. **Un bilan est
 * fait pour relire ce qu'on vient d'avoir**, donc il cède la ligne plutôt que
 * la taille — et trois colonnes sur deux lignes rendent 70 % de largeur à
 * chaque carte.
 *
 * Le seuil est le RAPPORT de la fenêtre et non une largeur en pixels : *ce qui
 * décide n'est pas la taille de l'écran, c'est sa forme.*
 */
function colonnesDuBilan(largeurVisible: number, hauteurVisible: number): number {
  return largeurVisible / hauteurVisible >= 1.15 ? CARTES_PAR_PAQUET : 3
}

/**
 * LA CARTE DU DÉFILÉ : seule au centre, aussi grande que la place le permet.
 *
 * *C'est tout l'intérêt de n'en montrer qu'une* — elle passe de 20 % à 55 % de
 * la largeur d'un téléphone en portrait, donc son illustration et son cartouche
 * se lisent sans qu'on ait à zoomer.
 *
 * **Les deux contraintes se valent ici**, à la différence de la rangée : en
 * portrait c'est la largeur qui borne, en paysage la hauteur. *La plus dure
 * gagne*, et c'est la même règle depuis le début.
 */
function tailleDuDefile(largeurVisible: number, hauteurVisible: number): number {
  return Math.min(largeurVisible * 0.78, (hauteurVisible * 0.58) / 1.4)
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
  // EN PORTRAIT C'EST LA LARGEUR QUI BORNE, et 0,42 y laissait le sachet perdu
  // au milieu d'un écran vide : *un objet qu'on doit déchirer au doigt a besoin
  // d'être sous le doigt.* En paysage la hauteur commande de toute façon, donc
  // rien n'y bouge.
  return Math.min(largeurVisible * 0.6, (hauteurVisible * 0.68) / RAPPORT_SACHET)
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

/**
 * Le rang d'une teinte dans son echelle. `-1` pour ce qui n'en porte pas.
 *
 * **L'ECHELLE EST CELLE DU MODE**, et il le faut depuis que le mode emoji
 * compte cinq couleurs : *un nom de cran ne suffit pas a retrouver son rang*
 * — `legendaire` est le quatrieme metal et la cinquieme couleur, et les deux
 * tables se recouvrent sur trois noms.
 */
function rangDansLEchelle(rarete: string | undefined, echelle: readonly string[]): number {
  return echelle.indexOf(rarete ?? echelle[0]!)
}

/** La lueur d'une teinte, avec le premier cran pour repli. */
function lueurDans(rang: number, echelle: readonly string[]): string {
  const cran = echelle[Math.max(0, rang)] ?? echelle[0]!
  return AMBIANCE[cran] ?? AMBIANCE[echelle[0]!]!
}

export function Paquet3D(): React.ReactElement {
  const params = new URLSearchParams(location.search)
  /**
   * QUEL CATALOGUE — L'EMOJI PAR DÉFAUT, `&art` les peintures.
   *
   * Tranché par Keko : « on garde le projet emoji qui devient le principal ».
   * *Un mode principal s'ouvre sans paramètre* — c'est la règle qui a fait
   * tomber `?r3f` le jour où le moteur 3D a rattrapé le jeu.
   *
   * **`?paquet&emoji` continue de marcher**, et il le faut : *tous les liens
   * déjà donnés à Keko le portent*, et une adresse qu'on a distribuée ne doit
   * pas cesser de marcher le jour où elle devient inutile.
   */
  const peintures = params.has('art')
  const emojis = !peintures
  /**
   * `?paquet&emoji&peau` AJOUTE LES VARIANTES DE COULEUR DE PEAU.
   *
   * Keko : « il me semblait qu'on aurait plutot 3000+ emoji ». **Oui -- 3 963
   * au lieu de 1 923**, et les 2 040 de plus sont toutes des variantes de peau.
   * *Le banc se regarde a cote du catalogue plutot qu'a sa place*, parce que
   * c'est une decision de design : voir `--peau` dans le pipeline.
   */
  const peau = params.has('peau')
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
  /** Le sachet est parti : c'est ce qui met les cartes en rangée. */
  const [ouvert, setOuvert] = useState(nu)
  /** Il brûle : la tape est passée, et il n'y a plus à y revenir. */
  const [brule, setBrule] = useState(false)
  /**
   * OÙ EN SONT LES CARTES DANS LEUR SORTIE : 0 dedans, 1 nées au fond du
   * sachet, 2 montées hors de la fente.
   *
   * **C'est ce qui leur donne une PROVENANCE.** Elles apparaissaient en rangée
   * d'un seul coup, donc le sachet ne servait à rien : *on l'ouvrait, et les
   * cartes venaient d'ailleurs.* Elles naissent maintenant DERRIÈRE le corps
   * du sachet et montent par la fente — c'est l'amortissement de `Carte3D`
   * qui fait le trajet, il n'y a aucune animation à écrire.
   *
   * **Il lui faut trois crans et pas deux** : une carte naît à la position
   * qu'on lui donne, donc tant qu'on ne la change pas elle ne bouge pas. Le
   * premier cran la pose au fond, le second lui donne sa cible.
   */
  const [sortie, setSortie] = useState(nu ? 2 : 0)
  /**
   * QUELLE CARTE EST SOUS LES YEUX, et si le défilé est terminé.
   *
   * Keko : « je voudrais qu'on ait une ouverture de booster plus proche de
   * celle de lexicodex (une carte à la fois) ».
   *
   * ***CE QUE ÇA CHANGE N'EST PAS LA MISE EN PAGE, C'EST LE TEMPS.*** Cinq
   * cartes posées côte à côte se révèlent dans l'ordre qu'on veut, et aucune
   * n'a de moment à elle : on les retourne en les tapant, et la cinquième
   * arrive pendant qu'on regarde encore la troisième. **Une à la fois, chacune
   * a son instant** — et c'est tout ce qu'un paquet a à vendre.
   *
   * `montree` est l'index dans `paquet`, `fini` dit qu'on est passé au bilan.
   */
  const [montree, setMontree] = useState(0)
  const [fini, setFini] = useState(false)
  /** La clé du flash de l'arrachement — *une animation se remonte à neuf.* */
  const [flash, setFlash] = useState(0)
  const racine = useRef<HTMLDivElement>(null)
  const refChiffre = useRef<HTMLParagraphElement>(null)
  const image = useRef(0)

  useEffect(() => {
    let vivant = true
    const charger = emojis
      ? chargerEmojis(peau ? 'emoji-peau' : 'emoji')
      : chargerPeintures()
    void charger.then((cartes: CarteDuMode[]) => {
      if (!vivant) return
      if (cartes.length === 0) setErreur('Catalogue vide ou introuvable.')
      else setCatalogue(cartes)
    })
    return () => {
      vivant = false
    }
  }, [emojis, peau])

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

  /**
   * L'ECHELLE DE RARETE DU MODE — cinq couleurs pour les emoji, quatre metaux
   * pour les trois autres. Tranche par Keko : « le mode emoji seulement ».
   *
   * **ELLE SE WIDENISE EN `Echelle<string>`, et c'est le seul endroit du
   * projet ou il le faut** : le mode se decide a l'EXECUTION, sur un parametre
   * d'URL, donc le type du cran ne peut pas etre connu a la compilation. *Les
   * deux tables, elles, restent typees chacune sur ses propres crans* — c'est
   * la qu'une faute se verrait.
   */
  const echelle: Echelle<string> = emojis ? ECHELLE_CINQ : ECHELLE_QUATRE
  /** Les teintes du cadre, dans l'ordre : c'est elle que le reveal remonte. */
  const teintes: readonly string[] = emojis ? ECHELLE_COULEUR : ECHELLE_METAL

  // Le catalogue rangé par cran, une fois pour toutes : un écran qui ouvre dix
  // paquets ne doit pas reparcourir trois mille cartes dix fois.
  const tas = useMemo(
    () => (catalogue === null ? null : parCran(catalogue, echelle)),
    [catalogue, echelle],
  )

  /**
   * LE PAQUET COURANT. Seedé sur son numéro, donc **rejouable** : Keko peut
   * signaler un tirage précis, exactement comme `?seed=42` rejoue une descente.
   */
  const tirage = useMemo((): { cartes: CarteDuMode[]; bonus: Readonly<Record<string, Bonus>> } => {
    if (tas === null) return { cartes: [], bonus: {} }
    const rng = createRng((GRAINE + numero * 7919) >>> 0)
    const cartes = ouvrirPaquet(tas, rng, echelle)
    /**
     * LES BONUS SE TIRENT ICI, APRES LES CARTES ET AVEC LE MEME RNG.
     *
     * Tranche par Keko : « tires a l'ouverture » plutot que « propriete de la
     * carte ». ***Ca change ce qu'est un exemplaire*** : deux copies du meme
     * emoji peuvent differer, et c'est exactement ce qui fait l'interet d'en
     * ouvrir un de plus.
     *
     * **Ils ne concernent que le mode emoji**, parce que c'est la portee que
     * Keko a donnee a tout le changement. *Les autres modes n'appellent donc
     * pas le hasard*, et leur suite de tirage ne bouge pas d'un cran.
     */
    const bonus: Record<string, Bonus> = {}
    if (emojis) {
      for (const c of cartes) {
        bonus[c.id] = tirerBonus('animable' in c && c.animable, () => rng.next())
      }
    }
    return { cartes, bonus }
  }, [tas, numero, echelle, emojis])
  const paquet = tirage.cartes

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
    () => paquet.map((c) => carteAPeindreDuMode(c, tirage.bonus[c.id])),
    [paquet, tirage],
  )


  /** Le chiffre de la carte brute : celui dont la rarete DERIVE. */
  function compteurDe(id: string): { valeur: number; unite: string } {
    const brute = paquet.find((c) => c.id === id)
    return brute === undefined ? { valeur: 0, unite: '' } : compteurDuMode(brute, catalogue?.length ?? 0)
  }

  function rangDe(id: string): number {
    return rangDansLEchelle(aPeindre.find((c) => c.id === id)?.rarete, teintes)
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
    const cible = compteurDe(id).valeur
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
      racine.current?.style.setProperty('--lueur', lueurDans(rang, teintes))
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
    setEclat((e) => ({ cle: (e?.cle ?? 0) + 1, ton: lueurDans(rangDe(id), teintes) }))
    // LA DERNIERE SE REVELE AU COMPTEUR, les autres d'un coup : *ce qui
    // distingue un moment est qu'il ne se produit qu'une fois.*
    if (restantes.length === 1) monterLeCompteur(id)
    else setSommet((h) => Math.max(h, rangDe(id)))
  }

  /**
   * UN SEUL GESTE FAIT TOUT AVANCER : retourner, puis passer à la suivante.
   *
   * **C'est le geste de lexicodex, et c'est ce qui le rend lisible** : on ne
   * demande jamais au joueur de choisir entre deux actions, on lui demande de
   * continuer. *Une carte qu'on vient de retourner n'a qu'une suite possible.*
   *
   * **ET IL S'ARRÊTE AU BILAN**, où le bouton reprend la main : *un geste qui
   * continue de répondre quand il n'y a plus rien à avancer ne dit plus où
   * l'on en est.*
   */
  function avancer(): void {
    if (!ouvert || fini || paquet.length === 0) return
    const carte = paquet[montree]
    if (carte === undefined) return
    if (!revelees.has(carte.id)) {
      reveler(carte.id)
      return
    }
    if (montree + 1 < paquet.length) setMontree(montree + 1)
    else setFini(true)
  }

  function ouvrirUnAutre(): void {
    cancelAnimationFrame(image.current)
    setOuvert(nu)
    setBrule(false)
    setSortie(nu ? 2 : 0)
    setRevelees(new Set())
    setMontree(0)
    setFini(false)
    setSommet(-1)
    setEclat(null)
    setMonte(false)
    racine.current?.style.removeProperty('--lueur')
    racine.current?.style.removeProperty('--lueur-force')
    setNumero((n) => n + 1)
  }

  /**
   * LE GESTE DU DÉFILÉ — **une tape OU un balayage horizontal.**
   *
   * *Lexicodex ne connaît que le balayage* : vérifié à la main, une tape et un
   * double-tap n'y font rien. **On garde les deux**, et c'est une règle du
   * projet, pas un confort : « sur téléphone le glisser seul est fragile, la
   * tape doit toujours marcher — c'est elle qui porte la fonctionnalité. »
   *
   * **IL EST POSÉ UNE SEULE FOIS ET LIT L'ÉTAT PAR UNE RÉF.** `avancer` est
   * recréée à chaque rendu, donc un écouteur qui la capturerait travaillerait
   * sur un paquet périmé — *c'est le piège des écouteurs retirés par
   * référence*, déjà payé sur la main de combat, et la réf est la réponse que
   * le projet lui a donnée.
   *
   * **ET IL IGNORE CE QUI SUIT UN GESTE DE TROP PRÈS** : le retournement dure
   * deux tiers de seconde, donc deux balayages enchaînés sauteraient la carte
   * qu'on vient de retourner — *on ne révèle pas pour cacher aussitôt.*
   */
  const refAvancer = useRef<() => void>(() => undefined)
  refAvancer.current = avancer
  useEffect(() => {
    const arret = new AbortController()
    const { signal } = arret
    const depart = { x: 0, y: 0 }
    let dernier = 0
    addEventListener(
      'pointerdown',
      (e) => {
        depart.x = e.clientX
        depart.y = e.clientY
      },
      { signal },
    )
    addEventListener(
      'pointerup',
      (e) => {
        const dx = e.clientX - depart.x
        const dy = e.clientY - depart.y
        const tape = Math.hypot(dx, dy) < 12
        const balaye = Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)
        if (!tape && !balaye) return
        const t = performance.now()
        if (t - dernier < 400) return
        dernier = t
        refAvancer.current()
      },
      { signal },
    )
    return () => arret.abort()
  }, [])

  const hVisible = hauteurVisibleA(Z_MAIN, fenetre.h)
  const lVisible = hVisible * (fenetre.l / fenetre.h)
  const colonnes = colonnesDuBilan(lVisible, hVisible)
  const lignes = Math.ceil(CARTES_PAR_PAQUET / colonnes)
  const taille = tailleDeLaRangee(lVisible, hVisible, colonnes, lignes)
  const pas = taille * 1.12
  const y = hVisible * 0.06
  /**
   * LA PLACE D'UNE CARTE AU BILAN — **et chaque ligne se centre sur SON
   * compte.** La dernière en porte deux quand les autres en portent trois :
   * calées sur la grille, elles se seraient collées à gauche, et *un trou au
   * bout d'une rangée se lit comme une case qu'on a oublié de remplir.*
   */
  function placeAuBilan(i: number): [number, number, number] {
    const colonne = i % colonnes
    const ligne = Math.floor(i / colonnes)
    const surCetteLigne = Math.min(colonnes, CARTES_PAR_PAQUET - ligne * colonnes)
    const hauteurTotale = lignes * 1.4 + (lignes - 1) * 0.17
    return [
      (colonne - (surCetteLigne - 1) / 2) * pas,
      y + (hauteurTotale / 2 - 0.7 - ligne * 1.57) * taille,
      Z_MAIN,
    ]
  }
  /** La carte du défilé : seule au centre, et tant pis pour ses voisines. */
  const grande = tailleDuDefile(lVisible, hVisible)
  /**
   * OÙ VA UNE CARTE, selon qu'elle est passée, à l'écran, ou encore dessous.
   *
   * **Les suivantes restent EXACTEMENT derrière celle qu'on regarde**, à la
   * même taille : elles sont donc invisibles, et c'est voulu — *une pile qu'on
   * voit dépasser annonce ce qui vient*, alors que le défilé ne doit rien
   * annoncer du tout. Quand la carte de devant part à gauche, la suivante est
   * déjà là.
   *
   * **Et celles qu'on a vues sortent par la gauche**, assez loin pour quitter
   * le champ : *ce qui est passé n'a plus à être lu*, et le bilan les reprendra
   * toutes à la fin.
   */
  function placeAuDefile(i: number): [number, number, number] {
    if (i < montree) return [-lVisible * 1.1, y, Z_MAIN]
    return [0, y, Z_MAIN - (i - montree) * 0.02]
  }
  /** La largeur du sachet : c'est elle qui place la fente et borne ce qui en sort. */
  const lSachet = tailleDuSachet(lVisible, hVisible)
  const hSachet = lSachet * RAPPORT_SACHET
  /**
   * UNE CARTE QUI SORT D'UNE POCHETTE NE PEUT PAS ETRE PLUS GRANDE QU'ELLE.
   *
   * Les deux tailles se calculent sur la place et *la plus dure gagne* : sur
   * un ecran court c'est la HAUTEUR qui borne les deux, et la carte de rangee
   * y devient plus large que le sachet (0,44 de la hauteur visible contre
   * 0,36). Elle ne se lisait donc pas comme ce qu'on tire du paquet, mais
   * comme une carte posee derriere lui.
   *
   * Elle est bornee a une part du sachet le temps d'y etre, et elle enfle en
   * rejoignant la rangee : **`Carte3D` amortit sa taille**, donc il n'y a
   * aucune animation a ecrire -- le chemin deja pris par la piece qu'on
   * equipe a l'armurerie.
   */
  const tailleDedans = Math.min(taille, lSachet * 0.6)

  /**
   * LA DERNIERE CARTE, tant qu'elle n'est pas retournee. *Elle ne s'annonce
   * que s'il y en a eu d'autres avant* : sur un paquet d'une seule carte, « la
   * derniere » ne dirait rien.
   */
  const derniere =
    !fini && paquet.length > 1 && montree === paquet.length - 1 ? (paquet[montree] ?? null) : null

  /**
   * L'UNITE DU COMPTEUR est une propriete du MODE, pas d'une carte : on la lit
   * sur la premiere du paquet, qui existe toujours. *`derniere` retombe a
   * `null` des qu'elle est revelee* — c'est `monte` qui tient l'affichage
   * ensuite — donc la lire sur elle la ferait disparaitre en pleine montee.
   */
  const unite = paquet.length > 0 ? compteurDuMode(paquet[0]!, catalogue?.length ?? 0).unite : ''

  return (
    <div
      className="paquet-3d"
      ref={racine}
      style={
        {
          '--lueur': lueurDans(sommet, teintes),
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
      {/*
        LE FLASH DE L'ARRACHEMENT : un blanc plein écran, très court. *C'est
        ce qui fait que la bande ne se « détache » pas, elle s'ARRACHE* — un
        geste qui coûte quelque chose aveugle une image. Il est monté à neuf
        par sa clé, pour la raison habituelle : une classe qu'on retire et
        qu'on repose ne redémarre pas sans un reflow forcé.
      */}
      {flash > 0 && <div key={`fl${flash}`} className="paquet-flash" />}
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
            taille={lSachet}
            position={[0, 0, Z_MAIN]}
            ouvre={brule}
            onOuvrir={() => setBrule(true)}
            onDechire={() => {
              // L'ARRACHEMENT : le flash, puis les cartes naissent au fond du
              // sachet. *Ce qui sort doit être là avant de sortir* — une image
              // les pose, la suivante leur donne leur cible, et
              // l'amortissement fait le trajet.
              setFlash((f) => f + 1)
              setSortie(1)
              setTimeout(() => setSortie(2), 40)
            }}
            onOuvert={() => setOuvert(true)}
          />
        )}

        {sortie > 0 &&
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
              // LE FLIP AU DÉFILÉ, LE DÉVELOPPEMENT AU BILAN. Keko : « j'aime
              // pas trop l'animation de révélation de carte, un simple flip
              // serait mieux ». *La culbute est une mise en scène
              // d'équipement* — elle monte, grossit et fait deux tours — là où
              // retourner une carte est un geste et rien de plus. Elle reste
              // joignable par `?culbute`, qui était déjà son banc.
              culbute={culbuter ? (jetons[carte.id] ?? 0) : undefined}
              flip={!culbuter && !fini ? (jetons[carte.id] ?? 0) : undefined}
              developpe={culbuter || !fini ? undefined : (jetons[carte.id] ?? 0)}
              // ELLE SORT DU SACHET AVANT DE REJOINDRE SA PLACE. *Derrière le
              // corps en z*, donc on la voit émerger par la fente plutôt
              // qu'apparaître devant la pochette — et les cinq sont
              // superposées, ce qui est exactement ce qu'elles sont : une
              // pile qu'on tire.
              position={
                !ouvert
                  ? [0, hSachet * (sortie > 1 ? 0.3 : -0.12), Z_MAIN - 0.06]
                  : fini
                    ? placeAuBilan(i)
                    : placeAuDefile(i)
              }
              taille={!ouvert ? tailleDedans : fini ? taille : grande}
              // ELLE RÉPOND AU CURSEUR une fois révélée, et pas avant : *un dos
              // n'a rien à montrer*, donc rien à faire briller.
              reflet={vue}
              ombre
              // ELLE NE PORTE PLUS DE GESTE À ELLE. *Tout passe par le geste
              // de l'écran* — une tape sur la carte et une tape à côté font la
              // même chose, parce qu'il n'y a qu'une suite possible. Ça retire
              // au passage le cas que l'ancienne version devait écarter : les
              // cinq superposées dans le sachet, dont une tape en retournait
              // une au hasard.
              inerte
            />
          )
        })}

        {/*
          LE BOUTON N'EXISTE QU'AU BILAN. Pendant le défilé il n'y a rien à
          décider — *on continue, c'est tout* — et un bouton posé là
          disputerait le geste à la carte. « Tout révéler » est parti avec :
          il répondait à cinq dos posés côte à côte, et il n'y en a plus.
        */}
        {ouvert && fini && paquet.length > 0 && (
          <Bouton3D
            texte="Ouvrir un autre paquet"
            ton="or"
            cran="ecran"
            position={[0, -hVisible * 0.38, Z_MAIN]}
            onCliquer={ouvrirUnAutre}
          />
        )}
      </Canvas>

      {ouvert && !fini && (derniere !== null || monte) && (
        <div className="paquet-dernier">
          <p className="paquet-dernier__mot">Dernière carte</p>
          {monte && (
            <>
              <p className="paquet-compteur" ref={refChiffre}>
                0
              </p>
              <p className="paquet-compteur__unite">{unite}</p>
            </>
          )}
        </div>
      )}

      {catalogue === null && erreur === null && <p className="paquet-mot">Ouverture du paquet…</p>}
      {erreur !== null && <p className="paquet-mot">{erreur}</p>}
    </div>
  )
}

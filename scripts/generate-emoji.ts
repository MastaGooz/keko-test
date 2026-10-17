/**
 * LE CATALOGUE DES EMOJI — `npm run emoji`.
 *
 * Demande par Keko : « on utilise des emoji : noto color emoji et noto animated
 * emoji ». **Une carte est un emoji**, et tout vient de deux sources
 * canoniques :
 *
 * - **Unicode** (`emoji-test.txt`) : le caractere, son groupe et sa VERSION
 *   d'introduction -- un seul fichier de 621 Ko ;
 * - **CLDR** : son nom francais et ses mots-cles, en deux fichiers (les
 *   drapeaux vivent dans `annotationsDerived`, pas dans `annotations`).
 *
 * Plus un test par emoji sur le CDN de Google, pour savoir lesquels ont une
 * version ANIMEE.
 *
 * **L'USER-AGENT NE PORTE PAS D'ADRESSE ICI.** Celui de `outils.ts` en a une
 * parce que la politique de Wikimedia demande un contact ; *Unicode, GitHub et
 * gstatic ne le demandent pas*, et on n'envoie pas l'adresse de quelqu'un a un
 * service qui ne l'a pas reclamee.
 */
import { writeFileSync, mkdirSync } from 'node:fs'
import process from 'node:process'
import { cache, journal, option } from './outils.ts'
import { cransParGroupe, PYRAMIDE_CINQ } from '../src/logic/quantiles.ts'
import {
  GROUPES_EMOJI,
  RARETES_EMOJI,
  type CarteEmoji,
  type GroupeEmoji,
  type RareteEmoji,
} from '../src/logic/emoji/types.ts'

const UA_NEUTRE = 'keko-test/0.1 (jeu de cartes, usage personnel)'
const UNICODE = 'https://unicode.org/Public/emoji/latest/emoji-test.txt'
const CLDR = 'https://raw.githubusercontent.com/unicode-org/cldr-json/main/cldr-json'
const ANIME = 'https://fonts.gstatic.com/s/e/notoemoji/latest'
const FREQUENCE = 'https://home.unicode.org/emoji/emoji-frequency/'
const SORTIE = new URL('../public/data/', import.meta.url)

/**
 * LES VARIANTES DE COULEUR DE PEAU — ecartees par defaut, `--peau` les garde.
 *
 * Keko : « il me semblait qu'on aurait plutot 3000+ emoji c'est bizarre, tu as
 * peut-etre pas inclus les variations de couleurs ? » **Oui**, et le compte est
 * net : 3 963 emoji au total, dont **2 040 variantes**, toutes dans « People &
 * Body ».
 *
 * *Ce n'est pas cinq variantes partout* : 292 bases en ont cinq, onze en ont
 * **vingt-cinq** (deux personnes, donc 5 x 5), et ***deux bases en ont CENT a
 * elles seules*** -- « deux personnes se tenant la main » decline ses deux
 * silhouettes sur tous les tons.
 *
 * **Et le classement d'Unicode les regroupe explicitement** en un item
 * representatif : une variante n'a donc pas de rang a elle, elle herite de
 * celui de sa base -- voir `baseSansPeau`. *Les cent « personnes se tenant la
 * main » sortent donc toutes au meme cran, avec le meme dessin a deux tons
 * pres.*
 */
const PEAU = /[\u{1F3FB}-\u{1F3FF}]/u
const avecPeau = process.argv.includes('--peau')

/**
 * L'EMOJI SANS SES TONS DE PEAU — sa base au classement de frequence.
 *
 * *Unicode range les variantes sous un item representatif*, donc une variante
 * n'a jamais de rang a elle. **Sans cet heritage, les 2 040 tomberaient toutes
 * dans les non classees**, c'est-a-dire tout en bas du catalogue -- et un
 * « pouce leve : peau mate » vaudrait moins qu'un drapeau obscur.
 */
function baseSansPeau(emoji: string): string {
  return emoji.replace(/[\u{1F3FB}-\u{1F3FF}]/gu, '')
}

/**
 * LE GROUPE UNICODE VERS LE NOTRE. `Component` n'a pas d'entree : *ses membres
 * ne sont pas des emoji, ce sont des morceaux de sequence* (une couleur de
 * peau, un cheveu roux), et ils n'ont rien a faire sur une carte.
 */
const GROUPE: Readonly<Record<string, GroupeEmoji>> = {
  'Smileys & Emotion': 'visages',
  'People & Body': 'gens',
  'Animals & Nature': 'animaux',
  'Food & Drink': 'nourriture',
  'Travel & Places': 'lieux',
  Activities: 'activites',
  Objects: 'objets',
  Symbols: 'symboles',
  Flags: 'drapeaux',
}

/**
 * LES SOUS-GROUPES QUI QUITTENT LEUR GROUPE. Keko : « contrôle la catégorie
 * visage : enlève les coeurs par ex, et toutes les choses qui ne sont pas des
 * visages (fais une catégorie spéciale coeur) ». Unicode range dans « Smileys &
 * Emotion » seize sous-groupes (`# subgroup:`) : les onze `face-*` de
 * smileys, et cinq qui n'en sont pas. **`heart`** (les 25 coeurs, et la
 * lettre d'amour) a son groupe ; **`emotion`** (💋 💯 💢 💥 💫 💦 💨 🕳️ 💬 💭
 * 💤…, des signes) rejoint les symboles. Puis Keko : « on devrait virer les
 * chats, monstres, crâne, ogre etc : on va faire une catégorie monstre et une
 * catégorie animaux » — **`cat-face`** et **`monkey-face`** rejoignent les
 * animaux, **`face-costume`** (💀 ☠️ 💩 👻 👽 👾 👹 👺 🤡 🤖) devient le
 * groupe « Monstre ». Puis « People & Body » : « on va enlever les mains de la
 * catégorie gens pour faire une catégorie main, et on va aussi faire une
 * catégorie corps où on met jambes, biceps, organes, bouche » — les six
 * sous-groupes **`hand*`** (doigts ouverts, pliés, un doigt, poings, deux
 * mains, main avec objet : ✍️ 💅 🤳) font « Main », **`body-parts`** (💪 🦵
 * 🦶 👂 👃 🧠 🫀 🫁 🦷 🦴 👀 👁️ 👅 👄 🫦…) fait « Corps ». Puis « Animals &
 * Nature » : « on va enlever les plantes/arbres des animaux et créer une
 * catégorie nature » — **`plant-flower`** et **`plant-other`** (fleurs,
 * arbres, feuilles, champignon, nids) font « Nature ». Puis « Travel &
 * Places » : « on va ajouter une catégorie ciel où on va mettre les éléments
 * actuellement dans lieu qui relèvent du ciel, espace, météo etc » —
 * **`sky & weather`** (lunes, soleil, étoiles, planète, nuages, pluie, neige,
 * arc-en-ciel, éclair, comète, feu, goutte, vague) fait ce groupe — « Ciel »
 * d'abord, **renommé « Éléments »** par Keko —, l'espace y va par identifiant
 * (🚀 🛸 🛰️, rangés par Unicode dans `transport-air`), et les parapluies et
 * bonshommes de neige en sortent (voir `PAR_ID`). *Le sous-groupe l'emporte
 * sur le groupe* ; tout autre sous-groupe suit son groupe.
 */
const SOUS_GROUPE: Readonly<Record<string, GroupeEmoji>> = {
  heart: 'coeurs',
  emotion: 'symboles',
  'cat-face': 'animaux',
  'monkey-face': 'animaux',
  'face-costume': 'creatures',
  'hand-fingers-open': 'mains',
  'hand-fingers-partial': 'mains',
  'hand-single-finger': 'mains',
  'hand-fingers-closed': 'mains',
  hands: 'mains',
  'hand-prop': 'mains',
  'body-parts': 'corps',
  'plant-flower': 'nature',
  'plant-other': 'nature',
  'sky & weather': 'elements',
  // « Véhicule » (Keko : « satellite, soucoupe volante et fusée devraient
  // passer d'éléments à la catégorie véhicules, on va y ajouter aussi tous les
  // véhicules dans lieu ») : les trois transports, 🚀 🛸 🛰️ compris ; ce qui
  // n'y est pas un véhicule reste un lieu (voir `PAR_ID`).
  'transport-ground': 'vehicules',
  'transport-water': 'vehicules',
  'transport-air': 'vehicules',
  // « Temps » (Keko : « créer une catégorie temps où on va mettre toutes les
  // horloges, sablier etc ») : le sous-groupe `time` tel quel — sablier,
  // montre, réveils, pendule et les vingt-quatre cadrans.
  time: 'temps',
  // « ACTIVITÉ » NE GARDE QUE CE QUI MONTRE UNE ACTIVITÉ SANS OBJET (Keko : « je
  // trouve la distinction objets / activité mauvaise : objet devrait avoir
  // tous les objets et activité uniquement les images qui renvoient à une
  // activité sans renvoyer à un objet qu'on peut toucher ») : les cinq
  // sous-groupes d'Unicode sont faits d'objets — ballons, médailles, cadeaux,
  // dés, pelotes — et vont aux objets ; ce qui montre une activité remonte par
  // identifiant (voir `PAR_ID` : feux d'artifice, fête, cérémonie de la lune).
  event: 'objets',
  'award-medal': 'objets',
  sport: 'objets',
  game: 'objets',
  'arts & crafts': 'objets',
}

/**
 * ET DEUX CARTES NOMMÉES : 💀 le crâne et ☠️ la tête de mort, qu'Unicode range
 * dans `face-negative` avec les visages en colère — Keko les veut chez les
 * monstres (« crâne, ogre etc »). *Par identifiant, pas par nom* : le nom est
 * du texte affiché. L'identifiant l'emporte sur le sous-groupe.
 */
const PAR_ID: Readonly<Record<string, GroupeEmoji>> = {
  // LE CLOWN RESTE UN SMILEY (Keko : « on va y remettre le clown ») : Unicode
  // le range dans `face-costume` avec les monstres, c'est un visage maquillé.
  '1f921': 'visages', // 🤡
  '1f480': 'creatures',
  '2620-fe0f': 'creatures',
  // CE QUI RESTE UNE ACTIVITÉ chez les anciennes « Activities » d'Unicode : des
  // scènes, pas des choses qu'on tient — le feu d'artifice et le cierge qui
  // brûle, la fête (cotillons, confettis), la cérémonie de la lune. Le vernis,
  // le selfie, le camping, les manèges et les bonshommes de neige y sont déjà
  // par identifiant plus bas. 🎭 les masques et 🎯 la cible sont des objets
  // malgré leur nom (« spectacle vivant », « dans le mille ») — à rejuger.
  '1f386': 'activites', // 🎆
  '1f387': 'activites', // 🎇
  '1f389': 'activites', // 🎉
  '1f38a': 'activites', // 🎊
  '1f391': 'activites', // 🎑
  // LES ENSEIGNES DE CARTES SONT DES SIGNES, ♥️ compris (Keko : « le cœur
  // carte ne devrait pas être en symbole avec pique, trèfle et carreau ? »).
  '2660-fe0f': 'symboles', // ♠️
  '2663-fe0f': 'symboles', // ♣️
  '2666-fe0f': 'symboles', // ♦️
  // « MONSTRE » DEVIENT « CRÉATURE » (Keko : « on remplace monstre par créature
  // et on y met : créature velue, troll, zombie, génie, fée, sirène, vampire,
  // triton et toutes les créatures fictives ») : les créatures de
  // `person-fantasy` — leurs versions homme et femme suivent, la table se lit
  // sans signe de genre — et la licorne et les dragons des animaux. Le père
  // Noël, les super-héros et les mages restent des gens : des humains.
  '1fac8': 'creatures', // 🫈
  '1f9cc': 'creatures', // 🧌
  '1f9df': 'creatures', // 🧟
  '1f9de': 'creatures', // 🧞
  '1f9da': 'creatures', // 🧚
  '1f9dc': 'creatures', // 🧜
  '1f9db': 'creatures', // 🧛
  '1f9dd': 'creatures', // 🧝
  '1f984': 'creatures', // 🦄
  '1f409': 'creatures', // 🐉
  '1f432': 'creatures', // 🐲
  // 💅 le vernis et 🤳 le selfie (`hand-prop`) : des activités, pas des mains
  // (Keko : « passe le vernis et selfie dans activité plutôt »). ✍️ reste.
  '1f485': 'activites',
  '1f933': 'activites',
  // ♥️ le coeur des cartes à jouer (`game`) : un coeur avant d'être un jeu
  // (Keko : « passe le coeur carte dans coeur au lieu de activité »).
  '2665-fe0f': 'symboles',
  // DANS LES TROIS `transport-*`, CE QUI N'EST PAS UN VÉHICULE : les lieux
  // restent des lieux (la gare, l'arrêt, la route et la voie, le phare) ; ce
  // qui sert aux véhicules va avec eux (Keko : « passer roue, parachute, feu
  // tricolore etc dans véhicule ») ; ce qu'on porte est un objet. Les
  // fauteuils roulants, le skate et les rollers roulent.
  '1f689': 'lieux', // 🚉
  '1f68f': 'lieux', // 🚏
  '1f6e3-fe0f': 'lieux', // 🛣️
  '1f6e4-fe0f': 'lieux', // 🛤️
  '1f6d9': 'lieux', // 🛙
  '26fd': 'vehicules', // ⛽
  '1f6de': 'vehicules', // 🛞
  '1f6a8': 'vehicules', // 🚨
  '1f6a5': 'vehicules', // 🚥
  '1f6a6': 'vehicules', // 🚦
  '1f6d1': 'vehicules', // 🛑
  '1f6a7': 'vehicules', // 🚧
  '2693': 'vehicules', // ⚓
  '1f6df': 'vehicules', // 🛟
  '1fa82': 'vehicules', // 🪂
  // LES OBJETS RANGÉS PAR UNICODE DANS « Travel & Places » (Keko : « passer
  // les objets qui sont dans lieux dans objet : toboggan, bagage, boussole,
  // siège, baril... ») : et avec eux la cloche de comptoir, la brique, le
  // bois, les deux cartes.
  '1f4ba': 'objets', // 💺
  '1f6e2-fe0f': 'objets', // 🛢️
  '1f6dd': 'objets', // 🛝
  '1f9f3': 'objets', // 🧳
  '1f9ed': 'objets', // 🧭
  '1f6ce-fe0f': 'objets', // 🛎️
  '1f9f1': 'objets', // 🧱
  '1fab5': 'objets', // 🪵
  '1f5fa-fe0f': 'objets', // 🗺️
  '1f5fe': 'objets', // 🗾
  '26fa': 'objets', // ⛺ (Keko : « pas tente : on le place dans objet »)
  // LES ACTIVITÉS RANGÉES DANS LES LIEUX (Keko : « on passe aussi les
  // activités de lieu dans activité : grande roue, montagnes russes, manège,
  // camping... ») : la fête foraine, le camping, le cirque.
  '1f3a1': 'activites', // 🎡
  '1f3a2': 'activites', // 🎢
  '1f3a0': 'activites', // 🎠
  '1f3d5-fe0f': 'activites', // 🏕️ (🎪 le chapiteau, essayé ici, reste un lieu : Keko)
  // 🌐 le globe à méridiens est un signe, pas un endroit (Keko : « globe avec
  // méridien > symbole ») ; les trois globes terrestres restent des lieux.
  '1f310': 'symboles',
  // Keko : « étincelles dans éléments ; éphéméride et calendrier dans temps ;
  // alarme désactivée dans symboles, pareil pour muet, courbe yen en hausse,
  // chaîne brisée ».
  '2728': 'elements', // ✨
  '1f4c5': 'temps', // 📅
  '1f4c6': 'temps', // 📆
  '1f5d3-fe0f': 'temps', // 🗓️ (le calendrier à spirale suit les deux autres)
  '1f515': 'symboles', // 🔕
  '1f507': 'symboles', // 🔇
  '1f4b9': 'symboles', // 💹
  '26d3-fe0f-200d-1f4a5': 'symboles', // ⛓️‍💥
  // LES PICTOGRAMMES D'INTERFACE RANGÉS PAR UNICODE DANS « Objects » (Keko :
  // « les notes de musique/partition, volume enceinte, enveloppe avec flèche,
  // graphe en hausse/baisse, graphique à barres, chaînes, message reçu, boîte
  // de réception, curseurs, boutons, dossier etc > symbole »). Restent des
  // objets ce qui existe en vrai : les boîtes aux lettres, l'enveloppe, le
  // haut-parleur, la cloche, les meubles.
  '1f3b5': 'symboles', // 🎵
  '1f3b6': 'symboles', // 🎶
  '1f3bc': 'symboles', // 🎼
  '1f508': 'symboles', // 🔈
  '1f509': 'symboles', // 🔉
  '1f50a': 'symboles', // 🔊
  '1f4e9': 'symboles', // 📩
  '1f4e8': 'symboles', // 📨
  '1f4e5': 'symboles', // 📥
  '1f4e4': 'symboles', // 📤 (la boîte d'envoi suit la boîte de réception)
  '1f4c8': 'symboles', // 📈
  '1f4c9': 'symboles', // 📉
  '1f4ca': 'symboles', // 📊
  '26d3-fe0f': 'symboles', // ⛓️
  '1f39a-fe0f': 'symboles', // 🎚️
  '1f39b-fe0f': 'symboles', // 🎛️
  '1f4c1': 'symboles', // 📁
  '1f4c2': 'symboles', // 📂
  '1f5c2-fe0f': 'symboles', // 🗂️ (les intercalaires suivent les dossiers)
  // Keko : « email, chaînons, page, page enroulée, ascenseur, main de Fatma >
  // symbole. Bulle > éléments » (🫧 les bulles de savon ; celles de parole y
  // étaient déjà).
  '1f4e7': 'symboles', // 📧
  '1f517': 'symboles', // 🔗
  '1f4c4': 'symboles', // 📄
  '1f4c3': 'symboles', // 📃
  '1f6d7': 'symboles', // 🛗
  '1faac': 'symboles', // 🪬
  '1fae7': 'elements', // 🫧
  // Keko : « trace de pas, empreinte digitale > symbole », puis « bascule
  // empreintes d'animaux dans symbole ».
  '1f463': 'symboles', // 👣
  '1fac6': 'symboles', // 🫆
  '1f43e': 'symboles', // 🐾
  // Keko : « passe aussi source chaude en symbole » — Unicode la range dans
  // `place-other`, c'est un signe de carte, pas un lieu.
  '2668-fe0f': 'symboles', // ♨️
  // LES SILHOUETTES BLEUES (Keko : « la famille de silhouettes bleues de gens
  // dans symboles ») : 👤 👥 🗣️ 🫂 — des pictogrammes, pas des personnes. La
  // série « famille : … » suit par motif, voir `FAMILLE`. 👪 la famille
  // dessinée reste chez les gens, Keko ne l'a pas nommée — à rejuger.
  '1f464': 'symboles', // 👤
  '1f465': 'symboles', // 👥
  '1f5e3-fe0f': 'symboles', // 🗣️
  '1fac2': 'symboles', // 🫂
  // LE PAYSAGE NATUREL QUITTE LES LIEUX (Keko : « roche, éboulement, montagne
  // enneigée, nuit étoilée, soleil levant, volcan, soleil etc > direction
  // éléments ») : la roche et l'éboulement, les montagnes, le volcan, le
  // désert et l'île, le ciel du soir et du matin, le brouillard. Restent des
  // lieux ce qui est aménagé : plage, camping, parc, ville, pont, fontaine.
  '1faa8': 'elements', // 🪨
  '1f6d8': 'elements', // 🛘
  '1f3d4-fe0f': 'elements', // 🏔️
  '26f0-fe0f': 'elements', // ⛰️
  '1f5fb': 'elements', // 🗻
  '1f30b': 'elements', // 🌋
  '1f3dc-fe0f': 'elements', // 🏜️
  '1f3dd-fe0f': 'elements', // 🏝️
  '1f303': 'elements', // 🌃
  '1f304': 'elements', // 🌄
  '1f305': 'elements', // 🌅
  '1f307': 'elements', // 🌇
  '1f301': 'elements', // 🌁
  // CE QUI N'EST PAS UN ÉLÉMENT dans `sky & weather` (Keko : « bonshommes de
  // neige et parapluies ne devraient pas être dans ciel, plutôt objet pour
  // parapluie et activité pour bonhomme de neige, mets aussi le parasol dans
  // activité ») : 🌂 ☂️ ☔ chez les objets ; ☃️ ⛄ ⛱️ chez les activités.
  '1f302': 'objets',
  '2602-fe0f': 'objets',
  '2614': 'objets',
  '2603-fe0f': 'activites',
  '26c4': 'activites',
  '26f1-fe0f': 'objets',
}

/**
 * L'ANNEE DE CHAQUE VERSION D'EMOJI.
 *
 * *C'est elle qui porte la notoriete*, faute de mieux : voir `notoriete`. Les
 * numeros de version ne sont PAS une suite reguliere -- E0.6, E0.7, puis E1.0 a
 * E5.0, puis un saut a E11.0 -- donc une table vaut mieux qu'un calcul.
 */
const ANNEE_DE_VERSION: Readonly<Record<string, number>> = {
  '0.6': 2010,
  '0.7': 2010,
  '1.0': 2015,
  '2.0': 2015,
  '3.0': 2016,
  '4.0': 2016,
  '5.0': 2017,
  '11.0': 2018,
  '12.0': 2019,
  '12.1': 2019,
  '13.0': 2020,
  '13.1': 2021,
  '14.0': 2021,
  '15.0': 2022,
  '15.1': 2023,
  '16.0': 2024,
  '17.0': 2025,
  '18.0': 2026,
}

interface Brut {
  id: string
  emoji: string
  nomEn: string
  groupe: GroupeEmoji
  version: string
  /** Le rang dans le fichier Unicode : il sert de DEPARTAGE, voir `notoriete`. */
  rang: number
}

async function texte(cle: string, url: string): Promise<string> {
  return cache(`emoji-${cle}`, url, async () => {
    const r = await fetch(url, {
      headers: { 'User-Agent': UA_NEUTRE },
      signal: AbortSignal.timeout(60_000),
    })
    if (!r.ok) throw new Error(`${url} : HTTP ${r.status}`)
    const t = await r.text()
    journal(`  ${cle} : ${(t.length / 1024).toFixed(0)} Ko`)
    return t
  })
}

/**
 * LA SÉRIE « FAMILLE : … » EST UN SYMBOLE (Keko : « on peut passer la série
 * famille : en symbole ») : les vingt-cinq 👨‍👩‍👧 et les quatre silhouettes
 * 🧑‍🧑‍🧒 d'Unicode 15.1 — des suites d'homme, femme, fille, garçon, adulte,
 * enfant jointes par ZWJ, rien d'autre. *Par motif plutôt que par vingt-neuf
 * identifiants* : les couples (❤️, 💋) et les gens qui se tiennent la main (🤝)
 * portent un autre caractère et ne passent pas. Le sous-groupe `family`
 * d'Unicode les contient aussi, c'est pourquoi on ne le prend pas en bloc.
 */
const FAMILLE = /^(1f46[6-9]|1f9d[12])(-200d-(1f46[6-9]|1f9d[12]))+$/

/** La liste canonique, variantes de peau et composants ecartes. */
function lireUnicode(txt: string): Brut[] {
  const out: Brut[] = []
  let groupe = ''
  let sousGroupe = ''
  for (const ligne of txt.split('\n')) {
    if (ligne.startsWith('# group:')) {
      groupe = ligne.slice(9).trim()
      sousGroupe = ''
      continue
    }
    if (ligne.startsWith('# subgroup:')) {
      sousGroupe = ligne.slice(12).trim()
      continue
    }
    if (!ligne.includes('; fully-qualified')) continue
    const m = /^([0-9A-F ]+);\s*fully-qualified\s*#\s*(\S+)\s+E(\d+\.\d+)\s+(.+)$/.exec(ligne.trim())
    if (!m) continue
    const id = m[1]!.trim().toLowerCase().replace(/ +/g, '-')
    // UNE VARIANTE SUIT SA BASE : la table nomme 💅, ses cinq tons la suivent ;
    // elle nomme 🧛, le vampire homme et la vampire femme (♂ ♀ en ZWJ) aussi.
    const base = id.replace(/-1f3f[b-f]/g, '').replace(/-200d-264[02]-fe0f$/, '')
    const g = PAR_ID[base] ?? (FAMILLE.test(base) ? 'symboles' : undefined) ?? SOUS_GROUPE[sousGroupe] ?? GROUPE[groupe]
    if (g === undefined) continue
    const emoji = m[2]!
    if (!avecPeau && PEAU.test(emoji)) continue
    out.push({
      id,
      emoji,
      nomEn: m[4]!.trim(),
      groupe: g,
      version: m[3]!,
      rang: out.length,
    })
  }
  return out
}

/**
 * LES NOMS FRANCAIS, et il faut les DEUX fichiers CLDR.
 *
 * *Les drapeaux et les sequences derivees vivent dans `annotationsDerived`* --
 * mesure : `annotations` en porte 1 966 et ignore le drapeau francais. **Et la
 * cle peut etre ecrite sans le selecteur de variante** : le coeur rouge y
 * figure sans lui, donc on essaie les deux formes.
 */
async function nomsFrancais(): Promise<Map<string, { nom: string; mots: string[] }>> {
  const out = new Map<string, { nom: string; mots: string[] }>()
  const fichiers = [
    ['cldr', 'cldr-annotations-full/annotations/fr/annotations.json'],
    ['cldr-derive', 'cldr-annotations-derived-full/annotationsDerived/fr/annotations.json'],
  ] as const
  for (const [cle, chemin] of fichiers) {
    const brut = JSON.parse(await texte(cle, `${CLDR}/${chemin}`)) as {
      annotations?: { annotations?: Record<string, { tts?: string[]; default?: string[] }> }
      annotationsDerived?: { annotations?: Record<string, { tts?: string[]; default?: string[] }> }
    }
    const a = brut.annotationsDerived?.annotations ?? brut.annotations?.annotations ?? {}
    for (const [k, v] of Object.entries(a)) {
      const nom = v.tts?.[0]
      if (nom === undefined) continue
      // *Le second fichier ne doit pas effacer le premier* : `annotations`
      // porte les noms de base, `annotationsDerived` ce qui en decoule.
      if (!out.has(k)) out.set(k, { nom, mots: v.default ?? [] })
    }
  }
  return out
}

/**
 * LE CLASSEMENT DE FREQUENCE D'UNICODE — la vraie popularite, enfin.
 *
 * Demande par Keko : « je voudrais que la rarete soit lie a la popularite
 * reelle de l'emoji. Y'a des stats qu'on peut choper quelque part sur ca ? »
 * **Oui, et j'avais conclu trop vite le contraire** : `emoji-frequency.txt`
 * rend 404, donc j'avais ecrit qu'aucun fichier n'existait -- *le classement
 * est dans la PAGE*, et il est complet.
 *
 * ***Une ressource absente a l'adresse ou on l'attend n'est pas une ressource
 * absente.***
 *
 * Sa forme est exactement celle qu'il faut : **dix-huit groupes, chacun valant
 * la MOITIE du precedent en frequence d'usage.** Le groupe 0 ne contient que
 * deux emoji, le 11 et au-dela sont sous la mediane. *C'est une echelle
 * logarithmique de popularite reelle* -- et les emoji sont ranges par
 * frequence decroissante DANS chaque groupe, ce qui donne un ordre total.
 *
 * **Il est arrete a Unicode 12.0**, donc il couvre 76 % du catalogue (1 466 sur
 * 1 923) et **les 24 % restants sont les emoji RECENTS** -- ceux de 2016 et
 * apres. *C'est la bonne forme du trou* : ce qui manque est ce qui est le moins
 * employe, donc il va en bas, et l'anciennete suffit a l'y departager.
 *
 * **Si la page disparait, le repli est l'anciennete** : voir `notoriete`. La
 * page est archivee par Unicode, donc elle ne bougera plus -- *mais une page
 * archivee est une page qu'on peut retirer.*
 */
async function classement(): Promise<Map<string, { groupe: number; dans: number }>> {
  const out = new Map<string, { groupe: number; dans: number }>()
  let html: string
  try {
    html = await texte('frequence', FREQUENCE)
  } catch {
    journal('  classement de frequence INDISPONIBLE -- repli sur l anciennete')
    return out
  }
  const debut = html.indexOf('<table')
  const fin = html.indexOf('</table>')
  if (debut < 0 || fin < 0) {
    journal('  classement : tableau introuvable -- repli sur l anciennete')
    return out
  }
  const table = html.slice(debut, fin)
  for (const [groupe, ligne] of [...table.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)].entries()) {
    const cellules = [...ligne[1]!.matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/g)].map((x) =>
      x[1]!.replace(/<[^>]*>/g, '').trim(),
    )
    // La premiere cellule porte le numero du groupe, la seconde les emoji.
    const items = [...(cellules[1] ?? '').matchAll(/\S+/gu)].map((m) => m[0])
    items.forEach((e, dans) => {
      if (!out.has(e)) out.set(e, { groupe, dans })
    })
  }
  journal(`  classement : ${out.size} emoji ranges par frequence reelle`)
  return out
}

/**
 * L'URL DU CDN SEPARE LES POINTS DE CODE PAR DES UNDERSCORES, pas par des
 * tirets.
 *
 * ***Le format d'un identifiant n'est pas celui d'une URL***, et ca a coute un
 * catalogue entier : l'id de la carte est en tirets -- c'est notre convention,
 * lisible -- donc **tout emoji a plusieurs points de code etait declare non
 * anime**. Le coeur rouge (`2764 fe0f`) sortait statique alors qu'il est le
 * deuxieme emoji le plus employe au monde, et *rien ne le signalait* : une URL
 * fausse rend 404, et un 404 se lit ici comme « pas de version animee ».
 */
function urlAnimee(id: string): string {
  return `${ANIME}/${id.replace(/-/g, '_')}/lottie.json`
}

/**
 * QUELS EMOJI GOOGLE A ANIMES — un test par emoji, dix de front.
 *
 * Mesure sur un echantillon : **34 % du catalogue**, soit bien plus que la
 * « centaine » annoncee partout -- *il fallait le compter plutot que le croire.*
 *
 * **On met en cache la REPONSE, pas la requete** : c'est un `HEAD`, donc il n'y
 * a rien a garder qu'une liste d'identifiants.
 */
async function animes(ids: readonly string[]): Promise<Set<string>> {
  // **LE CORPS DU CACHE PORTE LES URLS, pas les identifiants.** *Un cache doit
  // dependre de ce qu'on demande* : avec les seuls ids, corriger le format de
  // l'URL n'aurait rien reteste et l'ancien resultat serait resservi -- c'est
  // exactement le piege qui a failli masquer le defaut des underscores.
  const demande = ids.map(urlAnimee).join(' ')
  const brut = await cache(`emoji-animes-${ids.length}`, demande, async () => {
    journal(`Versions animees : ${ids.length} tests`)
    const oui: string[] = []
    const file = [...ids]
    let fait = 0
    const ouvrier = async () => {
      for (;;) {
        const id = file.shift()
        if (id === undefined) return
        try {
          const r = await fetch(urlAnimee(id), {
            method: 'HEAD',
            headers: { 'User-Agent': UA_NEUTRE },
            signal: AbortSignal.timeout(20_000),
          })
          if (r.ok) oui.push(id)
        } catch {
          // *Un test perdu rend l'emoji NON anime* : une absence de mesure
          // n'est pas une mesure, et le pire cas est une carte statique.
        }
        fait++
        if (fait % 400 === 0) journal(`  ${fait}/${ids.length}`)
      }
    }
    await Promise.all(Array.from({ length: 10 }, ouvrier))
    journal(`  ${oui.length} animes (${((100 * oui.length) / ids.length).toFixed(0)} %)`)
    return oui.join(',')
  })
  return new Set(brut.split(',').filter(Boolean))
}

/**
 * LA NOTORIETE D'UN EMOJI EST SA FREQUENCE D'USAGE REELLE.
 *
 * Tranche par Keko : « je voudrais que la rarete soit lie a la popularite
 * reelle de l'emoji ». **Elle vient du classement d'Unicode** -- dix-huit
 * groupes, chacun valant la moitie du precedent -- et elle couvre 76 % du
 * catalogue.
 *
 * ***L'ANCIENNETE N'EST PLUS QU'UN REPLI***, pour les 24 % que le classement
 * ignore : ce sont les emoji posterieurs a Unicode 12.0, donc les plus
 * recents, donc les moins employes. *Le trou a la bonne forme* -- ils vont en
 * bas, et l'anciennete puis l'animation suffisent a les departager entre eux.
 *
 * **Les deux echelles ne se melangent pas** : tout ce qui est classe passe
 * devant tout ce qui ne l'est pas. *Un emoji mesure et un emoji devine ne se
 * comparent pas*, et les mettre sur la meme echelle reviendrait a inventer un
 * rang pour le second.
 *
 * Ce que l'anciennete faisait de faux, et qui tombe : le visage riant aux
 * larmes sortait epique et le coeur rouge commun, alors que ***ce sont les deux
 * premiers du classement mondial.***
 */
function notoriete(
  e: Brut,
  anime: boolean,
  total: number,
  rang?: { groupe: number; dans: number },
): number {
  // CE QUI EST CLASSE PASSE DEVANT TOUT : le groupe 0 vaut le plus haut score,
  // et le rang DANS le groupe departage -- *Unicode les range par frequence
  // decroissante a l'interieur de chaque groupe.*
  if (rang !== undefined) return 1_000_000_000 - rang.groupe * 1_000_000 - rang.dans * 100
  const annee = ANNEE_DE_VERSION[e.version] ?? 2026
  // Plus c'est vieux, plus c'est notoire : on compte les annees depuis 2030.
  return (2030 - annee) * 1_000_000 + (anime ? 500_000 : 0) + (total - e.rang)
}

/** LE RESUME : c'est lui qui permet de juger un reglage sans ouvrir le jeu. */
function resume(cartes: readonly CarteEmoji[]): string {
  const l: string[] = [
    'CATALOGUE DES EMOJI',
    `engendre le ${new Date().toISOString().slice(0, 19).replace('T', ' ')} UTC`,
    '',
  ]
  l.push(`${cartes.length} cartes, dont ${cartes.filter((c) => c.animable).length} animables`)
  l.push('')
  l.push(`au classement de frequence : ${cartes.filter((c) => c.frequence !== null).length}`)
  l.push('')
  l.push('OU CHAQUE GROUPE TOMBE DANS L ECHELLE GLOBALE')
  l.push('---------------------------------------------')
  l.push(
    `  ${'groupe'.padEnd(12)} ${'n'.padStart(5)}  ` +
      RARETES_EMOJI.map((r) => r.slice(0, 6).padStart(10)).join(''),
  )
  for (const g of GROUPES_EMOJI) {
    const gr = cartes.filter((c) => c.groupe === g)
    if (gr.length === 0) continue
    l.push(
      `  ${g.padEnd(12)} ${String(gr.length).padStart(5)}  ` +
        RARETES_EMOJI.map((r) => {
          const n = gr.filter((c) => c.rarete === r).length
          return `${n} (${((100 * n) / gr.length).toFixed(0)}%)`.padStart(10)
        }).join(''),
    )
  }
  l.push('')
  l.push('PAR ANNEE')
  l.push('---------')
  for (const a of [...new Set(cartes.map((c) => c.annee))].sort((x, y) => x - y)) {
    const n = cartes.filter((c) => c.annee === a).length
    l.push(`  ${a}  ${String(n).padStart(5)}  ${'#'.repeat(Math.round((40 * n) / cartes.length))}`)
  }
  l.push('')
  l.push('LE HAUT DE CHAQUE GROUPE')
  l.push('------------------------')
  for (const g of GROUPES_EMOJI) {
    const gr = cartes.filter((c) => c.groupe === g).slice(0, 8)
    if (gr.length === 0) continue
    l.push(`  ${g.padEnd(12)} ${gr.map((c) => `${c.emoji} ${c.nom}`).join(' · ')}`)
  }
  l.push('')
  l.push('LE HAUT DU CLASSEMENT MONDIAL')
  l.push('-----------------------------')
  l.push('  ' + cartes.slice(0, 30).map((c) => c.emoji).join(' '))
  l.push('  ' + cartes.slice(30, 60).map((c) => c.emoji).join(' '))
  l.push('')
  l.push('LE BAS')
  l.push('------')
  l.push('  ' + cartes.slice(-30).map((c) => c.emoji).join(' '))
  l.push('')
  l.push('UN EXEMPLE PAR RARETE')
  l.push('---------------------')
  for (const r of RARETES_EMOJI) {
    const gr = cartes.filter((c) => c.rarete === r)
    if (gr.length === 0) {
      l.push(`  ${r.padEnd(12)} aucune carte -- A REVOIR`)
      continue
    }
    const m = gr[Math.floor(gr.length / 2)]!
    l.push(
      `  ${r.padEnd(12)} ${m.emoji} ${m.nom} (${m.groupe}, ${m.rang}e, ` +
        `${m.frequence === null ? 'non classe' : 'frequence ' + m.frequence}${m.animable ? ', animable' : ''})`,
    )
  }
  return l.join('\n') + '\n'
}

/**
 * LES DRAPEAUX EN DOUBLE, ECARTES. Keko : « supprime uniquement les
 * strictement identiques ».
 *
 * *Unicode donne un drapeau a chaque territoire, et plusieurs territoires
 * portent celui d'un autre* : peints par Noto, ils sont identiques au pixel
 * pres (mesure : les 270 drapeaux dessines en 256 et compares, ecart nul). On
 * garde le pays ; pour l'ocean Indien, Diego Garcia, plus connu que le nom
 * administratif du territoire. **Les presque-pareils restent** (Egypte et
 * Yemen, Tchad et Roumanie) : ils different, meme a peine.
 */
const DOUBLONS = new Set([
  '1f1e7-1f1fb', // Ile Bouvet = Norvege
  '1f1f8-1f1ef', // Svalbard et Jan Mayen = Norvege
  '1f1e8-1f1f5', // Ile Clipperton = France
  '1f1f2-1f1eb', // Saint-Martin = France
  '1f1fa-1f1f2', // Iles mineures eloignees = Etats-Unis
  '1f1ea-1f1e6', // Ceuta et Melilla = Espagne
  '1f1ed-1f1f2', // Iles Heard-et-MacDonald = Australie
  '1f1ee-1f1f4', // Territoire britannique de l'ocean Indien = Diego Garcia
])

async function main(): Promise<void> {
  const debut = Date.now()
  mkdirSync(SORTIE, { recursive: true })
  journal(`Catalogue des emoji${avecPeau ? ' (variantes de peau COMPRISES)' : ''}`)

  const bruts = lireUnicode(await texte('unicode', UNICODE)).filter((b) => !DOUBLONS.has(b.id))
  journal(`${bruts.length} emoji${avecPeau ? '' : ' (variantes de peau ecartees)'}`)

  const noms = await nomsFrancais()
  const rangs = await classement()
  const anime = await animes(bruts.map((b) => b.id))

  // LA CLE DU CLASSEMENT PEUT PORTER OU NON LE SELECTEUR DE VARIANTE, comme
  // celle de CLDR : on indexe les deux formes une fois pour toutes.
  const sansVS = new Map<string, { groupe: number; dans: number }>()
  for (const [e, v] of rangs) {
    const nu = e.replace(/️/g, '')
    if (!sansVS.has(nu)) sansVS.set(nu, v)
  }

  let sansNom = 0
  const sans = bruts.map((b) => {
    // LE SELECTEUR DE VARIANTE EST FACULTATIF DANS LA CLE CLDR : on essaie la
    // sequence complete, puis sans lui.
    const fr = noms.get(b.emoji) ?? noms.get(b.emoji.replace(/️/g, ''))
    if (fr === undefined) sansNom++
    const estAnime = anime.has(b.id)
    // LA VARIANTE HERITE DU RANG DE SA BASE : voir `baseSansPeau`.
    const nu = b.emoji.replace(/️/g, '')
    const rang =
      rangs.get(b.emoji) ??
      sansVS.get(nu) ??
      rangs.get(baseSansPeau(b.emoji)) ??
      sansVS.get(baseSansPeau(nu))
    return {
      id: b.id,
      emoji: b.emoji,
      // *Un nom anglais vaut mieux qu'une carte en moins* : la regle du repli
      // anglais des personnages, reprise ici.
      nom: fr?.nom ?? b.nomEn,
      groupe: b.groupe,
      mots: fr?.mots ?? [],
      version: b.version,
      annee: ANNEE_DE_VERSION[b.version] ?? 2026,
      animable: estAnime,
      frequence: rang?.groupe ?? null,
      notoriete: notoriete(b, estAnime, bruts.length, rang),
    }
  })
  journal(`${sansNom} sans nom francais (nom anglais garde)`)
  journal(`${sans.filter((c) => c.frequence !== null).length}/${sans.length} au classement de frequence`)

  // Triees par notoriete decroissante : le fichier se lit de haut en bas.
  sans.sort((a, b) => b.notoriete - a.notoriete || a.id.localeCompare(b.id))

  /**
   * LE DECOUPAGE EST GLOBAL, PAS PAR GROUPE. Tranche par Keko : « je voudrais
   * un classement global et pas par groupe ».
   *
   * *C'est l'inverse de ce qu'il a tranche pour les personnages*, et les deux
   * sont justes pour la meme raison : **le decoupage par rayon existe pour
   * corriger une echelle qui n'est pas comparable d'un rayon a l'autre.** Chez
   * les personnages, la 300e artiste a 106 langues et la 300e criminelle 28 --
   * il n'y a pas de mesure commune. **Ici il y en a une** : la frequence
   * d'usage se compare entre un visage et un drapeau, donc le rayon n'a plus
   * rien a corriger.
   *
   * *Ce que ca change* : les drapeaux, qui sont presque tous dans le bas du
   * classement mondial, cessent d'avoir leurs sept legendaires -- et c'est
   * exactement ce qu'une popularite reelle doit produire.
   */
  const crans = cransParGroupe(
    sans.map((c) => ({ groupe: '', valeur: c.notoriete })),
    PYRAMIDE_CINQ,
  ) as RareteEmoji[]
  const cartes: CarteEmoji[] = sans.map(({ notoriete: _n, ...c }, i) => ({
    ...c,
    // LE RANG EST LA PLACE DANS LE CATALOGUE, et la liste est deja triee : *le
    // seul chiffre dont la rarete derive*, donc le seul que la carte affiche.
    rang: i + 1,
    rarete: crans[i]!,
  }))

  const json = JSON.stringify({ genere: new Date().toISOString(), cartes })
  // *Le banc des variantes a son propre fichier* : il ne remplace pas le
  // catalogue, il se regarde a cote -- `?paquet&emoji&peau`.
  const nom = option('sortie') ?? (avecPeau ? 'emoji-peau' : 'emoji')
  writeFileSync(new URL(`${nom}.json`, SORTIE), json, 'utf8')
  writeFileSync(new URL(`${nom}-summary.txt`, SORTIE), resume(cartes), 'utf8')
  journal(`Ecrit ${cartes.length} cartes -- ${(json.length / 1024).toFixed(0)} Ko`)
  journal(`Fini en ${((Date.now() - debut) / 1000).toFixed(0)} s`)
}

await main()

/**
 * CE QU'UNE CARTE DIT, en un seul endroit.
 *
 * Le texte d'effet, le type gravé au pied et la famille qui la colore sont les
 * mêmes que la carte soit dessinée en CSS (le jeu 2D) ou peinte dans une
 * texture (le moteur 3D). **Les écrire deux fois, c'est garantir qu'un jour les
 * deux divergeront** — c'est exactement ce qui était arrivé aux quatre
 * fonctions qui dessinaient chacune leur carte avant `corpsCarte`.
 *
 * Aucun accès au DOM ici : le module est lisible par un canvas comme par une
 * chaîne de HTML. Le balisage qu'il produit (`<b>`, `<small>`) est du contenu,
 * pas du rendu — le canvas le retire, le DOM l'affiche.
 */
import { PART_RESISTANCE } from '../logic/combat.ts'
import type { Carte } from '../logic/combat.ts'
import type { Rarete } from '../logic/armes.ts'

/**
 * LE RANG D'UN TRÉSOR, tiré de sa valeur — et il prend l'échelle d'alliages.
 *
 * Keko : « on peut appliquer les couleurs de rareté aux trésors maintenant ? »
 * *Ce qui l'interdisait a été levé par la forme* : depuis que le trésor porte
 * un cadre franc à coins coupés là où tout le reste porte la coque déchirée,
 * la couleur n'a plus à dire la famille. **La forme dit la famille, la couleur
 * dit l'échelle** — un trésor d'or ne se confond pas avec une arme épique,
 * leurs silhouettes diffèrent.
 *
 * Les seuils coupent la table de butin en quatre parts ÉGALES, trois trésors
 * par cran : *un rang qui ne tomberait pas juste sur la table donnerait des
 * crans vides et des crans bondés.* Camée / Aiguière / Torque en bronze,
 * Médaillon / Idole / Cassette en argent, Calice / Ostensoir / Reliquaire en
 * or, Sceptre / Diadème / Couronne en diamant.
 *
 * Ça remplace les trois rangs de richesse du jeu 2D, qui n'avaient de nom que
 * dans le code : `cossu` et `modeste` ne se voyaient nulle part.
 */
export function rangDuTresor(valeur: number): Rarete {
  if (valeur >= 180) return 'legendaire'
  if (valeur >= 115) return 'epique'
  if (valeur >= 70) return 'rare'
  return 'commune'
}

/**
 * Ce que fait la carte, en toutes lettres : une ligne par effet. Le chiffre
 * est dedans, en gras et en accent — c'est le seul endroit où il vit.
 */
/**
 * CE QUE DIT UNE CARTE — et `armure` est **l'armure du MOMENT**.
 *
 * Elle n'est passée qu'en combat, où l'état existe : ailleurs (le coffre, le
 * deck, le butin) la carte dit sa règle sans chiffre. *C'est le motif du coût
 * de l'Estoc*, qui se demande déjà à `coutDe` avant d'être peint — **ce qu'une
 * carte vaut est une propriété du moment, pas de la carte.**
 */
export function lignes(carte: Carte, valeurAPart = false, armure?: number): string[] {
  const l: string[] = []
  // LA VALEUR D'UN TRÉSOR PEUT SE DIRE AILLEURS QUE DANS LE CARTOUCHE.
  //
  // Keko : « pour le gain en or des trésors on ne va pas l'afficher directement
  // dans la description ; on va afficher une valeur de qualité avec un petit
  // symbole, hors du champ de description ». Le moteur 3D la peint en badge et
  // passe `valeurAPart` ; le jeu 2D, qui n'a pas ce badge, garde la phrase —
  // *un moteur qui ne sait pas montrer une chose ne doit pas cesser de la
  // dire.*
  if (carte.type === 'tresor' && !valeurAPart) {
    l.push(`Vaut <b>${carte.valeur ?? 0}</b> or s'il ressort`)
  }
  // L'ÉTOURDISSEMENT SE DIT DANS LA MÊME PHRASE QUE LE COUP. Keko : « Inflige
  // 3 dégâts et étourdissement (on met étourdissement en gras) ; on ne précise
  // pas l'effet ». *Un mot-clé est un nom, pas une phrase* — ce qu'il fait vit
  // dans le glossaire, pas sur chaque carte qui le porte.
  const etourdit = carte.effets?.some((e) => e.type === 'etourdit') === true
  if (carte.degats > 0)
    l.push(
        `Infligez <d><b>${carte.degats}</b></d> ${degats(carte.degats)}${etourdit ? ' et&nbsp;<k><b>étourdissement</b></k>' : ''}`,
      )
  else if (etourdit) l.push(`<k><b>Étourdissement</b></k>`)
  // SES DÉGÂTS SONT VOTRE DÉFENSE : on ne peut pas écrire un chiffre, donc on
  // écrit la RÈGLE. *Une carte dont l'effet dépend de l'état doit dire de quoi
  // il dépend*, pas afficher un zéro qui se lirait comme une carte inutile.
  //
  // ON VOUVOIE LE JOUEUR, TOUJOURS, SANS EXCEPTION.
  //
  // Tranché par Keko, après un aller-retour qu'il a fini par clore : « mets
  // gagnez et pas gagne, faut vraiment toujours utiliser "vous" systématique,
  // faut arrêter le tutoiement ».
  //
  // *Les verbes sont passés à l'impersonnel le temps de quelques commits* —
  // « Inflige », « Gagne », « Soigne » — sur un argument qui tenait : un verbe
  // nu se lit à la troisième personne dès que la phrase a un sujet ailleurs,
  // donc c'était l'EFFET qui parlait et non quelqu'un s'adressant au joueur.
  //
  // **Et c'est précisément ce qui le condamnait : la règle était trop fine.**
  // Elle demandait, à chaque carte neuve, de vérifier si la phrase portait
  // ailleurs un « vous » qui désambiguïse — donc de rouvrir le débat à chaque
  // fois. ***Une règle de langue doit s'appliquer sans réfléchir***, sinon ce
  // n'est pas une règle, c'est un jugement à refaire.
  //
  // **Infligez, Gagnez, Soignez, Piochez** — et « Piochez » cesse d'être une
  // exception à justifier, ce qu'il était depuis que son homonymie avec le tas
  // de pioche l'avait fait vouvoyer seul.
  //
  // *Ce qui n'est pas adressé ne bouge pas* : « Coûte 1 PA de moins » parle de
  // la CARTE, « les ennemis qui vous attaquent subissent » a déjà son sujet, et
  // les définitions du glossaire parlent de l'effet. **Le critère reste QUI
  // agit**, et c'est le seul qui ait jamais été nécessaire.
  //
  // Une seule entrée, donc une seule phrase : le repli la coupe où il faut,
  // là où deux lignes de tailles différentes la casseraient en son milieu.
  // LA FORMULATION EST DE KEKO : « Inflige 1 dégât pour chaque blocage que vous
  // avez ». *Elle dit la même règle en comptant plutôt qu'en comparant* — et
  // un joueur qui lit « 1 par blocage » sait quoi faire de sa prochaine carte,
  // là où « égal à votre défense » demandait d'aller chercher le chiffre.
  if (carte.degatsDuBloc === true)
    // ET « BLOCAGE » EST EN GRAS, comme « attaque ». Demandé par Keko.
    // *Ce qui s'appuie n'est pas un verbe de la phrase, c'est un mot qui
    // renvoie à une RÈGLE* — « attaque » désigne ce que la remise de l'Estoc
    // compte, « blocage » ce que cette carte-ci compte. Les deux sont la chose
    // du jeu qu'on va chercher ailleurs sur l'écran.
    // ELLE COMPARE DE NOUVEAU, PARCE QUE LE CHIFFRE EST LÀ. Formulation de
    // Keko : « Inflige un montant de dégâts égal à votre niveau d'armure. Et
    // quand le joueur est en jeu on spécifie le montant : (X). »
    //
    // *On était passé de « égal à votre défense » à « 1 pour chaque blocage »
    // pour une raison précise* — **la tournure qui compare envoyait chercher un
    // chiffre ailleurs sur l'écran.** Elle tombe ici : *le chiffre est dans la
    // phrase*, et seulement là où il existe. **Ce qui condamnait la comparaison
    // n'était pas la comparaison, c'était l'absence du chiffre comparé.**
    l.push(
      `Infligez un montant de dégâts égal à votre niveau d'armure${
        armure === undefined ? '' : ` (<d><b>${armure}</b></d>)`
      }`,
    )
  for (const e of carte.effets ?? []) {
    // La condition sur une seconde ligne, en retrait : « ce tour » et « l'or
    // est perdu » coupaient au milieu quand ils suivaient sur la même ligne.
    // ON NE REDIT PAS « CE TOUR SEULEMENT ». Tranché par Keko. *Le bloc tombe
    // à la fin de chaque tour, sans exception* — c'est une règle du jeu, pas
    // une clause de cette carte-ci, et une condition écrite sur toutes les
    // cartes de défense cesse d'être une condition.
    // **ON GAGNE DES BLOCAGES, on ne bloque pas des blessures.** Tranché par
    // Keko : « pour le blocage, on va plutôt dire "gagnez X blocages" ».
    //
    // *C'est le Coup de bouclier qui l'imposait* — il dit « pour chaque
    // **blocage** que vous avez », donc le blocage est une CHOSE qu'on accumule
    // et qu'on compte. Une carte qui en donne ne pouvait pas en parler comme
    // d'un geste : **la carte qui produit et la carte qui consomme doivent
    // nommer la même ressource**, sinon rien ne dit qu'elles se répondent.
    //
    // Et le verbe rejoint les deux autres acquisitions, l'esquive et les points
    // d'action : *tout ce qu'on acquiert se dit « Gagne ».*
    if (e.type === 'bloc') l.push(`Gagnez <p><b>${e.montant}</b></p> d'armure`)
    // LA BARRIÈRE DIT LA RÈGLE, PAS UN CHIFFRE — même tournure que le Coup de
    // bouclier : *elle COMPTE plutôt qu'elle ne compare*, et un joueur qui lit
    // « 1 par carte » sait quoi faire de son tour. La formulation est de Keko.
    if (e.type === 'blocParCarte')
      l.push(`Gagnez <p><b>${e.montant}</b></p> d'armure pour chaque carte dans votre main`)
    // L'ESQUIVE DIT SA DURÉE, comme la riposte : *c'est une clause de cette
    // carte-ci, pas une règle du jeu* — sans elle on la croirait permanente.
        // « VOTRE » DESCEND AVEC CE QU'IL INTRODUIT. Keko : « on peut mettre le
    // "votre" en dessous ». *Un possessif seul au bout d'une ligne annonce un
    // groupe qui n'arrive qu'à la suivante* — même raison que le « et » de la
    // Projection, et l'insécable fait le lien.
    if (e.type === 'esquive') l.push(`Gagnez <k><b>esquive</b></k> jusqu'à votre&nbsp;prochain tour`)
    // LE MOT-CLÉ NE PEUT PAS S'APPELER « DÉFENSE », et c'était la seule
    // objection qui tenait : *c'est déjà le TYPE écrit au pied de ces cartes* —
    // le joueur lirait le même mot au pied et en jaune dans le texte, pour deux
    // choses différentes. **Le jaune promet une définition à aller chercher, et
    // un mot qui nomme aussi une famille entière ne peut pas la tenir.**
    if (e.type === 'resistance')
      l.push(`Gagnez <k><b>résistance</b></k> jusqu'à votre&nbsp;prochain tour`)
    if (e.type === 'soin') {
      // Un trésor ne soigne qu'en se détruisant : la carte doit dire les deux,
      // le gain et le prix, sinon elle ment sur ce qu'on joue.
      if (carte.type === 'tresor') {
        // Le mot suit l'affichage : là où la carte ne parle plus d'or, elle
        // dit sa VALEUR. *Une carte ne peut pas perdre un or qu'elle n'a
        // jamais annoncé.*
        const perte = valeurAPart ? 'et sa valeur est perdue' : 'et son or est perdu'
        l.push(`Brûler : soignez <s><b>${e.montant}</b></s> {coeur}`, `<small>${perte}</small>`)
      }
      else {
        /**
         * **LE SOIN SE DIT AU COEUR, et la potion parle en DEUX PHRASES.**
         * Keko : « on va faire deux phrases pour les potions : Consommable /
         * Soigne 14 "symbole de coeur" ».
         *
         * *Le mot-clé n'introduit plus rien, il CLASSE* — « Consommable » dit ce
         * que la carte EST, et le deux-points en faisait l'amorce d'une phrase
         * dont le soin n'était que la suite. Deux phrases disent deux faits :
         * ce qu'elle est, ce qu'elle fait. **C'est la même correction que le
         * titre des encadrés**, à qui Keko avait retiré ses deux-points pour la
         * même raison.
         *
         * **ET LE MOT CÈDE AU SYMBOLE** : le coeur est celui de la bande de
         * stats et des mesures d'armure — *le même fait se dit du même symbole
         * partout.* Il remplace un mot de huit lettres, donc la ligne tient
         * d'un coup d'oeil, et il dit ce qu'aucun mot ne disait : que c'est la
         * MÊME réserve que la barre de vie.
         *
         * *Le trésor brûlé le porte aussi* — **deux cartes qui font la même
         * chose ne peuvent pas la dire de deux façons.**
         */
        const exile = carte.usages === undefined && carte.exil === true
        if (exile) l.push('<k><b>Consommable</b></k>')
        l.push(`Soignez <s><b>${e.montant}</b></s> {coeur}`)
      }
    }
    /**
     * **PIOCHER : le verbe de la Robe, et il se dit en CARTES.**
     *
     * *Pas de teinte* : les trois couleurs disent ce qu'on inflige, ce qu'on
     * encaisse et ce qu'on soigne — piocher n'est aucun des trois. **Une
     * quatrième couleur pour un quatrième fait finirait par n'en distinguer
     * aucun** ; le gras du chiffre suffit.
     *
     * **IL A ÉTÉ LE SEUL VERBE VOUVOYÉ, le temps que les autres soient à
     * l'impersonnel.** Demandé par Keko : « on peut dire "piochez 2 cartes"
     * plutôt pour concentration ? » — *parce que « pioche » est aussi un NOM du
     * jeu*, le tas des coins, et que « Pioche 2 cartes » se lit aussi bien
     * « [la] pioche [a] 2 cartes ».
     *
     * **Tout le monde l'a rejoint depuis**, et l'exception n'a plus à se
     * justifier : *on vouvoie partout.* L'homonymie, elle, reste vraie — c'est
     * elle qui dit pourquoi ce verbe-là ne pourra jamais redevenir nu.
     */
    if (e.type === 'pioche') {
      l.push(`Piochez <b>${e.montant}</b> carte${e.montant > 1 ? 's' : ''}`)
    }
    // POINTS D'ACTION, ET PAS « ÉNERGIE » : le mot renvoie au TEMPS, et c'est
    // ce que Keko veut dire — *plus une carte coûte, plus l'action est longue
    // et puissante.* Le code garde `energie` partout, c'est un nom interne.
    //
    // **ET IL S'ÉCRIT AVEC L'ORBE**, comme la remise de l'Estoc : *le même
    // symbole partout*, celui du coin de la carte et du coin de l'écran. Keko
    // l'a demandé en composant l'Agilité : « Gagnez 1 PA » — et **« PA » n'est
    // pas un mot, c'est déjà un symbole écrit en lettres**, donc le dessin ne
    // retire rien au sens.
    //
    // *Ça corrige un accord faux au passage* : la ligne disait « +1 pointS
    // d'action ». **Un jeton n'a pas de pluriel à accorder.**
    if (e.type === 'energie') l.push(`Gagnez {pa:${e.montant}}`)
    if (e.type === 'degatsTous') l.push(`Infligez <d><b>${e.montant}</b></d> à chaque ennemi`)
    // LA RIPOSTE DIT SA DURÉE, là où le bloc ne la dit plus : *le bloc tombe à
    // chaque fin de tour, c'est une règle du jeu ; la riposte, elle, est une
    // clause de CETTE carte* — et sans elle on la croirait permanente.
    // LA FORMULATION EST DE KEKO : « jusqu'au prochain tour, les ennemis qui
    // vous attaquent subissent 4 dégâts ». *Elle met l'ENNEMI en sujet*, et
    // ET « ATTAQUENT » EST EN GRAS, demandé par Keko. *C'est la règle déjà
    // tranchée* — « mets juste le terme attaque en gras ainsi que les chiffres,
    // ne mets rien d'autre » — et elle vaut pour le mot CONJUGUÉ : ce qui le
    // distingue des verbes de la phrase est qu'il renvoie à une RÈGLE, celle
    // qui décide quand la riposte part. *Un mot-règle reste un mot-règle quand
    // il change de personne.*
    //
    // c'est plus juste — la riposte n'est pas un coup qu'on porte, c'est un
    // prix qu'il paie. « Jusqu'à votre prochain tour » dit la durée mieux que
    // « ce tour » : la carte se joue AVANT la salve, donc c'est elle qu'on
    // couvre.
    //
    // **ET C'EST MOT POUR MOT LA DURÉE DE L'AGILITÉ**, qui dit déjà « jusqu'à
    // votre prochain tour ». Elle disait « jusqu'au » ; Keko l'a repris. *Deux
    // cartes qui durent le même temps ne peuvent pas le dire de deux façons* —
    // la règle qui a déjà fait parler toutes les cartes de dégâts, et aligné
    // le trésor brûlé sur la potion. Et le possessif dit de QUI est le tour :
    // le joueur en a un, les ennemis frappent entre les deux.
    if (e.type === 'riposte')
      l.push(
        `Jusqu'à votre prochain tour, les ennemis qui vous attaquent subissent <d><b>${e.montant}</b></d> ${degats(e.montant)}`,
      )

  }
  // LA REMISE SE DIT APRÈS LE COUP, parce qu'elle parle du COÛT et non de ce
  // que la carte fait — et elle le dit avec un VERBE.
  //
  // Keko : « c'est pas clair, on pourrait penser qu'on perd 1 PA par attaque
  // jouée ; il faudrait dire : coûte 1 PA de moins ». *Un « −1 PA » posé seul
  // ne dit pas sur quoi il porte* : sur la réserve du tour, ou sur le prix de
  // cette carte ? Les deux lectures existent dans ce jeu, puisqu'un trésor
  // brûlé dépense bien de l'énergie. **Le verbe tranche** : ce qui coûte, c'est
  // la carte.
  //
  // Deux lignes, comme « Bloque 5 dégâts / ce tour seulement » : le fait, puis
  // la condition en retrait. *Ce qui modifie le prix n'est pas au même rang
  // que ce qu'on achète.*
  if ((carte.remiseParAttaque ?? 0) > 0) {
    const pa = carte.remiseParAttaque ?? 0
    l.push(`Coûte {pa:${pa}} de moins`, `<small>par attaque jouée ce tour</small>`)
  }
  return l
}

/*
 * `enClair` A DISPARU AVEC LE JEU 2D. C'était le repli qui rendait `{pa:1}` en
 * « 1 PA » et `{coeur}` en « ♥ » pour un moteur qui ne peint pas de jeton —
 * *un moteur qui ne sait pas montrer une chose ne doit pas cesser de la dire*.
 *
 * **Il n'y a plus qu'un moteur, et il les peint tous.** La règle, elle, reste
 * vraie : le jour où un second rendu arrive — une infobulle, un export, un
 * écran de texte — c'est elle qu'il faudra reposer, et `git log` en garde la
 * forme exacte.
 */

/**
 * LE GLOSSAIRE : ce que fait un mot-clé, dit UNE FOIS.
 *
 * Keko : « on ne précise pas l'effet [sur la carte], et quand le joueur zoome
 * on affiche un encadré à côté : Étourdissement : annule l'action en cours ».
 *
 * *Un mot-clé est un nom, pas une phrase* : écrit en entier sur chaque carte
 * qui le porte, il mangerait le cartouche et se répéterait à l'identique. Mais
 * **un mot-clé qu'on n'explique nulle part n'est pas un mot-clé, c'est du
 * jargon** — d'où l'encadré, qui le dit là où l'on a le temps de lire.
 */
/**
 * **ON PARLE DE DÉGÂTS — « blessure » a vécu une passe.** Keko l'avait demandé
 * — « on peut remplacer dégâts par blessure dans toutes les cartes » — puis
 * repris : « on va remplacer blessures par dégâts finalement ».
 *
 * *Ce que le détour a appris, et c'est ce qui le rend lisible* : le mot avait
 * été choisi pour être **le même des deux côtés**, puisqu'on inflige et qu'on
 * soigne. **Il n'y a plus deux côtés** — le soin se dit au coeur depuis que
 * la potion parle en deux phrases, donc le mot ne sert plus qu'à ce qu'on
 * inflige, et là « dégâts » est ce que tout le monde lit sans traduire.
 *
 * *Un mot choisi pour unifier deux emplois perd sa raison quand il n'en garde
 * qu'un.*
 *
 * **L'accord se fait sur le chiffre** : une carte qui en inflige un seul le dit
 * au singulier, et le Coup de bouclier ne l'écrit plus en dur.
 */
/*
 * LE MOT EST « ARMURE », ET IL N'A PLUS D'ACCORD À FAIRE. Tranché par Keko :
 * « on va aussi remplacer blocage par armure ».
 *
 * *Un blocage se comptait, une armure se MESURE* — on n'en gagne pas sept, on
 * en gagne sept POINTS, donc le pluriel disparaît avec le mot. Et c'est ce
 * qu'il appelle déjà « votre niveau d'armure » sur le Coup de bouclier : **le
 * même fait se dit du même mot partout.**
 */

function degats(n: number): string {
  return n === 1 ? 'dégât' : 'dégâts'
}

export const GLOSSAIRE: Record<string, string> = {
  Étourdissement: "annule l'action en cours",
  Consommable: "la carte est détruite quand elle est jouée",
  // « QUI VOUS CIBLE », pas « subie » — formulation de Keko. *Une attaque subie
  // est déjà arrivée* ; celle qu'on esquive est celle qui arrive.
  Esquive: "vous avez 50 % de chance d'éviter la prochaine attaque qui vous cible",
  // LE POURCENTAGE VIT DANS LA DÉFINITION, PAS DANS LA CARTE. Tranché par
  // Keko : « on ne précise pas le % dans la description, c'est toujours 30 %
  // (comme esquive toujours 50 %) ».
  //
  // *J'avais écrit l'inverse* — « deux cartes de résistance n'auront pas la
  // même part » — et c'est une règle inventée pour un cas qui n'existe pas.
  // **Un mot-clé nomme une RÈGLE** : s'il fallait lire son chiffre sur chaque
  // carte, ce ne serait plus un mot-clé mais une abréviation. L'esquive le dit
  // depuis le début, et sa définition porte bien ses 50 %.
  //
  // Le chiffre se lit sur la CONSTANTE DU JEU, jamais écrit ici : *deux
  // endroits qui décrivent la même valeur se désaccordent au premier réglage.*
  Résistance: `chaque attaque subie inflige ${Math.round(PART_RESISTANCE * 100)} % de dégâts en moins`,
}

/** Les mots-clés qu'une carte emploie, pour l'encadré du zoom. */
export function motsCles(carte: Carte): string[] {
  const mots: string[] = []
  if (carte.effets?.some((e) => e.type === 'etourdit') === true) mots.push('Étourdissement')
  if (carte.effets?.some((e) => e.type === 'esquive') === true) mots.push('Esquive')
  if (carte.effets?.some((e) => e.type === 'resistance') === true) mots.push('Résistance')
  // LE MOT SUIT LA RÈGLE, pas le type affiché : *ce qui fait un consommable,
  // c'est qu'il s'exile* — un trésor brûlé s'exile aussi, mais il le dit déjà
  // en clair sur sa seconde ligne, et c'est le prix de son effet, pas une
  // propriété de la carte.
  if (carte.type !== 'tresor' && carte.usages === undefined && carte.exil === true)
    mots.push('Consommable')
  return mots
}

/** La famille d'une carte, pour la teinte de son écusson et de son chiffre. */
export function famille(carte: Carte): 'tresor' | 'consommable' | 'attaque' | 'defense' | 'action' {
  if (carte.type === 'tresor') return 'tresor'
  if (carte.usages !== undefined || carte.exil === true) return 'consommable'
  // UNE CARTE QUI FRAPPE EST UNE ATTAQUE, même quand son chiffre est à zéro :
  // le Coup de bouclier vaut la défense du moment, et *ce qui classe une carte
  // est son verbe, pas ce qu'elle vaut à cet instant.* Sans ça, son pied
  // disait « Action ».
  if (carte.degats > 0 || carte.degatsDuBloc === true || carte.effets?.some((e) => e.type === 'degatsTous'))
    return 'attaque'
  if (carte.effets?.some((e) => e.type === 'bloc')) return 'defense'
  return 'action'
}

/** Ce qu'est la carte, pour le type gravé en bas. */
export function nature(carte: Carte): string {
  // Le rang de richesse ne s'écrit pas : il se lit au cadre, comme la rareté
  // d'une pièce. Keko : « inutile de spécifier la qualité modeste en bas ».
  // LE MOT EST « BUTIN », PAS « TRÉSOR ». Tranché par Keko. *Un trésor est un
  // objet qu'on possède, un butin est ce qu'on RAPPORTE* — et c'est bien ce
  // que fait la carte : elle ne vaut que si elle ressort du donjon. Le
  // vocabulaire dit la règle, comme « enchantement » plutôt que « maîtrise ».
  //
  // Le code, lui, garde `tresor` : c'est un nom interne qui ne se lit nulle
  // part à l'écran, et *un renommage traversant `logic/` pour un mot ne vaut
  // pas son risque* — la règle déjà tenue par `energie`.
  if (carte.type === 'tresor') return 'Butin'
  // OBJET, ET PAS « CONSOMMABLE » : c'est le nom que porte l'onglet du coffre,
  // et *une même chose ne peut pas s'appeler autrement selon l'écran où on la
  // regarde.* Demandé par Keko. Le mot est aussi plus court, ce qui compte sur
  // un pied de carte enfoui aux trois quarts.
  if (carte.usages !== undefined || carte.exil === true) return 'Objet'
  if (carte.degats > 0 || carte.degatsDuBloc === true || carte.effets?.some((e) => e.type === 'degatsTous'))
    return 'Attaque'
  /**
   * **L'ESQUIVE EST UNE DÉFENSE, pas une action.** Tranché par Keko : « la carte
   * esquive devrait être de type défense ».
   *
   * *Ce qui classe une carte est son VERBE* — et le verbe est le même que celui
   * du bloc : **empêcher la salve d'arriver.** Le bloc l'absorbe, l'esquive
   * l'évite ; ce sont deux façons de faire la seule chose que la famille
   * promet. **La famille n'est pas « ce qui donne du bloc », c'est « ce qui
   * protège »**, et s'en tenir au champ `bloc` confondait la règle avec son
   * premier moyen.
   *
   * *La Riposte, elle, reste une Action* : elle ne protège de rien, elle pose
   * un PRIX que l'ennemi paie en frappant.
   *
   * **ET LA LISTE SE RELIT À CHAQUE VERBE NEUF.** La Barrière est arrivée avec
   * son propre effet et son pied disait « Action » — *du bloc qui ne s'appelle
   * pas `bloc` n'était plus reconnu*, exactement le défaut que l'esquive avait
   * déjà coûté. **Une liste de cas est une liste qu'on oublie de compléter**,
   * la règle déjà payée sur les étiquettes de la vitrine du zoom.
   */
  if (
    carte.effets?.some(
      (e) =>
        e.type === 'bloc' || e.type === 'blocParCarte' || e.type === 'esquive' || e.type === 'resistance',
    )
  )
    return 'Défense'
  return 'Action'
}

/** Le texte nu d'une ligne : ce qu'un canvas peut peindre. */
export function sansBalises(ligne: string): string {
  return ligne.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ')
}

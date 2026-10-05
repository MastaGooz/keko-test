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
export function lignes(carte: Carte, valeurAPart = false): string[] {
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
        `Infligez <d><b>${carte.degats}</b></d> ${blessures(carte.degats)}${etourdit ? ' et&nbsp;<k><b>étourdissement</b></k>' : ''}`,
      )
  else if (etourdit) l.push(`<k><b>Étourdissement</b></k>`)
  // SES DÉGÂTS SONT VOTRE DÉFENSE : on ne peut pas écrire un chiffre, donc on
  // écrit la RÈGLE. *Une carte dont l'effet dépend de l'état doit dire de quoi
  // il dépend*, pas afficher un zéro qui se lirait comme une carte inutile.
  //
  // ON NE TUTOIE PAS LE JOUEUR, ET ÇA VAUT POUR LES VERBES. Tranché par Keko
  // deux fois : d'abord sur les possessifs (« inflige un nombre de dégâts égal
  // à VOTRE défense »), puis sur les verbes eux-mêmes — « attention tu utilises
  // "tu" dans les cartes : il faut vouvoyer le joueur. "Piochez" "Gagnez" ».
  //
  // *Un verbe nu à l'indicatif se lit comme un impératif tutoyé* — et c'était
  // franchement bancal là où les deux voix se croisaient dans la même phrase :
  // « Gagne esquive jusqu'à VOTRE prochain tour ». **Tous les verbes qui
  // s'adressent au joueur sont donc à la deuxième personne du pluriel** :
  // Infligez, Bloquez, Soignez, Piochez, Gagnez.
  //
  // *Ce qui n'est pas adressé ne bouge pas* : « Coûte 1 PA de moins » parle de
  // la CARTE, « annule l'action en cours » parle du mot-clé, et « les ennemis
  // qui vous attaquent subissent » a déjà son sujet.
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
    l.push(`Infligez <d><b>1</b></d> blessure pour chaque <b>blocage</b> que vous avez`)
  for (const e of carte.effets ?? []) {
    // La condition sur une seconde ligne, en retrait : « ce tour » et « l'or
    // est perdu » coupaient au milieu quand ils suivaient sur la même ligne.
    // ON NE REDIT PAS « CE TOUR SEULEMENT ». Tranché par Keko. *Le bloc tombe
    // à la fin de chaque tour, sans exception* — c'est une règle du jeu, pas
    // une clause de cette carte-ci, et une condition écrite sur toutes les
    // cartes de défense cesse d'être une condition.
    if (e.type === 'bloc') l.push(`Bloquez <p><b>${e.montant}</b></p> ${blessures(e.montant)}`)
    // L'ESQUIVE DIT SA DURÉE, comme la riposte : *c'est une clause de cette
    // carte-ci, pas une règle du jeu* — sans elle on la croirait permanente.
        // « VOTRE » DESCEND AVEC CE QU'IL INTRODUIT. Keko : « on peut mettre le
    // "votre" en dessous ». *Un possessif seul au bout d'une ligne annonce un
    // groupe qui n'arrive qu'à la suivante* — même raison que le « et » de la
    // Projection, et l'insécable fait le lien.
    if (e.type === 'esquive') l.push(`Gagnez <k><b>esquive</b></k> jusqu'à votre&nbsp;prochain tour`)
    if (e.type === 'soin') {
      // Un trésor ne soigne qu'en se détruisant : la carte doit dire les deux,
      // le gain et le prix, sinon elle ment sur ce qu'on joue.
      if (carte.type === 'tresor') {
        // Le mot suit l'affichage : là où la carte ne parle plus d'or, elle
        // dit sa VALEUR. *Une carte ne peut pas perdre un or qu'elle n'a
        // jamais annoncé.*
        const perte = valeurAPart ? 'et sa valeur est perdue' : 'et son or est perdu'
        l.push(`Brûler : soignez <s><b>${e.montant}</b></s> ${blessures(e.montant)}`, `<small>${perte}</small>`)
      }
      else {
        /**
         * **ON SOIGNE DES BLESSURES, PAS DES PV.** Formulation de Keko : « pour
         * la potion on va marquer *soigne N blessures* ».
         *
         * *Le vocabulaire dit la règle* — « PV » est une abréviation de fiche
         * de personnage, « blessure » est ce que le coup a fait. C'est la même
         * raison qui a fait des points d'action plutôt que de l'énergie.
         */
        /**
         * **LE MOT-CLÉ PASSE EN TÊTE, et la phrase le suit.** Keko : « pour les
         * potions on devrait mettre *Consommable : soigne 14 blessures* ».
         *
         * Il vivait sur sa propre ligne, sous l'effet. *Une ligne qui ne porte
         * qu'un mot se lit comme une étiquette collée après coup* — alors que
         * le mot dit ce que la carte EST, donc il ouvre la phrase plutôt que de
         * la clore. Une carte à usages ne l'écrit toujours pas : ses charges
         * sont des pastilles.
         *
         * **ET LA COUPURE EST DÉCLARÉE : on va à la ligne après le `:`.**
         * Tranché par Keko. Le repli la posait où la mesure tombait — « soigne
         * 14 » montait alors avec le mot-clé et « blessures » restait seul en
         * dessous, donc *la coupure tombait au milieu de ce qu'elle annonce.*
         * Le deux-points, lui, EST une coupure : l'énoncé d'un côté, ce qu'il
         * énonce de l'autre.
         *
         * C'est la règle des noms de cases du chargement — *une coupure se
         * déclare, elle ne se déduit pas* — et **le repli à la mesure reste
         * derrière**, chaque ligne étant repliée pour son compte.
         *
         * *L'espace du deux-points reste insécable*, comme le veut la
         * typographie française ; elle ne décide plus de la coupure, mais c'est
         * la bonne espace.
         */
        const exile = carte.usages === undefined && carte.exil === true
        if (exile) l.push('<k><b>Consommable</b></k>&nbsp;:')
        l.push(
          exile
            ? `soignez <s><b>${e.montant}</b></s> ${blessures(e.montant)}`
            : `Soignez <s><b>${e.montant}</b></s> ${blessures(e.montant)}`,
        )
      }
    }
    /**
     * **PIOCHER : le verbe de la Robe, et il se dit en CARTES.**
     *
     * *Pas de teinte* : les trois couleurs disent ce qu'on inflige, ce qu'on
     * encaisse et ce qu'on soigne — piocher n'est aucun des trois. **Une
     * quatrième couleur pour un quatrième fait finirait par n'en distinguer
     * aucun** ; le gras du chiffre suffit.
     */
    if (e.type === 'pioche') {
      l.push(`Piochez <b>${e.montant}</b> carte${e.montant > 1 ? 's' : ''}`)
    }
    // POINTS D'ACTION, ET PAS « ÉNERGIE » : le mot renvoie au TEMPS, et c'est
    // ce que Keko veut dire — *plus une carte coûte, plus l'action est longue
    // et puissante.* Le code garde `energie` partout, c'est un nom interne.
    if (e.type === 'energie') l.push(`Gagnez <b>+${e.montant}</b> points d'action`)
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
    // la règle qui a déjà fait parler toutes les cartes de blessures, et aligné
    // le trésor brûlé sur la potion. Et le possessif dit de QUI est le tour :
    // le joueur en a un, les ennemis frappent entre les deux.
    if (e.type === 'riposte')
      l.push(
        `Jusqu'à votre prochain tour, les ennemis qui vous <b>attaquent</b> subissent <d><b>${e.montant}</b></d> ${blessures(e.montant)}`,
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
    l.push(`Coûte {pa:${pa}} de moins`, `<small>par <b>attaque</b> jouée ce tour</small>`)
  }
  return l
}

/**
 * LE REPLI EN CLAIR, pour tout ce qui ne sait pas dessiner les jetons.
 *
 * Le moteur 3D peint `{pa:1}` en symbole ; le jeu 2D, lui, n'a que du texte,
 * et *un moteur qui ne sait pas montrer une chose ne doit pas cesser de la
 * dire* — la règle déjà tenue par la valeur d'un butin.
 */
export function enClair(ligne: string): string {
  // LES QUATRE BALISES DE COULEUR DISPARAISSENT ICI, elles ne deviennent pas du
  // gras : le DOM n'a qu'un accent par carte, et **le gras est déjà écrit dans
  // le texte** depuis que les deux axes sont séparés. Les convertir mettrait
  // « Inflige » en gras et en accent, alors qu'il n'est que coloré en 3D.
  //
  // **ET CE RETRAIT N'EST PAS UN CONFORT POUR `<s>`** : c'est une vraie balise
  // HTML, celle du texte barré. *Les trois appels du DOM passent par ici* —
  // vérifié — mais un jour où l'un l'oublierait, un chiffre de soin sortirait
  // rayé. C'est le prix d'une balise à une lettre, et il est connu.
  ligne = ligne.replace(/<\/?[kdps]>/g, '')
  return ligne.replace(/\{pa:(\d+)\}/g, '<b>$1</b> PA')
}

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
 * **ON PARLE DE BLESSURES, PLUS DE DÉGÂTS.** Tranché par Keko, à la suite de la
 * Potion : « on peut remplacer dégâts par blessure dans toutes les cartes ».
 *
 * *Le vocabulaire dit la règle* : « dégât » est un mot de système, « blessure »
 * est ce que le coup a fait — et c'est le même mot des deux côtés, puisqu'on
 * les inflige et qu'on les soigne. C'est la raison qui a déjà fait des points
 * d'action plutôt que de l'énergie.
 *
 * **L'accord se fait sur le chiffre** : une carte qui en inflige une seule le
 * dit au singulier, et le Coup de bouclier ne l'écrit plus en dur.
 */
function blessures(n: number): string {
  return n === 1 ? 'blessure' : 'blessures'
}

export const GLOSSAIRE: Record<string, string> = {
  Étourdissement: "annule l'action en cours",
  Consommable: "la carte est détruite quand elle est jouée",
  Esquive: "vous avez 50 % de chance d'éviter la prochaine attaque subie",
}

/** Les mots-clés qu'une carte emploie, pour l'encadré du zoom. */
export function motsCles(carte: Carte): string[] {
  const mots: string[] = []
  if (carte.effets?.some((e) => e.type === 'etourdit') === true) mots.push('Étourdissement')
  if (carte.effets?.some((e) => e.type === 'esquive') === true) mots.push('Esquive')
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
   */
  if (carte.effets?.some((e) => e.type === 'bloc' || e.type === 'esquive')) return 'Défense'
  return 'Action'
}

/** Le texte nu d'une ligne : ce qu'un canvas peut peindre. */
export function sansBalises(ligne: string): string {
  return ligne.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ')
}
